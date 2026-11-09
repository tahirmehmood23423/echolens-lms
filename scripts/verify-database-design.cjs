'use strict';
// Reuse the pinned app dependency. Fresh in-memory PostgreSQL/WASM only: this
// script never reads .env, DATABASE_URL, application settings or student records.
const fs=require('node:fs'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {PGlite}=require('@electric-sql/pglite');
const cases=require('../career/curriculum/learning/database-cases');
const hash=x=>crypto.createHash('sha256').update(JSON.stringify(x)).digest('hex');
const format=result=>result.rows.length?result.rows.map(row=>result.fields.map(f=>row[f.name]===null?'NULL':String(row[f.name])).join(', ')).join('; '):'(no rows)';
async function verify(){
 const db=new PGlite();const report={engine:'PostgreSQL via PGlite 0.4.3 (single-process WASM)',native_multi_connection_test:false,storage_crash_test:false,human_approved:false,published:false,cases:[]};
 try{
  await db.waitReady;report.version=(await db.query('SELECT version() AS version')).rows[0].version;
  for(const [index,c] of cases.entries()){
   const schema='lesson_fixture_'+index;
   await db.exec('CREATE SCHEMA '+schema+'; SET search_path TO '+schema+'; SET TIME ZONE \'UTC\'');
   const result={id:c.id,case_hash:hash(c),code_hash:hash({code:c.statements.join(';\n')+';',expect:c.expect,lang:'sql'}),probes:[]};
   try{
    let last;for(const statement of c.statements)last=(await db.exec(statement)).at(-1);
    result.output=format(last);assert.equal(result.output,c.expect,c.id+' worked output');result.worked_passed=true;
    await db.exec('BEGIN');
    for(const probe of c.probes){
     await db.exec('SAVEPOINT probe');let observed=null,queryResult;
     try{queryResult=(await db.exec(probe.sql)).at(-1);}catch(error){observed=error.code||'unknown';}
     if(probe.sqlstate)assert.equal(observed,probe.sqlstate,c.id+': '+probe.label);
     else{assert.equal(observed,null,c.id+': '+probe.label);if(probe.rows)assert.deepEqual(queryResult.rows,probe.rows,c.id+': '+probe.label);}
     result.probes.push({label:probe.label,passed:true,sqlstate:observed,...(probe.rows?{rows:queryResult.rows}:{})});
     await db.exec('ROLLBACK TO SAVEPOINT probe; RELEASE SAVEPOINT probe');
    }
    await db.exec('ROLLBACK');result.passed=true;
   }catch(error){result.passed=false;result.error=error.message;try{await db.exec('ROLLBACK');}catch{}}
   report.cases.push(result);
   await db.exec('SET search_path TO public; DROP SCHEMA '+schema+' CASCADE');
  }
 }finally{await db.close();}
 report.passed=report.cases.length===12&&report.cases.every(c=>c.passed);
 return report;
}
module.exports={verify};
if(require.main===module)verify().then(report=>{
 const pos=process.argv.indexOf('--output');if(pos>=0)fs.writeFileSync(process.argv[pos+1],JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({engine:report.engine,version:report.version,worked_examples:report.cases.filter(c=>c.worked_passed).length,probes:report.cases.reduce((n,c)=>n+c.probes.length,0),passed:report.passed,errors:report.cases.filter(c=>!c.passed),native_multi_connection_test:false,human_approved:false,published:false},null,2));
 if(!report.passed)process.exitCode=1;
}).catch(error=>{console.error(error.message);process.exitCode=1;});
