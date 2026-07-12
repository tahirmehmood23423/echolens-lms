'use strict';

/* EchoLens Open (v12.3)
 * The public face of the academy:
 *  - Home, Courses (full catalogue) and Announcements are open to everyone.
 *  - Quests are organised inside their course, exactly like the LMS portal:
 *    every level and task is listed; the first week is open on paid courses,
 *    everything is open on free courses, the rest shows locked.
 *  - Solving and submitting needs a free account (Google or email, with the
 *    email checked for a real domain and, when SMTP is on, a mailed code).
 *  - Submissions are AI-graded with a 10% reduction, pay out gems, and free
 *    courses issue an automatic verified certificate on completion.
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
$('modal').addEventListener('click', (e) => { if (e.target === $('modal')) closeModal(); });
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
  if (isFree) return 'linear-gradient(135deg,#0FBFA8,#0A9384)';
  if (tier === 'Specialist Track') return 'linear-gradient(135deg,#7C3AED,#4F46E5)';
  if (tier === 'Short Course') return 'linear-gradient(135deg,#2563EB,#1D4ED8)';
  return 'linear-gradient(135deg,#9333EA,#7C3AED)';
}
const STAGE_FALLBACK = [{ key: 'spark', name: 'Spark', min: 0 }, { key: 'glow', name: 'Glow', min: 250 }, { key: 'beam', name: 'Beam', min: 700 }, { key: 'prism', name: 'Prism', min: 1400 }, { key: 'aurora', name: 'Aurora', min: 2400 }, { key: 'nova', name: 'Nova', min: 4000 }];

let ME = null;
let GOOGLE_ON = false;
let TRACKS = [];         // quest list (all courses)
let CATALOGUE = [];
let CAT_LINKS = null;
let CUR = null;          // { track, levels, progress } for the open course
let CUR_PROBLEM = null;  // { level, pid, problem }
let SV_TERM = null;
let SV_FILES = [];
let CUR_EVENT = null;

/* -------------------------------- boot -------------------------------- */
(async () => {
  try { ME = await api('/api/auth/me'); } catch { ME = null; }
  try { const p = await api('/api/auth/providers'); GOOGLE_ON = !!p.google; } catch {}
  drawUserBox();
  if (ME) requireWhatsapp();
  loadCatalogue();
  loadTracks();
  loadAnnouncements();
  loadHomeStats();
  if (ME) { loadEvents(); loadCerts(); } else { $('evList').innerHTML = gateCardHtml('Events are for signed-in members - creating a free account takes a minute.'); }
  // Deep links: /open#courses, #quests, #events, #announcements, #register, #signup
  const h = (location.hash || '').replace('#', '');
  if (['courses', 'quests', 'events', 'announcements', 'home'].includes(h)) openTab(h);
  else if (h === 'register') openRegister();
  else if (h === 'signup' && !ME) gate();
})();

