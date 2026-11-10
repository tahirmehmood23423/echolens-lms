'use strict';
const {course}=require('./backend-helper');
const lessons=[
  {
    "id": "pds-selection",
    "comp": "m1.c1",
    "title": "Choose collection semantics before optimizing cost",
    "before": "Python Fundamentals is required. Examples use original synthetic records and Python 3.13 standard-library operations; no production data, network service or distributed queue is accessed.",
    "intro": "A handler receives ordered enrollment events, needs one row per student id, and must detect repeated ids. Those are three different requirements: sequence order, key-to-value association and uniqueness. Choosing a collection by habit can silently discard duplicates or change the output contract before performance is even measured.",
    "sections": [
      [
        "Match operations to semantics",
        "A list retains positional order and duplicate elements. A dictionary associates unique hashable keys with values and preserves insertion order under the Python language contract. A set represents unique hashable elements and does not provide a positional or sorted-order contract. Choose the structure for the operations and output semantics, then estimate its cost.",
        "A dictionary assignment to an existing key replaces the associated value; it does not accumulate a second record automatically. A set can answer whether an id has appeared but cannot by itself preserve the original duplicate events. If the application needs both the ordered records and a membership index, keep both deliberately and maintain their invariant."
      ],
      [
        "Define key and duplicate policies",
        "Keys must be hashable with a stable equality/hash contract while stored. Mutable lists are unsuitable dictionary keys; tuples can be keys only when their contents are hashable. A business identity can require a composite tuple such as (tenant_id, student_id), rather than an id that is unique only inside one tenant.",
        "The fixture creates a sequence, unique-id set and last-value mapping from the same synthetic events. It demonstrates their different results rather than claiming one representation is universally best. Real memory limits, adversarial keys, persistence and authorization remain application-specific concerns."
      ]
    ],
    "problem": "Compare sequence, membership and last-value lookup semantics.",
    "steps": [
      "Identify the required semantics and name the input-size variables.",
      "Run the actual standard-library operations on the fixed synthetic input.",
      "Check the result and distinguish this correctness fixture from a workload benchmark."
    ],
    "code": "events = [(\"s1\", \"draft\"), (\"s2\", \"open\"), (\"s1\", \"closed\")]\nids = {key for key, value in events}\nlatest = dict(events)\nprint(len(events), len(ids), len(latest))\nprint(latest[\"s1\"])\nprint([key for key, value in events])",
    "expect": "3 2 2\nclosed\n['s1', 's2', 's1']",
    "result": "Actual list, set and dict operations produce different duplicate semantics. This small fixture is not a memory or throughput benchmark.",
    "mistakes": [
      "Converting events to a set can discard required duplicates and order.",
      "A dictionary overwrite is not automatic grouping."
    ],
    "takeaways": [
      "Compare sequence, membership and last-value lookup semantics.",
      "Actual list, set and dict operations produce different duplicate semantics. This small fixture is not a memory or throughput benchmark."
    ],
    "refs": [
      "structures",
      "dictimpl"
    ],
    "q": [
      [
        "E",
        "Which collection naturally retains duplicate records in positional order?",
        "List",
        "Set",
        "Single boolean",
        "One dictionary key",
        "A list retains sequence entries including duplicates.",
        "A set deduplicates.|A boolean holds no sequence.|One key stores one associated value."
      ],
      [
        "E",
        "Which structure associates an id with its current record?",
        "Dictionary",
        "Only a string",
        "Only a queue length",
        "Only a counter integer",
        "A dictionary maps keys to values.",
        "A string is not an id index.|A length contains no records.|An integer cannot associate many ids."
      ],
      [
        "M",
        "Two tenants both use student id 7. Which index key preserves their distinct identities?",
        "Tenant and student tuple",
        "Student id alone",
        "Only student name",
        "Only creation month",
        "A composite key includes the scope in which the id is unique.",
        "Id alone collides across tenants.|Names need not be unique.|Month does not identify a student."
      ],
      [
        "M",
        "A dictionary assigns two records to the same key. What happens by default?",
        "Later value replaces earlier",
        "Both accumulate automatically",
        "A queue is created",
        "A list is sorted",
        "Assignment updates the value associated with that key.",
        "Accumulation needs explicit code.|No queue is implied.|No sorting is implied."
      ],
      [
        "H",
        "A list of events becomes a set to save time, but duplicates matter. What failed first?",
        "Semantic preservation",
        "Only import ordering",
        "Only syntax highlighting",
        "Only log formatting",
        "Optimization must preserve the required duplicate/order contract.",
        "Import order is unrelated.|Highlighting is presentation.|Formatting does not preserve events."
      ],
      [
        "H",
        "Can a tuple containing a mutable list serve as a dictionary key?",
        "No, it is unhashable",
        "Yes, every tuple is hashable",
        "Only when the list is long",
        "Only inside a function",
        "Tuple hashability depends on the hashability of its elements.",
        "The container type alone is insufficient.|Length does not make a list hashable.|Scope does not change hashability."
      ]
    ]
  },
  {
    "id": "pds-queue-choice",
    "comp": "m1.c1",
    "title": "Choose FIFO, bounded history and priority access deliberately",
    "before": "Python Fundamentals is required. Examples use original synthetic records and Python 3.13 standard-library operations; no production data, network service or distributed queue is accessed.",
    "intro": "A worker needs the oldest waiting job, an incident panel needs the last twenty events, and a scheduler needs the smallest due time. Although each requirement stores a collection, their removal and overflow rules differ. A queue, bounded deque and heap should be selected for those precise contracts.",
    "sections": [
      [
        "Choose the removal order",
        "collections.deque supports efficient append and pop operations at either end. append followed by popleft implements a local FIFO sequence. A list used with pop(0) shifts remaining references and can become costly when repeatedly drained. A stack uses last-in-first-out removal and can be represented with list append/pop when that is the intended policy.",
        "A deque with maxlen intentionally discards an item from the opposite end when an append exceeds capacity. That can fit a recent-history buffer but silently loses pending jobs if used as a work queue without the right policy. Capacity and overflow behavior are part of correctness, not just memory optimization."
      ],
      [
        "Separate local data structures from delivery guarantees",
        "heapq provides a min-heap: the smallest element is available at index zero and heappop removes the smallest. It is not a fully sorted list. For equal priorities, add a monotonic sequence tie-breaker before a non-orderable payload when stable submission order is required.",
        "These standard-library containers live in one process. They do not supply persistence across crashes, distributed coordination, retries or acknowledgment protocols. The fixture exercises real deque and heap behavior over strings/tuples; it establishes removal order only for this local data."
      ]
    ],
    "problem": "Compare FIFO removal with smallest-priority removal.",
    "steps": [
      "Identify the required semantics and name the input-size variables.",
      "Run the actual standard-library operations on the fixed synthetic input.",
      "Check the result and distinguish this correctness fixture from a workload benchmark."
    ],
    "code": "from collections import deque\nimport heapq\nfifo = deque([\"first\", \"second\"])\nprint(fifo.popleft())\nheap = [(9, \"late\"), (2, \"early\"), (5, \"middle\")]\nheapq.heapify(heap)\nprint(heapq.heappop(heap))\nhistory = deque([1, 2], maxlen=2)\nhistory.append(3)\nprint(list(history))",
    "expect": "first\n(2, 'early')\n[2, 3]",
    "result": "The actual containers show FIFO, minimum priority and bounded eviction. They provide no durable or distributed delivery guarantee.",
    "mistakes": [
      "A bounded deque can evict unprocessed work.",
      "An in-memory queue does not provide crash durability."
    ],
    "takeaways": [
      "Compare FIFO removal with smallest-priority removal.",
      "The actual containers show FIFO, minimum priority and bounded eviction. They provide no durable or distributed delivery guarantee."
    ],
    "refs": [
      "collections",
      "heapq"
    ],
    "q": [
      [
        "E",
        "Which deque operation removes the oldest item after right-end appends?",
        "popleft",
        "append",
        "clear",
        "extend",
        "popleft removes from the opposite end of right-end insertion.",
        "append inserts.|clear removes everything.|extend adds entries."
      ],
      [
        "E",
        "Which item does a Python min-heap remove first?",
        "Smallest priority",
        "Newest insertion always",
        "Largest priority always",
        "Random payload",
        "heapq orders by the smallest comparable entry.",
        "Insertion age needs explicit tie policy.|That would be a max-oriented policy.|Removal is ordered rather than random."
      ],
      [
        "M",
        "A maxlen deque is used for pending jobs and overflows. What can happen?",
        "Old jobs are evicted",
        "Disk persistence appears",
        "Every producer blocks",
        "All jobs become unique",
        "Bounded deque appends discard from the opposite end when full.",
        "No disk storage is added.|Blocking is not its overflow policy.|Duplicates remain possible."
      ],
      [
        "M",
        "Two equal-priority jobs contain dictionaries as payloads. What avoids comparing the payloads?",
        "Sequence tie-breaker",
        "Longer dictionary names",
        "Random log colors",
        "Only a shared priority",
        "A unique comparable sequence field resolves ties before tuple comparison reaches dictionaries.",
        "Names do not change tuple comparison.|Colors are unrelated.|A shared priority leaves the tie unresolved."
      ],
      [
        "H",
        "A local deque passes ordering tests. What remains unproven?",
        "Crash durability",
        "The first output value",
        "The popleft behavior",
        "The constructed input",
        "In-memory order does not establish recovery after process failure.",
        "Those are local fixture observations.|The operation ran.|The input is explicit."
      ],
      [
        "H",
        "A heap list is printed and intermediate entries appear unsorted. What should be remembered?",
        "Heap order is partial",
        "Every heap is corrupt",
        "Heapify sorts fully",
        "All priorities are equal",
        "The min-heap invariant does not require a completely sorted underlying list.",
        "Partial order is valid.|heapify builds a heap.|Values can differ."
      ]
    ]
  },
  {
    "id": "pds-lookup",
    "comp": "m1.c2",
    "title": "Explain lookup costs with their assumptions",
    "before": "Python Fundamentals is required. Examples use original synthetic records and Python 3.13 standard-library operations; no production data, network service or distributed queue is accessed.",
    "intro": "A request checks each requested id against a list containing thousands of allowed ids. A single list membership check can scan many elements; repeating it changes total work. A set can improve expected membership cost, but constructing it and storing it also have costs that belong in the analysis.",
    "sections": [
      [
        "Name average and worst-case behavior",
        "A list membership search compares entries until it finds a match or exhausts the sequence, so a missing item may require work proportional to list length. Python dictionaries and sets use hash tables; under ordinary hash/equality assumptions, membership and key lookup have average constant-time behavior. That is an average-case statement, not a universal worst-case latency guarantee.",
        "Hashing and equality can themselves cost more for long or complex keys. Collisions, resizing, object behavior and memory pressure can affect observed costs. A dictionary also requires a hashable key with consistent equality/hash semantics. Do not turn O(1) into a promise that every lookup takes one CPU operation."
      ],
      [
        "Include index construction and semantics",
        "Building a set from n items takes expected linear work and additional memory. Reusing it for m membership checks can change expected work from O(n*m) list scanning to O(n+m), assuming ordinary key behavior and preserving the intended equivalence relation. For a tiny one-off check, construction and allocation may outweigh the benefit.",
        "The fixture counts explicit equality attempts in a linear scan, then uses an actual set to produce the same booleans. It does not instrument CPython hash-table probes or prove a speedup from wall-clock timing. The analytical claim is conditioned on the stated key and reuse assumptions."
      ]
    ],
    "problem": "Count a linear membership scan and compare actual set results.",
    "steps": [
      "Identify the required semantics and name the input-size variables.",
      "Run the actual standard-library operations on the fixed synthetic input.",
      "Check the result and distinguish this correctness fixture from a workload benchmark."
    ],
    "code": "values = [10, 20, 30, 40]\nchecks = 0\nfound = False\nfor value in values:\n    checks += 1\n    if value == 99:\n        found = True\n        break\nprint(found, checks)\nindex = set(values)\nprint(99 in index, 20 in index)",
    "expect": "False 4\nFalse True",
    "result": "The explicit scan compares four entries and the set returns matching membership facts. No hash-probe count or timing speedup is measured.",
    "mistakes": [
      "Average constant time is not a universal latency deadline.",
      "Rebuilding the index per lookup repeats construction work."
    ],
    "takeaways": [
      "Count a linear membership scan and compare actual set results.",
      "The explicit scan compares four entries and the set returns matching membership facts. No hash-probe count or timing speedup is measured."
    ],
    "refs": [
      "structures",
      "dictimpl"
    ],
    "q": [
      [
        "E",
        "What is the worst-case number of entries examined by list membership over n entries?",
        "Proportional to n",
        "Always one",
        "Always zero",
        "Independent of n",
        "A missing value can require scanning the full sequence.",
        "One comparison is not guaranteed.|The sequence must be checked.|Work grows with the sequence."
      ],
      [
        "E",
        "What is ordinary average-case set membership cost under standard key assumptions?",
        "Constant time",
        "Always quadratic",
        "Always a full sort",
        "One network request",
        "Hash-table membership has expected constant-time behavior under those assumptions.",
        "Quadratic work is not the ordinary lookup model.|Sorting is not required.|The structure is local."
      ],
      [
        "M",
        "A set is rebuilt inside every membership loop iteration. Which cost was overlooked?",
        "Repeated construction",
        "Only variable naming",
        "Only print formatting",
        "Only route spelling",
        "Repeatedly building the index can erase the intended reduction in repeated scans.",
        "Names do not remove allocation.|Formatting is unrelated.|Routes do not build the set."
      ],
      [
        "M",
        "Long custom keys have expensive equality methods. What should complexity analysis include?",
        "Key operation cost",
        "Only entry count",
        "Only source file count",
        "Only function name",
        "Hashing and equality are operations whose own cost may depend on key size and behavior.",
        "Entry count alone can hide key work.|Files do not determine comparisons.|Names do not measure work."
      ],
      [
        "H",
        "A benchmark shows one dict lookup slower than one list lookup. Does that refute average-case asymptotic reasoning?",
        "No, constants matter",
        "Yes, all hashing is linear",
        "Yes, lists are always faster",
        "Yes, Big O predicts nanoseconds",
        "Small inputs and implementation constants can dominate one observation.",
        "One result does not establish universal hash complexity.|No universal speed ordering follows.|Asymptotic notation does not specify elapsed units."
      ],
      [
        "H",
        "A list contains duplicate allowed ids. A set is used only for membership checks. Which requirement must still be checked?",
        "Membership semantics",
        "Original list length preserved",
        "Duplicate count returned",
        "Original index returned",
        "Deduplication can preserve boolean membership while changing other possible contracts.",
        "Length changes need not matter for membership only.|Counts are a different contract.|A set does not preserve positions."
      ],
      [
        "M",
        "A service builds an index once and performs many reads. What should be included in total cost?",
        "Build plus lookups",
        "Lookups only",
        "Source comments only",
        "Database brand only",
        "The complete operation includes preprocessing as well as subsequent access.",
        "Ignoring preprocessing understates total work.|Comments do not execute.|Brand is unrelated."
      ],
      [
        "H",
        "Can average constant-time hashing be treated as an unconditional latency deadline?",
        "No",
        "Always",
        "Only with short variable names",
        "Only in a comprehension",
        "Worst-case behavior, key costs and runtime conditions remain relevant.",
        "Average work is not a hard deadline.|Names do not change guarantees.|Syntax does not create a deadline."
      ]
    ]
  },
  {
    "id": "pds-loops",
    "comp": "m2.c1",
    "title": "Estimate loops using independent input dimensions",
    "before": "Python Fundamentals is required. Examples use original synthetic records and Python 3.13 standard-library operations; no production data, network service or distributed queue is accessed.",
    "intro": "A handler loops over students and then over each student\u2019s assignments. Calling this quadratic merely because there are two loops can be wrong: the cost depends on how many assignments are actually visited. Naming the dimensions and counting work is more reliable than counting indentation levels.",
    "sections": [
      [
        "Count executed work",
        "A loop over n items with bounded work per item is O(n). Two consecutive such loops add work, giving O(n+n)=O(n), not O(n squared). An independent inner loop over m items for each of n outer items gives O(n*m); it becomes O(n squared) only when the dimensions grow together under that model.",
        "A triangular loop with inner lengths 0 through n-1 performs n*(n-1)/2 iterations and is quadratic even though it never visits the full n inner entries each time. A fixed bound such as three validation rules per record is a constant multiplier, while an input-dependent rules list needs its own size variable."
      ],
      [
        "Treat branching and early exits explicitly",
        "A break on the first match can make best-case work small while leaving worst-case work large. A handler with nested loops over disjoint partitions can have total work proportional to the sum of partition sizes rather than the product of their largest sizes. State the case and data assumptions instead of selecting one label without context.",
        "The fixture counts exact iterations for consecutive, rectangular and triangular loops. It verifies these formulas at one small input and provides a concrete model for reasoning across n and m. It does not benchmark request latency or include database/network calls hidden inside a loop body."
      ]
    ],
    "problem": "Count consecutive, rectangular and triangular loop work.",
    "steps": [
      "Identify the required semantics and name the input-size variables.",
      "Run the actual standard-library operations on the fixed synthetic input.",
      "Check the result and distinguish this correctness fixture from a workload benchmark."
    ],
    "code": "n, m = 4, 3\nconsecutive = sum(1 for _ in range(n)) + sum(1 for _ in range(n))\nrectangular = sum(1 for _ in range(n) for _ in range(m))\ntriangular = sum(1 for i in range(n) for _ in range(i))\nprint(consecutive, rectangular, triangular)\nprint(triangular == n * (n - 1) // 2)",
    "expect": "8 12 6\nTrue",
    "result": "Exact local iteration counts match the formulas. External work per iteration and workload latency are outside the fixture.",
    "mistakes": [
      "Nested syntax alone does not determine quadratic work.",
      "A local count omits remote-call cost hidden in the body."
    ],
    "takeaways": [
      "Count consecutive, rectangular and triangular loop work.",
      "Exact local iteration counts match the formulas. External work per iteration and workload latency are outside the fixture."
    ],
    "refs": [
      "structures"
    ],
    "q": [
      [
        "E",
        "Two consecutive n-item loops each do constant work. What is their combined asymptotic time?",
        "O(n)",
        "O(n squared)",
        "O(1)",
        "O(log n)",
        "Adding two linear passes remains linear.",
        "They are consecutive rather than nested.|Both still visit input items.|No logarithmic reduction occurs."
      ],
      [
        "E",
        "An n-item outer loop scans m independent items each time. What is the iteration count order?",
        "O(n times m)",
        "O(n plus m)",
        "O(1)",
        "O(log m)",
        "Every outer iteration performs m inner visits.",
        "Addition would fit consecutive passes.|Work grows with both sizes.|No halving process occurs."
      ],
      [
        "M",
        "A loop checks exactly three fixed rules per record. How does work scale with n records?",
        "Linearly",
        "Quadratically",
        "Exponentially",
        "Independently of n",
        "Three fixed checks multiply the linear pass by a constant.",
        "The inner count does not grow with n.|No branching expansion occurs.|Every record is visited."
      ],
      [
        "M",
        "A search breaks at its first match. Which complexity cases can differ?",
        "Best and worst",
        "Only filename case",
        "Only HTTP status",
        "Only source indentation",
        "An early match can stop quickly, while a missing match can scan the input.",
        "Filename spelling is unrelated.|Statuses do not count iterations.|Indentation alone does not specify data-dependent work."
      ],
      [
        "H",
        "Students have disjoint assignment lists totaling a entries. What is a full traversal cost including n students?",
        "O(n plus a)",
        "Always O(n squared)",
        "Always O(a squared)",
        "O(1)",
        "The traversal visits each student and each listed assignment once.",
        "Nested syntax alone does not force n squared.|Assignments are not pairwise compared.|The input is visited."
      ],
      [
        "H",
        "A loop body calls a remote API. What does a local iteration count fail to establish?",
        "End-to-end latency",
        "How many iterations ran",
        "The range bounds",
        "The loop syntax",
        "Network latency, retries and service behavior add cost outside a bounded local-operation model.",
        "Those are observable local facts.|Bounds are explicit.|Syntax is known."
      ]
    ]
  },
  {
    "id": "pds-cost-model",
    "comp": "m2.c1",
    "title": "Include sorting, allocation and hidden operations in cost models",
    "before": "Python Fundamentals is required. Examples use original synthetic records and Python 3.13 standard-library operations; no production data, network service or distributed queue is accessed.",
    "intro": "A short comprehension performs a list membership check, a slice and a sort in each iteration. Its source length does not reveal its work. Backend cost models should expand library operations and retained output rather than treat every line as a constant-time instruction.",
    "sections": [
      [
        "Expand the expensive operations",
        "Sorting n comparable elements commonly requires O(n log n) comparisons in the general case, while the comparison function may add its own cost. Slicing a list copies references for the selected slice length; repeatedly copying growing prefixes can accumulate quadratic work and allocation. A call to a helper must be analyzed through its relevant behavior.",
        "An algorithm that produces every pair of n items has quadratic output size. No implementation can materialize all those output pairs in linear time and space under the usual model. Streaming can reduce peak retained memory while preserving the total number of pairs and total work needed to produce them."
      ],
      [
        "Separate time, memory and operational constraints",
        "A precomputed lookup map trades extra memory and construction for fewer repeated scans. A generator can reduce retained intermediate data, but converting it to a list later still materializes the result. Bound input size and output size at the request boundary when resource use is part of the API contract.",
        "The fixture sums copied-prefix lengths and compares them with the actual retained flattened list. It demonstrates the difference between an input count and accumulated copying. It uses deterministic counters rather than timing, so it cannot establish production speed, allocator behavior or a maximum safe request size."
      ]
    ],
    "problem": "Count the work caused by repeatedly copying growing list prefixes.",
    "steps": [
      "Identify the required semantics and name the input-size variables.",
      "Run the actual standard-library operations on the fixed synthetic input.",
      "Check the result and distinguish this correctness fixture from a workload benchmark."
    ],
    "code": "values = list(range(5))\ncopied = []\nfor stop in range(1, len(values) + 1):\n    copied.extend(values[:stop])\nprint(len(copied))\nprint(sum(range(1, len(values) + 1)))\nprint(len(values))",
    "expect": "15\n15\n5",
    "result": "The fixture retains fifteen copied references from five inputs. It is a local work-count illustration, not an allocator or latency benchmark.",
    "mistakes": [
      "A short expression can perform substantial input-dependent work.",
      "Materializing a generator retains its output."
    ],
    "takeaways": [
      "Count the work caused by repeatedly copying growing list prefixes.",
      "The fixture retains fifteen copied references from five inputs. It is a local work-count illustration, not an allocator or latency benchmark."
    ],
    "refs": [
      "structures",
      "itertools"
    ],
    "q": [
      [
        "E",
        "Does one source-code line necessarily mean constant work?",
        "No",
        "Always",
        "Only for Python",
        "Only in handlers",
        "A line can invoke a scan, sort or other input-dependent operation.",
        "Line count is not operation count.|Python syntax does not change this.|Handlers can call costly helpers."
      ],
      [
        "E",
        "What does a list slice generally copy?",
        "Selected references",
        "Only its variable name",
        "Every database row",
        "A new network connection",
        "A slice creates a new list containing references from the selected range.",
        "Names are not elements.|Databases are separate.|No network call is inherent."
      ],
      [
        "M",
        "Every prefix of an n-item list is copied. How does total copied length grow?",
        "Quadratically",
        "Always constant",
        "Only logarithmically",
        "Independently of n",
        "The sum 1 through n equals n*(n+1)/2.",
        "Prefixes grow with n.|The sum is not a halving process.|The input size matters."
      ],
      [
        "M",
        "A generator produces every pair and is immediately wrapped in list. What memory behavior matters?",
        "All pairs retained",
        "No output memory",
        "Only one pair forever",
        "Automatic disk spill",
        "Materialization stores the generated results despite lazy production.",
        "The list contains output.|The consumer retains more than one pair.|No spill is implied."
      ],
      [
        "H",
        "A helper sorts on every iteration of an n-loop. What must the model include?",
        "Repeated sort cost",
        "Only outer loop cost",
        "Only helper name",
        "Only indentation depth",
        "The helper work is repeated and cannot be treated as a free constant operation.",
        "Outer count alone omits the sort.|Names do not measure work.|Depth alone is insufficient."
      ],
      [
        "H",
        "A response must contain all n squared pairs. Can a linear-output-memory claim hold if every pair is materialized?",
        "No",
        "Always",
        "Only with shorter names",
        "Only with tuples",
        "The output itself contains quadratic many entries under the stated contract.",
        "Representation does not eliminate entry count.|Names do not reduce output count.|Tuples still occupy output entries."
      ]
    ]
  },
  {
    "id": "pds-quadratic",
    "comp": "m2.c2",
    "title": "Remove repeated membership scans without changing results",
    "before": "Python Fundamentals is required. Examples use original synthetic records and Python 3.13 standard-library operations; no production data, network service or distributed queue is accessed.",
    "intro": "A handler intersects a large ordered request list with a list of allowed ids. For each request it scans the allowed list again. Building one membership set outside the loop can remove repeated scans while preserving the request order and duplicate results when that is the declared contract.",
    "sections": [
      [
        "Locate the repeated search",
        "For n requested ids and m allowed ids, repeated list membership can require O(n*m) comparisons in the worst scan pattern. Under ordinary hashing assumptions, building one set from the allowed ids takes expected O(m) work and then n checks take expected O(n), for expected O(n+m) overall. Include the set memory and key hash/equality costs.",
        "Keep the output iteration over the original request list if order and duplicates must remain. Converting both sides to sets and returning their intersection changes those semantics. Build the set once at the correct scope; rebuilding it inside the loop repeats preprocessing. Avoid a global authorization cache unless its tenant, actor and invalidation contract is explicitly safe."
      ],
      [
        "Verify equivalence and boundaries",
        "Compare the original and optimized outputs on missing ids, duplicates, empty inputs and multiple tenant scopes. Mutation between index creation and use can make an index stale, so either use a stable input snapshot or define how updates maintain the index. A local optimization must not drop access filters in pursuit of lower operation count.",
        "The fixture runs the original and set-indexed comprehensions on synthetic integers, checks exact list equality and prints the retained order/duplicates. It proves equivalence for those examples, not all custom equality objects or live authorization changes. No elapsed-time speedup is claimed."
      ]
    ],
    "problem": "Use one membership index while retaining request order and duplicates.",
    "steps": [
      "Identify the required semantics and name the input-size variables.",
      "Run the actual standard-library operations on the fixed synthetic input.",
      "Check the result and distinguish this correctness fixture from a workload benchmark."
    ],
    "code": "requested = [3, 1, 3, 8, 2]\nallowed = [1, 2, 3]\noriginal = [key for key in requested if key in allowed]\nindex = set(allowed)\noptimized = [key for key in requested if key in index]\nprint(original == optimized)\nprint(optimized)\nprint([key for key in [] if key in index])",
    "expect": "True\n[3, 1, 3, 2]\n[]",
    "result": "The actual outputs match for these synthetic integer inputs including duplicates and emptiness. It is not a live authorization or timing test.",
    "mistakes": [
      "Set intersection can change output duplicates and ordering.",
      "An authorization index needs the correct scope and freshness policy."
    ],
    "takeaways": [
      "Use one membership index while retaining request order and duplicates.",
      "The actual outputs match for these synthetic integer inputs including duplicates and emptiness. It is not a live authorization or timing test."
    ],
    "refs": [
      "structures",
      "dictimpl"
    ],
    "q": [
      [
        "E",
        "Where should a reusable membership set normally be built for one batch?",
        "Before the loop",
        "Inside every iteration",
        "After all checks",
        "Only in error logging",
        "One construction can serve all membership checks in the batch.",
        "Repeated construction wastes work.|Later construction cannot serve earlier checks.|Logs do not perform the intended index setup."
      ],
      [
        "E",
        "Repeated n-by-m list membership can require what work order?",
        "O(n times m)",
        "O(n plus m) always",
        "O(1)",
        "O(log n)",
        "Each of n checks may scan m allowed entries.",
        "Linear total needs an additional structure/assumption.|Both input sizes matter.|No logarithmic search is implied."
      ],
      [
        "M",
        "The output must preserve requested duplicate ids. What should drive output iteration?",
        "Original request list",
        "Set intersection alone",
        "Sorted unique keys always",
        "Only the last request",
        "Iterating the original sequence retains its order and repeated entries.",
        "Intersection loses duplicates.|Sorting changes order and uniqueness.|The last item loses other results."
      ],
      [
        "M",
        "A shared membership cache omits tenant identity. What correctness risk exists?",
        "Cross-tenant mixing",
        "Only slower formatting",
        "Only larger comments",
        "Only different indentation",
        "An id authorized in one tenant may be incorrectly treated as allowed in another.",
        "Formatting is unrelated.|Comments do not enforce scope.|Indentation does not provide tenant identity."
      ],
      [
        "H",
        "The allowed list changes after the set is built. What policy is required?",
        "Index freshness",
        "Only variable rename",
        "Only log severity",
        "Only response casing",
        "A derived index can become stale unless updates and lifetime are controlled.",
        "Names do not synchronize data.|Severity does not refresh the set.|Casing does not update membership."
      ],
      [
        "H",
        "Set-based and list-based results match on one fixture. What still requires care?",
        "Custom key semantics",
        "The printed fixture result",
        "The integer input values",
        "The executed comprehension",
        "Hashability and equality assumptions may differ for other key types and workloads.",
        "Those are local observations.|The values are explicit.|The code ran."
      ],
      [
        "M",
        "The optimized handler returns sorted unique ids unexpectedly. What changed beyond performance?",
        "Output semantics",
        "Only memory address",
        "Only function caption",
        "Only source file count",
        "Order and duplicates are part of the observable result contract.",
        "Addresses are not the specified result.|Captions do not explain changed output.|File count is unrelated."
      ],
      [
        "H",
        "An index removes repeated scans but uses substantial extra memory. What should acceptance compare?",
        "Time-memory tradeoff",
        "Only Big O time",
        "Only variable names",
        "Only source length",
        "The workload must fit memory and semantics as well as expected lookup work.",
        "Time alone omits a resource constraint.|Names do not measure memory.|Length is not retained data size."
      ]
    ]
  },
  {
    "id": "pds-grouping",
    "comp": "m3.c1",
    "title": "Group, count and index records with explicit duplicate policy",
    "before": "Python Fundamentals is required. Examples use original synthetic records and Python 3.13 standard-library operations; no production data, network service or distributed queue is accessed.",
    "intro": "A report needs counts by status, groups of ids by course, and direct lookup by enrollment id. A Counter, a mapping of lists and a unique-key index support different outputs. Being explicit about duplicates and missing values prevents a convenient comprehension from discarding records silently.",
    "sections": [
      [
        "Use purpose-specific mappings",
        "collections.Counter counts hashable keys and returns zero for a missing count. defaultdict(list) can append each record into its group, creating the list when first needed. A plain dictionary index supports direct key lookup but needs a declared duplicate policy: reject duplicates, keep the first, keep the last or collect all values.",
        "Group using a key that includes required business scope. Normalize only when the domain contract says values are equivalent; lowercasing every identifier can merge distinct keys. Missing fields should be handled deliberately rather than accidentally grouped under a misleading default. Avoid mutable default values shared across unrelated groups."
      ],
      [
        "Keep aliases and output order intentional",
        "A grouping dictionary holding lists stores references to records unless copies are made. Later mutation of those records can change the apparent report. Decide whether the report is a live view or snapshot, and account for copying cost. Dictionary insertion order can preserve first-seen groups, but sorted report output requires explicit sorting.",
        "The fixture uses actual Counter and defaultdict operations, then builds an index only after rejecting duplicate ids. It demonstrates counts, grouping and explicit validation on fixed synthetic rows. It does not establish schema validation, cross-process consistency or safe storage of real records."
      ]
    ],
    "problem": "Compute counts and groups while rejecting duplicate index keys.",
    "steps": [
      "Identify the required semantics and name the input-size variables.",
      "Run the actual standard-library operations on the fixed synthetic input.",
      "Check the result and distinguish this correctness fixture from a workload benchmark."
    ],
    "code": "from collections import Counter, defaultdict\nrows = [{\"id\": 1, \"course\": \"A\"}, {\"id\": 2, \"course\": \"B\"}, {\"id\": 3, \"course\": \"A\"}]\ncounts = Counter(row[\"course\"] for row in rows)\ngroups = defaultdict(list)\nindex = {}\nfor row in rows:\n    if row[\"id\"] in index:\n        raise ValueError(\"duplicate id\")\n    index[row[\"id\"]] = row\n    groups[row[\"course\"]].append(row[\"id\"])\nprint(sorted(counts.items()))\nprint(dict(groups))\nprint(index[2][\"course\"])",
    "expect": "[('A', 2), ('B', 1)]\n{'A': [1, 3], 'B': [2]}\nB",
    "result": "Real standard-library operations produce the declared count/group/index results. The fixture has no concurrent writers or persistent store.",
    "mistakes": [
      "Dictionary comprehensions silently implement last-value overwrite.",
      "Grouped mutable records can remain aliases rather than snapshots."
    ],
    "takeaways": [
      "Compute counts and groups while rejecting duplicate index keys.",
      "Real standard-library operations produce the declared count/group/index results. The fixture has no concurrent writers or persistent store."
    ],
    "refs": [
      "collections",
      "structures"
    ],
    "q": [
      [
        "E",
        "Which standard-library type directly counts hashable categories?",
        "Counter",
        "deque only",
        "A single string",
        "A file handle",
        "Counter stores category frequencies.",
        "Deque provides sequence operations.|One string does not count categories.|Handles represent resources."
      ],
      [
        "E",
        "Which mapping factory naturally starts a fresh list per missing group?",
        "defaultdict(list)",
        "dict.fromkeys(keys, [])",
        "One shared global list",
        "A fixed tuple only",
        "The list factory creates a separate list for each missing key.",
        "fromkeys can share the same mutable list.|A global list mixes groups.|A fixed tuple cannot append group records."
      ],
      [
        "M",
        "An index comprehension sees duplicate record ids. What policy does ordinary assignment implement?",
        "Keep last value",
        "Reject duplicates",
        "Collect all automatically",
        "Keep first always",
        "Later assignments replace values for the same key.",
        "Rejection needs explicit checking.|Collection needs explicit grouping.|First-wins requires different logic."
      ],
      [
        "M",
        "A grouped report holds original mutable records. What can later mutation affect?",
        "Report contents",
        "Only key spelling",
        "Only variable caption",
        "Only import order",
        "The group can hold aliases to the same mutable objects.",
        "Names do not change aliases.|Captions do not control references.|Imports are unrelated."
      ],
      [
        "H",
        "A business key is case-sensitive. What can indiscriminate lowercasing do?",
        "Merge distinct records",
        "Guarantee uniqueness",
        "Preserve every identity",
        "Create independent copies",
        "Normalization can change equality and collapse domain-distinct keys.",
        "Uniqueness is not guaranteed.|Case-sensitive identity can be lost.|Lowercasing keys is not deep copying."
      ],
      [
        "H",
        "An index must reject duplicates rather than overwrite. What must happen before insertion?",
        "Check key existence",
        "Only sort values",
        "Only count modules",
        "Only rename the mapping",
        "An explicit membership/validation path can detect the duplicate under the local contract.",
        "Sorting alone does not reject.|Modules are unrelated.|Names do not enforce policy."
      ]
    ]
  },
  {
    "id": "pds-jobs",
    "comp": "m3.c2",
    "title": "Use FIFO and priority queues with stable tie handling",
    "before": "Python Fundamentals is required. Examples use original synthetic records and Python 3.13 standard-library operations; no production data, network service or distributed queue is accessed.",
    "intro": "A scheduler stores due-time jobs whose payloads are dictionaries. Two jobs share a due time, and naive tuple comparison reaches the dictionaries and fails. A monotonic tie-breaker provides a deterministic order while keeping job payloads out of the ordering contract.",
    "sections": [
      [
        "Implement local scheduling order",
        "For FIFO jobs, append to a deque and popleft in a single-process worker model. For priority scheduling, store entries such as (due_time, sequence, payload) in a heap. heappush and heappop preserve the heap invariant with logarithmic work in queue length under ordinary comparison assumptions; heapify builds a heap from a supplied list in linear time.",
        "A min-heap serves the smallest priority first, which is suitable for earliest due-time or lowest cost only if those priorities express the intended policy. It does not automatically provide fairness; a stream of higher-priority jobs can starve lower-priority jobs. Equal priorities need an explicit stable order when that matters to the product."
      ],
      [
        "Plan mutation, failures and limits",
        "Changing an entry in place can break heap ordering. One approach to cancellation or reprioritization is marking stale entries and pushing a new version, then skipping stale entries when popped, with a compaction/memory policy. Do not assume heapq removes arbitrary jobs efficiently by business id.",
        "The fixture uses actual heapq with unique sequence values and dictionary payloads, then drains an actual deque. It proves local ordering for supplied jobs. It does not provide acknowledgment, redelivery, crash persistence, distributed exclusion or an exactly-once execution guarantee; those need a separate queue/service contract."
      ]
    ],
    "problem": "Order equal-priority dictionary jobs using a unique sequence field.",
    "steps": [
      "Identify the required semantics and name the input-size variables.",
      "Run the actual standard-library operations on the fixed synthetic input.",
      "Check the result and distinguish this correctness fixture from a workload benchmark."
    ],
    "code": "from collections import deque\nimport heapq\nheap = []\nfor seq, (due, name) in enumerate([(5, \"A\"), (2, \"B\"), (2, \"C\")]):\n    heapq.heappush(heap, (due, seq, {\"name\": name}))\norder = [heapq.heappop(heap)[2][\"name\"] for _ in range(3)]\nprint(order)\nfifo = deque([\"A\", \"B\", \"C\"])\nprint([fifo.popleft() for _ in range(3)])",
    "expect": "['B', 'C', 'A']\n['A', 'B', 'C']",
    "result": "The real containers preserve the declared local priority/tie/FIFO policies. Durable delivery and concurrent scheduling are not tested.",
    "mistakes": [
      "Editing a heap priority in place can break its invariant.",
      "Priority order alone does not guarantee fairness or durable delivery."
    ],
    "takeaways": [
      "Order equal-priority dictionary jobs using a unique sequence field.",
      "The real containers preserve the declared local priority/tie/FIFO policies. Durable delivery and concurrent scheduling are not tested."
    ],
    "refs": [
      "heapq",
      "collections"
    ],
    "q": [
      [
        "E",
        "What should precede a non-orderable payload in equal-priority heap entries?",
        "Unique sequence",
        "A second dictionary",
        "A random unhashable list",
        "The payload again",
        "A comparable unique tie-breaker resolves ordering before the payload.",
        "A dictionary cannot reliably resolve the comparison.|Lists may compare but do not supply the required unique stable tie contract.|Repeating payloads leaves the issue."
      ],
      [
        "E",
        "What is the ordinary work order of one heap push for n entries?",
        "O(log n)",
        "O(n squared)",
        "O(n factorial)",
        "Always O(n log n)",
        "Maintaining a binary heap requires a logarithmic path under ordinary comparisons.",
        "No pairwise enumeration occurs.|No permutation enumeration occurs.|That is larger than one push requires."
      ],
      [
        "M",
        "A due time is edited directly inside a heap list. What invariant can fail?",
        "Heap ordering",
        "Only insertion naming",
        "Only output formatting",
        "Only module count",
        "Changing an ordering field without heap repair can invalidate the parent-child ordering.",
        "Names do not maintain order.|Formatting is unrelated.|Modules do not define heap structure."
      ],
      [
        "M",
        "A constant stream of urgent jobs arrives. What risk can a strict priority policy create?",
        "Starvation",
        "Automatic fairness",
        "Guaranteed FIFO",
        "Permanent durability",
        "Lower-priority work may keep waiting under strict priority.",
        "Fairness needs an explicit policy.|Priority order differs from FIFO.|Memory queues are not durable."
      ],
      [
        "H",
        "Cancellation uses stale entries retained in a heap. What additional policy is needed?",
        "Memory cleanup",
        "Only longer job ids",
        "Only log colors",
        "Only file renaming",
        "Lazy deletion can retain stale entries and requires bounded cleanup/compaction behavior.",
        "Longer ids do not reclaim entries.|Colors do not free memory.|Names do not remove entries."
      ],
      [
        "H",
        "A heap schedules each fixture job once. Which guarantee does that not establish?",
        "Exactly-once execution",
        "The local pop order",
        "The sequence values",
        "The input queue size",
        "Crash recovery, retries and remote effects are outside a local pop-order fixture.",
        "Those are local observations.|The values are explicit.|The size is known."
      ]
    ]
  },
  {
    "id": "pds-batching",
    "comp": "m3.c3",
    "title": "Batch and paginate collections with explicit boundaries",
    "before": "Python Fundamentals is required. Examples use original synthetic records and Python 3.13 standard-library operations; no production data, network service or distributed queue is accessed.",
    "intro": "A nightly job must process millions of ids without retaining every transformed result. Batching bounds the unit of work, but a list slice still copies references and a lazy producer can still feed an unbounded accumulator. Stable continuation and failure recovery need explicit semantics.",
    "sections": [
      [
        "Bound producer and consumer memory",
        "itertools.islice can consume a bounded segment of an iterator without slicing the entire input list. A batch loop can materialize at most k input items at a time, process them, then release them. This bounds batch storage only if the consumer does not retain every batch or generate an unbounded result per item.",
        "Validate batch_size as a positive integer to avoid an empty-batch infinite loop or silent no-op contract. Include the final partial batch and empty input in checks. Choosing k balances overhead, memory and downstream limits; there is no universal batch size suitable for every service or payload distribution."
      ],
      [
        "Define continuation and retry semantics",
        "An offset into a mutable collection can skip or repeat items when rows are inserted or deleted. Keyset continuation needs a stable total order, a tie-breaker and the same filters/scope on each page. A stable snapshot across pages is a separate contract. A local fixed-list example cannot prove behavior under concurrent mutations.",
        "For a resumable job, store a progress marker only when the batch effects meet the chosen commit/retry contract. Retrying a batch can duplicate effects unless processing is idempotent or deduplicated appropriately. The fixture uses actual islice to produce fixed-input batches; it does not persist checkpoints or execute external side effects."
      ]
    ],
    "problem": "Consume a fixed iterator into bounded batches including the final partial batch.",
    "steps": [
      "Identify the required semantics and name the input-size variables.",
      "Run the actual standard-library operations on the fixed synthetic input.",
      "Check the result and distinguish this correctness fixture from a workload benchmark."
    ],
    "code": "from itertools import islice\ndef batches(values, size):\n    if size <= 0:\n        raise ValueError(\"size must be positive\")\n    source = iter(values)\n    while True:\n        batch = list(islice(source, size))\n        if not batch:\n            return\n        yield batch\nprint(list(batches(range(7), 3)))\nprint(list(batches([], 3)))\ntry:\n    list(batches(range(3), 0))\nexcept ValueError as error:\n    print(error)",
    "expect": "[[0, 1, 2], [3, 4, 5], [6]]\n[]\nsize must be positive",
    "result": "Actual islice batching handles a remainder, emptiness and invalid size. The print consumer materializes all fixture batches and is not a production memory claim.",
    "mistakes": [
      "A lazy producer does not bound memory retained by a consumer.",
      "Offset continuation is not a stable snapshot under mutations."
    ],
    "takeaways": [
      "Consume a fixed iterator into bounded batches including the final partial batch.",
      "Actual islice batching handles a remainder, emptiness and invalid size. The print consumer materializes all fixture batches and is not a production memory claim."
    ],
    "refs": [
      "itertools",
      "structures"
    ],
    "q": [
      [
        "E",
        "What must a batch size normally be under this contract?",
        "Positive integer",
        "Any negative value",
        "Always zero",
        "An arbitrary secret",
        "Positive sizes permit progress with a bounded nonempty batch.",
        "Negative sizes violate the contract.|Zero cannot process items here.|Secrets are unrelated."
      ],
      [
        "E",
        "Which standard-library tool consumes a bounded portion of an iterator?",
        "islice",
        "Counter alone",
        "heapify alone",
        "hash alone",
        "islice selects a bounded iterator segment.",
        "Counter counts categories.|heapify orders a heap.|hash computes a key hash."
      ],
      [
        "M",
        "Seven items are batched by three. What must happen to the last item?",
        "Final partial batch",
        "Always discarded",
        "Duplicated into all batches",
        "Converted to a secret",
        "A correct coverage policy includes the remainder.",
        "Discarding loses work.|Duplication changes coverage.|Secrets are unrelated."
      ],
      [
        "M",
        "The consumer stores every processed batch in a list. What can happen to memory?",
        "It grows with all output",
        "It stays at one batch always",
        "It moves to disk automatically",
        "It becomes zero",
        "Retaining results defeats a claim that only one batch is stored.",
        "Producer laziness does not constrain consumer retention.|No spill is inherent.|Stored output occupies memory."
      ],
      [
        "H",
        "An offset page is read while earlier rows are deleted. What risk exists?",
        "Skipped items",
        "Guaranteed snapshot",
        "Automatic stable ordering",
        "Perfect deduplication",
        "Positions can shift, causing continuation by offset to miss or repeat records.",
        "Snapshot semantics need a separate design.|Ordering alone does not freeze positions.|Offsets do not deduplicate."
      ],
      [
        "H",
        "A job crashes after effects but before its progress marker. What must retries address?",
        "Duplicate effects",
        "Only variable casing",
        "Only source comments",
        "Only table captions",
        "Repeating the batch can repeat side effects unless the operation has an appropriate retry/deduplication contract.",
        "Casing does not coordinate commits.|Comments do not enforce retries.|Captions do not provide idempotency."
      ]
    ]
  }
];
module.exports=course('practical-data-structures',lessons,[
  {
    "id": "structures",
    "title": "Python 3.13 official source: Doc/tutorial/datastructures.rst",
    "url": "https://github.com/python/cpython/blob/42155a0feaca9ba6991942c323cbe9fb7278be3c/Doc/tutorial/datastructures.rst",
    "source": {
      "repo": "python/cpython",
      "commit": "42155a0feaca9ba6991942c323cbe9fb7278be3c",
      "path": "Doc/tutorial/datastructures.rst",
      "verification": "Pinned official CPython source. Original synthetic standard-library fixtures; average hash-table costs explicitly depend on key and collision assumptions. No production benchmark or distributed queue claim."
    }
  },
  {
    "id": "collections",
    "title": "Python 3.13 official source: Doc/library/collections.rst",
    "url": "https://github.com/python/cpython/blob/42155a0feaca9ba6991942c323cbe9fb7278be3c/Doc/library/collections.rst",
    "source": {
      "repo": "python/cpython",
      "commit": "42155a0feaca9ba6991942c323cbe9fb7278be3c",
      "path": "Doc/library/collections.rst",
      "verification": "Pinned official CPython source. Original synthetic standard-library fixtures; average hash-table costs explicitly depend on key and collision assumptions. No production benchmark or distributed queue claim."
    }
  },
  {
    "id": "heapq",
    "title": "Python 3.13 official source: Doc/library/heapq.rst",
    "url": "https://github.com/python/cpython/blob/42155a0feaca9ba6991942c323cbe9fb7278be3c/Doc/library/heapq.rst",
    "source": {
      "repo": "python/cpython",
      "commit": "42155a0feaca9ba6991942c323cbe9fb7278be3c",
      "path": "Doc/library/heapq.rst",
      "verification": "Pinned official CPython source. Original synthetic standard-library fixtures; average hash-table costs explicitly depend on key and collision assumptions. No production benchmark or distributed queue claim."
    }
  },
  {
    "id": "itertools",
    "title": "Python 3.13 official source: Doc/library/itertools.rst",
    "url": "https://github.com/python/cpython/blob/42155a0feaca9ba6991942c323cbe9fb7278be3c/Doc/library/itertools.rst",
    "source": {
      "repo": "python/cpython",
      "commit": "42155a0feaca9ba6991942c323cbe9fb7278be3c",
      "path": "Doc/library/itertools.rst",
      "verification": "Pinned official CPython source. Original synthetic standard-library fixtures; average hash-table costs explicitly depend on key and collision assumptions. No production benchmark or distributed queue claim."
    }
  },
  {
    "id": "dictimpl",
    "title": "Python 3.13 official source: Objects/dictobject.c",
    "url": "https://github.com/python/cpython/blob/42155a0feaca9ba6991942c323cbe9fb7278be3c/Objects/dictobject.c",
    "source": {
      "repo": "python/cpython",
      "commit": "42155a0feaca9ba6991942c323cbe9fb7278be3c",
      "path": "Objects/dictobject.c",
      "verification": "Pinned official CPython source. Original synthetic standard-library fixtures; average hash-table costs explicitly depend on key and collision assumptions. No production benchmark or distributed queue claim."
    }
  }
]);
