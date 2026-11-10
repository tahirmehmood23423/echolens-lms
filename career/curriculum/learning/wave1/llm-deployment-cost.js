'use strict';
const {build,reference}=require('./llm-wave3-helper');
module.exports=build("llm-deployment-cost", [
  {
    "slug": "deployment-constraints",
    "comp": "m1.c1",
    "title": "Choose deployment modes using hard constraints",
    "intro": "A benefits assistant must keep certain records in an approved location and answer within a response budget. Hosted and self-hosted choices need evidence against those requirements.",
    "headings": [
      "Define the decision and its boundary",
      "Apply and verify the engineering policy"
    ],
    "sections": [
      [
        "Start deployment selection with task scope, data handling, latency, throughput and operational ownership. Hosted APIs can reduce model-serving work but introduce external service dependencies and service-specific data terms. Self-hosting gives more control over infrastructure while making the team responsible for serving capacity, updates and security.",
        "Apply hard constraints before ranking candidates by cost. A cheap endpoint that fails a mandatory location or licensing requirement is ineligible. Private network placement does not automatically make a self-hosted stack compliant; administrators, logs, backups and model license conditions still matter."
      ],
      [
        "Compare eligible options on the same representative tasks and load assumptions. Include model quality, tail latency, availability dependencies and failure handling. A benchmark on a warm unloaded server does not establish performance under concurrent production requests.",
        "The fixture filters synthetic deployment options by region and quality, then chooses the cheapest eligible estimate. It demonstrates constrained selection only. Invented costs are not current vendor prices, and the calculation does not validate contracts, licenses or deployment readiness."
      ]
    ],
    "problem": "Choose deployment modes using hard constraints using a declared synthetic fixture.",
    "code": "options = [{\"name\": \"hosted-a\", \"region\": \"approved\", \"quality\": 0.9, \"cost\": 8}, {\"name\": \"local-b\", \"region\": \"approved\", \"quality\": 0.85, \"cost\": 6}, {\"name\": \"hosted-c\", \"region\": \"other\", \"quality\": 0.95, \"cost\": 3}]\neligible = [x for x in options if x[\"region\"] == \"approved\" and x[\"quality\"] >= 0.8]\nprint(min(eligible, key=lambda x: x[\"cost\"])[\"name\"])\nprint(len(eligible))",
    "expect": "local-b\n2",
    "limit": "Synthetic estimates do not establish real pricing, legal eligibility, production quality or regional data handling.",
    "steps": [
      "Identify the fixture inputs and the invariant stated in the lesson.",
      "Apply the explicit calculation or validation rule in application code.",
      "Compare the printed result with the expected output and identify the untested production assumptions."
    ],
    "mistakes": [
      "Synthetic estimates do not establish real pricing, legal eligibility, production quality or regional data handling.",
      "Assuming this isolated fixture replaces representative integration tests and human review."
    ],
    "takeaways": [
      "Start deployment selection with task scope, data handling, latency, throughput and operational ownership.",
      "Compare eligible options on the same representative tasks and load assumptions."
    ],
    "cards": [
      [
        "What comes before cost ranking?",
        "Which selection step must precede comparing eligible deployment costs?",
        "Required limits",
        "Vendor popularity",
        "Parameter count",
        "Warm-server speed",
        "Mandatory requirements determine which options may be considered."
      ],
      [
        "Who owns self-hosted serving operations?",
        "Which responsibility generally increases with self-hosting?",
        "Stack operations",
        "External API billing",
        "Provider-side retention",
        "Vendor-managed upgrades",
        "Operating the inference stack shifts capacity and maintenance work to the deploying team."
      ],
      [
        "Does private hosting guarantee compliance?",
        "Which conclusion needs evidence beyond private network placement?",
        "Compliance",
        "Network placement",
        "Server installation",
        "Route configuration",
        "Permissions, logs, backups, licenses and data lifecycle still require review."
      ],
      [
        "How should an ineligible cheap option be treated?",
        "A low-cost endpoint violates a mandatory region requirement. What should selection do?",
        "Exclude it",
        "Prefer its savings",
        "Use for long prompts",
        "Use during incidents",
        "A hard deployment constraint is not traded away for lower estimated price."
      ],
      [
        "What supports a useful model comparison?",
        "Two options have scores from unrelated task sets. What is needed before ranking quality?",
        "Shared task tests",
        "Same product logo",
        "Equal parameter count",
        "Same marketing tier",
        "Task distribution and scoring criteria must be aligned for meaningful comparison."
      ],
      [
        "What workload limitation affects a warm benchmark?",
        "A self-hosted model meets latency targets with one request but production is concurrent. What needs testing?",
        "Loaded tail latency",
        "Only idle latency",
        "Only model size",
        "Only download speed",
        "Queueing and contention under load can change response latency substantially."
      ],
      [
        "What demonstrates that a backup can survive a shared provider outage?",
        "A hosted primary and cheaper backup share one region and provider quota. Each passes isolated quality tests. The service must continue during that region’s outage, with a fixed data-location rule. Which missing evidence matters most?",
        "Eligible independent recovery tested under outage load",
        "Backup mean latency measured while the primary is healthy",
        "Separate API keys with matching single-request throughput",
        "A cheaper backup price within the existing shared quota",
        "Shared region or quota failures can disable both routes. Recovery requires an eligible path with appropriate independence, quality, capacity and tested failover; separate keys, idle latency and price do not establish it."
      ],
      [
        "How should a license constraint be used?",
        "A model performs well but its license is incompatible with the intended use. What follows?",
        "Ineligible under license",
        "Quality overrides terms",
        "Private hosting waives terms",
        "Caching waives terms",
        "Deployment choices must meet applicable licensing constraints as well as technical targets."
      ],
      [
        "What does task-specific quality affect?",
        "An inexpensive model fails required language cases. Which choice is justified?",
        "Restrict scope",
        "Assume language transfer",
        "Ignore minority tasks",
        "Only add concurrency",
        "Candidate quality must match the actual deployment requirements and supported scope."
      ],
      [
        "What demonstrates that a backup can survive a shared provider outage?",
        "Two deployments pass task-quality gates. Hosted costs $200/month and meets peak latency but violates a mandatory region rule. Local costs $500/month and satisfies location but breaches peak latency; idle latency passes. The $600 budget and both gates are hard. Which decision is justified?",
        "Test a within-budget redesign against both gates before choice",
        "Select local because idle latency and budget already pass",
        "Select hosted because its lower cost funds later remediation",
        "Average both gate scores and choose the better total",
        "Neither evaluated deployment satisfies all hard constraints. A redesign or explicitly revised authorized scope must be tested against location, peak latency and budget; cost savings and idle measurements do not waive failed gates."
      ]
    ]
  },
  {
    "slug": "capacity-economics",
    "comp": "m1.c1",
    "title": "Model utilization and full operating cost",
    "intro": "A team compares a usage-priced API with a dedicated inference server. A low hourly server price says little without workload and capacity assumptions.",
    "headings": [
      "Define the decision and its boundary",
      "Apply and verify the engineering policy"
    ],
    "sections": [
      [
        "Total cost includes provider usage or infrastructure, engineering, observability, storage, networking and failure handling. For self-hosting, distinguish allocated capacity from useful work. Low utilization can make a dedicated server expensive per successful request even when its maximum throughput looks attractive.",
        "A simple break-even calculation compares fixed cost plus variable local cost against usage-priced cost for the same successful workload. Keep units consistent and include failed attempts. Break-even changes when request lengths, batching, utilization, quality or staffing assumptions change."
      ],
      [
        "Capacity planning should consider concurrency, queueing, cold starts and headroom. Queue depth and service times affect waiting; a server close to saturation may have poor tail latency. Batching can improve throughput but may add waiting and change latency. Measure the relevant tradeoff under realistic load.",
        "The fixture compares two invented monthly cost formulas at two volumes. It omits many operational details deliberately. Its output explains why there is no universal cheapest deployment mode and why a cost estimate must state its assumptions."
      ]
    ],
    "problem": "Model utilization and full operating cost using a declared synthetic fixture.",
    "code": "fixed = 600\nlocal_per_request = 0.002\napi_per_request = 0.01\nfor volume in [10000, 100000]:\n    local = fixed + volume * local_per_request\n    api = volume * api_per_request\n    print(f\"{local:.0f} {api:.0f}\")",
    "expect": "620 100\n800 1000",
    "limit": "The invented formulas omit staffing, idle capacity, quality differences and current provider prices.",
    "steps": [
      "Identify the fixture inputs and the invariant stated in the lesson.",
      "Apply the explicit calculation or validation rule in application code.",
      "Compare the printed result with the expected output and identify the untested production assumptions."
    ],
    "mistakes": [
      "The invented formulas omit staffing, idle capacity, quality differences and current provider prices.",
      "Assuming this isolated fixture replaces representative integration tests and human review."
    ],
    "takeaways": [
      "Total cost includes provider usage or infrastructure, engineering, observability, storage, networking and failure handling.",
      "Capacity planning should consider concurrency, queueing, cold starts and headroom."
    ],
    "cards": [
      [
        "What belongs in total operating cost?",
        "Which cost can be missed by a token-only comparison?",
        "Operating effort",
        "Input-token charges",
        "Output-token charges",
        "Per-request usage fees",
        "Operating and failure-handling work contributes to total cost beyond inference usage."
      ],
      [
        "What is utilization?",
        "Which ratio describes useful demand relative to allocated serving capacity?",
        "Utilization",
        "Model accuracy",
        "Cache freshness",
        "Source relevance",
        "Allocated capacity can remain paid for while idle."
      ],
      [
        "Why keep cost units consistent?",
        "Which comparison would be dimensionally invalid?",
        "Monthly versus unit cost",
        "Consistent monthly totals",
        "Consistent currency units",
        "Tokens times unit rate",
        "Rates must be converted to a common workload and period before comparison."
      ],
      [
        "How can low traffic change self-hosting economics?",
        "A dedicated server is mostly idle while an API charges per request. Which factor matters?",
        "Unused capacity cost",
        "Only peak throughput",
        "Only model file size",
        "Only warm-call latency",
        "Paying for unused capacity can dominate low-volume unit costs."
      ],
      [
        "What does batching trade off?",
        "An inference server waits to collect more requests into a batch. What may increase?",
        "Batch waiting latency",
        "Authorization strength",
        "Evidence freshness",
        "License eligibility",
        "Batch formation can improve throughput while delaying individual requests."
      ],
      [
        "Why include failed attempts?",
        "Two routes produce equal successful answers, but one retries frequently. What cost basis is fair?",
        "Every attempt",
        "Only final response",
        "Only accepted tokens",
        "Only first request",
        "Resources consumed by failed work contribute to cost per successful task."
      ],
      [
        "What should saturation testing examine?",
        "Average latency rises sharply near peak load. Which measure helps reveal user impact?",
        "Loaded tail latency",
        "Only unloaded mean",
        "Only parameter count",
        "Only advertised throughput",
        "Queueing often affects the slowest requests most strongly."
      ],
      [
        "When does a break-even estimate need revision?",
        "Prompt lengths and traffic volume change after launch. What should be updated?",
        "Traffic assumptions",
        "Only dashboard labels",
        "Only endpoint alias",
        "Only source filenames",
        "Cost crossover depends on volume and per-request resource demand."
      ],
      [
        "Can throughput establish task adequacy?",
        "A fast server serves low-quality answers cheaply. Which missing condition matters?",
        "Required task quality",
        "Only requests per second",
        "Only device utilization",
        "Only hourly price",
        "A cheap unsuccessful task is not equivalent to a successful required outcome."
      ],
      [
        "What does the two-volume fixture show?",
        "A local server wins estimated cost at high volume, but its quality is lower and half its capacity is idle. What comparison should decide the business choice?",
        "Full cost per successful task under measured load",
        "Peak throughput divided by hourly price alone",
        "Parameter count divided by GPU memory alone",
        "Published API token price without output costs",
        "Useful comparisons include utilization, quality and downstream effort on the same delivered workload."
      ]
    ]
  },
  {
    "slug": "rollout-routing",
    "comp": "m1.c1",
    "title": "Roll out model changes with versioned routing",
    "intro": "A service upgrades its default model while keeping the same feature name. A controlled rollout should reveal behavior changes before every user is affected.",
    "headings": [
      "Define the decision and its boundary",
      "Apply and verify the engineering policy"
    ],
    "sections": [
      [
        "Record a deployment configuration that binds the prompt, model version, output contract and relevant evidence version. This makes a candidate identifiable even when a marketing alias stays unchanged. Verify endpoint capabilities before sending copied parameters from a historical example.",
        "A canary exposes a limited eligible cohort to a candidate and measures declared quality and operational gates. Shadow evaluation can compare behavior without serving the candidate answer, but still incurs work and data-processing obligations. Assign comparable cohorts and avoid contaminating a control group through shared private cache entries."
      ],
      [
        "Define rollback triggers and a tested stable route before expanding traffic. A fallback must meet the same privacy and task constraints; it may also share provider limits or failure domains with the primary. A traffic percentage is a control mechanism, not evidence that the candidate is safe.",
        "The fixture deterministically assigns synthetic request numbers to a ten-percent candidate bucket. This helps reproduce routing in a local example. Real allocation requires a suitable stable hash or assignment mechanism and checks for distribution bias, privacy and cross-device behavior."
      ]
    ],
    "problem": "Roll out model changes with versioned routing using a declared synthetic fixture.",
    "code": "requests = list(range(20))\ncandidate = [r for r in requests if r % 10 == 0]\nprint(candidate)\nprint(len(candidate) / len(requests))",
    "expect": "[0, 10]\n0.1",
    "limit": "Modulo over synthetic sequential ids is not a production randomization or fairness guarantee.",
    "steps": [
      "Identify the fixture inputs and the invariant stated in the lesson.",
      "Apply the explicit calculation or validation rule in application code.",
      "Compare the printed result with the expected output and identify the untested production assumptions."
    ],
    "mistakes": [
      "Modulo over synthetic sequential ids is not a production randomization or fairness guarantee.",
      "Assuming this isolated fixture replaces representative integration tests and human review."
    ],
    "takeaways": [
      "Record a deployment configuration that binds the prompt, model version, output contract and relevant evidence version.",
      "Define rollback triggers and a tested stable route before expanding traffic."
    ],
    "cards": [
      [
        "What identifies an evaluated deployment?",
        "Which record binds behavior to a reproducible candidate?",
        "Model/prompt versions",
        "Only feature name",
        "Only vendor identity",
        "Only endpoint alias",
        "Prompt, model and contract versions identify the system actually tested."
      ],
      [
        "What is shadow evaluation?",
        "Which route evaluates a candidate without serving its answer?",
        "Shadow testing",
        "Full replacement",
        "Unbounded retry",
        "Public publication",
        "Shadow work can produce comparison evidence without becoming the user-facing response."
      ],
      [
        "Does a small canary guarantee safety?",
        "Which claim is unsupported by a low traffic percentage alone?",
        "Candidate task safety",
        "Limited initial exposure",
        "Configured traffic route",
        "Chosen bucket fraction",
        "Traffic restriction limits exposure but does not validate task behavior."
      ],
      [
        "What should trigger rollback?",
        "A canary exceeds a predeclared critical failure threshold. What should routing do?",
        "Tested stable route",
        "Immediate expansion",
        "Hidden failed cohort",
        "Relaxed failure criteria",
        "Rollout decisions should follow explicit quality and operational gates."
      ],
      [
        "What can confound a model canary?",
        "Candidate answers enter a shared cache served to the control cohort. What is compromised?",
        "Cohort isolation",
        "Request formatting",
        "Token spelling",
        "Clock precision",
        "Cross-route cache reuse can blur which system produced observed behavior."
      ],
      [
        "What must shadow requests still obey?",
        "A candidate receives copied private prompts for comparison. Which requirement remains?",
        "Authorized data processing",
        "Automatic research exemption",
        "Unlimited raw traces",
        "Indefinite data retention",
        "Shadow processing remains real processing of the supplied data."
      ],
      [
        "Why verify fallback independence?",
        "A backup uses the same throttled model pool as the primary. Which limitation matters?",
        "Shared provider dependency",
        "Different model labels",
        "Different key names",
        "Different client libraries",
        "A nominal backup may not restore availability when it shares the constrained dependency."
      ],
      [
        "What must precede traffic expansion?",
        "The candidate is faster on a tiny demo. Which evidence is still required?",
        "Task release gates",
        "Only lower mean latency",
        "Only a new model label",
        "Only a successful demo",
        "Rollout quality needs task and operational evidence beyond one favorable demonstration."
      ],
      [
        "How should historical API examples be used?",
        "A copied notebook uses a parameter rejected by the current endpoint. What should the adapter follow?",
        "Current API contract",
        "Historical example alone",
        "Client-side guesses",
        "Repeated invalid calls",
        "Pinned references inform concepts but do not guarantee present endpoint compatibility."
      ],
      [
        "What does modulo assignment establish?",
        "A canary is faster, but its cache feeds candidate answers into the control group and its fallback is untested. What should happen before expansion?",
        "Isolate cohorts; test fallback",
        "Expand because the latency mean improved",
        "Count all cache hits as control successes",
        "Disable version tracking to simplify comparison",
        "Contaminated cohorts weaken attribution, and the fallback is part of the user-visible behavior requiring validation."
      ]
    ]
  },
  {
    "slug": "usage-cost",
    "comp": "m2.c1",
    "title": "Calculate token spend and cost per successful task",
    "intro": "A summarization feature has short prompts but long responses and frequent repairs. Counting input tokens alone understates the cost of delivering useful work.",
    "headings": [
      "Define the decision and its boundary",
      "Apply and verify the engineering policy"
    ],
    "sections": [
      [
        "For a simple usage-priced endpoint, estimated charge equals input tokens times the input rate plus output tokens times the output rate, using the rate’s declared unit. Real billing may distinguish cached input, reasoning, tools, images or other categories. Verify the actual model and dated price contract rather than hardcoding tutorial numbers as current prices.",
        "Costs should be attributable to the feature and request path. Record permitted usage metadata, attempts and completion outcomes without retaining private content unnecessarily. Missing usage telemetry must remain unknown until reconciled; it should not be counted as zero spend."
      ],
      [
        "Optimize cost per successful task rather than cost per raw request. Include retries, validation, retrieval, fallback and human repair where relevant. An optimization that lowers token cost while increasing failure rate can make the full workflow more expensive and less useful.",
        "The fixture uses integer micro-unit rates to avoid floating-point money ambiguity and divides by a fixed million-token pricing unit. The rates and counts are invented. It demonstrates arithmetic and units, not a provider invoice or an accurate estimate for a live model."
      ]
    ],
    "problem": "Calculate token spend and cost per successful task using a declared synthetic fixture.",
    "code": "input_tokens, output_tokens = 2000, 500\ninput_rate, output_rate = 100, 400\ncharge_cents = (input_tokens * input_rate + output_tokens * output_rate) / 1000000\nprint(f\"{charge_cents:.2f}\")\nspend = 12\nsuccesses = 8\nprint(f\"{spend / successes:.2f}\")",
    "expect": "0.40\n1.50",
    "limit": "Invented per-million rates and success counts do not represent live vendor billing or a complete cost model.",
    "steps": [
      "Identify the fixture inputs and the invariant stated in the lesson.",
      "Apply the explicit calculation or validation rule in application code.",
      "Compare the printed result with the expected output and identify the untested production assumptions."
    ],
    "mistakes": [
      "Invented per-million rates and success counts do not represent live vendor billing or a complete cost model.",
      "Assuming this isolated fixture replaces representative integration tests and human review."
    ],
    "takeaways": [
      "For a simple usage-priced endpoint, estimated charge equals input tokens times the input rate plus output tokens times the output rate, using the rate’s declared unit.",
      "Optimize cost per successful task rather than cost per raw request."
    ],
    "cards": [
      [
        "Which tokens belong in a basic usage estimate?",
        "What does a two-rate text cost model include?",
        "Input and output usage",
        "Input only",
        "Output characters only",
        "Request count only",
        "Input and output may have different charges and both contribute to the estimate."
      ],
      [
        "Why state the pricing unit?",
        "Which mismatch can inflate a token estimate by a million?",
        "Per-token unit mismatch",
        "Consistent currency conversion",
        "Summed usage categories",
        "Integer token counts",
        "A rate must be applied using its declared token unit."
      ],
      [
        "What should missing usage mean?",
        "Which accounting value fits an interrupted request without confirmed usage?",
        "Unconfirmed usage",
        "Zero charge",
        "Average charge",
        "Guaranteed free request",
        "Unavailable telemetry does not establish that no billable work occurred."
      ],
      [
        "What is a useful optimization denominator?",
        "A cheaper route needs more retries to finish tasks. Which metric captures that tradeoff?",
        "Full cost per success",
        "Cost per first call",
        "Only input unit rate",
        "Raw request count",
        "The business result depends on total work needed for successful completion."
      ],
      [
        "Why use dated price evidence?",
        "A tutorial contains last year’s model rates. What should planning consult?",
        "Current API contract",
        "Historical rates forever",
        "Other models’ rates",
        "Only parameter count",
        "Prices and billing categories can change by service and model version."
      ],
      [
        "What costs belong to repair-heavy workflows?",
        "A low-cost model often needs human correction. Which cost should be added?",
        "Correction effort",
        "Only output tokens",
        "Only stored model bytes",
        "Only serialization work",
        "Downstream intervention is part of delivering the required task outcome."
      ],
      [
        "How should per-feature budgets be tracked?",
        "Several products share one provider account and spend rises. Which telemetry helps attribute the cause?",
        "Per-feature usage",
        "Only account total",
        "Only vendor identity",
        "Only endpoint uptime",
        "Useful attribution connects costs to the workload and route that caused them."
      ],
      [
        "What should failed-attempt accounting do?",
        "A timeout leads to another generation and the first later appears on the bill. Which policy fits?",
        "Both billable attempts",
        "Discard timeout cost",
        "Only successful tokens",
        "Assume instant cancellation",
        "Caller timeout does not prove that remote computation stopped or was free."
      ],
      [
        "What if token savings reduce task quality?",
        "A shorter prompt omits a mandatory exception and causes extra escalations. How should savings be assessed?",
        "Complete task outcomes",
        "Only prompt length",
        "Only nominal unit rate",
        "Only raw request count",
        "Resource reduction must be evaluated alongside correctness and downstream cost."
      ],
      [
        "What can the local arithmetic verify?",
        "A route halves per-attempt token cost but doubles retries and increases human repairs. Which measure tests whether it actually saves money?",
        "Total cost per successful completed task",
        "Input cost on the first attempt alone",
        "Cheapest model rate multiplied by user count",
        "Only accepted output tokens with failed calls excluded",
        "The full delivered result includes recovery and repair costs, so cheaper individual calls can be a false economy."
      ]
    ]
  },
  {
    "slug": "cache-and-trim",
    "comp": "m2.c1",
    "title": "Cache safely and trim context without losing requirements",
    "intro": "A policy assistant repeats common questions. Caching and prompt trimming can reduce work, but stale or cross-tenant answers would make the apparent savings misleading.",
    "headings": [
      "Define the decision and its boundary",
      "Apply and verify the engineering policy"
    ],
    "sections": [
      [
        "A response cache stores an application result; provider prompt caching reuses supported input computation under a service contract. They are different mechanisms with different invalidation and privacy concerns. A response cache needs a key that represents relevant user scope, prompt/model version and evidence state.",
        "Exact cache hits are easier to reason about than semantic matches. Similar questions may differ in date, account or policy exception. Cache reuse must preserve authorization and freshness. Choose retention and invalidation deliberately, and verify permissions again when their state can change independently of cache age."
      ],
      [
        "Context trimming should preserve task instructions, required constraints and the evidence necessary for the decision. Measure quality on exception cases before reducing history or retrieved chunks. A smaller model can handle eligible simpler tasks when routing and fallback are evaluated; cheap routing must not silently expand its scope.",
        "The fixture shows two cache keys differing by tenant and policy version. It illustrates why question text alone is insufficient for private policy reuse. It does not implement a cache, semantic similarity threshold, current access check or complete dependency invalidation."
      ]
    ],
    "problem": "Cache safely and trim context without losing requirements using a declared synthetic fixture.",
    "code": "def key(tenant, policy_version, question):\n    return (tenant, policy_version, question.strip().lower())\na = key(\"north\", \"v2\", \"Leave rules?\")\nb = key(\"south\", \"v2\", \"Leave rules?\")\nc = key(\"north\", \"v3\", \"Leave rules?\")\nprint(a == b)\nprint(a == c)",
    "expect": "False\nFalse",
    "limit": "A tuple key does not enforce current access, expire stale data or prove that normalization preserves question meaning.",
    "steps": [
      "Identify the fixture inputs and the invariant stated in the lesson.",
      "Apply the explicit calculation or validation rule in application code.",
      "Compare the printed result with the expected output and identify the untested production assumptions."
    ],
    "mistakes": [
      "A tuple key does not enforce current access, expire stale data or prove that normalization preserves question meaning.",
      "Assuming this isolated fixture replaces representative integration tests and human review."
    ],
    "takeaways": [
      "A response cache stores an application result; provider prompt caching reuses supported input computation under a service contract.",
      "Context trimming should preserve task instructions, required constraints and the evidence necessary for the decision."
    ],
    "cards": [
      [
        "Are response caching and prompt caching identical?",
        "Which cache stores an application answer for reuse?",
        "Answer cache",
        "Tokenizer vocabulary",
        "Input-computation cache",
        "Model parameter memory",
        "A response cache reuses results rather than merely supported input processing."
      ],
      [
        "What can semantic cache similarity miss?",
        "Which difference can make similar questions require different answers?",
        "Policy effective date",
        "Matching topic terms",
        "Similar text length",
        "Shared punctuation",
        "Meaningful constraints can differ even when overall wording is similar."
      ],
      [
        "What should survive context trimming?",
        "Which material must not be removed solely to reduce tokens?",
        "Task constraints",
        "Duplicate navigation",
        "Redundant boilerplate",
        "Irrelevant greetings",
        "Optimization must preserve information needed for correct task behavior."
      ],
      [
        "What invalidates policy answer reuse?",
        "A cached answer used v2 but v3 changes the rule. Which action fits?",
        "Invalidate stale entries",
        "Reuse matching wording",
        "Only shorten output",
        "Only rename entries",
        "Evidence changes can invalidate answers derived from earlier versions."
      ],
      [
        "What scope belongs in private cache identity?",
        "Two tenants ask the same question. Which key component helps prevent disclosure?",
        "Access scope",
        "Only normalized text",
        "Only output length",
        "Only language code",
        "Private cached data remain tied to the permissions under which they were produced."
      ],
      [
        "What should smaller-model routing verify?",
        "A cheaper model is proposed for routine categories. What is needed?",
        "Task quality tests",
        "Only lower price",
        "Only fewer parameters",
        "Only familiar vendor",
        "A smaller model is suitable only where it meets required behavior and operational constraints."
      ],
      [
        "Why test exceptions after trimming?",
        "Removing old history saves tokens but drops a cancellation exception. Which result matters?",
        "Quality regression",
        "Only compression ratio",
        "Only lower latency",
        "Only higher hit rate",
        "Savings cannot substitute for preserving decision-critical meaning."
      ],
      [
        "What if cached permission has expired?",
        "An answer was valid before an employee’s access was revoked. What must reuse consider?",
        "Current permissions",
        "Only matching text",
        "Only original score",
        "Only timer validity",
        "Cache freshness and permission freshness can be separate dependencies."
      ],
      [
        "What must be measured for a semantic cache?",
        "A similarity threshold produces more hits. Which paired risk should be evaluated?",
        "Wrong-answer hit rate",
        "Only storage size",
        "Only hit latency",
        "Only cache key length",
        "More cache hits can include semantically wrong matches that harm task quality."
      ],
      [
        "What does the tuple-key fixture establish?",
        "A semantic cache improves hit rate after prompt trimming, but it confuses two policy dates. Which optimization decision is justified?",
        "Constrain reuse and retest exception quality",
        "Increase similarity tolerance to recover savings",
        "Ignore dates because semantic similarity is high",
        "Count cached answers as correct without review",
        "Cache matches must preserve task-critical meaning, and trimming must be checked on the exceptions it can remove."
      ]
    ]
  },
  {
    "slug": "streaming",
    "comp": "m2.c2",
    "title": "Stream progress with honest completion semantics",
    "intro": "A writing assistant displays early text quickly, yet the final answer takes the same time. Streaming improves feedback but requires careful handling of partial output.",
    "headings": [
      "Define the decision and its boundary",
      "Apply and verify the engineering policy"
    ],
    "sections": [
      [
        "Time to first useful content and total completion latency measure different experiences. Streaming can expose generated content incrementally, reducing perceived waiting without necessarily reducing total model computation or charge. Empty events, metadata and role updates should not be mistaken for user-visible text.",
        "Consume the event contract for the actual endpoint and SDK version. Historical Chat Completions examples use delta fields, but other endpoints have different event shapes. Buffer partial structured values until they can be validated; an incomplete JSON fragment is not a completed business object."
      ],
      [
        "Track explicit success, interruption and failure states. If the connection ends unexpectedly, mark the answer incomplete and do not silently treat it as final. Cancellation should propagate where supported, but a disconnected client does not prove provider computation or billing stopped. Apply required release checks before sensitive text reaches the user.",
        "The fixture assembles synthetic content events while ignoring a metadata event and identifies the final completion marker. It models event handling only. It does not open a network stream, measure first-token latency or reproduce any current provider protocol."
      ]
    ],
    "problem": "Stream progress with honest completion semantics using a declared synthetic fixture.",
    "code": "events = [(\"meta\", \"assistant\"), (\"text\", \"Policy \"), (\"text\", \"summary\"), (\"done\", \"\")]\ntext = \"\"\ncomplete = False\nfor kind, value in events:\n    if kind == \"text\":\n        text += value\n    elif kind == \"done\":\n        complete = True\nprint(text)\nprint(complete)",
    "expect": "Policy summary\nTrue",
    "limit": "Synthetic event assembly does not test live provider protocols, buffering races, cancellation or moderation effectiveness.",
    "steps": [
      "Identify the fixture inputs and the invariant stated in the lesson.",
      "Apply the explicit calculation or validation rule in application code.",
      "Compare the printed result with the expected output and identify the untested production assumptions."
    ],
    "mistakes": [
      "Synthetic event assembly does not test live provider protocols, buffering races, cancellation or moderation effectiveness.",
      "Assuming this isolated fixture replaces representative integration tests and human review."
    ],
    "takeaways": [
      "Time to first useful content and total completion latency measure different experiences.",
      "Track explicit success, interruption and failure states."
    ],
    "cards": [
      [
        "Which latency does streaming often improve for users?",
        "What measures the wait before meaningful output appears?",
        "First useful content",
        "Total request cost",
        "Model training time",
        "Corpus indexing time",
        "Early useful content can reduce perceived waiting independently of total completion time."
      ],
      [
        "Is a partial JSON fragment a completed object?",
        "Which condition is needed before consuming a streamed structured result?",
        "Valid final object",
        "An opening brace",
        "Any visible token",
        "A role metadata event",
        "Incomplete representations cannot safely stand in for a validated final business object."
      ],
      [
        "Are all stream events displayable text?",
        "Which event type should not automatically enter visible answer text?",
        "Metadata-only event",
        "Checked content segment",
        "Supported text delta",
        "Validated final sentence",
        "Streaming protocols can include control and metadata events as well as content."
      ],
      [
        "What if a stream disconnects before completion?",
        "A user receives half an explanation and no terminal success marker. What should the app show?",
        "Incomplete result",
        "Complete success",
        "Confirmed transaction",
        "Approved final ruling",
        "An interrupted stream must not be mislabeled as a finished response."
      ],
      [
        "Does streaming guarantee lower spend?",
        "A team streams long answers and expects token charges to disappear. What is correct?",
        "No implied discount",
        "All stream tokens free",
        "Only first tokens billed",
        "No usage tracking needed",
        "Transport presentation does not remove the underlying work or applicable charges."
      ],
      [
        "What must happen before sensitive content release?",
        "A privacy check runs asynchronously while text is generated. Which policy preserves the gate?",
        "Await mandatory checks",
        "Display all immediately",
        "Treat pending as passed",
        "Hide only final token",
        "Content already delivered may be disclosed before a later rejection arrives."
      ],
      [
        "What should an adapter use after endpoint migration?",
        "A legacy parser reads delta fields but the new endpoint uses another event schema. What should change?",
        "Endpoint event parser",
        "Only client formatting",
        "Only prompt length",
        "Only retry frequency",
        "Stream event handling must follow the actual current interface contract."
      ],
      [
        "Does client cancellation prove remote work stopped?",
        "A browser closes during generation. What should accounting assume?",
        "Possible remote usage",
        "All work becomes free",
        "Request never arrived",
        "Prior tokens unbilled",
        "Transport disconnection does not establish provider cancellation or billing behavior."
      ],
      [
        "How should first-token metrics treat empty events?",
        "A role event arrives quickly, followed by content much later. Which timing better reflects user feedback?",
        "First useful content",
        "First empty event",
        "Request serialization",
        "Only response byte count",
        "An event with no useful content does not yet provide the user’s answer."
      ],
      [
        "What does the synthetic assembler prove?",
        "A stream releases a valid-looking amount, then disconnects before final validation while the client cancels. Which state and accounting fit?",
        "Incomplete; usage unconfirmed",
        "Completed action with zero cost by definition",
        "Approved amount because early tokens parsed",
        "Successful task because the client saw text",
        "Partial text does not establish a validated final result, and cancellation does not prove remote work or charges stopped."
      ]
    ]
  },
  {
    "slug": "latency-observability",
    "comp": "m3.c1",
    "title": "Measure latency distributions and request paths",
    "intro": "A service’s average response time looks healthy while a small group of long requests waits much longer. Monitoring must show the tail and the stages that cause it.",
    "headings": [
      "Define the decision and its boundary",
      "Apply and verify the engineering policy"
    ],
    "sections": [
      [
        "Latency is a distribution. Median, high percentiles and deadline-exceedance rates expose different aspects of experience. Define the measurement boundary: client-perceived latency can include transport, queueing and rendering, while an inference timer may measure only provider work. State the percentile method and sample window.",
        "Break a request into relevant stages such as retrieval, queue wait, generation, validation and fallback. Correlation ids can connect these timings without recording full private prompts. Tail stage times do not necessarily add to the overall tail because the slowest observations can occur on different requests."
      ],
      [
        "Compare segments such as route, language, input size and cache outcome. Mean improvements can hide a slower or failing segment. Use sufficiently sized windows and annotate deployments or incidents. Histograms and threshold counts can often reveal patterns missed by a single average.",
        "The fixture computes a nearest-rank p95 for a small invented latency list and counts values above a deadline. This fixes one percentile convention explicitly. It does not estimate production SLOs or compare network and provider timing using real traces."
      ]
    ],
    "problem": "Measure latency distributions and request paths using a declared synthetic fixture.",
    "code": "import math\nlatencies = [100, 110, 120, 130, 900]\nordered = sorted(latencies)\np95 = ordered[math.ceil(0.95 * len(ordered)) - 1]\nprint(p95)\nprint(sum(x > 500 for x in latencies))",
    "expect": "900\n1",
    "limit": "A five-value synthetic percentile is not a production latency estimate or a universal percentile implementation.",
    "steps": [
      "Identify the fixture inputs and the invariant stated in the lesson.",
      "Apply the explicit calculation or validation rule in application code.",
      "Compare the printed result with the expected output and identify the untested production assumptions."
    ],
    "mistakes": [
      "A five-value synthetic percentile is not a production latency estimate or a universal percentile implementation.",
      "Assuming this isolated fixture replaces representative integration tests and human review."
    ],
    "takeaways": [
      "Latency is a distribution.",
      "Compare segments such as route, language, input size and cache outcome."
    ],
    "cards": [
      [
        "Why monitor high latency percentiles?",
        "Which statistic can expose slow requests hidden by a mean?",
        "Tail percentile",
        "Parameter count",
        "Prompt character count",
        "Cache key length",
        "High percentiles describe slower parts of the observed request distribution."
      ],
      [
        "What must a latency metric define?",
        "Which detail determines what the timer actually includes?",
        "Timer boundaries",
        "Only dashboard scale",
        "Only feature identity",
        "Only account tier",
        "Client, service and provider timers can include different stages."
      ],
      [
        "Can stage p95 values always be summed for overall p95?",
        "Which claim is generally unsafe?",
        "Summed stage p95s",
        "Measured stage timings",
        "Trace-linked requests",
        "Measured overall latency",
        "Different requests can dominate each stage’s tail, so percentile addition is not generally valid."
      ],
      [
        "What should segment monitoring reveal?",
        "A new route improves the mean but slows long multilingual queries. What should reporting show?",
        "Segment regressions",
        "Only overall gain",
        "Only short successes",
        "Only fastest response",
        "Aggregate improvements can conceal material subgroup degradation."
      ],
      [
        "How can traces reduce private-data exposure?",
        "A team needs to connect retrieval and generation timings. What is suitable?",
        "Linked stage timings",
        "Complete user transcripts",
        "Provider credentials",
        "Raw private sources",
        "Request linkage and structured timing can support diagnosis without copying sensitive content."
      ],
      [
        "Why state the percentile method?",
        "Two dashboards disagree on p95 for a tiny sample. What should be checked?",
        "Quantile/sample method",
        "Only model identity",
        "Only chart dimensions",
        "Only cache capacity",
        "Small-sample percentile implementations can use different interpolation or rank conventions."
      ],
      [
        "What captures deadline violations directly?",
        "A p95 remains below target but some users time out. Which metric adds evidence?",
        "Timeout count",
        "Only output length",
        "Only request id size",
        "Only model bytes",
        "Counting threshold failures exposes actual missed deadlines in the observed window."
      ],
      [
        "What can explain high provider time with low total improvement?",
        "Retrieval becomes faster while generation dominates the request. What should optimization inspect?",
        "Stage costs",
        "Only retrieval hit rate",
        "Only header size",
        "Only source name length",
        "The dominant stage constrains the benefit of speeding up a minor stage."
      ],
      [
        "Why annotate deployments on latency charts?",
        "A sudden shift begins after a model rollout. Which context aids diagnosis?",
        "Rollout timestamps",
        "Only vendor identity",
        "Only report title",
        "Only weekday labels",
        "Operational changes help relate performance shifts to candidate causes."
      ],
      [
        "What does the nearest-rank example establish?",
        "Search p95 falls while generation p95 rises; their slowest samples come from different requests. What should determine end-to-end latency impact?",
        "Request traces and total latency",
        "Sum both stage p95 changes directly",
        "Use only whichever p95 improved most",
        "Average model sizes across routes",
        "Separate stage percentiles do not identify the end-to-end percentile; linked path measurements are needed."
      ]
    ]
  },
  {
    "slug": "quality-and-errors",
    "comp": "m3.c1",
    "title": "Monitor quality and failures alongside availability",
    "intro": "A model endpoint returns successful HTTP responses, yet the assistant begins citing obsolete rules. Uptime alone does not show whether the feature works.",
    "headings": [
      "Define the decision and its boundary",
      "Apply and verify the engineering policy"
    ],
    "sections": [
      [
        "Separate transport availability from task success. A successful HTTP response can contain an invalid structure, unsupported claim, wrong refusal or unauthorized proposal. Define outcome categories that distinguish provider errors, parsing failures, semantic failures, retrieval gaps and permission denials.",
        "Use reviewed sampling and authorized evaluation cases for ongoing quality measurement. User feedback can reveal issues but is selected and noisy; it is not automatically ground truth. Segment by model/prompt version and task category, and retain privacy-safe incident evidence for reproducibility."
      ],
      [
        "Operational alerts need actionable conditions, owners and playbooks. Error rate denominators should specify requests or attempts; retries can make these differ. Guard against alert fatigue by choosing windows and severity that reflect impact, while giving critical privacy failures immediate explicit handling.",
        "The fixture categorizes supplied request outcomes and shows why HTTP success differs from validated task success. No real responses are scored. A deployed classifier of answer quality would itself require labeled validation and appropriate handling of ambiguous cases."
      ]
    ],
    "problem": "Monitor quality and failures alongside availability using a declared synthetic fixture.",
    "code": "outcomes = [{\"http\": True, \"valid\": True}, {\"http\": True, \"valid\": False}, {\"http\": False, \"valid\": False}]\nprint(sum(x[\"http\"] for x in outcomes))\nprint(sum(x[\"http\"] and x[\"valid\"] for x in outcomes))\nprint(len(outcomes))",
    "expect": "2\n1\n3",
    "limit": "Invented status labels do not measure actual answer quality or validate an automated scoring system.",
    "steps": [
      "Identify the fixture inputs and the invariant stated in the lesson.",
      "Apply the explicit calculation or validation rule in application code.",
      "Compare the printed result with the expected output and identify the untested production assumptions."
    ],
    "mistakes": [
      "Invented status labels do not measure actual answer quality or validate an automated scoring system.",
      "Assuming this isolated fixture replaces representative integration tests and human review."
    ],
    "takeaways": [
      "Separate transport availability from task success.",
      "Operational alerts need actionable conditions, owners and playbooks."
    ],
    "cards": [
      [
        "Does HTTP success prove task success?",
        "Which result can still fail after a successful response code?",
        "Semantic task success",
        "Response-code receipt",
        "Transport completion",
        "Payload availability",
        "Valid transport does not prove meaningful or authorized application behavior."
      ],
      [
        "Is user feedback automatic ground truth?",
        "Which limitation applies to voluntary thumbs-up ratings?",
        "Feedback selection bias",
        "Guaranteed expert labels",
        "Complete traffic coverage",
        "Perfect evidence checking",
        "Feedback is useful but may be biased, sparse or mistaken."
      ],
      [
        "Why distinguish requests from attempts?",
        "What can make an attempt error rate differ from a request failure rate?",
        "Retry attempts",
        "A model alias",
        "One prompt template",
        "One policy title",
        "One user request can cause multiple provider attempts and recover despite intermediate errors."
      ],
      [
        "What should a wrong-policy answer be labeled?",
        "The endpoint is available but cites an expired policy. Which category fits best?",
        "Stale-policy error",
        "Network outage",
        "DNS lookup failure",
        "Rate-limit denial",
        "Availability and policy correctness are different dimensions of the feature."
      ],
      [
        "What should an alert include?",
        "A quality threshold is crossed repeatedly. Which addition makes the alert actionable?",
        "Owner and playbook",
        "Only louder alerting",
        "Only vendor status",
        "Only a screenshot",
        "An alert needs a defined investigation or mitigation path."
      ],
      [
        "Which metadata help detect version regressions?",
        "Quality falls after a prompt update. What should monitoring retain?",
        "Behavior versions",
        "Only user identity",
        "Only answer length",
        "Only chart position",
        "Attribution requires identifying which configuration produced the outcomes."
      ],
      [
        "What must automated quality scoring receive?",
        "A judge labels live answers as supported. What evidence supports trusting its alerts?",
        "Human review",
        "Only judge confidence",
        "Only model size",
        "Only parseable scores",
        "The scoring system can err and needs its own accuracy assessment."
      ],
      [
        "How should a critical privacy failure be handled?",
        "An isolated cross-tenant disclosure appears amid high overall quality. What should monitoring do?",
        "Incident response",
        "Wait for mean decline",
        "Delete isolated evidence",
        "Trust uptime alone",
        "Critical confidentiality failures need explicit handling rather than dilution by aggregate rates."
      ],
      [
        "Why minimize incident evidence?",
        "An answer-quality investigation needs reproducible context. Which record fits?",
        "Scoped case traces",
        "Every user transcript",
        "Unrestricted raw logs",
        "All account secrets",
        "Reproducibility should be achieved without unnecessary private-data collection."
      ],
      [
        "What does the outcome-count fixture show?",
        "HTTP availability remains high after a rollout, but reviewed samples show stale-policy answers in a small language segment. Which monitoring response fits?",
        "Investigate segment failures",
        "Ignore it until transport availability declines",
        "Report only the overall uptime improvement",
        "Replace human labels with model self-confidence",
        "Task correctness and segment behavior need explicit monitoring beyond transport success."
      ]
    ]
  },
  {
    "slug": "budget-controls",
    "comp": "m3.c1",
    "title": "Enforce spend budgets and reconcile unknown usage",
    "intro": "A failed deployment causes a retry storm. An alert after the invoice arrives cannot replace limits on work while the incident is happening.",
    "headings": [
      "Define the decision and its boundary",
      "Apply and verify the engineering policy"
    ],
    "sections": [
      [
        "Spend monitoring observes consumption; budget enforcement limits further work according to policy. Use request-level output and attempt limits, concurrency bounds and tenant or feature budgets as appropriate. A per-request token cap does not by itself constrain total monthly spend when request volume is unbounded.",
        "Concurrent requests require careful reservation accounting. Estimate and reserve budget before dispatch, settle against confirmed usage afterward, and reconcile uncertain outcomes rather than releasing all reservations immediately on timeout. A real implementation needs atomic updates and idempotent settlement to avoid double spending or double charging."
      ],
      [
        "Degradation should be explicit and evaluated: use a tested cheaper path, return approved source-only content, queue eligible work or explain temporary unavailability. Budget exhaustion must not route private data to an ineligible provider or present unvalidated results as successful decisions.",
        "The fixture admits estimated requests while a synthetic balance remains nonnegative. It is a sequential reservation example. It does not model concurrent transactions, provider invoice adjustments, uncertain remote completion or refunds for unused reservations."
      ]
    ],
    "problem": "Enforce spend budgets and reconcile unknown usage using a declared synthetic fixture.",
    "code": "remaining = 10\nestimates = [4, 5, 3]\naccepted = []\nfor cost in estimates:\n    if cost <= remaining:\n        remaining -= cost\n        accepted.append(cost)\nprint(accepted)\nprint(remaining)",
    "expect": "[4, 5]\n1",
    "limit": "Sequential estimates do not implement atomic reservations, accurate billing or reconciliation of unknown outcomes.",
    "steps": [
      "Identify the fixture inputs and the invariant stated in the lesson.",
      "Apply the explicit calculation or validation rule in application code.",
      "Compare the printed result with the expected output and identify the untested production assumptions."
    ],
    "mistakes": [
      "Sequential estimates do not implement atomic reservations, accurate billing or reconciliation of unknown outcomes.",
      "Assuming this isolated fixture replaces representative integration tests and human review."
    ],
    "takeaways": [
      "Spend monitoring observes consumption; budget enforcement limits further work according to policy.",
      "Degradation should be explicit and evaluated: use a tested cheaper path, return approved source-only content, queue eligible work or explain temporary unavailability."
    ],
    "cards": [
      [
        "Is a spend alert a hard budget limit?",
        "Which mechanism actively constrains additional work?",
        "Spend enforcement",
        "Spend chart alone",
        "Monthly notice alone",
        "Invoice export alone",
        "Observing expenditure does not itself prevent more dispatches."
      ],
      [
        "Does one output-token cap bound monthly spend?",
        "Which additional factor must be constrained or budgeted?",
        "Total request volume",
        "Only response syntax",
        "Only token spelling",
        "Only model identity",
        "Many capped requests can still accumulate unbounded total expenditure."
      ],
      [
        "Why reserve budget before dispatch?",
        "Which risk arises if concurrent requests all see the same unreserved balance?",
        "Overspending",
        "Stronger authorization",
        "Guaranteed savings",
        "Automatic settlement",
        "Independent dispatches can collectively exceed an available budget without atomic reservations."
      ],
      [
        "What follows an uncertain timeout?",
        "A remote request times out with no confirmed usage. What should accounting do?",
        "Reconcile unknown usage",
        "Assume no work",
        "Settle at zero",
        "Ignore reservations forever",
        "A timeout does not reveal whether remote work was performed or billed."
      ],
      [
        "What prevents duplicate settlement?",
        "A usage event is delivered twice after a retry. Which accounting property is needed?",
        "Idempotent settlement",
        "Only longer output",
        "Only prompt warnings",
        "Only chart annotations",
        "A repeated event should not apply the same charge or release twice."
      ],
      [
        "What should budget fallback preserve?",
        "A cheaper endpoint violates tenant data policy. What should routing do?",
        "Policy-ineligible backup",
        "Low-balance exemption",
        "Unreviewed data shortening",
        "Incident-time policy waiver",
        "Hard privacy constraints remain binding under cost pressure."
      ],
      [
        "What should a degraded user experience communicate?",
        "The feature returns approved excerpts without a generated interpretation. What should it disclose?",
        "Limited capability mode",
        "Personalized final ruling",
        "Confirmed transaction",
        "Guaranteed full answer",
        "Users need accurate completion semantics when capabilities are reduced."
      ],
      [
        "How should estimate error be handled?",
        "Actual token usage exceeds the reservation estimate. What process is needed?",
        "Settle confirmed usage",
        "Assume exact estimate",
        "Drop excess usage",
        "Only rename feature",
        "Reservation estimates and confirmed charges are distinct and must be reconciled."
      ],
      [
        "What metric reveals a retry storm’s cost?",
        "An incident causes many attempts per user request. Which quantity should be watched?",
        "Retry costs",
        "Only unique users",
        "Only final successes",
        "Only output language",
        "Retries multiply workload and cost beyond the count of original requests."
      ],
      [
        "What does the local budget loop prove?",
        "Two concurrent requests reserve the last budget balance; one times out and later bills twice through duplicate usage events. Which accounting design addresses both risks?",
        "Atomic reserve; dedupe bills; reconcile",
        "Sequential estimates plus immediate timeout refunds",
        "Count only final successes and ignore duplicate events",
        "Release all reservations on client disconnect",
        "Concurrency, duplicate delivery and uncertain outcomes require distinct controls rather than assuming estimates equal confirmed spend."
      ]
    ]
  }
], [reference("streaming","examples/How_to_stream_completions.ipynb","OpenAI Cookbook: streaming limitations"),reference("limits","examples/How_to_handle_rate_limits.ipynb","OpenAI Cookbook: bounded recovery")]);
