'use strict';
/*
 * Admin portal -> Career Assessments. Uses dashboard.js helpers (api, esc,
 * openModal, closeModal, modalMsg, toast). Everything here goes through
 * /api/admin/career/*, which is admin-only and audit-logged on the server.
 *
 * Tabs: Overview (banks, assessment availability, enable/disable),
 * Questions (review, publish, edit = new version, add), Scoring (weights,
 * bands, thresholds), Tracks (status, text, skill weights/prerequisites),
 * Preview (sample form with keys), Insights (completion, gaps, item quality,
 * content gaps).
 */
let CA_TAB = 'overview', CA_BANK = 'common', CA_FILTER = '', CA_DATA = null;
const CA_TABS = [['overview', 'Overview'], ['questions', 'Question banks'], ['scoring', 'Scoring rules'], ['tracks', 'Career tracks'], ['preview', 'Preview a form'], ['insights', 'Insights']];

async function renderAdminCareer(tab) {
  if (tab) CA_TAB = tab;
  const el = $('view-admin-career');
  el.innerHTML = '<div class="empty">Loading&hellip;</div>';
  CA_DATA = await api('/api/admin/career/overview');
  const head = `<div class="card"><div class="card-body" style="display:flex;gap:6px;flex-wrap:wrap">${CA_TABS.map(([k, l]) => `<button class="btn btn-sm ${CA_TAB === k ? 'btn-primary' : 'btn-ghost'}" onclick="renderAdminCareer('${k}')">${l}</button>`).join('')}
    <span style="flex:1"></span><a class="btn btn-ghost btn-sm" href="/career" target="_blank" rel="noopener">Open student view</a></div></div>`;
  const body = await ({ overview: caOverview, questions: caQuestions, scoring: caScoring, tracks: caTracks, preview: caPreview, insights: caInsights }[CA_TAB])();
  el.innerHTML = head + body;
  caWire();
}

function caOverview() {
  const d = CA_DATA;
  return `<div class="card"><div class="card-head"><h3>Question banks</h3></div><div class="card-body" style="padding:0;overflow-x:auto"><table class="tbl">
      <tr><th>Bank</th><th>Total</th><th>Draft</th><th>Reviewed</th><th>Published</th><th>Retired</th><th></th></tr>
      ${d.banks.map((b) => `<tr><td>${esc(b.title)}</td><td>${b.total}</td><td>${b.draft}</td><td>${b.reviewed}</td><td><b>${b.published}</b></td><td>${b.retired}</td>
        <td style="text-align:right"><button class="btn btn-ghost btn-sm" onclick="CA_BANK='${b.bank}';renderAdminCareer('questions')">Review questions</button></td></tr>`).join('')}
    </table></div></div>
    <div class="card"><div class="card-head"><h3>Assessments</h3></div><div class="card-body">
      <p class="s" style="color:var(--muted);margin-bottom:10px">An assessment opens to students only when it is enabled and every skill it measures has enough <b>published</b> questions. New questions ship as drafts: review each one, mark it reviewed, then publish.</p>
      <div style="overflow-x:auto"><table class="tbl"><tr><th>Assessment</th><th>Status</th><th>Coverage</th><th>Enabled</th></tr>
      ${d.assessments.map((a) => `<tr><td>${esc(a.title || a.key)}</td><td>${a.available ? '<span style="color:var(--ok);font-weight:700">✓ Open to students</span>' : esc(a.reason || 'Not available')}</td>
        <td class="s">${a.coverage ? `<div><b>Theory ${a.coverage.categories.theory} &middot; Practical ${a.coverage.categories.practical} &middot; Scenario ${a.coverage.categories.scenario} &middot; Reviewed ${a.coverage.reviewed}</b></div>` + a.coverage.skills.map((s) => `${esc(s.name)}: ${s.published}/${s.want}${s.ok ? '' : ' ✕'}`).join(' &middot; ')
          + (a.coverage.thin?.length ? `<details style="margin-top:4px"><summary style="color:#7A4A00">${a.coverage.thin.length} skill/category pair${a.coverage.thin.length === 1 ? '' : 's'} with no alternate form</summary>${a.coverage.thin.map((t) => `${esc(t.name)}: ${t.have} ${esc(t.category)}`).join(' &middot; ')}<div style="color:var(--muted)">Add a second published item in these so retakes get fresh questions.</div></details>` : '') : '-'}</td>
        <td><label style="display:inline-flex;gap:6px;align-items:center"><input type="checkbox" data-ca-enable="${esc(a.key)}"${a.enabled ? ' checked' : ''}> ${a.enabled ? 'On' : 'Off'}</label></td></tr>`).join('')}
      </table></div></div></div>`;
}

