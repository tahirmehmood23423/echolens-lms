'use strict';
// Mechanics only: all instructional prose, problems and question rows are authored explicitly.
const C=require('../../index'),{Q}=require('../../qdsl');
function question(id,comp,r,index,sid,formative=false){
 const [difficulty,prompt,right,w1,w2,w3,explanation,why]=r,source=[right,w1,w2,w3],shift=index%4;
 const options=source.map((_,i)=>source[(i+shift)%4]),answer=(4-shift)%4;
 const notes=why.split('|'),wrong=source.slice(1).map((option,i)=>[option,notes[i]]);
 return {...Q(id,comp,difficulty,index%10<7?'scenario':'concept',index%10<7?'Original synthetic engineering case':null,prompt,null,options,answer,explanation,options.filter((_,i)=>i!==answer).map(o=>wrong.find(x=>x[0]===o)[1])),...(formative?{subtrack:sid,objective:sid+'.'+comp}:{}),status:'draft'};
}
function course(sid,specs,refs){
 let qi=0;const lessons=specs.map((s,i)=>({id:s.id,module:C.competency(sid+'.'+s.comp).module,version:1,title:s.title,minutes:40,objectives:[{id:sid+'.'+s.comp,text:C.competency(sid+'.'+s.comp).competency.text}],prerequisites:i?[specs[i-1].id]:[],prerequisite_note:s.before,introduction:s.intro,sections:s.sections.map(([heading,a,b])=>({heading,paragraphs:[a,b]})),worked:{lang:'python',problem:s.problem,steps:s.steps,code:s.code,expect:s.expect,explanation:s.result},mistakes:s.mistakes,takeaways:s.takeaways,references:s.refs,reuse:[],quiz:s.q.slice(0,3).map((_,j)=>s.id+'.q'+(j+1))}));
 const questions=specs.flatMap(s=>s.q.map((r,j)=>question(s.id+'.q'+(j+1),s.comp,r,qi++,sid,true)));
 return {id:sid,version:1,state:'draft',language:'en',author:'EchoLens AI-assisted instructional draft',human_review:null,pass_mark:70,checkpoint_items:9,quiz_minutes:12,checkpoint_minutes:20,modules:C.subtrack(sid).modules.map(m=>({id:m.id,title:m.title,lessons:lessons.filter(l=>l.module===m.id).map(l=>l.id)})),lessons,questions,references:refs};
}
function bank(sid,groups){let i=0;return groups.flatMap(([comp,rows])=>rows.map(r=>question(sid+'.w1.'+String(++i).padStart(3,'0'),comp,r,i,sid)));}
const PY='42155a0feaca9ba6991942c323cbe9fb7278be3c';
function pythonRefs(map){return Object.entries(map).map(([id,path])=>({id,title:'Python 3.13 documentation: '+path.split('/').at(-1).replace('.rst',''),url:'https://github.com/python/cpython/blob/'+PY+'/'+path,source:{repo:'python/cpython',commit:PY,path,verification:'Pinned official source; original lessons and synthetic offline examples. Human review remains pending.'}}));}
module.exports={course,bank,pythonRefs};
