'use strict';

/* EchoLens LMS v4 - dashboard logic (all roles) */

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const STAGE_COLORS = { spark: '#F59E0B', glow: '#14B8A6', beam: '#38BDF8', prism: '#8B5CF6', aurora: '#10B981', nova: '#F0A82A' };

let ME = null;
let CURRENT_BATCH = null;

/* ------------------------------ helpers ------------------------------ */
async function api(path, opts = {}) {
  const isForm = opts.body instanceof FormData;
  const res = await fetch(path, {
    credentials: 'same-origin',
    headers: isForm ? {} : { 'Content-Type': 'application/json' },
    ...opts,
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401) { location.href = '/'; throw new Error('Signed out.'); }
  if (!res.ok) throw new Error(data.error || 'Something went wrong.');
  return data;
}
function toast(text, isErr) {
  const t = $('toast');
  t.textContent = text; t.className = 'toast show' + (isErr ? ' err' : '');
  clearTimeout(t._h); t._h = setTimeout(() => (t.className = 'toast'), 2600);
}
function roleLabel(r) { return { admin: 'Admin', instructor: 'Teacher', coordinator: 'Coordinator', student: 'Student', free: 'Free tier' }[r] || r; }
function isStaff() { return ['admin', 'coordinator', 'instructor'].includes(ME.role); }
function fmtDate(d) {
  if (!d) return '—';
  try { return new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }); } catch { return d; }
}
function gemIcon(color = 'url(#gemGrad)') {
  return `<svg viewBox="0 0 100 100" aria-hidden="true"><defs><linearGradient id="gemGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0FBFA8"/><stop offset=".55" stop-color="#38BDF8"/><stop offset="1" stop-color="#7C6CF5"/></linearGradient></defs><polygon points="50,4 90,34 74,92 26,92 10,34" fill="${color}"/><polygon points="50,4 90,34 50,50" fill="#fff" opacity=".25"/><polygon points="10,34 50,50 26,92" fill="#000" opacity=".12"/></svg>`;
}
function gemChip(n) { return `<span class="gem-chip">${gemIcon()}${n}</span>`; }
function stagePill(stage) { return `<span class="stage-pill stage-${esc(stage.key)}">${esc(stage.name)}</span>`; }
function prismGem(key, size = 84) {
  const c = STAGE_COLORS[key] || '#0FBFA8';
  return `<svg class="prism-gem" width="${size}" height="${size}" viewBox="0 0 100 100" aria-hidden="true">
    <polygon points="50,4 90,34 74,92 26,92 10,34" fill="${c}" opacity=".95"/>
    <polygon points="50,4 90,34 50,50" fill="#fff" opacity=".28"/>
    <polygon points="10,34 50,50 26,92" fill="#000" opacity=".14"/>
    <polygon points="50,4 50,50 10,34" fill="#fff" opacity=".12"/></svg>`;
}