function drawUserBox() {
  $('userBox').innerHTML = ME
    ? `<span class="av-sm" style="width:30px;height:30px;margin-right:9px">${ME.avatar ? `<img src="${esc(ME.avatar)}" alt="">` : esc((ME.name || '?').charAt(0).toUpperCase())}</span>
       <span class="s" style="color:var(--muted);margin-right:10px">${esc(ME.name)}${ME.reg_no ? ' · <span class="mono">' + esc(ME.reg_no) + '</span>' : ''}</span>
       ${ME.role !== 'free' ? '<a class="btn btn-teal btn-sm" href="/dashboard" style="margin-right:8px">LMS Portal</a>' : ''}
       <button class="btn btn-ghost btn-sm" onclick="logout()">Sign out</button>`
    : `<button class="btn btn-ghost btn-sm" onclick="openRegister()" style="margin-right:8px">Register</button>
       <button class="btn btn-primary btn-sm" onclick="gate()">Sign in - free</button>`;
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
  openModal('Sign in to EchoLens - free', `
    <p class="s" style="color:var(--muted);margin-bottom:14px">${esc(afterMsg || 'Everything here is free - the quests, the compiler, the certificates. We just need to know who is learning.')}</p>
    ${GOOGLE_ON ? `<a class="btn btn-primary btn-block" href="/auth/google?back=/open" style="margin-bottom:10px">Continue with Google</a>` : ''}
    <button class="btn btn-teal btn-block" style="margin-bottom:10px" onclick="showSignup()">Create a free account with email</button>
    <a class="btn btn-ghost btn-block" href="/login">Already have an account? Sign in</a>
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
      <label class="field"><span>Password (8+ characters)</span><input name="password" type="password" minlength="8" required></label>
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
      await api('/api/auth/register-open', {
        method: 'POST',
        body: JSON.stringify({ name: f.name.value, email: f.email.value.trim(), whatsapp: f.whatsapp.value, password: f.password.value, code: f.code ? f.code.value.trim() : undefined }),
      });
      location.reload();
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
  ['home', 'courses', 'quests', 'course', 'solve', 'events', 'eventDetail', 'announcements'].forEach((t) => {
    const el = $('tab-' + t); if (el) el.style.display = t === tab ? '' : 'none';
  });
  document.querySelectorAll('.open-nav .nlink[data-tab]').forEach((n) =>
    n.classList.toggle('active', n.dataset.tab === tab || (tab === 'course' && n.dataset.tab === 'quests') || (tab === 'solve' && n.dataset.tab === 'quests') || (tab === 'eventDetail' && n.dataset.tab === 'events')));
  if (tab !== 'eventDetail') stopEventCountdown();
  window.scrollTo({ top: 0 });
}
function backToCourse() { if (CUR) { openTab('course'); } else openTab('quests'); }

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
  $('homeStats').innerHTML = items.map(([bg, ic, n, l]) =>
    `<div class="si"><div class="si-ic" style="background:${bg}"><svg viewBox="0 0 24 24" fill="none">${ICONS[ic]}</svg></div><div><b>${n}</b><span>${esc(l)}</span></div></div>`
  ).join('') + (students ? `<div class="si"><div class="si-ic" style="background:#0FBFA8"><svg viewBox="0 0 24 24" fill="none">${ICONS.bot}</svg></div><div><b>${students}+</b><span>Learners</span></div></div>` : '');
}
function renderHomePreview() {
  const g = ME && ME.gamify;
  const stages = STAGE_FALLBACK;
  const stageName = g ? g.stage.name : 'Beam';
  const level = stages.findIndex((s) => s.name === stageName) + 1 || 3;
  const gems = g ? g.gems : 3240;
  const pct = g ? g.stage.progress : 62;
  const nextLine = g && g.stage.next ? `${g.stage.to_next} gems to <strong style="color:var(--ink)">${esc(g.stage.next.name)}</strong>` : (g ? 'Highest stage reached' : '760 gems to <strong style="color:var(--ink)">Prism</strong>');
  const streak = g ? g.streak : 12;
  $('homePreview').innerHTML = `
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
          <div class="s" style="font-size:12.5px;color:var(--muted);margin-bottom:8px">Pick up your next quest</div>
          <button class="btn btn-primary btn-sm" style="width:100%;justify-content:center" onclick="openTab('quests')">Continue</button>
        </div>
      </div>
    </div>`;
}
function renderJourney() {
  const g = ME && ME.gamify;
  const stages = (g && g.stages) || STAGE_FALLBACK;
  const curKey = g ? g.stage.key : null;
  const idx = curKey ? stages.findIndex((s) => s.key === curKey) : -1;
  $('homeJourney').innerHTML = stages.map((s, i) => {
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
    $('homeUpdates').innerHTML = ANNS.length ? ANNS.slice(0, 4).map(upd).join('') : '<div class="empty">No updates yet - check back soon.</div>';
  } catch {
    $('annList').innerHTML = '<div class="empty">Announcements are unavailable right now.</div>';
    $('homeUpdates').innerHTML = '<div class="empty">Updates are unavailable right now.</div>';
  }
}

/* ------------------------------- catalogue ------------------------------- */
async function loadCatalogue() {
  try {
    const d = await api('/api/public/catalogue');
    CATALOGUE = d.catalogue;
    CAT_LINKS = d.links;
    if (d.cohort) $('cohortLine').textContent = `31 live, instructor-led programs · Registration deadline ${d.cohort.registration_deadline} · Batch starts ${d.cohort.batch_starts}. Every paid course opens its first week free - try before you enrol.`;
    $('actionStrip').innerHTML = `
      <button class="btn btn-primary" onclick="openRegister()">Register for a paid course</button>
      ${CAT_LINKS.webinar ? `<a class="btn btn-teal" href="${esc(CAT_LINKS.webinar)}" target="_blank" rel="noopener">${esc(CAT_LINKS.webinar_label || 'Free webinar')}</a>` : ''}
      ${CAT_LINKS.ambassador ? `<a class="btn btn-ghost" href="${esc(CAT_LINKS.ambassador)}" target="_blank" rel="noopener">Campus Ambassador program</a>` : ''}`;
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
          <div class="s" style="color:var(--muted)"><s>PKR ${p.full_pkr.toLocaleString()}</s> · Save PKR ${p.save_pkr.toLocaleString()} (about 15%)</div>
          <button class="lc-btn-solve" style="margin-top:6px" onclick="openRegister('PATH', '${esc(p.title)}')">Register for the path</button>
        </div>
      </div></div>` : '';
    drawCourses();
  } catch (e) { $('courseTable').innerHTML = `<div class="empty">${esc(e.message)}</div>`; }
}
const BADGE_LABEL = { free: 'FREE', new: 'NEW', high_demand: 'HIGH DEMAND', flagship: 'FLAGSHIP' };
const BADGE_CLASS = { free: 'quest', new: 'webinar', high_demand: 'competition', flagship: 'hackathon' };
const COURSE_PILLS = [['all', 'All'], ['Bootcamp', 'Bootcamps'], ['Short Course', 'Short Courses'], ['Specialist Track', 'Specialist Tracks'], ['free', 'Free']];
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
  const isDark = c.tier === 'Specialist Track';
  const icon = pickIcon(c.title);
  const demand = (c.badges || []).find((b) => ['high_demand', 'flagship', 'new'].includes(b));
  return `
    <div class="oc-card${isDark ? ' dark' : ''}${isFree ? ' teal' : ''}" onclick="courseAction('${esc(c.code)}')">
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
        <div class="oc-price${isFree ? ' free' : ''}">${isFree ? 'FREE' : 'PKR ' + c.price_pkr.toLocaleString()}</div>
        <button type="button" class="btn ${isFree ? 'btn-teal' : 'btn-primary'} oc-btn" onclick="event.stopPropagation();courseAction('${esc(c.code)}')">${isFree ? 'Start now' : 'Register'}</button>
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
    <p class="hint" style="margin-top:14px">Ambassador discounts: 10% off bootcamps and short courses, 15% off specialist tracks with a campus ambassador code. Pay via bank transfer per your fee challan, then share the receipt to confirm your seat.</p>`
    : '<div class="empty">No courses match those filters.</div>';
}
function courseAction(code) {
  const c = CATALOGUE.find((x) => x.code === code);
  if (!c) return;
  if (c.price_pkr > 0) { openRegister(c.code, c.title); return; }
  if (c.track_key) openCourse(c.track_key);
}

