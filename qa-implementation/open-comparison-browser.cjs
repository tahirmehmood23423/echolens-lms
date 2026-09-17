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

  for (const width of [1440,390]) {
    const ctx=await browser.newContext({viewport:{width,height:1000}});
    await ctx.route('**/*',r=>new URL(r.request().url()).origin===base?r.continue():r.abort());
    const page=await ctx.newPage();page.setDefaultTimeout(15000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
    const settle=()=>page.waitForFunction(()=>OPEN_READY&&!RESTORING_NAV);
    await page.goto(base+'/open');await settle();assert.ok(await page.locator('#tab-home').isVisible());
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    assert.ok(await page.locator('.home-learning-card').first().evaluate(el=>el.getBoundingClientRect().height<310));
    assert.equal(await page.locator('.home-explore-grid a').count(),4);
    await page.screenshot({path:path.join(evidence,'comparison-completed-'+width+'.png'),fullPage:true});
    await page.locator('.home-learning-card.paid a').click();assert.equal(await page.locator('#cFree').inputValue(),'paid');
    await page.locator('#cSearch').fill('SC-01');await page.waitForFunction(()=>location.hash.includes('search=sc-01'));const catalogue=page.url();
    await page.locator('#courseTable .oc-btn').first().click();await page.locator('#courseHead .crumb').waitFor();const course=page.url();
    await page.locator('#courseHead .crumb a').first().click();await settle();assert.equal(page.url(),catalogue);assert.equal(await page.locator('#cSearch').inputValue(),'sc-01');
    await page.goForward();await settle();assert.equal(page.url(),course);
    await page.locator('#courseHead .hero-cta').click();await page.locator('#regInterest').waitFor();
    await page.locator('#regInterest [name=name]').fill('Synthetic Client');
    await page.goBack();await settle();assert.equal(page.url(),course);assert.ok(!await page.locator('#modal').evaluate(e=>e.classList.contains('open')));
    await page.goForward();await settle();assert.equal(await page.locator('#regInterest [name=name]').inputValue(),'Synthetic Client');
    await page.reload();await settle();assert.equal(await page.locator('#regInterest [name=name]').inputValue(),'Synthetic Client');
    await page.keyboard.press('Escape');await settle();assert.equal(page.url(),course);
    await page.goto(base+'/open#free');await settle();await page.locator('.oc-lang-btn').filter({hasText:'JavaScript'}).click();await page.waitForFunction(()=>location.hash.includes('family=javascript'));const family=page.url();
    await page.reload();await settle();assert.equal(page.url(),family);assert.ok(await page.locator('.oc-lang-back').isVisible());
    await page.locator('#courseTable .oc-btn').first().click();await page.locator('#courseHead .crumb').waitFor();
    await page.getByRole('button',{name:'Sign in free',exact:true}).click();await page.locator('#modal.open').waitFor();
    await page.goBack();await settle();assert.ok(!await page.locator('#modal').evaluate(e=>e.classList.contains('open')));
    await page.goForward();await settle();await page.locator('#modal.open').waitFor();
    await page.keyboard.press('Escape');await settle();await page.locator('#courseHead .crumb a').first().click();await settle();assert.equal(page.url(),family);
    await page.getByRole('link',{name:'Home',exact:true}).click();await settle();assert.ok(await page.locator('#tab-home').isVisible());
    assert.deepEqual(errors,[]);results.push({width,passed:true});console.log('PASS comparison, filters, free family, registration draft and Back/Forward',width);await ctx.close();
  }
  fs.writeFileSync(path.join(evidence,'comparison-completed-results.json'),JSON.stringify(results,null,2));
})().catch(e=>{console.error(e);console.error(logs.slice(-2000));process.exitCode=1}).finally(async()=>{if(browser)await browser.close();if(child.exitCode===null&&child.signalCode===null){const done=once(child,'exit');child.kill();await done}});
