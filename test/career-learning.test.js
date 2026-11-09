'use strict';
const {test,before,beforeEach,after}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),crypto=require('node:crypto');
const db=path.join(os.tmpdir(),'echolens-learning-'+crypto.randomUUID()+'.json');
require('dotenv').config=()=>({parsed:{}});process.env.DATABASE_URL='';process.env.DB_PATH=db;
const store=require('../store'),express=require('express'),{register}=require('../career/routes');
const {BUILTIN,validate}=require('../career/curriculum/learning'),{BANKS}=require('../career/curriculum/questions'),select=require('./helpers/choices.cjs');
const SID='python-fundamentals';let svc,cur,L,server,base;
const user=id=>store.Users.byId(id);
before(async()=>{
 const app=express();app.use(express.json({limit:'1mb'}));
 const who=req=>user(Number(req.headers['x-user']));
 svc=register(app,{store,optionalUser:who,authRequired:(req,res,next)=>{req.user=who(req);return req.user?next():res.status(401).json({error:'Sign in'});},adminRequired:(req,res,next)=>req.user.role==='admin'?next():res.status(403).json({error:'Admin only'}),secret:'isolated-content-secret'});
 cur=svc.curriculum;L=cur.learning;
 server=await new Promise(resolve=>{const s=app.listen(0,'127.0.0.1',()=>resolve(s));});base='http://127.0.0.1:'+server.address().port;
});
beforeEach(()=>{
 const d=store.allData();d.users=[{id:1,role:'student',profile:{}},{id:2,role:'free',profile:{}},{id:3,role:'admin',profile:{}}];
 d.settings.career_learning={};d.settings.career_st_config={retake_hours:0};d.settings.career_curriculum={roles:{},subtracks:{}};
 d.settings.career_st_assess={};d.settings.career_stq=undefined;
});
after(async()=>{await new Promise(r=>server.close(r));await store.pendingPersist();fs.rmSync(db,{force:true});});
async function call(url,id=1,method='GET',body){const r=await fetch(base+'/api/'+url,{method,headers:{'content-type':'application/json',connection:'close',...(id?{'x-user':String(id)}:{})},body:body?JSON.stringify(body):undefined});return {status:r.status,data:await r.json()};}
function release(){assert.ok(!L.transition(SID,'review',{},3).error);assert.ok(!L.transition(SID,'approve',{attest_human_review:true,notes:'Synthetic test reviewer checked all lessons, examples, keys, references and mappings in an isolated fixture.'},3).error);assert.ok(!L.transition(SID,'publish',{},3).error);}
function answer(attempt,correct=()=>true){return Object.fromEntries(attempt.questions.map(q=>{const bank=L.published(SID)?.questions.find(x=>x.id===q.id)||BANKS[SID].questions.find(x=>x.id===q.id);return [q.id,select(q,bank,correct(bank)?bank.answer:(bank.answer+1)%4)];}));}
function practice(id,kind='lesson',owner=1,correct=()=>true){const start=L.start(user(owner),SID,kind,id);assert.ok(start.attempt,JSON.stringify(start));const a=start.attempt;const result=cur.submit(user(owner),a.id,answer(a,correct));assert.ok(result.result,JSON.stringify(result));return {attempt:a,result:result.result};}
function learnModule(module,owner=1){for(const id of module.lessons){L.visit(user(owner),SID,id,true);assert.equal(practice(id,'lesson',owner).result.outcome,'passed');}return practice(module.id,'module',owner);}

