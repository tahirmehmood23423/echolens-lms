'use strict';
/** Data analytics, BI and data engineering subtracks. */
const { S } = require('../dsl');

module.exports = [
  S('data-business-fundamentals', 'Data and Business Analysis Fundamentals', 'How organisations use data to decide, and how analysts work.',
    { level: 'foundation', depth: 1, hours: 12, refs: [] }, [
      ['The analyst role', ['!Turn a vague business request into a clear analytical question', 'Identify stakeholders and the decision the analysis supports']],
      ['Data basics', ['!Distinguish data types, granularity and units', 'Describe where business data comes from and its limitations']],
      ['Metrics', ['!Define metrics precisely (numerator, denominator, period)', 'Distinguish leading and lagging indicators']],
    ]),
  S('spreadsheet-analysis', 'Excel and Spreadsheet Analysis', 'Practical analysis in Excel and Google Sheets.',
    { level: 'beginner', depth: 2, hours: 15, prereq: ['data-business-fundamentals'], refs: [] }, [
      ['Formulas', ['!Use relative and absolute references correctly', 'Use IF, SUMIFS, COUNTIFS and text/date functions']],
      ['Lookups', ['!Look up data with XLOOKUP or INDEX/MATCH', 'Handle missing matches']],
      ['Pivot tables and cleaning', ['!Summarise data with pivot tables and refresh them correctly', 'Clean data with Power Query or functions']],
    ]),
  S('advanced-sql', 'Analytical and Advanced SQL with Query Performance', 'Window functions, CTEs, complex aggregation and making queries fast.',
    { level: 'intermediate', depth: 3, hours: 20, prereq: ['sql-fundamentals'], refs: ['tt-postgresql-internals'] }, [
      ['CTEs and subqueries', ['!Structure complex queries with CTEs', 'Use correlated subqueries and EXISTS correctly']],
      ['Window functions', ['!Rank, running totals and period comparisons with window functions', 'Pick the latest row per group']],
      ['Query performance', ['!Read query plans and add suitable indexes', 'Write sargable filters and avoid unnecessary scans']],
    ]),
  S('descriptive-stats-metrics', 'Descriptive Statistics and Business Metrics', 'Summarising data honestly and computing the metrics businesses run on.',
    { level: 'beginner', depth: 2, hours: 15, prereq: ['data-business-fundamentals'], refs: [] }, [
      ['Descriptive statistics', ['!Choose mean, median or mode and measures of spread', 'Identify skew and outliers']],
      ['Business metrics', ['!Compute growth, conversion, retention, churn and margin correctly', 'Apply agreed metric definitions (for example refunds and revenue)']],
      ['Interpreting results', ['!Avoid confusing correlation with causation', 'Report uncertainty and sample size']],
    ]),
  S('eda', 'Exploratory Data Analysis', 'Investigating datasets systematically before drawing conclusions.',
    { level: 'intermediate', depth: 2, hours: 12, prereq: ['pandas-fundamentals', 'descriptive-stats-metrics'], refs: [] }, [
      ['Profiling data', ['!Profile distributions, missingness and relationships', 'Check data against expectations']],
      ['Segment analysis', ['!Compare segments and detect Simpson\'s paradox', 'Analyse trends over time']],
      ['From findings to questions', ['Document findings and next questions']],
    ]),
  S('data-visualization', 'Data Visualization Principles', 'Choosing charts that communicate clearly and honestly.',
    { level: 'beginner', depth: 2, hours: 12, prereq: ['data-business-fundamentals'], refs: [] }, [
      ['Choosing charts', ['!Choose a chart type for comparison, trend, distribution or relationship']],
      ['Honest charts', ['!Avoid misleading axes, scales and aggregations', 'Use colour accessibly']],
      ['Design for readers', ['Reduce clutter and highlight the message']],
    ]),
  S('powerbi-modeling', 'Power BI and Data Modeling', 'Building reliable Power BI data models and measures.',
    { level: 'intermediate', depth: 3, hours: 20, prereq: ['spreadsheet-analysis', 'sql-fundamentals'], refs: [] }, [
      ['Power Query', ['!Import and transform data with Power Query', 'Schedule and troubleshoot refreshes']],
      ['Data modeling', ['!Build star schemas with fact and dimension tables and correct relationships', 'Choose cardinality and filter direction']],
      ['DAX', ['!Write DAX measures with CALCULATE and filter context', 'Use time intelligence correctly']],
    ]),
  S('dashboards-reporting', 'Interactive Dashboards and Reporting', 'Dashboards that decision-makers actually use.',
    { level: 'intermediate', depth: 2, hours: 12, prereq: ['data-visualization'], refs: [] }, [
      ['Dashboard design', ['!Design dashboards around decisions and key metrics', 'Use filters and drill-downs effectively']],
      ['Reliable reporting', ['!Validate dashboard numbers against source systems', 'Manage refresh, access and row-level security']],
      ['Adoption', ['Gather feedback and maintain reports over time']],
    ]),
  S('data-storytelling', 'Business Decision-Making and Data Storytelling', 'Turning analysis into recommendations people act on.',
    { level: 'intermediate', depth: 2, hours: 10, prereq: ['descriptive-stats-metrics'], refs: [] }, [
      ['Recommendations', ['!Frame findings as recommendations with impact and confidence']],
      ['Experiments and causality', ['!Design simple experiments and judge attribution claims']],
      ['Communication', ['Tailor the story to executives, managers and technical teams']],
    ]),

  // ---------------- Data engineering ----------------
  S('data-modeling-warehousing', 'Data Modeling and Warehousing', 'Designing analytical data models and warehouses.',
    { level: 'intermediate', depth: 3, hours: 20, prereq: ['database-design'], refs: [] }, [
      ['Dimensional modeling', ['!Design star schemas and choose fact table grain', 'Handle slowly changing dimensions']],
      ['Warehouses and lakes', ['!Compare OLTP, warehouse, lake and lakehouse designs', 'Partition and cluster large tables']],
      ['Semantic layer', ['Define shared, documented metrics and models']],
    ]),
  S('etl-elt-architecture', 'ETL/ELT Architecture', 'Moving data from sources to analytics reliably.',
    { level: 'intermediate', depth: 3, hours: 15, prereq: ['sql-fundamentals', 'python-fundamentals'], refs: [] }, [
      ['Patterns', ['!Choose ETL or ELT, batch or incremental loading', 'Use change data capture where appropriate']],
      ['Idempotent loads', ['!Design reruns that do not duplicate or lose data', 'Handle late-arriving data']],
      ['Source integration', ['Extract from APIs, files and databases with schema checks']],
    ]),
  S('data-transformation-pipelines', 'Data Transformation and Pipeline Design', 'Transforming data with tested, modular pipelines.',
    { level: 'intermediate', depth: 3, hours: 15, prereq: ['etl-elt-architecture', 'advanced-sql'], refs: [] }, [
      ['Transformation design', ['!Build modular, tested SQL transformations (for example with dbt)', 'Document lineage']],
      ['Python transformations', ['Transform data with pandas or Spark DataFrames efficiently']],
      ['Pipeline quality', ['!Version and review pipeline code like application code']],
    ]),
  S('workflow-orchestration', 'Workflow Orchestration', 'Scheduling and coordinating data workflows.',
    { level: 'intermediate', depth: 3, hours: 12, prereq: ['etl-elt-architecture'], refs: [] }, [
      ['DAGs and scheduling', ['!Model dependencies as DAGs and schedule them', 'Use logical dates and backfills correctly']],
      ['Failure handling', ['!Configure retries, alerts and SLAs']],
      ['Operating orchestrators', ['Manage secrets, connections and environments']],
    ]),
  S('data-quality-testing', 'Data Quality, Testing and Validation', 'Catching bad data before it reaches decisions.',
    { level: 'intermediate', depth: 3, hours: 12, prereq: ['etl-elt-architecture'], refs: [] }, [
      ['Quality dimensions', ['!Test uniqueness, nulls, ranges, freshness and volume', 'Reconcile totals with source systems']],
      ['Contracts', ['!Define data contracts with producers']],
      ['Incident handling', ['Quarantine bad data and communicate impact']],
    ]),
  S('batch-streaming', 'Batch and Streaming Data Processing', 'Processing large and continuous data.',
    { level: 'advanced', depth: 3, hours: 20, prereq: ['data-transformation-pipelines'], refs: [] }, [
      ['Batch processing', ['!Process large data with Spark-style distributed computation']],
      ['Streaming', ['!Explain topics, partitions, consumer groups and delivery guarantees', 'Handle windowing and late events']],
      ['Choosing', ['Choose batch, micro-batch or streaming for a requirement']],
    ]),
  S('cloud-data-platforms', 'Cloud Storage and Data Platforms', 'Storing and querying data on cloud platforms cost-effectively.',
    { level: 'intermediate', depth: 3, hours: 15, prereq: ['etl-elt-architecture'], refs: ['tt-cloud-devops'] }, [
      ['Cloud storage', ['!Use object storage, file formats (Parquet) and partitioning', 'Apply lifecycle and storage classes']],
      ['Cloud warehouses', ['!Control warehouse cost through pruning and query design']],
      ['Access', ['Grant least-privilege access to data']],
    ]),
  S('data-reliability-recovery', 'Monitoring, Reliability and Recovery', 'Keeping pipelines healthy and recovering from failures.',
    { level: 'advanced', depth: 3, hours: 12, prereq: ['workflow-orchestration'], refs: [] }, [
      ['Monitoring', ['!Monitor freshness, volume and pipeline health with alerts']],
      ['Recovery', ['!Recover from failures with reruns, backfills and backups']],
      ['Incidents', ['Run data incidents and post-incident reviews']],
    ]),
  S('data-governance-security', 'Data Governance, Security and Optimization', 'Governing, securing and optimising data platforms.',
    { level: 'advanced', depth: 3, hours: 12, prereq: ['cloud-data-platforms'], refs: [] }, [
      ['Governance', ['!Classify data, maintain catalogs and ownership']],
      ['Security and privacy', ['!Protect personal data with masking, encryption and access controls']],
      ['Optimisation', ['Optimise storage and compute costs']],
    ]),
];