/* ------------------- in-site registration form (item 6) ------------------- */
function openRegister(code, title) {
  const options = CATALOGUE.filter((c) => c.price_pkr > 0).map((c) =>
    `<option value="${esc(c.code)}|${esc(c.title)}"${c.code === code ? ' selected' : ''}>${esc(c.code)} - ${esc(c.title)} (PKR ${c.price_pkr.toLocaleString()})</option>`).join('');
  openModal('Register for a course', `
    <p class="s" style="color:var(--muted);margin-bottom:12px">Share your details and the EchoLens team will contact you on WhatsApp with the fee challan and next steps. Registration deadline: 31 July 2026 · Batch starts 1 August 2026.</p>
    <form id="regInterest">
      <input name="company" style="display:none" tabindex="-1" autocomplete="off">
      <label class="field"><span>Full name</span><input name="name" required value="${ME ? esc(ME.name) : ''}"></label>
      <div class="form-grid">
        <label class="field" style="grid-column:span 2"><span>Email</span><input name="email" type="email" required value="${ME && ME.email ? esc(ME.email) : ''}"></label>
        <label class="field"><span>WhatsApp</span><input name="whatsapp" required placeholder="03XX-XXXXXXX" inputmode="tel" value="${ME && ME.profile && ME.profile.phone ? esc(ME.profile.phone) : ''}"></label>
      </div>
      <div class="form-grid">
        <label class="field" style="grid-column:span 2"><span>Course</span><select name="course">${code === 'PATH' ? `<option value="PATH|${esc(title)}" selected>${esc(title)} (bundle - PKR 43,500)</option>` : ''}${options}</select></label>
        <label class="field"><span>City</span><input name="city" placeholder="e.g. Islamabad"></label>
      </div>
      <label class="field"><span>Anything we should know? (optional)</span><input name="note" maxlength="600" placeholder="e.g. Preferred timing, ambassador code"></label>
      <button class="btn btn-primary btn-block">Submit registration</button>
    </form>`);
  $('regInterest').addEventListener('submit', async (e) => {
    e.preventDefault(); const f = e.target; const btn = f.querySelector('button'); btn.disabled = true; modalMsg('');
    const [course_code, course_title] = f.course.value.split('|');
    try {
      await api('/api/public/register-interest', {
        method: 'POST',
        body: JSON.stringify({ name: f.name.value, email: f.email.value.trim(), whatsapp: f.whatsapp.value, city: f.city.value, note: f.note.value, course_code, course_title, company: f.company.value }),
      });
      openModal('Registration received', `
        <p class="s" style="line-height:1.6">Thank you - your registration for <strong>${esc(course_title)}</strong> is with the team. We will contact you on WhatsApp with the fee challan and next steps.</p>
        <button class="btn btn-primary btn-block" style="margin-top:14px" onclick="closeModal()">Done</button>`);
    } catch (err) { modalMsg(err.message); btn.disabled = false; }
  });
}