test('Python draft has 12 full lessons, 72 formative questions, all 12 objectives and no structural warnings',()=>{
 const c=BUILTIN[SID],v=validate(c);assert.deepEqual(v.errors,[]);assert.deepEqual(v.warnings,[]);assert.equal(v.covered,12);assert.equal(c.lessons.length,12);assert.equal(c.questions.length,72);
 assert.equal(c.human_review,null);assert.equal(c.state,'draft');assert.equal(L.summary(user(1),SID).available,false);
});
test('automated validation cannot publish content without exact-version human review',()=>{
 assert.equal(L.transition(SID,'publish',{},3).status,409);assert.equal(L.transition(SID,'approve',{attest_human_review:true,notes:'Enough review notes but draft not submitted.'},3).status,409);
 L.transition(SID,'review',{},3);assert.equal(L.transition(SID,'approve',{notes:'Automated checks only are not human approval.'},3).status,409);
 assert.equal(L.published(SID),null);
});
test('incomplete objectives, missing quiz references, wrong output and prerequisite cycles block release',()=>{
 const c=structuredClone(BUILTIN[SID]);c.lessons[0].quiz=['missing'];c.lessons[0].prerequisites=[c.lessons[1].id];c.lessons[0].worked.expect='wrong';c.lessons[0].objectives=[];
 const v=validate(c,{execute:true});assert.ok(v.errors.some(e=>e.includes('quiz')));assert.ok(v.errors.some(e=>e.includes('prerequisite')));assert.ok(v.errors.some(e=>e.includes('code actually prints')));assert.ok(v.errors.some(e=>e.includes('Missing instructional coverage')));
});
test('admin can edit and reorder drafts; editing invalidates review and preserves the old published release',()=>{
 release();const old=L.published(SID),draft=L.draft(SID);draft.lessons[0].title='A carefully revised arithmetic lesson';
 const out=L.updateDraft(SID,draft,3);assert.equal(out.draft.version,2);assert.equal(out.review,null);assert.equal(L.published(SID).version,1);assert.equal(L.published(SID).lessons[0].title,old.lessons[0].title);
 assert.equal(L.transition(SID,'publish',{},3).status,409);
});
test('draft preview and private question keys are admin-only; student/public content contains no quiz keys',async()=>{
 assert.equal((await call('admin/career/learning/'+SID,1)).status,403);assert.equal((await call('career/learning/'+SID+'/lessons/py-arithmetic',null)).status,404);
 assert.equal((await call('admin/career/learning/'+SID+'/lessons/py-arithmetic',3)).status,200);release();
 const r=await call('career/learning/'+SID+'/lessons/py-arithmetic',null);assert.equal(r.status,200);
 assert.equal(r.data.quiz,undefined);assert.equal(r.data.questions,undefined);assert.ok(!JSON.stringify(r.data).includes('"answer":'));
});
test('beginner completes every lesson quiz and module checkpoint through the same engine without fabricated mastery',()=>{
 release();for(const m of L.published(SID).modules){const a=learnModule(m);assert.equal(a.attempt.questions.length,9);assert.equal(a.result.outcome,'passed');}
 const p=L.progress(user(1),SID);assert.equal(p.completed,12);assert.equal(p.learned,true);assert.equal(p.mastered_by_assessment,false);assert.equal(cur.resultFor(user(1),SID).status,'not_attempted');
 assert.equal(cur.sharedSkills(user(1)).length,0);assert.equal(user(1).profile.career.st.attempts.length,16);
});
test('direct comprehensive pass credits knowledge and leaves every lesson personally unread',()=>{
 release();const a=cur.startSubtrack(user(1),SID).attempt;assert.equal(a.questions.length,30);const r=cur.submit(user(1),a.id,answer(a)).result;assert.equal(r.outcome,'passed');
 const p=L.progress(user(1),SID);assert.equal(p.mastered_by_assessment,true);assert.equal(p.completed,0);assert.ok(p.lessons.every(l=>!l.read&&!l.quiz_passed));assert.equal(p.learned,false);
});
test('failed comprehensive result maps only weak competencies to real published lessons and requires relevant checkpoints',()=>{
 release();const a=cur.startSubtrack(user(1),SID).attempt;
 const r=cur.submit(user(1),a.id,answer(a,q=>q.comp!=='m1.c1')).result;
 const links=r.learning_areas.flatMap(m=>m.lessons);assert.ok(links.some(l=>l.id==='py-arithmetic'));assert.ok(!links.some(l=>l.id==='py-files'));
 assert.equal(cur.startSubtrack(user(1),SID).status,409);assert.ok(L.required(user(1),SID).some(m=>m.id===SID+'.m1'));
});
test('remediation plus fresh reassessment retains previous scores and uses unseen comprehensive questions',()=>{
 release();const first=cur.startSubtrack(user(1),SID).attempt;cur.submit(user(1),first.id,answer(first,()=>false));
 for(const m of L.published(SID).modules)learnModule(m);
 assert.equal(L.required(user(1),SID).length,0);const second=cur.startSubtrack(user(1),SID).attempt;assert.ok(second);assert.ok(second.questions.some(q=>!first.questions.some(x=>x.id===q.id)));
 cur.submit(user(1),second.id,answer(second));const history=cur.history(user(1),SID);assert.equal(history.length,2);assert.equal(history[0].overall,100);assert.equal(history[1].overall,0);
});
test('lesson practice returns immediate explanations only after server grading and never broad skill evidence',()=>{
 release();const a=L.start(user(1),SID,'lesson','py-strings').attempt;assert.equal(a.questions.length,3);assert.ok(a.questions.every(q=>q.options.every(o=>/^[a-f0-9]{24}$/.test(o.id))));assert.ok(!JSON.stringify(a).includes('"answer":'));
 const r=cur.submit(user(1),a.id,answer(a,()=>false)).result;assert.equal(r.overall,0);assert.ok(r.feedback.every(q=>q.correct_answer&&q.explanation));assert.deepEqual(cur.sharedSkills(user(1)),[]);
});
test('checkpoint stays closed until lesson reading and quizzes are complete and retakes prefer fresh alternatives',()=>{
 release();const m=L.published(SID).modules[0];assert.equal(L.start(user(1),SID,'module',m.id).status,409);
 for(const id of m.lessons){L.visit(user(1),SID,id,true);practice(id);}
 const first=practice(m.id,'module',1,()=>false);const second=practice(m.id,'module');
 assert.equal(first.result.outcome,'learning_recommended');assert.equal(second.result.outcome,'passed');assert.ok(second.attempt.questions.every(q=>!first.attempt.questions.some(x=>x.id===q.id)));
});
test('published edits do not reinterpret an active quiz or overwrite old read/quiz progress',()=>{
 release();L.visit(user(1),SID,'py-arithmetic',true);const a=L.start(user(1),SID,'lesson','py-arithmetic').attempt;const given=answer(a);
 const draft=L.draft(SID);draft.questions[0].answer=(draft.questions[0].answer+1)%4;L.updateDraft(SID,draft,3);
 const r=cur.submit(user(1),a.id,given).result;assert.equal(r.overall,100);assert.equal(r.formative.content_version,1);assert.equal(L.progress(user(1),SID).completed,1);
 assert.equal(cur.submit(user(1),a.id,{}).existing,true);
});
test('learning state and saved quiz results are isolated by authenticated identity',async()=>{
 release();assert.equal((await call('career/me/learning/'+SID+'/lessons/py-arithmetic',1,'POST',{read:true,expected_user_id:1})).status,200);
 const a=L.start(user(1),SID,'lesson','py-arithmetic').attempt;
 assert.equal((await call('career/me/st/attempts/'+a.id+'/submit',2,'POST',{answers:answer(a)})).status,404);
 assert.equal((await call('career/me/learning/'+SID+'/lessons/py-arithmetic',2,'POST',{read:true,expected_user_id:1})).status,409);
 assert.equal((await call('career/learning/'+SID,2)).data.progress.completed,0);assert.equal(user(2).profile.career,undefined);
 assert.equal((await call('career/me/learning/'+SID+'/lessons/py-arithmetic',null,'POST',{read:true})).status,401);
});
test('tampered original indexes cannot be submitted as opaque choices',()=>{
 release();const a=L.start(user(1),SID,'lesson','py-arithmetic').attempt;const r=cur.submit(user(1),a.id,Object.fromEntries(a.questions.map(q=>[q.id,'0']))).result;
 assert.equal(r.answered,0);assert.equal(r.overall,0);assert.ok(r.competencies.every(c=>c.score===null));
});
test('shared canonical Python lesson is the same resource across Backend and AI tracks',()=>{
 release();const usages=require('../career/curriculum').usage(SID);assert.ok(usages.tracks.includes('backend-developer'));assert.ok(usages.tracks.includes('ai-machine-learning-engineer'));
 L.visit(user(1),SID,'py-arithmetic',true);practice('py-arithmetic');
 for(const slug of ['backend-developer','ai-machine-learning-engineer']){const p=cur.progress(user(1),slug);const row=p.learning.courses.find(c=>c.subtrack===SID);assert.equal(row.completed,1);assert.equal(row.lessons[0].href,'#lesson/'+SID+'/py-arithmetic');}
});
test('existing enrollments, certificates, gems and prior results survive reading and practice',()=>{
 release();user(1).profile.free_course_enrollments=[{track_key:'cs104-python',enrolled_at:'2026-01-01',sentinel:'preserve'}];
 const d=store.allData(),before={enrollments:structuredClone(d.enrollments),certificates:structuredClone(d.certificates),gems:structuredClone(d.gem_events),profile:structuredClone(user(1).profile.free_course_enrollments)};
 L.visit(user(1),SID,'py-arithmetic',true);practice('py-arithmetic');
 assert.deepEqual(d.enrollments,before.enrollments);assert.deepEqual(d.certificates,before.certificates);assert.deepEqual(d.gem_events,before.gems);assert.deepEqual(user(1).profile.free_course_enrollments,before.profile);
});
test('missing or unpublished content never yields a broken recommended lesson',()=>{
 release();const a=cur.startSubtrack(user(1),SID).attempt;cur.submit(user(1),a.id,answer(a,()=>false));L.transition(SID,'unpublish',{},3);
 assert.equal(L.lesson(user(1),SID,'py-arithmetic'),null);assert.equal(L.progress(user(1),SID).available,false);assert.deepEqual(cur.history(user(1),SID)[0].learning_areas.flatMap(x=>x.lessons),[]);
 assert.equal(cur.history(user(1),SID)[0].overall,0);
});
test('completion inventory distinguishes 16 free listings, six validated-course subset and zero approved pilot releases',()=>{
 const report=L.inventory(store);assert.equal(report.reconciliation.public_free.length,16);assert.equal(report.reconciliation.trending_subset.length,6);assert.equal(report.totals.subtracks,132);assert.equal(report.totals.objectives,680);
 const wave=require('../career/curriculum/learning/wave1/manifest.json').courses.map(id=>BUILTIN[id]);assert.equal(report.totals.lessons,81+wave.reduce((n,c)=>n+c.lessons.length,0));assert.equal(report.totals.formative_mcqs,508+wave.reduce((n,c)=>n+c.questions.length,0));assert.equal(report.totals.automated_complete,7+wave.length);assert.equal(report.totals.human_approved,0);assert.equal(report.totals.complete_roles,0);
});
test('learning resume appears in the unified dashboard without an enrollment or false onboarding interruption',()=>{
 release();L.visit(user(1),SID,'py-strings');const w=svc.workspace(user(1));assert.equal(w.continue_learning.resume,'#lesson/'+SID+'/py-strings');assert.equal(w.report.curriculum.learning.completed,0);assert.equal(svc.discoveryState(user(1)).show_welcome,false);
});
test('late practice answers are ignored and late autosaves are refused, using only saved choices',()=>{
 release();const a=L.start(user(1),SID,'lesson','py-arithmetic').attempt;const given=answer(a);cur.saveAnswers(user(1),a.id,{[a.questions[0].id]:given[a.questions[0].id]});user(1).profile.career.st.active.expires_at='2000-01-01T00:00:00Z';
 assert.equal(cur.saveAnswers(user(1),a.id,given).status,409);const r=cur.submit(user(1),a.id,given).result;assert.equal(r.answered,1);assert.equal(r.total,3);assert.equal(r.timed_out,true);
});
test('lesson drafts can be created for another canonical subtrack and incomplete content stays unpublished',()=>{
 const out=L.updateDraft('sql-fundamentals',{id:'sql-fundamentals',modules:[],lessons:[],questions:[],references:[],pass_mark:70,checkpoint_items:9,quiz_minutes:12,checkpoint_minutes:20},3);
 assert.equal(out.draft.version,2);assert.ok(out.validation.errors.length);assert.equal(L.transition('sql-fundamentals','review',{},3).status,409);assert.equal(L.summary(user(1),'sql-fundamentals').available,false);
});
test('publishing rejects nonexistent legacy practice links and preserves archived course versions',()=>{
 release();const d=L.draft(SID);d.lessons[0].reuse=[{track:'cs104-python',level:999,relationship:'supplementary_practice'}];L.updateDraft(SID,d,3);
 assert.equal(L.transition(SID,'review',{},3).status,409);assert.equal(L.revision(SID,1).state,'published');assert.equal(L.published(SID).version,1);
});
test('a comprehensive question cannot be copied into the immediate-feedback formative bank',()=>{
 const d=structuredClone(BUILTIN[SID]),q=BANKS[SID].questions.find(q=>q.comp==='m1.c1');d.lessons[0].quiz[0]=q.id;d.questions[0]={...q,subtrack:SID,objective:SID+'.'+q.comp};
 assert.ok(validate(d).errors.some(e=>e.includes('must not be reused')));
});
test('optional video metadata never permits unsafe URLs and remains separate from lesson requirements',()=>{
 const d=structuredClone(BUILTIN[SID]);d.lessons[0].video={title:'An unsafe link',url:'javascript:alert(1)'};assert.ok(validate(d).errors.some(e=>e.includes('optional video')));
 delete d.lessons[0].video;assert.deepEqual(validate(d).errors,[]);
});
test('module checkpoint forms repeatedly cover every objective and include easy, medium and challenging questions',()=>{
 release();const m=L.published(SID).modules[0];for(const id of m.lessons){L.visit(user(1),SID,id,true);practice(id);}
 for(let i=0;i<12;i++){const {attempt}=practice(m.id,'module',1,()=>false);const difficulties=new Set(attempt.questions.map(q=>q.difficulty));for(const d of ['easy','medium','hard'])assert.ok(difficulties.has(d));const comps=new Set(attempt.questions.map(q=>L.published(SID).questions.find(k=>k.id===q.id).objective));assert.equal(comps.size,3);}
});
test('minor content releases retain unchanged lesson and checkpoint credit and keep read history for changed material',()=>{
 release();const m=L.published(SID).modules[0];learnModule(m);const d=L.draft(SID);d.lessons[0].title='Clarified arithmetic title';L.updateDraft(SID,d,3);release();
 let p=L.progress(user(1),SID);assert.equal(p.version,2);assert.equal(p.completed,3);assert.equal(p.modules[0].checkpoint_passed,true);
 const revision=L.draft(SID);revision.lessons[0].sections[0].paragraphs[0]+=' This clarification is part of the new reading material.';L.updateDraft(SID,revision,3);release();
 p=L.progress(user(1),SID);assert.equal(p.completed,2);assert.equal(p.lessons[0].read,false);assert.equal(p.lessons[0].quiz_passed,true);assert.ok(user(1).profile.career.st.learning[SID].versions[1].read['py-arithmetic']);
 L.visit(user(1),SID,'py-arithmetic',true);assert.equal(L.progress(user(1),SID).completed,3);assert.equal(cur.history(user(1)).length,4);
});
test('Programming Foundations is a complete second draft with verified objective coverage and no automatic release',()=>{
 const c=BUILTIN['programming-foundations'],v=validate(c);assert.deepEqual(v.errors,[]);assert.deepEqual(v.warnings,[]);assert.equal(v.covered,12);assert.equal(c.lessons.length,12);assert.equal(c.questions.length,72);assert.equal(L.summary(user(1),c.id).available,false);
});
test('a beginner can learn all Programming Foundations modules, then demonstrate knowledge in its existing final bank',()=>{
 const id='programming-foundations';for(const action of ['review','approve','publish'])assert.ok(!L.transition(id,action,{attest_human_review:true,notes:'Synthetic QA review for the second foundation draft; not a production human approval.'},3).error);
 const c=L.published(id),answersFor=a=>Object.fromEntries(a.questions.map(q=>{const b=c.questions.find(x=>x.id===q.id)||BANKS[id].questions.find(x=>x.id===q.id);return [q.id,select(q,b,b.answer)];}));
 for(const m of c.modules){for(const lid of m.lessons){L.visit(user(1),id,lid,true);const a=L.start(user(1),id,'lesson',lid).attempt;assert.equal(cur.submit(user(1),a.id,answersFor(a)).result.outcome,'passed');}const a=L.start(user(1),id,'module',m.id).attempt;assert.equal(a.questions.length,9);assert.equal(cur.submit(user(1),a.id,answersFor(a)).result.outcome,'passed');}
 const before=L.progress(user(1),id);assert.equal(before.completed,12);assert.equal(before.mastered_by_assessment,false);
 const a=cur.startSubtrack(user(1),id).attempt;assert.equal(a.questions.length,30);assert.equal(cur.submit(user(1),a.id,answersFor(a)).result.outcome,'passed');assert.equal(L.progress(user(1),id).mastered_by_assessment,true);assert.equal(L.progress(user(1),id).completed,12);
});

