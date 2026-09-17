(function () {
  'use strict';
  if (!/^\/demo(?:\/|$)/.test(location.pathname)) return;
  const scoped = value => {
    const url = new URL(value, location.href);
    if (url.origin === location.origin && !/^\/demo(?:\/|$)/.test(url.pathname)) url.pathname = '/demo' + url.pathname;
    return url.href;
  };
  const originalFetch = window.fetch.bind(window);
  window.fetch = (input, options) => originalFetch(input instanceof Request ? new Request(scoped(input.url), input) : scoped(input), options);
  const originalOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function (method, url, ...args) { return originalOpen.call(this, method, scoped(url), ...args); };
  const originalWindowOpen = window.open.bind(window);
  window.open = (url, ...args) => originalWindowOpen(scoped(url || '/demo/'), ...args);
  for (const method of ['pushState', 'replaceState']) {
    const original = history[method].bind(history);
    history[method] = (state, unused, url) => original(state, unused, url == null ? url : scoped(url));
  }
  const pageUrl = new URL(location.href);
  if (pageUrl.searchParams.get('portal') === 'student') sessionStorage.setItem('demo:student-tour', 'true');
  else if (/^\/demo\/?$/.test(pageUrl.pathname)) sessionStorage.removeItem('demo:student-tour');
  const studentTour = sessionStorage.getItem('demo:student-tour') === 'true';
  if (pageUrl.searchParams.has('returnTo')) {
    const target = new URL(scoped(pageUrl.searchParams.get('returnTo')));
    pageUrl.searchParams.set('returnTo', target.pathname + target.search + target.hash);
    history.replaceState(null, '', pageUrl);
  }
  // Demo drafts and account preferences must not overwrite live portal drafts.
  for (const method of ['getItem', 'setItem', 'removeItem']) {
    const original = Storage.prototype[method];
    Storage.prototype[method] = function (key, ...args) { return original.call(this, 'demo:' + key, ...args); };
  }
  Storage.prototype.clear = function () {
    for (let i = this.length - 1; i >= 0; i--) {
      const key = this.key(i);
      if (key.startsWith('demo:')) Storage.prototype.removeItem.call(this, key.slice(5));
    }
  };
  document.addEventListener('click', event => {
    const link = event.target.closest('a[href]');
    if (!link || link.hasAttribute('data-demo-exit') || /^(#|mailto:|tel:|javascript:)/i.test(link.getAttribute('href'))) return;
    link.href = scoped(link.href);
    if (studentTour && /^\/demo\/?$/.test(new URL(link.href).pathname)) link.href = '/demo/?portal=student';
  }, true);
  document.addEventListener('submit', event => {
    if (event.target.action) event.target.action = scoped(event.target.action);
  }, true);
  document.addEventListener('DOMContentLoaded', () => {
    const style = document.createElement('style');
    style.textContent = '.demo-notice{position:fixed;bottom:0;left:0;right:0;z-index:100000;background:#172554;color:#fff;padding:12px 20px;display:flex;justify-content:center;align-items:center;flex-wrap:wrap;gap:8px 18px;font:14px/1.4 system-ui;box-shadow:0 -2px 12px #0002}.demo-notice a{color:#a5f3fc;text-decoration:underline}body{padding-bottom:70px!important}@media(max-width:600px){.demo-notice{font-size:12px;padding:9px}}';
    document.head.append(style);
    const banner = document.createElement('aside');
    banner.className = 'demo-notice';
    banner.setAttribute('aria-label', 'Read-only demo');
    banner.innerHTML = '<strong>Read-only demo · Sample data</strong><span>Changes and external actions are disabled.</span><a href="/demo/">Switch portal / credentials</a><a href="/" data-demo-exit>Exit demo</a>';
    if (studentTour) banner.querySelector('a[href="/demo/"]').remove();
    document.body.append(banner);
  });
})();
