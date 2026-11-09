'use strict';
// Offline staff package. No store, database URL, approval or publication writes.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const C=require('../career/curriculum'),{BUILTIN,validate,hash}=require('../career/curriculum/learning'),{BANKS,APPROVED}=require('../career/curriculum/questions');
const {safeOutput,writeCheckpoint,proseDuplicates,questionDuplicates}=require('./lib/curriculum-wave.cjs');
const evidence=require('../career/curriculum/learning/verification.json');
const role=C.role(process.argv[2]);if(!role)throw Error('Provide an existing canonical role ID and private output directory.');
if(!process.argv[3])throw Error('Provide a private output directory.');
const output=safeOutput(process.argv[3]);fs.mkdirSync(output,{recursive:true});
const required=C.rolePath(role).required,courses=required.map(id=>BUILTIN[id]).filter(Boolean);
const report={role:{id:role.id,title:role.title,track:role.track,required,prerequisites_added:C.rolePath(role).prerequisites_added},scope:'Repository-only technical review preparation; not human approval or deployed-state evidence',human_approved:false,published:false,missing:required.filter(id=>!BUILTIN[id]),courses:[]};
for(const id of required){
 const course=BUILTIN[id];if(!course)continue;
 const checked=evidence.courses.find(c=>c.id===id),bank=BANKS[id]?.questions||[],result=validate(course);
 report.courses.push({id,title:C.subtrack(id).title,prerequisites:C.subtrack(id).prereq,course_hash:hash(course),content_version:course.version,
  modules:course.modules,lessons:course.lessons.map(l=>({id:l.id,title:l.title,module:l.module,prerequisites:l.prerequisites,objectives:l.objectives,primary_quiz_ids:l.quiz,worked_example_verified:!!checked?.examples.some(e=>e.id===l.id&&e.ok&&e.code_hash===hash({code:l.worked.code,expect:l.worked.expect,lang:l.worked.lang||'python'}))})),
  objective_coverage:C.subtrack(id).modules.flatMap(m=>m.objectives).map(o=>({id:o.id,text:o.text,critical:!!o.critical,lessons:course.lessons.filter(l=>l.objectives.some(c=>c.id===o.id)).map(l=>l.id),formative_items:course.questions.filter(q=>q.objective===o.id).map(q=>q.id),comprehensive_items:bank.filter(q=>id+'.'+q.comp===o.id).map(q=>q.id)})),
  formative_count:course.questions.length,checkpoint_items:course.checkpoint_items,comprehensive_count:bank.length,comprehensive_metadata_state:APPROVED[id]?'historical published bank':'unreviewed draft bank',references:course.references,validation:result,whole_course_matches_verification:checked?.course_hash===hash(course),human_review:'pending',published:false});
}
report.duplication={teaching:proseDuplicates(courses),questions:questionDuplicates(courses,courses.map(c=>BANKS[c.id]?.questions||[]))};
report.totals={required:required.length,authored:courses.length,modules:courses.reduce((n,c)=>n+c.modules.length,0),lessons:courses.reduce((n,c)=>n+c.lessons.length,0),formative:courses.reduce((n,c)=>n+c.questions.length,0),comprehensive:courses.reduce((n,c)=>n+(BANKS[c.id]?.questions.length||0),0),verified_worked_examples:report.courses.reduce((n,c)=>n+c.lessons.filter(l=>l.worked_example_verified).length,0)};
report.unresolved_review_tasks=['Check every explanation, mathematical claim, business assumption and reference for its intended audience.','Verify all keys, distractors, originality, critical-objective depth and provisional question difficulty.','Inspect duplication findings and distinguish necessary prerequisite reinforcement from repeated teaching.','Review each worked example’s environment, omitted cases and production limitations.','Record item review and publish eligible comprehensive banks using the authenticated existing admin workflow.','Record exact-version lesson approval and publish each approved package separately.','Only prepare/review the job-role final after its existing mandatory coverage gates are satisfied; this script does not approve or publish it.'];
writeCheckpoint(path.join(output,'pathway-inventory.json'),report);
const checklist=['# '+role.title+' — subject-matter review preparation','','PRIVATE: contains answer-key materials. No approval or publication is performed.','',...Object.entries(report.totals).map(([k,v])=>'- '+k+': '+v),'','## Reviewer checklist','',...report.unresolved_review_tasks.map(t=>'- [ ] '+t),'','Begin with index.html; inspect pathway-inventory.json for prerequisite order, exact objectives and quiz/remediation mappings.','',...report.courses.map(c=>'- [ ] '+c.id+': review lessons, examples, each formative/formal key and source assumptions; record corrections before exact-version approval.'),'','Technical evidence comes from matching repository code hashes. Student-flow evidence is retained in the mass-scale wave reports; it is not human content review.'].join('\n');fs.writeFileSync(path.join(output,'REVIEW-CHECKLIST.md'),checklist+'\n');
cp.execFileSync(process.execPath,[path.join(__dirname,'build-career-learning-review.js'),output,'--role',role.id],{stdio:'pipe'});
console.log(JSON.stringify({output,role:role.id,...report.totals,missing:report.missing,duplication:report.duplication,human_approved:false,published:false},null,2));
