'use strict';

/* EchoLens - Coursera-style curriculum student page (/curriculum).
   Three views driven by the query string, no reload between them:
     /curriculum                -> programme/course catalogue
     /curriculum?course=ID      -> vertical module list, lock state, progress
     /curriculum?module=ID      -> six sections + assignment/project submission
   Follows grade.js's api()/toast()/esc() conventions. */

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

function go(params) {
  const qs = new URLSearchParams(params).toString();
  history.pushState({}, '', qs ? `/curriculum?${qs}` : '/curriculum');
  route();
}
window.addEventListener('popstate', route);

(async () => {
  const me = await api('/api/auth/me');
  if (!me.ok) { $('gate').innerHTML = `<div class="empty">Please sign in.</div>`; return; }
  $('gate').style.display = 'none';
  $('app').style.display = '';
  route();
})();

async function route() {
  const params = new URLSearchParams(location.search);
  if (params.get('module')) return renderModule(params.get('module'));
  if (params.get('course')) return renderCourse(params.get('course'));
  return renderCatalogue();
}

/* ------------------------------ catalogue ------------------------------ */
async function renderCatalogue() {
  $('body').innerHTML = `<div class="cur-crumb">Curriculum</div><h2 style="margin:0 0 4px">Programmes and courses</h2><p class="s" style="color:var(--muted)">Each course is four modules, each module unlocks the next at a 60% weighted score.</p><div id="progList">Loading…</div>`;
  const { ok, data } = await api('/api/curriculum/programmes');
  if (!ok) { $('progList').innerHTML = `<div class="empty">${esc(data.error || 'Could not load the catalogue.')}</div>`; return; }
  $('progList').innerHTML = data.programmes.map((p) => `
    <div style="margin-top:26px">
      <h3 style="margin:0 0 4px">${esc(p.name)}</h3>
      <div class="cur-course-grid">
        ${p.courses.map((c) => `
          <div class="card cur-course-card" onclick="go({course:${c.id}})">
            <div class="card-body">
              <span class="badge">${esc(c.level)}</span>
              <div style="font-weight:600;margin-top:10px;font-size:14.5px;line-height:1.35">${esc(c.title)}</div>
              <div class="s" style="color:var(--muted);margin-top:8px">4 modules · capstone: ${esc(c.capstone_artifact || '')}</div>
            </div>
          </div>`).join('')}
      </div>
    </div>`).join('');
}

/* ------------------------------ course (module list) ------------------------------ */
async function renderCourse(courseId) {
  $('body').innerHTML = `<div class="cur-crumb"><a onclick="go({})">Curriculum</a> / Course</div><div id="courseBody">Loading…</div>`;
  const { ok, data } = await api(`/api/curriculum/courses/${courseId}`);
  if (!ok) { $('courseBody').innerHTML = `<div class="empty">${esc(data.error || 'Course not found.')}</div>`; return; }
  const passedCount = data.modules.filter((m) => m.passed).length;
  const enrollBtn = data.enrolled ? '' : `<button class="btn btn-primary" onclick="enroll(${data.course.id})">Enroll to begin</button>`;
  $('courseBody').innerHTML = `
    <div class="cur-prog-head">
      <h2 style="margin:0 0 4px">${esc(data.course.title)}</h2>
      <span class="badge">${esc(data.course.level)}</span>
      ${data.enrolled ? `<div class="cl-bar" style="margin-top:14px;max-width:320px"><div class="cl-fill" style="width:${(passedCount / 4) * 100}%"></div></div><div class="cl-pct">${passedCount} of 4 modules passed</div>` : `<div style="margin-top:14px">${enrollBtn}</div>`}
    </div>
    <div class="cur-module-list">
      ${data.modules.map((m) => {
        const clickable = m.unlocked;
        return `<div class="cur-module-row ${m.unlocked ? '' : 'locked'} ${clickable ? 'clickable' : ''}" ${clickable ? `onclick="go({module:${m.id}})"` : ''}>
          <div class="cur-module-num ${m.passed ? 'passed' : ''}">${m.passed ? '✓' : m.order_no}</div>
          <div class="cur-module-body">
            <div class="cur-module-title">${esc(m.title)}</div>
            <div class="cur-module-outcome">${esc(m.learning_outcome)}</div>
            ${m.gap ? `<div class="cur-gap">${m.gap.missing.length ? `Waiting on: <b>${m.gap.missing.join(', ')}</b>` : `Weighted score <b>${m.gap.weighted_score}%</b> - short by <b>${m.gap.short_by}</b> points of the 60% gate.`}</div>` : ''}
          </div>
          <div class="cur-module-meta">
            ${m.unlocked
              ? (m.weighted_score != null ? `<span class="badge">${m.weighted_score}%</span>` : `<span class="badge">In progress</span>`)
              : `<span class="cur-lock-reason">🔒 ${esc(m.lock_reason)}</span>`}
          </div>
        </div>`;
      }).join('')}
    </div>`;
}

async function enroll(courseId) {
  const { ok, data } = await api(`/api/curriculum/courses/${courseId}/enroll`, { method: 'POST' });
  if (!ok) return toast(data.error || 'Could not enroll.', true);
  toast('Enrolled - module 1 is now open.');
  renderCourse(courseId);
}
window.go = go; window.enroll = enroll;

