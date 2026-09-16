'use strict';

// Application URL literals, not arbitrary strings like split('/'). The
// client-side fetch guard is a second boundary for dynamically built URLs.
const ROOTS = 'api|js|css|img|images|fonts|uploads|talent-media|talent|courses|auth|login|dashboard|open|compiler|cert|verify|challan|grade|privacy|reset-password|recruiter-signup|registration-status|admin|u|sitemap\\.xml';
const literal = new RegExp('(["\'`])/(?!demo(?:/|["\'`?#]))(?=(?:' + ROOTS + ')(?:/|["\'`?#]))', 'g');
function scopeUrl(value) {
  if (value.startsWith('/') && !value.startsWith('//') && !/^\/demo(?:\/|$|[?#])/.test(value)) return '/demo' + value;
  return value;
}
function rewrite(text, type) {
  if (/json/i.test(type)) {
    try {
      return JSON.stringify(JSON.parse(text), (key, value) => typeof value === 'string' ? scopeUrl(value) : value);
    } catch { return text; }
  }
  let out = text.replace(literal, '$1/demo/');
  if (/html/i.test(type)) {
    out = out.replace(/(\b(?:href|src|action)=['"])\/(?!\/|demo(?:\/|['"?#]))/g, '$1/demo/');
    out = out.replace(/(<a\b[^>]*href=")\/demo\/("[^>]*data-demo-exit\b)/g, '$1/$2');
    // Runs before the application scripts and does not affect normal pages.
    out = out.replace(/<head>/i, '<head><script src="/demo/js/demo-guard.js"></script>');
  }
  if (/css/i.test(type)) out = out.replace(/url\((['"]?)\/(?!\/|demo\/)/g, 'url($1/demo/');
  out = out.replace(/(location\.href\s*=\s*['"])\/(['"])/g, '$1/demo/$2');
  return out;
}
module.exports = { rewrite, scopeUrl };