/* ------------------------------ modal ------------------------------ */
function openModal(title, bodyHTML) {
  $('modalTitle').textContent = title;
  $('modalBody').innerHTML = bodyHTML;
  modalMsg('');
  $('modal').classList.add('open');
}
function closeModal() { $('modal').classList.remove('open'); }
function modalMsg(text, ok) {
  const el = $('modalMsg');
  if (!text) { el.className = 'form-msg'; el.textContent = ''; return; }
  el.className = 'form-msg ' + (ok ? 'ok' : 'err'); el.textContent = text;
}
$('modal').addEventListener('click', (e) => { if (e.target === $('modal')) closeModal(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });
document.addEventListener('click', (e) => {
  document.querySelectorAll('.dd-menu.open').forEach((m) => { if (!m.parentElement.contains(e.target)) m.classList.remove('open'); });
});

/* ------------------------------ navigation ------------------------------ */
const TITLES = {
  overview: 'Overview', courses: 'My courses', course: 'Course', schedule: 'Schedule',
  leaderboard: 'Leaderboard', announcements: 'Announcements', profile: 'Profile',
  challenges: 'Challenges', copilot: 'AI Copilot', hackathons: 'Hackathons',
  'admin-catalogue': 'Catalogue & new course', 'admin-users': 'People',
};
function show(view) {
  document.querySelectorAll('.view').forEach((v) => v.classList.remove('active'));
  $(`view-${view}`).classList.add('active');
  document.querySelectorAll('.nav-item').forEach((n) => n.classList.toggle('active', n.dataset.view === view));
  $('pageTitle').textContent = TITLES[view] || 'EchoLens';
  $('sidebar').classList.remove('open');
  const render = {
    overview: renderOverview, courses: renderCourses, schedule: renderSchedule,
    leaderboard: renderLeaderboard, announcements: renderAnnouncements, profile: renderProfile,
    challenges: renderChallenges, copilot: renderCopilot, hackathons: renderHackathons,
    'admin-catalogue': renderCatalogue, 'admin-users': renderUsers,
  }[view];
  if (render) render();
}
document.querySelectorAll('.nav-item[data-view]').forEach((n) => n.addEventListener('click', () => show(n.dataset.view)));
async function logout() { try { await api('/api/auth/logout', { method: 'POST' }); } catch {} location.href = '/'; }

/* ------------------------------ boot ------------------------------ */
(async () => {
  try {
    ME = await api('/api/auth/me');
  } catch { return; }
  $('userName').textContent = ME.name;
  $('rolePill').textContent = roleLabel(ME.role);
  $('avatar').textContent = (ME.name || 'E').trim()[0].toUpperCase();
  if (ME.role === 'admin') document.querySelectorAll('.admin-only').forEach((el) => (el.style.display = ''));
  if (['admin', 'coordinator'].includes(ME.role)) document.querySelectorAll('.staff-only').forEach((el) => (el.style.display = ''));
  if (ME.ai_enabled) document.querySelectorAll('.teacher-only').forEach((el) => (el.style.display = ''));
  if (ME.role === 'free') ['courses', 'schedule', 'announcements'].forEach((v) => { const n = document.querySelector(`.nav-item[data-view="${v}"]`); if (n) n.style.display = 'none'; });
  if (ME.gamify && ME.gamify.streak > 0) {
    $('topStreak').style.display = '';
    $('topStreak').innerHTML = `&#128293; ${ME.gamify.streak}-day streak`;
  }
  $('gate').style.display = 'none';
  $('app').style.display = '';
  renderOverview();
})();

/* ============================== OVERVIEW ============================== */
async function renderOverview() {
  const el = $('view-overview');
  el.innerHTML = '<div class="empty">Loading&hellip;</div>';
  const d = await api('/api/overview');

  let top = '';
  if (ME.role === 'student' && d.gamify) top = prismCard(d.gamify);
  if (ME.role === 'free' && d.gamify) {
    top = prismCard(d.gamify) + `
    <div class="card"><div class="card-body" style="display:flex;gap:14px;align-items:center;flex-wrap:wrap">
      <div style="flex:1;min-width:220px">
        <strong>You're on the free tier.</strong>
        <div class="s" style="color:var(--muted)">${d.free.open_challenges} open challenge${d.free.open_challenges === 1 ? '' : 's'} &middot; ${d.free.solved} solved by you. Earn gems, climb stages, share your profile. Want full courses, live classes, and teacher feedback? <a href="mailto:echolens816@gmail.com">Ask about the portal</a>.</div>
      </div>
      <button class="btn btn-teal" onclick="show('challenges')">Open challenges</button>
    </div></div>`;
  }
  if ((ME.role === 'admin' || ME.role === 'coordinator') && d.admin) {
    const a = d.admin;
    top = `<div class="stat-grid">
      ${stat(a.students, 'Students')}${stat(a.teachers, 'Teachers')}${stat(a.running_courses, 'Running courses')}
      ${stat(a.submissions, 'Submissions')}${stat(a.graded, 'Graded')}${stat(a.total_gems, 'Gems earned')}
      ${stat(a.free_users || 0, 'Free-tier users')}
    </div>
    ${ME.role === 'admin' ? `<div class="card"><div class="card-body" style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
      <span class="s" style="color:var(--muted)">The database backs itself up every 12 hours on the server disk. Download a copy off-server regularly.</span>
      <span style="flex:1"></span>
      <a class="btn btn-ghost btn-sm" href="/api/admin/backup">Download backup</a>
      ${(a.pending_challenge_reviews || 0) ? `<button class="btn btn-teal btn-sm" onclick="show('challenges')">${a.pending_challenge_reviews} challenge review${a.pending_challenge_reviews === 1 ? '' : 's'} waiting</button>` : ''}
    </div></div>` : ''}`;
    if (ME.role === 'coordinator') top = `<div class="card"><div class="card-body" style="font-size:13.5px;color:var(--muted)">You have view-only access: track progress across every course, but adding, editing, or grading is reserved for teachers and admins.</div></div>` + top;
  }
  if (ME.role === 'instructor' && d.teaching) {
    top = `<div class="stat-grid">
      ${stat(d.courses.length, 'Courses you teach')}
      ${stat(d.teaching.pending_to_grade, 'Submissions waiting for grades')}
      ${stat(d.upcoming.length, 'Upcoming classes')}
    </div>`;
  }

  el.innerHTML = `
    ${top}
    <div style="display:grid;grid-template-columns:1.6fr 1fr;gap:20px;align-items:start" class="ovr-grid">
      <div>
        <div class="card"><div class="card-head"><h3>Upcoming classes</h3><button class="btn btn-ghost btn-sm" onclick="show('schedule')">Full schedule</button></div>
          <div class="card-body tight">${d.upcoming.length ? d.upcoming.map(sessionRow).join('') : '<div class="empty">No upcoming classes scheduled yet.</div>'}</div></div>
        <div class="card"><div class="card-head"><h3>Latest announcements</h3><button class="btn btn-ghost btn-sm" onclick="show('announcements')">All</button></div>
          <div class="card-body tight">${d.announcements.length ? d.announcements.map(annRow).join('') : '<div class="empty">Nothing yet.</div>'}</div></div>
      </div>
      <div>
        <div class="card"><div class="card-head"><h3>Top learners</h3></div>
          <div class="card-body tight">${(d.leaderboard || []).slice(0, 8).map(lbRow).join('') || '<div class="empty">No gems earned yet.</div>'}</div></div>
        ${ME.role === 'student' && d.gamify ? badgesCard(d.gamify) : ''}
      </div>
    </div>
    <style>@media (max-width:900px){.ovr-grid{grid-template-columns:1fr !important}}</style>`;
  requestAnimationFrame(() => { const f = el.querySelector('.prism-fill'); if (f) f.style.width = f.dataset.w + '%'; });
}
function stat(n, l) { return `<div class="stat-card"><div class="n">${n ?? 0}</div><div class="l">${l}</div></div>`; }
function prismCard(g) {
  const s = g.stage;
  return `<div class="prism-card"><div class="prism-inner">
    ${prismGem(s.key)}
    <div class="prism-main">
      <div class="prism-eyebrow">Your stage</div>
      <div class="prism-stage">${esc(s.name)}</div>
      <div class="prism-sub">${s.next ? `${s.to_next} gems to reach <strong style="color:#fff">${esc(s.next.name)}</strong>` : 'Highest stage reached - keep shining'}</div>
      <div class="prism-bar"><div class="prism-fill" data-w="${s.progress}"></div></div>
    </div>
    <div class="prism-side">
      <div class="prism-stat"><div class="n">${g.gems}</div><div class="l">Gems</div></div>
      <div class="prism-stat"><div class="n">${g.streak}</div><div class="l">Day streak</div></div>
      <div class="prism-stat"><div class="n">${g.best_streak}</div><div class="l">Best streak</div></div>
    </div>
  </div></div>`;
}
function badgesCard(g) {
  return `<div class="card"><div class="card-head"><h3>Badges</h3>
      <button class="btn btn-ghost btn-sm" onclick="sharePublicProfile()">Share profile</button></div>
    <div class="card-body"><div class="badge-grid">${g.badges.map((b) => `<span class="badge ${esc(b.kind)}"><span class="bd"></span>${esc(b.label)}</span>`).join('') || '<span class="s" style="color:var(--muted)">Earn gems to unlock badges.</span>'}</div></div></div>`;
}
function sharePublicProfile() {
  const url = `${location.origin}/u/${ME.reg_no}`;
  navigator.clipboard?.writeText(url).then(() => toast('Public profile link copied - share it anywhere.'), () => {});
  window.open(url, '_blank');
}
function sessionRow(s) {
  return `<div class="list-row">
    <div class="when">${fmtDate(s.session_date)}<small>${esc(s.start_time || '')}${s.end_time ? '&ndash;' + esc(s.end_time) : ''}</small></div>
    <div class="grow"><div class="t">${esc(s.title)}</div><div class="s">${esc(s.course_title || '')} ${s.batch_name ? '&middot; ' + esc(s.batch_name) : ''}</div></div>
    ${s.join_url ? `<a class="btn btn-teal btn-sm" href="${esc(s.join_url)}" target="_blank" rel="noopener">Join</a>` : ''}</div>`;
}
function annRow(a) {
  return `<div class="list-row"><div class="grow">
    <div class="t">${esc(a.title)}</div>
    <div class="s">${esc(a.body).slice(0, 140)}${a.body.length > 140 ? '&hellip;' : ''}</div>
    <div class="s" style="margin-top:3px;color:var(--muted-2)">${esc(a.author_name)} &middot; ${esc((a.created_at || '').slice(0, 10))}${a.course_title ? ' &middot; ' + esc(a.course_title) : ''}</div>
  </div></div>`;
}
function lbRow(r, i) {
  return `<div class="lb-row top${i + 1}">
    <div class="lb-rank">${i + 1}</div>
    <div class="lb-name">${esc(r.name)}<small>${r.streak ? `&#128293; ${r.streak}d streak &middot; ` : ''}${esc(r.stage.name)}</small></div>
    ${gemChip(r.gems)}</div>`;
}

/* ============================== COURSES ============================== */
async function renderCourses() {
  const el = $('view-courses');
  el.innerHTML = '<div class="empty">Loading&hellip;</div>';
  const d = await api('/api/overview');
  if (!d.courses.length) { el.innerHTML = '<div class="card"><div class="empty">No courses yet. ' + (ME.role === 'admin' ? 'Start one from Catalogue &amp; new course.' : 'You will see your courses here once you are enrolled.') + '</div></div>'; return; }
  el.innerHTML = `<div class="course-grid">${d.courses.map((b) => `
    <div class="course-card" onclick="openCourse(${b.id})">
      <div class="course-band"></div>
      <div class="cc-body">
        <div class="tier">${esc(b.tier || 'Course')} &middot; ${esc(b.code)}</div>
        <h4>${esc(b.title || b.name)}</h4>
        <div class="s" style="color:var(--muted)">${esc(b.name)} &middot; starts ${fmtDate(b.start_date)}</div>
        <div class="meta">
          <span>${b.students} student${b.students === 1 ? '' : 's'}</span>
          <span>${b.teacher_names ? 'Taught by ' + esc(b.teacher_names) : 'No teacher yet'}</span>
          <span>${gemChip(b.gems_possible)} possible</span>
        </div>
      </div>
    </div>`).join('')}</div>`;
}

/* ============================ COURSE DETAIL ============================ */
async function openCourse(id) {
  document.querySelectorAll('.view').forEach((v) => v.classList.remove('active'));
  $('view-course').classList.add('active');
  $('pageTitle').textContent = 'Course';
  $('view-course').innerHTML = '<div class="empty">Loading&hellip;</div>';
  const d = await api(`/api/batches/${id}`);
  CURRENT_BATCH = d;
  const b = d.batch;
  const canManage = d.can_manage;
  const isAdmin = ME.role === 'admin';

  const menu = [];
  if (canManage) {
    menu.push(`<button onclick="formSession()">Schedule a class</button>`);
    menu.push(`<button onclick="formLesson()">Add content</button>`);
    menu.push(`<button onclick="formAssignment()">Add assignment</button>`);
    menu.push(`<button onclick="formAnnouncement()">Post announcement</button>`);
    menu.push(`<button onclick="formAward()">Award bonus gems</button>`);
  }
  if (isAdmin) {
    menu.push(`<button onclick="formStudents()">Add students</button>`);
    menu.push(`<button onclick="formTeacher()">Add a teacher</button>`);
    menu.push(`<button class="danger" onclick="deleteBatch()">Delete this course</button>`);
  }

  const tabs = ['Quest', 'Classes', 'Content', 'Assignments', 'Leaderboard'];
  if (isStaff()) tabs.push('People', 'Report');

  $('view-course').innerHTML = `
    <button class="btn btn-ghost btn-sm" onclick="show('courses')" style="margin-bottom:14px">&larr; All courses</button>
    <div class="course-head">
      <div class="course-head-main">
        <div class="tier" style="font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--teal-deep)">${esc(b.tier || 'Course')} &middot; ${esc(b.code)}</div>
        <h2>${esc(b.title || b.name)}</h2>
        <div class="s" style="color:var(--muted)">${esc(b.name)} &middot; starts ${fmtDate(b.start_date)} &middot; ${b.teacher_names ? 'Taught by ' + esc(b.teacher_names) : 'No teacher assigned yet'}</div>
        ${ME.role === 'student' ? `<div style="margin-top:9px">${gemChip(d.my_gems_here)} <span class="s" style="color:var(--muted)">earned here of ${b.gems_possible} possible</span></div>` : ''}
      </div>
      ${menu.length ? `<div class="dd"><button class="btn btn-ghost" onclick="this.nextElementSibling.classList.toggle('open')">Manage &#8942;</button>
        <div class="dd-menu">${menu.join('')}</div></div>` : ''}
    </div>
    <div class="tabs">${tabs.map((t, i) => `<div class="tab${i === 0 ? ' active' : ''}" data-tab="${t}" onclick="courseTab(this)">${t}</div>`).join('')}</div>
    <div id="courseTabBody"></div>`;
  drawCourseTab('Quest');
}
function courseTab(el) {
  document.querySelectorAll('.tab').forEach((t) => t.classList.remove('active'));
  el.classList.add('active');
  drawCourseTab(el.dataset.tab);
}
function drawCourseTab(tab) {
  const d = CURRENT_BATCH; const body = $('courseTabBody');
  const canManage = d.can_manage;

  if (tab === 'Quest') { renderQuestTab(body); return; }

  if (tab === 'Classes') {
    body.innerHTML = `<div class="card"><div class="card-body tight">
      ${d.sessions.length ? d.sessions.map((s) => `
        <div class="list-row">
          <div class="when">${fmtDate(s.session_date)}<small>${esc(s.start_time || '')}${s.end_time ? '&ndash;' + esc(s.end_time) : ''}</small></div>
          <div class="grow"><div class="t">${s.week_no ? `Week ${s.week_no}: ` : ''}${esc(s.title)}</div></div>
          ${s.join_url ? `<a class="btn btn-teal btn-sm" href="${esc(s.join_url)}" target="_blank" rel="noopener">Join</a>` : ''}
          ${canManage ? `<button class="btn btn-danger btn-sm" onclick="del('/api/sessions/${s.id}','class')">Remove</button>` : ''}
        </div>`).join('') : '<div class="empty">No classes scheduled yet.</div>'}
    </div></div>`;
  }

  if (tab === 'Content') {
    body.innerHTML = `<div class="card"><div class="card-body tight">
      ${d.lessons.length ? d.lessons.map((l) => `
        <div class="list-row">
          <div class="when">${l.week_no ? 'Week ' + l.week_no : ''}<small>${esc(l.type || '')}</small></div>
          <div class="grow"><div class="t">${esc(l.title)}</div></div>
          <a class="btn btn-ghost btn-sm" href="${esc(l.url)}" target="_blank" rel="noopener">Open</a>
          ${canManage ? `<button class="btn btn-danger btn-sm" onclick="del('/api/lessons/${l.id}','content')">Remove</button>` : ''}
        </div>`).join('') : '<div class="empty">No content added yet.</div>'}
    </div></div>`;
  }

  if (tab === 'Assignments') {
    body.innerHTML = `<div class="card"><div class="card-body tight">
      ${d.assignments.length ? d.assignments.map((a) => {
        const mine = d.my_submissions ? d.my_submissions[a.id] : null;
        let studentBits = '';
        if (ME.role === 'student') {
          if (mine && mine.grade != null) studentBits = `<div class="s" style="margin-top:4px">Graded: <strong>${mine.grade}%</strong> &middot; ${gemChip(mine.gems)} ${mine.remarks ? '&middot; &ldquo;' + esc(mine.remarks) + '&rdquo;' : ''}</div>`;
          else if (mine) studentBits = `<div class="s" style="margin-top:4px;color:var(--ok)">Submitted ${esc((mine.submitted_at || '').slice(0, 10))} - awaiting grade</div>`;
        }
        return `<div class="list-row">
          <div class="when">Due<small>${fmtDate(a.due_date)}</small></div>
          <div class="grow">
            <div class="t">${esc(a.title)} <span class="s" style="font-weight:500;color:var(--muted)">&middot; ${a.points || 100} gems</span></div>
            ${a.description ? `<div class="s">${esc(a.description)}</div>` : ''}
            ${a.file_url ? `<a class="s" href="${esc(a.file_url)}" target="_blank" rel="noopener">Attached brief</a>` : ''}
            ${studentBits}
          </div>
          ${ME.role === 'student' ? `<button class="btn btn-teal btn-sm" onclick="formSubmit(${a.id},'${esc(a.title).replace(/'/g, '&#39;')}')">${mine ? 'Resubmit' : 'Submit'}</button>` : ''}
          ${isStaff() ? `<button class="btn btn-ghost btn-sm" onclick="openSubmissions(${a.id})">Submissions (${a.submissions_count})</button>` : ''}
          ${canManage ? `<button class="btn btn-danger btn-sm" onclick="del('/api/assignments/${a.id}','assignment')">Remove</button>` : ''}
        </div>`;
      }).join('') : '<div class="empty">No assignments yet.</div>'}
    </div></div>`;
  }

  if (tab === 'Leaderboard') {
    body.innerHTML = `<div class="card"><div class="card-head"><h3>This course</h3><span class="s" style="color:var(--muted)">Gems earned in ${esc(d.batch.name)}</span></div>
      <div class="card-body tight">${d.leaderboard.length ? d.leaderboard.map(lbRow).join('') : '<div class="empty">No gems earned here yet.</div>'}</div></div>`;
  }

  if (tab === 'People' && isStaff()) {
    const isAdmin = ME.role === 'admin';
    body.innerHTML = `
      <div class="card"><div class="card-head"><h3>Teachers</h3>${isAdmin ? `<button class="btn btn-ghost btn-sm" onclick="formTeacher()">Add teacher</button>` : ''}</div>
        <div class="card-body tight">${d.batch.teachers.length ? d.batch.teachers.map((t) => `
          <div class="list-row"><div class="grow"><div class="t">${esc(t.name)}</div></div>
          ${isAdmin ? `<button class="btn btn-danger btn-sm" onclick="removeTeacher(${t.id})">Remove</button>` : ''}</div>`).join('') : '<div class="empty">No teachers assigned yet.</div>'}</div></div>
      <div class="card"><div class="card-head"><h3>Students (${d.students.length})</h3>${isAdmin ? `<button class="btn btn-ghost btn-sm" onclick="formStudents()">Add students</button>` : ''}</div>
        <div class="card-body" style="padding:0;overflow-x:auto"><table class="tbl">
          <tr><th>Name</th><th>Reg no</th><th>Username</th>${isAdmin ? '<th></th>' : ''}</tr>
          ${d.students.map((s) => `<tr><td>${esc(s.name)}</td><td class="mono">${esc(s.reg_no || '—')}</td><td class="mono">${esc(s.username)}</td>
            ${isAdmin ? `<td style="text-align:right"><button class="btn btn-danger btn-sm" onclick="removeStudent(${s.id})">Remove</button></td>` : ''}</tr>`).join('') || `<tr><td colspan="4" class="empty">No students enrolled yet.</td></tr>`}
        </table></div></div>`;
  }

  if (tab === 'Report' && isStaff()) {
    const r = d.report;
    const atRisk = r.students.filter((s) => s.at_risk).length;
    body.innerHTML = `
      ${canManage && ME.ai_enabled ? `<div class="card"><div class="card-body" style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
        <span class="s" style="color:var(--muted)">AI tools draft; you review before anything reaches a student.</span>
        <span style="flex:1"></span>
        <button class="btn btn-ghost btn-sm" onclick="aiClassSummary()">&#10024; AI class summary</button>
        <button class="btn btn-ghost btn-sm" onclick="openBatchReports()">Skill reports</button>
      </div></div>` : ''}
      <div class="card"><div class="card-head"><h3>Progress report</h3><span class="s" style="color:var(--muted)">${r.assignments.length} assignment${r.assignments.length === 1 ? '' : 's'}${atRisk ? ` &middot; <strong style="color:var(--danger)">${atRisk} at risk</strong>` : ''}</span></div>
      <div class="card-body" style="padding:0;overflow-x:auto"><table class="tbl">
        <tr><th>Student</th><th>Reg no</th><th>Stage</th><th>Submitted</th><th>Graded</th><th>Avg</th><th>Gems</th><th>Streak</th><th>Risk</th><th>Latest remark</th>${canManage && ME.ai_enabled ? '<th></th>' : ''}</tr>
        ${r.students.map((s) => `<tr>
          <td>${esc(s.name)}</td><td class="mono">${esc(s.reg_no || '—')}</td>
          <td>${stagePill(s.stage)}</td>
          <td>${s.submitted}/${s.total_assignments}</td><td>${s.graded}/${s.total_assignments}</td>
          <td>${s.avg != null ? s.avg + '%' : '—'}</td><td>${gemChip(s.gems)}</td>
          <td>${s.streak ? '&#128293; ' + s.streak + 'd' : '—'}</td>
          <td>${s.at_risk ? `<span class="s" style="color:var(--danger);font-weight:700">At risk</span><div class="s" style="color:var(--muted-2)">${s.missing ? s.missing + ' missing' : ''}${s.missing && s.inactive_days != null ? ' &middot; ' : ''}${s.inactive_days != null ? s.inactive_days + 'd quiet' : 'never active'}</div>` : '<span class="s" style="color:var(--ok)">OK</span>'}</td>
          <td class="s" style="max-width:200px">${esc(s.last_remark || '—')}</td>
          ${canManage && ME.ai_enabled ? `<td><button class="btn btn-ghost btn-sm" onclick="aiSkillReport(${s.id},'${esc(s.name).replace(/'/g, '&#39;')}')">&#10024; Report</button></td>` : ''}</tr>`).join('') || `<tr><td colspan="11" class="empty">No students enrolled yet.</td></tr>`}
      </table></div></div>`;
  }
}

/* ---------------------- course actions (modals) ---------------------- */
function bid() { return CURRENT_BATCH.batch.id; }
async function del(path, label) {
  if (!confirm(`Remove this ${label}? This cannot be undone.`)) return;
  try { await api(path, { method: 'DELETE' }); toast(`Removed ${label}.`); openCourse(bid()); }
  catch (e) { toast(e.message, true); }
}
async function deleteBatch() {
  if (!confirm('Delete this whole course, including its classes, content, assignments and submissions? This cannot be undone.')) return;
  try { await api(`/api/admin/batches/${bid()}`, { method: 'DELETE' }); toast('Course deleted.'); show('courses'); }
  catch (e) { toast(e.message, true); }
}
async function removeStudent(uid) {
  if (!confirm('Remove this student from the course? Their account and gems stay intact.')) return;
  try { await api(`/api/batches/${bid()}/students/${uid}`, { method: 'DELETE' }); toast('Student removed from course.'); openCourse(bid()); }
  catch (e) { toast(e.message, true); }
}
async function removeTeacher(uid) {
  if (!confirm('Remove this teacher from the course?')) return;
  try { await api(`/api/batches/${bid()}/teachers/${uid}`, { method: 'DELETE' }); toast('Teacher removed.'); openCourse(bid()); }
  catch (e) { toast(e.message, true); }
}

function formSession() {
  openModal('Schedule a class', `
    <form id="f">
      <label class="field"><span>Title</span><input name="title" required placeholder="e.g. Week 2: Retrieval pipelines"></label>
      <div class="form-grid">
        <label class="field"><span>Week no</span><input name="week_no" type="number" min="1"></label>
        <label class="field"><span>Date</span><input name="session_date" type="date" required></label>
        <label class="field"><span>Starts</span><input name="start_time" type="time"></label>
        <label class="field"><span>Ends</span><input name="end_time" type="time"></label>
      </div>
      <label class="field"><span>Join link (Zoom / Meet)</span><input name="join_url" type="url" placeholder="https://"></label>
      <button class="btn btn-primary btn-block">Add to schedule</button></form>`);
  hookForm(`/api/batches/${bid()}/sessions`, 'Class scheduled.');
}
function formLesson() {
  openModal('Add content', `
    <form id="f">
      <label class="field"><span>Title</span><input name="title" required placeholder="e.g. Week 1 slides"></label>
      <div class="form-grid">
        <label class="field"><span>Week no</span><input name="week_no" type="number" min="1"></label>
        <label class="field"><span>Type</span><select name="type"><option>slides</option><option>reading</option><option>notebook</option><option>video</option><option>resource</option></select></label>
      </div>
      <label class="field"><span>Upload a file</span><input name="file" type="file"></label>
      <p class="hint">or paste a link instead</p>
      <label class="field"><span>Link</span><input name="url" type="url" placeholder="https://"></label>
      <button class="btn btn-primary btn-block">Add content</button></form>`);
  hookForm(`/api/batches/${bid()}/lessons`, 'Content added.', true);
}
function formAssignment() {
  openModal('Add assignment', `
    <form id="f">
      <label class="field"><span>Title</span><input name="title" required></label>
      <label class="field"><span>Instructions</span><textarea name="description"></textarea></label>
      <div class="form-grid">
        <label class="field"><span>Due date</span><input name="due_date" type="date"></label>
        <label class="field"><span>Gems (points)</span><input name="points" type="number" min="10" max="1000" value="100"></label>
      </div>
      <label class="field"><span>Attach a brief (optional)</span><input name="file" type="file"></label>
      <button class="btn btn-primary btn-block">Publish assignment</button></form>`);
  hookForm(`/api/batches/${bid()}/assignments`, 'Assignment published.', true);
}
function formAnnouncement() {
  openModal('Post announcement', `
    <form id="f">
      <label class="field"><span>Title</span><input name="title" required></label>
      <label class="field"><span>Message</span><textarea name="body" required></textarea></label>
      <p class="hint">Everyone on this course sees it; those with an email on file are also emailed once SMTP is configured.</p>
      <button class="btn btn-primary btn-block">Post</button></form>`);
  hookForm(`/api/batches/${bid()}/announcements`, 'Announcement posted.');
}
function formAward() {
  const students = (CURRENT_BATCH.students || []);
  openModal('Award bonus gems', `
    <form id="f">
      <label class="field"><span>Student</span><select name="user_id" required>${students.map((s) => `<option value="${s.id}">${esc(s.name)}</option>`).join('')}</select></label>
      <div class="form-grid">
        <label class="field"><span>Gems (1&ndash;200)</span><input name="amount" type="number" min="1" max="200" value="20" required></label>
        <label class="field"><span>Reason</span><input name="reason" placeholder="e.g. Helped a classmate debug"></label>
      </div>
      <p class="hint">Bonus gems reward attendance, participation, and helping peers - the things grades miss.</p>
      <button class="btn btn-primary btn-block">Award gems</button></form>`);
  hookForm(`/api/batches/${bid()}/award`, 'Gems awarded.');
}
function formStudents() {
  openModal('Add students', `
    <form id="f">
      <label class="field"><span>New students - one full name per line</span><textarea name="names" placeholder="Ayesha Khan&#10;Bilal Noor"></textarea></label>
      <p class="hint">Each gets a generated username, password, and unique registration number - shown once below to copy and share.</p>
      <label class="field"><span>Existing students - one reg no or username per line</span><textarea name="existing" placeholder="4821736"></textarea></label>
      <p class="hint">Enrolls students who already have accounts, so one student can take several courses.</p>
      <button class="btn btn-primary btn-block">Add to course</button></form>
    <div id="credOut"></div>`);
  $('f').addEventListener('submit', async (e) => {
    e.preventDefault(); const f = e.target; const btn = f.querySelector('button'); btn.disabled = true; modalMsg('');
    const names = f.names.value.split('\n').map((s) => s.trim()).filter(Boolean);
    const existing = f.existing.value.split('\n').map((s) => s.trim()).filter(Boolean);
    try {
      const out = await api(`/api/batches/${bid()}/students`, { method: 'POST', body: JSON.stringify({ names, existing }) });
      let html = '';
      if (out.created.length) html += `<p style="margin:12px 0 4px;font-weight:600">New accounts - copy these now, passwords are shown once:</p>` +
        out.created.map((c) => `<div class="cred-box">${esc(c.name)}<br>Reg no: <strong>${esc(c.reg_no)}</strong><br>Username: ${esc(c.username)}<br>Password: ${esc(c.password)}</div>`).join('');
      if (out.added.length) html += `<p style="margin:12px 0 4px;font-weight:600">Enrolled existing students:</p>` + out.added.map((a) => `<div class="cred-box">${esc(a.name)} (${esc(a.reg_no)})</div>`).join('');
      if (out.missing.length) html += `<p style="margin:12px 0 4px;color:var(--danger)">Not found: ${out.missing.map(esc).join(', ')}</p>`;
      $('credOut').innerHTML = html || '';
      modalMsg('Done.', true); f.reset(); openCoursePreserveModal();
    } catch (err) { modalMsg(err.message); }
    btn.disabled = false;
  });
}
function formTeacher() {
  openModal('Add a teacher', `
    <form id="f">
      <label class="field"><span>Existing teacher - username or user id</span><input name="existing" placeholder="e.g. sara.malik@echolens.digital"></label>
      <p class="hint">or create a new teacher account</p>
      <label class="field"><span>New teacher full name</span><input name="name" placeholder="e.g. Sara Malik"></label>
      <p class="hint">Courses can have several teachers - add as many as you need.</p>
      <button class="btn btn-primary btn-block">Add teacher</button></form>
    <div id="credOut"></div>`);
  $('f').addEventListener('submit', async (e) => {
    e.preventDefault(); const f = e.target; const btn = f.querySelector('button'); btn.disabled = true; modalMsg('');
    try {
      const out = await api(`/api/batches/${bid()}/teachers`, { method: 'POST', body: JSON.stringify({ existing: f.existing.value.trim() || undefined, name: f.name.value.trim() || undefined }) });
      if (out.credentials) $('credOut').innerHTML = `<p style="margin:12px 0 4px;font-weight:600">New teacher account - copy now:</p><div class="cred-box">Username: ${esc(out.credentials.username)}<br>Password: ${esc(out.credentials.password)}</div>`;
      modalMsg(`${out.teacher.name} added to this course.`, true); f.reset(); openCoursePreserveModal();
    } catch (err) { modalMsg(err.message); }
    btn.disabled = false;
  });
}
async function openCoursePreserveModal() {
  const d = await api(`/api/batches/${bid()}`); CURRENT_BATCH = d;
}
function formSubmit(aid, title) {
  openModal(`Submit: ${title}`, `
    <form id="f">
      <label class="field"><span>Your work - PDF or Word only</span><input name="file" type="file" accept=".pdf,.doc,.docx" required></label>
      <label class="field"><span>Note to your teacher (optional)</span><textarea name="note"></textarea></label>
      <button class="btn btn-primary btn-block">Submit assignment</button></form>`);
  $('f').addEventListener('submit', async (e) => {
    e.preventDefault(); const f = e.target; const btn = f.querySelector('button'); btn.disabled = true; modalMsg('');
    const fd = new FormData(f);
    try { await api(`/api/assignments/${aid}/submit`, { method: 'POST', body: fd }); toast('Submitted - good luck!'); closeModal(); openCourse(bid()); }
    catch (err) { modalMsg(err.message); btn.disabled = false; }
  });
}
async function openSubmissions(aid) {
  const d = await api(`/api/assignments/${aid}/submissions`);
  const canGrade = CURRENT_BATCH.can_manage;
  openModal(`Submissions: ${d.assignment.title}`, `
    <div class="card-body tight" style="max-height:56vh;overflow-y:auto">
      ${d.submissions.length ? d.submissions.map((s) => `
        <div class="list-row" style="padding:12px 4px">
          <div class="grow">
            <div class="t">${esc(s.student_name)} <span class="mono s" style="color:var(--muted)">${esc(s.student_reg || '')}</span></div>
            <div class="s">${esc((s.submitted_at || '').slice(0, 16))} ${s.note ? '&middot; &ldquo;' + esc(s.note) + '&rdquo;' : ''}</div>
            ${s.grade != null ? `<div class="s">Graded <strong>${s.grade}%</strong> &middot; ${s.gems} gems ${s.remarks ? '&middot; ' + esc(s.remarks) : ''}</div>` : '<div class="s" style="color:var(--gold)">Awaiting grade</div>'}
          </div>
          <a class="btn btn-ghost btn-sm" href="${esc(s.file_url)}" target="_blank" rel="noopener">Open file</a>
          ${canGrade ? `<button class="btn btn-teal btn-sm" onclick="formGrade(${s.id},${aid})">${s.grade != null ? 'Regrade' : 'Grade'}</button>` : ''}
        </div>`).join('') : '<div class="empty">No submissions yet.</div>'}
    </div>`);
}
function formGrade(sid, aid) {
  openModal('Grade submission', `
    ${ME.ai_enabled ? `<button class="btn btn-ghost btn-sm" id="aiDraftBtn" onclick="aiReview('assignment',${sid})" style="margin-bottom:12px">&#10024; AI Review</button>
      <div id="aiRationale" style="display:none"></div>` : ''}
    <form id="f">
      <label class="field"><span>Grade (0&ndash;100%)</span><input name="grade" type="number" min="0" max="100" required></label>
      <label class="field"><span>Remarks for the student</span><textarea name="remarks" placeholder="What went well, what to improve"></textarea></label>
      <p class="hint">Gems are awarded automatically: assignment points &times; grade. Students see gems and remarks.${ME.ai_enabled ? ' AI drafts are suggestions - you decide what publishes.' : ''}</p>
      <button class="btn btn-primary btn-block">Save grade</button></form>`);
  $('f').addEventListener('submit', async (e) => {
    e.preventDefault(); const f = e.target; const btn = f.querySelector('button'); btn.disabled = true; modalMsg('');
    try {
      await api(`/api/submissions/${sid}/grade`, { method: 'POST', body: JSON.stringify({ grade: f.grade.value, remarks: f.remarks.value }) });
      toast('Grade saved - gems awarded.'); await openCoursePreserveModal(); openSubmissions(aid);
    } catch (err) { modalMsg(err.message); btn.disabled = false; }
  });
}
function hookForm(path, okMsg, isMultipart) {
  $('f').addEventListener('submit', async (e) => {
    e.preventDefault(); const f = e.target; const btn = f.querySelector('button[type="submit"],button:not([type])'); btn.disabled = true; modalMsg('');
    try {
      if (isMultipart) await api(path, { method: 'POST', body: new FormData(f) });
      else {
        const obj = {}; new FormData(f).forEach((v, k) => { if (v !== '') obj[k] = v; });
        await api(path, { method: 'POST', body: JSON.stringify(obj) });
      }
      toast(okMsg); closeModal(); openCourse(bid());
    } catch (err) { modalMsg(err.message); btn.disabled = false; }
  });
}

/* ============================== SCHEDULE ============================== */
async function renderSchedule() {
  const el = $('view-schedule');
  el.innerHTML = '<div class="empty">Loading&hellip;</div>';
  const d = await api('/api/overview');
  el.innerHTML = `<div class="card"><div class="card-head"><h3>Upcoming classes</h3></div>
    <div class="card-body tight">${d.upcoming.length ? d.upcoming.map(sessionRow).join('') : '<div class="empty">No upcoming classes. Enjoy the calm.</div>'}</div></div>`;
}

/* ============================= LEADERBOARD ============================= */
async function renderLeaderboard() {
  const el = $('view-leaderboard');
  el.innerHTML = '<div class="empty">Loading&hellip;</div>';
  const d = await api('/api/leaderboard');
  el.innerHTML = `
    <div style="display:grid;grid-template-columns:1.4fr 1fr;gap:20px;align-items:start" class="lb-grid">
      <div class="card"><div class="card-head"><h3>Learners</h3><span class="s" style="color:var(--muted)">All-time gems</span></div>
        <div class="card-body tight">${d.students.length ? d.students.map(lbRow).join('') : '<div class="empty">No gems earned yet.</div>'}</div></div>
      <div class="card"><div class="card-head"><h3>Courses</h3><span class="s" style="color:var(--muted)">Gems per cohort</span></div>
        <div class="card-body tight">${d.courses.length ? d.courses.map((c, i) => `
          <div class="lb-row top${i + 1}"><div class="lb-rank">${i + 1}</div>
            <div class="lb-name">${esc(c.title || c.name)}<small>${esc(c.name)} &middot; ${esc(c.code)}</small></div>
            ${gemChip(c.gems)}</div>`).join('') : '<div class="empty">No running courses.</div>'}</div></div>
    </div>
    <style>@media (max-width:900px){.lb-grid{grid-template-columns:1fr !important}}</style>`;
}

/* ============================ ANNOUNCEMENTS ============================ */
async function renderAnnouncements() {
  const el = $('view-announcements');
  el.innerHTML = '<div class="empty">Loading&hellip;</div>';
  const d = await api('/api/announcements');
  const adminBtn = ME.role === 'admin' ? `<button class="btn btn-ghost btn-sm" onclick="formGlobalAnnouncement()">Announce to everyone</button>` : '';
  el.innerHTML = `<div class="card"><div class="card-head"><h3>Announcements</h3>${adminBtn}</div>
    <div class="card-body tight">${d.announcements.length ? d.announcements.map(annRow).join('') : '<div class="empty">Nothing yet.</div>'}</div></div>`;
}
function formGlobalAnnouncement() {
  openModal('Announce to everyone', `
    <form id="f">
      <label class="field"><span>Title</span><input name="title" required></label>
      <label class="field"><span>Message</span><textarea name="body" required></textarea></label>
      <button class="btn btn-primary btn-block">Post to all</button></form>`);
  $('f').addEventListener('submit', async (e) => {
    e.preventDefault(); const f = e.target;
    try { await api('/api/admin/announcements', { method: 'POST', body: JSON.stringify({ title: f.title.value, body: f.body.value }) }); toast('Posted to everyone.'); closeModal(); renderAnnouncements(); }
    catch (err) { modalMsg(err.message); }
  });
}

/* =============================== PROFILE =============================== */
async function renderProfile() {
  const el = $('view-profile');
  ME = await api('/api/auth/me');
  const p = ME.profile || {};
  const rows = Object.keys(p).length ? Object.entries(p).map(([k, v]) => `<div class="kv"><span class="k">${esc(k.replace(/_/g, ' '))}</span><span>${esc(v)}</span></div>`).join('') : '<div class="s" style="color:var(--muted)">No profile details yet.</div>';
  el.innerHTML = `
    ${ME.gamify ? prismCard(ME.gamify) : ''}
    ${ME.gamify ? journeyRail(ME.gamify) : ''}
    ${ME.gamify ? badgesCard(ME.gamify) : ''}
    <div id="myReports"></div>
    <div class="card" style="max-width:640px"><div class="card-head"><h3>Your account</h3><span class="role-pill">${roleLabel(ME.role)}</span></div>
      <div class="card-body">
        <div class="kv"><span class="k">name</span><span>${esc(ME.name)}</span></div>
        ${ME.reg_no ? `<div class="kv"><span class="k">registration no</span><span class="mono">${esc(ME.reg_no)}</span></div>` : ''}
        <div class="kv"><span class="k">username</span><span class="mono">${esc(ME.username || '—')}</span></div>
        <div class="kv"><span class="k">email</span><span>${esc(ME.email || 'No email on file')}</span></div>
        ${ME.reg_no ? `<div style="margin-top:12px"><button class="btn btn-ghost btn-sm" onclick="sharePublicProfile()">Copy public profile link</button></div>` : ''}
      </div></div>
    <div class="card" style="max-width:640px"><div class="card-head"><h3>Profile details</h3><button class="btn btn-ghost btn-sm" onclick="openProfileForm()">Edit</button></div>
      <div class="card-body">${rows}</div></div>
    <div class="card" style="max-width:640px"><div class="card-head"><h3>Change password</h3></div>
      <div class="card-body"><form id="pwForm">
        <label class="field"><span>Current password</span><input name="current" type="password" required autocomplete="current-password"></label>
        <label class="field"><span>New password</span><input name="next" type="password" required minlength="8" placeholder="At least 8 characters" autocomplete="new-password"></label>
        <button class="btn btn-primary" type="submit">Update password</button></form></div></div>`;
  requestAnimationFrame(() => { const f = el.querySelector('.prism-fill'); if (f) f.style.width = f.dataset.w + '%'; });
  loadMyReports();
  $('pwForm').addEventListener('submit', async (e) => {
    e.preventDefault(); const f = e.target; const btn = f.querySelector('button'); btn.disabled = true;
    try { await api('/api/me/password', { method: 'POST', body: JSON.stringify({ current: f.current.value, next: f.next.value }) }); toast('Password updated.'); f.reset(); }
    catch (err) { toast(err.message, true); }
    btn.disabled = false;
  });
}
function journeyRail(g) {
  const gems = g.gems;
  return `<div class="card"><div class="card-head"><h3>Stage journey</h3><span class="s" style="color:var(--muted)">${gems} gems earned</span></div>
    <div class="card-body"><div class="journey">
      ${g.stages.map((s) => {
        const done = gems >= s.min && g.stage.key !== s.key;
        const isNow = g.stage.key === s.key;
        return `<div class="step${done && gems >= s.min ? ' done' : ''}${isNow ? ' now' : ''}">
          <div class="dot"></div><div class="nm">${esc(s.name)}</div><div class="th">${s.min}+</div></div>`;
      }).join('')}
    </div></div></div>`;
}
function openProfileForm() {
  const p = ME.profile || {};
  openModal('Edit profile details', `
    <form id="f">
      <label class="field"><span>City</span><input name="city" value="${esc(p.city || '')}"></label>
      <label class="field"><span>Education</span><input name="education" value="${esc(p.education || '')}"></label>
      <label class="field"><span>Goal</span><input name="goal" value="${esc(p.goal || '')}" placeholder="What are you here to achieve?"></label>
      <label class="field"><span>LinkedIn / GitHub</span><input name="links" value="${esc(p.links || '')}"></label>
      <button class="btn btn-primary btn-block">Save</button></form>`);
  $('f').addEventListener('submit', async (e) => {
    e.preventDefault(); const f = e.target; const obj = {}; new FormData(f).forEach((v, k) => { if (v.trim()) obj[k] = v.trim(); });
    try { await api('/api/me/profile', { method: 'POST', body: JSON.stringify(obj) }); toast('Profile saved.'); closeModal(); renderProfile(); }
    catch (err) { modalMsg(err.message); }
  });
}

/* ============================== CATALOGUE ============================== */
async function renderCatalogue() {
  const el = $('view-admin-catalogue');
  el.innerHTML = '<div class="empty">Loading&hellip;</div>';
  const d = await api('/api/admin/catalogue');
  const isAdmin = ME.role === 'admin';
  el.innerHTML = `
    ${isAdmin ? `<div class="card"><div class="card-head"><h3>Start a course</h3></div>
      <div class="card-body"><form id="startForm"><div class="form-grid">
        <label class="field"><span>Course</span><select name="course_id" required>${d.courses.map((c) => `<option value="${c.id}">${esc(c.title)}</option>`).join('')}</select></label>
        <label class="field"><span>Cohort name</span><input name="name" required placeholder="e.g. September 2026 Cohort"></label>
        <label class="field"><span>Start date</span><input name="start_date" type="date" required></label>
      </div><button class="btn btn-primary">Start course</button></form></div></div>` : ''}
    <div class="card"><div class="card-head"><h3>Running courses</h3></div>
      <div class="card-body" style="padding:0;overflow-x:auto"><table class="tbl">
        <tr><th>Code</th><th>Course</th><th>Cohort</th><th>Teachers</th><th>Students</th><th>Starts</th><th></th></tr>
        ${d.batches.map((b) => `<tr>
          <td class="mono">${esc(b.code)}</td><td>${esc(b.title || '—')}</td><td>${esc(b.name)}</td>
          <td>${esc(b.teacher_names || '—')}</td><td>${b.students}</td><td>${fmtDate(b.start_date)}</td>
          <td style="text-align:right"><button class="btn btn-ghost btn-sm" onclick="openCourse(${b.id})">Open</button></td></tr>`).join('') || '<tr><td colspan="7" class="empty">No running courses yet.</td></tr>'}
      </table></div></div>
    ${isAdmin ? `<div class="card"><div class="card-head"><h3>Catalogue</h3><div style="display:flex;gap:8px"><button class="btn btn-ghost btn-sm" onclick="loadOfficial()">Load official catalogue</button><button class="btn btn-ghost btn-sm" onclick="formCourse()">Add course</button></div></div>
      <div class="card-body" style="padding:0;overflow-x:auto"><table class="tbl">
        <tr><th>Code</th><th>Title</th><th>Tier</th><th>Level</th><th>Weeks</th><th>Price (PKR)</th><th></th></tr>
        ${d.courses.map((c) => `<tr>
          <td class="mono">${esc(c.code || '—')}</td><td>${esc(c.title)}</td><td>${esc(c.tier || '—')}</td><td>${esc(c.level || '—')}</td>
          <td>${c.weeks || '—'}</td><td>${c.price_pkr ? c.price_pkr.toLocaleString() : '—'}</td>
          <td style="text-align:right"><button class="btn btn-danger btn-sm" onclick="delCourse(${c.id})">Delete</button></td></tr>`).join('') || '<tr><td colspan="7" class="empty">Catalogue is empty.</td></tr>'}
      </table></div></div>` : ''}`;
  const sf = $('startForm');
  if (sf) sf.addEventListener('submit', async (e) => {
    e.preventDefault(); const f = e.target;
    try {
      const out = await api('/api/admin/batches', { method: 'POST', body: JSON.stringify({ course_id: f.course_id.value, name: f.name.value, start_date: f.start_date.value }) });
      toast('Course started.'); openCourse(out.batch.id);
    } catch (err) { toast(err.message, true); }
  });
}
function formCourse() {
  openModal('Add a course to the catalogue', `
    <form id="f"><div class="form-grid">
      <label class="field"><span>Code</span><input name="code" placeholder="e.g. SC-ML"></label>
      <label class="field"><span>Title</span><input name="title" required></label>
      <label class="field"><span>Tier</span><input name="tier" placeholder="Bootcamp / Short Course"></label>
      <label class="field"><span>Level</span><input name="level" placeholder="Beginner"></label>
      <label class="field"><span>Weeks</span><input name="weeks" type="number" min="1"></label>
      <label class="field"><span>Hours</span><input name="hours" type="number" min="1"></label>
      <label class="field"><span>Price (PKR)</span><input name="price_pkr" type="number" min="0"></label>
    </div>
    <label class="field"><span>Summary</span><textarea name="summary"></textarea></label>
    <button class="btn btn-primary btn-block">Add course</button></form>`);
  $('f').addEventListener('submit', async (e) => {
    e.preventDefault(); const f = e.target; const obj = {}; new FormData(f).forEach((v, k) => { if (v !== '') obj[k] = v; });
    try { await api('/api/admin/courses', { method: 'POST', body: JSON.stringify(obj) }); toast('Course added.'); closeModal(); renderCatalogue(); }
    catch (err) { modalMsg(err.message); }
  });
}
async function delCourse(id) {
  if (!confirm('Delete this course from the catalogue? Running cohorts are not affected.')) return;
  try { await api(`/api/admin/courses/${id}`, { method: 'DELETE' }); toast('Course deleted.'); renderCatalogue(); }
  catch (e) { toast(e.message, true); }
}

/* ================================ PEOPLE ================================ */
async function renderUsers() {
  const el = $('view-admin-users');
  el.innerHTML = '<div class="empty">Loading&hellip;</div>';
  const d = await api('/api/admin/users');
  const isAdmin = ME.role === 'admin';
  const groups = [
    ['Students', d.users.filter((u) => u.role === 'student')],
    ['Teachers', d.users.filter((u) => u.role === 'instructor')],
    ['Coordinators', d.users.filter((u) => u.role === 'coordinator')],
    ['Admins', d.users.filter((u) => u.role === 'admin')],
  ];
  el.innerHTML = `
    ${isAdmin ? `<div class="card"><div class="card-body" style="display:flex;gap:10px;flex-wrap:wrap;align-items:center">
      <span class="s" style="color:var(--muted)">Forgot passwords are fixed here - reset keeps the account, gems, and enrollments intact.</span>
      <span style="flex:1"></span>
      <button class="btn btn-ghost btn-sm" onclick="formCoordinator()">Add a coordinator</button>
    </div></div>` : ''}
    ${groups.map(([label, users]) => `
      <div class="card"><div class="card-head"><h3>${label} (${users.length})</h3></div>
        <div class="card-body" style="padding:0;overflow-x:auto"><table class="tbl">
          <tr><th>Name</th><th>Reg no</th><th>Username</th><th>Gems</th><th>Courses</th>${isAdmin ? '<th></th>' : ''}</tr>
          ${users.map((u) => `<tr>
            <td>${esc(u.name)}</td>
            <td class="mono">${esc(u.reg_no || '—')}</td>
            <td class="mono">${esc(u.username || '—')}</td>
            <td>${u.gems != null ? gemChip(u.gems).replace('gem-chip', 'gem-chip') : '—'}</td>
            <td class="s">${u.courses.map(esc).join(', ') || '—'}</td>
            ${isAdmin ? `<td style="text-align:right;white-space:nowrap">
              <button class="btn btn-ghost btn-sm" onclick="formResetPassword(${u.id},'${esc(u.name).replace(/'/g, '&#39;')}')">Reset password</button>
              ${u.role !== 'admin' ? `<button class="btn btn-danger btn-sm" onclick="delUser(${u.id},'${esc(u.name).replace(/'/g, '&#39;')}')">Delete</button>` : ''}
            </td>` : ''}</tr>`).join('') || `<tr><td colspan="6" class="empty">None yet.</td></tr>`}
        </table></div></div>`).join('')}`;
}
function formResetPassword(uid, name) {
  openModal(`Reset password: ${name}`, `
    <form id="f">
      <label class="field"><span>New password (leave blank to auto-generate)</span><input name="password" minlength="8" placeholder="At least 8 characters, or leave blank"></label>
      <p class="hint">The account keeps everything - gems, streaks, enrollments, submissions. Only the password changes.</p>
      <button class="btn btn-primary btn-block">Reset password</button></form>
    <div id="credOut"></div>`);
  $('f').addEventListener('submit', async (e) => {
    e.preventDefault(); const f = e.target; const btn = f.querySelector('button'); btn.disabled = true; modalMsg('');
    try {
      const out = await api(`/api/admin/users/${uid}/password`, { method: 'POST', body: JSON.stringify({ password: f.password.value || undefined }) });
      $('credOut').innerHTML = `<p style="margin:12px 0 4px;font-weight:600">Share these with the person - shown once:</p>
        <div class="cred-box">Username: ${esc(out.username)}<br>New password: <strong>${esc(out.password)}</strong></div>`;
      modalMsg('Password reset.', true);
    } catch (err) { modalMsg(err.message); }
    btn.disabled = false;
  });
}
function formCoordinator() {
  openModal('Add a student coordinator', `
    <form id="f">
      <label class="field"><span>Full name</span><input name="name" required placeholder="e.g. Hina Raza"></label>
      <label class="field"><span>Email (optional)</span><input name="email" type="email"></label>
      <p class="hint">Coordinators see every course, report, and leaderboard - but cannot add, remove, grade, or change anything.</p>
      <button class="btn btn-primary btn-block">Create coordinator account</button></form>
    <div id="credOut"></div>`);
  $('f').addEventListener('submit', async (e) => {
    e.preventDefault(); const f = e.target; const btn = f.querySelector('button'); btn.disabled = true; modalMsg('');
    try {
      const out = await api('/api/admin/coordinators', { method: 'POST', body: JSON.stringify({ name: f.name.value, email: f.email.value || undefined }) });
      $('credOut').innerHTML = `<p style="margin:12px 0 4px;font-weight:600">Coordinator account - copy now:</p>
        <div class="cred-box">${esc(out.credentials.name)}<br>Username: ${esc(out.credentials.username)}<br>Password: ${esc(out.credentials.password)}</div>`;
      modalMsg('Coordinator created.', true); f.reset();
    } catch (err) { modalMsg(err.message); }
    btn.disabled = false;
  });
}
async function delUser(uid, name) {
  if (!confirm(`Delete ${name}'s account entirely? Their enrollments are removed too. This cannot be undone.`)) return;
  try { await api(`/api/admin/users/${uid}`, { method: 'DELETE' }); toast('Account deleted.'); renderUsers(); }
  catch (e) { toast(e.message, true); }
}


/* ============================== AI DRAFT ============================== */
async function aiDraft(sid) {
  const btn = $('aiDraftBtn'); btn.disabled = true; btn.textContent = 'Thinking...';
  try {
    const out = await api('/api/ai/grade-draft', { method: 'POST', body: JSON.stringify({ submission_id: sid }) });
    const f = $('f');
    if (out.draft.grade != null) f.grade.value = out.draft.grade;
    f.remarks.value = out.draft.remarks || '';
    const r = $('aiRationale');
    r.style.display = '';
    r.innerHTML = `<strong>AI rationale (only you see this):</strong> ${esc(out.draft.rationale || '—')}${out.readable ? '' : '<br><em>Note: the file was not readable as text, so this draft is based on the brief and note only - review carefully.</em>'}`;
    modalMsg('Draft filled in - edit anything, then save to publish.', true);
  } catch (e) { modalMsg(e.message); }
  btn.disabled = false; btn.innerHTML = '&#10024; Draft with AI';
}

/* ============================== CHALLENGES ============================== */
async function renderChallenges() {
  const el = $('view-challenges');
  el.innerHTML = '<div class="empty">Loading&hellip;</div>';
  const d = await api('/api/challenges');
  const adminBar = d.is_admin ? `<div class="card"><div class="card-body" style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
      <span class="s" style="color:var(--muted)">Challenges are open to free-tier users and students. You review submissions and award the gems.</span>
      <span style="flex:1"></span><button class="btn btn-primary btn-sm" onclick="formChallenge()">New challenge</button></div></div>` : '';
  el.innerHTML = `${adminBar}
    <div class="card"><div class="card-head"><h3>Open challenges</h3></div><div class="card-body tight">
      ${d.challenges.length ? d.challenges.map((c) => {
        const mine = d.mine[c.id];
        let status = '';
        if (mine) status = mine.status === 'approved' ? `<div class="s" style="color:var(--ok)">Solved &middot; gems awarded ${mine.remarks ? '&middot; ' + esc(mine.remarks) : ''}</div>`
          : mine.status === 'rejected' ? `<div class="s" style="color:var(--danger)">Not accepted ${mine.remarks ? '&middot; ' + esc(mine.remarks) : ''} - improve and resubmit</div>`
          : `<div class="s" style="color:var(--gold)">Submitted - under review</div>`;
        return `<div class="list-row">
          <div class="when">${esc(c.difficulty)}<small>${c.due_date ? 'due ' + fmtDate(c.due_date) : 'no deadline'}</small></div>
          <div class="grow"><div class="t">${esc(c.title)} ${c.open ? '' : '<span class="s" style="color:var(--muted)">(closed)</span>'} <span class="s" style="font-weight:500;color:var(--muted)">&middot; ${c.gems} gems</span></div>
            ${c.description ? `<div class="s">${esc(c.description)}</div>` : ''}${status}</div>
          ${d.can_play && c.open ? `<button class="btn btn-teal btn-sm" onclick="formChallengeSubmit(${c.id},'${esc(c.title).replace(/'/g, '&#39;')}')">${mine ? 'Resubmit' : 'Submit'}</button>` : ''}
          ${d.is_admin ? `<button class="btn btn-ghost btn-sm" onclick="openChallengeReviews(${c.id})">Review</button>
            <button class="btn btn-ghost btn-sm" onclick="toggleChallenge(${c.id},${c.open ? 'false' : 'true'})">${c.open ? 'Close' : 'Reopen'}</button>
            <button class="btn btn-danger btn-sm" onclick="delChallenge(${c.id})">Delete</button>` : ''}
        </div>`;
      }).join('') : '<div class="empty">No challenges yet' + (d.is_admin ? ' - create the first one.' : '. Check back soon.') + '</div>'}
    </div></div>`;
}
function formChallenge() {
  openModal('New challenge', `
    <form id="f">
      <label class="field"><span>Title</span><input name="title" required placeholder="e.g. Build a URL shortener in Python"></label>
      <label class="field"><span>Description &amp; rules</span><textarea name="description" placeholder="What to build, what to submit, how it's judged"></textarea></label>
      <div class="form-grid">
        <label class="field"><span>Difficulty</span><select name="difficulty"><option>Beginner</option><option>Intermediate</option><option>Advanced</option></select></label>
        <label class="field"><span>Gems reward (5&ndash;500)</span><input name="gems" type="number" min="5" max="500" value="50"></label>
        <label class="field"><span>Deadline (optional)</span><input name="due_date" type="date"></label>
      </div>
      <button class="btn btn-primary btn-block">Publish challenge</button></form>`);
  $('f').addEventListener('submit', async (e) => {
    e.preventDefault(); const f = e.target; const obj = {}; new FormData(f).forEach((v, k) => { if (v !== '') obj[k] = v; });
    try { await api('/api/admin/challenges', { method: 'POST', body: JSON.stringify(obj) }); toast('Challenge published.'); closeModal(); renderChallenges(); }
    catch (err) { modalMsg(err.message); }
  });
}
function formChallengeSubmit(cid, title) {
  openModal(`Submit: ${title}`, `
    <form id="f">
      <label class="field"><span>Link to your work</span><input name="link" type="url" required placeholder="https://github.com/you/repo or Colab link"></label>
      <label class="field"><span>Note (optional)</span><textarea name="note" placeholder="Anything the reviewer should know"></textarea></label>
      <p class="hint">Make the link publicly viewable. Gems are awarded once your submission is approved.</p>
      <button class="btn btn-primary btn-block">Submit</button></form>`);
  $('f').addEventListener('submit', async (e) => {
    e.preventDefault(); const f = e.target; const btn = f.querySelector('button'); btn.disabled = true; modalMsg('');
    try { await api(`/api/challenges/${cid}/submit`, { method: 'POST', body: JSON.stringify({ link: f.link.value.trim(), note: f.note.value }) }); toast('Submitted - under review.'); closeModal(); renderChallenges(); }
    catch (err) { modalMsg(err.message); btn.disabled = false; }
  });
}
async function toggleChallenge(cid, open) {
  try { await api(`/api/admin/challenges/${cid}/open`, { method: 'POST', body: JSON.stringify({ open }) }); renderChallenges(); }
  catch (e) { toast(e.message, true); }
}
async function delChallenge(cid) {
  if (!confirm('Delete this challenge and all its submissions?')) return;
  try { await api(`/api/admin/challenges/${cid}`, { method: 'DELETE' }); toast('Challenge deleted.'); renderChallenges(); }
  catch (e) { toast(e.message, true); }
}
async function openChallengeReviews(cid) {
  const d = await api(`/api/admin/challenges/${cid}/submissions`);
  openModal(`Review: ${d.challenge.title}`, `
    <div class="card-body tight" style="max-height:56vh;overflow-y:auto">
      ${d.submissions.length ? d.submissions.map((s) => `
        <div class="list-row" style="padding:12px 4px">
          <div class="grow">
            <div class="t">${esc(s.user_name)} <span class="mono s" style="color:var(--muted)">${esc(s.user_reg || '')}</span> ${s.user_tier === 'free' ? '<span class="role-pill">free</span>' : ''}</div>
            <div class="s">${esc((s.submitted_at || '').slice(0, 16))} ${s.note ? '&middot; ' + esc(s.note) : ''}</div>
            <div class="s">Status: <strong>${esc(s.status)}</strong> ${s.remarks ? '&middot; ' + esc(s.remarks) : ''}</div>
          </div>
          <a class="btn btn-ghost btn-sm" href="${esc(s.link)}" target="_blank" rel="noopener">Open link</a>
          ${ME.role === 'admin' && s.status === 'pending' ? `
            <button class="btn btn-teal btn-sm" onclick="reviewChallengeSub(${s.id},${cid},true)">Approve</button>
            <button class="btn btn-danger btn-sm" onclick="reviewChallengeSub(${s.id},${cid},false)">Reject</button>` : ''}
        </div>`).join('') : '<div class="empty">No submissions yet.</div>'}
    </div>`);
}
async function reviewChallengeSub(sid, cid, approve) {
  const remarks = prompt(approve ? 'Remarks for the learner (optional):' : 'Why is it rejected? (they can resubmit)') || '';
  try {
    await api(`/api/challenge-submissions/${sid}/review`, { method: 'POST', body: JSON.stringify({ approve, remarks }) });
    toast(approve ? 'Approved - gems awarded.' : 'Rejected with feedback.');
    openChallengeReviews(cid);
  } catch (e) { toast(e.message, true); }
}

/* ============================== AI COPILOT ============================== */
let CHAT = [];
async function renderCopilot() {
  const el = $('view-copilot');
  const st = await api('/api/ai/status').catch(() => ({ enabled: false }));
  if (!st.enabled) {
    el.innerHTML = `<div class="card"><div class="card-body">
      <h3 style="margin-bottom:8px">AI Copilot is not configured yet</h3>
      <p class="s" style="color:var(--muted)">Set <span class="mono">GEMINI_API_KEY</span> (free at aistudio.google.com) or <span class="mono">GROQ_API_KEY</span> in the server environment and restart. Teachers then get grading drafts, quiz generation, course outlines, and a teaching chat - all on free-tier models.</p>
    </div></div>`;
    return;
  }
  el.innerHTML = `
    <div class="card"><div class="card-body" style="display:flex;gap:10px;flex-wrap:wrap">
      <button class="btn btn-ghost btn-sm" onclick="formQuiz()">&#10024; Generate a quiz</button>
      <button class="btn btn-ghost btn-sm" onclick="formOutline()">&#10024; Draft a course outline</button>
      <span style="flex:1"></span>
      <span class="s" style="color:var(--muted-2)">${esc(st.provider)} &middot; ${esc(st.model)} &middot; teachers only, students never see this</span>
    </div></div>
    <div class="card"><div class="card-head"><h3>Teaching chat</h3><button class="btn btn-ghost btn-sm" onclick="CHAT=[];renderCopilot()">Clear</button></div>
      <div class="card-body">
        <div id="chatLog" style="max-height:46vh;overflow-y:auto;display:flex;flex-direction:column;gap:10px;margin-bottom:14px">
          ${CHAT.length ? CHAT.map(chatBubble).join('') : '<div class="s" style="color:var(--muted)">Ask anything: lesson plans, ways to explain a concept, example datasets, assignment ideas...</div>'}
        </div>
        <form id="chatForm" style="display:flex;gap:10px">
          <input name="q" placeholder="e.g. Give me 3 ways to explain overfitting to beginners" style="flex:1;border:1px solid var(--line-strong);border-radius:10px;padding:10px 12px;font-size:14px;font-family:inherit">
          <button class="btn btn-primary">Send</button>
        </form>
      </div></div>`;
  $('chatForm').addEventListener('submit', async (e) => {
    e.preventDefault(); const f = e.target; const q = f.q.value.trim(); if (!q) return;
    f.q.value = ''; CHAT.push({ role: 'user', content: q });
    drawChat(); const log = $('chatLog');
    log.insertAdjacentHTML('beforeend', '<div class="s" id="thinking" style="color:var(--muted)">Thinking&hellip;</div>'); log.scrollTop = log.scrollHeight;
    try {
      const out = await api('/api/ai/chat', { method: 'POST', body: JSON.stringify({ messages: CHAT }) });
      CHAT.push({ role: 'assistant', content: out.reply });
    } catch (err) { CHAT.push({ role: 'assistant', content: 'Error: ' + err.message }); }
    drawChat();
  });
}
function chatBubble(m) {
  const me = m.role === 'user';
  return `<div style="align-self:${me ? 'flex-end' : 'flex-start'};max-width:86%;background:${me ? 'var(--ink)' : 'var(--canvas)'};color:${me ? '#fff' : 'var(--text)'};border:1px solid ${me ? 'var(--ink)' : 'var(--line)'};border-radius:13px;padding:10px 14px;font-size:13.5px;white-space:pre-wrap">${esc(m.content)}</div>`;
}
function drawChat() { const log = $('chatLog'); if (log) { log.innerHTML = CHAT.map(chatBubble).join(''); log.scrollTop = log.scrollHeight; } }
function formQuiz() {
  openModal('Generate a quiz', `
    <form id="f">
      <label class="field"><span>Topic</span><input name="topic" required placeholder="e.g. Python dictionaries"></label>
      <div class="form-grid">
        <label class="field"><span>Questions</span><input name="count" type="number" min="3" max="15" value="5"></label>
        <label class="field"><span>Level</span><select name="level"><option>Beginner</option><option>Intermediate</option><option>Advanced</option></select></label>
      </div>
      <label class="field"><span>Base it on lesson content (optional - paste text)</span><textarea name="content"></textarea></label>
      <button class="btn btn-primary btn-block">Generate</button></form>
    <div id="aiOut"></div>`);
  hookAiForm('/api/ai/quiz');
}
function formOutline() {
  openModal('Draft a course outline', `
    <form id="f">
      <label class="field"><span>Course topic</span><input name="topic" required placeholder="e.g. Intro to LLM app development"></label>
      <div class="form-grid">
        <label class="field"><span>Weeks</span><input name="weeks" type="number" min="1" max="24" value="6"></label>
        <label class="field"><span>Audience</span><input name="audience" placeholder="e.g. beginners with basic Python"></label>
      </div>
      <button class="btn btn-primary btn-block">Draft outline</button></form>
    <div id="aiOut"></div>`);
  hookAiForm('/api/ai/outline');
}
function hookAiForm(path) {
  $('f').addEventListener('submit', async (e) => {
    e.preventDefault(); const f = e.target; const btn = f.querySelector('button'); btn.disabled = true; btn.textContent = 'Generating...'; modalMsg('');
    const obj = {}; new FormData(f).forEach((v, k) => { if (v !== '') obj[k] = v; });
    try {
      const out = await api(path, { method: 'POST', body: JSON.stringify(obj) });
      $('aiOut').innerHTML = `<div style="display:flex;justify-content:flex-end;margin:12px 0 6px"><button class="btn btn-ghost btn-sm" onclick="navigator.clipboard.writeText(this.parentNode.nextElementSibling.textContent).then(()=>toast('Copied.'))">Copy</button></div>
        <pre style="white-space:pre-wrap;background:var(--canvas);border:1px solid var(--line);border-radius:11px;padding:14px;font-size:13px;max-height:44vh;overflow-y:auto;font-family:var(--font-body)">${esc(out.markdown)}</pre>`;
      modalMsg('Done - review before using. Free-tier models are good, not perfect.', true);
    } catch (err) { modalMsg(err.message); }
    btn.disabled = false; btn.textContent = path.includes('quiz') ? 'Generate' : 'Draft outline';
  });
}


async function loadMyReports() {
  const box = $('myReports'); if (!box) return;
  try {
    const d = await api('/api/me/reports');
    if (!d.reports.length) { box.innerHTML = ''; return; }
    box.innerHTML = `<div class="card"><div class="card-head"><h3>Your skill reports</h3><span class="s" style="color:var(--muted)">Written with AI, reviewed by your teacher</span></div>
      <div class="card-body">${d.reports.map((r) => `
        <details style="margin-bottom:12px"><summary style="cursor:pointer;font-weight:600">${esc(r.course_title)} &middot; ${esc((r.published_at || r.created_at || '').slice(0, 10))}</summary>
        <pre style="white-space:pre-wrap;background:var(--canvas);border:1px solid var(--line);border-radius:11px;padding:14px;font-size:13px;font-family:var(--font-body);margin-top:8px">${esc(r.markdown)}</pre></details>`).join('')}</div></div>`;
  } catch { box.innerHTML = ''; }
}

/* ========================== AI SKILL REPORTS (teacher) ========================== */
async function aiSkillReport(uid, name) {
  openModal(`Skill report: ${name}`, `<div class="s" style="color:var(--muted)">Generating from grades, remarks, and activity&hellip; The student sees nothing until you publish.</div>`);
  try {
    const out = await api('/api/ai/skill-report', { method: 'POST', body: JSON.stringify({ user_id: uid, batch_id: bid() }) });
    showReportDraft(out.report, name);
  } catch (e) { modalMsg(e.message); }
}
function showReportDraft(r, name) {
  openModal(`Skill report: ${name}`, `
    <pre style="white-space:pre-wrap;background:var(--canvas);border:1px solid var(--line);border-radius:11px;padding:14px;font-size:13px;font-family:var(--font-body);max-height:44vh;overflow-y:auto">${esc(r.markdown)}</pre>
    <div style="display:flex;gap:10px;margin-top:14px">
      <button class="btn btn-primary" onclick="publishReport(${r.id})">Publish to student</button>
      <button class="btn btn-danger" onclick="discardReport(${r.id})">Discard draft</button>
    </div>`);
}
async function publishReport(rid) {
  try { await api(`/api/ai-reports/${rid}/publish`, { method: 'POST' }); toast('Published - the student can now see it on their profile.'); closeModal(); }
  catch (e) { modalMsg(e.message); }
}
async function discardReport(rid) {
  try { await api(`/api/ai-reports/${rid}`, { method: 'DELETE' }); toast('Draft discarded.'); closeModal(); }
  catch (e) { modalMsg(e.message); }
}
async function openBatchReports() {
  const d = await api(`/api/batches/${bid()}/reports`);
  openModal('Skill reports for this course', `
    <div class="card-body tight" style="max-height:56vh;overflow-y:auto">
      ${d.reports.length ? d.reports.map((r) => `
        <div class="list-row" style="padding:12px 4px">
          <div class="grow"><div class="t">${esc(r.student_name)}</div>
            <div class="s">${esc((r.created_at || '').slice(0, 16))} &middot; <strong>${esc(r.status)}</strong></div></div>
          <button class="btn btn-ghost btn-sm" onclick='showReportDraft(${JSON.stringify({ id: r.id, markdown: r.markdown }).replace(/'/g, "&#39;")}, "${esc(r.student_name).replace(/"/g, '&quot;')}")'>Open</button>
        </div>`).join('') : '<div class="empty">No reports yet - generate them from the Report tab.</div>'}
    </div>`);
}
async function aiClassSummary() {
  openModal('AI class summary', '<div class="s" style="color:var(--muted)">Analysing anonymised class data&hellip;</div>');
  try {
    const out = await api('/api/ai/class-summary', { method: 'POST', body: JSON.stringify({ batch_id: bid() }) });
    openModal('AI class summary', `<pre style="white-space:pre-wrap;background:var(--canvas);border:1px solid var(--line);border-radius:11px;padding:14px;font-size:13px;font-family:var(--font-body);max-height:52vh;overflow-y:auto">${esc(out.markdown)}</pre>`);
  } catch (e) { modalMsg(e.message); }
}