test('SQL Fundamentals covers every canonical objective with complete draft lessons and independent formative pools',()=>{
 const c=BUILTIN['sql-fundamentals'],v=validate(c);assert.deepEqual(v.errors,[]);assert.deepEqual(v.warnings,[]);assert.equal(v.covered,9);assert.equal(c.lessons.length,12);assert.equal(c.questions.length,80);assert.equal(c.human_review,null);assert.equal(L.summary(user(1),c.id).available,false);
 assert.ok(c.lessons.every(l=>l.worked.lang==='sql'));assert.equal(BANKS[c.id].questions.length,90);
});
test('SQL beginner, direct knowledge, targeted remediation and fresh attempts reuse the existing assessment engine',()=>{
 const sid='sql-fundamentals';for(const action of ['review','approve','publish']){const r=L.transition(sid,action,{attest_human_review:true,notes:'Synthetic SQL QA attestation in a disposable test store only, never actual human content approval.'},3);assert.ok(!r.error,JSON.stringify(r));}
 const c=L.published(sid),keys=(a,right=()=>true)=>Object.fromEntries(a.questions.map(q=>{const b=c.questions.find(x=>x.id===q.id)||BANKS[sid].questions.find(x=>x.id===q.id);return [q.id,select(q,b,right(b)?b.answer:(b.answer+1)%4)];}));
 const first=cur.startSubtrack(user(1),sid).attempt;assert.ok(first);const fail=cur.submit(user(1),first.id,keys(first,()=>false)).result;assert.equal(fail.outcome,'learning_recommended');assert.ok(fail.learning_areas.flatMap(m=>m.lessons).some(l=>l.id==='sql-null'));
 assert.equal(cur.startSubtrack(user(1),sid).status,409);
 for(const m of c.modules){for(const lid of m.lessons){L.visit(user(1),sid,lid,true);const a=L.start(user(1),sid,'lesson',lid).attempt;assert.ok(a);assert.ok(!JSON.stringify(a).includes('"answer":'));assert.equal(cur.submit(user(1),a.id,keys(a)).result.outcome,'passed');}const a=L.start(user(1),sid,'module',m.id).attempt;assert.equal(a.questions.length,9);assert.equal(cur.submit(user(1),a.id,keys(a)).result.outcome,'passed');}
 assert.equal(L.progress(user(1),sid).completed,12);assert.equal(L.progress(user(1),sid).mastered_by_assessment,false);
 const fresh=cur.startSubtrack(user(1),sid).attempt;assert.notEqual(fresh.id,first.id);assert.equal(cur.submit(user(1),fresh.id,keys(fresh)).result.outcome,'passed');assert.equal(L.progress(user(1),sid).mastered_by_assessment,true);assert.equal(cur.history(user(1)).length,18);
 const direct=cur.startSubtrack(user(2),sid).attempt;assert.equal(cur.submit(user(2),direct.id,keys(direct)).result.outcome,'passed');assert.equal(L.progress(user(2),sid).completed,0);
});

