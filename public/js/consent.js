/* Cookie consent + consent-gated Google Analytics.
 *
 * This file REPLACES the inline gtag snippet that used to sit in every page
 * head. Analytics now loads only after the visitor clicks Accept - that is the
 * whole point of the banner, and the Cookie Policy says so, so nothing here may
 * quietly load the tag before a choice is made.
 *
 * No dependencies, no build step: a plain script tag in <head>, same as the
 * snippet it replaces. The banner is injected after DOM ready so it never
 * blocks first paint.
 *
 * The visitor's choice lives in localStorage, per browser. It is never sent to
 * the server, so a signed-out visitor and a signed-in learner on the same
 * browser share one choice.
 */
(() => {
  'use strict';
  const GA_ID = 'G-JPPLHMV7TD';
  const KEY = 'el_cookie_consent';        // 'granted' | 'denied'
  const POLICY_VERSION = '2026-09-18';    // bump to re-ask after a policy change
  const STORE_KEY = KEY + ':' + POLICY_VERSION;

  // Private windows and blocked site-data both throw on access rather than
  // returning null, so every read and write is guarded. A browser that cannot
  // store the answer still gets the banner and still gets no analytics.
  const read = () => { try { return localStorage.getItem(STORE_KEY); } catch { return null; } };
  const write = (value) => { try { localStorage.setItem(STORE_KEY, value); } catch { /* choice applies to this page view only */ } };

  let loaded = false;
  function loadAnalytics() {
    if (loaded || !GA_ID) return;
    loaded = true;
    window.dataLayer = window.dataLayer || [];
    function gtag() { window.dataLayer.push(arguments); }
    window.gtag = gtag;
    const tag = document.createElement('script');
    tag.async = true;
    tag.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
    document.head.appendChild(tag);
    gtag('js', new Date());
    // Support-ticket links carry a private access token in the fragment
    // (/open#ticket=<id>&token=<secret>). gtag reports location.href verbatim,
    // so redact the token before the page_view is sent.
    gtag('config', GA_ID, { page_location: location.href.replace(/([#&]token=)[^&]*/g, '$1redacted') });
  }

  const STYLE = `
.cc-banner{position:fixed;left:0;right:0;bottom:0;z-index:2147483000;display:flex;gap:16px;
  align-items:center;flex-wrap:wrap;justify-content:center;padding:16px 20px;
  background:#0B1530;color:#fff;box-shadow:0 -4px 24px rgba(11,21,48,.24);
  font:14px/1.5 Inter,system-ui,sans-serif}
.cc-banner p{margin:0;max-width:70ch;flex:1 1 380px}
.cc-banner a{color:#7FD6FF;text-decoration:underline}
.cc-actions{display:flex;gap:10px;flex:0 0 auto}
.cc-btn{font:inherit;font-weight:600;padding:10px 20px;border-radius:10px;border:0;cursor:pointer}
.cc-accept{background:linear-gradient(135deg,#6C4DFF,#3BA8FF);color:#fff}
.cc-decline{background:transparent;color:#fff;border:1px solid rgba(255,255,255,.45)}
.cc-btn:hover{opacity:.92}
.cc-btn:focus-visible{outline:2px solid #7FD6FF;outline-offset:2px}
@media(max-width:640px){.cc-banner{flex-direction:column;align-items:stretch;text-align:left}
  .cc-actions{justify-content:stretch}.cc-btn{flex:1}}`;

  let banner = null;
  function closeBanner() {
    if (!banner) return;
    banner.remove();
    banner = null;
  }

  function showBanner() {
    if (banner || !document.body) return;
    if (!document.getElementById('cc-style')) {
      const style = document.createElement('style');
      style.id = 'cc-style';
      style.textContent = STYLE;
      document.head.appendChild(style);
    }
    banner = document.createElement('div');
    banner.className = 'cc-banner';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-live', 'polite');
    banner.setAttribute('aria-label', 'Cookie choices');
    banner.innerHTML = `
      <p>We use a sign-in cookie that the site needs to work, and Google Analytics to understand how the site is used.
         Analytics runs only if you accept. Read our <a href="/cookie-policy">Cookie Policy</a> and
         <a href="/privacy-policy">Privacy Policy</a>.</p>
      <div class="cc-actions">
        <button type="button" class="cc-btn cc-decline">Decline</button>
        <button type="button" class="cc-btn cc-accept">Accept</button>
      </div>`;
    banner.querySelector('.cc-accept').addEventListener('click', () => { write('granted'); closeBanner(); loadAnalytics(); });
    banner.querySelector('.cc-decline').addEventListener('click', () => { write('denied'); closeBanner(); });
    document.body.appendChild(banner);
    banner.querySelector('.cc-accept').focus({ preventScroll: true });
  }

  // Declining cannot unload a tag that is already running, so a visitor who
  // changes their mind is told to reload - rather than being shown a button
  // that pretends to stop collection it cannot stop.
  window.elCookieConsent = {
    get state() { return read() || 'unset'; },
    reopen() { closeBanner(); showBanner(); },
  };

  function start() {
    const choice = read();
    if (choice === 'granted') { loadAnalytics(); return; }
    if (choice === 'denied') return;
    showBanner();
  }
  // Any page can offer "change your cookie choice" with data-cookie-settings.
  document.addEventListener('click', (event) => {
    const trigger = event.target.closest('[data-cookie-settings]');
    if (!trigger) return;
    event.preventDefault();
    window.elCookieConsent.reopen();
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