async function caQuestions() {
  const d = await api('/api/admin/career/questions?bank=' + encodeURIComponent(CA_BANK));
  const list = d.questions.filter((q) => !CA_FILTER || q.status === CA_FILTER);
  return `<div class="card"><div class="card-body" style="display:flex;gap:10px;flex-wrap:wrap;align-items:center">
      <label class="s">Bank <select id="caBank">${CA_DATA.banks.map((b) => `<option value="${b.bank}"${b.bank === CA_BANK ? ' selected' : ''}>${esc(b.title)}</option>`).join('')}</select></label>
      <label class="s">Status <select id="caFilter"><option value="">All</option>${['draft', 'reviewed', 'published', 'retired'].map((s) => `<option${s === CA_FILTER ? ' selected' : ''}>${s}</option>`).join('')}</select></label>
      <span style="flex:1"></span>
      <button class="btn btn-ghost btn-sm" data-ca-bulk="reviewed">Mark selected reviewed</button>
      <button class="btn btn-primary btn-sm" data-ca-bulk="published">Publish selected</button>
      <button class="btn btn-ghost btn-sm" data-ca-bulk="retired">Retire selected</button>
      <button class="btn btn-teal btn-sm" onclick="caEditQuestion(null)">+ Add question</button></div>
    <div class="card-body" style="padding-top:0"><p class="s" style="color:var(--muted)">Read each question, its options, key and explanation before publishing. Editing a question creates a new version and returns it to draft; students' past results keep the version they answered.</p></div></div>
    <div class="card"><div class="card-body" style="padding:0;overflow-x:auto"><table class="tbl">
      <tr><th><input type="checkbox" id="caAll" aria-label="Select all"></th><th>Question</th><th>Skill</th><th>Type</th><th>Diff.</th><th>Status</th><th>v</th><th></th></tr>
      ${list.map((q) => `<tr><td><input type="checkbox" class="caPick" value="${esc(q.id)}" aria-label="Select ${esc(q.id)}"></td>
        <td style="max-width:420px"><div class="mono s">${esc(q.id)}</div>${esc(q.prompt)}${q.code ? `<pre style="white-space:pre-wrap;font-size:12px;background:#F1F5F9;padding:6px 8px;border-radius:6px;margin:4px 0">${esc(q.code)}</pre>` : ''}
          <details><summary class="s">Options, key and explanation</summary>
            ${q.grading === 'review' ? `<div class="s"><b>Rubric:</b><ul>${q.rubric.map((r) => `<li>${esc(r.criterion)} (${r.points})</li>`).join('')}</ul><b>Reference answer:</b><pre style="white-space:pre-wrap;font-size:12px">${esc(q.model_answer || '')}</pre></div>`
              : q.options.length ? `<ol type="a" class="s">${q.options.map((o) => `<li>${q.answer.includes(o.id) ? '<b>✓ ' : ''}${esc(o.text)}${q.answer.includes(o.id) ? '</b>' : ''}</li>`).join('')}</ol>` : `<div class="s">Accepted answers: <b>${q.answer.map(esc).join(' | ')}</b></div>`}
            <div class="s" style="color:var(--muted)">${esc(q.explanation)}</div></details></td>
        <td class="s">${esc(q.skills.join(', '))}</td><td class="s">${esc(q.type)} &middot; <b>${esc(q.category)}</b>${q.grading === 'review' ? ' &middot; staff-reviewed' : ''}</td><td>${q.difficulty}</td>
        <td class="s"><b>${esc(q.status)}</b>${q.reviewed_at ? `<div style="color:var(--muted)" title="${esc(typeof q.reviewed_by === 'string' ? q.reviewed_by : 'Admin #' + q.reviewed_by)}">${esc(String(q.reviewed_at).slice(0, 10))}${typeof q.reviewed_by === 'string' ? ' &middot; content review' : ''}</div>` : ''}</td><td>${q.version}</td>
        <td><button class="btn btn-ghost btn-sm" onclick='caEditQuestion(${JSON.stringify(q.id)})'>Edit</button></td></tr>`).join('') || '<tr><td colspan="8" class="empty">No questions match.</td></tr>'}
    </table></div></div>`;
}
window.CA_QCACHE = {};
async function caEditQuestion(id) {
  const q = id ? (await api('/api/admin/career/questions?bank=' + encodeURIComponent(CA_BANK))).questions.find((x) => x.id === id) : { type: 'single', skills: [], difficulty: 1, options: [], answer: [], practical: false };
  const skills = (await api('/api/career/tracks')).skills;
  const optText = (q.options || []).map((o) => o.text).join('\n');
  const keyText = q.type === 'output' ? (q.answer || []).join('\n') : (q.answer || []).join(',');
  openModal(id ? `Edit ${id} (saves as version ${q.version + 1}, back to draft)` : `Add a question to ${CA_BANK}`, `
    <form id="caQForm">
      <div class="form-grid">
        <label class="field"><span>Type</span><select name="type">${['single', 'multi', 'output', 'debug', 'scenario', 'written', 'submission'].map((t) => `<option${t === q.type ? ' selected' : ''}>${t}</option>`).join('')}</select></label>
        <label class="field"><span>Evaluation category</span><select name="category">${['theory', 'practical', 'scenario'].map((c) => `<option${c === (q.category || 'theory') ? ' selected' : ''}>${c}</option>`).join('')}</select></label>
        <label class="field"><span>Difficulty</span><select name="difficulty">${[1, 2, 3].map((n) => `<option${n === q.difficulty ? ' selected' : ''}>${n}</option>`).join('')}</select></label>
        <label class="field"><span>Skill (primary first)</span><select name="skill">${skills.map((s) => `<option value="${esc(s.id)}"${s.id === q.skills[0] ? ' selected' : ''}>${esc(s.group)} - ${esc(s.name)}</option>`).join('')}</select></label>
        <label class="field" style="display:flex;gap:8px;align-items:center"><input type="checkbox" name="practical" style="width:auto"${q.practical ? ' checked' : ''}> <span>Practical task</span></label>
      </div>
      <label class="field"><span>Question statement</span><textarea name="prompt" rows="2" required>${esc(q.prompt || '')}</textarea></label>
      <label class="field"><span>Code (optional)</span><textarea name="code" rows="4" style="font-family:monospace">${esc(q.code || '')}</textarea></label>
      <label class="field"><span>Options - one per line (leave empty for typed "output" answers)</span><textarea name="options" rows="4">${esc(optText)}</textarea></label>
      <label class="field"><span>Correct answer: option letters, comma-separated (a,c) - or, for output questions, each accepted answer on its own line</span><textarea name="answer" rows="2">${esc(keyText)}</textarea></label>
      <label class="field"><span>Explanation of the correct answer (for written/submission: the reference answer reviewers see)</span><textarea name="explanation" rows="3" required>${esc(q.explanation || '')}</textarea></label>
      <label class="field"><span>Rubric for written/submission types - one criterion per line as "criterion | points"</span><textarea name="rubric" rows="4" placeholder="Explains block scope | 2">${esc((q.rubric || []).map((r) => r.criterion + ' | ' + r.points).join('\n'))}</textarea></label>
      <label class="field"><span>Submissions only: let students test their code in the browser compiler</span><select name="run_lang"><option value="">No run button</option>${['python', 'javascript'].map((l) => `<option${q.run_lang === l ? ' selected' : ''}>${l}</option>`).join('')}</select></label>
      <p class="s" style="color:var(--muted)">Written and submission answers are always scored by a staff reviewer against this rubric. AI can only suggest scores to the reviewer.</p>
      <button class="btn btn-primary btn-block">${id ? 'Save new version' : 'Add as draft'}</button>
    </form>`, true);
  $('caQForm').addEventListener('submit', async (e) => {
    e.preventDefault(); const f = e.target, type = f.type.value;
    const body = { bank: CA_BANK, type, category: f.category.value, difficulty: Number(f.difficulty.value),
      rubric: f.rubric.value.split('\n').map((l) => l.split('|')).filter((p) => p[0].trim()).map((p) => ({ criterion: p[0].trim(), points: Number(p[1]) })),
      model_answer: f.explanation.value, run_lang: f.run_lang.value, skills: [f.skill.value, ...(q.skills || []).slice(1)].filter((v, i, a) => a.indexOf(v) === i), practical: f.practical.checked,
      prompt: f.prompt.value, code: f.code.value, explanation: f.explanation.value,
      options: f.options.value.split('\n').map((x) => x.trim()).filter(Boolean),
      answer: type === 'output' ? f.answer.value.split('\n').map((x) => x.trim()).filter(Boolean) : f.answer.value.split(',').map((x) => x.trim().toLowerCase()).filter(Boolean) };
    try { await api(id ? '/api/admin/career/questions/' + encodeURIComponent(id) : '/api/admin/career/questions', { method: id ? 'PUT' : 'POST', body: JSON.stringify(body) }); closeModal(); toast(id ? 'Saved as a new draft version.' : 'Question added as a draft.'); renderAdminCareer('questions'); }
    catch (err) { modalMsg(err.message); }
  });
}

