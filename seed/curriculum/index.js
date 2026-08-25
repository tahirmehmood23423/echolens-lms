'use strict';

/**
 * EchoLens Curriculum seed runner - loads the 5 programmes / 15 courses /
 * 60 modules transcribed from EchoLens_Course_and_Module_Handbook.pdf and
 * writes them through curriculum-store.js's idempotent seedCurriculum().
 *
 * Run: node seed/curriculum/index.js
 * (also wired as `npm run seed:curriculum`, see package.json)
 */
const curriculumStore = require('../../curriculum-store');

const CATALOGUE = [
  require('./programme-1-c'),
  require('./programme-2-cpp'),
  require('./programme-3-python'),
  require('./programme-4-js'),
  require('./programme-5-web'),
];

async function run() {
  const result = await curriculumStore.seedCurriculum(CATALOGUE);
  console.log('[curriculum seed] programmes=%d courses=%d modules=%d sections=%d',
    result.programmes, result.courses, result.modules, result.sections);
  if (result.programmes !== 5) console.warn('[curriculum seed] WARNING: expected 5 programmes.');
  if (result.courses !== 15) console.warn('[curriculum seed] WARNING: expected 15 courses.');
  if (result.modules !== 60) console.warn('[curriculum seed] WARNING: expected 60 modules.');
  if (result.sections !== 360) console.warn('[curriculum seed] WARNING: expected 360 sections (60 modules x 6).');
}

module.exports = { CATALOGUE, run };

if (require.main === module) {
  run().then(() => process.exit(0)).catch((err) => { console.error('[curriculum seed] failed:', err); process.exit(1); });
}
