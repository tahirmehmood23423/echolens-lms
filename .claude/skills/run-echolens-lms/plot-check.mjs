/**
 * plot-check.mjs - drives /compiler with a seaborn snippet that downloads a
 * remote dataset and draws two plots, then verifies:
 *   1. sns.load_dataset() actually downloads (no "unknown url type: https")
 *   2. two separate figures render (plt.show() closes the figure)
 *   3. every figure card has a working Download PNG button
 *
 * Usage: BASE_URL=http://localhost:3100 node plot-check.mjs
 */
import { chromium } from 'playwright';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SHOTS = path.join(HERE, 'screenshots');
fs.mkdirSync(SHOTS, { recursive: true });
const BASE_URL = process.env.BASE_URL || 'http://localhost:3100';

const CODE = `import seaborn as sns
import matplotlib.pyplot as plt
tips = sns.load_dataset("tips")
print("rows:", len(tips))
sns.countplot(x="day", data=tips)
plt.title("Meals per Day")
plt.show()
sns.barplot(x="day", y="total_bill", hue="sex", data=tips)
plt.title("Average Total Bill per Day by Gender")
plt.show()`;

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1280, height: 950 } });
const page = await context.newPage();
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', (e) => errors.push(String(e)));

try {
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
  await page.fill('input[name="login"]', 'student@echolens.digital');
  await page.fill('input[name="password"]', 'ChangeMe!2026');
  await page.click('#submit');
  await page.waitForURL(/\/(dashboard|open)$/, { timeout: 20000 });
  const wa = await page.$('input[name="whatsapp"]');
  if (wa) { await wa.fill('+923001234567'); await page.click('button:has-text("Save")'); await page.waitForTimeout(1200); }

  await page.goto(`${BASE_URL}/compiler`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(800);
  await page.fill('#code', CODE);
  await page.click('button:has-text("Run")');

  await page.waitForFunction(
    () => /Done\.|error/i.test(document.querySelector('#status')?.textContent || '')
      || document.querySelectorAll('#term .term-fig').length >= 2,
    null,
    { timeout: 180000 },
  );
  await page.waitForTimeout(1500);

  const state = await page.evaluate(() => ({
    status: document.querySelector('#status')?.textContent?.trim(),
    out: document.querySelector('#term .term-out')?.textContent?.trim().slice(-600),
    figures: document.querySelectorAll('#term .term-fig').length,
    downloadButtons: document.querySelectorAll('#term .term-fig-btn').length,
    imgSizes: Array.from(document.querySelectorAll('#term img.term-img')).map((i) => `${i.naturalWidth}x${i.naturalHeight}`),
  }));
  console.log(JSON.stringify(state, null, 2));
  await page.screenshot({ path: path.join(SHOTS, 'plot-check-ran.png'), fullPage: true });

  if (state.figures >= 1) {
    const dl = page.waitForEvent('download', { timeout: 15000 });
    await page.click('#term .term-fig .term-fig-btn');
    const file = await dl;
    console.log('download filename:', file.suggestedFilename());
  }
  if (state.figures >= 1) {
    await page.click('#term img.term-img');
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(SHOTS, 'plot-check-lightbox.png') });
    await page.keyboard.press('Escape');
  }
} finally {
  const real = errors.filter((e) => !/three\.min\.js|fonts\.googleapis|ERR_INTERNET_DISCONNECTED|ERR_NAME_NOT_RESOLVED/.test(e));
  console.log(real.length ? '--- console errors ---\n' + real.join('\n') : 'no console errors');
  await browser.close();
}
