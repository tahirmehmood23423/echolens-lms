'use strict';
/**
 * The 12 career tracks. Pure data: the pages, the assessment engine and the
 * roadmap generator all render from this list, so there are no per-track
 * pages to keep in step.
 *
 * Every track has six roadmap stages (STAGE_NAMES). A stage lists the skills
 * it builds; `critical` skills must be DEMONSTRATED (assessed, sufficient
 * evidence, at or above the stage's required score) before the roadmap lets a
 * student move past them. Stages 5 and 6 (capstone, career readiness) are
 * project and portfolio work rather than skill gates.
 *
 * `assessment.banks` names the question banks a track draws from (a skill is
 * assessed by whichever listed bank covers it). `category_weights` sets the
 * default theory / practical / scenario mix for the track's overall score;
 * admins can override it.
 * Admins can switch a track between draft and published (service.js); the
 * `status` here is only the default.
 */

const STAGE_NAMES = ['Foundation', 'Core Skills', 'Practical Development', 'Specialization', 'Capstone Project', 'Career Readiness'];

// skill entry: [skillId, weight, critical]
const S = (id, weight = 1, critical = false) => ({ skill: id, weight, critical });
const stage = (skills, projects, criteria) => ({ skills, projects, criteria });

const CAPSTONE = (what) => stage([], [what], 'Build and publish the capstone, with a README that explains the design, how to run it and what you would improve next.');
const READINESS = (extra) => stage([], ['Portfolio page linking your two strongest projects', extra],
  'A CV and LinkedIn profile that list your projects, a GitHub profile with tidy repositories, and two practice interviews for this role.');

