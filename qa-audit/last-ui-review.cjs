'use strict';
const fs=require('node:fs'),path=require('node:path');
const {BASE,launch,context,login,inspect,screenshot}=require('./browser-lib.cjs');
const results=[];
async function save(p,name){await p.waitForTimeout(450);results.push({name,...await inspect(p)});await screenshot(p,name);fs.writeFileSync(path.join(__dirname,'evidence/last-ui-review.json'),JSON.stringify(results,null,2));console.log(name);}
(async()=>{const b=await launch();try{
 for(const role of ['student_coordinator','finance','hr','staff','ambassador','recruiter','instructor']){
  const ctx=await context(b);await login(ctx,role);const p=await ctx.newPage();
  if(role==='instructor'){const f=require('./runtime/graded-fixture.json');await p.goto(BASE+'/grade?sid='+f.sid,{waitUntil:'domcontentloaded'});await save(p,'grade-instructor');}
  else{await p.goto(BASE+'/dashboard',{waitUntil:'domcontentloaded'});await save(p,'populated-'+role);}
  await ctx.close();
 }
 const ctx=await context(b);await login(ctx,'free');const p=await ctx.newPage();
 for(const [name,url] of [['free-profile','/open#profile'],['populated-events','/open#events'],['showcase-empty','/showcase'],['standalone-compiler','/compiler']]){await p.goto('about:blank');await p.goto(BASE+url,{waitUntil:'domcontentloaded'});await save(p,name);}
 const inputs=await p.locator('textarea,select').evaluateAll(ns=>ns.map(n=>({tag:n.tagName,id:n.id,name:n.name,value:n.value})));
 results.push({name:'compiler-inputs',inputs});fs.writeFileSync(path.join(__dirname,'evidence/last-ui-review.json'),JSON.stringify(results,null,2));
 await ctx.close();
}finally{await b.close()}})().catch(e=>{console.error(e);process.exitCode=1});
