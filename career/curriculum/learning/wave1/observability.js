'use strict';
const {build,ref}=require('./ops-wave3-helper');
const data=[
  {
    "comp": "m1.c1",
    "title": "Choose an operational signal for the question",
    "intro": "A checkout team sees more complaints but an apparently healthy CPU chart. Observability starts with a question about behavior and an appropriate signal. Metrics summarize numerical behavior, logs record events and traces connect units of work across an operation.",
    "sections": [
      [
        "Three complementary views",
        "A metric is a numerical measurement indexed by attributes and time. A counter of failed requests can reveal a changing error ratio, but it cannot by itself explain an individual failure payload. A log event can preserve a bounded error category and correlation identifier; excessive raw payload logging creates privacy and storage problems.",
        "A distributed trace describes related spans for a request or workflow. It can connect gateway, application and database work when context propagates correctly. Traces are often sampled, so missing trace evidence is not automatically evidence that a request never occurred."
      ],
      [
        "Choose evidence before instrumentation",
        "Start with the user operation, its expected outcome and the failure being investigated. Use metrics for aggregate trends, logs for event detail and traces for cross-component paths. Correlation is a hypothesis-building tool; a chart moving at the same time as an incident does not alone establish causality.",
        "The example selects a signal type for three explicitly supplied questions. This is a teaching decision table, not a collector, exporter or complete instrumentation SDK. Actual telemetry must be validated for coverage, overhead and sensitive data handling."
      ]
    ],
    "code": "choices={'error trend':'metric','one failure detail':'log','cross-service path':'trace'}\nfor question in ['error trend','one failure detail','cross-service path']:\n    print(choices[question])",
    "expect": "metric\nlog\ntrace",
    "practice": "Which signal summarizes a numerical trend?|Metric|Stack trace text|A single log event|Source comments|Metrics represent numerical measurements over time.\nWhich signal records a specific event?|Log|A metric label budget|A time-series axis|A release title|Logs preserve event-level context under their schema.\nWhich signal connects spans across an operation?|Trace|A CPU gauge alone|An account tag|A deployment label|Traces link units of work through propagated context.\nCheckout failures increase. Which evidence first quantifies the ratio?|Request outcome metrics|Only a screenshot|Only a build filename|Only a worker count|Counts of valid outcomes and total eligible requests support an aggregate error ratio.\nOne failed request needs its safe diagnostic category. Which signal fits?|A correlated log|Only the monthly average|Only CPU utilization|Only the release number|An event log can carry the bounded error category for the specific operation.\nA trace is absent from a sampled system. What can be concluded?|It may not have been sampled|The request never existed|The API was healthy|All spans completed|Sampling can omit real requests from retained trace evidence.",
    "final": "Which question most directly calls for metrics?|How is error rate changing?|What exact exception message occurred?|Which span parent was missing?|Which source line raised once?|Metrics summarize population behavior over time.\nWhat identifies a log’s event context?|Structured fields|Only its file size|The dashboard color|The host wallpaper|Named fields preserve event meaning for search and correlation.\nWhat does a trace represent?|Related spans of work|All requests without exception|Only server uptime|A permanent user password|A trace connects related units of an operation rather than proving full traffic coverage.\nA store wants the path of one slow purchase across three services. Which evidence is suited?|A propagated distributed trace|A monthly CPU mean reveals the exact path of every individual purchase|An uncorrelated total log count reconstructs the exact cross-service request path|A billing tag alone|Related spans can show the request’s cross-service path.\nAn incident correlates CPU spikes with timeouts. What is still needed?|Evidence testing the causal hypothesis|The chart proves high CPU was the original cause without further tests|A simultaneous rise in both charts is already a complete causal explanation|Deletion of contrary observations|Coincidence can guide investigation but does not isolate the cause.\nA dashboard has host metrics but no purchase outcomes. What is missing?|User-operation visibility|Only another host name|Only disk capacity|Only chart refresh animation|Healthy infrastructure measurements do not establish successful business operations.\nA support ticket needs a single request’s category without its private payload. What fits?|Safe correlated event fields|Full payment details|Every authorization token|A public database dump|Bounded fields preserve diagnostic value while minimizing sensitive data.\nA trace sample shows no database span. Which interpretation is careful?|Instrumentation or propagation may be incomplete|The database cannot have been called because no database span was retained|A missing database span proves every database operation completed instantly|The request was never real|Missing spans can reflect collection coverage rather than actual absence of work.\nA team stores every request body as observability. What tradeoff needs review?|Privacy and telemetry volume|A dashboard layout change removes the sensitivity of stored request bodies|Raw request logging has no privacy cost when storage is compressed|Only the font size|Raw bodies can expose sensitive data and create expensive high-volume logs.\nThe fixture maps questions to signal names. What remains untested?|Live telemetry collection|The dictionary lookup|The printed order|The supplied keys|The decision table does not instrument or contact any service.",
    "mistakes": [
      "A host chart does not establish user success.",
      "Correlation is not a root-cause proof."
    ],
    "takeaways": [
      "Match the signal to the operational question.",
      "Combine bounded evidence from different signals."
    ],
    "problem": "Map three synthetic questions to evidence types.",
    "steps": [
      "Read the operational question.",
      "Select the appropriate signal from the table.",
      "Explain what that signal cannot prove."
    ],
    "limit": "The table validates only its decision mapping; no telemetry SDK or remote collector is executed."
  },
  {
    "comp": "m1.c1",
    "title": "Control metric type, dimensions and cardinality",
    "intro": "A metrics bill grows after an engineer labels every request by customer id. Each distinct label combination creates another series, so a useful dimension can become an unbounded storage multiplier. Choose metric types and labels from the operational decision, not from every available request field.",
    "sections": [
      [
        "Counter and gauge contracts",
        "Counters represent cumulative occurrences and normally increase except when the process or instrument resets. Gauges describe an instantaneous level that can rise or fall, such as queue depth. A rate computation must account for resets rather than interpreting a restarted counter as negative work.",
        "Labels distinguish series; the series count grows with combinations of label values that actually occur. User ids, full URLs with query strings and request ids are often unbounded dimensions. Prefer reviewed bounded categories such as route templates and outcome classes when they answer the required aggregate question."
      ],
      [
        "Budget the telemetry surface",
        "Estimate the combinations before introducing a label and account for replicas, environments and histogram series where relevant. A mathematical product is a useful upper-bound planning model when every combination can occur; sparse real data may create fewer series.",
        "The fixture multiplies three bounded label counts and compares that budget with adding a per-user dimension. It does not query a Prometheus server or measure actual storage, scrape overhead or billing."
      ]
    ],
    "code": "import math\nbounded={'route':8,'method':3,'outcome':4}\nbase=math.prod(bounded.values())\nprint(base)\nprint(base*10000)",
    "expect": "96\n960000",
    "practice": "Which type fits current queue depth?|Gauge|Monotonic counter|Trace id|Log retention policy|Queue depth is a level that can rise or fall.\nWhich type fits total completed requests?|Counter|A secret label|A span parent|A hostname field alone|A counter accumulates occurrences subject to reset behavior.\nWhat creates distinct labeled series?|Distinct label combinations|Only the metric description|Only dashboard titles|Only scrape comments|Series identity includes its label set.\nA developer adds user_id to request metrics. What should be reviewed?|Cardinality growth|Only string quoting|Only log ordering|Only chart height|Potentially unbounded user values can multiply active series.\nA counter restarts from zero. How should its rate be interpreted?|Using reset-aware semantics|As negative requests|As guaranteed missing data|As a gauge forever|Counter rate calculations must account for resets.\nAn API has many concrete order URLs. Which label is usually more bounded?|Route template|Full order URL|Every query token|The complete request id|A template groups many individual URLs into a stable route category.",
    "final": "What distinguishes a gauge from a counter?|A gauge may increase or decrease|A gauge must increase forever and reset only when its process restarts|A counter should be decremented whenever queue depth falls|A gauge authorizes access|Gauges measure current levels while counters accumulate events.\nWhat does the product of label-domain sizes estimate?|Possible combinations|Guaranteed storage bytes|Guaranteed scrape seconds|The number of users authenticated|The product bounds combinations if all combinations may occur.\nWhich dimension is commonly unbounded?|Request identifier|HTTP method category|Reviewed outcome class|Deployment environment set|A unique request value can create one series per operation.\nA service adds a 10000-user dimension to 96 combinations. What does the model predict?|960000 possible combinations|The added dimension leaves the original 96 combinations unchanged|The extra user dimension changes only the display title and creates no series|No increase|The added dimension multiplies the combination budget under the full-product assumption.\nA dashboard groups raw URLs including search terms. What should change?|Normalize to approved route templates|Label every concrete URL with its full query and session token|Use customer email addresses because their text is easier to read than route templates|Use customer emails instead|Stable templates bound metric dimensions and reduce sensitive data exposure.\nA team uses a counter for queue size and decrements it. What is the semantic issue?|A gauge fits the changing level|Counters must contain strings|Queue size can never decrease|Gauges forbid negatives universally|A quantity that rises and falls is a gauge-style measurement.\nA planning product predicts more series than actually observed. Why can that occur?|Not every combination exists|Products cannot multiply integers|Labels never affect identity|Prometheus removes all dimensions|The cross-product is an upper-bound model when actual combinations are sparse.\nA new label is useful for one incident but unbounded forever. What should review require?|A bounded evidence strategy|Permanent per-request metrics|No retention controls|A random metric name|Use a telemetry design that answers the question without indefinite unbounded dimensions.\nA reset-aware rate becomes available. Does that prove the underlying counter was instrumented correctly?|No|Yes for every endpoint|Only if the chart is green|Only for long metric names|Query handling cannot validate missing or incorrectly incremented instrumentation.\nThe local calculation outputs a combination budget. What remains unknown?|Actual active series and cost|The arithmetic directly measures active series and actual storage charges|The calculation gives an exact dollar bill without observing the real metrics store|The printed result|The fixture does not collect measurements or inspect a live metrics store.",
    "mistakes": [
      "Do not use a unique request id as a routine metric label.",
      "A counter reset is not negative work."
    ],
    "takeaways": [
      "Choose measurement semantics before charting.",
      "Budget label combinations and sensitive dimensions."
    ],
    "problem": "Calculate a synthetic label-combination budget.",
    "steps": [
      "List bounded label-domain sizes.",
      "Multiply them under the full-combination assumption.",
      "Compare the effect of an unbounded-style dimension."
    ],
    "limit": "The product is a planning model, not a measured Prometheus series count or bill."
  },
  {
    "comp": "m1.c1",
    "title": "Connect spans with context and sampling limits",
    "intro": "A support trace ends at the gateway although the application called another service. Trace identifiers connect observations only when instrumentation propagates context across the relevant boundary. An exporter receiving some spans does not establish complete coverage of the operation.",
    "sections": [
      [
        "Span relationships",
        "A span describes one unit of work with a start, end and context. A trace id groups related spans while a span id identifies a specific span; parent relationships describe a causal structure subject to the instrumentation model. Parallel child durations must not simply be added to calculate elapsed request time.",
        "Context propagation carries the trace relationship across process and transport boundaries under a defined format. Instrumentation should extract incoming context from trusted protocol handling and inject it on outgoing calls. A remote caller’s trace context is correlation input, not authentication authority."
      ],
      [
        "Sample with a question in mind",
        "Head sampling decides near the start of a trace; tail sampling can decide after observing more of the trace but requires buffering and a complete enough view. Neither guarantees that every rare failure is retained under every configuration. Record the policy before interpreting absence or estimating populations.",
        "The example builds a tiny parent map from supplied span records and finds direct gateway children. It validates relationship logic only, not OpenTelemetry SDK behavior, actual propagation or sampler implementation."
      ]
    ],
    "code": "spans=[{'id':'g','parent':None},{'id':'a','parent':'g'},{'id':'d','parent':'a'},{'id':'b','parent':'g'}]\nchildren=[span['id'] for span in spans if span['parent']=='g']\nprint(children)\nprint(len({span['id'] for span in spans}))",
    "expect": "['a', 'b']\n4",
    "practice": "What groups related spans?|Trace id|Password|Billing tag alone|Dashboard title|A shared trace identity connects spans within the traced operation.\nWhat identifies one unit of traced work?|Span|A rate query|A scrape interval|A retention bucket|A span records a bounded unit of operation work.\nIs incoming trace context authentication?|No|Always|Only for long ids|Only over JSON|Trace correlation does not grant a caller business permissions.\nA downstream call has a new unrelated trace id. What should be inspected?|Context extraction and injection|Only the dashboard time range determines propagation continuity|Only CPU count|Only metric names|Broken propagation can split one operation into separate traces.\nTwo child calls run in parallel for 100 ms each. Must their parent take 200 ms?|No|Yes always|Only with four spans|Only in Python|Elapsed critical-path time differs from the sum of overlapping child durations.\nA rare error has no retained trace. What must analysis consider?|Sampling and collection coverage|A missing retained trace proves the request did not occur at all|Proof the client lied|Proof every exporter failed|Missing retained evidence can result from sampling or incomplete telemetry.",
    "final": "Which field identifies a particular span?|Span id|Only trace id|The SLO target|A metric bucket|Span identity distinguishes units of work within a trace.\nWhen is head sampling decided conceptually?|Near trace start|Only after every span is stored|After the monthly bill|Only at human review|Head sampling uses information available near the trace’s beginning.\nWhat additional operational need can tail sampling introduce?|Buffering and trace assembly|No memory usage|Automatic authentication|Guaranteed complete traces|Tail decisions require observing and retaining sufficient trace data before selecting it.\nA gateway trace lacks application children after a new proxy is introduced. What is a useful hypothesis?|Propagation was interrupted at a boundary|The application cannot have executed if the gateway has no child spans|The application had no children because every downstream request took zero time|The proxy authenticated every user|A changed boundary can affect context forwarding or instrumentation.\nA caller supplies a trace header claiming an internal id. What should authorization use?|Its separate identity policy|The supplied trace id alone|The span name|The trace sampling bit|Correlation headers are not proof of business authority.\nA dashboard sums every span duration as request latency. What can distort the result?|Overlapping parallel work|Only the trace name length|Only id capitalization|Only log ordering|Parallel and nested spans can overlap, so sums can exceed elapsed request time.\nA sampler retains errors preferentially. Can retained trace error proportion directly estimate all-traffic error rate?|No|Yes without correction|Only when ids are hex|Only if the chart is public|Selection bias affects population estimates from sampled traces.\nA telemetry pipeline receives spans but the client boundary is uninstrumented. What should the coverage report say?|That boundary remains unobserved|The entire user journey is proven|All missing spans are zero-duration|Instrumentation is complete by definition|Observed spans do not establish visibility of uninstrumented work.\nThe example finds a and b as gateway children. What does it validate?|Supplied parent relationships|Real network propagation|An actual OTel exporter|Tail-sampler memory limits|The local records test relationship selection only.\nA trace contains sensitive baggage propagated to another vendor. Which review is needed?|Allowed propagated attributes and destinations|Only the trace name needs review when baggage crosses a vendor boundary|All baggage fields are safe to forward if they have a trace identifier|Only JSON indentation|Context propagation can carry data across trust boundaries and requires minimization.",
    "mistakes": [
      "Trace context is not authorization.",
      "Do not sum overlapping spans as elapsed latency."
    ],
    "takeaways": [
      "Verify every propagation boundary.",
      "Interpret retained traces with sampling and coverage limits."
    ],
    "problem": "Find direct children in a synthetic span tree.",
    "steps": [
      "Read span ids and parent ids.",
      "Select records parented by the gateway.",
      "State that supplied relationships are not live propagation evidence."
    ],
    "limit": "No OpenTelemetry SDK, exporter, network or sampling implementation is executed."
  },
  {
    "comp": "m2.c1",
    "title": "Define user-centered SLIs and measurable SLOs",
    "intro": "A course platform reports server uptime while students cannot submit assignments. A service-level indicator must represent the experience being promised. An objective needs a target, a population, a measurement boundary and a time window before its percentage has operational meaning.",
    "sections": [
      [
        "From promise to measurement",
        "An SLI is a quantified service behavior, such as the proportion of eligible assignment submissions completed successfully within a latency threshold. Define good and total events explicitly, including how retries, client errors and missing telemetry are treated. Otherwise teams can improve the ratio by silently excluding inconvenient failures.",
        "An SLO is the target for an SLI over a stated window; it is distinct from a contractual SLA. A 99.9% request-success objective allows a fraction of bad eligible requests, not automatically a fixed number of downtime minutes. Event-based and time-based objectives have different denominators."
      ],
      [
        "Calculate before alerting",
        "For an event-based objective, the allowed bad events equal total eligible events multiplied by one minus the target. Compare observed bad events with that budget under the same population and window. Very low traffic and missing data require an explicit interpretation rather than an automatic green state.",
        "The fixture calculates an event budget using decimal arithmetic and a synthetic eligible count. It verifies the arithmetic only; it does not establish that a real service measured every eligible request correctly."
      ]
    ],
    "code": "from decimal import Decimal\ntotal=100000\ntarget=Decimal('0.999')\nallowed=Decimal(total)*(1-target)\nbad=Decimal(70)\nprint(int(allowed))\nprint(int(allowed-bad))",
    "expect": "100\n30",
    "practice": "What is an SLI?|A measured service behavior|A signed contractual promise with penalties for every failure|A server name|A paging schedule|An indicator quantifies a defined aspect of the service.\nWhat is required for an SLO?|Target and measurement window|The dashboard color and current CPU value are sufficient|Only a CPU maximum|Only a ticket count|An objective needs a measurable indicator and a stated target over time.\nDoes a request-based budget directly equal downtime minutes?|No|Always|Only in JSON|Only at 99 percent|Event and time denominators describe different measurements.\nStudents cannot submit while host uptime is high. What should the SLI include?|Submission outcomes|Only process existence|Only the number of servers|Only disk size|The indicator should reflect the user operation promised by the service.\nA team excludes all failed events from total requests. What happens?|The ratio becomes misleading|The objective becomes stricter|Failure counts automatically double|The window becomes longer|A biased denominator can hide the behavior the SLI should measure.\nTraffic disappears because collection failed. What should the objective report consider?|Missing evidence explicitly|Automatic perfect service|Guaranteed zero users|A healthy database by inference|Missing telemetry cannot simply be treated as successful eligible events.",
    "final": "Which statement is an SLO rather than only a metric?|99.9 percent success over 30 days|A counter named requests_total|Current queue depth|One error log|A target and window turn an indicator into an objective.\nWhat is an error budget for an event SLO?|Allowed bad eligible events|The maximum log size determines the service objective error budget|The budget is the contractual refund paid to users after each failed request|A legal refund rate|The budget derives from the objective’s allowed failure fraction and population.\nWhat distinguishes an SLA?|A contractual agreement context|Every internal target automatically includes contractual financial remedies|A contractual SLA is simply the current value of any numerical indicator|A span id|SLA terms and remedies belong to a contractual relationship rather than merely an internal target.\nA service has 100000 eligible requests with a 99.9 percent target. How many bad events are allowed?|100|1000|10|99900|One tenth of one percent of the eligible population is 100 events.\nObserved failures are 70 against an allowance of 100. What remains in the modeled budget?|30 events|70 events|170 events|Zero by definition|Remaining event budget is allowed failures minus observed failures within the same scope.\nA team compares a weekly failure count against a monthly denominator. What is wrong?|The scopes do not match|Only the chart title is short|Only the units are bytes|All weekly counts are invalid|Numerator and denominator must describe compatible populations and windows.\nA success metric excludes timed-out submissions even though users see failure. What should review examine?|Eligibility and outcome definitions|Exclude all failed submissions because they did not produce success records|Only successful submissions belong in the denominator of a success objective|Only log ordering|The indicator can misrepresent the experience when failed user operations are excluded improperly.\nA request objective meets its target while a small customer segment fails continuously. What is a useful next check?|Segment-level impact within bounded dimensions|A claim aggregate success proves fairness|Delete segment evidence|Rename the objective|Aggregate objectives can conceal localized impact and need appropriate diagnostic breakdowns.\nA zero-traffic interval is shown as 100 percent success. What must be specified?|The no-data policy|Only a new color|Only the metric name|Only the alert owner|No observations and successful observations are different evidence states.\nThe arithmetic fixture has exact output. What remains unverified?|Real event collection coverage|The correct arithmetic proves every eligible production request was collected|Using Decimal automatically proves the production eligibility policy is correct|The printed integers|Arithmetic correctness cannot prove the production measurement captured the correct population.",
    "mistakes": [
      "Do not exclude failures to improve an SLI.",
      "An event budget is not automatically downtime."
    ],
    "takeaways": [
      "Define population and window before percentages.",
      "Treat missing data as a separate evidence state."
    ],
    "problem": "Compute a synthetic event-based error budget.",
    "steps": [
      "Define target and eligible population.",
      "Compute allowed bad events.",
      "Subtract observed failures within the same scope."
    ],
    "limit": "The fixture validates arithmetic only, not measurement completeness or an SLA."
  },
  {
    "comp": "m2.c1",
    "title": "Alert on burn rate with bounded response",
    "intro": "A paging rule fires for every temporary CPU peak while checkout errors receive no page. An alert should identify a condition requiring a timely action and explain which user objective is threatened. Burn rate compares the observed bad-event fraction with the fraction the SLO allows.",
    "sections": [
      [
        "Burn-rate meaning",
        "For a 99.9% success target, the allowed bad fraction is 0.001. An observed bad fraction of 0.01 consumes budget at ten times the sustainable rate under the same event definition. Burn rate is a dimensionless ratio; interpreting exhaustion time also depends on the objective window and traffic assumptions.",
        "Use windows suited to the response: a short window can detect urgent impact while a longer one can confirm persistence. Multiwindow policies reduce transient noise, but thresholds and traffic floors must be designed from the service objective and alerting contract rather than copied blindly."
      ],
      [
        "Page with an action",
        "A page should include the affected service or operation, measured condition, time window, safe links and a response owner. A ticket can suit slower nonurgent work. A runbook should begin with evidence checks and bounded mitigations rather than an unreviewed command that changes infrastructure.",
        "The fixture evaluates two synthetic burn values against a declared conjunction rule. It verifies boolean policy evaluation only, not PromQL, an Alertmanager configuration, notification delivery or a production response."
      ]
    ],
    "code": "def page(short_burn,long_burn,traffic):\n    return traffic >= 100 and short_burn > 10 and long_burn > 10\nprint(page(12,11,1000))\nprint(page(12,2,1000))\nprint(page(12,11,5))",
    "expect": "True\nFalse\nFalse",
    "practice": "What is burn rate?|Observed bad fraction divided by allowed bad fraction|The total number of failures without considering allowed fraction|CPU divided by memory|Cloud spend divided by users|The ratio compares measured failures with the sustainable failure fraction.\nWhich alert generally deserves a page?|Urgent actionable user impact|Every harmless CPU fluctuation|Every unchanged deployment|Every successful request|Paging should require timely action for meaningful service impact.\nWhat can a longer confirmation window reduce?|Transient alert noise|Every possible false negative|All telemetry cost|The need for ownership|Persistence checks can reduce reactions to brief spikes.\nShort-window burn is high but long-window burn is low. Under the fixture what happens?|No page|Automatic deletion|An unconditional page|A service restart|The declared rule requires both burn windows above threshold.\nAn alert has no responder or runbook. What is missing?|An actionable response contract|The dashboard includes enough charts even without an assigned responder|Only another chart|Only additional colors|Alerts need ownership and instructions that support a timely useful response.\nTraffic is too low to interpret a ratio reliably. What policy helps?|An explicit low-traffic rule|Always label it perfect|Ignore denominator size|Remove all response windows|Sparse samples need a designed interpretation instead of an accidental ratio.",
    "final": "What units does burn rate have?|It is dimensionless|Milliseconds|Dollars per request|Bytes per second|It is a ratio of two bad-event fractions.\nWhy use multiple alert windows?|Balance urgency and persistence|Multiple windows remove the need to assign an alert responder|Multiple windows guarantee that no false positives or false negatives can occur|Make every metric critical|Different windows observe short-lived spikes and sustained budget consumption.\nWhich task can fit a ticket instead of a page?|Nonurgent capacity investigation|A current severe purchase outage|An urgent data-loss event|An active critical incident|Response channel should reflect urgency and actionability.\nAn SLO allows 0.1 percent failures and observes 1 percent. What is modeled burn rate?|10|1|0.1|1000|One percent divided by one tenth of one percent is ten.\nA page fires on CPU while requests meet objectives. What should review examine?|Whether the signal predicts actionable user risk|Every CPU spike should page even when no user operation is at risk|A larger chart axis is sufficient to justify urgent paging on every CPU spike|Only the notification sound|A saturation signal may be useful but its urgency needs a service-impact rationale.\nBoth burn windows exceed ten with sufficient traffic. What does the fixture decide?|Page|Always suppress|Only change labels|Automatically scale production|The declared conjunction policy returns true without taking operational action.\nOnly the short window is high. Why might a multiwindow rule wait?|The persistence condition is not met|The longer-window condition should be ignored whenever the short window rises|A high short window proves the service is healthy over the longer window|The service must be healthy|The longer-window requirement limits responses to the specified sustained condition.\nA team copies an internet threshold without considering its SLO. What is missing?|Service-specific budget and response reasoning|The threshold can be copied unchanged because all services share one budget|A longer metric name makes a copied threshold appropriate for every SLO|Only a new team name|Thresholds must match objectives, measurement windows and actionable response needs.\nA page includes raw credentials in a debugging URL. What should change?|Use safe links and scoped access|Keep it for convenience|Disable notification encryption|Delete all evidence|Operational context must avoid disclosing authority-bearing secrets.\nThe boolean fixture passes. What remains untested?|Alert delivery and query semantics|The local function verifies actual query execution and notification delivery|The simulated traffic floor confirms a live Alertmanager received the page|The supplied inputs|The model does not run a query engine or notification service.",
    "mistakes": [
      "CPU peaks are not automatically urgent user impact.",
      "Thresholds need a service-specific rationale."
    ],
    "takeaways": [
      "Connect paging to budget risk and action.",
      "Validate low-traffic and no-data conditions."
    ],
    "problem": "Evaluate a declared two-window alert policy.",
    "steps": [
      "Check a synthetic traffic floor.",
      "Require both burn windows over threshold.",
      "Return a page decision without notifying anyone."
    ],
    "limit": "No PromQL engine, Alertmanager or external notification is executed."
  },
  {
    "comp": "m2.c1",
    "title": "Route, group and review alerts without hiding failures",
    "intro": "A deployment causes one underlying outage and hundreds of nearly identical notifications. Grouping and inhibition can reduce redundant pages, but broad silences can hide a second incident. Alert lifecycle configuration needs the same review discipline as application code.",
    "sections": [
      [
        "Notification lifecycle",
        "An alerting rule evaluates a condition; a notification system groups, routes, silences or inhibits matching alerts according to its configuration. Grouping can combine related observations into one message. Inhibition can suppress subordinate notifications when a matching higher-level alert is active.",
        "A silence is an explicit temporary match rule, usually with an owner and expiry. Matchers should be narrow enough to cover the intended maintenance scope. A blanket silence for every service may remove the only signal of an unrelated failure."
      ],
      [
        "Verify recovery and coverage",
        "A resolved alert means the monitored condition no longer satisfies the rule under its current data, not necessarily that every user path recovered. Validate the intended operation and check collection health before declaring resolution. Keep a record of silences and their expiry to support handoff.",
        "The example groups three supplied alert records by service. It does not implement Alertmanager matching, delivery retries or inhibition semantics. The exercise supports reasoning about grouping keys without sending messages or modifying a monitoring service."
      ]
    ],
    "code": "from collections import defaultdict\nalerts=[('checkout','latency'),('checkout','errors'),('search','latency')]\ngroups=defaultdict(list)\nfor service,symptom in alerts:\n    groups[service].append(symptom)\nfor service in sorted(groups):\n    print(service+':'+','.join(groups[service]))",
    "expect": "checkout:latency,errors\nsearch:latency",
    "practice": "What does alert grouping reduce?|Redundant notifications|Every underlying failure|Metric cardinality automatically|The need for responders|Grouping combines related observations for notification without fixing the cause.\nWhat should a maintenance silence include?|Scope, owner and expiry|Only a broad wildcard|Every service forever|A credential value|An explicit time-limited scope makes the suppression reviewable.\nDoes a resolved alert prove all user operations recovered?|No|Always|Only during office hours|Only if the label is green|A cleared rule condition is narrower than complete service validation.\nOne host failure causes many child pages. What may help?|Reviewed inhibition rules|Delete all metrics|Silence every environment forever|Ignore the incident|Inhibition can suppress redundant subordinate notifications under defined matching conditions.\nMaintenance covers search only. What silence is appropriate?|Narrow search matchers|All services without expiry|Every critical alert|The entire organization|Narrow matchers preserve evidence of unrelated failures.\nThe grouping fixture emits two groups. What was executed?|Local grouping of supplied records|An actual Alertmanager instance received and routed the alerts|A real silence|An Alertmanager reload|The fixture exercises Python grouping only.",
    "final": "Which component concept handles notification routing?|Alert notification management|A trace sampler decides where all notification messages should be delivered|A dashboard renderer alone determines the recipients of every alert message|Only a dashboard renderer|Routing chooses where relevant alert notifications should go.\nWhat is inhibition conceptually?|Suppressing subordinate notifications under matching conditions|The system deletes every metric series associated with the parent alert|Inhibition disables every rule evaluation instead of only matching notifications|Authenticating requests|Inhibition reduces redundant notification when a defined related alert is active.\nWhat is a silence?|An explicit temporary matcher-based suppression|A silence permanently deletes the monitored service and its retained data|A silence means every underlying user operation has recovered successfully|A trace span|Silences suppress matching notifications for a bounded maintenance or response purpose.\nAn organization silences every alert for a checkout deployment. What risk grows?|Unrelated incidents become invisible|All outages automatically resolve|Every service is validated|Telemetry is made more accurate|Overbroad suppression can hide failures outside the maintenance scope.\nA maintenance silence has no expiry or owner. What should review require?|A bounded accountable suppression|A broad wildcard with no expiry is easier to manage than an owner and scope|The original alert author need not be recorded if the silence has a wildcard|Only a larger message body|Ownership and expiry make the operational exception manageable.\nAn alert resolves when its exporter stops sending data. What should be investigated?|Missing-data behavior and service health|Assume all users recovered|Delete the incident timeline|Treat no samples as perfect success|Collection failure can change rule results without improving the service.\nTwo services share a label value and an inhibition rule suppresses both. What is the likely design issue?|Matchers are too broad for the intended relation|Alerts sharing one label must always represent the same underlying failure|Services with one shared label cannot experience independent incidents|The services cannot fail independently|Grouping and inhibition keys must match the operational relationship accurately.\nA handoff occurs during a silence. What should the next responder receive?|Scope, reason and expiry|Only the old responder’s name|Only a green screenshot|Only the log file size|Suppression state affects ongoing visibility and should be part of the handoff.\nThe synthetic grouping uses service alone. What limitation should be reviewed before production?|Whether grouping also needs environment or other scope|Grouping by service alone always distinguishes every deployment environment|Service names eliminate the need to distinguish test and production deployments|Whether dictionaries exist|Production grouping keys must distinguish operationally separate contexts.\nAfter a resolved page, what provides stronger recovery evidence?|The intended user operation succeeds|Only the notification count falls|Only the dashboard loads|Only the process id exists|Service recovery should be verified at the relevant user-facing boundary.",
    "mistakes": [
      "Broad silences can conceal unrelated incidents.",
      "A resolved rule is not a complete recovery test."
    ],
    "takeaways": [
      "Keep suppression bounded and accountable.",
      "Review grouping keys against operational scope."
    ],
    "problem": "Group synthetic alert symptoms by service.",
    "steps": [
      "Read each supplied service and symptom.",
      "Collect related symptoms by the selected key.",
      "Explain additional scope a real notification policy may need."
    ],
    "limit": "No Alertmanager matcher, notification delivery or production suppression is configured."
  },
  {
    "comp": "m3.c1",
    "title": "Interpret latency distributions and percentiles",
    "intro": "A learning platform has a reasonable average response time but some students wait several seconds. A percentile describes a point in an ordered distribution, while a mean compresses all observations into one total divided by count. Neither should be presented without its population, units and time window.",
    "sections": [
      [
        "Distribution before summary",
        "A p95 latency means approximately 95 percent of observations lie at or below that value under the chosen quantile definition. It does not mean every request takes that time, and a low median can coexist with a severe slow tail. Small samples produce unstable tail estimates.",
        "Quantile algorithms differ, especially for small samples. The lesson uses the explicitly declared nearest-rank convention: sort n observations and select the ceiling of p times n, using one-based ranks. A monitoring system may interpolate histogram buckets instead, so a toy exact sample is not a guarantee of matching live query results."
      ],
      [
        "Use the right population",
        "Compare percentiles only when the operation, window, units and eligibility are compatible. Mixing cached reads with expensive writes may hide one path’s behavior. A population-wide percentile cannot generally be obtained by averaging per-instance percentiles.",
        "The fixture computes a mean, median-rank result and p95-rank result for twenty supplied measurements. It executes exact local sample arithmetic and makes no Prometheus query or claim about an actual user population."
      ]
    ],
    "code": "import math\nvalues=[10]*18+[100,1000]\nordered=sorted(values)\ndef nearest_rank(p):\n    return ordered[math.ceil(p*len(ordered))-1]\nprint(sum(values)//len(values))\nprint(nearest_rank(.50))\nprint(nearest_rank(.95))",
    "expect": "64\n10\n100",
    "practice": "What can a low median hide?|A slow tail|Every trace id|All authentication failures|Only metric names|Many fast requests can coexist with a smaller group of very slow ones.\nWhat must accompany a latency value?|Units and population|Only a chart color|Only an alert sound|Only a hostname|Interpretation requires knowing what was measured and in which units.\nCan per-instance p95 values be averaged into a valid global p95 generally?|No|Always|Only for strings|Only if rounded|Quantiles are not generally composable by arithmetic averaging.\nA service’s mean is stable while p99 worsens. What should investigation examine?|Tail behavior|Only the mean|Only the dashboard title|Only the release count|A change in the tail can be obscured by an unchanged aggregate mean.\nA chart mixes reads and writes with very different latency. What helps?|Review operation-specific distributions|The fastest operation should determine every combined latency figure|Use only a prettier chart|Assume both paths are identical|The mixed population can conceal a problematic operation.\nA sample has only five requests. What should review note about p99?|Large sampling uncertainty|A precise all-traffic guarantee|A guaranteed SLA breach|A complete histogram|Tiny samples do not support stable estimates of very rare tail behavior.",
    "final": "Under nearest-rank convention how is rank chosen?|Ceiling of p times n|Always the mean|The first unsorted value|The maximum divided by n|The declared convention selects a one-based ordered rank.\nWhat does a p95 summarize?|A distribution threshold|Every individual duration|Only the fastest request|The number of servers|A percentile locates a value in the measured population distribution.\nWhich statistic can be strongly influenced by one extreme latency?|Mean|Only metric name length|Only the route label|Only span id|The mean uses the sum of values and can shift with large outliers.\nEighteen samples are 10 ms, one is 100 ms and one is 1000 ms. What is nearest-rank p95?|100 ms|10 ms|1000 ms|64 ms|The nineteenth ordered value is 100 ms under the stated twenty-sample convention.\nThe same sample has a median of 10 ms. Does that exclude a severe slow request?|No|Yes always|Only on weekdays|Only in Python|The median leaves the upper half and tail behavior uncharacterized.\nTwo instances report p95 values. What is required for a meaningful combined percentile?|A suitable combined distribution|Only their arithmetic average|Only the larger host name|Only a sum of their p95s|Global quantiles need distribution information rather than averages of quantiles.\nA dashboard switches from milliseconds to seconds but keeps the old label. What is the impact?|Misleading magnitude|Automatic correctness|Only a cosmetic font issue|Improved sampling|Incorrect units can lead responders to infer vastly wrong latency.\nA team compares one-hour p95 with another service’s monthly p95. What must be aligned?|Window and population semantics|Chart widths and colors alone make different measurement populations comparable|The larger of the two p95 values is always a fair comparison regardless of windows|Only output ordering|Different windows and eligible operations can make the comparison misleading.\nA histogram query differs from the toy nearest-rank value. What should be checked?|Bucket interpolation and quantile definition|Any difference from the toy value proves the monitoring server is broken|The histogram must exactly match every nearest-rank toy sample definition|Trust only the toy output|Histogram estimates and exact sample conventions need not produce identical values.\nThe fixture prints correct ranks. What remains untested?|Live instrumentation and sampling quality|Correct local arithmetic proves production sampling captured every request|The sorted local sample proves that every real user request was observed|The chosen index|The calculation verifies only the supplied local measurements.",
    "mistakes": [
      "Do not average percentiles into a global percentile.",
      "A stable mean can conceal a worsening tail."
    ],
    "takeaways": [
      "State units, window and quantile definition.",
      "Inspect distributions for relevant operations."
    ],
    "problem": "Compare mean and nearest-rank percentiles.",
    "steps": [
      "Sort the supplied twenty measurements.",
      "Select declared percentile ranks.",
      "Compare the summaries without claiming live service behavior."
    ],
    "limit": "This exact-sample convention is not a Prometheus histogram estimator or a production latency measurement."
  },
  {
    "comp": "m3.c1",
    "title": "Read histograms without losing aggregation semantics",
    "intro": "A dashboard needs a service-wide latency view across replicas. Compatible histograms preserve distribution information that can be aggregated, whereas precomputed summary quantiles cannot generally be averaged. Bucket layout and query semantics affect accuracy near a decision threshold.",
    "sections": [
      [
        "Classic and native representations",
        "A classic Prometheus histogram exposes cumulative bucket counts together with count and sum series. The le label marks the upper bound; each observation increments its bucket and all higher cumulative buckets. Native histograms use a composite sample representation and have different storage and query considerations.",
        "For classic histogram rate-based quantiles, preserve the le dimension while aggregating compatible bucket rates; a typical shape is histogram_quantile(0.95, sum by (le) (rate(request_duration_seconds_bucket[5m]))). This is illustrative syntax, not an executed query here, and production labels must preserve necessary service scope."
      ],
      [
        "Approximation and threshold decisions",
        "Bucket interpolation estimates quantiles; precision depends on the representation and bucket resolution near the region of interest. For a threshold SLI with a classic bucket exactly at the threshold, the matching cumulative bucket and total count can directly represent the observed fraction within that boundary under consistent instrumentation.",
        "The fixture counts supplied values at three cumulative bounds and a total count. It validates the cumulative relationship only, not histogram_quantile, native-histogram behavior or reset-aware rate semantics."
      ]
    ],
    "code": "values=[.05,.12,.2,.8]\nfor bound in [.1,.3,1.0]:\n    print(f'{bound}:{sum(value<=bound for value in values)}')\nprint('count:'+str(len(values)))",
    "expect": "0.1:1\n0.3:3\n1.0:4\ncount:4",
    "practice": "Are classic histogram buckets cumulative?|Yes|No, always disjoint|Only with one sample|Only for errors|Each cumulative bucket counts observations at or below its bound.\nWhich classic label represents the bucket upper bound?|le|trace_id|password|status_text|Classic histogram bucket series use le for the bound.\nCan precomputed summary quantiles generally be averaged globally?|No|Always|Only if labels are sorted|Only over HTTPS|Quantiles are not generally additive summaries.\nA latency SLI uses a 300 ms threshold. What bucket helps direct measurement?|A cumulative bucket at 0.3 seconds|Use only the infinity bucket because it always contains every observation|Only the sum series|Only a 10-second bucket|A matching threshold bucket provides the within-boundary count.\nA classic quantile query aggregates away le before histogram_quantile. What is lost?|Bucket-boundary information|The query still preserves the complete bucket layout automatically|Only an alert label|Only an operation id|The quantile function needs the bucket layout to interpret classic counts.\nA toy bucket counter works. What query behavior remains untested?|PromQL rate and interpolation|The toy executed reset-aware rate calculations in a real query engine|The supplied count|The integer sum|The fixture does not execute a query engine or counter-reset handling.",
    "final": "What additional series do classic histograms expose besides buckets?|Count and sum|User passwords|Only trace parents|Only dashboard tags|Count and sum accompany the bucket population series.\nWhat is a native histogram sample conceptually?|A composite distribution sample|Only a string label|Always one precomputed percentile|A log event|Native histograms encode distribution components within composite samples.\nWhat affects histogram quantile approximation?|Resolution near the quantile|The metric name length is the main determinant of quantile precision|Changing the service owner improves precision without changing bucket resolution|Only chart color|Coarser bucket layouts can reduce precision around the target value.\nFor values .05, .12, .2 and .8 seconds, how many are at or below .3 seconds?|3|1|2|4|The first three observations satisfy the stated cumulative bound.\nThe .3 bucket has 3 and total count is 4. What fraction was within .3 seconds?|75 percent|25 percent|50 percent|100 percent|The within-threshold fraction is three divided by four under the supplied population.\nTwo replicas use incompatible classic bucket layouts. What should aggregation review check?|Representation compatibility|Only host names|Only timestamp formatting|Only span ids|A combined distribution needs a compatible layout and query strategy.\nA query averages summary p95 values across replicas. What is the defect?|It does not derive global p95|It always produces exact global p95|It removes every outlier correctly|It computes the total request count|Averages of quantiles do not preserve the underlying combined distribution.\nAn engineer drops service identity while aggregating many applications. What risk appears?|Unrelated populations are mixed|Every service becomes faster|The histogram becomes exact|Cardinality is always zero|Aggregation must preserve the scope required by the operational question.\nA classic bucket rate is computed from a counter with resets. What query contract matters?|Reset-aware rate handling|Only the metric suffix|Only sorted labels|Only log retention|Cumulative counter changes require the query engine’s reset semantics.\nThe fixture shows nondecreasing cumulative counts. What remains unknown?|Real histogram instrumentation accuracy|The local bucket comparison establishes production instrumentation accuracy|Nondecreasing toy counts prove real instrumentation has no missing observations|The sample count|Local counting does not verify an instrumented production distribution.",
    "mistakes": [
      "Do not remove required bucket bounds during classic aggregation.",
      "Histogram estimates depend on representation and resolution."
    ],
    "takeaways": [
      "Aggregate compatible distributions rather than averaging quantiles.",
      "Align threshold buckets with measurement goals."
    ],
    "problem": "Count observations in cumulative histogram buckets.",
    "steps": [
      "Declare values and upper bounds.",
      "Count every value at or below each bound.",
      "Compare cumulative buckets with total observations."
    ],
    "limit": "No Prometheus server or PromQL function runs; classic illustrative syntax and native representations require expert integration review."
  },
  {
    "comp": "m3.c1",
    "title": "Build dashboards that test bottleneck hypotheses",
    "intro": "A responder sees high latency and assumes the busiest server is the cause. A useful dashboard aligns user outcomes with traffic, saturation and dependencies over compatible windows. It supports a sequence of testable questions instead of presenting a wall of unrelated gauges.",
    "sections": [
      [
        "From impact to candidate bottleneck",
        "Begin with the affected operation’s request rate, error behavior and latency distribution. Then inspect queues, resource saturation and dependency behavior for candidate constraints. Utilization is a resource activity fraction; saturation includes work waiting for scarce capacity and can occur unevenly across replicas.",
        "Compare deployment changes and dependency observations in time, while keeping measurement windows and units aligned. A busy resource may be a consequence of retries or a healthy workload rather than the limiting cause. Tail traces and bounded logs can help test a candidate hypothesis."
      ],
      [
        "Make absence and scope visible",
        "A dashboard should label population, units, time range and data gaps. Aggregations should expose relevant imbalance without adding unbounded user identifiers. Include safe links from aggregate symptoms to correlated evidence rather than raw sensitive payloads.",
        "The example ranks supplied queues by wait time and keeps service labels. It identifies the largest modeled queue wait, not the true cause of a live incident. A complete investigation must check timing, workload, measurement quality and the effect of a bounded mitigation."
      ]
    ],
    "code": "queues=[{'name':'api','wait_ms':12},{'name':'db','wait_ms':80},{'name':'worker','wait_ms':7}]\nranked=sorted(queues,key=lambda item:item['wait_ms'],reverse=True)\nprint(ranked[0]['name'])\nprint(ranked[0]['wait_ms'])",
    "expect": "db\n80",
    "practice": "What does resource saturation include?|Work waiting for capacity|Only a display name|Only process existence|Only a release number|Waiting work can reveal a constrained resource beyond utilization alone.\nWhat should a latency chart label?|Units and measured population|Only the dashboard color is needed to interpret the duration value|Only a color scale|Only a process id|Clear scope is required to interpret the measurement.\nDoes the busiest host automatically cause an incident?|No|Always|Only with two CPUs|Only under HTTPS|High activity alone does not establish a causal bottleneck.\nA service-wide mean hides one overloaded replica. What helps?|A bounded replica comparison|Delete replica labels from all evidence|Only display the overall mean|Assume equal load|Appropriate breakdowns can expose imbalance hidden by aggregation.\nAn incident starts after deployment. What should the timeline provide?|A hypothesis to test with evidence|Proof every code change is guilty|An automatic rollback command|A complete root cause|Temporal proximity guides investigation but does not prove causality.\nThe queue-ranking model picks db. What is justified?|It has the largest supplied wait|The live database caused every failure|A production mitigation succeeded|Every application is healthy|The local result is limited to the provided synthetic measurements.",
    "final": "Which dashboard starting point is most user-centered?|Operation outcomes and latency|The source line count should be the first measure of user experience|A host creation date measures user-visible reliability more directly than outcomes|Only account creation date|The first view should show the experience the service is expected to deliver.\nWhat is a bottleneck hypothesis?|A proposed limiting factor to test|A guaranteed cause from one chart|A final blame statement|An alert title only|A hypothesis needs supporting and contrary evidence before acceptance.\nWhat should a data gap look like?|An explicit missing-evidence state|An absent series should be displayed as zero latency and complete success|No observations should be represented as a fabricated flat successful series|A fabricated flat series|Missing observations must not be silently converted into healthy measurements.\nA database queue rises after application retries multiply. What should investigation consider?|Retry amplification may drive the queue|The database must be the original cause|Every retry improves health|Queue data is irrelevant|A saturated dependency can be a downstream consequence of another failure mechanism.\nOne chart uses seconds and another milliseconds. What should comparison do?|Normalize and label units|Compare raw numbers directly|Discard the larger value|Rename both charts green|Values need compatible units before magnitude comparisons are meaningful.\nA dashboard mixes five-minute rates and cumulative monthly counts. What should be clarified?|Window and aggregation semantics|Only changing chart order is needed to compare cumulative counts with rates|A cumulative count and a five-minute rate have identical aggregation semantics|Only service spelling|Unlike measurement windows can make apparent correlations misleading.\nA responder sees high utilization but no waiting and healthy user outcomes. What is careful?|Validate whether there is actual user risk|High utilization alone proves an outage even if users are successful|A resource should be deleted immediately whenever its utilization is high|Silence every alert permanently|Busy resources are not inherently unhealthy without a service-impact or capacity rationale.\nA drill-down link includes a request token. What should change?|Use nonsecret correlation identifiers|A request token is safe in a public link when it appears inside a chart|Embedding a credential in a chart title makes it safe for anyone to read|Disable authentication|Diagnostic navigation must preserve the access and data-minimization boundary.\nA mitigation is applied after identifying a candidate bottleneck. What should validate recovery?|The intended operation and relevant telemetry|A successful mitigation command proves the intended user behavior recovered|A reduced notification count proves that all affected user requests now succeed|Only reduced notification count|Recovery evidence must show the user behavior improved under the required constraints.\nThe rank calculation prints db and 80. What remains untested?|Causality and live service recovery|The largest synthetic queue wait establishes the cause of a live outage|Sorting a supplied list demonstrates that a production mitigation restored service|The dictionary lookup|Ranking synthetic values cannot establish actual production cause or successful mitigation.",
    "mistakes": [
      "A busy resource can be an effect rather than a cause.",
      "A data gap must not be displayed as perfect performance."
    ],
    "takeaways": [
      "Move from user impact to testable constraints.",
      "Align windows and preserve relevant scope."
    ],
    "problem": "Rank three synthetic queue waits.",
    "steps": [
      "Read bounded queue observations.",
      "Sort by the declared wait measurement.",
      "Report the largest observation with its limits."
    ],
    "limit": "The local ranking does not contact any database, collect telemetry or establish causal recovery."
  }
];
const refs=[ref('otel-traces','open-telemetry/opentelemetry.io','52bc572fc569401f35171b4138844754e5dac670','content/en/docs/concepts/signals/traces.md','OpenTelemetry traces and spans'),ref('prom-histograms','prometheus/docs','cc0672badce86173b9afaa95a59904576bcd6d6a','docs/practices/histograms.md','Prometheus histogram and summary semantics'),ref('prom-alerting','prometheus/docs','cc0672badce86173b9afaa95a59904576bcd6d6a','docs/practices/alerting.md','Prometheus alerting practices'),ref('prom-instrumentation','prometheus/docs','cc0672badce86173b9afaa95a59904576bcd6d6a','docs/practices/instrumentation.md','Prometheus instrumentation practices')];
const built=build('observability',data,refs);module.exports=built.course;Object.defineProperty(module.exports,'__bank',{value:built.bank,enumerable:false});
