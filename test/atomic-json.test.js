'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {atomicJson}=require('../atomic-json');
test('transient Windows rename locks retry without deleting the existing store',()=>{let tries=0,unlinks=0;const io={writeFileSync(){},openSync(){return 1;},fsyncSync(){},closeSync(){},renameSync(){if(++tries<3)throw Object.assign(Error('locked'),{code:'EPERM'});},unlinkSync(){unlinks++;}};atomicJson('synthetic.json',{}, {io,sleep(){}});assert.equal(tries,3);assert.equal(unlinks,0);});
test('permanent write failure preserves the previous store and propagates failure',()=>{let removed;const io={writeFileSync(){throw Object.assign(Error('full'),{code:'ENOSPC'});},unlinkSync(path){removed=path;}};assert.throws(()=>atomicJson('synthetic.json',{}, {io}),/full/);assert.notEqual(removed,'synthetic.json');});
