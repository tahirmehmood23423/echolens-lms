'use strict';
// Written learning views inside the existing /career router. No client grading.
(() => {
  const e=CareerUI.escape, $=id=>document.getElementById(id);
  const a=(href,label,primary=false)=>`<a class="cr-btn${primary?'':' ghost'}" href="${e(href)}">${e(label)}</a>`;
  const list=items=>`<ul>${items.map(t=>`<li>${e(t)}</li>`).join('')}</ul>`;
  const previewNote=preview=>preview?'<p class="cr-note warn" role="status">Draft preview. This content has not been approved or published for students. Automated verification is separate from human content review.</p>':'';
  const learner=ctx=>ctx.ME&&['student','free'].includes(ctx.ME.role);
  async function start(ctx,sid,kind,id,button) {
    button.disabled=true;
    window.CareerCurriculum?.reset?.();
    try {await ctx.api(`/api/career/me/learning/${encodeURIComponent(sid)}/quizzes/${kind}/${encodeURIComponent(id)}`,{method:'POST'});location.hash='#stake';}
    catch(err){button.disabled=false;$('clStatus').textContent=err.message;}
  }
  async function overview(ctx,sid,preview) {
    const url=preview?'/api/admin/career/learning/'+encodeURIComponent(sid)+'/preview':'/api/career/learning/'+encodeURIComponent(sid);
    const d=await ctx.api(url), p=d.progress;
    document.title=d.title+' learning | EchoLens';
    ctx.root.innerHTML=`${ctx.tabs('roadmap')}<p><a href="#sub/${e(sid)}">← Subtrack overview</a></p><h1>${e(d.title)}</h1>${previewNote(preview)}
      ${!d.available&&!preview?'<section class="cr-panel"><h2>Learning content in preparation</h2><p>Written lessons will appear after content review. You can still explore the canonical requirements and any published comprehensive assessment.</p>'+a('#sub/'+sid,'View requirements')+'</section>':`
      <p class="cr-small">${preview?'Review version '+d.version:p.completed+' of '+p.total+' lessons completed through reading and lesson quizzes. '}${!preview&&p.mastered_by_assessment?'Knowledge requirement met by comprehensive assessment; unread lessons remain unread.':''}</p>
      ${!preview&&p.resume?a(p.resume.href,'Continue '+p.resume.title,true):''}
      <p class="cr-small cr-muted">Lesson and module quizzes need ${d.pass_mark}% overall. Module checkpoints also require all objectives to be attempted and each key competency to reach ${d.pass_mark}%. They record learning progress, not comprehensive mastery. Reading does not require video.</p>
      ${d.modules.map((m,i)=>{const pm=p.modules.find(x=>x.id===m.id);return `<section class="cr-panel cl-module"><h2>Module ${i+1}: ${e(m.title)}</h2><ol class="cx-checklist">${m.lessons.map(l=>{const pl=p.lessons.find(x=>x.id===l.id);return `<li><div><a href="${e(l.href)}">${e(l.title)}</a><small>${preview?'Draft':pl?.completed?'Read and quiz passed':pl?.read?'Read; quiz still needed':pl?.quiz_passed?'Quiz passed; reading not recorded':'Not started'}</small></div></li>`;}).join('')}</ol>${!preview&&learner(ctx)?`<button class="cr-btn ghost" data-checkpoint="${e(m.id)}"${pm?.completed_lessons===m.lessons.length?'':' disabled'}>${pm?.checkpoint_passed?'Practice checkpoint again':'Take module checkpoint'}</button><p class="cr-small">${pm?.checkpoint_passed?'Checkpoint passed. Earlier attempts remain in history.':'Read each lesson and pass its quiz to open this checkpoint.'}</p>`:''}</section>`;}).join('')}
      ${!preview?a('#sub/'+sid,'Take the comprehensive quiz'):''}`}
      <p id="clStatus" class="cr-note" role="status"></p>`;
    window.scrollTo(0,0);
    ctx.root.querySelectorAll('[data-checkpoint]').forEach(b=>b.onclick=()=>start(ctx,sid,'module',b.dataset.checkpoint,b));
  }
  async function lesson(ctx,sid,id,preview) {
    const url=(preview?'/api/admin/career/learning/':'/api/career/learning/')+encodeURIComponent(sid)+'/lessons/'+encodeURIComponent(id);
    const l=await ctx.api(url), base=preview?'#learn-preview/':'#learn/';
    document.title=l.title+' | EchoLens';
    ctx.root.innerHTML=`${ctx.tabs('roadmap')}<nav class="cu-crumbs" aria-label="Lesson breadcrumb"><a href="${base+e(sid)}">${e(l.course.title)}</a><span>›</span><span>${e(l.module.title)}</span></nav>${previewNote(preview)}
      <div class="cl-layout"><aside class="cl-navigation"><details id="clModuleNav" open><summary>${e(l.module.title)}</summary><nav aria-label="Module lessons">${l.module.lessons.map(x=>`<a href="${e(x.href)}"${x.id===id?' aria-current="page"':''}>${e(x.title)}</a>`).join('')}</nav></details><p class="cr-small">${e(l.progress.completed)} / ${e(l.progress.total)} lessons completed</p>${a(base+sid,'All modules')}</aside>
      <article class="cl-reading"><header><span class="cx-eyebrow">${e(l.course.title)} · version ${e(l.course.version)}</span><h1>${e(l.title)}</h1><h2>Learning objectives</h2>${list(l.objectives.map(o=>o.text))}<h2>Before you begin</h2><p>${e(l.prerequisite_note)}</p>${l.course.prerequisites?.length?`<p>Prerequisite roadmap: ${l.course.prerequisites.map(s=>`<a href="#sub/${e(s.id)}">${e(s.title)}</a>`).join(', ')}. Roadmap outlines remain available while unpublished lessons are being prepared.</p>`:''}${l.prerequisites.length?`<p>Previous lesson: ${l.prerequisites.map(id=>`<a href="${preview?'#lesson-preview/':'#lesson/'}${e(sid)}/${e(id)}">Review prerequisites</a>`).join(', ')}</p>`:''}<p class="cl-introduction">${e(l.introduction)}</p></header>
      ${l.sections.map((s,index)=>`<section><h2>${e(s.heading)}</h2>${s.paragraphs.map(p=>`<p>${e(p)}</p>`).join('')}${s.table?`<div class="cl-table-scroll" tabindex="0" role="region" aria-label="${e(s.heading)} table"><table class="cr-table"><thead><tr>${s.table.headers.map(h=>`<th scope="col">${e(h)}</th>`).join('')}</tr></thead><tbody>${s.table.rows.map(row=>`<tr>${row.map(v=>`<td>${e(v)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`:''}${s.snippet?CareerUI.code(s.snippet.code,s.snippet.lang)+`<button class="cr-btn ghost cr-btn-sm" data-cl-snippet="${index}">Copy ${e(s.snippet.lang.toUpperCase())} example</button>`:''}${s.diagram?`<pre class="cl-diagram" tabindex="0" aria-label="Reference relationships">${e(s.diagram)}</pre>`:''}</section>`).join('')}
      <section><h2>Worked example</h2><p>${e(l.worked.problem)}</p><ol>${l.worked.steps.map(s=>`<li>${e(s)}</li>`).join('')}</ol>${CareerUI.code(l.worked.code,l.worked.lang||'Python')}<button class="cr-btn ghost cr-btn-sm" id="clCopy">Copy example</button><h3>Expected output</h3><pre class="cl-output" tabindex="0">${e(l.worked.expect)}</pre><p>${e(l.worked.explanation)}</p></section>
      <section><h2>Common mistakes</h2>${list(l.mistakes)}</section><section><h2>Key takeaways</h2>${list(l.takeaways)}</section>
      ${l.video?`<section><h2>Optional video</h2><p><a href="${e(l.video.url)}" target="_blank" rel="noopener noreferrer">${e(l.video.title)}</a></p><p class="cr-small">Optional reference; watching it is not required for lesson completion.</p></section>`:''}<section><h2>References and optional practice</h2><ul>${l.references.map(r=>`<li><a href="${e(r.url)}" target="_blank" rel="noopener noreferrer">${e(r.title)}</a></li>`).join('')}${l.reuse.map(r=>`<li><a href="/open#course/${e(r.track)}">Existing CS-104 practice: lesson ${e(r.level)}</a> (optional; existing enrollment and grading rules apply)</li>`).join('')}</ul><p class="cr-small">The written explanations above are sufficient for this lesson. Videos and coding quests are optional.</p></section>
      <section class="cr-panel"><h2>Quick knowledge check</h2><p>${l.quiz_items} objective questions · ${l.pass_mark}% to pass. This practice does not award comprehensive mastery.</p>${!preview&&learner(ctx)?'<button class="cr-btn" id="clPractice">Mark read and take lesson quiz</button>':!preview&&!ctx.ME?a(ctx.loginUrl(),'Sign in to save progress and practice'):'<p>Quiz interactions are available to learners after human approval and publication.</p>'}<p id="clStatus" role="status" class="cr-small">${preview?'Preview does not change student progress.':ctx.ME?'Saving your reading position…':'You can read publicly. Sign in when you want to save progress.'}</p></section>
      <nav class="cr-actions cl-next" aria-label="Lesson navigation">${l.previous?a(l.previous,'Previous lesson'):''}${l.next?a(l.next,'Next lesson'):a(base+sid,'Continue to module checkpoint')}</nav></article></div>`;
    window.scrollTo(0,0);
    $('clModuleNav').open=window.matchMedia('(min-width:761px)').matches;
    ctx.root.querySelectorAll('[data-cl-snippet]').forEach(b=>b.onclick=async()=>{try{await navigator.clipboard.writeText(l.sections[Number(b.dataset.clSnippet)].snippet.code);b.textContent='Copied';}catch{b.textContent='Select and copy the example above';}});
    $('clCopy').onclick=async()=>{try{await navigator.clipboard.writeText(l.worked.code);$('clCopy').textContent='Copied';}catch{$('clCopy').textContent='Select and copy the example above';}};
    const save=async read=>ctx.api(`/api/career/me/learning/${sid}/lessons/${id}`,{method:'POST',body:{read,expected_user_id:ctx.ME.id}});
    if(!preview&&learner(ctx)) {
      try{await save(false);$('clStatus').textContent='Reading position saved. Mark read when you are ready to practice.';}catch(err){$('clStatus').textContent='Position was not saved: '+err.message;}
      $('clPractice').onclick=async()=>{const b=$('clPractice');b.disabled=true;try{await save(true);await start(ctx,sid,'lesson',id,b);}catch(err){b.disabled=false;$('clStatus').textContent='Progress could not be saved. '+err.message;}};
    }
  }
  async function result(ctx,r) {
    const d=await ctx.api('/api/career/learning/'+r.formative.subtrack), p=d.progress;
    ctx.root.innerHTML=`${ctx.tabs('history')}<h1>${e(r.title)}</h1><section class="cr-panel"><h2>${r.overall}% · ${e(r.outcome_label)}</h2><p>${e(r.note)}</p><p class="cr-small">Learning content version ${r.formative.content_version}. Historical scores and explanations use the version delivered to you.</p><p>${r.answered} of ${r.total} answered. Pass mark ${r.pass_mark}%; key competencies also need ${r.critical_min}% and all objectives need evidence.</p>${r.critical_gaps.length?`<p class="cr-note warn">Key competencies needing review: ${r.critical_gaps.map(c=>e(c.text)+(c.score==null?' (not assessed)':' ('+c.score+'%)')).join('; ')}.</p>`:''}<div class="cr-actions">${p.resume?a(p.resume.href,'Continue '+p.resume.title,true):p.learned&&!p.mastered_by_assessment?a('#sub/'+r.formative.subtrack,'Take the comprehensive quiz',true):a('#learn/'+r.formative.subtrack,'Review modules',true)}${a('#history','Learning history')}</div></section>
      ${r.learning_areas.flatMap(m=>m.lessons||[]).length?`<section class="cr-panel"><h2>Review these lessons</h2>${r.learning_areas.flatMap(m=>m.lessons||[]).map(l=>`<p><a href="${e(l.href)}">${e(l.title)}</a></p>`).join('')}</section>`:''}<section><h2>Explanatory feedback</h2>${r.feedback.map(q=>`<article class="cr-panel"><p class="cr-tag">${q.correct?'Correct':q.answered?'Review this concept':'Not answered'}</p><h3>${e(q.prompt)}</h3><p><b>Correct answer:</b> ${e(q.correct_answer)}</p><p>${e(q.explanation)}</p></article>`).join('')}</section>${a('#learn/'+r.formative.subtrack,'Back to learning')}`;
    window.scrollTo(0,0);
  }
  window.CareerLearning={views:['learn','lesson','learn-preview','lesson-preview'],result,render:(ctx,view,sid,id)=>view.startsWith('lesson')?lesson(ctx,sid,id,view.endsWith('preview')):overview(ctx,sid,view.endsWith('preview'))};
})();
