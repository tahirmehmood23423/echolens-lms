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
 * Can also be required and awaited (`require('./migrations/run')(pool)`)
 * so the server can run pending migrations on boot without shelling out.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const MIGRATIONS_DIR = __dirname;

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
async function runMigrations(pool) {
  const client = await pool.connect();
  const applied = [];
  try {
    await ensureTrackingTable(client);
    const { rows } = await client.query('SELECT filename, checksum FROM schema_migrations');
    const doneChecksums = new Map(rows.map((r) => [r.filename, r.checksum]));

    for (const filename of pendingFiles()) {
      const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, filename), 'utf8');
      const checksum = crypto.createHash('sha256').update(sql).digest('hex');

      if (doneChecksums.has(filename)) {
        if (doneChecksums.get(filename) !== checksum) {
          // A migration that already ran must never be edited in place -
          // that's how two environments end up with different schemas
          // while schema_migrations claims they're both current. Ship a
          // new numbered file for any further change instead.
          throw new Error(
            `Migration ${filename} has already been applied but its contents changed on disk. ` +
            `Do not edit applied migrations - add a new numbered migration instead.`
          );
        }
        continue;
      }

      console.log(`[migrate] applying ${filename}`);
      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query(
          'INSERT INTO schema_migrations (filename, checksum) VALUES ($1, $2)',
          [filename, checksum]
        );
        await client.query('COMMIT');
        applied.push(filename);
      } catch (err) {
        await client.query('ROLLBACK');
        throw new Error(`Migration ${filename} failed: ${err.message}`);
      }
    }
  } finally {
    client.release();
  }
  return applied;
}

module.exports = { runMigrations, pendingFiles };

if (require.main === module) {
  (async () => {
    const db = require('../db');
    if (!db.enabled()) {
      console.error('DATABASE_URL is not set - nothing to migrate. Set DATABASE_URL and rerun.');
      process.exit(1);
    }
    try {
      const applied = await runMigrations(db.getPool());
      console.log(applied.length ? `[migrate] applied ${applied.length} migration(s): ${applied.join(', ')}` : '[migrate] up to date, nothing to apply');
      await db.end();
      process.exit(0);
    } catch (err) {
      console.error('[migrate] failed:', err.message);
      process.exit(1);
    }
  })();
}
