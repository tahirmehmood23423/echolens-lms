'use strict';
const {build}=require('./qa-helper');
const bundle=build("sdlc-foundations",[
  {
    "slug": "models",
    "comp": "m1.c1",
    "title": "Choose lifecycle feedback deliberately",
    "intro": "A university admissions service has stable statutory rules but uncertain applicant screens. A lifecycle should expose uncertainty early while preserving required approval evidence.",
    "sections": [
      [
        "Understand the distinction",
        "Waterfall-style delivery emphasizes planned phase outputs and handoffs. Iterative work revisits a solution; incremental work adds usable capability. Activities can repeat even when a process uses named stages.",
        "Agile values feedback, collaboration and useful outcomes. It does not forbid architecture or compliance records. No model guarantees accurate estimates or removes all late discoveries."
      ],
      [
        "Apply the evidence boundary",
        "A statutory eligibility rule may need explicit sign-off while a screen benefits from small user trials. Choose feedback timing according to uncertainty and the cost of being wrong.",
        "A usable slice needs coherent dependencies and acceptance evidence. Completing many unrelated tasks does not necessarily produce something a person can use."
      ]
    ],
    "problem": "Inspect the synthetic choose lifecycle feedback deliberately example and compare its declared decisions.",
    "steps": [
      "Read the fixture inputs and policy before execution.",
      "Follow each calculation or decision using the stated assumptions.",
      "Compare the printed result with the expected output and identify what remains untested."
    ],
    "code": "done = {\"identity\"}\nneeds = {\"application\": {\"identity\"}, \"decision\": {\"application\"}, \"receipt\": {\"identity\"}}\nprint(sorted(k for k, v in needs.items() if v <= done))",
    "expect": "['application', 'receipt']",
    "limit": "This small executable model verifies the shown decision under synthetic inputs. It does not establish a complete delivery process or correctness of a production application.",
    "mistakes": [
      "Treating a local positive result as proof beyond its actual scope.",
      "Ignoring changed assumptions when reusing earlier evidence."
    ],
    "takeaways": [
      "Waterfall-style delivery emphasizes planned phase outputs and handoffs.",
      "A statutory eligibility rule may need explicit sign-off while a screen benefits from small user trials."
    ],
    "practice": "What does an increment add?|Usable capability|Only a phase label|Every future feature|Only a progress report|An increment adds a useful slice rather than merely renaming work.\nWhat does iteration emphasize?|Refinement|A permanent scope freeze|One final inspection|Removing all documents|Iteration revisits understanding or implementation using feedback.\nA signed rule is later shown wrong. What should happen?|Reassess the rule|Ignore the new evidence|Defend the phase name|Change only the title|Approval records a decision but does not invalidate new evidence.\nA team delivers small slices under compliance obligations. What is sensible?|Keep both obligations|Remove required records|Produce only documents|Ban useful increments|Iterative delivery and explicit compliance evidence can coexist.\nA large integration defect is discovered after dependent work. Why is correction expensive?|Dependencies amplify change|Tests always cause defects|Approval prevents repair|All models behave identically|More completed dependent work can increase the consequences of correcting an assumption.\nA process comparison declares one model universally best. What is missing?|Context and risk|The project nickname|The daily start time|The editor theme|Suitability depends on uncertainty, constraints and feedback costs.",
    "final": "What do requirements primarily describe?|Needs and constraints|Compiled package bytes|Deployment credentials|Runtime memory addresses|Requirements describe the problem and obligations rather than a built artifact.\nWhich distinction separates iterative and incremental work?|Refinement and slices|Fast and careless|Code and documents|People and tools|Iteration refines a solution while increments add usable capability.\nWhat does a lifecycle organize?|Activities and feedback|Guaranteed zero defects|Unlimited capacity|Exact delivery estimates|A lifecycle organizes decisions and feedback without guaranteeing their success.\nA hospital interface is stable but its patient screens are uncertain. Which response fits?|Tailor feedback timing|Freeze every detail now|Ignore interface approvals|Treat every risk equally|Different uncertainty and assurance needs justify different feedback arrangements.\nA retailer demonstrates stock adjustment before reports exist. What must be true?|The slice is usable|Every future report exists|Testing is unnecessary|All requirements are final|An increment must offer coherent usable behavior within its declared scope.\nA logistics prototype reveals offline needs. What should be reconsidered?|Affected assumptions|Only slide colors|Only the team nickname|Nothing after planning|New user evidence should inform requirements and design with traceable impact.\nA bank signs a design before testing integration assumptions. What remains?|Late discovery risk|Guaranteed compatibility|Automatic legal validity|Unlimited change capacity|Sign-off does not supply evidence about actual dependency behavior.\nA product manager says agile forbids design records. What is accurate?|Record useful decisions|Delete every design note|Wait until all coding ends|Replace evidence with slogans|Architecture and assurance records can support iterative delivery.\nAn intake deadline pressures a university to start every task. What helps?|Coherent prioritization|Equal starts for all work|Delayed user feedback|Hidden incomplete features|Dependency-aware slices make useful progress and tradeoffs visible.\nA supplier contract fixes interfaces while usage is uncertain. What needs coordination?|Approval and feedback|Only job-title spelling|Only artifact filenames|Only meeting duration|Contractual assurance and empirical learning address different risks."
  },
  {
    "slug": "flow",
    "comp": "m1.c1",
    "title": "Inspect Scrum and Kanban flow",
    "intro": "A support team receives urgent defects and planned features. Started work is piling up, so the team needs to distinguish activity from completed value.",
    "sections": [
      [
        "Understand the distinction",
        "Scrum uses a Product Goal, Sprints and a Sprint Goal with inspection and adaptation. A Sprint Review inspects product outcomes with stakeholders; a retrospective examines how the team works.",
        "Kanban makes workflow and work-in-progress policies explicit. A WIP limit bounds started unfinished work inside a defined boundary. Exceptions should be explicit rather than quietly erasing the limit."
      ],
      [
        "Apply the evidence boundary",
        "Lead time and cycle time require defined start and end events. Throughput counts completions in a period, but item size and value still matter. Do not rank people from context-free ticket counts.",
        "If work spends days waiting for review and minutes being typed, helping the review bottleneck may improve delivery more than increasing new coding starts. Examine queues before changing incentives."
      ]
    ],
    "problem": "Inspect the synthetic inspect scrum and kanban flow example and compare its declared decisions.",
    "steps": [
      "Read the fixture inputs and policy before execution.",
      "Follow each calculation or decision using the stated assumptions.",
      "Compare the printed result with the expected output and identify what remains untested."
    ],
    "code": "review = [\"rule\", \"receipt\", \"refund\"]\nlimit = 3\nprint(len(review))\nprint(len(review) < limit)",
    "expect": "3\nFalse",
    "limit": "This small executable model verifies the shown decision under synthetic inputs. It does not establish a complete delivery process or correctness of a production application.",
    "mistakes": [
      "Treating a local positive result as proof beyond its actual scope.",
      "Ignoring changed assumptions when reusing earlier evidence."
    ],
    "takeaways": [
      "Scrum uses a Product Goal, Sprints and a Sprint Goal with inspection and adaptation.",
      "Lead time and cycle time require defined start and end events."
    ],
    "practice": "Which event primarily examines working methods?|Retrospective|Sprint Review|Deployment|Contract signing|A retrospective focuses on improving how the team works.\nWhat does a WIP limit constrain?|Started unfinished work|All future demand|Historical deployments|Total customer accounts|The limit applies inside an explicitly defined workflow boundary.\nA review queue is full. What normally helps?|Finish or unblock work|Start unlimited new items|Rename waiting items|Erase the policy|Flow policies encourage resolving constraints instead of adding more unfinished work.\nTwo cycle-time charts use different start events. What is needed?|Align their boundaries|Average them blindly|Rank their developers|Compare their colors|Duration measures require comparable event boundaries and scope.\nA review becomes only a staff ranking. What purpose is lost?|Product feedback|Payroll approval|Password rotation|Server provisioning|The Sprint Review should inspect product results and adapt direction.\nTiny ticket completions double without customer benefit. What follows?|Counts need context|Value certainly doubled|Quality certainly doubled|Estimates became exact|Throughput alone does not establish size, usefulness or outcome quality.",
    "final": "What is a Sprint Goal intended to provide?|Coherent focus|A permanent scope freeze|An individual ticket quota|A release password|The goal gives the Sprint a shared purpose rather than a personal activity quota.\nWhat does a Kanban board expose?|Workflow states|Every hidden defect|Only staff attendance|Only financial profit|Visualized work supports inspection but cannot reveal all unknown problems.\nHow should cycle time be described?|With event boundaries|As a universal constant|Only in story points|Without a time unit|A duration needs clear start and end events to be interpretable.\nA support team starts ten urgent items and finishes none. Which policy deserves attention?|Work in progress|Button typography|Customer display names|Repository descriptions|Excess started work can create queues and switching without completed service.\nA retailer invites users to a Sprint Review. What is the useful purpose?|Inspect product outcomes|Approve staff holidays|Assign salary rankings|Replace all testing|Stakeholders can inspect the increment and provide feedback about value.\nA cloud team records retrospective ideas but never acts. What is missing?|Action and follow-up|A renamed meeting room|More identical charts|A bigger task counter|Reflection needs an implemented improvement and inspection of its effect.\nAn emergency bypasses a hospital queue. What preserves honest flow evidence?|An explicit exception|Deleting WIP history|Hiding the urgent item|Never counting completion|A visible exception permits deliberate urgency handling without falsifying the workflow.\nA SaaS manager compares people by ticket counts across different work types. What is wrong?|Noncomparable work|Too few chart colors|Missing attendance data|Short ticket titles|Counts hide scope, complexity, collaboration and outcome differences.\nA delivery queue waits three days for approval but coding takes one hour. What matters most?|The waiting bottleneck|Only typing speed|Only line counts|Only the daily agenda|Elapsed delivery includes queues, so improving a short active step may miss the main delay.\nA forecast uses average throughput despite variable item sizes. What must be considered?|Scope and uncertainty|More individual rankings|A fixed meeting script|A longer status title|Forecasts depend on item comparability, variability and scope."
  },
  {
    "slug": "roles",
    "comp": "m1.c2",
    "title": "Clarify shared responsibility and decision rights",
    "intro": "An LMS assessment feature needs domain experts, design, engineering and testing. Clear responsibilities make collaboration possible without treating job titles as evidence of correctness.",
    "sections": [
      [
        "Understand the distinction",
        "Product work connects outcomes, user needs and priorities. Design investigates interaction and accessibility. Engineering builds and operates the system, while testing gathers risk and behavior evidence. Domain experts interpret relevant business rules.",
        "Quality is shared across these activities. Testers cannot repair every missing requirement at the end. One person may hold several responsibilities, so organizational titles alone do not establish every decision right."
      ],
      [
        "Apply the evidence boundary",
        "Record who decides a scoring rule, implements it, reviews impact and authorizes release. Handoffs should carry assumptions and evidence, not only a status label. Use concrete examples to resolve disagreement.",
        "Approval responsibility and execution access are different. A release approver may inspect evidence without holding production credentials. Urgency still needs an accountable owner and escalation path."
      ]
    ],
    "problem": "Inspect the synthetic clarify shared responsibility and decision rights example and compare its declared decisions.",
    "steps": [
      "Read the fixture inputs and policy before execution.",
      "Follow each calculation or decision using the stated assumptions.",
      "Compare the printed result with the expected output and identify what remains untested."
    ],
    "code": "owners = {\"scoring\": \"product\", \"review\": \"engineering\", \"release\": None}\nprint(sorted(k for k, v in owners.items() if not v))",
    "expect": "['release']",
    "limit": "This small executable model verifies the shown decision under synthetic inputs. It does not establish a complete delivery process or correctness of a production application.",
    "mistakes": [
      "Treating a local positive result as proof beyond its actual scope.",
      "Ignoring changed assumptions when reusing earlier evidence."
    ],
    "takeaways": [
      "Product work connects outcomes, user needs and priorities.",
      "Record who decides a scoring rule, implements it, reviews impact and authorizes release."
    ],
    "practice": "Who shares responsibility for quality?|The whole team|Only the final tester|Only the paying client|Only the release operator|Quality depends on requirements, design, implementation, evidence and operation.\nWhat should a domain expert clarify?|Business rule meaning|Every syntax preference|All server passwords|Every staff schedule|Domain expertise is especially relevant to the intended meaning and constraints of a rule.\nTwo scoring interpretations conflict. What helps first?|Concrete examples|A secret release|An arbitrary code patch|A larger ticket count|Examples expose the disagreement so the appropriate owner can resolve it.\nA release has implementers but no accountable approver. What is missing?|A decision owner|More branch labels|A newer IDE|A shorter changelog|Execution assignments do not establish who authorizes a release decision.\nA tester notices a requirement gap. When should it be discussed?|Before assumptions spread|Only after production|Only at payroll review|After deleting the test|Early clarification can prevent expensive downstream misunderstanding.\nA designer also runs usability tests. What follows?|Roles can overlap|Testing has disappeared|Review is unnecessary|Design is only coding|A person can cover several responsibilities while evidence and review remain necessary.\nAn approver asks for full database credentials solely to sign a release. What should be separated?|Authority and access|Build and source names|Ticket colors|Office schedules|Decision authority does not automatically require unrestricted operating access.\nA handoff says only done. What is useful to add?|Relevant evidence|Raw customer secrets|Unrelated meeting notes|A personal scorecard|A handoff should explain scope, assumptions, risks and acceptance evidence.",
    "final": "What does shared quality ownership require?|Contributions across stages|Waiting for final inspection|Removing specialist skills|Universal personal approval|Quality emerges from coordinated decisions and evidence throughout delivery.\nWhy distinguish responsibility from title?|Organizations vary|Titles prove competence|Roles never overlap|All decisions are technical|One person may cover several responsibilities and titles vary between organizations.\nWhat is useful in a decision record?|Owner and rationale|Only a staff nickname|Only a completion emoji|Only the project logo|Accountability and reasoning make an important decision understandable.\nAn LMS grading mismatch appears before coding. What should the team do?|Clarify the intended rule|Wait until final testing|Change scores secretly|Blame QA alone|Early concrete clarification can prevent implementation of the wrong behavior.\nA hospital adviser explains retention constraints. Who implements their technical effect?|The delivery team|Only the legal adviser|Every patient separately|An unowned external script|Domain authority supplies constraints while delivery collaborators implement and verify them.\nA developer lacks production access. Can they still review release evidence?|Yes|Never|Only after an outage|Only without tests|Review authority and operating credentials are separate concerns.\nA retail team claims its testers guarantee no defects. What needs correction?|The assurance claim|Only ticket spelling|Only the calendar|Only release naming|Testing supplies bounded evidence rather than proof of universal defect absence.\nA product owner prioritizes a feature while security flags high impact risk. What is needed?|An explicit decision|Ignoring the specialist|Hiding the risk|Claiming priority removes risk|Priority and technical risk require visible mitigation or accountable acceptance.\nA support issue crosses operations and engineering. What reduces gaps?|Named coordination|Private assumptions|Reassignment loops|Credential dumping|A named owner and escalation route prevent cross-team work being silently abandoned.\nA small SaaS team combines testing and development roles. What preserves confidence?|Evidence and review|Deleting acceptance criteria|Treating titles as proof|Suppressing negative cases|Combined staffing does not remove the need for clear evidence and review."
  },
  {
    "slug": "stories",
    "comp": "m2.c1",
    "title": "Specify observable acceptance outcomes",
    "intro": "A coordinator requests registration reminders. Send reminders does not identify recipients, timing or success. A useful story connects a person\u2019s purpose to observable behavior.",
    "sections": [
      [
        "Understand the distinction",
        "A story summarizes who needs a capability, what they need and why. It begins a conversation rather than replacing all specifications. Acceptance criteria relate declared conditions to observable outcomes.",
        "Avoid vague promises such as fast without a workload or timing boundary. Distinguish an implementation task such as create a job from the user outcome that the job should support."
      ],
      [
        "Apply the evidence boundary",
        "For reminders ask about eligibility, consent, closing time, timezone and retry behavior. Check normal, negative and boundary examples before implementing an assumed rule.",
        "Queued, provider-accepted, delivered and read are different states. Choose status language that matches evidence and avoid exposing private message contents just to make outcomes visible."
      ]
    ],
    "problem": "Inspect the synthetic specify observable acceptance outcomes example and compare its declared decisions.",
    "steps": [
      "Read the fixture inputs and policy before execution.",
      "Follow each calculation or decision using the stated assumptions.",
      "Compare the printed result with the expected output and identify what remains untested."
    ],
    "code": "def eligible(consent, now, close):\n    return consent and now < close\nprint(eligible(True, 99, 100))\nprint(eligible(True, 100, 100))\nprint(eligible(False, 99, 100))",
    "expect": "True\nFalse\nFalse",
    "limit": "This small executable model verifies the shown decision under synthetic inputs. It does not establish a complete delivery process or correctness of a production application.",
    "mistakes": [
      "Treating a local positive result as proof beyond its actual scope.",
      "Ignoring changed assumptions when reusing earlier evidence."
    ],
    "takeaways": [
      "A story summarizes who needs a capability, what they need and why.",
      "For reminders ask about eligibility, consent, closing time, timezone and retry behavior."
    ],
    "practice": "What does a user story mainly communicate?|Need and purpose|A full database schema|A guaranteed delivery date|Every method name|A story expresses a user-centered need and starts a conversation about details.\nWhat makes an acceptance criterion testable?|Observable behavior|An attractive slogan|A hidden assumption|A personal preference|A criterion connects specified conditions to an observable outcome.\nA reminder must be fast. What clarification is needed?|A measurable context|A shorter title|Another acronym|A different logo|Performance words need workload, timing boundaries and a relevant measure.\nA worker queues email successfully. Which status is accurate?|Queued|Delivered to inbox|Read by recipient|Approved by recipient|Queue acceptance does not establish external delivery or human reading.\nClosing-time equality is unspecified. What case should be discussed?|The exact boundary|An unrelated font|An old meeting date|Only compiler syntax|Equality often distinguishes plausible interpretations of temporal requirements.\nA task says create a cron job. What remains unproven?|The user outcome|Existence of code|The task identifier|The planning meeting|An internal task does not establish eligibility, timing or delivery correctness.",
    "final": "Which story component communicates value?|The reason or goal|The database table name|The deployment password|The developer initials|The reason links capability to a useful user or business outcome.\nWhat should an acceptance criterion emphasize?|An observable result|Editor settings|Private variable syntax|File-name styling|Criteria describe required behavior without unnecessarily prescribing internal construction.\nWhich example challenges consent-based sending?|No consent, no send|Valid consent and timing|A recorded request|A valid timestamp|Negative cases describe when the action must not happen.\nA university reminder omits its timezone. What should happen?|Resolve the ambiguity|Use any server default|Assume universal agreement|Remove date checks|Time interpretation affects observable eligibility and needs a defined rule.\nA logistics tracking story lists only database tasks. What is missing?|Acceptance outcomes|More table prefixes|A longer branch label|Another planning tool|Internal tasks do not establish what users can observe or rely on.\nA CRM promises reliable notifications. Which question makes this precise?|Which failures and retries?|Which logo only?|Which staff nickname only?|Which office floor only?|Reliability requires explicit failure cases, retry semantics and observed outcomes.\nA student changes consent after scheduling. What gap appears?|Evaluation timing|The IDE theme|The release filename|The developer keyboard|The authoritative consent state at the action boundary must be specified.\nA retailer reports success after a provider accepts an email request. What must be clear?|Acceptance vs delivery|Only provider branding|Only endpoint spelling|Only template naming|Provider acceptance and eventual delivery are different states.\nA hospital criterion conflicts with retention policy. What is needed?|Constraint reconciliation|Silent policy removal|Deleting all criteria|Treating tests as legal advice|Requirements should be consistent with applicable domain and privacy obligations.\nTwo workers may process the same reminder. What behavior needs clarification?|Repeated-action semantics|Only story numbering|Only team velocity|Only message fonts|Overlapping work and retries can affect externally visible duplicate actions."
  },
  {
    "slug": "examples",
    "comp": "m2.c1",
    "title": "Expose ambiguity with concrete examples",
    "intro": "A retailer offers free delivery above a threshold. People initially agree until they discuss a basket exactly at the threshold. Concrete examples expose disagreements hidden by broad language.",
    "sections": [
      [
        "Understand the distinction",
        "An example records conditions, input and expected outcome under a rule. Boundary examples examine transitions; negative examples examine disallowed states. These help discover requirements before tests are automated.",
        "Given/When/Then can organize context, action and result, but phrasing alone does not make an outcome precise. An oracle is a basis for judging whether observed behavior is correct."
      ],
      [
        "Apply the evidence boundary",
        "Ask whether thresholds include discounts, tax or delivery fees, which currency applies and how rounding works. Record unresolved questions instead of silently choosing an interpretation.",
        "Traceability connects a changed rule to cases and behavior it affects. A passing old test can preserve an obsolete requirement if expected values are copied without reviewing the new rule."
      ]
    ],
    "problem": "Inspect the synthetic expose ambiguity with concrete examples example and compare its declared decisions.",
    "steps": [
      "Read the fixture inputs and policy before execution.",
      "Follow each calculation or decision using the stated assumptions.",
      "Compare the printed result with the expected output and identify what remains untested."
    ],
    "code": "values = [4999, 5000, 5001]\nprint([x > 5000 for x in values])\nprint([x >= 5000 for x in values])",
    "expect": "[False, False, True]\n[False, True, True]",
    "limit": "This small executable model verifies the shown decision under synthetic inputs. It does not establish a complete delivery process or correctness of a production application.",
    "mistakes": [
      "Treating a local positive result as proof beyond its actual scope.",
      "Ignoring changed assumptions when reusing earlier evidence."
    ],
    "takeaways": [
      "An example records conditions, input and expected outcome under a rule.",
      "Ask whether thresholds include discounts, tax or delivery fees, which currency applies and how rounding works."
    ],
    "practice": "What is a test oracle?|A judgment basis|A test filename|A mandatory cloud service|A random expected value|An oracle supplies the basis for judging observed behavior.\nWhy inspect threshold equality?|To distinguish rules|To prove every input|To remove all decisions|To replace stakeholders|Equality differentiates inclusive and exclusive boundary interpretations.\nA rule changes while expected values stay fixed. What is the risk?|Stale assertions|Automatic new coverage|Guaranteed compatibility|Eliminated regression risk|Tests can preserve a former requirement if their expected outcomes are not reviewed.\nA scenario says then it works. What is missing?|A precise result|A longer name|A new label|A branch prefix|The result must be observable enough to determine whether the criterion holds.\nTwo documents disagree about discounts in a threshold. What is needed?|Resolve the conflict|Average their outcomes|Let each server decide|Hide one document|Contradictory rules need an explicit domain decision and aligned evidence.\nA changed rule affects multiple tests. What helps locate them?|Traceable mappings|More status colors|A larger test count|Only alphabetical sorting|Traceability connects requirements with affected behavior and acceptance cases.",
    "final": "What does Given commonly express?|Preconditions|Only the final result|Only implementation syntax|Only release approval|The context describes conditions before the action being examined.\nWhat does boundary analysis investigate?|Category transitions|Every possible state|Only common valid input|Only interface captions|Boundaries are places where a rule can change its outcome.\nWhy list unanswered questions?|Expose assumptions|Eliminate all decisions|Avoid stakeholders forever|Guarantee exact estimates|Visible questions prevent unresolved interpretations becoming hidden policy.\nA delivery dispute concerns exactly 50. Which example is most direct?|The equality case|An unrelated 500 basket|Only the product name|Only the release date|The disputed boundary directly distinguishes the interpretations.\nA hospital age rule omits when age is measured. What is needed?|A reference date|Only a field caption|Only a page theme|Only an export name|Age depends on a temporal reference that can affect eligibility.\nA logistics scenario lists conflicting expected statuses. What should QA do?|Seek rule resolution|Pick the shorter status|Randomize expected values|Accept either silently|A defensible test needs a resolved oracle instead of hidden contradiction.\nA bank changes rounding but old tests still pass. What should be examined?|Expectation relevance|Only test runtime|Only branch names|Only staff attendance|Passing assertions may still encode the previous rounding rule.\nAn LMS adds guardian access. What should be traced?|Permissions and cases|Only a story title|Only a changelog heading|Only test ordering|A new actor can affect access behavior and negative cases across surfaces.\nA SaaS suite repeats one normal category many times. What may be missing?|Meaningful boundaries|A larger badge count|More repeated assertions|A longer report|Repeated happy paths can leave category transitions and negative states uncovered.\nA provider document contradicts a contract. What is responsible?|Expose and resolve conflict|Assume the API is right|Ignore the contract silently|Claim both always apply|Conflicting authorities require a documented decision rather than a hidden assumption."
  },
  {
    "slug": "changes",
    "comp": "m2.c1",
    "title": "Manage scope and quality constraints",
    "intro": "A SaaS export must protect records and finish under a defined workload. Functional correctness alone does not establish access, capacity or recovery requirements.",
    "sections": [
      [
        "Understand the distinction",
        "Functional requirements describe capabilities. Quality constraints describe relevant properties such as latency, accessibility or recoverability under specified conditions. They are observable obligations rather than late decoration.",
        "Declare scope and exclusions honestly. A first release may exclude archives, but an exclusion must not contradict a mandatory domain obligation or silently remove necessary permissions."
      ],
      [
        "Apply the evidence boundary",
        "Assess a change for affected data, interfaces, tests, training and release timing. Approval authorizes chosen scope but does not remove the work needed to implement and verify it.",
        "Version important rules and evidence. A larger export limit can invalidate boundary and resource assumptions. Never rewrite a historical run to imply it tested a requirement that did not exist at that time."
      ]
    ],
    "problem": "Inspect the synthetic manage scope and quality constraints example and compare its declared decisions.",
    "steps": [
      "Read the fixture inputs and policy before execution.",
      "Follow each calculation or decision using the stated assumptions.",
      "Compare the printed result with the expected output and identify what remains untested."
    ],
    "code": "old = {\"max_rows\": 1000, \"history\": False}\nnew = {\"max_rows\": 5000, \"history\": False}\nprint(sorted(k for k in old.keys() | new.keys() if old.get(k) != new.get(k)))",
    "expect": "['max_rows']",
    "limit": "This small executable model verifies the shown decision under synthetic inputs. It does not establish a complete delivery process or correctness of a production application.",
    "mistakes": [
      "Treating a local positive result as proof beyond its actual scope.",
      "Ignoring changed assumptions when reusing earlier evidence."
    ],
    "takeaways": [
      "Functional requirements describe capabilities.",
      "Assess a change for affected data, interfaces, tests, training and release timing."
    ],
    "practice": "Which is a quality constraint?|Workload latency target|Export button action|Report field selection|Record creation request|Latency claims need a defined workload and observation boundary.\nWhy state exclusions?|Clarify promised scope|Hide mandatory controls|Erase earlier evidence|Guarantee agreement|An exclusion clarifies scope but still requires agreement and consistency with obligations.\nAn export limit rises fivefold. What should be reviewed?|Capacity and boundaries|Only ticket numbering|Only the version font|Only the staff roster|A larger limit can invalidate both operational assumptions and boundary tests.\nWhat does change approval establish?|Authorized chosen scope|No additional effort|Automatic test success|No dependencies remain|Approval records a decision but cannot remove implementation or assurance work.\nA past run is relabeled as covering a new rule. What is wrong?|Historical evidence changed|The filename grew|The report is searchable|The test used a fixture|Evidence must preserve the rule and conditions actually examined at the time.\nAn export omits its access scope. What is missing?|Who may retrieve data|Only CSV delimiters|Only the report title|Only scheduler naming|Private data export needs explicit authorization behavior.",
    "final": "Why version important acceptance rules?|Interpret past evidence|Prevent future changes|Eliminate all review|Replace executable tests|Versioning preserves the meaning of previous results and decisions.\nWhat makes a performance promise meaningful?|A workload context|A slogan about speed|A modern server name|A larger test count|Resource and timing claims require a workload and measurement boundary.\nWhat belongs in change impact analysis?|Affected evidence|Only a story number|Only author initials|Only meeting duration|Changes can affect dependent data, interfaces, tests and operations.\nA university export now includes history. What concern becomes relevant?|Authorized history scope|Only decorative icons|Only a release codename|Only keyboard shortcuts|Historical data can have distinct permissions, retention and size constraints.\nA retailer promises accessibility but tests only desktop totals. What remains?|A quality evidence gap|Proven mobile compliance|A fulfilled promise|Only an irrelevant style issue|The executed test does not establish the declared accessibility properties.\nA hospital story silently drops retention constraints. What needs checking?|Constraint consistency|Only JSON spacing|Only sprint numbering|Only test-title length|An isolated story edit must not contradict applicable domain requirements.\nA logistics stakeholder adds an integration before release. What is needed?|Impact and scope decision|Automatic inclusion|A renamed existing test|An unchanged risk statement|New dependencies require explicit assessment of effort, risk and acceptance.\nA team calls security excluded while returning private data. What is the issue?|Unsafe scope definition|A complete strategy|A permission grant|A useful simplification|Exclusions cannot justify ignoring protection necessary for the promised behavior.\nA bank tests 100 rows but promises 100000. What cannot be inferred?|Large-load behavior|The observed small result|The fixture count|The displayed field order|Small-scale success does not establish behavior at the larger promised workload.\nA SaaS change alters an external contract and schema. What is essential?|Cross-boundary traceability|Only a new screenshot|Only branch colors|Only a shorter status note|Impact should connect the contract with dependent data, behavior and evidence."
  },
  {
    "slug": "builds",
    "comp": "m3.c1",
    "title": "Identify artifacts and separate environments",
    "intro": "Support sees old behavior while a developer says the fix is on my machine. Immutable artifact identity explains what was tested and what is actually installed.",
    "sections": [
      [
        "Understand the distinction",
        "Source is editable input. A build transforms selected source and dependencies into an artifact. Deployment installs or activates it; release makes capability available to intended users. A feature flag can separate deployment from exposure.",
        "Record commit identity, build inputs and an artifact digest. A mutable label such as latest may point to changing bytes. A digest identifies content, not its correctness or the trustworthiness of its origin."
      ],
      [
        "Apply the evidence boundary",
        "Development, test and production serve different purposes. Names alone do not isolate credentials, data and external effects. Use synthetic data and controlled integrations when testing.",
        "Document differences in configuration, scale and permissions. Promote the tested bytes when evidence depends on identity; a rebuild with changed dependencies may fall outside the original assurance scope."
      ]
    ],
    "problem": "Inspect the synthetic identify artifacts and separate environments example and compare its declared decisions.",
    "steps": [
      "Read the fixture inputs and policy before execution.",
      "Follow each calculation or decision using the stated assumptions.",
      "Compare the printed result with the expected output and identify what remains untested."
    ],
    "code": "import hashlib\ntested = b\"fixture-v1\"\ncandidate = b\"fixture-v2\"\ndigest = lambda b: hashlib.sha256(b).hexdigest()\nprint(digest(tested) == digest(candidate))",
    "expect": "False",
    "limit": "This small executable model verifies the shown decision under synthetic inputs. It does not establish a complete delivery process or correctness of a production application.",
    "mistakes": [
      "Treating a local positive result as proof beyond its actual scope.",
      "Ignoring changed assumptions when reusing earlier evidence."
    ],
    "takeaways": [
      "Source is editable input.",
      "Development, test and production serve different purposes."
    ],
    "practice": "A release review must connect its test report to the exact bytes planned for installation. Which record directly supports that link?|Tested artifact digest|A mutable latest label|A developer branch nickname|An unversioned screenshot|An immutable digest identifies the tested content without by itself proving correctness.\nWhat can a digest establish?|Byte identity|Absence of defects|Business approval|Dependency safety|A digest identifies bytes without proving the content is correct or safe.\nTwo environments call different bytes latest. What is weak?|Stable identification|Story phrasing|Staff attendance|Acceptance numbering|Mutable labels do not establish that tested and installed artifacts match.\nA staging job sends real customer mail. What needs correction?|Side-effect isolation|Only its environment name|Only the package logo|Only its job description|Test integrations must be separated deliberately from real external effects.\nCode is deployed with its feature disabled. Is user release guaranteed?|No|Always|Only if a branch exists|Only when tests fail|Deployment and user exposure can be separate controlled decisions.\nProduction rebuilds use changed dependencies. What needs review?|Evidence applicability|Only build nicknames|Only changelog fonts|Only staff initials|New build inputs can alter behavior from the tested artifact.",
    "final": "Which activity installs an artifact?|Deployment|Story discovery|Requirement estimation|Retrospective|Deployment changes software installed or active in an environment.\nWhy avoid latest as sole artifact identity?|It can move|It is always malicious|It prevents testing|It proves corruption|A mutable label can identify different bytes at different times.\nDoes matching a hash prove correct behavior?|No|For every input|Only in production|Only in interfaces|Matching bytes do not establish requirement satisfaction or equivalent operating conditions.\nAn LMS test server uses a production mail key. What is the risk?|Unintended real effects|Better synthetic isolation|Automatic delivery safety|Privacy approval|Real credentials can cause real side effects even in an environment named test.\nA retailer builds the right commit with an unrecorded library update. What is uncertain?|Artifact behavior|Only the issue title|Only source naming|Only meeting length|Source identity alone does not capture all build inputs that may influence behavior.\nA bank deploys behind an off flag. What remains a separate decision?|User exposure|Code indentation|Ticket colors|Editor themes|Installation can precede controlled activation for users.\nA hospital says staging matches production because both use Linux. What is missing?|Relevant parity evidence|A shorter platform label|A matching clock only|A common staff roster|Permissions, data, configuration and integrations can differ despite a shared OS.\nA SaaS package changes after testing. What should happen?|Reestablish evidence scope|Keep old proof unchanged|Rename the report only|Hide the mismatch|Evidence should identify the bytes tested and the checks relevant to a changed artifact.\nA logistics rollback references an overwritten tag. What is needed?|Immutable recovery identity|Only a historical screenshot|Only a branch description|Only an old meeting note|Recovery must reliably identify the intended artifact rather than trust a moving label.\nA pipeline promotes the same bytes but changes privileges. What still needs evidence?|Runtime configuration|Only another digest|Only comment style|Only the release caption|Byte identity does not establish safe permissions or equivalent operating behavior."
  },
  {
    "slug": "gates",
    "comp": "m3.c1",
    "title": "Make release gates and recovery decisions explicit",
    "intro": "An assessment update changes score storage as well as page behavior. A release gate needs evidence relevant to both, plus a realistic recovery decision.",
    "sections": [
      [
        "Understand the distinction",
        "Entry criteria specify when a stage may begin; exit criteria describe evidence needed to leave. Report scope, artifact identity, test results, known issues, data effects and assumptions. A checkbox is meaningful only when it reflects relevant evidence.",
        "Passing unit tests do not automatically establish migration compatibility or external integration safety. An unmet criterion needs an explicit accountable decision, not silent editing of the result."
      ],
      [
        "Apply the evidence boundary",
        "Rollback restores an earlier version or state; roll-forward applies a corrective change. Changed schemas, queued work and external messages can make binary rollback incomplete. Review compatibility and restoration assumptions before activation.",
        "Assign stopping authority and signals in advance. A recovery document is not proof that backups, artifacts and permissions are accessible. Test the procedure at an appropriate isolated boundary before making operational claims."
      ]
    ],
    "problem": "Inspect the synthetic make release gates and recovery decisions explicit example and compare its declared decisions.",
    "steps": [
      "Read the fixture inputs and policy before execution.",
      "Follow each calculation or decision using the stated assumptions.",
      "Compare the printed result with the expected output and identify what remains untested."
    ],
    "code": "evidence = {\"unit\": True, \"integration\": True, \"migration\": False}\nprint(all(evidence.values()))\nprint(sorted(k for k, v in evidence.items() if not v))",
    "expect": "False\n['migration']",
    "limit": "This small executable model verifies the shown decision under synthetic inputs. It does not establish a complete delivery process or correctness of a production application.",
    "mistakes": [
      "Treating a local positive result as proof beyond its actual scope.",
      "Ignoring changed assumptions when reusing earlier evidence."
    ],
    "takeaways": [
      "Entry criteria specify when a stage may begin; exit criteria describe evidence needed to leave.",
      "Rollback restores an earlier version or state; roll-forward applies a corrective change."
    ],
    "practice": "What should a release gate evaluate?|Relevant evidence|Only test count|Only branch naming|Only author seniority|A gate needs evidence applicable to the proposed change and its remaining risks.\nWhat does rollback restore under a declared procedure?|An earlier state|Every external effect|All lost customer data|An untested new feature|Recovery scope is limited by what the procedure actually restores.\nA migration lacks compatibility evidence. What is honest?|Evidence is missing|It is safe by default|Other tests imply success|The check can be erased|Missing evidence should remain explicit rather than inferred from unrelated success.\nAn email was sent before rollback. What is true?|It can remain sent|Rollback unsends it|Old code recalls it|The test report erases it|External effects are not automatically undone by restoring application bytes.\nA failed gate is changed to green without new evidence. What failed?|Decision integrity|Only UI styling|Only artifact naming|Only timestamp sorting|A gate must reflect evidence or a documented risk decision, not fabricated success.\nWhen should stopping authority be assigned?|Before activation|After the outage|Only at payroll|After old builds are deleted|Prepared ownership and triggers support timely containment.",
    "final": "What is an exit criterion?|Required leaving evidence|A developer nickname|Only a meeting end time|A compiler setting|Exit criteria specify what must be established before leaving a delivery stage.\nWhat distinguishes roll-forward recovery?|A corrective new change|Always restoring old data|Undoing every message|Deleting later evidence|Roll-forward repairs the current state through an additional change.\nWhy report known release issues?|Expose residual risk|Guarantee no failures|Replace acceptance checks|Prove recovery works|Known issues let an accountable decision maker assess remaining impact and mitigation.\nAn LMS changes score storage but tests only captions. What is missing?|Data-change assurance|More screenshot colors|A longer version tag|More meeting notes|Page-text evidence does not establish score migration or data compatibility.\nA retailer can reinstall old code against an incompatible schema. What does this show?|Rollback limits|Proven full recovery|Automatic data reversal|An always-safe old version|Earlier code can fail against changed data without compatible sequencing or recovery.\nA hospital approver sees a mandatory failed gate. What preserves accountability?|Explicit risk disposition|Editing its result silently|Hiding the failed run|Replacing it with branding|An unresolved criterion requires a documented authorized decision, not false evidence.\nA cloud release sends duplicate invoices. What must recovery consider?|External business effects|Only container replacement|Only source order|Only tag spelling|Customer-facing effects may persist after application restoration.\nA university has a restore document but no accessible backup. What remains uncertain?|Recovery readiness|The document existence|The policy spelling|The author identity|A written plan does not establish that restoration inputs and permissions are usable.\nA logistics gate uses last month\u2019s run for new bytes. What is the issue?|Freshness and scope|Only test-name length|Only report branding|Only chronological order|Evidence must correspond to the artifact and conditions being approved.\nA SaaS unit suite passes but dependency behavior is unknown. What is responsible?|Expose the gap|Declare universal safety|Treat unknown as passed|Delete the dependency check|Bounded success does not justify a broader untested compatibility claim."
  },
  {
    "slug": "observe",
    "comp": "m3.c1",
    "title": "Observe releases and close the feedback loop",
    "intro": "A student dashboard works in staging but fails for some production roles. Controlled exposure and useful signals can reveal gaps sooner without leaking private records into diagnostics.",
    "sections": [
      [
        "Understand the distinction",
        "A health check can show process reachability while an important user journey fails. Define relevant success, latency, queue and correctness signals with observation boundaries. Compare cohorts with attention to traffic mix and sample quality.",
        "A canary limits initial exposure. A feature flag can control activation, but old and new behavior still need compatible data and authorization. A small cohort reduces possible impact without proving safety for every population."
      ],
      [
        "Apply the evidence boundary",
        "Record safe correlation identifiers, event categories and outcomes under controlled access and retention. Raw credentials and student records are not justified merely by debugging convenience. Separate observations from hypotheses when investigating.",
        "After recovery, link evidence to improved requirements, tests, monitoring or operating practices. Assign owners and inspect whether follow-up changes affected the risk. Blame alone does not explain why safeguards failed."
      ]
    ],
    "problem": "Inspect the synthetic observe releases and close the feedback loop example and compare its declared decisions.",
    "steps": [
      "Read the fixture inputs and policy before execution.",
      "Follow each calculation or decision using the stated assumptions.",
      "Compare the printed result with the expected output and identify what remains untested."
    ],
    "code": "requests, errors = 200, 12\nrate = errors / requests if requests else None\nprint(round(rate, 3))\nprint(rate is not None and rate > 0.02)",
    "expect": "0.06\nTrue",
    "limit": "This small executable model verifies the shown decision under synthetic inputs. It does not establish a complete delivery process or correctness of a production application.",
    "mistakes": [
      "Treating a local positive result as proof beyond its actual scope.",
      "Ignoring changed assumptions when reusing earlier evidence."
    ],
    "takeaways": [
      "A health check can show process reachability while an important user journey fails.",
      "Record safe correlation identifiers, event categories and outcomes under controlled access and retention."
    ],
    "practice": "What is a canary rollout?|Limited initial exposure|A test replacement|A safety guarantee|A public debug dump|A canary limits exposure while relevant effects are inspected before expansion.\nWhat does a health check establish?|Its checked condition|Every user journey|All record correctness|Every permission rule|Evidence is limited to the condition the health check actually observes.\nA log dumps raw learner records. What should be reviewed?|Diagnostic minimization|Only filename styling|Only event colors|Only release numbering|Diagnosis must avoid unnecessary sensitive disclosure and control access and retention.\nA canary receives no traffic. What rate evidence exists?|Insufficient observations|Exactly zero risk|A proven zero error rate|Automatic approval|An empty sample cannot establish an observed error rate under use.\nAn incident report mixes guesses and observations. What should be distinguished?|Hypotheses and facts|Only staff initials|Only ticket colors|Only artifact names|Separating facts from proposed explanations prevents unsupported causal claims.\nAn improvement has no owner or follow-up. What is missing?|Accountable execution|Only an event title|Only calendar layout|Only naming conventions|Learning requires completed action and later inspection of its effect.",
    "final": "Which is a relevant rollout signal?|Service outcome|Only deployment count|Only code-line count|Only meeting attendance|Useful signals connect observation to user or service behavior.\nWhy minimize diagnostic data?|It can expose private facts|Logs are never sensitive|Debugging permits all access|Errors erase privacy duties|Operational evidence can contain sensitive information and needs deliberate controls.\nWhat should an incident timeline separate?|Facts and hypotheses|Only staff seniority|Only page captions|Only branch colors|A clear timeline distinguishes observations from explanations and decisions.\nA canary succeeds for ten staff accounts. What cannot be assumed?|All populations are safe|The observed sample existed|The sample was small|The flag was enabled|A limited cohort does not establish equivalent behavior for other roles, data or workloads.\nA retailer health endpoint works but checkout fails. What should monitoring cover?|The critical journey|Only reachability|Only timestamps|Only log existence|A running process is insufficient evidence that a key user outcome works.\nHospital errors rise after release while traffic changes. What is needed?|Comparable evidence|Only release naming|Only code formatting|Only the daily agenda|Temporal correlation does not establish cause without considering traffic and other changes.\nAn LMS disables a feature after harmful writes. What remains necessary?|Assess data consequences|Assume all effects vanished|Delete incident records|Skip affected-user analysis|Stopping exposure does not repair persistent or external effects automatically.\nA cloud dashboard shows zero errors from zero requests. What is defensible?|No rate evidence yet|Zero future failure|Guaranteed rollout safety|Certain improvement|An empty denominator cannot establish operational reliability under requests.\nA SaaS incident reveals a missing boundary case. What closes the loop?|Complete and inspect|Record blame only|Rename the dashboard|Increase ticket volume|A corrective action must be completed and evaluated against the failure mechanism.\nA logistics anomaly is reproduced with synthetic data. What should stay clear?|The reproduction scope|One model proves all cases|All secrets should be copied|A model guarantees root cause|A local reproduction supplies bounded evidence rather than universal causal proof."
  }
]);
Object.defineProperty(bundle.course,'authoredBank',{value:bundle.bank});module.exports=bundle.course;