function caScoring() {
  const c = CA_DATA.config;
  const total = Object.values(c.common_weights).reduce((a, b) => a + b, 0);
  return `<div class="card"><div class="card-head"><h3>Scoring rules</h3><span class="s" style="color:var(--muted)">Config version ${c.version}. Changes apply to new attempts only.</span></div><div class="card-body">
    <form id="caCfg">
      <h4>Common CS category weights (currently total ${total})</h4>
      <div class="form-grid">${Object.entries(c.common_weights).map(([k, v]) => `<label class="field"><span>${esc(k)}</span><input type="number" min="0" max="100" name="w:${esc(k)}" value="${v}"></label>`).join('')}</div>
      <h4>Theory / practical / scenario weights</h4>
      <p class="s" style="color:var(--muted)">How much each evaluation category counts in an assessment's overall score. Tracks start from their own defaults; leave a row as it is to keep it.</p>
      <div style="overflow-x:auto"><table class="tbl"><tr><th>Assessment</th><th>Theory</th><th>Practical</th><th>Scenario</th></tr>
        ${CA_DATA.weights.map((w) => `<tr><td>${esc(w.title)}</td>${['theory', 'practical', 'scenario'].map((c) => `<td><input type="number" min="0" max="100" style="width:80px" name="cw:${esc(w.key)}:${c}" value="${w.weights[c]}"></td>`).join('')}</tr>`).join('')}</table></div>
      <h4>Level bands (minimum score for each level)</h4>
      <div class="form-grid">${c.bands.map((b, i) => `<label class="field"><span>Level ${i + 1} name</span><input name="bl:${i}" value="${esc(b.level)}"></label><label class="field"><span>From %</span><input type="number" min="0" max="100" name="bm:${i}" value="${b.min}"${i === 0 ? ' readonly' : ''}></label>`).join('')}</div>
      <h4>Skill status and evidence</h4>
      <div class="form-grid">
        <label class="field"><span>Strong from %</span><input type="number" name="strong" value="${c.skill_thresholds.strong}"></label>
        <label class="field"><span>Developing from %</span><input type="number" name="developing" value="${c.skill_thresholds.developing}"></label>
        <label class="field"><span>Answered questions needed per skill</span><input type="number" name="min_evidence_items" value="${c.min_evidence_items}"></label>
        <label class="field"><span>Share of track weight needed for a level (0-1)</span><input type="number" step="0.05" name="min_confidence" value="${c.min_confidence}"></label>
        <label class="field"><span>Questions per skill (track assessments)</span><input type="number" name="track_items_per_skill" value="${c.track_items_per_skill}"></label>
        <label class="field"><span>Questions per skill reassessment</span><input type="number" name="skill_reassess_items" value="${c.skill_reassess_items}"></label>
        <label class="field"><span>Hours before a full retake</span><input type="number" name="retake_cooldown_hours" value="${c.retake_cooldown_hours}"></label>
        <label class="field"><span>Minimum MCQs per common or track assessment (10-60)</span><input type="number" min="10" max="60" name="min_form_items" value="${c.min_form_items}"></label>
        <label class="field"><span>Active roadmaps per student (1-12)</span><input type="number" min="1" max="12" name="max_active_roadmaps" value="${c.max_active_roadmaps}"></label>
        <label class="field"><span>Days a common CS result stays valid (30-1095)</span><input type="number" min="30" max="1095" name="common_valid_days" value="${c.common_valid_days}"></label>
        <label class="field"><span>Days a verified skill can be reused (30-1095)</span><input type="number" min="30" max="1095" name="skill_valid_days" value="${c.skill_valid_days}"></label>
        <label class="field"><span>Answered items a category needs to count</span><input type="number" min="1" max="10" name="min_category_items" value="${c.min_category_items}"></label>
      </div>
      <p class="s" style="color:var(--muted)">These bands are provisional placement guidance. Calibrate them against pilot results before relying on them.</p>
      <button class="btn btn-primary">Save scoring rules</button>
    </form></div></div>`;
}

