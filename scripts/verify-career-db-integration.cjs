'use strict';
const {PGlite}=require('@electric-sql/pglite');
const assert=require('node:assert/strict');
const fs=require('node:fs'),crypto=require('node:crypto');
const hash=s=>crypto.createHash('sha256').update(s).digest('hex');
(async()=>{
 const db=new PGlite();let checks=0;const observations=[],executed=[];
 for(const name of ['query','exec']){const original=db[name].bind(db);db[name]=async(sql,...args)=>{executed.push({method:name,sql,args,sha256:hash(JSON.stringify({method:name,sql,args}))});return original(sql,...args);};}
 const eq=(a,b,label)=>{assert.deepEqual(a,b,label);checks++;observations.push(label);};
 const query=async(sql,args)=>(await db.query(sql,args)).rows;
 const version=(await query('SELECT version() AS version'))[0].version;
 await db.exec('CREATE TABLE accounts(id integer PRIMARY KEY,balance integer NOT NULL CHECK(balance>=0));INSERT INTO accounts VALUES(1,100),(2,100)');
 await db.exec('BEGIN;UPDATE accounts SET balance=balance-20 WHERE id=1');
 try{await db.query('INSERT INTO accounts VALUES(2,20)');assert.fail('expected duplicate rejection');}catch(e){eq(e.code,'23505','duplicate key inside transaction rejected');}
 try{await db.query('SELECT 1');assert.fail('expected aborted transaction');}catch(e){eq(e.code,'25P02','failed transaction requires rollback before query');}
 await db.exec('ROLLBACK');eq(await query('SELECT balance FROM accounts ORDER BY id'),[{balance:100},{balance:100}],'rollback restored both local balances');
 await db.exec('CREATE TABLE seats(id integer PRIMARY KEY,available integer CHECK(available>=0));INSERT INTO seats VALUES(1,1)');
 eq((await db.query('UPDATE seats SET available=available-1 WHERE id=1 AND available>0')).affectedRows,1,'first sequential guarded allocation changes one row');
 eq((await db.query('UPDATE seats SET available=available-1 WHERE id=1 AND available>0')).affectedRows,0,'second sequential guarded allocation changes zero rows');
 eq(await query('SELECT available FROM seats'),[{available:0}],'sequential allocation preserves nonnegative seat invariant');
 for(const level of ['READ COMMITTED','REPEATABLE READ','SERIALIZABLE']){
  await db.exec('BEGIN ISOLATION LEVEL '+level);
  eq((await query('SHOW transaction_isolation'))[0].transaction_isolation,level.toLowerCase(),'configured isolation '+level);
  await db.exec('ROLLBACK');
 }
 await db.exec('CREATE TABLE events(tenant integer,created integer,id integer PRIMARY KEY,payload text);INSERT INTO events VALUES(7,90,5,\'a\'),(7,100,3,\'b\'),(7,100,9,\'c\'),(7,110,2,\'d\'),(8,100,20,\'private-other-tenant\');CREATE INDEX events_tenant_created_id ON events(tenant,created,id)');
 eq(await query('SELECT created,id FROM events WHERE tenant=$1 ORDER BY created,id LIMIT 2',[7]),[{created:90,id:5},{created:100,id:3}],'first scoped keyset page with tied timestamps');
 eq(await query('SELECT created,id FROM events WHERE tenant=$1 AND (created,id)>($2,$3) ORDER BY created,id LIMIT 2',[7,100,3]),[{created:100,id:9},{created:110,id:2}],'second scoped keyset page uses stable tuple continuation');
 const plan=await query('EXPLAIN (ANALYZE,FORMAT JSON) SELECT id FROM events WHERE tenant=7 ORDER BY created,id LIMIT 2');
 eq(Array.isArray(plan[0]['QUERY PLAN']),true,'JSON execution-aware read plan exists');
 eq(typeof plan[0]['QUERY PLAN'][0]['Plan']['Actual Rows'],'number','execution-aware plan reports actual rows without timing threshold claim');
 await db.exec("CREATE TABLE students(id integer PRIMARY KEY,name text NOT NULL);INSERT INTO students VALUES(1,'Synthetic Student');ALTER TABLE students ADD COLUMN display_name text;UPDATE students SET display_name=name WHERE display_name IS NULL");
 eq(await query('SELECT name,COALESCE(display_name,name) AS current_name FROM students'),[{name:'Synthetic Student',current_name:'Synthetic Student'}],'additive DDL/backfill preserves old and new read paths');
 await db.exec("UPDATE students SET display_name='Newer Value' WHERE id=1;UPDATE students SET display_name=name WHERE display_name IS NULL");
 eq(await query('SELECT display_name FROM students'),[{display_name:'Newer Value'}],'null-only repeated backfill preserves populated newer value in sequential fixture');
 await db.close();
 console.log(JSON.stringify({course:'db-integration-performance',engine:'PGlite 0.4.3 PostgreSQL WASM, isolated in-memory',version,script_sha256:hash(fs.readFileSync(__filename)),case_count:7,probe_count:checks,checks,observations,executed,course_worked_code_hashes:require('../career/curriculum/learning/wave1/db-integration-performance').lessons.map(l=>({id:l.id,sha256:hash(l.worked.code)})),errors:[],native_multi_connection_test:false,native_multi_connection:false,concurrency_race:false,production_performance:false,cloud_access:false,deployment:false},null,2));
})().catch(e=>{console.error(e);process.exit(1);});
