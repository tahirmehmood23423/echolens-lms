'use strict';
/*
 * Admin portal -> Career Assessments -> Curriculum & QA. Uses dashboard.js
 * helpers (api, esc, openModal, closeModal, modalMsg, toast) and is drawn by
 * career-admin.js. Everything goes through /api/admin/career/curriculum/*,
 * which is admin-only, validated and audit-logged on the server.
 *
 * Views: QA dashboard (counts, every subtrack and role), one subtrack
 * (coverage, question review, filters, edit, import, preview, publish),
 * one job role (mandatory/optional subtracks, JD references and status),
 * assessment rules.
 */
let CU_LEARNING = 'python-fundamentals';
let CU_VIEW = 'dash', CU_SUB = null, CU_ROLE = null, CU_DIFF = '', CU_STATUS = '', CU_DATA = null, CU_SEARCH = '';
const CU_STATE_TXT = { planned: 'No questions yet', draft: 'Draft bank, coverage incomplete', ready: 'Ready to publish', published: 'Published' };
const CU_JD_TXT = { search_summary_unverified: 'Search summary, not verified', jd_verification_required: 'JD verification required', jd_reviewed: 'JD reviewed' };
const cuTone = (ok) => `style="font-weight:700;color:${ok ? 'var(--ok)' : '#7A4A00'}"`;
const cuGo = (view, arg) => { CU_VIEW = view; if (view === 'sub') CU_SUB = arg; if (view === 'role') CU_ROLE = arg; renderAdminCareer('curriculum'); };

async function caCurriculum() {
  const nav = `<div class="card"><div class="card-body" style="display:flex;gap:6px;flex-wrap:wrap;align-items:center">
    ${[['dash', 'QA dashboard'], ['rules', 'Assessment rules'], ['learning', 'Lessons & publishing']].map(([k, l]) => `<button class="btn btn-sm ${CU_VIEW === k ? 'btn-primary' : 'btn-ghost'}" onclick="cuGo('${k}')">${l}</button>`).join('')}
    ${CU_VIEW === 'sub' ? `<span class="s">› Subtrack <b>${esc(CU_SUB)}</b></span>` : ''}${CU_VIEW === 'role' ? `<span class="s">› Job role <b>${esc(CU_ROLE)}</b></span>` : ''}</div></div>`;
  if (CU_VIEW === 'learning') return nav + await cuLearning();
  if (CU_VIEW === 'sub') return nav + await cuSubtrack(CU_SUB);
  if (CU_VIEW === 'role') return nav + await cuRole(CU_ROLE);
  CU_DATA = await api('/api/admin/career/curriculum');
  if (CU_VIEW === 'rules') return nav + cuRules(CU_DATA.config);
  return nav + cuDash(CU_DATA);
}

