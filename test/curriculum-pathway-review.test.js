'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),cp=require('node:child_process'),crypto=require('node:crypto');
test('private role review includes exactly nine required packages without approving them',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'role-review-'));try{
 cp.execFileSync(process.execPath,[path.join(__dirname,'../scripts/build-career-pathway-review.cjs'),'junior-backend-developer',root],{stdio:'pipe'});
 const r=JSON.parse(fs.readFileSync(path.join(root,'pathway-inventory.json')));assert.equal(r.totals.required,9);assert.equal(r.totals.lessons,99);assert.equal(r.totals.verified_worked_examples,99);assert.deepEqual(r.missing,[]);assert.equal(r.human_approved,false);assert.equal(r.published,false);assert.equal(fs.readdirSync(root).filter(f=>f.endsWith('-review.html')).length,9);
 assert.ok(r.courses.every(c=>c.objective_coverage.every(o=>o.lessons.length&&o.formative_items.length&&o.comprehensive_items.length)));assert.ok(fs.readFileSync(path.join(root,'REVIEW-CHECKLIST.md'),'utf8').includes('exact-version approval'));
 }finally{fs.rmSync(root,{recursive:true,force:true});}
 const publicTarget=path.join(__dirname,'../public/review-'+crypto.randomUUID());assert.throws(()=>cp.execFileSync(process.execPath,[path.join(__dirname,'../scripts/build-career-pathway-review.cjs'),'junior-backend-developer',publicTarget],{stdio:'pipe'}));assert.equal(fs.existsSync(publicTarget),false);
});
test('official HTTPS evidence rejects changed bytes, substituted hosts and path escapes',()=>{
 const {verifyHttpSnapshot}=require('../scripts/lib/curriculum-sources.cjs'),root=fs.mkdtempSync(path.join(os.tmpdir(),'source-snapshot-'));try{
 for(const [repo,host] of [['aws/official-documentation-snapshots','docs.aws.amazon.com'],['gnu/official-documentation-snapshots','www.gnu.org'],['google/official-documentation-snapshots','sre.google']]){
 const body='<html><title>Synthetic source fixture</title></html>',sha256=crypto.createHash('sha256').update(body).digest('hex'),url='https://'+host+'/example/fixture.html',fetched_at='2026-11-09T00:00:00Z';
 fs.writeFileSync(path.join(root,'source.html'),body);fs.writeFileSync(path.join(root,'manifest.json'),JSON.stringify({'source.html':{url,sha256,fetched_at,http_status:200}}));const ref={id:'fixture',source:{url,sha256,fetched_at,path:'source.html'}};
 assert.equal(verifyHttpSnapshot(root,ref,repo).sha256,sha256);
 assert.throws(()=>verifyHttpSnapshot(root,{...ref,source:{...ref.source,url:'https://'+host+'.attacker.invalid/source'}},repo),/Unsupported/);
 assert.throws(()=>verifyHttpSnapshot(root,{...ref,source:{...ref.source,path:'../escape'}},repo),/Invalid/);
 fs.writeFileSync(path.join(root,'source.html'),'changed');assert.throws(()=>verifyHttpSnapshot(root,ref,repo),/mismatch/);
 }
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