function caTracks() {
  return `<div class="card"><div class="card-head"><h3>Career tracks</h3></div><div class="card-body" style="padding:0;overflow-x:auto"><table class="tbl">
    <tr><th>Track</th><th>Question banks</th><th>Status</th><th></th></tr>
    ${CA_DATA.tracks.map((t) => `<tr><td>${esc(t.title)}</td><td class="s">${t.banks.length ? esc(t.banks.join(', ')) : 'Assessment coming soon'}</td><td><b>${esc(t.status)}</b></td>
      <td style="text-align:right"><button class="btn btn-ghost btn-sm" onclick='caEditTrack(${JSON.stringify(t.slug)})'>Edit</button></td></tr>`).join('')}
  </table></div></div>`;
}
async function caEditTrack(slug) {
  const t = (await api('/api/admin/career/tracks/' + encodeURIComponent(slug))).track;
  openModal('Edit ' + t.title, `<form id="caTForm">
    <label class="field"><span>Status</span><select name="status"><option${t.status === 'published' ? ' selected' : ''}>published</option><option${t.status === 'draft' ? ' selected' : ''}>draft</option></select></label>
    <label class="field"><span>Title</span><input name="title" value="${esc(t.title)}"></label>
    <label class="field"><span>Summary</span><input name="summary" value="${esc(t.summary)}"></label>
    <label class="field"><span>Career overview</span><textarea name="overview" rows="3">${esc(t.overview)}</textarea></label>
    <label class="field"><span>Estimated duration</span><input name="duration" value="${esc(t.duration)}"></label>
    <label class="field"><span>Prerequisites - one per line</span><textarea name="prerequisites" rows="3">${esc(t.prerequisites.join('\n'))}</textarea></label>
    <label class="field"><span>Tools - one per line</span><textarea name="tools" rows="3">${esc(t.tools.join('\n'))}</textarea></label>
    <label class="field"><span>Learning outcomes - one per line</span><textarea name="outcomes" rows="3">${esc(t.outcomes.join('\n'))}</textarea></label>
    <h4>Skills: weight in readiness (0-10) and whether it is a critical prerequisite</h4>
    ${t.skills.map((s) => `<div class="form-grid"><span class="s" style="align-self:center">${esc(s.name)}</span><label class="field"><span>Weight</span><input type="number" min="0" max="10" step="0.5" name="sw:${esc(s.skill)}" value="${s.weight}"></label><label class="field" style="display:flex;gap:6px;align-items:center"><input type="checkbox" style="width:auto" name="sc:${esc(s.skill)}"${s.critical ? ' checked' : ''}> <span>Critical</span></label></div>`).join('')}
    <button class="btn btn-primary btn-block">Save track</button></form>`, true);
  $('caTForm').addEventListener('submit', async (e) => {
    e.preventDefault(); const f = e.target, lines = (n) => f[n].value.split('\n').map((x) => x.trim()).filter(Boolean);
    const skills = Object.fromEntries(t.skills.map((s) => [s.skill, { weight: Number(f['sw:' + s.skill].value), critical: f['sc:' + s.skill].checked }]));
    try { await api('/api/admin/career/tracks/' + encodeURIComponent(slug), { method: 'PUT', body: JSON.stringify({ status: f.status.value, title: f.title.value, summary: f.summary.value, overview: f.overview.value, duration: f.duration.value, prerequisites: lines('prerequisites'), tools: lines('tools'), outcomes: lines('outcomes'), skills }) }); closeModal(); toast('Track saved.'); renderAdminCareer('tracks'); }
    catch (err) { modalMsg(err.message); }
  });
}

