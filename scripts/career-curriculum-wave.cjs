'use strict';
const fs=require('node:fs'),path=require('node:path');
const C=require('../career/curriculum'),{BUILTIN,validate}=require('../career/curriculum/learning'),{BANKS}=require('../career/curriculum/questions');
const {plan,checkCourse,proseDuplicates,writeCheckpoint}=require('./lib/curriculum-wave.cjs');
const arg=n=>{const i=process.argv.indexOf(n);return i<0?null:process.argv[i+1];};
const output=arg('--output'),mode=process.argv[2]||'plan';
if(mode==='plan'){
 const result=plan(Object.keys(BUILTIN),{limit:Number(arg('--limit')||20),preferred:(arg('--prefer')||'').split(',').filter(Boolean)});
 if(output)writeCheckpoint(output,result);console.log(JSON.stringify(result,null,2));
}else if(mode==='check'){
 const ids=(arg('--ids')||Object.keys(BUILTIN).join(',')).split(',').filter(Boolean);
 if(ids.some(id=>!C.subtrack(id)||!/^[a-z0-9-]+$/.test(id)))throw Error('Select existing canonical IDs.');
 const prior=arg('--resume'),previous=prior?JSON.parse(fs.readFileSync(prior,'utf8')):null;
 const rows=[],courses=[];
 for(const id of C.prereqOrder(ids)){
  const course=BUILTIN[id]||require(path.resolve(__dirname,'../career/curriculum/learning/wave1',id+'.js'));
  const bank=BANKS[id]?.questions||require(path.resolve(__dirname,'../career/curriculum/questions/wave1',id+'.js'));
  courses.push(course);rows.push(checkCourse(course,bank,{validate,execute:process.argv.includes('--execute'),previous:previous?.courses?.find(c=>c.id===id)}));
 }
 const duplicate=proseDuplicates(courses),done=new Set(Object.keys(BUILTIN).filter(id=>!rows.some(row=>row.id===id&&!row.execution_passed)));
 const report={schema_version:1,scope:'Repository-only content checks; no application store, human approval or publication',courses:rows,duplication:duplicate,completed:rows.filter(c=>c.execution_passed).map(c=>c.id),pending:C.SUBTRACKS.filter(s=>!done.has(s.id)&&!rows.some(r=>r.id===s.id&&r.execution_passed)).map(s=>s.id),human_approved:false,published:false};
 if(output)writeCheckpoint(output,report);
 console.log(JSON.stringify({courses:rows.length,completed:report.completed,errors:rows.flatMap(c=>c.errors).concat(duplicate.errors),warnings:rows.flatMap(c=>c.warnings).concat(duplicate.warnings),pending:report.pending.length},null,2));
 if(rows.some(c=>c.errors.length)||duplicate.errors.length)process.exitCode=1;
}else throw Error('Use plan or check. check accepts --ids, --execute, --resume and --output.');
