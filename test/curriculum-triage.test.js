'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),{signals}=require('../scripts/inspect-career-content.cjs');
test('review triage identifies shallow scenario/cosmetic cues without labelling them approved',()=>{
 const c={id:'sql-example',lessons:[{id:'a',introduction:'Short.',sections:[{paragraphs:['One sentence.']}]}],questions:[{id:'q',prompt:'Which answer fits?',scenario:'business',code:null,options:['A','Font color','C','D'],why:['fails this requirement','Specific reason','Another reason']}]};const found=signals(c,[]);assert.ok(found.some(f=>f.kind==='distractor_relevance_review'));assert.ok(found.some(f=>f.kind==='scenario_depth_review'));assert.ok(found.some(f=>f.kind==='misconception_review'));assert.ok(found.some(f=>f.kind==='depth_review'));assert.ok(!signals({...c,id:'css-example'},[]).some(f=>f.kind==='distractor_relevance_review'));
});
test('unavailable source reporting requires opt-in and never produces verified evidence',()=>{
 const {unavailableReference}=require('../scripts/lib/curriculum-sources.cjs');const ref={id:'manual',url:'https://www.gnu.org/software/bash/manual/bash.html',source:{kind:'unavailable-reference',retrieval_status:503,checked_at:'2026-11-10',verification:'Actual retrieval unavailable; expert source review required.'}};
 assert.throws(()=>unavailableReference(ref,'scripting-automation',false),/opt-in/);
 const r=unavailableReference(ref,'scripting-automation',true);assert.equal(r.verified,false);assert.equal(r.human_source_review_required,true);
 assert.throws(()=>unavailableReference({...ref,source:{...ref.source,retrieval_status:200}},'scripting-automation',true),/evidence/);
});
