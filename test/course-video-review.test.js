'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), os = require('node:os'), path = require('node:path');
const { fork } = require('node:child_process'), { once } = require('node:events');

test('admins can review all upcoming videos while learner and anonymous access stays gated', { timeout: 120000 }, async t => {
  const runtime = fs.mkdtempSync(path.join(os.tmpdir(), 'echolens-video-review-'));
  const child = fork(path.join(__dirname, 'fixtures/free-course-reminders-server.cjs'), [], {
    env: { ...process.env, ECHOLENS_TEST_RUNTIME: runtime }, silent: true, execArgv: [],
  });
  let logs = '';
  child.stdout.on('data', c => logs += c); child.stderr.on('data', c => logs += c);
  t.after(async () => {
    if (child.exitCode === null && child.signalCode === null) { const stopped = once(child, 'exit'); child.kill(); await stopped; }
    assert.equal(path.dirname(runtime), os.tmpdir()); assert.ok(path.basename(runtime).startsWith('echolens-video-review-'));
    fs.rmSync(runtime, { recursive: true, force: true });
  });
  const ready = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(Error('Server startup timed out: ' + logs)), 60000);
    child.once('message', data => { clearTimeout(timer); resolve(data); });
    child.once('exit', () => { clearTimeout(timer); reject(Error(logs)); });
  });
  const base = 'http://127.0.0.1:' + ready.port;
  const request = (route, role) => fetch(base + route, { redirect:'manual', headers: role ? { Cookie:ready.cookies[role] } : {} });
  const signedOut = await request('/admin/course-videos');
  assert.equal(signedOut.status, 302);
  assert.equal(signedOut.headers.get('location'), '/login?returnTo=%2Fadmin%2Fcourse-videos');
  for (const role of [null, 'student', 'instructor', 'finance']) {
    assert.equal((await request('/api/admin/course-videos', role)).status, role ? 403 : 401);
    if (role) assert.equal((await request('/admin/course-videos', role)).status, 403);
  }
  assert.equal((await request('/admin/course-videos', 'admin')).status, 200);
  const response = await request('/api/admin/course-videos', 'admin');
  assert.equal(response.status, 200); assert.match(response.headers.get('cache-control'), /no-store/);
  const { courses } = await response.json();
  assert.equal(courses.length, 6);
  assert.equal(courses.flatMap(c => c.lessons).length, 72);
  assert.equal(courses.flatMap(c => c.lessons.flatMap(l => l.videos)).length, 96);
  for (const course of courses) {
    const preview = await (await request('/api/public/tracks/' + course.key, 'admin')).json();
    assert.equal(preview.staff_preview, true);
    assert.ok(preview.levels.every(l => !l.locked && l.video_url && l.videos.length));
    for (const role of [null, 'student']) {
      const locked = await (await request('/api/public/tracks/' + course.key, role)).json();
      assert.equal(locked.open_levels, 0);
      assert.ok(locked.levels.every(l => l.locked && !l.video_url && !l.videos));
    }
  }
  // Opt-in browser smoke uses the already installed local Chrome/Playwright tooling.
  if (process.env.VIDEO_REVIEW_BROWSER === '1') {
    const { launch } = require('../qa-audit/browser-lib.cjs');
    const browser = await launch();
    try {
      const context = await browser.newContext({ viewport: { width:1280, height:900 }, acceptDownloads:true });
      await context.addCookies([{ name:'el_token', value:ready.cookies.admin.slice('el_token='.length), url:base }]);
      const page = await context.newPage();
      const errors = []; page.on('pageerror', e => errors.push(e.message));
      await page.goto(base + '/admin/course-videos');
      await page.waitForFunction(() => document.querySelectorAll('article').length === 72);
      assert.equal(await page.locator('[data-play]').count(), 96);
      await page.locator('[data-play]').first().click();
      assert.match(await page.locator('iframe').first().getAttribute('src'), /^https:\/\/www.youtube-nocookie.com\/embed\/[\w-]{11}$/);
      await page.locator('[data-play]').first().click();
      assert.equal(await page.locator('iframe').count(), 0);
      await page.locator('#course').selectOption('tt-go-backend');
      assert.equal(await page.locator('article').count(), 12);
      await page.locator('#search').fill('pgx');
      assert.equal(await page.locator('article').count(), 1);
      const downloaded = page.waitForEvent('download'); await page.locator('#download').click();
      const download = await downloaded;
      assert.equal(download.suggestedFilename(), 'upcoming-course-videos.csv');
      assert.equal(fs.readFileSync(await download.path(), 'utf8').split('\r\n').length, 97);
      await page.setViewportSize({ width:390, height:844 });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
      const lessonLink = await page.locator('article > p a').getAttribute('href');
      await page.goto(base + lessonLink);
      await page.waitForFunction(() => document.querySelector('iframe[src*="LSFCmSQc5R8"]'), { timeout:15000 });
      assert.deepEqual(errors, []);
      await context.close();
    } finally { await browser.close(); }
  }
});