/* --------------------------- quests: course list --------------------------- */
let TRACK_PROGRESS = {};
async function loadTracks() {
  try {
    const d = await api('/api/public/tracks');
    TRACKS = d.tracks;
    if (ME && ME.gamify) $('myGems').innerHTML = `<span class="prob-chip" style="cursor:default">${ME.gamify.gems} gems · ${esc(ME.gamify.stage.name)}</span>`;
    drawTracks();
    if (ME) {
      const results = await Promise.allSettled(TRACKS.map((t) => api('/api/open/progress?track=' + encodeURIComponent(t.key))));
      results.forEach((r, i) => { if (r.status === 'fulfilled') TRACK_PROGRESS[TRACKS[i].key] = r.value.progress; });
      drawTracks();
    }
  } catch (e) { $('trackGrid').innerHTML = `<div class="empty">${esc(e.message)}</div>`; }
}
const QUEST_PILLS = [['all', 'All'], ['BC', 'Bootcamps'], ['SC', 'Short Courses'], ['ST', 'Specialist Tracks'], ['free', 'Free']];
function setQuestPill(kind) {
  if (kind === 'free') { $('qFree').value = 'free'; $('qTier').value = ''; }
  else if (kind === 'all') { $('qFree').value = ''; $('qTier').value = ''; }
  else { $('qTier').value = kind; $('qFree').value = ''; }
  drawTracks();
}
function syncQuestFilters() { renderQuestPills(); }
function renderQuestPills() {
  const tier = $('qTier').value, free = $('qFree').value;
  $('qPills').innerHTML = QUEST_PILLS.map(([k, label]) => {
    const active = k === 'all' ? (!tier && !free) : k === 'free' ? free === 'free' : tier === k;
    return `<button type="button" class="filt-pill${active ? ' active' : ''}" onclick="setQuestPill('${k}')">${esc(label)}</button>`;
  }).join('');
}
function questCardHtml(t) {
  const prog = TRACK_PROGRESS[t.key];
  const icon = pickIcon(t.title);
  const pct = prog && prog.total ? Math.round((prog.graded / prog.total) * 100) : 0;
  const levelNow = prog ? Math.min(prog.graded, t.levels) : 0;
  const gemsNow = prog ? prog.gems : 0;
  const cta = t.free ? (prog ? 'Continue' : 'Start the free course') : (prog ? 'Continue' : 'Open Quest');
  return `
    <div class="qc-card${!t.free && !prog ? ' locked' : ''}">
      <div class="qc-top">
        <div class="qc-icon${t.free ? ' teal' : ''}"><svg viewBox="0 0 24 24" fill="none">${ICONS[icon]}</svg></div>
        <div style="min-width:0">
          <span class="qc-code">${esc(t.course_code || '')}</span>
          <div class="qc-title">${esc(t.title)}</div>
        </div>
        ${!t.free ? `<span class="qc-lock" title="First week free - full course needs enrolment"><svg width="12" height="12" viewBox="0 0 24 24" fill="none"><rect x="5" y="11" width="14" height="9" rx="2" stroke="currentColor" stroke-width="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3" stroke="currentColor" stroke-width="2"/></svg></span>` : ''}
      </div>
      <div class="qc-desc">${esc(t.description || '')}</div>
      <div class="qc-progress"><span>Level ${levelNow}/${t.levels}</span><span>${gemsNow.toLocaleString()}/${t.total_points.toLocaleString()} gems</span></div>
      <div class="qc-bar"><div style="width:${pct}%"></div></div>
      <button type="button" class="btn ${t.free ? 'btn-teal' : 'btn-primary'} qc-cta" onclick="openCourse('${esc(t.key)}')">${cta}</button>
    </div>`;
}
function drawTracks() {
  renderQuestPills();
  const tier = $('qTier').value, free = $('qFree').value, q = $('qSearch').value.trim().toLowerCase();
  const list = TRACKS.filter((t) =>
    (!tier || (t.course_code || '').startsWith(tier)) &&
    (!free || t.free) &&
    (!q || t.title.toLowerCase().includes(q) || (t.course_code || '').toLowerCase().includes(q)));
  $('trackGrid').innerHTML = list.length ? list.map(questCardHtml).join('') : '<div class="empty">No quests match those filters.</div>';
}

