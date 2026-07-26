'use strict';

// Pin the process timezone to UTC before any Date math runs. The `pg`
// driver formats a JS Date's wall-clock string using the PROCESS's local
// timezone when writing a "timestamp without time zone" column (what every
// DateTime field here maps to) — left unset, the now()-based UTC instants
// this script builds (see isoFromNowString below) would land on a
// different wall-clock value depending on what timezone the machine
// running this script happens to be in. Setting this explicitly makes the
// import byte-for-byte reproducible whether it runs on Render (UTC by
// default), a dev laptop in another timezone, or anywhere else.
process.env.TZ = 'UTC';

/**
 * EchoLens LMS — one-time JSON → Postgres import (via Prisma Client)
 *
 * Copies every record in the JSON file store (echolens.json) into the real,
 * normalized Postgres database Prisma now owns (schema.prisma / the 57
 * tables created by `prisma migrate deploy`). This is the PRODUCTION import
 * — unlike migrations/import-normalized.js (a design-validation script that
 * refuses to touch anything but a throwaway staging database), this script
 * is meant to be run exactly once, for real, against DATABASE_URL.
 *
 * MUST RUN ON RENDER, VIA SHELL (NOT a one-off Job): Supabase is only
 * reachable from Render's network, not a local dev machine, so this reads
 * DATABASE_URL from the environment (same variable the app itself uses)
 * rather than taking a connection string on the command line. The JSON
 * source file also only exists on the web service's persistent Disk — and
 * Render one-off Jobs run on separate compute with NO access to a
 * service's Disk (confirmed in Render's docs: "You can't access a
 * service's disk from a one-off job you run for the service"). Use the
 * Render Shell instead (Dashboard -> service -> Shell tab, or `render
 * ssh`) — it connects into the actual running instance: same container,
 * same Disk mount, same env vars. See the usage note at the bottom of this
 * file.
 *
 * SANITY FLOOR: aborts immediately (before touching Postgres at all) if
 * the JSON file has fewer than MIN_EXPECTED_USERS users — guards against
 * accidentally pointing --db-path at a stale/dev fixture instead of the
 * real backup.
 *
 * TOMBSTONES
 *   Some rows reference a user or batch that was later deleted (e.g. a
 *   certificate whose user_id no longer has a matching users row). Postgres
 *   rejects the import outright once a foreign key points at nothing, so
 *   before any dependent table is populated, this script:
 *     1. Walks every FK-bearing field listed in FK_SCANS below across every
 *        collection in the JSON file.
 *     2. Collects every referenced id that ISN'T present in json.users /
 *        json.batches.
 *     3. Inserts one placeholder row per missing id, with
 *        is_deleted_placeholder = true and otherwise-minimal values.
 *   This is computed dynamically (not hardcoded to specific ids) so it does
 *   the right thing regardless of exactly which ids are missing in the real
 *   backup — for the known-good backup this produces tombstones for users
 *   5, 8, 21, 25, 27, 30, 31, 42 and batch 1, matching what a certificate
 *   (user 5), 13 graded_by references (user 8), and 12 quest rows (batch 1)
 *   actually need.
 *
 * ORDER
 *   Collections are inserted in FK-safe order (see COLLECTIONS below):
 *   courses/companies -> tombstones -> users -> batches -> enrollments ->
 *   quests -> submissions -> gems -> certificates -> everything else.
 *   Every table is inserted only after every table it references.
 *
 * IDS
 *   Every row keeps its original integer id (certificates and file paths
 *   reference these). Nothing is auto-generated. Sequences are reset with
 *   setval() after the import so the NEXT auto-generated id starts above
 *   whatever was imported.
 *
 * DATES
 *   now()-produced fields ("YYYY-MM-DD HH:MM:SS", a UTC instant with no
 *   offset marker) are converted to real Date objects by treating them as
 *   UTC. today()/date-only fields ("YYYY-MM-DD") and other free-text date
 *   strings (deadlines, due dates) are left as plain strings, matching their
 *   String columns in schema.prisma. Two Event fields (starts_at/ends_at)
 *   are a raw <input type="datetime-local"> string with no offset marker;
 *   since no timezone convention for it exists elsewhere in the app, this
 *   import explicitly treats it as Pakistan Standard Time, UTC+05:00 (see
 *   LOCAL_DATETIME_OFFSET_MINUTES in ../schema-map.js) rather than the host
 *   machine's own timezone, which would silently vary the result by where
 *   this script happens to run.
 *
 * IDEMPOTENCY
 *   Every insert uses Prisma's `skipDuplicates: true`, which compiles to
 *   `ON CONFLICT (id) DO NOTHING` — re-running this script (e.g. after a
 *   partial failure, or after wiping and re-migrating the database) skips
 *   whatever's already there instead of erroring or duplicating. The
 *   registries (seq/settings) use upsert so a re-run refreshes them to
 *   match the JSON file rather than silently keeping stale values.
 *
 * FAILS LOUDLY ON
 *   - An unrecognized top-level key in the JSON file with real data in it
 *     (a collection this script doesn't know about yet).
 *   - A duplicate id within a single source collection.
 *   - A date string that doesn't parse (surfaced before it becomes a
 *     silently-wrong "Invalid Date" row).
 *   - A row-count mismatch between the JSON file and Postgres after import.
 *   - Any Postgres constraint violation (foreign key, unique, not-null) —
 *     these are never caught/skipped, they abort the whole transaction.
 *   - Fewer than MIN_EXPECTED_USERS (default 50) users in the source file.
 *
 * USAGE (from a Render Shell session — see the file-header note above on
 * why it can't be a one-off Job; DATABASE_URL is already set in the
 * service's environment, so nothing extra needs passing for that part):
 *   node migrations/import-prisma.js --db-path=/data/echolens.json
 *
 * --db-path defaults to the DB_PATH env var, then ./echolens.json next to
 * this repo (same convention as store.js) — pass it explicitly whenever
 * the real file isn't at the default location, e.g. on a mounted Disk.
 */

