'use strict';

/* EchoLens public landing (v10): catalogue, features, open quest playground. */

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
async function api(path) {
  const res = await fetch(path, { credentials: 'same-origin' });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Something went wrong.');
  return data;
}

let PLAY_TERM = null;
let OPEN_LEVELS = 3;

(async () => {
  // Signed in already? Turn the corner button into a dashboard shortcut.
  try { await api('/api/auth/me'); const b = $('signinBtn'); b.textContent = 'Open dashboard'; b.href = '/dashboard'; } catch {}

  try {
    const info = await api('/api/public/info');
    OPEN_LEVELS = info.open_levels || 3;
    $('openLvlN').textContent = OPEN_LEVELS;
    $('statStrip').innerHTML = [
      [info.stats.students, 'learners on the platform'],
      [info.stats.courses, 'courses in the catalogue'],
      [info.stats.tracks, 'quest tracks to conquer'],
      ['6', 'stages: Spark to Nova'],
    ].map(([n, l]) => `<div class="stat-pill"><div class="n">${esc(n)}</div><div class="l">${esc(l)}</div></div>`).join('');
    if (info.contact) {
      $('footMail').textContent = info.contact; $('footMail').href = 'mailto:' + info.contact;
      $('contactBtn').href = `mailto:${info.contact}?subject=${encodeURIComponent('EchoLens Registration')}`;
    }
    const tiers = { 'Bootcamp': 0, 'Short Course': 1, 'Specialist Track': 2, 'Career Track': 3 };
    const cat = info.catalogue.slice().sort((a, b) => (tiers[a.tier] ?? 9) - (tiers[b.tier] ?? 9));
    $('catGrid').innerHTML = cat.map((c) => `
      <div class="cat-card">
        <div class="tier">${esc(c.tier)} &middot; ${esc(c.code)}</div>
        <h4>${esc(c.title)}</h4>
        <div class="meta">${c.weeks} weeks &middot; ${c.hours} hours &middot; ${esc(c.level)}</div>
        <div class="meta">${esc(c.summary || '')}</div>
        <div class="price">PKR ${Number(c.price_pkr).toLocaleString()}</div>
      </div>`).join('');
  } catch (e) { $('catGrid').innerHTML = `<div class="empty">${esc(e.message)}</div>`; }

  try {
    const d = await api('/api/public/tracks');
    $('trackGrid').innerHTML = d.tracks.map((t) => `
      <div class="track-card" id="tk-${esc(t.key)}" onclick="pickTrack('${esc(t.key)}')">
        <div class="tier" style="font-size:10.5px;font-weight:700;letter-spacing:.09em;text-transform:uppercase;color:var(--teal-deep)">${t.course_code ? esc(t.course_code) + ' &middot; ' : ''}${t.levels} levels &middot; ${t.total_points} gems</div>
        <h4 style="font-size:14.5px;color:var(--ink);margin:6px 0 4px">${esc(t.title)}</h4>
        <div class="s" style="font-size:12.5px;color:var(--muted)">${esc(t.description)}</div>
      </div>`).join('');
  } catch (e) { $('trackGrid').innerHTML = `<div class="empty">${esc(e.message)}</div>`; }
})();

async function pickTrack(key) {
  document.querySelectorAll('.track-card').forEach((c) => c.classList.toggle('active', c.id === 'tk-' + key));
  const panel = $('playPanel');
  panel.innerHTML = '<div class="empty">Loading levels&hellip;</div>';
  $('playIde').style.display = 'none';
  try {
    const d = await api('/api/public/tracks/' + encodeURIComponent(key));
    panel.innerHTML = `
      <div class="s" style="color:var(--muted);margin:18px 0 12px">Levels 1&ndash;${OPEN_LEVELS} are open below - click a task to load it into the playground. Levels ${OPEN_LEVELS + 1}+ unlock with registration.</div>
      ${d.levels.map((l) => l.locked ? `
        <div class="lvl-row locked">
          <span class="lvl-no">W${l.week} &middot; LVL ${l.no}</span>
          <div style="flex:1"><strong style="font-size:13.5px">${esc(l.title)}</strong><div class="s" style="color:var(--muted)">${esc(l.topic)} &middot; ${l.problems_count} tasks</div></div>
          <a class="btn btn-ghost btn-sm" href="#register">&#128274; Register to unlock</a>
        </div>` : `
        <div class="lvl-row">
          <span class="lvl-no">W${l.week} &middot; LVL ${l.no}</span>
          <div style="flex:1">
            <strong style="font-size:13.5px">${esc(l.title)}</strong><div class="s" style="color:var(--muted)">${esc(l.topic)}</div>
            <div>${l.problems.map((p) => `<span class="prob-chip" onclick='openPlayTask(${JSON.stringify(p).replace(/'/g, '&#39;')})'>${esc(p.title)} &middot; ${p.points}&#128142;</span>`).join('')}</div>
          </div>
        </div>`).join('')}`;
  } catch (e) { panel.innerHTML = `<div class="empty">${esc(e.message)}</div>`; }
}

function openPlayTask(p) {
  $('playIde').style.display = '';
  $('pbTitle').textContent = p.title;
  $('pbDesc').textContent = p.description;
  $('pbRefs').innerHTML = (p.refs || []).length ? '<strong>Resources:</strong> ' + p.refs.map((r) => `<a href="${esc(r[1])}" target="_blank" rel="noopener">${esc(r[0])}</a>`).join(' &middot; ') : '';
  if (!PLAY_TERM) { PLAY_TERM = EchoTerm.mount($('playTerm')); EchoRun.wireEditor($('playCode')); }
  PLAY_TERM.clear();
  $('playStatus').textContent = 'Ready.';
  $('playIde').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function runPlayCode() {
  const btn = $('playRunBtn'); const status = $('playStatus');
  const code = $('playCode').value;
  if (!code.trim()) { status.textContent = 'Write some code first.'; return; }
  if (EchoRun.isRunning()) { EchoRun.cancel(); btn.innerHTML = '&#9654; Run'; return; }
  if (!PLAY_TERM) { PLAY_TERM = EchoTerm.mount($('playTerm')); EchoRun.wireEditor($('playCode')); }
  btn.innerHTML = '&#9632; Stop';
  try { await EchoRun.execute(code, { term: PLAY_TERM, onStatus: (t) => { status.textContent = t; } }); }
  catch (e) { status.textContent = e.message; }
  btn.innerHTML = '&#9654; Run';
}

function clearPlayTerm() { if (PLAY_TERM) PLAY_TERM.clear(); $('playStatus').textContent = 'Ready.'; }
