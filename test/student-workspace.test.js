'use strict';
// Real store and routes, synthetic identities, disposable data, no external services.
const { test, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), os = require('node:os'), path = require('node:path'), crypto = require('node:crypto');
const db = path.join(os.tmpdir(), 'echolens-workspace-' + crypto.randomUUID() + '.json');
require('dotenv').config = () => ({ parsed: {} });
process.env.DATABASE_URL = ''; process.env.DB_PATH = db;
const store = require('../store'), express = require('express');
const { register } = require('../career/routes');
let server, base, svc;
const user = id => store.Users.byId(id);
before(async () => {
  const app = express(); app.use(express.json());
  svc = register(app, { store, optionalUser: req => user(Number(req.headers['x-user'])), authRequired: (req,res,next) => {
    req.user = user(Number(req.headers['x-user'])); return req.user ? next() : res.status(401).json({ error: 'Sign in' });
  }, adminRequired: (req,res,next) => req.user.role === 'admin' ? next() : res.sendStatus(403), secret: 'isolated-workspace-test' });
  server = await new Promise(resolve => { const s = app.listen(0, '127.0.0.1', () => resolve(s)); });
  base = 'http://127.0.0.1:' + server.address().port;
});
after(async () => { await new Promise(r => server.close(r)); await store.pendingPersist(); fs.rmSync(db, { force: true }); });
beforeEach(() => {
  const d = store.allData();
  d.users = [{ id: 1, role: 'free', name: 'New Learner', profile: {} }, { id: 2, role: 'student', name: 'Returning Learner', profile: {} }, { id: 3, role: 'admin', profile: {} }];
  for (const key of ['open_submissions','open_attempts','enrollments','certificates','gem_events','quest_submissions','submissions','challenge_submissions']) d[key] = [];
  d.settings.career_config = undefined; d.settings.career_discovery_config = undefined;
});
const call = async (url, id = 1, method = 'GET', body) => {
  const r = await fetch(base + '/api/career/' + url, { method, headers: { 'content-type':'application/json', ...(id ? {'x-user':String(id)} : {}) }, body: body ? JSON.stringify(body) : undefined });
  return { status: r.status, data: await r.json() };
};
const roles = () => {
  const list = svc.curriculum.allRoles(), unique = new Map();
  for (const role of list) if (!unique.has(role.track)) unique.set(role.track, role);
  return [...unique.values()];
};
const enrollCourse = (id = 1) => {
  const t = store.Quests.tracks().find(t => t.free && t.published !== false && store.officialCatalogue().some(c => c.code === t.course_code && c.price_pkr === 0 && c.published !== false));
  assert.ok(t); assert.ok(!store.OpenQuest.enroll(id, t.key).error);
  user(id).profile.free_course_enrollments[0].activates_at = '2020-01-01T00:00:00Z';
  return store.Quests.trackDef(t.key);
};

