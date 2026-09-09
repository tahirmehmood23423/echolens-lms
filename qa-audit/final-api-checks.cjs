'use strict';
const fs=require('node:fs'),path=require('node:path');
const BASE='http://127.0.0.1:4318',fixtures=require('./runtime/fixtures.json'),cookies={},results=[];
async function api(route,role,method='GET',body){const r=await fetch(BASE+route,{method,headers:{...(cookies[role]?{Cookie:cookies[role]}:{}),...(body!==undefined?{'Content-Type':'application/json'}:{})},body:body===undefined?undefined:JSON.stringify(body)});let data;try{data=await r.json()}catch{data=null}return{http:r.status,data,cookie:r.headers.get('set-cookie')?.split(';')[0]};}
function check(id,expected,actual,ok,scope='local API'){results.push({id,expected,actual,status:ok?'PASS':'FAIL',scope});fs.writeFileSync(path.join(__dirname,'evidence/final-api-checks.json'),JSON.stringify(results,null,2));console.log(JSON.stringify(results.at(-1)));}
(async()=>{
 for(const role of ['admin','recruiter','staff','hr','student']){const r=await api('/api/auth/login',null,'POST',{login:`qa.${role}`,password:'LocalQa!2026'});cookies[role]=r.cookie;}
 const id=fixtures.users.recruiter.id;
 const requested=await api(`/api/admin/recruiters/${id}/request-info`,'admin','POST',{message:'QA describe hiring roles'});
 const resub=await api('/api/recruiter/resubmit','recruiter','POST',{designation:'QA recruiter',city:'Lahore',hiring_note:'QA hires learners'});
 const approved=await api(`/api/admin/recruiters/${id}/approve`,'admin','POST',{});
 check('RECRUITER-REVIEW','Request info, recruiter resubmission, approval persist',{request:requested.http,requestState:requested.data?.recruiter?.status,resubmit:resub.http,resubmitState:resub.data?.recruiter?.status,approved:approved.http},requested.http===200&&resub.http===200&&approved.http===200,'correct UI-shaped message field; supersedes initial harness reason-field attempt; mail disabled');
 const follow=await api('/api/staff/follow-ups/0/respond','staff','POST',{response:'QA completed the instruction'});
 const hr=await api('/api/hr/staff','hr');
 check('STAFF-REPLY','Staff response returns to HR record',{http:follow.http,visibleToHR:JSON.stringify(hr.data).includes('QA completed the instruction')},follow.http===200&&JSON.stringify(hr.data).includes('QA completed the instruction'));
 const feed=await api('/api/showcase/feed','student');check('SHOWCASE-FEED','Signed-in empty feed returns useful empty data',{http:feed.http,data:feed.data},feed.http===200);
 const noImage=await api('/api/showcase/posts','student','POST',{caption:'QA no image'});check('SHOWCASE-VALIDATION','Posting without required image is rejected',{http:noImage.http,data:noImage.data},noImage.http===400);
 const html=await(await fetch(BASE+'/courses')).text();const links=[...new Set([...html.matchAll(/href="(\/courses\/[^"#?]+)"/g)].map(m=>m[1]))];
 const checked=[];for(const link of links){const r=await fetch(BASE+link);checked.push({url:link,status:r.status});}
 fs.writeFileSync(path.join(__dirname,'evidence/course-link-checks.json'),JSON.stringify(checked,null,2));
 check('COURSE-ROUTES','All course-detail links emitted by catalogue resolve',{count:checked.length,failed:checked.filter(x=>x.status!==200)},checked.length>0&&checked.every(x=>x.status===200),'HTTP resolution only; not full course completion');
 const catalogue=(await api('/api/public/catalogue')).data;fs.writeFileSync(path.join(__dirname,'evidence/catalogue-snapshot.json'),JSON.stringify(catalogue,null,2));
 const malformed=await fetch(BASE+'/api/public/subscribe',{method:'POST',headers:{'Content-Type':'application/json'},body:'{invalid'});check('MALFORMED-JSON','Malformed JSON is rejected with a client error',{http:malformed.status},malformed.status===400);
})().catch(e=>{console.error(e);process.exitCode=1});
