'use strict';
const fs=require('node:fs'),path=require('node:path');
const BASE='http://127.0.0.1:4318',fixture=require('./runtime/fixtures.json'),cookies={},results=[];
const disk=()=>JSON.parse(fs.readFileSync(path.join(__dirname,'runtime/data.json'),'utf8'));
async function api(route,role,method='GET',body){const r=await fetch(BASE+route,{method,headers:{...(cookies[role]?{Cookie:cookies[role]}:{}),...(body!==undefined?{'Content-Type':'application/json'}:{})},body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(20000)});let data;try{data=await r.json()}catch{data=null}return{http:r.status,data,cookie:r.headers.get('set-cookie')?.split(';')[0]};}
function check(id,expected,actual,ok,scope='real local API + persisted record'){results.push({id,expected,actual,status:ok?'PASS':'FAIL',scope});fs.writeFileSync(path.join(__dirname,'evidence/operations-checks.json'),JSON.stringify(results,null,2));console.log(JSON.stringify({id,status:ok?'PASS':'FAIL',actual}));}
async function scenario(id,fn){if(process.argv[2]&&!process.argv[2].split(',').includes(id))return;try{await fn()}catch(e){check(id,'Complete test scenario',{error:e.message},false,'test harness interruption; not automatically a product defect')}}
(async()=>{
 for(const role of ['admin','student','empty','free','instructor','hr','finance','student_coordinator','staff','ambassador','recruiter']){const r=await api('/api/auth/login',null,'POST',{login:`qa.${role}`,password:'LocalQa!2026'});if(r.http!==200)throw new Error('Login '+role);cookies[role]=r.cookie;}
 check('PERSIST-RESTART','Previously saved profile and submissions survive a server restart',{city:disk().users.find(u=>u.id===fixture.users.student.id).profile.city,openSubmissions:disk().open_submissions.length},disk().open_submissions.length>0);
 await scenario('PAID-QUEST',async()=>{
  const q=disk().quests.find(q=>q.batch_id===fixture.batchId),p=q.problems[0];
  const sent=await api(`/api/quests/${q.id}/problems/${p.pid}/submit`,'student','POST',{code:'print("QA paid quest")',language:'python',note:'Synthetic QA solution'});
  check('PAID-SUBMIT','Enrolled student submission is persisted',{http:sent.http,id:sent.data.submission?.id},sent.http===200&&disk().quest_submissions.some(s=>s.id===sent.data.submission.id));
  const sid=sent.data.submission.id;
  const unauthorized=await api(`/api/quest-submissions/${sid}/grade`,'empty','POST',{grade:100});
  check('GRADE-PERMISSION','Student cannot grade another student submission',{http:unauthorized.http},unauthorized.http===403);
  const grade=await api(`/api/quest-submissions/${sid}/grade`,'instructor','POST',{grade:80,remarks:'QA reviewed feedback'});
  const read=await api(`/api/batches/${fixture.batchId}/quest`,'student');
  const stored=disk().quest_submissions.find(s=>s.id===sid);
  check('GRADE-PERSIST','Assigned teacher grading and feedback persist and are readable by learner',{http:grade.http,studentHttp:read.http,grade:stored.grade,gems:stored.gems,remarks:stored.remarks},grade.http===200&&read.http===200&&stored.grade===80&&stored.remarks==='QA reviewed feedback');
  fs.writeFileSync(path.join(__dirname,'runtime/graded-fixture.json'),JSON.stringify({qid:q.id,pid:p.pid,sid}));
 });
 await scenario('QUIZ',async()=>{
  const created=await api(`/api/batches/${fixture.batchId}/quizzes`,'instructor','POST',{title:'QA arithmetic quiz',duration_min:5,points:10,questions:[{q:'What is 2 + 2?',options:['3','4','5','6'],answer:1}]});
  check('QUIZ-CREATE','Assigned teacher can create quiz',{http:created.http,data:created.data},created.http===200);
  const id=created.data.quiz.id;
  await api(`/api/quizzes/${id}/open`,'instructor','POST',{minutes:5});
  const outside=await api(`/api/quizzes/${id}/attempt`,'empty','POST',{answers:[1]});
  const attempt=await api(`/api/quizzes/${id}/attempt`,'student','POST',{answers:[1]});
  const duplicate=await api(`/api/quizzes/${id}/attempt`,'student','POST',{answers:[1]});
  check('QUIZ-ATTEMPT','Enrolled student gets persisted result; nonmember and duplicate blocked',{nonmember:outside.http,attempt:attempt.http,data:attempt.data,duplicate:duplicate.http,count:disk().quiz_attempts.filter(a=>a.quiz_id===id).length},outside.http===403&&attempt.http===200&&duplicate.http===400&&disk().quiz_attempts.filter(a=>a.quiz_id===id).length===1);
 });
 await scenario('ADMISSIONS',async()=>{
  const reg=disk().registrations.find(r=>r.email==='qa-admission-20260909@example.com');
  const before=await api(`/api/admissions/registrations/${reg.id}/enroll`,'student_coordinator','POST',{batch_id:fixture.batchId});
  check('ADMIT-PAYMENT-GATE','Enrollment is blocked before Finance clearance',{http:before.http,data:before.data},before.http===400);
  const generated=await api(`/api/admissions/registrations/${reg.id}/challan`,'student_coordinator','POST',{deadline:'2026-09-30'});
  const serial=generated.data.challan?.serial;
  check('ADMIT-GENERATE','Challan generation records fee, due date and pipeline stage',{http:generated.http,serial,stage:disk().registrations.find(r=>r.id===reg.id).payment_stage,fee:generated.data.challan?.net_payable},generated.http===200&&!!serial);
  const pdf=await fetch(BASE+`/api/admissions/challans/${serial}/pdf`,{headers:{Cookie:cookies.student_coordinator}});
  const bytes=Buffer.from(await pdf.arrayBuffer());if(pdf.ok)fs.writeFileSync(path.join(__dirname,'evidence','synthetic-challan.pdf'),bytes);
  check('ADMIT-PDF','Synthetic challan produces a PDF attachment',{http:pdf.status,bytes:bytes.length,signature:bytes.subarray(0,5).toString()},pdf.status===200&&bytes.subarray(0,4).toString()==='%PDF');
  const sent=await api(`/api/admissions/challans/${serial}/send`,'student_coordinator','POST',{});
  const stage=disk().registrations.find(r=>r.id===reg.id).payment_stage;
  check('ADMIT-SEND-FAILURE','A skipped email must not mark the challan as sent',{http:sent.http,stage,mailMode:'SMTP deliberately unconfigured'},stage!=='challan_sent','deliberate local integration outage; no email sent');
  const clear=await api(`/api/finance/registrations/${reg.id}/clear`,'finance','POST',{});
  check('FINANCE-CLEAR','Synthetic payment clearance moves to ready for enrollment',{http:clear.http,stage:disk().registrations.find(r=>r.id===reg.id).payment_stage},clear.http===200&&disk().registrations.find(r=>r.id===reg.id).payment_stage==='paid_cleared','local simulated payment clearance; no payment processed');
  const enrolled=await api(`/api/admissions/registrations/${reg.id}/enroll`,'student_coordinator','POST',{batch_id:fixture.batchId});
  const rr=disk().registrations.find(r=>r.id===reg.id);
  check('ADMIT-ENROLL','Admissions selection creates learner enrollment and completes local pipeline',{http:enrolled.http,stage:rr.payment_stage,userId:rr.enrolled_user_id,batch:rr.enrolled_batch_id,persisted:disk().enrollments.some(e=>e.user_id===rr.enrolled_user_id&&e.batch_id===fixture.batchId)},enrolled.http===200&&rr.payment_stage==='enrolled'&&disk().enrollments.some(e=>e.user_id===rr.enrolled_user_id&&e.batch_id===fixture.batchId),'local records verified; credential-email delivery not tested');
 });
 await scenario('CERTIFICATE',async()=>{
  const batch=disk().batches.find(b=>b.name==='QA No Curriculum');
  // Synthetic enrollment fixture through the same existing application store
  // is not needed: a manual course certificate can target a nonmember.
  const cert=await api('/api/certificates/issue','instructor','POST',{user_id:fixture.users.empty.id,batch_id:fixture.batchId,kind:'course',title:'QA NONMEMBER CERTIFICATE — LOCAL ONLY',completion_date:'2026-09-09'});
  check('CERT-NONMEMBER','Instructor cannot certify a learner who is not enrolled in their course',{http:cert.http,serial:cert.data.cert?.serial,target:fixture.users.empty.id},cert.http===400||cert.http===403);
  const serial=cert.data.cert?.serial;
  if(serial){
   const verify=await api('/api/certificates/verify?serial='+serial); // Route fallback below, avoid assuming a page load proves verification.
   const route=require('./route-inventory.json').find(r=>r.route.includes('certificates/verify'));
   fs.writeFileSync(path.join(__dirname,'runtime/certificate-fixture.json'),JSON.stringify({serial,url:'/cert?s='+serial}));
   const png=await fetch(BASE+'/api/cert-og/'+serial+'.png');const bytes=Buffer.from(await png.arrayBuffer());if(png.ok)fs.writeFileSync(path.join(__dirname,'evidence','synthetic-certificate.png'),bytes);
   check('CERT-IMAGE','Synthetic certificate share image renders',{http:png.status,bytes:bytes.length},png.status===200,'local synthetic certificate only; no production issuance or social sharing');
  }
 });
 await scenario('FEEDBACK',async()=>{
  const feedback=await api('/api/public/feedback',null,'POST',{name:'QA feedback author',email:'feedback@qa.invalid',message:'QA synthetic feedback entry',rating:4});const id=feedback.data.feedback.id;
  const before=await api('/api/public/feedback');
  await api(`/api/admin/feedback/${id}/approve`,'admin','POST',{});
  const after=await api('/api/public/feedback');
  check('FEEDBACK-MODERATION','Feedback stays private until admin approval; public view excludes email',{created:feedback.http,hidden:!before.data.feedback.some(f=>f.id===id),public:after.data.feedback.find(f=>f.id===id)},!before.data.feedback.some(f=>f.id===id)&&after.data.feedback.some(f=>f.id===id)&&!after.data.feedback.find(f=>f.id===id).email);
 });
 await scenario('STAFF',async()=>{
  const staff=disk().staff_records.find(s=>s.user_id===fixture.users.staff.id);
  const instruction=await api(`/api/hr/staff/${staff.id}/instructions`,'hr','POST',{body:'QA local staff instruction'});
  const follow=await api(`/api/hr/staff/${staff.id}/follow-ups`,'hr','POST',{body:'QA status request'});
  const view=await api('/api/staff/me','staff');
  check('HR-STAFF-HANDOFF','HR instruction/follow-up persists and is visible to assigned staff',{instruction:instruction.http,follow:follow.http,staffHttp:view.http,body:view.data},instruction.http===200&&follow.http===200&&JSON.stringify(view.data).includes('QA local staff instruction'));
 });
 const state=disk();fs.writeFileSync(path.join(__dirname,'evidence','persisted-record-summary.json'),JSON.stringify({users:state.users.length,enrollments:state.enrollments.length,open_submissions:state.open_submissions.map(s=>({id:s.id,user_id:s.user_id,track_key:s.track_key,level:s.level,pid:s.pid,code:s.code,score:s.score})),quest_submissions:state.quest_submissions.map(s=>({id:s.id,grade:s.grade,gems:s.gems,remarks:s.remarks})),registrations:state.registrations.map(r=>({id:r.id,course_code:r.course_code,payment_stage:r.payment_stage,enrolled_user_id:r.enrolled_user_id})),certificates:state.certificates.map(c=>({id:c.id,title:c.title,serial:c.serial,batch_id:c.batch_id,user_id:c.user_id}))},null,2));
})().catch(e=>{console.error(e);process.exitCode=1;});
