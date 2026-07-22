'use strict';
const $ = (id) => document.getElementById(id);
async function api(path, opts = {}) {
  const res = await fetch(path, { credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, ...opts });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) { const err = new Error(data.error || 'Something went wrong.'); err.data = data; throw err; }
  return data;
}
function msg(text, ok) {
  const el = $('msg');
  if (!text) { el.className = 'form-msg'; el.textContent = ''; return; }
  el.className = 'form-msg ' + (ok ? 'ok' : 'err'); el.textContent = text;
}

// Already a signed-in recruiter? Go straight to the portal.
(async () => { try { const me = await api('/api/auth/me'); if (me.role === 'recruiter') location.href = '/dashboard'; } catch {} })();

const form = $('signupForm');
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const f = e.target; const btn = $('submit'); btn.disabled = true; msg('');
  const body = {
    full_name: f.full_name.value.trim(),
    work_email: f.work_email.value.trim(),
    company_name: f.company_name.value.trim(),
    company_website: f.company_website.value.trim(),
    designation: f.designation.value.trim(),
    city: f.city.value.trim(),
    company_size_band: f.company_size_band.value,
    hiring_note: f.hiring_note.value.trim(),
    override_requested: f.override_requested ? f.override_requested.checked : false,
    override_reason: f.override_reason ? f.override_reason.value.trim() : '',
  };
  try {
    const out = await api('/api/recruiters/signup', { method: 'POST', body: JSON.stringify(body) });
    msg(out.password ? `Account created (dev mode, SMTP not configured) - your password: ${out.password}` : 'Account created - check your email for your password. Redirecting...', true);
    setTimeout(() => { location.href = '/dashboard'; }, out.password ? 4000 : 1200);
  } catch (err) {
    msg(err.message);
    // The domain-block error tells the recruiter to use the small-company
    // override instead of just failing silently a second time.
    if (err.data && err.data.needs_override) {
      $('overrideBox').style.display = '';
      $('overrideReasonBox').style.display = '';
    }
    btn.disabled = false;
  }
});
