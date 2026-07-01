'use strict';

/* ------------------------------ helpers ------------------------------ */
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
const $ = (id) => document.getElementById(id);
const roleLabel = (r) => (r === 'instructor' ? 'Teacher' : r === 'admin' ? 'Admin' : 'Student');
const GEM = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 2h12l4 6-10 14L2 8z"/></svg>';
async function api(path, opts = {}) {
  const res = await fetch(path, { credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, ...opts });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Request failed.');
  return data;
}
async function apiForm(path, fd) {
  const res = await fetch(path, { method: 'POST', credentials: 'same-origin', body: fd });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Request failed.');
  return data;
}
function toast(t, kind = '') { const el = $('toast'); el.textContent = t; el.className = 'toast show ' + kind; setTimeout(() => el.className = 'toast ' + kind, 2800); }
function fmtDate(d) { if (!d) return 'TBC'; const dt = new Date(d + 'T00:00:00'); return isNaN(dt) ? d : dt.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }); }
const fmtTime = (t) => (t ? t.slice(0, 5) : '');
const progressBar = (pct) => `<div class="progress"><i style="width:${Math.max(0, Math.min(100, pct || 0))}%"></i></div>`;
const gemChip = (n) => `<span class="gem">${GEM}${n || 0}</span>`;

let ME = null, COURSE = null, TAB = 'schedule';
const isStaff = () => ME && (ME.role === 'admin' || ME.role === 'instructor');

/* ------------------------------- boot ------------------------------- */
(async function boot() {
  try { ME = (await api('/api/auth/me')).user; } catch { location.href = '/'; return; }
  $('userName').textContent = ME.name;
  $('rolePill').textContent = roleLabel(ME.role);
  $('avatar').textContent = (ME.name || 'E').trim().charAt(0).toUpperCase();
  if (ME.role === 'admin') document.querySelectorAll('.admin-only').forEach((el) => el.style.display = '');
  $('gate').style.display = 'none';
  $('app').style.display = '';
  document.querySelectorAll('#nav .nav-item').forEach((a) => a.addEventListener('click', () => show(a.dataset.view)));
  document.addEventListener('click', (e) => { if (!e.target.closest('.kebab')) document.querySelectorAll('.kebab-menu').forEach((m) => m.classList.remove('open')); });
  show('overview');
  if (!ME.profile_complete && ME.role !== 'admin') setTimeout(openProfileForm, 400);
})();
async function logout() { try { await api('/api/auth/logout', { method: 'POST' }); } catch {} location.href = '/'; }

/* ----------------------------- navigation ----------------------------- */
const TITLES = { overview: 'Overview', courses: 'My courses', course: 'Course', schedule: 'Schedule', announcements: 'Announcements', profile: 'Profile', 'admin-catalogue': 'Catalogue & new course' };
function show(view) {
  document.querySelectorAll('#nav .nav-item').forEach((a) => a.classList.toggle('active', a.dataset.view === view));
  document.querySelectorAll('.view').forEach((v) => v.classList.remove('active'));
  $('view-' + view).classList.add('active');
  $('pageTitle').textContent = TITLES[view] || '';
  $('sidebar').classList.remove('open');
  if (renderers[view]) renderers[view]();
}

/* ------------------------------- modals ------------------------------- */
function openModal(title, body) { $('modalTitle').textContent = title; $('modalBody').innerHTML = body; modalMsg(''); $('modal').classList.add('open'); }
function closeModal() { $('modal').classList.remove('open'); }
function modalMsg(t, kind = 'err') { const el = $('modalMsg'); if (!t) { el.className = 'form-msg'; el.textContent = ''; return; } el.className = 'form-msg ' + kind; el.textContent = t; }
$('modal').addEventListener('click', (e) => { if (e.target.id === 'modal') closeModal(); });
function openViewer(title, url) {
  $('viewerTitle').textContent = title;
  $('viewerBody').innerHTML = `<iframe class="viewer-frame" src="${esc(url)}"></iframe>
    <div style="margin-top:12px;text-align:right"><a class="btn btn-primary btn-sm" href="${esc(url)}" download target="_blank" rel="noopener">Download</a></div>`;
  $('viewer').classList.add('open');
}
function closeViewer() { $('viewer').classList.remove('open'); $('viewerBody').innerHTML = ''; }
$('viewer').addEventListener('click', (e) => { if (e.target.id === 'viewer') closeViewer(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { closeModal(); closeViewer(); } });

function bindModalForm({ endpoint, multipart = false, onSuccess }) {
  const form = $('modalForm'); if (!form) return;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = form.querySelector('button[type=submit]'); if (btn) btn.disabled = true; modalMsg('');
    try {
      let data;
      if (multipart) {
        const fd = new FormData(form);
        const fileInput = form.querySelector('input[type=file]');
        if (fileInput && (!fileInput.files || !fileInput.files.length)) fd.delete(fileInput.name);
        data = await apiForm(endpoint, fd);
      } else {
        const body = {}; new FormData(form).forEach((v, k) => { body[k] = v === '' ? null : v; });
        data = await api(endpoint, { method: 'POST', body: JSON.stringify(body) });
      }
      if (onSuccess) onSuccess(data); else closeModal();
    } catch (err) { modalMsg(err.message); if (btn) btn.disabled = false; }
  });
}
const fieldGrid = (inner) => `<div class="form-grid">${inner}</div>`;
const submitRow = (label) => `<button class="btn btn-primary btn-block" type="submit">${esc(label)}</button>`;

