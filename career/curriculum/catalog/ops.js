'use strict';
/** Cybersecurity, cloud & DevOps subtracks (plus Git, shared with SE). */
const { S } = require('../dsl');

module.exports = [
  S('computing-os-foundations', 'Computing and Operating System Foundations', 'How operating systems manage processes, memory, files and users.',
    { level: 'foundation', depth: 1, hours: 15, refs: ['fc01-c-basics'] }, [
      ['Operating systems', ['!Explain processes, threads, memory and the kernel', 'Describe file systems and permissions']],
      ['Users and privileges', ['!Explain users, groups and privilege separation']],
      ['Windows and Linux basics', ['Navigate both systems and find logs and services']],
    ]),
  S('networking-fundamentals', 'Networking and Internet Protocols', 'IP, TCP/UDP, DNS, HTTP and the infrastructure that connects systems.',
    { level: 'beginner', depth: 2, hours: 20, prereq: ['computing-os-foundations'], refs: [] }, [
      ['Network models', ['!Explain layers, IP addressing and subnets (CIDR)', 'Compare TCP and UDP']],
      ['Core protocols', ['!Explain DNS, DHCP, HTTP and TLS', 'Identify common ports and services']],
      ['Infrastructure', ['!Describe routers, switches, firewalls, NAT, proxies and load balancers', 'Troubleshoot connectivity with ping, traceroute, dig and curl']],
    ]),
  S('linux-sysadmin', 'Linux and System Administration', 'Administering Linux servers from the command line.',
    { level: 'beginner', depth: 2, hours: 20, prereq: ['computing-os-foundations'], refs: [] }, [
      ['Command line', ['!Navigate, inspect and edit files with core commands', 'Use pipes, redirection, grep and find']],
      ['Permissions and users', ['!Manage permissions, ownership and sudo safely']],
      ['Services and processes', ['!Manage services with systemd and read logs with journalctl', 'Diagnose CPU, memory and disk problems']],
      ['Packages and scheduling', ['Install packages and schedule jobs with cron']],
    ]),
  S('security-foundations', 'Cybersecurity Foundations and Threat Models', 'Core security principles and thinking like a defender.',
    { level: 'beginner', depth: 2, hours: 15, prereq: ['computing-os-foundations'], refs: [] }, [
      ['Principles', ['!Apply the CIA triad, least privilege and defence in depth']],
      ['Threats', ['!Recognise phishing, malware, ransomware and social engineering', 'Describe common attacker objectives and tactics']],
      ['Threat modelling', ['Identify assets, threats and controls for a system']],
    ]),
  S('identity-access-control', 'Authentication, Authorization and Access Control', 'Managing identities and access in organisations.',
    { level: 'intermediate', depth: 2, hours: 12, prereq: ['security-foundations'], refs: [] }, [
      ['Authentication', ['!Compare password, MFA and passwordless authentication', 'Detect credential attacks (spraying, stuffing)']],
      ['Authorization', ['!Apply RBAC, least privilege and access reviews']],
      ['Identity platforms', ['Explain SSO, directories and privileged access management']],
    ]),
  S('cryptography-secure-comms', 'Cryptography and Secure Communication', 'Using cryptography correctly to protect data.',
    { level: 'intermediate', depth: 2, hours: 12, prereq: ['security-foundations'], refs: [] }, [
      ['Building blocks', ['!Distinguish hashing, symmetric and asymmetric encryption, and signatures']],
      ['TLS and certificates', ['!Explain how TLS and certificates establish trust']],
      ['Applied cryptography', ['Store passwords and keys correctly', 'Avoid common cryptographic mistakes']],
    ]),
  S('vulnerabilities-defense', 'Vulnerabilities and Defensive Security', 'Finding, prioritising and fixing vulnerabilities.',
    { level: 'intermediate', depth: 3, hours: 15, prereq: ['networking-fundamentals', 'security-foundations'], refs: [] }, [
      ['Vulnerability management', ['!Prioritise vulnerabilities by severity, exploitability and exposure', 'Interpret CVE and CVSS']],
      ['Web vulnerabilities', ['!Recognise injection, XSS, broken access control and misconfiguration']],
      ['Hardening and patching', ['Harden systems and apply compensating controls']],
    ]),
  S('security-logging-monitoring', 'Security Logging and Monitoring', 'Collecting and reading the logs that reveal attacks.',
    { level: 'intermediate', depth: 3, hours: 12, prereq: ['linux-sysadmin', 'networking-fundamentals'], refs: [] }, [
      ['Log sources', ['!Identify useful logs from endpoints, servers, networks and cloud']],
      ['Reading logs', ['!Detect suspicious patterns in authentication, web and firewall logs']],
      ['Log management', ['Centralise logs with integrity and consistent time']],
    ]),
  S('soc-siem', 'Security Operations and SIEM', 'Working in a security operations centre with SIEM tools.',
    { level: 'intermediate', depth: 3, hours: 15, prereq: ['security-logging-monitoring'], refs: [] }, [
      ['SIEM', ['!Write and tune detection rules to reduce false positives', 'Correlate events across sources']],
      ['Alert triage', ['!Triage alerts, gather context and escalate correctly']],
      ['SOC operations', ['Use playbooks, ticketing and shift handover']],
    ]),
  S('incident-response', 'Incident Detection and Response', 'Responding to security incidents methodically.',
    { level: 'intermediate', depth: 3, hours: 12, prereq: ['soc-siem'], refs: [] }, [
      ['Lifecycle', ['!Follow preparation, detection, containment, eradication and recovery']],
      ['Evidence', ['!Preserve volatile evidence and chain of custody']],
      ['After the incident', ['Run blameless post-incident reviews and notify as required']],
    ]),
  S('network-endpoint-cloud-security', 'Network, Endpoint and Cloud Security', 'Securing networks, devices and cloud environments.',
    { level: 'advanced', depth: 3, hours: 15, prereq: ['vulnerabilities-defense'], refs: [] }, [
      ['Network security', ['!Segment networks and configure firewalls with default deny']],
      ['Endpoint security', ['!Use EDR, patching and hardening for endpoints']],
      ['Cloud security', ['!Secure cloud identities, storage and network exposure']],
    ]),
  S('security-grc', 'Security Governance, Risk and Compliance', 'Managing security risk, policy and compliance.',
    { level: 'intermediate', depth: 2, hours: 10, prereq: ['security-foundations'], refs: [] }, [
      ['Risk management', ['!Assess and treat risk by likelihood and impact']],
      ['Policies and frameworks', ['Apply frameworks such as ISO 27001 and NIST CSF']],
      ['Compliance and privacy', ['Meet data protection obligations and audit requirements']],
    ]),

  // ---------------- Cloud & DevOps ----------------
  S('git-collaboration', 'Git, Development Workflows and Code Review', 'Version control and team workflows used in every engineering job.',
    { level: 'beginner', depth: 2, hours: 12, prereq: ['programming-foundations'], refs: ['web-advanced'] }, [
      ['Git basics', ['!Commit, branch, merge and resolve conflicts', 'Inspect history and undo changes safely']],
      ['Team workflows', ['!Use pull requests, protected branches and review', 'Choose a branching strategy']],
      ['Working safely', ['!Keep secrets out of repositories and respond if one leaks', 'Write useful commit messages']],
    ]),
  S('scripting-automation', 'Bash/Python Scripting and Automation', 'Automating operational tasks with scripts.',
    { level: 'intermediate', depth: 2, hours: 15, prereq: ['linux-sysadmin', 'python-fundamentals'], refs: [] }, [
      ['Bash scripting', ['!Write safe Bash scripts with variables, loops, exit codes and set -euo pipefail']],
      ['Python automation', ['!Automate tasks with Python, subprocess and APIs']],
      ['Reliable automation', ['Make scripts idempotent, logged and testable']],
    ]),
  S('cloud-aws-foundations', 'Cloud Computing and AWS Foundations', 'Core cloud concepts and AWS services.',
    { level: 'beginner', depth: 2, hours: 20, prereq: ['networking-fundamentals'], refs: ['tt-cloud-devops'] }, [
      ['Cloud concepts', ['!Compare IaaS, PaaS and SaaS and the shared responsibility model', 'Explain regions and availability zones']],
      ['Core services', ['!Choose compute (EC2, Lambda, containers) and storage (S3, EBS, RDS) for a workload']],
      ['Cost basics', ['Estimate and control cloud costs with budgets and tags']],
    ]),
  S('cloud-networking-iam', 'Cloud Networking, IAM and Security', 'Designing secure cloud networks and identities.',
    { level: 'intermediate', depth: 3, hours: 15, prereq: ['cloud-aws-foundations'], refs: ['tt-cloud-devops'] }, [
      ['Cloud networking', ['!Design VPCs with public and private subnets, routing and security groups']],
      ['IAM', ['!Grant least-privilege access with roles and policies, not long-lived keys']],
      ['Cloud security', ['Encrypt data, manage secrets and audit activity']],
    ]),
  S('docker-containers', 'Docker and Containerization', 'Building, running and optimising containers.',
    { level: 'intermediate', depth: 3, hours: 15, prereq: ['linux-sysadmin'], refs: ['tt-cloud-devops'] }, [
      ['Images and containers', ['!Write efficient Dockerfiles with layer caching and multi-stage builds']],
      ['Running containers', ['!Use ports, volumes, networks and environment configuration', 'Run multi-container apps with Compose']],
      ['Container security', ['Use minimal images, non-root users and image scanning']],
    ]),
  S('ci-cd', 'Continuous Integration and Delivery', 'Automating build, test and release pipelines.',
    { level: 'intermediate', depth: 3, hours: 15, prereq: ['git-collaboration'], refs: ['tt-cloud-devops'] }, [
      ['Pipelines', ['!Build pipelines that build, test and gate merges', 'Speed up pipelines with caching and parallel jobs']],
      ['Delivery and deployment', ['!Use environments, approvals and secrets in pipelines', 'Choose blue-green, canary or rolling deployments']],
      ['Pipeline reliability', ['Handle flaky tests and failed deploys with rollback']],
    ]),
  S('infrastructure-as-code', 'Infrastructure as Code', 'Managing infrastructure declaratively with Terraform.',
    { level: 'intermediate', depth: 3, hours: 15, prereq: ['cloud-aws-foundations'], refs: ['tt-cloud-devops'] }, [
      ['Terraform basics', ['!Write resources, variables and outputs and read plans']],
      ['State', ['!Manage remote state with locking and detect drift']],
      ['Modules and safety', ['Build reusable modules and protect critical resources']],
    ]),
  S('kubernetes', 'Kubernetes and Container Orchestration', 'Running containers at scale with Kubernetes.',
    { level: 'advanced', depth: 3, hours: 20, prereq: ['docker-containers'], refs: ['tt-cloud-devops'] }, [
      ['Core objects', ['!Use pods, deployments, services and config maps']],
      ['Health and scaling', ['!Configure probes, resource requests/limits and autoscaling']],
      ['Operations', ['!Troubleshoot pods with logs, describe and events', 'Roll out and roll back deployments']],
    ]),
  S('observability', 'Monitoring, Logging and Observability', 'Seeing what systems are doing and alerting on what matters.',
    { level: 'intermediate', depth: 3, hours: 15, prereq: ['linux-sysadmin'], refs: ['tt-cloud-devops'] }, [
      ['Metrics, logs and traces', ['!Choose metrics, logs or traces to answer an operational question']],
      ['Alerting', ['!Alert on user-impacting symptoms and SLOs, not noise']],
      ['Dashboards', ['Use percentiles and dashboards to find bottlenecks']],
    ]),
  S('reliability-incident-cost', 'Reliability, Incident Management and Cost Optimization', 'Running reliable systems economically.',
    { level: 'advanced', depth: 3, hours: 15, prereq: ['observability'], refs: [] }, [
      ['Reliability', ['!Define SLIs, SLOs and error budgets', 'Design for failure across zones']],
      ['Incident management', ['!Run incidents with clear roles and blameless reviews']],
      ['Cost optimisation', ['!Right-size and remove waste in cloud spend']],
    ]),
];
