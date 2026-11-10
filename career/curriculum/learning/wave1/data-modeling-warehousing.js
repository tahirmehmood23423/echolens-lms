'use strict';
const {course}=require('./warehouse-wave3-helper');
const specs=[
  {
    "id": "warehouse-grain",
    "comps": [
      "m1.c1"
    ],
    "title": "Declare fact grain before selecting dimensions",
    "intro": "A retailer wants revenue by product and store. An order contains several lines, so choosing one row per order would lose the product detail needed for the question.",
    "sections": [
      [
        "Model the business contract",
        "A fact table records a business process at an explicitly declared grain: for example one row per posted order line, not one row per customer. State that sentence before selecting columns. A key such as order_id plus line_number identifies the occurrence; a surrogate row identifier alone does not explain its business meaning. The primary key can enforce uniqueness while an additional business key prevents duplicate ingestion.",
        "Dimensions describe the context of the event, such as product, customer and store. Measures quantify it, such as units and line revenue. A header shipping charge belongs to the order grain. Copying it onto each line makes a sum overstate shipping unless an explicit allocation rule distributes it once. Keep header facts separately when allocation would be arbitrary or misleading."
      ],
      [
        "Work through the decision and its limits",
        "A star schema joins a central fact to descriptive dimensions through stable keys. Validate that every many-to-one dimension join preserves the fact row count and additive total. If a product code has two active dimension matches, a join can multiply rows even though each fact is unique. Diagnose the violated relationship before using DISTINCT, because distinct projected amounts can also collapse legitimate equal sales.",
        "The fixture joins two line facts to a unique product dictionary and totals the revenue. Then it deliberately fans each fact out over two category records to reveal inflation. It verifies ordinary Python list operations, not warehouse constraints or query optimization. In a real model document returns, tax, currencies and posting status as part of the grain and measure contract."
      ]
    ],
    "problem": "Declare fact grain before selecting dimensions using a synthetic fixture.",
    "steps": [
      "Declare the record grain, keys and time meaning in the fixture.",
      "Trace the transformation and compare it with the stated invariant.",
      "Inspect the output and explain the remaining production assumptions."
    ],
    "code": "lines=[('o1',1,'p1',100),('o1',2,'p2',50)]\nproducts={'p1':'books','p2':'games'}\njoined=[(products[p],v) for _,_,p,v in lines]\nprint(len(joined),sum(v for _,v in joined))\nprint(sum(v for _,_,_,v in lines for category in ['a','b']))",
    "expect": "2 150\n300",
    "limit": "Python checks finite synthetic cardinality and totals. It provides no PostgreSQL execution, warehouse optimizer, concurrent load or storage evidence.",
    "practice": [
      [
        "What does fact grain declare?",
        "The meaning of one row",
        "Number of stored columns",
        "Level of physical partitioning",
        "Index page density",
        "Grain specifies the business occurrence represented by each fact row."
      ],
      [
        "Which pair can identify an order line?",
        "Order id and line number",
        "Customer id and order date",
        "Product code and store id",
        "Store id and currency",
        "The order and line number jointly distinguish a line occurrence within an order."
      ],
      [
        "What describes a sale rather than measures it?",
        "Product category",
        "Revenue per unit",
        "Recognized tax amount",
        "Quantity returned",
        "Category is descriptive dimensional context, whereas the other choices quantify the sale."
      ],
      [
        "A shipping fee is repeated on every order line. What happens when summed?",
        "It can be overstated",
        "It is always counted once",
        "It becomes a line-level allocation",
        "It is excluded by the foreign key",
        "A header amount repeated across lines is counted once per line unless allocation or separate aggregation prevents it."
      ],
      [
        "A product join doubles the sales rows. Which condition should be checked?",
        "Dimension key uniqueness",
        "Fact row sort order",
        "Fact numeric precision",
        "Dimension label completeness",
        "A supposedly many-to-one join multiplies facts when the dimension has multiple matching rows."
      ],
      [
        "A team uses DISTINCT revenue to repair duplicated joins. What can it remove?",
        "Legitimate equal amounts",
        "Duplicated business events",
        "Unmatched dimensions",
        "Pending orders",
        "Two different sales can have the same amount, so deduplicating the amount can discard valid facts."
      ],
      [
        "A product report needs line-level discounts but the fact is order-grain. What must change?",
        "Grain or source detail",
        "Storage partition",
        "Aggregation function",
        "Surrogate key type",
        "Order aggregates do not preserve the line-specific information required for the question."
      ]
    ],
    "formal": [
      [
        "What is an additive measure?",
        "A summable measure",
        "Measure always averaged",
        "Measure used only as a key",
        "Measure valid only as text",
        "Additivity depends on whether summing across the chosen dimensions preserves the measure meaning."
      ],
      [
        "What does a surrogate fact id fail to state alone?",
        "Business row meaning",
        "Physical uniqueness enforcement",
        "Stored row identifier",
        "Allocated integer sequence",
        "A surrogate identifier can distinguish rows without documenting which business occurrence they represent."
      ],
      [
        "What is a star schema centered on?",
        "A fact table",
        "Dimension hierarchy",
        "Source log position",
        "Natural-key registry",
        "The fact records the process and links to descriptive dimensions."
      ],
      [
        "A store records one sale with two items and needs product revenue. Which grain supports it directly?",
        "One posted sale line",
        "One order header",
        "One product per month",
        "One store per day",
        "The sale line retains the product-specific revenue needed for aggregation."
      ],
      [
        "An order fact and line fact are joined on order id before both amounts are summed. What threatens the order measure?",
        "Repeated header values",
        "Auto deduplicated headers",
        "Lost product descriptions",
        "Unmatched currency rates",
        "Each matching line repeats the order amount, so aggregate header measures separately or allocate them explicitly."
      ],
      [
        "A fact has unique line ids but its dimension has duplicate product keys. Is the total safe after joining?",
        "No; test dimension keys",
        "Yes, only fact keys matter",
        "Yes, keys prevent any fanout",
        "When revenue is decimal",
        "Join cardinality depends on matching rows on both sides, not just fact uniqueness."
      ],
      [
        "A refund is recorded as negative revenue at the same event grain. Which contract detail still matters?",
        "Posting and return policy",
        "Partition naming policy",
        "Primary-key integer width",
        "Source cursor encoding",
        "The metric must define when returns enter the eligible population and how they affect recognized revenue."
      ],
      [
        "A dashboard mixes euros and dollars in a sum. Which addition is necessary?",
        "Currency policy",
        "Wider decimal type",
        "Distinct customer count",
        "Common order status only",
        "A common valuation basis or separate currency totals are required for a meaningful sum."
      ],
      [
        "An analyst aggregates line facts before attaching one unique category per product. When can that be valid?",
        "When join keys remain",
        "Even after dropping product ids",
        "Whenever a CTE is used",
        "By adding DISTINCT",
        "Early aggregation is valid when it retains the keys and grain needed for the subsequent dimensional relationship."
      ],
      [
        "A fact load passes a row-count test but revenue triples after enrichment. What test is missing?",
        "Join measure checks",
        "Total source row counts",
        "Dimension nonnull tests",
        "Maximum-id comparison",
        "Comparing additive measures before and after joins detects fanout that structural row checks at load time miss."
      ]
    ],
    "lang": "python",
    "mistakes": [
      "Adding fields before declaring grain.",
      "Summing header measures after a one-to-many join."
    ],
    "takeaways": [
      "Write one sentence describing a fact row.",
      "Test both key uniqueness and measure preservation."
    ]
  },
  {
    "id": "warehouse-scd",
    "comps": [
      "m1.c2"
    ],
    "title": "Preserve customer history with slowly changing dimensions",
    "intro": "A customer moves regions in July. Finance needs both current customer segmentation and the region that applied when a March sale occurred.",
    "sections": [
      [
        "Model the business contract",
        "A type 1 dimension update overwrites an attribute and intentionally restates historical views using its current value. This suits corrections where preserving the old typo has no analytical value. A type 2 dimension inserts a new version with a new surrogate key and an effective interval. The durable business key connects versions belonging to the same real entity.",
        "Choose intervals that include the start and exclude the end: valid_from <= event_time < valid_to. Adjacent versions can then meet at a boundary without both matching it. Validate nonoverlap per business key, at most one open-ended current version, and agreement between current flags and end dates. A surrogate key is a version identifier, not a replacement for these temporal constraints."
      ],
      [
        "Work through the decision and its limits",
        "Facts can store the dimension surrogate key resolved using event time at ingestion. Alternatively a temporal join resolves history during transformation; both require a trustworthy time basis. A late March sale arriving in August belongs to the March version. A retroactive correction to the effective date can require rebuilding affected fact assignments under a documented restatement policy.",
        "The fixture resolves three event dates around an adjacent boundary and asserts exactly one match. String comparison is valid only because these dates use the same zero-padded ISO calendar format; production timestamps need explicit timezone and precision handling. SQLite or a local Python check cannot establish a warehouse exclusion constraint or correctness under concurrent dimension writers."
      ]
    ],
    "problem": "Preserve customer history with slowly changing dimensions using a synthetic fixture.",
    "steps": [
      "Declare the record grain, keys and time meaning in the fixture.",
      "Trace the transformation and compare it with the stated invariant.",
      "Inspect the output and explain the remaining production assumptions."
    ],
    "code": "versions=[(11,'2026-01-01','2026-07-01','north'),(12,'2026-07-01','9999-12-31','south')]\nfor t in ['2026-03-15','2026-07-01','2026-08-01']:\n matches=[(key,region) for key,start,end,region in versions if start<=t<end]\n assert len(matches)==1\n print(*matches[0])",
    "expect": "11 north\n12 south\n12 south",
    "limit": "Python compares uniformly formatted ISO dates and checks exactly one match. This is not a native PostgreSQL range/exclusion or warehouse concurrency test.",
    "practice": [
      [
        "What does a type 1 update do?",
        "Overwrites an attribute",
        "Creates a new history version",
        "Always preserves prior values",
        "Allocates a new event id",
        "Type 1 intentionally replaces the stored value without retaining prior attribute history in that dimension."
      ],
      [
        "What distinguishes a type 2 version?",
        "Version key and interval",
        "New business entity each time",
        "Overwritten current value",
        "Partition for every report",
        "Type 2 retains historical versions with identifiers and time validity."
      ],
      [
        "Which interval avoids double matches at adjacent boundaries?",
        "Half-open intervals",
        "Both endpoints inclusive",
        "Both endpoints exclusive",
        "End inclusive and start exclusive",
        "Half-open intervals let neighboring versions meet without overlap at the shared instant."
      ],
      [
        "A March sale arrives after a July move. Which region should an as-of report use?",
        "The March-valid region",
        "August-valid region",
        "Latest surrogate key",
        "First loaded region",
        "Event-time history requires the dimension version valid when the sale occurred."
      ],
      [
        "Two versions of one customer overlap for a week. What is the risk?",
        "Ambiguous as-of matches",
        "Certain missing match",
        "Certain corrected history",
        "Automatic type 1 update",
        "An event in the overlap can match more than one version."
      ],
      [
        "A spelling correction should restate every report. Which treatment fits?",
        "Type 1 overwrite",
        "Type 2 for every spelling change",
        "New fact event for the typo",
        "New customer business key",
        "An intentional current-value correction can use type 1 when historical spelling has no required meaning."
      ],
      [
        "A move date is corrected retroactively. What may need recomputation?",
        "Fact-version assignments",
        "Current customer labels",
        "Future source cursors",
        "Product allocations",
        "Changing validity intervals can change which dimension version historical events should reference."
      ]
    ],
    "formal": [
      [
        "What does a dimension business key connect?",
        "Versions of one entity",
        "Unrelated customer entities",
        "Separate partitions",
        "Independent sources only",
        "The business key links separate version rows belonging to the same real entity."
      ],
      [
        "What is a current flag intended to indicate?",
        "The active version",
        "Row with maximum revenue",
        "All row loaded this month",
        "Earliest known version",
        "A current flag describes version status and should agree with the temporal contract."
      ],
      [
        "What is the purpose of nonoverlap validation?",
        "At most one as-of match",
        "All versions have no gaps",
        "All customer has sales",
        "Newest key is current",
        "Overlapping intervals can make a temporal lookup ambiguous."
      ],
      [
        "An event occurs exactly at the July version start. Under half-open intervals which row applies?",
        "The new July version",
        "Both adjacent versions",
        "January version",
        "Neither adjacent version",
        "The new interval includes its start while the previous interval excludes its end."
      ],
      [
        "A customer has two open-ended current rows. What should the model reject?",
        "Conflicting current rows",
        "All closed historical versions",
        "All late-arriving sale",
        "Customer business key",
        "Two current rows violate the intended single active version contract."
      ],
      [
        "A query uses the latest dimension row for all sales. What history does it produce?",
        "Current-value history",
        "Certain event-time attributes",
        "Original source snapshot",
        "Immutable sales-event history",
        "Joining only the latest row attaches current descriptions to historical facts."
      ],
      [
        "A March event is joined using its August ingestion time. What goes wrong?",
        "Wrong version selection",
        "Ingestion job must fail",
        "Sale becomes a new customer",
        "Old version is deleted",
        "Arrival time and event time differ, so ingestion-time lookup can misassign history."
      ],
      [
        "Two source timestamps use different local zones. What is required before comparison?",
        "A shared time basis",
        "Identical display date text only",
        "Database zone only",
        "Descending surrogate key order",
        "As-of boundaries require a consistent timezone and precision contract."
      ],
      [
        "A team adds surrogate ids but no date checks. What remains unproven?",
        "Valid version intervals",
        "If integer ids are unique",
        "If labels are nonempty",
        "If natural keys exist",
        "Surrogate keys identify rows but do not ensure nonoverlap, continuity or correct effective dates."
      ],
      [
        "Finance wants both current-region and sale-time-region views. What should the semantic contract expose?",
        "Two labeled time views",
        "Single current-only field",
        "One unlabeled as-of join",
        "Always selecting the largest id",
        "Users need to know whether grouping restates history or uses the event-valid version."
      ]
    ],
    "lang": "python",
    "mistakes": [
      "Using ingestion time for historical assignment.",
      "Assuming a new surrogate key prevents overlapping intervals."
    ],
    "takeaways": [
      "Choose update policy by business meaning.",
      "Test validity boundaries explicitly."
    ]
  },
  {
    "id": "warehouse-fact-types",
    "comps": [
      "m1.c1",
      "m1.c2"
    ],
    "title": "Choose transaction, snapshot and allocation models",
    "intro": "A subscription service needs payment events, daily balances and time-to-activation. Each question describes a different kind of fact and needs a distinct aggregation contract.",
    "sections": [
      [
        "Model the business contract",
        "A transaction fact represents an occurrence such as a payment or refund. A periodic snapshot represents a state at a regular time, such as the closing account balance each day. An accumulating snapshot represents a process instance with milestones updated as the process progresses. These models answer different questions even if they share account and date dimensions.",
        "A balance is usually additive across accounts at a common time but not across daily snapshots. Summing Monday and Tuesday closing balances does not give Tuesday assets. Ratios such as conversion rate are also not generally additive: retain the numerator and denominator so that a combined rate is computed from combined components. Averaging percentages without weights changes the estimand."
      ],
      [
        "Work through the decision and its limits",
        "A many-to-many bridge can connect a sale to multiple campaigns. Without a declared attribution rule, summing through the bridge counts the full sale once per campaign. Allocation weights that sum to one per sale support an allocated measure, but the chosen rule is a business assumption. A full-credit multi-touch metric can also be legitimate if clearly labeled and never confused with total revenue.",
        "The example contrasts summing daily balances with selecting the latest closing state and distributes one sale using validated weights. The arithmetic proves conservation for the supplied weights only. It does not prove the attribution rule estimates causal campaign impact. Missing snapshot dates, reopened process instances and partially arrived milestones require explicit operational policies."
      ]
    ],
    "problem": "Choose transaction, snapshot and allocation models using a synthetic fixture.",
    "steps": [
      "Declare the record grain, keys and time meaning in the fixture.",
      "Trace the transformation and compare it with the stated invariant.",
      "Inspect the output and explain the remaining production assumptions."
    ],
    "code": "balances=[('2026-01-01',100),('2026-01-02',120)]\nprint(sum(v for _,v in balances),max(balances)[1])\nweights={'email':0.25,'search':0.75}\nassert sum(weights.values())==1\nprint({k:int(200*w) for k,w in weights.items()})",
    "expect": "220 120\n{'email': 50, 'search': 150}",
    "limit": "Python validates finite synthetic snapshots and allocation arithmetic. No warehouse engine, native PostgreSQL behavior, causal attribution or scale performance is established.",
    "practice": [
      [
        "What does a periodic snapshot measure?",
        "Regularly sampled state",
        "Discrete payment occurrence",
        "Continuously updated process only",
        "Change-log position",
        "A periodic snapshot records the state at a defined recurring point in time."
      ],
      [
        "What is a balance usually across time?",
        "Semi-additive",
        "Fully additive across all dates",
        "Nonadditive across every entity",
        "Fact-table business key",
        "Balances can be added across compatible entities at one time but summing them across times changes their meaning."
      ],
      [
        "What does an accumulating snapshot track?",
        "Process milestones",
        "Independent transactions",
        "Fixed-period balances",
        "Dimension name changes",
        "It represents a process instance whose milestone fields can be filled or revised as the process progresses."
      ],
      [
        "A bank sums closing balances across every day. What is the likely error?",
        "Adding states across time",
        "Using a wrong currency symbol",
        "Grouping by the account key",
        "Filtering to one common date",
        "Daily balances represent repeated states and their sum is not the final balance."
      ],
      [
        "A campaign bridge assigns full revenue to two campaigns. What does its sum represent?",
        "Multiple credited revenue",
        "Unique company revenue total",
        "Deduplicated sales total",
        "Verified causal effect",
        "Full credit per bridge match counts a sale multiple times, so the resulting metric needs a distinct interpretation."
      ],
      [
        "Two stores have different visitor counts. How should their conversion rates combine?",
        "Total converts / visitors",
        "Average store percentages",
        "Sum store percentages",
        "Select the median store rate",
        "Combining underlying counts correctly weights each store by its eligible visitors."
      ],
      [
        "Campaign weights sum to 1.2 for one sale. Which check failed?",
        "Allocation conservation",
        "Period-date completeness",
        "Bridge-key spelling",
        "Snapshot milestone order",
        "Weights above one allocate more value than the underlying sale."
      ]
    ],
    "formal": [
      [
        "Which fact best records a discrete payment?",
        "A transaction fact",
        "Periodic balance alone",
        "Account description alone",
        "Activation milestone alone",
        "A transaction fact preserves each payment occurrence at its declared event grain."
      ],
      [
        "What should a reusable conversion metric retain?",
        "Numerator and denominator",
        "Rounded percentage",
        "Segment average",
        "Current rate maximum",
        "Components allow correct aggregation across groups and protect against unweighted averages."
      ],
      [
        "What is a bridge table used for here?",
        "Many-to-many links",
        "One-to-one relationship only",
        "Fact key generator",
        "Date partition boundary",
        "The bridge links one fact or dimension member to multiple related members."
      ],
      [
        "A support case has opened, assigned and resolved times. Which fact design can expose cycle time?",
        "Accumulating snapshot",
        "Payment-only transaction table",
        "Product type 1 dimension",
        "Campaign attribution bridge",
        "Milestone timestamps on the process instance support duration calculations and incomplete-stage visibility."
      ],
      [
        "A dashboard needs assets at month end. Which snapshot selection is appropriate?",
        "The month-end state",
        "Sum of daily balances",
        "Maximum daily balance",
        "Average without labeling",
        "An end-of-period metric must select the state corresponding to the reporting boundary under a documented completeness policy."
      ],
      [
        "One ad gets 70% and another 30% credit for a sale. What is still a judgment?",
        "The attribution policy",
        "That the weights sum to one",
        "That allocated value is conserved",
        "That each campaign has a key",
        "Conserving value does not prove that chosen shares represent causal contribution."
      ],
      [
        "An activation snapshot has no completion time yet. How should duration reporting handle it?",
        "An open-process policy",
        "Treat missing as zero duration",
        "Exclude active cases silently",
        "Use ingestion time as completion",
        "Open processes are censored or incomplete and need an explicit reporting policy."
      ],
      [
        "A ratio is stored only after rounding to whole percent. What can be lost?",
        "Accurate regrouping",
        "Dimension membership",
        "Fact row identifiers",
        "Selected date window",
        "Rounded ratios omit the component counts needed for accurate aggregation at another level."
      ],
      [
        "A daily snapshot is missing for a holiday. Which assumption requires review?",
        "Carry-forward validity",
        "If date sorting works",
        "If account ids are strings",
        "If balances are numeric",
        "Using a prior state is an explicit imputation policy and may misstate a changed balance."
      ],
      [
        "Revenue allocated through a bridge matches source totals. What has that test established?",
        "Allocation conservation",
        "Causal campaign contribution",
        "Complete source capture",
        "Production query performance",
        "The check verifies allocation arithmetic and does not validate the attribution assumptions or the entire production system."
      ]
    ],
    "lang": "python",
    "mistakes": [
      "Summing balances over dates.",
      "Averaging subgroup percentages without denominators."
    ],
    "takeaways": [
      "Choose a fact type for each question.",
      "Make allocation and ratio semantics explicit."
    ]
  },
  {
    "id": "warehouse-storage",
    "comps": [
      "m2.c1"
    ],
    "title": "Match OLTP, warehouse, lake and lakehouse to workload",
    "intro": "An online marketplace serves individual order updates while analysts scan months of events. A single storage label does not decide whether these workloads can safely share resources.",
    "sections": [
      [
        "Model the business contract",
        "OLTP systems optimize operational transactions such as creating an order and reserving stock. Their designs commonly prioritize short selective operations, constraints and concurrency. An analytical warehouse organizes integrated, historical data for scans and aggregates. Copying data into a warehouse introduces freshness and reconciliation concerns; it does not make the operational source less authoritative for accepting a purchase.",
        "A data lake stores files or objects in flexible formats, often retaining raw source material. A lakehouse adds table-management capabilities over object storage, such as snapshots, schema enforcement and transactional table updates depending on the implementation. Object storage alone does not guarantee atomic multi-file publication, row-level transactions or a reliable catalog. Verify each technology\u2019s actual capabilities rather than inferring them from its category."
      ],
      [
        "Work through the decision and its limits",
        "Data architecture choices trade query latency, freshness, governance, cost and operational responsibility. A retailer may retain immutable source exports in a restricted raw zone, transform them into documented analytical tables and expose governed marts to analysts. Clear ownership and retention matter at every stage: raw does not mean universally accessible, and schema flexibility does not remove the need for validation.",
        "The fixture scores explicit workload requirements against declared capabilities. It is a decision aid with supplied assumptions, not a product benchmark. A real selection should test representative scans, concurrency and recovery, including cloud data-transfer and storage costs. Neither SQLite nor a PostgreSQL engine compiled to WebAssembly reproduces a distributed warehouse or object-store transaction protocol."
      ]
    ],
    "problem": "Match OLTP, warehouse, lake and lakehouse to workload using a synthetic fixture.",
    "steps": [
      "Declare the record grain, keys and time meaning in the fixture.",
      "Trace the transformation and compare it with the stated invariant.",
      "Inspect the output and explain the remaining production assumptions."
    ],
    "code": "requirements={'transactions','point_lookup'}\ncapabilities={'operational':{'transactions','point_lookup'},'scan_mart':{'historical_scan','aggregation'}}\nfor name,caps in capabilities.items():\n print(name,requirements<=caps)",
    "expect": "operational True\nscan_mart False",
    "limit": "Python evaluates supplied capability sets. This is no benchmark or verification of vendor guarantees, distributed systems, object storage, PostgreSQL or WASM.",
    "practice": [
      [
        "Which workload is characteristic of OLTP?",
        "Short transactions",
        "Repeated historical full scans",
        "Daily object uploads",
        "Monthly aggregate refreshes",
        "OLTP typically serves selective concurrent operational reads and writes."
      ],
      [
        "What is a warehouse principally organized for?",
        "Integrated analytics",
        "Operational row acceptance",
        "Append-file retention",
        "Point-key account updates",
        "Warehouses support analytical scans and historical integration across sources."
      ],
      [
        "Does object storage alone guarantee table transactions?",
        "No",
        "Yes if objects use Parquet",
        "Yes if filenames are unique",
        "Yes if bucket versioning exists",
        "Atomic table behavior needs additional protocols and metadata beyond storing independent objects."
      ],
      [
        "A checkout competes with a year-long analytics scan. What concern motivates separation?",
        "Resource contention",
        "Incompatible names",
        "Different report labels",
        "Calendar-date formatting",
        "Large analytical work can consume resources needed for latency-sensitive transactions."
      ],
      [
        "A team calls its raw bucket a lakehouse without table metadata. What is unproven?",
        "Table-level transactions",
        "Existence of stored objects",
        "Ability to list files",
        "Ability to download a file",
        "Lakehouse claims require actual table capabilities, not the presence of object storage alone."
      ],
      [
        "An analyst needs customer histories but the source keeps current rows only. What is needed?",
        "History capture",
        "Faster current-state scan",
        "New source index",
        "Wider warehouse column",
        "An analytical store cannot reconstruct overwritten history that was never captured."
      ],
      [
        "A raw zone contains personal data. Which access policy applies?",
        "Least-privilege access",
        "Public raw-zone browsing",
        "Access based only on filename",
        "No retention because data is raw",
        "Raw storage still requires ownership, access controls and retention appropriate to the data."
      ]
    ],
    "formal": [
      [
        "What does analytical freshness describe?",
        "Source-to-usable lag",
        "Age of the server hardware",
        "Report rendering duration",
        "Source row width",
        "Freshness measures the time lag before source changes become available in the analytical product."
      ],
      [
        "What is a lake commonly built on?",
        "File or object storage",
        "Transactional row store",
        "Browser key-value cache",
        "BI semantic model",
        "Lakes commonly preserve data in files or objects, with additional services supplying catalog and query capabilities."
      ],
      [
        "What must a platform comparison specify?",
        "Workload and guarantees",
        "Advertised feature count",
        "Maximum storage capacity",
        "Newest platform brand",
        "Requirements make capability and cost comparisons meaningful."
      ],
      [
        "A retailer needs payment authorization in milliseconds and daily revenue scans. Which design is plausible?",
        "Separate workload stores",
        "Daily files for checkout requests",
        "All annual scan on checkout",
        "Removing operational constraints",
        "Separate stores or isolated resources can fit distinct latency and analytical needs while requiring synchronization."
      ],
      [
        "A vendor promises transactions on lake tables. What should engineering verify?",
        "Actual commit guarantees",
        "File format name",
        "Storage-region label",
        "Query editor features",
        "Actual table protocol and engine behavior determine transactional guarantees."
      ],
      [
        "A warehouse refresh is delayed by six hours. Which consumer contract is affected?",
        "Data freshness",
        "Query presentation order",
        "Primary-key integer width",
        "Sales-currency precision",
        "Refresh lag affects how current the analytics are relative to source events."
      ],
      [
        "A cost estimate includes compute but omits data transfer. What is missing?",
        "Platform operating cost",
        "Required foreign-key column",
        "Semantic relationship edge",
        "Query cardinality estimate",
        "Storage, transfer and service charges can alter the total cost of an analytical platform."
      ],
      [
        "A team stores raw files forever without ownership. What is the architectural gap?",
        "Retention and stewardship",
        "SQL formatting conventions",
        "Dashboard deployment plans",
        "Key integer size",
        "Raw preservation needs accountable ownership and policies for lawful and useful retention."
      ],
      [
        "A local SQLite scan finishes instantly on ten rows. What conclusion is defensible?",
        "Local fixture execution",
        "Cloud SLA is satisfied",
        "Concurrent scans will be fast",
        "Object transfer will be free",
        "A tiny local execution does not establish production throughput, concurrency or cloud economics."
      ],
      [
        "A mart reports refunds differently from the source finance ledger. Which reconciliation is required?",
        "Definition reconciliation",
        "Identical table row order",
        "Matching storage formats",
        "Identical names",
        "Integrated analytics must explain semantic and population differences rather than assuming storage choice guarantees agreement."
      ]
    ],
    "lang": "python",
    "mistakes": [
      "Selecting a platform by category alone.",
      "Treating raw storage as exempt from governance."
    ],
    "takeaways": [
      "Start with workload contracts.",
      "Verify guarantees and total operating cost."
    ]
  },
  {
    "id": "warehouse-partitions",
    "comps": [
      "m2.c2"
    ],
    "title": "Design partitions around pruning and lifecycle",
    "intro": "A freight warehouse retains five years of shipment events, while most dashboards read the last week. Date partitioning can reduce scanned data only when queries expose usable date constraints.",
    "sections": [
      [
        "Model the business contract",
        "Partitioning divides a logical table into physical pieces using a partition key and boundaries. Range partitioning by event date supports lifecycle operations and can permit partition pruning for compatible predicates. Boundaries should be explicit and nonoverlapping. A daily partition is not inherently best: tiny partitions create planning and metadata overhead, while very large partitions can reduce pruning and operational flexibility.",
        "Use predicates that match the key and the engine\u2019s supported pruning rules. A half-open interval such as event_date >= start AND event_date < end expresses a reporting window clearly. Casting or applying a function to a partition key may inhibit pruning depending on engine and expression support. Check the actual plan and scanned bytes, because a logically equivalent filter does not guarantee identical physical access."
      ],
      [
        "Work through the decision and its limits",
        "Choose event date versus ingestion date deliberately. Event-date partitions align many business queries but late events may reopen older partitions. Ingestion-date partitions simplify arrival operations but a business-date query may touch more partitions unless additional structures help. Retention deletion must respect correction, audit and legal requirements; deleting old partitions can discard still-needed restatement inputs.",
        "The example models interval intersection to identify partitions needed for a one-week window. It proves the boundary selection arithmetic for a small calendar only. A warehouse may prune differently because of statistics, parameterization and physical layout. Native PostgreSQL partition plans require EXPLAIN against the actual engine; a Python model or WASM experiment does not establish production I/O savings."
      ]
    ],
    "problem": "Design partitions around pruning and lifecycle using a synthetic fixture.",
    "steps": [
      "Declare the record grain, keys and time meaning in the fixture.",
      "Trace the transformation and compare it with the stated invariant.",
      "Inspect the output and explain the remaining production assumptions."
    ],
    "code": "parts=[('jan',1,32),('feb',32,60),('mar',60,91)]\nstart,end=35,42\nselected=[name for name,lo,hi in parts if lo<end and start<hi]\nprint(selected)\nprint(32<=35<60)",
    "expect": "['feb']\nTrue",
    "limit": "Python models date-interval intersection only. It does not execute partitioned SQL or establish PostgreSQL, WASM or distributed warehouse optimizer behavior.",
    "practice": [
      [
        "What is partition pruning?",
        "Skipping unused ranges",
        "Dropping expired partitions",
        "Sorting all partition rows",
        "Compressing every partition",
        "Pruning avoids reading partitions that cannot satisfy usable query constraints."
      ],
      [
        "Which window avoids overlapping reporting boundaries?",
        "Half-open intervals",
        "Both endpoints inclusive",
        "Day label without bounds",
        "Inclusive end date",
        "Half-open windows allow adjacent periods without double-counting the shared boundary."
      ],
      [
        "What is a risk of many tiny partitions?",
        "Metadata overhead",
        "Certain unique event keys",
        "Auto scan elimination",
        "Lower planning cost always",
        "Excessively fine partitioning adds management and planning work and can hurt performance."
      ],
      [
        "A week query scans five years despite date partitions. What should be inspected?",
        "Predicates and plan",
        "Partition object names",
        "Query result row count",
        "Date display format",
        "Pruning depends on predicates and engine behavior, which the plan and scan evidence reveal."
      ],
      [
        "A late January event arrives in March. What can event-date partitioning require?",
        "Reopening old partitions",
        "Always storing it in March",
        "Always dropping January",
        "Ignoring its original event time",
        "Event-time placement directs late data to its business period even after that partition was initially loaded."
      ],
      [
        "An ingestion-date table is queried by business date only. What is a possible consequence?",
        "Wider arrival scans",
        "Certain one-partition access",
        "Auto event-date ordering",
        "Certain late-data rejection",
        "Business dates may span many ingestion dates, limiting pruning by arrival partitions."
      ],
      [
        "A retention job drops partitions needed for financial restatement. What was missed?",
        "Retention obligations",
        "Pruning expression",
        "Physical sort order",
        "Index naming rule",
        "Lifecycle actions must preserve data required for audits, corrections and mandated retention."
      ]
    ],
    "formal": [
      [
        "What defines a range partition?",
        "A key interval",
        "Shared column alias",
        "Random row assignment",
        "Dashboard group title",
        "A range partition contains values within a specified interval of the partition key."
      ],
      [
        "What should verify a pruning claim?",
        "Target plan and scans",
        "Partition names",
        "Logical schema diagram",
        "Count of tables",
        "Physical execution evidence establishes whether the engine actually eliminates partitions."
      ],
      [
        "Why can partition granularity matter?",
        "Pruning/overhead tradeoff",
        "It guarantees selective filters",
        "It eliminates all source delays",
        "It makes states fully additive",
        "Finer partitions can improve selectivity while increasing metadata, planning and lifecycle costs."
      ],
      [
        "An event occurs at a monthly upper boundary. Under half-open ranges where does it belong?",
        "The next month partition",
        "Both month partitions",
        "Previous month only",
        "Default partition always",
        "The prior partition excludes the upper boundary and the next includes its start."
      ],
      [
        "A filter wraps the date key in an unsupported function. What may be lost?",
        "Partition elimination",
        "Primary-key validation",
        "Business-date meaning",
        "All matching fact row",
        "The optimizer may be unable to infer the partition range from that expression."
      ],
      [
        "A daily table creates thousands of nearly empty partitions. Which alternative deserves testing?",
        "Coarser partitions",
        "Hourly partition interval",
        "Removing all query filters",
        "Extra empty partition",
        "Coarser partitions can lower management overhead while retaining enough pruning for the workload."
      ],
      [
        "A team chooses ingestion time to simplify append jobs. What must business-date reports account for?",
        "Late arrival spread",
        "File compression",
        "Business-key width",
        "Dashboard locale",
        "Business events can arrive in many ingestion windows, affecting scans and completeness."
      ],
      [
        "An old period is marked immutable before the correction window closes. What process is missing?",
        "Late-correction policy",
        "Another index comment",
        "New partition alias",
        "Result-row sorting",
        "Operational immutability must align with legitimate correction and restatement needs."
      ],
      [
        "A benchmark shows fewer partitions but equal bytes scanned. What should the engineer conclude?",
        "No proven byte savings",
        "All query is faster",
        "All storage was eliminated",
        "Partitioning never helps",
        "Meaningful performance evidence includes actual data read and elapsed behavior, not only object counts."
      ],
      [
        "A warehouse migrates a partitioned model between engines. What requires revalidation?",
        "Target pruning behavior",
        "Query aliases",
        "Report labels",
        "Source comments",
        "Optimizer rules and partition implementation differ, so source-engine evidence does not transfer automatically."
      ]
    ],
    "lang": "python",
    "mistakes": [
      "Assuming all date filters prune.",
      "Choosing partition size without workload evidence."
    ],
    "takeaways": [
      "Inspect real scan evidence.",
      "Align lifecycle and late-data policy."
    ]
  },
  {
    "id": "warehouse-cluster",
    "comps": [
      "m2.c1",
      "m2.c2"
    ],
    "title": "Use physical locality without promising a row order",
    "intro": "A customer-support analytics table is partitioned by month, but investigators usually filter by account within that month. Physical clustering can improve locality while still requiring measured engine-specific evidence.",
    "sections": [
      [
        "Model the business contract",
        "Clustering groups rows with related key values in physical storage or metadata-managed blocks. In columnar warehouses it can help min/max metadata eliminate blocks for selective predicates. It is distinct from logical partitioning, and it does not make a key unique. The effectiveness depends on data distribution, update patterns and the engine\u2019s reclustering or maintenance behavior.",
        "Choose clustering keys from frequent selective filters and useful combinations, while accounting for their order and cardinality. A key with almost no selectivity may provide little benefit; a high-cardinality key can help point-like filters but may not suit every engine. Repeated writes can degrade locality and trigger maintenance cost. Compare workload-level benefit against that cost rather than maximizing the number of keys."
      ],
      [
        "Work through the decision and its limits",
        "PostgreSQL CLUSTER physically reorders a table using an index at that time and is not the same as continuously maintained warehouse clustering. Later modifications need not preserve that order. An SQL query without ORDER BY has no guaranteed presentation order, even when the table was recently clustered. Indexes, partitioning and clustering are separate mechanisms whose names can differ across vendors.",
        "The fixture computes per-block min/max account keys for grouped and interleaved layouts and counts candidate blocks for an equality filter. It deliberately omits compression, caches, distribution and concurrent writers. The lower candidate count illustrates a locality mechanism; it is not measured bytes or latency and cannot support a PostgreSQL or warehouse performance promise."
      ]
    ],
    "problem": "Use physical locality without promising a row order using a synthetic fixture.",
    "steps": [
      "Declare the record grain, keys and time meaning in the fixture.",
      "Trace the transformation and compare it with the stated invariant.",
      "Inspect the output and explain the remaining production assumptions."
    ],
    "code": "layouts={'grouped':[[1,1,2],[8,8,9]],'mixed':[[1,8,2],[8,1,9]]}\nkey=1\nfor name,blocks in layouts.items():\n print(name,sum(min(b)<=key<=max(b) for b in blocks))",
    "expect": "grouped 1\nmixed 2",
    "limit": "Python models block-bound filtering. It performs no physical reorganization, PostgreSQL CLUSTER, WASM engine execution or warehouse benchmark.",
    "practice": [
      [
        "What can clustering improve?",
        "Filter locality",
        "Certain unique keys",
        "Certain output ordering",
        "Certain low ingestion cost",
        "Grouping related values can let storage metadata skip unrelated blocks."
      ],
      [
        "Does physical clustering replace ORDER BY?",
        "No",
        "Yes after CLUSTER",
        "Yes with a primary key",
        "Yes within one partition",
        "SQL presentation order requires an explicit ordering clause."
      ],
      [
        "What does block min/max metadata support?",
        "Conservative pruning",
        "Exact membership proof",
        "Source-event authentication",
        "Business-key enforcement",
        "A block outside the filter range can be excluded using its value bounds."
      ],
      [
        "An account filter touches most blocks despite clustering. What may be weak?",
        "Locality or selectivity",
        "Incomplete chart title",
        "Identifier text width",
        "Missing customer labels",
        "Poor grouping or an unselective filter can limit block elimination."
      ],
      [
        "A team assumes PostgreSQL CLUSTER keeps every later insert ordered. What is wrong?",
        "No continuous reordering",
        "New rows always preserve it",
        "CLUSTER creates no layout",
        "CLUSTER adds ORDER BY",
        "PostgreSQL CLUSTER reorganizes existing storage at execution time and later writes need not preserve it."
      ],
      [
        "A warehouse reclusters heavily after each load. What must the cost review include?",
        "Maintenance cost",
        "Initial query cost",
        "Raw input row count",
        "Partition label length",
        "Ongoing maintenance can offset query savings and belongs in the workload cost model."
      ],
      [
        "A result happened to arrive sorted in a test. What makes display order reliable?",
        "An explicit ORDER BY",
        "Clustered index",
        "Repeated successful tests",
        "Key",
        "An observed physical scan sequence is not an SQL ordering contract."
      ]
    ],
    "formal": [
      [
        "What is clustering distinct from?",
        "Logical partitioning",
        "Primary-key uniqueness",
        "Query result ordering",
        "Source metric ownership",
        "Partition boundaries and within-storage locality are separate physical design mechanisms."
      ],
      [
        "What can change clustering effectiveness over time?",
        "Writes and maintenance",
        "Column display labels",
        "Report sort direction",
        "Alias capitalization",
        "New writes and reclustering alter how related values are physically grouped."
      ],
      [
        "What is a workload-based key choice grounded in?",
        "Frequent useful filters",
        "High cardinality by itself",
        "Alphabetical key order",
        "Longest key width",
        "Filter selectivity and frequency determine whether physical locality can save work."
      ],
      [
        "Two blocks both have min 1 and max 9 for an account=1 filter. What does min/max alone imply?",
        "Both remain candidates",
        "Both certainly contain 1",
        "Both can be skipped",
        "Exactly one must contain 1",
        "Bounds cannot prove internal membership, so overlapping blocks must remain possible candidates."
      ],
      [
        "An engine skips blocks by date already. Why test an additional account key?",
        "Limited extra benefit",
        "It always doubles query speed",
        "It guarantees uniqueness",
        "It replaces all partitions",
        "Physical design choices interact, so assess the extra benefit under actual filtered workloads."
      ],
      [
        "A high-cardinality key improves one dashboard but hurts load costs. What comparison is needed?",
        "Workload-wide cost",
        "Fastest point query",
        "Initial table size",
        "Maximum concurrency",
        "A useful design balances query benefit with maintenance and ingestion cost."
      ],
      [
        "A team copies a vendor clustering recipe to PostgreSQL. What must be reconsidered?",
        "Maintenance semantics",
        "Identifier text width",
        "Source time formatting",
        "Dimension naming policy",
        "The same term can refer to materially different engine mechanisms and guarantees."
      ],
      [
        "A clustered table returns rows in a new order after an upgrade. Which assumption was invalid?",
        "Implicit row order",
        "Explicit ORDER BY",
        "Valid equality predicate",
        "Nonnull key",
        "Without ORDER BY a query never promised a stable output sequence."
      ],
      [
        "A block includes values 1 and 100 but no 50. What happens to a filter for 50 using bounds alone?",
        "It remains a candidate",
        "It is certainly a match",
        "It can certainly be skipped",
        "It must be a corrupt block",
        "The range covers 50, so bounds alone do not establish absence."
      ],
      [
        "A synthetic locality model reads fewer candidate blocks. What remains to benchmark?",
        "Real latency and bytes",
        "Array minimum",
        "Candidate count",
        "Equality test",
        "A model omits compression, caches, concurrency and real optimizer decisions."
      ]
    ],
    "lang": "python",
    "mistakes": [
      "Treating physical order as a query guarantee.",
      "Ignoring reclustering cost."
    ],
    "takeaways": [
      "Separate layout mechanisms.",
      "Measure representative workloads."
    ]
  },
  {
    "id": "warehouse-metric-contract",
    "comps": [
      "m3.c1"
    ],
    "title": "Define a reusable revenue metric contract",
    "intro": "Sales and finance report different net revenue because one excludes pending orders and the other deducts refunds at a different time. A semantic layer needs an agreed population before it needs a formula.",
    "sections": [
      [
        "Model the business contract",
        "A metric contract states its business purpose, owner, formula, grain, eligible population, time basis, units and treatment of missing data. Net revenue might mean posted line amounts less recognized refunds, excluding tax, in a reporting currency. Those choices are policy rather than universal meanings of the word revenue. Document them with examples that expose edge cases and obtain accountable review.",
        "The semantic layer centralizes shared measures and relationships so that multiple reports reuse the same interpretation. Centralization cannot resolve disagreement by itself: someone must decide which ledger, posting state and refund timing are authoritative. Version material changes and label whether historical values are restated. A dashboard should expose freshness and the metric version when those affect a business decision."
      ],
      [
        "Work through the decision and its limits",
        "Additivity must be part of the contract. A rate should retain component counts, a balance should name its snapshot boundary, and distinct customers should not be summed across overlapping groups. Currency conversion needs a rate date and a missing-rate policy. If a missing conversion is treated as zero, the result can look complete while understating the true value.",
        "The example selects posted transactions and sums signed amounts, including a negative refund. Pending activity is deliberately excluded. This verifies a simple metric fixture and demonstrates how one eligibility rule changes the result. It does not validate accounting policy, tax compliance or an actual warehouse semantic engine; finance review remains required for business acceptance."
      ]
    ],
    "problem": "Define a reusable revenue metric contract using a synthetic fixture.",
    "steps": [
      "Declare the record grain, keys and time meaning in the fixture.",
      "Trace the transformation and compare it with the stated invariant.",
      "Inspect the output and explain the remaining production assumptions."
    ],
    "code": "events=[('sale','posted',100),('refund','posted',-20),('sale','pending',50)]\nprint(sum(v for _,state,v in events if state=='posted'))\nprint(sum(v for _,_,v in events))",
    "expect": "80\n130",
    "limit": "Python validates a signed-amount eligibility fixture. It does not execute a warehouse semantic layer or certify accounting, PostgreSQL or WASM behavior.",
    "practice": [
      [
        "What belongs in a metric contract?",
        "Eligibility and timing",
        "SQL expression",
        "Dashboard owner",
        "Display precision",
        "A metric needs explicit population and timing rules to be interpreted consistently."
      ],
      [
        "What is the semantic layer intended to centralize?",
        "Shared metric definitions",
        "Raw storage file names",
        "All source-system password",
        "All analyst-specific override",
        "A semantic layer supports reuse of agreed relationships and measures across reports."
      ],
      [
        "Who should resolve competing revenue policies?",
        "A business owner",
        "Current query sort order",
        "First report consumer",
        "Storage-engine default",
        "Technical centralization cannot substitute for accountable policy decisions."
      ],
      [
        "One report includes pending orders and another excludes them. What explains the difference?",
        "Different eligibility",
        "Certain query-engine defect",
        "Automatic timezone conversion",
        "Decimal precision issue",
        "Identical arithmetic on different eligible rows produces different metrics."
      ],
      [
        "A missing exchange rate is replaced by zero. What can happen?",
        "Silent understatement",
        "Revenue is always overstated",
        "Source rate is recovered",
        "All invalid rows are excluded",
        "Zero imputes no converted value and can conceal incomplete rate coverage."
      ],
      [
        "A material revenue policy changes. What should accompany deployment?",
        "Version/restatement notes",
        "Refreshed data cache",
        "Renamed model file",
        "New report color",
        "Consumers need to understand changed historical comparability and the metric definition in use."
      ],
      [
        "A semantic measure is correct but the source is two days late. What must users see?",
        "Freshness information",
        "Formula text",
        "Current row count",
        "Table creation time",
        "Correct formulas do not remove the decision impact of stale inputs."
      ]
    ],
    "formal": [
      [
        "Which detail establishes a metric\u2019s units?",
        "Measurement units",
        "Rounding setting",
        "Metric alias",
        "Database region",
        "Units specify how numeric values should be interpreted and combined."
      ],
      [
        "What is a metric owner responsible for here?",
        "Definition decisions",
        "Query runtime tuning",
        "User-interface labels",
        "Source file upload timing",
        "An owner coordinates and approves the meaning and changes to the business measure."
      ],
      [
        "Why version a semantic definition?",
        "To make changes traceable",
        "To randomize historical values",
        "To remove consumer review",
        "To avoid source reconciliation",
        "Versioning records changes in interpretation and supports reproducible reporting."
      ],
      [
        "A refund is recognized in its posting month rather than the original sale month. What must be documented?",
        "Refund time attribution",
        "Refund event id",
        "Fact table sort order",
        "Product hierarchy",
        "Time attribution changes period totals and is part of the metric contract."
      ],
      [
        "A report sums distinct customer counts from overlapping regions. What risk remains?",
        "Double-counted customers",
        "Certain lost numerator",
        "Enforced unique population",
        "Auto dimensional alignment",
        "Distinct counts are not additive when groups overlap."
      ],
      [
        "Finance needs tax excluded but sales includes it. What should the team establish?",
        "Labeled agreed measures",
        "One unlabeled blended value",
        "Always the sales-only definition",
        "Always the latest raw amount",
        "Different legitimate definitions can coexist when their scope and labels are explicit and governed."
      ],
      [
        "A source status gains a new value, settled. What should the metric review inspect?",
        "New-status eligibility",
        "Status text length",
        "Column position",
        "Schema owner name",
        "Source evolution can change which rows belong in a business measure."
      ],
      [
        "A conversion rate improves after invalid visits are excluded only this month. Which issue affects the trend?",
        "Denominator policy change",
        "Table-index change",
        "Unrelated join alias",
        "Larger numeric type",
        "Comparisons need consistent eligibility or an explicit explanation of definition changes."
      ],
      [
        "A metric is certified but a downstream analyst rewrites its filters. What control helps?",
        "Governed reuse checks",
        "Certification label",
        "Shared chart title",
        "Same dashboard logo",
        "Downstream deviations need to be visible so users know whether they are consuming the governed metric."
      ],
      [
        "A board asks whether restated revenue can reproduce last quarter\u2019s published report. What is needed?",
        "Definition and data state",
        "Latest definition",
        "Current attributes",
        "Prior rounded total",
        "Reproduction requires the definition and data state that supported the earlier report."
      ]
    ],
    "lang": "python",
    "mistakes": [
      "Defining a metric by formula alone.",
      "Hiding missing inputs with zeros."
    ],
    "takeaways": [
      "Document population, time and units.",
      "Make definition changes traceable."
    ]
  },
  {
    "id": "warehouse-semantic-joins",
    "comps": [
      "m3.c1"
    ],
    "title": "Protect semantic models from fanout and ratio errors",
    "intro": "A BI model joins orders, order lines and support tickets. Each child relationship is valid, yet a direct three-table join can multiply both revenue and ticket counts.",
    "sections": [
      [
        "Model the business contract",
        "Join paths express cardinality, not just matching column names. If one order has two lines and three tickets, joining both children produces six combinations. Each line amount repeats for every ticket. A semantic model should declare relationships, test unique keys and avoid combining incompatible fact grains without a deliberate strategy.",
        "Aggregate independent child facts to a compatible shared grain before joining, or query separate measure subqueries and combine their results through conformed dimensions. This is sometimes called drilling across fact tables. Retain the desired dimensional keys and handle missing groups deliberately. SUM(DISTINCT amount) is unsafe because different legitimate transactions can share the same amount."
      ],
      [
        "Work through the decision and its limits",
        "Ratios must be recomputed from the relevant aggregate components. A support rate defined as tickets per order requires counts of the intended entities, not counts of rows after fanout. Some semantic tools can generate fanout-safe SQL under declared relationships, but incorrect cardinality declarations still create bad results. Inspect generated queries and test with asymmetric child counts that reveal multiplication.",
        "The fixture builds a two-by-three cross product, shows inflated line revenue and compares it with independently aggregated revenue and ticket counts. It proves the relationship arithmetic in Python. A real BI tool\u2019s SQL, null behavior and security filters must be validated separately on the actual engine; a local model cannot certify those integrations."
      ]
    ],
    "problem": "Protect semantic models from fanout and ratio errors using a synthetic fixture.",
    "steps": [
      "Declare the record grain, keys and time meaning in the fixture.",
      "Trace the transformation and compare it with the stated invariant.",
      "Inspect the output and explain the remaining production assumptions."
    ],
    "code": "lines=[40,60];tickets=['a','b','c']\njoined=[(amount,t) for amount in lines for t in tickets]\nprint(len(joined),sum(amount for amount,_ in joined))\nprint(sum(lines),len(tickets))",
    "expect": "6 300\n100 3",
    "limit": "Python demonstrates join-cardinality arithmetic only. It does not run BI-generated SQL, PostgreSQL, WASM, warehouse security filters or a semantic service.",
    "practice": [
      [
        "What can two independent one-to-many joins create?",
        "A child-row cross product",
        "One row per parent always",
        "Auto child deduplication",
        "Certain one-to-one join",
        "Each row from one child can combine with every matching row from the other child."
      ],
      [
        "What does a conformed dimension enable?",
        "Shared fact grouping",
        "Unique numeric measures",
        "Auto source corrections",
        "Implicit result ordering",
        "Shared dimensional meaning allows compatible aggregates from separate fact processes to be compared."
      ],
      [
        "Why is SUM DISTINCT amount unsafe for fanout repair?",
        "Equal-value sales collapse",
        "It always preserves events",
        "It validates fact business keys",
        "It by default allocates values",
        "Distinct numeric values are not distinct business events."
      ],
      [
        "An order has two lines and three tickets. How many direct child combinations occur?",
        "Six",
        "Two",
        "Three",
        "Five",
        "Each of the two lines pairs with each of the three tickets."
      ],
      [
        "A BI relationship is labeled one-to-one but duplicate keys exist. What must be fixed?",
        "Cardinality and key tests",
        "Display cardinality label",
        "Generated aliases",
        "Measure\u2019s decimal type",
        "Incorrect cardinality declarations can lead the tool to generate unsafe aggregation SQL."
      ],
      [
        "A ticket rate uses joined row count as ticket count. What threatens it?",
        "Other-child fanout",
        "Explicit row sort",
        "Nullable descriptive labels",
        "Field capitalization",
        "Other one-to-many relationships can repeat each ticket in the joined row set."
      ],
      [
        "Separate fact aggregates share month and region. What permits a valid comparison?",
        "Compatible shared grain",
        "Identical numeric amounts",
        "Same storage partition count",
        "Same metric display format",
        "Aggregates can be joined meaningfully when their dimensions and grouping contracts align."
      ]
    ],
    "formal": [
      [
        "What should a semantic relationship declare?",
        "Join cardinality",
        "Common names",
        "Table row count",
        "Storage file type",
        "Cardinality tells the model how many matching rows can occur on each side."
      ],
      [
        "What is drilling across facts intended to avoid?",
        "Unsafe direct fact fanout",
        "All SQL aggregation",
        "All shared dimension",
        "All relationship metadata",
        "Separate fact aggregates can be combined through compatible dimensions without multiplying raw fact rows."
      ],
      [
        "What is a useful fanout test fixture?",
        "Unequal child counts",
        "One row in every child",
        "Identical ids with no matches",
        "Empty fact table",
        "Unequal multiple child counts make accidental cross multiplication visible."
      ],
      [
        "Revenue is correct when queried alone but triples when tickets are added. What is likely?",
        "A join-grain mismatch",
        "Currency change necessarily",
        "Automatic correct total",
        "Certain missing dimension",
        "The added child relation can repeat revenue rows even when each standalone measure is correct."
      ],
      [
        "A team preaggregates lines per order before joining three tickets. Can summing order revenue still overcount?",
        "Yes; headers still repeat",
        "No, any preaggregation suffices",
        "No, aggregates never repeat",
        "With string identifiers",
        "The final aggregation must still respect the repeated order-level measure or combine independent aggregates safely."
      ],
      [
        "Two genuine sales each total 50. What does SUM DISTINCT amount return for them?",
        "50",
        "100",
        "0",
        "150",
        "Distinct amounts collapse equal values even when they belong to different valid sales."
      ],
      [
        "Orders exist in a month with zero tickets. What join policy should a rate model consider?",
        "Retain eligible orders",
        "Dropping all ticket-free orders",
        "Counting joined rows as orders",
        "Replacing missing tickets with orders",
        "A left or complete dimensional combination can retain eligible orders that have no ticket numerator."
      ],
      [
        "A BI tool claims automatic fanout protection. What evidence should reviewers inspect?",
        "Generated SQL and tests",
        "Vendor feature badge",
        "One correct simple query",
        "Model\u2019s display label",
        "Tool behavior depends on correct model declarations and needs tested execution evidence."
      ],
      [
        "Security filters apply only to one fact subquery. What must comparison review check?",
        "Aligned access scope",
        "Matching names",
        "Numeric value precision",
        "Common query indentation",
        "Different security scopes can make separately computed measures incomparable or expose inappropriate information."
      ],
      [
        "A semantic model joins daily stock to transaction sales and sums stock. What underlying problem remains?",
        "Repeated state measures",
        "Stock becomes fully additive",
        "All sales keys become invalid",
        "All snapshot date disappears",
        "A snapshot state cannot be summed repeatedly per transaction without changing its meaning."
      ]
    ],
    "lang": "python",
    "mistakes": [
      "Assuming valid foreign keys imply safe aggregates.",
      "Using distinct amounts as a universal correction."
    ],
    "takeaways": [
      "Declare join cardinality.",
      "Test combinations of independent fact grains."
    ]
  },
  {
    "id": "warehouse-governed-release",
    "comps": [
      "m3.c1"
    ],
    "title": "Release semantic changes with reconciled evidence",
    "intro": "A marketplace changes its revenue model to include a new payment status. The release must show whose totals change and provide a path to reproduce the old report.",
    "sections": [
      [
        "Model the business contract",
        "Treat a semantic model as a governed data product with an owner, version, tests and documented consumers. Structural tests cover unique keys, relationships and required fields. Business tests reconcile totals to authoritative inputs under explicitly aligned definitions. A successful schema test alone says little about whether the resulting number means the right thing.",
        "For a material change, compute old and new results in parallel over representative periods and segment the differences. Include edge cases such as refunds, late arrivals, currency gaps and incomplete dimensions. Explain each expected delta rather than merely asserting that the global total is close. A zero grand-total difference can conceal equal and opposite errors in two business units."
      ],
      [
        "Work through the decision and its limits",
        "Publish a migration note that states the changed policy, effective date, historical restatement scope, affected consumers and rollback plan. Keep enough versioned code and source snapshots to reproduce prior decisions subject to retention constraints. Access controls and private reviewer material should follow the data classification; a semantic abstraction is not a substitute for authorization enforcement.",
        "The fixture reconciles changes by segment and demonstrates that opposite differences cancel globally. It verifies a small comparison method, not a production lineage graph or a complete financial audit. Human reviewers must assess whether expected differences follow the intended policy and whether downstream reports remain interpretable."
      ]
    ],
    "problem": "Release semantic changes with reconciled evidence using a synthetic fixture.",
    "steps": [
      "Declare the record grain, keys and time meaning in the fixture.",
      "Trace the transformation and compare it with the stated invariant.",
      "Inspect the output and explain the remaining production assumptions."
    ],
    "code": "old={'north':100,'south':100};new={'north':110,'south':90}\nprint(sum(new.values())-sum(old.values()))\nprint({k:new[k]-old[k] for k in sorted(old)})",
    "expect": "0\n{'north': 10, 'south': -10}",
    "limit": "Python validates segment differences on synthetic dictionaries only. It does not certify finance policy, lineage completeness, production recovery, PostgreSQL or WASM behavior.",
    "practice": [
      [
        "What does reconciliation compare?",
        "Aligned-definition values",
        "Matching row ordering",
        "Matching names",
        "Matching column counts",
        "Reconciliation requires comparing values whose eligibility, units and time basis are understood."
      ],
      [
        "Why retain a semantic model version?",
        "Reproducibility",
        "To remove all old definitions",
        "To bypass source validation",
        "To randomize metric results",
        "A version identifies the definition used for a result and supports controlled changes."
      ],
      [
        "What can a zero grand-total delta conceal?",
        "Offsetting segment errors",
        "Proof that all segments agree",
        "Proof source coverage is complete",
        "Guarantee of no policy change",
        "Positive and negative subgroup discrepancies can cancel in the total."
      ],
      [
        "A release changes recognized revenue status rules. Who needs a migration note?",
        "Affected data consumers",
        "Source connector owner",
        "Database vendor",
        "Release script author",
        "Consumers need to understand changed meaning and historical comparability."
      ],
      [
        "A uniqueness test passes but revenue differs from finance. What remains to check?",
        "Eligibility and timing",
        "Integer key size",
        "Physical row order",
        "Table partition name",
        "Structural integrity does not establish agreement on the measure definition or population."
      ],
      [
        "A rollback restores code but source data was overwritten. What may be impossible?",
        "Prior report reproduction",
        "Executing the newest code",
        "Recording a model version",
        "Querying the current source",
        "Reproducibility requires the relevant historical data state as well as the definition."
      ],
      [
        "A regional total moves by 10 while the global sum is unchanged. What should reviewers do?",
        "Investigate segment deltas",
        "Approve from the global sum",
        "Remove the regional dimension",
        "Increase the global tolerance",
        "Segment checks expose changes that a grand-total comparison can mask."
      ]
    ],
    "formal": [
      [
        "What is a semantic release owner accountable for?",
        "Meaning and impact",
        "Query text formatting",
        "Storage region",
        "Dashboard page layout",
        "Ownership covers the business contract and the consequences of changing it."
      ],
      [
        "What should a rollback plan identify?",
        "A usable-version recovery",
        "Restarting the BI client",
        "Renaming the new model",
        "Dropping recent data",
        "Rollback needs an actionable path to a consistent prior definition and data state."
      ],
      [
        "What does a structural key test primarily verify?",
        "Key integrity",
        "Accounting policy acceptance",
        "Complete source extraction",
        "Human publication approval",
        "Unique and relationship checks validate structure, while business semantics need additional evidence."
      ],
      [
        "A global reconciliation passes but one unit gained and another lost the same amount. What test helps?",
        "Segmented reconciliation",
        "Another global total",
        "Maximum row id",
        "Sorted result sample",
        "Breaking differences down by meaningful dimensions prevents cancellation from hiding defects."
      ],
      [
        "A model change intentionally restates two years. What must release notes state?",
        "Restatement scope",
        "Current row count",
        "Future load schedule",
        "New model filename",
        "Consumers need to know which historical periods have changed and why."
      ],
      [
        "A payment status is added upstream without a model update. Which governance check can detect impact?",
        "Source-change monitoring",
        "Another schema screenshot",
        "SQL parser check",
        "Server health check",
        "Source-value evolution can change metric coverage even when the physical schema is unchanged."
      ],
      [
        "A reviewer sees a close total but no explanation for discrepancies. What evidence is missing?",
        "Explained deltas",
        "Wider tolerance",
        "Another aggregate total",
        "Extra decimal place",
        "A tolerance alone can conceal errors; differences need policy-based explanations."
      ],
      [
        "A data product has no known downstream consumers. What release risk follows?",
        "Unassessed consumer impact",
        "Certain lower query cost",
        "Certain harmless changes",
        "Auto consumer migration",
        "Without lineage or consumer inventory, definition changes can affect reports without a migration plan."
      ],
      [
        "An old report needs reproduction after retention expiry. What constraint must be acknowledged?",
        "Missing historical state",
        "Version names recreate rows",
        "Current data equals old state",
        "Deleted snapshots are inferable",
        "Reproducibility is bounded by retained source states and legal retention policies."
      ],
      [
        "A model is automatically validated. What review state is appropriate?",
        "Awaiting human review",
        "Human approved by tests",
        "Published by validation",
        "Certified job readiness",
        "Automated checks provide evidence but do not substitute for authorized human acceptance."
      ]
    ],
    "lang": "python",
    "mistakes": [
      "Accepting a grand total without segmented evidence.",
      "Assuming a code rollback restores overwritten data."
    ],
    "takeaways": [
      "Explain deltas before release.",
      "Preserve reproducibility within retention constraints."
    ]
  }
];
module.exports=course('data-modeling-warehousing',specs,[
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
    "id": "pg-cluster",
    "title": "PostgreSQL CLUSTER: one-time physical reorganization",
    "url": "https://github.com/postgres/postgres/blob/e6b2f7c2b41d6261dac15825dede55e94ca35614/doc/src/sgml/ref/cluster.sgml",
    "source": {
      "repo": "postgres/postgres",
      "commit": "e6b2f7c2b41d6261dac15825dede55e94ca35614",
      "path": "doc/src/sgml/ref/cluster.sgml",
      "verification": "Official pinned source materialized and inspected locally. Original synthetic examples; human educational review pending."
    }
  }
]);
