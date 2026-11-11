'use strict';
const {course}=require('./wave4-dsa-helper');
module.exports=course('searching-sorting',[
  {
    "slug": "binary-interval",
    "title": "Search sorted records with a shrinking half-open interval",
    "intro": "A stock lookup service already keeps numeric product identifiers in ascending order. Binary search can discard half the remaining candidates after a comparison, but only if its sorted-input assumption and interval convention agree with every update.",
    "sections": [
      [
        "Half-open invariant",
        "Use lo inclusive and hi exclusive, initially [0,n). Any possible matching index remains in this interval. While lo<hi, choose mid=(lo+hi)//2. If a[mid] is smaller than target, set lo=mid+1; if larger, set hi=mid; if equal, return mid. Both nonmatching updates exclude mid and strictly reduce interval length.",
        "An empty interval proves no matching index remains. The empty input starts with lo=hi=0 and returns no match without indexing. Using hi=n with an inclusive-interval loop would mix conventions and can access index n. Likewise setting lo=mid instead of mid+1 can repeat forever when only one low candidate remains."
      ],
      [
        "Bounds and preconditions",
        "After each unsuccessful comparison the candidate interval is at most about half its previous size. Thus the number of iterations is O(log(n+1)), with O(1) auxiliary variables. This assumes random access and constant-cost comparisons. A linked list does not offer constant-time access to its midpoint, and comparing long strings may add a key-length factor.",
        "Sorting an unsorted inventory just for one query may cost more than a scan; many repeated queries can justify maintaining an ordered index. When duplicates exist, the first equality match is not guaranteed to be the first or last equal index. A business requirement for an earliest event needs a boundary-search variant rather than an arbitrary match."
      ]
    ],
    "problem": "Find a product identifier using consistent half-open bounds.",
    "steps": [
      "State the ordering, range and cost-model assumptions for the fixture.",
      "Trace each interval update or ordering decision against its invariant.",
      "Check the resulting values and derive comparison, movement and storage bounds separately."
    ],
    "code": "def find(a,target):\n    lo,hi=0,len(a)\n    while lo<hi:\n        mid=(lo+hi)//2\n        if a[mid]<target: lo=mid+1\n        elif a[mid]>target: hi=mid\n        else: return mid\n    return None\nprint(find([2,5,8,13],8))\nprint(find([2,5,8,13],7))\nprint(find([],7))",
    "expect": "2\nNone\nNone",
    "limit": "The fixture searches sorted numeric arrays. The shrinking-range proof supplies the logarithmic comparison count under random-access assumptions.",
    "mistakes": [
      "Mixing inclusive hi with a half-open guard introduces off-by-one errors.",
      "An equality match alone does not guarantee an earliest duplicate."
    ],
    "takeaways": [
      "State one interval convention and preserve it.",
      "Search cost excludes any required sorting or index maintenance."
    ],
    "practice": [
      "What does [lo,hi) mean?|lo included, hi excluded|Both bounds included|Both bounds excluded|Only hi included|The interval includes indices from lo through hi minus one.",
      "Which initial hi matches a half-open array interval?|len(a)|len(a)-1|-1|The target value|The exclusive bound is one past the final index.",
      "Why use lo=mid+1 after a[mid]<target?|Exclude the too-small mid|To retain mid forever|To skip every higher index|To sort the lower half|Sortedness excludes mid and every smaller index.",
      "What does the fixture return for an empty array?|None|Zero index|Minus one payload|The target|The interval is empty before any indexing occurs.",
      "Which assumption enables constant-time midpoint access?|Random-access array storage|A next-only linked chain|A FIFO-only queue|An unindexed network stream|Array indexing supplies direct access under the RAM model.",
      "Is an arbitrary equality match necessarily the first duplicate?|No|Yes|Only with even length|Only for numeric keys|Basic binary search stops at any matching midpoint."
    ],
    "formal": [
      "What input order does the demonstrated binary search require?|Ascending|Descending only|Arbitrary|Arrival order only|Its comparisons discard halves using ascending sortedness.",
      "When does a half-open binary search stop without a match?|lo equals hi|mid equals zero|Target is positive|Array length is even|An empty interval has no candidate indices left.",
      "What is its comparison-count order under random access?|O(log(n+1))|Theta(n squared)|Theta(n)|O(1) for all n|Each unsuccessful iteration reduces the candidate interval by about half.",
      "A one-element stock array contains 4 and target is 9. Using lo=mid can repeat forever. Which update fixes progress?|lo=mid+1|hi=mid+1|lo=0 always|hi=len(a) always|The too-small midpoint must be excluded so the interval becomes empty.",
      "A team searches unsorted identifiers with binary search and sometimes misses present keys. What condition failed?|Sorted-input invariant|Constant auxiliary space|Python integer identity|Exclusive upper-bound storage|Discarding a half is unsound without order.",
      "An inventory has duplicates and the API needs any matching index. Which equality behavior is valid?|Return the current midpoint|Always scan to index zero|Reject all duplicates|Sort descending mid-search|Any equal index satisfies the stated contract.",
      "A lookup service has one query on an unsorted array and no future reuse. Which comparison is appropriate?|Linear scan versus sorting plus binary search|Binary search is always O(log n) including sorting|A heap is always required|Sorting takes constant time|A one-off sort usually dominates the logarithmic search and may be unnecessary.",
      "A next-only linked list is searched by repeatedly walking to midpoint positions. Why is an array\u2019s O(log n) time claim inapplicable?|Midpoint access is not constant time|Linked payloads cannot be ordered|Every comparison sorts the chain|Lists require exponential comparisons|The proof for array time counts constant-cost indexed reads.",
      "A half-open interval contains one candidate with a[mid]>target. Which update eliminates it safely?|hi=mid|hi=mid+1|lo=mid|lo=mid+1 always|The target cannot be at mid or to its right, leaving [lo,mid).",
      "A search endpoint must support n sorted fixed-width keys with constant workspace and at most logarithmic comparisons, while leaving data unchanged. Which implementation meets the contract?|Iterative shrinking-range binary search|Recursive slicing into copied half-arrays|Repeated sorting inside the loop|A full scan disguised by midpoint arithmetic|Iteration uses fixed state and discards halves without copying or mutation."
    ]
  },
  {
    "slug": "duplicate-boundaries",
    "title": "Find insertion boundaries and count duplicates",
    "intro": "A time-series index stores repeated event timestamps. A query needs all events within a time range, so a single equal match is insufficient. Lower and upper boundaries convert duplicate handling into two precise monotone partition problems.",
    "sections": [
      [
        "Boundary contracts",
        "The lower bound for x is the first index i with a[i]>=x, or n if none exists. Maintain values before lo strictly less than x and values at or after hi at least x. Compare a[mid]<x: advance lo past mid when true, otherwise move hi to mid. The empty interval returns the insertion position.",
        "The upper bound changes the comparison to a[mid]<=x, producing the first index with a[i]>x. Thus equal values occupy [lower,upper), and their count is upper-lower. If lower is n or a[lower]!=x, there is no exact match. The boundary itself can still be valid as an insertion position."
      ],
      [
        "Range queries and mutation costs",
        "For a closed numeric range [L,R], the matching slice begins at lower_bound(L) and ends at upper_bound(R). Finding the bounds takes O(log n) comparisons each; returning m matching records adds O(m) output work. A list insertion at the boundary still shifts a suffix and is O(n) in the worst case. Binary search does not turn an array into a balanced tree.",
        "Python bisect_left and bisect_right implement these boundary semantics. When searching records with key=, bisect search applies the key to stored records but not to the search value x; pass x in key space. Keep the underlying sequence ordered by the same key, and handle mutation synchronization outside the search operation."
      ]
    ],
    "problem": "Locate equal timestamps and a closed query range using bisect boundaries.",
    "steps": [
      "State the ordering, range and cost-model assumptions for the fixture.",
      "Trace each interval update or ordering decision against its invariant.",
      "Check the resulting values and derive comparison, movement and storage bounds separately."
    ],
    "code": "from bisect import bisect_left,bisect_right\na=[1,2,2,2,4,7]\nlo=bisect_left(a,2); hi=bisect_right(a,2)\nprint(lo,hi,hi-lo)\nprint(a[bisect_left(a,2):bisect_right(a,4)])\nprint(bisect_left(a,9))",
    "expect": "1 4 3\n[2, 2, 2, 4]\n6",
    "limit": "The fixture uses ordered numeric keys. Boundary search is logarithmic in comparisons; slicing results and shifting inserted list elements have separate costs.",
    "mistakes": [
      "Treating insertion position n as a valid array index can raise an error.",
      "O(log n) location does not imply O(log n) Python list insertion."
    ],
    "takeaways": [
      "Lower and upper bounds define duplicate intervals exactly.",
      "Separate index discovery from output and mutation costs."
    ],
    "practice": [
      "What is the lower bound of x?|First index with a[i]>=x|Last value strictly below x|First index always equal to x|The numeric value x itself|The insertion boundary can exist even when x is absent.",
      "What is the upper bound of x?|First index with a[i]>x|First value equal to x|Last index below x|Array length divided by x|Upper bound lies immediately after all equal values.",
      "How is duplicate count computed?|upper-lower|upper+lower|lower-upper|upper*lower|Equal values occupy the half-open interval between the boundaries.",
      "For [1,3,3,5], what is lower_bound(4)?|3|2|4|0|Index three contains the first value at least four.",
      "What may lower_bound return for a target larger than all entries?|len(a)|Only len(a)-1|Always zero|An invalid negative index|The insertion boundary is one past the final entry.",
      "What cost does inserting into a Python list still incur after finding a boundary?|Suffix shifting|Automatic tree rotation|Only key comparison|No data movement|Array-backed list insertion can move many references."
    ],
    "formal": [
      "Which comparison advances lo in lower-bound search?|a[mid]<x|a[mid]<=x|a[mid]>x|a[mid]==x only|Only values strictly below x belong before the lower boundary.",
      "Which comparison advances lo in upper-bound search?|a[mid]<=x|a[mid]<x|a[mid]>=x|a[mid]!=x|Values equal to x also belong before the upper boundary.",
      "What range contains all values equal to x?|[lower,upper)|[upper,lower)|[0,lower)|[upper,n)|Lower starts the equal block and upper ends it exclusively.",
      "An event index is [2,2,4,6,6]. How many events equal six?|2|1|3|5|Lower is three and upper is five, giving a count of two.",
      "A closed time range [L,R] is queried from a sorted array. Which boundaries include both endpoints?|lower_bound(L), upper_bound(R)|upper_bound(L), lower_bound(R)|lower_bound(R), upper_bound(L)|upper_bound(R), upper_bound(L)|The lower boundary includes equal L and the upper boundary includes equal R before its exclusive end.",
      "A service returns 10000 matching records after two boundary searches. What work must be included beyond search?|O(10000) output work|O(1) total return cost|O(log log n) output work|No materialization cost|Every returned record must be written or streamed.",
      "A developer indexes a[bisect_left(a,x)] without checking the returned index. Which target can cause IndexError?|A boundary above every key|Only the minimum stored key|Every duplicated key|Only a negative key|A boundary at len(a) is valid for insertion but not element access.",
      "A sorted-list service locates insertion in O(log n) comparisons and claims O(log n) complete insertion. What is omitted?|Worst-case O(n) reference shifts|Mandatory O(n squared) comparisons|An automatic O(log n) rotation|The absence of a target|Python list storage must make room by shifting a suffix.",
      "A bisect search uses key=lambda r:r['age'] over records. What should x represent?|An age value|Always a full record dictionary|A callback function|The record\u2019s memory address|For search, bisect applies key to stored elements and compares them with x in key space.",
      "A timestamp API requires inclusive endpoints, duplicate preservation, logarithmic bound discovery and streaming of m matches with constant extra result state. Which plan fits?|Two boundaries, then stream the range|Use one arbitrary equality match and stop|Sort every returned timestamp independently|Copy the entire index before both searches|Two boundaries preserve endpoints and duplicates; streaming adds O(m) output work without a full result buffer."
    ]
  },
  {
    "slug": "answer-monotone",
    "title": "Binary-search the smallest feasible capacity",
    "intro": "A batch uploader must process ordered file sizes within a maximum number of days. The feasibility question is monotone: increasing daily capacity cannot require more days when order is fixed and sizes are nonnegative. Binary search can therefore operate on possible answers rather than stored indices.",
    "sections": [
      [
        "Construct and prove feasibility",
        "For a candidate capacity C, scan sizes in order, keeping the current daily load. If the next file would exceed C, start another day. Reject C below the largest single file because files cannot be split. This greedy scan uses the fullest possible prefix each day, so no alternative ordered partition can finish that first day later and use fewer days. Repeating this argument makes its day count minimal.",
        "The predicate feasible(C) means the greedy day count is at most D. If feasible at C, it is feasible at any larger capacity because the same partition remains valid. The false-then-true predicate supports searching the first feasible integer. Initialize lo=max(sizes) and hi=sum(sizes); hi is feasible for positive D and nonempty nonnegative sizes."
      ],
      [
        "Bounds and domain checks",
        "At mid, keep hi=mid when feasible and lo=mid+1 otherwise. Each step preserves the smallest feasible answer inside [lo,hi] and shrinks its integer width. A feasibility scan costs O(n); the number of scans is O(log(R+1)), where R=sum(sizes)-max(sizes). Auxiliary scan/search state is O(1).",
        "This model requires fixed order, indivisible files, positive day limit and nonnegative sizes. Reordering files or allowing partial files changes the feasibility problem. A product endpoint should reject invalid limits and define its empty-input policy. A loose search bound may add scans, while a non-feasible upper bound can produce a confidently wrong answer."
      ]
    ],
    "problem": "Find the minimum ordered daily capacity for three upload days.",
    "steps": [
      "State the ordering, range and cost-model assumptions for the fixture.",
      "Trace each interval update or ordering decision against its invariant.",
      "Check the resulting values and derive comparison, movement and storage bounds separately."
    ],
    "code": "def minimum_capacity(sizes,days):\n    if not sizes or days<1 or any(x<0 for x in sizes): raise ValueError(\"invalid input\")\n    def feasible(cap):\n        used=1; load=0\n        for x in sizes:\n            if load+x>cap: used+=1; load=0\n            load+=x\n        return used<=days\n    lo,hi=max(sizes),sum(sizes)\n    while lo<hi:\n        mid=(lo+hi)//2\n        if feasible(mid): hi=mid\n        else: lo=mid+1\n    return lo\nprint(minimum_capacity([1,2,3,4,5],3))\nprint(minimum_capacity([4,2],1))",
    "expect": "6\n6",
    "limit": "The fixture preserves file order and disallows splitting. The result follows from the greedy feasibility proof and the monotonicity of capacity.",
    "mistakes": [
      "Searching with a nonmonotone predicate makes half-discard updates unsound.",
      "Allowing a file larger than capacity inside the scan silently violates the indivisibility constraint."
    ],
    "takeaways": [
      "Prove the predicate before applying binary search on answers.",
      "Multiply predicate cost by the number of answer-space probes."
    ],
    "practice": [
      "What makes answer-space binary search valid here?|Feasibility changes only from false to true|All file sizes must be distinct|The answer equals an existing file size|The number of days grows with capacity|Larger capacity preserves any feasible ordered partition.",
      "What is a safe lower capacity bound for indivisible files?|The largest file|Zero always|The smallest positive file|The number of files only|Capacity below the largest file cannot hold that file.",
      "What is a safe upper bound for at least one allowed day?|The sum of sizes|The average size rounded down|The smallest file|The number of distinct sizes|All files fit in one day at total-size capacity.",
      "For [4,2] and one day, what capacity is required?|6|4|2|3|Both files must fit in the sole day\u2019s combined load.",
      "What is the predicate scan\u2019s time for n sizes?|O(n)|O(log n)|O(1)|O(n squared)|The greedy check inspects each size once.",
      "Why must the day count be positive?|Zero days cannot process a nonempty input|Binary search requires an even day count|All files have size one|A capacity variable must be negative|The stated nonempty scheduling contract requires at least one day."
    ],
    "formal": [
      "What answer is the search seeking?|Smallest feasible capacity|Largest infeasible day count|Median file size|First file\u2019s index|The contract minimizes capacity while satisfying the day limit.",
      "What does increasing capacity do to feasibility?|Feasibility cannot decrease|It always increases required days|It makes all files reorder|It halves file sizes|The earlier partition remains usable under a larger capacity.",
      "What update follows a feasible midpoint in a first-feasible search?|hi=mid|lo=mid+1|hi=mid-1 always|lo=hi immediately|The midpoint may be the smallest feasible answer, so retain it as the upper bound.",
      "An uploader preserves order for [3,2,2] and has two days. Is capacity four feasible?|Yes: [3] then [2,2]|No, three days are mandatory|Only by splitting a file|Only by reordering files|The ordered partition [3] and [2,2] fits the four-unit daily capacity in two days.",
      "A developer binary-searches a predicate that is true at capacities 4 and 8 but false at 6. What proof is missing?|Monotonic feasibility|Constant scalar storage|Four-choice answer structure|Distinct file labels|Binary search needs a single false-to-true transition to discard answer ranges soundly.",
      "A candidate capacity is below one indivisible file size. What must the feasibility checker report?|Infeasible|Feasible if that day is empty|Feasible after silently splitting|Unknown for all inputs|No day can hold that file under the stated indivisibility rule.",
      "A feasibility scan takes O(n), and capacity range width is R. What total bound follows?|O(n log(R+1))|O(log n) regardless of scan|O(n+log R) always|O(R squared)|Binary search performs logarithmically many scans and each inspects n inputs.",
      "An uploader changes the requirement to arbitrary file reordering. Which part needs revalidation?|The greedy feasibility model|Only the print formatting|The half-open array convention|The numeric file identities|The proof relies on preserving order and choosing maximal consecutive prefixes.",
      "A service uses hi smaller than the true minimum and never checks upper feasibility. What can the search return?|An infeasible final capacity|A guaranteed optimal capacity|A sorted list of files|A negative day count necessarily|The search invariant requires a feasible upper bound.",
      "A capacity API has nonnegative indivisible ordered sizes, positive D, and must find the minimum with O(1) auxiliary state. Which plan meets the contract?|Greedy predicate, [max,sum] first-true search|Sort files at every midpoint and claim unchanged order|Use a nonmonotone revenue predicate|Search only capacities equal to file sizes|The greedy check is exact for ordered packing, the bounds bracket feasibility, and scalar scanning/search state is constant."
    ]
  },
  {
    "slug": "merge-stability",
    "title": "Merge sorted runs while preserving equal-key order",
    "intro": "A reporting pipeline merges records already ordered by account identifier. Equal identifiers must retain arrival order for audit readability. Merge sort exposes how a local tie decision yields global stability and why its comparison bound differs from its temporary storage cost.",
    "sections": [
      [
        "Merge invariant",
        "Keep one index into each sorted run. The output prefix is sorted and contains precisely the consumed elements of both runs. Choose the smaller front element next. When keys are equal, choose from the left run first to preserve the input order of equal-key records across the split. Append the unconsumed suffix once a run is exhausted.",
        "Splitting an array recursively into two nearly equal halves creates O(log n) levels. Each level merges O(n) records, giving O(n log n) comparison/movement work under constant-cost keys. The merge itself is linear in the combined run lengths and needs at most a+b-1 comparisons when both runs are nonempty."
      ],
      [
        "Storage and stability trade-offs",
        "A conventional array merge sort uses O(n) temporary element storage plus O(log n) recursive depth. Linked-list merge sort can relink nodes rather than allocate a full array buffer, but still needs a strategy for splitting and traversal. Avoid treating every algorithm named merge sort as having identical representation-dependent auxiliary space.",
        "Stability means equal-key items appear in their original relative order. It is useful when a secondary ordering was established earlier or when equal-priority events should retain chronology. Choosing right first on ties can leave keys sorted while violating stability, so test records with identities rather than only equal numeric payloads."
      ]
    ],
    "problem": "Merge equal-key records with left-first ties.",
    "steps": [
      "State the ordering, range and cost-model assumptions for the fixture.",
      "Trace each interval update or ordering decision against its invariant.",
      "Check the resulting values and derive comparison, movement and storage bounds separately."
    ],
    "code": "def merge(left,right):\n    i=j=0; out=[]\n    while i<len(left) and j<len(right):\n        if left[i][0]<=right[j][0]: out.append(left[i]); i+=1\n        else: out.append(right[j]); j+=1\n    out.extend(left[i:]); out.extend(right[j:]); return out\nprint(merge([(1,\"L1\"),(2,\"L2\")],[(1,\"R1\"),(3,\"R3\")]))",
    "expect": "[(1, 'L1'), (1, 'R1'), (2, 'L2'), (3, 'R3')]",
    "limit": "This fixture verifies stable merging of pre-sorted runs. The level-by-level argument derives conventional merge-sort time, not a timing experiment.",
    "mistakes": [
      "Choosing the right run on equal keys can break stability while still producing sorted keys.",
      "Ignoring copied slices and temporary output understates array implementation storage."
    ],
    "takeaways": [
      "Stable merging needs an explicit tie rule.",
      "Time, workspace and representation must be compared together."
    ],
    "practice": [
      "What must be true of the two input runs before a standard merge?|Each is sorted by the same key|All keys are distinct|Both have identical length|The right run is descending|The smallest remaining element is at one of the two run fronts.",
      "Which tie choice preserves original cross-run order?|Take the left item first|Take the right item first|Drop one duplicate|Reverse both runs|Left-run records preceded right-run records before the split.",
      "What does sort stability preserve?|Relative order among equal keys|All original array positions|Equal spacing of keys|A constant heap size|Equal-key items retain their earlier relative order.",
      "What is merge work for run lengths a and b?|O(a+b)|O(a*b) necessarily|O(log(a+b))|O(1)|Each item is advanced and written once.",
      "How many merge levels arise for n items split in halves?|O(log n)|Theta(n squared)|O(1)|Theta(n)|Each split reduces subproblem size geometrically.",
      "Why test stability with tagged equal keys?|Tags reveal relative order changes|Tags force every key distinct|Numeric sorting becomes impossible|Every tagged array is a heap|Equal numeric values alone do not expose identity order."
    ],
    "formal": [
      "What order does merge produce from ascending sorted runs?|Ascending by the common key|Descending always|Arrival order regardless of key|Random order|Selecting the smaller front preserves a sorted output prefix.",
      "What is conventional merge sort\u2019s worst-case time under fixed-cost comparisons?|O(n log n)|O(n squared)|O(log n)|O(1)|Logarithmically many merge levels each process O(n) items.",
      "What temporary element-space bound is typical for array merge sort?|O(n)|Always O(1)|O(n squared)|O(log log n)|A conventional implementation uses an output/merge buffer proportional to input size.",
      "An audit merge has left (2,A) and right (2,B), with A earlier in the original input. Which output is stable?|A before B|B before A|Only A|Only B|A left-first equal-key decision preserves their original relative order.",
      "A merge routine returns sorted keys but reverses tagged equal-key records. Which property failed?|Stability|Key ordering necessarily|Termination necessarily|Array indexing|Sortedness does not by itself preserve relative identity order within ties.",
      "Two nonempty runs have lengths four and five. What is the maximum number of key comparisons for a standard two-front merge?|8|9|20|4|At most a+b-1 comparisons occur before one run is exhausted.",
      "A memory-constrained report cannot allocate an O(n) merge buffer and permits unstable output. Which comparison deserves consideration?|In-place heapsort versus buffered mergesort|Buffered mergesort has zero workspace|Stable keys eliminate temporary storage automatically|Quicksort has guaranteed O(1) stack in every implementation|Heapsort offers O(1) auxiliary array workspace and worst-case O(n log n) time under the usual implementation.",
      "A developer uses repeated list slicing in recursive merge sort. What should a resource review include?|Copied sublists and peak live buffers|Only the two local index variables|Only key-comparison count|No input references because slices are views|Python slices copy references and contribute allocation/movement costs.",
      "A finance pipeline first sorts by timestamp and then stably by account. What order holds within each account?|Timestamp order is retained|Timestamp order is always reversed|Every record remains at its original global index|Only account totals remain|The stable second sort preserves the previous ordering among equal accounts.",
      "A pipeline requires worst-case O(n log n) comparisons and stable output on an array, and can allocate O(n) temporary references. Which algorithmic contract fits?|Conventional stable merge sort with left-first ties|Ordinary in-place heapsort with no stability mechanism|First-element-pivot quicksort with worst-case linear partitions|An arbitrary unstable partition followed by no repair|Merge sort meets the comparison bound, and its tie rule preserves equal-key order using the permitted buffer."
    ]
  },
  {
    "slug": "quick-partitions",
    "title": "Analyze quicksort partitions and adversarial pivots",
    "intro": "A sorting utility uses a pivot to partition records before recursively sorting the two sides. Its performance depends on the partition balance, while correctness depends on exactly which region the partition function finalizes. A returned pivot index and a returned split boundary are different contracts.",
    "sections": [
      [
        "Partition invariant",
        "The demonstration uses Lomuto partitioning with the last value as pivot. During scanning, [lo,i) contains values at most the pivot, [i,j) contains values greater than it, and [j,hi) remains unprocessed. On a qualifying value, swap it into the left region and increment i. Finally swap the pivot into i. It is then at its final sorted position.",
        "Recursive calls must exclude that finalized pivot: sort [lo,i-1] and [i+1,hi] for inclusive bounds. A Hoare partition returns a split boundary with a different contract; applying Lomuto recursion limits to it can miss elements or fail to progress. Write the partition guarantee next to its caller."
      ],
      [
        "Time, depth and duplicates",
        "Balanced partitions yield T(n)=2T(n/2)+O(n), hence O(n log n). Repeatedly choosing the smallest or largest pivot gives T(n)=T(n-1)+O(n), hence Theta(n squared) and potentially linear recursive depth. Random pivot selection gives expected O(n log n) over the algorithm randomness, not a deterministic worst-case guarantee.",
        "Many equal values can produce poor two-way partitions depending on the comparison rule. A three-way partition groups values smaller, equal and greater than the pivot, skipping the equal region in later recursion. Recurse on the smaller side and iterate the larger side to limit call depth to O(log n), even though bad pivots can still make total work quadratic. Typical in-place quicksort is not stable."
      ]
    ],
    "problem": "Place a Lomuto pivot and verify its partition regions.",
    "steps": [
      "State the ordering, range and cost-model assumptions for the fixture.",
      "Trace each interval update or ordering decision against its invariant.",
      "Check the resulting values and derive comparison, movement and storage bounds separately."
    ],
    "code": "def partition(a,lo,hi):\n    pivot=a[hi]; i=lo\n    for j in range(lo,hi):\n        if a[j]<=pivot:\n            a[i],a[j]=a[j],a[i]; i+=1\n    a[i],a[hi]=a[hi],a[i]; return i\na=[4,2,5,1,3]\np=partition(a,0,len(a)-1)\nprint(a,p)\nprint(all(x<=a[p] for x in a[:p]), all(x>a[p] for x in a[p+1:]))",
    "expect": "[2, 1, 3, 4, 5] 2\nTrue True",
    "limit": "The fixture checks one last-pivot Lomuto partition. Quicksort bounds are derived from partition recurrences and depend on pivot and recursion strategy.",
    "mistakes": [
      "Mixing Hoare and Lomuto return contracts can break recursion bounds.",
      "Expected O(n log n) under randomization does not eliminate quadratic worst-case inputs."
    ],
    "takeaways": [
      "Partition correctness and pivot quality are separate concerns.",
      "Control stack depth independently from total comparison work."
    ],
    "practice": [
      "What does the shown Lomuto return value identify?|The pivot\u2019s final sorted index|The median value always|The first unsorted index only|The array length|Final swapping places the pivot between the partitioned regions.",
      "Which regions should recursive Lomuto calls exclude?|The finalized pivot index|Every value equal to zero|Both array endpoints always|All values larger than pivot forever|The pivot already occupies its final position.",
      "What recurrence describes consistently one-sided quicksort?|T(n)=T(n-1)+O(n)|T(n)=T(n/2)+O(1)|T(n)=O(1)|T(n)=2T(n)+O(n)|One subproblem has n-1 items and partitioning still scans n items.",
      "What can three-way partitioning group together?|Values equal to the pivot|Only negative values|All leaf frames|All distinct object identities|The equal region can be excluded from further sorting.",
      "Is ordinary in-place quicksort generally stable?|No|Yes always|Only on every odd-length input|Only for strings|Swaps can change relative order of equal-key records.",
      "What does random pivoting primarily improve?|Expected partition performance|A deterministic no-bad-input guarantee|Automatic stability|Elimination of all recursion state|Randomization supports expected O(n log n), with possible bad outcomes remaining."
    ],
    "formal": [
      "What is a pivot used for in quicksort?|Partitioning records by key relation|Counting array capacity only|Preserving every original position|Implementing FIFO removal|The pivot divides items into ordering regions.",
      "What time bound follows from balanced quicksort partitions?|O(n log n)|Theta(n squared) always|O(log n) total|O(1)|Each level processes linear total work and there are logarithmically many levels.",
      "What is quicksort\u2019s general worst-case comparison bound without protection?|Theta(n squared)|O(log n)|O(n) for every input|O(1)|One-sided partition sizes sum to quadratic scan work.",
      "A sorted array uses its last element as Lomuto pivot at every step. What partition pattern can occur?|One side has n-1 items repeatedly|Both sides always have equal size|No partition comparisons occur|All values become equal|The largest pivot finalizes at the end, leaving nearly the whole prefix.",
      "A sorter recurses on the smaller partition and loops over the larger. What improves independently of bad pivot time?|O(log n) recursive depth|Worst-case time becomes O(log n)|Output becomes stable automatically|Every pivot becomes the median|Each nested recursive side is at most half the prior subproblem.",
      "A data feed contains one million equal keys and uses a two-way <= Lomuto partition. What risk deserves attention?|Repeated one-sided partitions|Automatic linear-time full sorting|No swaps or comparisons|Balanced halves guaranteed|Every scanned value qualifies, placing the pivot at an extreme each time.",
      "A developer swaps a Hoare partition into a Lomuto caller without changing bounds. What needs review?|Partition contract|Only the random seed|Only tuple payload sizes|The input\u2019s business name|Partition schemes guarantee different regions and require matching recursion limits.",
      "A requirement demands deterministic worst-case O(n log n) sorting. Is plain randomized quicksort alone enough?|No, expectation is not a worst-case bound|Yes, randomization removes every bad run|Only if all keys are unique|Only if the array is reversed|Randomized quicksort can still have a quadratic run.",
      "A pipeline needs stable ordering of equal customer keys. What is unsafe to assume about ordinary in-place partition swaps?|That they preserve tie order|That they use O(1) temporary swap storage|That values can be compared|That the pivot is a key|Partition swaps may reorder equal-key records.",
      "A service accepts adversarial data, requires O(log n) recursion depth and deterministic O(n log n) time, and permits unstable array sorting. Which strategy addresses both constraints?|Introspective quicksort with depth protection and heapsort fallback|Random pivoting alone with unlimited recursive depth|Last-pivot Lomuto on every input|Three-way partitioning claimed worst-case linear for all distinct keys|A depth limit and worst-case-bounded fallback control adversarial time; a suitable recursion strategy controls stack use."
    ]
  },
  {
    "slug": "heap-guarantees",
    "title": "Compare heap sort with merge and quick sort",
    "intro": "A nightly in-memory export needs bounded workspace and predictable worst-case sorting time. Heap sort first constructs a max-heap, then repeatedly places the current largest value at the end. Its partial-order invariant offers a different trade-off from stable merge sort and expected-fast quicksort.",
    "sections": [
      [
        "Two regions and repair",
        "Maintain a max-heap in a[0:end) and a sorted suffix in a[end:n). Swap the root with a[end-1], shrink end, then sift the new root down until the parent is at least its children. The removed root is the maximum of the old heap, so extending the suffix preserves final ascending order.",
        "Bottom-up heap construction is O(n): many nodes are leaves or close to leaves and move only a little. Each of n extractions can sift through O(log n) levels, so heap sort is O(n log n) worst-case time under constant-cost comparisons. An iterative in-place sift needs O(1) auxiliary variables."
      ],
      [
        "Choose by constraints",
        "Ordinary heapsort is unstable because root swaps can reorder equal-key records. Conventional mergesort is stable with an O(n) buffer. Quicksort is often effective in practice but needs protections for deterministic worst-case guarantees and an explicit depth strategy. These are algorithm contracts, not a universal latency ranking on every machine.",
        "If only the k largest values are needed, sorting every item can be unnecessary. A size-k min-heap supports O(n log k) processing and O(k) retained entries, followed by any needed result ordering. For external data larger than memory, sorted runs and multiway merging are often more suitable than repeatedly touching a huge random-access heap."
      ]
    ],
    "problem": "Perform in-place ascending heap sort with iterative sift-down.",
    "steps": [
      "State the ordering, range and cost-model assumptions for the fixture.",
      "Trace each interval update or ordering decision against its invariant.",
      "Check the resulting values and derive comparison, movement and storage bounds separately."
    ],
    "code": "def heapsort(a):\n    def sift(i,end):\n        while 2*i+1<end:\n            child=2*i+1\n            if child+1<end and a[child+1]>a[child]: child+=1\n            if a[i]>=a[child]: break\n            a[i],a[child]=a[child],a[i]; i=child\n    for i in range(len(a)//2-1,-1,-1): sift(i,len(a))\n    for end in range(len(a)-1,0,-1):\n        a[0],a[end]=a[end],a[0]; sift(0,end)\na=[5,1,4,1,3]; heapsort(a); print(a)\nb=[]; heapsort(b); print(b)",
    "expect": "[1, 1, 3, 4, 5]\n[]",
    "limit": "The fixture uses numeric keys and iterative sift-down. Its conventional heapsort contract is unstable, O(n log n) worst-case time and O(1) auxiliary array workspace.",
    "mistakes": [
      "An ascending in-place heap sort starts with a max-heap, not a min-heap under this extraction layout.",
      "Adding unique original indices can enforce tie ordering but introduces key/storage overhead that must be counted."
    ],
    "takeaways": [
      "Choose sorting algorithms using worst-case, stability and workspace requirements.",
      "Top-k selection and external sorting may need different algorithms than a full in-memory sort."
    ],
    "practice": [
      "Which heap orientation supports the demonstrated ascending in-place layout?|Max-heap|Min-heap|FIFO queue|No parent-child ordering|The largest remaining value is swapped into the rightmost unsorted position.",
      "Where is the completed sorted region during extraction?|At the right suffix|At an unrelated second input|Only inside the root|At random indices|Each root extraction extends the ascending suffix from the right.",
      "What is bottom-up heap construction time?|O(n)|Theta(n squared)|Theta(n log n) necessarily|O(log n)|Most nodes have low height, giving a linear total sift bound.",
      "What workspace does iterative in-place heapsort use, excluding input?|O(1)|Theta(n) buffer|Theta(n squared)|Theta(n!)|Sift and extraction require only a fixed number of indices and a swap temporary.",
      "Does ordinary heapsort guarantee stability?|No|Yes|Only for every decimal input|Only if n is a power of two|Long-range swaps can reorder equal-key records.",
      "What is the full-sort worst-case bound under fixed-cost comparisons?|O(n log n)|O(log n)|Theta(n squared) necessarily|O(n!)|Linear heap construction plus logarithmic-cost extractions gives the bound."
    ],
    "formal": [
      "What relation defines a max-heap parent?|At least as large as its children|Smaller than every descendant|Equal to every child|Unrelated to child keys|The root is globally maximal when each parent dominates its children.",
      "What repair follows removal of a max-heap root?|Sift the replacement downward|Sort the suffix in reverse every time|Append a duplicate root|Delete every leaf|Downward repair restores parent-child order.",
      "Which standard algorithm has stable ties with an O(n) conventional merge buffer?|Merge sort|Ordinary in-place heapsort|Ordinary in-place quicksort|Unordered heap extraction only|Stable merging preserves ties while using temporary array storage.",
      "An export requires worst-case O(n log n), O(1) extra array workspace and permits unstable ties. Which fits?|Iterative heapsort|Conventional buffered mergesort|Plain last-pivot quicksort|Insertion sort on arbitrary data|Heapsort meets the stated time and workspace contract.",
      "A customer requires stable equal-key order and provides an O(n) buffer. Which choice has the matching standard guarantee?|Stable merge sort|Ordinary heapsort without extra tie state|Unprotected Lomuto quicksort|An unsorted deque|Merge sort offers a stable comparison sort under the permitted memory budget.",
      "A stream has n scores but only the largest k are needed, with k much smaller than n. Which retained structure fits O(k) state?|Min-heap of k best scores|An array containing all n sorted scores|A stack of every historical score|A max-heap of all scores|The smallest retained score is the threshold to replace when a better score arrives.",
      "A reviewer claims heapify is O(n log n) tightly because each node can sift log n levels. What sharper argument applies?|Sum work over node heights|Every node is the root|Heapify makes no comparisons|All levels have only one node|Most nodes cannot travel the full height; the weighted height sum is linear.",
      "A dataset exceeds RAM and storage access dominates. Why consider external merge sorting?|Sequential runs and merging control disk access|A huge in-place heap guarantees one sequential pass|All sorting keys fit one CPU register|Stability alone removes disk reads|External algorithms organize work around bounded memory and sequential I/O.",
      "A team decorates every equal-key item with its original index to stabilize an unstable sort. What must be included in the resource model?|The retained decoration/index storage|No additional key space by definition|Only the final heap root|Only the number of distinct payloads|Original-position tie state consumes representation space even if the sorter itself is in place.",
      "A top-k service must process n values using O(k) retained entries and return k values in descending order. Which total-work description fits a bounded heap design?|O(n log k)+O(k log k) work|O(log n) total work|O(n squared) unavoidable|O(k) time independent of n|Each candidate can update a size-k heap, and sorting the retained results adds the final ordering cost."
    ]
  },
  {
    "slug": "keys-stable",
    "title": "Compose built-in sort keys and stable passes",
    "intro": "A sales report orders records by region ascending and revenue descending. Python built-in sorting accepts key functions and is stable, allowing a tuple key or carefully ordered stable passes. Treat key direction and mutation behavior as explicit parts of the reporting contract.",
    "sections": [
      [
        "Key extraction and lexicographic order",
        "sorted(records,key=...) returns a new list, while records.sort(key=...) mutates the list and returns None. The key function is evaluated once per record per sort call. A tuple key compares its first component, then the next on ties. For numeric revenue, (region,-revenue) expresses ascending region and descending revenue.",
        "Using reverse=True reverses the overall key order; it does not independently reverse only one tuple component. To combine mixed directions for nonnumeric values, stable passes are useful: sort by the least significant field first, then by the most significant field. Equal primary keys retain the secondary order created by the earlier pass."
      ],
      [
        "Identity and repeated sorts",
        "Stability preserves input order among equal keys even with reverse=True. This is useful for arrival-order ties, but does not supply a deterministic cross-run order when the original input itself is nondeterministic. Add a final unique tie key when the product requires reproducible output across independently ordered source batches.",
        "If a key is expensive, once-per-item evaluation avoids repeated extraction within one sort. Repeated sort calls still recompute keys unless the program separately retains decorated records or caches valid results. Key functions should avoid mutation and external effects because sorting assumes a coherent ordering while it operates."
      ]
    ],
    "problem": "Sort a sales report with mixed numeric direction and compare stable passes.",
    "steps": [
      "State the ordering, range and cost-model assumptions for the fixture.",
      "Trace each interval update or ordering decision against its invariant.",
      "Check the resulting values and derive comparison, movement and storage bounds separately."
    ],
    "code": "rows=[(\"B\",4,\"x\"),(\"A\",3,\"y\"),(\"A\",7,\"z\"),(\"A\",7,\"w\")]\none=sorted(rows,key=lambda r:(r[0],-r[1]))\ntwo=sorted(rows,key=lambda r:r[1],reverse=True)\ntwo.sort(key=lambda r:r[0])\nprint(one)\nprint(one==two)\ncopy=list(rows); print(copy.sort(key=lambda r:r[0]))",
    "expect": "[('A', 7, 'z'), ('A', 7, 'w'), ('A', 3, 'y'), ('B', 4, 'x')]\nTrue\nNone",
    "limit": "The fixture uses numeric negation for one descending field and relies on documented stable sorting. It does not assert constant workspace for Python built-ins.",
    "mistakes": [
      "Assigning rows=rows.sort(...) replaces the list reference with None.",
      "reverse=True reverses a whole tuple key, not one selected field."
    ],
    "takeaways": [
      "Sort secondary fields before primary fields in stable multipass sorting.",
      "A stable tie order depends on the input order unless a unique tie key is specified."
    ],
    "practice": [
      "What does list.sort return?|None|The mutated list itself|A new tuple|The smallest key|It mutates the list in place and returns None.",
      "What does sorted return?|A new sorted list|None always|The original list identity|A lazy heap|The input iterable is collected into a new list.",
      "How often is a key function called per item in one built-in sort?|Once|Once per comparison|Never|n times always|Python computes a key once for each input item during that sort.",
      "Which numeric key sorts region ascending and revenue descending?|(region,-revenue)|(-region,revenue)|(region,revenue) with no reversal|revenue only|Tuple comparison prioritizes region, then negative revenue.",
      "In stable multipass sorting, which field is sorted first?|Least significant|Most significant always|The unique identifier always|A random field|The later primary sort preserves the earlier secondary order within ties.",
      "Does stable sorting make arbitrary source-order ties reproducible across runs?|No; input ties may vary|Yes regardless of source order|Only for all strings|Only when reverse is false|Stability preserves the order it receives, which may vary between runs."
    ],
    "formal": [
      "What does a sort key represent?|An extracted ordering value|Only the item\u2019s memory address|The number of output copies|A database password|Sorting compares extracted keys rather than necessarily the full payload.",
      "How are tuple keys compared?|Lexicographically|By the sum of components always|By only the final component|Randomly among unequal tuples|The first unequal component determines their relative order.",
      "Which behavior is guaranteed for equal built-in sort keys?|Preserved input tie order|Payloads are deduplicated|Records are always reversed|A new unique key is invented|Python built-in sorting is stable, so records with equal extracted keys retain their original relative order.",
      "A report needs department ascending then salary descending. Which numeric key fits?|(department,-salary)|(department,salary) with reverse=True|salary alone|(-salary,department)|The tuple\u2019s first field keeps department ascending while negative salary reverses only salary order.",
      "A developer assigns records=records.sort(key=...). What does records become?|None|The original list|A sorted tuple|An iterator|The in-place method returns None, not the list.",
      "A report first sorts by city, then stably by country. What order results?|Country primary, city secondary|City primary, country secondary|Both descending automatically|No meaningful order|The final stable country sort groups countries while preserving city order within each group.",
      "A key parser is expensive and a developer expects O(n log n) parser invocations in one built-in sort. Which fact changes that count?|Keys are extracted once per item|Every comparison reparses both records|No key is ever computed|Only the root record is parsed|One sort caches its extracted keys internally for that operation.",
      "Two reports contain equal-priority tasks in different arrival orders. Both are stably sorted only by priority. Can tie output differ?|Yes; each input tie order remains|No, stability invents a global order|Only if priorities are negative|Only if lists have different lengths|Stable order is relative to each input, not a universal tie rule.",
      "A pipeline needs deterministic output despite nondeterministic input order among equal business keys. What should it add?|A unique deterministic tie key|Only reverse=True|A random tie breaker|No additional ordering rule|A unique deterministic tie key fixes relative order independent of arrival permutation.",
      "A report must preserve input, use one key extraction per record, sort primary text ascending and numeric score descending, and retain arrival order for complete ties. Which call fits?|sorted(rows,key=lambda r:(r['group'],-r['score']))|rows.sort(key=lambda r:(r['group'],r['score']))|sorted(rows,key=lambda r:(r['group'],r['score']),reverse=True)|sorted(rows,key=lambda r:(-r['score'],r['group']))|The tuple encodes mixed directions, sorted preserves the input list, and stability preserves complete-key ties."
    ]
  },
  {
    "slug": "missing-order",
    "title": "Normalize missing and heterogeneous keys before sorting",
    "intro": "An imported catalog contains names, missing prices and numeric strings. A correct sort begins with a defined ordering policy. Raw comparison of unrelated types or NaN values can fail to express the business meaning even when the sorting algorithm itself is correct.",
    "sections": [
      [
        "Make the order explicit",
        "For optional numeric prices, use a key such as (price is None, 0 if price is None else price). Present values compare before missing values because False precedes True. The placeholder zero is examined only within the missing group, where every item shares it; it does not make missing values equivalent to zero-price records.",
        "Normalize numeric strings before sorting if numeric order is required: text order places \"10\" before \"2\". Validate conversion failures rather than silently placing corrupted values into a legitimate price bucket. For names, casefold may supply a case-insensitive key, but locale-sensitive collation needs a stated locale-aware policy rather than a claim that Unicode code-point order matches every language."
      ],
      [
        "Exceptional values and coherence",
        "NaN does not behave like an ordinary ordered number: comparisons can be false in both directions. Choose an explicit policy, such as separating NaN into a final bucket, and avoid passing inconsistent comparison behavior as though it were a total order. Missing, invalid and infinite values can have different business semantics and should not be merged accidentally.",
        "Key extraction should produce comparable components for every accepted record and must remain stable during the sort. Mutating records or global normalization rules while keys are extracted can produce inconsistent report semantics. The fixture uses a simple missing-last numeric contract on synthetic rows; production validation and locale rules need separate tests."
      ]
    ],
    "problem": "Sort present numeric prices before missing prices while retaining ties.",
    "steps": [
      "State the ordering, range and cost-model assumptions for the fixture.",
      "Trace each interval update or ordering decision against its invariant.",
      "Check the resulting values and derive comparison, movement and storage bounds separately."
    ],
    "code": "rows=[(\"A\",None),(\"B\",2),(\"C\",0),(\"D\",None),(\"E\",2)]\nordered=sorted(rows,key=lambda r:(r[1] is None,0 if r[1] is None else r[1]))\nprint([r[0] for r in ordered])\nprint(sorted([\"10\",\"2\",\"1\"],key=int))",
    "expect": "['C', 'B', 'E', 'A', 'D']\n['1', '2', '10']",
    "limit": "The fixture explicitly supports numeric values and None. It does not claim arbitrary Python types or NaN values have a meaningful shared raw order.",
    "mistakes": [
      "Sorting numeric strings directly uses text order rather than numeric magnitude.",
      "Using price or a fallback treats zero as missing; test price is None explicitly."
    ],
    "takeaways": [
      "Normalize keys according to a documented business policy.",
      "Separate missing, invalid and exceptional numeric states before ordering."
    ],
    "practice": [
      "Which predicate distinguishes None from a valid zero price?|price is None|not price|price==0|bool(price)|Identity with None does not misclassify zero as missing.",
      "How does raw text order compare \"10\" and \"2\"?|\"10\" comes first|\"2\" comes first|They compare equal|They cannot be strings|Lexicographic comparison sees character one before character two.",
      "Which conversion key gives numeric order for valid integer strings?|int|str|len only|repr|Integer conversion produces magnitude-comparable numeric keys.",
      "Why put a missing flag first in a tuple key?|Separate present/missing|It removes every duplicate|It makes all prices strings|It avoids every validation rule|The first tuple component establishes the group order before price comparison.",
      "Does casefold alone define locale-sensitive collation for every language?|No|Yes|Only if every string is uppercase|Only for long strings|Case normalization is different from language-specific collation rules.",
      "What is dangerous about treating NaN as an ordinary ordered price?|Exceptional NaN comparisons|It is always larger than infinity|It cannot be stored in Python|It always equals every zero|NaN has exceptional comparison semantics that need an explicit policy."
    ],
    "formal": [
      "What policy does (price is None, normalized_price) express with ascending sort?|Missing prices after present prices|Missing prices first always|Descending price regardless of flag|Random placement for missing values|False for present records sorts before True for missing records.",
      "What is needed before sorting mixed raw price types reliably?|Comparable normalized keys|A larger recursion limit only|A FIFO queue|Unique record names only|The key must represent a coherent order across accepted inputs.",
      "Does zero mean missing under the demonstrated contract?|No|Yes|Only for even-length rows|Only for imported data|Zero is a legitimate numeric price and None is the missing marker.",
      "A catalog uses key=lambda r:r.price or 999. What can go wrong?|Zero prices are treated as fallback values|None becomes a unique numeric object|Every positive price is deleted|The sort becomes unstable automatically|The or expression treats zero as false, conflating it with missing data.",
      "A report sorts valid integer strings without a conversion key. Which order can appear?|1,10,2|1,2,10|10,2,1 always|All values compare equal|Text order differs from numeric magnitude after shared prefixes.",
      "An import contains a malformed price \"unknown\" and code blindly applies int. What contract is needed?|Validation and an explicit invalid-data policy|Assume every malformed value equals zero|Ignore all conversion errors silently|Reverse the list before parsing|Parsing failures must be handled rather than assigned unintended business meaning.",
      "A missing-last key substitutes zero only when price is None and places the missing flag first. Does a real zero tie with missing?|No, their first key components differ|Yes, both second components are zero|Only if the list is stable|Only for negative identifiers|The flag separates the groups before the placeholder component is considered.",
      "A team uses casefold for customer names and claims culturally correct ordering in every locale. What is overstated?|Case folding is not collation|Casefold changes no characters ever|Unicode strings cannot be sorted|Locale never affects order expectations|Language-specific collation can require more than case-insensitive normalization.",
      "A pricing stream contains float NaN values. Which ordering strategy is defensible?|Documented NaN separation|Assume NaN equals every ordinary price|Assume NaN always compares greater|Remove all numeric keys|An explicit exceptional-value bucket makes the intended ordering policy coherent.",
      "A finance export must order real zero prices correctly, keep missing prices last, reject invalid text and preserve arrival order among equal normalized prices. Which design fits?|Validate, normalize, stable missing-flag key|Use raw mixed-type comparison and catch every exception as a zero price|Use price or a sentinel with no flag|Randomly shuffle missing records after sorting|Validation preserves data meaning, the flag separates missing from zero, and stable keys preserve equal-price input order."
    ]
  },
  {
    "slug": "sort-at-scale",
    "title": "Budget key computation, top-k work and sorted runs",
    "intro": "A data operations team needs a sorted export, a top-ten dashboard and repeated record searches. These workloads share ordering concepts but have different output and storage requirements. Use the requested result size, key cost and memory limit to select a plan.",
    "sections": [
      [
        "Separate comparisons from key work",
        "A sort performs ordering work on n records, while key extraction may parse or normalize large payloads. Built-in key evaluation runs once per record for one sort, but repeated independent sorts recompute it. Decorate records with validated keys when reuse is valuable and account for retained key bytes. A cache also needs invalidation when payloads change.",
        "For a top-k result, a size-k heap can avoid sorting all n records. It processes each value while retaining k candidates, then orders only those k if the output must be sorted. For a full export with m output records, writing every requested record remains an unavoidable output cost."
      ],
      [
        "Memory and I/O plan",
        "When data exceed available memory, form sorted runs that fit a declared memory budget and merge those runs incrementally. A multiway merge uses one current item per run plus buffers, and each emitted record advances the run that supplied it. Existing sorted runs can be merged without resorting their entire union.",
        "Stable external ordering may require retaining original sequence keys or consistent run/tie policies. A lazily merged iterator only keeps limited frontier state, but materializing it into a list restores output-size memory use. Distinguish algorithmic comparison count, key bytes, run buffers and disk traffic when estimating whether an export meets a business deadline."
      ]
    ],
    "problem": "Use built-in keys for top-k selection and lazily merge sorted runs.",
    "steps": [
      "State the ordering, range and cost-model assumptions for the fixture.",
      "Trace each interval update or ordering decision against its invariant.",
      "Check the resulting values and derive comparison, movement and storage bounds separately."
    ],
    "code": "import heapq\nrows=[(\"A\",5),(\"B\",9),(\"C\",3),(\"D\",8)]\nprint(heapq.nlargest(2,rows,key=lambda r:r[1]))\nrun1=[1,4,7]; run2=[2,3,9]\nmerged=heapq.merge(run1,run2)\nprint(next(merged),next(merged))\nprint(list(merged))",
    "expect": "[('B', 9), ('D', 8)]\n1 2\n[3, 4, 7, 9]",
    "limit": "The fixture uses tiny sorted runs and top-k records. It demonstrates results and lazy consumption, not production throughput or a universal built-in implementation bound.",
    "mistakes": [
      "Wrapping a lazy merge in list materializes all remaining outputs and changes the memory budget.",
      "Caching normalized keys without invalidation can sort by stale business values."
    ],
    "takeaways": [
      "Match the algorithm to full-sort, top-k or merge output requirements.",
      "Include key storage, buffers and output retention in scale estimates."
    ],
    "practice": [
      "What must be true of inputs to a standard sorted-run merge?|Compatibly sorted runs|Every run has equal length|Every key is unique|Every run fits one scalar|The merge frontier assumes each run exposes its smallest remaining item.",
      "What does materializing a merge iterator change?|Output storage becomes proportional to results|The input runs become unsorted|All comparisons disappear|The merge becomes automatically stable across arbitrary policies|A list retains every emitted output reference.",
      "What result does top-k selection request?|Only the k best records|Every permutation of records|Only duplicate keys|A full lookup index always|The required output can be much smaller than n.",
      "Why can decorated keys help repeated sorting or searching?|Validated extraction results can be reused|All key storage becomes free|Records can mutate without invalidation|Each comparison reparses the payload|Retaining keys avoids repeated expensive computation under a valid consistency policy.",
      "What external-sort step bounds in-memory run formation?|Limit each batch to the memory budget|Load the entire dataset first|Store every run in one Python list|Use an unlimited recursion depth|Each sorted run is created from a batch sized to available resources.",
      "Does a tiny correctness fixture prove a production latency target?|No|Yes|Only if all outputs print|Only for numeric keys|Performance depends on workload, key cost, hardware and I/O beyond the verified outputs."
    ],
    "formal": [
      "Which workload can avoid a full sorted output when k is small?|Top-k selection|A request for all rows in order|A stable complete export|An audit requiring every record|Only the k best results are requested.",
      "What frontier does a multiway merge retain?|Each active run head|Every historical emitted row|All permutations of runs|Only the largest source file|The next global output is chosen among current run heads.",
      "What must be updated if a cached key\u2019s source record changes?|Cached key validity|Only the output filename|The Python recursion limit|Every unrelated record identity|Stale keys no longer represent current record values.",
      "A dashboard needs ten best scores from one million records. Which plan limits retained candidates?|A size-ten heap|A full million-row sorted copy|All million permutations|A stack of every score|The heap retains only the current top ten while scanning.",
      "An export exceeds RAM. Which strategy matches bounded memory?|Sort bounded runs, then merge|Read all rows into one unbounded list|Increase recursion until all rows fit|Copy the full dataset twice|External merging separates bounded run formation from incremental full output.",
      "A report repeatedly sorts unchanged large JSON payloads by an expensive parsed field. What optimization has a clear cost trade-off?|Retain validated keys with a byte budget|Parse the JSON at every comparison deliberately|Cache results without any source identity|Remove ordering requirements without user intent|Key reuse saves repeated extraction while consuming storage and requiring validity rules.",
      "A merge iterator uses O(r) frontier entries for r runs, then the caller calls list on a million outputs. What additional storage appears?|O(N) output references|No extra storage|O(log r) bits only|One scalar output slot|Materialization retains the full result, beyond the merge frontier.",
      "A sorted search index caches keys but the records are updated independently. What correctness risk arises?|Keys and payload order can diverge|The keys automatically re-sort the payloads|The index becomes immutable by definition|Every update is rejected by bisect|Key consistency and index maintenance require an explicit update policy.",
      "A full export needs n records but a developer claims O(k) total output work because it used top-k internally. What is wrong?|Full output needs Omega(n) writes|All exports require n! output|Top-k always sorts all records|A heap removes output writes|The requested complete output cannot be smaller than n records.",
      "An external report merges r ordered runs containing N total records and streams results using a heap frontier. Which bound fits fixed-cost comparisons, excluding run buffers?|O(N log r) work; O(r) frontier|O(log N) total work and O(1) frontier|O(N squared) work necessarily|O(r) time independent of N|Each output advances one run and updates an r-entry priority frontier, while streaming avoids retaining all N outputs."
    ]
  }
],['Doc/library/bisect.rst','Doc/howto/sorting.rst','Doc/library/heapq.rst']);