/* ================================ HACKATHONS ================================ */
function hackBadge(st) {
  const map = { upcoming: ['Upcoming', 'var(--st-beam)'], live: ['LIVE', 'var(--danger)'], ended: ['Ended', 'var(--muted-2)'], finalized: ['Finalized', 'var(--st-nova)'] };
  const [t, c] = map[st] || [st, 'var(--muted)'];
  return `<span class="stage-pill" style="background:${c}">${t}</span>`;
}
async function renderHackathons() {
  const el = $('view-hackathons');
  el.innerHTML = '<div class="empty">Loading&hellip;</div>';
  const d = await api('/api/hackathons');
  const adminBar = d.is_admin ? `<div class="card"><div class="card-body" style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
    <span class="s" style="color:var(--muted)">Time-boxed events with prizes. Paid events collect a payment reference (JazzCash / Easypaisa / bank) that you confirm before teams can submit.</span>
    <span style="flex:1"></span><button class="btn btn-primary btn-sm" onclick="formHackathon()">New hackathon</button></div></div>` : '';
  el.innerHTML = `${adminBar}
    <div class="card"><div class="card-head"><h3>Events</h3></div><div class="card-body tight">
      ${d.hackathons.length ? d.hackathons.map((h) => `
        <div class="list-row">
          <div class="when">${hackBadge(h.status)}<small>${esc(String(h.starts_at).replace('T', ' '))} &rarr; ${esc(String(h.ends_at).replace('T', ' '))}</small></div>
          <div class="grow">
            <div class="t">${esc(h.title)} <span class="s" style="font-weight:500;color:var(--muted)">&middot; ${h.mode === 'team' ? 'teams up to ' + h.team_max : 'solo'} &middot; ${h.entry === 'paid' ? 'PKR ' + h.fee_pkr : 'free entry'}</span></div>
            <div class="s">${h.theme ? esc(h.theme) + ' &middot; ' : ''}Prizes: ${h.prizes.first}/${h.prizes.second}/${h.prizes.third} gems &middot; ${h.entries} registered</div>
            ${h.my_entry ? `<div class="s" style="color:var(--ok)">Registered as ${esc(h.my_entry.team_name)}${h.my_entry.payment_status === 'pending' ? ' - <span style="color:var(--gold)">payment under confirmation</span>' : ''}${h.my_entry.payment_status === 'rejected' ? ' - <span style="color:var(--danger)">payment rejected, contact admin</span>' : ''}</div>` : ''}
          </div>
          <button class="btn btn-ghost btn-sm" onclick="openHackathon(${h.id})">Open</button>
          ${d.can_play && !h.my_entry && ['upcoming', 'live'].includes(h.status) ? `<button class="btn btn-teal btn-sm" onclick="formHackRegister(${h.id})">Register</button>` : ''}
        </div>`).join('') : '<div class="empty">No events yet' + (d.is_admin ? ' - create the first hackathon.' : '. Watch this space.') + '</div>'}
    </div></div>`;
}
let CURRENT_HACK = null;
async function openHackathon(id) {
  const d = await api(`/api/hackathons/${id}`);
  CURRENT_HACK = d;
  const h = d.hackathon;
  const isAdmin = ME.role === 'admin';
  const canSubmit = d.my_entry && h.status === 'live' && (h.entry !== 'paid' || d.my_entry.payment_status === 'confirmed');
  openModal(h.title, `
    <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:10px">${hackBadge(h.status)}
      <span class="s" style="color:var(--muted)">${esc(String(h.starts_at).replace('T', ' '))} &rarr; ${esc(String(h.ends_at).replace('T', ' '))} &middot; ${h.entry === 'paid' ? 'PKR ' + h.fee_pkr : 'free'} &middot; prizes ${h.prizes.first}/${h.prizes.second}/${h.prizes.third} gems</span></div>
    ${h.theme ? `<p class="s" style="margin-bottom:12px">${esc(h.theme)}</p>` : ''}
    ${canSubmit ? `<form id="hackSubmit" style="display:flex;gap:8px;margin-bottom:14px">
      <input name="link" type="url" required placeholder="https:// link to your project" style="flex:1;border:1px solid var(--line-strong);border-radius:10px;padding:9px 12px;font-size:13.5px;font-family:inherit">
      <button class="btn btn-teal">Submit project</button></form>` : ''}
    <div class="pub-sec" style="margin-top:6px">Leaderboard</div>
    <div class="card-body tight" style="max-height:34vh;overflow-y:auto">
      ${d.board.length ? d.board.map((s, i) => `
        <div class="lb-row top${i + 1}" style="padding:10px 4px">
          <div class="lb-rank">${s.score != null ? i + 1 : '·'}</div>
          <div class="lb-name">${esc(s.team_name)}<small>${s.members.map(esc).join(', ')}</small></div>
          <a class="s" href="${esc(s.link)}" target="_blank" rel="noopener">project</a>
          <strong style="min-width:44px;text-align:right">${s.score != null ? s.score : '—'}</strong>
          ${isAdmin && !h.finalized ? `<button class="btn btn-ghost btn-sm" onclick="scoreHackSub(${s.id},${h.id})">Score</button>` : ''}
        </div>`).join('') : '<div class="empty">No submissions yet.</div>'}
    </div>
    ${isAdmin ? `
      <div class="pub-sec">Entries${h.entry === 'paid' ? ' &amp; payments' : ''}</div>
      <div class="card-body tight" style="max-height:26vh;overflow-y:auto">
        ${(d.entries || []).map((e) => `
          <div class="list-row" style="padding:10px 4px">
            <div class="grow"><div class="t">${esc(e.team_name)}</div>
              <div class="s">${e.members.map((m) => esc(m.name) + ' (' + esc(m.reg_no || '—') + ')').join(', ')}</div>
              ${h.entry === 'paid' ? `<div class="s">Payment: <strong>${esc(e.payment_status)}</strong> &middot; ref <span class="mono">${esc(e.payment_ref || '—')}</span></div>` : ''}</div>
            ${h.entry === 'paid' && e.payment_status === 'pending' ? `
              <button class="btn btn-teal btn-sm" onclick="hackPay(${e.id},${h.id},true)">Confirm</button>
              <button class="btn btn-danger btn-sm" onclick="hackPay(${e.id},${h.id},false)">Reject</button>` : ''}
          </div>`).join('') || '<div class="empty">No entries yet.</div>'}
      </div>
      <div style="display:flex;gap:10px;margin-top:14px">
        ${!h.finalized ? `<button class="btn btn-primary" onclick="finalizeHack(${h.id})">Finalize &amp; award prizes</button>` : '<span class="s" style="color:var(--ok);font-weight:600">Prizes awarded.</span>'}
        <button class="btn btn-danger" onclick="delHackathon(${h.id})">Delete event</button>
      </div>` : ''}`);
  const f = $('hackSubmit');
  if (f) f.addEventListener('submit', async (e) => {
    e.preventDefault();
    try { await api(`/api/hackathons/${h.id}/submit`, { method: 'POST', body: JSON.stringify({ link: f.link.value.trim() }) }); toast('Project submitted.'); openHackathon(h.id); }
    catch (err) { modalMsg(err.message); }
  });
}
function formHackRegister(hid) {
  api(`/api/hackathons/${hid}`).then((d) => {
    const h = d.hackathon;
    openModal(`Register: ${h.title}`, `
      <form id="f">
        ${h.mode === 'team' ? `
          <label class="field"><span>Team name</span><input name="team_name" required placeholder="e.g. Neural Ninjas"></label>
          <label class="field"><span>Teammates - one reg no per line (up to ${h.team_max - 1}, optional)</span><textarea name="member_regs" placeholder="4821736"></textarea></label>` : ''}
        ${h.entry === 'paid' ? `
          <p class="hint" style="margin:0 0 10px">${esc(h.pay_instructions || 'Send PKR ' + h.fee_pkr + ' and enter your transaction reference below. Your entry unlocks once the admin confirms it.')}</p>
          <label class="field"><span>Payment reference / transaction ID</span><input name="payment_ref" required></label>` : ''}
        <button class="btn btn-primary btn-block">Register${h.entry === 'paid' ? ' (PKR ' + h.fee_pkr + ')' : ''}</button></form>`);
    $('f').addEventListener('submit', async (e) => {
      e.preventDefault(); const f = e.target; const btn = f.querySelector('button'); btn.disabled = true; modalMsg('');
      const member_regs = f.member_regs ? f.member_regs.value.split('\n').map((x) => x.trim()).filter(Boolean) : [];
      try {
        const out = await api(`/api/hackathons/${hid}/register`, { method: 'POST', body: JSON.stringify({ team_name: f.team_name ? f.team_name.value : undefined, member_regs, payment_ref: f.payment_ref ? f.payment_ref.value : undefined }) });
        if (out.missing && out.missing.length) modalMsg('Registered, but not found: ' + out.missing.join(', '), true);
        else { toast('Registered - good luck!'); closeModal(); }
        renderHackathons();
      } catch (err) { modalMsg(err.message); btn.disabled = false; }
    });
  });
}
function formHackathon() {
  openModal('New hackathon', `
    <form id="f">
      <label class="field"><span>Title</span><input name="title" required placeholder="e.g. EchoLens AI Build Night"></label>
      <label class="field"><span>Theme &amp; rules</span><textarea name="theme"></textarea></label>
      <div class="form-grid">
        <label class="field"><span>Starts</span><input name="starts_at" type="datetime-local" required></label>
        <label class="field"><span>Ends</span><input name="ends_at" type="datetime-local" required></label>
        <label class="field"><span>Mode</span><select name="mode"><option value="solo">Solo</option><option value="team">Teams</option></select></label>
        <label class="field"><span>Max team size</span><input name="team_max" type="number" min="1" max="6" value="4"></label>
        <label class="field"><span>Entry</span><select name="entry"><option value="free">Free</option><option value="paid">Paid</option></select></label>
        <label class="field"><span>Fee (PKR)</span><input name="fee_pkr" type="number" min="0" value="0"></label>
        <label class="field"><span>1st prize gems</span><input name="prize1" type="number" min="0" value="300"></label>
        <label class="field"><span>2nd prize gems</span><input name="prize2" type="number" min="0" value="150"></label>
        <label class="field"><span>3rd prize gems</span><input name="prize3" type="number" min="0" value="75"></label>
      </div>
      <label class="field"><span>Payment instructions (for paid events)</span><textarea name="pay_instructions" placeholder="e.g. JazzCash 03XX-XXXXXXX (EchoLens). Send the fee, then enter your transaction ID when registering."></textarea></label>
      <button class="btn btn-primary btn-block">Create event</button></form>`);
  $('f').addEventListener('submit', async (e) => {
    e.preventDefault(); const f = e.target; const obj = {}; new FormData(f).forEach((v, k) => { if (v !== '') obj[k] = v; });
    try { await api('/api/admin/hackathons', { method: 'POST', body: JSON.stringify(obj) }); toast('Event created.'); closeModal(); renderHackathons(); }
    catch (err) { modalMsg(err.message); }
  });
}
async function scoreHackSub(sid, hid) {
  const score = prompt('Score (0-100):'); if (score == null) return;
  const remarks = prompt('Remarks (optional):') || '';
  try { await api(`/api/admin/hackathon-submissions/${sid}/score`, { method: 'POST', body: JSON.stringify({ score, remarks }) }); toast('Scored.'); openHackathon(hid); }
  catch (e) { toast(e.message, true); }
}
async function hackPay(eid, hid, confirm) {
  try { await api(`/api/admin/hackathon-entries/${eid}/payment`, { method: 'POST', body: JSON.stringify({ confirm }) }); toast(confirm ? 'Payment confirmed.' : 'Payment rejected.'); openHackathon(hid); }
  catch (e) { toast(e.message, true); }
}
async function finalizeHack(hid) {
  if (!confirm('Finalize this event? Prize gems go to the top 3 scored teams. This cannot be undone.')) return;
  try {
    const out = await api(`/api/admin/hackathons/${hid}/finalize`, { method: 'POST' });
    toast('Prizes awarded: ' + out.winners.map((w) => '#' + w.rank + ' ' + w.team).join(', '));
    openHackathon(hid);
  } catch (e) { toast(e.message, true); }
}
async function delHackathon(hid) {
  if (!confirm('Delete this event and all its entries and submissions?')) return;
  try { await api(`/api/admin/hackathons/${hid}`, { method: 'DELETE' }); toast('Event deleted.'); closeModal(); renderHackathons(); }
  catch (e) { toast(e.message, true); }
}


