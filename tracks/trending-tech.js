'use strict';

/**
 * EchoLens Top Trending Tech Track — Revision 3.
 *
 * The catalogue source specifies 72 in-house videos but intentionally leaves
 * their watch URLs blank until production. These tracks therefore stay
 * unpublished. Replace each `video_url: null` in the JSON catalogue with the
 * matching EchoLens watch URL, run validateTrendingTechCatalogue(), and only
 * then change the track and catalogue entries to `published: true`.
 */
const catalogue = require('./trending-tech-catalogue.json');

const META = [
  { code: 'TT-01', key: 'tt-nextjs-typescript', language: 'web' },
  { code: 'TT-02', key: 'tt-rag-agents', language: 'python' },
  { code: 'TT-03', key: 'tt-dsa-interviews', language: 'python', hours: 56 },
  { code: 'TT-04', key: 'tt-cloud-devops', language: null },
  { code: 'TT-05', key: 'tt-go-backend', language: 'go' },
  { code: 'TT-06', key: 'tt-postgresql-internals', language: 'sql' },
];

const FILE_ACCEPT = [
  '.pdf', '.doc', '.docx', '.ppt', '.pptx', '.txt', '.md', '.ipynb',
  '.png', '.jpg', '.jpeg', '.zip', '.mp4', '.webm', '.mov', '.csv',
  '.json', '.yaml', '.yml', '.toml', '.sql', '.py', '.go', '.js', '.ts',
  '.tsx', '.proto', '.tf',
];

function unique(values) { return [...new Set(values.filter(Boolean))]; }

function evidenceSubmission(instructions) {
  const text = String(instructions || '').trim();
  const linkLabels = [];
  if (/repository/i.test(text)) linkLabels.push('Repository URL');
  if (/deployment url|live https url/i.test(text)) linkLabels.push('Deployment URL');
  if (/endpoint url/i.test(text)) linkLabels.push('Endpoint URL');
  if (/actions run link|links to one failing and one passing run/i.test(text)) linkLabels.push('CI run URL');
  if (/recording/i.test(text)) linkLabels.push('Recording URL (or upload the recording)');
  let minLinks = /repository link/i.test(text) ? 1 : 0;
  if (/deployment url/i.test(text)) minLinks += 1;
  if (/actions run link/i.test(text)) minLinks += 1;
  if (/links to one failing and one passing run/i.test(text)) minLinks = Math.max(minLinks, 2);
  // "Endpoint URL or container image" deliberately remains an either/or.
  if (/endpoint url or container image/i.test(text)) minLinks = 0;
  return {
    mode: 'evidence',
    instructions: text,
    requirements: text ? [text] : [],
    link_labels: unique(linkLabels),
    links: { min: minLinks, max: 8, https_only: true },
    files: {
      min: /screenshot|exported as png/i.test(text) ? 1 : 0,
      max: 8,
      accept: FILE_ACCEPT,
      max_each_mb: 50,
    },
    notes: { required: false, max_length: 4000 },
    require_any: true,
  };
}

function capstoneFor(course) {
  return {
    key: 'capstone',
    title: `${course.title} Capstone`,
    description: course.capstone,
    deliverables: [course.capstone],
    criteria: [],
    weight: 40,
    points: 40,
    pass_mark: 60,
    grading_mode: 'staff',
    submission: {
      mode: 'evidence',
      instructions: 'Provide the capstone repository or project URL and attach supporting evidence for the catalogue deliverables.',
      requirements: ['Provide the capstone repository or project URL and supporting evidence for the catalogue deliverables.'],
      link_labels: ['Repository or project URL'],
      links: { min: 1, max: 8, https_only: true },
      files: { min: 0, max: 8, accept: FILE_ACCEPT, max_each_mb: 50 },
      notes: { required: false, max_length: 4000 },
      require_any: true,
    },
  };
}

const tracks = catalogue.map((course, courseIndex) => {
  const meta = META[courseIndex];
  const warningAt = course.assessment.indexOf('Cost warning.');
  const warnings = warningAt >= 0 ? [course.assessment.slice(warningAt).trim()] : [];
  const assessment = warningAt >= 0 ? course.assessment.slice(0, warningAt).trim() : course.assessment;
  let levelNo = 0;
  const modules = course.modules.map((module) => ({
    no: module.no,
    title: module.title,
    resources: module.resources.map((resource) => ({ ...resource, optional: true })),
  }));
  const levels = course.modules.flatMap((module) => module.lessons.map((lesson, lessonIndex) => {
    levelNo += 1;
    // Each three-lecture module spans two of the catalogue's eight weeks.
    const week = (module.no - 1) * 2 + (lessonIndex === 0 ? 1 : 2);
    const assignment = lesson.assignment;
    return {
      no: levelNo,
      week,
      session: lessonIndex + 1,
      module_no: module.no,
      module_title: module.title,
      lecture_no: lesson.number,
      title: lesson.title,
      video_title: lesson.video_title,
      video_runtime: lesson.target_runtime,
      video_outline: lesson.video_outline,
      video_url: lesson.video_url,
      analogy: lesson.analogy,
      covered: lesson.covered,
      topic: `Analogy: ${lesson.analogy}\n\nCovered: ${lesson.covered}`,
      problems: [{
        pid: 1,
        code: assignment.code,
        title: assignment.code,
        duration: assignment.duration,
        points: 10,
        difficulty: 'Core',
        description: assignment.brief,
        deliverable: assignment.deliverable,
        criteria: [assignment.criteria],
        submission_text: assignment.submission_text,
        submission: evidenceSubmission(assignment.submission_text),
        grading_mode: 'staff',
        required: true,
        pass_mark: 60,
      }],
    };
  }));
  return {
    key: meta.key,
    course_code: meta.code,
    title: course.title,
    description: course.outcome,
    outcome: course.outcome,
    format: course.format,
    time_commitment: course.time_commitment,
    prerequisites: course.prerequisites,
    environment: course.environment,
    assessment,
    warnings,
    duration_weeks: 8,
    hours: meta.hours || 40,
    free: true,
    published: false,
    staged_catalogue: true,
    inline_video_only: true,
    friendly_grading: true,
    grading_mode: 'staff',
    submission: 'evidence',
    default_language: meta.language,
    pass_mark: 60,
    assignment_weight: 60,
    capstone_weight: 40,
    key_concepts: modules.map((module) => module.title),
    modules,
    levels,
    capstone: capstoneFor(course),
  };
});

