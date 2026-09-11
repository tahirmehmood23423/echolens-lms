#!/usr/bin/env node
'use strict';
/**
 * Drives the course-pacing / trending-tech / profile work end to end:
 *   1. /open free-course view - the six trending-tech tracks now render as
 *      cards in front instead of hiding behind the "Trending Tech" button.
 *   2. A staged tech course page - "Reserve your seat" instead of a dead
 *      "Coming soon" button, and the reservation actually sticks.
 *   3. The learner profile - four tabbed panels, "My courses" showing slots,
 *      progress and the reserved seat.
 *
 * Usage: BASE_URL=http://localhost:3100 node pacing-check.mjs
 */
import { chromium } from 'playwright';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SHOTS = path.join(HERE, 'screenshots');
fs.mkdirSync(SHOTS, { recursive: true });
const BASE_URL = process.env.BASE_URL || 'http://localhost:3100';

const shot = async (page, name) => {
  await page.screenshot({ path: path.join(SHOTS, `${name}.png`), fullPage: true });
  console.log('  screenshot:', `${name}.png`);
};
const errors = [];

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await ctx.newPage();
  page.on('console', (m) => { if (m.type() === 'error' && !/cdnjs|three|fonts\.g/.test(m.text())) errors.push(m.text()); });
  page.on('pageerror', (e) => { if (!/cdnjs|three/.test(String(e))) errors.push('pageerror: ' + e.message); });

  // ---- sign in as the seeded student (a learner, so enrolment is allowed) ----
  console.log('1. signing in');
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
  await page.fill('input[name="login"]', 'student@echolens.digital');
  await page.fill('input[name="password"]', 'ChangeMe!2026');
  await page.click('#submit');
  await page.waitForURL(/\/(dashboard|open)$/, { timeout: 20000 });
  const waInput = page.locator('input[name="whatsapp"]');
  if (await waInput.isVisible({ timeout: 2500 }).catch(() => false)) {
    await waInput.fill('0300-0000000');
    await page.click('#waForm button');
    await page.waitForSelector('input[name="whatsapp"]', { state: 'hidden', timeout: 8000 }).catch(() => {});
  }

  // ---- 1. free-course catalogue: are the tech tracks in front? ----
  console.log('2. free-course catalogue');
  await page.goto(`${BASE_URL}/open#free`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);
  const freePill = await page.$('button.filt-pill:has-text("Free courses")');
  if (freePill) { await freePill.click(); await page.waitForTimeout(1500); }
  const techHead = await page.$('.tech-front-head h4');
  console.log('   trending-tech section present:', !!techHead);
  const techCards = await page.$$('.tech-front .oc-card');
  console.log('   tech cards rendered in front:', techCards.length);
  await shot(page, 'pacing-1-catalogue');

  // ---- 2. a staged tech course: reserve a seat ----
  console.log('3. staged tech course page');
  const firstTech = await page.$('.tech-front .oc-card');
  if (!firstTech) throw new Error('no trending-tech card on the free-course view');
  await firstTech.click();
  await page.waitForTimeout(2500);
  await shot(page, 'pacing-2-coming-soon');
  const ctaText = (await page.textContent('.curr-cta .btn').catch(() => '')) || '';
  console.log('   CTA button reads:', JSON.stringify(ctaText.trim()));

  if (/Reserve/i.test(ctaText)) {
    await page.click('.curr-cta .btn');
    await page.waitForTimeout(2500);
    const after = (await page.textContent('.curr-cta .btn').catch(() => '')) || '';
    console.log('   after reserving, CTA reads:', JSON.stringify(after.trim()));
    await shot(page, 'pacing-3-reserved');
  } else {
    console.log('   !! expected a Reserve CTA');
  }

  // ---- 3. the profile panels ----
  console.log('4. profile');
  await page.goto(`${BASE_URL}/open#profile`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);
  const tabs = await page.$$eval('.prof-tab', (els) => els.map((e) => e.textContent.trim()));
  console.log('   profile tabs:', tabs.join(' | ') || '(none)');
  const reserved = await page.$$('.prof-course.reserved');
  console.log('   reserved seats shown:', reserved.length);
  await shot(page, 'pacing-4-profile-courses');

  for (const t of ['achievements', 'activity', 'account']) {
    const tab = await page.$(`#profTab-${t}`);
    if (!tab) { console.log(`   !! missing tab ${t}`); continue; }
    await tab.click();
    await page.waitForTimeout(700);
    const visible = await page.$eval(`#profPanel-${t}`, (el) => !el.hidden).catch(() => false);
    console.log(`   tab ${t} shows its panel:`, visible);
  }
  await shot(page, 'pacing-5-profile-account');

  // ---- 4. enrol in a real free course and look at module locking ----
  console.log('5. free course module locking');
  await page.goto(`${BASE_URL}/open#free`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);
  const cBtn = await page.$('.oc-lang-btn');
  if (cBtn) {
    await cBtn.click();
    await page.waitForTimeout(1200);
    const card = await page.$('.oc-card');
    if (card) {
      await card.click();
      await page.waitForTimeout(2500);
      const enroll = await page.$('.curr-cta .btn');
      const label = enroll ? (await enroll.textContent()).trim() : '';
      console.log('   course CTA:', JSON.stringify(label));
      if (/Enroll/i.test(label)) { await enroll.click(); await page.waitForTimeout(3000); }
      const locked = await page.$$('.curr-row-locked');
      console.log('   locked module rows:', locked.length);
      const firstLockedText = locked.length ? (await locked[0].textContent()).replace(/\s+/g, ' ').trim().slice(0, 120) : '';
      if (firstLockedText) console.log('   first locked row:', firstLockedText);
      await shot(page, 'pacing-6-module-locking');
    }
  }

  console.log('\nconsole/page errors:', errors.length ? '\n  ' + errors.join('\n  ') : 'none');
  await browser.close();
})().catch((e) => { console.error('FAILED:', e.message); process.exit(1); });
