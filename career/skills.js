'use strict';
/**
 * Career skill registry - one list of measurable skills shared by every
 * career track, so a skill demonstrated for one track (say HTML for Frontend)
 * is still recognised when the student switches to another (Full-Stack).
 *
 * `resources` point at REAL EchoLens content only: a free course track key
 * plus a module (level) number from that track. service.js re-checks every
 * reference against the live catalogue at request time; anything that no
 * longer resolves is reported to admins as a content gap and is never shown
 * to students as a link. An empty list means EchoLens has no module for the
 * skill yet - also a content gap, stated plainly rather than papered over.
 */

const r = (track, level) => ({ track, level });

const SKILLS = [
  // ---- Common CS assessment categories ----
  { id: 'cs.programming', name: 'Programming fundamentals', group: 'Common CS', resources: [r('cs104-python', 2), r('cs104-python', 5), r('cs104-python', 6), r('cs104-python', 10)] },
  { id: 'cs.logic', name: 'Logical problem solving', group: 'Common CS', resources: [r('fc01-c-basics', 9), r('fc01-c-basics', 10), r('tt-dsa-interviews', 1)] },
  { id: 'cs.computing', name: 'Computing fundamentals', group: 'Common CS', resources: [r('fc01-c-basics', 1), r('fc01-c-basics', 4)] },
  { id: 'cs.dsa_basics', name: 'Data structures basics', group: 'Common CS', resources: [r('cs104-python', 7), r('cs104-python', 9), r('tt-dsa-interviews', 1)] },
  { id: 'cs.git_tools', name: 'Git and development tools', group: 'Common CS', resources: [r('web-advanced', 15)] },
  { id: 'cs.debugging', name: 'Debugging', group: 'Common CS', resources: [r('cs104-python', 15)] },

  // ---- Frontend ----
  { id: 'fe.html', name: 'HTML and semantic markup', group: 'Frontend', resources: [r('cs106-html-css', 1), r('cs106-html-css', 4), r('cs106-html-css', 6)] },
  { id: 'fe.css', name: 'CSS and responsive design', group: 'Frontend', resources: [r('cs106-html-css', 9), r('cs106-html-css', 11), r('cs106-html-css', 12), r('cs106-html-css', 13), r('web-advanced', 6)] },
  { id: 'fe.js', name: 'JavaScript fundamentals', group: 'Frontend', resources: [r('cs105-javascript', 2), r('cs105-javascript', 4), r('cs105-javascript', 7), r('cs105-javascript', 10), r('cs105-javascript', 11)] },
  { id: 'fe.dom', name: 'DOM manipulation', group: 'Frontend', resources: [r('js-advanced', 13)] },
  { id: 'fe.typescript', name: 'TypeScript basics', group: 'Frontend', resources: [r('tt-nextjs-typescript', 1)] },
  { id: 'fe.react', name: 'React fundamentals', group: 'Frontend', resources: [r('tt-nextjs-typescript', 1), r('tt-nextjs-typescript', 2), r('tt-nextjs-typescript', 3)] },
  { id: 'fe.api', name: 'API integration (frontend)', group: 'Frontend', resources: [r('cs105-javascript', 14), r('cs105-javascript', 15), r('js-advanced', 11)] },
  { id: 'fe.debug_a11y', name: 'Frontend debugging and accessibility', group: 'Frontend', resources: [r('web-advanced', 13)] },

  // ---- Backend ----
  { id: 'be.programming', name: 'Server-side programming', group: 'Backend', resources: [r('cs104-python', 10), r('cs104-python', 13), r('tt-go-backend', 2)] },
  { id: 'be.http', name: 'HTTP and REST APIs', group: 'Backend', resources: [r('tt-go-backend', 7), r('tt-nextjs-typescript', 9)] },
  { id: 'be.sql', name: 'SQL and database design', group: 'Backend', resources: [r('tt-postgresql-internals', 1), r('tt-postgresql-internals', 5), r('tt-nextjs-typescript', 7)] },
  { id: 'be.auth', name: 'Authentication and authorization', group: 'Backend', resources: [r('tt-nextjs-typescript', 10), r('tt-nextjs-typescript', 11)] },
  { id: 'be.architecture', name: 'Server-side architecture', group: 'Backend', resources: [r('tt-go-backend', 6), r('tt-go-backend', 11)] },
  { id: 'be.errors', name: 'Error handling', group: 'Backend', resources: [r('tt-go-backend', 3), r('cs104-python', 15)] },
  { id: 'be.testing', name: 'Backend testing', group: 'Backend', resources: [r('tt-nextjs-typescript', 9), r('tt-nextjs-typescript', 12)] },
  { id: 'be.security', name: 'Security fundamentals', group: 'Backend', resources: [] },

  // ---- Full-stack extras ----
  { id: 'fs.deployment', name: 'Deployment', group: 'Full-Stack', resources: [r('tt-nextjs-typescript', 12), r('web-advanced', 15)] },

  // ---- Mobile ----
  { id: 'mob.ui', name: 'Mobile UI', group: 'Mobile', resources: [] },
  { id: 'mob.framework', name: 'Flutter/Dart or Kotlin', group: 'Mobile', resources: [] },
  { id: 'mob.state', name: 'Mobile state management', group: 'Mobile', resources: [] },
  { id: 'mob.storage', name: 'Local storage on device', group: 'Mobile', resources: [] },
  { id: 'mob.lifecycle', name: 'Application lifecycle', group: 'Mobile', resources: [] },
  { id: 'mob.testing', name: 'Mobile testing', group: 'Mobile', resources: [] },

  // ---- AI / ML ----
  { id: 'ml.python', name: 'Python for AI', group: 'AI & ML', resources: [r('cs104-python', 7), r('cs104-python', 9), r('cs104-python', 10), r('python-advanced', 2)] },
  { id: 'ml.math_stats', name: 'Mathematics and statistics', group: 'AI & ML', resources: [] },
  { id: 'ml.numpy_pandas', name: 'NumPy and Pandas', group: 'AI & ML', resources: [] },
  { id: 'ml.preprocessing', name: 'Data preprocessing', group: 'AI & ML', resources: [] },
  { id: 'ml.algorithms', name: 'Machine learning algorithms', group: 'AI & ML', resources: [] },
  { id: 'ml.evaluation', name: 'Model evaluation', group: 'AI & ML', resources: [] },
  { id: 'ml.deep_learning', name: 'Deep learning fundamentals', group: 'AI & ML', resources: [] },
  { id: 'ml.deployment', name: 'Model deployment', group: 'AI & ML', resources: [r('tt-rag-agents', 12)] },

  // ---- Generative AI ----
  { id: 'gen.llm', name: 'LLM fundamentals', group: 'Generative AI', resources: [r('tt-rag-agents', 4)] },
  { id: 'gen.prompting', name: 'Prompt design', group: 'Generative AI', resources: [r('tt-rag-agents', 4)] },
  { id: 'gen.embeddings', name: 'Embeddings', group: 'Generative AI', resources: [r('tt-rag-agents', 1)] },
  { id: 'gen.vectordb', name: 'Vector databases', group: 'Generative AI', resources: [r('tt-rag-agents', 3)] },
  { id: 'gen.rag', name: 'Retrieval-augmented generation', group: 'Generative AI', resources: [r('tt-rag-agents', 2), r('tt-rag-agents', 5), r('tt-rag-agents', 6)] },
  { id: 'gen.agents', name: 'Agents and tool calling', group: 'Generative AI', resources: [r('tt-rag-agents', 7), r('tt-rag-agents', 8), r('tt-rag-agents', 9)] },
  { id: 'gen.eval_security', name: 'LLM evaluation and security', group: 'Generative AI', resources: [r('tt-rag-agents', 10), r('tt-rag-agents', 11)] },

  // ---- Data analyst ----
  { id: 'da.spreadsheets', name: 'Spreadsheets', group: 'Data', resources: [] },
  { id: 'da.sql', name: 'SQL for analysis', group: 'Data', resources: [r('tt-postgresql-internals', 1), r('tt-postgresql-internals', 2), r('tt-postgresql-internals', 3)] },
  { id: 'da.cleaning', name: 'Data cleaning', group: 'Data', resources: [] },
  { id: 'da.stats', name: 'Descriptive statistics', group: 'Data', resources: [] },
  { id: 'da.visualization', name: 'Data visualization and dashboards', group: 'Data', resources: [] },
  { id: 'da.business', name: 'Business analysis', group: 'Data', resources: [] },

  // ---- Data engineer ----
  { id: 'de.advanced_sql', name: 'Advanced SQL', group: 'Data', resources: [r('tt-postgresql-internals', 2), r('tt-postgresql-internals', 3), r('tt-postgresql-internals', 7)] },
  { id: 'de.modeling', name: 'Data modeling', group: 'Data', resources: [r('tt-postgresql-internals', 9), r('tt-nextjs-typescript', 7)] },
  { id: 'de.etl', name: 'ETL/ELT and data pipelines', group: 'Data', resources: [] },
  { id: 'de.orchestration', name: 'Orchestration', group: 'Data', resources: [] },
  { id: 'de.quality', name: 'Data quality', group: 'Data', resources: [] },
  { id: 'de.cloud_data', name: 'Cloud data services', group: 'Data', resources: [] },

  // ---- Cybersecurity ----
  { id: 'sec.networking', name: 'Networking', group: 'Security', resources: [r('tt-cloud-devops', 2)] },
  { id: 'sec.linux', name: 'Linux', group: 'Security', resources: [] },
  { id: 'sec.principles', name: 'Security principles', group: 'Security', resources: [] },
  { id: 'sec.auth', name: 'Authentication security', group: 'Security', resources: [r('tt-nextjs-typescript', 10)] },
  { id: 'sec.logs', name: 'Log analysis', group: 'Security', resources: [] },
  { id: 'sec.vulns', name: 'Vulnerability management', group: 'Security', resources: [r('tt-cloud-devops', 8)] },
  { id: 'sec.incident', name: 'Incident response and security operations', group: 'Security', resources: [] },

  // ---- Cloud / DevOps ----
  { id: 'ops.linux', name: 'Linux for operations', group: 'DevOps', resources: [] },
  { id: 'ops.networking', name: 'Networking for operations', group: 'DevOps', resources: [r('tt-cloud-devops', 2), r('tt-cloud-devops', 5)] },
  { id: 'ops.docker', name: 'Docker and containers', group: 'DevOps', resources: [r('tt-cloud-devops', 1), r('tt-cloud-devops', 3)] },
  { id: 'ops.cicd', name: 'CI/CD', group: 'DevOps', resources: [r('tt-cloud-devops', 7), r('tt-cloud-devops', 8)] },
  { id: 'ops.cloud', name: 'Cloud services', group: 'DevOps', resources: [r('tt-cloud-devops', 10)] },
  { id: 'ops.iac', name: 'Infrastructure as code', group: 'DevOps', resources: [r('tt-cloud-devops', 10)] },
  { id: 'ops.monitoring', name: 'Monitoring and observability', group: 'DevOps', resources: [r('tt-cloud-devops', 11), r('tt-cloud-devops', 12)] },
  { id: 'ops.kubernetes', name: 'Kubernetes fundamentals', group: 'DevOps', resources: [r('tt-cloud-devops', 4), r('tt-cloud-devops', 5), r('tt-cloud-devops', 6)] },

  // ---- QA ----
  { id: 'qa.principles', name: 'Software testing principles', group: 'QA', resources: [] },
  { id: 'qa.test_design', name: 'Test case design', group: 'QA', resources: [] },
  { id: 'qa.bug_reports', name: 'Bug reporting', group: 'QA', resources: [] },
  { id: 'qa.api_testing', name: 'API testing', group: 'QA', resources: [r('tt-nextjs-typescript', 9)] },
  { id: 'qa.automation', name: 'Test automation (Selenium/Playwright)', group: 'QA', resources: [r('tt-nextjs-typescript', 12)] },
  { id: 'qa.regression_ci', name: 'Regression testing and CI', group: 'QA', resources: [r('tt-cloud-devops', 7)] },

  // ---- Software engineering & DSA ----
  { id: 'se.oop', name: 'Object-oriented programming', group: 'Software Engineering', resources: [r('cs104-python', 13), r('cs104-python', 14), r('fc02-cpp-objects', 10), r('cpp-advanced', 1)] },
  { id: 'se.arrays_strings', name: 'Arrays and strings', group: 'Software Engineering', resources: [r('tt-dsa-interviews', 1), r('tt-dsa-interviews', 2)] },
  { id: 'se.linked_lists', name: 'Linked lists', group: 'Software Engineering', resources: [r('c-advanced', 8), r('tt-dsa-interviews', 4)] },
  { id: 'se.stacks_queues', name: 'Stacks and queues', group: 'Software Engineering', resources: [r('tt-dsa-interviews', 5), r('tt-dsa-interviews', 6)] },
  { id: 'se.trees_graphs', name: 'Trees and graphs', group: 'Software Engineering', resources: [r('tt-dsa-interviews', 7), r('tt-dsa-interviews', 8), r('tt-dsa-interviews', 9)] },
  { id: 'se.algorithms', name: 'Algorithms', group: 'Software Engineering', resources: [r('tt-dsa-interviews', 3), r('tt-dsa-interviews', 10), r('tt-dsa-interviews', 11), r('tt-dsa-interviews', 12)] },
  { id: 'se.complexity', name: 'Complexity analysis', group: 'Software Engineering', resources: [r('tt-dsa-interviews', 1)] },
  { id: 'se.design', name: 'Software design', group: 'Software Engineering', resources: [r('cpp-advanced', 3), r('python-advanced', 9)] },
];

// Skill definitions are versioned. Bump a skill's version when its meaning or
// required proficiency changes; evidence recorded under an older version is then
// not reused (roadmaps.reusable).
for (const s of SKILLS) if (s.version == null) s.version = 1;
const byId = new Map(SKILLS.map((s) => [s.id, s]));
const skill = (id) => byId.get(id) || null;

module.exports = { SKILLS, skill };
