'use strict';
const {bank}=require('../../learning/wave1/ai-helper');
module.exports=bank('vector-databases',[
  {
    "comp": "m1.c1",
    "rows": [
      [
        "Which requirement concerns durability rather than neighbor ranking?",
        "Recovery after process loss",
        "Cosine score ordering",
        "Query vector normalization",
        "Candidate similarity ties",
        "Durability concerns retained and recoverable state; ranking defines which records are near a query.",
        "“Cosine score ordering” does not satisfy this requirement. Durability concerns retained and recoverable state; ranking defines which records are near a query.",
        "“Query vector normalization” does not satisfy this requirement. Durability concerns retained and recoverable state; ranking defines which records are near a query.",
        "“Candidate similarity ties” does not satisfy this requirement. Durability concerns retained and recoverable state; ranking defines which records are near a query."
      ],
      [
        "What information is needed to estimate raw float32 vector payload?",
        "Count and dimensions",
        "Query text alone",
        "Index build timestamp",
        "Number of access roles",
        "Payload is count times dimensions times four bytes, before index and metadata overhead.",
        "“Query text alone” does not satisfy this requirement. Payload is count times dimensions times four bytes, before index and metadata overhead.",
        "“Index build timestamp” does not satisfy this requirement. Payload is count times dimensions times four bytes, before index and metadata overhead.",
        "“Number of access roles” does not satisfy this requirement. Payload is count times dimensions times four bytes, before index and metadata overhead."
      ],
      [
        "Which constraint can exclude a hosted vector service before relevance testing?",
        "Required data residency",
        "Preferred variable names",
        "Query punctuation",
        "Document title capitalization",
        "Hard location and handling requirements are eligibility constraints regardless of retrieval quality.",
        "“Preferred variable names” does not satisfy this requirement. Hard location and handling requirements are eligibility constraints regardless of retrieval quality.",
        "“Query punctuation” does not satisfy this requirement. Hard location and handling requirements are eligibility constraints regardless of retrieval quality.",
        "“Document title capitalization” does not satisfy this requirement. Hard location and handling requirements are eligibility constraints regardless of retrieval quality."
      ],
      [
        "A clinic needs row-level permissions and transactional source updates alongside vectors. Which comparison is most useful?",
        "Integration with its relational controls",
        "Maximum unfiltered benchmark QPS only",
        "The newest embedding leaderboard only",
        "The shortest service name",
        "Co-located relational capabilities may suit these requirements, but the actual extension and queries still need validation.",
        "“Maximum unfiltered benchmark QPS only” does not satisfy this requirement. Co-located relational capabilities may suit these requirements, but the actual extension and queries still need validation.",
        "“The newest embedding leaderboard only” does not satisfy this requirement. Co-located relational capabilities may suit these requirements, but the actual extension and queries still need validation.",
        "“The shortest service name” does not satisfy this requirement. Co-located relational capabilities may suit these requirements, but the actual extension and queries still need validation."
      ],
      [
        "A desktop prototype uses an in-memory neighbor library. What must be designed before a recoverable shared service exists?",
        "Persistence and serving operations",
        "A longer query string",
        "A different distance symbol",
        "More descriptive variable names",
        "A numeric library alone does not establish persistence, recovery, authorization or a reliable service boundary.",
        "“A longer query string” does not satisfy this requirement. A numeric library alone does not establish persistence, recovery, authorization or a reliable service boundary.",
        "“A different distance symbol” does not satisfy this requirement. A numeric library alone does not establish persistence, recovery, authorization or a reliable service boundary.",
        "“More descriptive variable names” does not satisfy this requirement. A numeric library alone does not establish persistence, recovery, authorization or a reliable service boundary."
      ],
      [
        "An enterprise expects frequent corrections and deletes. Which benchmark best represents its choice?",
        "Mixed updates and filtered queries",
        "Read-only random vectors only",
        "One query after a clean restart",
        "A static vendor screenshot",
        "A representative benchmark includes the mutation and filter patterns that can change cost, latency and results.",
        "“Read-only random vectors only” does not satisfy this requirement. A representative benchmark includes the mutation and filter patterns that can change cost, latency and results.",
        "“One query after a clean restart” does not satisfy this requirement. A representative benchmark includes the mutation and filter patterns that can change cost, latency and results.",
        "“A static vendor screenshot” does not satisfy this requirement. A representative benchmark includes the mutation and filter patterns that can change cost, latency and results."
      ],
      [
        "A team sizes 2 million 384-dimensional float32 vectors. Which capacity conclusion is defensible?",
        "Raw payload is about 3.072 GB decimal",
        "The full service fits exactly 3.072 GB",
        "Indexes require zero additional space",
        "Replication has no storage impact",
        "The arithmetic estimates numeric payload; indexes, metadata, replicas and runtime overhead remain separate.",
        "“The full service fits exactly 3.072 GB” does not satisfy this requirement. The arithmetic estimates numeric payload; indexes, metadata, replicas and runtime overhead remain separate.",
        "“Indexes require zero additional space” does not satisfy this requirement. The arithmetic estimates numeric payload; indexes, metadata, replicas and runtime overhead remain separate.",
        "“Replication has no storage impact” does not satisfy this requirement. The arithmetic estimates numeric payload; indexes, metadata, replicas and runtime overhead remain separate."
      ],
      [
        "A managed service reduces operational work but exceeds a fixed monthly budget at measured load. What should selection do?",
        "Apply cost and reliability limits",
        "Ignore cost after measuring recall",
        "Assume serverless means free",
        "Choose solely by storage dimension",
        "A valid choice must meet the declared operating and cost requirements together, using measured assumptions.",
        "“Ignore cost after measuring recall” does not satisfy this requirement. A valid choice must meet the declared operating and cost requirements together, using measured assumptions.",
        "“Assume serverless means free” does not satisfy this requirement. A valid choice must meet the declared operating and cost requirements together, using measured assumptions.",
        "“Choose solely by storage dimension” does not satisfy this requirement. A valid choice must meet the declared operating and cost requirements together, using measured assumptions."
      ],
      [
        "An offline benchmark omits the private metadata column used on every request. What remains uncertain?",
        "Filtered production retrieval behavior",
        "The benchmark file's existence",
        "The declared vector dimensions",
        "The arithmetic of its recorded mean",
        "A different filter distribution can affect retrieval coverage and execution behavior, so the benchmark may not transfer.",
        "“The benchmark file's existence” does not satisfy this requirement. A different filter distribution can affect retrieval coverage and execution behavior, so the benchmark may not transfer.",
        "“The declared vector dimensions” does not satisfy this requirement. A different filter distribution can affect retrieval coverage and execution behavior, so the benchmark may not transfer.",
        "“The arithmetic of its recorded mean” does not satisfy this requirement. A different filter distribution can affect retrieval coverage and execution behavior, so the benchmark may not transfer."
      ],
      [
        "A procurement panel compares a search library, extension and service. Which acceptance evidence is strongest?",
        "Workload and operations evidence",
        "A shared label saying vector database",
        "A count of marketing features alone",
        "A claim that all ANN engines are equivalent",
        "A concrete workload and explicit operating guarantees distinguish numeric search from the complete required system.",
        "“A shared label saying vector database” does not satisfy this requirement. A concrete workload and explicit operating guarantees distinguish numeric search from the complete required system.",
        "“A count of marketing features alone” does not satisfy this requirement. A concrete workload and explicit operating guarantees distinguish numeric search from the complete required system.",
        "“A claim that all ANN engines are equivalent” does not satisfy this requirement. A concrete workload and explicit operating guarantees distinguish numeric search from the complete required system."
      ]
    ]
  },
  {
    "comp": "m1.c2",
    "rows": [
      [
        "What does nearest-neighbor recall measure when an exact baseline is available?",
        "Overlap with exact neighbors",
        "Whether facts are up to date",
        "Whether users have permission",
        "Whether text supports an answer",
        "ANN recall evaluates geometric candidate recovery, a different concern from semantic relevance and authorization.",
        "“Whether facts are up to date” does not satisfy this requirement. ANN recall evaluates geometric candidate recovery, a different concern from semantic relevance and authorization.",
        "“Whether users have permission” does not satisfy this requirement. ANN recall evaluates geometric candidate recovery, a different concern from semantic relevance and authorization.",
        "“Whether text supports an answer” does not satisfy this requirement. ANN recall evaluates geometric candidate recovery, a different concern from semantic relevance and authorization."
      ],
      [
        "What property distinguishes exhaustive exact search from ANN?",
        "Exhaustive evaluation",
        "It ignores the metric",
        "It guarantees useful prose",
        "It never consumes compute",
        "Exact search evaluates the specified metric over every eligible vector; this does not guarantee task relevance.",
        "“It ignores the metric” does not satisfy this requirement. Exact search evaluates the specified metric over every eligible vector; this does not guarantee task relevance.",
        "“It guarantees useful prose” does not satisfy this requirement. Exact search evaluates the specified metric over every eligible vector; this does not guarantee task relevance.",
        "“It never consumes compute” does not satisfy this requirement. Exact search evaluates the specified metric over every eligible vector; this does not guarantee task relevance."
      ],
      [
        "What is required for a fair exact-versus-ANN comparison?",
        "Matched metric and corpus",
        "Different embedding spaces",
        "Different tenant permissions",
        "Unrelated query samples",
        "Different metrics or populations confound approximation quality with changes in the retrieval problem.",
        "“Different embedding spaces” does not satisfy this requirement. Different metrics or populations confound approximation quality with changes in the retrieval problem.",
        "“Different tenant permissions” does not satisfy this requirement. Different metrics or populations confound approximation quality with changes in the retrieval problem.",
        "“Unrelated query samples” does not satisfy this requirement. Different metrics or populations confound approximation quality with changes in the retrieval problem."
      ],
      [
        "A test has exact top four A B C D and ANN results B C E F. What is recall at four against that baseline?",
        "0.5",
        "0.25",
        "0.75",
        "1.0",
        "Two of four exact neighbors were recovered, giving overlap recall of two divided by four.",
        "“0.25” does not satisfy this requirement. Two of four exact neighbors were recovered, giving overlap recall of two divided by four.",
        "“0.75” does not satisfy this requirement. Two of four exact neighbors were recovered, giving overlap recall of two divided by four.",
        "“1.0” does not satisfy this requirement. Two of four exact neighbors were recovered, giving overlap recall of two divided by four."
      ],
      [
        "A team raises search effort and recovers more exact neighbors at greater latency. How should it decide?",
        "Compare quality and latency targets",
        "Maximize effort regardless of SLO",
        "Choose the smallest parameter blindly",
        "Call the old index mathematically invalid",
        "Search effort is a tunable tradeoff; acceptance depends on the measured workload and product requirements.",
        "“Maximize effort regardless of SLO” does not satisfy this requirement. Search effort is a tunable tradeoff; acceptance depends on the measured workload and product requirements.",
        "“Choose the smallest parameter blindly” does not satisfy this requirement. Search effort is a tunable tradeoff; acceptance depends on the measured workload and product requirements.",
        "“Call the old index mathematically invalid” does not satisfy this requirement. Search effort is a tunable tradeoff; acceptance depends on the measured workload and product requirements."
      ],
      [
        "A semantic result is irrelevant even though ANN exactly matches exhaustive cosine search. Which diagnosis fits?",
        "Representation or task relevance issue",
        "Approximation miss is established",
        "Authorization must be broken",
        "The exact comparator is impossible",
        "Matching geometric results rules out this observed miss being caused by approximation; task relevance needs separate investigation.",
        "“Approximation miss is established” does not satisfy this requirement. Matching geometric results rules out this observed miss being caused by approximation; task relevance needs separate investigation.",
        "“Authorization must be broken” does not satisfy this requirement. Matching geometric results rules out this observed miss being caused by approximation; task relevance needs separate investigation.",
        "“The exact comparator is impossible” does not satisfy this requirement. Matching geometric results rules out this observed miss being caused by approximation; task relevance needs separate investigation."
      ],
      [
        "Two methods disagree only among equal-distance candidates at the cutoff. What should evaluation specify?",
        "A declared tie policy",
        "A new permission system",
        "A mandatory source deletion",
        "A longer generation prompt",
        "Ties can change ids without changing distances; a declared policy makes baseline comparisons interpretable.",
        "“A new permission system” does not satisfy this requirement. Ties can change ids without changing distances; a declared policy makes baseline comparisons interpretable.",
        "“A mandatory source deletion” does not satisfy this requirement. Ties can change ids without changing distances; a declared policy makes baseline comparisons interpretable.",
        "“A longer generation prompt” does not satisfy this requirement. Ties can change ids without changing distances; a declared policy makes baseline comparisons interpretable."
      ],
      [
        "A launch report shows mean ANN recall of 0.96. One small tenant has recall 0.30. What is warranted?",
        "Inspect segment quality",
        "Declare every tenant meets 0.96",
        "Delete the small tenant's queries",
        "Replace recall with vector count",
        "An aggregate can hide important failures in filtered segments; acceptance must reflect actual user populations.",
        "“Declare every tenant meets 0.96” does not satisfy this requirement. An aggregate can hide important failures in filtered segments; acceptance must reflect actual user populations.",
        "“Delete the small tenant's queries” does not satisfy this requirement. An aggregate can hide important failures in filtered segments; acceptance must reflect actual user populations.",
        "“Replace recall with vector count” does not satisfy this requirement. An aggregate can hide important failures in filtered segments; acceptance must reflect actual user populations."
      ],
      [
        "A measured exact baseline uses yesterday's vectors while ANN uses today's updates. What is confounded?",
        "Corpus drift with approximation",
        "Option order with distance",
        "API naming with tenancy",
        "UI layout with normalization",
        "A comparison requires aligned corpus versions; otherwise changed neighbors need not result from approximate search.",
        "“Option order with distance” does not satisfy this requirement. A comparison requires aligned corpus versions; otherwise changed neighbors need not result from approximate search.",
        "“API naming with tenancy” does not satisfy this requirement. A comparison requires aligned corpus versions; otherwise changed neighbors need not result from approximate search.",
        "“UI layout with normalization” does not satisfy this requirement. A comparison requires aligned corpus versions; otherwise changed neighbors need not result from approximate search."
      ],
      [
        "An approximate index misses a safety policy in one measured query. Which claim can the evidence support?",
        "An observed neighbor miss",
        "Every ANN index must fail equally",
        "A larger model necessarily fixes it",
        "The missed policy was unauthorized",
        "One observed miss establishes behavior of that test, not a universal algorithmic or permission conclusion.",
        "“Every ANN index must fail equally” does not satisfy this requirement. One observed miss establishes behavior of that test, not a universal algorithmic or permission conclusion.",
        "“A larger model necessarily fixes it” does not satisfy this requirement. One observed miss establishes behavior of that test, not a universal algorithmic or permission conclusion.",
        "“The missed policy was unauthorized” does not satisfy this requirement. One observed miss establishes behavior of that test, not a universal algorithmic or permission conclusion."
      ]
    ]
  },
  {
    "comp": "m1.c2",
    "rows": [
      [
        "Which structure is characteristic of HNSW?",
        "A navigable graph",
        "Only a sorted text index",
        "Only relational foreign keys",
        "A generation token cache",
        "HNSW searches a graph structure; its construction and search settings govern different tradeoffs.",
        "“Only a sorted text index” does not satisfy this requirement. HNSW searches a graph structure; its construction and search settings govern different tradeoffs.",
        "“Only relational foreign keys” does not satisfy this requirement. HNSW searches a graph structure; its construction and search settings govern different tradeoffs.",
        "“A generation token cache” does not satisfy this requirement. HNSW searches a graph structure; its construction and search settings govern different tradeoffs."
      ],
      [
        "What does IVFFlat use to organize candidate search?",
        "Lists of grouped vectors",
        "Only document timestamps",
        "A source permission hierarchy",
        "A language-model prompt chain",
        "IVFFlat partitions vectors into lists and searches selected lists before ranking candidates.",
        "“Only document timestamps” does not satisfy this requirement. IVFFlat partitions vectors into lists and searches selected lists before ranking candidates.",
        "“A source permission hierarchy” does not satisfy this requirement. IVFFlat partitions vectors into lists and searches selected lists before ranking candidates.",
        "“A language-model prompt chain” does not satisfy this requirement. IVFFlat partitions vectors into lists and searches selected lists before ranking candidates."
      ],
      [
        "Why does an index distance operator need to match its intended metric?",
        "Index support is metric-specific",
        "All metrics have identical ordering",
        "Operator choice grants access",
        "Dimensions automatically select permissions",
        "The query operator and index operator class need a compatible contract; metric names are not interchangeable.",
        "“All metrics have identical ordering” does not satisfy this requirement. The query operator and index operator class need a compatible contract; metric names are not interchangeable.",
        "“Operator choice grants access” does not satisfy this requirement. The query operator and index operator class need a compatible contract; metric names are not interchangeable.",
        "“Dimensions automatically select permissions” does not satisfy this requirement. The query operator and index operator class need a compatible contract; metric names are not interchangeable."
      ],
      [
        "A pgvector team builds IVFFlat before representative data exists. What should it revisit?",
        "Training and list choices",
        "Only response formatting",
        "Only the service logo",
        "Only query capitalization",
        "IVFFlat grouping depends on representative data and list choices, so early builds can be unsuitable as data grows.",
        "“Only response formatting” does not satisfy this requirement. IVFFlat grouping depends on representative data and list choices, so early builds can be unsuitable as data grows.",
        "“Only the service logo” does not satisfy this requirement. IVFFlat grouping depends on representative data and list choices, so early builds can be unsuitable as data grows.",
        "“Only query capitalization” does not satisfy this requirement. IVFFlat grouping depends on representative data and list choices, so early builds can be unsuitable as data grows."
      ],
      [
        "A graph index meets latency targets but exhausts the memory budget during growth. What must change in evaluation?",
        "Include memory and build costs",
        "Measure latency alone again",
        "Assume persistent indexes use no RAM",
        "Discard all exact baseline evidence",
        "Query latency alone does not satisfy the operational requirements when memory and construction costs exceed limits.",
        "“Measure latency alone again” does not satisfy this requirement. Query latency alone does not satisfy the operational requirements when memory and construction costs exceed limits.",
        "“Assume persistent indexes use no RAM” does not satisfy this requirement. Query latency alone does not satisfy the operational requirements when memory and construction costs exceed limits.",
        "“Discard all exact baseline evidence” does not satisfy this requirement. Query latency alone does not satisfy the operational requirements when memory and construction costs exceed limits."
      ],
      [
        "A developer treats an HNSW construction setting as identical to its query search-effort setting. What is the correction?",
        "Build and query controls affect different stages",
        "Both settings only rename the index",
        "Construction settings enforce tenant roles",
        "Query settings rewrite stored source text",
        "Graph construction and traversal have related but distinct resource and recall effects.",
        "“Both settings only rename the index” does not satisfy this requirement. Graph construction and traversal have related but distinct resource and recall effects.",
        "“Construction settings enforce tenant roles” does not satisfy this requirement. Graph construction and traversal have related but distinct resource and recall effects.",
        "“Query settings rewrite stored source text” does not satisfy this requirement. Graph construction and traversal have related but distinct resource and recall effects."
      ],
      [
        "A filtered query returns too few rows from an ANN plan. What should the engineer investigate?",
        "Filter/candidate interaction",
        "Only the generation temperature",
        "Only source sentence length",
        "Only model token pricing",
        "Approximate candidate discovery and filter selectivity can interact; actual execution and supported settings need inspection.",
        "“Only the generation temperature” does not satisfy this requirement. Approximate candidate discovery and filter selectivity can interact; actual execution and supported settings need inspection.",
        "“Only source sentence length” does not satisfy this requirement. Approximate candidate discovery and filter selectivity can interact; actual execution and supported settings need inspection.",
        "“Only model token pricing” does not satisfy this requirement. Approximate candidate discovery and filter selectivity can interact; actual execution and supported settings need inspection."
      ],
      [
        "A database upgrade introduces a new ANN scan feature. Which rollout evidence is needed?",
        "Installed-version workload tests",
        "A tutorial for another release",
        "Assuming every earlier release has it",
        "Only a renamed connection string",
        "Available features and behavior are version-dependent; installed-version tests are stronger than generic descriptions.",
        "“A tutorial for another release” does not satisfy this requirement. Available features and behavior are version-dependent; installed-version tests are stronger than generic descriptions.",
        "“Assuming every earlier release has it” does not satisfy this requirement. Available features and behavior are version-dependent; installed-version tests are stronger than generic descriptions.",
        "“Only a renamed connection string” does not satisfy this requirement. Available features and behavior are version-dependent; installed-version tests are stronger than generic descriptions."
      ],
      [
        "A team increases IVFFlat probes until most lists are searched. What tradeoff should it expect to measure?",
        "More candidate coverage and more work",
        "Automatic zero query cost",
        "A tenant-permission bypass by design",
        "Guaranteed better human relevance",
        "Searching more lists can improve geometric coverage while increasing work; semantic usefulness remains separately evaluated.",
        "“Automatic zero query cost” does not satisfy this requirement. Searching more lists can improve geometric coverage while increasing work; semantic usefulness remains separately evaluated.",
        "“A tenant-permission bypass by design” does not satisfy this requirement. Searching more lists can improve geometric coverage while increasing work; semantic usefulness remains separately evaluated.",
        "“Guaranteed better human relevance” does not satisfy this requirement. Searching more lists can improve geometric coverage while increasing work; semantic usefulness remains separately evaluated."
      ],
      [
        "A platform must choose between HNSW and IVFFlat for changing tenant-filtered data. What is the strongest decision process?",
        "Test lifecycle and filter load",
        "Choose solely by a universal fastest claim",
        "Ignore builds and updates",
        "Assume both return identical ids always",
        "Workload-dependent recall, latency, build, memory and mutation costs are necessary to justify an index choice.",
        "“Choose solely by a universal fastest claim” does not satisfy this requirement. Workload-dependent recall, latency, build, memory and mutation costs are necessary to justify an index choice.",
        "“Ignore builds and updates” does not satisfy this requirement. Workload-dependent recall, latency, build, memory and mutation costs are necessary to justify an index choice.",
        "“Assume both return identical ids always” does not satisfy this requirement. Workload-dependent recall, latency, build, memory and mutation costs are necessary to justify an index choice."
      ]
    ]
  },
  {
    "comp": "m2.c1",
    "rows": [
      [
        "Where should a tenant scope originate?",
        "Trusted authenticated application state",
        "A tenant id invented by the model",
        "An arbitrary query string parameter alone",
        "A retrieved document's instructions",
        "Authorization scope derives from trusted identity and policy, not user-controlled content or generated text.",
        "“A tenant id invented by the model” does not satisfy this requirement. Authorization scope derives from trusted identity and policy, not user-controlled content or generated text.",
        "“An arbitrary query string parameter alone” does not satisfy this requirement. Authorization scope derives from trusted identity and policy, not user-controlled content or generated text.",
        "“A retrieved document's instructions” does not satisfy this requirement. Authorization scope derives from trusted identity and policy, not user-controlled content or generated text."
      ],
      [
        "What is the principle of least privilege in retrieval?",
        "Expose only permitted records",
        "Return every tenant for ranking",
        "Trust every matching vector",
        "Treat similarity as consent",
        "Similarity identifies candidates, whereas permission determines which candidates may be disclosed.",
        "“Return every tenant for ranking” does not satisfy this requirement. Similarity identifies candidates, whereas permission determines which candidates may be disclosed.",
        "“Trust every matching vector” does not satisfy this requirement. Similarity identifies candidates, whereas permission determines which candidates may be disclosed.",
        "“Treat similarity as consent” does not satisfy this requirement. Similarity identifies candidates, whereas permission determines which candidates may be disclosed."
      ],
      [
        "Why is a nonempty metadata tag insufficient evidence of authorization?",
        "Its value may be untrusted or stale",
        "Tags cannot store strings",
        "Metadata never affects retrieval",
        "Every tagged record is public",
        "A label has security meaning only under validated provenance and current policy enforcement.",
        "“Tags cannot store strings” does not satisfy this requirement. A label has security meaning only under validated provenance and current policy enforcement.",
        "“Metadata never affects retrieval” does not satisfy this requirement. A label has security meaning only under validated provenance and current policy enforcement.",
        "“Every tagged record is public” does not satisfy this requirement. A label has security meaning only under validated provenance and current policy enforcement."
      ],
      [
        "A user changes tenant=B in an HTTP request while authenticated for A. What must the server do?",
        "Enforce the authenticated scope",
        "Accept B because it is explicit",
        "Search both tenants then show all",
        "Let the generator decide access",
        "The server must derive and enforce authorized scope independently of attacker-controlled request fields.",
        "“Accept B because it is explicit” does not satisfy this requirement. The server must derive and enforce authorized scope independently of attacker-controlled request fields.",
        "“Search both tenants then show all” does not satisfy this requirement. The server must derive and enforce authorized scope independently of attacker-controlled request fields.",
        "“Let the generator decide access” does not satisfy this requirement. The server must derive and enforce authorized scope independently of attacker-controlled request fields."
      ],
      [
        "A global ANN top ten is filtered to tenant A and returns one item despite many eligible A records. What is the likely retrieval issue?",
        "Post-filter candidate underfill",
        "Proof that A has one record",
        "Automatic permission escalation",
        "A tokenizer vocabulary error",
        "Searching globally then filtering a small candidate set can discard most candidates and miss eligible neighbors.",
        "“Proof that A has one record” does not satisfy this requirement. Searching globally then filtering a small candidate set can discard most candidates and miss eligible neighbors.",
        "“Automatic permission escalation” does not satisfy this requirement. Searching globally then filtering a small candidate set can discard most candidates and miss eligible neighbors.",
        "“A tokenizer vocabulary error” does not satisfy this requirement. Searching globally then filtering a small candidate set can discard most candidates and miss eligible neighbors."
      ],
      [
        "A team fixes underfill by displaying rejected cross-tenant candidates. What is wrong?",
        "It sacrifices authorization for coverage",
        "It makes the metric exact",
        "It guarantees current source versions",
        "It reduces the need for testing",
        "Retrieval quality cannot be repaired by disclosing unauthorized records; candidate search must preserve scope.",
        "“It makes the metric exact” does not satisfy this requirement. Retrieval quality cannot be repaired by disclosing unauthorized records; candidate search must preserve scope.",
        "“It guarantees current source versions” does not satisfy this requirement. Retrieval quality cannot be repaired by disclosing unauthorized records; candidate search must preserve scope.",
        "“It reduces the need for testing” does not satisfy this requirement. Retrieval quality cannot be repaired by disclosing unauthorized records; candidate search must preserve scope."
      ],
      [
        "A source moves from public to restricted during a request. What should serving consider?",
        "Current access before disclosure",
        "Only the access flag at ingestion forever",
        "Only the query's initial spelling",
        "Only the cached cosine score",
        "Access can change after indexing; serving and cache policies must honor current authorization requirements.",
        "“Only the access flag at ingestion forever” does not satisfy this requirement. Access can change after indexing; serving and cache policies must honor current authorization requirements.",
        "“Only the query's initial spelling” does not satisfy this requirement. Access can change after indexing; serving and cache policies must honor current authorization requirements.",
        "“Only the cached cosine score” does not satisfy this requirement. Access can change after indexing; serving and cache policies must honor current authorization requirements."
      ],
      [
        "A retrieval test checks positive access but never denied access. What coverage is missing?",
        "Negative isolation cases",
        "Vector dimension arithmetic",
        "Prompt token counting",
        "Source title formatting",
        "Authorization tests must also establish that forbidden records do not leak through result, detail and cache paths.",
        "“Vector dimension arithmetic” does not satisfy this requirement. Authorization tests must also establish that forbidden records do not leak through result, detail and cache paths.",
        "“Prompt token counting” does not satisfy this requirement. Authorization tests must also establish that forbidden records do not leak through result, detail and cache paths.",
        "“Source title formatting” does not satisfy this requirement. Authorization tests must also establish that forbidden records do not leak through result, detail and cache paths."
      ],
      [
        "A permissions service is unavailable and scope cannot be established. Which default is appropriate for private retrieval?",
        "Deny private retrieval",
        "Search all tenants temporarily",
        "Trust the most similar document",
        "Grant the previous user's scope",
        "Failing open exposes private data; an unavailable authority must not silently broaden access.",
        "“Search all tenants temporarily” does not satisfy this requirement. Failing open exposes private data; an unavailable authority must not silently broaden access.",
        "“Trust the most similar document” does not satisfy this requirement. Failing open exposes private data; an unavailable authority must not silently broaden access.",
        "“Grant the previous user's scope” does not satisfy this requirement. Failing open exposes private data; an unavailable authority must not silently broaden access."
      ],
      [
        "A proposed fix puts tenant instructions only in the generation prompt. What boundary is still unprotected?",
        "The data access boundary",
        "Only sentence grammar",
        "Only vector arithmetic",
        "Only answer length",
        "A prompt cannot prevent unauthorized context from already being fetched, logged or sent to a model.",
        "“Only sentence grammar” does not satisfy this requirement. A prompt cannot prevent unauthorized context from already being fetched, logged or sent to a model.",
        "“Only vector arithmetic” does not satisfy this requirement. A prompt cannot prevent unauthorized context from already being fetched, logged or sent to a model.",
        "“Only answer length” does not satisfy this requirement. A prompt cannot prevent unauthorized context from already being fetched, logged or sent to a model."
      ]
    ]
  },
  {
    "comp": "m2.c1",
    "rows": [
      [
        "What should a metadata schema define for access labels?",
        "Types and missing-value behavior",
        "Only a pretty field name",
        "Only response punctuation",
        "Only vector compression level",
        "Explicit types, required fields and handling of absent values prevent ambiguous access and filter interpretation.",
        "“Only a pretty field name” does not satisfy this requirement. Explicit types, required fields and handling of absent values prevent ambiguous access and filter interpretation.",
        "“Only response punctuation” does not satisfy this requirement. Explicit types, required fields and handling of absent values prevent ambiguous access and filter interpretation.",
        "“Only vector compression level” does not satisfy this requirement. Explicit types, required fields and handling of absent values prevent ambiguous access and filter interpretation."
      ],
      [
        "Why distinguish source id from chunk id?",
        "One source can own many chunks",
        "Every chunk is a new tenant",
        "Chunk ids are access tokens",
        "Source ids imply public permission",
        "Stable source ownership supports complete update and delete operations over all derived chunks.",
        "“Every chunk is a new tenant” does not satisfy this requirement. Stable source ownership supports complete update and delete operations over all derived chunks.",
        "“Chunk ids are access tokens” does not satisfy this requirement. Stable source ownership supports complete update and delete operations over all derived chunks.",
        "“Source ids imply public permission” does not satisfy this requirement. Stable source ownership supports complete update and delete operations over all derived chunks."
      ],
      [
        "What does fail-closed handling of a missing tenant field mean?",
        "Exclude it from private retrieval",
        "Assign it to every tenant",
        "Infer access from similarity",
        "Copy the requesting tenant automatically",
        "An absent authorization label must not silently grant access to private content.",
        "“Assign it to every tenant” does not satisfy this requirement. An absent authorization label must not silently grant access to private content.",
        "“Infer access from similarity” does not satisfy this requirement. An absent authorization label must not silently grant access to private content.",
        "“Copy the requesting tenant automatically” does not satisfy this requirement. An absent authorization label must not silently grant access to private content."
      ],
      [
        "An ingestion job writes tenant as number 12 while queries use string 12. What should be checked?",
        "Metadata type consistency",
        "Only the generation model size",
        "Only the source title",
        "Only the page margin",
        "Type mismatches can cause empty or unexpected matches; consistent validated metadata is required.",
        "“Only the generation model size” does not satisfy this requirement. Type mismatches can cause empty or unexpected matches; consistent validated metadata is required.",
        "“Only the source title” does not satisfy this requirement. Type mismatches can cause empty or unexpected matches; consistent validated metadata is required.",
        "“Only the page margin” does not satisfy this requirement. Type mismatches can cause empty or unexpected matches; consistent validated metadata is required."
      ],
      [
        "A customer folder is renamed but its ownership must remain stable. Which identifier design helps?",
        "Stable ids separate from display names",
        "Use folder title as the sole access key",
        "Assign ownership from title keywords",
        "Remove ownership on every rename",
        "Stable ids preserve identity while mutable display labels change; access should not depend on incidental names.",
        "“Use folder title as the sole access key” does not satisfy this requirement. Stable ids preserve identity while mutable display labels change; access should not depend on incidental names.",
        "“Assign ownership from title keywords” does not satisfy this requirement. Stable ids preserve identity while mutable display labels change; access should not depend on incidental names.",
        "“Remove ownership on every rename” does not satisfy this requirement. Stable ids preserve identity while mutable display labels change; access should not depend on incidental names."
      ],
      [
        "A pipeline assigns unknown labels to the public group to avoid errors. What is the flaw?",
        "Schema failures become disclosures",
        "Public labels always mean no access",
        "Unknown labels improve recall safely",
        "Labels can never influence exposure",
        "Defaulting malformed private metadata to public converts ingestion problems into authorization failures.",
        "“Public labels always mean no access” does not satisfy this requirement. Defaulting malformed private metadata to public converts ingestion problems into authorization failures.",
        "“Unknown labels improve recall safely” does not satisfy this requirement. Defaulting malformed private metadata to public converts ingestion problems into authorization failures.",
        "“Labels can never influence exposure” does not satisfy this requirement. Defaulting malformed private metadata to public converts ingestion problems into authorization failures."
      ],
      [
        "An engineer wants to filter by policy effective date. Which contract is needed?",
        "Date format and interval semantics",
        "Only string length equality",
        "Only answer font size",
        "Only a larger embedding dimension",
        "Comparable dates and explicit boundaries are needed to distinguish future, current and expired policies correctly.",
        "“Only string length equality” does not satisfy this requirement. Comparable dates and explicit boundaries are needed to distinguish future, current and expired policies correctly.",
        "“Only answer font size” does not satisfy this requirement. Comparable dates and explicit boundaries are needed to distinguish future, current and expired policies correctly.",
        "“Only a larger embedding dimension” does not satisfy this requirement. Comparable dates and explicit boundaries are needed to distinguish future, current and expired policies correctly."
      ],
      [
        "A document inherits access from a parent folder that later changes. What must lifecycle design handle?",
        "Current-policy propagation",
        "Only unchanged vector coordinates",
        "Only rephrasing the title",
        "Only deleting the user question",
        "Inherited rights can change without text changes, so static ingestion labels may become stale.",
        "“Only unchanged vector coordinates” does not satisfy this requirement. Inherited rights can change without text changes, so static ingestion labels may become stale.",
        "“Only rephrasing the title” does not satisfy this requirement. Inherited rights can change without text changes, so static ingestion labels may become stale.",
        "“Only deleting the user question” does not satisfy this requirement. Inherited rights can change without text changes, so static ingestion labels may become stale."
      ],
      [
        "Two tenants share the same local document id. What prevents update collisions?",
        "Tenant-scoped record ids",
        "Using only the local id globally",
        "Dropping tenant metadata after ingestion",
        "Choosing the shorter title",
        "Record identity must distinguish the owning scope; otherwise an update or delete can target another tenant's record.",
        "“Using only the local id globally” does not satisfy this requirement. Record identity must distinguish the owning scope; otherwise an update or delete can target another tenant's record.",
        "“Dropping tenant metadata after ingestion” does not satisfy this requirement. Record identity must distinguish the owning scope; otherwise an update or delete can target another tenant's record.",
        "“Choosing the shorter title” does not satisfy this requirement. Record identity must distinguish the owning scope; otherwise an update or delete can target another tenant's record."
      ],
      [
        "A migration adds a mandatory access label to old records. What is the safest transition?",
        "Validated backfill before serving",
        "Treat missing values as public indefinitely",
        "Trust top-ranked records automatically",
        "Drop every access predicate temporarily",
        "The transition needs explicit eligibility and validated backfill rather than widening access while metadata is incomplete.",
        "“Treat missing values as public indefinitely” does not satisfy this requirement. The transition needs explicit eligibility and validated backfill rather than widening access while metadata is incomplete.",
        "“Trust top-ranked records automatically” does not satisfy this requirement. The transition needs explicit eligibility and validated backfill rather than widening access while metadata is incomplete.",
        "“Drop every access predicate temporarily” does not satisfy this requirement. The transition needs explicit eligibility and validated backfill rather than widening access while metadata is incomplete."
      ]
    ]
  },
  {
    "comp": "m2.c1",
    "rows": [
      [
        "Why must result-detail access be authorized separately?",
        "Identifiers can be replayed",
        "Every id is a password",
        "Ranking permanently grants access",
        "Detail routes never expose content",
        "A user can submit or reuse a result id independently of the original authorized search request.",
        "“Every id is a password” does not satisfy this requirement. A user can submit or reuse a result id independently of the original authorized search request.",
        "“Ranking permanently grants access” does not satisfy this requirement. A user can submit or reuse a result id independently of the original authorized search request.",
        "“Detail routes never expose content” does not satisfy this requirement. A user can submit or reuse a result id independently of the original authorized search request."
      ],
      [
        "Which information belongs in a permission-aware cache key?",
        "Identity and scope version",
        "Only the question text",
        "Only the answer length",
        "Only the vector dimension",
        "Equivalent queries by different principals can have different authorized answers, so scope-sensitive reuse must be enforced.",
        "“Only the question text” does not satisfy this requirement. Equivalent queries by different principals can have different authorized answers, so scope-sensitive reuse must be enforced.",
        "“Only the answer length” does not satisfy this requirement. Equivalent queries by different principals can have different authorized answers, so scope-sensitive reuse must be enforced.",
        "“Only the vector dimension” does not satisfy this requirement. Equivalent queries by different principals can have different authorized answers, so scope-sensitive reuse must be enforced."
      ],
      [
        "Why can logs be an exposure path?",
        "They may retain retrieved private text",
        "They automatically erase sensitive content",
        "Only model outputs can be private",
        "Vector ids always anonymize sources",
        "Diagnostics can retain evidence beyond normal serving permissions; data minimization and access policy still apply.",
        "“They automatically erase sensitive content” does not satisfy this requirement. Diagnostics can retain evidence beyond normal serving permissions; data minimization and access policy still apply.",
        "“Only model outputs can be private” does not satisfy this requirement. Diagnostics can retain evidence beyond normal serving permissions; data minimization and access policy still apply.",
        "“Vector ids always anonymize sources” does not satisfy this requirement. Diagnostics can retain evidence beyond normal serving permissions; data minimization and access policy still apply."
      ],
      [
        "An employee loses access but a prior answer remains in a shared cache. Which control is needed?",
        "Cache permission checks",
        "A longer cache TTL",
        "A higher similarity threshold alone",
        "A more confident answer prompt",
        "A cache must not continue disclosing content under obsolete permissions merely because the text was once authorized.",
        "“A longer cache TTL” does not satisfy this requirement. A cache must not continue disclosing content under obsolete permissions merely because the text was once authorized.",
        "“A higher similarity threshold alone” does not satisfy this requirement. A cache must not continue disclosing content under obsolete permissions merely because the text was once authorized.",
        "“A more confident answer prompt” does not satisfy this requirement. A cache must not continue disclosing content under obsolete permissions merely because the text was once authorized."
      ],
      [
        "A result contains a citation link to a private document. What must the link endpoint enforce?",
        "Current caller access",
        "Only existence of the citation id",
        "Only the model's recommendation",
        "Access granted by any previous search",
        "Citations are references, not durable authorization grants; link resolution must enforce current policy.",
        "“Only existence of the citation id” does not satisfy this requirement. Citations are references, not durable authorization grants; link resolution must enforce current policy.",
        "“Only the model's recommendation” does not satisfy this requirement. Citations are references, not durable authorization grants; link resolution must enforce current policy.",
        "“Access granted by any previous search” does not satisfy this requirement. Citations are references, not durable authorization grants; link resolution must enforce current policy."
      ],
      [
        "A broad service credential fetches records on behalf of many users. What remains required?",
        "End-user policy enforcement",
        "Treat service access as user consent",
        "Hide only the tenant field in JSON",
        "Let the model remove private sentences",
        "A service principal's storage access does not imply every end user may receive everything it can read.",
        "“Treat service access as user consent” does not satisfy this requirement. A service principal's storage access does not imply every end user may receive everything it can read.",
        "“Hide only the tenant field in JSON” does not satisfy this requirement. A service principal's storage access does not imply every end user may receive everything it can read.",
        "“Let the model remove private sentences” does not satisfy this requirement. A service principal's storage access does not imply every end user may receive everything it can read."
      ],
      [
        "A retriever rejects private rows but includes their titles in a debug response. What is the issue?",
        "Metadata disclosure outside policy",
        "No issue because vectors are hidden",
        "Only a ranking performance problem",
        "Proof that titles are always public",
        "Titles and identifiers can reveal sensitive information even when full document text is withheld.",
        "“No issue because vectors are hidden” does not satisfy this requirement. Titles and identifiers can reveal sensitive information even when full document text is withheld.",
        "“Only a ranking performance problem” does not satisfy this requirement. Titles and identifiers can reveal sensitive information even when full document text is withheld.",
        "“Proof that titles are always public” does not satisfy this requirement. Titles and identifiers can reveal sensitive information even when full document text is withheld."
      ],
      [
        "A tenant filter is correct in search but omitted from the export endpoint. What does this show?",
        "Every path needs authorization",
        "Search filtering secures every endpoint",
        "Exports do not need access controls",
        "The vector metric is incorrect",
        "A protected search path cannot compensate for another route that exposes the same records without policy checks.",
        "“Search filtering secures every endpoint” does not satisfy this requirement. A protected search path cannot compensate for another route that exposes the same records without policy checks.",
        "“Exports do not need access controls” does not satisfy this requirement. A protected search path cannot compensate for another route that exposes the same records without policy checks.",
        "“The vector metric is incorrect” does not satisfy this requirement. A protected search path cannot compensate for another route that exposes the same records without policy checks."
      ],
      [
        "A prompt-injection string in a retrieved source says to reveal another tenant's file. Which layer prevents the fetch?",
        "Application permissions",
        "Trust the source's imperative wording",
        "A citation marker alone",
        "Only a longer context window",
        "Retrieved content is untrusted data and cannot grant application capabilities or override tenant boundaries.",
        "“Trust the source's imperative wording” does not satisfy this requirement. Retrieved content is untrusted data and cannot grant application capabilities or override tenant boundaries.",
        "“A citation marker alone” does not satisfy this requirement. Retrieved content is untrusted data and cannot grant application capabilities or override tenant boundaries.",
        "“Only a longer context window” does not satisfy this requirement. Retrieved content is untrusted data and cannot grant application capabilities or override tenant boundaries."
      ],
      [
        "A test suite uses one user and one tenant only. What additional test is most valuable?",
        "Cross-user isolation cases",
        "Only another spelling of the same query",
        "Only a different button color",
        "Only a larger synthetic vector",
        "Isolation failures often appear across principals and serving paths rather than in same-user happy paths.",
        "“Only another spelling of the same query” does not satisfy this requirement. Isolation failures often appear across principals and serving paths rather than in same-user happy paths.",
        "“Only a different button color” does not satisfy this requirement. Isolation failures often appear across principals and serving paths rather than in same-user happy paths.",
        "“Only a larger synthetic vector” does not satisfy this requirement. Isolation failures often appear across principals and serving paths rather than in same-user happy paths."
      ]
    ]
  },
  {
    "comp": "m3.c1",
    "rows": [
      [
        "Why should source versions be recorded with derived vectors?",
        "Track source freshness",
        "Automatically improve every cosine score",
        "Replace tenant authorization",
        "Eliminate all need for backups",
        "A version ties a representation to its source state so stale chunks can be identified and managed.",
        "“Automatically improve every cosine score” does not satisfy this requirement. A version ties a representation to its source state so stale chunks can be identified and managed.",
        "“Replace tenant authorization” does not satisfy this requirement. A version ties a representation to its source state so stale chunks can be identified and managed.",
        "“Eliminate all need for backups” does not satisfy this requirement. A version ties a representation to its source state so stale chunks can be identified and managed."
      ],
      [
        "What property makes repeated ingestion safe for the same intended generation?",
        "Idempotent identity and writes",
        "A random new id on every retry",
        "Dropping every source version",
        "Ignoring all previous writes",
        "Stable generation-aware operations can converge without multiplying chunks on repeated delivery.",
        "“A random new id on every retry” does not satisfy this requirement. Stable generation-aware operations can converge without multiplying chunks on repeated delivery.",
        "“Dropping every source version” does not satisfy this requirement. Stable generation-aware operations can converge without multiplying chunks on repeated delivery.",
        "“Ignoring all previous writes” does not satisfy this requirement. Stable generation-aware operations can converge without multiplying chunks on repeated delivery."
      ],
      [
        "Why is editing source text insufficient to update retrieval by itself?",
        "Derived vectors may still represent old text",
        "Text edits automatically retrain all models",
        "All stores poll every source instantly",
        "Metadata cannot record versions",
        "An index is a derived representation and needs explicit lifecycle propagation from source changes.",
        "“Text edits automatically retrain all models” does not satisfy this requirement. An index is a derived representation and needs explicit lifecycle propagation from source changes.",
        "“All stores poll every source instantly” does not satisfy this requirement. An index is a derived representation and needs explicit lifecycle propagation from source changes.",
        "“Metadata cannot record versions” does not satisfy this requirement. An index is a derived representation and needs explicit lifecycle propagation from source changes."
      ],
      [
        "A manual shrinks from six chunks to four after editing. What must the updater handle?",
        "Retire obsolete chunks",
        "Keep six old and four new chunks forever",
        "Only replace the document title",
        "Assign the extra chunks to a different tenant",
        "Updating only new chunks leaves stale text searchable; the derived population must reflect the accepted source version.",
        "“Keep six old and four new chunks forever” does not satisfy this requirement. Updating only new chunks leaves stale text searchable; the derived population must reflect the accepted source version.",
        "“Only replace the document title” does not satisfy this requirement. Updating only new chunks leaves stale text searchable; the derived population must reflect the accepted source version.",
        "“Assign the extra chunks to a different tenant” does not satisfy this requirement. Updating only new chunks leaves stale text searchable; the derived population must reflect the accepted source version."
      ],
      [
        "Version 8 ingestion finishes before delayed version 7. What should prevent regression?",
        "A source-version ordering check",
        "Last completion always wins",
        "A longer generation prompt",
        "A different similarity metric",
        "Completion time does not establish freshness; writes must reject or isolate stale generations under the version contract.",
        "“Last completion always wins” does not satisfy this requirement. Completion time does not establish freshness; writes must reject or isolate stale generations under the version contract.",
        "“A longer generation prompt” does not satisfy this requirement. Completion time does not establish freshness; writes must reject or isolate stale generations under the version contract.",
        "“A different similarity metric” does not satisfy this requirement. Completion time does not establish freshness; writes must reject or isolate stale generations under the version contract."
      ],
      [
        "A worker fails after writing half a new version. What should serving policy avoid?",
        "Serving a mixed generation",
        "Tracking job failure status",
        "Retrying idempotent operations",
        "Retaining a safe old generation temporarily",
        "An incomplete mixture can cite contradictory content; activation should follow a defined completeness and consistency gate.",
        "“Tracking job failure status” does not satisfy this requirement. An incomplete mixture can cite contradictory content; activation should follow a defined completeness and consistency gate.",
        "“Retrying idempotent operations” does not satisfy this requirement. An incomplete mixture can cite contradictory content; activation should follow a defined completeness and consistency gate.",
        "“Retaining a safe old generation temporarily” does not satisfy this requirement. An incomplete mixture can cite contradictory content; activation should follow a defined completeness and consistency gate."
      ],
      [
        "A pipeline counts successful upserts but never checks source coverage. What remains uncertain?",
        "Required chunk coverage",
        "Whether the counter was incremented",
        "Whether the code had a loop",
        "Whether the process had a name",
        "A write count can include duplicates or omit particular records; coverage and generation correctness require stronger checks.",
        "“Whether the counter was incremented” does not satisfy this requirement. A write count can include duplicates or omit particular records; coverage and generation correctness require stronger checks.",
        "“Whether the code had a loop” does not satisfy this requirement. A write count can include duplicates or omit particular records; coverage and generation correctness require stronger checks.",
        "“Whether the process had a name” does not satisfy this requirement. A write count can include duplicates or omit particular records; coverage and generation correctness require stronger checks."
      ],
      [
        "An update changes access labels without changing text. What must refresh?",
        "Access metadata and caches",
        "Only the embedding model weights",
        "Only query punctuation",
        "Nothing until the text changes",
        "Serving rights can change independently of semantic representations and must propagate according to policy.",
        "“Only the embedding model weights” does not satisfy this requirement. Serving rights can change independently of semantic representations and must propagate according to policy.",
        "“Only query punctuation” does not satisfy this requirement. Serving rights can change independently of semantic representations and must propagate according to policy.",
        "“Nothing until the text changes” does not satisfy this requirement. Serving rights can change independently of semantic representations and must propagate according to policy."
      ],
      [
        "A source stream delivers duplicate events and retries after timeouts. Which design best supports convergence?",
        "Versioned reconciliation",
        "A fresh random chunk id for each attempt",
        "Ignoring failed events silently",
        "Appending all prior content to the prompt",
        "Duplicate-safe writes and reconciliation help restore the intended source state without multiplying stale records.",
        "“A fresh random chunk id for each attempt” does not satisfy this requirement. Duplicate-safe writes and reconciliation help restore the intended source state without multiplying stale records.",
        "“Ignoring failed events silently” does not satisfy this requirement. Duplicate-safe writes and reconciliation help restore the intended source state without multiplying stale records.",
        "“Appending all prior content to the prompt” does not satisfy this requirement. Duplicate-safe writes and reconciliation help restore the intended source state without multiplying stale records."
      ],
      [
        "A release claims transactional vector updates based on a Python dictionary example. What evidence is missing?",
        "Native concurrency tests",
        "The dictionary's final contents",
        "The declared keys in the fixture",
        "The local comparison result",
        "A local model illustrates policy but does not exercise transaction isolation, failures or native vector storage behavior.",
        "“The dictionary's final contents” does not satisfy this requirement. A local model illustrates policy but does not exercise transaction isolation, failures or native vector storage behavior.",
        "“The declared keys in the fixture” does not satisfy this requirement. A local model illustrates policy but does not exercise transaction isolation, failures or native vector storage behavior.",
        "“The local comparison result” does not satisfy this requirement. A local model illustrates policy but does not exercise transaction isolation, failures or native vector storage behavior."
      ]
    ]
  },
  {
    "comp": "m3.c1",
    "rows": [
      [
        "What is a source tombstone used for in ingestion?",
        "Durable deletion state",
        "Increasing vector dimension",
        "Granting every user access",
        "Training a new generator",
        "A deletion marker can keep delayed or repeated events from recreating retired content under the lifecycle policy.",
        "“Increasing vector dimension” does not satisfy this requirement. A deletion marker can keep delayed or repeated events from recreating retired content under the lifecycle policy.",
        "“Granting every user access” does not satisfy this requirement. A deletion marker can keep delayed or repeated events from recreating retired content under the lifecycle policy.",
        "“Training a new generator” does not satisfy this requirement. A deletion marker can keep delayed or repeated events from recreating retired content under the lifecycle policy."
      ],
      [
        "Which derived data may need invalidation after source deletion?",
        "Chunks and relevant caches",
        "Only the display filename",
        "Only the next question text",
        "Only the embedding dimension",
        "Deleting a primary object does not automatically retire every searchable or cached representation.",
        "“Only the display filename” does not satisfy this requirement. Deleting a primary object does not automatically retire every searchable or cached representation.",
        "“Only the next question text” does not satisfy this requirement. Deleting a primary object does not automatically retire every searchable or cached representation.",
        "“Only the embedding dimension” does not satisfy this requirement. Deleting a primary object does not automatically retire every searchable or cached representation."
      ],
      [
        "Why distinguish logical deletion from physical erasure?",
        "They provide different guarantees",
        "They always occur simultaneously",
        "Logical deletion removes every backup",
        "Physical erasure authorizes every reader",
        "Removing content from live serving is different from proving storage, replica and backup erasure under retention rules.",
        "“They always occur simultaneously” does not satisfy this requirement. Removing content from live serving is different from proving storage, replica and backup erasure under retention rules.",
        "“Logical deletion removes every backup” does not satisfy this requirement. Removing content from live serving is different from proving storage, replica and backup erasure under retention rules.",
        "“Physical erasure authorizes every reader” does not satisfy this requirement. Removing content from live serving is different from proving storage, replica and backup erasure under retention rules."
      ],
      [
        "A delayed indexing job starts from a snapshot older than a deletion. What must it check before writing?",
        "Current source eligibility",
        "Only that its input file exists",
        "Only that vector length matches",
        "Only that the worker can authenticate",
        "An old snapshot can recreate deleted content unless the lifecycle state or generation fence rejects it.",
        "“Only that its input file exists” does not satisfy this requirement. An old snapshot can recreate deleted content unless the lifecycle state or generation fence rejects it.",
        "“Only that vector length matches” does not satisfy this requirement. An old snapshot can recreate deleted content unless the lifecycle state or generation fence rejects it.",
        "“Only that the worker can authenticate” does not satisfy this requirement. An old snapshot can recreate deleted content unless the lifecycle state or generation fence rejects it."
      ],
      [
        "A document has twenty chunks and the deletion API removes one id. What must be verified?",
        "All source-owned records retire",
        "That one successful response proves whole-source removal",
        "That vector dimensions changed",
        "That the source title is shorter",
        "A per-record deletion is not evidence that every derived chunk or version was removed.",
        "“That one successful response proves whole-source removal” does not satisfy this requirement. A per-record deletion is not evidence that every derived chunk or version was removed.",
        "“That vector dimensions changed” does not satisfy this requirement. A per-record deletion is not evidence that every derived chunk or version was removed.",
        "“That the source title is shorter” does not satisfy this requirement. A per-record deletion is not evidence that every derived chunk or version was removed."
      ],
      [
        "A service promises eventual deletion visibility. What should its product contract state?",
        "Tested deletion semantics",
        "Guaranteed instant removal without evidence",
        "That caches can ignore deletions",
        "That all old answers must be public",
        "Product claims must match actual lifecycle semantics, and interim serving must respect the required exposure policy.",
        "“Guaranteed instant removal without evidence” does not satisfy this requirement. Product claims must match actual lifecycle semantics, and interim serving must respect the required exposure policy.",
        "“That caches can ignore deletions” does not satisfy this requirement. Product claims must match actual lifecycle semantics, and interim serving must respect the required exposure policy.",
        "“That all old answers must be public” does not satisfy this requirement. Product claims must match actual lifecycle semantics, and interim serving must respect the required exposure policy."
      ],
      [
        "A support tool retains a deleted excerpt in diagnostic logs. What is required?",
        "Govern diagnostic retention",
        "Assume logs are outside data governance",
        "Rename the log file only",
        "Increase the ANN search effort",
        "Diagnostics can retain source content and need explicit handling rather than being excluded from lifecycle review.",
        "“Assume logs are outside data governance” does not satisfy this requirement. Diagnostics can retain source content and need explicit handling rather than being excluded from lifecycle review.",
        "“Rename the log file only” does not satisfy this requirement. Diagnostics can retain source content and need explicit handling rather than being excluded from lifecycle review.",
        "“Increase the ANN search effort” does not satisfy this requirement. Diagnostics can retain source content and need explicit handling rather than being excluded from lifecycle review."
      ],
      [
        "A restore loads a backup from before a privacy deletion. What must recovery consider?",
        "Reapply lifecycle deletions",
        "Treating restored data as newly authorized",
        "Publishing all restored records immediately",
        "Changing only the embedding model",
        "Recovery must reconcile source lifecycle state so restoring an old snapshot does not restore forbidden live exposure.",
        "“Treating restored data as newly authorized” does not satisfy this requirement. Recovery must reconcile source lifecycle state so restoring an old snapshot does not restore forbidden live exposure.",
        "“Publishing all restored records immediately” does not satisfy this requirement. Recovery must reconcile source lifecycle state so restoring an old snapshot does not restore forbidden live exposure.",
        "“Changing only the embedding model” does not satisfy this requirement. Recovery must reconcile source lifecycle state so restoring an old snapshot does not restore forbidden live exposure."
      ],
      [
        "A tombstone expires sooner than the oldest retry can arrive. What failure is possible?",
        "Deleted content can be resurrected",
        "Every query becomes exact search",
        "Tenant permissions become unnecessary",
        "The tokenizer changes its encoding",
        "A replay after marker expiry may appear new unless another durable generation or lifecycle control rejects it.",
        "“Every query becomes exact search” does not satisfy this requirement. A replay after marker expiry may appear new unless another durable generation or lifecycle control rejects it.",
        "“Tenant permissions become unnecessary” does not satisfy this requirement. A replay after marker expiry may appear new unless another durable generation or lifecycle control rejects it.",
        "“The tokenizer changes its encoding” does not satisfy this requirement. A replay after marker expiry may appear new unless another durable generation or lifecycle control rejects it."
      ],
      [
        "A deletion audit needs to establish live unavailability and permitted retention separately. Which evidence is appropriate?",
        "Serving and retention checks",
        "Only a successful local list filter",
        "Only a new source filename",
        "Only an empty search once",
        "Complete lifecycle evidence covers relevant retrieval, detail and cache routes and distinguishes them from physical retention guarantees.",
        "“Only a successful local list filter” does not satisfy this requirement. Complete lifecycle evidence covers relevant retrieval, detail and cache routes and distinguishes them from physical retention guarantees.",
        "“Only a new source filename” does not satisfy this requirement. Complete lifecycle evidence covers relevant retrieval, detail and cache routes and distinguishes them from physical retention guarantees.",
        "“Only an empty search once” does not satisfy this requirement. Complete lifecycle evidence covers relevant retrieval, detail and cache routes and distinguishes them from physical retention guarantees."
      ]
    ]
  },
  {
    "comp": "m3.c2",
    "rows": [
      [
        "Why can equal dimensions still be incompatible after a model change?",
        "Different learned spaces",
        "Equal length always aligns semantic axes",
        "Only document titles determine compatibility",
        "All embedding models use identical vectors",
        "Matching shape permits arithmetic but does not establish meaningful alignment between learned representations.",
        "“Equal length always aligns semantic axes” does not satisfy this requirement. Matching shape permits arithmetic but does not establish meaningful alignment between learned representations.",
        "“Only document titles determine compatibility” does not satisfy this requirement. Matching shape permits arithmetic but does not establish meaningful alignment between learned representations.",
        "“All embedding models use identical vectors” does not satisfy this requirement. Matching shape permits arithmetic but does not establish meaningful alignment between learned representations."
      ],
      [
        "What should an embedding generation identifier capture?",
        "Model and preprocessing",
        "Only the UI theme",
        "Only a document count",
        "Only the service hostname",
        "Compatibility depends on the representation process, including model, dimensions and required normalization or prefixes.",
        "“Only the UI theme” does not satisfy this requirement. Compatibility depends on the representation process, including model, dimensions and required normalization or prefixes.",
        "“Only a document count” does not satisfy this requirement. Compatibility depends on the representation process, including model, dimensions and required normalization or prefixes.",
        "“Only the service hostname” does not satisfy this requirement. Compatibility depends on the representation process, including model, dimensions and required normalization or prefixes."
      ],
      [
        "What must query encoding match during retrieval?",
        "The serving representation",
        "The oldest model name in logs",
        "The longest document title",
        "The user's display language alone",
        "Queries and indexed documents need compatible representations, including any intended asymmetric model processing.",
        "“The oldest model name in logs” does not satisfy this requirement. Queries and indexed documents need compatible representations, including any intended asymmetric model processing.",
        "“The longest document title” does not satisfy this requirement. Queries and indexed documents need compatible representations, including any intended asymmetric model processing.",
        "“The user's display language alone” does not satisfy this requirement. Queries and indexed documents need compatible representations, including any intended asymmetric model processing."
      ],
      [
        "A model upgrade keeps 768 dimensions but changes learned weights. What should the team plan?",
        "Re-embedding and quality evaluation",
        "Mixing arbitrary old and new vectors",
        "Only changing the model badge",
        "Treating equal shape as proof of compatibility",
        "A representation change generally requires rebuilding affected vectors and validating the intended task before cutover.",
        "“Mixing arbitrary old and new vectors” does not satisfy this requirement. A representation change generally requires rebuilding affected vectors and validating the intended task before cutover.",
        "“Only changing the model badge” does not satisfy this requirement. A representation change generally requires rebuilding affected vectors and validating the intended task before cutover.",
        "“Treating equal shape as proof of compatibility” does not satisfy this requirement. A representation change generally requires rebuilding affected vectors and validating the intended task before cutover."
      ],
      [
        "A new index contains every source id but many stale versions. What is missing from the gate?",
        "Version freshness validation",
        "Only id existence counting",
        "Only vector type conversion",
        "Only a successful process exit",
        "Coverage by id alone can conceal obsolete source states; completeness and freshness are separate requirements.",
        "“Only id existence counting” does not satisfy this requirement. Coverage by id alone can conceal obsolete source states; completeness and freshness are separate requirements.",
        "“Only vector type conversion” does not satisfy this requirement. Coverage by id alone can conceal obsolete source states; completeness and freshness are separate requirements.",
        "“Only a successful process exit” does not satisfy this requirement. Coverage by id alone can conceal obsolete source states; completeness and freshness are separate requirements."
      ],
      [
        "A migration routes new-model queries to the old-model index for half the fleet. What is the risk?",
        "Incompatible retrieval routes",
        "Guaranteed better language coverage",
        "Automatic source authorization",
        "A harmless display-only difference",
        "Query and index representations need coordinated routing; inconsistent fleet configuration can produce invalid comparisons.",
        "“Guaranteed better language coverage” does not satisfy this requirement. Query and index representations need coordinated routing; inconsistent fleet configuration can produce invalid comparisons.",
        "“Automatic source authorization” does not satisfy this requirement. Query and index representations need coordinated routing; inconsistent fleet configuration can produce invalid comparisons.",
        "“A harmless display-only difference” does not satisfy this requirement. Query and index representations need coordinated routing; inconsistent fleet configuration can produce invalid comparisons."
      ],
      [
        "An acceptance set improves overall but loses quality on a required language. What should the rollout do?",
        "Check required segments",
        "Ignore it because the mean rose",
        "Remove that segment from the report",
        "Claim complete migration quality from id counts",
        "Segment requirements remain part of acceptance; an aggregate improvement can conceal a meaningful regression.",
        "“Ignore it because the mean rose” does not satisfy this requirement. Segment requirements remain part of acceptance; an aggregate improvement can conceal a meaningful regression.",
        "“Remove that segment from the report” does not satisfy this requirement. Segment requirements remain part of acceptance; an aggregate improvement can conceal a meaningful regression.",
        "“Claim complete migration quality from id counts” does not satisfy this requirement. Segment requirements remain part of acceptance; an aggregate improvement can conceal a meaningful regression."
      ],
      [
        "A source is deleted during dual-generation rebuild. What must both generations respect?",
        "Current lifecycle state",
        "Only the initial snapshot",
        "Only the new model's public benchmark",
        "Only the oldest source version",
        "A migration must not reintroduce retired or unauthorized content from a stale rebuild snapshot.",
        "“Only the initial snapshot” does not satisfy this requirement. A migration must not reintroduce retired or unauthorized content from a stale rebuild snapshot.",
        "“Only the new model's public benchmark” does not satisfy this requirement. A migration must not reintroduce retired or unauthorized content from a stale rebuild snapshot.",
        "“Only the oldest source version” does not satisfy this requirement. A migration must not reintroduce retired or unauthorized content from a stale rebuild snapshot."
      ],
      [
        "A rollback switches to a prior embedding generation. What else must remain coherent?",
        "Encoding and permissions",
        "Only dashboard labels",
        "Only model marketing descriptions",
        "Only the count of lessons",
        "Rollback is a serving-system change; compatible encoding and current authorization remain necessary even for an older index.",
        "“Only dashboard labels” does not satisfy this requirement. Rollback is a serving-system change; compatible encoding and current authorization remain necessary even for an older index.",
        "“Only model marketing descriptions” does not satisfy this requirement. Rollback is a serving-system change; compatible encoding and current authorization remain necessary even for an older index.",
        "“Only the count of lessons” does not satisfy this requirement. Rollback is a serving-system change; compatible encoding and current authorization remain necessary even for an older index."
      ],
      [
        "A team wants a defensible cutover after offline vector migration. Which package of evidence is strongest?",
        "Lifecycle and retrieval evidence",
        "Only equal vector dimensions",
        "Only a successful local pointer assignment",
        "Only total index byte size",
        "Safe acceptance combines representation compatibility, lifecycle correctness, retrieval quality and operational behavior rather than a single arithmetic gate.",
        "“Only equal vector dimensions” does not satisfy this requirement. Safe acceptance combines representation compatibility, lifecycle correctness, retrieval quality and operational behavior rather than a single arithmetic gate.",
        "“Only a successful local pointer assignment” does not satisfy this requirement. Safe acceptance combines representation compatibility, lifecycle correctness, retrieval quality and operational behavior rather than a single arithmetic gate.",
        "“Only total index byte size” does not satisfy this requirement. Safe acceptance combines representation compatibility, lifecycle correctness, retrieval quality and operational behavior rather than a single arithmetic gate."
      ]
    ]
  }
]);
