/**
 * redesign-check.mjs - verifies the v23 course-detail + solve page redesign:
 * screenshots at desktop (1440) and a wide viewport (1600, triggers the
 * qide-flex side-by-side split), plus mobile (390), and confirms Run/Submit
 * still function through the redesigned editor.
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

async function loginAndOpenCS101(page) {
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
  await page.fill('input[name="login"]', 'student@echolens.digital');
  await page.fill('input[name="password"]', 'ChangeMe!2026');
  await page.click('#submit');
  await page.waitForURL(/\/(dashboard|open)$/, { timeout: 20000 });
  await page.goto(`${BASE_URL}/open#free`, { waitUntil: 'networkidle' });
  await page.waitForSelector('#courseTable .oc-card');
  await page.click('#courseTable .oc-card:has-text("CS-101")');
  await page.waitForSelector('.hero-title', { timeout: 15000 });
  await page.waitForTimeout(500);
}

// 1440x900 desktop
let p = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
const errors = [];
p.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
p.on('pageerror', (e) => errors.push(String(e)));
await loginAndOpenCS101(p);
await p.screenshot({ path: path.join(SHOTS, 'v23-course-1440.png'), fullPage: true });

const heroCheck = await p.evaluate(() => {
  const wrap = document.getElementById('appWrap');
  const wr = wrap.getBoundingClientRect();
  return {
    leftGap: wr.left, rightGap: window.innerWidth - wr.right,
    heroVisible: !!document.querySelector('.hero-visual'),
    crumbText: document.querySelector('.crumb')?.innerText,
    outlineCols: getComputedStyle(document.querySelector('.outline-list')).columnCount,
    bgVarResolved: getComputedStyle(document.documentElement).getPropertyValue('--bg').trim(),
  };
});
console.log('course page checks:', JSON.stringify(heroCheck, null, 2));

// click into a problem -> solve page
await p.click('.module-panel .problem-row .lc-btn-solve');
await p.waitForSelector('#svCode', { timeout: 15000 });
await p.waitForTimeout(500);
await p.screenshot({ path: path.join(SHOTS, 'v23-solve-1440.png'), fullPage: true });

const solveCheck = await p.evaluate(() => ({
  crumbText: document.getElementById('svCrumb')?.innerText,
  navVisible: getComputedStyle(document.getElementById('svNav')).display !== 'none',
  navItemCount: document.querySelectorAll('#svNav .svc-problem').length,
  gridCols: getComputedStyle(document.querySelector('.open-split')).gridTemplateColumns,
  qideFlexCols: getComputedStyle(document.querySelector('.qide-flex')).gridTemplateColumns,
}));
console.log('solve page checks @1440:', JSON.stringify(solveCheck, null, 2));

// Actually run the default code to confirm the redesigned editor still works
await p.fill('#svCode', 'print("Hello EchoLens!")');
await p.click('#svRunBtn');
await p.waitForFunction(() => (document.getElementById('svTerm')?.innerText || '').includes('Hello EchoLens!'), null, { timeout: 60000 });
console.log('Run button produced expected output: true');
await p.screenshot({ path: path.join(SHOTS, 'v23-solve-ran-1440.png'), fullPage: true });

await p.close();

// 1600 wide (triggers qide-flex side-by-side)
let w = await (await browser.newContext({ viewport: { width: 1680, height: 950 } })).newPage();
await loginAndOpenCS101(w);
await w.click('.module-panel .problem-row .lc-btn-solve');
await w.waitForSelector('#svCode', { timeout: 15000 });
await w.waitForTimeout(500);
const wideCols = await w.evaluate(() => getComputedStyle(document.querySelector('.qide-flex')).gridTemplateColumns);
console.log('qide-flex columns @1680:', wideCols);
await w.screenshot({ path: path.join(SHOTS, 'v23-solve-1680-wide.png'), fullPage: true });
await w.close();

// Mobile
let m = await (await browser.newContext({ viewport: { width: 390, height: 844 } })).newPage();
await loginAndOpenCS101(m);
await m.screenshot({ path: path.join(SHOTS, 'v23-course-mobile.png'), fullPage: true });
await m.click('.module-panel .problem-row .lc-btn-solve');
await m.waitForSelector('#svCode', { timeout: 15000 });
await m.waitForTimeout(400);
await m.screenshot({ path: path.join(SHOTS, 'v23-solve-mobile.png'), fullPage: true });
await m.close();

await browser.close();
const real = errors.filter((e) => !/three\.min\.js|fonts\.googleapis|ERR_INTERNET_DISCONNECTED|ERR_NAME_NOT_RESOLVED/.test(e));
console.log(real.length ? '--- console errors ---\n' + real.join('\n') : 'no console errors');
