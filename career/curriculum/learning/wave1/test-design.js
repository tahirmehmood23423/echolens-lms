'use strict';
const {build}=require('./qa-helper');
const bundle=build("test-design",[
  {
    "slug": "partitions",
    "comp": "m1.c1",
    "title": "Partition inputs by expected behavior",
    "intro": "An enrollment service accepts a quantity from one to fifty. Testing many arbitrary valid numbers can leave the important distinctions between missing, invalid and allowed input unexamined.",
    "sections": [
      [
        "Understand the distinction",
        "Equivalence partitioning groups inputs expected to receive equivalent handling under a stated rule. Select representatives from valid and invalid groups instead of assuming every input deserves a separate identical case. The grouping depends on behavior, not merely visual similarity.",
        "For quantity, relevant groups may include missing, wrong type, below range, in range and above range. Invalid groups should often be tested separately so one rejection does not hide a different validation path."
      ],
      [
        "Apply the evidence boundary",
        "An integer contract can distinguish 3 from the string 3, and Python booleans require care because bool is an int subclass. The fixture uses type(x) is int to make that particular policy explicit; another API may choose a different coercion rule.",
        "Partitions are a model, not proof that every member behaves identically. Inspect implementation and risk for hidden distinctions such as encoding, overflow or state. Revisit the groups when the accepted contract changes."
      ]
    ],
    "problem": "Inspect the synthetic partition inputs by expected behavior example and compare its declared decisions.",
    "steps": [
      "Read the fixture inputs and policy before execution.",
      "Follow each calculation or decision using the stated assumptions.",
      "Compare the printed result with the expected output and identify what remains untested."
    ],
    "code": "def classify(x):\n    if x is None: return \"missing\"\n    if type(x) is not int: return \"type\"\n    if x < 1: return \"below\"\n    if x > 50: return \"above\"\n    return \"valid\"\nprint([classify(x) for x in [None, \"3\", True, 0, 25, 51]])",
    "expect": "['missing', 'type', 'type', 'below', 'valid', 'above']",
    "limit": "This small executable model verifies the shown decision under synthetic inputs. It does not establish a complete delivery process or correctness of a production application.",
    "mistakes": [
      "Treating a local positive result as proof beyond its actual scope.",
      "Ignoring changed assumptions when reusing earlier evidence."
    ],
    "takeaways": [
      "Equivalence partitioning groups inputs expected to receive equivalent handling under a stated rule.",
      "An integer contract can distinguish 3 from the string 3, and Python booleans require care because bool is an int subclass."
    ],
    "practice": "What does equivalence partitioning group?|Similar expected handling|Identical character lengths|Only adjacent values|Only successful results|Partitions group values according to expected behavior under a declared rule.\nWhy include invalid partitions?|Different rejection paths|To maximize random numbers|To remove the need for rules|To test only success|Invalid classes can expose distinct missing, type and range validation behavior.\nAn API accepts integers only. What should be specified about string 3?|Coercion policy|Only display color|Only field position|Only request naming|A numeric-looking string may be accepted or rejected depending on the explicit type contract.\nSeveral invalid conditions are sent together. What can happen?|One masks another|Every check is proven|All invalid paths run|No oracle is needed|An early rejection can prevent another invalid condition from being exercised.\nA partition is assumed equivalent forever. What should trigger review?|Changed behavior or risk|Only a report logo|Only a file timestamp|Only a case count|Equivalence depends on assumptions that can change with the contract or implementation.\nPython accepts bool as an int subclass. What does a strict integer case need?|An explicit type policy|Only a bigger number|Only a faster runner|Only alphabetical inputs|A strict numeric contract must decide whether boolean values are accepted despite language subtype behavior.",
    "final": "What is a partition representative?|A selected member|Every possible value|Only the maximum value|Only a random string|A representative exercises an assumed equivalent input group without enumerating every member.\nWhat should define an input partition?|Expected behavior|Only text appearance|Only test order|Only author preference|Partition boundaries should correspond to differences in handling under the rule.\nCan partitions include invalid input?|Yes|Never|Only after deployment|Only in manual tests|Invalid partitions are important when different rejection behavior matters.\nAn LMS quantity accepts 1 through 50. Which group is distinct from valid integers?|Numeric strings under strict typing|Another interior integer|A differently named valid variable|The same value repeated|A strict type contract treats a numeric string differently from an integer even if it looks similar.\nA retail form rejects both missing and oversized values in one case. What is uncertain?|Separate rejection coverage|That some rejection occurred|The supplied fixture values|The response observation|One invalid condition can short-circuit the other and leave its path untested.\nA bank accepts decimals but a test uses integers only. What should be reviewed?|Partition completeness|Only test filenames|Only report charts|Only package metadata|The chosen representatives may omit behavior specific to valid decimal forms and precision.\nA hospital rule changes the valid range. What should happen?|Reassess affected groups|Keep every old oracle|Declare all old tests invalid|Only rename the suite|Partitions and expected results need impact review when the contract changes.\nA logistics code distinguishes empty and whitespace-only references. What does this imply?|Potential separate groups|Guaranteed equivalence|No negative testing needed|Only length matters|Different specified handling can justify separate equivalence classes.\nA SaaS engineer assumes one Unicode name represents every encoding case. What is the risk?|Hidden distinctions|Too many relevant cases|A proven universal rule|Automatic normalization safety|A broad class may conceal normalization, length or encoding behavior relevant to the system.\nAn admissions API uses permissive coercion while the acceptance rule says strict integers. What must a test expose?|The contract mismatch|Only successful conversions|Only integer happy paths|Only output formatting|The partition model should challenge the difference between actual coercion and required type behavior."
  },
  {
    "slug": "boundaries",
    "comp": "m1.c1",
    "title": "Select boundary values from the actual domain",
    "intro": "A stock request allows quantities one through fifty inclusive. Values just below, at and above each limit are more informative than many repeats in the middle.",
    "sections": [
      [
        "Understand the distinction",
        "Boundary value analysis selects values around transitions in expected behavior. For an integer interval, useful points can include min-1, min, min+1 and max-1, max, max+1, depending on the selected technique and risk. State whether endpoints are inclusive.",
        "A continuous or decimal domain does not have the same adjacent values as integers. Precision, rounding and units determine a meaningful neighbor. An amount in minor units is different from an arbitrary binary floating-point value."
      ],
      [
        "Apply the evidence boundary",
        "For registration windows, clarify the clock, timezone and equality rule; the instant before closing and exact closing can have different expected results. For lengths, define whether the limit counts bytes, code points or user-perceived characters.",
        "Boundary selection does not replace normal, missing, type or state cases. It supplies focused evidence around declared transitions. Also inspect overflow and representation limits where extreme values reach a different implementation path."
      ]
    ],
    "problem": "Inspect the synthetic select boundary values from the actual domain example and compare its declared decisions.",
    "steps": [
      "Read the fixture inputs and policy before execution.",
      "Follow each calculation or decision using the stated assumptions.",
      "Compare the printed result with the expected output and identify what remains untested."
    ],
    "code": "points = [0, 1, 2, 49, 50, 51]\nprint([(x, 1 <= x <= 50) for x in points])",
    "expect": "[(0, False), (1, True), (2, True), (49, True), (50, True), (51, False)]",
    "limit": "This small executable model verifies the shown decision under synthetic inputs. It does not establish a complete delivery process or correctness of a production application.",
    "mistakes": [
      "Treating a local positive result as proof beyond its actual scope.",
      "Ignoring changed assumptions when reusing earlier evidence."
    ],
    "takeaways": [
      "Boundary value analysis selects values around transitions in expected behavior.",
      "For registration windows, clarify the clock, timezone and equality rule; the instant before closing and exact closing can have different expected results."
    ],
    "practice": "What does boundary analysis emphasize?|Behavior transitions|Only random interiors|Every possible state|Only screen colors|Boundary cases focus on values near changes in expected handling.\nFor inclusive integer minimum 1, which point challenges the lower outside?|0|1|2|25|Zero is immediately below the allowed integer interval beginning at one.\nA monetary rule uses cents. What defines meaningful neighbors?|Declared precision|The field nickname|The UI theme|The test author\u2019s mood|The domain precision and units determine adjacent representable business values.\nA close-time rule leaves equality unclear. What should happen?|Clarify the endpoint|Assume either result|Average both statuses|Skip the equality case|Boundary expectations require a precise inclusive or exclusive rule.\nA length limit counts bytes but tests count characters. What is the concern?|Unit mismatch|Only file naming|Only the order of tests|Only the font choice|Bytes and characters can differ, so the test may not exercise the specified boundary.\nDoes boundary testing replace type checks?|No|Always|Only for integers|Only when automated|Range transitions do not establish missing or wrong-type behavior.",
    "final": "What must be known before choosing endpoint expectations?|Inclusivity|Only variable naming|Only artifact labels|Only test ordering|Inclusive and exclusive endpoints imply different expected outcomes at equality.\nWhich values straddle an integer upper limit 50?|49, 50, 51|20, 25, 30|1, 2, 3|10, 10, 10|The selected values inspect just inside, at and just outside the upper boundary.\nAre integer neighbors universal for all domains?|No|Always|Only after release|Only in one language|Dates, decimals and continuous measurements need domain-specific precision and adjacency.\nA university closes registration at an exact instant. What is valuable?|Equality and adjacent-time cases|Only midday a week earlier|Only another normal registration|Only a field-caption test|The transition requires evidence about the declared endpoint rule and time reference.\nA retailer limits quantity to 50 inclusive. Which expected result is wrong?|Rejecting exactly 50|Rejecting 51|Accepting 49|Accepting 1|An inclusive interval allows its endpoint, making rejection of fifty inconsistent.\nA bank rounds before applying a fee threshold. What should tests reflect?|The stated rounding order|Only raw float proximity|Only larger sample counts|Only report precision|The operation sequence can change which side of a boundary a value falls on.\nA hospital validates maximum UTF-8 bytes. What should examples consider?|Multibyte input|Only ASCII character counts|Only button width|Only screenshot scaling|The byte length of text can exceed its character count, affecting the relevant boundary.\nA logistics timestamp is evaluated in different timezones. What needs a rule?|The reference time basis|Only the output caption|Only filename suffixes|Only local machine defaults|Temporal boundary outcomes depend on a declared consistent reference and conversion policy.\nA SaaS suite tests every range endpoint but no missing input. What remains?|An untested input class|Proven total validation|A redundant boundary pack|An invalid test strategy|Boundary coverage is useful but does not establish all input partitions or conditions.\nAn integer parser may overflow before range validation. What extra concern appears?|Representation limits|Only acceptance captions|Only case numbering|Only chart size|Implementation limits can create a different failure mechanism beyond ordinary business-range endpoints."
  },
  {
    "slug": "decision-state",
    "comp": "m1.c2",
    "title": "Combine decision tables with state transitions",
    "intro": "A refund request depends on ownership and payment status, then changes an order\u2019s state. A table clarifies simultaneous conditions while a state model clarifies which sequences are allowed.",
    "sections": [
      [
        "Understand the distinction",
        "A decision table relates combinations of conditions to expected actions. Make each condition and outcome explicit, inspect missing combinations and identify impossible combinations rather than silently leaving gaps. A don\u2019t-care entry is justified only when that condition truly cannot change the action.",
        "A state-transition model describes states, events, guards and resulting states or actions. Valid and invalid transitions both matter. Transition coverage is not automatically sequence coverage, because the same edge can behave differently after a relevant history."
      ],
      [
        "Apply the evidence boundary",
        "For refunds, ownership and paid status might both be required. The accepted event moves paid to refund_requested; repeating it needs an explicit idempotency or rejection rule. Do not infer that a business-state transition has already completed the financial provider effect.",
        "Use tables and sequences together when behavior depends on both current conditions and history. Reset fixtures deliberately and identify which hidden state or external behavior the simplified model leaves out."
      ]
    ],
    "problem": "Inspect the synthetic combine decision tables with state transitions example and compare its declared decisions.",
    "steps": [
      "Read the fixture inputs and policy before execution.",
      "Follow each calculation or decision using the stated assumptions.",
      "Compare the printed result with the expected output and identify what remains untested."
    ],
    "code": "from itertools import product\nprint([(owner, paid, owner and paid) for owner, paid in product([False, True], repeat=2)])\ntransitions = {(\"paid\", \"request_refund\"): \"refund_requested\"}\nprint(transitions.get((\"refund_requested\", \"request_refund\"), \"invalid\"))",
    "expect": "[(False, False, False), (False, True, False), (True, False, False), (True, True, True)]\ninvalid",
    "limit": "This small executable model verifies the shown decision under synthetic inputs. It does not establish a complete delivery process or correctness of a production application.",
    "mistakes": [
      "Treating a local positive result as proof beyond its actual scope.",
      "Ignoring changed assumptions when reusing earlier evidence."
    ],
    "takeaways": [
      "A decision table relates combinations of conditions to expected actions.",
      "For refunds, ownership and paid status might both be required."
    ],
    "practice": "What does a decision table relate?|Conditions and actions|Only code line numbers|Only release names|Only staff roles|A decision table specifies expected actions for relevant condition combinations.\nWhat does a state model add?|Event history structure|Only input length|Only branch formatting|Only user-interface colors|States and transitions represent behavior dependent on current state and events.\nA refund requires owner and paid. Which combination should allow it?|Both true|Owner only|Paid only|Neither true|The declared conjunction requires both independent conditions.\nA decision-table row is blank. What should be checked?|A coverage gap|Automatic approval|A universal don\u2019t-care|Only chart formatting|An omitted combination needs an explicit expectation or justified impossibility.\nA request repeats after state changed. What needs definition?|Repeated-event behavior|Only its display text|Only its log filename|Only its ticket label|The expected outcome depends on the current state and the specified repeat policy.\nDoes edge coverage prove every sequence?|No|Always|Only with four states|Only if automated|Executing each transition once does not establish all histories and event sequences.\nA table uses don\u2019t-care for ownership on private refunds. What must hold?|Ownership truly irrelevant|The row is shorter|The UI hides owner data|The tester prefers fewer cases|A condition may be ignored only when changing it cannot affect the specified outcome.\nA refund request is accepted locally. Is money reversal proven?|No|Always|Only with a new state|Only if a response is fast|A local state decision does not establish completion of the external financial operation.",
    "final": "Which technique makes condition combinations explicit?|Decision tables|Only line coverage|Only random sampling|Only screenshot comparison|Decision tables map combinations to expected actions.\nWhat is a transition guard?|A required condition|Only a state label|Only a log caption|Only a test filename|A guard constrains whether an event may cause a transition.\nWhat is an invalid transition case useful for?|Checking forbidden behavior|Proving every valid history|Replacing normal cases|Eliminating the state model|Invalid transitions verify what must not happen under an event and current state.\nA retailer requires ownership and paid status for refunds. What should a table include?|Independent false conditions|Only both-true success|Only repeated success rows|Only payment-provider branding|Each required condition should be challenged so a missing guard can be exposed.\nAn LMS permits start only from ready state. What should be tested?|Start from another state|Only another ready success|Only longer attempt names|Only a different report font|A forbidden-state event challenges the state restriction directly.\nA hospital model omits a cancelled state observed in the product. What needs review?|Model completeness|Only the state spelling|Only test sort order|Only report pagination|The missing state can hide real transitions and expected outcomes.\nA logistics event is allowed after dispatch but not after delivery. What determines expectation?|Current state and event|Only the event name|Only the user nickname|Only the test count|State-dependent rules cannot be decided from the event alone.\nA SaaS suite covers every edge once but misses retry after timeout. What remains?|Sequence-specific behavior|Guaranteed complete coverage|Only a cosmetic gap|No meaningful remaining risk|Relevant event histories can expose outcomes not established by single-edge coverage.\nA bank table marks an authorization condition don\u2019t-care. What requires evidence?|Outcome independence|A shorter table|A nicer chart|A faster editor|Ignoring a condition is justified only if it cannot change the expected action in that row.\nA payment workflow changes state before a provider confirms. What should the oracle distinguish?|Request and completed effect|Only old and new names|Only response indentation|Only the process ID|An intermediate local state must not be mistaken for a confirmed external financial outcome."
  },
  {
    "slug": "case-contract",
    "comp": "m2.c1",
    "title": "Write cases with reproducible preconditions and steps",
    "intro": "A support engineer receives a failed test titled student cannot enroll. Without account status, course state or input values, another person cannot reproduce or interpret the result.",
    "sections": [
      [
        "Understand the distinction",
        "A test case should identify its purpose, relevant requirement or risk, preconditions, data, actions and expected result. Preconditions describe state before the tested action. Steps should be precise enough for the intended executor while avoiding unrelated implementation detail.",
        "Keep setup distinct from the behavior being examined. If a prerequisite is not satisfied, record the case as blocked or invalid for that purpose instead of interpreting the later symptom as the intended test outcome."
      ],
      [
        "Apply the evidence boundary",
        "For enrollment, declare a synthetic learner, an open course and available capacity. Then submit the specified request and inspect its documented result and relevant state. If testing a full course, establish full capacity explicitly rather than relying on another test having filled it.",
        "A case should remain understandable after the author leaves. Describe stable identifiers or selectors where necessary and record assumptions about clocks, permissions and external substitutes that change the meaning of the result."
      ]
    ],
    "problem": "Inspect the synthetic write cases with reproducible preconditions and steps example and compare its declared decisions.",
    "steps": [
      "Read the fixture inputs and policy before execution.",
      "Follow each calculation or decision using the stated assumptions.",
      "Compare the printed result with the expected output and identify what remains untested."
    ],
    "code": "fixture = {\"course_open\": True, \"seats\": 2, \"learner_eligible\": True}\npreconditions = fixture[\"course_open\"] and fixture[\"learner_eligible\"]\nprint(preconditions)\nprint(\"ready\" if preconditions else \"blocked\")",
    "expect": "True\nready",
    "limit": "This small executable model verifies the shown decision under synthetic inputs. It does not establish a complete delivery process or correctness of a production application.",
    "mistakes": [
      "Treating a local positive result as proof beyond its actual scope.",
      "Ignoring changed assumptions when reusing earlier evidence."
    ],
    "takeaways": [
      "A test case should identify its purpose, relevant requirement or risk, preconditions, data, actions and expected result.",
      "For enrollment, declare a synthetic learner, an open course and available capacity."
    ],
    "practice": "What are preconditions?|Required starting state|Only the final output|Only the failure log|Only the release approval|Preconditions establish the relevant state before the tested action.\nWhat should a case identify besides steps?|Expected result|Only the author nickname|Only a ticket color|Only tool branding|A sequence cannot be judged without a defensible expected outcome.\nA required course is not open during an enrollment case. What should be examined?|Setup validity|Only UI typography|Only test numbering|Only package size|An unmet setup condition can invalidate the intended interpretation of later behavior.\nA full-capacity case relies on an earlier test filling seats. What is weak?|Hidden state dependency|Only case length|Only report ordering|Only input formatting|A case should establish relevant state explicitly rather than depend on another execution.\nA failure report omits the actor role. What may be ambiguous?|Permission context|Only its timestamp font|Only the screenshot name|Only the editor version|Role and ownership can change the required behavior of the same action.\nWhy separate setup from the tested action?|Interpret failures|Reduce all documentation|Guarantee no failures|Avoid having an oracle|A setup failure and a product failure under valid preconditions support different conclusions.",
    "final": "What belongs before the tested action?|Relevant setup|Only final assertions|Only release notes|Only cleanup evidence|The case should establish the state and data required for its intended examination.\nWhy state a case purpose?|Explain relevant evidence|Guarantee execution success|Eliminate expected results|Prevent future requirements|Purpose connects the case to the behavior or risk it is meant to inspect.\nWhat makes steps reproducible?|Concrete relevant detail|Maximum vague wording|Only author memory|Only a success emoji|The intended executor needs enough specific information to perform the same meaningful action.\nA university case says enroll a student without eligibility state. What should be added?|The actor preconditions|Only the page logo|Only the meeting date|Only the branch label|Eligibility and permissions can determine whether enrollment should be accepted.\nA retailer\u2019s stock case fails because setup created no item. What should be distinguished?|Setup and product failure|Only the test title|Only file extensions|Only runtime duration|An invalid prerequisite does not establish the intended stock-rule discrepancy.\nA bank case references whatever account exists. What is the problem?|Uncontrolled test data|A guaranteed valid fixture|A complete reproducibility record|A stronger business oracle|Unspecified mutable state can change the result and undermine repeatability.\nAn LMS permission case does not name the learner and owner relationship. What is missing?|Authorization context|Only the display language|Only report pagination|Only the API version label|The expected access decision depends on whether the actor owns or may access the target.\nA logistics case depends on yesterday\u2019s clock. What should be explicit?|Temporal setup|Only compiler syntax|Only the issue color|Only a package lock|Time-sensitive rules need controlled or clearly declared reference conditions.\nA SaaS failure can only be repeated by its author. What should improve?|Case reproducibility|Only the badge count|Only screenshot resolution|Only the team calendar|Relevant steps, setup, inputs and expected results should make the evidence interpretable to others.\nA hospital case uses a fake notification service. What should its preconditions disclose?|The simulated integration|Real delivery proof|All provider credentials|Every patient record|The case must identify substituted boundaries so its result is not overclaimed."
  },
  {
    "slug": "oracles",
    "comp": "m2.c1",
    "title": "Choose precise expected results and useful assertions",
    "intro": "An export test clicks a button and declares success when no exception appears. That observation can miss an empty file, wrong records or leaked private columns.",
    "sections": [
      [
        "Understand the distinction",
        "Expected results state what must be observed under the specified action and conditions. Assertions implement comparisons against that oracle. Avoid deriving the expected answer by calling the same potentially faulty production function: matching copies can share the same error.",
        "Use independent reasoning, approved examples, invariants or a trusted reference where appropriate. Independence does not mean an oracle is infallible; its authority and assumptions still need review."
      ],
      [
        "Apply the evidence boundary",
        "For an export, assert the intended rows, permitted fields and relevant status, not only that a request returned. Negative assertions can check that another learner\u2019s records and internal notes are absent. Avoid overfitting to irrelevant ordering when the contract does not promise it.",
        "A metamorphic relation checks an expected relationship across transformed inputs, such as a total remaining unchanged when item order changes. Such relations can add evidence when exact outputs are costly, but they are partial properties rather than complete correctness proofs."
      ]
    ],
    "problem": "Inspect the synthetic choose precise expected results and useful assertions example and compare its declared decisions.",
    "steps": [
      "Read the fixture inputs and policy before execution.",
      "Follow each calculation or decision using the stated assumptions.",
      "Compare the printed result with the expected output and identify what remains untested."
    ],
    "code": "rows = [{\"owner\": 7, \"score\": 80}, {\"owner\": 8, \"score\": 90}]\nexport = [{\"score\": r[\"score\"]} for r in rows if r[\"owner\"] == 7]\nassert export == [{\"score\": 80}]\nassert all(\"owner\" not in r for r in export)\nprint(export)",
    "expect": "[{'score': 80}]",
    "limit": "This small executable model verifies the shown decision under synthetic inputs. It does not establish a complete delivery process or correctness of a production application.",
    "mistakes": [
      "Treating a local positive result as proof beyond its actual scope.",
      "Ignoring changed assumptions when reusing earlier evidence."
    ],
    "takeaways": [
      "Expected results state what must be observed under the specified action and conditions.",
      "For an export, assert the intended rows, permitted fields and relevant status, not only that a request returned."
    ],
    "practice": "What does an assertion compare?|Observation and oracle|Only two filenames|Only staff titles|Only build durations|An assertion checks observed behavior against an expected rule or property.\nA test passes only because no exception occurred. What can remain wrong?|Returned content|The fact execution continued|The observed absence of exception|The local call happened|An exception-free execution can still return wrong or unauthorized data.\nExpected output calls the same faulty function as actual output. What is the risk?|A shared error|Too much independence|Guaranteed precision|Automatic domain authority|Both sides may reproduce the same defect rather than independently checking the rule.\nAn export includes another learner\u2019s rows. What assertion is relevant?|Scope exclusion|Only response speed|Only filename length|Only button visibility|The expected record population must exclude unauthorized data.\nA contract does not guarantee row order. What should the test avoid?|Irrelevant order coupling|Meaningful content checks|Record ownership checks|Expected field checks|Asserting an unpromised incidental order can create brittle failures unrelated to the contract.\nA metamorphic relation passes. What is established?|That tested relation|Complete correctness|Every possible output|All permission rules|A relation supplies bounded property evidence and does not establish every aspect of behavior.",
    "final": "What is an expected result for?|Judging the observation|Only naming the case|Only timing the runner|Only approving staff work|Expected behavior supplies a defensible basis for deciding whether a case passes.\nWhy avoid duplicating the same algorithm as oracle?|Shared defect risk|Independent math is forbidden|Tests must be random|No values may be compared|A copied algorithm can reproduce the implementation error on both sides.\nWhat does a metamorphic check examine?|A relation across inputs|Every possible exact result|Only one file suffix|Only source formatting|It tests a required relationship between transformed cases rather than proving complete correctness.\nAn LMS export succeeds but includes internal notes. What should be asserted?|Allowed field projection|Only a success status|Only button text|Only download duration|A successful transport status does not establish that the returned fields satisfy privacy scope.\nA retailer tests totals with the production total function on both sides. What should change?|Use an independent oracle|Add the same function again|Only rename the assertion|Ignore the computed value|The expected value needs a basis capable of exposing errors in that function.\nA bank invariant says transfers conserve total funds. Does that prove every fee is correct?|No|Always|Only if automated|Only if many cases pass|Conservation is useful but may coexist with wrong attribution or fee behavior.\nA hospital response should omit another patient\u2019s row. Which oracle is useful?|An explicit absence check|Only a row-count increase|Only a visible success icon|Only a server health check|Negative content assertions can challenge a specific confidentiality boundary.\nA logistics API promises an unordered set but a test requires insertion order. What is the concern?|An irrelevant constraint|A guaranteed domain defect|An improved contract by default|A complete compatibility check|The test should not silently invent behavior absent from the agreed contract.\nA SaaS test derives expected tax from an approved worked example. What still matters?|Oracle assumptions|Only the report theme|Only the author nickname|Only assertion count|A reference example must be applicable to the current rule, precision and context.\nA university checks only that score lies between zero and one hundred. What can be missed?|A wrong in-range score|Every overflow|All out-of-range values|A missing numeric bound|A broad invariant can pass for an incorrect value inside the permitted range."
  },
  {
    "slug": "fixtures",
    "comp": "m2.c1",
    "title": "Design controlled data, cleanup and independent cases",
    "intro": "A suite passes alone but fails when another case runs first. Shared state, uncontrolled clocks or reused mutable fixtures can make a case assert a different situation from the one its author intended.",
    "sections": [
      [
        "Understand the distinction",
        "Test data should represent the required partitions and relationships while remaining isolated from real student or customer records. Use explicit identifiers, synthetic actors and controlled seeds when randomness affects reproducibility. A seed alone does not explain the relevance of the generated case.",
        "Setup creates the needed state; teardown or disposable environments prevent effects leaking to later cases. Cleanup must be robust when the test fails. Prefer fresh fixtures when shared mutable state makes dependencies hard to understand."
      ],
      [
        "Apply the evidence boundary",
        "For enrollment, a fresh capacity model avoids one case consuming seats for another. For date-sensitive behavior, inject or freeze the relevant clock in the fixture rather than depend on the wall clock. For external effects, use isolated controlled substitutes and state their limits.",
        "Do not delete production records or weaken permissions to make a test independent. Preserve evidence of failed cases while cleaning disposable state. Independence supports interpretation but does not forbid deliberate separately specified multi-step journey tests."
      ]
    ],
    "problem": "Inspect the synthetic design controlled data, cleanup and independent cases example and compare its declared decisions.",
    "steps": [
      "Read the fixture inputs and policy before execution.",
      "Follow each calculation or decision using the stated assumptions.",
      "Compare the printed result with the expected output and identify what remains untested."
    ],
    "code": "def fresh():\n    return {\"seats\": 2, \"members\": []}\na, b = fresh(), fresh()\na[\"members\"].append(\"synthetic-learner\")\nprint(len(a[\"members\"]))\nprint(len(b[\"members\"]))",
    "expect": "1\n0",
    "limit": "This small executable model verifies the shown decision under synthetic inputs. It does not establish a complete delivery process or correctness of a production application.",
    "mistakes": [
      "Treating a local positive result as proof beyond its actual scope.",
      "Ignoring changed assumptions when reusing earlier evidence."
    ],
    "takeaways": [
      "Test data should represent the required partitions and relationships while remaining isolated from real student or customer records.",
      "For enrollment, a fresh capacity model avoids one case consuming seats for another."
    ],
    "practice": "Why use fresh mutable fixtures?|Avoid state leakage|Prove every production state|Remove all setup|Guarantee no defects|Separate mutable state prevents one execution changing another case\u2019s intended preconditions.\nWhat is teardown for?|Dispose test effects|Erase historical evidence|Delete production records|Skip expected results|Cleanup should remove disposable test effects without falsifying observations or harming real data.\nA case depends on wall-clock midnight. What helps reproducibility?|A controlled clock|Only a longer timeout|Only a random sleep|Only a renamed test|An explicit time source makes temporal assumptions repeatable.\nA random failure cannot be reproduced. What should be captured?|Inputs and relevant seed|Only runner branding|Only the passing count|Only the case color|Reproduction needs actual generated conditions, with seed and environment when relevant.\nA suite fails only after another case consumes seats. What is suspect?|Hidden shared state|Only file naming|Only report width|Only test badges|Order-sensitive results often indicate leaked state or undeclared dependencies.\nDoes independent testing forbid deliberate journeys?|No|Always|Only in browsers|Only in CI|A specified multi-step journey can deliberately share state while separate cases remain controlled.",
    "final": "What should synthetic test data preserve?|Relevant relationships|Real private identities|Every production secret|Only attractive display names|Useful fixtures model needed states and relationships without exposing actual personal records.\nWhy control a test clock?|Repeat temporal conditions|Prevent all timing defects|Prove every timezone|Replace all date rules|A controlled reference removes unintended wall-clock variation from the declared case.\nWhen should cleanup work?|Also after failure|Only after success|Only on deployment|Only after manual approval|Failed tests can leave disposable effects that would corrupt later preconditions.\nAn LMS case leaves enrolled users for another case unintentionally. What is the problem?|State leakage|A guaranteed useful journey|Stronger independence|A proven access policy|Unplanned persisted state can change the meaning and outcome of later cases.\nA retailer uses production customer exports as fixtures. What should be reconsidered?|Privacy and isolation|Only file extensions|Only source indentation|Only chart colors|Representative evidence should avoid unnecessary use and disclosure of real customer records.\nA bank random generator logs a seed but not relevant version or inputs. What can remain uncertain?|Exact reproduction|Only the seed existence|Only local execution|Only the test title|A seed may be insufficient if generator behavior, environment or other inputs differ.\nA hospital date test passes in one timezone and fails in another. What should be declared?|The time reference policy|Only server nicknames|Only office location|Only report language|Temporal expectations require a clear conversion and reference rule.\nA logistics teardown deletes all records in a shared live store. What is wrong?|Unsafe environment scope|Only cleanup speed|Only report ordering|Only test duration|Test cleanup must operate only on disposable isolated state rather than destroy real data.\nA SaaS workflow test deliberately creates then cancels a reservation. How should it be described?|One explicit sequence|Two unrelated independent cases|An accidental dependency|A proof of all histories|A deliberate journey should make its shared state and event order part of the case contract.\nA university test mutates a fixture object reused across cases. What helps?|Separate fixture instances|Only sorted test names|Only a longer process timeout|Only a different log prefix|Fresh instances avoid unintended mutable aliasing across case boundaries."
  },
  {
    "slug": "plan-scope",
    "comp": "m3.c1",
    "title": "Define plan scope, risks and an evidence approach",
    "intro": "A hospital plans a booking release that changes patient matching but not billing. The plan must make included risks, excluded areas and interfaces visible so stakeholders do not read a narrow result as a whole-system guarantee.",
    "sections": [
      [
        "Understand the distinction",
        "A test plan describes the scope, objectives, approach and constraints of a testing effort. It should connect important risks and requirements to intended evidence, including relevant levels, techniques, data and environments. A list of test file names alone is not a strategy.",
        "State exclusions with rationale and approval where needed. A change outside nominal scope may still affect a shared dependency. An exclusion cannot silently waive required privacy or integrity obligations for the included behavior."
      ],
      [
        "Apply the evidence boundary",
        "For patient matching, include wrong-person association, ambiguous identifiers and import compatibility. Keep unchanged billing behavior outside detailed retesting only when impact analysis supports that choice, and record remaining uncertainty at the interface.",
        "Plans are living decision records. Update them when new risks or architecture information changes evidence needs, while preserving which scope earlier results actually covered. Do not change the plan retroactively to disguise an unmet obligation."
      ]
    ],
    "problem": "Inspect the synthetic define plan scope, risks and an evidence approach example and compare its declared decisions.",
    "steps": [
      "Read the fixture inputs and policy before execution.",
      "Follow each calculation or decision using the stated assumptions.",
      "Compare the printed result with the expected output and identify what remains untested."
    ],
    "code": "required = {\"identity_match\", \"ambiguous_input\", \"import_contract\"}\nplanned = {\"identity_match\", \"ambiguous_input\"}\nprint(sorted(required - planned))",
    "expect": "['import_contract']",
    "limit": "This small executable model verifies the shown decision under synthetic inputs. It does not establish a complete delivery process or correctness of a production application.",
    "mistakes": [
      "Treating a local positive result as proof beyond its actual scope.",
      "Ignoring changed assumptions when reusing earlier evidence."
    ],
    "takeaways": [
      "A test plan describes the scope, objectives, approach and constraints of a testing effort.",
      "For patient matching, include wrong-person association, ambiguous identifiers and import compatibility."
    ],
    "practice": "What should a test plan connect?|Scope and approach|Only a file list|Only staff attendance|Only source formatting|A plan explains what will be examined, why and with which relevant evidence.\nWhy record exclusions?|Clarify evidence boundaries|Erase mandatory obligations|Guarantee no side effects|Remove approval needs|Exclusions identify limits but still need rationale and consistency with applicable obligations.\nAn excluded area shares a changed dependency. What should happen?|Impact review|Automatic safety inference|Deletion from all records|Only a new caption|Shared dependencies can bring an otherwise unchanged area into relevant regression scope.\nA plan changes after new risk information. Is that necessarily wrong?|No|Always|Only if documented|Only in waterfall|Plans should adapt to evidence while preserving the scope of historical results.\nA plan lists many test files but no risks or objectives. What is weak?|Its rationale|Only its page count|Only its sort order|Only its author initials|A file inventory does not explain whether the selected checks address relevant needs.\nA privacy obligation is excluded from private-record testing without authority. What is the concern?|An invalid scope waiver|Only a smaller report|Only a shorter schedule|Only a faster run|Nominal exclusions do not justify ignoring protection necessary for included behavior.",
    "final": "What is a test plan primarily for?|Coordinate assurance work|Guarantee no defects|Replace all test cases|Freeze every detail forever|A plan coordinates scope, approach, conditions and resources for evidence gathering.\nWhat should justify a technique choice?|The relevant risk|Only tool popularity|Only author preference|Only file naming|Techniques should suit the behavior and failure mechanisms that need evidence.\nWhy track a scope revision?|Interpret prior results|Erase earlier assumptions|Guarantee all changes pass|Avoid decision ownership|Versioned scope makes clear which obligations each execution actually examined.\nA hospital changes patient matching but excludes wrong-person cases. What should be challenged?|Risk coverage|Only plan typography|Only report length|Only test naming|The excluded behavior directly relates to a critical failure mechanism of the change.\nA retailer excludes billing after changing a shared totals library. What is needed?|Dependency impact analysis|Automatic exemption|Only a new release title|Only a checklist signature|A shared change can affect nominally unchanged behavior and its regression obligations.\nAn LMS plan omits tenant boundaries for a multi-organization export. What is missing?|Relevant access scope|Only table colors|Only browser zoom|Only document branding|The evidence approach must address the authorization boundaries of the included operation.\nA logistics plan chooses only UI checks for a storage invariant. What should be considered?|Appropriate evidence levels|Only a larger UI count|Only longer click waits|Only screenshots of success|Focused engine or integration evidence may examine the invariant more directly and reliably.\nA bank changes plan scope after tests fail and calls the original criterion fulfilled. What is wrong?|Historical scope rewriting|The existence of revisions|The act of reassessment|Keeping known issues visible|A revised plan must not falsify what a prior test or decision actually established.\nA SaaS excludes an external provider from local execution. What should remain explicit?|Contract evidence limits|Full provider assurance|Real delivery guarantees|All network failure coverage|A scope boundary involving a substitute limits conclusions about the actual service.\nA university reviewer asks why one area is excluded. What should be available?|Rationale and residual risk|Only a file path|Only the author nickname|Only a percentage badge|A defensible exclusion explains its impact assumptions and remaining uncertainty."
  },
  {
    "slug": "criteria",
    "comp": "m3.c1",
    "title": "Make entry and exit criteria observable",
    "intro": "A registration release cannot start realistic integration tests because its isolated dataset and provider contract are missing. Entry criteria should expose this problem before a schedule assumes the evidence exists.",
    "sections": [
      [
        "Understand the distinction",
        "Entry criteria describe conditions needed to begin a test stage meaningfully, such as an identifiable build, usable environment and required fixtures. Exit criteria describe evidence needed for a decision afterward, such as critical scenario results and unresolved issue thresholds.",
        "Criteria should be observable and applicable to risk. All tests pass may be incomplete if important tests are missing or blocked. A numeric defect threshold also needs severity definitions and a rule for material exceptions."
      ],
      [
        "Apply the evidence boundary",
        "Distinguish met, unmet and unknown. Unknown is not a pass. If a criterion cannot be satisfied, document the limitation and seek an authorized scope or risk decision rather than silently weakening the result. Avoid approving your own unrecorded exception.",
        "A hospital might require wrong-patient prevention evidence and a demonstrated recovery procedure before release. A low-risk caption issue may receive a documented deferral, while an unresolved disclosure failure deserves different treatment. Criteria support judgment rather than replacing it."
      ]
    ],
    "problem": "Inspect the synthetic make entry and exit criteria observable example and compare its declared decisions.",
    "steps": [
      "Read the fixture inputs and policy before execution.",
      "Follow each calculation or decision using the stated assumptions.",
      "Compare the printed result with the expected output and identify what remains untested."
    ],
    "code": "criteria = {\"build_known\": True, \"fixture_ready\": True, \"provider_contract\": None}\nprint(sorted(k for k, v in criteria.items() if v is not True))\nprint(all(v is True for v in criteria.values()))",
    "expect": "['provider_contract']\nFalse",
    "limit": "This small executable model verifies the shown decision under synthetic inputs. It does not establish a complete delivery process or correctness of a production application.",
    "mistakes": [
      "Treating a local positive result as proof beyond its actual scope.",
      "Ignoring changed assumptions when reusing earlier evidence."
    ],
    "takeaways": [
      "Entry criteria describe conditions needed to begin a test stage meaningfully, such as an identifiable build, usable environment and required fixtures.",
      "Distinguish met, unmet and unknown."
    ],
    "practice": "What is an entry criterion?|Meaningful start condition|Only the final pass count|Only the incident summary|Only release marketing|Entry criteria establish conditions needed to perform the intended test stage.\nA plan requires recovery evidence before its final decision, but that check is blocked. What must the summary preserve?|An unmet exit condition|An automatic successful exit|A fictional observed recovery|An erased criterion|A blocked mandatory recovery check leaves the exit condition unestablished and needs explicit disposition.\nA criterion is unknown. Should it be counted met?|No|Always|Only near a deadline|Only in a green report|Unknown evidence does not establish satisfaction of the condition.\nAll executed cases pass but critical cases are blocked. What remains?|An evidence gap|Complete readiness proof|Automatic acceptance|No relevant uncertainty|Passing executed checks does not establish blocked or missing obligations.\nA defect threshold ignores severity. What should be clarified?|Material impact treatment|Only issue numbering|Only the title length|Only report colors|A small count can still contain a highly consequential unresolved issue.\nA criterion needs an exception. What is responsible?|Authorized disposition|Silent result editing|Deleting its history|Calling unknown passed|An exception must be an explicit accountable decision with its evidence limits preserved.",
    "final": "Why make criteria observable?|Support sound decisions|Eliminate all judgment|Guarantee zero defects|Avoid documenting risk|Observable conditions let reviewers assess evidence instead of relying on vague assurances.\nWhich is an entry readiness concern?|Required fixture availability|Only final defect closure|Only end-user sign-off|Only completed monitoring history|A needed fixture must exist before its intended scenarios can be executed meaningfully.\nWhat does unknown evidence mean?|Not established|Automatically safe|Equivalent to passed|Guaranteed failure|Unknown is a lack of sufficient evidence and should be distinguished from both pass and confirmed failure.\nA university begins integration testing without the promised data shape. What is the issue?|Unmet start assumptions|Only plan formatting|Only the tool license|Only report ordering|Invalid readiness conditions can make planned evidence inapplicable or impossible.\nA hospital release has one unresolved patient-disclosure issue below a count threshold. What matters?|Its severity and criteria|Only the total count|Only report length|Only issue age|A numerical threshold must not hide material impact and explicit critical conditions.\nA retailer marks unexecuted load tests passed to meet a date. What failed?|Evidence integrity|Only test speed|Only schedule styling|Only file naming|A deadline does not justify inventing observations or misclassifying missing evidence.\nAn LMS accepts a low-risk caption defect under a documented exception. What should remain visible?|The deferred issue|A fictional passed test|A deleted failure history|A universal safety claim|Risk acceptance does not change the actual observation or eliminate the issue.\nA SaaS exit rule says no important defects without defining important. What should improve?|The decision criterion|Only the slide theme|Only reviewer initials|Only case-count sorting|Undefined severity or impact language makes the exit decision ambiguous.\nA bank lacks recovery evidence but all arithmetic checks pass. What is still needed?|Recovery disposition|Automatic release approval|Only more arithmetic repeats|Only screenshot updates|Evidence in one risk area does not establish a different required operating condition.\nA logistics team revises a criterion after finding new risks. What preserves accountability?|Versioned rationale|Silent replacement|Erasing the old run|Calling the new rule old|The decision history should explain why scope or evidence expectations changed."
  },
  {
    "slug": "execution-plan",
    "comp": "m3.c1",
    "title": "Plan people, environments, reporting and recovery",
    "intro": "A SaaS test plan has excellent cases but no owner for environment preparation or provider coordination. Unowned dependencies can block an entire evidence wave even when individual tests are well designed.",
    "sections": [
      [
        "Understand the distinction",
        "A workable plan names responsibilities, dependencies, environments, data needs, tools and reporting cadence. Estimates should identify assumptions and uncertainty rather than promise precision from case counts alone. Include how blocked work and significant findings will be escalated.",
        "Separate testing roles from access grants. Reviewers need relevant evidence but not necessarily production credentials. Use local or isolated environments and synthetic data when real effects or private information are unnecessary."
      ],
      [
        "Apply the evidence boundary",
        "Define how results identify artifact and environment, how failed or blocked cases are recorded, and who makes the release decision. A report should show untested scope and material residual risks alongside counts. Preserve evidence from earlier executions when rerunning a repaired case.",
        "Plan cleanup and recovery for test effects as well as product rollout. Confirm required fixtures and services can be restored in isolation. A plan is useful when another person can understand its responsibilities, evidence boundaries and next action after disruption."
      ]
    ],
    "problem": "Inspect the synthetic plan people, environments, reporting and recovery example and compare its declared decisions.",
    "steps": [
      "Read the fixture inputs and policy before execution.",
      "Follow each calculation or decision using the stated assumptions.",
      "Compare the printed result with the expected output and identify what remains untested."
    ],
    "code": "owners = {\"fixture\": \"qa\", \"environment\": \"ops\", \"provider_stub\": None}\nprint(sorted(k for k, owner in owners.items() if not owner))",
    "expect": "['provider_stub']",
    "limit": "This small executable model verifies the shown decision under synthetic inputs. It does not establish a complete delivery process or correctness of a production application.",
    "mistakes": [
      "Treating a local positive result as proof beyond its actual scope.",
      "Ignoring changed assumptions when reusing earlier evidence."
    ],
    "takeaways": [
      "A workable plan names responsibilities, dependencies, environments, data needs, tools and reporting cadence.",
      "Define how results identify artifact and environment, how failed or blocked cases are recorded, and who makes the release decision."
    ],
    "practice": "What should a practical plan assign?|Responsibilities|Only test-name colors|Only source indentation|Only success emojis|Preparation and decision tasks need clear ownership as well as a list of cases.\nWhat should an estimate state?|Assumptions and uncertainty|Guaranteed exact duration|Only a large case count|Only staff seniority|Duration depends on scope, dependencies, setup and failure investigation rather than count alone.\nA provider stub has no owner. What is at risk?|Evidence readiness|Only report typography|Only ticket ordering|Only package size|An unowned dependency can prevent the relevant tests from starting or being meaningful.\nDo reviewers always need production credentials?|No|Always|Only if reports are long|Only in a paid tool|Evidence review authority is distinct from permission to operate production systems.\nA repaired case is rerun. What should reports preserve?|Both observations|Only the latest green label|A rewritten first result|No artifact identity|Keeping distinct executions preserves the original discrepancy and later evidence.\nWhy plan test-effect cleanup?|Restore test isolation|Erase all failures|Delete student history|Hide blocked work|Cleanup protects later fixtures and disposable environments without falsifying evidence.",
    "final": "What should name an execution result?|Artifact and environment|Only the case color|Only the author nickname|Only the report logo|Results need relevant software and operating identity to support a scoped decision.\nWhy name dependency owners?|Make readiness accountable|Guarantee all dependencies work|Remove coordination needs|Replace entry criteria|An owner provides a clear route for preparation, questions and escalation.\nWhat should accompany execution counts?|Material limitations|Only more badge colors|Only tool marketing|Only staff rankings|Counts are interpretable when scope, significant issues and untested areas remain visible.\nA SaaS wave is blocked because no one prepared its schema. What should improve?|Preparation ownership|Only the test titles|Only screenshot size|Only pass thresholds|The plan must coordinate environment and fixture prerequisites rather than assume they appear.\nA hospital reviewer is offered raw patient data for convenience. What is preferable?|Minimized synthetic evidence|Unrestricted private exports|Permanent shared credentials|No access boundaries|Useful assurance should avoid unnecessary personal-data disclosure and production access.\nA retailer estimates duration by multiplying case count by one constant. What is missing?|Setup and variability|Only the report language|Only machine branding|Only branch descriptions|Different complexity, dependencies and diagnosis effort make count-only forecasts unreliable.\nAn LMS rerun passes after a fix. What should the report show?|Its artifact and run|That it always passed|Only a replacement badge|A deleted original issue|A new observation should be tied to its artifact while preserving earlier evidence.\nA logistics plan omits escalation for a critical blocked test. What is missing?|A decision route|Only calendar colors|Only test file order|Only issue labels|Blocked material evidence needs accountable resolution or explicit risk disposition.\nA bank test plan requires live irreversible effects without necessity. What should be reviewed?|Isolation and side effects|Only runtime speed|Only test naming|Only report compression|A defensible approach uses controlled isolated evidence where possible rather than unnecessary harmful effects.\nA university resumes after interruption. What makes recovery practical?|Recorded state and ownership|Only a remembered meeting|Only a green screenshot|Only an unversioned file|A recoverable plan identifies completed evidence, pending dependencies and accountable next actions."
  }
]);
Object.defineProperty(bundle.course,'authoredBank',{value:bundle.bank});module.exports=bundle.course;