/* ------------------------------- views ------------------------------- */
const renderers = {
  async overview() {
    const el = $('view-overview'); el.innerHTML = '<div class="empty">Loading</div>';
    const o = await api('/api/me/overview');
    if (ME.role === 'student') return renderStudentOverview(el, o);
    if (ME.role === 'instructor') return renderTeacherOverview(el, o);
    return renderAdminOverview(el);
  },
  async courses() {
    const el = $('view-courses'); el.innerHTML = '<div class="empty">Loading</div>';
    const { courses } = await api('/api/me/courses');
    if (!courses.length) {
      el.innerHTML = `<div class="card"><div class="empty"><div class="t">No courses yet</div>
        <div>${ME.role === 'admin' ? 'Open <strong>Catalogue &amp; new course</strong> to start one.' : 'You will see your courses here once you are added to one.'}</div></div></div>`;
      return;
    }
    el.innerHTML = `<div class="course-tiles">${courses.map(courseTile).join('')}</div>`;
  },
  async schedule() {
    const el = $('view-schedule'); el.innerHTML = '<div class="empty">Loading</div>';
    const { upcoming } = await api('/api/me/schedule');
    el.innerHTML = upcoming.length ? card('Upcoming live classes', upcoming.map(sessionRow).join(''), true) : card('Schedule', empty('No classes scheduled yet.'), true);
  },
  async announcements() {
    const el = $('view-announcements'); el.innerHTML = '<div class="empty">Loading</div>';
    const { announcements } = await api('/api/me/announcements');
    el.innerHTML = card('Announcements', announcements.length ? announcements.map(annRow).join('') : empty('Nothing yet.'), true);
  },
  profile() { renderProfile(); },
  async 'admin-catalogue'() {
    const el = $('view-admin-catalogue'); if (ME.role !== 'admin') { el.innerHTML = card('', empty('Admin only.')); return; }
    el.innerHTML = '<div class="empty">Loading</div>';
    const [{ courses }, { teachers }] = await Promise.all([api('/api/admin/catalogue'), api('/api/admin/teachers')]);
    const courseOpts = courses.map((c) => `<option value="${c.id}">${esc(c.title)} (${esc(c.tier)})</option>`).join('') || '<option value="">Add a course first</option>';
    const teacherOpts = '<option value="">Assign later</option>' + teachers.map((t) => `<option value="${t.id}">${esc(t.name)}</option>`).join('');
    el.innerHTML = `
      <div class="card"><div class="card-head"><h3>Start a course (new offering)</h3></div>
        <div class="card-body"><p style="margin:-4px 0 14px;color:var(--muted);font-size:13.5px">The same course can run many times. Each offering gets its own unique code automatically.</p>
        <form id="startForm">${fieldGrid(`
          <label class="field"><span>Course</span><select name="course_id" required>${courseOpts}</select></label>
          <label class="field"><span>Offering name</span><input name="name" required placeholder="e.g. August 2026 (Evening)"></label>
          <label class="field"><span>Start date</span><input name="start_date" type="date"></label>
          <label class="field"><span>Teacher</span><select name="instructor_id">${teacherOpts}</select></label>`)}
          <button class="btn btn-primary" type="submit">Start course</button></form></div></div>
      <div class="card"><div class="card-head"><h3>Add a course to the catalogue</h3></div>
        <div class="card-body"><form id="courseForm">${fieldGrid(`
          <label class="field"><span>Course code</span><input name="code" required placeholder="e.g. ST-RAG"></label>
          <label class="field"><span>Tier</span><select name="tier" required><option>Bootcamp</option><option>Short Course</option><option>Specialist Track</option><option>Career Track</option></select></label>
          <label class="field full"><span>Title</span><input name="title" required></label>
          <label class="field"><span>Weeks</span><input name="weeks" type="number" min="1"></label>
          <label class="field"><span>Hours</span><input name="hours" type="number" min="1"></label>
          <label class="field"><span>Price (PKR)</span><input name="price_pkr" type="number" min="0"></label>
          <label class="field full"><span>Summary</span><textarea name="summary"></textarea></label>`)}
          <button class="btn btn-primary" type="submit">Add course</button></form></div></div>`;
    plainForm('startForm', '/api/admin/start-course', (d) => { toast('Course started: ' + d.code); show('admin-catalogue'); });
    plainForm('courseForm', '/api/admin/courses', () => { toast('Course added.'); show('admin-catalogue'); });
  },
};

