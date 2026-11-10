'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),{signals}=require('../scripts/inspect-career-content.cjs');
test('review triage identifies shallow scenario/cosmetic cues without labelling them approved',()=>{
 const c={id:'sql-example',lessons:[{id:'a',introduction:'Short.',sections:[{paragraphs:['One sentence.']}]}],questions:[{id:'q',prompt:'Which answer fits?',scenario:'business',code:null,options:['A','Font color','C','D'],why:['fails this requirement','Specific reason','Another reason']}]};const found=signals(c,[]);assert.ok(found.some(f=>f.kind==='distractor_relevance_review'));assert.ok(found.some(f=>f.kind==='scenario_depth_review'));assert.ok(found.some(f=>f.kind==='misconception_review'));assert.ok(found.some(f=>f.kind==='depth_review'));assert.ok(!signals({...c,id:'css-example'},[]).some(f=>f.kind==='distractor_relevance_review'));
});
