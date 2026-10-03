'use strict';
const $ = (id) => document.getElementById(id);
const destination = role => EL.safeReturn(new URLSearchParams(location.search).get('returnTo'), role === 'free' ? '/open#free' : '/dashboard');
async function api(path, opts = {}) {
  const res = await fetch(path, { credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, ...opts });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Something went wrong.');
  return data;
}
function msg(text, ok) {
  const el = $('msg');
  if (!text) { el.className = 'form-msg'; el.textContent = ''; return; }
  el.className = 'form-msg ' + (ok ? 'ok' : 'err'); el.textContent = text;
}

// Already signed in? Go straight to the dashboard.
// Already signed in? Route by role: open (free) accounts live on the open
// portal, everyone else on the LMS portal.
(async () => { try { const me = await api('/api/auth/me'); location.replace(destination(me.role)); } catch {} })();

$('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const f = e.target; const btn = $('submit'); btn.disabled = true; msg('');
  try {
    const out = await api('/api/auth/login', { method: 'POST', body: JSON.stringify({ login: f.login.value.trim(), password: f.password.value }) });
    location.replace(destination(out.role));
  } catch (err) { msg(err.message); btn.disabled = false; }
});

function toggleForgot() {
  const box = $('forgotBox');
  const open = box.style.display === 'none';
  box.style.display = open ? '' : 'none';
  $('forgotLink').textContent = open ? 'Back to sign in' : 'Forgot your password?';
  if (open) $('forgotForm').querySelector('input[name="email"]').focus();
}
let recoveryEmail = '', recoveryToken = '';
$('forgotForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const f = e.target; const btn = $('forgotSubmit'); btn.disabled = true; msg('');
  try {
    const out = await api('/api/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email: f.email.value.trim(),returnTo:destination('free') }) });
    recoveryEmail = f.email.value.trim();
    recoveryToken = '';
    $('pinForm').hidden = false;
    $('pinForm').reset();
    $('recoveryPasswordForm').hidden = true;
    btn.textContent = 'Resend PIN';
    msg(out.message, true);
    $('pinForm').elements.pin.focus();
  } catch (err) { msg(err.message); }
  btn.disabled = false;
});

$('forgotForm').elements.email.addEventListener('input', () => {
  recoveryToken = ''; recoveryEmail = '';
  $('pinForm').hidden = true;
  $('recoveryPasswordForm').hidden = true;
});
$('pinForm').addEventListener('submit', async e => {
  e.preventDefault();
  const btn = $('pinSubmit'); btn.disabled = true; msg('');
  try {
    const out = await api('/api/auth/verify-reset-pin', { method: 'POST', body: JSON.stringify({ email: recoveryEmail, pin: e.target.elements.pin.value }) });
    recoveryToken = out.token;
    $('pinForm').hidden = true;
    $('forgotForm').hidden = true;
    $('recoveryPasswordForm').hidden = false;
    $('recoveryPasswordForm').elements.password.focus();
    msg('Email verified. Choose your new password.', true);
  } catch (err) { msg(err.message); }
  btn.disabled = false;
});
$('recoveryPasswordForm').addEventListener('submit', async e => {
  e.preventDefault();
  const f = e.target, btn = $('recoverySubmit');
  if (f.elements.password.value !== f.elements.confirm.value) return msg('Passwords do not match.');
  btn.disabled = true; msg('');
  try {
    await api('/api/auth/reset-password', { method: 'POST', body: JSON.stringify({ token: recoveryToken, password: f.elements.password.value }) });
    recoveryToken = ''; f.reset();
    $('forgotBox').style.display = 'none';
    $('forgotLink').textContent = 'Forgot your password?';
    $('forgotForm').hidden = false; f.hidden = true;
    $('loginForm').elements.login.value = recoveryEmail;
    $('loginForm').elements.password.value = '';
    $('loginForm').elements.password.focus();
    msg('Password changed. Sign in with your new password.', true);
  } catch (err) {
    msg(err.message);
    $('forgotForm').hidden = false;
  }
  btn.disabled = false;
});
