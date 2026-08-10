'use strict';

/* EchoLens v11 - dedicated grading page (/grade?sid=ID)
   Everything a teacher needs on ONE screen: the brief, the student's work
   (runnable), the AI review, the integrity check, and the grade form.
   The teacher always decides the final score. */

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
async function api(path, opts = {}) {
  const isForm = opts.body instanceof FormData;
  const res = await fetch(path, { credentials: 'same-origin', headers: isForm ? {} : { 'Content-Type': 'application/json' }, ...opts });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401) { location.href = '/login'; throw new Error('Signed out.'); }
  if (!res.ok) throw new Error(data.error || 'Something went wrong.');
  return data;
}
function toast(text, isErr) {
  const t = $('toast');
  t.textContent = text; t.className = 'toast show' + (isErr ? ' err' : '');
  clearTimeout(t._h); t._h = setTimeout(() => (t.className = 'toast'), 2600);
}
function fmtDate(d) { if (!d) return '—'; try { return new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }); } catch { return d; } }

const SID = new URLSearchParams(location.search).get('sid');
let DATA = null;
let ME_AI = false;

(async () => {
  try {
    const me = await api('/api/auth/me');
    ME_AI = !!me.ai_enabled;
    DATA = await api(`/api/quest-submissions/${SID}`);
  } catch (e) {
    $('gate').innerHTML = `<div class="empty">${esc(e.message)}</div>`;
    return;
  }
  draw();
  $('gate').style.display = 'none';
  $('app').style.display = '';
})();