test('HTTP foundations and its comprehensive bank remain unpublished drafts, with every objective covered',()=>{
 const id='http-web-architecture',c=BUILTIN[id],v=validate(c),bank=BANKS[id].questions;assert.deepEqual(v.errors,[]);assert.deepEqual(v.warnings,[]);assert.equal(v.covered,8);assert.equal(c.lessons.length,9);assert.equal(c.questions.length,56);assert.equal(bank.length,90);assert.ok(bank.every(q=>q.status==='draft'));assert.equal(BANKS[id].reviewed_by,null);
 assert.equal(cur.assessmentStatus(id).state,'draft');assert.equal(cur.startSubtrack(user(1),id).status,409);assert.equal(L.transition(id,'publish',{},3).status,409);assert.equal(L.summary(user(1),id).available,false);
 const matrix=L.inventory(store).job_roles.find(r=>r.id==='junior-backend-developer');assert.equal(matrix.required.length,9);assert.equal(matrix.completion_matrix.length,9);const row=matrix.completion_matrix.find(r=>r.id===id);assert.equal(row.lessons,9);assert.equal(row.comprehensive_state,'draft');assert.equal(row.human_review,'pending');assert.ok(row.remaining.includes('Comprehensive assessment review and publication'));assert.equal(matrix.complete,false);
});
test('HTTP beginner and direct pathways, required remediation, fresh forms and historical evidence use the same engine',()=>{
 const id='http-web-architecture',bank=BANKS[id].questions;
 cur.setQuestionStatus(id,bank.map(q=>q.id),'reviewed',3);assert.equal(cur.coverage(id).feasible,true);assert.ok(!cur.publishAssessment(id,3).error);
 for(const action of ['review','approve','publish']){const out=L.transition(id,action,{attest_human_review:true,notes:'Synthetic HTTP fixture review for isolated integration testing only, never production human content approval.'},3);assert.ok(!out.error,JSON.stringify(out));}
 const c=L.published(id),keys=(a,correct=()=>true)=>Object.fromEntries(a.questions.map(q=>{const b=c.questions.find(x=>x.id===q.id)||bank.find(x=>x.id===q.id);return [q.id,select(q,b,correct(b)?b.answer:(b.answer+1)%4)];}));
 const fail=cur.startSubtrack(user(1),id).attempt;const low=cur.submit(user(1),fail.id,keys(fail,q=>!['m2.c1','m2.c3'].includes(q.comp))).result;assert.ok(low.learning_areas.flatMap(m=>m.lessons).some(l=>l.id==='http-safety-retries'));assert.equal(cur.startSubtrack(user(1),id).status,409);
 for(const m of c.modules){for(const lid of m.lessons){L.visit(user(1),id,lid,true);const a=L.start(user(1),id,'lesson',lid).attempt;assert.ok(a);assert.equal(cur.submit(user(1),a.id,keys(a)).result.outcome,'passed');}const a=L.start(user(1),id,'module',m.id).attempt;assert.equal(a.questions.length,8);assert.equal(cur.submit(user(1),a.id,keys(a)).result.outcome,'passed');}
 const learned=L.progress(user(1),id);assert.equal(learned.completed,9);assert.equal(learned.mastered_by_assessment,false);
 const fresh=cur.startSubtrack(user(1),id).attempt;assert.equal(fresh.questions.length,30);assert.ok(fresh.questions.some(q=>!fail.questions.some(p=>p.id===q.id)));assert.ok(!JSON.stringify(fresh).includes('"answer":'));assert.equal(cur.submit(user(1),fresh.id,keys(fresh)).result.outcome,'passed');assert.equal(cur.history(user(1)).length,14);
 const direct=cur.startSubtrack(user(2),id).attempt;assert.equal(cur.submit(user(2),direct.id,keys(direct)).result.outcome,'passed');assert.equal(L.progress(user(2),id).completed,0);
});

