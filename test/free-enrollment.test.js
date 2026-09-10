'use strict';
const {test,beforeEach,after}=require('node:test');
const assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),crypto=require('node:crypto');
const dbPath=path.join(os.tmpdir(),'echolens-free-enrollment-'+crypto.randomUUID()+'.json');
require('dotenv').config=()=>({parsed:{}});
process.env.DATABASE_URL='';process.env.DB_PATH=dbPath;
const store=require('../store');
const {OpenQuest,Users,Quests}=store;
const tracks=Quests.tracks().filter(t=>t.free && store.officialCatalogue().some(c=>c.code===t.course_code&&c.price_pkr===0));
const key=tracks[0].key;
beforeEach(()=>{const d=store.allData();d.users=[{id:1,role:'free',profile:{city:'Lahore'}},{id:2,role:'student',profile:{phone:'03001234567'}},{id:3,role:'admin',profile:{}}];d.open_submissions=[];d.open_attempts=[];});
after(()=>{if(fs.existsSync(dbPath))fs.unlinkSync(dbPath);});
test('both existing learner roles enroll without changing roles, grades or paid membership',()=>{
  const d=store.allData(),counts=[d.enrollments.length,d.certificates.length,d.gem_events.length];
  for(const uid of [1,2]){const role=Users.byId(uid).role,out=OpenQuest.enroll(uid,key);assert.equal(out.existing,false);assert.equal(Users.byId(uid).role,role);const c=OpenQuest.enrollments(uid)[0];assert.equal(c.track_key,key);assert.equal(c.required_passed,0);assert.equal(c.completed,false);assert.ok(c.required_total>0);}
  assert.deepEqual([d.enrollments.length,d.certificates.length,d.gem_events.length],counts);
  const saved=JSON.parse(fs.readFileSync(dbPath,'utf8'));assert.equal(saved.users[1].profile.free_course_enrollments[0].track_key,key);assert.equal(saved.users[1].profile.phone,'03001234567');
});
test('repeat enrollment is idempotent and different courses remain separate',()=>{
  const first=OpenQuest.enroll(1,key);assert.deepEqual(OpenQuest.enroll(1,key),{...first,existing:true});OpenQuest.enroll(1,tracks[1].key);assert.equal(OpenQuest.enrollments(1).length,2);assert.equal(Users.byId(1).profile.free_course_enrollments.length,2);
});
test('all nonlearner roles are rejected without creating enrollment or submissions',()=>{
  for(const role of ['admin','instructor','coordinator','hr','finance','student_coordinator','staff','ambassador','recruiter','unknown']){const u=Users.byId(3);u.role=role;assert.equal(OpenQuest.enroll(3,key).status,403,role);assert.deepEqual(OpenQuest.enrollments(3),[]);assert.equal(OpenQuest.submit({user:{id:3,role:'student'},track_key:key,level:1,pid:1,code:'hello'}).status,403);assert.equal(u.profile.free_course_enrollments,undefined);}
  assert.equal(store.allData().open_submissions.length,0);
});
test('missing, unknown and paid tracks cannot be enrolled as free courses',()=>{
  const paid=Quests.tracks().find(t=>!t.free);for(const value of ['', 'not-a-course', paid.key])assert.equal(OpenQuest.enroll(1,value).status,400);assert.equal(OpenQuest.enrollments(1).length,0);
});
test('existing free-course work is recognized without resetting progress',()=>{
  store.allData().open_submissions.push({id:1,user_id:2,track_key:key,level:1,pid:1,score:100,gems:30,submitted_at:'2026-09-01 12:00:00'});
  const out=OpenQuest.enroll(2,key);assert.equal(out.existing,true);assert.equal(out.enrollment.enrolled_at,'2026-09-01 12:00:00');assert.equal(OpenQuest.enrollments(2)[0].required_passed,1);assert.equal(store.allData().open_submissions[0].gems,30);
});
test('editable profile cannot forge or erase enrollment metadata',()=>{
  OpenQuest.enroll(1,key);Users.updateProfile(1,{city:'',free_course_enrollments:[],role:'admin'});assert.equal(Users.byId(1).role,'free');assert.equal(Users.byId(1).profile.city,undefined);assert.equal(OpenQuest.enrollments(1).length,1);
});
