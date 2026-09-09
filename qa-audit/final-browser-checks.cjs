'use strict';
const fs=require('node:fs'),path=require('node:path');
const {BASE,launch,context,login,inspect,screenshot}=require('./browser-lib.cjs');
const fixture=require('./runtime/fixtures.json'),results=[];
const save=()=>fs.writeFileSync(path.join(__dirname,'evidence/final-browser-checks.json'),JSON.stringify(results,null,2));
function check(id,expected,actual,ok,scope='real local UI'){results.push({id,expected,actual,status:ok?'PASS':'FAIL',scope});save();console.log(JSON.stringify(results.at(-1)));}
async function goto(p,url){await p.goto('about:blank');await p.goto(BASE+url,{waitUntil:'domcontentloaded'});await p.waitForTimeout(500);}
(async()=>{const b=await launch();try{
 for(const role of ['student','instructor','admin']){
  const ctx=await context(b,{width:390,height:844});await login(ctx,role);const p=await ctx.newPage();await goto(p,'/dashboard');await screenshot(p,`dashboard-${role}-mobile`);
  const m=await inspect(p);check(`MOBILE-${role}`,'Dashboard fits 390px viewport',{width:m.width,documentWidth:m.documentWidth,overflow:m.overflow},m.documentWidth<=m.width);
  if(role==='student'){
   const entry=await p.locator('button:visible').allTextContents();
   await p.getByRole('button',{name:'Resume learning',exact:true}).click();await p.waitForTimeout(400);
   await screenshot(p,'paid-course-mobile');
   const graded=require('./runtime/graded-fixture.json');
   await p.evaluate(({qid,pid})=>openTask(qid,pid),graded);await p.waitForTimeout(300);
   const code=p.locator('#taskCode');
   const field=await code.count()?code:p.locator('textarea:visible').first();
   const prior=await field.inputValue();await field.fill('print("QA PAID UNSAVED DRAFT")');
   await screenshot(p,'paid-task-mobile');
   const taskText=await p.locator('#view-task').innerText();
   check('GRADE-UI','Learner sees teacher grade and remarks',{has80:taskText.includes('80'),hasRemarks:taskText.includes('QA reviewed feedback'),priorCode:prior},taskText.includes('80')&&taskText.includes('QA reviewed feedback'));
   await p.reload({waitUntil:'domcontentloaded'});await p.waitForTimeout(400);
   check('PAID-DRAFT-REFRESH','Paid learner task and draft survive refresh',{title:await p.locator('#pageTitle').innerText(),codeVisible:await p.locator('textarea:visible').count()},await p.locator('textarea:visible').count()>0);
  }
  await ctx.close();
 }
 {
  const ctx=await context(b);const p=await ctx.newPage();await goto(p,'/open#free');
  await p.locator('.nlink[data-catnav="live"]').click();await p.waitForTimeout(200);
  const values=await p.evaluate(()=>({mode:COURSE_NAV_MODE,free:document.getElementById('cFree').value,shown:document.getElementById('courseTable').innerText.slice(0,260)}));
  check('FILTER-LIVE-AFTER-FREE','Live Tech Courses resets the Free-only filter',values,values.free!=='free');await screenshot(p,'live-nav-free-filter');
  await p.locator('#cSearch').fill('QA-NO-MATCH');await p.locator('#cSearch').dispatchEvent('input');await p.waitForTimeout(150);
  const empty=await p.locator('#courseTable').innerText();
  await p.locator('#cSearch').fill('');await p.locator('#cSearch').dispatchEvent('input');await p.waitForTimeout(150);
  check('FILTER-EMPTY-RECOVERY','No-match search is explicit and clearing query restores results',{empty,restored:(await p.locator('#courseTable').innerText()).slice(0,80)},empty.includes('No courses match')&&!(await p.locator('#courseTable').innerText()).includes('No courses match'));
  await login(ctx,'student');await goto(p,'/dashboard');
  const graded=require('./runtime/graded-fixture.json');
  await p.evaluate(id=>openCourse(id),fixture.batchId);await p.waitForTimeout(250);await p.evaluate(({qid,pid})=>openTask(qid,pid),graded);await p.waitForTimeout(250);await screenshot(p,'paid-task-desktop');
  // External public verification, using only this audit's synthetic document.
  const cert=require('./runtime/certificate-fixture.json');await ctx.clearCookies();await goto(p,cert.url);await screenshot(p,'certificate-verification');
  check('CERT-VERIFY-UI','Public verification displays the issued synthetic certificate',{text:(await p.locator('body').innerText()).slice(0,1500)},(await p.locator('body').innerText()).includes('QA NONMEMBER CERTIFICATE'));
  await ctx.close();
 }
}finally{await b.close();save()}})().catch(e=>{console.error(e);process.exitCode=1});
