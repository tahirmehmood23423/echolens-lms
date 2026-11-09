'use strict';
// Content and progress helpers for the existing curriculum/assessment service.
const crypto = require('node:crypto');
const C = require('../index');
const { BANKS: COMPREHENSIVE_BANKS } = require('../questions');
const { validateQuestion } = require('../qdsl');
const { verifyCode } = require('../verify');
const VERIFIED = require('./verification.json');
const DATABASE_VERIFIED=require('./database-verification.json'),DATABASE_CASES=require('./database-cases');
const BUILTIN = { 'python-fundamentals': require('./python'), 'programming-foundations': require('./foundations'), 'sql-fundamentals': require('./sql'), 'http-web-architecture': require('./http'), 'rest-api-design': require('./rest'), 'database-design': require('./database') };
const clone = x => x == null ? x : JSON.parse(JSON.stringify(x));
const hash = x => crypto.createHash('sha256').update(JSON.stringify(x)).digest('hex');
const text = x => typeof x === 'string' && x.trim().length > 0;
function databaseEvidence(course){
 if(course?.id!=='database-design')return null;
 const checked=(course.lessons||[]).filter(l=>{const fixture=DATABASE_CASES.find(c=>c.id===l.id),e=DATABASE_VERIFIED.cases.find(c=>c.id===l.id);return fixture&&e?.passed&&e.case_hash===hash(fixture)&&e.code_hash===hash({code:l.worked?.code,expect:l.worked?.expect,lang:l.worked?.lang||'python'});});
 return {engine:DATABASE_VERIFIED.engine,version:DATABASE_VERIFIED.version,verified:checked.length,total:course.lessons?.length||0,native_multi_connection_test:false,storage_crash_test:false};
}
const idOK = x => typeof x === 'string' && /^[a-z0-9][a-z0-9.-]{0,120}$/.test(x);
const https = x => { try { const u=new URL(x); return u.protocol==='https:' && !u.username && !u.password; } catch { return false; } };
function validate(course, { execute = false, reuseVerified = false } = {}) {
  const errors=[], warnings=[], examples=[];
  const fail = m => errors.push(m), sub=C.subtrack(course?.id);
  if (!sub) return {errors:['Unknown canonical subtrack.'],warnings,examples};
  if (!Array.isArray(course.lessons)||!Array.isArray(course.modules)||!Array.isArray(course.questions)||!Array.isArray(course.references)) return {errors:['Lessons, modules, questions and references must be arrays.'],warnings,examples};
  if ([...course.lessons,...course.modules,...course.questions,...course.references].some(x=>!x||typeof x!=='object'||Array.isArray(x))) return {errors:['Content records must be objects.'],warnings,examples};
  if (!Number.isInteger(course.version)||course.version<1) fail('Version must be a positive integer.');
  if (!Number.isFinite(course.pass_mark)||course.pass_mark<50||course.pass_mark>100) fail('Checkpoint pass mark must be between 50 and 100.');
  if (!Number.isInteger(course.checkpoint_items)||course.checkpoint_items<8||course.checkpoint_items>12) fail('Module checkpoints need 8 to 12 questions.');
  for (const k of ['quiz_minutes','checkpoint_minutes']) if (!Number.isInteger(course[k])||course[k]<1||course[k]>120) fail(k+' must be 1 to 120 minutes.');
  const seen=new Set(), objectives=new Set(sub.modules.flatMap(m=>m.objectives.map(o=>o.id))), covered=new Set();
  const refs=new Map(course.references.map(r=>[r.id,r])), lessonMap=new Map(course.lessons.map(l=>[l.id,l])), qs=new Map(course.questions.map(q=>[q.id,q]));
  if(refs.size!==course.references.length) fail('Duplicate reference IDs.');
  if(qs.size!==course.questions.length) fail('Duplicate question IDs.');
  for(const r of course.references) if(!idOK(r.id)||!text(r.title)||!https(r.url)) fail('Invalid HTTPS reference: '+r.id);
  const codeCheck=(name,q)=>{
    if(!execute)return;
    const codeHash=hash({code:q.code,expect:q.expect,lang:q.lang});
    const cached=reuseVerified&&VERIFIED.courses.find(c=>c.id===course.id)?.examples.find(e=>e.id===name&&e.code_hash===codeHash&&e.ok);
    const result=cached?{ran:true,ok:true,output:cached.output,verification:'Exact code/expected-output hash in the repository verification artifact'}:verifyCode(q);
    examples.push({id:name,code_hash:codeHash,...result});
    if(!result.ran||!result.ok)fail(name+': '+(result.problem||'Example requires a supported isolated verifier before publication.'));
  };
  for(const l of course.lessons) {
    if(!idOK(l.id)||seen.has(l.id))fail('Invalid or duplicate lesson ID: '+l.id);seen.add(l.id);
    if(!text(l.title)||!text(l.introduction)||!text(l.prerequisite_note)||!Number.isInteger(l.version)||l.version<1)fail(l.id+': title, introduction, prerequisites and version required.');
    if(!sub.modules.some(m=>m.id===l.module))fail(l.id+': unknown canonical module.');
    const lessonObjectives=Array.isArray(l.objectives)?l.objectives.filter(o=>o&&typeof o==='object'):[];
    if(!Array.isArray(l.objectives)||!l.objectives.length||lessonObjectives.length!==l.objectives.length)fail(l.id+': measurable objectives required.');
    for(const o of lessonObjectives) {if(!o||!objectives.has(o.id)||C.competency(o.id)?.module!==l.module||!text(o.text))fail(l.id+': invalid objective '+o.id);else covered.add(o.id);}
    if(!Array.isArray(l.prerequisites)||l.prerequisites.some(p=>!lessonMap.has(p)||p===l.id))fail(l.id+': prerequisite lesson missing.');
    if(!Array.isArray(l.sections)||l.sections.length<2)fail(l.id+': progressive theory sections required.');
    for(const section of Array.isArray(l.sections)?l.sections:[]) {
      if(!section||typeof section!=='object'){fail(l.id+': theory sections must be objects.');continue;}
      if(!text(section.heading)||!Array.isArray(section.paragraphs)||!section.paragraphs.length||section.paragraphs.some(p=>!text(p)))fail(l.id+': incomplete theory section.');
      if(section.table&&(!Array.isArray(section.table.headers)||!Array.isArray(section.table.rows)||section.table.rows.some(row=>!Array.isArray(row)||row.length!==section.table.headers.length)))fail(l.id+': malformed table.');
      if(section.snippet){
        if(!['json','http','sql'].includes(section.snippet.lang)||!text(section.snippet.code)||section.snippet.code.length>30000)fail(l.id+': invalid JSON/HTTP/SQL snippet.');
        else if(section.snippet.lang==='json'){try{JSON.parse(section.snippet.code);}catch{fail(l.id+': invalid JSON example.');}}
      }
    }
    const w=l.worked;
    if(!w||!text(w.problem)||!Array.isArray(w.steps)||w.steps.length<3||w.steps.some(s=>!text(s))||!text(w.code)||w.expect==null||!text(w.explanation))fail(l.id+': complete worked problem, steps, code, expected output and explanation required.');
    else codeCheck(l.id,{code:w.code,expect:w.expect,lang:w.lang||'python'});
    for(const field of ['mistakes','takeaways']) if(!Array.isArray(l[field])||l[field].length<2||l[field].some(v=>!text(v)))fail(l.id+': '+field+' required.');
    if(l.video&&(!text(l.video.title)||!https(l.video.url)))fail(l.id+': optional video needs a title and a valid HTTPS URL; human review must check availability.');
    if(!Array.isArray(l.reuse)||l.reuse.some(r=>!r||!idOK(r.track)||!Number.isInteger(r.level)||r.level<1))fail(l.id+': invalid existing-course practice reference.');
    if(!Array.isArray(l.references)||!l.references.length||l.references.some(id=>!refs.has(id)))fail(l.id+': reference does not resolve.');
    if(!Array.isArray(l.quiz)||l.quiz.length<3||l.quiz.length>5||new Set(l.quiz).size!==l.quiz.length)fail(l.id+': lesson needs 3 to 5 distinct MCQs.');
    for(const id of Array.isArray(l.quiz)?l.quiz:[]) {const q=qs.get(id);if(!q||!lessonObjectives.some(o=>o.id===q.objective))fail(l.id+': quiz objective mismatch '+id);}
  }
  const signatures=new Set(), formal=COMPREHENSIVE_BANKS[course.id]?.questions||[];
  for(const q of course.questions) {
    const signature=String(q.prompt||'').trim()+'|'+String(q.code||'').trim();
    if(signatures.has(signature))fail(q.id+': duplicated formative question.');signatures.add(signature);
    if(formal.some(f=>f.id===q.id||(String(f.prompt).trim()+'|'+String(f.code||'').trim())===signature))fail(q.id+': comprehensive questions must not be reused in immediate-feedback practice.');
    if(!text(q.prompt)||!text(q.explanation)||!Array.isArray(q.options)||q.options.some(o=>typeof o!=='string'))fail(q.id+': MCQ prompt, explanation and options must be text.');
    const v=validateQuestion(q,sub);errors.push(...v.errors.map(e=>q.id+': '+e));warnings.push(...v.warnings.map(e=>q.id+': '+e));
    if(q.subtrack!==course.id||q.objective!==course.id+'.'+q.comp||!covered.has(q.objective))fail(q.id+': question does not map to instructional content.');
    if(q.code&&q.expect!=null)codeCheck(q.id,q);
  }
  for(const o of objectives)if(!covered.has(o))fail('Missing instructional coverage: '+o);
  const modIDs=new Set(), assigned=[];
  for(const m of course.modules) {
    if(modIDs.has(m.id)||!sub.modules.some(x=>x.id===m.id))fail('Duplicate or unknown module: '+m.id);modIDs.add(m.id);
    if(!Array.isArray(m.lessons)||m.lessons.length<3||m.lessons.length>6)fail(m.id+': expected 3 to 6 focused lessons.');
    for(const id of Array.isArray(m.lessons)?m.lessons:[]) {assigned.push(id);if(lessonMap.get(id)?.module!==m.id)fail(m.id+': lesson does not resolve in its module: '+id);}
    const modComps=sub.modules.find(x=>x.id===m.id)?.objectives||[];
    for(const [i,comp] of modComps.entries()){const perAttempt=Math.floor(course.checkpoint_items/modComps.length)+(i<course.checkpoint_items%modComps.length?1:0);if(course.questions.filter(q=>q.objective===comp.id).length<Math.max(4,2*perAttempt))fail(m.id+': insufficient alternative MCQs for two covered forms: '+comp.id);}
    if(modComps.length>course.checkpoint_items)fail(m.id+': checkpoint cannot cover every objective.');
    for(const difficulty of ['easy','medium','hard'])if(!course.questions.some(q=>C.competency(q?.objective)?.module===m.id&&q.difficulty===difficulty))fail(m.id+': checkpoint needs '+difficulty+' questions.');
    if(course.questions.filter(q=>C.competency(q?.objective)?.module===m.id).length<course.checkpoint_items)fail(m.id+': checkpoint bank too small.');
  }
  for(const m of sub.modules)if(!modIDs.has(m.id))fail('Canonical module missing: '+m.id);
  if(new Set(assigned).size!==assigned.length||course.lessons.some(l=>!assigned.includes(l.id)))fail('Every lesson must occur in exactly one module.');
  const order=course.modules.flatMap(m=>Array.isArray(m.lessons)?m.lessons:[]);
  for(const l of course.lessons)for(const p of Array.isArray(l.prerequisites)?l.prerequisites:[])if(order.indexOf(p)>=order.indexOf(l.id))fail(l.id+': prerequisite is cyclic or out of learning order.');
  if(execute&&course.id==='database-design'&&databaseEvidence(course).verified!==course.lessons.length)fail('Database examples require matching PostgreSQL/WASM verification; update the reviewed fixtures and run verify:career:database before approval.');
  return {errors,warnings,examples,objectives:objectives.size,covered:covered.size,lessons:course.lessons.length,questions:course.questions.length,human_approved:false};
}
function createLearning(core) {
  const {settings,save,career,writeCareer,isLearner,iso,audit,subtrack,assessmentStatus,begin,canStart,stOf,writeSt,shuffle,rng}=core;
  const records=()=>settings().career_learning||{};
  const draft=id=>clone(records()[id]?.draft||BUILTIN[id]||null);
  const published=id=>records()[id]?.published||null;
  const ordered=c=>c.modules.flatMap(m=>m.lessons.map(id=>c.lessons.find(l=>l.id===id)));
  const lessonHref=(sid,id)=>'#lesson/'+sid+'/'+id;
  function adminView(id) {return {draft:draft(id),published_version:published(id)?.version||null,review:records()[id]?.review||null,versions:(records()[id]?.revisions||[]).map(c=>({version:c.version,state:c.state})),validation:draft(id)?validate(draft(id)):null};}
  function updateDraft(id,body,actor) {
    if(!subtrack(id))return {error:'Unknown subtrack.',status:404};
    if(!body||body.id!==id||!Array.isArray(body.lessons)||!Array.isArray(body.modules)||!Array.isArray(body.questions)||!Array.isArray(body.references))return {error:'Provide a canonical course with lessons, modules, questions and references.',status:400};
    if(JSON.stringify(body).length>850000)return {error:'This content batch exceeds the editor size limit.',status:413};
    const before=records()[id]||{}, previous=draft(id), next={...clone(body),id,version:Math.max(previous?.version||0,published(id)?.version||0)+1,state:'draft',human_review:null};
    settings().career_learning={...records(),[id]:{...before,draft:next,review:null,revisions:[...(before.revisions||[]),clone(before.published?.version===previous?.version?before.published:previous)].filter(Boolean)}};save();audit(actor,'career_learning_draft','learning',id,{version:next.version});return adminView(id);
  }
  function transition(id,action,body,actor) {
    const c=draft(id);if(!c)return {error:'No authored content for this subtrack.',status:404};
    const row=records()[id]||{}, v=validate(c,{execute:['approve','publish'].includes(action),reuseVerified:true});
    if(!v.errors.length&&action!=='unpublish')for(const l of c.lessons)for(const r of l.reuse||[]) {const def=core.lookupCourse?.(r.track);if(!def||def.published===false||!def.levels.some(x=>x.no===r.level))v.errors.push(l.id+': existing practice resource is missing or unpublished: '+r.track+'/'+r.level);}
    if(action!=='unpublish'&&v.errors.length)return {error:'Content validation failed: '+v.errors.slice(0,3).join('; '),status:409,validation:v};
    let next={...row,draft:c};
    if(action==='review')next={...next,draft:{...c,state:'in-review'},review:null};
    else if(action==='approve') {
      if(c.state!=='in-review'||body?.attest_human_review!==true||!text(body.notes)||body.notes.trim().length<30)return {error:'An authorized human must review this version and attest to correctness, quiz keys, examples and source references with review notes.',status:409};
      next.review={version:c.version,hash:hash(c),by:actor,at:iso(),notes:body.notes.trim(),human_attestation:true,examples_verified:v.examples.length,example_ids:v.examples.filter(e=>e.ok).map(e=>e.id)};
    } else if(action==='publish') {
      if(!row.review?.human_attestation||row.review.hash!==hash(c))return {error:'This exact content version needs human approval before publication.',status:409};
      if(assessmentStatus(id).state!=='published')return {error:'The mapped comprehensive assessment must be published before this short course is released.',status:409};
      next={...next,published:{...clone(c),state:'published',human_review:clone(row.review)},releases:[...(row.releases||[]),{version:c.version,at:iso(),by:actor,hash:hash(c)}]};
    } else if(action==='unpublish')next={...next,published:null};
    else return {error:'Unknown content action.',status:400};
    settings().career_learning={...records(),[id]:next};save();audit(actor,'career_learning_'+action,'learning',id,{version:c.version});return adminView(id);
  }
  const bodyHash=l=>hash({objectives:l.objectives,prerequisites:l.prerequisites,introduction:l.introduction,sections:l.sections,worked:l.worked,mistakes:l.mistakes,takeaways:l.takeaways});
  function quizHash(c,kind,id) {
    const lesson=c.lessons.find(l=>l.id===id), module=c.modules.find(m=>m.id===id);
    const questions=kind==='lesson'?c.questions.filter(q=>lesson?.quiz.includes(q.id)):c.questions.filter(q=>C.competency(q.objective)?.module===id);
    return hash({kind,id,pass_mark:c.pass_mark,items:kind==='lesson'?lesson?.quiz.length:c.checkpoint_items,objectives:kind==='lesson'?lesson?.objectives:module?.lessons.map(id=>c.lessons.find(l=>l.id===id)?.objectives),questions});
  }
  function wasRead(user,c,l) {
    const versions=career(user).st?.learning?.[c.id]?.versions||{};
    return Object.entries(versions).some(([version,s])=>s.read?.[l.id]&&(s.read[l.id].content_hash? s.read[l.id].content_hash===bodyHash(l):Number(version)===c.version));
  }
  function state(user,c) {return career(user).st?.learning?.[c.id]?.versions?.[c.version]||{};}
  function passed(user,c,key,after=null) {return (career(user).st?.attempts||[]).some(a=>a.key===key&&a.result.outcome==='passed'&&(!after||a.submitted_at>after)&&(a.formative?.content_hash?a.formative.content_hash===quizHash(c,a.formative.kind,a.formative.target):a.formative?.content_version===c.version));}
  function progress(user,id) {
    const c=published(id);if(!c)return {available:false,subtrack:id,lessons:[],modules:[],completed:0,total:0,resume:null,mastered_by_assessment:!!user&&core.resultFor(user,id).status==='passed'};
    const versions=user?career(user).st?.learning?.[c.id]?.versions||{}:{}, s=user?(Object.values(versions).sort((a,b)=>String(b.updated_at||'').localeCompare(String(a.updated_at||'')))[0]||{}):{}, ls=ordered(c).map(l=>({id:l.id,title:l.title,module:l.module,href:lessonHref(id,l.id),read:!!user&&wasRead(user,c,l),quiz_passed:!!user&&passed(user,c,'lesson:'+id+':'+l.id),version:l.version}));
    ls.forEach(l=>{l.completed=l.read&&l.quiz_passed;});
    const mods=c.modules.map(m=>({id:m.id,title:m.title,lessons:m.lessons,completed_lessons:m.lessons.filter(id=>ls.find(l=>l.id===id)?.completed).length,checkpoint_passed:!!user&&passed(user,c,'module:'+id+':'+m.id),href:'#learn/'+id}));
    const last=ls.find(l=>l.id===s.last_lesson&&!l.completed)||ls.find(l=>!l.completed), unpassed=mods.find(m=>!m.checkpoint_passed&&m.completed_lessons===m.lessons.length);
    return {available:true,subtrack:id,title:subtrack(id).title,version:c.version,lessons:ls,modules:mods,completed:ls.filter(l=>l.completed).length,total:ls.length,
      resume:unpassed?{title:unpassed.title+' checkpoint',href:'#learn/'+id,module:unpassed.id}:last?{title:last.title,href:last.href,at:s.updated_at||null}:null,
      started:!!s.last_lesson,mastered_by_assessment:!!user&&core.resultFor(user,id).status==='passed',learned:ls.every(l=>l.completed)&&mods.every(m=>m.checkpoint_passed)};
  }
  function summary(user,id,preview=false) {
    const c=preview?draft(id):published(id), s=subtrack(id);if(!s)return null;
    if(c&&preview&&validate(c).errors.length)return {id,title:s.title,available:false,state:'draft_invalid',modules:[],validation:validate(c),progress:progress(user,id)};
    if(!c)return {id,title:s.title,available:false,state:'preparation',modules:[],progress:progress(user,id)};
    return {id,title:s.title,available:!preview,state:preview?c.state:'published',version:c.version,review:c.human_review?{version:c.human_review.version,at:c.human_review.at,human_approved:true}:null,pass_mark:c.pass_mark,checkpoint_items:c.checkpoint_items,
      modules:c.modules.map(m=>({...m,lessons:m.lessons.map(id=>{const l=c.lessons.find(x=>x.id===id);return {id,title:l.title,objectives:l.objectives,href:(preview?'#lesson-preview/':'#lesson/')+c.id+'/'+id};})})),progress:progress(user,id)};
  }
  function lesson(user,sid,id,preview=false) {
    const c=preview?draft(sid):published(sid);if(!c||preview&&validate(c).errors.length)return null;
    const l=c.lessons.find(l=>l.id===id);if(!l)return null;
    const list=ordered(c), index=list.findIndex(l=>l.id===id), mod=c.modules.find(m=>m.id===l.module), base=preview?'#lesson-preview/':'#lesson/';
    return { id:l.id,title:l.title,version:l.version,objectives:clone(l.objectives),prerequisites:clone(l.prerequisites),prerequisite_note:l.prerequisite_note,video:l.video?{title:l.video.title,url:l.video.url}:null,introduction:l.introduction,sections:l.sections.map(s=>({heading:s.heading,paragraphs:s.paragraphs,...(s.table?{table:s.table}:{}),...(s.diagram?{diagram:s.diagram}:{}),...(s.snippet?{snippet:{lang:s.snippet.lang,code:s.snippet.code}}:{})})),worked:clone(l.worked),mistakes:l.mistakes,takeaways:l.takeaways,reuse:clone(l?.reuse||[]),minutes:l.minutes,course:{id:sid,title:subtrack(sid).title,prerequisites:subtrack(sid).prereq.map(id=>({id,title:subtrack(id).title})),version:c.version,state:preview?c.state:'published'},
      references:l.references.map(id=>c.references.find(r=>r.id===id)),quiz_items:l.quiz.length,pass_mark:c.pass_mark,
      previous:index?base+sid+'/'+list[index-1].id:null,next:index+1<list.length?base+sid+'/'+list[index+1].id:null,
      module:{id:mod.id,title:mod.title,lessons:mod.lessons.map(id=>({id,title:c.lessons.find(l=>l.id===id).title,href:base+sid+'/'+id}))},
      progress:progress(user,sid),preview };
  }
  function visit(user,sid,id,read=false,expected=null) {
    if(!isLearner(user))return {error:'Sign in with a learner account.',status:403};
    if(expected!=null&&String(expected)!==String(user.id))return {error:'Your account changed. Reload before saving.',status:409};
    const c=published(sid);if(!c?.lessons.some(l=>l.id===id))return {error:'Published lesson not found.',status:404};
    const st=stOf(user), current=state(user,c), versions=st.learning?.[sid]?.versions||{};
    const next={...current,last_lesson:id,updated_at:iso(),read:{...(current.read||{}),...(read?{[id]:{at:iso(),content_hash:bodyHash(c.lessons.find(l=>l.id===id))}}:{})}};
    writeSt(user,{...st,learning:{...(st.learning||{}),[sid]:{versions:{...versions,[c.version]:next}}}});return {ok:true,progress:progress(user,sid)};
  }
  function start(user,sid,kind,id) {
    const c=published(sid);if(!c)return {error:'Learning content is in preparation.',status:404};
    if(!['lesson','module'].includes(kind))return {error:'Unknown learning quiz type.',status:400};
    const key=kind+':'+sid+':'+id, block=canStart(user,key,{formative:true});if(block)return block;
    let pool, n, title;
    if(kind==='lesson') {const l=c.lessons.find(l=>l.id===id);if(!l)return {error:'Lesson not found.',status:404};pool=c.questions.filter(q=>l.quiz.includes(q.id));n=pool.length;title=l.title+' · lesson practice';}
    else {const m=c.modules.find(m=>m.id===id);if(!m)return {error:'Module not found.',status:404};const p=progress(user,sid);if(m.lessons.some(id=>!p.lessons.find(l=>l.id===id)?.completed))return {error:'Read the module lessons and pass their quizzes before this checkpoint.',status:409};pool=c.questions.filter(q=>C.competency(q?.objective)?.module===id);n=c.checkpoint_items;title=m.title+' · module checkpoint';}
    const seen=new Set((stOf(user).attempts||[]).filter(a=>a.key===key).flatMap(a=>a.items.map(i=>i.id)));
    let form=pool;
    if(kind==='module') {
      const objectives=subtrack(sid).modules.find(m=>m.id===id).objectives;
      const perGroup=Object.fromEntries(objectives.map((o,i)=>[o.id,Math.floor(n/objectives.length)+(i<n%objectives.length?1:0)]));
      const unseen=pool.filter(q=>!seen.has(q.id));
      const candidates=unseen.length>=n&&objectives.every(o=>unseen.filter(q=>q.objective===o.id).length>=perGroup[o.id])?unseen:pool;
      const mix=Object.fromEntries(['easy','medium','hard','advanced'].map(d=>[d,100*candidates.filter(q=>q.difficulty===d).length/candidates.length]));
      form=core.assemble(candidates.map(q=>({...q,compKey:q.objective,group:q.objective})),{n,mix,scenarioShare:0,seen,seed:crypto.randomInt(1,2**31),comps:objectives.map(o=>({key:o.id,critical:o.critical})),criticalMin:1,perGroup});
      if(form.length!==n||['easy','medium','hard'].some(d=>!form.some(q=>q.difficulty===d)))return {error:'This checkpoint bank cannot currently supply its required difficulty coverage.',status:409};
    }
    return begin(user,{key,title,minutes:kind==='lesson'?c.quiz_minutes:c.checkpoint_minutes,form,assessment_version:c.version,
      formative:{kind,subtrack:sid,target:id,content_version:c.version,content_hash:quizHash(c,kind,id),pass_mark:c.pass_mark}});
  }
  function recommendations(ids) {
    const wanted=new Set(ids), out=[];
    for(const sid of Object.keys({...BUILTIN,...records()})) {const c=published(sid);if(!c)continue;for(const l of ordered(c))if(l.objectives.some(o=>wanted.has(o.id)))out.push({id:l.id,title:l.title,subtrack:sid,module:l.module,href:lessonHref(sid,l.id),checkpoint:'#learn/'+sid});}
    return out;
  }
  function required(user,sid) {
    const c=published(sid);if(!c||core.resultFor(user,sid).status==='passed')return [];
    const last=[...(stOf(user).attempts||[])].reverse().find(a=>a.key==='subtrack:'+sid);
    if(!last||!last.learning_context||last.result.outcome==='passed')return [];
    const missed=[...new Set([...last.result.unassessed,...last.result.critical_gaps,...Object.entries(last.result.competencies).filter(([,v])=>v.score!=null&&v.score<last.result.critical_min).map(([id])=>id)])];
    const modules=new Set(missed.map(id=>C.competency(id)?.module));
    return c.modules.filter(m=>modules.has(m.id)&&!passed(user,c,'module:'+sid+':'+m.id,last.submitted_at)).map(m=>({id:m.id,title:m.title,href:'#learn/'+sid}));
  }
  function dashboard(user,ids) {ids=[...new Set([...ids,...Object.keys(user?career(user).st?.learning||{}:{})])];const rows=ids.map(id=>progress(user,id)), available=rows.filter(p=>p.available);return {courses:available,missing:rows.filter(p=>!p.available).map(p=>p.subtrack),completed:available.reduce((n,p)=>n+p.completed,0),total:available.reduce((n,p)=>n+p.total,0),resume:available.filter(p=>p.started||required(user,p.subtrack).length).map(p=>p.resume&&({...p.resume,subtrack:p.subtrack})).filter(Boolean).sort((a,b)=>String(b.at||'').localeCompare(String(a.at||'')))[0]||null};}
  function inventory(store) {
    const trackDefs=store.Quests.tracks({includeUnpublished:true}).map(t=>store.Quests.trackDef(t.key));
    const official=store.officialCatalogue().filter(c=>Number(c.price_pkr)===0);
    const publicFree=store.publicCatalogue().filter(c=>Number(c.price_pkr)===0);
    const courses=trackDefs.map(t=>({
      key:t.key,code:t.course_code,title:t.title,definition_free_flag:!!t.free,
      public_free_listing:publicFree.some(c=>c.track_key===t.key),published:t.published!==false,
      modules:[...new Set(t.levels.map(l=>l.module_no??l.week??l.no))].length,
      lessons:t.levels.map(l=>({no:l.no,title:l.title,topic:!!l.topic,
        topic_words:String(l.topic||'').split(/\s+/).filter(Boolean).length,
        video:!!(l.resource_url||l.video_url||l.videos?.length),tasks:l.problems.length,
        mcqs:l.problems.reduce((n,p)=>n+(p.quiz?.questions?.length||0),0)}))
    }));
    const subs=C.SUBTRACKS.map(base=>{
      const s=subtrack(base.id), d=draft(s.id), p=published(s.id), v=d?validate(d):null;
      const checked=VERIFIED.courses.find(c=>c.id===s.id);
      const bank=core.questions(s.id), assessment=assessmentStatus(s.id);
      const exampleCount=(d?.lessons||[]).filter(l=>l?.worked&&checked?.examples.some(e=>e.id===l.id&&e.ok&&e.code_hash===hash({code:l.worked.code,expect:l.worked.expect,lang:l.worked.lang||'python'}))).length;
      const mapping=bank.map(q=>({question:q.id,objective:s.id+'.'+q.comp,
        lessons:(d?.lessons||[]).filter(l=>l?.objectives?.some(o=>o?.id===s.id+'.'+q.comp)).map(l=>({id:l.id,href:p?lessonHref(s.id,l.id):null}))}));
      return {id:s.id,title:s.title,outline_state:s.structure_status,prerequisites:s.prereq,
        curriculum:s.modules,modules:s.modules.length,objectives:s.modules.flatMap(m=>m.objectives).length,
        database_verification:d?databaseEvidence(d):null,lessons:d?.lessons.length||0,quizzes:d?.lessons.filter(l=>l?.quiz?.length>=3).length||0,
        checkpoint_modules:d?.modules.filter(m=>m&&d.questions.filter(q=>C.competency(q?.objective)?.module===m.id).length>=d.checkpoint_items).length||0,
        questions:d?.questions.length||0,verified_lesson_examples:exampleCount,
        validated_formative_mcqs:v&&!v.errors.length?d.questions.length:0,
        comprehensive_questions:bank.length,comprehensive_mapping:mapping,legacy_bank_review:bank.length?{author:COMPREHENSIVE_BANKS[s.id]?.author,reviewed_by:COMPREHENSIVE_BANKS[s.id]?.reviewed_by,human_attestation:'No separate human attestation is supplied by this legacy metadata; do not treat it as approval of new lessons.'}:null,
        validation_errors:v?.errors||[],automated_complete:!!v&&!v.errors.length,
        human_approved:!!p?.human_review?.human_attestation,published:!!p,comprehensive:assessment,
        reused_resources:d?.lessons.flatMap(l=>l?.reuse||[])||[],
        candidate_courses:s.refs.map(key=>({key,exists:trackDefs.some(t=>t.key===key),coverage:'Candidate only; detailed objective mapping still requires review.'})),
        missing:[...(d?(!p?['Human content review and release']:[]):['Written lessons','Lesson MCQs','Module checkpoints','Human content review']),...(assessment.state!=='published'?['Comprehensive assessment review and publication']:[])]};
    });
    const tracks=Object.keys(C.TRACKS).map(id=>{
      const ids=C.trackSubtracks(id), rows=subs.filter(s=>[...ids.core,...ids.variants].includes(s.id));
      return {id,subtracks:rows.length,outlines:rows.filter(s=>s.outline_state==='reviewed').length,
        lessons:rows.reduce((n,s)=>n+s.lessons,0),verified_lesson_examples:rows.reduce((n,s)=>n+s.verified_lesson_examples,0),
        lesson_quizzes:rows.reduce((n,s)=>n+s.quizzes,0),checkpoint_modules:rows.reduce((n,s)=>n+s.checkpoint_modules,0),
        complete_lesson_subtracks:rows.filter(s=>s.automated_complete).length,approved_subtracks:rows.filter(s=>s.human_approved).length,
        comprehensive_subtracks:rows.filter(s=>s.comprehensive.state==='published').length,remaining:rows.filter(s=>!s.published).map(s=>s.id)};
    });
    const roles=core.allRoles().map(r=>{
      const path=core.rolePath(r), final=core.roleFinalStatus(r);
      const missing=path.required.filter(id=>!published(id)||assessmentStatus(id).state!=='published');
      const completion_matrix=path.required.map((id,index)=>{
        const row=subs.find(s=>s.id===id),content=draft(id),review=records()[id]?.review;
        return {order:index+1,id,title:row.title,prerequisites:row.prerequisites,modules:row.modules,lessons:row.lessons,lesson_quizzes:row.quizzes,module_checkpoints:row.checkpoint_modules,practice_mcqs:row.questions,verified_lesson_examples:row.verified_lesson_examples,database_verification:row.database_verification,validation_errors:row.validation_errors,
          comprehensive_questions:row.comprehensive_questions,comprehensive_state:row.comprehensive.state,automated_complete:row.automated_complete,
          human_review:review?.human_attestation?'approved exact draft':content?'pending':'not authored',published:row.published,remaining:row.missing};
      });
      return {id:r.id,title:r.title,track:r.track,required:path.required,optional:path.optional,completion_matrix,missing,final:final.state,complete:!missing.length&&final.state==='published'};
    });
    // Shared prerequisites first; then prioritize subtracks blocking the most roles.
    const explicit=['programming-foundations','python-fundamentals','python-intermediate-oop','js-fundamentals','web-foundations','html-semantic','sql-fundamentals','git-collaboration','practical-data-structures','http-web-architecture','networking-fundamentals','linux-sysadmin','math-for-ai','probability-statistics'];
    const usage=id=>roles.filter(r=>r.required.includes(id)).length;
    const sorted=subs.slice().sort((a,b)=>{
      const rank=id=>explicit.includes(id)?explicit.indexOf(id):100;
      return rank(a.id)-rank(b.id)||usage(b.id)-usage(a.id)||a.id.localeCompare(b.id);
    });
    const queue=[],seen=new Set();
    const visit=id=>{if(seen.has(id))return;seen.add(id);for(const p of subtrack(id).prereq)visit(p);const s=subs.find(s=>s.id===id);if(!s.published)queue.push({id,title:s.title,roles_blocked:usage(id),lessons_authored:s.lessons,comprehensive:s.comprehensive.state,next:s.lessons?(s.comprehensive.state==='published'?'Human content review':'Human content and comprehensive assessment review'):'Author complete lessons, formative bank and checkpoints'});};
    sorted.forEach(s=>visit(s.id));
    const sum=key=>subs.reduce((n,s)=>n+s[key],0);
    return {scope:'Current runtime catalogue; CLI snapshots are not evidence of deployed production data.',
      reconciliation:{official_free:official.map(c=>({code:c.code,title:c.title})),public_free:publicFree.map(c=>({code:c.code,available:c.available,track:c.track_key})),trending_subset:courses.filter(c=>c.code?.startsWith('TT-')).map(c=>c.code)},
      courses,subtracks:subs,tracks,job_roles:roles,prioritized_backlog:queue,
      totals:{subtracks:subs.length,objectives:sum('objectives'),lessons:sum('lessons'),formative_mcqs:sum('questions'),
        validated_formative_mcqs:sum('validated_formative_mcqs'),verified_lesson_examples:sum('verified_lesson_examples'),
        comprehensive_questions:sum('comprehensive_questions'),comprehensive_questions_with_draft_lessons:subs.reduce((n,s)=>n+s.comprehensive_mapping.filter(q=>q.lessons.length).length,0),
        existing_practice_lessons_referenced:new Set(subs.flatMap(s=>s.reused_resources.map(r=>r.track+':'+r.level))).size,
        automated_complete:subs.filter(s=>s.automated_complete).length,human_approved:subs.filter(s=>s.human_approved).length,published:subs.filter(s=>s.published).length,complete_roles:roles.filter(r=>r.complete).length},
      complete_roles:roles.filter(r=>r.complete).map(r=>r.id)};
  }
  return {revision:(id,version)=>(records()[id]?.revisions||[]).find(c=>c.version===Number(version))||null,draft,published,adminView,updateDraft,transition,summary,lesson,progress,visit,start,recommendations,required,dashboard,inventory,validate};
}
module.exports={createLearning,validate,BUILTIN,hash,databaseEvidence};