const fs = require('fs');
const path = require('path');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');
const {
  COLLECTIONS, FRONT_LOADED_KEYS, Prisma,
  toCamel, isTimestampColumn, isLocalDatetimeColumn, jsonColumnInfo,
  isoFromNowString, localDatetimeStringToDate, assertValidDate,
} = require('../schema-map');

const dbPathArg = process.argv.find((a) => a.startsWith('--db-path='));
const DB_PATH = dbPathArg ? dbPathArg.slice('--db-path='.length) : (process.env.DB_PATH || path.join(__dirname, '..', 'echolens.json'));
const DATABASE_URL = process.env.DATABASE_URL;
const ANCHOR_COURSE_ID = -1; // placeholder course tombstone batches point at; chosen not to collide with any real course id
// Sanity floor against pointing this at the wrong file (e.g. the gitignored
// repo-root echolens.json, which is a stale ~4-user dev fixture, not the
// real backup). The real dataset has 78 users; 50 gives comfortable margin
// below that while still being well above any dev/test fixture.
const MIN_EXPECTED_USERS = Number(process.env.MIN_EXPECTED_USERS) || 50;

function log(msg) { console.log(`[import-prisma] ${msg}`); }

if (!DATABASE_URL) {
  console.error('[import-prisma] DATABASE_URL is not set. This script must run where the app runs (e.g. a Render one-off Job) so it can read the same DATABASE_URL the service uses.');
  process.exit(1);
}
if (!fs.existsSync(DB_PATH)) {
  console.error(`[import-prisma] No JSON store found at ${DB_PATH} (pass --db-path=... or set DB_PATH).`);
  process.exit(1);
}

// COLLECTIONS, FRONT_LOADED_KEYS, JSON_COLUMNS_BY_TABLE, TIMESTAMP_COLUMNS,
// TIMESTAMP_COLUMN_EXCLUSIONS_BY_TABLE, and LOCAL_DATETIME_COLUMNS_BY_TABLE
// now live in ../schema-map.js (shared with store.js's live read/write path
// - see that file's header for why this needed to become a shared module).

/* ---------------------------------------------------------------------- */
/* FK fields that must resolve to a real users.id / batches.id, else the  */
/* referenced id gets a tombstone row.                                    */
/* ---------------------------------------------------------------------- */
const FK_SCANS = [
  // [collectionKey, column, kind ('user'|'batch')]
  ['enrollments', 'user_id', 'user'], ['enrollments', 'batch_id', 'batch'],
  ['sessions', 'batch_id', 'batch'],
  ['live_classes', 'batch_id', 'batch'],
  ['quests', 'batch_id', 'batch'],
  ['quest_submissions', 'user_id', 'user'], ['quest_submissions', 'graded_by', 'user'],
  ['open_submissions', 'user_id', 'user'],
  ['task_files', 'by', 'user'],
  ['gem_events', 'user_id', 'user'], ['gem_events', 'batch_id', 'batch'],
  ['certificates', 'user_id', 'user'], ['certificates', 'batch_id', 'batch'],
  ['attendance', 'user_id', 'user'],
  ['course_messages', 'batch_id', 'batch'], ['course_messages', 'user_id', 'user'],
  ['chat_reads', 'user_id', 'user'], ['chat_reads', 'batch_id', 'batch'],
  ['announcements', 'batch_id', 'batch'],
  ['ai_reports', 'user_id', 'user'], ['ai_reports', 'batch_id', 'batch'],
  ['event_entries', 'user_id', 'user'],
  ['event_submissions', 'user_id', 'user'],
  ['event_comments', 'user_id', 'user'],
  ['leads', 'user_id', 'user'],
  ['staff_records', 'user_id', 'user'],
  ['department_members', 'user_id', 'user'],
  ['ambassadors', 'user_id', 'user'],
  ['ambassador_gem_events', 'batch_id', 'batch'],
  ['job_comments', 'user_id', 'user'],
  ['lessons', 'batch_id', 'batch'],
  ['assignments', 'batch_id', 'batch'],
  ['submissions', 'user_id', 'user'],
  ['challenge_submissions', 'user_id', 'user'],
  ['quizzes', 'batch_id', 'batch'],
  ['quiz_attempts', 'user_id', 'user'],
  ['contracts', 'user_id', 'user'],
];

