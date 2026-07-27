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

async function shot(page, name) {
  const file = path.join(SHOTS, `${name}.png`);
  await page.screenshot({ path: file, fullPage: true });
  console.log('screenshot:', path.relative(HERE, file));
}
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
function tinyPngBuffer() {
  // 1x1 red PNG, valid magic bytes - enough for the composer's client-side
  // picker and the server's real magic-byte validator (r2-upload.js).
  return Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
}

const errors = [];
async function run() {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await context.newPage();
  page.on('console', (msg) => { const t = `[console ${msg.type()}] ${msg.text()}`; if (msg.type() === 'error') errors.push(t); console.log(t); });
  page.on('pageerror', (err) => { console.log('[pageerror]', err.message); errors.push(`pageerror: ${err.message}`); });
  page.on('response', (res) => { if (res.url().includes('/api/showcase/posts') && res.request().method() === 'POST') console.log('[response]', res.status(), res.url()); if (res.status() >= 400 && !res.url().includes('favicon')) errors.push(`[HTTP ${res.status()}] ${res.url()}`); });
  page.on('requestfailed', (req) => console.log('[requestfailed]', req.url(), req.failure()?.errorText));

  let publishedPostUrl = null;

  try {
    console.log('\n=== 1. student -> /showcase feed + composer ===');
    await login(page, 'student@echolens.digital', 'ChangeMe!2026', 'Student');
    await page.goto(`${BASE_URL}/showcase`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#feed', { timeout: 10000 });
    await page.waitForTimeout(500);
    await shot(page, 'showcase-1-feed-empty');
    console.log('feed loaded:', await page.locator('#feed').isVisible());

    await page.click('#composeBtn');
    await page.waitForSelector('#scComposerOverlay.open', { timeout: 5000 });
    console.log('composer opened:', await page.locator('#scComposerOverlay').isVisible());
    console.log('picker present:', await page.locator('#scPicker').isVisible());
    console.log('char count present:', (await page.locator('#scCharCount').textContent()).includes('/ 2000'));
    const visOpts = await page.locator('.sc-vis-opt').allTextContents();
    console.log('visibility options:', visOpts);
    console.log('default visibility active:', await page.locator('.sc-vis-opt[data-vis="BATCH"]').evaluate(el => el.classList.contains('active')));
    await shot(page, 'showcase-2-composer-open');

    console.log('\n=== 2. publish a test post ===');
    const pngPath = path.join(HERE, 'test-image.png');
    fs.writeFileSync(pngPath, tinyPngBuffer());
    await page.setInputFiles('#scFileInput', pngPath);
    await page.waitForTimeout(300);
    await shot(page, 'showcase-3-composer-with-image');
    await page.fill('#scCaptionInput', 'A test post from the Playwright showcase check.');
    await page.locator('.sc-vis-opt[data-vis="PUBLIC"]').click(); // so the public teaser check later can work
    await page.click('#scPublishBtn');
    // R2 isn't configured in this test environment (no R2_ACCOUNT_ID etc set),
    // so the backend correctly 503s image uploads - expected here, not a bug.
    // Verify the composer handles that failure correctly (shows the error,
    // stays open, doesn't crash) rather than assuming a successful publish.
    await page.waitForTimeout(1000);
    const stillOpen = await page.locator('#scComposerOverlay.open').count() > 0;
    const msgText = await page.locator('#scComposerMsg').textContent();
    const msgVisible = await page.locator('#scComposerMsg').isVisible();
    console.log('R2 not configured (expected in this test env) -> composer stayed open:', stillOpen, '| error message shown:', msgVisible, JSON.stringify(msgText));
    await shot(page, 'showcase-4-r2-not-configured-error');
    await page.click('#scComposerClose');
    await page.waitForTimeout(300);
    const cardCount = await page.locator('.sc-card').count();
    console.log('cards in feed (expected 0 - publish never completed without R2):', cardCount);

    console.log('\n=== 3. quest workspace: Share to Showcase on a passed, graded level ===');
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    // Drive straight into the course's Quest tab via the app's own global
    // function (openCourse(id, tab) - see dashboard.js) - more reliable
    // than fighting an unrelated layout/visibility quirk in a part of the
    // UI this change never touched.
    await page.evaluate(() => { if (typeof openCourse === 'function') openCourse(1, 'Quest'); });
    await page.waitForTimeout(1000);
    // The passed level (1) renders collapsed by default - only the
    // "current" (still-open) level auto-expands. Expand it to reach its
    // "Open" buttons, same as a real student would click the level header.
    await page.click('#qn1 .qhead');
    await page.waitForTimeout(400);
    await shot(page, 'showcase-6-quest-map');
    {
      const openBtn = page.locator('#qn1 .qproblem .btn-teal:has-text("Open")').first();
      if (await openBtn.count()) {
        await openBtn.click();
        await page.waitForTimeout(800);
        await shot(page, 'showcase-7-task-workspace');
        const workspaceUrl = page.url();

        console.log('running the submission\'s matplotlib code first (Pyodide - real execution, ~10-20s)...');
        await page.click('#runBtn');
        await page.waitForSelector('#taskTerm .term-imgs img', { timeout: 45000 });
        console.log('matplotlib figure rendered in the terminal.');
        await shot(page, 'showcase-7b-after-run-with-plot');

        const shareBtn = page.locator('button:has-text("Share your output to your showcase")');
        console.log('Share button present on task workspace:', await shareBtn.count() > 0);
        if (await shareBtn.count()) {
          await shareBtn.click();
          await page.waitForTimeout(800);
          const stayedOnWorkspace = page.url() === workspaceUrl;
          const composerOpen = await page.locator('#scComposerOverlay.open').count() > 0;
          console.log('mounted IN PLACE (URL unchanged):', stayedOnWorkspace, '| composer open:', composerOpen, '| current url:', page.url());
          const preAttachedCount = await page.locator('#scPicker .sc-picker-slot img').count();
          console.log('images pre-attached in picker from the live blob:', preAttachedCount, preAttachedCount > 0 ? '(SUCCESS - captured automatically)' : '(FAIL - expected the plot to be captured)');
          const questChipText = await page.locator('#scQuestChip').textContent();
          console.log('quest attachment chip:', JSON.stringify(questChipText));
          await shot(page, 'showcase-8-task-composer-with-plot');
          await page.click('#scComposerClose');
        }
      } else {
        console.log('no "Open" button found on quest map - could not reach task workspace');
      }
    }

    if (publishedPostUrl) {
      console.log('\n=== 4. public teaser (signed out) ===');
      const anonContext = await browser.newContext({ viewport: { width: 1400, height: 900 } });
      const anonPage = await anonContext.newPage();
      const resp = await anonPage.goto(publishedPostUrl, { waitUntil: 'domcontentloaded' });
      console.log('teaser HTTP status:', resp.status());
      await anonPage.waitForTimeout(600);
      await shot(anonPage, 'showcase-9-public-teaser');
      const title = await anonPage.title();
      console.log('teaser page title:', title);
      const bodyText = await anonPage.locator('#content').textContent();
      console.log('teaser shows caption:', bodyText.includes('A test post from the Playwright'));
      console.log('teaser shows sign-in CTA:', (await anonPage.locator('a:has-text("Sign in")').count()) > 0);
      await anonContext.close();
    }
  } finally {
    await browser.close();
  }

  const real = errors.filter((e) => !/three\.min\.js|fonts\.googleapis|ERR_INTERNET_DISCONNECTED|ERR_NAME_NOT_RESOLVED|favicon/.test(e));
  console.log('\n=== console/network errors ===');
  if (real.length) real.forEach((e) => console.log(e));
  else console.log('none (excluding blocked external CDN calls)');
}
run().catch((err) => { console.error('test failed:', err.message, err.stack); process.exit(1); });
