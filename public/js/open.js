'use strict';

/* EchoLens Open (v12.3)
 * The public face of the academy:
 *  - Home, Courses (full catalogue) and Announcements are open to everyone.
 *  - Quests are organised inside their course, exactly like the LMS portal:
 *    every level and task is listed; the first week is open on paid courses,
 *    everything is open on free courses, the rest shows locked.
 *  - Solving and submitting needs a free account (Google or email, with the
 *    email checked for a real domain and, when SMTP is on, a mailed code).
 *  - Submissions are graded instantly, pay out gems, and free courses issue
 *    an automatic verified certificate on completion.
 *  - Registration for paid courses is an in-site form that lands in the
 *    admin portal for follow-up.
 */

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
async function api(path, opts = {}) {
  const isForm = opts.body instanceof FormData;
  const res = await fetch(path, { credentials: 'same-origin', headers: isForm ? {} : { 'Content-Type': 'application/json' }, ...opts });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401 && ME && path !== '/api/auth/me') {
    // The session expired or was signed out in another tab: recover cleanly
    // instead of leaving the person stuck behind a locked modal.
    ME = null;
    window.MODAL_LOCK = false;
    const closeBtn = $('modalBox') && $('modalBox').querySelector('.close');
    if (closeBtn) closeBtn.style.display = '';
    closeModal();
    drawUserBox();
    gate('Your session expired - sign in again to continue where you left off.');
    const e = new Error(data.error || 'Please sign in to continue.'); e.status = 401; e.handled = true; throw e;
  }
  if (!res.ok) { const e = new Error(data.error || 'Something went wrong.'); e.status = res.status; throw e; }
  return data;
}
function toast(text, isErr) {
  const t = $('toast');
  t.textContent = text; t.className = 'toast show' + (isErr ? ' err' : '');
  clearTimeout(t._h); t._h = setTimeout(() => (t.className = 'toast'), 3200);
}
function openModal(title, bodyHTML) {
  $('modalTitle').textContent = title;
  $('modalBody').innerHTML = bodyHTML;
  modalMsg('');
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

/* Difficulty names are unified on the open site: courses authored with
 * Basic / Core / Boss ladders display as Easy / Medium / Hard. */
const DIFF = (d) => ({ Basic: 'Easy', Core: 'Medium', Boss: 'Hard', Easy: 'Easy', Medium: 'Medium', Hard: 'Hard' }[d] || 'Easy');

/* ------------------------- card icons + stage data ------------------------- */
const ICONS = {
  chart: '<path d="M4 20V10M10 20V4M16 20v-8M22 20H2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" fill="none"/>',
  bot: '<rect x="4" y="8" width="16" height="11" rx="3" stroke="currentColor" stroke-width="1.8" fill="none"/><circle cx="9" cy="13.5" r="1.3" fill="currentColor"/><circle cx="15" cy="13.5" r="1.3" fill="currentColor"/><path d="M12 8V4m-3 0h6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
  spark: '<path d="M12 2v4M12 18v4M2 12h4M18 12h4M5 5l2.5 2.5M16.5 16.5 19 19M19 5l-2.5 2.5M7.5 16.5 5 19" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><circle cx="12" cy="12" r="3.2" stroke="currentColor" stroke-width="1.8" fill="none"/>',
  code: '<path d="m8 8-4 4 4 4M16 8l4 4-4 4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" fill="none"/>',
  gear: '<circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.8" fill="none"/><path d="M12 3v2.4M12 18.6V21M21 12h-2.4M5.4 12H3M18.4 5.6l-1.7 1.7M7.3 16.7l-1.7 1.7M18.4 18.4l-1.7-1.7M7.3 7.3 5.6 5.6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
  gem: '<path d="M6 3h12l4 6-10 12L2 9l4-6z" fill="currentColor" opacity=".92"/>',
  check: '<path d="m5 13 4 4L19 7" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>',
  target: '<circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.8" fill="none"/><circle cx="12" cy="12" r="4.5" stroke="currentColor" stroke-width="1.8" fill="none"/><circle cx="12" cy="12" r="1.2" fill="currentColor"/>',
  bulb: '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.45.9 1.1.9 1.8v.3h5.2v-.3c0-.7.3-1.35.9-1.8A6 6 0 0 0 12 3z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" fill="none"/>',
  chev: '<path d="m6 9 6 6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>',
  database: '<ellipse cx="12" cy="5.5" rx="7" ry="2.5" stroke="currentColor" stroke-width="1.7" fill="none"/><path d="M5 5.5V18c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5V5.5" stroke="currentColor" stroke-width="1.7" fill="none"/><path d="M5 12c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5" stroke="currentColor" stroke-width="1.7" fill="none"/>',
  refresh: '<path d="M4 12a8 8 0 0 1 14-5.3M20 12a8 8 0 0 1-14 5.3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" fill="none"/><path d="M18 3v4h-4M6 21v-4h4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" fill="none"/>',
  play: '<path d="M7 4.5v15l13-7.5-13-7.5z" fill="currentColor"/>',
  sparkle: '<path d="M12 3v3M12 18v3M4.5 12h3M16.5 12h3M6.5 6.5l2 2M15.5 15.5l2 2M17.5 6.5l-2 2M8.5 15.5l-2 2" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" fill="none"/><circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.7" fill="none"/>',
  clock: '<circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.8" fill="none"/><path d="M12 7v5l3.5 2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" fill="none"/>',
};
function pickIcon(title) {
  const t = (title || '').toLowerCase();
  if (/automation|n8n|make\.com|workflow/.test(t)) return 'gear';
  if (/prompt|chatgpt|generative|llm/.test(t)) return 'spark';
  if (/agent/.test(t)) return 'bot';
  if (/python|data|sql|analytics|power ?bi/.test(t)) return 'chart';
  if (/javascript|web|react|node|html|css|full-?stack/.test(t)) return 'code';
  return 'gem';
}
function tierBg(tier, isFree) {
  if (isFree) return 'linear-gradient(135deg,#0FBFA8,#0A9384)';       // free - teal
  if (tier === 'Specialist Track') return 'linear-gradient(135deg,#F59E0B,#EA580C)'; // specialist - amber/orange
  if (tier === 'Short Course') return 'linear-gradient(135deg,#2563EB,#0EA5E9)';     // short course - blue/sky
  return 'linear-gradient(135deg,#9333EA,#6D28D9)';                   // bootcamp - violet
}
const STAGE_FALLBACK = [{ key: 'spark', name: 'Spark', min: 0 }, { key: 'glow', name: 'Glow', min: 250 }, { key: 'beam', name: 'Beam', min: 700 }, { key: 'prism', name: 'Prism', min: 1400 }, { key: 'aurora', name: 'Aurora', min: 2400 }, { key: 'nova', name: 'Nova', min: 4000 }];

let ME = null;
let CATALOGUE = [];
let CAT_LINKS = null;
let CUR = null;          // { track, levels, progress } for the open course
let CUR_PROBLEM = null;  // { level, pid, problem }
let SV_TERM = null;
let SV_FILES = [];
let CUR_EVENT = null;
// "Live Tech Courses" and "Free Certified Courses" are the same underlying
// tab (both call openTab('courses')) with different starting filters, so
// openTab() can't tell them apart from the tab name alone - this tracks
// which nav entry should read as active while showing that tab, kept in
// sync by navCourses(), the #free deep link, and openCourse() (landing on
// a free course, however you got there, should highlight the free nav item).
let COURSE_NAV_MODE = 'live';
function navCourses(mode) {
  COURSE_NAV_MODE = mode;
  openTab('courses');
  if (mode === 'free') setCoursePill('free');
}

/* -------------------------------- boot -------------------------------- */
(async () => {
  try { ME = await api('/api/auth/me'); } catch { ME = null; }
  drawUserBox();
  if (ME) requireWhatsapp();
  const catReady = loadCatalogue();
  loadAnnouncements();
  loadHomeStats();
  loadFeedbackTeaser();
  // v18: browsing is public. Events and hackathons are always LISTED (the
  // public endpoint when signed out); joining them is what needs an account.
  loadEvents();
  if (ME) loadCerts();
  // Deep links: /open#courses, #events, #announcements, #register, #signup
  const h = (location.hash || '').replace('#', '');
  if (['courses', 'events', 'announcements', 'feedback'].includes(h)) openTab(h);
  else if (h === 'home') openTab('courses'); // the old portal home page merged into Courses
  else if (h === 'quests') openTab('courses'); // quests now live inside each course
  else if (h === 'free') navCourses('free'); // browse the free courses openly; signing in is asked only on solving
  else if (h === 'profile') openProfileTab();
  // #register opens the in-site enrolment form; #register-<CODE> preselects
  // that course. Wait for the catalogue so the course dropdown is populated.
  else if (h === 'register' || h.startsWith('register-')) catReady.then(() => openRegister(h.startsWith('register-') ? h.slice('register-'.length) : undefined));
  else if (h === 'signup' && !ME) gate();
})();

function drawUserBox() {
  const profLink = $('profileNavLink'); if (profLink) profLink.style.display = ME ? '' : 'none'; // one login: portal accounts get their open-web profile too
  $('userBox').innerHTML = ME
    ? `<span class="av-sm" style="width:30px;height:30px;margin-right:9px;cursor:pointer" onclick="openProfileTab()">${ME.avatar ? `<img src="${esc(ME.avatar)}" alt="">` : esc((ME.name || '?').charAt(0).toUpperCase())}</span>
       <span class="s" style="color:var(--muted);margin-right:10px">${esc(ME.name)}${ME.reg_no ? ' · <span class="mono">' + esc(ME.reg_no) + '</span>' : ''}</span>
       ${ME.role !== 'free' ? '<a class="btn btn-teal btn-sm" href="/dashboard" style="margin-right:8px">LMS Portal</a>' : ''}
       <button class="btn btn-ghost btn-sm" onclick="logout()">Sign out</button>`
    : `<a class="btn btn-ghost btn-sm" href="/login" style="margin-right:8px" title="For enrolled students and staff">LMS Portal</a>
       <button class="btn btn-ghost btn-sm" style="margin-right:8px" onclick="gate()" title="Free account - for the compiler, free courses, events and hackathons">Sign in free</button>
       <button class="btn btn-primary btn-sm" onclick="openRegister()" title="Join a paid course - no account needed to register">Register for a course</button>`;
}
async function logout() { try { await api('/api/auth/logout', { method: 'POST' }); } catch {} location.reload(); }

/* ------------------------------ sign-in gate ------------------------------
 * Browsing is public; solving, events and certificates need an account.
 * The gate is a modal, not a wall - Google (if configured), email signup
 * with domain + code verification, or the classic login page.
 */
function gateCardHtml(msg) {
  return `<div class="auth-gate-card" style="margin:30px auto">
    <h3 style="font-family:var(--font-display);margin-bottom:6px">Sign in to continue</h3>
    <p class="s" style="color:var(--muted);margin-bottom:16px">${esc(msg)}</p>
    <button class="btn btn-primary btn-block" onclick="gate()">Sign in or create a free account</button>
  </div>`;
}
function gate(afterMsg) {
  // Three different doors, spelled out so nobody knocks on the wrong one:
  // free account (this modal), LMS Portal login (enrolled/staff), and
  // course registration (no account needed at all).
  openModal('Sign in to EchoLens - free', `
    <p class="s" style="color:var(--muted);margin-bottom:14px">${esc(afterMsg || 'A free account is only needed to USE things: the compiler, the free courses, and joining events or hackathons. Browsing courses, outlines and projects needs no account at all.')}</p>
    <button class="btn btn-primary btn-block" style="margin-bottom:10px" onclick="showSignup()">Create a free account with email</button>
    <a class="btn btn-ghost btn-block" href="/login">Already have an account? Sign in</a>
    <div style="border-top:1px solid var(--line);margin-top:14px;padding-top:12px;font-size:12.5px;color:var(--muted);text-align:left">
      <div style="margin-bottom:6px"><strong>Enrolled in a paid course, or staff?</strong> Use the same <a href="/login">sign-in page</a> with your LMS Portal account.</div>
      <div><strong>Just want to join a paid course?</strong> <a href="#" onclick="closeModal();openRegister();return false">Register here</a> - no account needed; our Admissions Office emails you the fee challan.</div>
    </div>
    <div id="signupArea" style="margin-top:14px"></div>`);
}
function showSignup() {
  $('signupArea').innerHTML = `
    <form id="suForm" style="text-align:left;border-top:1px solid var(--line);padding-top:14px">
      <label class="field"><span>Full name</span><input name="name" required></label>
      <label class="field"><span>Email</span><input name="email" type="email" required placeholder="you@example.com"></label>
      <div id="codeRow" style="display:none">
        <label class="field"><span>Verification code (check your inbox)</span><input name="code" inputmode="numeric" maxlength="6" placeholder="6-digit code"></label>
      </div>
      <label class="field"><span>WhatsApp number (required)</span><input name="whatsapp" required placeholder="03XX-XXXXXXX" inputmode="tel"></label>
      <p class="hint">No password to choose - once your email is verified, we generate one and email it to you.</p>
      <button class="btn btn-primary btn-block" id="suBtn">Create account</button>
    </form>`;
  const f = $('suForm');
  f.querySelector('input[name="name"]').focus();
  let codeRequested = false;
  f.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = $('suBtn'); btn.disabled = true; modalMsg('');
    try {
      // Step 1: verify the email really exists (MX check + mailed code when
      // the academy's SMTP is configured).
      if (!codeRequested) {
        const out = await api('/api/auth/email-code', { method: 'POST', body: JSON.stringify({ email: f.email.value.trim() }) });
        if (out.verification) {
          codeRequested = true;
          $('codeRow').style.display = '';
          f.code.required = true; f.code.focus();
          btn.textContent = 'Verify code and create account';
          modalMsg('We emailed a 6-digit code to ' + f.email.value.trim() + ' - enter it above.', true);
          btn.disabled = false;
          return;
        }
      }
      // Step 2: code (if any) checked server-side, account created with a
      // system-generated password mailed to the now-verified address.
      const out = await api('/api/auth/register-open', {
        method: 'POST',
        body: JSON.stringify({ name: f.name.value, email: f.email.value.trim(), whatsapp: f.whatsapp.value, code: f.code ? f.code.value.trim() : undefined }),
      });
      if (out.password) {
        // Dev fallback only: no SMTP configured to deliver the password anywhere else.
        modalMsg('Account created. SMTP is not configured, so here is your password once: ' + out.password, true);
        setTimeout(() => location.reload(), 4000);
      } else {
        modalMsg('Account created - we emailed your password to ' + f.email.value.trim() + '.', true);
        setTimeout(() => location.reload(), 1800);
      }
    } catch (err) { modalMsg(err.message); btn.disabled = false; }
  });
}
function requireWhatsapp() {
  if (!['free', 'student'].includes(ME.role)) return; // learners only - staff never see this
  if (ME.profile && ME.profile.phone) return;
  openModal('One last step - your WhatsApp number', `
    <form id="waForm">
      <p class="s" style="color:var(--muted);margin-bottom:12px">We share quest openings, webinar invites, and your certificates on WhatsApp. This is required to continue.</p>
      <label class="field"><span>WhatsApp number</span><input name="whatsapp" required placeholder="03XX-XXXXXXX" inputmode="tel"></label>
      <button class="btn btn-primary btn-block">Save and continue</button></form>`);
  window.MODAL_LOCK = true;
  $('modalBox').querySelector('.close').style.display = 'none';
  $('waForm').addEventListener('submit', async (e) => {
    e.preventDefault(); const f = e.target; const btn = f.querySelector('button'); btn.disabled = true;
    try {
      await api('/api/me/contact', { method: 'POST', body: JSON.stringify({ whatsapp: f.whatsapp.value.trim() }) });
      ME.profile = ME.profile || {}; ME.profile.phone = f.whatsapp.value.trim();
      window.MODAL_LOCK = false;
      $('modalBox').querySelector('.close').style.display = '';
      closeModal(); toast('Saved - happy learning.');
    } catch (err) { modalMsg(err.message); btn.disabled = false; }
  });
}

/* -------------------------------- tabs -------------------------------- */
function openTab(tab) {
  ['courses', 'course', 'solve', 'events', 'eventDetail', 'announcements', 'profile', 'feedback'].forEach((t) => {
    const el = $('tab-' + t); if (el) el.style.display = t === tab ? '' : 'none';
  });
  if (tab === 'feedback') loadFeedback();
  // 'courses'/'course'/'solve' all map to the same two nav links (Live Tech
  // Courses vs Free Certified Courses) - which of those two is "active"
  // depends on COURSE_NAV_MODE, not on the tab name, since both links open
  // the identical tab.
  const inCoursesFamily = ['courses', 'course', 'solve'].includes(tab);
  document.querySelectorAll('.open-nav .nlink[data-tab]').forEach((n) => {
    const active = inCoursesFamily
      ? n.dataset.tab === 'courses' && (n.dataset.catnav || 'live') === COURSE_NAV_MODE
      : n.dataset.tab === tab || (tab === 'eventDetail' && n.dataset.tab === 'events');
    n.classList.toggle('active', active);
  });
  if (tab !== 'eventDetail') stopEventCountdown();
  window.scrollTo({ top: 0 });
}
function backToCourse() { if (CUR) { openTab('course'); } else openTab('courses'); }

