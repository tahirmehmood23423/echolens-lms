'use strict';
// Structural/code verification is not human approval and never publishes content.
const fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process');
const {BUILTIN,validate,hash}=require('../career/curriculum/learning');
const arg=name=>{const i=process.argv.indexOf(name);return i<0?null:process.argv[i+1];};
const execute=!process.argv.includes('--structure-only'), sourceRoot=arg('--source-root');
const report={human_approved:false,published:false,courses:[],official_source:null,official_sources:[]};
const roots=arg('--source-roots')?JSON.parse(fs.readFileSync(arg('--source-roots'),'utf8')):{};
for(const [repo,root] of Object.entries({'python/cpython':sourceRoot,'postgres/postgres':arg('--source-root-postgres'),'httpwg/http-core':arg('--source-root-http'),'OAI/OpenAPI-Specification':arg('--source-root-openapi'),'OWASP/CheatSheetSeries':arg('--source-root-owasp')}))if(root)roots[repo]=root;
for(const course of Object.values(BUILTIN)) {
  const result=validate(course,{execute});
  report.courses.push({id:course.id,version:course.version,course_hash:hash(course),...result});
  const groups=new Map();
  for(const ref of course.references){const repo=ref.source?.repo;if(!groups.has(repo))groups.set(repo,[]);groups.get(repo).push(ref);}
  for(const [repo,refs] of groups){
    const courseSourceRoot=roots[repo];if(!courseSourceRoot){if(process.argv.includes('--require-sources'))throw Error('Missing pinned source checkout for '+course.id+': '+repo);continue;}
    const commit=execFileSync('git',['-C',courseSourceRoot,'rev-parse','HEAD'],{encoding:'utf8'}).trim();
    const references=refs.map(r=>{
      if(commit!==r.source.commit)throw Error('Reference checkout does not match the recorded official source commit.');
      const target=path.resolve(courseSourceRoot,r.source.path);
      if(!target.startsWith(path.resolve(courseSourceRoot)+path.sep))throw Error('Invalid source path.');
      const content=fs.readFileSync(target);
      const pinned=execFileSync('git',['-C',courseSourceRoot,'show',commit+':'+r.source.path],{maxBuffer:8*1024*1024});
      if(!content.equals(pinned))throw Error('Reference file differs from the pinned official Git object.');
      return {id:r.id,path:r.source.path,sha256:require('node:crypto').createHash('sha256').update(content).digest('hex'),checked_by:'Pinned official Git object and matching local source file'};
    });
    const source={repository:'https://github.com/'+repo,commit,references};
    report.official_sources.push({course:course.id,...source});report.official_source=source;
  }
}
const output=arg('--output');if(output)fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');
const errors=report.courses.flatMap(c=>c.errors), warnings=report.courses.flatMap(c=>c.warnings);
console.log(JSON.stringify({courses:report.courses.length,lessons:report.courses.reduce((n,c)=>n+c.lessons,0),questions:report.courses.reduce((n,c)=>n+c.questions,0),examples_checked:report.courses.reduce((n,c)=>n+c.examples.length,0),errors,warnings,human_approved:false,published:false},null,2));
if(errors.length)process.exitCode=1;
