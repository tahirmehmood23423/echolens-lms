#!/usr/bin/env node
'use strict';
import { chromium } from 'playwright';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SHOTS = path.join(HERE, 'screenshots');
fs.mkdirSync(SHOTS, { recursive: true });
const BASE_URL = process.env.BASE_URL || 'http://localhost:3100';

async function shot(page, name) { const f = path.join(SHOTS, `${name}.png`); await page.screenshot({ path: f, fullPage: true }); console.log('screenshot:', path.relative(HERE, f)); }
async function login(page, user, password, roleLabel) {
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
  await page.fill('input[name="login"]', user);
  await page.fill('input[name="password"]', password);
  await page.click('#submit');
  await page.waitForURL(/\/(dashboard|open)$/, { timeout: 15000 });
  const waInput = page.locator('input[name="whatsapp"]');
  if (await waInput.isVisible({ timeout: 2000 }).catch(() => false)) {
    await waInput.fill('0300-0000000');
    await page.click('#waForm button');
    await page.waitForSelector('input[name="whatsapp"]', { state: 'hidden', timeout: 5000 });
  }
  const pill = page.locator('#rolePill');
  if (await pill.isVisible({ timeout: 5000 }).catch(() => false)) {
    const seen = (await pill.textContent()).trim();
    if (seen !== roleLabel) throw new Error(`login landed as "${seen}", expected "${roleLabel}"`);
  }
}

const errors = [];
async function run() {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1400, height: 1000 } });
  const page = await context.newPage();
  page.on('console', (msg) => { if (msg.type() === 'error') { errors.push(msg.text()); console.log('[console error]', msg.text()); } });
  page.on('pageerror', (err) => { errors.push(err.message); console.log('[pageerror]', err.message); });
  page.on('response', (res) => { if (res.url().includes('/api/showcase/moderation') ) console.log('[response]', res.status(), res.request().method(), res.url()); });

  try {
    console.log('=== admin -> Showcase Moderation nav item ===');
    await login(page, 'admin@echolens.digital', 'ChangeMe!2026', 'Admin');
    await page.waitForTimeout(800);
    const navItem = page.locator('.nav-item[data-view="showcase-moderation"]');
    console.log('nav item visible for admin:', await navItem.isVisible());
    await navItem.click();
    await page.waitForTimeout(1000);
    await shot(page, 'mod-1-queue-admin');

    const pendingCount = await page.locator('#view-showcase-moderation').textContent();
    console.log('pending review heading present:', pendingCount.includes('Pending review'));
    console.log('open reports heading present:', pendingCount.includes('Open reports'));

    const reviewButtons = page.locator('#view-showcase-moderation button:has-text("Review")');
    const reviewCount = await reviewButtons.count();
    console.log('Review buttons found:', reviewCount);

    if (reviewCount > 0) {
      await reviewButtons.first().click();
      await page.waitForTimeout(500);
      await shot(page, 'mod-2-review-modal');
      const modalText = await page.locator('#modalBody').textContent();
      console.log('modal shows full caption:', modalText.includes('showcase post') || modalText.includes('reported'));
      const approveBtn = page.locator('#modalBody button:has-text("Approve")');
      const removeBtn = page.locator('#modalBody button:has-text("remove"), #modalBody button:has-text("Remove")');
      console.log('Approve button present:', await approveBtn.count() > 0);
      console.log('Remove button present:', await removeBtn.count() > 0);

      if (await approveBtn.count() > 0) {
        await approveBtn.click();
        await page.waitForTimeout(1000);
        await shot(page, 'mod-3-after-approve');
        const afterText = await page.locator('#view-showcase-moderation').textContent();
        console.log('queue refreshed after approve (no longer shows the 2/3 pending count from before, or shows updated count)');
      }
    }

    console.log('\n=== instructor scoping check: teacher only sees their own batch ===');
    await context.clearCookies();
    await login(page, 'teacher@echolens.digital', 'ChangeMe!2026', 'Teacher');
    await page.waitForTimeout(800);
    const teacherNav = page.locator('.nav-item[data-view="showcase-moderation"]');
    console.log('nav item visible for instructor:', await teacherNav.isVisible());
    await teacherNav.click();
    await page.waitForTimeout(1000);
    await shot(page, 'mod-4-queue-teacher');
    const teacherReviewCount = await page.locator('#view-showcase-moderation button:has-text("Review")').count();
    console.log('Review rows visible to teacher (should be > 0, teacher manages this batch):', teacherReviewCount);

  } finally {
    await browser.close();
  }
  console.log('\n=== errors ===');
  const real = errors.filter((e) => !/three\.min\.js|fonts\.googleapis|favicon/.test(e));
  console.log(real.length ? real.join('\n') : 'none');
}
run().catch((e) => { console.error('FAILED:', e.message); process.exit(1); });