/* ================================ QUEST TAB ================================ */
async function renderQuestTab(body) {
  body.innerHTML = '<div class="empty">Loading quest&hellip;</div>';
  const d = await api(`/api/batches/${bid()}/quest`);

  if (!d.installed) {
    if (d.tracks && d.tracks.length && CURRENT_BATCH.can_manage) {
      body.innerHTML = `<div class="card"><div class="card-body">
        <h3 style="margin-bottom:6px">No quest track installed yet</h3>
        <p class="s" style="color:var(--muted);margin-bottom:14px">Install a prebuilt gamified assignment ladder. Students climb level by level - each level unlocks only after you grade the previous one at a passing mark.</p>
        ${d.tracks.map((t) => `<div class="list-row" style="padding:12px 0">
          <div class="grow"><div class="t">${t.course_code ? `<span class="mono s" style="color:var(--teal-deep)">${esc(t.course_code)}</span> ` : ''}${esc(t.title)} <span class="s" style="font-weight:500;color:var(--muted)">&middot; ${t.levels} levels &middot; ${t.total_points} gems</span></div>
            <div class="s">${esc(t.description)}</div></div>
          <button class="btn btn-teal btn-sm" onclick="installTrack('${esc(t.key)}')">Install</button>
        </div>`).join('')}</div></div>`;
    } else {
      body.innerHTML = '<div class="card"><div class="empty">No quest track on this course yet.</div></div>';
    }
    return;
  }

  const p = d.progress;
  const isStudent = ME.role === 'student';
  const hero = `
    <div class="quest-hero"><div class="quest-hero-inner">
      <div style="flex:1;min-width:220px">
        <div class="prism-eyebrow">${esc(p.track.title)}</div>
        <div class="prism-stage" style="font-size:24px">${isStudent ? esc(p.title) : 'Instructor view'}</div>
        <div class="prism-sub">${isStudent
          ? (p.completed ? 'Track complete - legendary work.' : (p.next_title ? `${p.next_title.min - p.gems} gems to become <strong style="color:#fff">${esc(p.next_title.name)}</strong>` : 'Highest title earned'))
          : `Pass mark ${p.track.pass_mark}% &middot; ${d.pending || 0} submission${(d.pending || 0) === 1 ? '' : 's'} waiting for grades`}</div>
      </div>
      ${isStudent ? `<div class="prism-side">
        <div class="prism-stat"><div class="n">${p.gems}</div><div class="l">Track gems</div></div>
        <div class="prism-stat"><div class="n">${p.unlocked_up_to}</div><div class="l">Level</div></div>
      </div>` : ''}
      <span class="quest-title-chip"><span class="bd"></span>${p.track.titles.map((t) => esc(t.name)).join(' &rarr; ')}</span>
    </div></div>`;

  const map = `<div class="quest-map">${p.levels.map((l) => {
    const q = l.quest;
    const state = l.passed ? 'passed' : (l.unlocked ? 'current' : 'locked');
    const mySubFor = (pid) => d.my_subs[`${q.id}:${pid}`];
    return `<div class="quest-node ${state}" id="qn${q.id}">
      <div class="qgem"><div class="stone"></div></div>
      <div class="qbody">
        <div class="qhead" onclick="document.getElementById('qn${q.id}').classList.toggle('open')">
          <span class="lvl">W${q.week} &middot; LVL ${q.no}</span>
          <span class="qt">${esc(q.title)}<div class="qs">${esc(q.topic)}</div></span>
          <span class="qstate ${state}">${l.passed ? 'Passed' : (l.unlocked ? 'Open' : 'Locked')}</span>
        </div>
        <div class="qproblems">
          ${q.problems.map((pr) => {
            const sub = isStudent ? mySubFor(pr.pid) : null;
            let status = '';
            if (isStudent && sub) {
              status = sub.grade != null
                ? `<div class="s" style="margin-top:4px">Graded <strong>${sub.grade}%</strong> &middot; ${gemChip(sub.gems)} ${sub.remarks ? '&middot; &ldquo;' + esc(sub.remarks) + '&rdquo;' : ''}</div>`
                : `<div class="s" style="margin-top:4px;color:var(--gold)">Submitted - awaiting grade</div>`;
            }
            const refsHtml = (pr.refs || []).length ? `<div class="s" style="margin-top:5px">Resources: ${pr.refs.map((r) => `<a href="${esc(r[1])}" target="_blank" rel="noopener">${esc(r[0])}</a>`).join(' &middot; ')}</div>` : '';
            const solHtml = (!isStudent && pr.solution) ? `<details style="margin-top:6px"><summary class="s" style="cursor:pointer;color:var(--teal-deep);font-weight:600">Solution guideline (teachers only)</summary><div class="s" style="background:#FDF8EC;border:1px solid #F0E2BC;border-radius:9px;padding:9px 12px;margin-top:5px">${esc(pr.solution)}</div></details>` : '';
            return `<div class="qproblem">
              <span class="qdiff ${esc(pr.difficulty)}">${esc(pr.difficulty)}</span>
              <div style="flex:1;min-width:0">
                <div class="t" style="font-size:13.5px">${esc(pr.title)} <span class="s" style="font-weight:500;color:var(--muted)">&middot; ${pr.points} gems</span></div>
                <div class="s" style="white-space:pre-line">${esc(pr.description)}</div>${refsHtml}${solHtml}${status}
              </div>
              ${isStudent && l.unlocked && !l.passed ? `<button class="btn btn-teal btn-sm" onclick="formQuestSubmit(${q.id},${pr.pid},'${esc(pr.title).replace(/'/g, '&#39;')}')">${sub ? 'Resubmit' : 'Submit'}</button>` : ''}
              ${d.can_manage ? `<button class="btn btn-ghost btn-sm" onclick="formEditProblem(${q.id},${pr.pid})">Edit</button>` : ''}
              ${d.can_manage || ME.role === 'coordinator' ? `<button class="btn btn-ghost btn-sm" onclick="openQuestSubs(${q.id},${pr.pid})">Submissions</button>` : ''}
            </div>`;
          }).join('')}
        </div>
      </div>
    </div>`;
  }).join('')}</div>`;

  const top3 = d.scoreboard.slice(0, 3);
  const podium = top3.length >= 2 ? `<div class="podium">
      ${[1, 0, 2].filter((i) => top3[i]).map((i) => `
        <div class="pod pod${i + 1}"><div class="pod-gem"><div class="stone"></div></div>
          <div class="pod-name">${esc(top3[i].name.split(' ')[0])}</div>
          <div class="pod-gems">${top3[i].gems} gems</div>
          <div class="pod-block">${i + 1}</div></div>`).join('')}
    </div>` : '';
  const board = `<div class="card"><div class="card-head"><h3>Scoreboard</h3><span class="s" style="color:var(--muted)">Track gems &middot; level reached</span></div>
    ${podium}
    <div class="card-body tight">${d.scoreboard.length ? d.scoreboard.map((r, i) => `
      <div class="sb-row top${i + 1}${d.me && r.id === d.me.id ? ' me' : ''}">
        <div class="sb-rank">${i + 1}</div>
        <div class="sb-name"><span class="n">${esc(r.name)}</span><small>${esc(r.title)}${r.streak ? ' &middot; &#128293; ' + r.streak + 'd' : ''}</small></div>
        <span class="sb-level">LVL ${r.level}/${r.of}</span>
        ${gemChip(r.gems)}
      </div>`).join('') : '<div class="empty">No progress yet - the race starts now.</div>'}</div></div>`;

  const adminBar = ME.role === 'admin' ? `<div style="display:flex;justify-content:flex-end;margin-bottom:12px">
    <button class="btn btn-danger btn-sm" onclick="uninstallTrack()">Remove track from course</button></div>` : '';

  body.innerHTML = hero + adminBar + `
    <div style="display:grid;grid-template-columns:1.7fr 1fr;gap:20px;align-items:start" class="quest-grid">
      <div>${map}</div><div>${board}</div>
    </div>
    <style>@media (max-width:960px){.quest-grid{grid-template-columns:1fr !important}}</style>`;
  const cur = body.querySelector('.quest-node.current');
  if (cur) cur.classList.add('open');
}
async function installTrack(key) {
  try { await api(`/api/batches/${bid()}/install-track`, { method: 'POST', body: JSON.stringify({ track: key }) }); toast('Track installed - the quest begins.'); openCourse(bid()); }
  catch (e) { toast(e.message, true); }
}
async function uninstallTrack() {
  if (!confirm('Remove the track and ALL quest submissions and grades from this course? This cannot be undone.')) return;
  try { await api(`/api/batches/${bid()}/track`, { method: 'DELETE' }); toast('Track removed.'); openCourse(bid()); }
  catch (e) { toast(e.message, true); }
}
function formQuestSubmit(qid, pid, title) {
  openModal(`Submit: ${title}`, `
    <form id="f">
      <label class="field"><span>Your solution - PDF or Word only</span><input name="file" type="file" accept=".pdf,.doc,.docx" required></label>
      <p class="hint">Export your code/notebook and outputs into one PDF or Word document.</p>
      <label class="field"><span>Note to your instructor (optional)</span><textarea name="note"></textarea></label>
      <p class="hint">Your instructor grades this; the level average must reach the pass mark to unlock the next level.</p>
      <button class="btn btn-primary btn-block">Submit solution</button></form>`);
  $('f').addEventListener('submit', async (e) => {
    e.preventDefault(); const f = e.target; const btn = f.querySelector('button'); btn.disabled = true; modalMsg('');
    try { await api(`/api/quests/${qid}/problems/${pid}/submit`, { method: 'POST', body: new FormData(f) }); toast('Submitted - gems incoming once graded.'); closeModal(); openCourse(bid()); }
    catch (err) { modalMsg(err.message); btn.disabled = false; }
  });
}
async function openQuestSubs(qid, pid) {
  const d = await api(`/api/quests/${qid}/submissions`);
  const p = d.quest.problems.find((x) => x.pid === pid) || {};
  const subs = d.submissions.filter((s) => s.pid === pid);
  openModal(`${d.quest.title}: ${p.title}`, `
    <div class="card-body tight" style="max-height:56vh;overflow-y:auto">
      ${subs.length ? subs.map((s) => `
        <div class="list-row" style="padding:12px 4px">
          <div class="grow">
            <div class="t">${esc(s.student_name)} <span class="mono s" style="color:var(--muted)">${esc(s.student_reg || '')}</span></div>
            <div class="s">${esc((s.submitted_at || '').slice(0, 16))} ${s.note ? '&middot; &ldquo;' + esc(s.note) + '&rdquo;' : ''}</div>
            ${s.grade != null ? `<div class="s">Graded <strong>${s.grade}%</strong> &middot; ${s.gems} gems ${s.remarks ? '&middot; ' + esc(s.remarks) : ''}</div>` : '<div class="s" style="color:var(--gold)">Awaiting grade</div>'}
          </div>
          <a class="btn btn-ghost btn-sm" href="${esc(s.file_url)}" target="_blank" rel="noopener">Open file</a>
          ${CURRENT_BATCH.can_manage ? `<button class="btn btn-teal btn-sm" onclick="formQuestGrade(${s.id},${qid},${pid})">${s.grade != null ? 'Regrade' : 'Grade'}</button>` : ''}
        </div>`).join('') : '<div class="empty">No submissions for this problem yet.</div>'}
    </div>`);
}
function formQuestGrade(sid, qid, pid) {
  openModal('Grade quest submission', `
    ${ME.ai_enabled ? `<button class="btn btn-ghost btn-sm" id="aiDraftBtn" onclick="aiReview('quest',${sid})" style="margin-bottom:12px">&#10024; AI Review</button>
      <div id="aiRationale" style="display:none"></div>` : ''}
    <form id="f">
      <label class="field"><span>Grade (0&ndash;100%)</span><input name="grade" type="number" min="0" max="100" required></label>
      <label class="field"><span>Remarks for the student</span><textarea name="remarks" placeholder="What went well, what to improve"></textarea></label>
      <p class="hint">Gems = problem points &times; grade. When the level's average reaches the pass mark, the next level unlocks automatically.</p>
      <button class="btn btn-primary btn-block">Save grade</button></form>`);
  $('f').addEventListener('submit', async (e) => {
    e.preventDefault(); const f = e.target; const btn = f.querySelector('button[type="submit"],button:not([type])'); btn.disabled = true; modalMsg('');
    try {
      await api(`/api/quest-submissions/${sid}/grade`, { method: 'POST', body: JSON.stringify({ grade: f.grade.value, remarks: f.remarks.value }) });
      toast('Graded - gems awarded.'); await openCoursePreserveModal(); openQuestSubs(qid, pid);
    } catch (err) { modalMsg(err.message); btn.disabled = false; }
  });
}
async function aiQuestDraft(sid) {
  const btn = $('aiDraftBtn'); btn.disabled = true; btn.textContent = 'Thinking...';
  try {
    const out = await api('/api/ai/quest-grade-draft', { method: 'POST', body: JSON.stringify({ submission_id: sid }) });
    const f = $('f');
    if (out.draft.grade != null) f.grade.value = out.draft.grade;
    f.remarks.value = out.draft.remarks || '';
    const r = $('aiRationale');
    r.style.display = '';
    r.innerHTML = `<strong>AI rationale (only you see this):</strong> ${esc(out.draft.rationale || '—')}${out.readable ? '' : '<br><em>File not readable as text - draft is from the problem brief and note only. Review carefully.</em>'}`;
    modalMsg('Draft filled in - you decide what publishes.', true);
  } catch (e) { modalMsg(e.message); }
  btn.disabled = false; btn.innerHTML = '&#10024; Draft with AI';
}


