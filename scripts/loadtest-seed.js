'use strict';

/**
 * EchoLens LMS - load test seed (Part A)
 *
 * Generates a synthetic dataset at a configurable scale directly in
 * Postgres via Prisma, for scripts/loadtest-measure.js to boot the app
 * against. Never touches the app's own JSON-file store or HTTP layer -
 * this is data-layer seeding, fast bulk inserts, not a simulation of real
 * user signups.
 *
 * SAFETY (this is destructive, bulk, and must never touch production):
 *   - Refuses to run unless LOADTEST_CONFIRM=1 is set.
 *   - Refuses to run if DATABASE_URL/DIRECT_URL contains the production
 *     Supabase project ref (db-guard.js's own marker) - checked directly,
 *     unconditionally, regardless of NODE_ENV/RENDER. db-guard.js's own
 *     assertNotProdDbOutsideProd() also runs (via requiring ./db), but this
 *     script cannot rely on that alone: NODE_ENV=production + RENDER=true
 *     would legitimately exempt db-guard's check on a real Render box, and
 *     nobody should ever be able to run this seed there, full stop.
 *
 * Usage:
 *   LOADTEST_CONFIRM=1 DATABASE_URL=postgresql://...scratch... \
 *   node scripts/loadtest-seed.js --scale=1000
 */

const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const bcrypt = require('bcryptjs');
const { PROD_DB_MARKER } = require('../db-guard');

function parseArgs() {
  const out = { scale: 1000 };
  for (const arg of process.argv.slice(2)) {
    const m = arg.match(/^--scale=(\d+)$/);
    if (m) out.scale = Number(m[1]);
  }
  return out;
}

function assertSafeToSeed() {
  if (process.env.LOADTEST_CONFIRM !== '1') {
    throw new Error('Refusing to run: set LOADTEST_CONFIRM=1 to confirm this is a scratch database. This script performs bulk inserts and must never run against anything you care about.');
  }
  const urls = [process.env.DATABASE_URL, process.env.DIRECT_URL].filter(Boolean);
  if (!urls.length) throw new Error('DATABASE_URL is not set - point this at a scratch Postgres database.');
  if (urls.some((u) => u.includes(PROD_DB_MARKER))) {
    throw new Error(`Refusing to run: DATABASE_URL/DIRECT_URL matches the production project ref (${PROD_DB_MARKER}). This script never runs against production, no matter what NODE_ENV/RENDER say.`);
  }
}

// --- small deterministic-ish generators (no new dependency for fake data) ---
const FIRST_NAMES = ['Aisha', 'Bilal', 'Hina', 'Usman', 'Sara', 'Ahmed', 'Zara', 'Hassan', 'Mahnoor', 'Ali', 'Fatima', 'Omar', 'Ayesha', 'Bilqis', 'Danish', 'Iqra', 'Kamran', 'Laiba', 'Moiz', 'Noor'];
const LAST_NAMES = ['Khan', 'Ahmed', 'Malik', 'Hussain', 'Raza', 'Iqbal', 'Sheikh', 'Farooq', 'Abbasi', 'Chaudhry'];
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(min, max) { return min + Math.floor(Math.random() * (max - min + 1)); }
function randomName() { return `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`; }
// Spreads timestamps realistically over the last ~90 days rather than a
// single instant - a real signup curve is not a flat line.
function randomPastDate(daysBack = 90) {
  const now = Date.now();
  const skew = Math.pow(Math.random(), 1.5); // biased toward more-recent, like real growth
  return new Date(now - skew * daysBack * 24 * 3600 * 1000);
}
const CODE_WORDS = ['def', 'return', 'for', 'in', 'range', 'if', 'else', 'print', 'import', 'class', 'self', 'while', 'True', 'False', 'None', 'lambda', 'list', 'dict', 'append', 'len'];
function randomCode(targetBytes) {
  const lines = [];
  let bytes = 0;
  while (bytes < targetBytes) {
    const line = Array.from({ length: randInt(3, 12) }, () => pick(CODE_WORDS)).join(' ');
    lines.push(line);
    bytes += line.length + 1;
  }
  return lines.join('\n');
}
// Most submissions are small (1-5KB); a small tail approaches the app's
// real 200,000-char ceiling (server.js rejects anything longer at the
// submit endpoint) - mirrors the brief's "realistic code text sizes" ask.
function submissionCodeSize() {
  const r = Math.random();
  if (r > 0.985) return randInt(150000, 199000); // ~1.5% near the ceiling
  if (r > 0.9) return randInt(5000, 20000); // ~8.5% mid-size
  return randInt(1000, 5000); // the bulk
}

