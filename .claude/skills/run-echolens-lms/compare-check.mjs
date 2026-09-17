// Checks the /open free-vs-paid comparison landing: renders at desktop and
// phone widths, and Back/Forward retrace compare -> free -> paid correctly.
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const BASE = process.env.BASE_URL || 'http://localhost:3100';
const OUT = join(dirname(fileURLToPath(import.meta.url)), 'screenshots');
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 1200 } });
const page = await ctx.newPage();
const errors = [];
page.on('console', (m) => { if (m.type() === 'error' && !/cdnjs|three/.test(m.text())) errors.push(m.text()); });
page.on('pageerror', (e) => errors.push(String(e)));

const shot = (name, full = true) => page.screenshot({ path: join(OUT, `compare-${name}.png`), fullPage: full });
const view = async () => page.evaluate(() => {
  const shown = [...document.querySelectorAll('section[id^="tab-"]')].filter((s) => s.style.display !== 'none').map((s) => s.id);
  return { hash: location.hash, shown, nav: document.querySelector('.open-nav .nlink.active')?.textContent.trim() };
});

await page.goto(BASE + '/open', { waitUntil: 'networkidle' });
console.log('landing        ', await view());
await shot('1440');

await page.click('#cmpTabPaid');
await page.waitForTimeout(300);
console.log('toggle paid    ', await view(), await page.getAttribute('#cmpGrid', 'class'));

await page.click('#cmpCardPaid .btn-primary');
await page.waitForTimeout(600);
console.log('-> paid catalog', await view());
await shot('paid-catalogue');

await page.goBack(); await page.waitForTimeout(600);
console.log('back           ', await view());
await page.goForward(); await page.waitForTimeout(600);
console.log('forward        ', await view());
await page.goBack(); await page.waitForTimeout(600);

await page.click('#cmpCardFree .btn-ghost');
await page.waitForTimeout(600);
console.log('-> free catalog', await view());
await page.goBack(); await page.waitForTimeout(600);
console.log('back to compare', await view());

await page.click('.open-nav .nlink[data-tab="events"]');
await page.waitForTimeout(500);
await page.click('.open-nav .nlink[data-tab="compare"]');
await page.waitForTimeout(500);
console.log('nav round-trip ', await view());

await page.setViewportSize({ width: 480, height: 1000 });
await page.waitForTimeout(400);
await shot('480');
await page.click('#cmpTabPaid');
await page.waitForTimeout(500);
await shot('480-paid');

console.log(errors.length ? 'CONSOLE ERRORS: ' + errors.join(' | ') : 'no console errors');
await browser.close();
