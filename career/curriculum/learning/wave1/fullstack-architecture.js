'use strict';
const {build}=require('./fullstack-wave3-helper');
const units=[
  {
    "comp": "m1.c1",
    "title": "Keep business invariants inside the application boundary",
    "before": "Complete full-stack integration/state and database design; distinguish boundary validation from authoritative writes.",
    "intro": "A marketplace must prevent refunds greater than the remaining refundable amount. Putting that rule only in a React form lets a different API caller bypass it; putting it in every route causes divergence. Application architecture starts by assigning responsibility for rules and effects.",
    "sections": [
      [
        "Reason about the mechanism",
        "Presentation translates input and output for a channel. An application service coordinates a use case, while domain rules express business invariants independent of HTTP or a particular storage library. A data adapter translates repository operations to the chosen database. These are responsibilities, not a requirement to create a class for every noun.",
        "Validate representation at the boundary and enforce business rules at the authoritative write path. A route may check that amount is an integer; the domain must also check that it is positive and no greater than the refundable balance. For concurrent writes, an in-memory rule is insufficient unless storage enforces the required atomicity or concurrency precondition."
      ],
      [
        "Apply and verify the decision",
        "Inject a small port for the storage behavior a use case needs. Tests can substitute an in-memory adapter to check orchestration, while adapter integration tests verify actual queries and transaction semantics. Avoid leaking HTTP response objects into domain code or exposing ORM entities directly as a public API contract.",
        "The model computes a refund result with integer cents and rejects an excessive refund. It deliberately has no storage and therefore cannot prevent two concurrent refunds from overspending one balance. Production code needs validated numeric ranges and an atomic authoritative update."
      ]
    ],
    "problem": "Compute a bounded refund and reject an amount greater than the available balance.",
    "steps": [
      "Represent monetary values in integer cents for the fixture.",
      "Apply positive-integer and available-balance checks before subtraction.",
      "Exercise both the successful calculation and the excessive-refund rejection."
    ],
    "code": "function refund(balance,amount){if(!Number.isInteger(amount)||amount<=0||amount>balance)throw Error(\"invalid refund\");return balance-amount;}console.log(refund(900,250));try{refund(900,950);}catch(e){console.log(e.message);}",
    "expect": "650\ninvalid refund",
    "result": "The valid refund leaves 650 cents, while the excessive refund produces invalid refund. These are pure calculations: two concurrent callers can both pass the same local balance check. Production authority needs a transaction or equivalent conditional update and validated numeric bounds.",
    "mistakes": [
      "A form rule does not protect arbitrary callers; enforce the invariant on every authoritative write path.",
      "A pure function test does not prove concurrent storage correctness; test the real transaction boundary."
    ],
    "takeaways": [
      "Presentation translates input and output for a channel.",
      "Inject a small port for the storage behavior a use case needs."
    ],
    "formal": [
      "Which responsibility translates HTTP input for a use case?|Presentation boundary|Database backup policy|Business rule ownership|Package resolution policy|The presentation boundary adapts the transport representation without owning every business decision.",
      "Where should the refundable-balance invariant be authoritative?|The write boundary|Only a React form|Only a test fixture|Only a tooltip|Every write path must enforce the business rule because clients can bypass presentation checks.",
      "A mobile caller bypasses a browser refund limit. Which design flaw is exposed?|Client-only invariant|Too many route tests|Too few CSS variables|An immutable artifact|A browser check cannot enforce an authoritative business constraint for arbitrary callers.",
      "A refund service imports Express response objects into its arithmetic rules. What coupling appears?|Transport in domain|A database deadlock|A browser cache race|A Git object mismatch|Domain calculations become tied to one transport instead of being usable across channels.",
      "Two refunds each read the same balance before either writes. What does local validation alone miss?|Concurrent enforcement|Integer representation|The method filename|The browser lifecycle|A valid individual calculation can violate the shared invariant when concurrent writes are not coordinated.",
      "An ORM entity gains an internal fraud score and the API serializes it automatically. Which boundary is weak?|Explicit API projection|Only package pinning|Only table indexing|Only route spelling|Public response projection should prevent internal persistence fields from leaking into the wire contract.",
      "A service test uses an in-memory repository and passes. What still needs real adapter testing?|Storage semantics|Pure subtraction output|The test double name|The source file suffix|A test double cannot prove actual database query, transaction or constraint behavior.",
      "A developer makes one interface per field with no alternative behavior. Which concern should guide simplification?|Useful responsibility|Maximum interface count|Minimum filename size|Automatic service split|Abstractions should clarify behavior and change boundaries rather than multiply types without purpose.",
      "A CLI and API both initiate refunds. How should the core rule be reused?|A shared use case|Duplicate route logic|Only a browser hook|Two independent formulas|Multiple channels can call the same authoritative application behavior through their own adapters.",
      "A valid refund computation is followed by a failed persistence write. What must the use-case design represent?|Commit outcome|Only calculated balance|Only request spelling|Only the UI theme|A computed value is not evidence that the authoritative state change committed successfully."
    ],
    "practice": [
      "Which layer should understand HTTP status codes?|Transport adapter|Pure balance rule|Storage index policy|Currency arithmetic|Status codes are transport concerns that can be mapped from application outcomes at the boundary.",
      "Why validate writes on the server when the form validates too?|Callers can bypass UI|Forms cannot render|Types never compile|Routes cannot fail|An arbitrary caller can invoke the write endpoint without following the browser’s checks.",
      "What does a repository port describe?|Needed storage behavior|Every database feature|The browser location|Only table filenames|A useful port exposes the operations the use case requires without leaking all storage internals.",
      "Does pure refund arithmetic prove concurrent balance safety?|No; storage must enforce|Yes; integers are atomic|Only for GET requests|Only in a single module|Concurrent operations need authoritative transaction or conditional-write enforcement beyond pure arithmetic."
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
    "title": "Choose a deployable boundary from team and product needs",
    "before": "Review module boundaries, local transactions and the additional failure behavior introduced by network calls.",
    "intro": "A three-person team building appointment software proposes six services before it has stable workflows. Distribution adds operational and data-consistency work. Choose a deployable structure from business boundaries, team ownership, scaling pressure and reliability needs rather than using service count as a maturity score.",
    "sections": [
      [
        "Reason about the mechanism",
        "A modular monolith can separate scheduling, billing and notifications behind explicit internal interfaces while keeping one deployment and local transactions. Its boundaries still need enforcement through imports, ownership and tests. A single deployable does not justify a shared mutable bag of every module’s data.",
        "Services can provide independent deployment, scaling and failure isolation when boundaries and operations support those benefits. They also introduce network failure, versioned contracts, tracing, retries and distributed data ownership. A shared database with unrestricted cross-service writes often defeats the supposed ownership boundary."
      ],
      [
        "Apply and verify the decision",
        "Compare total cost with measured constraints. If only report generation needs independent scaling, a worker or extracted reporting capability may be enough. Keep an architecture decision record with context, chosen boundary, alternatives, consequences and a trigger for reconsideration.",
        "The decision model below uses deliberately declared thresholds for synthetic team size and scaling evidence. Its output is an illustration of policy evaluation, not a universal rule that small teams must use monoliths or that large teams need services. Review real constraints with the responsible engineers."
      ]
    ],
    "problem": "Evaluate a declared extraction policy under contrasting scaling-need and operations-capacity inputs.",
    "steps": [
      "Make independent scaling need and on-call capacity explicit.",
      "Evaluate a case without an independent workload requirement.",
      "Evaluate a case with both declared extraction conditions satisfied."
    ],
    "code": "function choose(x){return x.independentNeed&&x.onCallCapacity>=2?\"consider extraction\":\"modular baseline\";}console.log(choose({independentNeed:false,onCallCapacity:3}));console.log(choose({independentNeed:true,onCallCapacity:2}));",
    "expect": "modular baseline\nconsider extraction",
    "result": "The first case keeps a modular baseline; the second considers extraction. These illustrative thresholds are not architecture rules or measured economics. A real decision must assess team ownership, failure coupling, data boundaries and the cost of sustaining the extra deployment.",
    "mistakes": [
      "More services do not imply a more suitable architecture; choose boundaries from concrete constraints.",
      "Separate processes that write each other’s tables remain coupled; define data ownership."
    ],
    "takeaways": [
      "A modular monolith can separate scheduling, billing and notifications behind explicit internal interfaces while keeping one deployment and local transactions.",
      "Compare total cost with measured constraints."
    ],
    "formal": [
      "What can a modular monolith provide?|Internal boundaries|No need for ownership|Automatic global scale|Independent deployments|A single deployment can still enforce meaningful module responsibilities and interfaces.",
      "What extra failure mode comes with a network boundary?|Partial remote failure|Guaranteed atomicity|No contract lifecycle|Perfect clock agreement|A remote operation can fail or have an uncertain outcome independently of the caller.",
      "A three-person team has no on-call capacity but proposes six services. Which cost needs explicit review?|Operational ownership|Only repository count|Only method naming|Only UI component size|Each service adds monitoring, deployment and incident responsibilities that the team must sustain.",
      "Only monthly reports need separate scaling. What is a proportionate candidate?|A reporting worker|Split every domain now|Rewrite every endpoint|Share all table writes|A targeted asynchronous reporting boundary can address the measured pressure without distributing unrelated capabilities.",
      "Two services write directly to each other’s tables. Which intended benefit is weakened?|Data ownership|Only JSON formatting|Only network speed|Only runtime pinning|Unrestricted shared writes couple service behavior and make independent ownership difficult.",
      "A service split claims failure isolation but every request synchronously requires all services. What needs analysis?|Dependency propagation|Only folder separation|Only commit granularity|Only CSS isolation|Synchronous dependencies can propagate outages across deployables unless failure behavior is designed.",
      "A team adopts services solely because a competitor has many. What decision input is missing?|Own measured constraints|Only brand preference|Only longer hostnames|Only code line counts|Architecture should respond to the team’s product, operations and change constraints.",
      "A monolith keeps billing rules in a module but imports its private tables everywhere. What is missing?|Enforced boundaries|Only a second server|Only API version labels|Only a bigger package|Nominal module names do not enforce responsibility when callers bypass the intended interface.",
      "A service has independent deployment but requires lockstep releases with every consumer. What benefit is limited?|Release autonomy|Only process identity|Only DNS uniqueness|Only artifact hashing|A deployable boundary does not deliver useful autonomy when contract changes require coordinated releases.",
      "A product has strict data residency and separate regulated ownership. How should that affect boundary choice?|Treat as real constraints|Ignore until coding ends|Always share all data|Count React components|Regulatory, security and ownership requirements can justify boundaries independently of simple team-size heuristics."
    ],
    "practice": [
      "Does one deployment imply no modular architecture?|No; modules still matter|Yes; all code is coupled|Only in JavaScript apps|Only without a database|Deployment topology and internal responsibility boundaries are different design dimensions.",
      "What should justify service extraction?|A concrete pressure|A fashionable diagram|A fixed service quota|The number of CSS files|An extraction should address a documented scaling, ownership, delivery or reliability need.",
      "What does service ownership include besides code?|Operations and data|Only endpoint names|Only brand guidelines|Only PR descriptions|A service team must sustain data semantics, deployment and incident behavior as well as implementation.",
      "Why record a reconsideration trigger?|Revisit changed context|Freeze choices forever|Guarantee zero rewrites|Remove all trade-offs|A trigger identifies when new evidence should prompt review of the earlier architecture decision.",
      "Can shared-table writes couple separate services?|Yes; through shared data|No; hosts are separate|Only during compilation|Only for static assets|Separate processes remain behaviorally coupled when they mutate one another’s persistent state.",
      "What does independent scaling require?|A separable workload|Only a second repository|Only a new DNS alias|Only longer job names|The extracted workload must be separable in resources and dependencies to gain useful scaling autonomy.",
      "Why include operational capacity in a design decision?|Distribution adds duties|Capacity replaces tests|Servers own themselves|Only frontend needs it|More deployables introduce ongoing release, monitoring and recovery responsibilities.",
      "Is a shared database always proof of independent ownership?|No; access rules matter|Yes; one schema is enough|Only with JSON columns|Only with route prefixes|Ownership depends on who can read and write which data and under what contracts."
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
    "title": "Make the transaction boundary match the business operation",
    "before": "Review database atomicity and the difference between local state commitment and a remote side effect.",
    "intro": "An order API writes an order and publishes a notification as separate actions. If the process stops between them, customers can pay without receiving a confirmation or receive a message for an uncommitted order. Architecture must state which effects share atomicity and which require recovery.",
    "sections": [
      [
        "Reason about the mechanism",
        "A database transaction can group compatible writes in the same database transaction context. It does not automatically include a remote email provider or message broker. Avoid holding locks while waiting on slow external services: the longer transaction can reduce throughput and still cannot roll back an already delivered email.",
        "An outbox pattern writes the business state and an event record atomically in the owning database. A worker later delivers events. This changes the guarantee from an impossible implicit cross-system atomic action to durable intent plus eventual delivery under operational assumptions. The worker needs retry, deduplication and backlog monitoring."
      ],
      [
        "Apply and verify the decision",
        "An event record should carry a stable identity and sufficient versioned data for the consumer contract. Consumers must tolerate duplicate delivery or make effects idempotent. A successful HTTP response should accurately describe committed state without pretending that every asynchronous side effect has already finished.",
        "The in-memory model publishes both order and outbox changes only if its synthetic transaction callback returns successfully. It illustrates all-or-nothing intent in a local structure, not real durability or crash recovery. Production guarantees depend on the database transaction and reliable worker implementation."
      ]
    ],
    "problem": "Keep order creation and its delivery-intent record together in a synthetic commit.",
    "steps": [
      "Clone the local state before applying the tentative operation.",
      "Abort before publishing the changed state and inspect both collections.",
      "Complete the operation and publish order plus outbox intent together."
    ],
    "code": "let db={orders:[],outbox:[]};function save(id,fail){const next=JSON.parse(JSON.stringify(db));next.orders.push(id);if(fail)throw Error(\"abort\");next.outbox.push({id:\"event-\"+id});db=next;}try{save(\"o1\",true);}catch{}console.log(db.orders.length,db.outbox.length);save(\"o2\",false);console.log(db.orders.length,db.outbox.length);",
    "expect": "0 0\n1 1",
    "result": "An abort leaves both counts at zero; the completed synthetic commit leaves one order and one intent. Copying an object is not database isolation or durability. A real transactional outbox needs an actual shared commit, reliable delivery and idempotent consumption.",
    "mistakes": [
      "A database rollback cannot unsend an external message; separate remote effect guarantees.",
      "Outbox insertion does not prove notification delivery; expose pending work and monitor progress."
    ],
    "takeaways": [
      "A database transaction can group compatible writes in the same database transaction context.",
      "An event record should carry a stable identity and sufficient versioned data for the consumer contract."
    ],
    "formal": [
      "What can a local database transaction normally group?|Local database writes|Any external email send|Every browser render|All network requests|Atomicity applies to operations enlisted in the database transaction rather than arbitrary remote effects.",
      "What does a transactional outbox persist with business state?|Delivery intent|A guaranteed sent email|All consumer memory|A browser screenshot|The outbox records durable intent in the same atomic commit as the business mutation.",
      "An API commits an order and crashes before sending its event. Which pattern addresses the lost intent gap?|Transactional outbox|Only a longer timeout|Only a source comment|Only browser retries|Writing order and event intent together preserves work for a later delivery worker.",
      "An email is sent before a database transaction rolls back. Can the database rollback unsend it?|No; remote effect remains|Yes; SQL reverses SMTP|Only with a new branch|Only for HTML messages|A remote side effect outside the transaction does not automatically roll back with database writes.",
      "A worker publishes an event then crashes before marking it delivered. What should consumers expect?|Duplicate delivery|Guaranteed single arrival|Permanent SQL rollback|Automatic email retraction|The worker may retry an already published event after an uncertain completion point.",
      "An order transaction waits for a slow marketing API while holding row locks. What concern appears?|Long lock duration|Only source map size|Only package resolution|Only response whitespace|External latency can extend lock holding and impair database availability without adding cross-system atomicity.",
      "An outbox table grows indefinitely while orders succeed. What operational evidence is missing?|Outbox backlog visibility|Only browser unit tests|Only table naming style|Only token expiration|Durable intent still requires worker health and backlog monitoring to ensure eventual progress.",
      "A consumer deduplicates on an event id regenerated for every retry. What is wrong?|Identity is unstable|The payload is too small|The route is read-only|The event is encrypted|Retries of one logical event need a stable identity for useful deduplication.",
      "A response says notification sent immediately after writing an outbox row. Which contract is inaccurate?|Completion claim|Only status whitespace|Only package version|Only database table name|Persisting intent does not establish that the downstream notification effect completed.",
      "An outbox payload refers only to a mutable record that may change before delivery. What must be decided?|Event snapshot semantics|Only JSON indentation|Only index naming style|Only route casing|The contract must specify whether the consumer needs event-time facts or current-state lookup semantics."
    ],
    "practice": [
      "Does a database commit prove that an external email was delivered?|No; separate boundary|Yes; commits cover SMTP|Only on main branch|Only with a new key|Database transaction success does not prove completion of an external provider operation.",
      "What should identify repeated delivery attempts for one event?|A stable event id|A new id each attempt|The current timestamp|A random browser tab|Stable event identity allows retry attempts to be recognized as the same logical work.",
      "Why monitor an outbox backlog?|Delivery can stall|Rows prove completion|Workers cannot fail|Logs replace queues|A durable queue of intent can accumulate when delivery workers fail or cannot keep up.",
      "What should an asynchronous order response promise accurately?|Committed order state|Every email completed|Every client refreshed|No future retry needed|The response should distinguish durable local commitment from pending remote side effects."
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
    "title": "Unify identity, tenant scope and safe error boundaries",
    "before": "Review authentication versus object authorization, tenant isolation and asynchronous error propagation.",
    "intro": "A business dashboard uses one login across browser requests, API calls and background exports. Cross-cutting design must preserve identity and tenant scope without assuming that every authenticated user can access every object. It must also produce useful diagnostics without exposing capabilities.",
    "sections": [
      [
        "Reason about the mechanism",
        "Authentication establishes who or what is calling; authorization decides whether that principal may perform the requested action on the specific resource. Evaluate authorization at the authoritative service boundary, using current resource and tenant information. A hidden button or trusted-looking client claim does not enforce object access.",
        "Propagate only the minimum request context needed: a validated principal, a tenant scope and a safe correlation id. Do not treat correlation ids as credentials or allow an arbitrary request tenant field to override the authenticated scope. Background work needs its own authority model rather than retaining an end-user bearer token indefinitely."
      ],
      [
        "Apply and verify the decision",
        "Error handling should distinguish expected domain outcomes from unexpected faults, map safe responses at the transport boundary and retain diagnostic detail in controlled logs. For the pinned Express 4.21.2 implementation, asynchronous failures must be forwarded explicitly with next(error), such as through a promise catch handler. A try/catch around callback registration does not catch a later callback throw; detached work needs its own lifecycle and failure path.",
        "The model checks tenant and permission before projecting a safe result, then returns a generic forbidden error. It is not token verification, Express middleware or a complete access-control engine. Real authorization also needs object-level policy, trusted identity construction and negative integration tests."
      ]
    ],
    "problem": "Project an invoice only for a principal with the matching tenant and read permission.",
    "steps": [
      "Compare validated tenant scope with the record’s tenant.",
      "Require invoice-read permission before producing the public projection.",
      "Reject a second principal from another tenant without returning private record fields."
    ],
    "code": "function view(user,record){if(user.tenant!==record.tenant||!user.permissions.includes(\"invoice:read\"))throw Error(\"forbidden\");return {id:record.id};}const r={id:\"i1\",tenant:\"t1\",secret:\"hidden\"};console.log(JSON.stringify(view({tenant:\"t1\",permissions:[\"invoice:read\"]},r)));try{view({tenant:\"t2\",permissions:[\"invoice:read\"]},r);}catch(e){console.log(e.message);}",
    "expect": "{\"id\":\"i1\"}\nforbidden",
    "result": "The permitted principal receives only the public id. The cross-tenant principal receives forbidden even with the read permission string. The fixture assumes already trusted identity objects and does not verify tokens, execute Express or implement a complete object-access policy.",
    "mistakes": [
      "Hiding a button does not authorize a resource; check policy at the authoritative boundary.",
      "A returned promise and detached asynchronous work have different error paths; handle both deliberately."
    ],
    "takeaways": [
      "Authentication establishes who or what is calling; authorization decides whether that principal may perform the requested action on the specific resource.",
      "Error handling should distinguish expected domain outcomes from unexpected faults, map safe responses at the transport boundary and retain diagnostic detail in controlled logs."
    ],
    "formal": [
      "An invoice service has verified a caller’s identity and loaded the invoice tenant. What remaining decision belongs to authorization before projecting the response?|Permitted action|Only caller identity|Only token encoding|Only request duration|Authorization evaluates whether the principal is allowed to act on the requested resource.",
      "What should a correlation id be treated as?|A diagnostic identifier|A database password|A permission grant|A session signature|Correlation identifiers help connect diagnostics and do not confer access authority.",
      "An authenticated user changes an invoice id to another tenant’s object. Which check is essential?|Object authorization|Only login existence|Only button visibility|Only JSON syntax|Authentication alone does not establish permission to read a specific tenant-scoped resource.",
      "A hidden admin button is the only access control. Where must enforcement move?|Authoritative service|Only browser styling|Only route display text|Only localStorage flags|A server must enforce authorization because callers can bypass the rendered interface.",
      "A request body supplies tenant B while the validated principal belongs to tenant A. What should prevent override?|Trusted scope policy|Only a shorter body|Only route encryption|Only cache compression|Tenant scope must derive from validated authority and policy rather than untrusted input alone.",
      "An Express 4 handler starts an asynchronous operation that may reject. What must its implementation ensure?|Explicit error forwarding|Automatic retry loop|Database rollback|Browser token refresh|The pinned Express 4 API requires the asynchronous error to reach next(error), for example through a promise catch handler.",
      "A detached timer throws after an Express 4 handler finishes. What should developers avoid assuming?|Route error auto-capture|That errors can happen|That callbacks need care|That logs need context|A later callback throw is outside the synchronous route invocation and needs explicit handling for its own lifecycle.",
      "A public error includes a SQL connection string. What boundary should change?|Safe error projection|Only query indexing|Only response gzip|Only branch protection|Public errors should omit sensitive internals while controlled diagnostics retain necessary investigation detail.",
      "A background export stores an expiring user token for next month. What architecture needs review?|Worker authority model|Only CSV delimiters|Only file extension|Only browser viewport|Delayed work needs explicit durable authority and revalidation rules rather than assuming an old bearer token remains appropriate.",
      "A user’s access is revoked after a job is queued. What must the job policy explicitly decide?|Execution-time authority|Only queue display name|Only request-id length|Only file compression|The system must define and enforce whether queued work is authorized at enqueue time, execution time or both."
    ],
    "practice": [
      "Does authentication alone authorize access to every invoice?|No; check object policy|Yes; login is sufficient|Only with a long token|Only for JSON APIs|Permission depends on the action and specific resource scope in addition to authenticated identity.",
      "What should establish tenant context for a protected operation?|Validated authority|An arbitrary form field|The page title alone|A query string alone|Tenant scope must be derived from trusted identity and policy rather than client assertion alone.",
      "Why project public errors separately from internal exceptions?|Limit sensitive detail|Hide every failure|Replace access checks|Guarantee no incidents|A safe public response can explain the outcome without exposing confidential implementation data.",
      "In Express 4, how should a rejected asynchronous operation reach error middleware?|Explicit next(error)|A Git rollback|The browser cache|A schema migration|A promise catch handler or equivalent asynchronous error path must explicitly pass the failure to next(error).",
      "Should request ids grant permission to fetch invoices?|No; ids are diagnostic|Yes; unique means trusted|Only if they are long|Only if they use JSON|A correlation id is not an authorization credential or proof of resource ownership.",
      "Which test best exercises tenant isolation?|Cross-tenant denial|Only happy-path login|Only type compilation|Only route existence|Negative access tests verify that a valid principal cannot cross its permitted tenant boundary.",
      "Why avoid logging bearer tokens?|They carry authority|They are only numbers|They improve traces|They replace passwords|A retained bearer token can grant access to whoever obtains it while it remains valid.",
      "What must a worker receive to perform protected work?|Explicit scoped authority|Any browser cookie|An arbitrary tenant id|The oldest login token|Background execution needs a deliberate capability and policy rather than unvalidated context."
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
    "title": "Cache representations with ownership and freshness rules",
    "before": "Review tenant and permission scope, cache-aside behavior and representation-dependent query parameters.",
    "intro": "A tenant dashboard caches invoice summaries to reduce repeated database reads. A global key named invoices leaks one tenant’s data into another tenant’s response. A useful cache key identifies the representation and authority context, while the policy states how stale that representation may become.",
    "sections": [
      [
        "Reason about the mechanism",
        "Include all dimensions that materially affect a representation: resource identity, tenant, permission-dependent view, filters, pagination and version where relevant. A hash of an incomplete key remains incomplete. Avoid using raw secrets as keys; derive safe identifiers from validated scope and keep caches inside an appropriate trust boundary.",
        "Cache-aside reads the cache, loads the authoritative source on a miss and fills the cache under a freshness policy. TTL bounds time-based retention under assumptions, but it does not make a value correct immediately after a write. Invalidation, versioned keys or bypass policies may be needed for read-after-write expectations."
      ],
      [
        "Apply and verify the decision",
        "Coordinate concurrent misses when load spikes threaten the source. Request coalescing can share one in-flight load, while stale-while-revalidate trades freshness for availability under a declared policy. Never serve stale authorization decisions or financial state as authoritative merely because a stale value is convenient.",
        "The example serializes a tuple into a collision-resistant representation of the chosen dimensions. It proves only that differing tenant scopes produce differing keys for these inputs. It does not implement eviction, distributed locking, encryption or a complete permission model."
      ]
    ],
    "problem": "Encode tenant, invoice and view as a tuple so cross-tenant representations have separate keys.",
    "steps": [
      "List the dimensions chosen for the fixture representation.",
      "Compare otherwise identical keys with different tenant values.",
      "Compare a repeated identical tuple and observe stable identity."
    ],
    "code": "const key=(tenant,id,view)=>JSON.stringify([tenant,id,view]);console.log(key(\"t1\",\"i1\",\"summary\")===key(\"t2\",\"i1\",\"summary\"));console.log(key(\"t1\",\"i1\",\"summary\")===key(\"t1\",\"i1\",\"summary\"));",
    "expect": "false\ntrue",
    "result": "Different tenants produce different serialized keys, and identical tuples produce the same key. This only validates tuple distinction for the shown dimensions. Real caches need the complete representation scope, collision-safe encoding, authorization checks, freshness policy and operational controls.",
    "mistakes": [
      "Hashing an incomplete key does not add missing scope; include every relevant dimension first.",
      "TTL allows a stale interval; use an explicit policy when immediate freshness matters."
    ],
    "takeaways": [
      "Include all dimensions that materially affect a representation: resource identity, tenant, permission-dependent view, filters, pagination and version where relevant.",
      "Coordinate concurrent misses when load spikes threaten the source."
    ],
    "formal": [
      "What must a cache key identify?|The representation|Only the route name|Only the server PID|Only the request time|A cache key must distinguish every relevant context that changes the returned representation.",
      "What does a TTL directly specify?|Retention duration|Business correctness|User authorization|Transaction isolation|A time-to-live limits how long an entry remains eligible under the cache policy.",
      "Two tenants request the same invoice id and share a key. What risk follows?|Cross-tenant leakage|Only lower hit rate|Only longer queries|Only cache eviction|Keys missing validated tenant scope can return one tenant’s cached representation to another.",
      "A filter changes but the cache key does not. What result can appear?|Wrong representation|A guaranteed miss|Automatic SQL rollback|An invalid Git object|A cached response for one filter can be reused incorrectly for another request.",
      "An invoice is updated but its cached summary remains until TTL expiry. Which promise needs review?|Freshness after writes|Only response format|Only file naming|Only source pinning|A TTL permits staleness and does not automatically satisfy an immediate read-after-write requirement.",
      "A popular key expires and thousands of callers reload it at once. What can reduce source load?|Request coalescing|Longer JSON field names|More cache-key secrets|Unbounded retry loops|Coalescing concurrent misses can let callers share one in-flight load instead of stampeding the source.",
      "A team hashes a key that omits permission scope. Does hashing fix the omission?|No; dimensions still miss|Yes; hashes add policy|Only with longer output|Only for GET requests|Hashing encodes the selected input and cannot supply missing authorization-dependent dimensions.",
      "A dashboard serves cached revoked permissions for an hour. What must be addressed?|Authorization freshness|Only request gzip|Only branch age|Only route casing|Security decisions need a deliberately safe freshness policy rather than convenience-driven stale reuse.",
      "A stale-while-revalidate policy is proposed for a financial write precondition. What is the concern?|Authoritative staleness|Only cache file format|Only browser tab count|Only npm script order|A stale cached value must not replace authoritative checks governing money-changing operations.",
      "A cache accepts arbitrary tenant and invoice strings, including colons. Concatenating tenant=a,id=bc and tenant=ab,id=c aliases both to abc. Summary and private views must also remain distinct. Which key design prevents both tuple aliasing and cross-view reuse without restricting these strings?|Serialize [tenant,id,view] as a JSON tuple before optional hashing|Join tenant, id and view with colons and hash the joined string|Serialize [tenant+id,view] and hash the serialized value|Serialize [tenant,id] and let TTL distinguish summary from private|For the validated string inputs, ordered JSON array encoding preserves element boundaries and the view dimension. Colon joining can alias when inputs contain colons; hashing cannot repair an already ambiguous representation; concatenating tenant and id first retains the demonstrated collision; omitting view allows cross-view reuse regardless of TTL."
    ],
    "practice": [
      "Why include tenant scope in a shared cache key?|Separate tenant views|Increase server uptime|Replace object policy|Rotate every token|Tenant-dependent representations must not share an undifferentiated cached identity.",
      "Does a short TTL eliminate all stale reads after a write?|No; a window remains|Yes; TTL is a transaction|Only with a new branch|Only for numeric fields|A value can remain cached until expiration and therefore still be stale after a recent write.",
      "What is cache-aside on a miss?|Load source then cache|Trust any old browser|Delete the source data|Skip all authorization|A cache-aside miss retrieves the authoritative representation before storing it for later reads.",
      "What does request coalescing share?|An in-flight load|Every user’s authority|A database password|All tenant responses|Concurrent requests for the same permitted representation can share source-loading work."
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
    "title": "Give background jobs stable identity and bounded retries",
    "before": "Review outbox delivery intent, idempotency and durable storage boundaries.",
    "intro": "A report request should return quickly while a worker generates the report. Moving work to a queue changes the lifecycle but does not remove failure. Define job identity, authority, ownership, retry policy and the way a user discovers the final result.",
    "sections": [
      [
        "Reason about the mechanism",
        "Acknowledge a job only after its required durable effect is recorded, according to the queue’s semantics. A worker can complete the effect and crash before acknowledgement, causing redelivery. Aim for an idempotent business effect through stable command identity and authoritative deduplication rather than claiming exactly-once execution from a queue setting.",
        "Classify failures. Transient service unavailability may merit exponential backoff with jitter and a retry budget; invalid input usually needs correction rather than repeated execution. Bound attempts and route exhausted work to an operationally reviewed failure path. Do not silently discard a money-related command after the last retry."
      ],
      [
        "Apply and verify the decision",
        "A lease prevents simultaneous ownership only under its stated timing and storage semantics. A slow worker can continue after its lease expires, so sensitive writes may require fencing tokens or conditional version checks. Report progress separately from final committed completion and include authorization when users fetch results.",
        "The model deduplicates repeated job identities in an in-memory set. It demonstrates why a repeated logical identity can avoid a duplicate local effect. It is not crash safe: production deduplication and the effect must share an appropriate authoritative atomicity boundary."
      ]
    ],
    "problem": "Apply a logical job once and recognize a repeated attempt with the same id.",
    "steps": [
      "Consult completed identities before applying the local effect.",
      "Record completion under the stable job identity.",
      "Repeat the identity and compare its result and effect counter."
    ],
    "code": "const seen=new Set();let effects=0;function work(id){if(seen.has(id))return \"duplicate\";effects++;seen.add(id);return \"applied\";}console.log(work(\"j1\"),work(\"j1\"),effects);",
    "expect": "applied duplicate 1",
    "result": "The first attempt is applied, the repeated attempt is duplicate, and the local effect count remains one. The in-memory set disappears on restart and is not atomic with a remote effect. Durable replay protection requires an authoritative design suited to the actual effect boundary.",
    "mistakes": [
      "At-least-once delivery can repeat execution; make the business effect safe to retry.",
      "A lease expiry does not stop a stale worker; protect sensitive commits with fencing or conditional state."
    ],
    "takeaways": [
      "Acknowledge a job only after its required durable effect is recorded, according to the queue’s semantics.",
      "A lease prevents simultaneous ownership only under its stated timing and storage semantics."
    ],
    "formal": [
      "What may follow a crash after effect completion but before acknowledgement?|Job redelivery|Guaranteed rollback|Queue deletion|Automatic refund|The queue may retry because acknowledgement was lost even though the worker already performed the effect.",
      "Which property helps deduplicate retries of one command?|Stable command identity|New timestamp per try|Random id on retry|A changed queue name|Repeated attempts need the same logical identity to be recognized as the same intended work.",
      "A report worker repeatedly retries a malformed date string. What should the policy distinguish?|Permanent input error|Only server region|Only queue depth|Only log file suffix|Invalid input usually requires correction and should not consume endless transient-failure retries.",
      "A payment worker performs the charge then crashes before ack. What must prevent a second charge?|Idempotent effect policy|Only a longer lease|Only a new report id|Only more retry attempts|Redelivery can repeat execution, so the business effect needs authoritative replay protection.",
      "A retry storm overloads a recovering dependency. Which control helps?|Backoff and retry budget|Unlimited immediate loops|Shorter queue names|More synchronous callers|Bounded delayed retries reduce amplification and give the dependency space to recover.",
      "A paused worker resumes with lease generation 41 after generation 42 has taken ownership. Both can reach the storage service. Which control prevents generation 41 from committing after the transfer?|Enforce generation 42 at storage and reject older generations on every commit|Check generation 41 in worker memory before beginning the next long operation|Renew generation 42 more frequently while accepting writes without generation checks|Serialize queue delivery while allowing both workers to write to storage directly|The destination must enforce the current fencing generation when accepting effects. A check in stale worker memory does not observe transferred ownership; more heartbeats do not stop an old worker already running; queue serialization does not fence writes from an existing delivery.",
      "A failed financial job reaches the attempt limit and is silently dropped. What is missing?|Visible failure handling|Only a progress spinner|Only route formatting|Only a browser timeout|Exhausted important work needs durable visibility and a deliberate remediation path.",
      "An API returns report ready when the task is merely enqueued. Which contract is misleading?|Completion state|Only response casing|Only payload version|Only route prefix|Accepted work and completed work are different observable lifecycle states.",
      "A report result endpoint checks only that the caller knows the job id. What boundary is weak?|Result authorization|Only queue ordering|Only retry timing|Only schema naming|Knowing an identifier does not prove permission to read a potentially sensitive result.",
      "A worker stores deduplication only in memory and restarts. Which guarantee disappears?|Durable replay protection|Only source immutability|Only string comparison|Only local method order|Process memory does not preserve completed-command evidence across crashes or restarts."
    ],
    "practice": [
      "Does at-least-once delivery permit repeated execution?|Yes; design for duplicates|No; each handler runs once|Only with a new build|Only for invalid JSON|Redelivery is an expected possibility and requires safe repeated handling of one logical command.",
      "Which retry input should remain stable for one business action?|Command identity|Attempt timestamp|Worker process id|Connection sequence|The stable action identity supports deduplication while attempt-specific metadata can still change.",
      "What should happen to exhausted critical jobs?|Visible failure workflow|Silent deletion always|Unbounded retry forever|Automatic false success|Important failed work needs durable operational visibility and a defined remediation process.",
      "Why distinguish accepted from completed in a report API?|Work may still be pending|Queues finish instantly|Status has no meaning|Browsers enforce jobs|A queued job can remain pending or fail before producing its final committed result."
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
    "title": "Expand schema and contracts before retiring old forms",
    "before": "Review contract version overlap, database backfills and concurrency preconditions from the prerequisite courses.",
    "intro": "A customer portal has old browser tabs, new API replicas and a database backfill running simultaneously. Zero-downtime evolution is a compatibility problem across all supported versions and intermediate states. A successful final-state unit test cannot cover that transition by itself.",
    "sections": [
      [
        "Reason about the mechanism",
        "An expand-and-contract sequence first introduces compatible schema or API capabilities. New code reads a safe supported representation while old code remains functional. Backfill existing rows with bounded, restartable work and verify completion. Only then remove legacy fields after the supported rollback and client windows close.",
        "Dual writes need an explicit authoritative representation and consistency mechanism. Two independent writes can diverge if one fails. A database transaction can coordinate fields in one store, while cross-system changes require a declared reconciliation strategy. Backfill logic must not overwrite newer user writes with stale values."
      ],
      [
        "Apply and verify the decision",
        "API compatibility includes semantics, not only types. Renaming cents to amount while silently changing units can break consumers despite numeric types. Test the oldest supported consumer, error shape, nullability and enum behavior throughout overlap. Avoid claiming a route version label itself guarantees compatibility.",
        "The model accepts legacy or new stored representation and flags disagreement. It illustrates an intermediate read policy with integer cents and does not perform a real migration. Production work needs atomic writes, range validation, migration progress evidence and deployment-specific compatibility tests."
      ]
    ],
    "problem": "Read supported legacy and expanded representations while detecting disagreeing values.",
    "steps": [
      "Accept an existing legacy value during the overlap.",
      "Prefer the new value only when the two forms do not disagree.",
      "Exercise a divergent row and surface the transition error."
    ],
    "code": "function read(x){if(x.old!==undefined&&x.fresh!==undefined&&x.old!==x.fresh)throw Error(\"diverged\");return x.fresh??x.old;}console.log(read({old:700}),read({old:700,fresh:700}));try{read({old:700,fresh:800});}catch(e){console.log(e.message);}",
    "expect": "700 700\ndiverged",
    "result": "The legacy and matching expanded forms both yield 700. Disagreeing forms produce diverged instead of silently selecting a financial value. This reader does not perform a migration or validate all input types; production dual writes and backfills need concurrency-safe coordination and progress evidence.",
    "mistakes": [
      "A numeric field can change meaning incompatibly; include units in contract review.",
      "A stale backfill must not overwrite a newer user write; use conditional progress and authoritative version checks."
    ],
    "takeaways": [
      "An expand-and-contract sequence first introduces compatible schema or API capabilities.",
      "API compatibility includes semantics, not only types."
    ],
    "formal": [
      "What should happen before removing a legacy field?|Supported overlap|Immediate hard cutover|Deleting old clients|Changing only the name|A transition must support the declared old versions before the legacy representation is retired.",
      "What makes a backfill restartable safely?|Idempotent progress|A new id every run|An empty audit trail|Unbounded table locks|Restartable work needs stable progress and safe repeated processing of partially completed ranges.",
      "An old browser tab reads an API after server deployment. What assumption is unsafe?|All consumers are current|Clients can remain old|Contracts need tests|Overlap may be needed|Deployed server source does not instantly replace every running consumer.",
      "A cents field stays numeric but changes to dollars. What compatibility issue appears?|Semantic break|Only source formatting|A guaranteed additive change|Only a database alias|The unit and meaning changed even though a static numeric type stayed the same.",
      "A backfill reads an old value, then overwrites a newer user update. What control is needed?|Version-aware writes|Only a longer batch|Only a route rename|Only a new schema tag|Conditional updates or equivalent coordination prevent stale backfill data from overwriting newer authoritative writes.",
      "Two representations are updated through independent writes and one fails. What must the transition handle?|Representation divergence|Only JSON whitespace|Only source ordering|Only lockfile drift|Partial completion can leave old and new forms inconsistent without atomic coordination or reconciliation.",
      "A team drops legacy columns while old replicas still serve. What failure can result?|Old-version incompatibility|Only larger responses|Only more cache hits|Only duplicate log lines|Old binaries may still depend on fields removed before their supported overlap ended.",
      "A migration test checks only an empty final schema. What coverage is missing?|Partial migration states|Only SQL capitalization|Only artifact naming|Only module exports|Real transitions include existing data, partially migrated rows and old/new version coexistence.",
      "An enum expands and an old client rejects unknown values. What must API evolution consider?|Consumer decoding policy|Only the server type|Only response compression|Only route availability|A change that looks additive can still violate actual consumer assumptions about allowed values.",
      "A backfill is complete but the old binary remains the documented rollback target. Can old storage fields be removed immediately?|No; honor rollback support|Yes; completion is enough|Only if the UI is new|Only after renaming tags|Data migration completion does not by itself close the application rollback compatibility window."
    ],
    "practice": [
      "What is the expansion phase intended to create?|Compatible overlap|Immediate data deletion|Universal lockstep release|A secret browser key|Expansion adds support that allows consumers and data to move before legacy capabilities are removed.",
      "Why test the oldest supported consumer?|It can remain active|It owns the new schema|It bypasses auth safely|It proves all futures|Compatibility commitments apply to supported deployed consumers rather than only current source.",
      "Can a field keep its type but change incompatibly?|Yes; meaning can change|No; types define meaning|Only with a new URL|Only for string fields|Units and business semantics can change without changing the field’s static representation type.",
      "Why should a backfill use bounded batches?|Limit operational impact|Guarantee no constraints|Avoid progress records|Replace all transactions|Bounded work helps control lock duration, resource use and safe resumption during migration."
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
    "title": "Write architecture decisions with testable trade-offs",
    "before": "Review quality attributes and distinguish hard product constraints from preferred implementation properties.",
    "intro": "A product team debates caching every API response to improve speed. The useful decision is more precise: which workload is slow, what freshness can users tolerate, which authority boundary applies and how the proposal will be evaluated. An architecture decision record keeps that reasoning available when conditions change.",
    "sections": [
      [
        "Reason about the mechanism",
        "An ADR records context, requirements, decision, alternatives and consequences. Include the evidence behind the choice and assumptions that could invalidate it. A diagram alone cannot explain why a simpler approach was rejected or what cost the selected option accepts. Describe security and operational implications in terms of the actual product.",
        "Quality goals need measurable scenarios. Instead of make reports fast, specify a workload, data size, response-time target, freshness tolerance and failure behavior. Separate a hard requirement from a preference. Performance targets should be measured under representative load and should not be mistaken for universal guarantees."
      ],
      [
        "Apply and verify the decision",
        "Choose the smallest experiment that can reduce the key uncertainty. A load test can compare cache policy under realistic access distributions; a failure injection can expose retry amplification. Record limitations and a reconsideration trigger such as a sustained queue-delay threshold or a change in tenancy requirements.",
        "The model evaluates two synthetic designs against an explicit latency ceiling and a freshness ceiling, then compares feasible costs. It illustrates constrained decision making without claiming that these made-up numbers predict production. Real decisions require measurement and stakeholder agreement."
      ]
    ],
    "problem": "Reject a cheaper faster design that exceeds the allowed staleness constraint.",
    "steps": [
      "Declare candidate latency, freshness and cost measurements for the synthetic example.",
      "Filter candidates using the stated hard latency and freshness ceilings.",
      "Rank only feasible choices by cost."
    ],
    "code": "const choices=[{name:\"fresh\",ms:180,stale:0,cost:5},{name:\"cache\",ms:40,stale:30,cost:2}];const feasible=choices.filter(x=>x.ms<=200&&x.stale<=5).sort((a,b)=>a.cost-b.cost);console.log(feasible[0].name);",
    "expect": "fresh",
    "result": "Only fresh satisfies both ceilings, so its higher cost does not disqualify it under the modeled policy. The numbers are invented inputs rather than benchmark evidence. An ADR should state how real measurements were collected, which assumptions matter and when to revisit them.",
    "mistakes": [
      "Fastest is not sufficient when a hard freshness requirement fails; compare feasible alternatives.",
      "A small prototype does not establish production-scale performance; record its workload and limitations."
    ],
    "takeaways": [
      "An ADR records context, requirements, decision, alternatives and consequences.",
      "Choose the smallest experiment that can reduce the key uncertainty."
    ],
    "formal": [
      "What should an ADR preserve besides the selected option?|Context and consequences|Only the final diagram|Only the team roster|Only a package list|A decision record needs the reasons, alternatives and accepted costs that explain the choice.",
      "What makes a quality goal more testable?|A measurable scenario|A broad adjective|A fashionable tool|A service count target|A concrete workload and threshold allow the team to gather evidence about the intended quality.",
      "A cache is faster but violates required freshness. What should the decision do?|Respect the hard constraint|Choose fastest anyway|Ignore the business rule|Rename stale data as fresh|A hard requirement rules out an otherwise attractive option unless the requirement is deliberately changed.",
      "An ADR says use services because modern but records no alternatives. What is weak?|Decision rationale|Only document length|Only diagram colors|Only release labels|A useful record explains the relevant constraints and trade-offs rather than relying on fashion.",
      "A prototype meets a latency goal with ten rows, but production has millions. What limits the evidence?|Realistic workload scale|Only prototype language|Only branch protection|Only endpoint casing|A small fixture may not represent the scale and access distribution that drive production performance.",
      "A team chooses a queue but does not define acceptable delay. Which quality scenario is missing?|Completion latency|Only HTTP status style|Only file extension|Only task name format|Asynchronous delivery shifts the user-visible timing and needs an explicit completion-delay target.",
      "A key assumption about tenant isolation changes after a merger. What should happen to the ADR?|Reevaluate the decision|Freeze it permanently|Delete all history|Ignore new constraints|An architecture decision should be revisited when its stated assumptions no longer hold.",
      "A failure experiment shows retries multiplying load. What should the record include?|Observed failure cost|Only the happy path|Only component logos|Only average code size|Trade-offs should incorporate measured failure behavior as well as normal-path performance.",
      "A design review lists twenty risks with no owners or verification. What improves usefulness?|Actionable validation|Only a larger diagram|Only more acronyms|Only a new file title|Risks need concrete mitigations, responsible follow-up and evidence that the chosen control works.",
      "A requirement says never lose an accepted payment event, but the design stores it only in RAM. Which review principle applies?|Check failure guarantees|Only compare cloud prices|Only count source lines|Only inspect UI spacing|The storage and crash model must support the promised durability rather than merely match a happy-path diagram."
    ],
    "practice": [
      "What is an architecture decision record meant to explain?|Why the choice was made|Only who wrote the code|Only the current price|Only the folder tree|A useful ADR captures the context and reasoning behind a consequential technical choice.",
      "What should distinguish a hard requirement from a preference?|Declared criteria|Only text color|Only a team nickname|Only a branch label|The decision needs to say which constraints must be satisfied and which can be traded against others.",
      "Why record rejected alternatives?|Preserve the rationale|Prohibit future review|Guarantee perfect choice|Increase diagram count|Alternatives show what was considered and why the chosen option fit the recorded context.",
      "What belongs in a performance scenario?|Workload and threshold|Only tool popularity|Only module names|Only a random timeout|A performance claim needs representative conditions and a measurable target.",
      "How should a prototype limitation be handled?|State its evidence boundary|Treat it as universal|Hide it from reviewers|Convert it into approval|A prototype informs a decision only within the workload and assumptions it actually exercised.",
      "What is a useful reconsideration trigger?|A changed key assumption|Any new team photo|Only a calendar holiday|Only a renamed branch|A trigger should identify evidence or context that could invalidate the earlier reasoning.",
      "Why measure failure behavior during architecture review?|Normal paths are incomplete|Failures cannot recur|Metrics replace all logs|It removes trade-offs|Partial failures and retries can expose costs hidden by successful-path benchmarks.",
      "What should an ADR say about accepted costs?|Make them explicit|Claim they cannot exist|Omit operational work|Only name the framework|A decision remains reviewable when its consequences and accepted disadvantages are recorded."
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
    "title": "Evolve a boundary through a reversible migration seam",
    "before": "Review API compatibility, feature routing and the effect boundaries of functions proposed for replay.",
    "intro": "A mature booking application needs a new pricing engine without stopping existing customers. A gradual replacement can reduce exposure if requests pass through a deliberate seam, behavior is compared safely and ownership remains clear. The migration itself becomes a temporary architecture that needs retirement criteria.",
    "sections": [
      [
        "Reason about the mechanism",
        "A strangler-style approach routes selected capabilities to the new implementation while the legacy path remains for supported traffic. Choose a seam with clear inputs, outputs and ownership. Avoid duplicating authoritative writes across both systems without a consistency plan: two successful responses can still represent conflicting business state.",
        "Shadow reads can compare outputs without affecting the user response, but shadow operations must be safe: a function named quote may still reserve inventory or call a billable provider. Normalize nondeterministic fields before comparison and define tolerances for valid differences. Protect private customer data in copied traffic."
      ],
      [
        "Apply and verify the decision",
        "Promotion criteria should include correctness, latency, failure behavior and operational readiness for the intended cohort. Keep a compatible fallback until the agreed rollback window closes. A feature flag that switches routing cannot repair divergent stored state; the fallback must be tested against current data and contracts.",
        "The model compares two pure integer pricing functions on a finite fixture set and catches a one-cent difference. It is not a proof of full equivalence or safe live shadowing. Real migration evidence needs representative cases, side-effect analysis and explicit rollout and retirement controls."
      ]
    ],
    "problem": "Find a one-cent divergence between two pure pricing implementations on selected cases.",
    "steps": [
      "Evaluate the legacy and candidate functions on the same bounded fixture list.",
      "Retain inputs where the computed totals disagree.",
      "Print the divergent input and both totals for diagnosis."
    ],
    "code": "const old=x=>x*100,newPrice=x=>x===3?301:x*100;const cases=[1,2,3];console.log(cases.filter(x=>old(x)!==newPrice(x)).join(\",\"));console.log(old(3),newPrice(3));",
    "expect": "3\n300 301",
    "result": "Only input three differs in the fixture set: the legacy total is 300 and the candidate total is 301. This is bounded comparison evidence, not universal equivalence. Real shadowing must also assess side effects, private data, latency, failure behavior and a compatible fallback.",
    "mistakes": [
      "An operation called quote can mutate state; inspect behavior before replaying it.",
      "A routing flag cannot repair incompatible persisted data; test the fallback against current state."
    ],
    "takeaways": [
      "A strangler-style approach routes selected capabilities to the new implementation while the legacy path remains for supported traffic.",
      "Promotion criteria should include correctness, latency, failure behavior and operational readiness for the intended cohort."
    ],
    "formal": [
      "What does a migration seam make explicit?|Routing and ownership|Only package versions|Only source filenames|Only server counts|A deliberate seam identifies which implementation owns a capability for each supported traffic path.",
      "What is a shadow read intended to compare?|Implementation outputs|Only Git commit length|Only CSS module names|Only worker hostnames|Shadow comparison evaluates new behavior while the declared primary path still supplies the user response.",
      "A quote endpoint reserves stock when called. Why is blind shadowing unsafe?|It has side effects|Its name is too short|It returns a number|It lacks a new URL|An apparently read-like operation can still mutate state or incur costs when replayed.",
      "Two pricing engines both write order totals during migration. What requires explicit coordination?|Single write authority|Only router formatting|Only package pinning|Only graph styling|Duplicate authoritative writes can diverge unless one ownership and consistency policy governs them.",
      "A shadow comparison differs only because of generated timestamps. What should the comparison define?|Normalization policy|Only a larger timeout|Only a new job name|Only source map links|Nondeterministic fields need deliberate treatment so meaningful semantic differences remain visible.",
      "A new engine matches three examples. Which claim goes beyond that evidence?|Universal equivalence|Those cases agree|The functions were called|The fixture set is small|A finite fixture set cannot establish correctness for every possible input and failure condition.",
      "A fallback flag routes to old code that cannot read new data. What is missing?|Fallback compatibility|Only feature naming|Only branch display|Only static caching|Routing reversibility is useful only if the fallback can still operate on current state and contracts.",
      "Shadow traffic copies full private customer payloads into a new system. What must be reviewed?|Data handling boundary|Only endpoint speed|Only source file size|Only release note style|Copied traffic introduces another data-processing boundary requiring appropriate minimization and controls.",
      "The new route is correct but cannot be operated by the on-call team. What promotion criterion is unmet?|Operational readiness|Only test fixture count|Only function naming|Only build byte size|A production capability needs monitoring, runbooks and ownership in addition to functional behavior.",
      "A migration seam remains indefinitely with two sources of truth. What should the architecture record define?|Retirement and ownership|Only a new diagram|Only a longer timeout|Only weekly status text|Temporary coexistence needs explicit completion criteria and authoritative ownership to avoid permanent ambiguity."
    ],
    "practice": [
      "Does a routing flag by itself make a data migration reversible?|No; state compatibility matters|Yes; flags restore every row|Only with many source files|Only for a new host|Switching code paths does not undo data changes or make old code compatible with current state.",
      "Why inspect side effects before shadowing requests?|Replay may mutate state|Method names prove safety|Every GET is harmless|Copies cannot incur cost|Shadow execution can repeat writes or external charges unless the operation is proven safe to replay.",
      "What should determine retirement of the legacy path?|Explicit completion evidence|Only developer preference|Only the new folder name|Only one happy request|Retirement needs evidence that supported traffic, recovery and ownership conditions are satisfied.",
      "What does a finite comparison fixture establish?|Results for tested cases|All future correctness|No production failures|No authorization defects|A fixture provides bounded evidence for its chosen inputs rather than a universal equivalence proof."
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
    "id": "react-state",
    "title": "React state ownership and redundant state",
    "url": "https://github.com/reactjs/react.dev/blob/7594a2b008489121bdf25f97320d11ac0422510e/src/content/learn/choosing-the-state-structure.md",
    "source": {
      "repo": "reactjs/react.dev",
      "commit": "7594a2b008489121bdf25f97320d11ac0422510e",
      "path": "src/content/learn/choosing-the-state-structure.md",
      "verification": "Inspected official source at this exact Git revision. Offline examples model bounded policies and require human review before production application."
    }
  },
  {
    "id": "node-errors",
    "title": "Node error propagation and asynchronous boundaries",
    "url": "https://github.com/nodejs/node/blob/b009466555c360513b8012ce549f716501090ee5/doc/api/errors.md",
    "source": {
      "repo": "nodejs/node",
      "commit": "b009466555c360513b8012ce549f716501090ee5",
      "path": "doc/api/errors.md",
      "verification": "Inspected official source at this exact Git revision. Offline examples model bounded policies and require human review before production application."
    }
  },
  {
    "id": "node-async",
    "title": "Node async context and request correlation",
    "url": "https://github.com/nodejs/node/blob/b009466555c360513b8012ce549f716501090ee5/doc/api/async_context.md",
    "source": {
      "repo": "nodejs/node",
      "commit": "b009466555c360513b8012ce549f716501090ee5",
      "path": "doc/api/async_context.md",
      "verification": "Inspected official source at this exact Git revision. Offline examples model bounded policies and require human review before production application."
    }
  },
  {
    "id": "express-routing",
    "title": "Express application and routing boundary implementation",
    "url": "https://github.com/expressjs/express/blob/1faf228935aa0a13111f92c28ee795be64ce3f0f/lib/application.js",
    "source": {
      "repo": "expressjs/express",
      "commit": "1faf228935aa0a13111f92c28ee795be64ce3f0f",
      "path": "lib/application.js",
      "verification": "Inspected official source at this exact Git revision. Offline examples model bounded policies and require human review before production application."
    }
  },
  {
    "id": "express-errors",
    "title": "Express 4 routing and error callback boundaries",
    "url": "https://github.com/expressjs/express/blob/1faf228935aa0a13111f92c28ee795be64ce3f0f/test/app.router.js",
    "source": {
      "repo": "expressjs/express",
      "commit": "1faf228935aa0a13111f92c28ee795be64ce3f0f",
      "path": "test/app.router.js",
      "verification": "Inspected official source at this exact Git revision. Offline examples model bounded policies and require human review before production application."
    }
  }
];
const built=build('fullstack-architecture',units,refs);module.exports=built.course;Object.defineProperty(module.exports,'formal',{value:built.formal});
