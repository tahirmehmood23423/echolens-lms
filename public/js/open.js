'use strict';

/* EchoLens Open (v12) - the EchoLens open problem-set portal.
 * Nothing is accessible without signing in (Google or email) - every open
 * user becomes a lead with a mandatory WhatsApp number. Signed-in users get:
 * a clean problem table (status / difficulty / gems) with a split-pane
 * solve workspace (Python, C, C++, SQL), plus admin-generated open quests,
 * hackathons, competitions and webinars with AI grading (-10%) and
 * automatic verified certificates.
 */

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
async function api(path, opts = {}) {
  const isForm = opts.body instanceof FormData;
  const res = await fetch(path, { credentials: 'same-origin', headers: isForm ? {} : { 'Content-Type': 'application/json' }, ...opts });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) { const e = new Error(data.error || 'Something went wrong.'); e.status = res.status; throw e; }
  return data;
}
function toast(text, isErr) {
  const t = $('toast');
  t.textContent = text; t.className = 'toast show' + (isErr ? ' err' : '');
  clearTimeout(t._h); t._h = setTimeout(() => (t.className = 'toast'), 3000);
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

let ME = null;
let PROBLEMS = [];   // flattened open problems from every track
let SOLVED = {};     // localStorage-backed practice status: key -> 'done'
let SV_TERM = null;
let SV_FILES = [];
let CUR_EVENT = null;

/* -------------------------------- boot -------------------------------- */
(async () => {
  try { SOLVED = JSON.parse(localStorage.getItem('el_open_done') || '{}'); } catch { SOLVED = {}; }
  try {
    ME = await api('/api/auth/me');
  } catch { ME = null; }

  if (!ME) {
    // HARD GATE: nothing on the open side without signing in.
    $('gateWrap').style.display = '';
    $('userBox').innerHTML = `<a class="btn btn-primary btn-sm" href="/login">Sign in</a>`;
    try { const p = await api('/api/auth/providers'); if (p.google) $('gBtn').style.display = ''; } catch {}
    window.showSignup = () => {
      const c = $('signupCard');
      c.style.display = '';
      c.scrollIntoView({ behavior: 'smooth', block: 'center' });
      c.querySelector('input[name="name"]').focus();
    };
    $('suForm').addEventListener('submit', async (e) => {
      e.preventDefault(); const f = e.target; const btn = f.querySelector('button'); btn.disabled = true;
      try {
        await api('/api/auth/register-open', {
          method: 'POST',
          body: JSON.stringify({ name: f.name.value, email: f.email.value, whatsapp: f.whatsapp.value, password: f.password.value }),
        });
        location.reload();
      } catch (err) { $('suMsg').className = 'form-msg err'; $('suMsg').textContent = err.message; btn.disabled = false; }
    });
    return;
  }

  $('appWrap').style.display = '';
  $('userBox').innerHTML = `
    <span class="s" style="color:var(--muted);margin-right:10px">${esc(ME.name)}${ME.reg_no ? ' · <span class="mono">' + esc(ME.reg_no) + '</span>' : ''}</span>
    ${ME.role !== 'free' ? '<a class="btn btn-teal btn-sm" href="/dashboard" style="margin-right:8px">My portal</a>' : ''}
    <button class="btn btn-ghost btn-sm" onclick="logout()">Sign out</button>`;
  if (ME.gamify) $('myGems').innerHTML = `<span class="prob-chip" style="cursor:default">${ME.gamify.gems} gems · ${esc(ME.gamify.stage.name)}</span>`;
  requireWhatsapp();
  loadProblems();
  loadEvents();
  loadCerts();
  loadCatalogue();
})();

async function logout() { try { await api('/api/auth/logout', { method: 'POST' }); } catch {} location.href = '/'; }

/* WhatsApp is mandatory for open users too - it feeds the leads database. */
function requireWhatsapp() {
  if (ME.profile && ME.profile.phone) return;
  openModal('One last step - your WhatsApp number', `
    <form id="waForm">
      <p class="s" style="color:var(--muted);margin-bottom:12px">We share quest openings, webinar invites, and your certificates on WhatsApp. This is required to continue.</p>
      <label class="field"><span>WhatsApp number</span><input name="whatsapp" required placeholder="03XX-XXXXXXX" inputmode="tel"></label>
      <button class="btn btn-primary btn-block">Save &amp; continue</button></form>`);
  window.MODAL_LOCK = true;
  $('modalBox').querySelector('.close').style.display = 'none';
  $('waForm').addEventListener('submit', async (e) => {
    e.preventDefault(); const f = e.target; const btn = f.querySelector('button'); btn.disabled = true;
    try {
      await api('/api/me/contact', { method: 'POST', body: JSON.stringify({ whatsapp: f.whatsapp.value.trim() }) });
      ME.profile = ME.profile || {}; ME.profile.phone = f.whatsapp.value.trim();
      window.MODAL_LOCK = false;
      $('modalBox').querySelector('.close').style.display = '';
      closeModal(); toast('Saved - happy solving!');
    } catch (err) { modalMsg(err.message); btn.disabled = false; }
  });
}

/* -------------------------------- tabs -------------------------------- */
function openTab(tab) {
  ['problems', 'events', 'courses', 'solve'].forEach((t) => { const el = $('tab-' + t); if (el) el.style.display = t === tab ? '' : 'none'; });
  document.querySelectorAll('.open-nav .nlink[data-tab]').forEach((n) => n.classList.toggle('active', n.dataset.tab === tab));
  window.scrollTo({ top: 0 });
}
function backToList() { openTab('problems'); }

/* ------------------------ problem set (EchoLens problem-set style) ------------------------ */
async function loadProblems() {
  try {
    const d = await api('/api/public/tracks');
    const sel = $('fTrack');
    for (const t of d.tracks) {
      const o = document.createElement('option');
      o.value = t.key; o.textContent = (t.free ? 'FREE - ' : '') + t.title + (t.course_code ? ' (' + t.course_code + ')' : '');
      sel.appendChild(o);
    }
    // Pull the open levels of every track and flatten into one problem list.
    const all = await Promise.all(d.tracks.map((t) => api('/api/public/tracks/' + encodeURIComponent(t.key)).catch(() => null)));
    PROBLEMS = [];
    let n = 0;
    for (const td of all) {
      if (!td) continue;
      for (const lvl of td.levels) {
        if (lvl.locked) continue;
        for (const p of lvl.problems) {
          n += 1;
          PROBLEMS.push({
            no: n, key: `${td.track.key}:${lvl.no}:${p.pid}`,
            track: td.track.key, track_title: td.track.title, track_free: !!td.track.free,
            level: lvl.no, title: p.title, description: p.description,
            points: p.points, difficulty: p.difficulty, refs: p.refs || [],
          });
        }
      }
    }
    drawProblems();
  } catch (e) { $('probTable').innerHTML = `<div class="empty">${esc(e.message)}</div>`; }
}
function drawProblems() {
  const track = $('fTrack').value, diff = $('fDiff').value, q = $('fSearch').value.trim().toLowerCase();
  const list = PROBLEMS.filter((p) =>
    (!track || p.track === track) && (!diff || p.difficulty === diff) && (!q || p.title.toLowerCase().includes(q) || p.track_title.toLowerCase().includes(q)));
  $('probTable').innerHTML = list.length ? `
    <table class="lc-table">
      <thead><tr><th class="lc-status"></th><th style="width:44px">#</th><th>Title</th><th>Track</th><th>Difficulty</th><th style="text-align:right">Gems</th><th></th></tr></thead>
      <tbody>${list.map((p) => `
        <tr onclick="openSolve('${esc(p.key)}')">
          <td class="lc-status">${SOLVED[p.key] ? '<span class="done">&#10003;</span>' : ''}</td>
          <td class="s" style="color:var(--muted-2)">${p.no}</td>
          <td><strong>${esc(p.title)}</strong></td>
          <td class="s" style="color:var(--muted)">${p.track_free ? '<span class="kbadge quest" style="margin-right:6px">FREE</span>' : ''}${esc(p.track_title)} · L${p.level}</td>
          <td><span class="lc-diff ${esc(p.difficulty)}">${esc(p.difficulty)}</span></td>
          <td style="text-align:right">${p.points}</td>
          <td style="text-align:right"><button class="lc-btn-solve" onclick="event.stopPropagation();openSolve('${esc(p.key)}')">Solve</button></td>
        </tr>`).join('')}
      </tbody></table>
    <p class="hint" style="margin-top:10px">Showing ${list.length} of ${PROBLEMS.length} open problems. The full ladders (with gems, teacher feedback, and level unlocks) live inside the paid courses.</p>`
    : '<div class="empty">No problems match those filters.</div>';
}
function openSolve(key) {
  const p = PROBLEMS.find((x) => x.key === key);
  if (!p) return;
  openTab('solve');
  $('svTitle').textContent = p.title;
  $('svDiff').innerHTML = `<span class="lc-diff ${esc(p.difficulty)}">${esc(p.difficulty)}</span>`;
  $('svDesc').textContent = p.description;
  $('svRefs').innerHTML = p.refs.length ? '<strong>Resources:</strong> ' + p.refs.map((r) => `<a href="${esc(r[1])}" target="_blank" rel="noopener">${esc(r[0])}</a>`).join(' &middot; ') : '';
  if (!SV_TERM) { SV_TERM = EchoTerm.mount($('svTerm')); EchoRun.wireEditor($('svCode')); }
  SV_TERM.clear();
  $('svStatus').textContent = 'Ready.';
  window.SV_KEY = key;
}
function svLangChanged() {
  const l = $('svLang').value;
  $('svCode').placeholder = l === 'python' ? '# Write your Python solution here, then press Run.'
    : l === 'c' ? '// Write your C solution here.\n#include <stdio.h>\nint main(){\n    printf("Hello EchoLens\\n");\n    return 0;\n}'
    : l === 'cpp' ? '// Write your C++ solution here.\n#include <iostream>\nint main(){\n    std::cout << "Hello EchoLens\\n";\n    return 0;\n}'
    : '-- Write SQL here. Uploaded CSV datasets become tables automatically.\nSELECT 1 + 1 AS answer;';
}
function svLocalDataset(input) {
  const f = input.files && input.files[0];
  if (!f) return;
  if (f.size > 20 * 1024 * 1024) { toast('Keep datasets under 20 MB.', true); input.value = ''; return; }
  const reader = new FileReader();
  reader.onload = () => {
    SV_FILES = SV_FILES.filter((x) => x.name !== f.name);
    SV_FILES.push({ name: f.name, bytes: reader.result });
    toast(`${f.name} loaded - pd.read_csv('${f.name}') or SQL table "${f.name.replace(/\.[^.]+$/, '')}".`);
  };
  reader.readAsArrayBuffer(f);
  input.value = '';
}
async function runSolve() {
  const btn = $('svRunBtn'); const status = $('svStatus');
  const code = $('svCode').value;
  if (!code.trim()) { status.textContent = 'Write some code first.'; return; }
  if (EchoRun.isRunning()) { EchoRun.cancel(); btn.innerHTML = 'Run'; return; }
  btn.innerHTML = 'Stop';
  try {
    const out = await EchoRun.executeAny($('svLang').value, code, { term: SV_TERM, files: SV_FILES, onStatus: (t) => { status.textContent = t; } });
    if (out && out.ok && window.SV_KEY) { SOLVED[window.SV_KEY] = 'done'; localStorage.setItem('el_open_done', JSON.stringify(SOLVED)); }
  } catch (e) { status.textContent = e.message; }
  btn.innerHTML = 'Run';
}

/* ---------------------------- open quests & events ----------------------------
 * Admin-generated events with open (or both) scope: register (paid ones need
 * a payment screenshot), solve with the built-in compiler, get AI-graded
 * instantly (-10%), and receive a verified certificate at the pass mark.
 */
const EV_KIND_LABEL = { quest: 'Quest', hackathon: 'Hackathon', competition: 'Competition', webinar: 'Webinar' };
const EV_LANG_LABEL = { none: 'file / link submission', python: 'Python 3', c: 'C', cpp: 'C++', sql: 'SQL', web: 'HTML / CSS / JS' };
async function loadEvents() {
  try {
    const d = await api('/api/events');
    const list = d.events;
    $('evGrid').innerHTML = list.length ? list.map((ev) => `
      <div class="oq-card">
        <span class="kbadge ${esc(ev.kind)}">${EV_KIND_LABEL[ev.kind] || ev.kind}${ev.status === 'live' ? ' · LIVE' : ev.status === 'upcoming' ? ' · upcoming' : ''}</span>
        <h4 style="font-size:15px;color:var(--ink)">${esc(ev.title)}</h4>
        <div class="s" style="color:var(--muted);font-size:12.5px">${esc((ev.description || '').slice(0, 140))}${(ev.description || '').length > 140 ? '…' : ''}</div>
        <div class="s" style="color:var(--muted)">${ev.entry === 'paid' ? '<strong>PKR ' + ev.fee_pkr + '</strong>' : '<strong style="color:var(--ok)">FREE</strong>'}
          ${ev.duration_minutes ? ' · About ' + ev.duration_minutes + ' minutes' : ''}${(ev.problems || []).length ? ' · ' + ev.problems.length + ' tasks' : ''}
          ${ev.auto_certificate ? ' · Certificate at ' + ev.pass_mark + '%+' : ''}${ev.auto_grade ? ' · AI graded, 10% reduction' : ''}</div>
        ${ev.my_progress && ev.my_progress.avg != null ? `<div class="oq-prog"><div style="width:${Math.min(100, ev.my_progress.avg)}%"></div></div>
          <div class="s" style="color:${ev.my_progress.passed ? 'var(--ok)' : 'var(--muted)'}">${ev.my_progress.passed ? 'Passed with ' + ev.my_progress.avg + '%' : 'Average so far: ' + ev.my_progress.avg + '%'}</div>` : ''}
        <button class="lc-btn-solve" style="margin-top:6px" onclick="openOpenEvent(${ev.id})">${ev.my_entry ? 'Continue' : ev.kind === 'webinar' ? 'Register' : 'Start'}</button>
      </div>`).join('')
      : '<div class="empty">No open events right now - check back soon, or follow EchoLens for announcements.</div>';
  } catch (e) { $('evGrid').innerHTML = `<div class="empty">${esc(e.message)}</div>`; }
}
async function loadCerts() {
  try {
    const d = await api('/api/certificates/mine');
    if (!d.certificates.length) { $('certBox').innerHTML = ''; return; }
    $('certBox').innerHTML = `<div class="card"><div class="card-head"><h3>My certificates</h3><span class="s" style="color:var(--muted)">QR-verified · share to LinkedIn</span></div>
      <div class="card-body tight">${d.certificates.map((c) => `
        <div class="list-row" style="padding:10px 4px">
          <div class="grow"><div class="t">${esc(c.title)}</div>
            <div class="s" style="color:var(--muted)">${esc(c.kind)} · ${esc(c.completion_date)} · serial <span class="mono">${esc(c.serial)}</span></div></div>
          <a class="btn btn-teal btn-sm" href="${esc(c.url)}" target="_blank" rel="noopener">View &amp; download</a>
        </div>`).join('')}</div></div>`;
  } catch { $('certBox').innerHTML = ''; }
}
async function openOpenEvent(id) {
  const d = await api(`/api/events/${id}`);
  CUR_EVENT = d;
  const ev = d.event;
  const probs = ev.problems || [];
  const regBtn = !d.my_entry && ['upcoming', 'live'].includes(ev.status)
    ? `<button class="btn btn-teal" onclick="regOpenEvent(${ev.id})">Register${ev.entry === 'paid' ? ' - PKR ' + ev.fee_pkr : ' - Free'}</button>` : '';
  openModal(ev.title, `
    <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:8px">
      <span class="kbadge ${esc(ev.kind)}">${EV_KIND_LABEL[ev.kind]}</span>
      <span class="s" style="color:var(--muted)">${ev.entry === 'paid' ? 'PKR ' + ev.fee_pkr : 'Free'} · Pass mark ${ev.pass_mark}%${ev.duration_minutes ? ' · About ' + ev.duration_minutes + ' minutes' : ''}${ev.auto_grade ? ' · AI graded, 10% reduction' : ''}${ev.auto_certificate ? ' · automatic certificate' : ''}</span></div>
    ${ev.description ? `<p class="s" style="white-space:pre-line;margin-bottom:10px">${esc(ev.description)}</p>` : ''}
    ${(ev.files || []).length ? `<div class="s" style="margin-bottom:8px"><strong>Documents:</strong> ${ev.files.map((f) => `<a href="${esc(f.url)}" target="_blank" rel="noopener">${esc(f.name)}</a>`).join(' · ')}</div>` : ''}
    ${regBtn}
    ${d.my_entry && !d.can_participate ? `<div class="task-status wait">${esc(d.participate_msg)}</div>` : ''}
    ${d.my_progress && d.my_progress.passed ? `<div class="task-status ok"><strong>Passed with ${d.my_progress.avg}%</strong> - your certificate is in "My certificates" above.</div>` : ''}
    ${ev.kind === 'webinar' && ev.meeting_link ? `<div class="task-status ok">You are registered - <a href="${esc(ev.meeting_link)}" target="_blank" rel="noopener"><strong>Join the webinar</strong></a></div>` : ''}
    ${d.can_participate && probs.length ? `
      <div class="pub-sec">Tasks - solve each one below</div>
      ${probs.map((p) => {
        const s = d.my_submissions[p.pid];
        return `<div class="ev-problem">
          <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
            <strong style="font-size:13.5px">${esc(p.title)}</strong>
            <span class="lc-diff ${esc(p.difficulty)}">${esc(p.difficulty)}</span>
            <span style="flex:1"></span>
            ${s ? (s.score != null ? `<span class="grade-chip ok">${s.score}%${s.graded_by === 'ai' ? ' (AI)' : ''}</span>` : '<span class="grade-chip wait">grading…</span>') : ''}
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
        <p class="hint" style="margin:0 0 10px">${esc(ev.pay_instructions || `Send PKR ${ev.fee_pkr} to the academy's JazzCash / Easypaisa / bank account, screenshot the transaction, and upload the picture below. The admin verifies it before you can submit.`)}</p>
        <label class="field"><span>Screenshot of your payment transaction (PNG / JPG)</span><input name="file" type="file" accept=".png,.jpg,.jpeg,.webp" required></label>` :
      '<p class="s" style="color:var(--muted);margin-bottom:10px">This event is free - register and you are in.</p>'}
      <button class="btn btn-primary btn-block">Register</button></form>`);
  $('regForm').addEventListener('submit', async (e) => {
    e.preventDefault(); const f = e.target; const btn = f.querySelector('button'); btn.disabled = true;
    try {
      await api(`/api/events/${eid}/register`, { method: 'POST', body: new FormData(f) });
      toast(ev.entry === 'paid' ? 'Registered - your payment screenshot is being verified.' : 'Registered - good luck!');
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
      <span class="lc-diff ${esc(p.difficulty)}">${esc(p.difficulty)}</span>
      <span class="s" style="color:var(--muted)">${p.points} pts · ${EV_LANG_LABEL[ev.compiler] || 'file / link'}${ev.auto_grade ? ' · Graded instantly by AI with a 10% reduction' : ''}</span></div>
    <div class="s" style="white-space:pre-line;line-height:1.6;margin-bottom:12px">${esc(p.description)}</div>
    ${lang ? `
      <div class="task-ide card" style="margin-bottom:12px">
        <div class="ide-toolbar">
          <span class="ide-pkgs">${EV_LANG_LABEL[lang]}${ev.dataset_url ? ' · dataset auto-loaded' : ''}</span>
          <span style="flex:1"></span>
          <button type="button" class="btn btn-ghost btn-sm" onclick="EV_TERM2&&EV_TERM2.clear()">Clear</button>
          <button type="button" class="btn lc-btn-solve" id="ev2Run" onclick="runEvent2('${lang}')">Run</button>
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
  if (EchoRun.isRunning()) { EchoRun.cancel(); btn.innerHTML = 'Run'; return; }
  btn.innerHTML = 'Stop';
  const files = [];
  const ev = CUR_EVENT && CUR_EVENT.event;
  if (ev && ev.dataset_url) {
    try { status.textContent = 'Fetching dataset from URL...'; files.push(await EchoRun.fetchDataset(ev.dataset_url)); }
    catch (e) { EV_TERM2.print('[Dataset: ' + e.message + ']\n'); }
  }
  for (const f of (ev && ev.files || [])) if (/\.(csv|tsv|txt|json)$/i.test(f.name)) files.push({ name: f.name, url: f.url });
  try { await EchoRun.executeAny(lang, code, { term: EV_TERM2, files, onStatus: (t) => { status.textContent = t; } }); }
  catch (e) { status.textContent = e.message; }
  btn.innerHTML = 'Run';
}
function afterSubmitToast(out) {
  if (out.cert) toast(`Passed - certificate ${out.cert.serial} issued. Find it under My certificates.`);
  else if (out.submission && out.submission.score != null) toast(`Graded instantly: ${out.submission.score}% (AI score with the 10% reduction applied).`);
  else toast('Submitted - it will be graded soon.');
}


/* ------------------------- course catalogue (sign-in gated) -------------------------
 * The August 2026 catalogue in the same clean table format as the problem
 * set - never openly visible; only signed-in community members see it.
 * FREE programs jump straight into their quest; paid programs go to the
 * registration form. Key actions: paid-course registration, the campus
 * ambassador program, and the free webinar.
 */
let CATALOGUE = [];
let CAT_LINKS = null;
async function loadCatalogue() {
  try {
    const d = await api('/api/catalogue');
    CATALOGUE = d.catalogue;
    CAT_LINKS = d.links;
    if (d.cohort) $('cohortLine').textContent = `31 live, instructor-led programs · Registration deadline ${d.cohort.registration_deadline} · Batch starts ${d.cohort.batch_starts}. Every paid course opens its first level free in the problem set - try before you enrol.`;
    $('actionStrip').innerHTML = `
      <a class="btn btn-primary" href="${esc(d.links.registration)}" target="_blank" rel="noopener">Register for paid courses</a>
      <a class="btn btn-teal" href="${esc(d.links.webinar)}" target="_blank" rel="noopener">${esc(d.links.webinar_label)}</a>
      <a class="btn btn-ghost" href="${esc(d.links.ambassador)}" target="_blank" rel="noopener">Campus Ambassador program</a>`;
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
          <div class="s" style="color:var(--muted)"><s>PKR ${p.full_pkr.toLocaleString()}</s> · save PKR ${p.save_pkr.toLocaleString()} (~15%)</div>
          <a class="lc-btn-solve" style="display:inline-block;margin-top:6px;text-decoration:none" href="${esc(d.links.registration)}" target="_blank" rel="noopener">Register for the path</a>
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
            ${c.free_mode ? `<div class="s" style="color:var(--ok)">${c.free_mode === 'open' ? 'Open access - the full quest is free.' : 'Free with sign-in - the full quest is unlocked for you.'}</div>` : '<div class="s" style="color:var(--muted-2)">Level 1 free in the problem set - remaining levels unlock with enrolment.</div>'}
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
  if (c.price_pkr > 0) { window.open(CAT_LINKS.registration, '_blank', 'noopener'); return; }
  // Free program: jump into its quest in the problem set.
  if (c.track_key) {
    openTab('problems');
    $('fTrack').value = c.track_key;
    drawProblems();
    toast(`${c.code} is free - here are its quests. Happy solving!`);
  } else window.open(CAT_LINKS.registration, '_blank', 'noopener');
}
