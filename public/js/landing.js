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
  try {
    const me = await api('/api/auth/me');
    const b = $('signinBtn');
    // Signed-in visitors go straight to THEIR home: learners with free/open
    // accounts to the open portal, portal accounts to the LMS.
    if (me.role === 'free') { b.textContent = 'Open portal'; b.href = '/open'; }
    else { b.textContent = 'Open LMS Portal'; b.href = '/dashboard'; }
  } catch {}

  try {
    const info = await api('/api/public/info');
    OPEN_LEVELS = info.open_levels || 3;
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
    // v12: the catalogue moved behind sign-in (/open, Courses tab).
  } catch (e) { console.warn(e); }

})();

// v12: the open playground moved to /open - a sign-in-gated, problem-set style
// problem set with the free multi-language compiler and open events.
