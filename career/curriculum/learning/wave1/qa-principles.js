'use strict';
const {build}=require('./qa-helper');
const bundle=build("qa-principles",[
  {
    "slug": "principles",
    "comp": "m1.c1",
    "title": "Use testing evidence without claiming exhaustive proof",
    "intro": "A payment service has too many combinations of users, amounts, currencies and failure timings to inspect every execution. Testing needs a defensible selection strategy rather than a promise to prove the absence of all defects.",
    "sections": [
      [
        "Understand the distinction",
        "Testing can reveal defects and increase confidence but cannot generally demonstrate their universal absence. Exhaustive testing is impractical for most nontrivial systems because inputs, histories, environments and timing combinations multiply.",
        "Defects often cluster in particular components or change areas. Historical defect data is useful for prioritization, but new or poorly observed components can still be risky. A low defect count may reflect little testing rather than excellent quality."
      ],
      [
        "Apply the evidence boundary",
        "Choose cases that challenge important partitions, boundaries and failure mechanisms. Repeatedly running unchanged cases can miss newly introduced behavior; periodically review their relevance and add different evidence where risk changes.",
        "A hospital permission change needs negative access checks even when existing happy paths pass. Testing should fit the context and expected use, not merely pursue a large test count or a cosmetically high coverage percentage."
      ]
    ],
    "problem": "Inspect the synthetic use testing evidence without claiming exhaustive proof example and compare its declared decisions.",
    "steps": [
      "Read the fixture inputs and policy before execution.",
      "Follow each calculation or decision using the stated assumptions.",
      "Compare the printed result with the expected output and identify what remains untested."
    ],
    "code": "import math\nchoices = [4, 5, 3, 2]\nprint(math.prod(choices))\nprint(math.prod(choices) > 20)",
    "expect": "120\nTrue",
    "limit": "This small executable model verifies the shown decision under synthetic inputs. It does not establish a complete delivery process or correctness of a production application.",
    "mistakes": [
      "Treating a local positive result as proof beyond its actual scope.",
      "Ignoring changed assumptions when reusing earlier evidence."
    ],
    "takeaways": [
      "Testing can reveal defects and increase confidence but cannot generally demonstrate their universal absence.",
      "Choose cases that challenge important partitions, boundaries and failure mechanisms."
    ],
    "practice": "What can a failing test demonstrate?|A discrepancy|Universal correctness|Every future failure|Perfect requirement quality|A failure supplies evidence of a discrepancy under the conditions actually exercised.\nWhy is exhaustive testing usually impractical?|Combinations multiply|Tools cannot compare values|Only developers may test|Defects never repeat|Inputs, histories, configurations and timing create a large execution space.\nA component has no reported defects but was barely tested. What is justified?|Evidence is limited|It is certainly defect-free|It needs no review|It has no business impact|Few observations cannot establish high quality when exposure and testing were limited.\nA test suite runs unchanged after requirements evolve. What should be reviewed?|Its continued relevance|Only report colors|Only branch names|Only machine branding|Passing old cases can leave new or altered behavior unexamined.\nA hospital adds a role but tests only valid access. What is missing?|Negative permission cases|Only more success logs|Only extra menu screenshots|Only a faster test runner|New authorization behavior needs evidence about disallowed access as well as allowed paths.\nA manager equates test count with confidence. What is omitted?|Risk and coverage meaning|Only the dashboard title|Only issue numbering|Only package names|Quantity alone does not establish that important behavior and failure mechanisms were examined.",
    "final": "What is the ordinary purpose of testing?|Gather behavior evidence|Prove every future input|Replace all engineering|Remove all uncertainty|Testing gathers bounded evidence about behavior and relevant risk.\nWhat contributes to a large test space?|Input and state combinations|Only source filenames|Only the test runner logo|Only team size|Combinations of inputs, histories and environments can grow rapidly.\nHow should defect clustering be interpreted?|A prioritization clue|A permanent safety proof|A ban on other tests|A guarantee of cause|Historical concentration can guide effort without proving other areas safe.\nA retail service repeatedly passes one checkout example. What remains uncertain?|Untested situations|That example\u2019s observation|The declared input|The reported output|One positive observation does not establish every other input, state or failure path.\nA bank\u2019s newest component has no defect history. What is sensible?|Assess its inherent risks|Skip it as proven safe|Copy only old counts|Assume zero impact|Lack of history is not evidence that a new component has low failure likelihood or impact.\nA logistics team adds retries but keeps only first-attempt tests. What needs attention?|Changed failure behavior|Only test report headings|Only source comment style|Only the issue identifier|Retry changes introduce relevant sequences that first-attempt cases do not establish.\nA hospital suite covers allowed records but no cross-patient request. What is the concern?|An uncovered access boundary|Too many assertions|Excessive negative testing|A guaranteed safe release|Happy paths cannot establish isolation between actors and private resources.\nA SaaS suite has high line coverage yet no useful assertions. What cannot be concluded?|Requirement satisfaction|That code executed|That instrumentation ran|That lines were counted|Execution coverage does not establish that meaningful expected behavior was checked.\nA university finds most failures in one parser. What is reasonable?|Focus and revisit scope|Test that parser forever only|Ignore every new change|Declare all other code safe|Clustering can guide focus while retaining contextual review of other important risks.\nA payment team asks for proof of no defects from finite tests. What is the sound response?|Bound the confidence claim|Promise universal absence|Replace uncertainty with count|Approve without an oracle|Finite observations usually cannot prove universal absence of defects in a nontrivial system."
  },
  {
    "slug": "review-learning",
    "comp": "m1.c1",
    "title": "Adapt coverage to context and changing risk",
    "intro": "An LMS test pack was effective for a single campus but now supports several tenants. Reusing it is useful, yet tenant boundaries create new questions that the old pack never asked.",
    "sections": [
      [
        "Understand the distinction",
        "The same testing technique has different value under different risks. A calculator, a patient record service and a game do not share identical assurance needs. Consider user harm, regulation, architecture, change frequency and operating conditions.",
        "Review tests as the product and knowledge change. Repeated cases can confirm regression behavior, but they should not crowd out new distinctions or failure sequences. Tests that no longer assert an intended rule can become misleading maintenance burden."
      ],
      [
        "Apply the evidence boundary",
        "Keep a coverage model that names meaningful things such as requirements, risks, roles or transitions. A reported percentage has no meaning without its denominator and evidence rule. Do not add duplicate cases merely to improve the count.",
        "For multi-campus enrollment, inspect tenant scope, shared identity, imports and background jobs. Record what each test establishes and which assumptions are simulated. A mock\u2019s success cannot automatically prove a real provider contract."
      ]
    ],
    "problem": "Inspect the synthetic adapt coverage to context and changing risk example and compare its declared decisions.",
    "steps": [
      "Read the fixture inputs and policy before execution.",
      "Follow each calculation or decision using the stated assumptions.",
      "Compare the printed result with the expected output and identify what remains untested."
    ],
    "code": "covered = {\"own_read\", \"same_tenant_write\"}\nrequired = {\"own_read\", \"same_tenant_write\", \"cross_tenant_denied\"}\nprint(sorted(required - covered))",
    "expect": "['cross_tenant_denied']",
    "limit": "This small executable model verifies the shown decision under synthetic inputs. It does not establish a complete delivery process or correctness of a production application.",
    "mistakes": [
      "Treating a local positive result as proof beyond its actual scope.",
      "Ignoring changed assumptions when reusing earlier evidence."
    ],
    "takeaways": [
      "The same testing technique has different value under different risks.",
      "Keep a coverage model that names meaningful things such as requirements, risks, roles or transitions."
    ],
    "practice": "Why tailor a test approach?|Risks differ|All systems are identical|One tool proves everything|Testing has no context|Assurance needs depend on the product, users, architecture and consequences of failure.\nWhat does a coverage percentage require?|A defined denominator|Only a large numerator|Only a test report badge|Only a fast machine|Coverage must state what population is counted and what qualifies as covered.\nA one-campus LMS becomes multi-tenant. What is a useful new concern?|Tenant boundaries|Only the site logo|Only module filenames|Only the language setting|New ownership scopes create access and data-isolation behavior that earlier tests may not cover.\nA mock always returns success. What remains untested?|Real failure behavior|That the mock returned|The fixture configuration|The local call path|A fixed successful substitute does not establish provider failures or real compatibility.\nA repeated case no longer matches the intended rule. What should happen?|Review or replace it|Preserve it as authority|Rename it as current|Ignore the rule change|Tests need a current defensible oracle rather than asserting obsolete behavior.\nA suite adds duplicate cases to raise a count. What improves little?|Distinct risk evidence|The number of files|The report size|The execution count|Repeated equivalent observations do not necessarily address additional risks.",
    "final": "What makes coverage interpretable?|Its model and evidence rule|Only a percent sign|Only a bigger case count|Only a newer tool version|Coverage describes a named population and how evidence relates to it.\nWhy review an established regression suite?|Product knowledge changes|Past tests never help|Only new tools find bugs|Old assertions are always wrong|Existing tests remain useful but their relevance and gaps can change.\nWhat is an example of contextual testing?|Adjusting for patient risk|Using one identical plan always|Ranking by file counts|Replacing all checks with a badge|A context-sensitive strategy reflects consequences and relevant system characteristics.\nA hospital imports a new file format. What should be reconsidered?|Parser and data risks|Only the report branding|Only the story number|Only the branch title|New inputs can change validity, security and integrity assumptions beyond old coverage.\nA bank reports 90% coverage but cannot name its denominator. What is the issue?|An ambiguous metric|A guaranteed strong result|A complete acceptance basis|An automatically valid oracle|Without a population and evidence definition, the percentage cannot support a clear claim.\nA retailer mocks inventory with unlimited stock. What should integration tests examine?|Actual scarcity behavior|Only mock call count|Only a success screenshot|Only test naming|The simplified substitute omits stock boundaries and coordination that matter in real use.\nAn LMS changes from one to several organizations. Which case adds distinct value?|Cross-tenant rejection|Another identical own-read|Another unchanged homepage|Another copy of the same login|A new boundary case supplies evidence absent from repeated normal access.\nA logistics test assumes immediate provider delivery. What limitation should be stated?|Asynchronous outcomes omitted|All deliveries are guaranteed|The provider is fully verified|Retries cannot matter|A synchronous fixture does not establish delayed, uncertain or repeated external effects.\nA SaaS release removes a legacy rule. What should happen to related assertions?|Reassess their oracle|Keep every expected value|Suppress all failures|Declare the rule still current|Assertions should reflect intended behavior and preserve historical evidence separately.\nA healthcare platform trades test time between low-risk styling and access isolation. What governs priority?|Consequences and uncertainty|Only source line count|Only alphabetical order|Only developer preference|Risk-informed testing considers failure impact, likelihood and evidence gaps."
  },
  {
    "slug": "verification-validation",
    "comp": "m1.c2",
    "title": "Separate conformance from fitness for use",
    "intro": "A report matches its written specification yet staff cannot use it to make the required decision. Correct construction and solving the right problem are related but different questions.",
    "sections": [
      [
        "Understand the distinction",
        "Verification asks whether work products meet specified requirements or conditions. Reviews, static analysis and execution evidence can contribute. Validation asks whether the resulting system is suitable for intended use and stakeholder needs in its relevant context.",
        "These concerns overlap and can occur throughout development. Do not reduce verification to no execution or validation to only final customer testing. A specification can itself be incomplete or wrong, so conformance alone is insufficient."
      ],
      [
        "Apply the evidence boundary",
        "A hospital schedule might follow a documented sort order but hide urgent patients. The implementation can conform to that rule while failing its operational purpose. Discuss intended decisions and realistic scenarios with the appropriate users.",
        "Record who supplied the intended-use criteria, which population and environment were represented, and which limitations remain. Stakeholder approval is useful but does not automatically prove all users, accessibility needs or operating contexts are covered."
      ]
    ],
    "problem": "Inspect the synthetic separate conformance from fitness for use example and compare its declared decisions.",
    "steps": [
      "Read the fixture inputs and policy before execution.",
      "Follow each calculation or decision using the stated assumptions.",
      "Compare the printed result with the expected output and identify what remains untested."
    ],
    "code": "spec_columns = [\"student\", \"score\"]\nactual_columns = [\"student\", \"score\"]\nneeded_for_decision = {\"student\", \"score\", \"status\"}\nprint(actual_columns == spec_columns)\nprint(needed_for_decision <= set(actual_columns))",
    "expect": "True\nFalse",
    "limit": "This small executable model verifies the shown decision under synthetic inputs. It does not establish a complete delivery process or correctness of a production application.",
    "mistakes": [
      "Treating a local positive result as proof beyond its actual scope.",
      "Ignoring changed assumptions when reusing earlier evidence."
    ],
    "takeaways": [
      "Verification asks whether work products meet specified requirements or conditions.",
      "A hospital schedule might follow a documented sort order but hide urgent patients."
    ],
    "practice": "What does verification examine?|Specified conformance|Every user preference|All future market demand|Only production profits|Verification asks whether work meets declared requirements or conditions.\nWhat does validation examine?|Fitness for intended use|Only syntax validity|Only compiler success|Only file naming|Validation asks whether the outcome meets relevant user needs in context.\nA report matches its specification but lacks a needed decision field. What is possible?|Conformance without fitness|Universal user satisfaction|No requirement gap|Proof of complete value|A correctly implemented specification can still fail intended use.\nMust verification exclude execution?|No|Always|Only in production|Only for mobile software|Verification can use reviews, analysis and dynamic evidence depending on the condition examined.\nA team validates only with its own developers. What needs consideration?|Represented user needs|Only developer seniority|Only test framework age|Only ticket count|The sample may not represent the people and contexts for whom the product is intended.\nA hospital approves a prototype. Does that prove every operating context?|No|Yes for every user|Yes without limitations|Only if screenshots exist|Approval supplies bounded evidence and does not establish all relevant populations or conditions.\nA university checks grade calculations against an agreed rule. Which concern is primary?|Specified conformance|Market popularity|Staff payroll|Office location|Comparing output to an agreed calculation rule primarily supplies verification evidence.\nA retailer observes cashiers using the checkout flow. What can this inform?|Intended-use suitability|Every future failure|Cryptographic safety|All regulatory obligations|Representative use can reveal whether the workflow meets real needs, within its observed scope.",
    "final": "Which question is most directly verification?|Does it meet the stated rule?|Will every customer buy it?|Will all users like it?|Will every market grow?|Verification concerns conformance with declared requirements or conditions.\nWhich question is most directly validation?|Does it serve intended use?|Does it use a chosen file name?|Does the compiler exit zero?|Does every class have comments?|Validation evaluates suitability for user needs and context.\nCan a validly implemented specification be inadequate?|Yes|Never|Only if no code exists|Only if tests are absent|The specified behavior may omit or misunderstand the actual need.\nA hospital queue follows its documented order but hides urgency. What needs examination?|Operational fitness|Only formatting syntax|Only compiler warnings|Only artifact identity|Intended clinical use can fail even when a documented sorting rule is implemented.\nA bank checks interest arithmetic against its approved rule. What evidence is this primarily?|Verification evidence|Proof of customer delight|A market forecast|A complete usability study|The comparison examines conformance to a specified calculation.\nA logistics prototype is trialed with dispatchers. What should be documented?|Use context and limitations|Only the team nickname|Only source file names|Only the test runner logo|Validation evidence depends on represented users, scenarios and operating assumptions.\nAn LMS specification never addressed screen readers. What can passing its narrow tests fail to establish?|Accessible intended use|The observed narrow result|That test execution happened|The saved arithmetic output|Conformance to incomplete criteria does not establish accessibility for relevant users.\nA retail manager signs off after one demonstration. What should not be inferred?|All-user suitability|The demonstration occurred|A decision was recorded|That a sample was observed|A limited approval does not establish all populations, workloads or failure situations.\nA SaaS team claims validation is only a final phase. What is more accurate?|Learn throughout delivery|Never involve users early|Wait until all decisions freeze|Exclude all prototypes|Early examples, prototypes and representative use can inform fitness before final release.\nA patient portal meets every recorded rule but users cannot complete key tasks. What is needed?|Revisit needs and criteria|Only repeat passing checks|Declare user error universally|Suppress all usability evidence|The discrepancy indicates a possible gap between written rules and intended use."
  },
  {
    "slug": "levels",
    "comp": "m2.c1",
    "title": "Choose unit and integration evidence for the boundary",
    "intro": "A fee calculator has a correct formula but reads the wrong enrollment field from storage. Unit and integration tests address different boundaries, so both the calculation and its wiring need evidence.",
    "sections": [
      [
        "Understand the distinction",
        "Unit testing examines a small selected component under controlled conditions. Isolation can make feedback fast and failures easier to localize, but a substitute may omit actual protocol, persistence or configuration behavior.",
        "Integration testing examines collaboration across a chosen boundary, such as a repository and its database or an API client and service contract. Name the components and whether substitutes are used instead of assuming the label proves realism."
      ],
      [
        "Apply the evidence boundary",
        "For fee calculation, use small unit cases for arithmetic and a local isolated integration fixture for the actual field mapping and constraints. A unit test of a repository mock cannot prove a real schema accepts the intended operation.",
        "Choose the least costly evidence that meaningfully addresses each risk, then add broader evidence where interactions matter. More expensive does not automatically mean more valuable, and fast does not imply complete."
      ]
    ],
    "problem": "Inspect the synthetic choose unit and integration evidence for the boundary example and compare its declared decisions.",
    "steps": [
      "Read the fixture inputs and policy before execution.",
      "Follow each calculation or decision using the stated assumptions.",
      "Compare the printed result with the expected output and identify what remains untested."
    ],
    "code": "def fee(amount, discount):\n    return amount - discount\nassert fee(100, 20) == 80\nrow = {\"amount\": 100, \"discount\": 20}\nprint(fee(row[\"amount\"], row[\"discount\"]))",
    "expect": "80",
    "limit": "This small executable model verifies the shown decision under synthetic inputs. It does not establish a complete delivery process or correctness of a production application.",
    "mistakes": [
      "Treating a local positive result as proof beyond its actual scope.",
      "Ignoring changed assumptions when reusing earlier evidence."
    ],
    "takeaways": [
      "Unit testing examines a small selected component under controlled conditions.",
      "For fee calculation, use small unit cases for arithmetic and a local isolated integration fixture for the actual field mapping and constraints."
    ],
    "practice": "What does a unit test usually narrow?|A selected component|Every system dependency|All user workflows|Only release permission|A small selected boundary supports focused feedback under controlled assumptions.\nWhat is integration testing concerned with?|Collaborating boundaries|Only one arithmetic value|Only naming conventions|Only staff acceptance|Integration evidence examines how selected components work together.\nA mock repository returns expected data. What is not established?|Real database mapping|The mock response|The local calculation|The fixture assertion|A substitute does not establish actual storage schema or field wiring.\nA fee formula works but reads the wrong column in production. What evidence helps?|A mapping integration check|Another identical formula case|Only a UI color check|Only a code-count report|The failure lies at component collaboration rather than arithmetic alone.\nA team labels a test integration without saying what is real. What is missing?|Boundary definition|A longer test name|An extra report icon|A different compiler|The label is interpretable only when components and substitutes are explicit.\nA slow broad test duplicates a focused rule case. What should guide retention?|Distinct risk evidence|Runtime alone|The author job title|Only file size|The value of a test depends on relevant unique evidence and maintenance cost.",
    "final": "What can isolation improve?|Failure localization|Universal realism|All-user acceptance|Guaranteed deployment safety|A narrow controlled boundary can make feedback and diagnosis easier.\nWhat should an integration test name?|Component boundary|Only a function prefix|Only a server brand|Only a staff role|The selected interacting components define what the test establishes.\nDoes a mock prove real protocol compatibility?|No|Always|Only if it is fast|Only with many assertions|A substitute can diverge from the actual provider or schema.\nAn LMS arithmetic unit suite passes while database fields are swapped. What is needed?|Real mapping evidence|Only more arithmetic repeats|Only screenshot updates|Only branch protection|Correct internal calculations do not establish correct connection to stored fields.\nA retailer changes a database constraint. Which test is relevant?|An isolated storage check|Only a pure string helper|Only homepage appearance|Only an old mock response|The actual engine boundary should be exercised for its relevant constraint behavior.\nA bank uses an in-memory substitute with different transaction rules. What must be stated?|The substitute limitation|Full production equivalence|Guaranteed concurrent safety|Automatic schema approval|A simpler store may not reproduce actual engine semantics.\nA logistics API client parses a canned success response. What remains uncertain?|Provider contract behavior|That local parsing occurred|The fixture JSON fields|The declared expected value|A canned response does not establish the live or representative service contract and failure cases.\nA hospital wants every test to use production data for realism. What is preferable?|Isolated synthetic data|Unrestricted copied records|No privacy boundaries|Only public error logs|Relevant integration evidence can use isolated synthetic data without exposing real records.\nA SaaS team counts every mock-based check as end-to-end. What is wrong?|The evidence scope claim|The existence of assertions|The use of automation|The saved test output|A test using substitutes should not be described as covering actual omitted dependencies.\nAn application has many pure-function tests but repeated wiring failures. What should change?|Boundary coverage|Only the test badge|Only naming style|Only developer ranking|The observed failure mechanism suggests missing collaboration evidence rather than insufficient counts alone."
  },
  {
    "slug": "system-acceptance",
    "comp": "m2.c1",
    "title": "Connect system journeys to acceptance decisions",
    "intro": "A hospital booking system integrates identity, scheduling and notifications. A working repository check does not establish that a receptionist can complete the full booking journey.",
    "sections": [
      [
        "Understand the distinction",
        "System testing examines the integrated system within a defined environment. End-to-end checks may follow a selected journey through multiple layers, but their real and simulated dependencies should still be stated. One journey does not cover every role or failure path.",
        "Acceptance testing evaluates criteria for a stakeholder decision, such as user, operational or contractual acceptance. Acceptance is not simply another word for a browser test or an automatic guarantee of readiness."
      ],
      [
        "Apply the evidence boundary",
        "For booking, check that the appropriate actor can find an available slot, reserve it and observe the correct outcome. Also inspect meaningful failures such as a lost slot or unauthorized patient access. Use controlled substitutes for external notifications when appropriate and label that limit.",
        "Balance a small set of high-value broad journeys with focused tests. Broad failures can be expensive to diagnose, so preserve evidence about intermediate boundaries and avoid making every rule depend on fragile UI navigation."
      ]
    ],
    "problem": "Inspect the synthetic connect system journeys to acceptance decisions example and compare its declared decisions.",
    "steps": [
      "Read the fixture inputs and policy before execution.",
      "Follow each calculation or decision using the stated assumptions.",
      "Compare the printed result with the expected output and identify what remains untested."
    ],
    "code": "steps = {\"signed_in\": True, \"authorized\": True, \"slot_reserved\": True, \"confirmation_visible\": False}\nprint(all(steps.values()))\nprint([k for k, v in steps.items() if not v])",
    "expect": "False\n['confirmation_visible']",
    "limit": "This small executable model verifies the shown decision under synthetic inputs. It does not establish a complete delivery process or correctness of a production application.",
    "mistakes": [
      "Treating a local positive result as proof beyond its actual scope.",
      "Ignoring changed assumptions when reusing earlier evidence."
    ],
    "takeaways": [
      "System testing examines the integrated system within a defined environment.",
      "For booking, check that the appropriate actor can find an available slot, reserve it and observe the correct outcome."
    ],
    "practice": "What does system testing examine?|The integrated system|Only an isolated formula|Only a policy document|Only a job title|System testing supplies evidence about an integrated system in its stated environment.\nWhat guides acceptance testing?|Acceptance criteria|Only browser automation|Only unit-test names|Only server uptime|Acceptance evaluates relevant criteria for a stakeholder readiness decision.\nA receptionist cannot see a booking confirmation. Which evidence is relevant?|The booking journey|Only a repository insert|Only a pure date helper|Only a CSS variable check|The complete intended workflow includes the observable user outcome.\nAn end-to-end test replaces the mail provider. What should be recorded?|The simulated boundary|Full real delivery proof|Automatic inbox receipt|Guaranteed provider behavior|Substituted services limit the claims supported by the journey test.\nA browser case passes for one role. What cannot be inferred?|Every role is covered|That the case passed|That its session existed|That one page loaded|One actor\u2019s journey does not establish other permission scopes or workflows.\nA broad test fails with no intermediate evidence. What suffers?|Diagnosis|The source filename|The team calendar|The report color|Broad failures need useful boundary observations to localize the discrepancy.",
    "final": "What is an end-to-end test commonly organized around?|A selected journey|Every possible input|Only a helper method|Only a compiler warning|A broad journey follows a meaningful path across defined system boundaries.\nWhat does operational acceptance concern?|Operating readiness|Only user color preference|Only variable naming|Only one arithmetic output|Operational criteria can include monitoring, recovery and support readiness.\nDoes a browser test automatically equal acceptance?|No|Always|Only on desktop|Only in a paid tool|Acceptance depends on the criteria and decision context, not the execution tool alone.\nA hospital stores a booking but never shows its outcome. What may fail?|The intended workflow|The record insertion observation|The fixture database existence|The compiled page bundle|System usefulness includes the observable journey, not just one successful internal step.\nA university tests only a staff role. Which claim exceeds evidence?|All-student readiness|The staff case result|The tested artifact identity|The observed response status|A staff scenario does not establish student permissions or needs.\nA retail journey uses fake payment acceptance. What remains to test separately?|Real contract behavior|The simulated page transition|The mock response value|The local success branch|A provider substitute does not prove actual payment semantics or failures.\nA bank has one happy-path system test. What should supplement it?|Important failure journeys|Only identical successful repeats|Only more report pages|Only higher line counts|Critical denials, state conflicts and dependency failures need distinct evidence.\nA logistics UI suite is fragile and duplicates all business rules. What improves the balance?|Focused lower-level evidence|Removing every journey|Adding more waits everywhere|Declaring flakiness acceptable|Appropriate focused tests can check rules while broad tests cover selected integration journeys.\nA SaaS release meets user criteria but has no recovery evidence. What remains?|Operational acceptance risk|Guaranteed universal readiness|A defect-free deployment|A complete incident plan|User-facing success does not establish operating and recovery readiness.\nA patient portal acceptance decision excludes users with assistive technology. What should be explicit?|Represented population gaps|Only the approver title|Only the test tool license|Only source formatting|Acceptance evidence must identify which relevant users and contexts were represented."
  },
  {
    "slug": "types",
    "comp": "m2.c2",
    "title": "Separate functional results from quality attributes",
    "intro": "A dashboard returns correct totals but becomes unusable under its expected workload. Functional behavior and quality attributes both matter, and one kind of passing evidence cannot replace the other.",
    "sections": [
      [
        "Understand the distinction",
        "Functional testing examines what the system does: calculations, permissions, state changes and returned outcomes. Non-functional testing examines relevant quality characteristics such as performance, usability, accessibility, security or recovery under defined conditions.",
        "The categories can overlap. An authorization denial is an observable function with a security purpose. Use the distinction to identify obligations and evidence, not to argue that a security-related check can never be functional."
      ],
      [
        "Apply the evidence boundary",
        "A performance claim needs workload, timing boundaries, environment and acceptable measures. A single stopwatch reading without context does not establish a service-level promise. Accessibility likewise requires defined criteria and representative interaction evidence.",
        "Keep correctness assertions during load or recovery experiments. A fast incorrect answer is not a successful performance outcome, and a restored process with corrupted records does not establish successful data recovery."
      ]
    ],
    "problem": "Inspect the synthetic separate functional results from quality attributes example and compare its declared decisions.",
    "steps": [
      "Read the fixture inputs and policy before execution.",
      "Follow each calculation or decision using the stated assumptions.",
      "Compare the printed result with the expected output and identify what remains untested."
    ],
    "code": "result = {\"total_correct\": True, \"elapsed_ms\": 850, \"budget_ms\": 500}\nprint(result[\"total_correct\"])\nprint(result[\"elapsed_ms\"] <= result[\"budget_ms\"])",
    "expect": "True\nFalse",
    "limit": "This small executable model verifies the shown decision under synthetic inputs. It does not establish a complete delivery process or correctness of a production application.",
    "mistakes": [
      "Treating a local positive result as proof beyond its actual scope.",
      "Ignoring changed assumptions when reusing earlier evidence."
    ],
    "takeaways": [
      "Functional testing examines what the system does: calculations, permissions, state changes and returned outcomes.",
      "A performance claim needs workload, timing boundaries, environment and acceptable measures."
    ],
    "practice": "What is functional evidence about?|Required behavior|Only CPU model|Only staff preference|Only release dates|Functional checks examine specified outcomes and operations.\nWhat does a latency target need?|Measurement context|Only a speed slogan|Only a test tool logo|Only a modern server|Timing claims require workload, boundaries and operating conditions.\nA report is fast but wrong. Is its performance goal necessarily met?|No|Always|Only for small users|Only with a cache|Performance evidence should retain correctness obligations rather than rewarding incorrect speed.\nAn authorization denial is tested. Can it have both functional and security meaning?|Yes|Never|Only if manual|Only if slow|A required observable denial is functional behavior serving a security objective.\nA restore starts the server but loses records. What remains failed?|Recovery integrity|Only process startup|Only status branding|Only a test counter|Recovery success includes relevant data and service obligations, not just a running process.\nA chart says fast without a workload. What is weak?|The performance claim|Only its color|Only the title font|Only the report ordering|A context-free adjective does not provide a defensible measurable target.\nA dashboard works with mouse only. What needs evidence?|Accessible interaction|Only source coverage|Only deployment count|Only test badge size|Relevant accessibility criteria require interaction evidence beyond a mouse happy path.\nA load test omits correctness checks. What can it miss?|Fast invalid results|Only slow startup|Only package metadata|Only uncompiled files|Observed throughput or latency can look good even when returned behavior is wrong.",
    "final": "Which question is primarily functional?|Is the total correct?|What is peak latency?|What is restore duration?|How much memory is used?|A total calculation concerns the required result of an operation.\nWhich claim needs workload context?|Response latency|A field name|A recorded status label|A story identifier|Latency changes with workload and operating conditions.\nAre functional and non-functional concerns always disjoint?|No|By definition always|Only in browser tools|Only after deployment|A behavior such as access denial can serve a quality objective as well as a functional contract.\nA bank returns correct balances too slowly for its stated workload. What is missing?|Performance satisfaction|Only arithmetic evidence|Only data existence|Only source parsing|Correct values do not establish the promised time behavior.\nA hospital restores a process but not patient history. What should be evaluated?|Data recovery outcomes|Only process reachability|Only package version|Only a green status icon|Recovery must meet relevant record integrity and availability criteria.\nA retailer doubles load while keeping a previous latency claim unchanged. What needs review?|Workload applicability|Only report spelling|Only the tool name|Only meeting frequency|Evidence for one workload may not support a larger one.\nA university checks keyboard navigation for enrollment. Which concern does this support?|Accessibility|Only server syntax|Only row-count arithmetic|Only artifact digesting|Keyboard evidence can address a relevant accessibility interaction requirement.\nA SaaS benchmark counts cached wrong answers as successful. What is the issue?|Invalid success criteria|A useful optimization|A complete quality result|A guaranteed capacity proof|Performance success needs correct relevant outcomes, not response counts alone.\nA logistics team tests recovery without defining acceptable data loss. What is missing?|A recovery target|Only the host name|Only the shell prompt|Only the branch owner|Recovery evidence needs a clear target for data continuity and service restoration.\nA financial team calls all security requirements outside functional testing. What is better?|Map concrete obligations|Remove security checks|Treat labels as proof|Use only scanner counts|Classifications should help select evidence for actual obligations rather than hide required behaviors."
  },
  {
    "slug": "risk",
    "comp": "m3.c1",
    "title": "Prioritize by likelihood, impact and uncertainty",
    "intro": "A university has limited time before registration opens. A minor alignment defect and a failure that loses registrations should not receive equal attention solely because both have tickets.",
    "sections": [
      [
        "Understand the distinction",
        "Product risk concerns potential adverse effects of the software on users or the business. Project risk concerns delivery, resources or schedule. They interact, but a schedule concern does not make a harmful product behavior acceptable by default.",
        "A common qualitative model considers likelihood and impact. Ratings are estimates informed by change, architecture, incident history and exposure, not precise probabilities merely because they are numbers. Uncertainty itself deserves attention."
      ],
      [
        "Apply the evidence boundary",
        "For registration, examine data loss, unauthorized access and payment mismatches before low-impact cosmetic changes when those consequences dominate. Also consider detectability, recovery and the number of affected users rather than blindly trusting one arithmetic score.",
        "Write the rationale so stakeholders can challenge assumptions. If two risks have the same score, they can still require different test techniques or escalation because the consequences and evidence needs differ."
      ]
    ],
    "problem": "Inspect the synthetic prioritize by likelihood, impact and uncertainty example and compare its declared decisions.",
    "steps": [
      "Read the fixture inputs and policy before execution.",
      "Follow each calculation or decision using the stated assumptions.",
      "Compare the printed result with the expected output and identify what remains untested."
    ],
    "code": "risks = {\"alignment\": (2, 1), \"lost_registration\": (3, 5), \"slow_search\": (2, 3)}\nprint(sorted(risks, key=lambda k: risks[k][0] * risks[k][1], reverse=True))",
    "expect": "['lost_registration', 'slow_search', 'alignment']",
    "limit": "This small executable model verifies the shown decision under synthetic inputs. It does not establish a complete delivery process or correctness of a production application.",
    "mistakes": [
      "Treating a local positive result as proof beyond its actual scope.",
      "Ignoring changed assumptions when reusing earlier evidence."
    ],
    "takeaways": [
      "Product risk concerns potential adverse effects of the software on users or the business.",
      "For registration, examine data loss, unauthorized access and payment mismatches before low-impact cosmetic changes when those consequences dominate."
    ],
    "practice": "What does impact describe?|Consequences of failure|Only code length|Only test duration|Only staff preference|Impact concerns the harm or loss if a failure occurs.\nWhat does likelihood estimate?|Chance of occurrence|Only repair cost|Only user satisfaction|Only release count|Likelihood is an estimate of occurrence, distinct from consequence severity.\nA risk score uses subjective ratings. What should be stated?|Its assumptions|Guaranteed probability|Universal precision|Automatic approval|Numbers do not turn qualitative judgments into precise measured probabilities.\nA lost registration risk competes with a small alignment issue. What matters?|User and business harm|Only ticket age|Only title length|Only developer preference|Testing priority should reflect consequences and likelihood rather than arbitrary activity signals.\nTwo risks have the same score. Are their testing needs necessarily identical?|No|Always|Only in one tool|Only after release|Different mechanisms and consequences may require different evidence despite an equal aggregate score.\nA deadline is tight. Does that remove product risk?|No|Automatically|Only for small releases|Only for senior teams|Schedule pressure does not eliminate the consequences of software failure.",
    "final": "What is product risk concerned with?|Adverse software effects|Only staff holiday planning|Only the office lease|Only meeting duration|Product risk concerns potential harm from software behavior and its use.\nWhat is project risk concerned with?|Delivery constraints|Only business-rule outcomes|Only access permissions|Only calculated totals|Project risks affect delivery, resources and schedule rather than solely product behavior.\nWhy record risk rationale?|Challenge assumptions|Guarantee exact probability|Replace all test execution|Remove stakeholder decisions|A rationale makes estimates and their evidence open to review.\nA bank ranks data loss and a cosmetic shift equally by ticket age. What is weak?|Consequence awareness|Only ticket syntax|Only report colors|Only repository naming|Age alone does not represent failure impact, exposure or likelihood.\nAn LMS permission change has little history. What deserves attention?|Uncertainty and exposure|Only zero past defects|Only developer confidence|Only old case counts|New behavior can be risky despite a lack of observed failures.\nA hospital rates rare catastrophic harm below frequent minor styling issues by raw count. What should be considered?|Severity and risk appetite|Only frequency totals|Only faster reproduction|Only the issue label|Low frequency does not make severe consequences irrelevant to risk decisions.\nA retailer multiplies rough ratings and announces a precise failure probability. What is wrong?|False numerical precision|Using any numbers at all|Recording assumptions|Comparing consequences|A qualitative score supports prioritization but is not a calibrated probability measurement.\nA logistics team has two equal scores with different recovery needs. What is reasonable?|Different evidence plans|Identical cases by default|No further analysis|Automatic shared acceptance|Aggregate equality can hide different failure mechanisms, detectability and recovery consequences.\nA SaaS schedule slips while an access risk remains. What is responsible?|Explicit tradeoff decision|Claiming time removes harm|Deleting the security case|Treating all unknowns as safe|Delivery constraints require accountable risk decisions rather than silently erasing product risk.\nA university has uncertain impact estimates for a new data export. What should testing first help with?|Reduce key uncertainty|Maximize irrelevant counts|Prove every input immediately|Avoid stakeholder questions|Targeted evidence can clarify important assumptions before broader commitment."
  },
  {
    "slug": "risk-evidence",
    "comp": "m3.c1",
    "title": "Connect mitigation to an observable failure mechanism",
    "intro": "A retailer\u2019s refund API can retry after a timeout. The main risk is a repeated financial effect, so counting successful first attempts does not address the mechanism.",
    "sections": [
      [
        "Understand the distinction",
        "Risk mitigation reduces likelihood or consequence through design, controls, testing or operational preparation. Testing can reveal weaknesses and estimate evidence gaps, but a passed test does not itself install a protective control.",
        "Map each important risk to relevant scenarios and an oracle. Include negative, boundary, state and dependency-failure behavior where those mechanisms matter. A check should be able to fail when the intended control is absent."
      ],
      [
        "Apply the evidence boundary",
        "For repeated refunds, inspect stable operation identity, concurrent handling assumptions and reconciliation after uncertain provider outcomes. A local fake can model selected sequences while leaving actual provider and concurrency behavior unverified.",
        "Trace residual risk after mitigation: what was tested, which assumptions remain and who can accept the remainder. Do not mark a risk closed solely because a test exists or a ticket moved to done."
      ]
    ],
    "problem": "Inspect the synthetic connect mitigation to an observable failure mechanism example and compare its declared decisions.",
    "steps": [
      "Read the fixture inputs and policy before execution.",
      "Follow each calculation or decision using the stated assumptions.",
      "Compare the printed result with the expected output and identify what remains untested."
    ],
    "code": "risks = {\"duplicate_effect\", \"wrong_owner\", \"lost_status\"}\nchecks = {\"duplicate_effect\", \"wrong_owner\"}\nprint(sorted(risks - checks))",
    "expect": "['lost_status']",
    "limit": "This small executable model verifies the shown decision under synthetic inputs. It does not establish a complete delivery process or correctness of a production application.",
    "mistakes": [
      "Treating a local positive result as proof beyond its actual scope.",
      "Ignoring changed assumptions when reusing earlier evidence."
    ],
    "takeaways": [
      "Risk mitigation reduces likelihood or consequence through design, controls, testing or operational preparation.",
      "For repeated refunds, inspect stable operation identity, concurrent handling assumptions and reconciliation after uncertain provider outcomes."
    ],
    "practice": "What should a risk-based check address?|A failure mechanism|Only a file count|Only a ticket color|Only a team nickname|Useful evidence challenges the mechanism that could cause the adverse outcome.\nDoes a passing test install a runtime control?|No|Always|Only in CI|Only for security|Tests gather evidence; the actual application design or configuration must enforce the control.\nA refund retry risk is checked only with first-attempt success. What is missing?|Repeated-action evidence|Only a longer report|Only more screenshots|Only a different branch|A first attempt does not establish behavior after uncertain or repeated operations.\nA test exists but has never executed. What can it establish?|A planned check|A passed mitigation|A proven production control|An eliminated risk|Existence alone does not establish test results or operational enforcement.\nWhat is residual risk?|Risk remaining afterward|Only a closed ticket|Only original likelihood|Only test runtime|Mitigation may reduce risk while leaving uncertainty or consequences that still need a decision.\nA fake provider cannot reproduce concurrency. What should be explicit?|The evidence limit|Universal atomicity|Guaranteed deduplication|Actual provider safety|A local sequential model cannot justify a broader concurrent or provider-specific claim.",
    "final": "Why map risks to checks?|Show evidence relevance|Guarantee all tests pass|Remove all architecture work|Replace stakeholder judgment|Mappings connect potential harm to evidence that meaningfully challenges its mechanism.\nWhat is a residual risk decision?|Residual disposition|A test file rename|A duplicated report|A source-line total|Remaining risk needs an explicit accountable disposition rather than an implied disappearance.\nWhat makes a test sensitive to a missing control?|It can expose the gap|It always returns success|It ignores the risky output|It duplicates a status badge|A useful check must distinguish controlled behavior from the failure it is meant to reveal.\nA retailer retries a timed-out refund. What is relevant evidence?|Uncertain-effect handling|Only the first HTTP success|Only a product screenshot|Only code formatting|Timeouts can leave external effects uncertain, making repeated-operation behavior important.\nAn LMS adds an access test that uses the owner for every request. What is missing?|Cross-owner evidence|Only another owner success|Only a new test name|Only a faster runner|The chosen actors never challenge the unauthorized-access mechanism.\nA bank closes a risk when a control ticket is created. What is premature?|Claiming mitigation evidence|Recording the planned work|Naming the owner|Keeping the original risk|A plan is not implementation, execution evidence or verified effect.\nA hospital recovery check restores empty fixtures only. What should be limited?|Data-recovery claims|Only file naming|Only test duration|Only the CLI output|An empty dataset does not establish restoration of meaningful relationships and history.\nA logistics fake always returns immediate success. Which risk remains uncovered?|Delayed failure sequences|The fake response branch|The locally supplied value|The simple success oracle|A constant success substitute omits timing uncertainty and failure behavior.\nA SaaS mitigation reduces occurrence but not severe impact. What should be reported?|Remaining consequences|Universal elimination|Only test count growth|Only issue closure|Reduced likelihood does not mean the potential consequences or residual risk vanish.\nA university reviewer asks why a case matters. What should be available?|Risk traceability|Only the author initials|Only the file timestamp|Only the test badge|Traceability explains the failure mechanism and the claim supported by a check."
  },
  {
    "slug": "reporting",
    "comp": "m3.c1",
    "title": "Communicate confidence and release risk honestly",
    "intro": "A healthcare release report shows hundreds of passing cases alongside one unresolved high-impact failure. A useful summary must preserve that distinction instead of hiding it in aggregate percentages.",
    "sections": [
      [
        "Understand the distinction",
        "A test report should identify the artifact, environment, scope, execution results, significant issues and untested areas. Distinguish blocked, not run, failed and passed: they represent different evidence states. A blocked case is not a successful observation.",
        "Exit criteria express the expected evidence for a decision. Unmet criteria need an explicit escalation or risk disposition. Testing informs the decision; product, operational and other authorized stakeholders may hold the actual release authority."
      ],
      [
        "Apply the evidence boundary",
        "For a patient record release, explain which access and integrity boundaries were exercised, which provider paths were simulated and what remains unverified. Preserve prior runs rather than silently overwriting history to make a chart green.",
        "Use counts to summarize, then make material impact visible. A single severe issue can matter more than many low-risk passes. A concise limitation lets a reviewer understand confidence without claiming either absolute safety or total uselessness."
      ]
    ],
    "problem": "Inspect the synthetic communicate confidence and release risk honestly example and compare its declared decisions.",
    "steps": [
      "Read the fixture inputs and policy before execution.",
      "Follow each calculation or decision using the stated assumptions.",
      "Compare the printed result with the expected output and identify what remains untested."
    ],
    "code": "results = [\"passed\", \"passed\", \"blocked\", \"failed\", \"not_run\"]\nfrom collections import Counter\nprint(dict(sorted(Counter(results).items())))",
    "expect": "{'blocked': 1, 'failed': 1, 'not_run': 1, 'passed': 2}",
    "limit": "This small executable model verifies the shown decision under synthetic inputs. It does not establish a complete delivery process or correctness of a production application.",
    "mistakes": [
      "Treating a local positive result as proof beyond its actual scope.",
      "Ignoring changed assumptions when reusing earlier evidence."
    ],
    "takeaways": [
      "A test report should identify the artifact, environment, scope, execution results, significant issues and untested areas.",
      "For a patient record release, explain which access and integrity boundaries were exercised, which provider paths were simulated and what remains unverified."
    ],
    "practice": "How should blocked tests be reported?|Separately from passes|Automatically as passes|Only as formatting issues|As proven safe behavior|A blocked test supplies different evidence from an executed successful case.\nWhat should identify a test run?|Artifact and conditions|Only a team nickname|Only a chart color|Only a meeting title|A result is interpretable when the software and operating scope are known.\nOne severe failure sits among many passes. What should the summary expose?|Its material impact|Only the aggregate percent|Only total assertions|Only report length|Large passing counts must not hide a high-consequence unresolved discrepancy.\nWho should accept remaining release risk?|An authorized reviewer|Any passing test file|The newest tool|An unowned dashboard|Testing supplies evidence while authorized stakeholders decide the residual risk disposition.\nA simulated provider path passes. What should be said?|The boundary was simulated|Actual delivery is proven|All failures are covered|Concurrency is guaranteed|The report must preserve the limits imposed by substitutes.\nA past failed run is overwritten to show a later pass. What is lost?|Historical evidence|Only chart spacing|Only a filename prefix|Only display order|Keeping distinct runs preserves what was observed before and after a change.",
    "final": "What distinguishes not run from passed?|No execution evidence|A faster runtime|A stronger guarantee|A smaller feature scope|A nonexecuted case cannot supply the observation represented by a pass.\nWhat is useful in a test summary?|Scope and limitations|Only total file count|Only tool branding|Only staff attendance|A reviewer needs to understand what the evidence establishes and what it omits.\nWhat should happen to unmet exit criteria?|Explicit disposition|Silent recoloring|Automatic deletion|Unrecorded acceptance|An accountable decision must address the missing or failed condition.\nA hospital has 500 passes and one cross-patient disclosure failure. What matters?|The disclosure impact|Only the pass percentage|Only the test count|Only the green badge area|High aggregate success cannot neutralize a material access-control failure.\nA retailer reports blocked payment tests as passed. What is wrong?|Misclassified evidence|Only report formatting|Only test naming|Only ticket ordering|A blocked test does not establish successful behavior of the payment path.\nAn LMS report omits which build was tested. What is uncertain?|Evidence applicability|Only the report date font|Only developer initials|Only the title length|The result cannot clearly support a release unless its artifact identity is known.\nA logistics test uses a local provider fake. What should the release reader know?|That simulation boundary|Every live contract is proven|All outages were exercised|External data is guaranteed|The tested substitute limits conclusions about actual provider behavior.\nA bank reviewer rejects a release despite many low-risk passes. Can this be rational?|Yes, impact matters|No, counts always decide|Only if no tests ran|Only if the report is short|Release risk depends on consequences and evidence gaps rather than counts alone.\nA SaaS team fixes a failure and reruns the case. What preserves history?|Keep both observations|Replace the earlier result|Delete the original artifact|Claim it always passed|Separate runs show the original discrepancy and later evidence without rewriting past facts.\nA university report says all testing proves complete safety. What is a better claim?|Bounded confidence|Universal defect absence|Guaranteed user approval|Zero future uncertainty|Testing supports confidence within its scope while leaving identifiable limitations and residual risk."
  }
]);
Object.defineProperty(bundle.course,'authoredBank',{value:bundle.bank});module.exports=bundle.course;
