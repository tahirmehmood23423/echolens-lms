'use strict';
const C=require('../../index'),{Q}=require('../../qdsl');
function build(sid,data,refs){
 const questions=[],bank=[],lessons=[];
 for(const [i,d] of data.entries()){
  const id=sid+'-l'+(i+1),meta=C.competency(sid+'.'+d.comp);
  function make(row,j,formal){const [prompt,correct,a,b,c,explanation]=row.split('|');if(!explanation||[correct,a,b,c].some(x=>!x))throw Error(id+' incomplete card '+j);const n=formal?bank.length:questions.length,rotation=(n*3+1)%4,pairs=[correct,a,b,c];for(let z=0;z<rotation;z++)pairs.unshift(pairs.pop());const difficulty=formal?(n<18?'E':n<50?'M':n<81?'H':'A'):j<3?'E':j<5?'M':'H';const scenario=formal?n%10>=3:j>=3;return {...Q(sid+(formal?'.final':'.practice')+String(n+1).padStart(3,'0'),d.comp,difficulty,scenario?'scenario':'concept',scenario?'Original synthetic operating decision: '+d.title:null,prompt,null,pairs,rotation,explanation,pairs.filter((_,k)=>k!==rotation).map(option=>'“'+option+'” does not satisfy the stated condition. '+explanation)),status:'draft',subtrack:sid,objective:sid+'.'+d.comp};}
  const own=[];for(const [j,row]of d.practice.trim().split('\n').entries()){const q=make(row,j,false);own.push(q);questions.push(q);}for(const [j,row]of d.final.trim().split('\n').entries())bank.push(make(row,j,true));
  lessons.push({id,module:meta.module,title:d.title,version:1,minutes:45,objectives:[{id:sid+'.'+d.comp,text:meta.competency.text}],prerequisites:i?[lessons.at(-1).id]:[],prerequisite_note:i?'Apply the vocabulary and boundary checks from '+lessons.at(-1).title+'.': 'Reuse the canonical prerequisites '+C.subtrack(sid).prereq.join(', ')+'. Check basic file permissions, Python values and exit-status meaning before continuing.',introduction:d.intro,sections:d.sections.map(([heading,...paragraphs])=>({heading,paragraphs})),worked:{lang:'python',problem:d.problem,steps:d.steps,code:d.code,expect:d.expect,explanation:d.limit},mistakes:d.mistakes,takeaways:d.takeaways,references:refs.map(r=>r.id),reuse:[],quiz:own.slice(0,3).map(q=>q.id)});
 }
 if(bank.length!==90)throw Error(sid+' needs 90 cards, got '+bank.length);
 return {course:{id:sid,version:1,state:'draft',language:'en',author:'EchoLens AI-assisted instructional draft',human_review:null,pass_mark:70,checkpoint_items:9,quiz_minutes:12,checkpoint_minutes:20,modules:C.subtrack(sid).modules.map(m=>({id:m.id,title:m.title,lessons:lessons.filter(l=>l.module===m.id).map(l=>l.id)})),lessons,questions,references:refs},bank};
}
const ref=(id,repo,commit,path,title)=>({id,title,url:'https://github.com/'+repo+'/blob/'+commit+'/'+path,source:{repo,commit,path,verification:'Pinned official project documentation; executable fixtures validate only declared local behavior, not live systems.'}});
module.exports={build,ref};
