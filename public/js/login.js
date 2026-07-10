'use strict';
const $ = (id) => document.getElementById(id);
async function api(path, opts = {}) {
  const res = await fetch(path, { credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, ...opts });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Something went wrong.');
  return data;
}
function msg(text) {
  const el = $('msg');
  if (!text) { el.className = 'form-msg'; el.textContent = ''; return; }
  el.className = 'form-msg err'; el.textContent = text;
}

// Already signed in? Go straight to the dashboard.
// Already signed in? Route by role: open (free) accounts live on the open
// portal, everyone else on the LMS portal.
(async () => { try { const me = await api('/api/auth/me'); location.href = me.role === 'free' ? '/open' : '/dashboard'; } catch {} })();

$('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const f = e.target; const btn = $('submit'); btn.disabled = true; msg('');
  try {
    const out = await api('/api/auth/login', { method: 'POST', body: JSON.stringify({ login: f.login.value.trim(), password: f.password.value }) });
    location.href = out.role === 'free' ? '/open' : '/dashboard';
  } catch (err) { msg(err.message); btn.disabled = false; }
});