/* -------------------------------- home -------------------------------- */
async function loadHomeStats() {
  renderHomePreview();
  renderJourney();
  let courses = 31, students = null;
  try {
    const d = await api('/api/public/info');
    courses = d.stats.courses || courses;
    students = d.stats.students;
  } catch {}
  const items = [
    ['#7C3AED', 'chart', String(courses) + '+', 'Live Courses'],
    ['#10B981', 'code', '150+', 'Coding Quests'],
    ['#3B82F6', 'gear', 'Built-in', 'Browser Compiler'],
    ['#F59E0B', 'spark', 'Weekly', 'Hackathons'],
    ['#EC4899', 'bot', 'Certificates', 'With QR Verify'],
  ];
  const statsEl = $('homeStats'); if (!statsEl) return;
  statsEl.innerHTML = items.map(([bg, ic, n, l]) =>
    `<div class="si"><div class="si-ic" style="background:${bg}"><svg viewBox="0 0 24 24" fill="none">${ICONS[ic]}</svg></div><div><b>${n}</b><span>${esc(l)}</span></div></div>`
  ).join('') + (students ? `<div class="si"><div class="si-ic" style="background:#0FBFA8"><svg viewBox="0 0 24 24" fill="none">${ICONS.bot}</svg></div><div><b>${students}+</b><span>Learners</span></div></div>` : '');
}
function renderHomePreview() {
  // Real progress for signed-in members only - guests get the marketing
  // version of this card on the landing page, not a fake one here.
  const box = $('homePreview'); if (!box) return;
  const g = ME && ME.gamify;
  if (!g) { box.innerHTML = ''; return; }
  const stages = (g && g.stages) || STAGE_FALLBACK;
  const stageName = g.stage.name;
  const level = stages.findIndex((s) => s.name === stageName) + 1 || 1;
  const gems = g.gems;
  const pct = g.stage.progress;
  const nextLine = g.stage.next ? `${g.stage.to_next} gems to <strong style="color:var(--ink)">${esc(g.stage.next.name)}</strong>` : 'Highest stage reached';
  const streak = g.streak;
  box.innerHTML = `
    <div class="home2-preview">
      <div class="home2-gems-pill"><svg width="17" height="17" viewBox="0 0 24 24"><path d="M6 3h12l4 6-10 12L2 9l4-6z" fill="#7C3AED"/></svg><b>${gems.toLocaleString()}</b><span class="s" style="color:var(--muted);font-size:11px">gems earned</span></div>
      <div class="home2-row">
        <div class="home2-pcard" style="flex:1.4">
          <div class="home2-label">Your progress</div>
          <div class="home2-big">Level ${level} &middot; ${esc(stageName)}</div>
          <div class="home2-sub">${nextLine}</div>
          <div class="home2-bar"><div style="width:${pct}%"></div></div>
        </div>
      </div>
      <div class="home2-row" style="margin-bottom:0">
        <div class="home2-pcard home2-streak">
          <div class="home2-flame"><svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M12 2c1 3-3 4-3 8a3 3 0 0 0 6 0c0-1-.5-2-.5-2 1.5 1 2.5 3 2.5 5a5 5 0 0 1-10 0c0-4 3-6 3-9 0-1-.3-1.7-.3-1.7S11 2 12 2z" fill="#fff"/></svg></div>
          <div><div class="home2-label" style="margin-bottom:1px">Weekly streak</div><div class="home2-big" style="font-size:17px">${streak} Days</div></div>
        </div>
        <div class="home2-pcard home2-quest">
          <div class="home2-label">Keep learning</div>
          <div class="s" style="font-size:12.5px;color:var(--muted);margin-bottom:8px">Pick up your next course</div>
          <button class="btn btn-primary btn-sm" style="width:100%;justify-content:center" onclick="openTab('courses')">Continue</button>
        </div>
      </div>
    </div>`;
}
function renderJourney() {
  const g = ME && ME.gamify;
  const stages = (g && g.stages) || STAGE_FALLBACK;
  const curKey = g ? g.stage.key : null;
  const idx = curKey ? stages.findIndex((s) => s.key === curKey) : -1;
  const jEl = $('homeJourney'); if (!jEl) return;
  jEl.innerHTML = stages.map((s, i) => {
    const cls = idx < 0 ? '' : i < idx ? ' done' : i === idx ? ' now' : '';
    return `<div class="step${cls}"><div class="dot"></div><div class="nm">${esc(s.name)}</div><div class="th">${s.min}+</div></div>`;
  }).join('');
}

/* ---------------------------- announcements ---------------------------- */
const ANN_KIND = { cohort: ['New cohort', 'quest'], hackathon: ['Hackathon', 'hackathon'], webinar: ['Webinar', 'webinar'], discount: ['Discount', 'competition'], info: ['Information', 'quest'] };
let ANNS = [];
async function loadAnnouncements() {
  try {
    const d = await api('/api/public/announcements');
    ANNS = d.announcements;
    const item = (a) => `
      <div class="card" style="margin-bottom:12px"><div class="card-body">
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:6px">
          ${a.pinned ? '<span class="role-pill">Pinned</span>' : ''}
          <span class="kbadge ${(ANN_KIND[a.kind] || ANN_KIND.info)[1]}">${(ANN_KIND[a.kind] || ANN_KIND.info)[0]}</span>
          <span class="s" style="color:var(--muted-2)">${esc((a.created_at || '').slice(0, 10))}</span>
        </div>
        <div style="font-weight:700;color:var(--navy);font-size:15px">${esc(a.title)}</div>
        <p class="s" style="color:var(--muted);white-space:pre-line;margin-top:4px">${esc(a.body)}</p>
        ${a.link ? `<a class="btn btn-teal btn-sm" style="margin-top:10px" href="${esc(a.link)}" target="_blank" rel="noopener">${esc(a.link_label || 'More details')}</a>` : ''}
      </div></div>`;
    $('annList').innerHTML = ANNS.length ? ANNS.map(item).join('') : '<div class="empty">No announcements yet - check back soon.</div>';
    const upd = (a) => {
      const [label, kind] = ANN_KIND[a.kind] || ANN_KIND.info;
      return `<div class="upd-card" onclick="openTab('announcements')">
        <span class="upd-kind kbadge ${kind}">${esc(label)}</span>
        <div class="upd-title">${esc(a.title)}</div>
        <div class="upd-meta">${esc((a.created_at || '').slice(0, 10))}</div>
        <span class="upd-link">Read more &rarr;</span>
      </div>`;
    };
    const hu = $('homeUpdates'); if (hu) hu.innerHTML = ANNS.length ? ANNS.slice(0, 4).map(upd).join('') : '<div class="empty">No updates yet - check back soon.</div>';
  } catch {
    $('annList').innerHTML = '<div class="empty">Announcements are unavailable right now.</div>';
    const hu = $('homeUpdates'); if (hu) hu.innerHTML = '<div class="empty">Updates are unavailable right now.</div>';
  }
}

/* -------------------------------- feedback wall --------------------------------
 * Public, no sign-in needed either way: anyone can leave feedback, and the
 * wall itself (admin-approved entries only) is visible to anyone with the
 * link - including a plain /open#feedback link shared on LinkedIn. */
function starsHtml(n) {
  const r = Math.max(0, Math.min(5, Number(n) || 0));
  if (!r) return '';
  return `<div class="s" style="color:#F0A82A;letter-spacing:1px" aria-label="${r} out of 5">${'&#9733;'.repeat(r)}${'&#9734;'.repeat(5 - r)}</div>`;
}
// Small trust-building teaser on the Courses homepage: a rating summary
// linking through to the full feedback wall. Hidden until at least one
// approved review exists - never shows an empty state on the homepage.
async function loadFeedbackTeaser() {
  let list;
  try { list = (await api('/api/public/feedback')).feedback; } catch { return; }
  if (!list || !list.length) return;
  const rated = list.filter((f) => f.rating);
  const avg = rated.length ? (rated.reduce((s, f) => s + f.rating, 0) / rated.length) : null;
  const box = $('feedbackTeaser');
  box.innerHTML = `<a href="#feedback" onclick="openTab('feedback');return false" style="display:inline-flex;gap:10px;align-items:center;text-decoration:none;color:inherit">
    ${avg ? `<span style="color:#F0A82A;letter-spacing:1px">${'&#9733;'.repeat(Math.round(avg))}${'&#9734;'.repeat(5 - Math.round(avg))}</span><span class="s" style="font-weight:700;color:var(--ink)">${avg.toFixed(1)}</span>` : ''}
    <span class="s" style="color:var(--muted)">${list.length} review${list.length === 1 ? '' : 's'} from learners &middot; read what they say &rarr;</span>
  </a>`;
  box.style.display = '';
}
async function loadFeedback() {
  const box = $('feedbackList');
  try {
    const d = await api('/api/public/feedback');
    box.innerHTML = d.feedback.length ? d.feedback.map((f) => `
      <div class="card" style="margin-bottom:12px"><div class="card-body">
        ${starsHtml(f.rating)}
        <p class="s" style="color:var(--ink);white-space:pre-line;margin:6px 0">${esc(f.message)}</p>
        <div class="s" style="color:var(--muted-2)">${esc(f.name)} &middot; ${esc((f.created_at || '').slice(0, 10))}</div>
        ${f.reply ? `<div class="s" style="margin-top:10px;padding:9px 12px;background:var(--violet-soft);border-radius:9px;color:var(--ink)"><strong>EchoLens replied:</strong> ${esc(f.reply)}</div>` : ''}
      </div></div>`).join('') : '<div class="empty">No feedback yet - be the first to share yours.</div>';
  } catch {
    box.innerHTML = '<div class="empty">Feedback is unavailable right now.</div>';
  }
}
function openFeedbackForm() {
  openModal('Leave feedback', `
    <form id="fbForm">
      <label class="field"><span>Your name (optional)</span><input name="name" maxlength="80" placeholder="How should we credit you?"></label>
      <label class="field"><span>Email (optional, not shown publicly)</span><input name="email" type="email" placeholder="you@example.com"></label>
      <label class="field"><span>Rating (optional)</span>
        <select name="rating"><option value="">No rating</option><option value="5">&#9733;&#9733;&#9733;&#9733;&#9733; Excellent</option><option value="4">&#9733;&#9733;&#9733;&#9733; Good</option><option value="3">&#9733;&#9733;&#9733; Okay</option><option value="2">&#9733;&#9733; Poor</option><option value="1">&#9733; Very poor</option></select>
      </label>
      <label class="field"><span>Your feedback</span><textarea name="message" rows="4" required maxlength="1000" placeholder="What did you like, or what should we improve?"></textarea></label>
      <input type="text" name="company" tabindex="-1" autocomplete="off" style="position:absolute;left:-9999px" aria-hidden="true">
      <p class="hint">Reviewed by our team before it appears publicly - usually within a day.</p>
      <button class="btn btn-primary btn-block" id="fbBtn">Submit feedback</button>
    </form>`);
  $('fbForm').addEventListener('submit', async (e) => {
    e.preventDefault(); const f = e.target; const btn = $('fbBtn'); btn.disabled = true;
    try {
      await api('/api/public/feedback', { method: 'POST', body: JSON.stringify({ name: f.name.value.trim(), email: f.email.value.trim(), rating: f.rating.value, message: f.message.value.trim(), company: f.company.value }) });
      modalMsg('Thanks - your feedback was submitted for review.', true);
      setTimeout(closeModal, 1600);
    } catch (err) { modalMsg(err.message); btn.disabled = false; }
  });
}

/* ------------------------------- catalogue ------------------------------- */
async function loadCatalogue() {
  try {
    const d = await api('/api/public/catalogue');
    CATALOGUE = d.catalogue;
    CAT_LINKS = d.links;
    if (d.cohort) $('cohortLine').textContent = `31 live, instructor-led programs · Registration deadline ${d.cohort.registration_deadline} · Batch starts ${d.cohort.batch_starts}. Every paid course opens its first quest free - try before you enrol.`;
    $('actionStrip').innerHTML = `
      <button class="btn btn-primary" onclick="openRegister()">Register for a paid course</button>`;
    const p = (d.paths || [])[0];
    $('pathBox').innerHTML = p ? `
      <div class="card" style="margin-bottom:16px"><div class="card-body" style="display:flex;gap:14px;align-items:center;flex-wrap:wrap">
        <div class="grow">
          <div class="t" style="font-weight:700;color:var(--navy)">${esc(p.title)}</div>
          <div class="s" style="color:var(--muted)">${esc(p.summary)}</div>
          <div class="s" style="margin-top:4px">${p.codes.map((c) => `<span class="prob-chip" style="cursor:default">${esc(c)}</span>`).join(' &rarr; ')}</div>
        </div>
        <div style="text-align:right">
          <div style="font-family:var(--font-display);font-size:22px;color:var(--teal-deep)">PKR ${p.bundle_pkr.toLocaleString()}</div>
          <div class="s" style="color:var(--muted)"><s>PKR ${p.full_pkr.toLocaleString()}</s> · Save PKR ${p.save_pkr.toLocaleString()} (${Math.round((p.save_pkr / p.full_pkr) * 100)}%)</div>
          <button class="lc-btn-solve" style="margin-top:6px" onclick="openRegister('PATH', '${esc(p.title)}')">Register for the path</button>
        </div>
      </div></div>` : '';
    drawCourses();
  } catch (e) { $('courseTable').innerHTML = `<div class="empty">${esc(e.message)}</div>`; }
}
const BADGE_LABEL = { free: 'FREE', new: 'NEW', high_demand: 'HIGH DEMAND', flagship: 'FLAGSHIP' };
const BADGE_CLASS = { free: 'quest', new: 'webinar', high_demand: 'competition', flagship: 'hackathon' };
const COURSE_PILLS = [['all', 'All'], ['Bootcamp', 'Bootcamps'], ['Short Course', 'Short Courses'], ['Specialist Track', 'Specialist Tracks'], ['free', 'Free courses']];
function setCoursePill(kind) {
  if (kind === 'free') { $('cFree').value = 'free'; $('cTier').value = ''; }
  else if (kind === 'all') { $('cFree').value = ''; $('cTier').value = ''; }
  else { $('cTier').value = kind; $('cFree').value = ''; }
  drawCourses();
}
function syncCourseFilters() { renderCoursePills(); }
function renderCoursePills() {
  const tier = $('cTier').value, free = $('cFree').value;
  $('cPills').innerHTML = COURSE_PILLS.map(([k, label]) => {
    const active = k === 'all' ? (!tier && !free) : k === 'free' ? free === 'free' : tier === k;
    return `<button type="button" class="filt-pill${active ? ' active' : ''}" onclick="setCoursePill('${k}')">${esc(label)}</button>`;
  }).join('');
}
function courseCardHtml(c) {
  const isFree = c.price_pkr === 0;
  const icon = pickIcon(c.title);
  const demand = (c.badges || []).find((b) => ['high_demand', 'flagship', 'new'].includes(b));
  return `
    <div class="oc-card${isFree ? ' teal' : ''}" onclick="courseAction('${esc(c.code)}')">
      <div class="oc-top">
        <div class="oc-icon" style="background:${tierBg(c.tier, isFree)}"><svg viewBox="0 0 24 24" fill="none">${ICONS[icon]}</svg></div>
        ${demand ? `<span class="oc-demand">${BADGE_LABEL[demand]}</span>` : ''}
      </div>
      <div>
        <div class="oc-tier">${esc(c.tier)}</div>
        <h4 class="oc-title">${esc(c.title)}</h4>
      </div>
      <div class="oc-meta"><svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.6"/><path d="M12 7v5l3 2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>${c.weeks} Weeks &middot; ${c.hours} Hours</div>
      <div class="oc-foot">
        <div class="oc-price${isFree ? ' free' : ''}">${isFree ? 'Free course' : 'PKR ' + c.price_pkr.toLocaleString()}</div>
        <button type="button" class="btn ${isFree ? 'btn-teal' : 'btn-primary'} oc-btn" onclick="event.stopPropagation();courseAction('${esc(c.code)}')">${isFree ? 'Start now' : 'View course'}</button>
      </div>
    </div>`;
}
function drawCourses() {
  if (!CATALOGUE.length) return;
  renderCoursePills();
  const tier = $('cTier').value, mode = $('cFree').value, q = $('cSearch').value.trim().toLowerCase();
  const list = CATALOGUE.filter((c) =>
    (!tier || c.tier === tier) &&
    (!mode || (mode === 'free' ? c.price_pkr === 0 : c.price_pkr > 0)) &&
    (!q || c.title.toLowerCase().includes(q) || c.code.toLowerCase().includes(q) || (c.summary || '').toLowerCase().includes(q)));
  $('courseTable').innerHTML = list.length ? `
    <div class="oc-grid">${list.map(courseCardHtml).join('')}</div>
    <p class="hint" style="margin-top:14px">Pay via bank transfer per your fee challan, then share the receipt to confirm your seat.</p>`
    : '<div class="empty">No courses match those filters.</div>';
}
function courseAction(code) {
  const c = CATALOGUE.find((x) => x.code === code);
  if (!c) return;
  // Every course opens its full detail page (price, outline, key concepts,
  // final project, and its quests - first week open, the rest locked). Paid
  // courses carry a "Register to unlock" call to action inside that page.
  if (c.track_key) { openCourse(c.track_key); return; }
  if (c.price_pkr > 0) openRegister(c.code, c.title); // fallback: course without a quest track
}

