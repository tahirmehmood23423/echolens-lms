'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { BASE, launch, context, login, inspect, screenshot } = require('./browser-lib.cjs');
const results = [];
const mode = process.argv[2] || 'all';
const file = path.join(__dirname, 'evidence', mode === 'all' ? 'browser-survey.json' : `browser-survey-${mode}.json`);
async function record(page, name) {
  await page.waitForTimeout(600);
  const result = { name, ...await inspect(page) };
  await screenshot(page, name);
  results.push(result);
  fs.writeFileSync(file, JSON.stringify(results, null, 2));
  console.log(JSON.stringify({ name, url: result.url, headings: result.heading, overflow: result.documentWidth > result.width, unnamed: result.unnamedButtons.length, clickOnly: result.clickOnly.length }));
}
(async () => {
  const browser = await launch();
  console.log('Browser: ' + browser.version());
  try {
    for (const viewport of mode === 'remaining' ? [] : [{ width: 1440, height: 1000 }, { width: 390, height: 844 }]) {
      const suffix = viewport.width < 600 ? 'mobile' : 'desktop';
      const ctx = await context(browser, viewport);
      const page = await ctx.newPage();
      const errors = [];
      page.on('pageerror', e => errors.push({ url: page.url(), error: e.message }));
      for (const [name, url] of [['landing','/'],['catalogue','/courses'],['open','/open'],['free-courses','/open#free'],['events','/open#events'],['announcements','/open#announcements'],['login','/login'],['recruiter-signup','/recruiter-signup'],['compiler-signed-out','/compiler'],['talent-projects','/talent/projects'],['showcase','/showcase'],['privacy','/privacy'],['invalid-certificate','/cert?s=QA-NONEXISTENT'],['invalid-reset','/reset-password?token=invalid'],['invalid-challan','/challan?s=QA-NONEXISTENT']]) {
        try { await page.goto('about:blank'); await page.goto(BASE + url, { waitUntil: 'domcontentloaded' }); await record(page, `${name}-${suffix}`); } catch(e) { results.push({ name: `${name}-${suffix}`, error: e.message }); }
      }
      fs.writeFileSync(path.join(__dirname, 'evidence', `public-errors-${suffix}.json`), JSON.stringify(errors, null, 2));
      await ctx.close();
    }
    for (const role of mode === 'public' ? [] : mode === 'remaining' ? ['staff','ambassador','recruiter','free'] : ['empty','student','instructor','admin','coordinator','hr','finance','student_coordinator','staff','ambassador','recruiter','free']) {
      const ctx = await context(browser);
      await login(ctx, role);
      const page = await ctx.newPage();
      const errors = [];
      const badRequests = [];
      page.on('pageerror', e => errors.push(e.message));
      page.on('response', r => { if (r.url().startsWith(BASE + '/api/') && r.status() >= 400) badRequests.push({ url: r.url(), status: r.status() }); });
      await page.goto(BASE + '/dashboard', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(700);
      await record(page, `dashboard-${role}`);
      const nav = await page.locator('.nav-item[data-view]:visible').evaluateAll(nodes => nodes.map(n => ({ view: n.dataset.view, label: n.innerText })));
      for (const {view,label} of nav) {
        try {
          await page.locator(`.nav-item[data-view="${view}"]`).click({ timeout: 2500 });
          await page.waitForTimeout(300);
          const out = await inspect(page);
          results.push({ name: `view-${role}-${view}`, navLabel: label, ...out });
          if (['settings','courses','assignments','talent-profile','admin-catalogue','admin-logs','admin-mailer'].includes(view)) await screenshot(page, `view-${role}-${view}`);
        } catch (e) { results.push({ name: `view-${role}-${view}`, error: e.message }); }
      }
      results.push({ name: `role-errors-${role}`, errors, badRequests, nav });
      fs.writeFileSync(file, JSON.stringify(results, null, 2));
      console.log(JSON.stringify({ role, views: nav.length, errors, badRequests }));
      await ctx.close();
    }
  } finally { await browser.close(); fs.writeFileSync(file, JSON.stringify(results, null, 2)); }
})().catch(e => { console.error(e); process.exitCode = 1; });
