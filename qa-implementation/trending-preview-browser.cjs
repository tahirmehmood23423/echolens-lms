'use strict';

const assert = require('node:assert/strict');
const path = require('node:path');
const { BASE, launch, context } = require('./browser-lib.cjs');

(async () => {
  const browser = await launch();
  try {
    const ctx = await context(browser, { width: 1440, height: 1000 });
    const page = await ctx.newPage();
    await page.goto(BASE + '/open#free');
    await page.locator('.oc-lang-btn').first().waitFor();
    await page.evaluate(() => selectFreeFamily('trending-tech'));
    await page.waitForFunction(() => document.querySelectorAll('#courseTable .oc-card').length === 6);

    assert.equal(await page.locator('#courseTable .oc-card').count(), 6);
    assert.equal(await page.getByText('COMING SOON', { exact: true }).count(), 6);
    assert.equal(await page.getByRole('button', { name: 'View syllabus' }).count(), 6);
    await page.screenshot({ path: path.join(__dirname, 'evidence', 'trending-tech-coming-soon.png'), fullPage: true, animations: 'disabled' });

    await page.getByRole('button', { name: 'View syllabus' }).first().click();
    await page.locator('.curr-card').waitFor();
    assert.equal(await page.locator('.curr-row').count(), 4);
    assert.equal(await page.locator('.curr-row:disabled').count(), 4);
    assert.equal(await page.getByRole('button', { name: 'Coming soon' }).isDisabled(), true);
    const courseText = await page.locator('#courseHead, #courseLevels').allInnerTexts();
    assert.match(courseText.join('\n'), /Modern Full Stack Development with Next\.js and TypeScript/);
    assert.match(courseText.join('\n'), /Preview all modules, lectures and assessment titles/);
    assert.equal(await page.getByRole('button', { name: 'Enroll for free' }).count(), 0);
    await page.screenshot({ path: path.join(__dirname, 'evidence', 'trending-tech-syllabus-preview.png'), fullPage: true, animations: 'disabled' });
    await ctx.close();
    console.log(JSON.stringify({ catalogue_cards: 6, module_previews: 4, enrollment_locked: true }));
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