/* ------------------- in-site registration form (item 6) ------------------- */
// Scanning an ambassador's QR code lands here with ?amb=<4-digit code>; carry
// it into the registration form pre-filled (and locked, since it came from a
// trusted link rather than being typed).
const AMBASSADOR_REF_CODE = (() => {
  const v = new URLSearchParams(location.search).get('amb');
  return v && /^\d{4}$/.test(v) ? v : null;
})();
function openRegister(code, title) {
  const options = CATALOGUE.filter((c) => c.price_pkr > 0).map((c) =>
    `<option value="${esc(c.code)}|${esc(c.title)}"${c.code === code ? ' selected' : ''}>${esc(c.code)} - ${esc(c.title)} (PKR ${c.price_pkr.toLocaleString()})</option>`).join('');
  openModal('Register for a course', `
    <p class="s" style="color:var(--muted);margin-bottom:12px">Share your details and our Admissions Office will email you the fee challan with payment details and next steps. Registration deadline: 31 July 2026 · Batch starts 1 August 2026.</p>
    <form id="regInterest">
      <input name="company" style="display:none" tabindex="-1" autocomplete="off">
      <label class="field"><span>Full name</span><input name="name" required value="${ME ? esc(ME.name) : ''}"></label>
      <div class="form-grid">
        <label class="field" style="grid-column:span 2"><span>Email</span><input name="email" type="email" required value="${ME && ME.email ? esc(ME.email) : ''}"></label>
        <label class="field"><span>WhatsApp</span><input name="whatsapp" required placeholder="03XX-XXXXXXX" inputmode="tel" value="${ME && ME.profile && ME.profile.phone ? esc(ME.profile.phone) : ''}"></label>
      </div>
      <label class="field"><span>Course you want to enrol in</span><select name="course">${code === 'PATH' ? `<option value="PATH|${esc(title)}" selected>${esc(title)} (bundle - PKR 43,500)</option>` : ''}${options}</select></label>
      <label class="field"><span>Ambassador code (optional) - a valid 4-digit code gets you 10% off</span><input name="ambassador_code" maxlength="4" inputmode="numeric" pattern="[0-9]{4}" placeholder="e.g. 4821" value="${esc(AMBASSADOR_REF_CODE || '')}"${AMBASSADOR_REF_CODE ? ' readonly' : ''}></label>
      <button class="btn btn-primary btn-block">Submit registration</button>
    </form>`);
  $('regInterest').addEventListener('submit', async (e) => {
    e.preventDefault(); const f = e.target; const btn = f.querySelector('button'); btn.disabled = true; modalMsg('');
    const [course_code, course_title] = f.course.value.split('|');
    try {
      await api('/api/public/register-interest', {
        method: 'POST',
        body: JSON.stringify({ name: f.name.value, email: f.email.value.trim(), whatsapp: f.whatsapp.value, course_code, course_title, ambassador_code: f.ambassador_code.value.trim(), company: f.company.value }),
      });
      openModal('Registration received', `
        <p class="s" style="line-height:1.6">Thank you - your registration for <strong>${esc(course_title)}</strong> is with our Admissions Office.${f.ambassador_code.value.trim() ? ' Your ambassador code was accepted - a <strong>10% discount</strong> will be applied to your fee challan.' : ''} A confirmation email is on its way, and the Admissions Office will email you the fee challan with payment details. After paying, send your payment screenshot and record to <strong>finance@echolens.digital</strong> to confirm your enrollment.</p>
        <button class="btn btn-primary btn-block" style="margin-top:14px" onclick="closeModal()">Done</button>`);
    } catch (err) { modalMsg(err.message); btn.disabled = false; }
  });
}