test('REST draft covers the existing canonical contract without duplicating or republishing its comprehensive bank',()=>{
 const id='rest-api-design',c=BUILTIN[id],v=validate(c);assert.deepEqual(v.errors,[]);assert.deepEqual(v.warnings,[]);assert.equal(v.covered,10);assert.equal(c.lessons.length,12);assert.equal(c.questions.length,76);assert.equal(c.modules.length,4);assert.equal(c.human_review,null);assert.equal(L.summary(user(1),id).available,false);assert.equal(L.transition(id,'publish',{},3).status,409);
 assert.equal(BANKS[id].questions.length,90);assert.deepEqual(cur.config().mix,{easy:20,medium:35,hard:35,advanced:10});assert.equal(cur.assessmentStatus(id).state,'published');
 const row=L.inventory(store).job_roles.find(r=>r.id==='junior-backend-developer').completion_matrix.find(r=>r.id===id);assert.equal(row.modules,4);assert.equal(row.practice_mcqs,76);assert.equal(row.verified_lesson_examples,12);assert.deepEqual(row.validation_errors,[]);assert.equal(row.human_review,'pending');
});
test('JSON lesson snippets are validated and public projections contain only allowed example fields',async()=>{
 const id='rest-api-design',c=structuredClone(BUILTIN[id]);
 const wire=c.lessons[0].sections[0].snippet.code,[head,body]=wire.split('\r\n\r\n');assert.ok(head.startsWith('POST /orders HTTP/1.1\r\n'));assert.equal(Number(head.match(/Content-Length: (\d+)/)[1]),Buffer.byteLength(body,'utf8'));assert.equal(JSON.parse(body).quantity,2);
 const section=c.lessons[0].sections.find(s=>s.snippet?.lang==='json');section.snippet.code='{invalid';assert.ok(validate(c).errors.some(e=>e.includes('invalid JSON example')));section.snippet={lang:'html',code:'<script>alert(1)</script>'};assert.ok(validate(c).errors.some(e=>e.includes('invalid JSON/HTTP/SQL snippet')));
 const draft=structuredClone(BUILTIN[id]);draft.lessons[0].sections[0].snippet.instructor_only='private fixture field';assert.ok(!L.updateDraft(id,draft,3).error);
 for(const action of ['review','approve','publish'])assert.ok(!L.transition(id,action,{attest_human_review:true,notes:'Synthetic REST snippet verification in a disposable fixture, not human content approval.'},3).error);
 const r=await call('career/learning/'+id+'/lessons/rest-resources',null);assert.equal(r.status,200);assert.deepEqual(Object.keys(r.data.sections[0].snippet).sort(),['code','lang']);assert.equal(r.data.questions,undefined);assert.ok(!JSON.stringify(r.data).includes('private fixture field'));
});
test('REST beginner, direct mastery, targeted recommendations and fresh final forms preserve history and blueprint',()=>{
 const id='rest-api-design';for(const action of ['review','approve','publish']){const r=L.transition(id,action,{attest_human_review:true,notes:'Synthetic REST QA for isolated end-to-end testing only, never a production content review.'},3);assert.ok(!r.error,JSON.stringify(r));}
 const c=L.published(id),bank=BANKS[id].questions,keys=(a,right=()=>true)=>Object.fromEntries(a.questions.map(q=>{const b=c.questions.find(x=>x.id===q.id)||bank.find(x=>x.id===q.id);return [q.id,select(q,b,right(b)?b.answer:(b.answer+1)%4)];}));
 const first=cur.startSubtrack(user(1),id).attempt;const low=cur.submit(user(1),first.id,keys(first,q=>!['m1.c1','m3.c1'].includes(q.comp))).result;assert.ok(low.learning_areas.flatMap(m=>m.lessons).some(l=>l.id==='rest-idempotency'));assert.equal(cur.startSubtrack(user(1),id).status,409);
 for(const m of c.modules){for(const lid of m.lessons){L.visit(user(1),id,lid,true);const a=L.start(user(1),id,'lesson',lid).attempt;assert.ok(a);assert.equal(a.questions.length,3);assert.equal(cur.submit(user(1),a.id,keys(a)).result.outcome,'passed');}const a=L.start(user(1),id,'module',m.id).attempt;assert.equal(a.questions.length,8);assert.equal(cur.submit(user(1),a.id,keys(a)).result.outcome,'passed');}
 const learned=L.progress(user(1),id);assert.equal(learned.completed,12);assert.equal(learned.learned,true);assert.equal(learned.mastered_by_assessment,false);
 const fresh=cur.startSubtrack(user(1),id).attempt;assert.equal(fresh.questions.length,30);assert.ok(fresh.questions.some(q=>!first.questions.some(old=>old.id===q.id)));assert.ok(!JSON.stringify(fresh).includes('"answer":'));
 const mix=Object.fromEntries(['easy','medium','hard','advanced'].map(d=>[d,fresh.questions.filter(q=>q.difficulty===d).length]));assert.deepEqual(mix,cur.quota(30,cur.config().mix));assert.ok(fresh.questions.filter(q=>bank.find(b=>b.id===q.id).scenario).length>=21);
 assert.equal(cur.submit(user(1),fresh.id,keys(fresh)).result.outcome,'passed');assert.equal(cur.history(user(1)).length,18);
 const direct=cur.startSubtrack(user(2),id).attempt;assert.equal(cur.submit(user(2),direct.id,keys(direct)).result.outcome,'passed');assert.equal(L.progress(user(2),id).completed,0);
});

