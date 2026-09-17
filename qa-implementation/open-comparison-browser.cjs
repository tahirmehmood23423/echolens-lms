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
    const settle=()=>page.waitForFunction(()=>typeof OPEN_READY !== 'undefined' && OPEN_READY && !RESTORING_NAV);
    await page.goto(base+'/');await page.locator('#learning-options').waitFor();
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    assert.ok(await page.locator('.home-learning-card').first().evaluate(el=>el.getBoundingClientRect().height<850));

    assert.equal(await page.locator('#learning-free li').count(),6);assert.equal(await page.locator('#learning-paid li').count(),7);
    await page.locator('[data-learning-choice=free]').click();assert.equal(await page.locator('[data-learning-choice=free]').getAttribute('aria-pressed'),'true');
    await page.locator('[data-learning-choice=paid]').click();assert.equal(await page.locator('[data-learning-choice=paid]').getAttribute('aria-pressed'),'true');
    await page.locator('#learning-options').screenshot({path:path.join(evidence,'comparison-completed-'+width+'.png')});
    await page.locator('.home-learning-card.paid a[href="/open#paid"]').click();await settle();assert.equal(await page.locator('#cFree').inputValue(),'paid');
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
    await page.getByRole('link',{name:'Home',exact:true}).click();await page.waitForURL(base+'/');assert.ok(await page.locator('#learning-options').isVisible());
    assert.deepEqual(errors,[]);results.push({width,passed:true});console.log('PASS comparison, filters, free family, registration draft and Back/Forward',width);await ctx.close();
  }

  for(const width of [1440,390]){
    const ctx=await browser.newContext({viewport:{width,height:1000}});await ctx.route('**/*',r=>new URL(r.request().url()).origin===base?r.continue():r.abort());
    const page=await ctx.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
    let expected;
    for(const route of ['/','/courses','/courses/prompt-engineering-and-chatgpt-claude-mastery','/compiler','/login','/privacy','/registration-status','/reset-password','/recruiter-signup']){
      await page.goto(base+route);await page.locator('.public-navigation').waitFor();
      if (['/','/courses','/login'].includes(route)) await page.screenshot({path:path.join(evidence,'shared-navigation-'+(route==='/'?'landing':route.slice(1))+'-'+width+'.png'),fullPage:false});
      const links=await page.locator('.public-navigation .nlink').evaluateAll(nodes=>nodes.map(n=>[n.textContent,n.getAttribute('href')]));
      expected ||= links;assert.deepEqual(links,expected,route+' uses identical menu');
      assert.equal(links[0][1],'/');assert.equal(links[1][1],'/open#paid');
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),route+' fits viewport');
      if(route==='/')continue;
      await page.locator('.public-navigation .nlink').first().click();await page.waitForURL(base+'/');await page.locator('#learning-options').waitFor();
      await page.goBack();await page.locator('.public-navigation').waitFor();assert.equal(new URL(page.url()).pathname,route);
      await page.goForward();await page.waitForURL(base+'/');await page.locator('#learning-options').waitFor();
    }
    assert.deepEqual(errors,[]);console.log('PASS shared public navigation across 9 routes',width);results.push({width,publicRoutes:9,consistentNavigation:true});await ctx.close();
  }

  {
    const ctx=await browser.newContext();const leaked=[];
    await ctx.route('**/*',r=>{const u=new URL(r.request().url());if(u.origin!==base)return r.abort();if(!u.pathname.startsWith('/demo'))leaked.push(u.pathname);return r.continue()});
    const page=await ctx.newPage();await page.goto(base+'/demo/open#home');await page.waitForFunction(()=>typeof OPEN_READY!=='undefined'&&OPEN_READY&&!RESTORING_NAV);
    await page.locator('.public-navigation [data-catnav=paid]').click();await page.waitForFunction(()=>!RESTORING_NAV);assert.equal(await page.locator('#cFree').inputValue(),'paid');
    await page.locator('.public-navigation [data-tab=home]').click();await page.waitForURL(base+'/demo/');
    assert.deepEqual(leaked,[]);console.log('PASS demo navigation remains scoped');await ctx.close();
  }
  {
    const ctx=await browser.newContext();await ctx.route('**/*',r=>new URL(r.request().url()).origin===base?r.continue():r.abort());const page=await ctx.newPage();
    for(const route of ['/open','/open#home','/open#compare']){await page.goto(base+route);await page.waitForURL(base+'/' + (route.endsWith('compare')?'#learning-options':''));await page.locator('#learning-options').waitFor();}
    console.log('PASS legacy Home URLs redirect to main website');await ctx.close();
  }
  fs.writeFileSync(path.join(evidence,'comparison-completed-results.json'),JSON.stringify(results,null,2));
})().catch(e=>{console.error(e);console.error(logs.slice(-2000));process.exitCode=1}).finally(async()=>{if(browser)await browser.close();if(child.exitCode===null&&child.signalCode===null){const done=once(child,'exit');child.kill();await done}});
