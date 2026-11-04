'use strict';
// Browser regressions use only synthetic users and an isolated file database.
const assert = require('node:assert/strict');
const fs = require('node:fs'), os = require('node:os'), path = require('node:path');
const { fork } = require('node:child_process');
const { once } = require('node:events');
const { chromium } = require('playwright');
const { BANKS } = require('../career/curriculum/questions');
const runtime = fs.mkdtempSync(path.join(os.tmpdir(), 'echolens-career-ui-'));
const output = process.env.CAREER_UI_EVIDENCE || path.join(os.tmpdir(), 'echolens-career-ui-evidence');
fs.mkdirSync(output, { recursive: true });
const child = fork(path.join(__dirname, 'fixtures/certificate-server.cjs'), [], { env: { ...process.env, ECHOLENS_TEST_RUNTIME: runtime }, silent: true });
let browser, logs = '', assertions = 0;
child.stdout.on('data', d => { logs += d; }); child.stderr.on('data', d => { logs += d; });
const check = (condition, message) => { assert.ok(condition, message); assertions++; };
const rows = [], errors = [];
(async () => {
  const ready = await new Promise((resolve, reject) => { child.once('message', resolve); child.once('exit', c => reject(Error(`Fixture exit ${c}: ${logs}`))); setTimeout(() => reject(Error('Fixture startup timed out')), 20000).unref(); });
  const base = `http://127.0.0.1:${ready.port}`;
  browser = await chromium.launch({ headless: true, ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } : fs.existsSync('/usr/bin/chromium') ? { executablePath: '/usr/bin/chromium' } : {}), args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
  // External fonts/analytics are irrelevant to local functional verification.
  await ctx.route('**/*', route => route.request().url().startsWith(base) ? route.continue() : route.abort());
  await ctx.addCookies([{ name: 'el_token', value: ready.cookies[2].slice('el_token='.length), url: base }]);
  const page = await ctx.newPage(); page.on('pageerror', e => errors.push(e.message));
  page.setDefaultTimeout(10000);
  const go = async hash => { await page.goto(base + '/career#' + hash); await page.waitForFunction(() => document.getElementById('career').getAttribute('aria-busy') === 'false'); if (await page.locator('.cc-decline').isVisible()) await page.locator('.cc-decline').click(); };
  const noOverflow = async label => check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), label + ': no page overflow');
  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const route of ['discover', 'tracks', 'role/junior-backend-developer', 'sub/python-fundamentals', 'me']) {
      await go(route); await noOverflow(`${width} ${route}`);
      check(await page.locator('#career h1').count() > 0, `${route}: heading loaded`);
    }
    rows.push({ width, screens: ['welcome', 'tracks', 'role', 'subtrack', 'dashboard'], overflow: false });
    await go('tracks'); await page.screenshot({ path: path.join(output, `tracks-${width}.png`), fullPage: true });
  }
  await page.setViewportSize({ width: 1440, height: 1000 }); await go('tracks');
  const contrast = await page.locator('.cr-hero .cr-btn').first().evaluate(el => {
    const s = getComputedStyle(el), rgb = v => v.match(/\d+/g).slice(0, 3).map(Number), lum = v => rgb(v).map(x => { x /= 255; return x <= .04045 ? x / 12.92 : ((x + .055) / 1.055) ** 2.4; }).reduce((n, x, i) => n + x * [.2126, .7152, .0722][i], 0);
    const a = lum(s.color), b = lum(s.backgroundColor); return { ratio: (Math.max(a, b) + .05) / (Math.min(a, b) + .05), transition: s.transitionDuration };
  });
  check(contrast.ratio >= 4.5, 'primary action text meets AA contrast');
  check(contrast.transition === '0s', 'reduced-motion preference disables transitions');
  await page.locator('#crQ').fill('no-match-xyz'); check(await page.locator('#cxClear').isVisible(), 'search empty state');
  await page.locator('#cxClear').click(); check(await page.locator('.cr-card').count() === 12, 'clear search restores 12 careers');
  await page.locator('[data-compare]').nth(0).check(); await page.locator('[data-compare]').nth(1).check(); await page.locator('#cxCompare').click();
  check(await page.getByRole('dialog').isVisible(), 'comparison opens accessible dialog');
  check(await page.getByRole('dialog').locator('table th').count() > 2, 'comparison contains actual career data');
  await page.keyboard.press('Escape'); check(await page.getByRole('dialog').count() === 0, 'Escape closes dialog');
  await go('role/junior-backend-developer'); await page.locator('#cuTarget').click(); await page.locator('#cuTargetMsg').getByRole('link').waitFor();
  await go('me'); check((await page.locator('#career').innerText()).includes('Junior Backend Developer'), 'chosen job role persists into dashboard');
  await go('sub/python-fundamentals'); await page.locator('#cuOutline').click();
  check(await page.evaluate(() => document.activeElement.id === 'cuModules'), 'learning-outline action moves keyboard focus');
  check((await page.locator('#career').innerText()).includes('Learning content in preparation'), 'unavailable lessons reported honestly');
  await page.locator('#cuStart').click(); await page.locator('#cuQ').waitFor();
  let active = await (await ctx.request.get(base + '/api/career/me/st/active')).json(); const attempt = active.attempt;
  check(attempt.questions.every(q => q.options.every(o => /^[a-f0-9]{24}$/.test(o.id))), 'all public option identifiers opaque');
  for (const width of [320, 390, 768, 1024, 1440]) { await page.setViewportSize({ width, height: 1000 }); await noOverflow(`${width} quiz`); check(await page.locator('input[name=cuopt]').count() === 4, 'four radio choices'); }
  await page.locator('input[name=cuopt]').first().focus(); await page.keyboard.press('Space');
  await page.locator('#cuSave').filter({ hasText: 'All changes saved' }).waitFor();
  active = await (await ctx.request.get(base + '/api/career/me/st/active')).json(); check(Object.keys(active.attempt.answers).length === 1, 'keyboard answer saved to server');
  await page.locator('#cuFlag').click(); check(await page.locator('#cuFlag').getAttribute('aria-pressed') === 'true', 'review flag toggles');
  await page.locator('#cuNext').click(); check((await page.locator('#career').innerText()).includes('Question 2 of'), 'Next advances question');
  // Simulate failed writes, then verify visible failure and working retry.
  await page.route('**/api/career/me/st/attempts/*/answers', route => route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: 'Synthetic network interruption' }) }));
  await page.locator('input[name=cuopt]').first().check(); await page.locator('#cuSaveRetry').waitFor();
  check((await page.locator('#cuSave').innerText()).includes('Not saved'), 'failed save is visible');
  await page.unroute('**/api/career/me/st/attempts/*/answers'); await page.locator('#cuSaveRetry').click(); await page.locator('#cuSave').filter({ hasText: 'All changes saved' }).waitFor();
  await page.reload(); await page.locator('#cuQ').waitFor();
  active = await (await ctx.request.get(base + '/api/career/me/st/active')).json(); check(Object.keys(active.attempt.answers).length === 2, 'reload recovers saved answers');
  await page.screenshot({ path: path.join(output, 'quiz-desktop.png'), fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 }); await page.screenshot({ path: path.join(output, 'quiz-mobile.png'), fullPage: true });
  await page.locator('#cuSubmit').click(); check(await page.getByRole('dialog').isVisible(), 'submission always requires confirmation');
  await page.getByRole('button', { name: 'Keep reviewing', exact: true }).click(); check(await page.locator('#cuQ').isVisible(), 'cancel keeps assessment active');
  // Independently select rendered answer text from the test oracle, not bank IDs.
  for (let i = 0; i < attempt.questions.length; i++) {
    const q = attempt.questions[i], bank = BANKS['python-fundamentals'].questions.find(k => k.id === q.id);
    const token = q.options.find(o => o.text === bank.options[bank.answer]).id;
    await page.locator('.cx-question-map summary').click(); await page.locator(`.cr-dots button[data-i="${i}"]`).click();
    await page.locator(`input[name=cuopt][value="${token}"]`).check();
  }
  await page.locator('#cuSubmit').click(); await page.getByRole('button', { name: 'Submit assessment', exact: true }).click();
  await page.waitForURL(/#sres\//); await page.locator('.cu-score-big').waitFor();
  check((await page.locator('.cu-score-big').innerText()).includes('100%'), 'UI changes preserve perfect score');
  await noOverflow('mobile result'); await page.screenshot({ path: path.join(output, 'result-mobile.png'), fullPage: true });
  await page.setViewportSize({ width: 1440, height: 1000 }); await page.screenshot({ path: path.join(output, 'result-desktop.png'), fullPage: true });
  await go('me'); check((await page.locator('.cx-measures').innerText()).includes('1 /'), 'canonical pass updates dashboard checkpoint');
  await page.screenshot({ path: path.join(output, 'dashboard-desktop.png'), fullPage: true });
  await go('report'); check(await page.locator('summary').filter({ hasText: 'Assessed knowledge evidence' }).count() === 1, 'skill report includes canonical competency evidence');
  check(!(await page.locator('#career').innerText()).includes('You have not taken an assessment yet'), 'skill report does not deny comprehensive attempts');
  await go('history'); check(await page.locator('a[href^="#sres/"]').count() === 1, 'shared assessment history includes comprehensive results');
  await go('roadmap'); check(await page.locator('.cx-command').count() === 1, 'learning plan includes canonical career progress');

  // A failed read shows Retry and retry actually reloads the screen.
  await page.route('**/api/career/curriculum/subtracks/git-collaboration', route => route.fulfill({ status: 503, contentType: 'application/json', body: '{"error":"Synthetic read failure"}' }));
  await go('sub/git-collaboration'); check(await page.locator('#crRetry').isVisible(), 'read failure has Retry');
  await page.unroute('**/api/career/curriculum/subtracks/git-collaboration'); await page.locator('#crRetry').click(); await page.locator('#cuStart').waitFor();
  check((await page.locator('h1').innerText()).includes('Git'), 'Retry recovers actual content');
  const discovery = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  await discovery.route('**/*', r => r.request().url().startsWith(base) ? r.continue() : r.abort());
  await discovery.addCookies([{ name: 'el_token', value: ready.cookies[4].slice('el_token='.length), url: base }]);
  const dp = await discovery.newPage(); dp.setDefaultTimeout(10000); dp.on('pageerror', e => errors.push(e.message));
  await dp.goto(base + '/career#discover'); await dp.locator('#dcGo').waitFor();
  if (await dp.locator('.cc-decline').isVisible()) await dp.locator('.cc-decline').click();
  check((await dp.locator('h1').innerText()).includes('Understand Your Skills'), 'welcome communicates the complete discovery journey');
  await dp.screenshot({ path: path.join(output, 'welcome-mobile.png'), fullPage: true });
  await dp.locator('#dcGo').click();
  for (let n = 1; n <= 5; n++) {
    await dp.waitForURL(new RegExp('#discover/about/' + n + '$'));
    await dp.locator('.dc-option').first().click(); await dp.locator('#dcNext').click();
  }
  await dp.locator('#dcStartQuiz').waitFor(); await dp.locator('#dcStartQuiz').click();
  for (let n = 0; n < 12; n++) {
    await dp.locator('.dc-answer').first().click();
    if (n < 11) await dp.locator('#dcN').click(); else await dp.locator('#dcFin').click();
  }
  await dp.waitForURL(/#discover\/results/); await dp.locator('#dcRh').waitFor();
  check(await dp.locator('.dc-rec').count() > 0, 'complete discovery quiz produces real recommendations');
  check(await dp.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'mobile recommendations do not overflow');
  await dp.screenshot({ path: path.join(output, 'discovery-matches-mobile.png'), fullPage: true });
  const override = dp.locator('.dc-tcard:not(.is-suggested) [data-choose]').first(), selected = await override.getAttribute('data-choose');
  await override.click(); await dp.waitForURL(/#me$/); await dp.locator('.cx-command').waitFor();
  const enrollments = await (await discovery.request.get(base + '/api/career/me/enrollments')).json();
  check(enrollments.primary.track === selected, 'student can choose a non-recommended career and receive that roadmap');
  await discovery.close();
  const admin = await browser.newContext({ viewport: { width: 1440, height: 1000 } }); await admin.addCookies([{ name: 'el_token', value: ready.cookies[1].slice('el_token='.length), url: base }]);
  await admin.route('**/*', r => r.request().url().startsWith(base) ? r.continue() : r.abort());
  const ap = await admin.newPage(); ap.on('pageerror', e => errors.push(e.message)); await ap.goto(base + '/dashboard');
  await ap.waitForFunction(() => typeof renderAdminCareer === 'function' && document.getElementById('app').style.display !== 'none');
  await ap.evaluate(() => show('admin-career')); await ap.evaluate(() => renderAdminCareer('curriculum')); await ap.getByText('Planned subtracks', { exact: true }).waitFor();
  check((await ap.locator('#view-admin-career').innerText()).includes('132'), 'admin inventory loads'); await ap.screenshot({ path: path.join(output, 'admin-curriculum.png'), fullPage: true });
  for (const width of [320, 390, 768, 1024, 1440]) { await ap.setViewportSize({ width, height: 1000 }); check(await ap.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `admin ${width}: no page overflow`); }
  await ap.setViewportSize({ width: 390, height: 844 }); await ap.screenshot({ path: path.join(output, 'admin-curriculum-mobile.png'), fullPage: true });

  await admin.close();
  check(errors.length === 0, 'no browser JavaScript errors: ' + errors.join('; '));
  fs.writeFileSync(path.join(output, 'results.json'), JSON.stringify({ assertions, passed: true, responsive: rows, primaryActionContrast: contrast, errors }, null, 2));
  console.log(JSON.stringify({ assertions, passed: true, responsiveWidths: rows.map(r => r.width), output }));
})().catch(error => { console.error(error); fs.writeFileSync(path.join(output, 'failure.json'), JSON.stringify({ error: error.stack, assertions, errors }, null, 2)); process.exitCode = 1; }).finally(async () => {
  await browser?.close();
  if (child.exitCode === null && child.signalCode === null) { const done = once(child, 'exit'); child.kill(); await done; }
  fs.writeFileSync(path.join(output, 'server.log'), logs); fs.rmSync(runtime, { recursive: true, force: true });
});