test('Database Design keeps three canonical modules, covers all objectives and requires distinct human assessment/content review',()=>{
 const id='database-design',c=BUILTIN[id],v=validate(c),q=BANKS[id].questions;assert.deepEqual(v.errors,[]);assert.deepEqual(v.warnings,[]);assert.equal(c.modules.length,3);assert.equal(c.lessons.length,12);assert.equal(c.questions.length,76);assert.equal(v.covered,6);assert.equal(q.length,90);assert.ok(q.every(x=>x.status==='draft'));assert.equal(cur.assessmentStatus(id).state,'draft');assert.equal(L.summary(user(1),id).available,false);assert.equal(L.transition(id,'publish',{},3).status,409);
 const {databaseEvidence}=require('../career/curriculum/learning');assert.equal(databaseEvidence(c).verified,12);const altered=structuredClone(c);altered.lessons[0].worked.expect='changed';assert.equal(databaseEvidence(altered).verified,11);
 const role=L.inventory(store).job_roles.find(r=>r.id==='junior-backend-developer'),row=role.completion_matrix.find(r=>r.id===id);assert.equal(row.modules,3);assert.equal(row.database_verification.verified,12);assert.equal(row.database_verification.native_multi_connection_test,false);assert.equal(role.complete,false);
 assert.deepEqual(Object.fromEntries(['easy','medium','hard','advanced'].map(d=>[d,q.filter(x=>x.difficulty===d).length])),{easy:18,medium:32,hard:31,advanced:9});assert.equal(q.filter(x=>x.scenario).length,63);
});
test('Database Design guided, direct, remediation and fresh assessment paths preserve prior knowledge evidence',()=>{
 const id='database-design',bank=BANKS[id].questions;cur.setQuestionStatus(id,bank.map(q=>q.id),'reviewed',3);assert.ok(!cur.publishAssessment(id,3).error);
 for(const action of ['review','approve','publish']){const out=L.transition(id,action,{attest_human_review:true,notes:'Synthetic Database Design test attestation only in a disposable store, never actual human content approval.'},3);assert.ok(!out.error,JSON.stringify(out));}
 const c=L.published(id),keys=(a,right=()=>true)=>Object.fromEntries(a.questions.map(q=>{const b=c.questions.find(x=>x.id===q.id)||bank.find(x=>x.id===q.id);return [q.id,select(q,b,right(b)?b.answer:(b.answer+1)%4)];}));
 const first=cur.startSubtrack(user(1),id).attempt;const low=cur.submit(user(1),first.id,keys(first,q=>!['m2.c1','m3.c1'].includes(q.comp))).result;assert.ok(low.learning_areas.flatMap(m=>m.lessons).some(l=>l.id==='db-constraints'));assert.equal(cur.startSubtrack(user(1),id).status,409);
 for(const m of c.modules){for(const lid of m.lessons){L.visit(user(1),id,lid,true);const a=L.start(user(1),id,'lesson',lid).attempt;assert.ok(a);assert.equal(a.questions.length,3);assert.equal(cur.submit(user(1),a.id,keys(a)).result.outcome,'passed');}const a=L.start(user(1),id,'module',m.id).attempt;assert.equal(a.questions.length,9);assert.equal(cur.submit(user(1),a.id,keys(a)).result.outcome,'passed');}
 const learned=L.progress(user(1),id);assert.equal(learned.completed,12);assert.equal(learned.learned,true);assert.equal(learned.mastered_by_assessment,false);
 const fresh=cur.startSubtrack(user(1),id).attempt;assert.ok(fresh.questions.some(q=>!first.questions.some(p=>p.id===q.id)));assert.equal(fresh.questions.length,30);assert.ok(!JSON.stringify(fresh).includes('"answer":'));assert.equal(cur.submit(user(1),fresh.id,keys(fresh)).result.outcome,'passed');assert.equal(cur.history(user(1)).length,17);
 const direct=cur.startSubtrack(user(2),id).attempt;assert.equal(cur.submit(user(2),direct.id,keys(direct)).result.outcome,'passed');assert.equal(L.progress(user(2),id).completed,0);
});

