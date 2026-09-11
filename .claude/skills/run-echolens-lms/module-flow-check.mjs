#!/usr/bin/env node
'use strict';
/**
 * The module rule end to end, over HTTP:
 *   1. only module 1 is open to a new learner; 2..N are locked
 *   2. submitting into a locked module is refused
 *   3. while module 1 is being graded it stays "open", module 2 stays locked,
 *      and the learner is told the 8-hour deadline
 *   4. once module 1 is graded, module 2 opens - with no further wait
 *
 * Run the server with ENROLLMENT_HOLD_HOURS=0 so the seat gate (proven
 * separately by seat-check.mjs) is out of the way.
 *
 * Usage: BASE_URL=http://localhost:3100 node module-flow-check.mjs
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

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await ctx.newPage();
  const get = (p) => page.evaluate((u) => fetch(u, { credentials: 'include' }).then((r) => r.json().then((j) => ({ status: r.status, body: j }))), p);
  const post = (p, b) => page.evaluate(([u, body]) => fetch(u, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then((r) => r.json().then((j) => ({ status: r.status, body: j }))), [p, b]);
  const modules = async () => (await get(`/api/open/progress?track=${KEY}`)).body.progress.modules.map((m) => ({ no: m.no, status: m.status }));

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

  console.log('1. enrol, then only module 1 is open');
  await post('/api/open/enrollments', { track_key: KEY });
  let ms = await modules();
  console.log('   ', JSON.stringify(ms));
  check('module 1 available', ms[0].status, 'available');
  check('every later module locked', ms.slice(1).every((m) => m.status === 'locked'), true);

  console.log('2. a locked module refuses work');
  const track = (await get(`/api/public/tracks/${KEY}`)).body;
  const m2Level = track.levels.find((l) => l.week === 2);
  const jump = await post('/api/open/submit', { track_key: KEY, level: m2Level.no, pid: 1, code: 'int main(){}', request_key: 'modflow-jump-00001' });
  check('submit into module 2 refused', jump.status, 409);
  console.log('    ->', jump.body.error);

  console.log('3. work module 1; while it grades, module 2 stays locked');
  const m1Levels = track.levels.filter((l) => l.week === 1);
  for (const l of m1Levels) {
    for (const p of l.problems.filter((p) => p.required !== false)) {
      const r = await post('/api/open/submit', { track_key: KEY, level: l.no, pid: p.pid, code: `#include <stdio.h>\nint main(){printf("x");return 0;}`, language: 'c', request_key: `modflow-m1-${l.no}-${p.pid}-000` });
      if (r.status >= 400) { console.log(`    !! level ${l.no} pid ${p.pid}: ${r.body.error}`); failures++; }
    }
  }
  ms = await modules();
  console.log('   ', JSON.stringify(ms));
  check('module 1 is open (being worked/graded)', ms[0].status, 'open');
  check('module 2 still locked while ungraded', ms[1].status, 'locked');
  const prog = (await get(`/api/open/progress?track=${KEY}`)).body.progress;
  check('the 8-hour promise is published', prog.grading_window_hours, 8);
  const m1 = prog.modules[0];
  console.log('    module 1 reason:', m1.reason);

  console.log('4. wait for the grader, then module 2 must open on its own');
  const deadline = Date.now() + 180_000;
  let final = ms;
  while (Date.now() < deadline) {
    await page.waitForTimeout(4000);
    final = await modules();
    if (final[0].status === 'complete') break;
  }
  console.log('   ', JSON.stringify(final));
  check('module 1 complete once graded', final[0].status, 'complete');
  check('module 2 opens with no further wait', final[1].status, 'available');
  check('module 3 still locked', final[2].status, 'locked');

  await page.goto(`${BASE_URL}/open`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);
  await page.evaluate((k) => window.openCourse(k), KEY);
  await page.waitForTimeout(2500);
  await page.screenshot({ path: path.join(SHOTS, 'module-flow.png'), fullPage: true });
  console.log('   screenshot: module-flow.png');

  console.log('\nfailures:', failures);
  await browser.close();
  process.exit(failures ? 1 : 0);
})().catch((e) => { console.error('FAILED:', e.message); process.exit(1); });
