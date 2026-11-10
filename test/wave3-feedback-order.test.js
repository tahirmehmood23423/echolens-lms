'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
for(const id of ['rag-advanced','llm-security-eval','llm-deployment-cost']){
 test(`${id}: feedback follows each displayed wrong choice through four rotations`,()=>{
  const course=require('../career/curriculum/learning/wave1/'+id);
  for(const questions of [course.questions,course.draftBank]){
   const sample=questions.slice(0,4);
   assert.equal(new Set(sample.map(q=>q.answer)).size,4);
   for(const q of sample){
    const wrong=q.options.filter((_,i)=>i!==q.answer);
    assert.equal(q.why.length,wrong.length);
    wrong.forEach((option,i)=>assert.ok(q.why[i].startsWith('“'+option+'” '),`${q.id}: feedback ${i} must explain ${option}`));
   }
  }
 });
}
