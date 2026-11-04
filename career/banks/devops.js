'use strict';
/** Cloud & DevOps Engineer track. */
const { mc, out, written, submission } = require('../q');

module.exports = [
  // ---- Linux for operations ----
  mc('op-lx-01', 'ops.linux', 1, 'Which command shows running processes and their CPU and memory use, updating live?', ['top (or htop)', 'ls', 'pwd', 'echo'], 0, 'top shows live resource use per process.'),
  mc('op-lx-02', 'ops.linux', 2, 'On a systemd-based server, which command shows whether the nginx service is running and its recent log lines?', ['systemctl status nginx', 'nginx --list', 'ps nginx --logs', 'service-show nginx'], 0,
    'systemctl status shows state, PID and the latest journal entries for a unit.'),
  out('op-lx-p1', 'ops.linux', 2, 'A server\'s disk is full. Type the command that shows free and used space for each mounted filesystem in human-readable units.', null, ['df -h'],
    'df -h reports filesystem usage with sizes like G and M; du -sh measures a directory instead.', { category: 'practical' }),
  mc('op-lx-s1', 'ops.linux', 3, 'A production server becomes unresponsive every night at 2 a.m. What do you check first?',
    ['Scheduled jobs (cron/systemd timers) and resource metrics/logs around 2 a.m.', 'The monitor\'s brightness', 'Reinstall the operating system', 'Nothing - restart it each morning'], 0,
    'A regular time points to scheduled work - backups, cron jobs, log rotation - so correlate metrics and logs with the schedule.', { type: 'scenario' }),

  // ---- Networking for operations ----
  mc('op-nw-01', 'ops.networking', 1, 'What does a load balancer do?', ['Spreads incoming traffic across several servers', 'Stores passwords', 'Compiles code', 'Backs up databases'], 0,
    'Load balancers improve capacity and availability by distributing requests.'),
  mc('op-nw-02', 'ops.networking', 2, 'In the CIDR block 10.0.1.0/24, how many addresses are there?', ['256', '24', '65,536', '1,024'], 0,
    'A /24 leaves 8 host bits: 2^8 = 256 addresses (some are reserved for network use).'),
  mc('op-nw-p1', 'ops.networking', 3, 'curl to your app\'s public address times out, but curl to localhost:8080 on the server works. What is the most likely cause?',
    ['A firewall or security group is not allowing inbound traffic on that port (or the app only listens on 127.0.0.1)', 'The app has a syntax error', 'DNS is working perfectly so it must be the code', 'The server needs more RAM'], 0,
    'The app works locally, so the problem is the path in: firewall rules, security groups, or binding to 0.0.0.0 instead of localhost.', { type: 'debug' }),
  mc('op-nw-s1', 'ops.networking', 3, 'You must let a web app reach a database in the cloud while keeping the database off the public internet. What design fits?',
    ['Put the database in a private subnet and allow traffic only from the app\'s security group on the database port', 'Give the database a public IP with a strong password', 'Open all ports to the internet', 'Put both on a USB drive'], 0,
    'Private networking plus narrowly scoped rules means only the app can reach the database.', { type: 'scenario' }),

  // ---- Docker ----
  mc('op-dk-01', 'ops.docker', 1, 'What is the difference between a Docker image and a container?', ['An image is a read-only template; a container is a running instance of it', 'They are the same', 'A container builds images', 'An image is a running process'], 0,
    'You build images and run containers from them.'),
  mc('op-dk-02', 'ops.docker', 2, 'Why copy package.json and install dependencies before copying the rest of the source in a Dockerfile?', ['So the dependency layer is cached and not rebuilt on every code change', 'Docker requires that order', 'It makes the image public', 'It removes node_modules'], 0,
    'Layers are cached; putting rarely changing steps first makes rebuilds fast.'),
  mc('op-dk-p1', 'ops.docker', 2, 'The container starts but the app is unreachable at http://localhost:3000 on the host. What is missing?',
    ['Publish the port when running it: docker run -p 3000:3000 myapp', 'A bigger base image', 'RUN npm start', 'EXPOSE removes the need for -p'], 0,
    'EXPOSE documents a port but does not publish it; -p maps a host port to the container.',
    { type: 'debug', code: 'FROM node:20-alpine\nWORKDIR /app\nCOPY . .\nRUN npm ci\nEXPOSE 3000\nCMD ["node", "server.js"]\n\n$ docker run myapp' }),
  mc('op-dk-s1', 'ops.docker', 3, 'Your Docker image is 1.8 GB and deploys are slow. What helps most?',
    ['Use a slim base image and a multi-stage build that copies only the built output into the final image', 'Add more layers', 'Install every tool "just in case"', 'Zip the image manually'], 0,
    'Multi-stage builds leave compilers and build caches behind; slim bases remove unneeded OS packages.', { type: 'scenario' }),

  // ---- CI/CD ----
  mc('op-ci-01', 'ops.cicd', 1, 'What is continuous integration?', ['Automatically building and testing every change merged into the shared branch', 'Deploying once a year', 'Writing code without version control', 'Manual testing only'], 0,
    'CI gives fast feedback by building and testing each change.'),
  mc('op-ci-02', 'ops.cicd', 2, 'Where should a deploy key or API token used by a pipeline be stored?', ['In the CI system\'s encrypted secrets, referenced by name in the workflow', 'Directly in the workflow YAML', 'In the README', 'In a public gist'], 0,
    'Secrets in the repository leak; CI secret stores inject them at runtime and mask them in logs.'),
  mc('op-ci-p1', 'ops.cicd', 3, 'This workflow deploys even when tests fail. What is the fix?',
    ['Make deploy depend on test: add needs: test to the deploy job', 'Rename the jobs', 'Run deploy first', 'Remove the test job'], 0,
    'Jobs run in parallel unless linked; needs: test makes deploy wait for test and skip if it fails.',
    { type: 'debug', code: 'jobs:\n  test:\n    runs-on: ubuntu-latest\n    steps: [ { uses: actions/checkout@v4 }, { run: npm ci && npm test } ]\n  deploy:\n    runs-on: ubuntu-latest\n    steps: [ { run: ./deploy.sh } ]' }),
  mc('op-ci-s1', 'ops.cicd', 3, 'A bad release reached all users before anyone noticed. Which delivery practice reduces the impact next time?',
    ['Progressive rollout (canary or blue-green) with automated health checks and quick rollback', 'Deploy less often and in bigger batches', 'Skip monitoring', 'Deploy only on Fridays'], 0,
    'Sending new versions to a small share of traffic first, with health checks, limits blast radius.', { type: 'scenario' }),

  // ---- Cloud services ----
  mc('op-cs-01', 'ops.cloud', 1, 'What does IaaS provide?', ['Virtual machines, storage and networking that you manage yourself', 'A finished application such as email', 'Only a website builder', 'Physical servers delivered to your office'], 0,
    'IaaS gives raw infrastructure; PaaS manages the platform; SaaS is a complete application.'),
  mc('op-cs-02', 'ops.cloud', 2, 'Why deploy an application across more than one availability zone?', ['So it keeps running if one data centre in the region fails', 'To pay less tax', 'Because one zone cannot run Linux', 'To make deploys slower'], 0,
    'Zones are isolated facilities; spreading across them removes a single point of failure.'),
  mc('op-cs-p1', 'ops.cloud', 2, 'An S3 bucket holding student documents is publicly readable. What is the right fix?',
    ['Block public access on the bucket and serve files through signed, expiring URLs or the app', 'Rename the bucket', 'Add a README warning', 'Delete half the files'], 0,
    'Private buckets plus short-lived signed URLs give access only to authorised users.', { practical: true }),
  mc('op-cs-s1', 'ops.cloud', 3, 'The cloud bill doubled last month. What do you do first?',
    ['Use cost reports by service and tag to find what grew, then right-size, stop idle resources and set budgets/alerts', 'Move everything to a new cloud immediately', 'Ignore it', 'Turn off production'], 0,
    'Find the cause before acting; idle and oversized resources are the usual culprits.', { type: 'scenario' }),

  // ---- Infrastructure as code ----
  mc('op-ic-01', 'ops.iac', 1, 'What is infrastructure as code?', ['Defining servers, networks and services in versioned files that tools apply automatically', 'Writing code on a server', 'Drawing diagrams by hand', 'A programming language for websites'], 0,
    'IaC makes infrastructure reproducible, reviewable and version-controlled.'),
  mc('op-ic-02', 'ops.iac', 2, 'What does terraform plan do?', ['Shows the changes Terraform would make, without applying them', 'Deletes all resources', 'Applies changes immediately', 'Installs Terraform'], 0,
    'Reviewing the plan before apply prevents surprises.'),
  mc('op-ic-p1', 'ops.iac', 3, 'Two engineers run terraform apply at the same time from their laptops and the state file gets corrupted. What is the fix?',
    ['Use a remote backend with state locking (for example S3 + DynamoDB or Terraform Cloud)', 'Email the state file around', 'Delete the state file', 'Run apply twice'], 0,
    'Remote, locked state ensures one apply at a time and a single source of truth.', { type: 'debug' }),
  mc('op-ic-s1', 'ops.iac', 3, 'Someone changed a firewall rule by hand in the cloud console, and now it differs from the Terraform code. What should the team do?',
    ['Detect the drift with terraform plan, then either codify the change or revert it, and stop manual changes in production', 'Leave it', 'Delete the Terraform code', 'Make more manual changes'], 0,
    'Drift makes code untrustworthy; reconcile it and keep changes going through code review.', { type: 'scenario' }),

  // ---- Monitoring ----
  mc('op-mn-01', 'ops.monitoring', 1, 'What is the difference between metrics and logs?', ['Metrics are numeric measurements over time; logs are records of individual events', 'They are the same', 'Logs are only for errors', 'Metrics replace logs'], 0,
    'Metrics answer "how much/how often"; logs answer "what exactly happened".'),
  mc('op-mn-02', 'ops.monitoring', 2, 'Which alert is most useful to wake someone up at night?', ['Error rate above 5% for 10 minutes on the payment API', 'CPU above 60% for 10 seconds', 'One 404 error', 'Disk usage at 20%'], 0,
    'Alerts should reflect real user impact and be sustained, so on-call people act rather than ignore noise.'),
  mc('op-mn-p1', 'ops.monitoring', 3, 'In Prometheus, which query gives the per-second rate of HTTP 5xx errors over the last 5 minutes?',
    ['rate(http_requests_total{status=~"5.."}[5m])', 'http_requests_total{status="5xx"}', 'sum(http_requests_total)', 'count(errors)'], 0,
    'Counters only go up; rate() over a window turns them into a per-second rate, filtered to 5xx statuses.', { practical: true }),
  mc('op-mn-s1', 'ops.monitoring', 3, 'Users say the site is slow, but CPU and memory dashboards look normal. What do you look at next?',
    ['Request latency and traces per endpoint, and dependencies such as the database and external APIs', 'The office internet', 'Nothing - dashboards are normal', 'Restart all servers'], 0,
    'Slowness often comes from waits on dependencies, which resource graphs do not show; tracing reveals them.', { type: 'scenario' }),

  // ---- Kubernetes ----
  mc('op-k8-01', 'ops.kubernetes', 1, 'What is a Pod in Kubernetes?', ['The smallest deployable unit: one or more containers that share network and storage', 'A physical server', 'A Docker image', 'A database'], 0,
    'Pods wrap containers; Deployments manage sets of pods.'),
  mc('op-k8-02', 'ops.kubernetes', 2, 'What does a Deployment do?', ['Keeps the desired number of pod replicas running and rolls out new versions', 'Stores secrets only', 'Exposes pods to the internet by itself', 'Builds images'], 0,
    'If a pod dies the Deployment replaces it; it also manages rolling updates.'),
  mc('op-k8-p1', 'ops.kubernetes', 3, 'A pod is in CrashLoopBackOff. Which command shows why the container keeps crashing?',
    ['kubectl logs <pod> --previous (and kubectl describe pod <pod>)', 'kubectl delete namespace default', 'kubectl get nodes', 'docker ps'], 0,
    'Logs from the previous (crashed) container and the events in describe usually show the error or failed probe.', { practical: true }),
  mc('op-k8-s1', 'ops.kubernetes', 3, 'Traffic to an exam-results service jumps tenfold on results day. How should the Kubernetes setup handle it?',
    ['Use a Horizontal Pod Autoscaler on suitable metrics, with resource requests set and cluster capacity to scale', 'Run a single pod and hope', 'Manually SSH into nodes', 'Turn off health checks'], 0,
    'Autoscaling adds replicas as load grows; it needs resource requests and node capacity to work.', { type: 'scenario' }),

  // ---- Reviewed ----
  written('op-wr-01', 'ops.cicd', 2, 'theory', 'Explain the difference between continuous integration, continuous delivery and continuous deployment.',
    [['CI: every change automatically built and tested', 2], ['Continuous delivery: always releasable, release needs a manual decision', 2], ['Continuous deployment: every passing change goes to production automatically', 2]],
    'Continuous integration builds and tests every change merged to the shared branch. Continuous delivery keeps the main branch always deployable, with a human approving each production release. Continuous deployment goes further: every change that passes the pipeline is released to production automatically.'),
  submission('op-sb-01', ['ops.docker', 'ops.cicd'], 3, 'Write (1) a production Dockerfile for a Node.js app started with "node server.js" on port 3000, and (2) a GitHub Actions workflow that runs the tests on every pull request and builds the image only when tests pass.',
    [['Dockerfile uses a slim base, caches dependency install, runs as non-root, starts the app correctly', 3], ['Workflow triggers on pull_request and runs tests', 2], ['Image build depends on tests passing (needs:)', 2], ['No secrets hard-coded', 1]],
    'FROM node:20-alpine\nWORKDIR /app\nCOPY package*.json ./\nRUN npm ci --omit=dev\nCOPY . .\nUSER node\nEXPOSE 3000\nCMD ["node", "server.js"]\n---\non: [pull_request]\njobs:\n  test: { runs-on: ubuntu-latest, steps: [ { uses: actions/checkout@v4 }, { run: "npm ci && npm test" } ] }\n  build: { needs: test, runs-on: ubuntu-latest, steps: [ { uses: actions/checkout@v4 }, { run: "docker build -t app ." } ] }'),
  written('op-wr-02', 'ops.monitoring', 3, 'scenario', 'At 9 p.m. during exam registration, the student portal starts returning errors. You are on call. Describe what you do in the first 30 minutes.',
    [['Confirms impact quickly from dashboards/alerts and communicates status', 2], ['Mitigates first (roll back recent deploy, scale up, fail over)', 2], ['Uses logs/metrics/traces to find the cause', 1], ['Records a timeline for a post-incident review', 1]],
    'Check dashboards and alerts to confirm scope, post a status update and pull in help if needed. If a deploy went out recently, roll it back; otherwise scale up or fail over to restore service. Then use logs, metrics and traces to find the cause, and keep a timeline for the post-incident review.'),
];
