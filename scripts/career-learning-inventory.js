'use strict';
// Catalogue snapshot from a disposable store. Never opens a production DB.
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const runtime=fs.mkdtempSync(path.join(os.tmpdir(),'echolens-content-inventory-'));
require('dotenv').config=()=>({parsed:{}});
process.env.DATABASE_URL='';process.env.DIRECT_URL='';process.env.DB_PATH=path.join(runtime,'store.json');
const store=require('../store'), {createCareerService}=require('../career/service');
(async()=>{try{
  const svc=createCareerService(store),report=svc.curriculum.learning.inventory(store);
  report.scope='Repository catalogue and canonical curriculum in an isolated store; deployment and production overrides not inspected.';
  report.baseline_commit=require('node:child_process').execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
  report.working_tree_modified=!!require('node:child_process').execFileSync('git',['status','--porcelain'],{encoding:'utf8'}).trim();
  const i=process.argv.indexOf('--output');if(i>=0)fs.writeFileSync(process.argv[i+1],JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify({scope:report.scope,official_free:report.reconciliation.official_free.length,public_free:report.reconciliation.public_free.length,trending_subset:report.reconciliation.trending_subset.length,...report.totals},null,2));
  await store.pendingPersist();
}finally{fs.rmSync(runtime,{recursive:true,force:true});}})().catch(e=>{console.error(e.message);process.exitCode=1;});
