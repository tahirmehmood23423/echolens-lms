'use strict';
// Public YouTube research only. Does not initialize the application or database.
const fs = require('node:fs');
const path = require('node:path');
const dir = path.join(__dirname, 'trending-video-research');
fs.mkdirSync(dir, { recursive: true });
function extract(html, name) {
  const match = new RegExp('(?:var\\s+' + name + '\\s*=|window\\["' + name + '"\\]\\s*=)\\s*').exec(html);
  if (!match) throw Error(name + ' missing');
  const start = match.index + match[0].length;
  let depth = 0, quoted = false, escaped = false;
  for (let i = start; i < html.length; i++) {
    const c = html[i];
    if (quoted) { if (escaped) escaped = false; else if (c === '\\') escaped = true; else if (c === '"') quoted = false; }
    else if (c === '"') quoted = true;
    else if (c === '{') depth++;
    else if (c === '}' && --depth === 0) return JSON.parse(html.slice(start, i + 1));
  }
  throw Error('Incomplete ' + name);
}
const textOf = v => v?.simpleText || v?.runs?.map(r => r.text).join('') || '';
function find(node, key, found = []) {
  if (!node || typeof node !== 'object') return found;
  if (node[key]) found.push(node[key]);
  for (const value of Object.values(node)) if (typeof value === 'object') find(value, key, found);
  return found;
}
async function page(url) {
  const r = await fetch(url, { signal: AbortSignal.timeout(15000), headers: { 'Accept-Language': 'en-US,en;q=0.9', Connection: 'close' } });
  if (!r.ok) throw Error('HTTP ' + r.status);
  return r.text();
}
async function search(key, query) {
  const data = extract(await page('https://www.youtube.com/results?search_query=' + encodeURIComponent(query)), 'ytInitialData');
  const seen = new Set();
  const results = find(data, 'videoRenderer').filter(v => !seen.has(v.videoId) && seen.add(v.videoId)).map(v => ({
    id: v.videoId, title: textOf(v.title), channel: textOf(v.ownerText), duration: textOf(v.lengthText), views: textOf(v.viewCountText),
    description: (v.detailedMetadataSnippets || []).map(s => textOf(s.snippetText)).join(' '),
  })).filter(v => { const n = v.duration.split(':').reduce((s, n) => s * 60 + Number(n), 0); return n > 60 && n < 1200; });
  fs.writeFileSync(path.join(dir, 'search-' + key + '.json'), JSON.stringify({ query, checked_at: new Date().toISOString(), results }, null, 2));
  console.log(JSON.stringify({ key, query, results: results.slice(0, 7).map(({description,...r})=>r) }));
}
async function inspect(id) {
  const url = 'https://www.youtube.com/watch?v=' + id;
  const html = await page(url + '&hl=en&gl=US');
  const player = extract(html, 'ytInitialPlayerResponse');
  const data = extract(html, 'ytInitialData');
  const v = player.videoDetails;
  if (v?.videoId !== id) throw Error('Video ID mismatch');
  let comments = find(data, 'commentsEntryPointHeaderRenderer').map(r => textOf(r.commentCount)).find(v => /\d/.test(v))
    || find(data, 'commentsHeaderRenderer').map(r => textOf(r.countText)).find(v => /\d/.test(v)) || null;
  let comment_samples = [], comments_error = null;
  try {
    const section = find(data, 'itemSectionRenderer').find(r => r.targetId === 'comments-section');
    const continuation = find(section, 'continuationCommand')[0]?.token;
    if (continuation) {
      const clientVersion = html.match(/"INNERTUBE_CLIENT_VERSION":"([^"]+)"/)?.[1] || html.match(/"clientVersion":"([^"]+)"/)?.[1];
      const response = await fetch('https://www.youtube.com/youtubei/v1/next', {
        method: 'POST', signal: AbortSignal.timeout(12000), headers: { 'Content-Type':'application/json', Connection:'close' },
        body: JSON.stringify({ context: { client: { clientName:'WEB', clientVersion, hl:'en', gl:'US' } }, continuation }),
      });
      const next = await response.json();
      comments = find(next, 'commentsHeaderRenderer').map(r => textOf(r.countText)).find(v => /\d/.test(v)) || comments;
      comment_samples = find(next, 'commentRenderer').map(r => textOf(r.contentText)).slice(0, 5);
      if (!comment_samples.length) comment_samples = find(next, 'commentEntityPayload').map(r => r.properties?.content?.content).filter(Boolean).slice(0, 5);
    }
  } catch (e) { comments_error = e.message; }
  const row = { id, url, checked_at: new Date().toISOString(), title: v.title, channel: v.author,
    duration_seconds: Number(v.lengthSeconds), views: Number(v.viewCount), comments, comment_samples, comments_error,
    status: player.playabilityStatus?.status, playable_in_embed: player.playabilityStatus?.playableInEmbed,
    description: v.shortDescription,
    source: 'Public YouTube watch page: ytInitialPlayerResponse and ytInitialData' };
  fs.writeFileSync(path.join(dir, id + '.json'), JSON.stringify(row, null, 2));
  console.log(JSON.stringify({ ...row, description: row.description?.slice(0, 1600) }));
}
async function main() {
  const mode = process.argv[2];
  let queue;
  if (mode === 'batch') queue = Object.entries(require('./trending-video-queries.json')).filter(([key]) => !fs.existsSync(path.join(dir, 'search-' + key + '.json')));
  else if (mode === 'search') queue = [[process.argv[3], process.argv.slice(4).join(' ')]];
  else queue = process.argv.slice(3);
  await Promise.all(Array.from({ length: 3 }, async () => {
    while (queue.length) {
      const item = queue.shift();
      try { if (mode === 'inspect') await inspect(item); else await search(...item); }
      catch (e) { console.log(JSON.stringify({ item, error: e.message, cause:e.cause?.message })); }
    }
  }));
}
main().catch(e => { console.error(e); process.exitCode = 1; });
