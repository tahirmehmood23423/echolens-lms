'use strict';
const crypto = require('node:crypto');
const { GRADING_WINDOW_MS, parseTimestamp } = require('./course-pacing');
// Manual retries a learner may request. Unchanged: this is the "you have had
// enough goes" bound, not the machine's.
const MAX_TRIES = 3;
// Automatic retries the worker may make while the grading window is still open.
// The learner is promised a result within 8 h, so the worker keeps trying for
// that long - backing off, capped at 30 min - and gives up only at the
// deadline. A provider outage is then absorbed by retries instead of surfacing
// as a failed attempt minutes after submission.
const MAX_AUTO_TRIES = 20;
const AUTO_BACKOFF_CAP_MS = 30 * 60_000;
function completion(track, submissions) {
  const required = track.levels.flatMap(l => l.problems.filter(p => p.required !== false && p.optional !== true).map(p => ({ level:l.no, pid:p.pid, pass_mark:Number(p.pass_mark ?? track.pass_mark ?? 60) })));
  const results = required.map(p => {
    const submission=submissions.find(s => (s.assessment_kind||'assignment')==='assignment' && s.level === p.level && s.pid === p.pid);
    return {...p,score:submission?.score??null,passed:submission?.score!=null&&submission.score>=p.pass_mark};
  });
  const assignmentScores=results.filter(p=>p.score!=null).map(p=>Number(p.score));
  const assignment_average=assignmentScores.length?Math.round(assignmentScores.reduce((sum,score)=>sum+score,0)/assignmentScores.length):null;
  const assignments_passed=required.length>0&&results.every(p=>p.passed);
  if(!track.capstone)return {required_total:required.length,required_passed:results.filter(p=>p.passed).length,requirements:results,assignment_average,assignments_passed,weighted_score:assignment_average,passed:assignments_passed};
  const capstoneSubmission=submissions.find(s=>s.assessment_kind==='capstone'||(s.level===0&&s.pid===0));
  const capstoneScore=capstoneSubmission?.score??null,capstonePassMark=Number(track.capstone.pass_mark??track.pass_mark??60);
  const capstone={required:true,unlocked:assignments_passed,submitted:!!capstoneSubmission,score:capstoneScore,pass_mark:capstonePassMark,passed:capstoneScore!=null&&capstoneScore>=capstonePassMark};
  const allAssignmentsGraded=assignmentScores.length===required.length;
  const assignmentWeight=Number(track.assignment_weight??60),capstoneWeight=Number(track.capstone.weight??track.capstone_weight??40);
  const weighted_score=allAssignmentsGraded&&capstoneScore!=null?Math.round((assignment_average*assignmentWeight+Number(capstoneScore)*capstoneWeight)/(assignmentWeight+capstoneWeight)):null;
  return {required_total:required.length,required_passed:results.filter(p=>p.passed).length,requirements:results,assignment_average,assignments_passed,capstone,weighted_score,passed:assignments_passed&&capstone.passed};
}
// getData is intentional: Postgres hydration replaces the store object at boot.
function createAttempts({getData,nextId,save,tracks,now=()=>new Date().toISOString()}) {
  const rows=()=>getData().open_attempts;
  const byId=id=>rows().find(a=>a.id===Number(id));
  const update=(a,fields)=>{Object.assign(a,fields,{updated_at:now()});save();return a;};
  const api={
    byId,
    list(uid,track,level,pid){return rows().filter(a=>a.user_id===Number(uid)&&a.track_key===track&&(level==null||a.level===Number(level))&&(pid==null||a.pid===Number(pid))).sort((a,b)=>b.id-a.id);},
    create(sub,fields,problem,requestKey,fingerprint){
      const key=requestKey||crypto.randomUUID();
      if(!/^[\w-]{16,80}$/.test(key))return {error:'Invalid submission request key.'};
      const existing=rows().find(a=>a.user_id===sub.user_id&&a.request_key===key);
      if(existing)return existing.payload.fingerprint===fingerprint?{attempt:existing,existing:true}:{error:'This request key belongs to different work. Refresh and submit again.',status:409};
      if(sub.score!=null&&!rows().some(a=>a.submission_id===sub.id)){
        rows().push({id:nextId('open_attempts'),user_id:sub.user_id,submission_id:sub.id,request_key:'historical-'+crypto.randomUUID(),track_key:sub.track_key,level:sub.level,pid:sub.pid,status:'completed',payload:{assessment_kind:sub.assessment_kind||'assignment',code:sub.code,language:sub.language,file_url:sub.file_url,file_name:sub.file_name,files:sub.files,evidence:sub.evidence,score:sub.score,gems:sub.gems,feedback:sub.feedback,graded_at:sub.graded_at,historical:true,tries:0},created_at:sub.submitted_at,updated_at:now()});
      }
      const status=problem.grading_mode==='staff'?'awaiting_review':'queued';
      const a={id:nextId('open_attempts'),user_id:sub.user_id,submission_id:sub.id,request_key:key,track_key:sub.track_key,level:sub.level,pid:sub.pid,status,payload:{...fields,problem:JSON.parse(JSON.stringify(problem)),fingerprint,tries:0},created_at:now(),updated_at:now()};
      rows().push(a);sub.attempts=rows().filter(x=>x.submission_id===sub.id).length;save();return {attempt:a};
    },
    // parseTimestamp, not Date.parse: now() is UTC in a bare format Date.parse
    // reads as local, which delayed every retry by the host's UTC offset.
    due(){const time=parseTimestamp(now());return rows().find(a=>a.status==='queued'&&(!a.payload.retry_at||parseTimestamp(a.payload.retry_at)<=time));},
    recover(){for(const a of rows())if(a.status==='processing')api.fail(a.id,'Grading was interrupted. Your work is saved.',true);},
    start(id){const a=byId(id);if(!a||a.status!=='queued')return null;a.payload.tries++;a.payload.started_at=now();return update(a,{status:'processing'});},
    fail(id,message,retryable=false){
      const a=byId(id);if(!a||a.status==='completed')return a;
      a.payload.error=message;
      // Keep retrying for as long as the learner's grading window is open.
      const nowMs=parseTimestamp(now());
      const deadline=parseTimestamp(a.created_at)+GRADING_WINDOW_MS;
      const backoff=Math.min(AUTO_BACKOFF_CAP_MS,30000*2**Math.max(0,a.payload.tries-1));
      const nextAt=nowMs+backoff;
      a.payload.retry_at=retryable&&a.payload.tries<MAX_AUTO_TRIES&&nextAt<deadline?new Date(nextAt).toISOString():null;
      return update(a,{status:a.payload.retry_at?'queued':'failed'});
    },
    // Every ungraded submission that still has a live attempt row can be marked
    // through the normal flow, which is keyed on an attempt id. Two cannot:
    // a submission whose attempt was never created (OpenQuest.submit pushes the
    // submission BEFORE OpenAttempts.create, so a rejected create leaves the
    // submission behind), and one whose only attempts have all failed. Both
    // leave a learner blocked on a grade that no longer has anywhere to come
    // from. Minting the missing row puts them back in the same queue every
    // other grade goes through, rather than adding a second way to grade.
    adopt(sub,problem){
      const live=rows().find(a=>a.submission_id===sub.id&&a.status!=='failed');
      if(live)return live;
      const a={id:nextId('open_attempts'),user_id:sub.user_id,submission_id:sub.id,request_key:'adopted-'+crypto.randomUUID(),
        track_key:sub.track_key,level:sub.level,pid:sub.pid,status:'awaiting_review',
        payload:{assessment_kind:sub.assessment_kind||'assignment',code:sub.code,language:sub.language,file_url:sub.file_url,
          file_name:sub.file_name,files:sub.files,evidence:sub.evidence,output:sub.output,
          problem:problem?JSON.parse(JSON.stringify(problem)):null,tries:0,adopted:true,
          error:'Recovered for manual marking - automatic grading left no attempt on record.'},
        created_at:sub.submitted_at||now(),updated_at:now()};
      rows().push(a);sub.attempts=rows().filter(x=>x.submission_id===sub.id).length;save();return a;
    },
    retry(id,uid){const a=byId(id);if(!a||a.user_id!==Number(uid))return {error:'Attempt not found.',status:404};if(a.status!=='failed')return {error:'Only failed attempts can be retried.',status:409};if(a.payload.tries>=MAX_TRIES)return {error:'Automatic retry limit reached. Request staff review or submit a new attempt.',status:409};a.payload.error=null;a.payload.retry_at=null;return {attempt:update(a,{status:'queued'})};},
    complete(id,score,feedback,grader='ai'){
      const a=byId(id);if(!a)return null;if(a.status==='completed')return a;
      if(!Number.isFinite(Number(score))||Number(score)<0||Number(score)>100)throw new Error('Invalid grader score');
      const sub=getData().open_submissions.find(s=>s.id===a.submission_id);if(!sub)throw new Error('Missing submission');
      const raw=Number(score),effective=grader==='ai'&&!tracks[a.track_key]?.friendly_grading?Math.round(raw*.9):Math.round(raw);
      Object.assign(a.payload,{score:effective,gems:Math.round(effective/100*sub.points),feedback:String(feedback||'').slice(0,4000),graded_at:now(),graded_by:grader,error:null,retry_at:null});
      // A later failed or lower-scoring attempt never destroys a successful result.
      if(sub.score==null||effective>sub.score)Object.assign(sub,{assessment_kind:a.payload.assessment_kind||sub.assessment_kind||'assignment',code:a.payload.code,language:a.payload.language,file_url:a.payload.file_url,file_name:a.payload.file_name,files:a.payload.files,evidence:a.payload.evidence,submitted_at:a.created_at,score:effective,gems:a.payload.gems,feedback:a.payload.feedback,graded_at:a.payload.graded_at});
      return update(a,{status:'completed'});
    },
    public(a){return {...a,payload:{...a.payload,problem:undefined,fingerprint:undefined},can_retry:a.status==='failed'&&a.payload.tries<MAX_TRIES};},
  };return api;
}
module.exports={completion,createAttempts,MAX_TRIES};
