'use strict';
// Private mechanics: authored rows contain the actual independent cases and answer rationales.
const C=require('../../index'),{Q}=require('../../qdsl');
function item(sid,id,comp,row,i,formal,difficulty){
 const [prompt,right,a,b,c,explanation]=row.split('|');
 if(!explanation||new Set([right,a,b,c]).size!==4)throw Error('Malformed authored row '+id);
 const source=[right,a,b,c],shift=i%4,options=source.map((_,j)=>source[(j+shift)%4]),answer=(4-shift)%4;
 const d=difficulty||(formal?(i<18?'E':i<50?'M':i<81?'H':'A'):(i%4===0?'E':i%4===3?'H':'M'));
 return {...Q(id,comp,d,formal&&i%10>=3?'scenario':'concept',formal&&i%10>=3?'Original synthetic full-stack engineering case':null,prompt,null,options,answer,explanation,options.filter((_,j)=>j!==answer).map(o=>'“'+o+'” does not satisfy this case: '+explanation)),subtrack:sid,objective:sid+'.'+comp,status:'draft'};
}
function build(sid,units,refs){
 let n=0,f=0; const questions=[],formal=[];
 const lessons=units.map((u,i)=>{
 const {module,competency}=C.competency(sid+'.'+u.comp),id=sid+'.l'+String(i+1).padStart(2,'0');
 const practice=u.practice.map((r,j)=>item(sid,id+'.q'+(j+1),u.comp,r,n++,false));questions.push(...practice);
 formal.push(...u.formal.map((r,j)=>item(sid,sid+'.w3.'+String(f+1).padStart(3,'0'),u.comp,r,f++,true,u.difficulties?.[j])));
 return {id,module,version:1,title:u.title,minutes:40,objectives:[{id:sid+'.'+u.comp,text:competency.text}],prerequisites:i?[sid+'.l'+String(i).padStart(2,'0')]:[],prerequisite_note:u.before,introduction:u.intro,sections:u.sections.map(([heading,...paragraphs])=>({heading,paragraphs})),worked:{lang:'javascript',problem:u.problem,steps:u.steps,code:u.code,expect:u.expect,explanation:u.result},mistakes:u.mistakes,takeaways:u.takeaways,references:u.refs||refs.map(r=>r.id),reuse:[],quiz:practice.slice(0,3).map(q=>q.id)};
 });
 return {course:{id:sid,version:1,state:'draft',language:'en',author:'EchoLens AI-assisted instructional draft',human_review:null,pass_mark:70,checkpoint_items:8,quiz_minutes:12,checkpoint_minutes:20,modules:C.subtrack(sid).modules.map(m=>({id:m.id,title:m.title,lessons:lessons.filter(l=>l.module===m.id).map(l=>l.id)})),lessons,questions,references:refs},formal};
}
function ref(id,repo,commit,path,title){return {id,title,url:'https://github.com/'+repo+'/blob/'+commit+'/'+path,source:{repo,commit,path,verification:'Official source pinned to an inspected release revision. Executable offline models teach bounded mechanisms; human educational review pending.'}};}
const NODE='b009466555c360513b8012ce549f716501090ee5',EXPRESS='1faf228935aa0a13111f92c28ee795be64ce3f0f',GIT='683c54c999c301c2cd6f715c411407c413b1d84e';
module.exports={build,ref,NODE,EXPRESS,GIT};
