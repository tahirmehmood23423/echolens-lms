'use strict';
const fs = require('node:fs');
const path = require('node:path');
const cache = path.join(process.env.LOCALAPPDATA, 'npm-cache', '_npx');
let playwright;
try { playwright = require('playwright'); } catch {
  for (const dir of fs.readdirSync(cache)) {
    const candidate = path.join(cache, dir, 'node_modules', 'playwright');
    if (fs.existsSync(path.join(candidate, 'package.json'))) { playwright = require(candidate); break; }
  }
}
if (!playwright) throw new Error('Playwright must be installed or present in the local npm cache.');
const BASE = 'http://127.0.0.1:4318';
const evidence = path.join(__dirname, 'evidence');
fs.mkdirSync(evidence, { recursive: true });
async function launch() { return playwright.chromium.launch({ headless: true, channel: 'chrome' }); }
async function context(browser, viewport = { width: 1440, height: 1000 }) {
  const ctx = await browser.newContext({ viewport, locale: 'en-GB', timezoneId: 'Asia/Karachi', isMobile: viewport.width < 600, hasTouch: viewport.width < 600 });
  await ctx.route('**/*', route => {
    const u = new URL(route.request().url());
    if (u.origin === BASE || ['data:', 'blob:'].includes(u.protocol)) return route.continue();
    if (route.request().method() === 'GET' && /^(cdn\.jsdelivr\.net|cdnjs\.cloudflare\.com|fonts\.googleapis\.com|fonts\.gstatic\.com)$/.test(u.hostname)) return route.continue();
    return route.abort('blockedbyclient');
  });
  ctx.setDefaultTimeout(10000);
  return ctx;
}
async function login(ctx, role) {
  const r = await ctx.request.post(BASE + '/api/auth/login', { data: { login: `qa.${role}`, password: 'LocalQa!2026' } });
  if (!r.ok()) throw new Error(`Login ${role}: ${r.status()} ${await r.text()}`);
}
async function inspect(page) {
  return page.evaluate(() => {
    const visible = el => !!(el.getClientRects().length && getComputedStyle(el).visibility !== 'hidden');
    const label = el => (el.getAttribute('aria-label') || el.getAttribute('title') || el.innerText || el.getAttribute('placeholder') || '').trim().slice(0, 100);
    const controls = [...document.querySelectorAll('button,a,input,select,textarea,[onclick]')].filter(visible);
    const overflow = [...document.querySelectorAll('body *')].filter(el => { if (!visible(el) || ['SCRIPT','STYLE','SVG','PATH'].includes(el.tagName)) return false; const r = el.getBoundingClientRect(); return r.right > innerWidth + 2 || r.left < -2; }).slice(0, 25).map(el => ({ tag: el.tagName, id: el.id, class: String(el.className).slice(0, 100), text: label(el), right: Math.round(el.getBoundingClientRect().right) }));
    return { url: location.href, title: document.title, heading: [...document.querySelectorAll('h1,h2')].filter(visible).map(el => el.innerText).slice(0, 10), width: innerWidth, documentWidth: document.documentElement.scrollWidth, overflow, visibleControls: controls.length, unnamedButtons: controls.filter(el => el.tagName === 'BUTTON' && !label(el)).map(el => el.outerHTML.slice(0, 180)), clickOnly: controls.filter(el => el.hasAttribute('onclick') && !['BUTTON','A','INPUT','SELECT','TEXTAREA'].includes(el.tagName) && !el.hasAttribute('tabindex')).map(el => ({ tag: el.tagName, text: label(el), html: el.outerHTML.slice(0, 180) })).slice(0, 12), shortTargets: controls.filter(el => {const r = el.getBoundingClientRect();return r.width < 24 || r.height < 24;}).slice(0, 15).map(el => ({ text: label(el), width: Math.round(el.getBoundingClientRect().width), height: Math.round(el.getBoundingClientRect().height) })), text: document.body.innerText.slice(0, 14000) };
  });
}
async function screenshot(page, name) { await page.screenshot({ path: path.join(evidence, `${name}.png`), fullPage: true }); }
module.exports = { BASE, evidence, launch, context, login, inspect, screenshot };