function fmtMin(ms) { return ms == null ? '—' : (Math.round(ms / 6000) / 10) + ' min'; }
function draw() {
  const { submission: s, problem: p, quest: q, course: c, can_grade, files } = DATA;
  document.title = `Grade - ${s.student_name} - ${p.title}`;
  $('pageTitle').textContent = `Grading: ${p.title}`;
  $('courseLine').textContent = `${c.title} · Level ${q.no}`;

  const workBlock = s.code ? `
    <div class="card"><div class="ide-toolbar">
      <strong>${s.language === 'web' ? '🌐 Web submission (HTML/CSS/JS)' : s.language === 'text' ? '📝 Written answer' : '🐍 Python submission'}</strong>
      <span style="flex:1"></span>
      <span class="s" id="runStatus" style="color:var(--muted-2)"></span>
      ${s.language === 'python' || !s.language ? '<button class="btn btn-ghost btn-sm" id="runBtn" onclick="runCode()">&#9654; Run</button>' : ''}
      ${s.language === 'web' ? '<button class="btn btn-ghost btn-sm" onclick="previewWeb()">&#9654; Preview</button>' : ''}
      <button class="btn btn-ghost btn-sm" onclick="navigator.clipboard.writeText(document.getElementById('subCode').textContent).then(()=>toast('Copied.'))">Copy</button>
    </div>
    <pre id="subCode" class="code-out" style="display:block;max-height:46vh;margin:0;border-radius:0 0 14px 14px">${esc(s.code)}</pre>
    <div id="runTerm" style="display:none"></div>
    <div id="webWrap" style="display:none"><iframe id="webFrame" class="web-frame" sandbox="allow-scripts" title="Preview"></iframe><pre id="webLog" class="web-log"></pre></div>
    </div>`
    : `<div class="card"><div class="card-body">
        <a class="btn btn-teal" href="${esc(s.file_url)}" target="_blank" rel="noopener">&#128206; Open submitted file</a>
        <p class="hint" style="margin-top:8px">File submissions open in a new tab. The AI review and integrity check read the file's text automatically.</p>
      </div></div>`;

  $('gradeBody').innerHTML = `
    <div class="grade-grid">
      <div>
        <div class="card"><div class="card-head"><h3>${p.type === 'written' ? '📝 ' : ''}${esc(p.title)}</h3>
          <span class="s" style="color:var(--muted)">${esc(p.difficulty || '')} · ${p.points || 100} gems${q.deadline ? ' · due ' + fmtDate(q.deadline) : ''}</span></div>
          <div class="card-body">
            <div class="s" style="white-space:pre-line;line-height:1.6">${esc(p.description || '')}</div>
            ${p.solution ? `<details style="margin-top:10px"><summary class="s" style="cursor:pointer;color:var(--teal-deep);font-weight:600">Solution guideline (private)</summary><div class="s" style="background:#FDF8EC;border:1px solid #F0E2BC;border-radius:9px;padding:9px 12px;margin-top:5px;white-space:pre-line">${esc(p.solution)}</div></details>` : ''}
            ${files && files.length ? `<div class="s" style="margin-top:10px"><strong>Datasets:</strong> ${files.map((f) => `<a href="${esc(f.url)}" target="_blank" rel="noopener">${esc(f.name)}</a>`).join(' · ')}</div>` : ''}
          </div></div>
        <div class="card"><div class="card-head"><h3>Student</h3></div>
          <div class="card-body">
            <div class="t" style="font-weight:700">${esc(s.student_name)} <span class="mono s" style="color:var(--muted)">${esc(s.student_reg || '')}</span>${s.late ? ' <span class="late-flag">LATE</span>' : ''}</div>
            <div class="s" style="color:var(--muted)">Submitted ${esc((s.submitted_at || '').slice(0, 16))}${s.late ? ' - after the deadline: 20% of earned gems are deducted automatically' : ''}</div>
            ${s.note ? `<div class="s" style="margin-top:6px">Note: &ldquo;${esc(s.note)}&rdquo;</div>` : ''}
            ${s.grade != null ? `<div class="task-status ok" style="margin-top:8px">Currently graded <strong>${s.grade}%</strong> · ${s.gems} gems${s.late_deduction ? ` (−${s.late_deduction} late)` : ''}</div>` : '<div class="task-status wait" style="margin-top:8px">Not graded yet</div>'}
          </div></div>
        ${workBlock}
      </div>
      <div>
        ${s.telemetry ? `
        <div class="card"><div class="card-head"><h3>&#9200; Activity</h3><span class="s" style="color:var(--muted)">How the student worked</span></div>
          <div class="card-body">
            <div class="s" style="display:flex;flex-wrap:wrap;gap:6px 16px;margin-bottom:10px">
              <span><strong>${fmtMin(s.telemetry.totalMs)}</strong> total</span>
              <span><strong>${fmtMin(s.telemetry.activeMs)}</strong> active coding</span>
              <span><strong>${s.telemetry.runs || 0}</strong> run${(s.telemetry.runs || 0) === 1 ? '' : 's'}</span>
              <span><strong>${s.telemetry.aiRequests || 0}</strong> AI question${(s.telemetry.aiRequests || 0) === 1 ? '' : 's'}</span>
              <span><strong>${s.telemetry.pasteBlocked || 0}</strong> paste attempt${(s.telemetry.pasteBlocked || 0) === 1 ? '' : 's'} blocked</span>
            </div>
            <div id="activityReportBody">${s.activity_report
              ? `<pre style="white-space:pre-wrap;background:var(--canvas);border:1px solid var(--line);border-radius:11px;padding:12px;font-size:12.5px;max-height:34vh;overflow-y:auto">${esc(s.activity_report.text)}</pre>
                 <button class="btn btn-ghost btn-sm" onclick="generateActivityReport(true)">Regenerate report</button>`
              : `<button class="btn btn-ghost btn-sm" id="activityReportBtn" onclick="generateActivityReport(false)">Generate activity report</button>`}</div>
          </div></div>` : ''}
        ${ME_AI ? `
        <div class="card"><div class="card-head"><h3>&#10024; AI assist</h3><span class="s" style="color:var(--muted)">Drafts only - you decide</span></div>
          <div class="card-body">
            <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px">
              <button class="btn btn-teal btn-sm" id="aiBtn" onclick="aiReview(false)">AI review</button>
              <button class="btn btn-ghost btn-sm" id="intBtn" onclick="integrityCheck(false)">&#128737; AI / plagiarism check</button>
            </div>
            <div id="aiOut"></div>
            <div id="intOut"></div>
          </div></div>` : ''}
        ${can_grade ? `
        <div class="card"><div class="card-head"><h3>Grade</h3></div>
          <div class="card-body">
            <form id="gradeForm">
              <label class="field"><span>Grade (0–100%)</span><input name="grade" type="number" min="0" max="100" ${s.grade != null ? `value="${s.grade}"` : ''} required></label>
              <label class="field"><span>Remarks for the student</span><textarea name="remarks" placeholder="What went well, what to improve" style="min-height:90px">${esc(s.remarks || '')}</textarea></label>
              <p class="hint">Gems = points × grade${s.late ? ' − 20% late deduction' : ''}. When the level average reaches the pass mark, the next level unlocks for the student.</p>
              <button class="btn btn-primary btn-block">Save grade</button>
            </form>
            <div id="savedBox" style="display:none" class="task-status ok">&#10003; Saved. The board shows the grade immediately; the student was emailed.</div>
          </div></div>` : ''}
      </div>
    </div>`;

  const gf = $('gradeForm');
  if (gf) gf.addEventListener('submit', async (e) => {
    e.preventDefault(); const f = e.target; const btn = f.querySelector('button'); btn.disabled = true;
    try {
      const out = await api(`/api/quest-submissions/${SID}/grade`, { method: 'POST', body: JSON.stringify({ grade: f.grade.value, remarks: f.remarks.value }) });
      DATA.submission = { ...DATA.submission, ...out.submission };
      $('savedBox').style.display = '';
      $('savedBox').innerHTML = `&#10003; Saved: <strong>${out.submission.grade}%</strong> · ${out.submission.gems} gems${out.submission.late_deduction ? ` (−${out.submission.late_deduction} late deduction)` : ''}. The student was emailed.`;
      toast('Graded - gems awarded.');
      btn.disabled = false; btn.textContent = 'Update grade';
    } catch (err) { toast(err.message, true); btn.disabled = false; }
  });
}

