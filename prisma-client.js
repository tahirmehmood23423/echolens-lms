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

/** Lazily constructs (once) and returns the shared PrismaClient. Throws if DATABASE_URL isn't set - callers must check db.enabled() first. */
function getPrismaClient() {
  if (client) return client;
  if (!process.env.DATABASE_URL) {
    throw new Error('getPrismaClient() called without DATABASE_URL set - callers must check db.enabled() first.');
  }
  // Required lazily, not at module top-level: keeps @prisma/adapter-pg out
  // of the require graph entirely for JSON-file-only local dev.
  const { PrismaPg } = require('@prisma/adapter-pg');
  const { PrismaClient } = require('@prisma/client');
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.PGSSLMODE === 'disable' ? false : { rejectUnauthorized: false },
  });
  client = new PrismaClient({ adapter });
  return client;
}

module.exports = { getPrismaClient };
