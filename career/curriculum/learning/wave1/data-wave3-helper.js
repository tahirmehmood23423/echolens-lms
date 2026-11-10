'use strict';
// Internal authoring adapter: instructional prose and every item are explicitly authored in course files.
const C=require('../../index'),{Q}=require('../../qdsl');
const banks=new Map();
const COMMIT='0691c5cf90477d3503834d983f69350f250a6ff7';
function question(id,comp,diff,row,scenario,sid){
 const [prompt,right,...tail]=row,wrong=tail.slice(0,3),explanation=tail[3];
 const rotation=Number(id.match(/\d+$/)?.[0]||0)%4,base=[right,...wrong],options=base.map((_,i)=>base[(i+rotation)%4]),answer=options.indexOf(right);
 // Every item includes an explicit derivation; distractor feedback points back to that item-specific reasoning.
 const why=options.filter((_,i)=>i!==answer).map(o=>`${o}: ${explanation}`);
 return {...Q(id,comp,diff,scenario?'scenario':'concept',scenario?'original synthetic data/engineering case':null,prompt,null,options,answer,explanation,why),status:'draft',...(sid?{subtrack:sid,objective:sid+'.'+comp}:{})};
}
function course(id,specs,references){
 const refNames=references.map(r=>r.id);
 banks.set(id,formal(id,specs));
 const s=C.subtrack(id),questions=[],lessons=specs.map((x,i)=>{
  const module=s.modules[Math.floor(i/3)],cs=x.comps.map(c=>C.competency(id+'.'+c));
  const qs=x.practice.map((r,j)=>question(x.id+'.q'+(j+1),(x.practice_comps||[])[j]||x.comps[j%x.comps.length],j<3?'E':j===6?'H':'M',r,j>=3,id));questions.push(...qs);
  return {id:x.id,module:module.id,version:1,title:x.title,minutes:40,objectives:cs.map(o=>({id:o.competency.id,text:o.competency.text})),prerequisites:i?[specs[i-1].id]:[],prerequisite_note:i?'Use the preceding lesson’s definitions and revisit its worked reasoning when a step is unfamiliar.':s.prereq.length?'Canonical prerequisites: '+s.prereq.join(', ')+'. Review metric definitions, records and missing values. Each executable example states its engine and the boundary between a synthetic calculation and a production system.':'No previous analytics experience is required. A record is one stored observation; a decision is the action someone will take using the evidence. Python examples are optional executable illustrations, not required coding assignments.',introduction:x.intro,sections:x.sections.map(([heading,...paragraphs])=>({heading,paragraphs})),worked:{lang:x.lang||'python-pandas',problem:x.problem,steps:x.steps,code:x.code,expect:x.expect,explanation:x.limit},mistakes:x.mistakes,takeaways:x.takeaways,references:refNames,reuse:[],quiz:qs.slice(0,3).map(q=>q.id)};
 });
 return {id,version:1,state:'draft',language:'en',author:'EchoLens AI-assisted instructional draft',human_review:null,pass_mark:70,checkpoint_items:9,quiz_minutes:12,checkpoint_minutes:20,modules:s.modules.map(m=>({id:m.id,title:m.title,lessons:lessons.filter(l=>l.module===m.id).map(l=>l.id)})),lessons,questions,references};
}
function formal(id,specs){return specs.flatMap((s,i)=>s.formal.map((r,j)=>question(id+'.w1.'+(i*10+j+1),(s.formal_comps||[])[j]||s.comps[j%s.comps.length],j<2?'E':j===9?'A':j<(i<5?6:5)?'M':'H',r,j>=3)));}
module.exports={course,formal,bank:id=>banks.get(id)};
