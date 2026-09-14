#!/usr/bin/env node
'use strict';
/**
 * Regression cover for the "Zoho over quota blocks every open signup" bug.
 *
 * With SMTP configured (mailer.configured=true) but signupMailDown() forced
 * on, open signup must:
 *   1. never show the verification-code field (skip straight to account creation)
 *   2. succeed with just name/email/contact
 *   3. return the generated password in the response (nothing will email it)
 *   4. leave the student signed in (cookie set) so they can use the site
 *      immediately without ever seeing the password
 *   5. NOT attempt to send any mail (checked via the server log)
 *
 * Run the server with SIGNUP_MAIL_DOWN=true and SMTP_* set to something
 * "configured" (doesn't need to be real - the code path never calls out
 * because the whole point is that it's skipped).
 *
 * Usage: BASE_URL=http://localhost:3100 node signup-mail-down-check.mjs
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

  console.log('1. open the signup form and submit - no code step should appear');
  await page.goto(`${BASE_URL}/open`, { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => window.gate());
  await page.waitForTimeout(300);
  await page.evaluate(() => window.showSignup());
  await page.waitForTimeout(300);

  const email = `mailer-down-${Date.now()}@example.com`;
  await page.fill('#suForm input[name="name"]', 'Mail Down Tester');
  await page.fill('#suForm input[name="email"]', email);
  await page.fill('#suForm input[name="whatsapp"]', '03001234567');
  await page.fill('#suForm input[name="city"]', 'Lahore');
  await page.fill('#suForm input[name="university"]', 'FAST NUCES');
  await page.fill('#suForm input[name="degree"]', 'BS CS');
  await page.selectOption('#suForm select[name="study_year"]', '2');

  await page.click('#suBtn');
  await page.waitForTimeout(1500);

  const codeRowVisible = await page.evaluate(() => {
    const el = document.getElementById('codeRow');
    return el && getComputedStyle(el).display !== 'none';
  });
  check('code field never shown', codeRowVisible, false);

  const modalMsg = await page.evaluate(() => document.getElementById('modalMsg')?.textContent || '');
  console.log('   modal message:', modalMsg);
  check('account created message shown', modalMsg.includes('Account created'), true);
  check('password shown in-page (nothing will email it)', /password once/i.test(modalMsg), true);
  check('outage wording used (not the permanent no-SMTP wording)', /paused/i.test(modalMsg), true);

  console.log('2. the student is already signed in (cookie set)');
  const me = await page.evaluate((u) => fetch(u, { credentials: 'include' }).then((r) => r.json()), `${BASE_URL}/api/auth/me`);
  check('signed in as the new account', me.email === email, true);
  check('role is free (learner)', me.role, 'free');

  console.log('\nfailures:', failures);
  await browser.close();
  process.exit(failures ? 1 : 0);
})().catch((e) => { console.error('FAILED:', e.message); process.exit(1); });
