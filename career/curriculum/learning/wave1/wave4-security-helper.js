'use strict';
// Private mechanics only. Every lesson, misconception and case is authored in its course.
const C=require('../../index'),{Q}=require('../../qdsl');
const banks=new Map(),PIN='121e76561a58a28790fd7fa927236eec8d63ea59';
function item(id,comp,diff,row,scenario,sid){
 const cells=row.split('|');if(cells.length!==6)throw Error(id+': expected six authored fields');
 const [prompt,right,...rest]=cells,explanation=rest.pop(),wrong=rest.map(x=>x.split('~'));
 if(wrong.some(x=>x.length!==2))throw Error(id+': specific misconception note required for each distractor');
 const base=[right,...wrong.map(x=>x[0])],shift=Number(id.match(/\d+$/)[0])%4,options=base.map((_,i)=>base[(i+shift)%4]),answer=options.indexOf(right),why=options.filter((_,i)=>i!==answer).map(o=>wrong.find(x=>x[0]===o)[1]);
 return {...Q(id,comp,diff,scenario?'scenario':'concept',scenario?'Original synthetic defensive security case':null,prompt,null,options,answer,explanation,why),status:'draft',...(sid?{subtrack:sid,objective:sid+'.'+comp}:{})};
}
function course(id,specs,files){
 const canonical=C.subtrack(id),questions=[];const lessons=specs.map((s,i)=>{
 const mod=canonical.modules[Math.floor(i/3)],comps=s.comps||mod.objectives.map(o=>o.id.slice(id.length+1));
 const qs=s.practice.map((r,j)=>item(s.id+'.q'+(j+1),comps[j%comps.length],['E','M','H'][j%3],r,j>=3,id));questions.push(...qs);
 return {id:s.id,module:mod.id,version:1,title:s.title,minutes:40,objectives:comps.map(c=>({id:id+'.'+c,text:C.competency(id+'.'+c).competency.text})),prerequisites:i?[specs[i-1].id]:[],prerequisite_note:i?'Trace the preceding lesson’s decision and stated assumptions before extending the defensive model.':'Complete the canonical prerequisites: '+canonical.prereq.join(', ')+'. Examples are synthetic offline fixtures; they do not inspect other systems.',introduction:s.intro,sections:s.sections.map(([heading,...paragraphs])=>({heading,paragraphs})),worked:{lang:'python',problem:s.problem,steps:s.steps,code:s.code,expect:s.expect,explanation:s.limit},mistakes:s.mistakes,takeaways:s.takeaways,references:files.map((_,i)=>id+'-ref'+i),reuse:[],quiz:qs.slice(0,3).map(q=>q.id)};
 });
 const formal=specs.flatMap((s,i)=>{const comps=s.comps||canonical.modules[Math.floor(i/3)].objectives.map(o=>o.id.slice(id.length+1));return s.formal.map((r,j)=>item(id+'.f'+String(i*10+j+1).padStart(3,'0'),comps[j%comps.length],j<2?'E':j===9?'A':j<(i<5?6:5)?'M':'H',r,j>=3));});banks.set(id,formal);
 return {id,version:1,state:'draft',language:'en',author:'EchoLens AI-assisted instructional draft',human_review:null,pass_mark:70,checkpoint_items:8,quiz_minutes:12,checkpoint_minutes:20,modules:canonical.modules.map(m=>({id:m.id,title:m.title,lessons:lessons.filter(l=>l.module===m.id).map(l=>l.id)})),lessons,questions,references:files.map((p,i)=>({id:id+'-ref'+i,title:'OWASP Cheat Sheet: '+p.replace(/^cheatsheets\//,'').replace(/_/g,' ').replace(/\.md$/,''),url:'https://github.com/OWASP/CheatSheetSeries/blob/'+PIN+'/'+p,source:{repo:'OWASP/CheatSheetSeries',commit:PIN,path:p,verification:'Official pinned source inspected. Offline examples verify the stated decision or arithmetic only; human educational review and production control validation remain pending.'}}))};
}
module.exports={course,bank:id=>banks.get(id)};