function renderStudentOverview(el, o) {
  el.innerHTML = `
    <div class="stat-grid">
      <div class="stat-card"><div class="gem-big">${GEM}${o.gems || 0}</div><div class="l">Total gems &middot; <span class="level-pill">${o.level}</span></div></div>
      <div class="stat-card"><div class="n">${o.courses}</div><div class="l">Your courses</div></div>
      <div class="stat-card"><div class="n">${o.upcoming.length}</div><div class="l">Upcoming classes</div></div>
    </div>
    <div class="card"><div class="card-head"><h3>Your progress</h3></div><div class="card-body tight">
      ${(o.course_progress || []).length ? o.course_progress.map((c) => `
        <div class="list-row"><div class="grow"><div class="t">${esc(c.title)} <span class="role-pill">${esc(c.code)}</span></div>
          ${progressBar(c.progress_pct)}<div class="progress-label"><span>${c.progress_pct}% complete</span><span>${gemChip(c.gems)} of ${c.gems_possible}</span></div></div></div>`).join('')
        : empty('No courses yet.')}</div></div>
    <div class="card"><div class="card-head"><h3>Next classes</h3></div><div class="card-body tight">${o.upcoming.length ? o.upcoming.map(sessionRow).join('') : empty('No classes scheduled.')}</div></div>
    <div class="card"><div class="card-head"><h3>Announcements</h3></div><div class="card-body tight">${o.announcements.length ? o.announcements.map(annRow).join('') : empty('Nothing yet.')}</div></div>`;
}
async function renderTeacherOverview(el, o) {
  const { courses } = await api('/api/me/courses');
  el.innerHTML = `
    <div class="stat-grid">
      <div class="stat-card"><div class="n">${courses.length}</div><div class="l">Your courses</div></div>
      <div class="stat-card"><div class="n">${courses.reduce((t, c) => t + c.enrolled, 0)}</div><div class="l">Students</div></div>
      <div class="stat-card"><div class="n">${o.upcoming.length}</div><div class="l">Upcoming classes</div></div>
    </div>
    <div class="card"><div class="card-head"><h3>Your courses</h3></div><div class="card-body tight">
      ${courses.length ? courses.map((c) => `<div class="list-row" style="cursor:pointer" onclick="openCourse(${c.id})">
        <div class="grow"><div class="t">${esc(c.course_title)} <span class="role-pill">${esc(c.code)}</span></div>
          ${progressBar(c.progress_pct)}<div class="progress-label"><span>${c.progress_pct}% complete</span><span>${c.enrolled} student(s)</span></div></div>
        <span class="badge ${esc(c.status)}">${esc(c.status)}</span></div>`).join('') : empty('No courses assigned yet.')}</div></div>
    <div class="card"><div class="card-head"><h3>Next classes</h3></div><div class="card-body tight">${o.upcoming.length ? o.upcoming.map(sessionRow).join('') : empty('No classes scheduled.')}</div></div>`;
}
async function renderAdminOverview(el) {
  const [o, lb] = await Promise.all([api('/api/admin/overview'), api('/api/admin/leaderboard')]);
  el.innerHTML = `
    <div class="stat-grid">
      <div class="stat-card"><div class="n">${o.students}</div><div class="l">Students</div></div>
      <div class="stat-card"><div class="n">${o.teachers}</div><div class="l">Teachers</div></div>
      <div class="stat-card"><div class="n">${o.running_courses}</div><div class="l">Running courses</div></div>
      <div class="stat-card"><div class="n">${o.graded}/${o.submissions}</div><div class="l">Graded / submitted</div></div>
      <div class="stat-card"><div class="gem-big">${GEM}${o.total_gems}</div><div class="l">Gems awarded</div></div>
    </div>
    <div class="card"><div class="card-head"><h3>Exports &amp; backup</h3></div><div class="card-body">
      <div class="export-row">
        <a class="btn btn-ghost btn-sm" href="/api/admin/export/students.csv">All students (CSV)</a>
        <a class="btn btn-ghost btn-sm" href="/api/admin/export/backup.json">Full backup (JSON)</a>
      </div></div></div>
    <div class="card"><div class="card-head"><h3>Top students by gems</h3></div><div class="card-body tight">
      ${lb.students.length ? lb.students.slice(0, 10).map((s, i) => `<div class="leader-row"><span class="rank ${i < 3 ? 'top' : ''}">${i + 1}</span>
        <div class="grow"><div class="t">${esc(s.name)}</div><div class="s">${esc(s.username)} &middot; ${s.level}</div></div>${gemChip(s.gems)}</div>`).join('') : empty('No students yet.')}</div></div>
    <div class="card"><div class="card-head"><h3>Top courses by gems</h3></div><div class="card-body tight">
      ${lb.courses.length ? lb.courses.slice(0, 10).map((c, i) => `<div class="leader-row" style="cursor:pointer" onclick="openCourse(${c.id})"><span class="rank ${i < 3 ? 'top' : ''}">${i + 1}</span>
        <div class="grow"><div class="t">${esc(c.title)} <span class="role-pill">${esc(c.code)}</span></div><div class="s">${esc(c.name)}</div></div>${gemChip(c.gems)}</div>`).join('') : empty('No courses yet.')}</div></div>
    <div class="card"><div class="card-head"><h3>All courses</h3></div><div class="card-body tight">
      ${o.batches.length ? o.batches.map((b) => `<div class="list-row" style="cursor:pointer" onclick="openCourse(${b.id})">
        <div class="when">${fmtDate(b.start_date)}</div><div class="grow"><div class="t">${esc(b.course_title)} <span class="role-pill">${esc(b.code)}</span></div>
        <div class="s">${esc(b.name)} &middot; ${esc(b.instructor_name || 'No teacher')} &middot; ${b.enrolled} student(s)</div></div>
        <span class="badge ${esc(b.status)}">${esc(b.status)}</span></div>`).join('') : empty('No courses started yet.')}</div></div>`;
}

function courseTile(c) {
  return `<article class="tile" onclick="openCourse(${c.id})">
    <div style="display:flex;justify-content:space-between;align-items:center"><span class="tier-tag">${esc(c.tier || '')}</span><span class="role-pill">${esc(c.code)}</span></div>
    <h4>${esc(c.course_title)}</h4><div class="s">${esc(c.name)}</div>
    ${progressBar(c.progress_pct)}<div class="progress-label"><span>${c.progress_pct}% complete</span><span>${esc(c.instructor_name || 'Teacher TBC')}</span></div>
  </article>`;
}
function plainForm(id, endpoint, onDone) {
  const form = $(id); if (!form) return;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const body = {}; new FormData(form).forEach((v, k) => { body[k] = v === '' ? null : v; });
    const btn = form.querySelector('button[type=submit]'); btn.disabled = true;
    try { const d = await api(endpoint, { method: 'POST', body: JSON.stringify(body) }); form.reset(); onDone(d); }
    catch (err) { toast(err.message, 'err'); btn.disabled = false; }
  });
}

