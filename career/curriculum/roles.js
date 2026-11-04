'use strict';
/**
 * Job-role catalog (36 roles, 3 per career track).
 *
 * Each role maps to MANDATORY subtracks (all needed for EchoLens Assessed
 * Knowledge Readiness) and OPTIONAL subtracks (preferred skills).
 *
 * Job-description evidence. `jd.status` is honest about what was checked:
 *   search_summary_unverified  real listings were found through a web search
 *                              (title, employer where shown, URL, access date)
 *                              but the listing pages could not be opened from
 *                              the build environment, so details are
 *                              unverified and dates may be stale.
 *   jd_verification_required   no listing evidence recorded yet; the profile
 *                              is EchoLens's draft competency profile.
 * No profile is marked validated until an admin reviews its sources.
 * `observed` paraphrases recurring requirements; no job text is copied.
 */
const ACCESSED = '2026-11-04';
const ref = (title, url, employer = null, location = 'Pakistan', note = '') => ({ title, employer, url, location, accessed: ACCESSED, source: 'web search summary', verified: false, note });
const R = (id, track, title, description, responsibilities, mandatory, optional, jd) => ({
  id, track, title, description, responsibilities, mandatory, optional,
  jd: jd || { status: 'jd_verification_required', references: [], observed: [] }, status: 'draft', version: 1,
});
const JD = (references, observed) => ({ status: 'search_summary_unverified', references, observed });

