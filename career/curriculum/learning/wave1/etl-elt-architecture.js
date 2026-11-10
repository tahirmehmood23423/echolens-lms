'use strict';
const {course}=require('./warehouse-wave3-helper');
const specs=[
  {
    "id": "etl-placement",
    "comps": [
      "m1.c1"
    ],
    "title": "Choose ETL or ELT from trust, cost and capability",
    "intro": "A health-services analyst needs a patient-safe utilization mart. The architecture must decide where sensitive records are transformed and which raw fields are allowed to cross each boundary.",
    "sections": [
      [
        "Model the business contract",
        "Extract, transform, load means transformations happen before the target analytical load. Extract, load, transform means source data is loaded into a target or staging environment and transformed there. These names describe placement, not intrinsic reliability. Both need validation, authorization, lineage and recovery. A pipeline may combine the patterns, filtering restricted fields before loading and performing analytical joins inside the warehouse.",
        "ETL can reduce target exposure and exploit an external processing runtime, but changing transformation logic may require re-extraction if source detail was discarded. ELT can retain source fidelity and use warehouse compute, but raw access must be restricted and retention controlled. Loading unvalidated data into a raw zone does not make it trustworthy or suitable for broad analyst access."
      ],
      [
        "Work through the decision and its limits",
        "Evaluate source pressure, egress charges, target compute cost, transformation complexity and recovery requirements. If a source API permits only a small extraction window, preserving a lawful immutable landing copy can support reprocessing. If policy forbids certain identifiers in the warehouse, remove or irreversibly transform them before that boundary rather than relying on a dashboard filter.",
        "The fixture projects an allowed field set before a simulated analytical load. It shows a field-removal boundary rather than cryptographic anonymization: remaining quasi-identifiers may still permit reidentification. A production design needs data classification, access controls and tests against actual services; local Python execution cannot verify regulatory compliance or a warehouse security policy."
      ]
    ],
    "problem": "Choose ETL or ELT from trust, cost and capability using a synthetic fixture.",
    "steps": [
      "Declare the record grain, keys and time meaning in the fixture.",
      "Trace the transformation and compare it with the stated invariant.",
      "Inspect the output and explain the remaining production assumptions."
    ],
    "code": "records=[{'patient_id':'p1','region':'west','visits':3}]\nallowed={'region','visits'}\nloaded=[{k:v for k,v in r.items() if k in allowed} for r in records]\nassert all('patient_id' not in r for r in loaded)\nprint(loaded)",
    "expect": "[{'region': 'west', 'visits': 3}]",
    "limit": "Python validates a field projection only. No actual API, warehouse, PostgreSQL/WASM, security policy or anonymization certification is exercised.",
    "practice": [
      [
        "What distinguishes ETL from ELT?",
        "Transformation placement",
        "Delivery guarantee",
        "Source schema version",
        "Batch scheduling frequency",
        "ETL transforms before the target load while ELT transforms after loading into the target environment."
      ],
      [
        "Does loading raw data make it trusted?",
        "No",
        "Yes after syntax validation",
        "Yes after copying to staging",
        "Yes if retained immutably",
        "Raw landing preserves source data but does not establish semantic quality or safe access."
      ],
      [
        "What can early field projection reduce?",
        "Sensitive-field exposure",
        "All linkage risk",
        "All unauthorized access",
        "All source schema changes",
        "Removing prohibited fields before a boundary reduces their exposure but does not prove anonymity."
      ],
      [
        "A warehouse policy forbids direct patient ids. Where must removal occur?",
        "Before warehouse entry",
        "After analyst access",
        "At dashboard rendering",
        "In exported reports",
        "A prohibited field should not cross the restricted storage boundary in the first place."
      ],
      [
        "A team discards raw detail before loading and later changes business rules. What recovery risk grows?",
        "Re-extraction dependency",
        "Auto duplicate creation",
        "Auto metric versioning",
        "Certain source retention",
        "Reprocessing may require the original detail, which may no longer be available from the source."
      ],
      [
        "An ELT raw zone is opened to every analyst. What is missing?",
        "Restricted access",
        "Larger warehouse",
        "Index on identifiers",
        "New load schedule",
        "Raw landing often includes sensitive and unvalidated fields and requires governed access."
      ],
      [
        "A pipeline filters identifiers externally and aggregates in the warehouse. Which description fits?",
        "A hybrid placement design",
        "ETL is possible",
        "ELT is possible",
        "Delivery-semantics guarantee",
        "ETL and ELT steps can be combined to satisfy different trust and processing boundaries."
      ]
    ],
    "formal": [
      [
        "What does extraction do?",
        "Reads source data",
        "Certifies all source records",
        "Transforms every target field",
        "Approves downstream publication",
        "Extraction obtains records from a source under a defined access and consistency contract."
      ],
      [
        "What does transformation include?",
        "Changing shape or meaning",
        "Transferring bytes",
        "Authenticating requests",
        "Allocating storage",
        "Transformations can filter, normalize, enrich and aggregate data."
      ],
      [
        "What must both ETL and ELT provide?",
        "Validation and recovery",
        "Identical deployment hardware",
        "Universal raw-zone access",
        "Unlimited extraction capacity",
        "Placement does not remove the need for quality, governance and operational recovery."
      ],
      [
        "A source deletes exports after one day but rules may change next month. What lawful capability helps?",
        "A restricted landing copy",
        "Dashboard result cache",
        "Current aggregate totals",
        "Renamed metric",
        "A governed retained copy can support reprocessing after source availability ends."
      ],
      [
        "A business chooses ELT only because warehouse compute is powerful. Which missing factor matters?",
        "Exposure and total cost",
        "Maximum compute size",
        "Target SQL dialect",
        "Source width",
        "Placement decisions must include governance and operating economics as well as processing capability."
      ],
      [
        "An external transform removes names but retains rare location and dates. What remains possible?",
        "Quasi-identifier linkage",
        "Certain full anonymity",
        "Auto field encryption",
        "Certain nonlinkability",
        "Removing direct identifiers alone does not eliminate linkage risk from remaining attributes."
      ],
      [
        "A pipeline must avoid stressing a transactional source. What should extraction design consider?",
        "Source load and timing",
        "Target chart refresh speed",
        "Number of dimensions",
        "Report display precision",
        "Queries, frequency and snapshot methods can affect operational capacity."
      ],
      [
        "An ELT model needs a new join using a field never landed. What is required?",
        "A source-contract change",
        "New target alias",
        "Model rebuild",
        "Larger target numeric type",
        "The target cannot compute information that the extraction contract never captured."
      ],
      [
        "A raw file parses correctly but amount units changed from cents to dollars. What is unverified?",
        "Semantic compatibility",
        "JSON syntactic validity",
        "Existence of the file",
        "Ability to read bytes",
        "Syntactic validity does not establish that values retain their contractual meaning."
      ],
      [
        "A local projection test excludes one id field. What does it establish?",
        "Fixture projection",
        "Full regulatory compliance",
        "Universal source anonymity",
        "Warehouse access enforcement",
        "The fixture verifies a narrow transformation and cannot certify the production governance system."
      ]
    ],
    "lang": "python",
    "mistakes": [
      "Treating ELT as permission to expose raw data.",
      "Assuming field removal proves anonymity."
    ],
    "takeaways": [
      "Choose placement from explicit constraints.",
      "Separate raw preservation from trust."
    ]
  },
  {
    "id": "etl-incremental",
    "comps": [
      "m1.c1"
    ],
    "title": "Design incremental extraction with stable boundaries",
    "intro": "An invoicing source exposes updated_at but several invoices can share the same timestamp. A timestamp-only cursor can silently miss rows when an extraction page ends halfway through a tie.",
    "sections": [
      [
        "Model the business contract",
        "A full load re-reads the eligible source population, while an incremental load reads changes since a previous boundary. Incremental designs reduce repeated work but require a trustworthy change indicator, deletion strategy and checkpoint protocol. A created_at field does not detect later updates. A source clock that moves backward or an update timestamp with insufficient precision can undermine a naive high-water mark.",
        "Use a stable total order such as updated_at plus a unique source id for keyset pagination when the source supports that contract. The next page uses a lexicographic condition: timestamp greater than the cursor timestamp, or equal timestamp with id greater than the cursor id. Stable ordering still needs a consistent source snapshot or a strategy for concurrent updates and moving records."
      ],
      [
        "Work through the decision and its limits",
        "A fixed extraction upper boundary separates the current run from later arrivals. Persist the new checkpoint only after the corresponding target changes are durable. If timestamp updates can arrive behind the high-water mark, re-read a bounded overlap and deduplicate by stable event or entity versions. An overlap is a bounded risk policy, not proof that arbitrarily late changes are covered.",
        "The fixture compares a timestamp-only next-page filter with a tuple cursor and reveals the missing tied row. It does not connect to a source or simulate concurrent updates. Production verification must establish timestamp semantics, tie ordering, snapshot behavior and whether the API\u2019s cursor is opaque or safely comparable."
      ]
    ],
    "problem": "Design incremental extraction with stable boundaries using a synthetic fixture.",
    "steps": [
      "Declare the record grain, keys and time meaning in the fixture.",
      "Trace the transformation and compare it with the stated invariant.",
      "Inspect the output and explain the remaining production assumptions."
    ],
    "code": "rows=[(10,'a'),(10,'b'),(11,'c')]\ncursor=(10,'a')\nprint([key for ts,key in rows if ts>cursor[0]])\nprint([key for ts,key in rows if (ts,key)>cursor])",
    "expect": "['c']\n['b', 'c']",
    "limit": "Python validates tuple boundary logic. It does not execute API pagination, concurrent snapshots, native PostgreSQL logical replication or a WASM source database.",
    "practice": [
      [
        "What does an incremental load rely on?",
        "A change boundary",
        "Batch row count",
        "Target primary key",
        "File creation date",
        "The pipeline needs a defined way to identify source changes since the prior processed state."
      ],
      [
        "Does created_at alone detect later updates?",
        "No",
        "Yes for all later changes",
        "For nonnull columns",
        "For numeric amounts",
        "An unchanged creation timestamp does not identify modifications after the row was created."
      ],
      [
        "What makes a tuple cursor useful?",
        "Stable tie ordering",
        "Auto source clock repair",
        "Auto deletion capture",
        "Certain source availability",
        "A unique tie-breaker distinguishes rows sharing the same timestamp."
      ],
      [
        "A page ends after invoice a at time 10 and b also has time 10. What does time greater than 10 omit?",
        "Invoice b",
        "Invoice a again",
        "All future invoices",
        "Deleted invoices",
        "A strict timestamp-only filter skips unprocessed rows tied at the page boundary."
      ],
      [
        "A source can backdate updates by one day. What mitigation may help within that bound?",
        "Deduplicated overlap",
        "Creation-time-only cursor",
        "Fresh random cursor",
        "Target sort order only",
        "Re-reading a known overlap can capture bounded late changes if duplicates are handled safely."
      ],
      [
        "The checkpoint advances before the target commit fails. What is the risk?",
        "Skipped source changes",
        "Harmless duplicate reads",
        "Auto source rollback",
        "Certain retry recovery",
        "The next run may start beyond changes that were never made durable in the target."
      ],
      [
        "An API supplies an opaque next-page token. What should the client do?",
        "Follow the token contract",
        "Sort tokens as timestamps",
        "Increment token characters",
        "Replace tokens with page counts",
        "Opaque cursors should be used as documented rather than interpreted as sortable values."
      ]
    ],
    "formal": [
      [
        "What is a high-water mark?",
        "A change boundary",
        "Largest source amount",
        "Latest report date",
        "Maximum target row count",
        "A high-water mark records progress through a source change ordering."
      ],
      [
        "Why include a unique tie-breaker in pagination?",
        "To define a total order",
        "To make every time unique",
        "To eliminate source deletes",
        "To prevent all concurrent writes",
        "A tie-breaker orders otherwise equal timestamp rows deterministically."
      ],
      [
        "What does a fixed run upper bound provide?",
        "A bounded run interval",
        "Auto deletion coverage",
        "Certain source clock accuracy",
        "Unlimited retry budget",
        "It separates changes assigned to the current run from later changes under the source contract."
      ],
      [
        "An invoice changes after its first extraction but created_at stays unchanged. Which cursor is insufficient?",
        "Creation-time only",
        "Reliable update sequence",
        "Valid committed log position",
        "Documented CDC event offset",
        "Creation time does not reflect later modifications."
      ],
      [
        "A timestamp cursor has one-second resolution and many writes per second. What must be addressed?",
        "Ties and consistency",
        "Target decimal precision",
        "Field ordering",
        "Target partition naming",
        "Several changes can share the cursor value, requiring a tie strategy and consistent pagination."
      ],
      [
        "A pipeline replays a two-day overlap but updates may arrive a month late. What remains uncovered?",
        "Beyond-bound changes",
        "Already replayed rows",
        "Correctly ordered changes",
        "Future optional fields",
        "A bounded overlap cannot guarantee capture of arbitrarily late modifications."
      ],
      [
        "A source row moves between pages while being updated. Which property is needed for exact extraction?",
        "Snapshot or log semantics",
        "Larger page limit",
        "Timestamp text sorting",
        "Target aliases",
        "Stable pagination requires a defined view of concurrent source changes or a log that records them."
      ],
      [
        "A job fails after committing data but before saving its cursor. What should a safe rerun tolerate?",
        "Committed-change replay",
        "Losing all prior source keys",
        "Skipping every old interval",
        "Changing event identities",
        "The repeated interval must be safe through idempotent or deduplicated target application."
      ],
      [
        "A team assumes source clocks never regress without evidence. What is missing?",
        "Source ordering semantics",
        "Source row count",
        "Target index density",
        "Naming consistency",
        "Incremental correctness depends on how the source assigns and orders change indicators."
      ],
      [
        "A local tuple filter includes b and c. What production guarantee remains untested?",
        "Concurrent pagination",
        "Python tuple comparison",
        "Fixture tuple ordering",
        "Literal cursor value",
        "The model verifies comparison logic but not real API or database snapshot semantics."
      ]
    ],
    "lang": "python",
    "mistakes": [
      "Using creation time as an update cursor.",
      "Advancing progress before durable application."
    ],
    "takeaways": [
      "Use stable ordering and explicit bounds.",
      "Treat overlap as a bounded policy."
    ]
  },
  {
    "id": "etl-cdc",
    "comps": [
      "m1.c2"
    ],
    "title": "Capture updates and deletes without inventing exactly-once delivery",
    "intro": "A fulfillment database updates shipment status and deletes abandoned records. A nightly query of current rows cannot reliably identify every deletion or reconstruct the order of changes.",
    "sections": [
      [
        "Model the business contract",
        "Change data capture records inserts, updates and deletes using a source mechanism such as a database log or triggers. Log-based capture can preserve an ordered source position and reduce repeated table scans. Initial snapshot and ongoing stream must meet at a consistent boundary; otherwise changes can be missed between the snapshot read and stream subscription.",
        "PostgreSQL logical decoding exposes changes through replication slots and output plugins. Slots retain WAL needed by consumers, so stalled consumption can increase retained log volume and disk pressure. Update and delete identification depends on replica identity and the publication or decoding configuration. A primary key often provides row identity, but exact old-column availability must be checked against the source configuration."
      ],
      [
        "Work through the decision and its limits",
        "A delivered change should carry a stable source position and enough identity to apply its operation. At-least-once delivery means a consumer may see the same change again after a failure; deduplicate or apply versions conditionally. An external checkpoint and target transaction are not automatically atomic. Claims of exactly-once effects require a concrete protocol across the relevant boundary, not merely a queue setting.",
        "The fixture applies a small ordered log containing an insert, update and delete, rejecting a repeated source offset. It verifies local replay semantics with an in-memory dictionary. It does not start a PostgreSQL slot, inspect WAL, test failover positions or validate a distributed delivery guarantee. Those remain explicit operational and expert-review tasks."
      ]
    ],
    "problem": "Capture updates and deletes without inventing exactly-once delivery using a synthetic fixture.",
    "steps": [
      "Declare the record grain, keys and time meaning in the fixture.",
      "Trace the transformation and compare it with the stated invariant.",
      "Inspect the output and explain the remaining production assumptions."
    ],
    "code": "log=[(1,'upsert','a',10),(2,'upsert','a',20),(3,'delete','a',None),(3,'delete','a',None)]\nstate={};seen=set()\nfor pos,op,key,value in log:\n if pos in seen:continue\n if op=='delete':state.pop(key,None)\n else:state[key]=value\n seen.add(pos)\nprint(state)\nprint(sorted(seen))",
    "expect": "{}\n[1, 2, 3]",
    "limit": "Python simulates an ordered change log only. Native PostgreSQL slots, publications, WAL retention, WASM and cross-system exactly-once effects are not executed.",
    "practice": [
      [
        "What does CDC capture?",
        "Changes and deletions",
        "Current table state",
        "Periodic aggregate totals",
        "Extraction job failures",
        "CDC represents changes to source records, including operations absent from current-state queries."
      ],
      [
        "What identifies progress in a change log?",
        "A source position",
        "Maximum amount",
        "Latest table row id",
        "Worker start time",
        "A durable source position establishes where the consumer has progressed in the log."
      ],
      [
        "What can a stalled PostgreSQL replication slot retain?",
        "Required WAL",
        "Dashboard result caches",
        "Target transaction locks",
        "Source query text",
        "Replication slots can hold required WAL until progress permits its release."
      ],
      [
        "A deleted shipment vanishes from a current-row query. What cannot that query alone reveal?",
        "The deletion event",
        "Current source row count",
        "Remaining shipment ids",
        "Present source schema",
        "Current state does not automatically contain deletion history."
      ],
      [
        "A snapshot ends before stream capture starts. What risk exists in the gap?",
        "Missed changes",
        "Certain duplicate keys only",
        "Certain loss of all rows",
        "Auto snapshot recovery",
        "Changes occurring between inconsistent snapshot and stream boundaries may be absent from both."
      ],
      [
        "A consumer receives the same log event twice after restart. Which control helps?",
        "Event deduplication",
        "New random event identity",
        "Longer retry delay",
        "Larger page size",
        "A durable source identity or version allows repeated delivery to be recognized safely."
      ],
      [
        "A slot consumer is offline for days. What should operations monitor?",
        "WAL and disk pressure",
        "Target query row counts",
        "Consumer CPU usage",
        "Checkpoint filename size",
        "Unconsumed log retention can consume source storage and threaten availability."
      ],
      [
        "A PostgreSQL logical-decoding client restarts after a server crash and sees recent positions again. What must its application tolerate?",
        "Repeated source changes",
        "Schema renames",
        "Fresh event identities",
        "No replay under any crash",
        "Logical slot progress can rewind to a checkpoint after a crash, so clients must prevent repeated effects."
      ]
    ],
    "formal": [
      [
        "What does at-least-once delivery permit?",
        "Repeated messages",
        "No duplicates after restart",
        "Exactly one external effect",
        "Auto source ordering",
        "The delivery contract allows duplicates, so the consumer must handle them."
      ],
      [
        "What is replica identity relevant to?",
        "Changed-row identity",
        "Choosing a source index name",
        "Naming target batch files",
        "Selecting warehouse partitions",
        "Replica identity determines which identifying column information is available for relevant logical changes."
      ],
      [
        "What must connect snapshot and change stream?",
        "A consistent handoff",
        "Equal batch row counts",
        "Common table prefix",
        "Matching extraction dates",
        "A coordinated boundary prevents a change from falling between the initial state and ongoing stream."
      ],
      [
        "A delete event contains no usable row identity. What is blocked?",
        "Target delete application",
        "All future source insert",
        "Source schema query",
        "All target database commit",
        "The consumer needs an identifier to determine which target entity the deletion affects."
      ],
      [
        "A queue says exactly-once delivery but target writes use a separate transaction. What remains unproven?",
        "Exactly-once effects",
        "That message payloads exist",
        "That queue offsets can be read",
        "That targets exist",
        "A delivery label does not make the queue checkpoint and external database commit atomic."
      ],
      [
        "An older update arrives after a newer update for the same entity. Which guard can prevent regression?",
        "Source-version checks",
        "Newer arrival timestamp",
        "Larger worker queue",
        "Random retry jitter",
        "Conditional application by a valid per-entity ordering rejects stale updates."
      ],
      [
        "A PostgreSQL slot falls behind while the source keeps writing. What risk grows?",
        "Source storage exhaustion",
        "Auto source compression",
        "Certain faster source scans",
        "Auto consumer backfill",
        "Required WAL can accumulate and consume disk while a slot is not advancing."
      ],
      [
        "A CDC design captures updates but ignores deletes. What can analytics retain incorrectly?",
        "Stale deleted entities",
        "Future source inserts",
        "Rejected schema versions",
        "Uncommitted source writes",
        "Without deletion handling, target state can keep entities that no longer belong in the source population."
      ],
      [
        "A failover changes the available log history. What needs a recovery plan?",
        "Position recovery policy",
        "Target column mappings",
        "Connector retry jitter",
        "Dashboard output ordering",
        "The pipeline must know whether its saved position remains readable and how to recover if it does not."
      ],
      [
        "An in-memory CDC replay passes. What expert evidence is still needed?",
        "Real slot/recovery tests",
        "Dictionary updates",
        "Printing source offsets",
        "Sorting the seen positions",
        "Local replay does not exercise actual PostgreSQL decoding, WAL retention or failover semantics."
      ]
    ],
    "lang": "python",
    "mistakes": [
      "Equating current-state scans with deletion capture.",
      "Calling queue delivery exactly-once target effects."
    ],
    "takeaways": [
      "Coordinate snapshot and stream boundaries.",
      "Monitor source retention and replay safety."
    ]
  },
  {
    "id": "etl-idempotent",
    "comps": [
      "m2.c1"
    ],
    "title": "Make retries preserve the intended target state",
    "intro": "A billing import writes a batch and the worker crashes before acknowledging success. The next worker must rerun the batch without charging or counting the same source event twice.",
    "sections": [
      [
        "Model the business contract",
        "An idempotent operation has the same intended effect when repeated with the same identity and payload. A blind INSERT is generally not idempotent because replay adds another row. A target key derived from a stable source identity can support upsert or insert-on-conflict behavior. Do not generate a fresh random identity on every retry, because the target then cannot recognize the repeated event.",
        "Separate immutable events from mutable entity state. An immutable event ledger can reject duplicate event ids and reject conflicting payloads under the same id. A mutable entity upsert should compare source versions so that an old replay cannot overwrite a newer state. An additive update such as balance = balance + amount repeats the effect unless guarded by a durable event application record."
      ],
      [
        "Work through the decision and its limits",
        "Commit target changes and the applied-batch marker in one target transaction when feasible. Acknowledge or advance the external checkpoint after commit. A crash before commit rolls back the unit; a crash after commit but before acknowledgement causes replay, which the same durable marker must tolerate. This provides a concrete effect guarantee within its stated scope rather than a universal distributed exactly-once claim.",
        "The example uses Python\u2019s in-memory SQLite with a primary-keyed event table and parameterized insert-on-conflict handling. Applying the same batch twice leaves one event and a single amount. It does not test a concurrent worker race, persistent disk recovery or PostgreSQL transaction syntax. A separate conflict-payload rule is necessary if reuse of an event id with different contents is possible."
      ]
    ],
    "problem": "Make retries preserve the intended target state using a synthetic fixture.",
    "steps": [
      "Declare the record grain, keys and time meaning in the fixture.",
      "Trace the transformation and compare it with the stated invariant.",
      "Inspect the output and explain the remaining production assumptions."
    ],
    "code": "import sqlite3\nc=sqlite3.connect(':memory:')\nc.execute('CREATE TABLE event(id TEXT PRIMARY KEY, amount INTEGER)')\nfor _ in range(2):\n with c:\n  c.execute('INSERT INTO event VALUES (?,?) ON CONFLICT(id) DO NOTHING',('e1',40))\nprint(c.execute('SELECT COUNT(*),SUM(amount) FROM event').fetchone())",
    "expect": "(1, 40)",
    "limit": "Python executes real SQLite in memory with parameter binding and a uniqueness constraint. This is not PostgreSQL/WASM execution, multi-connection isolation or a persistent storage crash test.",
    "practice": [
      [
        "What does idempotent replay preserve?",
        "The same intended effect",
        "Fresh event for every retry",
        "Larger total on every replay",
        "New source version each time",
        "Repeating the same logical operation should not add another effect."
      ],
      [
        "What identity supports retry deduplication?",
        "A stable source event id",
        "Fresh retry-attempt UUID",
        "Worker process id",
        "Target ingestion time",
        "The repeated source operation must retain an identity the target can recognize."
      ],
      [
        "Is balance equals balance plus amount inherently replay-safe?",
        "No",
        "Yes if amounts are positive",
        "Yes if the table is small",
        "Yes if a primary key exists",
        "Repeating an additive update repeats its effect unless a durable guard prevents reapplication."
      ],
      [
        "A worker inserts the same event after an acknowledgement loss. What should prevent duplication?",
        "A target uniqueness guard",
        "Longer acknowledgement wait",
        "New consumer process",
        "Target row-count alert",
        "A durable unique identity can stop the repeated logical event from creating another row."
      ],
      [
        "A stale upsert overwrites a newer customer state. What was missing?",
        "A source-version guard",
        "Latest arrival time",
        "Target surrogate key",
        "Column ordering",
        "Entity state needs an ordering rule so old replays cannot regress the target."
      ],
      [
        "A batch marker commits but its data transaction fails separately. What is the risk?",
        "False completion",
        "Extra harmless retries",
        "Auto target rollback",
        "Certain source repair",
        "A marker stored independently can claim that data was applied when it was not."
      ],
      [
        "An event id is reused with a different amount. What should a ledger do?",
        "Reject/investigate reuse",
        "Ignore every conflicting amount",
        "Generate a new event id",
        "Apply both values without review",
        "An immutable identity should not silently accept inconsistent payloads."
      ]
    ],
    "formal": [
      [
        "What does a unique event key enforce?",
        "One stored row per key",
        "Correct amount units",
        "Complete source extraction",
        "Correct event-time attribution",
        "Uniqueness prevents duplicate keyed rows but does not validate the business meaning of their values."
      ],
      [
        "What is an immutable event ledger intended to retain?",
        "Stable event facts",
        "Current entity state",
        "Newest batch count",
        "Temporary staging results",
        "An event ledger preserves distinct event identities and payloads for replay and audit."
      ],
      [
        "When should an external acknowledgement normally follow a target commit?",
        "After durable application",
        "Before any target write",
        "Before completing extraction",
        "Before validating the payload",
        "Acknowledging first risks losing changes if target application then fails."
      ],
      [
        "A worker crashes before a transaction commits. What should the target transaction provide?",
        "Atomic unit rollback",
        "Partial batch marker",
        "Partial new balance",
        "Fresh source identity",
        "The transaction boundary should avoid exposing a partially applied unit."
      ],
      [
        "A worker crashes after commit but before acknowledgement. What must the rerun tolerate?",
        "Same-batch reapplication",
        "Permanently skipped batch",
        "New source identities",
        "Complete target reset",
        "This failure window naturally causes repeated work, so target effects must be replay-safe."
      ],
      [
        "A retry generates a different UUID for the same source event. Why is that unsafe for deduplication?",
        "Replay appears new",
        "UUID storage is unsupported",
        "All UUID values are equal",
        "Old event cannot be read",
        "Deduplication needs stable logical identity across attempts."
      ],
      [
        "A target uses DO NOTHING on conflicts but payloads may differ. What extra control is required?",
        "Payload conflict checks",
        "Counting conflict rows",
        "Increasing retry attempts",
        "Widening the event id",
        "Ignoring duplicates alone can conceal reuse of the same id for inconsistent event content."
      ],
      [
        "An upsert applies version 4 after version 7. What should a version-aware condition do?",
        "Reject the stale change",
        "Replace version 7",
        "Add version numbers",
        "Delete the entity key",
        "A monotonic source version guard prevents target state from moving backward."
      ],
      [
        "A job claims exactly-once effects based on a local marker. What scope must be stated?",
        "Protected effect scope",
        "Database product name",
        "Queue configuration",
        "Worker hostname",
        "A marker protects only operations coordinated with it, not unrelated external side effects."
      ],
      [
        "The SQLite retry fixture passes twice. What production behavior remains untested?",
        "Concurrency and recovery",
        "Inserted amount value",
        "Observed row count",
        "Local SQL conflict path",
        "An in-memory single-connection test does not establish multiworker concurrency or disk crash durability."
      ]
    ],
    "lang": "python",
    "mistakes": [
      "Creating a new logical id on every retry.",
      "Committing markers separately from data."
    ],
    "takeaways": [
      "Use durable stable identities.",
      "State the exact transaction scope."
    ]
  },
  {
    "id": "etl-late-events",
    "comps": [
      "m2.c2"
    ],
    "title": "Handle late events with event-time and correction policies",
    "intro": "A logistics dashboard closes yesterday\u2019s delivery count at midnight, but driver devices can upload events two days later. Arrival time and business event time must remain distinct.",
    "sections": [
      [
        "Model the business contract",
        "Event time describes when the business occurrence happened; ingestion time describes when the pipeline observed it. Late data arrives after the processing system has already moved beyond the event\u2019s business period. Preserve both timestamps so analysts can reason about business dates and operators can measure latency. Reject implausible timestamps through a documented policy rather than silently assigning them to the current day.",
        "A watermark is a processing estimate or policy boundary for how far event-time progress has advanced. Its exact semantics depend on the engine and configuration. A grace period can keep recent windows open for corrections, but it does not prove no later events exist. Define what happens beyond the limit: reopen historical partitions, publish adjustment records or route the event to an explicit review queue."
      ],
      [
        "Work through the decision and its limits",
        "Correction logic must be idempotent. Recompute a bounded affected partition from authoritative deduplicated inputs, or apply a uniquely identified adjustment with a durable application guard. A late event may also need an earlier dimension version. If totals are restated, expose the revision time so consumers do not mistake a changed historical chart for a current-period business shock.",
        "The fixture groups two delivery events by event day and separately by arrival day. The different distributions are both valid observations of different time concepts. It validates grouping logic only; it does not implement a stream engine watermark, distributed state recovery or timezone conversion. A production lateness policy needs evidence from the source delay distribution and the business cost of corrections."
      ]
    ],
    "problem": "Handle late events with event-time and correction policies using a synthetic fixture.",
    "steps": [
      "Declare the record grain, keys and time meaning in the fixture.",
      "Trace the transformation and compare it with the stated invariant.",
      "Inspect the output and explain the remaining production assumptions."
    ],
    "code": "from collections import Counter\nevents=[('2026-03-01','2026-03-01'),('2026-03-01','2026-03-03')]\nprint(dict(Counter(event for event,arrival in events)))\nprint(dict(Counter(arrival for event,arrival in events)))",
    "expect": "{'2026-03-01': 2}\n{'2026-03-01': 1, '2026-03-03': 1}",
    "limit": "Python checks event-day versus arrival-day grouping. It does not implement actual watermarks, stream recovery, PostgreSQL/WASM or warehouse partition reopening.",
    "practice": [
      [
        "What does event time identify?",
        "Business occurrence time",
        "When the loader received it",
        "When the dashboard published it",
        "When the source was queried",
        "Event time refers to the occurrence rather than the pipeline observation."
      ],
      [
        "What does ingestion time identify?",
        "Pipeline observation time",
        "Always the original occurrence",
        "Always the accounting close",
        "Always the device timezone",
        "Ingestion time records arrival into the processing system."
      ],
      [
        "Does a grace period prove no later events exist?",
        "No",
        "Yes after every window close",
        "Yes for a configured watermark",
        "Yes after the source restarts",
        "A bounded lateness policy does not eliminate the possibility of arrivals beyond the bound."
      ],
      [
        "A driver uploads Monday deliveries on Wednesday. Which day belongs in an event-day count?",
        "Monday",
        "Wednesday always",
        "Device upload batch day",
        "Report publication day",
        "The event-day metric groups by occurrence date, while arrival-day metrics describe ingestion."
      ],
      [
        "A late correction is applied twice. What control is needed?",
        "Idempotent corrections",
        "Longer grace period",
        "Later ingestion timestamp",
        "Wider numeric type",
        "Corrections need the same replay safety as ordinary loads."
      ],
      [
        "A historical total changes after backfill. What should consumers see?",
        "Restatement metadata",
        "Current publish badge",
        "Latest row sort",
        "Source file name",
        "Users need to distinguish retrospective corrections from current-period behavior."
      ],
      [
        "A March event arrives after the customer moves in April. What may enrichment require?",
        "March-valid dimensions",
        "Always the current customer",
        "Arrival-time dimension",
        "Newest surrogate key",
        "Historical enrichment should use the event-valid dimension when that is the metric contract."
      ]
    ],
    "formal": [
      [
        "What is late data relative to?",
        "Processing/window policy",
        "Lexical event-id order",
        "File path order",
        "Partition name",
        "Lateness is defined against processing progress and the pipeline\u2019s time/window policy."
      ],
      [
        "What should a lateness policy state?",
        "Beyond-bound treatment",
        "Size of recent batches",
        "Target row count",
        "Field aliases",
        "The system needs an explicit path for events arriving after routine correction windows."
      ],
      [
        "Why preserve both event and arrival times?",
        "Business/delay separation",
        "To make events unique",
        "To remove timezone ambiguity",
        "To prevent all source retries",
        "The two times support different analytical and operational questions."
      ],
      [
        "A watermark advances beyond a day. Can a source still send an older event?",
        "Yes; define handling",
        "No, all older events are impossible",
        "Invalid records can arrive",
        "Duplicate events can arrive",
        "Watermarks are not universal proof that no older source events can arrive."
      ],
      [
        "A monthly report freezes before the observed two-day device delay. What is likely needed?",
        "Correction/close policy",
        "Larger page limit",
        "New partition name",
        "Faster dashboard cache",
        "Closing should account for expected late arrivals or explicitly publish later adjustments."
      ],
      [
        "A correction recomputes a partition from duplicate source events. What prerequisite is missing?",
        "Source deduplication",
        "Larger timestamp type",
        "Updated row ordering",
        "New partition label",
        "Recomputation is accurate only if its authoritative input respects event identity and eligibility."
      ],
      [
        "A timestamp is five years in the future. What should ingestion apply?",
        "Plausibility policy",
        "Silently map it to today",
        "Always accept it as future truth",
        "Always drop its business key",
        "Invalid or suspicious time values need explicit rejection, quarantine or review behavior."
      ],
      [
        "A late event reopens an old partition under retention rules. What must be coordinated?",
        "Correction and retention",
        "Source-field naming",
        "Metric display precision",
        "Report sorting rules",
        "Dropping or freezing old data can conflict with legitimate late corrections."
      ],
      [
        "An arrival-day chart spikes after an outage clears. What may explain it?",
        "A released backlog",
        "Certain increased demand",
        "Certain source duplicates",
        "Certain device-clock failure",
        "Arrival spikes can reflect pipeline recovery rather than the occurrence-time business pattern."
      ],
      [
        "A Python grouping fixture passes. What stream guarantee remains unverified?",
        "Real watermark semantics",
        "Fixture Counter output",
        "Literal event dates",
        "Difference in group counts",
        "A local grouping calculation does not run distributed event-time state or its failure recovery."
      ]
    ],
    "lang": "python",
    "mistakes": [
      "Grouping business metrics by arrival time unintentionally.",
      "Dropping beyond-grace data without an explicit policy."
    ],
    "takeaways": [
      "Keep occurrence and arrival timestamps.",
      "Make restatements replay-safe and visible."
    ]
  },
  {
    "id": "etl-atomic-batch",
    "comps": [
      "m2.c1",
      "m2.c2"
    ],
    "title": "Publish complete batches and recover interrupted backfills",
    "intro": "A daily orders mart refreshes from staging. If readers can see the table halfway through replacement, they may publish a revenue total that reflects only part of the day.",
    "sections": [
      [
        "Model the business contract",
        "Staging separates incomplete extraction from published analytical state. Load a batch into an isolated area, validate its schema, keys and expected coverage, then make the complete result visible through a target-supported atomic operation. The operation may be a transactional delete-and-insert, an atomic table swap or a versioned snapshot pointer; their actual guarantees differ across engines.",
        "A manifest can identify the exact source files, hashes, extraction bounds, transformation version and target batch id. Write the ready marker only when the expected material is complete. A directory listing alone can race with uploads or include unrelated objects. Hashes detect accidental content changes when compared with a trusted manifest but do not authenticate who produced the data."
      ],
      [
        "Work through the decision and its limits",
        "Backfills should have explicit affected intervals and a conflict policy with current ingestion. Replacing one old partition while a live job appends to it can lose data unless writers coordinate through a lock, source boundary or versioned publication protocol. Keep prior versions or reproducible inputs long enough to recover a failed release within retention and cost constraints.",
        "The SQLite fixture deletes a target partition and inserts a replacement inside one transaction, then deliberately violates a key constraint. The exception rolls back the deletion and preserves the prior value. This validates SQLite transaction behavior in a single connection only. PostgreSQL, WASM, cloud object publication and warehouse swaps require their own engine-specific tests."
      ]
    ],
    "problem": "Publish complete batches and recover interrupted backfills using a synthetic fixture.",
    "steps": [
      "Declare the record grain, keys and time meaning in the fixture.",
      "Trace the transformation and compare it with the stated invariant.",
      "Inspect the output and explain the remaining production assumptions."
    ],
    "code": "import sqlite3\nc=sqlite3.connect(':memory:')\nc.execute('CREATE TABLE target(id INTEGER PRIMARY KEY, amount INTEGER)')\nc.execute('INSERT INTO target VALUES (1,10)');c.commit()\ntry:\n with c:\n  c.execute('DELETE FROM target')\n  c.executemany('INSERT INTO target VALUES (?,?)',[(1,20),(1,30)])\nexcept sqlite3.IntegrityError:pass\nprint(c.execute('SELECT * FROM target').fetchall())",
    "expect": "[(1, 10)]",
    "limit": "Python executes an actual SQLite rollback in memory. It is not native PostgreSQL, PostgreSQL/WASM, persistent crash recovery, warehouse swap or concurrent-reader verification.",
    "practice": [
      [
        "What does staging isolate?",
        "Incomplete batch work",
        "Source authentication secrets",
        "All downstream authorization",
        "All raw input retention rule",
        "Staging holds intermediate work until validation and publication are complete."
      ],
      [
        "What should a batch manifest identify?",
        "Expected inputs/version",
        "Staging directory name",
        "Worker execution date",
        "Target alias",
        "A manifest defines which inputs and transformation version belong to the batch."
      ],
      [
        "What does an atomic publication prevent?",
        "Partial batch visibility",
        "All invalid business rule",
        "All source duplicate event",
        "All source-side timeout",
        "Atomic visibility makes a complete version appear as one publication unit."
      ],
      [
        "A replacement deletes old rows before a failed insert outside a transaction. What can readers see?",
        "Missing or partial data",
        "Certain old complete data",
        "Auto transaction recovery",
        "Consistent new full snapshot",
        "Without coordinated atomicity the old data can disappear before the replacement is complete."
      ],
      [
        "A backfill and live loader write the same partition independently. What risk needs a protocol?",
        "Lost/conflicting updates",
        "Report sort mismatch",
        "Source alias changes",
        "Target numeric widening",
        "Uncoordinated replacement and append operations can overwrite or miss each other\u2019s changes."
      ],
      [
        "A file hash matches an untrusted manifest. What remains unproven?",
        "Producer authenticity",
        "Consistency with that manifest",
        "Computed digest value",
        "Compared byte sequence",
        "Integrity against an untrusted claim does not establish who created the data."
      ],
      [
        "A directory listing includes files still uploading. What should define readiness?",
        "Completion protocol",
        "Directory listing",
        "Newest file name",
        "Upload start timestamps",
        "Publication needs an explicit completeness signal tied to the expected inputs."
      ]
    ],
    "formal": [
      [
        "What is a backfill?",
        "Historical processing",
        "Current-day refresh",
        "Schema migration",
        "Worker heartbeat",
        "A backfill computes or repairs data for a specified past range."
      ],
      [
        "What should an atomic batch marker represent?",
        "Complete durable data",
        "Attempted load",
        "Staging creation",
        "Source connection",
        "The marker should correspond to successfully applied data, not merely attempted work."
      ],
      [
        "What does a content digest help detect?",
        "Changed input bytes",
        "All semantic error",
        "All unauthorized producer",
        "All missing business event",
        "A trusted expected digest supports byte-integrity checks but not complete semantic correctness."
      ],
      [
        "A constraint failure occurs after deletion inside one target transaction. What should rollback preserve?",
        "The prior committed state",
        "Partial replacement",
        "Empty table always",
        "Advanced source cursor",
        "Atomic rollback undoes the transaction\u2019s deletion as well as its failed replacement."
      ],
      [
        "A warehouse offers table swap with vendor-specific behavior. What should engineers verify?",
        "Visibility/dependencies",
        "Swap command name",
        "Identical table schemas",
        "Database brand",
        "Swaps differ in transactional scope, dependencies and concurrent-reader behavior."
      ],
      [
        "A batch references three expected files but only two arrive. What should publication do?",
        "Fail as incomplete",
        "Publish the two received files",
        "Invent the missing source rows",
        "Advance the full checkpoint",
        "Missing expected inputs violate completeness and must not be hidden as a successful batch."
      ],
      [
        "A backfill replaces an old interval while new late events arrive. Which boundary helps?",
        "Coordinated write bounds",
        "Larger batch buffer",
        "Later retry schedule",
        "Renamed target partition",
        "Historical replacement must define which concurrent and late changes belong to the published version."
      ],
      [
        "A ready marker is written before validation. What does it falsely imply?",
        "Consumer readiness",
        "That a worker has started",
        "That staging has a name",
        "That source files can be read",
        "Readiness should follow completeness and quality checks, not precede them."
      ],
      [
        "A rollback needs last week\u2019s target but old versions were removed. What dependency becomes important?",
        "Retained replay inputs",
        "Current table alias",
        "New worker allocation",
        "Report publication time",
        "Recovery may require preserved source material and transformation versions if target snapshots no longer exist."
      ],
      [
        "The SQLite rollback fixture succeeds. What production claim is still unsupported?",
        "Real swap/reader behavior",
        "Local rollback result",
        "Preserved old row",
        "Fixture uniqueness failure",
        "A single in-memory SQLite test does not establish other engines\u2019 publication or concurrency guarantees."
      ]
    ],
    "lang": "python",
    "mistakes": [
      "Publishing based on a partial directory listing.",
      "Replacing a partition without coordinating live writers."
    ],
    "takeaways": [
      "Separate readiness from work in progress.",
      "Test the exact publication protocol."
    ]
  },
  {
    "id": "etl-api-integration",
    "comps": [
      "m3.c1"
    ],
    "title": "Extract APIs with bounded retries and schema checks",
    "intro": "A supplier API returns paginated shipments and sometimes responds with rate limits. An importer must distinguish a transient transport failure from a valid but incompatible payload.",
    "sections": [
      [
        "Model the business contract",
        "Read the API\u2019s pagination, ordering, authentication and rate-limit contract before writing a loop. Follow its documented next cursor until completion, and record enough progress to resume safely. A successful HTTP status does not imply a complete extraction: repeated cursors, missing pages or inconsistent source snapshots can still lose or duplicate records. Keep tokens out of logs and reviewer fixtures.",
        "Retries should be bounded and targeted at transient failures under the service contract. Respect Retry-After where applicable, use a backoff policy with jitter and an overall attempt or time budget, and avoid retrying nontransient schema errors indefinitely. A timeout after a source-side mutation is an ambiguous outcome, so extraction and side-effecting API operations need different idempotency reasoning."
      ],
      [
        "Work through the decision and its limits",
        "Validate each payload at the boundary: top-level shape, required fields, types, units, enums and identity. JSON decoding provides Python objects but not business validation. In Python, bool is a subclass of int, so isinstance(value, int) accepts true; use an exact type check when a count must be an integer and booleans are forbidden. Validate range separately and define policy for new optional fields.",
        "The fixture rejects a boolean count while accepting an ordinary nonnegative integer. It is intentionally stricter than a coercing parser and does not make network requests. Real integration tests must cover pagination completion, rate limits, credential handling and schema drift using controlled services or mocks with explicit limits."
      ]
    ],
    "problem": "Extract APIs with bounded retries and schema checks using a synthetic fixture.",
    "steps": [
      "Declare the record grain, keys and time meaning in the fixture.",
      "Trace the transformation and compare it with the stated invariant.",
      "Inspect the output and explain the remaining production assumptions."
    ],
    "code": "import json\nfor raw in ['{\"id\":\"s1\",\"count\":3}','{\"id\":\"s2\",\"count\":true}']:\n row=json.loads(raw)\n valid=isinstance(row,dict) and isinstance(row.get('id'),str) and type(row.get('count')) is int and row['count']>=0\n print(row['id'],valid)",
    "expect": "s1 True\ns2 False",
    "limit": "Python executes real JSON decoding and exact type validation without network access. Actual API pagination, rate limits, authentication, PostgreSQL/WASM and warehouse ingestion are untested.",
    "practice": [
      [
        "Does successful JSON decoding validate business schema?",
        "No",
        "Yes if status is successful",
        "Yes if all keys are strings",
        "Yes if the payload is small",
        "Decoding validates syntax, while required fields, types and semantics require separate checks."
      ],
      [
        "What should govern API retries?",
        "Transient-failure rules",
        "All exception indefinitely",
        "Response arrival order",
        "Current page number",
        "A bounded retry policy should target failures expected to succeed on another attempt."
      ],
      [
        "Why can isinstance true int be surprising in Python?",
        "bool subclasses int",
        "JSON never represents booleans",
        "All Python strings are integers",
        "All integer is a boolean",
        "Python bool inherits from int, so exact integer contracts may need type(value) is int."
      ],
      [
        "An API repeats the same next cursor forever. What guard is useful?",
        "Reject cursor nonprogress",
        "Increase the page size",
        "Retry with no time budget",
        "Reorder received rows",
        "A repeated progress token can create an infinite loop and incomplete extraction."
      ],
      [
        "A response has status 200 but omits a required amount field. What should happen?",
        "A schema-contract failure",
        "Auto fill zero",
        "Accept because HTTP succeeded",
        "Delete the source record",
        "Transport success does not make an incompatible payload valid."
      ],
      [
        "A supplier sends Retry-After on a rate-limit response. What should the policy consider?",
        "The retry delay",
        "Payload byte size",
        "Current queue depth",
        "Schema version text",
        "Rate-limit instructions should inform a bounded retry schedule."
      ],
      [
        "A developer logs full authorization headers to debug extraction. What should change?",
        "Credential redaction",
        "Shorten the endpoint",
        "Increase log retention",
        "Rename the token variable",
        "Credentials must not be exposed in diagnostic or review artifacts."
      ]
    ],
    "formal": [
      [
        "What is pagination intended to do?",
        "Read bounded result pages",
        "Guarantee source uniqueness",
        "Encrypt all returned records",
        "Validate every business field",
        "Pagination divides a result into multiple requests under the source API contract."
      ],
      [
        "What does a retry budget bound?",
        "Repeated attempt effort",
        "Target key size",
        "Amount precision",
        "Source schema depth",
        "A budget limits attempts or elapsed time so transient-failure handling cannot run indefinitely."
      ],
      [
        "What should required-field validation check?",
        "Presence and meaning",
        "Field ordering",
        "JSON indentation",
        "Payload byte length",
        "A field can be present yet have an invalid type, unit or value."
      ],
      [
        "A count field contains true and isinstance returns true for int. Which stricter test fits a nonboolean integer contract?",
        "type(value) is int",
        "Isinstance(value,int)",
        "Bool(value)",
        "Value is not None",
        "An exact type check excludes bool while accepting ordinary built-in integers."
      ],
      [
        "A negative shipment count passes an integer-type test. What is still missing?",
        "Range validation",
        "JSON syntax validation",
        "Required-field presence",
        "Basic integer-type validation",
        "Type checks do not enforce nonnegative business constraints."
      ],
      [
        "An API adds a new optional field. What should the importer use?",
        "Compatibility policy",
        "Reject every new field always",
        "Accept every change silently",
        "Remove arbitrary fields",
        "Schema evolution rules should distinguish compatible additions from breaking changes."
      ],
      [
        "A client retries a malformed payload forever. Why is the policy poor?",
        "A permanent contract error",
        "Schema repairs itself",
        "All retry changes the type",
        "Rate limits prove validity",
        "A structural contract error usually needs investigation rather than unbounded repeated requests."
      ],
      [
        "A timeout occurs after a side-effecting request may have completed. What is the outcome?",
        "Potentially ambiguous",
        "Certainly no remote effect",
        "Certainly duplicate effects",
        "Certainly valid source data",
        "The client may not know whether the remote operation committed before the response was lost."
      ],
      [
        "An extraction test uses a two-page mock. What real behavior may still need verification?",
        "Real service semantics",
        "Mock\u2019s literal page count",
        "Fixture list concatenation",
        "Fixture record ids",
        "Mocks exercise modeled behavior and cannot prove the actual service\u2019s consistency and limit contract."
      ],
      [
        "A parser coerces the string 12 into integer 12 silently. What should reviewers assess?",
        "Approved coercion",
        "If int exists",
        "Payload field ordering",
        "Endpoint name length",
        "Coercion can conceal upstream type changes, so acceptance must be a deliberate compatibility decision."
      ]
    ],
    "lang": "python",
    "mistakes": [
      "Treating status 200 as schema validity.",
      "Retrying permanent contract failures indefinitely."
    ],
    "takeaways": [
      "Validate syntax and business meaning separately.",
      "Bound retries and detect nonprogress."
    ]
  },
  {
    "id": "etl-file-database",
    "comps": [
      "m3.c1"
    ],
    "title": "Integrate files and database extracts through explicit contracts",
    "intro": "A partner sends a CSV whose headers changed order, while an internal database adds a nullable column. The importer needs deliberate compatibility rules rather than depending on incidental column positions.",
    "sections": [
      [
        "Model the business contract",
        "A file contract includes encoding, delimiter, quoting, header names, types, units, timezone, null representation and completeness signal. Parse CSV with a real parser because embedded delimiters and quoted newlines are legal. Validate required header names and duplicate headers before constructing records. Positional assignment can silently place an amount into the wrong field when a producer reorders columns.",
        "Database extracts need a documented consistency level and key strategy. Several separate SELECT statements can observe different source moments unless a suitable snapshot transaction or source export mechanism coordinates them. Select explicit columns rather than relying on SELECT star when schema evolution is possible, and bind data values as parameters. Identifier selection requires a separate allowlist; value placeholders cannot safely stand in for arbitrary table names."
      ],
      [
        "Work through the decision and its limits",
        "Compatibility is semantic as well as structural. Adding an optional field can be allowed while renaming a required field should fail until mapping is reviewed. A decimal amount changing units can pass a type check and still corrupt results. Preserve rejected material in a restricted quarantine with a reason and source identity so operators can correct and replay it without losing auditability.",
        "The fixture parses reordered CSV headers by name, validates the expected header set and converts integer cents explicitly. It demonstrates quoted-field support in the standard library. It does not certify database snapshot consistency, production encodings, a cloud file completion protocol or a warehouse connector; those require source-specific tests."
      ]
    ],
    "problem": "Integrate files and database extracts through explicit contracts using a synthetic fixture.",
    "steps": [
      "Declare the record grain, keys and time meaning in the fixture.",
      "Trace the transformation and compare it with the stated invariant.",
      "Inspect the output and explain the remaining production assumptions."
    ],
    "code": "import csv,io\ntext='amount_cents,id,note\\n1250,s1,\"fragile, handle carefully\"\\n'\nreader=csv.DictReader(io.StringIO(text))\nassert set(reader.fieldnames)=={'id','amount_cents','note'}\nfor row in reader:\n print(row['id'],int(row['amount_cents']),row['note'])",
    "expect": "s1 1250 fragile, handle carefully",
    "limit": "Python uses the actual csv parser on an in-memory file. It does not execute a production connector, database snapshot, PostgreSQL/WASM or cloud completion protocol.",
    "practice": [
      [
        "Why use a real CSV parser?",
        "Valid quoted delimiters",
        "All files lack embedded commas",
        "Parsing certifies all units",
        "Parsing prevents schema drift",
        "CSV quoting rules allow delimiters and newlines inside fields, which naive splitting mishandles."
      ],
      [
        "What should map reordered headers safely?",
        "Contracted column names",
        "Fixed column positions",
        "Lexical header sorting",
        "File byte length",
        "Name-based mapping preserves field meaning when a compatible producer changes header order."
      ],
      [
        "Can value parameters substitute arbitrary SQL identifiers?",
        "No",
        "Yes in every SQL driver",
        "For numeric names",
        "For short names",
        "Value binding handles data values; dynamic identifiers need an approved separate construction policy."
      ],
      [
        "A partner swaps id and amount columns. What avoids silent misassignment?",
        "Validated name mapping",
        "Increasing parser memory",
        "Removing the header",
        "Sorting rows by amount",
        "A checked header mapping decouples meaning from incidental physical column order."
      ],
      [
        "A source changes cents to dollars but keeps an integer type. What contract changed?",
        "Units",
        "CSV quote handling",
        "Integer nullability",
        "Record cardinality",
        "Type compatibility does not preserve the measurement unit."
      ],
      [
        "Two extraction queries read related tables at different source moments. What may be inconsistent?",
        "Their combined snapshot",
        "Column display labels",
        "Amount precision",
        "CSV newline encoding",
        "Independent reads can observe states that never coexisted as one source snapshot."
      ],
      [
        "A required header is missing. Which response is appropriate?",
        "Reject or quarantine",
        "Silently invent all values",
        "Map the next column instead",
        "Delete the target",
        "A missing required field violates the contract and needs visible handling."
      ]
    ],
    "formal": [
      [
        "What does a file completeness signal indicate?",
        "Input readiness",
        "All values are correct",
        "Producer is authentic",
        "All business event exists",
        "Completeness coordinates publication of the expected material but does not replace data-quality validation."
      ],
      [
        "Why select explicit database columns?",
        "Controlled projection",
        "To guarantee all snapshots",
        "To eliminate source permissions",
        "To remove every null value",
        "Explicit projection avoids unintended dependence on columns introduced or reordered upstream."
      ],
      [
        "A partner CSV fails the integer-cents contract after a unit change. Which quarantine evidence supports corrected replay without silently inventing amounts?",
        "Source identity and cause",
        "Only transformed totals",
        "Only the latest good row",
        "Only the target row count",
        "A restricted copy or retrievable source identity plus the rejection reason lets operators diagnose the unit mismatch and replay the corrected original under the reviewed contract."
      ],
      [
        "A CSV note contains a comma inside quotes. What should parsing produce?",
        "One note field",
        "Two separate business fields",
        "Duplicate record",
        "Invalid CSV always",
        "CSV quoting keeps embedded delimiters within the same field."
      ],
      [
        "A producer adds a nullable optional column. What determines acceptance?",
        "The compatibility policy",
        "Column position",
        "Producer name",
        "Current file size",
        "A reviewed policy decides whether optional additions are allowed or need a contract version."
      ],
      [
        "An extractor uses SELECT star and a new sensitive column appears. What risk increases?",
        "Unapproved field capture",
        "Auto source deletion",
        "Certain parser failure",
        "Certain duplicated rows",
        "Implicit projection can capture fields that were never approved for the target."
      ],
      [
        "A dynamic table name comes from user text. What should constrain it?",
        "An identifier allowlist",
        "Value placeholder",
        "Input amount conversion",
        "Larger retry budget",
        "Identifiers require controlled construction rather than data-value parameter binding."
      ],
      [
        "A file has duplicate header names. Why reject or handle it explicitly?",
        "Ambiguous name mapping",
        "All row becomes unique",
        "All value becomes null",
        "Encoding must be invalid",
        "Duplicate names make name-based records ambiguous and can overwrite one column\u2019s value."
      ],
      [
        "A database snapshot is consistent but extraction misses delete events after the snapshot. What is still needed?",
        "Ongoing change capture",
        "Larger CSV buffer",
        "Explicit column list",
        "Source-table alias",
        "A consistent point-in-time extract does not itself capture later changes or deletions."
      ],
      [
        "A parser test accepts a reordered synthetic CSV. What remains outside its evidence?",
        "Real source publication",
        "Fixture header mapping",
        "Quoted-note parse",
        "Integer-cent conversion",
        "The local parser fixture does not connect to the production file or database delivery mechanisms."
      ]
    ],
    "lang": "python",
    "mistakes": [
      "Splitting CSV manually on commas.",
      "Treating unchanged types as unchanged meaning."
    ],
    "takeaways": [
      "Contract headers, types and units.",
      "Coordinate source snapshots and quarantine."
    ]
  },
  {
    "id": "etl-contract-release",
    "comps": [
      "m3.c1"
    ],
    "title": "Reconcile extraction completeness before promoting a pipeline",
    "intro": "A new supplier feed passes row validation but its first dashboard is missing an entire region. Quality checks must cover extraction completeness and business reconciliation as well as individual field types.",
    "sections": [
      [
        "Model the business contract",
        "Pipeline acceptance needs several layers of evidence. Record-level checks validate types, keys and permitted values. Batch-level checks validate expected files, pages, source bounds and duplicates. Business-level checks compare counts and amounts with an authoritative source under aligned eligibility rules. A perfectly typed partial extract is still an incomplete data product.",
        "Record lineage from source identity and version through extraction batch, transformation version and published target. Store source and target counts with explanations for legitimate filters and quarantines. A simple equality check is inappropriate when transformation intentionally aggregates or removes rows; reconcile according to the declared grain and expected policy instead."
      ],
      [
        "Work through the decision and its limits",
        "Operational contracts include freshness, failure alerts, ownership and a runbook for replay or backfill. Monitor nonprogress as well as exceptions: a job can return success while repeatedly reading the same page or publishing stale data. Rollouts should compare old and new paths over representative cases and preserve the prior usable version until acceptance criteria are met.",
        "The fixture reconciles region sets and total counts, revealing that a target containing valid north rows is still missing south. It is a small completeness assertion rather than an end-to-end connector test. Production acceptance additionally needs source-specific boundary verification, fault injection where appropriate and human review of business definitions. Automated evidence must remain marked as draft, not human approval."
      ]
    ],
    "problem": "Reconcile extraction completeness before promoting a pipeline using a synthetic fixture.",
    "steps": [
      "Declare the record grain, keys and time meaning in the fixture.",
      "Trace the transformation and compare it with the stated invariant.",
      "Inspect the output and explain the remaining production assumptions."
    ],
    "code": "source={'north':3,'south':2};target={'north':3}\nmissing=sorted(set(source)-set(target))\nprint(missing)\nprint(sum(source.values()),sum(target.values()))\nprint(not missing and source==target)",
    "expect": "['south']\n5 3\nFalse",
    "limit": "Python verifies a small completeness reconciliation. It is not an end-to-end API, file, database, PostgreSQL/WASM, warehouse recovery or human approval test.",
    "practice": [
      [
        "What can record-level validation fail to detect?",
        "An omitted source segment",
        "Checked field with bad type",
        "Checked required field missing",
        "Checked invalid enum",
        "Checks on received rows do not establish that all expected rows arrived."
      ],
      [
        "A supplier shipment is revised after a parser change. Which lineage chain identifies the exact source object and transformation that produced its published quantity?",
        "Input-to-output versions",
        "Only current row keys",
        "Only the latest cursor",
        "Only the published total",
        "Link the source object identity and version to its extraction batch, parser version and target publication so an operator can reproduce the quantity."
      ],
      [
        "What is freshness an operational measure of?",
        "Usable-data currency",
        "Query rendering speed",
        "Stored record width",
        "Target compression",
        "Freshness measures lag from relevant source changes to available analytical output."
      ],
      [
        "Every north row validates but south is absent. Which check catches the omission?",
        "Expected-segment coverage",
        "Checking integer types",
        "Checking JSON syntax",
        "Checking required fields",
        "Completeness must compare expected source segments with what the target contains."
      ],
      [
        "A transformation aggregates ten events into one row. Should source and target row counts always match?",
        "No; reconcile the grain",
        "Yes without exceptions",
        "With string keys",
        "With unique amounts",
        "Intentional aggregation changes row count, so acceptance must use the transformation\u2019s contract."
      ],
      [
        "A job reports success but its source cursor never advances. What should trigger review?",
        "Nonprogress monitoring",
        "Checking job exit codes",
        "Increasing worker count",
        "Shortening the page limit",
        "Operational health includes meaningful progress and freshness, not just absence of exceptions."
      ],
      [
        "A pipeline is technically validated. What status should it retain before human acceptance?",
        "Draft awaiting review",
        "Human-approved automatically",
        "Published after validation",
        "Credential issued by tests",
        "Automated validation supplies evidence without replacing the established human approval process."
      ]
    ],
    "formal": [
      [
        "What should a reconciliation explain?",
        "Filters and deltas",
        "Target-name length",
        "Count of SQL aliases",
        "Current query plan",
        "Counts and amounts are interpretable only when differences follow an explicit transformation and population policy."
      ],
      [
        "What belongs in a pipeline runbook?",
        "Recovery/replay steps",
        "List of model titles",
        "Connection string format",
        "Empty incident checklist",
        "Operators need actionable steps for known failure and recovery scenarios."
      ],
      [
        "Why compare old and new paths during rollout?",
        "Detect result regressions",
        "To eliminate every future fault",
        "To bypass source contracts",
        "To replace business review",
        "Parallel evidence helps distinguish intended policy changes from regressions."
      ],
      [
        "A feed publishes on time but uses yesterday\u2019s cursor repeatedly. Which SLA may still fail?",
        "Data freshness",
        "HTTP availability",
        "File readability",
        "Schema naming",
        "Timely job completion can still publish stale data if extraction does not advance."
      ],
      [
        "A target total matches the source but two regions are offset by equal errors. What check is needed?",
        "Segmented reconciliation",
        "Another global total",
        "Wider tolerance",
        "Sorted source ids",
        "Subgroup checks expose cancellation of discrepancies in the aggregate."
      ],
      [
        "A rejected-row count rises after a source enum change. What should lineage support?",
        "Contract-drift tracing",
        "Deleting rejected rows",
        "Renaming the dashboard",
        "Widening every type",
        "Source and transformation versions help identify which contract change caused rejection."
      ],
      [
        "A rollout removes the previous table before acceptance. What capability is weakened?",
        "Usable-version rollback",
        "Current source access",
        "New name",
        "Report owner label",
        "Retaining a compatible prior version or reproducible inputs supports recovery from a bad release."
      ],
      [
        "A batch has three valid pages but the source promises four. What should acceptance report?",
        "Incomplete extraction",
        "Complete successful load",
        "Ignorable formatting issue",
        "Approved business release",
        "Completeness depends on the expected source interval or material, not just valid received pages."
      ],
      [
        "A downstream count intentionally excludes quarantined records. What should consumers know?",
        "Exclusion impact",
        "Worker memory limit",
        "File path length",
        "SQL formatter version",
        "Visible exclusions prevent incomplete or biased populations from being interpreted as complete business activity."
      ],
      [
        "A synthetic coverage test passes. What is still required for business release?",
        "Integration and review",
        "Second fixture copy",
        "Larger dictionary",
        "New test filename",
        "Local assertions do not establish source delivery, production recovery or human acceptance of the metric contract."
      ]
    ],
    "lang": "python",
    "mistakes": [
      "Accepting valid rows as proof of complete extraction.",
      "Monitoring job completion without freshness or progress."
    ],
    "takeaways": [
      "Reconcile by source bounds and business grain.",
      "Keep recovery and review evidence explicit."
    ]
  }
];
module.exports=course('etl-elt-architecture',specs,[
  {
    "id": "pg-ddl",
    "title": "PostgreSQL constraints, schemas and table partitioning",
    "url": "https://github.com/postgres/postgres/blob/e6b2f7c2b41d6261dac15825dede55e94ca35614/doc/src/sgml/ddl.sgml",
    "source": {
      "repo": "postgres/postgres",
      "commit": "e6b2f7c2b41d6261dac15825dede55e94ca35614",
      "path": "doc/src/sgml/ddl.sgml",
      "verification": "Official pinned source inspected locally. Original synthetic business cases; human educational review pending."
    }
  },
  {
    "id": "pg-queries",
    "title": "PostgreSQL joins, grouping and query semantics",
    "url": "https://github.com/postgres/postgres/blob/e6b2f7c2b41d6261dac15825dede55e94ca35614/doc/src/sgml/queries.sgml",
    "source": {
      "repo": "postgres/postgres",
      "commit": "e6b2f7c2b41d6261dac15825dede55e94ca35614",
      "path": "doc/src/sgml/queries.sgml",
      "verification": "Official pinned source inspected locally. Original synthetic business cases; human educational review pending."
    }
  },
  {
    "id": "python-sqlite",
    "title": "Python SQLite connections, transactions and parameter binding",
    "url": "https://github.com/python/cpython/blob/42155a0feaca9ba6991942c323cbe9fb7278be3c/Doc/library/sqlite3.rst",
    "source": {
      "repo": "python/cpython",
      "commit": "42155a0feaca9ba6991942c323cbe9fb7278be3c",
      "path": "Doc/library/sqlite3.rst",
      "verification": "Official pinned source inspected locally. Original synthetic business cases; human educational review pending."
    }
  },
  {
    "id": "pg-logical",
    "title": "PostgreSQL logical decoding, slots and change positions",
    "url": "https://github.com/postgres/postgres/blob/e6b2f7c2b41d6261dac15825dede55e94ca35614/doc/src/sgml/logicaldecoding.sgml",
    "source": {
      "repo": "postgres/postgres",
      "commit": "e6b2f7c2b41d6261dac15825dede55e94ca35614",
      "path": "doc/src/sgml/logicaldecoding.sgml",
      "verification": "Official pinned source inspected locally. Original synthetic business cases; human educational review pending."
    }
  },
  {
    "id": "pg-replication",
    "title": "PostgreSQL logical replication publication and subscription behavior",
    "url": "https://github.com/postgres/postgres/blob/e6b2f7c2b41d6261dac15825dede55e94ca35614/doc/src/sgml/logical-replication.sgml",
    "source": {
      "repo": "postgres/postgres",
      "commit": "e6b2f7c2b41d6261dac15825dede55e94ca35614",
      "path": "doc/src/sgml/logical-replication.sgml",
      "verification": "Official pinned source inspected locally. Original synthetic business cases; human educational review pending."
    }
  },
  {
    "id": "python-json",
    "title": "Python JSON decoding and numeric boundaries",
    "url": "https://github.com/python/cpython/blob/42155a0feaca9ba6991942c323cbe9fb7278be3c/Doc/library/json.rst",
    "source": {
      "repo": "python/cpython",
      "commit": "42155a0feaca9ba6991942c323cbe9fb7278be3c",
      "path": "Doc/library/json.rst",
      "verification": "Official pinned source inspected locally. Original synthetic business cases; human educational review pending."
    }
  },
  {
    "id": "python-csv",
    "title": "Python CSV quoting and dictionary readers",
    "url": "https://github.com/python/cpython/blob/42155a0feaca9ba6991942c323cbe9fb7278be3c/Doc/library/csv.rst",
    "source": {
      "repo": "python/cpython",
      "commit": "42155a0feaca9ba6991942c323cbe9fb7278be3c",
      "path": "Doc/library/csv.rst",
      "verification": "Official pinned source materialized and inspected locally. Original synthetic examples; human educational review pending."
    }
  },
  {
    "id": "python-types",
    "title": "Python built-in types, including bool and int",
    "url": "https://github.com/python/cpython/blob/42155a0feaca9ba6991942c323cbe9fb7278be3c/Doc/builtins/stdtypes.rst",
    "source": {
      "repo": "python/cpython",
      "commit": "42155a0feaca9ba6991942c323cbe9fb7278be3c",
      "path": "Doc/builtins/stdtypes.rst",
      "verification": "Official pinned source materialized and inspected locally. Original synthetic examples; human educational review pending."
    }
  }
]);