async function runCode() {
  const btn = $('runBtn'); const status = $('runStatus');
  if (EchoRun.isRunning()) { EchoRun.cancel(); btn.innerHTML = '&#9654; Run'; return; }
  const wrap = $('runTerm');
  wrap.style.display = '';
  if (!wrap._term) wrap._term = EchoTerm.mount(wrap);
  btn.innerHTML = '&#9632; Stop';
  const files = (DATA.files || []).map((f) => ({ name: f.name, url: f.url }));
  try { await EchoRun.execute(DATA.submission.code, { term: wrap._term, files, onStatus: (t) => { status.textContent = t; } }); }
  catch (e) { status.textContent = e.message; }
  btn.innerHTML = '&#9654; Run';
}
function previewWeb() {
  $('webWrap').style.display = '';
  const log = $('webLog'); log.textContent = '';
  EchoWeb.preview($('webFrame'), DATA.submission.code, (kind, text) => {
    log.textContent += (kind === 'error' ? '✗ ' : '› ') + text + '\n';
  });
}

async function generateActivityReport(force) {
  const btn = $('activityReportBtn');
  const box = $('activityReportBody');
  if (btn) { btn.disabled = true; btn.textContent = 'Generating...'; }
  try {
    const out = await api(`/api/quest-submissions/${SID}/activity-report`, { method: 'POST', body: JSON.stringify({ force: !!force }) });
    DATA.submission.activity_report = out.report;
    box.innerHTML = `<pre style="white-space:pre-wrap;background:var(--canvas);border:1px solid var(--line);border-radius:11px;padding:12px;font-size:12.5px;max-height:34vh;overflow-y:auto">${esc(out.report.text)}</pre>
      <button class="btn btn-ghost btn-sm" onclick="generateActivityReport(true)">Regenerate report</button>`;
  } catch (e) { toast(e.message, true); if (btn) { btn.disabled = false; btn.textContent = 'Generate activity report'; } }
}