/* -------------------- course detail with quest locks -------------------- */
async function openCourse(key) {
  openTab('course');
  $('courseHead').innerHTML = '<div class="empty">Loading course&hellip;</div>';
  $('courseLevels').innerHTML = '';
  const d = await api('/api/public/tracks/' + encodeURIComponent(key));
  let progress = null;
  if (ME) { try { progress = (await api('/api/open/progress?track=' + encodeURIComponent(key))).progress; } catch {} }
  CUR = { ...d, progress };
  // Whichever nav link you actually arrived through, a free course should
  // read as "Free Certified Courses" and a paid one as "Live Tech Courses" -
  // re-sync now that we know d.track.free (openTab('course') above ran
  // before this was known).
  COURSE_NAV_MODE = d.track.free ? 'free' : 'live';
  openTab('course');
  drawCourse();
}
// How each course takes work: shown on the course page and drives the solve workspace.
const MODE_LABEL = {
  code: 'Code submissions in the built-in compiler',
  'code-ai': 'Built-in compiler with an AI copilot beside it - code, get help, submit',
  file: 'File submissions (PDF, Word, PNG, JPEG)',
  doc: 'Report submissions - Word or PDF only',
  prompt: 'AI Prompt Lab - write and run prompts like a compiler, submit the workbook directly',
  'excel-ai': 'Workbook submissions (.xlsx / .csv) with an AI copilot linked to your sheet',
  multi: 'PDF or image submissions - multiple files per quest',
};
function courseOutlineHtml(t) {
  const isBootcamp = (t.course_code || '').startsWith('BC');
  const unit = isBootcamp ? 'Class' : 'Level';
  const rows = CUR.levels.map((l) => `
    <li style="display:flex;gap:10px;padding:7px 0;border-bottom:1px solid var(--line);font-size:13.5px;line-height:1.5">
      <span class="mono" style="color:var(--primary);font-weight:700;white-space:nowrap">${unit} ${l.no}</span>
      <span><strong style="color:var(--ink)">${esc(l.title)}</strong>${l.topic && l.topic.length < 90 ? ` <span style="color:var(--muted)">- ${esc(l.topic)}</span>` : ''}</span>
    </li>`).join('');
  const concepts = (t.key_concepts || []).map((k) => `<span style="display:inline-block;font-size:12px;font-weight:600;color:var(--primary);border:1px solid var(--line);border-radius:999px;padding:4px 11px;margin:3px 4px 0 0">${esc(k)}</span>`).join('');
  const clos = (t.clos || []).map((c, i) => `
    <li style="display:flex;gap:10px;padding:6px 0;font-size:13.5px;line-height:1.5">
      <span class="mono" style="color:var(--primary);font-weight:700;white-space:nowrap">CLO ${i + 1}</span>
      <span>${esc(c.replace(/^CLO\s*\d+:\s*/i, ''))}</span>
    </li>`).join('');
  const ep = t.end_project;
  return `
    ${concepts ? `<div class="card" style="margin-bottom:16px"><div class="card-body">
      <h3 style="margin-bottom:6px">What you will learn</h3>${concepts}
    </div></div>` : ''}
    ${clos ? `<div class="card" style="margin-bottom:16px"><div class="card-body">
      <h3 style="margin-bottom:4px">Course learning outcomes</h3>
      <p class="s" style="color:var(--muted);margin-bottom:4px">By the end of this course, you will be able to:</p>
      <ul style="list-style:none;padding:0;margin:0">${clos}</ul>
    </div></div>` : ''}
    <div class="card" style="margin-bottom:16px"><div class="card-body">
      <h3 style="margin-bottom:4px">Course outline</h3>
      <p class="s" style="color:var(--muted);margin-bottom:8px">One line per ${unit.toLowerCase()} - every ${unit.toLowerCase()} ends in hands-on quests you clear below.</p>
      <ul style="list-style:none;padding:0;margin:0">${rows}</ul>
    </div></div>
    ${ep ? `<div class="card" style="margin-bottom:16px;border:1.5px solid var(--primary)"><div class="card-body">
      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:6px">
        <span class="kbadge quest" style="background:var(--primary);color:#fff">END PROJECT</span>
        <span class="s" style="color:var(--muted)">Your production build</span>
      </div>
      <h3 style="font-family:var(--font-display);font-size:19px;color:var(--ink)">${esc(ep.title)}</h3>
      <p class="s" style="color:var(--primary);font-weight:600;margin-top:2px">${esc(ep.tagline || '')}</p>
      <p class="s" style="color:var(--muted);margin-top:6px">${esc(ep.description || '')}</p>
      ${(ep.includes || []).length ? `<div class="s" style="margin-top:10px;font-weight:700;color:var(--ink)">The finished product includes</div>
      <ul style="list-style:none;padding:0;margin:6px 0 0">${ep.includes.map((i) => `<li style="padding:4px 0 4px 22px;position:relative;font-size:13px;color:var(--muted);line-height:1.5"><span style="position:absolute;left:2px;color:var(--ok);font-weight:700">&#10003;</span>${esc(i)}</li>`).join('')}</ul>` : ''}
      ${ep.shipped_when ? `<p class="s" style="margin-top:10px;padding:9px 12px;border-left:3px solid var(--ok);background:var(--bg);border-radius:6px;color:var(--muted)"><strong style="color:var(--ink)">Shipped when:</strong> ${esc(ep.shipped_when)}</p>` : ''}
    </div></div>` : ''}`;
}
// CS-101..CS-107's `topic` field packs a short explanation paragraph and an
// example code snippet into one string (explanation, blank line, then code
// starting with #include/import/etc.) - too long for the one-line "Week X
// · topic" summary above, so it gets its own block here instead, split on
// the first blank line. Older tracks' short one-line topics stay in that
// summary (see the length check above) and this block renders nothing for
// them.
function topicDetailHtml(l) {
  if ((!l.topic || l.topic.length < 90) && !l.video_url) return '';
  const parts = (l.topic || '').split('\n\n');
  const explanation = parts[0] || '';
  const code = parts.slice(1).join('\n\n');
  return `
    <div class="card-body tight" style="border-top:1px solid var(--line)">
      ${explanation ? `<p class="s" style="line-height:1.6;margin-bottom:${code ? '10px' : '0'}">${esc(explanation)}</p>` : ''}
      ${code ? `<pre style="background:#0B1530;color:#E7ECF3;border-radius:10px;padding:12px 14px;overflow-x:auto;font:12.5px/1.55 var(--font-mono);white-space:pre"><code>${esc(code)}</code></pre>` : ''}
      ${l.video_url ? `<a href="${esc(l.video_url)}" target="_blank" rel="noopener" class="btn btn-ghost btn-sm" style="margin-top:10px;display:inline-flex;gap:6px;align-items:center">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>Watch topic video</a>` : ''}
    </div>`;
}
function drawCourse() {
  const t = CUR.track, prog = CUR.progress;
  const cat = CATALOGUE.find((c) => c.code === t.course_code);
  $('courseHead').innerHTML = `
    <div class="card" style="margin-bottom:16px"><div class="card-body">
      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:6px">
        ${t.free ? '<span class="kbadge quest">FREE COURSE</span>' : ''}
        <span class="mono s" style="color:var(--muted-2)">${esc(t.course_code || '')}</span>
        <span class="s" style="color:var(--muted)">Pass mark ${t.pass_mark || 60}% · ${MODE_LABEL[t.submission_mode] || MODE_LABEL.file} · Graded instantly</span>
      </div>
      <h2 style="font-family:var(--font-display);font-size:24px;color:var(--ink)">${esc(t.title)}</h2>
      <p class="s" style="color:var(--muted);margin-top:4px">${esc(t.description || '')}</p>
      ${t.outcome ? `<p class="s" style="margin-top:6px;color:var(--ink)"><strong>Outcome:</strong> ${esc(t.outcome)}</p>` : ''}
      <div style="display:flex;align-items:center;gap:16px;flex-wrap:wrap;margin-top:14px;padding:13px 16px;border:1px solid var(--line);border-radius:12px;background:var(--bg)">
        <div>
          <div class="s" style="color:var(--muted);font-size:10.5px;text-transform:uppercase;letter-spacing:.05em">${t.free ? 'Price' : 'Course fee'}</div>
          <div style="font-family:var(--font-display);font-size:23px;font-weight:700;color:${t.free ? 'var(--teal-deep)' : 'var(--ink)'}">${t.free || !(cat && cat.price_pkr) ? 'Free' : 'PKR ' + cat.price_pkr.toLocaleString()}</div>
        </div>
        ${cat ? `<div style="border-left:1px solid var(--line);padding-left:16px">
          <div class="s" style="color:var(--muted);font-size:10.5px;text-transform:uppercase;letter-spacing:.05em">Duration</div>
          <div style="font-weight:600;color:var(--ink)">${cat.weeks} weeks · ${cat.hours} hours</div></div>` : ''}
        <div style="border-left:1px solid var(--line);padding-left:16px">
          <div class="s" style="color:var(--muted);font-size:10.5px;text-transform:uppercase;letter-spacing:.05em">Access</div>
          <div style="font-weight:600;color:var(--ink)">${t.free ? 'All levels open free' : 'First quest free · rest unlocks on enrolment'}</div></div>
        <span style="flex:1"></span>
        ${!t.free && cat ? `<button class="btn btn-primary" onclick="openRegister('${esc(cat.code)}', '${esc(cat.title)}')">Register &amp; unlock - PKR ${cat.price_pkr.toLocaleString()}</button>` : ''}
      </div>
      ${prog ? `
        <div class="oq-prog" style="margin-top:12px"><div style="width:${Math.round((prog.graded / Math.max(1, prog.total)) * 100)}%"></div></div>
        <div class="s" style="margin-top:6px;color:${prog.passed ? 'var(--ok)' : 'var(--muted)'}">
          ${prog.graded}/${prog.total} tasks graded · ${prog.gems} gems earned${prog.avg != null ? ' · Average ' + prog.avg + '%' : ''}
          ${prog.passed ? ' · <strong>Course passed - your certificate is issued.</strong>' : (t.free ? ' · Complete every task at ' + (t.pass_mark || 60) + '%+ average for the automatic certificate.' : '')}
        </div>` : (ME ? '' : `<div class="s" style="margin-top:10px;color:var(--muted)">Sign in free to submit, earn gems${t.free ? ' and the certificate' : ''}.</div>`)}
    </div></div>`;
  const unitLabel = (t.course_code || '').startsWith('BC') ? 'Class' : 'Level';
  $('courseLevels').innerHTML = courseOutlineHtml(t) + CUR.levels.map((l) => `
    <div class="card" style="margin-bottom:12px">
      <div class="card-head">
        <h3 style="display:flex;gap:10px;align-items:center">${unitLabel} ${l.no} - ${esc(l.title)}
          ${l.locked ? '<span class="pay-badge na">Locked</span>' : '<span class="pay-badge confirmed">Open</span>'}</h3>
        <span class="s" style="color:var(--muted)">Week ${l.week || l.no}${l.topic && l.topic.length < 90 ? ' · ' + esc(l.topic) : ''}</span>
      </div>
      ${topicDetailHtml(l)}
      <div class="card-body tight">
        ${(l.problems || []).map((p) => {
          const sub = CUR.progress && CUR.progress.submissions[`${l.no}:${p.pid}`];
          return `
          <div class="list-row" style="padding:11px 4px${l.locked ? ';opacity:.62' : ''}">
            <div class="grow">
              <div class="t" style="font-size:13.5px">${esc(p.title)}
                <span class="lc-diff ${DIFF(p.difficulty)}">${DIFF(p.difficulty)}</span>
                <span class="s" style="color:var(--muted);font-weight:500">${p.points} gems</span></div>
              ${sub ? `<div class="s" style="margin-top:3px">
                ${sub.score != null
                  ? `<span class="grade-chip ok">Graded ${sub.score}% · ${Math.round((sub.score / 100) * p.points)} gems</span>`
                  : '<span class="grade-chip wait">Submitted - being graded</span>'}</div>` : ''}
            </div>
            ${l.locked
              ? `<button class="btn btn-ghost btn-sm" onclick="openRegister('${esc(t.course_code || '')}', '${esc(t.title)}')">Unlock</button>`
              : `<button class="lc-btn-solve" onclick="openSolve(${l.no}, ${p.pid})">${sub ? 'Reopen' : 'Solve'}</button>`}
          </div>`;
        }).join('')}
      </div>
    </div>`).join('');
}

/* ------------------------------ solve + submit ------------------------------ */
function fmtSubDate(iso) {
  if (!iso) return '';
  const d = new Date(String(iso).replace(' ', 'T'));
  if (isNaN(d)) return String(iso).slice(0, 16);
  return d.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' }) + ', ' + d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}
function openSolve(levelNo, pid) {
  const lvl = CUR.levels.find((l) => l.no === levelNo);
  const p = lvl && (lvl.problems || []).find((x) => x.pid === pid);
  if (!p || lvl.locked) return;
  CUR_PROBLEM = { level: levelNo, pid, problem: p };
  openTab('solve');
  $('svLeft').innerHTML = `
    <div class="card slv-card"><div class="card-body">
      <div class="slv-eyebrow">Level ${lvl.no} &middot; ${esc(lvl.title || '')}<span style="flex:1"></span><span class="lc-diff ${DIFF(p.difficulty)}">${DIFF(p.difficulty)}</span></div>
      <div class="slv-head">
        <h2>${esc(p.title)}</h2>
        <span class="slv-gems"><svg viewBox="0 0 24 24" fill="none">${ICONS.gem}</svg>${p.points} gems</span>
      </div>
      ${lvl.video_url ? `<a href="${esc(lvl.video_url)}" target="_blank" rel="noopener" class="btn btn-ghost btn-sm" style="margin-top:8px;display:inline-flex;gap:6px;align-items:center">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>Watch topic video</a>` : ''}
      <div class="s" id="svDesc" style="white-space:pre-line;line-height:1.65;font-size:13.5px;margin-top:8px">${esc(p.description || '')}</div>
      <div class="s" id="svRefs" style="margin-top:10px"></div>
    </div></div>
    ${(p.criteria || []).length ? `
      <div class="slv-block">
        <div class="slv-block-head"><svg viewBox="0 0 24 24" fill="none">${ICONS.target}</svg>What we're looking for</div>
        <ul class="slv-criteria">${p.criteria.map((c) => `<li><svg viewBox="0 0 24 24" fill="none">${ICONS.check}</svg>${esc(c)}</li>`).join('')}</ul>
      </div>` : ''}
    <div id="svGradedBox"></div>
    ${(p.reference && (p.reference.rows || []).length) ? `
      <div class="slv-block">
        <div class="slv-block-head">${esc(p.reference.title || 'Reference')}</div>
        <div class="slv-refgrid">${p.reference.rows.map((r, i) => `<div class="slv-refcell c${i % 5}"><div class="rng">${esc(r.range)}</div><div class="lbl">${esc(r.label)}</div></div>`).join('')}</div>
      </div>` : ''}
    ${p.hint ? `
      <details class="slv-block slv-hint">
        <summary><svg viewBox="0 0 24 24" fill="none" style="width:16px;height:16px;color:var(--primary)">${ICONS.bulb}</svg><span class="slv-block-head" style="display:inline">Need a hint?</span><svg class="chev" viewBox="0 0 24 24" fill="none">${ICONS.chev}</svg></summary>
        <div class="slv-hint-body">${esc(p.hint)}</div>
      </details>` : ''}`;
  $('svRefs').innerHTML = (p.refs || []).length
    ? '<strong>Resources and documentation:</strong><br>' + p.refs.map((r) => `<a href="${esc(r[1])}" target="_blank" rel="noopener">${esc(r[0])}</a>`).join(' · ')
    : '';
  drawSolveStatus();
  drawWorkArea();
}
function showFullFeedback() {
  const sub = CUR.progress && CUR.progress.submissions[`${CUR_PROBLEM.level}:${CUR_PROBLEM.pid}`];
  if (!sub) return;
  openModal('Feedback', `<p class="s" style="white-space:pre-line;line-height:1.6">${esc(sub.feedback || '')}</p>`);
}
function drawSolveStatus() {
  const sub = CUR.progress && CUR.progress.submissions[`${CUR_PROBLEM.level}:${CUR_PROBLEM.pid}`];
  const gradedBox = $('svGradedBox');
  const results = $('svResults');
  if (!sub) { if (gradedBox) gradedBox.innerHTML = ''; if (results) results.innerHTML = ''; return; }

  // pending (submitted, not yet graded)
  if (sub.score == null) {
    if (gradedBox) gradedBox.innerHTML = `<div class="slv-graded wait"><div class="g-head"><svg viewBox="0 0 24 24" fill="none">${ICONS.clock}</svg>Submitted — your grade will appear here once it is marked.</div></div>`;
    if (results) results.innerHTML = '';
    return;
  }

  const gems = sub.gems != null ? sub.gems : Math.round((sub.score / 100) * (CUR_PROBLEM.problem.points || 100));
  const feedback = sub.feedback || 'Nice work.';
  const short = feedback.length > 130 ? feedback.slice(0, 130) + '…' : feedback;
  const passMark = CUR.track.pass_mark || 60;

  // left column: slim graded banner
  if (gradedBox) gradedBox.innerHTML = `
    <div class="slv-graded${sub.score >= passMark ? '' : ' wait'}">
      <div class="g-head"><svg viewBox="0 0 24 24" fill="none">${ICONS.gem}</svg>Graded ${sub.score}%${CUR.track.friendly_grading ? '' : ' <span class="s" style="font-weight:600;color:var(--muted)">(instant grading, 10% reduction applied)</span>'} &middot; <span class="g-gems">${gems} gems earned</span></div>
      <p>${esc(short)}</p>
    </div>`;

  // right column: results card (under the output)
  if (results) results.innerHTML = `
    <div class="qresults">
      <div class="qres">
        <h5><svg viewBox="0 0 24 24" fill="none">${ICONS.sparkle}</svg>Feedback</h5>
        <p>${esc(short)}</p>
        ${feedback.length > 130 ? `<button type="button" class="slv-link-btn" onclick="showFullFeedback()">View detailed feedback</button>` : ''}
      </div>
      <div class="qres center">
        <h5>Score</h5>
        <div class="score-ring" style="--pct:${sub.score};--ring-color:${sub.score >= passMark ? 'var(--ok)' : 'var(--gold)'}"><span class="val">${sub.score}%</span></div>
        <div class="sub-note">(Instant)</div>
      </div>
      <div class="qres center">
        <h5><svg viewBox="0 0 24 24" fill="none">${ICONS.gem}</svg>Gems Earned</h5>
        <div class="slv-gem-big"><svg viewBox="0 0 24 24" fill="none">${ICONS.gem}</svg>${gems}</div>
        ${CUR.track.friendly_grading ? '' : '<div class="sub-note">10% instant-grading reduction applied</div>'}
      </div>
      <div class="qres">
        <h5><svg viewBox="0 0 24 24" fill="none">${ICONS.clock}</svg>Submission</h5>
        <div class="slv-sub-line">Submitted<strong>${esc(fmtSubDate(sub.submitted_at))}</strong></div>
        <div class="slv-sub-line" style="margin-top:6px">Attempts<strong>${sub.attempts || 1}</strong></div>
      </div>
    </div>`;
}
function svLangOptions() {
  // default_language (tracks/free-micro.js, tracks/cs-fundamentals.js) picks
  // which option opens pre-selected, so e.g. the CSS/HTML/JS courses land on
  // the web option instead of defaulting to Python every time.
  const def = CUR.track.default_language || 'python';
  const opt = (value, label) => `<option value="${value}"${value === def ? ' selected' : ''}>${label}</option>`;
  return opt('python', 'Python 3') + opt('c', 'C') + opt('cpp', 'C++') + opt('java', 'Java') + opt('sql', 'SQL') + opt('web', 'HTML / CSS / JS');
}
const SV_NOTE_ICON = '<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.8"/><path d="M12 11v5M12 8h.01" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';
function svCertNote() { return CUR.track.free ? ' Complete every task above the pass mark and your verified certificate is issued automatically.' : ''; }
// Beginner-track courses (CS-101..CS-107 - see tracks/free-micro.js's
// friendly_grading flag) never mention automated grading or the standard
// 10% reduction - a first-timer's first working program shouldn't come
// with a visible penalty attached, and how grading works internally isn't
// something a beginner needs to know to trust their result.
function svGradingNote() {
  return CUR.track.friendly_grading
    ? 'Submissions are graded automatically, and gems are awarded by score.' + svCertNote()
    : 'Submissions are graded instantly, with a 10% reduction, and gems are awarded by score.' + svCertNote();
}
// Per-problem Prompt Lab workbooks and the Excel copilot session live in
// memory for the visit - the submitted artifact is what gets graded.
let SV_LAB = {};
let SV_SHEET = null;
let SV_EXCEL_CHAT = [];
function labKey() { return `${CUR.track.key}:${CUR_PROBLEM.level}:${CUR_PROBLEM.pid}`; }

function drawWorkArea() {
  const isLearner = !ME || ['free', 'student'].includes(ME.role);
  const mode = CUR.track.submission_mode;

  // shared code-editor shell (dark, line-numbered) - staff omit Dataset/Submit
  const codeIde = (opts) => `
    <div class="qide">
      <div class="qide-bar">
        <select id="svLang" class="qide-lang" onchange="svLangChanged()">${svLangOptions()}</select>
        <span class="sp"></span>
        ${opts.dataset ? `<label class="qbtn" style="cursor:pointer"><svg viewBox="0 0 24 24" fill="none">${ICONS.database}</svg>Dataset<input type="file" accept=".csv,.tsv,.txt,.json" style="display:none" onchange="svLocalDataset(this)"></label>` : ''}
        <button type="button" class="qbtn" onclick="svClearOutput()"><svg viewBox="0 0 24 24" fill="none">${ICONS.refresh}</svg>Clear</button>
        <button type="button" class="qbtn" id="svRunBtn" onclick="runSolve()"><svg viewBox="0 0 24 24" fill="none">${ICONS.play}</svg>Run</button>
        ${opts.submit ? `<button type="button" class="qbtn primary" id="svSubmitBtn" onclick="submitSolve()">${opts.sub ? 'Resubmit' : 'Submit for grading'}</button>` : ''}
      </div>
      <div class="qide-box">
        <div class="qide-editor">
          <div class="ide2-gutter" id="svGutter"><span>1</span></div>
          <textarea id="svCode" class="ide2-code" spellcheck="false" placeholder="${opts.placeholder}"></textarea>
        </div>
        <div class="qide-status">
          <span id="svStatus">${opts.status}</span>
          <span class="sp"></span>
          <span id="svExecTime"></span>
          <button class="qide-rerun" title="Run again" onclick="runSolve()"><svg viewBox="0 0 24 24" fill="none">${ICONS.play}</svg></button>
        </div>
      </div>
      <div class="qide-out"><div id="svTerm"></div></div>
      <div id="svWebWrap" style="display:none">
        <iframe id="svWebFrame" class="web-frame" sandbox="allow-scripts" title="Live preview"></iframe>
        <pre id="svWebLog" class="web-log"></pre>
      </div>
      ${opts.submit ? '<div id="svResults"></div>' : ''}
      ${opts.submit ? `<div class="qide-note">${SV_NOTE_ICON}<span>${svGradingNote()}</span></div>` : ''}
    </div>`;

  const codeLike = mode === 'code' || mode === 'code-ai';
  if (!isLearner) {
    // Staff can read and run everything, but submissions are for learners.
    $('svWorkArea').innerHTML = codeLike
      ? codeIde({ dataset: false, submit: false, placeholder: '# Staff preview — run code freely. Submissions are for learner accounts.', status: 'Staff preview — submissions are for learner accounts.' }) + (mode === 'code-ai' ? svAiPanelHtml() : '')
      : `<div class="card"><div class="card-body"><p class="s" style="color:var(--muted)">Staff preview — this task takes ${mode === 'prompt' ? 'Prompt Lab workbook' : 'file'} submissions from learner accounts.</p></div></div>`;
    if (codeLike) { SV_TERM = EchoTerm.mount($('svTerm')); EchoRun.wireEditor($('svCode')); svSyncGutter(); svLangChanged(); if (mode === 'code-ai') svWireAiPanel(); }
    return;
  }

  const sub = CUR.progress && CUR.progress.submissions[`${CUR_PROBLEM.level}:${CUR_PROBLEM.pid}`];
  if (codeLike) {
    // BC-05 style: the compiler with the AI copilot right beside it - the
    // same explain / fix / generate assistant as the free /compiler.
    $('svWorkArea').innerHTML = codeIde({ dataset: true, submit: true, sub, placeholder: '# Write your solution here. Run to test, submit for grading and gems.', status: 'Ready — runs in your browser, nothing to install.' }) + (mode === 'code-ai' ? svAiPanelHtml() : '');
    SV_TERM = EchoTerm.mount($('svTerm'));
    EchoRun.wireEditor($('svCode'));
    svSyncGutter();
    svLangChanged();
    if (mode === 'code-ai') svWireAiPanel();
  } else if (mode === 'prompt') {
    svPromptLabArea(sub);
  } else if (mode === 'excel-ai') {
    svExcelArea(sub);
  } else {
    const CFG = {
      doc: { accept: '.pdf,.doc,.docx', multiple: false, label: 'Your report (Word or PDF)', blurb: 'This course takes report submissions - upload your work as a Word or PDF file only.' },
      multi: { accept: '.pdf,.png,.jpg,.jpeg', multiple: true, label: 'Your designs (PDF / PNG / JPEG - select several at once)', blurb: 'This course takes design submissions - upload your exports as PDF or images. You can attach multiple files in one submission.' },
      file: { accept: '.pdf,.doc,.docx,.ppt,.pptx,.txt,.md,.png,.jpg,.jpeg,.zip', multiple: false, label: 'Your work', blurb: 'This course takes file submissions - upload your deliverable as PDF, Word, PNG, or JPEG (ZIP for multi-file work).' },
    };
    const cfg = CFG[mode] || CFG.file;
    $('svWorkArea').innerHTML = `
      <div class="card"><div class="card-head"><h3>Submit your work</h3></div>
        <div class="card-body">
          <p class="s" style="color:var(--muted);margin-bottom:12px">${cfg.blurb}</p>
          <form id="svFileForm">
            <label class="field"><span>${cfg.label}</span><input name="file" type="file" accept="${cfg.accept}" ${cfg.multiple ? 'multiple' : ''} required></label>
            <div id="svFileList" class="hint" style="margin:4px 0 8px"></div>
            <button class="btn lc-btn-solve">${sub ? 'Resubmit for grading' : 'Submit for grading'}</button>
          </form>
          <p class="hint" style="margin-top:10px">${svGradingNote()}</p>
        </div></div>
      <div id="svResults" style="margin-top:16px"></div>`;
    $('svFileForm').addEventListener('submit', (e) => { e.preventDefault(); submitSolve(e.target); });
    $('svFileForm').file.addEventListener('change', (e) => {
      const names = [...e.target.files].map((f) => f.name);
      $('svFileList').textContent = names.length > 1 ? `${names.length} files attached: ${names.join(', ')}` : '';
    });
  }
  drawSolveStatus();
}

/* ---------- AI copilot panel beside the compiler (code-ai courses) ---------- */
function svAiPanelHtml() {
  return `
    <div class="card" style="margin-top:14px"><div class="card-head"><h3>AI copilot</h3><span class="s" style="color:var(--muted)">Explain, fix, improve - you review and own every line</span></div>
      <div class="card-body">
        <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px">
          ${['Explain this code', 'Fix errors', 'Optimize code', 'Generate code'].map((a) => `<button type="button" class="btn btn-ghost btn-sm" onclick="svAiQuick('${a}')">${a}</button>`).join('')}
        </div>
        <div id="svAiBody" style="max-height:260px;overflow:auto;display:flex;flex-direction:column;gap:8px">
          <p class="s" style="color:var(--muted)">Ask the copilot about the code in your editor - it sees what you have written.</p>
        </div>
        <form id="svAiForm" style="display:flex;gap:8px;margin-top:10px">
          <input id="svAiInput" class="field" style="flex:1;margin:0" placeholder="Ask anything about your code...">
          <button class="btn btn-ghost">Ask</button>
        </form>
      </div></div>`;
}
function svWireAiPanel() {
  const f = $('svAiForm'); if (!f) return;
  f.addEventListener('submit', (e) => {
    e.preventDefault();
    const v = $('svAiInput').value.trim(); if (!v) return;
    $('svAiInput').value = '';
    svAiSend(v, null);
  });
}
function svAiQuick(action) { svAiSend(action, action); }
function svAiBubble(text, mine) {
  const body = $('svAiBody'); if (!body) return null;
  const empty = body.querySelector('p'); if (empty && body.children.length === 1) empty.remove();
  const el = document.createElement('div');
  el.className = 's';
  el.style.cssText = `padding:9px 12px;border-radius:10px;white-space:pre-wrap;line-height:1.55;background:${mine ? 'var(--primary-soft, rgba(124,58,237,.08))' : 'var(--bg)'};border:1px solid var(--line)`;
  el.textContent = text;
  body.appendChild(el);
  body.scrollTop = body.scrollHeight;
  return el;
}
async function svAiSend(displayText, action) {
  if (!ME) { gate('Sign in free to use the AI copilot.'); return; }
  svAiBubble(displayText, true);
  const reply = svAiBubble('Thinking...');
  try {
    const d = await api('/api/compiler/ai', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, code: $('svCode') ? $('svCode').value : '', language: $('svLang') ? $('svLang').value : 'python', question: action ? null : displayText }) });
    if (reply) reply.textContent = d.reply;
  } catch (e) { if (reply) { reply.textContent = e.message; reply.style.color = 'var(--danger)'; } }
}