function cuDash(d) {
  const t = d.totals, k = (n, l) => `<div class="kpi"><b style="font-size:22px">${n}</b><div class="s" style="color:var(--muted)">${l}</div></div>`;
  const rows = d.subtracks.filter((s) => !CU_SEARCH || (s.title + ' ' + s.id).toLowerCase().includes(CU_SEARCH.toLowerCase()));
  return `<div class="card"><div class="card-head"><h3>Inventory</h3></div><div class="card-body">
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px">
        ${k(t.planned_subtracks, 'Planned subtracks')}${k(t.finalized_blueprints, 'Blueprints reviewed')}${k(t.banks_started, 'Banks started')}${k(t.banks_complete, 'Banks meeting the blueprint')}
        ${k(t.banks_unrestricted, 'Banks with 90+ reviewed items')}${k(t.published_assessments, 'Published assessments')}${k(t.questions, 'Questions in banks')}${k(`${t.roles_complete} / ${t.roles}`, 'Roles with every assessment live')}${k(t.roles_jd_unverified, 'Roles with JD not yet verified')}
      </div>
      ${d.catalog_errors.length ? `<p class="form-msg err">Catalogue errors: ${d.catalog_errors.map(esc).join('; ')}</p>` : '<p class="s" style="color:var(--ok);margin-top:10px">Catalogue validation: no duplicate ids, no prerequisite cycles, every role and track reference resolves.</p>'}
      ${d.catalog_warnings.length ? `<details><summary class="s" style="color:#7A4A00">${d.catalog_warnings.length} catalogue warnings</summary><ul class="s">${d.catalog_warnings.map((w) => `<li>${esc(w)}</li>`).join('')}</ul></details>` : ''}
      <p class="s" style="color:var(--muted);margin-top:8px">A bank of reviewed questions is not a live assessment. Students see an assessment only after you publish it here, and publishing is refused until the reviewed questions can fill every form (difficulty mix, scenario share, every competency, key competencies twice).</p>
    </div></div>
    <div class="card"><div class="card-head" style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap"><h3>Subtracks (${d.subtracks.length})</h3><input id="cuSearch" type="search" placeholder="Filter subtracks" value="${esc(CU_SEARCH)}" style="max-width:240px"></div>
      <div class="card-body" style="padding:0;overflow-x:auto"><table class="tbl">
      <tr><th>Subtrack</th><th>Level</th><th>Blueprint</th><th>Competencies</th><th>Questions</th><th>Reviewed</th><th>Published</th><th>Flags</th><th>Assessment</th><th></th></tr>
      ${rows.map((s) => `<tr><td><b>${esc(s.title)}</b><div class="s" style="color:var(--muted)">${esc(s.id)}</div></td><td class="s">${esc(s.level)}</td><td class="s">${esc(s.structure_status)}</td><td>${s.competencies}</td>
        <td>${s.questions}</td><td>${s.reviewed}</td><td>${s.published}</td>
        <td class="s">${s.errors ? `<span style="color:var(--danger)">${s.errors} errors</span> ` : ''}${s.warnings ? `<span style="color:#7A4A00">${s.warnings} warnings</span> ` : ''}${s.questions && s.under_covered ? `${s.under_covered} competencies short` : ''}</td>
        <td class="s"><span ${cuTone(s.assessment === 'published')}>${esc(CU_STATE_TXT[s.assessment])}</span>${s.assessment === 'published' ? `<div style="color:var(--muted)">${s.unrestricted ? 'Unrestricted retakes' : 'Limited retakes (under 90 items)'}</div>` : ''}</td>
        <td style="text-align:right"><button class="btn btn-ghost btn-sm" onclick="cuGo('sub','${esc(s.id)}')">Open</button></td></tr>`).join('')}
      </table></div></div>
    <div class="card"><div class="card-head"><h3>Job roles (${d.roles.length})</h3></div><div class="card-body" style="padding:0;overflow-x:auto"><table class="tbl">
      <tr><th>Role</th><th>Track</th><th>Required subtracks</th><th>Assessments not live</th><th>Employer requirements</th><th>Status</th><th></th></tr>
      ${d.roles.map((r) => `<tr><td><b>${esc(r.title)}</b></td><td class="s">${esc(r.track)}</td><td>${r.required}</td><td>${r.missing}</td>
        <td class="s"><span ${cuTone(r.jd_status === 'jd_reviewed')}>${esc(CU_JD_TXT[r.jd_status] || r.jd_status)}</span></td><td class="s">${esc(r.status)}</td>
        <td style="text-align:right"><button class="btn btn-ghost btn-sm" onclick="cuGo('role','${esc(r.id)}')">Review</button></td></tr>`).join('')}
      </table></div></div>`;
}

