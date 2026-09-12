#!/usr/bin/env node
'use strict';
/**
 * Finishing a course, end to end:
 *   1. work through every required problem of a short free track
 *   2. the certificate is issued automatically once the last grade lands
 *   3. /api/open/progress carries it, so the page can congratulate the learner
 *   4. the congratulations screen appears by itself while the learner waits
 *   5. it does not appear a second time
 *
 * Run the server with ENROLLMENT_HOLD_HOURS=0 so the seat gate (covered by
 * seat-check.mjs) is out of the way. Check the server log for the
 * "[certificate] emailed ..." line - MAIL_DRY_RUN keeps it from really sending.
 *
 * Usage: BASE_URL=http://localhost:3100 node completion-check.mjs
 */
import { chromium } from 'playwright';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SHOTS = path.join(HERE, 'screenshots');
fs.mkdirSync(SHOTS, { recursive: true });
const BASE_URL = process.env.BASE_URL || 'http://localhost:3100';
const KEY = process.env.TRACK || 'fc02-cpp-objects';

let failures = 0;
const check = (label, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) failures++;
  console.log(`   ${ok ? 'PASS' : 'FAIL'}  ${label}: got ${JSON.stringify(got)}${ok ? '' : ` want ${JSON.stringify(want)}`}`);
};

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await ctx.newPage();
  const get = (p) => page.evaluate((u) => fetch(u, { credentials: 'include' }).then((r) => r.json()), p);
  const post = (p, b) => page.evaluate(([u, body]) => fetch(u, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then((r) => r.json().then((j) => ({ status: r.status, body: j }))), [p, b]);

  await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
  await page.fill('input[name="login"]', 'student@echolens.digital');
  await page.fill('input[name="password"]', 'ChangeMe!2026');
  await page.click('#submit');
  await page.waitForURL(/\/(dashboard|open)$/, { timeout: 20000 });
  const wa = page.locator('input[name="whatsapp"]');
  if (await wa.isVisible({ timeout: 2500 }).catch(() => false)) {
    await wa.fill('0300-0000000'); await page.click('#waForm button'); await page.waitForTimeout(1500);
  }
  await page.goto(`${BASE_URL}/open`, { waitUntil: 'domcontentloaded' });

  console.log('1. enrol and walk the whole course');
  await post('/api/open/enrollments', { track_key: KEY });
  const track = await get(`/api/public/tracks/${KEY}`);
  const levels = track.levels;
  console.log(`   ${track.track.title}: ${levels.length} levels`);

  // Correct-enough C++ that satisfies a generic brief is impossible to write
  // blind, so completion here is driven by the staff-grade path instead: submit
  // everything, then have an admin mark each attempt. That exercises exactly the
  // same certification + email code the AI worker uses (announceCourseCompletion).
  let submitted = 0;
  for (const l of levels) {
    for (const p of (l.problems || []).filter((p) => p.required !== false)) {
      // request_key must match /^[\w-]{16,80}$/ - pad so it is always long enough.
      const key = `completion-${String(l.no).padStart(3, '0')}-${String(p.pid).padStart(3, '0')}-0000`;
      const r = await post('/api/open/submit', { track_key: KEY, level: l.no, pid: p.pid, code: '// attempt\nint main(){return 0;}', language: 'cpp', request_key: key });
      if (r.status >= 400) { console.log(`    !! L${l.no} p${p.pid}: ${r.body.error}`); }
      else submitted++;
      // Modules unlock on grading, so grade this module before moving on.
    }
    // Grade everything queued so far, as an admin, to open the next module.
    await gradeAllAsAdmin();
    await page.waitForTimeout(500);
  }
  console.log(`   submitted ${submitted} problems`);

  console.log('2. the certificate is issued and reaches /api/open/progress');
  const prog = (await get(`/api/open/progress?track=${KEY}`)).progress;
  check('course reports complete', !!prog.complete, true);
  check('certificate present on progress', !!prog.certificate, true);
  if (prog.certificate) console.log(`    serial ${prog.certificate.serial} -> ${prog.certificate.url}`);

  console.log('3. the congratulations screen appears by itself');
  await page.evaluate(() => { try { Object.keys(localStorage).filter((k) => k.startsWith('el:celebrated:')).forEach((k) => localStorage.removeItem(k)); } catch {} });
  await page.goto(`${BASE_URL}/open`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);
  await page.evaluate((k) => window.openCourse(k), KEY);
  await page.waitForTimeout(3000);
  const shown = await page.$('.cert-done');
  check('celebration shown', !!shown, true);
  if (shown) {
    const heading = (await page.textContent('.cert-done h3')).trim();
    console.log(`    "${heading}"`);
    await page.screenshot({ path: path.join(SHOTS, 'course-complete.png'), fullPage: true });
    console.log('   screenshot: course-complete.png');
  }

  console.log('4. it does not nag on the next visit');
  await page.evaluate(() => window.closeModal && window.closeModal());
  await page.goto(`${BASE_URL}/open`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);
  await page.evaluate((k) => window.openCourse(k), KEY);
  await page.waitForTimeout(2500);
  check('not shown again', !!(await page.$('.cert-done')), false);

  console.log('\nfailures:', failures);
  await browser.close();
  process.exit(failures ? 1 : 0);

  async function gradeAllAsAdmin() {
    const admin = await browser.newContext();
    const ap = await admin.newPage();
    await ap.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
    await ap.fill('input[name="login"]', 'admin@echolens.digital');
    await ap.fill('input[name="password"]', 'ChangeMe!2026');
    await ap.click('#submit');
    await ap.waitForURL(/\/(dashboard|open)$/, { timeout: 20000 });
    const pending = await ap.evaluate(() => fetch('/api/admin/open-attempts', { credentials: 'include' }).then((r) => r.json()));
    for (const a of pending.attempts || []) {
      await ap.evaluate(([id]) => fetch(`/api/admin/open-attempts/${id}/grade`, {
        method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ score: 95, feedback: 'Meets every rubric item.' }),
      }).then((r) => r.json()), [a.id]);
    }
    await admin.close();
  }
})().catch((e) => { console.error('FAILED:', e.message); process.exit(1); });
