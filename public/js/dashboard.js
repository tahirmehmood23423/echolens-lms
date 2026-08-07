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
function roleLabel(r) { return { admin: 'Admin', instructor: 'Teacher', coordinator: 'Coordinator', student: 'Student', free: 'Free tier', hr: 'HR', finance: 'Finance', student_coordinator: 'Admissions Office', staff: 'Staff', ambassador: 'Ambassador', recruiter: 'Recruiter' }[r] || r; }
function isStaff() { return ['admin', 'coordinator', 'instructor'].includes(ME.role); }
// v17: isolated department portals - each role sees ONLY its own nav item
// and view, nothing else in the app (not courses, messages, jobs, etc).
// Recruiters (Talent Marketplace, Phase 1) work the same way: a pending
// account must see nothing but its own status screen.
const DEPT_ROLES = {
  hr: { view: 'dept-hr', label: 'HR' },
  finance: { view: 'dept-finance', label: 'Finance' },
  student_coordinator: { view: 'dept-student-coordinator', label: 'Admissions Office' },
  staff: { view: 'dept-staff', label: 'Staff' },
  ambassador: { view: 'dept-ambassador', label: 'Ambassador' },
  recruiter: { view: 'recruiter', label: 'Recruiter' },
};
function fmtDate(d) {
  if (!d) return '—';
  try { return new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }); } catch { return d; }
}
// "YYYY-MM" -> local Date at day 1. Deliberately NOT `new Date(m+'-01')`: a
// date-only string parses as UTC midnight, which rolls back a day (and often
// a month) once formatted in any timezone behind UTC.
function monthLabel(m, opts) {
  const [y, mo] = m.split('-').map(Number);
  return new Date(y, mo - 1, 1).toLocaleDateString('en-US', opts);
}
function gemIcon(color = 'url(#gemGrad)') {
  return `<svg viewBox="0 0 100 100" aria-hidden="true"><defs><linearGradient id="gemGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0FBFA8"/><stop offset=".55" stop-color="#38BDF8"/><stop offset="1" stop-color="#7C6CF5"/></linearGradient></defs><polygon points="50,4 90,34 74,92 26,92 10,34" fill="${color}"/><polygon points="50,4 90,34 50,50" fill="#fff" opacity=".25"/><polygon points="10,34 50,50 26,92" fill="#000" opacity=".12"/></svg>`;
}
function gemChip(n) { return `<span class="gem-chip">${gemIcon()}${n}</span>`; }
function drawAvatar() {
  const el = $('avatar'); if (!el) return;
  if (ME.avatar) el.innerHTML = `<img src="${esc(ME.avatar)}" alt="">`;
  else el.textContent = (ME.name || 'E').trim()[0].toUpperCase();
}
function avatarHtml(url, name, size = 34) {
  return url ? `<span class="avatar av-sm" style="width:${size}px;height:${size}px"><img src="${esc(url)}" alt=""></span>`
    : `<span class="avatar av-sm" style="width:${size}px;height:${size}px">${esc((name || 'E').trim()[0].toUpperCase())}</span>`;
}
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
function openModal(title, bodyHTML, wide) {
  $('modalTitle').textContent = title;
  $('modalBody').innerHTML = bodyHTML;
  modalMsg('');
  $('modalBox').classList.toggle('wide', !!wide);
  $('modal').classList.add('open');
}
function closeModal() { if (window.MODAL_LOCK) return; $('modal').classList.remove('open'); }
function modalMsg(text, ok) {
  const el = $('modalMsg');
  if (!text) { el.className = 'form-msg'; el.textContent = ''; return; }
  el.className = 'form-msg ' + (ok ? 'ok' : 'err'); el.textContent = text;
}
// Clicking outside a popup does NOT close it - forms stay open until the
// user closes them deliberately (the X button or Escape).
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });
document.addEventListener('click', (e) => {
  document.querySelectorAll('.dd-menu.open').forEach((m) => { if (!m.parentElement.contains(e.target)) m.classList.remove('open'); });
});

/* ------------------------------ navigation ------------------------------ */
const TITLES = {
  overview: 'Overview', courses: 'My courses', course: 'Course', schedule: 'Calendar',
  leaderboard: 'Leaderboard', announcements: 'Announcements', settings: 'Settings',
  challenges: 'Challenges', copilot: 'AI Copilot', hackathons: 'Hackathons',
  events: 'Events', 'admin-analytics': 'Reports', 'admin-mailer': 'Email Leads',
  'admin-catalogue': 'Courses', 'admin-users': 'Users',
  assignments: 'Assignments', quizzes: 'Quizzes', progress: 'Progress',
  certificates: 'Certificates', messages: 'Messages', resources: 'Resources',
  students: 'Students', grades: 'Grades', attendance: 'Attendance', analytics: 'Analytics',
  'admin-teachers': 'Teachers', 'admin-students': 'Students', 'admin-enrollments': 'Enrollments',
  'admin-finance': 'Finance', 'admin-announcements': 'Announcements', 'admin-feedback': 'Feedback', 'admin-logs': 'System Logs',
  jobs: 'Jobs', job: 'Job',
  'dept-hr': 'HR Portal', 'dept-finance': 'Finance Portal', 'dept-student-coordinator': 'Admissions Office Portal', 'dept-staff': 'Staff Portal', 'dept-ambassador': 'Ambassadors Portal',
  'my-department': 'My Department', 'admin-departments': 'Departments',
  'admin-recruiters': 'Recruiters', recruiter: 'Recruiter Portal',
  'showcase-moderation': 'Showcase Moderation',
  'talent-profile': 'Talent Profile', 'hiring-interest': 'Hiring Interest',
};
function show(view) {
  if (typeof CHAT_TIMER !== 'undefined' && CHAT_TIMER) { clearInterval(CHAT_TIMER); CHAT_TIMER = null; }
  document.querySelectorAll('.view').forEach((v) => v.classList.remove('active'));
  $(`view-${view}`).classList.add('active');
  document.querySelectorAll('.nav-item').forEach((n) => n.classList.toggle('active', n.dataset.view === view));
  $('pageTitle').textContent = TITLES[view] || 'EchoLens';
  $('sidebar').classList.remove('open');
  const render = {
    overview: renderOverview, courses: renderCourses, schedule: renderSchedule,
    leaderboard: renderLeaderboard, announcements: renderAnnouncements, settings: renderSettings,
    challenges: renderChallenges, copilot: renderCopilot, hackathons: renderHackathons,
    events: renderEvents, 'admin-analytics': renderAnalytics, 'admin-mailer': renderAdminMailer,
    'admin-catalogue': renderCatalogue, 'admin-users': renderUsers,
    assignments: renderAssignments, quizzes: renderQuizzesGlobal, progress: renderProgress,
    certificates: renderCertificates, messages: renderMessages, resources: renderResources,
    students: renderTeacherStudents, grades: renderTeacherGrades, attendance: renderTeacherAttendance,
    analytics: renderTeacherAnalytics,
    'admin-teachers': renderAdminTeachers, 'admin-students': renderAdminStudents,
    'admin-enrollments': renderAdminEnrollments, 'admin-finance': renderAdminFinance,
    'admin-announcements': renderAdminAnnouncementsPage, 'admin-feedback': renderAdminFeedback, 'admin-logs': renderAdminLogs,
    jobs: renderJobs,
    'dept-hr': renderDeptHR, 'dept-finance': renderDeptFinance, 'dept-student-coordinator': renderDeptStudentCoordinator, 'dept-staff': renderDeptStaff,
    'dept-ambassador': renderDeptAmbassador,
    'my-department': () => renderMyDepartments('view-my-department'),
    'admin-departments': renderAdminDepartments,
    'admin-recruiters': renderAdminRecruiters, recruiter: renderRecruiterPortal,
    'showcase-moderation': renderShowcaseModeration,
    'talent-profile': renderTalentProfile, 'hiring-interest': renderHiringInterest,
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
  drawAvatar();
  // v17: department portals (HR, Finance, Student Coordinator) are fully
  // isolated - hide every nav item and group except their own view and
  // account settings, then jump straight there instead of the overview.
  if (DEPT_ROLES[ME.role]) {
    document.querySelectorAll('.nav-item, .nav-group').forEach((el) => (el.style.display = 'none'));
    const own = document.querySelector(`.nav-item[data-view="${DEPT_ROLES[ME.role].view}"]`);
    if (own) own.style.display = '';
    const settingsNav = document.querySelector('.nav-item[data-view="settings"]');
    if (settingsNav) settingsNav.style.display = '';
    $('gate').style.display = 'none';
    $('app').style.display = '';
    show(DEPT_ROLES[ME.role].view);
    requireOnboarding();
    requireContractSubmission(false);
    return;
  }
  if (ME.role === 'admin') document.querySelectorAll('.admin-only').forEach((el) => (el.style.display = ''));
  if (['admin', 'coordinator'].includes(ME.role)) document.querySelectorAll('.staff-only').forEach((el) => (el.style.display = ''));
  if (ME.ai_enabled) document.querySelectorAll('.teacher-only').forEach((el) => (el.style.display = ''));
  if (ME.role === 'student') {
    document.querySelectorAll('.student-only').forEach((el) => (el.style.display = ''));
    refreshMessageBadge();
    wireTopSearch();
  }
  if (ME.role === 'instructor') {
    document.querySelectorAll('.instructor-only').forEach((el) => (el.style.display = ''));
    document.querySelectorAll('.instructor-hide').forEach((el) => (el.style.display = 'none'));
    $('bellBtn').style.display = '';
    refreshMessageBadge();
  }
  if (ME.role === 'admin') {
    document.querySelectorAll('.admin-hide').forEach((el) => (el.style.display = 'none'));
    $('topSearchWrap').style.display = '';
    $('topSearch').placeholder = 'Search for users, courses, reports...';
    wireAdminTopSearch();
    $('bellBtn').style.display = '';
    $('bellBtn').onclick = () => show('admin-logs');
  }
  if (ME.role === 'free') ['courses', 'schedule', 'announcements', 'assignments', 'quizzes', 'certificates', 'messages', 'resources'].forEach((v) => { const n = document.querySelector(`.nav-item[data-view="${v}"]`); if (n) n.style.display = 'none'; });
  if (ME.gamify && ME.gamify.streak > 0) {
    $('topStreak').style.display = '';
    $('topStreak').innerHTML = `&#128293; ${ME.gamify.streak}-day streak`;
  }
  if (ME.gamify) {
    $('topGems').style.display = '';
    $('topGems').innerHTML = gemChip(ME.gamify.gems);
  }
  $('gate').style.display = 'none';
  $('app').style.display = '';
  // /admin/recruiters is a real URL (Phase 1 asks for it specifically) into
  // this same single-page app - jump straight to the queue for an admin who
  // lands here directly; anyone else just gets the normal overview.
  if (location.pathname === '/admin/recruiters' && ME.role === 'admin') { show('admin-recruiters'); return; }
  renderOverview();
  requireWhatsapp(); // v12: contact details are mandatory for every learner
  requireOnboarding(); // instructors must complete their first-login profile
  requireContractSubmission(false);
})();
async function refreshMessageBadge() {
  try {
    const d = await api('/api/my/messages');
    const n = d.total_unread || 0;
    ['bellBadge', 'navMsgBadge'].forEach((id) => {
      const el = $(id);
      if (!el) return;
      el.style.display = n ? '' : 'none';
      el.textContent = n > 99 ? '99+' : String(n);
    });
  } catch {}
}
// v13: topbar quick-search - filters the student's own courses, quest
// levels, and open quizzes client-side (small data at this scale, so no
// dedicated /api/search endpoint). Modeled on the debounced admin student
// search at wireStudentSearch().
function wireTopSearch() {
  const inp = $('topSearch'); const out = $('topSearchResults');
  if (!inp || !out) return;
  let t = null;
  inp.addEventListener('input', () => {
    clearTimeout(t);
    const q = inp.value.trim().toLowerCase();
    if (q.length < 2) { out.classList.remove('open'); out.innerHTML = ''; return; }
    t = setTimeout(async () => {
      try {
        const [courses, quests, quizzes] = await Promise.all([api('/api/my/courses'), api('/api/my/quests'), api('/api/my/quizzes')]);
        const hits = [];
        courses.courses.forEach((c) => { if ((c.title || c.name || '').toLowerCase().includes(q)) hits.push({ label: c.title || c.name, sub: 'Course', action: `openCourse(${c.id})` }); });
        quests.courses.forEach((c) => c.levels.forEach((l) => { if (l.title.toLowerCase().includes(q)) hits.push({ label: `Level ${l.no}: ${l.title}`, sub: c.course_title, action: `show('assignments')` }); }));
        quizzes.open.forEach((qz) => { if (qz.title.toLowerCase().includes(q)) hits.push({ label: qz.title, sub: qz.course_title, action: `show('quizzes')` }); });
        out.innerHTML = hits.length
          ? hits.slice(0, 8).map((h) => `<button onclick="${h.action};closeTopSearch()">${esc(h.label)} <span class="s" style="color:var(--muted-2)">&middot; ${esc(h.sub)}</span></button>`).join('')
          : '<div class="empty" style="padding:10px">No matches.</div>';
        out.classList.add('open');
      } catch { out.innerHTML = ''; }
    }, 220);
  });
  inp.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeTopSearch(); });
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); inp.focus(); }
  });
}
function closeTopSearch() { const out = $('topSearchResults'); if (out) { out.classList.remove('open'); out.innerHTML = ''; } $('topSearch').blur(); }

/* v12: WhatsApp number is MANDATORY for students and open users - it feeds
 * the leads database the admin uses for announcements. The modal cannot be
 * dismissed until a number is saved. */
function requireWhatsapp() {
  if (!['student', 'free'].includes(ME.role)) return;
  if (ME.profile && ME.profile.phone) return;
  openModal('One last step - your WhatsApp number', `
    <form id="waForm">
      <p class="s" style="color:var(--muted);margin-bottom:12px">We use WhatsApp to share class updates, quest openings, and your certificates. This is required to continue.</p>
      <label class="field"><span>WhatsApp number</span><input name="whatsapp" required placeholder="03XX-XXXXXXX" inputmode="tel"></label>
      <button class="btn btn-primary btn-block">Save & continue</button></form>`);
  window.MODAL_LOCK = true;
  $('modalBox').querySelector('.close').style.display = 'none';
  $('waForm').addEventListener('submit', async (e) => {
    e.preventDefault(); const f = e.target; const btn = f.querySelector('button'); btn.disabled = true;
    try {
      await api('/api/me/contact', { method: 'POST', body: JSON.stringify({ whatsapp: f.whatsapp.value.trim() }) });
      ME.profile = ME.profile || {}; ME.profile.phone = f.whatsapp.value.trim();
      window.MODAL_LOCK = false;
      $('modalBox').querySelector('.close').style.display = '';
      closeModal(); toast('Saved - welcome aboard!');
    } catch (err) {
      if (err.message === 'Signed out.') { window.MODAL_LOCK = false; location.href = '/'; return; }
      modalMsg(err.message); btn.disabled = false;
    }
  });
}

/* Instructors, staff, ambassadors and HR must complete a first-login profile
 * (contact/address/qualifications, plus mandatory documents for instructors)
 * before using their portal - same non-dismissable pattern as
 * requireWhatsapp() above. Submitting auto-issues a contract by email for
 * ambassador/instructor - see requireContractSubmission() below. */
function requireOnboarding() {
  if (!['instructor', 'staff', 'ambassador', 'hr'].includes(ME.role)) return;
  if (ME.onboarding_complete) return;
  const isInstructor = ME.role === 'instructor';
  openModal('Complete your profile', `
    <form id="onboardForm">
      <p class="s" style="color:var(--muted);margin-bottom:12px">A few details for HR's records before you get started.</p>
      <div class="form-grid">
        <label class="field"><span>Phone</span><input name="phone" required placeholder="03XX-XXXXXXX" inputmode="tel"></label>
        <label class="field"><span>WhatsApp number</span><input name="whatsapp" required placeholder="03XX-XXXXXXX" inputmode="tel"></label>
      </div>
      <label class="field"><span>Father's name</span><input name="father_name" required></label>
      <label class="field"><span>Address</span><input name="address" required></label>
      <div class="form-grid">
        <label class="field"><span>Highest qualification</span><input name="education" required placeholder="e.g. BS Computer Science"></label>
        <label class="field"><span>Years of experience</span><input name="experience_years" type="number" min="0" placeholder="0 if none"></label>
      </div>
      ${isInstructor ? `
      <p class="hint" style="margin-top:12px">Instructor accounts require verification documents - these are mandatory to proceed.</p>
      <label class="field"><span>Degree(s) - PDF, Word or image</span><input name="degree_files" type="file" multiple required accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.webp"></label>
      <label class="field"><span>Transcript(s)</span><input name="transcript_files" type="file" multiple required accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.webp"></label>
      <label class="field"><span>Certification(s) - if any</span><input name="certification_files" type="file" multiple accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.webp"></label>` : ''}
      <button class="btn btn-primary btn-block">Save & continue</button></form>`);
  window.MODAL_LOCK = true;
  $('modalBox').querySelector('.close').style.display = 'none';
  $('onboardForm').addEventListener('submit', async (e) => {
    e.preventDefault(); const f = e.target; const btn = f.querySelector('button'); btn.disabled = true;
    try {
      const d = await api('/api/me/onboarding', { method: 'POST', body: new FormData(f) });
      ME.onboarding_complete = true;
      window.MODAL_LOCK = false;
      $('modalBox').querySelector('.close').style.display = '';
      closeModal();
      toast(d.contract ? 'Saved - your contract has been emailed to you.' : 'Saved - welcome aboard!');
      if (d.contract) requireContractSubmission(true);
    } catch (err) {
      if (err.message === 'Signed out.') { window.MODAL_LOCK = false; location.href = '/'; return; }
      modalMsg(err.message); btn.disabled = false;
    }
  });
}

/* -------- Ambassador/Instructor contract: sign & submit -------- *
 * Shown as a dismissable banner (not a MODAL_LOCK gate - unlike onboarding,
 * the portal itself is still usable while a contract is pending) with a live
 * 2-day countdown and a single .zip upload. Refreshed on login and again
 * right after onboarding issues a fresh contract. */
let MY_CONTRACT = null;
async function requireContractSubmission(fromOnboarding) {
  if (!['ambassador', 'instructor'].includes(ME.role)) return;
  try { MY_CONTRACT = (await api('/api/me/contract')).contract; } catch { return; }
  renderContractBanner();
  if (fromOnboarding && MY_CONTRACT && MY_CONTRACT.status === 'sent') formSubmitContract();
}
function renderContractBanner() {
  const host = $('contractBanner'); if (!host) return;
  if (!MY_CONTRACT || MY_CONTRACT.status === 'submitted') { host.innerHTML = ''; return; }
  const overdue = MY_CONTRACT.deadline_at && new Date(MY_CONTRACT.deadline_at).getTime() < Date.now();
  host.innerHTML = `<div class="card" style="margin-bottom:16px;border-color:${overdue ? 'var(--danger)' : 'var(--primary)'}"><div class="card-body" style="display:flex;gap:12px;align-items:center;flex-wrap:wrap">
    <div style="flex:1;min-width:220px">
      <strong>${overdue ? 'Your contract signing window has passed' : 'Sign & submit your contract'}</strong>
      <div class="s" style="color:var(--muted)">${overdue ? 'Contact HR to have it resent.' : `Print, sign, attach any required documents, and upload one .zip file by ${esc(new Date(MY_CONTRACT.deadline_at).toLocaleString('en-GB'))}.`}</div>
    </div>
    <a class="btn btn-ghost btn-sm" href="/uploads/contracts/${esc(MY_CONTRACT.pdf_filename)}" target="_blank">Download contract</a>
    ${overdue ? '' : '<button class="btn btn-primary btn-sm" onclick="formSubmitContract()">Upload signed zip</button>'}
  </div></div>`;
}
function formSubmitContract() {
  if (!MY_CONTRACT) return;
  openModal('Submit your signed contract', `<form id="f">
    <p class="s" style="color:var(--muted);margin-bottom:12px">Package your signed contract (and any supporting documents) into a single .zip file and upload it here.</p>
    <label class="field"><span>Signed contract + documents (.zip)</span><input name="file" type="file" accept=".zip" required></label>
    <button class="btn btn-primary btn-block">Submit</button></form>`);
  $('f').addEventListener('submit', async (e) => {
    e.preventDefault(); const f = e.target; const btn = f.querySelector('button'); btn.disabled = true; modalMsg('');
    try {
      await api('/api/contract/submit', { method: 'POST', body: new FormData(f) });
      closeModal(); toast('Submitted - your offer letter is on its way by email.');
      requireContractSubmission(false);
    } catch (err) { modalMsg(err.message); btn.disabled = false; }
  });
}

/* ============================== OVERVIEW ============================== */
async function renderOverview() {
  const el = $('view-overview');
  el.innerHTML = '<div class="empty">Loading&hellip;</div>';
  const d = await api('/api/overview');

  if (ME.role === 'student' && d.gamify) { renderStudentOverview(el, d); return; }
  if (ME.role === 'instructor' && d.teaching) { renderInstructorOverview(el, d); return; }
  if (ME.role === 'admin' && d.dashboard) { renderAdminOverview(el, d); return; }

  let top = '';
  if (ME.role === 'free' && d.gamify) {
    top = prismCard(d.gamify) + `
    <div class="card"><div class="card-body" style="display:flex;gap:14px;align-items:center;flex-wrap:wrap">
      <div style="flex:1;min-width:220px">
        <strong>You're on the free tier.</strong>
        <div class="s" style="color:var(--muted)">${d.free.open_challenges} open challenge${d.free.open_challenges === 1 ? '' : 's'} &middot; ${d.free.solved} solved by you. Earn gems, climb stages, share your profile. Want full courses, live classes, and teacher feedback? <a href="mailto:info@echolens.digital">Ask about the portal</a>.</div>
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
  el.innerHTML = `
    ${top}
    <div style="display:grid;grid-template-columns:1.6fr 1fr;gap:20px;align-items:start" class="ovr-grid">
      <div>
        <div class="card"><div class="card-head"><h3>Upcoming classes</h3><button class="btn btn-ghost btn-sm" onclick="show('schedule')">Full schedule</button></div>
          <div class="card-body tight">${d.upcoming.length ? d.upcoming.map(sessionRow).join('') : emptyScheduleHTML()}</div></div>
        <div class="card"><div class="card-head"><h3>Latest announcements</h3><button class="btn btn-ghost btn-sm" onclick="show('announcements')">All</button></div>
          <div class="card-body tight">${d.announcements.length ? d.announcements.map(annRow).join('') : '<div class="empty">Nothing yet.</div>'}</div></div>
      </div>
      <div>
        <div class="card"><div class="card-head"><h3>Top learners</h3></div>
          <div class="card-body tight">${(d.leaderboard || []).slice(0, 8).map(lbRow).join('') || '<div class="empty">No gems earned yet.</div>'}</div></div>
      </div>
    </div>
    <style>@media (max-width:900px){.ovr-grid{grid-template-columns:1fr !important}}</style>`;
  requestAnimationFrame(() => { const f = el.querySelector('.prism-fill'); if (f) f.style.width = f.dataset.w + '%'; });
}

/* v14: a friendly illustration for empty schedule areas, instead of a bare line of text. */
function emptyScheduleHTML(sub) {
  return `<div class="empty-illustration">
    <svg width="72" height="72" viewBox="0 0 72 72" aria-hidden="true">
      <circle cx="36" cy="36" r="36" fill="var(--violet-soft)"/>
      <rect x="20" y="24" width="32" height="28" rx="4" fill="none" stroke="var(--primary)" stroke-width="2.2"/>
      <path d="M20 32h32" stroke="var(--primary)" stroke-width="2.2"/>
      <path d="M27 20v8M45 20v8" stroke="var(--primary)" stroke-width="2.2" stroke-linecap="round"/>
      <path d="M29 40l5 5 9-9" fill="none" stroke="var(--primary)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
    <div class="empty-title">No upcoming activities</div>
    <div class="empty-sub">${esc(sub || "You're all caught up - check back soon.")}</div>
  </div>`;
}

/* -------------------------- teacher overview (v15) -------------------------- */
const T_ICONS = {
  book: '<svg viewBox="0 0 24 24"><path d="M4 5h16v14H4z"/><path d="M4 9h16"/></svg>',
  clipboard: '<svg viewBox="0 0 24 24"><rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 3h6v3H9z"/><path d="M8.5 12l2 2 4-4.5"/></svg>',
  people: '<svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.5 3-5.5 6.5-5.5s6.5 2 6.5 5.5"/><circle cx="17.5" cy="9" r="2.6"/><path d="M15.5 14.8c3 0 6 1.7 6 5.2"/></svg>',
  trend: '<svg viewBox="0 0 24 24"><path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/></svg>',
  plus: '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
  megaphone: '<svg viewBox="0 0 24 24"><path d="M3 11l14-6v14L3 13z"/><path d="M7 12v5"/></svg>',
  upload: '<svg viewBox="0 0 24 24"><path d="M12 16V4M7 9l5-5 5 5"/><path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/></svg>',
  chart: '<svg viewBox="0 0 24 24"><path d="M4 20V10M10 20V4M16 20v-8M22 20H2"/></svg>',
  check: '<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 9h18M8 2v4M16 2v4"/><path d="M8 14l2.5 2.5L16 11"/></svg>',
};
const TC_PALETTE = ['#1F2937', '#6D5DF6', '#0FBFA8', '#38BDF8', '#F0A82A', '#7C3AED'];
function courseColor(id) { return TC_PALETTE[Number(id) % TC_PALETTE.length]; }
function tpStat(color, icon, n, label, sub, subCls) {
  return `<div class="tp-stat"><div class="tp-ic ${color}">${icon}</div>
    <div><div class="n">${n}</div><div class="l">${esc(label)}</div>${sub ? `<div class="sub ${subCls || 'info'}">${esc(sub)}</div>` : ''}</div></div>`;
}
function qaBtn(color, icon, label, onclick) {
  return `<button type="button" class="qa-btn" onclick="${onclick}"><div class="tp-ic ${color}">${icon}</div><span class="lbl">${esc(label)}</span></button>`;
}
function qaItem(color, icon, label, onclick) {
  return `<button type="button" class="qa-item" onclick="${onclick}"><div class="tp-ic ${color}">${icon}</div><span class="lbl">${esc(label)}</span>
    <svg class="qa-arrow" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg></button>`;
}
function classStatus(s) {
  const mk = (t) => { if (!t) return null; const [h, m] = t.split(':').map(Number); const d = new Date(); d.setHours(h, m || 0, 0, 0); return d; };
  const now = new Date(), start = mk(s.start_time), end = mk(s.end_time);
  if (start && now >= start && (!end || now <= end)) return { cls: 'live', label: 'Live now' };
  if (start && now < start) {
    const diffMin = Math.round((start - now) / 60000);
    return diffMin < 60 ? { cls: 'soon', label: `Starts in ${diffMin}m` } : { cls: 'later', label: `Starts in ${Math.round(diffMin / 60)}h` };
  }
  return { cls: 'later', label: 'Today' };
}
function tcRow(s) {
  const st = classStatus(s);
  const btn = st.cls === 'live'
    ? `<button class="btn btn-primary btn-sm" onclick="openCourse(${s.batch_id},'Classes')">Join Class</button>`
    : `<button class="btn btn-ghost btn-sm" onclick="openCourse(${s.batch_id},'Classes')">View Details</button>`;
  return `<div class="tc-row">
    <div class="tc-ic" style="background:${courseColor(s.batch_id)}">${T_ICONS.book}</div>
    <div class="tc-when">${s.start_time ? esc(s.start_time) : '&mdash;'}</div>
    <div class="tc-main"><div class="t">${esc(s.title)}</div><div class="s">${esc(s.course_title || '')}${s.batch_name ? ' &middot; ' + esc(s.batch_name) : ''}</div></div>
    <span class="tc-status ${st.cls}"><span class="dot"></span>${st.label}</span>
    ${btn}
  </div>`;
}
function rvRow(r) {
  const pct = r.total ? Math.round((r.submitted / r.total) * 100) : 0;
  return `<div class="rv-row">
    <div class="rv-ic">${T_ICONS.clipboard}</div>
    <div class="rv-main">
      <div class="t">${esc(r.title)}</div>
      <div class="s">Submitted: ${r.submitted}/${r.total}</div>
      <div class="cl-bar" style="margin-top:6px"><div class="cl-fill rv-fill" data-w="${pct}"></div></div>
    </div>
    <span class="rv-badge" style="cursor:pointer" onclick="reviewSubmission(${r.batch_id},${r.quest_id},${r.pid})">${r.to_review} to review</span>
  </div>`;
}
function timeAgo(ts) {
  if (!ts) return '';
  const diff = Math.max(0, (Date.now() - new Date(String(ts).replace(' ', 'T') + 'Z').getTime()) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
  if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
  return Math.floor(diff / 86400) + 'd ago';
}
function msgRow(t) {
  const m = t.last_message;
  return `<div class="msg-row" style="cursor:pointer" onclick="openMessageThread(${t.batch_id})">
    ${avatarHtml(m.avatar, m.display_name, 36)}
    <div style="flex:1;min-width:0">
      <div class="t">${esc(m.display_name)}${t.unread ? ` <span class="bell-badge" style="position:static;display:inline-flex">${t.unread}</span>` : ''}</div>
      <div class="s">${esc(t.course_title)} &middot; ${esc(m.body).slice(0, 60)}${m.body.length > 60 ? '&hellip;' : ''}</div>
    </div>
    <span class="msg-when">${timeAgo(m.created_at)}</span>
  </div>`;
}
async function loadTeacherRecentMessages() {
  const box = $('tpMessages'); if (!box) return;
  try {
    const d = await api('/api/my/messages');
    const withMsg = d.threads.filter((t) => t.last_message)
      .sort((a, b) => String(b.last_message.created_at).localeCompare(String(a.last_message.created_at))).slice(0, 5);
    box.innerHTML = withMsg.length ? withMsg.map(msgRow).join('') : '<div class="empty">No messages yet.</div>';
  } catch { box.innerHTML = '<div class="empty">Could not load messages.</div>'; }
}
async function renderInstructorOverview(el, d) {
  const t = d.teaching;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = esc((ME.name || '').split(' ')[0] || 'there');
  const dateStr = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const liveCount = t.today_sessions.filter((s) => classStatus(s).cls === 'live').length;
  const upcomingCount = t.today_sessions.length - liveCount;
  const classesSub = t.today_sessions.length ? `${liveCount} live &middot; ${upcomingCount} upcoming` : 'Nothing scheduled';
  const reviewSub = t.assignments_to_review.length ? `${t.assignments_to_review.length} assignment${t.assignments_to_review.length === 1 ? '' : 's'} waiting` : 'All caught up';

  el.innerHTML = `
    <div class="tp-head">
      <div><h2>${greeting}, ${firstName} &#128075;</h2><div class="s">Here's what's happening in your classes today.</div></div>
      <div class="tp-date"><svg viewBox="0 0 24 24" fill="none" stroke-width="2"><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 9h18M8 2v4M16 2v4"/></svg>${esc(dateStr)}</div>
    </div>
    <div class="tp-stat-grid">
      ${tpStat('violet', T_ICONS.book, t.today_sessions.length, 'Classes Today', classesSub, liveCount ? 'up' : 'info')}
      ${tpStat('teal', T_ICONS.clipboard, t.pending_to_grade, 'Assignments to Review', reviewSub, t.pending_to_grade ? 'warn' : 'up')}
      ${tpStat('sky', T_ICONS.people, t.active_students, 'Active Students', `Across ${d.courses.length} course${d.courses.length === 1 ? '' : 's'}`, 'info')}
      ${tpStat('gold', T_ICONS.trend, t.avg_progress + '%', 'Avg. Class Progress', 'Quest completion', 'info')}
    </div>
    <div class="tp-grid">
      <div>
        <div class="card"><div class="card-head"><h3>Today's Classes</h3><button class="btn btn-ghost btn-sm" onclick="show('schedule')">View full schedule</button></div>
          <div class="card-body tight">${t.today_sessions.length ? t.today_sessions.map(tcRow).join('') : emptyScheduleHTML('No classes scheduled for today.')}</div></div>
        <div class="card"><div class="card-head"><h3>Assignments to Review</h3><button class="btn btn-ghost btn-sm" onclick="show('grades')">View all</button></div>
          <div class="card-body tight">${t.assignments_to_review.length ? t.assignments_to_review.map(rvRow).join('') : '<div class="empty">Nothing waiting for grades - nice work.</div>'}</div></div>
      </div>
      <div>
        <div class="card"><div class="card-head"><h3>Recent Messages</h3><button class="btn btn-ghost btn-sm" onclick="show('messages')">View all</button></div>
          <div class="card-body tight" id="tpMessages"><div class="empty">Loading&hellip;</div></div></div>
        <div class="card"><div class="card-head"><h3>Quick Actions</h3></div>
          <div class="card-body"><div class="qa-list">
            ${qaItem('violet', T_ICONS.plus, 'Create Assignment', "teacherQuickAction('assignment')")}
            ${qaItem('teal', T_ICONS.people, 'Take Attendance', "show('attendance')")}
            ${qaItem('gold', T_ICONS.clipboard, 'Grade Submissions', "show('grades')")}
            ${qaItem('sky', T_ICONS.megaphone, 'Create Announcement', "teacherQuickAction('announcement')")}
            ${qaItem('violet', T_ICONS.upload, 'Upload Material', "teacherQuickAction('material')")}
            ${qaItem('teal', T_ICONS.chart, 'View Analytics', "show('analytics')")}
          </div></div></div>
      </div>
    </div>`;
  requestAnimationFrame(() => el.querySelectorAll('.rv-fill').forEach((f) => (f.style.width = f.dataset.w + '%')));
  loadTeacherRecentMessages();
}
async function reviewSubmission(batchId, questId, pid) {
  await openCourse(batchId);
  if (typeof openQuestSubs === 'function') openQuestSubs(questId, pid);
}
async function teacherQuickAction(kind) {
  const d = await api('/api/overview');
  const courses = d.courses || [];
  if (!courses.length) { toast('You are not assigned to any course yet.', true); return; }
  if (courses.length === 1) return teacherQuickActionGo(kind, courses[0].id);
  const label = { assignment: 'Create assignment - choose a course', announcement: 'Post announcement - choose a course', material: 'Upload material - choose a course' }[kind];
  openModal(label, `
    <form id="f">
      <label class="field"><span>Course</span><select name="batch_id">${courses.map((c) => `<option value="${c.id}">${esc(c.title || c.name)}</option>`).join('')}</select></label>
      <button class="btn btn-primary btn-block">Continue</button></form>`);
  $('f').addEventListener('submit', (e) => { e.preventDefault(); closeModal(); teacherQuickActionGo(kind, Number(e.target.batch_id.value)); });
}
async function teacherQuickActionGo(kind, batchId) {
  await openCourse(batchId);
  if (kind === 'announcement') formAnnouncement();
  else if (kind === 'material') formLesson();
}

/* -------------------------- admin overview (v16) -------------------------- */
T_ICONS.finance = '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v10M9 15c0 1.1 1.3 2 3 2s3-.9 3-2-1.3-1.7-3-2-3-.9-3-2 1.3-2 3-2 3 .9 3 2"/></svg>';
T_ICONS.gear = '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/></svg>';
T_ICONS.check = '<svg viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg>';
T_ICONS.x = '<svg viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>';
function fmtCompactMoney(n) {
  n = Number(n) || 0;
  if (n >= 1000000) return (n / 1000000).toFixed(2) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return n.toLocaleString();
}
function pctSub(delta) {
  return { text: `${delta > 0 ? '+' : ''}${delta}% this week`, cls: delta > 0 ? 'up' : (delta < 0 ? 'warn' : 'info') };
}
/* A single-hue line chart with a hover crosshair + tooltip - no legend needed
 * for one series (the card title already names it). Coordinates are in SVG
 * viewBox space; the tooltip is positioned in real pixels via the SVG's
 * bounding rect so it lines up regardless of how the card is sized. */
function growthLineChart(labels, counts) {
  const W = 760, H = 260, PL = 40, PR = 12, PT = 16, PB = 28;
  const n = Math.max(1, labels.length);
  const max = Math.max(1, ...counts);
  const niceMax = Math.ceil(max / 4) * 4 || 4;
  const x = (i) => PL + (n > 1 ? (i * (W - PL - PR)) / (n - 1) : (W - PL - PR) / 2);
  const y = (v) => H - PB - (v / niceMax) * (H - PT - PB);
  const pts = counts.map((v, i) => [x(i), y(v)]);
  const path = pts.map((p, i) => (i === 0 ? 'M' : 'L') + p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ');
  const gridY = [0, 0.25, 0.5, 0.75, 1].map((f) => {
    const gy = y(niceMax * f);
    return `<line x1="${PL}" y1="${gy.toFixed(1)}" x2="${W - PR}" y2="${gy.toFixed(1)}" stroke="var(--line)" stroke-width="1"/><text x="${PL - 8}" y="${(gy + 3.5).toFixed(1)}" text-anchor="end" font-size="10" fill="var(--muted-2)">${Math.round(niceMax * f)}</text>`;
  }).join('');
  const xLabels = labels.map((l, i) => `<text x="${x(i).toFixed(1)}" y="${H - 8}" text-anchor="middle" font-size="10" fill="var(--muted-2)">${esc(l)}</text>`).join('');
  const dots = pts.map((p, i) => `<circle class="gc-dot" cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="3.5" fill="var(--primary)" stroke="#fff" stroke-width="1.5"/>`).join('');
  const hw = (W - PL - PR) / n;
  const hits = pts.map((p, i) => `<rect class="gc-hit" data-i="${i}" x="${(p[0] - hw / 2).toFixed(1)}" y="0" width="${hw.toFixed(1)}" height="${H - PB}" fill="transparent"/>`).join('');
  return `<div class="gc-wrap">
    <svg class="gc-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="Line chart">
      ${gridY}
      <path d="${path}" fill="none" stroke="var(--primary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      ${dots}${xLabels}
      <line class="gc-crosshair" x1="0" y1="0" x2="0" y2="${H - PB}" stroke="var(--muted-2)" stroke-width="1" stroke-dasharray="3,3" opacity="0"/>
      ${hits}
    </svg>
    <div class="gc-tooltip" style="display:none"></div>
  </div>`;
}
function wireGrowthChart(root, tipLabels, counts, fmtVal) {
  const svg = root.querySelector('.gc-svg'); if (!svg) return;
  const tip = root.querySelector('.gc-tooltip');
  const crosshair = root.querySelector('.gc-crosshair');
  const dots = root.querySelectorAll('.gc-dot');
  const vb = svg.viewBox.baseVal;
  const showAt = (i) => {
    const rect = svg.getBoundingClientRect();
    const sx = rect.width / vb.width, sy = rect.height / vb.height;
    const cx = Number(dots[i].getAttribute('cx')), cy = Number(dots[i].getAttribute('cy'));
    crosshair.setAttribute('x1', cx); crosshair.setAttribute('x2', cx); crosshair.setAttribute('opacity', '1');
    dots.forEach((d, j) => d.setAttribute('r', j === i ? '5' : '3.5'));
    tip.style.display = 'block';
    tip.innerHTML = `<strong>${esc(tipLabels[i])}</strong><div>${esc(fmtVal(counts[i]))}</div>`;
    let left = cx * sx - tip.offsetWidth / 2;
    left = Math.max(4, Math.min(rect.width - tip.offsetWidth - 4, left));
    tip.style.left = left + 'px';
    tip.style.top = Math.max(0, cy * sy - tip.offsetHeight - 12) + 'px';
  };
  root.querySelectorAll('.gc-hit').forEach((h) => {
    h.addEventListener('mouseenter', () => showAt(Number(h.dataset.i)));
    h.addEventListener('mousemove', () => showAt(Number(h.dataset.i)));
  });
  root.addEventListener('mouseleave', () => {
    tip.style.display = 'none'; crosshair.setAttribute('opacity', '0');
    dots.forEach((d) => d.setAttribute('r', '3.5'));
  });
}
async function reloadGrowthChart() {
  const sel = $('gcGranularity').value;
  const gran = sel === 'year' ? 'monthly' : 'daily';
  const d = await api(`/api/admin/analytics?metric=signups&segment=all&granularity=${gran}`);
  let labels = d.series.labels, counts = d.series.counts;
  if (sel === 'week') { labels = labels.slice(-7); counts = counts.slice(-7); }
  const axisLabels = labels.map((l) => gran === 'monthly' ? monthLabel(l, { month: 'short' }) : new Date(l + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'short' }));
  const tipLabels = labels.map((l) => gran === 'monthly' ? monthLabel(l, { month: 'long', year: 'numeric' }) : new Date(l + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }));
  const wrap = $('growthChartWrap');
  wrap.innerHTML = growthLineChart(axisLabels, counts);
  wireGrowthChart(wrap, tipLabels, counts, (v) => `${v.toLocaleString()} sign-ups`);
}
function regRow(u) {
  return `<div class="reg-row">
    ${avatarHtml(u.avatar, u.name, 36)}
    <div style="flex:1;min-width:0"><div class="t">${esc(u.name)}</div><div class="s">${esc(u.email || 'No email on file')}</div></div>
    <span class="role-badge ${esc(u.role)}">${esc(roleLabel(u.role))}</span>
    <span class="msg-when">${timeAgo(u.created_at)}</span>
  </div>`;
}
function healthRow(h) {
  return `<div class="health-row">
    <div class="dot-ic ${h.ok ? 'ok' : 'bad'}">${h.ok ? T_ICONS.check : T_ICONS.x}</div>
    <div class="t">${esc(h.name)}</div>
    <div class="s" style="color:var(--muted);margin-right:10px">${esc(h.detail)}</div>
    <span class="status ${h.ok ? 'ok' : 'bad'}">${h.ok ? 'Operational' : 'Attention needed'}</span>
  </div>`;
}
function logRow(e) {
  return `<div class="log-row ${esc(e.kind)}"><div class="log-dot"></div>
    <div><div class="t">${esc(e.text)}</div><div class="s">${esc((e.at || '').slice(0, 16))}</div></div></div>`;
}
function topCourseRow(c) {
  return `<div class="tc-row" style="padding:12px 20px">
    <div class="tc-ic" style="background:${courseColor(c.course_id)}">${T_ICONS.book}</div>
    <div class="tc-main"><div class="t">${esc(c.title)}</div></div>
    <span class="s" style="color:var(--muted);white-space:nowrap">${c.students} Enrollment${c.students === 1 ? '' : 's'}</span>
  </div>`;
}
function annRowAdmin(a) {
  return `<div class="msg-row">
    <div class="rv-ic">${T_ICONS.megaphone}</div>
    <div style="flex:1;min-width:0"><div class="t">${esc(a.title)}</div>
      <div class="s">${esc(a.body).slice(0, 90)}${a.body.length > 90 ? '&hellip;' : ''}</div>
      <div class="s" style="color:var(--muted-2);margin-top:2px">${esc((a.created_at || '').slice(0, 10))} &middot; ${esc(a.author_name)}</div></div>
  </div>`;
}
function adminQuickAddUser() {
  openModal('Add a new user', `
    <div class="s" style="color:var(--muted);margin-bottom:14px">Students and teachers are added directly on a course. Coordinators are global accounts and can be added here.</div>
    <button class="btn btn-primary btn-block" style="margin-bottom:10px" onclick="closeModal();formCoordinator()">Add a coordinator</button>
    <button class="btn btn-ghost btn-block" onclick="closeModal();show('admin-catalogue')">Go to Courses to add a student or teacher</button>`);
}
async function renderAdminOverview(el, d) {
  const dash = d.dashboard, t = dash.totals;
  const firstName = esc((ME.name || '').split(' ')[0] || 'there');
  const dateStr = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const su = pctSub(t.total_users_delta), sc = pctSub(t.courses_delta), sst = pctSub(t.students_delta), se = pctSub(t.enrollments_delta);
  const growthLabels = dash.growth.labels.map((l) => new Date(l + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'short' }));
  const growthTipLabels = dash.growth.labels.map((l) => new Date(l + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }));
  const pendingReviews = (d.admin && d.admin.pending_challenge_reviews) || 0;
  $('bellBadge').style.display = pendingReviews ? '' : 'none';
  $('bellBadge').textContent = pendingReviews > 99 ? '99+' : String(pendingReviews);

  el.innerHTML = `
    <div class="tp-head">
      <div><h2>Welcome back, ${firstName} &#128075;</h2><div class="s">Here's what's happening in EchoLens.</div></div>
      <div class="tp-date"><svg viewBox="0 0 24 24" fill="none" stroke-width="2"><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 9h18M8 2v4M16 2v4"/></svg>${esc(dateStr)}</div>
    </div>
    <div class="tp-stat-grid">
      ${tpStat('violet', T_ICONS.people, t.total_users.toLocaleString(), 'Total Users', su.text, su.cls)}
      ${tpStat('sky', T_ICONS.book, t.courses, 'Courses', sc.text, sc.cls)}
      ${tpStat('teal', T_ICONS.trend, t.students.toLocaleString(), 'Active Students', sst.text, sst.cls)}
      ${tpStat('gold', T_ICONS.clipboard, t.enrollments.toLocaleString(), 'Enrollments', se.text, se.cls)}
      ${tpStat('violet', T_ICONS.finance, 'PKR ' + fmtCompactMoney(t.revenue_this_month), `Revenue (${esc(t.revenue_month_label)})`, 'Estimated', 'info')}
    </div>
    <div class="ap-3col wide-first">
      <div class="card">
        <div class="card-head"><h3>User Growth Overview</h3>
          <div class="gc-toolbar"><select id="gcGranularity" onchange="reloadGrowthChart()">
            <option value="week">This Week</option><option value="month">This Month</option><option value="year">This Year</option>
          </select></div>
        </div>
        <div id="growthChartWrap">${growthLineChart(growthLabels, dash.growth.counts)}</div>
      </div>
      <div class="card">
        <div class="card-head"><h3>Recent Registrations</h3><button class="btn btn-ghost btn-sm" onclick="show('admin-users')">View all</button></div>
        <div class="card-body tight">${dash.recent_registrations.length ? dash.recent_registrations.map(regRow).join('') : '<div class="empty">No registrations yet.</div>'}</div>
      </div>
      <div class="card">
        <div class="card-head"><h3>System Health</h3></div>
        <div class="card-body tight">${d.system_health.map(healthRow).join('')}</div>
        <div class="card-body" style="border-top:1px solid var(--line)"><button class="btn btn-ghost btn-block btn-sm" onclick="show('admin-logs')">View System Logs</button></div>
      </div>
    </div>
    <div class="ap-3col">
      <div class="card">
        <div class="card-head"><h3>Top Courses</h3><button class="btn btn-ghost btn-sm" onclick="show('admin-catalogue')">View all</button></div>
        <div class="card-body tight">${dash.top_courses.length ? dash.top_courses.map(topCourseRow).join('') : '<div class="empty">No enrollments yet.</div>'}</div>
      </div>
      <div class="card">
        <div class="card-head"><h3>Recent Announcements</h3><button class="btn btn-ghost btn-sm" onclick="show('admin-announcements')">View all</button></div>
        <div class="card-body tight">${dash.recent_announcements.length ? dash.recent_announcements.map(annRowAdmin).join('') : '<div class="empty">Nothing published yet.</div>'}</div>
      </div>
      <div class="card">
        <div class="card-head"><h3>Quick Actions</h3></div>
        <div class="card-body"><div class="qa-grid">
          ${qaBtn('violet', T_ICONS.book, 'Add New Course', 'formCourse()')}
          ${qaBtn('teal', T_ICONS.people, 'Add New User', 'adminQuickAddUser()')}
          ${qaBtn('sky', T_ICONS.megaphone, 'Create Announcement', "show('admin-announcements')")}
          ${qaBtn('gold', T_ICONS.chart, 'Generate Report', "show('admin-analytics')")}
          ${qaBtn('violet', T_ICONS.people, 'Manage Roles', "show('admin-users')")}
          ${qaBtn('teal', T_ICONS.gear, 'System Settings', "show('settings')")}
        </div></div>
      </div>
    </div>`;
  wireGrowthChart($('growthChartWrap'), growthTipLabels, dash.growth.counts, (v) => `${v.toLocaleString()} Users`);
}

/* -------------------------- admin: teachers / students / enrollments / finance / announcements / logs -------------------------- */
function userGroupTable(label, users, isAdmin) {
  return `<div class="card"><div class="card-head"><h3>${esc(label)} (${users.length})</h3></div>
    <div class="card-body" style="padding:0;overflow-x:auto"><table class="tbl">
      <tr><th>Name</th><th>Reg no</th><th>Username</th><th>Gems</th><th>Courses</th><th></th></tr>
      ${users.map((u) => `<tr>
        <td>${esc(u.name)}</td>
        <td class="mono">${esc(u.reg_no || '—')}</td>
        <td class="mono">${esc(u.username || '—')}</td>
        <td>${u.gems != null ? gemChip(u.gems) : '—'}</td>
        <td class="s">${u.courses.map(esc).join(', ') || '—'}</td>
        <td style="text-align:right;white-space:nowrap">
          ${['student', 'free'].includes(u.role) ? `<button class="btn btn-teal btn-sm" onclick="openStudentProfile(${u.id})">View profile</button>` : ''}
          ${isAdmin ? `<button class="btn btn-ghost btn-sm" onclick="formResetPassword(${u.id},'${esc(u.name).replace(/'/g, '&#39;')}')">Reset password</button>
          ${u.role !== 'admin' ? `<button class="btn btn-danger btn-sm" onclick="delUser(${u.id},'${esc(u.name).replace(/'/g, '&#39;')}')">Delete</button>` : ''}` : ''}
        </td></tr>`).join('') || `<tr><td colspan="6" class="empty">None yet.</td></tr>`}
    </table></div></div>`;
}
async function renderAdminTeachers() {
  const el = $('view-admin-teachers');
  el.innerHTML = '<div class="empty">Loading&hellip;</div>';
  const d = await api('/api/admin/users');
  el.innerHTML = userGroupTable('Teachers', d.users.filter((u) => u.role === 'instructor'), ME.role === 'admin')
    + '<div id="teacherAssignWrap" style="margin-top:16px"></div>';
  renderInstructorAssignmentPanel('teacherAssignWrap', { canEditTag: true, canAssign: true });
}
/* -------- Instructor directory: HR/admin-set specialization tag, and
 * "assign to course" (an instructor can teach several courses at once) -
 * shared by the admin Teachers view, the HR Portal, and the Admissions
 * Office (student_coordinator can assign but not edit the tag). -------- */
async function renderInstructorAssignmentPanel(containerId, { canEditTag = false, canAssign = false } = {}) {
  const box = $(containerId); if (!box) return;
  box.innerHTML = '<div class="empty">Loading&hellip;</div>';
  const d = await api('/api/instructors-lite');
  box.innerHTML = `<div class="card"><div class="card-head"><h3>Instructor directory</h3><span class="s" style="color:var(--muted)">One instructor can be assigned to several courses at once.</span></div>
    <div class="card-body" style="padding:0;overflow-x:auto"><table class="tbl">
      <tr><th>Name</th><th>Email</th><th>Specialization</th><th>Assigned courses</th><th></th></tr>
      ${d.instructors.map((i) => `<tr>
        <td>${esc(i.name)}</td><td class="s">${esc(i.email || '—')}</td>
        <td class="s">${esc(i.instructor_tag || '—')}${canEditTag ? ` <button class="btn btn-ghost btn-sm" onclick="formSetInstructorTag(${i.id}, '${esc(i.name).replace(/'/g, '&#39;')}', '${esc(i.instructor_tag || '').replace(/'/g, '&#39;')}', '${containerId}', ${canEditTag}, ${canAssign})">Edit</button>` : ''}</td>
        <td class="s">${i.batches.map((b) => esc(b.title || b.name)).join(', ') || '—'}</td>
        <td>${canAssign ? `<button class="btn btn-ghost btn-sm" onclick="formAssignInstructor(${i.id}, '${esc(i.name).replace(/'/g, '&#39;')}', '${containerId}', ${canEditTag}, ${canAssign})">Assign to course</button>` : ''}</td>
      </tr>`).join('') || '<tr><td colspan="5" class="empty">No instructors yet.</td></tr>'}
    </table></div></div>`;
}
function formSetInstructorTag(id, name, current, containerId, canEditTag, canAssign) {
  openModal(`Specialization: ${name}`, `<form id="f">
    <label class="field"><span>Short highlight</span><input name="tag" value="${esc(current)}" placeholder="e.g. AI Automation Instructor, Web Developer, Graphic Design Instructor"></label>
    <p class="hint">Shown to Admin and the Admissions Office when assigning instructors to courses.</p>
    <button class="btn btn-primary btn-block">Save</button></form>`);
  $('f').addEventListener('submit', async (e) => {
    e.preventDefault(); const f = e.target;
    try {
      await api(`/api/hr/instructors/${id}/tag`, { method: 'PUT', body: JSON.stringify({ tag: f.tag.value.trim() }) });
      toast('Saved.'); closeModal(); renderInstructorAssignmentPanel(containerId, { canEditTag, canAssign });
    } catch (err) { toast(err.message, true); }
  });
}
async function formAssignInstructor(id, name, containerId, canEditTag, canAssign) {
  let d;
  try { d = await api('/api/course-batches-lite'); } catch (err) { toast(err.message, true); return; }
  openModal(`Assign ${name} to a course`, `<form id="f">
    <label class="field"><span>Course / batch</span><select name="batch_id" required>
      ${d.batches.map((b) => `<option value="${b.id}">${esc(b.title || b.name)} &middot; ${esc(b.code)} (${esc(b.status)})</option>`).join('') || '<option disabled>No courses yet</option>'}
    </select></label>
    <button class="btn btn-primary btn-block">Assign</button></form>`);
  $('f').addEventListener('submit', async (e) => {
    e.preventDefault(); const f = e.target;
    try {
      await api(`/api/batches/${f.batch_id.value}/teachers`, { method: 'POST', body: JSON.stringify({ existing: id }) });
      toast('Assigned.'); closeModal(); renderInstructorAssignmentPanel(containerId, { canEditTag, canAssign });
    } catch (err) { toast(err.message, true); }
  });
}
async function renderAdminStudents() {
  const el = $('view-admin-students');
  el.innerHTML = '<div class="empty">Loading&hellip;</div>';
  const d = await api('/api/admin/users');
  window._ADMIN_STUDENTS = d.users.filter((u) => u.role === 'student');
  el.innerHTML = `
    <div class="card"><div class="card-body">
      <input id="asSearch" class="search-input" placeholder="Search by registration number or name&hellip;" oninput="filterAdminStudents()">
    </div></div>
    <div id="asTableWrap">${userGroupTable('Students', window._ADMIN_STUDENTS, ME.role === 'admin')}</div>`;
}
function filterAdminStudents() {
  const q = $('asSearch').value.trim().toLowerCase();
  const filtered = (window._ADMIN_STUDENTS || []).filter((u) => !q || (u.name + ' ' + (u.reg_no || '') + ' ' + (u.username || '')).toLowerCase().includes(q));
  $('asTableWrap').innerHTML = userGroupTable('Students', filtered, ME.role === 'admin');
}
async function renderAdminEnrollments() {
  const el = $('view-admin-enrollments');
  el.innerHTML = '<div class="empty">Loading&hellip;</div>';
  const [d, rg] = await Promise.all([api('/api/admin/enrollments'), api('/api/admin/registrations').catch(() => ({ registrations: [] }))]);
  // Website enrolment requests (the open-web registration form) surface here
  // too, so admin sees every new student the moment they register.
  const regs = (rg.registrations || []).filter((r) => r.payment_stage !== 'enrolled');
  el.innerHTML = `<div class="card" style="margin-bottom:14px"><div class="card-head"><h3>Enrollment requests - website form</h3><span class="s" style="color:var(--muted)">${regs.length} awaiting enrollment</span></div>
    <div class="card-body" style="padding:0;overflow-x:auto"><table class="tbl">
      <tr><th>Name</th><th>Email</th><th>WhatsApp</th><th>Course</th><th>Stage</th><th>Received</th></tr>
      ${regs.map((r) => `<tr>
        <td>${esc(r.name)}</td><td class="s">${esc(r.email)}</td><td class="mono">${esc(r.whatsapp || '—')}</td>
        <td>${esc(r.course_title || r.course_code || '—')}${r.ambassador_code ? ` <span class="s" style="color:var(--ok);font-weight:700">10% off · amb ${esc(r.ambassador_code)}</span>` : ''}</td>
        <td>${pipelineBadge(r.payment_stage)}</td>
        <td class="s">${esc((r.created_at || '').slice(0, 10))}</td>
      </tr>`).join('') || '<tr><td colspan="6" class="empty">No pending enrollment requests - new website registrations appear here.</td></tr>'}
    </table></div>
    <p class="hint" style="padding:0 14px 12px">Follow up (challan, payment, enrolment) from Analytics &amp; Leads or the Admissions Office portal - once enrolled, the student moves to the list below.</p></div>
  <div class="card"><div class="card-head"><h3>All enrollments</h3><span class="s" style="color:var(--muted)">${d.enrollments.length} total</span></div>
    <div class="card-body" style="padding:0;overflow-x:auto"><table class="tbl">
      <tr><th>Student</th><th>Reg no</th><th>Course</th><th>Cohort</th><th>Price (PKR)</th><th>Enrolled</th></tr>
      ${d.enrollments.map((e) => `<tr>
        <td>${esc(e.student_name)}</td><td class="mono">${esc(e.reg_no || '—')}</td>
        <td>${esc(e.course_title)}</td><td class="s">${esc(e.batch_name || '—')}</td>
        <td>${e.price_pkr ? e.price_pkr.toLocaleString() : '—'}</td>
        <td class="s">${esc((e.created_at || '').slice(0, 10))}</td>
      </tr>`).join('') || '<tr><td colspan="6" class="empty">No enrollments yet.</td></tr>'}
    </table></div></div>`;
}
async function renderAdminFinance() {
  const el = $('view-admin-finance');
  el.innerHTML = '<div class="empty">Loading&hellip;</div>';
  const d = await api('/api/admin/finance');
  el.innerHTML = `
    <div class="stat-grid">
      ${stat('PKR ' + d.total_revenue.toLocaleString(), 'Total estimated revenue')}
      ${stat('PKR ' + d.revenue_this_month.toLocaleString(), `Revenue (${esc(d.revenue_month_label)})`)}
      ${stat(d.courses.length, 'Courses with enrollments')}
    </div>
    <div class="card"><div class="card-head"><h3>Revenue trend</h3><span class="s" style="color:var(--muted)">Last 6 months</span></div>
      <div id="financeChart"></div></div>
    <div class="card"><div class="card-head"><h3>Revenue by course</h3></div>
      <div class="card-body" style="padding:0;overflow-x:auto"><table class="tbl">
        <tr><th>Course</th><th>Price (PKR)</th><th>Enrollments</th><th>Revenue (PKR)</th></tr>
        ${d.courses.map((c) => `<tr><td>${esc(c.title)}</td><td>${c.price_pkr.toLocaleString()}</td><td>${c.enrollments}</td><td><strong>${c.revenue.toLocaleString()}</strong></td></tr>`).join('') || '<tr><td colspan="4" class="empty">No paid enrollments yet.</td></tr>'}
      </table></div></div>
    <p class="hint" style="padding:0 4px">Revenue is estimated from each course's catalogue list price &times; its enrollments &mdash; EchoLens has no payment gateway integration, so this is not a reconciled financial ledger.</p>
    <div id="adminAmbReportsWrap" style="margin-top:16px"></div>`;
  const monthLabels = d.trend.labels.map((m) => monthLabel(m, { month: 'short' }));
  const monthTipLabels = d.trend.labels.map((m) => monthLabel(m, { month: 'long', year: 'numeric' }));
  const chartEl = $('financeChart');
  chartEl.innerHTML = growthLineChart(monthLabels, d.trend.values);
  wireGrowthChart(chartEl, monthTipLabels, d.trend.values, (v) => 'PKR ' + v.toLocaleString());
  renderAmbassadorReportsPanel('adminAmbReportsWrap');
}
async function renderAdminAnnouncementsPage() {
  const el = $('view-admin-announcements');
  el.innerHTML = '<div class="empty">Loading&hellip;</div>';
  const d = await api('/api/public/announcements');
  el.innerHTML = `
    <div class="card"><div class="card-head"><h3>Publish an announcement</h3></div>
      <div class="card-body"><form id="aaForm">
        <div class="form-grid">
          <label class="field"><span>Type</span><select name="kind">
            <option value="cohort">New cohort / registration</option><option value="hackathon">Hackathon</option>
            <option value="webinar">Webinar</option><option value="discount">Discount</option><option value="info">Information</option></select></label>
          <label class="field" style="grid-column:span 2"><span>Title</span><input name="title" required placeholder="e.g. August 2026 cohort - registration open"></label>
        </div>
        <label class="field"><span>Message</span><textarea name="body" rows="3" required placeholder="Write the announcement exactly as visitors should read it."></textarea></label>
        <div class="form-grid">
          <label class="field" style="grid-column:span 2"><span>Action link (optional)</span><input name="link" type="url" placeholder="https://"></label>
          <label class="field"><span>Link button label</span><input name="link_label" placeholder="e.g. Register now"></label>
        </div>
        <div style="display:flex;gap:16px;align-items:center;flex-wrap:wrap;margin-bottom:14px">
          <label class="s" style="display:flex;gap:7px;align-items:center;cursor:pointer"><input type="checkbox" name="pinned"> Pin to the top</label>
          <label class="s" style="display:flex;gap:7px;align-items:center">Email it to:
            <select name="notify" style="padding:6px 10px;border:1.5px solid var(--line);border-radius:8px">
              <option value="none">Nobody - website only</option><option value="portal">Portal students</option>
              <option value="open">Open students</option><option value="all">Everyone incl. leads</option></select></label>
        </div>
        <button class="btn btn-primary">Publish announcement</button></form></div></div>
    <div class="card"><div class="card-head"><h3>Published (${d.announcements.length})</h3></div>
      <div class="card-body tight">${d.announcements.map((a) => `
        <div class="list-row">
          <div class="grow">
            <div class="t">${a.pinned ? '<span class="role-pill">Pinned</span> ' : ''}<span class="kbadge ${a.kind === 'webinar' ? 'webinar' : a.kind === 'hackathon' ? 'hackathon' : 'quest'}">${ANN_KIND_LABEL[a.kind] || a.kind}</span> ${esc(a.title)}</div>
            <div class="s" style="color:var(--muted)">${esc(a.body.slice(0, 140))}${a.body.length > 140 ? '&hellip;' : ''} &middot; ${esc((a.created_at || '').slice(0, 10))}</div>
          </div>
          <button class="btn btn-ghost btn-sm" onclick="adminAnnPin(${a.id}, ${a.pinned ? 'false' : 'true'})">${a.pinned ? 'Unpin' : 'Pin'}</button>
          <button class="btn btn-danger btn-sm" onclick="adminAnnDelete(${a.id})">Delete</button>
        </div>`).join('') || '<div class="empty">Nothing published yet.</div>'}</div></div>`;
  $('aaForm').addEventListener('submit', async (e) => {
    e.preventDefault(); const f = e.target; const btn = f.querySelector('button'); btn.disabled = true;
    const obj = {}; new FormData(f).forEach((v, k) => { if (v !== '') obj[k] = v; });
    obj.pinned = f.pinned.checked;
    try { await api('/api/admin/public-announcements', { method: 'POST', body: JSON.stringify(obj) }); toast('Published on the open website.'); renderAdminAnnouncementsPage(); }
    catch (err) { toast(err.message, true); btn.disabled = false; }
  });
}
/* -------- Admin: public feedback wall moderation --------
 * Anyone on the open site can submit feedback (POST /api/public/feedback);
 * it lands 'pending' and only shows on the public wall once approved here -
 * the open site has no login wall, so raw unmoderated text is a spam risk. */
const FEEDBACK_STATUS_LABEL = { pending: 'Pending review', approved: 'Approved · public', rejected: 'Rejected' };
async function renderAdminFeedback() {
  const el = $('view-admin-feedback');
  el.innerHTML = '<div class="empty">Loading&hellip;</div>';
  const d = await api('/api/admin/feedback');
  const stars = (n) => n ? `<span class="s" style="color:#F0A82A">${'&#9733;'.repeat(n)}${'&#9734;'.repeat(5 - n)}</span>` : '';
  const row = (f) => `
    <div class="list-row" style="align-items:start;flex-wrap:wrap">
      <div class="grow">
        <div class="t">${esc(f.name)} ${stars(f.rating)} <span class="s" style="color:var(--muted-2)">&middot; ${esc((f.created_at || '').slice(0, 10))}</span></div>
        <div class="s" style="color:var(--muted);white-space:pre-line">${esc(f.message)}</div>
        <div class="s" style="color:var(--muted-2)">${esc(FEEDBACK_STATUS_LABEL[f.status] || f.status)}${f.email ? ' &middot; ' + esc(f.email) : ''}</div>
        ${f.reply ? `<div class="s" style="margin-top:8px;padding:8px 10px;background:var(--violet-soft);border-radius:8px"><strong>Your reply</strong> (${esc(f.replied_by || 'admin')}, ${esc((f.replied_at || '').slice(0, 10))}): ${esc(f.reply)}</div>` : ''}
        <form onsubmit="return adminFeedbackReply(event, ${f.id})" style="display:flex;gap:6px;margin-top:8px;max-width:520px">
          <input name="reply" placeholder="${f.reply ? 'Edit reply...' : 'Write a public reply...'}" value="${esc(f.reply || '')}" style="flex:1;padding:6px 10px;border:1.5px solid var(--line);border-radius:8px;font-size:12.5px">
          <button class="btn btn-ghost btn-sm">${f.reply ? 'Update' : 'Reply'}</button>
        </form>
      </div>
      <div style="display:flex;gap:6px;flex-wrap:wrap">
        ${f.status !== 'approved' ? `<button class="btn btn-primary btn-sm" onclick="adminFeedbackAction(${f.id}, 'approve')">Approve</button>` : ''}
        ${f.status !== 'rejected' ? `<button class="btn btn-ghost btn-sm" onclick="adminFeedbackAction(${f.id}, 'reject')">Reject</button>` : ''}
        <button class="btn btn-danger btn-sm" onclick="adminFeedbackDelete(${f.id})">Delete</button>
      </div>
    </div>`;
  const pending = d.feedback.filter((f) => f.status === 'pending');
  const rest = d.feedback.filter((f) => f.status !== 'pending');
  el.innerHTML = `
    <div class="card" style="margin-bottom:16px"><div class="card-head"><h3>Awaiting review (${pending.length})</h3>
      <span class="s" style="color:var(--muted)">Only approved feedback shows on the public /open#feedback wall.</span></div>
      <div class="card-body tight">${pending.map(row).join('') || '<div class="empty">Nothing waiting on review.</div>'}</div></div>
    <div class="card"><div class="card-head"><h3>Reviewed (${rest.length})</h3></div>
      <div class="card-body tight">${rest.map(row).join('') || '<div class="empty">Nothing reviewed yet.</div>'}</div></div>`;
}
async function adminFeedbackAction(id, action) {
  try { await api(`/api/admin/feedback/${id}/${action}`, { method: 'POST', body: JSON.stringify({}) }); renderAdminFeedback(); }
  catch (e) { toast(e.message, true); }
}
async function adminFeedbackReply(e, id) {
  e.preventDefault();
  const f = e.target; const btn = f.querySelector('button'); const reply = f.reply.value.trim();
  btn.disabled = true;
  try { await api(`/api/admin/feedback/${id}/reply`, { method: 'POST', body: JSON.stringify({ reply }) }); toast(reply ? 'Reply saved.' : 'Reply removed.'); renderAdminFeedback(); }
  catch (err) { toast(err.message, true); btn.disabled = false; }
  return false;
}
async function adminFeedbackDelete(id) {
  if (!confirm('Delete this feedback permanently?')) return;
  try { await api(`/api/admin/feedback/${id}`, { method: 'DELETE' }); toast('Deleted.'); renderAdminFeedback(); }
  catch (e) { toast(e.message, true); }
}
async function adminAnnPin(id, pinned) {
  try { await api(`/api/admin/public-announcements/${id}`, { method: 'PATCH', body: JSON.stringify({ pinned }) }); renderAdminAnnouncementsPage(); }
  catch (e) { toast(e.message, true); }
}
async function adminAnnDelete(id) {
  if (!confirm('Delete this announcement from the website?')) return;
  try { await api(`/api/admin/public-announcements/${id}`, { method: 'DELETE' }); renderAdminAnnouncementsPage(); }
  catch (e) { toast(e.message, true); }
}
async function renderAdminLogs() {
  const el = $('view-admin-logs');
  el.innerHTML = '<div class="empty">Loading&hellip;</div>';
  const d = await api('/api/admin/system-health');
  el.innerHTML = `
    <div class="card"><div class="card-body" style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
      <span class="s" style="color:var(--muted)">The database backs itself up automatically every 12 hours on the server disk. Download a copy off-server regularly.</span>
      <span style="flex:1"></span>
      <a class="btn btn-ghost btn-sm" href="/api/admin/backup">Database only</a>
      <a class="btn btn-ghost btn-sm" href="/api/admin/backup.zip">Full backup (with files)</a>
    </div></div>
    <div class="card"><div class="card-head"><h3>System health</h3></div>
      <div class="card-body tight">${d.health.map(healthRow).join('')}</div></div>
    <div class="card"><div class="card-head"><h3>Recent activity</h3><span class="s" style="color:var(--muted)">Computed from account, course and backup timestamps</span></div>
      <div class="card-body tight">${d.events.length ? d.events.map(logRow).join('') : '<div class="empty">Nothing yet.</div>'}</div></div>`;
}
function wireAdminTopSearch() {
  const inp = $('topSearch'); const out = $('topSearchResults');
  if (!inp || !out) return;
  let t = null;
  inp.addEventListener('input', () => {
    clearTimeout(t);
    const q = inp.value.trim().toLowerCase();
    if (q.length < 2) { out.classList.remove('open'); out.innerHTML = ''; return; }
    t = setTimeout(async () => {
      try {
        const [users, cat] = await Promise.all([api('/api/admin/users'), api('/api/admin/catalogue')]);
        const hits = [];
        users.users.forEach((u) => { if (u.name.toLowerCase().includes(q)) hits.push({ label: u.name, sub: roleLabel(u.role), action: u.role === 'instructor' ? "show('admin-teachers')" : u.role === 'student' ? "show('admin-students')" : "show('admin-users')" }); });
        cat.courses.forEach((c) => { if (c.title.toLowerCase().includes(q)) hits.push({ label: c.title, sub: 'Course', action: "show('admin-catalogue')" }); });
        out.innerHTML = hits.length
          ? hits.slice(0, 8).map((h) => `<button onclick="${h.action};closeTopSearch()">${esc(h.label)} <span class="s" style="color:var(--muted-2)">&middot; ${esc(h.sub)}</span></button>`).join('')
          : '<div class="empty" style="padding:10px">No matches.</div>';
        out.classList.add('open');
      } catch { out.innerHTML = ''; }
    }, 220);
  });
  inp.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeTopSearch(); });
  document.addEventListener('keydown', (e) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); inp.focus(); } });
}

/* -------------------------- student overview (v13) -------------------------- */
let DC_CD_TIMER = null;
async function renderStudentOverview(el, d) {
  const [coursesR, questsR, quizzesR, recR, challR, queriesR] = await Promise.all([
    api('/api/my/courses'), api('/api/my/quests'), api('/api/my/quizzes'),
    api('/api/my/recommended'), api('/api/challenges').catch(() => ({ challenges: [], mine: {} })),
    api('/api/my/queries').catch(() => ({ queries: [] })),
  ]);
  const courses = coursesR.courses;
  const cont = courses.find((c) => c.progress_pct > 0 && c.progress_pct < 100) || courses[0] || null;

  // Merge live classes + nearest undone quest deadline per course + open quiz closes into one dated list.
  const items = [];
  d.upcoming.forEach((s) => items.push({ date: s.session_date, type: 'class', title: s.title, sub: s.course_title || s.batch_name || '' }));
  questsR.courses.forEach((c) => {
    const next = c.levels.find((l) => l.unlocked && !l.passed && l.deadline);
    if (next) items.push({ date: next.deadline, type: 'assignment', title: `Level ${next.no}: ${next.title}`, sub: c.course_title });
  });
  quizzesR.open.forEach((q) => items.push({ date: (q.closes_at || '').slice(0, 10), type: 'quiz', title: q.title, sub: q.course_title }));
  items.sort((a, b) => String(a.date).localeCompare(String(b.date)));
  const upcoming3 = items.slice(0, 3);
  const TYPE_LABEL = { class: 'Live class', assignment: 'Assignment', quiz: 'Quiz' };

  // Daily challenge: nearest-due open challenge, else the most recently published open one. Never a fabricated deadline.
  const openChallenges = (challR.challenges || []).filter((c) => c.open);
  const withDue = openChallenges.filter((c) => c.due_date).sort((a, b) => String(a.due_date).localeCompare(String(b.due_date)));
  const featured = withDue[0] || openChallenges[openChallenges.length - 1] || null;
  const mineChallenge = featured ? (challR.mine || {})[featured.id] : null;

  el.innerHTML = `
    <div style="display:grid;grid-template-columns:1.6fr 1fr;gap:20px;align-items:start" class="ovr-grid">
      <div>
        ${cont ? `<div class="card"><div class="cl-hero">
          <div class="cl-thumb">&#128218;</div>
          <div class="cl-main">
            <div class="cl-eyebrow">Continue learning</div>
            <div class="cl-title">${esc(cont.title || cont.name)}</div>
            <div class="cl-bar"><div class="cl-fill" data-w="${cont.progress_pct}"></div></div>
            <div class="cl-pct">${cont.progress_pct}% complete</div>
          </div>
          <div class="cl-next">
            <div class="l">Next</div>
            <div class="t">${cont.next_level ? `Level ${cont.next_level.no}: ${esc(cont.next_level.title)}` : (cont.progress_pct >= 100 ? 'Track completed' : 'Not started yet')}</div>
            <button class="btn btn-primary btn-sm btn-block" onclick="openCourse(${cont.id})">Resume learning</button>
          </div>
        </div></div>` : `<div class="card"><div class="card-body"><div class="empty">Enroll in a course to start learning.</div></div></div>`}

        <div class="card"><div class="card-head"><h3>Upcoming schedule</h3><button class="btn btn-ghost btn-sm" onclick="show('schedule')">Full calendar</button></div>
          <div class="card-body" style="display:flex;gap:14px;flex-wrap:wrap">
            ${upcoming3.length ? upcoming3.map((it) => `
              <div style="flex:1;min-width:170px;background:var(--canvas);border-radius:12px;padding:14px">
                <div class="s" style="color:var(--primary);font-weight:700;text-transform:uppercase;font-size:11px;letter-spacing:.05em">${TYPE_LABEL[it.type]}</div>
                <div class="t" style="font-weight:600;margin:4px 0">${esc(it.title)}</div>
                <div class="s" style="color:var(--muted)">${esc(it.sub)}</div>
                <div class="s" style="color:var(--muted-2);margin-top:6px">${fmtDate(it.date)}</div>
              </div>`).join('') : emptyScheduleHTML('No classes, quizzes, or assignments due soon.')}
          </div></div>

        <div class="card"><div class="card-head"><h3>My courses</h3><button class="btn btn-ghost btn-sm" onclick="show('courses')">View all</button></div>
          <div class="card-body tight">${courses.length ? courses.map((c) => `
            <div class="list-row">
              <div class="grow">
                <div class="t">${esc(c.title || c.name)}</div>
                <div class="s" style="color:var(--muted)">${c.lesson_count} lesson${c.lesson_count === 1 ? '' : 's'}</div>
                <div class="mini-bar"><div class="mini-fill" data-w="${c.progress_pct}"></div></div>
              </div>
              <div style="font-weight:700;color:var(--ink);min-width:36px;text-align:right">${c.progress_pct}%</div>
              <button class="btn btn-ghost btn-sm" onclick="openCourse(${c.id})">Continue</button>
            </div>`).join('') : '<div class="empty">No enrolled courses yet.</div>'}</div></div>

        ${recR.courses.length ? `<div class="card"><div class="card-head"><h3>Recommended for you</h3></div>
          <div class="card-body"><div class="course-grid">${recR.courses.map((c) => `
            <a class="course-card" href="/open#courses" style="text-decoration:none;color:inherit">
              <div class="course-band"></div>
              <div class="cc-body">
                <div class="tier">${esc(c.tier)} &middot; ${esc(c.code)}</div>
                <h4>${esc(c.title)}</h4>
                <div class="s" style="color:var(--muted)">${esc((c.summary || '').slice(0, 90))}</div>
              </div>
            </a>`).join('')}</div></div></div>` : ''}
      </div>
      <div>
        ${prismCard(d.gamify)}
        ${featured ? `<div class="card"><div class="card-head"><h3>Daily challenge</h3></div>
          <div class="card-body">
            <div class="t" style="font-weight:600;margin-bottom:4px">${esc(featured.title)}</div>
            <div class="s" style="color:var(--muted);margin-bottom:10px">${esc((featured.description || '').slice(0, 120))}</div>
            ${featured.due_date ? `<div class="cd-grid" id="dcCountdown">
              <div class="cd-box"><b id="dc-d">--</b><span>Days</span></div>
              <div class="cd-box"><b id="dc-h">--</b><span>Hours</span></div>
              <div class="cd-box"><b id="dc-m">--</b><span>Mins</span></div>
              <div class="cd-box"><b id="dc-s">--</b><span>Secs</span></div>
            </div>` : '<div class="s" style="color:var(--muted-2);margin-bottom:8px">No deadline - work at your own pace.</div>'}
            <button class="btn btn-primary btn-block" style="margin-top:12px" onclick="formChallengeSubmit(${featured.id},'${esc(featured.title).replace(/'/g, '&#39;')}')">${mineChallenge ? 'Resubmit' : 'Start challenge'}</button>
          </div></div>` : ''}
        <div class="card"><div class="card-head"><h3>Recent achievements</h3></div>
          <div class="card-body tight">${(d.gamify.recent_events || []).length ? d.gamify.recent_events.map((ev) => `
            <div class="list-row">
              <div class="grow"><div class="t">${esc(ev.note || (ev.source.charAt(0).toUpperCase() + ev.source.slice(1) + ' gems'))}</div><div class="s" style="color:var(--muted-2)">${esc((ev.at || '').slice(0, 16))}</div></div>
              <span style="font-weight:700;color:var(--ok)">+${ev.amount}</span>
            </div>`).join('') : '<div class="empty">Earn gems to see them here.</div>'}</div></div>
        <div class="card"><div class="card-head"><h3>Contact my coordinator</h3><button class="btn btn-primary btn-sm" onclick="myNewQuery()">New query</button></div>
          <div class="card-body tight">${queriesR.queries.length ? queriesR.queries.slice(0, 4).map((q) => `
            <div class="list-row" style="cursor:pointer" onclick="myOpenQuery(${q.id})">
              <div class="grow"><div class="t">${esc(q.subject)}</div><div class="s" style="color:var(--muted-2)">${esc((q.updated_at || '').slice(0, 16))}</div></div>
              <span class="s" style="color:${q.status === 'resolved' ? 'var(--ok)' : 'var(--gold)'};font-weight:600">${q.status === 'resolved' ? 'Resolved' : 'Open'}</span>
            </div>`).join('') : '<div class="empty">Any issue or question? Raise it here - the Admissions Office team replies here directly.</div>'}</div></div>
        <div class="card"><div class="card-body" style="text-align:center">
          <div style="font-weight:650;margin-bottom:6px">Need help?</div>
          <div class="s" style="color:var(--muted);margin-bottom:8px">Find answers, ask questions, and connect with peers.</div>
          <div class="s" style="color:var(--primary-deep);font-weight:600;margin-bottom:12px">info@echolens.digital</div>
          <a class="btn btn-ghost btn-block" href="mailto:info@echolens.digital">Contact support</a>
        </div></div>
      </div>
    </div>
    <style>@media (max-width:900px){.ovr-grid{grid-template-columns:1fr !important}}</style>`;
  requestAnimationFrame(() => { el.querySelectorAll('.prism-fill,.mini-fill,.cl-fill').forEach((f) => (f.style.width = f.dataset.w + '%')); });
  if (featured && featured.due_date) startDailyChallengeCountdown(featured.due_date);
}
function startDailyChallengeCountdown(dueDate) {
  if (DC_CD_TIMER) clearInterval(DC_CD_TIMER);
  const end = new Date(dueDate + 'T23:59:59').getTime();
  const tick = () => {
    if (!$('dc-d')) { clearInterval(DC_CD_TIMER); DC_CD_TIMER = null; return; }
    let s = Math.max(0, Math.floor((end - Date.now()) / 1000));
    const dd = Math.floor(s / 86400); s -= dd * 86400;
    const hh = Math.floor(s / 3600); s -= hh * 3600;
    const mm = Math.floor(s / 60); s -= mm * 60;
    const p = (n) => String(n).padStart(2, '0');
    $('dc-d').textContent = dd; $('dc-h').textContent = p(hh); $('dc-m').textContent = p(mm); $('dc-s').textContent = p(s);
  };
  tick(); DC_CD_TIMER = setInterval(tick, 1000);
}

/* -------------------------- student: contact my coordinator -------------------------- */
function myNewQuery() {
  openModal('New query to the Admissions Office', `
    <form id="f">
      <label class="field"><span>Subject</span><input name="subject" required placeholder="e.g. Class timing conflict"></label>
      <label class="field"><span>Details</span><textarea name="body" rows="4" required placeholder="Describe the issue or question..."></textarea></label>
      <button class="btn btn-primary btn-block">Send</button></form>`);
  $('f').addEventListener('submit', async (e) => {
    e.preventDefault(); const f = e.target; const btn = f.querySelector('button'); btn.disabled = true; modalMsg('');
    try { await api('/api/my/queries', { method: 'POST', body: JSON.stringify({ subject: f.subject.value, body: f.body.value }) }); toast('Sent to the Admissions Office.'); closeModal(); renderOverview(); }
    catch (err) { modalMsg(err.message); btn.disabled = false; }
  });
}
async function myOpenQuery(id) {
  const d = await api('/api/my/queries');
  const q = d.queries.find((x) => x.id === id); if (!q) return;
  openModal(q.subject, `
    <div style="max-height:260px;overflow:auto;display:flex;flex-direction:column;gap:8px;margin-bottom:10px">
      ${q.messages.map((m) => `<div class="s" style="padding:8px 12px;border-radius:10px;white-space:pre-wrap;background:${m.from_role === 'student' ? 'var(--primary-soft, rgba(124,58,237,.08))' : 'var(--bg)'};border:1px solid var(--line)"><strong>${esc(m.from_name)}</strong> &middot; ${esc((m.at || '').slice(0, 16))}<br>${esc(m.body)}</div>`).join('')}
    </div>
    ${q.status !== 'resolved' ? `<form id="f" style="display:flex;gap:8px">
      <input name="body" class="field" style="flex:1;margin:0" placeholder="Write a reply..." required>
      <button class="btn btn-ghost">Reply</button></form>` : '<p class="s" style="color:var(--ok)">This query is resolved.</p>'}`, true);
  if (q.status !== 'resolved') {
    $('f').addEventListener('submit', async (e) => {
      e.preventDefault(); const body = e.target.body.value.trim(); if (!body) return;
      try { await api(`/api/my/queries/${id}/reply`, { method: 'POST', body: JSON.stringify({ body }) }); myOpenQuery(id); }
      catch (err) { toast(err.message, true); }
    });
  }
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
    <button class="btn btn-teal btn-sm" onclick="openCourse(${s.batch_id},'Classes')">Open class</button></div>`;
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

/* ============================= ASSIGNMENTS ============================= */
async function renderAssignments() {
  const el = $('view-assignments');
  el.innerHTML = '<div class="empty">Loading&hellip;</div>';
  if (ME.role === 'instructor') {
    const d = await api('/api/overview');
    el.innerHTML = d.courses.length ? `<div class="card"><div class="card-head"><h3>Manage assignments</h3><span class="s" style="color:var(--muted)">Quest levels &amp; tasks live inside each course</span></div>
      <div class="card-body tight">${d.courses.map((c) => `
        <div class="list-row"><div class="grow"><div class="t">${esc(c.title || c.name)}</div><div class="s" style="color:var(--muted)">${c.students} student${c.students === 1 ? '' : 's'}</div></div>
          <button class="btn btn-teal btn-sm" onclick="openCourse(${c.id})">Open</button></div>`).join('')}</div></div>`
      : '<div class="card"><div class="card-body"><div class="empty">No courses assigned to you yet.</div></div></div>';
    return;
  }
  const d = await api('/api/my/quests');
  if (!d.courses.length) { el.innerHTML = '<div class="card"><div class="card-body"><div class="empty">No assignments yet - they appear once a teacher installs a quest track on your course.</div></div></div>'; return; }
  el.innerHTML = d.courses.map((c) => `
    <div class="card"><div class="card-head"><h3>${esc(c.course_title)}</h3><span class="s" style="color:var(--muted)">${c.unlocked_up_to - 1}/${c.total_levels} levels passed</span></div>
      <div class="card-body tight">${c.levels.map((l) => `
        <div class="list-row">
          <div class="grow">
            <div class="t">Level ${l.no}: ${esc(l.title)}</div>
            <div class="s" style="color:var(--muted)">${l.deadline ? 'Due ' + fmtDate(l.deadline) : 'No deadline'}</div>
          </div>
          <span class="grade-chip ${l.passed ? 'ok' : (l.unlocked ? 'wait' : 'none')}">${l.passed ? '&#10003; Passed' : (l.unlocked ? 'In progress' : 'Locked')}</span>
          ${l.unlocked ? `<button class="btn btn-teal btn-sm" onclick="openCourse(${c.batch_id})">Open</button>` : ''}
        </div>`).join('')}</div></div>`).join('');
}

/* ============================ TEACHER: STUDENTS ============================ */
async function renderTeacherStudents() {
  const el = $('view-students');
  el.innerHTML = '<div class="empty">Loading&hellip;</div>';
  const d = await api('/api/teacher/students');
  if (!d.students.length) { el.innerHTML = '<div class="card"><div class="card-body"><div class="empty">No students enrolled in your courses yet.</div></div></div>'; return; }
  const courseOpts = d.courses.map((c) => `<option value="${c.id}">${esc(c.title)}</option>`).join('');
  el.innerHTML = `
    <div class="card"><div class="card-body" style="display:flex;gap:12px;align-items:center;flex-wrap:wrap">
      <input id="tsSearch" class="search-input" style="flex:1;min-width:200px;border:1px solid var(--line-strong);border-radius:10px;padding:9px 12px;font-size:13.5px" placeholder="Search by name or reg no&hellip;" oninput="filterTeacherStudents()">
      <select id="tsCourse" onchange="filterTeacherStudents()" style="border:1px solid var(--line-strong);border-radius:10px;padding:9px 12px;font-size:13.5px"><option value="">All courses</option>${courseOpts}</select>
    </div></div>
    <div class="card"><div class="card-body" style="padding:0;overflow-x:auto"><table class="tbl" id="tsTbl">
      <tr><th>Student</th><th>Course</th><th>Level</th><th>Submitted</th><th>Avg grade</th><th>Gems</th><th>Risk</th></tr>
      ${d.students.map((s) => `<tr data-batch="${s.batch_id}" data-search="${esc((s.name + ' ' + (s.reg_no || '')).toLowerCase())}">
        <td>${avatarHtml(null, s.name, 28)} ${esc(s.name)}</td>
        <td class="s">${esc(s.course_title)}</td>
        <td>${s.of_levels ? s.level + '/' + s.of_levels : '&mdash;'}</td>
        <td>${s.submitted}/${s.total_assignments}</td>
        <td>${s.avg != null ? s.avg + '%' : '&mdash;'}</td>
        <td>${gemChip(s.gems)}</td>
        <td>${s.at_risk ? '<span class="grade-chip late">At risk</span>' : '<span class="grade-chip ok">OK</span>'}</td>
      </tr>`).join('')}
    </table></div></div>`;
}
function filterTeacherStudents() {
  const q = $('tsSearch').value.trim().toLowerCase();
  const batch = $('tsCourse').value;
  document.querySelectorAll('#tsTbl tr[data-search]').forEach((tr) => {
    const matchQ = !q || tr.dataset.search.includes(q);
    const matchB = !batch || tr.dataset.batch === batch;
    tr.style.display = matchQ && matchB ? '' : 'none';
  });
}

/* ============================= TEACHER: GRADES ============================= */
async function renderTeacherGrades() {
  const el = $('view-grades');
  el.innerHTML = '<div class="empty">Loading&hellip;</div>';
  const d = await api('/api/teacher/grades');
  if (!d.pending.length) { el.innerHTML = '<div class="card"><div class="card-body"><div class="empty">Nothing waiting for grades - nice work.</div></div></div>'; return; }
  el.innerHTML = `<div class="card"><div class="card-head"><h3>Pending submissions</h3><span class="s" style="color:var(--muted)">${d.pending.length} waiting</span></div>
    <div class="card-body tight">${d.pending.map((s) => `
      <div class="list-row">
        <div class="grow">
          <div class="t">${esc(s.student_name)} &middot; ${esc(s.problem_title || s.quest_title)}</div>
          <div class="s" style="color:var(--muted)">${esc(s.course_title)} &middot; Level ${s.level}${s.late ? ' &middot; <span style="color:var(--danger)">late</span>' : ''} &middot; submitted ${esc((s.submitted_at || '').slice(0, 16).replace(' ', ' '))}</div>
        </div>
        <button class="btn btn-teal btn-sm" onclick="reviewSubmission(${s.batch_id},${s.quest_id},${s.pid})">Review</button>
      </div>`).join('')}</div></div>`;
}

/* =========================== TEACHER: ATTENDANCE =========================== */
async function renderTeacherAttendance() {
  const el = $('view-attendance');
  el.innerHTML = '<div class="empty">Loading&hellip;</div>';
  const d = await api('/api/teacher/attendance');
  if (!d.courses.length) { el.innerHTML = '<div class="card"><div class="card-body"><div class="empty">No courses assigned to you yet.</div></div></div>'; return; }
  el.innerHTML = d.courses.map((c) => `
    <div class="card"><div class="card-head"><h3>${esc(c.course_title)}</h3>
      <span class="s" style="color:var(--muted)">${c.avg_rate != null ? c.avg_rate + '% average attendance' : 'No classes held yet'}</span></div>
      <div class="card-body" style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;border-bottom:1px solid var(--line)">
        ${c.active ? `<span class="grade-chip ok">Live now: ${esc(c.active.title)}</span>` : `<span class="s" style="color:var(--muted)">No class live right now</span>`}
        <span style="flex:1"></span>
        <button class="btn btn-ghost btn-sm" onclick="openCourse(${c.batch_id})">Open course</button>
      </div>
      <div class="card-body" style="padding:0;overflow-x:auto"><table class="tbl">
        <tr><th>Date</th><th>Class</th><th>Present</th><th>Absent</th><th></th></tr>
        ${c.past.length ? c.past.map((cl) => `<tr>
          <td>${fmtDate(cl.date)}</td><td>${esc(cl.title)}</td>
          <td><strong style="color:var(--ok)">${cl.present}</strong>/${cl.total}</td>
          <td><strong style="color:var(--danger)">${cl.absent}</strong></td>
          <td style="text-align:right"><button class="btn btn-ghost btn-sm" onclick="openAttendanceSheet(${cl.id})">Sheet</button></td>
        </tr>`).join('') : `<tr><td colspan="5" class="empty">No classes held yet.</td></tr>`}
      </table></div></div>`).join('');
}

/* =========================== TEACHER: ANALYTICS =========================== */
async function renderTeacherAnalytics() {
  const el = $('view-analytics');
  el.innerHTML = '<div class="empty">Loading&hellip;</div>';
  const d = await api('/api/teacher/analytics');
  if (!d.courses.length) { el.innerHTML = '<div class="card"><div class="card-body"><div class="empty">No courses assigned to you yet.</div></div></div>'; return; }
  const totalAtRisk = d.courses.reduce((s, c) => s + c.at_risk, 0);
  const totalGems = d.courses.reduce((s, c) => s + c.total_gems, 0);
  el.innerHTML = `
    <div class="stat-grid">
      ${stat(d.total_students, 'Students taught')}
      ${stat(d.courses.length, 'Courses')}
      ${stat(totalAtRisk, 'Students at risk')}
      ${stat(totalGems, 'Gems awarded')}
    </div>
    <div class="card"><div class="card-head"><h3>Per-course breakdown</h3></div>
      <div class="card-body" style="padding:0;overflow-x:auto"><table class="tbl">
        <tr><th>Course</th><th>Students</th><th>Avg grade</th><th>Avg progress</th><th>At risk</th><th>Gems</th></tr>
        ${d.courses.map((c) => `<tr>
          <td>${esc(c.course_title)}</td><td>${c.students}</td>
          <td>${c.avg_grade != null ? c.avg_grade + '%' : '&mdash;'}</td>
          <td>${c.avg_progress}%</td>
          <td>${c.at_risk ? `<span style="color:var(--danger);font-weight:700">${c.at_risk}</span>` : '0'}</td>
          <td>${gemChip(c.total_gems)}</td>
        </tr>`).join('')}
      </table></div></div>
    <div class="card"><div class="card-head"><h3>Top learners</h3><span class="s" style="color:var(--muted)">Across all courses site-wide</span></div>
      <div class="card-body tight">${(d.top_learners || []).map(lbRow).join('') || '<div class="empty">No gems earned yet.</div>'}</div></div>`;
}

/* =============================== QUIZZES (global) =============================== */
async function renderQuizzesGlobal() {
  const el = $('view-quizzes');
  el.innerHTML = '<div class="empty">Loading&hellip;</div>';
  const d = await api('/api/my/quizzes');
  el.innerHTML = `
    <div class="card"><div class="card-head"><h3>Open now</h3></div>
      <div class="card-body tight">${d.open.length ? d.open.map((q) => `
        <div class="list-row">
          <div class="grow"><div class="t">${esc(q.title)}</div><div class="s" style="color:var(--muted)">${esc(q.course_title)} &middot; ${q.points} points &middot; closes ${esc((q.closes_at || '').slice(0, 16).replace('T', ' '))}</div></div>
          <button class="btn btn-teal btn-sm" onclick="openCourse(${q.batch_id})">Take quiz</button>
        </div>`).join('') : '<div class="empty">No quizzes open right now.</div>'}</div></div>
    <div class="card"><div class="card-head"><h3>Past attempts</h3></div>
      <div class="card-body tight">${d.mine.length ? d.mine.map((a) => `
        <div class="list-row">
          <div class="grow"><div class="t">${esc(a.title)}</div><div class="s" style="color:var(--muted)">${esc(a.course_title)} &middot; taken ${esc((a.taken_at || '').slice(0, 16))}</div></div>
          <span class="grade-chip ok">${a.score_pct}%</span>
        </div>`).join('') : '<div class="empty">No attempts yet.</div>'}</div></div>`;
}

/* ============================== RESOURCES ============================== */
async function renderResources() {
  const el = $('view-resources');
  el.innerHTML = '<div class="empty">Loading&hellip;</div>';
  const d = await api('/api/my/resources');
  const TYPE_ICON = { slides: '&#128196;', reading: '&#128218;', notebook: '&#129513;', video: '&#127909;', resource: '&#128206;' };
  const withLessons = d.courses.filter((c) => c.lessons.length);
  if (!withLessons.length) { el.innerHTML = '<div class="card"><div class="card-body"><div class="empty">No course content posted yet.</div></div></div>'; return; }
  el.innerHTML = withLessons.map((c) => `
    <div class="card"><div class="card-head"><h3>${esc(c.course_title)}</h3></div>
      <div class="card-body tight">${c.lessons.map((l) => `
        <div class="list-row">
          <div class="grow"><div class="t">${TYPE_ICON[l.type] || TYPE_ICON.resource} ${esc(l.title)}</div><div class="s" style="color:var(--muted)">${l.week_no ? 'Week ' + l.week_no : ''}</div></div>
          <a class="btn btn-ghost btn-sm" href="${esc(l.url)}" target="_blank" rel="noopener">Open</a>
        </div>`).join('')}</div></div>`).join('');
}

/* =============================== JOBS BOARD (v17) =============================== */
const JOB_ICON = '<svg viewBox="0 0 24 24"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M3 12h18"/></svg>';
const JOB_TYPES = ['Full-time', 'Part-time', 'Internship', 'Contract', 'Freelance'];
async function renderJobs() {
  const el = $('view-jobs');
  el.innerHTML = '<div class="empty">Loading&hellip;</div>';
  const d = await api('/api/jobs');
  const isAdmin = ME.role === 'admin';
  const postBar = isAdmin ? `<div class="card"><div class="card-body" style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
      <span class="s" style="color:var(--muted)">Post jobs you've sourced from the market - students and teachers see them here and apply directly with the employer.</span>
      <span style="flex:1"></span>
      <button class="btn btn-primary btn-sm" onclick="formPostJob()">+ Post a job</button>
    </div></div>` : '';
  if (!d.jobs.length) {
    el.innerHTML = postBar + '<div class="card"><div class="card-body"><div class="empty">No jobs posted yet' + (isAdmin ? ' - post the first one.' : '. Check back soon.') + '</div></div></div>';
    return;
  }
  el.innerHTML = postBar + d.jobs.map(jobCardHtml).join('');
}
function jobCardHtml(j) {
  return `<div class="job-card" onclick="openJob(${j.id})">
    <div class="job-ic">${JOB_ICON}</div>
    <div class="grow">
      <h4>${esc(j.title)}${j.status === 'closed' ? ' <span class="job-chip closed">Closed</span>' : ''}</h4>
      <div class="company">${esc(j.company)}</div>
      <div class="job-meta">
        <span class="job-chip type">${esc(j.job_type)}</span>
        ${j.location ? `<span class="job-chip">${esc(j.location)}</span>` : ''}
        ${j.salary_range ? `<span class="job-chip">${esc(j.salary_range)}</span>` : ''}
        ${j.deadline ? `<span class="job-chip">Apply by ${fmtDate(j.deadline)}</span>` : ''}
      </div>
    </div>
    <div class="job-side">
      Posted ${timeAgo(j.created_at)}
      <div class="cc"><svg viewBox="0 0 24 24"><path d="M4 4h16v13H8l-4 3V4z"/></svg>${j.comment_count}</div>
    </div>
  </div>`;
}
async function openJob(id) {
  document.querySelectorAll('.view').forEach((v) => v.classList.remove('active'));
  $('view-job').classList.add('active');
  $('pageTitle').textContent = 'Job';
  $('view-job').innerHTML = '<div class="empty">Loading&hellip;</div>';
  const d = await api(`/api/jobs/${id}`);
  const j = d.job;
  const isAdmin = ME.role === 'admin';
  const applyBox = j.status === 'closed'
    ? `<div class="job-apply-box" style="background:var(--canvas);color:var(--text)"><div><div class="t">This role is closed</div><div class="s" style="color:var(--muted)">The employer is no longer accepting applications.</div></div></div>`
    : `<div class="job-apply-box">
        <div class="grow"><div class="t">Ready to apply?</div><div class="s">Apply directly with ${esc(j.company)} - EchoLens does not handle the application.</div></div>
        ${j.apply_url ? `<a class="btn btn-primary" href="${esc(j.apply_url)}" target="_blank" rel="noopener">Apply on their site &rarr;</a>` : ''}
        ${j.apply_email ? `<a class="btn btn-ghost" href="mailto:${esc(j.apply_email)}?subject=${encodeURIComponent('Application: ' + j.title)}" style="background:transparent;color:#fff;border-color:rgba(255,255,255,.35)">Email ${esc(j.apply_email)}</a>` : ''}
      </div>`;
  $('view-job').innerHTML = `
    <button class="btn btn-ghost btn-sm" onclick="show('jobs')" style="margin-bottom:14px">&larr; All jobs</button>
    <div class="card"><div class="card-body">
      <div class="job-head">
        <div class="job-ic">${JOB_ICON}</div>
        <div class="grow">
          <h2>${esc(j.title)}${j.status === 'closed' ? ' <span class="job-chip closed">Closed</span>' : ''}</h2>
          <div class="company">${esc(j.company)}</div>
          <div class="job-meta">
            <span class="job-chip type">${esc(j.job_type)}</span>
            ${j.location ? `<span class="job-chip">${esc(j.location)}</span>` : ''}
            ${j.experience_level ? `<span class="job-chip">${esc(j.experience_level)}</span>` : ''}
            ${j.salary_range ? `<span class="job-chip">${esc(j.salary_range)}</span>` : ''}
            ${j.deadline ? `<span class="job-chip">Apply by ${fmtDate(j.deadline)}</span>` : ''}
          </div>
        </div>
        ${isAdmin ? `<div class="dd"><button class="btn btn-ghost btn-sm" onclick="this.nextElementSibling.classList.toggle('open')">Manage &#8942;</button>
          <div class="dd-menu">
            <button onclick="formEditJob(${j.id})">Edit job</button>
            <button onclick="toggleJobStatus(${j.id},'${j.status === 'open' ? 'closed' : 'open'}')">${j.status === 'open' ? 'Mark as closed' : 'Reopen'}</button>
            <button class="danger" onclick="deleteJob(${j.id})">Delete</button>
          </div></div>` : ''}
      </div>
      ${applyBox}
      <div class="s" style="color:var(--muted);white-space:pre-wrap;line-height:1.6">${esc(j.description)}</div>
      ${j.requirements ? `<h3 style="margin:20px 0 8px;font-size:15px">Requirements</h3><div class="s" style="color:var(--muted);white-space:pre-wrap;line-height:1.6">${esc(j.requirements)}</div>` : ''}
      <div class="s" style="color:var(--muted-2);margin-top:20px">Posted by ${esc(j.posted_by_name)} &middot; ${fmtDate((j.created_at || '').slice(0, 10))}</div>
    </div></div>
    <div class="card"><div class="card-head"><h3>Discussion (${d.comments.length})</h3></div>
      <div class="card-body tight" id="jobComments">${d.comments.length ? d.comments.map(jobCommentHtml).join('') : '<div class="empty">No comments yet - ask a question about the role.</div>'}</div>
      <div class="job-comment-form">
        ${avatarHtml(ME.avatar, ME.name, 34)}
        <textarea id="jobCommentInput" placeholder="Ask a question or share your thoughts..."></textarea>
        <button class="btn btn-teal btn-sm" onclick="postJobComment(${j.id})">Post</button>
      </div>
    </div>`;
}
function jobCommentHtml(c) {
  const canDelete = ME.role === 'admin' || c.user_id === ME.id;
  return `<div class="job-comment-row" id="jc${c.id}">
    ${avatarHtml(c.user_avatar, c.user_name, 34)}
    <div class="grow">
      <div class="t">${esc(c.user_name)} <span class="role-pill" style="margin-left:4px">${esc(roleLabel(c.user_role))}</span></div>
      <div class="s">${esc(c.body)}</div>
      <div class="when">${timeAgo(c.created_at)}${canDelete ? ` &middot; <a href="javascript:void(0)" onclick="deleteJobComment(${c.id})" style="color:var(--danger)">Delete</a>` : ''}</div>
    </div>
  </div>`;
}
async function postJobComment(jobId) {
  const inp = $('jobCommentInput');
  const body = inp.value.trim();
  if (!body) return;
  try {
    await api(`/api/jobs/${jobId}/comments`, { method: 'POST', body: JSON.stringify({ body }) });
    inp.value = '';
    openJob(jobId);
  } catch (e) { toast(e.message, true); }
}
async function deleteJobComment(id) {
  if (!confirm('Delete this comment?')) return;
  try {
    await api(`/api/jobs/comments/${id}`, { method: 'DELETE' });
    const row = $(`jc${id}`); if (row) row.remove();
    toast('Comment deleted.');
  } catch (e) { toast(e.message, true); }
}
function formPostJob() {
  openModal('Post a job', `
    <form id="f">
      <div class="form-grid">
        <label class="field"><span>Job title</span><input name="title" required placeholder="e.g. Junior Frontend Developer"></label>
        <label class="field"><span>Company</span><input name="company" required placeholder="e.g. Systems Ltd"></label>
      </div>
      <div class="form-grid">
        <label class="field"><span>Location</span><input name="location" placeholder="e.g. Remote / Islamabad"></label>
        <label class="field"><span>Type</span><select name="job_type">${JOB_TYPES.map((t) => `<option>${t}</option>`).join('')}</select></label>
      </div>
      <div class="form-grid">
        <label class="field"><span>Experience level (optional)</span><input name="experience_level" placeholder="e.g. Entry level / 1-3 years"></label>
        <label class="field"><span>Salary range (optional)</span><input name="salary_range" placeholder="e.g. PKR 80,000 - 120,000"></label>
      </div>
      <label class="field"><span>Description</span><textarea name="description" required rows="5" placeholder="What the role involves..."></textarea></label>
      <label class="field"><span>Requirements (optional)</span><textarea name="requirements" rows="3" placeholder="Skills, experience, qualifications..."></textarea></label>
      <div class="form-grid">
        <label class="field"><span>Application link</span><input name="apply_url" type="url" placeholder="https://"></label>
        <label class="field"><span>Application email</span><input name="apply_email" type="email" placeholder="hr@company.com"></label>
      </div>
      <p class="hint">Add at least one of the two above - students apply directly with the employer.</p>
      <label class="field"><span>Application deadline (optional)</span><input name="deadline" type="date"></label>
      <button class="btn btn-primary btn-block">Post job</button></form>`);
  $('f').addEventListener('submit', async (e) => {
    e.preventDefault(); const f = e.target; const btn = f.querySelector('button'); btn.disabled = true; modalMsg('');
    const obj = {}; new FormData(f).forEach((v, k) => { if (v !== '') obj[k] = v; });
    try {
      await api('/api/admin/jobs', { method: 'POST', body: JSON.stringify(obj) });
      toast('Job posted.'); closeModal(); renderJobs();
    } catch (err) { modalMsg(err.message); btn.disabled = false; }
  });
}
async function formEditJob(id) {
  const d = await api(`/api/jobs/${id}`);
  const j = d.job;
  openModal('Edit job', `
    <form id="f">
      <div class="form-grid">
        <label class="field"><span>Job title</span><input name="title" required value="${esc(j.title)}"></label>
        <label class="field"><span>Company</span><input name="company" required value="${esc(j.company)}"></label>
      </div>
      <div class="form-grid">
        <label class="field"><span>Location</span><input name="location" value="${esc(j.location || '')}"></label>
        <label class="field"><span>Type</span><select name="job_type">${JOB_TYPES.map((t) => `<option${t === j.job_type ? ' selected' : ''}>${t}</option>`).join('')}</select></label>
      </div>
      <div class="form-grid">
        <label class="field"><span>Experience level</span><input name="experience_level" value="${esc(j.experience_level || '')}"></label>
        <label class="field"><span>Salary range</span><input name="salary_range" value="${esc(j.salary_range || '')}"></label>
      </div>
      <label class="field"><span>Description</span><textarea name="description" required rows="5">${esc(j.description)}</textarea></label>
      <label class="field"><span>Requirements</span><textarea name="requirements" rows="3">${esc(j.requirements || '')}</textarea></label>
      <div class="form-grid">
        <label class="field"><span>Application link</span><input name="apply_url" type="url" value="${esc(j.apply_url || '')}"></label>
        <label class="field"><span>Application email</span><input name="apply_email" type="email" value="${esc(j.apply_email || '')}"></label>
      </div>
      <label class="field"><span>Application deadline</span><input name="deadline" type="date" value="${esc(j.deadline || '')}"></label>
      <button class="btn btn-primary btn-block">Save changes</button></form>`);
  $('f').addEventListener('submit', async (e) => {
    e.preventDefault(); const f = e.target; const btn = f.querySelector('button'); btn.disabled = true; modalMsg('');
    const obj = {}; new FormData(f).forEach((v, k) => { obj[k] = v; });
    try {
      await api(`/api/admin/jobs/${id}`, { method: 'PATCH', body: JSON.stringify(obj) });
      toast('Job updated.'); closeModal(); openJob(id);
    } catch (err) { modalMsg(err.message); btn.disabled = false; }
  });
}
async function toggleJobStatus(id, status) {
  try { await api(`/api/admin/jobs/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) }); toast(status === 'open' ? 'Job reopened.' : 'Job marked as closed.'); openJob(id); }
  catch (e) { toast(e.message, true); }
}
async function deleteJob(id) {
  if (!confirm('Delete this job posting? Comments are removed too. This cannot be undone.')) return;
  try { await api(`/api/admin/jobs/${id}`, { method: 'DELETE' }); toast('Job deleted.'); show('jobs'); }
  catch (e) { toast(e.message, true); }
}

/* =============================== MESSAGES =============================== */
async function renderMessages() {
  const el = $('view-messages');
  el.innerHTML = '<div class="empty">Loading&hellip;</div>';
  const d = await api('/api/my/messages');
  if (!d.threads.length) { el.innerHTML = '<div class="card"><div class="card-body"><div class="empty">No course chat yet - enroll in a course to start one.</div></div></div>'; return; }
  el.innerHTML = `<div class="card"><div class="card-head"><h3>Course conversations</h3></div>
    <div class="card-body tight">${d.threads.map((t) => `
      <div class="list-row">
        <div class="grow">
          <div class="t">${esc(t.course_title)}${t.unread ? ` <span class="bell-badge" style="position:static;display:inline-flex">${t.unread}</span>` : ''}</div>
          <div class="s" style="color:var(--muted)">${t.last_message ? esc(t.last_message.display_name) + ': ' + esc(t.last_message.body).slice(0, 90) : 'No messages yet'}</div>
        </div>
        <button class="btn btn-teal btn-sm" onclick="openMessageThread(${t.batch_id})">Open</button>
      </div>`).join('')}</div></div>`;
}
async function openMessageThread(batchId) {
  await openCourse(batchId);
  const chatTab = Array.from(document.querySelectorAll('.tab')).find((t) => t.dataset.tab === 'Chat');
  if (chatTab) courseTab(chatTab);
  try { await api(`/api/batches/${batchId}/chat/read`, { method: 'POST' }); } catch {}
  refreshMessageBadge();
}

/* ============================ COURSE DETAIL ============================ */
async function openCourse(id, openTab) {
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
    menu.push(`<button onclick="formAnnouncement()">Post announcement</button>`);
    menu.push(`<button onclick="formAward()">Award bonus gems</button>`);
    menu.push(`<button onclick="formIssueCert()">Issue certificate</button>`);
    menu.push(`<button onclick="formIssueAllCerts()">Issue certificates (whole course)</button>`);
    if (['instructor', 'admin'].includes(ME.role)) menu.push(`<button onclick="formUploadSignature()">My certificate signature</button>`);
  }
  if (isAdmin) {
    menu.push(`<button onclick="formStudents()">Add students</button>`);
    menu.push(`<button onclick="formTeacher()">Add a teacher</button>`);
    menu.push(`<button onclick="formCertSettings()">Certificate settings</button>`);
    menu.push(`<button onclick="formPartnerSettings()">Certificate partner (WebEra)</button>`);
    menu.push(`<button onclick="toggleBatchPartner(${b.id},${!!b.partner})">${b.partner ? '✓ WebEra collaboration (on)' : 'Mark as WebEra collaboration'}</button>`);
    menu.push(`<button class="danger" onclick="deleteBatch()">Delete this course</button>`);
  }

  const tabs = ['Quest', 'Classes', 'Quizzes', 'Chat', 'Content', 'Leaderboard'];
  if (isStaff()) tabs.push('People', 'At-risk', 'Report');

  const initialTab = tabs.includes(openTab) ? openTab : tabs[0];
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
    <div class="tabs">${tabs.map((t) => `<div class="tab${t === initialTab ? ' active' : ''}" data-tab="${t}" onclick="courseTab(this)">${t}</div>`).join('')}</div>
    <div id="courseTabBody"></div>`;
  drawCourseTab(initialTab);
}
function courseTab(el) {
  document.querySelectorAll('.tab').forEach((t) => t.classList.remove('active'));
  el.classList.add('active');
  drawCourseTab(el.dataset.tab);
}
function drawCourseTab(tab) {
  const d = CURRENT_BATCH; const body = $('courseTabBody');
  const canManage = d.can_manage;
  if (CHAT_TIMER) { clearInterval(CHAT_TIMER); CHAT_TIMER = null; }
  if (typeof QUIZ_TICK !== 'undefined' && QUIZ_TICK) { clearInterval(QUIZ_TICK); QUIZ_TICK = null; }
  // Deliberately does NOT stop a live call here - the call widget lives
  // outside this tab body so it keeps running no matter which tab is open.

  if (tab === 'Quest') { renderQuestTab(body); return; }
  if (tab === 'Quizzes') { renderQuizzesTab(body); return; }
  if (tab === 'At-risk') { renderAtRiskTab(body); return; }
  if (tab === 'Chat') { renderChatTab(body); return; }
  if (tab === 'Classes') { renderClassesTab(body); return; }

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
        <div class="card-body" style="padding-bottom:0"><input id="peopleSearch" class="search-input" placeholder="Search by registration number or name..." oninput="filterPeopleTable(this.value)"></div>
        <div class="card-body" style="padding:0;overflow-x:auto"><table class="tbl" id="peopleTbl">
          <tr><th></th><th>Name</th><th>Reg no</th><th>Username</th><th></th></tr>
          ${d.students.map((s) => `<tr data-search="${esc((s.name + ' ' + (s.reg_no || '') + ' ' + (s.username || '')).toLowerCase())}">
            <td style="width:44px">${avatarHtml(s.avatar, s.name, 30)}</td>
            <td>${esc(s.name)}</td><td class="mono">${esc(s.reg_no || '—')}</td><td class="mono">${esc(s.username || '—')}</td>
            <td style="text-align:right;white-space:nowrap"><button class="btn btn-teal btn-sm" onclick="openStudentProfile(${s.id})">View profile</button>
            ${isAdmin ? `<button class="btn btn-danger btn-sm" onclick="removeStudent(${s.id})">Remove</button>` : ''}</td></tr>`).join('') || `<tr><td colspan="5" class="empty">No students enrolled yet.</td></tr>`}
        </table></div></div>`;
  }

  if (tab === 'Report' && isStaff()) {
    const r = d.report;
    const atRisk = r.students.filter((s) => s.at_risk).length;
    body.innerHTML = `
      ${canManage && ME.ai_enabled ? `<div class="card"><div class="card-body" style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
        <span class="s" style="color:var(--muted)">AI tools draft; you review before anything reaches a student.</span>
        <span style="flex:1"></span>
        <button class="btn btn-ghost btn-sm" onclick="aiClassSummary()">AI class summary</button>
        <button class="btn btn-ghost btn-sm" onclick="openBatchReports()">Skill reports</button>
      </div></div>` : ''}
      <div class="card"><div class="card-head"><h3>Progress report</h3><span class="s" style="color:var(--muted)">${r.assignments.length} quest task${r.assignments.length === 1 ? '' : 's'}${atRisk ? ` &middot; <strong style="color:var(--danger)">${atRisk} at risk</strong>` : ''}</span></div>
      <div class="card-body" style="padding:0;overflow-x:auto"><table class="tbl">
        <tr><th>Student</th><th>Reg no</th><th>Stage</th><th>Level</th><th>Submitted</th><th>Graded</th><th>Avg</th><th>Gems</th><th>Streak</th><th>Risk</th><th>Latest remark</th>${canManage && ME.ai_enabled ? '<th></th>' : ''}</tr>
        ${r.students.map((s) => `<tr>
          <td>${esc(s.name)}</td><td class="mono">${esc(s.reg_no || '—')}</td>
          <td>${stagePill(s.stage)}</td>
          <td>${s.of_levels ? s.level + '/' + s.of_levels : '—'}</td>
          <td>${s.submitted}/${s.total_assignments}</td><td>${s.graded}/${s.total_assignments}</td>
          <td>${s.avg != null ? s.avg + '%' : '—'}</td><td>${gemChip(s.gems)}</td>
          <td>${s.streak ? '&#128293; ' + s.streak + 'd' : '—'}</td>
          <td>${s.at_risk ? `<span class="s" style="color:var(--danger);font-weight:700">At risk</span><div class="s" style="color:var(--muted-2)">${s.missing ? s.missing + ' missing' : ''}${s.missing && s.inactive_days != null ? ' &middot; ' : ''}${s.inactive_days != null ? s.inactive_days + 'd quiet' : 'never active'}</div>` : '<span class="s" style="color:var(--ok)">OK</span>'}</td>
          <td class="s" style="max-width:200px">${esc(s.last_remark || '—')}</td>
          ${canManage && ME.ai_enabled ? `<td style="white-space:nowrap"><button class="btn btn-ghost btn-sm" onclick="aiSkillReport(${s.id},'${esc(s.name).replace(/'/g, '&#39;')}')">Course</button>
            <button class="btn btn-ghost btn-sm" onclick="aiOverallReport(${s.id},'${esc(s.name).replace(/'/g, '&#39;')}')">Overall</button></td>` : ''}</tr>`).join('') || `<tr><td colspan="12" class="empty">No students enrolled yet.</td></tr>`}
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
      <p class="hint">Every scheduled class gets a built-in join button and automatic attendance - no Zoom or Meet link needed.</p>
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
      <label class="field"><span>New students - one per line as "Full Name, email"</span><textarea name="names" placeholder="Ayesha Khan, ayesha@gmail.com&#10;Bilal Noor, bilal@gmail.com"></textarea></label>
      <p class="hint">A real, working email is required for each candidate - their generated username is just a login handle, not an inbox. A password and registration number are generated and mailed to that email automatically.</p>
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
        out.created.map((c) => `<div class="cred-box">${esc(c.name)}<br>Reg no: <strong>${esc(c.reg_no)}</strong><br>Username: ${esc(c.username)}<br>Password: ${esc(c.password)}${c.emailed ? '<br><span style="color:var(--ok)">&#10003; credentials emailed to ' + esc(c.email) + '</span>' : '<br><span style="color:var(--muted)">SMTP not configured - share these credentials yourself</span>'}</div>`).join('');
      if (out.added.length) html += `<p style="margin:12px 0 4px;font-weight:600">Enrolled existing students:</p>` + out.added.map((a) => `<div class="cred-box">${esc(a.name)} (${esc(a.reg_no)})</div>`).join('');
      if (out.invalid && out.invalid.length) html += `<p style="margin:12px 0 4px;color:var(--danger)">Skipped - needs a real email: ${out.invalid.map(esc).join('; ')}</p>`;
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
    <div class="card-body tight">${d.upcoming.length ? d.upcoming.map(sessionRow).join('') : emptyScheduleHTML()}</div></div>`;
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

/* =============================== SETTINGS =============================== */
// v13: this used to be "Profile" - gamification (stage/badges) moved to the
// Progress view and certificates moved to their own Certificates view, so
// Settings stays focused on account actions and profile details.
async function renderSettings() {
  const el = $('view-settings');
  ME = await api('/api/auth/me');
  drawAvatar();
  const p = ME.profile || {};
  const fieldLabels = {
    phone: 'Phone', dob: 'Date of birth', gender: 'Gender', cnic: 'CNIC / B-form', father_name: 'Father / guardian name',
    address: 'Address', city: 'City', education: 'Education', institute: 'School / institute', emergency_contact: 'Emergency contact',
    goal: 'Goal', links: 'LinkedIn / GitHub', designation: 'Designation', qualification: 'Qualification',
    expertise: 'Expertise', experience_years: 'Experience (years)', joining_date: 'Joining date', office_hours: 'Office hours',
  };
  const rows = Object.keys(p).length
    ? Object.entries(p).map(([k, v]) => `<div class="kv"><span class="k">${esc(fieldLabels[k] || k.replace(/_/g, ' '))}</span><span>${esc(v)}</span></div>`).join('')
    : '<div class="s" style="color:var(--muted)">No details yet - open the &#8942; menu and choose Update profile.</div>';
  const isTeacher = ['instructor', 'admin'].includes(ME.role);
  el.innerHTML = `
    <div class="profile-top">
      <div class="profile-id card"><div class="card-body" style="display:flex;gap:16px;align-items:center">
        ${avatarHtml(ME.avatar, ME.name, 72)}
        <div style="flex:1;min-width:0">
          <h2 style="margin:0 0 2px">${esc(ME.name)}</h2>
          <div class="s" style="color:var(--muted)">${roleLabel(ME.role)}${ME.reg_no ? ' &middot; Reg no <span class="mono">' + esc(ME.reg_no) + '</span>' : ''} &middot; ${esc(ME.email || ME.username || '')}</div>
        </div>
        <div class="dd">
          <button class="kebab" onclick="this.nextElementSibling.classList.toggle('open')" title="Account menu" aria-label="Account menu">&#8942;</button>
          <div class="dd-menu">
            <button onclick="formChangePassword()">Change password</button>
            <button onclick="openProfileForm()">Update profile</button>
            <button onclick="formUploadAvatar()">Upload picture</button>
            ${isTeacher ? '<button onclick="formUploadSignature()">Certificate signature</button>' : ''}
            ${ME.reg_no ? '<button onclick="sharePublicProfile()">Copy public profile link</button>' : ''}
            <button class="danger" onclick="logout()">Sign out</button>
          </div>
        </div>
      </div></div>
    </div>
    <div id="myReports"></div>
    <div class="card"><div class="card-head"><h3>Profile details</h3><button class="btn btn-ghost btn-sm" onclick="openProfileForm()">Edit</button></div>
      <div class="card-body kv-grid">${rows}</div></div>`;
  loadMyReports();
}
function formChangePassword() {
  openModal('Change password', `
    <form id="f">
      <label class="field"><span>Current password</span><input name="current" type="password" required autocomplete="current-password"></label>
      <label class="field"><span>New password</span><input name="next" type="password" required minlength="8" placeholder="At least 8 characters" autocomplete="new-password"></label>
      <button class="btn btn-primary btn-block">Update password</button></form>`);
  $('f').addEventListener('submit', async (e) => {
    e.preventDefault(); const f = e.target; const btn = f.querySelector('button'); btn.disabled = true;
    try { await api('/api/me/password', { method: 'POST', body: JSON.stringify({ current: f.current.value, next: f.next.value }) }); toast('Password updated.'); closeModal(); }
    catch (err) { modalMsg(err.message); btn.disabled = false; }
  });
}
function formUploadAvatar() {
  openModal('Upload profile picture', `
    <form id="f">
      <label class="field"><span>Your photo - PNG, JPG or WebP, under 3 MB</span><input name="file" type="file" accept=".png,.jpg,.jpeg,.webp" required></label>
      <p class="hint">Your picture appears in the top bar, the course chat, and on your profile.</p>
      <button class="btn btn-primary btn-block">Upload picture</button></form>`);
  $('f').addEventListener('submit', async (e) => {
    e.preventDefault(); const f = e.target; const btn = f.querySelector('button'); btn.disabled = true;
    try { await api('/api/me/avatar', { method: 'POST', body: new FormData(f) }); toast('Picture updated.'); closeModal(); renderSettings(); }
    catch (err) { modalMsg(err.message); btn.disabled = false; }
  });
}
function formUploadSignature() {
  openModal('Your certificate signature', `
    <form id="f">
      ${ME.signature ? `<div style="margin-bottom:10px"><span class="s" style="color:var(--muted)">Current signature:</span><br><img src="${esc(ME.signature)}" alt="signature" style="max-height:70px;border:1px solid var(--line);border-radius:8px;padding:6px;background:#fff"></div>` : ''}
      <label class="field"><span>Signature image - PNG with transparent background looks best</span><input name="file" type="file" accept=".png,.jpg,.jpeg,.webp" required></label>
      <p class="hint">This signature is printed on every certificate you issue as the course instructor.</p>
      <button class="btn btn-primary btn-block">Save signature</button></form>`);
  $('f').addEventListener('submit', async (e) => {
    e.preventDefault(); const f = e.target; const btn = f.querySelector('button'); btn.disabled = true;
    try { await api('/api/me/signature', { method: 'POST', body: new FormData(f) }); toast('Signature saved - it will appear on certificates you issue.'); closeModal(); renderSettings(); }
    catch (err) { modalMsg(err.message); btn.disabled = false; }
  });
}
/* ============================= CERTIFICATES ============================= */
async function renderCertificates() {
  const el = $('view-certificates');
  el.innerHTML = '<div class="empty">Loading&hellip;</div>';
  const d = await api('/api/certificates/mine');
  if (!d.certificates.length) {
    el.innerHTML = '<div class="card"><div class="card-body"><div class="empty">No certificates yet - complete a course or quest to earn one.</div></div></div>';
    return;
  }
  el.innerHTML = `<div class="card"><div class="card-head"><h3>My certificates</h3><span class="s" style="color:var(--muted)">QR-verified &middot; share straight to LinkedIn</span></div>
    <div class="card-body tight">${d.certificates.map((c) => `
      <div class="list-row" style="padding:12px 4px">
        <div class="grow">
          <div class="t">${esc(c.title)}</div>
          <div class="s" style="color:var(--muted)">${esc(c.kind)} &middot; completed ${fmtDate(c.completion_date)} &middot; serial <span class="mono">${esc(c.serial)}</span></div>
        </div>
        <a class="btn btn-teal btn-sm" href="/cert?s=${esc(c.serial)}" target="_blank" rel="noopener">View &amp; download</a>
        <button class="btn btn-ghost btn-sm" onclick="shareCertLinkedIn('${esc(c.serial)}','${esc(c.title).replace(/'/g, '&#39;')}','${esc(c.completion_date)}','${esc(c.org).replace(/'/g, '&#39;')}')">in&nbsp;Add to LinkedIn</button>
      </div>`).join('')}</div></div>`;
}
function shareCertLinkedIn(serial, title, date, org) {
  const url = location.origin + '/cert?s=' + serial;
  const y = (date || '').slice(0, 4), m = Number((date || '').slice(5, 7)) || 1;
  const add = 'https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME'
    + '&name=' + encodeURIComponent(title)
    + '&organizationName=' + encodeURIComponent(org || 'EchoLens Digital')
    + '&issueYear=' + y + '&issueMonth=' + m
    + '&certUrl=' + encodeURIComponent(url) + '&certId=' + encodeURIComponent(serial);
  window.open(add, '_blank');
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

/* =============================== PROGRESS =============================== */
async function renderProgress() {
  const el = $('view-progress');
  el.innerHTML = '<div class="empty">Loading&hellip;</div>';
  const [me, courses] = await Promise.all([api('/api/auth/me'), api('/api/my/courses')]);
  ME.gamify = me.gamify;
  const g = me.gamify;
  if (!g) { el.innerHTML = '<div class="empty">Progress tracking is for student accounts.</div>'; return; }
  const perCourse = courses.courses.map((c) => `
    <div class="list-row">
      <div class="grow">
        <div class="t">${esc(c.title || c.name)}</div>
        <div class="s">${c.next_level ? `Next: Level ${c.next_level.no} &middot; ${esc(c.next_level.title)}` : (c.progress_pct >= 100 ? 'Track completed' : 'Not started yet')}</div>
        <div class="mini-bar"><div class="mini-fill" data-w="${c.progress_pct}"></div></div>
      </div>
      <div style="font-weight:700;color:var(--ink);min-width:40px;text-align:right">${c.progress_pct}%</div>
    </div>`).join('') || '<div class="empty">Enroll in a course to start tracking progress.</div>';
  el.innerHTML = `
    ${prismCard(g)}
    <div class="stat-grid">
      ${stat(g.streak, 'Day streak')}${stat(g.gems, 'Gems')}${stat(g.badges.length, 'Badges')}
    </div>
    ${journeyRail(g)}
    <div class="card"><div class="card-head"><h3>Progress by course</h3></div><div class="card-body tight">${perCourse}</div></div>
    ${badgesCard(g)}`;
  requestAnimationFrame(() => { el.querySelectorAll('.prism-fill,.mini-fill,.cl-fill').forEach((f) => (f.style.width = f.dataset.w + '%')); });
}
function openProfileForm() {
  const p = ME.profile || {};
  const isStaffRole = ['instructor', 'admin', 'coordinator'].includes(ME.role);
  openModal('Update profile', `
    <form id="f">
      <div class="form-grid">
        <label class="field"><span>Phone / WhatsApp</span><input name="phone" value="${esc(p.phone || '')}" placeholder="03xx-xxxxxxx"></label>
        <label class="field"><span>Date of birth</span><input name="dob" type="date" value="${esc(p.dob || '')}"></label>
        <label class="field"><span>Gender</span><select name="gender"><option value="">—</option>${['Male', 'Female', 'Other'].map((g) => `<option${p.gender === g ? ' selected' : ''}>${g}</option>`).join('')}</select></label>
        <label class="field"><span>CNIC / B-form</span><input name="cnic" value="${esc(p.cnic || '')}" placeholder="xxxxx-xxxxxxx-x"></label>
        <label class="field"><span>Father / guardian name</span><input name="father_name" value="${esc(p.father_name || '')}"></label>
        <label class="field"><span>City</span><input name="city" value="${esc(p.city || '')}"></label>
      </div>
      <label class="field"><span>Address</span><input name="address" value="${esc(p.address || '')}"></label>
      <div class="form-grid">
        <label class="field"><span>Education</span><input name="education" value="${esc(p.education || '')}" placeholder="e.g. BS Computer Science"></label>
        <label class="field"><span>School / institute</span><input name="institute" value="${esc(p.institute || '')}"></label>
      </div>
      <label class="field"><span>Emergency contact - name &amp; phone</span><input name="emergency_contact" value="${esc(p.emergency_contact || '')}"></label>
      ${isStaffRole ? `
      <p class="hint" style="margin:6px 0 8px">Professional details (staff)</p>
      <div class="form-grid">
        <label class="field"><span>Designation</span><input name="designation" value="${esc(p.designation || '')}" placeholder="e.g. Senior Instructor"></label>
        <label class="field"><span>Qualification</span><input name="qualification" value="${esc(p.qualification || '')}" placeholder="e.g. MS Data Science"></label>
        <label class="field"><span>Expertise</span><input name="expertise" value="${esc(p.expertise || '')}" placeholder="e.g. Python, ML, GenAI"></label>
        <label class="field"><span>Experience (years)</span><input name="experience_years" type="number" min="0" value="${esc(p.experience_years || '')}"></label>
        <label class="field"><span>Joining date</span><input name="joining_date" type="date" value="${esc(p.joining_date || '')}"></label>
        <label class="field"><span>Office hours</span><input name="office_hours" value="${esc(p.office_hours || '')}" placeholder="e.g. Mon-Fri 6-8pm"></label>
      </div>` : ''}
      <div class="form-grid">
        <label class="field"><span>Goal</span><input name="goal" value="${esc(p.goal || '')}" placeholder="What are you here to achieve?"></label>
        <label class="field"><span>LinkedIn / GitHub</span><input name="links" value="${esc(p.links || '')}"></label>
      </div>
      <button class="btn btn-primary btn-block">Save</button></form>`, true);
  $('f').addEventListener('submit', async (e) => {
    e.preventDefault(); const f = e.target; const obj = {}; new FormData(f).forEach((v, k) => { obj[k] = String(v).trim(); });
    try { await api('/api/me/profile', { method: 'POST', body: JSON.stringify(obj) }); toast('Profile saved.'); closeModal(); renderSettings(); }
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
    ['Open website users', d.users.filter((u) => u.role === 'free')],
    ['Teachers', d.users.filter((u) => u.role === 'instructor')],
    ['Ambassadors', d.users.filter((u) => u.role === 'ambassador')],
    ['Staff & Interns', d.users.filter((u) => u.role === 'staff')],
    ['Coordinators', d.users.filter((u) => u.role === 'coordinator')],
    ['HR', d.users.filter((u) => u.role === 'hr')],
    ['Finance', d.users.filter((u) => u.role === 'finance')],
    ['Admissions Office', d.users.filter((u) => u.role === 'student_coordinator')],
    ['Admins', d.users.filter((u) => u.role === 'admin')],
  ];
  el.innerHTML = `
    <div class="card"><div class="card-head"><h3>Find a student</h3><span class="s" style="color:var(--muted)">Search by registration number or name - opens the complete profile</span></div>
      <div class="card-body">
        <input id="globalStudentSearch" class="search-input" placeholder="e.g. 4821736 or Ayesha Khan" autocomplete="off">
        <div id="studentSearchOut" class="search-out"></div>
      </div></div>
    ${isAdmin ? `<div class="card"><div class="card-body" style="display:flex;gap:10px;flex-wrap:wrap;align-items:center">
      <span class="s" style="color:var(--muted)">Forgot passwords are fixed here - reset keeps the account, gems, and enrollments intact.</span>
      <span style="flex:1"></span>
      <button class="btn btn-ghost btn-sm" onclick="formCertSettings()">Certificate settings</button>
      <button class="btn btn-ghost btn-sm" onclick="formCoordinator()">Add a coordinator</button>
      <button class="btn btn-ghost btn-sm" onclick="formDeptStaff('hr')">Add HR staff</button>
      <button class="btn btn-ghost btn-sm" onclick="formDeptStaff('finance')">Add finance staff</button>
      <button class="btn btn-ghost btn-sm" onclick="formDeptStaff('student_coordinator')">Add admissions officer</button>
      <button class="btn btn-ghost btn-sm" onclick="formNewAmbassador()">Add an ambassador</button>
      <button class="btn btn-ghost btn-sm" onclick="formDeptStaff('instructor')">Add an instructor</button>
      <button class="btn btn-ghost btn-sm" onclick="formStaffOrIntern('staff')">Add staff</button>
      <button class="btn btn-ghost btn-sm" onclick="formStaffOrIntern('intern')">Add an intern</button>
    </div></div>` : ''}
    ${groups.map(([label, users]) => userGroupTable(label, users, isAdmin)).join('')}`;
  wireStudentSearch();
}
// v17: HR / Finance / Student Coordinator accounts - same name+email,
// admin-issued-credentials flow as formCoordinator(), just a different
// (fully isolated) role and endpoint per department.
const DEPT_CREATE = {
  hr: { path: '/api/admin/hr', title: 'Add HR staff', hint: 'HR staff see only their own portal - staff records, onboarding, and leave duties. No access to courses, grades, or finances.' },
  finance: { path: '/api/admin/finance', title: 'Add finance staff', hint: 'Finance staff see only their own portal - fees, invoices, and expense duties. No access to courses, grades, or staff records.' },
  student_coordinator: { path: '/api/admin/student-coordinators', title: 'Add an admissions officer', hint: 'Admissions officers see only their own portal - student registrations, fee challans, discount categories, and enrollment follow-up. No access to grades, expenses, or staff records.' },
  instructor: { path: '/api/hr/instructors', title: 'Add an instructor', hint: 'Added to the Teachers department automatically. On first login they complete a profile with mandatory qualification documents, which auto-emails their contract - sign, attach documents and upload as a zip within 2 days to receive the offer letter.' },
};
// Staff and Interns share one HR record type (StaffRecords.employment_type)
// and one creation endpoint - only the "Employment type" field differs.
function formStaffOrIntern(kind) {
  const isIntern = kind === 'intern';
  openModal(isIntern ? 'Add an intern' : 'Add a staff member', `
    <form id="f">
      <label class="field"><span>Full name</span><input name="name" required placeholder="e.g. Sara Nadeem"></label>
      <label class="field"><span>Email - the account is generated from it</span><input name="email" type="email" required placeholder="name@company.com"></label>
      <div class="form-grid">
        <label class="field"><span>Phone (optional)</span><input name="phone"></label>
        <label class="field"><span>Position (optional)</span><input name="position" placeholder="e.g. Video Editor"></label>
      </div>
      <p class="hint">The username is generated from the email (at staff.echolens) and the password is mailed there automatically. On first login they complete a short profile - no contract is issued for ${isIntern ? 'interns' : 'staff'}.</p>
      <button class="btn btn-primary btn-block">Create ${isIntern ? 'intern' : 'staff'} account</button></form>
    <div id="credOut"></div>`);
  $('f').addEventListener('submit', async (e) => {
    e.preventDefault(); const f = e.target; const btn = f.querySelector('button'); btn.disabled = true; modalMsg('');
    try {
      const out = await api('/api/hr/staff', { method: 'POST', body: JSON.stringify({ name: f.name.value, email: f.email.value.trim(), phone: f.phone.value.trim(), position: f.position.value.trim(), employment_type: isIntern ? 'intern' : 'paid_staff' }) });
      $('credOut').innerHTML = `<p style="margin:12px 0 4px;font-weight:600">Account created - credentials were emailed to ${esc(f.email.value.trim())}:</p>
        <div class="cred-box">${esc(out.credentials.name)}<br>Username: ${esc(out.credentials.username)}<br>Password: ${esc(out.credentials.password)}<br><span class="s">Signs in with the username above or their email.</span></div>`;
      modalMsg('Account created and credentials emailed.', true); f.reset();
    } catch (err) { modalMsg(err.message); }
    btn.disabled = false;
  });
}
function formDeptStaff(role) {
  const cfg = DEPT_CREATE[role];
  openModal(cfg.title, `
    <form id="f">
      <label class="field"><span>Full name</span><input name="name" required placeholder="e.g. Bilal Ahmed"></label>
      <label class="field"><span>Email - the account is generated from it</span><input name="email" type="email" required placeholder="name@company.com"></label>
      <p class="hint">Enter the exact email: the account is generated from it (the username keeps the same name with the department's own domain, e.g. tahir@finance.echolens) and the password is mailed to that inbox automatically. ${cfg.hint}</p>
      <button class="btn btn-primary btn-block">Create account</button></form>
    <div id="credOut"></div>`);
  $('f').addEventListener('submit', async (e) => {
    e.preventDefault(); const f = e.target; const btn = f.querySelector('button'); btn.disabled = true; modalMsg('');
    try {
      const out = await api(cfg.path, { method: 'POST', body: JSON.stringify({ name: f.name.value, email: f.email.value.trim() }) });
      $('credOut').innerHTML = `<p style="margin:12px 0 4px;font-weight:600">Account created - credentials were emailed to ${esc(f.email.value.trim())}:</p>
        <div class="cred-box">${esc(out.credentials.name)}<br>Username: ${esc(out.credentials.username)}<br>Password: ${esc(out.credentials.password)}<br><span class="s">Signs in with the username above or their email.</span></div>`;
      modalMsg('Account created and credentials emailed.', true); f.reset();
    } catch (err) { modalMsg(err.message); }
    btn.disabled = false;
  });
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
  openModal('Add a coordinator', `
    <form id="f">
      <label class="field"><span>Full name</span><input name="name" required placeholder="e.g. Hina Raza"></label>
      <label class="field"><span>Email - the account is generated from it</span><input name="email" type="email" required placeholder="name@company.com"></label>
      <p class="hint">Enter the exact email: the account is generated from it (the username keeps the same name at coordinator.echolens) and the password is mailed to that inbox automatically. Coordinators see every course, report, and leaderboard - but cannot add, remove, grade, or change anything.</p>
      <button class="btn btn-primary btn-block">Create coordinator account</button></form>
    <div id="credOut"></div>`);
  $('f').addEventListener('submit', async (e) => {
    e.preventDefault(); const f = e.target; const btn = f.querySelector('button'); btn.disabled = true; modalMsg('');
    try {
      const out = await api('/api/admin/coordinators', { method: 'POST', body: JSON.stringify({ name: f.name.value, email: f.email.value.trim() }) });
      $('credOut').innerHTML = `<p style="margin:12px 0 4px;font-weight:600">Coordinator account - credentials were emailed to ${esc(f.email.value.trim())}:</p>
        <div class="cred-box">${esc(out.credentials.name)}<br>Username: ${esc(out.credentials.username)}<br>Password: ${esc(out.credentials.password)}<br><span class="s">Signs in with the username above or their email.</span></div>`;
      modalMsg('Coordinator created and credentials emailed.', true); f.reset();
    } catch (err) { modalMsg(err.message); }
    btn.disabled = false;
  });
}
async function delUser(uid, name) {
  if (!confirm(`Delete ${name}'s account entirely? Their enrollments are removed too. This cannot be undone.`)) return;
  try { await api(`/api/admin/users/${uid}`, { method: 'DELETE' }); toast('Account deleted.'); renderUsers(); }
  catch (e) { toast(e.message, true); }
}

/* ============================== v17: DEPARTMENT PORTALS ==============================
 * HR, Finance, Student Coordinator, and Staff each get their own fully
 * isolated portal wired to the real registration -> challan -> payment ->
 * enrollment pipeline, plus HR's staff/group directory.
 */
function money(n) { return 'Rs ' + Number(n || 0).toLocaleString('en-US'); }
const PIPELINE_LABEL = { new: 'New', challan_issued: 'Challan issued', challan_sent: 'Challan sent', paid_cleared: 'Payment verified', enrolled: 'Enrolled' };
const PIPELINE_COLOR = { new: '#6B7280', challan_issued: '#D89A00', challan_sent: '#2A7BD1', paid_cleared: '#0FBFA8', enrolled: '#1FA36B' };
function pipelineBadge(stage) {
  const label = PIPELINE_LABEL[stage] || stage, color = PIPELINE_COLOR[stage] || '#6B7280';
  return `<span style="display:inline-block;font-size:11.5px;font-weight:700;padding:3px 10px;border-radius:999px;background:${color}1a;color:${color}">${esc(label)}</span>`;
}
function deptHeaderHtml(title) {
  return `<div class="card" style="margin-bottom:16px"><div class="card-body" style="display:flex;gap:16px;align-items:center">
    ${avatarHtml(ME.avatar, ME.name, 56)}
    <div><h2 style="margin:0 0 2px;font-size:19px">${esc(title)}</h2><div class="s" style="color:var(--muted)">Signed in as ${esc(ME.name)} &middot; ${esc(ME.email || ME.username || '')}</div></div>
  </div></div>`;
}
function deptTabBarHtml(tabs, active, switchFn) {
  return `<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px">
    ${tabs.map(([k, l]) => `<button type="button" class="btn ${k === active ? 'btn-primary' : 'btn-ghost'} btn-sm" onclick="${switchFn}('${k}')">${esc(l)}</button>`).join('')}
  </div>`;
}

/* -------------------------- Talent Marketplace: recruiter portal (Phase 1) --------------------------
 * A recruiter sees nothing but this single status screen until an admin
 * approves them (see DEPT_ROLES above, which isolates the whole nav down
 * to just this view + Settings). Its content branches on ME.recruiter.status.
 */
async function renderRecruiterPortal() {
  const el = $('view-recruiter');
  const r = ME.recruiter || {};
  const body = r.status === 'needs_info' ? recruiterNeedsInfoHtml(r)
    : r.status === 'rejected' ? recruiterRejectedHtml(r)
    : r.status === 'approved' ? recruiterApprovedHtml(r)
    : recruiterPendingHtml(r);
  el.innerHTML = deptHeaderHtml('Recruiter Portal') + body;
  if (r.status === 'needs_info') wireRecruiterResubmitForm();
}
function recruiterPendingHtml(r) {
  return `<div class="card"><div class="card-body">
    <h3 style="margin-top:0">Your account is being reviewed</h3>
    <p class="s" style="color:var(--muted)">Our team verifies every recruiter before they can search EchoLens student profiles. This is usually done within one business day - we will email you at ${esc(ME.email || '')} as soon as a decision is made.</p>
    ${r.company ? `<p class="s" style="color:var(--muted)">Company on file: <strong>${esc(r.company.name)}</strong> (${esc(r.company.domain)})</p>` : ''}
    ${r.override_requested ? `<p class="s" style="color:var(--muted)">Your account is flagged for manual review as a small company without a dedicated work email domain.</p>` : ''}
  </div></div>`;
}
function recruiterRejectedHtml(r) {
  return `<div class="card"><div class="card-body">
    <h3 style="margin-top:0">We could not verify your account</h3>
    <p class="s" style="color:var(--muted)">${esc(r.status_reason || 'No reason was given.')}</p>
    <p class="s" style="color:var(--muted)">If you believe this is a mistake, contact info@echolens.digital.</p>
  </div></div>`;
}
function recruiterApprovedHtml() {
  return `<div class="card"><div class="card-body">
    <h3 style="margin-top:0">You&rsquo;re verified</h3>
    <p class="s" style="color:var(--muted)">Search verified EchoLens student profiles and reach out to candidates.</p>
    <a class="btn btn-primary" href="/talent/search">Open Talent Search</a>
    <a class="btn btn-ghost" href="/talent/interest" style="margin-left:8px">My contact requests</a>
  </div></div>`;
}
function recruiterNeedsInfoHtml(r) {
  const c = r.company || {};
  return `<div class="card" style="margin-bottom:12px"><div class="card-body">
    <h3 style="margin-top:0">We need a bit more information</h3>
    <p class="s" style="color:var(--muted)">${esc(r.status_reason || '')}</p>
  </div></div>
  <div class="card"><div class="card-body">
    <form id="recruiterResubmitForm">
      <label class="field"><span>Company name</span><input name="company_name" value="${esc(c.name || '')}" required></label>
      <label class="field"><span>Company website</span><input type="url" name="company_website" value="${esc(c.website || '')}" placeholder="https://yourcompany.com"></label>
      <label class="field"><span>Your designation</span><input name="designation" value="${esc(r.designation || '')}" required></label>
      <label class="field"><span>City</span><input name="city" value="${esc(r.city || '')}" required></label>
      <label class="field"><span>What do you typically hire for?</span><textarea name="hiring_note" rows="3" required>${esc(r.hiring_note || '')}</textarea></label>
      <button class="btn btn-primary" type="submit">Resubmit for review</button>
    </form>
  </div></div>`;
}
function wireRecruiterResubmitForm() {
  const f = $('recruiterResubmitForm'); if (!f) return;
  f.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = f.querySelector('button'); btn.disabled = true;
    try {
      const out = await api('/api/recruiter/resubmit', {
        method: 'POST',
        body: JSON.stringify({
          company_name: f.company_name.value.trim(), company_website: f.company_website.value.trim(),
          designation: f.designation.value.trim(), city: f.city.value.trim(), hiring_note: f.hiring_note.value.trim(),
        }),
      });
      ME.recruiter = out.recruiter;
      toast('Resubmitted for review.');
      renderRecruiterPortal();
    } catch (err) { toast(err.message, true); btn.disabled = false; }
  });
}

/* -------------------------- admin: recruiter verification queue -------------------------- */
let ADMIN_RECRUITERS = [];
let ADMIN_RECRUITER_FOLDER = 'pending';
const ADMIN_RECRUITER_FOLDERS = [['pending', 'Pending'], ['needs_info', 'Needs info'], ['approved', 'Approved'], ['rejected', 'Rejected']];
function adminRecruiterFolder(f) { ADMIN_RECRUITER_FOLDER = f; renderAdminRecruiters(); }
let ADMIN_RECRUITERS_TAB = 'verification';
function adminRecruitersTab(tab) { ADMIN_RECRUITERS_TAB = tab; renderAdminRecruiters(); }
async function renderAdminRecruiters() {
  const el = $('view-admin-recruiters');
  const tabs = [['verification', 'Verification'], ['analytics', 'Talent analytics'], ['reports', 'Reports']];
  el.innerHTML = deptTabBarHtmlFor(tabs, ADMIN_RECRUITERS_TAB, 'adminRecruitersTab') + '<div id="adminRecruitersBody"><div class="empty">Loading&hellip;</div></div>';
  if (ADMIN_RECRUITERS_TAB === 'analytics') renderTalentAnalytics();
  else if (ADMIN_RECRUITERS_TAB === 'reports') renderTalentReports();
  else renderRecruiterVerificationQueue();
}
// Same look as deptTabBarHtml but usable outside a department portal header.
function deptTabBarHtmlFor(tabs, active, switchFn) {
  return `<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px">
    ${tabs.map(([k, l]) => `<button type="button" class="btn ${k === active ? 'btn-primary' : 'btn-ghost'} btn-sm" onclick="${switchFn}('${k}')">${esc(l)}</button>`).join('')}
  </div>`;
}
async function renderRecruiterVerificationQueue() {
  const box = $('adminRecruitersBody');
  const d = await api('/api/admin/recruiters');
  ADMIN_RECRUITERS = d.recruiters;
  const chips = ADMIN_RECRUITER_FOLDERS.map(([k, l]) =>
    `<button type="button" class="btn ${k === ADMIN_RECRUITER_FOLDER ? 'btn-primary' : 'btn-ghost'} btn-sm" onclick="adminRecruiterFolder('${k}')">${esc(l)}${d.counts[k] ? ` (${d.counts[k]})` : ''}</button>`).join('');
  const rows = d.recruiters.filter((r) => r.status === ADMIN_RECRUITER_FOLDER);
  box.innerHTML = `
    <div class="card" style="margin-bottom:12px"><div class="card-body"><span class="s" style="color:var(--muted)">Every recruiter signup lands here for review before they can search student profiles.</span></div></div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px">${chips}</div>
    ${rows.length ? rows.map(adminRecruiterRow).join('') : '<div class="empty">Nothing here right now.</div>'}`;
}
async function renderTalentAnalytics() {
  const box = $('adminRecruitersBody');
  const d = await api('/api/admin/talent/analytics');
  const tile = (n, l) => `<div class="pub-stat"><div class="n">${n ?? '-'}</div><div class="l">${esc(l)}</div></div>`;
  box.innerHTML = `
    <div class="pub-stats" style="grid-template-columns:repeat(auto-fit,minmax(140px,1fr));margin-bottom:16px">
      ${tile(d.published_profiles, 'Published profiles')}
      ${tile(d.active_recruiters, 'Active recruiters')}
      ${tile(d.searches_run, 'Searches run')}
      ${tile(d.contact_requests_sent, 'Contact requests sent')}
      ${tile(d.acceptance_rate != null ? d.acceptance_rate + '%' : '-', 'Acceptance rate')}
      ${tile(d.revealed_contacts, 'Revealed contacts')}
    </div>
    <div class="card"><div class="card-head"><h3>Top searched skills</h3></div>
      <div class="card-body tight">${d.top_searched_skills.length ? d.top_searched_skills.map((s) => `<div class="kv"><span class="k">${esc(s.name)}</span><span>${s.n}</span></div>`).join('') : '<div class="empty">No searches with skill filters yet.</div>'}</div></div>`;
}
async function renderTalentReports() {
  const box = $('adminRecruitersBody');
  const d = await api('/api/admin/talent/reports?status=open');
  box.innerHTML = d.reports.length ? d.reports.map((r) => `<div class="card" style="margin-bottom:10px"><div class="card-body">
    <div style="font-weight:700">${esc(r.target_type)} #${r.target_id}</div>
    <div class="s" style="color:var(--muted)">Reported by ${esc(r.reporter_name)} &middot; ${esc((r.created_at || '').slice(0, 10))}</div>
    <div class="s" style="margin-top:4px">${esc(r.reason)}</div>
    <div style="margin-top:8px;display:flex;gap:8px">
      <button class="btn btn-danger btn-sm" onclick="adminUnpublishReported('${r.target_type}',${r.target_id},${r.id})">Unpublish</button>
      <button class="btn btn-ghost btn-sm" onclick="adminResolveReport(${r.id})">Mark resolved</button>
      <button class="btn btn-ghost btn-sm" onclick="adminDismissReport(${r.id})">Dismiss</button>
    </div>
  </div></div>`).join('') : '<div class="empty">No open reports.</div>';
}
async function adminUnpublishReported(targetType, targetId, reportId) {
  const reason = prompt('Reason (shown to the student):');
  if (!reason || !reason.trim()) return;
  try {
    const endpoint = targetType === 'profile' ? `/api/admin/talent/profiles/${targetId}/unpublish` : `/api/admin/talent/projects/${targetId}/unpublish`;
    await api(endpoint, { method: 'POST', body: JSON.stringify({ reason: reason.trim() }) });
    await api(`/api/admin/talent/reports/${reportId}/resolve`, { method: 'POST' });
    toast('Unpublished and report resolved.'); renderTalentReports();
  } catch (e) { toast(e.message, true); }
}
async function adminResolveReport(id) {
  try { await api(`/api/admin/talent/reports/${id}/resolve`, { method: 'POST' }); renderTalentReports(); }
  catch (e) { toast(e.message, true); }
}
async function adminDismissReport(id) {
  try { await api(`/api/admin/talent/reports/${id}/dismiss`, { method: 'POST' }); renderTalentReports(); }
  catch (e) { toast(e.message, true); }
}

/* ------------------------- showcase moderation (v20 step 6 Part C) ------------------------- */
// Admin sees every batch's items; instructors see only their own - enforced
// server-side by Showcase.moderationQueue() (store.js), not here. This view
// only ever renders whatever GET /api/showcase/moderation/queue returns.
let SHOWCASE_MOD_QUEUE = null;
async function renderShowcaseModeration() {
  const el = $('view-showcase-moderation');
  el.innerHTML = '<div class="empty">Loading&hellip;</div>';
  try {
    const d = await api('/api/showcase/moderation/queue');
    SHOWCASE_MOD_QUEUE = d;
    const reportGroups = groupShowcaseReports(d.open_reports);
    el.innerHTML = `
      <div class="card" style="margin-bottom:18px"><div class="card-body">
        <span class="s" style="color:var(--muted)">Posts held for review and open content reports${ME.role === 'instructor' ? ' for your own courses' : ' across every course'}. Every action reviews the full post first - nothing here acts from an excerpt.</span>
      </div></div>
      <div class="card-head" style="padding:0 0 10px;border:none"><h3>Pending review (${d.pending_posts.length})</h3></div>
      ${d.pending_posts.length ? `<div class="card"><div class="card-body tight">${d.pending_posts.map(showcaseModPostRow).join('')}</div></div>` : '<div class="card"><div class="empty">No posts waiting for review.</div></div>'}
      <div class="card-head" style="padding:22px 0 10px;border:none"><h3>Open reports (${reportGroups.length})</h3></div>
      ${reportGroups.length ? `<div class="card"><div class="card-body tight">${reportGroups.map(showcaseModReportRow).join('')}</div></div>` : '<div class="card"><div class="empty">No open reports.</div></div>'}`;
  } catch (e) {
    el.innerHTML = `<div class="empty">${esc(e.message)}</div>`;
  }
}
// Multiple reports can target the same post/comment (ShowcaseReport is
// unique per reporter, see the backend) - grouped here so the queue shows
// "3 reports" once instead of three separate rows for the same content.
function groupShowcaseReports(reports) {
  const groups = new Map();
  for (const r of reports || []) {
    const key = `${r.target_type}:${r.target_id}`;
    if (!groups.has(key)) groups.set(key, { target_type: r.target_type, target_id: r.target_id, target: r.target, reasons: [], reportIds: [] });
    const g = groups.get(key);
    g.reasons.push(r.reason);
    g.reportIds.push(r.id);
  }
  return Array.from(groups.values());
}
function showcaseThumb(post) {
  const im = post && post.images && post.images[0];
  const base = (SHOWCASE_MOD_QUEUE && SHOWCASE_MOD_QUEUE.r2_base) || '';
  return im
    ? `<img src="${esc(base + '/' + (im.thumb_key || im.r2_key))}" alt="" style="width:56px;height:56px;object-fit:cover;border-radius:10px;flex:none">`
    : `<div style="width:56px;height:56px;border-radius:10px;flex:none;background:var(--canvas)"></div>`;
}
function showcaseModPostRow(p) {
  return `<div class="job-comment-row" style="align-items:center">
    ${showcaseThumb(p)}
    <div style="flex:1;min-width:0">
      <div class="t">${esc(p.author ? p.author.name : 'Unknown author')}</div>
      <div class="s">${esc((p.caption || '').slice(0, 140))}${(p.caption || '').length > 140 ? '&hellip;' : ''}</div>
      <div class="when">${esc((p.created_at || '').slice(0, 16))} &middot; ${p.visibility === 'PUBLIC' ? 'Public' : 'Cohort'}</div>
    </div>
    <button class="btn btn-primary btn-sm" onclick="reviewShowcasePost(${p.id})">Review</button>
  </div>`;
}
function showcaseModReportRow(g) {
  const excerpt = g.target_type === 'POST'
    ? (g.target ? esc((g.target.caption || '').slice(0, 100)) : 'Post no longer exists')
    : (g.target ? esc((g.target.body || '').slice(0, 100)) : 'Comment no longer exists');
  return `<div class="job-comment-row" style="align-items:center">
    ${g.target_type === 'POST' ? showcaseThumb(g.target) : `<div style="width:56px;height:56px;border-radius:10px;flex:none;background:var(--canvas);display:flex;align-items:center;justify-content:center;font-size:10.5px;color:var(--muted-2)">Comment</div>`}
    <div style="flex:1;min-width:0">
      <div class="t">${g.reportIds.length} report${g.reportIds.length === 1 ? '' : 's'} &middot; ${g.target_type === 'POST' ? 'Post' : 'Comment'}</div>
      <div class="s">${excerpt}</div>
      <div class="when">Reason${g.reasons.length === 1 ? '' : 's'}: ${esc(Array.from(new Set(g.reasons)).slice(0, 3).join('; '))}</div>
    </div>
    <button class="btn btn-primary btn-sm" onclick="reviewShowcaseReport('${g.target_type}',${g.target_id})">Review</button>
  </div>`;
}

function reviewShowcasePost(id) {
  const p = ((SHOWCASE_MOD_QUEUE || {}).pending_posts || []).find((x) => x.id === id);
  if (!p) return;
  renderShowcaseReviewModal(p, { isPending: true, postActionId: p.id });
}
async function reviewShowcaseReport(targetType, targetId) {
  const group = groupShowcaseReports((SHOWCASE_MOD_QUEUE || {}).open_reports).find((g) => g.target_type === targetType && g.target_id === targetId);
  if (!group) return;
  if (targetType === 'POST') {
    renderShowcaseReviewModal(group.target, { isReport: true, reportedKind: 'POST', reportIds: group.reportIds, reasons: group.reasons });
    return;
  }
  // Comment report: fetch the FULL parent post so this is never actioned
  // from just the comment's own text - "review the post in full" applies
  // to a comment report too, per the brief.
  openModal('Review report', '<div class="empty">Loading the full post&hellip;</div>');
  try {
    const post = group.target && group.target.post_id ? (await api(`/api/showcase/posts/${group.target.post_id}`)).post : null;
    renderShowcaseReviewModal(post, { isReport: true, reportedKind: 'COMMENT', reportIds: group.reportIds, reasons: group.reasons, comment: group.target });
  } catch (e) {
    openModal('Could not load', `<div class="empty">${esc(e.message)}</div>`);
  }
}
function renderShowcaseReviewModal(post, ctx) {
  const images = (post && post.images) || [];
  const base = (SHOWCASE_MOD_QUEUE && SHOWCASE_MOD_QUEUE.r2_base) || '';
  const gallery = images.length
    ? `<div style="display:grid;grid-template-columns:repeat(${Math.min(images.length, 2)},1fr);gap:6px;margin-bottom:12px">${images.map((im) => `<img src="${esc(base + '/' + im.r2_key)}" alt="" style="width:100%;border-radius:10px">`).join('')}</div>` : '';
  const commentBlock = ctx.comment ? `<div class="review-share-box" style="margin-top:10px"><div class="rsb-head">Reported comment</div><div>${esc(ctx.comment.body)}</div></div>` : '';
  const reasonsBlock = ctx.isReport ? `<div class="s" style="margin-top:10px;color:var(--muted)"><strong>${ctx.reportIds.length} report${ctx.reportIds.length === 1 ? '' : 's'}:</strong> ${esc(Array.from(new Set(ctx.reasons)).join('; '))}</div>` : '';
  const reportIdsJson = JSON.stringify(ctx.reportIds || []);

  const body = !post ? '<div class="empty">This post no longer exists.</div>' : `
    ${gallery}
    <div style="font-weight:700">${esc(post.author ? post.author.name : 'Unknown author')}</div>
    <div class="s" style="color:var(--muted);margin-bottom:8px">${esc((post.created_at || '').slice(0, 16))} &middot; ${post.visibility === 'PUBLIC' ? 'Public' : 'Cohort'} &middot; ${esc(post.status)}</div>
    <div class="sc-caption">${esc(post.caption)}</div>
    ${commentBlock}
    ${reasonsBlock}
    <div style="display:flex;gap:8px;margin-top:18px;flex-wrap:wrap">
      ${ctx.isPending ? `
        <button class="btn btn-primary btn-sm" onclick="showcaseModAction('post',[${ctx.postActionId}],'approve')">Approve</button>
        <button class="btn btn-danger btn-sm" onclick="showcaseModActionWithReason('post',[${ctx.postActionId}],'remove')">Reject &amp; remove</button>` : ''}
      ${ctx.isReport ? `
        <button class="btn btn-danger btn-sm" onclick="showcaseModActionWithReason('report',${reportIdsJson},'remove')">${ctx.reportedKind === 'COMMENT' ? 'Remove comment' : 'Remove post'}</button>
        <button class="btn btn-ghost btn-sm" onclick="showcaseModAction('report',${reportIdsJson},'dismiss')">Dismiss report${ctx.reportIds.length === 1 ? '' : 's'}</button>` : ''}
      <button class="btn btn-ghost btn-sm" onclick="closeModal()">Close</button>
    </div>`;
  openModal(ctx.isPending ? 'Review post' : 'Review report', body, true);
}
// A grouped report resolves as ONE action per underlying ShowcaseReport row
// (the moderation endpoint only ever accepts one report id at a time) - looped
// here so "remove"/"dismiss" on a 3-report group clears all 3, not just one.
async function showcaseModAction(kind, ids, action) {
  try {
    for (const id of ids) await api(`/api/showcase/moderation/${id}/action`, { method: 'POST', body: JSON.stringify({ target_type: kind, action }) });
    toast(action === 'approve' ? 'Post approved.' : action === 'dismiss' ? 'Report dismissed.' : 'Done.');
    closeModal();
    renderShowcaseModeration();
  } catch (e) { toast(e.message, true); }
}
async function showcaseModActionWithReason(kind, ids, action) {
  const reason = prompt('Reason (optional - kept in the audit log):') || undefined;
  try {
    for (const id of ids) await api(`/api/showcase/moderation/${id}/action`, { method: 'POST', body: JSON.stringify({ target_type: kind, action, reason }) });
    toast('Removed.');
    closeModal();
    renderShowcaseModeration();
  } catch (e) { toast(e.message, true); }
}
function adminRecruiterRow(r) {
  const c = r.company || {};
  let actions;
  if (r.status === 'rejected') actions = `<span class="s" style="color:var(--danger)">Rejected</span>`;
  else if (r.status === 'approved') actions = `<span class="s" style="color:var(--ok)">Approved</span>`;
  else actions = `<button class="btn btn-primary btn-sm" onclick="adminRecruiterApprove(${r.id})">Approve</button>
    <button class="btn btn-ghost btn-sm" onclick="adminRecruiterRequestInfo(${r.id})">Request more information</button>
    <button class="btn btn-danger btn-sm" onclick="adminRecruiterReject(${r.id})">Reject</button>`;
  const overrideNote = r.override_requested ? `<div class="s" style="margin-top:4px;color:var(--danger);font-weight:600">Small-company override requested: ${esc(r.override_reason || '')}</div>` : '';
  const statusNote = r.status === 'needs_info' ? `<div class="s" style="margin-top:4px;color:var(--muted)">Asked: ${esc(r.status_reason || '')}</div>`
    : r.status === 'rejected' ? `<div class="s" style="margin-top:4px;color:var(--muted)">Reason: ${esc(r.status_reason || '')}</div>` : '';
  return `<div class="card" style="margin-bottom:10px"><div class="card-body" style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap">
    <div>
      <div style="font-weight:700">${esc(r.name)} <span class="s" style="color:var(--muted);font-weight:400">&middot; ${esc(r.email)}</span></div>
      <div class="s" style="color:var(--muted)">${esc(c.name || '-')} (${esc(c.domain || '-')}) &middot; ${esc(r.designation || '-')} &middot; ${esc(r.city || '-')} &middot; ${esc(c.size_band || '-')}</div>
      <div class="s" style="color:var(--muted)">${esc(r.hiring_note || '')}</div>
      ${overrideNote}${statusNote}
    </div>
    <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">${actions}</div>
  </div></div>`;
}
async function adminRecruiterApprove(id) {
  try { await api(`/api/admin/recruiters/${id}/approve`, { method: 'POST' }); toast('Recruiter approved.'); renderAdminRecruiters(); }
  catch (e) { toast(e.message, true); }
}
function adminRecruiterReject(id) {
  openModal('Reject recruiter', `
    <form id="f">
      <label class="field"><span>Reason (shown to the recruiter)</span><textarea name="reason" rows="3" required></textarea></label>
      <button class="btn btn-danger btn-block">Reject</button>
    </form>`);
  $('f').addEventListener('submit', async (e) => {
    e.preventDefault(); const f = e.target; const btn = f.querySelector('button'); btn.disabled = true; modalMsg('');
    try {
      await api(`/api/admin/recruiters/${id}/reject`, { method: 'POST', body: JSON.stringify({ reason: f.reason.value.trim() }) });
      toast('Recruiter rejected.'); closeModal(); renderAdminRecruiters();
    } catch (err) { modalMsg(err.message); btn.disabled = false; }
  });
}
function adminRecruiterRequestInfo(id) {
  openModal('Request more information', `
    <form id="f">
      <label class="field"><span>What do you need from them? (shown to the recruiter)</span><textarea name="message" rows="3" required></textarea></label>
      <button class="btn btn-primary btn-block">Send request</button>
    </form>`);
  $('f').addEventListener('submit', async (e) => {
    e.preventDefault(); const f = e.target; const btn = f.querySelector('button'); btn.disabled = true; modalMsg('');
    try {
      await api(`/api/admin/recruiters/${id}/request-info`, { method: 'POST', body: JSON.stringify({ message: f.message.value.trim() }) });
      toast('Request sent to the recruiter.'); closeModal(); renderAdminRecruiters();
    } catch (err) { modalMsg(err.message); btn.disabled = false; }
  });
}

/* -------------------------- Talent Marketplace: student profile (Phases 2-3) -------------------------- */
let TALENT_STATE = null;
let TALENT_PROJECTS = [];
const REMOTE_PREF_LABELS = { remote: 'Remote', onsite: 'Onsite', hybrid: 'Hybrid' };
const AVAILABILITY_LABELS = { immediately: 'Immediately', within_month: 'Within a month', after_graduation: 'After graduation', not_looking: 'Not looking' };
const WORK_TYPE_LABELS = { internship: 'Internship', part_time: 'Part time', full_time: 'Full time', freelance: 'Freelance' };
function selectOptionsHtml(labels, current) {
  return '<option value="">Choose one</option>' + Object.entries(labels).map(([k, l]) => `<option value="${k}" ${current === k ? 'selected' : ''}>${l}</option>`).join('');
}
async function renderTalentProfile() {
  const el = $('view-talent-profile');
  el.innerHTML = '<div class="empty">Loading&hellip;</div>';
  TALENT_STATE = await api('/api/talent/me');
  el.innerHTML = talentCompletenessHtml() + talentProfileFormHtml() + talentSkillsHtml() + talentResumeHtml() + '<div id="talentProjectsBox"></div>';
  wireTalentProfileForm();
  wireTalentSkills();
  wireTalentResume();
  renderTalentProjects();
}
function talentCompletenessHtml() {
  const c = TALENT_STATE.completeness;
  const p = TALENT_STATE.profile;
  const bar = `<div style="height:8px;border-radius:999px;background:var(--line);overflow:hidden;margin:10px 0"><div style="height:100%;width:${c.pct}%;background:linear-gradient(90deg,#0FBFA8,#38BDF8)"></div></div>`;
  const checklist = c.checklist.map((item) => `<div class="s" style="color:${item.done ? 'var(--ok)' : 'var(--muted)'};margin-bottom:2px">${item.done ? '&#10003;' : '&#9675;'} ${esc(item.label)}</div>`).join('');
  const publishBtn = p && p.published
    ? `<button class="btn btn-ghost btn-sm" onclick="talentUnpublish()">Unpublish</button> <a class="btn btn-ghost btn-sm" href="${esc(TALENT_STATE.public_url)}" target="_blank" rel="noopener">View public profile</a>`
    : `<button class="btn btn-primary btn-sm" onclick="talentPublish()" ${c.can_publish ? '' : 'disabled'}>Publish profile</button>`;
  const unpublishedNotice = p && !p.published && p.unpublished_reason
    ? `<div class="s" style="color:var(--danger);background:#E5484D14;border-radius:8px;padding:8px 10px;margin-bottom:10px">An admin unpublished your profile: ${esc(p.unpublished_reason)}. Fix the issue and publish again once ready.</div>`
    : '';
  return `<div class="card" style="margin-bottom:14px"><div class="card-body">
    ${unpublishedNotice}
    <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px">
      <h3 style="margin:0">Profile completeness: ${c.pct}%</h3>
      <div>${publishBtn}</div>
    </div>
    ${bar}
    <div class="s" style="color:var(--muted)">${c.can_publish ? 'Your profile can be published.' : 'Reach 60% to publish your profile.'}</div>
    <div style="margin-top:10px;display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:2px">${checklist}</div>
  </div></div>`;
}
async function talentPublish() {
  try { await api('/api/talent/me/publish', { method: 'POST' }); toast('Profile published.'); renderTalentProfile(); }
  catch (e) { toast(e.message, true); }
}
async function talentUnpublish() {
  try { await api('/api/talent/me/unpublish', { method: 'POST' }); toast('Profile unpublished.'); renderTalentProfile(); }
  catch (e) { toast(e.message, true); }
}
function talentProfileFormHtml() {
  const p = TALENT_STATE.profile || {};
  const links = p.links || {};
  const edu = (p.education || []).map(talentEduRowHtml).join('');
  const exp = (p.experience || []).map(talentExpRowHtml).join('');
  return `<div class="card" style="margin-bottom:14px"><div class="card-head"><h3>Profile</h3></div>
    <div class="card-body">
    <form id="talentForm">
      <label class="field"><span>Handle (your public URL)</span>
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
          <span class="s" style="color:var(--muted);white-space:nowrap">${esc(location.origin)}/talent/</span>
          <input name="handle" value="${esc(p.handle || '')}" placeholder="your-name" style="flex:1;min-width:140px">
        </div></label>
      <label class="field"><span>Headline</span><input name="headline" maxlength="150" value="${esc(p.headline || '')}" placeholder="e.g. Aspiring data analyst"></label>
      <label class="field"><span>About (up to 1200 characters)</span><textarea name="about" rows="4" maxlength="1200">${esc(p.about || '')}</textarea></label>
      <div class="form-grid">
        <label class="field"><span>City</span><input name="city" value="${esc(p.city || '')}"></label>
        <label class="field"><span>Remote preference</span><select name="remote_pref">${selectOptionsHtml(REMOTE_PREF_LABELS, p.remote_pref)}</select></label>
      </div>
      <div class="form-grid">
        <label class="field"><span>Availability</span><select name="availability">${selectOptionsHtml(AVAILABILITY_LABELS, p.availability)}</select></label>
        <label class="field"><span>Expected salary (optional)</span><input name="salary_band" value="${esc(p.salary_band || '')}" placeholder="e.g. PKR 60-90k"></label>
      </div>
      <label class="field"><span style="display:flex;align-items:center;gap:8px;font-weight:400"><input type="checkbox" name="salary_visible" style="width:auto" ${p.salary_visible ? 'checked' : ''}> Show my expected salary on my public profile</span></label>
      <label class="field"><span>Work type sought</span>
        <div style="display:flex;gap:14px;flex-wrap:wrap">${Object.entries(WORK_TYPE_LABELS).map(([k, l]) => `<label style="display:flex;gap:6px;align-items:center;font-weight:400"><input type="checkbox" name="work_type" value="${k}" style="width:auto" ${(p.work_type || []).includes(k) ? 'checked' : ''}>${l}</label>`).join('')}</div>
      </label>
      <div class="form-grid">
        <label class="field"><span>GitHub</span><input name="link_github" type="url" value="${esc(links.github || '')}" placeholder="https://github.com/you"></label>
        <label class="field"><span>LinkedIn</span><input name="link_linkedin" type="url" value="${esc(links.linkedin || '')}" placeholder="https://linkedin.com/in/you"></label>
        <label class="field"><span>Personal site</span><input name="link_website" type="url" value="${esc(links.website || '')}" placeholder="https://yoursite.com"></label>
      </div>
      <h4 style="margin:18px 0 6px">Education</h4>
      <div id="talentEduRows">${edu}</div>
      <button type="button" class="btn btn-ghost btn-sm" onclick="talentAddEduRow()">Add education</button>
      <h4 style="margin:18px 0 6px">Experience</h4>
      <div id="talentExpRows">${exp}</div>
      <button type="button" class="btn btn-ghost btn-sm" onclick="talentAddExpRow()">Add experience</button>
      <div style="margin-top:16px"><button class="btn btn-primary" type="submit">Save profile</button></div>
    </form>
    </div></div>`;
}
function talentEduRowHtml(e = {}) {
  return `<div class="edu-row" style="border:1px solid var(--line);border-radius:10px;padding:10px;margin-bottom:8px">
    <div class="form-grid">
      <label class="field"><span>School</span><input class="edu-school" value="${esc(e.school || '')}"></label>
      <label class="field"><span>Degree</span><input class="edu-degree" value="${esc(e.degree || '')}"></label>
      <label class="field"><span>Field of study</span><input class="edu-field" value="${esc(e.field || '')}"></label>
      <label class="field"><span>Start year</span><input class="edu-start" type="number" value="${e.start_year || ''}"></label>
      <label class="field"><span>End year (or expected)</span><input class="edu-end" type="number" value="${e.end_year || ''}"></label>
    </div>
    <button type="button" class="btn btn-ghost btn-sm" onclick="this.closest('.edu-row').remove()">Remove</button>
  </div>`;
}
function talentAddEduRow() { $('talentEduRows').insertAdjacentHTML('beforeend', talentEduRowHtml()); }
function talentExpRowHtml(e = {}) {
  return `<div class="exp-row" style="border:1px solid var(--line);border-radius:10px;padding:10px;margin-bottom:8px">
    <div class="form-grid">
      <label class="field"><span>Company</span><input class="exp-company" value="${esc(e.company || '')}"></label>
      <label class="field"><span>Role</span><input class="exp-role" value="${esc(e.role || '')}"></label>
      <label class="field"><span>Start date</span><input class="exp-start" placeholder="e.g. Jun 2025" value="${esc(e.start_date || '')}"></label>
      <label class="field"><span>End date</span><input class="exp-end" placeholder="e.g. Present" value="${esc(e.end_date || '')}"></label>
    </div>
    <label class="field"><span>Description</span><textarea class="exp-desc" rows="2">${esc(e.description || '')}</textarea></label>
    <button type="button" class="btn btn-ghost btn-sm" onclick="this.closest('.exp-row').remove()">Remove</button>
  </div>`;
}
function talentAddExpRow() { $('talentExpRows').insertAdjacentHTML('beforeend', talentExpRowHtml()); }
function wireTalentProfileForm() {
  $('talentForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = e.target; const btn = f.querySelector('button[type="submit"]'); btn.disabled = true;
    const education = [...document.querySelectorAll('#talentEduRows .edu-row')].map((row) => ({
      school: row.querySelector('.edu-school').value.trim(), degree: row.querySelector('.edu-degree').value.trim(),
      field: row.querySelector('.edu-field').value.trim(),
      start_year: row.querySelector('.edu-start').value ? Number(row.querySelector('.edu-start').value) : null,
      end_year: row.querySelector('.edu-end').value ? Number(row.querySelector('.edu-end').value) : null,
    })).filter((r) => r.school);
    const experience = [...document.querySelectorAll('#talentExpRows .exp-row')].map((row) => ({
      company: row.querySelector('.exp-company').value.trim(), role: row.querySelector('.exp-role').value.trim(),
      start_date: row.querySelector('.exp-start').value.trim(), end_date: row.querySelector('.exp-end').value.trim(),
      description: row.querySelector('.exp-desc').value.trim(),
    })).filter((r) => r.company);
    const workType = [...f.querySelectorAll('input[name="work_type"]:checked')].map((c) => c.value);
    try {
      await api('/api/talent/me', {
        method: 'PUT', body: JSON.stringify({
          headline: f.headline.value.trim(), about: f.about.value.trim(), city: f.city.value.trim(),
          remote_pref: f.remote_pref.value || null, availability: f.availability.value || null, work_type: workType,
          salary_band: f.salary_band.value.trim(), salary_visible: f.salary_visible.checked,
          links: { github: f.link_github.value.trim(), linkedin: f.link_linkedin.value.trim(), website: f.link_website.value.trim() },
          education, experience,
        }),
      });
      const handle = f.handle.value.trim();
      if (handle && handle !== (TALENT_STATE.profile || {}).handle) {
        try { await api('/api/talent/me/handle', { method: 'POST', body: JSON.stringify({ handle }) }); }
        catch (err) { toast(err.message, true); }
      }
      toast('Profile saved.');
      renderTalentProfile();
    } catch (err) { toast(err.message, true); btn.disabled = false; }
  });
}
function talentSkillsHtml() {
  const skills = TALENT_STATE.skills || [];
  const chips = skills.map((s) => `<span style="display:inline-flex;align-items:center;gap:6px;background:var(--bg);border:1px solid var(--line);border-radius:999px;padding:4px 10px;margin:0 6px 6px 0;font-size:13px">${esc(s.name)}${s.needs_review ? ' <span class="s" style="color:var(--muted)">(pending review)</span>' : ''}<button type="button" onclick="talentRemoveSkill(${s.id})" style="border:none;background:none;cursor:pointer;color:var(--muted);font-weight:700">&times;</button></span>`).join('');
  return `<div class="card" style="margin-bottom:14px"><div class="card-head"><h3>Skills</h3></div>
    <div class="card-body">
      <div style="margin-bottom:10px">${chips || '<span class="s" style="color:var(--muted)">No skills added yet.</span>'}</div>
      <div style="position:relative;max-width:360px">
        <input id="talentSkillInput" placeholder="Type a skill and press Enter" autocomplete="off">
        <div class="dd-menu" id="talentSkillResults" style="left:0;right:auto;width:100%;max-height:220px;overflow:auto"></div>
      </div>
    </div></div>`;
}
function wireTalentSkills() {
  const inp = $('talentSkillInput'); const out = $('talentSkillResults');
  let t = null;
  inp.addEventListener('input', () => {
    clearTimeout(t);
    const q = inp.value.trim();
    if (q.length < 2) { out.classList.remove('open'); out.innerHTML = ''; return; }
    t = setTimeout(async () => {
      try {
        const d = await api('/api/talent/skills?q=' + encodeURIComponent(q));
        out.innerHTML = d.skills.map((s) => `<button onclick="talentAddSkill(${s.id})">${esc(s.name)}</button>`).join('')
          + `<button onclick="talentAddSkill(null, '${esc(q)}')">Add &quot;${esc(q)}&quot; as a new skill</button>`;
        out.classList.add('open');
      } catch { out.innerHTML = ''; }
    }, 200);
  });
  inp.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); if (inp.value.trim()) talentAddSkill(null, inp.value.trim()); }
    if (e.key === 'Escape') { out.classList.remove('open'); out.innerHTML = ''; }
  });
}
async function talentAddSkill(skillId, name) {
  try { await api('/api/talent/me/skills', { method: 'POST', body: JSON.stringify({ skill_id: skillId, name }) }); renderTalentProfile(); }
  catch (e) { toast(e.message, true); }
}
async function talentRemoveSkill(skillId) {
  try { await api('/api/talent/me/skills/' + skillId, { method: 'DELETE' }); renderTalentProfile(); }
  catch (e) { toast(e.message, true); }
}
function talentResumeHtml() {
  const p = TALENT_STATE.profile || {};
  return `<div class="card" style="margin-bottom:14px"><div class="card-head"><h3>Resume</h3></div>
    <div class="card-body">
      <div class="s" style="color:var(--muted);margin-bottom:10px">${p.has_resume ? 'A resume is on file. Uploading a new one replaces it. Never shown publicly.' : 'No resume uploaded yet. PDF only, up to 5 MB. Never shown publicly.'}</div>
      <form id="talentResumeForm" style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
        <input type="file" name="file" accept=".pdf" required>
        <button class="btn btn-primary btn-sm" type="submit">Upload</button>
      </form>
    </div></div>`;
}
function wireTalentResume() {
  $('talentResumeForm').addEventListener('submit', async (e) => {
    e.preventDefault(); const f = e.target; const btn = f.querySelector('button'); btn.disabled = true;
    try { await api('/api/talent/me/resume', { method: 'POST', body: new FormData(f) }); toast('Resume uploaded.'); renderTalentProfile(); }
    catch (err) { toast(err.message, true); btn.disabled = false; }
  });
}
async function renderTalentProjects() {
  const box = $('talentProjectsBox');
  box.innerHTML = '<div class="empty">Loading&hellip;</div>';
  const [eligibleR, projectsR] = await Promise.all([api('/api/talent/me/portfolio-eligible'), api('/api/talent/me/projects')]);
  TALENT_PROJECTS = projectsR.projects;
  const eligibleHtml = eligibleR.eligible.length ? `<div class="card" style="margin-bottom:12px"><div class="card-body">
    <h3 style="margin-top:0">Graded coursework ready to publish</h3>
    ${eligibleR.eligible.map((e) => `<div style="display:flex;justify-content:space-between;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--line)">
      <div><strong>${esc(e.task_title)}</strong><div class="s" style="color:var(--muted)">${esc(e.course_title)} &middot; graded ${e.grade}%</div></div>
      <button class="btn btn-primary btn-sm" onclick="talentPublishFromSubmission(${e.submission_id})">Publish as project</button>
    </div>`).join('')}
  </div></div>` : '';
  box.innerHTML = `
    <div class="card" style="margin-bottom:12px"><div class="card-head"><h3>My Projects</h3><button class="btn btn-primary btn-sm" onclick="talentAddProjectForm()">Add project</button></div></div>
    ${eligibleHtml}
    ${TALENT_PROJECTS.length ? TALENT_PROJECTS.map(talentProjectCardHtml).join('') : '<div class="empty">No projects yet.</div>'}`;
}
function talentProjectCardHtml(p) {
  const handle = (TALENT_STATE.profile || {}).handle || '';
  return `<div class="card" style="margin-bottom:10px"><div class="card-body" style="display:flex;gap:14px;flex-wrap:wrap">
    ${p.cover_image ? `<img src="${esc(p.cover_image)}" alt="" style="width:120px;height:80px;object-fit:cover;border-radius:8px;border:1px solid var(--line)">` : `<div style="width:120px;height:80px;border-radius:8px;background:var(--bg);border:1px solid var(--line);display:flex;align-items:center;justify-content:center" class="s">No cover</div>`}
    <div style="flex:1;min-width:200px">
      <div style="font-weight:700">${esc(p.title)} ${p.verified ? '<span class="s" style="color:var(--ok);font-weight:700">&middot; Verified by EchoLens</span>' : '<span class="s" style="color:var(--muted)">&middot; Self-added</span>'}${p.visible === false ? ' <span class="s" style="color:var(--danger)">&middot; Hidden</span>' : ''}</div>
      ${p.visible === false && p.hidden_reason ? `<div class="s" style="color:var(--danger)">An admin hid this project: ${esc(p.hidden_reason)}</div>` : ''}
      <div class="s" style="color:var(--muted)">${esc((p.tech_stack || []).join(', '))}</div>
      <div class="s" style="color:var(--muted)">${esc(p.summary || '')}</div>
      <div style="margin-top:8px;display:flex;gap:8px;flex-wrap:wrap">
        <button class="btn btn-ghost btn-sm" onclick="talentEditProjectForm(${p.id})">Edit</button>
        <button class="btn btn-ghost btn-sm" onclick="talentUploadCover(${p.id})">Cover image</button>
        <button class="btn btn-ghost btn-sm" onclick="talentUploadGalleryImage(${p.id})">Add gallery image</button>
        <a class="btn btn-ghost btn-sm" href="/talent/${esc(handle)}/projects/${p.id}" target="_blank" rel="noopener">View</a>
        <button class="btn btn-danger btn-sm" onclick="talentDeleteProject(${p.id})">Delete</button>
      </div>
    </div>
  </div></div>`;
}
async function talentPublishFromSubmission(submissionId) {
  try { await api('/api/talent/me/projects/from-submission', { method: 'POST', body: JSON.stringify({ submission_id: submissionId }) }); toast('Published as a project.'); renderTalentProjects(); }
  catch (e) { toast(e.message, true); }
}
function talentProjectFormFields(p = {}, lockTitle) {
  return `<form id="f">
    ${lockTitle ? `<div class="s" style="color:var(--muted);margin-bottom:10px">Title, course, grade and date come from your graded coursework and can&rsquo;t be changed here.</div>` : `<label class="field"><span>Title</span><input name="title" value="${esc(p.title || '')}" required></label>`}
    <label class="field"><span>Summary</span><input name="summary" maxlength="300" value="${esc(p.summary || '')}"></label>
    <label class="field"><span>Description (Markdown supported)</span><textarea name="description_markdown" rows="5">${esc(p.description_markdown || '')}</textarea></label>
    <label class="field"><span>Tech stack (comma separated)</span><input name="tech_stack" value="${esc((p.tech_stack || []).join(', '))}" placeholder="Python, Pandas, SQL"></label>
    <div class="form-grid">
      <label class="field"><span>Repository URL</span><input name="repo_url" type="url" value="${esc(p.repo_url || '')}"></label>
      <label class="field"><span>Live demo URL</span><input name="demo_url" type="url" value="${esc(p.demo_url || '')}"></label>
    </div>
    <div class="form-grid">
      <label class="field"><span>Your role</span><input name="role_played" value="${esc(p.role_played || '')}"></label>
      <label class="field"><span>Team size</span><input name="team_size" type="number" min="1" value="${p.team_size || ''}"></label>
    </div>
    <div class="form-grid">
      <label class="field"><span>Month completed</span><input name="completed_month" type="number" min="1" max="12" value="${p.completed_month || ''}"></label>
      <label class="field"><span>Year completed</span><input name="completed_year" type="number" value="${p.completed_year || ''}"></label>
    </div>
    <label class="field"><span style="display:flex;align-items:center;gap:8px;font-weight:400"><input type="checkbox" name="visible" style="width:auto" ${p.visible !== false ? 'checked' : ''}> Visible on my public profile</span></label>
    <button class="btn btn-primary btn-block" type="submit">Save project</button>
  </form>`;
}
function talentProjectFormValues(f) {
  const out = {
    summary: f.summary.value.trim(), description_markdown: f.description_markdown.value.trim(),
    tech_stack: f.tech_stack.value.split(',').map((t) => t.trim()).filter(Boolean),
    repo_url: f.repo_url.value.trim(), demo_url: f.demo_url.value.trim(),
    role_played: f.role_played.value.trim(), team_size: f.team_size.value || null,
    completed_month: f.completed_month.value || null, completed_year: f.completed_year.value || null,
    visible: f.visible.checked,
  };
  if (f.title) out.title = f.title.value.trim();
  return out;
}
function talentAddProjectForm() {
  openModal('Add project', talentProjectFormFields());
  $('f').addEventListener('submit', async (e) => {
    e.preventDefault(); const f = e.target; const btn = f.querySelector('button'); btn.disabled = true; modalMsg('');
    try { await api('/api/talent/me/projects', { method: 'POST', body: JSON.stringify(talentProjectFormValues(f)) }); toast('Project added.'); closeModal(); renderTalentProjects(); }
    catch (err) { modalMsg(err.message); btn.disabled = false; }
  });
}
function talentEditProjectForm(id) {
  const p = TALENT_PROJECTS.find((x) => x.id === id); if (!p) return;
  openModal('Edit project', talentProjectFormFields(p, p.verified));
  $('f').addEventListener('submit', async (e) => {
    e.preventDefault(); const f = e.target; const btn = f.querySelector('button'); btn.disabled = true; modalMsg('');
    try { await api(`/api/talent/me/projects/${id}`, { method: 'PUT', body: JSON.stringify(talentProjectFormValues(f)) }); toast('Project updated.'); closeModal(); renderTalentProjects(); }
    catch (err) { modalMsg(err.message); btn.disabled = false; }
  });
}
async function talentDeleteProject(id) {
  if (!confirm('Delete this project? This cannot be undone.')) return;
  try { await api(`/api/talent/me/projects/${id}`, { method: 'DELETE' }); toast('Project deleted.'); renderTalentProjects(); }
  catch (e) { toast(e.message, true); }
}
function talentUploadCover(id) {
  openModal('Upload cover image', `<form id="f"><label class="field"><span>Image - JPEG, PNG or WEBP</span><input type="file" name="file" accept=".jpg,.jpeg,.png,.webp" required></label><button class="btn btn-primary btn-block" type="submit">Upload</button></form>`);
  $('f').addEventListener('submit', async (e) => {
    e.preventDefault(); const f = e.target; const btn = f.querySelector('button'); btn.disabled = true; modalMsg('');
    try { await api(`/api/talent/me/projects/${id}/cover`, { method: 'POST', body: new FormData(f) }); toast('Cover image updated.'); closeModal(); renderTalentProjects(); }
    catch (err) { modalMsg(err.message); btn.disabled = false; }
  });
}
function talentUploadGalleryImage(id) {
  openModal('Add gallery image', `<form id="f"><label class="field"><span>Image - JPEG, PNG or WEBP (up to 6 per project)</span><input type="file" name="file" accept=".jpg,.jpeg,.png,.webp" required></label><button class="btn btn-primary btn-block" type="submit">Upload</button></form>`);
  $('f').addEventListener('submit', async (e) => {
    e.preventDefault(); const f = e.target; const btn = f.querySelector('button'); btn.disabled = true; modalMsg('');
    try { await api(`/api/talent/me/projects/${id}/gallery`, { method: 'POST', body: new FormData(f) }); toast('Gallery image added.'); closeModal(); renderTalentProjects(); }
    catch (err) { modalMsg(err.message); btn.disabled = false; }
  });
}

/* -------------------------- Talent Marketplace: student Hiring Interest (Phase 5) -------------------------- */
async function renderHiringInterest() {
  const el = $('view-hiring-interest');
  el.innerHTML = '<div class="empty">Loading&hellip;</div>';
  const d = await api('/api/talent/me/contact-requests');
  el.innerHTML = `<div class="card" style="margin-bottom:12px"><div class="card-body"><span class="s" style="color:var(--muted)">Recruiters who want to contact you appear here. Accepting shares your email, phone and resume with that recruiter only.</span></div></div>`
    + (d.requests.length ? d.requests.map(hiringInterestRow).join('') : '<div class="empty">No contact requests yet.</div>');
}
function hiringInterestRow(r) {
  const statusColor = r.status === 'accepted' ? 'var(--ok)' : r.status === 'declined' ? 'var(--danger)' : 'var(--muted)';
  const actions = r.status === 'pending'
    ? `<button class="btn btn-primary btn-sm" onclick="hiringAccept(${r.id})">Accept</button>
       <button class="btn btn-ghost btn-sm" onclick="hiringDecline(${r.id})">Decline</button>`
    : '';
  const blockBtn = r.company_id ? `<button class="btn btn-ghost btn-sm" onclick="hiringBlockCompany(${r.company_id})">Block ${esc(r.company || 'this company')}</button>` : '';
  return `<div class="card" style="margin-bottom:10px"><div class="card-body">
    <div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap">
      <div><strong>${esc(r.recruiter_name)}</strong>${r.company ? ` <span class="s" style="color:var(--muted)">&middot; ${esc(r.company)}</span>` : ''}</div>
      <span class="s" style="color:${statusColor};font-weight:700;text-transform:capitalize">${esc(r.status)}</span>
    </div>
    <div class="s" style="color:var(--muted);margin-top:4px">${esc(r.message)}</div>
    <div style="margin-top:8px;display:flex;gap:8px;flex-wrap:wrap">${actions}${blockBtn}
      ${r.status === 'accepted' ? `<button class="btn btn-ghost btn-sm" onclick="hiringOpenThread(${r.id})">Messages</button>` : ''}
    </div>
    <div id="hiringThread-${r.id}"></div>
  </div></div>`;
}
async function hiringAccept(id) {
  try { await api(`/api/talent/me/contact-requests/${id}/accept`, { method: 'POST' }); toast('Accepted - your contact details are now visible to this recruiter.'); renderHiringInterest(); }
  catch (e) { toast(e.message, true); }
}
async function hiringDecline(id) {
  try { await api(`/api/talent/me/contact-requests/${id}/decline`, { method: 'POST' }); toast('Declined.'); renderHiringInterest(); }
  catch (e) { toast(e.message, true); }
}
async function hiringBlockCompany(companyId) {
  if (!confirm('Block this company? Any pending requests from them will be declined, and they cannot contact you again.')) return;
  try { await api('/api/talent/me/block-company', { method: 'POST', body: JSON.stringify({ company_id: companyId }) }); toast('Company blocked.'); renderHiringInterest(); }
  catch (e) { toast(e.message, true); }
}
async function hiringOpenThread(id) {
  const box = $('hiringThread-' + id);
  box.innerHTML = '<div class="empty">Loading&hellip;</div>';
  const d = await api(`/api/talent/contact-requests/${id}/messages`);
  box.innerHTML = `
    <div style="max-height:200px;overflow:auto;border:1px solid var(--line);border-radius:8px;padding:8px;margin:8px 0">
      ${d.messages.length ? d.messages.map((m) => `<div style="margin-bottom:6px"><strong>${m.sender_role === 'student' ? 'You' : 'Recruiter'}:</strong> ${esc(m.body)}</div>`).join('') : '<div class="s" style="color:var(--muted)">No messages yet.</div>'}
    </div>
    <form onsubmit="return hiringSendMessage(event, ${id})" style="display:flex;gap:8px">
      <input name="body" placeholder="Write a message" style="flex:1" required>
      <button class="btn btn-primary btn-sm" type="submit">Send</button>
    </form>`;
}
async function hiringSendMessage(e, id) {
  e.preventDefault();
  const f = e.target;
  try { await api(`/api/talent/contact-requests/${id}/messages`, { method: 'POST', body: JSON.stringify({ body: f.body.value.trim() }) }); f.body.value = ''; hiringOpenThread(id); }
  catch (err) { toast(err.message, true); }
  return false;
}

/* -------------------------------- Finance portal -------------------------------- */
// v18: Finance verifies payments and confirms them - the student is then
// enrolled automatically. Challans, discounts, and bank details moved to the
// Admissions Office portal.
let FIN_TAB = 'verify';
function finTab(tab) { FIN_TAB = tab; renderDeptFinance(); }
async function renderDeptFinance() {
  const el = $('view-dept-finance');
  const tabs = [['verify', 'Payment verification'], ['expenses', 'Expenses & balance sheet'], ['ambassador-reports', 'Ambassador reports']];
  el.innerHTML = deptHeaderHtml('Finance Portal') + deptTabBarHtml(tabs, FIN_TAB, 'finTab') + '<div id="finTabBody"><div class="empty">Loading&hellip;</div></div>';
  if (FIN_TAB === 'verify') renderFinRegistrations();
  else if (FIN_TAB === 'ambassador-reports') renderAmbassadorReportsPanel('finTabBody');
  else renderFinExpenses();
}
async function renderFinRegistrations() {
  const box = $('finTabBody');
  const d = await api('/api/finance/registrations');
  const rows = d.registrations.filter((r) => r.payment_stage !== 'new');
  box.innerHTML = `
    <div class="card" style="margin-bottom:12px"><div class="card-body"><span class="s" style="color:var(--muted)">Students appear here once the Admissions Office generates and mails their challan. Match the payment screenshot and record the student emailed to <strong>${esc(d.finance_email || 'finance@echolens.digital')}</strong> against the challan, then confirm - the student moves to the Admissions Office's "Ready to enroll" folder, where they are placed in the right batch.</span></div></div>`
    + (rows.length ? rows.map(finRegRow).join('') : '<div class="empty">No challans generated yet - waiting on the Admissions Office.</div>');
}
function finRegRow(r) {
  const latest = r.challans[0];
  let action = `<span class="s" style="color:var(--muted)">Waiting on the Admissions Office</span>`;
  if (r.payment_stage === 'challan_issued') {
    action = `<span class="s" style="color:var(--muted)">Challan generated (net ${money(latest.net_fee)}) - not yet mailed to the student</span>
      <a class="btn btn-ghost btn-sm" href="/challan?s=${encodeURIComponent(latest.serial)}" target="_blank" rel="noopener">View challan</a>`;
  } else if (r.payment_stage === 'challan_sent') {
    action = `<span class="s" style="color:var(--muted)">Mailed &middot; net ${money(latest.net_fee)} &middot; due ${esc(latest.deadline || '-')}</span>
      <a class="btn btn-ghost btn-sm" href="/challan?s=${encodeURIComponent(latest.serial)}" target="_blank" rel="noopener">View challan</a>
      <button class="btn btn-primary btn-sm" onclick="finClearPayment(${r.id})">Verify &amp; confirm payment</button>`;
  } else if (r.payment_stage === 'paid_cleared') {
    action = `<span class="s" style="color:var(--ok)">Payment confirmed - with the Admissions Office for batch enrollment</span>`;
  } else if (r.payment_stage === 'enrolled') {
    action = `<span class="s" style="color:var(--ok)">Payment confirmed &middot; Enrolled</span>`;
  }
  return `<div class="card" style="margin-bottom:10px"><div class="card-body" style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap">
    <div>
      <div style="font-weight:700">${esc(r.name)} <span class="s" style="color:var(--muted);font-weight:400">&middot; ${esc(r.email)}</span></div>
      <div class="s" style="color:var(--muted)">${esc(r.course_title || r.course_code || '-')}${r.ambassador_code ? ` &middot; <span style="color:var(--ok);font-weight:700">10% ambassador (${esc(r.ambassador_code)})</span>` : ''} &nbsp;${pipelineBadge(r.payment_stage)}</div>
    </div>
    <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">${action}</div>
  </div></div>`;
}
async function finClearPayment(regId) {
  if (!confirm('Confirm you have verified the payment screenshot and payment record against this challan?')) return;
  try {
    await api(`/api/finance/registrations/${regId}/clear`, { method: 'POST' });
    toast('Payment confirmed - the student moved to the Admissions Office for batch enrollment.');
    renderFinRegistrations();
  } catch (e) { toast(e.message, true); }
}
async function renderFinExpenses() {
  const box = $('finTabBody');
  const [bs, ex] = await Promise.all([api('/api/finance/balance-sheet'), api('/api/finance/expenses')]);
  box.innerHTML = `
    <div class="card" style="margin-bottom:12px"><div class="card-head"><h3>Balance sheet</h3><span class="s" style="color:var(--muted)">Income from cleared challans, minus logged expenses</span></div>
      <div class="card-body">
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px">
          <div><div class="s" style="color:var(--muted)">Income (paid challans)</div><div style="font-size:22px;font-weight:800;color:var(--ok)">${money(bs.income)}</div></div>
          <div><div class="s" style="color:var(--muted)">Expenses</div><div style="font-size:22px;font-weight:800;color:var(--danger)">${money(bs.expenses)}</div></div>
          <div><div class="s" style="color:var(--muted)">Balance</div><div style="font-size:22px;font-weight:800">${money(bs.balance)}</div></div>
        </div>
        ${bs.expense_by_category.length ? `<div class="s" style="margin-top:14px;font-weight:700;color:var(--ink)">Expenses by category</div>
        <ul style="list-style:none;padding:0;margin:6px 0 0">${bs.expense_by_category.map((c) => `<li style="display:flex;justify-content:space-between;padding:4px 0;font-size:13px"><span>${esc(c.category)}</span><span>${money(c.amount)}</span></li>`).join('')}</ul>` : ''}
      </div></div>
    <div class="card"><div class="card-head"><h3>Expenses</h3><button class="btn btn-primary btn-sm" onclick="finAddExpense()">Add expense</button></div>
      <div class="card-body" style="padding:0;overflow-x:auto"><table class="tbl">
        <tr><th>Date</th><th>Category</th><th>Description</th><th>Amount</th><th></th></tr>
        ${ex.expenses.map((e) => `<tr><td>${esc(e.date)}</td><td>${esc(e.category)}</td><td class="s">${esc(e.description || '-')}</td><td>${money(e.amount)}</td>
          <td style="text-align:right"><button class="btn btn-danger btn-sm" onclick="finDeleteExpense(${e.id})">Delete</button></td></tr>`).join('') || '<tr><td colspan="5" class="empty">No expenses logged yet.</td></tr>'}
      </table></div></div>`;
}
function finAddExpense() {
  openModal('Add expense', `
    <form id="f">
      <label class="field"><span>Date</span><input name="date" type="date" value="${new Date().toISOString().slice(0, 10)}" required></label>
      <label class="field"><span>Category</span><input name="category" required placeholder="e.g. Rent, Salaries, Marketing"></label>
      <label class="field"><span>Description</span><input name="description" placeholder="Optional note"></label>
      <label class="field"><span>Amount (PKR)</span><input name="amount" type="number" min="1" required></label>
      <button class="btn btn-primary btn-block">Add expense</button></form>`);
  $('f').addEventListener('submit', async (e) => {
    e.preventDefault(); const f = e.target; const btn = f.querySelector('button'); btn.disabled = true; modalMsg('');
    try { await api('/api/finance/expenses', { method: 'POST', body: JSON.stringify({ date: f.date.value, category: f.category.value, description: f.description.value, amount: f.amount.value }) }); toast('Expense added.'); closeModal(); renderFinExpenses(); }
    catch (err) { modalMsg(err.message); btn.disabled = false; }
  });
}
async function finDeleteExpense(id) {
  if (!confirm('Delete this expense?')) return;
  try { await api(`/api/finance/expenses/${id}`, { method: 'DELETE' }); toast('Deleted.'); renderFinExpenses(); } catch (e) { toast(e.message, true); }
}

/* -------------------------------- Admissions Office portal --------------------------------
 * v18: formerly the Student Coordinator portal. Every registration lands
 * here; admissions generates the fee challan (ambassador 10% auto-applied,
 * any other discount picked here), mails it to the student, and manages the
 * discount categories and bank details printed on every challan. */
let COORD_TAB = 'registrations';
let COORD_REGS = [];
function coordTab(tab) { COORD_TAB = tab; renderDeptStudentCoordinator(); }
async function renderDeptStudentCoordinator() {
  const el = $('view-dept-student-coordinator');
  const tabs = [['registrations', 'Registrations & challans'], ['discounts', 'Discount categories'], ['bank', 'Bank details'], ['queries', 'Student queries'], ['instructors', 'Instructors'], ['ambassador-reports', 'Ambassador reports']];
  el.innerHTML = deptHeaderHtml('Admissions Office Portal') + deptTabBarHtml(tabs, COORD_TAB, 'coordTab') + '<div id="coordTabBody"><div class="empty">Loading&hellip;</div></div>';
  if (COORD_TAB === 'registrations') renderCoordRegistrations();
  else if (COORD_TAB === 'discounts') renderCoordDiscounts();
  else if (COORD_TAB === 'bank') renderCoordBank();
  else if (COORD_TAB === 'instructors') renderInstructorAssignmentPanel('coordTabBody', { canEditTag: false, canAssign: true });
  else if (COORD_TAB === 'ambassador-reports') renderAmbassadorReportsPanel('coordTabBody');
  else renderCoordQueries();
}
// Sub-folders: every registration sits in exactly one folder for its
// pipeline stage, so bundles of students stay organized as cohorts grow.
let COORD_FOLDER = 'new';
const COORD_FOLDERS = [
  ['new', 'New enrollments'],
  ['challan_issued', 'Challan generated'],
  ['challan_sent', 'Challan mailed - with Finance'],
  ['paid_cleared', 'Ready to enroll'],
  ['enrolled', 'Enrolled'],
];
function coordFolder(f) { COORD_FOLDER = f; renderCoordRegistrations(); }
async function renderCoordRegistrations() {
  const box = $('coordTabBody');
  const d = await api('/api/admissions/registrations');
  COORD_REGS = d.registrations;
  const count = (k) => d.registrations.filter((r) => r.payment_stage === k).length;
  const chips = COORD_FOLDERS.map(([k, l]) =>
    `<button type="button" class="btn ${k === COORD_FOLDER ? 'btn-primary' : 'btn-ghost'} btn-sm" onclick="coordFolder('${k}')">${esc(l)}${count(k) ? ` (${count(k)})` : ''}</button>`).join('');
  const rows = d.registrations.filter((r) => r.payment_stage === COORD_FOLDER);
  const folderLabel = (COORD_FOLDERS.find(([k]) => k === COORD_FOLDER) || [])[1] || '';
  box.innerHTML = `
    <div class="card" style="margin-bottom:12px"><div class="card-body"><span class="s" style="color:var(--muted)">Every registration from the website lands here (you are also emailed at <strong>${esc(d.admissions_email || 'admissions@echolens.digital')}</strong>). Generate the fee challan, review it, and mail it to the student - they pay and send proof to <strong>${esc(d.finance_email || 'finance@echolens.digital')}</strong>. Once Finance confirms the payment, the student appears in your <strong>Ready to enroll</strong> folder, where you place them in the right batch.</span></div></div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:space-between;align-items:center;margin-bottom:14px">
      <div style="display:flex;gap:8px;flex-wrap:wrap">${chips}</div>
      <button type="button" class="btn btn-primary btn-sm" onclick="coordOpenManualRegForm()">+ Add registration manually</button>
    </div>`
    + (rows.length ? rows.map(coordRegRow).join('') : `<div class="empty">Nothing in "${esc(folderLabel)}" right now.</div>`);
}
// Students who registered outside the website (e.g. a Google Form) never
// reach Registrations.create() on their own - this lets Admissions log them
// in by hand so they enter the exact same challan / Finance / enrollment
// pipeline as a website registration.
async function coordOpenManualRegForm() {
  let courses = [], cats = [];
  try { courses = (await api('/api/catalogue')).catalogue.filter((c) => c.price_pkr > 0); } catch {}
  try { cats = (await api('/api/admissions/discount-categories')).categories.filter((c) => c.active); } catch {}
  const courseOpts = courses.map((c) => `<option value="${esc(c.code)}|${esc(c.title)}">${esc(c.code)} - ${esc(c.title)} (PKR ${Number(c.price_pkr).toLocaleString()})</option>`).join('');
  const discOpts = ['<option value="">No discount</option>', ...cats.map((c) => `<option value="${c.id}">${esc(c.name)} (${c.type === 'flat' ? money(c.value) : c.value + '%'})</option>`)].join('');
  openModal('Add a registration manually', `
    <p class="s" style="color:var(--muted);margin-bottom:12px">For students who registered outside the website (e.g. a Google Form) - this drops them into the same challan &amp; Finance pipeline as a website registration.</p>
    <form id="f">
      <label class="field"><span>Student's full name</span><input name="name" required></label>
      <div class="form-grid">
        <label class="field" style="grid-column:span 2"><span>Email</span><input name="email" type="email" required></label>
        <label class="field"><span>WhatsApp / contact</span><input name="whatsapp" required placeholder="03XX-XXXXXXX" inputmode="tel"></label>
      </div>
      <label class="field"><span>Course</span><select name="course" required><option value="">Select a course&hellip;</option>${courseOpts}</select></label>
      <div class="form-grid">
        <label class="field"><span>City (optional)</span><input name="city"></label>
        <label class="field"><span>Ambassador code (optional)</span><input name="ambassador_code" maxlength="4" inputmode="numeric" pattern="[0-9]{4}" placeholder="e.g. 4821"></label>
      </div>
      <label class="field"><span>Discount, if applicable (optional)</span><select name="discount_category_id">${discOpts}</select></label>
      <label class="field"><span>Note (optional)</span><input name="note" placeholder="e.g. Filled the Google Form on 3 Aug"></label>
      <button class="btn btn-primary btn-block">Add registration</button></form>`);
  $('f').addEventListener('submit', async (e) => {
    e.preventDefault(); const f = e.target; const btn = f.querySelector('button'); btn.disabled = true; modalMsg('');
    const [course_code, course_title] = (f.course.value || '').split('|');
    try {
      await api('/api/admissions/registrations', {
        method: 'POST',
        body: JSON.stringify({
          name: f.name.value.trim(), email: f.email.value.trim(), whatsapp: f.whatsapp.value.trim(),
          course_code, course_title, city: f.city.value.trim(),
          ambassador_code: f.ambassador_code.value.trim(), discount_category_id: f.discount_category_id.value || null,
          note: f.note.value.trim(),
        }),
      });
      toast('Registration added - it is now in your New enrollments folder.');
      closeModal(); COORD_FOLDER = 'new'; renderCoordRegistrations();
    } catch (err) { modalMsg(err.message); btn.disabled = false; }
  });
}
function coordRegRow(r) {
  const latest = r.challans && r.challans[0];
  const viewBtn = latest ? `<a class="btn btn-ghost btn-sm" href="/challan?s=${encodeURIComponent(latest.serial)}" target="_blank" rel="noopener">View challan</a>
    <a class="btn btn-ghost btn-sm" href="/api/admissions/challans/${encodeURIComponent(latest.serial)}/pdf">Download PDF</a>` : '';
  let action = `<button class="btn btn-primary btn-sm" onclick="coordOpenChallanForm(${r.id})">Generate challan</button>`;
  if (r.payment_stage === 'challan_issued') {
    action = `<span class="s" style="color:var(--muted)">Net ${money(latest.net_fee)} &middot; due ${esc(latest.deadline || '-')}</span>
      ${viewBtn}
      <button class="btn btn-primary btn-sm" onclick="coordSendChallan('${latest.serial}')">Send to student</button>
      <button class="btn btn-ghost btn-sm" onclick="coordOpenChallanForm(${r.id})">Re-issue</button>`;
  } else if (r.payment_stage === 'challan_sent') {
    action = `<span class="s" style="color:var(--muted)">Mailed &middot; net ${money(latest.net_fee)} &middot; due ${esc(latest.deadline || '-')} &middot; awaiting Finance verification</span>
      ${viewBtn}
      <button class="btn btn-ghost btn-sm" onclick="coordSendChallan('${latest.serial}')">Resend</button>`;
  } else if (r.payment_stage === 'paid_cleared') {
    action = r.available_batches.length
      ? `<select id="batchSel${r.id}" class="field" style="margin:0;min-width:200px">${r.available_batches.map((b) => `<option value="${b.id}">${esc(b.name)} &middot; starts ${esc(b.start_date || '-')}</option>`).join('')}</select>
         <button class="btn btn-primary btn-sm" onclick="coordEnroll(${r.id})">Enroll student</button>`
      : `<span class="s" style="color:var(--danger)">Payment verified, but no batch is open for this course yet - ask admin to open one.</span>`;
  } else if (r.payment_stage === 'enrolled') {
    action = `<span class="s" style="color:var(--ok)">Enrolled</span>`;
  }
  const amb = r.ambassador_code
    ? `<div class="s" style="margin-top:4px;color:var(--ok);font-weight:600">Ambassador referral - ${esc(r.ambassador_name || 'ambassador')} (code ${esc(r.ambassador_code)}) verified automatically: a straight 10% discount is applied to the challan.</div>`
    : '';
  return `<div class="card" style="margin-bottom:10px"><div class="card-body" style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap">
    <div>
      <div style="font-weight:700">${esc(r.name)} <span class="s" style="color:var(--muted);font-weight:400">&middot; ${esc(r.email)}${r.whatsapp ? ' &middot; ' + esc(r.whatsapp) : ''}</span></div>
      <div class="s" style="color:var(--muted)">${esc(r.course_title || r.course_code || '-')}${r.course_fee ? ` &middot; ${money(r.course_fee)}` : ''} &nbsp;${pipelineBadge(r.payment_stage)}</div>
      ${amb}
    </div>
    <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">${action}</div>
  </div></div>`;
}
async function coordOpenChallanForm(regId) {
  const r = COORD_REGS.find((x) => x.id === regId) || {};
  let cats = [];
  try { cats = (await api('/api/admissions/discount-categories')).categories.filter((c) => c.active); } catch { /* list still opens without discounts */ }
  const opts = ['<option value="">No other discount</option>', ...cats.map((c) => `<option value="${c.id}">${esc(c.name)} (${c.type === 'flat' ? money(c.value) : c.value + '%'})</option>`)].join('');
  openModal('Generate fee challan', `
    <form id="f">
      <div class="s" style="margin-bottom:10px;padding:10px 12px;border:1px solid var(--line);border-radius:10px;background:var(--bg)">
        <strong>${esc(r.name || '')}</strong> &middot; ${esc(r.course_title || r.course_code || '-')}<br>
        Course fee: <strong>${money(r.course_fee)}</strong> (split into tuition, portal &amp; LMS, and examination &amp; certification fees on the challan)
        ${r.ambassador_code ? `<br><span style="color:var(--ok);font-weight:600">Ambassador referral (${esc(r.ambassador_name || '')}, code ${esc(r.ambassador_code)}): 10% off is applied automatically.</span>` : ''}
      </div>
      <label class="field"><span>Any other discount</span><select name="discount_category_id">${opts}</select></label>
      <label class="field"><span>Payment deadline</span><input name="deadline" type="date" required></label>
      <button class="btn btn-primary btn-block">Generate challan</button></form>`);
  $('f').addEventListener('submit', async (e) => {
    e.preventDefault(); const f = e.target; const btn = f.querySelector('button'); btn.disabled = true; modalMsg('');
    try {
      await api(`/api/admissions/registrations/${regId}/challan`, { method: 'POST', body: JSON.stringify({ discount_category_id: f.discount_category_id.value || null, deadline: f.deadline.value }) });
      toast('Challan generated - review it, then send it to the student.'); closeModal(); renderCoordRegistrations();
    } catch (err) { modalMsg(err.message); btn.disabled = false; }
  });
}
async function coordSendChallan(serial) {
  try {
    await api(`/api/admissions/challans/${encodeURIComponent(serial)}/send`, { method: 'POST' });
    toast('Challan PDF emailed - the student was asked to send payment proof to finance@echolens.digital.');
    renderCoordRegistrations();
  } catch (e) { toast(e.message, true); }
}
async function coordEnroll(regId) {
  const sel = $('batchSel' + regId);
  if (!sel || !sel.value) { toast('Choose a batch first.', true); return; }
  try {
    const out = await api(`/api/admissions/registrations/${regId}/enroll`, { method: 'POST', body: JSON.stringify({ batch_id: sel.value }) });
    toast(out.credentials ? 'Enrolled - new account credentials emailed.' : 'Enrolled - added to their existing account.');
    renderCoordRegistrations();
  } catch (e) { toast(e.message, true); }
}
async function renderCoordDiscounts() {
  const box = $('coordTabBody');
  const d = await api('/api/admissions/discount-categories');
  box.innerHTML = `
    <div class="card" style="margin-bottom:12px"><div class="card-body" style="display:flex;gap:10px;flex-wrap:wrap;align-items:center">
      <span class="s" style="color:var(--muted)">Discount categories change over time - add or edit them here any time. Each challan snapshots its discount when generated, so editing a category later never changes past challans.</span>
      <span style="flex:1"></span>
      <button class="btn btn-primary btn-sm" onclick="coordAddDiscount()">Add discount category</button>
    </div></div>
    <div class="card"><div class="card-body" style="padding:0;overflow-x:auto"><table class="tbl">
      <tr><th>Name</th><th>Type</th><th>Value</th><th>Status</th><th></th></tr>
      ${d.categories.map((c) => `<tr>
        <td>${esc(c.name)}</td><td>${c.type === 'flat' ? 'Flat' : 'Percent'}</td><td>${c.type === 'flat' ? money(c.value) : c.value + '%'}</td>
        <td>${c.active ? '<span class="s" style="color:var(--ok)">Active</span>' : '<span class="s" style="color:var(--muted)">Inactive</span>'}</td>
        <td style="text-align:right;white-space:nowrap">
          <button class="btn btn-ghost btn-sm" onclick="coordEditDiscount(${c.id})">Edit</button>
          <button class="btn btn-ghost btn-sm" onclick="coordToggleDiscount(${c.id},${!c.active})">${c.active ? 'Deactivate' : 'Activate'}</button>
          <button class="btn btn-danger btn-sm" onclick="coordDeleteDiscount(${c.id})">Delete</button>
        </td></tr>`).join('') || '<tr><td colspan="5" class="empty">No discount categories yet.</td></tr>'}
    </table></div></div>`;
  COORD_DISCOUNTS = d.categories;
}
let COORD_DISCOUNTS = [];
function coordDiscountForm(title, c, onSubmit) {
  openModal(title, `
    <form id="f">
      <label class="field"><span>Name</span><input name="name" required value="${esc(c.name || '')}" placeholder="e.g. Early bird, Sibling discount"></label>
      <label class="field"><span>Type</span><select name="type"><option value="percent" ${c.type !== 'flat' ? 'selected' : ''}>Percent off</option><option value="flat" ${c.type === 'flat' ? 'selected' : ''}>Flat amount off</option></select></label>
      <label class="field"><span>Value</span><input name="value" type="number" min="0" required value="${c.value !== undefined ? c.value : ''}" placeholder="e.g. 10 for 10%, or 1000 for Rs 1000"></label>
      <button class="btn btn-primary btn-block">Save</button></form>`);
  $('f').addEventListener('submit', async (e) => {
    e.preventDefault(); const f = e.target; const btn = f.querySelector('button'); btn.disabled = true; modalMsg('');
    try { await onSubmit({ name: f.name.value, type: f.type.value, value: f.value.value }); closeModal(); renderCoordDiscounts(); }
    catch (err) { modalMsg(err.message); btn.disabled = false; }
  });
}
function coordAddDiscount() {
  coordDiscountForm('Add discount category', {}, async (body) => {
    await api('/api/admissions/discount-categories', { method: 'POST', body: JSON.stringify(body) });
    toast('Discount category added.');
  });
}
function coordEditDiscount(id) {
  const c = COORD_DISCOUNTS.find((x) => x.id === id) || {};
  coordDiscountForm('Edit discount category', c, async (body) => {
    await api(`/api/admissions/discount-categories/${id}`, { method: 'PATCH', body: JSON.stringify(body) });
    toast('Discount category updated.');
  });
}
async function coordToggleDiscount(id, active) {
  try { await api(`/api/admissions/discount-categories/${id}`, { method: 'PATCH', body: JSON.stringify({ active }) }); renderCoordDiscounts(); } catch (e) { toast(e.message, true); }
}
async function coordDeleteDiscount(id) {
  if (!confirm('Delete this discount category?')) return;
  try { await api(`/api/admissions/discount-categories/${id}`, { method: 'DELETE' }); toast('Deleted.'); renderCoordDiscounts(); } catch (e) { toast(e.message, true); }
}
async function renderCoordBank() {
  const box = $('coordTabBody');
  const d = await api('/api/admissions/bank-details');
  const b = d.bank || {};
  box.innerHTML = `
    <div class="card"><div class="card-head"><h3>Bank details</h3><span class="s" style="color:var(--muted)">Printed on every new challan you generate (placeholder details are pre-filled until the real account is set)</span></div>
      <div class="card-body">
        <form id="f">
          <div class="form-grid">
            <label class="field"><span>Bank name</span><input name="bank_name" value="${esc(b.bank_name || '')}"></label>
            <label class="field"><span>Account title</span><input name="account_title" value="${esc(b.account_title || '')}"></label>
          </div>
          <div class="form-grid">
            <label class="field"><span>Account number</span><input name="account_number" value="${esc(b.account_number || '')}"></label>
            <label class="field"><span>IBAN</span><input name="iban" value="${esc(b.iban || '')}"></label>
          </div>
          <label class="field"><span>Branch</span><input name="branch" value="${esc(b.branch || '')}"></label>
          <button class="btn btn-primary">Save bank details</button>
        </form>
      </div></div>`;
  $('f').addEventListener('submit', async (e) => {
    e.preventDefault(); const f = e.target; const btn = f.querySelector('button'); btn.disabled = true;
    try { await api('/api/admissions/bank-details', { method: 'POST', body: JSON.stringify({ bank_name: f.bank_name.value, account_title: f.account_title.value, account_number: f.account_number.value, iban: f.iban.value, branch: f.branch.value }) }); toast('Bank details saved.'); }
    catch (err) { toast(err.message, true); }
    btn.disabled = false;
  });
}
async function renderCoordQueries() {
  const box = $('coordTabBody');
  const d = await api('/api/coordinator/queries');
  box.innerHTML = d.queries.length ? d.queries.map(coordQueryCard).join('') : '<div class="empty">No student queries yet.</div>';
}
function coordQueryCard(q) {
  return `<div class="card" style="margin-bottom:10px"><div class="card-head">
      <h3 style="font-size:15px">${esc(q.subject)} <span class="s" style="color:var(--muted);font-weight:400">&middot; ${esc(q.student_name)}</span></h3>
      <span class="s" style="color:${q.status === 'resolved' ? 'var(--ok)' : 'var(--gold)'}">${q.status === 'resolved' ? 'Resolved' : 'Open'}</span>
    </div>
    <div class="card-body">
      <div style="max-height:220px;overflow:auto;display:flex;flex-direction:column;gap:8px;margin-bottom:10px">
        ${q.messages.map((m) => `<div class="s" style="padding:8px 12px;border-radius:10px;white-space:pre-wrap;background:${m.from_role === 'student' ? 'var(--bg)' : 'var(--primary-soft, rgba(124,58,237,.08))'};border:1px solid var(--line)"><strong>${esc(m.from_name)}</strong> &middot; ${esc((m.at || '').slice(0, 16))}<br>${esc(m.body)}</div>`).join('')}
      </div>
      ${q.status !== 'resolved' ? `
      <form onsubmit="return coordReplyQuery(event,${q.id})" style="display:flex;gap:8px;margin-bottom:8px">
        <input name="body" class="field" style="flex:1;margin:0" placeholder="Write a reply..." required>
        <button class="btn btn-ghost">Reply</button>
      </form>
      <button class="btn btn-primary btn-sm" onclick="coordResolveQuery(${q.id})">Mark resolved</button>` : ''}
    </div></div>`;
}
async function coordReplyQuery(e, id) {
  e.preventDefault();
  const body = e.target.body.value.trim(); if (!body) return false;
  try { await api(`/api/coordinator/queries/${id}/reply`, { method: 'POST', body: JSON.stringify({ body }) }); renderCoordQueries(); }
  catch (err) { toast(err.message, true); }
  return false;
}
async function coordResolveQuery(id) {
  try { await api(`/api/coordinator/queries/${id}`, { method: 'PATCH', body: JSON.stringify({ status: 'resolved' }) }); toast('Marked resolved.'); renderCoordQueries(); }
  catch (e) { toast(e.message, true); }
}

/* -------------------------------- HR portal -------------------------------- */
/* -------- HR Portal: sidebar buttons, one per department + Ambassador reports -------- */
let HR_ACTIVE_DEPT = null; // null = landing state, 'ambassador-reports' = reports panel, else a department id
async function renderDeptHR() {
  const el = $('view-dept-hr');
  el.innerHTML = deptHeaderHtml('HR Portal') + `
    <div class="card" style="margin-bottom:16px"><div class="card-body" style="display:flex;gap:10px;flex-wrap:wrap;align-items:center">
      <span class="s" style="color:var(--muted)">Hire anyone directly - a portal login is emailed immediately.</span>
      <span style="flex:1"></span>
      <button class="btn btn-primary btn-sm" onclick="formNewAmbassador()">Add an ambassador</button>
      <button class="btn btn-primary btn-sm" onclick="formDeptStaff('instructor')">Add an instructor</button>
      <button class="btn btn-ghost btn-sm" onclick="formStaffOrIntern('staff')">Add staff</button>
      <button class="btn btn-ghost btn-sm" onclick="formStaffOrIntern('intern')">Add an intern</button>
    </div></div>
    <div id="hrDeptBody"><div class="empty">Loading&hellip;</div></div>`;
  await populateHrDeptNav();
  if (HR_ACTIVE_DEPT === 'ambassador-reports') renderAmbassadorReportsPanel('hrDeptBody', { withSignoff: true });
  else if (HR_ACTIVE_DEPT === 'contracts') renderHrContractsPanel('hrDeptBody');
  else if (HR_ACTIVE_DEPT === 'instructors') renderInstructorAssignmentPanel('hrDeptBody', { canEditTag: true, canAssign: false });
  else if (HR_ACTIVE_DEPT != null) renderDepartmentDetail('hrDeptBody', HR_ACTIVE_DEPT, { hrView: true });
  else $('hrDeptBody').innerHTML = '<div class="empty">Pick a department from the sidebar, or add a new one.</div>';
}
async function populateHrDeptNav() {
  const nav = $('hrDeptNav'); if (!nav) return;
  const d = await api('/api/hr/departments');
  nav.innerHTML = d.departments.map((dep) => `<a class="nav-item" style="padding-left:34px;font-size:13.5px" onclick="hrShowDepartment(${dep.id})">${esc(dep.name)} <span class="s" style="color:var(--muted-2);margin-left:auto">${dep.member_count}</span></a>`).join('')
    + `<a class="nav-item" style="padding-left:34px;font-size:13.5px" onclick="hrShowAmbassadorReports()">Ambassador reports</a>`
    + `<a class="nav-item" style="padding-left:34px;font-size:13.5px" onclick="hrShowContracts()">Contracts</a>`
    + `<a class="nav-item" style="padding-left:34px;font-size:13.5px" onclick="hrShowInstructors()">Instructors</a>`
    + `<a class="nav-item" style="padding-left:34px;font-size:13.5px;color:var(--primary)" onclick="formNewDepartment()">+ New department</a>`;
}
function hrShowDepartment(id) { HR_ACTIVE_DEPT = id; renderDeptHR(); }
function hrShowAmbassadorReports() { HR_ACTIVE_DEPT = 'ambassador-reports'; renderDeptHR(); }
function hrShowContracts() { HR_ACTIVE_DEPT = 'contracts'; renderDeptHR(); }
function hrShowInstructors() { HR_ACTIVE_DEPT = 'instructors'; renderDeptHR(); }
function formNewDepartment(context) {
  openModal('New department', `<form id="f">
    <label class="field"><span>Name</span><input name="name" required placeholder="e.g. Video Editors"></label>
    <button class="btn btn-primary btn-block">Create department</button></form>`);
  $('f').addEventListener('submit', async (e) => {
    e.preventDefault(); const f = e.target; f.querySelector('button').disabled = true;
    try {
      const d = await api('/api/hr/departments', { method: 'POST', body: JSON.stringify({ name: f.name.value.trim() }) });
      toast('Department created.'); closeModal();
      if (context === 'admin') renderAdminDepartments().then(() => adminShowDepartment(d.department.id));
      else hrShowDepartment(d.department.id);
    } catch (err) { toast(err.message, true); f.querySelector('button').disabled = false; }
  });
}
/* -------- Admin: Departments (same detail view as HR, own entry point) -------- */
async function renderAdminDepartments() {
  const el = $('view-admin-departments');
  el.innerHTML = '<div class="empty">Loading&hellip;</div>';
  const d = await api('/api/hr/departments');
  el.innerHTML = `<div class="card" style="margin-bottom:16px"><div class="card-body" style="display:flex;gap:10px;flex-wrap:wrap;align-items:center">
      <span class="s" style="color:var(--muted)">Manage every department's roster, head, tasks and announcements.</span>
      <span style="flex:1"></span>
      <button class="btn btn-primary btn-sm" onclick="formNewDepartment('admin')">+ New department</button>
    </div></div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px">
      ${d.departments.map((dep) => `<button class="btn btn-ghost btn-sm" onclick="adminShowDepartment(${dep.id})">${esc(dep.name)} (${dep.member_count})</button>`).join('') || '<span class="s" style="color:var(--muted)">No departments yet.</span>'}
    </div>
    <div id="adminDeptBody"></div>`;
}
function adminShowDepartment(id) { renderDepartmentDetail('adminDeptBody', id, { hrView: true }); }
/* -------- Department detail: roster, tasks, announcements -------- *
 * Shared by HR (any department) and a department head viewing their own -
 * hrView also unlocks rename/delete/head-picker, which only HR/admin can
 * actually call server-side regardless of what's shown here. Every action
 * refreshes via refreshDeptDetail(containerId), which reads the department
 * id and hrView flag back off the container - so modals stay simple
 * (id, name) onclick calls instead of threading closures through HTML strings. */
async function renderDepartmentDetail(containerId, deptId, { hrView = false } = {}) {
  const box = $(containerId);
  box.innerHTML = '<div class="empty">Loading&hellip;</div>';
  box.dataset.deptId = deptId; box.dataset.hrView = hrView ? '1' : '';
  const d = await api(`/api/department/${deptId}`);
  const dep = d.department;
  const headName = dep.members.find((m) => m.user_id === dep.head_user_id);
  box.innerHTML = `
    <div class="card" style="margin-bottom:16px"><div class="card-body" style="display:flex;gap:12px;align-items:center;flex-wrap:wrap">
      <div>
        <h2 style="margin:0 0 4px;font-size:19px">${esc(dep.name)}</h2>
        <div class="s" style="color:var(--muted)">Head: ${headName ? esc(headName.name) : 'Unassigned'}</div>
      </div>
      <span style="flex:1"></span>
      ${hrView ? `<button class="btn btn-ghost btn-sm" onclick="formSetDepartmentHead('${containerId}')">Set head</button>
        <button class="btn btn-ghost btn-sm" onclick="renameDepartment('${containerId}')">Rename</button>
        <button class="btn btn-danger btn-sm" onclick="delDepartment('${containerId}')">Delete</button>` : ''}
    </div></div>
    ${dep.name === 'Ambassadors' && hrView ? `<div id="ambGemRatesWrap" style="margin-bottom:16px"></div><div id="ambRemovedWrap" style="margin-bottom:16px"></div>` : ''}
    <div class="card" style="margin-bottom:16px"><div class="card-head"><h3>Members</h3>
      <div style="display:flex;gap:8px">
        ${dep.name === 'Ambassadors' && hrView ? `<button class="btn btn-primary btn-sm" onclick="formNewAmbassador('${containerId}')">Add ambassador</button>` : ''}
        <button class="btn btn-ghost btn-sm" onclick="formAddDepartmentMember('${containerId}')">Add existing member</button>
      </div></div>
      <div class="card-body" style="padding:0;overflow-x:auto"><table class="tbl">
        <tr><th>Name</th><th>Role</th><th>Email</th>${dep.name === 'Ambassadors' ? '<th>Code</th><th>Gems</th><th>University</th>' : ''}<th></th></tr>
        ${dep.members.map((m) => `<tr>
          <td>${esc(m.name)}${m.user_id === dep.head_user_id ? ' <span class="s" style="color:var(--ok);font-weight:700">(Head)</span>' : ''}</td>
          <td class="s">${esc(roleLabel(m.role))}</td><td class="s">${esc(m.email || '—')}</td>
          ${dep.name === 'Ambassadors' ? (m.ambassador
            ? `<td class="mono">${esc(m.ambassador.code)}</td><td>${gemChip(m.ambassador.gems || 0)}</td><td class="s">${esc(m.ambassador.university || '—')}</td>`
            : '<td class="s">—</td><td class="s">—</td><td class="s">—</td>') : ''}
          <td>${hrView && m.ambassador
            ? `<button class="btn btn-ghost btn-sm" onclick="delAmbassadorFromDept('${containerId}', ${m.ambassador.id}, '${esc(m.name)}')">Remove ambassador</button>`
            : `<button class="btn btn-ghost btn-sm" onclick="delDepartmentMember('${containerId}', ${m.user_id}, '${esc(m.name)}')">Remove</button>`}</td>
        </tr>`).join('') || `<tr><td colspan="${dep.name === 'Ambassadors' ? 7 : 4}" class="empty">No members yet.</td></tr>`}
      </table></div></div>
    <div class="card" style="margin-bottom:16px"><div class="card-head"><h3>Tasks</h3>
      <button class="btn btn-primary btn-sm" onclick="formDepartmentTask('${containerId}')">Assign a task</button></div>
      <div class="card-body" style="padding:0;overflow-x:auto"><table class="tbl">
        <tr><th>Title</th><th>Assigned to</th><th>Attachment</th><th>Progress</th><th>Assigned</th></tr>
        ${dep.tasks.map((t) => `<tr>
          <td>${esc(t.title)}</td><td class="s">${t.scope === 'all' ? 'Whole department' : 'One member'}</td>
          <td class="s">${t.attachment ? `<a href="/uploads/${esc(t.attachment.filename)}" target="_blank">${esc(t.attachment.original_name)}</a>` : '—'}</td>
          <td>${t.done}/${t.total} done</td><td class="s">${esc((t.created_at || '').slice(0, 10))}</td>
        </tr>`).join('') || '<tr><td colspan="5" class="empty">No tasks assigned yet.</td></tr>'}
      </table></div></div>
    <div class="card"><div class="card-head"><h3>Announcements</h3>
      <button class="btn btn-primary btn-sm" onclick="formDepartmentAnnouncement('${containerId}')">Post announcement</button></div>
      <div class="card-body">
        ${dep.announcements.map((a) => `<div class="s" style="padding:9px 0;border-bottom:1px solid var(--line)"><strong>${esc(a.title)}</strong> &middot; ${esc((a.created_at || '').slice(0, 10))}<br>${esc(a.body)}</div>`).join('') || '<div class="s" style="color:var(--muted)">Nothing posted yet.</div>'}
      </div></div>`;
  if (dep.name === 'Ambassadors' && hrView) { renderAmbGemRates(); renderAmbRemoved(containerId); }
}
/* -------- Ambassadors are a department too, but creating one issues a real
 * portal login + 4-digit referral code + QR (not just roster membership),
 * and gem rates are a setting of their own - both live here as a special
 * case of the Ambassadors department view. -------- */
const AMBASSADOR_TIERS = ['Micro Course', 'Bootcamp', 'Short Course', 'Specialist Track'];
async function renderAmbGemRates() {
  const box = $('ambGemRatesWrap'); if (!box) return;
  const ratesD = await api('/api/hr/ambassadors/gem-rates');
  box.innerHTML = `<div class="card"><div class="card-head"><h3>Gems per enrollment, by course category</h3></div>
    <div class="card-body">
      <p class="hint" style="margin-top:0">An ambassador earns these gems once a student they referred is actually enrolled (not just registered interest) - harder-to-sell categories are worth more.</p>
      <form id="rateForm" class="form-grid">
        ${AMBASSADOR_TIERS.map((t) => `<label class="field"><span>${esc(t)}</span><input name="${esc(t)}" type="number" min="0" value="${Number(ratesD.rates[t]) || 0}"></label>`).join('')}
        <button class="btn btn-primary btn-sm" style="grid-column:1/-1;justify-self:start">Save gem rates</button>
      </form>
    </div></div>`;
  $('rateForm').addEventListener('submit', async (e) => {
    e.preventDefault(); const f = e.target;
    const body = {}; for (const t of AMBASSADOR_TIERS) body[t] = f[t].value;
    try { await api('/api/hr/ambassadors/gem-rates', { method: 'PUT', body: JSON.stringify(body) }); toast('Gem rates saved.'); } catch (err) { toast(err.message, true); }
  });
}
// Ambassadors HR has removed: kept on record (login/referral code disabled,
// but user account, gem history and commission reports are untouched - see
// DELETE /api/hr/ambassadors/:id), just hidden from the active Members table
// above. Listed here so HR can find and undo a removal.
async function renderAmbRemoved(containerId) {
  const box = $('ambRemovedWrap'); if (!box) return;
  const d = await api('/api/hr/ambassadors');
  const removed = d.ambassadors.filter((a) => !a.active);
  if (!removed.length) { box.innerHTML = ''; return; }
  box.innerHTML = `<div class="card"><div class="card-head"><h3>Removed ambassadors</h3></div>
    <div class="card-body" style="padding:0;overflow-x:auto"><table class="tbl">
      <tr><th>Name</th><th>Email</th><th>Code</th><th>University</th><th></th></tr>
      ${removed.map((a) => `<tr>
        <td>${esc(a.name)}</td><td class="s">${esc(a.email || '—')}</td>
        <td class="mono s">${esc(a.code)}</td><td class="s">${esc(a.university || '—')}</td>
        <td><button class="btn btn-ghost btn-sm" onclick="reactivateAmbassador('${containerId}', ${a.id}, '${esc(a.name)}')">Reactivate</button></td>
      </tr>`).join('')}
    </table></div></div>`;
}
async function reactivateAmbassador(containerId, ambassadorId, name) {
  if (!confirm(`Reactivate ${name}? Their portal login and referral code start working again immediately.`)) return;
  try { await api(`/api/hr/ambassadors/${ambassadorId}/reactivate`, { method: 'POST' }); toast('Reactivated.'); refreshDeptDetail(containerId); } catch (e) { toast(e.message, true); }
}
function formNewAmbassador(containerId) {
  openModal('Add an ambassador', `<form id="f">
    <label class="field"><span>Full name</span><input name="name" required></label>
    <label class="field"><span>Email</span><input name="email" type="email" required></label>
    <label class="field"><span>University</span><input name="university" placeholder="e.g. LUMS"></label>
    <p class="hint">A portal login, a unique 4-digit referral code and a QR code are generated and emailed to this address automatically.</p>
    <button class="btn btn-primary btn-block">Create ambassador</button></form>`);
  $('f').addEventListener('submit', async (e) => {
    e.preventDefault(); const f = e.target; f.querySelector('button').disabled = true;
    try {
      const d = await api('/api/hr/ambassadors', { method: 'POST', body: JSON.stringify({ name: f.name.value, email: f.email.value.trim(), university: f.university.value.trim() }) });
      openModal('Ambassador created', `<p class="s" style="line-height:1.8">${esc(d.ambassador.name)} is now an EchoLens ambassador.<br>
        Referral code: <strong class="mono" style="font-size:20px;letter-spacing:3px">${esc(d.ambassador.code)}</strong><br>
        Their login and referral code (plus a QR code) have been emailed to ${esc(d.ambassador.email)}.</p>
        <button class="btn btn-primary btn-block" style="margin-top:12px" onclick="closeModal();${containerId ? `refreshDeptDetail('${containerId}')` : ''}">Done</button>`);
    } catch (err) { toast(err.message, true); f.querySelector('button').disabled = false; }
  });
}
async function delAmbassadorFromDept(containerId, ambassadorId, name) {
  if (!confirm(`Remove ambassador ${name}? Their referral code and portal login stop working immediately. Their record, referral history and commission reports are kept, not deleted - HR can be asked to reactivate them later.`)) return;
  try { await api('/api/hr/ambassadors/' + ambassadorId, { method: 'DELETE' }); toast('Removed.'); refreshDeptDetail(containerId); } catch (e) { toast(e.message, true); }
}
function refreshDeptDetail(containerId) {
  const box = $(containerId);
  // "My Department" head cards set data-kind="my" instead of being a full
  // renderDepartmentDetail container - refresh the whole shared panel then.
  if (box.dataset.kind === 'my') { refreshMyDepartments(); return; }
  renderDepartmentDetail(containerId, box.dataset.deptId, { hrView: box.dataset.hrView === '1' });
}
function formAddDepartmentMember(containerId) {
  const deptId = $(containerId).dataset.deptId;
  openModal('Add member', `<form id="f">
    <label class="field"><span>Search by name or email</span><input name="q" placeholder="Start typing..." autocomplete="off"></label>
    <div id="pickResults" class="s" style="max-height:220px;overflow:auto"></div>
    <input type="hidden" name="user_id">
    <button class="btn btn-primary btn-block" disabled>Add member</button></form>`);
  const f = $('f'); const btn = f.querySelector('button');
  let t = null;
  f.q.addEventListener('input', () => {
    clearTimeout(t); btn.disabled = true; f.user_id.value = '';
    t = setTimeout(async () => {
      const q = f.q.value.trim(); if (q.length < 2) { $('pickResults').innerHTML = ''; return; }
      try {
        const d = await api('/api/hr/users-lite?q=' + encodeURIComponent(q));
        $('pickResults').innerHTML = d.users.map((u) => `<div style="padding:8px;border-bottom:1px solid var(--line);cursor:pointer" onclick="selectDeptMemberPick(${u.id}, '${esc(u.name)}')">${esc(u.name)} <span style="color:var(--muted)">&middot; ${esc(roleLabel(u.role))} &middot; ${esc(u.email || '')}</span></div>`).join('') || '<div class="s" style="color:var(--muted);padding:8px">No matches.</div>';
      } catch {}
    }, 250);
  });
  window.selectDeptMemberPick = (id, name) => {
    f.user_id.value = id; $('pickResults').innerHTML = `<div class="s" style="padding:8px;color:var(--ok)">Selected: ${esc(name)}</div>`; btn.disabled = false;
  };
  f.addEventListener('submit', async (e) => {
    e.preventDefault(); btn.disabled = true;
    try {
      await api(`/api/department/${deptId}/members`, { method: 'POST', body: JSON.stringify({ user_id: f.user_id.value }) });
      toast('Member added.'); closeModal(); refreshDeptDetail(containerId);
    } catch (err) { toast(err.message, true); btn.disabled = false; }
  });
}
async function delDepartmentMember(containerId, userId, name) {
  if (!confirm(`Remove ${name} from this department?`)) return;
  const deptId = $(containerId).dataset.deptId;
  try { await api(`/api/department/${deptId}/members/${userId}`, { method: 'DELETE' }); toast('Removed.'); refreshDeptDetail(containerId); } catch (e) { toast(e.message, true); }
}
async function formSetDepartmentHead(containerId) {
  const deptId = $(containerId).dataset.deptId;
  const d = await api(`/api/department/${deptId}`);
  const dep = d.department;
  openModal('Set department head', `<form id="f">
    <label class="field"><span>Head</span><select name="user_id">
      <option value="">Unassigned</option>
      ${dep.members.map((m) => `<option value="${m.user_id}" ${m.user_id === dep.head_user_id ? 'selected' : ''}>${esc(m.name)}</option>`).join('')}
    </select></label>
    <p class="hint">Only HR/Admin can change this. Once set, the head can manage their own department's roster, tasks and announcements.</p>
    <button class="btn btn-primary btn-block">Save</button></form>`);
  $('f').addEventListener('submit', async (e) => {
    e.preventDefault(); const f = e.target; f.querySelector('button').disabled = true;
    try { await api(`/api/hr/departments/${deptId}/head`, { method: 'PUT', body: JSON.stringify({ user_id: f.user_id.value || null }) }); toast('Head updated.'); closeModal(); refreshDeptDetail(containerId); }
    catch (err) { toast(err.message, true); f.querySelector('button').disabled = false; }
  });
}
async function renameDepartment(containerId) {
  const box = $(containerId); const deptId = box.dataset.deptId;
  const d = await api(`/api/department/${deptId}`);
  const name = prompt('New department name:', d.department.name);
  if (!name || !name.trim() || name.trim() === d.department.name) return;
  try { await api(`/api/hr/departments/${deptId}`, { method: 'PUT', body: JSON.stringify({ name: name.trim() }) }); toast('Renamed.'); refreshDeptDetail(containerId); populateHrDeptNav(); } catch (e) { toast(e.message, true); }
}
async function delDepartment(containerId) {
  const box = $(containerId); const deptId = box.dataset.deptId;
  const d = await api(`/api/department/${deptId}`);
  if (!confirm(`Delete "${d.department.name}"? Its members, tasks and announcements are removed too.`)) return;
  try { await api(`/api/hr/departments/${deptId}`, { method: 'DELETE' }); toast('Deleted.'); HR_ACTIVE_DEPT = null; renderDeptHR(); } catch (e) { toast(e.message, true); }
}
async function formDepartmentTask(containerId) {
  const deptId = $(containerId).dataset.deptId;
  const d = await api(`/api/department/${deptId}`);
  const dep = d.department;
  openModal('Assign a task', `<form id="f" enctype="multipart/form-data">
    <label class="field"><span>Title</span><input name="title" required></label>
    <label class="field"><span>Description</span><textarea name="description" rows="3"></textarea></label>
    <label class="field"><span>Assign to</span><select name="scope">
      <option value="all">Whole department</option>
      <option value="member">One member</option>
    </select></label>
    <label class="field" id="memberPickWrap" style="display:none"><span>Member</span><select name="member_user_id">
      ${(dep.members || []).map((m) => `<option value="${m.user_id}">${esc(m.name)}</option>`).join('')}
    </select></label>
    <label class="field"><span>Attachment (optional) - document or picture</span><input name="file" type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.webp"></label>
    <p class="hint">Every member in scope gets an email the moment this is assigned.</p>
    <button class="btn btn-primary btn-block">Assign task</button></form>`);
  $('f').scope.addEventListener('change', (e) => { $('memberPickWrap').style.display = e.target.value === 'member' ? '' : 'none'; });
  $('f').addEventListener('submit', async (e) => {
    e.preventDefault(); const f = e.target; f.querySelector('button').disabled = true;
    try {
      await api(`/api/department/${deptId}/tasks`, { method: 'POST', body: new FormData(f) });
      toast('Task assigned.'); closeModal(); refreshDeptDetail(containerId);
    } catch (err) { toast(err.message, true); f.querySelector('button').disabled = false; }
  });
}
function formDepartmentAnnouncement(containerId) {
  const deptId = $(containerId).dataset.deptId;
  openModal('Post an announcement', `<form id="f">
    <label class="field"><span>Title</span><input name="title" required></label>
    <label class="field"><span>Message</span><textarea name="body" rows="4" required></textarea></label>
    <p class="hint">Every member of this department gets an email.</p>
    <button class="btn btn-primary btn-block">Post</button></form>`);
  $('f').addEventListener('submit', async (e) => {
    e.preventDefault(); const f = e.target; f.querySelector('button').disabled = true;
    try {
      await api(`/api/department/${deptId}/announcements`, { method: 'POST', body: JSON.stringify({ title: f.title.value, body: f.body.value }) });
      toast('Announcement posted.'); closeModal(); refreshDeptDetail(containerId);
    } catch (err) { toast(err.message, true); f.querySelector('button').disabled = false; }
  });
}
/* -------- Ambassador monthly commission reports (real company letterhead) --------
 * Shared read/download/email/generate access across HR, Finance, the
 * Admissions Office and admin - each portal just points this at its own tab
 * body element id. Editing the sign-off names stays HR-only. */
async function renderAmbassadorReportsPanel(containerId, { withSignoff = false } = {}) {
  const box = $(containerId);
  box.innerHTML = '<div class="empty">Loading&hellip;</div>';
  const [d, signoffD] = await Promise.all([api('/api/ambassador-reports'), withSignoff ? api('/api/ambassador-reports/signoff') : Promise.resolve(null)]);
  box.innerHTML = `
    ${withSignoff ? `<div class="card" style="margin-bottom:16px"><div class="card-head"><h3>Report sign-off</h3></div>
      <div class="card-body">
        <p class="hint" style="margin-top:0">Printed as the two digital signatures on every report: the department head first, then the CEO (${esc(signoffD.ceo_name)}, from certificate settings).</p>
        <form id="signoffForm" class="form-grid">
          <label class="field"><span>Department head name</span><input name="department_head_name" value="${esc(signoffD.signoff.department_head_name)}" required></label>
          <label class="field"><span>Department head title</span><input name="department_head_title" value="${esc(signoffD.signoff.department_head_title || '')}" placeholder="e.g. Head of HR, EchoLens Digital"></label>
          <button class="btn btn-primary btn-sm" style="grid-column:1/-1;justify-self:start">Save sign-off</button>
        </form>
      </div></div>` : ''}
    <div class="card" style="margin-bottom:16px"><div class="card-body" style="display:flex;gap:12px;align-items:center;flex-wrap:wrap">
      <span class="s" style="color:var(--muted)">Reports auto-generate on the 5th of every month, covering the previous month's confirmed payments, on EchoLens' official letterhead, and are emailed to each ambassador. Generating now covers last month and re-sends it.</span>
      <span style="flex:1"></span>
      <button class="btn btn-primary btn-sm" onclick="generateAmbassadorReportsNow('${containerId}', ${withSignoff})">Generate this month's reports now</button>
    </div></div>
    <div class="card"><div class="card-head"><h3>Reports</h3></div>
    <div class="card-body" style="padding:0;overflow-x:auto"><table class="tbl">
      <tr><th>Ambassador</th><th>Period</th><th>Referrals paid</th><th>Total paid</th><th>Commission</th><th>Generated</th><th></th></tr>
      ${d.reports.map((r) => `<tr>
        <td>${esc(r.ambassador)}</td><td>${esc(r.period)}</td><td>${r.student_count}</td>
        <td>PKR ${Number(r.total_paid).toLocaleString('en-US')}</td>
        <td style="font-weight:700">PKR ${Number(r.total_commission).toLocaleString('en-US')}</td>
        <td class="s">${esc((r.generated_at || '').slice(0, 10))}</td>
        <td style="display:flex;gap:6px;flex-wrap:wrap">
          <a class="btn btn-ghost btn-sm" href="/api/ambassador-reports/${r.id}/download">Download</a>
          <button class="btn btn-ghost btn-sm" onclick="emailAmbassadorReport(${r.id})">Email</button>
        </td>
      </tr>`).join('') || '<tr><td colspan="7" class="empty">No reports generated yet.</td></tr>'}
    </table></div></div>`;
  if (withSignoff) {
    $('signoffForm').addEventListener('submit', async (e) => {
      e.preventDefault(); const f = e.target;
      try {
        await api('/api/ambassador-reports/signoff', { method: 'PUT', body: JSON.stringify({ department_head_name: f.department_head_name.value, department_head_title: f.department_head_title.value }) });
        toast('Sign-off saved - it applies to reports generated from now on.');
      } catch (err) { toast(err.message, true); }
    });
  }
}
async function generateAmbassadorReportsNow(containerId, withSignoff) {
  if (!confirm("Generate (and re-email) every ambassador's report for last month now?")) return;
  try {
    const d = await api('/api/ambassador-reports/generate', { method: 'POST', body: JSON.stringify({}) });
    toast(`Generated ${d.generated} report(s) for ${d.period}.`);
    renderAmbassadorReportsPanel(containerId, { withSignoff });
  } catch (e) { toast(e.message, true); }
}
function emailAmbassadorReport(id) {
  openModal('Email this report', `<form id="f">
    <label class="field"><span>Send to</span><input name="to" type="email" required value="ceo@echolens.digital"></label>
    <p class="hint">The report PDF is attached exactly as downloaded.</p>
    <button class="btn btn-primary btn-block">Send</button></form>`);
  $('f').addEventListener('submit', async (e) => {
    e.preventDefault(); const f = e.target; f.querySelector('button').disabled = true;
    try {
      await api(`/api/ambassador-reports/${id}/email`, { method: 'POST', body: JSON.stringify({ to: f.to.value.trim() }) });
      toast('Report emailed.'); closeModal();
    } catch (err) { toast(err.message, true); f.querySelector('button').disabled = false; }
  });
}

/* -------- HR: contract tracker --------
 * Every ambassador/instructor contract auto-emailed at onboarding, with its
 * 2-day signing deadline and submission status - "Resend" regenerates the
 * PDF and resets the deadline, for anyone who runs past it. */
const CONTRACT_STATUS_LABEL = { sent: 'Awaiting signature', submitted: 'Signed & submitted' };
async function renderHrContractsPanel(containerId) {
  const box = $(containerId);
  box.innerHTML = '<div class="empty">Loading&hellip;</div>';
  const d = await api('/api/hr/contracts');
  const now = Date.now();
  box.innerHTML = `<div class="card"><div class="card-head"><h3>Contracts</h3>
    <span class="s" style="color:var(--muted)">Auto-emailed after onboarding to every new ambassador/instructor - they have 2 days to sign, attach documents, and upload a zip.</span></div>
    <div class="card-body" style="padding:0;overflow-x:auto"><table class="tbl">
      <tr><th>Name</th><th>Role</th><th>Status</th><th>Deadline</th><th>Contract</th><th>Submission</th><th>Offer letter</th><th></th></tr>
      ${d.contracts.map((c) => {
        const overdue = c.status === 'sent' && c.deadline_at && new Date(c.deadline_at).getTime() < now;
        return `<tr>
          <td>${esc(c.name)}</td><td class="s">${esc(roleLabel(c.role))}</td>
          <td>${overdue ? '<span class="s" style="color:var(--danger);font-weight:700">Overdue</span>' : `<span class="s">${esc(CONTRACT_STATUS_LABEL[c.status] || c.status)}</span>`}</td>
          <td class="s">${c.deadline_at ? esc(new Date(c.deadline_at).toLocaleString('en-GB')) : '—'}</td>
          <td>${c.pdf_filename ? `<a href="/uploads/contracts/${esc(c.pdf_filename)}" target="_blank">Download</a>` : '—'}</td>
          <td>${c.submission_zip_filename ? `<a href="/uploads/contracts/${esc(c.submission_zip_filename)}" target="_blank">zip</a>` : '—'}</td>
          <td>${c.offer_letter_filename ? `<a href="/uploads/contracts/${esc(c.offer_letter_filename)}" target="_blank">Download</a>` : '—'}</td>
          <td>
            <button class="btn btn-ghost btn-sm" onclick="resendContract(${c.id}, '${containerId}')">Resend</button>
            ${c.status === 'sent' ? `<button class="btn btn-ghost btn-sm" onclick="extendContractDeadline(${c.id}, '${containerId}')">Extend deadline</button>` : ''}
          </td>
        </tr>`;
      }).join('') || '<tr><td colspan="8" class="empty">No contracts issued yet.</td></tr>'}
    </table></div></div>`;
}
async function resendContract(id, containerId) {
  if (!confirm('Regenerate this contract and reset the 2-day signing deadline? A fresh copy is emailed immediately.')) return;
  try { await api(`/api/hr/contracts/${id}/resend`, { method: 'POST', body: JSON.stringify({}) }); toast('Contract resent.'); renderHrContractsPanel(containerId); }
  catch (e) { toast(e.message, true); }
}
function extendContractDeadline(id, containerId) {
  openModal('Extend signing deadline', `<form id="f">
    <p class="hint">Choose how many days from today this hire gets to sign & submit their contract. The existing contract PDF is not changed - they're notified by email with the new date.</p>
    <label class="field"><span>Extend by (days)</span><input name="days" type="number" min="1" max="90" value="7" required></label>
    <button class="btn btn-primary btn-block">Extend deadline</button></form>`);
  $('f').addEventListener('submit', async (e) => {
    e.preventDefault(); const f = e.target; f.querySelector('button').disabled = true;
    try {
      await api(`/api/hr/contracts/${id}/extend-deadline`, { method: 'POST', body: JSON.stringify({ days: Number(f.days.value) }) });
      toast('Deadline extended.'); closeModal(); renderHrContractsPanel(containerId);
    } catch (err) { modalMsg(err.message); f.querySelector('button').disabled = false; }
  });
}

/* -------------------------------- Staff portal -------------------------------- */
async function renderDeptStaff() {
  const el = $('view-dept-staff');
  try {
    const d = await api('/api/staff/me');
    const s = d.staff;
    el.innerHTML = `
      <div class="card" style="margin-bottom:16px"><div class="card-body" style="display:flex;gap:16px;align-items:center">
        ${avatarHtml(ME.avatar, ME.name, 56)}
        <div><h2 style="margin:0 0 2px;font-size:19px">Staff Portal</h2>
          <div class="s" style="color:var(--muted)">${d.group ? esc(d.group.name) : 'Unassigned'} &middot; ${esc(s.position || (s.employment_type === 'intern' ? 'Intern' : 'Staff'))}</div>
        </div>
      </div></div>
      <div class="card" style="margin-bottom:16px"><div class="card-head"><h3>Instructions from HR</h3></div>
        <div class="card-body">
          ${s.instructions.length ? s.instructions.map((i) => `<div class="s" style="padding:9px 0;border-bottom:1px solid var(--line)"><strong>${esc(i.by)}</strong> &middot; ${esc((i.at || '').slice(0, 16))}<br>${esc(i.body)}</div>`).join('') : '<div class="s" style="color:var(--muted)">Nothing yet.</div>'}
        </div></div>
      <div class="card"><div class="card-head"><h3>Follow-ups</h3></div>
        <div class="card-body">
          ${s.follow_ups.length ? s.follow_ups.map((f, i) => `
            <div style="padding:10px 0;border-bottom:1px solid var(--line)">
              <div class="s"><strong>${esc(f.by)}</strong> &middot; ${esc((f.at || '').slice(0, 16))}</div>
              <div class="s" style="margin:4px 0">${esc(f.body)}</div>
              ${f.response ? `<div class="s" style="padding:8px 10px;border-radius:8px;background:var(--bg);margin-top:6px"><strong>Your response:</strong> ${esc(f.response)}</div>`
                : `<form onsubmit="return staffRespondFollowUp(event,${i})" style="display:flex;gap:8px;margin-top:6px">
                     <input name="response" class="field" style="flex:1;margin:0" placeholder="Write your response..." required>
                     <button class="btn btn-ghost btn-sm">Respond</button></form>`}
            </div>`).join('') : '<div class="s" style="color:var(--muted)">Nothing yet.</div>'}
        </div></div>
      <div id="myDeptWrap" style="margin-top:16px"></div>`;
    renderMyDepartments('myDeptWrap');
  } catch (e) {
    el.innerHTML = `<div class="card"><div class="card-body"><p class="s" style="color:var(--muted)">${esc(e.message)}</p></div></div>`;
  }
}
async function staffRespondFollowUp(e, idx) {
  e.preventDefault();
  const response = e.target.response.value.trim(); if (!response) return false;
  try { await api(`/api/staff/follow-ups/${idx}/respond`, { method: 'POST', body: JSON.stringify({ response }) }); renderDeptStaff(); }
  catch (err) { toast(err.message, true); }
  return false;
}

/* -------------------------------- Ambassadors portal -------------------------------- */
let AMB_TAB = 'overview';
function ambTab(tab) { AMB_TAB = tab; renderDeptAmbassador(); }
async function renderDeptAmbassador() {
  const el = $('view-dept-ambassador');
  const tabs = [['overview', 'Overview'], ['my-department', 'My Department'], ['referrals', 'My referrals'], ['leaderboard', 'Leaderboard'], ['reports', 'Reports']];
  el.innerHTML = deptHeaderHtml('Ambassadors Portal') + deptTabBarHtml(tabs, AMB_TAB, 'ambTab') + '<div id="ambTabBody"><div class="empty">Loading&hellip;</div></div>';
  if (AMB_TAB === 'overview') renderAmbOverview();
  else if (AMB_TAB === 'my-department') renderMyDepartments('ambTabBody');
  else if (AMB_TAB === 'referrals') renderAmbReferrals();
  else if (AMB_TAB === 'reports') renderAmbReports();
  else renderAmbLeaderboard();
}
async function renderAmbOverview() {
  const box = $('ambTabBody');
  const [meD, qrD] = await Promise.all([api('/api/ambassador/me'), api('/api/ambassador/qr')]);
  const a = meD.ambassador;
  box.innerHTML = `<div class="card" style="margin-bottom:16px"><div class="card-body" style="display:flex;gap:24px;flex-wrap:wrap;align-items:center">
      <div style="text-align:center">
        <img src="${qrD.qr}" alt="Your referral QR code" style="width:160px;height:160px;border-radius:12px;border:1px solid var(--line)">
        <div class="s" style="margin-top:6px"><a href="${qrD.qr}" download="ambassador-${esc(a.code)}-qr.png">Download QR</a></div>
      </div>
      <div style="flex:1;min-width:220px">
        <div class="s" style="color:var(--muted)">Referral code</div>
        <div class="mono" style="font-size:26px;font-weight:700;letter-spacing:4px;margin-bottom:10px">${esc(a.code)}</div>
        <div class="s" style="color:var(--muted)">University</div>
        <div style="margin-bottom:10px">${esc(a.university || '—')}</div>
        <div style="display:flex;gap:20px;flex-wrap:wrap">
          <div><div class="s" style="color:var(--muted)">Gems</div>${gemChip(a.gems || 0)}</div>
          <div><div class="s" style="color:var(--muted)">Leaderboard rank</div><div style="font-weight:700">${a.rank ? '#' + a.rank : '—'}</div></div>
          <div><div class="s" style="color:var(--muted)">Students referred</div><div style="font-weight:700">${a.uses}</div></div>
        </div>
      </div>
    </div></div>
    <div class="card"><div class="card-head"><h3>Recent gem activity</h3></div>
      <div class="card-body">
        ${meD.gem_events.length ? meD.gem_events.map((e) => `<div class="s" style="padding:8px 0;border-bottom:1px solid var(--line)">${gemChip('+' + e.amount)} ${esc(e.note || e.source)} <span style="color:var(--muted)">&middot; ${esc((e.created_at || '').slice(0, 16))}</span></div>`).join('') : '<div class="s" style="color:var(--muted)">No gems yet - share your code or QR to get your first referral enrolled.</div>'}
      </div></div>`;
}
/* -------- "My Department" - shared by any member (ambassador/staff/instructor
 * portals all point here). If the member heads a department, they also get
 * "Assign a task"/"Post announcement" for it, reusing the same modals HR
 * uses (see refreshDeptDetail's data-kind="my" branch above). -------- */
let MY_DEPT_CONTAINER = null;
function refreshMyDepartments() { if (MY_DEPT_CONTAINER) renderMyDepartments(MY_DEPT_CONTAINER); }
async function renderMyDepartments(containerId) {
  MY_DEPT_CONTAINER = containerId;
  const box = $(containerId);
  box.innerHTML = '<div class="empty">Loading&hellip;</div>';
  const d = await api('/api/my-departments');
  if (!d.departments.length) { box.innerHTML = '<div class="empty">You are not part of any department yet.</div>'; return; }
  const taskCard = (dep, r) => `<div class="card" style="margin-bottom:10px"><div class="card-body">
      <h3 style="margin:0 0 4px;font-size:14.5px">${esc(r.task.title)}</h3>
      ${r.task.description ? `<p class="s" style="white-space:pre-wrap">${esc(r.task.description)}</p>` : ''}
      ${r.task.attachment ? `<p class="s"><a href="/uploads/${esc(r.task.attachment.filename)}" target="_blank">${esc(r.task.attachment.original_name)}</a></p>` : ''}
      ${r.status === 'done'
        ? `<p class="s" style="color:var(--ok)">Marked done ${esc((r.completed_at || '').slice(0, 16))}${r.note ? ' &middot; ' + esc(r.note) : ''}</p>`
        : `<form onsubmit="return myDeptCompleteTask(event, ${r.task.id})" enctype="multipart/form-data" style="margin-top:8px">
             <label class="field"><span>Note (optional)</span><input name="note"></label>
             <label class="field"><span>Proof (optional) - document or picture</span><input name="file" type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.webp"></label>
             <button class="btn btn-primary btn-sm">Mark done</button>
           </form>`}
    </div></div>`;
  box.innerHTML = d.departments.map((dep) => {
    const pending = dep.tasks.filter((r) => r.status === 'pending');
    const done = dep.tasks.filter((r) => r.status === 'done');
    return `<div class="card" style="margin-bottom:16px" id="myDeptCard-${dep.id}" data-dept-id="${dep.id}" data-kind="my">
      <div class="card-head"><h3>${esc(dep.name)}${dep.is_head ? ' <span class="s" style="color:var(--ok);font-weight:700">(Head)</span>' : ''}</h3>
        <span class="s" style="color:var(--muted)">${dep.progress.done}/${dep.progress.total} tasks done</span></div>
      <div class="card-body">
        ${dep.is_head ? `<div style="display:flex;gap:8px;margin-bottom:14px">
          <button class="btn btn-primary btn-sm" onclick="formDepartmentTask('myDeptCard-${dep.id}')">Assign a task</button>
          <button class="btn btn-ghost btn-sm" onclick="formDepartmentAnnouncement('myDeptCard-${dep.id}')">Post announcement</button>
        </div>` : ''}
        ${pending.length ? `<div class="s" style="font-weight:700;margin-bottom:6px">Pending</div>${pending.map((r) => taskCard(dep, r)).join('')}` : '<div class="s" style="color:var(--muted)">No pending tasks.</div>'}
        ${done.length ? `<div class="s" style="font-weight:700;margin:12px 0 6px">Done</div>${done.map((r) => taskCard(dep, r)).join('')}` : ''}
        ${dep.announcements.length ? `<div class="s" style="font-weight:700;margin:14px 0 6px">Announcements</div>
          ${dep.announcements.map((a) => `<div class="s" style="padding:8px 0;border-bottom:1px solid var(--line)"><strong>${esc(a.title)}</strong> &middot; ${esc((a.created_at || '').slice(0, 10))}<br>${esc(a.body)}</div>`).join('')}` : ''}
      </div></div>`;
  }).join('');
}
async function myDeptCompleteTask(e, taskId) {
  e.preventDefault(); const f = e.target; f.querySelector('button').disabled = true;
  try { await api(`/api/my-departments/tasks/${taskId}/complete`, { method: 'POST', body: new FormData(f) }); toast('Marked done.'); refreshMyDepartments(); }
  catch (err) { toast(err.message, true); f.querySelector('button').disabled = false; }
  return false;
}
async function renderAmbReferrals() {
  const box = $('ambTabBody');
  const d = await api('/api/ambassador/referrals');
  const stageLabel = { new: 'New', challan_issued: 'Challan issued', challan_sent: 'Challan sent', paid_cleared: 'Payment cleared', enrolled: 'Enrolled' };
  box.innerHTML = `<div class="card"><div class="card-head"><h3>Students you referred</h3></div>
    <div class="card-body" style="padding:0;overflow-x:auto"><table class="tbl">
      <tr><th>Name</th><th>Email</th><th>Course</th><th>Stage</th><th>Registered</th></tr>
      ${d.referrals.map((r) => `<tr>
        <td>${esc(r.name)}</td><td class="s">${esc(r.email)}</td><td class="s">${esc(r.course_title || '—')}</td>
        <td>${esc(stageLabel[r.payment_stage] || r.payment_stage)}</td><td class="s">${esc((r.created_at || '').slice(0, 10))}</td>
      </tr>`).join('') || '<tr><td colspan="5" class="empty">No referrals yet - share your code or QR to get started.</td></tr>'}
    </table></div>
    <p class="hint" style="padding:0 14px 12px">You earn gems once a referral reaches "Enrolled" - weighted by the course category.</p></div>`;
}
async function renderAmbReports() {
  const box = $('ambTabBody');
  const d = await api('/api/ambassador/reports');
  box.innerHTML = `<div class="card"><div class="card-head"><h3>Monthly commission reports</h3></div>
    <div class="card-body" style="padding:0;overflow-x:auto"><table class="tbl">
      <tr><th>Period</th><th>Referrals paid</th><th>Total paid</th><th>Commission</th><th>Generated</th><th></th></tr>
      ${d.reports.map((r) => `<tr>
        <td>${esc(r.period)}</td><td>${r.student_count}</td>
        <td>PKR ${Number(r.total_paid).toLocaleString('en-US')}</td>
        <td style="font-weight:700">PKR ${Number(r.total_commission).toLocaleString('en-US')}</td>
        <td class="s">${esc((r.generated_at || '').slice(0, 10))}</td>
        <td><a class="btn btn-ghost btn-sm" href="/api/ambassador/reports/${r.id}/download">Download</a></td>
      </tr>`).join('') || '<tr><td colspan="6" class="empty">No reports yet - your first one lands on the 5th of next month, on EchoLens\' official letterhead.</td></tr>'}
    </table></div>
    <p class="hint" style="padding:0 14px 12px">Each report covers the previous month's confirmed payments and pays 10% commission on the amount your referrals actually paid.</p></div>`;
}
async function renderAmbLeaderboard() {
  const box = $('ambTabBody');
  const [indD, uniD] = await Promise.all([api('/api/ambassador/leaderboard'), api('/api/ambassador/leaderboard/universities')]);
  box.innerHTML = `<div class="card" style="margin-bottom:16px"><div class="card-head"><h3>Ambassadors</h3></div>
    <div class="card-body" style="padding:0;overflow-x:auto"><table class="tbl">
      <tr><th>#</th><th>Name</th><th>University</th><th>Gems</th></tr>
      ${indD.leaderboard.map((a) => `<tr><td>${a.rank}</td><td>${esc(a.name)}</td><td class="s">${esc(a.university || '—')}</td><td>${gemChip(a.gems)}</td></tr>`).join('') || '<tr><td colspan="4" class="empty">No ambassadors yet.</td></tr>'}
    </table></div></div>
    <div class="card"><div class="card-head"><h3>By university</h3></div>
    <div class="card-body" style="padding:0;overflow-x:auto"><table class="tbl">
      <tr><th>#</th><th>University</th><th>Ambassadors</th><th>Total gems</th></tr>
      ${uniD.leaderboard.map((u) => `<tr><td>${u.rank}</td><td>${esc(u.university)}</td><td>${u.ambassadors}</td><td>${gemChip(u.gems)}</td></tr>`).join('') || '<tr><td colspan="4" class="empty">No universities on record yet.</td></tr>'}
    </table></div></div>`;
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
  btn.disabled = false; btn.innerHTML = 'Draft with AI';
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
      <button class="btn btn-ghost btn-sm" onclick="formQuiz()">Generate a quiz</button>
      <button class="btn btn-ghost btn-sm" onclick="formOutline()">Draft a course outline</button>
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
    box.innerHTML = `<div class="card"><div class="card-head"><h3>Your skill reports</h3><span class="s" style="color:var(--muted)">Reviewed by your teacher</span></div>
      <div class="card-body">${d.reports.map((r) => `
        <details style="margin-bottom:12px"><summary style="cursor:pointer;font-weight:600">${esc(r.course_title)} &middot; ${esc((r.published_at || r.created_at || '').slice(0, 10))}</summary>
        <pre style="white-space:pre-wrap;background:var(--canvas);border:1px solid var(--line);border-radius:11px;padding:14px;font-size:13px;font-family:var(--font-body);margin-top:8px">${esc(r.markdown)}</pre></details>`).join('')}</div></div>`;
  } catch { box.innerHTML = ''; }
}

/* ========================== AI SKILL REPORTS (teacher) ========================== */
async function aiSkillReport(uid, name) {
  openModal(`Course report: ${name}`, `<div class="s" style="color:var(--muted)">Generating from grades, remarks, and activity on this course&hellip; The student sees nothing until you publish.</div>`);
  try {
    const out = await api('/api/ai/skill-report', { method: 'POST', body: JSON.stringify({ user_id: uid, batch_id: bid() }) });
    showReportDraft(out.report, name);
  } catch (e) { modalMsg(e.message); }
}
async function aiOverallReport(uid, name) {
  openModal(`Overall report: ${name}`, `<div class="s" style="color:var(--muted)">Reviewing every course this student has taken&hellip; The student sees nothing until you publish.</div>`);
  try {
    const out = await api('/api/ai/overall-report', { method: 'POST', body: JSON.stringify({ user_id: uid }) });
    showReportDraft(out.report, name + ' (all courses)');
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
          <div class="grow"><div class="t">${esc(r.student_name)} ${r.scope === 'overall' ? '<span class="s" style="color:var(--teal-deep);font-weight:600">&middot; all courses</span>' : ''}</div>
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
      <label class="field"><span>Title</span><input name="title" required placeholder="e.g. EchoLens Build Night"></label>
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


/* ================================ QUEST TAB ================================
 * Levels group into "Modules" by week, each rendered as an accordion of
 * "Classes" (levels) - a student's own progress ring, level count and gems
 * sit in the Learning Path card; the track's end-project brief (from the
 * track definition, not per-item tracked) sits in the milestone card beside
 * the scoreboard. Same difficulty labels and pill/badge classes as the
 * public /open free-courses quest list (open.js's drawCourse()), so paid
 * and free quests still read as one product, not two differently-styled ones.
 */
const QUEST_DIFF = (d) => ({ Basic: 'Easy', Core: 'Medium', Boss: 'Hard', Easy: 'Easy', Medium: 'Medium', Hard: 'Hard' }[d] || 'Easy');
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
      <span class="quest-title-chip"><span class="bd"></span>${p.track.titles.map((t) => esc(t.name)).join(' &rarr; ')}</span>
    </div></div>
    ${d.can_manage ? `<div class="ide-toggle-strip">
      <span class="s">Built-in compiler for this course: <strong>${d.ide_enabled ? 'ON' : 'OFF'}</strong>${d.ide_enabled ? '' : ' - tasks use a clean written-answer workspace (right for UI/UX, graphics and no-code automation courses)'}</span>
      <button class="btn btn-ghost btn-sm" onclick="toggleCourseIde(${!d.ide_enabled})">${d.ide_enabled ? 'Turn compiler off' : 'Turn compiler on'}</button>
    </div>` : ''}`;

  QUEST_DATA = d; // cached for the task portal

  // Levels group into "Modules" by week - every seeded track already lines
  // levels up two-per-week, so this reads as a real curriculum structure,
  // not an invented one.
  const modules = [];
  const moduleByWeek = new Map();
  p.levels.forEach((l) => {
    const wk = l.quest.week != null ? l.quest.week : l.quest.no;
    if (!moduleByWeek.has(wk)) { const mod = { week: wk, levels: [] }; moduleByWeek.set(wk, mod); modules.push(mod); }
    moduleByWeek.get(wk).levels.push(l);
  });
  const totalGems = p.levels.reduce((s, l) => s + l.quest.problems.reduce((ss, pr) => ss + pr.points, 0), 0);
  const trackPct = totalGems ? Math.min(100, Math.round((p.gems / totalGems) * 100)) : 0;
  const RING_C = 326.7; // 2*pi*52
  const passedCount = p.levels.filter((l) => l.passed).length;
  const totalWeeks = Math.max(...p.levels.map((l) => l.quest.week || 1), 1);
  const curLevel = p.levels.find((l) => l.unlocked && !l.passed) || p.levels[p.levels.length - 1];
  const curWeek = curLevel ? (curLevel.quest.week || 1) : totalWeeks;

  const pathCard = isStudent ? `
    <div class="path-card">
      <div class="path-eyebrow">My Learning Path</div>
      <div class="path-title">${esc(p.track.title)}</div>
      <div class="ring-wrap">
        <svg viewBox="0 0 120 120">
          <defs><linearGradient id="pathGemGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#0FBFA8"/><stop offset="55%" stop-color="#38BDF8"/><stop offset="100%" stop-color="#7C6CF5"/>
          </linearGradient></defs>
          <circle class="ring-track" cx="60" cy="60" r="52"></circle>
          <circle class="ring-fill" cx="60" cy="60" r="52" stroke-dasharray="${RING_C}" stroke-dashoffset="${(RING_C * (1 - trackPct / 100)).toFixed(1)}"></circle>
        </svg>
        <div class="ring-label"><strong>${trackPct}%</strong><span>track progress</span></div>
      </div>
      <div class="path-stats">
        <div><strong>${passedCount}/${p.levels.length}</strong><span>Levels passed</span></div>
        <div><strong>Wk ${curWeek}</strong><span>of ${totalWeeks}</span></div>
        <div><strong>${p.gems}</strong><span>Gems earned</span></div>
      </div>
    </div>` : '';

  const outline = `
    <nav class="module-outline">
      <div class="outline-eyebrow">Course outline</div>
      ${modules.map((mod, i) => {
        const allPassed = mod.levels.every((l) => l.passed);
        const isCurrentModule = curLevel && mod.levels.some((l) => l.quest.id === curLevel.quest.id);
        return `<button type="button" class="outline-item${isCurrentModule ? ' active' : ''}" onclick="document.getElementById('qmod${i}').scrollIntoView({behavior:'smooth',block:'start'})">
          <span class="dot${allPassed ? ' done' : ''}${isCurrentModule ? ' active' : ''}"></span>Module ${i + 1} &middot; Week ${mod.week}</button>`;
      }).join('')}
    </nav>`;

  const modulesHtml = modules.map((mod, mi) => {
    const classesHtml = mod.levels.map((l, li) => {
      const q = l.quest;
      const mySubFor = (pid) => d.my_subs[`${q.id}:${pid}`];
      const isCurrent = curLevel && q.id === curLevel.quest.id;
      const overdue = q.deadline && new Date() > new Date(q.deadline + 'T23:59:59');
      const dueChip = q.deadline
        ? `<span class="due-chip${overdue ? ' overdue' : ''}" title="Late submissions lose ${d.late_penalty_pct || 20}% of earned gems">&#9200; Due ${fmtDate(q.deadline)}${overdue ? ' &middot; past due' : ''}</span>`
        : '';
      const stateBadge = l.passed
        ? '<span class="pay-badge confirmed">Passed</span>'
        : (l.unlocked ? '<span class="pay-badge confirmed">Open</span>' : '<span class="pay-badge na">Locked</span>');
      const teacherLevelTools = d.can_manage ? `<div style="display:flex;gap:8px;flex-wrap:wrap;padding:0 0 10px">
          <button class="btn btn-ghost btn-sm" onclick="formLevelDeadline(${q.id},'${esc(q.deadline || '')}')" title="Set or change this level's deadline">&#128197; Deadline</button>
          <button class="btn btn-ghost btn-sm" onclick="formAddProblem(${q.id})" title="Add a coding or written problem to this level">+ Task</button>
          <button class="btn btn-ghost btn-sm" onclick="remindLevel(${q.id})" title="Email students who have not finished this level">&#128276;</button>
        </div>` : '';
      const rowsHtml = q.problems.map((pr) => {
        const sub = isStudent ? mySubFor(pr.pid) : null;
        const graded = isStudent && sub && sub.grade != null;
        let chip = '';
        if (isStudent && sub) {
          chip = sub.grade != null
            ? `<span class="grade-chip ok" title="${sub.late ? 'Submitted late: ' + sub.late_deduction + ' gems deducted' : 'Graded by your teacher'}">Graded ${sub.grade}% &middot; ${sub.gems} gems${sub.late ? ' &#9203;' : ''}</span>`
            : `<span class="grade-chip wait">&#9203; Submitted &middot; not graded yet${sub.late ? ' &middot; late' : ''}</span>`;
        } else if (isStudent && l.unlocked) {
          chip = `<span class="grade-chip none">Not submitted</span>`;
        }
        const subLine = [
          q.deadline ? `due ${fmtDate(q.deadline)} &middot; late = &minus;${d.late_penalty_pct || 20}% gems` : '',
          sub && sub.shared_review ? '<span style="color:var(--teal-deep)">Feedback shared</span>' : '',
        ].filter(Boolean).join(' &middot; ');
        const btnLabel = !isStudent ? 'Open' : (sub ? 'Reopen' : (l.unlocked ? 'Solve' : 'Preview'));
        return `<div class="problem-row${!l.unlocked ? ' locked' : ''}">
          ${graded ? '<span class="check">&#10003;</span>' : ''}
          <div class="grow">
            <div class="t" style="font-size:13.5px">${pr.type === 'written' ? '<span class="type-badge written">&#128221; Written</span> ' : ''}${esc(pr.title)}
              <span class="lc-diff ${QUEST_DIFF(pr.difficulty)}">${QUEST_DIFF(pr.difficulty)}</span>
              <span class="s" style="color:var(--muted);font-weight:500">${pr.points} gems</span></div>
            ${subLine ? `<div class="s" style="color:var(--muted);margin-top:3px">${subLine}</div>` : ''}
            ${chip ? `<div style="margin-top:4px">${chip}</div>` : ''}
          </div>
          <button class="btn btn-teal btn-sm" onclick="QUEST_SCROLL_Y = window.scrollY; openTask(${q.id},${pr.pid})">${btnLabel}</button>
          ${d.can_manage ? `<button class="btn btn-ghost btn-sm" onclick="formEditProblem(${q.id},${pr.pid})">Edit</button>` : ''}
          ${d.can_manage || ME.role === 'coordinator' ? `<button class="btn btn-ghost btn-sm" onclick="openQuestSubs(${q.id},${pr.pid})">Submissions</button>` : ''}
        </div>`;
      }).join('');
      return `<details class="class-block"${isCurrent || !isStudent ? ' open' : ''}>
        <summary>
          <svg class="chev" width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M9 6l6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          <span class="class-title">Class ${li + 1} &middot; ${esc(q.title)}</span>
          ${stateBadge}${dueChip}
        </summary>
        <div class="class-body">${teacherLevelTools}${rowsHtml}</div>
      </details>`;
    }).join('');
    return `<section class="module-panel" id="qmod${mi}">
      <div class="module-panel-head"><span class="module-eyebrow">Week ${mod.week}</span><h3>Module ${mi + 1}</h3></div>
      ${classesHtml}
    </section>`;
  }).join('');

  const ep = p.track.end_project;
  const projectCard = (isStudent && ep) ? `
    <div class="project-card">
      <div class="project-eyebrow">End Project</div>
      <h3>${esc(ep.title)}</h3>
      ${ep.tagline ? `<p class="project-tagline">${esc(ep.tagline)}</p>` : ''}
      ${(ep.includes || []).length ? `<ul class="project-checklist">${ep.includes.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>` : ''}
      <div class="project-progress"><div style="width:${trackPct}%"></div></div>
      <div class="project-foot"><span>Track progress</span><span>${trackPct}%</span></div>
      <button type="button" class="btn btn-ghost btn-sm" style="width:100%;margin-top:12px" onclick="document.getElementById('qmod${modules.length - 1}').scrollIntoView({behavior:'smooth',block:'start'})">Jump to the final level</button>
    </div>` : '';

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
    <div style="display:grid;grid-template-columns:250px 1fr 280px;gap:20px;align-items:start" class="quest-grid">
      <aside>${pathCard}${outline}</aside>
      <main>${modulesHtml}</main>
      <aside>${projectCard}${board}</aside>
    </div>
    <style>@media (max-width:1140px){.quest-grid{grid-template-columns:1fr !important}}</style>`;
  if (QUEST_SCROLL_RESTORE_PENDING) { QUEST_SCROLL_RESTORE_PENDING = false; window.scrollTo({ top: QUEST_SCROLL_Y || 0 }); }
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
/* ============================ TASK WORKSPACE ============================ */
// A full page per task: the assignment brief on one side, a professional
// editor + real terminal on the other. input() is interactive - the prompt
// appears in the terminal and the student answers right there. numpy,
// pandas, matplotlib, and scikit-learn load automatically from imports;
// matplotlib charts render below the output.
let QUEST_DATA = null;
let TASK_CTX = null; // { qid, pid, term }
// Scroll offset within the quest/level list at the moment a task was opened
// (set by the Solve/Reopen button's onclick) and a one-shot flag telling the
// next renderQuestTab() to restore it - set only by backToQuest(), so
// "Back" returns to the exact spot you were at (not the top of the list)
// without changing openCourse()'s timing for its other callers (chat,
// submission review, ...), which don't want to wait on quest data at all.
let QUEST_SCROLL_Y = 0;
let QUEST_SCROLL_RESTORE_PENDING = false;

function sharedReviewBox(sr) {
  if (!sr) return '';
  const rows = [['Key concepts you showed', sr.key_concepts], ['Things to fix', sr.mistakes], ['A better approach', sr.better_approach]]
    .filter(([, v]) => v)
    .map(([k, v]) => `<div style="margin-bottom:6px"><span style="font-weight:700;color:var(--navy)">${k}:</span> <span style="white-space:pre-line">${esc(v)}</span></div>`).join('');
  return `<div class="review-share-box"><div class="rsb-head">Feedback shared by your teacher</div>${rows}
    <div class="s" style="color:var(--muted-2)">Released by your instructor. Your grade always comes from your teacher.</div></div>`;
}

function backToQuest() { QUEST_SCROLL_RESTORE_PENDING = true; openCourse(bid()); }
// v20 Showcase Feed hook (step 6 Part B): one tap, mounted in place on the
// task workspace where matplotlib output is still alive as rendered
// <img src="data:..."> elements inside #taskTerm (see coderunner.js's
// EchoTerm.showImages) - the whole point of putting this button HERE
// rather than on the level map is that the blob only exists in memory
// while this specific workspace is open and has actually been run this
// session. Reuses the shared ShowcaseComposer component (showcase-
// composer.js) - not a second composer implementation. Nothing about
// grading, gating, or submission logic is touched.
async function shareToShowcase(submissionId) {
  const imgs = document.querySelectorAll('#taskTerm .term-imgs img');
  if (!imgs.length) {
    // No live output this session (student hasn't hit Run since opening
    // this workspace, or it's a non-plotting task) - fall back to the
    // navigate-and-attach flow rather than hiding the button, exactly as
    // specified: the student still gets there, just picks the image(s)
    // themselves on the showcase page instead of having one pre-attached.
    location.href = `/showcase?compose=1&quest_submission_id=${submissionId}`;
    return;
  }
  let files;
  try {
    files = await Promise.all(Array.from(imgs).slice(0, 4).map((im, i) => ShowcaseComposer.fileFromDataUrl(im.src, `output-${i + 1}.png`)));
  } catch (e) {
    // Converting the already-rendered data: URL failed for some reason -
    // same safety net as the "no images" case above, never block sharing.
    location.href = `/showcase?compose=1&quest_submission_id=${submissionId}`;
    return;
  }
  ShowcaseComposer.open({
    questSubmissionId: submissionId,
    prefilledFiles: files, // student can still remove/add up to the 4-image max in the composer
    onPublished(post) { toast(post.status === 'PENDING_REVIEW' ? 'Posted - waiting for a quick review before it goes live.' : 'Posted to your showcase!'); },
  });
}

function openTask(qid, pid) {
  const d = QUEST_DATA;
  if (!d || !d.progress) return;
  const lvl = d.progress.levels.find((l) => l.quest.id === qid);
  if (!lvl) return;
  const q = lvl.quest;
  const pr = q.problems.find((x) => x.pid === pid);
  if (!pr) return;
  const isStudent = ME.role === 'student';
  const ideOn = d.ide_enabled !== false;
  const isWritten = pr.type === 'written' || !ideOn; // no-compiler courses: written workspace everywhere
  const sub = isStudent ? d.my_subs[`${q.id}:${pid}`] : null;
  const canSubmit = isStudent && lvl.unlocked && !lvl.passed;
  const taskFiles = (d.task_files || []).filter((f) => f.quest_id === q.id && f.pid === pid);
  const overdue = q.deadline && new Date() > new Date(q.deadline + 'T23:59:59');
  const penalty = d.late_penalty_pct || 20;

  document.querySelectorAll('.view').forEach((v) => v.classList.remove('active'));
  $('view-task').classList.add('active');
  $('pageTitle').textContent = pr.title;
  $('sidebar').classList.remove('open');

  const refsHtml = (pr.refs || []).length
    ? `<div class="s" style="margin-top:10px"><strong>Resources:</strong> ${pr.refs.map((r) => `<a href="${esc(r[1])}" target="_blank" rel="noopener">${esc(r[0])}</a>`).join(' &middot; ')}</div>` : '';
  const solHtml = (!isStudent && pr.solution)
    ? `<details style="margin-top:12px"><summary class="s" style="cursor:pointer;color:var(--teal-deep);font-weight:600">Solution guideline (teachers only)</summary><div class="s" style="background:#FDF8EC;border:1px solid #F0E2BC;border-radius:9px;padding:9px 12px;margin-top:5px;white-space:pre-line">${esc(pr.solution)}</div></details>` : '';

  // Deadline is stated on EVERY assignment, with the late rule spelled out.
  const deadlineHtml = q.deadline
    ? `<div class="deadline-box${overdue ? ' overdue' : ''}">&#9200; <strong>Deadline: ${fmtDate(q.deadline)}</strong> &middot; late submissions are accepted but lose <strong>${penalty}% of earned gems</strong>.${overdue ? ' <strong>This deadline has passed - submitting now counts as late.</strong>' : ''}</div>`
    : '';

  // Datasets attached to this task: students copy the file name straight
  // into pd.read_csv(...); the compiler mounts the file automatically.
  const filesHtml = ideOn ? `
    <div class="task-files">
      <div class="s" style="font-weight:700;color:var(--navy);margin-bottom:6px">Datasets for this task</div>
      ${taskFiles.length ? taskFiles.map((f) => `
        <div class="tf-row">
          <span class="mono s" style="font-weight:600">${esc(f.name)}</span>
          <span class="s" style="color:var(--muted-2)">${f.size ? (f.size / 1024).toFixed(0) + ' KB' : ''}</span>
          <span style="flex:1"></span>
          <button class="btn btn-ghost btn-sm" onclick="navigator.clipboard.writeText('${esc(f.name)}').then(()=>toast('Path copied - use pd.read_csv(&quot;${esc(f.name)}&quot;)'))">Copy path</button>
          <a class="btn btn-ghost btn-sm" href="${esc(f.url)}" download="${esc(f.name)}">Download</a>
          ${d.can_manage ? `<button class="btn btn-danger btn-sm" onclick="delTaskFile(${f.id},${q.id},${pid})">&times;</button>` : ''}
        </div>`).join('') : '<div class="s" style="color:var(--muted)">No datasets attached yet.</div>'}
      ${taskFiles.length ? `<p class="hint" style="margin:6px 0 0">These files are loaded into the compiler automatically - read them by name, e.g. <code>pd.read_csv('${esc(taskFiles[0].name)}')</code>.</p>` : ''}
      <div style="display:flex;gap:8px;margin-top:10px;align-items:center;flex-wrap:wrap">
        <label class="btn btn-ghost btn-sm" style="cursor:pointer">Upload your own dataset (CSV / JSON / TXT)
          <input type="file" accept=".csv,.tsv,.txt,.json" style="display:none" onchange="taskLocalDataset(this)"></label>
        <span class="s" style="color:var(--muted-2)">Loads straight into the compiler for pandas / matplotlib / SQL - it never leaves your browser.</span>
      </div>
      <div id="localDsChips" style="margin-top:6px"></div>
      ${d.can_manage ? `<form id="taskFileUp">
        <input name="file" type="file" accept=".csv,.tsv,.txt,.json,.xlsx,.xls,.parquet,.zip" required>
        <button class="btn btn-teal btn-sm">Attach dataset for all students</button></form>` : ''}
    </div>` : '';

  let statusHtml = '';
  if (isStudent && sub) {
    statusHtml = sub.grade != null
      ? `<div class="task-status ok">&#10003; Graded <strong>${sub.grade}%</strong> &middot; ${gemChip(sub.gems)}${sub.late ? ` &middot; <span style="color:var(--danger)">late: &minus;${sub.late_deduction} gems</span>` : ''} ${sub.remarks ? '&middot; &ldquo;' + esc(sub.remarks) + '&rdquo;' : ''}</div>`
      : `<div class="task-status wait">&#9203; Submitted ${esc((sub.submitted_at || '').slice(0, 16))}${sub.late ? ' <strong>(late)</strong>' : ''} - awaiting grade</div>`;
    statusHtml += sharedReviewBox(sub.shared_review);
    // v20 Showcase Feed hook: only once the whole LEVEL is passed (not just
    // this one problem graded) - matches "after a student passes a quest".
    // Re-run the code below with Run to get a live output attached
    // automatically; without a run this session it still works via the
    // navigate fallback in shareToShowcase().
    if (lvl.passed && sub.grade != null) {
      statusHtml += `<div style="margin-top:10px"><button class="btn btn-ghost btn-sm" onclick="shareToShowcase(${sub.id})">&#127942; Share your output to your showcase</button></div>`;
    }
  }
  if (isStudent && !lvl.unlocked) statusHtml = `<div class="task-status lock">&#128274; This level is locked - pass the previous level first. You can read the task and practice in the editor, but not submit yet.</div>`;

  const fileAccept = isWritten ? '.pdf,.doc,.docx,.txt' : '.pdf,.doc,.docx';
  const fileMode = canSubmit ? `
    <details style="margin-top:14px"${isWritten ? ' open' : ''}><summary class="s" style="cursor:pointer;color:var(--muted);font-weight:600">${isWritten ? 'Upload your answer as a file (PDF, Word or text)' : 'Submit a file instead (reports, screenshots, notebooks - PDF/Word)'}</summary>
      <form id="taskFileForm" style="margin-top:10px">
        <label class="field"><span>${isWritten ? 'Your written answer - PDF, Word or .txt' : 'Your file - PDF or Word only'}</span><input name="file" type="file" accept="${fileAccept}" required></label>
        <label class="field"><span>Note to your instructor (optional)</span><input name="note" value="${esc((sub && sub.note) || '')}"></label>
        <button class="btn btn-primary">${sub ? 'Resubmit file' : 'Submit file'}</button>
      </form></details>` : '';

  const prevCode = sub && sub.code ? sub.code : '';
  const prevLang = (sub && sub.language) || (isWritten ? 'text' : 'python');

  // Written problems get a clean answer workspace; coding problems get the
  // full-height IDE (Python or HTML/CSS/JS) beside a collapsible brief.
  const langOptions = isWritten
    ? `<option value="text" selected>Written answer</option>`
    : `<option value="python"${prevLang === 'python' ? ' selected' : ''}>Python 3</option>
       <option value="c"${prevLang === 'c' ? ' selected' : ''}>C</option>
       <option value="cpp"${prevLang === 'cpp' ? ' selected' : ''}>C++</option>
       <option value="java"${prevLang === 'java' ? ' selected' : ''}>Java</option>
       <option value="sql"${prevLang === 'sql' ? ' selected' : ''}>SQL</option>
       <option value="web"${prevLang === 'web' ? ' selected' : ''}>HTML / CSS / JS</option>
       <option value="text"${prevLang === 'text' ? ' selected' : ''}>Written answer</option>`;

  $('view-task').innerHTML = `
    <div class="task-topline">
      <button class="btn btn-ghost btn-sm" onclick="backToQuest()">&larr; Back to quest</button>
      <button class="btn btn-ghost btn-sm" id="focusBtn" onclick="toggleFocusMode()" title="Hide the brief and give the editor the whole screen">&#9974; Focus mode</button>
    </div>
    <div class="task-head">
      <div>
        <h2 style="margin-bottom:4px">${isWritten ? '&#128221; ' : ''}${esc(pr.title)}</h2>
        <div class="task-meta">
          <span class="qdiff ${esc(pr.difficulty)}">${esc(pr.difficulty)}</span>
          ${isWritten ? '<span class="type-badge written">Written problem - explain your logic, no code needed</span>' : ''}
          <span class="s"><strong>${pr.points}</strong> gems</span>
          <span class="s" style="color:var(--muted)">Level ${q.no} &middot; ${esc(q.topic)}</span>
        </div>
      </div>
    </div>
    ${deadlineHtml}
    <div class="task-grid full" id="taskGrid">
      <div class="task-brief" id="taskBrief">
        <div class="card"><div class="card-head"><h3>${isWritten ? 'Problem statement' : 'Assignment'}</h3></div>
          <div class="card-body">
            <div class="s" style="white-space:pre-line;line-height:1.6;font-size:13.5px">${esc(pr.description)}</div>
            ${isWritten ? '<p class="hint" style="margin-top:10px">This is a logic problem: write the reasoning, steps, or explanation in your own words - or upload it as a PDF/text file. Code is not required.</p>' : ''}
            ${refsHtml}${solHtml}${statusHtml}${filesHtml}${fileMode}
          </div></div>
      </div>
      <div class="task-ide card">
        <div class="ide-toolbar">
          <select id="taskLang" onchange="taskLangChanged()"${isWritten ? ' disabled' : ''}>${langOptions}</select>
          <span class="ide-pkgs" id="idePkgs">${ideOn ? `numpy &middot; pandas &middot; matplotlib &middot; scikit-learn ready${taskFiles.length ? ' &middot; ' + taskFiles.length + ' dataset' + (taskFiles.length > 1 ? 's' : '') + ' mounted' : ''}` : 'Answer workspace'}</span>
          <span style="flex:1"></span>
          <button type="button" class="btn btn-ghost btn-sm" onclick="clearTaskTerm()">Clear output</button>
          <button type="button" class="btn btn-teal btn-sm" id="runBtn" onclick="runTaskCode()">Run</button>
        </div>
        <textarea id="codeBox" class="code-editor ide-editor" spellcheck="false" placeholder="# Write your Python solution here, then press Run.">${esc(prevCode)}</textarea>
        <div class="ide-status-row"><span class="s" id="runStatus" style="color:var(--muted-2)">Ready.</span></div>
        <div id="taskTerm"></div>
        <div id="webWrap" style="display:none">
          <iframe id="webFrame" class="web-frame" sandbox="allow-scripts" title="Live preview"></iframe>
          <pre id="webLog" class="web-log"></pre>
        </div>
        ${canSubmit ? `
        <div class="ide-submit">
          <input id="taskNote" placeholder="Note to your instructor (optional)" value="${esc((sub && sub.note) || '')}">
          <button class="btn btn-primary" id="taskSubmitBtn" onclick="submitTaskCode(${q.id},${pid})">${sub ? 'Resubmit solution' : 'Submit solution'}</button>
        </div>
        <p class="hint" style="margin:8px 14px 14px">Submitting sends exactly what is in the editor.${q.deadline ? ` Deadline ${fmtDate(q.deadline)} - late work loses ${penalty}% of its gems.` : ''} The level average must reach the pass mark to unlock the next level.</p>` : '<div style="height:14px"></div>'}
      </div>
    </div>`;

  const term = EchoTerm.mount($('taskTerm'));
  TASK_CTX = { qid, pid, term, files: taskFiles.map((f) => ({ name: f.name, url: f.url })) };
  EchoRun.wireEditor($('codeBox'));
  taskLangChanged();

  const ff = $('taskFileForm');
  if (ff) ff.addEventListener('submit', async (e) => {
    e.preventDefault(); const btn = ff.querySelector('button'); btn.disabled = true;
    try {
      await api(`/api/quests/${q.id}/problems/${pid}/submit`, { method: 'POST', body: new FormData(ff) });
      toast('Submitted - gems incoming once graded.'); backToQuest();
    } catch (err) { toast(err.message, true); btn.disabled = false; }
  });
  const fu = $('taskFileUp');
  if (fu) fu.addEventListener('submit', async (e) => {
    e.preventDefault(); const btn = fu.querySelector('button'); btn.disabled = true;
    try {
      await api(`/api/quests/${q.id}/problems/${pid}/files`, { method: 'POST', body: new FormData(fu) });
      toast('Dataset attached - students can read it by name in the compiler.');
      const fresh = await api(`/api/batches/${bid()}/quest`); QUEST_DATA = fresh; openTask(qid, pid);
    } catch (err) { toast(err.message, true); btn.disabled = false; }
  });
}
async function delTaskFile(fid, qid, pid) {
  if (!confirm('Remove this dataset from the task?')) return;
  try {
    await api(`/api/task-files/${fid}`, { method: 'DELETE' });
    const fresh = await api(`/api/batches/${bid()}/quest`); QUEST_DATA = fresh; openTask(qid, pid);
  } catch (e) { toast(e.message, true); }
}
async function toggleCourseIde(enabled) {
  if (!confirm(enabled
    ? 'Turn the built-in compiler ON for this course? Coding tasks will show the Python / web IDE again.'
    : 'Turn the built-in compiler OFF for this course? Every task will show a clean written-answer workspace instead - right for UI/UX, graphics, and no-code automation courses. You can turn it back on any time.')) return;
  try {
    await api(`/api/batches/${bid()}/ide`, { method: 'POST', body: JSON.stringify({ enabled }) });
    toast(enabled ? 'Compiler is ON for this course.' : 'Compiler is OFF - tasks now use the written workspace.');
    drawCourseTab('Quest');
  } catch (e) { toast(e.message, true); }
}
function toggleFocusMode() {
  const grid = $('taskGrid'); if (!grid) return;
  grid.classList.toggle('focus');
  $('focusBtn').innerHTML = grid.classList.contains('focus') ? '&#9974; Show brief' : '&#9974; Focus mode';
}
function taskLangChanged() {
  const lang = $('taskLang').value;
  const term = ['python', 'c', 'cpp', 'sql'].includes(lang), web = lang === 'web';
  $('runBtn').style.display = (term || web) ? '' : 'none';
  $('taskTerm').style.display = term ? '' : 'none';
  $('webWrap').style.display = web ? '' : 'none';
  $('idePkgs').style.display = term ? '' : 'none';
  const pk = $('idePkgs');
  if (!pk.dataset.py) pk.dataset.py = pk.innerHTML; // remember the Python label
  if (lang === 'python') pk.innerHTML = pk.dataset.py;
  else if (lang === 'c') pk.textContent = 'C · gcc 10 · compiled & run in the cloud';
  else if (lang === 'cpp') pk.textContent = 'C++ · g++ 10 · compiled & run in the cloud';
  else if (lang === 'sql') pk.textContent = 'SQLite · CSV datasets load as tables automatically';
  $('codeBox').placeholder = lang === 'python'
    ? '# Write your Python solution here, then press Run.'
    : lang === 'c'
      ? '// Write your C solution here, then press Run.\n#include <stdio.h>\nint main(){\n    printf("Hello EchoLens\\n");\n    return 0;\n}'
      : lang === 'cpp'
        ? '// Write your C++ solution here, then press Run.\n#include <iostream>\nint main(){\n    std::cout << "Hello EchoLens\\n";\n    return 0;\n}'
        : lang === 'sql'
          ? '-- Write SQL here, then press Run. Attached CSV datasets become tables automatically.\nSELECT 1 + 1 AS answer;'
          : web
            ? '<!-- Write HTML, CSS (in <style>) and JavaScript (in <script>) here, then press Run for a live preview. -->'
            : 'Write your answer here, then press Submit.';
}
function clearTaskTerm() {
  if (TASK_CTX) TASK_CTX.term.clear();
  const wl = $('webLog'); if (wl) wl.textContent = '';
  const wf = $('webFrame'); if (wf) wf.srcdoc = '';
  const s = $('runStatus'); if (s) s.textContent = 'Ready.';
}
async function runTaskCode() {
  const btn = $('runBtn'); const status = $('runStatus');
  const code = $('codeBox').value;
  if (!code.trim()) { toast('Write some code first.', true); return; }
  const lang = $('taskLang').value;
  if (lang === 'web') {
    // Instant live preview - console output and errors appear in the log.
    const log = $('webLog'); log.textContent = '';
    EchoWeb.preview($('webFrame'), code, (kind, text) => {
      log.textContent += (kind === 'error' ? '✗ ' : kind === 'warn' ? '! ' : '› ') + text + '\n';
      log.scrollTop = log.scrollHeight;
    });
    status.textContent = 'Preview updated.';
    return;
  }
  if (EchoRun.isRunning()) { EchoRun.cancel(); btn.innerHTML = 'Run'; return; }
  btn.innerHTML = 'Stop';
  const files = [...TASK_CTX.files, ...(TASK_CTX.localFiles || [])];
  try { await EchoRun.executeAny(lang, code, { term: TASK_CTX.term, files, onStatus: (t) => { status.textContent = t; } }); }
  catch (e) { status.textContent = e.message; }
  btn.innerHTML = 'Run';
}
/* v12: students upload their OWN dataset (CSV/JSON/txt) into the compiler -
 * it is mounted locally in the browser (never uploaded to the server), so
 * pd.read_csv('mydata.csv') and SQL tables work with the student's file. */
function taskLocalDataset(input) {
  const f = input.files && input.files[0];
  if (!f) return;
  if (f.size > 20 * 1024 * 1024) { toast('Keep datasets under 20 MB.', true); input.value = ''; return; }
  const reader = new FileReader();
  reader.onload = () => {
    TASK_CTX.localFiles = (TASK_CTX.localFiles || []).filter((x) => x.name !== f.name);
    TASK_CTX.localFiles.push({ name: f.name, bytes: reader.result });
    const chip = $('localDsChips');
    if (chip) chip.innerHTML = TASK_CTX.localFiles.map((x) => `<span class="prob-chip" title="Loaded into the compiler">${esc(x.name)}</span>`).join(' ');
    toast(`${f.name} loaded - read it by name, e.g. pd.read_csv('${f.name}') or as SQL table "${f.name.replace(/\.[^.]+$/, '')}".`);
  };
  reader.readAsArrayBuffer(f);
  input.value = '';
}
async function submitTaskCode(qid, pid) {
  const btn = $('taskSubmitBtn'); const code = $('codeBox').value;
  if (!code.trim() || code.trim().length < 5) { toast('Write your solution in the editor first.', true); return; }
  btn.disabled = true;
  try {
    await api(`/api/quests/${qid}/problems/${pid}/submit`, {
      method: 'POST',
      body: JSON.stringify({ code, language: $('taskLang').value, note: $('taskNote').value }),
    });
    toast('Submitted - gems incoming once graded.'); backToQuest();
  } catch (err) { toast(err.message, true); btn.disabled = false; }
}
async function remindLevel(qid) {
  if (!confirm('Email a reminder to every student who has not finished this level yet?')) return;
  try {
    const out = await api(`/api/quests/${qid}/remind`, { method: 'POST' });
    toast(out.behind ? `Reminder sent to ${out.reminded} student${out.reminded === 1 ? '' : 's'} (${out.behind} behind).` : 'Everyone has finished this level - no reminders needed.');
  } catch (e) { toast(e.message, true); }
}

/* ============================== COURSE CHAT ============================== */
// Ask-anything space per course. Students choose per message: real name or
// their stable anonymous alias - nobody (not even the teacher) can see who
// is behind an alias, so shy students can ask freely.
let CHAT_TIMER = null;
async function renderChatTab(body) {
  body.innerHTML = '<div class="empty">Loading chat&hellip;</div>';
  const d = await api(`/api/batches/${bid()}/chat`);
  const isLearner = ['student', 'free'].includes(ME.role);
  body.innerHTML = `
    <div class="card"><div class="card-head"><h3>Course chat</h3>
      <span class="s" style="color:var(--muted)">${isLearner ? `Ask anything - post with your name or as <strong>${esc(d.my_alias)}</strong>, your anonymous alias. Type <strong>@</strong> to tag your teacher.` : 'Questions from your students - type <strong>@</strong> to tag any student for a task. Anonymous aliases stay anonymous, even to you.'}</span></div>
      <div class="card-body">
        <div id="chatList" class="chat-list"></div>
        <div id="mentionPick" class="mention-pick" style="display:none"></div>
        <form id="chatForm" class="chat-composer">
          ${isLearner ? `<select id="chatAnon"><option value="0">As ${esc(ME.name.split(' ')[0])}</option><option value="1">As ${esc(d.my_alias)} (anonymous)</option></select>` : ''}
          <input id="chatBody" maxlength="2000" placeholder="${isLearner ? 'Ask a question... use @ to tag your teacher' : 'Reply or tag a student with @...'}" autocomplete="off">
          <button class="btn btn-primary btn-sm">Send</button>
        </form>
        <p class="hint" style="margin:6px 2px 0">Messages are permanent${d.can_moderate ? ' - you can moderate as course staff' : ' and cannot be deleted'}. Tagging someone sends them an email${isLearner ? ' and posts with your real name' : ''}.</p>
      </div></div>`;
  drawChat_(d);
  wireMentions(d.members || []);
  $('chatForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const inp = $('chatBody'); const text = inp.value.trim(); if (!text) return;
    const anon = $('chatAnon') ? $('chatAnon').value === '1' : false;
    inp.value = '';
    try {
      await api(`/api/batches/${bid()}/chat`, { method: 'POST', body: JSON.stringify({ body: text, anonymous: anon }) });
      const fresh = await api(`/api/batches/${bid()}/chat`); drawChat_(fresh);
    } catch (err) { toast(err.message, true); inp.value = text; }
  });
  CHAT_TIMER = setInterval(async () => {
    if (!$('chatList')) { clearInterval(CHAT_TIMER); CHAT_TIMER = null; return; }
    try { const fresh = await api(`/api/batches/${bid()}/chat`); drawChat_(fresh); } catch {}
  }, 12000);
}
function drawChat_(d) {
  const list = $('chatList'); if (!list) return;
  const atBottom = list.scrollHeight - list.scrollTop - list.clientHeight < 60;
  const highlight = (m) => {
    let html = esc(m.body);
    for (const x of m.mentions || []) {
      html = html.replace(new RegExp('@' + esc(x.name).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), `<span class="mention${x.id === ME.id ? ' me' : ''}">@${esc(x.name)}</span>`);
    }
    return html;
  };
  list.innerHTML = d.messages.length ? d.messages.map((m) => `
    <div class="chat-msg${m.mine ? ' mine' : ''}${m.staff_role ? ' staff' : ''}${m.mentions_me ? ' tagged-me' : ''}">
      <div class="cm-head">
        ${!m.anonymous ? avatarHtml(m.avatar, m.display_name, 22) : ''}
        <span class="cm-name">${esc(m.display_name)}</span>
        ${m.staff_role ? `<span class="cm-role">${m.staff_role === 'admin' ? 'Admin' : m.staff_role === 'coordinator' ? 'Coordinator' : 'Teacher'}</span>` : (m.anonymous ? '<span class="cm-anon">anonymous</span>' : '')}
        <span class="cm-time">${esc((m.created_at || '').slice(5, 16))}</span>
        ${d.can_moderate ? `<button class="cm-del" title="Moderate: delete" onclick="delChatMsg(${m.id})">&times;</button>` : ''}
      </div>
      <div class="cm-body">${highlight(m)}</div>
    </div>`).join('') : '<div class="empty">No questions yet - be the first to ask. Anonymous posting means nobody will know it was you.</div>';
  if (atBottom || !list.dataset.drawn) list.scrollTop = list.scrollHeight;
  list.dataset.drawn = '1';
}
// @-tagging: typing "@" opens a picker of real course members; students can
// tag teachers, teachers can tag anyone.
function wireMentions(members) {
  const inp = $('chatBody'); const pick = $('mentionPick');
  if (!inp || !pick) return;
  const isLearner = ['student', 'free'].includes(ME.role);
  const taggable = members.filter((m) => m.id !== ME.id && (!isLearner || m.role === 'instructor'));
  function currentToken() {
    const upto = inp.value.slice(0, inp.selectionStart);
    const m = upto.match(/@([\w .-]{0,30})$/);
    return m ? { text: m[1], start: upto.length - m[0].length } : null;
  }
  inp.addEventListener('input', () => {
    const tok = currentToken();
    if (!tok) { pick.style.display = 'none'; return; }
    const hits = taggable.filter((x) => x.name.toLowerCase().startsWith(tok.text.toLowerCase())).slice(0, 6);
    if (!hits.length) { pick.style.display = 'none'; return; }
    pick.innerHTML = hits.map((x) => `<button type="button" data-name="${esc(x.name)}">${esc(x.name)} <span class="s" style="color:var(--muted-2)">${x.role === 'instructor' ? 'Teacher' : 'Student'}</span></button>`).join('');
    pick.style.display = '';
    pick.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => {
      const tok2 = currentToken(); if (!tok2) { pick.style.display = 'none'; return; }
      inp.value = inp.value.slice(0, tok2.start) + '@' + b.dataset.name + ' ' + inp.value.slice(inp.selectionStart);
      pick.style.display = 'none'; inp.focus();
    }));
  });
  inp.addEventListener('blur', () => setTimeout(() => { pick.style.display = 'none'; }, 200));
}
async function delChatMsg(id) {
  if (!confirm('Delete this message? (Moderation - students cannot delete messages.)')) return;
  try { await api(`/api/chat/${id}`, { method: 'DELETE' }); const fresh = await api(`/api/batches/${bid()}/chat`); drawChat_(fresh); }
  catch (e) { toast(e.message, true); }
}

async function openQuestSubs(qid, pid) {
  const d = await api(`/api/quests/${qid}/submissions`);
  const p = d.quest.problems.find((x) => x.pid === pid) || {};
  const subs = d.submissions.filter((s) => s.pid === pid);
  openModal(`${d.quest.title}: ${p.title}`, `
    <p class="hint" style="margin-bottom:8px">Grading opens in its own tab, with the full submission, AI review and integrity check side by side.</p>
    <div class="card-body tight" style="max-height:56vh;overflow-y:auto">
      ${subs.length ? subs.map((s) => `
        <div class="list-row" style="padding:12px 4px">
          <div class="grow">
            <div class="t">${esc(s.student_name)} <span class="mono s" style="color:var(--muted)">${esc(s.student_reg || '')}</span>${s.late ? ' <span class="late-flag">LATE</span>' : ''}</div>
            <div class="s">${esc((s.submitted_at || '').slice(0, 16))} &middot; ${s.code ? (s.language === 'web' ? '&#127760; web code' : s.language === 'text' ? '&#128221; written answer' : '&#9998; code submission') : '&#128206; file'} ${s.note ? '&middot; &ldquo;' + esc(s.note) + '&rdquo;' : ''}</div>
            ${s.grade != null ? `<div class="s"><span class="grade-chip ok">&#10003; Graded ${s.grade}%</span> ${s.gems} gems${s.late_deduction ? ` <span style="color:var(--danger)">(&minus;${s.late_deduction} late)</span>` : ''} ${s.remarks ? '&middot; ' + esc(s.remarks) : ''}</div>` : '<div class="s"><span class="grade-chip wait">&#9203; Not graded yet</span></div>'}
            ${s.ai_review ? `<div class="s" style="color:${s.review_shared ? 'var(--teal-deep)' : 'var(--muted-2)'}">AI review ${s.review_shared ? 'shared with student' : 'ready (not shared)'}</div>` : ''}
            ${s.integrity && (s.integrity.similarity?.matches?.length || (s.integrity.ai_check && s.integrity.ai_check.ai_likelihood >= 60)) ? '<div class="s" style="color:var(--danger);font-weight:600">&#9888; Integrity flags - open to review</div>' : ''}
          </div>
          ${s.file_url ? `<a class="btn btn-ghost btn-sm" href="${esc(s.file_url)}" target="_blank" rel="noopener">Open file</a>` : ''}
          ${CURRENT_BATCH.can_manage ? `<button class="btn btn-teal btn-sm" onclick="window.open('/grade?sid=${s.id}','_blank')">${s.grade != null ? 'Regrade' : 'Grade'} &#8599;</button>` : ''}
        </div>`).join('') : '<div class="empty">No submissions for this problem yet.</div>'}
    </div>`);
}
function formQuestGrade(sid, qid, pid) {
  api(`/api/quests/${qid}/submissions`).then((d) => {
    const s = d.submissions.find((x) => x.id === sid) || {};
    const codeBlock = s.code ? `
      <div class="pub-sec" style="margin-top:0">Submitted ${s.language === 'text' ? 'answer' : 'code'}</div>
      <div class="cp-toolbar">
        <span class="s" style="color:var(--muted-2)">${esc(s.language || 'python')}</span>
        <span style="flex:1"></span>
        <span class="s" id="runStatus" style="color:var(--muted-2)"></span>
        ${s.language !== 'text' ? `<button type="button" class="btn btn-ghost btn-sm" id="runBtn" onclick="runGradeCode()">Run</button>` : ''}
        <button type="button" class="btn btn-ghost btn-sm" onclick="navigator.clipboard.writeText(document.getElementById('gradeCode').textContent).then(()=>toast('Code copied.'))">Copy</button>
      </div>
      <pre id="gradeCode" class="code-out" style="display:block;max-height:30vh">${esc(s.code)}</pre>
      <div id="gradeTerm" style="display:none"></div>`
      : (s.file_url ? `<a class="btn btn-ghost btn-sm" href="${esc(s.file_url)}" target="_blank" rel="noopener" style="margin-bottom:12px">&#128206; Open submitted file</a>` : '');
    openModal('Grade quest submission', `
      ${codeBlock}
      ${ME.ai_enabled ? `<button class="btn btn-ghost btn-sm" id="aiDraftBtn" onclick="aiReview(${sid})" style="margin:10px 0 12px">AI Review</button>
        <div id="aiRationale" style="display:none"></div>` : ''}
      <form id="f">
        <label class="field"><span>Grade (0&ndash;100%)</span><input name="grade" type="number" min="0" max="100" ${s.grade != null ? `value="${s.grade}"` : ''} required></label>
        <label class="field"><span>Remarks for the student</span><textarea name="remarks" placeholder="What went well, what to improve">${esc(s.remarks || '')}</textarea></label>
        <p class="hint">Gems = problem points &times; grade. When the level's average reaches the pass mark, the next level unlocks automatically.</p>
        <button class="btn btn-primary btn-block">Save grade</button></form>`, true);
    $('f').addEventListener('submit', async (e) => {
      e.preventDefault(); const f = e.target; const btn = f.querySelector('button[type="submit"],button:not([type])'); btn.disabled = true; modalMsg('');
      try {
        await api(`/api/quest-submissions/${sid}/grade`, { method: 'POST', body: JSON.stringify({ grade: f.grade.value, remarks: f.remarks.value }) });
        toast('Graded - gems awarded.'); openQuestSubs(qid, pid);
      } catch (err) { modalMsg(err.message); btn.disabled = false; }
    });
  });
}
async function runGradeCode() {
  const btn = $('runBtn'); const status = $('runStatus');
  const code = $('gradeCode').textContent;
  if (EchoRun.isRunning()) { EchoRun.cancel(); btn.innerHTML = 'Run'; return; }
  const wrap = $('gradeTerm');
  wrap.style.display = '';
  if (!wrap._term) wrap._term = EchoTerm.mount(wrap);
  btn.innerHTML = 'Stop';
  try { await EchoRun.execute(code, { term: wrap._term, onStatus: (t) => { status.textContent = t; } }); }
  catch (e) { status.textContent = e.message; }
  btn.innerHTML = 'Run';
}
/* ============================ AI REVIEW (teacher) ============================ */
async function aiReview(sid, force) {
  const btn = $('aiDraftBtn'); if (btn) { btn.disabled = true; btn.textContent = 'Reviewing...'; }
  try {
    const out = await api('/api/ai/review', { method: 'POST', body: JSON.stringify({ submission_id: sid, force: !!force }) });
    const r = out.review;
    const f = $('f');
    if (f && r.suggested_score != null && !f.grade.value) f.grade.value = r.suggested_score;
    const box = $('aiRationale');
    box.style.display = '';
    box.innerHTML = `<div style="background:var(--canvas);border:1px solid var(--line);border-radius:11px;padding:12px 14px;margin-bottom:12px;font-size:12.5px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;gap:8px;flex-wrap:wrap">
        <strong>AI review (staff only until you share)</strong>
        <span style="display:flex;gap:8px;align-items:center">${out.cached ? `<button class="btn btn-ghost btn-sm" onclick="aiReview(${sid},true)">Regenerate</button>` : ''}
        <span class="s" style="color:var(--muted-2)">suggested: <strong>${r.suggested_score != null ? r.suggested_score + '%' : '—'}</strong></span></span>
      </div>
      ${[['Question', r.question_summary], ['What the student did', r.solution_summary], ['Key concepts grasped', r.key_concepts], ['Mistakes', r.mistakes], ['Better approach', r.better_approach]]
        .filter(([, v]) => v).map(([k, v]) => `<div style="margin-bottom:6px"><span style="font-weight:700;color:var(--navy)">${k}:</span> <span style="white-space:pre-line">${esc(v)}</span></div>`).join('')}
      ${r.readable === false ? '<div style="color:var(--danger)"><em>The submission was not readable as text - review is based on the brief and note only. Check it yourself.</em></div>' : ''}
      <div style="display:flex;gap:10px;align-items:center;margin-top:10px;flex-wrap:wrap">
        <button class="btn btn-teal btn-sm" id="shareBtn" onclick="shareReview(${sid}, ${out.shared ? 'false' : 'true'})">${out.shared ? 'Stop sharing with student' : 'Share key points with student'}</button>
        <span class="s" style="color:var(--muted-2)">${out.shared ? 'The student can see the key points, mistakes, and better approach - never the suggested score.' : 'Nothing reaches the student until you share. The suggested score is never shared.'}</span>
      </div>
      <div class="s" style="color:var(--muted-2);margin-top:6px">You decide the final score - edit anything before saving.</div>
    </div>`;
    modalMsg('AI review ready - the final score is yours.', true);
  } catch (e) { modalMsg(e.message); }
  if (btn) { btn.disabled = false; btn.innerHTML = 'AI Review'; }
}
async function shareReview(sid, share) {
  const btn = $('shareBtn'); if (btn) btn.disabled = true;
  try {
    const out = await api(`/api/quest-submissions/${sid}/share-review`, { method: 'POST', body: JSON.stringify({ share }) });
    toast(out.shared ? 'Key points shared - the student sees them on the task.' : 'Sharing stopped.');
    if (btn) {
      btn.disabled = false;
      btn.textContent = out.shared ? 'Stop sharing with student' : 'Share key points with student';
      btn.setAttribute('onclick', `shareReview(${sid}, ${out.shared ? 'false' : 'true'})`);
    }
  } catch (e) { modalMsg(e.message); if (btn) btn.disabled = false; }
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
          <label class="field"><span>Task type</span><select name="type"><option value="code"${p.type !== 'written' ? ' selected' : ''}>Coding (built-in compiler)</option><option value="written"${p.type === 'written' ? ' selected' : ''}>Written (logic answer, PDF/text upload)</option></select></label>
        </div>
        <label class="field"><span>Solution guideline (teachers/admin only - students never see this)</span><textarea name="solution" style="min-height:90px">${esc(p.solution || '')}</textarea></label>
        <label class="field"><span>Reference links - one per line as "Label | https://url"</span><textarea name="refs">${(p.refs || []).map((r) => `${r[0]} | ${r[1]}`).join('\n')}</textarea></label>
        <label class="field"><span>What we're looking for - one short line per point (optional, shown to students)</span><textarea name="criteria" placeholder="Correct mapping for all score ranges
Proper use of if/elif/else
Clean and readable code">${(p.criteria || []).join('\n')}</textarea></label>
        <label class="field"><span>Hint (optional, students reveal it themselves)</span><textarea name="hint" style="min-height:70px">${esc(p.hint || '')}</textarea></label>
        <button class="btn btn-primary btn-block">Save changes</button></form>`);
    $('f').addEventListener('submit', async (e) => {
      e.preventDefault(); const f = e.target; const btn = f.querySelector('button'); btn.disabled = true; modalMsg('');
      const refs = f.refs.value.split('\n').map((l) => l.split('|').map((x) => x.trim())).filter((r) => r.length === 2 && r[1].startsWith('http'));
      const criteria = f.criteria.value.split('\n').map((l) => l.trim()).filter(Boolean);
      try {
        await api(`/api/quests/${qid}/problems/${pid}`, { method: 'PATCH', body: JSON.stringify({ title: f.title.value, description: f.description.value, points: f.points.value, difficulty: f.difficulty.value, type: f.type.value, solution: f.solution.value, refs, criteria, hint: f.hint.value }) });
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

/* ============================================================================
   v18 FEATURES: scheduled classes with a built-in join button + automatic
   attendance, pop quizzes, at-risk report, student search + full profiles,
   QR certificates, level tools.
   ============================================================================ */

/* ------------------------------ CLASSES (schedule + built-in room) ------------------------------ */
// The call widget (#liveCallWidget) lives outside every tab/view container
// in dashboard.html, so switching Quest/Quizzes/Chat/Classes tabs - or even
// opening a different course entirely - never touches its DOM node and
// never disconnects the room. Only leaveSessionClass() tears it down.
let LIVE_HEART = null;
let LIVE_API = null;
let LIVE_SESSION_ID = null;
let LIVE_EXPANDED = false;
function stopLiveHeartbeat() {
  if (LIVE_HEART) { clearInterval(LIVE_HEART); LIVE_HEART = null; }
  if (LIVE_API) { try { LIVE_API.dispose(); } catch {} LIVE_API = null; }
}
function renderClassesTab(body) {
  const d = CURRENT_BATCH;
  const canManage = d.can_manage;
  const isStudent = ME.role === 'student';
  const sessions = d.sessions || [];

  const rateCard = isStudent && d.my_rate ? `
    <div class="card"><div class="card-body" style="display:flex;gap:16px;align-items:center">
      <div class="att-ring${d.my_rate.pct >= 75 ? ' good' : d.my_rate.pct >= 50 ? ' mid' : ' low'}">${d.my_rate.pct}%</div>
      <div><div class="t" style="font-weight:700">Your attendance</div>
      <div class="s" style="color:var(--muted)">${d.my_rate.attended} of ${d.my_rate.total} classes attended</div></div>
    </div></div>` : '';

  const rows = sessions.length ? sessions.map((s) => classRowHtml(s, canManage, isStudent)).join('')
    : `<div class="empty">No classes scheduled yet.${canManage ? ' Use Manage &rarr; Schedule a class.' : ''}</div>`;

  body.innerHTML = rateCard + `<div class="card"><div class="card-head"><h3>Classes</h3><span class="s" style="color:var(--muted)">Every scheduled class has a built-in join button - no Zoom or Meet link needed</span></div>
    <div class="card-body tight">${rows}</div></div>`;
}
function classRowHtml(s, canManage, isStudent) {
  const live = s.started_at && !s.ended_at;
  const held = !!s.started_at;
  const inThisCall = LIVE_SESSION_ID === s.id;
  let statusHtml, actions = '';
  if (live) {
    statusHtml = `<span class="live-dot" style="margin-right:6px"></span><span class="live-pill">LIVE</span>`;
    actions += inThisCall
      ? `<button class="btn btn-ghost btn-sm" onclick="focusLiveCallWidget()">&#10003; In call</button>`
      : `<button class="btn btn-primary btn-sm" onclick="joinSessionClass(${s.id})">&#127909; Join</button>`;
    if (canManage) actions += `<button class="btn btn-danger btn-sm" onclick="endSessionClass(${s.id})">End</button>`;
  } else {
    statusHtml = held ? `<span class="grade-chip late">Ended</span>` : `<span class="s" style="color:var(--muted)">Scheduled</span>`;
    if (canManage) actions += `<button class="btn btn-teal btn-sm" onclick="startSessionClass(${s.id})">&#127909; ${held ? 'Restart' : 'Start'} class</button>`;
  }
  if (held && canManage) actions += `<button class="btn btn-ghost btn-sm" onclick="openAttendanceSheet(${s.id})">Attendance</button>`;
  if (canManage) actions += `<button class="btn btn-danger btn-sm" onclick="del('/api/sessions/${s.id}','class')">Remove</button>`;

  let attLine = '';
  if (held) {
    if (canManage && s.attendance_summary) attLine = `<div class="s" style="color:var(--muted)">${s.attendance_summary.present} present &middot; ${s.attendance_summary.absent} absent</div>`;
    else if (isStudent) attLine = `<div class="s">${s.me_present ? '<span style="color:var(--ok)">&#10003; You attended</span>' : '<span style="color:var(--danger)">You were absent</span>'}</div>`;
  }

  return `<div class="list-row">
    <div class="when">${fmtDate(s.session_date)}<small>${esc(s.start_time || '')}${s.end_time ? '&ndash;' + esc(s.end_time) : ''}</small></div>
    <div class="grow"><div class="t">${s.week_no ? `Week ${s.week_no}: ` : ''}${esc(s.title)} ${statusHtml}</div>${attLine}</div>
    ${actions}
  </div>`;
}
async function startSessionClass(id) {
  if (!confirm('Start this class now? Every enrolled student is emailed instantly and the class runs inside EchoLens.')) return;
  try { await api(`/api/sessions/${id}/start`, { method: 'POST' }); toast('Class is live - students have been emailed.'); openCourse(bid(), 'Classes'); }
  catch (e) { toast(e.message, true); }
}
async function endSessionClass(id) {
  if (!confirm('End the class for everyone? Attendance is saved.')) return;
  try {
    await api(`/api/sessions/${id}/end`, { method: 'POST' });
    if (LIVE_SESSION_ID === id) leaveSessionClass();
    toast('Class ended - attendance saved.'); openCourse(bid(), 'Classes');
  } catch (e) { toast(e.message, true); }
}
// Joins the class INSIDE the portal: an embedded meeting room (Jitsi, open
// source), hosted in a floating widget that stays mounted across tab and
// page navigation. Join/leave is detected via the room's events; a
// heartbeat counts minutes for the attendance sheet.
async function joinSessionClass(id) {
  let info;
  try { info = await api(`/api/sessions/${id}/join`, { method: 'POST' }); }
  catch (e) { toast(e.message, true); return; }
  stopLiveHeartbeat(); // in case a different call was already open
  LIVE_SESSION_ID = id;
  const widget = $('liveCallWidget');
  const known = (CURRENT_BATCH && CURRENT_BATCH.sessions || []).find((s) => s.id === id);
  $('liveCallTitle').textContent = known ? known.title : 'Live class';
  $('liveCallSub').textContent = 'You are in the room - attendance marked.';
  $('jitsiBox').innerHTML = '<div class="empty">Loading the classroom&hellip;</div>';
  widget.style.display = '';
  widget.classList.toggle('expanded', LIVE_EXPANDED);
  // JaaS (8x8.vc) when the server has signed a room-scoped JWT for us -
  // otherwise fall back to the free, unauthenticated meet.jit.si server.
  const domain = info.provider === 'jaas' ? '8x8.vc' : 'meet.jit.si';
  const scriptSrc = info.provider === 'jaas' ? `https://8x8.vc/${info.app_id}/external_api.js` : 'https://meet.jit.si/external_api.js';
  const boot = () => {
    $('jitsiBox').innerHTML = '';
    const opts = {
      roomName: info.provider === 'jaas' ? `${info.app_id}/${info.room}` : info.room,
      parentNode: $('jitsiBox'),
      userInfo: { displayName: info.display_name },
      configOverwrite: { prejoinConfig: { enabled: false }, disableDeepLinking: true, startWithAudioMuted: ME.role === 'student' },
      interfaceConfigOverwrite: { SHOW_JITSI_WATERMARK: false, MOBILE_APP_PROMO: false },
    };
    if (info.jwt) opts.jwt = info.jwt;
    LIVE_API = new JitsiMeetExternalAPI(domain, opts);
    LIVE_API.addListener('videoConferenceLeft', () => leaveSessionClass());
  };
  if (window.JitsiMeetExternalAPI && window.JITSI_SCRIPT_SRC === scriptSrc) boot();
  else {
    const s = document.createElement('script');
    s.src = scriptSrc;
    s.onload = () => { window.JITSI_SCRIPT_SRC = scriptSrc; boot(); };
    s.onerror = () => { $('jitsiBox').innerHTML = '<div class="empty">Could not load the classroom - check your internet connection and try again.</div>'; };
    document.head.appendChild(s);
  }
  // Attendance minutes: one heartbeat per minute while in the room.
  LIVE_HEART = setInterval(() => { api(`/api/sessions/${id}/heartbeat`, { method: 'POST' }).catch(() => {}); }, 60000);
}
// Brings the floating widget to the user's attention without rejoining -
// used by the "In call" state on a class row when already connected.
function focusLiveCallWidget() {
  const widget = $('liveCallWidget');
  if (!widget || widget.style.display === 'none') return;
  widget.classList.add('flash');
  widget.scrollIntoView({ behavior: 'smooth', block: 'end' });
  setTimeout(() => widget.classList.remove('flash'), 900);
}
function toggleLiveCallSize() {
  LIVE_EXPANDED = !LIVE_EXPANDED;
  $('liveCallWidget').classList.toggle('expanded', LIVE_EXPANDED);
  $('liveCallToggleBtn').innerHTML = LIVE_EXPANDED ? '&#8600;' : '&#8599;';
}
function leaveSessionClass() {
  stopLiveHeartbeat();
  LIVE_SESSION_ID = null;
  const widget = $('liveCallWidget');
  if (widget) { widget.style.display = 'none'; widget.classList.remove('expanded'); }
  const box = $('jitsiBox'); if (box) box.innerHTML = '<div class="empty">Loading the classroom&hellip;</div>';
  toast('You left the class.');
  // Refresh the Classes tab's buttons back to "Join" if it's on screen.
  if (typeof CURRENT_BATCH !== 'undefined' && CURRENT_BATCH && document.querySelector('.tab.active')?.textContent === 'Classes') {
    renderClassesTab($('courseTabBody'));
  }
}
async function openAttendanceSheet(sessionId) {
  const d = await api(`/api/sessions/${sessionId}/attendance`);
  const present = d.sheet.filter((r) => r.present);
  openModal(`Attendance - ${d.class.title} (${fmtDate(d.class.date)})`, `
    <div class="s" style="margin-bottom:10px"><strong style="color:var(--ok)">${present.length} present</strong> &middot; <strong style="color:var(--danger)">${d.sheet.length - present.length} absent</strong> of ${d.sheet.length} enrolled</div>
    <div style="max-height:56vh;overflow-y:auto"><table class="tbl">
      <tr><th>Student</th><th>Reg no</th><th>Status</th><th>Joined</th><th>Minutes</th></tr>
      ${d.sheet.map((r) => `<tr>
        <td>${esc(r.name)}</td><td class="mono">${esc(r.reg_no || '—')}</td>
        <td>${r.present ? '<span class="grade-chip ok">Present</span>' : '<span class="grade-chip late">Absent</span>'}</td>
        <td class="s">${r.joined_at ? esc(r.joined_at.slice(11, 16)) : '—'}</td><td>${r.present ? r.minutes + 'm' : '—'}</td></tr>`).join('')}
    </table></div>`, true);
}

/* -------------------------------- QUIZZES -------------------------------- */
let QUIZ_TICK = null;
async function renderQuizzesTab(body) {
  if (QUIZ_TICK) { clearInterval(QUIZ_TICK); QUIZ_TICK = null; }
  body.innerHTML = '<div class="empty">Loading quizzes&hellip;</div>';
  const d = await api(`/api/batches/${bid()}/quizzes`);

  if (isStaff()) {
    body.innerHTML = `
      ${d.can_manage ? `<div class="card"><div class="card-body" style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
        <div style="flex:1;min-width:220px"><div class="t" style="font-weight:700">Pop a quiz any time - even mid-class</div>
        <div class="s" style="color:var(--muted)">A quiz is only takeable while its window is open. Close it, and nobody can access it until you reopen.</div></div>
        <button class="btn btn-primary" onclick="formQuizBuilder()">+ New quiz</button>
      </div></div>` : ''}
      <div class="card"><div class="card-head"><h3>Quizzes (${d.quizzes.length})</h3></div>
      <div class="card-body tight">${d.quizzes.length ? d.quizzes.map((q) => `
        <div class="list-row" style="padding:12px 4px">
          <div class="grow">
            <div class="t">${esc(q.title)} ${q.open ? '<span class="live-pill">OPEN</span>' : '<span class="closed-pill">Closed</span>'}</div>
            <div class="s" style="color:var(--muted)">${q.questions.length} questions &middot; ${q.duration_min} min window &middot; ${q.points} gems max${q.allow_ide ? ' &middot; &#128187; practice IDE on' : ''} &middot; ${q.attempts} attempt${q.attempts === 1 ? '' : 's'}${q.open ? ` &middot; closes ${esc(new Date(q.closes_at).toLocaleTimeString().slice(0, 5))}` : ''}</div>
          </div>
          <button class="btn btn-ghost btn-sm" onclick="openQuizResults(${q.id})">Results</button>
          ${d.can_manage ? (q.open
            ? `<button class="btn btn-danger btn-sm" onclick="quizAction(${q.id},'close')">Close now</button>`
            : `<button class="btn btn-teal btn-sm" onclick="openQuizWindow(${q.id},${q.duration_min})">Open</button>
               <button class="btn btn-danger btn-sm" onclick="delQuiz(${q.id})">&times;</button>`) : ''}
        </div>`).join('') : '<div class="empty">No quizzes yet - create one and open it during class.</div>'}</div></div>`;
    return;
  }

  // Student view: only open quizzes are visible; closed ones vanish.
  const active = d.quizzes;
  body.innerHTML = `
    ${active.length ? active.map((q) => q.taken ? `
      <div class="card"><div class="card-body" style="display:flex;gap:12px;align-items:center">
        <span class="grade-chip ok">&#10003; Done</span>
        <div class="grow"><div class="t" style="font-weight:700">${esc(q.title)}</div>
        <div class="s" style="color:var(--muted)">You scored ${q.my_score}%</div></div>
      </div></div>` : `
      <div class="card quiz-live" id="quizCard${q.id}"><div class="card-head"><h3>&#9889; ${esc(q.title)}</h3>
        <span class="quiz-timer" data-closes="${esc(q.closes_at)}">--:--</span></div>
      <div class="card-body">
        <p class="s" style="color:var(--muted);margin-bottom:12px">${q.questions.length} questions &middot; up to ${q.points} gems &middot; one attempt &middot; submits are locked when the timer hits zero.</p>
        ${q.allow_ide ? `
        <div class="quiz-ide" id="quizIde${q.id}">
          <div class="ide-toolbar" style="border-radius:12px 12px 0 0">
            <strong class="s">&#128187; Practice terminal</strong>
            <span class="s" style="color:var(--muted-2)">Try code here while you answer - nothing is submitted from this box.</span>
            <span style="flex:1"></span>
            <button type="button" class="btn btn-teal btn-sm" onclick="runQuizIde(${q.id})" id="quizRun${q.id}">Run</button>
          </div>
          <textarea id="quizCode${q.id}" class="code-editor ide-editor" style="min-height:120px" spellcheck="false" placeholder="# Scratchpad - run the snippets from the questions here."></textarea>
          <div id="quizTerm${q.id}"></div>
        </div>` : ''}
        <form id="quizForm${q.id}">
          ${q.questions.map((qq, i) => `
            <div class="quiz-q">
              <div class="t" style="margin-bottom:7px">${i + 1}. ${esc(qq.q)}</div>
              ${qq.options.map((o, oi) => `<label class="quiz-opt"><input type="radio" name="q${i}" value="${oi}" required><span>${esc(o)}</span></label>`).join('')}
            </div>`).join('')}
          <button class="btn btn-primary btn-block">Submit quiz</button>
        </form>
      </div></div>`).join('') : '<div class="card"><div class="empty">No quiz is open right now. When your teacher opens one, it appears here for a short window - keep an eye on this tab during class.</div></div>'}
    ${d.my_attempts && d.my_attempts.length ? `
      <div class="card"><div class="card-head"><h3>My quiz history</h3></div>
      <div class="card-body" style="padding:0;overflow-x:auto"><table class="tbl">
        <tr><th>Quiz</th><th>Score</th><th>Correct</th><th>Gems</th><th>Taken</th></tr>
        ${d.my_attempts.map((a) => `<tr><td>${esc(a.title || 'Quiz')}</td><td><strong>${a.score_pct}%</strong></td><td>${a.correct}/${a.total}</td><td>${gemChip(a.gems)}</td><td class="s">${esc((a.taken_at || '').slice(0, 16))}</td></tr>`).join('')}
      </table></div></div>` : ''}`;

  for (const q of active.filter((x) => !x.taken)) {
    if (q.allow_ide) { const ed = $(`quizCode${q.id}`); if (ed && window.EchoRun) EchoRun.wireEditor(ed); }
    const f = $(`quizForm${q.id}`);
    if (f) f.addEventListener('submit', async (e) => {
      e.preventDefault(); const btn = f.querySelector('button'); btn.disabled = true;
      const answers = q.questions.map((_, i) => Number((f.querySelector(`input[name="q${i}"]:checked`) || {}).value));
      try {
        const out = await api(`/api/quizzes/${q.id}/attempt`, { method: 'POST', body: JSON.stringify({ answers }) });
        toast(`Scored ${out.score_pct}% (${out.correct}/${out.total}) - ${out.gems} gems earned!`);
        drawCourseTab('Quizzes');
      } catch (err) { toast(err.message, true); btn.disabled = false; }
    });
  }
  // Countdown timers; when one hits zero the tab refreshes and the quiz vanishes.
  QUIZ_TICK = setInterval(() => {
    let expired = false;
    document.querySelectorAll('.quiz-timer').forEach((t) => {
      const left = new Date(t.dataset.closes) - new Date();
      if (left <= 0) { expired = true; return; }
      const m = Math.floor(left / 60000), s2 = Math.floor((left % 60000) / 1000);
      t.textContent = `${m}:${String(s2).padStart(2, '0')} left`;
      if (left < 60000) t.classList.add('urgent');
    });
    if (expired) { clearInterval(QUIZ_TICK); QUIZ_TICK = null; if ($('courseTabBody')) drawCourseTab('Quizzes'); }
  }, 1000);
}
// The quiz practice terminal: same Pyodide engine as the task IDE, but a
// pure scratchpad - nothing from it is submitted or graded.
async function runQuizIde(qid) {
  const btn = $(`quizRun${qid}`);
  const wrap = $(`quizTerm${qid}`);
  if (!wrap._term) wrap._term = EchoTerm.mount(wrap);
  const code = $(`quizCode${qid}`).value;
  if (!code.trim()) { toast('Write some code first.', true); return; }
  if (EchoRun.isRunning()) { EchoRun.cancel(); btn.innerHTML = 'Run'; return; }
  btn.innerHTML = 'Stop';
  try { await EchoRun.execute(code, { term: wrap._term, onStatus: () => {} }); }
  catch (e) { toast(e.message, true); }
  btn.innerHTML = 'Run';
}
function formQuizBuilder(prefill) {
  const qs = prefill || [{ q: '', options: ['', '', '', ''], answer: 0 }];
  openModal('New quiz', `
    <form id="f">
      <div class="form-grid">
        <label class="field"><span>Title</span><input name="title" required placeholder="e.g. Week 3 checkpoint"></label>
        <label class="field"><span>Window (minutes)</span><input name="duration_min" type="number" min="1" max="180" value="10"></label>
        <label class="field"><span>Max gems</span><input name="points" type="number" min="5" max="200" value="20"></label>
      </div>
      ${ME.ai_enabled ? `<div style="display:flex;gap:8px;align-items:center;margin-bottom:10px;flex-wrap:wrap">
        <input id="aiQuizTopic" placeholder="Topic, e.g. pandas groupby" style="flex:1;min-width:160px">
        <input id="aiQuizCount" type="number" min="1" max="15" value="5" style="width:64px">
        <button type="button" class="btn btn-ghost btn-sm" id="aiQuizBtn" onclick="aiFillQuiz()">Generate with AI</button>
      </div>` : ''}
      <label class="field" style="flex-direction:row;gap:8px;align-items:center;margin:2px 0 10px"><input name="allow_ide" type="checkbox" style="width:auto"><span>Include a practice IDE terminal - students can run Python beside the questions (great for "what does this code print?" quizzes)</span></label>
      <div id="quizQs"></div>
      <button type="button" class="btn btn-ghost btn-sm" onclick="addQuizQ()" style="margin:6px 0 12px">+ Add question</button>
      <p class="hint">The quiz is created CLOSED. Open it whenever you want (even mid-class); it locks itself when the window ends.</p>
      <button class="btn btn-primary btn-block">Create quiz</button>
    </form>`, true);
  window._quizQs = [];
  qs.forEach((q) => addQuizQ(q));
  $('f').addEventListener('submit', async (e) => {
    e.preventDefault(); const f = e.target; const btn = f.querySelector('button[type="submit"],button:not([type])'); btn.disabled = true; modalMsg('');
    const questions = collectQuizQs();
    if (!questions.length) { modalMsg('Add at least one complete question.'); btn.disabled = false; return; }
    try {
      await api(`/api/batches/${bid()}/quizzes`, { method: 'POST', body: JSON.stringify({ title: f.title.value, duration_min: f.duration_min.value, points: f.points.value, allow_ide: f.allow_ide.checked, questions }) });
      toast('Quiz created - open it when you are ready.'); closeModal(); drawCourseTab('Quizzes');
    } catch (err) { modalMsg(err.message); btn.disabled = false; }
  });
}
function addQuizQ(pre) {
  const i = window._quizQs.length;
  window._quizQs.push(true);
  const box = document.createElement('div');
  box.className = 'quiz-build';
  box.innerHTML = `
    <div style="display:flex;gap:8px;align-items:center">
      <strong class="s">Q${i + 1}</strong>
      <input class="qb-q" placeholder="Question text" value="${esc(pre ? pre.q : '')}" style="flex:1">
    </div>
    <div class="qb-opts">${[0, 1, 2, 3].map((oi) => `
      <label class="qb-opt"><input type="radio" name="qbAns${i}" value="${oi}"${(pre ? pre.answer : 0) === oi ? ' checked' : ''} title="Correct answer">
      <input class="qb-o" placeholder="Option ${oi + 1}" value="${esc(pre && pre.options[oi] != null ? pre.options[oi] : '')}"></label>`).join('')}</div>
    <p class="hint" style="margin:2px 0 0">Tick the radio next to the correct option.</p>`;
  $('quizQs').appendChild(box);
}
function collectQuizQs() {
  return [...document.querySelectorAll('.quiz-build')].map((b, i) => {
    const q = b.querySelector('.qb-q').value.trim();
    const options = [...b.querySelectorAll('.qb-o')].map((o) => o.value.trim()).filter(Boolean);
    const answer = Number((b.querySelector(`input[name="qbAns${i}"]:checked`) || {}).value) || 0;
    return { q, options, answer };
  }).filter((x) => x.q && x.options.length >= 2);
}
async function aiFillQuiz() {
  const topic = $('aiQuizTopic').value.trim();
  if (!topic) { toast('Give the AI a topic first.', true); return; }
  const btn = $('aiQuizBtn'); btn.disabled = true; btn.textContent = 'Generating...';
  try {
    const out = await api(`/api/batches/${bid()}/quizzes/generate`, { method: 'POST', body: JSON.stringify({ topic, count: $('aiQuizCount').value }) });
    $('quizQs').innerHTML = ''; window._quizQs = [];
    out.questions.forEach((q) => addQuizQ(q));
    modalMsg('AI questions loaded - review and fix anything before creating.', true);
  } catch (e) { modalMsg(e.message); }
  btn.disabled = false; btn.innerHTML = 'Generate with AI';
}
function openQuizWindow(id, def) {
  const mins = prompt('Open this quiz for how many minutes?', def || 10);
  if (mins == null) return;
  quizAction(id, 'open', { minutes: Number(mins) || def });
}
async function quizAction(id, action, body) {
  try {
    await api(`/api/quizzes/${id}/${action}`, { method: 'POST', body: JSON.stringify(body || {}) });
    toast(action === 'open' ? 'Quiz is OPEN - students see it right now and were emailed.' : 'Quiz closed - nobody can access it until you reopen.');
    drawCourseTab('Quizzes');
  } catch (e) { toast(e.message, true); }
}
async function delQuiz(id) {
  if (!confirm('Delete this quiz and all its attempts?')) return;
  try { await api(`/api/quizzes/${id}`, { method: 'DELETE' }); toast('Quiz deleted.'); drawCourseTab('Quizzes'); }
  catch (e) { toast(e.message, true); }
}
async function openQuizResults(id) {
  const d = await api(`/api/quizzes/${id}/results`);
  openModal(`Results - ${d.quiz.title}`, `
    <div style="max-height:56vh;overflow-y:auto"><table class="tbl">
      <tr><th>#</th><th>Student</th><th>Reg no</th><th>Score</th><th>Correct</th><th>Gems</th><th>Taken</th></tr>
      ${d.results.length ? d.results.map((r, i) => `<tr>
        <td>${i + 1}</td><td>${esc(r.name)}</td><td class="mono">${esc(r.reg_no || '—')}</td>
        <td><strong>${r.score_pct}%</strong></td><td>${r.correct}/${r.total}</td><td>${gemChip(r.gems)}</td><td class="s">${esc((r.taken_at || '').slice(5, 16))}</td></tr>`).join('') : '<tr><td colspan="7" class="empty">No attempts yet.</td></tr>'}
    </table></div>`, true);
}

/* ------------------------------ AT-RISK TAB ------------------------------ */
async function renderAtRiskTab(body) {
  body.innerHTML = '<div class="empty">Analysing the class&hellip;</div>';
  const d = await api(`/api/batches/${bid()}/at-risk`);
  const high = d.report.filter((r) => r.risk === 'high');
  const watch = d.report.filter((r) => r.risk === 'watch');
  body.innerHTML = `
    <div class="card"><div class="card-head"><h3>Students at risk</h3>
      <span class="s" style="color:var(--muted)"><strong style="color:var(--danger)">${high.length} high risk</strong> &middot; <strong style="color:var(--gold)">${watch.length} to watch</strong> &middot; ${d.report.length - high.length - watch.length} on track</span></div>
    <div class="card-body" style="padding:0;overflow-x:auto"><table class="tbl">
      <tr><th>Risk</th><th>Student</th><th>Reg no</th><th>Attendance</th><th>Tasks</th><th>Avg grade</th><th>Why flagged</th><th></th></tr>
      ${d.report.map((r) => `<tr class="risk-${r.risk}">
        <td>${r.risk === 'high' ? '<span class="risk-pill high">HIGH</span>' : r.risk === 'watch' ? '<span class="risk-pill watch">Watch</span>' : '<span class="risk-pill ok">OK</span>'}</td>
        <td>${esc(r.name)}</td><td class="mono">${esc(r.reg_no || '—')}</td>
        <td>${r.attendance ? `${r.attendance.attended}/${r.attendance.total} (${r.attendance.pct}%)` : '—'}</td>
        <td>${r.submitted}/${r.total_tasks}</td>
        <td>${r.avg_grade != null ? r.avg_grade + '%' : '—'}</td>
        <td class="s" style="max-width:260px">${r.reasons.length ? r.reasons.map(esc).join('<br>') : '<span style="color:var(--ok)">On track</span>'}</td>
        <td style="text-align:right"><button class="btn btn-ghost btn-sm" onclick="openStudentProfile(${r.id})">Profile</button></td>
      </tr>`).join('') || '<tr><td colspan="8" class="empty">No students enrolled yet.</td></tr>'}
    </table></div></div>
    <p class="hint" style="margin:10px 4px">Flags: attendance under 60%, more than 40% of tasks missing, average grade under 60%, or a week of inactivity. Two or more flags = high risk.</p>`;
}

/* --------------------- STUDENT SEARCH + FULL PROFILE --------------------- */
function filterPeopleTable(q) {
  q = q.trim().toLowerCase();
  document.querySelectorAll('#peopleTbl tr[data-search]').forEach((tr) => {
    tr.style.display = !q || tr.dataset.search.includes(q) ? '' : 'none';
  });
}
function wireStudentSearch() {
  const inp = $('globalStudentSearch'); const out = $('studentSearchOut');
  if (!inp) return;
  let t = null;
  inp.addEventListener('input', () => {
    clearTimeout(t);
    const q = inp.value.trim();
    if (q.length < 2) { out.innerHTML = ''; return; }
    t = setTimeout(async () => {
      try {
        const d = await api('/api/students/search?q=' + encodeURIComponent(q));
        out.innerHTML = d.students.length ? d.students.map((s) => `
          <button class="search-hit" onclick="openStudentProfile(${s.id})">
            ${avatarHtml(s.avatar, s.name, 30)}
            <span style="flex:1;text-align:left"><strong>${esc(s.name)}</strong> <span class="mono s" style="color:var(--muted)">${esc(s.reg_no || '')}</span><br>
            <span class="s" style="color:var(--muted-2)">${s.courses.map(esc).join(', ') || 'No courses'}</span></span>
            <span class="s" style="color:var(--teal-deep);font-weight:600">Open profile &rarr;</span>
          </button>`).join('') : '<div class="empty">No student matches that registration number or name.</div>';
      } catch (e) { out.innerHTML = `<div class="empty">${esc(e.message)}</div>`; }
    }, 250);
  });
}
async function openStudentProfile(id) {
  let d;
  try { d = await api(`/api/students/${id}/full`); }
  catch (e) { toast(e.message, true); return; }
  const s = d.student; const p = s.profile || {};
  const infoRows = Object.entries(p).map(([k, v]) => `<div class="kv"><span class="k">${esc(k.replace(/_/g, ' '))}</span><span>${esc(v)}</span></div>`).join('');
  openModal(`Student profile - ${s.name}`, `
    <div style="display:flex;gap:14px;align-items:center;margin-bottom:14px">
      ${avatarHtml(s.avatar, s.name, 64)}
      <div style="flex:1">
        <div style="font-size:17px;font-weight:700">${esc(s.name)} ${stagePill(s.stage)}</div>
        <div class="s" style="color:var(--muted)">Reg no <span class="mono">${esc(s.reg_no || '—')}</span> &middot; ${esc(s.email || s.username || 'no email')} &middot; member since ${esc(s.created_at)}</div>
        <div class="s" style="margin-top:4px">${gemChip(s.gems)} &middot; &#128293; ${s.streak}d streak (best ${s.best_streak}d) &middot; last active ${esc(s.last_active || 'never')}</div>
      </div>
    </div>
    <div class="pub-sec">Enrolled courses &amp; progress</div>
    ${s.courses.length ? s.courses.map((c) => `
      <div class="prof-course">
        <div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap">
          <strong>${esc(c.title)}</strong>
          <span class="s" style="color:var(--muted)">${esc(c.cohort)} &middot; ${esc(c.code || '')}</span>
        </div>
        <div class="prof-bar"><div class="prof-fill" style="width:${c.levels_total ? Math.round((c.level - 1) / c.levels_total * 100) : 0}%"></div></div>
        <div class="s" style="color:var(--muted);display:flex;gap:12px;flex-wrap:wrap;margin-top:4px">
          <span>${c.levels_total ? `Level ${c.level}/${c.levels_total}` : 'No quest'}${c.quest_title ? ' &middot; ' + esc(c.quest_title) : ''}${c.completed ? ' &middot; <strong style="color:var(--ok)">Completed &#10003;</strong>' : ''}</span>
          <span>${gemChip(c.gems)}</span>
          <span>Tasks: ${c.submitted} submitted, ${c.graded} graded${c.avg_grade != null ? ', avg ' + c.avg_grade + '%' : ''}</span>
          <span>${c.attendance ? 'Attendance ' + c.attendance.pct + '% (' + c.attendance.attended + '/' + c.attendance.total + ')' : 'No classes yet'}</span>
        </div>
      </div>`).join('') : `<div class="empty">${s.role === 'free' ? 'Open (free) account - not enrolled in a paid course. See free courses, hackathons and events below.' : 'Not enrolled in any course.'}</div>`}
    ${s.tracks && s.tracks.length ? `<div class="pub-sec">Free courses &amp; quests</div>${s.tracks.map((t) => `
      <div class="s" style="padding:4px 0">${esc(t.title)} &middot; ${t.graded}/${t.total} tasks graded${t.avg != null ? ', avg ' + t.avg + '%' : ''} &middot; ${t.gems} gems${t.passed ? ' &middot; <strong style="color:var(--ok)">Passed</strong>' : ''}</div>`).join('')}` : ''}
    ${s.hackathons && s.hackathons.length ? `<div class="pub-sec">Hackathons</div>${s.hackathons.map((h) => `
      <div class="s" style="padding:4px 0">${esc(h.title)} &middot; ${esc(h.status)}${h.submitted ? ' &middot; submitted' : ''}${h.score != null ? ' &middot; score ' + h.score + '%' : ''}</div>`).join('')}` : ''}
    ${s.events && s.events.length ? `<div class="pub-sec">Events</div>${s.events.map((e) => `
      <div class="s" style="padding:4px 0">${esc(e.title)} (${esc(e.kind)}) &middot; ${esc(e.status)}${e.submitted ? ' &middot; submitted' : ''}${e.score != null ? ' &middot; score ' + e.score + '%' : ''}</div>`).join('')}` : ''}
    ${s.challenges && s.challenges.length ? `<div class="pub-sec">Challenges</div>${s.challenges.map((c) => `
      <div class="s" style="padding:4px 0">${esc(c.title)} &middot; ${c.status === 'approved' ? 'Solved &middot; ' + c.gems + ' gems' : esc(c.status)}</div>`).join('')}` : ''}
    ${s.certificates.length ? `<div class="pub-sec">Certificates</div>${s.certificates.map((c) => `<div class="s" style="padding:4px 0">${esc(c.title)} <span class="mono" style="color:var(--muted)">${esc(c.serial)}</span> &middot; ${fmtDate(c.completion_date)} &middot; <a href="/cert?s=${esc(c.serial)}" target="_blank" rel="noopener">view</a></div>`).join('')}` : ''}
    ${s.badges && s.badges.length ? `<div class="pub-sec">Badges</div><div class="s">${s.badges.map((b) => esc(b.label || b.name || b)).join(' &middot; ')}</div>` : ''}
    <div class="pub-sec">Personal information</div>
    <div class="kv-grid">${infoRows || '<div class="s" style="color:var(--muted)">No details on file.</div>'}</div>`, true);
}

/* ------------------------------ CERTIFICATES ------------------------------ */
function formIssueCert() {
  const bd = CURRENT_BATCH.batch;
  const students = (CURRENT_BATCH.students || []);
  openModal('Issue a certificate', `
    <form id="f">
      <label class="field"><span>Student</span><select name="user_id" required>${students.map((s) => `<option value="${s.id}">${esc(s.name)} (${esc(s.reg_no || '')})</option>`).join('')}</select></label>
      <div class="form-grid">
        <label class="field"><span>Type</span><select name="kind"><option value="course">Course completion</option><option value="hackathon">Hackathon</option><option value="competition">Competition</option></select></label>
        <label class="field"><span>Completion date</span><input name="completion_date" type="date" value="${new Date().toISOString().slice(0, 10)}"></label>
      </div>
      <label class="field"><span>Course / hackathon / competition name</span><input name="title" required value="${esc(bd.title || bd.name)}"></label>
      <label class="field"><span>Detail line (optional)</span><input name="detail" placeholder="e.g. 8-week bootcamp &middot; Grade: A &middot; 94% attendance" value="Cohort: ${esc(bd.name)}"></label>
      <p class="hint">The certificate carries a QR code that anyone can scan to verify it, your signature as instructor, the CEO signature, and a one-click Add-to-LinkedIn button for the student. The student is emailed their certificate link.</p>
      <button class="btn btn-primary btn-block">Issue certificate</button></form>`);
  $('f').addEventListener('submit', async (e) => {
    e.preventDefault(); const f = e.target; const btn = f.querySelector('button'); btn.disabled = true; modalMsg('');
    try {
      const out = await api('/api/certificates/issue', { method: 'POST', body: JSON.stringify({ user_id: f.user_id.value, batch_id: bid(), kind: f.kind.value, title: f.title.value, completion_date: f.completion_date.value, detail: f.detail.value }) });
      modalMsg(`Issued - serial ${out.cert.serial}. The student was emailed.`, true);
      window.open(out.url, '_blank');
    } catch (err) { modalMsg(err.message); btn.disabled = false; }
  });
}
function formIssueAllCerts() {
  const bd = CURRENT_BATCH.batch;
  openModal('Issue certificates for the whole course', `
    <form id="f">
      <label class="field"><span>Certificate title</span><input name="title" required value="${esc(bd.title || bd.name)}"></label>
      <label class="field"><span>Completion date</span><input name="completion_date" type="date" value="${new Date().toISOString().slice(0, 10)}"></label>
      <label class="field" style="flex-direction:row;gap:8px;align-items:center"><input name="only_completed" type="checkbox" checked style="width:auto"><span>Only students who completed the full quest track</span></label>
      <p class="hint">Each student gets a QR-verified certificate and an email with their link. Untick the box to certify everyone enrolled.</p>
      <button class="btn btn-primary btn-block">Issue certificates</button></form>`);
  $('f').addEventListener('submit', async (e) => {
    e.preventDefault(); const f = e.target; const btn = f.querySelector('button'); btn.disabled = true; modalMsg('');
    try {
      const out = await api(`/api/batches/${bid()}/certificates/issue-all`, { method: 'POST', body: JSON.stringify({ title: f.title.value, completion_date: f.completion_date.value, only_completed: f.only_completed.checked }) });
      modalMsg(`Issued ${out.issued} certificate${out.issued === 1 ? '' : 's'}${out.skipped ? ` - skipped ${out.skipped} who have not completed the track` : ''}.`, true);
    } catch (err) { modalMsg(err.message); btn.disabled = false; }
  });
}
async function formCertSettings() {
  let s = { org: 'EchoLens Digital', ceo_name: 'Tahir Mehmood', tagline: '', ntn: '', cuin: '' };
  try { s = (await api('/api/admin/cert-settings')).settings; } catch {}
  openModal('Certificate settings', `
    <form id="f">
      <label class="field"><span>Official company name</span><input name="org" required value="${esc(s.org || '')}"></label>
      <label class="field"><span>Tagline (under the name)</span><input name="tagline" value="${esc(s.tagline || '')}"></label>
      <label class="field"><span>CEO full name</span><input name="ceo_name" value="${esc(s.ceo_name || '')}" placeholder="Appears as the typed signature on every certificate, contract and offer letter"></label>
      <div class="form-grid">
        <label class="field"><span>NTN</span><input name="ntn" value="${esc(s.ntn || '')}" placeholder="e.g. J372619"></label>
        <label class="field"><span>CUIN</span><input name="cuin" value="${esc(s.cuin || '')}" placeholder="e.g. 0342802"></label>
      </div>
      <p class="hint" style="margin:-4px 0 4px">The CEO signature is the name above, rendered in a script font on certificates, contracts and offer letters - no signature image is uploaded or used. NTN/CUIN print on every ambassador/instructor contract and offer letter.</p>
      <button class="btn btn-primary btn-block">Save settings</button></form>
    <p class="hint" style="margin-top:14px">Teachers upload their own signature from Profile &rarr; &#8942; &rarr; Certificate signature.</p>`);
  $('f').addEventListener('submit', async (e) => {
    e.preventDefault(); const f = e.target;
    try { await api('/api/admin/cert-settings', { method: 'POST', body: JSON.stringify({ org: f.org.value, tagline: f.tagline.value, ceo_name: f.ceo_name.value, ntn: f.ntn.value, cuin: f.cuin.value }) }); modalMsg('Settings saved.', true); }
    catch (err) { modalMsg(err.message); }
  });
}
// v24: certificates issued "in collaboration with" a named partner org
// (WebEra) - same typed-signature convention as the CEO above. Which
// certificates carry it lives with the course/event itself (see
// toggleBatchPartner and the event form's checkbox) so it travels through
// automatic issuance too; free/open tracks are static code, not DB records,
// so they get their own checklist right here instead.
async function toggleBatchPartner(bid_, current) {
  try {
    const out = await api(`/api/batches/${bid_}/partner`, { method: 'POST', body: JSON.stringify({ on: !current }) });
    toast(out.partner ? 'Marked as a WebEra collaboration - certificates from this course will carry both signatures.' : 'No longer a WebEra collaboration.');
    openCourse(bid_);
  } catch (err) { toast(err.message, true); }
}
async function formPartnerSettings() {
  let d = { partner: { name: '', ceo_name: '', logo_url: null }, partner_tracks: [], tracks: [] };
  try { d = await api('/api/admin/partner-settings'); } catch {}
  const p = d.partner;
  openModal('Certificate partner', `
    <form id="fPartner">
      <label class="field"><span>Partner organisation name</span><input name="name" required value="${esc(p.name || '')}"></label>
      <label class="field"><span>Partner CEO full name</span><input name="ceo_name" value="${esc(p.ceo_name || '')}" placeholder="Appears as the typed signature on collaboration certificates"></label>
      <p class="hint" style="margin:-4px 0 4px">Same convention as EchoLens's own CEO signature: the name above, rendered in a script font - no signature image is uploaded or used.</p>
      <button class="btn btn-primary btn-block">Save</button>
    </form>
    <div style="margin-top:16px;border-top:1px solid var(--line);padding-top:14px">
      <label class="field" style="margin-bottom:6px"><span>Partner logo</span></label>
      ${p.logo_url ? `<img src="${esc(p.logo_url)}" alt="${esc(p.name)} logo" style="height:42px;display:block;margin-bottom:8px">` : '<p class="hint" style="margin:0 0 8px">No logo uploaded yet.</p>'}
      <form id="fLogo" style="display:flex;gap:8px;align-items:center">
        <input type="file" name="file" accept=".png,.jpg,.jpeg,.svg" required style="flex:1">
        <button class="btn btn-teal btn-sm">Upload</button>
      </form>
    </div>
    <div style="margin-top:16px;border-top:1px solid var(--line);padding-top:14px">
      <div class="s" style="font-weight:700;color:var(--navy);margin-bottom:4px">Free courses in collaboration with ${esc(p.name || 'the partner')}</div>
      <p class="hint" style="margin:0 0 8px">Every certificate a student auto-earns from a checked course carries both signatures. (Paid courses toggle from that course's own menu; events toggle from the Events list.)</p>
      <div id="partnerTracksBox">${d.tracks.map((t) => `
        <label class="s" style="display:flex;gap:8px;align-items:center;padding:5px 0;cursor:pointer">
          <input type="checkbox" data-key="${esc(t.key)}" ${d.partner_tracks.includes(t.key) ? 'checked' : ''} onchange="togglePartnerTrack(this)" style="width:auto">
          ${esc(t.course_code || '')} - ${esc(t.title)}
        </label>`).join('') || '<p class="hint">No free courses yet.</p>'}</div>
    </div>`);
  $('fPartner').addEventListener('submit', async (e) => {
    e.preventDefault(); const f = e.target;
    try { await api('/api/admin/partner-settings', { method: 'POST', body: JSON.stringify({ name: f.name.value, ceo_name: f.ceo_name.value }) }); modalMsg('Saved.', true); }
    catch (err) { modalMsg(err.message); }
  });
  $('fLogo').addEventListener('submit', async (e) => {
    e.preventDefault(); const f = e.target; const btn = f.querySelector('button'); btn.disabled = true;
    try { await api('/api/admin/partner-settings/logo', { method: 'POST', body: new FormData(f) }); toast('Logo updated.'); formPartnerSettings(); }
    catch (err) { toast(err.message, true); btn.disabled = false; }
  });
}
async function togglePartnerTrack(input) {
  try { await api('/api/admin/partner-settings/track', { method: 'POST', body: JSON.stringify({ key: input.dataset.key, on: input.checked }) }); }
  catch (err) { toast(err.message, true); input.checked = !input.checked; }
}

/* --------------------------- LEVEL TOOLS (teacher) --------------------------- */
function formLevelDeadline(qid, current) {
  openModal('Level deadline', `
    <form id="f">
      <label class="field"><span>Deadline (end of day)</span><input name="deadline" type="date" value="${esc(current || '')}"></label>
      <p class="hint">Deadlines are set automatically to the end of each level's week when the track is installed - change them freely here. Students can still submit after the deadline, but late work loses 20% of its earned gems. The rule is shown on every task.</p>
      <button class="btn btn-primary btn-block">Save deadline</button></form>`);
  $('f').addEventListener('submit', async (e) => {
    e.preventDefault();
    try { await api(`/api/quests/${qid}`, { method: 'PATCH', body: JSON.stringify({ deadline: e.target.deadline.value }) }); toast('Deadline updated.'); closeModal(); openCourse(bid()); }
    catch (err) { modalMsg(err.message); }
  });
}
function formAddProblem(qid) {
  openModal('Add a task to this level', `
    <form id="f">
      <label class="field"><span>Task type</span><select name="type" onchange="document.getElementById('addProbHint').textContent = this.value === 'written' ? 'Written: the student explains the LOGIC in words and submits text or a PDF/text file - the compiler is hidden.' : 'Coding: the student solves it in the built-in compiler.'">
        <option value="code">Coding task (built-in compiler)</option>
        <option value="written">Written / logic problem (text or PDF answer)</option>
      </select></label>
      <p class="hint" id="addProbHint">Coding: the student solves it in the built-in compiler.</p>
      <label class="field"><span>Title</span><input name="title" required placeholder="e.g. Explain: why does this loop never end?"></label>
      <label class="field"><span>Problem statement</span><textarea name="description" required style="min-height:120px" placeholder="Describe the problem. For written tasks, ask the student to reason step by step."></textarea></label>
      <div class="form-grid">
        <label class="field"><span>Gems (points)</span><input name="points" type="number" min="10" max="1000" value="100"></label>
        <label class="field"><span>Difficulty</span><select name="difficulty"><option>Basic</option><option selected>Core</option><option>Boss</option></select></label>
      </div>
      <label class="field"><span>Solution guideline (teachers only)</span><textarea name="solution" style="min-height:70px"></textarea></label>
      <button class="btn btn-primary btn-block">Add task</button></form>`);
  $('f').addEventListener('submit', async (e) => {
    e.preventDefault(); const f = e.target; const btn = f.querySelector('button'); btn.disabled = true; modalMsg('');
    try {
      await api(`/api/quests/${qid}/problems`, { method: 'POST', body: JSON.stringify({ type: f.type.value, title: f.title.value, description: f.description.value, points: f.points.value, difficulty: f.difficulty.value, solution: f.solution.value }) });
      toast('Task added to the level.'); closeModal(); openCourse(bid());
    } catch (err) { modalMsg(err.message); btn.disabled = false; }
  });
}

/* ============================================================================
 * v12: EVENTS - the unified admin-generated system for quests, hackathons,
 * competitions and webinars: free or paid (payment screenshot verified by
 * the admin), inside the portal / on the open site / both, optional built-in
 * compiler (Python, C, C++, SQL, web) with datasets from URL, admin
 * documents, AI auto-grading (-10%), pass marks, automatic certificates,
 * and email announcements to portal / open / all audiences.
 * ========================================================================== */
const EV_KIND_LABEL = { quest: 'Quest', hackathon: 'Hackathon', competition: 'Competition', webinar: 'Webinar' };
const EV_LANG_LABEL = { none: 'No compiler', python: 'Python 3', c: 'C', cpp: 'C++', sql: 'SQL', web: 'HTML / CSS / JS' };
function evStatusBadge(st) {
  const map = { upcoming: ['Upcoming', 'var(--st-beam)'], live: ['LIVE', 'var(--danger)'], ended: ['Ended', 'var(--muted-2)'], closed: ['Closed', 'var(--muted-2)'] };
  const [t, c] = map[st] || [st, 'var(--muted)'];
  return `<span class="stage-pill" style="background:${c}">${t}</span>`;
}
async function renderEvents() {
  const el = $('view-events');
  el.innerHTML = '<div class="empty">Loading&hellip;</div>';
  const d = await api('/api/events');
  const adminBar = d.is_admin ? `<div class="card"><div class="card-body" style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
      <span class="s" style="color:var(--muted)">Create quests, hackathons, competitions and webinars from here - free or paid, inside the portal, on the open website, or both. Everything (fees, pass marks, AI grading, certificates, compiler, emails) is configured per event.</span>
      <span style="flex:1"></span>
      <button class="btn btn-ghost btn-sm" onclick="renderAnnouncementsAdmin()">Website announcements</button>
      <button class="btn btn-primary btn-sm" onclick="formEvent()">+ New event</button></div></div>` : '';
  el.innerHTML = `${adminBar}
    <div class="card"><div class="card-head"><h3>All events</h3></div><div class="card-body tight">
      ${d.events.length ? d.events.map((ev) => `
        <div class="list-row">
          <div class="when">${evStatusBadge(ev.status)}<small>${ev.starts_at ? esc(String(ev.starts_at).replace('T', ' ')) : (ev.duration_minutes ? 'About ' + ev.duration_minutes + ' minutes' : 'open-ended')}</small>${ev.deadline ? `<small style="color:var(--danger)">Due ${esc(evFmtDeadline(ev.deadline))}</small>` : ''}</div>
          <div class="grow">
            <div class="t"><span class="kbadge ${esc(ev.kind)}">${EV_KIND_LABEL[ev.kind] || ev.kind}</span> &nbsp;${esc(ev.title)}
              <span class="s" style="font-weight:500;color:var(--muted)">&middot; ${ev.entry === 'paid' ? 'PKR ' + ev.fee_pkr : 'Free'} &middot; ${ev.scope === 'both' ? 'Portal + open site' : ev.scope === 'open' ? 'Open site' : 'Portal only'}</span></div>
            <div class="s" style="color:var(--muted)">${(ev.problems || []).length ? (ev.problems.length + ' task' + (ev.problems.length > 1 ? 's' : '') + ' &middot; ') : ''}${ev.compiler !== 'none' ? EV_LANG_LABEL[ev.compiler] + ' compiler &middot; ' : ''}${ev.auto_grade ? 'Graded instantly &middot; ' : ''}${ev.auto_certificate ? 'Certificate at ' + ev.pass_mark + '%+ &middot; ' : ''}${ev.entries_count} registered</div>
            ${ev.my_entry ? `<div class="s" style="color:var(--ok)">Registered${ev.my_entry.payment_status === 'pending' ? ' - <span style="color:var(--gold)">payment being verified</span>' : ev.my_entry.payment_status === 'rejected' ? ' - <span style="color:var(--danger)">payment rejected, contact admin</span>' : ''}${ev.my_progress && ev.my_progress.passed ? ' &middot; <strong>PASSED ' + ev.my_progress.avg + '%</strong>' : ev.my_progress && ev.my_progress.avg != null ? ' &middot; avg ' + ev.my_progress.avg + '%' : ''}</div>` : ''}
          </div>
          <button class="btn btn-teal btn-sm" onclick="openEvent(${ev.id})">Open</button>
          ${d.is_admin ? `<button class="btn btn-ghost btn-sm" onclick="formEventDeadline(${ev.id},'${esc(ev.deadline || '')}')">${ev.deadline ? 'Change deadline' : 'Set deadline'}</button>
          <button class="btn btn-ghost btn-sm" onclick="toggleEventPartner(${ev.id},${ev.partner ? 'false' : 'true'})">${ev.partner ? '✓ WebEra collaboration' : 'Mark WebEra collaboration'}</button>
          <button class="btn btn-ghost btn-sm" onclick="toggleEvent(${ev.id},${ev.open ? 'false' : 'true'})">${ev.open ? 'Close' : 'Reopen'}</button>
          <button class="btn btn-danger btn-sm" onclick="delEvent(${ev.id})">Delete</button>` : ''}
        </div>`).join('') : '<div class="empty">No events yet' + (d.is_admin ? ' - create the first one.' : '. Watch this space.') + '</div>'}
    </div></div>`;
}
async function toggleEvent(id, open) {
  try { await api(`/api/admin/events/${id}`, { method: 'PATCH', body: JSON.stringify({ open }) }); renderEvents(); }
  catch (e) { toast(e.message, true); }
}
function evFmtDeadline(d) {
  try { return new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }); } catch { return d; }
}
function formEventDeadline(id, current) {
  openModal('Set deadline', `
    <form id="f">
      <label class="field"><span>Deadline</span><input name="deadline" type="date" value="${esc(current || '')}"></label>
      <p class="hint">Registration and submissions for this event close at the end of this date. Leave blank and save to remove the deadline.</p>
      <button class="btn btn-primary btn-block">Save deadline</button></form>`);
  $('f').addEventListener('submit', async (e) => {
    e.preventDefault(); const f = e.target; const btn = f.querySelector('button'); btn.disabled = true; modalMsg('');
    try { await api(`/api/admin/events/${id}`, { method: 'PATCH', body: JSON.stringify({ deadline: f.deadline.value || null }) }); toast('Deadline saved.'); closeModal(); renderEvents(); }
    catch (err) { modalMsg(err.message); btn.disabled = false; }
  });
}
async function delEvent(id) {
  if (!confirm('Delete this event and all its registrations and submissions?')) return;
  try { await api(`/api/admin/events/${id}`, { method: 'DELETE' }); toast('Event deleted.'); renderEvents(); }
  catch (e) { toast(e.message, true); }
}
async function toggleEventPartner(id, on) {
  try {
    await api(`/api/admin/events/${id}`, { method: 'PATCH', body: JSON.stringify({ partner: on }) });
    toast(on ? 'Marked as a WebEra collaboration - certificates from this event will carry both signatures.' : 'No longer a WebEra collaboration.');
    renderEvents();
  } catch (e) { toast(e.message, true); }
}

/* ------------------------------ create event ------------------------------ */
let EV_PROBS = [];
function formEvent() {
  EV_PROBS = [];
  openModal('New event', `
    <form id="evForm">
      <div class="form-grid">
        <label class="field"><span>Kind</span><select name="kind" onchange="evKindChanged(this.value)">
          <option value="quest">Quest (task ladder)</option><option value="hackathon">Hackathon</option>
          <option value="competition">Competition</option><option value="webinar">Webinar</option></select></label>
        <label class="field"><span>Where does it appear?</span><select name="scope">
          <option value="both">Portal + open website</option><option value="portal">Inside the portal only</option>
          <option value="open">Open website only</option></select></label>
      </div>
      <label class="field"><span>Title</span><input name="title" required placeholder="e.g. Python Basics Sprint Quest"></label>
      <label class="field"><span>Description, rules &amp; what to expect</span><textarea name="description" rows="3"></textarea></label>
      <div class="form-grid">
        <label class="field"><span>Entry</span><select name="entry" onchange="$('evPaid').style.display=this.value==='paid'?'':'none'">
          <option value="free">Free</option><option value="paid">Paid</option></select></label>
        <label class="field ev-timed"><span>Starts</span><input name="starts_at" type="datetime-local"></label>
        <label class="field ev-timed"><span>Ends</span><input name="ends_at" type="datetime-local"></label>
        <label class="field ev-quest"><span>Time to solve (minutes)</span><input name="duration_minutes" type="number" min="0" max="600" value="90" title="Open quests should be solvable in 60-90 minutes"></label>
        <label class="field"><span>Deadline (optional)</span><input name="deadline" type="date" title="Registration and submissions close at the end of this date - leave blank for no deadline"></label>
      </div>
      <div id="evPaid" style="display:none">
        <div class="form-grid">
          <label class="field"><span>Fee (PKR)</span><input name="fee_pkr" type="number" min="0" value="500"></label>
        </div>
        <label class="field"><span>Payment instructions (shown before the screenshot upload)</span><textarea name="pay_instructions" rows="2" placeholder="e.g. JazzCash 03XX-XXXXXXX (EchoLens). Send the fee, then upload a screenshot of the transaction - the admin verifies it before you can submit."></textarea></label>
      </div>
      <div class="form-grid">
        <label class="field"><span>Built-in compiler</span><select name="compiler">
          <option value="none">None (file / link submissions)</option><option value="python">Python 3</option>
          <option value="c">C</option><option value="cpp">C++</option><option value="java">Java</option><option value="sql">SQL</option><option value="web">HTML / CSS / JS</option></select></label>
        <label class="field"><span>Dataset URL (optional)</span><input name="dataset_url" type="url" placeholder="https://.../data.csv - mounted into the compiler"></label>
        <label class="field"><span>Pass mark (%)</span><input name="pass_mark" type="number" min="0" max="100" value="60"></label>
      </div>
      <div class="form-grid ev-comp">
        <label class="field"><span>1st prize gems</span><input name="prize1" type="number" min="0" value="300"></label>
        <label class="field"><span>2nd prize gems</span><input name="prize2" type="number" min="0" value="150"></label>
        <label class="field"><span>3rd prize gems</span><input name="prize3" type="number" min="0" value="75"></label>
      </div>
      <label class="field ev-webinar" style="display:none"><span>Meeting link (shown to registered participants)</span><input name="meeting_link" type="url" placeholder="https://meet.jit.si/echolens-webinar"></label>
      <div style="display:flex;gap:18px;flex-wrap:wrap;margin:4px 0 4px">
        <label class="s" style="display:flex;gap:7px;align-items:center;cursor:pointer"><input type="checkbox" name="auto_grade"> AI auto-grading (score carries a 10% reduction)</label>
        <label class="s" style="display:flex;gap:7px;align-items:center;cursor:pointer"><input type="checkbox" name="auto_certificate" checked> Automatic certificate at the pass mark</label>
        <label class="s" style="display:flex;gap:7px;align-items:center;cursor:pointer"><input type="checkbox" name="partner"> In collaboration with WebEra</label>
      </div>
      <p class="hint" style="margin:0 0 12px">Off by default - submissions wait for an admin to check and score them by hand from Events &rarr; Submissions. Turn AI auto-grading on only if you want scores generated instantly instead.</p>
      <div class="ev-probs">
        <div class="s" style="font-weight:700;color:var(--navy);margin-bottom:6px">Tasks / problems</div>
        <div id="evProbList"><div class="s" style="color:var(--muted)">No tasks yet - add at least one for quests and competitions.</div></div>
        <button type="button" class="btn btn-ghost btn-sm" style="margin-top:8px" onclick="evAddProb()">+ Add task</button>
      </div>
      <label class="field" style="margin-top:14px"><span>Email announcement</span><select name="notify">
        <option value="none">Don't send an email</option>
        <option value="portal">Email portal students</option>
        <option value="open">Email open (website) students</option>
        <option value="all">Email everyone - portal + open + leads</option></select></label>
      <button class="btn btn-primary btn-block">Create event</button>
    </form>`, true);
  evKindChanged('quest');
  $('evForm').addEventListener('submit', async (e) => {
    e.preventDefault(); const f = e.target; const btn = f.querySelector('button:not([type="button"])') || f.querySelector('button');
    const obj = {}; new FormData(f).forEach((v, k) => { if (v !== '') obj[k] = v; });
    obj.auto_grade = f.auto_grade.checked; obj.auto_certificate = f.auto_certificate.checked; obj.partner = f.partner.checked;
    obj.problems = obj.kind === 'webinar' ? [] : evReadProbs();
    if (['quest', 'competition'].includes(obj.kind) && !obj.problems.length) { modalMsg('Add at least one task for a quest or competition.'); return; }
    btn.disabled = true;
    try {
      const out = await api('/api/admin/events', { method: 'POST', body: JSON.stringify(obj) });
      toast(out.notified ? `Event created - announcement emailed to ${out.notified} people.` : 'Event created.');
      closeModal(); renderEvents();
    } catch (err) { modalMsg(err.message); btn.disabled = false; }
  });
}
function evKindChanged(kind) {
  document.querySelectorAll('.ev-timed').forEach((el) => el.style.display = kind === 'quest' ? 'none' : '');
  document.querySelectorAll('.ev-quest').forEach((el) => el.style.display = kind === 'quest' ? '' : 'none');
  document.querySelectorAll('.ev-comp').forEach((el) => el.style.display = ['hackathon', 'competition'].includes(kind) ? '' : 'none');
  document.querySelectorAll('.ev-webinar').forEach((el) => el.style.display = kind === 'webinar' ? '' : 'none');
  document.querySelectorAll('.ev-probs').forEach((el) => el.style.display = kind === 'webinar' ? 'none' : '');
}
function evAddProb() {
  const list = $('evProbList');
  if (list.querySelector('.s')) list.innerHTML = '';
  const row = document.createElement('div');
  row.className = 'ev-problem ev-prob-row';
  row.innerHTML = `
    <div class="form-grid" style="margin-bottom:6px">
      <label class="field" style="grid-column:span 2"><span>Task title</span><input class="ep-title" required placeholder="e.g. FizzBuzz with a twist"></label>
      <label class="field"><span>Difficulty</span><select class="ep-diff"><option>Easy</option><option>Medium</option><option>Hard</option></select></label>
      <label class="field"><span>Points</span><input class="ep-pts" type="number" min="5" max="500" value="100"></label>
    </div>
    <label class="field"><span>Task brief (what to build / solve, what is graded)</span><textarea class="ep-desc" rows="3" required></textarea></label>
    <details style="margin:6px 0 10px"><summary class="s" style="cursor:pointer;color:var(--muted);font-weight:600">Input / Output / Example (optional - shown on the task page)</summary>
      <div class="form-grid" style="margin-top:8px">
        <label class="field"><span>Input</span><textarea class="ep-input" rows="2" placeholder="e.g. A single integer N on one line."></textarea></label>
        <label class="field"><span>Output</span><textarea class="ep-output" rows="2" placeholder="e.g. Print the sum of digits of N."></textarea></label>
      </div>
      <div class="form-grid">
        <label class="field"><span>Example input</span><textarea class="ep-ex-input" rows="2" placeholder="e.g. 123"></textarea></label>
        <label class="field"><span>Example output</span><textarea class="ep-ex-output" rows="2" placeholder="e.g. 6"></textarea></label>
      </div>
    </details>
    <button type="button" class="btn btn-danger btn-sm" onclick="this.parentElement.remove()">Remove task</button>`;
  list.appendChild(row);
}
function evReadProbs() {
  return [...document.querySelectorAll('.ev-prob-row')].map((r) => ({
    title: r.querySelector('.ep-title').value.trim(),
    description: r.querySelector('.ep-desc').value.trim(),
    difficulty: r.querySelector('.ep-diff').value,
    points: r.querySelector('.ep-pts').value,
    input_spec: r.querySelector('.ep-input').value.trim(),
    output_spec: r.querySelector('.ep-output').value.trim(),
    example_input: r.querySelector('.ep-ex-input').value.trim(),
    example_output: r.querySelector('.ep-ex-output').value.trim(),
  })).filter((p) => p.title);
}

/* ------------------------------ event detail ------------------------------ */
let EV_CUR = null;
async function openEvent(id) {
  const d = await api(`/api/events/${id}`);
  EV_CUR = d;
  const ev = d.event;
  const isAdmin = d.is_admin;
  const probs = ev.problems || [];
  const filesHtml = (ev.files || []).length ? `
    <div class="s" style="margin:8px 0"><strong>Documents &amp; datasets:</strong> ${ev.files.map((f) => `<a href="${esc(f.url)}" target="_blank" rel="noopener">${esc(f.name)}</a>${isAdmin ? ` <button class="btn btn-ghost btn-sm" onclick="evDelFile(${ev.id},'${esc(f.name).replace(/'/g, '&#39;')}')" title="Remove">&times;</button>` : ''}`).join(' &middot; ')}</div>` : '';
  const regBtn = !d.my_entry && ['upcoming', 'live'].includes(ev.status) && ['free', 'student'].includes(ME.role)
    ? `<button class="btn btn-teal" onclick="formEventRegister(${ev.id})">Register${ev.entry === 'paid' ? ' - PKR ' + ev.fee_pkr : ' - free'}</button>` : '';
  const gateMsg = d.my_entry && !d.can_participate ? `<div class="task-status wait">${esc(d.participate_msg)}</div>` : '';
  const passedMsg = d.my_progress && d.my_progress.passed
    ? `<div class="task-status ok"><strong>Passed with ${d.my_progress.avg}%</strong>${ev.auto_certificate ? ' - your certificate is on your profile.' : ''}</div>` : '';
  const webinarHtml = ev.kind === 'webinar' && ev.meeting_link
    ? `<div class="task-status ok">You are in - <a href="${esc(ev.meeting_link)}" target="_blank" rel="noopener"><strong>Join the webinar</strong></a></div>` : '';
  openModal(ev.title, `
    <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:8px">
      <span class="kbadge ${esc(ev.kind)}">${EV_KIND_LABEL[ev.kind] || ev.kind}</span> ${evStatusBadge(ev.status)}
      <span class="s" style="color:var(--muted)">${ev.starts_at ? esc(String(ev.starts_at).replace('T', ' ')) + ' &rarr; ' + esc(String(ev.ends_at || '').replace('T', ' ')) : ev.duration_minutes ? '~' + ev.duration_minutes + ' minutes' : ''} &middot; ${ev.entry === 'paid' ? 'PKR ' + ev.fee_pkr : 'Free'} &middot; Pass mark ${ev.pass_mark}%${ev.auto_grade ? ' &middot; Graded instantly' : ''}${ev.auto_certificate ? ' &middot; auto certificate' : ''}</span></div>
    ${ev.description ? `<p class="s" style="white-space:pre-line;margin-bottom:10px">${esc(ev.description)}</p>` : ''}
    ${filesHtml}
    ${regBtn}${gateMsg}${passedMsg}${webinarHtml}
    ${d.can_participate && probs.length ? `
      <div class="pub-sec">Tasks</div>
      ${probs.map((p) => {
        const s = d.my_submissions[p.pid];
        return `<div class="ev-problem">
          <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
            <strong style="font-size:13.5px">${esc(p.title)}</strong>
            <span class="lc-diff ${esc(p.difficulty)}">${esc(p.difficulty)}</span>
            <span class="s" style="color:var(--muted)">${p.points} pts</span>
            <span style="flex:1"></span>
            ${s ? (s.score != null ? `<span class="grade-chip ok">Scored ${s.score}%</span>` : '<span class="grade-chip wait">Submitted - grading</span>') : '<span class="grade-chip none">Not submitted</span>'}
            <button class="btn btn-teal btn-sm" onclick="openEventTask(${ev.id},${p.pid})">${s ? 'Reopen' : 'Solve'}</button>
          </div>
          ${s && s.ai_feedback ? `<div class="s" style="margin-top:6px;color:var(--muted)">${esc(s.ai_feedback)}</div>` : ''}
        </div>`;
      }).join('')}` : ''}
    ${d.can_participate && !probs.length && ev.kind !== 'webinar' ? `
      <div class="pub-sec">Your submission</div>
      <div class="ev-problem">${eventSubmitFormHtml(ev, null, d.my_submissions[0])}</div>` : ''}
    ${d.board && d.board.length ? `
      <div class="pub-sec">Leaderboard</div>
      <div class="card-body tight" style="max-height:30vh;overflow-y:auto">
        ${d.board.map((b, i) => `<div class="lb-row" style="padding:9px 4px">
          <div class="lb-rank">${b.avg != null ? i + 1 : '·'}</div>
          <div class="lb-name">${esc(b.name)}<small>${b.tier === 'open' ? 'Open site' : 'Portal'} &middot; ${b.graded}/${b.submissions} graded</small></div>
          ${b.passed ? '<span class="grade-chip ok">passed</span>' : ''}
          <strong style="min-width:44px;text-align:right">${b.avg != null ? b.avg + '%' : '—'}</strong>
        </div>`).join('')}
      </div>` : ''}
    ${isAdmin ? adminEventPanel(d) : ''}`, true);
  wireAdminEventPanel(d);
}
function eventSubmitFormHtml(ev, pid, sub) {
  const hasCompiler = ev.compiler && ev.compiler !== 'none';
  return `
    ${sub ? `<div class="s" style="color:var(--muted);margin-bottom:8px">Last submitted ${esc((sub.submitted_at || '').slice(0, 16))}${sub.score != null ? ` &middot; scored <strong>${sub.score}%</strong>` : ' &middot; awaiting grade'}</div>` : ''}
    <form class="evSubForm" data-pid="${pid || ''}">
      ${hasCompiler ? '' : `<label class="field"><span>Your work as a file (any document - PDF, Word, notebook, zip...)</span><input name="file" type="file"></label>`}
      <label class="field"><span>Link to your project (optional${hasCompiler ? '' : ' if a file is attached'})</span><input name="link" type="url" placeholder="https://github.com/you/repo"></label>
      <label class="field"><span>Note (optional)</span><input name="note" maxlength="500"></label>
      <button class="btn btn-primary">${sub ? 'Resubmit' : 'Submit'}</button>
    </form>`;
}
async function openEventTask(eid, pid) {
  const d = EV_CUR && EV_CUR.event.id === eid ? EV_CUR : await api(`/api/events/${eid}`);
  const ev = d.event;
  const p = (ev.problems || []).find((x) => x.pid === pid) || { title: ev.title, description: ev.description, points: 100, difficulty: 'Easy' };
  const sub = d.my_submissions[pid] || null;
  const lang = ev.compiler && ev.compiler !== 'none' ? ev.compiler : null;
  openModal(`${esc(p.title)}`, `
    <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:8px">
      <span class="lc-diff ${esc(p.difficulty)}">${esc(p.difficulty)}</span>
      <span class="s" style="color:var(--muted)">${p.points} pts &middot; ${lang ? EV_LANG_LABEL[lang] : 'file / link submission'}${ev.auto_grade ? ' &middot; graded instantly' : ''}</span></div>
    <div class="s" style="white-space:pre-line;line-height:1.6;margin-bottom:12px">${esc(p.description)}</div>
    ${lang && lang !== 'web' ? `
      <div class="task-ide card" style="margin-bottom:12px">
        <div class="ide-toolbar">
          <span class="ide-pkgs">${EV_LANG_LABEL[lang]}${ev.dataset_url ? ' &middot; dataset auto-loaded from URL' : ''}</span>
          <span style="flex:1"></span>
          <button type="button" class="btn btn-ghost btn-sm" onclick="EV_TERM&&EV_TERM.clear()">Clear</button>
          <button type="button" class="btn btn-teal btn-sm" id="evRunBtn" onclick="runEventCode('${lang}',${eid})">Run</button>
        </div>
        <textarea id="evCode" class="code-editor ide-editor" spellcheck="false" placeholder="${lang === 'sql' ? '-- Write your SQL here. CSV datasets are loaded as tables automatically.' : lang === 'c' ? '// Write your C solution here.\n#include <stdio.h>\nint main(){\n    printf(&quot;Hello EchoLens\\n&quot;);\n    return 0;\n}' : lang === 'cpp' ? '// Write your C++ solution here.' : '# Write your Python solution here.'}">${esc(sub && sub.code || '')}</textarea>
        <div class="ide-status-row"><span class="s" id="evRunStatus" style="color:var(--muted-2)">Ready.</span></div>
        <div id="evTerm"></div>
      </div>
      <form class="evSubForm" data-pid="${pid}" data-code="1">
        <label class="field"><span>Note (optional)</span><input name="note" maxlength="500"></label>
        <button class="btn btn-primary btn-block">${sub ? 'Resubmit editor code' : 'Submit editor code'}</button>
      </form>
      <details style="margin-top:10px"><summary class="s" style="cursor:pointer;color:var(--muted);font-weight:600">Or upload a file instead</summary>
        <form class="evSubForm" data-pid="${pid}" style="margin-top:8px">
          <label class="field"><span>Your work as a file</span><input name="file" type="file" required></label>
          <button class="btn btn-primary">Submit file</button>
        </form></details>`
    : eventSubmitFormHtml(ev, pid, sub)}
    ${sub && sub.ai_feedback ? `<div class="s" style="margin-top:10px;background:#F4FBF9;border:1px solid #B7E9DA;border-radius:10px;padding:10px 12px"><strong>Feedback:</strong> ${esc(sub.ai_feedback)}</div>` : ''}`, true);
  if (lang && lang !== 'web') {
    window.EV_TERM = EchoTerm.mount($('evTerm'));
    EchoRun.wireEditor($('evCode'));
  }
  wireEventSubForms(eid);
}
async function runEventCode(lang, eid) {
  const btn = $('evRunBtn'); const status = $('evRunStatus');
  const code = $('evCode').value;
  if (!code.trim()) { toast('Write some code first.', true); return; }
  if (EchoRun.isRunning()) { EchoRun.cancel(); btn.innerHTML = 'Run'; return; }
  btn.innerHTML = 'Stop';
  const files = [];
  const ev = EV_CUR && EV_CUR.event.id === eid ? EV_CUR.event : null;
  if (ev && ev.dataset_url) {
    try { status.textContent = 'Fetching dataset from URL...'; files.push(await EchoRun.fetchDataset(ev.dataset_url)); }
    catch (e) { window.EV_TERM.print('[Dataset: ' + e.message + ']\n'); }
  }
  for (const f of (ev && ev.files || [])) if (/\.(csv|tsv|txt|json)$/i.test(f.name)) files.push({ name: f.name, url: f.url });
  try { await EchoRun.executeAny(lang, code, { term: window.EV_TERM, files, onStatus: (t) => { status.textContent = t; } }); }
  catch (e) { status.textContent = e.message; }
  btn.innerHTML = 'Run';
}
function wireEventSubForms(eid) {
  document.querySelectorAll('.evSubForm').forEach((f) => f.addEventListener('submit', async (e) => {
    e.preventDefault(); const btn = f.querySelector('button'); btn.disabled = true; modalMsg('');
    const fd = new FormData(f);
    if (f.dataset.pid) fd.set('pid', f.dataset.pid);
    if (f.dataset.code) {
      const code = $('evCode').value;
      if (!code.trim()) { modalMsg('Write your solution in the editor first.'); btn.disabled = false; return; }
      fd.set('code', code);
      fd.set('language', (EV_CUR && EV_CUR.event.compiler) || 'python');
    }
    try {
      const out = await api(`/api/events/${eid}/submit`, { method: 'POST', body: fd });
      if (out.cert) toast(`Passed - certificate ${out.cert.serial} issued. Find it on your profile.`);
      else if (out.submission && out.submission.score != null) toast(`Graded instantly: ${out.submission.score}%.`);
      else toast('Submitted - it will be graded soon.');
      openEvent(eid);
    } catch (err) { modalMsg(err.message); btn.disabled = false; }
  }));
}
function formEventRegister(eid) {
  api(`/api/events/${eid}`).then((d) => {
    const ev = d.event;
    openModal(`Register: ${ev.title}`, `
      <form id="evReg">
        ${ev.entry === 'paid' ? `
          <p class="hint" style="margin:0 0 10px">${esc(ev.pay_instructions || `Send PKR ${ev.fee_pkr} to the academy's JazzCash / Easypaisa / bank account, take a screenshot of the transaction, and upload it below. The admin verifies the picture before you can participate.`)}</p>
          <label class="field"><span>Screenshot of your payment transaction (PNG / JPG)</span><input name="file" type="file" accept=".png,.jpg,.jpeg,.webp" required></label>` :
        '<p class="s" style="color:var(--muted);margin-bottom:10px">This event is free - register and you are in.</p>'}
        <button class="btn btn-primary btn-block">Register${ev.entry === 'paid' ? ' - upload payment proof' : ''}</button></form>`);
    $('evReg').addEventListener('submit', async (e) => {
      e.preventDefault(); const f = e.target; const btn = f.querySelector('button'); btn.disabled = true; modalMsg('');
      try {
        await api(`/api/events/${eid}/register`, { method: 'POST', body: new FormData(f) });
        toast(ev.entry === 'paid' ? 'Registered - your payment screenshot is being verified by the admin.' : 'Registered - good luck!');
        closeModal(); openEvent(eid);
      } catch (err) { modalMsg(err.message); btn.disabled = false; }
    });
  });
}

/* --------------------------- admin event panel --------------------------- */
function adminEventPanel(d) {
  const ev = d.event;
  return `
    <div class="pub-sec">Admin - registrations${ev.entry === 'paid' ? ' &amp; payment verification' : ''}</div>
    <div class="card-body tight" style="max-height:32vh;overflow-y:auto">
      ${(d.entries || []).map((e) => `
        <div class="list-row" style="padding:10px 4px">
          <div class="grow">
            <div class="t">${esc(e.name)} <span class="mono s" style="color:var(--muted)">${esc(e.reg_no || '')}</span> <span class="role-pill">${e.tier === 'open' ? 'Open site' : 'Portal'}</span></div>
            <div class="s" style="color:var(--muted)">${esc(e.email || 'no email')}${e.whatsapp ? ' &middot; WA ' + esc(e.whatsapp) : ''} &middot; ${esc((e.registered_at || '').slice(0, 16))}${e.progress && e.progress.avg != null ? ' &middot; avg ' + e.progress.avg + '%' + (e.progress.passed ? ' (passed)' : '') : ''}</div>
            ${ev.entry === 'paid' ? `<div class="s" style="margin-top:4px">Payment: <span class="pay-badge ${esc(e.payment_status)}">${{pending:'Pending verification',confirmed:'Confirmed',rejected:'Rejected',na:'Not required'}[e.payment_status] || esc(e.payment_status)}</span>
              ${e.payment_shot ? `<br><a href="${esc(e.payment_shot)}" target="_blank" rel="noopener"><img class="ev-shot" src="${esc(e.payment_shot)}" alt="payment screenshot"></a>` : ''}</div>` : ''}
          </div>
          ${ev.entry === 'paid' && e.payment_status === 'pending' ? `
            <button class="btn btn-teal btn-sm" onclick="evPay(${e.id},${ev.id},true)">Confirm</button>
            <button class="btn btn-danger btn-sm" onclick="evPay(${e.id},${ev.id},false)">Reject</button>` : ''}
        </div>`).join('') || '<div class="empty">No registrations yet.</div>'}
    </div>
    <div class="pub-sec">Admin - submissions</div>
    <div class="card-body tight" style="max-height:32vh;overflow-y:auto">
      ${(d.submissions || []).map((s) => `
        <div class="list-row" style="padding:10px 4px">
          <div class="grow">
            <div class="t">${esc(s.user_name)}${s.pid ? ' &middot; task ' + s.pid : ''} ${s.score != null ? `<span class="grade-chip ok">${s.score}%${s.graded_by === 'ai' ? ' AI' : ''}</span>` : '<span class="grade-chip wait">ungraded</span>'}</div>
            <div class="s" style="color:var(--muted)">${esc((s.submitted_at || '').slice(0, 16))}${s.language ? ' &middot; ' + esc(s.language) : ''}${s.note ? ' &middot; &ldquo;' + esc(s.note) + '&rdquo;' : ''}</div>
            ${s.code ? `<details><summary class="s" style="cursor:pointer;color:var(--teal-deep)">View code</summary><pre class="cred-box" style="white-space:pre-wrap;max-height:200px;overflow:auto">${esc(s.code)}</pre></details>` : ''}
            ${s.file_url ? `<a class="s" href="${esc(s.file_url)}" target="_blank" rel="noopener">${esc(s.file_name || 'File')}</a> ` : ''}
            ${s.link ? `<a class="s" href="${esc(s.link)}" target="_blank" rel="noopener">Project link</a>` : ''}
          </div>
          <button class="btn btn-ghost btn-sm" onclick="evScore(${s.id},${ev.id})">Score</button>
        </div>`).join('') || '<div class="empty">No submissions yet.</div>'}
    </div>
    <div style="display:flex;gap:10px;margin-top:14px;flex-wrap:wrap">
      <form id="evFileUp" style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
        <input name="file" type="file" required style="font-size:12.5px">
        <button class="btn btn-teal btn-sm">Attach document / dataset</button>
      </form>
    </div>`;
}
function wireAdminEventPanel(d) {
  const fu = $('evFileUp');
  if (fu) fu.addEventListener('submit', async (e) => {
    e.preventDefault(); const btn = fu.querySelector('button'); btn.disabled = true;
    try { await api(`/api/admin/events/${d.event.id}/files`, { method: 'POST', body: new FormData(fu) }); toast('Attached.'); openEvent(d.event.id); }
    catch (err) { toast(err.message, true); btn.disabled = false; }
  });
}
async function evPay(entryId, eid, confirm) {
  try { await api(`/api/admin/event-entries/${entryId}/payment`, { method: 'POST', body: JSON.stringify({ confirm }) }); toast(confirm ? 'Payment confirmed - the participant was emailed.' : 'Payment rejected - the participant was emailed.'); openEvent(eid); }
  catch (e) { toast(e.message, true); }
}
async function evScore(sid, eid) {
  const score = prompt('Score (0-100):'); if (score == null) return;
  const remarks = prompt('Feedback for the participant (optional):') || '';
  try {
    const out = await api(`/api/admin/event-submissions/${sid}/score`, { method: 'POST', body: JSON.stringify({ score, remarks }) });
    toast(out.cert ? `Scored - and certificate ${out.cert.serial} was issued automatically.` : `Scored. ${certGapMsg(out.progress, EV_CUR && EV_CUR.event)}`);
    openEvent(eid);
  } catch (e) { toast(e.message, true); }
}
// Explains, in one line, exactly why a graded submission did NOT issue a
// certificate yet - so "graded but no certificate" is never a mystery.
function certGapMsg(prog, ev) {
  if (!prog || !ev) return '';
  if (!ev.auto_certificate) return 'Automatic certificates are off for this event - turn them on when creating an event to auto-issue.';
  if (prog.graded < prog.total) return `${prog.graded}/${prog.total} tasks graded so far - the certificate issues once every task is graded.`;
  if (prog.avg != null && prog.avg < ev.pass_mark) return `Average ${prog.avg}% is below the ${ev.pass_mark}% pass mark needed for a certificate.`;
  return '';
}
async function evDelFile(eid, name) {
  if (!confirm('Remove this document from the event?')) return;
  try { await api(`/api/admin/events/${eid}/files/${encodeURIComponent(name)}`, { method: 'DELETE' }); openEvent(eid); }
  catch (e) { toast(e.message, true); }
}

/* ============================================================================
 * v12: ANALYTICS & LEADS - complete stats to monitor progress: totals,
 * sign-up graphs over time (daily / weekly / monthly / yearly), a segment
 * dropdown (everyone / portal / open / a specific course, batch or event),
 * the leads database (name, email, WhatsApp) with CSV download, and the
 * email composer for announcements, enrollments and discounts.
 * ========================================================================== */
let AN_STATE = { metric: 'signups', segment: 'all', granularity: 'daily', batch_id: '', event_id: '', from: '', to: '' };
async function renderAnalytics() {
  const el = $('view-admin-analytics');
  el.innerHTML = '<div class="empty">Loading analytics&hellip;</div>';
  const q = new URLSearchParams({ metric: AN_STATE.metric, segment: AN_STATE.segment, granularity: AN_STATE.granularity });
  if (AN_STATE.batch_id) q.set('batch_id', AN_STATE.batch_id);
  if (AN_STATE.event_id) q.set('event_id', AN_STATE.event_id);
  if (AN_STATE.from && AN_STATE.to) { q.set('from', AN_STATE.from); q.set('to', AN_STATE.to); }
  const d = await api('/api/admin/analytics?' + q.toString());
  const t = d.totals;
  el.innerHTML = `
    <div class="an-cards">
      ${[[t.total_signups, 'total sign-ups'], [t.portal_students, 'portal students'], [t.open_users, 'open (website) users'], [t.leads, 'leads collected'],
        [t.enrollments, 'course enrollments'], [t.event_registrations, 'event registrations'], [t.event_submissions, 'event submissions'], [t.certificates_issued, 'certificates issued']]
        .map(([n, l]) => `<div class="an-card"><div class="n">${n}</div><div class="l">${l}</div></div>`).join('')}
    </div>
    <div class="an-chart">
      <div class="an-controls">
        <select id="anMetric" onchange="anSet('metric',this.value)">
          <option value="signups"${AN_STATE.metric === 'signups' ? ' selected' : ''}>New sign-ups</option>
          <option value="enrollments"${AN_STATE.metric === 'enrollments' ? ' selected' : ''}>Course enrollments</option>
          <option value="event_registrations"${AN_STATE.metric === 'event_registrations' ? ' selected' : ''}>Event registrations</option>
          <option value="event_submissions"${AN_STATE.metric === 'event_submissions' ? ' selected' : ''}>Event submissions</option>
          <option value="quest_submissions"${AN_STATE.metric === 'quest_submissions' ? ' selected' : ''}>Quest submissions</option>
          <option value="leads"${AN_STATE.metric === 'leads' ? ' selected' : ''}>New leads</option>
        </select>
        ${AN_STATE.metric === 'signups' ? `<select id="anSeg" onchange="anSet('segment',this.value)">
          <option value="all"${AN_STATE.segment === 'all' ? ' selected' : ''}>Everyone</option>
          <option value="portal"${AN_STATE.segment === 'portal' ? ' selected' : ''}>Portal students</option>
          <option value="open"${AN_STATE.segment === 'open' ? ' selected' : ''}>Open (website) students</option>
        </select>` : ''}
        ${['enrollments', 'quest_submissions'].includes(AN_STATE.metric) ? `<select onchange="anSet('batch_id',this.value)">
          <option value="">All courses</option>
          ${d.batches.map((b) => `<option value="${b.id}"${String(AN_STATE.batch_id) === String(b.id) ? ' selected' : ''}>${esc(b.name)}</option>`).join('')}
        </select>` : ''}
        ${['event_registrations', 'event_submissions'].includes(AN_STATE.metric) ? `<select onchange="anSet('event_id',this.value)">
          <option value="">All events</option>
          ${d.events.map((e) => `<option value="${e.id}"${String(AN_STATE.event_id) === String(e.id) ? ' selected' : ''}>${esc(e.title)} (${e.kind})</option>`).join('')}
        </select>` : ''}
        <span style="flex:1"></span>
        ${['daily', 'weekly', 'monthly', 'yearly'].map((g) => `<button class="gran-btn${AN_STATE.granularity === g ? ' active' : ''}" onclick="anSet('granularity','${g}')">${g[0].toUpperCase() + g.slice(1)}</button>`).join('')}
      </div>
      <div class="an-controls" style="margin-top:8px">
        <span class="s" style="color:var(--muted)">Date range (optional)</span>
        <input type="date" id="anFrom" value="${esc(AN_STATE.from)}" onchange="anSetRange()" style="padding:6px 10px;border:1.5px solid var(--line);border-radius:8px;font-size:12.5px">
        <span class="s" style="color:var(--muted)">to</span>
        <input type="date" id="anTo" value="${esc(AN_STATE.to)}" onchange="anSetRange()" style="padding:6px 10px;border:1.5px solid var(--line);border-radius:8px;font-size:12.5px">
        ${AN_STATE.from && AN_STATE.to ? `<button class="btn btn-ghost btn-sm" onclick="anClearRange()">Clear</button>` : ''}
        <span style="flex:1"></span>
        <a class="btn btn-ghost btn-sm" id="anDownloadCsv" download>Download CSV</a>
        <a class="btn btn-teal btn-sm" id="anDownloadPdf" download>Download PDF (letterhead)</a>
      </div>
      ${chartSvg(d.series)}
    </div>
    <div class="card" style="margin-top:18px"><div class="card-head"><h3>New student registrations</h3><span class="s" style="color:var(--muted)" id="regsCount"></span></div>
      <div class="card-body tight" id="regsBox"><div class="empty">Loading registrations&hellip;</div></div>
    </div>
    <div class="card"><div class="card-head"><h3>Email everyone - announcements, enrollments, discounts</h3></div>
      <div class="card-body" style="display:flex;align-items:center;gap:14px;flex-wrap:wrap">
        <p class="hint" style="margin:0;flex:1;min-width:220px">Compose and send email - with attachments and the optional direct registration link - from the dedicated Email Leads page. It also has manual lead entry, so you can add a contact and email them without them ever signing up.</p>
        <button class="btn btn-primary" onclick="show('admin-mailer')">Open Email Leads</button>
      </div></div>
    <div class="card"><div class="card-head"><h3>Leads database</h3>
      <a class="btn btn-teal btn-sm" href="/api/admin/leads.csv" download>Download CSV</a></div>
      <div class="card-body" style="padding-bottom:0"><input class="search-input" placeholder="Filter by name, email, or number..." oninput="filterLeads(this.value)"></div>
      <div class="card-body tight" id="leadsBox"><div class="empty">Loading leads&hellip;</div></div>
    </div>`;
  $('anDownloadCsv').href = '/api/admin/analytics.csv?' + q.toString();
  $('anDownloadPdf').href = '/api/admin/analytics.pdf?' + q.toString();
  loadLeads();
  loadRegistrations();
}
function anSet(k, v) { AN_STATE[k] = v; if (k === 'metric') { AN_STATE.batch_id = ''; AN_STATE.event_id = ''; } renderAnalytics(); }
function anSetRange() {
  const from = $('anFrom').value, to = $('anTo').value;
  if (!from || !to) return; // wait until both ends are picked before refetching
  if (from > to) { toast('Start date must be before the end date.', true); return; }
  AN_STATE.from = from; AN_STATE.to = to; renderAnalytics();
}
function anClearRange() { AN_STATE.from = ''; AN_STATE.to = ''; renderAnalytics(); }
let LEADS_CACHE = [];
async function loadLeads() {
  try {
    const d = await api('/api/admin/leads');
    LEADS_CACHE = d.leads;
    drawLeads(LEADS_CACHE, 'leadsBox');
  } catch (e) { $('leadsBox').innerHTML = `<div class="empty">${esc(e.message)}</div>`; }
}
function drawLeads(list, boxId) {
  $(boxId || 'leadsBox').innerHTML = list.length ? `
    <table class="lc-table"><thead><tr><th>Name</th><th>Email</th><th>WhatsApp</th><th>Source</th><th>Tier</th><th>Since</th></tr></thead><tbody>
      ${list.slice(0, 400).map((l) => `<tr style="cursor:default">
        <td>${esc(l.name || '—')}</td><td>${esc(l.email)}</td><td>${esc(l.whatsapp || '—')}</td>
        <td>${{'open-signup':'Open sign-up',google:'Google sign-in',open:'Open site',portal:'Portal',manual:'Added manually',newsletter:'Newsletter'}[l.source] || esc(l.source)}</td><td><span class="role-pill">${{open:'Open site',student:'Student',lead:'Lead'}[l.tier] || esc(l.tier)}</span></td><td class="s" style="color:var(--muted)">${esc((l.created_at || '').slice(0, 10))}</td>
      </tr>`).join('')}
    </tbody></table>${list.length > 400 ? `<p class="hint">Showing 400 of ${list.length} - download the CSV for the full list.</p>` : ''}`
    : '<div class="empty">No leads yet - they appear as soon as anyone signs in on the open website, or add one manually.</div>';
}
function filterLeads(q) {
  const s = q.trim().toLowerCase();
  drawLeads(!s ? LEADS_CACHE : LEADS_CACHE.filter((l) => [l.name, l.email, l.whatsapp].some((v) => String(v || '').toLowerCase().includes(s))), 'leadsBox');
}

/* ============================================================================
 * v22: EMAIL LEADS - a dedicated cold-mailing page: compose with optional
 * file attachments and the direct registration link, add contacts to the
 * leads database by hand, and see/search that database - all in one place,
 * off the Analytics page so it doesn't get lost among the charts.
 * ============================================================================ */
async function renderAdminMailer() {
  $('view-admin-mailer').innerHTML = `
    <div class="card"><div class="card-head"><h3>Compose email</h3><span class="s" style="color:var(--muted)">Sent from info@echolens.digital</span></div>
      <div class="card-body">
        <form id="mailerBlastForm">
          <div class="form-grid">
            <label class="field"><span>Audience</span><select name="audience">
              <option value="leads">Leads only - the database below</option>
              <option value="portal">Portal students</option>
              <option value="open">Open (website) students</option>
              <option value="all">Everyone - portal + open + leads</option></select></label>
            <label class="field" style="grid-column:span 2"><span>Subject</span><input name="subject" required placeholder="e.g. 25% early-bird discount - Summer 2026 cohort"></label>
          </div>
          <label class="field"><span>Message</span><textarea name="body" rows="6" required placeholder="Write the email exactly as recipients should read it."></textarea></label>
          <div class="form-grid">
            <label class="field" style="grid-column:span 2"><span>Attach documents or pictures (optional)</span>
              <input type="file" name="files" multiple accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.csv,.jpg,.jpeg,.png,.gif,.webp"></label>
          </div>
          <label class="s" style="display:flex;align-items:center;gap:8px;margin:4px 0 14px;color:var(--ink)">
            <input type="checkbox" name="registration_link" value="1" style="width:16px;height:16px;margin:0">
            Include the direct registration link (optional)
          </label>
          <button class="btn btn-primary">Send email</button>
        </form>
      </div></div>
    <div class="card"><div class="card-head"><h3>Add a lead manually</h3></div>
      <div class="card-body">
        <form id="mailerAddLeadForm">
          <div class="form-grid">
            <label class="field"><span>Name</span><input name="name" placeholder="Full name (optional)"></label>
            <label class="field"><span>Email</span><input name="email" type="email" required placeholder="name@example.com"></label>
            <label class="field"><span>WhatsApp</span><input name="whatsapp" placeholder="Number (optional)"></label>
          </div>
          <button class="btn btn-teal">Add lead</button>
        </form>
      </div></div>
    <div class="card"><div class="card-head"><h3>Leads database</h3>
      <a class="btn btn-teal btn-sm" href="/api/admin/leads.csv" download>Download CSV</a></div>
      <div class="card-body" style="padding-bottom:0"><input class="search-input" placeholder="Filter by name, email, or number..." oninput="filterMailerLeads(this.value)"></div>
      <div class="card-body tight" id="mailerLeadsBox"><div class="empty">Loading leads&hellip;</div></div>
    </div>`;
  $('mailerBlastForm').addEventListener('submit', async (e) => {
    e.preventDefault(); const f = e.target; const btn = f.querySelector('button'); btn.disabled = true;
    try {
      const out = await api('/api/admin/email-blast', { method: 'POST', body: new FormData(f) });
      const attach = out.attachments ? ` with ${out.attachments} attachment${out.attachments === 1 ? '' : 's'}` : '';
      toast(out.smtp ? `Email sent to ${out.sent} people${attach}.` : `Queued for ${out.sent} people${attach} - configure SMTP_* in the environment to actually send.`);
      f.reset(); btn.disabled = false;
    } catch (err) { toast(err.message, true); btn.disabled = false; }
  });
  $('mailerAddLeadForm').addEventListener('submit', async (e) => {
    e.preventDefault(); const f = e.target; const btn = f.querySelector('button'); btn.disabled = true;
    try {
      const obj = {}; new FormData(f).forEach((v, k) => { if (v !== '') obj[k] = v; });
      await api('/api/admin/leads', { method: 'POST', body: JSON.stringify(obj) });
      toast('Lead added.'); f.reset(); btn.disabled = false;
      loadMailerLeads();
    } catch (err) { toast(err.message, true); btn.disabled = false; }
  });
  loadMailerLeads();
}
let MAILER_LEADS_CACHE = [];
async function loadMailerLeads() {
  try {
    const d = await api('/api/admin/leads');
    MAILER_LEADS_CACHE = d.leads;
    drawLeads(MAILER_LEADS_CACHE, 'mailerLeadsBox');
  } catch (e) { $('mailerLeadsBox').innerHTML = `<div class="empty">${esc(e.message)}</div>`; }
}
function filterMailerLeads(q) {
  const s = q.trim().toLowerCase();
  drawLeads(!s ? MAILER_LEADS_CACHE : MAILER_LEADS_CACHE.filter((l) => [l.name, l.email, l.whatsapp].some((v) => String(v || '').toLowerCase().includes(s))), 'mailerLeadsBox');
}
/* Tiny dependency-free SVG line+bar chart. */
function chartSvg(series) {
  const W = 860, H = 260, P = 34;
  const n = series.labels.length;
  const max = Math.max(1, ...series.counts);
  const bw = (W - P * 2) / n;
  const y = (v) => H - P - (v / max) * (H - P * 2);
  const bars = series.counts.map((v, i) => `<rect x="${(P + i * bw + bw * 0.18).toFixed(1)}" y="${y(v).toFixed(1)}" width="${(bw * 0.64).toFixed(1)}" height="${(H - P - y(v)).toFixed(1)}" rx="3" fill="#0FBFA8" opacity="0.85"><title>${series.labels[i]}: ${v}</title></rect>`).join('');
  const pts = series.counts.map((v, i) => `${(P + i * bw + bw / 2).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  const gridLines = [0, 0.25, 0.5, 0.75, 1].map((f) => {
    const gy = y(max * f);
    return `<line x1="${P}" y1="${gy}" x2="${W - P}" y2="${gy}" stroke="#E7E4DC" stroke-width="1"/><text x="${P - 6}" y="${gy + 4}" text-anchor="end" font-size="10" fill="#98938A">${Math.round(max * f)}</text>`;
  }).join('');
  const step = Math.ceil(n / 10);
  const labels = series.labels.map((l, i) => i % step === 0 ? `<text x="${(P + i * bw + bw / 2).toFixed(1)}" y="${H - P + 16}" text-anchor="middle" font-size="9.5" fill="#98938A">${l.length > 7 ? l.slice(5) : l}</text>` : '').join('');
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="chart">${gridLines}${bars}<polyline points="${pts}" fill="none" stroke="#7C6CF5" stroke-width="2.2" stroke-linejoin="round"/>${labels}</svg>`;
}


/* ============================================================================
 * v12.3: WEBSITE ANNOUNCEMENTS - published by the admin, shown on the open
 * website's Announcements tab: new cohorts, hackathons, webinars, discounts.
 * ========================================================================== */
const ANN_KIND_LABEL = { cohort: 'New cohort', hackathon: 'Hackathon', webinar: 'Webinar', discount: 'Discount', info: 'Information' };
async function renderAnnouncementsAdmin() {
  const d = await api('/api/public/announcements');
  openModal('Website announcements', `
    <form id="annForm" style="margin-bottom:16px">
      <div class="form-grid">
        <label class="field"><span>Type</span><select name="kind">
          <option value="cohort">New cohort / registration</option><option value="hackathon">Hackathon</option>
          <option value="webinar">Webinar</option><option value="discount">Discount</option><option value="info">Information</option></select></label>
        <label class="field" style="grid-column:span 2"><span>Title</span><input name="title" required placeholder="e.g. August 2026 cohort - registration open"></label>
      </div>
      <label class="field"><span>Message</span><textarea name="body" rows="3" required placeholder="Write the announcement exactly as visitors should read it."></textarea></label>
      <div class="form-grid">
        <label class="field" style="grid-column:span 2"><span>Action link (optional)</span><input name="link" type="url" placeholder="https://"></label>
        <label class="field"><span>Link button label</span><input name="link_label" placeholder="e.g. Register now"></label>
      </div>
      <div style="display:flex;gap:16px;align-items:center;flex-wrap:wrap;margin-bottom:10px">
        <label class="s" style="display:flex;gap:7px;align-items:center;cursor:pointer"><input type="checkbox" name="pinned"> Pin to the top</label>
        <label class="s" style="display:flex;gap:7px;align-items:center">Email it to:
          <select name="notify" style="padding:6px 10px;border:1.5px solid var(--line);border-radius:8px">
            <option value="none">Nobody - website only</option><option value="portal">Portal students</option>
            <option value="open">Open students</option><option value="all">Everyone incl. leads</option></select></label>
      </div>
      <button class="btn btn-primary">Publish announcement</button>
    </form>
    <div class="pub-sec">Published (${d.announcements.length})</div>
    <div class="card-body tight" style="max-height:34vh;overflow-y:auto">
      ${d.announcements.map((a) => `
        <div class="list-row" style="padding:10px 4px">
          <div class="grow">
            <div class="t">${a.pinned ? '<span class="role-pill">Pinned</span> ' : ''}<span class="kbadge ${a.kind === 'webinar' ? 'webinar' : a.kind === 'hackathon' ? 'hackathon' : 'quest'}">${ANN_KIND_LABEL[a.kind] || a.kind}</span> ${esc(a.title)}</div>
            <div class="s" style="color:var(--muted)">${esc(a.body.slice(0, 120))}${a.body.length > 120 ? '…' : ''} · ${esc((a.created_at || '').slice(0, 10))}</div>
          </div>
          <button class="btn btn-ghost btn-sm" onclick="annPin(${a.id}, ${a.pinned ? 'false' : 'true'})">${a.pinned ? 'Unpin' : 'Pin'}</button>
          <button class="btn btn-danger btn-sm" onclick="annDelete(${a.id})">Delete</button>
        </div>`).join('') || '<div class="empty">Nothing published yet.</div>'}
    </div>`, true);
  $('annForm').addEventListener('submit', async (e) => {
    e.preventDefault(); const f = e.target; const btn = f.querySelector('button:not([type="button"])'); btn.disabled = true;
    const obj = {}; new FormData(f).forEach((v, k) => { if (v !== '') obj[k] = v; });
    obj.pinned = f.pinned.checked;
    try {
      await api('/api/admin/public-announcements', { method: 'POST', body: JSON.stringify(obj) });
      toast('Published on the open website.');
      renderAnnouncementsAdmin();
    } catch (err) { modalMsg(err.message); btn.disabled = false; }
  });
}
async function annPin(id, pinned) {
  try { await api(`/api/admin/public-announcements/${id}`, { method: 'PATCH', body: JSON.stringify({ pinned }) }); renderAnnouncementsAdmin(); }
  catch (e) { toast(e.message, true); }
}
async function annDelete(id) {
  if (!confirm('Delete this announcement from the website?')) return;
  try { await api(`/api/admin/public-announcements/${id}`, { method: 'DELETE' }); renderAnnouncementsAdmin(); }
  catch (e) { toast(e.message, true); }
}

/* ============================================================================
 * v12.3: NEW STUDENT REGISTRATIONS - submitted from the open website's
 * registration form; tracked here with contacted / challan sent / added to
 * course checkmarks and a note, purely for the academy's records.
 * ========================================================================== */
async function loadRegistrations() {
  const box = $('regsBox'); if (!box) return;
  try {
    const d = await api('/api/admin/registrations');
    const head = $('regsCount'); if (head) head.textContent = `${d.registrations.length} total · ${d.pending} awaiting contact`;
    box.innerHTML = d.registrations.length ? d.registrations.slice(0, 200).map((r) => `
      <div class="list-row" style="padding:12px 4px;align-items:flex-start">
        <div class="grow">
          <div class="t">${esc(r.name)} ${r.course_code ? `<span class="prob-chip" style="cursor:default">${esc(r.course_code)} ${esc(r.course_title || '')}</span>` : ''}</div>
          <div class="s" style="color:var(--muted)">${esc(r.email)} · WhatsApp ${esc(r.whatsapp)}${r.city ? ' · ' + esc(r.city) : ''} · ${esc((r.created_at || '').slice(0, 16))}</div>
          ${r.note ? `<div class="s" style="color:var(--muted)">Student note: ${esc(r.note)}</div>` : ''}
          <div class="s" style="display:flex;gap:16px;flex-wrap:wrap;margin-top:6px">
            <label style="display:flex;gap:6px;align-items:center;cursor:pointer"><input type="checkbox" ${r.status.contacted ? 'checked' : ''} onchange="regStatus(${r.id},'contacted',this.checked)"> Contacted</label>
            <label style="display:flex;gap:6px;align-items:center;cursor:pointer"><input type="checkbox" ${r.status.challan_sent ? 'checked' : ''} onchange="regStatus(${r.id},'challan_sent',this.checked)"> Challan sent</label>
            <label style="display:flex;gap:6px;align-items:center;cursor:pointer"><input type="checkbox" ${r.status.added_to_course ? 'checked' : ''} onchange="regStatus(${r.id},'added_to_course',this.checked)"> Added to course</label>
          </div>
          <div style="display:flex;gap:8px;margin-top:6px;align-items:center;flex-wrap:wrap">
            <input class="search-input" style="flex:1;min-width:200px;margin:0" placeholder="Internal note (e.g. Paid via JazzCash, batch B2)" value="${esc(r.admin_note || '')}" onchange="regNote(${r.id}, this.value)">
            <button class="btn btn-danger btn-sm" onclick="regDelete(${r.id})">Remove</button>
          </div>
        </div>
      </div>`).join('') : '<div class="empty">No registrations yet - they arrive from the website registration form.</div>';
  } catch (e) { box.innerHTML = `<div class="empty">${esc(e.message)}</div>`; }
}
async function regStatus(id, key, val) {
  try { await api(`/api/admin/registrations/${id}`, { method: 'PATCH', body: JSON.stringify({ status: { [key]: val } }) }); loadRegistrations(); }
  catch (e) { toast(e.message, true); }
}
async function regNote(id, note) {
  try { await api(`/api/admin/registrations/${id}`, { method: 'PATCH', body: JSON.stringify({ admin_note: note }) }); toast('Note saved.'); }
  catch (e) { toast(e.message, true); }
}
async function regDelete(id) {
  if (!confirm('Remove this registration from the records?')) return;
  try { await api(`/api/admin/registrations/${id}`, { method: 'DELETE' }); loadRegistrations(); }
  catch (e) { toast(e.message, true); }
}
