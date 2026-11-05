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
const child = fork(path.join(__dirname, 'fixtures/certificate-server.cjs'), [], { env: { ...process.env, ECHOLENS_TEST_RUNTIME: runtime, ECHOLENS_TEST_ONBOARDING: '1' }, silent: true });
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
  await go('history'); check(await page.locator('.cr-table a[href^="#sres/"]').count() === 1, 'shared assessment history includes comprehensive results');
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
  check((await dp.locator('h1').innerText()).includes('Discover Your Potential. Build Your Future.'), 'welcome communicates the complete discovery journey');
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
  await override.click(); await dp.waitForURL(/#path\//); await dp.locator('#career h1').waitFor();
  const roleLink = dp.locator('a[href^="#role/"]').first(); await roleLink.click(); await dp.locator('#cuTarget').click(); await dp.locator('#cuTargetMsg a').click(); await dp.waitForURL(/#me$/); await dp.locator('.cx-command').waitFor();
  const enrollments = await (await discovery.request.get(base + '/api/career/me/enrollments')).json();
  check(enrollments.primary.track === selected, 'student can choose a non-recommended career and receive that roadmap');
  await discovery.close();
  // The real free-course activity pointer must open the correct task after reload.
  await go('me');
  const workspace = await (await ctx.request.get(base + '/api/career/me/workspace')).json();
  const resumeHref = workspace.continue_learning.resume;
  check(resumeHref.includes('/practice/'), 'stored unfinished task has an actual practice deep link');
  await page.getByRole('link', { name: 'Continue Your Lesson', exact: true }).first().click();
  await page.waitForURL(base + resumeHref); await page.locator('#svSplit').waitFor({ state: 'visible' });
  check(await page.locator('#svTitle').count() > 0 || await page.locator('#svSplit').isVisible(), 'Continue Learning opens the existing course workspace');
  const activity = await page.evaluate(() => ({ key:CUR.track.key, current:{level:CUR_PROBLEM.level,pid:CUR_PROBLEM.pid}, other:CUR.levels.filter(l=>!l.locked).flatMap(l=>l.problems.map(p=>({level:l.no,pid:p.pid}))).find(p=>p.level!==CUR_PROBLEM.level||p.pid!==CUR_PROBLEM.pid) }));
  check(!!activity.other, 'course fixture has another accessible task for resume navigation');
  for (const task of [activity.other,activity.current]) await Promise.all([
    page.waitForResponse(r=>r.url().endsWith('/api/open/activity') && r.request().postDataJSON().level===task.level && r.request().postDataJSON().pid===task.pid),
    page.evaluate(task=>openSolve(task.level,task.pid),task)
  ]);
  const returned = await (await ctx.request.get(base + '/api/career/me/workspace')).json();
  check(returned.continue_learning.resume.endsWith('/lesson/'+activity.current.level+'/practice/'+activity.current.pid), 'returning to a recently opened task updates the last lesson instead of being throttled');
  await go('me');
  for (const width of [320,390,768,1024,1440]) {
    await page.setViewportSize({width,height:1000}); await noOverflow('unified courses ' + width);
    await page.screenshot({path:path.join(output,`dashboard-${width}.png`),fullPage:true});
  }
  const legacyGuest = await browser.newContext();
  await legacyGuest.route('**/*', r => r.request().url().startsWith(base) ? r.continue() : r.abort());
  await legacyGuest.addInitScript(() => localStorage.setItem('elDiscovery.v1',JSON.stringify({answers:{experience:'basics'},step:1})));
  const lp = await legacyGuest.newPage(); await lp.goto(base + '/career#discover/about/1'); await lp.locator('input[value=basics]').waitFor();
  check(await lp.locator('input[value=basics]').isChecked(), 'existing anonymous browser drafts migrate into scoped storage');
  await legacyGuest.close();
  // New registration, skip, return, resume optional questions, offline save and quiz skip.
  const beginner = await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});
  await beginner.route('**/*', r => r.request().url().startsWith(base) ? r.continue() : r.abort());
  const bp = await beginner.newPage(); bp.on('pageerror', e => errors.push(e.message)); bp.setDefaultTimeout(12000);
  await bp.goto(base + '/open');
  if (await bp.locator('.cc-decline').isVisible()) await bp.locator('.cc-decline').click();
  await bp.goto(base + '/open#signup');
  if (!await bp.locator('#suForm').isVisible()) await bp.getByRole('button', {name:/create.*account/i}).first().click();
  for (const [name,value] of Object.entries({name:'Beginner Test',email:'beginner@qa.invalid',whatsapp:'03001234567',city:'Lahore',university:'Synthetic School',degree:'Computer Science'})) await bp.locator('#suForm [name="'+name+'"]').fill(value);
  await bp.locator('#suForm [name=study_year]').selectOption('1'); await bp.locator('#suForm [value=adult]').check();
  const signup = bp.waitForResponse(r => r.url().endsWith('/api/auth/register-open'));
  await bp.locator('#suBtn').click(); const signedUp = await signup; check(signedUp.ok(), 'real beginner registration succeeds');
  const signupResult = await signedUp.json();
  await bp.waitForURL(/\/career#discover$/); await bp.locator('#dcSkip').click(); await bp.waitForURL(/#me$/);
  await bp.getByRole('heading',{name:'Continue Learning',exact:true}).waitFor();
  check((await bp.locator('.cx-measures').innerText()).includes('Not yet assessed'), 'new dashboard shows no fabricated zero skill scores');
  await bp.goto(base + '/career'); await bp.waitForURL(/#me$/); check(!await bp.locator('#dcGo').isVisible(), 'skip is remembered across a return visit');
  await bp.getByRole('link',{name:'Learning preferences',exact:true}).click();
  await bp.locator('.dc-option').filter({has:bp.locator('input[value=never]')}).click(); await bp.locator('#dcNext').click();
  await bp.locator('.dc-option').filter({has:bp.locator('input[value=python]')}).click(); await bp.locator('#dcNext').click();
  await bp.locator('.dc-option').filter({has:bp.locator('input[value=security]')}).click(); await bp.reload(); await bp.locator('input[value=security]').waitFor();
  check(await bp.locator('input[value=security]').isChecked(), 'onboarding selection survives reload before Next');
  await bp.locator('#dcNext').click(); await bp.locator('.dc-option').filter({has:bp.locator('input[value=job]')}).click(); await bp.locator('#dcNext').click();
  await bp.route('**/api/career/me/discovery', r => r.request().method() === 'PUT' ? r.fulfill({status:503,contentType:'application/json',body:'{"error":"Synthetic offline save"}'}) : r.continue());
  await bp.locator('.dc-option').filter({has:bp.locator('input[value="3_5"]')}).click();
  await bp.locator('#dcSync').filter({hasText:'Sync pending'}).waitFor(); await bp.reload(); await bp.locator('input[value="3_5"]').waitFor();
  check(await bp.locator('input[value="3_5"]').isChecked(), 'failed preference sync preserves local progress after reload');
  await bp.unroute('**/api/career/me/discovery'); await bp.locator('#dcNext').click(); await bp.locator('#dcNoQuiz').click();
  await bp.locator('#dcRh').waitFor(); check(await bp.locator('.dc-rec').count() > 0, 'beginner can skip quiz and receive suggestions');
  await bp.locator('[data-choose="cybersecurity-analyst"]').first().click(); await bp.waitForURL(/#path\/cybersecurity-analyst$/);
  await bp.locator('a[href^="#role/"]').first().click(); await bp.locator('#cuTarget').click(); await bp.locator('#cuTargetMsg a').click();
  await bp.waitForURL(/#me$/); await bp.locator('.cx-command').waitFor();
  check((await bp.locator('.cx-welcome').innerText()).includes('Cybersecurity'), 'onboarding ends at dashboard with selected role and career');
  // Switching identities in the same browser must not import another student's preferences.
  await beginner.addCookies([{name:'el_token',value:ready.cookies[7].slice('el_token='.length),url:base}]);
  check((await (await beginner.request.get(base + '/api/auth/me')).json()).id === 7, 'account-switch fixture authenticates the independent student');
  await bp.goto(base + '/career#discover/about/1'); await bp.locator('input[value=never]').waitFor();
  check(!await bp.locator('input[value=never]').isChecked(), 'same-browser account switch isolates preferences');
  await beginner.clearCookies(); await bp.goto(base + '/login');
  await bp.locator('#loginForm input[name=login]').fill('beginner@qa.invalid'); await bp.locator('#loginForm input[name=password]').fill(signupResult.password);
  await bp.locator('#loginForm button[type=submit]').click(); await bp.waitForURL(/\/career#me$/); await bp.locator('.cx-welcome').waitFor();
  check((await bp.locator('.cx-welcome').innerText()).includes('Cybersecurity'), 'returning login restores career without forced onboarding');
  await beginner.close();
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
  fs.rmSync(path.join(output, 'failure.json'), {force:true});
  console.log(JSON.stringify({ assertions, passed: true, responsiveWidths: rows.map(r => r.width), output }));
})().catch(error => { console.error(error); fs.writeFileSync(path.join(output, 'failure.json'), JSON.stringify({ error: error.stack, assertions, errors }, null, 2)); process.exitCode = 1; }).finally(async () => {
  await browser?.close();
  if (child.exitCode === null && child.signalCode === null) { const done = once(child, 'exit'); child.kill(); await done; }
  fs.writeFileSync(path.join(output, 'server.log'), logs); fs.rmSync(runtime, { recursive: true, force: true });
});
