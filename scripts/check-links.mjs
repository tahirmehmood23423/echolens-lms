#!/usr/bin/env node
// Dependency-free, read-only HTTP crawl. No forms, API calls or sign-in actions.
import { pathToFileURL } from 'node:url';
const decode = value => value.replace(/&amp;/g, '&').replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n))).replace(/&#x([\da-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)));
export function anchors(html) {
  html = html.replace(/<!--[\s\S]*?-->|<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, '');
  const links = [];
  for (const match of html.matchAll(/<a\b[^>]*>/gi)) {
    const href = match[0].match(/\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
    if (href) links.push(decode(href[1] ?? href[2] ?? href[3]));
  }
  return links;
}
export async function crawl(base, { maxPages = 2000, timeout = 30000, log = console.log } = {}) {
  const origin = new URL(base).origin;
  const queue = [{ url: new URL(base).href, from: '(start)' }], seen = new Set(), failures = [], warnings = [];
  // Following logout/delete links could mutate a session. Only public pages are crawled.
  const excluded = /^\/(?:demo\/)?(?:api|auth|uploads)(?:\/|$)/i;
  const fragments = new Set();
  while (queue.length && seen.size < maxPages) {
    const item = queue.shift(), url = new URL(item.url);
    url.hash = '';
    if (seen.has(url.href)) continue;
    seen.add(url.href);
    try {
      const response = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(timeout) });
      log(`${response.status} ${url.pathname}${url.search}`);
      if (response.status !== 200) { failures.push({ url: url.href, status: response.status, from: item.from }); await response.body?.cancel(); continue; }
      if (new URL(response.url).origin !== origin) { failures.push({ url: url.href, status: 'external-redirect', from: item.from }); await response.body?.cancel(); continue; }
      if (!response.headers.get('content-type')?.includes('text/html')) { await response.body?.cancel(); continue; }
      const html = await response.text();
      for (const href of anchors(html)) {
        if (!href || href === '#' || /^javascript:/i.test(href)) { warnings.push({ url: url.href, href, reason: 'placeholder link' }); continue; }
        let target; try { target = new URL(href, response.url); } catch { warnings.push({ url: url.href, href, reason: 'invalid URL' }); continue; }
        if (!['http:', 'https:'].includes(target.protocol) || target.origin !== origin || excluded.test(target.pathname)) continue;
        if (target.hash) {
          fragments.add(target.pathname + target.search + target.hash);
          if (target.pathname === new URL(response.url).pathname && !['/open', '/dashboard', '/demo/open', '/demo/dashboard'].includes(target.pathname)) {
            const id = decodeURIComponent(target.hash.slice(1));
            const escaped = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            if (!new RegExp(`(?:id|name)=["']${escaped}["']`).test(html)) warnings.push({ url: url.href, href, reason: 'missing fragment target' });
          }
        }
        target.hash = '';
        if (!seen.has(target.href)) queue.push({ url: target.href, from: url.href });
      }
    } catch (error) { failures.push({ url: url.href, status: 'request-failed', message: error.message, from: item.from }); }
  }
  if (queue.length) warnings.push({ reason: `Crawl limit ${maxPages} reached; results incomplete.` });
  log(`Checked ${seen.size} URLs; ${failures.length} failures; ${warnings.length} warnings.`);
  for (const failure of failures) log('FAIL ' + JSON.stringify(failure));
  for (const warning of warnings) log('WARN ' + JSON.stringify(warning));
  if (fragments.size) log('Hash destinations (SPA states require browser verification): ' + [...fragments].join(', '));
  return { checked: seen.size, failures, warnings, fragments: [...fragments] };
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = process.argv.slice(2), base = args.find(arg => !arg.startsWith('--')) || 'http://127.0.0.1:3000/';
  const maxArg = args.find(arg => arg.startsWith('--max-pages='));
  const maxPages = maxArg ? Number(maxArg.split('=')[1]) : 2000;
  if (!Number.isInteger(maxPages) || maxPages < 1) throw Error('--max-pages must be a positive integer');
  const result = await crawl(base, { maxPages });
  process.exitCode = result.failures.length || result.warnings.length ? 1 : 0;
}
