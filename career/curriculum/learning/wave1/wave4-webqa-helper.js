'use strict';
// Private authoring mechanics only. Every lesson and question is explicitly authored.
const C=require('../../index'),{Q}=require('../../qdsl');
function question(sid,lid,row,index,formal,lessonIndex,comps){
 const parts=typeof row==='string'?row.split('|'):row;
 if(parts.length!==9)throw Error(lid+': explicit question needs prompt, key, three distractors, explanation and three misconception notes');
 const [prompt,right,a,b,c,explanation,wa,wb,wc]=parts;
 const rotation=index%4,raw=[right,a,b,c],options=raw.map((_,i)=>raw[(i+rotation)%4]),answer=options.indexOf(right),notes=new Map([[a,wa],[b,wb],[c,wc]]);
 const diff=formal?(index%10<2?'E':index%10===9?'A':index%10<(lessonIndex<5?6:5)?'M':'H'):['E','M','H','E','M','H','M','H'][index%8];
 const comp=comps[index%comps.length];
 return {...Q(formal?sid+'.w4.f'+String(index+1).padStart(3,'0'):lid+'.q'+(index+1),comp,diff,formal&&index%10>=3?'scenario':'concept',formal&&index%10>=3?'Original synthetic web/QA engineering case':null,prompt,null,options,answer,explanation,options.filter((_,i)=>i!==answer).map(o=>notes.get(o))),status:'draft',...(formal?{}:{subtrack:sid,objective:sid+'.'+comp})};
}
function build(sid,units,references){
 const s=C.subtrack(sid),questions=[],bank=[];
 const lessons=units.map((u,i)=>{
  const module=s.modules[Math.floor(i/3)],comps=u.comps||module.objectives.map(o=>o.id.slice(sid.length+1)),id=sid+'-'+u.slug;
  const practice=u.practice.map((row,j)=>question(sid,id,row,j,false,i,comps));questions.push(...practice);
  bank.push(...u.formal.map((row,j)=>question(sid,id,row,i*10+j,true,i,comps)));
  return {id,module:module.id,version:1,title:u.title,minutes:40,objectives:comps.map(comp=>({id:sid+'.'+comp,text:C.competency(sid+'.'+comp).competency.text})),prerequisites:i?[sid+'-'+units[i-1].slug]:[],prerequisite_note:u.before||(i?'Review the preceding lesson and trace its fixture before applying '+u.title+'.':'Complete canonical prerequisites '+s.prereq.join(', ')+'. These lessons distinguish executable mechanism fixtures from native browser and infrastructure behavior.'),introduction:u.intro,sections:u.sections.map(([heading,...paragraphs])=>({heading,paragraphs})),worked:{lang:u.lang||'javascript',problem:u.problem,steps:u.steps,code:u.code,expect:u.expect,explanation:u.limit},mistakes:u.mistakes,takeaways:u.takeaways,references:references.map(r=>r.id),reuse:[],quiz:practice.slice(0,3).map(q=>q.id)};
 });
 const course={id:sid,version:1,state:'draft',language:'en',author:'EchoLens AI-assisted instructional draft',human_review:null,pass_mark:70,checkpoint_items:8,quiz_minutes:12,checkpoint_minutes:20,modules:s.modules.map(m=>({id:m.id,title:m.title,lessons:lessons.filter(l=>l.module===m.id).map(l=>l.id)})),lessons,questions,references};
 Object.defineProperty(course,'draftBank',{value:bank,enumerable:false});return course;
}
const PIN='54c711571a37de525377e6f3d3608c3e029b1829';
function playwrightRef(id,name,title){const p='docs/src/'+name;return {id,title,url:'https://github.com/microsoft/playwright/blob/'+PIN+'/'+p,source:{repo:'microsoft/playwright',commit:PIN,path:p,verification:'Official Playwright 1.56.1 release documentation materialized and inspected. Worked JavaScript fixtures explicitly model one mechanism; they do not execute the Playwright browser runner or certify a real product integration. Human educational review remains pending.'}};}
module.exports={build,playwrightRef};
