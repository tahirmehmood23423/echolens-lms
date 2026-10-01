'use strict';
// TT-06 Database Systems and PostgreSQL Internals. The browser compiler runs
// SQLite, so the coding tasks below cover the portable SQL (joins, window
// functions, recursive CTEs, index plans); PostgreSQL internals are quizzed.
// Quiz rows: [question, options, index of the correct option, explanation].
module.exports = {
  quizzes: {
    'A6.1': [
      ['Which join keeps customers who have no orders?', ['INNER JOIN', 'LEFT JOIN from Customers to Orders', 'CROSS JOIN', 'RIGHT JOIN from Customers to Orders'], 1, 'LEFT JOIN keeps every row of the left table.'],
      ['SUM over zero matching rows returns...', ['0', 'NULL', 'an error', '-1'], 1, 'Aggregates over no rows return NULL, except COUNT.'],
      ['How do you show 0 instead of NULL for customers with no orders?', ['ISNULL only in MySQL', 'COALESCE(SUM(...), 0)', 'NULLIF(SUM(...), 0)', 'CAST(NULL AS 0)'], 1, 'COALESCE returns the first non-NULL argument.'],
      ['What does `NULL = NULL` evaluate to in SQL?', ['TRUE', 'FALSE', 'NULL (unknown)', 'An error'], 2, 'Use IS NULL to test for NULL.'],
      ['UNION vs UNION ALL:', ['identical', 'UNION removes duplicate rows; UNION ALL keeps them', 'UNION ALL removes duplicates', 'UNION only works on two columns'], 1, 'UNION ALL is cheaper when duplicates are impossible or wanted.'],
    ],
    'A6.2': [
      ['How does a window function differ from GROUP BY?', ['It is slower', 'It computes over related rows but keeps every individual row in the output', 'It cannot use aggregates', 'It requires a JOIN'], 1, 'Rows are not collapsed.'],
      ['Which function gives tied rows the same rank and leaves gaps after ties?', ['ROW_NUMBER()', 'RANK()', 'DENSE_RANK()', 'NTILE()'], 1, 'DENSE_RANK has no gaps; ROW_NUMBER never ties.'],
      ['PARTITION BY country in a window...', ['filters rows by country', 'restarts the calculation for each country', 'sorts the final output', 'creates a table partition'], 1, 'Each partition is ranked independently.'],
      ['SUM(revenue) OVER (ORDER BY month) produces...', ['the grand total on every row', 'a running total', 'monthly averages', 'an error'], 1, 'An ORDER BY in the window implies a cumulative frame.'],
      ['To keep only the top three per country after ranking, you...', ['use WHERE rank <= 3 in the same SELECT', 'wrap the ranked query in a subquery or CTE and filter there', 'use LIMIT 3', 'use HAVING rank <= 3'], 1, 'Window results are computed after WHERE, so filter in an outer query.'],
    ],
    'A6.3': [
      ['A recursive CTE consists of...', ['one SELECT', 'an anchor member UNION ALL a recursive member that references the CTE', 'a stored procedure', 'a trigger'], 1, 'The recursive part repeats until it returns no rows.'],
      ['The anchor of an employee hierarchy usually selects...', ['every employee', 'the top of the tree, e.g. WHERE manager_id IS NULL', 'leaf employees', 'nothing'], 1, 'Recursion then walks downward.'],
      ['What happens if the data contains a cycle and nothing guards against it?', ['The query returns an empty set', 'The recursion can run forever', 'SQL removes the cycle', 'It is a syntax error'], 1, 'Each loop produces new rows endlessly.'],
      ['PostgreSQL 14+ stops cycles declaratively with...', ['the LOOP clause', 'the CYCLE clause', 'LIMIT 1', 'DISTINCT ON'], 1, 'CYCLE id SET is_cycle USING path tracks visited nodes.'],
      ['A portable way to stop cycles (e.g. in SQLite) is to...', ['use ORDER BY', 'carry a path string and stop when the next id is already in it', 'use RIGHT JOIN', 'increase memory'], 1, 'Manual path tracking emulates CYCLE.'],
    ],
    'A6.4': [
      ['The default PostgreSQL page (block) size is...', ['4 KB', '8 KB', '16 KB', '1 MB'], 1, '8192 bytes.'],
      ['An UPDATE in PostgreSQL...', ['overwrites the row in place', 'writes a new tuple version and marks the old one dead for its xmax', 'deletes the table', 'only changes the index'], 1, 'MVCC keeps old versions for concurrent readers.'],
      ['The Write-Ahead Log guarantees...', ['faster SELECTs', 'durability: changes are logged before data files are written, allowing crash recovery', 'smaller tables', 'automatic indexing'], 1, 'Replaying WAL restores committed changes.'],
      ['The pageinspect extension lets you...', ['tune queries automatically', 'look at raw page and tuple headers', 'back up databases', 'create users'], 1, 'get_raw_page + heap_page_items expose internals.'],
      ['xmin on a tuple records...', ['the minimum value in a column', 'the id of the transaction that created that tuple version', 'the page number', 'the row length'], 1, 'xmax records the deleting/updating transaction.'],
    ],
    'A6.5': [
      ['A composite index on (tenant_id, created_at) best serves...', ['WHERE created_at > ? alone', 'WHERE tenant_id = ? (optionally with a created_at range or ORDER BY created_at)', 'full table scans', 'WHERE email = ?'], 1, 'B-trees are sorted by the leading column first.'],
      ['Why does a query on created_at alone often not use that composite index?', ['Indexes are case-sensitive', 'The leading column is not constrained, so the ordered entries cannot be seeked by created_at', 'The index is corrupt', 'Dates cannot be indexed'], 1, 'It is like a phone book sorted by surname then first name.'],
      ['EXPLAIN shows...', ['the query result', 'the planner\'s chosen execution plan', 'table sizes only', 'user permissions'], 1, 'EXPLAIN ANALYZE also runs it and reports actuals.'],
      ['A sequential scan is often chosen when...', ['the query returns a large fraction of the table', 'only one row matches', 'an index exists on every column', 'never'], 0, 'Reading the whole table can be cheaper than many random lookups.'],
      ['Every index also costs...', ['nothing', 'extra writes on INSERT/UPDATE/DELETE and storage', 'slower reads always', 'a table lock forever'], 1, 'Indexes trade write cost for read speed.'],
    ],
    'A6.6': [
      ['A GIN index on a JSONB column speeds up...', ['ORDER BY on integers', 'containment queries using @>', 'string length checks', 'COUNT(*) on the table'], 1, 'GIN indexes the keys and values inside documents.'],
      ['A partial index is...', ['an index with half the columns', 'an index built only over rows matching a WHERE predicate', 'an unfinished index', 'a hash index'], 1, 'e.g. CREATE INDEX ... WHERE active.'],
      ['Why is a partial index on active users smaller?', ['It is compressed', 'It contains entries only for the active rows', 'It skips the primary key', 'It stores no pointers'], 1, 'Fewer rows indexed means fewer entries.'],
      ['BRIN indexes are best for...', ['random UUID columns', 'very large tables where values correlate with physical order, e.g. timestamps', 'small lookup tables', 'JSON documents'], 1, 'BRIN stores min/max per block range.'],
      ['Which function reports an index\'s size on disk?', ['length()', 'pg_relation_size()', 'count()', 'octet_length()'], 1, 'pg_relation_size(\'index_name\').'],
    ],
    'A6.7': [
      ['EXPLAIN (ANALYZE) differs from EXPLAIN because it...', ['shows less detail', 'actually executes the query and reports real row counts and timings', 'changes the data', 'skips the planner'], 1, 'Beware: ANALYZE runs writes too.'],
      ['A large gap between estimated rows and actual rows indicates...', ['a fast query', 'a planner misestimate, often from stale or insufficient statistics', 'a correct plan', 'a syntax error'], 1, 'Misestimates lead to poor join and scan choices.'],
      ['BUFFERS output with high "read" counts suggests...', ['data served from shared buffers', 'pages read from disk/OS cache - I/O cost', 'CPU-bound work', 'a locked table'], 1, '"hit" means already in shared buffers.'],
      ['In a plan tree, timings of a parent node...', ['exclude its children', 'include the time of its children', 'are random', 'are always zero'], 1, 'Subtract children to find the node\'s own cost.'],
      ['"loops=1000" on an inner node means...', ['it ran once', 'it executed 1000 times, so multiply per-loop time and rows', 'there are 1000 tables', 'an error occurred'], 1, 'Common under nested loop joins.'],
    ],
    'A6.8': [
      ['Raising work_mem can change a sort from...', ['in-memory to on-disk', 'an external merge on disk to an in-memory quicksort', 'a join to a scan', 'nothing'], 1, 'More memory lets the sort fit in RAM.'],
      ['ANALYZE on a table...', ['deletes dead rows', 'refreshes the planner\'s statistics', 'rebuilds indexes', 'locks it forever'], 1, 'VACUUM cleans; ANALYZE gathers stats.'],
      ['A hash join is typically chosen for...', ['tiny inputs with an index on the inner side', 'large unsorted inputs joined on equality', 'inequality joins', 'cross joins'], 1, 'It builds a hash table on the smaller input.'],
      ['A nested loop join is efficient when...', ['both inputs are huge', 'the outer side is small and the inner side has an index on the join key', 'there are no indexes', 'joining on <'], 1, 'Each outer row does one index lookup.'],
      ['Skewed data can mislead the planner because...', ['it uses averages that do not reflect hot values; extended or higher-target statistics help', 'skew is not allowed', 'indexes break', 'it doubles row counts'], 0, 'Most-common-values lists and statistics targets address skew.'],
    ],
    'A6.9': [
      ['Range partitioning by order date with yearly partitions means...', ['each year\'s rows are stored in their own child table', 'rows are hashed randomly', 'indexes are dropped', 'one table per customer'], 0, 'The parent routes rows by range.'],
      ['Partition pruning is...', ['deleting old partitions', 'the planner skipping partitions that cannot contain matching rows', 'compressing partitions', 'VACUUM'], 1, 'A one-year filter scans only that partition.'],
      ['A query with no filter on the partition key will...', ['scan only one partition', 'scan every partition', 'fail', 'use a GIN index'], 1, 'Nothing lets the planner exclude partitions.'],
      ['A practical benefit of partitioning is...', ['faster single-row primary key lookups always', 'cheap removal of old data by dropping or detaching a partition', 'no need for indexes', 'unlimited columns'], 1, 'DROP of a partition beats a huge DELETE.'],
      ['Rows whose date matches no partition...', ['are silently discarded', 'cause an error unless a DEFAULT partition exists', 'go to the first partition', 'are duplicated'], 1, 'Create a default partition to catch them.'],
    ],
    'A6.10': [
      ['A phantom read is when...', ['a row disappears due to a crash', 'rerunning the same query in a transaction returns new rows inserted by another committed transaction', 'a NULL appears', 'an index is missing'], 1, 'The set of matching rows changes.'],
      ['PostgreSQL\'s default isolation level is...', ['READ UNCOMMITTED', 'READ COMMITTED', 'REPEATABLE READ', 'SERIALIZABLE'], 1, 'Each statement sees data committed before it began.'],
      ['Under SERIALIZABLE, a conflicting transaction may fail with...', ['deadlock detected', 'could not serialize access (SQLSTATE 40001)', 'syntax error', 'permission denied'], 1, 'The application must retry it.'],
      ['The correct response to a serialisation failure is to...', ['ignore it', 'retry the whole transaction', 'lower the isolation level silently', 'restart the server'], 1, 'Retries are part of using SERIALIZABLE.'],
      ['Does PostgreSQL ever show dirty (uncommitted) reads?', ['Yes, at READ UNCOMMITTED', 'No - READ UNCOMMITTED behaves like READ COMMITTED', 'Only in SERIALIZABLE', 'Only for indexes'], 1, 'PostgreSQL never exposes uncommitted data.'],
    ],
    'A6.11': [
      ['SELECT ... FOR UPDATE...', ['reads without locks', 'locks the selected rows until the transaction ends', 'updates rows automatically', 'locks the whole database'], 1, 'Other writers wait for the lock.'],
      ['With ten concurrent checkouts on one remaining item, FOR UPDATE ensures...', ['all ten succeed', 'checkouts serialise on the row so exactly one can take the last item', 'none succeed', 'random results'], 1, 'Each waits, then sees the updated stock.'],
      ['SKIP LOCKED is useful for...', ['backups', 'queue consumers that should take the next unlocked job instead of waiting', 'creating indexes', 'reporting'], 1, 'Workers never process the same job.'],
      ['NOWAIT makes a locking SELECT...', ['wait forever', 'fail immediately if the row is already locked', 'skip the row', 'lock the table'], 1, 'Useful when waiting is not acceptable.'],
      ['Row locks are released when...', ['the SELECT finishes', 'the transaction commits or rolls back', 'after one second', 'the client disconnects only'], 1, 'Locks last for the whole transaction.'],
    ],
    'A6.12': [
      ['Table bloat after a large UPDATE comes from...', ['bigger indexes only', 'dead tuple versions left behind by MVCC', 'WAL files', 'temporary tables'], 1, 'Old versions remain until vacuumed.'],
      ['Plain VACUUM...', ['always shrinks the file on disk', 'marks dead space reusable, usually without returning it to the OS', 'locks the table exclusively', 'drops indexes'], 1, 'VACUUM FULL rewrites the table and shrinks it, with an exclusive lock.'],
      ['A deadlock occurs when...', ['a query is slow', 'two transactions each hold a lock the other needs', 'the disk is full', 'an index is missing'], 1, 'Neither can proceed without the other releasing.'],
      ['When PostgreSQL detects a deadlock it...', ['waits forever', 'aborts one transaction with "deadlock detected" so the other can continue', 'aborts both', 'restarts'], 1, 'The victim must retry.'],
      ['The simplest way to prevent the two-table deadlock is to...', ['use more connections', 'update the tables in the same order in every transaction', 'disable locks', 'use SKIP LOCKED'], 1, 'Consistent lock ordering removes cycles.'],
    ],
  },
  tasks: {
    'A6.1': { language: 'sql', title: 'Lifetime value including customers with no orders', description: 'In the SQL compiler, create Customers, Orders and OrderItems tables and seed them so that at least two customers have no orders. Write a lifetime-value query that lists every customer with the total of quantity × unit price across their orders, showing 0 (not NULL) for customers with no orders. Then write a separate aggregate query over OrderItems and show that the two grand totals match.', criteria: ['Every customer appears, including those with zero orders.', 'Customers with no orders show 0, not NULL.', 'The per-customer totals sum to the same value as a separate aggregate over OrderItems.', 'Both queries and their outputs are shown.'], hint: 'Customers LEFT JOIN Orders LEFT JOIN OrderItems, then COALESCE(SUM(...), 0) grouped by customer.' },
    'A6.2': { language: 'sql', title: 'Window functions: top three per country and running revenue', description: 'Create an orders table (id, customer, country, order_date, amount) with at least 20 rows across three countries and four months, including at least one tie. Write one query that keeps every order row while adding each customer\'s total spend and their rank within their country, then filter to the top three spending customers per country. Write a second query giving monthly revenue with a running total.', criteria: ['Individual order rows are preserved in the ranking query output.', 'Ties are handled the way the chosen ranking function documents (state which one in a comment).', 'Only the top three customers per country remain after filtering.', 'The running total on the final month equals the grand total.'], hint: 'Rank in a CTE, then filter WHERE rnk <= 3 in the outer query.' },
    'A6.3': { language: 'sql', title: 'Recursive CTE over an employee hierarchy', description: 'Create an employees table (id, name, manager_id) with a five-level management chain. Write a recursive CTE returning each employee\'s depth and full management chain (e.g. "CEO > VP > Director > Manager > Engineer"). Then add a deliberate cycle and show that your query still terminates by tracking the visited path.', criteria: ['Depth is correct for every level of the five-level chain.', 'The full management chain is shown for each employee.', 'With a deliberate cycle, the query terminates instead of running forever.', 'The cycle guard is explained in a comment (SQLite has no CYCLE clause).'], hint: 'Carry a path such as \'/1/4/\' and only recurse when instr(path, \'/\' || e.id || \'/\') = 0.' },
    'A6.5': { language: 'sql', title: 'Composite index and query plans', description: 'Create an events table (id, tenant_id, created_at, payload) and insert at least 1,000 rows using a recursive CTE. Show EXPLAIN QUERY PLAN for (a) WHERE tenant_id = ? AND created_at > ? and (b) WHERE created_at > ? before and after creating an index on (tenant_id, created_at). Explain in comments why (a) uses the index and (b) does not.', criteria: ['At least 1,000 rows are generated in SQL.', 'Plans are shown before and after the composite index is created.', 'The tenant-filtered query uses the index; the created_at-only query scans.', 'Comments explain the difference using leading-column ordering.'], hint: 'WITH RECURSIVE n(i) AS (SELECT 1 UNION ALL SELECT i + 1 FROM n WHERE i < 1000) INSERT ... SELECT ... FROM n;' },
  },
};
