'use strict';
/** Data Engineer track. */
const { mc, out, written, submission } = require('../q');

module.exports = [
  // ---- Advanced SQL ----
  mc('de-sq-01', 'de.advanced_sql', 1, 'What does a window function such as ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY ordered_at) do?', ['Numbers each customer\'s orders in date order without collapsing rows', 'Deletes duplicate rows', 'Groups rows into one per customer', 'Creates a new table'], 0,
    'Window functions compute across related rows but keep every row, unlike GROUP BY.'),
  mc('de-sq-02', 'de.advanced_sql', 2, 'What is a common table expression (WITH ... AS) mainly useful for?', ['Naming an intermediate result so a complex query is readable (and enabling recursion)', 'Creating indexes', 'Encrypting data', 'Speeding up every query automatically'], 0,
    'CTEs break a long query into named steps; recursive CTEs handle hierarchies.'),
  mc('de-sq-p1', 'de.advanced_sql', 3, 'You want each customer\'s most recent order. Which query is correct?',
    ['WITH r AS (SELECT *, ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY ordered_at DESC) AS rn FROM orders)\nSELECT * FROM r WHERE rn = 1;', 'SELECT * FROM orders ORDER BY ordered_at DESC LIMIT 1;', 'SELECT customer_id, MAX(order_id) FROM orders;', 'SELECT DISTINCT customer_id FROM orders;'], 0,
    'Ranking each customer\'s orders newest first and keeping rank 1 returns one full row per customer. LIMIT 1 returns only one order overall.', { practical: true }),
  mc('de-sq-s1', 'de.advanced_sql', 3, 'A nightly report query on a 200-million-row table takes 3 hours. What is the best first step?',
    ['Run EXPLAIN ANALYZE to find the slow steps (scans, joins, sorts), then add suitable indexes or partitioning', 'Buy a bigger server immediately', 'Run it twice', 'Remove the WHERE clause'], 0,
    'The query plan shows where time goes; fixes should target the measured bottleneck.', { type: 'scenario' }),

  // ---- Data modeling ----
  mc('de-md-01', 'de.modeling', 1, 'In a star schema, what does a fact table hold?', ['Measurable events, such as each sale with its amount and keys to dimensions', 'Only descriptions such as product names', 'User passwords', 'Application logs'], 0,
    'Facts are the numeric events; dimensions (product, date, customer) describe them.'),
  mc('de-md-02', 'de.modeling', 2, 'Why are analytics models often denormalised compared with application databases?', ['Fewer joins make reporting queries simpler and faster', 'Denormalised data is always more accurate', 'Normalisation is not allowed', 'To use less storage'], 0,
    'Analytics favours read speed and simplicity; transactional systems favour normalisation for consistent writes.'),
  mc('de-md-p1', 'de.modeling', 3, 'A customer moves from Lahore to Karachi, and the team must still report past sales under Lahore. How should the customer dimension handle it?',
    ['A slowly changing dimension type 2: add a new row with valid_from / valid_to dates and keep the old row', 'Overwrite the city in place', 'Delete the customer', 'Store the city in the fact table only as text'], 0,
    'Type 2 keeps history, so each sale joins to the customer version that was valid at the time.', { practical: true }),
  mc('de-md-s1', 'de.modeling', 3, 'Analysts ask for "daily active learners by course". What grain should the fact table have?',
    ['One row per learner, per course, per day of activity', 'One row per course for all time', 'One row per click with no date', 'One row per year'], 0,
    'Choosing the grain first - the level one row represents - decides which questions the table can answer.', { type: 'scenario' }),

  // ---- ETL / ELT and pipelines ----
  mc('de-et-01', 'de.etl', 1, 'What is the difference between ETL and ELT?', ['ETL transforms data before loading it; ELT loads raw data first and transforms it inside the warehouse', 'They are identical', 'ELT never transforms data', 'ETL only works with CSV'], 0,
    'Modern warehouses are powerful enough to transform after loading, which keeps the raw data available.'),
  mc('de-et-02', 'de.etl', 2, 'Why should a pipeline step be idempotent?', ['Re-running it after a failure must not duplicate or corrupt data', 'So it runs faster', 'So it uses less code', 'So it never fails'], 0,
    'Pipelines are retried; an idempotent step (for example upsert or overwrite a partition) gives the same result each time.'),
  mc('de-et-p1', 'de.etl', 3, 'This daily job appends yesterday\'s orders. After a failed run was retried, yesterday\'s orders appear twice. What is the fix?',
    ['Make the load idempotent: delete and reload that day\'s partition, or upsert on order_id', 'Retry less often', 'Run the job at night', 'Add a print statement'], 0,
    'Appending is not safe to repeat. Replacing the partition or merging on a key makes retries harmless.',
    { type: 'debug', code: "rows = extract_orders(day=yesterday)\nwarehouse.insert('orders', rows)  # plain append" }),
  mc('de-et-s1', 'de.etl', 3, 'A source API changes a field name without warning and the pipeline silently loads nulls. How do you prevent this next time?',
    ['Validate the schema at ingestion and fail loudly (alert) when expected fields are missing', 'Ignore nulls', 'Stop using APIs', 'Load everything as text forever'], 0,
    'Schema checks at the boundary turn silent corruption into a visible, fixable failure.', { type: 'scenario' }),

  // ---- Orchestration ----
  mc('de-or-01', 'de.orchestration', 1, 'What is a DAG in tools such as Airflow?', ['A directed acyclic graph of tasks and their dependencies', 'A database index', 'A data file format', 'A dashboard'], 0,
    'The DAG defines which tasks run, in what order, and what depends on what.'),
  mc('de-or-02', 'de.orchestration', 2, 'Why use an orchestrator instead of a chain of cron jobs?', ['It handles dependencies, retries, backfills, monitoring and alerts in one place', 'Cron cannot run scripts', 'Orchestrators make data smaller', 'It removes the need for testing'], 0,
    'Cron only triggers at times; orchestrators know task dependencies and state.'),
  mc('de-or-p1', 'de.orchestration', 2, 'The transform task sometimes runs before the extract task has finished. What is missing?',
    ['A dependency: extract >> transform >> load', 'A longer schedule interval', 'More retries on transform', 'A second DAG'], 0,
    'Without declared dependencies, tasks can run in any order. Setting extract >> transform makes transform wait.',
    { type: 'debug', code: 'extract = PythonOperator(task_id="extract", python_callable=run_extract)\ntransform = PythonOperator(task_id="transform", python_callable=run_transform)\nload = PythonOperator(task_id="load", python_callable=run_load)' }),
  mc('de-or-s1', 'de.orchestration', 3, 'A bug corrupted a metric for the last 30 days. After fixing the code, what do you do?',
    ['Backfill the 30 affected days with the fixed pipeline and tell downstream users', 'Fix only today and forget the past', 'Delete the metric', 'Wait for the bug to fix itself'], 0,
    'Backfilling reruns past periods so history is correct; communicating prevents decisions on bad numbers.', { type: 'scenario' }),

  // ---- Data quality ----
  mc('de-dq-01', 'de.quality', 1, 'Which is a data-quality check?', ['Asserting that order_id is unique and never null', 'Choosing a chart colour', 'Renaming the database', 'Adding more servers'], 0,
    'Uniqueness, not-null, ranges and referential checks catch bad data early.'),
  mc('de-dq-02', 'de.quality', 2, 'Why check row counts between source and destination after each load?', ['To detect lost or duplicated rows', 'To speed up the next load', 'To compress the data', 'Because SQL requires it'], 0,
    'Reconciliation catches silent failures that would otherwise reach reports.'),
  mc('de-dq-p1', 'de.quality', 2, 'Which SQL query finds orders that reference a customer that does not exist?',
    ['SELECT o.* FROM orders o LEFT JOIN customers c ON c.id = o.customer_id WHERE c.id IS NULL;', 'SELECT * FROM orders WHERE customer_id = NULL;', 'SELECT * FROM customers;', 'SELECT COUNT(*) FROM orders;'], 0,
    'A left join keeps every order; those with no matching customer have NULL customer columns.', { practical: true }),
  mc('de-dq-s1', 'de.quality', 3, 'Finance says yesterday\'s revenue in the warehouse is 3% lower than the payment system. What do you do?',
    ['Reconcile record by record to find the missing payments (late arrivals, failed loads, filters), fix the cause and add an automated check', 'Tell finance their system is wrong', 'Add 3% to the report', 'Ignore differences under 5%'], 0,
    'Find the root cause with a reconciliation, fix it, and make the check permanent.', { type: 'scenario' }),

  // ---- Cloud data services ----
  mc('de-cl-01', 'de.cloud_data', 1, 'What is object storage such as Amazon S3 or Google Cloud Storage commonly used for in data platforms?', ['Cheap, durable storage of raw and processed files (a data lake)', 'Running SQL transactions', 'Hosting the website only', 'Sending emails'], 0,
    'Object storage holds large files cheaply; warehouses and engines read from it.'),
  mc('de-cl-02', 'de.cloud_data', 2, 'Why store analytics data in a columnar format such as Parquet?', ['Queries read only the needed columns and the data compresses well', 'It is human-readable', 'It allows row-by-row updates', 'It is required for CSV'], 0,
    'Columnar files suit analytical scans of a few columns over many rows.'),
  mc('de-cl-p1', 'de.cloud_data', 3, 'A warehouse query scans 5 TB every time and the bill is huge, but it only needs the last 7 days. What is the fix?',
    ['Partition the table by date and filter on the partition column so only recent partitions are scanned', 'Run the query less often only', 'Copy the table', 'Remove the date filter'], 0,
    'Partition pruning limits the data read - and in many warehouses, the cost - to the matching partitions.', { practical: true }),
  mc('de-cl-s1', 'de.cloud_data', 3, 'A start-up with 20 GB of data asks whether it needs a big distributed cluster. What do you recommend?',
    ['Start with a managed warehouse or even PostgreSQL; add distributed tools only when data volume requires it', 'Always use the largest cluster', 'Keep data in spreadsheets forever', 'Build a custom database'], 0,
    'Right-sizing avoids cost and complexity; 20 GB fits comfortably on simple managed services.', { type: 'scenario' }),

  // ---- Reviewed ----
  written('de-wr-01', 'de.etl', 2, 'theory', 'Explain what makes a data pipeline idempotent, why it matters, and give one technique to achieve it.',
    [['Correct definition: re-running produces the same result', 2], ['Why it matters: retries, backfills, failures without duplicates', 2], ['A valid technique (partition overwrite, upsert/merge on keys, deduplication)', 2]],
    'An idempotent pipeline produces the same output however many times it runs for the same input period. Jobs fail and are retried or backfilled, so non-idempotent appends duplicate data. Overwriting the day\'s partition or merging on a unique key makes reruns safe.'),
  submission('de-sb-01', ['de.etl', 'de.quality'], 3, 'Write Python (pandas is fine) for a step that reads a daily orders CSV, removes duplicate order_id rows, rejects rows with a missing customer_id or a negative amount into a separate "rejected" file, and writes the clean rows to a file named for the date - safely re-runnable.',
    [['Reads and deduplicates on order_id', 2], ['Validation rules applied with rejected rows kept separately', 2], ['Output named by date and overwritten (idempotent), not appended', 2], ['Reports counts (read, clean, rejected) or logs', 1], ['Readable code', 1]],
    'import pandas as pd\ndef run(day):\n    df = pd.read_csv(f"raw/orders_{day}.csv").drop_duplicates(subset="order_id")\n    bad = df["customer_id"].isna() | (df["amount"] < 0)\n    df[bad].to_csv(f"rejected/orders_{day}.csv", index=False)\n    df[~bad].to_parquet(f"clean/orders_{day}.parquet", index=False)  # overwrite = safe rerun\n    print(day, len(df), "rows,", int(bad.sum()), "rejected")'),
  written('de-wr-02', 'de.quality', 3, 'scenario', 'Dashboards across the company sometimes show yesterday\'s numbers as zero until mid-morning. Diagnose the likely causes and propose a fix.',
    [['Identifies timing/dependency causes (late source data, schedule before arrival)', 2], ['Proposes sensors/dependencies or event-based triggers', 2], ['Adds freshness checks and alerts', 1], ['Shows data freshness on dashboards', 1]],
    'The pipeline probably runs on a fixed schedule before the source data has arrived, so it loads an empty day. Trigger it from data arrival (or use a sensor), make tasks depend on upstream completion, alert when a day has suspiciously few rows, and show "data last updated" on dashboards.'),
];
