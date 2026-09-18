'use strict';
// Uses the audit's already-installed Playwright/Chrome; adds no dependency.
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), os = require('node:os');
const { fork } = require('node:child_process'), { once } = require('node:events');
const { launch } = require('../qa-audit/browser-lib.cjs');
const { pages } = require('../legal-pages');
const runtime = fs.mkdtempSync(path.join(os.tmpdir(), 'echolens-legal-browser-'));
const evidence = path.join(__dirname, 'evidence/legal-pages');
fs.mkdirSync(evidence, { recursive: true });
const child = fork(path.join(__dirname, '../test/fixtures/legal-pages-server.cjs'), [], { env: { ...process.env, ECHOLENS_TEST_RUNTIME: runtime }, silent: true, execArgv: [] });
let logs = '', browser;
child.stdout.on('data', data => logs += data); child.stderr.on('data', data => logs += data);
(async () => {
  try {
    const ready = await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(Error(logs)), 20000);
      child.once('message', data => { clearTimeout(timer); resolve(data); });
      child.once('exit', () => { clearTimeout(timer); reject(Error(logs)); });
    });
    const base = 'http://127.0.0.1:' + ready.port;
    browser = await launch();
    const results = [], errors = [];
    for (const width of [1440, 390, 320]) {
      const context = await browser.newContext({ viewport: { width, height: 900 }, isMobile: width < 600, hasTouch: width < 600 });
      await context.route('**/*', route => new URL(route.request().url()).origin === base ? route.continue() : route.abort());
      const page = await context.newPage(); page.on('pageerror', error => errors.push(error.message));
      for (const route of [...Object.keys(pages), '/', '/courses', '/open#free', '/compiler', '/login']) {
        await page.goto(base + route, { waitUntil: 'networkidle' });
        const size = await page.evaluate(() => ({ width: innerWidth, scroll: document.documentElement.scrollWidth }));
        assert.ok(size.scroll <= size.width, `${width} ${route} overflows: ${JSON.stringify(size)}`);
        const links = await page.locator('.public-footer .foot-col').last().locator('a').evaluateAll(elements => elements.map(el => el.getAttribute('href')));
        assert.deepEqual(links, ['/about', '/contact', '/privacy-policy', '/terms', '/cookie-policy']);
        results.push({ width, route, ...size });
        if (route === '/contact' || route === '/privacy-policy') await page.screenshot({ path: path.join(evidence, `${route.slice(1)}-${width}.png`), fullPage: true });
      }
      if (width === 390) {
        await page.goto(base + '/contact');
        await page.locator('#contactName').fill('Synthetic Student');
        await page.locator('#contactEmail').fill('student@qa.invalid');
        await page.locator('#contactSubject').fill('Privacy question');
        await page.locator('#contactMessage').fill('Please explain the data correction process for my account.');
        const confirmation = page.waitForResponse(response => response.url().endsWith('/api/public/support-tickets') && response.request().method() === 'POST');
        await page.locator('#contactForm button').click(); assert.equal((await confirmation).status(), 201);
        await page.locator('#contactReply').waitFor({ state: 'visible' });
        assert.match(await page.locator('#contactStatus').innerText(), /Ticket EL-\d{6} submitted/);
        assert.match(await page.locator('#contactReply').getAttribute('href'), /^\/open#ticket=EL-\d{6}&token=/);
        await page.locator('#contactReply').click();
        await page.waitForLoadState('networkidle');
        assert.ok((await page.locator('body').innerText()).includes('Privacy question'));
        await page.goto(base + '/contact');
        await page.locator('#contactName').fill('Retained Student'); await page.locator('#contactEmail').fill('student@qa.invalid');
        await page.locator('#contactSubject').fill('Retry question'); await page.locator('#contactMessage').fill('Keep these details if submission fails.');
        await page.route('**/api/public/support-tickets', route => route.fulfill({ status: 429, contentType: 'application/json', body: JSON.stringify({ error: 'Please wait before trying again.' }) }));
        await page.locator('#contactForm button').click(); await page.locator('#contactStatus.contact-error').waitFor();
        assert.equal(await page.locator('#contactName').inputValue(), 'Retained Student');
        assert.equal(await page.locator('#contactForm button').isEnabled(), true);
        await page.locator('.public-footer [data-public-login]').click();
        assert.equal(new URL(page.url()).searchParams.get('returnTo'), '/contact');
        await page.locator('#forgotLink').click(); assert.equal(await page.locator('#forgotBox').isVisible(), true);
      }
      await context.close();
    }
    assert.deepEqual(errors, []);
    fs.writeFileSync(path.join(evidence, 'browser-results.json'), JSON.stringify({ results, checks: ['ticket creation and private reply', '429 retains inputs', 'footer login preserves return', 'existing forgot-password action'], errors }, null, 2));
    console.log(`PASS ${results.length} layouts; contact success/failure and navigation; zero JavaScript errors. Evidence: ${evidence}`);
  } finally {
    await browser?.close();
    const workers = path.join(runtime, 'workers.json');
    if (fs.existsSync(workers)) for (const pid of JSON.parse(fs.readFileSync(workers))) { try { process.kill(pid); } catch {} }
    if (child.exitCode === null && child.signalCode === null) { const exited = once(child, 'exit'); child.kill(); await exited; }
    assert.equal(path.dirname(path.resolve(runtime)), path.resolve(os.tmpdir()));
    assert.ok(path.basename(runtime).startsWith('echolens-legal-browser-'));
    fs.rmSync(runtime, { recursive: true, force: true });
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
