#!/usr/bin/env node
'use strict';
/**
 * Regression cover for the production crash: submitting to an open-web event
 * (a competition) threw "ReferenceError: output is not defined" inside
 * Events.submit and took the whole process down.
 *
 * Creates a live auto-graded competition as admin, then submits to it as a
 * learner - with and without a captured program output - and asserts the
 * server answers instead of dying.
 *
 * Usage: BASE_URL=http://localhost:3100 node event-submit-check.mjs
 */
import { chromium } from 'playwright';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3100';
let failures = 0;
const check = (label, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) failures++;
  console.log(`   ${ok ? 'PASS' : 'FAIL'}  ${label}: got ${JSON.stringify(got)}${ok ? '' : ` want ${JSON.stringify(want)}`}`);
};
const login = async (page, who) => {
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
  await page.fill('input[name="login"]', who);
  await page.fill('input[name="password"]', 'ChangeMe!2026');
  await page.click('#submit');
  await page.waitForURL(/\/(dashboard|open)$/, { timeout: 20000 });
  const wa = page.locator('input[name="whatsapp"]');
  if (await wa.isVisible({ timeout: 2000 }).catch(() => false)) {
    await wa.fill('0300-0000000'); await page.click('#waForm button'); await page.waitForTimeout(1200);
  }
};
const post = (page, p, b) => page.evaluate(([u, body]) => fetch(u, {
  method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
}).then((r) => r.json().then((j) => ({ status: r.status, body: j }))), [p, b]);

(async () => {
  const browser = await chromium.launch();

  console.log('1. create a live auto-graded competition (admin)');
  const admin = await browser.newContext();
  const ap = await admin.newPage();
  await login(ap, 'admin@echolens.digital');
  // Competitions need full date-times, and must already be LIVE to take work.
  const startsAt = new Date(Date.now() - 3600e3).toISOString().slice(0, 16);
  const endsAt = new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 16);
  const made = await post(ap, '/api/admin/events', {
    kind: 'competition', title: 'Crash Regression Competition',
    description: 'Print the greeting exactly.\n\nInput: None\nExpected Output:\nHello EchoLens',
    starts_at: startsAt, ends_at: endsAt, compiler: 'c', pass_mark: 60, auto_grade: true, fee_pkr: 0,
    problems: [{ pid: 1, title: 'Greeting', description: 'Print "Hello EchoLens".\n\nInput: None\nExpected Output:\nHello EchoLens', points: 100, criteria: ['Prints exactly "Hello EchoLens"'] }],
  });
  check('event created', made.status < 400, true);
  const eventId = made.body?.event?.id ?? made.body?.id;
  console.log('    event id:', eventId, made.status >= 400 ? JSON.stringify(made.body).slice(0, 200) : '');
  if (!eventId) { console.log('\ncannot continue without an event'); await browser.close(); process.exit(1); }
  await admin.close();

  console.log('2. submit as a learner - the call that used to crash the server');
  const learner = await browser.newContext();
  const lp = await learner.newPage();
  await login(lp, 'student@echolens.digital');
  await lp.goto(`${BASE_URL}/open`, { waitUntil: 'domcontentloaded' });
  const reg = await post(lp, `/api/events/${eventId}/register`, {});
  console.log('    register ->', reg.status, JSON.stringify(reg.body).slice(0, 120));

  const code = '#include <stdio.h>\nint main(void){printf("Hello EchoLens\\n");return 0;}';
  const withOutput = await post(lp, `/api/events/${eventId}/submit`, { pid: 1, code, language: 'c', output: 'Hello EchoLens' });
  check('submit WITH output does not 500', withOutput.status < 500, true);
  check('submit WITH output actually reached Events.submit', withOutput.status < 400, true);
  console.log('    ->', withOutput.status, JSON.stringify(withOutput.body).slice(0, 160));

  const withoutOutput = await post(lp, `/api/events/${eventId}/submit`, { pid: 1, code, language: 'c' });
  check('submit WITHOUT output does not 500', withoutOutput.status < 500, true);
  check('submit WITHOUT output actually reached Events.submit', withoutOutput.status < 400, true);
  console.log('    ->', withoutOutput.status, JSON.stringify(withoutOutput.body).slice(0, 160));

  console.log('3. the server is still alive afterwards');
  const alive = await lp.evaluate((u) => fetch(u, { credentials: 'include' }).then((r) => r.status), `${BASE_URL}/api/auth/me`);
  check('server still responding', alive, 200);

  console.log('\nfailures:', failures);
  await browser.close();
  process.exit(failures ? 1 : 0);
})().catch((e) => { console.error('FAILED:', e.message); process.exit(1); });
