'use strict';
const {build}=require('./qa2-helper');
const bundle=build('test-data-management',[
  {
    "slug": "fixture-scope",
    "comp": "m1.c1",
    "title": "Scope fixtures to the test owner",
    "intro": "Parallel enrollment tests must not modify each other\u2019s synthetic records.",
    "sections": [
      [
        "Design the evidence",
        "Isolation means a test owns the rows it can mutate. Give each run an explicit namespace, including dependent records, and query that scope in setup, assertions and teardown.",
        "A shared row called test-user is not isolated merely because it is synthetic. Two workers can race over its state and produce order-dependent failures."
      ],
      [
        "Apply the control",
        "Create only the permissions, states and relationships required for the scenario. A large shared seed can hide preconditions and make accidental coupling hard to diagnose.",
        "A namespace reduces accidental collisions but is not an authorization boundary; application access rules still require separate tests."
      ]
    ],
    "prerequisite_note": "Use the canonical SQL and data-management prerequisites to interpret the stated fixture and its evidence boundary.",
    "worked": {
      "lang": "python",
      "problem": "Scope fixtures to the test owner with synthetic local records.",
      "steps": [
        "Read the declared fixture and invariant.",
        "Execute the local example in isolation.",
        "Compare the output with the stated invariant."
      ],
      "code": "rows = [{\"run\": \"r1\", \"id\": 1}, {\"run\": \"r2\", \"id\": 1}]\nprint([r[\"id\"] for r in rows if r[\"run\"] == \"r1\"])",
      "expect": "[1]",
      "explanation": "A namespace reduces accidental collisions but is not an authorization boundary; application access rules still require separate tests."
    },
    "mistakes": [
      "A shared row called test-user is not isolated merely because it is synthetic. Two workers can race over its state and produce order-dependent failures.",
      "Create only the permissions, states and relationships required for the scenario. A large shared seed can hide preconditions and make accidental coupling hard to diagnose."
    ],
    "takeaways": [
      "Isolation means a test owns the rows it can mutate. Give each run an explicit namespace, including dependent records, and query that scope in setup, assertions and teardown.",
      "A namespace reduces accidental collisions but is not an authorization boundary; application access rules still require separate tests."
    ],
    "practice": "What should identify a fixture\u2019s owner?|An explicit run namespace|A display color|A shared password|A test filename alone|Ownership makes mutation and cleanup scope explicit.|Color does not scope database access.;Credentials do not identify row ownership.;A filename is not attached to the stored rows.\nWhy avoid one mutable shared user?|Tests can interfere|Synthetic users cannot change|Shared users guarantee speed|Real users race|Independent mutations can change another test\u2019s starting state.|Synthetic records remain mutable.;Speed does not establish independence.;Concurrency also affects generated fixtures.\nA checkout worker needs a distinct cart. What should setup create?|A worker-owned cart|One global cart|A new log file|An arbitrary production cart|The cart must not be mutated by another parallel case.|Global mutation permits interference.;Logs do not isolate cart state.;Production records are outside the authorized fixture.\nAn assertion selects every order in the database. What is missing?|Fixture scope|A bigger timeout|A screen capture|A sorted result only|Unrelated rows can affect the expected result.|Waiting does not narrow the query.;An image does not identify row ownership.;Sorting still includes unrelated orders.\nA fixture includes fifty unused roles. What is the cost?|Hidden preconditions|Guaranteed coverage|Automatic authorization|Stronger independence|Excess setup obscures which permissions the scenario relies on.|Unused roles are not exercised.;Stored roles do not prove enforcement.;More shared state can increase coupling.\nA run prefix is added to IDs. What remains necessary?|Access-control testing|Removing authorization|Sharing administrator tokens|Skipping negative cases|Naming isolation does not enforce actor permissions.|Prefixes cannot replace runtime policy.;Shared privilege can mask policy defects.;Disallowed access remains relevant.",
    "formal": "What is fixture isolation intended to reduce?|Cross-test interference|All software defects|Every runtime cost|All permission checks|Tests should control their own mutable starting state.|Isolation does not cover every behavior.;Extra setup may cost time.;Ownership metadata does not enforce policy.\nWhere should run scope appear?|Every operation|The report title|The branch name|An assertion label|Each operation must refer to the same owned population.|Report text cannot constrain mutations.;Branches do not select database rows.;A label leaves query scope unchanged.\nWhat makes a minimal fixture useful?|Visible preconditions|No relational constraints|No expected result|Maximum shared mutation|A small purposeful state makes the scenario easier to understand.|Minimal data still needs integrity.;Assertions still need an oracle.;Sharing makes state less predictable.\nTwo billing workers edit the same synthetic account. What should change?|Give each its own account|Add random sleeps|Ignore intermittent failures|Rename both tests|Disjoint mutable ownership prevents unintended interaction.|Timing delays do not guarantee independence.;Flakiness can conceal real setup interference.;Names do not isolate stored state.\nAn LMS fixture namespace exists only on parent rows. What needs review?|Dependent-row scoping|Dashboard colors|Sql capitalization|Test duration|Children must be traceable to the same owned fixture population.|Presentation does not trace dependencies.;Style does not establish ownership.;Duration cannot reveal correct child scope.\nA stock test reads a global count after another run inserts rows. What is sound?|Count its owned rows|Expect every possible total|Delete all rows first|Disable every assertion|The oracle should exclude unrelated concurrent fixtures.|An unbounded expectation loses the invariant.;Global deletion breaks other owners.;That discards behavior evidence.\nA team reuses a seed only for immutable lookup codes. What distinction matters?|Mutable versus immutable state|All sharing is identical|Lookup codes need no contract|Synthetic means immutable|Stable shared references can be safe when tests cannot mutate them.|Read-only lookup use differs from shared mutation.;Their meaning still matters.;Generated rows can still be changed.\nA worker creates a run-scoped record but fetches by display name. What is the risk?|Ambiguous selection|Guaranteed uniqueness|Automatic tenant isolation|No risk because creation passed|Names may collide even when fixture IDs are scoped.|A display name alone makes no such guarantee.;Naming does not enforce tenancy.;Setup success does not validate selection.\nA cleanup job removes another run\u2019s rows. Which control was violated?|Ownership scope|Response formatting|Read-only ordering|Browser compatibility|Teardown must preserve records owned by other runs.|The failure concerns data ownership.;Ordering does not explain deletion scope.;The observed issue is a database mutation boundary.\nTwo concurrent LMS runs use scoped parent keys but their child lookup uses an unscoped email. Both cleanup logs look correct while enrollment assertions intermittently cross runs. What should change first?|Scope the child lookup|Disable concurrent runs forever|Only add a longer teardown delay|Treat correct parent logs as sufficient|Every path selecting mutable fixtures must preserve ownership; parent naming alone does not constrain child lookup.|Serial execution hides the coupling rather than repairing selection;Delay does not disambiguate identical emails;Parent logs do not establish the child query predicate."
  },
  {
    "slug": "deterministic-seeds",
    "comp": "m1.c1",
    "title": "Make data repeatable without erasing boundaries",
    "intro": "An age-policy test changes outcome after midnight because setup reads the wall clock.",
    "sections": [
      [
        "Design the evidence",
        "Repeatability requires explicit inputs for time, randomness and generated identity. Inject a fixed reference date for age or expiry rules and record the seed when using a pseudo-random generator.",
        "A fixed random seed alone does not stabilize unordered queries, shared state or system time. Reproducibility depends on controlling each relevant source of variation."
      ],
      [
        "Apply the control",
        "Use purposeful boundary examples before adding randomized exploration. Include a value on the limit and values on both sides, and store the generated failing example for diagnosis.",
        "The example demonstrates a local date boundary. It does not establish timezone conversion rules or a production clock implementation."
      ]
    ],
    "prerequisite_note": "Use the canonical SQL and data-management prerequisites to interpret the stated fixture and its evidence boundary.",
    "worked": {
      "lang": "python",
      "problem": "Make data repeatable without erasing boundaries with synthetic local records.",
      "steps": [
        "Read the declared fixture and invariant.",
        "Execute the local example in isolation.",
        "Compare the output with the stated invariant."
      ],
      "code": "from datetime import date\nreference = date(2026, 1, 10)\nexpiry = date(2026, 1, 10)\nprint(expiry <= reference)\nprint(expiry > reference)",
      "expect": "True\nFalse",
      "explanation": "The example demonstrates a local date boundary. It does not establish timezone conversion rules or a production clock implementation."
    },
    "mistakes": [
      "A fixed random seed alone does not stabilize unordered queries, shared state or system time. Reproducibility depends on controlling each relevant source of variation.",
      "Use purposeful boundary examples before adding randomized exploration. Include a value on the limit and values on both sides, and store the generated failing example for diagnosis."
    ],
    "takeaways": [
      "Repeatability requires explicit inputs for time, randomness and generated identity. Inject a fixed reference date for age or expiry rules and record the seed when using a pseudo-random generator.",
      "The example demonstrates a local date boundary. It does not establish timezone conversion rules or a production clock implementation."
    ],
    "practice": "What makes an expiry fixture repeatable?|Fixed time|The machine clock|A longer timeout|An unordered query|The same input date produces the same comparison.|Wall time changes between runs.;Timeouts do not fix reference time.;Unspecified order adds variation.\nWhat should a random failure retain?|Concrete generated input|A pass count|The test logo|Runtime seconds|Concrete failing input supports reproduction.|Counts do not recover input.;Branding contains no data.;Duration does not identify the case.\nA discount applies at quantity ten. Which set challenges its boundary?|Nine ten and eleven|Ten repeatedly|Positive random quantities|Zero and a million|Below equal and above distinguish off-by-one behavior.|One point misses neighboring behavior.;Random draws may miss the boundary.;Extremes omit the exact transition.\nA fixed seed still yields changing database order. What is missing?|Explicit query ordering|More retries|A shared mutable fixture|A different report name|A seed does not specify SQL result order.|Retries repeat nondeterminism.;Sharing can add interference.;Names do not constrain row order.\nAn age check fails only on birthdays. What should setup control?|The reference date|User colors|Password length|Browser width|Calendar-sensitive rules need explicit date context.|Presentation cannot define age.;Passwords do not control birthday timing.;Layout is unrelated to the date rule.\nA generator found a failing address. What is useful next?|Minimize and preserve it|Discard it after rerunning|Replace it with happy data|Promise all addresses fail|A small retained failure improves diagnosis and regression coverage.|Discarding loses valuable evidence.;That stops exercising the failure.;One example does not justify universality.",
    "formal": "What does a fixed seed control?|Pseudo-random sequence|System timezone|Database isolation|Network latency|A seed stabilizes the chosen generator under stated conditions.|Timezone is a separate input.;Transactions control isolation separately.;External timing is not seeded.\nWhy record generated input too?|Implementations may change|Seeds have no purpose|Records prove universal safety|Every input is secret|The concrete example remains interpretable when generator behavior changes.|Seeds still aid repeatability.;Saved examples remain bounded.;Synthetic fixtures can be safely retained under policy.\nWhat is boundary-focused data?|Boundary neighbors|Any large random batch|Ordinary valid values|Malformed strings|The purpose is to distinguish neighboring rule outcomes.|Volume alone does not target a transition.;Valid midrange inputs miss transitions.;Format errors may be a different partition.\nA bank test uses today for an annual limit. What improves diagnosis?|Inject reference time|Run only at noon|Ignore January failures|Increase machine memory|A stable date makes the policy conditions explicit.|Noon still changes calendar date.;That conceals a relevant transition.;Capacity does not control time.\nA warehouse query expects creation order without ORDER BY. What should change?|ORDER BY the key|Add a random seed|Repeat until green|Compare only the first value|SQL does not promise incidental insertion order.|A generator does not order SQL results.;Retries do not establish deterministic semantics.;That can hide a wrong result population.\nAn insurer generates only valid dates. Which gap remains?|Invalid date partitions|All valid cases fail|No date evidence exists|Timezone coverage is complete|Valid examples cannot show rejection of malformed or impossible dates.|No such observation is given.;The valid cases still supply bounded evidence.;Validity alone does not establish timezone handling.\nA subscription expires exactly at the cutoff. What must be explicit?|Equality rule|The api hostname|Table size|Random seed|The equality case depends on the contract operator.|Hostnames do not define comparison semantics.;Population size does not define equality behavior.;The rule must still be specified.\nA report stores the seed but omits library version. What can become difficult?|Regenerating identical draws|Reading the saved failure|Knowing any result existed|Determining the expected rule|Generator changes can alter sequences or value construction.|A retained literal case remains readable.;The report may still show execution.;The business oracle is a separate artifact.\nA billing test covers month-end on a fixed calendar. What remains separate?|Clock and timezone rules|The observed local comparison|The declared date|Whether the script ran|A date fixture does not prove real clock wiring or timezone conversion.|That comparison was exercised.;It is explicit input.;Execution output supplies that evidence.\nA pricing property test records its seed but reruns after a dependency update with different failures. The saved literal failing input still fails. Which evidence should become the stable regression?|The saved concrete input|Only the old seed value|A new random seed on every retry|The latest passing generated batch|The concrete counterexample preserves the defect-triggering case despite changes in generation behavior.|Generator changes can alter seed replay;Fresh seeds weaken reproducibility;Passing different inputs does not address the known failure."
  },
  {
    "slug": "cleanup-lifecycle",
    "comp": "m1.c1",
    "title": "Clean fixtures even after partial failure",
    "intro": "An import test crashes after creating a parent record but before inserting its children.",
    "sections": [
      [
        "Design the evidence",
        "Treat setup and teardown as a lifecycle with partial completion. Register cleanup as soon as a resource is created, and make repeated cleanup safe when the resource is already absent.",
        "A transaction rollback is excellent for local database work on the same connection. It does not undo committed work on another connection, queued messages or external files."
      ],
      [
        "Apply the control",
        "Delete dependent rows before parents unless a deliberately verified cascade provides that behavior. Limit deletion to the owned namespace and retain diagnostic evidence before teardown removes state.",
        "The demonstration uses a local SQLite transaction and proves rollback of that transaction only; it makes no claim about external side effects."
      ]
    ],
    "prerequisite_note": "Use the canonical SQL and data-management prerequisites to interpret the stated fixture and its evidence boundary.",
    "worked": {
      "lang": "python",
      "problem": "Clean fixtures even after partial failure with synthetic local records.",
      "steps": [
        "Read the declared fixture and invariant.",
        "Execute the local example in isolation.",
        "Compare the output with the stated invariant."
      ],
      "code": "import sqlite3\nc = sqlite3.connect(\":memory:\")\nc.execute(\"CREATE TABLE fixture(id INTEGER)\")\nc.execute(\"INSERT INTO fixture VALUES (7)\")\nc.rollback()\nprint(c.execute(\"SELECT count(*) FROM fixture\").fetchone()[0])",
      "expect": "0",
      "explanation": "The demonstration uses a local SQLite transaction and proves rollback of that transaction only; it makes no claim about external side effects."
    },
    "mistakes": [
      "A transaction rollback is excellent for local database work on the same connection. It does not undo committed work on another connection, queued messages or external files.",
      "Delete dependent rows before parents unless a deliberately verified cascade provides that behavior. Limit deletion to the owned namespace and retain diagnostic evidence before teardown removes state."
    ],
    "takeaways": [
      "Treat setup and teardown as a lifecycle with partial completion. Register cleanup as soon as a resource is created, and make repeated cleanup safe when the resource is already absent.",
      "The demonstration uses a local SQLite transaction and proves rollback of that transaction only; it makes no claim about external side effects."
    ],
    "practice": "When should cleanup be registered?|After each creation|After all assertions|On successful tests|After deploying to production|Early registration covers partially completed setup.|A prior failure may skip registration.;Failed runs also leave resources.;Fixture cleanup belongs to isolated test lifecycle.\nWhat does rollback undo?|Uncommitted changes|Already sent email|Every connection\u2019s commits|Every created file|Rollback scope is the active database transaction.|External delivery is outside the transaction.;Independent commits are not rolled back.;Filesystem writes are separate effects.\nA child references a parent without cascade. What is the safe deletion order?|Child then parent|Parent then child always|Delete every table|Disable constraints permanently|Referential integrity requires dependents to be removed first.|The parent deletion may violate the foreign key.;That exceeds fixture ownership.;That removes useful integrity checks.\nCleanup runs twice. What property is useful?|Repeat-safe cleanup|Duplicate creation|Global deletion|Silent error suppression always|Already absent resources should not make teardown destructive or misleading.|Creating new data defeats cleanup.;Broad deletion threatens other runs.;Unexpected errors still need visibility.\nA failing case needs row evidence. When capture it?|Before teardown|After global truncation|Never for failed cases|From unrelated fixtures|Cleanup may remove the state needed for diagnosis.|The relevant state may be gone.;Failures often require evidence.;Those rows do not document this failure.\nA worker leaves external files after rollback. Why?|Files are outside the transaction|SQLite guarantees file deletion|The assertion count is low|Rollback requires a browser|Database rollback does not reverse filesystem effects.|No such cross-system guarantee exists.;Count does not determine transaction scope.;Database transaction control is independent of browsers.",
    "formal": "What should teardown select?|Run-owned resources|Every recent record|All rows with common names|The entire schema|Cleanup must respect the same fixture boundary as setup.|Recency does not prove ownership.;Names can collide across runs.;That can destroy unrelated work.\nWhy design for partial setup?|Creation may fail midway|All setup is atomic|Assertions can fail|Failures erase all resources|Some resources may exist even when full fixture preparation fails.|Multiple systems rarely share one transaction.;Preparation can also fail.;Failure alone performs no cleanup.\nWhat should unexpected teardown errors do?|Remain visible|Disappear unconditionally|Turn every assertion into a pass|Trigger production deletion|Cleanup failure may explain contamination of later runs.|Suppression hides residual state.;Cleanup cannot rewrite test results.;That exceeds test scope.\nAn LMS creates a user then crashes before enrollment. What should cleanup handle?|The user without enrollment|A fully built graph|All users in the tenant|A fabricated enrollment first|Teardown must tolerate resources not yet created.|That leaves the partial user behind.;The scope is broader than the fixture.;Creating data to delete it adds unnecessary work.\nA payment fake emits an event before database rollback. What remains?|The emitted event|Nothing by definition|Sql whitespace|Every external effect is reversed|The local transaction does not recall separate side effects.|Rollback has a bounded scope.;Formatting does not determine side effects.;No distributed rollback was established.\nA test server commits on another connection. Can outer rollback clean it?|Not reliably|Always|If names match|If logs are disabled|Committed independent work is outside the outer transaction.|Separate commit boundaries matter.;Naming does not merge transactions.;Logging does not change transaction scope.\nA cleanup query uses creation time alone. What is unsafe?|It can match other runs|It always deletes nothing|Time cannot be queried|Foreign keys become irrelevant|Concurrent fixture timestamps can overlap.|The predicate can match rows.;SQL supports time predicates.;Integrity still matters during deletion.\nA retailer uses verified cascade deletion. What should assertions include?|Expected child removal|Parent display text|Every unrelated table empty|No database checks|The chosen cascade behavior needs explicit evidence.|Display text does not establish child cleanup.;That exceeds scope.;The cascade claim would lack direct evidence.\nA failed teardown leaves a namespace. What should the report state?|Residual fixture and cleanup failure|The test fully cleaned up|The application certainly failed|All tests are invalid forever|Later investigation needs the remaining resource scope.|That contradicts the observation.;Cleanup failure is not automatically a product defect.;Impact must be assessed from actual interference.\nAn API writes fixtures on its own connection and sends a synthetic queue event. The outer test rolls back its connection and declares cleanup complete. What is the missing lifecycle design?|Cleanup for separate effects|A second rollback on the same connection|A shorter queue event identifier|A larger outer transaction timeout|The API connection and queue have independent effect boundaries that the outer rollback does not control.|Repeating local rollback cannot undo independent commits or queue effects;Identifier length does not determine cleanup scope;Waiting longer does not merge transaction boundaries."
  },
  {
    "slug": "relational-oracles",
    "comp": "m2.c1",
    "title": "Verify relational effects with targeted queries",
    "intro": "An order update reports success while one line item remains attached to an obsolete order.",
    "sections": [
      [
        "Design the evidence",
        "Database verification compares stored outcomes with a rule: exact owned rows, values, relationships and constraints. Use primary keys and scoped joins rather than selecting an arbitrary first row.",
        "A row count can pass while values are wrong. Pair population assertions with business fields and relational checks that would fail for the suspected defect."
      ],
      [
        "Apply the control",
        "Check both intended changes and protected invariants. An update to one order must preserve another order, and each line must reference an existing parent under the declared integrity policy.",
        "This in-memory join detects one orphan in intentionally unconstrained synthetic data; production foreign-key enforcement is a separate configuration claim."
      ]
    ],
    "prerequisite_note": "Use the canonical SQL and data-management prerequisites to interpret the stated fixture and its evidence boundary.",
    "worked": {
      "lang": "python",
      "problem": "Verify relational effects with targeted queries with synthetic local records.",
      "steps": [
        "Read the declared fixture and invariant.",
        "Execute the local example in isolation.",
        "Compare the output with the stated invariant."
      ],
      "code": "import sqlite3\nc=sqlite3.connect(\":memory:\")\nc.executescript(\"CREATE TABLE orders(id INT); CREATE TABLE lines(order_id INT); INSERT INTO orders VALUES(1); INSERT INTO lines VALUES(1),(2);\")\nprint(c.execute(\"SELECT count(*) FROM lines l LEFT JOIN orders o ON o.id=l.order_id WHERE o.id IS NULL\").fetchone()[0])",
      "expect": "1",
      "explanation": "This in-memory join detects one orphan in intentionally unconstrained synthetic data; production foreign-key enforcement is a separate configuration claim."
    },
    "mistakes": [
      "A row count can pass while values are wrong. Pair population assertions with business fields and relational checks that would fail for the suspected defect.",
      "Check both intended changes and protected invariants. An update to one order must preserve another order, and each line must reference an existing parent under the declared integrity policy."
    ],
    "takeaways": [
      "Database verification compares stored outcomes with a rule: exact owned rows, values, relationships and constraints. Use primary keys and scoped joins rather than selecting an arbitrary first row.",
      "This in-memory join detects one orphan in intentionally unconstrained synthetic data; production foreign-key enforcement is a separate configuration claim."
    ],
    "practice": "What makes a database oracle meaningful?|A stated stored invariant|Whatever rows happen to exist|Query execution success|Table names|The query must test intended stored behavior.|Observed output can contain a defect.;A valid query can return wrong business data.;Names do not assert outcomes.\nWhy assert fields as well as count?|Counts can hide wrong values|Counts always fail|Values are never stored|More assertions guarantee correctness|Population size alone does not validate contents.|Counts can still be useful.;Fields contain stored values.;Relevance matters more than quantity.\nAn update targets one order. What else should be checked?|Protected unrelated order|The success message|Sql capitalization|Page color|A narrow mutation must not alter another owned control record.|Messages do not establish mutation scope.;Style does not constrain affected rows.;Presentation is not persisted data.\nA join unexpectedly doubles rows. What should be inspected?|Relationship cardinality|Query indentation|Network speed|Report labels|One-to-many matches can multiply the result population.|Formatting does not change cardinality.;Latency does not define join multiplicity.;Labels do not alter relationships.\nWhat detects missing parents with a left join?|A null parent key|A nonnull child key alone|An ordered title|A larger page limit|Unmatched children have null projected parent fields.|The child can exist without a matching parent.;Ordering does not detect absence.;Pagination does not establish referential integrity.\nAn assertion reads an arbitrary first row. What is the risk?|Wrong record selection|Guaranteed fixture identity|Automatic ordering|Proven uniqueness|The selected row may not be the fixture under test.|No identity predicate was supplied.;SQL requires an explicit ordering contract.;A first result does not prove uniqueness.",
    "formal": "What should identify the verified row?|A scoped stable key|A common surname|A recent timestamp|A display order|Identity and ownership make the comparison interpretable.|Names may repeat.;Concurrent rows can share time windows.;Ordering does not establish ownership.\nWhat does a zero-orphan query establish?|No scoped orphans|Every future write is safe|Foreign keys are enabled|All values are correct|The result is bounded by data and query conditions.|Future writes were not observed.;A query result does not inspect enforcement settings.;Referential matching does not check every field.\nWhy preserve an unchanged control record?|Detect overly broad updates|Increase table size only|Replace all other assertions|Avoid specifying expected values|The control distinguishes intended mutation from collateral change.|Its role is an invariant oracle.;Other effects remain relevant.;The control needs an expected unchanged state.\nA finance test checks one ledger row but omits the balancing entry. What is missing?|Relational invariant|A faster query|A schema rename|An http status|A single row cannot establish balanced paired effects.|Speed does not validate balance.;Naming does not supply the missing check.;Transport success does not prove ledger balance.\nA warehouse count is correct but SKU values are swapped. Which check was weak?|Count-only assertion|Keyed value comparison|Independent expected values|Relationship validation|Equal population size can hide incorrect mapping.|That would expose swapped values.;These support diagnosis.;That can remain useful though insufficient alone.\nAn LMS reads another run\u2019s enrollment by student name. What improves the query?|Run-owned stable key|Raise result limit|Ignore duplicate names|Remove WHERE entirely|A stable scoped key prevents ambiguous name matches.|More rows increase ambiguity.;Ignoring collisions does not select correctly.;That broadens the problem.\nA migration requires no orphan lines. What is direct evidence?|Orphan query|Migration exit code|Source line count|A diagram|The query challenges the required relationship under the fixture.|Execution success does not inspect every effect.;Code size does not verify data integrity.;A diagram is not an observed stored outcome.\nA report sums values after joining repeated child rows. What should be reviewed?|Aggregation grain|Numeric formatting|Database hostname|Test duration|Join multiplication can inflate totals if the grouping grain is wrong.|Formatting does not remove duplicate contribution.;Host identity does not explain join grain.;Runtime cannot establish aggregate correctness.\nA test intentionally disables foreign keys to seed an orphan. What must be explicit?|Synthetic engine limit|Production is definitely broken|Foreign keys never work|Every query is invalid|The example does not prove production enforcement behavior.|The configuration is intentionally local.;The fixture does not support that claim.;Diagnostic queries can still be valid.\nA warehouse query joins one shipment to three lines and two tracking events, then sums shipped quantity. Counts match the six joined rows but the total doubles. What should the oracle address?|Aggregation at the correct grain|Only compare the joined row count|Accept any total divisible by two|Add DISTINCT to every selected value|Independent one-to-many joins multiply contributions; aggregate each appropriate relationship or compare against an independent shipment-level oracle.|Six rows can be the expected join multiplicity while totals are wrong;Divisibility does not establish the correct quantity;Blanket DISTINCT can incorrectly merge equal legitimate values."
  },
  {
    "slug": "transactions-visibility",
    "comp": "m2.c1",
    "title": "Separate committed state from transaction-local evidence",
    "intro": "A test sees its own insert and reports that another service can already read it.",
    "sections": [
      [
        "Design the evidence",
        "A transaction can read its own writes before commit. That observation does not establish visibility to another connection; test the relevant connection boundary and database isolation semantics.",
        "Commit and rollback are different outcomes, and a test must choose the intended one. Avoid assertions that accidentally commit fixture changes before a cleanup strategy expects rollback."
      ],
      [
        "Apply the control",
        "Use a second connection when the requirement concerns another actor\u2019s committed read. SQLite behavior in this local example is not a substitute for PostgreSQL isolation-level testing.",
        "The local script verifies rollback removes the transaction\u2019s insert. It does not simulate concurrent service traffic or certify another database engine."
      ]
    ],
    "prerequisite_note": "Use the canonical SQL and data-management prerequisites to interpret the stated fixture and its evidence boundary.",
    "worked": {
      "lang": "python",
      "problem": "Separate committed state from transaction-local evidence with synthetic local records.",
      "steps": [
        "Read the declared fixture and invariant.",
        "Execute the local example in isolation.",
        "Compare the output with the stated invariant."
      ],
      "code": "import sqlite3\nc=sqlite3.connect(\":memory:\")\nc.execute(\"CREATE TABLE events(id INT)\")\nc.execute(\"INSERT INTO events VALUES(3)\")\nprint(c.execute(\"SELECT count(*) FROM events\").fetchone()[0])\nc.rollback()\nprint(c.execute(\"SELECT count(*) FROM events\").fetchone()[0])",
      "expect": "1\n0",
      "explanation": "The local script verifies rollback removes the transaction\u2019s insert. It does not simulate concurrent service traffic or certify another database engine."
    },
    "mistakes": [
      "Commit and rollback are different outcomes, and a test must choose the intended one. Avoid assertions that accidentally commit fixture changes before a cleanup strategy expects rollback.",
      "Use a second connection when the requirement concerns another actor\u2019s committed read. SQLite behavior in this local example is not a substitute for PostgreSQL isolation-level testing."
    ],
    "takeaways": [
      "A transaction can read its own writes before commit. That observation does not establish visibility to another connection; test the relevant connection boundary and database isolation semantics.",
      "The local script verifies rollback removes the transaction\u2019s insert. It does not simulate concurrent service traffic or certify another database engine."
    ],
    "practice": "Can a transaction read its own insert?|Usually yes|After browser refresh|Never before commit|After deletion|Local visibility can precede commit.|Browser rendering does not control transaction visibility.;Transactions commonly read their own writes.;Deletion is not required for reading.\nWhat does rollback target?|Uncommitted changes|All historic commits|All processes\u2019 memory|Every cache|It abandons the active transaction\u2019s changes.|Committed history is not undone by ordinary rollback.;Database rollback does not reset arbitrary processes.;Caches need their own coordination.\nA same-connection read succeeds. What remains unproven?|External visibility|The local row existed|The SELECT executed|The declared value|The observation is local to the transaction context.|That was directly observed.;The result shows execution.;The selected fixture can establish that value.\nA fixture accidentally commits. What may fail?|Rollback-based cleanup|All SQL syntax|Every query\u2019s ordering|Every foreign key automatically|Committed work survives a later ordinary rollback.|Commit does not invalidate syntax.;Ordering is a separate concern.;A commit does not disable constraints.\nA service requires committed data. What boundary should be exercised?|Separate reader|The writer\u2019s variable|A log message|A table diagram|The reader should reflect the intended service boundary.|Memory state does not prove database visibility.;Logging does not establish visibility.;A diagram shows design rather than observation.\nWhy name the database engine?|Isolation behavior differs|All engines behave identically|Engine names define business rules|Logos differ|Evidence must identify applicable implementation semantics.|Locking and isolation vary.;Policy still comes from requirements.;Behavior differences can affect tests.",
    "formal": "What distinguishes commit from a local read?|Commit boundary|Sql letter case|Row display order|Column count|A read within a transaction does not itself commit it.|Case does not determine transaction state.;Order does not decide commit.;Schema width does not establish persistence.\nWhy avoid hidden commits in helpers?|They change lifecycle assumptions|Helpers cannot mutate|Commits improve every test|Transaction scope is cosmetic|A helper can defeat rollback-based fixture cleanup.|Helpers can issue transaction commands.;They can create residual data.;Scope directly affects persistence.\nWhat should an isolation claim identify?|Engine and isolation|Assertion count|Author name|Test filename|These define the actual visibility and concurrency context.|Counts omit transaction conditions.;Authorship does not specify isolation.;Names do not define database semantics.\nA payment worker sees its own pending insert. Can it claim another worker sees it?|No such guarantee|Yes because rows exist|Yes if the ID is numeric|Yes if logs are green|A separate visibility observation is needed.|Existence within one transaction is insufficient.;Key type does not determine visibility.;Logs do not alter commit state.\nAn import test rolls back then finds a committed row. What should be investigated?|Earlier commit boundaries|Screenshot resolution|Browser cookies|Text encoding|A previous commit can explain persistence beyond rollback.|Images do not control transactions.;Cookies do not explain committed SQL state.;Encoding does not define rollback scope.\nAn LMS migrates from SQLite tests to PostgreSQL. What needs validation?|Target isolation|Test titles|No retesting ever|Database file size|SQLite passing evidence does not certify PostgreSQL semantics.|Titles do not exercise target behavior.;Engine-specific behavior matters.;Size does not characterize isolation.\nA report says rollback cleaned a queued email. What is wrong?|It crosses transaction scope|Rollback cannot affect SQL|Emails are always in-memory|Queue names prove atomicity|External queue effects need independent cleanup or substitution.|It does affect applicable uncommitted SQL.;Actual transport behavior varies.;Names do not establish shared commits.\nA helper commits during setup but teardown assumes uncommitted fixtures. What should align?|Lifecycle strategy|Query whitespace|Report colors|Branch names|The fixture lifecycle must agree on persistence boundaries.|Style does not reconcile transaction state.;Presentation does not clean committed rows.;Source branches do not define database commits.\nA test verifies rollback on one connection. Which claim is justified?|That local transaction reverted|All concurrent races are absent|Every crash is recoverable|Every engine is identical|The claim should match the observed transaction scope.|Concurrency was not exercised.;Crash recovery is a separate mechanism.;The result is engine-specific evidence.\nA test sees its uncommitted insert on the writer connection and passes a requirement that a reporting service reads only committed data. Which replacement gives relevant evidence?|Exercise the reader boundary|Commit silently inside every assertion|Read the writer connection twice|Assume SQLite proves PostgreSQL behavior|Use the intended reader connection and target-engine isolation contract to distinguish precommit and postcommit observations.|Hidden commits change the scenario being claimed;Repeated local reads do not cross the boundary;Another engine may have different isolation semantics."
  },
  {
    "slug": "aggregate-null",
    "comp": "m2.c1",
    "title": "Handle NULL and aggregate oracles correctly",
    "intro": "A reporting test treats missing invoice totals as zero and hides incomplete imports.",
    "sections": [
      [
        "Design the evidence",
        "NULL represents missing or unknown information in SQL. Test it with IS NULL or IS NOT NULL; equality with NULL does not behave like equality with an ordinary value.",
        "COUNT(*) counts rows while COUNT(column) ignores null values in that column. Choose the expression that represents the requirement rather than substituting one mechanically."
      ],
      [
        "Apply the control",
        "Use COALESCE only when the business rule intentionally supplies a default. Turning unknown into zero can erase a data-quality defect and change aggregate meaning.",
        "The local query distinguishes total rows from populated amounts. It does not establish a policy that missing monetary amounts should become zero."
      ]
    ],
    "prerequisite_note": "Use the canonical SQL and data-management prerequisites to interpret the stated fixture and its evidence boundary.",
    "worked": {
      "lang": "python",
      "problem": "Handle NULL and aggregate oracles correctly with synthetic local records.",
      "steps": [
        "Read the declared fixture and invariant.",
        "Execute the local example in isolation.",
        "Compare the output with the stated invariant."
      ],
      "code": "import sqlite3\nc=sqlite3.connect(\":memory:\")\nc.executescript(\"CREATE TABLE invoices(amount INT); INSERT INTO invoices VALUES(10),(NULL),(0);\")\nprint(c.execute(\"SELECT count(*),count(amount),sum(amount) FROM invoices\").fetchone())",
      "expect": "(3, 2, 10)",
      "explanation": "The local query distinguishes total rows from populated amounts. It does not establish a policy that missing monetary amounts should become zero."
    },
    "mistakes": [
      "COUNT(*) counts rows while COUNT(column) ignores null values in that column. Choose the expression that represents the requirement rather than substituting one mechanically.",
      "Use COALESCE only when the business rule intentionally supplies a default. Turning unknown into zero can erase a data-quality defect and change aggregate meaning."
    ],
    "takeaways": [
      "NULL represents missing or unknown information in SQL. Test it with IS NULL or IS NOT NULL; equality with NULL does not behave like equality with an ordinary value.",
      "The local query distinguishes total rows from populated amounts. It does not establish a policy that missing monetary amounts should become zero."
    ],
    "practice": "Which predicate checks missing values?|IS NULL|Equals NULL|Equals zero|Equals empty string|NULL needs its dedicated predicate.|Ordinary equality yields unknown rather than matching null.;Zero is a known numeric value.;Empty text is distinct from missingness.\nWhat does COUNT(*) count?|Rows|Nonnull amounts|Positive amounts|Unique values|It includes rows with null fields.|That describes COUNT(amount).;No positive filter is implied.;DISTINCT is a separate operation.\nA count of populated emails is required. Which expression fits?|COUNT(email)|COUNT(*) always|SUM(email)|MAX(email)|Null emails are excluded from this expression.|That also counts missing-email rows.;Adding strings is not the population rule.;A maximum does not count population.\nMissing prices are converted to zero. What needs approval?|The defaulting rule|Text color|Query speed|Table alias|Defaulting changes the meaning of unknown information.|Presentation does not define monetary semantics.;Performance does not justify a business default.;Aliases do not establish policy.\nA report totals no matching rows. What needs explicit handling?|Empty aggregate semantics|Alphabetical order|User name|Test duration|An empty population can differ from a known zero total.|Ordering cannot define an empty total.;Identity does not define aggregate semantics.;Runtime does not determine the expected value.\nA fixture contains zero and NULL. Why keep both?|Different partitions|They are always identical|NULL means negative|Zero cannot be stored|Known zero and missing information need distinct expectations.|SQL distinguishes them.;Missingness is not a sign.;Zero is a valid numeric value.",
    "formal": "Why avoid equality with NULL?|Unknown comparison|NULL is always text|All comparisons crash|SQL has no null tests|SQL unknown semantics prevent the intended ordinary match.|NULL is not simply a text literal.;They generally evaluate rather than crash.;IS NULL is available.\nWhat does COUNT(amount) omit?|Null amounts|Zero amounts|Negative amounts|Duplicate amounts automatically|Only nonnull expressions contribute to the count.|Zero is nonnull and counted.;Negative numbers are still nonnull.;Duplicates remain unless DISTINCT is used.\nWhen is COALESCE defensible?|When the default matches the rule|Whenever a chart looks better|Whenever a query is slow|Always for money|A default is a semantic policy decision.|Appearance cannot justify changing meaning.;Defaulting does not define performance requirements.;Missing money may require rejection instead.\nA finance dashboard shows three invoices but two known amounts. What does this imply?|One amount is missing|One invoice must be duplicate|All amounts sum to zero|The query necessarily failed|The row count and populated count measure different properties.|Counts alone do not show duplicate identity.;No such total follows.;Different counts can be a valid result.\nAn import accepts blank amount text as zero. What should testing challenge?|Blank versus zero|Numeric ordering|A logo update|Positive cases|The input conversion may conceal missing required data.|Ordering does not test the conversion rule.;Branding does not validate imported values.;Negative partitions are essential here.\nA warehouse query uses WHERE quantity = NULL. Why are missing rows absent?|The predicate does not match nulls|The database erased all rows|NULL equals every quantity|The column cannot contain NULL|IS NULL is required for the intended missingness filter.|No deletion was described.;That contradicts SQL semantics.;The fixture may explicitly allow it.\nA hospital requires every measurement present. Which oracle helps?|Compare counts|SUM alone|MAX alone|Successful select|Equality challenges missingness within the selected population.|A total can hide missing values.;A maximum does not show completeness.;Execution success does not establish complete data.\nAn empty billing period defaults to zero by approved policy. What should be tested?|Both populations|A populated period|Column aliases|Report font|Both the default branch and normal totals need evidence.|That misses the default branch.;Names do not exercise data semantics.;Presentation does not verify arithmetic.\nAn LMS AVG ignores missing scores. What must the reviewer know?|Denominator|Dashboard width|Test count|Table name|Nonmissing scores differ from all enrolled learners.|Layout does not explain average population.;Counts do not define denominator semantics.;Names do not establish which learners contribute.\nA hospital report left-joins patients to measurements then uses COUNT(*) to claim every patient has a measurement. A patient with no match still contributes a row. Which assertion is needed?|Count matching measurement keys|Convert all missing values to zero|Only count left-side patient keys|Compare report width before and after|A left join preserves unmatched patients; a nonnull child-key count or explicit missing-child predicate tests actual measurement presence.|Zero substitution can hide missingness;Left-side keys remain present without measurements;Layout width does not establish relational completeness."
  },
  {
    "slug": "privacy-minimization",
    "comp": "m3.c1",
    "title": "Prefer synthetic data and minimize sensitive fields",
    "intro": "A QA request asks for customer exports even though the defect needs only date and region categories.",
    "sections": [
      [
        "Design the evidence",
        "Data minimization starts with the test purpose. Prefer purpose-built synthetic records and exclude fields that do not affect the behavior being examined.",
        "Removing names alone does not anonymize a dataset. Dates, rare categories, locations and external identifiers can enable linkage or reveal a person through combinations."
      ],
      [
        "Apply the control",
        "Keep actual customer records out of these exercises. If an organization considers production-derived data, authorized privacy review must define lawful scope, access, retention and residual reidentification risk.",
        "The synthetic projection demonstrates field minimization. It is not an anonymization certification or permission to process real customer records."
      ]
    ],
    "prerequisite_note": "Use the canonical SQL and data-management prerequisites to interpret the stated fixture and its evidence boundary.",
    "worked": {
      "lang": "python",
      "problem": "Prefer synthetic data and minimize sensitive fields with synthetic local records.",
      "steps": [
        "Read the declared fixture and invariant.",
        "Execute the local example in isolation.",
        "Compare the output with the stated invariant."
      ],
      "code": "row={\"fixture_id\":\"synthetic-1\",\"region\":\"north\",\"birth_date\":\"2000-01-01\",\"email\":\"invented@example.invalid\"}\nallowed={\"fixture_id\",\"region\"}\nprint(sorted(k for k in row if k in allowed))",
      "expect": "['fixture_id', 'region']",
      "explanation": "The synthetic projection demonstrates field minimization. It is not an anonymization certification or permission to process real customer records."
    },
    "mistakes": [
      "Removing names alone does not anonymize a dataset. Dates, rare categories, locations and external identifiers can enable linkage or reveal a person through combinations.",
      "Keep actual customer records out of these exercises. If an organization considers production-derived data, authorized privacy review must define lawful scope, access, retention and residual reidentification risk."
    ],
    "takeaways": [
      "Data minimization starts with the test purpose. Prefer purpose-built synthetic records and exclude fields that do not affect the behavior being examined.",
      "The synthetic projection demonstrates field minimization. It is not an anonymization certification or permission to process real customer records."
    ],
    "practice": "What should determine included fields?|The test purpose|Everything available|File size|Convenience|Only necessary attributes belong in the fixture.|Availability does not establish necessity.;Small files can still contain sensitive data.;Convenience is not a data requirement.\nDoes deleting names guarantee anonymity?|No such guarantee|Always|In csv|After compression|Other attributes can permit linkage or identification.|Names are not the only identifying attributes.;File format does not remove linkage risk.;Compression is not privacy protection.\nA date-format bug needs only invented dates. What is preferred?|Synthetic boundary records|A full customer export|Real payment details|Unrestricted production access|They exercise the behavior without customer extraction.|Unrelated records add privacy exposure.;Those do not support the date rule.;The test does not require it.\nA rare diagnosis and postcode remain after name removal. What persists?|Reidentification risk|Guaranteed anonymity|Formatting risk|No useful data|Combined quasi-identifiers can identify people.|Name removal alone is insufficient.;The remaining attributes have privacy significance.;The data may still be highly informative.\nA screenshot contains a real access token. What should happen before sharing?|Redact secrets|Share it unchanged|Resize it|Rename the file|Evidence handling must avoid disclosing usable credentials.|That exposes the credential.;Resizing may preserve readable secrets.;Naming does not remove token content.\nA fixture retains unused phone numbers. What should be questioned?|Field necessity|Sort order|Query syntax|Icon choice|Unused identifying fields add exposure without test value.|Ordering does not justify retention.;Syntax does not establish purpose.;Presentation is unrelated to minimization.",
    "formal": "What is a quasi-identifier?|Linkage attribute|A random assertion ID|A database engine brand|A universal anonymity guarantee|Combinations can reveal identity without a direct name.|Not every identifier relates to a person.;That does not describe a person.;The concept concerns risk instead.\nWhy prefer synthetic data here?|Avoid unnecessary real-record exposure|Synthetic proves all privacy compliance|Synthetic must be realistic in every detail|Synthetic cannot contain edge cases|Purpose-built cases can cover behavior without customer records.|Process and configuration still matter.;Only relevant characteristics are needed.;It can deliberately target them.\nWhat does a minimized projection demonstrate?|Selected field exclusion|Certified anonymization|Approved production processing|All linkage eliminated|It shows which fixture keys remain under the allowlist.|Field projection alone is insufficient.;A script grants no authorization.;Remaining attributes may still be linkable.\nA support export includes home addresses for a currency test. What should change?|Exclude address fields|Add more customer details|Keep them for convenience|Publish the export|Currency behavior need not expose unrelated addresses.|That increases unnecessary exposure.;Convenience does not establish necessity.;Sharing expands the exposure.\nAn insurer removes names but retains exact rare event dates. What needs review?|Linkage risk|Column capitalization|File extension|No review because names are gone|Rare attributes can permit linkage.|Case does not affect attribute uniqueness.;Format does not remove identifying patterns.;Other identifiers remain relevant.\nA learner needs malformed-email testing. Which data fits?|Invented addresses|Customer inbox exports|A real password list|Production delivery to strangers|Synthetic addresses can target syntax without real inboxes.|Those are unnecessary for syntax testing.;Passwords are unrelated and sensitive.;Live messaging is unnecessary here.\nA QA attachment includes unused customer metadata. What should precede retention?|Purpose review|Compression|A renamed folder|A public download link|Each retained field needs an actual testing need.|Compression preserves the information.;The data content is unchanged.;That broadens disclosure.\nAn LMS masks names but leaves student IDs usable elsewhere. What remains?|Linkage through identifiers|Guaranteed anonymity|Aesthetic inconsistency|No relationship to privacy|Stable external identifiers can reconnect records.|Masking one field does not remove links.;The risk concerns identity linkage.;Identifiers directly affect privacy exposure.\nA retailer says synthetic data covers every production distribution. What is wrong?|Unsupported scope claim|Synthetic is always useless|Real exports are mandatory|Privacy forbids all testing|Synthetic fixtures cover their designed characteristics.|Purposeful fixtures are valuable.;Many rules can be tested synthetically.;Minimized synthetic testing remains possible.\nA synthetic-data review finds no names but a proposed production-derived export retains exact birth dates, rare roles and stable public IDs. What follows from the field list?|Linkage risk remains unresolved|Name removal certifies anonymity|Compression makes the export safe|Every rare field must be necessary|Combinations and external linkage can identify people; purpose minimization and authorized privacy review are still needed before any real-data use.|Names are only one identifier class;Compression does not remove information;Rarity does not establish testing necessity."
  },
  {
    "slug": "consistent-masking",
    "comp": "m3.c1",
    "title": "Preserve useful relationships without exposing identity",
    "intro": "A synthetic customer fixture is transformed before joining orders, and inconsistent substitutions break the relationship.",
    "sections": [
      [
        "Design the evidence",
        "Consistent substitution uses one mapping per original synthetic identity across related tables. This preserves the join needed by a test while separating displayed values from their original representation.",
        "Pseudonymization is not anonymization. A reversible mapping, stable token or linkable attribute may still permit identification, so mapping tables require access controls and bounded retention."
      ],
      [
        "Apply the control",
        "Validate both privacy intent and test utility: direct fields excluded as required, relationships intact, uniqueness preserved where promised, and no accidental collision that merges two people.",
        "The example maps invented IDs only. It demonstrates referential consistency and does not claim cryptographic protection, safe hashing or permission to transform real records."
      ]
    ],
    "prerequisite_note": "Use the canonical SQL and data-management prerequisites to interpret the stated fixture and its evidence boundary.",
    "worked": {
      "lang": "python",
      "problem": "Preserve useful relationships without exposing identity with synthetic local records.",
      "steps": [
        "Read the declared fixture and invariant.",
        "Execute the local example in isolation.",
        "Compare the output with the stated invariant."
      ],
      "code": "mapping={\"invented-a\":\"p1\",\"invented-b\":\"p2\"}\ncustomers=[\"invented-a\",\"invented-b\"]\norders=[\"invented-b\"]\nmasked_customers={mapping[x] for x in customers}\nprint(all(mapping[x] in masked_customers for x in orders))",
      "expect": "True",
      "explanation": "The example maps invented IDs only. It demonstrates referential consistency and does not claim cryptographic protection, safe hashing or permission to transform real records."
    },
    "mistakes": [
      "Pseudonymization is not anonymization. A reversible mapping, stable token or linkable attribute may still permit identification, so mapping tables require access controls and bounded retention.",
      "Validate both privacy intent and test utility: direct fields excluded as required, relationships intact, uniqueness preserved where promised, and no accidental collision that merges two people."
    ],
    "takeaways": [
      "Consistent substitution uses one mapping per original synthetic identity across related tables. This preserves the join needed by a test while separating displayed values from their original representation.",
      "The example maps invented IDs only. It demonstrates referential consistency and does not claim cryptographic protection, safe hashing or permission to transform real records."
    ],
    "practice": "What should related tables share?|A consistent mapping|Independent random replacements|Matching column colors|Shared filenames|The same source identity must receive compatible substitutions.|Uncoordinated values can break joins.;Colors do not preserve keys.;Files do not define identity mapping.\nDoes pseudonymization guarantee anonymity?|No such guarantee|Always|For integers|After sorting|Mappings and linked attributes can retain identification risk.|Stable replacements may remain linkable.;Key type does not remove linkage risk.;Sorting does not anonymize records.\nA masking map merges two IDs. What is damaged?|Identity integrity|Query speed|Text style|No behavior ever|Collisions can combine distinct entities incorrectly.|The principal defect is identity corruption.;Style does not explain merged entities.;Merged identities can change application outcomes.\nA mapping table can recover original values. What does it need?|Restricted access|Public documentation of every value|No retention rule|A shorter filename|The mapping can reconnect transformed data with originals.|That defeats separation.;The sensitive link still needs lifecycle control.;Names do not protect contents.\nOrders reference transformed customers. What should be checked?|Every order key resolves|Row display order|Customer count|A successful export|The test needs preserved referential consistency.|Ordering does not establish matching parents.;Counts can pass while keys mismatch.;Export completion does not prove joins.\nA stable hash is described as anonymous. What is missing?|Linkage analysis|A logo|Whitespace normalization|A blanket guarantee|Predictable inputs or external matches may reveal identities.|Branding does not address reidentification.;Formatting cannot establish anonymity.;The guarantee itself is unsupported.",
    "formal": "What does consistent substitution preserve?|Selected relationships|All production distributions|Every privacy property|Every format automatically|It can retain joins needed for a declared test.|The transformation may change distributions.;Privacy needs separate analysis.;Substitutions must be designed for required formats.\nWhat should a masking test inspect beyond removed names?|Risk and utility|The output filename|Execution speed|Total columns|Privacy risk and valid test relationships both matter.|Names do not inspect contents.;Speed cannot establish privacy properties.;Sensitive information can remain in fewer columns.\nWhy test collision behavior?|Identity separation|Every token must be reversible|Collisions improve privacy automatically|SQL cannot compare tokens|Unexpected merging can corrupt the scenario\u2019s meaning.|Reversibility is not always required.;They may damage required utility and still leak information.;SQL can compare substituted values.\nA bank masks parent IDs but not ledger references. What fails?|Referential consistency|Numeric precision|Response headers|Ui responsiveness|Related rows no longer use the same identity representation.|The issue is key matching.;Headers do not repair stored relationships.;Layout is not the masking invariant.\nAn LMS publishes a pseudonym-to-student map. What happens?|Identity linkage|Anonymity improves|All data is synthetic|Storage grows|The mapping reconnects substitutes to identities.|Publishing the link undermines separation.;A map does not establish synthetic origin.;The main concern is identity exposure.\nA retailer\u2019s masked emails all become one value despite uniqueness constraints. What needs redesign?|The substitution strategy|The constraint disabled|Test names|A bigger timeout|It must preserve required uniqueness without real addresses.|Removing integrity can invalidate the test.;Names do not change duplicate values.;Waiting does not resolve deterministic collisions.\nA synthetic mapping preserves joins. Which claim is limited?|Anonymization proof|The observed join succeeded|The fixture mapping exists|The source IDs were invented|Join preservation does not establish anonymization.|That can be directly observed.;It is declared input.;That is part of the fixture definition.\nA transformation changes all dates to one day. What may be lost?|Temporal boundary coverage|Every direct identifier necessarily|All foreign keys necessarily|Color consistency|The new data may omit expiry and sequence cases.|Date replacement does not address all identifiers.;Date changes need not affect keys.;The concern is test utility.\nA support fixture stores the mapping beside a public artifact. What should be reviewed?|Restricted mapping access|The artifact title|The csv delimiter|Column ordering|Co-located public mappings can expose the original relationship.|Naming does not constrain access.;Delimiter choice does not protect mapping data.;Order does not prevent reidentification.\nA masking job consistently maps customers and orders but truncates tokens, causing two distinct customers to merge. Join checks pass because both now share one parent. What test closes the gap?|Verify identity separation too|Only rerun the same join check|Remove the uniqueness constraint|Accept joins as privacy certification|Referential matching alone does not detect collisions; distinct source identities must remain distinct where the test requires uniqueness.|The existing join oracle can keep passing after merging;Disabling integrity conceals the utility defect;Join validity does not certify privacy."
  },
  {
    "slug": "retention-evidence",
    "comp": "m3.c1",
    "title": "Control fixture retention and diagnostic artifacts",
    "intro": "A test run deletes database rows but leaves exports and failure screenshots indefinitely.",
    "sections": [
      [
        "Design the evidence",
        "Data lifecycle includes exports, logs, traces, screenshots, backups and mapping files, not only the main fixture table. Assign each artifact an owner, purpose and retention deadline.",
        "Deleting database rows does not erase copied evidence. Treat diagnostic collection as a controlled projection and avoid writing secrets or unnecessary identifying fields in the first place."
      ],
      [
        "Apply the control",
        "Test cleanup and retention rules with synthetic inventory: due artifacts removed, active diagnostic holds preserved under explicit authority, and unrelated run artifacts untouched.",
        "This local inventory evaluates a declared deadline rule only. It does not prove physical erasure, backup expiry or access-control enforcement in a deployed storage system."
      ]
    ],
    "prerequisite_note": "Use the canonical SQL and data-management prerequisites to interpret the stated fixture and its evidence boundary.",
    "worked": {
      "lang": "python",
      "problem": "Control fixture retention and diagnostic artifacts with synthetic local records.",
      "steps": [
        "Read the declared fixture and invariant.",
        "Execute the local example in isolation.",
        "Compare the output with the stated invariant."
      ],
      "code": "items=[{\"id\":\"r1-log\",\"expiry\":5},{\"id\":\"r2-trace\",\"expiry\":12}]\nnow=10\nprint([x[\"id\"] for x in items if x[\"expiry\"] <= now])",
      "expect": "['r1-log']",
      "explanation": "This local inventory evaluates a declared deadline rule only. It does not prove physical erasure, backup expiry or access-control enforcement in a deployed storage system."
    },
    "mistakes": [
      "Deleting database rows does not erase copied evidence. Treat diagnostic collection as a controlled projection and avoid writing secrets or unnecessary identifying fields in the first place.",
      "Test cleanup and retention rules with synthetic inventory: due artifacts removed, active diagnostic holds preserved under explicit authority, and unrelated run artifacts untouched."
    ],
    "takeaways": [
      "Data lifecycle includes exports, logs, traces, screenshots, backups and mapping files, not only the main fixture table. Assign each artifact an owner, purpose and retention deadline.",
      "This local inventory evaluates a declared deadline rule only. It does not prove physical erasure, backup expiry or access-control enforcement in a deployed storage system."
    ],
    "practice": "What belongs in a fixture lifecycle inventory?|All artifacts|Primary tables|Source code|Test titles|Sensitive copies can exist outside the main database.|Other artifacts can retain the same data.;Runtime evidence has its own lifecycle.;Titles do not enumerate retained data.\nDoes database deletion erase screenshots?|No such guarantee|Always|On fast machines|If ids match|Screenshots are separate copies.|Database mutations do not remove image files.;Machine speed does not connect storage lifecycles.;Matching names do not delete files.\nA diagnostic trace contains a secret. What is preferable?|Prevent secret capture|Keep every secret forever|Change the extension|Lower image quality|Avoiding unnecessary collection reduces later exposure.|Indefinite retention increases exposure.;Renaming preserves content.;The secret may remain recoverable.\nAn artifact deadline has passed. What should the rule specify?|Deletion or an authorized hold|Silent indefinite retention|Automatic publication|Deletion of every run|Retention decisions need explicit policy and ownership.|That abandons the declared lifecycle.;Expiry does not authorize sharing.;Ownership boundaries still matter.\nCleanup removes another run\u2019s active trace. What failed?|Ownership scope|Response schema|Date formatting|Test case order|Retention work must preserve unrelated owners\u2019 evidence.|The issue concerns artifact selection.;The wrong owner was targeted.;Order does not justify cross-run deletion.\nA local expiry list is correct. What remains unverified?|Actual storage deletion|The selected IDs|The cutoff input|The comparison rule|Selecting due items is not executing physical removal.|Those can be observed.;It is declared.;The local computation exercises it.",
    "formal": "Why assign artifact ownership?|Accountable lifecycle control|Owners make data anonymous|Owners replace access controls|Owners remove all copies automatically|An owner can resolve scope purpose and retention decisions.|Ownership does not anonymize contents.;Storage permissions still matter.;Deletion still requires implementation.\nWhat does a retention deadline express?|A lifecycle decision point|A proof of physical erasure|Permission to expose data|A guarantee no backups exist|It identifies when the stated disposition should apply.|A date does not execute deletion.;Retention does not authorize disclosure.;Backups need explicit lifecycle handling.\nWhy minimize diagnostic fields?|Minimize exposure|Make every failure disappear|Avoid all assertions|Guarantee anonymity|Evidence should retain what diagnosis needs.|Minimization does not change application behavior.;Testing still needs an oracle.;Residual linkage may remain.\nAn LMS deletes fixture rows but preserves CSVs forever. What needs extension?|The retention scope|Sql index tuning|Report colors|Browser width|Copies must be included in lifecycle rules.|Indexes do not expire exports.;Presentation does not remove copies.;Layout is unrelated to artifact retention.\nA bank keeps a trace under an approved investigation hold. What should be recorded?|Bounded hold|A vague permanent label|Nothing because it is held|A public mirror|The exception should remain bounded and accountable.|That prevents meaningful lifecycle review.;A hold still needs governance.;Investigation does not authorize broad sharing.\nA warehouse cleanup selects every file older than one day. What risk needs control?|Cross-owner deletion|Guaranteed safe scope|Numeric precision|Status code mismatch|Age alone does not identify fixture ownership.|Old files can belong to other work.;File selection is not arithmetic precision.;The problem is storage selection.\nA trace is redacted after being widely copied. What remains?|Uncontrolled earlier copies|Automatic universal redaction|No original exposure|A filename concern|Editing one artifact does not update all copies.|No such synchronization was established.;Earlier copies may retain it.;The content persists independently of names.\nA synthetic test verifies deadline equality triggers deletion. Which boundary is covered?|The exact cutoff|All storage failures|Every timezone conversion|Every backup policy|Equality behavior is directly exercised.|No actual storage outage was tested.;The fixture uses a simple declared time value.;Backups are outside this local rule.\nA report says a due-file list proves secure erasure. What is wrong?|Selection without erasure|Lists cannot be tested|Deadlines are irrelevant|All storage is insecure|Physical deletion and recovery properties need separate evidence.|Their selection logic can be verified.;They remain relevant to policy.;No universal security conclusion follows.\nA retention job deletes run-owned rows and current logs on schedule, but archived traces and reversible mappings remain under indefinite storage. Which completion claim is justified?|Only the observed deletions|Every fixture copy was erased|All retained artifacts are anonymous|Backup expiry is proven by row deletion|Cleanup evidence must distinguish the artifacts actually removed from unverified archives and mappings with separate lifecycle rules.|Other copies were explicitly not removed;Reversible mappings can retain identification risk;Database deletion says nothing about archive or backup expiry."
  }
]);
Object.defineProperty(bundle.course,'authoredBank',{value:bundle.bank});module.exports=bundle.course;
