'use strict';
// Private mechanics only: lessons, examples and assessment cases are authored explicitly.
const C=require('../../index'),{Q}=require('../../qdsl');
const banks=new Map();
function item(id,comp,diff,row,scenario,sid){
 const fields=Array.isArray(row)?row:row.split('|');if(fields.length!==6)throw Error(id+': expected six authored item fields');
 const [prompt,right,...tail]=fields,wrong=tail.slice(0,3),explanation=tail[3],raw=[right,...wrong],shift=Number(id.match(/\d+$/)[0])%4;
 const options=raw.map((_,i)=>raw[(i+shift)%4]),answer=options.indexOf(right);
 return {...Q(id,comp,diff,scenario?'scenario':'concept',scenario?'Original synthetic AI engineering decision case':null,prompt,null,options,answer,explanation,options.filter((_,i)=>i!==answer).map(o=>'“'+o+'” conflicts with this condition: '+explanation)),status:'draft',...(sid?{subtrack:sid,objective:sid+'.'+comp}:{})};
}
function course(id,specs,references){
 const sub=C.subtrack(id),questions=[];
 const lessons=specs.map((s,i)=>{
  const module=sub.modules[Math.floor(i/3)],comps=s.comps||module.objectives.map(o=>o.id.slice(id.length+1)),lid=id+'-'+s.slug;
  const practice=s.practice.map((r,j)=>item(lid+'.p'+(j+1),(s.practiceComps||[])[j]||comps[j%comps.length],['E','M','H'][j%3],r,j>=3,id));questions.push(...practice);
  return {id:lid,module:module.id,version:1,title:s.title,minutes:40,objectives:comps.map(c=>({id:id+'.'+c,text:C.competency(id+'.'+c).competency.text})),prerequisites:i?[id+'-'+specs[i-1].slug]:[],prerequisite_note:i?'Use the preceding lesson vocabulary and verify the assumptions of this example before comparing results.':'Complete canonical prerequisites '+sub.prereq.join(', ')+'. A feature is an observed input; a fitted estimator learns parameters from the supplied reference sample. Each example states its execution boundary.',introduction:s.intro,sections:s.sections.map(([heading,...paragraphs])=>({heading,paragraphs})),worked:{lang:s.lang||'python-pandas',problem:s.problem,steps:s.steps,code:s.code,expect:s.expect,explanation:s.limit},mistakes:s.mistakes,takeaways:s.takeaways,references:references.map(r=>r.id),reuse:[],quiz:practice.slice(0,3).map(q=>q.id)};
 });
 banks.set(id,specs.flatMap((s,i)=>{const comps=s.comps||sub.modules[Math.floor(i/3)].objectives.map(o=>o.id.slice(id.length+1));return s.formal.map((r,j)=>item(id+'.w4.f'+String(i*10+j+1).padStart(3,'0'),(s.formalComps||[])[j]||comps[j%comps.length],j<2?'E':j===9?'A':j<(i<5?6:5)?'M':'H',r,j>=3));}));
 return {id,version:1,state:'draft',language:'en',author:'EchoLens AI-assisted instructional draft',human_review:null,pass_mark:70,checkpoint_items:8,quiz_minutes:12,checkpoint_minutes:20,lessons,questions,modules:sub.modules.map(m=>({id:m.id,title:m.title,lessons:lessons.filter(l=>l.module===m.id).map(l=>l.id)})),references};
}
module.exports={course,bank:id=>banks.get(id)};
