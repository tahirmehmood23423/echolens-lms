'use strict';

const tracks = require('../tracks/trending-tech');

async function main() {
  const result = tracks.validateTrendingTechCatalogue(tracks);
  const expected = { courses: 6, modules: 24, lectures: 72, quizzes: 72, questions: 360, coding_tasks: 31, optional_projects: 41, capstones: 6 };
  const structureErrors = Object.entries(expected).filter(([key, value]) => result.counts[key] !== value).map(([key, value]) => `Expected ${value} ${key}; found ${result.counts[key]}.`);
  const contentErrors = [];
  for (const track of tracks) {
    if (!track.title || !track.prerequisites || !track.environment || !track.outcome) contentErrors.push(`${track.course_code} is missing course metadata.`);
    for (const level of track.levels) {
      const problem = level.problems[0];
      if (!level.module_no || !level.lecture_no || !level.video_title || !level.video_runtime || !level.video_outline || !level.analogy || !level.covered) contentErrors.push(`${track.course_code} lesson ${level.no} is incomplete.`);
      if (problem?.grading_mode !== 'quiz' || problem.required !== true || problem.quiz?.questions?.length !== 5 || !problem.description) contentErrors.push(`${track.course_code} quiz ${level.no} is incomplete.`);
    }
  }
  // Local validation is deterministic. The explicit release command also
  // verifies remote video availability rather than conflating the two checks.
  const releaseCheck = process.argv.includes('--release');
  const errors = [...structureErrors, ...contentErrors, ...result.errors];
  if (!errors.length && releaseCheck) {
    const embedCheck = await tracks.validateYouTubeEmbeddability(tracks);
    errors.push(...embedCheck.errors);
  }
  if (errors.length) {
    console.error(errors.join('\n'));
    process.exitCode = 1;
  } else {
    console.log(`Trending Tech catalogue structure is valid: ${result.counts.courses} courses, ${result.counts.modules} modules, ${result.counts.lectures} lectures, ${result.counts.quizzes} quizzes, ${result.counts.coding_tasks} coding tasks, ${result.counts.optional_projects} optional projects and ${result.counts.capstones} capstones.`);
    console.log(releaseCheck ? 'All lecture videos are direct, unique and embeddable.' : 'Run validate:catalogue:release to verify remote video embeddability before publishing.');
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
