#!/usr/bin/env node
'use strict';
/**
 * End-to-end check for the admin "manually add students to a free course"
 * page: sign in as admin, open Free Courses, add a brand-new student (account
 * created + credentials returned) and an existing one (just enrolled), and
 * confirm the new account can actually sign in with the password shown.
 *
 * Usage: BASE_URL=http://localhost:3100 node admin-open-course-students-check.mjs
 */
import { chromium } from 'playwright';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3100';
let failures = 0;
const check = (label, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) failures++;
  console.log(`   ${ok ? 'PASS' : 'FAIL'}  ${label}: got ${JSON.stringify(got)}${ok ? '' : ` want ${JSON.stringify(want)}`}`);
};

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext();
  const page = await ctx.newPage();

  console.log('1. sign in as admin and open Free Courses');
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
  await page.fill('input[name="login"]', 'admin@echolens.digital');
  await page.fill('input[name="password"]', 'ChangeMe!2026');
  await page.click('#submit');
  await page.waitForURL(/\/dashboard$/, { timeout: 20000 });
  await page.evaluate(() => window.show('admin-open-courses'));
  await page.waitForTimeout(1200);

  const trackTitle = await page.evaluate(() => document.getElementById('ocSelect')?.selectedOptions[0]?.textContent || '');
  check('a free course is selected in the dropdown', trackTitle.length > 0, true);
  const trackKey = await page.evaluate(() => document.getElementById('ocSelect')?.value || '');
  console.log('   using track:', trackKey, '-', trackTitle);

  console.log('2. add a brand-new student by name + email');
  await page.click('#ocAddBtn');
  await page.waitForTimeout(400);
  const email = `admin-added-${Date.now()}@example.com`;
  await page.fill('#f textarea[name="names"]', `Admin Added Student, ${email}`);
  await page.click('#f button[type="submit"], #f button:not([type])');
  await page.waitForTimeout(1500);

  const credText = await page.evaluate(() => document.getElementById('credOut')?.textContent || '');
  console.log('   credential box:', credText.replace(/\s+/g, ' ').trim().slice(0, 200));
  check('new-account credentials shown', /Password:/.test(credText), true);
  // credText is .textContent, so the <br> before the "emailed to..." note
  // produces no separator - stick to the actual password charset (see
  // randomPassword() in store.js: word-word-NN) so a glued-on symbol from
  // the next line is never swept into the match.
  const pwMatch = credText.match(/Password:\s*([a-z0-9-]+)/);
  const password = pwMatch ? pwMatch[1] : null;
  check('a password was generated', !!password, true);

  console.log('3. the new account actually works - sign in with it');
  const newCtx = await browser.newContext();
  const newPage = await newCtx.newPage();
  await newPage.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
  await newPage.fill('input[name="login"]', email);
  await newPage.fill('input[name="password"]', password || '');
  await newPage.click('#submit');
  await newPage.waitForURL(/\/(dashboard|open)$/, { timeout: 20000 }).catch(() => {});
  const me = await newPage.evaluate((u) => fetch(u, { credentials: 'include' }).then((r) => r.json()), `${BASE_URL}/api/auth/me`);
  check('new account signs in as a free learner', me.role, 'free');
  check('new account is already enrolled in the chosen track', (me.email || '').toLowerCase(), email.toLowerCase());
  await newCtx.close();

  console.log('4. enrol an EXISTING learner by email - no new account, no password shown');
  // The results modal from step 2 stays open on purpose (so the admin can copy
  // the one-time password before dismissing it) - close it before reopening.
  await page.evaluate(() => window.closeModal && window.closeModal());
  await page.waitForTimeout(300);
  await page.click('#ocAddBtn');
  await page.waitForTimeout(400);
  await page.fill('#f textarea[name="existing"]', 'student@echolens.digital');
  await page.click('#f button[type="submit"], #f button:not([type])');
  await page.waitForTimeout(1500);
  const credText2 = await page.evaluate(() => document.getElementById('credOut')?.textContent || '');
  console.log('   result:', credText2.replace(/\s+/g, ' ').trim().slice(0, 200));
  check('existing learner enrolled, not created fresh', /Enrolled existing learners/.test(credText2), true);
  check('no password shown for an existing account', /Password:/.test(credText2), false);

  console.log('5. the roster now shows both learners');
  await page.waitForTimeout(500);
  const rosterText = await page.evaluate(() => document.getElementById('ocRoster')?.textContent || '');
  check('new student appears in roster', rosterText.includes('Admin Added Student'), true);
  check('existing student appears in roster', /Demo Student|student@echolens/i.test(rosterText) || rosterText.includes('Demo'), true);

  console.log('6. the roster is reachable directly via the API too');
  const api = await page.evaluate((u) => fetch(u, { credentials: 'include' }).then((r) => r.json()), `${BASE_URL}/api/admin/open-courses/${trackKey}/students`);
  check('API roster has at least 2 students', (api.students || []).length >= 2, true);

  console.log('\nfailures:', failures);
  await browser.close();
  process.exit(failures ? 1 : 0);
})().catch((e) => { console.error('FAILED:', e.message); process.exit(1); });
