'use strict';

/* EchoLens - Coursera-style curriculum instructor page (/curriculum/instructor).
   Course/module picker, grading queue (assignments + project), a quest
   score entry form, and the cohort attainment view with the OBE
   framework's watch (55-70%) / action (<55%) bands. */

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
async function api(path, opts = {}) {
  const res = await fetch(path, { credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, ...opts });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401) { location.href = '/login'; throw new Error('Signed out.'); }
  return { ok: res.ok, status: res.status, data };
}
function toast(text, isErr) {
  const t = $('toast');
  t.textContent = text; t.className = 'toast show' + (isErr ? ' err' : '');
  clearTimeout(t._h); t._h = setTimeout(() => (t.className = 'toast'), 2600);
}

let PROGRAMMES = [];
let CURRENT_MODULE = null;

(async () => {
  const me = await api('/api/auth/me');
  if (!me.ok || !['admin', 'instructor', 'coordinator'].includes(me.data.role)) {
    $('gate').innerHTML = `<div class="empty">Instructors and admins only.</div>`;
    return;
  }
  $('gate').style.display = 'none';
  $('app').style.display = '';
  const { data } = await api('/api/curriculum/programmes');
  PROGRAMMES = data.programmes || [];
  renderPicker();
})();

function renderPicker() {
  const courseOptions = PROGRAMMES.flatMap((p) => p.courses.map((c) => `<option value="${c.id}">${esc(p.name)} - ${esc(c.title)}</option>`)).join('');
  $('body').innerHTML = `
    <div class="cur-picker">
      <select id="courseSel" onchange="onCourseChange()"><option value="">Choose a course…</option>${courseOptions}</select>
      <select id="moduleSel" onchange="onModuleChange()" style="display:none"></select>
    </div>
    <div id="queueBody"></div>`;
}
window.renderPicker = renderPicker;

async function onCourseChange() {
  const courseId = $('courseSel').value;
  const modSel = $('moduleSel');
  if (!courseId) { modSel.style.display = 'none'; $('queueBody').innerHTML = ''; return; }
  modSel.innerHTML = '<option>Loading…</option>';
  modSel.style.display = '';
  // The /programmes payload only lists courses, not their modules - fetch the course detail for the module list.
  const { data } = await api(`/api/curriculum/courses/${courseId}`);
  modSel.innerHTML = data.modules.map((m) => `<option value="${m.id}">Module ${m.order_no}: ${esc(m.title)}</option>`).join('');
  modSel.style.display = '';
  onModuleChange();
}
window.onCourseChange = onCourseChange;

async function onModuleChange() {
  const moduleId = $('moduleSel').value;
  if (!moduleId) return;
  CURRENT_MODULE = Number(moduleId);
  await renderQueue();
}
window.onModuleChange = onModuleChange;

async function renderQueue() {
  const [{ data: queue }, { data: attainment }] = await Promise.all([
    api(`/api/curriculum/instructor/queue?module_id=${CURRENT_MODULE}`).then((r) => r),
    api(`/api/curriculum/modules/${CURRENT_MODULE}/attainment`).then((r) => r),
  ]);

  const bandLabel = { ok: 'On track', watch: 'Watch (55-70%)', action: 'Action needed (<55%)', not_enough_data: 'Not enough data yet' };
  const bandClass = { ok: 'ok', watch: 'watch', action: 'action', not_enough_data: '' };

  $('queueBody').innerHTML = `
    <div class="card" style="margin-bottom:20px"><div class="card-body">
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px">
        <div><b>Cohort attainment</b> - ${attainment.students_reached} students reached this module, ${attainment.students_passed} passed</div>
        <span class="cur-band ${bandClass[attainment.band]}">${attainment.attainment_pct != null ? attainment.attainment_pct + '% - ' : ''}${bandLabel[attainment.band]}</span>
      </div>
    </div></div>

    <h3>Pending assignment submissions</h3>
    ${queue.pending_assignments.length ? queue.pending_assignments.map(renderAssignmentGradeCard).join('') : '<div class="cur-empty">Nothing pending.</div>'}

    <h3>Pending project submissions</h3>
    ${queue.pending_projects.length ? queue.pending_projects.map(renderProjectGradeCard).join('') : '<div class="cur-empty">Nothing pending.</div>'}

    <h3>Quest score</h3>
    <div class="card"><div class="card-body">
      <p class="s" style="color:var(--muted)">Record a student's class-quest component for this module (15% of the module weight).</p>
      <div class="cur-grade-row">
        <input type="number" id="qs-student" placeholder="Student ID" style="width:110px">
        <input type="number" id="qs-score" placeholder="Score" min="0" max="100">
        <input type="text" id="qs-feedback" placeholder="Feedback">
        <button class="btn btn-primary btn-sm" onclick="submitQuestScore()">Save</button>
      </div>
    </div></div>`;
}

