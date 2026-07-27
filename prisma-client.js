'use strict';

/**
 * EchoLens LMS — long-lived Prisma Client for the running app
 *
 * Separate from migrations/import-prisma.js's own PrismaClient: that one is
 * a one-shot script that connects, does its work, and calls $disconnect().
 * This one is required once by store.js and lives for the process's entire
 * lifetime, backing every live read/write once store.js's Postgres path is
 * enabled.
 *
 * Prisma 7 pattern: the client has no default engine anymore and requires an
 * explicit driver adapter (@prisma/adapter-pg) - `new PrismaClient()` with no
 * arguments throws "A driver adapter is required to connect to your
 * database." This module is the one place that adapter gets constructed.
 *
 * Only instantiated when actually needed (see getPrismaClient() below) -
 * requiring this file must stay side-effect-free when DATABASE_URL isn't
 * set, so JSON-file-only local dev (`npm start` with no DATABASE_URL) never
 * touches @prisma/adapter-pg at all.
 */

// Pin the process timezone to UTC once, for the app's entire lifetime, before
// any Date math happens anywhere. The `pg` driver (which @prisma/adapter-pg
// wraps) formats a JS Date's wall-clock string using the PROCESS's local
// timezone when writing a "timestamp without time zone" column (what every
// DateTime field in schema.prisma maps to) - confirmed by direct testing
// during the one-time import (see migrations/import-prisma.js's header).
// Setting this here, not just in the one-shot import script, means every
// live write from the running app is equally immune to whatever timezone
// the Render container happens to run in.
if (!process.env.TZ) process.env.TZ = 'UTC';

let client = null;

// Perf diagnostics only (see store.js's persistAllToPostgresNormalized and
// server.js's request-timing middleware, both gated the same way): a plain
// counter of every round trip Prisma actually sends to Postgres, always
// incremented (negligible cost - one event + one integer add per query,
// no behaviour change), so callers can measure "queries per request"
// without needing PERF_DEBUG on. Only the verbose per-query console.log
// below is gated behind PERF_DEBUG, since that one does add log volume.
let queryCount = 0;
function getQueryCount() { return queryCount; }

/** Lazily constructs (once) and returns the shared PrismaClient. Throws if DATABASE_URL isn't set - callers must check db.enabled() first. */
function getPrismaClient() {
  if (client) return client;
  if (!process.env.DATABASE_URL) {
    throw new Error('getPrismaClient() called without DATABASE_URL set - callers must check db.enabled() first.');
  }
  // Defense in depth: db.js's own require-time check is the primary guard
  // (store.js always requires db.js first), but this module builds its
  // Prisma connection independently of db.js's pg pool - checked again
  // here so a connection can never be attempted through this path either.
  require('./db-guard').assertNotProdDbOutsideProd();
  // Required lazily, not at module top-level: keeps @prisma/adapter-pg out
  // of the require graph entirely for JSON-file-only local dev.
  const { PrismaPg } = require('@prisma/adapter-pg');
  const { PrismaClient } = require('@prisma/client');
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.PGSSLMODE === 'disable' ? false : { rejectUnauthorized: false },
  });
  client = new PrismaClient({ adapter, log: [{ emit: 'event', level: 'query' }] });
  client.$on('query', (e) => {
    queryCount++;
    if (process.env.PERF_DEBUG) console.log(`[prisma] ${e.duration}ms  ${e.query.slice(0, 140)}`);
  });
  return client;
}

module.exports = { getPrismaClient, getQueryCount };
