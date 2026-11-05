'use strict';
// Structural/code verification is not human approval and never publishes content.
const fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process');
const {BUILTIN,validate,hash}=require('../career/curriculum/learning');
const arg=name=>{const i=process.argv.indexOf(name);return i<0?null:process.argv[i+1];};
const execute=!process.argv.includes('--structure-only'), sourceRoot=arg('--source-root');
const report={human_approved:false,published:false,courses:[],official_source:null,official_sources:[]};
for(const course of Object.values(BUILTIN)) {
  const result=validate(course,{execute});
  report.courses.push({id:course.id,version:course.version,course_hash:hash(course),...result});
  if(sourceRoot) {
    const commit=execFileSync('git',['-C',sourceRoot,'rev-parse','HEAD'],{encoding:'utf8'}).trim();
    const references=course.references.map(r=>{
      if(commit!==r.source.commit)throw Error('Reference checkout does not match the recorded official source commit.');
      const target=path.resolve(sourceRoot,r.source.path);
      if(!target.startsWith(path.resolve(sourceRoot)+path.sep))throw Error('Invalid source path.');
      const content=fs.readFileSync(target);
      return {id:r.id,path:r.source.path,sha256:require('node:crypto').createHash('sha256').update(content).digest('hex'),checked_by:'official Git object and path inspection'};
    });
    const source={repository:'https://github.com/python/cpython',commit,references};
    report.official_sources.push({course:course.id,...source});report.official_source=source;
  }
}
const output=arg('--output');if(output)fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');
const errors=report.courses.flatMap(c=>c.errors), warnings=report.courses.flatMap(c=>c.warnings);
console.log(JSON.stringify({courses:report.courses.length,lessons:report.courses.reduce((n,c)=>n+c.lessons,0),questions:report.courses.reduce((n,c)=>n+c.questions,0),examples_checked:report.courses.reduce((n,c)=>n+c.examples.length,0),errors,warnings,human_approved:false,published:false},null,2));
if(errors.length)process.exitCode=1;