const FE_JD = JD([
  ref('Junior Frontend Developer', 'https://app.qureos.com/jobs/junior-frontend-developer-1760604366324', null, 'Lahore'),
  ref('React JS Junior Front End Developer', 'https://app.qureos.com/jobs/react-js-junior-front-end-developer-1761388109243'),
  ref('Frontend Developer (6 Months to 2 Years Experience)', 'https://javascript.jobs/job/frontend-developer-react-54', null, 'Lahore, Karachi, Islamabad (hybrid)'),
  ref('Junior React JS developer listings', 'https://pk.indeed.com/q-junior-react-js-developer-jobs.html', null, 'Pakistan', 'search results page'),
], ['React fundamentals', 'TypeScript', 'REST API integration', 'state management (Redux or similar)', 'maintainable code', '6 months to 2 years experience for junior roles']);
const BE_JD = JD([
  ref('Junior Python Backend Developer (Django/FastAPI/Flask)', 'https://app.qureos.com/jobs/junior-python-backend-developer-django-fastapi-flask-1766580327396', null, 'Lahore'),
  ref('Junior Python Developer', 'https://app.qureos.com/jobs/junior-python-developer-1757580856310', null, 'Lahore'),
  ref('Junior Backend Engineer (Node.js/FastAPI)', 'https://app.qureos.com/jobs/junior-backend-engineer-nodejs-fastapi-1771959755863', 'LAB23 Technologies', 'Lahore'),
  ref('Python Developer - Backend (Onsite, Lahore)', 'https://www.careers-page.com/hr-pod-hiring-talent-globally/job/L3XRVXR8', 'HR POD', 'Lahore'),
  ref('Junior Python Developer (Onsite, Night Shift)', 'https://hired.pk/jobs/view/junior-python-developer-onsite-night-115993.html', null, 'Lahore'),
], ['Python and OOP', 'Django, FastAPI or Flask', 'REST APIs', 'PostgreSQL or MySQL queries', 'Git', 'JWT authentication and async programming (some roles)', 'Docker, AWS or GCP deployment (preferred)']);
const MERN_JD = JD([
  ref('Jr MERN Stack Developer', 'https://app.qureos.com/jobs/jr-mern-stack-1776224964676'),
  ref('Software Engineer - MERN', 'https://builtinhyderabad.in/job/software-engineer-mern/7363454', 'Devsinc', 'Islamabad'),
  ref('Junior MERN Stack Developer', 'https://www.getpakjob.com/jobs/view/junior-mern-stack-developer-3', null, 'Karachi'),
], ['JavaScript and TypeScript', 'React with Redux/Axios', 'Node.js and Express routing and middleware', 'MongoDB schema design', 'REST APIs', 'Git']);
const FLUTTER_JD = JD([
  ref('Flutter Developer', 'https://app.qureos.com/jobs/flutter-developer-1760019015170', null, 'Lahore'),
  ref('Trainee Flutter Developer', 'https://app.qureos.com/jobs/trainee-flutter-developer-1758144582764', null, 'Islamabad'),
  ref('Junior Flutter Developer', 'https://en-pk.whatjobs.com/job/Junior-Flutter-Developer/lahore/2982527', null, 'Lahore'),
], ['Dart and Flutter', 'state management (Provider, Riverpod or Bloc)', 'REST APIs and JSON', 'Firebase (preferred)', 'MVVM and published apps (some roles)']);
const ML_JD = JD([
  ref('Junior Machine Learning / AI Engineer', 'https://aijobs.net/job/576686-junior-machine-learning-ai-engineer'),
  ref('Junior ML Engineer (Onsite, Lahore)', 'https://app.qureos.com/jobs/junior-ml-engineer-onsite-lahore-remittance-salary-1773469209540', null, 'Lahore'),
  ref('Machine Learning Engineer', 'https://career.io/job/machine-learning-engineer-rawalpindi-translation-empire-pk-b7aff2b240b6bb8c3cdc7e929f9a11a4', 'Translation Empire', 'Rawalpindi'),
], ['Python with NumPy, pandas and scikit-learn', 'TensorFlow or PyTorch (plus)', 'SQL', 'model debugging and evaluation', 'CS, data science or statistics degree']);
const GA_JD = JD([
  ref('AI/ML Developer (LLMs, NLP, and AI Applications)', 'https://apply.workable.com/pakistan-single-window/jobs/view/E944171693.md', 'Pakistan Single Window', 'Islamabad'),
  ref('AI Engineer - AI/LLM (Backend), Pakistan', 'https://apply.workable.com/volga-partners/jobs/view/D5FC274074.md', 'Volga Partners'),
  ref('AI Engineer (AI/LLM backend)', 'https://app.qureos.com/jobs/ai-engineer-aillm-backend-pakistan-1777511501060'),
], ['Python', 'LangChain, LlamaIndex or LangGraph', 'embeddings and vector databases (FAISS, Pinecone, Chroma, Weaviate)', 'RAG ingestion, chunking and retrieval tuning', 'FastAPI or Django backends', 'cloud deployment']);
const DA_JD = JD([
  ref('Junior Data Analyst', 'https://apply.workable.com/translation-empire/jobs/view/EE0090749B.md', 'Translation Empire', 'Rawalpindi', 'search summary shows posting date 2025-02-24'),
  ref('Junior Data Analyst', 'https://app.qureos.com/jobs/junior-data-analyst-1760020869526'),
  ref('Junior Data Analyst (Rawalpindi Cantonment)', 'https://www.jobleads.com/pk/job/junior-data-analyst--rawalpindi-cantonment--e65ab3b170e392549ff8f2eb934cfc3c8', null, 'Rawalpindi'),
], ['SQL for reporting', 'Power BI dashboards, DAX and data modeling', 'Excel pivot tables, formulas and Power Query', 'basic ETL and data warehousing', 'Python (some roles)']);
const DE_JD = JD([
  ref('Associate Data Engineer', 'https://jobs.workable.com/jobs/59428cc0-39ee-4664-a56d-fd0ec1f9da3f.md', 'Teknosys', 'Islamabad'),
  ref('Junior Data Engineer', 'https://acemoneytransfer.applytojob.com/apply/k7uGtR4fLI/Junior-Data-Engineer', 'ACE Money Transfer'),
  ref('Junior Data Engineer', 'https://hired.pk/jobs/view/junior-data-engineer-110186.html'),
  ref('Associate Data Engineer', 'https://venturedive.applytojob.com/apply/ZCjMEGzvNb/Associate-Data-Engineer-Data-Engineer', 'VentureDive'),
], ['SQL and Python', 'ETL/ELT pipeline development', 'Apache Airflow or other orchestration', 'relational databases (MySQL, PostgreSQL)', 'cloud platforms and Spark/Kafka (plus)', 'star schema design (some roles)']);
const SOC_JD = JD([
  ref('SOC L1 Analyst', 'https://app.qureos.com/jobs/soc-l1-analyst-1755151991572'),
  ref('SOC Officer', 'https://careers.mobilinkbank.com/Careers/Jobs/JobDetails/50518', 'Mobilink Microfinance Bank'),
  ref('Junior SOC Analyst', 'https://www.iwork4sindh.com/job/junior-soc-analyst', null, 'Karachi'),
  ref('SOC vacancy', 'https://www.sbp.org.pk/careers/2023/Nov/SOC.htm', 'State Bank of Pakistan', 'Pakistan', '2023 posting'),
], ['monitoring SIEM, EDR and XDR alerts', 'escalating incidents to L2', 'documenting incidents', 'networking fundamentals (TCP/IP, DNS, HTTP)', 'Windows and Linux basics', 'shift work; Security+ or similar certifications are a plus']);
const ANDROID_JD = JD([
  ref('Senior Android Developer', 'https://www.bayt.com/en/pakistan/jobs/sr-android-developer-74941321/', 'Systems Limited', 'Pakistan', 'senior listing, used for skill themes only'),
  ref('Android Developer', 'https://app.qureos.com/jobs/android-developer-1775264162119'),
  ref('Android Developer', 'https://app.qureos.com/jobs/android-developer-1767251355309'),
  ref('Android Developer roles', 'https://careers.netsoltech.com/?p=43879', 'NetSol Technologies', 'Lahore, Karachi', '3+ years'),
  ref('Android jobs search', 'https://pk.indeed.com/q-android-jobs.html', null, 'Pakistan', 'search page'),
], ['Kotlin (Java still common)', 'Android SDK and architecture best practices', 'REST API integration', 'Git', 'unit testing and secure data handling', 'entry roles ask for a CS degree and 1 to 2 years; many listings are senior']);
const RN_JD = JD([
  ref('React Native Developer', 'https://app.qureos.com/jobs/react-native-developer-1760608891938', null, 'Karachi'),
  ref('React Native Developer', 'https://app.qureos.com/jobs/react-native-developer-1770494272997', null, 'Lahore'),
  ref('React Native Developer (fresher)', 'https://www.iwork4sindh.com/job/react-native-developer-1767956163-6960dec3a9545', null, 'Karachi'),
  ref('React Native Developer', 'https://wateen.com/?p=148754', 'Wateen Telecom'),
  ref('React Native Developer', 'https://app.qureos.com/jobs/react-native-developer-1767262143940', null, 'Islamabad'),
], ['JavaScript (ES6+); TypeScript usually expected, sometimes listed as a plus', 'state management with Redux, Context API, Zustand or MobX', 'REST API integration', 'App Store and Google Play releases', 'native modules in some roles', 'experience asked ranges from fresher to 4+ years']);
const SECENG_JD = JD([
  ref('Junior Cyber Security Engineer, Application Security', 'https://www.careerjet.com.pk/jobad/pkc90ad07bed81130e32cb7786e926b57b', null, 'Kharian'),
  ref('Junior Security Engineer', 'https://pucit.edu.pk/junior-security-engineer/', null, 'Lahore'),
  ref('Trainee Information Security Engineer', 'https://app.qureos.com/jobs/trainee-information-security-engineer-1756393540977', null, 'Lahore'),
  ref('Junior Security Engineer', 'https://hireresolve.simplify.hr/vacancy/jsnsns'),
  ref('Security Engineer', 'https://app.qureos.com/jobs/security-engineer-1770500028308', null, 'Pakistan', 'mid-level, used for skill themes only'),
], ['networking and Linux fundamentals', 'information security fundamentals', 'security policies and compliance (ISO 27001, PCI-DSS, GDPR) in trainee roles', 'application security standards in AppSec roles', 'supporting investigations and remediation', 'degree or certifications such as CCNA or Security+ preferred']);
const DEVOPS_JD = JD([
  ref('Junior DevOps Engineer', 'https://vyro.applytojob.com/apply/2Zm6OSLdlb/Junior-DevOps-Engineer', 'Vyro'),
  ref('Junior DevOps Engineer', 'https://app.qureos.com/jobs/junior-devops-engineer-1760020875892'),
  ref('Jr DevOps Engineer', 'https://app.qureos.com/jobs/jr-devops-engineer-1757580749301'),
], ['CI/CD (Jenkins, GitLab CI, GitHub Actions)', 'Docker and Kubernetes', 'AWS (or Azure/GCP)', 'Terraform or Ansible', 'Linux administration and Bash/Python scripting', 'Git']);
const QA_JD = JD([
  ref('Software Quality Assurance Engineer (Automation), Lahore', 'https://career.io/job/software-quality-assurance-engineer-automation-lahore-tenx-47eaf14840cee285cc4442d2b180f0c0', 'TenX', 'Lahore'),
  ref('Software Quality Assurance Engineer (Playwright)', 'https://app.qureos.com/jobs/software-quality-assurance-engineer-playwright-expert-1757114786234', null, 'Lahore'),
  ref('SQA Automation Engineer', 'https://app.qureos.com/jobs/sqa-automation-engineer-1758794261369'),
], ['Playwright (TypeScript), Selenium or Cypress', 'API testing with Postman, REST Assured or Playwright', 'CI/CD integration (GitHub Actions, GitLab CI, Jenkins)', 'SQL/database testing', 'Page Object Model', 'Agile/Scrum; ISTQB a plus']);
const SE_JD = JD([
  ref('Associate Software Engineer', 'https://folio3.com/jobs/software-engineer', 'Folio3'),
  ref('Associate Software Engineer - Python', 'https://apply.workable.com/devsinc-17/jobs/view/2F49FD26C8.md', 'Devsinc'),
  ref('Associate Software Engineer (Fresh Graduate)', 'https://hw.glich.co/jobboard/jobs/associate-software-engineer-fresh-graduate-at-devsinc-ss1bso', 'Devsinc'),
], ['data structures and algorithms', 'object-oriented programming', 'Python, Java, JavaScript or C#', 'project portfolio', 'CS or engineering degree']);