/* -------------- Prompt Lab workbook (prompt-engineering courses) -------------- */
function svPromptLabArea(sub) {
  $('svWorkArea').innerHTML = `
    <div class="card"><div class="card-head"><h3>Prompt Lab - your workbook</h3><span class="s" style="color:var(--muted)">Write, run, refine - then submit the workbook</span></div>
      <div class="card-body">
        <p class="s" style="color:var(--muted);margin-bottom:10px">This course works like a compiler for prompts: run your prompt against a real model, refine it until the output is dependable, and submit the whole workbook (prompts + outputs) directly for grading.</p>
        <div id="svLabBook" style="display:flex;flex-direction:column;gap:10px;max-height:340px;overflow:auto;margin-bottom:10px"></div>
        <textarea id="svLabPrompt" class="field" rows="5" style="width:100%;font-family:var(--font-mono, monospace);font-size:13px" placeholder="Write your prompt here, exactly as you would give it to ChatGPT or Claude..."></textarea>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px;align-items:center">
          <button type="button" class="btn btn-ghost btn-sm" onclick="svLabClear()">Clear workbook</button>
          <span style="flex:1"></span>
          <button type="button" class="btn btn-ghost" id="svLabRun" onclick="svLabRun()">Run prompt</button>
          <button type="button" class="btn lc-btn-solve" id="svSubmitBtn" onclick="submitSolve()">${sub ? 'Resubmit workbook' : 'Submit workbook for grading'}</button>
        </div>
        <p class="hint" style="margin-top:10px">${svGradingNote()}</p>
      </div></div>
    <div id="svResults" style="margin-top:16px"></div>`;
  svDrawLabBook();
}
function svDrawLabBook() {
  const box = $('svLabBook'); if (!box) return;
  const entries = SV_LAB[labKey()] || [];
  box.innerHTML = entries.length ? entries.map((e, i) => `
    <div style="border:1px solid var(--line);border-radius:10px;overflow:hidden">
      <div class="s" style="padding:8px 12px;background:var(--bg);white-space:pre-wrap"><strong style="color:var(--primary)">Prompt ${i + 1}</strong><br>${esc(e.prompt)}</div>
      <div class="s" style="padding:8px 12px;white-space:pre-wrap;border-top:1px solid var(--line)"><strong style="color:var(--ok)">Model output</strong><br>${esc(e.reply)}</div>
    </div>`).join('')
    : '<p class="s" style="color:var(--muted)">Your workbook is empty - run your first prompt below.</p>';
  box.scrollTop = box.scrollHeight;
}
async function svLabRun() {
  if (!ME) { gate('Sign in free to run prompts in the lab.'); return; }
  const ta = $('svLabPrompt'); const prompt = ta.value.trim();
  if (!prompt) { toast('Write your prompt first.', true); return; }
  const btn = $('svLabRun'); btn.disabled = true; btn.textContent = 'Running...';
  try {
    const d = await api('/api/open/ai', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ kind: 'prompt', prompt }) });
    (SV_LAB[labKey()] = SV_LAB[labKey()] || []).push({ prompt, reply: d.reply });
    ta.value = '';
    svDrawLabBook();
  } catch (e) { if (!e.handled) toast(e.message, true); }
  btn.disabled = false; btn.textContent = 'Run prompt';
}
function svLabClear() { delete SV_LAB[labKey()]; svDrawLabBook(); }

/* ------------- Excel workbook + linked AI copilot (excel-ai courses) ------------- */
function svExcelArea(sub) {
  $('svWorkArea').innerHTML = `
    <div class="card"><div class="card-head"><h3>Your workbook + AI copilot</h3><span class="s" style="color:var(--muted)">Upload, analyse with AI, submit</span></div>
      <div class="card-body">
        <p class="s" style="color:var(--muted);margin-bottom:10px">Upload your Excel workbook (.xlsx) or CSV, load it into the AI copilot to analyse, build formulas, or clean it in context - then submit the finished workbook for grading.</p>
        <form id="svFileForm">
          <label class="field"><span>Your workbook (.xlsx / .csv)</span><input name="file" type="file" accept=".xlsx,.csv" required></label>
          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:6px">
            <button type="button" class="btn btn-ghost" onclick="svExcelLoad()">Load into AI copilot</button>
            <button class="btn lc-btn-solve">${sub ? 'Resubmit workbook' : 'Submit workbook for grading'}</button>
          </div>
        </form>
        <div id="svSheetInfo" class="hint" style="margin-top:8px">No sheet loaded into the copilot yet.</div>
        <div style="margin-top:12px;border-top:1px solid var(--line);padding-top:12px">
          <div class="s" style="font-weight:700;color:var(--ink);margin-bottom:8px">AI copilot - linked to your sheet</div>
          <div id="svExcelBody" style="max-height:280px;overflow:auto;display:flex;flex-direction:column;gap:8px">
            <p class="s" style="color:var(--muted)">Load your workbook above, then ask anything: "what are the top trends?", "write the XLOOKUP for prices", "standardise the city names".</p>
          </div>
          <form id="svExcelForm" style="display:flex;gap:8px;margin-top:10px">
            <input id="svExcelQ" class="field" style="flex:1;margin:0" placeholder="Ask the copilot about your sheet...">
            <button class="btn btn-ghost">Ask</button>
          </form>
        </div>
        <p class="hint" style="margin-top:10px">${svGradingNote()}</p>
      </div></div>
    <div id="svResults" style="margin-top:16px"></div>`;
  $('svFileForm').addEventListener('submit', (e) => { e.preventDefault(); submitSolve(e.target); });
  $('svExcelForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const q = $('svExcelQ').value.trim(); if (!q) return;
    $('svExcelQ').value = '';
    svExcelAsk(q);
  });
  if (SV_SHEET) $('svSheetInfo').textContent = `Loaded into the copilot: ${SV_SHEET.name}`;
}
function svExcelBubble(text, mine) {
  const body = $('svExcelBody'); if (!body) return null;
  const empty = body.querySelector('p'); if (empty && body.children.length === 1) empty.remove();
  const el = document.createElement('div');
  el.className = 's';
  el.style.cssText = `padding:9px 12px;border-radius:10px;white-space:pre-wrap;line-height:1.55;background:${mine ? 'var(--primary-soft, rgba(124,58,237,.08))' : 'var(--bg)'};border:1px solid var(--line)`;
  el.textContent = text;
  body.appendChild(el);
  body.scrollTop = body.scrollHeight;
  return el;
}
async function svExcelLoad() {
  if (!ME) { gate('Sign in free to use the Excel copilot.'); return; }
  const input = $('svFileForm').file;
  const f = input.files && input.files[0];
  if (!f) { toast('Choose your Excel or CSV file first.', true); return; }
  $('svSheetInfo').textContent = 'Reading your workbook...';
  try {
    const fd = new FormData(); fd.set('file', f);
    const d = await api('/api/open/excel-extract', { method: 'POST', body: fd });
    SV_SHEET = { name: d.name, text: d.text };
    SV_EXCEL_CHAT = [];
    $('svSheetInfo').textContent = `Loaded into the copilot: ${d.name}`;
    svExcelBubble(`Workbook loaded (${d.name}). Preview:\n${d.preview}`, false);
  } catch (e) { $('svSheetInfo').textContent = 'Could not load that file.'; if (!e.handled) toast(e.message, true); }
}
async function svExcelAsk(question) {
  svExcelBubble(question, true);
  const reply = svExcelBubble('Thinking...');
  try {
    const d = await api('/api/open/ai', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ kind: 'excel', question, sheet: SV_SHEET ? SV_SHEET.text : null, sheet_name: SV_SHEET ? SV_SHEET.name : null, history: SV_EXCEL_CHAT }) });
    if (reply) reply.textContent = d.reply;
    SV_EXCEL_CHAT.push({ role: 'user', content: question }, { role: 'assistant', content: d.reply });
    SV_EXCEL_CHAT = SV_EXCEL_CHAT.slice(-8);
  } catch (e) { if (reply) { reply.textContent = e.message; reply.style.color = 'var(--danger)'; } }
}
function svSyncGutter() {
  const code = $('svCode'), g = $('svGutter'); if (!code || !g) return;
  const n = code.value.split('\n').length || 1;
  let h = ''; for (let i = 1; i <= n; i++) h += `<span>${i}</span>`;
  g.innerHTML = h; g.scrollTop = code.scrollTop;
  if (!code._gutterWired) {
    code._gutterWired = true;
    code.addEventListener('input', svSyncGutter);
    code.addEventListener('scroll', () => { g.scrollTop = code.scrollTop; });
  }
}
function svLocalDataset(input) {
  const f = input.files && input.files[0];
  if (!f) return;
  if (f.size > 20 * 1024 * 1024) { toast('Keep datasets under 20 MB.', true); input.value = ''; return; }
  const reader = new FileReader();
  reader.onload = () => {
    SV_FILES = SV_FILES.filter((x) => x.name !== f.name);
    SV_FILES.push({ name: f.name, bytes: reader.result });
    toast(`${f.name} loaded - read it by name in your code.`);
  };
  reader.readAsArrayBuffer(f);
  input.value = '';
}
function svRunLabel(running) {
  return running
    ? `<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>Stop`
    : `<svg viewBox="0 0 24 24" fill="none">${ICONS.play}</svg>Run`;
}
// HTML/CSS/JS (web) runs as a live sandboxed preview, not in the shared
// terminal - toggle which output area shows, same split dashboard.js uses
// for the paid quest workspace's taskLangChanged().
function svLangChanged() {
  const lang = $('svLang').value, web = lang === 'web';
  const term = $('svTerm'), wrap = $('svWebWrap');
  if (term) term.style.display = web ? 'none' : '';
  if (wrap) wrap.style.display = web ? '' : 'none';
  const code = $('svCode');
  if (code && !code.value.trim() && web) code.placeholder = '<!-- Write HTML, CSS (in <style>) and JavaScript (in <script>) here, then press Run for a live preview. -->';
}
function svClearOutput() {
  if (SV_TERM) SV_TERM.clear();
  const log = $('svWebLog'); if (log) log.textContent = '';
  const frame = $('svWebFrame'); if (frame) frame.srcdoc = '';
  const exec = $('svExecTime'); if (exec) exec.textContent = '';
}
async function runSolve() {
  if (!ME) { gate('The compiler needs a free account - the course outline and every task stay open to read without one.'); return; }
  const btn = $('svRunBtn'); const status = $('svStatus'); const exec = $('svExecTime');
  const code = $('svCode').value;
  if (!code.trim()) { status.textContent = 'Write some code first.'; return; }
  const lang = $('svLang').value;
  if (lang === 'web') {
    const log = $('svWebLog'); if (log) log.textContent = '';
    EchoWeb.preview($('svWebFrame'), code, (kind, text) => {
      if (!log) return;
      log.textContent += (kind === 'error' ? '✗ ' : kind === 'warn' ? '! ' : '› ') + text + '\n';
      log.scrollTop = log.scrollHeight;
    });
    status.textContent = 'Preview updated.';
    return;
  }
  if (EchoRun.isRunning()) { EchoRun.cancel(); if (btn) btn.innerHTML = svRunLabel(false); return; }
  if (btn) btn.innerHTML = svRunLabel(true);
  if (exec) exec.textContent = '';
  status.textContent = 'Running…';
  const started = performance.now();
  try {
    await EchoRun.executeAny($('svLang').value, code, { term: SV_TERM, files: SV_FILES, onStatus: (t) => { status.textContent = t; } });
    status.innerHTML = `<span class="done"><svg viewBox="0 0 24 24" fill="none"><path d="M9 12l2 2 4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.6"/></svg>Done.</span>`;
    if (exec) exec.textContent = 'Execution time: ' + ((performance.now() - started) / 1000).toFixed(2) + 's';
  }
  catch (e) { status.textContent = e.message; }
  if (btn) btn.innerHTML = svRunLabel(false);
}
async function submitSolve(fileForm) {
  if (!ME) { gate('Sign in free to submit this task, earn gems, and collect certificates.'); return; }
  const mode = CUR.track.submission_mode;
  const fd = new FormData();
  fd.set('track_key', CUR.track.key);
  fd.set('level', CUR_PROBLEM.level);
  fd.set('pid', CUR_PROBLEM.pid);
  if (mode === 'prompt') {
    // The Prompt Lab workbook (every prompt + model output) is the submission.
    const entries = SV_LAB[labKey()] || [];
    if (!entries.length) { toast('Run at least one prompt in the lab first - the workbook is what gets graded.', true); return; }
    fd.set('code', entries.map((e, i) => `PROMPT ${i + 1}:\n${e.prompt}\n\nMODEL OUTPUT ${i + 1}:\n${e.reply}`).join('\n\n----------------\n\n').slice(0, 60000));
    fd.set('language', 'prompt');
  } else if (fileForm) {
    const files = [...fileForm.file.files];
    if (!files.length) { toast('Choose your file first.', true); return; }
    fd.set('file', files[0]);
    for (const f of files.slice(1)) fd.append('files', f); // multi-file courses (PDF/image packs)
  } else {
    const code = $('svCode').value;
    if (!code.trim()) { toast('Write your solution first.', true); return; }
    fd.set('code', code);
    fd.set('language', $('svLang').value);
  }
  const btn = $('svSubmitBtn') || (fileForm && fileForm.querySelector('button:not([type="button"])'));
  if (btn) { btn.disabled = true; btn.textContent = 'Submitting...'; }
  try {
    const out = await api('/api/open/submit', { method: 'POST', body: fd });
    if (out.cert) toast(`Course passed - certificate ${out.cert.serial} issued. Find it under Events, in My certificates.`);
    else if (out.graded) toast(`Graded ${out.submission.score}% · ${out.submission.gems} gems earned.`);
    else toast(out.note || 'Submitted - it will be graded soon.');
    // Refresh progress and views
    try { CUR.progress = (await api('/api/open/progress?track=' + encodeURIComponent(CUR.track.key))).progress; } catch {}
    drawSolveStatus();
    if (out.cert) loadCerts();
    if ($('svSubmitBtn')) { $('svSubmitBtn').disabled = false; $('svSubmitBtn').textContent = 'Resubmit'; }
  } catch (e) {
    if (!e.handled) toast(e.message, true);
    if (btn) { btn.disabled = false; btn.textContent = 'Submit for grading'; }
  }
}

/* ---------------------------- events (signed in) ---------------------------- */
const EV_KIND_LABEL = { quest: 'Quest', hackathon: 'Hackathon', competition: 'Competition', webinar: 'Webinar' };
const EV_KIND_TAG = { quest: 'Open Quest', hackathon: 'Hackathon', competition: 'Competition', webinar: 'Webinar' };
const EV_LANG_LABEL = { none: 'File or link submission', python: 'Python 3', c: 'C', cpp: 'C++', sql: 'SQL', web: 'HTML / CSS / JS' };
const EV_LANG_SHORT = { none: 'Submission', python: 'Python 3', c: 'C', cpp: 'C++', sql: 'SQL', web: 'Web' };
const EV_THUMB = {
  quest: { g: 'linear-gradient(135deg,#0FBFA8,#38BDF8)', glyph: '&gt;_ code' },
  hackathon: { g: 'linear-gradient(135deg,#7C3AED,#6366F1)', glyph: '{ } build' },
  competition: { g: 'linear-gradient(135deg,#F59E0B,#F0A82A)', glyph: '&#9733; compete' },
  webinar: { g: 'linear-gradient(135deg,#2A7BD1,#38BDF8)', glyph: '&#9673; live' },
};
const EV_LANG_GLYPH = { python: 'print(…)', c: '#include', cpp: 'std::cout', sql: 'SELECT *', web: '&lt;/&gt; html' };
const EV_LANG_BADGE = {
  python: { g: 'linear-gradient(135deg,#4B8BBE,#FFD43B)', t: 'Py' },
  c: { g: 'linear-gradient(135deg,#5C6BC0,#3949AB)', t: 'C' },
  cpp: { g: 'linear-gradient(135deg,#00599C,#004482)', t: 'C++' },
  sql: { g: 'linear-gradient(135deg,#0FBFA8,#0C8F8F)', t: 'SQL' },
  web: { g: 'linear-gradient(135deg,#F06529,#E44D26)', t: '{ }' },
};
function evLangBadgeHtml(lang) {
  const b = EV_LANG_BADGE[lang]; if (!b) return '';
  return `<span class="evd-lang-badge" style="background:${b.g}">${esc(b.t)}</span>`;
}

let EV_ALL = [];
let EV_TAB = 'all';
let EV_PAGE = 1;
const EV_PER = 6;

// event-level helpers derived from its problems
function evPoints(ev) { const p = ev.problems || []; return p.length ? p.reduce((s, x) => s + (x.points || 0), 0) : 100; }
function evDiff(ev) { const p = ev.problems || []; if (!p.length) return 'Easy'; const rank = { Easy: 1, Medium: 2, Hard: 3 }; return p.reduce((m, x) => rank[x.difficulty] > rank[m] ? x.difficulty : m, 'Easy'); }
function evDurLabel(ev) { const m = ev.duration_minutes; if (!m) return null; return m < 60 ? `~${m} minute${m === 1 ? '' : 's'}` : `~${Math.round(m / 60)} hour${Math.round(m / 60) === 1 ? '' : 's'}`; }
const DIFF_DOT = { Easy: '#1FA36B', Medium: '#D89A00', Hard: '#D14370' };

