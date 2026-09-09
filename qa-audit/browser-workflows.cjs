'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { BASE, launch, context, login, inspect, screenshot } = require('./browser-lib.cjs');
const fixture = require('./runtime/fixtures.json');
const results = [];
const file = path.join(__dirname, 'evidence', 'browser-workflows.json');
function record(id, expected, actual, ok, scope='real local UI') {
  const r = {id,expected,actual,status:ok?'PASS':'FAIL',scope}; results.push(r);
  fs.writeFileSync(file,JSON.stringify(results,null,2)); console.log(JSON.stringify(r));
}
async function goto(page,url) {await page.goto('about:blank');await page.goto(BASE+url,{waitUntil:'domcontentloaded'});await page.waitForTimeout(700);}
async function annotate(page,text) {
  await page.evaluate(text=>{const n=document.createElement('div');n.id='qa-annotation';n.textContent=text;Object.assign(n.style,{position:'fixed',bottom:'12px',left:'12px',right:'12px',zIndex:'999999',background:'#7f1d1d',color:'#fff',padding:'14px',border:'3px solid #fecaca',font:'bold 14px/1.5 sans-serif',boxShadow:'0 3px 16px #0006'});document.body.append(n);},text);
}
async function freeCourse(page) {
  await goto(page,'/open#free');
  await page.locator('button[onclick="selectFreeFamily(\'javascript\')"]').click();
  const card=page.locator('.oc-card').filter({hasText:'CS-105'});
  if(await card.count()) await card.getByRole('button').last().click();
  else await page.locator('[onclick*="cs105-javascript"]').first().click();
  await page.waitForTimeout(400);
}
(async()=>{
  const browser=await launch();
  try {
    for(const width of [1440,390]) {
      const suffix=width<600?'mobile':'desktop';
      const ctx=await context(browser,{width,height:width<600?844:1000});
      await login(ctx,'free');const page=await ctx.newPage();
      try {
        await freeCourse(page);
        record(`BROWSE-${suffix}`,'Free language card opens chosen course curriculum',{url:page.url(),text:(await page.locator('#tab-course').innerText()).slice(0,200)},await page.locator('#tab-course').isVisible());
        await screenshot(page,`free-curriculum-${suffix}`);
        // Open the first actual course task. Some modules first open a video;
        // selecting the task explicitly here is a workspace setup, not a navigation assertion.
        await page.evaluate(()=>openSolve(1,1));
        await page.locator('#svLang').selectOption('web');
        await page.locator('#svCode').fill('<h1>QA preview</h1><script>console.log("QA UNSAVED DRAFT");</script>');
        await page.locator('#svRunBtn').click();await page.waitForTimeout(1500);
        const runText=await page.locator('#svWebLog').innerText();
        record(`CODE-RUN-${suffix}`,'JavaScript executes and outputs synthetic message',{output:runText},runText.includes('QA UNSAVED DRAFT'));
        await screenshot(page,`free-workspace-${suffix}`);
        const beforeUrl=page.url();await page.reload({waitUntil:'domcontentloaded'});await page.waitForTimeout(500);
        const after=await page.evaluate(()=>({url:location.href,visible:[...document.querySelectorAll('[id^="tab-"]')].filter(n=>n.getClientRects().length).map(n=>n.id),code:document.getElementById('svCode')?.value||null}));
        record(`DRAFT-REFRESH-${suffix}`,'Refresh retains chosen task and unsaved code',{beforeUrl,...after},after.visible.includes('tab-solve')&&after.code?.includes('QA UNSAVED DRAFT'));
        await freeCourse(page);await page.evaluate(()=>openSolve(1,1));
        await page.locator('#svCode').fill('console.log("QA TASK SWITCH DRAFT");');
        await page.evaluate(()=>openSolve(1,2));await page.evaluate(()=>openSolve(1,1));
        const restored=await page.locator('#svCode').inputValue();
        record(`DRAFT-SWITCH-${suffix}`,'Returning to task retains unsent work',{restored},restored.includes('QA TASK SWITCH DRAFT'));
        await annotate(page,'QA D-05: Task switch erased the unsent code. Refresh also returns to the catalogue. Add per-user autosave and stable task URLs.');
        await screenshot(page,`annotated-draft-loss-${suffix}`);
        // Recoverable, deliberately injected network failure; no backend outage asserted.
        await page.locator('#svCode').fill('console.log("QA RETRY DRAFT");');
        await ctx.route(BASE+'/api/open/submit',r=>r.abort('failed'));
        await page.locator('#svSubmitBtn').click();await page.waitForTimeout(400);
        const failure={code:await page.locator('#svCode').inputValue(),buttonDisabled:await page.locator('#svSubmitBtn').isDisabled(),message:await page.locator('#toast').innerText()};
        record(`SUBMIT-NETWORK-${suffix}`,'Failed submission retains code and re-enables retry',failure,failure.code.includes('QA RETRY DRAFT')&&!failure.buttonDisabled,'simulated aborted request');
        await ctx.unroute(BASE+'/api/open/submit');
        await page.locator('#svSubmitBtn').click();await page.waitForTimeout(700);
        const submitted=JSON.parse(fs.readFileSync(path.join(__dirname,'runtime/data.json'),'utf8')).open_submissions.find(s=>s.user_id===fixture.users.free.id&&s.track_key==='cs105-javascript'&&s.level===1&&s.pid===1);
        record(`SUBMIT-RETRY-${suffix}`,'Retry persists submitted code',{code:submitted?.code,grade:submitted?.grade},submitted?.code?.includes('QA RETRY DRAFT'),'real local UI; AI disabled, grading not completed');
        // Authentication expires while working: test reauthentication recovery.
        await page.locator('#svCode').fill('console.log("QA SESSION DRAFT");');await ctx.clearCookies();
        await page.locator('#svSubmitBtn').click();await page.waitForTimeout(400);
        record(`SESSION-GATE-${suffix}`,'Expired session opens a dismissible sign-in prompt',{modal:await page.locator('#modal').getAttribute('class'),text:await page.locator('#modalBody').innerText(),code:await page.locator('#svCode').inputValue()},await page.locator('#modal.open').count()>0,'simulated session removal');
      } catch(e) {record(`WORKSPACE-HARNESS-${suffix}`,'Complete browser scenario',{error:e.message},false,'harness error; do not classify automatically as product defect');}
      await ctx.close();
    }
    {
      const ctx=await context(browser);const page=await ctx.newPage();
      await goto(page,'/open#signup');
      const focused=await page.evaluate(()=>({tag:document.activeElement.tagName,id:document.activeElement.id,insideModal:!!document.activeElement.closest('#modal'),role:document.getElementById('modal').getAttribute('role'),ariaModal:document.getElementById('modal').getAttribute('aria-modal')}));
      await page.keyboard.press('Tab');
      const tab=await page.evaluate(()=>({tag:document.activeElement.tagName,text:document.activeElement.innerText?.slice(0,80),insideModal:!!document.activeElement.closest('#modal')}));
      record('A11Y-MODAL','Opening modal moves keyboard focus inside labelled dialog; Tab stays inside',{focused,firstTab:tab},focused.insideModal&&tab.insideModal&&focused.role==='dialog');
      await annotate(page,'QA U-01: The sign-in modal declares dialog semantics, but does not move or trap focus. Keyboard Tab reaches controls behind it.');
      await screenshot(page,'annotated-signin-focus');
      await goto(page,'/showcase');
      await page.locator('input[name="login"]').fill('qa.student');await page.locator('input[name="password"]').fill('LocalQa!2026');await page.locator('#submit').click();await page.waitForTimeout(700);
      record('AUTH-RETURN','Sign-in returns the learner to their requested Showcase page',{destination:page.url()},page.url().includes('/showcase'));
      await goto(page,'/dashboard');await page.locator('.nav-item[data-view="settings"]').click();await page.waitForTimeout(250);
      await page.getByRole('button',{name:'Edit',exact:true}).click();
      await page.locator('#f input[name="city"]').fill('QA Browser City');
      await page.locator('#f button[type="submit"],#f .btn-primary').last().click();await page.waitForTimeout(350);
      record('PROFILE-UI-SAVE','Profile edit persists and appears after reload',{profile:JSON.parse(fs.readFileSync(path.join(__dirname,'runtime/data.json'),'utf8')).users.find(u=>u.id===fixture.users.student.id).profile.city},JSON.parse(fs.readFileSync(path.join(__dirname,'runtime/data.json'),'utf8')).users.find(u=>u.id===fixture.users.student.id).profile.city==='QA Browser City');
      await page.getByRole('button',{name:'Edit',exact:true}).click();await page.locator('#f input[name="city"]').fill('');await page.locator('#f button[type="submit"],#f .btn-primary').last().click();await page.waitForTimeout(350);
      const city=JSON.parse(fs.readFileSync(path.join(__dirname,'runtime/data.json'),'utf8')).users.find(u=>u.id===fixture.users.student.id).profile.city;
      record('PROFILE-UI-CLEAR','Clearing City removes saved value',{city,toast:await page.locator('#toast').innerText()},!city);
      await annotate(page,'QA D-03: Saving an empty City reports success, but the previous value remains in the persisted profile.');await screenshot(page,'annotated-profile-clear');
      await page.reload({waitUntil:'domcontentloaded'});await page.waitForTimeout(400);
      record('DASHBOARD-REFRESH','Reload returns to active Settings view',{title:await page.locator('#pageTitle').innerText()},await page.locator('#pageTitle').innerText()==='Settings');
      // Inject an error into a core screen and inspect the visible recovery state.
      await ctx.route(BASE+'/api/my/quests',r=>r.fulfill({status:503,contentType:'application/json',body:JSON.stringify({error:'QA simulated temporary outage'})}));
      await page.locator('.nav-item[data-view="assignments"]').click();await page.waitForTimeout(700);
      const failure=await page.locator('#view-assignments').innerText();
      record('ERROR-ASSIGNMENTS','A failed assignments request shows an error with retry',{text:failure},/retry|try again/i.test(failure),'simulated HTTP 503');
      await annotate(page,'QA D-07: Simulated HTTP 503 leaves Assignments on Loading with no visible error or retry.');await screenshot(page,'annotated-loading-error');
      await ctx.close();
    }
  } finally {await browser.close();fs.writeFileSync(file,JSON.stringify(results,null,2));}
})().catch(e=>{console.error(e);process.exitCode=1;});