async function chunked(items, size, fn) {
  for (let i = 0; i < items.length; i += size) {
    await fn(items.slice(i, i + size));
  }
}

async function main() {
  assertSafeToSeed();
  const { scale } = parseArgs();
  console.log(`[loadtest-seed] scale=${scale} against ${process.env.DATABASE_URL.replace(/:[^:@]+@/, ':***@')}`);

  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL, ssl: process.env.PGSSLMODE === 'disable' ? false : { rejectUnauthorized: false } });
  const prisma = new PrismaClient({ adapter });

  const t0 = Date.now();
  const passwordHash = bcrypt.hashSync('loadtest-password', 4); // low cost: this is fake data, not a security test

  // --- courses + batches: a small fixed catalogue, scale doesn't grow these ---
  const COURSE_COUNT = 8;
  const courses = [];
  for (let i = 0; i < COURSE_COUNT; i++) {
    courses.push(await prisma.course.create({
      data: { title: `Load Test Course ${i + 1}`, code: `LT-${scale}-${i + 1}`, tier: 'paid', level: 'beginner', weeks: 8, createdAt: randomPastDate(180) },
    }));
  }
  const batches = [];
  for (const course of courses) {
    batches.push(await prisma.batch.create({
      data: {
        courseId: course.id, code: `${course.code}-B1`, name: `${course.title} Batch 1`,
        startDate: new Date(Date.now() - 45 * 24 * 3600 * 1000).toISOString().slice(0, 10),
        status: 'active', instructorIds: [], createdAt: course.createdAt,
      },
    }));
  }
  console.log(`[loadtest-seed] ${courses.length} courses, ${batches.length} batches (${Date.now() - t0}ms)`);

  // --- users: existing role mix, weighted toward student/free (matches a
  // free-hackathon-driven growth curve, per the scale-readiness brief) ---
  const ROLE_WEIGHTS = [['student', 0.7], ['free', 0.2], ['instructor', 0.03], ['coordinator', 0.02], ['hr', 0.02], ['admin', 0.01], ['finance', 0.01], ['student_coordinator', 0.01]];
  function randomRole() {
    let r = Math.random();
    for (const [role, w] of ROLE_WEIGHTS) { if (r < w) return role; r -= w; }
    return 'student';
  }
  const ACTIVE_COUNT = Math.round(scale * 0.3); // "300 of 1000 active" ratio, scaled
  const t1 = Date.now();
  const userRows = [];
  for (let i = 0; i < scale; i++) {
    const createdAt = randomPastDate(90);
    userRows.push({
      name: randomName(),
      username: `loadtest_${scale}_${i}`,
      email: `loadtest_${scale}_${i}@example.test`,
      // user 0/1: guaranteed student/admin, regardless of scale, so
      // loadtest-measure.js's manifest never depends on random role luck.
      role: i === 0 ? 'student' : i === 1 ? 'admin' : randomRole(),
      passwordHash,
      createdAt,
      lastActive: i < ACTIVE_COUNT ? randomPastDate(7) : null,
    });
  }
  await chunked(userRows, 1000, (chunk) => prisma.user.createMany({ data: chunk }));
  const userIds = (await prisma.user.findMany({ where: { username: { startsWith: `loadtest_${scale}_` } }, select: { id: true }, orderBy: { id: 'asc' } })).map((u) => u.id);
  const activeUserIds = userIds.slice(0, ACTIVE_COUNT); // index 0 (student) and 1 (admin) are always inside this slice for any scale >= 4
  console.log(`[loadtest-seed] ${userIds.length} users (${activeUserIds.length} active) (${Date.now() - t1}ms)`);

  // --- quests: a fixed set of levels per batch, level 1 always has an
  // unlocked, gradeable problem so loadtest-measure.js can exercise the
  // real submit endpoint without needing to fake progress state ---
  const QUESTS_PER_BATCH = 6;
  const quests = [];
  for (const batch of batches) {
    for (let no = 1; no <= QUESTS_PER_BATCH; no++) {
      quests.push(await prisma.quest.create({
        data: {
          batchId: batch.id, trackKey: 'python', no, week: Math.ceil(no / 2), session: 1,
          title: `Level ${no}`, topic: 'Fundamentals',
          problems: [{ pid: 1, type: 'code', title: `Problem ${no}.1`, description: 'Solve it.', difficulty: 'easy', points: 100 }],
          createdAt: batch.createdAt,
        },
      }));
    }
  }
  console.log(`[loadtest-seed] ${quests.length} quests`);

  // --- enrollments: every active user enrolled in one random batch, except
  // user 0 (the manifest's designated student) who is pinned to batches[0]
  // so loadtest-measure.js knows exactly which quest they can submit to ---
  const t2 = Date.now();
  const manifestStudentId = activeUserIds[0];
  const enrollmentRows = activeUserIds.map((userId) => ({
    userId, batchId: userId === manifestStudentId ? batches[0].id : pick(batches).id, createdAt: randomPastDate(80),
  }));
  await chunked(enrollmentRows, 1000, (chunk) => prisma.enrollment.createMany({ data: chunk, skipDuplicates: true }));
  console.log(`[loadtest-seed] ${enrollmentRows.length} enrollments (${Date.now() - t2}ms)`);

  // --- quest submissions: ~10x scale, spread across active users/quests ---
  const t3 = Date.now();
  const SUBMISSION_COUNT = scale * 10;
  const submissionRows = [];
  for (let i = 0; i < SUBMISSION_COUNT; i++) {
    const quest = pick(quests);
    submissionRows.push({
      questId: quest.id, pid: 1, userId: pick(activeUserIds),
      code: randomCode(submissionCodeSize()), language: 'python',
      submittedAt: randomPastDate(60),
      grade: Math.random() < 0.7 ? randInt(60, 100) : null,
      gems: Math.random() < 0.7 ? randInt(5, 20) : 0,
    });
  }
  await chunked(submissionRows, 500, (chunk) => prisma.questSubmission.createMany({ data: chunk }));
  console.log(`[loadtest-seed] ${submissionRows.length} quest submissions (${Date.now() - t3}ms)`);

  // --- gem events: ~15x scale ---
  const t4 = Date.now();
  const GEM_EVENT_COUNT = scale * 15;
  const gemRows = [];
  for (let i = 0; i < GEM_EVENT_COUNT; i++) {
    gemRows.push({ userId: pick(activeUserIds), batchId: pick(batches).id, amount: randInt(5, 30), source: pick(['quest', 'streak', 'quiz', 'manual']), at: randomPastDate(60) });
  }
  await chunked(gemRows, 1000, (chunk) => prisma.gemEvent.createMany({ data: chunk }));
  console.log(`[loadtest-seed] ${gemRows.length} gem events (${Date.now() - t4}ms)`);

  // --- chat messages: ~5x scale ---
  const t5 = Date.now();
  const CHAT_COUNT = scale * 5;
  const chatRows = [];
  for (let i = 0; i < CHAT_COUNT; i++) {
    chatRows.push({ batchId: pick(batches).id, userId: pick(activeUserIds), body: randomCode(randInt(20, 200)), createdAt: randomPastDate(60) });
  }
  await chunked(chatRows, 1000, (chunk) => prisma.courseMessage.createMany({ data: chunk }));
  console.log(`[loadtest-seed] ${chatRows.length} chat messages (${Date.now() - t5}ms)`);

  await prisma.$disconnect();

  // Manifest for loadtest-measure.js - real ids from this exact seed run,
  // so the measure script never has to guess or re-derive them.
  const manifest = {
    scale,
    seededAt: new Date().toISOString(),
    courseId: courses[0].id,
    batchId: batches[0].id,
    questId: quests[0].id, // batches[0]'s level 1 - always unlocked
    studentUserId: manifestStudentId,
    adminUserId: userIds[1], // for the gem-award write test - admin bypasses per-batch manageBatch checks
    userIds: userIds.slice(0, Math.min(50, userIds.length)), // small sample, any role - fine for auth-only checks
    // Distinct real active users (any role, all with lastActive already set)
    // - for the concurrent read driver, so "N concurrent users" actually
    // means N different rows/JWTs, not one user's row fought over by every
    // worker. Kept separate from questFeed's fixed studentUserId/batchId,
    // since that endpoint needs a user actually enrolled in batches[0].
    activeUserIds: activeUserIds.slice(0, Math.min(200, activeUserIds.length)),
  };
  require('fs').writeFileSync(require('path').join(__dirname, `.loadtest-manifest-${scale}.json`), JSON.stringify(manifest, null, 2));

  console.log(`[loadtest-seed] done in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
  console.log(`[loadtest-seed] manifest written: scripts/.loadtest-manifest-${scale}.json`);
}

main().catch((e) => { console.error('[loadtest-seed] FAILED:', e); process.exit(1); });
