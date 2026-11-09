'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {verify}=require('../scripts/verify-database-design.cjs');
const {verifyCode}=require('../career/curriculum/verify');
test('database fixtures execute in real isolated PostgreSQL/WASM, including negative constraint and type probes',async()=>{
 const report=await verify();assert.equal(report.passed,true,JSON.stringify(report.cases.filter(c=>!c.passed)));assert.equal(report.cases.length,12);assert.equal(report.cases.reduce((n,c)=>n+c.probes.length,0),29);assert.match(report.version,/PostgreSQL 17/);assert.equal(report.native_multi_connection_test,false);assert.equal(report.human_approved,false);assert.equal(report.published,false);
});
test('the existing SQLite verifier enables actual foreign-key enforcement instead of silently accepting invalid children',()=>{
 const code='CREATE TABLE parents(id INTEGER PRIMARY KEY);\nCREATE TABLE children(id INTEGER PRIMARY KEY,parent_id INTEGER REFERENCES parents(id));\nINSERT INTO children VALUES(1,99);\nSELECT COUNT(*) FROM children;';
 const result=verifyCode({code,lang:'sql',expect:'ERROR: sqlite3.IntegrityError: FOREIGN KEY constraint failed'});assert.equal(result.ran,true);assert.equal(result.ok,true,JSON.stringify(result));
});
