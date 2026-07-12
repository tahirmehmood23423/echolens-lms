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

  // When Google OAuth is configured, the three Start Free buttons go straight
  // to Google. Otherwise they open the email sign-up on the open portal.
  try {
    const p = await api('/api/auth/providers');
    if (p.google) {
      ['heroGoogle', 'bandGoogle', 'ctaGoogle'].forEach((id) => {
        const el = $(id);
        if (el) el.href = '/auth/google?back=/open';
      });
    }
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
})();

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
