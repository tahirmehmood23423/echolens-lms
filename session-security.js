'use strict';
const crypto = require('node:crypto');
// Password hashes already persist in every store mode. Binding a token to
// that hash revokes it on every password change/reset without extra schema.
function sessionVersion(user, secret) {
  return crypto.createHmac('sha256', secret).update(`${user.id}:${user.password_hash || 'passwordless'}`).digest('hex');
}
function validSession(payload, user, secret) {
  if (!user || typeof payload.sv !== 'string') return false;
  const expected = Buffer.from(sessionVersion(user, secret));
  const actual = Buffer.from(payload.sv);
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}
function safeReturnPath(value, origin, fallback = '/open#free') {
  try { if (typeof value !== 'string' || /[\\\r\n]/.test(value)) return fallback; const u = new URL(value, origin); if (u.origin !== new URL(origin).origin || u.pathname.startsWith('/api/') || ['/login','/auth/google/callback'].includes(u.pathname)) return fallback; return u.pathname + u.search + u.hash; } catch { return fallback; }
}
module.exports = { sessionVersion, validSession, safeReturnPath };
