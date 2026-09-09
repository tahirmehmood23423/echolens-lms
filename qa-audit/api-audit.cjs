'use strict';
const fs = require('node:fs');
const path = require('node:path');
const BASE = 'http://127.0.0.1:4318';
const fixture = require('./runtime/fixtures.json');
const results = [];
const cookies = {};
const file = path.join(__dirname, 'evidence', 'api-checks.json');
const disk = () => JSON.parse(fs.readFileSync(path.join(__dirname, 'runtime', 'data.json'), 'utf8'));
async function call(route, role, method = 'GET', body) {
  const isForm = body instanceof FormData;
  const r = await fetch(BASE + route, { method, redirect: 'manual', headers: { ...(role && cookies[role] ? { Cookie: cookies[role] } : {}), ...(!isForm && body !== undefined ? {'Content-Type':'application/json'} : {}) }, body: body === undefined ? undefined : isForm ? body : JSON.stringify(body), signal: AbortSignal.timeout(15000) });
  const raw = await r.text();
  let data; try { data = JSON.parse(raw); } catch { data = raw.slice(0, 350); }
  return { status: r.status, location: r.headers.get('location'), cookie: r.headers.get('set-cookie')?.split(';')[0], data };
}
function record(id, expected, actual, ok, note = '') {
  const result = { id, expected, status: ok ? 'PASS' : 'FAIL', actual, note };
  results.push(result); fs.writeFileSync(file, JSON.stringify(results, null, 2));
  console.log(JSON.stringify({id,status:result.status,actual}));
}
async function status(id, route, role, expected, method, body) {
  const r = await call(route, role, method, body);
  record(id, `HTTP ${expected}`, {http:r.status, data:r.data}, r.status === expected);
  return r;
}
(async () => {
  for (const role of ['admin','student','empty','free','instructor','coordinator','hr','finance','student_coordinator','staff','recruiter']) {
    const r = await call('/api/auth/login', null, 'POST', { login: `qa.${role}`, password: 'LocalQa!2026' });
    if (r.status !== 200) throw new Error('Could not sign in ' + role);
    cookies[role] = r.cookie;
  }
  await status('AUTH-01-missing', '/api/auth/login', null, 401, 'POST', {});
  await status('AUTH-02-invalid', '/api/auth/login', null, 401, 'POST', {login:'qa.student',password:'wrong'});
  await status('AUTH-03-protected', '/api/my/courses', null, 401);
  cookies.expired = 'el_token=expired.invalid.token';
  await status('AUTH-04-expired', '/api/auth/me', 'expired', 401);
  await status('ROLE-01-admin-denied', '/api/admin/courses', 'student', 403, 'POST', {title:'Must not create'});
  await status('ROLE-02-unenrolled-batch', `/api/batches/${fixture.batchId}`, 'empty', 403);
  await status('ROLE-03-free-batch', `/api/batches/${fixture.batchId}`, 'free', 403);
  const course = await call(`/api/batches/${fixture.batchId}`, 'student');
  record('LEARN-01-course-read', 'Enrolled student can retrieve their course', {http:course.status,keys:Object.keys(course.data)}, course.status === 200);
  await status('PROFILE-01-save', '/api/me/profile','student',200,'POST',{city:'QA Saved City',goal:'QA save test'});
  record('PROFILE-02-persist', 'Profile update is present in persisted local record', {city:disk().users.find(u=>u.id===fixture.users.student.id).profile.city}, disk().users.find(u=>u.id===fixture.users.student.id).profile.city==='QA Saved City');
  const clear = await call('/api/me/profile','student','POST',{city:'',goal:''});
  const afterClear = (await call('/api/auth/me','student')).data.profile;
  record('PROFILE-03-clear', 'Saving blank optional fields removes previously saved values', {http:clear.status,city:afterClear.city,goal:afterClear.goal}, !afterClear.city && !afterClear.goal);
  await call('/api/me/profile','student','POST',{city:'Lahore',goal:'QA learner'});
  const form = new FormData();
  form.set('title','QA PRIVATE COURSE MATERIAL'); form.set('type','resource'); form.set('week_no','1');
  form.set('file',new Blob(['%PDF-1.4\nQA-PRIVATE-COURSE-FILE-LOCAL-ONLY\n%%EOF'],{type:'application/pdf'}),'qa-private-course.pdf');
  const upload = await call(`/api/batches/${fixture.batchId}/lessons`,'instructor','POST',form);
  if(upload.status!==200) throw new Error('Lesson upload failed: '+JSON.stringify(upload));
  const privateUrl = upload.data.lesson.url;
  const denied = await call(privateUrl,'free');
  record('SEC-01-private-file', 'Unenrolled free account cannot download private course material', {uploadedBy:'assigned instructor',viewer:'unenrolled free learner',url:privateUrl,http:denied.status,body:denied.data}, denied.status===403 || denied.status===404);
  const anonymousFile = await call(privateUrl);
  record('SEC-02-anonymous-file', 'Anonymous file access is gated', {http:anonymousFile.status,location:anonymousFile.location}, [302,401,403].includes(anonymousFile.status));
  const grant = await call(`/api/batches/${fixture.batchId}/award`,'instructor','POST',{user_id:fixture.users.empty.id,amount:25,reason:'QA cross-enrollment authorization probe'});
  record('SEC-03-gems-nonmember', 'Teacher can award only a student enrolled in their batch', {http:grant.status,body:grant.data,persisted:disk().gem_events.some(g=>g.user_id===fixture.users.empty.id && g.note==='QA cross-enrollment authorization probe')}, [400,403].includes(grant.status));
  const ro = await call(`/api/batches/${fixture.batchId}/chat`,'coordinator','POST',{body:'QA read-only coordinator mutation probe'});
  record('SEC-04-coordinator-write','Read-only coordinator cannot post course messages',{http:ro.status,body:ro.data},ro.status===403,'Coordinator is advertised as read-only; clarify intended collaboration permissions.');
  const tracks = (await call('/api/public/tracks')).data.tracks;
  fs.writeFileSync(path.join(__dirname,'evidence','tracks.json'),JSON.stringify(tracks,null,2));
  const free = tracks.find(t=>t.free && t.submission_mode==='code');
  const paid = tracks.find(t=>!t.free);
  const freeDetail = (await call('/api/public/tracks/'+free.key)).data;
  const paidDetail = (await call('/api/public/tracks/'+paid.key)).data;
  record('CAT-01-free-unlocked','Every free-course level is available to browse',{track:free.key,levels:freeDetail.levels.length,locked:freeDetail.levels.filter(l=>l.locked).length},freeDetail.levels.every(l=>!l.locked));
  record('CAT-02-paid-preview','Paid course has explicit locked levels and first-level preview',{track:paid.key,levels:paidDetail.levels.length,open:paidDetail.levels.filter(l=>!l.locked).length},paidDetail.levels.some(l=>l.locked)&&!paidDetail.levels[0].locked);
  const submission = {track_key:free.key,level:1,pid:1,code:'print("QA local submission")',language:free.default_language||'python'};
  await status('LEARN-02-anonymous-submit','/api/open/submit',null,401,'POST',submission);
  await status('LEARN-03-staff-submit','/api/open/submit','instructor',403,'POST',submission);
  await status('LEARN-04-empty-submit','/api/open/submit','free',400,'POST',{...submission,code:''});
  const saved = await call('/api/open/submit','free','POST',submission);
  record('LEARN-05-submit-persist','Valid submission persists with explicit grading state',{http:saved.status,graded:saved.data.graded,note:saved.data.note,id:saved.data.submission?.id,persisted:disk().open_submissions.some(s=>s.id===saved.data.submission?.id)},saved.status===200&&disk().open_submissions.some(s=>s.id===saved.data.submission?.id),'AI credentials deliberately absent. This checks storage only; grading/certificate completion remains BLOCKED.');
  const second = await call('/api/open/submit','free','POST',submission);
  record('LEARN-06-duplicate','Repeating same task keeps one submission record',{first:saved.data.submission?.id,second:second.data.submission?.id,matching:disk().open_submissions.filter(s=>s.user_id===fixture.users.free.id&&s.track_key===free.key&&s.level===1&&s.pid===1).length},saved.data.submission?.id===second.data.submission?.id);
  await status('LEARN-07-paid-lock','/api/open/submit','free',400,'POST',{...submission,track_key:paid.key,level:2});
  await status('AI-01-unconfigured','/api/compiler/ai','student',503,'POST',{question:'Explain a variable',language:'python'});
  await status('TALENT-01-db-unavailable','/api/talent/projects',null,503);
  await status('NEWS-01-invalid','/api/public/subscribe',null,400,'POST',{email:'bad'});
  await call('/api/public/subscribe',null,'POST',{email:'newsletter@qa.invalid'});
  await call('/api/public/subscribe',null,'POST',{email:'newsletter@qa.invalid'});
  record('NEWS-02-deduplicated','Newsletter repeat creates one persisted lead',{count:disk().leads.filter(l=>l.email==='newsletter@qa.invalid').length},disk().leads.filter(l=>l.email==='newsletter@qa.invalid').length===1);
  await status('SIGNUP-01-invalid','/api/auth/register-open',null,400,'POST',{name:'Q',email:'bad',whatsapp:''});
  const signBody = {name:'QA Reserved Domain Learner',email:'qa-audit-20260909@example.com',whatsapp:'03001234567'};
  const signup = await call('/api/auth/register-open',null,'POST',signBody);
  record('SIGNUP-02-local-no-SMTP','Synthetic account registration persists when local email validation allows reserved domain',{http:signup.status,body:{...signup.data,password:signup.data.password?'[local fallback password redacted]':undefined},persisted:disk().users.some(u=>u.email===signBody.email)},signup.status===200,'No external mail sent. Email delivery and code verification are not tested.');
  if(signup.status===200) await status('SIGNUP-03-duplicate','/api/auth/register-open',null,400,'POST',signBody);
  const interest = {name:'QA Registration',email:'qa-admission-20260909@example.com',whatsapp:'03001234567',course_code:'SC-01',city:'Lahore'};
  const interest1 = await call('/api/public/register-interest',null,'POST',interest);
  const interest2 = await call('/api/public/register-interest',null,'POST',interest);
  record('ADMIT-01-duplicate','Repeated registration for same learner/course does not create duplicate pipeline records',{statuses:[interest1.status,interest2.status],count:disk().registrations.filter(r=>r.email===interest.email).length},disk().registrations.filter(r=>r.email===interest.email).length===1);
  const badCourse = await call('/api/public/register-interest',null,'POST',{...interest,email:'qa-badcourse-20260909@example.com',course_code:'DOES-NOT-EXIST'});
  record('ADMIT-02-invalid-course','Unknown course code is rejected before creating a registration',{http:badCourse.status,body:badCourse.data,persisted:disk().registrations.filter(r=>r.course_code==='DOES-NOT-EXIST').length},badCourse.status===400);
  // Exercise reset using the explicitly local no-email development fallback.
  const reset = await call('/api/auth/forgot-password',null,'POST',{email:'free@qa.invalid'});
  if(reset.data.dev_link) {
    const token = new URL(reset.data.dev_link).searchParams.get('token');
    await status('AUTH-05-short-reset','/api/auth/reset-password',null,400,'POST',{token,password:'short'});
    const change = await call('/api/auth/reset-password',null,'POST',{token,password:'LocalQa!2026Reset'});
    const oldSession = await call('/api/auth/me','free');
    record('SEC-05-reset-session','Password reset invalidates previously issued sessions',{resetHttp:change.status,oldSessionHttp:oldSession.status,oldSessionUser:oldSession.data.username},oldSession.status===401);
    await status('AUTH-06-one-time-reset','/api/auth/reset-password',null,400,'POST',{token,password:'LocalQa!2026Again'});
    cookies.free = change.cookie;
    await call('/api/me/password','free','POST',{current:'LocalQa!2026Reset',next:'LocalQa!2026'});
    record('AUTH-07-reset-outcome','New password can sign in after reset',{http:(await call('/api/auth/login',null,'POST',{login:'qa.free',password:'LocalQa!2026'})).status},(await call('/api/auth/login',null,'POST',{login:'qa.free',password:'LocalQa!2026'})).status===200);
  }
  const newBatch = await call('/api/admin/batches','admin','POST',{course_id:fixture.courseId,name:'QA No Curriculum',start_date:'2026-09-01',instructor_ids:[fixture.users.instructor.id]});
  fs.writeFileSync(path.join(__dirname,'evidence','api-summary.json'),JSON.stringify({total:results.length,pass:results.filter(r=>r.status==='PASS').length,fail:results.filter(r=>r.status==='FAIL').length},null,2));
})().catch(e=>{console.error(e);fs.writeFileSync(file,JSON.stringify(results,null,2));process.exitCode=1;});
