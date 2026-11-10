'use strict';
// Private review triage only. Signals require expert judgment and never approve content.
const fs=require('node:fs'),C=require('../career/curriculum'),{BUILTIN}=require('../career/curriculum/learning'),{BANKS}=require('../career/curriculum/questions');
const {writeCheckpoint}=require('./lib/curriculum-wave.cjs');
function signals(course,bank){
 const flags=[],web=/css|html|frontend|react|visualization/.test(course.id);
 for(const lesson of course.lessons){const words=[lesson.introduction,...lesson.sections.flatMap(s=>s.paragraphs)].join(' ').split(/\s+/).length;if(words<250)flags.push({kind:'depth_review',lesson:lesson.id,words,note:'Check whether concise teaching supplies sufficient explanation and progression.'});}
 for(const q of [...course.questions,...bank]){
  if(!web&&q.options.some(o=>/font colou?r|terminal theme|username length|button colou?r|screen resolution/i.test(o)))flags.push({kind:'distractor_relevance_review',question:q.id,note:'A cosmetic distractor may be implausible for this domain.'});
  if(q.why.some(w=>/misses the stated distinction|fails this requirement/i.test(w)))flags.push({kind:'misconception_review',question:q.id,note:'Check that each wrong-option explanation identifies its specific misconception.'});
  if(['hard','advanced'].includes(q.difficulty)&&!q.code&&q.prompt.split(/\s+/).length<16)flags.push({kind:'difficulty_review',question:q.id,note:'Short hard/advanced recognition item requires difficulty and constraint-depth review; this heuristic is not a calibration.'});
  if(q.scenario&&q.prompt.split(/\s+/).length<12&&!q.code)flags.push({kind:'scenario_depth_review',question:q.id,note:'Short scenario-tagged stem may test a definition rather than a concrete engineering constraint.'});
 }
 return flags;
}
function main(){const i=process.argv.indexOf('--ids'),o=process.argv.indexOf('--output');if(o<0)throw Error('Provide private --output file.');const ids=i<0?Object.keys(BUILTIN):process.argv[i+1].split(',');const courses=ids.map(id=>{if(!C.subtrack(id))throw Error('Unknown canonical ID');const c=BUILTIN[id]||require('../career/curriculum/learning/wave1/'+id),bank=BANKS[id]?.questions||require('../career/curriculum/questions/wave1/'+id);return {id,flags:signals(c,bank),provisional_difficulties:true,human_review:'pending'};});writeCheckpoint(process.argv[o+1],{scope:'Heuristic SME review triage; flags are not confirmed defects or educational approval.',courses,human_approved:false,published:false});console.log(JSON.stringify({courses:courses.length,signals:courses.reduce((n,c)=>n+c.flags.length,0)}));}
if(require.main===module)main();module.exports={signals};
