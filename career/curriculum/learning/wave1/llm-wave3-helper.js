'use strict';
// Private authoring helper: no network, credentials, persistence or publication.
const C=require('../../index'),{Q}=require('../../qdsl');
const PIN='2d5b1a9b6e706a732b03048d701c7086fda5f010';
function reference(id,path,title){return {id,title,url:'https://github.com/openai/openai-cookbook/blob/'+PIN+'/'+path,source:{repo:'openai/openai-cookbook',commit:PIN,path,verification:'Official source materialized and read at pinned HEAD. Historical API examples inform concepts; current capabilities, prices and SDK contracts require separate verification. All course fixtures are offline synthetic Python.'}};}
function item(sid,d,row,n,formal,li,ci){
 const [practice,prompt,correct,...rest]=row,wrong=rest.slice(0,3),explanation=rest[3];
 const answer=(n*3+li)%4,options=[correct,...wrong];for(let j=0;j<answer;j++)options.unshift(options.pop());
 const diff=formal?(ci<2?'E':ci<5||(ci===5&&li<5)?'M':ci===9?'A':'H'):['E','M','H','E','M','H','M','H'][ci];
 return {...Q(sid+(formal?'.f':'.p')+String(n+1).padStart(3,'0'),d.comp,diff,formal&&ci>=3?'scenario':'concept',formal&&ci>=3?'Original synthetic application engineering case':null,formal?prompt:practice,null,options,answer,explanation,options.filter((_,i)=>i!==answer).map(o=>'“'+o+'” does not satisfy the stated requirement. '+explanation)),subtrack:sid,objective:sid+'.'+d.comp,status:'draft'};
}
function build(sid,data,refs){
 const lessons=[],questions=[],bank=[];
 for(const [i,d]of data.entries()){
  const module=sid+'.'+d.comp.split('.')[0],obj=C.competency(sid+'.'+d.comp).competency,id=sid+'-'+d.slug;
  const practice=d.cards.slice(0,8).map((r,j)=>item(sid,d,r,questions.length+j,false,i,j));questions.push(...practice);
  bank.push(...d.cards.map((r,j)=>item(sid,d,r,bank.length+j,true,i,j)));
  lessons.push({id,module,version:1,title:d.title,minutes:45,objectives:[{id:sid+'.'+d.comp,text:obj.text}],prerequisites:i?[lessons.at(-1).id]:[],prerequisite_note:i?'Review '+lessons.at(-1).title+' and its worked example before applying this lesson.':'Complete canonical prerequisites '+C.subtrack(sid).prereq.join(', ')+'. Review request context, evidence provenance and application authorization; those shared resources retain their canonical identities.',introduction:d.intro,sections:d.sections.map((p,j)=>({heading:d.headings[j],paragraphs:p})),worked:{lang:'python',problem:d.problem,code:d.code,expect:d.expect,steps:d.steps,explanation:d.limit},mistakes:d.mistakes,takeaways:d.takeaways,references:refs.map(r=>r.id),reuse:[],quiz:practice.slice(0,3).map(q=>q.id)});
 }
 const course={id:sid,version:1,state:'draft',language:'en',author:'EchoLens AI-assisted instructional draft',human_review:null,pass_mark:70,checkpoint_items:8,quiz_minutes:12,checkpoint_minutes:24,modules:C.subtrack(sid).modules.map(m=>({id:m.id,title:m.title,lessons:lessons.filter(l=>l.module===m.id).map(l=>l.id)})),lessons,questions,references:refs};
 // Bank stays private and absent from serialized course/lesson payloads.
 Object.defineProperty(course,'draftBank',{value:bank,enumerable:false});return course;
}
module.exports={build,reference};
