#!/usr/bin/env node
'use strict';
/** Verify: (1) FC-03..FC-10 no longer appear anywhere in the catalogue or
 * free-course list; (2) a problem's expanded description actually renders
 * on the task/solve page. Ad hoc, safe to delete after use. */
import { chromium } from 'playwright';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SHOTS = path.join(HERE, 'screenshots');
fs.mkdirSync(SHOTS, { recursive: true });
const BASE_URL = process.env.BASE_URL || 'http://localhost:3101';

async function shot(page, name) { await page.screenshot({ path: path.join(SHOTS, `${name}.png`), fullPage: true }); console.log('screenshot:', name); }

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

    await page.goto(`${BASE_URL}/open`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    // 1. Catalogue via API: confirm removed courses are gone, kept ones remain.
    const cat = await page.evaluate(async () => (await fetch('/api/public/catalogue')).json());
    const codes = (cat.catalogue || []).map((c) => c.code).filter(Boolean);
    const removedStillPresent = ['FC-03', 'FC-04', 'FC-05', 'FC-06', 'FC-07', 'FC-08', 'FC-09', 'FC-10'].filter((c) => codes.includes(c));
    const keptPresent = ['FC-01', 'FC-02', 'CS-103', 'CS-104', 'CS-105', 'CS-106', 'CS-107'].filter((c) => codes.includes(c));
    console.log('Removed courses still present in catalogue (expect none):', removedStillPresent);
    console.log('Kept fundamentals courses present (expect all 7 codes):', keptPresent);

    // 2. Direct track lookup for a removed key should 404/fail.
    const removedTrackResp = await page.evaluate(async () => {
      const r = await fetch('/api/public/tracks/fc03-java-basics');
      return { status: r.status };
    });
    console.log('GET /api/public/tracks/fc03-java-basics ->', removedTrackResp.status, '(expect 404)');

    // 3. Open CS-101 course page and inspect the first task's expanded description.
    await page.evaluate(async () => { await openCourse('fc01-c-basics'); });
    await page.waitForTimeout(800);
    await shot(page, 'desc-01-cs101-course-page');
    await page.evaluate(() => openSolve(1, 1));
    await page.waitForTimeout(600);
    await shot(page, 'desc-02-cs101-task1-solve');
    const descText = await page.locator('#svLeft').innerText();
    console.log('Task 1 description mentions "Write a program" (long-form check):', descText.includes('Write a program'));
    console.log('Description length on page (chars):', descText.length);
  } finally {
    await browser.close();
  }
}
run().catch((e) => { console.error('failed:', e.message); process.exit(1); });
