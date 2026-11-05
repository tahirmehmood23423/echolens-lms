'use strict';
/*
 * EchoLens Career Discovery, drawn inside /career by career.js.
 *   #discover            welcome
 *   #discover/about/<n>  five optional questions, one per screen
 *   #discover/quiz       short beginner quiz (intro, then one question per screen)
 *   #discover/results    quiz summary, suggested tracks with reasons, all 12 tracks
 *
 * Purpose: a short quiz that suggests a career so the student can choose a
 * track and enrol. It deliberately links to no courses or lessons.
 * Guests can do everything; progress lives in this browser (localStorage)
 * and, once signed in, is attached to the account. Scores, keys and
 * recommendations all come from the server; this file only displays them.
 */
(() => {
  let KEY = 'elDiscovery.v1';
  let account = null;
  function scope(ctx) {
    const next = ctx.ME ? String(ctx.ME.id) : 'guest';
    if (account === next) return;
    let guest = {};
    try { guest = JSON.parse(localStorage.getItem('elDiscovery.v1:guest') || localStorage.getItem('elDiscovery.v1') || '{}'); } catch {}
    KEY = 'elDiscovery.v1:' + next;
    S = load();
    if (!guest.claimed_by && Object.keys(guest).length) {
      S = { ...guest, ...S };

    }
    account = next; INFO = null; HYDRATED = false;
  }
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch { return {}; } };
  const store = (s) => { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* private mode: keep going in memory */ } };
  let S = load(), INFO = null, CTX = null, HYDRATED = false, SYNC = Promise.resolve();
  const persist = () => store(S);
  const $ = (id) => document.getElementById(id);
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
  const ICON = {
    check: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5 10.5l3.2 3.2L15 7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    spark: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l2.2 5.6L20 11l-5.8 2.4L12 19l-2.2-5.6L4 11l5.8-2.4z" fill="currentColor"/></svg>',
    clock: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 7.5V12l3 2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    compass: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M15.5 8.5l-2 5-5 2 2-5z" fill="currentColor"/></svg>',
    arrow: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 10h11m-4-4l4 4-4 4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  };
  /** Three-step progress indicator with solid connectors. */
  function stepper(cur) {
    const order = ['about', 'quiz', 'results'], at = order.indexOf(cur);
    return `<ol class="dc-stepper" aria-label="Career Discovery steps">${[['about', 'About you'], ['quiz', 'Quick quiz'], ['results', 'Your matches']].map(([k, l], i) => {
      const state = i < at ? 'done' : i === at ? 'current' : 'todo';
      return `<li class="is-${state}"${state === 'current' ? ' aria-current="step"' : ''}><span class="dc-dot">${state === 'done' ? ICON.check : i + 1}</span><span class="dc-step-l">${l}</span></li>`;
    }).join('')}</ol>`;
  }
  async function sync(extra = {}) {
    S.pending = true; persist();
    if (!learner()) return;
    const payload = JSON.parse(JSON.stringify({ expected_user_id: CTX.ME.id, answers: S.answers || {}, step: S.step || 0, ...extra }));
    const state = S;
    const label = () => { const el = $('dcSync'); if (el) el.textContent = state.pending ? 'Saved on this device. Sync pending; keep this browser to resume offline.' : 'Saved to your account.'; };
    label();
    SYNC = SYNC.then(async () => {
      try {
        await CTX.api('/api/career/me/discovery', { method: 'PUT', body: payload });
        state.pending = false; state.claimed_by = CTX.ME.id; persist();
      } catch { state.pending = true; persist(); }
      label();
    });
    return SYNC;
  }
  /** On sign-in, attach a guest's answers and signed quiz result to the account (once). */
  async function claimIfNeeded() {
    if (!learner() || S.claimed_by === CTX.ME.id) return;
    if (!S.result_token && !Object.keys(S.answers || {}).length) return;
    try { await CTX.api('/api/career/me/discovery/claim', { method: 'POST', body: { expected_user_id: CTX.ME.id, answers: S.answers || {}, result_token: S.result_token || undefined, step: S.step || 0 } }); S.claimed_by = CTX.ME.id; persist(); try { localStorage.removeItem('elDiscovery.v1'); localStorage.removeItem('elDiscovery.v1:guest'); } catch {} } catch { /* try again next visit */ }
  }
  /** For a signed-in learner with nothing saved locally, pick up their saved progress. */
  async function hydrate() {
    if (HYDRATED) return;
    const i = await info(), d = i.state?.discovery; HYDRATED = true;
    if (!d) return;
    if (!S.pending && Object.keys(d.answers || {}).length) S.answers = d.answers;
    if (!S.step && d.step) S.step = d.step;
    if (d.dismissed_at) S.dismissed = true;
    if (!S.quiz && d.active_quiz) {
      try { const r = await CTX.api('/api/career/discovery/quiz/resume', { method: 'POST', body: { token: d.active_quiz.token } }); S.quiz = { token: r.token, questions: r.questions, answers: {}, cur: 0 }; } catch { /* expired */ }
    }
    persist();
  }
  /** Open the welcome automatically only for people with no career activity who have not skipped it. */
  async function shouldAutoShow(ctx) {
    CTX = ctx; scope(ctx);
    try {
      const i = await info();
      if (!i.enabled || S.dismissed || S.outcome) return false;
      if (ctx.ME) return !!(i.state && i.state.show_welcome);
      return !Object.keys(S.answers || {}).length;
    } catch { return false; }
  }
  const frame = (inner) => `${CTX.tabs('discover')}<div class="dc">${inner}</div>`;
  const signInBtn = () => (CTX.ME ? '' : '<button class="dc-btn dc-btn-text" id="dcSignIn" type="button">Sign in to save your progress</button>');
  const wireSignIn = () => { const b = $('dcSignIn'); if (b) b.onclick = () => { persist(); location.href = CTX.loginUrl(); }; };

  /* ---------------------------------- welcome ---------------------------------- */
  function welcome(root) {
    const resume = Object.keys(S.answers || {}).length || S.quiz || S.outcome;
    root.innerHTML = frame(`
      <section class="dc-hero" aria-labelledby="dcH">
        <div class="dc-hero-copy">
          <span class="dc-badge">${ICON.spark}Career Discovery</span>
          <h1 id="dcH">Discover Your Potential. Build Your Future.</h1>
          <p class="dc-lead">Find your technology career, discover the skills you already have, and follow a personalized learning path designed around your goals.</p>
          <div class="dc-hero-actions">
            <button class="dc-btn dc-btn-primary" id="dcGo" type="button">${resume ? 'Continue where I left off' : 'Discover My Career'}${ICON.arrow}</button>
            ${S.outcome ? '<button class="dc-btn dc-btn-soft" id="dcSeen" type="button">See my matches</button>' : ''}
            <button class="dc-btn dc-btn-ghost" id="dcSkip" type="button">Explore EchoLens First</button>
          </div>
          ${signInBtn()}
        </div>
        <div class="dc-hero-art" aria-hidden="true">${art()}</div>
      </section>
      <section class="dc-features" aria-label="What to expect">
        <div class="dc-feature"><span class="dc-ico dc-ico-teal">${ICON.spark}</span><div><b>Discover your strengths</b><p>No experience needed. Every career track starts from the basics.</p></div></div>
        <div class="dc-feature"><span class="dc-ico dc-ico-indigo">${ICON.clock}</span><div><b>Learn at your own pace</b><p>Five quick questions and a friendly 12 question quiz. Skip anything.</p></div></div>
        <div class="dc-feature"><span class="dc-ico dc-ico-amber">${ICON.compass}</span><div><b>Explore technology careers</b><p>We suggest careers and explain why, and you can choose any of the 12.</p></div></div>
      </section>
      ${stepper('')}`);
    $('dcGo').onclick = () => { location.hash = '#discover/about/' + (resume ? Math.min(S.step || 0, 4) + 1 : 1); };
    if ($('dcSeen')) $('dcSeen').onclick = () => { location.hash = '#discover/results'; };
    $('dcSkip').onclick = async () => { S.dismissed = true; persist(); if (learner()) { try { await CTX.api('/api/career/me/discovery', { method: 'PUT', body: { expected_user_id: CTX.ME.id, dismissed: true } }); } catch { /* fine */ } } location.hash = learner() ? '#me' : '#tracks'; };
    wireSignIn();
  }
  /** Illustration: one starting point connected to six career areas, each in its own palette tint. */
  function art() {
    const nodes = [[72, 120, 'Web', 'teal'], [168, 48, 'AI', 'indigo'], [272, 92, 'Data', 'sky'], [290, 200, 'Cloud', 'teal'], [182, 262, 'Security', 'amber'], [70, 228, 'Mobile', 'indigo']];
    return `<svg viewBox="0 0 360 310" role="img">
      <circle cx="180" cy="158" r="132" class="dc-art-ring"/>
      <circle cx="180" cy="158" r="86" class="dc-art-ring2"/>
      ${nodes.map(([x, y]) => `<line x1="180" y1="158" x2="${x}" y2="${y}" class="dc-art-line"/>`).join('')}
      <circle cx="180" cy="158" r="30" class="dc-art-core"/><text x="180" y="163" text-anchor="middle" class="dc-art-core-t">You</text>
      ${nodes.map(([x, y, t, c], i) => `<g class="dc-art-node dc-tone-${c}" style="animation-delay:${i * 0.4}s"><circle cx="${x}" cy="${y}" r="27"/><text x="${x}" y="${y + 4}" text-anchor="middle">${t}</text></g>`).join('')}
    </svg>`;
  }

  /* ------------------------------ about you (5 questions) ------------------------------ */
  async function about(root, n) {
    const i = await info(), qs = i.questions, q = qs[n - 1];
    if (!q) { location.hash = '#discover/quiz'; return; }
    S.answers = S.answers || {};
    const cur = [].concat(S.answers[q.id] || []);
    root.innerHTML = frame(`${stepper('about')}
      <section class="dc-panel" aria-labelledby="dcQ">
        <div class="dc-panel-top"><span class="dc-kicker">Question ${n} of ${qs.length}</span>
          <div class="dc-segments" aria-hidden="true">${qs.map((_, k) => `<i class="${k < n ? 'on' : ''}"></i>`).join('')}</div></div>
        <h1 id="dcQ" class="dc-title">${esc(q.title)}</h1>
        <p class="dc-sub">${esc(q.hint)}</p><p class="cr-small cr-muted" id="dcSync" role="status">${learner() ? S.pending ? 'Saved on this device. Sync pending.' : 'Saved to your account as you go.' : 'Saved on this device. Sign in to save across devices.'}</p>
        <fieldset class="dc-options${q.options.length > 6 ? ' dc-options-3' : ''}"><legend class="sr-only">${esc(q.title)}</legend>
          ${q.options.map((o) => `<label class="dc-option"><input type="${q.multi ? 'checkbox' : 'radio'}" name="dcOpt" value="${esc(o.id)}"${cur.includes(o.id) ? ' checked' : ''}><span class="dc-mark${q.multi ? '' : ' dc-mark-round'}">${ICON.check}</span><span class="dc-option-t">${esc(o.text)}</span></label>`).join('')}
        </fieldset>
        ${q.id === 'experience' ? '<p class="dc-note">This only helps us tailor suggestions. It is never treated as a test result.</p>' : ''}
        <div class="dc-panel-foot">
          <button class="dc-btn dc-btn-ghost" id="dcBack" type="button">Back</button>
          <span class="dc-grow"></span>
          <button class="dc-btn dc-btn-text" id="dcSkipQ" type="button">Skip question</button>
          <button class="dc-btn dc-btn-primary" id="dcNext" type="button">${n === qs.length ? 'Continue to the quiz' : 'Next'}${ICON.arrow}</button>
        </div>
      </section>`);
    const boxes = [...root.querySelectorAll('input[name=dcOpt]')];
    boxes.forEach((b) => b.addEventListener('change', () => {
      // "Not sure yet" and "None yet" cannot be combined with other choices.
      if (q.multi && b.checked && ['unsure', 'none'].includes(b.value)) boxes.forEach((x) => { if (x !== b) x.checked = false; });
      else if (q.multi && b.checked) boxes.forEach((x) => { if (['unsure', 'none'].includes(x.value)) x.checked = false; });
      const picked = boxes.filter(x => x.checked).map(x => x.value);
      S.answers[q.id] = q.multi ? picked : picked[0] || ''; S.step = n - 1;
      sync();
    }));
    const go = async (keep) => {
      const picked = boxes.filter((b) => b.checked).map((b) => b.value);
      if (keep) S.answers[q.id] = q.multi ? picked : picked[0] || ''; // explicit empty choice clears a saved preference
      S.step = Math.max(S.step || 0, n);
      await sync();
      location.hash = n === qs.length ? '#discover/quiz' : '#discover/about/' + (n + 1);
    };
    $('dcBack').onclick = () => { location.hash = n === 1 ? '#discover' : '#discover/about/' + (n - 1); };
    $('dcNext').onclick = () => go(true);
    $('dcSkipQ').onclick = () => go(false);
  }

  /* ---------------------------------- quiz ---------------------------------- */
  async function quiz(root) {
    const i = await info();
    if (S.quiz) return drawQ(root);
    root.innerHTML = frame(`${stepper('quiz')}
      <section class="dc-panel" aria-labelledby="dcQi">
        <span class="dc-kicker">Step 2 · Quick quiz</span>
        <h1 id="dcQi" class="dc-title">Let’s Discover What You Already Know</h1>
        <p class="dc-sub">${i.quiz.items} multiple choice questions about everyday computing ideas. It takes about ${i.quiz.minutes} minutes.</p>
        <div class="dc-tiles">
          <div class="dc-tile dc-tone-teal"><b>Beginner friendly</b><span>Every technical word is explained in the question.</span></div>
          <div class="dc-tile dc-tone-indigo"><b>Skip freely</b><span>No negative marking. Your score covers the questions you answer. This is not a formal examination.</span></div>
          <div class="dc-tile dc-tone-amber"><b>No pressure</b><span>It only helps us suggest where to start. It never closes any career to you.</span></div>
        </div>
        <div class="dc-panel-foot">
          <button class="dc-btn dc-btn-ghost" id="dcNoQuiz" type="button">Skip the quiz</button>
          <span class="dc-grow"></span>
          <button class="dc-btn dc-btn-primary" id="dcStartQuiz" type="button"${i.quiz.available ? '' : ' disabled'}>Start the quiz${ICON.arrow}</button>
        </div>
        <p id="dcMsg" class="dc-error" role="alert"></p>
      </section>`);
    $('dcStartQuiz').onclick = async () => {
      $('dcStartQuiz').disabled = true;
      try { const r = await CTX.api('/api/career/discovery/quiz', { method: 'POST' }); S.quiz = { token: r.token, questions: r.questions, answers: {}, cur: 0 }; persist(); drawQ(root); }
      catch (e) { $('dcMsg').textContent = e.message; $('dcStartQuiz').disabled = false; }
    };
    $('dcNoQuiz').onclick = () => showRecs();
  }
  const LETTERS = 'ABCD';
  function drawQ(root) {
    const z = S.quiz, q = z.questions[z.cur], n = z.questions.length, v = z.answers[q.id];
    const done = z.questions.filter((x) => z.answers[x.id]).length;
    root.innerHTML = frame(`${stepper('quiz')}
      <section class="dc-panel" aria-labelledby="dcQq">
        <div class="dc-panel-top"><span class="dc-kicker">Question ${z.cur + 1} of ${n}</span><span class="dc-count">${done} answered</span></div>
        <div class="dc-bar" role="progressbar" aria-valuemin="0" aria-valuemax="${n}" aria-valuenow="${z.cur + 1}" aria-label="Quiz progress"><i style="width:${Math.round(((z.cur + 1) / n) * 100)}%"></i></div>
        <h1 id="dcQq" class="dc-qtext">${esc(q.prompt)}</h1>
        ${q.code ? `<pre class="dc-code"><code>${hl(q.code)}</code></pre>` : ''}
        <fieldset class="dc-answers"><legend class="sr-only">Answer options</legend>
          ${q.options.map((o, k) => `<label class="dc-answer"><input type="radio" name="dcA" value="${esc(o.id)}"${v === o.id ? ' checked' : ''}><span class="dc-letter">${LETTERS[k]}</span><span class="dc-answer-t">${esc(o.text)}</span></label>`).join('')}
        </fieldset>
        <div class="dc-panel-foot">
          <button class="dc-btn dc-btn-ghost" id="dcPrev" type="button"${z.cur === 0 ? ' disabled' : ''}>Previous</button>
          <span class="dc-grow"></span>
          ${z.cur < n - 1 ? `<button class="dc-btn dc-btn-text" id="dcSk" type="button">Skip</button><button class="dc-btn dc-btn-primary" id="dcN" type="button">Next${ICON.arrow}</button>`
            : `<button class="dc-btn dc-btn-primary" id="dcFin" type="button">See my results${ICON.arrow}</button>`}
        </div>
        <p id="dcMsg" class="dc-error" role="alert"></p>
      </section>`);
    root.querySelectorAll('input[name=dcA]').forEach((x) => x.addEventListener('change', () => { z.answers[q.id] = x.value; persist(); }));
    const move = (d) => { z.cur = Math.max(0, Math.min(n - 1, z.cur + d)); persist(); drawQ(root); window.scrollTo(0, 0); };
    $('dcPrev').onclick = () => move(-1);
    if ($('dcN')) $('dcN').onclick = () => move(1);
    if ($('dcSk')) $('dcSk').onclick = () => { delete z.answers[q.id]; move(1); };
    if ($('dcFin')) $('dcFin').onclick = async () => {
      $('dcFin').disabled = true;
      try {
        const out = await CTX.api('/api/career/discovery/quiz/submit', { method: 'POST', body: { token: z.token, answers: z.answers, onboarding: S.answers || {} } });
        S.outcome = out; S.result_token = out.result_token; S.quiz = null; if (learner()) S.claimed_by = CTX.ME.id; persist(); try { localStorage.removeItem('elDiscovery.v1'); localStorage.removeItem('elDiscovery.v1:guest'); } catch {}
        location.hash = '#discover/results';
      } catch (e) {
        $('dcMsg').innerHTML = `${esc(e.message)} <button class="dc-btn dc-btn-soft dc-btn-sm" id="dcRestart" type="button">Start a new quiz</button>`;
        $('dcRestart').onclick = () => { S.quiz = null; persist(); quiz(CTX.root); };
        $('dcFin').disabled = false;
      }
    };
  }
  async function showRecs() {
    try {
      const r = await CTX.api('/api/career/discovery/recommendations', { method: 'POST', body: learner() ? {} : { answers: S.answers || {}, result_token: S.result_token } });
      S.outcome = { ...(S.outcome || {}), recommendations: r.recommendations, starting_point: r.starting_point }; persist();
      if (learner()) { try { await CTX.api('/api/career/me/discovery', { method: 'PUT', body: { completed: true } }); } catch { /* fine */ } }
    } catch { /* offline */ }
    location.hash = '#discover/results';
  }

  /* --------------------------------- results --------------------------------- */
  const LEVEL = { strong: ['Strength', 'teal'], developing: ['Getting there', 'amber'], new: ['New to you', 'indigo'], skipped: ['Skipped', 'slate'] };
  async function results(root) {
    const i = await info();
    try {
      const r = await CTX.api('/api/career/discovery/recommendations', { method: 'POST', body: learner() ? {} : { answers: S.answers || {}, result_token: S.result_token } });
      S.outcome = { ...(S.outcome || {}), recommendations: r.recommendations, starting_point: r.starting_point, result: S.outcome?.result || r.quiz || null }; persist();
    } catch { /* show the last known suggestions */ }
    const o = S.outcome || {}, recs = o.recommendations || [], res = o.result;
    const recSet = new Set(recs.map((x) => x.slug));
    const rm = CTX.ME?.career?.roadmaps || { enrollments: [] };
    const following = new Set((rm.enrollments || []).filter((e) => e.status !== 'archived').map((e) => e.track));
    const choose = (slug, primary) => (following.has(slug) ? '<span class="dc-pill dc-tone-teal">In your roadmaps</span>'
      : `<button class="dc-btn ${primary ? 'dc-btn-primary' : 'dc-btn-soft'} dc-btn-sm" data-choose="${esc(slug)}" type="button">Choose this career</button>`);
    const meter = (a) => `<div class="dc-meter dc-tone-${LEVEL[a.level][1]}"><i style="width:${a.score == null ? 0 : Math.max(6, a.score)}%"></i></div>`;
    root.innerHTML = frame(`${stepper('results')}
      <section class="dc-summary" aria-labelledby="dcRh">
        <div><span class="dc-kicker">Step 3 · Your matches</span>
          <h1 id="dcRh" class="dc-title">Your career matches</h1>
          <p class="dc-sub">Based on what you told us${res ? ' and your quiz' : ''}. These are suggestions, not a verdict, and you can choose any of the 12 careers.</p></div>
        ${res ? `<div class="dc-stats"><div><b>${res.answered}/${res.total}</b><span>questions answered</span></div>${res.score != null ? `<div><b>${res.score}%</b><span>of those correct</span></div>` : ''}</div>` : ''}
      </section>

      <section aria-labelledby="dcRec">
        <h2 id="dcRec" class="dc-h2">Suggested for you</h2>
        <div class="dc-recs">${recs.map((r, k) => `<article class="dc-rec${k === 0 ? ' dc-rec-top' : ''}">
          ${k === 0 ? '<span class="dc-ribbon">Best match</span>' : ''}
          <h3>${esc(r.title)}</h3>
          <ul class="dc-reasons">${r.reasons.map((x) => `<li>${ICON.check}<span>${esc(x)}</span></li>`).join('')}</ul>
          <p class="dc-start"><b>Where you would start</b>${esc(r.start)}</p>
          <div class="dc-rec-foot">${choose(r.slug, true)}</div></article>`).join('')}</div>
        <div class="dc-row"><button class="dc-btn dc-btn-ghost" id="dcBrowse" type="button">Browse all 12 careers</button><button class="dc-btn dc-btn-text" id="dcRedo" type="button">Change my answers</button></div>
        <p id="dcMsg" class="dc-error" role="alert"></p>
      </section>

      ${res ? `<section class="dc-panel dc-panel-wide" aria-labelledby="dcRes">
        <h2 id="dcRes" class="dc-h2 dc-h2-tight">What your quiz showed</h2>
        <p class="dc-sub">A friendly first look at where you are today, not a grade.</p>
        <div class="dc-areas">${Object.values(res.areas).map((a) => `<div class="dc-area">
          <div class="dc-area-h"><b>${esc(a.name)}</b><span class="dc-pill dc-tone-${LEVEL[a.level][1]}">${LEVEL[a.level][0]}</span></div>
          ${meter(a)}<p>${esc(a.message)}</p></div>`).join('')}</div>
        ${(o.review || []).length ? `<details class="dc-review"><summary>See every question with the correct answer</summary>${o.review.map((x, k) => `<div class="dc-rev">
          <p class="dc-rev-q"><span>${k + 1}</span>${esc(x.prompt)}</p>${x.code ? `<pre class="dc-code"><code>${hl(x.code)}</code></pre>` : ''}
          <p>${x.answered ? (x.correct ? '<span class="dc-pill dc-tone-teal">Correct</span>' : `<span class="dc-pill dc-tone-amber">Not quite</span> You chose: ${esc(x.your_answer)}`) : '<span class="dc-pill dc-tone-slate">Skipped</span>'}</p>
          <p class="dc-rev-a"><b>Answer: ${esc(x.correct_answer)}.</b> ${esc(x.explanation)}</p></div>`).join('')}</details>` : ''}
      </section>` : `<div class="dc-callout"><div><b>You skipped the quiz.</b> That is fine. Taking it gives more tailored suggestions.</div><button class="dc-btn dc-btn-soft dc-btn-sm" id="dcTake" type="button">Take the quiz</button></div>`}

      <section aria-labelledby="dcAllH" id="dcAll">
        <h2 id="dcAllH" class="dc-h2">All 12 careers</h2>
        <p class="dc-sub">Every career track starts from the basics. Pick the one that excites you. You can follow up to three and change your mind later.</p>
        <div class="dc-grid">${i.tracks.map((t) => `<article class="dc-tcard${recSet.has(t.slug) ? ' is-suggested' : ''}">
          <div class="dc-tcard-h"><h3>${esc(t.title)}</h3>${recSet.has(t.slug) ? '<span class="dc-pill dc-tone-teal">Suggested</span>' : ''}</div>
          <p>${esc(String(t.overview || '').split('. ')[0])}.</p>
          ${t.duration ? `<span class="dc-meta">${ICON.clock}${esc(t.duration)}</span>` : ''}
          <div class="dc-tcard-f">${choose(t.slug, false)}</div></article>`).join('')}</div>
      </section>`);
    $('dcBrowse').onclick = () => $('dcAll').scrollIntoView({ behavior: 'smooth' });
    $('dcRedo').onclick = () => { location.hash = '#discover/about/1'; };
    if ($('dcTake')) $('dcTake').onclick = () => { location.hash = '#discover/quiz'; };
    root.querySelectorAll('[data-choose]').forEach((b) => { b.onclick = () => pick(b.dataset.choose, b); });
  }
  /** Choose a career: signed-in learners get a roadmap now; guests sign in first and come back here. */
  async function pick(slug, btn) {
    const msg = $('dcMsg');
    if (!CTX.ME) { S.pending_choice = slug; persist(); location.href = '/login?returnTo=' + encodeURIComponent('/career#discover/results'); return; }
    if (!learner()) { msg.textContent = 'Career roadmaps are for learner accounts.'; return; }
    btn.disabled = true;
    try {
      const hasPrimary = !!CTX.ME.career?.roadmaps?.primary;
      const out = await CTX.api('/api/career/me/enrollments', { method: 'POST', body: { track: slug, primary: !hasPrimary } });
      await CTX.api('/api/career/me/discovery', { method: 'PUT', body: { chosen_track: slug, completed: true } });
      S.pending_choice = null; persist();
      await CTX.loadMe(); CTX.setAdvice(out.recommendation);
      location.hash = '#path/' + slug;
    } catch (e) {
      btn.disabled = false;
      msg.textContent = e.message;
      msg.scrollIntoView({ block: 'center' });
    }
  }

  /* ---------------------------------- router ---------------------------------- */
  async function render(ctx, arg, sub) {
    CTX = ctx; scope(ctx);
    const i = await info();
    if (!i.enabled) { ctx.root.innerHTML = frame('<div class="dc-callout"><div><b>Career Discovery is not available right now.</b></div></div>'); return; }
    if (ctx.ME) { await claimIfNeeded(); await hydrate(); }
    if (ctx.ME && S.pending_choice && arg === 'results') { const slug = S.pending_choice; await results(ctx.root); const b = ctx.root.querySelector(`[data-choose="${slug}"]`); if (b) return pick(slug, b); return; }
    if (arg === 'about') return about(ctx.root, Math.max(1, Number(sub) || 1));
    if (arg === 'quiz') return quiz(ctx.root);
    if (arg === 'results') return S.outcome || S.result_token || (ctx.ME && i.state?.discovery?.completed_at) ? results(ctx.root) : (location.hash = '#discover/about/1');
    return welcome(ctx.root);
  }
  window.CareerDiscovery = { render, shouldAutoShow, claimIfNeeded: (ctx) => { CTX = ctx; scope(ctx); return claimIfNeeded(); }, highlight: hl, recommended: () => (S.outcome?.recommendations || []).map((r) => r.slug || r.track) };
})();
