'use strict';
const fs = require('node:fs'); const path = require('node:path'); const assert = require('node:assert/strict');
const { fork } = require('node:child_process'); const { once } = require('node:events'); const { launch } = require('./browser-lib.cjs');
const root = path.join(__dirname, 'runtime'); fs.mkdirSync(root, { recursive: true });
const runtime = fs.mkdtempSync(path.join(root, 'admissions-reminders-'));
const env = { ...process.env, ECHOLENS_TEST_RUNTIME: runtime }; delete env.NODE_TEST_CONTEXT;
const child = fork(path.join(__dirname, '../test/fixtures/admissions-reminders-server.cjs'), [], { env, silent: true, execArgv: [] });
let logs = '', browser; child.stdout.on('data', c => { logs += c; }); child.stderr.on('data', c => { logs += c; });
const evidence = path.join(__dirname, 'evidence'), results = [];
(async () => {
  const ready = await new Promise((resolve, reject) => { const timer = setTimeout(() => reject(Error(logs)), 45000); child.once('message', r => { clearTimeout(timer); resolve(r); }); child.once('exit', () => { clearTimeout(timer); reject(Error(logs)); }); });
  const base = 'http://127.0.0.1:' + ready.port;
  browser = await launch();
  for (const [role, width, id] of [['student_coordinator', 1440, 1], ['student_coordinator', 390, 2], ['finance', 1440, 0]]) {
    const ctx = await browser.newContext({ viewport: { width, height: 1000 } });
    await ctx.route('**/*', r => new URL(r.request().url()).origin === base ? r.continue() : r.abort());
    await ctx.addCookies([{ name: 'el_token', value: ready.cookies[role].slice('el_token='.length), url: base }]);
    const page = await ctx.newPage(); page.setDefaultTimeout(15000); const errors = []; page.on('pageerror', e => errors.push(e.message));
    await page.goto(base + '/dashboard'); await page.locator('#app').waitFor(); await page.waitForLoadState('networkidle');
    if (role === 'student_coordinator') {
      await page.locator(`button[onclick="coordOpenChallanForm(${id})"]`).click();
      assert.equal(await page.locator('#f [name=auto_reminders]').isChecked(), true);
      await page.locator('#f [name=deadline]').fill('2026-10-25');
      await page.screenshot({ path: path.join(evidence, `admissions-reminders-generate-${width}.png`), animations: 'disabled' });
      const generated = page.waitForResponse(r => r.url().endsWith(`/registrations/${id}/challan`) && r.request().method() === 'POST');
      await page.locator('#f button').click(); const response = await generated; assert.equal(response.status(), 200); const data = await response.json();
      await page.getByRole('button', { name: /Challan generated/ }).click();
      await page.locator(`button[onclick="coordOpenReminders('${data.challan.serial}')"]`).click();
      await page.getByRole('button', { name: 'Pause automatic reminders' }).waitFor();
      for (const date of ['18', '21', '22', '24', '25', '26']) assert.ok(await page.getByRole('cell', { name: '2026-10-' + date, exact: true }).isVisible());
      await page.getByText('Preview extension email', { exact: true }).click();
      assert.match(await page.locator('#modalBox pre').textContent(), /0314148929/);
      assert.match(await page.locator('#modalBox pre').textContent(), /finance@echolens.digital/);
      await page.screenshot({ path: path.join(evidence, `admissions-reminders-schedule-${width}.png`), animations: 'disabled' });
      const paused = page.waitForResponse(r => r.url().endsWith('/reminders') && r.request().method() === 'PATCH');
      await page.getByRole('button', { name: 'Pause automatic reminders' }).click(); assert.equal((await paused).status(), 200);
      const state = await ctx.request.get(base + `/api/admissions/challans/${data.challan.serial}/reminders`); assert.equal((await state.json()).reminders.enabled, false);
    } else assert.equal(await page.getByRole('button', { name: 'Email reminders', exact: true }).count(), 0);
    assert.deepEqual(errors, []); results.push({ role, width, passed: true }); console.log('PASS', role, width); await ctx.close();
  }
  assert.equal(JSON.parse(fs.readFileSync(path.join(runtime, 'mail.json'))).length, 0, 'previewing and configuring do not send email');
  fs.writeFileSync(path.join(evidence, 'admissions-reminders-browser-results.json'), JSON.stringify(results, null, 2));
})().catch(e => { console.error(e); console.error(logs.slice(-3000)); process.exitCode = 1; }).finally(async () => { if (browser) await browser.close(); if (child.exitCode === null && child.signalCode === null) { const done = once(child, 'exit'); child.kill(); await done; } });
