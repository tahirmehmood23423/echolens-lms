'use strict';

/**
 * EchoLens LMS - Postgres connection
 *
 * A thin wrapper around a `pg` pool. This module has no opinion on schema;
 * it just gives store.js and the migration scripts a shared, parameterized
 * way to talk to Postgres.
 *
 * DATABASE_URL is optional on purpose: if it is not set, store.js falls
 * back to the legacy JSON file store untouched (see store.js for details).
 * That keeps local development working with zero setup, while Render (or
 * any environment that sets DATABASE_URL) runs on Postgres.
 */

const { Pool } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL || '';

// Render's managed Postgres (and most hosted Postgres) requires SSL but
// presents a certificate chain that Node's default trust store rejects
// without this. PGSSLMODE=disable (e.g. for a local/dev database) skips it.
const ssl = DATABASE_URL && process.env.PGSSLMODE !== 'disable'
  ? { rejectUnauthorized: false }
  : false;

let pool = null;

function enabled() {
  return !!DATABASE_URL;
}

function getPool() {
  if (!DATABASE_URL) {
    throw new Error('DATABASE_URL is not set - db.getPool() should not be called in JSON-file mode.');
  }
  if (!pool) {
    pool = new Pool({ connectionString: DATABASE_URL, ssl });
    pool.on('error', (err) => {
      // A background/idle client error must not crash the process - it
      // would take down the whole LMS for something Postgres will usually
      // recover from on the next query.
      console.error('Postgres pool error (idle client):', err.message);
    });
  }
  return pool;
}

function query(text, params) {
  return getPool().query(text, params);
}

/** Runs `fn(client)` inside a single transaction, committing on success and rolling back on any throw. */
async function withTransaction(fn) {
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    try { await client.query('ROLLBACK'); } catch { /* connection may already be dead */ }
    throw err;
  } finally {
    client.release();
  }
}

async function end() {
  if (pool) { await pool.end(); pool = null; }
}

module.exports = { enabled, getPool, query, withTransaction, end, DATABASE_URL };