async function caPreview() {
  const keys = CA_DATA.assessments.filter((a) => a.key);
  return `<div class="card"><div class="card-body" style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
    <label class="s">Assessment <select id="caPrevKey">${keys.map((a) => `<option value="${esc(a.key)}">${esc(a.title || a.key)}</option>`).join('')}</select></label>
    <button class="btn btn-primary btn-sm" id="caPrevGo">Generate a sample form</button><span class="s" style="color:var(--muted)">Includes drafts, shows keys. Nothing is saved.</span></div>
    <div class="card-body" id="caPrevOut"></div></div>`;
}

async function caInsights() {
  const a = await api('/api/admin/career/analytics');
  const flagged = a.question_quality.filter((q) => q.flag);
  return `<div class="stat-grid">${stat(a.learners_with_career_data, 'Learners with career data')}${stat(a.onboarded, 'Completed onboarding')}${stat(a.in_progress, 'Assessments in progress')}</div>
    <div class="card"><div class="card-head"><h3>Assessment completion</h3></div><div class="card-body" style="padding:0;overflow-x:auto"><table class="tbl"><tr><th>Assessment</th><th>Submitted</th><th>Timed out / abandoned</th><th>Average score</th></tr>
      ${a.assessments.map((x) => `<tr><td>${esc(x.assessment)}</td><td>${x.submitted}</td><td>${x.late_or_expired}</td><td>${x.average == null ? '-' : x.average + '%'}</td></tr>`).join('') || '<tr><td colspan="4" class="empty">No attempts yet.</td></tr>'}</table></div></div>
    <div class="card"><div class="card-head"><h3>Preferred tracks</h3></div><div class="card-body">${a.preferred_tracks.map((t) => `<span class="chip">${esc(t.title)}: ${t.learners}</span>`).join(' ') || '<span class="s" style="color:var(--muted)">None yet.</span>'}</div></div>
    <div class="card"><div class="card-head"><h3>Aggregate skill gaps</h3><span class="s" style="color:var(--muted)">Share of assessed learners below the Developing threshold</span></div><div class="card-body" style="padding:0;overflow-x:auto"><table class="tbl"><tr><th>Skill</th><th>Assessed</th><th>Needs improvement</th></tr>
      ${a.skill_gaps.slice(0, 25).map((g) => `<tr><td>${esc(g.name)}</td><td>${g.assessed}</td><td>${g.weak} (${Math.round(g.weak_share * 100)}%)</td></tr>`).join('') || '<tr><td colspan="3" class="empty">No data yet.</td></tr>'}</table></div></div>
    <div class="card"><div class="card-head"><h3>Questions to review</h3><span class="s" style="color:var(--muted)">10+ answers and almost nobody (or almost everybody) gets it right</span></div><div class="card-body">${flagged.map((q) => `<div class="s">${esc(q.id)} - ${Math.round(q.p_correct * 100)}% correct of ${q.answered}</div>`).join('') || '<span class="s" style="color:var(--muted)">Nothing flagged yet.</span>'}</div></div>
    <div class="card"><div class="card-head"><h3>Review backlog</h3></div><div class="card-body"><b>${a.review_backlog}</b> written or practical answer${a.review_backlog === 1 ? '' : 's'} waiting for a staff reviewer. <a href="#" onclick="show('career-reviews');return false">Open Assessment Reviews</a></div></div>
    <div class="card"><div class="card-head"><h3>Content gaps (${a.content_gaps.length})</h3><span class="s" style="color:var(--muted)">Skills the roadmaps need but no EchoLens module teaches. Students see "no module yet" instead of a link.</span></div><div class="card-body" style="padding:0;overflow-x:auto"><table class="tbl"><tr><th>Skill</th><th>Area</th><th>Used by</th><th>Reason</th></tr>
      ${a.content_gaps.map((g) => `<tr><td>${esc(g.name)}</td><td>${esc(g.group)}</td><td class="s">${esc(g.tracks.join(', '))}</td><td class="s">${esc(g.reason)}</td></tr>`).join('')}</table></div></div>`;
}

