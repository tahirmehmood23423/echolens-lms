'use strict';
const fs=require('node:fs'),path=require('node:path');
const BASE='http://127.0.0.1:4318',fixture=require('./runtime/fixtures.json'),cookies={},results=[];
const disk=()=>JSON.parse(fs.readFileSync(path.join(__dirname,'runtime/data.json'),'utf8'));
async function api(route,role,method='GET',body){const r=await fetch(BASE+route,{method,headers:{...(cookies[role]?{Cookie:cookies[role]}:{}),...(body!==undefined?{'Content-Type':'application/json'}:{})},body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(20000)});let data;try{data=await r.json()}catch{data=null}return{http:r.status,data,cookie:r.headers.get('set-cookie')?.split(';')[0]};}
function check(id,expected,actual,ok,scope='real local API + persisted record'){results.push({id,expected,actual,status:ok?'PASS':'FAIL',scope});fs.writeFileSync(path.join(__dirname,'evidence/supplemental-checks.json'),JSON.stringify(results,null,2));console.log(JSON.stringify({id,status:ok?'PASS':'FAIL',actual}));}
(async()=>{
 for(const role of ['admin','student','empty','free','instructor','hr','recruiter']){const r=await api('/api/auth/login',null,'POST',{login:`qa.${role}`,password:'LocalQa!2026'});cookies[role]=r.cookie;}
 const ev=await api('/api/admin/events','admin','POST',{kind:'quest',title:'QA synthetic open quest',scope:'both',entry:'free',open:true,auto_grade:false,deadline:'2026-10-01',compiler:'python',problems:[{title:'QA output',description:'Print QA',points:100,difficulty:'Easy'}]});
 check('EVENT-CREATE','Admin event becomes visible in public listing',{http:ev.http,id:ev.data.event?.id,public:(await api('/api/public/events')).data.events.some(e=>e.id===ev.data.event?.id)},ev.http===200&&(await api('/api/public/events')).data.events.some(e=>e.id===ev.data.event.id));
 const id=ev.data.event.id;
 const anon=await api(`/api/events/${id}/register`,null,'POST',{});
 const reg=await api(`/api/events/${id}/register`,'free','POST',{});
 const twice=await api(`/api/events/${id}/register`,'free','POST',{});
 check('EVENT-REGISTER','Learner registration persists once and signed-out request is refused',{anonymous:anon.http,registered:reg.http,repeat:twice.http,entries:disk().event_entries.filter(e=>e.event_id===id&&e.user_id===fixture.users.free.id).length},anon.http===401&&reg.http===200&&disk().event_entries.filter(e=>e.event_id===id&&e.user_id===fixture.users.free.id).length===1);
 const sub=await api(`/api/events/${id}/submit`,'free','POST',{pid:1,code:'print("QA")',language:'python'});
 check('EVENT-SUBMIT','Registered learner event work persists',{http:sub.http,rows:disk().event_submissions.filter(s=>s.event_id===id).length},sub.http===200&&disk().event_submissions.some(s=>s.event_id===id));
 await api(`/api/admin/events/${id}`,'admin','PATCH',{deadline:'2026-09-01'});
 const late=await api(`/api/events/${id}/submit`,'free','POST',{pid:1,code:'print("late")',language:'python'});
 check('EVENT-DEADLINE','Past-deadline work is refused',{http:late.http,data:late.data},late.http===400);
 // Reopen the synthetic event for browser inspection after boundary check.
 await api(`/api/admin/events/${id}`,'admin','PATCH',{deadline:'2026-10-01'});
 const otherBatch=disk().batches.find(b=>b.name==='QA No Curriculum');
 const override=await api(`/api/batches/${fixture.batchId}/quizzes`,'instructor','POST',{batch_id:otherBatch.id,title:'QA scope override probe',questions:[{q:'Probe',options:['A','B'],answer:0}]});
 check('SEC-QUIZ-SCOPE','Teacher cannot use a body batch_id to create a quiz in an unassigned batch',{authorizedUrlBatch:fixture.batchId,unassignedBodyBatch:otherBatch.id,http:override.http,persistedBatch:override.data?.quiz?.batch_id},override.http===403||override.http===400);
 const requested=await api('/api/admin/recruiters/'+fixture.users.recruiter.id+'/request-info','admin','POST',{reason:'QA please describe hiring roles'});
 const resub=await api('/api/recruiter/resubmit','recruiter','POST',{designation:'QA recruiter',city:'Lahore',hiring_note:'QA hiring Python learners'});
 const approved=await api('/api/admin/recruiters/'+fixture.users.recruiter.id+'/approve','admin','POST',{});
 check('RECRUITER-REVIEW','Request-information, resubmit and approve transitions persist',{request:requested.http,resubmit:resub.http,approved:approved.http,status:disk().users.find(u=>u.id===fixture.users.recruiter.id).status},requested.http===200&&resub.http===200&&approved.http===200&&disk().users.find(u=>u.id===fixture.users.recruiter.id).status==='approved','local JSON account review; PostgreSQL marketplace and emails unverified');
 const cert=require('./runtime/certificate-fixture.json');const verification=await api('/api/verify/'+cert.serial);
 check('CERT-VERIFY-API','Public certificate lookup verifies persisted synthetic serial',{http:verification.http,valid:verification.data.valid},verification.http===200&&verification.data.valid===true);
 const challan=disk().challans[0];const cverify=await api('/api/verify-challan/'+challan.serial);
 check('CHALLAN-VERIFY-API','Public challan lookup reflects synthetic paid record',{http:cverify.http,data:cverify.data.challan},cverify.http===200&&cverify.data.valid===true);
 // Contract rendering is pure/offline: do not invoke account onboarding mail.
 const {generateContractPdf}=require('../contract-pdf');const parse=require('pdf-parse');
 for(const role of ['instructor','ambassador']){
  const user={name:'QA Synthetic '+role,email:role+'@qa.invalid',reg_no:'QA-LOCAL'};
  const profile={phone:'03001234567',cnic:'QA-NOT-A-REAL-ID',address:'QA Test Address',city:'Lahore',qualification:'QA Test Qualification'};
  const bytes=Buffer.from(await generateContractPdf({role,user,profile,ambassador:{code:'0000',university:'QA University'},settings:{org:'QA EchoLens Local Audit',ceo_name:'QA Signatory'}}));
  fs.writeFileSync(path.join(__dirname,'evidence',`synthetic-${role}-contract.pdf`),bytes);
  const parsed=await parse(bytes);
  check('CONTRACT-PDF-'+role,'Synthetic contract PDF opens and includes test party details',{pages:parsed.numpages,bytes:bytes.length,hasName:parsed.text.includes(user.name)},parsed.numpages>0&&parsed.text.includes(user.name),'offline rendering only; document legal wording, signing, delivery, deadlines not validated');
 }
})().catch(e=>{console.error(e);process.exitCode=1});