async function loadEvents() {
  try {
    // Signed out: the public list (titles, kind, fee, dates, joined count) so
    // anyone can SEE what is running; opening one asks for the free sign-in.
    const d = ME ? await api('/api/events') : await api('/api/public/events');
    EV_ALL = (d.events || []).map((e) => ({ problems: [], ...e }));
    renderEvTabs();
    renderEvStats();
    drawEventList();
  } catch (e) { $('evList').innerHTML = `<div class="empty">${esc(e.message)}</div>`; }
}

function evTabFilter(tab, ev) {
  if (tab === 'all') return true;
  if (tab === 'quests') return ev.kind === 'quest';
  if (tab === 'hackathons') return ev.kind === 'hackathon' || ev.kind === 'competition';
  if (tab === 'live') return ev.status === 'live';
  if (tab === 'webinars') return ev.kind === 'webinar';
  return true;
}
function renderEvTabs() {
  const defs = [
    ['all', 'All Events'], ['quests', 'Open Quests'], ['hackathons', 'Hackathons'],
    ['live', 'Live Events'], ['webinars', 'Webinars'],
  ];
  $('evTabs').innerHTML = defs.map(([k, label]) => {
    const n = EV_ALL.filter((e) => evTabFilter(k, e)).length;
    return `<button class="ev-tab ${EV_TAB === k ? 'active' : ''}" onclick="setEvTab('${k}')">${label}${n ? ` (${n})` : ''}</button>`;
  }).join('');
}
function setEvTab(k) { EV_TAB = k; EV_PAGE = 1; renderEvTabs(); drawEventList(); }

function renderEvStats() {
  const quests = EV_ALL.filter((e) => e.kind === 'quest').length;
  const hacks = EV_ALL.filter((e) => e.kind === 'hackathon' || e.kind === 'competition').length;
  const live = EV_ALL.filter((e) => e.status === 'live').length;
  const gems = (ME && ME.gamify && ME.gamify.gems) || 0;
  const parts = EV_ALL.reduce((s, e) => s + (e.entries_count || 0), 0);
  const ic = {
    q: '<path d="M4 5h16M4 12h16M4 19h10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
    t: '<path d="M6 4h12v3a6 6 0 0 1-12 0V4zM9 15h6M12 15v4M8 21h8" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
    l: '<circle cx="12" cy="12" r="3.2" stroke="currentColor" stroke-width="1.8" fill="none"/><path d="M6 6a8 8 0 0 0 0 12M18 6a8 8 0 0 1 0 12" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round"/>',
    g: '<path d="M6 3h12l3.5 5.5L12 21 2.5 8.5 6 3z" fill="currentColor" opacity=".9"/>',
    p: '<circle cx="9" cy="8" r="3.2" stroke="currentColor" stroke-width="1.8" fill="none"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M16 5.5a3 3 0 0 1 0 5.5M21 20c0-2.4-1.4-4.5-3.5-5.4" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round"/>',
  };
  const cell = (cls, icon, val, label) => `<div class="ev-stat ${cls}"><span class="ev-stat-ic"><svg viewBox="0 0 24 24" fill="none">${icon}</svg></span><div><b>${val}</b><span>${label}</span></div></div>`;
  $('evStats').innerHTML =
    cell('c1', ic.q, quests, 'Open Quests') +
    cell('c2', ic.t, hacks, 'Hackathons') +
    cell('c3', ic.l, live, 'Live Events') +
    cell('c4', ic.g, gems.toLocaleString(), 'My Gems Earned') +
    cell('c5', ic.p, parts.toLocaleString(), 'Participants');
}

function evThumb(ev) {
  const base = EV_THUMB[ev.kind] || EV_THUMB.quest;
  const glyph = (ev.compiler && EV_LANG_GLYPH[ev.compiler]) || base.glyph;
  return `<div class="ev-thumb" style="background:${base.g}"><span class="glyph">${glyph}</span></div>`;
}
function evKindClass(ev) { return ev.status === 'live' && ev.kind !== 'quest' ? 'live' : ev.kind; }
function evKindTag(ev) { return ev.status === 'live' && ev.kind === 'webinar' ? 'Live Event' : (EV_KIND_TAG[ev.kind] || ev.kind); }

function drawEventList() {
  const fmtDeadline = (d) => { try { return new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }); } catch { return d; } };
  const q = ($('evSearch').value || '').toLowerCase().trim();
  const fd = $('evDiff').value, fl = $('evLang').value, fdur = $('evDur').value, sort = $('evSort').value;
  let rows = EV_ALL.filter((e) => evTabFilter(EV_TAB, e));
  if (q) rows = rows.filter((e) => (e.title + ' ' + (e.description || '')).toLowerCase().includes(q));
  if (fd) rows = rows.filter((e) => (e.problems || []).some((p) => p.difficulty === fd) || (!( e.problems || []).length && fd === 'Easy'));
  if (fl) rows = rows.filter((e) => (e.compiler || 'none') === fl);
  if (fdur) rows = rows.filter((e) => { const m = e.duration_minutes || 0; return fdur === 'short' ? (m && m < 15) : fdur === 'mid' ? (m >= 15 && m <= 60) : m > 60; });
  if (sort === 'old') rows.sort((a, b) => a.id - b.id);
  else if (sort === 'points') rows.sort((a, b) => evPoints(b) - evPoints(a));
  else rows.sort((a, b) => b.id - a.id);

  const total = rows.length;
  const pages = Math.max(1, Math.ceil(total / EV_PER));
  if (EV_PAGE > pages) EV_PAGE = pages;
  const slice = rows.slice((EV_PAGE - 1) * EV_PER, EV_PAGE * EV_PER);

  if (!total) { $('evList').innerHTML = '<div class="empty">No events match your filters right now - try clearing them, or watch the Announcements tab.</div>'; $('evPager').innerHTML = ''; return; }

  const clock = '<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.8"/><path d="M12 7v5l3 2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';
  const star = '<svg viewBox="0 0 24 24" fill="none"><path d="M12 3l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9 6.8 19.2l1-5.8L3.5 9.2l5.9-.9L12 3z" stroke="currentColor" stroke-width="1.6"/></svg>';
  const langI = '<svg viewBox="0 0 24 24" fill="none"><path d="m8 8-4 4 4 4M16 8l4 4-4 4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  $('evList').innerHTML = slice.map((ev) => {
    const diff = evDiff(ev);
    const durL = evDurLabel(ev);
    const cta = !ME ? 'Sign in to join' : ev.my_entry ? 'Continue' : ev.kind === 'webinar' ? 'Join Live' : ev.kind === 'quest' ? 'Open Quest' : 'View Details';
    const pill = ev.my_entry ? '<span class="ev-pill reg">Registered</span>'
      : ev.status === 'upcoming' ? '<span class="ev-pill up">Upcoming</span>'
      : ev.entry === 'paid' ? `<span class="ev-pill paid">PKR ${ev.fee_pkr}</span>`
      : '<span class="ev-pill free">Free</span>';
    const avg = ev.my_progress && ev.my_progress.avg != null
      ? `<span class="ev-avg">Average so far: ${ev.my_progress.avg}%</span>`
      : ev.entries_count ? `<span class="ev-avg">${ev.entries_count} joined</span>` : '';
    return `<div class="ev-row" onclick="openOpenEvent(${ev.id})" style="cursor:pointer">
      ${evThumb(ev)}
      <div class="ev-body">
        <span class="ev-kind ${evKindClass(ev)}">${evKindTag(ev)}</span>
        <h4>${esc(ev.title)}</h4>
        <div class="desc">${esc(ev.description || 'Join this event and start earning gems.')}</div>
        <div class="ev-meta">
          <span class="m">${star} ${evPoints(ev)} pts</span>
          <span class="m">${langI} ${EV_LANG_SHORT[ev.compiler] || 'Submission'}</span>
          <span class="m"><span class="dot" style="background:${DIFF_DOT[diff]}"></span>${diff}</span>
          ${durL ? `<span class="m">${clock} ${durL}</span>` : ''}
          ${ev.deadline ? `<span class="m" style="color:var(--danger)">${clock} Due ${fmtDeadline(ev.deadline)}</span>` : ''}
        </div>
      </div>
      <div class="ev-aside" onclick="event.stopPropagation()">
        ${pill}
        <button class="ev-cta ${ev.my_entry ? 'solid' : ''}" onclick="openOpenEvent(${ev.id})">${cta}</button>
        ${avg}
      </div>
    </div>`;
  }).join('');

  // pager
  if (pages <= 1) { $('evPager').innerHTML = ''; return; }
  let btns = `<button ${EV_PAGE === 1 ? 'disabled' : ''} onclick="evGoPage(${EV_PAGE - 1})">&lsaquo;</button>`;
  for (let i = 1; i <= pages; i++) {
    if (i === 1 || i === pages || Math.abs(i - EV_PAGE) <= 1) btns += `<button class="${i === EV_PAGE ? 'active' : ''}" onclick="evGoPage(${i})">${i}</button>`;
    else if (i === EV_PAGE - 2 || i === EV_PAGE + 2) btns += '<button disabled>…</button>';
  }
  btns += `<button ${EV_PAGE === pages ? 'disabled' : ''} onclick="evGoPage(${EV_PAGE + 1})">&rsaquo;</button>`;
  $('evPager').innerHTML = btns;
}
function evGoPage(p) { EV_PAGE = p; drawEventList(); window.scrollTo({ top: 0, behavior: 'smooth' }); }
async function loadCerts() {
  try {
    const d = await api('/api/certificates/mine');
    if (!d.certificates.length) { $('certBox').innerHTML = ''; return; }
    $('certBox').innerHTML = `<div class="card"><div class="card-head"><h3>My certificates</h3><span class="s" style="color:var(--muted)">QR-verified · Share to LinkedIn</span></div>
      <div class="card-body tight">${d.certificates.map((c) => `
        <div class="list-row" style="padding:10px 4px">
          <div class="grow"><div class="t">${esc(c.title)}</div>
            <div class="s" style="color:var(--muted)">${esc(c.kind)} · ${esc(c.completion_date)} · Serial <span class="mono">${esc(c.serial)}</span></div></div>
          <a class="btn btn-teal btn-sm" href="${esc(c.url)}" target="_blank" rel="noopener">View and download</a>
        </div>`).join('')}</div></div>`;
  } catch { $('certBox').innerHTML = ''; }
}
/* ------------------------------- my profile (v18) -------------------------------
 * Open (free) accounts' own dashboard: gems/stage/streak, every free quest
 * track attempted, hackathons and events joined, challenges, certificates,
 * and self-service password change (or first-time set, for Google accounts).
 */
function openProfileTab() { openTab('profile'); loadProfile(); }
function profFmtDate(d) {
  if (!d) return '—';
  try { return new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }); } catch { return d; }
}
function profTrackRow(t) {
  const pct = t.total ? Math.round((t.graded / t.total) * 100) : 0;
  return `<div class="list-row">
    <div class="grow">
      <div class="t">${esc(t.title)}${t.free ? ' <span class="kbadge quest">Free course</span>' : ''}</div>
      <div class="s" style="color:var(--muted)">${t.graded}/${t.total} tasks graded${t.avg != null ? ' &middot; avg ' + t.avg + '%' : ''} &middot; ${t.gems} gems earned</div>
      <div class="cl-bar" style="margin-top:6px;max-width:280px"><div class="cl-fill" style="width:${pct}%"></div></div>
    </div>
    <span class="grade-chip ${t.passed ? 'ok' : (t.complete ? 'wait' : 'none')}">${t.passed ? 'Passed' : (t.complete ? 'Completed' : 'In progress')}</span>
  </div>`;
}
function profHackRow(h) {
  const cls = h.status === 'ended' ? (h.score != null ? 'ok' : 'none') : 'wait';
  return `<div class="list-row">
    <div class="grow"><div class="t">${esc(h.title)}</div>
      <div class="s" style="color:var(--muted)">Team: ${esc(h.team_name)} &middot; registered ${profFmtDate((h.registered_at || '').slice(0, 10))}${h.submitted ? ' &middot; submitted' : ''}${h.score != null ? ' &middot; score ' + h.score + '%' : ''}</div></div>
    <span class="grade-chip ${cls}">${esc(h.status)}</span>
  </div>`;
}
function profEventRow(e) {
  const cls = ['ended', 'closed'].includes(e.status) ? (e.score != null ? 'ok' : 'none') : 'wait';
  return `<div class="list-row">
    <div class="grow"><div class="t">${esc(e.title)} <span class="kbadge ${e.kind === 'webinar' ? 'webinar' : e.kind === 'hackathon' ? 'hackathon' : 'quest'}">${esc(e.kind)}</span></div>
      <div class="s" style="color:var(--muted)">registered ${profFmtDate((e.registered_at || '').slice(0, 10))}${e.submitted ? ' &middot; submitted' : ''}${e.score != null ? ' &middot; score ' + e.score + '%' : ''}</div></div>
    <span class="grade-chip ${cls}">${esc(e.status)}</span>
  </div>`;
}
function profChallRow(c) {
  const cls = { approved: 'ok', pending: 'wait', rejected: 'none' }[c.status] || 'none';
  return `<div class="list-row">
    <div class="grow"><div class="t">${esc(c.title)}</div></div>
    <span class="grade-chip ${cls}">${c.status === 'approved' ? 'Solved &middot; ' + c.gems + ' gems' : esc(c.status)}</span>
  </div>`;
}
function profCertRow(c) {
  return `<div class="list-row">
    <div class="grow"><div class="t">${esc(c.title)}</div>
      <div class="s" style="color:var(--muted)">${esc(c.kind)} &middot; ${profFmtDate(c.completion_date)} &middot; Serial <span class="mono">${esc(c.serial)}</span></div></div>
    <a class="btn btn-teal btn-sm" href="${esc(c.url)}" target="_blank" rel="noopener">View</a>
  </div>`;
}
async function loadProfile() {
  const box = $('profileBox');
  if (!ME) { box.innerHTML = gateCardHtml('Sign in to see your profile.'); return; }
  box.innerHTML = '<div class="empty">Loading&hellip;</div>';
  let d;
  try { d = await api('/api/my/open-profile'); }
  catch (e) { box.innerHTML = `<div class="empty">${esc(e.message)}</div>`; return; }
  const p = d.profile;
  box.innerHTML = `
    <div class="card"><div class="card-body" style="display:flex;gap:18px;align-items:center;flex-wrap:wrap">
      <span class="av-sm" style="width:64px;height:64px;font-size:24px;flex:none">${p.avatar ? `<img src="${esc(p.avatar)}" alt="">` : esc((p.name || '?').charAt(0).toUpperCase())}</span>
      <div style="flex:1;min-width:220px">
        <div style="font-size:19px;font-weight:700;font-family:var(--font-display)">${esc(p.name)}</div>
        <div class="s" style="color:var(--muted)">Reg no <span class="mono">${esc(p.reg_no || '—')}</span>${p.email ? ' &middot; ' + esc(p.email) : ''} &middot; member since ${profFmtDate(p.member_since)}</div>
        <div class="s" style="margin-top:4px">${esc(p.stage.name)} stage</div>
      </div>
      <div style="display:flex;gap:22px;text-align:center">
        <div><div style="font-family:var(--font-display);font-size:22px;color:var(--ink)">${p.gems.toLocaleString()}</div><div class="s" style="color:var(--muted-2);font-size:11px;text-transform:uppercase">Gems</div></div>
        <div><div style="font-family:var(--font-display);font-size:22px;color:var(--ink)">${p.streak}</div><div class="s" style="color:var(--muted-2);font-size:11px;text-transform:uppercase">Streak</div></div>
        <div><div style="font-family:var(--font-display);font-size:22px;color:var(--ink)">${p.best_streak}</div><div class="s" style="color:var(--muted-2);font-size:11px;text-transform:uppercase">Best</div></div>
      </div>
    </div></div>

    <div class="card"><div class="card-head"><h3>Free courses &amp; quests</h3><span class="s" style="color:var(--muted)">${p.tracks.length} attempted</span></div>
      <div class="card-body tight">${p.tracks.length ? p.tracks.map(profTrackRow).join('') : `<div class="empty">No free quests attempted yet - <a href="javascript:void(0)" onclick="openTab('courses')">open a course</a>.</div>`}</div></div>

    <div class="card"><div class="card-head"><h3>Hackathons</h3><span class="s" style="color:var(--muted)">${p.hackathons.length} joined</span></div>
      <div class="card-body tight">${p.hackathons.length ? p.hackathons.map(profHackRow).join('') : '<div class="empty">No hackathons joined yet.</div>'}</div></div>

    <div class="card"><div class="card-head"><h3>Events</h3><span class="s" style="color:var(--muted)">${p.events.length} joined</span></div>
      <div class="card-body tight">${p.events.length ? p.events.map(profEventRow).join('') : '<div class="empty">No events joined yet.</div>'}</div></div>

    <div class="card"><div class="card-head"><h3>Challenges</h3><span class="s" style="color:var(--muted)">${p.challenges.length} attempted</span></div>
      <div class="card-body tight">${p.challenges.length ? p.challenges.map(profChallRow).join('') : '<div class="empty">No challenges attempted yet.</div>'}</div></div>

    <div class="card"><div class="card-head"><h3>Certificates</h3><span class="s" style="color:var(--muted)">${p.certificates.length} earned</span></div>
      <div class="card-body tight">${p.certificates.length ? p.certificates.map(profCertRow).join('') : '<div class="empty">Complete a free course to earn your first certificate.</div>'}</div></div>

    <div class="card"><div class="card-head"><h3>Account</h3></div>
      <div class="card-body">
        <div class="form-msg" id="pwMsg"></div>
        <form id="pwForm">
          ${p.has_password ? `<label class="field"><span>Current password</span><input name="current" type="password" required></label>` : `<p class="s" style="color:var(--muted);margin-bottom:10px">You signed up with Google and don't have a password yet - set one below as a backup way to sign in.</p>`}
          <label class="field"><span>New password</span><input name="next" type="password" minlength="8" required placeholder="At least 8 characters"></label>
          <button class="btn btn-primary" id="pwBtn">${p.has_password ? 'Change password' : 'Set password'}</button>
        </form>
      </div></div>`;
  $('pwForm').addEventListener('submit', async (e) => {
    e.preventDefault(); const f = e.target; const btn = $('pwBtn'); btn.disabled = true;
    const el = $('pwMsg'); el.className = 'form-msg'; el.textContent = '';
    try {
      await api('/api/me/password', { method: 'POST', body: JSON.stringify({ current: f.current ? f.current.value : undefined, next: f.next.value }) });
      el.className = 'form-msg ok'; el.textContent = 'Saved.'; f.reset();
      if (!p.has_password) loadProfile();
    } catch (err) { el.className = 'form-msg err'; el.textContent = err.message; }
    btn.disabled = false;
  });
}

/* ---------------------- event detail (full page) ---------------------- */
let CUR_EV_PID = null;   // selected problem on the detail page
let EV_OUT_TERM = null;  // output terminal for the code editor
let EV_CD_TIMER = null;  // countdown interval
let EV_EDITOR_LIGHT = false;

function evRunnableLang(ev) { return ['python', 'c', 'cpp', 'sql'].includes(ev.compiler) ? ev.compiler : null; }
function evCurProblem() { const ps = (CUR_EVENT && CUR_EVENT.event.problems) || []; return ps.find((p) => p.pid === CUR_EV_PID) || ps[0] || null; }
function evDraftKey(eid, pid) { return `echoev:${eid}:${pid || 0}:${(ME && ME.id) || 0}`; }

async function openOpenEvent(id) {
  if (!ME) { gate('You can browse every event and hackathon freely - joining one needs a free account, so your submissions, gems and certificates have somewhere to live.'); return; }
  try {
    const d = await api(`/api/events/${id}`);
    CUR_EVENT = d;
    const ps = d.event.problems || [];
    CUR_EV_PID = ps.length ? ps[0].pid : null;
    renderEventDetail();
    openTab('eventDetail');
  } catch (e) { toast(e.message, true); }
}

function evCompact(dt) {
  if (!dt) return null;
  const d = new Date(String(dt).replace(' ', 'T'));
  if (isNaN(d)) return null;
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}T${p(d.getHours())}${p(d.getMinutes())}00`;
}
function evPrettyDate(dt) {
  const d = new Date(String(dt).replace(' ', 'T'));
  if (isNaN(d)) return '';
  const mon = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  let h = d.getHours(); const ap = h >= 12 ? 'PM' : 'AM'; h = h % 12 || 12;
  return `${d.getDate()} ${mon[d.getMonth()]} ${d.getFullYear()} • ${h}:${String(d.getMinutes()).padStart(2, '0')} ${ap}`;
}
function evCalLink(ev) {
  const s = evCompact(ev.starts_at || ev.ends_at), e = evCompact(ev.ends_at || ev.starts_at);
  if (!s || !e) return null;
  const q = new URLSearchParams({ action: 'TEMPLATE', text: ev.title, dates: `${s}/${e}`, details: (ev.description || '').slice(0, 400) });
  return `https://calendar.google.com/calendar/render?${q.toString()}`;
}