/* ============================ AI REVIEW (unified) ============================ */
async function aiReview(kind, sid, force) {
  const btn = $('aiDraftBtn'); if (btn) { btn.disabled = true; btn.textContent = 'Reviewing...'; }
  try {
    const out = await api('/api/ai/review', { method: 'POST', body: JSON.stringify({ kind, submission_id: sid, force: !!force }) });
    const r = out.review;
    const f = $('f');
    if (f && r.suggested_score != null && !f.grade.value) f.grade.value = r.suggested_score;
    const box = $('aiRationale');
    box.style.display = '';
    box.innerHTML = `<div style="background:var(--canvas);border:1px solid var(--line);border-radius:11px;padding:12px 14px;margin-bottom:12px;font-size:12.5px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
        <strong>AI review (only staff see this)</strong>
        <span style="display:flex;gap:8px;align-items:center">${out.cached ? `<button class="btn btn-ghost btn-sm" onclick="aiReview('${kind}',${sid},true)">Regenerate</button>` : ''}
        <span class="s" style="color:var(--muted-2)">suggested: <strong>${r.suggested_score != null ? r.suggested_score + '%' : '—'}</strong></span></span>
      </div>
      ${[['Question', r.question_summary], ['What the student did', r.solution_summary], ['Key concepts grasped', r.key_concepts], ['Mistakes', r.mistakes], ['Better approach', r.better_approach]]
        .filter(([, v]) => v).map(([k, v]) => `<div style="margin-bottom:6px"><span style="font-weight:700;color:var(--navy)">${k}:</span> <span style="white-space:pre-line">${esc(v)}</span></div>`).join('')}
      ${r.readable === false ? '<div style="color:var(--danger)"><em>The file was not readable as text - review is based on the brief and note only. Open the file yourself.</em></div>' : ''}
      <div class="s" style="color:var(--muted-2);margin-top:4px">You decide the final score - edit anything before saving.</div>
    </div>`;
    modalMsg('AI review ready - the final score is yours.', true);
  } catch (e) { modalMsg(e.message); }
  if (btn) { btn.disabled = false; btn.innerHTML = '&#10024; AI Review'; }
}

