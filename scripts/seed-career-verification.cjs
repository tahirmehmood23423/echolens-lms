'use strict';
// Reuse real passed batch evidence only for exact registered content. No approval/store writes.
const fs=require('node:fs');
const {BUILTIN,validate,hash}=require('../career/curriculum/learning');
const {BANKS}=require('../career/curriculum/questions');
const {digest,safeOutput}=require('./lib/curriculum-wave.cjs');
function seed(previous,checkpoint){
 if(previous.human_approved||previous.published)throw Error('Technical cache must not contain approval/publication claims.');
 const rows=checkpoint.courses,ids=rows?.map(r=>r.id);
 if(!Array.isArray(rows)||!rows.length||new Set(ids).size!==ids.length||checkpoint.completed?.length!==rows.length||checkpoint.completed.some(id=>!ids.includes(id))||new Set(checkpoint.completed).size!==rows.length||!Array.isArray(checkpoint.duplication?.errors)||!Array.isArray(checkpoint.duplication?.warnings)||checkpoint.duplication.errors.length||checkpoint.duplication.warnings.length)throw Error('A complete unique error-free batch checkpoint is required.');
 const courses=[...(previous.courses||[])];
 for(const row of rows){
  const course=BUILTIN[row.id],bank=BANKS[row.id]?.questions;
  if(!course||!bank||row.fingerprint!==digest({course,bank}))throw Error('Stale or unregistered course/bank fingerprint: '+row.id);
  if(row.execution_passed!==true||row.errors?.length!==0||row.warnings?.length!==0)throw Error('Batch execution did not pass: '+row.id);
  const result=validate(course);if(result.errors.length||result.warnings.length)throw Error('Current structural validation failed: '+row.id);
  const expected=[...course.lessons.map(l=>({id:l.id,code:l.worked.code,expect:l.worked.expect,lang:l.worked.lang||'python'})),...course.questions.filter(q=>q.code&&q.expect!=null),...bank.filter(q=>q.code&&q.expect!=null)];
  if(!Array.isArray(row.examples)||row.examples.length!==expected.length||new Set(row.examples.map(e=>e.id)).size!==expected.length)throw Error('Incomplete executable evidence: '+row.id);
  for(const q of expected){const e=row.examples.find(e=>e.id===q.id);if(!e||e.ran!==true||e.ok!==true||e.code_hash!==hash({code:q.code,expect:q.expect,lang:q.lang})||e.output!==String(q.expect).trimEnd())throw Error('Executable evidence mismatch: '+q.id);}
  const current=courses.find(c=>c.id===row.id);if(current){if(current.course_hash!==hash(course))throw Error('Refusing to replace changed existing verification: '+row.id);continue;}
  courses.push({id:row.id,version:course.version,course_hash:hash(course),...result,examples:row.examples.filter(e=>course.lessons.some(l=>l.id===e.id)||course.questions.some(q=>q.id===e.id)),verification_origin:'Passed exact course/bank batch checkpoint; official sources require separate validation'});
 }
 return {...previous,courses,human_approved:false,published:false};
}
if(require.main===module){const args=process.argv.slice(2);if(args.length!==4||args[0]!=='--checkpoint'||args[2]!=='--output')throw Error('Use --checkpoint FILE --output EXISTING_VERIFICATION_FILE');const output=safeOutput(args[3]),result=seed(JSON.parse(fs.readFileSync(output)),JSON.parse(fs.readFileSync(args[1])));fs.writeFileSync(output,JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({courses:result.courses.length,scope:'Exact passed execution cache only; no human review or publication'}));}
module.exports={seed};
