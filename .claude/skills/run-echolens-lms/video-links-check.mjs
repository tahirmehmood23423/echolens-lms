#!/usr/bin/env node
'use strict';
/** Final verification: video links render on both the course-levels page and
 * the individual task/solve page, for both a "long topic" course (CS-106)
 * and a "short one-line topic" existing course (unaffected). Ad hoc. */
import { chromium } from 'playwright';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SHOTS = path.join(HERE, 'screenshots');
fs.mkdirSync(SHOTS, { recursive: true });
const BASE_URL = process.env.BASE_URL || 'http://localhost:3100';

async function shot(page, name) { await page.screenshot({ path: path.join(SHOTS, `${name}.png`), fullPage: true }); console.log('screenshot:', name); }

async function run() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  try {
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
    await page.fill('input[name="login"]', 'student@echolens.digital');
    await page.fill('input[name="password"]', 'ChangeMe!2026');
    await page.click('#submit');
    await page.waitForURL(/\/(dashboard|open)$/, { timeout: 15000 });
    const wa = page.locator('input[name="whatsapp"]');
    if (await wa.isVisible({ timeout: 2000 }).catch(() => false)) { await wa.fill('0300-0000000'); await page.click('#waForm button'); await page.waitForTimeout(800); }

    // The seeded student account is a portal (paid) role, so login lands on
    // /dashboard by default - openCourse() etc. only exist on /open's script.
    await page.goto(`${BASE_URL}/open`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    // Course-levels page for CS-107 (HTML) - check video links + code block render.
    await page.evaluate(async () => { await openCourse('cs107-html'); });
    await page.waitForTimeout(1000);
    await shot(page, 'vid-01-cs107-course-page');
    const videoLinks = await page.locator('#courseLevels a:has-text("Watch topic video")').count();
    console.log('CS-107 course page: "Watch topic video" links found:', videoLinks, '(expect 10)');
    const firstHref = await page.locator('#courseLevels a:has-text("Watch topic video")').first().getAttribute('href').catch(() => null);
    console.log('First video link href:', firstHref);
    const codeBlockText = await page.locator('#courseLevels pre code').first().innerText().catch(() => null);
    console.log('First code block renders (non-empty):', !!(codeBlockText && codeBlockText.trim().length > 5));

    // Individual task/solve page - video link should also appear there.
    await page.evaluate(() => openSolve(1, 1));
    await page.waitForTimeout(600);
    await shot(page, 'vid-02-cs107-task1-solve');
    const taskVideoLink = await page.locator('#svLeft a:has-text("Watch topic video")').count();
    console.log('CS-107 task/solve page: "Watch topic video" link found:', taskVideoLink, '(expect 1)');

    // Sanity: an existing (non-rewritten) free course, e.g. fc10-regex, should
    // be entirely unaffected (no video_url authored for it, short one-line
    // topic still shows inline as before).
    await page.evaluate(async () => { await openCourse('fc10-regex'); });
    await page.waitForTimeout(1000);
    const oldCourseVideoLinks = await page.locator('#courseLevels a:has-text("Watch topic video")').count();
    console.log('fc10-regex (untouched course) video links (expect 0):', oldCourseVideoLinks);
    const oldTopicVisible = await page.locator('#courseLevels').innerText();
    console.log('fc10-regex still shows its short one-line topic text:', oldTopicVisible.includes('Find any pattern in any text'));
  } finally {
    await browser.close();
  }
  const real = errors.filter((e) => !/three\.min\.js|fonts\.googleapis/.test(e));
  console.log(real.length ? '--- errors ---\n' + real.join('\n') : 'no page errors');
}
run().catch((e) => { console.error('failed:', e.message); process.exit(1); });