/* -------------------- quests: course detail with locks -------------------- */
async function openCourse(key) {
  openTab('course');
  $('courseHead').innerHTML = '<div class="empty">Loading course&hellip;</div>';
  $('courseLevels').innerHTML = '';
  const d = await api('/api/public/tracks/' + encodeURIComponent(key));
  let progress = null;
  if (ME) { try { progress = (await api('/api/open/progress?track=' + encodeURIComponent(key))).progress; } catch {} }
  CUR = { ...d, progress };
  drawCourse();
}
function drawCourse() {
  const t = CUR.track, prog = CUR.progress;
  const cat = CATALOGUE.find((c) => c.code === t.course_code);
  $('courseHead').innerHTML = `
    <div class="card" style="margin-bottom:16px"><div class="card-body">
      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:6px">
        ${t.free ? '<span class="kbadge quest">FREE COURSE</span>' : ''}
        <span class="mono s" style="color:var(--muted-2)">${esc(t.course_code || '')}</span>
        <span class="s" style="color:var(--muted)">Pass mark ${t.pass_mark || 60}% · ${t.submission_mode === 'file' ? 'File submissions (PDF, Word, PNG, JPEG)' : 'Code submissions in the built-in compiler'} · Graded instantly</span>
      </div>
      <h2 style="font-family:var(--font-display);font-size:24px;color:var(--ink)">${esc(t.title)}</h2>
      <p class="s" style="color:var(--muted);margin-top:4px">${esc(t.description || '')}</p>
      ${prog ? `
        <div class="oq-prog" style="margin-top:12px"><div style="width:${Math.round((prog.graded / Math.max(1, prog.total)) * 100)}%"></div></div>
        <div class="s" style="margin-top:6px;color:${prog.passed ? 'var(--ok)' : 'var(--muted)'}">
          ${prog.graded}/${prog.total} tasks graded · ${prog.gems} gems earned${prog.avg != null ? ' · Average ' + prog.avg + '%' : ''}
          ${prog.passed ? ' · <strong>Course passed - your certificate is issued.</strong>' : (t.free ? ' · Complete every task at ' + (t.pass_mark || 60) + '%+ average for the automatic certificate.' : '')}
        </div>` : (ME ? '' : `<div class="s" style="margin-top:10px;color:var(--muted)">Sign in free to submit, earn gems${t.free ? ' and the certificate' : ''}.</div>`)}
      ${!t.free && cat ? `<button class="btn btn-primary btn-sm" style="margin-top:12px" onclick="openRegister('${esc(cat.code)}', '${esc(cat.title)}')">Register to unlock the full course - PKR ${cat.price_pkr.toLocaleString()}</button>` : ''}
    </div></div>`;
  $('courseLevels').innerHTML = CUR.levels.map((l) => `
    <div class="card" style="margin-bottom:12px">
      <div class="card-head">
        <h3 style="display:flex;gap:10px;align-items:center">Level ${l.no} - ${esc(l.title)}
          ${l.locked ? '<span class="pay-badge na">Locked</span>' : '<span class="pay-badge confirmed">Open</span>'}</h3>
        <span class="s" style="color:var(--muted)">Week ${l.week || l.no}${l.topic ? ' · ' + esc(l.topic) : ''}</span>
      </div>
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
      <div class="s" id="svDesc" style="white-space:pre-line;line-height:1.65;font-size:13.5px;margin-top:8px">${esc(p.description || '')}</div>
      <div class="s" id="svRefs" style="margin-top:10px"></div>
      ${(p.criteria || []).length ? `
        <div class="slv-block">
          <div class="slv-block-head"><svg viewBox="0 0 24 24" fill="none">${ICONS.target}</svg>What we're looking for</div>
          <ul class="slv-criteria">${p.criteria.map((c) => `<li><svg viewBox="0 0 24 24" fill="none">${ICONS.check}</svg>${esc(c)}</li>`).join('')}</ul>
        </div>` : ''}
      <div id="svStatusBox" style="margin-top:14px"></div>
      ${p.hint ? `
        <details class="slv-block slv-hint">
          <summary><svg viewBox="0 0 24 24" fill="none" style="width:16px;height:16px;color:var(--primary)">${ICONS.bulb}</svg><span class="slv-block-head" style="display:inline">Need a hint?</span><svg class="chev" viewBox="0 0 24 24" fill="none">${ICONS.chev}</svg></summary>
          <div class="slv-hint-body">${esc(p.hint)}</div>
        </details>` : ''}
    </div></div>`;
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
  const box = $('svStatusBox'); if (!box) return;
  const sub = CUR.progress && CUR.progress.submissions[`${CUR_PROBLEM.level}:${CUR_PROBLEM.pid}`];
  if (!sub) { box.innerHTML = ''; return; }
  if (sub.score == null) { box.innerHTML = '<div class="task-status wait">Submitted - your grade will appear here once it is marked.</div>'; return; }
  const gems = sub.gems != null ? sub.gems : Math.round((sub.score / 100) * (CUR_PROBLEM.problem.points || 100));
  const feedback = sub.feedback || 'Nice work.';
  const short = feedback.length > 130 ? feedback.slice(0, 130) + '…' : feedback;
  const passMark = CUR.track.pass_mark || 60;
  box.innerHTML = `
    <div class="slv-results">
      <div class="slv-rcard">
        <h5><svg viewBox="0 0 24 24" fill="none">${ICONS.sparkle}</svg>Feedback</h5>
        <p class="s" style="margin:2px 0 0">${esc(short)}</p>
        ${feedback.length > 130 ? `<button type="button" class="slv-link-btn" onclick="showFullFeedback()">View detailed feedback</button>` : ''}
      </div>
      <div class="slv-rcard center">
        <h5>Score</h5>
        <div class="score-ring" style="--pct:${sub.score};--ring-color:${sub.score >= passMark ? 'var(--ok)' : 'var(--gold)'}"><span class="val">${sub.score}%</span></div>
      </div>
      <div class="slv-rcard center">
        <h5><svg viewBox="0 0 24 24" fill="none">${ICONS.gem}</svg>Gems Earned</h5>
        <div class="slv-gem-big"><svg viewBox="0 0 24 24" fill="none">${ICONS.gem}</svg>${gems}</div>
      </div>
      <div class="slv-rcard">
        <h5><svg viewBox="0 0 24 24" fill="none">${ICONS.clock}</svg>Submission</h5>
        <div class="slv-sub-line">Submitted<strong>${esc(fmtSubDate(sub.submitted_at))}</strong></div>
        <div class="slv-sub-line" style="margin-top:6px">Attempts<strong>${sub.attempts || 1}</strong></div>
      </div>
    </div>`;
}
function drawWorkArea() {
  const isLearner = !ME || ['free', 'student'].includes(ME.role);
  const mode = CUR.track.submission_mode;
  if (!isLearner) {
    // Admins and teachers can read and run everything, but submissions are
    // for learners - say so instead of offering a button that would fail.
    $('svWorkArea').innerHTML = mode === 'code' ? `
      <div class="task-ide card">
        <div class="ide-toolbar">
          <select id="svLang"><option value="python">Python 3</option><option value="c">C</option><option value="cpp">C++</option><option value="sql">SQL</option></select>
          <span style="flex:1"></span>
          <button type="button" class="btn btn-ghost btn-sm" onclick="SV_TERM&&SV_TERM.clear()"><svg viewBox="0 0 24 24" fill="none" style="width:14px;height:14px">${ICONS.refresh}</svg>Clear</button>
          <button type="button" class="btn btn-ghost btn-sm" id="svRunBtn" onclick="runSolve()"><svg viewBox="0 0 24 24" fill="none" style="width:14px;height:14px">${ICONS.play}</svg>Run</button>
        </div>
        <textarea id="svCode" class="code-editor ide-editor" spellcheck="false" placeholder="# Staff preview - run code freely. Submissions are for learner accounts."></textarea>
        <div class="ide-status-row"><span class="s" id="svStatus" style="color:var(--muted-2)">Staff preview - submissions are for learner accounts.</span><span style="flex:1"></span><span class="s" id="svExecTime" style="color:var(--muted-2)"></span></div>
        <div id="svTerm"></div>
      </div>` : `
      <div class="card"><div class="card-body"><p class="s" style="color:var(--muted)">Staff preview - this task takes file submissions from learner accounts.</p></div></div>`;
    if (mode === 'code') { SV_TERM = EchoTerm.mount($('svTerm')); EchoRun.wireEditor($('svCode')); }
    return;
  }
  const sub = CUR.progress && CUR.progress.submissions[`${CUR_PROBLEM.level}:${CUR_PROBLEM.pid}`];
  if (mode === 'code') {
    $('svWorkArea').innerHTML = `
      <div class="task-ide card">
        <div class="ide-toolbar">
          <select id="svLang">
            <option value="python">Python 3</option><option value="c">C</option><option value="cpp">C++</option><option value="sql">SQL</option>
          </select>
          <span style="flex:1"></span>
          <label class="btn btn-ghost btn-sm" style="cursor:pointer"><svg viewBox="0 0 24 24" fill="none" style="width:14px;height:14px">${ICONS.database}</svg>Dataset<input type="file" accept=".csv,.tsv,.txt,.json" style="display:none" onchange="svLocalDataset(this)"></label>
          <button type="button" class="btn btn-ghost btn-sm" onclick="SV_TERM&&SV_TERM.clear()"><svg viewBox="0 0 24 24" fill="none" style="width:14px;height:14px">${ICONS.refresh}</svg>Clear</button>
          <button type="button" class="btn btn-ghost btn-sm" id="svRunBtn" onclick="runSolve()"><svg viewBox="0 0 24 24" fill="none" style="width:14px;height:14px">${ICONS.play}</svg>Run</button>
          <button type="button" class="btn lc-btn-solve" id="svSubmitBtn" onclick="submitSolve()">${sub ? 'Resubmit' : 'Submit for grading'}</button>
        </div>
        <textarea id="svCode" class="code-editor ide-editor" spellcheck="false" placeholder="# Write your solution here. Run to test, Submit for grading and gems."></textarea>
        <div class="ide-status-row"><span class="s" id="svStatus" style="color:var(--muted-2)">Ready - runs in your browser, nothing to install.</span><span style="flex:1"></span><span class="s" id="svExecTime" style="color:var(--muted-2)"></span></div>
        <div id="svTerm"></div>
        <p class="hint" style="margin:10px 14px 14px">Submissions are graded instantly, and gems are awarded by score.${CUR.track.free ? ' Complete every task above the pass mark and your verified certificate is issued automatically.' : ''}</p>
      </div>`;
    SV_TERM = EchoTerm.mount($('svTerm'));
    EchoRun.wireEditor($('svCode'));
  } else {
    $('svWorkArea').innerHTML = `
      <div class="card"><div class="card-head"><h3>Submit your work</h3></div>
        <div class="card-body">
          <p class="s" style="color:var(--muted);margin-bottom:12px">This course takes file submissions - upload your deliverable as PDF, Word, PNG, or JPEG (ZIP for multi-file work).</p>
          <form id="svFileForm">
            <label class="field"><span>Your work</span><input name="file" type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.md,.png,.jpg,.jpeg,.zip" required></label>
            <button class="btn lc-btn-solve">${sub ? 'Resubmit for grading' : 'Submit for grading'}</button>
          </form>
          <p class="hint" style="margin-top:10px">Submissions are graded instantly, and gems are awarded by score.${CUR.track.free ? ' Complete every task above the pass mark and your verified certificate is issued automatically.' : ''}</p>
        </div></div>`;
    $('svFileForm').addEventListener('submit', (e) => { e.preventDefault(); submitSolve(e.target); });
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
async function runSolve() {
  const btn = $('svRunBtn'); const status = $('svStatus'); const exec = $('svExecTime');
  const code = $('svCode').value;
  if (!code.trim()) { status.textContent = 'Write some code first.'; return; }
  if (EchoRun.isRunning()) { EchoRun.cancel(); btn.textContent = 'Run'; return; }
  btn.textContent = 'Stop';
  if (exec) exec.textContent = '';
  const started = performance.now();
  try {
    await EchoRun.executeAny($('svLang').value, code, { term: SV_TERM, files: SV_FILES, onStatus: (t) => { status.textContent = t; } });
    if (exec) exec.textContent = 'Execution time: ' + ((performance.now() - started) / 1000).toFixed(2) + 's';
  }
  catch (e) { status.textContent = e.message; }
  btn.textContent = 'Run';
}
async function submitSolve(fileForm) {
  if (!ME) { gate('Sign in free to submit this task, earn gems, and collect certificates.'); return; }
  const fd = new FormData();
  fd.set('track_key', CUR.track.key);
  fd.set('level', CUR_PROBLEM.level);
  fd.set('pid', CUR_PROBLEM.pid);
  if (fileForm) {
    const file = fileForm.file.files[0];
    if (!file) { toast('Choose your file first.', true); return; }
    fd.set('file', file);
  } else {
    const code = $('svCode').value;
    if (!code.trim()) { toast('Write your solution first.', true); return; }
    fd.set('code', code);
    fd.set('language', $('svLang').value);
  }
  const btn = $('svSubmitBtn') || (fileForm && fileForm.querySelector('button'));
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

let EV_ALL = [];
let EV_TAB = 'all';
let EV_PAGE = 1;
const EV_PER = 6;

// event-level helpers derived from its problems
function evPoints(ev) { const p = ev.problems || []; return p.length ? p.reduce((s, x) => s + (x.points || 0), 0) : 100; }
function evDiff(ev) { const p = ev.problems || []; if (!p.length) return 'Easy'; const rank = { Easy: 1, Medium: 2, Hard: 3 }; return p.reduce((m, x) => rank[x.difficulty] > rank[m] ? x.difficulty : m, 'Easy'); }
function evDurLabel(ev) { const m = ev.duration_minutes; if (!m) return null; return m < 60 ? `~${m} min` : `~${Math.round(m / 60)} hr`; }
const DIFF_DOT = { Easy: '#1FA36B', Medium: '#D89A00', Hard: '#D14370' };

async function loadEvents() {
  try {
    const d = await api('/api/events');
    EV_ALL = d.events || [];
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
    const cta = ev.my_entry ? 'Continue' : ev.kind === 'webinar' ? 'Join Live' : ev.kind === 'quest' ? 'Open Quest' : 'View Details';
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
/* ---------------------- event detail (full page) ---------------------- */
let CUR_EV_PID = null;   // selected problem on the detail page
let EV_OUT_TERM = null;  // output terminal for the code editor
let EV_CD_TIMER = null;  // countdown interval
let EV_EDITOR_LIGHT = false;

function evRunnableLang(ev) { return ['python', 'c', 'cpp', 'sql'].includes(ev.compiler) ? ev.compiler : null; }
function evCurProblem() { const ps = (CUR_EVENT && CUR_EVENT.event.problems) || []; return ps.find((p) => p.pid === CUR_EV_PID) || ps[0] || null; }
function evDraftKey(eid, pid) { return `echoev:${eid}:${pid || 0}:${(ME && ME.id) || 0}`; }

async function openOpenEvent(id) {
  if (!ME) { gate('Sign in free to join events and earn certificates.'); return; }
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
    ev.auto_certificate ? `<span class="evd-tag good">Certificate at ${ev.pass_mark}%+</span>` : '',
  ].join('');
  const card = `<div class="evd-card">
    <span class="evd-badge">${evKindTag(ev)}</span>
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
    ? `<div class="evd-banner">${checkI}<span>Submissions are graded instantly the moment you submit.</span></div>` : '';
  const regBtn = !d.my_entry && ['upcoming', 'live'].includes(ev.status)
    ? `<button class="btn btn-primary" onclick="regOpenEvent(${ev.id})">Register${ev.entry === 'paid' ? ' — PKR ' + ev.fee_pkr : ' — Free'}</button>` : '';
  const statusMsg = d.my_entry && !d.can_participate ? `<div class="task-status wait" style="margin-top:12px">${esc(d.participate_msg)}</div>`
    : prog && prog.passed ? `<div class="task-status ok" style="margin-top:12px"><strong>Passed with ${prog.avg}%</strong> — your certificate is under Events › My certificates.</div>` : '';

  const overview = `<div class="evd-sec" id="evdSec-overview">
    <div class="evd-titlerow"><h2>${esc(ev.title)}</h2><span class="evd-star" title="Featured">${star}</span></div>
    <div class="evd-chips" style="margin:12px 0">
      <span class="evd-chip">${star} ${points} points</span>
      <span class="evd-chip">${langI} ${EV_LANG_LABEL[ev.compiler] || 'File / link'}</span>
      <span class="evd-chip"><span class="dot" style="background:${DIFF_DOT[diff]}"></span>${diff}</span>
      ${durL ? `<span class="evd-chip">${clock} ${durL}</span>` : ''}
      ${ev.auto_grade ? `<span class="evd-chip">${checkI} Instant grading</span>` : ''}
    </div>
    ${banner}
    ${regBtn ? `<div style="margin-top:12px">${regBtn}</div>` : ''}
    ${statusMsg}
  </div>`;

  // problem statement (selected problem, with optional selector)
  const selector = (ev.problems || []).length > 1
    ? `<div class="evd-chips" style="margin-bottom:12px">${ev.problems.map((x) =>
        `<span class="evd-chip" style="cursor:pointer;${x.pid === CUR_EV_PID ? 'border-color:var(--primary);color:var(--primary)' : ''}" onclick="evSelectProblem(${x.pid})">${esc(x.title)}</span>`).join('')}</div>` : '';
  const body = p ? esc(p.description || 'No description provided.') : esc(ev.description || 'See the instructions and documents for details.');
  const problemSec = `<div class="evd-sec" id="evdSec-problem">
    <h3>Problem Statement</h3>
    ${selector}
    <p>${body}</p>
    <details class="evd-ex"><summary>▾ Examples</summary>
      <div class="evd-ex-row"><div class="k">Input</div><div class="v">(see the problem statement)</div></div>
      <div class="evd-ex-row"><div class="k">Output</div><div class="v">Produce the result described above.</div></div>
    </details>
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
      <div class="grow"><div class="st">Submission #${subs.length - i}</div><div class="sub-when">Submitted ${esc(s.submitted_at)}</div></div>
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
  evSetActiveNav('overview');
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
  return `<div class="ide2-fb${passed ? '' : ' pending'}">
    <div><div class="fh">Feedback</div>
      <div class="ftxt">${passed ? '<span class="ok">✓ Great job! Your solution meets the requirements.</span>' : 'Keep going — review the feedback and resubmit.'}<br>${esc(sub.ai_feedback || '')}</div>
    </div>
    <div class="score-ring" style="--pct:${sub.score};--ring-color:${ring}"><span class="val">${sub.score}<span style="font-size:12px;color:var(--muted)">/100</span></span></div>
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
function evNavGo(sec) { const el = $('evdSec-' + sec); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); evSetActiveNav(sec); }
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
  if (out.cert) toast(`Passed — certificate ${out.cert.serial} issued. Find it under Events › My certificates.`);
  else if (out.submission && out.submission.score != null) toast(`Graded: ${out.submission.score}/100.`);
  else toast('Submitted — it will be graded soon.');
  loadEvents(); loadCerts();
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
