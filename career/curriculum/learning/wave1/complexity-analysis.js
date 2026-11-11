'use strict';
const {course}=require('./wave4-dsa-helper');
module.exports=course("complexity-analysis",[
  {
    "slug": "count-operations",
    "title": "Define the input and count a basic operation",
    "intro": "An inventory report scans product records. Before predicting growth, define n as the number of records and choose a basic operation such as comparing one stock count with a threshold. This creates a model that can be checked independently of a laptop’s speed.",
    "sections": [
      [
        "From a program to a cost function",
        "For a loop over n records with one constant-cost comparison per record, the count is n. Loop setup and returning a result add fixed work, giving a model such as an+b for constants a and b. Big-O expresses an eventual upper bound: T(n) is O(f(n)) when constants c and n=0 exist with T(n) <= c f(n) for all n >= n=0. It is not the exact operation count, nor a measurement in milliseconds.",
        "State which operations are assumed constant. Comparing arbitrarily long customer names can depend on their shared prefix length. Reading a database row can incur network and storage costs absent from a RAM model. Keep those dimensions explicit rather than assigning every statement one universal cost."
      ],
      [
        "Bounds and business limits",
        "A tight Theta bound has both an upper and lower bound of the same order. Saying a linear scan is O(n squared) is a valid loose upper bound, but Theta(n) communicates more useful growth information. Omega is a lower bound, not another name for best case; choose the input family and case before deriving it.",
        "A retailer processing 200 rows may prefer a clear scan to a complicated index. Complexity helps identify scaling risk, while correctness, implementation effort and measured constants determine the final choice. The fixture counts comparisons for two input sizes. Its output supports this count on these inputs; the loop structure supplies the general argument."
      ]
    ],
    "problem": "Count threshold comparisons for a complete stock scan, independent of how many items match.",
    "steps": [
      "Define the input size as the number of stock values.",
      "Increment the counter once for each evaluated threshold.",
      "Compare both the count and filtered result with the full-scan rule."
    ],
    "code": "def scan(xs):\n    count=0; low=[]\n    for x in xs:\n        count+=1\n        if x<3: low.append(x)\n    return count,low\nprint(scan([1,4,2]))\nprint(scan([9,8,7,6,5,4]))",
    "expect": "(3, [1, 2])\n(6, [])",
    "limit": "The actual Python fixture verifies one comparison per supplied element. It does not measure CPU time, database access or arbitrary-length comparison costs.",
    "mistakes": [
      "Do not substitute the number of matches for input size: unsuccessful comparisons still execute.",
      "Do not treat O(n) as an exact duration; first state the counted operation and its cost assumption."
    ],
    "takeaways": [
      "A cost model starts with an input definition and operation.",
      "Theta identifies tight growth; upper bounds alone may be loose."
    ],
    "practice": [
      "What does n denote in the shown stock scan?|Number of input records|Number of matching records|Number of output columns|Number of CPU cores|Every input record is inspected whether or not it matches.",
      "For a complete scan with one comparison per element, which count is exact?|n comparisons|n squared comparisons|log n comparisons|One comparison total|The loop evaluates its predicate once for each element.",
      "A string comparison may inspect a long common prefix. Which assumption needs refinement?|Constant comparison cost|The number of records|The existence of a loop|The order of the result|The work inside one comparison may depend on string length.",
      "A shop’s scan finds no low-stock records among 300 rows. How many predicates execute?|300|0|1|90000|No match changes the output size, not the full-scan count.",
      "Which notation states an eventual upper bound?|Big-O|A wall-clock sample|An output checksum|A memory address|Big-O bounds growth up to a constant after a threshold.",
      "A billing team needs a tight growth claim for a full constant-cost scan. Which is strongest here?|Theta(n)|O(n cubed)|Omega(1)|A single timing sample|The scan performs both at least and at most constant multiples of n work."
    ],
    "formal": [
      "In algorithm analysis, what must be defined before counting work?|Input-size variable|Only output row counts|Only successful matches|Only elapsed CPU cycles|The size variable states which growing quantity the count describes.",
      "What distinguishes a tight Theta bound from an upper bound alone?|Both growth bounds|An upper bound alone|A lower bound alone|An expected value alone|Theta combines asymptotic upper and lower bounds of the same order.",
      "For T(n)=7 n+12, which is a tight asymptotic bound?|Theta(n)|Theta(1)|Theta(log n)|Theta(n squared)|The linear term dominates fixed overhead under this model.",
      "A hospital scans every patient record once, including records excluded from its report. Which quantity controls predicate work?|Total records read|Only included patients|Only hospital departments|Only report page count|All inspected records contribute a predicate evaluation.",
      "A comparison of two codes can inspect up to m characters. A full scan contains n such comparisons. Which worst-case model is justified?|O(nm)|O(n+m) always|O(log(nm))|O(1) always|There can be n comparisons each costing up to a constant multiple of m.",
      "A courier counts operations on 10 and 20 rows. Counts double. What does this evidence establish by itself?|Counts on sampled inputs|A universal linear proof|A universal latency limit|A proof of constant work|Finite observations can support examples but do not prove every input-size bound.",
      "A stock scan reads all 200 records with one counted comparison each and writes only 40 matches at two counted operations per write. Setup is excluded and the budget is 300 operations. Which conclusion follows?|280 operations; within budget|400 operations; over budget|8000 operations; over budget|240 operations; within budget|Sequential work adds:200 comparisons plus 2 times 40 writes equals 280. Multiplying stage counts or ignoring write width gives the wrong result.",
      "Two correct methods have stated worst-case counts A(n)=4 n+20 and B(n)=n squared/2. The maximum input is 100 and the count budget is 500. Which admission decision follows from these models alone?|Admit A; reject B|Admit both methods|Reject A; admit B|Reject both methods|At n=100 the counts are 420 and 5000. Both can be described by loose quadratic upper bounds, but their concrete supported-size counts determine this operation-budget decision.",
      "An account scan compares n labels. Comparison stops at the first unequal code point, but labels may share a prefix of length m. The contract bounds n at 1000 and m at 200. Which worst-case comparison-count budget is justified?|Up to 200000 character tests|Up to 1200 character tests|Up to 1000 character tests|Up to 200 character tests|There can be 1000 comparisons each inspecting 200 characters. Early mismatches improve some inputs but do not remove the allowed common-prefix worst case.",
      "Two scans have abstract counts A(n)=5 n+40 and B(n)=8 n+3 for positive integer n. A counted primitive takes 2 microseconds in A and 1 in B, with all other cost excluded. Which statement is correct?|A has fewer counts from n=13; B stays faster|A has fewer counts from n=12; A stays faster|B has fewer counts from n=13; A stays faster|Counts and modeled times cross together at n=13|The count inequality 5 n+40<8 n+3 requires n>37/3, so the first integer is 13. Modeled durations are 10 n+80 and 8 n+3, making B faster for every positive n despite count crossover."
    ]
  },
  {
    "slug": "nested-and-dependent-loops",
    "title": "Sum dependent iterations rather than counting loop syntax",
    "intro": "A warehouse compares each pair of distinct bins to detect an overlap rule. Two written loops do not automatically imply the same count as two independent loops: the inner range may depend on the outer index.",
    "sections": [
      [
        "Independent and triangular counts",
        "For each of n users, iterating all m products produces nm pairs. If m is a fixed configuration bound, this is linear in n; if m also grows like n, it is quadratic. Name both sizes until the relationship is specified. Sequential loops over n and m elements instead cost O(n+m), since neither repeats the other.",
        "For unordered distinct pairs, choose i from 0 through n-1 and j from i+1 through n-1. The row counts are n-1, n-2, down to zero. Their sum is n(n-1)/2, which is Theta(n squared). Removing symmetric duplicate comparisons halves the leading coefficient but does not change the growth class."
      ],
      [
        "Bound the actual work",
        "An early break can make a best-case count small while leaving the worst case unchanged. Identify the condition that causes the longest execution, such as no overlap ever being found. Likewise, two nested loops may still be linear if an inner pointer advances across the input only once across all outer iterations. Use an aggregate argument rather than multiplying visual loop bounds.",
        "The fixture emits each bin pair once and checks its count against the triangular formula. For large real datasets, a spatial index may reduce candidate comparisons under suitable geometry assumptions. That algorithmic change needs an independent correctness argument: simply skipping comparisons to hit a time budget can miss real overlaps."
      ]
    ],
    "problem": "Enumerate unordered distinct bin pairs and verify the triangular count.",
    "steps": [
      "Exclude self-pairs by starting j after i.",
      "Store one representative of each unordered pair.",
      "Compare the actual pair count with n(n-1)/2."
    ],
    "code": "n=5\npairs=[(i,j) for i in range(n) for j in range(i+1,n)]\nprint(len(pairs))\nprint(n*(n-1)//2)\nprint(len(set(pairs))==len(pairs))",
    "expect": "10\n10\nTrue",
    "limit": "The fixture checks pair enumeration for five bins. The sum of dependent ranges, not this single run, establishes the general quadratic count.",
    "mistakes": [
      "Do not multiply n by n for loops whose bounds depend on i without checking the sum.",
      "Do not describe a constant-factor reduction as a new asymptotic growth class."
    ],
    "takeaways": [
      "Nested loops require a count of executed inner operations.",
      "Retain multiple input dimensions until their relationship is known."
    ],
    "practice": [
      "Two sequential loops scan n and m records. Which count model fits?|n+m|nm|n to power m|log(n+m)|Sequential scans add their operation counts.",
      "How many unordered distinct pairs exist among five bins?|10|5|20|25|The count is five times four divided by two.",
      "An inner loop has a fixed maximum of 12 steps per row. Which bound applies to n rows?|O(n)|O(n squared)|O(log n)|O(1)|Multiplication by a fixed constant preserves linear growth.",
      "A matching job compares n customers with m offers. What should remain explicit?|Both n and m|Only successful matches|Only customer count|Only offer ordering|The two independent growing dimensions produce nm comparisons.",
      "Which sum counts a triangular pair loop?|n(n-1)/2|n+n|n factorial|2 to power n|Each unordered distinct pair is represented once.",
      "A pointer inside a nested loop never moves backward and advances at most n times overall. What bound can its advances have?|O(n) total|O(n squared) always|O(2 to power n)|O(n factorial)|Aggregate movement can be linear despite syntactic nesting."
    ],
    "formal": [
      "Which relationship describes independent nested iteration counts?|Product of range sizes|Sum of source lines|Maximum source indent|Minimum output length|Each outer iteration executes the full independent inner range.",
      "What is the tight growth of n(n-1)/2?|Theta(n squared)|Theta(n)|Theta(log n)|Theta(n cubed)|The quadratic term dominates the lower linear term.",
      "For n=4, how many pairs satisfy 0 <= i < j < n?|6|4|8|16|The dependent row counts are three, two, one and zero.",
      "A subscription service scans all users and then all plans once. Why is O(users times plans) unnecessarily loose?|The stages are sequential|The data is confidential|The output is sorted|The names are unequal|Neither scan is repeated for every element of the other collection.",
      "A fraud checker stops at the first suspicious pair. No pair is suspicious in the supplied workload. Which count is relevant to this run?|All candidate pairs|Only the first pair|Only suspicious pairs|Only the user count|The early exit never triggers, so every planned comparison executes.",
      "A catalog algorithm compares each item with its next four neighbors. Which assumption supports linear growth?|Fixed neighbor limit|Every item is unique|The catalog is sorted|Every comparison matches|At most four comparisons per item gives a constant multiple of n.",
      "A symmetric overlap predicate costs exactly 3 counted tests per candidate. Replacing ordered distinct pairs with unordered pairs for n=20 keeps results equivalent. Which new count and growth claim are correct?|570 tests; still quadratic|1140 tests; becomes linear|190 tests; becomes logarithmic|60 tests; stays quadratic|There are 20 times 19 divided by 2=190 unordered candidates and 3 tests each, giving 570. Removing the duplicate direction changes the coefficient, not the quadratic class.",
      "A regional report has 12 disjoint partitions containing 1000 transactions in total. It performs 2 operations per partition and 3 per visited transaction, visiting each once. Which total follows?|3024 operations|36024 operations|12000 operations|3012 operations|Partition setup adds 12 times 2=24, while disjoint transaction processing adds 1000 times 3=3000. The nested syntax does not repeat all 1000 transactions in every partition.",
      "A catalog has n rows and exactly 8 configured fields. Validating each field costs 5 counted operations and row setup costs 2. A budget of 10000 operations applies. What largest n fits this stated model?|238 rows|250 rows|1250 rows|2000 rows|Each row costs 8 times 5+2=42. Floor division 10000 by 42 gives 238, with cost 9996;239 rows exceed the budget.",
      "An overlap engine uses unordered pairs among n=100 shapes. Each candidate compares up to 6 coordinates and a separate output stage writes 100 labels at 2 operations each. Which upper count follows?|29900 operations|30000 operations|59400 operations|50600 operations|There are 4950 unordered pairs. Six coordinate operations per pair give 29700; the separate output stage adds 200, totaling 29900."
    ]
  },
  {
    "slug": "logarithms-and-recurrences",
    "title": "Trace shrinking problems and recursive call trees",
    "intro": "A sorted booking archive can be searched by repeatedly discarding half the remaining interval. A divide-and-conquer report may instead recurse into both halves. Both shrink inputs, but their total work differs because the number of active subproblems differs.",
    "sections": [
      [
        "Halving versus branching",
        "A loop that repeatedly replaces a positive integer n by n//2 executes floor(log2 n)+1 iterations when it counts the starting value and stops at zero. If each iteration performs bounded work, its count is Theta(log n). The logarithm base changes a constant factor, not the growth class. A loop that subtracts one instead performs n iterations.",
        "Recursion needs both a progress rule and a base case. A single recursive call on half the input with constant local work satisfies T(n)=T(n/2)+O(1), giving logarithmic work and logarithmic stack depth. Two half-size recursive calls can visit all leaves even though every path is short."
      ],
      [
        "Sum levels of a call tree",
        "For a balanced merge-style recurrence T(n)=2 T(n/2)+Theta(n), there are logarithmically many levels and linear aggregate work per level, giving Theta(n log n). This reasoning assumes work splits and combining costs follow the stated bounds. A skewed partition may invalidate the balanced-tree assumption.",
        "A business report may choose iterative binary search to keep stack use constant, but the sorted-data precondition still matters. The fixture counts halving steps without timing them. It demonstrates a logarithmic pattern on powers of two and nearby values; it does not certify the cost of an arbitrary recursive function."
      ]
    ],
    "problem": "Count repeated integer-halving steps and distinguish them from total recursive nodes.",
    "steps": [
      "Count a step before halving the current positive value.",
      "Stop precisely when integer division reaches zero.",
      "Compare powers of two and their adjacent values."
    ],
    "code": "def steps(n):\n    k=0\n    while n>0:\n        k+=1; n//=2\n    return k\nprint([steps(n) for n in [0,1,7,8,16]])",
    "expect": "[0, 1, 3, 4, 5]",
    "limit": "The counter checks the shown integer-halving loop. Recursive call counts require a separate branching and local-work model.",
    "mistakes": [
      "Do not infer total recursive work from recursion depth alone.",
      "Do not assume balanced partitions when input-dependent pivots can create skew."
    ],
    "takeaways": [
      "Halving yields logarithmic path length under bounded per-step work.",
      "A recurrence must include branch count, subproblem sizes and local work."
    ],
    "practice": [
      "How many positive-value iterations does repeated floor halving take from 8?|4|3|8|16|The values are eight, four, two and one before zero.",
      "What is missing from a recursion-depth-only runtime argument?|Total branch work|Only the recursion depth|Only the output length|Only one chosen branch|Many branches can share the same short maximum depth.",
      "A search discards half its remaining interval per step with bounded work. Which growth follows?|Theta(log n)|Theta(n)|Theta(n squared)|Theta(2 to power n)|The number of halving steps grows logarithmically.",
      "A report recursively visits both halves of every range. Can depth alone prove logarithmic total work?|No; count all calls|Yes; every split halves|Yes; names do not matter|No; recursion is always quadratic|The total call tree includes branches outside one root-to-leaf path.",
      "Which recurrence includes linear combine work on two halves?|2 T(n/2)+Theta(n)|T(n-1)+Theta(1)|T(n/2)+Theta(1)|2 T(n)+Theta(1)|Both half-size subcalls and their combining stage must appear.",
      "A pivot leaves a partition of n-1 elements repeatedly. What assumption has failed?|Balanced shrinking|Input finiteness|The existence of a base case|The return type|Repeatedly reducing by one does not create a logarithmic-depth balanced tree."
    ],
    "formal": [
      "What input transformation directly produces repeated halving?|Integer division by two|Subtracting one each time|Appending another record|Multiplying by two each time|Repeated division reduces the remaining magnitude geometrically.",
      "What must prevent recursive self-calls forever?|A decreasing measure|A descriptive function name|A longer error message|A global output list|A well-founded measure moves toward a reachable base case.",
      "For T(n)=T(n/2)+Theta(1), what is the usual bound?|Theta(log n)|Theta(n log n)|Theta(n squared)|Theta(n factorial)|There is one bounded-work subproblem per halving level.",
      "A hospital merge report combines all n records at each balanced level. Why is total work n log n?|Linear work per level|Only two calls exist|Each record is read once|Every level costs one step|There are logarithmically many balanced levels with linear aggregate combine work.",
      "A search reduces 1,024 ordered entries by half until one remains. How many halvings are required?|10|11|512|1024|Two to the tenth is 1,024, so ten halvings leave one entry.",
      "A recursive range sum has logarithmic depth but visits every leaf. Which statement is justified?|Depth differs from work|Total work is logarithmic|No elements are inspected|The stack holds every leaf|A shallow branching tree can still contain a linear number of visited nodes.",
      "A full binary range-sum tree has n=1024 leaves. Every internal node makes two half-size calls and does one counted addition, while leaves do none. Which addition count and frame-depth claim follow?|1023 additions;11 active levels|10 additions;1024 active levels|1024 additions;1024 active levels|2047 additions;10 active levels|A full binary tree with 1024 leaves has 1023 internal nodes. The root-to-leaf path has log2(1024)+1=11 active levels including both endpoints.",
      "A scheduler recurses once on n-1 remaining tasks and performs 3 operations per nonempty call, stopping at zero. For n=600 under a maximum of 500 active calls, which result is justified?|1800 work units; depth limit exceeded|1800 work units; depth always logarithmic|600 work units; within the depth limit|90000 work units; within the depth limit|The 600 nonempty calls perform 1800 operations, and the active chain includes at least 600 task frames. Reducing by one is not balanced halving and breaches the 500-frame limit.",
      "Binary search on n=1048576 sorted entries performs at most about 21 endpoint-inclusive comparisons in this implementation. Its recursive version keeps 32 modeled bytes per active frame; an iterative version uses 128 modeled bytes. Which space comparison is supported?|Recursive about 672 bytes; iterative 128|Recursive 32 bytes; iterative 672|Both require 1048576 frames|Both require identical auxiliary space|Under the stated frame model,21 times 32 is 672 bytes. Iteration can retain only bounded loop state, while sortedness and logarithmic search work remain necessary.",
      "A balanced routine obeys T(1)=0 and T(n)=2 T(n/2)+n squared for power-of-two n. Which exact value at n=8 and growth are correct?|T(8)=112; Theta(n squared)|T(8)=24; Theta(n log n)|T(8)=64; Theta(n)|T(8)=512; Theta(n cubed)|T(2)=4,T(4)=24 andT(8)=112. Each level's squared local costs form a decreasing geometric sum, so total growth is quadratic."
    ]
  },
  {
    "slug": "auxiliary-and-output-space",
    "title": "Separate input, output and peak auxiliary storage",
    "intro": "An order export must hold its returned rows somewhere. An algorithm can avoid temporary arrays yet still produce an output proportional to the input. Space claims should identify what is counted and when memory is simultaneously live.",
    "sections": [
      [
        "Choose the accounting boundary",
        "Auxiliary space counts additional working storage beyond the given input and, under a common convention, beyond the required output. Total space can include all three. State the convention instead of advertising constant memory while silently retaining a growing result. Peak space counts simultaneously live allocations rather than the sum of every allocation ever made.",
        "An in-place update reuses existing input storage, but the implementation may still allocate loop state or a recursion stack. A shallow copy duplicates a container of references without recursively cloning its members. That is a linear number of new reference slots, not a constant-space operation merely because the referenced objects are shared."
      ],
      [
        "Streaming has a contract",
        "A streaming filter can keep one current record and yield results incrementally. Its bounded auxiliary memory depends on the consumer not collecting the entire stream and on downstream stages not buffering without limits. Sorting an arbitrary stream generally needs more than one-record state unless external storage or stronger assumptions are available.",
        "The fixture compares a materialized result with a generator consumed one item at a time. It verifies matching values, not allocator byte counts. For a production export, model buffers, serialization, compression and backpressure as well as the core loop. Bounded iteration alone does not prove a whole request has bounded memory."
      ]
    ],
    "problem": "Compare a materialized filter with a lazy iterator while keeping output values identical.",
    "steps": [
      "Build a list containing all selected rows.",
      "Create an iterator that yields one selected row at a time.",
      "Consume the iterator and compare the resulting values."
    ],
    "code": "xs=[1,2,3,4,5]\nmaterialized=[x for x in xs if x%2]\nlazy=(x for x in xs if x%2)\nprint(materialized)\nprint(next(lazy),next(lazy),next(lazy))",
    "expect": "[1, 3, 5]\n1 3 5",
    "limit": "The fixture checks selection and lazy consumption. It does not measure resident memory or downstream buffering.",
    "mistakes": [
      "Do not exclude a growing result without stating that output space is excluded.",
      "Do not call a copied reference container constant-space because its elements are shared."
    ],
    "takeaways": [
      "Report auxiliary and output space separately.",
      "Peak live state, not allocation history alone, controls the storage bound."
    ],
    "practice": [
      "What does peak auxiliary space measure?|Simultaneously live workspace|Every input byte on disk|All historical allocations|Only returned value count|Peak workspace concerns additional live working state under a stated boundary.",
      "A filter returns n selected rows in a new list. What storage must exist for that output?|Theta(n) result slots|Theta(1) result slots|Theta(log n) result slots|No storage of any kind|The returned container needs a slot for every selected row.",
      "A shallow list copy shares its element objects. What still grows with list length?|New reference slots|Deeply cloned objects|The integer index width only|The source file length|A separate list container stores a linear number of references.",
      "A CSV iterator yields one row but its caller collects every row. Which claim fails for the whole flow?|Constant total memory|The rows are iterable|The predicate executes|The output preserves order|The consumer materializes a growing output even if the producer is lazy.",
      "Which boundary should accompany a space claim?|Input/output inclusion|Only processor frequency|Only program title|Only deployment region|Space conventions differ in whether existing input and required output count.",
      "A report repeatedly creates and frees one n-slot buffer before the next. What is its peak buffer count?|One live buffer|One buffer per iteration|No live buffer ever|n squared live buffers|Sequentially freed buffers do not coexist under the stated lifetime."
    ],
    "formal": [
      "Which storage is commonly excluded from auxiliary-space accounting?|Required output storage|Temporary working buffers|Active recursion frames|Extra indexing tables|Auxiliary-space conventions usually separate required output from workspace.",
      "What does a lazy iterator defer?|Producing later values|The existence of input|All input validation forever|Every possible allocation|An iterator can produce items on demand without materializing the entire result first.",
      "A function copies n references before filtering them. Which auxiliary bound is tight for that copy?|Theta(n)|Theta(1)|Theta(log n)|Theta(n squared)|The additional container stores n reference positions.",
      "A university export yields each student record, but compression buffers the entire document. Which component defeats bounded flow memory?|Whole-document buffering|Bounded record iteration|A constant-size predicate|Fixed stream cursor state|The complete pipeline includes downstream buffering, not just the producer.",
      "A service allocates two n-element arrays simultaneously, then frees both. Which bound describes their peak aggregate slots?|Theta(n)|Theta(n squared)|Theta(log n)|Theta(1)|Two linear arrays differ by a constant factor from one linear array.",
      "A process allocates n one-element temporary objects sequentially and releases each before continuing. What follows from those lifetimes alone?|Constant live-object count|Linear live-object count|Quadratic live-object count|No allocation work at all|Peak simultaneous count differs from total allocation events.",
      "An API must return all n=50000 selected IDs as one materialized array and uses 2 scalar counters. Under a slot model that excludes given input and required output from auxiliary space, which statement is correct?|50000 output slots; constant auxiliary|2 output slots; linear auxiliary|Constant output and total storage|Quadratic output; constant total storage|The returned array grows with the 50000 selected IDs. Only the two counters remain when required output is excluded from auxiliary accounting.",
      "A disk sorter loads 100000 keys with 24 modeled bytes per key and retains a 256000-byte merge buffer. A 2 MiB cap applies to these modeled allocations. Which claim follows?|About 2.66 MB modeled; cap exceeded|About 2.66 MB modeled; cap satisfied|Only 256000 bytes; cap satisfied|Only 100000 bytes; cap satisfied|Keys alone use 2400000 bytes; adding 256000 gives 2656000, above 2097152 bytes. Disk-resident input does not remove resident key storage.",
      "A pipeline has 1000-row batches at 80 modeled bytes per row and holds 10 queued batches plus one active batch. Ignoring all other state, what peak batch storage must be budgeted?|880000 bytes|80000 bytes|800000 bytes|88000 bytes|Eleven batches can coexist, each 80000 bytes. Bounding batch size without bounding queued batch count does not bound the complete flow.",
      "A report holds its given n-slot input, builds an n-slot required result and reuses a 10-slot working buffer throughout. Under an auxiliary convention excluding given input and required output, which pair is correct?|Total 2 n+10; auxiliary 10|Totaln+10; auxiliaryn|Total 10; auxiliary 2 n|Total 2 n; auxiliaryn+10|All live slots total 2 n+10. Removing the given input and required result from auxiliary accounting leaves the fixed 10-slot buffer."
    ]
  },
  {
    "slug": "stack-and-recursive-space",
    "title": "Count active recursion frames and copied subproblems",
    "intro": "A recursive search may keep only one branch active at a time, yet each active call still needs a frame. If every call also copies a smaller array, the retained copies can dominate memory even when the number of calls appears modest.",
    "sections": [
      [
        "Depth determines simultaneous frames",
        "For a recursion that makes one n-1 call before returning, as many as n frames coexist. For a balanced one-half recursion, depth is logarithmic. Two sequential recursive calls do not require both entire subtrees to remain active; peak frame count follows the deepest active path, not all calls ever visited.",
        "Python does not guarantee tail-call elimination. Rewriting a function to place its recursive call in tail position does not by itself remove stack use. Deep inputs can exceed an implementation recursion limit even when an abstract algorithm terminates correctly. An explicit stack or loop can make control storage and limits more visible."
      ],
      [
        "Copy lifetimes change the model",
        "Consider a function that recurses on xs[1:] while retaining its current xs. The live lists can have lengths n, n-1 and so on down the active path. The sum is quadratic in n reference slots. Passing an index into one shared input avoids those list copies, although the recursive frames still cost linear space.",
        "The worked count computes retained slot totals for a slicing model and compares them with one input plus a linear frame count. It is an analytical model executed with integers, not a Python allocator inspection. Use explicit object lifetimes and language semantics before translating asymptotic space into a real memory budget."
      ]
    ],
    "problem": "Compare retained copied-list lengths with a shared-input index model.",
    "steps": [
      "List the lengths retained on a depth-n slicing path.",
      "Sum those lengths to obtain the live-slot model.",
      "Contrast that sum with n scalar frame positions."
    ],
    "code": "n=6\nlive_copy_slots=sum(range(1,n+1))\nprint(live_copy_slots)\nprint(n)\nprint(n*(n+1)//2==live_copy_slots)",
    "expect": "21\n6\nTrue",
    "limit": "The calculation verifies a stated lifetime model. It does not allocate recursive frames or establish CPython object byte sizes.",
    "mistakes": [
      "Do not count the full call tree as simultaneously active stack frames.",
      "Do not assume tail recursion is automatically optimized away in Python."
    ],
    "takeaways": [
      "Stack space depends on maximum active depth.",
      "Copied subproblem storage can exceed the frame count."
    ],
    "practice": [
      "What controls the peak number of active recursive frames?|Maximum call depth|Total source line count|Total returned records only|The function identifier|Frames remain live along the current nested call path.",
      "In Python, does tail position alone guarantee constant stack use?|No|Yes for every function|Yes for list arguments|Only when names are short|Python does not promise tail-call elimination.",
      "A path retains lists of lengths 4,3,2,1. What is their aggregate length?|10|4|8|16|Retained copy slots add to the triangular sum.",
      "A parser recurses on an index into one shared input. Which extra cost can this avoid?|Repeated slice copies|Every recursive frame|Every boundary check|The original input storage|Index-based ranges can share the existing container instead of copying suffixes.",
      "Two half-size branches run sequentially. Must their complete recursion trees coexist?|No|Yes for every divide step|Yes whenever inputs are equal|Only when depth is even|Peak liveness follows active calls and explicitly retained data.",
      "A recursive routine terminates but fails on very deep input. Which boundary can explain it?|Runtime recursion limit|A proof of infinite loops|A mandatory quadratic result|A guaranteed memory leak|A finite algorithm can still exceed the implementation’s stack/depth limits."
    ],
    "formal": [
      "What does one recursive frame represent?|One active call’s state|Every future branch together|An entire input clone always|Only the final output value|A call frame holds state needed while that invocation remains active.",
      "Which technique can remove recursive call frames from a linear walk?|A loop with explicit state|A tail-position self-call|A larger recursion limit|A deeper base-case guard|Iteration expresses the control flow without nested recursive invocations.",
      "For balanced half-size recursion along one path, what is frame depth?|Theta(log n)|Theta(n squared)|Theta(n factorial)|Theta(n)|Halving the size at each active level creates logarithmic depth.",
      "A billing function processes n-1 items recursively and keeps one scalar per call. Which auxiliary bound fits its active frames?|Theta(n)|Theta(1)|Theta(log n)|Theta(n squared)|One fewer item per level permits a linear number of simultaneously active calls.",
      "A function retains copied suffixes with lengths n,n-1,...,1. Which slot bound follows?|Theta(n squared)|Theta(log n)|Theta(n)|Theta(1)|The sum of retained linear suffix lengths is triangular and quadratic.",
      "A tree walk visits one million nodes with maximum depth 20 and bounded per-frame state. What limits its stack frame count?|The active depth near 20|All visited node counts|The result label count|Total function call count|Sequential traversal does not keep all visited call frames active.",
      "A DFS converts recursion to an explicit stack by pushing every pending child. A star graph has one center and 10000 leaf children; a path graph has 10001 nodes. Under that push-all strategy, which peak pending-state comparison can hold?|Star about 10000; path about 1|Both always logarithmic in nodes|Star about 1; path about 10000|Both always equal recursive depth|An explicit pending stack can hold all siblings at once in the star, while a path offers only one next child. Removing recursion does not guarantee a particular frontier bound.",
      "A Python parser needs a chain of 1200 nested calls. Its configured recursion limit is 1000; raising it to 2000 makes one sample pass. Which deployment claim remains unsupported?|All allowed depths are resource-safe|The sample used deeper recursion|The configured limit increased|Frames still consume memory|The raised guard changes one limit but does not prove safety under actual native stack, memory or larger valid input depths. A sample is not an unbounded guarantee.",
      "A recursion has depth n=100 and allocates a fresh 100-slot array per active level, retaining every array until return. Index arguments avoid input slices. What peak extra array storage follows?|10000 slots|100 slots|200 slots|5050 slots|Each of 100 active levels retains a 100-slot array. Avoiding suffix copies does not remove these separately allocated 10000 slots.",
      "A balanced recursive search on n=4096 has one active path of 13 levels and constant 16-slot frame state. Its shared 4096-slot input is excluded from auxiliary accounting. What auxiliary frame count follows?|208 slots|4096 slots|65536 slots|13 slots|Including the root and leaf gives 13 active levels. Multiplying by 16 modeled slots per level yields 208, which grows logarithmically with n under the stated balanced recursion."
    ]
  },
  {
    "slug": "amortized-growth",
    "title": "Distinguish expensive operations from amortized sequence cost",
    "intro": "A growing event buffer can occasionally copy all stored references into a larger allocation. An individual append may be expensive even though a long sequence of appends has linear total movement under geometric capacity growth.",
    "sections": [
      [
        "Analyse a sequence, not a random average",
        "Amortized analysis bounds total cost over a sequence of operations without assuming a probability distribution. Suppose an abstract dynamic array doubles capacity when full. Expansions copy 1,2,4,... references. Across n appends, the copied references sum to less than 2 n, and the n direct writes add another linear term. Thus appending has constant amortized cost in this model.",
        "This does not mean every append costs constant time. The append that triggers an expansion can copy a linear number of existing elements. Worst-case latency and amortized throughput answer different questions, so a real-time ingestion system may need reserved capacity, chunking or another bounded-latency design."
      ],
      [
        "Growth policy matters",
        "Increasing capacity by exactly one on every full append copies 1+2+...+(n-1) elements over n operations, causing quadratic total copying. Geometric growth keeps the copied sequence summable relative to n at the cost of spare capacity. Actual language runtimes use their own allocation policies, which should not be replaced by the illustrative doubling rule when making version-specific claims.",
        "The fixture implements only capacity and copy counters for the abstract doubling policy. It verifies counts for eight appends, not the internals of Python list allocation. The proof uses a geometric series. The business decision also includes peak allocation during resizing, allocator behavior and acceptable request-tail latency."
      ]
    ],
    "problem": "Count abstract copy work when a buffer doubles capacity at full occupancy.",
    "steps": [
      "Grow capacity only when the current length equals capacity.",
      "Count the old live length as copied work for each growth.",
      "Add direct writes separately and compare the aggregate with n."
    ],
    "code": "capacity=1; size=0; copied=0\nfor _ in range(8):\n    if size==capacity:\n        copied+=size; capacity*=2\n    size+=1\nprint(size,capacity,copied)\nprint(copied+size)",
    "expect": "8 8 7\n15",
    "limit": "This is an explicit abstract doubling model, not a claim that CPython list capacities double exactly.",
    "mistakes": [
      "Do not equate amortized bounds with average behavior under an unstated input distribution.",
      "Do not promise bounded per-request latency from an amortized sequence bound."
    ],
    "takeaways": [
      "Expensive individual operations can coexist with cheap amortized operations.",
      "A growth-policy proof must state the policy it models."
    ],
    "practice": [
      "What does amortized analysis bound?|Cost across a sequence|A random latency percentile|Only the slowest machine|Only one chosen operation|Amortized reasoning charges total work over an operation sequence.",
      "In the shown doubling model, how many references are copied before eight appends finish?|7|8|16|28|Growth copies one, two and four existing elements.",
      "Can one append be linear while appends are constant amortized?|Yes|No by definition|Only for empty buffers|Only with random inputs|Occasional expensive growth can be spread over many cheap operations.",
      "A queue service needs a strict latency bound for every request. Is an amortized throughput bound sufficient?|No|Yes for every append|Only for even lengths|Only with a larger name|A sequence average does not bound the most expensive individual operation.",
      "Which capacity rule can cause quadratic aggregate copying?|Increase by one|Double when full|Grow by a fixed ratio|Reserve the final capacity|Repeated additive growth copies a triangular number of references.",
      "A lesson models doubling but runtime uses another geometric policy. What should be preserved?|The explicit model boundary|A claim of identical capacities|A universal zero-copy claim|A fixed byte-size promise|The abstract proof may illustrate growth without asserting actual runtime allocation details."
    ],
    "formal": [
      "What kind of assumption is unnecessary for amortized bounds?|Random input distribution|A defined operation model|A stated growth policy|A bounded sequence length|Amortized analysis can bound every allowed operation sequence without probabilistic assumptions.",
      "What series appears in geometric buffer-copy analysis?|1+2+4+...|1+1+1+... only|1+2+3+... always|1 factorial+2 factorial|Doubling capacity produces geometric copy sizes.",
      "An abstract buffer copies 1+2+4+8 entries during growth. What is that copied count?|15|16|30|64|The finite geometric sum equals fifteen.",
      "A telemetry buffer handles n appends with less than 2 n copies and n writes. Which aggregate bound follows?|O(n)|O(n squared)|O(log n)|O(1)|The two linear terms add to a linear total.",
      "A team promises constant worst-case append time based only on geometric growth. What is the correction?|Growth append may be linear|Every append must be quadratic|No append ever copies data|Only random inputs are valid|A growth operation can move all currently stored elements.",
      "An abstract array starts capacity 1 and increases capacity by exactly one whenever full. Over 8 appends, count one write per append and all old elements copied at each growth. What total is correct?|36 operations|15 operations|16 operations|64 operations|Growth copies 1+2+3+4+5+6+7=28 existing elements and direct appends add 8 writes, giving 36. Additive growth causes quadratic aggregate copying.",
      "A doubling buffer has an allowed resize at length 65536 that copies 65536 entries before one append completes. The service deadline permits only 1000 entry operations per request. Which conclusion follows?|Amortized throughput cannot meet this per-call proof|Constant amortized cost proves the deadline|The resize has at most 1000 copies|The deadline can be checked from average size only|A single permitted operation requires more than the 1000-operation request budget even though aggregate append work is linear over a long sequence.",
      "A telemetry batch reserves capacity 1000 at a cost of 1000 modeled slot initializations, then performs 1000 direct writes without growth. Which whole-batch count is correct?|2000 operations|1000 operations|1 operation|1000000 operations|Moving allocation before the append loop does not remove its cost. Reservation and writing add to 2000 modeled operations under this stated initialization model.",
      "A benchmark measures 10000 append calls that never trigger capacity growth. The production contract permits an append to a full buffer. Which requirement remains untested?|The resize path's worst-case latency|The sampled append path's latency|The existence of direct writes|The number of measured calls|A sample that excludes resizing cannot establish the permitted operation's worst-case behavior even with many repetitions.",
      "A doubling buffer is full with n=40000 entries and grows to capacity 80000. The old 40000-slot allocation remains live until copying finishes. A 100000-slot cap covers both arrays only. What follows?|Peak 120000 slots exceeds the cap|Peak 80000 slots fits the cap|Peak 40000 slots fits the cap|Peak 40001 slots fits the cap|During growth both allocations coexist, so 40000+80000=120000 slots are live. Constant amortized time does not establish a peak-memory guarantee."
    ]
  },
  {
    "slug": "crossovers-and-inputs",
    "title": "Compare algorithms using actual sizes and explicit constants",
    "intro": "A product team can choose a simple pairwise check or a setup-heavy indexed check. Asymptotic growth identifies eventual behavior, but an engineering decision also needs the expected input range, setup costs and the number of repeated queries.",
    "sections": [
      [
        "Translate requirements into a model",
        "Suppose algorithm A performs 2 n squared abstract operations and B performs 100 n+500. Neither expression is a universal time measurement. Under a comparable operation model, solving their crossover tells where the estimate favors one approach. A lower asymptotic class can be slower on small inputs because constants and setup work matter.",
        "Many workloads have more than one dimension: records n, queries q, key width k and result size r. An index may require preprocessing and memory before its cheap queries pay off. Include build and update costs when the system receives changing data; a static-query estimate does not automatically apply to a frequently updated index."
      ],
      [
        "Choose robustly, then measure",
        "An operations budget can reject clearly unsuitable candidates before implementation. After correctness and resource checks, benchmark representative input distributions on the intended environment. Report small, typical and large cases, including adversarial shapes allowed by the contract. Do not infer a guaranteed response-time bound from a few fast examples.",
        "The fixture compares two deliberately defined integer cost functions at several sizes. It shows a crossover in that model only. In production, differences between comparison, hashing, allocation and I/O costs can change the practical crossover, and the final choice may favor maintainability or simpler recovery when both meet the budget."
      ]
    ],
    "problem": "Compare quadratic scan and linear setup models at multiple record counts.",
    "steps": [
      "Evaluate both stated cost formulas at each n.",
      "Select the smaller estimate without converting it into milliseconds.",
      "Identify where the preferred model changes."
    ],
    "code": "for n in [5,20,100]:\n    a=2*n*n; b=100*n+500\n    print(n,a,b,\"A\" if a<b else \"B\")",
    "expect": "5 50 1000 A\n20 800 2500 A\n100 20000 10500 B",
    "limit": "The arithmetic verifies these model estimates. It does not benchmark implementations or establish equivalence between their real primitive costs.",
    "mistakes": [
      "Do not ignore setup or update work when evaluating an index.",
      "Do not prefer a lower Big-O class without checking the supported input range and constraints."
    ],
    "takeaways": [
      "Growth classes and crossover sizes answer complementary questions.",
      "Compare complete workload cost, including build and updates."
    ],
    "practice": [
      "What is needed to compare two concrete cost formulas?|Comparable cost units|Identical variable names|The shortest source code|A fixed deployment color|Counts are comparable only under a meaningful shared cost model.",
      "For n=5 in the fixture, which model is cheaper?|A|B|They tie|Neither can be evaluated|The formulas give fifty versus one thousand abstract operations.",
      "A prebuilt index speeds queries. Which workload cost can still matter?|Index construction|Only the query label|Only the result title|Only integer formatting|Preprocessing must be included when assessing the whole workload.",
      "A daily catalog rebuild changes into updates every second. What model dimension changes?|Update workload|Only the source filename|Only the return annotation|Only the query spelling|The cost of keeping an index current can become significant.",
      "Does a lower asymptotic class imply faster execution at every n?|No|Yes by definition|Only for Python|Only for arrays|Constants and setup work can dominate at small supported sizes.",
      "A service only accepts at most 30 records. Which evidence helps choose a simple implementation?|Its bounded workload cost|Only eventual growth at infinity|Only a textbook class label|Only the code line count|Actual input limits can make a simpler approach meet all requirements."
    ],
    "formal": [
      "What is a crossover point in a stated cost model?|Where estimates are equal|Where every program crashes|Where memory becomes zero|Where outputs stop matching|A crossover locates input sizes at which modeled costs tie.",
      "Which cost belongs in an indexed workload estimate?|Build plus query work|Only successful queries|Only source-code bytes|Only the index filename|The complete workload includes constructing the index before using it.",
      "At n=100, models 2 n squared and 100 n+500 predict which smaller count?|The linear model|The quadratic model|An exact tie|A constant-time model|The counts are twenty thousand and ten thousand five hundred.",
      "A logistics service makes one query then discards its index. Which cost is easy to overlook?|One-time index build|Only the last comparison|Only the output heading|Only the record delimiter|A single query may not amortize expensive preprocessing.",
      "A bank keeps an index across a million queries. What can make preprocessing worthwhile?|Repeated query savings|Changing variable names|A larger result font|A shorter error message|A one-time build can be offset by lower aggregate query cost.",
      "A benchmark model counts A=200 comparisons and B=150 hash operations. Measured primitive costs are 2 microseconds and 4 microseconds respectively, with no other work. Which time conclusion follows?|A 400 microseconds; B 600|A 200 microseconds; B 150|A 800 microseconds; B 300|Equal time because both are linear|Multiplying each operation count by its own primitive cost reverses the count-only ranking. A shared universal conversion would be unjustified.",
      "Candidate A needs 90 MB and 20 ms; candidate B needs 40 MB and 35 ms on the accepted worst-case model. Requirements cap memory at 64 MB and latency at 40 ms. Which candidate meets both?|B only|A only|Both candidates|Neither candidate|A exceeds the memory cap despite faster latency. B remains within both independent requirements.",
      "Two caches have measured mean lookup times of 1 ms and 2 ms. The contract requires every lookup to finish within 10 ms, including misses and eviction. What evidence is still needed?|Bounds for all lookup paths|Only a larger mean-only sample|Only the fastest hit time|Only the cache entry count|Mean observations do not establish a per-request maximum across all permitted paths. The expensive miss and eviction behavior must also be bounded.",
      "An exporter receives n=1000 input records but a valid request produces r=50000 explicit output rows. Every emitted row costs at least one operation. Which lower bound applies before any lookup optimization?|At least 50000 output operations|At most 1000 operations total|Exactlylog2(1000) operations|Constant work independent of r|An explicit output contract requires one emission per row, giving an Omega(r) lower bound that input-only counting misses.",
      "An index costs 500 operations to build and 2 per query; a scan costs 22 per query. A fresh build is required after each data change and there are 20 queries between changes. Which choice is cheaper per unchanged epoch?|Scan 440; index 540|Index 40; scan 400|Index 500; scan 440|Both cost 440|The scan costs 20 times 22=440, while the index costs 500+20 times 2=540. A build is not amortized sufficiently within the 20-query epoch."
    ]
  },
  {
    "slug": "memory-and-output-budgets",
    "title": "Apply resource budgets before optimizing throughput",
    "intro": "A join service can be fast in operation counts while still allocating more memory than its container permits. Budgeting requires units, peak live structures and explicit treatment of output growth, not just a Big-O label.",
    "sections": [
      [
        "Turn structures into bounded quantities",
        "Start with a transparent slot model when real object sizes are unknown. If a table keeps n entries with k fixed-width slots each, the model uses nk slots. If each slot is b bytes, multiply again by b. Real runtime objects may add headers, alignment, allocator overhead and shared references, so a slot calculation is a planning model rather than a resident-memory measurement.",
        "For an algorithm that creates an r-row result, the output may dominate memory even if the index is compact. Large Cartesian matches can produce r proportional to nm. Streaming can reduce retained output if the contract allows incremental consumption, but it cannot remove the work required to emit every requested row."
      ],
      [
        "Retain safety margin and validate peak behavior",
        "A cap applies to peak live memory, including old/new buffers during replacement, simultaneous requests and framework overhead. Separate per-request memory from a process-wide cache; multiplying a per-request estimate by concurrency can expose failures hidden by single-request benchmarks.",
        "The fixture computes an explicit slot budget and checks which concurrency values fit. It deliberately excludes runtime overhead, so a production design must reserve headroom rather than using the modeled cap exactly. Admission control, bounded queues, pagination and backpressure are possible mechanisms when the business contract permits them."
      ]
    ],
    "problem": "Check concurrent request capacity under a declared fixed-width memory model.",
    "steps": [
      "Convert entries and slots per entry into modeled bytes.",
      "Add the shared-cache allocation once.",
      "Test concurrency against the cap before promising capacity."
    ],
    "code": "per_request=2000*4*8\nshared=32768; cap=262144\nfor concurrency in [1,3,4]:\n    used=shared+concurrency*per_request\n    print(concurrency,used,used<=cap)",
    "expect": "1 96768 True\n3 224768 True\n4 288768 False",
    "limit": "This byte arithmetic is an explicit simplified model. It omits object headers, allocator behavior and application overhead.",
    "mistakes": [
      "Do not treat a reference-slot estimate as a measured Python object size.",
      "Do not forget concurrent live requests when applying a process memory cap."
    ],
    "takeaways": [
      "Resource constraints require units and lifetimes.",
      "Output and concurrency can dominate a seemingly cheap core algorithm."
    ],
    "practice": [
      "In a slot model, n entries of k slots each occupy how many slots?|nk|n+k|n/k always|log(nk)|Each of the n entries contributes k slots.",
      "Which quantity can multiply per-request memory pressure?|Concurrent requests|Only the endpoint name|Only the output delimiter|Only source file length|Several requests can retain their working structures at the same time.",
      "A full join returns nm rows in the worst case. What work cannot be removed if every row must be emitted?|Output-proportional work|Every input comparison|Only schema validation|All allocator overhead|Explicitly emitting each requested output row requires work.",
      "A modeled memory cap is met exactly with no overhead included. What should change before deployment?|Reserve headroom|Assert exact safety|Ignore framework state|Remove units from estimates|A simplified model does not include every runtime allocation.",
      "Which unit conversion is needed for fixed-width byte estimates?|Slots times bytes per slot|Slots plus bytes per slot|Entries divided by all slots|Bytes minus entry count|The byte count multiplies the number of slots by their width.",
      "A shared cache exists once for a process. How should it enter a concurrency model?|Add once per process|Multiply once per row|Exclude from every total|Multiply by source lines|Shared process state is counted once while per-request state scales with concurrent requests."
    ],
    "formal": [
      "What does a memory budget require beyond a growth class?|Concrete units and limits|Only a class name|Only a source filename|Only an output checksum|A deployment cap needs an estimate in comparable resource units.",
      "Which output size can a full Cartesian join produce?|n times m rows|n+m rows always|Only n rows always|Only m rows always|Every left row can pair with every right row.",
      "How many bytes do 100 entries of 3 eight-byte slots model?|2400|300|800|24000|Multiplying entries, slots per entry and bytes per slot gives 2,400.",
      "A process hosts four simultaneous requests, each with a 10 MB buffer. What buffer total should be considered?|40 MB|10 MB|4 MB|400 MB|The request buffers can coexist, so their sizes add across concurrency.",
      "A service paginates results but keeps all pages in a session cache. Which claimed benefit is unsupported?|Bounded total retention|Smaller individual responses|A repeated-page cache hit|An explicit page boundary|Pagination limits response chunks but not an unbounded retained collection.",
      "A resize retains old 60000-slot and new 90000-slot arrays simultaneously. After copying only the new allocation remains. A 140000-slot cap applies to these arrays. Which admission result follows?|Reject; peak 150000|Admit; final 90000|Admit; old 60000|Admit; growth 30000|The cap applies during the coexistence interval, when the allocations total 150000 slots, not just to the final state or additional capacity.",
      "Two O(n) indexes store 1000000 fixed-width keys at 8 and 200 modeled bytes respectively. Both add 16 MB fixed overhead. A 128 MB decimal cap applies. Which fits this model?|Only the 8-byte-key index|Only the 200-byte-key index|Both because both are O(n)|Neither because n is large|The estimates are 24 MB and 216 MB. Equal asymptotic classes do not imply equal capacity within a concrete cap.",
      "A process has a 32 MB shared cache,8 MB per active request and a 160 MB modeled cap with no other allocations. Which largest concurrency fits?|16 requests|20 requests|24 requests|12 requests|The remaining 128 MB permits 16 eight-megabyte requests. Shared memory is added once rather than multiplied per request.",
      "A pipeline keeps a fixed 1000-row RAM buffer and writes all r result rows to a disk file retained after completion. The team advertises constant total storage because RAM is bounded. Which correction respects the storage boundary?|RAM bounded; retained output grows|RAM and disk both stay constant|Disk storage shrinks as r grows|The file is auxiliary-free and costless|The buffer can have bounded resident size while the required retained file needs storage proportional to its output. Moving data to disk changes the resource location, not the total output requirement.",
      "A join's 200 MB index fits a 256 MB cap but a valid request requires 2 GB of materialized output. Streaming is not currently accepted by the caller. Which decision respects both requirements?|Reject that size or renegotiate output|Approve because index fits memory|Silently truncate to 256 MB|Assume collection frees required output|The mandatory materialized result cannot fit the cap. The system must enforce an explicit size limit or change the output contract, rather than promise an impossible allocation."
    ]
  },
  {
    "slug": "measure-with-models",
    "title": "Use benchmarks to test implementation assumptions",
    "intro": "A complexity argument predicts growth under a stated model. A benchmark observes one implementation on specific inputs and hardware. Good engineering uses both while keeping their claims separate.",
    "sections": [
      [
        "Control what the experiment changes",
        "Compare equivalent work on representative datasets. Include setup in the timed region when the production operation pays it, or report setup separately when it is intentionally amortized. Repeat measurements to expose variability, but do not mistake the minimum, mean or percentile of a finite sample for a universal upper bound.",
        "Operation counters can help test the model without wall-clock noise. If a proposed linear scan unexpectedly counts quadratic comparisons, inspect a nested membership test, repeated string concatenation or re-computed preprocessing. Conversely, tiny timing differences can reflect allocation, caching, warmup and background activity rather than a new asymptotic class."
      ],
      [
        "Design evidence for the decision",
        "Vary the input features that affect behavior: sortedness, duplicate frequency, key length, graph shape or match density. Keep correctness assertions and compare outputs so a fast wrong implementation cannot win. State the environment, versions, sizes, distributions and what was excluded from the experiment.",
        "The fixture compares measured operation counts with a proposed n-squared formula for a nested membership routine. It exposes a growth mismatch without asserting a millisecond result. A production benchmark should also monitor peak memory and tail latency, and should preserve raw observations for later reproduction rather than reporting only one favorable number."
      ]
    ],
    "problem": "Expose quadratic comparisons hidden inside a repeated linear membership lookup.",
    "steps": [
      "Count comparisons inside every membership search.",
      "Use missing probes so each search scans the complete list.",
      "Compare the observed aggregate with n squared."
    ],
    "code": "def work(n):\n    xs=list(range(n)); comparisons=0\n    for probe in range(n,2*n):\n        for x in xs:\n            comparisons+=1\n            if x==probe: break\n    return comparisons\nprint([(n,work(n),n*n) for n in [2,4,8]])",
    "expect": "[(2, 4, 4), (4, 16, 16), (8, 64, 64)]",
    "limit": "This fixture checks a deliberately instrumented worst-case input family. It does not estimate real request latency or establish the behavior of an optimized lookup implementation.",
    "mistakes": [
      "Do not time a different amount of work for competing algorithms.",
      "Do not infer a worst-case guarantee from a small sample of fast runtimes."
    ],
    "takeaways": [
      "Counters can test whether implementation work matches a claimed model.",
      "Representative inputs and correctness checks are part of performance evidence."
    ],
    "practice": [
      "What is a wall-clock benchmark directly evidence about?|The sampled execution|Every possible input|A universal time bound|Every hardware platform|Timing observations describe the implementation, environment and workload actually exercised.",
      "Which check prevents a fast wrong implementation from winning?|Compare output correctness|Only shorten its filename|Only increase thread count|Only remove logging lines|Performance is useful only if the implementation preserves required results.",
      "In the fixture, n missing probes each scan n elements. How many comparisons occur?|n squared|n|log n|2 n always|Every missing probe traverses the entire list.",
      "A production operation rebuilds an index every call, but a benchmark excludes rebuilding. What is wrong?|Workload boundary differs|The code must be recursive|The input has too many names|The result is automatically invalid|The measured region omits work the deployed operation must perform.",
      "Which input feature can alter search behavior?|Match position|Only report font size|Only service logo|Only branch naming|An early match can terminate a scan before a late or missing match.",
      "A measured runtime doubles between two input sizes. What is the responsible conclusion?|Describe those observations|Claim a universal proof|Guarantee every future latency|Discard all cost models|Two observations cannot establish the entire growth function."
    ],
    "formal": [
      "What should a reproducible benchmark record?|Environment and workload|Only the fastest number|Only the author’s initials|Only the screenshot title|Reproduction needs enough information about what ran and under which conditions.",
      "What can an operation counter help reveal?|Unexpected repeated work|A guaranteed CPU frequency|A universal network speed|An automatic safety approval|Counting executed operations can test assumptions about the implementation’s structure.",
      "For eight missing probes against eight records in the fixture, what count occurs?|64|8|16|32|Each probe inspects all eight records, giving sixty-four comparisons.",
      "A search benchmark tests only matches at the first position. Which important case is absent?|Late or missing matches|First-position matches|A nonempty input list|The loop’s first comparison|The tested family omits paths that scan many or all records.",
      "A service compares algorithms using different result requirements. Why is the timing comparison weak?|Work is not equivalent|The names are too similar|The language is interpreted|The tests use assertions|Different correctness contracts can produce misleading speed comparisons.",
      "Method A takes 2 ms at 100 rows and 900 ms at 1000000; method B takes 8 ms and 200 ms at those same sizes. The supported workload includes both, and a 500 ms limit applies at the maximum. What is justified?|Only B meets sampled cap|A is best at every supported size|A meets the maximum limit|Both sampled maxima meet the limit|The small-input winner is not the large-input winner. Only B's measured maximum-size sample is below 500 ms; this is sampled evidence, not a universal worst-case proof.",
      "A scan compares 1000 labels. Benchmarks use 5-character labels, but the permitted workload has shared prefixes up to 5000 characters. What experiment directly probes the omitted cost dimension?|Vary common-prefix lengths at fixed n|Repeat the same five-character sample|Only increase the number of workers|Only remove output serialization|Holding row count fixed while changing inspected prefix length tests whether a comparison's assumed constant cost remains representative across allowed key widths.",
      "A service has 999 measured requests at 1 ms and one at 1000 ms. Its contract caps the maximum at 50 ms. Which conclusion follows from the observed sample?|The maximum requirement is violated|The mean proves every request fits|The slow sample can be ignored|The mean equals the maximum|One observed 1000 ms request exceeds the 50 ms maximum regardless of the low mean. Averages cannot replace the required tail or maximum metric.",
      "A graph benchmark generates only paths with degree at most 2, but production allows a node connected to every other node. The tested DFS uses a push-all frontier. Which coverage gap matters?|High-degree frontier occupancy|Only cumulative visited count|Only edge-weight precision|Only sorted output labels|Path-only sampling omits the wide frontier allowed by high-degree graphs, so it cannot establish the pending-state resource bound for the full contract.",
      "A lookup pipeline rebuilds an n-entry set inside each of q queries, then checks membership. For n=1000,q=200, counters show 200000 insertions. Queries share one unchanged snapshot and 2 MB memory permits the reusable set. Which repair and claim fit?|Build once;1000 insertions plus 200 lookups|Build per query; only 200 insertions|Remove tests; guarantee constant total time|Sort query names; eliminate all preprocessing|The confirmed repeated preprocessing costs nq insertions. Reusing a set for the unchanged snapshot removes that repeated build while retaining a separate query cost and memory requirement."
    ]
  }
]);
