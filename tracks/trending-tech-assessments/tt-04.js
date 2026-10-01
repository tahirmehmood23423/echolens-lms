'use strict';
// TT-04 Cloud DevOps and Container Orchestration. Every hands-on task needs
// Docker, a cluster or a cloud account, so this course is quiz-assessed with
// the original projects kept as optional practice.
// Quiz rows: [question, options, index of the correct option, explanation].
module.exports = {
  quizzes: {
    'A4.1': [
      ['What does a multi-stage Docker build achieve?', ['Runs several containers at once', 'Builds in a full toolchain image, then copies only the artefacts into a small runtime image', 'Pushes to several registries', 'Builds for several CPUs'], 1, 'The final image excludes compilers and build caches.'],
      ['Why run a container as a non-root user?', ['It is faster', 'A compromised process has fewer privileges', 'Root cannot run Node', 'Docker requires it'], 1, 'Least privilege limits the blast radius of a breach.'],
      ['Which instruction sets the user for later instructions and the running container?', ['RUN user', 'USER', 'EXPOSE', 'ENTRYPOINT'], 1, 'USER switches the effective user.'],
      ['Why does ordering COPY package*.json before COPY . speed up rebuilds?', ['It compresses files', 'The dependency install layer stays cached when only source code changes', 'It skips tests', 'It is required syntax'], 1, 'Layers are cached until their inputs change.'],
      ['Containers isolate processes mainly using Linux...', ['virtual machines', 'namespaces and cgroups', 'browsers', 'cron jobs'], 1, 'Namespaces isolate views; cgroups limit resources.'],
    ],
    'A4.2': [
      ['Where does data written inside a container\'s writable layer go when the container is removed?', ['It is kept forever', 'It is deleted with the container', 'It moves to the image', 'It is uploaded to the registry'], 1, 'The writable layer belongs to that container only.'],
      ['A named volume...', ['is deleted with the container', 'persists independently of any container until explicitly removed', 'lives inside the image', 'cannot be shared'], 1, 'Volumes outlive containers.'],
      ['Which command removes a volume?', ['docker rm', 'docker volume rm', 'docker image prune', 'docker stop'], 1, 'Volumes have their own lifecycle commands.'],
      ['On a user-defined Docker network, containers reach each other by...', ['MAC address', 'container/service name via built-in DNS', 'host IP only', 'they cannot'], 1, 'Docker\'s embedded DNS resolves names.'],
      ['Publishing a port with -p 5432:5432 maps...', ['container to container', 'a host port to a container port', 'two volumes', 'a domain to an IP'], 1, 'It exposes the container port on the host.'],
    ],
    'A4.3': [
      ['What is Docker Compose for?', ['Building kernels', 'Defining and running multi-container applications from one YAML file', 'Monitoring CPUs', 'Writing Dockerfiles'], 1, 'Compose declares services, networks and volumes together.'],
      ['depends_on with condition: service_healthy makes a service wait until...', ['the dependency container is created', 'the dependency passes its health check', 'a timeout elapses', 'the host reboots'], 1, 'Plain depends_on only orders startup, not readiness.'],
      ['A health check is...', ['a log file', 'a command run periodically to decide whether the service is healthy', 'a firewall rule', 'a CI job'], 1, 'e.g. pg_isready for PostgreSQL.'],
      ['Why reference the database as host "db" rather than an IP?', ['IPs are illegal', 'Container IPs change; service names are stable', 'It is shorter', 'Postgres requires it'], 1, 'Service-name DNS survives restarts.'],
      ['`docker compose ps` shows...', ['images on Docker Hub', 'the state and health of the project\'s services', 'disk usage', 'Git status'], 1, 'Useful to confirm every service is healthy.'],
    ],
    'A4.4': [
      ['A Kubernetes Deployment ensures...', ['one pod forever', 'the desired number of pod replicas keep running, replacing failed ones', 'DNS records', 'TLS certificates'], 1, 'Its ReplicaSet reconciles to the desired count.'],
      ['A failing liveness probe causes Kubernetes to...', ['scale up', 'restart the container', 'delete the deployment', 'ignore it'], 1, 'Liveness detects a stuck process.'],
      ['A failing readiness probe causes Kubernetes to...', ['restart the node', 'remove the pod from Service endpoints so it gets no traffic', 'delete the image', 'roll back'], 1, 'Readiness controls traffic, not restarts.'],
      ['Resource requests are used by the scheduler to...', ['bill the user', 'place pods on nodes with enough capacity', 'limit network speed', 'set the image tag'], 1, 'Requests reserve capacity; limits cap usage.'],
      ['Which object lists the pod IPs currently receiving a Service\'s traffic?', ['ConfigMap', 'Endpoints / EndpointSlice', 'Secret', 'Namespace'], 1, 'Only Ready pods appear there.'],
    ],
    'A4.5': [
      ['A ClusterIP Service provides...', ['a public internet IP', 'a stable internal virtual IP and DNS name in front of pods', 'a disk', 'a container image'], 1, 'Pods come and go; the Service stays.'],
      ['An Ingress resource routes...', ['TCP packets between nodes', 'HTTP(S) requests by host and path to Services', 'DNS zones', 'logs'], 1, 'It needs an Ingress controller to take effect.'],
      ['Without an Ingress controller installed, an Ingress resource...', ['works anyway', 'has no effect', 'deletes services', 'creates load balancers automatically'], 1, 'The controller (e.g. NGINX) implements the rules.'],
      ['TLS for an Ingress is configured by referencing...', ['a ConfigMap', 'a Secret of type kubernetes.io/tls', 'a PersistentVolume', 'a Job'], 1, 'The Secret holds the certificate and key.'],
      ['A self-signed certificate is...', ['trusted by browsers by default', 'fine for testing but not trusted by browsers without an exception', 'invalid HTTPS', 'faster than CA certificates'], 1, 'No CA vouches for it.'],
    ],
    'A4.6': [
      ['Where should a database password live in Kubernetes?', ['In the image', 'In a Secret', 'In a public ConfigMap', 'In the Deployment name'], 1, 'Secrets keep credentials out of images and manifests.'],
      ['By default, Kubernetes Secrets are stored...', ['strongly encrypted always', 'base64-encoded, so enable encryption at rest and RBAC', 'in plain files on laptops', 'in Git'], 1, 'Base64 is encoding, not encryption.'],
      ['A Horizontal Pod Autoscaler changes...', ['node count', 'the number of pod replicas based on metrics such as CPU', 'container image size', 'memory limits'], 1, 'HPA scales replicas between min and max.'],
      ['HPA CPU utilisation targets are measured relative to...', ['the node\'s total CPU', 'the pods\' CPU requests', 'CPU limits only', 'a fixed 1 core'], 1, 'Without requests, CPU utilisation cannot be computed.'],
      ['Why does scaling down happen slowly after load stops?', ['A bug', 'A stabilisation window avoids flapping', 'Kubernetes cannot scale down', 'Pods must be deleted manually'], 1, 'The default downscale window is several minutes.'],
    ],
    'A4.7': [
      ['A GitHub Actions workflow is defined in...', ['package.json', '.github/workflows/*.yml', 'Dockerfile', 'README.md'], 1, 'YAML files in that folder define workflows.'],
      ['Tagging an image with the commit SHA gives...', ['smaller images', 'an immutable, traceable link between image and source', 'faster pulls', 'free storage'], 1, 'You always know which commit is running.'],
      ['Branch protection with required status checks means...', ['anyone can push to main', 'a pull request cannot merge until the checks pass', 'CI is skipped', 'branches are deleted'], 1, 'A failing test blocks the merge.'],
      ['Why is a second CI run of the same commit faster with caching?', ['GitHub gives priority', 'Dependency and build-layer caches are restored instead of rebuilt', 'Tests are skipped', 'It is not faster'], 1, 'Cache hits skip repeated work.'],
      ['Secrets in GitHub Actions should be accessed via...', ['plain text in YAML', 'the secrets context (e.g. ${{ secrets.TOKEN }})', 'commit messages', 'environment files in the repo'], 1, 'Secrets are encrypted and masked in logs.'],
    ],
    'A4.8': [
      ['GitHub Container Registry image names start with...', ['docker.io/', 'ghcr.io/', 'gcr.io/', 'registry.local/'], 1, 'ghcr.io/OWNER/IMAGE:TAG.'],
      ['What does Trivy scan for?', ['Code style', 'Known vulnerabilities (CVEs) and misconfigurations in images and code', 'Network speed', 'Spelling'], 1, 'It matches packages against vulnerability databases.'],
      ['How do you make a scan fail the job on critical findings?', ['Ignore the output', 'Set the severity filter to CRITICAL and a non-zero exit code', 'Delete the image', 'Use docker run'], 1, '--severity CRITICAL --exit-code 1.'],
      ['The usual fix for vulnerabilities in an old base image is to...', ['disable scanning', 'bump to a newer, patched base image', 'rename the image', 'add more layers'], 1, 'Most CVEs come from outdated OS packages.'],
      ['Why upload the scan report as an artifact?', ['To slow CI', 'So reviewers can inspect the findings after the run', 'It is required by Docker', 'To publish it on the internet'], 1, 'Artifacts persist run outputs.'],
    ],
    'A4.9': [
      ['GitOps means...', ['deploying by SSH', 'Git is the single source of truth for desired state and a controller reconciles the cluster to it', 'using Git hooks only', 'storing images in Git'], 1, 'Changes go through Git; the cluster follows.'],
      ['If someone edits replicas with kubectl, Argo CD with self-heal will...', ['keep the manual change', 'detect drift and revert to what Git declares', 'delete the app', 'email the user only'], 1, 'Self-heal re-syncs drifted resources.'],
      ['How do you roll back in a GitOps workflow?', ['kubectl delete everything', 'Revert the commit in Git and let the controller sync', 'Rebuild the cluster', 'Restart Argo CD'], 1, 'History in Git is the deployment history.'],
      ['An Argo CD Application points to...', ['a Docker image only', 'a Git repo path and a destination cluster/namespace', 'a database', 'a CI job'], 1, 'Source and destination define what to sync where.'],
      ['Auto-sync means...', ['manual approval for each change', 'changes in Git are applied automatically', 'syncing every second to Docker Hub', 'nothing'], 1, 'The controller applies new commits automatically.'],
    ],
    'A4.10': [
      ['Terraform describes infrastructure...', ['imperatively, step by step', 'declaratively, as the desired end state', 'only for AWS', 'in Python only'], 1, 'Terraform computes the changes needed.'],
      ['What does `terraform plan` show?', ['Billing data', 'The changes Terraform would make to reach the declared state', 'Logs', 'Running processes'], 1, 'Plan is a dry run.'],
      ['Why use remote state (e.g. S3 with locking)?', ['It is faster to type', 'Teams share one state safely and avoid concurrent corruption', 'Local state is illegal', 'It removes the need for plan'], 1, 'Locking prevents two applies colliding.'],
      ['`terraform plan` on unchanged code should report...', ['everything will be recreated', 'no changes', 'an error', 'random output'], 1, 'Idempotency: matching state means nothing to do.'],
      ['A security group in AWS acts as...', ['a DNS server', 'a stateful virtual firewall for instances', 'a load balancer', 'a backup'], 1, 'It allows or denies traffic by port and source.'],
    ],
    'A4.11': [
      ['Prometheus collects metrics mainly by...', ['receiving emails', 'scraping HTTP /metrics endpoints on an interval', 'reading logs', 'SSH'], 1, 'It is pull-based.'],
      ['Which metric type only ever increases (or resets on restart)?', ['Gauge', 'Counter', 'Histogram bucket boundary', 'Label'], 1, 'Counters like requests_total only go up.'],
      ['Error rate over five minutes is typically computed with...', ['sum()', 'rate() over a [5m] range on a counter', 'max()', 'count() of labels'], 1, 'rate() gives a per-second rate from a counter.'],
      ['An alert in "pending" state means...', ['it already fired', 'the condition is true but has not yet lasted the `for` duration', 'it is disabled', 'it resolved'], 1, 'After `for` elapses it becomes firing.'],
      ['Which component routes and deduplicates alert notifications?', ['Grafana', 'Alertmanager', 'kubectl', 'Terraform'], 1, 'Alertmanager groups, silences and sends alerts.'],
    ],
    'A4.12': [
      ['Why compute p95 latency from a histogram rather than an average?', ['Averages hide slow tail requests that users feel', 'Averages are slower to compute', 'Histograms are smaller', 'Grafana requires it'], 0, 'A few very slow requests disappear in a mean.'],
      ['In PromQL, p95 from a histogram uses...', ['avg()', 'histogram_quantile(0.95, ...)', 'max_over_time()', 'count()'], 1, 'It estimates the quantile from bucket counts.'],
      ['A distributed trace is made of...', ['log lines only', 'spans recording timed operations across services', 'metrics', 'containers'], 1, 'Spans share a trace id across service hops.'],
      ['How does a trace continue across a service boundary?', ['By IP address', 'Context propagation, e.g. the W3C traceparent header', 'By timestamps only', 'It cannot'], 1, 'The header carries trace and parent span ids.'],
      ['OpenTelemetry is...', ['a database', 'a vendor-neutral standard and SDKs for traces, metrics and logs', 'a CI tool', 'a container runtime'], 1, 'It instruments once and exports anywhere.'],
    ],
  },
  tasks: {},
};
