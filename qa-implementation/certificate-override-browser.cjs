'use strict';

const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { fork } = require('node:child_process');
const { once } = require('node:events');
const { launch } = require('./browser-lib.cjs');
const runtimeRoot = path.join(__dirname, 'runtime');
fs.mkdirSync(runtimeRoot, { recursive: true });
const runtime = fs.mkdtempSync(path.join(runtimeRoot, 'certificate-override-'));
const env = { ...process.env, ECHOLENS_TEST_RUNTIME: runtime };
delete env.NODE_TEST_CONTEXT;
const child = fork(path.join(__dirname, '../test/fixtures/certificate-server.cjs'), [], { env, execArgv: [], silent: true });
let logs = '';
child.stdout.on('data', chunk => { logs += chunk; });
child.stderr.on('data', chunk => { logs += chunk; });
const evidence = path.join(__dirname, 'evidence');
const results = [];
let browser;

(async () => {
  const ready = await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => { cleanup(); reject(new Error('Fixture timeout: ' + logs)); }, 20000);
    function cleanup() { clearTimeout(timeout); child.off('message', receive); child.off('exit', fail); }
    function receive(value) { cleanup(); resolve(value); }
    function fail(code) { cleanup(); reject(new Error(`Fixture exited ${code}: ${logs}`)); }
    child.once('message', receive); child.once('exit', fail);
  });
  const base = `http://127.0.0.1:${ready.port}`;
  browser = await launch();
  for (const [actor, width] of [[1, 1440], [1, 390], [3, 1440]]) {
    const ctx = await browser.newContext({ viewport: { width, height: 1000 } });
    await ctx.route('**/*', route => new URL(route.request().url()).origin === base ? route.continue() : route.abort());
    await ctx.addCookies([{ name: 'el_token', value: ready.cookies[actor].slice('el_token='.length), url: base }]);
    const page = await ctx.newPage();
    page.setDefaultTimeout(10000);
    await page.goto(base + `/dashboard#view=course&batch=${ready.batchId}`);
    await page.locator('#view-course .course-head').waitFor();
    await page.getByRole('button', { name: 'Manage', exact: false }).click();
    await page.getByRole('button', { name: 'Issue certificate', exact: true }).click();
    await page.locator('#f [name=user_id]').selectOption('2');
    const override = page.locator('#f [name=allow_incomplete]');
    if (actor === 1) {
      assert.equal(await override.isChecked(), false);
      await page.locator('#f [name=title]').fill(`Browser individual ${width}`);
      await page.screenshot({ path: path.join(evidence, `certificate-override-single-${width}.png`), animations: 'disabled' });
      await page.locator('#f button').click();
      await page.waitForFunction(() => document.querySelector('#modalMsg').textContent.includes('completion has not been established'));
      await override.check();
      const response = page.waitForResponse(r => r.url().endsWith('/api/certificates/issue') && r.request().method() === 'POST');
      await page.locator('#f button').click();
      const issued = await response;
      assert.equal(issued.status(), 200);
      assert.equal(issued.request().postDataJSON().allow_incomplete, true);
      await page.waitForFunction(() => document.querySelector('#modalMsg').textContent.startsWith('Issued - serial'));
    } else {
      assert.equal(await override.count(), 0);
    }
    await page.keyboard.press('Escape');
    const bulkAction = page.getByRole('button', { name: 'Issue certificates (whole course)', exact: true });
    if (!await bulkAction.isVisible()) await page.getByRole('button', { name: 'Manage', exact: false }).click();
    await bulkAction.click();
    const completedOnly = page.locator('#f [name=only_completed]');
    assert.equal(await completedOnly.isChecked(), true);
    if (actor === 1) {
      assert.equal(await completedOnly.isEnabled(), true);
      await completedOnly.uncheck();
      await page.locator('#f [name=title]').fill(`Browser bulk ${width}`);
      await page.screenshot({ path: path.join(evidence, `certificate-override-bulk-${width}.png`), animations: 'disabled' });
      const response = page.waitForResponse(r => r.url().endsWith('/certificates/issue-all'));
      await page.locator('#f button').click();
      const issued = await response;
      assert.equal(issued.status(), 200);
      assert.equal(issued.request().postDataJSON().only_completed, false);
      assert.equal((await issued.json()).issued, 3);
    } else {
      assert.equal(await completedOnly.isDisabled(), true);
    }
    results.push({ role: actor === 1 ? 'admin' : 'instructor', width, status: 'PASS' });
    await ctx.close();
  }
  fs.writeFileSync(path.join(evidence, 'certificate-override-browser.json'), JSON.stringify(results, null, 2));
  console.log(JSON.stringify(results));
})().catch(err => { console.error(err); process.exitCode = 1; }).finally(async () => {
  if (browser) await browser.close();
  if (child.exitCode === null && child.signalCode === null) {
    const exit = once(child, 'exit'); child.kill(); await exit;
  }
});
