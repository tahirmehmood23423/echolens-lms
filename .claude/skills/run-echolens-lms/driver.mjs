#!/usr/bin/env node
'use strict';
/**
 * Playwright driver for EchoLens LMS (chromium-cli is not available in this
 * environment, so this script is the equivalent hand-rolled harness).
 *
 * Usage:
 *   node driver.mjs <flow> [baseUrl]
 *
 * Flows:
 *   smoke        - sign in as each seeded role, hit their landing view, screenshot (default)
 *   student      - sign in as the demo student, click through dashboard nav, screenshot each view
 *   teacher      - sign in as the demo teacher, screenshot the dashboard
 *   admin        - sign in as admin, screenshot People + Analytics
 *   open         - screenshot the public /open portal (no auth)
 *   compiler     - sign in as student, open /compiler, run a snippet, screenshot output
 *
 * Screenshots are written to ./screenshots/<flow>-<step>.png (relative to this
 * driver's directory).
 *
 * Env:
 *   BASE_URL   - defaults to http://localhost:3100
 */
import { chromium } from 'playwright';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SHOTS = path.join(HERE, 'screenshots');
fs.mkdirSync(SHOTS, { recursive: true });

const BASE_URL = process.env.BASE_URL || 'http://localhost:3100';
const FLOW = process.argv[2] || 'smoke';

const ACCOUNTS = {
  admin: { login: 'admin@echolens.digital', password: 'ChangeMe!2026', roleLabel: 'Admin' },
  teacher: { login: 'teacher@echolens.digital', password: 'ChangeMe!2026', roleLabel: 'Teacher' },
  coordinator: { login: 'coordinator@echolens.digital', password: 'ChangeMe!2026', roleLabel: 'Coordinator' },
  student: { login: 'student@echolens.digital', password: 'ChangeMe!2026', roleLabel: 'Student' },
};

async function shot(page, name) {
  const file = path.join(SHOTS, `${name}.png`);
  await page.screenshot({ path: file, fullPage: true });
  console.log('screenshot:', path.relative(HERE, file));
}

async function login(page, role) {
  const { login: user, password, roleLabel } = ACCOUNTS[role];
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
  await page.fill('input[name="login"]', user);
  await page.fill('input[name="password"]', password);
  await page.click('#submit');
  await page.waitForURL(/\/(dashboard|open)$/, { timeout: 15000 });
  // Student/free accounts are gated by a non-dismissable "WhatsApp number"
  // modal on first login (dashboard.js requireWhatsapp()) - fill it or every
  // later click on this page just hits the overlay.
  const waInput = page.locator('input[name="whatsapp"]');
  if (await waInput.isVisible({ timeout: 2000 }).catch(() => false)) {
    await waInput.fill('0300-0000000');
    await page.click('#waForm button');
    await page.waitForSelector('input[name="whatsapp"]', { state: 'hidden', timeout: 5000 });
  }
  // Guard against a stale session: /login redirects away immediately if a
  // valid cookie already exists (see public/js/login.js), which would land
  // us on the PREVIOUS role's dashboard with no error. Confirm the role
  // pill actually matches who we meant to sign in as.
  const pill = page.locator('#rolePill');
  if (await pill.isVisible({ timeout: 5000 }).catch(() => false)) {
    const seen = (await pill.textContent()).trim();
    if (seen !== roleLabel) throw new Error(`login(${role}) landed as "${seen}", expected "${roleLabel}" - stale session cookie?`);
  }
}

async function run() {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await context.newPage();
  const errors = [];
  page.on('console', (msg) => { if (msg.type() === 'error') errors.push(`[${page.url()}] ${msg.text()}`); });
  page.on('pageerror', (err) => errors.push(`[${page.url()}] pageerror: ${err.message}`));

  try {
    if (FLOW === 'smoke') {
      for (const role of ['admin', 'teacher', 'student']) {
        await login(page, role);
        await page.waitForTimeout(500);
        await shot(page, `smoke-${role}`);
        // Clear the session cookie directly rather than clicking "Sign out" -
        // more robust than depending on that button's selector staying put,
        // and login()'s role-pill assertion would otherwise be the only
        // thing catching a leftover session before the next iteration.
        await context.clearCookies();
      }
    } else if (FLOW === 'student') {
      await login(page, 'student');
      await shot(page, 'student-overview');
      await page.click('.nav-item[data-view="courses"]');
      await page.waitForTimeout(500);
      await shot(page, 'student-courses');
      await page.click('.nav-item[data-view="challenges"]');
      await page.waitForTimeout(500);
      await shot(page, 'student-challenges');
      await page.click('.nav-item[data-view="profile"]');
      await page.waitForTimeout(500);
      await shot(page, 'student-profile');
    } else if (FLOW === 'teacher') {
      await login(page, 'teacher');
      await shot(page, 'teacher-overview');
      await page.click('.nav-item[data-view="courses"]');
      await page.waitForTimeout(500);
      await shot(page, 'teacher-courses');
    } else if (FLOW === 'admin') {
      await login(page, 'admin');
      await shot(page, 'admin-overview');
      await page.click('.nav-item[data-view="admin-users"]');
      await page.waitForTimeout(500);
      await shot(page, 'admin-people');
      await page.click('.nav-item[data-view="admin-analytics"]');
      await page.waitForTimeout(800);
      await shot(page, 'admin-analytics');
    } else if (FLOW === 'open') {
      await page.goto(`${BASE_URL}/open`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(800);
      await shot(page, 'open-portal');
    } else if (FLOW === 'compiler') {
      await login(page, 'student');
      await page.goto(`${BASE_URL}/compiler`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1000);
      await shot(page, 'compiler-loaded');
      // Python runs via Pyodide loaded from a CDN in the browser - first
      // run takes ~10-15s while the runtime downloads, no server involved.
      await page.click('button:has-text("Run")');
      await page.waitForSelector('text=Hello EchoLens!', { timeout: 30000 });
      await shot(page, 'compiler-ran');
    } else {
      throw new Error(`Unknown flow "${FLOW}". Use one of: smoke, student, teacher, admin, open, compiler.`);
    }
  } finally {
    await browser.close();
  }

  const real = errors.filter((e) => !/three\.min\.js|fonts\.googleapis|ERR_INTERNET_DISCONNECTED|ERR_NAME_NOT_RESOLVED/.test(e));
  if (real.length) {
    console.log('--- console/page errors ---');
    real.forEach((e) => console.log(e));
  } else {
    console.log('no console/page errors (excluding blocked external CDN calls)');
  }
}

run().catch((err) => { console.error('driver failed:', err.message); process.exit(1); });