function buildRow(table, columns, rec, idx, collKey) {
  const row = {};
  for (const col of columns) {
    const raw = rec[col];
    if (raw === undefined) continue; // omit -> let Prisma apply the schema default / NULL
    const field = toCamel(col);
    const jsonInfo = jsonColumnInfo(table, col);
    if (jsonInfo) {
      row[field] = raw === null ? (jsonInfo.nullable ? Prisma.DbNull : Prisma.JsonNull) : raw;
    } else if (isLocalDatetimeColumn(table, col)) {
      row[field] = raw == null ? null : assertValidDate(localDatetimeStringToDate(raw), `${collKey}[${idx}].${col}="${raw}"`);
    } else if (isTimestampColumn(table, col) && raw != null) {
      row[field] = assertValidDate(isoFromNowString(raw), `${collKey}[${idx}].${col}="${raw}"`);
    } else {
      row[field] = raw;
    }
  }
  return row;
}

function assertNoDuplicateIds(collKey, records) {
  const seen = new Set();
  for (const r of records) {
    if (seen.has(r.id)) {
      throw new Error(`Duplicate id ${r.id} within source collection "${collKey}" in ${DB_PATH} - refusing to import ambiguous data.`);
    }
    seen.add(r.id);
  }
}

async function insertCollection(tx, model, table, columns, records, collKey) {
  if (!records.length) return { inserted: 0, skipped: 0 };
  assertNoDuplicateIds(collKey, records);
  const rows = records.map((r, i) => buildRow(table, columns, r, i, collKey));
  const result = await tx[model].createMany({ data: rows, skipDuplicates: true });
  return { inserted: result.count, skipped: records.length - result.count };
}

/** Scans every FK_SCANS entry, returns { userIdsNeeded: Set, batchIdsNeeded: Set } of ids referenced but not present in json.users/json.batches. */
function findDanglingIds(json) {
  const realUserIds = new Set((json.users || []).map((u) => u.id));
  const realBatchIds = new Set((json.batches || []).map((b) => b.id));
  const userIdsNeeded = new Set();
  const batchIdsNeeded = new Set();
  for (const [collKey, col, kind] of FK_SCANS) {
    const rows = Array.isArray(json[collKey]) ? json[collKey] : [];
    for (const r of rows) {
      const v = r[col];
      if (v == null) continue;
      const id = Number(v);
      if (Number.isNaN(id)) continue; // e.g. event_submissions.graded_by can be the string 'ai' — not a user id
      if (kind === 'user' && !realUserIds.has(id)) userIdsNeeded.add(id);
      if (kind === 'batch' && !realBatchIds.has(id)) batchIdsNeeded.add(id);
    }
  }
  return { userIdsNeeded, batchIdsNeeded };
}

function tombstoneUser(id) {
  return {
    id, name: `[deleted user ${id}]`, role: 'deleted', username: `__deleted_user_${id}__`,
    email: null, regNo: null, passwordHash: null, profile: {}, streak: 0, bestStreak: 0,
    lastActive: null, createdAt: new Date(0), onboardingComplete: true, avatar: null,
    signature: null, googleSub: null, isDeletedPlaceholder: true,
    companyId: null, designation: null, city: null, hiringNote: null, status: null, statusReason: null,
    overrideRequested: false, overrideReason: null, approvedBy: null, approvedAt: null,
  };
}

function tombstoneBatch(id) {
  return {
    id, courseId: ANCHOR_COURSE_ID, code: `__DELETED_BATCH_${id}__`, name: `[deleted batch ${id}]`,
    startDate: '1970-01-01', status: 'deleted', instructorIds: [], createdAt: new Date(0), isDeletedPlaceholder: true,
  };
}

