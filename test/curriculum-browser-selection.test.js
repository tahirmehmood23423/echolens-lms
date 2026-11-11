'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),{selectCourses}=require('../scripts/lib/curriculum-browser-selection.cjs');
test('browser batches preserve accepted prerequisite order without expanding their scope',()=>{
 assert.deepEqual(selectCourses(['base','child','next'],'next,child'),['child','next']);assert.deepEqual(selectCourses(['base','child']),['base','child']);
 for(const input of ['base,base','base,missing','','../public','base, child'])assert.throws(()=>selectCourses(['base','child'],input),/accepted packages/);
 assert.throws(()=>selectCourses(['base','base']),/inventory/);
});
