#!/usr/bin/env node
'use strict';
/** One-off check: nav active-state fix (Live Tech vs Free Certified Courses)
 * and confirms a PORTAL (student-role) account can submit an open/free-course
 * problem end to end, not just view it. Ad hoc, safe to delete after use. */
import { chromium } from 'playwright';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SHOTS = path.join(HERE, 'screenshots');
fs.mkdirSync(SHOTS, { recursive: true });
const BASE_URL = process.env.BASE_URL || 'http://localhost:3100';

async function shot(page, name) { await page.screenshot({ path: path.join(SHOTS, `${name}.png`), fullPage: true }); console.log('screenshot:', name); }
async function activeNav(page) {
  return page.evaluate(() => [...document.querySelectorAll('.open-nav .nlink')].filter((n) => n.classList.contains('active')).map((n) => n.textContent.trim()));
}

async function run() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  try {
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
    await page.fill('input[name="login"]', 'student@echolens.digital');
    await page.fill('input[name="password"]', 'ChangeMe!2026');
    await page.click('#submit');
    await page.waitForURL(/\/(dashboard|open)$/, { timeout: 15000 });
    const wa = page.locator('input[name="whatsapp"]');
    if (await wa.isVisible({ timeout: 2000 }).catch(() => false)) { await wa.fill('0300-0000000'); await page.click('#waForm button'); await page.waitForTimeout(800); }

    // 1. Land on the free-filtered courses view via the deep link (what the
    // "Free Certified Courses" nav link and the catalogue's "Free courses"
    // pill both effectively point at) - confirm the RIGHT nav item lights up.
    await page.goto(`${BASE_URL}/open#free`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    console.log('On /open#free, active nav:', JSON.stringify(await activeNav(page)));
    await shot(page, 'nav-01-free-hash');

    // 2. Click the Live Tech Courses nav link directly - confirm it (and
    // only it) becomes active.
    await page.click('.open-nav a:has-text("Live Tech Courses")');
    await page.waitForTimeout(500);
    console.log('After clicking "Live Tech Courses", active nav:', JSON.stringify(await activeNav(page)));

    // 3. Click Free Certified Courses directly.
    await page.click('.open-nav a:has-text("Free Certified Courses")');
    await page.waitForTimeout(500);
    console.log('After clicking "Free Certified Courses", active nav:', JSON.stringify(await activeNav(page)));

    // 4. Open a free course directly (as if from a catalogue card or deep
    // link) and confirm the nav re-syncs to "Free Certified Courses" even
    // though we didn't click that nav link to get there.
    await page.evaluate(() => navCourses('live')); // force it to the WRONG state first
    await page.waitForTimeout(300);
    await page.evaluate(async () => { await openCourse('cs101-does-not-exist').catch(() => {}); });
    await page.evaluate(async () => { await openCourse('fc01-c-basics'); });
    await page.waitForTimeout(800);
    console.log('After openCourse(fc01-c-basics) [a free course], active nav:', JSON.stringify(await activeNav(page)));
    await shot(page, 'nav-02-opened-free-course');

    // 5. PORTAL (student-role) account actually SUBMITTING a free-course
    // problem, not just viewing/running it - the real ask. AI grading is
    // not configured in this scratch env, so this exercises the full
    // request path without hitting a real third-party API.
    await page.evaluate(() => openSolve(1, 1));
    await page.waitForTimeout(600);
    await page.fill('#svCode', 'int main() { printf("Hello, Platform!\\n"); return 0; }');
    const [resp] = await Promise.all([
      page.waitForResponse((r) => r.url().includes('/api/open/submit'), { timeout: 15000 }),
      page.click('#svSubmitBtn'),
    ]);
    console.log('POST /api/open/submit as student-role portal account -> HTTP', resp.status());
    const body = await resp.json().catch(() => null);
    console.log('response body:', JSON.stringify(body));
    await page.waitForTimeout(500);
    await shot(page, 'nav-03-portal-submit-result');
  } finally {
    await browser.close();
  }
}
run().catch((e) => { console.error('failed:', e.message); process.exit(1); });