async function cuSubtrack(id) {
  const q = new URLSearchParams({ ...(CU_DIFF ? { difficulty: CU_DIFF } : {}), ...(CU_STATUS ? { status: CU_STATUS } : {}) });
  const d = await api(`/api/admin/career/curriculum/subtracks/${encodeURIComponent(id)}/questions?${q}`);
  const s = d.subtrack, cov = d.coverage, st = d.status;
  const comps = s.modules.flatMap((m) => m.objectives.map((o) => ({ ...o, rel: o.id.slice(s.id.length + 1), module: m.title })));
  const compText = Object.fromEntries(comps.map((c) => [c.rel, c]));
  return `<div class="card"><div class="card-head" style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap"><h3>${esc(s.title)}</h3>
      <div style="display:flex;gap:6px;flex-wrap:wrap">
        ${st.state === 'published' ? `<button class="btn btn-ghost btn-sm" onclick="cuPublish('${esc(id)}', false)">Unpublish</button>` : `<button class="btn btn-primary btn-sm" onclick="cuPublish('${esc(id)}', true)"${cov.feasible ? '' : ' disabled title="Coverage is incomplete"'}>Publish assessment</button>`}
        <button class="btn btn-ghost btn-sm" onclick="cuPreview('${esc(id)}')"${cov.pool ? '' : ' disabled'}>Preview a form</button>
        <button class="btn btn-ghost btn-sm" onclick="cuImport('${esc(id)}')">Import questions</button>
        <button class="btn btn-ghost btn-sm" onclick="cuStructure('${esc(id)}')">Edit prerequisites</button>
        <a class="btn btn-ghost btn-sm" href="/career#sub/${esc(id)}" target="_blank" rel="noopener">Student view</a></div></div>
    <div class="card-body">
      <p class="s"><b>${esc(CU_STATE_TXT[st.state])}</b>. ${cov.pool} usable reviewed or published questions of ${cov.total} (${cov.errors} with errors). Blueprint per form: ${cov.quota.easy} easy, ${cov.quota.medium} medium, ${cov.quota.hard} hard, ${cov.quota.advanced} advanced; at least ${cov.need_scenario} scenarios. ${cov.unrestricted ? 'At least 90 reviewed items: unrestricted fresh retakes.' : 'Under 90 reviewed items: retakes are limited.'}</p>
      ${cov.reasons.length ? `<div class="form-msg err"><b>Cannot publish yet:</b><ul class="s">${cov.reasons.map((r) => `<li>${esc(r)}</li>`).join('')}</ul></div>` : ''}
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:12px;margin-top:10px">
        <div><b class="s">Usable questions by difficulty</b><table class="tbl">${Object.entries(cov.by_difficulty).map(([k, n]) => `<tr><td>${esc(k)}</td><td>${n}</td><td class="s" ${cuTone(n >= cov.quota[k])}>needs ${cov.quota[k]} per form</td></tr>`).join('')}<tr><td>scenario</td><td>${cov.scenario}</td><td class="s" ${cuTone(cov.scenario >= cov.need_scenario)}>needs ${cov.need_scenario}</td></tr></table></div>
        <div><b class="s">Usable questions by competency</b><table class="tbl">${comps.map((c) => `<tr><td class="s">${c.critical ? '<b>Key</b> ' : ''}${esc(c.text)}<div style="color:var(--muted)">${esc(c.rel)} · ${esc(c.module)}</div></td><td ${cuTone((cov.by_competency[c.rel] || 0) >= (c.critical ? 2 : 1))}>${cov.by_competency[c.rel] || 0}</td></tr>`).join('')}</table></div>
      </div>
      ${d.bank_warnings.length ? `<details style="margin-top:8px"><summary class="s" style="color:#7A4A00">${d.bank_warnings.length} bank warnings (near-duplicates, option length)</summary><ul class="s">${d.bank_warnings.map((w) => `<li>${esc(w)}</li>`).join('')}</ul></details>` : '<p class="s" style="color:var(--ok)">No duplicate or near-duplicate questions detected.</p>'}
    </div></div>
    <div class="card"><div class="card-body" style="display:flex;gap:10px;flex-wrap:wrap;align-items:center">
      <label class="s">Difficulty <select id="cuDiff"><option value="">All</option>${['easy', 'medium', 'hard', 'advanced'].map((x) => `<option${x === CU_DIFF ? ' selected' : ''}>${x}</option>`).join('')}</select></label>
      <label class="s">Status <select id="cuStatus"><option value="">All</option>${['draft', 'reviewed', 'published', 'retired'].map((x) => `<option${x === CU_STATUS ? ' selected' : ''}>${x}</option>`).join('')}</select></label>
      <span class="s" style="color:var(--muted)">${d.questions.length} shown</span><span style="flex:1"></span>
      <label class="s"><input type="checkbox" id="cuAll"> Select all</label>
      ${['reviewed', 'draft', 'retired'].map((x) => `<button class="btn btn-ghost btn-sm" data-cu-bulk="${x}">Mark ${x}</button>`).join('')}
    </div></div>
    ${d.questions.map((x) => `<div class="card"><div class="card-body">
      <div style="display:flex;gap:10px;align-items:flex-start"><input type="checkbox" class="cuPick" value="${esc(x.id)}" style="margin-top:4px">
      <div style="flex:1;min-width:0">
        <div class="s" style="color:var(--muted)">${esc(x.id)} · v${x.version || 1} · <b>${esc(x.status)}</b> · ${esc(x.difficulty)} · ${esc(x.type)}${x.scenario ? ' · scenario: ' + esc(x.scenario) : ' · foundational'} · ${esc(compText[x.comp]?.text || x.comp)}${x.stats ? ` · answered ${x.stats.answered}, ${Math.round((x.stats.p_correct || 0) * 100)}% correct` : ''}</div>
        ${x.flag ? `<div class="s" style="color:#7A4A00">Item statistics: ${esc(x.flag)}</div>` : ''}
        ${x.errors.length ? `<div class="form-msg err s">${x.errors.map(esc).join('; ')}</div>` : ''}${x.warnings.length ? `<div class="s" style="color:#7A4A00">${x.warnings.map(esc).join('; ')}</div>` : ''}
        <div style="margin:6px 0">${esc(x.prompt)}</div>
        ${x.code ? `<pre style="white-space:pre-wrap;font-size:12px;background:#F1F5F9;padding:6px 8px;border-radius:6px">${esc(x.code)}</pre>` : ''}
        <ol type="A" class="s" style="margin:4px 0 4px 18px">${x.options.map((o, i) => `<li>${i === x.answer ? `<b style="color:var(--ok)">${esc(o)} ✓</b>` : `${esc(o)} <span style="color:var(--muted)">(${esc(x.why[i < x.answer ? i : i - 1] || '')})</span>`}</li>`).join('')}</ol>
        <div class="s" style="color:var(--muted)">${esc(x.explanation)}</div>
      </div><button class="btn btn-ghost btn-sm" onclick="cuEdit('${esc(id)}','${esc(x.id)}')">Edit</button></div></div></div>`).join('')}`;
}