/* ------------------------- profile questionnaire ------------------------- */
function profileFields() {
  const p = ME.profile || {};
  const v = (k) => esc(p[k] || '');
  if (ME.role === 'instructor') {
    return `${fieldGrid(`
      <label class="field"><span>Highest degree</span><input name="highest_degree" value="${v('highest_degree')}" placeholder="e.g. MS Computer Science"></label>
      <label class="field"><span>University</span><input name="university" value="${v('university')}"></label>
      <label class="field"><span>Specialization</span><input name="specialization" value="${v('specialization')}" placeholder="e.g. Machine Learning"></label>
      <label class="field"><span>Years of experience</span><input name="experience_years" type="number" value="${v('experience_years')}"></label>
      <label class="field"><span>Current role</span><input name="current_role" value="${v('current_role')}"></label>
      <label class="field"><span>Organization</span><input name="organization" value="${v('organization')}"></label>
      <label class="field full"><span>LinkedIn (optional)</span><input name="linkedin" value="${v('linkedin')}"></label>
      <label class="field full"><span>Short bio (shown to your students)</span><textarea name="bio">${v('bio')}</textarea></label>`)}`;
  }
  return `${fieldGrid(`
    <label class="field"><span>I am a</span><select name="status"><option ${p.status==='Student'?'selected':''}>Student</option><option ${p.status==='Working professional'?'selected':''}>Working professional</option></select></label>
    <label class="field"><span>Age</span><input name="age" type="number" value="${v('age')}"></label>
    <label class="field"><span>Highest degree</span><input name="highest_degree" value="${v('highest_degree')}" placeholder="e.g. BS Software Engineering"></label>
    <label class="field"><span>University</span><input name="university" value="${v('university')}"></label>
    <label class="field"><span>Field of study</span><input name="field" value="${v('field')}"></label>
    <label class="field"><span>Organization (if working)</span><input name="organization" value="${v('organization')}"></label>
    <label class="field"><span>City</span><input name="city" value="${v('city')}"></label>
    <label class="field full"><span>Your goal with this course</span><textarea name="goal">${v('goal')}</textarea></label>`)}`;
}
function openProfileForm() {
  openModal('Complete your profile', `<p style="margin:-4px 0 14px;color:var(--muted);font-size:13.5px">This helps your teachers support you better. You can edit it anytime from Profile.</p>
    <form id="modalForm">${profileFields()}<button class="btn btn-primary btn-block" type="submit">Save profile</button>
    <button class="btn btn-ghost btn-block" type="button" style="margin-top:8px" onclick="closeModal()">Skip for now</button></form>`);
  bindModalForm({ endpoint: '/api/me/profile', onSuccess: (d) => { ME = d.user; closeModal(); toast('Profile saved.'); if ($('view-profile').classList.contains('active')) renderProfile(); } });
}
function renderProfile() {
  const el = $('view-profile'); const p = ME.profile || {};
  const rows = Object.keys(p).length ? Object.entries(p).map(([k, val]) => `<div class="kv"><span class="k">${esc(k.replace(/_/g, ' '))}</span><span>${esc(val)}</span></div>`).join('') : '<div class="s" style="color:var(--muted)">No profile details yet.</div>';
  el.innerHTML = `
    <div class="card" style="max-width:620px"><div class="card-head"><h3>Your account</h3><span class="role-pill">${roleLabel(ME.role)}</span></div>
      <div class="card-body"><p style="margin:0 0 4px"><strong>${esc(ME.name)}</strong></p>
      <p style="margin:0 0 2px;color:var(--muted)">Username: ${esc(ME.username || '—')}</p>
      <p style="margin:0;color:var(--muted)">${esc(ME.email || 'No email on file')}</p></div></div>
    <div class="card" style="max-width:620px"><div class="card-head"><h3>Profile details</h3><button class="btn btn-ghost btn-sm" onclick="openProfileForm()">Edit</button></div>
      <div class="card-body">${rows}</div></div>
    <div class="card" style="max-width:620px"><div class="card-head"><h3>Change password</h3></div>
      <div class="card-body"><form id="pwForm">
        <label class="field"><span>Current password</span><input name="current" type="password" required></label>
        <label class="field"><span>New password</span><input name="next" type="password" required placeholder="At least 8 characters"></label>
        <button class="btn btn-primary" type="submit">Update password</button></form></div></div>`;
  $('pwForm').addEventListener('submit', async (e) => {
    e.preventDefault(); const f = e.target; const btn = f.querySelector('button'); btn.disabled = true;
    try { await api('/api/me/password', { method: 'POST', body: JSON.stringify({ current: f.current.value, next: f.next.value }) }); toast('Password updated.'); f.reset(); }
    catch (err) { toast(err.message, 'err'); } finally { btn.disabled = false; }
  });
}

/* ------------------------- course detail ------------------------- */
async function openCourse(id) {
  try { COURSE = await api('/api/courses/' + id); COURSE._report = null; TAB = 'schedule'; show('course'); $('pageTitle').textContent = COURSE.course.course_title; renderCourse(); }
  catch (e) { toast(e.message, 'err'); }
}
async function refreshCourse() { if (!COURSE) return; const id = COURSE.course.id; COURSE = await api('/api/courses/' + id); COURSE._report = null; renderCourse(); }
function setTab(t) { TAB = t; renderCourse(); }

