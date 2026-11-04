'use strict';
/** Every question bank, keyed by id. hybrid-core adds practical, scenario and reviewed items to the original four. */
const core = require('./hybrid-core');

const BANKS = {
  common: { title: 'Common Computer Science Assessment', questions: [...require('./common'), ...core.common] },
  frontend: { title: 'Frontend skills', questions: [...require('./frontend'), ...core.frontend] },
  backend: { title: 'Backend skills', questions: [...require('./backend'), ...core.backend] },
  aiml: { title: 'AI & Machine Learning skills', questions: [...require('./aiml'), ...core.aiml] },
  mobile: { title: 'Mobile development skills', questions: require('./mobile') },
  genai: { title: 'Generative AI & LLM skills', questions: require('./genai') },
  analyst: { title: 'Data analysis & BI skills', questions: require('./analyst') },
  dataeng: { title: 'Data engineering skills', questions: require('./dataeng') },
  cyber: { title: 'Cybersecurity skills', questions: require('./cyber') },
  devops: { title: 'Cloud & DevOps skills', questions: require('./devops') },
  qa: { title: 'QA & test automation skills', questions: require('./qa') },
  se: { title: 'Software engineering & DSA skills', questions: require('./se') },
};

module.exports = { BANKS };