function caWire() {
  const el = $('view-admin-career');
  el.querySelectorAll('[data-ca-enable]').forEach((cb) => cb.addEventListener('change', async () => {
    try { await api('/api/admin/career/config', { method: 'PUT', body: JSON.stringify({ enabled: { ...CA_DATA.config.enabled, [cb.dataset.caEnable]: cb.checked } }) }); toast('Saved.'); renderAdminCareer('overview'); } catch (e) { toast(e.message, true); }
  }));
  const bank = $('caBank'); if (bank) bank.onchange = () => { CA_BANK = bank.value; renderAdminCareer('questions'); };
  const filt = $('caFilter'); if (filt) filt.onchange = () => { CA_FILTER = filt.value; renderAdminCareer('questions'); };
  const all = $('caAll'); if (all) all.onchange = () => el.querySelectorAll('.caPick').forEach((c) => { c.checked = all.checked; });
  el.querySelectorAll('[data-ca-bulk]').forEach((b) => b.addEventListener('click', async () => {
    const ids = [...el.querySelectorAll('.caPick:checked')].map((c) => c.value);
    if (!ids.length) { toast('Select questions first.', true); return; }
    if (b.dataset.caBulk === 'published' && !confirm(`Publish ${ids.length} question(s)? Only publish questions you have read and checked.`)) return;
    try { const out = await api('/api/admin/career/questions/status', { method: 'POST', body: JSON.stringify({ ids, status: b.dataset.caBulk }) }); toast(`${out.updated} question(s) marked ${b.dataset.caBulk}.`); renderAdminCareer('questions'); } catch (e) { toast(e.message, true); }
  }));
  const cfg = $('caCfg');
  if (cfg) cfg.addEventListener('submit', async (e) => {
    e.preventDefault(); const f = e.target, c = CA_DATA.config;
    const body = {
      common_weights: Object.fromEntries(Object.keys(c.common_weights).map((k) => [k, Number(f['w:' + k].value)])),
      bands: c.bands.map((_, i) => ({ level: f['bl:' + i].value, min: Number(f['bm:' + i].value) })),
      skill_thresholds: { strong: Number(f.strong.value), developing: Number(f.developing.value) },
      min_evidence_items: Number(f.min_evidence_items.value), min_confidence: Number(f.min_confidence.value),
      track_items_per_skill: Number(f.track_items_per_skill.value), skill_reassess_items: Number(f.skill_reassess_items.value), retake_cooldown_hours: Number(f.retake_cooldown_hours.value),
      min_form_items: Number(f.min_form_items.value),
      max_active_roadmaps: Number(f.max_active_roadmaps.value), common_valid_days: Number(f.common_valid_days.value), skill_valid_days: Number(f.skill_valid_days.value), min_category_items: Number(f.min_category_items.value),
      category_weights: Object.fromEntries(CA_DATA.weights.map((w) => [w.key, Object.fromEntries(['theory', 'practical', 'scenario'].map((c) => [c, Number(f[`cw:${w.key}:${c}`].value)]))])),
    };
    try { await api('/api/admin/career/config', { method: 'PUT', body: JSON.stringify(body) }); toast('Scoring rules saved as a new version.'); renderAdminCareer('scoring'); } catch (err) { toast(err.message, true); }
  });
  const go = $('caPrevGo');
  if (go) go.onclick = async () => {
    const out = $('caPrevOut'); out.innerHTML = '<div class="empty">Building&hellip;</div>';
    try {
      const p = await api('/api/admin/career/preview/' + encodeURIComponent($('caPrevKey').value));
      out.innerHTML = `${Object.keys(p.shortfall).length ? `<p class="form-msg err">Not enough questions for: ${esc(Object.entries(p.shortfall).map(([k, n]) => k + ' (' + n + ' short)').join(', '))}</p>` : ''}
        <ol>${p.questions.map((q) => `<li style="margin-bottom:10px"><div class="s" style="color:var(--muted)">${esc(q.id)} &middot; ${esc(q.status)} &middot; ${esc(q.skills.join(', '))} &middot; difficulty ${q.difficulty}</div>${esc(q.prompt)}
          ${q.code ? `<pre style="white-space:pre-wrap;font-size:12px;background:#F1F5F9;padding:6px 8px;border-radius:6px">${esc(q.code)}</pre>` : ''}
          ${q.options.length ? `<ul class="s">${q.options.map((o) => `<li>${q.answer.includes(o.id) ? '<b>✓ ' + esc(o.text) + '</b>' : esc(o.text)}</li>`).join('')}</ul>` : `<div class="s">Accepted: <b>${q.answer.map(esc).join(' | ')}</b></div>`}</li>`).join('')}</ol>`;
    } catch (e) { out.innerHTML = `<p class="form-msg err">${esc(e.message)}</p>`; }
  };
}
window.renderAdminCareer = renderAdminCareer; window.caEditQuestion = caEditQuestion; window.caEditTrack = caEditTrack;


