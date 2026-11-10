'use strict';
const {course}=require('./data-wave2-helper');
const specs=[
  {
    "id": "as-ctes",
    "comps": [
      "m1.c1"
    ],
    "title": "Decompose analytical queries into explicit CTE stages",
    "intro": "A finance analyst needs customers whose monthly paid totals exceed a threshold. Combining raw line items, joins and filters in one expression makes it easy to double-count or filter at the wrong grain.",
    "sections": [
      [
        "Query meaning and correctness",
        "A common table expression names a query result within one SQL statement using WITH. Use stages to expose changes in grain: eligible order rows, customer-period totals, then threshold selection. Name intermediate columns deliberately and carry only fields that the next stage actually needs.",
        "WHERE filters input rows before aggregation; HAVING filters aggregated groups. A later CTE can instead filter a computed aggregate alias from an earlier stage. Neither style repairs an incorrect join that multiplied facts. Verify intermediate totals and uniqueness against the intended customer-period key."
      ],
      [
        "Execution evidence and practical limits",
        "CTEs are a readability and decomposition mechanism, not a portable promise of materialization. PostgreSQL may fold eligible nonrecursive side-effect-free CTEs into the parent query; MATERIALIZED and NOT MATERIALIZED influence supported cases. Refer to the pinned target-engine rules rather than assuming every named stage creates a stored temporary table.",
        "The fixture first filters paid rows, then aggregates at customer grain, then selects a threshold. SQLite execution demonstrates the result only. Representative PostgreSQL plans are needed to determine whether a CTE blocks useful predicate pushdown or whether explicit materialization is worthwhile."
      ]
    ],
    "lang": "python",
    "problem": "Decompose analytical queries into explicit CTE stages using an isolated synthetic SQL fixture.",
    "steps": [
      "State the required result grain and qualifying rows.",
      "Execute the fixture query on disposable SQLite tables.",
      "Compare its result with the documented output and target-engine limits."
    ],
    "code": "import sqlite3\nc=sqlite3.connect(\":memory:\")\nc.executescript(\"CREATE TABLE orders(customer TEXT, amount INT, paid INT); INSERT INTO orders VALUES('a',30,1),('a',40,1),('a',100,0),('b',20,1);\")\nprint(c.execute('WITH paid AS (SELECT customer,amount FROM orders WHERE paid=1), totals AS (SELECT customer,SUM(amount) AS total FROM paid GROUP BY customer) SELECT customer,total FROM totals WHERE total>=50 ORDER BY customer').fetchall())\nc.close()",
    "expect": "[('a', 70)]",
    "limit": "This example executes SQLite through Python’s standard library. It verifies only this fixture’s result, not PostgreSQL optimizer choices, native performance, concurrent behavior or every dialect feature. PostgreSQL semantics are grounded separately in the pinned official documentation.",
    "mistakes": [
      "A passing small fixture does not establish representative production performance.",
      "Preserve the intended row grain and NULL semantics before optimizing a query."
    ],
    "takeaways": [
      "A common table expression names a query result within one SQL statement using WITH.",
      "Verify correctness and inspect the target engine before drawing performance conclusions."
    ],
    "practice": [
      [
        "What does a nonrecursive CTE name?",
        "A local result",
        "A permanent table",
        "A mandatory disk file",
        "An automatic index",
        "WITH creates a name usable within the statement; it does not by itself create a permanent stored relation."
      ],
      [
        "Which clause filters aggregate groups directly?",
        "HAVING",
        "WHERE before grouping",
        "ORDER BY alone",
        "LIMIT alone",
        "HAVING applies a condition to grouped results rather than individual pre-aggregation rows."
      ],
      [
        "Does a CTE always force PostgreSQL materialization?",
        "No",
        "Yes universally",
        "Only if named totals",
        "Only when uppercase",
        "Eligible PostgreSQL CTEs can be folded under documented rules, so naming a stage is not a universal barrier."
      ],
      [
        "A totals stage returns two rows per customer unexpectedly. What needs review?",
        "Grouping keys",
        "Only indentation",
        "Only alias length",
        "Only the file name",
        "Additional grouping columns can change the intermediate grain and duplicate the intended customer result."
      ],
      [
        "A paid-order filter is applied after totals include unpaid rows. What changed?",
        "Metric eligibility",
        "Only result order",
        "Only output width",
        "Only stage spelling",
        "The aggregate now contains ineligible amounts; filtering after losing the paid attribute cannot restore the intended metric."
      ],
      [
        "A CTE query is readable but slow. What should guide optimization?",
        "Target-engine plans",
        "The number of aliases",
        "Only shorter names",
        "Only fewer line breaks",
        "Execution plans and representative measurements identify actual work; formatting does not establish performance."
      ],
      [
        "A one-to-many join precedes revenue aggregation. What should be checked?",
        "Fact multiplication",
        "Only table color",
        "Only SQL case",
        "Only the last alias",
        "Repeated matching rows can multiply amounts before grouping even when the final SQL is syntactically valid."
      ],
      [
        "A grouped stage needs one row per customer-month. What should its key include?",
        "Customer and month",
        "Only customer name",
        "Only the order amount",
        "Only maximum order id",
        "The grouped key must preserve the intended customer-period grain."
      ],
      [
        "A CTE is used for readability. What can it not guarantee by itself?",
        "Faster execution",
        "Clearer stage names",
        "A statement-local name",
        "A named subquery result",
        "Query decomposition is not a performance guarantee; the target optimizer and workload determine execution."
      ],
      [
        "A join duplicates paid orders before a CTE sums them. What should be corrected?",
        "The join multiplicity",
        "Only the alias spelling",
        "Only the threshold value",
        "Only the final display order",
        "An aggregate cannot recover the intended sum if input facts were multiplied by an incorrect relationship."
      ]
    ],
    "formal": [
      [
        "What is the scope of a CTE name?",
        "Its statement",
        "The session",
        "Every future connection",
        "The operating system",
        "A CTE is a named component of one SQL statement, not a persistent schema object."
      ],
      [
        "What should each analytical stage make explicit?",
        "Result grain",
        "Layout",
        "Only query length",
        "Only capitalization",
        "An explicit grain makes key assumptions and unintended row expansion inspectable."
      ],
      [
        "What does GROUP BY customer produce without extra grouping fields?",
        "One per customer group",
        "One per order",
        "One row per numeric value",
        "A permanent customer index",
        "Grouping combines qualifying rows by customer, producing one aggregate row per observed group."
      ],
      [
        "A monthly revenue report accidentally groups by order id too. What results?",
        "A finer grain",
        "A coarser grain",
        "A forced full join",
        "An automatic deduplication",
        "Including order identity separates orders that were supposed to contribute to one customer-period aggregate."
      ],
      [
        "A developer assumes a CTE caches results across API requests. What is wrong?",
        "Its lifetime is statement-local",
        "SQL cannot name queries",
        "Aggregates cannot be reused",
        "Aliases require disk files",
        "A CTE is evaluated within a statement and is not a cross-request application cache."
      ],
      [
        "A threshold must apply to customer totals, not each order. Where should it act?",
        "After customer aggregation",
        "Before summing each order",
        "Only in ORDER BY",
        "Only inside a join key",
        "Filtering individual small orders can remove amounts that should contribute to a qualifying customer total."
      ],
      [
        "A PostgreSQL query references a complex CTE twice. What should be examined?",
        "The target plan",
        "CTE spelling",
        "Only client text length",
        "Only database port",
        "Reference count and documented eligibility affect planning; inspect actual target behavior rather than infer it from syntax."
      ],
      [
        "A team uses MATERIALIZED to fix a slow query. What remains necessary?",
        "Representative comparison",
        "Automatic acceptance",
        "Removal of correctness checks",
        "A universal policy for all CTEs",
        "Forcing a barrier can help or hurt depending on reuse, filtering and workload, so measured comparison is required."
      ],
      [
        "A stage drops the period field before a monthly comparison. What may be lost?",
        "The comparison key",
        "Only a display label",
        "Only indentation",
        "Only a driver option",
        "Without the period identity, downstream grouping or joins may combine different months incorrectly."
      ],
      [
        "A refactor splits a correct query into stages. What establishes semantic equivalence?",
        "Results and edge-case checks",
        "Only matching stage count",
        "Only shorter SQL",
        "Only an identical runtime once",
        "Refactoring must preserve qualifying rows, multiplicity, NULL behavior and aggregation meaning across relevant cases."
      ]
    ]
  },
  {
    "id": "as-exists",
    "comps": [
      "m1.c2"
    ],
    "title": "Use correlated EXISTS for membership without join multiplication",
    "intro": "An account team needs customers who have at least one qualifying order. Returning every matching order then removing duplicates wastes clarity and can break later totals.",
    "sections": [
      [
        "Query meaning and correctness",
        "A correlated subquery refers to values from the outer row. EXISTS asks whether the subquery produces any row; it does not return the selected inner values. Correlate on the complete relationship key, including tenant or other identity scope when required.",
        "An EXISTS predicate behaves like a semijoin for membership: each qualifying outer row appears once regardless of the number of inner matches. This preserves outer multiplicity, not uniqueness that was absent in the outer input. SELECT 1 is conventional because the existence test normally cares about rows rather than projected payload."
      ],
      [
        "Execution evidence and practical limits",
        "Logical correlation does not imply that PostgreSQL must execute a naive independent scan for every outer row. The planner may transform supported shapes into other access strategies. Inspect plans, selectivity and indexes rather than estimating cost solely from the presence of nested query text.",
        "The fixture has two qualifying orders for one customer. EXISTS returns one outer customer record. The result establishes membership behavior on SQLite; it does not prove a particular PostgreSQL semijoin plan or timing."
      ]
    ],
    "lang": "python",
    "problem": "Use correlated EXISTS for membership without join multiplication using an isolated synthetic SQL fixture.",
    "steps": [
      "State the required result grain and qualifying rows.",
      "Execute the fixture query on disposable SQLite tables.",
      "Compare its result with the documented output and target-engine limits."
    ],
    "code": "import sqlite3\nc=sqlite3.connect(\":memory:\")\nc.executescript('CREATE TABLE customers(id INT); CREATE TABLE orders(customer INT, amount INT); INSERT INTO customers VALUES(1),(2); INSERT INTO orders VALUES(1,20),(1,30),(2,2);')\nprint(c.execute('SELECT c.id FROM customers c WHERE EXISTS (SELECT 1 FROM orders o WHERE o.customer=c.id AND o.amount>=10) ORDER BY c.id').fetchall())\nc.close()",
    "expect": "[(1,)]",
    "limit": "This example executes SQLite through Python’s standard library. It verifies only this fixture’s result, not PostgreSQL optimizer choices, native performance, concurrent behavior or every dialect feature. PostgreSQL semantics are grounded separately in the pinned official documentation.",
    "mistakes": [
      "A passing small fixture does not establish representative production performance.",
      "Preserve the intended row grain and NULL semantics before optimizing a query."
    ],
    "takeaways": [
      "A correlated subquery refers to values from the outer row.",
      "Verify correctness and inspect the target engine before drawing performance conclusions."
    ],
    "practice": [
      [
        "What does EXISTS test?",
        "Row existence",
        "The sum of projected values",
        "The first numeric value",
        "The column-name length",
        "EXISTS is true when the subquery returns at least one row, independently of a conventional constant projection."
      ],
      [
        "What makes a subquery correlated?",
        "An outer-row reference",
        "An uppercase keyword",
        "A table with an index",
        "A mandatory aggregate",
        "Correlation means the inner expression refers to values from the enclosing query."
      ],
      [
        "Does EXISTS multiply an outer row for multiple inner matches?",
        "No",
        "Always",
        "Only with SELECT 1",
        "Only without an index",
        "The predicate decides whether to keep the outer row rather than emitting one joined row per match."
      ],
      [
        "A customer has ten eligible orders. How many rows does membership return for its single outer row?",
        "One",
        "Ten by definition",
        "Zero automatically",
        "One hundred",
        "A true existence predicate retains that one outer row once."
      ],
      [
        "A multi-tenant query correlates customer id but omits tenant. What can fail?",
        "Identity isolation",
        "Only sort order",
        "Only row formatting",
        "Only CTE naming",
        "Ids may be unique only within a tenant; an incomplete relationship can match another tenant’s records."
      ],
      [
        "A subquery forgets its customer correlation. What may happen?",
        "Global eligibility",
        "Only the right customer remains",
        "No row can ever qualify",
        "The query becomes automatically indexed",
        "An uncorrelated existence condition has the same truth value for every outer row under a fixed statement snapshot."
      ],
      [
        "A reviewer equates correlated syntax with repeated full scans. What is needed?",
        "A target-engine plan",
        "Only shorter aliases",
        "Only fewer columns",
        "Only a larger font",
        "The optimizer may transform the expression, so syntax alone does not establish the physical access strategy."
      ]
    ],
    "formal": [
      [
        "What does SELECT 1 conventionally emphasize inside EXISTS?",
        "Only row presence matters",
        "Exactly one match",
        "The returned id is always one",
        "The subquery is a permanent table",
        "The selected constant is not an instruction to require exactly one row; existence is the test."
      ],
      [
        "What multiplicity does EXISTS preserve?",
        "Outer input multiplicity",
        "One row per inner match",
        "Only unique customers globally",
        "Exactly one row total",
        "Each qualifying outer row is kept without expansion by inner matches, but duplicate outer rows remain duplicates."
      ],
      [
        "Which predicate expresses at least one qualifying related row?",
        "Correlated EXISTS",
        "A join",
        "COUNT of all outer rows",
        "A CROSS JOIN alone",
        "A correctly correlated EXISTS directly expresses related-row membership."
      ],
      [
        "A customer export joins orders and emits repeated emails. What query shape fits membership?",
        "Correlated EXISTS",
        "A larger CROSS JOIN",
        "ORDER BY email only",
        "An unrelated SUM",
        "Membership should test the relationship without producing one result per matching order."
      ],
      [
        "A tenant-scoped customer number appears in two tenants. What should correlation include?",
        "Tenant and customer",
        "Customer alone",
        "Tenant name length",
        "Only the order date",
        "The complete scoped identity prevents cross-tenant matches."
      ],
      [
        "An outer table already duplicates customer ids. What does EXISTS guarantee?",
        "Outer multiplicity",
        "Uniqueness",
        "A primary key constraint",
        "One output row per id necessarily",
        "EXISTS preserves qualifying outer rows, so upstream duplicates still need separate investigation."
      ],
      [
        "An inner filter uses amount>100 but the rule requires amount>=100. What differs?",
        "Boundary eligibility",
        "Sorting",
        "Only string encoding",
        "Only result column labels",
        "An order exactly at the threshold is excluded by the strict comparison."
      ],
      [
        "A developer replaces EXISTS with a join before counting customers. What must be preserved?",
        "Customer grain",
        "Only SQL indentation",
        "Only projection order",
        "Only alias spelling",
        "Joining multiple related rows can inflate counts unless the query restores the intended customer grain."
      ],
      [
        "A slow membership query gets an index on the inner relationship key. What should be evaluated?",
        "Selectivity, plan and write cost",
        "Only whether the index exists",
        "Only its name length",
        "Only the query’s line count",
        "An index is a candidate access path with workload-dependent benefits and maintenance cost."
      ],
      [
        "A refactor adds volatile side effects inside an existence subquery. What assumption is unsafe?",
        "Evaluation count",
        "Row presence",
        "The existence of inner rows",
        "The meaning of a comparison",
        "Optimizers and early termination mean existence queries should not rely on a particular count or order of side-effect evaluation."
      ]
    ]
  },
  {
    "id": "as-antijoin",
    "comps": [
      "m1.c2"
    ],
    "title": "Express missing relationships without NULL traps",
    "intro": "Operations needs customers with no paid order. An anti-membership question should not turn unknown inner values into a misleading empty result.",
    "sections": [
      [
        "Query meaning and correctness",
        "NOT EXISTS keeps an outer row when no inner row satisfies the complete correlation and eligibility condition. SQL WHERE retains only true conditions; unknown comparisons do not match. Decide whether a missing outer key is an allowed business case rather than treating NULL as an ordinary identifier.",
        "NOT IN has important three-valued-logic behavior. If no equal candidate exists but its list contains NULL, the result can be unknown rather than true, and WHERE removes the row. A left anti-join can also work when the tested inner column is guaranteed nonnull on any genuine match; testing an arbitrary nullable payload is unsafe."
      ],
      [
        "Execution evidence and practical limits",
        "The fixture includes an inner NULL customer key. NOT EXISTS still finds the customer with no related order, while NOT IN produces no rows. Both behaviors follow their respective predicates; they are not interchangeable merely because the English descriptions sound similar.",
        "For a left anti-join, put qualifying inner conditions in ON when the question is absence of qualifying matches. Moving an inner condition to WHERE can discard the null-extended rows one intended to retain. Validate empty inputs, duplicates, NULL keys and eligibility boundaries."
      ]
    ],
    "lang": "python",
    "problem": "Express missing relationships without NULL traps using an isolated synthetic SQL fixture.",
    "steps": [
      "State the required result grain and qualifying rows.",
      "Execute the fixture query on disposable SQLite tables.",
      "Compare its result with the documented output and target-engine limits."
    ],
    "code": "import sqlite3\nc=sqlite3.connect(\":memory:\")\nc.executescript('CREATE TABLE customers(id INT); CREATE TABLE orders(customer INT); INSERT INTO customers VALUES(1),(2); INSERT INTO orders VALUES(1),(NULL);')\nprint(c.execute('SELECT c.id FROM customers c WHERE NOT EXISTS(SELECT 1 FROM orders o WHERE o.customer=c.id) ORDER BY c.id').fetchall())\nprint(c.execute('SELECT id FROM customers WHERE id NOT IN (SELECT customer FROM orders) ORDER BY id').fetchall())\nc.close()",
    "expect": "[(2,)]\n[]",
    "limit": "This example executes SQLite through Python’s standard library. It verifies only this fixture’s result, not PostgreSQL optimizer choices, native performance, concurrent behavior or every dialect feature. PostgreSQL semantics are grounded separately in the pinned official documentation.",
    "mistakes": [
      "A passing small fixture does not establish representative production performance.",
      "Preserve the intended row grain and NULL semantics before optimizing a query."
    ],
    "takeaways": [
      "NOT EXISTS keeps an outer row when no inner row satisfies the complete correlation and eligibility condition.",
      "Verify correctness and inspect the target engine before drawing performance conclusions."
    ],
    "practice": [
      [
        "What does NOT EXISTS require?",
        "No qualifying inner row",
        "An inner sum of zero",
        "Only a missing payload",
        "Exactly one inner NULL",
        "NOT EXISTS negates the existence test on the correlated qualifying rows."
      ],
      [
        "What can NULL in a NOT IN list cause?",
        "An unknown predicate",
        "Guaranteed true predicates",
        "A syntax error always",
        "Automatic NULL removal",
        "Without an equal match, a NULL candidate can make NOT IN unknown, which WHERE does not retain."
      ],
      [
        "Which conditions does WHERE retain?",
        "True",
        "False and unknown",
        "Only unknown",
        "Every evaluated row",
        "WHERE retains rows only when its condition evaluates to true."
      ],
      [
        "An anti-join tests a nullable inner note. What can go wrong?",
        "False absences",
        "The key becomes unique",
        "All results are sorted",
        "NULL is converted to zero",
        "A genuine match may have a NULL note, so a nullable payload is not a reliable unmatched marker."
      ],
      [
        "An inner eligibility filter moves from ON to WHERE in a left join. What may disappear?",
        "Null-extended outer rows",
        "Only duplicate aliases",
        "Only unmatched column names",
        "Every primary key constraint",
        "A WHERE predicate on the missing inner side often evaluates unknown and removes unmatched rows."
      ],
      [
        "An inner key list contains NULL and NOT IN returns nothing. What should be reviewed?",
        "Three-valued logic",
        "Only table spelling",
        "Only decimal precision",
        "Only row ordering",
        "A NULL candidate can prevent nonmatching values from producing true NOT IN predicates."
      ],
      [
        "A customer has only canceled orders but the task is no paid orders. Where does paid eligibility belong?",
        "Inside the absence test",
        "Only in output labels",
        "Only in ORDER BY",
        "Outside every relationship condition",
        "The query must search for qualifying paid matches, not all related orders."
      ]
    ],
    "formal": [
      [
        "Which pattern directly states no matching eligible row?",
        "Correlated NOT EXISTS",
        "Unrelated DISTINCT",
        "ORDER BY with NULLS LAST",
        "COUNT of all orders",
        "A complete correlation plus NOT EXISTS expresses anti-membership at the outer grain."
      ],
      [
        "How does SQL ordinary equality treat NULL?",
        "It yields unknown",
        "It always equals another NULL",
        "It equals zero",
        "It equals an empty string",
        "NULL represents unavailable or unknown values, so ordinary equality is not a NULL-safe identity test."
      ],
      [
        "What is a safe unmatched marker in a left anti-join?",
        "A nonnull match key",
        "Any nullable note",
        "Any optional timestamp",
        "A formatted display label",
        "A matched inner row cannot have NULL in a guaranteed nonnull key, making null-extension distinguishable."
      ],
      [
        "A missing-orders report uses NOT IN over a nullable key. What edge case is essential?",
        "An inner NULL",
        "A long id",
        "Only long names",
        "Only a large output font",
        "An inner NULL can change nonmatch predicates to unknown and suppress expected rows."
      ],
      [
        "An outer customer id is NULL. What should determine its treatment?",
        "The business identity policy",
        "A belief NULL equals NULL",
        "Automatic assignment to all orders",
        "Only the output sort",
        "NOT EXISTS with ordinary equality may retain it, but whether it belongs in the report is a domain decision."
      ],
      [
        "A left join anti-query filters inner paid=1 in WHERE. Why can it fail?",
        "It rejects null-extended rows",
        "It automatically duplicates all customers",
        "It creates primary keys",
        "It converts null to true",
        "The unmatched rows have NULL inner fields, so the filter does not evaluate true."
      ],
      [
        "A no-paid-orders query tests absence of any order. What is wrong?",
        "The eligibility scope",
        "The use of SQL",
        "The customer column type necessarily",
        "The selected name alias",
        "Customers with only unpaid orders should qualify, so absence must refer specifically to eligible paid orders."
      ],
      [
        "A NOT EXISTS subquery repeats the same matching order twice. What changes?",
        "No existence truth value",
        "The outer row doubles",
        "The outer id becomes NULL",
        "The query must fail",
        "Existence depends on whether any match exists, not on the count of duplicate matches."
      ],
      [
        "An optimization replaces NOT EXISTS with NOT IN. What proof is needed?",
        "NULL equivalence",
        "Aliasing",
        "Only faster syntax highlighting",
        "Only matching aliases",
        "The forms can differ under NULLs and correlation rules, so semantic equivalence must be established."
      ],
      [
        "A report uses a nullable business key for equality-based absence. What remains unresolved?",
        "Unknown-identity policy",
        "Only row ordering",
        "Only query formatting",
        "Only a count alias",
        "A NULL identifier cannot be related through ordinary equality; the business meaning of unknown identity needs an explicit policy."
      ]
    ]
  },
  {
    "id": "as-ranking",
    "comps": [
      "m2.c1"
    ],
    "title": "Rank within partitions with explicit tie policy",
    "intro": "A sales board needs top performers per region. Selecting the first rows globally answers a different question from ranking within each region, and ties require a stated business rule.",
    "sections": [
      [
        "Query meaning and correctness",
        "A window function calculates over a set of rows related to the current row while preserving those rows. PARTITION BY defines independent groups; ORDER BY inside OVER defines the ordering used by the function. The final query still needs its own ORDER BY for presentation.",
        "ROW_NUMBER assigns sequential numbers, RANK leaves gaps after peer ties, and DENSE_RANK does not leave those gaps. If a requirement is exactly two rows per region, use a deterministic row-number ordering. If it is every performer in the top two distinct score levels, dense ranking expresses a different result."
      ],
      [
        "Execution evidence and practical limits",
        "Adding an id to the ranking ORDER BY breaks score peers. For a tie-preserving rank, rank by the score alone, then use id only for final presentation if desired. To select window results portably in PostgreSQL, compute them in a subquery or CTE and filter the outer query.",
        "The fixture demonstrates row numbers, rank and dense rank on tied scores. SQLite supports this common subset, but its execution does not assert PostgreSQL plans or all engine-specific window behavior. A stable tie-breaker must be meaningful and unique within each partition."
      ]
    ],
    "lang": "python",
    "problem": "Rank within partitions with explicit tie policy using an isolated synthetic SQL fixture.",
    "steps": [
      "State the required result grain and qualifying rows.",
      "Execute the fixture query on disposable SQLite tables.",
      "Compare its result with the documented output and target-engine limits."
    ],
    "code": "import sqlite3\nc=sqlite3.connect(\":memory:\")\nc.executescript('CREATE TABLE scores(id INT, points INT); INSERT INTO scores VALUES(1,90),(2,90),(3,80);')\nprint(c.execute('SELECT id,ROW_NUMBER() OVER(ORDER BY points DESC,id),RANK() OVER(ORDER BY points DESC),DENSE_RANK() OVER(ORDER BY points DESC) FROM scores ORDER BY id').fetchall())\nc.close()",
    "expect": "[(1, 1, 1, 1), (2, 2, 1, 1), (3, 3, 3, 2)]",
    "limit": "This example executes SQLite through Python’s standard library. It verifies only this fixture’s result, not PostgreSQL optimizer choices, native performance, concurrent behavior or every dialect feature. PostgreSQL semantics are grounded separately in the pinned official documentation.",
    "mistakes": [
      "A passing small fixture does not establish representative production performance.",
      "Preserve the intended row grain and NULL semantics before optimizing a query."
    ],
    "takeaways": [
      "A window function calculates over a set of rows related to the current row while preserving those rows.",
      "Verify correctness and inspect the target engine before drawing performance conclusions."
    ],
    "practice": [
      [
        "Which function leaves gaps after ties?",
        "RANK",
        "DENSE_RANK",
        "COUNT alone",
        "SUM alone",
        "RANK gives peers the same rank and advances the next rank by the preceding row count."
      ],
      [
        "What does PARTITION BY define?",
        "Independent window groups",
        "The final output order",
        "A permanent disk partition",
        "A primary key constraint",
        "Window partitions determine which rows participate together in each calculation."
      ],
      [
        "Does window ORDER BY guarantee final result order?",
        "No",
        "Yes universally",
        "Only for integer keys",
        "Only with uppercase SQL",
        "The result’s presentation ordering requires an outer ORDER BY."
      ],
      [
        "A leaderboard needs exactly two rows per region with deterministic ties. What fits?",
        "Deterministic ROW_NUMBER",
        "RANK by points alone",
        "An unordered LIMIT 2 globally",
        "DENSE_RANK by region name",
        "Row numbers plus a complete order give a fixed row count per partition rather than all tied score levels."
      ],
      [
        "A top-score report must retain everyone tied at first. What should be ranked?",
        "Score alone",
        "Score and unique id",
        "Only insertion position",
        "Only alphabetic customer name",
        "Adding a unique id to the ranking order removes score peer ties."
      ],
      [
        "A query uses LIMIT 2 without partitioning. What is missing?",
        "Per-group selection",
        "Only a column alias",
        "Only output rounding",
        "Only query indentation",
        "A global limit cannot express two qualifying records independently within every region."
      ],
      [
        "A filter refers to a window alias in the same WHERE clause. What is a portable fix?",
        "Filter an outer query",
        "Only rename the alias",
        "Remove OVER entirely",
        "Add a random index",
        "The window result is computed after WHERE logically, so an outer query can filter the computed column."
      ]
    ],
    "formal": [
      [
        "Which rank sequence fits tied scores 90,90,80?",
        "1,1,3 with RANK",
        "1,2,2 with RANK",
        "1,1,1 with ROW_NUMBER",
        "1,2,4 with DENSE_RANK",
        "RANK shares rank one across the first peers and starts the next score at rank three."
      ],
      [
        "Which rank sequence fits tied scores 90,90,80 using DENSE_RANK?",
        "1,1,2",
        "1,2,3",
        "1,1,3",
        "0,0,0",
        "Dense rank advances once per distinct ordered peer group without rank gaps."
      ],
      [
        "What does a window calculation generally preserve?",
        "Input rows",
        "One row",
        "Only distinct scores",
        "One permanent table",
        "Window functions annotate rows rather than collapsing them as GROUP BY does."
      ],
      [
        "A ranking orders only tied points and uses ROW_NUMBER. What is unresolved?",
        "Peer numbering",
        "Row count",
        "Whether rows exist",
        "Whether the query has a SELECT",
        "A nonunique order does not specify the relative order of peers for deterministic row numbering."
      ],
      [
        "A business requests the top two score levels, including ties. What fits?",
        "DENSE_RANK<=2",
        "ROW_NUMBER<=2 always",
        "A global LIMIT 2",
        "COUNT(*)=2",
        "Dense ranking counts distinct score groups, so filtering two ranks includes peers in the top two levels."
      ],
      [
        "A developer adds unique id to DENSE_RANK’s score order. What changes?",
        "Peer grouping",
        "Width",
        "Only the column width",
        "Nothing relevant",
        "The additional unique value distinguishes rows that previously belonged to the same score peer group."
      ],
      [
        "A region label is missing for several rows. What should be considered?",
        "The meaning of that partition",
        "Automatic independent groups per NULL",
        "Guaranteed exclusion of NULL rows",
        "A mandatory syntax failure",
        "Window partitioning can group missing labels together; the analytical handling of unlabeled regions needs an explicit policy."
      ],
      [
        "A top-N export is filtered after a one-to-many join. What must be checked?",
        "The ranked row grain",
        "Only file compression",
        "Only function spelling",
        "Only text encoding",
        "Joining detail rows can rank repeated representations rather than the intended entities."
      ],
      [
        "A new tied record changes which row appears in an exactly-N report. What stabilizes tie selection?",
        "A unique order",
        "A shorter table name",
        "Only DENSE_RANK by score",
        "Only the same LIMIT",
        "A unique tie-breaker defines which peer is selected under a fixed snapshot, though new data may still change results."
      ],
      [
        "A team wants exactly N rows and all boundary ties simultaneously. What needs clarification?",
        "Conflicting requirements",
        "Only the rank alias",
        "Only output precision",
        "Only SQL formatting",
        "Including every tie can return more than N rows, so the business rule must choose or qualify the requirement."
      ]
    ]
  },
  {
    "id": "as-running",
    "comps": [
      "m2.c1"
    ],
    "title": "Control running-total frames and compare prior observations",
    "intro": "A daily revenue report needs cumulative totals and previous-day differences. These are distinct window operations, and neither can infer missing calendar days from sparse event rows.",
    "sections": [
      [
        "Query meaning and correctness",
        "A running SUM uses an ordered window and an explicit frame. ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW accumulates physical ordered rows. A default ordered frame can include peers through the current peer group, so tied ordering values may produce a different cumulative pattern.",
        "Use a complete order when a row-by-row running total is required. For daily totals, aggregate to one row per calendar day first; summing raw line rows and interpreting them as independent days confuses grain. Partitions reset totals for the chosen account, region or other group."
      ],
      [
        "Execution evidence and practical limits",
        "LAG reads an earlier row at the specified offset in window order. It means previous observed row, not automatically yesterday or previous calendar month. Build a complete calendar or use an appropriate dated join when gaps must be represented explicitly.",
        "The fixture computes a running total and previous observed amount after sorting by day. Its third row follows a calendar gap. The value returned by LAG is still from the second observed row; no date-completeness claim is implied."
      ]
    ],
    "lang": "python",
    "problem": "Control running-total frames and compare prior observations using an isolated synthetic SQL fixture.",
    "steps": [
      "State the required result grain and qualifying rows.",
      "Execute the fixture query on disposable SQLite tables.",
      "Compare its result with the documented output and target-engine limits."
    ],
    "code": "import sqlite3\nc=sqlite3.connect(\":memory:\")\nc.executescript('CREATE TABLE daily(day INT, amount INT); INSERT INTO daily VALUES(1,10),(2,20),(4,5);')\nprint(c.execute('SELECT day,SUM(amount) OVER(ORDER BY day ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW),LAG(amount) OVER(ORDER BY day) FROM daily ORDER BY day').fetchall())\nc.close()",
    "expect": "[(1, 10, None), (2, 30, 10), (4, 35, 20)]",
    "limit": "This example executes SQLite through Python’s standard library. It verifies only this fixture’s result, not PostgreSQL optimizer choices, native performance, concurrent behavior or every dialect feature. PostgreSQL semantics are grounded separately in the pinned official documentation.",
    "mistakes": [
      "A passing small fixture does not establish representative production performance.",
      "Preserve the intended row grain and NULL semantics before optimizing a query."
    ],
    "takeaways": [
      "A running SUM uses an ordered window and an explicit frame.",
      "Verify correctness and inspect the target engine before drawing performance conclusions."
    ],
    "practice": [
      [
        "What does LAG with offset one access?",
        "The prior ordered row",
        "Necessarily yesterday",
        "The next row",
        "The minimum row always",
        "LAG follows the specified row ordering and does not infer missing calendar periods."
      ],
      [
        "Which frame spells a row-wise cumulative sum?",
        "Cumulative ROWS",
        "Only the final row",
        "Only future rows",
        "An unordered GROUP BY",
        "The explicit ROWS frame includes preceding ordered rows and the current row."
      ],
      [
        "What resets a running total by customer?",
        "PARTITION BY customer",
        "Only ORDER BY customer",
        "Only LIMIT",
        "Only SELECT DISTINCT",
        "Partitioning isolates the window calculation for each customer group."
      ],
      [
        "A sparse monthly series uses LAG as last calendar month. What should be checked?",
        "Calendar completeness",
        "Only alias width",
        "Only row colors",
        "Only amount precision",
        "The previous observed month may be several calendar months earlier."
      ],
      [
        "Two events share a timestamp and running values jump together. What matters?",
        "Peer frame semantics",
        "Only the column name",
        "Only network latency",
        "Only a display font",
        "Ordered default frames can include the current peer group rather than advance one physical row at a time."
      ],
      [
        "A daily running report starts from individual line items. What first stage helps?",
        "Aggregate to daily grain",
        "Add arbitrary ids to totals",
        "Delete the date",
        "Use an unordered LIMIT",
        "A daily measure should first define one observed aggregate per relevant calendar day and partition."
      ],
      [
        "The first LAG result is NULL. What is a normal explanation?",
        "No prior row",
        "Every input is invalid",
        "The function cannot run",
        "The order is necessarily wrong",
        "Without an earlier row and without an explicit default, LAG returns NULL."
      ]
    ],
    "formal": [
      [
        "What does an explicit frame control?",
        "Frame membership",
        "Names",
        "The SQL transaction isolation level",
        "The output file encoding",
        "Frames define the subset of a window partition used by frame-sensitive aggregates or functions."
      ],
      [
        "What is necessary for deterministic row-wise accumulation?",
        "A complete ordering",
        "LIMIT",
        "Only a larger LIMIT",
        "Only a formatted date label",
        "A unique or otherwise complete order resolves peer sequence for physical-row calculations."
      ],
      [
        "Does LAG by itself create missing dates?",
        "No",
        "Always",
        "Only for numeric dates",
        "Only after SUM",
        "LAG navigates existing ordered rows; calendar expansion requires a separate operation."
      ],
      [
        "A cumulative total unexpectedly crosses account boundaries. What is missing?",
        "The account partition",
        "Only a sum alias",
        "Only a rounded output",
        "Only query indentation",
        "Without PARTITION BY account, the window can accumulate across accounts."
      ],
      [
        "A row-wise sum uses ORDER BY amount rather than event time. What changed?",
        "Accumulation sequence",
        "Color",
        "Only output type automatically",
        "Only a table constraint",
        "The window order determines which observations precede the current row in the cumulative calculation."
      ],
      [
        "A previous-month comparison has no February record. What does March LAG return?",
        "The prior observed month",
        "February",
        "A synthesized February NULL row",
        "The following April value",
        "The previous row could be January unless a complete monthly calendar has been constructed."
      ],
      [
        "A team fills missing revenue days with zero. What must justify that?",
        "Source completeness semantics",
        "The availability of LAG",
        "The table’s short name",
        "The positivity of known amounts",
        "Missing collection cannot be interpreted as zero economic activity without source guarantees."
      ],
      [
        "A ratio uses current amount divided by LAG amount. What edge case needs policy?",
        "Zero prior amount",
        "Only alphabetical order",
        "Only maximum id",
        "Only output capitalization",
        "Division by zero or an undefined prior comparison needs explicit handling rather than an unqualified growth claim."
      ],
      [
        "A running measure changes after adding a tied event. What should be reviewed?",
        "Tie order and frame",
        "Names",
        "Only client file size",
        "Only table comments",
        "Peer handling and complete order determine whether and how tied events enter cumulative results."
      ],
      [
        "A window uses future rows to smooth a live feature. What is the key concern?",
        "Future-data leakage",
        "Rounding",
        "Only extra decimals",
        "Only a larger result set",
        "Features used at a decision time must not include later observations unavailable at that time."
      ]
    ]
  },
  {
    "id": "as-latest",
    "comps": [
      "m2.c2"
    ],
    "title": "Select the latest complete row per entity deterministically",
    "intro": "A customer-state table stores several updates per account. A report needs the complete latest state, not independently chosen maxima from different history rows.",
    "sections": [
      [
        "Query meaning and correctness",
        "Compute ROW_NUMBER partitioned by entity and ordered by effective timestamp descending plus a unique deterministic tie-breaker. Then select row number one from an outer query. State whether latest means event time, ingestion time or a version number; these can disagree after late arrivals.",
        "MAX(timestamp) returns a timestamp, not the associated payload. Joining back on that maximum can return multiple rows when timestamps tie. Independently taking MAX(status) and MAX(timestamp) can combine values from different records into a state that never existed."
      ],
      [
        "Execution evidence and practical limits",
        "PostgreSQL DISTINCT ON can express a latest-per-group pattern with carefully aligned ORDER BY, but it is engine-specific and is not demonstrated by the SQLite fixture. Explicitly decide where NULL timestamps belong; engines have differing default null ordering, and unknown recency may need exclusion or a review path.",
        "The fixture includes tied update times with different ids. Row numbering uses the greater id as the documented tie-breaker and returns the whole selected row. This is deterministic for the fixed fixture, not proof that the chosen tie-breaker captures real business precedence."
      ]
    ],
    "lang": "python",
    "problem": "Select the latest complete row per entity deterministically using an isolated synthetic SQL fixture.",
    "steps": [
      "State the required result grain and qualifying rows.",
      "Execute the fixture query on disposable SQLite tables.",
      "Compare its result with the documented output and target-engine limits."
    ],
    "code": "import sqlite3\nc=sqlite3.connect(\":memory:\")\nc.executescript(\"CREATE TABLE updates(account TEXT, t INT, id INT, state TEXT); INSERT INTO updates VALUES('a',1,1,'new'),('a',2,2,'paused'),('a',2,3,'active'),('b',1,4,'new');\")\nprint(c.execute('WITH r AS (SELECT *,ROW_NUMBER() OVER(PARTITION BY account ORDER BY t DESC,id DESC) AS rn FROM updates) SELECT account,state FROM r WHERE rn=1 ORDER BY account').fetchall())\nc.close()",
    "expect": "[('a', 'active'), ('b', 'new')]",
    "limit": "This example executes SQLite through Python’s standard library. It verifies only this fixture’s result, not PostgreSQL optimizer choices, native performance, concurrent behavior or every dialect feature. PostgreSQL semantics are grounded separately in the pinned official documentation.",
    "mistakes": [
      "A passing small fixture does not establish representative production performance.",
      "Preserve the intended row grain and NULL semantics before optimizing a query."
    ],
    "takeaways": [
      "Compute ROW_NUMBER partitioned by entity and ordered by effective timestamp descending plus a unique deterministic tie-breaker.",
      "Verify correctness and inspect the target engine before drawing performance conclusions."
    ],
    "practice": [
      [
        "What must be specified for tied latest timestamps?",
        "A tie policy",
        "Only a title",
        "Only a larger LIMIT",
        "Only column width",
        "Equal timestamps alone do not identify one latest row deterministically."
      ],
      [
        "Does MAX(time) return the full associated record?",
        "No",
        "Always",
        "Only when quoted",
        "Only in a CTE",
        "An aggregate maximum provides a scalar time; choosing an associated row requires a separate, justified pattern."
      ],
      [
        "What does PARTITION BY account achieve?",
        "Independent account selection",
        "Only final output sorting",
        "A permanent account index",
        "Automatic timestamp repair",
        "Each account receives its own ordered row numbering for latest-state selection."
      ],
      [
        "A report uses MAX(state) beside MAX(time). What can happen?",
        "A mixed-row state",
        "Guaranteed latest payload",
        "Mandatory sorting",
        "Automatic row identity",
        "The maxima can come from different history rows and do not preserve a complete record."
      ],
      [
        "A latest-time join returns two rows for an account. What explains it?",
        "Timestamp ties",
        "Only extra decimals",
        "Only a query alias",
        "Only index naming",
        "Several history rows can share the maximum time, so joining that value back need not identify one row."
      ],
      [
        "A late-arriving old event overwrites current state by ingestion time. What needs clarification?",
        "The recency clock",
        "Only the file date",
        "Only the output style",
        "Only the row count alias",
        "Latest arrival and latest effective event are different policies when data can arrive out of order."
      ],
      [
        "A developer copies DISTINCT ON into SQLite. What is needed?",
        "Dialect support",
        "Only more parentheses",
        "Only uppercase keywords",
        "Only a shorter alias",
        "DISTINCT ON is a PostgreSQL-specific construct; use a supported equivalent for the execution engine."
      ],
      [
        "A status timestamp is unknown and policy excludes unknown recency. What should happen before ranking?",
        "Filter or route unknown times",
        "Treat NULL as newest universally",
        "Choose the longest status",
        "Depend on default ordering",
        "Explicit eligibility prevents engine defaults from silently deciding the business recency policy."
      ],
      [
        "A snapshot report selects latest rows in separate pages. What can concurrent updates affect?",
        "Cross-page consistency",
        "Only column width",
        "Only alias spelling",
        "Only output encoding",
        "A unique order stabilizes fixed data, but separate reads need an appropriate snapshot policy for a consistent historical view."
      ],
      [
        "An account has no history row. Does ranking history alone return it?",
        "No",
        "Always",
        "Only if id is numeric",
        "Only if time is descending",
        "A history-driven ranked query cannot produce an entity absent from that input; an outer entity join is needed when required."
      ]
    ],
    "formal": [
      [
        "What does a latest-row selection preserve?",
        "One complete record",
        "Maxima",
        "Only the maximum id globally",
        "All historical rows necessarily",
        "The pattern should return fields from the same selected record rather than combine separate aggregates."
      ],
      [
        "What makes ROW_NUMBER selection deterministic for fixed data?",
        "A complete order",
        "DESC time",
        "Only a larger partition",
        "Only matching alias names",
        "A unique tie-breaker resolves which row receives row number one."
      ],
      [
        "What must latest mean operationally?",
        "A chosen clock",
        "Disk order",
        "Always alphabetical status",
        "Always maximum text payload",
        "The business needs to choose event, arrival or version precedence rather than infer it from storage."
      ],
      [
        "A state export joins on MAX(time) and duplicates entities. What should be added?",
        "A tie policy",
        "A new alias",
        "Only a display sort",
        "Only another timestamp alias",
        "The maximum timestamp may correspond to multiple distinct payload rows; the policy must select or retain ties deliberately."
      ],
      [
        "A nullable timestamp is sorted DESC without an explicit policy across engines. What can vary?",
        "NULL placement",
        "Names",
        "The meaning of a primary key",
        "The spelling of the state",
        "Default NULL ordering differs, so portable latest-row logic should specify how unknown times are treated."
      ],
      [
        "A unique update id breaks timestamp ties. What must domain review verify?",
        "Valid precedence",
        "Spelling",
        "That ids are printed",
        "That times have no colons",
        "Determinism alone does not prove the id order represents meaningful business precedence."
      ],
      [
        "A report ranks before excluding invalid history events. What can go wrong?",
        "An invalid row can win",
        "The SQL cannot parse",
        "All partitions become empty",
        "The timestamp becomes a key",
        "Eligibility should be defined before selection when invalid rows must not compete for latest state."
      ],
      [
        "A tenant-scoped entity id is partitioned without tenant. What can happen?",
        "Different entities merge",
        "Guaranteed independent states",
        "All timestamps become unique",
        "Only a wider result",
        "The partition key must capture full entity identity, including tenant scope when required."
      ],
      [
        "An export selects newest records under a changing live dataset. What remains relevant?",
        "Snapshot consistency",
        "Only alias length",
        "Only final file format",
        "Only integer printing",
        "A deterministic order for fixed data does not itself provide a consistent snapshot across separate reads."
      ],
      [
        "A PostgreSQL DISTINCT ON query lacks a complete ordering of tied candidates. What is unresolved?",
        "Which peer is retained",
        "Whether DISTINCT exists",
        "The number of columns",
        "The spelling of FROM",
        "DISTINCT ON needs suitable ordering, including a tie policy, to identify the intended first row reliably."
      ]
    ]
  },
  {
    "id": "as-plans",
    "comps": [
      "m3.c1"
    ],
    "title": "Read plans as estimated access strategies and measured work",
    "intro": "A query is slow, but its text does not reveal where time is spent. Plans show chosen access paths, joins and estimates; execution-aware plans add observations under a particular workload.",
    "sections": [
      [
        "Query meaning and correctness",
        "PostgreSQL EXPLAIN describes the chosen plan tree with estimated costs and cardinalities. Costs use planner units rather than elapsed milliseconds. Read parent-child relationships, access predicates and row estimates to understand how data is expected to flow through the statement.",
        "EXPLAIN ANALYZE executes the statement and reports actual observations. It can perform writes and invoke effects, so use appropriate isolated or authorized contexts. Rows and timing for repeated nodes require attention to loops; per-loop work can be small while total repeated work is large."
      ],
      [
        "Execution evidence and practical limits",
        "Look for large estimate-versus-actual discrepancies, expensive repeated lookups, excessive filtered rows, sorts and temporary work. Statistics, skew, correlated predicates, index suitability and join grain can all matter. Form a specific hypothesis before changing a schema or query.",
        "The fixture uses SQLite EXPLAIN QUERY PLAN and checks for its SEARCH access description. SQLite’s output is not PostgreSQL plan syntax, costs or ANALYZE timing. PostgreSQL-specific interpretation comes from the pinned reference and requires a target-engine probe before a concrete plan claim."
      ]
    ],
    "lang": "python",
    "problem": "Read plans as estimated access strategies and measured work using an isolated synthetic SQL fixture.",
    "steps": [
      "State the required result grain and qualifying rows.",
      "Execute the fixture query on disposable SQLite tables.",
      "Compare its result with the documented output and target-engine limits."
    ],
    "code": "import sqlite3\nc=sqlite3.connect(\":memory:\")\nc.executescript(\"CREATE TABLE events(id INTEGER PRIMARY KEY, customer INT); CREATE INDEX ix_customer ON events(customer);\")\np=c.execute(\"EXPLAIN QUERY PLAN SELECT id FROM events WHERE customer=7\").fetchall()\nprint(any(\"SEARCH\" in row[3] and \"ix_customer\" in row[3] for row in p))\nc.close()",
    "expect": "True",
    "limit": "This example executes SQLite through Python’s standard library. It verifies only this fixture’s result, not PostgreSQL optimizer choices, native performance, concurrent behavior or every dialect feature. PostgreSQL semantics are grounded separately in the pinned official documentation.",
    "mistakes": [
      "A passing small fixture does not establish representative production performance.",
      "Preserve the intended row grain and NULL semantics before optimizing a query."
    ],
    "takeaways": [
      "PostgreSQL EXPLAIN describes the chosen plan tree with estimated costs and cardinalities.",
      "Verify correctness and inspect the target engine before drawing performance conclusions."
    ],
    "practice": [
      [
        "Are PostgreSQL estimated plan costs milliseconds?",
        "No",
        "Always",
        "Only if rounded",
        "Only for indexes",
        "Costs are planner estimation units rather than directly elapsed execution time."
      ],
      [
        "Does EXPLAIN ANALYZE execute the statement?",
        "Yes",
        "Never",
        "Only if it is SELECT",
        "Only if an index exists",
        "The ANALYZE option runs the statement to observe actual execution, including possible write effects."
      ],
      [
        "What should accompany per-loop node work?",
        "Loop count",
        "Only the SQL line count",
        "Only alias length",
        "Only output order",
        "Repeated node execution can multiply apparently small work, so loops affect total interpretation."
      ],
      [
        "A join estimates ten rows but produces a million. What needs investigation?",
        "Cardinality estimation",
        "Only a chart title",
        "Only query capitalization",
        "Only the database logo",
        "Poor estimates can affect join order, access paths and memory decisions."
      ],
      [
        "A plan uses a sequential scan on a tiny table. What is a reasonable interpretation?",
        "It may be efficient",
        "It proves a missing index",
        "It proves corruption",
        "It is always slower",
        "Scanning a small relation can cost less than index traversal and scattered tuple access."
      ],
      [
        "An ANALYZE probe is proposed for a write statement. What matters?",
        "Execution side effects",
        "Only output formatting",
        "Only alias spelling",
        "Only table count",
        "Execution-aware plans actually run the command and require a suitable isolated or authorized context."
      ],
      [
        "SQLite reports SEARCH for a fixture. What is established?",
        "That SQLite access path",
        "A PostgreSQL timing guarantee",
        "A native production benchmark",
        "A universal planner rule",
        "The observation describes the tested engine and fixture, not another engine’s optimizer or latency."
      ]
    ],
    "formal": [
      [
        "What does plain EXPLAIN primarily describe?",
        "The planned strategy",
        "Actual time",
        "A committed schema change",
        "All future workload behavior",
        "Without execution analysis, EXPLAIN describes estimates and selected operations rather than measured runtime."
      ],
      [
        "What is a cardinality estimate?",
        "An estimated row count",
        "The elapsed time exactly",
        "The number of CPU cores",
        "The database port",
        "Cardinality estimates describe expected rows at plan stages."
      ],
      [
        "Why compare estimated and actual rows?",
        "To locate estimation errors",
        "To guarantee identical plans forever",
        "To replace all correctness tests",
        "To infer human approval",
        "Discrepancies can explain poor decisions and suggest statistics or predicate-modeling investigations."
      ],
      [
        "A nested loop performs an inner lookup one million times. What can dominate?",
        "Repeated inner work",
        "SQL length",
        "Only result column names",
        "Only the first lookup",
        "Total repeated work can be large even if each lookup is individually fast."
      ],
      [
        "A slow query filters away almost every fetched row. What should be examined?",
        "Access selectivity",
        "Only client text color",
        "Only a different delimiter",
        "Only keyword casing",
        "A large fetch-and-filter burden may suggest a more selective access path or predicate rewrite."
      ],
      [
        "A plan changed after new data arrived. What might explain it?",
        "Changed statistics",
        "Formatting",
        "Only a longer alias",
        "Only SQL indentation",
        "Planner choices depend on estimated data distribution, table size, statistics and available paths."
      ],
      [
        "A single cached run is much faster after an index. What is still needed?",
        "Representative comparison",
        "Acceptance",
        "Removal of write-cost analysis",
        "Only a shorter index name",
        "Caching, parameter mix and workload variation limit the inference from one timing."
      ],
      [
        "A plan contains an expensive sort. What should be evaluated?",
        "Sort requirements",
        "Aliases",
        "Only more semicolons",
        "Only a text export",
        "Sort work depends on required order, volume, memory and whether another access path can supply order."
      ],
      [
        "A team reads SQLite plan text as PostgreSQL output. What is wrong?",
        "Engine-specific semantics",
        "The ability to run SQL",
        "The existence of indexes",
        "The fixture’s row count",
        "Plan node names, cost models and behavior are engine-specific and must not be conflated."
      ],
      [
        "A write is wrapped in rollback during ANALYZE testing. What should still be considered?",
        "External effects",
        "Column names",
        "Only query indentation",
        "Only selected columns",
        "Rollback does not necessarily undo every external, sequence or nontransactional effect caused during execution."
      ]
    ]
  },
  {
    "id": "as-indexes",
    "comps": [
      "m3.c1"
    ],
    "title": "Choose indexes for real predicates and ordering",
    "intro": "A support query filters by account and state, then requests newest events. An index candidate should match the access pattern and be evaluated against both reads and write maintenance.",
    "sections": [
      [
        "Query meaning and correctness",
        "A B-tree index can support suitable equality and range conditions and may supply ordering. For a multicolumn index, column order matters: common leading equality restrictions and subsequent range or ordering needs guide a candidate. This is a workload-specific decision, not an instruction to index every column.",
        "An index on account,state,event_time,id can be a candidate for filtering one account and state then ordering by event_time,id. Direction, NULL policy and exact query conditions matter. PostgreSQL may scan B-tree indexes backward in supported patterns; an index does not universally remove every sort or guarantee the planner will choose it."
      ],
      [
        "Execution evidence and practical limits",
        "Indexes consume storage and add work to writes, vacuum and maintenance. Low-selectivity conditions may favor a scan. PostgreSQL index-only scans also depend on visibility information, not just whether projected columns appear in the index. Use a representative plan and measurement rather than assuming a covering definition guarantees zero heap access.",
        "The fixture verifies a matching SQLite composite-index lookup and deterministic output. It does not benchmark native PostgreSQL, validate its visibility-map state or prove a general latency improvement. Compare meaningful parameter distributions and preserve the result contract when changing indexes."
      ]
    ],
    "lang": "python",
    "problem": "Choose indexes for real predicates and ordering using an isolated synthetic SQL fixture.",
    "steps": [
      "State the required result grain and qualifying rows.",
      "Execute the fixture query on disposable SQLite tables.",
      "Compare its result with the documented output and target-engine limits."
    ],
    "code": "import sqlite3\nc=sqlite3.connect(\":memory:\")\nc.executescript(\"CREATE TABLE events(account INT, state TEXT, t INT, id INT); CREATE INDEX ix_lookup ON events(account,state,t,id); INSERT INTO events VALUES(7,'open',2,2),(7,'open',1,1),(8,'open',3,3);\")\nprint(c.execute(\"SELECT id FROM events WHERE account=7 AND state='open' ORDER BY t DESC,id DESC LIMIT 2\").fetchall())\np=c.execute(\"EXPLAIN QUERY PLAN SELECT id FROM events WHERE account=7 AND state='open' ORDER BY t DESC,id DESC LIMIT 2\").fetchall()\nprint(any(\"SEARCH\" in row[3] and \"ix_lookup\" in row[3] for row in p))\nc.close()",
    "expect": "[(2,), (1,)]\nTrue",
    "limit": "This example executes SQLite through Python’s standard library. It verifies only this fixture’s result, not PostgreSQL optimizer choices, native performance, concurrent behavior or every dialect feature. PostgreSQL semantics are grounded separately in the pinned official documentation.",
    "mistakes": [
      "A passing small fixture does not establish representative production performance.",
      "Preserve the intended row grain and NULL semantics before optimizing a query."
    ],
    "takeaways": [
      "A B-tree index can support suitable equality and range conditions and may supply ordering.",
      "Verify correctness and inspect the target engine before drawing performance conclusions."
    ],
    "practice": [
      [
        "What guides a composite-index candidate?",
        "The query access pattern",
        "Only alphabetical columns",
        "Only column-name length",
        "Only table comments",
        "Predicates, ordering, selectivity and workload determine suitable index columns and order."
      ],
      [
        "Do indexes have write costs?",
        "Yes",
        "Never",
        "Only for SELECT",
        "Only with empty tables",
        "Writers must maintain index entries, so read improvements trade against storage and modification work."
      ],
      [
        "Does an existing index force the planner to use it?",
        "No",
        "Always",
        "Only if named ix",
        "Only with numeric keys",
        "The planner chooses among available paths using its estimates and settings."
      ],
      [
        "A query filters account and state then sorts by time. What candidate is worth testing?",
        "A matching composite index",
        "Every text column alphabetically",
        "Only the longest column",
        "No index can help ordering",
        "Leading equality predicates followed by ordering fields can align an index with this access pattern."
      ],
      [
        "A low-selectivity filter returns most of a table. What may be cheaper?",
        "A sequential scan",
        "Always a random lookup per row",
        "Always a larger index",
        "Only a query rewrite to EXISTS",
        "Scanning many table rows can be more efficient than numerous index-plus-heap visits."
      ],
      [
        "A covering PostgreSQL index still performs heap fetches. What can matter?",
        "Visibility metadata",
        "Only the index name",
        "Only keyword casing",
        "Only the table alias",
        "Index-only scans need visibility evidence in addition to indexed data coverage."
      ],
      [
        "A team indexes every column after one slow report. What is overlooked?",
        "Maintenance cost",
        "Only source indentation",
        "Only client theme",
        "Only table-name length",
        "Each index consumes resources and affects writes; candidate indexes should answer measured workload needs."
      ]
    ],
    "formal": [
      [
        "Why does composite index column order matter?",
        "Access/order support",
        "Naming",
        "It changes column data automatically",
        "It creates foreign keys",
        "B-tree key ordering affects useful leading restrictions and ordering opportunities."
      ],
      [
        "What does index selectivity describe here?",
        "Row selectivity",
        "The number of SQL keywords",
        "The chosen file format",
        "The table-name length",
        "Selective conditions retain relatively few rows and may benefit more from indexed access."
      ],
      [
        "What does a covering index provide?",
        "Column coverage",
        "No heap reads",
        "Guaranteed fastest execution",
        "Automatic correct business logic",
        "Coverage can support index-only strategies but does not alone guarantee them or their performance."
      ],
      [
        "A composite index begins with an unconstrained low-use column. What should be reviewed?",
        "Predicate fit",
        "Only the index spelling",
        "Only query font",
        "Only comment length",
        "An unsuitable leading key can reduce the index’s utility for common filtering patterns."
      ],
      [
        "An extra index improves reads but slows imports. What must be assessed?",
        "Total workload tradeoff",
        "Only read latency",
        "Only the newest query",
        "Only index byte count",
        "Index maintenance affects write-heavy tasks, so the decision should reflect the full workload."
      ],
      [
        "An index supplies time order but query asks a different mixed order. What is needed?",
        "Ordering compatibility",
        "Assume all orders are equivalent",
        "Remove the final ORDER BY",
        "Only rename the index",
        "Column order and directions must match a supported traversal; arbitrary mixed directions may require another path."
      ],
      [
        "A partial index has a state predicate not implied by the query. What may happen?",
        "Incomplete coverage",
        "Forced use",
        "It automatically widens its contents",
        "It changes the query result",
        "An index containing only a subset cannot answer arbitrary rows outside its predicate."
      ],
      [
        "A workload changes and an index is rarely used. What should guide retention?",
        "Workload evidence",
        "Its age",
        "Only its short name",
        "Only its column count",
        "Retaining or removing indexes should consider actual workloads, constraints and maintenance cost."
      ],
      [
        "A performance test uses one unusually selective account. What is a limitation?",
        "Unrepresentative parameter mix",
        "The inability to use equality",
        "The lack of uppercase SQL",
        "The index cannot be valid",
        "A result for a rare account may not describe common or very large accounts."
      ],
      [
        "A new index changes a query plan but output loses tied rows. What must be fixed first?",
        "Result correctness",
        "Only plan aesthetics",
        "Only index size",
        "Only elapsed time",
        "Optimization is acceptable only if the required row semantics and tie policy remain correct."
      ]
    ]
  },
  {
    "id": "as-sargable",
    "comps": [
      "m3.c2"
    ],
    "title": "Write index-friendly filters while preserving semantics",
    "intro": "A report filters a timestamp column through a date-extraction function. The query is readable, but a normal index on the raw timestamp may not directly support that transformed expression.",
    "sections": [
      [
        "Query meaning and correctness",
        "A sargable predicate is written in a form that can support useful indexed search. For a timestamp day range, compare the column directly against a lower bound and an exclusive upper bound. Keep values typed consistently and bind parameters through the database driver rather than concatenating user text.",
        "A half-open interval includes the lower boundary and excludes the next period’s start. It avoids guessing the final fractional timestamp of a day and composes cleanly with adjacent periods. The correct bounds depend on timezone and business calendar; a local day around daylight-saving transitions is not always exactly twenty-four hours in UTC."
      ],
      [
        "Execution evidence and practical limits",
        "Wrapping a column in a function or casting it can prevent a plain index condition, though expression indexes or optimizer transformations may support particular cases. Avoid blanket claims that every function forces a scan. Read the target engine’s plan and ensure that a rewrite preserves type, collation, NULL and boundary semantics.",
        "The fixture applies a half-open numeric-time interval and returns its boundary-correct rows. It is a bounded common-subset example, not a proof of native PostgreSQL timezone handling or a latency benchmark. Select only required columns and avoid unnecessary DISTINCT, joins and sorts after confirming their semantic purpose."
      ]
    ],
    "lang": "python",
    "problem": "Write index-friendly filters while preserving semantics using an isolated synthetic SQL fixture.",
    "steps": [
      "State the required result grain and qualifying rows.",
      "Execute the fixture query on disposable SQLite tables.",
      "Compare its result with the documented output and target-engine limits."
    ],
    "code": "import sqlite3\nc=sqlite3.connect(\":memory:\")\nc.executescript('CREATE TABLE events(id INT, t INT); CREATE INDEX ix_t ON events(t); INSERT INTO events VALUES(1,99),(2,100),(3,199),(4,200);')\nprint(c.execute('SELECT id FROM events WHERE t>=100 AND t<200 ORDER BY id').fetchall())\nc.close()",
    "expect": "[(2,), (3,)]",
    "limit": "This example executes SQLite through Python’s standard library. It verifies only this fixture’s result, not PostgreSQL optimizer choices, native performance, concurrent behavior or every dialect feature. PostgreSQL semantics are grounded separately in the pinned official documentation.",
    "mistakes": [
      "A passing small fixture does not establish representative production performance.",
      "Preserve the intended row grain and NULL semantics before optimizing a query."
    ],
    "takeaways": [
      "A sargable predicate is written in a form that can support useful indexed search.",
      "Verify correctness and inspect the target engine before drawing performance conclusions."
    ],
    "practice": [
      [
        "What is a half-open interval?",
        "Lower included, upper excluded",
        "Both bounds excluded always",
        "Both bounds included always",
        "Only the midpoint included",
        "A half-open interval includes its starting bound and excludes the next boundary."
      ],
      [
        "Why avoid guessing a day’s final timestamp?",
        "Precision can vary",
        "Dates cannot be compared",
        "Indexes require midnight only",
        "All timestamps are integers",
        "An exclusive next-day bound does not depend on a guessed last representable fractional instant."
      ],
      [
        "Does every column function force a full scan?",
        "No",
        "Always",
        "Only in uppercase",
        "Only with text",
        "Expression indexes and optimizer rules may support some expressions, so the target plan determines access."
      ],
      [
        "A time filter uses t>=100 AND t<200. Which boundary is excluded?",
        "200",
        "100",
        "Every value",
        "Neither boundary",
        "The strict upper comparison excludes exactly 200 while the lower comparison includes 100."
      ],
      [
        "A local-day query adds exactly 24 UTC hours across a DST change. What needs review?",
        "Calendar semantics",
        "Only index naming",
        "Only alias order",
        "Only query formatting",
        "A local calendar day can have a different UTC duration around offset changes."
      ],
      [
        "A developer rewrites a function filter to a range. What must be checked first?",
        "Semantic equivalence",
        "Only shorter text",
        "Only brighter output",
        "Only a new alias",
        "A faster-looking predicate is unacceptable if boundary, type or timezone meaning changes."
      ],
      [
        "A query adds DISTINCT to hide unexpected join duplicates. What should be investigated?",
        "The join grain",
        "Only text width",
        "Only a larger index",
        "Only display rounding",
        "Unexpected multiplicity often indicates a relationship or grain issue that DISTINCT can conceal."
      ],
      [
        "A report excludes an upper midnight boundary. Where does that event belong in adjacent half-open days?",
        "Next day",
        "Both days",
        "Neither day always",
        "The previous day only",
        "The exclusive upper boundary is the inclusive lower boundary of the next adjacent period."
      ],
      [
        "A developer removes a join to speed a query. What must be preserved?",
        "Join semantics",
        "Only the alias count",
        "Only the number of lines",
        "Only the SQL casing",
        "A join may filter eligibility or supply required facts, so removal needs an equivalence justification."
      ],
      [
        "A bound is supplied as user text containing SQL punctuation. What should the driver do?",
        "Bind it as a value",
        "Execute it as a clause",
        "Append it to the query",
        "Use it as a table name",
        "Parameter binding separates supplied values from SQL structure and avoids treating punctuation as executable syntax."
      ]
    ],
    "formal": [
      [
        "What is the aim of a sargable predicate?",
        "Useful indexed search",
        "One row",
        "Automatic authorization",
        "A permanent materialized view",
        "The form should allow an index condition when suitable; actual planning remains workload-dependent."
      ],
      [
        "Which range composes without overlap with [100,200)?",
        "[200,300)",
        "[199,300]",
        "[100,300]",
        "[99,200]",
        "The next half-open interval begins at the previous exclusive upper bound, avoiding a gap or overlap."
      ],
      [
        "What should constrain dynamic filter values?",
        "Parameter binding",
        "Text joining",
        "Only a chart legend",
        "A random string prefix",
        "Bound values remain data rather than being concatenated into executable SQL."
      ],
      [
        "A timestamp is cast to text for filtering. What may change?",
        "Comparison/access",
        "Only the SELECT alias",
        "Only result width",
        "Nothing relevant",
        "Text conversion can affect ordering, formatting and index support compared with typed timestamp predicates."
      ],
      [
        "A query compares an indexed column with a mismatched type. What needs review?",
        "Implicit casts",
        "Color",
        "Only client color",
        "Only a filename",
        "Implicit conversion can affect meaning and whether the engine can use an index condition."
      ],
      [
        "A function predicate has a matching expression index. What is possible?",
        "Expression indexing",
        "A full scan",
        "Automatic causal correctness",
        "Automatic unique output",
        "An appropriately defined expression index can support the matching expression, subject to planner choices."
      ],
      [
        "A report uses inclusive end bounds for adjacent periods. What risk arises?",
        "Boundary double-counting",
        "Syntax error",
        "A mandatory syntax error",
        "Automatic index deletion",
        "A shared boundary belongs to both closed intervals and can be counted twice."
      ],
      [
        "A query sorts a large intermediate result but consumers do not need order. What should be assessed?",
        "Sort necessity",
        "Aliasing",
        "Only a wider index name",
        "Only a smaller comment",
        "Removing unnecessary operations can reduce work if it preserves all required result semantics."
      ],
      [
        "A filter rewrite is faster on a tiny fixture. What remains unproven?",
        "Representative performance",
        "The fixture result",
        "The existence of SQL",
        "The successful execution",
        "Real distributions, caching and storage can produce very different plan and timing behavior."
      ],
      [
        "A range query handles local calendar days for global accounts. What must be specified?",
        "Timezone policy",
        "Row id",
        "Only an output alias",
        "Only alphabetical order",
        "Calendar boundaries depend on the intended business timezone, which must be translated consistently into stored-time comparisons."
      ]
    ]
  }
];
const c=course('advanced-sql',specs,[]);
const COMMIT='e6b2f7c2b41d6261dac15825dede55e94ca35614';
const refs={queries:'queries.sgml',indexes:'indices.sgml',performance:'perform.sgml',functions:'func.sgml'};
c.references=Object.entries(refs).map(([id,file])=>({id,title:'PostgreSQL 16 official documentation: '+id,url:'https://github.com/postgres/postgres/blob/'+COMMIT+'/doc/src/sgml/'+file,source:{repo:'postgres/postgres',commit:COMMIT,path:'doc/src/sgml/'+file,verification:'Pinned official PostgreSQL documentation. SQLite examples verify their stated common-subset results only; source identity and execution are not human approval.'}}));
for(const l of c.lessons){l.references=Object.keys(refs);l.prerequisite_note=l.prerequisites.length?'Use the preceding lesson’s query-grain and SQL semantics; sql-fundamentals remains the canonical prerequisite. Examples execute isolated SQLite through standard-library Python. PostgreSQL semantics and planning claims are explicitly distinguished.':'Canonical prerequisite: sql-fundamentals. Review SELECT, joins, grouping and NULL before continuing. All examples use synthetic disposable SQLite data; PostgreSQL-specific syntax and planner behavior are explained separately.';}
module.exports=c;
