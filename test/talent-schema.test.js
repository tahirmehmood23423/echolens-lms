'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { PGlite } = require('@electric-sql/pglite');
const { runMigrations, runTalentMigrations, TALENT_MIGRATIONS } = require('../migrations/run');

async function fixture(t) {
  const pg = new PGlite();
  t.after(() => pg.close());
  // Normalized tables have no legacy `data` column. Replaying the old LMS
  // migrations here would fail or change these existing records.
  await pg.exec(`
    CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT NOT NULL);
    CREATE TABLE certificates (id INTEGER PRIMARY KEY, serial TEXT NOT NULL);
    INSERT INTO users VALUES (1, 'Synthetic learner');
    INSERT INTO certificates VALUES (1, 'EL-TEST-EXISTING');
  `);
  let releases = 0;
  const client = {
    async query(sql, params) {
      return params ? pg.query(sql, params) : (await pg.exec(sql)).at(-1);
    },
    release() { releases++; },
  };
  return { pg, client, pool: { connect: async () => client }, releases: () => releases };
}

test('Talent schema installs on normalized LMS tables and preserves records across restarts', async (t) => {
  const { pg, pool, releases } = await fixture(t);
  assert.deepEqual(await runTalentMigrations(pool), TALENT_MIGRATIONS);
  await pg.query("INSERT INTO talent_profiles (user_id, handle, headline) VALUES (1, 'synthetic', 'Python learner')");
  const { rows: [skill] } = await pg.query("SELECT id FROM skills WHERE name = 'Python'");
  await pg.query('INSERT INTO student_skills (user_id, skill_id) VALUES (1, $1)', [skill.id]);
  const { rows: [before] } = await pg.query('SELECT * FROM talent_profiles WHERE user_id = 1');
  assert.deepEqual(before.skill_ids, [skill.id], 'the skill synchronization trigger is installed');
  assert.equal((await pg.query("SELECT handle FROM talent_profiles WHERE search_vector @@ plainto_tsquery('english', 'Python')")).rows.length, 1);
  assert.deepEqual(await runTalentMigrations(pool), []);
  assert.deepEqual((await pg.query('SELECT * FROM talent_profiles WHERE user_id = 1')).rows, [before]);
  assert.deepEqual((await pg.query('SELECT * FROM users')).rows, [{ id: 1, name: 'Synthetic learner' }]);
  assert.deepEqual((await pg.query('SELECT * FROM certificates')).rows, [{ id: 1, serial: 'EL-TEST-EXISTING' }]);
  assert.deepEqual((await pg.query('SELECT filename FROM schema_migrations ORDER BY filename')).rows.map(r => r.filename), TALENT_MIGRATIONS);
  for (const table of ['projects', 'saved_searches', 'contact_requests', 'contact_reveals', 'shortlists', 'shortlist_candidates', 'messages', 'blocked_companies', 'reports']) {
    await pg.query(`SELECT * FROM ${table} LIMIT 1`);
  }
  assert.equal(releases(), 2);
});

test('a partial Talent installation upgrades without replacing existing profiles', async (t) => {
  const { pg, pool } = await fixture(t);
  await runMigrations(pool, { only: [TALENT_MIGRATIONS[0]] });
  await pg.query("INSERT INTO talent_profiles (user_id, handle) VALUES (1, 'preserved')");
  await pg.query("INSERT INTO student_skills (user_id, skill_id) SELECT 1, id FROM skills WHERE name = 'Python'");
  assert.deepEqual(await runTalentMigrations(pool), TALENT_MIGRATIONS.slice(1));
  const { rows: [profile] } = await pg.query('SELECT * FROM talent_profiles');
  assert.equal(profile.handle, 'preserved');
  assert.equal(profile.skill_ids.length, 1, 'pre-existing skills are backfilled');
  assert.equal(profile.unpublished_reason, null);
});

test('a failed migration rolls back its schema and can be retried', async (t) => {
  const { pg, pool, client, releases } = await fixture(t);
  const query = client.query.bind(client);
  client.query = async (sql, params) => {
    if (sql.startsWith('INSERT INTO schema_migrations')) throw new Error('synthetic tracking failure');
    return query(sql, params);
  };
  await assert.rejects(runTalentMigrations(pool), /synthetic tracking failure/);
  assert.equal((await pg.query("SELECT to_regclass('talent_profiles') AS name")).rows[0].name, null);
  assert.equal(releases(), 1);
  client.query = query;
  assert.deepEqual(await runTalentMigrations(pool), TALENT_MIGRATIONS);
});

test('changed applied migration checksums fail instead of silently replaying SQL', async (t) => {
  const { pg, pool, releases } = await fixture(t);
  await runTalentMigrations(pool);
  await pg.query("UPDATE schema_migrations SET checksum = 'synthetic-mismatch' WHERE filename = $1", [TALENT_MIGRATIONS[0]]);
  await assert.rejects(runTalentMigrations(pool), /Do not edit applied migrations/);
  assert.equal(releases(), 2);
  assert.equal((await pg.query('SELECT count(*)::int AS n FROM skills')).rows[0].n, 45);
});