function renderEventDetail() {
  const d = CUR_EVENT, ev = d.event;
  const p = evCurProblem();
  const points = p ? p.points : (ev.problems || []).reduce((s, x) => s + (x.points || 0), 0) || 100;
  const diff = p ? DIFF(p.difficulty) : evDiff(ev);
  const durL = evDurLabel(ev);
  const prog = d.my_progress;
  const clock = '<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.8"/><path d="M12 7v5l3 2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';
  const star = '<svg viewBox="0 0 24 24" fill="none"><path d="M12 3l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9 6.8 19.2l1-5.8L3.5 9.2l5.9-.9L12 3z" stroke="currentColor" stroke-width="1.6"/></svg>';
  const langI = '<svg viewBox="0 0 24 24" fill="none"><path d="m8 8-4 4 4 4M16 8l4 4-4 4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const checkI = '<svg viewBox="0 0 24 24" fill="none"><path d="M9 12l2 2 4-4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.6"/></svg>';

  // ---- left sidebar: info card ----
  const tags = [
    `<span class="evd-tag"><span class="dot" style="width:7px;height:7px;border-radius:50%;background:${DIFF_DOT[diff]}"></span>${diff}</span>`,
    `<span class="evd-tag">${points} pts</span>`,
    `<span class="evd-tag">${EV_LANG_SHORT[ev.compiler] || 'Submission'}</span>`,
    durL ? `<span class="evd-tag">${durL}</span>` : '',
    ev.auto_grade ? `<span class="evd-tag">Instant Grading</span>` : '',
    ev.auto_grade ? `<span class="evd-tag">10% Reduction</span>` : '',
    ev.auto_certificate ? `<span class="evd-tag good">Certificate at ${ev.pass_mark}%+</span>` : '',
    ev.deadline ? `<span class="evd-tag" style="color:#B23A3A">Due ${esc(new Date(ev.deadline + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }))}</span>` : '',
  ].join('');
  const card = `<div class="evd-card">
    <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:10px;margin-bottom:12px">
      <span class="evd-badge ${esc(ev.kind)}" style="margin-bottom:0">${evKindTag(ev)}</span>
      ${evLangBadgeHtml(ev.compiler)}
    </div>
    <h3>${esc(ev.title)}</h3>
    <div class="cdesc">${esc((ev.description || '').slice(0, 150))}${(ev.description || '').length > 150 ? '…' : ''}</div>
    <div class="evd-tags">${tags}</div>
    <div class="evd-parts">${(ev.entries_count || 0).toLocaleString()} participants</div>
    <div class="evd-prog"><div style="width:${prog && prog.avg != null ? Math.min(100, prog.avg) : 4}%"></div></div>
  </div>`;

  // ---- nav ----
  const navDefs = [
    ['overview', 'Overview', '<circle cx="12" cy="12" r="9"/><path d="M12 8v4l3 2"/>'],
    ['problem', 'Problem Statement', '<path d="M6 3h9l3 3v15H6z"/><path d="M9 9h6M9 13h6M9 17h4"/>'],
    ['instructions', 'Instructions', '<path d="M9 6h9M9 12h9M9 18h9M4 6h.01M4 12h.01M4 18h.01"/>'],
    ['submissions', 'Submissions', '<path d="M4 4h16v12H4z"/><path d="M8 20h8M12 16v4"/>'],
    ['leaderboard', 'Leaderboard', '<path d="M8 21V9M16 21V5M4 21h16"/>'],
    ['discussion', 'Discussion', '<path d="M5 5h14v10H9l-4 4z"/>'],
  ];
  const cCount = (d.comments || []).length;
  const nav = `<div class="evd-nav">${navDefs.map(([k, label, path]) =>
    `<a onclick="evNavGo('${k}')" data-sec="${k}"><svg class="ic" viewBox="0 0 24 24">${path}</svg>${label}${k === 'discussion' && cCount ? `<span class="cnt">${cCount}</span>` : ''}</a>`).join('')}</div>`;

  // ---- countdown card ----
  let countCard = '';
  if (ev.ends_at) {
    const cal = evCalLink(ev);
    countCard = `<div class="evd-count">
      <div class="lbl">Event ends in</div>
      <div class="cd-grid">
        <div class="cd-box"><b id="cd-d">--</b><span>Days</span></div>
        <div class="cd-box"><b id="cd-h">--</b><span>Hours</span></div>
        <div class="cd-box"><b id="cd-m">--</b><span>Mins</span></div>
        <div class="cd-box"><b id="cd-s">--</b><span>Secs</span></div>
      </div>
      <div class="ends">${evPrettyDate(ev.ends_at)}</div>
      ${cal ? `<a class="btn btn-ghost btn-sm btn-block cal" href="${esc(cal)}" target="_blank" rel="noopener">Add to calendar</a>` : ''}
    </div>`;
  } else if (ev.status === 'live') {
    countCard = `<div class="evd-count"><div class="lbl">Status</div><div class="task-status ok" style="margin:0">Open now — no deadline. Solve any time.</div></div>`;
  }

  // ---- middle column sections ----
  const banner = ev.auto_grade
    ? `<div class="evd-banner">${checkI}<span>Submissions are graded instantly, with a 10% reduction in score.</span></div>` : '';
  const regBtn = !d.my_entry && ['upcoming', 'live'].includes(ev.status)
    ? `<button class="btn btn-primary" onclick="regOpenEvent(${ev.id})">Register${ev.entry === 'paid' ? ' — PKR ' + ev.fee_pkr : ' — Free'}</button>` : '';
  const statusMsg = d.my_entry && !d.can_participate ? `<div class="task-status wait" style="margin-top:12px">${esc(d.participate_msg)}</div>`
    : prog && prog.passed ? `<div class="task-status ok" style="margin-top:12px"><strong>Passed with ${prog.avg}%</strong> — your certificate is under Events › My certificates.</div>` : '';

  // problem statement block (shared by Overview + Problem Statement)
  const selector = (ev.problems || []).length > 1
    ? `<div class="evd-chips" style="margin-bottom:12px">${ev.problems.map((x) =>
        `<span class="evd-chip" style="cursor:pointer;${x.pid === CUR_EV_PID ? 'border-color:var(--primary);color:var(--primary)' : ''}" onclick="evSelectProblem(${x.pid})">${esc(x.title)}</span>`).join('')}</div>` : '';
  const body = p ? esc(p.description || 'No description provided.') : esc(ev.description || 'See the instructions and documents for details.');
  const ioBlock = p && (p.input_spec || p.output_spec) ? `
    <h4>Input</h4><p>${esc(p.input_spec || 'No input is provided.')}</p>
    <h4>Output</h4><p>${esc(p.output_spec || 'No output should be produced.')}</p>` : '';
  const hasExample = p && (p.example_input || p.example_output);
  const problemBlock = `${selector}<p>${body}</p>${ioBlock}
    <details class="evd-ex"><summary>▾ Examples</summary>
      <div class="evd-ex-row"><div class="k">Input</div><div class="v">${hasExample ? esc(p.example_input || '(none)') : '(see the problem statement)'}</div></div>
      <div class="evd-ex-row"><div class="k">Output</div><div class="v">${hasExample ? esc(p.example_output || '(none)') : 'Produce the result described above.'}</div></div>
    </details>`;

  const problemSec = `<div class="evd-sec" id="evdSec-problem">
    <h3>Problem Statement</h3>
    ${problemBlock}
  </div>`;

  // instructions
  const files = (ev.files || []).length
    ? `<h4>Documents</h4><p>${ev.files.map((f) => `<a href="${esc(f.url)}" target="_blank" rel="noopener">${esc(f.name)}</a>`).join(' &nbsp;·&nbsp; ')}</p>` : '';
  const instructionsSec = `<div class="evd-sec" id="evdSec-instructions">
    <h3>Instructions</h3>
    <p class="muted">Reach the pass mark of <strong>${ev.pass_mark}%</strong> to clear this ${EV_KIND_LABEL[ev.kind].toLowerCase()}.${ev.auto_certificate ? ' A verified certificate is issued automatically when you pass.' : ''}${ev.entry === 'paid' ? ` Entry fee: PKR ${ev.fee_pkr}.` : ' This event is free to enter.'}</p>
    ${ev.dataset_url ? '<h4>Dataset</h4><p class="muted">A dataset is loaded into the editor automatically when you run your code.</p>' : ''}
    ${files}
  </div>`;

  // submissions
  const subs = Object.values(d.my_submissions || {}).filter((s) => s && s.submitted_at)
    .sort((a, b) => String(b.submitted_at).localeCompare(a.submitted_at));
  const subRows = subs.length ? subs.map((s, i) => {
    const passed = s.score != null && s.score >= ev.pass_mark;
    const cls = s.score == null ? 'wait' : passed ? 'ok' : 'bad';
    const label = s.score == null ? 'Grading' : passed ? 'Accepted' : 'Wrong Answer';
    const icon = s.score == null ? '<path d="M12 7v5l3 2" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round"/><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.6" fill="none"/>'
      : passed ? '<path d="M9 12l2 2 4-4" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.6" fill="none"/>'
      : '<path d="M15 9l-6 6M9 9l6 6" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round"/><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.6" fill="none"/>';
    return `<div class="sub-row">
      <span class="sub-ic ${cls}"><svg viewBox="0 0 24 24" fill="none">${icon}</svg></span>
      <div class="grow"><div class="st">Submission #${subs.length - i}${i === 0 ? ' (Latest)' : ''}</div><div class="sub-when">Submitted ${esc(s.submitted_at)}</div>${s.graded_by === 'ai' ? '<div class="sub-when">10% reduction applied</div>' : ''}</div>
      <span class="sub-tag ${cls}">${label}</span>
      ${s.score != null ? `<span class="sub-score">${s.score}/100 pts</span>` : ''}
      ${s.pid ? `<button class="sub-link" onclick="evSelectProblem(${s.pid});evScrollWork()">View details ›</button>` : ''}
    </div>`;
  }).join('') : '<p class="muted">No submissions yet — write your solution and submit it from the editor.</p>';
  const submissionsSec = `<div class="evd-sec" id="evdSec-submissions">
    <h3>Your Submissions</h3>
    ${subRows}
    ${d.can_participate ? '<button class="btn btn-primary btn-block" style="margin-top:6px" onclick="evScrollWork()">+ New Submission</button>' : ''}
  </div>`;

  const overview = `<div class="evd-sec" id="evdSec-overview">
    <div class="evd-titlerow"><h2>${esc(ev.title)}</h2><span class="evd-star" title="Featured">${star}</span></div>
    <div class="evd-chips" style="margin:12px 0">
      <span class="evd-chip">${star} ${points} points</span>
      <span class="evd-chip">${langI} ${EV_LANG_LABEL[ev.compiler] || 'File / link'}</span>
      <span class="evd-chip"><span class="dot" style="background:${DIFF_DOT[diff]}"></span>${diff}</span>
      ${durL ? `<span class="evd-chip">${clock} ${durL}</span>` : ''}
      ${ev.auto_grade ? `<span class="evd-chip">${checkI} Instant Grading</span>` : ''}
    </div>
    ${banner}
    ${regBtn ? `<div style="margin:12px 0">${regBtn}</div>` : ''}
    ${statusMsg}
    <h3 style="margin-top:16px">Problem Statement</h3>
    ${problemBlock}
    <h3 style="margin-top:20px">Your Submissions</h3>
    ${subRows}
    ${d.can_participate ? '<button class="btn btn-primary btn-block" style="margin-top:6px" onclick="evScrollWork()">+ New Submission</button>' : ''}
  </div>`;

  // leaderboard
  const board = (d.board || []).slice(0, 12);
  const boardRows = board.length ? board.map((b, i) => `<div class="sub-row" style="${b.user_id === (ME && ME.id) ? 'border-color:var(--primary);background:var(--violet-soft)' : ''}">
      <span class="sub-ic ${i < 3 ? 'ok' : 'wait'}" style="font-weight:800">${i + 1}</span>
      <div class="grow"><div class="st">${esc(b.name)}${b.user_id === (ME && ME.id) ? ' (you)' : ''}</div><div class="sub-when">${b.submissions} submission${b.submissions === 1 ? '' : 's'} · ${b.tier}</div></div>
      ${b.avg != null ? `<span class="sub-score">${b.avg}%</span>` : '<span class="sub-tag wait">Pending</span>'}
    </div>`).join('') : '<p class="muted">No scores on the board yet — be the first to submit.</p>';
  const leaderboardSec = `<div class="evd-sec" id="evdSec-leaderboard"><h3>Leaderboard</h3>${boardRows}</div>`;

  // discussion
  const discussionSec = `<div class="evd-sec" id="evdSec-discussion"><h3>Discussion</h3><div id="evDisc"></div></div>`;

  const main = `<div class="evd-main">${overview}${problemSec}${instructionsSec}${submissionsSec}${leaderboardSec}${discussionSec}</div>`;

  // ---- right column: workspace ----
  const work = renderEventWorkspace();

  $('evDetail').innerHTML =
    `<div class="evd-side">${card}${nav}${countCard}</div>${main}${work}`;

  // wire editor + discussion + countdown
  wireEventWorkspace();
  renderDiscussion();
  startEventCountdown();
  evNavGo('overview');
}

