'use strict';

/**
 * EchoLens Top Trending Tech Track — Revision 3.
 *
 * All tracks have curated YouTube lectures and are published as free courses.
 * `staged_catalogue` only keeps them listed on the admin video review page.
 */
const catalogue = require('./trending-tech-catalogue.json');
const assessments = require('./trending-tech-assessments');

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
    // The capstone sentence lists its deliverables in prose; `capstone_criteria`
    // is that same list split into separately checkable items. It is what the
    // learner is shown as "What we're looking for" and what a grader marks
    // against - an empty array here left both with nothing to go on.
    criteria: (Array.isArray(course.capstone_criteria) ? course.capstone_criteria : []).filter(Boolean),
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

// Every lecture is assessed by an auto-checked quiz. A coding task is added
// only where the browser compiler can genuinely do the work; otherwise the
// catalogue's original hands-on project (Docker, cloud, a real Next.js app...)
// stays available as optional practice that never blocks progress.
function lectureProblems(lesson, assignment) {
  const questions = assessments.quizzes[assignment.code] || [];
  const quiz = {
    pid: 1,
    code: `Q${assignment.code.slice(1)}`,
    title: `Lecture ${lesson.number} quiz`,
    points: 10,
    difficulty: 'Core',
    description: `${questions.length} multiple-choice questions on "${lesson.title}". Answers are checked instantly - score ${60}% or more to pass. You can retake it; your best score counts.`,
    criteria: [`Score at least 60% (${Math.ceil(questions.length * 0.6)} of ${questions.length} correct).`],
    submission: { mode: 'quiz' },
    quiz: { questions },
    grading_mode: 'quiz',
    required: true,
    pass_mark: 60,
  };
  const task = assessments.tasks[assignment.code];
  if (task) {
    return [quiz, {
      pid: 2,
      code: assignment.code,
      title: task.title,
      duration: assignment.duration,
      points: 10,
      difficulty: 'Core',
      description: task.description,
      criteria: task.criteria,
      hint: task.hint || null,
      language: task.language,
      submission: { mode: 'code' },
      grading_mode: 'staff',
      required: true,
      pass_mark: 60,
    }];
  }
  return [quiz, {
    pid: 2,
    code: assignment.code,
    title: `Optional project: ${assignment.code}`,
    duration: assignment.duration,
    points: 10,
    difficulty: 'Core',
    description: `${assignment.brief}\n\nThis project needs tools outside the browser (your own machine or a cloud account), so it is optional practice and does not affect your progress or certificate.`,
    deliverable: assignment.deliverable,
    criteria: [assignment.criteria],
    submission_text: assignment.submission_text,
    submission: evidenceSubmission(assignment.submission_text),
    grading_mode: 'staff',
    required: false,
    optional: true,
    pass_mark: 60,
  }];
}

const tracks = catalogue.map((course, courseIndex) => {
  const meta = META[courseIndex];
  const warningAt = course.assessment.indexOf('Cost warning.');
  const warnings = warningAt >= 0 ? [course.assessment.slice(warningAt).trim()] : [];
  const codingTasks = course.modules.flatMap((module) => module.lessons).filter((lesson) => assessments.tasks[lesson.assignment.code]).length;
  const assessment = `Every lecture ends with a 5-question quiz that is checked instantly (pass mark 60%).${codingTasks ? ` ${codingTasks} lectures also have a coding task you solve in the EchoLens compiler, reviewed by staff.` : ''} Lecture assessments are worth 60 percent and the capstone 40 percent. Hands-on projects that need your own machine or a cloud account are optional practice.`;
  let levelNo = 0;
  const modules = course.modules.map((module) => ({ no: module.no, title: module.title }));
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
      videos: (lesson.videos || []).map(video => ({ ...video })),
      video_review: lesson.video_review || null,
      analogy: lesson.analogy,
      covered: lesson.covered,
      topic: `Analogy: ${lesson.analogy}\n\nCovered: ${lesson.covered}`,
      problems: lectureProblems(lesson, assignment),
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
    published: true,
    staged_catalogue: true,
    inline_video_only: true,
    friendly_grading: true,
    grading_mode: 'staff',
    submission: 'mixed',
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
    const quizzes = track.levels.flatMap((level) => (level.problems || []).filter((problem) => problem.grading_mode === 'quiz'));
    if (quizzes.length !== 12) errors.push(`${track.course_code}: expected 12 lecture quizzes.`);
    if (!track.capstone) errors.push(`${track.course_code}: capstone is missing.`);
    // A capstone carrying no criteria is 40% of the course with nothing stated
    // for the learner to aim at or a grader to mark against - see
    // scripts/audit-rubrics.js, which flags the same gap as an error.
    else if (!(track.capstone.criteria || []).length) errors.push(`${track.course_code}: capstone has no criteria - add capstone_criteria to the catalogue entry.`);
    for (const level of track.levels) {
      const prefix = `${track.course_code} lecture ${level.lecture_no || level.no}`;
      const id = youtubeVideoId(level.video_url);
      if (!id) errors.push(`${prefix}: provide a direct YouTube watch, share, or embed URL.`);
      else if (ids.has(id)) errors.push(`${prefix}: video duplicates ${ids.get(id)}.`);
      else ids.set(id, prefix);
      const quiz = (level.problems || []).find((problem) => problem.grading_mode === 'quiz');
      const questions = quiz?.quiz?.questions || [];
      if (!quiz || !quiz.required) errors.push(`${prefix}: expected one required quiz.`);
      else if (questions.length < 5) errors.push(`${prefix}: the quiz needs at least 5 questions.`);
      for (const q of questions) {
        if (!Array.isArray(q.options) || q.options.length < 2 || new Set(q.options).size !== q.options.length) errors.push(`${prefix} Q${q.id}: options must be distinct.`);
        if (!Number.isInteger(q.answer) || q.answer < 0 || q.answer >= (q.options || []).length) errors.push(`${prefix} Q${q.id}: answer index is out of range.`);
      }
    }
  }
  return {
    valid: errors.length === 0,
    errors,
    counts: {
      courses: items.length,
      modules: items.reduce((sum, track) => sum + track.modules.length, 0),
      lectures: items.reduce((sum, track) => sum + track.levels.length, 0),
      quizzes: items.reduce((sum, track) => sum + track.levels.flatMap((level) => (level.problems || []).filter((problem) => problem.grading_mode === 'quiz')).length, 0),
      questions: items.reduce((sum, track) => sum + track.levels.flatMap((level) => (level.problems || []).filter((problem) => problem.grading_mode === 'quiz').flatMap((problem) => problem.quiz.questions)).length, 0),
      coding_tasks: items.reduce((sum, track) => sum + track.levels.flatMap((level) => (level.problems || []).filter((problem) => problem.submission?.mode === 'code')).length, 0),
      optional_projects: items.reduce((sum, track) => sum + track.levels.flatMap((level) => (level.problems || []).filter((problem) => problem.optional)).length, 0),
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