const TRACKS = [
  {
    slug: 'frontend-web-developer', title: 'Frontend Web Developer', status: 'published',
    summary: 'Build fast, accessible, responsive interfaces with HTML, CSS, JavaScript, TypeScript and React.',
    overview: 'Frontend developers turn designs into working interfaces that people use every day. The role covers semantic HTML, responsive CSS, JavaScript and a modern framework, and it rewards care for accessibility and performance.',
    prerequisites: ['Comfortable using a computer and a browser', 'Basic programming logic (variables, conditions, loops)'],
    tools: ['HTML', 'CSS', 'JavaScript', 'TypeScript', 'React', 'Git', 'Browser DevTools'],
    outcomes: ['Build responsive, accessible pages from a design', 'Write clean JavaScript and TypeScript', 'Build React components with state and data fetching', 'Debug in the browser and ship to a host'],
    duration: '6-9 months part-time', suitability: ['Beginner', 'Intermediate'],
    practical: 'Fix a small frontend component or JavaScript interaction.',
    assessment: { banks: ['frontend'] },
    category_weights: { theory: 30, practical: 45, scenario: 25 },
    skills: [S('cs.programming', 1, true), S('fe.html', 2, true), S('fe.css', 2, true), S('fe.js', 3, true), S('fe.dom', 2), S('fe.typescript', 1), S('fe.react', 2), S('fe.api', 2), S('fe.debug_a11y', 1), S('cs.git_tools', 1)],
    stages: [
      stage(['cs.programming', 'fe.html', 'fe.css'], ['A personal profile page in semantic HTML and CSS'], 'Score Strong on HTML and CSS, and complete the matching EchoLens modules.'),
      stage(['fe.js', 'fe.dom', 'cs.git_tools'], ['An interactive to-do list with DOM events, kept in Git'], 'Score Strong on JavaScript fundamentals and DOM manipulation.'),
      stage(['fe.api', 'fe.debug_a11y'], ['A weather or news app that calls a public API and handles errors'], 'Fetch, display and error-handle real API data; pass an accessibility check.'),
      stage(['fe.typescript', 'fe.react'], ['A multi-page React and TypeScript app with routing and state'], 'Build typed React components with state and effects.'),
      CAPSTONE('A deployed React app that solves a real problem for a local business or student society'),
      READINESS('Two portfolio case studies explaining the decisions behind your UI'),
    ],
  },
  {
    slug: 'backend-developer', title: 'Backend Developer', status: 'published',
    summary: 'Design APIs, databases and server logic that are correct, secure and easy to maintain.',
    overview: 'Backend developers build the services behind every app: APIs, data models, authentication and the business rules that keep data correct. The role values careful reasoning about failures, security and performance.',
    prerequisites: ['Programming fundamentals in one language', 'Basic understanding of how the web works'],
    tools: ['Node.js or Python or Go', 'PostgreSQL', 'REST', 'Git', 'Postman', 'Docker'],
    outcomes: ['Design and build REST APIs', 'Model data and write correct SQL', 'Implement authentication and authorization safely', 'Test, log and handle errors in production code'],
    duration: '7-10 months part-time', suitability: ['Beginner', 'Intermediate'],
    practical: 'Debug a basic API endpoint or database query.',
    assessment: { banks: ['backend'] },
    category_weights: { theory: 30, practical: 45, scenario: 25 },
    skills: [S('be.programming', 2, true), S('be.http', 2, true), S('be.sql', 2, true), S('be.auth', 2), S('be.architecture', 1), S('be.errors', 1), S('be.testing', 1), S('be.security', 2), S('cs.git_tools', 1)],
    stages: [
      stage(['cs.programming', 'be.programming', 'cs.git_tools'], ['A command-line tool that reads and writes files, kept in Git'], 'Score Strong on programming fundamentals.'),
      stage(['be.http', 'be.sql'], ['A REST API for a library with a PostgreSQL database'], 'Score Strong on HTTP/REST and SQL.'),
      stage(['be.errors', 'be.testing', 'be.auth'], ['Add login, input validation and tests to your API'], 'Protected routes, validated input and automated tests that pass.'),
      stage(['be.architecture', 'be.security'], ['Add caching, background jobs and rate limiting'], 'Explain your architecture and pass a basic security review.'),
      CAPSTONE('A deployed multi-user API (for example a clinic booking or tuition-centre system) with docs and tests'),
      READINESS('A system-design write-up of your capstone'),
    ],
  },
  {
    slug: 'full-stack-web-developer', title: 'Full-Stack Web Developer', status: 'published',
    summary: 'Ship complete web applications: interface, API, database, authentication and deployment.',
    overview: 'Full-stack developers own a feature from the screen to the database. The role combines frontend and backend skills with the judgement to debug problems that cross the two.',
    prerequisites: ['Programming fundamentals', 'Basic HTML and CSS'],
    tools: ['React or Next.js', 'TypeScript', 'Node.js', 'PostgreSQL', 'Git', 'Vercel or Render'],
    outcomes: ['Build a full web app end to end', 'Connect a frontend to your own API and database', 'Add authentication and deploy', 'Diagnose bugs across the stack'],
    duration: '9-12 months part-time', suitability: ['Beginner', 'Intermediate'],
    practical: 'Diagnose an issue involving frontend, API and database behaviour.',
    assessment: { banks: ['frontend', 'backend'] },
    category_weights: { theory: 30, practical: 45, scenario: 25 },
    skills: [S('fe.html', 1, true), S('fe.css', 1, true), S('fe.js', 2, true), S('fe.react', 2), S('fe.api', 2), S('be.http', 2, true), S('be.sql', 2, true), S('be.auth', 1), S('cs.git_tools', 1), S('fs.deployment', 1)],
    stages: [
      stage(['cs.programming', 'fe.html', 'fe.css', 'fe.js'], ['A responsive landing page with interactive JavaScript'], 'Score Strong on HTML, CSS and JavaScript.'),
      stage(['be.http', 'be.sql', 'cs.git_tools'], ['A REST API with a PostgreSQL database'], 'Score Strong on HTTP/REST and SQL.'),
      stage(['fe.react', 'fe.api'], ['A React frontend for your own API'], 'A working frontend that reads and writes through your API.'),
      stage(['be.auth', 'fs.deployment'], ['Add authentication and deploy both halves'], 'A deployed app with sign-in and protected data.'),
      CAPSTONE('A deployed full-stack product (for example a marketplace for used textbooks) with auth, payments mock and tests'),
      READINESS('A walkthrough video of your capstone architecture'),
    ],
  },
  {
    slug: 'mobile-app-developer', title: 'Mobile App Developer', status: 'published',
    summary: 'Build Android and cross-platform apps with Flutter or Kotlin.',
    overview: 'Mobile developers build the apps people carry everywhere. The role covers mobile UI, state management, device storage, network calls and the app lifecycle.',
    prerequisites: ['Programming fundamentals', 'Basic object-oriented programming'],
    tools: ['Flutter and Dart or Kotlin', 'Android Studio', 'REST APIs', 'SQLite', 'Git'],
    outcomes: ['Build multi-screen mobile apps', 'Manage state and local storage', 'Call APIs and handle offline cases', 'Test and publish an app'],
    duration: '7-10 months part-time', suitability: ['Beginner', 'Intermediate'],
    practical: 'Fix a simple mobile interface or state-management issue.',
    assessment: { banks: ['mobile', 'frontend', 'se'] },
    category_weights: { theory: 30, practical: 45, scenario: 25 },
    skills: [S('cs.programming', 2, true), S('se.oop', 1, true), S('mob.ui', 2), S('mob.framework', 2, true), S('mob.state', 2), S('fe.api', 1), S('mob.storage', 1), S('mob.testing', 1), S('mob.lifecycle', 1)],
    stages: [
      stage(['cs.programming', 'se.oop'], ['A console app using classes and collections'], 'Score Strong on programming fundamentals and OOP.'),
      stage(['mob.framework', 'mob.ui'], ['A two-screen app with navigation'], 'Build and run a multi-screen app.'),
      stage(['mob.state', 'fe.api', 'mob.storage'], ['A notes app that syncs with an API and works offline'], 'State, API calls and local storage working together.'),
      stage(['mob.lifecycle', 'mob.testing'], ['Add tests and handle background/resume correctly'], 'Automated tests pass; app state survives the lifecycle.'),
      CAPSTONE('A published (or release-ready) app for a real use case, such as bus timings or a shop catalogue'),
      READINESS('A store listing with screenshots and a privacy note'),
    ],
  },
  {
    slug: 'ai-machine-learning-engineer', title: 'AI & Machine Learning Engineer', status: 'published',
    summary: 'Prepare data, train and evaluate models, and put machine learning into production.',
    overview: 'Machine learning engineers turn data into models that make useful predictions, and they make sure those models are evaluated honestly and deployed reliably. The role needs Python, statistics and careful experimental thinking.',
    prerequisites: ['Python programming', 'School-level algebra'],
    tools: ['Python', 'NumPy', 'Pandas', 'scikit-learn', 'PyTorch or TensorFlow', 'Jupyter'],
    outcomes: ['Clean and prepare real datasets', 'Train and compare ML models', 'Evaluate models with the right metrics', 'Deploy a model behind an API'],
    duration: '9-12 months part-time', suitability: ['Intermediate', 'Advanced'],
    practical: 'Interpret model metrics and correct a preprocessing or evaluation error.',
    assessment: { banks: ['aiml'] },
    category_weights: { theory: 35, practical: 40, scenario: 25 },
    skills: [S('ml.python', 2, true), S('ml.math_stats', 2, true), S('ml.numpy_pandas', 2, true), S('ml.preprocessing', 2), S('ml.algorithms', 2), S('ml.evaluation', 2, true), S('ml.deep_learning', 1), S('ml.deployment', 1)],
    stages: [
      stage(['ml.python', 'ml.math_stats'], ['A statistics notebook summarising a public dataset'], 'Score Strong on Python and on mathematics and statistics.'),
      stage(['ml.numpy_pandas', 'ml.preprocessing'], ['Clean a messy dataset (missing values, categories, scaling)'], 'Score Strong on NumPy/Pandas and preprocessing.'),
      stage(['ml.algorithms', 'ml.evaluation'], ['Train and compare three models with proper validation'], 'Choose and defend a model with the right metrics.'),
      stage(['ml.deep_learning', 'ml.deployment'], ['A small neural network served behind an API'], 'A deployed model with a documented evaluation.'),
      CAPSTONE('An end-to-end ML project on Pakistani data (for example crop yield or load-shedding prediction)'),
      READINESS('A model card for your capstone'),
    ],
  },
  {
    slug: 'generative-ai-llm-developer', title: 'Generative AI & LLM Developer', status: 'published',
    summary: 'Build LLM applications: prompting, embeddings, RAG, agents, evaluation and guardrails.',
    overview: 'Generative AI developers build products on large language models. The role covers prompt design, retrieval-augmented generation, tool-calling agents and the evaluation and security work that makes them trustworthy.',
    prerequisites: ['Intermediate Python', 'Using REST APIs'],
    tools: ['Python', 'LLM APIs', 'Embeddings', 'Vector databases', 'LangChain or LangGraph', 'Evaluation tooling'],
    outcomes: ['Design reliable prompts', 'Build a grounded RAG pipeline', 'Build tool-calling agents', 'Evaluate and secure LLM apps'],
    duration: '6-9 months part-time', suitability: ['Intermediate', 'Advanced'],
    practical: 'Design or debug a simple RAG workflow.',
    assessment: { banks: ['genai', 'aiml', 'frontend'] },
    category_weights: { theory: 30, practical: 40, scenario: 30 },
    skills: [S('ml.python', 2, true), S('fe.api', 1), S('gen.llm', 2, true), S('gen.prompting', 1), S('gen.embeddings', 2), S('gen.vectordb', 1), S('gen.rag', 2, true), S('gen.agents', 1), S('gen.eval_security', 2)],
    stages: [
      stage(['ml.python', 'fe.api'], ['A script that calls an LLM API and handles errors and retries'], 'Score Strong on Python.'),
      stage(['gen.llm', 'gen.prompting'], ['A prompt library with tested prompts for three tasks'], 'Explain tokens, context and temperature; write reliable prompts.'),
      stage(['gen.embeddings', 'gen.vectordb', 'gen.rag'], ['A RAG chatbot over your university handbook'], 'A grounded RAG pipeline with citations.'),
      stage(['gen.agents', 'gen.eval_security'], ['Add tool calling, an evaluation set and injection defences'], 'Measured answer quality and documented guardrails.'),
      CAPSTONE('A deployed LLM assistant for a real domain (for example Urdu/English customer support) with an evaluation report'),
      READINESS('A cost and safety review of your capstone'),
    ],
  },
  {
    slug: 'data-analyst-business-intelligence', title: 'Data Analyst & Business Intelligence', status: 'published',
    summary: 'Turn data into decisions with spreadsheets, SQL, Python, statistics and dashboards.',
    overview: 'Data analysts answer business questions with data. The role covers cleaning data, querying it with SQL, summarising it honestly and presenting it in dashboards that decision-makers trust.',
    prerequisites: ['Comfortable with spreadsheets', 'Basic numeracy'],
    tools: ['Excel or Google Sheets', 'SQL', 'Python', 'Power BI or Looker Studio'],
    outcomes: ['Clean and combine datasets', 'Answer questions with SQL', 'Summarise data with the right statistics', 'Build clear dashboards'],
    duration: '5-8 months part-time', suitability: ['Beginner', 'Intermediate'],
    practical: 'Analyse a dataset using SQL or interpret a business dashboard.',
    assessment: { banks: ['analyst'] },
    category_weights: { theory: 35, practical: 35, scenario: 30 },
    skills: [S('da.spreadsheets', 2, true), S('da.sql', 2, true), S('cs.programming', 1), S('da.cleaning', 2), S('da.stats', 2, true), S('da.visualization', 2), S('da.business', 1)],
    stages: [
      stage(['da.spreadsheets', 'cs.programming'], ['A cleaned sales sheet with pivot tables'], 'Use formulas, lookups and pivots confidently.'),
      stage(['da.sql', 'da.stats'], ['Answer ten business questions with SQL'], 'Score Strong on SQL and descriptive statistics.'),
      stage(['da.cleaning', 'da.visualization'], ['A dashboard for a public dataset'], 'A dashboard a manager can read without explanation.'),
      stage(['da.business'], ['A written analysis with a recommendation'], 'A recommendation backed by numbers and caveats.'),
      CAPSTONE('An end-to-end analysis for a local business with a dashboard and a short report'),
      READINESS('A one-page portfolio summary of your analyses'),
    ],
  },
  {
    slug: 'data-engineer', title: 'Data Engineer', status: 'published',
    summary: 'Build the pipelines and data models that move and prepare data at scale.',
    overview: 'Data engineers build the systems that collect, transform and serve data. The role needs strong SQL, data modelling, pipelines, orchestration and an obsession with data quality.',
    prerequisites: ['Python programming', 'SQL basics'],
    tools: ['Python', 'SQL', 'dbt', 'Airflow', 'Cloud warehouses', 'Docker'],
    outcomes: ['Model data for analytics', 'Build reliable ETL/ELT pipelines', 'Orchestrate and monitor jobs', 'Guarantee data quality'],
    duration: '9-12 months part-time', suitability: ['Intermediate', 'Advanced'],
    practical: 'Debug a data transformation pipeline.',
    assessment: { banks: ['dataeng', 'aiml'] },
    category_weights: { theory: 30, practical: 45, scenario: 25 },
    skills: [S('ml.python', 2, true), S('de.advanced_sql', 2, true), S('de.modeling', 2), S('de.etl', 2, true), S('de.orchestration', 1), S('de.quality', 2), S('de.cloud_data', 1)],
    stages: [
      stage(['ml.python', 'da.sql'], ['Load a CSV into PostgreSQL with Python'], 'Score Strong on Python and SQL.'),
      stage(['de.advanced_sql', 'de.modeling'], ['A star schema for an online shop'], 'Window functions, CTEs and a defended data model.'),
      stage(['de.etl', 'de.quality'], ['A daily pipeline with data-quality checks'], 'A pipeline that fails loudly on bad data.'),
      stage(['de.orchestration', 'de.cloud_data'], ['Schedule and monitor the pipeline in the cloud'], 'An orchestrated, monitored pipeline.'),
      CAPSTONE('A production-style pipeline for a public dataset with docs, tests and a dashboard on top'),
      READINESS('An architecture diagram and runbook for your capstone'),
    ],
  },
  {
    slug: 'cybersecurity-analyst', title: 'Cybersecurity Analyst', status: 'published',
    summary: 'Defend systems: networking, Linux, logs, vulnerabilities and incident response.',
    overview: 'Security analysts protect organisations by monitoring systems, investigating alerts and responding to incidents. All practice in this track uses safe, authorised lab data.',
    prerequisites: ['Comfortable with computers and the command line', 'Basic networking awareness'],
    tools: ['Linux', 'Wireshark', 'SIEM tools', 'Nmap (authorised labs only)', 'Python'],
    outcomes: ['Explain how networks and authentication work', 'Investigate logs and alerts', 'Assess and prioritise vulnerabilities', 'Run an incident-response playbook'],
    duration: '8-12 months part-time', suitability: ['Beginner', 'Intermediate'],
    practical: 'Analyse a simulated security incident using safe, authorised lab data.',
    assessment: { banks: ['cyber'] },
    category_weights: { theory: 30, practical: 35, scenario: 35 },
    skills: [S('sec.networking', 2, true), S('sec.linux', 2, true), S('sec.principles', 2, true), S('sec.auth', 1), S('sec.logs', 2), S('sec.vulns', 1), S('sec.incident', 2)],
    stages: [
      stage(['sec.networking', 'sec.linux'], ['Map a home lab network and harden a Linux VM'], 'Score Strong on networking and Linux.'),
      stage(['sec.principles', 'sec.auth'], ['A threat model for a student portal'], 'Explain CIA, least privilege and safe authentication.'),
      stage(['sec.logs', 'sec.vulns'], ['Investigate a provided log set and write findings'], 'Find the incident in the lab logs and rank vulnerabilities.'),
      stage(['sec.incident'], ['An incident-response playbook'], 'Run the playbook on a lab scenario.'),
      CAPSTONE('A full investigation report on a simulated incident in an authorised lab'),
      READINESS('Prepare for an entry-level certification such as CompTIA Security+'),
    ],
  },
  {
    slug: 'cloud-devops-engineer', title: 'Cloud & DevOps Engineer', status: 'published',
    summary: 'Automate builds, deployments and infrastructure with Docker, CI/CD, Kubernetes and IaC.',
    overview: 'DevOps engineers make software easy to ship and keep running. The role covers Linux, containers, CI/CD pipelines, cloud services, infrastructure as code and monitoring.',
    prerequisites: ['Comfortable on the command line', 'Able to run a web app locally', 'Git basics'],
    tools: ['Linux', 'Docker', 'GitHub Actions', 'Kubernetes', 'Terraform', 'Prometheus and Grafana'],
    outcomes: ['Containerise applications', 'Build CI/CD pipelines', 'Provision cloud infrastructure as code', 'Monitor and alert on services'],
    duration: '8-12 months part-time', suitability: ['Intermediate', 'Advanced'],
    practical: 'Identify and fix a deployment or CI/CD configuration issue.',
    assessment: { banks: ['devops'] },
    category_weights: { theory: 25, practical: 50, scenario: 25 },
    skills: [S('ops.linux', 2, true), S('ops.networking', 1, true), S('cs.git_tools', 1, true), S('ops.docker', 2), S('ops.cicd', 2), S('ops.cloud', 1), S('ops.iac', 1), S('ops.monitoring', 1), S('ops.kubernetes', 2)],
    stages: [
      stage(['ops.linux', 'ops.networking', 'cs.git_tools'], ['Set up and secure a Linux server'], 'Score Strong on Linux, networking and Git.'),
      stage(['ops.docker', 'ops.cicd'], ['Containerise an app and build a CI pipeline'], 'A pipeline that tests and builds an image on every push.'),
      stage(['ops.cloud', 'ops.iac'], ['Provision the app with Terraform'], 'Infrastructure created and destroyed from code.'),
      stage(['ops.kubernetes', 'ops.monitoring'], ['Run the app on Kubernetes with dashboards and alerts'], 'A monitored deployment that heals itself.'),
      CAPSTONE('A GitOps-deployed, monitored service with a written runbook'),
      READINESS('A post-incident review of a simulated outage'),
    ],
  },
  {
    slug: 'software-qa-test-automation', title: 'Software QA & Test Automation Engineer', status: 'published',
    summary: 'Find bugs before users do: test design, bug reports, API tests and automation.',
    overview: 'QA engineers protect quality by designing tests, writing clear bug reports and automating checks so regressions are caught early.',
    prerequisites: ['Attention to detail', 'Basic programming'],
    tools: ['Test case management', 'Postman', 'Playwright or Selenium', 'GitHub Actions'],
    outcomes: ['Design test cases with good coverage', 'Write reproducible bug reports', 'Automate UI and API tests', 'Run tests in CI'],
    duration: '5-8 months part-time', suitability: ['Beginner', 'Intermediate'],
    practical: 'Create test cases for a sample application and identify missing coverage.',
    assessment: { banks: ['qa'] },
    category_weights: { theory: 30, practical: 40, scenario: 30 },
    skills: [S('qa.principles', 2, true), S('qa.test_design', 2, true), S('qa.bug_reports', 1), S('qa.api_testing', 2), S('cs.programming', 1), S('qa.automation', 2), S('qa.regression_ci', 1)],
    stages: [
      stage(['qa.principles', 'cs.programming'], ['Test plan for a login page'], 'Score Strong on testing principles.'),
      stage(['qa.test_design', 'qa.bug_reports'], ['Test cases and bug reports for an EchoLens-like portal'], 'Boundary, equivalence and negative cases; reproducible reports.'),
      stage(['qa.api_testing'], ['An API test collection'], 'API tests that check status, body and errors.'),
      stage(['qa.automation', 'qa.regression_ci'], ['Automated UI tests running in CI'], 'A green automated suite in CI.'),
      CAPSTONE('A complete test strategy and automated suite for an open-source web app'),
      READINESS('A QA portfolio with sample bug reports'),
    ],
  },
  {
    slug: 'software-engineering-dsa', title: 'Software Engineering & Data Structures/Algorithms', status: 'published',
    summary: 'Master problem solving, data structures, algorithms and clean software design.',
    overview: 'Strong software engineers solve problems methodically and write code that others can maintain. This track builds data structures, algorithms, complexity analysis and design skills used in interviews and real work.',
    prerequisites: ['One programming language at a working level'],
    tools: ['Python, C++ or Java', 'Git', 'Online judges', 'Unit testing'],
    outcomes: ['Choose the right data structure', 'Design and analyse algorithms', 'Write clean, tested, object-oriented code', 'Solve interview-style problems'],
    duration: '6-9 months part-time', suitability: ['Beginner', 'Intermediate', 'Advanced'],
    practical: 'Solve coding problems with test cases.',
    assessment: { banks: ['se', 'common'] },
    category_weights: { theory: 35, practical: 45, scenario: 20 },
    skills: [S('cs.programming', 2, true), S('se.oop', 1), S('se.arrays_strings', 2, true), S('se.linked_lists', 1), S('se.stacks_queues', 1), S('se.trees_graphs', 2), S('se.algorithms', 2), S('se.complexity', 2, true), S('cs.debugging', 1), S('se.design', 1)],
    stages: [
      stage(['cs.programming', 'se.oop', 'cs.debugging'], ['Twenty warm-up problems with tests'], 'Score Strong on programming fundamentals.'),
      stage(['se.arrays_strings', 'se.complexity'], ['Two-pointer and sliding-window problem set'], 'Solve array/string problems and state their complexity.'),
      stage(['se.linked_lists', 'se.stacks_queues'], ['Implement a linked list, stack and queue from scratch'], 'Working implementations with tests.'),
      stage(['se.trees_graphs', 'se.algorithms', 'se.design'], ['Graph and dynamic-programming problem set'], 'Solve medium-level tree, graph and DP problems.'),
      CAPSTONE('A well-designed, tested library or tool (for example a timetable scheduler)'),
      READINESS('Ten timed mock interviews with written reflections'),
    ],
  },
];

const bySlug = new Map(TRACKS.map((t) => [t.slug, t]));
const track = (slug) => bySlug.get(String(slug || '')) || null;

module.exports = { TRACKS, STAGE_NAMES, track };