function youtubeVideoId(url) {
  const match = String(url || '').match(/(?:youtube\.com\/watch\?(?:.*&)?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]{11})(?:[?&#/]|$)/i);
  return match ? match[1] : null;
}

function validateTrendingTechCatalogue(items = tracks) {
  const errors = [];
  const ids = new Map();
  if (items.length !== 6) errors.push(`Expected 6 courses; found ${items.length}.`);
  for (const track of items) {
    if (track.modules.length !== 4) errors.push(`${track.course_code}: expected 4 modules.`);
    if (track.levels.length !== 12) errors.push(`${track.course_code}: expected 12 lectures.`);
    const problems = track.levels.flatMap((level) => level.problems || []);
    if (problems.length !== 12) errors.push(`${track.course_code}: expected 12 assignments.`);
    if (!track.capstone) errors.push(`${track.course_code}: capstone is missing.`);
    for (const level of track.levels) {
      const prefix = `${track.course_code} lecture ${level.lecture_no || level.no}`;
      const id = youtubeVideoId(level.video_url);
      if (!id) errors.push(`${prefix}: provide a direct YouTube watch, share, or embed URL.`);
      else if (ids.has(id)) errors.push(`${prefix}: video duplicates ${ids.get(id)}.`);
      else ids.set(id, prefix);
      if ((level.problems || []).length !== 1 || level.problems[0].points !== 10) errors.push(`${prefix}: expected one 10-mark assignment.`);
    }
  }
  return {
    valid: errors.length === 0,
    errors,
    counts: {
      courses: items.length,
      modules: items.reduce((sum, track) => sum + track.modules.length, 0),
      lectures: items.reduce((sum, track) => sum + track.levels.length, 0),
      assignments: items.reduce((sum, track) => sum + track.levels.flatMap((level) => level.problems || []).length, 0),
      capstones: items.filter((track) => track.capstone).length,
      videos_ready: items.reduce((sum, track) => sum + track.levels.filter((level) => youtubeVideoId(level.video_url)).length, 0),
    },
  };
}

async function validateYouTubeEmbeddability(items = tracks, fetchImpl = globalThis.fetch) {
  if (typeof fetchImpl !== 'function') return { valid: false, errors: ['A fetch implementation is required to verify YouTube embeddability.'] };
  const videos = items.flatMap((track) => track.levels.map((level) => ({
    label: `${track.course_code} lecture ${level.lecture_no || level.no}`,
    id: youtubeVideoId(level.video_url),
  }))).filter((video) => video.id);
  const errors = [];
  // Keep concurrency low so the release check does not flood YouTube.
  for (let start = 0; start < videos.length; start += 8) {
    await Promise.all(videos.slice(start, start + 8).map(async (video) => {
      const watchUrl = `https://www.youtube.com/watch?v=${video.id}`;
      try {
        const [metadata, watch] = await Promise.all([
          fetchImpl(`https://www.youtube.com/oembed?url=${encodeURIComponent(watchUrl)}&format=json`, { redirect: 'follow' }),
          fetchImpl(watchUrl, { redirect: 'follow', headers: { 'user-agent': 'EchoLens catalogue release validator' } }),
        ]);
        if (!metadata.ok || !watch.ok) throw new Error(`YouTube returned ${metadata.ok ? watch.status : metadata.status}`);
        const page = await watch.text();
        if (/"playableInEmbed"\s*:\s*false/i.test(page)) errors.push(`${video.label}: YouTube reports that this video cannot be embedded.`);
      } catch (error) {
        errors.push(`${video.label}: could not verify the video (${error.message}).`);
      }
    }));
  }
  return { valid: errors.length === 0, errors };
}

module.exports = tracks;
module.exports.validateTrendingTechCatalogue = validateTrendingTechCatalogue;
module.exports.validateYouTubeEmbeddability = validateYouTubeEmbeddability;
module.exports.youtubeVideoId = youtubeVideoId;
module.exports.evidenceSubmission = evidenceSubmission;
