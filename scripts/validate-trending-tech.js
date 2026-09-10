'use strict';

const tracks = require('../tracks/trending-tech');

async function main() {
  const result = tracks.validateTrendingTechCatalogue(tracks);
  const expected = { courses: 6, modules: 24, lectures: 72, assignments: 72, capstones: 6 };
  const structureErrors = Object.entries(expected).filter(([key, value]) => result.counts[key] !== value).map(([key, value]) => `Expected ${value} ${key}; found ${result.counts[key]}.`);
  const contentErrors = [];
  for (const track of tracks) {
    if (!track.title || !track.prerequisites || !track.environment || !track.outcome) contentErrors.push(`${track.course_code} is missing course metadata.`);
    for (const level of track.levels) {
      const problem = level.problems[0];
      if (!level.module_no || !level.lecture_no || !level.video_title || !level.video_runtime || !level.video_outline || !level.analogy || !level.covered) contentErrors.push(`${track.course_code} lesson ${level.no} is incomplete.`);
      if (!problem?.description || !problem.deliverable || !problem.criteria?.length || !problem.submission_text || problem.points !== 10) contentErrors.push(`${track.course_code} assignment ${level.no} is incomplete.`);
    }
  }
  const releaseCheck = process.argv.includes('--release') || tracks.some((track) => track.published);
  const errors = [...structureErrors, ...contentErrors, ...(releaseCheck ? result.errors : [])];
  if (!errors.length && releaseCheck) {
    const embedCheck = await tracks.validateYouTubeEmbeddability(tracks);
    errors.push(...embedCheck.errors);
  }
  if (errors.length) {
    console.error(errors.join('\n'));
    process.exitCode = 1;
  } else {
    console.log(`Trending Tech catalogue structure is valid: ${result.counts.courses} courses, ${result.counts.modules} modules, ${result.counts.lectures} lectures, ${result.counts.assignments} assignments and ${result.counts.capstones} capstones.`);
    console.log(releaseCheck ? 'All lecture videos are direct, unique and embeddable.' : `${result.counts.videos_ready}/72 lecture videos ready; courses remain staged.`);
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