async function importRegistries(tx, json) {
  const seqEntries = Object.entries(json.seq || {});
  for (const [name, value] of seqEntries) {
    await tx.seq.upsert({ where: { name }, create: { name, value }, update: { value } });
  }
  const issuedUsernames = (json.issued_usernames || []).map(String);
  if (issuedUsernames.length) {
    await tx.issuedUsername.createMany({ data: issuedUsernames.map((value) => ({ value })), skipDuplicates: true });
  }
  const issuedRegnos = (json.issued_regnos || []).map(String);
  if (issuedRegnos.length) {
    await tx.issuedRegno.createMany({ data: issuedRegnos.map((value) => ({ value })), skipDuplicates: true });
  }
  const settingsEntries = Object.entries(json.settings || {});
  for (const [key, value] of settingsEntries) {
    // Setting.value is `Json` (NOT nullable) - a null source value must become
    // Prisma.JsonNull (the JSON literal null), not Prisma.DbNull (a real SQL
    // NULL), which the NOT NULL constraint would reject.
    const v = value === null ? Prisma.JsonNull : value;
    await tx.setting.upsert({ where: { key }, create: { key, value: v }, update: { value: v } });
  }
  log(`registries: ${seqEntries.length} seq counter(s), ${issuedUsernames.length} issued username(s), ${issuedRegnos.length} issued reg no(s), ${settingsEntries.length} settings key(s)`);
}

async function resetSequences(prisma) {
  log('Resetting sequences to MAX(id) for every table...');
  const tables = [...new Set(COLLECTIONS.map((c) => c[1]))];
  for (const table of tables) {
    const seqRows = await prisma.$queryRawUnsafe(`SELECT pg_get_serial_sequence('${table}', 'id') AS seq`);
    const seqName = seqRows[0] && seqRows[0].seq;
    if (!seqName) continue; // table has no serial "id" (shouldn't happen here, but don't assume)
    await prisma.$executeRawUnsafe(
      `SELECT setval($1, GREATEST((SELECT COALESCE(MAX(id), 0) FROM ${table}), 1), (SELECT COUNT(*) FROM ${table}) > 0)`,
      seqName
    );
  }
  log('Sequences reset.');
}

function assertKnownTopLevelKeys(json) {
  const known = new Set([...COLLECTIONS.map((c) => c[0]), 'seq', 'settings', 'issued_usernames', 'issued_regnos']);
  for (const key of Object.keys(json)) {
    if (known.has(key)) continue;
    const v = json[key];
    const hasData = Array.isArray(v) ? v.length > 0 : (v && typeof v === 'object' ? Object.keys(v).length > 0 : v != null);
    if (hasData) {
      throw new Error(`Unrecognized top-level key "${key}" with data in ${DB_PATH} - this script doesn't know how to import it yet. Add it to COLLECTIONS in migrations/import-prisma.js rather than silently dropping this data.`);
    }
  }
}

