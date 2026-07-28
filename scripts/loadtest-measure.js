'use strict';

/**
 * EchoLens LMS - load test measure (Part A)
 *
 * Boots the real app (a child `node server.js` process) against a dataset
 * already seeded by loadtest-seed.js, drives it with a hand-rolled
 * concurrent request pool (no autocannon / no new dependency - just
 * Node's built-in http), and reports the numbers the scale-readiness brief
 * asked for: RSS memory at three points, p50/p95/p99 latency per endpoint,
 * flush duration as the dataset grows, and time-to-boot.
 *
 * SAFETY: same rule as loadtest-seed.js - refuses without LOADTEST_CONFIRM=1
 * and refuses if DATABASE_URL/DIRECT_URL matches the production project ref,
 * checked independently of db-guard.js/NODE_ENV/RENDER.
 *
 * Usage:
 *   LOADTEST_CONFIRM=1 DATABASE_URL=postgresql://...scratch... \
 *   node scripts/loadtest-measure.js --scale=1000
 *
 * Requires scripts/.loadtest-manifest-<scale>.json (written by loadtest-seed.js
 * for the same scale) to already exist.
 */

const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const { PROD_DB_MARKER } = require('../db-guard');

function parseArgs() {
  const out = { scale: 1000 };
  for (const arg of process.argv.slice(2)) {
    const m = arg.match(/^--scale=(\d+)$/);
    if (m) out.scale = Number(m[1]);
  }
  return out;
}

function assertSafe() {
  if (process.env.LOADTEST_CONFIRM !== '1') throw new Error('Refusing to run: set LOADTEST_CONFIRM=1.');
  const urls = [process.env.DATABASE_URL, process.env.DIRECT_URL].filter(Boolean);
  if (!urls.length) throw new Error('DATABASE_URL is not set.');
  if (urls.some((u) => u.includes(PROD_DB_MARKER))) throw new Error(`Refusing to run: DATABASE_URL/DIRECT_URL matches the production project ref (${PROD_DB_MARKER}).`);
}

function percentile(sorted, p) {
  if (!sorted.length) return null;
  const idx = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
  return sorted[idx];
}
function stats(samples) {
  const sorted = [...samples].sort((a, b) => a - b);
  return { count: sorted.length, p50: percentile(sorted, 50), p95: percentile(sorted, 95), p99: percentile(sorted, 99), max: sorted[sorted.length - 1] || null };
}

function request({ port, method, path: p, cookie, body }) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const t0 = Date.now();
    const req = http.request({
      host: '127.0.0.1', port, method, path: p,
      headers: {
        ...(cookie ? { Cookie: cookie } : {}),
        ...(payload ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) } : {}),
      },
    }, (res) => {
      res.resume(); // drain, don't buffer bodies we don't need
      res.on('end', () => resolve({ status: res.statusCode, ms: Date.now() - t0 }));
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function waitForBoot(port, timeoutMs = 120000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const r = await request({ port, method: 'GET', path: '/__loadtest/rss' });
      if (r.status === 200) return Date.now() - start;
    } catch { /* not up yet */ }
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error('Server did not become ready within ' + timeoutMs + 'ms');
}

async function getRss(port) {
  return new Promise((resolve, reject) => {
    http.get({ host: '127.0.0.1', port, path: '/__loadtest/rss' }, (res) => {
      let body = '';
      res.on('data', (c) => (body += c));
      res.on('end', () => { try { resolve(JSON.parse(body).rss); } catch (e) { reject(e); } });
    }).on('error', reject);
  });
}

/** Hand-rolled concurrent driver - `concurrency` workers, each looping `fn` until `totalRequests` have been issued across all of them combined. */
async function runPool({ concurrency, totalRequests, fn }) {
  let issued = 0;
  const results = [];
  async function worker() {
    while (issued < totalRequests) {
      issued++;
      try { results.push(await fn()); } catch (e) { results.push({ status: 0, ms: null, error: e.message }); }
    }
  }
  await Promise.all(Array.from({ length: concurrency }, worker));
  return results;
}

