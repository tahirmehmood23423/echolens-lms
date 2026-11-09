'use strict';
// Internal authoring checks. Never imports the application store or reads .env.
const crypto=require('node:crypto'),fs=require('node:fs'),path=require('node:path');
const C=require('../../career/curriculum');
const {validateBank}=require('../../career/curriculum/qdsl');
const {verifyCode}=require('../../career/curriculum/verify');
const digest=x=>crypto.createHash('sha256').update(JSON.stringify(x)).digest('hex');
const norm=s=>String(s).toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();
const words=s=>new Set(norm(s).split(' ').filter(w=>w.length>2));
const similarity=(a,b)=>{let n=0;for(const w of a)if(b.has(w))n++;return n/(a.size+b.size-n||1);};
function plan(authored,{limit=20,preferred=[]}={}){
 const done=new Set(authored),priority=['backend-testing-reliability','git-collaboration',...preferred];
 const rank=id=>priority.includes(id)?priority.indexOf(id):100;
 const candidates=C.SUBTRACKS.filter(s=>!done.has(s.id)).sort((a,b)=>rank(a.id)-rank(b.id)||C.usage(b.id).roles.length-C.usage(a.id).roles.length||a.id.localeCompare(b.id));
 const selected=[],visiting=new Set();
 function visit(id){if(done.has(id)||selected.includes(id)||selected.length>=limit)return;if(visiting.has(id))throw Error('Canonical prerequisite cycle at '+id);visiting.add(id);for(const p of C.subtrack(id).prereq)visit(p);visiting.delete(id);if(selected.length<limit&&C.subtrack(id).prereq.every(p=>done.has(p)||selected.includes(p)))selected.push(id);}
 for(const s of candidates)visit(s.id);
 return {selected:selected.map(id=>({id,prerequisites:C.subtrack(id).prereq,usage:C.usage(id),objectives:C.subtrack(id).modules.flatMap(m=>m.objectives)})),remaining:C.SUBTRACKS.filter(s=>!done.has(s.id)&&!selected.includes(s.id)).map(s=>s.id)};
}
function proseDuplicates(courses){
 const exact=new Map(),items=[],errors=[],warnings=[];
 for(const c of courses)for(const l of c.lessons||[])for(const [i,text] of [l.introduction,...(l.sections||[]).flatMap(s=>s.paragraphs||[])].entries()){
  if(typeof text!=='string'||text.length<100)continue;
  const id=c.id+'/'+l.id+':'+i,key=norm(text),seen=exact.get(key);
  if(seen)errors.push('Repeated instructional paragraph: '+seen+' / '+id);else exact.set(key,id);
  items.push({id,tokens:words(text)});
 }
 // Check substantive paragraphs, not common terminology or prerequisite labels.
 for(let i=0;i<items.length;i++)for(let j=i+1;j<items.length;j++)if(items[i].tokens.size>=25&&items[j].tokens.size>=25&&similarity(items[i].tokens,items[j].tokens)>.9)warnings.push('Near-duplicate teaching: '+items[i].id+' / '+items[j].id);
 return {errors,warnings};
}
function questionDuplicates(courses,banks){
 const seen=new Map(),errors=[],warnings=[];
 for(const q of [...courses.flatMap(c=>c.questions),...banks.flat()]){
  // Literal-only variants do not constitute new engineering questions.
  const signature=norm(q.prompt).replace(/\b\d+(?:\.\d+)?\b/g,'#')+'|'+String(q.code||'').replace(/\r\n/g,'\n').trim(),prior=seen.get(signature);
  if(prior)errors.push('Repeated question or numeric-only variant: '+prior+' / '+q.id);else seen.set(signature,q.id);
 }
 return {errors,warnings};
}
function checkCourse(course,bank,{validate,execute=false,previous=null,historicalBank=false}={}){
 const errors=[],warnings=[],fingerprint=digest({course,bank});
 // A checkpoint can avoid repeated code execution only for exactly matching content.
 const reuse=!!(previous?.fingerprint===fingerprint&&previous?.execution_passed&&previous?.errors?.length===0);
 const result=validate(course,{execute:execute&&!reuse});errors.push(...result.errors);warnings.push(...result.warnings);
 const bankResult=validateBank(bank,C.subtrack(course.id));errors.push(...bankResult.errors);warnings.push(...bankResult.warnings);
 if(bank.length<90)errors.push('Comprehensive bank requires at least 90 distinct items.');
 for(const difficulty of ['easy','medium','hard','advanced'])if(!bank.some(q=>q.difficulty===difficulty))errors.push('Missing comprehensive difficulty: '+difficulty);
 for(const [difficulty,min] of Object.entries({easy:12,medium:22,hard:20,advanced:6}))if(bank.filter(q=>q.difficulty===difficulty).length<min)errors.push('Insufficient comprehensive '+difficulty+' alternatives for two fresh 30-item forms.');
 for(const objective of C.subtrack(course.id).modules.flatMap(m=>m.objectives))if(bank.filter(q=>course.id+'.'+q.comp===objective.id).length<4)errors.push('Insufficient comprehensive alternatives for objective '+objective.id);
 if(bank.filter(q=>q.scenario).length/Math.max(1,bank.length)<.7)errors.push('Comprehensive bank needs at least 70% scenario items.');
 const positions=[0,1,2,3].map(i=>bank.filter(q=>q.answer===i).length);
 if(positions.some(n=>n/bank.length>.4||n/bank.length<.1)){
  if(historicalBank)warnings.push('Historical bank retains its original key positions; verify server-shuffled delivery instead of rewriting published item keys.');
  else errors.push('New comprehensive answer-position distribution is too predictable.');
 }
 const ids=new Set(),prompts=new Set();for(const q of [...course.questions,...bank]){if(ids.has(q.id))errors.push('Repeated assessment id: '+q.id);ids.add(q.id);const prompt=norm(q.prompt);if(prompts.has(prompt))errors.push('Repeated formative/formal prompt: '+q.id);prompts.add(prompt);}
 const lessons=new Set(course.lessons.map(l=>l.id)),prerequisites=C.subtrack(course.id)?.prereq||[];
 const examples=reuse?previous.examples:[...result.examples];
 if(execute&&!reuse)for(const q of bank)if(q.code&&q.expect!=null){const result=verifyCode(q);examples.push({id:q.id,code_hash:digest({code:q.code,expect:q.expect,lang:q.lang}),...result});if(!result.ran||!result.ok)errors.push(q.id+': formal code verification failed: '+(result.problem||'unsupported verifier'));}
 return {id:course.id,fingerprint,course_hash:digest(course),bank_hash:digest(bank),prerequisites,lessons:lessons.size,modules:course.modules.length,formative:course.questions.length,comprehensive:bank.length,objectives:result.covered,errors,warnings,examples,execution_passed:!!(execute||reuse)&&!errors.length&&examples.length>=course.lessons.length&&examples.every(e=>e.ok),resumed_exact_checkpoint:reuse,human_review:'pending',human_approved:false,published:false};
}
function safeOutput(file,publicRoot=path.resolve(__dirname,'../../public')){
 const target=path.resolve(file);let ancestor=path.dirname(target);while(!fs.existsSync(ancestor))ancestor=path.dirname(ancestor);
 const real=fs.existsSync(target)?fs.realpathSync(target):path.join(fs.realpathSync(ancestor),path.relative(ancestor,target)),publicReal=fs.realpathSync(publicRoot);
 if(real===publicReal||real.startsWith(publicReal+path.sep))throw Error('Authoring artifacts must remain outside public assets.');
 return target;
}
function writeCheckpoint(file,value){const target=safeOutput(file);fs.mkdirSync(path.dirname(target),{recursive:true});const temp=target+'.tmp';fs.writeFileSync(temp,JSON.stringify(value,null,2)+'\n');fs.renameSync(temp,target);}
module.exports={plan,checkCourse,proseDuplicates,questionDuplicates,writeCheckpoint,safeOutput,digest};
