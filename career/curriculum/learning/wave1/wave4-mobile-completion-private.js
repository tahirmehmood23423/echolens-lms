'use strict';
// Private authoring adapter. Lessons and distinct question rows are explicitly authored.
const C=require('../../index'),{Q}=require('../../qdsl'),banks=new Map();
const PIN='35ed8c8d5caf1ff8b63a80bfe0f5b1b85e6e8e68';
function question(id,comp,row,diff,scenario,sid){
 const parts=row.split('|');if(parts.length!==6)throw Error(id+': six authored fields required');
 const [prompt,right,...rest]=parts,wrong=rest.slice(0,3).map(x=>{const p=x.split('~');if(p.length!==2)throw Error(id+': distractor explanation required');return p;}),explanation=rest[3];
 const raw=[right,...wrong.map(x=>x[0])],shift=Number(id.match(/\d+$/)[0])%4,options=raw.map((_,i)=>raw[(i+shift)%4]),answer=options.indexOf(right);
 return {...Q(id,comp,diff,scenario?'scenario':'concept',scenario?'Original synthetic mobile engineering requirement':null,prompt,null,options,answer,explanation,options.filter((_,i)=>i!==answer).map(o=>wrong.find(x=>x[0]===o)[1])),status:'draft',...(sid?{subtrack:sid,objective:sid+'.'+comp}:{})};
}
function course(id,specs,paths,sourceProfile=null){
 const sub=C.subtrack(id),questions=[];
 const lessons=specs.map((x,i)=>{const m=sub.modules[Math.floor(i/3)],comps=x.comps||m.objectives.map(o=>o.id.slice(id.length+1));const qs=x.practice.map((r,j)=>question(x.id+'.p'+(j+1),(x.practice_comps||[])[j]||comps[j%comps.length],r,['E','M','H'][j%3],j>=3,id));questions.push(...qs);return {id:x.id,module:m.id,version:1,title:x.title,minutes:40,objectives:comps.map(c=>({id:id+'.'+c,text:C.competency(id+'.'+c).competency.text})),prerequisites:i?[specs[i-1].id]:[],prerequisite_note:x.before||('Use canonical prerequisites '+sub.prereq.join(', ')+'. Review the preceding lesson before tracing this example. Every fixture states its actual engine and execution boundary.'),introduction:x.intro,sections:x.sections.map(([heading,...paragraphs])=>({heading,paragraphs})),worked:{lang:x.lang||'python',problem:x.problem,steps:x.steps,code:x.code,expect:x.expect,explanation:x.limit},mistakes:x.mistakes,takeaways:x.takeaways,references:paths.map((_,j)=>id+'.ref'+j),reuse:[],quiz:qs.slice(0,x.quiz_count||4).map(q=>q.id)};});
 let formalNumber=0;
 banks.set(id,specs.flatMap((s,i)=>s.formal.map((r,j)=>{const m=sub.modules[Math.floor(i/3)],comps=s.comps||m.objectives.map(o=>o.id.slice(id.length+1));formalNumber++;const q=question(id+'.w4.f'+String(formalNumber).padStart(3,'0'),(s.formal_comps||[])[j]||comps[j%comps.length],r,s.formal_levels?.[j]||['E','M','M','H','H','H','A','M'][j%8],s.formal_scenarios?.[j]??j>=2);return s.formal_code?.[j]?{...q,...s.formal_code[j],type:'output'}:q;})));
 const refProfile=sourceProfile||{repo:'flutter/website',commit:PIN,base:'sites/docs/src/content/',title:'Flutter official documentation: ',verification:'Exact official Git bytes materialized and read. Framework-neutral Python/SQLite mechanisms are explicitly distinguished from native SDK and operating-system behavior. Human educational review remains pending.'};
 return {id,version:1,state:'draft',language:'en',author:'EchoLens AI-assisted instructional draft',human_review:null,pass_mark:70,checkpoint_items:8,quiz_minutes:12,checkpoint_minutes:20,modules:sub.modules.map(m=>({id:m.id,title:m.title,lessons:lessons.filter(l=>l.module===m.id).map(l=>l.id)})),lessons,questions,references:paths.map((p,i)=>({id:id+'.ref'+i,title:refProfile.title+p.split('/').pop(),url:'https://github.com/'+refProfile.repo+'/blob/'+refProfile.commit+'/'+refProfile.base+p,source:{repo:refProfile.repo,commit:refProfile.commit,path:refProfile.base+p,verification:refProfile.verification}}))};
}
module.exports={course,bank:id=>banks.get(id)};