/* ------------------------- Assessment Reviews (admin + instructor) -------------------------
 * Written explanations and practical submissions scored by a person against
 * the question rubric. "Get AI suggestion" asks the server for UNVERIFIED
 * per-criterion suggestions; applying them only fills the form - the reviewer
 * still checks every score and must press Save. Nothing counts until then.
 */
let CR_STATUS = 'pending';
async function renderCareerReviews() {
  const el = $('view-career-reviews');
  el.innerHTML = '<div class="empty">Loading&hellip;</div>';
  const d = await api('/api/career/reviews?status=' + CR_STATUS);
  window.CR_ITEMS = d.reviews;
  el.innerHTML = `<div class="card"><div class="card-body" style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
      <button class="btn btn-sm ${CR_STATUS === 'pending' ? 'btn-primary' : 'btn-ghost'}" onclick="CR_STATUS='pending';renderCareerReviews()">Waiting for review</button>
      <button class="btn btn-sm ${CR_STATUS === 'done' ? 'btn-primary' : 'btn-ghost'}" onclick="CR_STATUS='done';renderCareerReviews()">Reviewed</button>
      <span class="s" style="color:var(--muted);flex:1">Score each criterion yourself and write feedback the student will read. ${d.ai_available ? 'AI suggestions are optional, unverified, and never count on their own.' : 'AI suggestions are not configured on this server.'}</span></div></div>
    ${d.reviews.map((r, i) => `<div class="card"><div class="card-head"><h3>${esc(r.student)}${r.reg_no ? ' <span class="s mono">' + esc(r.reg_no) + '</span>' : ''}</h3><span class="s" style="color:var(--muted)">${esc(r.assessment)} &middot; ${esc(r.skill || '')} &middot; ${esc(r.category)} &middot; ${esc(r.type === 'submission' ? 'practical submission' : 'written answer')} &middot; ${esc(String(r.submitted_at).slice(0, 16).replace('T', ' '))}</span></div>
      <div class="card-body">
        <p><b>${esc(r.prompt)}</b></p>${r.code ? `<pre style="white-space:pre-wrap;font-size:12px;background:#F1F5F9;padding:8px;border-radius:6px">${esc(r.code)}</pre>` : ''}
        <div class="s" style="color:var(--muted);margin-top:8px">Student's answer${r.paste_attempts ? ` <b style="color:#7A4A00">&middot; ${r.paste_attempts} blocked paste attempt${r.paste_attempts === 1 ? '' : 's'}</b>` : ''}</div>
        <pre style="white-space:pre-wrap;background:#0F172A;color:#E2E8F0;padding:10px 12px;border-radius:8px;font-size:13px;max-height:340px;overflow:auto">${esc(r.answer)}</pre>
        ${r.run_output ? `<div class="s" style="color:#7A4A00;margin-top:6px"><b>Output from the student's own run</b> - produced on their device, so treat it as unverified:</div><pre style="white-space:pre-wrap;background:#FFFBEB;border:1px dashed #D97706;padding:8px 10px;border-radius:8px;font-size:12.5px">${esc(r.run_output)}</pre>` : ''}
        ${r.run_lang ? `<div style="margin:6px 0"><button type="button" class="btn btn-ghost btn-sm" onclick="crRunHere(${i})">Run the student's code here (${esc(r.run_lang)})</button><span class="s" style="color:var(--muted)"> runs in your browser's sandboxed compiler</span><div class="term crTerm" id="crTerm${i}" style="margin-top:6px;min-height:40px"></div></div>` : ''}
        <details><summary class="s">Reference answer (the student need not match it word for word)</summary><pre style="white-space:pre-wrap;font-size:12px">${esc(r.model_answer || '')}</pre></details>
        <form class="crForm" data-i="${i}">
          <table class="tbl"><tr><th>Rubric criterion</th><th>Max</th><th>Score</th><th>Note (optional)</th></tr>
            ${r.rubric.map((c, j) => `<tr><td class="s">${esc(c.criterion)}</td><td>${c.points}</td><td><input type="number" min="0" max="${c.points}" step="0.5" name="p${j}" required style="width:80px" value="${r.review ? r.review.criteria[j]?.points ?? '' : ''}"></td><td><input name="n${j}" maxlength="300" value="${esc(r.review?.criteria[j]?.note || '')}"></td></tr>`).join('')}</table>
          <div class="crAi" style="margin:8px 0">${r.ai_suggestion ? crAiHtml(r.ai_suggestion, i) : ''}</div>
          <label class="field"><span>Feedback for the student (explain what was strong and what to improve)</span><textarea name="comment" rows="3" required minlength="10">${esc(r.review?.comment || '')}</textarea></label>
          <input type="hidden" name="used_ai" value="0">
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            ${d.ai_available ? `<button type="button" class="btn btn-ghost btn-sm" onclick="crSuggest(${i})">Get AI suggestion (unverified)</button>` : ''}
            <button class="btn btn-primary btn-sm">${r.review ? 'Update review' : 'Save review'}</button></div>
          <p class="form-msg" role="status"></p>
        </form></div></div>`).join('') || `<div class="card"><div class="card-body"><div class="empty">${CR_STATUS === 'pending' ? 'Nothing is waiting for review.' : 'No reviewed answers yet.'}</div></div></div>`}`;
  el.querySelectorAll('.crForm').forEach((f) => f.addEventListener('submit', async (e) => {
    e.preventDefault(); const r = window.CR_ITEMS[Number(f.dataset.i)], msg = f.querySelector('.form-msg');
    const body = { criteria: r.rubric.map((_, j) => ({ points: Number(f['p' + j].value), note: f['n' + j].value })), comment: f.comment.value, used_ai_suggestion: f.used_ai.value === '1' };
    try { await api(`/api/career/reviews/${r.user_id}/${encodeURIComponent(r.attempt_id)}/${encodeURIComponent(r.question_id)}`, { method: 'POST', body: JSON.stringify(body) }); toast('Review saved. The student\'s scores have been updated.'); renderCareerReviews(); }
    catch (err) { msg.className = 'form-msg err'; msg.textContent = err.message; }
  }));
}
function crAiHtml(sg, i) {
  return `<div style="border:1px dashed #D97706;background:#FFFBEB;border-radius:8px;padding:8px 10px" class="s">
    <b>AI suggestion - unverified, not a grade.</b> Check it against the answer before using any of it.
    <ul>${sg.criteria.map((c) => `<li>Criterion ${c.index}: ${c.points} - ${esc(c.why)}</li>`).join('')}</ul>
    <div><i>${esc(sg.feedback)}</i></div>
    <button type="button" class="btn btn-ghost btn-sm" style="margin-top:6px" onclick="crApply(${i})">Copy into the form for me to check</button></div>`;
}
async function crSuggest(i) {
  const r = window.CR_ITEMS[i], f = document.querySelector(`.crForm[data-i="${i}"]`), box = f.querySelector('.crAi');
  box.innerHTML = '<span class="s">Asking for a suggestion&hellip;</span>';
  try { const out = await api(`/api/career/reviews/${r.user_id}/${encodeURIComponent(r.attempt_id)}/${encodeURIComponent(r.question_id)}/suggest`, { method: 'POST' }); r.ai_suggestion = out.suggestion; box.innerHTML = crAiHtml(out.suggestion, i); }
  catch (e) { box.innerHTML = `<span class="form-msg err">${esc(e.message)}</span>`; }
}
function crApply(i) {
  const r = window.CR_ITEMS[i], f = document.querySelector(`.crForm[data-i="${i}"]`);
  r.ai_suggestion.criteria.forEach((c, j) => { if (f['p' + j]) f['p' + j].value = c.points; });
  if (!f.comment.value.trim()) f.comment.value = r.ai_suggestion.feedback;
  f.used_ai.value = '1';
  toast('Suggestion copied. Check every score and the feedback, then save.');
}
/** Reviewer re-runs the submission in their own browser compiler: evidence the reviewer saw for themselves. */
async function crRunHere(i) {
  const r = window.CR_ITEMS[i], el = $('crTerm' + i);
  if (!window.EchoRun || !window.EchoTerm) { el.textContent = 'The compiler is not available on this page.'; return; }
  const term = EchoTerm.mount(el);
  try { await EchoRun.executeAny(r.run_lang, r.answer, { term, onStatus: () => {} }); } catch (e) { term.print('[' + e.message + ']\n'); }
}
window.crRunHere = crRunHere;
window.renderCareerReviews = renderCareerReviews; window.crSuggest = crSuggest; window.crApply = crApply;
