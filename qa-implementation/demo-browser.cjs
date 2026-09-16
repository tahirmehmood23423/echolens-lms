'use strict';
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { fork } = require('node:child_process');
const { once } = require('node:events');
const { launch } = require('./browser-lib.cjs');
const accounts = require('../demo/accounts');
const root = path.join(__dirname, 'runtime'); fs.mkdirSync(root, { recursive: true });
const runtime = fs.mkdtempSync(path.join(root, 'demo-browser-'));
const child = fork(path.join(__dirname, '../test/fixtures/certificate-server.cjs'), [], { env: { ...process.env, ECHOLENS_TEST_RUNTIME: runtime }, silent: true, execArgv: [] });
let logs = ''; child.stdout.on('data', v => { logs += v; }); child.stderr.on('data', v => { logs += v; });
const results = []; let browser;
(async () => {
  const ready = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(Error('Startup timeout: ' + logs)), 25000);
    child.once('message', r => { clearTimeout(timer); resolve(r); });
    child.once('exit', () => { clearTimeout(timer); reject(Error(logs)); });
  });
  const base = 'http://127.0.0.1:' + ready.port;
  browser = await launch();
  const evidence = path.join(__dirname, 'evidence'); fs.mkdirSync(evidence, { recursive: true });
  for (const account of [...accounts, { username: 'admin', mobile: true }, { username: 'student', mobile: true }]) {
    const context = await browser.newContext({ viewport: { width: account.mobile ? 390 : 1440, height: 1000 } });
    const leaked = [], errors = [], failed = [];
    await context.route('**/*', route => {
      const url = new URL(route.request().url());
      if (url.origin !== base) return route.abort();
      if (!url.pathname.startsWith('/demo/') && url.pathname !== '/demo') leaked.push(url.pathname);
      return route.continue();
    });
    const page = await context.newPage(); page.setDefaultTimeout(15000);
    page.on('pageerror', e => errors.push(e.message));
    page.on('response', response => { if (response.status() >= 400 && response.url().includes('/api/')) failed.push({ url: response.url().replace(base, ''), status: response.status() }); });
    await page.goto(base + '/demo/', { timeout: 60000 });
    await page.locator('.demo-notice').waitFor();
    if (account.mobile) await page.screenshot({ path: path.join(evidence, 'demo-landing-mobile.png'), fullPage: true, animations: 'disabled' });
    await page.locator('[data-account="' + account.username + '"]').click();
    await page.waitForURL(url => url.pathname !== '/demo/');
    await page.locator('.demo-notice').waitFor();
    if (account.username !== 'free') await page.locator('#app').waitFor();
    await page.waitForLoadState('networkidle');
    assert.ok(new URL(page.url()).pathname.startsWith('/demo/'), 'login stays in demo');
    const me = await page.evaluate(() => fetch('/api/auth/me').then(r => r.json()));
    assert.equal(me.username, account.username);
    const views = [];
    if (!account.mobile && account.username !== 'free') {
      const nav = page.locator('.nav-item[data-view]:visible');
      const names = await nav.evaluateAll(elements => elements.map(e => e.dataset.view));
      for (const view of names) {
        await page.locator('.nav-item[data-view="' + view + '"]').click();
        await page.waitForLoadState('networkidle');
        views.push(view);
      }
    }
    let saveBlocked = null;
    if (account.username === 'admin') {
      await page.goto(base + '/demo/dashboard#view=course&batch=1');
      await page.locator('#view-course .course-head').waitFor();
      await page.getByRole('button', { name: 'Manage', exact: false }).click();
      await page.getByRole('button', { name: 'Issue certificate', exact: true }).click();
      await page.locator('#f [name=user_id]').selectOption('3');
      await page.locator('#f [name=title]').fill('Blocked demo certificate');
      await page.locator('#f [name=allow_incomplete]').check();
      await page.locator('#f button').click();
      await page.waitForFunction(() => document.querySelector('#modalMsg').textContent.includes('Read-only demo:'));
      saveBlocked = await page.locator('#modalMsg').textContent();
    }
    const suffix = account.mobile ? 'mobile' : 'desktop';
    if (['admin', 'student', 'finance', 'head', 'recruit'].includes(account.username)) await page.screenshot({ path: path.join(evidence, `demo-${account.username}-${suffix}.png`), fullPage: true, animations: 'disabled' });
    results.push({ username: account.username, viewport: suffix, views, leaked, errors, failed, saveBlocked });
    fs.writeFileSync(path.join(evidence, 'demo-browser-results.json'), JSON.stringify(results, null, 2));
    assert.deepEqual(leaked, [], 'no requests escape demo: ' + account.username);
    assert.deepEqual(errors, [], 'no browser exceptions: ' + account.username);
    assert.deepEqual(failed.filter(f => !(f.status === 403 && f.url === '/demo/api/certificates/issue')), [], 'no unexpected API failures: ' + account.username);
    console.log('PASS', account.username, suffix, views.length + ' views');
    await context.close();
  }
})().catch(err => { console.error(err); console.error(logs.slice(-5000)); process.exitCode = 1; }).finally(async () => {
  if (browser) await browser.close();
  if (child.exitCode === null && child.signalCode === null) { const done = once(child, 'exit'); child.kill(); await done; }
});
