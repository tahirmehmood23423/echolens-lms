'use strict';
const fs=require('node:fs'),path=require('node:path');
const BASE='http://127.0.0.1:4318',cookies={},results=[];
async function api(route,role,method='GET',body){const r=await fetch(BASE+route,{method,headers:{...(cookies[role]?{Cookie:cookies[role]}:{}),...(body!==undefined?{'Content-Type':'application/json'}:{})},body:body===undefined?undefined:JSON.stringify(body)});return{http:r.status,data:await r.json(),cookie:r.headers.get('set-cookie')?.split(';')[0]};}
function check(id,expected,actual,ok,scope='local API'){results.push({id,expected,actual,status:ok?'PASS':'FAIL',scope});fs.writeFileSync(path.join(__dirname,'evidence/bundle-and-rules.json'),JSON.stringify(results,null,2));console.log(JSON.stringify(results.at(-1)));}
(async()=>{
 for(const role of ['student_coordinator','finance']){const r=await api('/api/auth/login',null,'POST',{login:`qa.${role}`,password:'LocalQa!2026'});cookies[role]=r.cookie;}
 const body={name:'QA Bundle Applicant',email:'qa-bundle-20260909@example.com',whatsapp:'03001234567',course_code:'PATH',course_title:'The Web Developer Path'};
 const reg=await api('/api/public/register-interest',null,'POST',body);
 const list=await api('/api/admissions/registrations','student_coordinator');const r=list.data.registrations.find(r=>r.email===body.email);
 const challan=await api(`/api/admissions/registrations/${r.id}/challan`,'student_coordinator','POST',{deadline:'2026-09-30'});
 const clear=await api(`/api/finance/registrations/${r.id}/clear`,'finance','POST',{});
 const enroll=await api(`/api/admissions/registrations/${r.id}/enroll`,'student_coordinator','POST',{batch_id:1});
 check('BUNDLE-PRICE','Advertised PKR 43,500 bundle produces correctly priced challan',{registration:reg.http,challan:challan.http,gross:challan.data.challan?.gross_fee,net:challan.data.challan?.net_fee},challan.data.challan?.gross_fee===43500);
 check('BUNDLE-ENROLL','Bundle registration offers its component batches and can complete enrollment',{availableBatches:r.available_batches,clear:clear.http,enroll:enroll.http,error:enroll.data.error},r.available_batches.length>0&&enroll.http===200,'local simulated clearance; no payment or email');
 // Separate scratch file and memory, not the running server's data.
 process.env.DATABASE_URL='';process.env.DIRECT_URL='';process.env.DB_PATH=path.join(__dirname,'runtime/rule-data.json');
 const store=require('../store');const t=store.Quests.trackDef('cs105-javascript');const data=store.allData();let n=0;
 data.open_submissions=t.levels.flatMap(l=>l.problems.map((p,i)=>({id:++n,user_id:99991,track_key:t.key,level:l.no,pid:i+1,score:n===1?0:100,gems:n===1?0:100})));
 const progress=store.OpenQuest.progress(99991,t.key);
 check('PASS-RULE-CONFLICT','An account with a failed task has a consistent completion result across UI and certificate eligibility',{total:progress.total,graded:progress.graded,average:progress.avg,backendPassed:progress.passed,failedTaskScore:progress.submissions['1:1'].score,frontendSourceRule:'open.js:1109-1120 requires each task score >= pass mark'},!progress.passed,'isolated business-rule reproduction + source comparison; no certificate issued');
})().catch(e=>{console.error(e);process.exitCode=1});
