'use strict';
const fs=require('node:fs'),path=require('node:path');
const {BASE,launch,context,login,screenshot}=require('./browser-lib.cjs');
const results=[];
function record(id,actual,ok,scope){results.push({id,actual,status:ok?'PASS':'FAIL',scope});fs.writeFileSync(path.join(__dirname,'evidence/coverage-browser-final.json'),JSON.stringify(results,null,2));console.log(JSON.stringify(results.at(-1)));}
(async()=>{const browser=await launch();try{
 for(const width of [1440,390]){
  const ctx=await context(browser,{width,height:width<600?844:1000});await login(ctx,'student');const p=await ctx.newPage();await p.goto(BASE+'/dashboard');
  if(width<600)await p.locator('button.menu-toggle').click();
  await p.locator('[data-view="jobs"]').click();await p.locator('.job-card').filter({hasText:'QA Junior JavaScript Developer'}).click();await p.locator('#view-job a[href="https://employer.qa.invalid/apply"]').waitFor();
  const text=await p.locator('#view-job').innerText();const href=await p.locator('#view-job a[target="_blank"]').getAttribute('href');await screenshot(p,`populated-job-${width}`);
  record('JOB-UI-'+width,{hasComment:text.includes('QA asking about requirements'),externalExplained:text.includes('EchoLens does not handle'),href},text.includes('QA asking about requirements')&&text.includes('EchoLens does not handle')&&href==='https://employer.qa.invalid/apply','actual local Jobs navigation; external application not submitted');await ctx.close();
 }
 const ctx=await context(browser);await login(ctx,'free');const p=await ctx.newPage();await p.goto(BASE+'/open#free');await p.locator('button[onclick="selectFreeFamily(\'javascript\')"]').click();await p.locator('.oc-card').filter({hasText:'CS-105'}).getByRole('button').last().click();await p.waitForFunction(()=>CUR&&CUR.track&&CUR.levels);await p.evaluate(()=>openSolve(1,1));await p.locator('#svCode').fill('console.log("QA SLOW SUBMIT");');
 let requests=0;await ctx.route(BASE+'/api/open/submit',async route=>{requests++;await new Promise(resolve=>setTimeout(resolve,1800));await route.continue();});
 const box=await p.locator('#svSubmitBtn').boundingBox();await p.mouse.click(box.x+box.width/2,box.y+box.height/2);await p.mouse.click(box.x+box.width/2,box.y+box.height/2);
 const disabled=await p.locator('#svSubmitBtn').isDisabled();await p.evaluate(()=>openSolve(1,2));await p.locator('#svCode').fill('console.log("QA TASK TWO DRAFT");');await p.waitForTimeout(2800);
 const after=await p.locator('#svCode').inputValue();const student=require('./runtime/fixtures.json').users.free.id;const persisted=JSON.parse(fs.readFileSync(path.join(__dirname,'runtime/data.json'),'utf8')).open_submissions.find(s=>s.user_id===student&&s.track_key==='cs105-javascript'&&s.level===1&&s.pid===1);
 record('SLOW-DOUBLE-CLICK',{requests,disabledDuringSubmit:disabled,taskTwoDraft:after,persistedTaskOne:persisted?.code},requests===1&&disabled&&after.includes('QA TASK TWO DRAFT')&&persisted?.code?.includes('QA SLOW SUBMIT'),'deliberate 1800ms request delay, two physical mouse clicks, task switch during pending submit; search/pagination races untested');await screenshot(p,'slow-submit-task-switch');await ctx.close();
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
