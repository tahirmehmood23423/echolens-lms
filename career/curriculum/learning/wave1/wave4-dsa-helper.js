'use strict';
// Private mechanics only. All instructional paragraphs, examples and MCQ rows are authored per course.
const C=require('../../index'),{Q}=require('../../qdsl'),banks=new Map();
function item(id,comp,diff,row,scenario,sid){
 const [prompt,right,a,b,c,explanation]=row.split('|');
 if(!explanation||new Set([right,a,b,c]).size!==4)throw Error(id+': incomplete authored question '+JSON.stringify(row.split('|')));
 const raw=[right,a,b,c],shift=Number(id.match(/\d+$/)[0])%4,options=raw.map((_,i)=>raw[(i+shift)%4]);
 return {...Q(id,comp,diff,scenario?'scenario':'concept',scenario?'Original synthetic algorithm/engineering decision':null,prompt,null,options,options.indexOf(right),explanation,options.filter(o=>o!==right).map(o=>o+': '+explanation)),status:'draft',...(sid?{subtrack:sid,objective:sid+'.'+comp}:{})};
}
function course(id,units,paths=['Doc/tutorial/datastructures.rst']){
 const sub=C.subtrack(id),questions=[];
 if(units.length!==3*sub.modules.length)throw Error(id+': three substantial lessons per module required');
 const lessons=units.map((u,i)=>{
  const m=sub.modules[Math.floor(i/3)],comps=u.comps||m.objectives.map(o=>o.id.slice(id.length+1)),lid=id+'-'+u.slug;
  const qs=u.practice.map((r,j)=>item(lid+'.p'+(j+1),comps[j%comps.length],['E','M','H','M','E','H'][j%6],r,j>=3,id));questions.push(...qs);
  return {id:lid,module:m.id,version:1,title:u.title,minutes:40,objectives:comps.map(c=>({id:id+'.'+c,text:C.competency(id+'.'+c).competency.text})),prerequisites:i?[id+'-'+units[i-1].slug]:[],prerequisite_note:i?'Use the preceding lesson’s invariant and explicitly compare the assumptions before applying this algorithm.':'Complete canonical prerequisites '+sub.prereq.join(', ')+'. These executable Python fixtures count or check operations on synthetic inputs; they are not production benchmarks.',introduction:u.intro,sections:u.sections.map(([heading,...paragraphs])=>({heading,paragraphs})),worked:{lang:u.lang||'python',problem:u.problem,steps:u.steps,code:u.code,expect:u.expect,explanation:u.limit},mistakes:u.mistakes,takeaways:u.takeaways,references:paths.map((_,j)=>'dsa-ref-'+j),reuse:[],quiz:qs.slice(0,3).map(q=>q.id)};
 });
 banks.set(id,units.flatMap((u,i)=>{const cs=u.comps||sub.modules[Math.floor(i/3)].objectives.map(o=>o.id.slice(id.length+1));return u.formal.map((r,j)=>item(id+'.w4.'+(i*10+j+1),cs[j%cs.length],j<2?'E':j===9?'A':j<(i<5?6:5)?'M':'H',r,j>=3));}));
 const pin='42155a0feaca9ba6991942c323cbe9fb7278be3c';
 return {id,version:1,state:'draft',language:'en',author:'EchoLens AI-assisted instructional draft',human_review:null,pass_mark:70,checkpoint_items:8,quiz_minutes:12,checkpoint_minutes:20,modules:sub.modules.map(m=>({id:m.id,title:m.title,lessons:lessons.filter(l=>l.module===m.id).map(l=>l.id)})),lessons,questions,references:paths.map((p,j)=>({id:'dsa-ref-'+j,title:'CPython reference: '+p,url:'https://github.com/python/cpython/blob/'+pin+'/'+p,source:{repo:'python/cpython',commit:pin,path:p,verification:'Official pinned reference supplies Python operation semantics. Mathematical bounds are derived explicitly under each lesson’s cost model; tiny fixtures check results, not asymptotic proofs or production latency.'}}))};
}
module.exports={course,bank:id=>banks.get(id)};
