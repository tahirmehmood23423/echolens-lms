'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { launch } = require('./browser-lib.cjs');
const findings = require('./findings-data.cjs');
const workflows = require('./workflows-data.cjs');
const screens = require('./screens-data.cjs');

async function main() {
  const all = [...findings.defects, ...findings.usability, ...findings.enhancements];
  const ids = new Set(all.map(x => x.id));
  assert.equal(ids.size, all.length, 'Unique finding IDs');
  assert.equal(new Set(workflows.rows.map(r => r[0])).size, workflows.rows.length, 'Unique workflow IDs');
  for (const row of workflows.rows) {
    assert.equal(row.length, workflows.columns.length, row[0]);
    assert.ok(['PASS', 'FAIL', 'PARTIAL', 'BLOCKED', 'NOT TESTED'].includes(row[7]), row[0]);
    for (const id of row[9].match(/[DUE]-\d+/g) || []) assert.ok(ids.has(id), `${row[0]} references ${id}`);
  }
  for (const row of screens.rows) assert.equal(row.length, screens.columns.length, row[0]);
  for (const name of ['audit-report.md', 'README.md', 'workflow-matrix.md', 'screen-review.md']) {
    const contents = fs.readFileSync(path.join(__dirname, name), 'utf8');
    assert.ok(!contents.includes('\uFFFD'), `${name} UTF-8`);
    for (const match of contents.matchAll(/\]\(([^)]+)\)/g)) {
      const target = match[1];
      if (!/^https?:|^#/.test(target)) assert.ok(fs.existsSync(path.resolve(__dirname, target)), `${name}: ${target}`);
    }
  }
  const browser = await launch();
  const results = [];
  try {
    for (const width of [1440, 390]) {
      const context = await browser.newContext({ viewport: { width, height: 1000 } });
      await context.route(/^https?:/, route => route.abort());
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', err => errors.push(err.message));
      await page.goto(pathToFileURL(path.join(__dirname, 'audit-report.html')).href);
      assert.equal(await page.locator('.issue:not(.hidden)').count(), all.length);
      assert.equal(await page.locator('.workflows tbody tr:not(.hidden)').count(), workflows.rows.length);
      await page.selectOption('#priority', 'P0');
      assert.equal(await page.locator('.issue:not(.hidden)').count(), 1);
      await page.selectOption('#priority', '');
      await page.fill('#issueSearch', 'D-17');
      assert.equal(await page.locator('.issue:not(.hidden)').count(), 1);
      await page.fill('#issueSearch', '');
      await page.selectOption('#statusFilter', 'BLOCKED');
      assert.equal(await page.locator('.workflows tbody tr:not(.hidden)').count(), 16);
      await page.selectOption('#statusFilter', '');
      const links = await page.locator('a[href],img[src]').evaluateAll(els => els.map(el => el.getAttribute('href') || el.getAttribute('src')));
      for (const target of links) {
        if (target.startsWith('#')) assert.equal(await page.locator(target).count(), 1, target);
        else assert.ok(fs.existsSync(path.resolve(__dirname, target)), target);
      }
      const docWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      assert.equal(docWidth, width, `Report horizontal overflow at ${width}px`);
      assert.deepEqual(errors, []);
      await page.evaluate(() => scrollTo(0, 0));
      await page.screenshot({ path: path.join(__dirname, 'evidence', `report-${width}.png`) });
      results.push({ viewport: width, documentWidth: docWidth, findings: all.length, workflows: workflows.rows.length, localLinksChecked: links.length, filterChecks: 'PASS', pageErrors: errors });
      await context.close();
    }
  } finally { await browser.close(); }
  fs.writeFileSync(path.join(__dirname, 'evidence', 'report-validation.json'), JSON.stringify(results, null, 2));
  console.log(JSON.stringify(results, null, 2));
}
main().catch(error => { console.error(error); process.exitCode = 1; });
