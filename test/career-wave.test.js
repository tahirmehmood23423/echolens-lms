'use strict';
const {test,before,beforeEach,after}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const runtime=fs.mkdtempSync(path.join(os.tmpdir(),'career-wave-'));
require('dotenv').config=()=>({parsed:{}});process.env.DATABASE_URL='';process.env.DB_PATH=path.join(runtime,'store.json');
const store=require('../store'),C=require('../career/curriculum'),{createCareerService}=require('../career/service');
const {BUILTIN,validate}=require('../career/curriculum/learning'),{BANKS,APPROVED}=require('../career/curriculum/questions');
const wave=require('../career/curriculum/learning/registry').ids,select=require('./helpers/choices.cjs');
let service,cur,L;const user=id=>store.Users.byId(id);
before(()=>{service=createCareerService(store);cur=service.curriculum;L=cur.learning;});
beforeEach(()=>{const d=store.allData();d.users=[{id:1,role:'student',profile:{}},{id:2,role:'free',profile:{}},{id:3,role:'admin',profile:{}}];d.settings.career_learning={};d.settings.career_st_config={retake_hours:0};d.settings.career_curriculum={roles:{},subtracks:{}};d.settings.career_st_assess={};d.settings.career_stq=undefined;});
after(async()=>{await store.pendingPersist();fs.rmSync(runtime,{recursive:true,force:true});});
test('curated wave keeps canonical shared identity, unique keys and separate publication gates',()=>{
 const ids=new Set();for(const c of Object.values(BUILTIN))for(const q of c.questions){assert.ok(!ids.has(q.id),'duplicate formative key '+q.id);ids.add(q.id);}
 for(const [id,b] of Object.entries(BANKS))for(const q of b.questions){assert.ok(!ids.has(q.id),'duplicate formal key '+q.id);ids.add(q.id);if(wave.includes(id)&&!APPROVED[id])assert.equal(q.status,'draft');}
 assert.deepEqual(Object.keys(APPROVED).sort(),['git-collaboration','programming-foundations','python-fundamentals','rest-api-design','sql-fundamentals'].sort());
 const report=L.inventory(store);assert.equal(report.totals.published,0);assert.equal(report.totals.human_reviewed,0);assert.equal(report.totals.human_review_pending,Object.keys(BUILTIN).length);
 if(wave.includes('git-collaboration')&&wave.includes('backend-testing-reliability')){const role=report.job_roles.find(r=>r.id==='junior-backend-developer');assert.equal(role.authored_complete,true);assert.equal(role.required.length,9);assert.equal(role.complete,false);}
});
for(const id of wave)test(id+': guided, direct and remediation routes preserve separate evidence',()=>{
 const c=BUILTIN[id],bank=BANKS[id].questions;assert.deepEqual(validate(c).errors,[]);assert.equal(L.summary(user(1),id).available,false);assert.equal(L.transition(id,'publish',{},3).status,409);
 if(cur.assessmentStatus(id).state!=='published'){cur.setQuestionStatus(id,bank.map(q=>q.id),'reviewed',3);assert.ok(!cur.publishAssessment(id,3).error);}
 for(const action of ['review','approve']){const r=L.transition(id,action,{attest_human_review:true,notes:'Synthetic wave regression approval in a disposable store only. Not a real educational human review.'},3);assert.ok(!r.error,JSON.stringify(r));}
 const review=L.inventory(store);assert.equal(review.subtracks.find(s=>s.id===id).human_reviewed,true);assert.equal(review.subtracks.find(s=>s.id===id).published,false);
 assert.ok(!L.transition(id,'publish',{},3).error);
 const keys=(a,right=true)=>Object.fromEntries(a.questions.map(q=>{const source=c.questions.find(b=>b.id===q.id)||bank.find(b=>b.id===q.id);assert.ok(q.options.every(o=>typeof o.id==='string'&&/^[a-f0-9]{24}$/.test(o.id)));assert.equal(q.answer,undefined);assert.equal(q.why,undefined);return [q.id,select(q,source,right?source.answer:(source.answer+1)%4)];}));
 const first=cur.startSubtrack(user(1),id).attempt;assert.ok(first);assert.ok(new Set(first.questions.map(q=>q.options.findIndex(o=>o.text===bank.find(b=>b.id===q.id).options[bank.find(b=>b.id===q.id).answer]))).size>1,'server shuffles published answer positions');const failed=cur.submit(user(1),first.id,keys(first,false)).result;assert.equal(failed.outcome,'learning_recommended');const recommendations=failed.learning_areas.flatMap(m=>m.lessons);assert.ok(recommendations.length);assert.ok(recommendations.every(l=>c.lessons.some(x=>x.id===l.id)));assert.equal(cur.startSubtrack(user(1),id).status,409);
 for(const m of c.modules){for(const lid of m.lessons){const reading=L.lesson(user(1),id,lid);assert.ok(reading);assert.equal(reading.questions,undefined);assert.ok(!JSON.stringify(reading).includes('"answer":'));assert.ok(!L.visit(user(1),id,lid,true).error);const a=L.start(user(1),id,'lesson',lid).attempt;assert.ok(a);assert.equal(cur.submit(user(1),a.id,keys(a)).result.outcome,'passed');}const checkpoint=L.start(user(1),id,'module',m.id).attempt;assert.ok(checkpoint);assert.equal(checkpoint.questions.length,c.checkpoint_items);assert.equal(cur.submit(user(1),checkpoint.id,keys(checkpoint)).result.outcome,'passed');}
 const progress=L.progress(user(1),id);assert.equal(progress.completed,c.lessons.length);assert.equal(progress.learned,true);assert.equal(progress.mastered_by_assessment,false);
 const final=cur.startSubtrack(user(1),id).attempt;assert.equal(final.questions.length,30);assert.ok(final.questions.some(q=>!first.questions.some(p=>p.id===q.id)));assert.deepEqual(Object.fromEntries(['easy','medium','hard','advanced'].map(d=>[d,final.questions.filter(q=>q.difficulty===d).length])),cur.quota(30,cur.config().mix));assert.ok(final.questions.filter(q=>bank.find(b=>b.id===q.id).scenario).length>=21);assert.equal(cur.submit(user(1),final.id,keys(final)).result.outcome,'passed');assert.equal(cur.history(user(1),id).length,2);
 const direct=cur.startSubtrack(user(2),id).attempt;assert.ok(direct);assert.equal(cur.submit(user(2),direct.id,keys(direct)).result.outcome,'passed');assert.equal(L.progress(user(2),id).completed,0);assert.equal(L.progress(user(2),id).mastered_by_assessment,true);
 const shared=cur.progress(user(2),C.usage(id).tracks[0]);assert.ok(shared.competencies.some(s=>s.skill_id?.startsWith(id+'.')&&s.verification==='verified'),'shared competency evidence appears in the existing dashboard');
});