async function cuRole(id) {
  const r = await api('/api/admin/career/curriculum/roles/' + encodeURIComponent(id));
  return `<div class="card"><div class="card-head"><h3>${esc(r.title)}</h3></div><div class="card-body">
      <p class="s">${esc(r.description)}</p>
      <form id="cuRoleForm">
        <label class="field"><span>Mandatory subtracks (ids, one per line). Prerequisites are added automatically in the student view.</span><textarea name="mandatory" rows="6" style="font-family:monospace">${esc(r.mandatory.join('\n'))}</textarea></label>
        <label class="field"><span>Optional subtracks (ids, one per line)</span><textarea name="optional" rows="4" style="font-family:monospace">${esc(r.optional_ids.join('\n'))}</textarea></label>
        <label class="field"><span>Employer requirements status</span><select name="jd_status">${Object.entries(CU_JD_TXT).map(([k, l]) => `<option value="${k}"${k === r.jd.status ? ' selected' : ''}>${l}</option>`).join('')}</select></label>
        <p class="s" style="color:var(--muted)">Mark JD reviewed only after a person has read current listings and confirmed these requirements. Do not copy listings; summarise what they have in common.</p>
        <button class="btn btn-primary">Save role</button></form>
      <h4 style="margin-top:16px">Required path as students see it</h4>
      <ol class="s">${r.required.map((s) => `<li>${esc(s.title)} <span style="color:var(--muted)">(${esc(s.id)})${s.prerequisite_added ? ' · added as prerequisite' : ''} · ${esc(s.assessment.label)}</span></li>`).join('')}</ol>
      <h4>Job description references</h4>
      ${r.jd_full.references.length ? `<ul class="s">${r.jd_full.references.map((x) => `<li><a href="${esc(x.url)}" target="_blank" rel="noopener noreferrer">${esc(x.title)}</a> · ${esc(x.employer || 'employer not stated')} · ${esc(x.location || '')} · accessed ${esc(x.accessed)} · ${x.verified ? 'verified' : 'not verified'}${x.note ? `<div style="color:var(--muted)">${esc(x.note)}</div>` : ''}</li>`).join('')}</ul>` : '<p class="s" style="color:#7A4A00">No references recorded: JD verification required.</p>'}
      ${r.jd_full.observed?.length ? `<h4>Observed requirements (paraphrased)</h4><ul class="s">${r.jd_full.observed.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}
    </div></div>`;
}

function cuRules(c) {
  const n = (k, l, step = 1) => `<label class="field"><span>${l}</span><input type="number" name="${k}" value="${esc(c[k])}" step="${step}"></label>`;
  return `<div class="card"><div class="card-head"><h3>Assessment rules (version ${c.version})</h3></div><div class="card-body"><form id="cuRules">
    <div class="form-grid">${n('items', 'Questions per subtrack attempt')}${n('minutes', 'Minutes per subtrack attempt')}${n('pass_overall', 'Overall pass mark (%)')}${n('critical_min', 'Each key competency at least (%)')}
      ${n('critical_min_items', 'Items per key competency in a form')}${n('scenario_share', 'Workplace scenario share (%)')}${n('unrestricted_bank', 'Reviewed items for unrestricted retakes')}${n('retake_hours', 'Hours between attempts')}
      ${n('limited_retake_days', 'Days between attempts while the bank is small')}${n('evidence_valid_days', 'Days a pass stays valid')}${n('role_items', 'Questions in a role final assessment')}${n('role_minutes', 'Minutes for a role final assessment')}</div>
    <h4>Difficulty mix (must add up to 100)</h4><div class="form-grid">${['easy', 'medium', 'hard', 'advanced'].map((k) => `<label class="field"><span>${k} (%)</span><input type="number" name="mix:${k}" value="${c.mix[k]}"></label>`).join('')}</div>
    <p class="s" style="color:var(--muted)">Changes are saved as a new version and apply to attempts started afterwards. Results already recorded keep the rules they were graded with.</p>
    <button class="btn btn-primary">Save rules</button></form></div></div>`;
}

async function cuPublish(id, on) {
  if (on && !confirm('Publish this assessment to students? Every reviewed question will become live.')) return;
  try { await api(`/api/admin/career/curriculum/subtracks/${encodeURIComponent(id)}/${on ? 'publish' : 'unpublish'}`, { method: 'POST' }); toast(on ? 'Assessment published.' : 'Assessment unpublished.'); renderAdminCareer('curriculum'); }
  catch (e) { toast(e.message, true); }
}
async function cuPreview(id) {
  try {
    const p = await api(`/api/admin/career/curriculum/subtracks/${encodeURIComponent(id)}/preview`);
    openModal('Sample form (answer keys shown)', `<p class="s">${p.questions.length} questions · ${Object.entries(p.by_difficulty).map(([k, v]) => `${v} ${k}`).join(', ')} · ${p.scenario} scenarios · ${Object.keys(p.competencies).length} competencies covered</p>
      <ol>${p.questions.map((q) => `<li style="margin-bottom:10px"><div class="s" style="color:var(--muted)">${esc(q.id)} · ${esc(q.difficulty)} · ${esc(q.comp)}</div>${esc(q.prompt)}${q.code ? `<pre style="white-space:pre-wrap;font-size:12px;background:#F1F5F9;padding:6px 8px;border-radius:6px">${esc(q.code)}</pre>` : ''}
        <ul class="s">${q.options.map((o, i) => `<li>${i === q.answer ? `<b>✓ ${esc(o)}</b>` : esc(o)}</li>`).join('')}</ul></li>`).join('')}</ol>`, true);
  } catch (e) { toast(e.message, true); }
}
function cuImport(id) {
  openModal('Import questions as drafts', `<form id="cuImpForm"><p class="s">Paste a JSON array. Each item: id, comp (for example m1.c1), difficulty (easy, medium, hard, advanced), type, scenario (or null), prompt, code, options (four strings), answer (0 to 3), explanation, why (three notes, one for each wrong option), expect (exact output for code questions), lang (python or sql). Invalid items are listed and not imported; code questions are executed to check the keyed answer.</p>
    <label class="field"><span>Questions (JSON)</span><textarea name="json" rows="14" style="font-family:monospace" required></textarea></label><button class="btn btn-primary btn-block">Validate and import</button><div id="cuImpOut" class="s"></div></form>`, true);
  $('cuImpForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    let items; try { items = JSON.parse(e.target.json.value); } catch { modalMsg('That is not valid JSON.'); return; }
    try {
      const out = await api(`/api/admin/career/curriculum/subtracks/${encodeURIComponent(id)}/questions/import`, { method: 'POST', body: JSON.stringify({ questions: items }) });
      $('cuImpOut').innerHTML = `<p style="color:var(--ok)">${out.added.length} imported as drafts.</p>${out.rejected.length ? `<p style="color:var(--danger)">${out.rejected.length} rejected:</p><ul>${out.rejected.map((r) => `<li><b>${esc(r.id)}</b>: ${r.errors.map(esc).join('; ')}</li>`).join('')}</ul>` : ''}`;
      if (out.added.length) toast(`${out.added.length} questions imported as drafts.`);
    } catch (err) { modalMsg(err.message); }
  });
}
async function cuEdit(sub, qid) {
  const d = await api(`/api/admin/career/curriculum/subtracks/${encodeURIComponent(sub)}/questions`);
  const q = d.questions.find((x) => x.id === qid); if (!q) return;
  const fields = ['prompt', 'code', 'options', 'answer', 'explanation', 'why', 'difficulty', 'type', 'scenario', 'comp', 'expect'];
  openModal(`Edit ${qid} (saves as version ${(q.version || 1) + 1}, back to draft)`, `<form id="cuEditForm"><label class="field"><span>Question fields (JSON)</span><textarea name="json" rows="18" style="font-family:monospace">${esc(JSON.stringify(Object.fromEntries(fields.map((f) => [f, q[f] ?? null])), null, 2))}</textarea></label>
    <p class="s" style="color:var(--muted)">Earlier versions are kept, so results already recorded still show the question as the student saw it.</p><button class="btn btn-primary btn-block">Save new version</button></form>`, true);
  $('cuEditForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    let body; try { body = JSON.parse(e.target.json.value); } catch { modalMsg('That is not valid JSON.'); return; }
    try {
      const out = await api(`/api/admin/career/curriculum/subtracks/${encodeURIComponent(sub)}/questions/${encodeURIComponent(qid)}`, { method: 'PUT', body: JSON.stringify(body) });
      if (out.errors?.length) { modalMsg('Saved as a draft, but it has errors and cannot be marked reviewed: ' + out.errors.join('; ')); renderAdminCareer('curriculum'); return; }
      closeModal(); toast('Saved as a new draft version.'); renderAdminCareer('curriculum');
    } catch (err) { modalMsg(err.message); }
  });
}
async function cuStructure(id) {
  const s = (await api('/api/career/curriculum/subtracks/' + encodeURIComponent(id)));
  openModal(`Prerequisites for ${s.title}`, `<form id="cuStrForm"><label class="field"><span>Prerequisite subtrack ids, one per line</span><textarea name="prereq" rows="5" style="font-family:monospace">${esc(s.prereq.map((p) => p.id).join('\n'))}</textarea></label>
    <label class="field"><span>Blueprint status</span><select name="status">${['draft', 'reviewed', 'published'].map((x) => `<option${x === s.structure_status ? ' selected' : ''}>${x}</option>`).join('')}</select></label>
    <p class="s" style="color:var(--muted)">Changes that would create a prerequisite cycle are refused.</p><button class="btn btn-primary btn-block">Save</button></form>`);
  $('cuStrForm').addEventListener('submit', async (e) => {
    e.preventDefault(); const f = e.target;
    try { await api('/api/admin/career/curriculum/structure', { method: 'PUT', body: JSON.stringify({ subtrack: { id, prereq: f.prereq.value.split('\n').map((x) => x.trim()).filter(Boolean), structure_status: f.status.value } }) }); closeModal(); toast('Saved.'); renderAdminCareer('curriculum'); }
    catch (err) { modalMsg(err.message); }
  });
}

function cuAdminWire() {
  const el = $('view-admin-career'); if (!el) return;
  const ls=$('cuLearningSelect');if(ls)ls.onchange=()=>{CU_LEARNING=ls.value;renderAdminCareer('curriculum');};
  const save=$('cuLearningSave');if(save)save.onclick=async()=>{save.disabled=true;try{await api('/api/admin/career/learning/'+encodeURIComponent(CU_LEARNING),{method:'PUT',body:JSON.stringify(JSON.parse($('cuLearningJSON').value))});await renderAdminCareer('curriculum');}catch(e){$('cuLearningMsg').textContent=e.message;save.disabled=false;}};
  el.querySelectorAll('[data-learning-action]').forEach(b=>b.onclick=async()=>{b.disabled=true;try{await api('/api/admin/career/learning/'+encodeURIComponent(CU_LEARNING)+'/'+b.dataset.learningAction,{method:'POST',body:JSON.stringify({attest_human_review:$('cuLearningAttest').checked,notes:$('cuLearningNotes').value})});await renderAdminCareer('curriculum');}catch(e){$('cuLearningMsg').textContent=e.message;b.disabled=false;}});

  const s = $('cuSearch'); if (s) s.oninput = () => { CU_SEARCH = s.value; const pos = s.selectionStart; renderAdminCareer('curriculum').then(() => { const n = $('cuSearch'); if (n) { n.focus(); n.setSelectionRange(pos, pos); } }); };
  const df = $('cuDiff'); if (df) df.onchange = () => { CU_DIFF = df.value; renderAdminCareer('curriculum'); };
  const sf = $('cuStatus'); if (sf) sf.onchange = () => { CU_STATUS = sf.value; renderAdminCareer('curriculum'); };
  const all = $('cuAll'); if (all) all.onchange = () => el.querySelectorAll('.cuPick').forEach((c) => { c.checked = all.checked; });
  el.querySelectorAll('[data-cu-bulk]').forEach((b) => b.addEventListener('click', async () => {
    const ids = [...el.querySelectorAll('.cuPick:checked')].map((c) => c.value);
    if (!ids.length) { toast('Select questions first.', true); return; }
    try { const out = await api(`/api/admin/career/curriculum/subtracks/${encodeURIComponent(CU_SUB)}/questions/status`, { method: 'POST', body: JSON.stringify({ ids, status: b.dataset.cuBulk }) });
      toast(`${out.updated} question(s) marked ${b.dataset.cuBulk}.${out.refused.length ? ` ${out.refused.length} refused because they have errors.` : ''}`); renderAdminCareer('curriculum'); } catch (e) { toast(e.message, true); }
  }));
  const rf = $('cuRoleForm');
  if (rf) rf.addEventListener('submit', async (e) => {
    e.preventDefault(); const f = e.target, list = (v) => v.split('\n').map((x) => x.trim()).filter(Boolean);
    try { await api('/api/admin/career/curriculum/structure', { method: 'PUT', body: JSON.stringify({ role: { id: CU_ROLE, mandatory: list(f.mandatory.value), optional: list(f.optional.value), jd_status: f.jd_status.value } }) }); toast('Role saved.'); renderAdminCareer('curriculum'); }
    catch (err) { toast(err.message, true); }
  });
  const ru = $('cuRules');
  if (ru) ru.addEventListener('submit', async (e) => {
    e.preventDefault(); const f = e.target;
    const keys = ['items', 'minutes', 'pass_overall', 'critical_min', 'critical_min_items', 'scenario_share', 'unrestricted_bank', 'retake_hours', 'limited_retake_days', 'evidence_valid_days', 'role_items', 'role_minutes'];
    const body = { ...Object.fromEntries(keys.map((k) => [k, Number(f[k].value)])), mix: Object.fromEntries(['easy', 'medium', 'hard', 'advanced'].map((k) => [k, Number(f['mix:' + k].value)])) };
    try { await api('/api/admin/career/curriculum/config', { method: 'PUT', body: JSON.stringify(body) }); toast('Rules saved as a new version.'); renderAdminCareer('curriculum'); } catch (err) { toast(err.message, true); }
  });
}

// Curriculum authoring lives in the existing Career admin area.
async function cuLearning() {
  const [inventory,doc]=await Promise.all([api('/api/admin/career/learning'),api('/api/admin/career/learning/'+encodeURIComponent(CU_LEARNING))]);
  const c=doc.draft, first=c?.lessons?.[0], errors=doc.validation?.errors||[], warnings=doc.validation?.warnings||[];
  const targetRole=inventory.job_roles.find(r=>r.id==='junior-backend-developer');
  return `<section class="card"><div class="card-head"><h3>Learning content completion tracker</h3></div><div class="card-body"><p>${inventory.totals.lessons} authored lessons · ${inventory.totals.formative_mcqs} formative MCQs · ${inventory.totals.automated_complete} subtracks passing structural checks · ${inventory.totals.human_approved} approved releases · ${inventory.totals.complete_roles} complete job-role pathways</p><p class="s">Repository/runtime free catalogue: ${inventory.reconciliation.public_free.length} listings. Trending Tech validator subset: ${inventory.reconciliation.trending_subset.length} courses. These are different inventories. Short notes and coding quests are candidate supplements, not proof of complete written coverage.</p>
  <div style="overflow-x:auto"><table class="tbl"><thead><tr><th>Career</th><th>Subtracks</th><th>Outlines</th><th>Authored lessons</th><th>Verified lesson examples</th><th>Lesson quizzes</th><th>Checkpoints</th><th>Comprehensive assessments</th><th>Structurally complete</th><th>Human-approved</th><th>Remaining subtracks</th></tr></thead><tbody>${inventory.tracks.map(t=>`<tr><td>${esc(t.id)}</td><td>${t.subtracks}</td><td>${t.outlines}</td><td>${t.lessons}</td><td>${t.verified_lesson_examples}</td><td>${t.lesson_quizzes}</td><td>${t.checkpoint_modules}</td><td>${t.comprehensive_subtracks}</td><td>${t.complete_lesson_subtracks}</td><td>${t.approved_subtracks}</td><td>${t.remaining.length}</td></tr>`).join('')}</tbody></table></div>
  ${targetRole?`<details id="cuRoleMatrix"><summary>${esc(targetRole.title)}: mandatory pathway completion</summary><p class="s">Prerequisite order comes from the current canonical role. Draft lessons and existing assessments do not constitute an approved pathway. Role final: ${esc(targetRole.final)}.</p><div style="overflow-x:auto"><table class="tbl"><thead><tr><th>Order / subtrack</th><th>Prerequisites</th><th>Modules</th><th>Lessons</th><th>Practice MCQs</th><th>Verified examples</th><th>Content checks</th><th>Lesson quizzes</th><th>Checkpoints</th><th>Comprehensive</th><th>Human review</th><th>Published lessons</th><th>Remaining</th></tr></thead><tbody>${targetRole.completion_matrix.map(r=>`<tr><td>${r.order}. ${esc(r.title)}</td><td>${r.prerequisites.map(esc).join(', ')||'None'}</td><td>${r.modules}</td><td>${r.lessons}</td><td>${r.practice_mcqs}</td><td>${r.verified_lesson_examples} / ${r.lessons}${r.database_verification?`<br>PostgreSQL/WASM ${r.database_verification.verified} / ${r.database_verification.total}`:''}</td><td>${r.lessons?(r.validation_errors.length?r.validation_errors.length+' errors':'Structure passed'):'Not authored'}</td><td>${r.lesson_quizzes}</td><td>${r.module_checkpoints}</td><td>${r.comprehensive_questions} items; ${esc(r.comprehensive_state)}</td><td>${esc(r.human_review)}</td><td>${r.published?'Yes':'No'}</td><td>${r.remaining.map(esc).join('; ')}</td></tr>`).join('')}</tbody></table></div></details>`:''}
  <label class="field"><span>Canonical subtrack to edit</span><select id="cuLearningSelect">${inventory.subtracks.map(s=>`<option value="${esc(s.id)}"${s.id===CU_LEARNING?' selected':''}>${esc(s.title)} (${s.lessons} lessons; ${s.published?'published':'not released'})</option>`).join('')}</select></label></div></section>
  <section class="card"><div class="card-head"><h3>Versioned lesson editor</h3></div><div class="card-body"><p>State: <b>${esc(c?.state||'not authored')}</b> · Draft version ${c?.version||'none'} · Published version ${doc.published_version||'none'}. Editing creates a new draft and invalidates its review; an older release stays available.</p><p class="s">The structured JSON supports module and lesson order, objectives, paragraphs, tables, diagrams, worked examples, references, optional practice links and MCQs. Lesson IDs and competency IDs must resolve. Correct-answer fields remain inside authorized admin APIs.</p>
  <label class="field"><span>Course content JSON</span><textarea id="cuLearningJSON" rows="22" spellcheck="false" style="font-family:monospace;max-width:100%;width:100%;box-sizing:border-box">${esc(JSON.stringify(c||{id:CU_LEARNING,version:1,pass_mark:70,checkpoint_items:9,quiz_minutes:12,checkpoint_minutes:20,modules:[],lessons:[],questions:[],references:[]},null,2))}</textarea></label>
  <div class="row" style="gap:8px;flex-wrap:wrap"><button class="btn btn-primary" id="cuLearningSave">Save new draft version</button>${first?`<a class="btn btn-ghost" href="/career#learn-preview/${esc(CU_LEARNING)}" target="_blank" rel="noopener">Preview written lessons</a>`:''}<button class="btn btn-ghost" data-learning-action="review">Send for human review</button><button class="btn btn-ghost" data-learning-action="unpublish">Unpublish release</button></div>
  <h4>Validation</h4><p>${errors.length} errors · ${warnings.length} warnings. Passing automated checks does not constitute human approval.</p>${errors.length?`<ul>${errors.map(s=>`<li>${esc(s)}</li>`).join('')}</ul>`:''}${warnings.length?`<details><summary>Quality warnings</summary><ul>${warnings.map(s=>`<li>${esc(s)}</li>`).join('')}</ul></details>`:''}
  <h4>Human review and publication</h4><label class="field"><span>Review notes, source checks and corrections</span><textarea id="cuLearningNotes" rows="4">${esc(doc.review?.notes||'')}</textarea></label><label class="check"><input type="checkbox" id="cuLearningAttest"> I personally reviewed the lesson explanations, code outputs, quiz keys, competency mappings and source references for this exact version.</label>
  <div class="row" style="gap:8px;flex-wrap:wrap;margin-top:12px"><button class="btn btn-ghost" data-learning-action="approve">Record human approval</button><button class="btn btn-primary" data-learning-action="publish">Publish approved version</button></div><p class="s">Approval checks exact code hashes against the repository verification artifact; changed examples require the server sandbox. Publishing requires this version’s approval and its published comprehensive assessment. Drafts are never automatically student-visible.</p><p id="cuLearningMsg" role="status"></p></div></section>`;
}
