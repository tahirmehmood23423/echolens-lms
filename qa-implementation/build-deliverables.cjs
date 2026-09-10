'use strict';
const fs=require('node:fs'),path=require('node:path');
const root=__dirname,read=f=>JSON.parse(fs.readFileSync(path.join(root,f),'utf8')),write=(f,s)=>fs.writeFileSync(path.join(root,f),s);
const issues=require('./issue-data.cjs'),current=read('course-inventory.json'),before=read('course-inventory-before.json'),videos=read('evidence/video-checks.json'),app=read('evidence/in-app-playback.json');
const id=url=>{try{const u=new URL(url);return u.searchParams.get('v')||u.pathname.split('/').pop();}catch{return null;}};
const countBy=(rows,key)=>rows.reduce((o,r)=>(o[r[key]]=(o[r[key]]||0)+1,o),{});
const table=(headers,rows)=>'| '+headers.join(' | ')+' |\n| '+headers.map(()=>'---').join(' | ')+' |\n'+rows.map(r=>'| '+r.map(v=>String(v??'').replace(/\|/g,'\\|').replace(/\r?\n/g,'<br>')).join(' | ')+' |').join('\n')+'\n';
const csv=rows=>{const keys=Object.keys(rows[0]);return '\ufeff'+[keys,...rows.map(r=>keys.map(k=>r[k]))].map(r=>r.map(v=>'"'+String(typeof v==='object'?JSON.stringify(v):v??'').replace(/"/g,'""')+'"').join(',')).join('\r\n');};
const noteMap={
 'fc01-c-basics/2':'Variables/output recording; program-entry anatomy needs inspected coverage.',
 'fc01-c-basics/3':'Output chapter exists; confirm explicit escape-sequence examples.',
 'fc01-c-basics/13':'Basic loop recording; inspect break/continue coverage needed for defect scanner.',
 'fc02-cpp-objects/4':'Variables material; auto deduction and const need explicit coverage.',
 'fc02-cpp-objects/9':'User-defined functions material; verify overloaded signatures and resolution.',
 'fc02-cpp-objects/10':'CONFIRMED MISMATCH: introductory installation/first-program chapters do not provide classes/access-control coverage. Verified replacement remains OPEN.',
 'fc02-cpp-objects/11':'Constructor material; inspect destructor lifecycle coverage for the assignment.',
 'cs104-python/3':'CORRECTED: advanced Hindi Python replaced with beginner input chapter 9:08 and conversion 10:48.',
 'cs104-python/4':'Older string tutorial; verify modern f-string syntax as well as slicing.',
 'cs104-python/7':'Lists/tuples basics; inspect list-comprehension coverage.',
 'cs104-python/12':'Lambda material; verify LEGB scope explanation separately.',
 'cs104-python/15':'File-object material; verify safe exception handling in addition to with.',
 'cs105-javascript/2':'Long reused recording: scope chapters at 53:36/59:21 and hoisting 5:29:06. No lesson-specific offset applied; inspect segment before adding.',
 'cs105-javascript/5':'CORRECTED: Python strings replaced with JavaScript strings chapter 1:51:19 and methods 1:57:08; MDN template literals supplement.',
 'cs105-javascript/6':'CORRECTED: Python loops replaced with JavaScript loop introduction 2:45:11; MDN specific loop forms supplement.',
 'cs105-javascript/7':'Map recording; filter and reduce coverage needs inspection.',
 'cs105-javascript/12':'Higher-order functions recording; explicit currying example needs inspection.',
 'c-advanced/6':'Memory-address topic does not establish heap cleanup/leak diagnosis coverage.',
 'c-advanced/8':'Struct-pointer topic does not establish linked-list construction and traversal.',
 'c-advanced/9':'Verify multi-bit masks and flag manipulation, not only switching a bit.',
 'cpp-advanced/2':'Virtual-function basics; verify vtables explanation and task-level dispatch.',
 'cpp-advanced/8':'Function-template resource reused for class-template task; full class-template coverage UNVERIFIED.',
 'cpp-advanced/9':'Sorting material; verify lambda predicate/filter pipeline.',
 'python-advanced/9':'ABC material; metaclass objective needs separate inspection.',
 'python-advanced/11':'French-language context-manager recording; language unexplained; contextdecorator chapter 11:55. Confirm contextmanager and redirect_stdout coverage.',
 'python-advanced/12':'Weakref resource; slots-based memory layout/task coverage needs inspection.',
 'python-advanced/13':'Requires real concurrency-capable Python execution; browser runner support UNVERIFIED.',
 'python-advanced/14':'Lock/Queue task requires concurrency-capable Python execution; runner support UNVERIFIED.',
 'js-advanced/2':'ES6 class chapters do not establish modern #private-field coverage.',
 'js-advanced/3':'Seal material; verify descriptors and freeze as well.',
 'js-advanced/7':'Older event-loop talk; verify current queueMicrotask/MutationObserver ordering.',
 'js-advanced/10':'Promise basics; verify allSettled/race/any as well as all.',
 'js-advanced/12':'CORRECTED: wrong-language Python video removed from JS mapping. MDN async-generator guide supplied; replacement video OPEN.',
 'js-advanced/14':'Worker implementation and Blob/origin support need a tested runner setup.',
 'js-advanced/15':'SharedArrayBuffer/Atomics require appropriate origin isolation. Isolation topic at 1:03 and Atomics at 6:10; runner compatibility UNVERIFIED.',
 'web-advanced/2':'Cascade-layer recording; task needs explicit CSS custom-property example.',
 'web-advanced/5':'Subgrid recording; auto-fit/minmax gallery task coverage UNVERIFIED.',
 'web-advanced/6':'Container-query recording; clamp-based fluid heading task coverage UNVERIFIED.',
 'web-advanced/7':'Timing functions/animation material; inspect delay/stagger sequence.',
 'web-advanced/9':'Gradient material; backdrop-filter/glass effect coverage UNVERIFIED.',
 'web-advanced/10':'Sass task needs compiler/build step beyond HTML preview; practical setup UNVERIFIED.',
 'web-advanced/11':'100-second Tailwind overview; verify working dependency/setup and task example.',
 'web-advanced/12':'100-second PostCSS overview; verify usable minification toolchain and task example.',
 'web-advanced/14':'Core Web Vitals overview; verify concrete loading=lazy implementation.',
 'web-advanced/15':'Git overview does not establish actual hosting deployment; add inspected deployment walkthrough.'
};
const lessons=[];
for(const c of current.courses){const original=before.courses.find(o=>o.track.key===c.track.key);for(const l of c.levels){const old=original.levels.find(o=>o.no===l.no),v=videos.find(v=>v.id===id(l.video_url)),a=app.find(v=>v.id===id(l.video_url));for(const p of l.problems){let seconds=0;try{const u=new URL(l.video_url);seconds=Number((u.searchParams.get('start')||u.searchParams.get('t')||'0').replace(/s$/,''));}catch{}lessons.push({course_code:c.catalogue.code,course:c.track.title,track:c.track.key,module:l.week,lesson:l.no,lesson_title:l.title,assignment_id:p.pid,assignment:p.title,required:p.required!==false&&!p.optional,pass_threshold:p.pass_mark??c.track.pass_mark,language:p.language||c.track.default_language,original_video:old.video_url,current_resource:l.video_url||l.resource_url,resource_type:l.video_url?'video':'guide',timestamp_seconds:seconds,availability:v?.availability||(l.resource_url?'AVAILABLE (official guide inspected)':'UNVERIFIED'),standard_embed:v?.embedding||'N/A',standard_playback:v?.playback||'N/A',app_playback:a?.status||'N/A',resource_title:v?.title||'MDN async function*',author:v?.author||'MDN',relevance_scope:noteMap[c.track.key+'/'+l.no]||'Provider title/topic screened; full explanation/example/assignment coverage UNVERIFIED because no usable transcript was returned. Inspect segment and solve the assignment.',full_content_coverage:'UNVERIFIED',required_next_check:'Instructor inspects segment/captions, checks prerequisites and runner, and solves assessment from declared lesson material.',assignment_references:p.refs||[]});}}}
const resources=videos.map(v=>({...v,app_playback:app.find(a=>a.id===v.id)?.status||'UNVERIFIED',app_checked_at:app.find(a=>a.id===v.id)?.checked_at||'',original_lessons:before.courses.flatMap(c=>c.levels.filter(l=>id(l.video_url)===v.id).map(l=>c.track.key+'/'+l.no)),current_lessons:lessons.filter(l=>id(l.current_resource)===v.id).map(l=>l.track+'/'+l.lesson),full_content_coverage:'UNVERIFIED'}));
write('lesson-review.csv',csv(lessons));write('lesson-review.json',JSON.stringify(lessons,null,2));write('video-inventory.csv',csv(resources));write('video-inventory.json',JSON.stringify(resources,null,2));write('issue-matrix.csv',csv(issues));write('issue-matrix.json',JSON.stringify(issues,null,2));
const matrix='# Updated issue matrix\n\nAll 35 requested findings are accounted for. FIXED AND VERIFIED means the specified local/code/unit/browser boundary passed; it does not certify external services or all production workflows. Integration limits are explicit in each row. Original evidence remains in [the original audit](../qa-audit/audit-report.html).\n\n'+table(['Issue ID','Original finding','Reproduction result','Fix','Changed files','Verification','Remaining limitation','Status'],issues.map(r=>Object.values(r)));
write('issue-matrix.md',matrix);
const stats={generated_at:new Date().toISOString(),issues:countBy(issues,'status'),courses:current.courses.length,modules:current.courses.reduce((n,c)=>n+new Set(c.levels.map(l=>l.week)).size,0),lessons:lessons.length,assignments:lessons.length,original_unique_videos:videos.length,current_unique_videos:new Set(lessons.filter(l=>l.resource_type==='video').map(l=>id(l.current_resource))).size,current_video_lessons:lessons.filter(l=>l.resource_type==='video').length,guide_lessons:lessons.filter(l=>l.resource_type==='guide').length,availability:countBy(videos,'availability'),standard_playback:countBy(videos,'playback'),app_playback:countBy(app,'status'),tests:{}};
for(const f of ['security-after','workflow-after','browser-after','ui-survey-after','final-checks','free-enrollment-after','free-enrollment-browser'])stats.tests[f]=countBy(read('evidence/'+f+'.json'),'status');
write('verification-summary.json',JSON.stringify(stats,null,2));
const counts=table(['Status','Findings'],Object.entries(stats.issues));
const report=`# EchoLens implementation and verification report

Prepared ${stats.generated_at.slice(0,10)} UTC (local working date 10 September 2026). Branch: **fix/qa-workflow-remediation**, base **5fcab96**. Implementation is local and uncommitted. No deployment, merge, production mutation, payment charge or real message was performed.

The security, registration, draft recovery, grading/progress and focused UI fixes are implemented and locally exercised. All **35 audit findings** have a disposition. This is a completed local remediation handoff with explicit remaining work; it is **not an unconditional production-readiness sign-off**.

${counts}
## Review the deliverables

- [Issue matrix](issue-matrix.html) · [CSV](issue-matrix.csv): every D-01–D-20, U-01–U-09 and E-01–E-06 with reproduction, files, verification and limitations.
- [Course and video review](course-video-review.html) · [every lesson/assignment CSV](lesson-review.csv) · [every unique video CSV](video-inventory.csv).
- [Curriculum findings and proposed outlines](curriculum-review.html): four narrow corrections, remaining mappings and prerequisite/tooling gaps.
- [Configuration, migrations, rollback and release checks](release-runbook.html).
- [Separate historical data review plan](historical-data-review.html).
- [ChatGPT product-design handoff](design-handoff.html).
- [Original audit](../qa-audit/audit-report.html) remains preserved as before evidence.

## Completed changes

Private uploads now require purpose/owner/course authorization; unknown attachments are denied. Password recovery/admin resets invalidate earlier sessions. Course certificate and gem recipients must be eligible members, and quiz creation cannot override its authorized URL batch.

Registration uses authoritative offering metadata and fees, normalized deduplication and idempotent invoice/clearance/enrollment transitions. The incomplete PATH bundle is disabled. Durable queued, failed and provider-accepted email states are separate from registration stage. Applicants receive a private reference/status/download path, and staff can retry delivery without creating another financial record.

Course/lesson/practice and important dashboard views have stable destinations. Sign-in, reset and session expiry preserve a validated return path. Account/task/language drafts survive refresh and navigation, show save state, and reject stale overwrites. Browser checks demonstrate actual code output after recovery and isolate drafts across accounts.

Free submissions create independent attempts with immutable work snapshots, bounded grading retries and manual admin recovery. Pending, failed and lower results preserve a previous best score/reward. Progress and certificate eligibility share the required-assessment policy: each required task passes its configured threshold, optional practice does not block, watching is not mastery, and no unconfigured final exam is added. Historical certificates/grades are preserved.

Other changes include explicit profile clearing, recoverable loaders, coordinator read-only UI/chat alignment, accurate catalogue/stage copy, idempotent challenge correction deltas and unique team reward recipients. Focused UI work adds accessible shared dialogs, larger controls, concise clamped summaries, catalogue pagination/filter recovery, Continue learning, starter code, attempt history and resumable onboarding with a separate marketing preference.

Free-course enrollment now uses the learner's existing account. Both the open-web **free** role and portal **student** role can select **Enroll for free**, keep their current role, and see the course with assessment progress under **My courses**. Existing free-course submissions are recognized automatically. Staff roles can preview public lesson material but cannot create or list learner enrollments. Repeated enrollment is idempotent and does not create paid enrollments, registrations, challans, grades or rewards.

A local Windows write failure discovered during validation was also fixed: atomic JSON writes use a unique temporary file, writable fsync and bounded rename retry while preserving the last good file. New critical async handlers forward failures to Express error handling. This does not claim every legacy async route has been rewritten.

## Verification results

| Check | Result | Evidence |
|---|---|---|
| Focused unit tests | 30 passed, 0 failed | Upload/session, free-course enrollment, offering/delivery, drafts, attempts/worker/mastery, certificate rules, gems and atomic persistence |
| Free enrollment API | 7 passed | [Results](evidence/free-enrollment-after.json): free learner and portal student, retry idempotency, three staff-role denials, unknown course and no paid/grade mutation |
| Free enrollment browser | 5 passed | [Results](evidence/free-enrollment-browser.json): persisted My courses for both learner roles, both enrollment CTAs and staff preview without enrollment action |
| Security API checks | 7 passed | [Results](evidence/security-after.json), [pre-fix reproduction](evidence/security-before.json) |
| Workflow API groups | 7 passed | [Results](evidence/workflow-after.json): profile, registration-to-enrollment, free attempts/certificate, paid grading/feedback, challenge corrections, team awards, coordinator boundaries |
| Browser regressions | 10 passed | [Results](evidence/browser-after.json): 1440/390 free draft/run/auth resume/account isolation; Settings/task route; paid draft; 503 Retry; keyboard dialog |
| Final focused checks | 3 passed | [Results](evidence/final-checks.json): reset return path, filter refresh/Back/Forward, video timestamp/mobile ratio and async-generator guide |
| Role/layout survey | 100 records: 98 PASS, 2 UNAVAILABLE | [Results](evidence/ui-survey-after.json): 11 roles; both unavailable records are PostgreSQL-dependent talent views with recovered error state; zero recorded page errors |
| Syntax/whitespace/schema | Passed | [JS syntax](evidence/syntax-checks.json), [change manifest and whitespace](change-manifest.json), [schema validation](evidence/schema-validation.txt), [client generation](evidence/schema-generation.txt); no PostgreSQL migration applied |
| Artifact review | 10 passed | [Results](evidence/artifact-checks.json): six role/viewport sidebar checks, two running-workspace captures, report links and issue filter |

The end-to-end free policy test manually grades all 15 JavaScript required assessments, obtains a publicly verifiable synthetic certificate and confirms lower/failed later attempts preserve score 100 and 570 gems. The automatic worker success path is a **unit-test fake grader**, not live AI. The paid path uses synthetic manual clearance and confirms one correct enrollment; no real money moves. Skipped mail is exercised against the actual unconfigured local provider, while provider acceptance is a unit-test acknowledgment.

The browser helper suppresses external services for routine app tests. Video probes use separate clean browser contexts with public provider access. Chrome at 1440px and 390px is covered; this does not establish Firefox/Safari, screen-reader, real touch or full contrast conformance. Tests requiring the real PostgreSQL talent backend were not run.

## Course/video verification

The complete inventory contains **${stats.courses} courses, ${stats.modules} modules, ${stats.lessons} lessons and ${stats.assignments} assignments**. The original **${videos.length} unique videos all reported AVAILABLE**. Standard embeds demonstrated playback for **${stats.standard_playback.PLAYED}**, with **${stats.standard_playback.UNVERIFIED||0} UNVERIFIED** in the short probe. The app's actual privacy-enhanced embed demonstrated playback for **${stats.app_playback.PLAYED}**, with **${stats.app_playback.UNVERIFIED||0} UNVERIFIED**. These are separate observations; a timeout is not proof of a broken link.

After corrections there are ${stats.current_video_lessons} video-backed lessons using ${stats.current_unique_videos} unique recordings and ${stats.guide_lessons} guide-backed lesson. Input/strings/loops corrections reuse verified creator chapters and preserve useful original resources. JavaScript async generators now has an official guide while a suitable video awaits review. C++ classes still has a confirmed topic mismatch needing an inspected replacement. Available titles/chapters support a partial relevance review; inaccessible transcripts mean full lesson-to-assignment suitability remains UNVERIFIED throughout the inventory. The curriculum report specifies exactly what to inspect and proposes outlines without changing assessment IDs or historical completion.

## Before/after visual evidence

These are synthetic local accounts. Before images come from the original audit; after images show the current patch. Viewport comparisons are 1440px/390px where available. Captures compare workflow states, not pixel-identical data snapshots.

| View | Before | After |
|---|---|---|
| Student overview, desktop | [Before](../qa-audit/evidence/dashboard-student.png) | [After](evidence/student-overview-after-1440.png) |
| Student overview, mobile | [Before](../qa-audit/evidence/dashboard-student-mobile.png) | [After](evidence/student-overview-after-390.png) |
| Admin health, desktop | [Before](../qa-audit/evidence/dashboard-admin.png) | [After](evidence/admin-overview-after-1440.png) |
| Admin health, mobile | [Before](../qa-audit/evidence/dashboard-admin-mobile.png) | [After](evidence/admin-overview-after-390.png) |
| Mobile catalogue | [Original all-course length](../qa-audit/evidence/open-mobile.png) | [Current filtered catalogue](evidence/catalogue-after-390.png) |
| Free learning workspace | [Original curriculum](../qa-audit/evidence/free-curriculum-desktop.png) | [Recovered draft and successful run](evidence/learning-after-1440.png), [mobile](evidence/learning-after-390.png) |
| Modal/onboarding | [Original focus failure](../qa-audit/evidence/annotated-signin-focus.png) | [Resumed onboarding](evidence/onboarding-after-390.png); keyboard evidence in browser results |

## Remaining limits and release decisions

PostgreSQL migrations/persistence, live mail/AI, cloud storage/talent consent, OAuth and real live-class workflows need staging integrations. One app/worker instance is required; distributed claims and concurrent snapshot persistence are not implemented. Do not label a configured provider healthy solely because a credential exists. E-04 remains partially open for image/live capability handling. Some embedded detail views and paid/staff vocabulary still need design follow-up.

PATH remains unavailable until its real bundle rules are established. Full curriculum coverage, advanced runner prerequisites, the C++ mismatch, the async-generator replacement video and UNVERIFIED playback require content review. Historical duplicate registrations/rewards and certificate-policy differences need the separate approved review plan; no automatic repair was performed.

See the release runbook for the exact schema-mode choice, sandbox acceptance checks and rollback constraints. The code and evidence are ready for review; deployment remains a separate instruction.
`;
write('implementation-report.md',report);
const courseDoc='# Complete course and video inventory\n\n[Curriculum evidence, changes and unresolved review](curriculum-review.html) · [All lesson/assignment rows (CSV)](lesson-review.csv) · [Unique videos (CSV)](video-inventory.csv) · [Original complete content (JSON)](course-inventory-before.json) · [Current complete content (JSON)](course-inventory.json)\n\nSearch the table in the HTML page to find a course, topic or UNVERIFIED concern. Availability and playback are independent from content coverage.\n\n'+table(['Course','Modules','Lessons','Assignments'],current.courses.map(c=>[c.track.title,new Set(c.levels.map(l=>l.week)).size,c.levels.length,c.levels.reduce((n,l)=>n+l.problems.length,0)]))+'\n## Every lesson and assignment\n\n'+table(['Course / module / lesson','Topic','Practice','Resource / timestamp','Playback (standard / app)','Relevance evidence and next work'],lessons.map(l=>[l.track+' / '+l.module+' / '+l.lesson,l.lesson_title,l.assignment+'; '+(l.required?'required':'optional')+'; threshold '+l.pass_threshold,`[${l.resource_type}](${l.current_resource})`+(l.timestamp_seconds?' @ '+l.timestamp_seconds+'s':''),l.standard_playback+' / '+l.app_playback,l.relevance_scope+' Full coverage: UNVERIFIED.']))+'\n## Every unique original video\n\n'+table(['Video','Availability','Standard / app playback','Original reuse','Current use'],resources.map(v=>[`[${v.title}](${v.url})`,v.availability,v.playback+' / '+v.app_playback,v.original_lessons.join(', '),v.current_lessons.join(', ')||'Removed from incorrect mapping; preserved in original inventory']));
write('course-video-review.md',courseDoc);
(async()=>{const {marked}=await import('marked');const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));for(const name of ['implementation-report','issue-matrix','course-video-review','curriculum-review','release-runbook','historical-data-review','design-handoff']){const md=fs.readFileSync(path.join(root,name+'.md'),'utf8'),title=md.split('\n')[0].replace(/^# /,'');const html=marked.parse(md);write(name+'.html',`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title><style>:root{font-family:Inter,system-ui,Segoe UI,sans-serif;color:#15314a;background:#f4f8fa;line-height:1.6}*{box-sizing:border-box}body{margin:0}header{background:#103449;color:white;padding:20px 5vw}header a{color:#b4fff0}main{max-width:1500px;margin:auto;padding:32px 5vw 80px}h1{font-size:clamp(26px,4vw,40px);line-height:1.2;color:#123d51}h2{margin-top:36px;font-size:23px}h3{font-size:19px}p,li{max-width:110ch}a{color:#006b77;text-underline-offset:3px}a:focus-visible,input:focus-visible{outline:3px solid #ce7700;outline-offset:3px}table{border-collapse:collapse;width:100%;font-size:14px;background:white}th,td{border:1px solid #d6e1e6;text-align:left;padding:12px;vertical-align:top;min-width:130px;overflow-wrap:anywhere}th{background:#e0f0ef;color:#143f44;position:sticky;top:0}td:first-child{font-weight:600}.table-scroll{overflow:auto;margin:20px 0;max-height:75vh;border:1px solid #d6e1e6;border-radius:8px}pre{background:#e5edef;padding:16px;overflow:auto;border-radius:8px}code{font-size:.92em}input{min-height:44px;border:1px solid #7b99a7;border-radius:6px;padding:10px;font:inherit;width:min(600px,100%)}.search{position:sticky;top:0;z-index:3;background:#f4f8fa;padding:12px 0}.search small{display:block;color:#466272}img{max-width:100%;height:auto}footer{border-top:1px solid #ccdce4;padding-top:20px;color:#4a6473;font-size:14px}@media print{header,.search{display:none}.table-scroll{overflow:visible;max-height:none}main{padding:0}th{position:static}table{font-size:10px}a{color:inherit}}</style></head><body><header><strong>EchoLens · QA implementation</strong> &nbsp; <a href="implementation-report.html">Report</a> · <a href="issue-matrix.html">Issue matrix</a> · <a href="course-video-review.html">Course inventory</a> · <a href="release-runbook.html">Release checks</a></header><main><div class="search"><label for="filter">Filter table rows on this page</label><br><input id="filter" type="search" placeholder="Search issue ID, course or status"><small id="matches" aria-live="polite"></small></div>${html}<footer>Local synthetic verification · ${esc(stats.generated_at)} · Original audit evidence preserved · No deployment</footer></main><script>document.querySelectorAll('table').forEach(t=>{const w=document.createElement('div');w.className='table-scroll';w.tabIndex=0;w.setAttribute('role','region');w.setAttribute('aria-label','Scrollable results table');t.before(w);w.append(t)});document.getElementById('filter').addEventListener('input',e=>{const q=e.target.value.toLowerCase();let shown=0,total=0;document.querySelectorAll('tbody tr').forEach(r=>{total++;r.hidden=!r.textContent.toLowerCase().includes(q);if(!r.hidden)shown++});document.getElementById('matches').textContent=shown+' of '+total+' rows shown';});</script></body></html>`);}console.log(JSON.stringify(stats,null,2));})().catch(e=>{console.error(e);process.exitCode=1});
