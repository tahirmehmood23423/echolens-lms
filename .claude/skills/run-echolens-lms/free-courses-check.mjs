/**
 * free-courses-check.mjs - verifies the redesigned "Free Certified Courses"
 * view (/open#free): no page scroll at 1440x900, symmetric left/right
 * margins, all rows the same width/left edge, and expand/collapse works.
 */
import { chromium } from 'playwright';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SHOTS = path.join(HERE, 'screenshots');
fs.mkdirSync(SHOTS, { recursive: true });
const BASE_URL = process.env.BASE_URL || 'http://localhost:3100';

const browser = await chromium.launch();
const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', (e) => errors.push(String(e)));

await page.goto(`${BASE_URL}/open#free`, { waitUntil: 'networkidle' });
await page.waitForSelector('#fcList .fc-item', { timeout: 20000 });
await page.waitForTimeout(400);

const metrics = await page.evaluate(() => {
  const doc = document.documentElement;
  const items = Array.from(document.querySelectorAll('#fcList .fc-item'));
  const wrap = document.getElementById('appWrap');
  const wrapRect = wrap.getBoundingClientRect();
  const leftGap = wrapRect.left;
  const rightGap = window.innerWidth - wrapRect.right;
  const itemRects = items.map((el) => el.getBoundingClientRect());
  const lefts = new Set(itemRects.map((r) => Math.round(r.left)));
  const widths = new Set(itemRects.map((r) => Math.round(r.width)));
  return {
    scrollHeight: doc.scrollHeight,
    innerHeight: window.innerHeight,
    hasVerticalScroll: doc.scrollHeight > window.innerHeight,
    itemCount: items.length,
    leftGap, rightGap,
    marginsEqual: Math.abs(leftGap - rightGap) < 1,
    distinctLeftEdges: [...lefts],
    distinctWidths: [...widths],
    liveShellDisplay: getComputedStyle(document.getElementById('liveCoursesShell')).display,
    freeShellDisplay: getComputedStyle(document.getElementById('freeCoursesShell')).display,
    navActive: document.querySelector('.nlink[data-catnav="free"]').classList.contains('active'),
  };
});
console.log('metrics:', JSON.stringify(metrics, null, 2));
await page.screenshot({ path: path.join(SHOTS, 'free-courses-collapsed.png') });

// Expand the first module, confirm aria state + inline detail, then expand a
// second one and confirm the first auto-closes (exclusive accordion).
const firstBtn = page.locator('#fcList .fc-item-btn').first();
await firstBtn.click();
await page.waitForTimeout(500);
const afterOpen = await page.evaluate(() => {
  const doc = document.documentElement;
  const item0 = document.getElementById('fc-item-0');
  const btn0 = document.getElementById('fc-btn-0');
  const panel0 = document.getElementById('fc-panel-0');
  return {
    scrollHeight: doc.scrollHeight, innerHeight: window.innerHeight,
    hasVerticalScroll: doc.scrollHeight > window.innerHeight,
    open: item0.classList.contains('open'),
    ariaExpanded: btn0.getAttribute('aria-expanded'),
    panelText: panel0.innerText.slice(0, 400),
    hasStartButton: !!panel0.querySelector('button'),
  };
});
console.log('after open item 0:', JSON.stringify(afterOpen, null, 2));
await page.screenshot({ path: path.join(SHOTS, 'free-courses-expanded.png') });

const secondBtn = page.locator('#fcList .fc-item-btn').nth(1);
await secondBtn.click();
await page.waitForTimeout(500);
const exclusive = await page.evaluate(() => ({
  item0open: document.getElementById('fc-item-0').classList.contains('open'),
  item1open: document.getElementById('fc-item-1').classList.contains('open'),
  item0aria: document.getElementById('fc-btn-0').getAttribute('aria-expanded'),
  item1aria: document.getElementById('fc-btn-1').getAttribute('aria-expanded'),
}));
console.log('exclusive accordion check:', JSON.stringify(exclusive, null, 2));
await page.screenshot({ path: path.join(SHOTS, 'free-courses-exclusive.png') });

// Keyboard: focus a header button and toggle with Enter.
await page.keyboard.press('Escape');
await firstBtn.focus();
await page.keyboard.press('Enter');
await page.waitForTimeout(400);
const kb = await page.evaluate(() => document.getElementById('fc-item-0').classList.contains('open'));
console.log('keyboard toggled item 0 open:', kb);

// Confirm switching back to Live Tech Courses restores the original grid untouched.
await page.click('.nlink[data-catnav="live"]');
await page.waitForTimeout(500);
const liveState = await page.evaluate(() => ({
  liveDisplay: getComputedStyle(document.getElementById('liveCoursesShell')).display,
  freeDisplay: getComputedStyle(document.getElementById('freeCoursesShell')).display,
  hasGrid: !!document.querySelector('#courseTable .oc-grid'),
}));
console.log('live mode state:', JSON.stringify(liveState, null, 2));
await page.screenshot({ path: path.join(SHOTS, 'live-courses-unchanged.png') });

await browser.close();
const real = errors.filter((e) => !/three\.min\.js|fonts\.googleapis|ERR_INTERNET_DISCONNECTED|ERR_NAME_NOT_RESOLVED/.test(e));
console.log(real.length ? '--- console errors ---\n' + real.join('\n') : 'no console errors');