module.exports = [
  // ---------------- Frontend ----------------
  R('junior-frontend-developer', 'frontend-web-developer', 'Junior Frontend Developer', 'Builds and maintains accessible, responsive web interfaces and connects them to APIs.',
    ['Build responsive pages from designs', 'Integrate REST APIs and handle errors', 'Fix UI bugs across browsers', 'Write maintainable, reviewed code'],
    ['web-foundations', 'html-semantic', 'css-fundamentals', 'responsive-css', 'js-fundamentals', 'js-dom-async', 'react-fundamentals', 'frontend-api-security', 'git-collaboration'],
    ['typescript-fundamentals', 'frontend-quality'], FE_JD),
  R('react-developer', 'frontend-web-developer', 'React Developer', 'Builds React applications with sound state management, data fetching and performance.',
    ['Build reusable React components', 'Manage client and server state', 'Optimise rendering performance', 'Test components'],
    ['html-semantic', 'css-fundamentals', 'responsive-css', 'js-fundamentals', 'js-dom-async', 'react-fundamentals', 'react-advanced', 'frontend-api-security', 'frontend-quality', 'git-collaboration'],
    ['typescript-fundamentals', 'nextjs-architecture'], FE_JD),
  R('typescript-frontend-developer', 'frontend-web-developer', 'TypeScript Frontend Developer', 'Builds type-safe frontends with TypeScript, React and Next.js.',
    ['Model data and APIs with types', 'Build typed React and Next.js features', 'Prevent runtime errors with strict typing', 'Maintain shared types with backend teams'],
    ['js-fundamentals', 'js-dom-async', 'typescript-fundamentals', 'react-fundamentals', 'react-advanced', 'nextjs-architecture', 'frontend-api-security', 'frontend-quality', 'git-collaboration'],
    ['responsive-css', 'fullstack-integration-state'], FE_JD),

  // ---------------- Backend ----------------
  R('junior-backend-developer', 'backend-developer', 'Junior Backend Developer', 'Builds and maintains server-side features, APIs and database access.',
    ['Implement API endpoints', 'Write SQL queries and migrations', 'Fix production bugs from logs', 'Write tests for business logic'],
    ['programming-foundations', 'python-fundamentals', 'http-web-architecture', 'rest-api-design', 'sql-fundamentals', 'database-design', 'api-security-auth', 'backend-testing-reliability', 'git-collaboration'],
    ['python-intermediate-oop', 'practical-data-structures', 'backend-deployment-ops'], BE_JD),
  R('python-fastapi-developer', 'backend-developer', 'Python/FastAPI Developer', 'Builds production Python APIs with FastAPI, PostgreSQL and solid reliability practices.',
    ['Design and build FastAPI services', 'Model data in PostgreSQL', 'Secure APIs with authentication and authorization', 'Containerise and deploy services'],
    ['python-fundamentals', 'python-intermediate-oop', 'http-web-architecture', 'rest-api-design', 'fastapi-backend', 'sql-fundamentals', 'database-design', 'db-integration-performance', 'api-security-auth', 'backend-testing-reliability', 'backend-deployment-ops', 'git-collaboration'],
    ['practical-data-structures'], BE_JD),
  R('nodejs-developer', 'backend-developer', 'Node.js Developer', 'Builds JavaScript/TypeScript backend services with Node.js and Express.',
    ['Build Express APIs', 'Handle async errors and performance', 'Integrate SQL or MongoDB databases', 'Secure and test services'],
    ['js-fundamentals', 'js-dom-async', 'http-web-architecture', 'rest-api-design', 'node-express', 'sql-fundamentals', 'database-design', 'api-security-auth', 'backend-testing-reliability', 'git-collaboration'],
    ['typescript-fundamentals', 'db-integration-performance', 'backend-deployment-ops'], MERN_JD),

  // ---------------- Full-stack ----------------
  R('mern-stack-developer', 'full-stack-web-developer', 'MERN Stack Developer', 'Builds full-stack JavaScript applications with React, Node.js, Express and MongoDB.',
    ['Build React frontends', 'Build Express APIs', 'Design MongoDB data models', 'Deploy and debug full-stack features'],
    ['html-semantic', 'css-fundamentals', 'responsive-css', 'js-fundamentals', 'js-dom-async', 'react-fundamentals', 'http-web-architecture', 'rest-api-design', 'node-express', 'api-security-auth', 'fullstack-integration-state', 'git-collaboration'],
    ['typescript-fundamentals', 'react-advanced', 'web-deployment-cicd'], MERN_JD),
  R('nextjs-fullstack-developer', 'full-stack-web-developer', 'Next.js Full-Stack Developer', 'Builds full-stack TypeScript applications with Next.js and PostgreSQL.',
    ['Build Next.js pages and server logic', 'Design PostgreSQL schemas', 'Implement authentication', 'Deploy with CI/CD'],
    ['js-fundamentals', 'js-dom-async', 'typescript-fundamentals', 'react-fundamentals', 'nextjs-architecture', 'rest-api-design', 'sql-fundamentals', 'database-design', 'api-security-auth', 'frontend-api-security', 'fullstack-integration-state', 'web-deployment-cicd', 'git-collaboration'],
    ['react-advanced', 'fullstack-architecture', 'frontend-quality'], MERN_JD),
  R('python-fullstack-developer', 'full-stack-web-developer', 'Python Full-Stack Developer', 'Builds web applications with a React frontend and a Python (FastAPI) backend.',
    ['Build React interfaces', 'Build Python APIs', 'Model relational data', 'Integrate and deploy the stack'],
    ['html-semantic', 'css-fundamentals', 'js-fundamentals', 'js-dom-async', 'react-fundamentals', 'python-fundamentals', 'python-intermediate-oop', 'rest-api-design', 'fastapi-backend', 'sql-fundamentals', 'database-design', 'api-security-auth', 'git-collaboration'],
    ['typescript-fundamentals', 'web-deployment-cicd', 'fullstack-integration-state'], BE_JD),

  // ---------------- Mobile ----------------
  R('flutter-developer', 'mobile-app-developer', 'Flutter Developer', 'Builds cross-platform mobile apps with Flutter and Dart.',
    ['Build Flutter screens and navigation', 'Manage state', 'Integrate REST APIs and local storage', 'Release apps to stores'],
    ['programming-foundations', 'mobile-ui-fundamentals', 'dart-programming', 'flutter-fundamentals', 'flutter-layout-nav-state', 'mobile-apis-networking', 'mobile-storage', 'mobile-testing-debugging', 'git-collaboration'],
    ['mobile-auth-security', 'mobile-architecture', 'app-distribution'], FLUTTER_JD),
  R('android-developer', 'mobile-app-developer', 'Android Developer', 'Builds native Android apps with Kotlin and Jetpack Compose. Flutter evidence does not count here.',
    ['Build Compose UIs', 'Use ViewModel and lifecycle-aware architecture', 'Integrate APIs and Room', 'Publish to Google Play'],
    ['programming-foundations', 'mobile-ui-fundamentals', 'kotlin-android', 'mobile-apis-networking', 'mobile-storage', 'mobile-architecture', 'mobile-testing-debugging', 'git-collaboration'],
    ['mobile-auth-security', 'mobile-performance-platform', 'app-distribution'], ANDROID_JD),
  R('react-native-developer', 'mobile-app-developer', 'React Native Developer', 'Builds cross-platform apps with React Native. Flutter evidence does not count here.',
    ['Build React Native screens', 'Manage navigation and state', 'Integrate APIs and device features', 'Release to both stores'],
    ['js-fundamentals', 'js-dom-async', 'react-fundamentals', 'mobile-ui-fundamentals', 'react-native', 'mobile-apis-networking', 'mobile-storage', 'mobile-testing-debugging', 'git-collaboration'],
    ['typescript-fundamentals', 'mobile-auth-security', 'app-distribution'], RN_JD),

  // ---------------- AI & ML ----------------
  R('junior-ml-engineer', 'ai-machine-learning-engineer', 'Junior ML Engineer', 'Builds, evaluates and helps deploy classical machine learning models.',
    ['Prepare data and features', 'Train and evaluate models', 'Avoid leakage and overfitting', 'Package models for use'],
    ['python-fundamentals', 'probability-statistics', 'numpy-arrays', 'pandas-fundamentals', 'data-cleaning', 'ml-preprocessing', 'ml-fundamentals', 'supervised-learning', 'feature-eng-evaluation', 'git-collaboration'],
    ['math-for-ai', 'unsupervised-learning', 'mlops-deployment', 'sql-fundamentals'], ML_JD),
  R('ai-engineer', 'ai-machine-learning-engineer', 'AI Engineer', 'Builds AI-powered features end to end, from models to production services.',
    ['Train or adapt models', 'Serve models through APIs', 'Monitor models in production', 'Integrate AI into products'],
    ['python-fundamentals', 'python-intermediate-oop', 'numpy-arrays', 'pandas-fundamentals', 'ml-preprocessing', 'ml-fundamentals', 'supervised-learning', 'deep-learning', 'mlops-deployment', 'responsible-ai-monitoring', 'git-collaboration'],
    ['nlp-fundamentals', 'computer-vision', 'ai-api-integration', 'llm-fundamentals'], ML_JD),
  R('computer-vision-engineer', 'ai-machine-learning-engineer', 'Computer Vision Engineer', 'Builds image and video models for classification, detection and segmentation.',
    ['Prepare and augment image data', 'Train and fine-tune CNNs', 'Evaluate detection and segmentation', 'Deploy vision models'],
    ['python-fundamentals', 'math-for-ai', 'numpy-arrays', 'ml-fundamentals', 'deep-learning', 'computer-vision', 'feature-eng-evaluation', 'mlops-deployment', 'git-collaboration'],
    ['probability-statistics', 'responsible-ai-monitoring'], ML_JD),

  // ---------------- Generative AI ----------------
  R('llm-application-developer', 'generative-ai-llm-developer', 'LLM Application Developer', 'Builds product features on top of LLM APIs with reliable prompts and outputs.',
    ['Integrate LLM APIs into products', 'Design prompts and structured outputs', 'Evaluate and secure LLM features', 'Control cost and latency'],
    ['python-fundamentals', 'rest-api-design', 'ai-api-integration', 'llm-fundamentals', 'prompting-structured-output', 'llm-security-eval', 'llm-deployment-cost', 'git-collaboration'],
    ['embeddings-semantic-search', 'rag-fundamentals', 'fastapi-backend'], GA_JD),
  R('rag-developer', 'generative-ai-llm-developer', 'RAG Developer', 'Builds retrieval-augmented generation systems grounded in company knowledge.',
    ['Ingest and chunk documents', 'Build retrieval with vector stores', 'Ground answers with citations', 'Evaluate retrieval and answer quality'],
    ['python-fundamentals', 'ai-api-integration', 'llm-fundamentals', 'prompting-structured-output', 'embeddings-semantic-search', 'vector-databases', 'rag-fundamentals', 'rag-advanced', 'llm-security-eval', 'git-collaboration'],
    ['fastapi-backend', 'llm-deployment-cost'], GA_JD),
  R('ai-agent-developer', 'generative-ai-llm-developer', 'AI Agent Developer', 'Builds tool-using agents and multi-step AI workflows with safety controls.',
    ['Define tools and schemas', 'Design agent loops and workflows', 'Add human approval and guardrails', 'Trace and evaluate agents'],
    ['python-fundamentals', 'rest-api-design', 'ai-api-integration', 'llm-fundamentals', 'prompting-structured-output', 'agents-tool-calling', 'agent-workflows', 'llm-security-eval', 'git-collaboration'],
    ['rag-fundamentals', 'llm-deployment-cost', 'fastapi-backend'], GA_JD),

  // ---------------- Data analytics ----------------
  R('junior-data-analyst', 'data-analyst-business-intelligence', 'Junior Data Analyst', 'Turns business data into reliable reports and insights.',
    ['Query and clean data', 'Compute business metrics', 'Build charts and reports', 'Present findings to stakeholders'],
    ['data-business-fundamentals', 'spreadsheet-analysis', 'sql-fundamentals', 'descriptive-stats-metrics', 'data-visualization', 'data-storytelling'],
    ['python-fundamentals', 'pandas-fundamentals', 'data-cleaning', 'powerbi-modeling'], DA_JD),
  R('sql-analyst', 'data-analyst-business-intelligence', 'SQL Analyst', 'Answers business questions with accurate, efficient SQL.',
    ['Write analytical SQL', 'Validate numbers against sources', 'Optimise slow queries', 'Document metric definitions'],
    ['data-business-fundamentals', 'sql-fundamentals', 'advanced-sql', 'descriptive-stats-metrics', 'data-visualization', 'data-storytelling'],
    ['spreadsheet-analysis', 'database-design', 'python-fundamentals'], DA_JD),
  R('powerbi-analyst', 'data-analyst-business-intelligence', 'Power BI Analyst', 'Builds trusted Power BI models, measures and dashboards.',
    ['Model data in Power BI', 'Write DAX measures', 'Design dashboards', 'Manage refresh and access'],
    ['data-business-fundamentals', 'spreadsheet-analysis', 'sql-fundamentals', 'descriptive-stats-metrics', 'data-visualization', 'powerbi-modeling', 'dashboards-reporting', 'data-storytelling'],
    ['advanced-sql', 'data-cleaning'], DA_JD),

  // ---------------- Data engineering ----------------
  R('junior-data-engineer', 'data-engineer', 'Junior Data Engineer', 'Builds and maintains reliable data pipelines and models.',
    ['Build ETL/ELT pipelines', 'Write SQL and Python transformations', 'Schedule workflows', 'Check data quality'],
    ['python-fundamentals', 'python-intermediate-oop', 'sql-fundamentals', 'database-design', 'advanced-sql', 'data-modeling-warehousing', 'etl-elt-architecture', 'data-transformation-pipelines', 'workflow-orchestration', 'data-quality-testing', 'git-collaboration'],
    ['cloud-data-platforms', 'batch-streaming', 'linux-sysadmin'], DE_JD),
  R('etl-developer', 'data-engineer', 'ETL Developer', 'Designs and operates ETL processes between operational systems and analytics.',
    ['Design ETL jobs', 'Handle incremental and late data', 'Reconcile and validate loads', 'Recover failed loads'],
    ['python-fundamentals', 'sql-fundamentals', 'advanced-sql', 'data-modeling-warehousing', 'etl-elt-architecture', 'data-transformation-pipelines', 'workflow-orchestration', 'data-quality-testing', 'data-reliability-recovery'],
    ['cloud-data-platforms', 'git-collaboration'], DE_JD),
  R('cloud-data-engineer', 'data-engineer', 'Cloud Data Engineer', 'Builds data platforms on cloud storage and warehouses with governance and cost control.',
    ['Build cloud pipelines', 'Manage lakes and warehouses', 'Secure and govern data', 'Optimise cost'],
    ['python-fundamentals', 'python-intermediate-oop', 'sql-fundamentals', 'advanced-sql', 'data-modeling-warehousing', 'etl-elt-architecture', 'workflow-orchestration', 'batch-streaming', 'cloud-data-platforms', 'data-governance-security', 'cloud-aws-foundations', 'git-collaboration'],
    ['docker-containers', 'data-reliability-recovery'], DE_JD),

  // ---------------- Cybersecurity ----------------
  R('soc-analyst', 'cybersecurity-analyst', 'SOC Analyst', 'Monitors and triages security alerts and escalates incidents (L1).',
    ['Monitor SIEM and EDR alerts', 'Triage and escalate', 'Document incidents', 'Follow playbooks'],
    ['computing-os-foundations', 'networking-fundamentals', 'linux-sysadmin', 'security-foundations', 'identity-access-control', 'security-logging-monitoring', 'soc-siem', 'incident-response'],
    ['vulnerabilities-defense', 'cryptography-secure-comms'], SOC_JD),
  R('security-analyst', 'cybersecurity-analyst', 'Security Analyst', 'Assesses and reduces security risk across systems.',
    ['Assess vulnerabilities', 'Review access and configurations', 'Investigate incidents', 'Report risk'],
    ['computing-os-foundations', 'networking-fundamentals', 'linux-sysadmin', 'security-foundations', 'identity-access-control', 'cryptography-secure-comms', 'vulnerabilities-defense', 'security-logging-monitoring', 'incident-response', 'security-grc'],
    ['soc-siem', 'network-endpoint-cloud-security'], SOC_JD),
  R('junior-security-engineer', 'cybersecurity-analyst', 'Junior Security Engineer', 'Implements and automates security controls across networks, endpoints and cloud.',
    ['Harden systems', 'Implement security controls', 'Automate checks', 'Secure cloud resources'],
    ['networking-fundamentals', 'linux-sysadmin', 'security-foundations', 'identity-access-control', 'cryptography-secure-comms', 'vulnerabilities-defense', 'network-endpoint-cloud-security', 'scripting-automation'],
    ['cloud-networking-iam', 'security-logging-monitoring', 'security-grc'], SECENG_JD),

  // ---------------- Cloud & DevOps ----------------
  R('junior-devops-engineer', 'cloud-devops-engineer', 'Junior DevOps Engineer', 'Automates builds, deployments and infrastructure, and supports production systems.',
    ['Maintain CI/CD pipelines', 'Containerise services', 'Manage Linux servers', 'Monitor and troubleshoot'],
    ['linux-sysadmin', 'networking-fundamentals', 'git-collaboration', 'scripting-automation', 'cloud-aws-foundations', 'docker-containers', 'ci-cd', 'observability'],
    ['infrastructure-as-code', 'kubernetes', 'cloud-networking-iam'], DEVOPS_JD),
  R('cloud-engineer', 'cloud-devops-engineer', 'Cloud Engineer', 'Designs and operates secure, cost-effective cloud infrastructure.',
    ['Design cloud networks and IAM', 'Provision with infrastructure as code', 'Operate managed services', 'Control cloud cost'],
    ['linux-sysadmin', 'networking-fundamentals', 'cloud-aws-foundations', 'cloud-networking-iam', 'infrastructure-as-code', 'docker-containers', 'observability', 'reliability-incident-cost'],
    ['kubernetes', 'ci-cd', 'scripting-automation'], DEVOPS_JD),
  R('cicd-engineer', 'cloud-devops-engineer', 'CI/CD Engineer', 'Builds and maintains fast, reliable delivery pipelines.',
    ['Design pipelines and quality gates', 'Manage deployment strategies', 'Speed up builds', 'Handle rollback'],
    ['git-collaboration', 'linux-sysadmin', 'scripting-automation', 'docker-containers', 'ci-cd', 'infrastructure-as-code', 'kubernetes', 'observability'],
    ['cloud-aws-foundations', 'reliability-incident-cost'], DEVOPS_JD),

  // ---------------- QA ----------------
  R('manual-qa-engineer', 'software-qa-test-automation', 'Manual QA Engineer', 'Plans and executes manual testing and reports defects clearly.',
    ['Design test cases', 'Execute functional and regression tests', 'Report and track defects', 'Explore for risks'],
    ['sdlc-foundations', 'qa-principles', 'test-design', 'defect-management', 'functional-regression-exploratory', 'web-api-testing', 'test-data-management', 'sql-fundamentals'],
    ['performance-quality-engineering'], QA_JD),
  R('api-tester', 'software-qa-test-automation', 'API Tester', 'Tests HTTP APIs for correctness, security rules and contracts.',
    ['Test endpoints and error handling', 'Verify data in the database', 'Automate API checks', 'Test authentication rules'],
    ['sdlc-foundations', 'qa-principles', 'test-design', 'defect-management', 'http-web-architecture', 'web-api-testing', 'sql-fundamentals', 'test-data-management', 'js-fundamentals'],
    ['ci-test-reporting', 'performance-quality-engineering'], QA_JD),
  R('automation-qa-engineer', 'software-qa-test-automation', 'Automation QA Engineer', 'Builds automated test suites with Playwright or Selenium and runs them in CI.',
    ['Build automation frameworks', 'Write stable UI and API tests', 'Integrate tests into CI', 'Fix flaky tests'],
    ['qa-principles', 'test-design', 'defect-management', 'web-api-testing', 'js-fundamentals', 'playwright-automation', 'automation-frameworks', 'ci-test-reporting', 'git-collaboration'],
    ['sql-fundamentals', 'test-data-management', 'performance-quality-engineering'], QA_JD),

  // ---------------- Software engineering ----------------
  R('junior-software-engineer', 'software-engineering-dsa', 'Junior Software Engineer', 'Solves programming problems and builds maintainable software in a team.',
    ['Implement features', 'Choose data structures and algorithms', 'Debug and test code', 'Collaborate through code review'],
    ['programming-foundations', 'oop-principles', 'complexity-analysis', 'arrays-strings-hashing', 'linear-structures', 'searching-sorting', 'debugging-testing', 'software-design', 'git-collaboration'],
    ['recursion-backtracking', 'trees-bst', 'graphs', 'greedy-dp', 'engineering-problem-solving'], SE_JD),
  R('python-software-developer', 'software-engineering-dsa', 'Python Software Developer', 'Builds well-designed Python software and solves algorithmic problems in Python.',
    ['Write idiomatic Python', 'Design classes and modules', 'Solve algorithmic problems', 'Test and debug'],
    ['python-fundamentals', 'python-intermediate-oop', 'complexity-analysis', 'arrays-strings-hashing', 'linear-structures', 'searching-sorting', 'debugging-testing', 'software-design', 'git-collaboration'],
    ['recursion-backtracking', 'trees-bst', 'graphs'], SE_JD),
  R('java-software-developer', 'software-engineering-dsa', 'Java Software Developer', 'Builds object-oriented software in Java with strong fundamentals.',
    ['Write Java services and classes', 'Use collections and streams', 'Solve algorithmic problems', 'Test and debug'],
    ['java-fundamentals', 'oop-principles', 'complexity-analysis', 'arrays-strings-hashing', 'linear-structures', 'searching-sorting', 'debugging-testing', 'software-design', 'git-collaboration'],
    ['recursion-backtracking', 'trees-bst', 'graphs', 'greedy-dp'], SE_JD),
];
