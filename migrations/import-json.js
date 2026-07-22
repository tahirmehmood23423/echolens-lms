'use strict';

/**
 * EchoLens LMS - one-time JSON to Postgres import
 *
 * Reads the existing JSON store (DB_PATH, default ./echolens.json - the
 * same file store.js has always read) and loads every record into the
 * Postgres tables created by migrations/0001_legacy_store_schema.sql,
 * preserving every id exactly as-is so certificates, course codes and
 * registration numbers already handed out stay valid.
 *
 * This script never touches the JSON file - it only reads it. Run it once
 * per environment, after DATABASE_URL is set and `npm run migrate` has
 * created the schema:
 *
 *   npm run migrate
 *   npm run migrate:import
 *
 * Re-running against a database that already has rows is refused unless
 * you pass --force (which truncates the legacy tables first) - this is a
 * one-time move, not a sync, and silently re-importing on top of live
 * Postgres data would be a good way to lose real writes.
 */

const fs = require('fs');
const path = require('path');
const db = require('../db');
const { runMigrations } = require('./run');
const { COLLECTIONS } = require('./collections');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'echolens.json');
const FORCE = process.argv.includes('--force');
const CHUNK_SIZE = 1000;

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

async function tableRowCount(client, table) {
  const { rows } = await client.query(`SELECT count(*)::int AS n FROM ${table}`);
  return rows[0].n;
}

async function importCollection(client, name, records) {
  if (FORCE) await client.query(`TRUNCATE ${name}`);
  let inserted = 0;
  for (const batch of chunk(records, CHUNK_SIZE)) {
    const values = [];
    const params = [];
    batch.forEach((rec, i) => {
      const p = i * 2;
      values.push(`($${p + 1}, $${p + 2})`);
      params.push(rec.id, JSON.stringify(rec));
    });
    if (!values.length) continue;
    await client.query(
      `INSERT INTO ${name} (id, data) VALUES ${values.join(', ')} ON CONFLICT (id) DO NOTHING`,
      params
    );
    inserted += batch.length;
  }
  return inserted;
}

async function main() {
  if (!db.enabled()) {
    console.error('DATABASE_URL is not set - nothing to import into. Set DATABASE_URL and rerun.');
    process.exit(1);
  }
  if (!fs.existsSync(DB_PATH)) {
    console.error(`No JSON store found at ${DB_PATH} (set DB_PATH if it lives elsewhere).`);
    process.exit(1);
  }

  const raw = fs.readFileSync(DB_PATH, 'utf8');
  const json = JSON.parse(raw);

  const pool = db.getPool();
  await runMigrations(pool);

  const client = await pool.connect();
  try {
    // Refuse to import on top of existing rows unless --force is explicit -
    // this is the one guard against accidentally double-importing or
    // clobbering real writes that already landed in Postgres.
    if (!FORCE) {
      const existing = await tableRowCount(client, 'users');
      if (existing > 0) {
        console.error(
          `Postgres already has ${existing} row(s) in "users". Refusing to import without --force ` +
          `(this is a one-time move, not a sync - re-importing on top of live data can lose writes). ` +
          `Pass --force to truncate the legacy tables and re-import from ${DB_PATH}.`
        );
        process.exit(1);
      }
    }

    await client.query('BEGIN');

    const summary = [];
    for (const name of COLLECTIONS) {
      const records = Array.isArray(json[name]) ? json[name] : [];
      const inserted = await importCollection(client, name, records);
      summary.push({ name, jsonCount: records.length, inserted });
    }

    if (FORCE) await client.query('TRUNCATE store_meta');
    await client.query(
      `INSERT INTO store_meta (id, seq, issued_usernames, issued_regnos, settings)
       VALUES (1, $1, $2, $3, $4)
       ON CONFLICT (id) DO UPDATE SET seq = EXCLUDED.seq, issued_usernames = EXCLUDED.issued_usernames,
         issued_regnos = EXCLUDED.issued_regnos, settings = EXCLUDED.settings, updated_at = now()`,
      [
        JSON.stringify(json.seq || {}),
        JSON.stringify(json.issued_usernames || []),
        JSON.stringify(json.issued_regnos || []),
        JSON.stringify(json.settings || {}),
      ]
    );

    await client.query('COMMIT');

    // Verify: every collection's Postgres row count must exactly match the
    // JSON array length. ON CONFLICT DO NOTHING means a duplicate id would
    // silently under-count instead of erroring, so re-check for real.
    let allMatch = true;
    console.log('\nImport summary (JSON records -> Postgres rows now in table):');
    for (const row of summary) {
      const nowInTable = await tableRowCount(client, row.name);
      const ok = nowInTable === row.jsonCount || (nowInTable >= row.jsonCount && !FORCE);
      const mark = nowInTable === row.jsonCount ? 'OK' : 'MISMATCH';
      if (nowInTable !== row.jsonCount) allMatch = false;
      console.log(`  ${row.name.padEnd(28)} json=${row.jsonCount}  postgres=${nowInTable}  ${mark}`);
    }

    if (!allMatch) {
      console.error('\nOne or more collections do not have matching row counts. Investigate before trusting this import.');
      process.exit(1);
    }
    console.log('\nAll collections match. The JSON file at', DB_PATH, 'was not modified - it remains as a backup.');
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

main()
  .then(() => db.end())
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('[import] failed:', err);
    process.exit(1);
  });
