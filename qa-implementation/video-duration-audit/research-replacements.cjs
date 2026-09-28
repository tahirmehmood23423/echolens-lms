'use strict';
const fs = require('node:fs');
const path = require('node:path');
const dir = path.join(__dirname, 'replacements');
fs.mkdirSync(dir, { recursive: true });

function extract(html, name) {
  const marker = 'var ' + name + ' = ';
  const index = html.indexOf(marker);
  if (index < 0) throw Error(name + ' missing');
  const start = index + marker.length;
  let depth = 0, quoted = false, escaped = false;
  for (let i = start; i < html.length; i++) {
    const c = html[i];
    if (quoted) {
      if (escaped) escaped = false;
      else if (c === '\\') escaped = true;
      else if (c === '"') quoted = false;
    } else if (c === '"') quoted = true;
    else if (c === '{') depth++;
    else if (c === '}' && --depth === 0) return JSON.parse(html.slice(start, i + 1));
  }
  throw Error('Incomplete ' + name);
}
const textOf = v => v?.simpleText || v?.runs?.map(r => r.text).join('') || '';
function walk(node, found = []) {
  if (!node || typeof node !== 'object') return found;
  if (node.videoRenderer) found.push(node.videoRenderer);
  for (const value of Object.values(node)) if (typeof value === 'object') walk(value, found);
  return found;
}
async function search(query) {
  const response = await fetch('https://www.youtube.com/results?search_query=' + encodeURIComponent(query), { signal: AbortSignal.timeout(30000) });
  const data = extract(await response.text(), 'ytInitialData');
  const seen = new Set();
  const results = walk(data).filter(v => !seen.has(v.videoId) && seen.add(v.videoId)).map(v => ({
    id: v.videoId, title: textOf(v.title), channel: textOf(v.ownerText), duration: textOf(v.lengthText),
    description: (v.detailedMetadataSnippets || []).map(s => textOf(s.snippetText)).join(' '),
  }));
  fs.writeFileSync(path.join(dir, 'search-' + query.replace(/[^a-z0-9]+/gi, '-').slice(0, 100) + '.json'), JSON.stringify({ query, checked_at: new Date().toISOString(), results }, null, 2));
  console.log(JSON.stringify({ query, results: results.filter(r => r.duration && r.duration.split(':').map(Number).reduce((n, v) => n * 60 + v, 0) < 1500).slice(0, 7) }));
}
async function inspect(id) {
  const url = 'https://www.youtube.com/watch?v=' + id;
  const response = await fetch(url, { signal: AbortSignal.timeout(30000) });
  const html = await response.text();
  const player = extract(html, 'ytInitialPlayerResponse');
  const details = player.videoDetails;
  if (details?.videoId !== id) throw Error('Video ID mismatch for ' + id);
  const row = { id, url, checked_at: new Date().toISOString(), title: details.title, channel: details.author,
    duration_seconds: Number(details.lengthSeconds), status: player.playabilityStatus?.status,
    embeddable: player.microformat?.playerMicroformatRenderer?.isFamilySafe !== false && player.playabilityStatus?.playableInEmbed === true,
    playable_in_embed: player.playabilityStatus?.playableInEmbed,
    description: details.shortDescription,
    captions: player.captions?.playerCaptionsTracklistRenderer?.captionTracks?.map(c => ({ language: c.languageCode, kind: c.kind, url: c.baseUrl })) || [] };
  // Keep caption request tokens out of the saved public evidence.
  const caption = row.captions.find(c => c.language === 'en') || row.captions.find(c => c.language.startsWith('en'));
  if (caption) {
    try {
      const captionResponse = await fetch(caption.url + '&fmt=json3', { signal: AbortSignal.timeout(10000) });
      const raw = await captionResponse.text();
      row.transcript_bytes = raw.length;
      if (raw) row.transcript = JSON.parse(raw).events?.flatMap(e => e.segs?.map(s => s.utf8) || []).join(' ');
    } catch (e) { row.transcript_error = e.message; }
  }
  row.captions = row.captions.map(({ language, kind }) => ({ language, kind }));
  fs.writeFileSync(path.join(dir, id + '.json'), JSON.stringify(row, null, 2));
  console.log(JSON.stringify({ ...row, description: row.description?.slice(0, 4500), transcript: row.transcript?.slice(0, 1600) }));
}
(async () => {
  const mode = process.argv[2];
  const queue = process.argv.slice(3);
  await Promise.all(Array.from({ length: 3 }, async () => { while (queue.length) { const value = queue.shift(); try { await (mode === 'search' ? search(value) : inspect(value)); } catch (e) { console.log(JSON.stringify({ value, error: e.message })); } } }));
})().catch(e => { console.error(e.message); process.exitCode = 1; });