function renderEventWorkspace() {
  const d = CUR_EVENT, ev = d.event;
  const p = evCurProblem();
  const lang = evRunnableLang(ev);
  const sub = p ? (d.my_submissions[p.pid] || null) : (d.my_submissions[0] || null);

  // not able to participate yet
  if (!d.can_participate) {
    const why = d.my_entry ? esc(d.participate_msg || 'Waiting for access.') : 'Register for this event to unlock the workspace and start submitting.';
    return `<div class="evd-work"><div class="evd-sec"><h3>Workspace</h3><p class="muted">${why}</p>
      ${!d.my_entry && ['upcoming', 'live'].includes(ev.status) ? `<button class="btn btn-primary btn-block" style="margin-top:12px" onclick="regOpenEvent(${ev.id})">Register${ev.entry === 'paid' ? ' — PKR ' + ev.fee_pkr : ' — Free'}</button>` : ''}
    </div></div>`;
  }

  // webinar: join link
  if (ev.kind === 'webinar') {
    return `<div class="evd-work"><div class="evd-sec"><h3>Join the session</h3>
      ${ev.meeting_link ? `<p class="muted" style="margin-bottom:12px">You are registered. Use the link below at the scheduled time.</p><a class="btn btn-primary btn-block" href="${esc(ev.meeting_link)}" target="_blank" rel="noopener">Join the webinar</a>`
        : '<p class="muted">You are registered. The join link will appear here before the session starts.</p>'}
    </div></div>`;
  }

  const feedback = renderFeedback(sub, ev);

  // code editor
  if (lang) {
    const draft = localStorage.getItem(evDraftKey(ev.id, p && p.pid));
    const code = (sub && sub.code) || draft || '';
    return `<div class="evd-work">
      <div class="ide2" id="ide2">
        <div class="ide2-bar">
          <span class="ttl">Code Editor</span><span class="sp"></span>
          <span class="ide2-lang">${EV_LANG_LABEL[lang]}</span>
          <span class="ide2-toggle" onclick="evToggleEditorTheme()">Dark<span class="ide2-sw" id="ide2Sw"></span></span>
        </div>
        <div class="ide2-editor">
          <div class="ide2-gutter" id="evGutter"><span>1</span></div>
          <textarea class="ide2-code" id="evCode" spellcheck="false" placeholder="# Write your code here"></textarea>
        </div>
        <div class="ide2-actions">
          <button class="ide2-run" id="evRunBtn" onclick="evRunCode()"><svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M7 5v14l11-7z"/></svg>Run Code</button>
          <button class="ide2-ghost" onclick="evClearOutput()">Clear</button>
          <span class="sp"></span>
          <button class="ide2-ghost" onclick="evSaveDraft()">Save Draft</button>
          <button class="ide2-submit" id="evSubmitBtn" onclick="evSubmitCode()">${sub ? 'Resubmit' : 'Submit for Grading'}</button>
        </div>
      </div>
      <div class="ide2-out"><div class="oh">Output</div><div class="ob" id="evOutBody"><span class="ph">Run your code to see the output here...</span></div></div>
      ${feedback}
      <textarea id="evCodeSeed" style="display:none">${esc(code)}</textarea>
    </div>`;
  }

  // file / link submission
  return `<div class="evd-work">
    <div class="evd-sec"><h3>Submit your work</h3>
      <form id="evFileForm">
        <label class="field"><span>Your work as a file (any document)</span><input name="file" type="file"></label>
        <label class="field"><span>Or a link to your project</span><input name="link" type="url" placeholder="https://github.com/you/repo"></label>
        <button class="ide2-submit btn-block" style="justify-content:center" id="evSubmitBtn">${sub ? 'Resubmit' : 'Submit for Grading'}</button>
      </form>
    </div>
    ${feedback}
  </div>`;
}

function renderFeedback(sub, ev) {
  if (!sub || sub.score == null) {
    if (sub) return `<div class="ide2-fb pending"><div><div class="fh">Feedback</div><div class="ftxt">Your submission is in the grading queue — check back shortly.</div></div></div>`;
    return `<div class="ide2-fb empty"><div><div class="fh">Feedback</div><div class="ftxt">Submit your solution to see your score and feedback here.</div></div></div>`;
  }
  const passed = sub.score >= ev.pass_mark;
  const ring = passed ? 'var(--ok)' : sub.score >= ev.pass_mark * 0.6 ? '#D89A00' : '#D14370';
  const lead = passed ? '✓ Great job! Your solution is correct.' : '✗ Keep going — review the feedback and resubmit.';
  return `<div class="ide2-fb${passed ? '' : ' pending'}">
    <div><div class="fh">Feedback</div>
      <div class="ftxt"><span class="${passed ? 'ok' : 'bad'}">${lead}</span>${sub.ai_feedback ? '<br>' + esc(sub.ai_feedback) : ''}</div>
    </div>
    <div style="text-align:center">
      <div class="score-ring" style="--pct:${sub.score};--ring-color:${ring}"><span class="val">${sub.score}<span style="font-size:12px;color:var(--muted)">/100</span></span></div>
      ${sub.graded_by === 'ai' ? '<div class="sub-note">10% reduction applied</div>' : ''}
    </div>
  </div>`;
}

function wireEventWorkspace() {
  EV_OUT_TERM = null; // the previous output terminal's DOM was just replaced
  const seed = $('evCodeSeed'), code = $('evCode');
  if (code) {
    if (seed) code.value = seed.value;
    EchoRun.wireEditor(code);
    code.addEventListener('input', evSyncGutter);
    code.addEventListener('scroll', () => { const g = $('evGutter'); if (g) g.scrollTop = code.scrollTop; });
    evSyncGutter();
    if (EV_EDITOR_LIGHT) $('ide2').classList.add('light'), $('ide2Sw') && $('ide2Sw').classList.add('off');
  }
  const ff = $('evFileForm');
  if (ff) ff.addEventListener('submit', (e) => { e.preventDefault(); evSubmitFile(ff); });
}
function evSyncGutter() {
  const code = $('evCode'), g = $('evGutter'); if (!code || !g) return;
  const n = code.value.split('\n').length || 1;
  let h = ''; for (let i = 1; i <= n; i++) h += `<span>${i}</span>`;
  g.innerHTML = h; g.scrollTop = code.scrollTop;
}
function evToggleEditorTheme() {
  EV_EDITOR_LIGHT = !EV_EDITOR_LIGHT;
  const ide = $('ide2'), sw = $('ide2Sw');
  if (ide) ide.classList.toggle('light', EV_EDITOR_LIGHT);
  if (sw) sw.classList.toggle('off', EV_EDITOR_LIGHT);
}

function evSelectProblem(pid) { CUR_EV_PID = pid; renderEventDetail(); }
function evScrollWork() { const w = document.querySelector('.evd-work'); if (w) w.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
// The left nav switches the middle column between sections (one visible at a
// time) so the page stays roughly one screen tall.
function evNavGo(sec) {
  document.querySelectorAll('.evd-main > .evd-sec').forEach((s) => { s.style.display = s.id === 'evdSec-' + sec ? '' : 'none'; });
  evSetActiveNav(sec);
}
function evSetActiveNav(sec) { document.querySelectorAll('.evd-nav a').forEach((a) => a.classList.toggle('active', a.dataset.sec === sec)); }

function startEventCountdown() {
  stopEventCountdown();
  const ev = CUR_EVENT && CUR_EVENT.event;
  if (!ev || !ev.ends_at || !$('cd-d')) return;
  const end = new Date(String(ev.ends_at).replace(' ', 'T')).getTime();
  const tick = () => {
    if (!$('cd-d')) { stopEventCountdown(); return; }
    let s = Math.max(0, Math.floor((end - Date.now()) / 1000));
    const dd = Math.floor(s / 86400); s -= dd * 86400;
    const hh = Math.floor(s / 3600); s -= hh * 3600;
    const mm = Math.floor(s / 60); s -= mm * 60;
    const p = (n) => String(n).padStart(2, '0');
    $('cd-d').textContent = p(dd); $('cd-h').textContent = p(hh); $('cd-m').textContent = p(mm); $('cd-s').textContent = p(s);
  };
  tick(); EV_CD_TIMER = setInterval(tick, 1000);
}
function stopEventCountdown() { if (EV_CD_TIMER) { clearInterval(EV_CD_TIMER); EV_CD_TIMER = null; } }

/* -------- run / submit / draft -------- */
async function evRunCode() {
  const ev = CUR_EVENT.event, lang = evRunnableLang(ev);
  const btn = $('evRunBtn'), code = $('evCode');
  if (!code.value.trim()) { evOutText('Write some code first.'); return; }
  if (EchoRun.isRunning()) { EchoRun.cancel(); btn.innerHTML = evRunLabel(); return; }
  if (!EV_OUT_TERM) { $('evOutBody').innerHTML = ''; EV_OUT_TERM = EchoTerm.mount($('evOutBody')); }
  EV_OUT_TERM.clear();
  btn.innerHTML = '■ Stop';
  const files = [];
  if (ev.dataset_url) { try { files.push(await EchoRun.fetchDataset(ev.dataset_url)); } catch (e) { EV_OUT_TERM.print('[Dataset: ' + e.message + ']\n'); } }
  for (const f of (ev.files || [])) if (/\.(csv|tsv|txt|json)$/i.test(f.name)) files.push({ name: f.name, url: f.url });
  try { await EchoRun.executeAny(lang, code.value, { term: EV_OUT_TERM, files, onStatus: () => {} }); }
  catch (e) { EV_OUT_TERM.print('\n[' + e.message + ']\n'); }
  btn.innerHTML = evRunLabel();
}
function evRunLabel() { return '<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M7 5v14l11-7z"></path></svg>Run Code'; }
function evOutText(t) { const b = $('evOutBody'); if (b) b.innerHTML = `<span class="ph">${esc(t)}</span>`; }
function evClearOutput() { if (EV_OUT_TERM) EV_OUT_TERM.clear(); else evOutText('Run your code to see the output here...'); }
function evSaveDraft() {
  const ev = CUR_EVENT.event, p = evCurProblem(), code = $('evCode');
  if (!code) return;
  localStorage.setItem(evDraftKey(ev.id, p && p.pid), code.value);
  toast('Draft saved on this device.');
}
async function evSubmitCode() {
  const ev = CUR_EVENT.event, p = evCurProblem(), lang = evRunnableLang(ev);
  const code = $('evCode').value;
  if (!code.trim()) { toast('Write your solution in the editor first.', true); return; }
  const btn = $('evSubmitBtn'); btn.disabled = true; btn.textContent = 'Grading…';
  const fd = new FormData();
  if (p) fd.set('pid', p.pid);
  fd.set('code', code); fd.set('language', lang);
  try {
    const out = await api(`/api/events/${ev.id}/submit`, { method: 'POST', body: fd });
    localStorage.removeItem(evDraftKey(ev.id, p && p.pid));
    afterSubmitToast(out);
    await openOpenEvent(ev.id);
  } catch (err) { toast(err.message, true); btn.disabled = false; btn.textContent = 'Submit for Grading'; }
}
async function evSubmitFile(form) {
  const ev = CUR_EVENT.event, p = evCurProblem();
  const fd = new FormData(form);
  if (p) fd.set('pid', p.pid);
  if (!fd.get('file') || !fd.get('file').size) fd.delete('file');
  if (!fd.get('link')) fd.delete('link');
  if (!fd.has('file') && !fd.get('link')) { toast('Attach a file or paste a link first.', true); return; }
  const btn = $('evSubmitBtn'); btn.disabled = true; btn.textContent = 'Submitting…';
  try {
    const out = await api(`/api/events/${ev.id}/submit`, { method: 'POST', body: fd });
    afterSubmitToast(out);
    await openOpenEvent(ev.id);
  } catch (err) { toast(err.message, true); btn.disabled = false; btn.textContent = 'Submit for Grading'; }
}
function afterSubmitToast(out) {
  const ev = CUR_EVENT && CUR_EVENT.event;
  if (out.cert) toast(`Passed — certificate ${out.cert.serial} issued. Find it under Events › My certificates.`);
  else if (out.submission && out.submission.score != null) toast(`Graded: ${out.submission.score}/100. ${certGapMsg(out.progress, ev)}`);
  else toast('Submitted — it will be graded soon.');
  loadEvents(); loadCerts();
}
// Explains, in one line, exactly why a graded submission did NOT issue a
// certificate yet - so "graded but no certificate" is never a mystery.
function certGapMsg(prog, ev) {
  if (!prog || !ev) return '';
  if (!ev.auto_certificate) return 'This event does not auto-issue certificates.';
  if (prog.graded < prog.total) return `${prog.graded}/${prog.total} tasks graded so far - your certificate issues once every task is graded and passing.`;
  if (prog.avg != null && prog.avg < ev.pass_mark) return `Average ${prog.avg}% is below the ${ev.pass_mark}% pass mark needed.`;
  return '';
}

/* -------- registration (modal) -------- */
function regOpenEvent(eid) {
  const ev = CUR_EVENT.event;
  openModal(`Register: ${ev.title}`, `
    <form id="regForm">
      ${ev.entry === 'paid' ? `
        <p class="hint" style="margin:0 0 10px">${esc(ev.pay_instructions || `Send PKR ${ev.fee_pkr} to the academy's account, take a screenshot of the transaction, and upload the picture below. The admin verifies it before you can participate.`)}</p>
        <label class="field"><span>Screenshot of your payment transaction (PNG / JPG)</span><input name="file" type="file" accept=".png,.jpg,.jpeg,.webp" required></label>` :
      '<p class="s" style="color:var(--muted);margin-bottom:10px">This event is free - register and you are in.</p>'}
      <button class="btn btn-primary btn-block">Register</button></form>`);
  $('regForm').addEventListener('submit', async (e) => {
    e.preventDefault(); const f = e.target; const btn = f.querySelector('button'); btn.disabled = true;
    try {
      await api(`/api/events/${eid}/register`, { method: 'POST', body: new FormData(f) });
      toast(ev.entry === 'paid' ? 'Registered - your payment screenshot is being verified.' : 'Registered - good luck.');
      closeModal();
      await openOpenEvent(eid); loadEvents();
    } catch (err) { modalMsg(err.message); btn.disabled = false; }
  });
}

/* -------- discussion -------- */
function renderDiscussion() {
  const d = CUR_EVENT, box = $('evDisc'); if (!box) return;
  const comments = d.comments || [];
  const form = `<form class="disc-form" id="discForm">
      <textarea name="body" placeholder="Ask a question or share a tip…" required></textarea>
      <button class="btn btn-primary" style="align-self:flex-start">Post</button>
    </form>`;
  const list = comments.length ? comments.map((c) => {
    const init = (c.name || '?').charAt(0).toUpperCase();
    const canDel = c.user_id === (ME && ME.id) || ['admin', 'instructor'].includes(ME && ME.role);
    return `<div class="disc-item">
      <div class="disc-av">${c.avatar ? `<img src="${esc(c.avatar)}" alt="">` : init}</div>
      <div class="disc-main">
        <div class="disc-head"><span class="disc-name">${esc(c.name)}</span>${c.staff ? '<span class="disc-staff">Staff</span>' : ''}<span class="disc-when">${esc(c.created_at)}</span>${canDel ? `<button class="disc-del" onclick="deleteEventComment(${c.id})">Delete</button>` : ''}</div>
        <div class="disc-body">${esc(c.body)}</div>
      </div>
    </div>`;
  }).join('') : '<p class="muted" style="color:var(--muted)">No comments yet — start the conversation.</p>';
  box.innerHTML = form + list;
  $('discForm').addEventListener('submit', postEventComment);
}
async function postEventComment(e) {
  e.preventDefault();
  const f = e.target, btn = f.querySelector('button'), body = f.body.value.trim();
  if (!body) return;
  btn.disabled = true;
  try {
    const out = await api(`/api/events/${CUR_EVENT.event.id}/comments`, { method: 'POST', body: JSON.stringify({ body }) });
    CUR_EVENT.comments = (CUR_EVENT.comments || []).concat(out.comment);
    renderDiscussion(); evBumpCommentCount();
  } catch (err) { toast(err.message, true); btn.disabled = false; }
}
async function deleteEventComment(cid) {
  try {
    await api(`/api/events/${CUR_EVENT.event.id}/comments/${cid}`, { method: 'DELETE' });
    CUR_EVENT.comments = (CUR_EVENT.comments || []).filter((c) => c.id !== cid);
    renderDiscussion(); evBumpCommentCount();
  } catch (err) { toast(err.message, true); }
}
function evBumpCommentCount() {
  const link = document.querySelector('.evd-nav a[data-sec="discussion"]'); if (!link) return;
  const n = (CUR_EVENT.comments || []).length;
  let cnt = link.querySelector('.cnt');
  if (!n && cnt) { cnt.remove(); return; }
  if (n) { if (!cnt) { cnt = document.createElement('span'); cnt.className = 'cnt'; link.appendChild(cnt); } cnt.textContent = n; }
}