async function aiReview(force) {
  const btn = $('aiBtn'); btn.disabled = true; btn.textContent = 'Reviewing...';
  try {
    const out = await api('/api/ai/review', { method: 'POST', body: JSON.stringify({ submission_id: Number(SID), force }) });
    const r = out.review;
    const gf = $('gradeForm');
    if (gf && r.suggested_score != null && !gf.grade.value) gf.grade.value = r.suggested_score;
    $('aiOut').innerHTML = `<div class="ai-box">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:6px">
        <strong>AI review${out.cached ? ' (cached)' : ''}</strong>
        <span style="display:flex;gap:8px;align-items:center">
          ${out.cached ? `<button class="btn btn-ghost btn-sm" onclick="aiReview(true)">Regenerate</button>` : ''}
          <span class="s" style="color:var(--muted-2)">suggested: <strong>${r.suggested_score != null ? r.suggested_score + '%' : '—'}</strong></span></span>
      </div>
      ${[['Question', r.question_summary], ['What the student did', r.solution_summary], ['Key concepts grasped', r.key_concepts], ['Mistakes', r.mistakes], ['Better approach', r.better_approach]]
        .filter(([, v]) => v).map(([k, v]) => `<div style="margin-bottom:6px"><span style="font-weight:700;color:var(--navy)">${k}:</span> <span style="white-space:pre-line">${esc(v)}</span></div>`).join('')}
      ${r.readable === false ? '<div style="color:var(--danger)"><em>The submission was not readable as text - check it yourself.</em></div>' : ''}
      <div style="display:flex;gap:10px;align-items:center;margin-top:8px;flex-wrap:wrap">
        <button class="btn btn-teal btn-sm" id="shareBtn" onclick="shareReview(${out.shared ? 'false' : 'true'})">${out.shared ? 'Stop sharing with student' : 'Share key points with student'}</button>
      </div>
      <div class="s" style="color:var(--muted-2);margin-top:6px">The suggested score is never shared. You decide the final grade.</div>
    </div>`;
  } catch (e) { toast(e.message, true); }
  btn.disabled = false; btn.textContent = 'AI review';
}
async function shareReview(share) {
  const btn = $('shareBtn'); if (btn) btn.disabled = true;
  try {
    const out = await api(`/api/quest-submissions/${SID}/share-review`, { method: 'POST', body: JSON.stringify({ share }) });
    toast(out.shared ? 'Key points shared with the student.' : 'Sharing stopped.');
    if (btn) { btn.disabled = false; btn.textContent = out.shared ? 'Stop sharing with student' : 'Share key points with student'; btn.setAttribute('onclick', `shareReview(${out.shared ? 'false' : 'true'})`); }
  } catch (e) { toast(e.message, true); if (btn) btn.disabled = false; }
}

async function integrityCheck(force) {
  const btn = $('intBtn'); btn.disabled = true; btn.textContent = 'Checking...';
  try {
    const out = await api('/api/ai/integrity', { method: 'POST', body: JSON.stringify({ submission_id: Number(SID), force }) });
    const r = out.integrity;
    const sim = r.similarity || { compared: 0, matches: [] };
    const a = r.ai_check;
    const level = (n) => n == null ? '' : n >= 70 ? 'high' : n >= 40 ? 'mid' : 'low';
    $('intOut').innerHTML = `<div class="ai-box int-box">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:6px">
        <strong>&#128737; Integrity report${out.cached ? ' (cached)' : ''}</strong>
        ${out.cached ? `<button class="btn btn-ghost btn-sm" onclick="integrityCheck(true)">Re-run</button>` : ''}
      </div>
      <div style="margin-bottom:8px"><span style="font-weight:700;color:var(--navy)">Similarity vs classmates:</span>
        ${sim.matches.length
          ? sim.matches.map((m) => `<div class="s" style="margin-top:3px"><span class="int-meter ${level(m.similarity)}">${m.similarity}%</span> match with ${esc(m.student)} <span class="mono" style="color:var(--muted)">${esc(m.reg_no || '')}</span></div>`).join('')
          : `<span class="s"> no significant match across ${sim.compared} other submission${sim.compared === 1 ? '' : 's'}.</span>`}
      </div>
      ${a && !a.error ? `
      <div style="margin-bottom:6px"><span style="font-weight:700;color:var(--navy)">AI-generated likelihood:</span>
        <span class="int-meter ${level(a.ai_likelihood)}">${a.ai_likelihood != null ? a.ai_likelihood + '%' : '—'}</span> <strong>${esc(a.verdict)}</strong></div>
      ${a.indicators ? `<div class="s" style="white-space:pre-line;margin-bottom:6px">${esc(a.indicators)}</div>` : ''}
      ${a.advice ? `<div class="s" style="color:var(--teal-deep)"><strong>Next step:</strong> ${esc(a.advice)}</div>` : ''}` : (a && a.error ? `<div class="s" style="color:var(--danger)">AI check unavailable: ${esc(a.error)}</div>` : '')}
      ${!r.readable ? '<div class="s" style="color:var(--danger)"><em>The submission was not readable as text - only limited checks ran.</em></div>' : ''}
      <div class="s" style="color:var(--muted-2);margin-top:8px">${esc(r.note)}</div>
    </div>`;
  } catch (e) { toast(e.message, true); }
  btn.disabled = false; btn.innerHTML = '&#128737; AI / plagiarism check';
}
