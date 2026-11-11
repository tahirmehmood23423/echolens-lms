'use strict';
const {build,playwrightRef}=require('./wave4-webqa-helper');
const units=[
  {
    "slug": "reproducible-runners",
    "title": "Build reproducible pull-request test environments",
    "intro": "A pull request passes on a developer laptop but cannot launch a browser in CI. The pipeline reused an unrelated dependency cache and never installed the browser build expected by the locked runner package.",
    "sections": [
      [
        "Define the execution recipe",
        "A useful CI result identifies the source revision, dependency lockfile, runtime, runner version, browser project and relevant environment configuration. Use the project’s documented clean installation procedure and provision the supported browser build and operating-system dependencies. A cache accelerates that procedure; it does not replace declaring the inputs or checking that a restored entry is compatible.",
        "Keep application secrets outside source control and expose only the credentials required by the isolated test environment. Pull-request event trust differs between platforms and repository settings. Do not assume untrusted fork code may safely execute with privileged credentials. Follow the platform’s documented event and permission model, and run synthetic fixtures with bounded privileges rather than production customer accounts."
      ],
      [
        "Interpret setup failures truthfully",
        "Separate setup, test and artifact phases in the result. A browser installation failure means the intended browser checks did not execute; it is not proof that the application assertions passed. Retain the setup error and fail the required gate when its evidence could not be obtained. A stale cache that happens to avoid setup today is not a reproducible dependency contract for a clean machine.",
        "The example compares two supplied execution recipes and lists the changed inputs. It is ordinary object comparison, not a CI provider run, package installation or browser compatibility check. Use a real clean isolated runner to validate the full recipe before claiming that the workflow is operational. A revision match alone is insufficient if dependencies or the selected browser project differ.",
        "A cache may match the lockfile while image browsers still mismatch the runner-required build. Reproducibility needs both; include installation and provisioning time in the same declared deadline."
      ]
    ],
    "code": "const before={revision:\"r7\",lock:\"L1\",browser:\"chromium\"};\nconst after={revision:\"r7\",lock:\"L2\",browser:\"firefox\"};\nconsole.log(Object.keys(before).filter(k=>before[k]!==after[k]).join(\",\"));",
    "expect": "lock,browser",
    "problem": "Detect changed execution inputs in a synthetic CI recipe.",
    "steps": [
      "Record revision, dependency identity and browser project.",
      "Compare each required field.",
      "Treat detected differences as invalidating recipe equivalence."
    ],
    "limit": "The comparison does not install dependencies or execute a managed CI workflow.",
    "mistakes": [
      "A dependency cache is not the dependency specification.",
      "A browser launch failure is missing test evidence, not an assertion pass."
    ],
    "takeaways": [
      "Record execution inputs.",
      "Provision the runner’s compatible browser.",
      "Keep credential privileges bounded."
    ],
    "practice": [
      "Which input makes a dependency restoration reproducible?|A committed dependency lockfile|Only the cache directory size|Only the job display name|Only the latest successful badge|The lockfile records the intended dependency resolution.|Size does not identify versions.|A label does not resolve packages.|A badge omits install inputs.",
      "A browser fails to launch before tests start. What result is supported?|Environment failure with checks unexecuted|All product assertions passed|The UI is incompatible with every browser|Every test requirement was removed|The required execution did not reach application checks.|Unexecuted assertions cannot pass.|One setup failure proves no universal incompatibility.|Setup does not remove requirements.",
      "What is the purpose of a dependency cache?|Reduce repeated setup cost|Replace the lockfile contract|Grant production permissions|Prove application correctness|A cache is an optimization around declared inputs.|Cached contents can be stale.|Storage restoration does not grant authority.|No application assertion follows from a cache hit.",
      "What should identify the source under test?|The exact revision identity|Only the branch’s current name|Only the artifact upload date|Only the test count|A branch can move after a run, so retain the revision.|Names do not pin historical content.|Upload dates do not identify source bytes.|Counts omit revision.",
      "Why avoid production accounts in routine CI fixtures?|Use bounded synthetic test authority|To make every permission check unnecessary|To disable all backend validation|To guarantee that no cleanup is needed|Synthetic owned identities constrain effects and cleanup.|Authorization still needs checking.|Validation remains relevant.|Owned fixtures still need lifecycle management.",
      "A recipe comparison reports changed browser and lock. What was verified?|Those supplied metadata differences|A successful browser installation|The complete CI provider permission model|The production application’s availability|The local comparison observes only supplied object values.|No installation executes.|No provider policy executes.|No service is contacted."
    ],
    "formal": [
      "What makes a clean-runner result reproducible?|Pinned inputs and environment|Only a green badge on a moving branch|Only a restored cache with no provenance|Only a developer’s remembered install command|The recipe must identify inputs needed to repeat execution.|A badge does not pin its inputs.|Unidentified cache contents cannot define the recipe.|Memory is not a recorded execution contract.",
      "Which role should a cache play in a test job?|Accelerate a declared installation contract|Define dependencies without any version record|Substitute for every browser compatibility check|Authorize arbitrary code with production credentials|Restoration is useful when compatible with declared inputs.|Versions must remain explicit.|Actual supported execution still needs checking.|Caching has no such authority.",
      "What does a setup failure mean for required UI evidence?|The required checks have not been established|The application passed because no assertion failed|All later jobs can be called successful automatically|The test cases no longer belong in the required suite|Required execution did not happen. This follows from the stated model and preserves the declared execution scope.|Absence of assertion execution is not success.|Dependencies and gates must reflect the failure.|Requirements persist.",
      "A job restores a cache from lock L 1 but the tested revision uses lock L 2. What protects reproducibility?|Validate or rebuild dependencies against L 2 before tests|Assume every cache hit proves dependency equivalence|Record only that some installation directory exists|Remove L 2 so the cache becomes the only specification|The tested source’s dependency contract must control the environment.|A cache hit is not compatibility evidence.|Existence omits package identities.|Removing the contract hides drift.",
      "A browser package is pinned but its matching browser build is absent. Which first repair targets the observed failure?|Provision the runner-compatible browser and system dependencies|Change expected checkout totals before any page can load|Report engine compatibility passed without execution|Use an arbitrary executable and claim the pinned build ran|Launch dependencies must be present before evaluating app behavior.|No checkout assertion has executed.|Missing execution supplies no compatibility result.|An arbitrary build changes the declared environment.",
      "A PR changes source at r 8 while the report says r 7. The lock and browser match. What does that report establish?|Evidence for r 7 under the recorded recipe|Complete evidence for r 8 because dependencies match|A guarantee that both revisions contain identical behavior|Permission to ignore source identity in later gates|Source is one of the required recipe inputs.|Matching dependencies do not execute changed source.|No identity proof exists for source behavior.|Revision remains necessary.",
      "A test requires NodeN, lock L and two browser projects. The cache supplies packages for lock K and only one project can launch. Which gate interpretation is accurate?|Required execution is incomplete until L and both projects are established|The cache hit covers both projects without launching the second|One project’s pass proves every browser under either lock|The report can count the unlaunched project as skipped-and-passed|Both the dependency contract and required project coverage are missing.|Caching does not execute projects.|Versions and engines are separate dimensions.|Skipped checks are not passes.",
      "An untrusted PR can modify test code. The proposed workflow grants it production-write credentials merely to upload screenshots. Which design meets least authority and diagnostic needs?|Use scoped test and artifact authority|Expose the production token to every PR step for convenience|Put the production token into the screenshot filename|Disable all failure artifacts while keeping broad production authority|The execution and artifact boundaries need only their specific permissions.|Convenience does not bound authority.|Filenames can leak credentials.|That loses diagnostics without fixing excessive authority.",
      "Setup costs 2 minutes, dependency install 3 minutes and tests 7 minutes. A cache reduces only install to 1 minute. Under a sequential model what is total runtime and saving?|10 minutes total, 2 minutes saved|7 minutes total, 5 minutes saved|9 minutes total, 3 minutes saved|12 minutes total, no saving|2+1+7=10 versus 2+3+7=12. This follows from the stated model and preserves the declared execution scope.|This omits setup and installation.|The stated sum is 10.|The cache changes installation by 2 minutes.",
      "The required recipe is revision R, lock L, runner V and browser build B77 for Chromium and Firefox. A cache contains packages from L but image browsers are B76. Clean install takes 3 minutes, compatible browser provisioning 2 and both project tests 4; deadline 10. Which plan meets identity and time contracts?|Install L, provision B77, run both:9 minutes|Reuse B76 with runner V, run both:4 minutes|Install L, rename B76 as B77, run both:7 minutes|Provision B77 but run Chromium twice:9 minutes|3+2+4=9 minutes; the dependency contract, runner-compatible build and both distinct projects are preserved.|The old image build does not meet the stated required build.|Renaming a directory does not change executable browser bytes.|Two Chromium runs cannot supply the required Firefox project evidence."
    ],
    "comps": [
      "m1.c1"
    ]
  },
  {
    "slug": "required-status-aggregation",
    "title": "Aggregate all required pull-request test outcomes",
    "intro": "A four-job pipeline shows three green jobs and one cancelled shard. Its summary script sees no explicit failed test and incorrectly reports the suite as passing.",
    "sections": [
      [
        "Model success as complete evidence",
        "Define the required set before inspecting results: relevant projects, shards and critical checks. A required gate should pass only when every required member executed successfully for the intended revision. Missing, cancelled, timed-out and failed outcomes need explicit handling. An empty list must not pass accidentally through a programming language’s all-elements predicate when required discovery was expected.",
        "Platform branch-protection behavior depends on exact workflow and check names, event filters and repository configuration. A job may be skipped or absent under a filter. Verify the configured required-check contract in the actual platform before claiming merge protection is effective. This lesson models a strict evidence policy; it does not configure repository settings or certify any provider’s interpretation of skipped jobs."
      ],
      [
        "Preserve failures through cleanup",
        "Cleanup and artifact upload often need to run after a failed test. Their successful completion should not replace the test’s failing exit status. Keep test outcome, infrastructure outcome and artifact outcome separately, then compute the gate from the declared requirements. A report file can exist even when its test process terminated unsuccessfully or when only a subset ran.",
        "The example explicitly requires three named outcomes, verifies their existence and then requires passed status. It rejects a cancelled third member. This local predicate demonstrates fail-closed aggregation over supplied values. It cannot discover workflow jobs, inspect required branch rules, run cancellation behavior or prove that the underlying reports are authentic. Those are separate integration boundaries.",
        "Aggregate unique required identities at the required revision. Duplicate reports add no coverage,stale results remain historical and cancellation is not a passing member."
      ]
    ],
    "code": "const required=[\"unit\",\"api\",\"ui\"];const results={unit:\"passed\",api:\"passed\",ui:\"cancelled\"};\nconsole.log(required.every(id=>results[id]===\"passed\"));",
    "expect": "false",
    "problem": "Reject an incomplete required result set.",
    "steps": [
      "Declare the required identities.",
      "Look up each identity rather than only scanning present reports.",
      "Require passed status for every member."
    ],
    "limit": "The predicate checks supplied statuses only; it does not configure merge protection or validate provider events.",
    "mistakes": [
      "No failed records is weaker than all required records passed.",
      "Successful artifact upload must not overwrite the failing test outcome."
    ],
    "takeaways": [
      "Declare the expected result set.",
      "Handle cancellation and absence explicitly.",
      "Keep test and upload status separate."
    ],
    "practice": [
      "A required shard is cancelled. What should a strict evidence gate conclude?|Required evidence is incomplete|The shard passed by default|The requirement was removed|Every other shard failed too|Cancellation does not establish its required checks.|There is no passing execution.|Requirements persist.|Other outcomes remain separate.",
      "Why define required job identities first?|Detect absent required results|Make every existing result pass|Avoid all revision tracking|Replace actual execution|A list of present results cannot reveal what should have been present.|Identity does not change outcomes.|Revision remains required.|A contract is not execution.",
      "A failed test is followed by successful artifact upload. Which outcome should survive?|The failed test outcome|Only the upload’s success|An invented passing test result|No record of either phase|Diagnostics should preserve rather than mask the failure.|Upload success is separate.|Success cannot be invented.|Losing evidence harms diagnosis.",
      "What should an empty required-discovery result trigger?|An explicit completeness check|Automatic full-suite success|Automatic product publication|Deletion of all test expectations|An empty result can be a discovery defect.|No required execution is established.|Publication needs separate authority.|Requirements should not disappear.",
      "What can a report file’s existence establish alone?|Only that a file is present|All required tests passed|Every shard completed|Correct merge protection rules|Contents and completeness need separate validation.|Files can contain failures.|Some shards may be absent.|A local file does not configure branch rules.",
      "What does the supplied status predicate verify?|Its strict aggregation logic|Actual branch protection settings|The provider’s event permissions|All real test assertions|It evaluates given identities and statuses.|No repository configuration is inspected.|No provider event executes.|No underlying suite runs."
    ],
    "formal": [
      "What defines strict required-suite success?|Every required identity passed for the intended run|No present row contains the word failed|At least one job generated a green badge|The artifact upload step completed successfully|Completeness and outcome are both necessary.|Missing and cancelled results can evade that filter.|One pass cannot cover the required set.|Upload is a separate phase.",
      "Which state should not silently become a required test pass?|Cancelled execution|A recorded successful assertion|A matching required result identity|A completed passing test outcome|Cancellation supplies no passing result.|That can support a pass within scope.|Identity supports completeness rather than proving outcome.|A genuine completed pass is passing evidence.",
      "Why keep test and artifact outcomes separate?|Upload success cannot repair failed behavior|Artifacts always contain no useful information|An upload executes the failed assertions again|Report formatting determines application behavior|The phases serve different purposes.|Diagnostics can be valuable.|Upload does not rerun tests.|Formatting is not behavior.",
      "Required jobs are A, B, C. Present results contain A:pass and B:pass. What is the strict result?|Incomplete because C is absent|Passed because no failure row exists|Failed because A and B must be ignored|Passed because two results are enough for any suite|C belongs to the declared required set.|Absence is not success.|Their passes remain valid within scope.|The required cardinality is three.",
      "A summary checks results.every(pass) on an empty array after discovery crashed. Which guard is needed?|Validate successful discovery and expected required membership|Always add one arbitrary passing row before evaluating|Interpret the empty result as complete coverage|Suppress the discovery error to keep the gate green|An all-elements predicate can be vacuously true on empty data.|An arbitrary pass does not restore discovery.|No checks were established.|Suppressing the error hides the gap.",
      "A test process exits 1 and the uploader exits 0. Which reported state preserves evidence?|Test failed, artifacts uploaded, required gate failed|Test passed because the last process exited 0|Test skipped because an artifact now exists|Full suite passed because diagnostics were retained|Both phase outcomes must remain accurate.|The uploader is not the test outcome.|Artifact presence does not imply a skip.|Retention is not behavioral success.",
      "Four required shards yield pass, pass, timeout, pass at revision R. A complete prior run at Q is available. Which aggregation meets revision and completeness constraints?|Fail R’s required gate and keep Q only as historical evidence|Substitute Q’s timed-out shard and call R complete|Ignore the timed-out shard because three others passed|Average the four statuses into a majority success|Required members must complete for the intended revision.|Cross-revision mixing is not an executed R suite.|One missing required member still matters.|Required-all semantics are not majority vote.",
      "A workflow filter omits UI jobs on a change that affects the UI helper. The aggregator sees only unit success. Which investigation is necessary before claiming merge protection?|Verify affected job selection and the actual required-check configuration|Assume any green job proves UI checks were required and executed|Rename the unit job to UI without changing what it runs|Count the missing UI flow as a passing skipped assertion|Both selection and platform enforcement are material evidence boundaries.|A unit badge does not execute UI.|Names do not change execution.|Skipping supplies no assertion result.",
      "Three required checks need revision R and dataset D. One passed at R/D, one at R/E and one at Q/D. How many satisfy both identity constraints?|One|Two|Three|Zero|Only the first result matches both required revision and dataset.|Each of the others mismatches one field.|Having one matching field is insufficient.|The first result does satisfy both.",
      "Expected current results at revision R are C1, C2, C3, F1, F2, F3. Received records are R:C1 pass, R:C2 pass, R:C3 pass, R:F1 pass, R:F1 pass, Q:F2 pass; F3 cancelled at R. How many unique current passes exist, and which expected members still lack a current pass?|4 current passes; F2 and F3 lack current passes|5 current passes; only F3 lacks a current pass|6 current passes; none lack a current pass|4 current passes; only duplicated F1 lacks a pass|C1, C2, C3, F1 are four unique current passes. The duplicate adds none, Q:F2 is stale, and cancelled F3 does not pass.|This incorrectly counts stale F2 as current.|This counts duplicate and stale records as complete coverage and ignores cancellation.|F1 has valid current evidence despite its duplicate; F2 and F3 are the gaps."
    ],
    "comps": [
      "m1.c1"
    ]
  },
  {
    "slug": "shards-and-critical-path",
    "title": "Shard suites while preserving coverage and resource limits",
    "intro": "A suite takes twenty minutes serially. Splitting it into four equal file counts still takes fifteen minutes because one file contains most of the expensive cases and setup is repeated in each job.",
    "sections": [
      [
        "Distinguish concurrency layers",
        "Workers provide parallel execution inside a machine; shards partition work across jobs or machines. Their product can determine potential simultaneous test workers: four shards with three workers each can create twelve concurrent worker slots. Actual activity depends on discovered tests, serial groups and scheduling. Bound both local CPU demand and shared test-environment capacity, including database connections and synthetic account pools.",
        "In Playwright 1.56.1, --shard=x/y selects the indexed partition. Without fullyParallel, file-level granularity can leave uneven work. With fullyParallel, individual tests can be distributed more finely when safe to run independently. This balances test counts rather than promising perfect duration balance. A long test or repeated setup can dominate the real critical path even when test counts match."
      ],
      [
        "Compute makespan and check completeness",
        "Under a simplified concurrently started model, total completion is setup overhead plus the maximum shard duration plus report merge time. Adding all shard durations gives total work, not elapsed completion when jobs overlap. Platform queue limits, startup variation and shared-service contention can increase elapsed time. More shards can therefore increase overhead or overload a shared dependency instead of improving throughput.",
        "The fixture calculates makespan from supplied durations and fixed overhead. It does not run the Playwright scheduler. In a real pipeline require every expected shard result and unique artifact identity before merging. Retain project and shard labels so a missing or duplicated result is visible. A merged report must not conceal that the partition configuration changed or that the same shard index was accidentally launched twice.",
        "An indivisible long test creates a runtime lower bound even when worker count increases. Bound shared connections using shards×workers×connections per worker."
      ]
    ],
    "code": "const durations=[4,7,5,6],setup=2,merge=1;\nconsole.log(setup+Math.max(...durations)+merge);\nconsole.log(4*3);",
    "expect": "10\n12",
    "problem": "Compute a simplified parallel makespan and worker capacity.",
    "steps": [
      "Take the longest overlapping shard duration.",
      "Add setup and merge overhead.",
      "Multiply shard and per-shard worker counts for maximum modeled slots."
    ],
    "limit": "This is arithmetic over supplied durations; scheduling, provider queues and shared-service contention do not execute.",
    "mistakes": [
      "Equal file counts do not imply equal runtime.",
      "More worker slots can exceed backend capacity."
    ],
    "takeaways": [
      "Separate shard and worker concurrency.",
      "Measure the critical path.",
      "Require every expected partition once."
    ],
    "practice": [
      "What does sharding primarily distribute?|Suite partitions across jobs|Only report colors|Only source formatting|Production user credentials|Shards execute distinct portions of selected work.|Colors are presentation.|Formatting is unrelated.|Credentials should remain scoped.",
      "What do workers add within a shard?|Local execution concurrency|Automatic new browser engines|Automatic fixture ownership|Guaranteed linear speedup|Workers create potential parallel execution on that runner.|Engines need explicit projects.|Resource ownership still needs design.|Contention and overhead limit speedup.",
      "Why can equal file counts be imbalanced?|Files can have different durations|Every file must run equally long|Reports cannot record file identities|Sharding removes setup overhead|File counts do not encode work cost.|Durations can differ.|Identities can be retained.|Each job may repeat setup.",
      "Four shards each permit 3 workers. What is maximum modeled concurrency?|12 worker slots|4 worker slots|3 worker slots|7 worker slots|4×3=12 potential slots. This follows from the stated model and preserves the declared execution scope.|That counts only jobs.|That counts only one job’s workers.|Adding does not count the product.",
      "Which duration determines parallel completion in a simple overlap model?|The longest shard plus overhead|Always the sum of all shards|Always the shortest shard|Only the number of files|All required partitions must finish.|The sum measures work when they overlap.|Slow shards still block completion.|File count omits duration.",
      "What does an arithmetic makespan fixture not execute?|The actual CI scheduler|Its supplied maximum calculation|Its stated overhead addition|Its worker-slot multiplication|The model contains no real jobs or scheduler.|Maximum is directly computed.|Addition is executed.|Multiplication is executed.",
      "A shard can launch three local workers and the service allows four simultaneous sessions. Two shards run together. What setting stays inside the limit under one-session-per-worker assumptions?|Two workers per shard|Three workers per shard|Four workers per shard|Five workers per shard|Two shards times two workers gives four sessions, meeting the stated bound.|Three per shard can demand six sessions.|Four per shard can demand eight sessions.|Five per shard can demand ten sessions.",
      "Expected shard indices are 1/3, 2/3 and 3/3. Two reports both identify 2/3 and another identifies 1/3. What completeness check exposes the problem?|Compare unique indices with the expected set|Count three files and declare every partition complete|Ignore index metadata when every file can be parsed|Replace the missing index label without running its partition|Unique membership reveals the missing 3/3 and repeated 2/3 partition.|Three files can contain a duplicate partition.|Parsing does not establish partition identity.|Relabeling does not execute omitted work."
    ],
    "formal": [
      "What distinguishes shards from local workers?|Shards partition jobs; workers parallelize within a job|Workers automatically divide the suite into provider jobs|Shards always select different browser engine families|Workers remove the need to partition test identities|The two concurrency layers have different scopes.|Provider job orchestration is separate.|A shard can run the same projects.|Identity coverage still needs checking.",
      "What does fullyParallel improve for safe independent tests?|Finer test-level partition granularity|Guaranteed equal runtime for all shards|Automatic absence of shared backend races|Automatic identical machine capacity|Individual tests can be distributed more finely than whole files.|Counts are not durations.|Data isolation remains required.|Hardware is independently provisioned.",
      "Why retain shard identities in merged evidence?|Detect missing partitions|Make every failing shard pass|Remove all setup overhead|Grant test data authorization|Completeness needs expected unique members.|Identity does not change outcomes.|Labels do not change runtime cost.|Authorization remains separate.",
      "Concurrent shard durations are 4, 7, 5 and 6 minutes; shared startup 2 and merge 1. What is modeled elapsed time?|10 minutes|25 minutes|7 minutes|18 minutes|2+max(4, 7, 5, 6)+1=10. This follows from the stated model and preserves the declared execution scope.|That adds overlapping work and overhead.|That omits startup and merge.|That is not the stated maximum-plus-overhead model.",
      "Four shards at 3 workers each use 2 DB connections per active worker. Capacity is 20. Which potential demand is correct?|24 connections, exceeding by 4|12 connections, leaving 8|20 connections, exactly full|6 connections, leaving 14|4×3×2=24 connections. This follows from the stated model and preserves the declared execution scope.|That omits connections per worker.|No stated throttling limits demand to 20.|That models one shard only.",
      "An eight-minute file dominates one shard while other files last one minute. What does equal file count fail to guarantee?|Balanced elapsed work across shards|The ability to count partition labels|The existence of any source files|That multiple jobs can be configured|A long file can dominate a file-level partition.|Labels remain countable.|Files clearly exist.|Configuration is possible but not balanced by count alone.",
      "Required partitions are 1/4, 2/4, 3/4, 4/4. Jobs accidentally run 1/4 twice and omit 4/4. All four jobs pass. Which evidence is missing?|The fourth unique partition despite four successful job records|All partitions because a duplicate invalidates every assertion|Nothing because the total job count is four|Only a prettier merged report title|Completeness depends on unique expected identities, not row count.|Other executed partitions retain their scoped results.|Duplicate membership cannot replace the missing partition.|Title formatting does not execute 4/4.",
      "A suite’s serial work is 24 minutes. Four shards each repeat 3 minutes setup, then balanced 6 minutes test work and 1 minute merge after all finish. What is parallel elapsed time under simultaneous starts?|10 minutes elapsed with 12 minutes aggregate setup work|28 minutes elapsed with 3 minutes aggregate setup work|7 minutes elapsed with no setup cost|13 minutes elapsed with 24 minutes aggregate setup work|3+6+1=10 elapsed; four setups consume 4×3=12 aggregate minutes.|That confuses total work with overlap and miscounts setup.|Setup still executes.|Both supplied calculations are incorrect.",
      "A backend permits at most 18 connections. Each worker needs 3, and three shards run concurrently. What is the largest uniform workers-per-shard setting within that limit?|2 workers per shard|3 workers per shard|6 workers per shard|9 workers per shard|3 shards×2 workers×3 connections=18; the next uniform setting exceeds it.|Three workers demand 27 connections.|Six demand 54 connections.|Nine demand 81 connections.",
      "Three shards share 18 DB connections. Each active worker consumes 3 connections. One required shard contains an indivisible 8-minute test; others take 4 and 5 minutes. Startup 1 and merge 1 run outside overlap. Which uniform worker setting and lower-bound runtime fit the contracts?|2 workers/shard and at least 10 minutes|3 workers/shard and at least 7 minutes|2 workers/shard and at least 8 minutes|6 workers/shard and at least 10 minutes|3×2×3=18 connections. The 8-minute indivisible test plus 1 startup and 1 merge gives at least 10 minutes even with more workers.|Three workers demand 27 connections, and parallelism cannot split the 8-minute test.|Eight omits mandatory startup and merge.|Six workers demand 54 connections, well above capacity."
    ],
    "comps": [
      "m1.c2"
    ]
  },
  {
    "slug": "report-contracts",
    "title": "Report test identities, outcomes and coverage honestly",
    "intro": "A dashboard says ninety-nine percent passed, but it combines retries with distinct test cases and silently excludes cancelled browser projects. The percentage is arithmetically plausible while its denominator does not match the release requirement.",
    "sections": [
      [
        "Choose an output for its audience",
        "A terminal reporter supports fast job triage; a machine-readable report supports downstream aggregation; an HTML report supports detailed inspection. Playwright 1.56.1 supports multiple reporters, so one run can produce a concise console view alongside a structured result. The formats are representations of observed execution, not independent confirmations that behavior passed.",
        "Use stable test identity together with project, source revision, shard and attempt information. A retry is another attempt of a case, not automatically another distinct requirement. Report discovered, executed, passed, failed, skipped and interrupted states according to a declared policy. Do not merge dissimilar populations into a single success denominator without retaining their component counts."
      ],
      [
        "Validate completeness before percentages",
        "A summary should reconcile expected test identities against received reports and reject malformed or mismatched results. A zero-test run, partial report or successful parser does not imply complete suite success. If ninety-eight of one hundred expected cases pass and two are skipped, the strict required pass proportion is ninety-eight percent; a dashboard that divides only by executed cases would show one hundred percent and conceal the missing evidence.",
        "The example calculates both denominators from supplied counts. It does not parse every JUnit dialect or execute Playwright reporters. JUnit consumers differ in how they interpret retries, nested suites and attachments, so validate the exact emitted format against the intended consumer rather than assuming that the file extension guarantees compatibility. Keep the runner’s exit outcome alongside report interpretation.",
        "Classified identities can include failures and skips. Retried attempts increase execution count without increasing distinct required cases; retain both populations."
      ]
    ],
    "code": "const expected=100,passed=98,skipped=2;\nconsole.log(passed/expected*100);console.log(passed/(expected-skipped)*100);",
    "expect": "98\n100",
    "problem": "Compare strict expected-case coverage with executed-only pass proportion.",
    "steps": [
      "Define the expected case count.",
      "Keep skipped cases visible in the required denominator.",
      "Label any executed-only proportion separately."
    ],
    "limit": "Only supplied count arithmetic executes; no provider or report-format parser is exercised.",
    "mistakes": [
      "Counting attempts as distinct cases inflates coverage.",
      "A valid report file can still contain incomplete execution."
    ],
    "takeaways": [
      "Preserve case and attempt identity.",
      "Choose and label denominators.",
      "Reconcile expected membership before grading."
    ],
    "practice": [
      "What does a retry add to a report?|Another attempt of a case|A new independent requirement by default|A new source revision automatically|A guaranteed passing outcome|Attempt identity differs from case identity.|Repeated attempts do not invent requirements.|Retry can use the same revision.|Retries can also fail.",
      "Which reporter serves downstream aggregation best?|Validated structured output|Only terminal color changes|Only a screenshot of the badge|Only the job display title|Structured output can be consumed with an explicit schema contract.|Colors are presentation.|Images omit structured identities.|Titles omit outcomes and membership.",
      "A parser reads a report successfully. What is not yet proven?|All required tests executed|The file was readable by that parser|The parse operation returned successfully|The parser accepted the supplied syntax|Syntax acceptance is weaker than completeness.|Readability was observed.|That operation completed.|Acceptance is the narrow result.",
      "Why label a pass-rate denominator?|Its population defines meaning|Any percentage is always universal|It makes skipped cases pass|It removes every flaky test|Expected-case and executed-only populations differ.|Scope matters.|Labels do not create passes.|Metrics do not repair failures.",
      "What should accompany a report result?|The test process outcome|Only the report background color|Only the HTML file size|Only an artifact download count|A file can exist even when execution failed.|Color is cosmetic.|Bytes do not grade behavior.|Downloads are unrelated to execution.",
      "A supplied count fixture prints 98 and 100. What does that demonstrate?|Different denominator policies|A complete real CI execution|Compatibility with every JUnit consumer|An actual product availability rate|The arithmetic compares expected and executed populations.|No runner executes.|No dialect parser runs.|Test counts are not uptime."
    ],
    "formal": [
      "What is the unit of distinct functional case coverage?|The case identity under its declared project|Every retry attempt counted as a new requirement|Every report view generated from the same run|Every terminal line printed by the reporter|A case and project define the required execution member.|Retries are attempts of that member.|Multiple views do not add executions.|Logging volume does not define coverage.",
      "Why support more than one reporter output?|Different consumers need different representations|Each reporter independently reruns every assertion|HTML output makes the test exit code irrelevant|A console report automatically verifies report authenticity|Representations serve terminal, machine and reviewer needs.|A reporter observes the same execution.|Exit status remains evidence.|Console text is not authenticity validation.",
      "What must precede a meaningful required pass percentage?|Expected-result reconciliation|Deleting skipped-result records|Counting every retry as a case|Ignoring project identities|The denominator and membership must match the contract.|Deletion hides gaps.|Attempts are not distinct coverage.|Projects may be required dimensions.",
      "Expected cases 100, passed 98, skipped 2. Which strict required proportion is correct?|98 percent with two missing executions|100 percent because only executed cases count|2 percent because skips are the only denominator|196 percent because two reporter formats exist|98/100=98 percent and skips remain visible.|That uses a different denominator and hides required gaps.|The stated proportion is not skip count.|Views do not multiply cases.",
      "A suite has 30 cases and 5 failed cases each retry twice. Every case eventually passes. How many distinct cases versus total attempts occurred?|30 cases and 40 attempts|40 cases and 40 attempts|30 cases and 35 attempts|35 cases and 30 attempts|Thirty initial attempts plus ten retries produce forty attempts for thirty cases.|Retries do not create new cases.|Each of five gets two additional attempts.|These counts reverse and understate the populations.",
      "A JUnit importer drops project names, merging Chromium and Firefox cases with identical titles. Which defect can result?|Project outcomes can overwrite or merge|Every browser assertion becomes inherently invalid|The source revision automatically changes during import|The report proves physical device coverage|Required project identity has been lost.|The assertions retain scoped observations.|Import naming does not alter source.|No hardware executes through naming.",
      "A suite expects 80 cases in each of two projects. Reports contain 80 Chromium cases and 70 Firefox cases, all passed. What is strict expected-case pass coverage?|150/160=93.75 percent with 10 missing|150/150=100 percent with no gap|80/160=50 percent because Firefox is ignored|160/160=100 percent because two reports exist|The expected matrix is 160 members and only 150 passed.|That denominator hides missing members.|Executed Firefox cases still count.|Report count does not establish membership.",
      "A process exits 1 after writing a syntactically valid report whose last chunk is missing. The importer returns success. Which release interpretation preserves the evidence?|Failed execution; incomplete evidence|Import success replaces the runner failure with a full-suite pass|The presence of XML proves every test completed|The report should be accepted solely because its filename ends.xml|Process outcome and completeness cannot be erased by format acceptance.|Parsing is a different boundary.|Syntax does not guarantee all cases.|An extension is not evidence of execution.",
      "A report has 120 expected case-project identities, 10 skips, 4 terminal failures and 106 passes. Which count reconciliation is correct?|All 120 are classified; required pass rate is 88.33 percent|All 120 passed because classified means successful|Only 110 exist because skipped identities are removed|Required pass rate is 96.36 percent using failures as the denominator|106+10+4=120; 106/120=88.33 percent rounded.|Classification is not success.|Skips remain expected identities.|That does not use the required expected-case denominator.",
      "A report expects 40 case-project identities. Four cases fail initially and each gets two extra attempts. Final records show 38 passes, one failure, one skip; all expected identities are present. Which summary preserves attempts, terminal status and strict required pass rate?|48 attempts; 38/40=95 percent; one failure and one skip|44 attempts; 38/39=97.44 percent; skip excluded as passed|48 distinct cases; 38/48=79.17 percent; no missing execution|40 attempts; 40/40=100 percent because every identity is classified|Forty initial attempts plus 4×2 retries gives 48 attempts, not 48 distinct cases. Required passing coverage is 38/40=95 percent; classification does not make failure or skip pass.|Two extra attempts per failing case adds eight, not four, and a required skip is not a pass.|Retry attempts do not add distinct required identities; the skipped case did not execute successfully.|Retries occurred, and classified outcomes include a failure and skip rather than forty passes."
    ]
  },
  {
    "slug": "artifact-provenance",
    "title": "Retain useful failure artifacts with bounded access",
    "intro": "A failed purchase flow has a trace and screenshot, but both were uploaded under the same name by several shards. The last upload obscures the earlier failure and a raw response header exposes a token.",
    "sections": [
      [
        "Bind artifacts to execution identity",
        "Artifact metadata should identify revision, run, project, shard, test and attempt as applicable. Separate artifact namespaces prevent concurrent jobs from overwriting one another. A file hash can detect changed bytes when compared with a trusted recorded value, but a hash alone does not establish who produced the file or whether it belongs to the required run. Bind content identity to trusted run metadata and access controls.",
        "Capture the information necessary for diagnosis: relevant actions, errors, screenshots or traces. Review the possible presence of secrets, cookies, request bodies and personal information before retention. Prefer synthetic data, bounded privileges and private access. A trace viewer is a diagnostic interface; opening a trace does not itself establish that every attached payload is safe to distribute."
      ],
      [
        "Treat retention as a lifecycle contract",
        "Define who may access diagnostic artifacts, how long they are retained and how deletion is verified under the organization’s policy. A seven-day retention requirement is not satisfied by an indefinite bucket with a filename containing seven. When artifacts expire, retain the non-sensitive result metadata required for the audit without pretending that the original full trace remains available.",
        "The fixture builds distinct artifact keys from supplied project, shard and attempt values, then counts uniqueness. It tests naming construction only. It does not upload files, configure storage lifecycle, redact trace bodies or authenticate a downloader. Those integration boundaries need separate operational evidence. Preserve a failed test result even if diagnostic upload itself fails; report the extra diagnostic gap rather than replacing the original failure.",
        "Validate artifact provenance and content integrity together. An old-run file with matching bytes and a current-run filename with mismatched bytes can both fail the required evidence contract."
      ]
    ],
    "code": "const rows=[{p:\"chromium\",s:1,a:0},{p:\"chromium\",s:2,a:0},{p:\"chromium\",s:1,a:1}];\nconst keys=rows.map(x=>`r7/${x.p}/shard${x.s}/attempt${x.a}`);\nconsole.log(new Set(keys).size);",
    "expect": "3",
    "problem": "Construct distinct synthetic diagnostic artifact namespaces.",
    "steps": [
      "Include project, shard and attempt in each key.",
      "Generate a key for all supplied records.",
      "Check uniqueness while keeping storage behavior outside the claim."
    ],
    "limit": "Only key construction executes; upload, access enforcement, retention and redaction do not.",
    "mistakes": [
      "An upload name is not an access-control policy.",
      "Hash equality does not authenticate the artifact producer."
    ],
    "takeaways": [
      "Bind bytes to trusted run metadata.",
      "Prevent concurrent artifact collisions.",
      "Bound access and retention."
    ],
    "practice": [
      "What prevents shard artifact name collisions?|Unique shard namespaces|A shared fixed filename|Only a longer timeout|Only a test title comment|The storage key needs concurrent identity separation.|A shared key can overwrite.|Time does not separate names.|Comments do not configure storage.",
      "What does a matching content hash establish narrowly?|Equality with the trusted recorded bytes|Authority of every artifact producer|Success of every test in the file|Permission for public distribution|The digest checks content identity under the trusted comparison.|Provenance requires more context.|Bytes may record failure.|Safety and access are separate decisions.",
      "Why review traces before retention?|They can contain sensitive data|They always contain no requests|They automatically redact every payload|Their filenames grant publication consent|Diagnostic detail can include tokens or personal data.|Traces can include network evidence.|Do not assume complete automatic sanitization.|Names are not authorization.",
      "What should a retention policy specify?|A bounded artifact lifetime|Only a decorative file suffix|Only a terminal color|Only a worker’s display name|Lifecycle needs an enforceable retention boundary.|A suffix does not delete bytes.|Color is presentation.|Names do not expire storage.",
      "Upload fails after the test fails. What should remain visible?|Both test failure and diagnostic gap|Only an invented test pass|Only uploader success|No result because no trace exists|The original failure remains even when evidence collection is incomplete.|Upload cannot reverse behavior.|The uploader failed too.|The test outcome is still evidence.",
      "What does a unique-key fixture verify?|The supplied key construction|Actual storage access enforcement|Real token redaction|Configured object expiration|No storage system executes in the local string fixture.|Access needs actual policy checking.|No trace payload is processed.|No lifecycle service runs."
    ],
    "formal": [
      "What binds a diagnostic artifact to the required execution?|Trusted run metadata plus content identity|Only a familiar-looking filename|Only a hash copied from the same untrusted upload|Only a screenshot’s visual appearance|Provenance and byte identity serve distinct linked needs.|Names can be misleading.|Self-asserted hashes do not authenticate origin.|Appearance cannot pin source or run.",
      "Why namespace artifacts by attempt?|Preserve evidence from different outcomes|Make all retries count as different requirements|Prevent any product failure from occurring|Prove every attempt used another source revision|Initial and retry artifacts can differ materially.|Attempts still belong to a case.|Naming does not repair behavior.|Revision requires explicit metadata.",
      "What remains after an original trace expires?|Only the retained evidence actually still available|Guaranteed permanent full diagnostic availability|Proof that no failure occurred|A new passing assertion result|Report the real retention boundary and remaining metadata.|Expired bytes are unavailable unless another authorized copy exists.|Expiration does not erase the historical event.|Deletion does not execute an assertion.",
      "Two shards upload trace.zip to one overwriteable key. What is the immediate evidence risk?|One shard’s artifact can replace the other|Both tests necessarily execute twice|The source revision becomes immutable automatically|The uploads prove all traces are sanitized|The namespace fails to separate concurrent owners.|Naming does not schedule tests.|Source identity is independent.|No sanitization follows from upload.",
      "A file’s hash matches but its run metadata says prior revision Q. Required evidence is forR. What conclusion follows?|Byte integrity does not make Q evidence current for R|A matching hash automatically changes provenance to R|The filename can safely replace the revision record|Every source revision is equivalent if hashes exist|Content identity and required-run identity both matter.|Hashes do not rewrite source.|Names are not stronger evidence than provenance.|Different revisions can change behavior.",
      "Artifacts total 3 GB per run, 20 runs daily, retained 7 days with uniform production and no compression. What is steady-state modeled storage?|420 GB|60 GB|21 GB|140 GB|3×20×7=420 GB under the supplied model.|Sixty is one day’s volume.|Twenty-one omits daily runs.|That omits per-run volume.",
      "A failure trace contains a token, the gate requires 7-day private retention and artifact identity includes shard/attempt. Which response meets all constraints?|Private, sanitized, unique, 7-day diagnostics|Publish the raw trace under a unique name for unlimited retention|Delete all outcome metadata and call the failed test passed|Keep the token because a hash proves the payload is safe|Confidentiality, lifetime and identity remain separate requirements.|Unique names do not satisfy privacy or retention.|Outcome evidence must remain honest.|A digest does not sanitize content.",
      "A metadata manifest lists three artifacts, but one file has a different hash and another belongs to a different run. How many are valid for this run if the third matches both?|One|Two|Three|Zero|Only the third satisfies integrity and provenance together.|The two mismatches violate different required contracts.|Manifest membership alone is insufficient.|The third is explicitly valid.",
      "Four shards each retain 2 attempts with 15 MB trace and 5 MB screenshot per attempt. What total is retained before compression?|160 MB|80 MB|40 MB|320 MB|4×2×(15+5)=160 MB. This follows from the stated model and preserves the declared execution scope.|That omits the second attempt.|That omits shard and attempt multiplicity.|That doubles the stated total.",
      "Required artifacts are current run R/shards 1 and 2, private, with 7-day expiry. Manifest lists R/1 hash H1 and R/2 hash H2. Storage contains matching R/1, H2 bytes tagged as old run Q/2, and R/2 with different hash H3. Which diagnosis is exact?|Only shard 1 valid; shard 2 has no integrity-and-provenance match|Both valid because H2 exists somewhere in storage|Neither valid because any mismatch invalidates unrelated H1|Shard 2 valid because its current filename outranks recorded hash|R/1 matches both trusted identity and bytes. Q/2 has wrong run; current R/2 has wrong bytes. Privacy and retention still need their own enforcement evidence.|Matching bytes from the wrong run do not establish current provenance.|A mismatch in shard 2 does not erase shard 1’s valid scoped match.|Filename identity cannot override an integrity mismatch."
    ]
  },
  {
    "slug": "trace-driven-triage",
    "title": "Use reports and traces to diagnose the first failing attempt",
    "intro": "A flaky test is green after retry, but the first attempt shows a rejected setup request before the UI assertion. The report should direct investigation to that earlier failure rather than suggesting that every timeout needs a larger limit.",
    "sections": [
      [
        "Read the causal sequence",
        "Start with the failing attempt’s inputs, environment and first divergence. A trace can show actions, snapshots and network activity that explain why an expected state never appeared. Distinguish product behavior, test assumptions and environment failures. A page assertion that fails after a setup403 may be downstream of missing authority rather than an issue with the rendered component.",
        "Playwright trace collection and viewing are distinct from passing test assertions. Trace policies such as retaining on failure or collecting a first retry affect which attempts have artifacts; verify the chosen configuration against the diagnostic need. A retry-only trace may not contain the original failure when the retry passes. Do not assume an attachment exists merely because a later result is green."
      ],
      [
        "Make remediation specific",
        "A useful issue links the failing revision, test/project/attempt, observed and expected behavior, relevant redacted evidence and the condition needed to reproduce it. Assign an owner and classify missing evidence explicitly. A screenshot may reveal layout but not establish whether a backend mutation committed; use the artifact appropriate to the failure boundary.",
        "The fixture chooses the first non-success step from a supplied ordered event list. It verifies sequence inspection, not an actual trace parser or causal inference engine. In the real investigation, timestamps across machines may have clock skew; avoid inventing exact cross-service ordering without a trusted correlation contract. Use operation ids and documented trace semantics to connect events rather than relying only on filename times."
      ]
    ],
    "code": "const events=[{step:\"setup\",ok:false},{step:\"render\",ok:false},{step:\"assert\",ok:false}];\nconsole.log(events.find(e=>!e.ok).step);",
    "expect": "setup",
    "problem": "Select the earliest observed failed prerequisite in supplied ordered events.",
    "steps": [
      "Read the stated event order.",
      "Find the first unsuccessful step.",
      "Investigate its relation to downstream symptoms."
    ],
    "limit": "The array fixture does not parse a Playwright trace or prove causality from real distributed clocks.",
    "mistakes": [
      "A passing retry may lack the original failure evidence.",
      "A downstream UI timeout can follow an earlier setup error."
    ],
    "takeaways": [
      "Inspect the failing attempt.",
      "Follow the earliest divergence.",
      "Match artifact type to the disputed boundary."
    ],
    "practice": [
      "A trace shows setup 403 before an absent receipt. Where should investigation begin?|Setup permissions|Only the receipt font size|Only report background color|Only the retry screenshot name|The rejected prerequisite precedes the missing result.|Typography does not authorize setup.|Presentation does not explain 403.|Names do not explain the request.",
      "Why retain first-attempt status?|Recovery can hide initial instability|Retries erase earlier events|Only final outcomes ever happened|Attempt identity is always irrelevant|The original failure remains meaningful evidence.|Events do not disappear.|Both attempts occurred.|Attempts can have different outcomes.",
      "What does a trace viewer provide?|Diagnostic execution evidence|Automatic product approval|A guaranteed root-cause verdict|A replacement for all assertions|It helps inspect observed behavior.|Approval remains human governed.|Evidence still needs interpretation.|Requirements still need checks.",
      "Which artifact best supports a disputed network response?|Redacted network evidence|Only a header screenshot|Only a test-name list|Only a count of source files|The evidence must exercise the disputed boundary.|Appearance may omit the response.|Names do not show payloads.|File counts do not observe network events.",
      "Why consider clock skew across services?|Timestamps may not define exact causal order|Every clock is always identical|Operation ids cannot correlate requests|All events must be ignored|Distributed timestamps need an ordering contract.|Synchronization cannot be assumed.|Ids can aid correlation.|Evidence remains useful within its limits.",
      "What does the event-list fixture verify?|Selection from supplied ordered records|Actual distributed clock synchronization|A complete native trace parser|Automatic causal proof|The fixture reads a predefined array.|No clocks execute.|No trace format is parsed.|Ordering alone does not prove cause."
    ],
    "formal": [
      "Which attempt should a flaky-test investigation preserve?|Original failure and context|Only the final green screenshot|Only the last upload’s filename|Only an unrelated successful job|The original divergence may vanish on retry.|Final evidence can omit the defect.|Names omit behavior.|Unrelated success does not explain this failure.",
      "What makes a triage issue actionable?|Scoped identity and observed divergence|Only the phrase test flaky|Only a count of all repository files|Only a terminal green color|The owner needs a reproducible, scoped observation.|A label omits the mechanism.|Counts omit behavior.|Color omits context.",
      "What limitation applies to a trace viewer?|Evidence still requires interpretation|It proves every retry is correct|It guarantees all secrets are redacted|It executes missing required tests automatically|A diagnostic view does not supply a causal verdict by itself.|Retries can fail or hide instability.|Payload handling needs review.|Viewing does not execute omitted cases.",
      "Trace setup returns 403, then panel polling times out. What targeted hypothesis matches the sequence?|Rejected setup prevented required data|The polling timeout proves successful setup|Every rendering component must be defective|Artifact compression caused the 403 response|The prerequisite failed before rendering could show its result.|The response contradicts setup success.|No universal rendering conclusion follows.|Compression is downstream diagnostic work.",
      "A trace policy records only a retry. The retry passes. What evidence can be absent?|Original failed-attempt sequence|Every later passing assertion result|The existence of the retry attempt|The recorded retry’s own activity|Retry collection may omit the initial failure.|The retry still has its own result.|It was executed.|Its trace can retain its activity.",
      "A screenshot shows a receipt but durability is disputed after server restart. Which additional evidence targets the requirement?|A real durability/recovery check|More screenshots of the same pre-restart receipt|A larger file-size threshold for the image|A different report theme for the same run|Rendering alone does not establish persistence across restart.|Repeated appearance does not exercise recovery.|Image size is unrelated.|Theme is presentation.",
      "Two service logs show response at 12:00:01 and request at 12:00:02, with clocks known to differ by up to 3 seconds. What inference is defensible?|Ordering needs stronger evidence|The response necessarily occurred before its own request|The request must be fabricated because timestamps differ|All local within-service sequencing is useless forever|The skew exceeds the one-second difference, so wall clocks alone cannot order them exactly.|Clock disagreement can explain apparent inversion.|No fabrication follows.|Local ordering can still be useful within a defined contract.",
      "A test fails on attempt 0 and passes on attempt 1. Only attempt 1 has a trace, and the issue asserts the trace proves the first failure was a locator race. Which correction is needed?|Mark the initial cause unresolved and reproduce with failing-attempt capture|Treat the passing trace as complete evidence for an unrecorded failure|Delete attempt 0 from the result to make the explanation consistent|Assume any timeout is a locator race without inspecting setup|The claimed cause exceeds the retained attempt evidence.|A later pass is not the missing failure sequence.|Removing evidence falsifies the outcome.|Timeout has several possible causes.",
      "A240-case run has 12 initial failures, 8 recoveries and 4 terminal failures. What rates preserve both populations?|5 percent initial failure and 1.67 percent terminal failure|1.67 percent initial failure and 5 percent terminal failure|3.33 percent initial failure and 1.67 percent terminal failure|5 percent initial failure and 3.33 percent terminal failure|12/240=5 percent; 4/240=1.6667 percent. Eight recoveries remain visible.|The rates are reversed.|3.33 percent is the recovery proportion.|Terminal failures number four, not eight.",
      "Attempt 0 creates operation K1 with setup 403, then waits for receipt K2; its trace is absent. Attempt 1 uses setup 200 for K2 and passes with a trace. Permission policy says 403 is rejection, not successful create. Durable recovery across restart is untested. Which investigation targets both observed initial defects?|Check setup authority and K1/K2 correlation; retain durability as unverified|Fix K1/K2 correlation only; treat setup 403 as a successful creation|Fix authority only; keep waiting for K2 after creating a different operation|Raise receipt timeout only; use retry trace as proof of restart durability|The initial setup was rejected and the receipt wait targets a different operation identity. Both need investigation with original-attempt capture; the passing retry and pre-restart receipt do not establish durability.|Correcting identity cannot turn an explicit rejected prerequisite into successful creation.|Authorized creation alone does not repair a wait bound to a different operation.|Waiting longer fixes neither rejected setup nor correlation; the retry does not execute restart recovery."
    ]
  },
  {
    "slug": "release-criteria",
    "title": "Turn release criteria into explicit evidence contracts",
    "intro": "A payment release has thousands of passing tests but no executed check for duplicate charge prevention. A useful quality gate should protect the required behavior rather than merely reward a large green count.",
    "sections": [
      [
        "Specify the decision before the run",
        "A release criterion names the requirement, required evidence boundary, expected population and pass rule. Examples include exact currency rounding at specified edges, tenant authorization against a real isolated API and the critical checkout interaction in each supported engine. A coverage percentage or test count can help locate gaps but cannot substitute for a missing named requirement.",
        "Separate hard correctness criteria from monitored trends. A critical invariant such as no unauthorized cross-tenant access may require every relevant check to pass. A noncritical trend such as average report-generation time may be monitored without blocking the same gate. Make the distinction explicit before results arrive so a failure does not provoke an undocumented denominator or threshold change."
      ],
      [
        "Evaluate a matrix rather than a badge",
        "Map requirements to the checks that can actually expose their failure. Unit arithmetic does not exercise browser focus, screenshots do not exercise keyboard navigation and fake responses do not validate the real adapter representation. The map should identify missing, stale and failed evidence, not only successful matches. A single check can support several requirements if it truly executes each relevant contract, but counts alone cannot establish that relationship.",
        "The fixture finds requirements not supported by a supplied set of executed evidence keys. It verifies a small set-difference operation. It cannot judge whether a real test is substantively adequate or configure merge policy. Human technical review remains necessary for that mapping, and every draft remains educational-review pending rather than published or approved.",
        "A required current artifact with mismatched bytes is untrusted evidence for that member; a duplicate of another shard or a historical same-name report cannot fill the missing identity."
      ]
    ],
    "code": "const required=[\"rounding\",\"tenant-auth\",\"keyboard\"];const executed=new Set([\"rounding\",\"keyboard\"]);\nconsole.log(required.filter(x=>!executed.has(x)).join(\",\"));",
    "expect": "tenant-auth",
    "problem": "Identify a missing named release requirement.",
    "steps": [
      "Declare all required behavior keys.",
      "List the evidence actually executed.",
      "Report missing keys instead of inferring coverage from total test count."
    ],
    "limit": "Only supplied requirement membership is checked; test adequacy and actual release settings are not executed.",
    "mistakes": [
      "A large passing count can coexist with one critical gap.",
      "Changing a failing threshold after the run changes the decision contract."
    ],
    "takeaways": [
      "Name the requirement and evidence boundary.",
      "Predeclare hard gates and trends.",
      "Keep missing evidence visible."
    ],
    "practice": [
      "What should a release criterion name?|Requirement and evidence rule|Only a desired green color|Only the total source line count|Only the largest test file|The decision needs an explicit behavioral contract.|Color is presentation.|Lines do not establish required behavior.|Size is not requirement coverage.",
      "Can formatter units replace tenant authorization evidence?|No, they exercise a different boundary|Yes, whenever the unit count is high|Yes, whenever their names mention tenants|Yes, if the report is formatted well|The failure mechanisms are different.|Counts do not change the boundary.|Names do not execute authorization.|Formatting is unrelated to permission enforcement.",
      "Why declare thresholds before execution?|Keep the decision contract stable|Make all failures impossible|Guarantee all tests run instantly|Remove the need for provenance|Predeclaration prevents selective reinterpretation of observed results.|Thresholds do not repair behavior.|Execution still costs time.|Evidence identity remains needed.",
      "What does a coverage percentage alone omit?|Which required behaviors were actually checked|The ability to express a numeric ratio|The possibility of recording a trend|The ability to compare the same metric later|A ratio can conceal critical missing requirements.|The ratio is numeric.|Trends can still be recorded.|Comparable measurements remain useful.",
      "A required keyboard path has only screenshots. What remains missing?|Real keyboard execution|Any visible image at all|Any possible report filename|Any numeric test count|Images do not execute keyboard navigation.|Screenshots already exist.|Naming is not the requirement.|A count could exist without interaction.",
      "What does a set-difference gate fixture establish?|Missing supplied requirement keys|Real test adequacy for every requirement|Actual production release approval|All provider branch protection rules|It compares predefined sets only. This follows from the stated model and preserves the declared execution scope.|Substantive adequacy needs review.|No release is approved.|No provider settings execute."
    ],
    "formal": [
      "What makes a hard gate meaningful?|A named invariant and required evidence policy|Only a universal minimum test count|Only a new dashboard color|Only the number of retry attempts allowed|The gate must connect execution to a decision.|Count alone omits behavior.|Color is cosmetic.|Retries do not define the requirement.",
      "What should a requirement-to-test map reveal?|Missing and mismatched evidence as well as coverage|Only successful checks while hiding all omissions|Only the longest source file for each module|Only a list of unrelated passing case names|The map supports gap decisions. This follows from the stated model and preserves the declared execution scope.|Selective evidence hides risk.|File size does not prove adequacy.|Names without relationships do not map requirements.",
      "Which action changes the decision contract after observing failure?|Raising the threshold to make the current run pass|Reporting the original threshold’s failed result|Recording the tested revision and environment|Retaining relevant redacted failure diagnostics|Changing the threshold alters what qualifies as success.|That preserves the rule.|Provenance preserves context.|Diagnostics preserve evidence.",
      "A release needs Rounding, Authorization, Keyboard. Evidence covers Rounding andKeyboard. What should the strict gate report?|Authorization evidence missing|All requirements covered by two test names|Keyboard missing because it is last alphabetically|No requirement can ever be covered|Set comparison leaves Authorization uncovered.|Count is not membership.|Keyboard is explicitly covered.|Two requirements do have evidence.",
      "A team has 1000 passing formatter tests but no duplicate-payment check. The gate requires idempotent payment delivery. What is the relevant gap?|The named deduplication behavior lacks evidence|The total count must be rounded to a higher number|Formatter success proves payment identity is stable|The gate can pass solely because 1000 is large|Unrelated passing checks do not exercise duplicate delivery.|Rounding count does not execute behavior.|Formatting does not establish payment identity semantics.|Count does not satisfy the invariant.",
      "A critical check passes with all service responses mocked. The requirement is actual tenant isolation at the API boundary. Which addition is needed?|A real scoped API permission check|More copies of the same fake-success response|A screenshot of the mock configuration file|A larger total number of formatter assertions|The named boundary must enforce the actual policy.|Copies repeat the assumption.|Configuration appearance does not execute permission enforcement.|Unrelated assertions cannot supply the missing boundary.",
      "A gate requires exact fee rounding, two rejection shapes and two-engine keyboard checkout. It has fee units, success-only API tests and mouse checkout on one engine. Which gaps remain?|Both rejection shapes and required keyboard/engine evidence|Only fee rounding because all unit tests are invalid|Nothing because API and UI layers each have some tests|Only more copies of the successful checkout screenshot|Layer presence is not the same as the required contracts.|The fee evidence may be valid within scope.|Named errors, modality and engine dimensions are missing.|Copies do not add the omitted dimensions.",
      "A threshold is<=2 percent terminal failure for a noncritical trend, while tenant-isolation failures block independently. A run has 1 percent terminal failure including one tenant breach. Which decision respects both rules?|Block on isolation despite the aggregate trend being within limit|Pass because the aggregate percentage is below 2 percent|Drop the isolation case from the denominator and call it covered|Raise the isolation allowance after seeing the result|The hard invariant is independent of the trend threshold.|Averages cannot override the explicit blocker.|Excluding it hides the invariant failure.|Changing the rule after observation does not meet the original contract.",
      "A release has 5 required invariants, 4 with current passing evidence and 1 with only a prior-revision result. What fraction has current evidence and what is strict gate status?|80 percent current, gate incomplete|100 percent current, gate passed|20 percent current, gate passed|80 percent current, gate automatically passed|4/5=80 percent; the fifth current result is missing.|Historical evidence is not current execution.|Four have current evidence.|Strict all-required semantics do not accept the missing member.",
      "Expected shard IDs are C1, C2, F1, F2 for revision R. Reports contain R/C1 pass, R/C2 pass, R/F1 pass, a second R/F1 pass, Q/F2 pass and an R/F2 artifact whose manifest hash differs from its bytes. How many unique current valid passes, and what exact evidence is missing?|3 valid passes; current integrity-valid F2 result missing|4 valid passes; duplicate F1 fills F2 coverage|4 valid passes; Q/F2 is current because its case name matches|2 valid passes; the invalid F2 artifact also invalidates F1|C1, C2, F1 are unique current valid members. F1 duplication adds none, Q/F2 is stale, and the current F2 artifact fails integrity, so F2 remains missing.|Required IDs are not interchangeable.|The revision mismatch prevents historical substitution.|F2’s defect does not invalidate independent valid F1 evidence."
    ]
  },
  {
    "slug": "metric-validity",
    "title": "Use quality metrics without distorting the release decision",
    "intro": "A new pipeline cuts average duration in half by excluding the slowest browser project. The headline improves even though the release now lacks evidence for a supported engine.",
    "sections": [
      [
        "Compare equivalent populations",
        "A metric needs a definition, population, window and unit. Runtime comparisons should retain project selection, case membership, runner capacity and environment differences. A shorter run after dropping required work is not evidence that the same work became faster. Likewise, a lower final failure rate after increasing retries does not establish better first-attempt stability.",
        "Track leading and lagging signals for their intended purpose. First-attempt failure rate exposes instability; terminal failure rate describes unresolved outcomes under a particular retry policy. Escaped defects reflect later observed impact but depend on reporting and deployment exposure. Code coverage records exercised structures under its tooling semantics; it does not prove correct assertions or complete requirement coverage."
      ],
      [
        "Use distributions and explicit rules",
        "Averages can hide a slow tail. For a sorted list of ten durations, this lesson uses nearest-rank p90: select rank ceil(0.9×10), the ninth value. Other tools use interpolation, so record the estimator before comparing outputs. Tail measurements need enough representative samples and comparable conditions; ten synthetic numbers are a calculation fixture, not a performance certification.",
        "The example sorts ten supplied durations and computes the nearest-rank p90. It does not generate load or measure CI wall time. A release comparison should also consider sample size, warmup, environment noise and the named threshold. Avoid treating a single local arithmetic result as service-level performance evidence or changing percentile definitions to obtain a favorable value.",
        "Nearest-rank p95over20samples selects the nineteenth sorted value. Grade initial failure independently of retry recovery and grade engine completeness independently of timing."
      ]
    ],
    "code": "const d=[1,1,1,1,1,1,1,1,4,8].sort((a,b)=>a-b);\nconsole.log(d.reduce((a,b)=>a+b,0)/d.length);\nconsole.log(d[Math.ceil(.9*d.length)-1]);",
    "expect": "2\n4",
    "problem": "Compare mean duration with a declared nearest-rank tail percentile.",
    "steps": [
      "Sort the supplied samples.",
      "Compute the mean over all ten.",
      "Select the ninth value for nearest-rank p90."
    ],
    "limit": "This is a percentile calculation over fixed inputs, not a native timing or load-test measurement.",
    "mistakes": [
      "Removing a required project changes the measured population.",
      "Final retry success does not imply first-pass stability improved."
    ],
    "takeaways": [
      "Define populations and estimators.",
      "Keep first-pass and final outcomes separate.",
      "Check tails and comparability."
    ],
    "practice": [
      "Why record a metric’s population?|It defines measured scope|Every ratio has universal meaning|It makes all projects equivalent|It removes measurement noise|Dropping work can change the number without improving the same workload.|Scope matters.|Different projects can behave differently.|Noise still needs handling.",
      "What can high code coverage fail to establish?|Correct assertions and required behavior coverage|That instrumentation recorded exercised structures|That its tool produced a numeric value|That the run emitted a coverage report|Execution coverage is not assertion adequacy.|That is the narrow recorded evidence.|A numeric result may exist.|The report can exist without adequate tests.",
      "What does first-attempt failure rate expose?|Initial instability before retries|Only final unresolved failures|Only artifact storage cost|Only the number of source files|Retry recoveries can hide initial failures.|That is a different metric.|Storage is separate.|File count does not measure outcomes.",
      "Why specify a percentile estimator?|Different definitions can return different values|Every percentile must equal the mean|Percentiles remove the need for samples|An estimator guarantees production availability|Nearest-rank and interpolated definitions can differ.|Mean and tail measure different things.|Samples remain necessary.|A formula does not certify a system.",
      "A run is faster after dropping Firefox. What claim needs more evidence?|The same required workload became faster|Firefox execution is absent from this run|The configured test population changed|The new runtime can be recorded|The comparison no longer measures the same workload.|That follows from the omission.|The population did change.|The duration itself may still be observed.",
      "What does the fixed percentile fixture not establish?|Real CI or service performance|The sum of its supplied durations|The sorted order of its samples|The selected nearest-rank index|No timing or load generation executes.|The sum is computed.|The list is sorted.|The rank is calculated."
    ],
    "formal": [
      "What is necessary for a fair runtime comparison?|Equivalent scope, capacity and definition|Only two numbers with the same color|Only a lower value in the newer report|Only a changed job name that sounds faster|The measured population and conditions affect interpretation.|Color does not establish comparability.|A lower value can result from omitted work.|Names do not define execution cost.",
      "What distinguishes terminal failures from initial failures?|Terminal outcomes depend on retry policy|Initial outcomes cannot ever be measured|Retries erase the original failing attempt|Both counts must always be identical|Recoveries change terminal counts without removing initial events.|First attempts can be recorded.|Historical events remain.|Recovery can make the counts differ.",
      "What does a percentile threshold require for interpretation?|Defined estimator and population|Only the word fast in the report|Only a larger number of source files|Only a different terminal theme|Definitions determine what value the threshold evaluates.|Labels do not specify a metric.|File count does not specify samples.|Presentation does not define the estimator.",
      "Sorted ten samples are 1, 1, 1, 1, 1, 1, 1, 1, 4, 8. What is nearest-rank p90?|4|2|8|1|ceil(.9×10)=9, whose value is 4. This follows from the stated model and preserves the declared execution scope.|Two is the mean.|Eight is the maximum and p 100.|One is below the ninth rank.",
      "A run has 200 cases, 20 initial failures and 5 terminal failures after retries. Which pair is correct?|10 percent initial and 2.5 percent terminal|2.5 percent initial and 10 percent terminal|7.5 percent initial and 2.5 percent terminal|10 percent initial and 7.5 percent terminal|20/200=10 percent; 5/200=2.5 percent. This follows from the stated model and preserves the declared execution scope.|Those rates are reversed.|7.5 percent is the recovered proportion.|Fifteen recoveries are not terminal failures.",
      "RunA executes 3 engines in 15 minutes. RunB executes 1 engine in 8 minutes on faster hardware. Which conclusion is supported?|Shorter observed run; unequal workload|The identical three-engine workload became 46.67 percent faster|All omitted engine checks implicitly passed on B’s hardware|The hardware change proves the omitted engines unnecessary|Both population and capacity changed, so isolate them before claiming comparable improvement.|The workloads are not identical.|Omitted checks did not execute.|Support requirements do not follow from hardware speed.",
      "A gate uses nearest-rank p95 on 20 sorted samples. Nineteen are 100 ms and one is 2000 ms. What p95 does that stated estimator return?|100 ms|2000 ms|195 ms|1050 ms|ceil(.95×20)=19; the nineteenth sample is 100 ms.|That is the twentieth sample and maximum.|195 is the mean, not this percentile.|That is an unrelated midpoint.",
      "A retry increase drops terminal failures from 6 to 1 while initial failures remain 12 out of 300. Which interpretation is accurate?|Initial 4 percent; changed terminal policy|The first-attempt failure rate dropped to 0.33 percent|The underlying failure mechanism is proven repaired|The two terminal rates are directly comparable without mentioning changed policy|12/300=4 percent in both runs; retries changed terminal outcome treatment.|One is the terminal count, not the initial count.|More retries do not demonstrate causal repair.|The policy change affects interpretation.",
      "A metric gate requires nearest-rank p90<=500 ms over 20 samples. Eighteen are 400 ms and two are 1200 ms. What is the stated gate result and a visible caveat?|Pass at 400 ms, while two slow samples remain outside that rank|Fail at 1200 ms because p90 always equals maximum|Pass at 480 ms because mean and p90 are identical|Fail because percentiles cannot be computed from 20 samples|ceil(.9×20)=18, and rank 18 is 400; the tail still includes two 1200 ms observations.|Maximum is a different statistic.|The mean is 480 but does not equal this p90.|The estimator is computable even if inference is limited.",
      "A gate needs all 3 engines, initial failure<=2 percent and nearest-rank p95<=1 second on 20 samples. All engines execute; 8 of 200 cases fail initially and recover. Samples are eighteen 0.4s values, one 0.9s and one 1.8s. Which result is correct?|Engine complete; initial 4 percent fails; p95 of 0.9 second passes|Engine complete; terminal 0 percent makes initial gate pass; p95 of 1.8 fails|Engine incomplete; initial 4 percent fails; p95 equals mean 0.495|Engine complete; initial 2 percent passes; p95 of 0.4 passes|8/200=4 percent initial failure. Rankceil(.95×20)=19 is 0.9 second. Engine evidence is complete, but the independent initial-failure gate fails.|Recovered terminal status does not change initial rate, and 1.8 is maximum rather than this p95.|All engines executed, and percentile is not mean.|The initial rate is 4 percent and the selected rank is the nineteenth value."
    ]
  },
  {
    "slug": "exceptions-and-freshness",
    "title": "Manage release exceptions and evidence freshness explicitly",
    "intro": "A quarantined critical test has been excluded for months because its tracking issue has no owner or expiry. A later report labels the pathway complete by reusing the last passing result from an older revision.",
    "sections": [
      [
        "Make an exception reviewable",
        "An exception records the affected requirement, reason, owner, scope, expiry, compensating evidence and authorized decision under the existing release policy. It should say what remains unknown. A quarantine changes execution or gating treatment; it does not transform a failed or skipped test into a passing behavioral result. Preserve the original outcome separately from the exception decision.",
        "Do not silently widen an exception from one project or test to an entire suite. If compensation is a manual or alternate automated check, identify its actual boundary and revision. A screenshot may compensate for a limited visual inspection but cannot establish tenant authorization or keyboard interaction unless those behaviors were actually exercised. The required approver and process belong to the organization’s policy; this lesson does not grant release authority."
      ],
      [
        "Bind reuse to exact evidence inputs",
        "Evidence reuse needs a defined validity rule. Source revision, dependency identity, test code, configuration and relevant environment can affect behavior. A historical passing result remains useful context, but changing its display label cannot make it current execution. If dependency-aware reuse is permitted, retain the exact fingerprints and scope that justify it, and clearly identify checks not rerun.",
        "The example evaluates an exception against a fixed current day and a named requirement. It checks matching scope and expiry only, not human authority or compensation adequacy. A complete operational system must enforce its real policy and retain the accountable decision. Keep curriculum drafts and assessment keys private while human review is pending; automated validation alone does not authorize publication or credentials.",
        "Evidence reuse and exceptions each have multiple conjunctive conditions. Exact hash equality is distinct from scope,approval and expiry; satisfying only some conditions is insufficient."
      ]
    ],
    "code": "const today=\"2026-11-11\";const exception={requirement:\"keyboard\",expires:\"2026-11-10\"};\nconsole.log(exception.requirement===\"keyboard\"&&exception.expires>=today);",
    "expect": "false",
    "problem": "Reject a scoped but expired synthetic exception.",
    "steps": [
      "Use a fixed ISO date for this fixture.",
      "Check the exact affected requirement.",
      "Compare the expiry without inventing approval authority."
    ],
    "limit": "The fixture checks supplied scope and date only; approval, policy enforcement and compensating test execution do not occur.",
    "mistakes": [
      "A historical pass is not automatically current evidence.",
      "An exception must not disguise a failed result as passed."
    ],
    "takeaways": [
      "Record owner,scope and expiry.",
      "Preserve the original outcome.",
      "State exact evidence reuse boundaries."
    ],
    "practice": [
      "What does a quarantine represent operationally?|A coverage exception|A guaranteed passing behavior|A deleted product requirement|A new source revision|Treatment changes without supplying the missing execution.|No pass is observed by skipping.|Requirements need separate decisions.|Quarantine does not change source identity.",
      "Why assign an exception owner?|Accountability for repair and review|Automatic proof of correct behavior|Automatic extension forever|Authority to hide all failures|Someone must follow the bounded remediation.|Ownership is not execution.|Expiry still matters.|Reporting must remain honest.",
      "What does an expiry prevent?|Unbounded exception reuse|Every future product defect|All missing test evidence|Any need for review|A deadline forces the exception back to decision.|It does not repair behavior.|Evidence can still be missing.|Expiry prompts review rather than removes it.",
      "Can an old pass be relabeled as a current run?|No, provenance must remain accurate|Yes, if its badge is still green|Yes, if the filename is changed|Yes, if a later report needs coverage|Labels do not execute changed source.|Color does not change revision.|Renaming does not rerun tests.|Coverage goals cannot invent evidence.",
      "What should remain alongside an approved exception?|Original outcome and scope|An invented successful assertion|Only an unrelated passing test|No record of affected requirements|Decision treatment and behavioral result are separate facts.|Approval does not create a passing execution.|Unrelated evidence cannot define the exception.|Scope is necessary for accountability.",
      "What does the expiry fixture not verify?|Actual approval authority|Its fixed date comparison|Its supplied requirement equality|Its resulting Boolean value|No human or policy authorization engine executes.|Date comparison runs.|Scope equality runs.|The Boolean is computed."
    ],
    "formal": [
      "What must an exception identify?|Requirement, owner, scope, expiry|Only the green dashboard theme|Only the total passing file count|Only a mutable branch label|It needs accountable bounded meaning.|Theme is presentation.|Counts omit the gap.|A branch label omits exception details.",
      "Why preserve historical evidence provenance?|Old observations remain tied to their actual inputs|Renaming a report reruns the old assertions|Any previous green means all future revisions pass|Evidence dates remove the need for source identity|History is useful when accurately scoped.|Renaming is not execution.|Future changes can alter behavior.|Dates alone do not identify code.",
      "What is required for justified evidence reuse?|Exact inputs under a validity rule|Only a passing result from any old branch|Only a human-friendly filename|Only a desire to shorten execution time|Reuse needs a defensible relationship to current work.|An arbitrary old pass is not enough.|Names do not establish equivalence.|Efficiency goals do not establish validity.",
      "An exception expiresNov 10 and the fixed current day isNov 11. What should the scope/date fixture return?|Invalid due to expiry|Valid forever because its requirement matches|A passing test assertion forNov 11|An automatic new approval lasting seven days|The date is beyond the permitted expiry.|Scope and date are both required.|No test behavior executes.|Renewal needs the actual policy process.",
      "An exception covers Firefox layout only. Chromium tenant authorization fails. What follows?|The exception does not cover the authorization failure|All failures in any engine are automatically waived|The tenant requirement is deleted by the layout exception|The authorization failure should be renamed layout|Both requirement and project scope differ.|Exceptions must remain bounded.|A waiver does not delete requirements.|Renaming falsifies the failure boundary.",
      "A prior pass is for source R, lock L, test T. Current work is source R, lock M, test T. The reuse rule requires all three exact. What is the valid decision?|Reuse is unestablished because lock differs|Reuse passes because any two fields are enough|Reuse passes because the source revision is the only relevant input|Change the manifest label from L toMwithout rerunning or justification|The declared exact-input rule is not met.|The rule requires all three.|Dependencies are explicitly part of this contract.|Relabeling does not establish execution equivalence.",
      "A critical skipped keyboard case has an owner and future expiry, but the release policy also requires explicit authorized approval and compensating keyboard evidence. Neither exists. Which conclusion follows?|The exception is incomplete and the behavioral gap remains|Owner and date alone satisfy every policy requirement|A visual screenshot automatically supplies keyboard execution|The skipped case should become a passing result|All declared conditions must be satisfied.|Those fields cover only part of the policy.|Appearance does not execute keyboard interaction.|An exception never creates a passing assertion.",
      "A review permits skipping one failing visual case for 7 days while a real keyboard gate remains mandatory. The report excludes the entire UI project. What is wrong?|The implementation widened the exception beyond its authorized scope|Every UI requirement was removed by the visual exception|A7-day date allows exclusion of any number of unrelated checks|The report may label all excluded keyboard checks as passed|One bounded exception does not authorize dropping other required behavior.|Requirements remain.|Time limits do not replace scope limits.|Skipped checks did not pass.",
      "Ten required cases have eight current passes, one failed case with a valid documented exception and one absent case outside that exception. What is the honest classification?|8 passes, 1 excepted failure, 1 missing|Ten passes because one exception covers every omission|Nine passes and one failure because exceptions count as assertions|Ten executed cases because every required identity has a name|The original outcome remains failure and the absent member remains missing.|Scope does not extend automatically.|Decision treatment is not a passing assertion.|Naming does not execute a case.",
      "Reuse requires exact source, lock and test hashes. Required shards A and B: A has current triple(R, L, T); B has old triple(R, M, T). An exception for B covers L but expired yesterday; a new unapproved exception covers M. Which outcome follows under exact reuse and approved-unexpired-exception rules?|A valid; B reuse invalid and neither exception applies|Both valid because two of B’s three hashes match|B valid because the expired exception mentions current L|B valid because matching Mscope removes approval need|Ameets the triple. B’s lock differs from required L; the old exception is expired and the new one is unapproved and has the wrong current lock scope.|The rule requires all exact inputs, not a majority.|Expiry is independently required.|Scope does not replace approval, and Mdoes not satisfy required L."
    ]
  }
];
module.exports=build("ci-test-reporting",units,[playwrightRef("ci-shards","test-sharding-js.md","Playwright 1.56.1: sharding and merged reports"),playwrightRef("ci-reporters","test-reporters-js.md","Playwright 1.56.1: reporters"),playwrightRef("ci-traces","trace-viewer.md","Playwright 1.56.1: trace viewer"),playwrightRef("ci-parallel","test-parallel-js.md","Playwright 1.56.1: parallel workers"),playwrightRef("ci-retries","test-retries-js.md","Playwright 1.56.1: attempts and retries")]);
