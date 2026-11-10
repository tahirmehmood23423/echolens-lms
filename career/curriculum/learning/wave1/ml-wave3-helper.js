'use strict';
// Private authoring adapter. Every case, derivation and worked example is authored in its course.
const C=require('../../index'),{Q}=require('../../qdsl');
const banks=new Map(),PIN='646da0f072a8afef6a980aa427a710311e67eb9d';
function item(id,comp,diff,row,scenario,sid){
 const [prompt,right,a,b,c,explanation]=row.split('|'),raw=[right,a,b,c],shift=Number(id.match(/\d+$/)[0])%4,options=raw.map((_,i)=>raw[(i+shift)%4]),answer=options.indexOf(right);
 return {...Q(id,comp,diff,scenario?'scenario':'concept',scenario?'Original synthetic offline ML engineering case':null,prompt,null,options,answer,explanation,options.filter((_,i)=>i!==answer).map(o=>o+': '+explanation)),status:'draft',...(sid?{subtrack:sid,objective:sid+'.'+comp}:{})};
}
function course(id,specs,paths){
 const sub=C.subtrack(id),questions=[];
 const lessons=specs.map((s,i)=>{
  const mod=sub.modules[Math.floor(i/3)],comps=s.comps||mod.objectives.map(o=>o.id.slice(id.length+1)),lid=id+'-'+s.slug;
  const practice=s.practice.map((r,j)=>item(lid+'.p'+(j+1),comps[j%comps.length],['E','M','H'][j%3],r,j>=3,id));questions.push(...practice);
  return {id:lid,module:mod.id,version:1,title:s.title,minutes:40,objectives:comps.map(c=>({id:id+'.'+c,text:C.competency(id+'.'+c).competency.text})),prerequisites:i?[id+'-'+specs[i-1].slug]:[],prerequisite_note:i?'Apply the preceding worked example and its stated assumptions before studying '+s.title+'.':('Complete canonical prerequisites '+sub.prereq.join(', ')+'. Examples import actual scikit-learn 1.8.0 and NumPy 2.3.5 using synthetic in-memory fixtures. A feature is an input available at decision time; a target is the outcome to predict.'),introduction:s.intro,sections:s.sections.map(([heading,...paragraphs])=>({heading,paragraphs})),worked:{lang:'python-pandas',problem:s.problem,steps:s.steps,code:s.code,expect:s.expect,explanation:s.limit},mistakes:s.mistakes,takeaways:s.takeaways,references:paths.map((_,i)=>'sklearn-'+i),reuse:[],quiz:practice.slice(0,3).map(q=>q.id)};
 });
 banks.set(id,specs.flatMap((s,i)=>s.formal.map((r,j)=>item(id+'.f'+(i*10+j+1),(s.comps||sub.modules[Math.floor(i/3)].objectives.map(o=>o.id.slice(id.length+1)))[j%(s.comps||sub.modules[Math.floor(i/3)].objectives).length],j<2?'E':j===9?'A':j<(i<5?6:5)?'M':'H',r,j>=3))));
 return {id,version:1,state:'draft',language:'en',author:'EchoLens AI-assisted instructional draft',human_review:null,pass_mark:70,checkpoint_items:8,quiz_minutes:12,checkpoint_minutes:20,lessons,questions,modules:sub.modules.map(m=>({id:m.id,title:m.title,lessons:lessons.filter(l=>l.module===m.id).map(l=>l.id)})),references:paths.map((p,i)=>({id:'sklearn-'+i,title:'scikit-learn 1.8.0 '+p,url:'https://github.com/scikit-learn/scikit-learn/blob/'+PIN+'/doc/modules/'+p,source:{repo:'scikit-learn/scikit-learn',commit:PIN,path:'doc/modules/'+p,verification:'Official release Git checkout materialized and read. Synthetic examples execute with actual scikit-learn 1.8.0 in the isolated scientific Python profile. API verification and automated checks are not human educational approval.'}}))};
}
module.exports={course,bank:id=>banks.get(id)};