function renderCourse() {
  const el = $('view-course'); const c = COURSE.course; const manage = COURSE.can_manage; const admin = ME.role === 'admin';
  const tabs = ['schedule', 'content', 'assignments']; if (manage) { tabs.push('people'); tabs.push('progress'); } tabs.push('announcements');
  const tabLabel = { schedule: 'Schedule', content: 'Content', assignments: 'Assignments', people: 'People', progress: 'Progress', announcements: 'Announcements' };
  const actions = [];
  if (manage) {
    actions.push(`<a onclick="actScheduleClass()">Schedule a class</a>`);
    actions.push(`<a onclick="actAddContent()">Add content / file</a>`);
    actions.push(`<a onclick="actAddAssignment()">Add an assignment</a>`);
    actions.push(`<a onclick="actAnnounce()">Post an announcement</a>`);
  }
  if (admin) {
    actions.push(`<a onclick="actAddStudents()">Add students</a>`);
    actions.push(`<a onclick="actAssignTeacher()">Assign / change teacher</a>`);
    actions.push(`<a href="/api/admin/export/course/${c.id}/students.csv">Export students (CSV)</a>`);
    actions.push(`<a class="danger" onclick="deleteCourse()">Delete this course</a>`);
  }
  const teacherAbout = (ME.role === 'student' && COURSE.teacher_profile) ? teacherCard(COURSE.teacher_profile) : '';
  el.innerHTML = `
    <div class="course-head">
      <button class="btn btn-ghost btn-sm" onclick="show('courses')">&larr; Courses</button>
      <div class="course-head-main"><span class="tier-tag">${esc(c.tier || '')}</span>
        <h2>${esc(c.course_title)} <span class="role-pill">${esc(c.code)}</span></h2>
        <div class="course-meta">${esc(c.name)} &middot; ${esc(c.instructor_name || 'No teacher assigned')} &middot; ${c.enrolled} student(s) &middot; <span class="badge ${esc(c.status)}">${esc(c.status)}</span></div>
        ${progressBar(c.progress_pct)}<div class="progress-label"><span>${c.progress_pct}% complete (${c.sessions_done}/${c.sessions_total} classes)</span><span>${ME.role === 'student' ? gemChip(COURSE.my_gems) + ' of ' + COURSE.my_gems_possible : c.gems_possible + ' gems available'}</span></div>
      </div>
      ${actions.length ? `<div class="kebab"><button class="kebab-btn" onclick="this.nextElementSibling.classList.toggle('open')" aria-label="Course actions"><span></span><span></span><span></span></button><div class="kebab-menu">${actions.join('')}</div></div>` : ''}
    </div>
    ${teacherAbout}
    <div class="tabbar">${tabs.map((t) => `<button class="tab ${t === TAB ? 'active' : ''}" onclick="setTab('${t}')">${tabLabel[t]}</button>`).join('')}</div>
    <div id="tabPanel">${renderTab()}</div>`;
  if (TAB === 'assignments' && ME.role === 'student') wireStudentSubmit();
  if (TAB === 'progress') loadReport();
}

function renderTab() {
  const manage = COURSE.can_manage; const admin = ME.role === 'admin';
  if (TAB === 'schedule') return card('Live classes', COURSE.sessions.length ? COURSE.sessions.map(sessionRow).join('') : empty('No classes scheduled yet.'), true);
  if (TAB === 'content') {
    if (!COURSE.lessons.length) return card('Content', empty('No material posted yet.'), true);
    const weeks = {}; COURSE.lessons.forEach((l) => { (weeks[l.week_no || 0] = weeks[l.week_no || 0] || []).push(l); });
    const body = Object.keys(weeks).sort((a, z) => a - z).map((wk) => `<div class="lesson-week">Week ${wk}</div>${weeks[wk].map(lessonRow).join('')}`).join('');
    return card('Content', body, true);
  }
  if (TAB === 'assignments') return COURSE.assignments.length ? COURSE.assignments.map((a) => assignmentCard(a, manage)).join('') : card('Assignments', empty('No assignments yet.'), true);
  if (TAB === 'people') return renderPeople(admin);
  if (TAB === 'progress') return `<div id="reportPanel"><div class="empty">Loading progress</div></div>`;
  if (TAB === 'announcements') return card('Announcements', COURSE.announcements.length ? COURSE.announcements.map(annRow).join('') : empty('Nothing yet.'), true);
  return '';
}

function lessonRow(l) {
  const open = l.url && l.url !== '#';
  return `<div class="lesson"><span class="type">${esc(l.type)}</span><span class="t">${esc(l.title)}</span>
    ${open ? `<button class="btn btn-ghost btn-sm" onclick="openViewer('${esc(l.title)}','${esc(l.url)}')">View</button>` : '<span class="role-pill">Soon</span>'}
    ${COURSE.can_manage ? `<button class="btn btn-ghost btn-sm" onclick="deleteContent(${l.id})">Delete</button>` : ''}</div>`;
}

function renderPeople(admin) {
  const c = COURSE.course;
  const teacher = c.instructor_name
    ? `<div class="list-row"><div class="avatar" style="width:30px;height:30px;font-size:12px">${esc(c.instructor_name.charAt(0).toUpperCase())}</div>
        <div class="grow"><div class="t">${esc(c.instructor_name)}</div><div class="s">Teacher</div></div>
        ${admin ? `<button class="btn btn-ghost btn-sm" onclick="actAssignTeacher()">Change</button><button class="btn btn-ghost btn-sm" onclick="removeTeacher()">Remove</button>` : ''}</div>`
    : `<div class="list-row"><div class="grow"><div class="s">No teacher assigned</div></div>${admin ? `<button class="btn btn-accent btn-sm" onclick="actAssignTeacher()">Assign teacher</button>` : ''}</div>`;
  const students = COURSE.students.length ? COURSE.students.map((s) => `<div class="list-row">
      <div class="avatar" style="width:30px;height:30px;font-size:12px">${esc((s.name || '?').charAt(0).toUpperCase())}</div>
      <div class="grow"><div class="t">${esc(s.name)}</div><div class="s">${esc(s.username)}</div></div>
      ${admin ? `<button class="btn btn-ghost btn-sm" onclick="removeStudent(${s.id}, '${esc(s.name)}')">Remove</button>` : ''}</div>`).join('') : empty('No students enrolled yet.');
  return `<div class="card"><div class="card-head"><h3>Teacher</h3></div><div class="card-body tight">${teacher}</div></div>
    <div class="card"><div class="card-head"><h3>Students (${COURSE.students.length})</h3>${admin ? `<button class="btn btn-accent btn-sm" onclick="actAddStudents()">Add students</button>` : ''}</div>
      <div class="card-body tight">${students}</div></div>`;
}

