'use strict';
const fs = require('fs'), path = require('path'), os = require('os'), assert = require('assert/strict');
const { fork } = require('child_process');
const { launch } = require('./browser-lib.cjs');
(async () => {
  const runtime = fs.mkdtempSync(path.join(os.tmpdir(), 'echolens-free-reminder-browser-'));
  const child = fork(path.join(__dirname, '../test/fixtures/free-course-reminders-server.cjs'), [], { env: { ...process.env, ECHOLENS_TEST_RUNTIME: runtime }, silent: true });
  let browser, logs = ''; child.stdout.on('data', c => logs += c); child.stderr.on('data', c => logs += c);
  try {
    const ready = await new Promise((resolve, reject) => { const timer = setTimeout(() => reject(Error(logs)), 20000); child.once('message', data => { clearTimeout(timer); resolve(data); }); child.once('exit', () => { clearTimeout(timer); reject(Error(logs)); }); });
    const base = 'http://127.0.0.1:' + ready.port;
    browser = await launch();
    const results = [];
    for (const width of [1440, 390]) {
      const ctx = await browser.newContext({ viewport: { width, height: 1000 } });
      await ctx.route('**/*', r => new URL(r.request().url()).origin === base ? r.continue() : r.abort());
      await ctx.addCookies([{ name: 'el_token', value: ready.cookies.admin.slice('el_token='.length), url: base }]);
      const page = await ctx.newPage(), errors = []; page.on('pageerror', e => errors.push(e.message));
      await page.goto(base + '/dashboard#view=admin-open-courses');
      await page.locator('#ocEmail').waitFor(); await page.locator('#ocSelect').selectOption('fc01-c-basics');
      await page.locator('#ocEmail').fill('student@qa.invalid'); await page.locator('#ocEnrollEmail').click();
      await page.waitForFunction(() => document.getElementById('ocRoster')?.innerText.includes('student@qa.invalid'));
      assert.match(await page.locator('#ocRoster').innerText(), /Deadline/i);
      await page.locator('#view-admin-open-courses').screenshot({ path: 'qa-implementation/evidence/free-course-email-admin-' + width + '.png' });
      await page.locator('#ocEmail').fill('student@qa.invalid'); page.once('dialog', dialog => dialog.accept()); await page.locator('#ocRemoveEmail').click();
      await page.waitForFunction(() => document.getElementById('ocRoster')?.innerText.includes('Nobody is enrolled'));
      await page.locator('#ocEmail').fill('student@qa.invalid'); await page.locator('#ocEnrollEmail').click();
      await page.waitForFunction(() => document.getElementById('ocRoster')?.innerText.includes('student@qa.invalid'));
      await ctx.clearCookies(); await ctx.addCookies([{ name: 'el_token', value: ready.cookies.student.slice('el_token='.length), url: base }]);
      await page.goto(base + '/open#course/fc01-c-basics');
      await page.locator('.pace-note').filter({ hasText: 'Complete within three months' }).waitFor();
      assert.equal((await ctx.request.get(base + '/api/admin/open-courses/fc01-c-basics/students')).status(), 403);
      await page.locator('#courseLevels').screenshot({ path: 'qa-implementation/evidence/free-course-deadline-' + width + '.png' });
      const endpoint = base + '/api/admin/open-courses/fc01-c-basics/enroll-email';
      await ctx.request.delete(endpoint, { headers: { Cookie: ready.cookies.admin }, data: { email: 'student@qa.invalid' } });
      await page.reload(); await page.getByRole('button', { name: 'Contact support to re-enroll' }).waitFor();
      await page.getByRole('button', { name: 'Contact support to re-enroll' }).click(); await page.waitForURL('**/open#feedback');
      assert.equal((await ctx.request.post(endpoint, { headers: { Cookie: ready.cookies.admin }, data: { email: 'student@qa.invalid' } })).status(), 200);
      const opened = page.waitForResponse(response => response.url().endsWith('/api/open/activity') && response.status() === 200);
      await page.goto(base + '/open#course/fc01-c-basics'); await page.reload(); await opened;
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      assert.deepEqual(errors, []); results.push({ width, passed: true }); console.log('PASS admin email enroll/remove/restore and learner deadline', width);
      await ctx.close();
    }
    const saved = JSON.parse(fs.readFileSync(path.join(runtime, 'store.json')));
    assert.ok(saved.users.find(u => u.role === 'student').profile.free_course_enrollments[0].last_opened_at);
    fs.writeFileSync('qa-implementation/evidence/free-course-reminders-browser-results.json', JSON.stringify(results, null, 2));
  } finally { if (browser) await browser.close(); child.kill(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