/* ------------------------------ module (six sections) ------------------------------ */
async function renderModule(moduleId) {
  $('body').innerHTML = `<div class="cur-crumb"><a onclick="go({})">Curriculum</a> / Module</div><div id="moduleBody">Loading…</div>`;
  const { ok, status, data } = await api(`/api/curriculum/modules/${moduleId}`);
  if (!ok) {
    $('moduleBody').innerHTML = status === 403
      ? `<div class="empty">🔒 ${esc(data.error)}</div>`
      : `<div class="empty">${esc(data.error || 'Module not found.')}</div>`;
    return;
  }
  const byKind = Object.fromEntries(data.sections.map((s) => [s.kind, s.content]));
  const gap = data.progress.gap;
  $('moduleBody').innerHTML = `
    <div class="cur-prog-head">
      <h2 style="margin:0 0 4px">${esc(data.module.title)}</h2>
      <p class="s" style="color:var(--muted)">${esc(data.module.learning_outcome)}</p>
      ${data.progress.passed
        ? `<span class="badge" style="color:var(--ok)">Passed - ${data.progress.weighted_score}%</span>`
        : gap ? `<div class="cur-gap">${gap.missing.length ? `Waiting on: <b>${gap.missing.join(', ')}</b>` : `Weighted score <b>${gap.weighted_score}%</b> - short by <b>${gap.short_by}</b> points of the 60% gate.`}</div>` : ''}
    </div>

    <div class="cur-section">
      <h3>1. Watch first</h3>
      <div class="card"><div class="card-body">
        ${byKind.videos.map((v) => `<div class="cur-video-row"><span>${esc(v.channel)} - ${esc(v.title)}</span><span class="s" style="color:var(--muted-2)">${esc(v.length)}</span></div>`).join('')}
      </div></div>
    </div>

    <div class="cur-section"><h3>2. Theory reading</h3><div class="card"><div class="card-body"><p style="line-height:1.65;font-size:14px">${esc(byKind.reading)}</p></div></div></div>

    <div class="cur-section"><h3>3. Key rules</h3>${byKind.rules.map((r) => `<div class="cur-rule">${esc(r)}</div>`).join('')}</div>

    <div class="cur-section">
      <h3>4. Worked example</h3>
      <div class="cur-code-cap">${esc(data.sections.find((s) => s.kind === 'example').content.caption)} <span class="badge" style="margin-left:6px">${esc(byKind.example.language)}</span></div>
      <pre class="cur-code"><code>${esc(byKind.example.code)}</code></pre>
    </div>

    <div class="cur-section">
      <h3>5. Assignments</h3>
      ${data.assignments.map((a) => renderAssignment(a, data)).join('')}
    </div>

    <div class="cur-section">
      <h3>6. Module project</h3>
      ${renderProject(data.project, data)}
    </div>`;
}

function latestSubmission(list) { return list.length ? list.reduce((a, b) => (a.attempt_no > b.attempt_no ? a : b)) : null; }

function renderAssignment(a, data) {
  const subs = data.assignment_submissions.filter((s) => s.assignment_id === a.id);
  const latest = latestSubmission(subs);
  const graded = latest && latest.score != null;
  return `<div class="card" style="margin-bottom:12px"><div class="card-body">
    <div style="font-weight:600">${esc(a.title)}</div>
    <p class="s" style="color:var(--muted);margin:6px 0">${esc(a.brief)}</p>
    <p class="s" style="color:var(--muted-2);font-size:12px"><b>Pass criteria:</b> ${esc(a.pass_criteria)}</p>
    ${graded ? `<div class="cur-attempt">Attempt ${latest.attempt_no}: <b>${latest.score}%</b> - ${esc(latest.feedback || '')}</div>` : latest ? `<div class="cur-attempt">Attempt ${latest.attempt_no} submitted, awaiting grading.</div>` : ''}
    <div class="cur-submit-box">
      <textarea id="a-text-${a.id}" placeholder="Paste your write-up, or a link to your work..."></textarea>
      <button class="btn btn-primary btn-sm" onclick="submitAssignment(${data.module.id}, ${a.id})">${latest ? 'Resubmit' : 'Submit'}</button>
    </div>
  </div></div>`;
}

function renderProject(p, data) {
  const subs = data.project_submissions;
  const latest = latestSubmission(subs);
  const graded = latest && latest.score != null;
  return `<div class="card"><div class="card-body">
    <div style="font-weight:600">${esc(p.title)}</div>
    <p class="s" style="color:var(--muted);margin:6px 0">${esc(p.brief)}</p>
    ${graded ? `<div class="cur-attempt">Attempt ${latest.attempt_no}: <b>${latest.score}%</b> - ${esc(latest.feedback || '')}</div>` : latest ? `<div class="cur-attempt">Attempt ${latest.attempt_no} submitted, awaiting grading.</div>` : ''}
    <div class="cur-submit-box">
      <textarea id="p-text" placeholder="Paste your write-up, or a link to your repository..."></textarea>
      <button class="btn btn-primary btn-sm" onclick="submitProject(${data.module.id})">${latest ? 'Resubmit' : 'Submit'}</button>
    </div>
  </div></div>`;
}

async function submitAssignment(moduleId, assignmentId) {
  const text = $(`a-text-${assignmentId}`).value.trim();
  if (!text) return toast('Add your write-up or a link first.', true);
  const { ok, data } = await api(`/api/curriculum/modules/${moduleId}/assignments/${assignmentId}/submit`, { method: 'POST', body: JSON.stringify({ text }) });
  if (!ok) return toast(data.error || 'Could not submit.', true);
  toast('Submitted.');
  renderModule(moduleId);
}
async function submitProject(moduleId) {
  const text = $('p-text').value.trim();
  if (!text) return toast('Add your write-up or a link first.', true);
  const { ok, data } = await api(`/api/curriculum/modules/${moduleId}/project/submit`, { method: 'POST', body: JSON.stringify({ text }) });
  if (!ok) return toast(data.error || 'Could not submit.', true);
  toast('Submitted.');
  renderModule(moduleId);
}
window.submitAssignment = submitAssignment; window.submitProject = submitProject;
