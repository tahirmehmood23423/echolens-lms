import { chromium } from 'playwright';
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

// 1. Open web: registration modal survives outside clicks, closes on X
await page.goto('http://localhost:3200/open#register', { waitUntil: 'networkidle' });
await page.waitForTimeout(2000);
const isOpen = () => page.evaluate(() => document.getElementById('modal').classList.contains('open'));
console.log('modal open:', await isOpen());
await page.mouse.click(100, 500); // click the backdrop, far outside the card
await page.waitForTimeout(400);
console.log('after outside click still open:', await isOpen());
await page.mouse.click(100, 100); // another outside click near the nav area
await page.waitForTimeout(400);
console.log('after second outside click still open:', await isOpen());
await page.click('#modal .close');
await page.waitForTimeout(300);
console.log('after clicking X closed:', !(await isOpen()));

// 2. LMS portal: same check on a dashboard modal (change-password from settings)
await page.goto('http://localhost:3200/login', { waitUntil: 'networkidle' });
await page.fill('input[name="login"], #login', 'admin@echolens.digital');
await page.fill('input[name="password"], #password', 'ChangeMe!2026');
await page.click('button[type="submit"]');
await page.waitForURL(/\/dashboard/, { timeout: 15000 });
await page.waitForTimeout(1500);
await page.click('.nav-item[data-view="settings"]');
await page.waitForTimeout(1000);
await page.evaluate(() => formPassword());
await page.waitForTimeout(400);
console.log('dashboard modal open:', await isOpen());
await page.mouse.click(120, 600);
await page.waitForTimeout(400);
console.log('dashboard after outside click still open:', await isOpen());
await page.click('#modal .close');
await page.waitForTimeout(300);
console.log('dashboard after X closed:', !(await isOpen()));
await browser.close();
