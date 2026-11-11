'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),{seed}=require('../scripts/seed-career-verification.cjs');
// Actual committed Wave3 evidence; this test does not execute or invent examples.
const passed=require('../docs/career/phase3/mass-scale-wave3/checkpoint.json');
test('verification cache imports exact passed batch evidence without approval',()=>{
 const result=seed({courses:[],human_approved:false,published:false},passed);assert.equal(result.courses.length,26);assert.equal(result.human_approved,false);assert.equal(result.published,false);assert.ok(result.courses.every(c=>c.examples.every(e=>e.ran&&e.ok)));assert.equal(seed(result,passed).courses.length,26);
});
test('verification cache rejects stale, failed, missing and partial batch evidence',()=>{
 for(const mutate of [r=>r.courses[0].fingerprint='stale',r=>r.courses[0].examples[0].ok=false,r=>r.courses[0].examples.pop(),r=>r.courses[0].examples[0].output='forged wrong output',r=>r.completed.pop(),r=>r.courses[0].execution_passed='true',r=>delete r.duplication]){const r=structuredClone(passed);mutate(r);assert.throws(()=>seed({courses:[]},r));}
 assert.throws(()=>seed({courses:[],human_approved:true},passed),/approval/);
});
