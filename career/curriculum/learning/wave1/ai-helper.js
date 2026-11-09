'use strict';
// Internal authoring conveniences only; no publication or record mutation.
const C=require('../../index'),{Q}=require('../../qdsl');
const PIN='2d5b1a9b6e706a732b03048d701c7086fda5f010';
const references=[['stream','How_to_stream_completions'],['retry','How_to_handle_rate_limits'],['tokens','How_to_count_tokens_with_tiktoken'],['structure','Structured_Outputs_Intro']].map(([id,name])=>({id,title:'OpenAI Cookbook: '+name.replaceAll('_',' '),url:'https://github.com/openai/openai-cookbook/blob/'+PIN+'/examples/'+name+'.ipynb',source:{repo:'openai/openai-cookbook',commit:PIN,path:'examples/'+name+'.ipynb',verification:'Pinned official source read as historical guidance. Current provider/model capability and API compatibility require separate checking; offline examples make no paid model calls.'}}));
function question(id,comp,diff,row,scenario,subtrack){
 const [prompt,correct,a,b,c,explanation,...notes]=row,raw=[correct,a,b,c],shift=Number(id.match(/\d+$/)?.[0]||0)%4;
 const options=raw.map((_,i)=>raw[(i-shift+4)%4]),answer=options.indexOf(correct);
 const why=options.filter((_,i)=>i!==answer).map(o=>notes[raw.indexOf(o)-1]);
 return {...Q(id,comp,diff,scenario?'scenario':'concept',scenario?'original synthetic AI application':null,prompt,null,options,answer,explanation,why),...(subtrack?{subtrack,objective:subtrack+'.'+comp}:{}),status:'draft'};
}
function course(id,defs,extraRefs=[]){
 let n=0;const questions=[],lessons=[];
 for(const d of defs){const module=id+'.'+d.comp.split('.')[0],lid=id+'-'+d.slug;
 const quiz=d.questions.map((row,i)=>{const q=question(id+'.p'+String(++n).padStart(3,'0'),d.comp,i%4===0?'E':i%4===3?'H':'M',row,i>=3,id);questions.push(q);return q.id;});
 lessons.push({id:lid,module,version:1,title:d.title,minutes:40,objectives:[{id:id+'.'+d.comp,text:C.competency(id+'.'+d.comp).competency.text}],prerequisites:lessons.length?[lessons.at(-1).id]:[],prerequisite_note:d.before,introduction:d.intro,sections:d.sections,worked:{lang:'python',problem:d.problem,code:d.code,expect:d.expect,steps:d.steps,explanation:d.limit},mistakes:d.mistakes,takeaways:d.takeaways,references:d.refs||['stream','retry','tokens','structure'],reuse:[],quiz:quiz.slice(0,3)});
 }
 return {id,version:1,state:'draft',language:'en',author:'EchoLens AI-assisted instructional draft',human_review:null,pass_mark:70,checkpoint_items:8,quiz_minutes:12,checkpoint_minutes:20,modules:C.subtrack(id).modules.map(m=>({id:m.id,title:m.title,lessons:lessons.filter(l=>l.module===m.id).map(l=>l.id)})),lessons,questions,references:[...references,...extraRefs]};
}
function bank(id,groups){let n=0;return groups.flatMap((g,lesson)=>g.rows.map((row,i)=>{const diff=i<2?'E':i<6&&!(lesson<4&&i===5)?'M':i===9?'A':'H';return question(id+'.f'+String(++n).padStart(3,'0'),g.comp,diff,row,i>=3);}));}
const section=(heading,...paragraphs)=>({heading,paragraphs});
module.exports={course,bank,section,references};