function teacherCard(tp) {
  const p = tp.profile || {};
  const bits = [p.highest_degree, p.specialization, p.current_role, p.organization].filter(Boolean).join(' &middot; ');
  if (!p.bio && !bits) return '';
  return `<div class="card about-card"><div class="card-head"><h3>About your teacher</h3></div><div class="card-body">
    <p style="margin:0 0 4px"><strong>${esc(tp.name)}</strong></p>
    ${bits ? `<p style="margin:0 0 8px;color:var(--muted);font-size:13.5px">${bits}</p>` : ''}
    ${p.bio ? `<p style="margin:0">${esc(p.bio)}</p>` : ''}</div></div>`;
}

function assignmentCard(a, manage) {
  const due = a.due_date ? `Due ${fmtDate(a.due_date)}` : 'No due date';
  let footer = '';
  if (manage) {
    footer = `<div class="assign-foot"><span class="role-pill">${a.submission_count || 0} submission(s)</span><span class="gem">${GEM}${a.points}</span>
      <button class="btn btn-ghost btn-sm" onclick="viewSubmissions(${a.id})">View &amp; grade</button>
      <button class="btn btn-ghost btn-sm" onclick="deleteAssignment(${a.id})">Delete</button></div>`;
  } else {
    const sub = a.my_submission;
    let status = '<span class="role-pill">Not submitted</span>';
    if (sub && sub.graded) status = `<span class="badge open">Graded</span> ${gemChip(sub.gems)}${sub.remarks ? ` <span class="s" style="color:var(--muted)">&ldquo;${esc(sub.remarks)}&rdquo;</span>` : ''}`;
    else if (sub) status = `<span class="badge running">Submitted, awaiting grade</span>`;
    footer = `<div class="assign-foot">${status}
      ${sub && sub.file_url ? `<button class="btn btn-ghost btn-sm" onclick="openViewer('${esc(a.title)}','${esc(sub.file_url)}')">Your file</button>` : ''}
      <form class="submit-form" data-aid="${a.id}" style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
        <input type="file" name="file" required><button class="btn btn-accent btn-sm" type="submit">${sub ? 'Resubmit' : 'Submit'}</button></form></div>`;
  }
  return `<div class="card"><div class="card-body">
    <div style="display:flex;justify-content:space-between;gap:12px;align-items:baseline"><h3 style="font-size:17px">${esc(a.title)}</h3><span class="role-pill">${due}</span></div>
    ${a.description ? `<p style="color:var(--muted);font-size:14px;margin:8px 0 0">${esc(a.description)}</p>` : ''}
    ${a.file_url ? `<p style="margin:8px 0 0"><button class="btn btn-ghost btn-sm" onclick="openViewer('${esc(a.title)}','${esc(a.file_url)}')">Reference material</button></p>` : ''}
    ${footer}</div></div>`;
}
function wireStudentSubmit() {
  document.querySelectorAll('.submit-form').forEach((form) => form.addEventListener('submit', async (e) => {
    e.preventDefault(); const btn = form.querySelector('button'); btn.disabled = true;
    try { await apiForm('/api/assignments/' + form.dataset.aid + '/submit', new FormData(form)); toast('Assignment submitted.'); await refreshCourse(); }
    catch (err) { toast(err.message, 'err'); btn.disabled = false; }
  }));
}

/* --------------------------- grading modal --------------------------- */
async function viewSubmissions(aid) {
  try {
    const { assignment, submissions } = await api('/api/assignments/' + aid + '/submissions');
    const body = submissions.length ? submissions.map((s) => `
      <div class="grade-row" id="grade-${s.id}">
        <div class="top"><strong>${esc(s.student_name)}</strong><span class="s" style="color:var(--muted)">${esc((s.submitted_at || '').slice(0, 16))}</span>
          ${s.file_url ? `<button class="btn btn-ghost btn-sm" onclick="openViewer('${esc(s.student_name)}','${esc(s.file_url)}')">View</button><a class="btn btn-ghost btn-sm" href="${esc(s.file_url)}" download target="_blank" rel="noopener">Download</a>` : '<span class="role-pill">No file</span>'}</div>
        ${s.note ? `<div class="s" style="color:var(--muted)">Note: ${esc(s.note)}</div>` : ''}
        <div class="grade-inputs">
          <input type="number" min="0" max="100" placeholder="Grade %" value="${s.grade != null ? s.grade : ''}" id="g-${s.id}">
          <input type="text" placeholder="Remarks" value="${esc(s.remarks || '')}" id="r-${s.id}">
          <button class="btn btn-primary btn-sm" onclick="saveGrade(${s.id})">Save</button>
          <span class="gem">${GEM}<span id="gem-${s.id}">${s.gems || 0}</span></span>
        </div></div>`).join('') : empty('No submissions yet.');
    openModal('Submissions: ' + assignment.title + ' (out of ' + assignment.points + ' gems)', body);
  } catch (e) { toast(e.message, 'err'); }
}
async function saveGrade(sid) {
  const grade = $('g-' + sid).value; const remarks = $('r-' + sid).value;
  try { const d = await api('/api/submissions/' + sid + '/grade', { method: 'POST', body: JSON.stringify({ grade, remarks }) });
    $('gem-' + sid).textContent = d.submission.gems; toast('Grade saved.'); COURSE._report = null; }
  catch (e) { toast(e.message, 'err'); }
}