test('API Security keeps three canonical modules, covers all objectives and requires distinct human assessment/content review',()=>{
 const id='api-security-auth',c=BUILTIN[id],v=validate(c),q=BANKS[id].questions;assert.deepEqual(v.errors,[]);assert.deepEqual(v.warnings,[]);assert.equal(c.modules.length,3);assert.equal(c.lessons.length,12);assert.equal(c.questions.length,76);assert.equal(v.covered,8);assert.equal(q.length,90);assert.ok(q.every(x=>x.status==='draft'));assert.equal(cur.assessmentStatus(id).state,'draft');assert.equal(L.summary(user(1),id).available,false);assert.equal(L.transition(id,'publish',{},3).status,409);
 const bankCheck=require('../career/curriculum/qdsl').validateBank(q,require('../career/curriculum').subtrack(id));assert.deepEqual(bankCheck.errors,[]);assert.deepEqual(bankCheck.warnings,[]);
 assert.deepEqual(Object.fromEntries(['easy','medium','hard','advanced'].map(d=>[d,q.filter(x=>x.difficulty===d).length])),{easy:18,medium:32,hard:31,advanced:9});assert.equal(q.filter(x=>x.scenario).length,63);
});
test('API Security guided, direct, remediation and fresh assessment paths preserve prior knowledge evidence',()=>{
 const id='api-security-auth',bank=BANKS[id].questions;cur.setQuestionStatus(id,bank.map(q=>q.id),'reviewed',3);assert.ok(!cur.publishAssessment(id,3).error);
 for(const action of ['review','approve','publish']){const out=L.transition(id,action,{attest_human_review:true,notes:'Synthetic API Security test attestation only in a disposable store, never actual human content approval.'},3);assert.ok(!out.error,JSON.stringify(out));}
 const c=L.published(id),keys=(a,right=()=>true)=>Object.fromEntries(a.questions.map(q=>{const b=c.questions.find(x=>x.id===q.id)||bank.find(x=>x.id===q.id);return [q.id,select(q,b,right(b)?b.answer:(b.answer+1)%4)];}));
 const first=cur.startSubtrack(user(1),id).attempt;const low=cur.submit(user(1),first.id,keys(first,q=>!['m2.c1','m3.c3'].includes(q.comp))).result;assert.ok(low.learning_areas.flatMap(m=>m.lessons).some(l=>l.id==='sec-object-access'));assert.equal(cur.startSubtrack(user(1),id).status,409);
 for(const m of c.modules){for(const lid of m.lessons){L.visit(user(1),id,lid,true);const a=L.start(user(1),id,'lesson',lid).attempt;assert.ok(a);assert.equal(a.questions.length,3);assert.equal(cur.submit(user(1),a.id,keys(a)).result.outcome,'passed');}const a=L.start(user(1),id,'module',m.id).attempt;assert.equal(a.questions.length,9);assert.equal(cur.submit(user(1),a.id,keys(a)).result.outcome,'passed');}
 const learned=L.progress(user(1),id);assert.equal(learned.completed,12);assert.equal(learned.learned,true);assert.equal(learned.mastered_by_assessment,false);
 const fresh=cur.startSubtrack(user(1),id).attempt;assert.ok(fresh.questions.some(q=>!first.questions.some(p=>p.id===q.id)));assert.equal(fresh.questions.length,30);assert.deepEqual(Object.fromEntries(['easy','medium','hard','advanced'].map(d=>[d,fresh.questions.filter(q=>q.difficulty===d).length])),cur.quota(30,cur.config().mix));assert.ok(fresh.questions.filter(q=>bank.find(b=>b.id===q.id).scenario).length>=21);assert.ok(!JSON.stringify(fresh).includes('"answer":'));assert.equal(cur.submit(user(1),fresh.id,keys(fresh)).result.outcome,'passed');assert.equal(cur.history(user(1)).length,17);
 const direct=cur.startSubtrack(user(2),id).attempt;assert.equal(cur.submit(user(2),direct.id,keys(direct)).result.outcome,'passed');assert.equal(L.progress(user(2),id).completed,0);
});