async function main() {
  assertSafe();
  const { scale } = parseArgs();
  const manifestPath = path.join(__dirname, `.loadtest-manifest-${scale}.json`);
  if (!fs.existsSync(manifestPath)) throw new Error(`No manifest at ${manifestPath} - run loadtest-seed.js --scale=${scale} first.`);
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

  const PORT = 3900 + (scale % 90); // spread across scales to avoid collisions if run back-to-back too fast
  const JWT_SECRET = 'loadtest-jwt-secret-not-for-production';
  const scratchDbPath = path.join(require('os').tmpdir(), `echolens-loadtest-${scale}-${Date.now()}.json`);
  const scratchUploadDir = path.join(require('os').tmpdir(), `echolens-loadtest-uploads-${scale}-${Date.now()}`);

  console.log(`[loadtest-measure] scale=${scale} port=${PORT}`);

  const child = spawn(process.execPath, [path.join(__dirname, '..', 'server.js')], {
    cwd: path.join(__dirname, '..'),
    env: {
      ...process.env,
      PORT: String(PORT),
      JWT_SECRET,
      LOADTEST_DIAG: '1',
      PERF_DEBUG: '1', // store.js logs "[perf] save(): <ms>ms ..." per flush - parsed below for flush-duration numbers
      DB_PATH: scratchDbPath,
      UPLOAD_DIR: scratchUploadDir,
      NODE_ENV: '', RENDER: '', // explicitly not production - this is a scratch measurement run
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  // Extracted incrementally, not accumulated into one string - PERF_DEBUG's
  // per-query logging is voluminous (especially now that requests aren't
  // stuck queued behind the touchActivity flush storm and far more of them
  // complete per second), and a fixed app can produce enough of it within
  // one run to exceed V8's max string length if naively concatenated.
  const flushDurationsMs = [];
  let carry = ''; // small tail carried across chunks so a split match isn't missed
  let debugTail = ''; // bounded, only kept if LOADTEST_DEBUG=1
  function onChildData(d) {
    const combined = carry + d.toString();
    for (const m of combined.matchAll(/\[perf\] save\(\): (\d+)ms/g)) flushDurationsMs.push(Number(m[1]));
    carry = combined.slice(-200);
    if (process.env.LOADTEST_DEBUG === '1') {
      debugTail += combined;
      if (debugTail.length > 2_000_000) debugTail = debugTail.slice(-2_000_000);
    }
  }
  child.stdout.on('data', onChildData);
  child.stderr.on('data', onChildData);

  const bootReport = {};
  try {
    const t0 = Date.now();
    const bootMs = await waitForBoot(PORT);
    bootReport.bootMs = bootMs;
    bootReport.rssAtBootBytes = await getRss(PORT);
    console.log(`[loadtest-measure] booted in ${bootMs}ms, RSS ${(bootReport.rssAtBootBytes / 1024 / 1024).toFixed(1)}MB`);

    const studentCookie = `el_token=${jwt.sign({ id: manifest.studentUserId }, JWT_SECRET, { expiresIn: '1h' })}`;
    const adminCookie = `el_token=${jwt.sign({ id: manifest.adminUserId }, JWT_SECRET, { expiresIn: '1h' })}`;
    // Distinct users for the read pool - "N concurrent users" should mean N
    // different rows/JWTs, not one user's row hit N times concurrently
    // (which understates any per-user contention, touchActivity's included).
    // Falls back to the single student if an older manifest lacks this field.
    const activeUserIds = manifest.activeUserIds && manifest.activeUserIds.length ? manifest.activeUserIds : [manifest.studentUserId];
    const activeCookies = activeUserIds.map((id) => `el_token=${jwt.sign({ id }, JWT_SECRET, { expiresIn: '1h' })}`);
    let cookieCursor = 0;
    const nextActiveCookie = () => activeCookies[(cookieCursor++) % activeCookies.length];

    // --- first flush: one write, then poll flush-health-style by re-hitting
    // the endpoint until the write round-trips (the app already awaits its
    // own persist before responding - see store.js's pendingPersist - so a
    // 200 here already means "flushed", this just captures that RSS point) ---
    await request({ port: PORT, method: 'GET', path: '/api/overview', cookie: studentCookie });
    bootReport.rssAfterFirstRequestBytes = await getRss(PORT);

    const CONCURRENCY = Math.max(1, Math.round(scale * 0.05)); // "~5% of users active at once"
    const READ_REQUESTS_PER_ENDPOINT = Math.min(300, CONCURRENCY * 6);
    const WRITE_REQUESTS = Math.min(100, CONCURRENCY * 2);
    console.log(`[loadtest-measure] concurrency=${CONCURRENCY}`);

    const endpoints = {
      // dashboard/leaderboard: any authenticated role works, so these cycle
      // through distinct real users - a faithful "N concurrent users" test.
      dashboard: () => request({ port: PORT, method: 'GET', path: '/api/overview', cookie: nextActiveCookie() }),
      leaderboard: () => request({ port: PORT, method: 'GET', path: '/api/leaderboard', cookie: nextActiveCookie() }),
      // questFeed requires viewBatch (enrolled-in-this-batch or staff) -
      // stays on the manifest's one guaranteed-enrolled student.
      questFeed: () => request({ port: PORT, method: 'GET', path: `/api/batches/${manifest.batchId}/quest`, cookie: studentCookie }),
    };

    const results = {};
    for (const [name, fn] of Object.entries(endpoints)) {
      const rows = await runPool({ concurrency: CONCURRENCY, totalRequests: READ_REQUESTS_PER_ENDPOINT, fn });
      results[name] = stats(rows.filter((r) => r.ms != null).map((r) => r.ms));
      results[name].errorCount = rows.filter((r) => r.status >= 400 || r.status === 0).length;
    }

    // Writes: quest submission (student) and gem award (admin). Kept below
    // the reads' concurrency/volume on purpose - these mutate real rows and
    // this is a scratch database sized for measurement, not stress-to-fail.
    const submitBody = () => ({ code: 'def solve():\n    return 42\n', language: 'python', note: 'loadtest' });
    const submissionRows = await runPool({
      concurrency: Math.min(CONCURRENCY, 20), totalRequests: WRITE_REQUESTS,
      fn: () => request({ port: PORT, method: 'POST', path: `/api/quests/${manifest.questId}/problems/1/submit`, cookie: studentCookie, body: submitBody() }),
    });
    results.questSubmissionWrite = stats(submissionRows.filter((r) => r.ms != null).map((r) => r.ms));
    results.questSubmissionWrite.errorCount = submissionRows.filter((r) => r.status >= 400 || r.status === 0).length;

    const awardRows = await runPool({
      concurrency: Math.min(CONCURRENCY, 20), totalRequests: WRITE_REQUESTS,
      fn: () => request({ port: PORT, method: 'POST', path: `/api/batches/${manifest.batchId}/award`, cookie: adminCookie, body: { user_id: manifest.studentUserId, amount: 5, reason: 'loadtest' } }),
    });
    results.gemAwardWrite = stats(awardRows.filter((r) => r.ms != null).map((r) => r.ms));
    results.gemAwardWrite.errorCount = awardRows.filter((r) => r.status >= 400 || r.status === 0).length;

    bootReport.rssAfter100WritesBytes = await getRss(PORT);

    // Flush duration as the dataset grows: store.js's own PERF_DEBUG log
    // line (one per save()/flush during this run), extracted incrementally
    // as it streamed in (see onChildData above) rather than re-parsed here.
    const flush = {
      samples: flushDurationsMs.length,
      firstMs: flushDurationsMs[0] ?? null,
      lastMs: flushDurationsMs[flushDurationsMs.length - 1] ?? null,
      ...stats(flushDurationsMs),
    };

    console.log('\n=== RESULTS scale=' + scale + ' ===');
    console.log(JSON.stringify({ boot: bootReport, flush, endpoints: results }, null, 2));

    return { scale, boot: bootReport, flush, endpoints: results };
  } finally {
    child.kill();
    try { fs.unlinkSync(scratchDbPath); } catch {}
    try { fs.rmSync(scratchUploadDir, { recursive: true, force: true }); } catch {}
    if (process.env.LOADTEST_DEBUG === '1') console.log('--- child output (last 2MB) ---\n' + debugTail);
  }
}

if (require.main === module) {
  main().catch((e) => { console.error('[loadtest-measure] FAILED:', e); process.exit(1); });
}

module.exports = { main };
