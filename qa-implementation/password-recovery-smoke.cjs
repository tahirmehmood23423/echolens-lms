'use strict';
// Isolated browser smoke test: captures mail and never touches live accounts.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { fork } = require('node:child_process');
const { once } = require('node:events');
const { launch } = require('../qa-audit/browser-lib.cjs');

(async () => {
  const runtime = fs.mkdtempSync(path.join(os.tmpdir(), 'echolens-recovery-browser-'));
  const child = fork(path.join(__dirname, '../test/fixtures/signup-durability-server.cjs'), [], {
    env: { ...process.env, ECHOLENS_TEST_RUNTIME: runtime }, silent: true, execArgv: [],
  });
  let logs = '', browser;
  child.stdout.on('data', c => logs += c); child.stderr.on('data', c => logs += c);
  try {
    const ready = await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(Error(logs || 'Fixture startup timed out')), 60000);
      child.once('message', m => { clearTimeout(timer); resolve(m); });
      child.once('exit', () => { clearTimeout(timer); reject(Error(logs)); });
    });
    const base = `http://127.0.0.1:${ready.port}`;
    const mailbox = () => new Promise(resolve => { child.once('message', resolve); child.send({ type: 'mail' }); });
    browser = await launch();
    for (const width of [1440, 390]) {
      const ctx = await browser.newContext({ viewport: { width, height: 900 } });
      const page = await ctx.newPage();
      const errors = []; page.on('pageerror', e => errors.push(e.message));
      // Block third-party analytics/assets; the local forms remain fully functional.
      await ctx.route('**/*', route => new URL(route.request().url()).origin === base ? route.continue() : route.abort());
      const email = `browser${width}@gmail.com`;
      const codeResponse = await ctx.request.post(base + '/api/auth/email-code', { data: { email } });
      assert.equal(codeResponse.status(), 200);
      const codeMail = (await mailbox()).sent.find(m => m.to === email && /verification code/i.test(m.subject));
      const code = codeMail.text.match(/\b(\d{6})\b/)[1];
      const signup = await ctx.request.post(base + '/api/auth/register-open', { data: {
        name: 'Browser Learner', email, code, age_declaration: 'adult', whatsapp: '03001234567',
        city: 'Lahore', university: 'Sample', degree: 'BS CS', study_year: '3',
      } });
      assert.equal(signup.status(), 200);
      const welcome = (await mailbox()).sent.find(m => m.to === email && /your password/i.test(m.subject));
      assert.match(welcome.text, /Username: /);
      const oldPassword = welcome.text.match(/Password: (\S+)/)[1];
      const originalSession = (await ctx.cookies()).find(c => c.name === 'el_token').value;
      await ctx.clearCookies();
      await page.goto(base + '/login');
      await page.locator('.cc-decline').click();
      await page.locator('#forgotLink').click();
      await page.locator('#forgotForm input').fill(email);
      await page.locator('#forgotSubmit').click();
      await page.locator('#pinForm:not([hidden])').waitFor();
      assert.equal(await page.locator('#recoveryPasswordForm').isVisible(), false);
      const pinMail = (await mailbox()).sent.filter(m => m.to === email && /recovery PIN/.test(m.subject)).pop();
      const pin = pinMail.text.match(/\b(\d{6})\b/)[1];
      await page.locator('#pinForm input').fill(pin);
      await page.locator('#pinSubmit').click();
      await page.locator('#recoveryPasswordForm:not([hidden])').waitFor();
      await page.locator('#recoveryPasswordForm input[name=password]').fill('BrowserNewPassword123!');
      await page.locator('#recoveryPasswordForm input[name=confirm]').fill('Mismatch123!');
      await page.locator('#recoverySubmit').click();
      assert.equal(await page.locator('#msg').textContent(), 'Passwords do not match.');
      await page.locator('#recoveryPasswordForm input[name=confirm]').fill('BrowserNewPassword123!');
      await page.locator('#recoverySubmit').click();
      await page.waitForFunction(() => document.getElementById('msg').textContent.includes('Password changed.'));
      assert.equal((await ctx.request.get(base + '/api/auth/me', { headers: { Cookie: `el_token=${originalSession}` } })).status(), 401);
      assert.equal((await ctx.request.post(base + '/api/auth/login', { data: { login: email, password: oldPassword } })).status(), 401);
      await page.locator('#loginForm input[name=password]').fill('BrowserNewPassword123!');
      await page.locator('#submit').click();
      await page.waitForURL('**/open#free');
      assert.equal((await ctx.request.get(base + '/api/auth/me')).status(), 200);
      assert.deepEqual(errors, []);
      console.log(`PASS ${width}px: signup email, PIN verification, password confirmation, reset, old session/password rejected, new login`);
      await ctx.close();
    }
  } finally {
    if (browser) await browser.close();
    if (child.exitCode === null && child.signalCode === null) { const exited = once(child, 'exit'); child.kill(); await exited; }
    fs.rmSync(runtime, { recursive: true, force: true });
  }
})().catch(err => { console.error(err); process.exitCode = 1; });