test('new student receives useful dashboard without fabricated scores, courses or achievements', async () => {
  const {status,data:w} = await call('me/workspace');
  assert.equal(status,200); assert.equal(w.next.href,'#discover'); assert.equal(w.report.curriculum.assessed_competencies,0);
  assert.deepEqual(w.courses,[]); assert.equal(w.continue_learning,null); assert.equal(w.rewards.gems,0);
  assert.equal(svc.discoveryState(user(1)).show_welcome,true);
});
test('welcome is skippable, server persisted and not repeated', async () => {
  await call('me/discovery',1,'PUT',{dismissed:true});
  assert.equal(svc.discoveryState(user(1)).show_welcome,false);
  assert.ok((await call('me/workspace')).data.discovery.dismissed_at);
});
test('existing free and paid course enrollment suppresses welcome without forcing preferences', () => {
  enrollCourse(); assert.equal(svc.discoveryState(user(1)).show_welcome,false);
  store.allData().enrollments.push({ user_id:2, batch_id:123 });
  assert.equal(svc.discoveryState(user(2)).show_welcome,false);
});
test('five optional preferences persist, can be cleared and retain previous enjoyment answers', async () => {
  await call('me/discovery',1,'PUT',{answers:{experience:'never',technologies:['ai_ml','other'],interests:['security'],goal:'switch',commitment:'3_5',enjoy:['logic']},step:3});
  const state = (await call('me/workspace')).data;
  assert.equal(state.pace,'3_5'); assert.equal(state.discovery.step,3); assert.deepEqual(state.discovery.answers.enjoy,['logic']);
  await call('me/discovery',1,'PUT',{answers:{technologies:[],commitment:''}});
  const answers = svc.discoveryState(user(1)).discovery.answers;
  assert.equal(answers.commitment,undefined); assert.equal(answers.technologies,undefined); assert.equal(answers.experience,'never');
  assert.equal(svc.skillRecords(user(1)).length,0);
});
test('self-reported pace never gates any of the twelve tracks', async () => {
  await call('me/discovery',1,'PUT',{answers:{experience:'never',commitment:'under_3'}});
  assert.equal(svc.tracks().length,12);
  const role = roles().find(r => r.track.includes('machine-learning'));
  assert.equal((await call('me/target',1,'PUT',{role:role.id})).status,200);
  assert.equal((await call('me/workspace')).data.roadmaps.primary.track,role.track);
});
test('choosing a role enrolls its career as primary; changing primary restores each career target', async () => {
  const [a,b,c] = roles();
  for (const r of [a,b,c]) assert.equal((await call('me/target',1,'PUT',{role:r.id})).status,200);
  assert.equal((await call('me/workspace')).data.roadmaps.active_count,3);
  for (const r of [a,b,c]) {
    await call('me/enrollments/'+r.track+'/primary',1,'POST',{});
    const w = (await call('me/workspace')).data;
    assert.equal(w.report.curriculum.target.id,r.id); assert.equal(w.roadmaps.primary.track,r.track);
  }
});
test('fourth career target is rejected atomically at active enrollment limit', async () => {
  const all = roles(); for(const r of all.slice(0,3)) svc.chooseTarget(user(1),r.id);
  const before = structuredClone(user(1).profile);
  assert.equal((await call('me/target',1,'PUT',{role:all[3].id})).status,409);
  assert.deepEqual(user(1).profile,before);
});
test('career without target points to real role selection; unassessed role points to published checkpoint', () => {
  const r = roles().find(r => r.id === 'junior-backend-developer');
  svc.enrollTrack(user(1),r.track,{primary:true}); assert.match(svc.workspace(user(1)).next.href,/^#path\//);
  svc.chooseTarget(user(1),r.id);
  const w=svc.workspace(user(1)); assert.equal(w.next.label,'Assess Your Current Skills');
  const id=w.next.href.split('/')[1]; assert.equal(w.report.curriculum.subtracks.find(s=>s.id===id).assessment.state,'published');
  assert.ok(w.report.curriculum.subtracks.some(s=>s.assessment.state!=='published'));
});
test('resume opens stored unfinished task and skips completed tasks without mutating submissions or rewards', () => {
  const t = enrollCourse(), level=t.levels[0], p=level.problems.find(p=>p.required!==false);
  assert.equal(store.OpenQuest.recordOpen(1,t.key,{level:level.no,pid:p.pid}).ok,true);
  const expected='/open#course/'+t.key+'/lesson/'+level.no+'/practice/'+p.pid;
  assert.equal(svc.workspace(user(1)).continue_learning.resume,expected);
  store.allData().open_submissions.push({id:1,user_id:1,track_key:t.key,level:level.no,pid:p.pid,score:100,gems:25,submitted_at:new Date().toISOString()});
  const before=structuredClone(store.allData().open_submissions), certs=structuredClone(store.allData().certificates);
  const w=svc.workspace(user(1));
  assert.notEqual(w.continue_learning?.resume,expected); assert.equal(w.courses[0].passed,1);
  assert.deepEqual(store.allData().open_submissions,before); assert.deepEqual(store.allData().certificates,certs);
  assert.ok(w.history.some(e=>e.kind==='lesson'));
});
test('pending course seat offers enrollment status, not a locked lesson', () => {
  const t=enrollCourse(); user(1).profile.free_course_enrollments[0].activates_at=new Date(Date.now()+3600000).toISOString();
  const w=svc.workspace(user(1)); assert.equal(w.courses[0].active,false); assert.equal(w.courses[0].resume,null); assert.equal(w.continue_learning,null);
});
test('invalid resume pointers cannot be persisted and non-enrolled learners cannot write them', () => {
  const t=enrollCourse(), before=structuredClone(user(1).profile);
  assert.equal(store.OpenQuest.recordOpen(1,t.key,{level:999,pid:1}).status,404);
  assert.deepEqual(user(1).profile,before);
  assert.equal(store.OpenQuest.recordOpen(2,t.key,{level:1,pid:1}).status,403);
});
test('workspace and preferences are owned by the authenticated user regardless of supplied user id', async () => {
  enrollCourse(1); svc.chooseTarget(user(1),roles()[0].id);
  await call('me/discovery',1,'PUT',{answers:{commitment:'over_10'}});
  const w=(await call('me/workspace?user_id=1',2)).data;
  assert.deepEqual(w.courses,[]); assert.equal(w.roadmaps.primary,null); assert.equal(w.pace,null); assert.deepEqual(w.history,[]);
  await call('me/discovery',2,'PUT',{user_id:1,answers:{commitment:'under_3'}});
  assert.equal(svc.workspace(user(1)).pace,'over_10');
  assert.equal((await call('me/workspace',null)).status,401); assert.equal((await call('me/workspace',3)).status,403);
});
test('dashboard projection excludes private answer keys and active choice mappings', async () => {
  svc.curriculum.startSubtrack(user(1),'python-fundamentals');
  const w=(await call('me/workspace')).data, text=JSON.stringify(w);
  for(const field of ['"choices":','"responses":','"choice_nonce":','"answer":','"correct_index":']) assert.ok(!text.includes(field),field);
  assert.equal(w.report.curriculum.active.href,'#stake');
});

test('a graded required prerequisite gap recommends an actual published course resource', () => {
  const select = require('./helpers/choices.cjs');
  const role = roles().find(r => r.track === 'frontend-web-developer'); svc.chooseTarget(user(1), role.id);
  const a = svc.startAttempt(user(1), 'common').attempt;
  const answers = Object.fromEntries(a.questions.map(q => {
    const bank = svc.questionById(q.id), wrong = bank.options.find(o => ![].concat(bank.answer || []).includes(o.id));
    return [q.id, bank.options.length ? select(q,bank,wrong.id) : 'incorrect'];
  }));
  svc.submitAttempt(user(1),a.id,answers);
  const w=svc.workspace(user(1)); assert.match(w.next.href,/^\/open#course\//);
  const key=decodeURIComponent(w.next.href.split('/')[2]);
  const track=store.Quests.trackDef(key); assert.ok(track); assert.notEqual(track.published,false);
  assert.ok(w.report.gaps.some(g=>g.score===0 && g.evidence==='sufficient'));
});
test('clearing a role removes its saved mapping without removing any roadmap', () => {
  svc.chooseTarget(user(1),roles()[0].id); assert.equal(svc.chooseTarget(user(1),null).target_role,null);
  const w=svc.workspace(user(1)); assert.equal(w.report.curriculum.target,null); assert.equal(w.roadmaps.active_count,1);
  assert.ok(w.history.some(e=>e.title==='Target role cleared'));
});

test('a delayed preference save or guest claim cannot cross an account switch', async () => {
  for (const [method,path] of [['PUT','me/discovery'],['POST','me/discovery/claim']]) {
    const r=await call(path,2,method,{expected_user_id:1,answers:{experience:'never'}});
    assert.equal(r.status,409); assert.equal(user(2).profile.career,undefined);
  }
});
test('study pace uses published outline hours without changing access or scoring', () => {
  svc.chooseTarget(user(1),roles().find(r => r.id === 'junior-backend-developer').id);
  svc.saveDiscovery(user(1),{answers:{commitment:'3_5'}});
  const w=svc.workspace(user(1)), next=w.report.curriculum.subtracks.find(s=>s.id===w.report.curriculum.next.id);
  assert.equal(w.study_plan.min_weeks,Math.max(1,Math.ceil(next.hours/5)));
  assert.equal(w.study_plan.max_weeks,Math.max(1,Math.ceil(next.hours/3)));
  assert.equal(w.report.curriculum.assessed_competencies,0); assert.equal(w.roadmaps.active_count,1);
});
test('expired course seats remain visible in history without restoring access or discarding work', () => {
  const t=enrollCourse(), seat=user(1).profile.free_course_enrollments[0];
  seat.enrolled_at='2020-01-01T00:00:00Z'; seat.expires_at='2020-04-01T00:00:00Z';
  const before=structuredClone(user(1).profile.free_course_enrollments);
  const w=svc.workspace(user(1)); assert.equal(w.courses.length,0); assert.equal(w.continue_learning,null);
  assert.ok(w.history.some(e=>e.kind==='enrollment'&&e.title.includes(t.title)));
  assert.deepEqual(user(1).profile.free_course_enrollments,before);
});
test('Continue Learning falls back to the actual unfinished cohort quest when no free course is active', () => {
  const course=store.Courses.create({title:'Synthetic portal course',code:'WORKSPACE-QA'});
  const batch=store.Batches.create({course_id:course,name:'Synthetic cohort',instructor_ids:[]});
  store.Enrollments.create(1,batch.id);
  const track=store.Quests.tracks()[0];
  store.allData().quests.push({id:987654,batch_id:batch.id,track_key:track.key,no:1,title:'Unfinished portal checkpoint',problems:[{pid:1,title:'Actual task',points:100}]});
  const w=svc.workspace(user(1)); assert.equal(w.continue_learning.title,'Synthetic portal course');
  assert.equal(w.continue_learning.resume,'/dashboard#view=task&batch='+batch.id+'&qid=987654&pid=1');
  assert.equal(w.portal_courses[0].passed,0); assert.equal(w.portal_courses[0].total,1);
});