async function main() {
  log(`Reading JSON store from ${DB_PATH}`);
  const json = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));

  const userCount = Array.isArray(json.users) ? json.users.length : 0;
  if (userCount < MIN_EXPECTED_USERS) {
    throw new Error(
      `Refusing to import: only ${userCount} user(s) found in ${DB_PATH} (expected at least ${MIN_EXPECTED_USERS}) - wrong JSON file? ` +
      `This guards against silently importing a stale/dev fixture instead of the real backup. Pass --db-path=... to point at the correct ` +
      `file, or set MIN_EXPECTED_USERS to override this floor if ${userCount} is genuinely correct.`
    );
  }
  log(`Sanity check passed: ${userCount} users found (>= ${MIN_EXPECTED_USERS} floor).`);

  assertKnownTopLevelKeys(json);

  const adapter = new PrismaPg({
    connectionString: DATABASE_URL,
    ssl: process.env.PGSSLMODE === 'disable' ? false : { rejectUnauthorized: false },
  });
  const prisma = new PrismaClient({ adapter });

  let userIdsNeeded = new Set();
  let batchIdsNeeded = new Set();

  try {
    log('Scanning for dangling foreign-key references (deleted-but-referenced users/batches)...');
    ({ userIdsNeeded, batchIdsNeeded } = findDanglingIds(json));
    if (userIdsNeeded.size) log(`  user tombstones needed: ${[...userIdsNeeded].sort((a, b) => a - b).join(', ')}`);
    if (batchIdsNeeded.size) log(`  batch tombstones needed: ${[...batchIdsNeeded].sort((a, b) => a - b).join(', ')}`);
    if (!userIdsNeeded.size && !batchIdsNeeded.size) log('  none found - every FK in this dataset resolves to a real row.');

    await prisma.$transaction(async (tx) => {
      const coursesEntry = COLLECTIONS.find((c) => c[0] === 'courses');
      const rCourses = await insertCollection(tx, coursesEntry[2], coursesEntry[1], coursesEntry[3], json.courses || [], 'courses');
      log(`courses: ${rCourses.inserted} inserted, ${rCourses.skipped} already present (json had ${(json.courses || []).length})`);

      const companiesEntry = COLLECTIONS.find((c) => c[0] === 'companies');
      const rCompanies = await insertCollection(tx, companiesEntry[2], companiesEntry[1], companiesEntry[3], json.companies || [], 'companies');
      log(`companies: ${rCompanies.inserted} inserted, ${rCompanies.skipped} already present (json had ${(json.companies || []).length})`);

      if (batchIdsNeeded.size) {
        await tx.course.createMany({
          data: [{ id: ANCHOR_COURSE_ID, code: '__DELETED_BATCH_ANCHOR__', title: '[placeholder course for deleted-batch tombstones]', createdAt: new Date(0) }],
          skipDuplicates: true,
        });
        log(`  inserted anchor course id=${ANCHOR_COURSE_ID} for tombstone batches to point at`);
      }
      if (userIdsNeeded.size) {
        const rows = [...userIdsNeeded].sort((a, b) => a - b).map(tombstoneUser);
        const r = await tx.user.createMany({ data: rows, skipDuplicates: true });
        log(`  tombstoned ${r.count} deleted-but-referenced user(s): ${[...userIdsNeeded].sort((a, b) => a - b).join(', ')}`);
      }
      if (batchIdsNeeded.size) {
        const rows = [...batchIdsNeeded].sort((a, b) => a - b).map(tombstoneBatch);
        const r = await tx.batch.createMany({ data: rows, skipDuplicates: true });
        log(`  tombstoned ${r.count} deleted-but-referenced batch(es): ${[...batchIdsNeeded].sort((a, b) => a - b).join(', ')}`);
      }

      const usersEntry = COLLECTIONS.find((c) => c[0] === 'users');
      const rUsers = await insertCollection(tx, usersEntry[2], usersEntry[1], usersEntry[3], json.users || [], 'users');
      log(`users: ${rUsers.inserted} inserted, ${rUsers.skipped} already present (json had ${(json.users || []).length}, plus ${userIdsNeeded.size} tombstone(s) above)`);

      const batchesEntry = COLLECTIONS.find((c) => c[0] === 'batches');
      const rBatches = await insertCollection(tx, batchesEntry[2], batchesEntry[1], batchesEntry[3], json.batches || [], 'batches');
      log(`batches: ${rBatches.inserted} inserted, ${rBatches.skipped} already present (json had ${(json.batches || []).length}, plus ${batchIdsNeeded.size} tombstone(s) above)`);

      for (const [key, table, model, columns] of COLLECTIONS) {
        if (FRONT_LOADED_KEYS.has(key)) continue;
        const records = Array.isArray(json[key]) ? json[key] : [];
        const r = await insertCollection(tx, model, table, columns, records, key);
        log(`${table}: ${r.inserted} inserted, ${r.skipped} already present (json had ${records.length})`);
      }

      await importRegistries(tx, json);
    }, { maxWait: 30000, timeout: 10 * 60 * 1000 });

    log('Transaction committed.');

    await resetSequences(prisma);

    log('\nImport summary (JSON records -> Postgres rows now in table):');
    let allOk = true;
    for (const [key, table] of COLLECTIONS) {
      const jsonCount = Array.isArray(json[key]) ? json[key].length : 0;
      const extra = key === 'users' ? userIdsNeeded.size : key === 'batches' ? batchIdsNeeded.size : 0;
      const countRows = await prisma.$queryRawUnsafe(`SELECT count(*)::int AS n FROM ${table}`);
      const now = countRows[0].n;
      const ok = now >= jsonCount + extra;
      if (!ok) allOk = false;
      log(`  ${table.padEnd(28)} json=${jsonCount}${extra ? ` (+${extra} tombstone)` : ''}  postgres=${now}  ${ok ? 'OK' : 'MISMATCH'}`);
    }
    if (!allOk) {
      throw new Error('One or more collections do not have matching row counts after import - investigate before trusting this import.');
    }
    log(`\nAll collections verified. The JSON file at ${DB_PATH} was not modified.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error('[import-prisma] FAILED:', err);
  process.exitCode = 1;
});
