'use strict';

const MESSAGE = 'Read-only demo: explore the pages and forms, but changes, uploads and external actions are disabled.';
function allowed(method, rawPath) {
  let pathname;
  try { pathname = decodeURIComponent(rawPath.split('?')[0]).toLowerCase(); } catch { return false; }
  if (method === 'POST') return ['/api/auth/login', '/api/auth/logout'].includes(pathname);
  if (!['GET', 'HEAD'].includes(method)) return false;
  // These GETs have side effects, export complete stores, or fetch external
  // resources. They are not browsing operations even though their verb is GET.
  if (/^\/(?:auth|__loadtest)(?:\/|$)/.test(pathname)) return false;
  if (/^\/api\/(?:admin\/backup|fetch-dataset(?:\/|$)|.*(?:\/join|\/token)(?:\/|$))/.test(pathname)) return false;
  return true;
}
function middleware(req, res, next) {
  res.setHeader('X-EchoLens-Demo', 'read-only');
  res.setHeader('Cache-Control', 'no-store');
  if (!allowed(req.method, req.url)) return res.status(403).json({ error: MESSAGE, code: 'DEMO_READ_ONLY' });
  next();
}
module.exports = { allowed, middleware, MESSAGE };
