'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {createAttempts,completion}=require('../learning-attempts');
const {createGradingWorker}=require('../grading-worker');
function setup(){let id=0;const data={open_attempts:[],open_submissions:[{id:1,user_id:2,track_key:'free',level:1,pid:1,points:100,score:80,gems:80,code:'old',submitted_at:new Date().toISOString()}]};const tracks={free:{friendly_grading:true}};const attempts=createAttempts({getData:()=>data,nextId:()=>++id,save(){},tracks});const add=(key='request-000000001')=>attempts.create(data.open_submissions[0],{code:'new',language:'python'},{title:'Task'},key,'fingerprint');return {data,attempts,add};}
test('each required assessment must pass its own configured threshold',()=>{const t={pass_mark:60,levels:[{no:1,problems:[{pid:1},{pid:2,pass_mark:80},{pid:3,optional:true}]}]};assert.equal(completion(t,[{level:1,pid:1,score:100},{level:1,pid:2,score:79}]).passed,false);assert.equal(completion(t,[{level:1,pid:1,score:60},{level:1,pid:2,score:80}]).passed,true);assert.equal(completion({levels:[]},[]).passed,false);});
test('independent attempts preserve old work and grades, deduplicate requests, isolate owners',()=>{const {data,attempts,add}=setup();const a=add().attempt;assert.equal(data.open_attempts.length,2);assert.equal(data.open_attempts[0].payload.code,'old');assert.equal(add().attempt.id,a.id);attempts.fail(a.id,'Unavailable');assert.equal(data.open_submissions[0].gems,80);assert.equal(attempts.retry(a.id,99).status,404);assert.ok(attempts.retry(a.id,2).attempt);attempts.complete(a.id,30,'Needs work');assert.equal(data.open_submissions[0].score,80);const b=add('request-000000002').attempt;attempts.complete(b.id,90,'Good');attempts.complete(b.id,100,'duplicate');assert.equal(data.open_submissions[0].gems,90);assert.equal(data.open_attempts.length,3);});
test('retry bound and interrupted-worker recovery',()=>{const {attempts,add}=setup();const a=add().attempt;for(let i=0;i<3;i++){if(i)assert.ok(attempts.retry(a.id,2).attempt);attempts.start(a.id);attempts.fail(a.id,'failed');}assert.equal(attempts.retry(a.id,2).status,409);const b=add('request-000000002').attempt;attempts.start(b.id);attempts.recover();assert.equal(b.status,'queued');assert.equal(b.payload.tries,1);});
test('worker unavailable, durable-write failure, success, and timeout contracts',async()=>{let called=0;const s=setup(),a=s.add().attempt;const opts={attempts:s.attempts,persist:async()=>{},enabled:()=>false,grade:async()=>{called++;return {score:95,feedback:'passed'};},onComplete:async()=>{},log(){}};await createGradingWorker(opts).tick();assert.equal(a.status,'failed');assert.equal(called,0);s.attempts.retry(a.id,2);await createGradingWorker({...opts,enabled:()=>true,persist:async()=>{throw Error('disk');}}).tick();assert.equal(called,0);assert.equal(a.status,'queued');assert.match(a.payload.error,/not started/);s.attempts.fail(a.id,'disk');s.attempts.retry(a.id,2);await createGradingWorker({...opts,enabled:()=>true}).tick();assert.equal(a.status,'completed');assert.equal(s.data.open_submissions[0].score,95);const b=s.add('request-000000003').attempt;await createGradingWorker({...opts,enabled:()=>true,grade:()=>new Promise(()=>{}),timeoutMs:5}).tick();assert.equal(b.status,'queued');assert.match(b.payload.error,/could not finish/);});
test('a permanently failed attempt raises an alert, and a retryable one does not',async()=>{
  const s=setup(),a=s.add().attempt;const alerts=[];
  const opts={attempts:s.attempts,persist:async()=>{},enabled:()=>true,onComplete:async()=>{},log(){},
    onFailed:async(attempt,reason)=>{alerts.push({id:attempt.id,reason});},
    grade:async()=>{throw new Error('Groq free-tier quota is used up for now.');}};
  await createGradingWorker(opts).tick();
  assert.equal(a.status,'queued','an early failure still has retries left');
  assert.equal(alerts.length,0,'a retryable stumble must not page anyone');
  // Exhaust the automatic retries: the attempt gives up and must now be raised.
  a.payload.tries=99;a.payload.retry_at=null;a.status='queued';
  await createGradingWorker(opts).tick();
  assert.equal(a.status,'failed');
  assert.deepEqual(alerts.map(x=>x.id),[a.id]);
  assert.match(alerts[0].reason,/quota/);
});
test('an alert that cannot be delivered never costs the attempt its failed state',async()=>{
  const s=setup(),a=s.add().attempt;a.payload.tries=99;
  const opts={attempts:s.attempts,persist:async()=>{},enabled:()=>true,onComplete:async()=>{},log(){},
    onFailed:async()=>{throw new Error('smtp down');},grade:async()=>{throw new Error('nope');}};
  await createGradingWorker(opts).tick();
  assert.equal(a.status,'failed','the mail server is not allowed to lose the attempt');
});
test('adopt gives an attempt-less submission a markable attempt, and never duplicates a live one',()=>{
  const {data,attempts,add}=setup();
  const orphan={id:2,user_id:7,track_key:'free',level:1,pid:2,points:100,score:null,gems:0,code:'print(1)',submitted_at:new Date().toISOString()};
  data.open_submissions.push(orphan);
  const adopted=attempts.adopt(orphan,{title:'Task',pid:2});
  assert.equal(adopted.status,'awaiting_review');
  assert.equal(adopted.submission_id,orphan.id);
  assert.equal(adopted.payload.code,'print(1)');
  // Adopting twice must reuse the row, or an admin refreshing would fork the work.
  assert.equal(attempts.adopt(orphan,{title:'Task',pid:2}).id,adopted.id);
  // A marked adopted attempt writes the score back to the submission, which is
  // what actually opens the learner's next module.
  attempts.complete(adopted.id,75,'Marked by staff.','staff:1');
  assert.equal(orphan.score,75);
  // A submission whose only attempt failed still gets a fresh markable row.
  const live=add().attempt;attempts.fail(live.id,'gave up');live.status='failed';
  assert.notEqual(attempts.adopt(data.open_submissions[0],{title:'Task'}).id,live.id);
});