function renderAssignmentGradeCard(s) {
  return `<div class="cur-queue-item">
    <div>Student #${s.student_id} - attempt ${s.attempt_no} - submitted ${new Date(s.submitted_at).toLocaleString()}</div>
    <div class="s" style="color:var(--muted);white-space:pre-wrap;margin-top:6px">${esc(s.text || s.file_url || '')}</div>
    <div class="cur-grade-row">
      <input type="number" id="score-a-${s.id}" min="0" max="100" placeholder="Score">
      <input type="text" id="fb-a-${s.id}" placeholder="Written feedback (required)">
      <button class="btn btn-primary btn-sm" onclick="gradeAssignment(${s.id})">Grade</button>
    </div>
  </div>`;
}
function renderProjectGradeCard(s) {
  return `<div class="cur-queue-item">
    <div>Student #${s.student_id} - attempt ${s.attempt_no} - submitted ${new Date(s.submitted_at).toLocaleString()}</div>
    <div class="s" style="color:var(--muted);white-space:pre-wrap;margin-top:6px">${esc(s.text || s.file_url || '')}</div>
    <div class="cur-grade-row">
      <input type="number" id="score-p-${s.id}" min="0" max="100" placeholder="Score">
      <input type="text" id="fb-p-${s.id}" placeholder="Written feedback (required)">
      <button class="btn btn-primary btn-sm" onclick="gradeProject(${s.id})">Grade</button>
    </div>
  </div>`;
}

async function gradeAssignment(id) {
  const score = $(`score-a-${id}`).value, feedback = $(`fb-a-${id}`).value.trim();
  if (score === '' || !feedback) return toast('Score and feedback are both required.', true);
  const { ok, data } = await api(`/api/curriculum/assignment-submissions/${id}/grade`, { method: 'POST', body: JSON.stringify({ score, feedback }) });
  if (!ok) return toast(data.error || 'Could not grade.', true);
  toast('Graded.');
  renderQueue();
}
async function gradeProject(id) {
  const score = $(`score-p-${id}`).value, feedback = $(`fb-p-${id}`).value.trim();
  if (score === '' || !feedback) return toast('Score and feedback are both required.', true);
  const { ok, data } = await api(`/api/curriculum/project-submissions/${id}/grade`, { method: 'POST', body: JSON.stringify({ score, feedback }) });
  if (!ok) return toast(data.error || 'Could not grade.', true);
  toast('Graded.');
  renderQueue();
}
async function submitQuestScore() {
  const student_id = $('qs-student').value, score = $('qs-score').value, feedback = $('qs-feedback').value.trim();
  if (!student_id || score === '') return toast('Student ID and score are both required.', true);
  const { ok, data } = await api(`/api/curriculum/modules/${CURRENT_MODULE}/quest-score`, { method: 'POST', body: JSON.stringify({ student_id, score, feedback }) });
  if (!ok) return toast(data.error || 'Could not save.', true);
  toast('Quest score saved.');
  renderQueue();
}
window.gradeAssignment = gradeAssignment; window.gradeProject = gradeProject; window.submitQuestScore = submitQuestScore;
