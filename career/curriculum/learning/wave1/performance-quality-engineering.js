'use strict';
const {build}=require('./wave4-performance-completion-helper');
const units=[
  {
    "slug": "workload-contracts",
    "title": "Design representative load, stress and soak workloads",
    "intro": "An appointment service handles ordinary traffic well but stalls during a registration opening. A test with ten local users clicking as fast as possible cannot explain whether the target arrival rate, concurrency or long-lived resource behavior is the real risk.",
    "sections": [
      [
        "Choose the experiment from the question",
        "A load test evaluates behavior under a specified representative workload. A stress test deliberately explores beyond the expected operating envelope to expose saturation and degradation. A soak test sustains meaningful activity long enough to reveal leaks, accumulation and time-dependent failures. These labels do not specify success by themselves: record workload shape, duration, environment, data ownership, observability and abort conditions before running.",
        "Distinguish an open arrival-rate model from a closed concurrency model. In a simplified closed model, each virtual user waits for a response and think time before sending another request. As latency increases, the same fixed users may generate fewer requests, hiding the pressure of an external arrival stream. An open model schedules arrivals independently, but the generator must have enough capacity to issue the intended load and disclose dropped or delayed work."
      ],
      [
        "Preserve fidelity and authority",
        "Use an authorized isolated environment with synthetic records, bounded traffic and cleanup ownership. Match the important operation mix, payload sizes, cache state and data cardinality rather than copying production private records. Define what must remain representative and what is deliberately simplified. A fast empty database and warm cache can misrepresent an enrollment opening against a large cold dataset.",
        "The fixture computes a simplified closed-model request rate from twelve virtual users, half-second response time and one-and-a-half-second think time. It returns six requests per second under those stated assumptions. It does not launch users, model connection setup or measure the service. Real evidence must include achieved offered load, completion rate, error rate and latency rather than treating the configured target as observed throughput."
      ]
    ],
    "code": "const users=12,response=.5,think=1.5;\nconsole.log(users/(response+think));",
    "expect": "6",
    "problem": "Calculate a simplified closed-model request rate.",
    "steps": [
      "Add response and think time for one user cycle.",
      "Divide concurrent users by the cycle duration.",
      "Keep the simplified estimate separate from measured throughput."
    ],
    "limit": "This deterministic formula does not execute a load generator or prove any service capacity.",
    "mistakes": [
      "Configured request rate is not necessarily achieved throughput.",
      "Closed users can reduce offered load as response time grows."
    ],
    "takeaways": [
      "Choose load, stress or soak for the risk.",
      "Declare workload and abort conditions.",
      "Measure offered and completed work separately."
    ],
    "practice": [
      "Which experiment targets a slow resource leak?|A representative soak test|A short peak stress test|An ordinary load ramp test|A one-request smoke test|Time-dependent accumulation needs sustained activity.|Short stress focuses on overload rather than sustained accumulation.|A normal load ramp may end before time-dependent growth emerges.|A smoke request does not sustain resource usage.",
      "What does a load-test target rate specify?|The intended offered workload|Guaranteed completed throughput|Guaranteed successful response count|An automatic service capacity result|Configured load and achieved outcomes differ.|The service or generator can fall short.|Responses can fail.|Capacity needs measured evidence.",
      "How does a closed user model issue its next request?|After its response and think cycle|Always at an independent fixed arrival schedule|Only after every user finishes forever|Without any need for a configured user count|A closed population cycles through work and delay.|That describes a different arrival model.|Cycles repeat independently under the model.|Population size is a core input.",
      "What should bound an authorized workload experiment?|Scope, load and stop rules|Only expected concurrency|Only successful throughput|Only a recovery-time target|Effects and stopping conditions need explicit limits.|Concurrency alone omits duration and stopping conditions.|Successful throughput is an outcome, not a bound on issued work.|Recovery time alone does not constrain workload effects.",
      "Why track generator saturation?|It can prevent the intended load from being issued|It proves the server can handle every target|It removes all need to count errors|It makes configured rate equal completion rate|The client can become the bottleneck.|That conclusion needs service evidence.|Errors still matter.|Rates remain distinct.",
      "What does the closed-model arithmetic fixture verify?|Its supplied cycle-rate calculation|A real service’s maximum request rate|A live generator’s CPU utilization|Actual backend authorization|The fixture divides the supplied users by their response-plus-think cycle; it issues no traffic.|No service runs.|No generator runs.|No policy engine runs."
    ],
    "formal": [
      "Which test is intended to probe behavior beyond the operating envelope?|Stress testing|Soak testing|Smoke testing|Contract testing|Stress work explores saturation and degradation under controlled scope.|Soak targets sustained time-dependent behavior.|Smoke checks basic operation over a small scope.|Contract testing checks interface agreements rather than overload.",
      "What makes a workload specification reproducible?|Mix, arrivals, data and environment|Only desired requests per second|Only completed successful calls|Only the longest observed latency|The definition needs execution-relevant inputs.|A target rate omits operation mix, data and environment.|Completed outcomes do not specify how the load was generated.|A single extreme observation is not a workload specification.",
      "Why distinguish offered and completed request rates?|Backlog, errors or generator limits can separate them|They are mathematically identical in every system|Only completed rate can ever be recorded|Only offered rate determines correctness|The system may not complete every intended arrival in the window.|Queueing and failure break equality.|Both can be instrumented.|Correctness needs outcomes too.",
      "Twelve closed users have 0.5 second response and 1.5 second think time. What is modeled request rate?|6 requests/second|12 requests/second|24 requests/second|8 requests/second|12/(.5+1.5)=6 under the stated cycle model.|That omits cycle duration.|That ignores think time.|That uses only think time.",
      "An open generator targets 100 requests/second but issues 70 because its CPU saturates. Which service claim is unsupported?|100/s was actually offered|The generator intended 100 requests/second|The generator issued 70 requests/second|The client limited achieved offered load|Only 70 were actually issued under the observed condition.|The configured target is stated.|That rate is observed.|Saturation explains the stated client limit.",
      "A workload’s response time rises from 0.5 to 2 seconds with 10 users and 1 second think time. What happens to modeled closed request rate?|Drops from 6.67 to 3.33 requests/second|Rises from 6.67 to 10 requests/second|Stays fixed at 10 requests/second|Drops from 20 to 5 requests/second|10/1.5≈6.67 and 10/3≈3.33; slowing responses reduce this offered rate.|The longer cycle reduces rather than increases rate.|A closed cycle is not a fixed open arrival schedule.|Those calculations omit think time.",
      "A checkout service expects external arrivals even while responses slow. A fixed-user test reduces request issuance during stalls. Which experiment adjustment targets that blind spot?|Capacity-checked open arrivals|A smaller fixed user population|A longer fixed-user think delay|A success-only latency dashboard|The open schedule preserves arrival intent while client capacity remains observable.|Reducing closed users can further reduce offered traffic.|Longer think time also lowers closed-model issuance.|A latency chart does not maintain external arrival pressure.",
      "A stress test needs bounded effects, tenant-owned synthetic records and a hard stop at 30 seconds or 5 percent errors. Which setup meets the contract?|Owned fixtures and enforced aborts|Shared fixtures and duration only|Owned fixtures and warnings only|Shared fixtures and error logging|The execution must enforce both ownership and stopping bounds.|Shared fixtures violate the stated owned-data boundary.|Warnings do not enforce the required abort conditions.|Error logging alone does not bound effects or ownership.",
      "A 20-minute soak at 40 requests/second achieves every arrival with 2 percent errors. How many requests and errors occur under the stated model?|48000 requests and 960 errors|800 requests and 16 errors|48000 requests and 96 errors|24000 requests and 480 errors|20×60×40=48000; 2 percent is 960.|That omits seconds per minute.|The error count is low by a factor of ten.|That halves the supplied duration or rate.",
      "A registration-opening test must preserve arrival pressure, large-data behavior and no production-user effects. Which design satisfies all three?|Open load on representative isolated data|Closed users on empty isolated storage|Open load against real student records|Closed users on tiny cached test data|The design preserves the named pressure/data dimensions and authorization boundary.|Empty storage and closed users miss the stated cardinality and arrival risks.|Real student records violate the stated isolated synthetic-data boundary.|A tiny warm dataset and closed users omit two named requirements."
    ]
  },
  {
    "slug": "tails-and-throughput",
    "title": "Interpret latency tails, errors and throughput together",
    "intro": "A service advertises a fifty-millisecond average latency, yet one in ten enrollment requests takes several seconds. The average alone hides an important tail and says nothing about how many requests succeeded.",
    "sections": [
      [
        "Define the measured population",
        "Latency measures elapsed time under a specified start and end contract. Throughput counts completed operations per unit time, often requiring separate successful and failed counts. State whether timeouts and errors appear in latency summaries or a separate population; excluding failed slow requests can make the successful-only chart look healthy while users experience outages.",
        "A percentile is a rank-based summary of a distribution. This lesson uses nearest-rank: sort N observations and select rank ceil(p×N), with one-based ranks. Other systems interpolate, so estimator differences matter. A p95 of 500 ms does not mean the average is 500 ms or every request finishes within 500 ms. Small samples provide limited information about rare-tail behavior."
      ],
      [
        "Aggregate the right measurement",
        "Do not average per-instance percentiles to obtain a fleet percentile: the underlying sample counts and distributions matter. Prometheus histograms can aggregate compatible bucket counts before estimating a quantile; summaries’ precomputed quantiles are generally not aggregatable that way. Bucket boundaries control the approximation and should fit the threshold of interest.",
        "The fixture computes a nearest-rank p90 from ten exact supplied observations and a successful throughput from explicit counts over a minute. It is not a Prometheus query or live instrumentation test. In real reporting retain offered rate, success rate, error rate, latency population and histogram configuration, so a faster success-only tail cannot conceal a flood of rejected or timed-out requests."
      ]
    ],
    "code": "const samples=[100,100,100,100,100,100,100,100,500,2000];\nconsole.log(samples[Math.ceil(.9*samples.length)-1]);\nconsole.log((600-60)/60);",
    "expect": "500\n9",
    "problem": "Compute an exact sample percentile and successful throughput.",
    "steps": [
      "Select the ninth sorted observation for nearest-rank p90.",
      "Subtract failed completions from total completions.",
      "Divide successful completions by the measured seconds."
    ],
    "limit": "Fixed sample arithmetic does not validate histogram export, real request timing or production service performance.",
    "mistakes": [
      "A fleet percentile is not the average of instance percentiles.",
      "Success-only latency can hide failed slow requests."
    ],
    "takeaways": [
      "Define the population and estimator.",
      "Read tails alongside errors and throughput.",
      "Aggregate compatible distributions before quantiles."
    ],
    "practice": [
      "What does p95 describe under a declared estimator?|A distribution rank summary|The arithmetic mean by definition|The fastest request only|Every request’s exact duration|Percentiles summarize ordered observations.|Mean is a different statistic.|That is the minimum.|A summary does not retain each exact value.",
      "What is successful throughput?|Successful completions per unit time|Only the configured arrival target|Only the longest response duration|Only the number of server files|It counts completed successful work over a window.|Intended arrivals may fail or queue.|Duration is latency.|Files are unrelated.",
      "Why disclose success-only latency populations?|Failures may be excluded from the chart|All failures must have zero duration|Errors cannot affect users|Success charts prove total availability|Omitted failures can change interpretation.|Failures can be slow.|Errors do affect outcomes.|A subset does not prove universal availability.",
      "How should compatible histogram data be combined before a fleet quantile?|Aggregate bucket counts|Average instance percentiles blindly|Keep only the fastest instance|Delete all error observations silently|Quantiles need the combined distribution representation.|Percentiles are not generally linear.|That omits other traffic.|Population exclusions need explicit meaning.",
      "What controls histogram approximation near a threshold?|Bucket resolution and counts|Only the process CPU average|Only the configured SLO target|Only the longest sample value|Buckets determine available distribution resolution.|CPU averages do not define latency histogram resolution.|An SLO target does not determine observed bucket precision.|A maximum does not describe the counts near a threshold.",
      "What does a fixed percentile fixture fail to establish?|Actual instrumentation timing fidelity|Its supplied nearest-rank selection|Its stated count subtraction|Its throughput division|No real request timing executes.|The index is computed.|The counts are supplied and subtracted.|The rate calculation runs."
    ],
    "formal": [
      "What is a defensible interpretation of p95<=500 ms?|Estimated p95 meets 500 ms|Every request completes within 500 ms|Mean latency must equal 500 ms|Exactly 95 percent of requests succeed|The claim is about the defined distribution summary.|A percentile bound permits observations above the threshold.|A rank statistic does not require that arithmetic mean.|Latency rank does not determine the successful-request fraction.",
      "Why avoid averaging instance p99 values?|Percentiles do not combine linearly across populations|Averaging is forbidden for every possible numeric value|All instances always process the same count|The smallest instance must define the fleet distribution|Combined quantiles need distribution and weight information.|Means can be valid for other purposes.|Traffic counts can differ.|The fleet includes all required traffic.",
      "What should a latency dashboard retain alongside quantiles?|Population, errors and throughput|Only the configured client-user count|Only the maximum target arrival rate|Only the median of successful calls|These dimensions prevent a narrow latency summary from hiding failures.|Configured users do not describe the measured response population.|A desired arrival rate is not observed throughput or errors.|A success-only median omits the error and tail context.",
      "Ten sorted durations are eight 100 ms values, then 500 ms, then 2000 ms. What is nearest-rank p90?|500 ms|100 ms|2000 ms|330 ms|Rankceil(.9×10)=9, and the ninth value is 500.|That is below the selected rank.|That is the maximum.|330 is the mean, not this percentile.",
      "A minute has 600 completions with 60 errors. What is successful throughput?|9 per second|10 per second|1 per second|540 per second|(600−60)/60=9 successful completions per second.|Ten includes errors.|One is the error throughput.|540 is the per-minute successful count.",
      "Instance Ahas 999 fast samples at 100 ms; Bhas one slow sample at 10000 ms. What is fleet nearest-rank p99?|100 ms|5050 ms|10000 ms|109.9 ms|Rank 990 of 1000 lies among the 999 fast samples.|That averages the instance quantiles.|Only the maximum sample is slow.|109.9 is the combined mean, not p99.",
      "A service drops its slowest timed-out requests from the reported latency population. Success p95 improves while timeout rate rises. Which interpretation is valid?|The success-only tail improved but overall experience may have degraded|The service must have become more reliable because p95 is lower|Timeouts have no user impact when excluded from latency|The new p95 proves every request completed successfully|The population excludes a worsening failure class.|One subset metric cannot establish reliability.|Exclusion does not erase user failures.|Timed-out requests did not successfully complete.",
      "Two instances expose histogram buckets with different boundaries. A proposed query sums bucket counts as if definitions match. What must be corrected?|Use compatible bucket definitions|Average the bucket boundary labels|Merge by bucket position in each list|Treat all counts as disjoint intervals|Distribution aggregation depends on matching bucket meanings.|Averaging labels does not reconcile unlike bucket populations.|Position in a list need not represent the same threshold.|Cumulative buckets overlap and cannot be treated as disjoint counts.",
      "A cumulative histogram has counts<=100 ms: 80,<=500 ms: 95,<=1000 ms: 100. Which exact observation is supported without interpolation?|95 of 100 observations are<=500 ms|Exactly 95 observations took 500 ms each|The exact p99 is 500 ms|Every observation exceeded 100 ms|The cumulative bucket count directly supplies that threshold population.|Counts describe ranges, not equality of durations.|The 99 th observation lies above 500 in these buckets.|Eighty were at or below 100.",
      "A gate requires successful throughput>=90/s, error rate<=1 percent and nearest-rank p95<=300 ms over all completed requests. It sees 100/s completions, 2 percent errors and p95 of 250 ms only for successes. Which decision is valid?|Rate passes; errors fail; latency unproven|All pass because 98 successful calls/s|Rate fails; errors pass; latency passes|Only latency fails with known all-call p95|The metrics have independent thresholds and the latency population differs.|The 98/s rate passes but 2 percent errors violates the independent limit.|The 98/s rate passes; the error condition fails.|All-completion p95 was not measured, so its failure is not established."
    ]
  },
  {
    "slug": "saturation-and-soak",
    "title": "Locate bottlenecks and time-dependent degradation",
    "intro": "A service completes one hundred operations per second at moderate load, then throughput flattens while queues and latency grow. Adding more client workers changes the queue but not the completed work.",
    "sections": [
      [
        "Look for a constrained resource",
        "Saturation occurs when a limiting resource cannot service additional demand under current conditions. Inspect CPU, connection pools, locks, queue length and downstream capacity together with user outcomes. A throughput plateau with increasing latency suggests waiting or contention, but it does not identify the exact bottleneck without correlated resource evidence. A client limit can also cap observed throughput, so measure the generator.",
        "Little’s law relates long-run average in-flight work L, throughput λ and average time W under a stable defined system: L=λW. Units and boundaries must agree. It is not a guarantee during rapidly growing queues or an excuse to replace tail distributions with a mean. If the average service boundary completes 100 requests/second with 0.2 second average residence time under stable conditions, average in-flight work is 20 requests."
      ],
      [
        "Sustain the right observation window",
        "A soak should inspect trends in memory, handles, storage growth and cleanup behavior, not only the final green response. Distinguish bounded cache warmup from unbounded retained-resource growth using a stable workload and sufficiently long observation. Restarting the service every few minutes may hide an accumulation defect rather than repair it.",
        "The fixture computes stable average in-flight work and a linear memory-growth projection from supplied values. It does not prove that real growth is linear, locate an allocator leak or run a soak. Record achieved workload and resource changes over time, and use safe abort limits before a synthetic experiment exhausts shared environment capacity."
      ]
    ],
    "code": "console.log(100*.2);\nconst initial=120,growth=4,minutes=30;console.log(initial+growth*minutes);",
    "expect": "20\n240",
    "problem": "Calculate stable average concurrency and a stated linear memory projection.",
    "steps": [
      "Match throughput and residence-time units.",
      "Multiply their stable averages.",
      "Project supplied memory growth without claiming a measured leak."
    ],
    "limit": "Both outputs are arithmetic models; no live resource saturation or memory allocation is measured.",
    "mistakes": [
      "Increasing offered load can grow a queue without growing throughput.",
      "Frequent restart can conceal rather than remove accumulation."
    ],
    "takeaways": [
      "Correlate resource and user signals.",
      "Apply average laws only within their assumptions.",
      "Use bounded sustained experiments."
    ],
    "practice": [
      "What can a throughput plateau with growing queues indicate?|A capacity or contention limit|Guaranteed perfect scaling|Zero waiting in the system|Automatic successful completion of all arrivals|Additional work may wait behind a limiting resource.|A plateau is not linear scaling.|Queue growth shows waiting.|Arrivals can backlog or fail.",
      "Which law relates stable average concurrency, throughput and residence time?|L=λW|L=λ/W²|L=λ+W|L=W/λ²|Little’s law uses matched long-run boundaries and units.|That expression has different units.|Adding unlike units is not the law.|That expression is not the stated relationship.",
      "Why monitor resource trends during a soak?|Accumulation can appear before outright failure|A final screenshot proves no leak exists|Only startup duration matters|Every memory increase is necessarily a leak|Time-dependent growth can precede exhaustion.|A snapshot cannot establish sustained bounds.|Soak focuses on sustained behavior.|Warmup and bounded caching can also grow memory.",
      "What assumption limits a linear memory projection?|The stated constant growth model|Every real allocator is always linear|The service has no cleanup path|A chart label proves causality|The arithmetic is conditional on its inputs.|Real growth can vary.|Cleanup must be observed separately.|Labels do not establish cause.",
      "What must be checked before blaming the server for capped throughput?|Generator issuance capacity|Only the configured user count|Only server process uptime|Only completed response size|The client can itself be the bottleneck.|Configured users may not issue the intended traffic.|Process uptime does not reveal client issuance saturation.|Response size alone does not measure generator capacity.",
      "At 100/s and 0.2 s average residence time, what is stable modeled in-flight work?|20 requests|500 requests|100.2 requests|0.002 requests|100×.2=20 under matched stable boundaries.|That divides instead of multiplying.|Adding mismatched units is invalid.|That reverses the ratio again."
    ],
    "formal": [
      "What should saturation analysis correlate?|Outcomes, queues and utilization|Only configured users and target rate|Only the shortest completed response|Only initial memory and final CPU|A bottleneck needs evidence across the relevant boundary.|Targets do not establish achieved user outcomes or resource pressure.|The fastest completion omits saturation and queue evidence.|Two snapshots omit the outcome and queue relationship.",
      "Why distinguish cache warmup from unbounded growth?|Early growth can have different causes|Every initial increase proves a leak|Every plateau proves no later failure|Restarting permanently repairs growth|Bounded stabilization differs from continuing accumulation.|Bounded warmup can also increase memory initially.|A plateau in one window does not prove no later defect.|A restart can reset growth without repairing its cause.",
      "When is the simple stable Little’s-law calculation inappropriate as a direct snapshot claim?|A rapidly growing transient backlog|Stable matched long-run populations|Matched average throughput and time|Explicit stable measurement boundaries|The stable average model does not directly characterize a transient growing backlog.|Matched stable populations support the stated long-run relationship.|Matched units and averages are necessary for the law.|Explicit stable boundaries support a defensible calculation.",
      "A stable boundary completes 80/s with 0.25 s average residence time. What is average in-flight work?|20 requests|320 requests|80.25 requests|0.003125 requests|Little’s law gives 80 completions/s×0.25 s=20 average in-flight requests under stable matched boundaries.|That divides throughput by time.|Adding unlike quantities is invalid.|That reverses the relationship.",
      "Memory starts 120 MB and grows 4 MB/minute for 30 minutes under a stated linear model. What is projected usage?|240 MB|124 MB|1200 MB|150 MB|The stated linear model gives 120+4×30=240 MB; this is a projection rather than a measured leak.|That adds only one minute.|That multiplies the wrong quantities.|That adds minutes directly as megabytes.",
      "Arrivals are 150/s and completions 100/s for 60 seconds with no drops. What backlog growth follows from the stated flow counts?|3000 requests|50 requests|6000 requests|9000 requests|(150−100)×60=3000 queued requests.|Fifty is growth per second.|Six thousand is total completions.|Nine thousand is total arrivals.",
      "A 100/s plateau appears while client CPU is saturated but server CPU is 20 percent and no server queue grows. Which experiment separates the leading hypotheses?|Increase generator capacity and remeasure|Increase server CPU without client checks|Increase timeout and ignore issued rate|Increase target rate on the capped client|Client saturation can cap offered work; changing that capacity while retaining measurements tests the hypothesis.|Server CPU is low and this change leaves saturated client issuance unexplained.|A timeout change does not establish the offered rate.|A higher target on the same saturated client may change no achieved traffic.",
      "A soak grows from 200 MB to 320 MB in 30 minutes; a reboot resets it to 200 MB. A repeated run stabilizes at 320 MB after warmup. Which conclusion respects both observations?|Bounded warmup fits these observations|The first slope proves indefinite leakage|The reset proves persistent corruption|Restarting has permanently fixed a leak|The later plateau distinguishes these observations from continuing linear growth, though longer representative evidence may still be needed.|The repeated run stabilized rather than following that indefinite slope.|No evidence of corruption is supplied.|A reset does not establish a permanent causal repair.",
      "A stable system has throughput 200/s and average in-flight 60 requests. A new stable workload doubles average residence time while throughput remains 200/s. What average in-flight value follows?|120 requests|30 requests|60 requests|400 requests|Initially W=60/200=.3 s; doubling to.6 s gives L=200×.6=120.|That halves rather than doubles L.|At fixed throughput doubled residence time doubles L.|That confuses throughput with concurrency.",
      "A bounded soak starts at 100 MB, has a linear 4 MB/min growth model and must stop before reaching 260 MB. It also needs 40 minutes of uninterrupted representative load. Which conclusion is correct?|40 minutes reaches the forbidden limit|40 minutes remains strictly below 260 MB|65 minutes reaches the forbidden limit|Two 20-minute runs prove uninterrupted soak|(260−100)/4=40 minutes. The strict stop boundary conflicts with completion at that same point; adjust the experiment safely and report the unmet scope.|The model is 100+4×40=260, not strictly below 260.|Sixty-five ignores the initial 100 MB when calculating remaining capacity.|A restart breaks the uninterrupted observation requirement."
    ]
  },
  {
    "slug": "recovery-contracts",
    "title": "Specify and test failure recovery boundaries",
    "intro": "An appointment service returns after a database outage, but some acknowledged bookings are missing. A health check recovered while the durable business outcome did not.",
    "sections": [
      [
        "Define recovery before injecting failure",
        "A recovery test names the fault, affected boundary, expected degradation, restoration condition and success criteria. Use an authorized isolated environment and bounded synthetic traffic with explicit abort conditions. Injecting a fault without observing the relevant state can produce an impressive event log without establishing that the system recovered correctly.",
        "Recovery time objective is a target for restoring the defined service level after a stated event. Recovery point objective limits acceptable data loss measured back from the relevant failure point under its contract. A green process health endpoint does not establish either objective. Distinguish service readiness, backlog catch-up and durable data integrity; they may complete at different times."
      ],
      [
        "Verify acknowledgments and reconciliation",
        "Record synthetic operation identities before fault injection and reconcile outcomes afterward. If the system acknowledges a write before failure, the durability contract determines whether that write must survive. Unknown acknowledgments need explicit reconciliation rather than blind repeat creation. Check duplicates, missing records and tenant ownership as well as availability.",
        "The fixture calculates observed restoration duration from fixed event times and compares it with a five-minute target. It does not stop a real service or recover data. A real test needs the authoritative success boundary and a documented definition of when the outage began and when restoration counted. Clock alignment and measurement scope matter when events come from different systems."
      ]
    ],
    "code": "const fault=120,restored=390,target=300;\nconsole.log(restored-fault);console.log(restored-fault<=target);",
    "expect": "270\ntrue",
    "problem": "Evaluate a supplied recovery interval against a declared target.",
    "steps": [
      "Use the stated fault and restoration timestamps in seconds.",
      "Subtract to obtain elapsed restoration time.",
      "Compare the same boundary against the target."
    ],
    "limit": "No actual fault injection, backup restoration or durable storage executes.",
    "mistakes": [
      "A healthy process can coexist with missing business records.",
      "A successful restart does not prove duplicate-free reconciliation."
    ],
    "takeaways": [
      "Name the recovery boundary.",
      "Reconcile acknowledged operations.",
      "Measure time and data integrity separately."
    ],
    "practice": [
      "What does a recovery time target constrain?|Defined restoration duration|Maximum recoverable data lag|Dependency attempt frequency|Successful requests per second|The target concerns restoration after a stated event.|Recoverable lag is an RPO concept rather than restoration duration.|Attempt frequency is not the restoration interval.|Successful throughput is a rate, not elapsed recovery time.",
      "What does a recovery point target address?|Permitted data-loss window|Only CPU utilization|Only the process restart count|Only the report image width|It concerns how far back recoverable data may lag.|CPU is a resource signal.|Restart count does not define data loss.|Image width is unrelated.",
      "Why retain synthetic operation ids through a fault?|Reconcile missing and duplicate outcomes|Authorize every tenant automatically|Guarantee no fault can occur|Replace all storage checks|Identity links expected and observed effects.|Ids do not grant permission.|Recording does not prevent faults.|Reconciliation needs actual authoritative outcomes.",
      "A health endpoint returns 200 after restart. What remains unproven?|Durable business state correctness|The endpoint returned 200|The health request completed|The supplied response was observed|Process health is a narrower boundary.|That is directly observed.|The request did complete.|The response is the stated observation.",
      "What should constrain failure injection?|Authorized scope and abort conditions|Only an arbitrary outage label|Only a public administrator token|Only an unbounded duration|The test needs bounded effects and a safe stop contract.|A name does not constrain effects.|Authority should be scoped.|Unbounded faults exceed a useful test plan.",
      "Fault time 120 s and restoration 390 s yield what interval?|270 seconds|510 seconds|300 seconds|120 seconds|390−120=270 seconds at the stated boundary.|That adds timestamps.|Three hundred is the target, not observed interval.|That is the fault timestamp."
    ],
    "formal": [
      "What separates readiness from recovery completeness?|A ready endpoint may precede data reconciliation|They are necessarily identical at all times|A green process proves no acknowledged writes were lost|Recovery only means the process has a new id|Business state and backlog may need further checks.|Different boundaries can complete separately.|Durability needs authoritative evidence.|Identity does not define successful recovery.",
      "Why test data integrity after restoring service?|Availability omits state integrity|A ready endpoint proves write durability|Restoring a process guarantees no loss|Successful reads prove unique effects|A service can respond while business records are wrong.|Readiness alone cannot prove acknowledged-write durability.|Process restart does not reconcile stored outcomes.|Successful reads do not exclude duplicate or missing writes.",
      "What should a fault scenario record before execution?|Degradation, recovery and stop rules|Only the fault injector implementation|Only the expected health response code|Only a target incident-report timestamp|The test needs an explicit outcome contract.|The injector implementation alone omits expected outcomes and stopping conditions.|A health code is only one possible recovery signal.|A report timestamp does not define degradation or restoration.",
      "A five-minute target is 300 s. Fault occurs at 120 and recovery at 390. Which result is correct?|270 s, within target by 30 s|390 s, over target by 90 s|510 s, over target by 210 s|300 s, exactly at target|Elapsed recovery is 390−120=270, leaving 30 s.|390 is an absolute timestamp.|Adding event times is not elapsed time.|The target is not the measured duration.",
      "A fault occurs at 12: 10 and the latest valid recoverable state is 12: 07. RPO is 2 minutes. What observed gap and result follow?|3-minute gap, exceeds target by 1 minute|2-minute gap, meets target exactly|7-minute gap, exceeds by 5 minutes|No gap because a backup file exists|The recoverable point lags the fault by 3 minutes.|The stated times differ by three.|Minutes within the hour must be subtracted correctly.|A file’s existence does not make its data current.",
      "A write is acknowledged before failure but missing after restore. The contract promises acknowledged-write durability. Which result is valid?|Durability failed despite successful health recovery|All recovery criteria passed because health is green|The acknowledgment can be relabeled as an unexecuted test|A screenshot of another record proves this write survived|The named data invariant failed independently of availability.|Health is a different boundary.|The observed acknowledgment remains evidence.|Another record does not establish this operation’s survival.",
      "An operation Kmay commit but its acknowledgment is lost during failover. Retrying with new id Jcreates a second record. Which repair targets the observed duplicate?|Reconcile or retry under stable Kusing the defined idempotency contract|Keep new ids and delete all records created that hour|Increase UI timeout while retaining fresh operation identities|Count both records as one because their payloads match|Stable logical identity supports resolving uncertain outcome without a second operation.|Broad deletion exceeds ownership and does not repair delivery semantics.|Waiting alone does not preserve logical identity.|Matching payloads do not collapse durable duplicate records.",
      "Health recovers at 4 minutes, backlog drains at 7 and integrity check completes at 8. The defined RTO boundary is usable service with drained backlog within 6 minutes. What is the gate result?|Fail: the required boundary completes at 7 minutes|Pass: health alone was green by 4 minutes|Pass: average of 4, 7 and 8 is below 7 minutes|Fail only because integrity took 8 minutes regardless of RTOdefinition|The contract explicitly includes backlog drain, so 7 exceeds 6.|Health alone omits the named condition.|An average of different milestones is not restoration time.|Integrity matters separately, but the named RTO boundary already failed at 7.",
      "A fixture creates 10 acknowledged owned records before a fault. After recovery 9 remain and 1 extra record has the same operation id as another. What must reconciliation report?|One missing acknowledged record and one duplicate effect|Ten correct records because total count is 10|Only a faster recovery because duplicates help throughput|No state issue because every remaining row has an id|Counts alone hide identity-level loss and duplication.|Cardinality can remain constant while identities are wrong.|Duplicate effects are not correct throughput.|Presence of an id does not establish unique intended outcome.",
      "A recovery test requires RTO<=5 minutes at the drained-backlog boundary, RPO<=1 minute and no duplicate owned writes. Health is green at 3 minutes, backlog at 6; recoverable state lags 30 seconds; operation Kappears twice. Which result is correct?|RTO and deduplication fail; RPO passes|All pass because health returned within 5 minutes|Only RPO fails because 30 seconds is greater than 1 minute|RTOpasses at 3 minutes and duplicate writes count as harmless retries|The required service boundary occurs at 6 minutes; 30 seconds meets the data-loss window; duplicate effects violate the write invariant.|The RTOcontract includes drained backlog.|Thirty seconds is half a minute.|Health is not the specified RTO boundary and durable duplicates remain effects."
    ]
  },
  {
    "slug": "retry-and-breaker-budgets",
    "title": "Bound retries and isolate dependency failures",
    "intro": "A ticketing API retries every failed payment immediately. During a payment-provider outage the extra attempts occupy workers and multiply provider traffic, preventing unrelated ticket lookups from completing.",
    "sections": [
      [
        "Retries consume a shared budget",
        "A retry repeats an operation after an unsuccessful or uncertain attempt. It is useful only when the error may be transient and the operation can be repeated safely. Preserve logical operation identity for uncertain writes; a timeout can mean that the server committed but the acknowledgment was lost. Exponential backoff spreads attempts over increasing intervals, while jitter prevents clients from waking together. Both need an attempt cap and a total deadline.",
        "Compute the worst-case elapsed path before choosing local timeouts. Three one-second attempts separated by waits of one and two seconds require six seconds without scheduling overhead. A five-second caller deadline cannot promise all three attempts. Cancellation should propagate to outstanding work where supported; otherwise timed-out callers can leave resource-consuming work behind. Test expiry, late completion and unknown outcome, rather than assuming a thrown timeout canceled a remote effect."
      ],
      [
        "Separate rejection, isolation and recovery",
        "A circuit breaker stops calls after its failure policy opens the circuit, then probes under a defined recovery policy. It does not restore the dependency, grant permission, or prove data integrity. A bulkhead bounds resources used by one dependency so its failures cannot occupy every worker. Queue limits and rejection behavior need explicit contracts: silently moving an unlimited queue elsewhere preserves the accumulation problem.",
        "The fixture calculates capped retry timing and peak attempt amplification for supplied integers. It does not execute timers or a breaker library. A native resilience test should observe actual issued calls, waiting time, cancellation, breaker transitions and effects under a controlled dependency failure. Compare completed business operations as well as HTTP responses, since repeated calls can inflate traffic without improving successful outcomes."
      ]
    ],
    "code": "const attempts=3,timeout=1,waits=[1,2];\nconsole.log(attempts*timeout+waits.reduce((a,b)=>a+b,0));\nconsole.log(200*attempts);",
    "expect": "6\n600",
    "problem": "Calculate retry elapsed demand and bounded call amplification.",
    "steps": [
      "Sum the three attempt windows.",
      "Add only waits between attempts.",
      "Multiply logical operations by the maximum issued attempts."
    ],
    "limit": "The outputs are timing and count bounds under supplied assumptions; no real retry scheduler or remote mutation executes.",
    "mistakes": [
      "Timeout does not prove remote rollback.",
      "Backoff without an attempt cap can still amplify an outage indefinitely."
    ],
    "takeaways": [
      "Use one end-to-end deadline.",
      "Preserve idempotency identity through uncertain outcomes.",
      "Observe isolated resource consumption during dependency failure."
    ],
    "practice": [
      "An order client times out after a write may commit. Which retry property prevents a second logical order?|Reuse the operation id under a documented idempotency contract|Generate a fresh operation id for every attempt|Retry the same payload as a new order after every timeout|Treat any transport timeout as proof no write occurred|Stable logical identity lets the service reconcile repeated delivery.|Fresh ids identify separate operations.|Equal payloads can still be separate writes.|Acknowledgment loss can occur after commit.",
      "A dependency becomes unavailable and exhausts all checkout workers. Which mechanism directly limits its share?|A bounded dependency bulkhead|An unbounded shared pending-call queue|A longer timeout on every worker|A counter recording only successful requests|A bulkhead reserves bounded resources for that dependency.|An unlimited queue retains pressure.|Longer occupancy can worsen exhaustion.|Counting success does not isolate capacity.",
      "Thousands of clients hit the same fixed retry delay after a provider outage. What does adding random jitter address?|Reduce synchronized client retry bursts|Guarantee the dependency has recovered before each call|Make every request idempotent automatically|Remove the need for an overall deadline|Different delays reduce simultaneous wakeups.|Delay cannot prove recovery.|Identity and effect contracts determine idempotency.|Retries still require a bounded budget.",
      "A breaker is open during an outage. Which behavior fits that state?|Reject calls while open|Queue calls without a bound|Probe every covered call|Retry each call immediately|An open breaker limits calls until recovery probing is allowed.|Unbounded pending work defeats the intended failure isolation.|Probing every call is not an open breaker’s bounded recovery policy.|Immediate retries continue sending work to the failing dependency.",
      "Two attempts each allow 2 s with a 1 s intervening delay. What worst-case elapsed budget is needed before overhead?|5 s|4 s|3 s|6 s|Two 2-second attempts plus the 1-second intervening wait require 5 seconds before overhead.|Four omits the delay.|Three includes only one attempt.|Six counts a delay after completion.",
      "A payment succeeds after the caller deadline. What should reconciliation inspect?|The original operation outcome|Only the local deadline value|Only the next retry payload|Only the current retry count|The first effect may exist despite the expired local wait.|The local deadline does not reveal whether the remote charge committed.|The next payload does not establish the original effect.|Retry count does not identify durable provider state."
    ],
    "formal": [
      "What is the purpose of exponential retry backoff?|Increase intervals between repeated attempts within a cap|Make all attempts begin at the same instant|Convert permanent validation failures into valid input|Guarantee exactly-once effects without operation identity|Increasing waits reduces immediate repeated pressure.|Simultaneous attempts increase bursts.|Input validity is independent.|Effect identity needs a separate contract.",
      "What does an open circuit breaker establish by itself?|Calls are being limited by a failure policy|The external provider has repaired its database|Every pending business operation was canceled remotely|All stored records passed reconciliation|A breaker controls issuing calls, not remote correctness.|Opening is a response to failure evidence.|Remote cancellation is a different mechanism.|Data checks must run separately.",
      "Why cap a retry queue independently of worker count?|Waiting work can accumulate even while active work is bounded|A worker cap makes pending memory unlimited safely|Every queued request has already succeeded|A bounded queue removes all need for rejection handling|Queued work consumes resources and increases waiting.|An unbounded queue can exhaust memory.|Queued is not completed.|Rejection behavior remains part of the contract.",
      "A client permits three 1 s attempts with 1 s then 2 s waits. Its caller deadline is 5 s. What timing conflict exists?|The complete worst-case sequence needs 6 s|The sequence needs only 3 s because waits do not count|The sequence always needs 9 s because every wait repeats three times|The deadline guarantees every attempt completes|3+1+2=6 seconds before overhead.|Waiting consumes elapsed time.|Only the two stated intervening waits apply.|The caller deadline truncates the path.",
      "Two hundred logical requests permit three attempts each. All attempts are issued during a failure. What is the maximum dependency-call count?|600|200|400|1200|Two hundred logical operations times at most three issued attempts gives a 600-call maximum.|That ignores retries.|That includes only two attempts.|That doubles the stated cap.",
      "A bulkhead has 8 active slots and a 12-request pending cap. Twenty-five covered requests arrive before any completes. Under immediate overflow rejection, how many are rejected?|5|0|13|17|8+12=20 admitted; 25−20=5 rejected.|Only twenty can be admitted.|Thirteen counts the wrong capacity boundary.|Seventeen subtracts only active slots.",
      "Client Ahas 2 s attempts with 1 s wait and a 5 s total deadline; client Bhas 2 s attempts with 2 s wait and the same deadline. Both allow two attempts. Which full worst-case sequence fits before scheduling overhead?|A fits exactly; B requires 6 s and cannot fully fit|Both fit because each attempt is below 5 s|B fits because a longer wait reduces elapsed time|Neither fits because two attempts always exceed 5 s|A needs 2+1+2=5; B needs 2+2+2=6.|Local bounds do not override total demand.|Waiting still consumes elapsed time.|The first sequence equals the stated inclusive bound.",
      "A timeout occurs after a provider commits charge K. Retrying with Kreturns the stored result; retrying with Jcreates another charge. Which plan satisfies one-charge semantics?|ReconcileK and keepK through retry|UseJ to avoid reading an older result|UseK only for logs but send a new id on writes|Raise the timeout and preserve new-id retries|The provider contract linksK to the original effect.|A fresh id represents new work.|Logs do not impose provider identity.|A longer timeout does not fix duplicate identity.",
      "A downstream pool has 10 slots. An outage blocks all 10 for 30 s; timeouts return to callers at 5 s without canceling downstream work. Which observation would distinguish resource recovery from caller recovery?|Active downstream work after caller timeouts|Only caller latency being below 6 s|Only a green edge health response|Only the number of retry configuration lines|Occupancy reveals whether abandoned remote work still holds slots.|Fast errors can coexist with exhausted pools.|Health can omit dependency capacity.|Configuration length is not runtime occupancy.",
      "A service gets 100 logical requests/s. Each can issue up to 3 attempts; downstream capacity is 220 calls/s and all attempts are used in an outage. Which plan actually bounds the modeled overload?|Admit at most 73/s with capped retries|Admit 100/s and ignore retry traffic|Admit 100/s and add a fourth attempt|Admit 100/s with unbounded pending work|73×3=219; the original maximum is 300 calls/s, so admission and retry demand must be coordinated.|100 logical requests can issue 300 calls/s, above 220 capacity.|A fourth attempt further increases demand above the limit.|An unbounded queue does not create throughput or bounded waiting."
    ]
  },
  {
    "slug": "sli-and-resilience-experiments",
    "title": "Define indicators and compare fault outcomes",
    "intro": "An online booking team reports 99.9 percent process uptime, yet users frequently receive booking failures. Their resilience experiment must use the booking outcome boundary and compare fault behavior against a declared service objective.",
    "sections": [
      [
        "Choose an eligible population",
        "A service-level indicator measures a defined aspect of user experience over a specified population and window. An availability ratio needs both good and eligible events. Define exclusions before looking at results: legitimate validation errors may be excluded under one contract, while server failures and timeouts normally remain eligible. Changing the denominator after an incident can make the chart improve without improving service.",
        "A service-level objective sets a target for the indicator over a window. The error budget is the allowed bad fraction under that target, not a stock of outages to spend without consequence. A request-based 99.9 percent target over 100000 eligible requests permits 100 bad outcomes. Time-based availability and request-based availability answer different questions; do not substitute one for the other simply because both display percentages."
      ],
      [
        "Compare a fault with a controlled baseline",
        "State a steady-state hypothesis in observable terms before injecting a bounded fault. A cache outage might preserve successful read ratio while increasing latency, whereas a primary database fault may test recovery and acknowledged-write durability. Include a control period or comparable group and note workload changes. Correlation with fault timing helps investigation but does not by itself exclude simultaneous deployments or traffic shifts.",
        "The executable example evaluates a request-based budget and its remaining balance. It does not gather monitoring data or certify an SLO. Record numerator and denominator provenance, histogram boundaries where used, and the difference between planned target and observed ratio. A reliability conclusion should retain unsuccessful eligible operations and report scope, duration and uncertainty, especially when the sample is small."
      ]
    ],
    "code": "const eligible=100000,allowed=eligible*(1-.999),bad=70;\nconsole.log(Math.round(allowed));console.log(Math.round(allowed-bad));",
    "expect": "100\n30",
    "problem": "Compute a stated request-based error budget.",
    "steps": [
      "Multiply the eligible population by the permitted bad fraction.",
      "Compare observed bad outcomes with the allowance.",
      "Keep this window and eligibility rule fixed."
    ],
    "limit": "The result is arithmetic over supplied counts; monitoring ingestion, outages and production service behavior are not executed.",
    "mistakes": [
      "An uptime health check can miss failed user operations.",
      "Removing failed eligible requests after observing results biases the indicator."
    ],
    "takeaways": [
      "Define good and eligible events before a test.",
      "Compare fault and baseline populations consistently.",
      "Keep request and time budgets distinct."
    ],
    "practice": [
      "A booking SLI counts good completed bookings over eligible attempts. Where should server timeouts be handled?|In the declared eligibility and failure rules|Removed afterward whenever the chart misses its target|Reclassified automatically as successful writes|Counted only if a screenshot captured them|The predeclared contract determines their inclusion and bad outcome status.|Post-result exclusion biases the metric.|A timeout is not evidence of success.|Screenshots are not the eligibility criterion.",
      "A 99.9 percent request objective covers 100000 eligible attempts. How many bad outcomes are allowed?|100|1000|10|99900|The allowed bad fraction is 0.001, so 100000×0.001 permits 100 bad outcomes.|That corresponds to a one-percent budget.|That corresponds to 0.01 percent.|That is the required good count.",
      "Why distinguish request availability from time availability?|They weight failures by different populations|Both must always produce identical percentages|A request count is measured in outage minutes|A time ratio proves every acknowledged write survived|Busy and quiet intervals contribute differently to request counts.|Different weighting can yield different results.|Units differ.|Durability needs state evidence.",
      "A cache fault coincides with doubled traffic. What limits a simple causal claim?|Workload changed along with the injected fault|Every fault experiment proves a unique cause automatically|Traffic cannot affect latency once a fault is named|A target objective replaces observed measurements|The second change is a competing explanation needing control or analysis.|Naming a fault does not isolate all causes.|Workload can affect latency and queues.|Targets do not measure results.",
      "A 100 bad-request budget has 70 bad outcomes observed. What budget remains?|30 bad outcomes|70 bad outcomes|170 bad outcomes|100 bad outcomes|Subtract 70 observed bad outcomes from 100 allowed outcomes to leave 30 in this window.|Seventy is consumed budget.|Adding spent budget is incorrect.|That ignores consumption.",
      "A one-minute outage occurs during the busiest minute of a day. Which result can differ sharply?|Request-weighted and time-weighted failure fractions|Two exact counts of the same eligible rows|A count and its identical stored copy|The same ratio computed twice with unchanged inputs|Many requests can fail within a small time fraction.|Identical populations and rules yield identical counts.|Copies do not change values.|Unchanged arithmetic does not change the ratio."
    ],
    "formal": [
      "What makes an indicator operationally interpretable?|Numerator, denominator and window|A target percentage without counted events|An attractive chart title alone|A success numerator with no eligible population|The ratio requires explicit population and scope.|Targets are expectations.|Presentation omits the calculation contract.|A numerator alone is not a rate.",
      "What is a request error budget?|Allowed bad outcomes under the chosen objective and population|Unlimited permission for outages once any target exists|The total number of successful requests|The number of monitoring dashboards owned by a team|It derives from the allowed bad fraction.|A budget is bounded.|Successes belong to a different count.|Dashboard count does not define reliability.",
      "Why declare steady-state success before injecting a fault?|Make recovery and degradation judgments testable|Guarantee no request can fail during the fault|Avoid collecting any baseline evidence|Replace the need to measure actual outcomes|A hypothesis names the expected observable behavior.|The fault may violate it.|Comparison evidence still matters.|Measurements determine whether it held.",
      "A 99.5 percent objective covers 40000 eligible requests and 180 fail. What budget result follows?|200 allowed, 20 remaining|200 allowed, 180 remaining|20 allowed, 160 overspent|39800 allowed, 39620 remaining|The allowed count is 40000×0.005=200 bad outcomes; 180 are consumed, leaving 20.|That confuses consumed and remaining counts.|The fraction was applied incorrectly.|39800 is required good work, not allowed bad work.",
      "A team excludes 500 server failures only after its SLO misses. Which change is necessary for a defensible recalculation?|Keep the original eligibility rule|Remove failures only during incidents|Treat the target as the observed ratio|Count failures as successful validation|Changing the population after observing failures destroys comparability.|Retrospective incident exclusions bias the original population.|A target is not an observed good-event ratio.|Server failure does not become valid client rejection by relabeling.",
      "During a fault 2000 eligible reads have 1980 good outcomes; the comparable baseline has 1995 good of 2000. What difference in good-event percentage follows?|Fault 99 percent versus baseline 99.75 percent, a 0.75-point decrease|Fault 99 percent versus baseline 99.75 percent, a 75-point decrease|Both 99 percent because denominators match|Fault 98 percent versus baseline 99.5 percent, a 1.5-point decrease|1980/2000=.99 and 1995/2000=.9975.|A 0.75 percentage-point change is not 75 points.|Equal denominators do not make numerators equal.|Both supplied ratios were miscomputed.",
      "A threshold SLI says latency<=300 ms is good. Of 1000 eligible requests, 960 meet it, 20 exceed it and 20 time out. Timeouts are bad by contract. What is the good fraction?|96 percent|98 percent|97.96 percent|100 percent|960/1000=96 percent with all eligible timeouts retained.|That removes or converts timeouts incorrectly.|960/980 excludes eligible timeout outcomes.|Forty eligible outcomes are bad.",
      "Two regions have 99 good of 100 and 900 good of 1000 requests. What is the fleet request-weighted good ratio, rounded to two decimals?|90.82 percent|94.5 percent|99 percent|90 percent|(99+900)/(100+1000)=999/1100≈90.82 percent.|That averages percentages without their different weights.|That uses only the small region.|That uses only the larger region.",
      "A 99.9 percent target has 100000 eligible requests. Observed bad counts are 40 before a fault and 90 during it. What does the combined window show?|130 bad outcomes, 30 over its 100 budget|90 bad outcomes, 10 remaining because earlier failures reset automatically|40 bad outcomes, 60 remaining because fault periods are excluded|130 bad outcomes, 870 remaining under a 1000 budget|The same window retains 40+90=130; allowed bad is 100.|The question specifies a combined window.|Faults remain eligible under the stated contract.|A 1000 budget corresponds to 99 percent.",
      "A proposed resilience experiment expects success>=99 percent and p95<=250 ms under a cache fault. Results show 99.4 percent success, p95=310 ms and unchanged load. Which conclusion follows?|The success gate passes and latency gate fails|Both pass because the success ratio exceeds 99 percent|Both fail because every fault must reduce all metrics|Latency passes because 310 is below one second|Both stated conditions apply independently.|Success does not override the latency condition.|The success condition did meet its bound.|The declared bound is 250 ms, not one second."
    ]
  },
  {
    "slug": "shift-left-risk-selection",
    "title": "Select earlier tests from change risk and feedback cost",
    "intro": "A pricing rule defect is first found in a nightly browser suite after developers have merged several unrelated changes. The team needs earlier evidence around the rule and its service contract while preserving coverage of the actual user journey.",
    "sections": [
      [
        "Put evidence near the changed decision",
        "Shifting testing left means obtaining useful evidence earlier in development, not moving every check into a unit test. A pure pricing rule can be tested with deterministic tables in milliseconds. A service boundary needs serialization and contract checks. A browser journey still protects wiring, interaction and accessible presentation. Choose the earliest test layer that can observe the risk, then retain integration evidence where the boundary itself can fail.",
        "Separate feedback speed from confidence scope. A mocked payment response supports client behavior under that response but cannot show provider compatibility. Conversely, a large environment can fail for unrelated reasons and slow diagnosis of an arithmetic regression. A risk-based plan names the possible failure, its consequence, the layer that can observe it, and the evidence required before delivery. Test count alone is not an adequacy argument."
      ],
      [
        "Make a change reviewable and traceable",
        "For a rounding change, include boundary inputs, zero or missing cases under the contract, currency precision and interaction with discounts. Record the expected business result rather than copying the implementation expression into the assertion. Add a regression check for a demonstrated defect at the layer that isolates its cause, then use a small higher-level path to confirm the behavior remains connected.",
        "The fixture applies an explicit integer-cents pricing rule to supplied basket values and compares independent expected outputs. It does not call a checkout service or render a browser. Its value is a fast, reproducible signal around one decision; the delivery plan still needs relevant contract and interaction checks. Maintain failure diagnostics so an earlier check identifies the violated rule rather than reporting only an opaque red build."
      ]
    ],
    "code": "function price(cents){return cents>=10000?cents-1000:cents;}\nconst cases=[[9999,9999],[10000,9000],[10001,9001]];\nconsole.log(cases.every(([x,want])=>price(x)===want));\nconsole.log(price(10000));",
    "expect": "true\n9000",
    "problem": "Check an integer-cents discount threshold against independently stated boundary cases.",
    "steps": [
      "Name the inclusive 10000-cent threshold.",
      "Evaluate inputs just below, at and above it.",
      "Compare outputs with the supplied expected table."
    ],
    "limit": "This executes an ordinary JavaScript rule fixture; it does not certify a checkout integration or currency policy beyond the stated rule.",
    "mistakes": [
      "Duplicating the production expression in expected output can duplicate its defect.",
      "Mock-only success cannot establish actual provider compatibility."
    ],
    "takeaways": [
      "Observe the specific failure risk at an appropriate layer.",
      "Keep independent expectations for boundary rules.",
      "Retain integration checks for actual boundaries."
    ],
    "practice": [
      "A discount threshold defect is arithmetic and deterministic. Which first regression check gives focused early feedback?|A small rule test around the threshold|Only a nightly full-browser run across all products|Only a mocked green provider response|A production sales chart without expected values|A rule test isolates the changed decision and can run quickly.|The broad run delays and obscures diagnosis.|A provider mock does not test the arithmetic.|A chart lacks a controlled expectation.",
      "A mocked payment service always returns accepted. What remains outside that evidence?|Actual provider compatibility|Client behavior under the mock|The mocked acceptance status|The supplied response payload|The external boundary was replaced.|Client behavior under the controlled acceptance response can be observed.|The mock directly supplies the acceptance status.|The fixture directly supplies its response body.",
      "A rule grants 1000 cents discount at totals>=10000. What is due at 10000?|9000 cents|10000 cents|9900 cents|11000 cents|The threshold is inclusive and 10000−1000=9000.|That treats equality as below threshold.|That discounts 100 rather than 1000.|That adds the discount.",
      "Why use independently stated expected values?|Avoid reproducing the same defect in test and implementation|Guarantee every expectation is correct without review|Remove the need for boundary cases|Make all integration checks unnecessary|An independent oracle can catch an erroneous production expression.|Expectations still need domain review.|Boundaries remain valuable.|Different layers observe different risks.",
      "A schema change renames a response field used by another service. Which early evidence targets the boundary?|Consumer-provider contract checks with the changed schema|Only a local helper test with a hardcoded old object|Only a screenshot of the response title|Only a throughput average before the rename|Contract checks expose compatibility at the serialization boundary.|The helper can bypass actual serialization.|Appearance does not validate the payload contract.|Performance does not establish schema compatibility.",
      "An early test is fast but bypasses authorization entirely. What should its report clarify?|Scope and missing policy checks|Only its favorable elapsed time|Full authorization certification|Equivalence to a real request|The result covers the fixture boundary, not omitted policy execution.|Elapsed time omits the untested authorization boundary.|The check explicitly bypassed the policy path.|A narrow fixture cannot claim an omitted production boundary."
    ],
    "formal": [
      "What does shift-left testing seek to improve?|Earlier useful evidence about a change|The number of identical assertions in every test|The removal of all integration testing|The automatic approval of any fast build|Earlier evidence reduces feedback delay while preserving relevant scope.|Duplication adds little confidence.|Boundary behavior still needs coverage.|Approval requires appropriate evidence and review.",
      "Which fact distinguishes a unit rule check from an integration check?|Whether the relevant external boundary actually executes|Whether its filename contains the word integration|Whether it has more than one assertion|Whether its report uses a particular color|Executed scope determines the evidence.|Names do not create integration.|Assertion count does not identify boundaries.|Presentation does not change execution.",
      "Why test values immediately around a threshold?|Detect inclusive/exclusive boundary defects|Prove every possible business case without further tests|Avoid understanding the threshold rule|Replace checks of currency representation|Adjacent values expose off-by-one interpretation.|Other inputs and interactions can still matter.|The expected rule must be known.|Precision is a separate concern.",
      "A change moves a shipping cutoff from 5000 to 6000 cents. Existing tests cover 1000 and 10000 only. Which added set best distinguishes the new boundary?|5999, 6000 and 6001 with expected results|1000, 2000 and 3000 with expected results|8000, 9000 and 10000 with expected results|10000 three times with expected results|These inputs probe both sides and equality at the changed cutoff.|These values are below both old and new thresholds.|These values are above both thresholds.|Repeated 10000 inputs do not distinguish the changed boundary.",
      "A rule suite takes 2 s and finds 80 percent of observed rule defects; the remaining 20 percent are serialization issues. Which plan matches these observations?|Keep the rule suite and add focused serialization checks|Replace every check with the 2 s suite because 80 percent is most defects|Remove the rule suite and rely only on broad manual inspection|Add duplicate arithmetic cases without observing serialization|The missing evidence lies at another boundary.|Twenty percent of observed defects would remain unobserved.|That abandons useful fast evidence.|More arithmetic cases need not execute serialization.",
      "A price function returns 9000 for 10000 cents after a 1000-cent discount. The test computes expected using the same wrong production helper. What failure mode is likely?|A shared defect can make both values agree incorrectly|Independent expected output has been established|All threshold cases are now proven correct|The assertion necessarily exercises a payment provider|The expectation is coupled to the implementation.|It uses the same helper rather than an independent oracle.|Agreement alone does not prove the rule.|No provider call is described.",
      "A JSON contract drops a required currency field while its local calculation remains correct. Which two-layer plan is strongest?|Rule plus serialized-contract checks|Rule plus unrelated browser screenshots|Rule plus two manually built mock JSONs|Rule plus average-throughput monitoring|The rule and wire boundary cover separate plausible failures.|Unrelated screenshots do not exercise the response serializer.|Manually constructed JSON can bypass the broken serializer.|Throughput does not establish required field presence.",
      "A change affects a pure tax formula, API rounding and displayed totals. Which evidence distribution fits its risks?|Formula, wire and rendered-total checks|Only repeated positive formula cases|Only a mocked page with a fixed total|Only nightly endpoint-uptime checks|The three layers observe distinct failure boundaries.|Positive formula repeats omit transport rounding and presentation.|A fixed mocked total bypasses formula and transport behavior.|Uptime does not establish the displayed monetary result.",
      "A suite runs 120 checks at 0.1 s each sequentially and a 20 s integration setup. Moving 60 independent rule checks to a 1 s earlier stage leaves 60 later checks plus the same setup. What later-stage duration follows before overhead?|26 s|6 s|32 s|21 s|Sixty remaining checks require 6 seconds; adding the unchanged 20-second setup gives 26 seconds.|That omits setup.|Thirty-two is the old 120-check duration.|That counts the earlier stage but omits later checks.",
      "A team can afford one new early gate for a schema rename affecting 12 consumers. Which competing plan protects the stated risk most directly?|Check the 12 consumer contracts|Add 12 unrelated arithmetic assertions|Accept based only on changed-line count|Capture the unchanged home-page layout|Producer-consumer compatibility observes the changed interface.|Unrelated arithmetic assertions do not observe the renamed schema.|Small diffs can still break every consumer.|An unchanged page may never consume the renamed field."
    ]
  },
  {
    "slug": "quality-metrics-denominators",
    "title": "Interpret defect, coverage and flakiness metrics",
    "intro": "A release dashboard celebrates a falling bug count while test execution has halved and many flaky tests are rerun until green. A useful quality review must identify what was measured, which population changed and what the metric can actually establish.",
    "sections": [
      [
        "Rates need stable definitions",
        "A defect count depends on exposure, detection effort, severity and reporting practice. Escaped defects are found beyond a defined test or release boundary; an escape rate needs a declared denominator and observation window. A release with fewer reported defects can still have greater risk if usage shrank, detection stopped or high-severity failures rose. Keep trends comparable and retain the classification rules used in each window.",
        "Code coverage describes executed code under a chosen instrumentation method. Statement coverage and branch coverage measure different populations, and neither establishes that assertions would detect a wrong result. A test may execute both branches and assert nothing meaningful. Mutation testing can probe whether selected injected changes are detected, but its score depends on valid mutants, tool limits and exclusions; it is supporting evidence rather than a proof of correctness."
      ],
      [
        "Keep retries visible in the metric",
        "Define a flaky test result precisely, for example first attempt failed followed by a passing retry for the same unchanged candidate. Record first-pass success separately from eventual success. A retry policy can reduce disruption but also consume capacity and conceal instability when reports collapse all attempts to green. Investigate nondeterministic fixtures, races, shared state and environmental failures before deciding whether quarantine is justified.",
        "The fixture computes first-pass and eventual pass fractions from supplied outcomes, then a declared escaped-defect ratio. It does not execute the test runner or infer product reliability from these numbers. Diagnose the identities and reasons behind changes: a high flaky percentage might come from one heavily retried test or many independent failures, requiring different repair plans. Track user impact and severity alongside internal activity metrics."
      ]
    ],
    "code": "const runs=[[true],[false,true],[true],[false,false]];\nconsole.log(runs.filter(a=>a[0]).length/runs.length);\nconsole.log(runs.filter(a=>a.some(Boolean)).length/runs.length);\nconsole.log(3/(27+3));",
    "expect": "0.5\n0.75\n0.1",
    "problem": "Separate first-pass, eventual pass and a stated defect-escape ratio.",
    "steps": [
      "Count only the first outcome for first-pass success.",
      "Count any passing attempt for eventual success.",
      "Divide escaped defects by all discovered defects under the supplied definition."
    ],
    "limit": "The ratios describe supplied records and definitions; they are not a measured release-quality score or proof of production reliability.",
    "mistakes": [
      "A retry pass does not erase the original failure.",
      "Executed lines do not prove assertions detect faulty behavior."
    ],
    "takeaways": [
      "Define denominators and windows.",
      "Separate first-pass and eventual outcomes.",
      "Use quality metrics as diagnostic evidence."
    ],
    "practice": [
      "Four runs have outcomes pass; fail-then-pass; pass; fail-then-fail. What is first-pass success?|50 percent|75 percent|100 percent|25 percent|Two of four pass on their first attempt.|Three eventually pass.|One run never passes.|One of four is the flaky count.",
      "What does statement coverage measure?|Statements executed under the instrumented tests|The percentage of all possible defects prevented|The fraction of assertions independently reviewed|The probability a future release has no incident|It measures execution under the tool’s method.|Execution does not prove detection.|Review is a separate activity.|Coverage is not a reliability probability.",
      "A dashboard reports fewer defects after disabling half its tests. What should be checked?|Whether detection exposure and population changed|Whether a lower raw count proves better product quality|Whether disabled tests now count as passing|Whether all remaining defects can be assigned zero severity|Reduced detection can reduce reports without reducing faults.|Raw counts do not establish that claim.|Skipped execution is not passing evidence.|Severity requires impact assessment.",
      "There are 27 pre-release defects and 3 escaped defects in one window. Using escaped/all discovered, what is the escape ratio?|10 percent|11.11 percent|90 percent|3 percent|The declared denominator includes 27 pre-release plus 3 escaped defects, so 3/30=10 percent.|3/27 uses a different denominator.|That is the pre-release share.|Three is the count, not the percentage of thirty.",
      "A test passes only on retry without code or fixture change. What should remain visible?|Its first failure and eventual pass|Only its final green result|A fabricated first-pass result|A completed lesson record for every user|Both outcomes are evidence of instability.|That hides a failed attempt.|That falsifies the run history.|Test retries do not establish learner progress.",
      "Why can full branch coverage still miss defects?|Assertions may not check the business result|Every executed branch is necessarily correct|Coverage tools prove all inputs equivalent|A branch hit automatically validates its output|Execution alone does not establish a correct oracle.|Executing faulty code does not repair it.|Input spaces can contain many behaviors.|An assertion must verify the intended result."
    ],
    "formal": [
      "What is a necessary part of a comparable quality rate?|Denominator and observation window|Only the current escaped-defect count|Only a target green percentage value|Only the total number of test files|Population and time determine the interpretation.|A numerator alone cannot define a comparable rate.|A desired percentage does not specify measured population or time.|Test file counts are not defect-rate exposure.",
      "What can mutation testing add beyond execution coverage?|Evidence that tests detect selected injected changes|Proof that all real defects are impossible|A replacement for every integration boundary|Automatic confirmation that excluded mutants were valid|Detected mutants probe test sensitivity to specific changes.|Finite mutations cannot prove absence of faults.|External contracts can remain untested.|Exclusions need review and tool context.",
      "Why classify severity alongside escaped-defect counts?|Equal counts can have very different user impact|Severity makes a defect no longer real|All escaped defects necessarily have identical consequences|Counts alone determine business loss exactly|Impact differs among defects and populations.|Classification does not remove a defect.|A typo and lost payment differ materially.|Loss needs actual consequence evidence.",
      "Of 100 unchanged test executions, 90 pass initially, 8 pass only on retry and 2 never pass. What are first-pass and eventual pass rates?|90 percent and 98 percent|98 percent and 100 percent|90 percent and 90 percent|8 percent and 2 percent|Ninety first-pass; 90+8=98 eventual passes.|Two never pass.|The eight retry successes affect eventual results.|Those are other outcome fractions.",
      "A release has 4 escaped defects among 40 total discovered. The next has 3 among 15. Under this definition, what happened?|Escapes fell; rate rose 10 to 20 percent|Escapes fell; rate fell 10 to 7.5 percent|Escapes rose; rate remained 10 percent|Escapes fell; rate remained 3 percent|The earlier rate is 4/40=10 percent and the later rate 3/15=20 percent despite fewer raw escapes.|The later 3/15 rate is 20 percent, not 7.5 percent.|The raw count falls from 4 to 3 and the denominator changes.|Three is a count rather than the ratio over 15.",
      "A suite executes 100 branches and asserts only that no exception occurred. Which improvement targets a silent wrong total?|Add independent expected-total assertions for relevant cases|Add 100 more branch hits with the same weak assertion|Remove the output from diagnostics to keep logs shorter|Declare branch execution equivalent to output correctness|A wrong value needs an oracle that can detect it.|More execution alone can preserve the blind spot.|Hiding evidence does not improve detection.|The metrics measure different things.",
      "A retry doubles runtime for 20 of 100 tests; each attempt lasts 1 s. With one retry for those 20 and no setup, what total attempt time is consumed sequentially?|120 s|100 s|200 s|20 s|100 initial attempts+20 retries=120 seconds.|That omits retries.|Only twenty tests repeat, not all hundred.|That is the extra retry time only.",
      "A mutation report has 80 detected, 10 surviving and 10 excluded mutants. Under detected/(detected+surviving), what score should be reported with exclusions disclosed?|88.89 percent|80 percent|90 percent|100 percent|80/(80+10)=.8889; excluded mutants are outside this stated denominator.|Eighty percent uses all hundred.|Ninety counts detected plus exclusions incorrectly.|Ten valid survivors remain.",
      "A team removes its 10 most flaky tests and reports higher first-pass success. Which comparison is defensible?|Report the changed population and retained uncovered risks with the new rate|Describe the higher rate as improvement in all original test coverage|Count removed tests as permanent successes|Erase historical failures so both windows appear identical|Removing a population changes comparability and may remove coverage.|The original coverage was reduced.|Unexecuted tests did not pass.|History remains evidence.",
      "A release gate requires first-pass>=95 percent and zero unresolved critical defects. Of 200 runs, 188 pass first time and 10 pass on retry; one critical defect remains. Which gate result follows?|Fail both: 94 percent first-pass and one critical defect|Pass because eventual success is 99 percent|Pass because only one critical defect remains|Fail only the critical gate because 188/200 is 98 percent|188/200=.94 and the critical count is nonzero.|Eventual rate does not satisfy a first-pass rule.|The critical threshold is zero.|The first-pass arithmetic is 94 percent."
    ]
  },
  {
    "slug": "evidence-based-release-gates",
    "title": "Combine performance and quality evidence into release decisions",
    "intro": "A search optimization reduces median latency but increases timeout rate and uses a noncomparable benchmark dataset. Reviewers need a release decision that preserves the user-outcome contract and distinguishes established evidence from remaining verification.",
    "sections": [
      [
        "Build gates from named contracts",
        "A release gate should state the metric, boundary, eligible population, window and comparison rule before the candidate runs. Use representative workload and data, control relevant environment differences and retain raw result provenance. A latency regression budget is meaningful only when the measurement method and population remain comparable. Percentiles calculated separately from different instances cannot simply be averaged into a fleet percentile; combine compatible distributions or use an appropriate shared histogram method.",
        "Separate mandatory limits from diagnostic indicators. A candidate can have a better median and still fail a p95 bound, error-rate bound or durability invariant. Do not average independent gates into a single green score unless the business contract explicitly defines that aggregation and its tradeoffs. A synthetic benchmark provides bounded evidence; production rollout may require a controlled exposure plan with observable stop and rollback conditions."
      ],
      [
        "Review uncertainty and choose the next experiment",
        "A small sample with zero observed failures does not prove zero failure probability. Retain sample size, warmup policy, workload mix, environment and run-to-run variability. Investigate whether a faster result comes from skipped work, omitted failed requests, a smaller dataset or a real improvement. A useful competing plan changes one plausible cause while keeping the intended workload and success definition stable.",
        "The fixture evaluates three independent conditions for a candidate against declared limits and calculates the relative p95 change. It does not benchmark a deployed service, estimate statistical significance or execute rollout. The final decision records failed gates and the next bounded experiment; it does not turn incomplete evidence into an approval. Human educational review remains pending for this curriculum and release authority remains outside these arithmetic examples."
      ]
    ],
    "code": "const before=200,after=230;\nconsole.log((after-before)/before);\nconst gates={p95:after<=220,error:.004<=.005,durable:true};\nconsole.log(Object.values(gates).every(Boolean));console.log(Object.keys(gates).filter(k=>!gates[k]).join(\",\"));",
    "expect": "0.15\nfalse\np95",
    "problem": "Evaluate independent release conditions and relative latency change.",
    "steps": [
      "Compute the relative change against the baseline denominator.",
      "Evaluate each declared condition independently.",
      "Report the failing condition rather than averaging it away."
    ],
    "limit": "The fixture evaluates supplied values only; there is no live load test, rollout, statistical significance calculation or automatic approval.",
    "mistakes": [
      "A lower median cannot override a failed tail-latency contract.",
      "A noncomparable dataset can explain an apparent speedup."
    ],
    "takeaways": [
      "Declare gates before observing results.",
      "Keep failed eligible requests in outcome evidence.",
      "Choose the next experiment from the remaining uncertainty."
    ],
    "practice": [
      "A candidate improves median latency but misses its mandatory p95 limit. What is the gate result?|Fail the p95 condition despite the median improvement|Pass because any faster percentile overrides all other limits|Average the two percentile labels to create an unplanned gate|Remove slow requests from the eligible population afterward|Independent mandatory conditions must each hold.|One improvement does not negate another condition.|The aggregation was not the contract.|Post-result exclusion biases evidence.",
      "Why record benchmark data cardinality?|Dataset size can materially change the exercised work|A larger row count always guarantees a slower response|Cardinality replaces every latency measurement|Only the report filename can affect comparability|Different datasets may exercise different cache and query behavior.|Algorithm and environment also matter.|Observed behavior still needs measurement.|Filenames do not establish equal work.",
      "Baseline p95 is 200 ms and candidate p95 is 230 ms. What is relative increase?|15 percent|30 percent|13.04 percent|115 percent|The increase is 30 ms over a 200 ms baseline; 30/200=0.15 or 15 percent.|Thirty is the millisecond difference.|That uses the candidate as denominator.|One hundred fifteen percent is the ratio, not the increase.",
      "Two instances publish their p95 values. What is unsafe as a fleet p95 calculation?|Taking their simple arithmetic average|Combining compatible underlying observations|Using shared compatible histogram counts for an approximate percentile|Preserving both instance percentiles without claiming a fleet percentile|Percentiles are not generally composable by averaging.|Underlying observations can be pooled correctly.|Compatible histograms support an explicit approximation.|Separate reporting makes no unsupported fleet claim.",
      "A small run observes zero failures. What conclusion is supported?|No failures were observed in that sample|The true failure probability is exactly zero|Every possible load condition was tested|The service can run indefinitely without failure|The observation is bounded by sample and scope.|Finite samples do not prove zero probability.|Only the tested condition was observed.|Duration remains finite.",
      "A load report drops timeouts before computing success rate. What must be examined?|Whether eligible failed attempts were omitted from the denominator|Whether a lower mean proves the omitted operations succeeded|Whether a shorter report automatically improves accuracy|Whether all timeouts can be relabeled as warmup|Omissions can bias both reliability and latency interpretation.|Mean latency is not their success evidence.|Presentation length is unrelated.|Warmup exclusions must be defined prospectively."
    ],
    "formal": [
      "What makes a release gate reviewable?|Limit, population, boundary and method|Only candidate name and approval date|Only the preferred target percentage|Only the most favorable response time|Review requires a clear contract and evidence provenance.|A candidate label and date omit the gate’s measured condition.|A preferred target alone omits population and method.|A selected response does not establish the required distribution.",
      "Why distinguish mandatory gates from diagnostic metrics?|An informative trend need not be an approval condition|Every recorded metric must automatically block delivery|Diagnostics can replace failed durability requirements|Only mandatory metrics can reveal defects|Their roles differ under the declared decision contract.|Some metrics guide investigation.|A trend does not cancel an invariant.|Diagnostic evidence can reveal failures.",
      "What is a useful next experiment after a noncomparable speedup?|Repeat under matched workload, data and method|Delete the slower baseline permanently|Select only the fastest candidate response|Change both workload and environment again without recording them|Matching the relevant conditions addresses the comparison uncertainty.|Deleting evidence does not resolve it.|One favorable response does not characterize the run.|More uncontrolled changes preserve ambiguity.",
      "A gate allows<=10 percent p95 regression from 200 ms. Candidate p95 is 225 ms. What follows?|12.5 percent regression, so fail|10 percent regression, so pass exactly|25 percent regression, so fail by 15 points|11.11 percent regression using the required baseline denominator|25/200=.125 and the limit is 220 ms.|225 is above 220.|Twenty-five is the millisecond increase.|That uses 225 as denominator.",
      "A candidate has 0.4 percent error versus a 0.5 percent maximum, p95=230 ms versus 220 ms maximum, and no lost writes. Which independent conditions fail?|Only p95|Only error rate|Only durability|All three|The error and durability limits pass; 230 exceeds 220.|.4 is below.5.|No lost writes meets the stated invariant.|Two conditions pass.",
      "The baseline uses 1 million rows and the candidate uses 1000 with a warm cache. Which plan best tests an optimization claim?|Match data, workload and cache policy|Select each run’s fastest response only|Accept the candidate’s smaller dataset|Treat cache warmth as irrelevant noise|Matched work and cache conditions remove leading confounders.|Selecting fastest observations biases the comparison.|A smaller dataset changes the exercised work.|Cache state can materially change latency and must be controlled or disclosed.",
      "Region Ahas 90 requests at 10 ms and 10 at 1000 ms; region Bhas 100 requests at 20 ms. Using nearest-rank p95, what is the pooled p95?|20 ms|510 ms|1000 ms|15 ms|Of 200 values, 90 are 10 ms, 100 are 20 ms and 10 are 1000 ms; rank 190 is 20 ms.|That averages the separate regional p95 values 1000 and 20.|The 1000 ms tail begins at rank 191.|Fifteen averages unrelated low values.",
      "A candidate reports faster latency after skipping validation, while the contract requires the validation before success. Which interpretation is defensible?|The run no longer exercises the required successful operation|The optimization passes because fewer instructions ran|Validation can be silently removed from eligibility after the run|A faster incomplete path proves equivalent business correctness|Equivalent work is part of the comparison contract.|Speed does not establish preserved behavior.|Post-result redefinition hides missing work.|The path omitted a required condition.",
      "A test has 1000 eligible requests, 990 successes and 10 timeouts. A report computes mean latency only for successes. Which additional evidence is essential for the gate?|Timeout count and eligibility rule|A fabricated 0 msduration for timeouts|Success rate after excluding all timeouts|Another copy of the success-only mean|Conditional latency omits unsuccessful user outcomes.|A timeout does not have an observed zero-duration successful response.|The report must not silently remove eligible failures.|Another success-only mean still omits timeout outcomes.",
      "A release requiresp 95<=250 ms, errors<=1 percent and a representative 100000-row dataset. Results are 240 ms, 0.8 percent and 1000 rows. Which next action satisfies the evidence gap?|Rerun with the required dataset|Pass based only on latency and errors|Multiply latency by dataset-size ratio|Remove the data requirement after testing|The outcome bounds passed under a dataset that missed a stated condition.|The representative-data condition remains unmet.|Runtime need not scale linearly with row count.|Removing a requirement afterward does not supply missing evidence."
    ]
  }
];
module.exports=build("performance-quality-engineering",units,[
  {
    "id": "pq-objectives",
    "title": "Google SRE Book: Service-Level Objectives",
    "url": "https://sre.google/sre-book/service-level-objectives/",
    "source": {
      "repo": "google/official-documentation-snapshots",
      "kind": "official-http-snapshot",
      "path": "objectives.html",
      "url": "https://sre.google/sre-book/service-level-objectives/",
      "http_status": 200,
      "sha256": "60851ff3487eef695bb59143b5123a79af081091ce8bf2909ad83ad924438365",
      "fetched_at": "2026-11-10T14:54:59.817539+00:00",
      "verification": "Retained official HTTPS 200 bytes matched SHA256 capture metadata. Edition: Google SRE Book or Workbook online snapshot at the stated capture time; this is not an immutable Git release. Synthetic examples execute arithmetic and rule fixtures only; they do not run real workload generation, fault injection or production rollout."
    }
  },
  {
    "id": "pq-incidents",
    "title": "Google SRE Book: Managing Incidents",
    "url": "https://sre.google/sre-book/managing-incidents/",
    "source": {
      "repo": "google/official-documentation-snapshots",
      "kind": "official-http-snapshot",
      "path": "incidents.html",
      "url": "https://sre.google/sre-book/managing-incidents/",
      "http_status": 200,
      "sha256": "7f50d2472877739e24f2bb31de56d68ca46521463232ce58125fc2d4ea8583cb",
      "fetched_at": "2026-11-10T14:55:00.255604+00:00",
      "verification": "Retained official HTTPS 200 bytes matched SHA256 capture metadata. Edition: Google SRE Book or Workbook online snapshot at the stated capture time; this is not an immutable Git release. Synthetic examples execute arithmetic and rule fixtures only; they do not run real workload generation, fault injection or production rollout."
    }
  },
  {
    "id": "pq-postmortem",
    "title": "Google SRE Book: Postmortem Culture",
    "url": "https://sre.google/sre-book/postmortem-culture/",
    "source": {
      "repo": "google/official-documentation-snapshots",
      "kind": "official-http-snapshot",
      "path": "postmortem.html",
      "url": "https://sre.google/sre-book/postmortem-culture/",
      "http_status": 200,
      "sha256": "ef876f0a0f09a88f3acc3294ec24eb922751b0059cba8be271aa6fe8474656c5",
      "fetched_at": "2026-11-10T14:55:00.494905+00:00",
      "verification": "Retained official HTTPS 200 bytes matched SHA256 capture metadata. Edition: Google SRE Book or Workbook online snapshot at the stated capture time; this is not an immutable Git release. Synthetic examples execute arithmetic and rule fixtures only; they do not run real workload generation, fault injection or production rollout."
    }
  },
  {
    "id": "pq-canarying-releases",
    "title": "Google SRE Workbook: Canarying Releases",
    "url": "https://sre.google/workbook/canarying-releases/",
    "source": {
      "repo": "google/official-documentation-snapshots",
      "kind": "official-http-snapshot",
      "path": "canarying-releases.html",
      "url": "https://sre.google/workbook/canarying-releases/",
      "http_status": 200,
      "sha256": "2129ec6fefdb7807073a7877344e7f0409c27e4fde1021d30114a38338fd039f",
      "fetched_at": "2026-11-11T10:18:57.435364+00:00",
      "verification": "Retained official HTTPS 200 bytes matched SHA256 capture metadata. Edition: Google SRE Book or Workbook online snapshot at the stated capture time; this is not an immutable Git release. Synthetic examples execute arithmetic and rule fixtures only; they do not run real workload generation, fault injection or production rollout."
    }
  },
  {
    "id": "pq-testing-reliability",
    "title": "Google SRE Book: Testing for Reliability",
    "url": "https://sre.google/sre-book/testing-reliability/",
    "source": {
      "repo": "google/official-documentation-snapshots",
      "kind": "official-http-snapshot",
      "path": "testing-reliability.html",
      "url": "https://sre.google/sre-book/testing-reliability/",
      "http_status": 200,
      "sha256": "090d12e171de30b49c4228c54314af1f95e021c00270adcff0e5d5609c8e4c2e",
      "fetched_at": "2026-11-11T15:13:32.472894+00:00",
      "verification": "Official HTTPS 200 response bytes retained with SHA256 and capture timestamp. Google SRE Book online chapter snapshot, not an immutable Git version. The course uses bounded arithmetic and rule fixtures, not a live resilience framework or production test."
    }
  },
  {
    "id": "pq-handling-overload",
    "title": "Google SRE Book: Handling Overload",
    "url": "https://sre.google/sre-book/handling-overload/",
    "source": {
      "repo": "google/official-documentation-snapshots",
      "kind": "official-http-snapshot",
      "path": "handling-overload.html",
      "url": "https://sre.google/sre-book/handling-overload/",
      "http_status": 200,
      "sha256": "945d15db67ad15a7f5e75833f8c0d014c8dc61d57909f7a3abd48459ad12cc9e",
      "fetched_at": "2026-11-11T15:13:32.616419+00:00",
      "verification": "Official HTTPS 200 response bytes retained with SHA256 and capture timestamp. Google SRE Book online chapter snapshot, not an immutable Git version. The course uses bounded arithmetic and rule fixtures, not a live resilience framework or production test."
    }
  },
  {
    "id": "pq-addressing-cascading-failures",
    "title": "Google SRE Book: Addressing Cascading Failures",
    "url": "https://sre.google/sre-book/addressing-cascading-failures/",
    "source": {
      "repo": "google/official-documentation-snapshots",
      "kind": "official-http-snapshot",
      "path": "addressing-cascading-failures.html",
      "url": "https://sre.google/sre-book/addressing-cascading-failures/",
      "http_status": 200,
      "sha256": "d67024d52d72a1254c830d3c29e6d1b2afade88e133ffcff64b94711c2aaa11a",
      "fetched_at": "2026-11-11T15:13:32.856756+00:00",
      "verification": "Official HTTPS 200 response bytes retained with SHA256 and capture timestamp. Google SRE Book online chapter snapshot, not an immutable Git version. The course uses bounded arithmetic and rule fixtures, not a live resilience framework or production test."
    }
  },
  {
    "id": "pq-histograms",
    "title": "Prometheus documentation: Histograms and Summaries",
    "url": "https://github.com/prometheus/docs/blob/cc0672badce86173b9afaa95a59904576bcd6d6a/docs/practices/histograms.md",
    "source": {
      "repo": "prometheus/docs",
      "commit": "cc0672badce86173b9afaa95a59904576bcd6d6a",
      "path": "docs/practices/histograms.md",
      "verification": "Official documentation bytes inspected at this immutable Git revision. The local worked examples do not launch Prometheus, collect real histograms or measure production timings."
    }
  },
  {
    "id": "pq-instrumentation",
    "title": "Prometheus documentation: Instrumentation",
    "url": "https://github.com/prometheus/docs/blob/cc0672badce86173b9afaa95a59904576bcd6d6a/docs/practices/instrumentation.md",
    "source": {
      "repo": "prometheus/docs",
      "commit": "cc0672badce86173b9afaa95a59904576bcd6d6a",
      "path": "docs/practices/instrumentation.md",
      "verification": "Official documentation bytes inspected at this immutable Git revision. The local worked examples do not launch Prometheus, collect real histograms or measure production timings."
    }
  }
]);
