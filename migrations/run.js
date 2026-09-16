'use strict';

/**
 * EchoLens LMS - migration runner
 *
 * Idempotent: safe to run every time the app boots (see store.js's
 * initFromPostgres). Tracks applied migrations in `schema_migrations`;
 * anything already recorded there is skipped. Each pending file runs
 * inside its own transaction, and files run in filename order (numeric
 * prefix), so `0001_...sql` always runs before `0002_...sql`.
 *
 * Usage: `node migrations/run.js` (also exposed as `npm run migrate`).
 * Use --talent for the supplemental Talent tables on a Prisma deployment.
 * The full legacy migration set is not compatible with normalized tables.
 * Server startup awaits runTalentMigrations(pool) before accepting requests.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const MIGRATIONS_DIR = __dirname;
// These relational tables are still queried through pg, not Prisma. Never
// replay the legacy JSONB LMS migrations against the normalized Prisma schema.
const TALENT_MIGRATIONS = Object.freeze([
  '0003_talent_profiles.sql',
  '0004_talent_search.sql',
  '0005_talent_hiring.sql',
  '0006_talent_admin_safety.sql',
]);

function pendingFiles() {
  return fs.readdirSync(MIGRATIONS_DIR)
    .filter((f) => /^\d+.*\.sql$/i.test(f))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
}

async function ensureTrackingTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename TEXT PRIMARY KEY,
      checksum TEXT NOT NULL,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
}

/** Runs every migration in migrations/ that isn't yet recorded as applied. Returns the list of filenames it actually ran. */
async function runMigrations(pool, { only } = {}) {
  const available = pendingFiles();
  if (only && only.some((filename) => !available.includes(filename))) {
    throw new Error('Unknown migration requested.');
  }
  const files = only ? available.filter((filename) => only.includes(filename)) : available;
  const client = await pool.connect();
  const applied = [];
  try {
    for (const filename of files) {
      const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, filename), 'utf8');
      const checksum = crypto.createHash('sha256').update(sql).digest('hex');
      await client.query('BEGIN');
      try {
        // Serialize concurrent boots. A transaction lock also works through
        // transaction-mode poolers and is released on commit or rollback.
        await client.query('SELECT pg_advisory_xact_lock(170101, 1)');
        await ensureTrackingTable(client);
        const { rows } = await client.query('SELECT checksum FROM schema_migrations WHERE filename = $1', [filename]);
        if (rows.length && rows[0].checksum !== checksum) {
          // A migration that already ran must never be edited in place -
          // that's how two environments end up with different schemas
          // while schema_migrations claims they're both current. Ship a
          // new numbered file for any further change instead.
          throw new Error(
            `Migration ${filename} has already been applied but its contents changed on disk. ` +
            `Do not edit applied migrations - add a new numbered migration instead.`
          );
        }
        if (rows.length) {
          await client.query('COMMIT');
          continue;
        }
        console.log(`[migrate] applying ${filename}`);
        await client.query(sql);
        await client.query(
          'INSERT INTO schema_migrations (filename, checksum) VALUES ($1, $2)',
          [filename, checksum]
        );
        await client.query('COMMIT');
        applied.push(filename);
      } catch (err) {
        try { await client.query('ROLLBACK'); } catch { /* preserve the original failure */ }
        throw new Error(`Migration ${filename} failed: ${err.message}`);
      }
    }
  } finally {
    client.release();
  }
  return applied;
}

function runTalentMigrations(pool) {
  return runMigrations(pool, { only: TALENT_MIGRATIONS });
}

module.exports = { runMigrations, runTalentMigrations, pendingFiles, TALENT_MIGRATIONS };

if (require.main === module) {
  (async () => {
    const db = require('../db');
    if (!db.enabled()) {
      console.error('DATABASE_URL is not set - nothing to migrate. Set DATABASE_URL and rerun.');
      process.exit(1);
    }
    try {
      const applied = await (process.argv.includes('--talent') ? runTalentMigrations : runMigrations)(db.getPool());
      console.log(applied.length ? `[migrate] applied ${applied.length} migration(s): ${applied.join(', ')}` : '[migrate] up to date, nothing to apply');
      await db.end();
      process.exit(0);
    } catch (err) {
      console.error('[migrate] failed:', err.message);
      process.exit(1);
    }
  })();
}
