'use strict';
const fs=require('node:fs'),path=require('node:path');
const {BASE,launch,context,login,screenshot}=require('./browser-lib.cjs');
const fixture=require('./runtime/fixtures.json'),cookies={},results=[];
const disk=()=>JSON.parse(fs.readFileSync(path.join(__dirname,'runtime/data.json'),'utf8'));
async function api(route,role,method='GET',body){const multipart=body instanceof FormData;const r=await fetch(BASE+route,{method,headers:{...(cookies[role]?{Cookie:cookies[role]}:{}),...(body!==undefined&&!multipart?{'Content-Type':'application/json'}:{})},body:body===undefined?undefined:multipart?body:JSON.stringify(body),signal:AbortSignal.timeout(20000)});const data=await r.json();return{http:r.status,data,cookie:r.headers.get('set-cookie')?.split(';')[0]};}
function check(id,expected,actual,ok,scope='local API and persisted records; synthetic data only'){results.push({id,expected,actual,status:ok?'PASS':'FAIL',scope});fs.writeFileSync(path.join(__dirname,'evidence/coverage-expansion.json'),JSON.stringify(results,null,2));console.log(JSON.stringify(results.at(-1)));}
async function scenario(id,fn){try{await fn()}catch(e){check(id,'Complete scenario',{error:e.message},false,'harness interruption; not automatically a product defect')}}
function proof(){const form=new FormData();form.append('file',new Blob([fs.readFileSync(path.join(__dirname,'evidence/report-390.png'))],{type:'image/png'}),'QA-SYNTHETIC-NOT-A-PAYMENT.png');return form;}
(async()=>{
 for(const role of ['admin','student','empty','free','hr','finance','student_coordinator','staff','ambassador']){const r=await api('/api/auth/login',null,'POST',{login:`qa.${role}`,password:'LocalQa!2026'});if(r.http!==200)throw Error('Login '+role);cookies[role]=r.cookie;}
 await scenario('DEPARTMENT',async()=>{
  const made=await api('/api/hr/departments','hr','POST',{name:'QA audit delivery team'});const id=made.data.department.id;
  const duplicate=await api('/api/hr/departments','hr','POST',{name:'QA audit delivery team'});
  const badHead=await api(`/api/hr/departments/${id}/head`,'hr','PUT',{user_id:fixture.users.staff.id});
  await api(`/api/department/${id}/members`,'hr','POST',{user_id:fixture.users.hr.id});
  await api(`/api/department/${id}/members`,'hr','POST',{user_id:fixture.users.staff.id});
  const head=await api(`/api/hr/departments/${id}/head`,'hr','PUT',{user_id:fixture.users.hr.id});
  const created=await api(`/api/department/${id}/tasks`,'hr','POST',{title:'QA inspect synthetic evidence',description:'Local-only task',scope:'member',member_user_id:fixture.users.staff.id});const tid=created.data.task.id;
  const stranger=await api(`/api/my-departments/tasks/${tid}/complete`,'student','POST',{note:'Should fail'});
  const done=await api(`/api/my-departments/tasks/${tid}/complete`,'staff','POST',{note:'QA evidence reviewed'});
  const staff=await api('/api/my-departments','staff');const hr=await api(`/api/department/${id}`,'hr');
  const persisted=disk().department_task_status.find(s=>s.task_id===tid&&s.user_id===fixture.users.staff.id);
  check('DEPARTMENT-COMPLETE','Head must be a member; scoped task completion persists and is readable by HR',{create:made.http,duplicate:duplicate.http,headBeforeMembership:badHead.http,head:head.http,nonrecipient:stranger.http,done:done.http,status:persisted?.status,note:persisted?.note,staffRead:staff.http,hrRead:hr.http},made.http===200&&duplicate.http===400&&badHead.http===400&&stranger.http===404&&done.http===200&&persisted.status==='done'&&hr.http===200);
 });
 await scenario('CHALLENGE',async()=>{
  const made=await api('/api/admin/challenges','admin','POST',{title:'QA legacy link challenge',description:'Synthetic project',gems:40});const id=made.data.challenge.id;
  const invalid=await api(`/api/challenges/${id}/submit`,'student','POST',{link:'invalid'});
  const submitted=await api(`/api/challenges/${id}/submit`,'student','POST',{link:'https://project.qa.invalid/first'});const sid=submitted.data.submission.id;
  const before=disk().gem_events.filter(e=>e.user_id===fixture.users.student.id&&e.source==='challenge').reduce((a,e)=>a+e.amount,0);
  await api(`/api/challenge-submissions/${sid}/review`,'admin','POST',{approve:false,remarks:'QA revise'});
  const retry=await api(`/api/challenges/${id}/submit`,'student','POST',{link:'https://project.qa.invalid/revised'});
  await api(`/api/challenge-submissions/${sid}/review`,'admin','POST',{approve:true,remarks:'QA approved'});
  await api(`/api/challenge-submissions/${sid}/review`,'admin','POST',{approve:true,remarks:'QA repeated approval'});
  const first=disk().gem_events.filter(e=>e.user_id===fixture.users.student.id&&e.source==='challenge').reduce((a,e)=>a+e.amount,0)-before;
  check('CHALLENGE-REVIEW','Invalid link rejected; reject/resubmit/approve persists and identical approval is idempotent',{invalid:invalid.http,retry:retry.http,status:disk().challenge_submissions.find(s=>s.id===sid).status,awarded:first},invalid.http===400&&retry.http===200&&first===40);
  await api(`/api/challenge-submissions/${sid}/review`,'admin','POST',{approve:false,remarks:'QA correction after approval'});
  const afterReject=disk().gem_events.filter(e=>e.user_id===fixture.users.student.id&&e.source==='challenge').reduce((a,e)=>a+e.amount,0)-before;
  await api(`/api/challenge-submissions/${sid}/review`,'admin','POST',{approve:true,remarks:'QA approved again'});
  const afterAgain=disk().gem_events.filter(e=>e.user_id===fixture.users.student.id&&e.source==='challenge').reduce((a,e)=>a+e.amount,0)-before;
  check('CHALLENGE-REAWARD','One challenge win cannot accumulate duplicate rewards through review corrections',{challengeId:id,submissionId:sid,advertisedGems:40,afterFirstApproval:first,afterRejection:afterReject,afterReapproval:afterAgain},afterAgain===40);
 });
 await scenario('HACKATHON',async()=>{
  const made=await api('/api/admin/hackathons','admin','POST',{title:'QA local team competition',starts_at:'2026-09-01T00:00',ends_at:'2026-10-01T00:00',mode:'team',team_max:4,entry:'paid',fee_pkr:100,prize1:30});const id=made.data.hackathon.id;
  const missingPay=await api(`/api/hackathons/${id}/register`,'student','POST',{team_name:'QA Team',member_regs:['qa.empty','qa.empty']});
  const reg=await api(`/api/hackathons/${id}/register`,'student','POST',{team_name:'QA Team',member_regs:['qa.empty','qa.empty'],payment_ref:'QA-SYNTHETIC-NO-TRANSACTION'});const eid=reg.data.entry.id;
  const duplicate=await api(`/api/hackathons/${id}/register`,'student','POST',{payment_ref:'QA'});
  const unpaid=await api(`/api/hackathons/${id}/submit`,'student','POST',{link:'https://project.qa.invalid/hackathon'});
  await api(`/api/admin/hackathon-entries/${eid}/payment`,'admin','POST',{confirm:true});
  const sub=await api(`/api/hackathons/${id}/submit`,'student','POST',{link:'https://project.qa.invalid/hackathon'});
  await api(`/api/admin/hackathon-submissions/${sub.data.submission.id}/score`,'admin','POST',{score:90,remarks:'QA scored'});
  const finalized=await api(`/api/admin/hackathons/${id}/finalize`,'admin','POST',{});
  const twice=await api(`/api/admin/hackathons/${id}/finalize`,'admin','POST',{});
  const awards=disk().gem_events.filter(e=>e.source==='hackathon'&&e.note?.includes('QA local team competition'));
  check('HACKATHON-LIFECYCLE','Paid gate, submission, scoring and one finalization persist',{missingPay:missingPay.http,duplicate:duplicate.http,unpaid:unpaid.http,submit:sub.http,finalize:finalized.http,repeatFinalize:twice.http,awards:awards.map(e=>({userId:e.user_id,amount:e.amount}))},missingPay.http===400&&duplicate.http===400&&unpaid.http===400&&sub.http===200&&finalized.http===200&&twice.http===400,'simulated local payment approval; no payment/email processed');
  check('HACKATHON-UNIQUE-MEMBERS','Repeated teammate input produces one membership and one prize per person',{entryId:eid,memberIds:reg.data.entry.member_ids,prizePerMember:30,emptyStudentAward:awards.filter(e=>e.user_id===fixture.users.empty.id).reduce((a,e)=>a+e.amount,0)},new Set(reg.data.entry.member_ids).size===reg.data.entry.member_ids.length);
 });
 await scenario('PAID-EVENT',async()=>{
  const made=await api('/api/admin/events','admin','POST',{kind:'quest',title:'QA paid event proof review',scope:'both',entry:'paid',fee_pkr:100,open:true,auto_grade:false,deadline:'2026-10-01',compiler:'python',problems:[{title:'QA task',description:'Print QA',points:100}]});const id=made.data.event.id;
  const missing=await api(`/api/events/${id}/register`,'free','POST',{});
  const reg=await api(`/api/events/${id}/register`,'free','POST',proof());const eid=reg.data.entry.id;
  const pending=await api(`/api/events/${id}/submit`,'free','POST',{pid:1,code:'print("QA")',language:'python'});
  await api(`/api/admin/event-entries/${eid}/payment`,'admin','POST',{confirm:false});
  const rejected=await api(`/api/events/${id}/submit`,'free','POST',{pid:1,code:'print("QA")',language:'python'});
  const resend=await api(`/api/events/${id}/register`,'free','POST',proof());
  await api(`/api/admin/event-entries/${eid}/payment`,'admin','POST',{confirm:true});
  const submit=await api(`/api/events/${id}/submit`,'free','POST',{pid:1,code:'print("QA")',language:'python'});
  check('PAID-EVENT-GATE','Proof required; only admin-confirmed entrant can persist work',{missing:missing.http,register:reg.http,pending:pending.http,rejected:rejected.http,proofRetry:resend.http,proofRetryMessage:resend.data.error,submit:submit.http,persisted:disk().event_submissions.some(s=>s.event_id===id)},missing.http===400&&reg.http===200&&pending.http===400&&rejected.http===400&&submit.http===200,'synthetic image and simulated manual payment state; rejected proof requires academy contact, no in-app replacement observed');
 });
 await scenario('REFERRAL',async()=>{
  const amb=disk().ambassadors.find(a=>a.user_id===fixture.users.ambassador.id);
  const body={name:'QA referral applicant',email:'qa-referral-final@example.com',whatsapp:'03001234567',course_code:'SC-01',course_title:'Python for Data Science',ambassador_code:amb.code};
  const invalid=await api('/api/public/register-interest',null,'POST',{...body,ambassador_code:'bad'});
  const reg=await api('/api/public/register-interest',null,'POST',body);const record=disk().registrations.find(r=>r.email===body.email);
  const discount=await api('/api/admissions/discount-categories','student_coordinator','POST',{name:'QA additional 5 percent',type:'percent',value:5});
  const ch=await api(`/api/admissions/registrations/${record.id}/challan`,'student_coordinator','POST',{discount_category_id:discount.data.category.id,deadline:'2026-09-30'});const snapshot=ch.data.challan;
  await api(`/api/admissions/discount-categories/${discount.data.category.id}`,'student_coordinator','PATCH',{value:50});
  const stable=disk().challans.find(c=>c.serial===snapshot.serial).net_fee===snapshot.net_fee;
  await api(`/api/finance/registrations/${record.id}/clear`,'finance','POST',{});
  const enroll=await api(`/api/admissions/registrations/${record.id}/enroll`,'student_coordinator','POST',{batch_id:fixture.batchId});
  const twice=await api(`/api/admissions/registrations/${record.id}/enroll`,'student_coordinator','POST',{batch_id:fixture.batchId});
  const awards=disk().ambassador_gem_events.filter(e=>e.registration_id===record.id);
  check('REFERRAL-ENROLLMENT','10% referral plus 5% discount snapshot; one enrolled referral reward',{invalidCode:invalid.http,registration:reg.http,gross:snapshot.gross_fee,discount:snapshot.discount_amount,net:snapshot.net_fee,stableAfterCategoryEdit:stable,enroll:enroll.http,repeatEnroll:twice.http,awards:awards.map(e=>({amount:e.amount,source:e.source}))},invalid.http===400&&reg.http===200&&snapshot.discount_amount===Math.round(snapshot.gross_fee*.15)&&stable&&enroll.http===200&&twice.http===400&&awards.length===1,'local simulated clearance and gem record; cash commission payout and email unverified');
  fs.writeFileSync(path.join(__dirname,'runtime/referral-final.json'),JSON.stringify({email:body.email,userId:disk().registrations.find(r=>r.id===record.id).enrolled_user_id}));
 });
 await scenario('MULTIPORTAL',async()=>{
  const ref=require('./runtime/referral-final.json');const staff=await api('/api/hr/staff','hr','POST',{name:'QA multiportal staff',email:ref.email,phone:'03001234567',position:'QA role'});
  const users=disk().users.filter(u=>u.email===ref.email);for(const u of users)await api(`/api/admin/users/${u.id}/password`,'admin','POST',{password:'LocalQa!2026'});
  const ambiguous=await api('/api/auth/login',null,'POST',{login:ref.email,password:'LocalQa!2026'});
  const byUsername=[];for(const u of users){const r=await api('/api/auth/login',null,'POST',{login:u.username,password:'LocalQa!2026'});byUsername.push({username:u.username,role:r.data.role,http:r.http});}
  check('MULTIPORTAL-LOGIN','Matching accounts require a username, which selects the correct role',{staffCreated:staff.http,matches:users.length,emailStatus:ambiguous.http,error:ambiguous.data.error,byUsername},users.length===2&&ambiguous.http===400&&byUsername.every(x=>x.http===200),'API login selection; browser multiportal chooser not exercised');
 });
 await scenario('JOBS',async()=>{
  const bad=await api('/api/admin/jobs','admin','POST',{title:'QA missing destination',company:'QA Local',description:'Synthetic'});
  const made=await api('/api/admin/jobs','admin','POST',{title:'QA Junior JavaScript Developer',company:'QA Synthetic Company',description:'Synthetic job. No applications are received.',location:'Remote',job_type:'Internship',apply_url:'https://employer.qa.invalid/apply',deadline:'2026-10-01'});const id=made.data.job.id;
  const comment=await api(`/api/jobs/${id}/comments`,'student','POST',{body:'QA asking about requirements'});const read=await api(`/api/jobs/${id}`,'student');
  check('JOB-COMMENT','Application destination required; job and learner comment persist',{missingDestination:bad.http,create:made.http,comment:comment.http,read:read.http,hasComment:read.data.comments.some(c=>c.body==='QA asking about requirements')},bad.http===400&&made.http===200&&comment.http===200&&read.data.comments.some(c=>c.body==='QA asking about requirements'));
  const browser=await launch();try{for(const width of [1440,390]){const ctx=await context(browser,{width,height:width<600?844:1000});await login(ctx,'student');const p=await ctx.newPage();await p.goto(BASE+'/dashboard');await p.locator('[data-view="jobs"]').click();await p.locator('.job-card').filter({hasText:'QA Junior JavaScript Developer'}).click();await p.locator('#view-job a[href="https://employer.qa.invalid/apply"]').waitFor();const text=await p.locator('#view-job').innerText();const href=await p.locator('#view-job a[target="_blank"]').getAttribute('href');await screenshot(p,`populated-job-${width}`);check('JOB-UI-'+width,'Jobs card opens details with saved comment and explicit external destination',{hasComment:text.includes('QA asking about requirements'),externalExplained:text.includes('EchoLens does not handle'),href},text.includes('QA asking about requirements')&&text.includes('EchoLens does not handle')&&href==='https://employer.qa.invalid/apply','real local UI; external application deliberately not submitted');await ctx.close();}}finally{await browser.close();}
 });
})().catch(e=>{console.error(e);process.exitCode=1});
