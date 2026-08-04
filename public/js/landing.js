'use strict';

/* EchoLens public landing (v12.4): nav state, live stats, Google sign-in
 * buttons, FAQ accordion, and the newsletter form. */

const $ = (id) => document.getElementById(id);

async function api(path, opts) {
  const res = await fetch(path, Object.assign({ credentials: 'same-origin' }, opts));
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Something went wrong.');
  return data;
}

(async () => {
  // Signed in already? The Login button becomes a shortcut to their portal.
  try {
    const me = await api('/api/auth/me');
    const b = $('signinBtn');
    if (me.role === 'free') { b.textContent = 'Open Portal'; b.href = '/open'; }
    else { b.textContent = 'My Portal'; b.href = '/dashboard'; }
  } catch {}

  // Live counts, so the page never shows stale numbers.
  try {
    const info = await api('/api/public/info');
    if (info.stats && info.stats.courses) {
      $('statCourses').textContent = info.stats.courses;
      $('ctaCourses').textContent = info.stats.courses;
      document.querySelectorAll('.view-all-count').forEach((el) => { el.textContent = info.stats.courses; });
    }
  } catch {}

  loadTestimonials();
})();

/* ------------------------------ testimonials ------------------------------
 * Real, admin-approved feedback only (see the public feedback wall at
 * /open#feedback and the admin moderation panel) - the section stays
 * hidden if there is nothing approved yet, rather than showing empty or
 * placeholder content on the marketing homepage. */
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
async function loadTestimonials() {
  let list;
  try { list = (await api('/api/public/feedback')).feedback; } catch { return; }
  if (!list || !list.length) return;
  const rated = list.filter((f) => f.rating);
  const avg = rated.length ? (rated.reduce((s, f) => s + f.rating, 0) / rated.length) : null;
  const initials = (name) => (String(name || '?').trim().match(/\S+/g) || ['?']).slice(0, 2).map((w) => w[0].toUpperCase()).join('');
  const monthYear = (iso) => { const d = new Date(String(iso).replace(' ', 'T')); return isNaN(d) ? '' : d.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }); };
  const stars = (n) => '&#9733;'.repeat(n || 0) + '&#9734;'.repeat(5 - (n || 0));
  $('storyGrid').innerHTML = list.slice(0, 6).map((f) => `
    <div class="story">
      <div class="story-head"><div class="story-av">${esc(initials(f.name))}</div><div><b>${esc(f.name)}</b><span>${esc(monthYear(f.created_at))}</span></div></div>
      ${f.rating ? `<div class="stars">${stars(f.rating)}</div>` : ''}
      <p>${esc(f.message)}</p>
      ${f.reply ? `<p style="font-size:12px;background:var(--violet-soft);color:var(--ink);border-radius:8px;padding:8px 10px;margin-top:-4px"><b>EchoLens replied:</b> ${esc(f.reply)}</p>` : ''}
    </div>`).join('');
  $('storiesSummary').textContent = avg
    ? `${avg.toFixed(1)} out of 5, from ${rated.length} review${rated.length === 1 ? '' : 's'} - ${list.length} total.`
    : `${list.length} review${list.length === 1 ? '' : 's'} from learners.`;
  $('stories').style.display = '';
}

/* ------------------------------ FAQ accordion ------------------------------ */
function toggleFaq(btn) {
  const item = btn.closest('.faq-item');
  const ans = item.querySelector('.faq-a');
  const open = item.classList.contains('open');
  // Close the others so only one answer is expanded at a time.
  document.querySelectorAll('.faq-item.open').forEach((it) => {
    it.classList.remove('open');
    it.querySelector('.faq-a').style.maxHeight = '0';
  });
  if (!open) {
    item.classList.add('open');
    ans.style.maxHeight = ans.scrollHeight + 'px';
  }
}
window.toggleFaq = toggleFaq;

/* ------------------------------ newsletter ------------------------------ */
const loopForm = $('loopForm');
if (loopForm) {
  loopForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = loopForm.email.value.trim();
    const msg = $('loopMsg');
    const btn = loopForm.querySelector('button');
    btn.disabled = true;
    try {
      await api('/api/public/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      msg.textContent = 'You are on the list. Watch your inbox for new courses and events.';
      msg.className = 'loop-msg show';
      loopForm.reset();
    } catch (err) {
      msg.textContent = err.message;
      msg.className = 'loop-msg show err';
    }
    btn.disabled = false;
  });
}

/* Close the mobile menu after a link is tapped. */
document.querySelectorAll('#navLinks a').forEach((a) => {
  a.addEventListener('click', () => $('navLinks').classList.remove('open'));
});
