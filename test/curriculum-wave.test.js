'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const C=require('../career/curriculum'),{BUILTIN,validate}=require('../career/curriculum/learning'),{BANKS}=require('../career/curriculum/questions');
const {plan,checkCourse,proseDuplicates,questionDuplicates,safeOutput,writeCheckpoint}=require('../scripts/lib/curriculum-wave.cjs');
test('batch queue resolves canonical prerequisites once and preserves priority',()=>{
 const done=Object.keys(BUILTIN).filter(id=>!['backend-testing-reliability','git-collaboration'].includes(id)),r=plan(done,{limit:20});
 assert.equal(r.selected[0].id,'backend-testing-reliability');assert.equal(r.selected[1].id,'git-collaboration');
 const available=new Set(done);for(const row of r.selected){assert.ok(row.prerequisites.every(id=>available.has(id)));assert.ok(!available.has(row.id));available.add(row.id);assert.equal(row.objectives.length,C.subtrack(row.id).modules.flatMap(m=>m.objectives).length);}
});
test('resume requires unchanged lesson and assessment hashes and does not manufacture approval',()=>{
 const course=BUILTIN['api-security-auth'],bank=BANKS[course.id].questions;
 const previous=checkCourse(course,bank,{validate});assert.equal(previous.execution_passed,false);
 previous.execution_passed=true;previous.examples=course.lessons.map(l=>({id:l.id,ok:true}));
 const exact=checkCourse(course,bank,{validate,previous});assert.equal(exact.resumed_exact_checkpoint,true);assert.equal(exact.execution_passed,true);assert.equal(exact.human_approved,false);assert.equal(exact.published,false);
 const changed=structuredClone(course);changed.lessons[0].introduction+=' Changed wording.';
 assert.equal(checkCourse(changed,bank,{validate,previous}).resumed_exact_checkpoint,false);
 const changedBank=structuredClone(bank);changedBank[0].answer=(changedBank[0].answer+1)%4;
 assert.equal(checkCourse(course,changedBank,{validate,previous}).resumed_exact_checkpoint,false);
});
test('batch validation rejects insufficient banks, reused keys and repeated teaching',()=>{
 const course=structuredClone(BUILTIN['api-security-auth']),bank=BANKS[course.id].questions;
 const short=checkCourse(course,bank.slice(0,20),{validate});assert.ok(short.errors.some(e=>e.includes('90 distinct')));
 course.questions[0].id=bank[0].id;assert.ok(checkCourse(course,bank,{validate}).errors.some(e=>e.includes('Repeated assessment id')));
 course.lessons[1].introduction=course.lessons[0].introduction;assert.ok(proseDuplicates([course]).errors.length);
 assert.equal(questionDuplicates([],[ [{id:'a',prompt:'A worker retries 10 jobs after a timeout. What changes?'},{id:'b',prompt:'A worker retries 20 jobs after a timeout. What changes?'}] ]).errors.length,1);
 assert.equal(questionDuplicates([],[ [{id:'a',prompt:'What does this code print?',code:'print(2 + 3)'},{id:'b',prompt:'What does this code print?',code:'print(2 * 3)'}] ]).errors.length,0);
});
test('private batch artifacts cannot escape through a symlink into public assets',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'wave-output-'));try{
 const publicRoot=path.join(root,'public');fs.mkdirSync(publicRoot);fs.symlinkSync(publicRoot,path.join(root,'alias'),'dir');
 assert.throws(()=>safeOutput(path.join(root,'alias','keys.json'),publicRoot),/outside public/);
 fs.writeFileSync(path.join(publicRoot,'existing.json'),'{}');fs.symlinkSync(path.join(publicRoot,'existing.json'),path.join(root,'file-alias'));
 assert.throws(()=>safeOutput(path.join(root,'file-alias'),publicRoot),/outside public/);
 const output=path.join(root,'private','checkpoint.json');writeCheckpoint(output,{completed:['a'],pending:['b']});assert.deepEqual(JSON.parse(fs.readFileSync(output)),{completed:['a'],pending:['b']});
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