/* =========================== EDIT QUEST PROBLEM =========================== */
function formEditProblem(qid, pid) {
  const lvl = CURRENT_QUEST_CACHE && CURRENT_QUEST_CACHE[`${qid}:${pid}`];
  api(`/api/batches/${bid()}/quest`).then((d) => {
    const q = d.progress.levels.map((l) => l.quest).find((x) => x.id === qid);
    const p = q.problems.find((x) => x.pid === pid);
    openModal(`Edit: ${p.title}`, `
      <form id="f">
        <label class="field"><span>Title</span><input name="title" value="${esc(p.title)}" required></label>
        <label class="field"><span>Description (real-world context + course link)</span><textarea name="description" style="min-height:130px">${esc(p.description)}</textarea></label>
        <div class="form-grid">
          <label class="field"><span>Gems (points)</span><input name="points" type="number" min="10" max="1000" value="${p.points}"></label>
          <label class="field"><span>Difficulty</span><select name="difficulty">${['Basic', 'Core', 'Boss'].map((x) => `<option${p.difficulty === x ? ' selected' : ''}>${x}</option>`).join('')}</select></label>
        </div>
        <label class="field"><span>Solution guideline (teachers/admin only - students never see this)</span><textarea name="solution" style="min-height:90px">${esc(p.solution || '')}</textarea></label>
        <label class="field"><span>Reference links - one per line as "Label | https://url"</span><textarea name="refs">${(p.refs || []).map((r) => `${r[0]} | ${r[1]}`).join('\n')}</textarea></label>
        <button class="btn btn-primary btn-block">Save changes</button></form>`);
    $('f').addEventListener('submit', async (e) => {
      e.preventDefault(); const f = e.target; const btn = f.querySelector('button'); btn.disabled = true; modalMsg('');
      const refs = f.refs.value.split('\n').map((l) => l.split('|').map((x) => x.trim())).filter((r) => r.length === 2 && r[1].startsWith('http'));
      try {
        await api(`/api/quests/${qid}/problems/${pid}`, { method: 'PATCH', body: JSON.stringify({ title: f.title.value, description: f.description.value, points: f.points.value, difficulty: f.difficulty.value, solution: f.solution.value, refs }) });
        toast('Problem updated for this course.'); closeModal(); openCourse(bid());
      } catch (err) { modalMsg(err.message); btn.disabled = false; }
    });
  });
}
let CURRENT_QUEST_CACHE = null;

/* =========================== OFFICIAL CATALOGUE =========================== */
async function loadOfficial() {
  try {
    const out = await api('/api/admin/catalogue/load-official', { method: 'POST' });
    toast(out.added ? `Added ${out.added} official courses.` : 'Catalogue already up to date.');
    renderCatalogue();
  } catch (e) { toast(e.message, true); }
}
