'use strict';
// Authoring adapter only; prose, fixtures and assessment rows are authored per lesson.
const C=require('../../index'),{Q}=require('../../qdsl');
const banks=new Map();
function item(id,comp,difficulty,line,scenario,sid){
 const row=Array.isArray(line)?line:line.split('|');
 if(row.length!==6&&row.length!==9)throw Error(id+': author six or nine fields');
 const [prompt,key,a,b,c,explanation,wa,wb,wc]=row;
 const raw=[key,a,b,c],shift=Number(id.match(/\d+$/)[0])%4,options=raw.map((_,i)=>raw[(i+shift)%4]);
 const answer=options.indexOf(key),notes={[a]:wa,[b]:wb,[c]:wc};
 return {...Q(id,comp,difficulty,scenario?'scenario':'concept',scenario?'Original synthetic data-platform decision case':null,prompt,null,options,answer,explanation,options.filter((_,i)=>i!==answer).map(o=>notes[o]||`${o}: ${explanation}`)),status:'draft',...(sid?{subtrack:sid,objective:sid+'.'+comp}:{})};
}
function course(id,specs,references){
 const sub=C.subtrack(id),questions=[];
 if(specs.length!==sub.modules.length*3)throw Error(id+': three focused lessons per module required');
 const lessons=specs.map((s,i)=>{const mod=sub.modules[Math.floor(i/3)],comps=mod.objectives.map(o=>o.id.slice(id.length+1)),lid=id+'-'+s.slug;
 const rows=s.practice.trim().split('\n'),qs=rows.map((r,j)=>item(lid+'.p'+(j+1),comps[((i%3)*rows.length+j)%comps.length],j<3?'E':j===rows.length-1?'H':'M',r,j>=3,id));questions.push(...qs);
 return {id:lid,module:mod.id,version:1,title:s.title,minutes:40,objectives:mod.objectives.map(o=>({id:o.id,text:o.text})),prerequisites:i?[id+'-'+specs[i-1].slug]:[],prerequisite_note:i?'Revisit '+specs[i-1].title+' and trace its stated invariant before extending the design.':'Required canonical foundations: '+sub.prereq.join(', ')+'. Review SQL keys and joins, Python collections and the difference between a simulated decision and a live platform operation.',introduction:s.intro,sections:s.sections.map(([heading,...paragraphs])=>({heading,paragraphs})),worked:{lang:s.lang||'python',problem:s.problem,steps:s.steps,code:s.code,expect:s.expect,explanation:s.limit},mistakes:s.mistakes,takeaways:s.takeaways,references:references.map(r=>r.id),reuse:[],quiz:qs.slice(0,3).map(q=>q.id)};
 });
 banks.set(id,specs.flatMap((s,i)=>{const mod=sub.modules[Math.floor(i/3)],comps=mod.objectives.map(o=>o.id.slice(id.length+1));return s.formal.trim().split('\n').map((r,j)=>item(id+'.w4.f'+String(i*10+j+1).padStart(3,'0'),comps[((i%3)*10+j)%comps.length],j<2?'E':j===9?'A':j<(i<5?6:5)?'M':'H',r,j>=3));}));
 return {id,version:1,state:'draft',language:'en',author:'EchoLens AI-assisted instructional draft',human_review:null,pass_mark:70,checkpoint_items:9,quiz_minutes:12,checkpoint_minutes:20,modules:sub.modules.map(m=>({id:m.id,title:m.title,lessons:lessons.filter(l=>l.module===m.id).map(l=>l.id)})),lessons,questions,references};
}
module.exports={course,bank:id=>banks.get(id)};
