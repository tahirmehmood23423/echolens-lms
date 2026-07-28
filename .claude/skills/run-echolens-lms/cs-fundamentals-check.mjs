#!/usr/bin/env node
'use strict';
/**
 * One-off verification for the new CS-101..CS-107 free courses and the new
 * web-mode (HTML/CSS/JS live preview) compiler support in open.js. Not a
 * permanent flow - ad hoc check, safe to delete after use.
 */
import { chromium } from 'playwright';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SHOTS = path.join(HERE, 'screenshots');
fs.mkdirSync(SHOTS, { recursive: true });
const BASE_URL = process.env.BASE_URL || 'http://localhost:3100';

async function shot(page, name) {
  const file = path.join(SHOTS, `${name}.png`);
  await page.screenshot({ path: file, fullPage: true });
  console.log('screenshot:', path.relative(HERE, file));
}

async function run() {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });

  try {
    // Sign in as the seeded student (open tracks accept 'student' or 'free' roles).
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
    await page.fill('input[name="login"]', 'student@echolens.digital');
    await page.fill('input[name="password"]', 'ChangeMe!2026');
    await page.click('#submit');
    await page.waitForURL(/\/(dashboard|open)$/, { timeout: 15000 });
    const waInput = page.locator('input[name="whatsapp"]');
    if (await waInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await waInput.fill('0300-0000000');
      await page.click('#waForm button');
      await page.waitForSelector('input[name="whatsapp"]', { state: 'hidden', timeout: 5000 });
    }

    await page.goto(`${BASE_URL}/open#courses`, { waitUntil: 'domcontentloaded' });
    // CATALOGUE is a module-scoped `let` in open.js, not window.CATALOGUE
    // (plain <script>, not a module - top-level let/const never attaches to
    // window) - wait on the actual rendered DOM instead of the JS variable.
    await page.waitForSelector('#courseTable .oc-grid, #courseTable .empty', { timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(500);
    await shot(page, 'csf-01-courses-tab');

    const wantedTitles = ['CS-101', 'CS-102', 'CS-103', 'CS-104', 'CS-105', 'CS-106', 'CS-107'];
    const tableText = await page.locator('#courseTable').innerText().catch(() => '(#courseTable not found)');
    console.log('#courseTable text length:', tableText.length);
    for (const w of wantedTitles) {
      console.log(w, 'appears in #courseTable:', tableText.includes(w));
    }
    // Sanity check: does an EXISTING, already-working course show up? If not,
    // the whole catalogue tab is broken in this test run, not just mine.
    console.log('known existing course (BC-01) appears in #courseTable:', tableText.includes('BC-01'));

    // Jump straight to CS-106 (CSS), task 1 - avoids fragile UI click-hunting
    // through the catalogue for a one-off verification.
    const opened = await page.evaluate(async () => { try { await openCourse('cs106-css'); return true; } catch (e) { return 'ERR:' + e.message; } });
    console.log('openCourse(cs106-css):', opened);
    await page.waitForTimeout(800);
    await page.evaluate(() => openSolve(1, 1));
    await page.waitForTimeout(800);
    await shot(page, 'csf-02-cs106-task1');

    const langValue = await page.locator('#svLang').inputValue().catch(() => null);
    console.log('CS-106 task1 default language dropdown value:', langValue);
    const noteText = await page.locator('.qide-note').innerText().catch(() => '(not found)');
    console.log('CS-106 grading note text:', JSON.stringify(noteText));

    // Type simple HTML/CSS and Run - confirm the live preview iframe renders it.
    await page.fill('#svCode', '<style>body{color:red;font-family:sans-serif}</style><p id="t">Test</p>');
    await page.click('#svRunBtn');
    await page.waitForTimeout(1000);
    await shot(page, 'csf-03-cs106-run');
    const frameHandle = await page.$('#svWebFrame');
    const frame = frameHandle ? await frameHandle.contentFrame() : null;
    const previewText = frame ? await frame.locator('#t').innerText().catch(() => null) : null;
    const previewColor = frame ? await frame.locator('#t').evaluate((el) => getComputedStyle(el).color).catch(() => null) : null;
    console.log('live preview iframe text:', previewText, '| color:', previewColor, '(expect rgb(255, 0, 0))');
    const webWrapVisible = await page.locator('#svWebWrap').isVisible().catch(() => false);
    const termVisible = await page.locator('#svTerm').isVisible().catch(() => false);
    console.log('svWebWrap visible:', webWrapVisible, '| svTerm visible (should be false in web mode):', termVisible);

    // CS-101 (C) sanity check.
    await page.evaluate(async () => { await openCourse('fc01-c-basics'); });
    await page.waitForTimeout(800);
    await page.evaluate(() => openSolve(1, 1));
    await page.waitForTimeout(800);
    await shot(page, 'csf-04-cs101-task1');
    const cLang = await page.locator('#svLang').inputValue().catch(() => null);
    console.log('CS-101 task1 default language dropdown value (expect c):', cLang);
    const cBodyText = await page.evaluate(() => document.body.innerText);
    console.log('CS-101 shows "Environment & Hello World":', cBodyText.includes('Environment & Hello World'));
    console.log('CS-101 shows "Print Greeting":', cBodyText.includes('Print Greeting'));
  } finally {
    await browser.close();
  }

  const real = errors.filter((e) => !/three\.min\.js|fonts\.googleapis|ERR_INTERNET_DISCONNECTED|ERR_NAME_NOT_RESOLVED|emkc\.org|pyodide/.test(e));
  if (real.length) { console.log('--- console/page errors ---'); real.forEach((e) => console.log(e)); }
  else console.log('no console/page errors (excluding blocked external CDN/API calls)');
}

run().catch((err) => { console.error('driver failed:', err.message); process.exit(1); });
