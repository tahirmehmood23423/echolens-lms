'use strict';
const {build}=require('./fullstack-wave3-helper');
const units=[
  {
    "comp": "m1.c1",
    "title": "Build once and identify the tested artifact",
    "before": "Review backend deployment operations, lockfiles and the difference between source revision and produced bytes.",
    "intro": "A subscription portal passed tests on a pull request but failed after a release job rebuilt it with different dependencies. CI evidence is meaningful only when the source revision, dependency resolution, runtime and resulting artifact can be connected. Begin with an explicit release identity.",
    "sections": [
      [
        "Reason about the mechanism",
        "A commit SHA names source history, while an artifact digest names produced bytes. They answer different questions. Record both, plus lockfile and build configuration identities. npm ci expects a lockfile and fails on relevant package manifest mismatches instead of silently updating resolution; it does not make every build hermetic.",
        "Environment variables, platform packages, network downloads and timestamps can still change build output. Pin the intended runtime and external inputs, and isolate caches from correctness assumptions. A cache miss should slow a correct build; a cache hit must not replace dependency installation or necessary tests."
      ],
      [
        "Apply and verify the decision",
        "Build an artifact once, run appropriate checks against it and promote the same immutable bytes between environments. Keep deployment configuration separate where possible. If frontend configuration is compiled into a bundle, changing it creates a different artifact that needs its own evidence.",
        "The model compares recorded and promoted artifact identities. Matching strings establish only identity under the assumed trusted digest record. They do not verify provenance, signatures, test completeness or resistance to a compromised build runner."
      ]
    ],
    "problem": "Refuse promotion when the artifact digest differs from the record attached to a tested commit.",
    "steps": [
      "Record the expected commit and digest pair.",
      "Compare a candidate with identical source and bytes.",
      "Reject a candidate whose source matches but whose produced bytes differ."
    ],
    "code": "const evidence={commit:\"a1\",digest:\"sha256:abc\"};function promote(x){return x.digest===evidence.digest&&x.commit===evidence.commit;}console.log(promote({commit:\"a1\",digest:\"sha256:abc\"}));console.log(promote({commit:\"a1\",digest:\"sha256:def\"}));",
    "expect": "true\nfalse",
    "result": "The first candidate matches both recorded identities, so the local gate accepts it. The second uses the same commit label but a different digest and is rejected. String comparison assumes the evidence record is trusted; it neither recomputes the digest nor authenticates a build runner.",
    "mistakes": [
      "Rebuilding from the same SHA can change bytes; promote an identified tested artifact.",
      "A warm cache is not a dependency declaration; make clean builds succeed too."
    ],
    "takeaways": [
      "A commit SHA names source history, while an artifact digest names produced bytes.",
      "Build an artifact once, run appropriate checks against it and promote the same immutable bytes between environments."
    ],
    "formal": [
      "What does an artifact digest identify?|Produced bytes|Only a branch name|An environment label|A test case count|A content digest identifies bytes rather than the mutable branch that produced them.",
      "What is npm ci designed to consume?|A lockfile|An HTTP cache key|A database backup|A Git merge message|The clean installation command uses the lockfile and checks relevant manifest agreement.",
      "A staging release passes but production rebuilds with a later dependency. Which evidence is missing?|Artifact continuity|An extra branch name|A longer job timeout|A second test report|The production bytes differ from those tested, so staging evidence no longer identifies the release.",
      "A build cache is deleted and tests stop finding dependencies. What assumption was unsound?|Cache as correctness|Lockfile as input|Source as versioned|Tests as executable|Caches are optional performance aids and should not be required for a correct clean build.",
      "A portal bundle embeds the staging API URL at compilation. Can unchanged bytes target a different URL automatically?|No; config is embedded|Yes; branch names do it|Yes; a digest rewrites it|Only npm ci can do it|Compile-time configuration becomes part of the produced bytes unless runtime indirection is designed.",
      "An auditor has a Git SHA but two differing bundles from it. What else identifies the release?|Artifact digest|Commit author email|Default branch label|Pull request title|Source identity alone cannot distinguish outputs from different build inputs or processes.",
      "A team pins npm packages but downloads an unversioned build tool. What remains uncontrolled?|External build input|The lockfile syntax|The local source SHA|The test command name|An unversioned external tool can change output independently of locked package dependencies.",
      "A release reuses yesterday’s passing report after changing compiler flags. What must be reassessed?|Built output evidence|Only job display name|Only runner hostname|Only release notes|Compiler flags can change the artifact, so evidence must cover the resulting output.",
      "A digest matches an approved record but the build runner was compromised. What does the match fail to establish?|Trusted provenance|Byte identity claim|Record equality test|Digest string equality|Digest comparison does not establish the integrity of the process that created the trusted record.",
      "A library contains native extensions and CI runs only one OS. Which claim exceeds the evidence?|All-platform validity|That OS test result|The tested commit SHA|The installed version|A platform-specific successful build does not prove compatibility on other target operating systems."
    ],
    "practice": [
      "Which identifier is suitable for tracking source history?|Commit SHA|Latest tag alone|Runner process ID|Mutable cache label|A commit SHA identifies source content and history rather than a mutable deployment label.",
      "What should a cold dependency cache change?|Build duration|Business semantics|Authorization scope|Expected test results|A cold cache should affect speed while the declared installation still supplies correct dependencies.",
      "Why record the runtime version for a web build?|It affects execution|It replaces unit tests|It grants deployment|It proves accessibility|Runtime behavior and supported package features can differ across versions.",
      "What should happen when a release artifact changes after testing?|Recheck its evidence|Retain old approval|Ignore the new digest|Rename the old report|Evidence about earlier bytes does not automatically apply to changed release output."
    ],
    "difficulties": [
      "E",
      "E",
      "M",
      "M",
      "M",
      "M",
      "H",
      "H",
      "H",
      "A"
    ]
  },
  {
    "comp": "m1.c2",
    "title": "Make branch checks enforce the intended gate",
    "before": "Review workflow triggers and distinguish a workflow run from repository merge enforcement.",
    "intro": "A repository can display green jobs while still allowing unsafe merges. Required checks, review policy and supported workflow events must compose into an enforceable gate. The objective is that the revision entering the protected branch has the evidence the team requires.",
    "sections": [
      [
        "Reason about the mechanism",
        "A workflow trigger decides whether a run starts; branch protection or a ruleset decides whether a merge is permitted. A successful unit-test job does not automatically become a required merge check. Give check names stable unique meanings and configure protection to require the intended checks on the relevant branch.",
        "Path filters, skipped jobs and conditional dependencies require careful interpretation. A skipped job can be reported as successful, while a workflow excluded by a filter may leave a required check pending. Use an always-running summary gate when appropriate, with explicit evaluation of required job results rather than relying on a green-looking page."
      ],
      [
        "Apply and verify the decision",
        "A pull-request run and a merge-queue run may test different revisions. Workflows used by a merge queue must support its merge_group event where required, so the candidate combination receives checks. Requiring an up-to-date branch or queue can reduce the gap between an isolated PR and the merged result.",
        "The local gate below requires every named result to equal success and refuses missing evidence. It models a chosen policy, not GitHub enforcement. Validate actual protection settings, actor bypasses and event behavior in a safe repository before treating the policy as effective."
      ]
    ],
    "problem": "Require unit, contract and security evidence rather than treating a skipped contract job as success.",
    "steps": [
      "List the three mandatory check identities.",
      "Evaluate a candidate where every required result is success.",
      "Replace one result with skipped and observe the failed summary decision."
    ],
    "code": "const need=[\"unit\",\"contract\",\"security\"];const gate=r=>need.every(k=>r[k]===\"success\");console.log(gate({unit:\"success\",contract:\"success\",security:\"success\"}));console.log(gate({unit:\"success\",contract:\"skipped\",security:\"success\"}));",
    "expect": "true\nfalse",
    "result": "All three explicit successes satisfy the modeled gate. A skipped contract result does not equal success, so the second candidate fails. This deliberately strict policy must be translated and tested against actual GitHub rulesets, event semantics and bypass permissions.",
    "mistakes": [
      "A green job does not enforce branch protection; require it in repository policy.",
      "A summary that checks only its own execution can hide skipped work; inspect required job results."
    ],
    "takeaways": [
      "A workflow trigger decides whether a run starts; branch protection or a ruleset decides whether a merge is permitted.",
      "A pull-request run and a merge-queue run may test different revisions."
    ],
    "formal": [
      "What makes a CI job a mandatory merge condition?|Protection policy|Its green text color|A workflow filename|A release tag prefix|Repository protection must require the check; running a job alone does not enforce merging policy.",
      "What should a summary gate do with missing mandatory evidence?|Reject the candidate|Assume it passed|Use the author name|Reuse a random run|A mandatory check needs explicit evidence for the candidate being evaluated.",
      "A PR workflow is green but main accepts direct pushes. Which control needs review?|Branch protection|JavaScript bundling|Package compression|HTTP connection reuse|A green workflow does not prevent direct writes unless branch policy enforces the intended controls.",
      "A merge queue stalls because no required checks run for its candidate. Which trigger may be missing?|The merge_group trigger|workflow_dispatch only|A scheduled cron only|An issue label event|Merge queues need checks on merge-group candidates, not only on independent pull-request runs.",
      "A mandatory workflow uses a path filter and never starts for a docs change. Why can merging remain blocked?|Check stays pending|Tests failed at runtime|The branch vanished|The lockfile changed|Filtering out the whole required workflow can leave expected check evidence absent or pending.",
      "A security job is conditionally skipped and a summary reports success blindly. What should the summary inspect?|Actual job results|Only report existence|Only elapsed duration|Only PR description|A gate must evaluate whether required work actually met the declared success condition.",
      "Two workflows emit the same required job name with different tests. What risk follows?|Ambiguous gate meaning|Guaranteed double tests|Automatic least privilege|Deterministic test order|Required status identity should unambiguously represent the evidence the protection policy intends.",
      "A maintainer can bypass branch rules. What limits an audit claim about universal enforcement?|Bypass permissions|Workflow indentation|Artifact file extension|The default npm script|Protection claims must account for actors who are allowed to bypass the configured rules.",
      "A PR passes alone but breaks after another PR merges first. Which gap is illustrated?|Integration revision|Artifact naming style|Log retention format|The local branch label|Evidence from an isolated branch can differ from evidence on the combined merge candidate.",
      "A gate accepts skipped contract tests because the change seems unrelated. What is needed to justify that policy?|Explicit scope criteria|Only a shorter timeout|Only a renamed result|A longer branch name|Skipping a mandatory test requires deliberate coverage criteria and safe evaluation, not implicit green status."
    ],
    "practice": [
      "Does adding a workflow by itself prohibit direct pushes?|No; require protection|Yes; every YAML does|Only after npm install|Only on release tags|Merge and push enforcement is a repository policy separate from workflow execution.",
      "Which check naming property helps branch policy remain clear?|Stable unique meaning|Random names each run|Names from timestamps|Same name for all jobs|A required check should identify the same expected evidence across runs.",
      "Why inspect a workflow’s supported events?|Runs need triggers|Events prove correctness|Events replace reviews|Events encrypt outputs|A check cannot produce evidence for candidate types that never trigger it.",
      "What is a safe default for an absent required result?|Fail the gate|Treat as success|Treat as a cache hit|Trust the PR title|Missing evidence must not silently satisfy an explicit mandatory requirement.",
      "What does a merge queue help validate?|Combined candidates|Only local formatting|Only deleted branches|Only tag descriptions|A merge queue can test the combined revision that is proposed to enter the protected branch.",
      "Why review administrator bypass settings?|They affect enforcement|They speed bundling|They choose npm tags|They repair assertions|Actors permitted to bypass rules change the actual scope of branch protection.",
      "What should an explicit skip rule describe?|Coverage conditions|Only a job nickname|Only author initials|The browser viewport|A skip needs clear safe conditions tied to the evidence the change still requires.",
      "A green optional lint check does not satisfy a required security check. Why?|Different evidence|Green always suffices|Checks are interchangeable|Lint runs more quickly|A protection policy requires specific check evidence, not any successful job."
    ],
    "difficulties": [
      "E",
      "E",
      "M",
      "M",
      "M",
      "M",
      "H",
      "H",
      "H",
      "A"
    ]
  },
  {
    "comp": "m1.c1",
    "title": "Isolate CI trust and choose meaningful test layers",
    "before": "Review least privilege, external pull requests and the responsibilities of unit, integration and browser tests.",
    "intro": "An external contribution needs validation, yet its code must not inherit production credentials. A web delivery pipeline combines a trust model with a test strategy: execute untrusted changes in restricted jobs and reserve privileged release actions for reviewed revisions.",
    "sections": [
      [
        "Reason about the mechanism",
        "Unit tests cover local rules; contract tests cover producer-consumer assumptions; integration tests exercise real boundaries such as a database adapter; browser tests cover critical rendered journeys. Passing many narrow unit tests cannot establish that login cookies, proxy headers or API routes work together. Choose layers from risk and keep fixtures synthetic.",
        "GitHub token permissions should be limited to the operations a job needs. Repository and environment secrets need deliberate scoping. pull_request_target executes in the base-repository context; checking out and running untrusted head code there can expose privileged access. Do not use that event as an automatic workaround for unavailable fork secrets."
      ],
      [
        "Apply and verify the decision",
        "Pin external actions to reviewed immutable revisions where policy calls for supply-chain control, and review upgrades deliberately. Treat downloaded artifacts and caches as potentially crossing trust boundaries. A privileged deployment job must establish that its input came from the intended trusted revision and workflow.",
        "The permission decision below is a pure model: public contributions receive tests without a deploy capability, and a trusted main revision still needs explicit release approval. It does not create tokens, inspect GitHub settings or prove the safety of real actions."
      ]
    ],
    "problem": "Give untrusted contribution code test capability without deployment capability.",
    "steps": [
      "Represent source trust and release approval as separate inputs.",
      "Evaluate an untrusted source even when an approval boolean is present.",
      "Evaluate a trusted and approved revision and compare its capabilities."
    ],
    "code": "function capabilities(trusted,approved){return {tests:true,deploy:trusted&&approved};}console.log(JSON.stringify(capabilities(false,true)));console.log(JSON.stringify(capabilities(true,true)));",
    "expect": "{\"tests\":true,\"deploy\":false}\n{\"tests\":true,\"deploy\":true}",
    "result": "Both inputs retain test capability, but only the trusted approved revision receives the modeled deploy capability. This boolean model does not create or restrict real tokens; real workflow permissions, secret exposure and artifact trust must be inspected independently.",
    "mistakes": [
      "Running an unknown head revision in a privileged context can leak capabilities; keep its validation restricted.",
      "Unit-test totals do not prove browser journeys; test the critical integrated path."
    ],
    "takeaways": [
      "Unit tests cover local rules; contract tests cover producer-consumer assumptions; integration tests exercise real boundaries such as a database adapter; browser tests cover critical rendered journeys.",
      "Pin external actions to reviewed immutable revisions where policy calls for supply-chain control, and review upgrades deliberately."
    ],
    "formal": [
      "Which test layer directly targets a browser login journey?|A browser journey test|A pure price unit test|A source filename check|A Git object count|Browser execution checks rendered interactions and browser behavior across the critical journey.",
      "What is the basic principle for a CI token?|Least privilege|Maximum scope always|Shared personal token|Credentials in source|A job should receive only the capabilities its intended operations need.",
      "A fork PR requests production credentials to run formatting. What is appropriate?|Restricted test job|Grant release secrets|Use a shared admin key|Disable all PR checks|Formatting untrusted code does not require production capabilities.",
      "A pull_request_target job checks out an unknown contributor’s head and runs scripts with secrets. What is the concern?|Trust boundary breach|Only slower test speed|An invalid branch name|Missing CSS minification|Untrusted head code can execute inside the privileged base-repository workflow context.",
      "Unit tests pass but the deployed API path differs from the client URL. Which check best addresses the gap?|Contract integration|A larger unit count|A longer test timeout|A new artifact label|An integration or contract boundary check can exercise producer and consumer routing assumptions.",
      "A third-party action tag moves without review. Which pin offers a more stable identity?|A reviewed commit SHA|Mutable latest tag|Short display title|Repository star count|A reviewed full commit revision identifies the intended action source more precisely than a moving tag.",
      "A privileged release job downloads artifacts from any PR run. What must it verify first?|Trusted provenance|Only archive filename|Only compressed size|Only the PR greeting|Privileged processing needs evidence that input came from the intended trusted workflow and revision.",
      "A cache written by untrusted jobs is consumed as executable release input. What needs isolation?|Cache trust domains|Only cache hit ratio|Only job label length|Only terminal coloring|Untrusted writable caches can become an input channel into a more privileged job.",
      "A browser test uses a real customer account with billing access. What improves the fixture boundary?|Synthetic identities|Longer screenshots|More console output|A production API key|Synthetic scoped fixtures avoid granting tests unnecessary access to live customer data.",
      "A release workflow has read-only repository permissions but a powerful cloud key. What is still required?|Cloud capability review|No further trust model|Only branch renaming|Only YAML lint rules|Least privilege must cover every credential and external authority, not only the GitHub token."
    ],
    "practice": [
      "What do contract tests primarily compare?|Boundary assumptions|Only CSS spacing|Only Git tag spelling|Only runner disk size|Contract tests check the producer-consumer agreement at an application boundary.",
      "Why avoid production credentials in ordinary PR tests?|Limit code authority|Increase option count|Replace branch review|Guarantee test speed|Untrusted or unfinished code should not acquire authority unnecessary for validation.",
      "Does a unit-test total prove a working checkout flow?|No; test the journey|Yes; counts prove it|Only with green logs|Only with many files|Test count alone does not demonstrate the behavior of a full browser and API journey.",
      "What does an immutable action pin support?|Reviewed input identity|Automatic human approval|Unlimited cloud access|Complete test coverage|A fixed source revision helps keep the action implementation tied to reviewed input."
    ],
    "difficulties": [
      "E",
      "E",
      "M",
      "M",
      "M",
      "M",
      "H",
      "H",
      "H",
      "A"
    ]
  },
  {
    "comp": "m2.c1",
    "title": "Separate runtime configuration from public bundle data",
    "before": "Review backend environment configuration, browser-delivered assets and JavaScript truthiness.",
    "intro": "A retailer accidentally exposes a payment secret by injecting it into frontend build variables. Deployment configuration must distinguish public values needed by a browser from private capabilities used only by trusted server processes. A variable’s name does not make its value secret.",
    "sections": [
      [
        "Reason about the mechanism",
        "A frontend bundle is delivered to users and can be inspected. Any value embedded in JavaScript or HTML must be treated as public. API base URLs and feature presentation defaults may be public; database passwords and provider secret keys must remain behind a server boundary. Browser-side checks do not protect a server credential.",
        "Node process.env values are strings or absent. The string false is truthy, so Boolean(process.env.FLAG) is usually not a correct feature-flag parser. Parse enumerated values explicitly, validate required URLs and reject startup when essential configuration is absent. Avoid printing full configuration objects into logs."
      ],
      [
        "Apply and verify the decision",
        "Environment configuration also includes routing and origin policy. A reverse proxy, static client and API must agree on external paths, TLS termination and cookie settings. Test the actual expected topology using a safe fixture; a process starting successfully does not demonstrate that the browser can reach its API.",
        "The model accepts explicit boolean strings and rejects an unknown value. It runs entirely in memory and does not read actual environment variables or secrets. Production boot validation needs a complete schema, safe diagnostics and a documented rotation policy."
      ]
    ],
    "problem": "Parse the literal string false as disabled and reject the unsupported string yes.",
    "steps": [
      "Declare exactly two accepted boolean strings.",
      "Decode false without applying generic truthiness.",
      "Exercise the invalid value and print only its safe validation error."
    ],
    "code": "function flag(x){if(x===\"true\")return true;if(x===\"false\")return false;throw Error(\"invalid flag\");}console.log(flag(\"false\"));try{flag(\"yes\");}catch(e){console.log(e.message);}",
    "expect": "false\ninvalid flag",
    "result": "The string false becomes boolean false rather than the truthy result of Boolean(\"false\"). The unsupported yes produces invalid flag. The function is an isolated parser and does not inspect actual secrets, application startup or deployment configuration.",
    "mistakes": [
      "Minification does not hide embedded credentials; move secret capabilities behind the server.",
      "Boolean on an environment string accepts false as truthy; parse the accepted values explicitly."
    ],
    "takeaways": [
      "A frontend bundle is delivered to users and can be inspected.",
      "Environment configuration also includes routing and origin policy."
    ],
    "formal": [
      "What confidentiality should a value embedded in browser JavaScript have?|Public and inspectable|Server-secret status|Database-only visibility|Administrator-only scope|Browser-delivered bytes are inspectable by users and must not contain private credentials.",
      "How does Node commonly expose an existing environment value?|An ordinary string value|Always as a boolean|As an encrypted object|As a verified URL|Environment values need explicit parsing into application-domain types.",
      "A flag variable contains false and Boolean(value) enables the feature. Why?|Nonempty string truthiness|Node randomizes flags|The variable is absent|The build deleted false|The string false is nonempty and therefore truthy in JavaScript.",
      "A frontend bundle includes a provider secret key. Which repair addresses the boundary?|Use a server boundary|Rename the variable|Minify the same bundle|Hide the source map|Client-delivered secrets remain exposed regardless of variable naming or minification.",
      "A server lacks its required issuer URL but continues with a permissive default. What should startup do?|Reject invalid config|Disable token checks|Trust all token issuers|Log every secret|Security-critical configuration must be explicit and validated rather than silently weakened.",
      "A static client calls an internal container hostname from a user browser. What is wrong?|Wrong network context|Missing package comment|Too few source maps|An invalid Git revision|An address reachable inside the server network may not be reachable from the user browser.",
      "A login cookie works locally but fails behind a TLS proxy. What needs end-to-end checking?|External cookie topology|Only unit price rules|Only module imports|Only release filenames|Proxy, TLS, origin and cookie configuration interact at the deployed browser boundary.",
      "An engineer logs process.env to debug a missing flag. What is a safer diagnostic?|Selected safe fields|Full environment dump|A shared secret screenshot|All token values|Diagnostics should expose the necessary configuration state without printing unrelated credentials.",
      "A staging configuration file is copied into production and points to staging storage. What control was missing?|Environment validation|Only asset compression|Only check display name|Only request timeout|Configuration must be validated for the intended environment rather than treated as interchangeable text.",
      "A secret is rotated on the server but remains compiled into old frontend assets. What must incident recovery consider?|Old asset exposure|Only current server RAM|Only latest Git diff|Only the cookie path|Previously delivered assets can retain exposed credentials, so revoke compromised authority and assess retained copies."
    ],
    "practice": [
      "Why is minification insufficient for protecting a browser key?|Bytes remain public|It encrypts only URLs|It erases authorization|It rotates the secret|Minified code can still reveal values delivered to the browser.",
      "What should parse an environment boolean?|Explicit value rules|Generic truthiness|The branch author|A random default|Explicit accepted strings avoid enabling a flag for the nonempty string false.",
      "Which failure belongs in startup validation?|Missing required URL|A slow customer click|An expired browser tab|A late telemetry event|A missing required service address can be detected before accepting traffic.",
      "What configuration is normally suitable for the client?|Public API base URL|Database admin password|Payment secret token|Signing private key|A browser needs a reachable public API address but should not receive private server capabilities."
    ],
    "difficulties": [
      "E",
      "E",
      "M",
      "M",
      "M",
      "M",
      "H",
      "H",
      "H",
      "A"
    ]
  },
  {
    "comp": "m2.c2",
    "title": "Design rollback around data compatibility",
    "before": "Review application release identity, persistent storage and expand-and-contract migrations.",
    "intro": "A service deploys a new release that renames a database column, then a bug forces a rollback. The previous binary cannot read the new schema. Rolling back application bytes and restoring persistent state are different operations, and each needs an explicit compatibility plan.",
    "sections": [
      [
        "Reason about the mechanism",
        "Use an expand-and-contract migration when old and new application versions overlap. Add a compatible representation, deploy code able to handle the transition, backfill safely and observe completion before removing the old representation. Keep the old release functional throughout the documented rollback window.",
        "A database migration may be irreversible or may lose information on reversal. A down script is not proof that data restoration is safe. Backups and point-in-time recovery address different failure modes from application rollback and require restoration tests, acceptable data-loss limits and coordination with writes made after the backup."
      ],
      [
        "Apply and verify the decision",
        "Feature flags can reduce exposure without replacing a binary rollback, but disabled paths must remain compatible with stored data. Record which artifacts and schema capabilities can coexist. During an incident, prefer the recovery action supported by those facts rather than assuming previous means safe.",
        "The model checks whether a candidate binary’s required fields exist in a schema capability set. It illustrates why an additive schema can support two versions and a dropped column cannot. It does not execute DDL, check query semantics or test a database restore."
      ]
    ],
    "problem": "Compare old and new binary field requirements against additive and contracted schema capability sets.",
    "steps": [
      "Declare each binary’s required fields.",
      "Check both against an additive schema containing both representations.",
      "Remove the legacy field and retest the old binary."
    ],
    "code": "const old=[\"id\",\"total_cents\"],fresh=[\"id\",\"amount_cents\"];const can=(needs,schema)=>needs.every(k=>schema.includes(k));console.log(can(old,[\"id\",\"total_cents\",\"amount_cents\"]),can(fresh,[\"id\",\"total_cents\",\"amount_cents\"]));console.log(can(old,[\"id\",\"amount_cents\"]));",
    "expect": "true true\nfalse",
    "result": "Both versions are compatible with the expanded field set. The old version fails after its required total_cents field is removed. Set membership is only a capability sketch: it does not test actual SQL types, constraints, values, transactional behavior or database restoration.",
    "mistakes": [
      "A down script can lose information; review restoration semantics before using it.",
      "Dropping a legacy column early defeats rollback; retain it for the supported recovery window."
    ],
    "takeaways": [
      "Use an expand-and-contract migration when old and new application versions overlap.",
      "Feature flags can reduce exposure without replacing a binary rollback, but disabled paths must remain compatible with stored data."
    ],
    "formal": [
      "What does an application rollback directly replace?|Application version|All customer writes|Every backup snapshot|The entire audit trail|Replacing an application artifact does not automatically restore or reverse persistent data.",
      "Which schema change is usually friendlier to overlapping versions?|Compatible addition|Immediate field deletion|Destructive type rewrite|Silent unit conversion|An additive compatible representation can support old and new binaries during transition.",
      "A new release drops a field used by yesterday’s binary. What blocks a simple rollback?|Schema incompatibility|Only artifact size|Only a shorter job name|Only log compression|The old binary still requires a field no longer available in the current schema.",
      "A down migration discards newly written values. What must reviewers assess?|Information loss|Only script length|Only DDL formatting|Only branch age|A syntactically available reversal can destroy data and needs explicit recovery analysis.",
      "A backup predates the last hour of paid orders. What does restoration risk?|Losing later writes|Preserving every write|Fixing all code bugs|Eliminating reconciliation|Restoring earlier persistent state can omit legitimate transactions after the recovery point.",
      "A team removes a legacy column immediately after deploying new code. Which policy was violated?|Rollback window|Only commit naming|Only source linting|Only cache retention|Legacy representation should remain until the supported rollback and client overlap periods are satisfied.",
      "A feature flag disables a failing UI but old server code cannot read new rows. Is binary rollback thereby safe?|No; data still matters|Yes; flags reverse rows|Yes; the UI owns storage|Only if logs are green|A feature flag does not automatically restore compatibility of persisted data with an old binary.",
      "A backfill partially completes when an incident begins. What should the runbook include?|Partial-state recovery|Only final schema DDL|Only latest screenshot|Only the task owner|Recovery must account for partially migrated data rather than assuming only initial and final states exist.",
      "A rollback succeeds on staging with empty tables. What evidence remains weak?|Populated-data recovery|Artifact selection syntax|Workflow file parsing|Git revision lookup|Empty fixtures do not exercise compatibility and restoration risks in existing production-shaped data.",
      "A deployment permits old and new writers during backfill. What advanced concern needs a plan?|Write synchronization|Only column spelling|Only job concurrency name|Only release tag prefix|Concurrent writers can diverge representations unless the transition defines authoritative writes and reconciliation."
    ],
    "practice": [
      "Is an application rollback equivalent to restoring a database?|No; distinct actions|Yes; always atomic|Only for JSON APIs|Only with a Git tag|Application bytes and persistent database state are managed through different mechanisms.",
      "What should a rollback compatibility record relate?|Binaries and schema|Only PR titles|Only cache sizes|Only team initials|Recovery choices depend on which application versions can operate against the current schema and data.",
      "Why test restoring a backup before an incident?|Verify recoverability|Guarantee zero loss|Replace migrations|Approve every deploy|A backup is useful only when the team can successfully restore it within its recovery constraints.",
      "What is the first phase of expand-and-contract?|Add compatible support|Delete the old field|Reject all old clients|Rewrite every row blindly|The expansion stage creates overlap before consumers and stored data move to the new representation.",
      "What limits how long old fields must remain?|Supported rollback window|Only table width|Only SQL capitalization|Only package count|The retention decision must cover supported old binaries and the agreed recovery policy.",
      "Can a syntactically valid down migration still be unsafe?|Yes; it may lose data|No; syntax proves it|Only in frontend code|Only without a README|A reversal script can discard values or fail to reconstruct earlier semantics.",
      "What must a partially failed backfill support?|Safe resumption|Automatic data erasure|Forced schema deletion|Unconditional rollback|A restartable backfill needs checkpoints and idempotent processing of partial work.",
      "What should recovery tests include beyond empty tables?|Representative data|Only a new screenshot|Only module comments|Only commit messages|Existing rows and changed values expose compatibility and loss risks absent from empty fixtures."
    ],
    "difficulties": [
      "E",
      "E",
      "M",
      "M",
      "M",
      "M",
      "H",
      "H",
      "H",
      "A"
    ]
  },
  {
    "comp": "m2.c1",
    "title": "Promote releases with readiness and migration gates",
    "before": "Review health probes, controlled migrations and supported client-server contract versions.",
    "intro": "A full-stack release can serve a new client before the matching API is ready. Deployment sequencing must consider supported clients, server readiness and database migration state together. A green process supervisor tells only one part of that story.",
    "sections": [
      [
        "Reason about the mechanism",
        "Liveness asks whether a process should be restarted; readiness asks whether it should receive traffic. Including an unreliable optional dependency in liveness can create a restart storm during a downstream outage. Readiness should reflect required serving capabilities and avoid exposing secrets in health responses.",
        "Migrations must have explicit ownership. Running an unrestricted migration at every replica startup can race, extend startup or overwhelm storage. Use a controlled migration step or an equivalent coordinated strategy, verify compatibility and gate promotion on successful completion. Keep operational timeouts and lock behavior in the review."
      ],
      [
        "Apply and verify the decision",
        "Progressive delivery begins with limited exposure and evaluates user-impact signals before expansion. A canary needs comparable traffic and enough observation to make its result meaningful. Low sample counts or cached static success pages do not prove the checkout API works.",
        "The example permits traffic only after the migration gate and application readiness succeed. It expresses a policy in pure JavaScript and performs no rollout. Real controllers need timeout, rollback, concurrency and health-check semantics validated against the actual platform."
      ]
    ],
    "problem": "Keep traffic blocked while migration state is running even if the API state says ready.",
    "steps": [
      "Read migration and API states as separate gates.",
      "Evaluate the API-ready candidate before migration completion.",
      "Evaluate the same API state after the migration gate completes."
    ],
    "code": "const ready=x=>x.migration===\"complete\"&&x.api===\"ready\";for(const x of [{migration:\"running\",api:\"ready\"},{migration:\"complete\",api:\"ready\"}])console.log(ready(x));",
    "expect": "false\ntrue",
    "result": "The first candidate cannot receive traffic under the declared policy because migration is still running. The second passes both gates. This local expression does not operate a platform readiness probe, coordinate DDL or verify client compatibility.",
    "mistakes": [
      "A listening port does not prove serving readiness; check required capabilities.",
      "Running migrations independently in every replica can race; coordinate ownership and review lock impact."
    ],
    "takeaways": [
      "Liveness asks whether a process should be restarted; readiness asks whether it should receive traffic.",
      "Progressive delivery begins with limited exposure and evaluates user-impact signals before expansion."
    ],
    "formal": [
      "What does readiness primarily control?|Traffic eligibility|Source commit ancestry|Browser CSS ordering|Secret rotation history|Readiness indicates whether an instance can safely serve its intended requests.",
      "What does liveness primarily inform?|Restart decisions|Merge permissions|Contract versioning|Artifact signing|Liveness is used to decide whether the process needs restarting rather than whether every dependency is healthy.",
      "A database outage makes every web process fail liveness and restart continuously. What may be wrong?|Health-check scope|Only package locking|Only client routing|Only release naming|Coupling liveness to a shared dependency can amplify an outage into a restart storm.",
      "Every replica runs the same expensive DDL on startup. Which operational risk needs a control?|Concurrent migration runs|Only missing JSX keys|Only branch check labels|Only static gzip size|Concurrent schema changes require deliberate coordination rather than uncontrolled replica startup.",
      "A canary receives no checkout traffic but its homepage returns 200. What conclusion is unsupported?|Health of checkout paths|Homepage availability|Canary process identity|Static route response|Unrepresentative traffic and a static success response do not validate the critical checkout workflow.",
      "A release starts serving before a required migration completes. Which gate should stop promotion?|Required schema readiness|Only code formatting|Only report retention|Only commit author|The release must not receive traffic until its required schema capabilities are available.",
      "A readiness endpoint returns full database credentials for diagnosis. What should change?|Safe health output|Longer health timeout|More replica restarts|A different port label|Health output should report necessary status without exposing private connection capabilities.",
      "A long migration holds a lock that blocks checkout writes. What was missing from review?|Operational lock budget|Only field naming style|Only source file length|Only JavaScript imports|Migration correctness includes lock duration and availability impact, not only resulting schema shape.",
      "A limited rollout shows one successful request. Why avoid immediate universal promotion?|Insufficient observation|One success proves all|Canaries need no users|Percentiles cannot change|Very small samples provide weak evidence about latency, errors and uncommon customer paths.",
      "A migration gate succeeds, but old clients reject a new response enum. What dimension was missed?|Client compatibility|Only database syntax|Only server readiness|Only artifact checksum|Release gating must include supported consumer contracts in addition to server and schema availability."
    ],
    "practice": [
      "Which probe indicates whether an instance should accept requests?|Readiness|Commit lint status|Dependency cache hit|Release note length|Readiness maps the instance state to safe serving eligibility.",
      "Why coordinate migration execution?|Avoid concurrent DDL|Minify frontend code|Rotate source branches|Increase bundle entropy|Schema changes can conflict or block when every replica attempts them independently.",
      "What traffic makes a canary more informative?|Representative requests|Only cached favicons|Only health endpoint|Only team screenshots|Representative user operations exercise the paths whose release impact matters.",
      "Does a listening TCP port prove business readiness?|No; more checks needed|Yes; it proves all APIs|Only with a lockfile|Only on a new host|A listening process can still lack required configuration, migrations or dependency access."
    ],
    "difficulties": [
      "E",
      "E",
      "M",
      "M",
      "M",
      "H",
      "H",
      "H",
      "H",
      "A"
    ]
  },
  {
    "comp": "m3.c1",
    "title": "Measure user impact with meaningful denominators",
    "before": "Review request counting, fractions and monitoring windows in backend deployment operations.",
    "intro": "A dashboard reports only ten failed requests, yet a small customer segment cannot complete purchases. Monitoring needs defined events, denominators and time windows so the team can distinguish low traffic from good reliability. Choose signals tied to the service promise.",
    "sections": [
      [
        "Reason about the mechanism",
        "An availability indicator might be successful eligible requests divided by all eligible requests in a defined window. Specify what counts as eligible and successful: health probes, cancellations and client mistakes may require different treatment. Excluding a failing endpoint silently can make a dashboard improve while customer experience worsens.",
        "Latency distributions need percentiles and sufficient samples. Averaging instance p95 values does not produce the fleet p95; aggregate compatible underlying observations or histogram counts first. Averages can hide tail latency, and a fast static route can dominate request counts without describing a slow revenue path."
      ],
      [
        "Apply and verify the decision",
        "For an SLO target S, the allowed failure fraction is one minus S. Burn rate divides observed failure fraction by that budget fraction. Use explicit windows and minimum-traffic considerations when designing alerts. Page on actionable customer impact and maintain diagnosis dashboards for supporting signals.",
        "The calculation below uses synthetic integer counts and a 99.9 percent target. It computes a tenfold burn rate, not a billing SLA determination or a complete alert. Production instrumentation must define counting semantics, sampling and alert windows."
      ]
    ],
    "problem": "Compute observed failure percentage and burn rate for twenty failures among two thousand eligible requests.",
    "steps": [
      "Divide failed requests by the eligible denominator.",
      "Convert the result into a percentage for interpretation.",
      "Divide the observed failure fraction by the budget allowed by a 99.9 percent target."
    ],
    "code": "const failed=20,total=2000,target=.999;const rate=failed/total;console.log((100*rate).toFixed(1)+\"%\");console.log((rate/(1-target)).toFixed(1));",
    "expect": "1.0%\n10.0",
    "result": "The observed failure rate is 1.0 percent. The target permits 0.1 percent, so the budget burn rate is 10.0. Floating-point formatting stabilizes this demonstration; a real alert also needs event definitions, observation windows, traffic checks and approved policy.",
    "mistakes": [
      "Raw error counts lack population context; include an eligible denominator.",
      "Averaging per-instance p95 values is not a fleet p95; combine compatible underlying observations."
    ],
    "takeaways": [
      "An availability indicator might be successful eligible requests divided by all eligible requests in a defined window.",
      "For an SLO target S, the allowed failure fraction is one minus S."
    ],
    "formal": [
      "What is needed to interpret an error count as a rate?|A denominator|A deployment tag|A terminal color|An artifact digest|The count must be related to the eligible total over a defined interval.",
      "What can a request-duration average hide?|Slow-request tail latency|All source revisions|Every log message|A required check name|A small group of very slow requests can be hidden by many fast observations.",
      "A checkout endpoint is removed from the availability denominator after it fails. What risk appears?|Misleading reliability|A safer error budget|A corrected outage|Guaranteed good service|Changing eligibility to exclude failures can make the indicator stop reflecting promised customer service.",
      "Two nodes have different traffic volumes and p95 values. Can their simple average be treated as fleet p95?|No; aggregate samples|Yes; p95 is additive|Only when names match|Only after a rollout|Percentiles are not directly composable by averaging per-instance percentile values.",
      "An SLO permits 0.1 percent errors and observed errors are 1 percent. What is the burn rate?|10 times|0.1 times|1 time|100 times|The observed failure fraction divided by the allowed fraction is ten.",
      "A dashboard has zero errors because there were zero requests. What should the operator avoid claiming?|Proven availability|No observed failures|Missing traffic sample|An empty observation|An empty denominator provides no successful user-request evidence.",
      "The homepage is fast but order submission is slow. Which view best exposes the problem?|Journey-specific latency|Only total request mean|Only bundle byte count|Only health checks|Separate critical paths so high-volume fast endpoints do not hide important slow operations.",
      "A page triggers on one failed request during very low traffic. What should alert design consider?|Window and sample size|Only graph color|Only runner image|Only source map count|Low sample counts can create noisy rates and require deliberate observation windows and policy.",
      "A monitor uses 200 responses as success even when the body says payment failed. What must be defined better?|Business success event|Only port readiness|Only TLS handshake|Only response size|The success indicator must match the promised business operation rather than blindly counting HTTP status.",
      "A telemetry sampler discards most slow requests before histogram collection. What is threatened?|Distribution validity|Only Git traceability|Only static routing|Only branch protection|Biased sampling can distort the latency distribution and the reliability decisions based on it."
    ],
    "practice": [
      "What converts failed requests into an error percentage?|Failures / eligible|Failed times total|Total minus target|Target divided by logs|The eligible denominator defines the population to which the observed failure fraction refers.",
      "Which statistic describes a latency tail?|A high percentile|Only arithmetic mean|Only minimum value|Only event count|A high percentile reflects the slower portion of a duration distribution.",
      "What does an SLO target determine for error-budget calculations?|Allowed failure fraction|A source branch name|A private access token|The dependency lock hash|The allowed error fraction is the complement of the defined success target.",
      "Why define monitoring windows explicitly?|Rates depend on time|Windows prove causality|Logs have no timestamps|Percentiles require Git|An observation rate and an alert need a clear interval to be interpreted consistently."
    ],
    "difficulties": [
      "E",
      "E",
      "M",
      "M",
      "M",
      "H",
      "H",
      "H",
      "H",
      "A"
    ]
  },
  {
    "comp": "m3.c2",
    "title": "Investigate incidents with correlated evidence",
    "before": "Review safe structured diagnostics, release identities and the distinction between hypothesis and cause.",
    "intro": "After a release, support reports intermittent invoice failures. An incident response should reduce customer harm while preserving enough evidence to distinguish a deployment regression from a downstream outage. Logs, metrics and traces answer complementary questions.",
    "sections": [
      [
        "Reason about the mechanism",
        "Metrics show frequency and distributions, logs describe selected events, and traces connect work across request boundaries. Propagate a safe correlation identifier through the browser, API and job where appropriate. Do not put raw tokens, passwords or full customer payloads in diagnostic records. A correlation id is a search aid rather than an authorization credential.",
        "Build a timeline using timestamps, release identifiers and relevant configuration changes. Temporal association narrows hypotheses but does not prove cause: traffic mix or a dependency can change at the same time. Compare affected and unaffected cohorts and check whether telemetry gaps could explain missing events."
      ],
      [
        "Apply and verify the decision",
        "Containment may disable a feature, route traffic away from a bad release or invoke a compatible rollback. Choose actions with known effects and record the decision. Preserve a timeline and follow up with contributing factors and verifiable corrective work rather than assigning blame from a single exception line.",
        "The local example correlates synthetic events by request id and orders them by time. It does not contact a log service, expose real customer records or reconstruct distributed clock uncertainty. Production investigation requires retention, access controls and trustworthy timestamp semantics."
      ]
    ],
    "problem": "Reconstruct the sequence for request r1 while excluding an unrelated request.",
    "steps": [
      "Filter synthetic events to one correlation identifier.",
      "Order the retained events by their synthetic timestamps.",
      "Render their event names as an investigation aid."
    ],
    "code": "const events=[{t:3,id:\"r1\",event:\"api-failed\"},{t:1,id:\"r1\",event:\"submit\"},{t:2,id:\"r2\",event:\"read\"}];console.log(events.filter(x=>x.id===\"r1\").sort((a,b)=>a.t-b.t).map(x=>x.event).join(\" -> \"));",
    "expect": "submit -> api-failed",
    "result": "Filtering excludes r2 and sorting yields submit followed by api-failed. This demonstrates a local correlation query only. Distributed clocks, incomplete collection and untrusted identifiers require separate treatment before the timeline supports an incident conclusion.",
    "mistakes": [
      "A matching deployment time suggests investigation rather than proving causation.",
      "Full request dumps can expose tokens; log selected safe diagnostic fields."
    ],
    "takeaways": [
      "Metrics show frequency and distributions, logs describe selected events, and traces connect work across request boundaries.",
      "Containment may disable a feature, route traffic away from a bad release or invoke a compatible rollback."
    ],
    "formal": [
      "What does a correlation id primarily help with?|Finding related events|Granting admin rights|Encrypting log files|Proving root cause|A correlation identifier links diagnostics for investigation but is not a permission or causal proof.",
      "Which evidence best shows request error frequency?|Request metrics|A single stack trace|A source comment|A local branch name|Aggregated metrics characterize frequency over a defined request population and interval.",
      "Invoice errors begin after a rollout. What is a justified first inference?|Investigate association|The commit is proven bad|The database is healthy|All users are affected|A shared timeline suggests a hypothesis but needs supporting comparisons before causal attribution.",
      "A diagnostic payload includes bearer tokens. What response improves ongoing logging?|Redact sensitive fields|Increase log verbosity|Copy tokens to traces|Publish full payloads|Diagnostics need safe projections so access capabilities do not spread into retained logs.",
      "A trace shows API success but the user reports failure. What additional boundary may matter?|Browser completion|Only Git branch age|Only table comments|Only runner capacity|A server operation can succeed while transport, client decoding or rendering fails afterward.",
      "An incident affects one tenant while global rates look normal. What should investigation compare?|Affected user cohorts|Only overall averages|Only homepage traffic|Only deploy duration|Segmented evidence can expose concentrated harm hidden by aggregate traffic.",
      "A rollback is proposed but the prior binary cannot read the current schema. What should guide containment?|Known compatibility|Only release age|Only tag popularity|Only stack length|Containment must respect persistent-state and binary compatibility rather than assuming all rollbacks are safe.",
      "Logs contain no failure event for a reported request. What alternative needs checking?|Missing telemetry records|Proof of user error|Guaranteed API success|Automatic token expiry|Missing evidence can result from sampling, dropped logs or incomplete instrumentation.",
      "A request id supplied by a browser contains newline characters. What should a logging boundary consider?|Input sanitization|Granting extra scope|Disabling all logging|Changing the database|Untrusted diagnostic identifiers need validation or safe structured encoding to prevent log confusion.",
      "A team fixes an incident but writes only a blame note. What useful follow-up is missing?|Testable prevention|Only a longer title|Only a manager name|Only more log colors|A useful review identifies contributing conditions and concrete corrective actions that can be checked."
    ],
    "practice": [
      "Which signal connects work across multiple service spans?|Distributed trace|A static asset hash|A package lock entry|A branch ruleset|A trace records relationships among spans along an operation’s execution path.",
      "Why include the release id in safe logs?|Compare version cohorts|Replace authorization|Expose private tokens|Guarantee causal proof|Release identity helps relate failures to the code and configuration actually serving a request.",
      "Does a deployment timestamp alone prove causation?|No; test hypotheses|Yes; always sufficient|Only with green tests|Only on main branch|Other simultaneous changes can explain the same timing and require comparison.",
      "What should incident containment prioritize?|Reducing user harm|Renaming every metric|Deleting all evidence|Completing blame notes|Containment uses understood actions to limit current impact while investigation continues.",
      "What is safer than logging a full request body?|Selected safe fields|Every bearer token|The signing secret|The raw cookie header|A deliberate projection preserves useful evidence while limiting sensitive data exposure.",
      "Why compare affected and unaffected users?|Narrow the hypothesis|Automatically restore data|Replace all trace spans|Prove no outage exists|Cohort differences help identify which condition correlates with the observed failure.",
      "What belongs in an incident timeline?|Changes and impact|Only personal judgments|Only code style edits|Only meeting attendees|A factual timeline supports investigation and review of the sequence of events and decisions.",
      "Can absence of logs establish absence of failure?|No; check telemetry|Yes; logs are complete|Only with a release tag|Only after a restart|Sampling, retention and collection failures can leave actual incidents without expected log records."
    ],
    "difficulties": [
      "E",
      "E",
      "M",
      "M",
      "M",
      "H",
      "H",
      "H",
      "H",
      "A"
    ]
  },
  {
    "comp": "m3.c1",
    "title": "Control telemetry cost and verify recovery",
    "before": "Review metric dimensions, route parameters and the difference between symptom and diagnostic alerts.",
    "intro": "A team adds customer id and raw URL as metric labels, causing its monitoring system to struggle exactly when an outage increases traffic. Observability is a production workload with cost and failure modes. It needs bounded dimensions, safe collection and recovery verification.",
    "sections": [
      [
        "Reason about the mechanism",
        "A metric label creates a separate series for each label combination. High-cardinality values such as request ids or arbitrary URLs can multiply storage and query cost. Prefer bounded route templates and status classes in metrics; put safe per-request detail in logs or traces with appropriate sampling and access controls.",
        "Alerting should distinguish a symptom requiring action from a diagnostic condition. A CPU spike may be useful context without proving user harm. Route pages to an actionable runbook and review noisy alerts. Monitor the telemetry pipeline itself so missing data is not confused with healthy service."
      ],
      [
        "Apply and verify the decision",
        "After containment, verify the affected customer journey using known release identity, error and latency windows, backlog state and representative checks. A returned homepage and a falling global average do not prove recovery for the failed write path. Keep observation long enough to detect retries or delayed jobs.",
        "The cardinality model counts synthetic combinations and contrasts raw request labels with route-template labels. It does not predict vendor billing or demonstrate a real monitoring backend. Actual cost depends on retention, encoding, collection interval and provider behavior."
      ]
    ],
    "problem": "Count the series identities created by concrete order URLs versus one route template.",
    "steps": [
      "Collect three distinct concrete route labels.",
      "Replace concrete ids with the same bounded route template.",
      "Compare the number of distinct label values."
    ],
    "code": "const count=x=>new Set(x).size;console.log(count([\"/orders/1\",\"/orders/2\",\"/orders/3\"]));console.log(count([\"/orders/:id\",\"/orders/:id\",\"/orders/:id\"]));",
    "expect": "3\n1",
    "result": "The three raw paths create three distinct identities while the template creates one. Real time-series cardinality also multiplies across every other label dimension; the example does not estimate backend cost or prove recovery of an affected user journey.",
    "mistakes": [
      "Raw identifiers can create unbounded metric series; use bounded route shapes where appropriate.",
      "A healthy homepage does not establish checkout recovery; verify the affected operation and backlog."
    ],
    "takeaways": [
      "A metric label creates a separate series for each label combination.",
      "After containment, verify the affected customer journey using known release identity, error and latency windows, backlog state and representative checks."
    ],
    "formal": [
      "What does a metric label combination define?|A time series|A Git merge commit|A browser permission|A deployment token|Each distinct dimension combination contributes a distinct series in common metric systems.",
      "Which label is usually more bounded?|Route template|Raw request id|Customer email|Unbounded URL query|A route template groups many concrete requests under a finite application route shape.",
      "A request-id label creates millions of series. Where is safe per-request detail usually better placed?|Scoped logs or traces|Another metric label|The artifact digest|The required check name|Per-request diagnostics belong in appropriately controlled event or trace storage rather than unbounded metric dimensions.",
      "A CPU alert pages the team but customer latency and errors remain healthy. What should be reviewed?|Alert actionability|Only source formatting|Only lockfile order|Only release title|A page should correspond to a condition requiring timely action, with diagnostic context separated from user-impact policy.",
      "The telemetry collector stops exporting and dashboards show no errors. What must be checked?|Data pipeline health|Only API source code|Only branch age|Only browser zoom|Missing observations can indicate collector failure instead of healthy application behavior.",
      "After rollback, the homepage works while queued invoices still fail. What recovery evidence is incomplete?|Journey and backlog|Only process liveness|Only artifact presence|Only the release label|Recovery must include the operation and delayed work that originally suffered impact.",
      "A raw URL metric includes reset tokens in query strings. What extra issue appears beyond cost?|Sensitive data exposure|Guaranteed lower latency|Automatic session expiry|Better access control|Unfiltered dimensions can retain confidential values in telemetry as well as create unbounded cardinality.",
      "A dashboard averages successful and failed tenant cohorts together. Which design helps verify targeted recovery?|Segmented indicators|Only global mean|Only cache hit ratio|Only runner uptime|Recovery for a specific affected cohort requires evidence that remains visible for that group.",
      "An alert clears immediately after traffic is redirected, before delayed retries run. Why continue observing?|Delayed effects remain|Clearing proves all data|Retries cannot fail|Only dashboards matter|Backlogs and retries can reveal persistent failure after synchronous traffic appears healthy.",
      "A telemetry budget is exceeded during an attack. Which design best protects observability usefulness?|Bounded dimensions|Unlimited raw labels|Disable all safeguards|Log all credentials|Bounded dimensions and deliberate collection limits reduce the chance that hostile input overwhelms monitoring."
    ],
    "practice": [
      "Why avoid arbitrary user ids in ordinary metric labels?|Unbounded cardinality|They shorten traces|They prove ownership|They pin the runtime|Unbounded identities can create excessive series and make metrics expensive or unreliable.",
      "Which recovery check best matches a failed payment flow?|A safe payment probe|Only a homepage fetch|Only a TCP handshake|Only a Git status read|Recovery should be checked against the affected business operation with safe representative data.",
      "What should accompany an actionable page?|A relevant runbook|A random branch name|An unscoped admin key|A minified source map|A runbook connects the detected condition to understood investigation and containment actions.",
      "Why monitor the monitoring collector?|Detect missing evidence|Replace all API tests|Guarantee zero outages|Authorize deployments|Telemetry collection can fail and needs its own signals to distinguish gaps from healthy operation."
    ],
    "difficulties": [
      "E",
      "E",
      "M",
      "M",
      "M",
      "H",
      "H",
      "H",
      "H",
      "A"
    ]
  }
];
const refs=[
  {
    "id": "actions-syntax",
    "title": "GitHub Actions workflow syntax, events, jobs and permissions",
    "url": "https://github.com/github/docs/blob/7cd6f8ddde8ffab161fb41b1e33f5dfdac605d40/content/actions/reference/workflows-and-actions/workflow-syntax.md",
    "source": {
      "repo": "github/docs",
      "commit": "7cd6f8ddde8ffab161fb41b1e33f5dfdac605d40",
      "path": "content/actions/reference/workflows-and-actions/workflow-syntax.md",
      "verification": "Inspected official source at this exact Git revision. Offline examples model bounded policies and require human review before production application."
    }
  },
  {
    "id": "actions-env",
    "title": "GitHub deployment environments and protection",
    "url": "https://github.com/github/docs/blob/7cd6f8ddde8ffab161fb41b1e33f5dfdac605d40/content/actions/concepts/workflows-and-actions/deployment-environments.md",
    "source": {
      "repo": "github/docs",
      "commit": "7cd6f8ddde8ffab161fb41b1e33f5dfdac605d40",
      "path": "content/actions/concepts/workflows-and-actions/deployment-environments.md",
      "verification": "Inspected official source at this exact Git revision. Offline examples model bounded policies and require human review before production application."
    }
  },
  {
    "id": "actions-secrets",
    "title": "GitHub Actions secret boundaries",
    "url": "https://github.com/github/docs/blob/7cd6f8ddde8ffab161fb41b1e33f5dfdac605d40/content/actions/concepts/security/secrets.md",
    "source": {
      "repo": "github/docs",
      "commit": "7cd6f8ddde8ffab161fb41b1e33f5dfdac605d40",
      "path": "content/actions/concepts/security/secrets.md",
      "verification": "Inspected official source at this exact Git revision. Offline examples model bounded policies and require human review before production application."
    }
  },
  {
    "id": "node-process",
    "title": "Node environment variables and process configuration",
    "url": "https://github.com/nodejs/node/blob/b009466555c360513b8012ce549f716501090ee5/doc/api/process.md",
    "source": {
      "repo": "nodejs/node",
      "commit": "b009466555c360513b8012ce549f716501090ee5",
      "path": "doc/api/process.md",
      "verification": "Inspected official source at this exact Git revision. Offline examples model bounded policies and require human review before production application."
    }
  },
  {
    "id": "git-revisions",
    "title": "Git revision identities",
    "url": "https://github.com/git/git/blob/9a2fb147f2c61d0cab52c883e7e26f5b7948e3ed/Documentation/revisions.adoc",
    "source": {
      "repo": "git/git",
      "commit": "9a2fb147f2c61d0cab52c883e7e26f5b7948e3ed",
      "path": "Documentation/revisions.adoc",
      "verification": "Inspected official source at this exact Git revision. Offline examples model bounded policies and require human review before production application."
    }
  }
];
const built=build('web-deployment-cicd',units,refs);module.exports=built.course;Object.defineProperty(module.exports,'formal',{value:built.formal});
