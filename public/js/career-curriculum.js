'use strict';
/*
 * EchoLens career curriculum views, drawn into #career by career.js:
 *   #path/<track>     job roles and subtracks of a track, in learning order
 *   #role/<id>        required and optional subtracks for a job role, readiness
 *   #sub/<id>         subtrack: modules, competencies, assessment, attempts
 *   #stake            comprehensive assessment in progress (one question per screen)
 *   #sres/<attempt>   result breakdown by competency, difficulty and scenario
 * Scores, outcomes and availability come from the server; nothing here grades.
 */
(() => {
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const LEVEL = { foundation: 'Foundation', beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced' };
  const DEPTH = ['', 'Awareness', 'Working knowledge', 'Applied', 'Expert'];
  const DIFF = { easy: 'Easy', medium: 'Medium', hard: 'Hard', advanced: 'Advanced' };
  const OUTCOME_TONE = { passed: 'ok', further_evidence_required: 'warn', learning_recommended: 'info', not_attempted: 'idle', expired: 'idle' };
  const fmtDate = (iso) => { const d = new Date(iso); return isNaN(d) ? '' : d.toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Karachi' }); };
  const pill = (text, tone = 'idle') => `<span class="cu-pill" data-tone="${tone}">${esc(text)}</span>`;
  const bar = (v) => `<span class="cr-bar" role="img" aria-label="${v == null ? 'Not assessed' : v + ' percent'}"><i style="width:${v || 0}%"></i></span>`;
  const availTone = (st) => ({ published: 'ok', ready: 'info', draft: 'idle', planned: 'idle' }[st] || 'idle');
  let ATT = null, IDX = 0, SAVE = null, TICK = null;

  function studentPill(s) {
    if (!s) return '';
    return pill(s.label || 'Not attempted', OUTCOME_TONE[s.status] || 'idle') + (s.best_score != null ? ` <span class="cr-small cr-muted">Best ${s.best_score}%</span>` : '');
  }
  function subRow(ctx, s, n) {
    return `<a class="cu-sub" href="#sub/${esc(s.id)}">
      ${n != null ? `<span class="cu-num" aria-hidden="true">${n}</span>` : ''}
      <span class="cu-sub-main"><b>${esc(s.title)}</b>
        <span class="cu-meta">${esc(LEVEL[s.level] || s.level)} · ${esc(DEPTH[s.depth] || '')} · about ${esc(s.hours)} hours · ${s.modules} modules${s.prerequisite_added ? ' · <span class="cu-pre">prerequisite</span>' : ''}</span></span>
      <span class="cu-sub-side">${pill(s.assessment.label, availTone(s.assessment.state))}${ctx.ME ? ' ' + studentPill(s.student) : ''}</span></a>`;
  }

  /* --------------------------------- track path --------------------------------- */
  async function viewPath(ctx, slug) {
    const [v, tracks] = await Promise.all([ctx.api('/api/career/curriculum/tracks/' + encodeURIComponent(slug)), ctx.api('/api/career/tracks')]);
    const t = tracks.tracks.find((x) => x.slug === slug) || { title: slug };
    document.title = `${t.title}: roles and subtracks | EchoLens`;
    let n = 0;
    ctx.root.innerHTML = `${ctx.tabs('tracks')}
      <nav class="cu-crumbs" aria-label="Breadcrumb"><a href="#tracks">Career tracks</a><span aria-hidden="true">›</span><a href="#track/${esc(slug)}">${esc(t.title)}</a><span aria-hidden="true">›</span><span>Roles and subtracks</span></nav>
      <section class="cu-head"><h1>${esc(t.title)}</h1>
        <p>Pick the job role you are aiming for to see exactly which subtracks it needs, in the order to learn them. Each subtrack ends with a comprehensive knowledge assessment. Results show the <b>${esc(v.label)}</b> measured by quizzes; they are not a professional certification.</p></section>
      <h2>Job roles in this track</h2>
      <div class="cu-roles">${v.roles.map((r) => `<a class="cu-role" href="#role/${esc(r.id)}"><b>${esc(r.title)}</b><span>${esc(r.description)}</span>
        <span class="cu-meta">${r.required} required · ${r.optional} optional${r.readiness ? ` · ${r.readiness.passed} of ${r.readiness.required} passed` : ''}</span></a>`).join('')}</div>
      <h2>All subtracks, in learning order</h2>
      ${v.order.map((e) => `<section class="cu-stage"><h3>${esc(e.title)}</h3>${e.subtracks.map((s) => subRow(ctx, s, ++n)).join('')}</section>`).join('')}
      ${v.variants.length ? `<section class="cu-stage"><h3>Specialisation options</h3><p class="cr-small cr-muted">Alternatives used by some job roles in this track.</p>${v.variants.map((s) => subRow(ctx, s)).join('')}</section>` : ''}`;
  }

  /* ---------------------------------- role ---------------------------------- */
  async function viewRole(ctx, id) {
    const r = await ctx.api('/api/career/curriculum/roles/' + encodeURIComponent(id));
    document.title = `${r.title} | EchoLens Career Paths`;
    const jdText = r.jd.status === 'jd_reviewed' ? 'Requirements reviewed against current job listings by the EchoLens team.'
      : r.jd.status === 'jd_verification_required' ? 'JD verification required: these requirements are an EchoLens draft and have not yet been checked against current job listings.'
        : 'Draft: requirements were summarised from public job listings and are awaiting verification by the EchoLens team.';
    const rd = r.readiness;
    ctx.root.innerHTML = `${ctx.tabs('tracks')}
      <nav class="cu-crumbs" aria-label="Breadcrumb"><a href="#tracks">Career tracks</a><span aria-hidden="true">›</span><a href="#path/${esc(r.track)}">Roles and subtracks</a><span aria-hidden="true">›</span><span>${esc(r.title)}</span></nav>
      <section class="cu-head"><h1>${esc(r.title)}</h1><p>${esc(r.description)}</p>
        ${rd ? `<div class="cu-ready"><span class="cu-ready-label">${esc(rd.label)}</span><b>${esc(rd.text)}</b>${bar(rd.required ? Math.round((rd.passed / rd.required) * 100) : 0)}</div>` : ''}</section>
      ${ctx.learner() ? `<div class="cx-next"><div><b>Make this your next destination</b><p>Your target role connects these assessments to your career dashboard.</p></div><button class="cr-btn" id="cuTarget">Set as my target role</button><span id="cuTargetMsg" role="status"></span></div>` : ''}
      <div class="cr-cols"><div>
        <h2>Required subtracks</h2><p class="cr-small cr-muted">In prerequisite order. Subtracks marked prerequisite are needed by a later subtrack even though the role does not list them directly.</p>
        <div class="cu-list">${r.required.map((s, i) => subRow(ctx, s, i + 1)).join('')}</div>
        ${r.optional.length ? `<details class="cr-panel"><summary>Optional subtracks (${r.optional.length})</summary><p class="cr-small cr-muted">Useful for this role, but not needed for readiness.</p><div class="cu-list">${r.optional.map((s) => subRow(ctx, s)).join('')}</div></details>` : ''}
      </div><aside>
        <div class="cr-panel"><h3>Role final assessment</h3>
          <p class="cr-small">${r.final_assessment.items} questions, ${r.final_assessment.minutes} minutes, drawn from every required subtrack with most questions set in workplace scenarios.</p>
          ${r.final_assessment.state === 'published' && ctx.learner() ? `<button class="cr-btn" id="cuRoleStart">Start the final assessment</button>` : pill(r.final_assessment.state === 'published' ? 'Available' : 'Opens when every required subtrack assessment is available', r.final_assessment.state === 'published' ? 'ok' : 'idle')}
          <p class="cr-small cu-err" id="cuRoleMsg" role="alert"></p></div>
        <div class="cr-panel"><h3>Typical responsibilities</h3><ul>${r.responsibilities.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>
        <div class="cr-panel"><h3>How these requirements were set</h3><p class="cr-small">${esc(jdText)}</p>
          ${r.jd.observed?.length ? `<p class="cr-small"><b>Common in listings:</b></p><ul class="cr-small">${r.jd.observed.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}</div>
      </aside></div>`;
    const target = document.getElementById('cuTarget');
    if (target) target.onclick = async () => { target.disabled = true; try { await ctx.api('/api/career/me/target', { method: 'PUT', body: { role: id } }); document.getElementById('cuTargetMsg').innerHTML = 'Target saved. <a href="#me">Open your dashboard</a>'; target.textContent = 'Target role saved'; } catch (e) { target.disabled = false; document.getElementById('cuTargetMsg').textContent = e.message; } };
    const b = document.getElementById('cuRoleStart');
    if (b) b.onclick = () => startAndGo(ctx, '/api/career/me/st/roles/' + encodeURIComponent(id) + '/start', b, 'cuRoleMsg');
  }

  /* -------------------------------- subtrack -------------------------------- */
  async function viewSub(ctx, id) {
    const s = await ctx.api('/api/career/curriculum/subtracks/' + encodeURIComponent(id));
    document.title = `${s.title} | EchoLens Career Paths`;
    const a = s.assessment, st = s.student, last = st?.attempts_list?.[0];
    const crit = s.modules.reduce((n, m) => n + m.objectives.filter((o) => o.critical).length, 0);
    let action = '';
    if (a.state === 'published') action = ctx.learner() ? `<button class="cr-btn" id="cuStart">${st && st.attempts ? 'Retake the assessment' : 'Take assessment'}</button>`
      : ctx.ME ? '<p class="cr-small cr-muted">Assessments are for learner accounts.</p>' : `<a class="cr-btn" href="${ctx.loginUrl()}">Sign in to take the assessment</a>`;
    ctx.root.innerHTML = `${ctx.tabs('tracks')}
      <nav class="cu-crumbs" aria-label="Breadcrumb"><a href="#tracks">Career tracks</a>${s.tracks[0] ? `<span aria-hidden="true">›</span><a href="#path/${esc(s.tracks[0])}">Roles and subtracks</a>` : ''}<span aria-hidden="true">›</span><span>${esc(s.title)}</span></nav>
      <section class="cu-head"><h1>${esc(s.title)}</h1><p>${esc(s.description)}</p>
        <div class="cr-tags"><span class="cr-tag teal">${esc(LEVEL[s.level])}</span><span class="cr-tag">${esc(DEPTH[s.depth])}</span><span class="cr-tag">About ${esc(s.hours)} hours</span><span class="cr-tag">${s.modules.length} modules</span></div></section>
      <div class="cx-choices"><section class="cx-choice"><span class="cx-eyebrow">Show what you know</span><h2>I already know this</h2><p>Demonstrate your knowledge with a comprehensive assessment. Results count toward every role that needs this subtrack.</p>${action || `<p class="cx-unavailable">${esc(a.label)}. Your learning plan is available below.</p>`}<p id="cuMsg" role="alert" class="cu-err"></p></section><section class="cx-choice"><span class="cx-eyebrow">Build your foundation</span><h2>Start learning from the beginning</h2><p>Explore the planned modules and the skills you will develop, at your own pace.</p><a class="cr-btn ghost" href="#cuModules" id="cuOutline">Explore the learning outline</a><p class="cx-unavailable">Learning content in preparation. Lessons are not available yet.</p></section></div>
      <div class="cr-cols"><div>
        ${s.prereq.length ? `<h2>Before you start</h2><div class="cu-list">${s.prereq.map((p) => `<a class="cu-sub" href="#sub/${esc(p.id)}"><span class="cu-sub-main"><b>${esc(p.title)}</b></span><span class="cu-sub-side">${p.student ? studentPill(p.student) : ''}</span></a>`).join('')}</div>` : ''}
        <h2 id="cuModules" tabindex="-1">Modules and competencies</h2>
        <p class="cr-small cr-muted">Competencies marked <span class="cu-key">Key</span> must each be shown in the assessment; a high overall score cannot make up for them.</p>
        ${s.modules.map((m, i) => `<details class="cu-module"${i === 0 ? ' open' : ''}><summary>Module ${i + 1}: ${esc(m.title)} <span class="cr-small cr-muted">· ${esc(m.content)}</span></summary>
          <ul>${m.objectives.map((o) => { const ev = st?.evidence?.[o.id] || last?.competencies?.find((c) => c.id === o.id); return `<li>${o.critical ? '<span class="cu-key">Key</span> ' : ''}${esc(o.text)}${ev && ev.score != null ? ` <span class="cu-score" data-tone="${ev.score >= a.critical_min ? 'ok' : 'warn'}">${ev.score}%</span>` : ''}</li>`; }).join('')}</ul></details>`).join('')}
      </div><aside>
        <div class="cr-panel cu-assess"><h3>Comprehensive assessment</h3>${pill(a.label, availTone(a.state))}
          <dl class="cu-facts"><div><dt>Questions</dt><dd>${a.items}</dd></div><div><dt>Time</dt><dd>${a.minutes} min</dd></div><div><dt>Pass mark</dt><dd>${a.pass_mark}%</dd></div><div><dt>Key skills</dt><dd>${crit}, each at ${a.critical_min}%</dd></div></dl>
          <p class="cr-small cr-muted">Mix: ${a.mix.easy}% easy, ${a.mix.medium}% medium, ${a.mix.hard}% hard, ${a.mix.advanced}% advanced. About ${a.scenario_share}% of questions are set in workplace scenarios. No negative marking; unanswered questions score zero.${a.retakes === 'limited' ? ' The question bank is still growing, so retakes are spaced further apart.' : ''}</p>
          <p class="cr-small">Choose an assessment or learning outline above.</p></div>
        ${st ? `<div class="cr-panel"><h3>Your status</h3>${studentPill(st)}
          ${st.status === 'passed' && st.last_score !== st.best_score ? `<p class="cr-small">Your latest attempt scored ${st.last_score}%. Your earlier qualifying pass remains valid; the competency evidence below is from that pass.</p>` : ''}
          ${st.valid_until ? `<p class="cr-small cr-muted">Evidence valid until ${esc(fmtDate(st.valid_until))}. It counts in every track and role that uses this subtrack.</p>` : ''}
          ${last ? `${last.strongest.length ? `<p class="cr-small"><b>Strongest:</b> ${last.strongest.map((c) => esc(c.text)).join('; ')}</p>` : ''}${last.weakest.length ? `<p class="cr-small"><b>To work on:</b> ${last.weakest.map((c) => esc(c.text)).join('; ')}</p>` : ''}` : ''}
          ${st.attempts_list?.length ? `<h4 class="cu-h4">Attempts</h4><ul class="cu-attempts">${st.attempts_list.map((x) => `<li><a href="#sres/${esc(x.id)}">${esc(fmtDate(x.submitted_at))}</a><span>${x.overall}% · ${esc(x.outcome_label)}</span></li>`).join('')}</ul>` : ''}</div>` : ''}
        <div class="cr-panel"><h3>Used in</h3><ul class="cr-small">${s.roles.map((r) => `<li><a href="#role/${esc(r.id)}">${esc(r.title)}</a>${r.mandatory ? '' : ' <span class="cr-muted">(optional)</span>'}</li>`).join('') || '<li>No job role yet</li>'}</ul></div>
      </aside></div>`;
    document.getElementById('cuOutline').onclick = e => { e.preventDefault(); document.getElementById('cuModules').scrollIntoView({ block: 'start' }); document.getElementById('cuModules').focus({ preventScroll: true }); };
    const b = document.getElementById('cuStart');
    if (b) b.onclick = () => startAndGo(ctx, '/api/career/me/st/subtracks/' + encodeURIComponent(id) + '/start', b, 'cuMsg');
  }
  async function startAndGo(ctx, url, btn, msgId) {
    btn.disabled = true;
    try { ATT = (await ctx.api(url, { method: 'POST' })).attempt; IDX = 0; location.hash = '#stake'; }
    catch (e) {
      btn.disabled = false;
      if (e.status === 401) { location.href = ctx.loginUrl(); return; }
      document.getElementById(msgId).innerHTML = esc(e.message) + (e.data?.active ? ' <a href="#stake">Continue your current assessment</a>' : '');
    }
  }

  /* --------------------------------- taking --------------------------------- */
  const draftKey = (ctx, a) => `elCareerDraft:${ctx.ME.id}:${a.id}`;
  const flagsFor = (ctx, a) => { try { return JSON.parse(localStorage.getItem(`elCareerFlags:${ctx.ME.id}:${a.id}`) || '{}'); } catch { return {}; } };
  let SAVE_STATE = 'All changes saved', SAVE_ERROR = false, SAVING = null, ACTIVE_CTX = null, RECOVERED = false;
  function saveStatus() {
    const el = document.getElementById('cuSave');
    if (el) { el.dataset.error = String(SAVE_ERROR); el.innerHTML = esc(SAVE_STATE) + (SAVE_ERROR ? ' <button type="button" id="cuSaveRetry">Retry saving</button>' : ''); const b = document.getElementById('cuSaveRetry'); if (b) b.onclick = () => saveProgress(ACTIVE_CTX); }
  }
  async function viewTake(ctx) {
    if (!ctx.ME) { location.href = ctx.loginUrl(); return; }
    ACTIVE_CTX = ctx;
    if (!ATT) {
      ATT = (await ctx.api('/api/career/me/st/active')).attempt;
      if (ATT) {
        try { const draft = JSON.parse(sessionStorage.getItem(draftKey(ctx, ATT)) || '{}'), saved = JSON.stringify(ATT.answers); ATT.answers = { ...ATT.answers, ...Object.fromEntries(Object.entries(draft).filter(([id, value]) => ATT.questions.some(q => q.id === id && q.options.some(o => o.id === value)))) }; RECOVERED = saved !== JSON.stringify(ATT.answers); } catch { /* private browsing */ }
      }
    }
    if (!ATT) { document.body.classList.remove('career-exam'); location.hash = '#tracks'; return; }
    document.body.classList.add('career-exam');
    ATT.answers = ATT.answers || {}; IDX = Math.max(0, Math.min(IDX, ATT.questions.length - 1));
    const qs = ATT.questions, q = qs[IDX], done = Object.keys(ATT.answers).length, flags = flagsFor(ctx, ATT);
    ctx.root.innerHTML = `<div class="cu-take">
      <div class="cr-qbar"><b>${esc(ATT.title)}</b><span class="cu-timer" id="cuTimer" aria-label="Time remaining"></span></div>
      <div class="cx-exam-tools"><a href="#me" id="cuExit">Save and leave</a><span id="cuSave" class="cx-save" role="status" aria-live="polite"></span></div>
      <div class="cr-progress" role="progressbar" aria-label="Assessment questions answered" aria-valuemin="0" aria-valuemax="${qs.length}" aria-valuenow="${done}"><i style="width:${Math.round(done / qs.length * 100)}%"></i></div>
      <div class="cx-exam-tools"><span>Question ${IDX + 1} of ${qs.length} · ${done} answered · ${esc(DIFF[q.difficulty])}${q.scenario ? ' · Workplace scenario' : ''}</span><button class="cx-flag" id="cuFlag" type="button" aria-pressed="${!!flags[q.id]}">${flags[q.id] ? '⚑ Flagged for review' : '⚑ Flag for review'}</button></div>
      <div class="cr-q"><h1 tabindex="-1" id="cuQ">${esc(q.prompt)}</h1>${q.code ? CareerUI.code(q.code, q.lang) : ''}
      <fieldset class="cu-opts"><legend class="sr-only">Choose one answer</legend>${q.options.map((o, i) => `<label class="cr-opt"><input type="radio" name="cuopt" value="${esc(o.id)}"${ATT.answers[q.id] === o.id ? ' checked' : ''}><span><span class="cx-option-letter" aria-hidden="true">${String.fromCharCode(65 + i)}.</span> ${esc(o.text)}</span></label>`).join('')}</fieldset></div>
      <div class="cr-actions"><button class="cr-btn ghost" id="cuPrev"${IDX === 0 ? ' disabled' : ''}>Previous</button>${IDX < qs.length - 1 ? '<button class="cr-btn" id="cuNext">Next question</button>' : ''}<button class="cr-btn ghost" id="cuSubmit">Review and submit</button></div>
      <details class="cx-question-map"><summary>Question overview · ${Object.keys(flags).length} flagged</summary><div class="cr-dots" aria-label="Jump to a question">${qs.map((x, i) => `<button data-i="${i}" data-done="${ATT.answers[x.id] ? 1 : 0}" data-flag="${!!flags[x.id]}"${i === IDX ? ' aria-current="true"' : ''} aria-label="Question ${i + 1}${ATT.answers[x.id] ? ', answered' : ', unanswered'}${flags[x.id] ? ', flagged' : ''}">${i + 1}</button>`).join('')}</div><p class="cr-small cr-muted">Filled: answered. Dashed border: flagged for review.</p></details>
      <p class="cr-small cu-err" id="cuTakeMsg" role="alert"></p></div>`;
    if (RECOVERED) { RECOVERED = false; queueSave(ctx); }
    saveStatus(); document.getElementById('cuQ').focus({ preventScroll: true });
    ctx.root.querySelectorAll('input[name=cuopt]').forEach(r => { r.onchange = () => { ATT.answers[q.id] = r.value; const p = ctx.root.querySelector('[role=progressbar]'); p.setAttribute('aria-valuenow', Object.keys(ATT.answers).length); p.querySelector('i').style.width = `${Object.keys(ATT.answers).length / qs.length * 100}%`; queueSave(ctx); }; });
    const go = i => { IDX = i; viewTake(ctx); };
    document.getElementById('cuPrev').onclick = () => go(IDX - 1);
    const next = document.getElementById('cuNext'); if (next) next.onclick = () => go(IDX + 1);
    document.getElementById('cuFlag').onclick = () => { if (flags[q.id]) delete flags[q.id]; else flags[q.id] = true; try { localStorage.setItem(`elCareerFlags:${ctx.ME.id}:${ATT.id}`, JSON.stringify(flags)); } catch {} viewTake(ctx); };
    ctx.root.querySelectorAll('.cr-dots button').forEach(b => { b.onclick = () => go(Number(b.dataset.i)); });
    document.getElementById('cuExit').onclick = async e => { e.preventDefault(); if (await saveProgress(ctx)) { document.body.classList.remove('career-exam'); location.hash = '#me'; } };
    document.getElementById('cuSubmit').onclick = async () => {
      const left = qs.length - Object.keys(ATT.answers).length, flagged = Object.keys(flags).length;
      if (await CareerUI.dialog('Ready to submit?', `<p>${qs.length - left} of ${qs.length} questions answered.${left ? ` <b>${left} unanswered questions will score zero.</b>` : ''}</p><p>${flagged ? `${flagged} questions are flagged for review. ` : ''}Your answers will be final. You can return to review them before submitting.</p>`, 'Submit assessment', 'Keep reviewing')) await submit(ctx);
    };
    clearInterval(TICK);
    const tick = () => {
      if (!ATT) { clearInterval(TICK); return; }
      const ms = Date.parse(ATT.expires_at) - Date.now(), el = document.getElementById('cuTimer');
      if (!el) { clearInterval(TICK); return; }
      if (ms <= 0) { clearInterval(TICK); el.textContent = 'Time is up'; submit(ctx); return; }
      const total = Math.ceil(ms / 1000); el.textContent = `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')} left`; el.dataset.low = String(ms < 300000 ? 1 : 0);
    }; tick(); TICK = setInterval(tick, 1000);
  }
  function queueSave(ctx) {
    SAVE_STATE = 'Saving your answer…'; SAVE_ERROR = false; saveStatus();
    try { sessionStorage.setItem(draftKey(ctx, ATT), JSON.stringify(ATT.answers)); } catch {}
    clearTimeout(SAVE); SAVE = setTimeout(() => saveProgress(ctx), 400);
  }
  async function saveProgress(ctx) {
    clearTimeout(SAVE); const a = ATT; if (!a) return true;
    const answers = { ...a.answers }, revision = JSON.stringify(answers);
    const pending = (SAVING || Promise.resolve()).catch(() => {}).then(() => ctx.api(`/api/career/me/st/attempts/${a.id}/answers`, { method: 'PUT', body: { answers } }));
    SAVING = pending;
    try {
      await pending;
      if (ATT?.id === a.id && revision === JSON.stringify(ATT.answers)) { SAVE_STATE = 'All changes saved'; SAVE_ERROR = false; }
      saveStatus(); return true;
    } catch (e) { SAVE_STATE = e.status === 409 ? e.message : 'Not saved. Your answers are kept in this browser.'; SAVE_ERROR = true; saveStatus(); return false; }
    finally { if (SAVING === pending) SAVING = null; }
  }
  window.addEventListener('online', () => { if (ATT && ACTIVE_CTX && SAVE_ERROR) saveProgress(ACTIVE_CTX); });
  window.addEventListener('beforeunload', e => { if (ATT && (SAVE_ERROR || SAVING || SAVE_STATE !== 'All changes saved')) { e.preventDefault(); e.returnValue = ''; } });
  async function submit(ctx) {
    clearTimeout(SAVE); clearInterval(TICK); const a = ATT; if (!a) return;
    const btn = document.getElementById('cuSubmit'); if (btn) btn.disabled = true;
    try {
      if (SAVING) await SAVING.catch(() => {});
      const out = await ctx.api(`/api/career/me/st/attempts/${a.id}/submit`, { method: 'POST', body: { answers: a.answers } });
      try { sessionStorage.removeItem(draftKey(ctx, a)); localStorage.removeItem(`elCareerFlags:${ctx.ME.id}:${a.id}`); } catch {}
      ATT = null; RESULT = out.result; document.body.classList.remove('career-exam'); location.hash = '#sres/' + out.result.id;
    } catch (e) { if (btn) btn.disabled = false; const m = document.getElementById('cuTakeMsg'); if (m) m.textContent = `${e.message} Your answers are still in this browser. Try submitting again.`; }
  }

  /* -------------------------------- results -------------------------------- */
  let RESULT = null;
  async function viewResult(ctx, id) {
    if (!ctx.ME) { location.href = ctx.loginUrl(); return; }
    let r = RESULT && RESULT.id === id ? RESULT : null;
    if (!r) r = (await ctx.api('/api/career/me/st/history')).attempts.find((x) => x.id === id);
    if (!r) { ctx.root.innerHTML = `${ctx.tabs('')}<p class="cr-err" role="alert">That result was not found.</p>`; return; }
    const review = (await ctx.api(`/api/career/me/st/attempts/${encodeURIComponent(id)}/review`)).review;
    const sub = r.key.startsWith('subtrack:') ? r.key.slice(9) : null;
    const head = { passed: 'You met every assessed requirement', further_evidence_required: 'Strong overall, but a key skill needs more evidence', learning_recommended: 'Some areas need more learning first' }[r.outcome];
    const byComp = [...r.competencies].sort((a, b) => (a.score ?? -1) - (b.score ?? -1));
    ctx.root.innerHTML = `${ctx.tabs('')}
      <nav class="cu-crumbs" aria-label="Breadcrumb">${sub ? `<a href="#sub/${esc(sub)}">Back to the subtrack</a>` : '<a href="#tracks">Career tracks</a>'}</nav>
      <section class="cu-head cu-result" data-tone="${OUTCOME_TONE[r.outcome]}"><span class="cu-ready-label">${esc(r.label)}</span>
        <h1>${esc(r.title)}</h1><div class="cu-score-big"><b>${r.overall}%</b><span>${esc(r.outcome_label)}</span></div>
        <p><b>${esc(head)}.</b> ${r.correct} of ${r.total} correct, ${r.answered} answered. Pass mark ${r.pass_mark}%, and every key skill at ${r.critical_min}% or more.${r.timed_out ? ' Time ran out, so your saved answers were graded.' : ''}</p>
        <p class="cr-small cr-muted">${esc(r.note)}</p></section>
      <div class="cx-result-actions">${sub ? `<a class="cr-btn" href="#sub/${esc(sub)}">${r.outcome === 'passed' ? 'Continue your learning plan' : 'Review recommended topics'}</a>` : ''}<a class="cr-btn ghost" href="#me">My career dashboard</a></div><div class="cx-result-summary"><article><span class="cx-eyebrow">Assessment coverage</span><h3>${r.answered} of ${r.total} questions answered</h3><p class="cr-small">${r.unassessed.length} competencies need evidence. Knowledge scores do not represent lesson completion or practical job readiness.</p></article><article><span class="cx-eyebrow">What you demonstrated</span><h3>${r.outcome === 'passed' ? 'A skill checkpoint reached' : 'A useful starting point'}</h3><ul>${r.strongest.filter(c => c.score >= r.critical_min).map(c => `<li>${esc(c.text)}</li>`).join('') || '<li>Your next assessment can build evidence of your strengths.</li>'}</ul></article></div>
      ${r.critical_gaps.length ? `<div class="cr-note warn"><b>Key skills that need more evidence:</b> ${r.critical_gaps.map((c) => esc(c.text) + (c.score != null ? ` (${c.score}%)` : '')).join('; ')}</div>` : ''}
      <div class="cu-split">
        <div class="cr-panel"><h3>By difficulty</h3>${Object.entries(r.by_difficulty).map(([k, v]) => `<div class="cu-row"><span>${esc(DIFF[k])}</span>${bar(v.score)}<b>${v.correct}/${v.items}</b></div>`).join('')}</div>
        <div class="cr-panel"><h3>Scenario and foundational</h3>${[['scenario', 'Workplace scenarios'], ['foundational', 'Foundational knowledge']].filter(([k]) => r.by_scenario[k].items).map(([k, l]) => `<div class="cu-row"><span>${l}</span>${bar(r.by_scenario[k].score)}<b>${r.by_scenario[k].correct}/${r.by_scenario[k].items}</b></div>`).join('')}</div>
      </div>
      <h2>By competency</h2>
      <div class="cr-panel">${byComp.map((c) => `<div class="cu-row cu-comp"><span>${c.critical ? '<span class="cu-key">Key</span> ' : ''}${esc(c.text)}<small>${esc(c.module)}</small></span>${bar(c.score)}<b>${c.score == null ? 'Not assessed' : c.score + '%'}</b></div>`).join('')}</div>
      ${r.learning_areas.length ? `<h2>Recommended learning</h2><div class="cu-learn">${r.learning_areas.map((a) => `<div class="cr-panel"><h3>${esc(a.module)}</h3><p class="cr-small cr-muted">${esc(a.subtrack)}</p><ul class="cr-small">${a.objectives.map((o) => `<li>${esc(o)}</li>`).join('')}</ul>${pill(a.content, 'idle')}</div>`).join('')}</div>` : ''}
      <h2>Question review</h2><p class="cr-small cr-muted">Correct answers are not shown, because the same question bank is used for retakes. Explanations appear for questions you answered correctly.</p>
      ${review.map((q, i) => `<div class="cr-review" data-correct="${q.correct ? 1 : 0}"><p class="cr-small"><b>${i + 1}. ${q.correct ? 'Correct' : q.answered ? 'Incorrect' : 'Not answered'}</b> · ${esc(DIFF[q.difficulty])} · ${esc(q.competency)}</p><p>${esc(q.prompt)}</p>${q.explanation ? `<p class="cr-small cr-muted">${esc(q.explanation)}</p>` : ''}</div>`).join('')}
      <div class="cr-actions">${sub ? `<a class="cr-btn" href="#sub/${esc(sub)}">Back to ${esc(r.title.split(':')[0])}</a>` : ''}<a class="cr-btn ghost" href="#tracks">Career tracks</a></div>`;
  }

  async function render(ctx, view, arg) {
    clearInterval(TICK);
    document.body.classList.toggle('career-exam', view === 'stake');
    if (view === 'path') return viewPath(ctx, arg);
    if (view === 'role') return viewRole(ctx, arg);
    if (view === 'sub') return viewSub(ctx, arg);
    if (view === 'stake') return viewTake(ctx);
    if (view === 'sres') return viewResult(ctx, arg);
  }
  window.CareerCurriculum = { render, views: ['path', 'role', 'sub', 'stake', 'sres'] };
})();
