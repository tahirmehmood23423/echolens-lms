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
$('modal').addEventListener('click', (e) => { if (e.target === $('modal')) closeModal(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });
document.addEventListener('click', (e) => {
  document.querySelectorAll('.dd-menu.open').forEach((m) => { if (!m.parentElement.contains(e.target)) m.classList.remove('open'); });
});

/* ------------------------------ navigation ------------------------------ */
const TITLES = {
  overview: 'Overview', courses: 'My courses', course: 'Course', schedule: 'Calendar',
  leaderboard: 'Leaderboard', announcements: 'Announcements', settings: 'Settings',
  challenges: 'Challenges', copilot: 'AI Copilot', hackathons: 'Hackathons',
  events: 'Events', 'admin-analytics': 'Analytics & Leads',
  'admin-catalogue': 'Catalogue & new course', 'admin-users': 'People',
  assignments: 'Assignments', quizzes: 'Quizzes', progress: 'Progress',
  certificates: 'Certificates', messages: 'Messages', resources: 'Resources',
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
    events: renderEvents, 'admin-analytics': renderAnalytics,
    'admin-catalogue': renderCatalogue, 'admin-users': renderUsers,
    assignments: renderAssignments, quizzes: renderQuizzesGlobal, progress: renderProgress,
    certificates: renderCertificates, messages: renderMessages, resources: renderResources,
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
  if (ME.role === 'admin') document.querySelectorAll('.admin-only').forEach((el) => (el.style.display = ''));
  if (['admin', 'coordinator'].includes(ME.role)) document.querySelectorAll('.staff-only').forEach((el) => (el.style.display = ''));
  if (ME.ai_enabled) document.querySelectorAll('.teacher-only').forEach((el) => (el.style.display = ''));
  if (ME.role === 'student') {
    document.querySelectorAll('.student-only').forEach((el) => (el.style.display = ''));
    refreshMessageBadge();
    wireTopSearch();
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
  renderOverview();
  requireWhatsapp(); // v12: contact details are mandatory for every learner
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

/* ============================== OVERVIEW ============================== */
async function renderOverview() {
  const el = $('view-overview');
  el.innerHTML = '<div class="empty">Loading&hellip;</div>';
  const d = await api('/api/overview');

  if (ME.role === 'student' && d.gamify) { renderStudentOverview(el, d); return; }

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

/* -------------------------- student overview (v13) -------------------------- */
let DC_CD_TIMER = null;
async function renderStudentOverview(el, d) {
  const [coursesR, questsR, quizzesR, recR, challR] = await Promise.all([
    api('/api/my/courses'), api('/api/my/quests'), api('/api/my/quizzes'),
    api('/api/my/recommended'), api('/api/challenges').catch(() => ({ challenges: [], mine: {} })),
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
        <div class="card"><div class="card-body" style="text-align:center">
          <div style="font-weight:650;margin-bottom:6px">Need help?</div>
          <div class="s" style="color:var(--muted);margin-bottom:12px">Find answers, ask questions, and connect with peers.</div>
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

/* ============================= ASSIGNMENTS ============================= */
async function renderAssignments() {
  const el = $('view-assignments');
  el.innerHTML = '<div class="empty">Loading&hellip;</div>';
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
    menu.push(`<button class="danger" onclick="deleteBatch()">Delete this course</button>`);
  }

  const tabs = ['Quest', 'Live', 'Quizzes', 'Chat', 'Classes', 'Content', 'Leaderboard'];
  if (isStaff()) tabs.push('People', 'At-risk', 'Report');

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
  if (CHAT_TIMER) { clearInterval(CHAT_TIMER); CHAT_TIMER = null; }
  if (typeof QUIZ_TICK !== 'undefined' && QUIZ_TICK) { clearInterval(QUIZ_TICK); QUIZ_TICK = null; }
  if (typeof stopLiveHeartbeat === 'function' && tab !== 'Live') stopLiveHeartbeat();

  if (tab === 'Quest') { renderQuestTab(body); return; }
  if (tab === 'Live') { renderLiveTab(body); return; }
  if (tab === 'Quizzes') { renderQuizzesTab(body); return; }
  if (tab === 'At-risk') { renderAtRiskTab(body); return; }
  if (tab === 'Chat') { renderChatTab(body); return; }

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
      <label class="field"><span>New students - one per line as "Full Name" or "Full Name, email"</span><textarea name="names" placeholder="Ayesha Khan, ayesha@gmail.com&#10;Bilal Noor"></textarea></label>
      <p class="hint">Each gets a generated username, password, and unique registration number - shown once below. With an email, the credentials and registration number are also mailed to the student automatically.</p>
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
        out.created.map((c) => `<div class="cred-box">${esc(c.name)}<br>Reg no: <strong>${esc(c.reg_no)}</strong><br>Username: ${esc(c.username)}<br>Password: ${esc(c.password)}${c.emailed ? '<br><span style="color:var(--ok)">&#10003; credentials emailed to ' + esc(c.email) + '</span>' : ''}</div>`).join('');
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
    + '&organizationName=' + encodeURIComponent(org || 'EchoLens AI Academy')
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
    ['Coordinators', d.users.filter((u) => u.role === 'coordinator')],
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
    </div></div>` : ''}
    ${groups.map(([label, users]) => `
      <div class="card"><div class="card-head"><h3>${label} (${users.length})</h3></div>
        <div class="card-body" style="padding:0;overflow-x:auto"><table class="tbl">
          <tr><th>Name</th><th>Reg no</th><th>Username</th><th>Gems</th><th>Courses</th><th></th></tr>
          ${users.map((u) => `<tr>
            <td>${esc(u.name)}</td>
            <td class="mono">${esc(u.reg_no || '—')}</td>
            <td class="mono">${esc(u.username || '—')}</td>
            <td>${u.gems != null ? gemChip(u.gems).replace('gem-chip', 'gem-chip') : '—'}</td>
            <td class="s">${u.courses.map(esc).join(', ') || '—'}</td>
            <td style="text-align:right;white-space:nowrap">
              ${['student', 'free'].includes(u.role) ? `<button class="btn btn-teal btn-sm" onclick="openStudentProfile(${u.id})">View profile</button>` : ''}
              ${isAdmin ? `<button class="btn btn-ghost btn-sm" onclick="formResetPassword(${u.id},'${esc(u.name).replace(/'/g, '&#39;')}')">Reset password</button>
              ${u.role !== 'admin' ? `<button class="btn btn-danger btn-sm" onclick="delUser(${u.id},'${esc(u.name).replace(/'/g, '&#39;')}')">Delete</button>` : ''}` : ''}
            </td></tr>`).join('') || `<tr><td colspan="6" class="empty">None yet.</td></tr>`}
        </table></div></div>`).join('')}`;
  wireStudentSearch();
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
    box.innerHTML = `<div class="card"><div class="card-head"><h3>Your skill reports</h3><span class="s" style="color:var(--muted)">Written with AI, reviewed by your teacher</span></div>
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
    </div></div>
    ${d.can_manage ? `<div class="ide-toggle-strip">
      <span class="s">Built-in compiler for this course: <strong>${d.ide_enabled ? 'ON' : 'OFF'}</strong>${d.ide_enabled ? '' : ' - tasks use a clean written-answer workspace (right for UI/UX, graphics and no-code automation courses)'}</span>
      <button class="btn btn-ghost btn-sm" onclick="toggleCourseIde(${!d.ide_enabled})">${d.ide_enabled ? 'Turn compiler off' : 'Turn compiler on'}</button>
    </div>` : ''}`;

  QUEST_DATA = d; // cached for the task portal

  const map = `<div class="quest-map">${p.levels.map((l) => {
    const q = l.quest;
    const state = l.passed ? 'passed' : (l.unlocked ? 'current' : 'locked');
    const mySubFor = (pid) => d.my_subs[`${q.id}:${pid}`];
    const overdue = q.deadline && new Date() > new Date(q.deadline + 'T23:59:59');
    const dueChip = q.deadline
      ? `<span class="due-chip${overdue ? ' overdue' : ''}" title="Late submissions lose ${d.late_penalty_pct || 20}% of earned gems">&#9200; Due ${fmtDate(q.deadline)}${overdue ? ' &middot; past due' : ''}</span>`
      : '';
    return `<div class="quest-node ${state}" id="qn${q.id}">
      <div class="qgem"><div class="stone"></div></div>
      <div class="qbody">
        <div class="qhead" onclick="document.getElementById('qn${q.id}').classList.toggle('open')">
          <span class="lvl">W${q.week} &middot; LVL ${q.no}</span>
          <span class="qt">${esc(q.title)}<div class="qs">${esc(q.topic)}</div></span>
          ${dueChip}
          <span class="qstate ${state}">${l.passed ? 'Passed' : (l.unlocked ? 'Open' : 'Locked')}</span>
          ${d.can_manage ? `<button class="btn btn-ghost btn-sm" style="margin-right:6px" onclick="event.stopPropagation();formLevelDeadline(${q.id},'${esc(q.deadline || '')}')" title="Set or change this level's deadline">&#128197; Deadline</button>
          <button class="btn btn-ghost btn-sm" style="margin-right:6px" onclick="event.stopPropagation();formAddProblem(${q.id})" title="Add a coding or written problem to this level">+ Task</button>
          <button class="btn btn-ghost btn-sm" style="margin-right:10px" onclick="event.stopPropagation();remindLevel(${q.id})" title="Email students who have not finished this level">&#128276;</button>` : ''}
        </div>
        <div class="qproblems">
          ${q.problems.map((pr) => {
            const sub = isStudent ? mySubFor(pr.pid) : null;
            let chip = '';
            if (isStudent && sub) {
              chip = sub.grade != null
                ? `<span class="grade-chip ok" title="${sub.late ? 'Submitted late: ' + sub.late_deduction + ' gems deducted' : 'Graded by your teacher'}">&#10003; Graded ${sub.grade}% &middot; ${sub.gems} gems${sub.late ? ' &#9203;' : ''}</span>`
                : `<span class="grade-chip wait">&#9203; Submitted &middot; not graded yet${sub.late ? ' &middot; late' : ''}</span>`;
            } else if (isStudent) {
              chip = `<span class="grade-chip none">Not submitted</span>`;
            }
            return `<div class="qproblem qtopic" onclick="openTask(${q.id},${pr.pid})">
              <span class="qdiff ${esc(pr.difficulty)}">${esc(pr.difficulty)}</span>
              <div style="flex:1;min-width:0">
                <div class="t" style="font-size:13.5px">${pr.type === 'written' ? '<span class="type-badge written">&#128221; Written</span> ' : ''}${esc(pr.title)}</div>
                <div class="s" style="color:var(--muted)">${pr.points} gems${q.deadline ? ` &middot; due ${fmtDate(q.deadline)} &middot; late = &minus;${d.late_penalty_pct || 20}% gems` : ''}${sub && sub.shared_review ? ' &middot; <span style="color:var(--teal-deep)">AI feedback shared</span>' : ''}</div>
              </div>
              ${chip}
              <button class="btn btn-teal btn-sm" onclick="event.stopPropagation();openTask(${q.id},${pr.pid})">Open</button>
              ${d.can_manage ? `<button class="btn btn-ghost btn-sm" onclick="event.stopPropagation();formEditProblem(${q.id},${pr.pid})">Edit</button>` : ''}
              ${d.can_manage || ME.role === 'coordinator' ? `<button class="btn btn-ghost btn-sm" onclick="event.stopPropagation();openQuestSubs(${q.id},${pr.pid})">Submissions</button>` : ''}
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
/* ============================ TASK WORKSPACE ============================ */
// A full page per task: the assignment brief on one side, a professional
// editor + real terminal on the other. input() is interactive - the prompt
// appears in the terminal and the student answers right there. numpy,
// pandas, matplotlib, and scikit-learn load automatically from imports;
// matplotlib charts render below the output.
let QUEST_DATA = null;
let TASK_CTX = null; // { qid, pid, term }

function sharedReviewBox(sr) {
  if (!sr) return '';
  const rows = [['Key concepts you showed', sr.key_concepts], ['Things to fix', sr.mistakes], ['A better approach', sr.better_approach]]
    .filter(([, v]) => v)
    .map(([k, v]) => `<div style="margin-bottom:6px"><span style="font-weight:700;color:var(--navy)">${k}:</span> <span style="white-space:pre-line">${esc(v)}</span></div>`).join('');
  return `<div class="review-share-box"><div class="rsb-head">AI feedback - shared by your teacher</div>${rows}
    <div class="s" style="color:var(--muted-2)">Generated with AI and released by your instructor. Your grade always comes from your teacher.</div></div>`;
}

function backToQuest() { openCourse(bid()); }

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
   v11 FEATURES: live classes + attendance, pop quizzes, at-risk report,
   student search + full profiles, QR certificates, level tools.
   ============================================================================ */

/* ------------------------------ LIVE CLASSES ------------------------------ */
let LIVE_HEART = null;
let LIVE_API = null;
function stopLiveHeartbeat() {
  if (LIVE_HEART) { clearInterval(LIVE_HEART); LIVE_HEART = null; }
  if (LIVE_API) { try { LIVE_API.dispose(); } catch {} LIVE_API = null; }
}
async function renderLiveTab(body) {
  stopLiveHeartbeat();
  body.innerHTML = '<div class="empty">Loading live classes&hellip;</div>';
  const d = await api(`/api/batches/${bid()}/live`);
  const canManage = d.can_manage;
  const isStudent = ME.role === 'student';

  const activeCard = d.active ? `
    <div class="card live-card"><div class="card-body" style="display:flex;gap:14px;align-items:center;flex-wrap:wrap">
      <span class="live-dot"></span>
      <div style="flex:1;min-width:200px">
        <div class="t" style="font-size:16px;font-weight:700">${esc(d.active.title)}</div>
        <div class="s" style="color:var(--muted)">Live now &middot; started ${esc((d.active.started_at || '').slice(11, 16))} &middot; runs inside the portal${isStudent ? ' &middot; joining marks your attendance' : ''}</div>
      </div>
      <button class="btn btn-primary" onclick="joinLiveClass(${d.active.id})">&#127909; Join class</button>
      ${canManage ? `<button class="btn btn-danger btn-sm" onclick="endLiveClass(${d.active.id})">End class</button>` : ''}
    </div>
    ${canManage && d.live_attendance ? `<div class="card-body" style="border-top:1px solid var(--line)">
      <div class="s" style="font-weight:700;color:var(--navy);margin-bottom:6px">Live attendance &middot; ${d.live_attendance.filter((r) => r.present).length}/${d.live_attendance.length} present</div>
      <div class="att-grid">${d.live_attendance.map((r) => `<span class="att-chip ${r.present ? 'in' : 'out'}">${esc(r.name)}${r.present ? ` &middot; ${r.minutes}m` : ''}</span>`).join('')}</div>
      <p class="hint" style="margin:8px 0 0">Updates when you reopen this tab. Absent students are everyone enrolled who never joined.</p>
    </div>` : ''}</div>` : `
    <div class="card"><div class="card-body" style="display:flex;gap:14px;align-items:center;flex-wrap:wrap">
      <div style="flex:1;min-width:200px">
        <div class="t" style="font-weight:700">No class is live right now</div>
        <div class="s" style="color:var(--muted)">${canManage ? 'Start one and every enrolled student is emailed instantly. The class runs inside EchoLens - no Zoom or Meet links needed.' : 'When your teacher starts a class, a Join button appears here - joining marks your attendance automatically.'}</div>
      </div>
      ${canManage ? `<button class="btn btn-primary" onclick="startLiveClass()">&#127909; Start live class</button>` : ''}
    </div></div>`;

  const rateCard = isStudent && d.my_rate ? `
    <div class="card"><div class="card-body" style="display:flex;gap:16px;align-items:center">
      <div class="att-ring${d.my_rate.pct >= 75 ? ' good' : d.my_rate.pct >= 50 ? ' mid' : ' low'}">${d.my_rate.pct}%</div>
      <div><div class="t" style="font-weight:700">Your attendance</div>
      <div class="s" style="color:var(--muted)">${d.my_rate.attended} of ${d.my_rate.total} classes attended</div></div>
    </div></div>` : '';

  const pastCard = `
    <div class="card"><div class="card-head"><h3>Past classes</h3><span class="s" style="color:var(--muted)">${isStudent ? 'Your record per class' : 'Attendance per class - open any for the full sheet'}</span></div>
    <div class="card-body" style="padding:0;overflow-x:auto"><table class="tbl">
      <tr><th>Date</th><th>Class</th>${isStudent ? '<th>You</th>' : '<th>Present</th><th>Absent</th><th></th>'}</tr>
      ${d.past.length ? d.past.map((c) => `<tr>
        <td>${fmtDate(c.date)}</td><td>${esc(c.title)}</td>
        ${isStudent
          ? `<td>${c.me_present ? '<span class="grade-chip ok">&#10003; Present</span>' : '<span class="grade-chip late">Absent</span>'}</td>`
          : `<td><strong style="color:var(--ok)">${c.present}</strong>/${c.total}</td><td><strong style="color:var(--danger)">${c.absent}</strong></td>
             <td style="text-align:right"><button class="btn btn-ghost btn-sm" onclick="openAttendanceSheet(${c.id})">Attendance sheet</button></td>`}
      </tr>`).join('') : `<tr><td colspan="5" class="empty">No classes held yet.</td></tr>`}
    </table></div></div>`;

  body.innerHTML = activeCard + rateCard + pastCard + '<div id="liveStage"></div>';
}
async function startLiveClass() {
  const title = prompt('Class title (students see this):', 'Live class - ' + new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }));
  if (title == null) return;
  try {
    await api(`/api/batches/${bid()}/live/start`, { method: 'POST', body: JSON.stringify({ title }) });
    toast('Class is live - students have been emailed.');
    drawCourseTab('Live');
  } catch (e) { toast(e.message, true); }
}
async function endLiveClass(id) {
  if (!confirm('End the live class for everyone? Attendance is saved.')) return;
  try { await api(`/api/live/${id}/end`, { method: 'POST' }); stopLiveHeartbeat(); toast('Class ended - attendance saved.'); drawCourseTab('Live'); }
  catch (e) { toast(e.message, true); }
}
// Joins the class INSIDE the portal: an embedded meeting room (Jitsi, open
// source). Join/leave is detected via the room's events; a heartbeat counts
// minutes for the attendance sheet.
async function joinLiveClass(id) {
  let info;
  try { info = await api(`/api/live/${id}/join`, { method: 'POST' }); }
  catch (e) { toast(e.message, true); return; }
  const stage = $('liveStage');
  stage.innerHTML = `
    <div class="card live-stage"><div class="ide-toolbar">
      <span class="live-dot"></span><strong>Live class</strong>
      <span class="s" style="color:var(--muted)">You are in the room - attendance marked.</span>
      <span style="flex:1"></span>
      <button class="btn btn-danger btn-sm" onclick="leaveLiveClass()">Leave class</button>
    </div><div id="jitsiBox" class="jitsi-box"><div class="empty">Loading the classroom&hellip;</div></div></div>`;
  stage.scrollIntoView({ behavior: 'smooth' });
  const boot = () => {
    $('jitsiBox').innerHTML = '';
    LIVE_API = new JitsiMeetExternalAPI('meet.jit.si', {
      roomName: info.room,
      parentNode: $('jitsiBox'),
      userInfo: { displayName: info.display_name },
      configOverwrite: { prejoinConfig: { enabled: false }, disableDeepLinking: true, startWithAudioMuted: ME.role === 'student' },
      interfaceConfigOverwrite: { SHOW_JITSI_WATERMARK: false, MOBILE_APP_PROMO: false },
    });
    LIVE_API.addListener('videoConferenceLeft', () => leaveLiveClass());
  };
  if (window.JitsiMeetExternalAPI) boot();
  else {
    const s = document.createElement('script');
    s.src = 'https://meet.jit.si/external_api.js';
    s.onload = boot;
    s.onerror = () => { $('jitsiBox').innerHTML = '<div class="empty">Could not load the classroom - check your internet connection and try again.</div>'; };
    document.head.appendChild(s);
  }
  // Attendance minutes: one heartbeat per minute while in the room.
  LIVE_HEART = setInterval(() => { api(`/api/live/${id}/heartbeat`, { method: 'POST' }).catch(() => {}); }, 60000);
}
function leaveLiveClass() { stopLiveHeartbeat(); const s = $('liveStage'); if (s) s.innerHTML = ''; toast('You left the class.'); }
async function openAttendanceSheet(classId) {
  const d = await api(`/api/live/${classId}/attendance`);
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
      </div>`).join('') : '<div class="empty">Not enrolled in any course.</div>'}
    ${s.certificates.length ? `<div class="pub-sec">Certificates</div>${s.certificates.map((c) => `<div class="s" style="padding:4px 0">${esc(c.title)} <span class="mono" style="color:var(--muted)">${esc(c.serial)}</span> &middot; ${fmtDate(c.completion_date)} &middot; <a href="/cert?s=${esc(c.serial)}" target="_blank" rel="noopener">view</a></div>`).join('')}` : ''}
    ${s.badges && s.badges.length ? `<div class="pub-sec">Badges</div><div class="s">${s.badges.map((b) => esc(b.name || b)).join(' &middot; ')}</div>` : ''}
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
  let s = { org: 'EchoLens AI Academy', ceo_name: '', tagline: '' };
  try { s = (await api('/api/admin/cert-settings')).settings; } catch {}
  openModal('Certificate settings', `
    <form id="f">
      <label class="field"><span>Official company / academy name</span><input name="org" required value="${esc(s.org || '')}"></label>
      <label class="field"><span>Tagline (under the name)</span><input name="tagline" value="${esc(s.tagline || '')}"></label>
      <label class="field"><span>CEO full name</span><input name="ceo_name" value="${esc(s.ceo_name || '')}" placeholder="Appears under the CEO signature"></label>
      <button class="btn btn-primary btn-block">Save settings</button></form>
    <form id="sigForm" style="margin-top:14px">
      ${s.ceo_sig ? `<div style="margin-bottom:8px"><span class="s" style="color:var(--muted)">Current CEO signature:</span><br><img src="/api/public/cert-image/${esc(s.ceo_sig.split('/').pop())}" alt="CEO signature" style="max-height:64px;border:1px solid var(--line);border-radius:8px;padding:6px;background:#fff"></div>` : ''}
      <label class="field"><span>CEO signature image (PNG, transparent background)</span><input name="file" type="file" accept=".png,.jpg,.jpeg,.webp" required></label>
      <button class="btn btn-ghost btn-block">Upload CEO signature</button></form>
    <p class="hint" style="margin-top:10px">Teachers upload their own signature from Profile &rarr; &#8942; &rarr; Certificate signature. Every certificate shows the instructor signature + the CEO signature + the official name set here.</p>`);
  $('f').addEventListener('submit', async (e) => {
    e.preventDefault(); const f = e.target;
    try { await api('/api/admin/cert-settings', { method: 'POST', body: JSON.stringify({ org: f.org.value, tagline: f.tagline.value, ceo_name: f.ceo_name.value }) }); modalMsg('Settings saved.', true); }
    catch (err) { modalMsg(err.message); }
  });
  $('sigForm').addEventListener('submit', async (e) => {
    e.preventDefault(); const f = e.target; const btn = f.querySelector('button'); btn.disabled = true;
    try { await api('/api/admin/cert-settings/ceo-signature', { method: 'POST', body: new FormData(f) }); modalMsg('CEO signature uploaded.', true); }
    catch (err) { modalMsg(err.message); }
    btn.disabled = false;
  });
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
          <div class="when">${evStatusBadge(ev.status)}<small>${ev.starts_at ? esc(String(ev.starts_at).replace('T', ' ')) : (ev.duration_minutes ? 'About ' + ev.duration_minutes + ' minutes' : 'open-ended')}</small></div>
          <div class="grow">
            <div class="t"><span class="kbadge ${esc(ev.kind)}">${EV_KIND_LABEL[ev.kind] || ev.kind}</span> &nbsp;${esc(ev.title)}
              <span class="s" style="font-weight:500;color:var(--muted)">&middot; ${ev.entry === 'paid' ? 'PKR ' + ev.fee_pkr : 'Free'} &middot; ${ev.scope === 'both' ? 'Portal + open site' : ev.scope === 'open' ? 'Open site' : 'Portal only'}</span></div>
            <div class="s" style="color:var(--muted)">${(ev.problems || []).length ? (ev.problems.length + ' task' + (ev.problems.length > 1 ? 's' : '') + ' &middot; ') : ''}${ev.compiler !== 'none' ? EV_LANG_LABEL[ev.compiler] + ' compiler &middot; ' : ''}${ev.auto_grade ? 'Graded instantly &middot; ' : ''}${ev.auto_certificate ? 'Certificate at ' + ev.pass_mark + '%+ &middot; ' : ''}${ev.entries_count} registered</div>
            ${ev.my_entry ? `<div class="s" style="color:var(--ok)">Registered${ev.my_entry.payment_status === 'pending' ? ' - <span style="color:var(--gold)">payment being verified</span>' : ev.my_entry.payment_status === 'rejected' ? ' - <span style="color:var(--danger)">payment rejected, contact admin</span>' : ''}${ev.my_progress && ev.my_progress.passed ? ' &middot; <strong>PASSED ' + ev.my_progress.avg + '%</strong>' : ev.my_progress && ev.my_progress.avg != null ? ' &middot; avg ' + ev.my_progress.avg + '%' : ''}</div>` : ''}
          </div>
          <button class="btn btn-teal btn-sm" onclick="openEvent(${ev.id})">Open</button>
          ${d.is_admin ? `<button class="btn btn-ghost btn-sm" onclick="toggleEvent(${ev.id},${ev.open ? 'false' : 'true'})">${ev.open ? 'Close' : 'Reopen'}</button>
          <button class="btn btn-danger btn-sm" onclick="delEvent(${ev.id})">Delete</button>` : ''}
        </div>`).join('') : '<div class="empty">No events yet' + (d.is_admin ? ' - create the first one.' : '. Watch this space.') + '</div>'}
    </div></div>`;
}
async function toggleEvent(id, open) {
  try { await api(`/api/admin/events/${id}`, { method: 'PATCH', body: JSON.stringify({ open }) }); renderEvents(); }
  catch (e) { toast(e.message, true); }
}
async function delEvent(id) {
  if (!confirm('Delete this event and all its registrations and submissions?')) return;
  try { await api(`/api/admin/events/${id}`, { method: 'DELETE' }); toast('Event deleted.'); renderEvents(); }
  catch (e) { toast(e.message, true); }
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
          <option value="c">C</option><option value="cpp">C++</option><option value="sql">SQL</option><option value="web">HTML / CSS / JS</option></select></label>
        <label class="field"><span>Dataset URL (optional)</span><input name="dataset_url" type="url" placeholder="https://.../data.csv - mounted into the compiler"></label>
        <label class="field"><span>Pass mark (%)</span><input name="pass_mark" type="number" min="0" max="100" value="60"></label>
      </div>
      <div class="form-grid ev-comp">
        <label class="field"><span>1st prize gems</span><input name="prize1" type="number" min="0" value="300"></label>
        <label class="field"><span>2nd prize gems</span><input name="prize2" type="number" min="0" value="150"></label>
        <label class="field"><span>3rd prize gems</span><input name="prize3" type="number" min="0" value="75"></label>
      </div>
      <label class="field ev-webinar" style="display:none"><span>Meeting link (shown to registered participants)</span><input name="meeting_link" type="url" placeholder="https://meet.jit.si/echolens-webinar"></label>
      <div style="display:flex;gap:18px;flex-wrap:wrap;margin:4px 0 12px">
        <label class="s" style="display:flex;gap:7px;align-items:center;cursor:pointer"><input type="checkbox" name="auto_grade" checked> AI auto-grading (score carries a 10% reduction)</label>
        <label class="s" style="display:flex;gap:7px;align-items:center;cursor:pointer"><input type="checkbox" name="auto_certificate" checked> Automatic certificate at the pass mark</label>
      </div>
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
    obj.auto_grade = f.auto_grade.checked; obj.auto_certificate = f.auto_certificate.checked;
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
    toast(out.cert ? `Scored - and certificate ${out.cert.serial} was issued automatically.` : 'Scored.');
    openEvent(eid);
  } catch (e) { toast(e.message, true); }
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
let AN_STATE = { metric: 'signups', segment: 'all', granularity: 'daily', batch_id: '', event_id: '' };
async function renderAnalytics() {
  const el = $('view-admin-analytics');
  el.innerHTML = '<div class="empty">Loading analytics&hellip;</div>';
  const q = new URLSearchParams({ metric: AN_STATE.metric, segment: AN_STATE.segment, granularity: AN_STATE.granularity });
  if (AN_STATE.batch_id) q.set('batch_id', AN_STATE.batch_id);
  if (AN_STATE.event_id) q.set('event_id', AN_STATE.event_id);
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
      ${chartSvg(d.series)}
    </div>
    <div class="card" style="margin-top:18px"><div class="card-head"><h3>New student registrations</h3><span class="s" style="color:var(--muted)" id="regsCount"></span></div>
      <div class="card-body tight" id="regsBox"><div class="empty">Loading registrations&hellip;</div></div>
    </div>
    <div class="card"><div class="card-head"><h3>Email everyone - announcements, enrollments, discounts</h3></div>
      <div class="card-body">
        <form id="blastForm">
          <div class="form-grid">
            <label class="field"><span>Audience</span><select name="audience">
              <option value="portal">Portal students</option>
              <option value="open">Open (website) students</option>
              <option value="all">Everyone - portal + open + leads</option></select></label>
            <label class="field" style="grid-column:span 2"><span>Subject</span><input name="subject" required placeholder="e.g. 25% early-bird discount - Summer 2026 cohort"></label>
          </div>
          <label class="field"><span>Message</span><textarea name="body" rows="5" required placeholder="Write the announcement exactly as students should read it. It is sent from the company email address."></textarea></label>
          <button class="btn btn-primary">Send email</button>
        </form>
      </div></div>
    <div class="card"><div class="card-head"><h3>Leads database</h3>
      <a class="btn btn-teal btn-sm" href="/api/admin/leads.csv" download>Download CSV</a></div>
      <div class="card-body" style="padding-bottom:0"><input class="search-input" placeholder="Filter by name, email, or number..." oninput="filterLeads(this.value)"></div>
      <div class="card-body tight" id="leadsBox"><div class="empty">Loading leads&hellip;</div></div>
    </div>`;
  $('blastForm').addEventListener('submit', async (e) => {
    e.preventDefault(); const f = e.target; const btn = f.querySelector('button'); btn.disabled = true;
    try {
      const out = await api('/api/admin/email-blast', { method: 'POST', body: JSON.stringify({ subject: f.subject.value, body: f.body.value, audience: f.audience.value }) });
      toast(out.smtp ? `Email sent to ${out.sent} people.` : `Queued for ${out.sent} people - configure SMTP_* in the environment to actually send.`);
      f.reset(); btn.disabled = false;
    } catch (err) { toast(err.message, true); btn.disabled = false; }
  });
  loadLeads();
  loadRegistrations();
}
function anSet(k, v) { AN_STATE[k] = v; if (k === 'metric') { AN_STATE.batch_id = ''; AN_STATE.event_id = ''; } renderAnalytics(); }
let LEADS_CACHE = [];
async function loadLeads() {
  try {
    const d = await api('/api/admin/leads');
    LEADS_CACHE = d.leads;
    drawLeads(LEADS_CACHE);
  } catch (e) { $('leadsBox').innerHTML = `<div class="empty">${esc(e.message)}</div>`; }
}
function drawLeads(list) {
  $('leadsBox').innerHTML = list.length ? `
    <table class="lc-table"><thead><tr><th>Name</th><th>Email</th><th>WhatsApp</th><th>Source</th><th>Tier</th><th>Since</th></tr></thead><tbody>
      ${list.slice(0, 400).map((l) => `<tr style="cursor:default">
        <td>${esc(l.name || '—')}</td><td>${esc(l.email)}</td><td>${esc(l.whatsapp || '—')}</td>
        <td>${{'open-signup':'Open sign-up',google:'Google sign-in',open:'Open site',portal:'Portal'}[l.source] || esc(l.source)}</td><td><span class="role-pill">${{open:'Open site',student:'Student',lead:'Lead'}[l.tier] || esc(l.tier)}</span></td><td class="s" style="color:var(--muted)">${esc((l.created_at || '').slice(0, 10))}</td>
      </tr>`).join('')}
    </tbody></table>${list.length > 400 ? `<p class="hint">Showing 400 of ${list.length} - download the CSV for the full list.</p>` : ''}`
    : '<div class="empty">No leads yet - they appear as soon as anyone signs in on the open website.</div>';
}
function filterLeads(q) {
  const s = q.trim().toLowerCase();
  drawLeads(!s ? LEADS_CACHE : LEADS_CACHE.filter((l) => [l.name, l.email, l.whatsapp].some((v) => String(v || '').toLowerCase().includes(s))));
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
