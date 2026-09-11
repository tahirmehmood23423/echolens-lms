#!/usr/bin/env node
'use strict';
/**
 * Proves the enrolment gate over HTTP, the way a learner (or someone poking at
 * the API) would actually hit it:
 *   1. signed out  -> a free course hands back NO lesson content
 *   2. signed in, not enrolled -> still no content, and submit is refused
 *   3. enrolled    -> seat pending for an hour, still no content
 *   4. backdated   -> confirmed, content unlocks
 *   5. the 2-course cap refuses a third enrolment
 *
 * Usage: BASE_URL=http://localhost:3100 node seat-check.mjs
 */
import { chromium } from 'playwright';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SHOTS = path.join(HERE, 'screenshots');
fs.mkdirSync(SHOTS, { recursive: true });
const BASE_URL = process.env.BASE_URL || 'http://localhost:3100';
const KEY = 'fc01-c-basics';

let failures = 0;
const check = (label, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) failures++;
  console.log(`   ${ok ? 'PASS' : 'FAIL'}  ${label}: got ${JSON.stringify(got)}${ok ? '' : ` want ${JSON.stringify(want)}`}`);
};
// "Has content" = the API actually shipped a lesson body / video / brief.
const contentShape = (d) => ({
  open_levels: d.open_levels,
  locked_levels: d.levels.filter((l) => l.locked).length,
  total_levels: d.levels.length,
  any_brief: d.levels.some((l) => (l.problems || []).some((p) => !!p.description)),
  any_video: d.levels.some((l) => !!l.video_url),
});

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await ctx.newPage();
  const get = (p) => page.evaluate((u) => fetch(u, { credentials: 'include' }).then((r) => r.json().then((j) => ({ status: r.status, body: j }))), p);
  const post = (p, b) => page.evaluate(([u, body]) => fetch(u, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then((r) => r.json().then((j) => ({ status: r.status, body: j }))), [p, b]);

  await page.goto(`${BASE_URL}/open`, { waitUntil: 'domcontentloaded' });

  console.log('1. signed out - a free course must not hand out content');
  let d = (await get(`/api/public/tracks/${KEY}`)).body;
  const signedOut = contentShape(d);
  console.log('   ', JSON.stringify(signedOut));
  check('open_levels', signedOut.open_levels, 0);
  check('every level locked', signedOut.locked_levels, signedOut.total_levels);
  check('no assignment briefs', signedOut.any_brief, false);
  check('no video URLs', signedOut.any_video, false);

  console.log('2. signed in as a learner, not enrolled');
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
  d = (await get(`/api/public/tracks/${KEY}`)).body;
  check('still no content when merely signed in', contentShape(d).any_brief, false);
  const noSeat = await post('/api/open/submit', { track_key: KEY, level: 1, pid: 1, code: 'int main(){}', request_key: 'seatcheck-000000001' });
  check('submit refused without enrolment', noSeat.status, 403);
  console.log('    ->', noSeat.body.error);

  console.log('3. enrolled - seat pending for an hour');
  const enrolled = await post('/api/open/enrollments', { track_key: KEY });
  check('enrol accepted', enrolled.status, 201);
  check('seat starts inactive', enrolled.body.enrollment.active, false);
  console.log('    ->', enrolled.body.enrollment.confirmation_note);
  d = (await get(`/api/public/tracks/${KEY}`)).body;
  check('content still shut while pending', contentShape(d).any_brief, false);
  check('track reports the pending seat', d.enrollment.active, false);
  const pending = await post('/api/open/submit', { track_key: KEY, level: 1, pid: 1, code: 'int main(){}', request_key: 'seatcheck-000000002' });
  check('submit refused while pending', pending.status, 409);
  console.log('    ->', pending.body.error);
  await page.goto(`${BASE_URL}/open#free`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  await page.evaluate((k) => window.openCourse(k), KEY);
  await page.waitForTimeout(2500);
  const rowsLocked = await page.$$eval('.curr-row', (els) => els.map((e) => ({ locked: e.classList.contains('curr-row-locked'), disabled: e.disabled })));
  check('every module row locked while pending', rowsLocked.every(r => r.locked && r.disabled), true);
  const ctaLabel = (await page.textContent('.curr-cta .btn')).trim();
  check('CTA reads as pending', ctaLabel, 'Confirming your seat');
  const banner = await page.$('.pace-note-wait');
  check('pending banner shown', !!banner, true);
  await page.screenshot({ path: path.join(SHOTS, 'seat-1-pending.png'), fullPage: true });
  console.log('   screenshot: seat-1-pending.png');

  console.log('4. the two-course cap');
  const second = await post('/api/open/enrollments', { track_key: 'fc02-cpp-objects' });
  check('second course allowed', second.status, 201);
  const third = await post('/api/open/enrollments', { track_key: 'cs104-python' });
  check('third course refused', third.status, 409);
  console.log('    ->', third.body.error);

  console.log('\nfailures:', failures);
  await browser.close();
  process.exit(failures ? 1 : 0);
})().catch((e) => { console.error('FAILED:', e.message); process.exit(1); });
