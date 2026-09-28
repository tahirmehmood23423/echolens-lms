'use strict';

// Read-only curriculum audit. Fetches public YouTube metadata; never loads store.js or a database.
const fs = require('node:fs');
const path = require('node:path');
const out = path.join(__dirname, 'video-duration-audit');
fs.mkdirSync(out, { recursive: true });
const files = ['python', 'bootcamps', 'short-courses', 'specialist', 'august-2026', 'short-courses-full', 'free-micro', 'cs-fundamentals', 'design-3d', 'curriculum-advanced-combined', 'trending-tech'];
const tracks = {};
for (const file of files) {
  for (const track of [require('../tracks/' + file)].flat()) {
    require('../tracks/content-corrections')(track);
    tracks[track.key] = track;
  }
}

function youtubeId(value) {
  try {
    const url = new URL(value);
    if (url.hostname === 'youtu.be') return url.pathname.slice(1);
    if (!/(^|\.)youtube(?:-nocookie)?\.com$/.test(url.hostname)) return null;
    return url.searchParams.get('v') || url.pathname.match(/^\/(?:embed|shorts|live)\/([^/]+)/)?.[1] || null;
  } catch { return null; }
}
function clock(seconds) {
  if (!Number.isFinite(seconds)) return 'UNVERIFIED';
  const h = Math.floor(seconds / 3600), m = Math.floor(seconds % 3600 / 60), s = seconds % 60;
  return h ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}` : `${m}:${String(s).padStart(2, '0')}`;
}
function extractPlayer(html) {
  const marker = /(?:var\s+ytInitialPlayerResponse\s*=|window\["ytInitialPlayerResponse"\]\s*=)\s*/g.exec(html);
  if (!marker) throw new Error('YouTube player metadata absent');
  const start = marker.index + marker[0].length;
  let depth = 0, quoted = false, escaped = false;
  for (let i = start; i < html.length; i++) {
    const char = html[i];
    if (quoted) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === '"') quoted = false;
    } else if (char === '"') quoted = true;
    else if (char === '{') depth++;
    else if (char === '}' && --depth === 0) return JSON.parse(html.slice(start, i + 1));
  }
  throw new Error('Incomplete YouTube player metadata');
}

const courses = Object.values(tracks).filter(t => t.free && t.published !== false);
const lessons = courses.flatMap(course => course.levels.map(level => ({
  course_code: course.course_code, course: course.title, track: course.key,
  module: level.module_no || level.week || level.no, module_title: level.module_title || null,
  lesson: level.no, lesson_title: level.title,
  urls: [...new Set([level.video_url, ...(level.videos || []).map(v => typeof v === 'string' ? v : v.url || v.video_url)].filter(Boolean))],
  resource_url: level.resource_url || null,
})));
const refs = lessons.flatMap(l => l.urls.map(url => ({ ...l, urls: undefined, url, video_id: youtubeId(url) })).filter(r => r.video_id));
const ids = [...new Set(refs.map(r => r.video_id))];
const evidenceFile = path.join(out, 'youtube-metadata.json');
const results = process.argv.includes('--resume') && fs.existsSync(evidenceFile) ? JSON.parse(fs.readFileSync(evidenceFile, 'utf8')).filter(r => ids.includes(r.video_id)) : [];
const queue = ids.filter(id => !results.find(r => r.video_id === id && r.duration_seconds > 0));

async function check(video_id) {
  const url = 'https://www.youtube.com/watch?v=' + video_id;
  const row = { video_id, url, checked_at: new Date().toISOString() };
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(25000) });
    row.http_status = response.status;
    if (!response.ok) throw new Error('HTTP ' + response.status);
    const player = extractPlayer(await response.text());
    if (player.videoDetails?.videoId !== video_id) throw new Error('Player video ID does not match requested video');
    row.title = player.videoDetails.title;
    row.author = player.videoDetails.author;
    row.duration_seconds = Number(player.videoDetails.lengthSeconds) || null;
    row.provider_status = player.playabilityStatus?.status;
    if (player.playabilityStatus?.reason) row.provider_reason = player.playabilityStatus.reason;
    row.source = 'YouTube ytInitialPlayerResponse.videoDetails.lengthSeconds';
    if (!row.duration_seconds) throw new Error('Duration missing in YouTube metadata');
  } catch (error) { row.error = error.message; }
  const index = results.findIndex(r => r.video_id === video_id);
  if (index < 0) results.push(row); else results[index] = row;
  fs.writeFileSync(evidenceFile, JSON.stringify(results, null, 2) + '\n');
  if (results.length % 10 === 0 || row.error) console.log(JSON.stringify({ completed: results.length, total: ids.length, video_id, seconds: row.duration_seconds, error: row.error }));
}

function writeReports() {
  const rows = refs.map(ref => {
    const meta = results.find(r => r.video_id === ref.video_id);
    return { ...ref, video_title: meta?.title || null, duration_seconds: meta?.duration_seconds || null,
      duration: clock(meta?.duration_seconds), over_20_minutes: meta?.duration_seconds ? meta.duration_seconds > 1200 : null,
      checked_at: meta?.checked_at, provider_status: meta?.provider_status, error: meta?.error || null };
  });
  const matches = rows.filter(r => r.over_20_minutes);
  const missing = rows.filter(r => r.over_20_minutes === null);
  const summaries = courses.map(c => {
    const all = rows.filter(r => r.track === c.key), long = all.filter(r => r.over_20_minutes);
    return { course_code: c.course_code, course: c.title, track: c.key, total_lessons: c.levels.length,
      youtube_lessons: new Set(all.map(r => r.lesson)).size, over_20_minute_lessons: new Set(long.map(r => r.lesson)).size,
      modules_with_long_videos: [...new Set(long.map(r => r.module))], unverified: all.filter(r => r.over_20_minutes === null).length };
  });
  const report = { generated_at: new Date().toISOString(), scope: 'Current local published free tracks after content-corrections; public YouTube full video durations strictly greater than 1,200 seconds.',
    unique_videos: ids.length, verified_unique_videos: results.filter(r => ids.includes(r.video_id) && r.duration_seconds > 0).length,
    unique_videos_over_20_minutes: new Set(matches.map(r => r.video_id)).size,
    lesson_video_references: rows.length, lesson_video_references_over_20_minutes: matches.length,
    summaries, matches, unverified: missing, all_lecture_videos: rows,
    lessons_without_youtube: lessons.filter(l => !l.urls.some(youtubeId)),
    unpublished_tracks: Object.values(tracks).filter(t => t.free && t.published === false).map(t => ({ key: t.key, title: t.title, youtube_references: t.levels.flatMap(l => [l.video_url, ...(l.videos || []).map(v => v.url || v.video_url)]).filter(youtubeId).length })) };
  fs.writeFileSync(path.join(out, 'audit.json'), JSON.stringify(report, null, 2) + '\n');
  const columns = ['course_code', 'course', 'module', 'lesson', 'lesson_title', 'duration', 'duration_seconds', 'url', 'video_title', 'checked_at', 'provider_status'];
  const csv = records => '\uFEFF' + [columns, ...records.map(r => columns.map(k => r[k] ?? ''))].map(row => row.map(v => '"' + String(v).replace(/"/g, '""') + '"').join(',')).join('\r\n') + '\r\n';
  fs.writeFileSync(path.join(out, 'videos-over-20-minutes.csv'), csv(matches));
  fs.writeFileSync(path.join(out, 'all-lecture-videos.csv'), csv(rows));
  const escape = value => String(value).replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
  const lines = ['# Free-course YouTube lectures longer than 20 minutes', '', `Checked: ${report.generated_at}`, '',
    `${report.verified_unique_videos}/${ids.length} unique videos verified directly against YouTube; ${rows.length} lesson/video references. ${matches.length} lesson/video references use ${report.unique_videos_over_20_minutes} videos longer than 20 minutes.`, '',
    'Durations below are the full YouTube video runtime, not the time for a selected chapter. Timestamped links retain their original start time. Module numbers follow the LMS grouping; lesson numbers are course-wide. Exactly 20:00 is excluded. Source: current local course definitions and live public YouTube player metadata.', '',
    '## Course summary', '', '| Course | Modules with videos over 20 minutes | Affected lessons |', '| --- | --- | ---: |',
    ...summaries.filter(s => s.youtube_lessons).map(s => `| ${escape(s.course)} | ${s.modules_with_long_videos.join(', ') || 'None'} | ${s.over_20_minute_lessons} |`), '',
    '## Matching lectures', '', '| Course | Module | Lesson | Lesson title | Full video duration | YouTube |', '| --- | ---: | ---: | --- | ---: | --- |',
    ...matches.map(r => `| ${escape(r.course)} | ${r.module} | ${r.lesson} | ${escape(r.lesson_title)} | ${r.duration} | [Watch](${r.url}) |`), '',
    '## Coverage notes', '', `- Unverified lecture/video references: ${missing.length}.`,
    '- Three additional free bootcamp tracks have no YouTube lecture links: ' + summaries.filter(s => !s.youtube_lessons).map(s => s.course).join('; ') + '.',
    `- ${report.unpublished_tracks.length} unpublished Trending Tech tracks have no YouTube lecture links and are outside the lecture-duration results.`,
    '- This audit script only reads course content and public YouTube metadata; it does not change course content or application settings.', '',
    '[Matching lectures CSV](videos-over-20-minutes.csv) | [All checked lecture links CSV](all-lecture-videos.csv) | [Detailed audit JSON](audit.json) | [YouTube metadata evidence](youtube-metadata.json)', ''];
  fs.writeFileSync(path.join(out, 'report.md'), lines.join('\n'));
  console.log(JSON.stringify({ unique_videos: ids.length, verified: report.verified_unique_videos, matching_lectures: matches.length, unique_long_videos: report.unique_videos_over_20_minutes, unverified: missing.length, summary: summaries.filter(s => s.youtube_lessons) }, null, 2));
}

(async () => {
  console.log(JSON.stringify({ published_free_tracks: courses.length, courses_with_youtube: new Set(refs.map(r => r.track)).size, lesson_references: refs.length, unique_videos: ids.length, to_check: queue.length }));
  await Promise.all(Array.from({ length: 4 }, async () => { while (queue.length) await check(queue.shift()); }));
  writeReports();
})().catch(error => { console.error(error.message); process.exitCode = 1; });
