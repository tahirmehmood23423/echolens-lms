'use strict';
const {build,pythonRef}=require('./infra-wave2-helper');
const data=[
  {
    "comp": "m1.c1",
    "title": "Design build and test gates around a dependency graph",
    "intro": "A repository shows a green packaging job while its unit tests failed in another job. Decide which evidence is required before accepting a candidate revision.",
    "headings": [
      "Reason about the mechanism",
      "Apply the decision and inspect evidence",
      "Bound the verification"
    ],
    "sections": [
      [
        "Continuous integration validates frequently integrated changes with repeatable build and test work. A pipeline is a dependency graph rather than merely a list of commands. Independent jobs can run concurrently; dependent jobs must wait for their required predecessors and inspect the intended success conditions.",
        "GitHub Actions workflow files live under .github/workflows. A schematic YAML has on: [push, pull_request], jobs:, a test job with runs-on: ubuntu-latest and steps:, and a package job with needs: test. Each step either uses an action or runs a command. Commands need explicit working-directory and dependency assumptions."
      ],
      [
        "Use explicit required checks in the repository\u2019s branch protection or ruleset settings to gate merges. A green workflow alone does not prohibit merging; repository policy must require the relevant check. Select stable unambiguous job/check names and verify that intended event paths actually produce required results.",
        "Tests provide evidence for the source revision and environment they exercised. Record the candidate commit and avoid accepting a success from an unrelated branch or older revision. Build failures, skipped jobs and neutral results need deliberate interpretation in the gate design rather than being silently treated as success."
      ],
      [
        "The local function evaluates explicit statuses only. It does not configure repository rules, run Actions jobs or reproduce provider-specific status semantics."
      ]
    ],
    "code": "import json\ns=json.loads('{\"build\":\"success\",\"test\":\"failure\",\"lint\":\"success\"}')\nrequired=[\"build\",\"test\"]\nprint(all(s.get(k)==\"success\" for k in required))\nprint(\",\".join(k for k in required if s.get(k)!=\"success\"))",
    "expect": "False\ntest",
    "problem": "Evaluate the local fixture for design build and test gates around a dependency graph.",
    "steps": [
      "Read the declared inputs and assumptions.",
      "Run the isolated Python fixture and compare its exact output.",
      "Explain which production evidence remains necessary."
    ],
    "limit": "The local function evaluates explicit statuses only. It does not configure repository rules, run Actions jobs or reproduce provider-specific status semantics.",
    "mistakes": [
      "Treating a green optional job as a merge gate.",
      "Accepting evidence from a different source revision."
    ],
    "takeaways": [
      "Express job dependencies and merge policy separately.",
      "Tie required evidence to the actual candidate revision."
    ],
    "practice": [
      [
        "What is continuous integration intended to validate?",
        "Frequently integrated changes",
        "Only annual release paperwork",
        "Only production restart timing",
        "Only registry account ownership",
        "CI gives repeatable feedback on changes as they are integrated."
      ],
      [
        "What does a pipeline dependency graph express?",
        "Prerequisites and execution order",
        "Only visual job naming order",
        "Only artifact retention duration",
        "Only branch display colors",
        "Dependencies determine what work may run and what it requires."
      ],
      [
        "Where do GitHub Actions workflow files normally live?",
        ".github/workflows",
        ".git/runtime",
        ".docker/actions",
        ".github/registry",
        "The documented workflow directory is .github/workflows."
      ],
      [
        "What does needs: test express on a job?",
        "A dependency on the test job",
        "A request to rename the test job",
        "A command to rerun every test",
        "An automatic branch protection rule",
        "Needs establishes job dependency semantics within the workflow."
      ],
      [
        "What enforces mandatory merge checks?",
        "Required-check repository rules",
        "The existence of any green badge",
        "The workflow file\u2019s display title",
        "A successful developer-local build",
        "Repository policy must require the intended checks."
      ],
      [
        "Which source identity should gate evidence reference?",
        "The candidate commit revision",
        "Any previous successful branch",
        "Only the author\u2019s account name",
        "Only the repository description",
        "Checks must support the revision being accepted."
      ]
    ],
    "final": [
      [
        "Tests fail while packaging succeeds. Which gate is appropriate if tests are required?",
        "Reject the candidate\u2019s test evidence",
        "Accept because packaging is green",
        "Accept because one job succeeded",
        "Ignore tests once an artifact exists",
        "A required failing check must prevent acceptance."
      ],
      [
        "A team alphabetizes jobs and expects that to set execution order. What should it add?",
        "Explicit dependency relationships",
        "Only numeric job display names",
        "Only sorted workflow filenames",
        "Only more log timestamps",
        "Job order in a YAML mapping is not a dependency graph."
      ],
      [
        "A green workflow exists but users can merge without it. What is missing?",
        "Required-check repository policy",
        "An additional output log line",
        "A shorter workflow file name",
        "An extra package build command",
        "Execution and merge enforcement are distinct controls."
      ],
      [
        "A package job must consume only tested output. What graph relationship fits?",
        "Package depends on required tests",
        "Tests depend only on packaging",
        "Both jobs always run independently",
        "The package name contains test",
        "A dependency ensures prerequisites are accounted for before packaging proceeds."
      ],
      [
        "A reviewer sees a success for the preceding commit. What should be requested?",
        "Evidence for the actual candidate",
        "Only a newer dashboard timestamp",
        "Only the same author\u2019s approval",
        "Only the same branch display name",
        "A prior revision\u2019s result does not validate changed content."
      ],
      [
        "A critical job is skipped by a condition. What must gate design consider?",
        "Required evidence exists",
        "Whether the job name is shorter",
        "Whether the runner is cached",
        "Whether the workflow has a badge",
        "Skipped work can mean absent evidence even when a workflow appears acceptable."
      ],
      [
        "Two unrelated jobs share a display name used by protection rules. What improves clarity?",
        "Distinct required-check identities",
        "More identical display names",
        "A common artifact filename only",
        "Less explicit repository policy",
        "Ambiguous check names make required results harder to interpret reliably."
      ],
      [
        "A required test status is missing in the fixture. What result should the explicit all-success gate produce?",
        "Reject for missing evidence",
        "Accept because no failure is listed",
        "Accept if another check is green",
        "Remove the requirement silently",
        "The local rule requires a success for every required key."
      ],
      [
        "A developer claims a local passing test automatically configures merge protection. Which response is accurate?",
        "Local evidence and policy are separate",
        "Local tests always create rulesets",
        "Every branch is protected by default",
        "Workflow YAML forbids all direct pushes",
        "Tests do not themselves configure repository enforcement."
      ],
      [
        "A CI job installs an undeclared tool from a developer\u2019s home directory. What is missing?",
        "A reproducible runner setup",
        "A longer branch display name",
        "An additional release tag alias",
        "A second optional status badge",
        "A clean runner must have declared tools and inputs to repeat validation."
      ]
    ]
  },
  {
    "comp": "m1.c1",
    "title": "Control workflow triggers and untrusted pull-request inputs",
    "intro": "An external pull request changes both the application and a build script. Decide what may run with elevated permissions before checking out and executing that change.",
    "headings": [
      "Reason about the mechanism",
      "Apply the decision and inspect evidence",
      "Bound the verification"
    ],
    "sections": [
      [
        "Workflow triggers choose the event context and revision to be tested. push and pull_request support common CI paths, while manual and scheduled events have different purposes. Review branch and path filters carefully: omitted runs may prevent required evidence or leave critical change types untested.",
        "Untrusted contributors can control source files and portions of event metadata. Do not interpolate untrusted text directly into shell command source. Prefer passing data through an environment variable and using it as quoted data, with validation appropriate to the operation. Quoting is not a substitute for command-specific validation."
      ],
      [
        "The pull_request_target event runs in the base repository context and can have access to privileges unavailable to an ordinary fork pull_request workflow. Checking out and executing untrusted pull-request code in that privileged context is dangerous. Keep untrusted validation separate from trusted release operations.",
        "Grant GITHUB_TOKEN only the permissions a job needs. A test job typically does not need repository write authority or deployment credentials. Third-party actions are executable dependencies: review them, pin references to verified full commit SHAs where appropriate, and manage controlled updates. A SHA identifies content, not inherent safety."
      ],
      [
        "This is a simplified trust-boundary rule, not the complete GitHub event permission model. Actual repository settings, event contexts and action contents require review."
      ]
    ],
    "code": "import json\ne=json.loads('{\"source\":\"fork\",\"executes_contributor_code\":true,\"write_token\":true}')\nunsafe=e[\"source\"]==\"fork\" and e[\"executes_contributor_code\"] and e[\"write_token\"]\nprint(\"separate trust contexts\" if unsafe else \"review\")",
    "expect": "separate trust contexts",
    "problem": "Evaluate the local fixture for control workflow triggers and untrusted pull-request inputs.",
    "steps": [
      "Read the declared inputs and assumptions.",
      "Run the isolated Python fixture and compare its exact output.",
      "Explain which production evidence remains necessary."
    ],
    "limit": "This is a simplified trust-boundary rule, not the complete GitHub event permission model. Actual repository settings, event contexts and action contents require review.",
    "mistakes": [
      "Executing untrusted PR code with release credentials.",
      "Inserting contributor-controlled text into shell source."
    ],
    "takeaways": [
      "Separate untrusted validation from privileged operations.",
      "Treat actions and scripts as executable dependencies."
    ],
    "practice": [
      [
        "What does a workflow trigger choose?",
        "Execution event and context",
        "The image\u2019s runtime USER value",
        "The application\u2019s database schema",
        "The registry\u2019s storage quota",
        "Triggers decide when and in which event context workflows run."
      ],
      [
        "What can an external contributor control?",
        "Proposed code and event fields",
        "Every protected repository secret",
        "Every branch protection rule",
        "Every deployment approval record",
        "Untrusted change content must not receive implicit privileged trust."
      ],
      [
        "How should untrusted text enter a shell step?",
        "As validated quoted data",
        "As interpolated command source",
        "As an unchecked executable path",
        "As an automatic eval argument",
        "Treating input as data avoids turning it into shell program text."
      ],
      [
        "What is special about pull_request_target?",
        "Base-repository execution context",
        "It always removes every privilege",
        "It only runs contributor-local code",
        "It proves the PR was reviewed",
        "The base context may carry authority inappropriate for untrusted code."
      ],
      [
        "What token scope should a test job receive?",
        "Only permissions it requires",
        "All repository administration rights",
        "All deployment environment secrets",
        "Every cloud account role",
        "Least privilege reduces consequences of compromised test execution."
      ],
      [
        "What does a pinned action commit SHA establish?",
        "The selected action revision",
        "The absence of malicious code",
        "Automatic future security updates",
        "Automatic action author approval",
        "Pinning controls identity while review and updates remain necessary."
      ]
    ],
    "final": [
      [
        "A privileged workflow checks out and executes a fork PR script. What is the primary risk?",
        "Privilege crosses a trust boundary",
        "The build cache becomes smaller",
        "The branch name changes automatically",
        "The test matrix cannot run",
        "The trust boundary is crossed by executing attacker-controlled code with authority."
      ],
      [
        "A PR title is placed directly inside run shell source. What is a safer design?",
        "Pass validated text as quoted data",
        "Add more repository write permissions",
        "Use pull_request_target by default",
        "Treat every title as a trusted command",
        "Untrusted metadata should not become shell syntax."
      ],
      [
        "A path filter ignores changes to a critical build file. What should review examine?",
        "Coverage of critical changes",
        "Only the workflow\u2019s display color",
        "Only the last release tag name",
        "Only artifact compression levels",
        "Trigger selection must cover relevant candidate changes."
      ],
      [
        "A fork test job requests production deployment credentials. What is the appropriate boundary?",
        "Keep release secrets out of that job",
        "Provide them because tests need logs",
        "Copy them into the source checkout",
        "Expose them through an image label",
        "Untrusted validation should not access production authority."
      ],
      [
        "An action is pinned to a full SHA but never reviewed. Which claim remains unsupported?",
        "That the action is safe to execute",
        "That its reference is content-specific",
        "That it is an executable dependency",
        "That updates require deliberate review",
        "Immutable selection does not prove safe behavior."
      ],
      [
        "A scheduled workflow is treated as evidence for every PR. What should be checked?",
        "Which revision and context it tested",
        "Only its cron expression spacing",
        "Only the repository display title",
        "Only the stored log file size",
        "Scheduled evidence may concern a different source revision."
      ],
      [
        "A test needs only repository read access. Which token policy fits?",
        "Explicit minimum read permissions",
        "Repository administration by default",
        "Write access to all environments",
        "A shared unrestricted personal token",
        "Match granted authority to actual job needs."
      ],
      [
        "A script reads a variable safely but passes it as an unchecked deployment target. What is still needed?",
        "Target authorization checks",
        "Unquoted shell interpolation",
        "A larger runner machine",
        "A different workflow title",
        "Safe shell treatment does not authorize arbitrary business targets."
      ],
      [
        "A protected release job downloads an artifact from an untrusted run. What must it verify?",
        "Artifact origin and trust before use",
        "Only the downloaded file\u2019s size",
        "Only the upload step\u2019s display name",
        "Only the contributor\u2019s avatar",
        "Moving files across jobs can cross the same trust boundary as executing code."
      ],
      [
        "A security update changes a pinned action. What process is appropriate?",
        "Review and deliberately update the pin",
        "Assume the old SHA changes in place",
        "Disable all dependency updates",
        "Use an unreviewed floating tag",
        "Pinned dependencies require a controlled maintenance process."
      ]
    ]
  },
  {
    "comp": "m1.c2",
    "title": "Use caches and parallel jobs without weakening correctness",
    "intro": "CI takes twenty minutes, but only a few minutes are actual tests. Separate reusable downloads, independent work and exact release artifacts before optimizing.",
    "headings": [
      "Reason about the mechanism",
      "Apply the decision and inspect evidence",
      "Bound the verification"
    ],
    "sections": [
      [
        "A dependency cache stores reusable material to avoid repeated downloads or computation. An artifact stores explicit outputs for later jobs or review. Cache availability must not be required for correctness, and a cache restore does not demonstrate that current tests passed or that output belongs to the current revision.",
        "Choose cache keys that reflect relevant inputs such as operating system, runtime version and dependency lock hash. Broad restore prefixes may recover older compatible material but require the package manager to reconcile current dependencies. Avoid placing credentials or sensitive data in caches accessible across inappropriate trust contexts."
      ],
      [
        "A matrix expands jobs across declared dimensions such as supported Python versions and operating systems. Run independent tests in parallel, but preserve dependencies for integration and release gates. A fail-fast setting can cancel remaining matrix jobs after failure; it does not mean cancelled variants were tested successfully.",
        "Measure queue time, setup, dependency installation and execution separately. Parallelism can reduce elapsed time while increasing resource use and external-service pressure. Bound concurrency and test-worker counts, and treat cache misses as a normal supported path. Record performance gains together with retained coverage."
      ],
      [
        "The synthetic matrix and key are illustrative data. They do not restore Actions caches, hash a real lockfile, schedule jobs or measure actual performance."
      ]
    ],
    "code": "import json\nj=json.loads('[{\"python\":\"3.12\",\"os\":\"linux\"},{\"python\":\"3.13\",\"os\":\"linux\"}]')\nprint(len(j))\nlock=\"lock-v2\"\nprint(\"linux-python3.13-\"+lock)",
    "expect": "2\nlinux-python3.13-lock-v2",
    "problem": "Evaluate the local fixture for use caches and parallel jobs without weakening correctness.",
    "steps": [
      "Read the declared inputs and assumptions.",
      "Run the isolated Python fixture and compare its exact output.",
      "Explain which production evidence remains necessary."
    ],
    "limit": "The synthetic matrix and key are illustrative data. They do not restore Actions caches, hash a real lockfile, schedule jobs or measure actual performance.",
    "mistakes": [
      "Promoting cached build outputs as if they were tested release artifacts.",
      "Reporting cancelled matrix variants as passing."
    ],
    "takeaways": [
      "Cache reusable work and identify release artifacts separately.",
      "Optimize elapsed time while preserving declared coverage."
    ],
    "practice": [
      [
        "What is a dependency cache for?",
        "Reusing downloads or computation",
        "Recording final deployment approval",
        "Proving the current commit passed",
        "Replacing the dependency lockfile",
        "Caches optimize work rather than establish candidate correctness."
      ],
      [
        "What is an artifact for?",
        "Preserving explicit job outputs",
        "Granting permanent cloud access",
        "Selecting event token permissions",
        "Starting every matrix variant",
        "Artifacts carry deliberately produced outputs for later use."
      ],
      [
        "What belongs in a dependency cache key?",
        "Runtime and dependency inputs",
        "Only the developer display name",
        "Only the workflow badge color",
        "Only the current minute number",
        "Keys should distinguish environments and dependency states that affect reuse."
      ],
      [
        "What does a test matrix expand?",
        "Supported configuration variants",
        "Only one default branch name",
        "Only the artifact\u2019s compression",
        "Only the runner\u2019s log timestamps",
        "A matrix creates variants from supported dimensions."
      ],
      [
        "What does matrix cancellation prove about an unrun variant?",
        "It has no passing test evidence",
        "It passed every required assertion",
        "It uses the failed variant\u2019s result",
        "It needs no supported dependencies",
        "Cancelled or unrun work cannot count as successful coverage."
      ],
      [
        "How should a pipeline handle cache misses?",
        "Build correctly on cache misses",
        "Skip dependency installation entirely",
        "Reuse any unrelated output silently",
        "Treat misses as production approval",
        "The cache is an optimization rather than an undeclared dependency."
      ],
      [
        "Which input helps avoid sharing incompatible Python package caches?",
        "The Python runtime version",
        "Only the workflow title text",
        "Only the commit author avatar",
        "Only the job display sequence",
        "Runtime versions can change package compatibility and belong in cache design."
      ],
      [
        "A matrix tests two Python versions on two operating systems. How many combinations exist before exclusions?",
        "Four combinations",
        "Two combinations",
        "Six combinations",
        "Eight combinations",
        "The Cartesian product contains two times two configurations."
      ],
      [
        "A cache restore fails but locked dependencies remain available. What should happen?",
        "Continue with declared installation",
        "Accept an untested prior artifact",
        "Skip dependency integrity checking",
        "Use a different branch\u2019s pass status",
        "Cache failure should affect performance rather than declared build correctness."
      ]
    ],
    "final": [
      [
        "A key omits a lockfile change and restores old downloads. What is still required?",
        "Reconcile the declared current dependencies",
        "Assume restored data proves correctness",
        "Skip all package integrity checks",
        "Promote the cache as release output",
        "Restored material must be validated against current inputs."
      ],
      [
        "A team calls a cached binary the tested artifact without recording its origin. What is missing?",
        "Artifact-to-candidate linkage",
        "A shorter cache key prefix",
        "A larger storage retention limit",
        "An extra matrix display label",
        "A cache alone does not bind output to the current tested revision."
      ],
      [
        "Parallel integration tests overwhelm a shared database. What should be adjusted?",
        "Shared-resource concurrency limits",
        "Only the cache compression level",
        "Only workflow filename length",
        "Only the image tag\u2019s spelling",
        "Parallel jobs can compete for external state and capacity."
      ],
      [
        "A matrix fails fast after one OS fails. How should cancelled OS variants be reported?",
        "Not verified in that execution",
        "Passed because they were not red",
        "Equivalent to the successful OS",
        "Unsupported without further review",
        "Cancellation removes evidence for remaining variants."
      ],
      [
        "A cache contains a deployment credential. What needs correction?",
        "Remove secrets and review cache exposure",
        "Increase cache retention indefinitely",
        "Use a broader public restore prefix",
        "Rename the credential file only",
        "Cache access and retention can leak sensitive material."
      ],
      [
        "A job\u2019s setup dominates runtime. What should optimization measure?",
        "Setup costs and safe reuse options",
        "Only the final test count",
        "Only the pipeline\u2019s display title",
        "Only the success badge color",
        "Break down elapsed time before choosing a performance change."
      ],
      [
        "Two truly independent test jobs run sequentially. What can reduce elapsed time?",
        "Bounded independent parallel work",
        "Delete one of the test suites",
        "Treat a cache hit as a test pass",
        "Remove dependency lock verification",
        "Parallelism can reduce wall time while retaining both suites."
      ],
      [
        "A broad restore prefix recovers an older package cache. What assumption is unsafe?",
        "That restored packages match current inputs",
        "That reuse may save downloads",
        "That the package manager may reconcile",
        "That exact keys improve specificity",
        "A fallback cache is a hint, not proof of current dependency state."
      ],
      [
        "A release job needs an exact tested binary. What should it consume?",
        "The identified output artifact",
        "An arbitrary matching cache entry",
        "A locally rebuilt untracked binary",
        "Only the test job\u2019s log summary",
        "Artifact identity must connect testing to deployment."
      ],
      [
        "Elapsed time drops while test coverage is halved. What should the report say?",
        "The speedup changed validation scope",
        "The pipeline is strictly better",
        "The cache guaranteed missing coverage",
        "All prior evidence still applies",
        "Performance claims must disclose changed verification coverage."
      ]
    ]
  },
  {
    "comp": "m2.c1",
    "title": "Gate environments and grant short-lived release authority",
    "intro": "The same job tests a fork, packages a release and deploys production using a shared administrator token. Separate environment approval from credential delivery and artifact trust.",
    "headings": [
      "Reason about the mechanism",
      "Apply the decision and inspect evidence",
      "Bound the verification"
    ],
    "sections": [
      [
        "Continuous delivery keeps a validated change ready for release; continuous deployment automatically releases changes that satisfy the configured process. A production approval can be a deliberate delivery gate. Approval must concern an identified candidate artifact and does not replace testing or change review.",
        "GitHub Actions environments associate deployment jobs with environment configuration and available protection rules. A job can declare environment: production. Required reviewers, branch restrictions and environment secret access depend on repository settings, plan and visibility support. A YAML environment name alone does not prove protections are configured."
      ],
      [
        "Secrets should be scoped to the jobs and environments that need them. Masking helps with some log disclosures but is not a complete data-loss prevention mechanism, especially for transformed values. Never print secrets to debug a failing deployment. Rotate exposed credentials and review logs and artifacts for propagation.",
        "Where supported, OpenID Connect lets a job request short-lived cloud credentials through a configured provider trust relationship. id-token: write allows requesting an OIDC token; it does not grant arbitrary cloud access by itself. Restrict provider claims such as repository, branch or protected environment and grant the resulting role only required permissions."
      ],
      [
        "This local approval model neither creates a GitHub environment nor requests credentials. Actual protection availability, reviewer settings and provider trust must be verified separately."
      ]
    ],
    "code": "import json\nr=json.loads('{\"tested\":true,\"approved\":false,\"environment\":\"production\",\"artifact\":\"release-42\"}')\nprint(\"deploy\" if r[\"tested\"] and r[\"approved\"] else \"hold\")\nprint(r[\"artifact\"])",
    "expect": "hold\nrelease-42",
    "problem": "Evaluate the local fixture for gate environments and grant short-lived release authority.",
    "steps": [
      "Read the declared inputs and assumptions.",
      "Run the isolated Python fixture and compare its exact output.",
      "Explain which production evidence remains necessary."
    ],
    "limit": "This local approval model neither creates a GitHub environment nor requests credentials. Actual protection availability, reviewer settings and provider trust must be verified separately.",
    "mistakes": [
      "Assuming naming production automatically configures approvals.",
      "Assuming id-token: write directly grants cloud administrator access."
    ],
    "takeaways": [
      "Approve an identified tested artifact.",
      "Scope environment access and provider trust independently."
    ],
    "practice": [
      [
        "What does continuous delivery emphasize?",
        "A release-ready validated change",
        "Every commit deployed without gates",
        "Only manual build instructions",
        "Only yearly source backups",
        "Delivery readiness can include a deliberate release approval."
      ],
      [
        "What does environment: production establish alone?",
        "Association with an environment",
        "All required reviewer settings",
        "Universal branch restrictions",
        "An automatic cloud admin role",
        "Actual protections require supported configured environment settings."
      ],
      [
        "What should approval identify?",
        "The release candidate artifact",
        "Only the workflow\u2019s display title",
        "Only the approving user\u2019s avatar",
        "Only the repository creation date",
        "Approval needs a specific candidate and relevant evidence."
      ],
      [
        "What is a limit of log masking?",
        "It cannot prevent every disclosure",
        "It encrypts all output artifacts",
        "It proves transformed values safe",
        "It removes all source secrets",
        "Masking is one defense and does not protect every derived representation."
      ],
      [
        "What does id-token: write permit?",
        "Requesting an OIDC token",
        "Universal cloud administration",
        "Automatic artifact publication",
        "All repository write operations",
        "Cloud authority additionally depends on provider trust and permissions."
      ],
      [
        "What should provider trust restrict?",
        "Relevant job identity claims",
        "Only the log retention period",
        "Only the artifact filename length",
        "Only the runner display color",
        "Trust must distinguish authorized repositories and release contexts."
      ],
      [
        "Which record should identify the artifact approved for production?",
        "The approved content digest",
        "Only the current latest alias",
        "Only the workflow display name",
        "Only the reviewer account avatar",
        "An immutable content identifier links the approval decision to a specific candidate."
      ],
      [
        "A provider role permits only the deployment bucket. What principle does this implement?",
        "Resource-scoped least privilege",
        "Automatic package authenticity",
        "Universal environment protection",
        "Guaranteed secret log redaction",
        "Authority should be limited to required actions on required resources."
      ],
      [
        "Where must environment reviewer rules be configured?",
        "Environment protection settings",
        "Only the environment name in YAML",
        "Only the workflow filename prefix",
        "Only the job\u2019s public display title",
        "Naming an environment does not automatically install its protection rules."
      ],
      [
        "An OIDC token is issued but the provider rejects its subject claim. What should be reviewed?",
        "The provider identity trust rule",
        "Only the build cache key prefix",
        "Only the artifact archive format",
        "Only the runner log retention",
        "Cloud providers must explicitly trust the presented job identity claims before issuing authorized credentials."
      ]
    ],
    "final": [
      [
        "A job declares production but no reviewers are configured. What should be concluded?",
        "Approval enforcement is unproven",
        "The YAML creates two reviewers",
        "Every deployment is blocked forever",
        "The job automatically becomes read-only",
        "Environment association is not equivalent to configured protection."
      ],
      [
        "A test job for untrusted changes can read release secrets. What should be changed?",
        "Separate scopes and privileged jobs",
        "Mask the secrets and keep access",
        "Rename the environment to secure",
        "Give the test job a longer timeout",
        "Preventing unnecessary access is stronger than relying on log handling."
      ],
      [
        "A short-lived role trusts any repository in an organization. What should review assess?",
        "Whether trust is narrower than necessary",
        "Only the token expiration timestamp",
        "Only the workflow\u2019s display name",
        "Only the runner operating system",
        "Short duration does not compensate for overly broad identity acceptance."
      ],
      [
        "A reviewer approves release A but a job later selects mutable latest. What is the gap?",
        "Approval is not bound to deployed content",
        "The approval automatically tracks all tags",
        "Latest is immutable after approval",
        "The runner cannot pull tagged images",
        "The selected artifact must remain the approved candidate."
      ],
      [
        "A secret is base64-encoded then printed. What is unsafe to assume?",
        "That masking hides every transformation",
        "That base64 is reversible encoding",
        "That logs need controlled access",
        "That exposed credentials need rotation",
        "Derived values may escape masking and still reveal credentials."
      ],
      [
        "An OIDC request succeeds but cloud API access is denied. What should be checked?",
        "Cloud trust and effective role",
        "Only the workflow log color",
        "Only the artifact upload filename",
        "Only the branch display spelling",
        "Token issuance and cloud authorization are distinct steps."
      ],
      [
        "A private repository plan lacks a desired environment rule. What should the team do?",
        "Verify gate availability",
        "Claim the YAML enforces the unavailable rule",
        "Ignore approval requirements silently",
        "Expose the repository\u2019s secrets publicly",
        "Protection capabilities must be checked for the actual repository context."
      ],
      [
        "A credential appears in an artifact despite masked console output. What does this show?",
        "Masking does not secure artifact content",
        "All artifacts are encrypted from reviewers",
        "The credential has already rotated",
        "Console redaction validates all outputs",
        "Secret handling must cover files and artifacts as well as logs."
      ],
      [
        "A deployment role can delete unrelated accounts. What is the corrective principle?",
        "Narrow effective authority",
        "Only shorten the workflow title",
        "Only increase approval timeout",
        "Only change the artifact tag",
        "Least privilege concerns the role\u2019s effective authority."
      ],
      [
        "A manual approval is added without validating tests. What is still required?",
        "Technical evidence for the candidate",
        "Only a second copy of the same approval",
        "Only a longer release description",
        "Only a successful repository login",
        "Approval and automated correctness evidence address different requirements."
      ]
    ]
  },
  {
    "comp": "m2.c2",
    "title": "Choose blue-green deployment with reversible traffic changes",
    "intro": "A checkout service must switch versions quickly while preserving a known recovery target. Decide what blue-green deployment actually isolates and what it leaves shared.",
    "headings": [
      "Reason about the mechanism",
      "Apply the decision and inspect evidence",
      "Bound the verification"
    ],
    "sections": [
      [
        "Blue-green deployment maintains two application environments, one serving current traffic while the other receives the candidate. Validate the candidate with appropriate checks before switching routing. The environments can share external systems, so two application pools do not imply isolated databases or independent side effects.",
        "A traffic switch can provide a fast recovery path if the previous environment remains usable. Keep the previous version available for an intentional observation window. Switching back does not reverse payments, messages or database writes already performed by the new version."
      ],
      [
        "Database compatibility matters across the switch. An expand-and-contract migration can first add compatible schema, deploy code that tolerates both forms, backfill with verification, and remove old schema only after old consumers are retired. Destructive schema changes can make the prior application an invalid recovery target.",
        "Compare capacity cost, state placement, connection draining and routing propagation. Some existing connections continue to the old pool after a routing change. Establish success signals and a rollback decision owner before switching; a route update alone is not evidence of a successful user experience."
      ],
      [
        "The dictionary models a routing decision only. It does not create duplicate infrastructure, drain connections, migrate schemas or reverse business side effects."
      ]
    ],
    "code": "import json\ns=json.loads('{\"active\":\"blue\",\"candidate\":\"green\",\"healthy\":true,\"approved\":true}')\nold=s[\"active\"]\nif s[\"healthy\"] and s[\"approved\"]: s[\"active\"]=s[\"candidate\"]\nprint(old+\" -> \"+s[\"active\"])\nprint(\"retain\",old)",
    "expect": "blue -> green\nretain blue",
    "problem": "Evaluate the local fixture for choose blue-green deployment with reversible traffic changes.",
    "steps": [
      "Read the declared inputs and assumptions.",
      "Run the isolated Python fixture and compare its exact output.",
      "Explain which production evidence remains necessary."
    ],
    "limit": "The dictionary models a routing decision only. It does not create duplicate infrastructure, drain connections, migrate schemas or reverse business side effects.",
    "mistakes": [
      "Treating traffic rollback as database rollback.",
      "Deleting the previous environment before the observation window ends."
    ],
    "takeaways": [
      "Keep a valid recovery target.",
      "Plan cross-version data compatibility and side effects."
    ],
    "practice": [
      [
        "What characterizes blue-green deployment?",
        "Two switchable application pools",
        "One instance patched in place only",
        "A mandatory per-user experiment",
        "An automatic destructive schema reset",
        "The candidate can be prepared separately before traffic changes."
      ],
      [
        "What should happen before traffic switches?",
        "Validate candidate serving behavior",
        "Delete the previous version immediately",
        "Remove every backward-compatible field",
        "Assume a successful build is sufficient",
        "Candidate serving capability must be established before exposure."
      ],
      [
        "What does a traffic switch back not undo?",
        "Completed business transactions",
        "The chosen route destination",
        "The active application pool",
        "A configurable routing reference",
        "Routing cannot reverse writes or external actions already completed."
      ],
      [
        "Why retain the previous environment?",
        "Preserve a usable recovery target",
        "Guarantee no database compatibility risk",
        "Automatically reverse all transactions",
        "Eliminate capacity planning",
        "Retention supports recovery only while the prior version remains usable."
      ],
      [
        "What is expand-and-contract intended to support?",
        "Compatible schema transitions",
        "Immediate deletion of every old field",
        "Automatic replay of failed payments",
        "Permanent duplication of all records",
        "Staged schema evolution reduces incompatibility during transitions."
      ],
      [
        "What can connection draining address?",
        "In-flight request handling",
        "Missing source dependency locks",
        "Unreviewed third-party actions",
        "Registry credential rotation",
        "Routing changes may not instantly move established connections."
      ]
    ],
    "final": [
      [
        "A new version writes data the old version cannot read. What weakens rollback?",
        "The previous app is no longer compatible",
        "The route change is necessarily slow",
        "The image digest became mutable",
        "The deployment has too many labels",
        "A recovery target must be compatible with current shared state."
      ],
      [
        "A team deletes blue immediately after switching to green. What is lost?",
        "An immediately usable prior pool",
        "Every current database record",
        "The ability to build any image",
        "The ability to record metrics",
        "Keeping the prior environment supports quick recovery."
      ],
      [
        "Both pools use the same database. What is false to assume?",
        "That their data side effects are isolated",
        "That traffic can target one pool",
        "That application versions can differ",
        "That schema compatibility matters",
        "Application environment separation need not isolate shared data."
      ],
      [
        "A candidate passes a health probe but checkout errors rise after switching. What should drive action?",
        "User impact and abort rules",
        "Only the original probe result",
        "Only the pool color\u2019s label",
        "Only the compressed image size",
        "Readiness checks do not capture all real traffic behavior."
      ],
      [
        "A migration drops a column still used by blue. What safer sequence fits?",
        "Expand, transition and retire old usage",
        "Drop it before checking old readers",
        "Switch routes and ignore data behavior",
        "Restore only the application image later",
        "Destructive contraction must wait until old consumers no longer require it."
      ],
      [
        "Traffic flips to green but old long-running connections remain on blue. What should be planned?",
        "Drain and lifecycle handling",
        "An immediate database deletion",
        "A new cache key for every socket",
        "An automatic source branch merge",
        "Existing sessions need explicit transition behavior."
      ],
      [
        "A business side effect was duplicated during the candidate window. What fixes the record?",
        "Business reconciliation",
        "Only switching traffic back to blue",
        "Only changing the image tag to stable",
        "Only restarting the candidate pool",
        "Routing rollback cannot undo completed external actions."
      ],
      [
        "A small service cannot afford two full pools. What should strategy selection compare?",
        "Capacity and recovery needs",
        "Only the names blue and green",
        "Only the workflow file extension",
        "Only the number of source commits",
        "Deployment choices involve available capacity and operational objectives."
      ],
      [
        "A team approves switching without assigning rollback ownership. What is missing?",
        "Rollback decision authority",
        "A shorter environment name",
        "A different archive compression",
        "An extra optional status badge",
        "Incident response needs clear criteria and authority to act."
      ],
      [
        "A previous environment is healthy but its required credentials expired. What is the issue?",
        "It may not be a usable recovery target",
        "Health automatically renews credentials",
        "Old credentials are never required",
        "Traffic switching recreates all secrets",
        "Recovery readiness includes dependencies and authority, not just process status."
      ]
    ]
  },
  {
    "comp": "m2.c2",
    "title": "Compare canary exposure with rolling replacement",
    "intro": "A new API version behaves well on a small slice of traffic but fails for one high-value customer segment. Define exposure and observation before choosing a rollout strategy.",
    "headings": [
      "Reason about the mechanism",
      "Apply the decision and inspect evidence",
      "Bound the verification"
    ],
    "sections": [
      [
        "A canary introduces a candidate to a limited portion of users or traffic while comparing behavior with a baseline. Choose representative segments, measurable success criteria and a decision window. A small sample can miss rare failures; absence of incidents is not strong evidence when little relevant traffic was observed.",
        "A rolling deployment gradually replaces instances, often keeping old and new versions active together. It usually limits extra capacity compared with maintaining two complete environments, but version skew and available capacity must be planned. Client protocols, shared data and background workers must tolerate the overlap."
      ],
      [
        "Canary and rolling describe different dimensions and can be combined. A rollout controller might replace a subset of instances and route a small traffic percentage to them. Instance count and traffic share are not necessarily equal because requests and workloads can be distributed unevenly.",
        "Define abort signals using error rates, latency, saturation and critical business outcomes, with attention to sample size and segment differences. Promotion and rollback should reference the same artifact identity and preserve audit evidence. A successful deployment command does not prove a successful rollout."
      ],
      [
        "The synthetic threshold illustrates rate comparison only. It is not a statistical significance test, representative canary study or live traffic-control mechanism."
      ]
    ],
    "code": "import json\nx=json.loads('{\"baseline_errors\":4,\"baseline_requests\":1000,\"canary_errors\":8,\"canary_requests\":200}')\nb=x[\"baseline_errors\"]/x[\"baseline_requests\"]\nc=x[\"canary_errors\"]/x[\"canary_requests\"]\nprint(f\"{b:.3f} {c:.3f}\")\nprint(\"hold\" if c > b*2 else \"review\")",
    "expect": "0.004 0.040\nhold",
    "problem": "Evaluate the local fixture for compare canary exposure with rolling replacement.",
    "steps": [
      "Read the declared inputs and assumptions.",
      "Run the isolated Python fixture and compare its exact output.",
      "Explain which production evidence remains necessary."
    ],
    "limit": "The synthetic threshold illustrates rate comparison only. It is not a statistical significance test, representative canary study or live traffic-control mechanism.",
    "mistakes": [
      "Equating instance percentage with traffic percentage.",
      "Calling an unrepresentative tiny sample proof of safety."
    ],
    "takeaways": [
      "Compare candidate behavior with a suitable baseline.",
      "Plan mixed-version operation and abort criteria."
    ],
    "practice": [
      [
        "What is a canary rollout?",
        "Observed limited traffic exposure",
        "Immediate replacement of all users",
        "An automatic database restore",
        "A mandatory duplicate full environment",
        "Canaries reduce initial exposure while collecting evidence."
      ],
      [
        "What is a rolling deployment?",
        "Gradual instance replacement",
        "Only a source branch rename",
        "Only a one-time DNS export",
        "Immediate removal of all instances",
        "Rolling replacement creates a period of version overlap."
      ],
      [
        "What must mixed-version operation support?",
        "Cross-version interface compatibility",
        "Identical process start timestamps",
        "Only matching container display names",
        "Only equal image download sizes",
        "Old and new components may interact during rollout."
      ],
      [
        "Why compare rates rather than raw errors alone?",
        "Traffic volumes can differ",
        "Rates remove every statistical uncertainty",
        "Raw counts never matter at all",
        "All users send equal request counts",
        "Different exposure denominators affect error interpretation."
      ],
      [
        "Does ten percent of instances guarantee ten percent of traffic?",
        "No; distribution may be uneven",
        "Yes for every routing system",
        "Yes if both images have tags",
        "No; instances cannot receive traffic",
        "Instance share and traffic share are separate measures."
      ],
      [
        "What should an abort policy contain?",
        "Criteria and decision ownership",
        "Only a successful deployment command",
        "Only a colorful release dashboard",
        "Only a list of image aliases",
        "Operational criteria must support a concrete stop or rollback decision."
      ]
    ],
    "final": [
      [
        "A canary sees no errors after two requests. What is the evidence limit?",
        "Insufficient sample evidence",
        "Every rare failure has been excluded",
        "All customer segments are represented",
        "The baseline is no longer relevant",
        "Tiny samples provide weak information about low-frequency failures."
      ],
      [
        "A rolling upgrade serves old and new API versions. What should be tested?",
        "Version-skew compatibility",
        "Only the final version in isolation",
        "Only the source checkout speed",
        "Only artifact compression behavior",
        "Mixed versions can expose compatibility problems absent in single-version tests."
      ],
      [
        "The candidate has eight errors in 200 requests; baseline has four in 1000. What is correct?",
        "A larger candidate error rate",
        "The baseline error rate is higher",
        "The rates are equal",
        "Raw counts alone prove equal risk",
        "The rates are 4 percent and 0.4 percent respectively."
      ],
      [
        "A high-value segment is absent from canary traffic. What should promotion review consider?",
        "Unmeasured segment-specific risk",
        "Only the aggregate zero-error count",
        "Only the canary instance name",
        "Only the dashboard color scheme",
        "Representative coverage matters when outcomes vary by segment."
      ],
      [
        "A controller rolls a subset and routes five percent to it. What is this?",
        "Combined rollout controls",
        "An impossible deployment configuration",
        "An automatic full blue-green switch",
        "A database-only migration strategy",
        "Instance replacement and traffic exposure can be coordinated."
      ],
      [
        "A rollout exhausts capacity while removing old instances. What was insufficiently planned?",
        "Availability during replacement",
        "Only the artifact naming convention",
        "Only the source branch description",
        "Only the CI log retention period",
        "Rolling strategies need limits that preserve serving capacity."
      ],
      [
        "The deployment CLI exits successfully but latency doubles. What should decide promotion?",
        "Operational release criteria",
        "Only the command\u2019s zero exit code",
        "Only the artifact upload timestamp",
        "Only the workflow\u2019s green badge",
        "Infrastructure command success is not equivalent to user-facing success."
      ],
      [
        "The same candidate tag resolves to new content between rollout stages. What is endangered?",
        "Stable candidate content identity",
        "Only the service display label",
        "Only the matrix job ordering",
        "Only the source comment format",
        "Use immutable content identity to keep rollout stages tied to one candidate."
      ],
      [
        "A canary improves the average but harms one critical segment. What should the report include?",
        "Segment results and business impact",
        "Only the favorable overall average",
        "Only more decimal places globally",
        "Only the largest traffic count",
        "Aggregates can hide operationally important subgroup regressions."
      ],
      [
        "A threshold rule flags the synthetic candidate. What additional production work is needed?",
        "Representative evidence and justified criteria",
        "Treat the toy threshold as universal law",
        "Deploy every future candidate automatically",
        "Skip baseline collection permanently",
        "A simple model does not replace a real rollout evaluation design."
      ]
    ]
  },
  {
    "comp": "m3.c1",
    "title": "Investigate flaky tests without laundering failures",
    "intro": "A required integration test fails once and passes on rerun. The team wants to delete the red run. Preserve uncertainty and find the unstable condition.",
    "headings": [
      "Reason about the mechanism",
      "Apply the decision and inspect evidence",
      "Bound the verification"
    ],
    "sections": [
      [
        "A flaky test produces inconsistent outcomes without an intentional relevant product change. Causes include race conditions, shared state, wall-clock assumptions, order dependence, external dependencies and resource limits. A passing retry does not prove that the initial failure was harmless.",
        "Capture the failing seed, environment, test order, timestamps and sanitized logs before rerunning. Reproduce with isolated fixtures and controlled concurrency. Distinguish product race conditions from test harness defects; both can invalidate confidence, but they require different fixes."
      ],
      [
        "Use bounded diagnostic retries with explicit reporting. An unstable test can be quarantined only through an accountable process recording the reason, owner, expiry and replacement coverage. A quarantine is missing coverage and review work, not a passing test. Critical behavior should retain a reliable gate.",
        "Track failure frequency and affected environments. Fix the root cause rather than increasing timeouts indiscriminately or changing continue-on-error to hide red jobs. If timeout growth is justified by measured service behavior, document the expectation and ensure that genuine hangs remain bounded."
      ],
      [
        "The fixture classifies declared observations only. It does not reproduce a race, diagnose a test framework or prove that repeated passing runs establish product correctness."
      ]
    ],
    "code": "import json\nr=json.loads('[\"failure\",\"success\",\"success\"]')\nprint(\"unstable\" if len(set(r)) > 1 else \"consistent\")\nprint(\"first result:\",r[0])",
    "expect": "unstable\nfirst result: failure",
    "problem": "Evaluate the local fixture for investigate flaky tests without laundering failures.",
    "steps": [
      "Read the declared inputs and assumptions.",
      "Run the isolated Python fixture and compare its exact output.",
      "Explain which production evidence remains necessary."
    ],
    "limit": "The fixture classifies declared observations only. It does not reproduce a race, diagnose a test framework or prove that repeated passing runs establish product correctness.",
    "mistakes": [
      "Erasing a failure because a retry passes.",
      "Using quarantine as an undocumented permanent exemption."
    ],
    "takeaways": [
      "Preserve initial failure evidence.",
      "Give unstable coverage an owner and a repair path."
    ],
    "practice": [
      [
        "What describes a flaky test?",
        "Unstable repeated outcomes",
        "Every test that fails on a real regression",
        "Every slow test in a matrix",
        "Every test with an assertion",
        "Flakiness concerns unstable outcomes, not merely any failure."
      ],
      [
        "What is useful failure evidence?",
        "Reproduction conditions and logs",
        "Only the final green badge",
        "Only the author\u2019s display name",
        "Only the image\u2019s tag spelling",
        "Reproduction needs the conditions associated with failure."
      ],
      [
        "What does a successful retry prove?",
        "Only that retry succeeded",
        "The first failure was harmless",
        "The product cannot contain a race",
        "Every environment now passes",
        "A later success does not explain an earlier failure."
      ],
      [
        "What should quarantine record?",
        "Accountable coverage-gap record",
        "Only a hidden continue-on-error flag",
        "Only a deleted failure log",
        "Only a permanent green status",
        "Quarantine needs accountability and visibility into missing assurance."
      ],
      [
        "What is a risk of unlimited retries?",
        "Concealed failures and wasted work",
        "Automatically repairing every race",
        "Guaranteeing deterministic coverage",
        "Removing external dependencies",
        "Retries can mask meaningful failures and delay feedback."
      ],
      [
        "What should govern timeout changes?",
        "Measured operation requirements",
        "Only the desire for a green badge",
        "Only the artifact filename",
        "Only a developer\u2019s preferred number",
        "Timeouts should reflect justified expectations and remain bounded."
      ]
    ],
    "final": [
      [
        "An integration test fails only with parallel workers. What should be investigated?",
        "State interference or races",
        "Only the workflow badge color",
        "Only the branch description",
        "Only the artifact archive extension",
        "Concurrency-sensitive behavior often indicates interference or races."
      ],
      [
        "A team deletes the first failure after a passing retry. What is lost?",
        "The initial diagnostic evidence",
        "Proof that every product path passes",
        "A valid database backup copy",
        "An automatic branch protection setting",
        "Initial failure evidence is part of a trustworthy diagnosis."
      ],
      [
        "A quarantined payment test has no replacement coverage. How should release risk be described?",
        "Critical behavior has reduced assurance",
        "Payment behavior is verified by quarantine",
        "The missing test counts as a pass",
        "The artifact digest repairs coverage",
        "Quarantine removes gating evidence unless reliable coverage replaces it."
      ],
      [
        "A test depends on exact wall-clock timing and fails under load. What is a useful design change?",
        "Control time or synchronize on behavior",
        "Increase timeouts forever without diagnosis",
        "Delete every timing assertion blindly",
        "Rely only on a faster paid runner",
        "Deterministic clocks or event synchronization can remove fragile timing assumptions."
      ],
      [
        "A failure seed is not recorded. What becomes harder?",
        "Reproducing the failing case",
        "Renaming the workflow job",
        "Changing artifact retention",
        "Publishing a different image tag",
        "Seeded randomized tests need their failing seed preserved."
      ],
      [
        "A root cause is a real application race exposed by the test. What should be fixed?",
        "The product concurrency defect",
        "Only the test\u2019s failure reporting",
        "Only the build badge location",
        "Only the release description",
        "A flaky observation can reveal a genuine product defect."
      ],
      [
        "A team enables continue-on-error on all required tests. What assurance changes?",
        "A weakened failure gate",
        "The tests become deterministic",
        "All product races are repaired",
        "Every failed assertion is retried",
        "Error-tolerant status handling can weaken the intended gate."
      ],
      [
        "A temporary quarantine has an expiry but no owner. What is missing?",
        "A responsible remediation owner",
        "An additional image alias",
        "A different workflow trigger color",
        "A shorter artifact retention period",
        "Someone must own restoring reliable coverage."
      ],
      [
        "Retries reduce visible failures but total retry counts rise. What metric should remain visible?",
        "Retry-inclusive failure rates",
        "Only final successful run counts",
        "Only the latest workflow badge",
        "Only average artifact sizes",
        "Reporting only final outcomes hides deteriorating reliability."
      ],
      [
        "An external dependency causes intermittent failures. What should diagnosis separate?",
        "The sources of instability",
        "Only slow tests from fast tests",
        "Only test names from source names",
        "Only failed jobs from cancelled jobs",
        "Different sources of instability need different remediation and coverage decisions."
      ]
    ]
  },
  {
    "comp": "m3.c1",
    "title": "Prepare rollback and forward recovery for failed releases",
    "intro": "A production release fails after a schema migration. Redeploying the old image may be fast but incompatible with data already changed. Plan recovery before the failure.",
    "headings": [
      "Reason about the mechanism",
      "Apply the decision and inspect evidence",
      "Bound the verification"
    ],
    "sections": [
      [
        "Rollback restores a previous application or configuration version; forward recovery deploys a corrective change compatible with the current state. Choose based on evidence about data, protocol and external side effects, not merely which button is easiest to press. Some incidents require containment before either release action.",
        "Keep prior artifacts available by exact digest with the configuration and dependency information necessary to run them. A prior image that depends on removed secrets, incompatible schema or retired services is not a ready recovery target. Exercise recovery in a representative safe environment."
      ],
      [
        "Database backups and application rollback solve different problems. Restoring a backup can lose newer legitimate writes and may create inconsistencies with external systems. Use documented recovery-point and recovery-time requirements and coordinate application compatibility with data recovery or compensation.",
        "After recovery, verify user-facing behavior, data integrity and security controls. Record the selected artifact, action owner, timestamps and observed outcome. A successful rollback command does not establish that service quality recovered; incident review should capture both what worked and what must change in the release process."
      ],
      [
        "This simplified readiness decision does not mutate application state, perform backups, select a universally safe incident action or quantify real recovery objectives."
      ]
    ],
    "code": "import json\nr=json.loads('{\"previous_artifact_available\":true,\"schema_compatible\":false,\"side_effects_reversible\":false}')\nready=r[\"previous_artifact_available\"] and r[\"schema_compatible\"]\nprint(\"rollback candidate\" if ready else \"assess forward recovery\")",
    "expect": "assess forward recovery",
    "problem": "Evaluate the local fixture for prepare rollback and forward recovery for failed releases.",
    "steps": [
      "Read the declared inputs and assumptions.",
      "Run the isolated Python fixture and compare its exact output.",
      "Explain which production evidence remains necessary."
    ],
    "limit": "This simplified readiness decision does not mutate application state, perform backups, select a universally safe incident action or quantify real recovery objectives.",
    "mistakes": [
      "Treating an old image as a guaranteed usable rollback.",
      "Restoring a database without considering lost writes and external effects."
    ],
    "takeaways": [
      "Validate recovery compatibility before incidents.",
      "Verify service and data outcomes after the recovery action."
    ],
    "practice": [
      [
        "What is forward recovery?",
        "A state-compatible corrective release",
        "Always restoring yesterday\u2019s backup",
        "Only redeploying the previous image",
        "Only deleting current application data",
        "A forward fix can repair behavior while respecting already changed state."
      ],
      [
        "What identifies an exact previous artifact?",
        "Its retained content digest",
        "Only a movable stable tag",
        "Only yesterday\u2019s branch name",
        "Only a developer\u2019s local path",
        "Recovery must identify and retain the required content."
      ],
      [
        "What can make an old image unusable?",
        "State incompatibility",
        "A short human-readable image tag",
        "An old source comment timestamp",
        "A different workflow display name",
        "Old code may no longer work with present external state."
      ],
      [
        "What does a recovery-point objective concern?",
        "Tolerable data loss",
        "Only image download speed",
        "Only workflow job count",
        "Only process memory limits",
        "RPO expresses acceptable loss relative to a recovery point."
      ],
      [
        "What does a recovery-time objective concern?",
        "Acceptable recovery duration",
        "Only source commit frequency",
        "Only artifact archive size",
        "Only vulnerability scan count",
        "RTO describes the intended recovery duration."
      ],
      [
        "What should follow a recovery command?",
        "Verify recovery outcomes",
        "Automatic incident closure",
        "Deletion of every failure log",
        "Assumption of complete recovery",
        "Command completion alone does not establish restored user experience."
      ]
    ],
    "final": [
      [
        "A migration removed a field required by the previous application. What should rollback planning recognize?",
        "The old artifact may be incompatible",
        "Digest selection reverses the schema",
        "A traffic switch restores the field",
        "Old images never access databases",
        "Application rollback does not reverse destructive data changes."
      ],
      [
        "A database restore discards two hours of legitimate orders. Which requirement was relevant?",
        "Data-loss tolerance requirements",
        "Only the image cache hit rate",
        "Only the workflow trigger name",
        "Only the deployment pool color",
        "Data restoration must be judged against loss tolerance and reconciliation needs."
      ],
      [
        "The old image is retained but its service credential is revoked. What is missing?",
        "A working recovery configuration",
        "An additional registry display tag",
        "A larger container writable layer",
        "An extra optional pipeline badge",
        "A usable target needs authority and dependencies as well as image bytes."
      ],
      [
        "A release triggered duplicate external payments. What can application rollback alone not do?",
        "Undo prior external transactions",
        "Change the active application version",
        "Select a prior container image",
        "Stop new candidate traffic",
        "Completed business effects need reconciliation or compensation."
      ],
      [
        "A known compatible prior artifact is available and impact is growing. What supports action?",
        "A practiced recovery plan",
        "Only a green deployment command",
        "Only a recent source branch name",
        "Only a larger dependency cache",
        "Prepared criteria and verified targets enable timely response."
      ],
      [
        "A team never practices restoring its backups. What remains uncertain?",
        "Measured recovery ability",
        "Whether a backup filename exists",
        "Whether a volume was declared",
        "Whether a container can be renamed",
        "Recovery needs exercised outcomes rather than mere configuration intent."
      ],
      [
        "After rollback, HTTP health checks pass but orders still fail. What should be verified?",
        "Critical business flows and dependencies",
        "Only the rollback command exit code",
        "Only the prior image creation date",
        "Only the artifact upload count",
        "A narrow health probe can miss the affected user workflow."
      ],
      [
        "A repair release is compatible with current data while the old version is not. What strategy may fit?",
        "A validated forward fix",
        "Blindly restoring the old image",
        "Deleting current data without review",
        "Assuming every rollback is safer",
        "Recovery strategy depends on compatibility and consequences."
      ],
      [
        "An incident log records actions but not deployed digests. What audit gap remains?",
        "Recovery artifact identity",
        "The person\u2019s public avatar image",
        "The workflow badge\u2019s pixel size",
        "The source editor\u2019s theme choice",
        "Artifact identity is necessary to reconstruct what actually ran."
      ],
      [
        "A team reports recovery because the deploy command returned zero. What evidence is still needed?",
        "Observed restored service outcomes",
        "Only a second command invocation",
        "Only a renamed incident document",
        "Only a cached dependency restore",
        "Operational recovery must be measured beyond tool success."
      ]
    ]
  },
  {
    "comp": "m3.c1",
    "title": "Make release evidence, concurrency and failure paths reviewable",
    "intro": "Two production workflows race: a slower old candidate finishes after a newer one and overwrites it. Reliability includes coordination and trustworthy records, not only passing tests.",
    "headings": [
      "Reason about the mechanism",
      "Apply the decision and inspect evidence",
      "Bound the verification"
    ],
    "sections": [
      [
        "Use an explicit deployment concurrency design so candidates cannot unintentionally overtake each other in one environment. GitHub Actions concurrency groups limit overlapping runs or jobs in the same group; cancel-in-progress changes whether a running member is cancelled. Do not assume arbitrary ordering guarantees or that cancellation reverses work already performed.",
        "Cancellation is a state transition that needs a safe failure path. A deployment might be cancelled after partial side effects, so use idempotent steps, clear state recording and an operational recovery procedure. Preventing overlap does not make a multi-step deployment transaction atomic."
      ],
      [
        "Preserve evidence tying source revision to built artifact, tests, approvals, environment and deployment outcome. Sanitize logs and apply access and retention appropriate to sensitive records. Diagnostic collection using conditions such as always() can help after failures, but it should remain bounded and must not inadvertently run privileged release work.",
        "Reusable workflows and actions reduce duplicated pipeline logic, yet central changes can affect many repositories. Version and review shared definitions, validate input contracts and maintain explicit caller permissions. Reliability metrics should include failed and cancelled runs, recovery time and flaky behavior rather than reporting only successful releases."
      ],
      [
        "The generation rule is a local stale-candidate model, not GitHub concurrency scheduling. It does not cancel runs, enforce atomicity or undo partial deployment side effects."
      ]
    ],
    "code": "import json\nevents=json.loads('[{\"candidate\":\"old\",\"generation\":4},{\"candidate\":\"new\",\"generation\":5}]')\nexpected=max(x[\"generation\"] for x in events)\nfor x in events:\n print(x[\"candidate\"],\"eligible\" if x[\"generation\"] == expected else \"stale\")",
    "expect": "old stale\nnew eligible",
    "problem": "Evaluate the local fixture for make release evidence, concurrency and failure paths reviewable.",
    "steps": [
      "Read the declared inputs and assumptions.",
      "Run the isolated Python fixture and compare its exact output.",
      "Explain which production evidence remains necessary."
    ],
    "limit": "The generation rule is a local stale-candidate model, not GitHub concurrency scheduling. It does not cancel runs, enforce atomicity or undo partial deployment side effects.",
    "mistakes": [
      "Assuming cancellation reverses completed external work.",
      "Recording only successful runs and losing failure evidence."
    ],
    "takeaways": [
      "Coordinate environment writes and reject stale candidates.",
      "Preserve sanitized evidence through failure and recovery."
    ],
    "practice": [
      [
        "What can deployment concurrency groups limit?",
        "Overlap within a named group",
        "All writes by every external system",
        "Every source code race condition",
        "All database transaction conflicts",
        "Concurrency controls apply to their configured workflow scope."
      ],
      [
        "What does cancel-in-progress affect?",
        "Active group-member cancellation",
        "Automatic database rollback semantics",
        "Permanent artifact retention rules",
        "The application\u2019s authentication model",
        "Cancellation policy controls workflow execution, not reversal of side effects."
      ],
      [
        "What does cancellation fail to guarantee?",
        "Undoing completed side effects",
        "That a workflow state can change",
        "That remaining steps may not execute",
        "That a run can report cancellation",
        "Already performed actions can persist after workflow cancellation."
      ],
      [
        "What should release evidence link?",
        "Candidate-to-outcome traceability",
        "Only the workflow display title",
        "Only the artifact\u2019s file extension",
        "Only the repository account avatar",
        "Traceability joins the candidate, decisions and actual deployment result."
      ],
      [
        "Why sanitize diagnostic logs?",
        "Prevent sensitive data disclosure",
        "Guarantee no product defect exists",
        "Make every failed test pass",
        "Automatically approve deployment",
        "Useful diagnostics must not expose secrets or protected records."
      ],
      [
        "What risk accompanies shared workflow changes?",
        "Propagation to many pipeline users",
        "Automatic immunity to regressions",
        "No need for version management",
        "No caller permission requirements",
        "Central reuse broadens the consequences of a faulty update."
      ]
    ],
    "final": [
      [
        "An older deployment finishes after a newer one and overwrites it. What should design address?",
        "Coordination of release writes",
        "Only the artifact compression ratio",
        "Only the source branch description",
        "Only the CI badge\u2019s display name",
        "Coordinating environment writes prevents accidental release overtaking."
      ],
      [
        "A cancelled job already changed a routing rule. What must the response consider?",
        "Partial state and safe recovery",
        "Assume the rule reverted automatically",
        "Treat the cancellation as full rollback",
        "Delete all incident evidence",
        "Cancellation stops execution but need not undo completed actions."
      ],
      [
        "A team expects concurrency groups to provide strict FIFO deployment ordering. What should be corrected?",
        "No undocumented FIFO promise",
        "Every grouped job runs in submission order",
        "Group names are automatic transaction locks",
        "Cancellation serializes all cloud resources",
        "Provider concurrency semantics do not imply arbitrary queue-order guarantees."
      ],
      [
        "A cleanup step uses always() and also publishes a release. What should be separated?",
        "Collection versus promotion",
        "Only the step\u2019s display title",
        "Only the workflow file extension",
        "Only the artifact archive path",
        "Failure-handling collection must not accidentally bypass release gates."
      ],
      [
        "A deployment step is retried after a partial timeout. What property helps safety?",
        "Safe repeat semantics",
        "A floating latest tag only",
        "An unbounded retry loop",
        "A larger log retention value",
        "Retries should avoid duplicating completed side effects."
      ],
      [
        "A reusable workflow broadens requested token permissions. What should callers review?",
        "Effective caller authority",
        "Only the workflow\u2019s line count",
        "Only the source repository icon",
        "Only the matrix job display order",
        "Shared definitions must not silently exceed intended caller authority."
      ],
      [
        "A deployment report excludes cancelled runs. What can be hidden?",
        "Operational instability and lost work",
        "Only artifact filename differences",
        "Only optional code comments",
        "Only source branch capitalization",
        "Reliability assessment needs unsuccessful and interrupted outcomes too."
      ],
      [
        "A log collector hangs after every failed deploy. What is needed?",
        "Bounded diagnostic execution",
        "Unlimited cleanup retries",
        "Automatic approval bypass",
        "Deletion of failed job records",
        "Failure paths themselves need reliable time and resource limits."
      ],
      [
        "An artifact has tests and approval but no environment outcome. What evidence is incomplete?",
        "Observed deployment outcome",
        "Whether source files exist",
        "Whether a cache key was selected",
        "Whether the author has an account",
        "Approval is not an observed production result."
      ],
      [
        "Two workflows serialize internally but another tool deploys concurrently. What remains to coordinate?",
        "Every environment writer",
        "Only internal YAML job names",
        "Only the source file ordering",
        "Only artifact retention duration",
        "A workflow-local control does not govern unrelated external deployment actors."
      ]
    ]
  }
];
const refs=[
  {
    "id": "actions-ref-0",
    "title": "GitHub Actions official documentation: workflow-syntax.md",
    "url": "https://github.com/github/docs/blob/7cd6f8ddde8ffab161fb41b1e33f5dfdac605d40/content/actions/reference/workflows-and-actions/workflow-syntax.md",
    "source": {
      "repo": "github/docs",
      "commit": "7cd6f8ddde8ffab161fb41b1e33f5dfdac605d40",
      "path": "content/actions/reference/workflows-and-actions/workflow-syntax.md",
      "verification": "Pinned official documentation; offline fixtures model declared decisions and do not execute a container engine or deployment."
    }
  },
  {
    "id": "actions-ref-1",
    "title": "GitHub Actions official documentation: dependency-caching.md",
    "url": "https://github.com/github/docs/blob/7cd6f8ddde8ffab161fb41b1e33f5dfdac605d40/content/actions/reference/workflows-and-actions/dependency-caching.md",
    "source": {
      "repo": "github/docs",
      "commit": "7cd6f8ddde8ffab161fb41b1e33f5dfdac605d40",
      "path": "content/actions/reference/workflows-and-actions/dependency-caching.md",
      "verification": "Pinned official documentation; offline fixtures model declared decisions and do not execute a container engine or deployment."
    }
  },
  {
    "id": "actions-ref-2",
    "title": "GitHub Actions official documentation: deployments-and-environments.md",
    "url": "https://github.com/github/docs/blob/7cd6f8ddde8ffab161fb41b1e33f5dfdac605d40/content/actions/reference/workflows-and-actions/deployments-and-environments.md",
    "source": {
      "repo": "github/docs",
      "commit": "7cd6f8ddde8ffab161fb41b1e33f5dfdac605d40",
      "path": "content/actions/reference/workflows-and-actions/deployments-and-environments.md",
      "verification": "Pinned official documentation; offline fixtures model declared decisions and do not execute a container engine or deployment."
    }
  },
  {
    "id": "actions-ref-3",
    "title": "GitHub Actions official documentation: manage-environments.md",
    "url": "https://github.com/github/docs/blob/7cd6f8ddde8ffab161fb41b1e33f5dfdac605d40/content/actions/how-tos/deploy/configure-and-manage-deployments/manage-environments.md",
    "source": {
      "repo": "github/docs",
      "commit": "7cd6f8ddde8ffab161fb41b1e33f5dfdac605d40",
      "path": "content/actions/how-tos/deploy/configure-and-manage-deployments/manage-environments.md",
      "verification": "Pinned official documentation; offline fixtures model declared decisions and do not execute a container engine or deployment."
    }
  },
  {
    "id": "actions-ref-4",
    "title": "GitHub Actions official documentation: oidc-in-cloud-providers.md",
    "url": "https://github.com/github/docs/blob/7cd6f8ddde8ffab161fb41b1e33f5dfdac605d40/content/actions/how-tos/secure-your-work/security-harden-deployments/oidc-in-cloud-providers.md",
    "source": {
      "repo": "github/docs",
      "commit": "7cd6f8ddde8ffab161fb41b1e33f5dfdac605d40",
      "path": "content/actions/how-tos/secure-your-work/security-harden-deployments/oidc-in-cloud-providers.md",
      "verification": "Pinned official documentation; offline fixtures model declared decisions and do not execute a container engine or deployment."
    }
  },
  {
    "id": "actions-ref-5",
    "title": "GitHub Actions official documentation: reusing-workflow-configurations.md",
    "url": "https://github.com/github/docs/blob/7cd6f8ddde8ffab161fb41b1e33f5dfdac605d40/content/actions/reference/workflows-and-actions/reusing-workflow-configurations.md",
    "source": {
      "repo": "github/docs",
      "commit": "7cd6f8ddde8ffab161fb41b1e33f5dfdac605d40",
      "path": "content/actions/reference/workflows-and-actions/reusing-workflow-configurations.md",
      "verification": "Pinned official documentation; offline fixtures model declared decisions and do not execute a container engine or deployment."
    }
  }
];
refs.push(pythonRef('json'));
const built=build('ci-cd',data,refs);
module.exports=built.course;
Object.defineProperty(module.exports,'__bank',{value:built.bank,enumerable:false});
