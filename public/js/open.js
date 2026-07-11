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
  if (ME) { loadEvents(); loadCerts(); } else { $('evGrid').innerHTML = gateCardHtml('Events are for signed-in members - creating a free account takes a minute.'); }
  // Deep links: /open#courses, #quests, #events, #announcements, #register, #signup
  const h = (location.hash || '').replace('#', '');
  if (['courses', 'quests', 'events', 'announcements', 'home'].includes(h)) openTab(h);
  else if (h === 'register') openRegister();
  else if (h === 'signup' && !ME) gate();
})();

function drawUserBox() {
  $('userBox').innerHTML = ME
    ? `<span class="s" style="color:var(--muted);margin-right:10px">${esc(ME.name)}${ME.reg_no ? ' · <span class="mono">' + esc(ME.reg_no) + '</span>' : ''}</span>
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
  ['home', 'courses', 'quests', 'course', 'solve', 'events', 'announcements'].forEach((t) => {
    const el = $('tab-' + t); if (el) el.style.display = t === tab ? '' : 'none';
  });
  document.querySelectorAll('.open-nav .nlink[data-tab]').forEach((n) =>
    n.classList.toggle('active', n.dataset.tab === tab || (tab === 'course' && n.dataset.tab === 'quests') || (tab === 'solve' && n.dataset.tab === 'quests')));
  window.scrollTo({ top: 0 });
}
function backToCourse() { if (CUR) { openTab('course'); } else openTab('quests'); }

/* -------------------------------- home -------------------------------- */
async function loadHomeStats() {
  try {
    const d = await api('/api/public/info');
    $('homeStats').innerHTML = [
      [d.stats.courses, 'Programs'], [d.stats.students, 'Students'], [3, 'Free courses'],
    ].map(([n, l]) => `<div class="an-card" style="text-align:center;min-width:110px"><div class="n">${n}</div><div class="l">${l}</div></div>`).join('');
  } catch { $('homeStats').innerHTML = ''; }
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
    $('homeAnnouncements').innerHTML = ANNS.length ? `
      <h3 style="font-family:var(--font-display);font-size:20px;color:var(--ink);margin:26px 0 12px">Latest announcements</h3>
      ${ANNS.slice(0, 2).map(item).join('')}
      <button class="btn btn-ghost btn-sm" onclick="openTab('announcements')">All announcements</button>` : '';
  } catch { $('annList').innerHTML = '<div class="empty">Announcements are unavailable right now.</div>'; }
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
function drawCourses() {
  if (!CATALOGUE.length) return;
  const tier = $('cTier').value, mode = $('cFree').value, q = $('cSearch').value.trim().toLowerCase();
  const list = CATALOGUE.filter((c) =>
    (!tier || c.tier === tier) &&
    (!mode || (mode === 'free' ? c.price_pkr === 0 : c.price_pkr > 0)) &&
    (!q || c.title.toLowerCase().includes(q) || c.code.toLowerCase().includes(q) || (c.summary || '').toLowerCase().includes(q)));
  $('courseTable').innerHTML = list.length ? `
    <table class="lc-table">
      <thead><tr><th style="width:70px">Code</th><th>Program</th><th>Tier</th><th>Duration</th><th style="text-align:right">Fee</th><th></th></tr></thead>
      <tbody>${list.map((c) => `
        <tr onclick="courseAction('${esc(c.code)}')">
          <td class="mono s" style="color:var(--muted)">${esc(c.code)}</td>
          <td>
            <strong>${esc(c.title)}</strong>
            ${(c.badges || []).map((b) => ` <span class="kbadge ${BADGE_CLASS[b] || 'quest'}" style="font-size:9.5px">${BADGE_LABEL[b] || b}</span>`).join('')}
            <div class="s" style="color:var(--muted);margin-top:2px">${esc(c.summary || '')}</div>
            ${c.price_pkr === 0 ? '<div class="s" style="color:var(--ok)">Fully free - complete the quest and a verified certificate is issued automatically.</div>' : '<div class="s" style="color:var(--muted-2)">First week free in the quests - remaining levels unlock with enrolment.</div>'}
          </td>
          <td class="s" style="color:var(--muted)">${esc(c.tier)}</td>
          <td class="s" style="color:var(--muted)">${c.weeks} wks · ${c.hours} hrs</td>
          <td style="text-align:right">${c.price_pkr > 0 ? '<strong>PKR ' + c.price_pkr.toLocaleString() + '</strong>' : '<strong style="color:var(--ok)">FREE</strong>'}</td>
          <td style="text-align:right"><button class="lc-btn-solve" onclick="event.stopPropagation();courseAction('${esc(c.code)}')">${c.price_pkr > 0 ? 'Register' : 'Start free'}</button></td>
        </tr>`).join('')}
      </tbody></table>
    <p class="hint" style="margin-top:10px">Ambassador discounts: 10% off bootcamps and short courses, 15% off specialist tracks with a campus ambassador code. Pay via bank transfer per your fee challan, then share the receipt to confirm your seat.</p>`
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
async function loadTracks() {
  try {
    const d = await api('/api/public/tracks');
    TRACKS = d.tracks;
    if (ME && ME.gamify) $('myGems').innerHTML = `<span class="prob-chip" style="cursor:default">${ME.gamify.gems} gems · ${esc(ME.gamify.stage.name)}</span>`;
    drawTracks();
  } catch (e) { $('trackGrid').innerHTML = `<div class="empty">${esc(e.message)}</div>`; }
}
function drawTracks() {
  const tier = $('qTier').value, free = $('qFree').value, q = $('qSearch').value.trim().toLowerCase();
  const list = TRACKS.filter((t) =>
    (!tier || (t.course_code || '').startsWith(tier)) &&
    (!free || t.free) &&
    (!q || t.title.toLowerCase().includes(q) || (t.course_code || '').toLowerCase().includes(q)));
  $('trackGrid').innerHTML = list.length ? list.map((t) => `
    <div class="oq-card">
      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
        ${t.free ? '<span class="kbadge quest">FREE</span>' : ''}
        <span class="mono s" style="color:var(--muted-2)">${esc(t.course_code || '')}</span>
      </div>
      <h4 style="font-size:15px;color:var(--ink)">${esc(t.title)}</h4>
      <div class="s" style="color:var(--muted);font-size:12.5px">${esc((t.description || '').slice(0, 120))}</div>
      <div class="s" style="color:var(--muted)">${t.levels} levels · ${t.total_points} gems total${t.free ? ' · Certificate on completion' : ' · First week open'}</div>
      <button class="lc-btn-solve" style="margin-top:6px" onclick="openCourse('${esc(t.key)}')">${t.free ? 'Start the free course' : 'Open the quest'}</button>
    </div>`).join('') : '<div class="empty">No quests match those filters.</div>';
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
        <span class="s" style="color:var(--muted)">Pass mark ${t.pass_mark || 60}% · ${t.submission_mode === 'file' ? 'File submissions (PDF, Word, PNG, JPEG)' : 'Code submissions in the built-in compiler'} · AI graded with a 10% reduction</span>
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
function openSolve(levelNo, pid) {
  const lvl = CUR.levels.find((l) => l.no === levelNo);
  const p = lvl && (lvl.problems || []).find((x) => x.pid === pid);
  if (!p || lvl.locked) return;
  CUR_PROBLEM = { level: levelNo, pid, problem: p };
  openTab('solve');
  $('svTitle').textContent = p.title;
  $('svDiff').innerHTML = `<span class="lc-diff ${DIFF(p.difficulty)}">${DIFF(p.difficulty)}</span>`;
  $('svDesc').textContent = p.description || '';
  $('svRefs').innerHTML = (p.refs || []).length
    ? '<strong>Resources and documentation:</strong><br>' + p.refs.map((r) => `<a href="${esc(r[1])}" target="_blank" rel="noopener">${esc(r[0])}</a>`).join(' · ')
    : '';
  drawSolveStatus();
  drawWorkArea();
}
function drawSolveStatus() {
  const sub = CUR.progress && CUR.progress.submissions[`${CUR_PROBLEM.level}:${CUR_PROBLEM.pid}`];
  $('svStatusBox').innerHTML = sub
    ? (sub.score != null
      ? `<div class="task-status ok">Graded ${sub.score}% (AI, 10% reduction applied) · ${Math.round((sub.score / 100) * (CUR_PROBLEM.problem.points || 100))} gems earned${sub.feedback ? `<br><span class="s">${esc(sub.feedback)}</span>` : ''}</div>`
      : '<div class="task-status wait">Submitted - your grade will appear here once it is marked.</div>')
    : '';
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
          <button type="button" class="btn btn-ghost btn-sm" onclick="SV_TERM&&SV_TERM.clear()">Clear</button>
          <button type="button" class="btn btn-ghost btn-sm" id="svRunBtn" onclick="runSolve()">Run</button>
        </div>
        <textarea id="svCode" class="code-editor ide-editor" spellcheck="false" placeholder="# Staff preview - run code freely. Submissions are for learner accounts."></textarea>
        <div class="ide-status-row"><span class="s" id="svStatus" style="color:var(--muted-2)">Staff preview - submissions are for learner accounts.</span></div>
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
          <label class="btn btn-ghost btn-sm" style="cursor:pointer">Dataset<input type="file" accept=".csv,.tsv,.txt,.json" style="display:none" onchange="svLocalDataset(this)"></label>
          <button type="button" class="btn btn-ghost btn-sm" onclick="SV_TERM&&SV_TERM.clear()">Clear</button>
          <button type="button" class="btn btn-ghost btn-sm" id="svRunBtn" onclick="runSolve()">Run</button>
          <button type="button" class="btn lc-btn-solve" id="svSubmitBtn" onclick="submitSolve()">${sub ? 'Resubmit' : 'Submit for grading'}</button>
        </div>
        <textarea id="svCode" class="code-editor ide-editor" spellcheck="false" placeholder="# Write your solution here. Run to test, Submit for grading and gems."></textarea>
        <div class="ide-status-row"><span class="s" id="svStatus" style="color:var(--muted-2)">Ready - runs in your browser, nothing to install.</span></div>
        <div id="svTerm"></div>
        <p class="hint" style="margin:10px 14px 14px">Submissions are graded by AI on the spot with a 10% reduction, and gems are awarded by score.${CUR.track.free ? ' Complete every task above the pass mark and your verified certificate is issued automatically.' : ''}</p>
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
          <p class="hint" style="margin-top:10px">Submissions are graded by AI on the spot with a 10% reduction, and gems are awarded by score.${CUR.track.free ? ' Complete every task above the pass mark and your verified certificate is issued automatically.' : ''}</p>
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
  const btn = $('svRunBtn'); const status = $('svStatus');
  const code = $('svCode').value;
  if (!code.trim()) { status.textContent = 'Write some code first.'; return; }
  if (EchoRun.isRunning()) { EchoRun.cancel(); btn.textContent = 'Run'; return; }
  btn.textContent = 'Stop';
  try { await EchoRun.executeAny($('svLang').value, code, { term: SV_TERM, files: SV_FILES, onStatus: (t) => { status.textContent = t; } }); }
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
const EV_LANG_LABEL = { none: 'File or link submission', python: 'Python 3', c: 'C', cpp: 'C++', sql: 'SQL', web: 'HTML / CSS / JS' };
async function loadEvents() {
  try {
    const d = await api('/api/events');
    const list = d.events;
    $('evGrid').innerHTML = list.length ? list.map((ev) => `
      <div class="oq-card">
        <span class="kbadge ${esc(ev.kind)}">${EV_KIND_LABEL[ev.kind] || ev.kind}${ev.status === 'live' ? ' · LIVE' : ev.status === 'upcoming' ? ' · Upcoming' : ''}</span>
        <h4 style="font-size:15px;color:var(--ink)">${esc(ev.title)}</h4>
        <div class="s" style="color:var(--muted);font-size:12.5px">${esc((ev.description || '').slice(0, 140))}${(ev.description || '').length > 140 ? '…' : ''}</div>
        <div class="s" style="color:var(--muted)">${ev.entry === 'paid' ? '<strong>PKR ' + ev.fee_pkr + '</strong>' : '<strong style="color:var(--ok)">FREE</strong>'}
          ${ev.duration_minutes ? ' · About ' + ev.duration_minutes + ' minutes' : ''}${(ev.problems || []).length ? ' · ' + ev.problems.length + ' tasks' : ''}
          ${ev.auto_certificate ? ' · Certificate at ' + ev.pass_mark + '%+' : ''}${ev.auto_grade ? ' · AI graded' : ''}</div>
        ${ev.my_progress && ev.my_progress.avg != null ? `<div class="oq-prog"><div style="width:${Math.min(100, ev.my_progress.avg)}%"></div></div>
          <div class="s" style="color:${ev.my_progress.passed ? 'var(--ok)' : 'var(--muted)'}">${ev.my_progress.passed ? 'Passed with ' + ev.my_progress.avg + '%' : 'Average so far: ' + ev.my_progress.avg + '%'}</div>` : ''}
        <button class="lc-btn-solve" style="margin-top:6px" onclick="openOpenEvent(${ev.id})">${ev.my_entry ? 'Continue' : ev.kind === 'webinar' ? 'Register' : 'Start'}</button>
      </div>`).join('')
      : '<div class="empty">No open events right now - watch the Announcements tab.</div>';
  } catch (e) { $('evGrid').innerHTML = `<div class="empty">${esc(e.message)}</div>`; }
}
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
async function openOpenEvent(id) {
  if (!ME) { gate('Sign in free to join events and earn certificates.'); return; }
  const d = await api(`/api/events/${id}`);
  CUR_EVENT = d;
  const ev = d.event;
  const probs = ev.problems || [];
  const regBtn = !d.my_entry && ['upcoming', 'live'].includes(ev.status)
    ? `<button class="btn btn-teal" onclick="regOpenEvent(${ev.id})">Register${ev.entry === 'paid' ? ' - PKR ' + ev.fee_pkr : ' - Free'}</button>` : '';
  openModal(ev.title, `
    <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:8px">
      <span class="kbadge ${esc(ev.kind)}">${EV_KIND_LABEL[ev.kind]}</span>
      <span class="s" style="color:var(--muted)">${ev.entry === 'paid' ? 'PKR ' + ev.fee_pkr : 'Free'} · Pass mark ${ev.pass_mark}%${ev.duration_minutes ? ' · About ' + ev.duration_minutes + ' minutes' : ''}${ev.auto_grade ? ' · AI graded with a 10% reduction' : ''}${ev.auto_certificate ? ' · Automatic certificate' : ''}</span></div>
    ${ev.description ? `<p class="s" style="white-space:pre-line;margin-bottom:10px">${esc(ev.description)}</p>` : ''}
    ${(ev.files || []).length ? `<div class="s" style="margin-bottom:8px"><strong>Documents:</strong> ${ev.files.map((f) => `<a href="${esc(f.url)}" target="_blank" rel="noopener">${esc(f.name)}</a>`).join(' · ')}</div>` : ''}
    ${regBtn}
    ${d.my_entry && !d.can_participate ? `<div class="task-status wait">${esc(d.participate_msg)}</div>` : ''}
    ${d.my_progress && d.my_progress.passed ? `<div class="task-status ok"><strong>Passed with ${d.my_progress.avg}%</strong> - your certificate is in My certificates above.</div>` : ''}
    ${ev.kind === 'webinar' && ev.meeting_link ? `<div class="task-status ok">You are registered - <a href="${esc(ev.meeting_link)}" target="_blank" rel="noopener"><strong>Join the webinar</strong></a></div>` : ''}
    ${d.can_participate && probs.length ? `
      <div class="pub-sec">Tasks</div>
      ${probs.map((p) => {
        const s = d.my_submissions[p.pid];
        return `<div class="ev-problem">
          <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
            <strong style="font-size:13.5px">${esc(p.title)}</strong>
            <span class="lc-diff ${DIFF(p.difficulty)}">${DIFF(p.difficulty)}</span>
            <span style="flex:1"></span>
            ${s ? (s.score != null ? `<span class="grade-chip ok">${s.score}%${s.graded_by === 'ai' ? ' (AI)' : ''}</span>` : '<span class="grade-chip wait">Grading</span>') : ''}
            <button class="lc-btn-solve" onclick="openEventSolve(${ev.id},${p.pid})">${s ? 'Reopen' : 'Solve'}</button>
          </div>
          ${s && s.ai_feedback ? `<div class="s" style="margin-top:6px;color:var(--muted)">${esc(s.ai_feedback)}</div>` : ''}
        </div>`;
      }).join('')}` : ''}
    ${d.can_participate && !probs.length && ev.kind !== 'webinar' ? `
      <div class="pub-sec">Your submission</div>
      <form id="evLinkForm">
        <label class="field"><span>Your work as a file (any document)</span><input name="file" type="file"></label>
        <label class="field"><span>Or a link to your project</span><input name="link" type="url" placeholder="https://github.com/you/repo"></label>
        <button class="btn btn-primary btn-block">Submit</button></form>` : ''}`);
  const lf = $('evLinkForm');
  if (lf) lf.addEventListener('submit', async (e) => {
    e.preventDefault(); const btn = lf.querySelector('button'); btn.disabled = true;
    try {
      const out = await api(`/api/events/${ev.id}/submit`, { method: 'POST', body: new FormData(lf) });
      afterSubmitToast(out); openOpenEvent(ev.id); loadEvents(); loadCerts();
    } catch (err) { modalMsg(err.message); btn.disabled = false; }
  });
}
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
      openOpenEvent(eid); loadEvents();
    } catch (err) { modalMsg(err.message); btn.disabled = false; }
  });
}
let EV_TERM2 = null;
async function openEventSolve(eid, pid) {
  const d = CUR_EVENT && CUR_EVENT.event.id === eid ? CUR_EVENT : await api(`/api/events/${eid}`);
  const ev = d.event;
  const p = (ev.problems || []).find((x) => x.pid === pid);
  const sub = d.my_submissions[pid] || null;
  const lang = ev.compiler && ev.compiler !== 'none' && ev.compiler !== 'web' ? ev.compiler : null;
  openModal(p.title, `
    <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:8px">
      <span class="lc-diff ${DIFF(p.difficulty)}">${DIFF(p.difficulty)}</span>
      <span class="s" style="color:var(--muted)">${p.points} pts · ${EV_LANG_LABEL[ev.compiler] || 'File or link'}${ev.auto_grade ? ' · Graded instantly by AI with a 10% reduction' : ''}</span></div>
    <div class="s" style="white-space:pre-line;line-height:1.6;margin-bottom:12px">${esc(p.description)}</div>
    ${lang ? `
      <div class="task-ide card" style="margin-bottom:12px">
        <div class="ide-toolbar">
          <span class="ide-pkgs">${EV_LANG_LABEL[lang]}${ev.dataset_url ? ' · Dataset auto-loaded' : ''}</span>
          <span style="flex:1"></span>
          <button type="button" class="btn btn-ghost btn-sm" onclick="EV_TERM2&&EV_TERM2.clear()">Clear</button>
          <button type="button" class="btn btn-ghost btn-sm" id="ev2Run" onclick="runEvent2('${lang}')">Run</button>
        </div>
        <textarea id="ev2Code" class="code-editor ide-editor" spellcheck="false">${esc(sub && sub.code || '')}</textarea>
        <div class="ide-status-row"><span class="s" id="ev2Status" style="color:var(--muted-2)">Ready.</span></div>
        <div id="ev2Term"></div>
      </div>
      <form id="ev2Submit">
        <button class="btn btn-primary btn-block">${sub ? 'Resubmit for grading' : 'Submit for grading'}</button>
      </form>`
    : `<form id="ev2Submit">
        <label class="field"><span>Your work as a file</span><input name="file" type="file"></label>
        <label class="field"><span>Or a link</span><input name="link" type="url" placeholder="https://"></label>
        <button class="btn btn-primary btn-block">${sub ? 'Resubmit' : 'Submit'}</button></form>`}
    ${sub && sub.ai_feedback ? `<div class="s" style="margin-top:10px;background:#F4FBF9;border:1px solid #B7E9DA;border-radius:10px;padding:10px 12px"><strong>Feedback:</strong> ${esc(sub.ai_feedback)}</div>` : ''}`);
  if (lang) { EV_TERM2 = EchoTerm.mount($('ev2Term')); EchoRun.wireEditor($('ev2Code')); }
  $('ev2Submit').addEventListener('submit', async (e) => {
    e.preventDefault(); const f = e.target; const btn = f.querySelector('button'); btn.disabled = true; modalMsg('');
    const fd = new FormData(f);
    fd.set('pid', pid);
    if (lang) {
      const code = $('ev2Code').value;
      if (!code.trim()) { modalMsg('Write your solution in the editor first.'); btn.disabled = false; return; }
      fd.set('code', code); fd.set('language', lang);
    }
    try {
      const out = await api(`/api/events/${eid}/submit`, { method: 'POST', body: fd });
      afterSubmitToast(out);
      openOpenEvent(eid); loadEvents(); loadCerts();
    } catch (err) { modalMsg(err.message); btn.disabled = false; }
  });
}
async function runEvent2(lang) {
  const btn = $('ev2Run'); const status = $('ev2Status');
  const code = $('ev2Code').value;
  if (!code.trim()) { status.textContent = 'Write some code first.'; return; }
  if (EchoRun.isRunning()) { EchoRun.cancel(); btn.textContent = 'Run'; return; }
  btn.textContent = 'Stop';
  const files = [];
  const ev = CUR_EVENT && CUR_EVENT.event;
  if (ev && ev.dataset_url) {
    try { status.textContent = 'Fetching dataset from URL...'; files.push(await EchoRun.fetchDataset(ev.dataset_url)); }
    catch (e) { EV_TERM2.print('[Dataset: ' + e.message + ']\n'); }
  }
  for (const f of (ev && ev.files || [])) if (/\.(csv|tsv|txt|json)$/i.test(f.name)) files.push({ name: f.name, url: f.url });
  try { await EchoRun.executeAny(lang, code, { term: EV_TERM2, files, onStatus: (t) => { status.textContent = t; } }); }
  catch (e) { status.textContent = e.message; }
  btn.textContent = 'Run';
}
function afterSubmitToast(out) {
  if (out.cert) toast(`Passed - certificate ${out.cert.serial} issued. Find it under My certificates.`);
  else if (out.submission && out.submission.score != null) toast(`Graded instantly: ${out.submission.score}% (AI score with the 10% reduction applied).`);
  else toast('Submitted - it will be graded soon.');
}
