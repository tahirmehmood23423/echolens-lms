'use strict';

/**
 * EchoLens LMS - production database guard
 *
 * Closes the exact mistake made while testing the Showcase Feed: a dev
 * boot inherited DATABASE_URL from .env unnoticed and made a real (read-
 * only, but real) connection to the live production Supabase database.
 * Every path in this codebase that can open a real Postgres connection -
 * db.js's raw `pg` pool and prisma-client.js's Prisma adapter, which build
 * their own connections independently of each other - calls
 * assertNotProdDbOutsideProd() first. It throws synchronously, before any
 * socket opens, whenever DATABASE_URL/DIRECT_URL points at the production
 * database and NODE_ENV says this isn't the production process.
 *
 * Matched on the Supabase project ref (the `postgres.<ref>` username
 * segment), not the hostname: Supabase's pooler hostnames
 * (aws-0-<region>.pooler.supabase.com) are shared across every project in
 * that region, including a legitimate scratch database created for local
 * testing - only the project ref actually identifies THIS database.
 * Overridable via PROD_DB_MARKER so a future migration to a new Supabase
 * project doesn't need a code change here.
 */
const PROD_DB_MARKER = process.env.PROD_DB_MARKER || 'kcklvaxvqwkllnsbenxp';

function assertNotProdDbOutsideProd() {
  if (process.env.NODE_ENV === 'production') return;
  const urls = [process.env.DATABASE_URL, process.env.DIRECT_URL].filter(Boolean);
  if (urls.some((u) => u.includes(PROD_DB_MARKER))) {
    throw new Error(
      'Refusing to connect: DATABASE_URL/DIRECT_URL points at the live production Supabase database, but NODE_ENV is not "production". ' +
      'A dev/local/test process must never read or write live production data - point these at a scratch database, or leave them unset to use the JSON file store.'
    );
  }
}

module.exports = { assertNotProdDbOutsideProd, PROD_DB_MARKER };
