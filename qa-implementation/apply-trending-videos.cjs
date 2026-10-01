'use strict';
// Apply manually researched selections; abort before writing if any video fails policy.
const fs = require('node:fs');
const path = require('node:path');
const file = path.join(__dirname, '../tracks/trending-tech-catalogue.json');
const catalogue = JSON.parse(fs.readFileSync(file, 'utf8'));
const selections = require('./trending-video-selections.json');
const coverage = require('./trending-video-coverage.json');
const clock = n => `${Math.floor(n / 60)}:${String(n % 60).padStart(2, '0')}`;
function video(id, optional = false) {
  const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'trending-video-research', id + '.json'), 'utf8'));
  if (data.id !== id || !(data.duration_seconds > 0 && data.duration_seconds < 1200)
    || data.status !== 'OK' || data.playable_in_embed !== true) throw Error(`Video fails duration/availability/embed policy: ${id}`);
  return { url: data.url, title: data.title, channel: data.channel, length: clock(data.duration_seconds),
    duration_seconds: data.duration_seconds, views: data.views,
    comments: data.comments && /\d/.test(data.comments) ? Number(data.comments.replace(/[^0-9]/g, '')) : null,
    checked_at: data.checked_at, playable_in_embed: true, optional };
}
let added = 0;
for (const course of catalogue) {
  if (course.no > 1) course.time_commitment = '12 lectures. Each lecture has one main video under 20 minutes and one graded assignment. Optional topic companions are also each under 20 minutes. ' + course.time_commitment.slice(course.time_commitment.indexOf('Budget'));
  for (const module of course.modules) for (const lesson of module.lessons) {
    const key = `${course.no}-${lesson.number}`;
    const ids = selections[key] || [new URL(lesson.video_url).searchParams.get('v')];
    if (!ids.length) throw Error('Missing selection: ' + key);
    const videos = ids.map((id, i) => video(id, i > 0));
    if (!lesson.video_url) added++;
    lesson.video_url = videos[0].url;
    lesson.video_title = `${videos[0].title} (${videos[0].channel})`;
    lesson.target_runtime = videos[0].length;
    lesson.videos = videos;
    if (coverage[key]) lesson.video_outline = coverage[key];
    lesson.video_review = {
      status: 'ready_for_admin_review',
      basis: 'YouTube title, description and available chapters checked against the topic; public views, comment counts and a sample of top comments reviewed. Full videos were not watched end to end.',
      selection: 'Topic relevance and runtime first, followed by engagement and comment feedback among the researched candidates; not a claim of the highest counts on all of YouTube.',
      coverage: lesson.video_outline,
    };
  }
}
fs.writeFileSync(file, JSON.stringify(catalogue, null, 2) + '\n');
console.log(JSON.stringify({ newly_filled_lessons: added, lessons: catalogue.flatMap(c => c.modules.flatMap(m => m.lessons)).length,
  video_links: catalogue.flatMap(c => c.modules.flatMap(m => m.lessons.flatMap(l => l.videos))).length }));