/* --------------------------- progress report --------------------------- */
async function loadReport() {
  const panel = $('reportPanel'); if (!panel) return;
  try {
    if (!COURSE._report) COURSE._report = await api('/api/courses/' + COURSE.course.id + '/report');
    const r = COURSE._report; const admin = ME.role === 'admin'; const cid = COURSE.course.id;
    panel.innerHTML = `
      <div class="stat-grid">
        <div class="stat-card"><div class="n">${r.students.length}</div><div class="l">Students</div></div>
        <div class="stat-card"><div class="n">${r.complete_students}</div><div class="l">Completed all tasks</div></div>
        <div class="stat-card"><div class="n">${r.assignments_total}</div><div class="l">Assignments</div></div>
        <div class="stat-card"><div class="n">${r.progress_pct}%</div><div class="l">Course progress</div></div>
      </div>
      ${admin ? `<div class="card"><div class="card-body"><div class="export-row">
        <a class="btn btn-ghost btn-sm" href="/api/admin/export/course/${cid}/students.csv">Export all students (CSV)</a>
        <a class="btn btn-ghost btn-sm" href="/api/admin/export/course/${cid}/completed.csv">Export completed students (CSV)</a>
      </div></div></div>` : ''}
      <div class="card"><div class="card-head"><h3>Student progress</h3></div><div class="card-body tight">
        ${r.students.length ? r.students.map((s) => `<div class="list-row">
          <div class="grow"><div class="t">${esc(s.name)} ${s.complete ? '<span class="badge open">Complete</span>' : ''}</div>
            <div class="s">${s.submitted}/${s.total} submitted &middot; ${s.graded} graded${s.avg_grade != null ? ' &middot; avg ' + s.avg_grade + '%' : ''}${s.last_remark ? ' &middot; &ldquo;' + esc(s.last_remark) + '&rdquo;' : ''}</div></div>
          ${gemChip(s.gems)}</div>`).join('') : empty('No students enrolled yet.')}
      </div></div>`;
  } catch (e) { panel.innerHTML = card('Progress', empty(e.message)); }
}

/* ------------------------- management actions ------------------------- */
function actScheduleClass() {
  openModal('Schedule a class', `<form id="modalForm">${fieldGrid(`
    <label class="field full"><span>Title</span><input name="title" required placeholder="e.g. Week 1: Kickoff"></label>
    <label class="field"><span>Week</span><input name="week_no" type="number"></label>
    <label class="field"><span>Date</span><input name="session_date" type="date"></label>
    <label class="field"><span>Start</span><input name="start_time" type="time"></label>
    <label class="field"><span>End</span><input name="end_time" type="time"></label>
    <label class="field full"><span>Join link</span><input name="join_url" placeholder="Zoom or Google Meet URL"></label>`)}${submitRow('Schedule class')}</form>`);
  bindModalForm({ endpoint: `/api/courses/${COURSE.course.id}/sessions`, onSuccess: () => { closeModal(); toast('Class scheduled.'); refreshCourse(); } });
}
function actAddContent() {
  openModal('Add content', `<form id="modalForm">${fieldGrid(`
    <label class="field"><span>Type</span><select name="type"><option>slides</option><option>reading</option><option>notebook</option><option>video</option><option>assignment</option></select></label>
    <label class="field"><span>Week</span><input name="week_no" type="number"></label>
    <label class="field full"><span>Title</span><input name="title" required></label>
    <label class="field full"><span>Upload file (optional)</span><input name="file" type="file"></label>
    <label class="field full"><span>Or paste a link</span><input name="url" placeholder="https://..."></label>`)}${submitRow('Add content')}</form>`);
  bindModalForm({ endpoint: `/api/courses/${COURSE.course.id}/lessons`, multipart: true, onSuccess: () => { closeModal(); toast('Content added.'); refreshCourse(); } });
}
function actAddAssignment() {
  openModal('Add an assignment', `<form id="modalForm">${fieldGrid(`
    <label class="field full"><span>Title</span><input name="title" required></label>
    <label class="field full"><span>Instructions</span><textarea name="description"></textarea></label>
    <label class="field"><span>Due date</span><input name="due_date" type="date"></label>
    <label class="field"><span>Points (gems)</span><input name="points" type="number" value="100" min="1"></label>
    <label class="field full"><span>Reference file (optional)</span><input name="file" type="file"></label>`)}${submitRow('Create assignment')}</form>`);
  bindModalForm({ endpoint: `/api/courses/${COURSE.course.id}/assignments`, multipart: true, onSuccess: () => { closeModal(); toast('Assignment created.'); refreshCourse(); } });
}
function actAnnounce() {
  openModal('Post an announcement', `<p style="margin:-4px 0 14px;color:var(--muted);font-size:13.5px">Everyone on this course with an email on file is notified.</p>
    <form id="modalForm"><label class="field"><span>Title</span><input name="title" required></label>
    <label class="field"><span>Message</span><textarea name="body" required></textarea></label>${submitRow('Post announcement')}</form>`);
  bindModalForm({ endpoint: `/api/courses/${COURSE.course.id}/announcements`, onSuccess: (d) => { closeModal(); toast('Posted' + (d.notified ? ` and emailed ${d.notified}` : '') + '.'); refreshCourse(); } });
}
function actAddStudents() {
  openModal('Add students', `<p style="margin:-4px 0 14px;color:var(--muted);font-size:13.5px">One full name per line. Each gets a unique username and password, enrolled here.</p>
    <form id="modalForm"><label class="field"><span>Student names</span><textarea name="names" required rows="5" placeholder="Bilal Noor&#10;Sara Khan"></textarea></label>${submitRow('Create and enrol')}</form>`);
  bindModalForm({ endpoint: `/api/courses/${COURSE.course.id}/students`, onSuccess: (d) => { showCredentials('Student logins created', d.created); refreshCourse(); } });
}
function actAssignTeacher() {
  api('/api/admin/teachers').then(({ teachers }) => {
    const opts = '<option value="">— Create a new teacher below —</option>' + teachers.map((t) => `<option value="${t.id}">${esc(t.name)}</option>`).join('');
    openModal('Assign / change teacher', `<form id="modalForm">
      <label class="field"><span>Choose an existing teacher</span><select name="instructor_id">${opts}</select></label>
      <div style="text-align:center;color:var(--muted-2);font-size:12px;margin:6px 0 12px">or</div>
      <label class="field"><span>Create a new teacher (name)</span><input name="name" placeholder="e.g. Hira Tariq"></label>
      <label class="field"><span>Their email (optional)</span><input name="email" type="email"></label>${submitRow('Assign teacher')}</form>`);
    bindModalForm({ endpoint: `/api/courses/${COURSE.course.id}/teacher`, onSuccess: (d) => { if (d.created) showCredentials('Teacher login created', [d.created]); else { closeModal(); toast('Teacher assigned.'); } refreshCourse(); } });
  });
}
function removeTeacher() { if (!confirm('Remove the teacher from this course?')) return; api(`/api/courses/${COURSE.course.id}/remove-teacher`, { method: 'POST', body: '{}' }).then(() => { toast('Teacher removed.'); refreshCourse(); }).catch((e) => toast(e.message, 'err')); }
function removeStudent(uid, name) { if (!confirm('Remove ' + name + ' from this course?')) return; api(`/api/courses/${COURSE.course.id}/remove-student`, { method: 'POST', body: JSON.stringify({ user_id: uid }) }).then(() => { toast('Student removed.'); refreshCourse(); }).catch((e) => toast(e.message, 'err')); }
function deleteContent(id) { if (!confirm('Delete this content item?')) return; api(`/api/courses/${COURSE.course.id}/lessons/${id}/delete`, { method: 'POST', body: '{}' }).then(() => { toast('Deleted.'); refreshCourse(); }).catch((e) => toast(e.message, 'err')); }
function deleteAssignment(id) { if (!confirm('Delete this assignment and all its submissions?')) return; api(`/api/courses/${COURSE.course.id}/assignments/${id}/delete`, { method: 'POST', body: '{}' }).then(() => { toast('Deleted.'); refreshCourse(); }).catch((e) => toast(e.message, 'err')); }
function deleteCourse() {
  const c = COURSE.course;
  if (!confirm('Delete "' + c.course_title + ' (' + c.code + ')" and ALL its classes, content, assignments and submissions? This cannot be undone.')) return;
  api(`/api/admin/courses/${c.id}/delete`, { method: 'POST', body: '{}' }).then(() => { toast('Course deleted.'); show('courses'); }).catch((e) => toast(e.message, 'err'));
}

