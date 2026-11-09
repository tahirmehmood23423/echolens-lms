'use strict';
// Internal authoring mechanics only. All prose, cases and question rows are authored separately.
const C=require('../../index'),{Q}=require('../../qdsl');
function item(id,comp,row,difficulty,scenario,sid){
 const [prompt,correct,a,b,c,explanation,wa,wb,wc]=row;
 if(row.length!==9)throw Error(id+': expected explicitly authored prompt/key/distractors/explanations');
 const shift=Number(id.match(/(\d+)$/)?.[1]||0)%4,options=[correct,a,b,c];
 const rotated=[...options.slice(shift),...options.slice(0,shift)],answer=(4-shift)%4;
 const why=rotated.filter((_,i)=>i!==answer).map(o=>({[a]:wa,[b]:wb,[c]:wc})[o]);
 const q=Q(id,comp,difficulty,scenario?'scenario':'concept',scenario?'original web engineering case':null,prompt,null,rotated,answer,explanation,why);
 return {...q,subtrack:sid,objective:sid+'.'+comp,status:'draft'};
}
function course(sid,units,references){
 let question=0;
 const lessons=units.map((u,i)=>{
 const objective=C.competency(sid+'.'+u.comp);if(!objective)throw Error('Unknown objective '+u.comp);
 const qs=u.quiz.map((r,j)=>item(u.id+'.q'+(j+1),u.comp,r,j<3?'E':j===7?'H':'M',j>=3,sid));
 question+=qs.length;
 return {...u,version:1,module:objective.module,minutes:40,objectives:[{id:sid+'.'+u.comp,text:objective.competency.text}],prerequisites:i?[units[i-1].id]:[],prerequisite_note:u.prerequisite_note||'Use the earlier lesson vocabulary before tracing this case. Canonical prerequisites are shown in the roadmap; the worked Python model is an offline reasoning aid, not a browser implementation.',references:references.map(r=>r.id),reuse:[],quiz:qs.slice(0,3).map(q=>q.id),_questions:qs};
 });
 const questions=lessons.flatMap(l=>l._questions);for(const l of lessons)delete l._questions;
 return {id:sid,version:1,state:'draft',language:'en',author:'EchoLens AI-assisted instructional draft',human_review:null,pass_mark:70,checkpoint_items:8,quiz_minutes:12,checkpoint_minutes:20,modules:C.subtrack(sid).modules.map(m=>({id:m.id,title:m.title,lessons:lessons.filter(l=>l.module===m.id).map(l=>l.id)})),lessons,questions,references};
}
function bank(sid,groups){let n=0;return groups.flatMap((g,li)=>g.rows.map((r,j)=>{n++;const d=j<2?'E':j<5||j===5&&li<5?'M':j===9?'A':'H';return item(sid+'.f'+String(n).padStart(3,'0'),g.comp,r,d,j>=3,sid);}));}
const section=(heading,...paragraphs)=>({heading,paragraphs});
const worked=(code,expect,problem,steps,explanation)=>({lang:'python',code,expect,problem,steps,explanation});
module.exports={course,bank,section,worked};
