'use strict';
/*
 * EchoLens career paths (/career). One small hash-routed app:
 *   #tracks            explore the 12 tracks (public)
 *   #track/<slug>      track detail (public)
 *   #me                my career dashboard
 *   #onboarding        optional preferences
 *   #assess/<key>      assessment intro -> #take (one question per screen)
 *   #result/<id>       attempt result and answer review
 *   #report            skill report, gaps and recommendations
 *   #roadmap           personalised six-stage roadmap and my projects
 *   #history           attempts and skill score history
 * Every score comes from the server; this file only displays it.
 */
(() => {
  const $ = (id) => document.getElementById(id);
  const root = $('career');
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  let ME = null, TRACKS = null, OPTIONS = null, ATTEMPT = null, SAVE_TIMER = null, TICK = null;

  async function api(path, opts = {}) {
    const res = await fetch(path, { credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, ...opts, body: opts.body ? JSON.stringify(opts.body) : undefined });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { const e = new Error(data.error || 'Something went wrong. Please try again.'); e.status = res.status; e.data = data; throw e; }
    return data;
  }
  const loginUrl = () => '/login?returnTo=' + encodeURIComponent(location.pathname + location.hash);
  const fmtDate = (iso) => { const d = new Date(iso); return isNaN(d) ? '' : d.toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Karachi' }); };
  const STATUS_ICON = { 'Strong': '✓', 'Developing': '◐', 'Needs Improvement': '!', 'Critical Prerequisite Gap': '✕', 'Not Yet Assessed': '?', 'Needs Further Assessment': '?' };
  const STATUS_COLOR = { 'Strong': 'var(--teal-ink)', 'Developing': '#7A4A00', 'Needs Improvement': '#8A1C1C', 'Critical Prerequisite Gap': '#8A1C1C', 'Not Yet Assessed': 'var(--muted)', 'Needs Further Assessment': 'var(--muted)' };
  const status = (s) => `<span class="cr-status" data-icon="${STATUS_ICON[s] || ''}" style="color:${STATUS_COLOR[s] || 'inherit'}">${esc(s)}</span>`;
  const tabs = (cur) => `<nav class="cr-tabs" aria-label="Career sections">${[['tracks', 'Career tracks'], ['me', 'My career'], ['report', 'My skill report'], ['roadmap', 'My roadmap'], ['history', 'Assessment history']]
    .map(([k, l]) => `<a href="#${k}"${cur === k ? ' aria-current="page"' : ''}>${l}</a>`).join('')}</nav>`;
  const learner = () => ME && ['free', 'student'].includes(ME.role);
  function needLogin(what) {
    return `${tabs('')}<div class="cr-hero"><h1>${esc(what)}</h1><p>Sign in with your free EchoLens account to take assessments and see your personalised roadmap. Exploring career tracks is open to everyone.</p>
      <div class="cr-actions"><a class="cr-btn" href="${loginUrl()}">Sign in</a><a class="cr-btn ghost" href="/open#signup">Create a free account</a><a class="cr-btn ghost" href="#tracks">Explore tracks</a></div></div>`;
  }
  const notLearner = () => `${tabs('')}<div class="cr-note warn">Assessments and roadmaps are for learner accounts. Staff can preview assessments and manage question banks from the admin portal under <b>Career Assessments</b>.</div>`;
  const fail = (e) => { root.innerHTML = `${tabs('')}<p class="cr-err" role="alert">${esc(e.message)}</p>`; };

  /* ------------------------------- tracks ------------------------------- */
  async function loadTracks() { if (!TRACKS) TRACKS = (await api('/api/career/tracks')).tracks; return TRACKS; }
  async function viewTracks() {
    const tracks = await loadTracks();
    root.innerHTML = `${tabs('tracks')}
      <section class="cr-hero"><h1>Find your technology career path</h1>
        <p>Explore 12 career tracks, take a free skill assessment, and get a roadmap built from EchoLens courses - starting from what you already know. Results guide your learning; they are not an official qualification.</p>
        <div class="cr-actions">${learner() ? '<a class="cr-btn" href="#assess/common">Take the common CS assessment</a><a class="cr-btn ghost" href="#onboarding">Set my career goals</a>' : ME ? '' : `<a class="cr-btn" href="${loginUrl()}">Sign in to get started</a>`}</div></section>
      <div class="cr-filters" role="search">
        <label class="sr-only" for="crQ">Search tracks</label><input id="crQ" type="search" placeholder="Search tracks, skills or tools">
        <label class="sr-only" for="crLevel">Suitable for</label><select id="crLevel"><option value="">Any level</option><option>Beginner</option><option>Intermediate</option><option>Advanced</option></select>
        <label class="sr-only" for="crAssess">Assessment</label><select id="crAssess"><option value="">All tracks</option><option value="1">Assessment available now</option></select>
      </div>
      <p class="cr-muted cr-small" id="crCount"></p>
      <div class="cr-grid" id="crGrid"></div>`;
    const draw = () => {
      const q = $('crQ').value.trim().toLowerCase(), lvl = $('crLevel').value, av = $('crAssess').value;
      const list = tracks.filter((t) => (!lvl || t.suitability.includes(lvl)) && (!av || t.assessment.available)
        && (!q || [t.title, t.summary, ...t.tools, ...t.skills.map((s) => s.name)].join(' ').toLowerCase().includes(q)));
      $('crCount').textContent = `${list.length} of ${tracks.length} tracks`;
      $('crGrid').innerHTML = list.map((t) => `
        <article class="cr-card">
          <h3><a href="#track/${esc(t.slug)}">${esc(t.title)}</a></h3>
          <p>${esc(t.summary)}</p>
          <div class="cr-tags">${t.suitability.map((s) => `<span class="cr-tag">${esc(s)}</span>`).join('')}<span class="cr-tag">${esc(t.duration)}</span></div>
          <div class="cr-tags">${t.assessment.available ? '<span class="cr-tag teal">✓ Assessment available</span>' : '<span class="cr-tag">Assessment coming soon</span>'}</div>
          <div class="cr-actions"><a class="cr-btn ghost" href="#track/${esc(t.slug)}">View track</a></div>
        </article>`).join('') || '<p class="cr-muted">No tracks match those filters.</p>';
    };
    ['crQ', 'crLevel', 'crAssess'].forEach((id) => $(id).addEventListener('input', draw));
    draw();
  }

  async function viewTrack(slug) {
    const t = (await api('/api/career/tracks/' + encodeURIComponent(slug))).track;
    document.title = t.title + ' career track | EchoLens';
    const preferred = ME && ME.career?.preferences?.preferred_track === t.slug;
    root.innerHTML = `${tabs('tracks')}
      <p class="cr-small"><a href="#tracks">&larr; All career tracks</a></p>
      <section class="cr-hero"><h1>${esc(t.title)}</h1><p>${esc(t.overview)}</p>
        <div class="cr-tags">${t.suitability.map((s) => `<span class="cr-tag">${esc(s)}</span>`).join('')}<span class="cr-tag">${esc(t.duration)}</span></div>
        <div class="cr-actions">
          ${learner() ? `<button class="cr-btn${preferred ? ' ghost' : ''}" id="crPick"${preferred ? ' disabled' : ''}>${preferred ? '✓ This is my track' : 'Make this my career track'}</button>` : ''}
          ${t.assessment.available ? `<a class="cr-btn ghost" href="${learner() ? '#assess/' + esc(t.slug) : loginUrl()}">Take the ${esc(t.title)} assessment</a>` : `<span class="cr-tag">${esc(t.assessment.reason || 'Assessment coming soon')}</span>`}
        </div></section>
      <div class="cr-cols"><div>
        <h2>Roadmap</h2>
        ${t.stages.map((st) => `<div class="cr-stage"><div class="cr-stage-head"><h3>Stage ${st.no}: ${esc(st.name)}</h3></div>
          ${st.skills.length ? `<p class="cr-small"><b>Skills:</b> ${st.skills.map((s) => esc(s.name)).join(', ')}</p>` : ''}
          <p class="cr-small"><b>Project:</b> ${st.projects.map(esc).join('; ')}</p><p class="cr-small cr-muted"><b>Done when:</b> ${esc(st.criteria)}</p></div>`).join('')}
      </div><aside>
        <div class="cr-panel"><h3>Prerequisites</h3><ul>${t.prerequisites.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>
        <div class="cr-panel"><h3>What you will learn</h3><ul>${t.outcomes.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>
        <div class="cr-panel"><h3>Core skills</h3><ul>${t.skills.map((s) => `<li>${esc(s.name)}${s.critical ? ' <span class="cr-tag warn">prerequisite</span>' : ''}</li>`).join('')}</ul></div>
        <div class="cr-panel"><h3>Tools</h3><div class="cr-tags">${t.tools.map((x) => `<span class="cr-tag">${esc(x)}</span>`).join('')}</div></div>
        <div class="cr-panel"><h3>EchoLens courses for this track</h3>${t.courses.length ? `<ul>${t.courses.map((c) => `<li><a href="${esc(c.url)}">${esc(c.title)}</a></li>`).join('')}</ul>` : '<p class="cr-muted cr-small">No EchoLens course covers this track yet.</p>'}</div>
        <div class="cr-panel"><h3>Practical assessment</h3><p class="cr-small">${esc(t.practical)}</p></div>
      </aside></div>`;
    const pick = $('crPick');
    if (pick) pick.onclick = async () => { pick.disabled = true; try { await api('/api/career/me/preferences', { method: 'PUT', body: { ...(ME.career?.preferences || {}), preferred_track: t.slug } }); await loadMe(); location.hash = '#roadmap'; } catch (e) { pick.disabled = false; alert(e.message); } };
  }

  /* ------------------------------ onboarding ------------------------------ */
  async function viewOnboarding() {
    if (!ME) { root.innerHTML = needLogin('Set your career goals'); return; }
    if (!learner()) { root.innerHTML = notLearner(); return; }
    if (!OPTIONS) OPTIONS = await api('/api/career/options');
    const p = ME.career?.preferences || {};
    const sel = (name, list, cur) => `<select name="${name}" id="cr-${name}">${list.map((v) => `<option value="${esc(v)}"${v === (cur || '') ? ' selected' : ''}>${esc(v || 'Prefer not to say')}</option>`).join('')}</select>`;
    root.innerHTML = `${tabs('me')}
      <h1>Your career goals</h1><p class="cr-muted">Every question is optional. You can change these at any time, and your courses are never locked behind this form.</p>
      <form class="cr-form cr-panel" id="crOnb">
        <label for="cr-education_level">Current education level</label>${sel('education_level', OPTIONS.preferences.education_level, p.education_level)}
        <label for="cr-experience">Programming experience so far</label>${sel('experience', OPTIONS.preferences.experience, p.experience)}
        <fieldset style="border:0;padding:0;margin:12px 0 0"><legend style="font-weight:600;font-size:14px">Languages you are familiar with</legend>
          ${OPTIONS.languages.map((l) => `<label class="cr-check"><input type="checkbox" name="languages" value="${esc(l)}"${(p.languages || []).includes(l) ? ' checked' : ''}> ${esc(l)}</label>`).join('')}</fieldset>
        <fieldset style="border:0;padding:0;margin:12px 0 0"><legend style="font-weight:600;font-size:14px">Career areas that interest you (choose any)</legend>
          ${OPTIONS.tracks.map((t) => `<label class="cr-check"><input type="checkbox" name="interests" value="${esc(t.slug)}"${(p.interests || []).includes(t.slug) ? ' checked' : ''}> ${esc(t.title)}</label>`).join('')}</fieldset>
        <label for="cr-preferred_track">Preferred career track</label>
        <select name="preferred_track" id="cr-preferred_track"><option value="">Not sure yet</option>${OPTIONS.tracks.map((t) => `<option value="${esc(t.slug)}"${t.slug === p.preferred_track ? ' selected' : ''}>${esc(t.title)}</option>`).join('')}</select>
        <label for="cr-goals">Your learning goal (optional)</label><textarea name="goals" id="cr-goals" rows="3" maxlength="500" placeholder="e.g. get a frontend internship by next summer">${esc(p.goals || '')}</textarea>
        <label for="cr-weekly_hours">Time you can spend each week</label>${sel('weekly_hours', OPTIONS.preferences.weekly_hours, p.weekly_hours)}
        <div class="cr-actions"><button class="cr-btn" type="submit">Save</button><a class="cr-btn ghost" href="#me">Skip for now</a></div>
        <p id="crOnbMsg" role="status" class="cr-small"></p>
      </form>`;
    $('crOnb').addEventListener('submit', async (e) => {
      e.preventDefault(); const f = e.target;
      const body = { education_level: f.education_level.value, experience: f.experience.value, weekly_hours: f.weekly_hours.value, preferred_track: f.preferred_track.value, goals: f.goals.value,
        languages: [...f.querySelectorAll('input[name=languages]:checked')].map((x) => x.value), interests: [...f.querySelectorAll('input[name=interests]:checked')].map((x) => x.value) };
      try { await api('/api/career/me/preferences', { method: 'PUT', body }); await loadMe(); location.hash = '#me'; } catch (err) { $('crOnbMsg').textContent = err.message; }
    });
  }

  /* --------------------------- career dashboard --------------------------- */
  async function viewMe() {
    if (!ME) { root.innerHTML = needLogin('My career'); return; }
    if (!learner()) { root.innerHTML = notLearner(); return; }
    const r = ME.career;
    const t = r.track;
    const nextStage = r.roadmap?.stages.find((s) => s.status === 'current');
    const nextAction = r.active ? `<a class="cr-btn" href="#take">Resume: ${esc(r.active.title)}</a>`
      : !r.common.last_attempt && r.assessments.common.available ? '<a class="cr-btn" href="#assess/common">Take the common CS assessment</a>'
        : t && r.assessments.track?.available && !r.track_attempt ? `<a class="cr-btn" href="#assess/${esc(t.slug)}">Take the ${esc(t.title)} assessment</a>`
          : r.gaps[0] ? `<a class="cr-btn" href="#report">Work on ${esc(r.gaps[0].name)}</a>` : '<a class="cr-btn" href="#roadmap">Open my roadmap</a>';
    root.innerHTML = `${tabs('me')}
      <h1>My career</h1>
      ${!r.preferences ? '<div class="cr-note">Tell us your interests to get better recommendations - it takes a minute and every question is optional. <a href="#onboarding">Set my career goals</a></div>' : ''}
      <div class="cr-kpis">
        <div class="cr-kpi"><span>Career track</span><b style="font-size:16px">${t ? esc(t.title) : 'Not chosen'}</b>${t ? '' : '<a href="#tracks" class="cr-small">Choose a track</a>'}</div>
        <div class="cr-kpi"><span>Assessed level (provisional)</span><b style="font-size:16px">${esc(r.readiness?.level || 'Not assessed yet')}</b></div>
        <div class="cr-kpi"><span>Common CS score</span><b>${r.common.score == null ? '-' : r.common.score + '%'}</b></div>
        <div class="cr-kpi"><span>Roadmap stages completed</span><b>${r.roadmap ? r.roadmap.stages.filter((s) => s.status === 'completed').length + ' / 6' : '-'}</b></div>
      </div>
      <div class="cr-panel"><h3>Next recommended step</h3>
        <p class="cr-small cr-muted">${nextStage ? `You are on stage ${nextStage.no}: ${esc(nextStage.name)}.` : t ? 'Choose an assessment to find your starting point.' : 'Pick a career track to get a personalised roadmap.'}</p>
        <div class="cr-actions">${nextAction}<a class="cr-btn ghost" href="#onboarding">Update my goals</a></div></div>
      ${r.gaps.length ? `<div class="cr-panel"><h3>Top priorities</h3><ul>${r.gaps.slice(0, 3).map((g) => `<li>${status(g.status)} <b>${esc(g.name)}</b> - ${esc(g.recommendation)}</li>`).join('')}</ul></div>` : ''}
      <p class="cr-muted cr-small">${esc(r.disclaimer)}</p>`;
  }

  /* ------------------------------ assessments ------------------------------ */
  async function viewAssessIntro(key) {
    if (!ME) { root.innerHTML = needLogin('Skill assessment'); return; }
    if (!learner()) { root.innerHTML = notLearner(); return; }
    const av = await api('/api/career/assessments/' + encodeURIComponent(key));
    if (ME.career.active) { location.hash = '#take'; return; }
    root.innerHTML = `${tabs('')}
      <h1>${esc(av.title || 'Assessment')}</h1>
      ${av.available ? `<div class="cr-panel">
        <p><b>${av.items} questions</b>, one at a time. A timer shows the time left; the limit is generous, and your answers save automatically, so you can come back if your connection drops.</p>
        <ul><li>Questions include multiple choice, "what does this code print?" and short debugging tasks.</li>
          <li>Skip anything you do not know - skipped questions are not counted as wrong; we simply ask about that skill again later.</li>
          <li>Your results guide your learning. They are not an official qualification.</li></ul>
        <div class="cr-actions"><button class="cr-btn" id="crStart">Start assessment</button><a class="cr-btn ghost" href="#me">Not now</a></div>
        <p id="crStartMsg" role="alert" class="cr-small"></p></div>`
        : `<div class="cr-note warn">${esc(av.reason || 'This assessment is not available yet.')}</div><a class="cr-btn ghost" href="#tracks">Explore tracks</a>`}`;
    const b = $('crStart');
    if (b) b.onclick = async () => {
      b.disabled = true;
      try { ATTEMPT = (await api('/api/career/me/attempts', { method: 'POST', body: { assessment: key } })).attempt; ATTEMPT.cur = 0; location.hash = '#take'; }
      catch (e) { $('crStartMsg').textContent = e.message; b.disabled = false; }
    };
  }

  async function viewTake() {
    if (!ME) { root.innerHTML = needLogin('Assessment'); return; }
    if (!ATTEMPT) {
      const r = await api('/api/career/me/attempts/active');
      if (!r.attempt) { location.hash = r.finalized ? '#result/' + r.finalized.id : '#me'; return; }
      ATTEMPT = r.attempt; ATTEMPT.cur = 0;
    }
    drawQuestion(); window.scrollTo(0, 0);
    clearInterval(TICK); TICK = setInterval(updateTimer, 1000);
  }
  function answered(q) { const v = ATTEMPT.answers[q.id]; return Array.isArray(v) ? v.length > 0 : v != null && String(v).trim() !== ''; }
  function updateTimer() {
    const el = $('crTimer'); if (!el || !ATTEMPT) return;
    const left = Math.max(0, Math.round((Date.parse(ATTEMPT.expires_at) - Date.now()) / 1000));
    el.textContent = `Time left ${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`;
    if (left === 0) { clearInterval(TICK); submit(true); }
  }
  function drawQuestion() {
    const a = ATTEMPT, q = a.questions[a.cur], n = a.questions.length, v = a.answers[q.id];
    const inputs = q.type === 'output'
      ? `<label for="crTyped" style="font-weight:600;display:block;margin-top:8px">Your answer</label><input id="crTyped" type="text" autocomplete="off" spellcheck="false" style="width:100%;min-height:44px;border:1px solid var(--line-strong);border-radius:10px;padding:8px 12px;font:inherit" value="${esc(v || '')}">`
      : `<fieldset style="border:0;padding:0;margin:0"><legend class="sr-only">Options</legend>${q.options.map((o) => `<label class="cr-opt"><input type="${q.multi ? 'checkbox' : 'radio'}" name="crOpt" value="${esc(o.id)}"${[].concat(v || []).includes(o.id) ? ' checked' : ''}><span>${esc(o.text)}</span></label>`).join('')}</fieldset>${q.multi ? '<p class="cr-small cr-muted">Select all that apply.</p>' : ''}`;
    root.innerHTML = `
      <div class="cr-qbar"><b>${esc(a.title)}</b><span id="crTimer" class="cr-small" aria-live="off"></span></div>
      <div class="cr-progress" role="progressbar" aria-valuemin="0" aria-valuemax="${n}" aria-valuenow="${a.questions.filter(answered).length}" aria-label="Questions answered"><i style="width:${Math.round((a.questions.filter(answered).length / n) * 100)}%"></i></div>
      <section class="cr-q" aria-labelledby="crQh">
        <p class="cr-small cr-muted">Question ${a.cur + 1} of ${n} &middot; ${esc(q.skill)}${q.practical ? ' &middot; practical task' : ''}</p>
        <h2 id="crQh" style="font-family:inherit;font-size:17px;margin:4px 0 6px">${esc(q.prompt)}</h2>
        ${q.code ? `<pre><code>${esc(q.code)}</code></pre>` : ''}
        ${inputs}
        <div class="cr-actions">
          <button class="cr-btn ghost" id="crPrev"${a.cur === 0 ? ' disabled' : ''}>Previous</button>
          ${a.cur < n - 1 ? '<button class="cr-btn" id="crNext">Next</button>' : '<button class="cr-btn" id="crFinish">Finish and see results</button>'}
        </div>
        <p id="crSaveMsg" class="cr-small cr-muted" role="status"></p>
      </section>
      <nav class="cr-dots" aria-label="Jump to question">${a.questions.map((x, i) => `<button type="button" data-i="${i}" data-done="${answered(x) ? 1 : 0}"${i === a.cur ? ' aria-current="true"' : ''} aria-label="Question ${i + 1}${answered(x) ? ', answered' : ''}">${i + 1}</button>`).join('')}</nav>
      <div class="cr-actions"><button class="cr-btn ghost" id="crAbandon">Stop and submit what I have answered</button></div>`;
    updateTimer();
    const record = () => {
      if (q.type === 'output') a.answers[q.id] = $('crTyped').value;
      else { const picked = [...root.querySelectorAll('input[name=crOpt]:checked')].map((x) => x.value); a.answers[q.id] = q.multi ? picked : (picked[0] || ''); }
      queueSave();
    };
    root.querySelectorAll('input[name=crOpt]').forEach((x) => x.addEventListener('change', record));
    if ($('crTyped')) { $('crTyped').addEventListener('input', record); $('crTyped').focus(); }
    const go = (i) => { a.cur = i; drawQuestion(); window.scrollTo(0, 0); };
    $('crPrev').onclick = () => go(a.cur - 1);
    if ($('crNext')) $('crNext').onclick = () => go(a.cur + 1);
    if ($('crFinish')) $('crFinish').onclick = () => submit(false);
    $('crAbandon').onclick = () => submit(false);
    root.querySelectorAll('.cr-dots button').forEach((b) => b.onclick = () => go(Number(b.dataset.i)));
  }
  function queueSave() {
    clearTimeout(SAVE_TIMER);
    SAVE_TIMER = setTimeout(async () => {
      const msg = $('crSaveMsg');
      try { await api(`/api/career/me/attempts/${ATTEMPT.id}/answers`, { method: 'PUT', body: { answers: ATTEMPT.answers } }); if (msg) msg.textContent = 'Saved'; }
      catch (e) { if (msg) msg.textContent = 'Not saved yet - we will try again. ' + e.message; }
    }, 800);
  }
  async function submit(timeUp) {
    const left = ATTEMPT.questions.filter((q) => !answered(q)).length;
    if (!timeUp && left && !confirm(`${left} question${left === 1 ? ' is' : 's are'} unanswered. Unanswered questions are not counted as wrong. Submit now?`)) return;
    clearInterval(TICK); clearTimeout(SAVE_TIMER);
    root.innerHTML = '<p class="cr-muted">Scoring your answers&hellip;</p>';
    try {
      const out = await api(`/api/career/me/attempts/${ATTEMPT.id}/submit`, { method: 'POST', body: { answers: ATTEMPT.answers } });
      ATTEMPT = null; await loadMe(); location.hash = '#result/' + out.attempt.id;
    } catch (e) { fail(e); }
  }

  async function viewResult(id) {
    if (!ME) { root.innerHTML = needLogin('Results'); return; }
    const h = await api('/api/career/me/history');
    const a = h.attempts.find((x) => x.id === id);
    if (!a) { root.innerHTML = `${tabs('history')}<p class="cr-err">That attempt was not found.</p>`; return; }
    const rv = (await api(`/api/career/me/attempts/${encodeURIComponent(id)}/review`)).review;
    root.innerHTML = `${tabs('history')}
      <h1>${esc(a.title)} - results</h1><p class="cr-muted cr-small">Submitted ${fmtDate(a.submitted_at)}${a.late ? ' &middot; time ran out, so only answers saved in time were scored' : ''}</p>
      <div class="cr-kpis">
        <div class="cr-kpi"><span>Score on answered questions</span><b>${a.raw_score == null ? '-' : a.raw_score + '%'}</b></div>
        <div class="cr-kpi"><span>Answered</span><b>${a.answered} / ${a.total}</b></div>
        <div class="cr-kpi"><span>Practical tasks</span><b>${a.practical_score == null ? 'None answered' : a.practical_score + '%'}</b></div>
      </div>
      <div class="cr-actions"><a class="cr-btn" href="#report">See my skill report and roadmap</a></div>
      <h2>Review your answers</h2>
      ${rv.map((r, i) => `<div class="cr-review" data-correct="${r.correct ? 1 : 0}">
        <p class="cr-small cr-muted">${i + 1}. ${esc(r.skill || '')} &middot; <b>${r.correct ? '✓ Correct' : r.answered ? '✕ Not correct' : 'Skipped'}</b></p>
        <p>${esc(r.prompt || '')}</p>${r.code ? `<pre style="background:#0F172A;color:#E2E8F0;border-radius:8px;padding:10px;overflow-x:auto"><code>${esc(r.code)}</code></pre>` : ''}
        <p class="cr-small"><b>Answer:</b> ${esc(r.options.length ? r.options.filter((o) => r.key.includes(o.id)).map((o) => o.text).join('; ') : r.key[0])}</p>
        <p class="cr-small cr-muted">${esc(r.explanation || '')}</p></div>`).join('')}`;
  }

  /* ------------------------------ skill report ------------------------------ */
  const bar = (s) => `<div class="cr-bar${s.evidence !== 'sufficient' ? ' thin' : ''}" aria-hidden="true"><i style="width:${s.score == null ? 0 : s.score}%"></i></div>`;
  const skillRow = (s) => `<div class="cr-skill"><span>${esc(s.name)}${s.critical ? ' <span class="cr-tag warn">prerequisite</span>' : ''}</span>${bar(s)}<span>${s.score == null ? '' : `<b>${s.score}%</b> `}${status(s.status)}</span></div>`;
  async function viewReport() {
    if (!ME) { root.innerHTML = needLogin('My skill report'); return; }
    if (!learner()) { root.innerHTML = notLearner(); return; }
    const r = ME.career;
    const tracks = await loadTracks();
    const picker = `<label for="crTrackPick" class="cr-small" style="font-weight:600">Show readiness for</label>
      <select id="crTrackPick" style="min-height:40px;border:1px solid var(--line-strong);border-radius:10px;padding:6px 10px;margin-left:6px"><option value="">Choose a track</option>${tracks.map((t) => `<option value="${esc(t.slug)}"${r.track?.slug === t.slug ? ' selected' : ''}>${esc(t.title)}</option>`).join('')}</select>`;
    if (!r.common.last_attempt && !r.track_attempt && !r.readiness?.score) {
      root.innerHTML = `${tabs('report')}<h1>My skill report</h1><div class="cr-note">You have not taken an assessment yet. Start with the common computer-science assessment (about 20 minutes).</div>
        <div class="cr-actions">${r.assessments.common.available ? '<a class="cr-btn" href="#assess/common">Take the common CS assessment</a>' : `<span class="cr-tag">${esc(r.assessments.common.reason || '')}</span>`}<a class="cr-btn ghost" href="#tracks">Explore tracks</a></div>`;
      return;
    }
    const rd = r.readiness;
    root.innerHTML = `${tabs('report')}
      <h1>My skill report</h1>
      <p>${picker}</p>
      <div class="cr-note warn"><b>Provisional.</b> ${esc(r.disclaimer)}</div>
      <div class="cr-kpis">
        <div class="cr-kpi"><span>Career track</span><b style="font-size:16px">${r.track ? esc(r.track.title) : 'Not chosen'}</b></div>
        <div class="cr-kpi"><span>Provisional level</span><b style="font-size:16px">${esc(rd?.level || '-')}</b><span>${rd ? 'Confidence: ' + esc(rd.confidence) : ''}</span></div>
        <div class="cr-kpi"><span>Track readiness (knowledge)</span><b>${rd?.score == null ? '-' : rd.score + '%'}</b><span>${rd ? Math.round(rd.coverage * 100) + '% of skills assessed' : ''}</span></div>
        <div class="cr-kpi"><span>Practical tasks</span><b>${rd?.practical_score == null ? '-' : rd.practical_score + '%'}</b></div>
        <div class="cr-kpi"><span>Common CS score</span><b>${r.common.score == null ? '-' : r.common.score + '%'}</b><span>${r.common.last_attempt ? 'Taken ' + fmtDate(r.common.last_attempt.submitted_at) : 'Not taken'}</span></div>
      </div>
      ${rd ? `<div class="cr-panel"><h3>How your level was worked out</h3><ul>${rd.explanation.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>` : ''}
      <div class="cr-cols"><div>
        ${rd ? `<h2>${esc(r.track.title)} skills</h2>${rd.skills.map(skillRow).join('')}
          <p class="cr-small cr-muted">Striped bars mean too few questions were answered to be sure - take the short reassessment for that skill.</p>` : '<div class="cr-note">Choose a career track above to see your readiness for it.</div>'}
        <h2>Common computer-science skills</h2>${r.common.categories.map((c) => skillRow({ ...c, critical: false })).join('')}
        ${r.gaps.length ? `<h2>What to work on next</h2>${r.gaps.map((g) => `<div class="cr-panel"><h3>${esc(g.name)} ${status(g.status)}</h3>
          <p>${esc(g.recommendation)}</p>
          ${g.resources.length ? `<div>${g.resources.map((m) => `<div class="cr-mod"><a href="${esc(m.url)}">${esc(m.course)}: ${esc(m.title)}</a><span class="cr-small">${m.completed ? '✓ Completed' : m.tasks + ' practice task' + (m.tasks === 1 ? '' : 's')}</span></div>`).join('')}</div>` : ''}
          <div class="cr-actions">${g.reassess_available ? `<a class="cr-btn ghost" href="#assess/${esc('skill:' + g.skill)}">${g.status === 'Not Yet Assessed' ? 'Assess this skill' : 'Take the reassessment'}</a>` : '<span class="cr-tag">A reassessment for this skill is coming soon</span>'}</div></div>`).join('')}` : rd ? '<div class="cr-note">No skill gaps for this track - see your roadmap for advanced projects.</div>' : ''}
      </div><aside>
        ${r.strongest.length ? `<div class="cr-panel"><h3>Strongest skills</h3><ul>${r.strongest.map((s) => `<li>${esc(s.name)} - ${s.score}%</li>`).join('')}</ul></div>` : ''}
        ${r.critical_gaps.length ? `<div class="cr-panel"><h3>Critical prerequisite gaps</h3><ul>${r.critical_gaps.map((g) => `<li>${esc(g.name)} - ${g.score}%</li>`).join('')}</ul></div>` : ''}
        ${r.roadmap ? `<div class="cr-panel"><h3>Recommended starting stage</h3><p>${r.roadmap.starting_stage ? `Stage ${r.roadmap.starting_stage}: ${esc(r.roadmap.stages[r.roadmap.starting_stage - 1].name)}` : 'All stages complete'}</p><a class="cr-btn ghost" href="#roadmap">Open my roadmap</a></div>` : ''}
        <div class="cr-panel"><h3>Reassessment</h3><p class="cr-small">${r.assessments.track?.available ? `Retake the full ${esc(r.track.title)} assessment once a day, or take a short reassessment for one skill whenever you finish its modules.` : 'Short skill reassessments are available from each recommendation.'}</p>
          ${r.track && r.assessments.track?.available ? `<a class="cr-btn ghost" href="#assess/${esc(r.track.slug)}">Take the ${esc(r.track.title)} assessment</a>` : ''}</div>
      </aside></div>`;
    $('crTrackPick').onchange = async (e) => { ME.career = await api('/api/career/me?track=' + encodeURIComponent(e.target.value)); viewReport(); };
  }

  /* -------------------------------- roadmap -------------------------------- */
  async function viewRoadmap() {
    if (!ME) { root.innerHTML = needLogin('My roadmap'); return; }
    if (!learner()) { root.innerHTML = notLearner(); return; }
    const r = ME.career;
    if (!r.track) { root.innerHTML = `${tabs('roadmap')}<h1>My roadmap</h1><div class="cr-note">Choose a career track to get your personalised roadmap.</div><a class="cr-btn" href="#tracks">Explore tracks</a>`; return; }
    const rm = r.roadmap;
    root.innerHTML = `${tabs('roadmap')}
      <h1>${esc(r.track.title)} roadmap</h1>
      <p class="cr-muted">Built from your latest assessment results. Stages where you have already shown the skills are marked complete; critical prerequisites always need to be demonstrated first.</p>
      <div class="cr-steps" aria-label="Roadmap stages">${rm.stages.map((s) => `<span data-status="${s.status}">${s.no}. ${esc(s.name)}<br><small>${esc({ completed: '✓ Done', current: 'You are here', upcoming: 'Next', locked: 'Locked' }[s.status])}</small></span>`).join('')}</div>
      ${rm.stages.map((s) => `<section class="cr-stage" data-status="${s.status}" aria-label="Stage ${s.no}">
        <div class="cr-stage-head"><h3>Stage ${s.no}: ${esc(s.name)}</h3><span class="cr-tag${s.status === 'completed' ? ' teal' : ''}">${esc({ completed: '✓ Completed', current: '→ Start here', upcoming: 'Upcoming', locked: '🔒 Opens after stage 4' }[s.status])}</span></div>
        ${s.skills.length ? `<div>${s.skills.map((k) => `<div class="cr-mod"><span>${esc(k.name)}${k.critical ? ' <span class="cr-tag warn">prerequisite</span>' : ''}</span><span>${k.score == null ? '' : k.score + '% '}${status(k.status)}</span></div>`).join('')}</div>` : ''}
        ${s.modules.length ? `<p class="cr-small" style="margin:10px 0 2px"><b>EchoLens modules</b></p>${s.modules.map((m) => `<div class="cr-mod"><a href="${esc(m.url)}">${esc(m.course)}: ${esc(m.title)}</a><span class="cr-small">${m.completed ? '✓ Completed' : m.tasks + ' task' + (m.tasks === 1 ? '' : 's')}</span></div>`).join('')}` : s.skills.length ? '<p class="cr-small cr-muted">EchoLens does not have a module for these skills yet.</p>' : ''}
        <p class="cr-small"><b>Guided project:</b> ${s.projects.map(esc).join('; ')}</p>
        <p class="cr-small cr-muted"><b>Done when:</b> ${esc(s.criteria)}</p>
        ${s.no >= 5 ? `<form class="cr-form" data-stage="${s.no}"><label for="crProj${s.no}">Link to your project (GitHub or live URL)</label><input id="crProj${s.no}" type="url" placeholder="https://github.com/you/project" value="${esc(s.project?.link || '')}"${s.status === 'locked' ? ' disabled' : ''}>
          <div class="cr-actions"><button class="cr-btn ghost" type="submit"${s.status === 'locked' ? ' disabled' : ''}>Save project link</button></div><p class="cr-small cr-muted" role="status">${s.project ? 'Self-reported - saved ' + fmtDate(s.project.at) : ''}</p></form>` : ''}
        ${s.next_actions.length && s.status !== 'locked' && s.skills.length ? `<div class="cr-actions">${[...new Set(s.next_actions.map((a) => a.skill))].slice(0, 3).map((id) => `<a class="cr-btn ghost" href="#assess/${esc('skill:' + id)}">Assess ${esc(s.skills.find((k) => k.skill === id).name)}</a>`).join('')}</div>` : ''}
      </section>`).join('')}`;
    root.querySelectorAll('form[data-stage]').forEach((f) => f.addEventListener('submit', async (e) => {
      e.preventDefault(); const out = f.querySelector('[role=status]');
      try { await api('/api/career/me/projects', { method: 'POST', body: { track: r.track.slug, stage: f.dataset.stage, link: f.querySelector('input').value } }); await loadMe(); viewRoadmap(); }
      catch (err) { out.textContent = err.message; }
    }));
  }

  /* -------------------------------- history -------------------------------- */
  async function viewHistory() {
    if (!ME) { root.innerHTML = needLogin('Assessment history'); return; }
    if (!learner()) { root.innerHTML = notLearner(); return; }
    const h = await api('/api/career/me/history');
    root.innerHTML = `${tabs('history')}<h1>Assessment history</h1>
      ${h.attempts.length ? `<div style="overflow-x:auto"><table class="cr-table"><thead><tr><th>Date</th><th>Assessment</th><th>Score</th><th>Answered</th><th></th></tr></thead><tbody>
        ${h.attempts.map((a) => `<tr><td>${fmtDate(a.submitted_at)}</td><td>${esc(a.title)}</td><td>${a.raw_score == null ? '-' : a.raw_score + '%'}</td><td>${a.answered}/${a.total}</td><td><a href="#result/${esc(a.id)}">Review</a></td></tr>`).join('')}</tbody></table></div>` : '<p class="cr-muted">No assessments yet.</p>'}
      ${h.skills.some((s) => s.history.length > 1) ? `<h2>Improvement over time</h2>${h.skills.filter((s) => s.history.length > 1).map((s) => {
        const first = s.history[0], last = s.history[s.history.length - 1], d = last.score - first.score;
        return `<div class="cr-skill"><span>${esc(s.name)}</span><span class="cr-small">${s.history.map((x) => x.score + '%').join(' → ')}</span><b>${d > 0 ? '▲ +' : d < 0 ? '▼ ' : '= '}${d}</b></div>`;
      }).join('')}` : ''}`;
  }

  /* --------------------------------- router --------------------------------- */
  async function loadMe() {
    try { ME = await api('/api/auth/me'); } catch { ME = null; }
    if (ME) { try { ME.career = await api('/api/career/me'); } catch { ME.career = null; } }
  }
  async function route() {
    clearInterval(TICK);
    const [view, arg] = decodeURIComponent(location.hash.slice(1) || 'tracks').split('/');
    document.title = 'Career Paths & Skill Assessment | EchoLens';
    try {
      if (view === 'track' && arg) await viewTrack(arg);
      else if (view === 'me') await viewMe();
      else if (view === 'onboarding') await viewOnboarding();
      else if (view === 'assess' && arg) await viewAssessIntro(arg);
      else if (view === 'take') await viewTake();
      else if (view === 'result' && arg) await viewResult(arg);
      else if (view === 'report') await viewReport();
      else if (view === 'roadmap') await viewRoadmap();
      else if (view === 'history') await viewHistory();
      else await viewTracks();
    } catch (e) { fail(e); }
    if (view !== 'take') root.focus({ preventScroll: true });
  }
  window.addEventListener('hashchange', route);
  (async () => {
    await loadMe();
    const signin = document.querySelector('[data-public-login]');
    if (ME && signin) { signin.textContent = ME.role === 'free' ? 'Open Portal' : 'My Portal'; signin.href = ME.role === 'free' ? '/open' : '/dashboard'; }
    route();
  })();
})();
