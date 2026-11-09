'use strict';
// Private authoring adapter: content and questions remain explicitly authored.
const C=require('../../index'),{Q}=require('../../qdsl');
const COMMIT='42155a0feaca9ba6991942c323cbe9fb7278be3c';
const misconceptions={
 'Universal correctness':'An observation over selected inputs does not quantify every possible input, history or environment.',
 'Every future failure':'The observed execution cannot enumerate failures in future conditions that were not exercised.',
 'Perfect requirement quality':'A test can expose a mismatch while the expected rule itself still needs domain review.',
 'Guaranteed zero defects':'A finite process or test result does not prove that no undiscovered defects remain.',
 'Universal defect absence':'Finite observations of a nontrivial system cannot justify a universal absence claim.',
 'Only zero past defects':'No reported failures may reflect missing exposure or testing rather than low inherent risk.',
 'Automatic new coverage':'Rerunning existing cases does not automatically exercise a newly introduced condition.',
 'Guaranteed compatibility':'Compatibility needs evidence about the actual changed contract and relevant dependent components.',
 'Real database mapping':'A repository substitute returns authored values without exercising the real schema or field mapping.',
 'Actual delivery is proven':'A local substitute or provider acceptance response does not establish eventual delivery to a recipient.',
 'Concurrency is guaranteed':'Sequential local fixtures do not establish atomic behavior under simultaneous workers.',
 'Universal atomicity':'Atomicity across real concurrent actors needs an appropriate transactional implementation and evidence.',
 'Guaranteed provider behavior':'A fake service can omit real protocol, timing and error behavior.',
 'Guaranteed deduplication':'Deduplication must be enforced at the actual repeated-operation boundary, not inferred from one success.',
 'Automatic privacy approval':'An environment name or test result does not authorize disclosure of real personal information.',
 'A proven zero error rate':'With no observed requests, the denominator supplies no error-rate estimate under actual use.',
 'Zero future uncertainty':'Testing can reduce selected uncertainties while leaving other conditions and future changes unobserved.',
 'Only the aggregate percent':'An aggregate can hide a severe unresolved failure whose impact dominates many low-risk passes.',
 'Only test count':'Case quantity does not establish that important risks, oracles and boundaries were meaningfully covered.',
 'Only the test count':'Counting cases does not explain their relevance, sensitivity or residual evidence gaps.',
 'Only the pass percentage':'A passing percentage can obscure a material high-impact failure and cannot alone decide readiness.',
 'Editing its result silently':'Changing the recorded result without evidence destroys accountability instead of resolving the criterion.',
 'Every external effect':'Restoring application bytes does not unsend messages or automatically reverse external financial operations.',
 'Rollback unsends it':'An external recipient may already have received the message; code rollback does not recall it.',
 'Automatic data reversal':'A binary rollback does not automatically transform or restore data written by a changed schema.',
 'Titles prove competence':'An organizational label does not establish the expertise, authority or evidence for a particular decision.',
 'Testing is unnecessary':'A small usable increment still needs evidence appropriate to its behavior and risks.',
 'Acceptance criteria':'Criteria guide acceptance decisions, but naming them alone does not establish that a particular scope was exercised.'
};
function question(sid,id,comp,diff,row,scenario){
 const [prompt,correct,...tail]=row.split('|'),wrong=tail.slice(0,3),explanation=tail[3];
 if(!prompt||!correct||wrong.length!==3||!explanation)throw Error('Incomplete authored question '+id);
 const rotation=Number(id.match(/\d+$/)[0])%4,choices=[correct,...wrong],options=[...choices.slice(rotation),...choices.slice(0,rotation)];
 const why=options.filter(x=>x!==correct).map(x=>misconceptions[x]||'“'+x+'” does not establish the required outcome here. '+explanation);
 return {...Q(id,comp,diff,scenario?'scenario':'concept',scenario?'original synthetic software-delivery case':null,prompt,null,options,options.indexOf(correct),explanation,why),status:'draft',subtrack:sid,objective:sid+'.'+comp};
}
function build(sid,units){
 const sub=C.subtrack(sid),questions=[],formal=[],lessons=[];
 units.forEach((u,i)=>{
  const comp=sid+'.'+u.comp,module=C.competency(comp).module,id=sid+'-'+u.slug;
  const p=u.practice.trim().split('\n').filter(Boolean),f=u.final.trim().split('\n').filter(Boolean);
  if(p.length<6||f.length!==10)throw Error(id+' requires >=6 practice and ten formal questions');
  const pool=p.map((row,j)=>question(sid,id+'.q'+(j+1),u.comp,j<3?'E':j<5?'M':'H',row,j>=2));questions.push(...pool);
  f.forEach((row,j)=>{const mix=i<4?['E','E','M','M','M','H','H','H','H','A']:['E','E','M','M','M','M','H','H','H','A'];formal.push(question(sid,sid+'.final'+String(i*10+j+1).padStart(3,'0'),u.comp,mix[j],row,j>=3));});
  lessons.push({id,module,title:u.title,version:1,minutes:40,objectives:[{id:comp,text:C.competency(comp).competency.text}],prerequisites:i?[lessons[i-1].id]:[],prerequisite_note:i?'Review the preceding lesson’s terms and example assumptions before extending the evidence.':sub.prereq.length?'Canonical prerequisites: '+sub.prereq.map(x=>C.subtrack(x).title).join(', ')+'. This course adds its own scoped examples rather than duplicating prior progress.':'No prior course is required. An example is a small observable model; it does not prove a real product meets every requirement.',introduction:u.intro,sections:u.sections.map(([heading,...paragraphs])=>({heading,paragraphs})),worked:{lang:'python',problem:u.problem,steps:u.steps,code:u.code,expect:u.expect,explanation:u.limit},mistakes:u.mistakes,takeaways:u.takeaways,references:['unittest','itertools'],reuse:[],quiz:pool.slice(0,3).map(x=>x.id)});
 });
 return {course:{id:sid,version:1,state:'draft',language:'en',author:'EchoLens AI-assisted instructional draft',human_review:null,pass_mark:70,checkpoint_items:9,quiz_minutes:12,checkpoint_minutes:20,modules:sub.modules.map(m=>({id:m.id,title:m.title,lessons:lessons.filter(l=>l.module===m.id).map(l=>l.id)})),lessons,questions,references:[['unittest','unittest'],['itertools','itertools']].map(([id,name])=>({id,title:'Python 3.13 '+name+' documentation (executable fixture mechanics)',url:'https://github.com/python/cpython/blob/'+COMMIT+'/Doc/library/'+name+'.rst',source:{repo:'python/cpython',commit:COMMIT,path:'Doc/library/'+name+'.rst',verification:'Pinned official documentation for fixture assertions/enumeration; not authority for every SDLC or testing-process judgment.'}}))},bank:formal};
}
module.exports={build};
