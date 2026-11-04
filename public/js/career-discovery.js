'use strict';
/*
 * EchoLens Career Discovery (Release 1) - drawn inside /career by career.js.
 *   #discover            welcome
 *   #discover/about/<n>  five optional questions, one per screen
 *   #discover/quiz       short beginner quiz (intro, then one question per screen)
 *   #discover/results    quiz summary, suggested tracks with reasons, all 12 tracks
 *
 * Guests can do everything; progress lives in this browser (localStorage)
 * and, once signed in, is attached to the account. Scores, keys and
 * recommendations all come from the server - this file only displays them.
 */
(() => {
  const KEY = 'elDiscovery.v1';
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch { return {}; } };
  const store = (s) => { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* private mode: keep going in memory */ } };
  let S = load(), INFO = null, CTX = null;
  const persist = () => store(S);

  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  /** Tiny, dependency-free highlighter for short Python/JS snippets (escapes first). */
  function hl(code) {
    const KW = /\b(def|return|if|elif|else|for|while|in|range|print|import|from|class|True|False|None|and|or|not|const|let|var|function|console|log)\b/g;
    return esc(code).split('\n').map((line) => {
      const parts = line.split(/(&quot;.*?&quot;|&#39;.*?&#39;|#.*$)/);
      return parts.map((p, i) => (i % 2 ? (p.startsWith('#') ? `<span class="hl-c">${p}</span>` : `<span class="hl-s">${p}</span>`)
        : p.replace(KW, '<span class="hl-k">$1</span>').replace(/\b(\d+(?:\.\d+)?)\b/g, '<span class="hl-n">$1</span>'))).join('');
    }).join('\n');
  }
  async function info() { if (!INFO) INFO = await CTX.api('/api/career/discovery'); return INFO; }
  const learner = () => CTX.ME && ['free', 'student'].includes(CTX.ME.role);
  const steps = (cur) => `<ol class="dc-steps" aria-label="Career Discovery steps">${[['about', 'About you'], ['quiz', 'Quick quiz'], ['results', 'Your matches']]
    .map(([k, l], i) => `<li${k === cur ? ' aria-current="step"' : ''}><span>${i + 1}</span>${l}</li>`).join('')}</ol>`;
  /** Save answers/step for signed-in learners too (guests: this browser only). */
  async function sync(extra = {}) {
    persist();
    if (!learner()) return;
    try { await CTX.api('/api/career/me/discovery', { method: 'PUT', body: { answers: S.answers || {}, step: S.step || 0, ...extra } }); } catch { /* offline: the local copy is kept */ }
  }

  /** On sign-in, attach a guest's answers and signed quiz result to the account (once). */
  async function claimIfNeeded() {
    if (!learner() || S.claimed_by === CTX.ME.id) return;
    if (!S.result_token && !Object.keys(S.answers || {}).length) return;
    try { await CTX.api('/api/career/me/discovery/claim', { method: 'POST', body: { answers: S.answers || {}, result_token: S.result_token || undefined, step: S.step || 0 } }); S.claimed_by = CTX.ME.id; persist(); } catch { /* try again next visit */ }
  }
  /** For a signed-in learner with nothing saved locally, pick up their saved progress. */
  async function hydrate() {
    const i = await info();
    const d = i.state?.discovery;
    if (!d) return;
    if (!Object.keys(S.answers || {}).length && Object.keys(d.answers || {}).length) S.answers = d.answers;
    if (!S.step && d.step) S.step = d.step;
    if (!S.quiz && d.active_quiz) {
      try { const r = await CTX.api('/api/career/discovery/quiz/resume', { method: 'POST', body: { token: d.active_quiz.token } }); S.quiz = { token: r.token, questions: r.questions, answers: {}, cur: 0 }; } catch { /* expired */ }
    }
    persist();
  }

  /** Should the welcome open automatically? Only for people with no career activity who have not skipped it. */
  async function shouldAutoShow(ctx) {
    CTX = ctx;
    try {
      const i = await info();
      if (!i.enabled) return false;
      if (S.dismissed || S.outcome) return false;
      if (ctx.ME) return !!(i.state && i.state.show_welcome);
      return !Object.keys(S.answers || {}).length;
    } catch { return false; }
  }

  /* ---------------------------------- welcome ---------------------------------- */
  function welcome(root) {
    const resume = Object.keys(S.answers || {}).length || S.quiz || S.outcome;
    root.innerHTML = `${CTX.tabs('discover')}
      <section class="dc-hero" aria-labelledby="dcH">
        <div class="dc-hero-text">
          <p class="dc-eyebrow">Career Discovery</p>
          <h1 id="dcH">Discover What You Can Become.</h1>
          <p class="dc-lead">Explore technology careers, discover your strengths, and build the skills you need &mdash; one step at a time.</p>
          <ul class="dc-promise">
            <li><b>Beginners are welcome.</b> No experience needed &mdash; every track starts from the basics.</li>
            <li><b>About 8 minutes.</b> Five quick questions and a friendly 12-question quiz. Skip anything.</li>
            <li><b>You choose.</b> We suggest tracks and explain why, but you can pick any of the 12.</li>
          </ul>
          ${steps('')}
          <div class="cr-actions">
            <a class="cr-btn dc-start" href="#discover/about/${resume ? Math.min(S.step || 0, 4) + 1 : 1}">${resume ? 'Continue where I left off' : 'Start Exploring'}</a>
            ${S.outcome ? '<a class="cr-btn ghost" href="#discover/results">See my matches</a>' : ''}
            <button class="cr-btn ghost" id="dcSkip" type="button">Skip for now</button>
          </div>
          ${CTX.ME ? '' : `<p class="cr-small cr-muted">No account needed to explore. <a href="${esc(CTX.loginUrl())}">Sign in</a> to save your progress.</p>`}
        </div>
        <div class="dc-art" aria-hidden="true">${art()}</div>
      </section>`;
    $('dcSkip').onclick = async () => { S.dismissed = true; persist(); if (learner()) { try { await CTX.api('/api/career/me/discovery', { method: 'PUT', body: { dismissed: true } }); } catch { /* fine */ } } location.hash = '#tracks'; };
  }
  /** Lightweight inline illustration: career paths branching from one start point. */
  function art() {
    const nodes = [[60, 150, 'Web'], [150, 60, 'AI'], [250, 95, 'Data'], [280, 200, 'Cloud'], [175, 245, 'Security'], [70, 255, 'Mobile']];
    return `<svg viewBox="0 0 340 300" role="img">
      <defs><radialGradient id="dcG" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#0FBFA8" stop-opacity=".25"/><stop offset="1" stop-color="#0FBFA8" stop-opacity="0"/></radialGradient></defs>
      <circle cx="170" cy="155" r="140" fill="url(#dcG)"/>
      ${nodes.map(([x, y]) => `<path class="dc-path" d="M170 155 Q ${(170 + x) / 2 + 18} ${(155 + y) / 2 - 18} ${x} ${y}" />`).join('')}
      <circle cx="170" cy="155" r="26" class="dc-core"/><text x="170" y="160" text-anchor="middle" class="dc-core-t">You</text>
      ${nodes.map(([x, y, t], i) => `<g class="dc-node" style="animation-delay:${i * 0.35}s"><circle cx="${x}" cy="${y}" r="21"/><text x="${x}" y="${y + 4}" text-anchor="middle">${t}</text></g>`).join('')}
    </svg>`;
  }
  const $ = (id) => document.getElementById(id);

  /* ------------------------------ about you (5 questions) ------------------------------ */
  async function about(root, n) {
    const i = await info();
    const qs = i.questions, q = qs[n - 1];
    if (!q) { location.hash = '#discover/quiz'; return; }
    S.answers = S.answers || {};
    const cur = [].concat(S.answers[q.id] || []);
    root.innerHTML = `${CTX.tabs('discover')}
      ${steps('about')}
      <section class="dc-card" aria-labelledby="dcQ">
        <p class="cr-small cr-muted">Question ${n} of ${qs.length}</p>
        <div class="cr-progress" aria-hidden="true"><i style="width:${Math.round(((n - 1) / qs.length) * 100)}%"></i></div>
        <h1 id="dcQ" class="dc-qtitle">${esc(q.title)}</h1>
        <p class="cr-muted">${esc(q.hint)}</p>
        <fieldset class="dc-chips"><legend class="sr-only">${esc(q.title)}</legend>
          ${q.options.map((o) => `<label class="dc-chip"><input type="${q.multi ? 'checkbox' : 'radio'}" name="dcOpt" value="${esc(o.id)}"${cur.includes(o.id) ? ' checked' : ''}><span>${esc(o.text)}</span></label>`).join('')}
        </fieldset>
        ${q.id === 'experience' ? '<p class="cr-small cr-muted">This is just to tailor suggestions &mdash; it is never treated as a test result.</p>' : ''}
        <div class="cr-actions">
          <a class="cr-btn ghost" href="${n === 1 ? '#discover' : '#discover/about/' + (n - 1)}">Back</a>
          <button class="cr-btn" id="dcNext" type="button">${n === qs.length ? 'Continue' : 'Next'}</button>
          <button class="cr-btn ghost" id="dcSkipQ" type="button">Skip this question</button>
        </div>
      </section>`;
    const boxes = [...root.querySelectorAll('input[name=dcOpt]')];
    boxes.forEach((b) => b.addEventListener('change', () => {
      // "Not sure yet" / "None yet" are exclusive choices.
      if (q.multi && b.checked && ['unsure', 'none'].includes(b.value)) boxes.forEach((x) => { if (x !== b) x.checked = false; });
      else if (q.multi && b.checked) boxes.forEach((x) => { if (['unsure', 'none'].includes(x.value)) x.checked = false; });
    }));
    const go = async (keep) => {
      const picked = boxes.filter((b) => b.checked).map((b) => b.value);
      if (keep) { if (picked.length) S.answers[q.id] = q.multi ? picked : picked[0]; else delete S.answers[q.id]; }
      S.step = Math.max(S.step || 0, n);
      await sync();
      location.hash = n === qs.length ? '#discover/quiz' : '#discover/about/' + (n + 1);
    };
    $('dcNext').onclick = () => go(true);
    $('dcSkipQ').onclick = () => go(false);
  }

  /* ---------------------------------- quiz ---------------------------------- */
  async function quiz(root) {
    const i = await info();
    if (!S.quiz) {
      root.innerHTML = `${CTX.tabs('discover')}${steps('quiz')}
        <section class="dc-card" aria-labelledby="dcQi">
          <h1 id="dcQi" class="dc-qtitle">A quick, friendly quiz</h1>
          <p>${i.quiz.items} multiple-choice questions about everyday computing ideas &mdash; about ${i.quiz.minutes} minutes.</p>
          <ul class="dc-promise">
            <li>Written for complete beginners: every technical word is explained.</li>
            <li>Skip anything you do not know. Skipped questions do not count against you, and there is no negative marking.</li>
            <li>This only helps us suggest where to start. It is not a test of your potential, and it never closes any career to you.</li>
          </ul>
          <div class="cr-actions">
            <button class="cr-btn" id="dcStartQuiz" type="button"${i.quiz.available ? '' : ' disabled'}>Start the quiz</button>
            <button class="cr-btn ghost" id="dcNoQuiz" type="button">Skip the quiz and see suggestions</button>
          </div>
          <p id="dcMsg" class="cr-small" role="alert"></p>
        </section>`;
      $('dcStartQuiz').onclick = async () => {
        $('dcStartQuiz').disabled = true;
        try { const r = await CTX.api('/api/career/discovery/quiz', { method: 'POST' }); S.quiz = { token: r.token, questions: r.questions, answers: {}, cur: 0 }; persist(); quiz(root); }
        catch (e) { $('dcMsg').textContent = e.message; $('dcStartQuiz').disabled = false; }
      };
      $('dcNoQuiz').onclick = async () => { await showRecs(null); };
      return;
    }
    drawQ(root);
  }
  function drawQ(root) {
    const z = S.quiz, q = z.questions[z.cur], n = z.questions.length, v = z.answers[q.id];
    const done = z.questions.filter((x) => z.answers[x.id]).length;
    root.innerHTML = `${CTX.tabs('discover')}${steps('quiz')}
      <section class="dc-card cr-q" aria-labelledby="dcQq">
        <p class="cr-small cr-muted">Question ${z.cur + 1} of ${n}</p>
        <div class="cr-progress" role="progressbar" aria-valuemin="0" aria-valuemax="${n}" aria-valuenow="${done}" aria-label="Questions answered"><i style="width:${Math.round((done / n) * 100)}%"></i></div>
        <h1 id="dcQq" class="dc-qtitle dc-qtext">${esc(q.prompt)}</h1>
        ${q.code ? `<pre class="dc-code"><code>${hl(q.code)}</code></pre>` : ''}
        <fieldset style="border:0;padding:0;margin:0"><legend class="sr-only">Answer options</legend>
          ${q.options.map((o) => `<label class="cr-opt"><input type="radio" name="dcA" value="${esc(o.id)}"${v === o.id ? ' checked' : ''}><span>${esc(o.text)}</span></label>`).join('')}
        </fieldset>
        <div class="cr-actions">
          <button class="cr-btn ghost" id="dcPrev" type="button"${z.cur === 0 ? ' disabled' : ''}>Previous</button>
          ${z.cur < n - 1 ? '<button class="cr-btn" id="dcN" type="button">Next</button><button class="cr-btn ghost" id="dcSk" type="button">Skip</button>' : '<button class="cr-btn" id="dcFin" type="button">See my results</button>'}
        </div>
        <p id="dcMsg" class="cr-small" role="alert"></p>
      </section>`;
    root.querySelectorAll('input[name=dcA]').forEach((x) => x.addEventListener('change', () => { z.answers[q.id] = x.value; persist(); }));
    const move = (d) => { z.cur = Math.max(0, Math.min(n - 1, z.cur + d)); persist(); drawQ(root); window.scrollTo(0, 0); };
    $('dcPrev').onclick = () => move(-1);
    if ($('dcN')) $('dcN').onclick = () => move(1);
    if ($('dcSk')) $('dcSk').onclick = () => { delete z.answers[q.id]; move(1); };
    if ($('dcFin')) $('dcFin').onclick = async () => {
      $('dcFin').disabled = true;
      try {
        const out = await CTX.api('/api/career/discovery/quiz/submit', { method: 'POST', body: { token: z.token, answers: z.answers, onboarding: S.answers || {} } });
        S.outcome = out; S.result_token = out.result_token; S.quiz = null; if (learner()) S.claimed_by = CTX.ME.id; persist();
        location.hash = '#discover/results';
      } catch (e) {
        $('dcMsg').innerHTML = `${esc(e.message)} <button class="cr-btn ghost" id="dcRestart" type="button">Start a new quiz</button>`;
        $('dcRestart').onclick = () => { S.quiz = null; persist(); location.hash = '#discover/quiz'; quiz(CTX.root); };
        $('dcFin').disabled = false;
      }
    };
  }
  async function showRecs(_) {
    try {
      const r = await CTX.api('/api/career/discovery/recommendations', { method: 'POST', body: learner() ? {} : { answers: S.answers || {}, result_token: S.result_token } });
      S.outcome = { ...(S.outcome || {}), recommendations: r.recommendations, starting_point: r.starting_point, no_quiz: !S.outcome?.result }; persist();
      if (learner()) { try { await CTX.api('/api/career/me/discovery', { method: 'PUT', body: { completed: true } }); } catch { /* fine */ } }
    } catch { /* offline */ }
    location.hash = '#discover/results';
  }

  /* --------------------------------- results --------------------------------- */
  const LEVEL = { strong: ['Strength', 'teal'], developing: ['Getting there', ''], new: ['New to you', 'warn'], skipped: ['Skipped', ''] };
  async function results(root) {
    const i = await info();
    // Refresh suggestions from the server (answers may have changed; signed-in learners use their saved data).
    try {
      const r = await CTX.api('/api/career/discovery/recommendations', { method: 'POST', body: learner() ? {} : { answers: S.answers || {}, result_token: S.result_token } });
      S.outcome = { ...(S.outcome || {}), recommendations: r.recommendations, starting_point: r.starting_point, result: S.outcome?.result || r.quiz || null }; persist();
    } catch { /* show the last known suggestions */ }
    const o = S.outcome || {}, recs = o.recommendations || [], res = o.result;
    const recSet = new Set(recs.map((x) => x.slug));
    const rm = CTX.ME?.career?.roadmaps || { enrollments: [] };
    const following = new Set((rm.enrollments || []).filter((e) => e.status !== 'archived').map((e) => e.track));
    const choose = (slug) => (following.has(slug) ? `<a class="cr-btn ghost cr-btn-sm" href="#roadmap/${esc(slug)}">In my roadmaps</a>` : `<button class="cr-btn cr-btn-sm" data-choose="${esc(slug)}" type="button">Choose this track</button>`);
    root.innerHTML = `${CTX.tabs('discover')}${steps('results')}
      <h1>Your career matches</h1>
      <p class="cr-muted">Suggestions come from what you told us${res ? ' and your quiz' : ''}. They are a starting point, not a verdict &mdash; you can choose <b>any</b> of the 12 tracks.</p>
      ${res ? `<section class="dc-card" aria-labelledby="dcRes"><h2 id="dcRes" class="dc-h2">What your quiz showed</h2>
        <p class="cr-small cr-muted">${res.answered} of ${res.total} answered${res.score != null ? ` &middot; ${res.score}% of answered questions correct` : ''}. This is a friendly first look, not a grade.</p>
        <div class="dc-areas">${Object.values(res.areas).map((a) => `<div class="dc-area"><div><b>${esc(a.name)}</b> <span class="cr-tag ${LEVEL[a.level][1]}">${LEVEL[a.level][0]}</span></div>
          <p class="cr-small cr-muted">${esc(a.message)}</p>${(a.learn || []).length ? `<p class="cr-small">Start learning: ${a.learn.map((m) => `<a href="${esc(m.url)}">${esc(m.title)}</a>`).join(' &middot; ')}</p>` : ''}</div>`).join('')}</div>
        ${(o.review || []).length ? `<details class="dc-review"><summary>See the questions, the correct answers and why</summary>${o.review.map((x, k) => `<div class="dc-rev"><p><b>${k + 1}. ${esc(x.prompt)}</b></p>${x.code ? `<pre class="dc-code"><code>${hl(x.code)}</code></pre>` : ''}
          <p class="cr-small">${x.answered ? (x.correct ? '<span class="cr-tag teal">Correct</span>' : `<span class="cr-tag warn">Not quite</span> You chose: ${esc(x.your_answer)}`) : '<span class="cr-tag">Skipped</span>'}</p>
          <p class="cr-small"><b>Answer:</b> ${esc(x.correct_answer)}. ${esc(x.explanation)}</p></div>`).join('')}</details>` : ''}
      </section>` : `<div class="cr-note">You skipped the quiz &mdash; no problem. <a href="#discover/quiz">Take it now</a> for more tailored suggestions.</div>`}
      <section aria-labelledby="dcRec"><h2 id="dcRec" class="dc-h2">Suggested for you</h2>
        <div class="dc-recs">${recs.map((r) => { const t = i.tracks.find((x) => x.slug === r.slug) || {}; return `<article class="dc-rec">
          <h3>${esc(r.title)}</h3>
          <p class="dc-why"><b>${r.matched ? 'Recommended because:' : 'Worth a look:'}</b> ${r.reasons.map(esc).join(' ')}</p>
          <p class="cr-small">${esc(r.start)}</p>
          ${t.duration ? `<p class="cr-small cr-muted">${esc(t.duration)}</p>` : ''}
          <div class="cr-actions">${choose(r.slug)}<a class="cr-btn ghost cr-btn-sm" href="#track/${esc(r.slug)}">Explore track</a></div></article>`; }).join('')}</div>
        <div class="cr-actions"><a class="cr-btn ghost" href="#dcAll" id="dcBrowse">Browse all 12 career tracks</a><a class="cr-btn ghost" href="#discover/about/1">Change my answers</a></div>
      </section>
      <p id="dcMsg" class="cr-small" role="alert"></p>
      <section aria-labelledby="dcAllH" id="dcAll"><h2 id="dcAllH" class="dc-h2">All career tracks</h2>
        <p class="cr-muted cr-small">Every track starts from the basics. Pick the one that excites you &mdash; you can follow up to three at once and change your mind later.</p>
        <div class="dc-grid">${i.tracks.map((t) => `<article class="dc-tcard">
          <div class="dc-tcard-h"><h3>${esc(t.title)}</h3>${recSet.has(t.slug) ? '<span class="cr-tag teal">Suggested</span>' : ''}</div>
          <p class="cr-small cr-muted">${esc(String(t.overview || '').split('. ')[0])}.</p>
          <div class="cr-actions">${choose(t.slug)}<a class="cr-btn ghost cr-btn-sm" href="#track/${esc(t.slug)}">Details</a></div></article>`).join('')}</div>
      </section>`;
    $('dcBrowse').onclick = (e) => { e.preventDefault(); $('dcAll').scrollIntoView({ behavior: 'smooth' }); };
    root.querySelectorAll('[data-choose]').forEach((b) => { b.onclick = () => pick(b.dataset.choose, b); });
  }
  /** Choose a track: signed-in learners get a roadmap now; guests sign in first and come back here. */
  async function pick(slug, btn) {
    const msg = $('dcMsg');
    if (!CTX.ME) { S.pending_choice = slug; persist(); location.href = '/login?returnTo=' + encodeURIComponent('/career#discover/results'); return; }
    if (!learner()) { msg.textContent = 'Roadmaps are for learner accounts.'; return; }
    btn.disabled = true;
    try {
      const hasPrimary = !!CTX.ME.career?.roadmaps?.primary;
      const out = await CTX.api('/api/career/me/enrollments', { method: 'POST', body: { track: slug, primary: !hasPrimary } });
      await CTX.api('/api/career/me/discovery', { method: 'PUT', body: { chosen_track: slug, completed: true } });
      S.pending_choice = null; persist();
      await CTX.loadMe(); CTX.setAdvice(out.recommendation);
      location.hash = '#me';
    } catch (e) {
      btn.disabled = false;
      msg.innerHTML = `${esc(e.message)} <a href="#me">Manage my roadmaps</a>`;
      msg.scrollIntoView({ block: 'center' });
    }
  }

  /* ---------------------------------- router ---------------------------------- */
  async function render(ctx, arg, sub) {
    CTX = ctx;
    const i = await info();
    if (!i.enabled) { ctx.root.innerHTML = `${ctx.tabs('discover')}<div class="cr-note">Career Discovery is not available right now. <a href="#tracks">Explore career tracks</a></div>`; return; }
    if (ctx.ME) { await claimIfNeeded(); await hydrate(); }
    if (ctx.ME && S.pending_choice && arg === 'results') { const slug = S.pending_choice; await results(ctx.root); const b = ctx.root.querySelector(`[data-choose="${slug}"]`); if (b) return pick(slug, b); return; }
    if (arg === 'about') return about(ctx.root, Math.max(1, Number(sub) || 1));
    if (arg === 'quiz') return quiz(ctx.root);
    if (arg === 'results') return S.outcome || S.result_token || (ctx.ME && i.state?.discovery?.completed_at) ? results(ctx.root) : (location.hash = '#discover/about/1');
    return welcome(ctx.root);
  }
  window.CareerDiscovery = { render, shouldAutoShow, claimIfNeeded: (ctx) => { CTX = ctx; return claimIfNeeded(); }, highlight: hl };
})();
