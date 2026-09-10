'use strict';
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const root=path.resolve(__dirname,'..'),run=(file,args)=>cp.execFileSync(file,args,{cwd:root,encoding:'utf8',stdio:['ignore','pipe','pipe']});
const git=args=>run('git',args),tracked=git(['diff','--name-only']).trim().split(/\r?\n/),untracked=git(['ls-files','--others','--exclude-standard']).trim().split(/\r?\n/),changed=[...new Set([...tracked,...untracked].filter(Boolean))];
const failures=[];for(const file of changed.filter(f=>/\.(?:js|cjs)$/.test(f))){try{run(process.execPath,['--check',file]);}catch(e){failures.push({file,error:String(e.stderr||e.message)});}}
let diffCheck='PASS';try{git(['diff','--check']);}catch(e){diffCheck=String(e.stdout||e.message);}
const result={checked_at:new Date().toISOString(),branch:git(['branch','--show-current']).trim(),base:git(['rev-parse','HEAD']).trim(),diffCheck,syntax:{checked:changed.filter(f=>/\.(?:js|cjs)$/.test(f)).length,failures},changedFiles:changed};
fs.writeFileSync(path.join(__dirname,'evidence/syntax-checks.json'),JSON.stringify({checked:result.syntax.checked,failures},null,2));fs.writeFileSync(path.join(__dirname,'change-manifest.json'),JSON.stringify(result,null,2));console.log(JSON.stringify({branch:result.branch,changed:changed.length,diffCheck,syntax:result.syntax}));if(diffCheck!=='PASS'||failures.length)process.exitCode=1;