/* --------------------------- credentials --------------------------- */
function showCredentials(title, list) {
  const rows = list.map((u) => `<tr><td>${esc(u.name)}</td><td><code>${esc(u.username)}</code></td><td><code>${esc(u.password)}</code></td></tr>`).join('');
  $('modalTitle').textContent = title; modalMsg('Copy these now - passwords are shown only once.', 'ok');
  $('modalBody').innerHTML = `<table class="cred-table"><thead><tr><th>Name</th><th>Username</th><th>Password</th></tr></thead><tbody>${rows}</tbody></table>
    <button class="btn btn-primary btn-block" style="margin-top:16px" onclick="copyCreds(this)" data-creds="${esc(JSON.stringify(list))}">Copy all</button>
    <button class="btn btn-ghost btn-block" style="margin-top:8px" onclick="closeModal()">Done</button>`;
}
function copyCreds(btn) {
  const list = JSON.parse(btn.dataset.creds);
  const text = 'Name\tUsername\tPassword\n' + list.map((u) => `${u.name}\t${u.username}\t${u.password}`).join('\n');
  navigator.clipboard.writeText(text).then(() => toast('Copied to clipboard.')).catch(() => toast('Copy failed; select manually.', 'err'));
}

/* ----------------------------- partials ----------------------------- */
function card(title, body, tight) { return `<div class="card">${title ? `<div class="card-head"><h3>${esc(title)}</h3></div>` : ''}<div class="card-body ${tight ? 'tight' : ''}">${body}</div></div>`; }
const empty = (t) => `<div class="empty">${esc(t)}</div>`;
function sessionRow(s) {
  return `<div class="list-row"><div class="when">${fmtDate(s.session_date)}<small>${fmtTime(s.start_time)}${s.end_time ? '–' + fmtTime(s.end_time) : ''}</small></div>
    <div class="grow"><div class="t">${esc(s.title)}</div><div class="s">${esc(s.course_title || '')}${s.week_no ? ' &middot; Week ' + s.week_no : ''}</div></div>
    ${s.join_url ? `<a class="btn btn-ghost btn-sm" href="${esc(s.join_url)}" target="_blank" rel="noopener">Join</a>` : ''}</div>`;
}
function annRow(a) { return `<div class="ann"><div class="h"><span class="t">${esc(a.title)}</span><span class="m">${esc(a.author_name || 'EchoLens')} &middot; ${esc((a.created_at || '').slice(0, 10))}</span></div><div class="b">${esc(a.body)}</div></div>`; }
