'use strict';
const {course}=require('./wave4-dsa-helper');
module.exports=course("arrays-strings-hashing",[
  {
    "slug": "sorted-two-pointers",
    "title": "Prove which endpoint a sorted two-pointer search can discard",
    "intro": "A ticketing service wants two seat prices with a fixed combined budget. When prices are sorted, a left and right pointer can reject whole groups of impossible pairs. The speedup comes from ordering, not from using two variables.",
    "sections": [
      [
        "Use ordering as an elimination proof",
        "Maintain left < right and compare prices[left]+prices[right] with the target. If the sum is too small, every pair using the current left and any smaller right is also too small. Advancing left therefore cannot discard a valid pair. If the sum is too large, decreasing right is safe by the symmetric argument. Each step eliminates at least one endpoint, giving linear pointer movement after sorting.",
        "Sorting is a separate cost and may destroy the association with original indexes. If the application needs the original seat identifiers, sort records carrying those identifiers or use a different method. Distinct indexes matter: one price cannot be used twice merely because twice its value reaches the target."
      ],
      [
        "Specify results and duplicates",
        "A routine that returns any one pair has a different contract from one that returns all distinct value pairs or every matching index pair. Duplicate prices can create many index pairs, so all-results output can exceed linear size. Stop rules and duplicate-skipping rules must match the chosen contract.",
        "The fixture returns the first matching pair of sorted positions and their prices. It also checks a missing target. The argument assumes ordinary comparable numbers and sorted input. It does not validate arbitrary floating-point financial calculations; production currency typically needs an agreed fixed-point or decimal representation and explicit rounding rules."
      ]
    ],
    "problem": "Find one pair of distinct sorted positions that reaches a requested total.",
    "steps": [
      "Compare the current endpoint sum with the target.",
      "Move only the endpoint justified by sorted order.",
      "Return a pair only while the positions remain distinct."
    ],
    "code": "def pair(xs,target):\n    left,right=0,len(xs)-1\n    while left<right:\n        total=xs[left]+xs[right]\n        if total==target: return (left,right)\n        if total<target: left+=1\n        else: right-=1\n    return None\nprint(pair([2,4,7,11],9))\nprint(pair([2,4,7,11],8))",
    "expect": "(0, 2)\nNone",
    "limit": "The Python fixture validates one-pair search on sorted integer prices. It does not enumerate all duplicate index pairs or define monetary rounding.",
    "mistakes": [
      "Do not move an endpoint using the ordering proof on unsorted input.",
      "Do not return the same index twice when the contract requires two items."
    ],
    "takeaways": [
      "Every pointer movement needs a safe elimination argument.",
      "Sorting cost and output multiplicity belong in the complete contract."
    ],
    "practice": [
      "Which precondition supports endpoint elimination in the shown pair search?|Sorted prices|Unique ticket labels|Equal input lengths|Positive target only|Sorted order bounds every candidate paired with the chosen endpoint.",
      "If the endpoint sum is too small, which move is justified?|Advance the left index|Decrease the right index|Advance both at random|Return the current pair|Increasing the smaller endpoint can raise the sum without discarding a feasible pair.",
      "Why does the loop require left < right?|Distinct item positions|Stable sort output|A positive target sum|Unique input values|The same array element cannot serve as both chosen items.",
      "A seat list is sorted after IDs are discarded. What requirement can no longer be met reliably?|Original seat identity|Existence of sorted values|Comparison of endpoint sums|Counting pointer moves|Sorting prices alone loses their original identifier association.",
      "What is the pointer movement bound after sorting?|O(n)|O(n squared)|O(log n)|O(n factorial)|Each pointer moves in one direction at most the length of the list.",
      "A service must return every matching duplicate index pair. What extra cost can dominate?|Output size|Only one endpoint move|Only target formatting|Only the sort key name|Many duplicate items can produce a quadratic number of valid index pairs."
    ],
    "formal": [
      "What invariant limits a sorted pair search to distinct positions?|left remains below right|left always equals right|Both indexes stay at zero|Both values remain unique|The search interval uses two different positions until it is exhausted.",
      "Which cost is separate from a two-pointer scan on unsorted input?|Sorting the records|Comparing one endpoint sum|Advancing one position|Testing the loop boundary|The linear scan assumes a sorted representation that may first require preparation.",
      "For sorted [2,4,7,11] and target 9, which price pair is valid?|2 and 7|4 and 4|2 and 11|7 and 11|Two plus seven reaches nine at distinct positions.",
      "A travel service moves right leftward when the sum is below budget. Why is that movement not justified?|It cannot raise this sum|It always preserves a match|It increases the small value|It guarantees unique indexes|A smaller right value cannot repair a too-small sum with the same left endpoint.",
      "A billing API allows negative prices but keeps the values sorted. Does the endpoint elimination proof still hold for exact integer sums?|Yes; order is sufficient|No; all values must be positive|Only when target is positive|Only with unique values|The monotonic ordering argument does not require all values to be nonnegative.",
      "A service needs original record IDs after sorting amounts. Which representation preserves that requirement?|Sort amount-ID records|Keep amounts only|Keep only sorted positions|Return the target twice|Carrying identifiers with values retains their association through reordering.",
      "A sorted ticket list has four distinct seats priced [2,2,2,2], and the target is 4. A routine returns immediately on its first endpoint match. How many pairs can it return versus the required count if the contract requests every distinct index pair?|Returns 1; required 6|Returns 4; required 4|Returns 6; required 6|Returns 1; required 1|There are four choose two=6 matching distinct index pairs. Early return produces only one, so correctness for finding any pair does not establish complete enumeration.",
      "Sorted price-ID rows are [(3,A),(3,A),(7,B)] because one record was delivered twice. The target is 6 and the contract requires two different logical seat IDs. What must a match of the first two positions account for?|Distinct indexes can repeat one ID|Distinct indexes prove distinct IDs|Sorting guarantees ID uniqueness|A sum match authorizes both records|The two positions both refer to A. A position-based proof must not silently replace the required distinct logical-identity contract; deduplication or explicit identity handling is necessary.",
      "A catalog has 200 distinct items all priced 5. A request asks for all index pairs totaling 10, and each emitted pair occupies 16 modeled bytes in a materialized result. A 256 KiB cap covers that result. What follows?|19900 pairs;318400 bytes; reject|200 pairs;3200 bytes; admit|39800 pairs;636800 bytes; admit|19900 pairs;159200 bytes; admit|There are 200 times 199 divided by 2=19900 unordered pairs. Sixteen bytes each require 318400 bytes, exceeding 262144 bytes even before other overhead.",
      "A static list of 1000 prices serves 200 pair queries. Sorting costs 10000 counted comparisons once, and each subsequent scan costs at most 999 endpoint comparisons. IDs are retained and arithmetic is bounded. Which total upper count follows when sorting is reused?|209800 comparisons|2199800 comparisons|100999 comparisons|2000000 comparisons|One reused sort contributes 10000 and 200 scans contribute 199800, for 209800. Sorting separately for every query would instead repeat the preparation cost."
    ]
  },
  {
    "slug": "nonnegative-sliding-window",
    "title": "Maintain a variable window with a monotonic validity rule",
    "intro": "A courier wants the longest consecutive run of parcel weights that fits a loading limit. With nonnegative weights, expanding a window cannot reduce its sum, so shrinking its left edge can safely restore the limit.",
    "sections": [
      [
        "Define the maintained window",
        "Treat the current range as inclusive left through right and maintain its sum as right advances. While the sum exceeds the limit, subtract the leftmost value and advance left. After shrinking, the range satisfies the limit, so its length is a valid candidate. Each input enters and leaves at most once; the nested while does not imply quadratic movement.",
        "The key assumption is nonnegative weights. With negative values, a currently excessive window may become feasible after later expansion, and discarding its left side can lose the optimum. Choose an algorithm for the actual validity structure instead of applying a sliding-window recipe to every contiguous-subarray problem."
      ],
      [
        "Handle boundaries before optimizing",
        "Initialize best length to zero so empty input and no feasible nonempty window are represented correctly. A nonnegative capacity is part of this fixture’s input contract. Zero weights remain valid and can extend a window without changing the sum. If an individual item exceeds the limit, shrinking can remove that entire candidate before processing later items.",
        "Business reporting must distinguish a longest interval from a maximum count of arbitrary selected items. The fixture keeps contiguity and returns a length rather than the interval itself. To return an interval, record the best boundaries when an improvement occurs and decide a deterministic policy for ties."
      ]
    ],
    "problem": "Compute the longest contiguous nonnegative-weight interval within capacity.",
    "steps": [
      "Add the next right-end weight to the running sum.",
      "Shrink from the left until the sum is within capacity.",
      "Update the best length only after restoring validity."
    ],
    "code": "def longest(xs,limit):\n    left=total=best=0\n    for right,value in enumerate(xs):\n        total+=value\n        while total>limit and left<=right:\n            total-=xs[left]; left+=1\n        best=max(best,right-left+1)\n    return best\nprint(longest([2,1,3,1,1],4))\nprint(longest([0,0,5],0))\nprint(longest([],4))",
    "expect": "2\n2\n0",
    "limit": "The algorithm assumes nonnegative integer values and a nonnegative capacity. It is not a solution for arbitrary signed-sum intervals.",
    "mistakes": [
      "Do not shrink away an interval before establishing that future expansion cannot repair it.",
      "Do not update the best length while the current window is still invalid."
    ],
    "takeaways": [
      "A sliding-window proof depends on a monotonic validity condition.",
      "Aggregate pointer movement can be linear despite nested loops."
    ],
    "practice": [
      "Which assumption supports the sum-window shrinking rule here?|Nonnegative weights|Distinct parcel IDs|Sorted parcel weights|A positive best length|Adding nonnegative values cannot reduce the window sum.",
      "When should the best window length be updated?|After validity is restored|Before adding the new value|Only when the window is empty|Before every left movement|Only a feasible current interval can contribute a valid candidate.",
      "Why can the nested shrink loop still be linear overall?|Each element exits once|The loop has one source line|Every window has equal size|All inputs must be sorted|The left pointer never moves backward, limiting total removals.",
      "A route has weights [0,0,5] and capacity 0. What is the longest valid interval length?|2|0|1|3|The two zero-weight parcels form a contiguous interval within capacity.",
      "What is the empty-input answer for this length contract?|0|1|-1|An infinite length|No nonempty interval exists, so the initialized best length remains zero.",
      "A ledger includes negative adjustments. What must be reconsidered before using this algorithm?|Monotonic sum assumption|Only the variable names|Only output formatting|Only whether IDs are unique|A later negative adjustment can lower a currently excessive sum."
    ],
    "formal": [
      "What does a variable sliding window maintain?|A contiguous input range|An arbitrary set of values|Every pair of indexes|Only sorted input prefixes|The boundaries delimit adjacent elements of the original order.",
      "What prevents the left pointer from causing quadratic total removals?|It moves only forward|It starts at zero|It has an integer type|It uses a short identifier|Each element can leave the maintained interval at most once.",
      "For [2,1,3,1,1] with limit 4, what maximum valid length exists?|2|3|4|5|Every three-element interval exceeds four, while several two-element intervals satisfy the limit.",
      "A shipment scan evaluates an interval before shrinking its excessive sum. What defect can result?|Counting an invalid interval|Losing all zero weights|Sorting the route silently|Duplicating parcel identifiers|A best-length update must use a range that satisfies the capacity constraint.",
      "A route has a single weight larger than capacity, followed by two small weights. What should shrinking permit?|Discard the heavy candidate|Reject every later parcel|Keep the heavy weight forever|Assume the route is sorted|Removing the excessive item allows later valid intervals to be considered.",
      "A longest-window API is changed to choose any feasible parcel subset. What no longer matches?|The contiguity contract|The array element type|The number of loop variables|The use of integer sums|A contiguous-window solution does not optimize arbitrary selections.",
      "A signed ledger is [6,-5] with a maximum allowed sum of 1. A nonnegative-window routine removes 6 immediately after reading it, then sees-5. What optimal-length result can that rule miss?|Length 2 from the whole ledger|Length 1 from the first entry|Length 0 as the only valid result|No result because all values are positive|The two-entry total is 1, so the full interval is valid. A later negative entry can repair the excess, invalidating the nonnegative elimination proof.",
      "A telemetry sequence is [0,0,2,0,0] with capacity 0. The API requires the longest feasible interval and the earliest start on ties. Which length/start pair is correct?|Length 2; start 0|Length 4; start 0|Length 2; start 3|Length 5; start 0|The positive value splits the zero runs. Both runs have length 2, so the earliest-start rule chooses the first run rather than joining across the invalid value.",
      "A nonnegative-window scan processes [2,2,2] with limit 4 and visits right endpoints in increasing order. Equal best lengths must keep the earliest start. Which best-state update satisfies that tie rule?|Replace only on strictly longer windows|Replace on every equal-length window|Keep only the latest left boundary|Reset the best state after every shrink|The windows starting 0 and 1 both have length 2. Updating only for a strictly longer interval preserves the first, while replacing on equality chooses the later start.",
      "A loading scan handles 5000 nonnegative weights. Count only additions when a value enters the window and subtractions when it leaves; comparisons and best-state updates are excluded. Which bound follows from monotone pointers?|At most 10000 sum updates|Exactly 25000000 sum updates|At most 5000 total updates always|At mostlog2(5000) updates|Each of 5000 values enters once and can leave at most once, so these counted updates total at most 10000. The bound is for the named operations, not all machine instructions."
    ]
  },
  {
    "slug": "prefix-sums",
    "title": "Answer interval totals with explicit prefix boundaries",
    "intro": "A retail dashboard repeatedly asks for total sales between two day boundaries. Prefix sums move repeated addition into one preprocessing pass, but every query still needs a precise inclusive or half-open interval convention.",
    "sections": [
      [
        "Build a zero-based half-open contract",
        "Define prefix[0]=0 and prefix[i+1]=prefix[i]+values[i]. Then the sum over indexes left through right-1 is prefix[right]-prefix[left]. The extra leading zero makes empty prefixes and ranges beginning at zero follow the same formula. Query bounds must satisfy zero <= left <= right <= n.",
        "Building the array takes linear time and additional linear storage under bounded arithmetic. Each static interval query uses two indexed accesses and one subtraction. The trade-off is favorable for many queries over unchanged data; it does not make updates free. Changing one input value invalidates every later stored prefix unless another data structure or rebuild policy is used."
      ],
      [
        "Distinguish sums from position selection",
        "Prefix sums support negative values because the range identity is algebraic, unlike the nonnegative sliding-window proof. Searching by cumulative amount may need monotonic prefixes, which signed values can break. Keep the range-query identity separate from assumptions used by a binary search over prefix values.",
        "The fixture checks an interval, an empty interval and the entire input. Monetary units and overflow handling remain part of a production contract. Python integers avoid fixed-width overflow at a cost that grows for very large integers; a constant-time arithmetic model assumes the numeric width is suitably bounded."
      ]
    ],
    "problem": "Build a leading-zero prefix array and answer half-open interval sums.",
    "steps": [
      "Begin the prefix array with zero.",
      "Append each cumulative total exactly once.",
      "Subtract the prefix at the left boundary from the prefix at the right boundary."
    ],
    "code": "xs=[4,-1,7,2]\nprefix=[0]\nfor x in xs: prefix.append(prefix[-1]+x)\nprint(prefix)\nprint(prefix[3]-prefix[1])\nprint(prefix[2]-prefix[2])\nprint(prefix[4]-prefix[0])",
    "expect": "[0, 4, 3, 10, 12]\n6\n0\n12",
    "limit": "The actual fixture verifies static integer range identities. It does not implement efficient online updates or a monetary rounding policy.",
    "mistakes": [
      "Do not mix inclusive right endpoints with a half-open subtraction formula.",
      "Do not reuse stale prefixes after changing the underlying data."
    ],
    "takeaways": [
      "A leading zero makes boundary cases uniform.",
      "Preprocessing, query and update costs must be reported separately."
    ],
    "practice": [
      "What is prefix[0] in the shown convention?|0|The first input value|The final input total|The input length|A leading zero represents the sum of no elements.",
      "Which formula returns the half-open range [left, right)?|prefix[right]-prefix[left]|prefix[right]+prefix[left]|prefix[left]-prefix[right]|prefix[right-left] always|Subtracting the earlier cumulative total removes values before left.",
      "Can the static range-sum identity handle negative values?|Yes|No|Only when all prefixes grow|Only for sorted inputs|The subtraction identity does not require cumulative sums to be monotonic.",
      "A price changes after prefix construction. What can happen to later queries?|They use stale totals|They rebuild automatically|They become sorted queries|They must all return zero|Stored cumulative values must be updated or rebuilt after the source changes.",
      "What is the sum of an empty half-open range [i,i)?|0|prefix[i]|The full input sum|The value at i|The formula subtracts the same prefix value from itself.",
      "A team binary-searches prefix totals despite signed increments. Which assumption may fail?|Monotonic cumulative totals|The range-sum identity|The existence of array indexes|The leading zero convention|Negative increments can make cumulative totals decrease."
    ],
    "formal": [
      "What does prefix[i] represent under this course’s convention?|Sum before index i|Value only at index i|Number of distinct values|Maximum value through i|The prefix at a boundary totals all elements strictly before it.",
      "Which cost does a prefix array pay before static queries?|Linear preprocessing|Constant preprocessing always|Quadratic sorting always|No additional storage ever|Every input value contributes to the cumulative array once.",
      "For [4,-1,7,2], what is the sum over [1,3)?|6|10|8|12|The selected values are minus one and seven.",
      "A university dashboard includes both days 2 and 5 by index. Which half-open boundaries express that inclusive request?|[2,6)|[2,5)|[1,5)|[3,6)|The exclusive endpoint must be one position beyond the last included index.",
      "A finance report builds one prefix array and answers q static ranges. Which bounded-arithmetic time model fits?|O(n+q)|O(nq) necessarily|O(log n+q)|O(n squared+q squared)|Building takes n work and each query adds constant work.",
      "A sales cell changes in the middle of an immutable snapshot. What must happen before using old prefixes for the new snapshot?|Update or rebuild state|Only rename the snapshot|Only change query labels|Only sort the queries|The cumulative state must correspond to the actual underlying version.",
      "A static signed array is [5,-8,7], with leading-zero prefixes [0,5,-3,4]. The report asks for [1,3), while another feature wants to binary-search these prefixes by amount. Which conclusion is correct?|Range total-1; monotonic search unproved|Range total 4; monotonic search valid|Range total-3; all prefix queries invalid|Range total 12; negatives can be ignored|Prefix[3]-prefix[1]=4-5=-1 is valid algebra. The prefix sequence is not monotone, so an amount-based binary search needs different assumptions or a different design.",
      "A Python prefix array is [0,10,30,60]. A client sends left=-1, right=2 to a half-open range API. The server subtracts prefixes without validating bounds. What occurs and what is required?|It yields-30; reject the invalid boundary|It raises automatically; no check needed|It yields 30; treat negatives as zero|It yields 60; use the final prefix always|Python prefix[-1] is 60, so 30-60=-30 can look like a legitimate signed sum. The API must enforce zero<=left<=right<=n explicitly.",
      "A static prefix array over 1000 values is rebuilt after each of 10000 point updates, then answers one final range query. Count one operation per rebuild element and two prefix reads for the query. What work is modeled?|10000002 operations|10002 operations|20000 operations|1002 operations|Repeated full rebuilds contribute 1000 times 10000=10000000 operations, then the final query adds two reads. Cheap static queries do not make online maintenance cheap.",
      "A report has 100000 unchanged records and 100000 static range queries; a second service has one query after each of 100000 point updates. Both demand exact sums. Which design conclusion follows?|Separate static and dynamic workload models|Use one frozen prefix array unchanged for both|Discard negative updates to preserve speed|Assume preprocessing makes all updates free|Static prefixes amortize one build across unchanged queries. Interleaved updates require maintained state and a separate update/query cost model rather than reuse of stale cumulative totals."
    ]
  },
  {
    "slug": "immutable-text-assembly",
    "title": "Build text from fragments without repeated prefix copying",
    "intro": "An invoicing service assembles many line fragments into one document. Strings are immutable values, so a design that repeatedly constructs the entire accumulated prefix can perform much more copying than the final output size suggests.",
    "sections": [
      [
        "Separate a value from its construction strategy",
        "Immutability means an existing string’s characters are not modified in place through indexed assignment. Concatenation returns a string value; implementations may optimize particular cases, so do not infer exact allocation behavior from syntax alone. Under a straightforward prefix-copying model, adding one character at a time copies lengths 1+2+...+n, producing quadratic aggregate copied characters.",
        "A common Python construction strategy collects fragments in a list and uses separator. join(fragments). The output still requires storage proportional to its total characters. The fragment list adds reference storage, so linear construction does not imply constant memory. For very large documents, a streaming writer may better match the output contract than one final in-memory string."
      ],
      [
        "Preserve delimiters and content semantics",
        "Choose the separator explicitly. Joining invoice fields with no delimiter can create ambiguous boundaries; joining already-delimited fragments can duplicate separators. A CSV or JSON document needs its format’s escaping and serialization rules, not ad hoc delimiter concatenation when fields can contain special characters.",
        "The fixture compares an explicit copy-count model with actual joining of fragments. It checks the resulting text and total character count, not a universal performance claim about Python’s += implementation. Benchmark the complete serializer and consumer when choosing between a final string and incremental output."
      ]
    ],
    "problem": "Assemble invoice fragments and calculate the cost of a deliberately naive prefix-copying model.",
    "steps": [
      "Sum the characters in the final fragments.",
      "Use join to create the intended separated representation.",
      "Compare final length with cumulative copied-prefix lengths in the stated model."
    ],
    "code": "parts=[\"AB\",\"CD\",\"EF\"]\nprint(\"-\".join(parts))\nprint(sum(map(len,parts)))\nprint(sum(2*i for i in range(1,len(parts)+1)))",
    "expect": "AB-CD-EF\n6\n12",
    "limit": "The fixture verifies text content and an abstract copying sum. It does not measure or prescribe every CPython concatenation optimization.",
    "mistakes": [
      "Do not claim every runtime executes += with the same allocation strategy.",
      "Do not substitute delimiter joining for a serializer when fields need escaping."
    ],
    "takeaways": [
      "Count total copied characters, not just append statements.",
      "Linear output size still requires linear output storage when materialized."
    ],
    "practice": [
      "What does string immutability prevent?|Mutating an existing character|Creating another string value|Reading characters by index|Returning a joined string|String values do not support in-place character mutation.",
      "Which operation assembles string fragments with one declared separator?|separator. join(parts)|parts. sort()|parts. count(separator)|separator. index(parts)|Joining places the separator between the supplied string fragments.",
      "What is the final character count of AB,CD,EF without separators?|6|3|9|12|Each of three fragments contains two characters.",
      "A report joins fields that may contain commas into CSV without escaping. What is missing?|Format-aware serialization|Only a larger string buffer|Only a sorted field list|Only shorter field names|CSV delimiters and quotes need format-specific handling.",
      "What work does the naive prefix-copy model sum?|All constructed prefix lengths|Only the final fragment count|Only the separator width|Only the input list indexes|Each constructed prefix is copied under that explicit model.",
      "A joined document is too large for memory. What contract-compatible alternative may help?|Incremental output writing|Another whole-document copy|Sorting all characters first|Removing content checks|Streaming can avoid retaining the complete result when the consumer accepts incremental output."
    ],
    "formal": [
      "What does a successful string concatenation produce conceptually?|A string value|A mutable character slot|A changed original character|An automatically parsed document|Immutability concerns existing values, while operations can return new values.",
      "Which quantity bounds a materialized text result’s storage?|Total output characters|Only fragment count|Only the first fragment|Only separator spelling|The returned text must represent the full output content.",
      "What does joining [AB,CD,EF] with hyphens produce?|AB-CD-EF|ABCDEF|AB--CD--EF|AB-CD-EF-|The separator is inserted between fragments without an automatic trailing separator.",
      "A billing loop creates a new full prefix for each of n one-character fragments. Which model describes copied characters?|Theta(n squared)|Theta(log n)|Theta(1)|Theta(n) necessarily|The prefix lengths sum from one through n.",
      "A developer observes an optimized += case and claims every Python concatenation is linear. What is unsupported?|Universality across runtimes|The observed sample output|The existence of strings|The measured environment|One implementation path does not establish all runtime and aliasing cases.",
      "A service must return one final string containing N characters. Which claim is incorrect?|Constant output storage|Output length N|A possible streaming alternative|Immutable string semantics|A complete materialized value cannot occupy constant space independent of its content length.",
      "A document has 1000 fragments of 20 characters each. The implementation retains 1000 fragment references and materializes one joined result without separators. What must its slot/character model include?|1000 references plus 20000 output characters|Only 1000 characters in total|Only 20 output characters|A constant number of fragment references|The fragment list retains one reference per fragment and the final result contains every fragment’s content. Linear assembly does not remove either storage category.",
      "An export contains fields [Acme, Inc] and [He said \"yes\"], and a receiver expects a CSV parser to recover exactly two original fields. Which operation preserves that contract?|A CSV serializer with correct quoting|Concatenate raw fields with one comma|Delete every comma from field contents|Wrap the whole row in one quote pair|Delimiters and embedded quotes are part of field content. Format-aware quoting and escaping preserve both boundaries and original values, while ad hoc joining or deletion changes the contract.",
      "A producer writes 100 chunks of 1 MiB using a 1 MiB reusable buffer, but its HTTP adapter retains every chunk until completion. Excluding metadata, which peak retained response storage must be considered?|About 100 MiB plus producer state|Only 1 MiB for the whole flow|Only 100 bytes for chunk indexes|Constant storage independent of chunks|The adapter materializes the full 100 MiB response. Bounded producer buffering cannot prove bounded end-to-end retention.",
      "An abstract serializer appends 1000 one-character fragments by copying the full growing prefix each time. Another joins stored fragments once. Both must return the complete 1000-character value. Which statement matches the stated copy model?|Naive copies 500500; both return 1000 chars|Naive copies 1000; join returns constant chars|Both must copy 1000000 characters|Join eliminates all required output storage|The prefix-copy sum is 1000 times 1001 divided by 2=500500. Different construction costs do not change the size of the required materialized text."
    ]
  },
  {
    "slug": "unicode-key-contracts",
    "title": "Normalize text keys according to an explicit equivalence policy",
    "intro": "A customer import receives visually identical names encoded with different Unicode sequences. A code-point string comparison may treat them as different. Text-key design must specify what counts as equivalent before normalization is applied.",
    "sections": [
      [
        "Distinguish bytes, code points and displayed text",
        "Python strings represent Unicode text, while bytes represent encoded data. The number of code points is not necessarily the number of user-perceived characters or the number of encoded bytes. A letter followed by a combining accent can have the same rendered appearance as a precomposed accented code point but a different raw string length.",
        "Unicode normalization forms address specified canonical or compatibility equivalences. NFC composes canonical sequences where possible, while NFD decomposes them. NFKC and NFKD additionally apply compatibility transformations and can erase distinctions that an application might wish to retain. Normalization is not a general identity, authorization or visual-spoofing detector."
      ],
      [
        "Treat normalization as persisted business logic",
        "Define one key policy and apply it consistently at insertion and lookup. Case folding can support some case-insensitive comparison policies, but it can also merge distinct original spellings. Keep the original display value when auditability matters, and decide what happens when two inputs map to one normalized key. A migration of key policy needs collision detection before records are merged.",
        "The fixture compares canonical-equivalent accent encodings and demonstrates a case-fold expansion. It uses the installed Python Unicode database, whose version can be queried for reproducibility. The example does not implement grapheme segmentation, locale-specific collation, secure username policy or a complete international naming system."
      ]
    ],
    "problem": "Compare raw code-point strings and their NFC-normalized key values.",
    "steps": [
      "Construct composed and decomposed forms explicitly.",
      "Normalize both with the same named form.",
      "Inspect case-fold behavior separately from normalization."
    ],
    "code": "import unicodedata as u\na=\"café\"; b=\"café\"\nprint(a==b,len(a),len(b))\nprint(u.normalize(\"NFC\",a)==u.normalize(\"NFC\",b))\nprint(\"Straße\".casefold())",
    "expect": "False 4 5\nTrue\nstrasse",
    "limit": "The real Python normalization behavior is verified. This is not a grapheme counter, locale collation service or identity-security decision.",
    "mistakes": [
      "Do not use raw code-point count as a universal count of displayed characters.",
      "Do not merge normalized-key collisions without a stated business and audit policy."
    ],
    "takeaways": [
      "Text equality requires an explicit representation and equivalence contract.",
      "Normalization and case folding solve narrower problems than identity or spoofing."
    ],
    "practice": [
      "Can two canonically equivalent strings have different raw code-point lengths?|Yes|No|Only if both are ASCII|Only after numeric sorting|A composed character and a decomposed sequence can encode canonical-equivalent text.",
      "Which normalization form performs canonical composition?|NFC|NFD only|UTF-8|ASCII|NFC applies canonical decomposition followed by composition where defined.",
      "Does normalization alone prove that a username is safe from visual spoofing?|No|Yes for every script|Yes after removing spaces|Only when the name is short|Normalization addresses defined equivalences rather than all confusable-character risks.",
      "A database normalizes imports but not lookups. What defect may result?|Inconsistent key matching|Guaranteed unique users|Automatic locale sorting|A fixed byte length|Insertion and lookup must use the same key policy.",
      "What does Python casefold produce for Straße in this fixture?|strasse|straße|STRASSE|Strasse|Case folding can expand sharp s into two lowercase s characters.",
      "A new key policy merges previously distinct customer spellings. What must precede automatic consolidation?|Collision review|Only renaming the column|Only a longer key index|Only sorting the CSV|A normalization change can map multiple records to one key and needs explicit handling."
    ],
    "formal": [
      "What does UTF-8 encode?|Unicode text into bytes|A locale’s sort order|Every name’s identity|A grapheme index table|UTF-8 is a byte encoding rather than an equivalence or collation policy.",
      "Which normalization family includes compatibility transformations?|NFKC and NFKD|NFC and NFD only|ASCII and UTF-8|Uppercase and lowercase|The K forms include compatibility equivalences in addition to canonical handling.",
      "Why can café and cafe plus a combining accent compare unequal before normalization?|Different code-point sequences|Different database row counts|A mandatory decoding failure|A sorted-input requirement|Raw equality compares the actual code-point sequence.",
      "A university needs exact legal-name preservation but also a canonical search key. Which design separates the needs?|Keep display value and key|Replace every display value|Discard all accents always|Treat a key as legal identity|Original data can remain auditable while a declared derived key supports matching.",
      "A login system lowercases one code path and case-folds another. What should be corrected?|One consistent key policy|Only the password length|Only the UI label|Only the index capacity|Different transformations can produce inconsistent equivalence decisions.",
      "A form limits displayed characters by len(text). What limitation must be documented?|Code points differ from graphemes|Every code point is two bytes|len counts UTF-8 bytes|Normalization always fixes width|User-perceived characters can contain multiple code points.",
      "A name index currently uses NFC. A proposed NFKC migration maps two separately registered original spellings to one derived key. The originals must remain auditable and neither account may be silently selected. Which migration step is required?|Detect and resolve key collisions explicitly|Overwrite both originals with one key|Keep the earlier row and delete the other|Treat compatibility equality as account ownership|Compatibility normalization can merge distinctions. Collision handling and independent identifiers must preserve record identity and auditability before the new key policy is activated.",
      "Two usernames remain unequal after NFC but look alike in the interface. A reviewer approves automatic cross-account matching because both strings are normalized. Which reasoning is correct?|Normalization does not prove visual identity|Every normalized spelling is globally unique|Different normalized strings must look different|Canonical normalization verifies account ownership|Canonical equivalence is narrower than visual confusability and independent identity. A dedicated naming/security policy is still required for these unequal but similar-looking strings.",
      "A search policy case-folds Straße and STRASSE to the same key. The lookup returns two registered customer IDs, and the caller may read only one. What response preserves both matching and authorization boundaries?|Return authorized disambiguated candidates|Merge both registered customer accounts|Choose the first import row without checking|Authorize both because the search keys agree|A derived search key can identify candidate matches without proving that the records are one identity or that the caller may access both.",
      "A directory changes its normalization policy and Unicode database version. The old key index includes two records that the new policy merges, but original names and stable IDs must remain. Which rollout is sound?|Version keys; audit collisions; retain originals|Replace all IDs with the new normalized keys|Ignore the version because examples passed|Authenticate by whichever normalized row sorts first|Reproducible transformation metadata, collision review and stable identity are separate requirements. A passing small normalization fixture does not approve destructive record merging."
    ]
  },
  {
    "slug": "substring-prefix-invariants",
    "title": "Reuse matched prefixes when searching overlapping text patterns",
    "intro": "A log analyzer searches many records for an exact marker. When a partial match fails, restarting from the next text position can repeat comparisons. A prefix table records which already-matched suffix can also serve as the next pattern prefix.",
    "sections": [
      [
        "Build the prefix table",
        "For each pattern position i, store the length of the longest proper prefix of pattern[:i+1] that is also a suffix. Proper means shorter than the full substring. On a mismatch, replace the current matched length j with pi[j-1] and compare again. This reuses a verified prefix-suffix relationship instead of guessing a restart.",
        "The KMP search scans text while maintaining that the preceding j text characters match the pattern’s first j characters. A successful comparison increases j. A failure follows prefix links; aggregate increases and decreases bound the number of movements, giving linear work in text plus pattern lengths under constant-cost character comparisons."
      ],
      [
        "Preserve overlapping results and define empty patterns",
        "After a full match, set j to the longest proper border rather than zero if overlapping matches are required. For text ababa and pattern aba, the matches start at positions zero and two. Empty-pattern behavior needs a separate API contract; this fixture rejects an empty pattern rather than silently choosing all boundary positions.",
        "The fixture executes prefix construction and complete matching on short code-point strings. It does not perform regex matching, case-insensitive matching or Unicode equivalence transformations. If normalized text changes positions, a production system also needs a policy for mapping result offsets back to the original representation."
      ]
    ],
    "problem": "Find overlapping occurrences using a prefix-function fallback invariant.",
    "steps": [
      "Compute the pattern’s longest proper border at each position.",
      "Advance text while preserving the length of the current verified prefix match.",
      "After reporting a match, reuse its border to allow overlap."
    ],
    "code": "def matches(text,pattern):\n    if not pattern: raise ValueError(\"empty pattern\")\n    pi=[0]*len(pattern); j=0\n    for i in range(1,len(pattern)):\n        while j and pattern[i]!=pattern[j]: j=pi[j-1]\n        if pattern[i]==pattern[j]: j+=1\n        pi[i]=j\n    out=[]; j=0\n    for i,ch in enumerate(text):\n        while j and ch!=pattern[j]: j=pi[j-1]\n        if ch==pattern[j]: j+=1\n        if j==len(pattern):\n            out.append(i-j+1); j=pi[j-1]\n    return pi,out\nprint(matches(\"ababa\",\"aba\"))\nprint(matches(\"zzzz\",\"ab\"))",
    "expect": "([0, 0, 1], [0, 2])\n([0, 0], [])",
    "limit": "This implementation verifies exact code-point matching and overlap behavior. It is not a regex engine or normalized-offset mapping layer.",
    "mistakes": [
      "Do not reset to zero after every full match when overlaps are required.",
      "Do not include the entire substring as its own proper-prefix border."
    ],
    "takeaways": [
      "Prefix links reuse previously proved character relationships.",
      "Matching semantics and returned-offset representation must be explicit."
    ],
    "practice": [
      "What does a prefix-table entry record?|Longest proper border length|The number of input records|The first unmatched text index|Every possible regex group|A border is simultaneously a proper prefix and a suffix of the current pattern prefix.",
      "Why follow pi[j-1] after a mismatch?|Reuse a verified border|Skip every repeated character|Sort the unmatched suffix|Assume the full match remains|The border identifies a shorter candidate consistent with characters already matched.",
      "For pattern aba, what is its prefix table?|[0,0,1]|[1,2,3]|[0,1,2]|[0,0,0]|The final a matches the one-character prefix; earlier prefixes have no proper nonempty border.",
      "A log scanner must include overlapping matches. After a full match, what state should be reused?|The pattern’s proper border|Always the full pattern length|Always the next text record|Only the previous output index|Border fallback preserves a possible overlapping match without re-reading text.",
      "What is the empty-pattern policy in this fixture?|Reject with ValueError|Return the whole text once|Return a random boundary|Implicitly search for a space|The example explicitly rejects an empty pattern before indexing it.",
      "A search normalizes text before matching but displays original offsets. What extra problem must it solve?|Mapping transformed offsets|Only sorting match indexes|Only counting log records|Only naming the pattern|Normalization can change representation length and disrupt direct original-position indexing."
    ],
    "formal": [
      "What does proper prefix exclude?|The entire current substring|Every one-character prefix|Every matching suffix|The empty prefix only|A proper prefix must be shorter than the full substring.",
      "What matching behavior does KMP implement in this fixture?|Exact character matching|General regular expressions|Locale-aware collation|Approximate edit distance|The algorithm compares the actual code-point characters of text and pattern.",
      "For text ababa and pattern aba, what starts are reported?|[0,2]|[0]|[1,3]|[0,1,2]|The border fallback retains the overlapping occurrence beginning at two.",
      "A log service resets j to zero after each complete marker. Which requirement can break?|Overlapping occurrences|Exact character comparison|The existence of text indexes|Sorted output starts|A valid next occurrence can begin within the already matched suffix.",
      "A developer sets every prefix-table value to its current prefix length. Which definition is violated?|Properness of the border|The text length bound|The output index order|The alphabet’s byte encoding|The whole prefix is not permitted as its own proper border.",
      "A log marker is the literal string a.*b. The product requires an a followed by any characters then b, but the scanner runs exact KMP without a regex layer. On text axxb, which result is justified?|No literal match; regex requirement unmet|A full regex match is guaranteed|KMP treats dot-star as a wildcard|The prefix table converts regex syntax|Exact KMP compares dot and star as literal characters. The requested wildcard language requires a separate regex-capable design or an explicit contract change.",
      "Pattern ababaca has a partial matched prefix abab a of length 5 before the next text character b. Using prefix fallback, which matched length follows after consuming b?|4|6|2|0|The length 5 state expects c, so it falls back to the border length 3. The incoming b then matches pattern[3], producing a length 4 match without re-reading earlier text.",
      "A pipeline normalizes decomposed e plus a combining accent into one NFC code point before search. It finds a marker at transformed index 1 but must report original UTF-8 byte offsets. What additional evidence is necessary?|A transformation-to-source offset map|Only the transformed string length|Only sorting all found indexes|Only the prefix table’s final value|The representation change alters code-point and byte positions. A transformed index alone does not determine the corresponding original byte location.",
      "A KMP search encounters a text character that follows several prefix fallback links before matching. A reviewer says this disproves linear total work. What is the precise correction?|A costly step can coexist with linear aggregate work|Every individual step must follow one link|Fallback always forces quadratic aggregate work|The search becomes constant total time|The bound counts aggregate increases and decreases of matched-prefix length. Multiple fallback links at one position do not by themselves invalidate the total linear argument.",
      "A monitor requires every overlapping literal occurrence of aba in ababa, rejects empty markers and returns positions in the original unnormalized code-point string. Which output/state choice satisfies those requirements?|[0,2] with proper-border fallback|[0] with reset-to-zero after a match|[1,3] after shifting every position|[0,1,2] by treating every prefix as a match|The proper border of aba has length 1, allowing the occurrence beginning at 2. The original-code-point contract avoids an additional normalization-offset mapping requirement here."
    ]
  },
  {
    "slug": "frequency-maps",
    "title": "Count and reconcile events with frequency maps",
    "intro": "A support team wants the number of tickets per category and an inventory team needs to compare expected and observed item multiplicities. A set records presence, while a frequency map preserves how many times each key occurs.",
    "sections": [
      [
        "Make multiplicity part of the state",
        "For each key, increment a stored count, using zero when the key has not appeared. The invariant is that after processing a prefix, the map records exactly the frequency of each observed key in that prefix. Python Counter provides a standard counting interface, but its operations and treatment of missing or zero counts still need to match the chosen business rule.",
        "A set would lose duplicates, so it cannot distinguish an order requesting three identical items from one requesting one item. To reconcile two multisets, compare their per-key counts or compute a clearly defined signed difference. Counter subtraction with the minus operator retains only positive results, while subtract() can retain zero and negative counts; do not substitute one for the other without checking semantics."
      ],
      [
        "Bound state and define key normalization",
        "Building a map from n events typically uses expected linear time under suitable hashing and equality assumptions, with storage proportional to distinct keys k. An unbounded stream of new customer-generated keys can grow without bound even when each update looks cheap. A production system may need a bounded category vocabulary, windowed counts, eviction rules or external aggregation.",
        "The fixture computes counts and preserves signed shortages using explicit subtraction over the union of keys. It verifies deterministic synthetic item IDs, not exactly-once delivery or event deduplication. Counting duplicate deliveries as real tickets is a correctness failure outside the data structure itself; event identity and ingestion semantics must be specified separately."
      ]
    ],
    "problem": "Reconcile required and available item multiplicities without losing deficits.",
    "steps": [
      "Count occurrences on both sides.",
      "Iterate the union of keys with missing counts treated as zero.",
      "Keep signed required-minus-available results so shortages and surpluses remain distinguishable."
    ],
    "code": "from collections import Counter\nneed=Counter([\"A\",\"A\",\"B\"]); have=Counter([\"A\",\"C\"])\ndelta={k:need[k]-have[k] for k in sorted(need.keys()|have.keys())}\nprint(dict(need))\nprint(delta)\nprint(dict(need-have))",
    "expect": "{'A': 2, 'B': 1}\n{'A': 1, 'B': 1, 'C': -1}\n{'A': 1, 'B': 1}",
    "limit": "Actual Counter behavior and signed reconciliation are checked. The fixture does not establish event uniqueness, durable ingestion or stream-window correctness.",
    "mistakes": [
      "Do not replace a multiset with a set when duplicate quantities matter.",
      "Do not assume every Counter difference operation retains negative counts."
    ],
    "takeaways": [
      "Presence and multiplicity answer different questions.",
      "A cheap per-key update does not bound total state in an unbounded key stream."
    ],
    "practice": [
      "What information does a set discard that a frequency map retains?|Multiplicity per key|Whether a key exists|Equality of stored keys|The set’s own size|A set records presence rather than the number of occurrences.",
      "For events A,A,B, what is the count of A?|2|1|3|0|Both occurrences contribute to the same key’s frequency.",
      "What does Counter missing-key lookup return?|0|A new event ID|Always KeyError|A copied input list|Counter supplies zero for absent elements when accessed by key.",
      "A required item appears twice but availability contains it once. What is its required-minus-available count?|1|0|2|-1|The signed difference records a shortage of one item.",
      "What controls frequency-map storage most directly?|Distinct retained keys|Only total emitted rows|Only the largest count|Only the first event time|Each retained distinct key needs a map entry regardless of how high its count becomes.",
      "A retry delivers the same event twice and both are counted. What concern is outside Counter itself?|Event deduplication semantics|Integer addition correctness|Missing-key default behavior|Dictionary key membership|The data structure counts what it receives and does not determine whether deliveries represent one logical event."
    ],
    "formal": [
      "Which structure directly represents item multiplicity?|A frequency map|A presence-only set|A sorted key name|A single Boolean flag|Counts retain how often an item occurs rather than only whether it appeared.",
      "What does Counter subtraction with the minus operator retain?|Positive resulting counts|Every negative result|Only zero results|Only the original keys|The minus operator excludes nonpositive resulting counts.",
      "For required A,A,B and available A,C, which signed count belongs to C?|Minus one|Zero|One|Two|Required contains no C while available contains one, so required minus available is negative one.",
      "A retailer uses a set to validate a cart requesting three units of one SKU. Why can the check approve insufficient stock?|Presence ignores unit counts|It automatically sorts stock|It changes numeric precision|It creates a unique SKU|Presence of the SKU does not prove enough units exist.",
      "A reconciliation report needs both shortages and surpluses. Which representation preserves the signs?|Explicit signed differences|Positive-only Counter minus|A set intersection only|Only matching-key names|Signed per-key differences distinguish deficits from excess availability.",
      "A counter stream receives 1000000 events with 900000 distinct retained keys. Each entry needs 32 modeled bytes, and the count-state cap is 16 MiB. Expected-fast lookup is assumed. What follows?|About 28.8 MB count state exceeds the cap|Expected O(1) lookup proves bounded memory|Only 1 MB is needed for all key entries|Repeated counts make the map constant size|Storage grows with distinct retained keys:900000 times 32=28800000 bytes, above 16777216. Update speed does not establish a total-state limit.",
      "A warehouse needs A 3,B 1 and has A 1,B 2,C 2. The audit must retain every signed required-minus-available discrepancy. Which result is complete?|A 2,B-1,C-2|A 2 only|A 3,B 1,C 0|A-2,B 1,C 2|Subtract availability from requirements over the union of keys. Positive-only Counter subtraction would lose both surplus entries and violate the signed audit contract.",
      "A one-hour counter has five A events, two of which expire while one new A event arrives. No duplicates exist. An implementation only increments for the arrival. What should the new count be and which action is missing?|4; subtract the two expired events|6; no expiration action is needed|3; ignore the new arriving event|7; expired events should be re-added|The current window changes from 5 to 5-2+1=4. Increment correctness alone does not maintain an expiration-based window invariant.",
      "Worker 1 counts event IDs [x,y] as category A, while worker 2 counts [y,z] as A. The global contract counts each logical event once. What is required before interpreting summed counters as a global result?|Resolve overlap; correct count is 3|Just sum counters; correct count is 4|Drop one whole worker; correct count is 2|Count worker IDs; correct count is 2|The event y appears in both partitions. A global identity/ownership rule must remove the overlap rather than assuming locally correct counters are globally disjoint.",
      "An hourly counter case-folds keys, expires records by event time and deduplicates by event ID. A late correction changes an existing event’s category from A to B inside the current window. Which state update preserves logical frequencies?|Remove A contribution then add B once|Add B but retain the prior A count|Discard B because the ID already exists|Expire every event with the same category|Deduplication must distinguish a supported correction from a duplicate delivery. The old contribution must be reversed and the new one applied under the same window and identity rules."
    ]
  },
  {
    "slug": "composite-grouping-keys",
    "title": "Group records with collision-safe semantic keys",
    "intro": "A billing team groups invoices by tenant and currency. Combining fields into a key is a representation decision: careless concatenation can make different tuples look identical and cause one customer’s values to be mixed with another’s.",
    "sections": [
      [
        "Use the actual grouping equivalence",
        "If grouping requires both tenant and currency to match, represent that pair directly, such as a tuple of two immutable values. A string like tenant+currency has no boundary information: AB plus C and A plus BC both produce ABC. A delimiter is only safe when escaping or an unambiguous encoding contract handles delimiters appearing inside fields.",
        "Grouping is not deduplication. All records belonging to a group may still need to be retained or aggregated according to their own event identities. Likewise, sorting characters to form an anagram key intentionally defines an order-insensitive equivalence, which would be wrong for ordered transaction sequences."
      ],
      [
        "Choose aggregation and memory behavior",
        "A map from group key to a list of records stores every grouped record, not only the distinct keys. If the task only needs totals, aggregate as records arrive to retain bounded state per group. The overall state still grows with the number of distinct groups, and a single group can have a very large accumulated numeric value.",
        "The fixture contrasts ambiguous string concatenation with tuple-key aggregation. It uses synthetic immutable strings and integer amounts. A real tenant boundary must also be enforced by authorization and storage policy; a correct composite key does not by itself authorize access or make client-supplied tenant claims trustworthy."
      ]
    ],
    "problem": "Keep different field tuples separate while aggregating repeated records within one tuple.",
    "steps": [
      "Show that naive concatenation can erase field boundaries.",
      "Use a tuple for the exact tenant-currency grouping rule.",
      "Accumulate only the required integer total per distinct tuple."
    ],
    "code": "rows=[(\"AB\",\"C\",2),(\"A\",\"BC\",5),(\"AB\",\"C\",3)]\ntotals={}\nfor tenant,currency,amount in rows:\n    key=(tenant,currency)\n    totals[key]=totals.get(key,0)+amount\nprint(\"AB\"+\"C\"==\"A\"+\"BC\")\nprint(sorted(totals.items()))",
    "expect": "True\n[(('A', 'BC'), 5), (('AB', 'C'), 5)]",
    "limit": "The fixture verifies representation separation and aggregation for supplied tuples. It does not implement tenant authorization or a complete currency accounting policy.",
    "mistakes": [
      "Do not confuse a string-encoding collision with a hash-table collision; the values themselves can become equal before hashing.",
      "Do not retain every record when the business result requires only one aggregate per group."
    ],
    "takeaways": [
      "A grouping key must preserve the intended field boundaries and equivalence.",
      "Storage depends on whether groups retain records or only aggregates."
    ],
    "practice": [
      "Why can concatenating AB+C and A+BC be unsafe as grouping keys?|Both encode as ABC|Both must hash differently|Both become unique tuples|Both reject dictionary insertion|Raw concatenation erases the boundary between fields.",
      "Which Python key directly preserves two immutable fields?|A two-element tuple|A mutable two-item list|An unescaped concatenation|Only the first field|A tuple retains the field positions and is hashable when its elements are hashable.",
      "Does grouping by tenant and currency prove the caller may read that tenant?|No|Yes for every caller|Only when a tuple is used|Only when keys are sorted|Key representation and authorization are distinct responsibilities.",
      "A report only needs one total per group. What can reduce retained record storage?|Incremental per-group sums|A list of every source row|A duplicated sorted row list|A separate copy per query|An aggregate can avoid retaining each individual grouped record.",
      "What equivalence does sorting a word’s characters intentionally preserve?|Anagram equivalence|Exact original character order|Account ownership|The original byte encoding|Sorted character signatures group permutations rather than ordered strings.",
      "A delimiter may occur inside either field. What must a serialized key specify?|Escaping or unambiguous encoding|Only a longer delimiter name|Only alphabetical field order|Only a bigger dictionary|Field boundaries need a representation that cannot be confused with literal field content."
    ],
    "formal": [
      "What is a composite grouping key intended to represent?|Multiple equality dimensions|Only one output label|A random hash bucket|Every source row’s identity|A composite key encodes the fields that jointly define group membership.",
      "What determines whether a tuple is hashable?|Its elements’ hashability|Its display length only|Its variable name only|Its number of references only|Tuple hashability requires its constituent elements to support the necessary immutable hash/equality behavior.",
      "Which pair collides under raw concatenation without boundaries?|AB+C and A+BC|AB+C and AB+D|A+B and B+C|AB+CD and A+BC|Both concatenations in the first pair yield ABC.",
      "A billing key includes tenant but omits currency while totals cannot mix currencies. What is wrong?|The semantic key is incomplete|The hash table has no capacity|The rows must be presorted|The amounts must be unique|The key must include every dimension required by the grouping contract.",
      "A group map stores a list of all records per key. Which space claim is unsupported?|Only O(k) retained record space|A key per distinct group|A list of grouped records|A possible aggregate alternative|Retaining every record requires storage proportional to the number of retained records as well as the keys.",
      "A composite key serializes two arbitrary strings with one unescaped colon separator. Rows (A:B,C) and (A,B:C) are both valid business records. What representation issue occurs?|Both serialize to the same string|Both necessarily get different hashes|Only the first row is hashable|The separator guarantees uniqueness|Without escaping or structural boundaries, both encode as A:B:C. This is equality of the serialized value before hashing, so a stronger hash cannot restore the lost field boundary.",
      "Invoices (tenant T, currency USD, year 2024, amount 10) and (T,USD,2025,20) must be reported separately. An aggregate key includes only tenant and currency. Can hashing that incomplete key differently repair the result?|No; year must enter the semantic key|Yes; a longer digest restores the year|Yes; sorting totals by year afterward fixes it|No; only a larger table capacity is needed|The omitted year has already caused the two records to be combined. Hash routing and presentation cannot recover a grouping dimension that was never represented.",
      "A grouped dataset has 100000 rows and 100 distinct groups. One design retains every row reference in group lists; another keeps one integer sum per group. Excluding source input and map metadata, which state comparison follows?|100000 references vs 100 sums|100 row refs versus 100000 aggregates|Both retain only 100 row references|Both need 100000 full copied records|Grouping lists retain every row, while an aggregate-only contract can keep one value per group. The representation must match what later consumers require.",
      "An anagram grouping uses sorted character tuples. The words aab, aba and ab enter the same batch, and multiplicities must distinguish groups while order is ignored. Which grouping is correct?|aab with aba; ab separate|All three in one group|aab with ab; aba separate|Every word in a distinct group|Sorting preserves repeated character counts, so aab and aba share two a characters and one b; ab has a different multiplicity signature.",
      "A tenant-authorized invoice service groups by (tenant, currency, year). Two USD amounts are integer minor units, while an EUR feed uses a different declared scale. Which addition would require a separate policy rather than just a broader grouping key?|Cross-currency conversion and rounding|Summing same-scale USD integers|Keeping year as one tuple field|Checking the caller’s trusted tenant|Grouping and integer arithmetic do not define exchange rates, scale conversion or rounding. Combining currency domains needs an explicit financial transformation policy."
    ]
  },
  {
    "slug": "hash-equality-collisions",
    "title": "Separate hash collisions, key equality and lookup assumptions",
    "intro": "A hash table uses a hash value to locate candidates, then equality to decide whether a candidate is the requested key. Different keys can share a hash without becoming the same key, provided the implementation resolves collisions correctly.",
    "sections": [
      [
        "Follow the hash and equality contract",
        "Equal keys must have equal hashes for hash-table lookup to behave correctly. The converse does not hold: equal hash values can belong to unequal keys. A collision-resolution mechanism stores or probes candidate entries and checks equality. A custom hash function that returns a constant is valid for correctness when equality is consistent, but it can make lookup expensive.",
        "A key’s hash and equality behavior must remain stable while the key is stored. Mutating fields that participate in those operations can make an existing entry unreachable or create inconsistent behavior. Prefer immutable semantic key values rather than relying on the fact that a custom class happens to permit mutation."
      ],
      [
        "Expected cost is conditional",
        "Expected constant lookup requires assumptions about hash distribution, table load and the cost of hashing and equality. Heavy collisions can require many candidate comparisons, and a long string key can itself be costly to hash or compare. Do not turn an expected bound into a hard maximum for adversarial inputs.",
        "The fixture intentionally gives two unequal keys the same hash and verifies that both entries remain distinct. It demonstrates correctness under a collision, not a performance benchmark. Python also considers some values of different types equal, such as True and 1; a key policy that intends to distinguish them must encode an explicit type tag rather than assuming type alone separates dictionary entries."
      ]
    ],
    "problem": "Verify that equal hashes do not merge unequal keys and inspect cross-type equality.",
    "steps": [
      "Create keys with a constant hash but value-based equality.",
      "Insert two unequal keys and retrieve both through new equal key objects.",
      "Contrast collision handling with values that actually compare equal."
    ],
    "code": "class Key:\n    def __init__(self,value): self.value=value\n    def __hash__(self): return 7\n    def __eq__(self,other): return isinstance(other,Key) and self.value==other.value\nd={Key(\"A\"):10,Key(\"B\"):20}\nprint(len(d),d[Key(\"A\")],d[Key(\"B\")])\ne={True:\"flag\",1:\"count\"}\nprint(len(e),e[True])",
    "expect": "2 10 20\n1 count",
    "limit": "The fixture verifies actual Python dictionary correctness for collisions and equal Boolean/integer keys. It does not prove a worst-case latency bound or a cryptographic property.",
    "mistakes": [
      "Do not assume equal hashes imply equal keys.",
      "Do not mutate a stored key’s hash/equality fields or mistake expected lookup cost for a hard guarantee."
    ],
    "takeaways": [
      "Hash routing and semantic equality serve different roles.",
      "Stable key contracts and workload assumptions are prerequisites for correct performance claims."
    ],
    "practice": [
      "What must hold when two dictionary keys compare equal?|Their hashes agree|Their hashes differ|Their types always match|Their identities always match|Equal keys must satisfy the hash contract even when represented by distinct objects.",
      "Do equal hash values prove key equality?|No|Yes|Only for integer hashes|Only when the table is empty|Different keys can collide and are distinguished by equality checks.",
      "What does the fixture retrieve for its two unequal constant-hash keys?|Two distinct stored values|Only the last inserted value|A guaranteed KeyError|A sorted list of hashes|Collision handling retains unequal keys separately.",
      "A stored custom key changes a field used by __hash__. Which invariant can fail?|Stable lookup behavior|Only output formatting|Only insertion order labels|Only the object’s class name|A key must retain compatible hash and equality behavior while stored.",
      "What does the shown dictionary with True and 1 contain after both assignments?|One key with value count|Two independent typed keys|An empty dictionary|Two values under one list|True and 1 compare equal and have compatible hashes, so the second assignment updates the same entry.",
      "A service promises hard constant lookup time using only an expected hash-table bound. What is missing?|Worst-case workload analysis|Only a larger key name|Only one successful lookup|Only a sorted output list|Expected behavior under distribution assumptions does not bound every permitted input."
    ],
    "formal": [
      "What distinguishes a hash collision from key equality?|Same hash can hold unequal keys|Same hash always proves equality|Different keys cannot collide|Equality is never checked|A hash narrows candidate locations but does not uniquely identify arbitrary keys.",
      "Which key property must remain stable during storage?|Hash/equality-relevant state|Every display label forever|Only the object’s log format|Only the iteration counter|Changing the fields that define hashing or equality can invalidate lookup assumptions.",
      "In the fixture, what is the dictionary length after inserting True and 1?|1|2|0|A nondeterministic number|Those Python values compare equal, so the second insertion updates the existing key’s value.",
      "A custom class returns the same hash for every unequal key but equality is correct. What can still work?|Correct distinct-key storage|Guaranteed constant lookup time|Automatic dedup of all keys|Cryptographic collision resistance|Collision resolution can preserve correctness while performance degrades.",
      "A team uses a cryptographic digest as proof that an API caller owns a key. What boundary is confused?|Representation versus authorization|Insertion versus iteration order|Counting versus sorting output|Object identity versus file size|A digest or hash-table key does not by itself establish permission to access a resource.",
      "A collision-chain table stores 1000 unequal keys with the same hash. A missing-key lookup compares against every stored key, with each equality check costing at most 20 character tests. Which worst-case count follows?|Up to 20000 character tests|Up to 1020 character tests|Up to 1000 character tests|Exactlylog2(1000) character tests|The lookup may compare 1000 candidates, each inspecting up to 20 characters. Collision depth and comparison width multiply under this stated chain model.",
      "A customer object is already a dictionary key when its hash-relevant account number changes. The caller knows only the new account number, and a later removal lookup may fail. Which design prevents the invalid stored-state interval?|Use an immutable account-number key|Only resize the dictionary afterward|Only retry lookup with the new hash|Only rename the object’s display label|An immutable semantic key avoids changing hash/equality while stored. A safe remove-before-mutate strategy must actually remove using the old valid key before the mutation, not try to repair it afterward blindly.",
      "A hash service previously bounded each key at 16 characters. A new contract admits up to 100000 characters and adversarial common prefixes, while table distribution stays good. Which bound needs revisiting?|Hash and equality cost per key|Only the number of returned rows|Only the iteration order of buckets|Only the fixed table-load threshold|Good bucket distribution does not make reading or comparing arbitrarily long keys constant-cost. The per-key representation width is a separate dimension.",
      "A validator stores raw keys True and 1 and then reports one entry. Its contract treats Boolean flags and integer customer IDs as separate domains and both must survive. Which representation satisfies that distinction?|('flag', True) and ('id',1)|True and 1 inserted in reverse order|hash(True) and hash(1) as raw keys|The two raw values with extra capacity|Python considers True and 1 equal as raw keys. Explicit semantic type tags make the intended domains unequal without depending on insertion order or capacity.",
      "A request supplies n=500 unequal constant-hash keys. Equality may inspect m=40 characters per candidate; one missing lookup can traverse every key. The admission budget is 10000 character tests. Which conclusion follows?|The 20000-test model exceeds budget|Expected lookup proves the budget|The 540-test model meets budget|The 40-test model meets budget|The allowed collision chain can require 500 times 40=20000 character tests. An expected constant-lookup statement does not satisfy this adversarial per-request bound."
    ]
  }
] ,["Doc/tutorial/datastructures.rst","Doc/library/collections.rst","Doc/library/unicodedata.rst"]);
