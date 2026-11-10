'use strict';
const {bank}=require('../../learning/wave1/backend-helper');
module.exports=bank('practical-data-structures',[
  [
    "m1.c1",
    [
      [
        "E",
        "A webhook audit must retain repeated delivery events in received order. Which structure fits that local requirement?",
        "List",
        "Set",
        "One boolean",
        "Unique-key mapping only",
        "A list retains positional duplicates.",
        "A set removes duplicates.|A boolean cannot retain events.|A unique key alone overwrites repeated associations."
      ],
      [
        "E",
        "A handler needs fast direct access from account id to account record. Which structure is natural?",
        "Dictionary",
        "Unindexed event list",
        "One counter",
        "A plain filename",
        "A key-to-record mapping supports direct lookup.",
        "A list requires search without an index.|A counter stores counts rather than full records.|A filename is not an in-memory index."
      ],
      [
        "M",
        "Two records share an id inside different organizations. Which index preserves scoped identity?",
        "Organization-id tuple",
        "Id alone",
        "Display name alone",
        "Month alone",
        "The composite key includes the namespace in which the id is unique.",
        "Id alone can collide.|Names can repeat.|Month is not identity."
      ],
      [
        "M",
        "A set is used to produce a report requiring input order. Which assumption needs correction?",
        "Set order contract",
        "Tuple hashability",
        "Dictionary value type",
        "Counter zero default",
        "A set has no positional insertion-order output contract.",
        "Tuple hashability is a separate issue.|Value types do not define set order.|Counter defaults are unrelated."
      ],
      [
        "M",
        "A mapping must retain every version of one entity. Which representation supports that policy?",
        "Key to version list",
        "Key to last value only",
        "One global boolean",
        "A set of entity ids only",
        "A per-key collection can retain all versions.",
        "Last-value mapping loses earlier versions.|A boolean loses records.|Ids alone do not retain version data."
      ],
      [
        "H",
        "A list is offered as a dictionary key and raises TypeError. Which property is missing?",
        "Hashability",
        "Insertion order",
        "String formatting",
        "Network access",
        "Mutable lists are unhashable and cannot be ordinary dict keys.",
        "Order does not make a key hashable.|Formatting is unrelated.|The operation is local."
      ],
      [
        "H",
        "A custom key changes the fields used by hash after insertion. What invariant is endangered?",
        "Stable key lookup",
        "List slicing order",
        "Queue persistence",
        "Counter spelling",
        "Hash/equality behavior must remain consistent while a key is stored.",
        "Slicing is separate.|Dicts are not durable queues.|Spelling does not control key behavior."
      ],
      [
        "H",
        "A mapping comprehension collapses two versions and the API needed both. What should the fix prioritize?",
        "Duplicate policy",
        "Shorter comprehension",
        "More logging only",
        "Random key casing",
        "The representation must preserve the required multiplicity before optimization.",
        "Shortness does not restore versions.|Logs are not the response contract.|Random casing corrupts identity."
      ],
      [
        "H",
        "A tuple key contains a nested list. Why can it still fail hashing?",
        "Unhashable element",
        "Tuple length alone",
        "Integer id alone",
        "Function scope",
        "A tuple is hashable only if all required elements are hashable.",
        "Length is not the issue.|Integers are hashable.|Scope does not change the element contract."
      ],
      [
        "A",
        "A system normalizes all keys to lower case while the domain treats case as meaningful. Which assessment is strongest?",
        "Identity changed",
        "Only faster lookup",
        "Guaranteed safe dedupe",
        "Always equivalent data",
        "Normalization can merge distinct identities and must follow the domain equivalence contract.",
        "Speed does not establish correctness.|Dedupe can discard distinct records.|Equivalence was explicitly denied."
      ]
    ]
  ],
  [
    "m1.c1",
    [
      [
        "E",
        "A worker must process locally queued jobs in arrival order. Which removal policy fits?",
        "FIFO",
        "LIFO",
        "Random eviction",
        "Smallest payload first",
        "First-in-first-out preserves arrival order under this local model.",
        "LIFO reverses it.|Eviction loses work.|Payload size is not arrival order."
      ],
      [
        "E",
        "An incident view retains only the newest ten local events. Which container can express bounded history?",
        "Deque with maxlen",
        "Unbounded counter",
        "One dictionary key",
        "A file handle alone",
        "A bounded deque evicts older history as new entries arrive.",
        "A counter has no such sequence policy.|One key does not encode the history.|A handle alone provides no bounded container."
      ],
      [
        "M",
        "A list queue drains using pop(0) repeatedly. What hidden work occurs?",
        "Reference shifting",
        "Automatic disk flush",
        "Hash table resizing",
        "Priority comparison only",
        "Removing the front of a list shifts remaining references.",
        "No disk operation is inherent.|The container is a list.|FIFO removal does not require priority comparison."
      ],
      [
        "M",
        "A job queue must reject new arrivals when full. Is maxlen deque append equivalent?",
        "No, it evicts",
        "Yes, it blocks",
        "Yes, it raises always",
        "Yes, it persists overflow",
        "Bounded deque append discards from the opposite end rather than implementing reject-on-full delivery.",
        "It does not block that way.|Append does not always raise on fullness.|No persistence appears."
      ],
      [
        "M",
        "A stack is required for reverse-order undo. Which list operations fit?",
        "Append and pop",
        "Append and pop zero",
        "Sort and clear",
        "Count and index",
        "Appending and popping from the end implements LIFO.",
        "Front removal is FIFO-like.|Sorting changes semantic order.|These operations do not implement removal order."
      ],
      [
        "H",
        "A scheduler needs the earliest deadline. Which local structure is appropriate?",
        "Min-heap",
        "Arrival-only stack",
        "Set with arbitrary pop",
        "One last-value key",
        "The smallest due-time priority can be retrieved from a min-heap.",
        "A stack selects newest insertion.|Set pop has no deadline policy.|One key loses other jobs."
      ],
      [
        "H",
        "A heap stores only (priority, dictionary_payload) and priorities tie. What can fail?",
        "Payload comparison",
        "Only id hashing",
        "Only file access",
        "Only list printing",
        "Tuple ordering can reach non-orderable dictionaries when the first fields tie.",
        "Hashing is not this ordering operation.|No file access is inherent.|Printing is separate."
      ],
      [
        "H",
        "A maxlen deque retains the latest events correctly. What claim still needs a separate mechanism?",
        "Crash recovery",
        "Bounded length",
        "Opposite-end eviction",
        "Local event order",
        "An in-memory container does not survive process loss by itself.",
        "These are container properties.|The eviction policy is built in.|Local order is exercised."
      ],
      [
        "H",
        "A heap's smallest item is at index zero. Can all other indexes be treated as sorted?",
        "No",
        "Always",
        "Only with strings",
        "Only with even length",
        "A heap guarantees parent-child order rather than complete sorted order.",
        "Full sorting is not its invariant.|Strings do not change the distinction.|Length parity is unrelated."
      ],
      [
        "A",
        "A service replaces a durable broker with a local deque because FIFO tests pass. What is the key review gap?",
        "Delivery guarantees",
        "Container spelling",
        "Source line count",
        "Import placement",
        "Local order does not replace persistence, acknowledgments, redelivery or multi-worker coordination.",
        "Spelling does not provide durability.|Length is not delivery semantics.|Imports do not establish broker behavior."
      ]
    ]
  ],
  [
    "m1.c2",
    [
      [
        "E",
        "A missing item is searched in a list of length n. How many entries may be compared?",
        "All n entries",
        "Exactly one always",
        "None ever",
        "Only log n always",
        "A missing value can require a complete scan.",
        "There is no guaranteed early match.|The list must be examined.|No binary-search order is assumed."
      ],
      [
        "E",
        "Under ordinary hash assumptions, what is average dictionary key lookup cost?",
        "Constant time",
        "Quadratic time",
        "A full sort",
        "One remote call",
        "Hash-table indexing supports average constant-time lookup under stated key assumptions.",
        "Ordinary lookup is not pair enumeration.|Sorting is unnecessary.|A local dict does not require networking."
      ],
      [
        "M",
        "A set is built from m items and used for n checks. Which expected work model includes preprocessing?",
        "O(m plus n)",
        "O(1) total",
        "O(m times n) always",
        "O(log m) total",
        "Index construction plus expected constant-time checks gives expected additive work.",
        "Input processing is not free.|Repeated scans are no longer required under the assumptions.|Reading m items is not logarithmic total work."
      ],
      [
        "M",
        "One tiny list check beats a set conversion in a timing sample. What is a reasonable interpretation?",
        "Construction matters",
        "Hashing is always slower",
        "Lists have constant worst case",
        "Big O predicts exact time",
        "For a one-off small check, allocation and construction constants can dominate.",
        "One sample does not establish universal speed.|A full list scan still grows with n.|Asymptotic notation does not specify nanoseconds."
      ],
      [
        "M",
        "A key hashes a long byte sequence on demand. What additional input size may matter?",
        "Key length",
        "Variable name length",
        "File count",
        "Route count",
        "Hashing/comparison cost can depend on the key's size and implementation.",
        "Names do not affect key hashing.|Files are unrelated.|Routes do not determine this work."
      ],
      [
        "H",
        "A dictionary is described as guaranteed one-step lookup under every input. What is wrong?",
        "Average-case overclaim",
        "The use of keys",
        "The presence of values",
        "Insertion-order support",
        "Hash-table assumptions and collision/key costs prevent that unconditional guarantee.",
        "Keys are intrinsic to dictionaries.|Values are valid.|Order is a separate documented property."
      ],
      [
        "H",
        "A set deduplicates a whitelist but the output needs only membership booleans. What should be checked?",
        "Equivalent membership",
        "Original duplicate count always",
        "Original item positions always",
        "Identical container type",
        "The optimization should preserve the boolean decision contract for allowed keys.",
        "Counts may be irrelevant to membership.|Positions may be irrelevant.|Different structures can implement the same decision."
      ],
      [
        "H",
        "A custom equality method performs a database call. Which cost model is insufficient?",
        "Entry count alone",
        "Including key behavior",
        "Including side effects",
        "Including external latency",
        "Treating every comparison as bounded local work misses expensive custom behavior.",
        "Those additions improve the model.|Side effects matter.|Remote latency matters."
      ],
      [
        "H",
        "An index is built for one lookup then discarded. Which resource tradeoff needs evaluation?",
        "Build and memory",
        "Only lookup notation",
        "Only package name",
        "Only source indentation",
        "Preprocessing and allocation can dominate a small-use case.",
        "Lookup notation alone omits setup.|Names do not measure cost.|Indentation is not allocation."
      ],
      [
        "A",
        "An attacker can submit keys with expensive equality. What should an operational limit consider?",
        "Total key work",
        "Only record count",
        "Only nominal O(1)",
        "Only field captions",
        "Key length/behavior and input limits matter beyond an average entry-count model.",
        "Count alone can miss expensive keys.|Average notation is not a security budget.|Captions do not bound work."
      ]
    ]
  ],
  [
    "m2.c1",
    [
      [
        "E",
        "A handler makes two separate passes over n records with bounded bodies. What is the time order?",
        "O(n)",
        "O(n squared)",
        "O(1)",
        "O(log n)",
        "The two linear costs add to a constant multiple of n.",
        "The loops are not nested.|Records are visited.|No repeated halving occurs."
      ],
      [
        "E",
        "A loop visits n users and all m plans for each user. What is the rectangular work order?",
        "O(n times m)",
        "O(n plus m)",
        "O(1)",
        "O(log n)",
        "Each of n user iterations performs a complete scan of the m independent plans.",
        "Addition fits consecutive passes.|Both dimensions grow.|The loops do not halve input."
      ],
      [
        "M",
        "A request checks five fixed flags on every record. What grows with n records?",
        "Linear work",
        "Quadratic work",
        "Factorial work",
        "No work",
        "The fixed factor five does not change linear growth.",
        "The inner count is not n.|No permutation enumeration occurs.|Every record is checked."
      ],
      [
        "M",
        "A search succeeds at the first position but can also miss entirely. Which statement is sound?",
        "Cases differ",
        "Every case constant",
        "Every case identical",
        "Worst case disappears",
        "Best-case early exit and worst-case full scan can differ.",
        "Missing items can scan all entries.|The input position changes work.|Early success does not remove worst-case inputs."
      ],
      [
        "M",
        "A loop's inner length is i for outer indices zero to n minus one. How does total work grow?",
        "Quadratically",
        "Linearly always",
        "Constantly",
        "Only logarithmically",
        "The triangular sum is n*(n-1)/2.",
        "The inner count grows with i.|The sum grows with input.|No logarithmic process occurs."
      ],
      [
        "H",
        "Each student has a disjoint list of assignments totaling a entries. What is full traversal work with n students?",
        "O(n plus a)",
        "Always O(n times a)",
        "O(1)",
        "O(a squared)",
        "Each student and each assignment entry is visited once.",
        "The total a is not rescanned for every student.|Input is visited.|Assignments are not all compared pairwise."
      ],
      [
        "H",
        "A fixed-size validation loop becomes a user-supplied rule list of length r. Which dimension must the model add?",
        "Rule count r",
        "Only function name",
        "Only module count",
        "Only JSON whitespace",
        "The formerly constant inner work now depends on input size r.",
        "Names do not bound rules.|Modules are unrelated.|Formatting does not measure visits."
      ],
      [
        "H",
        "A loop count is n but its body downloads a file of variable size. What is missing from O(n) alone?",
        "Body cost",
        "The letter n",
        "The loop keyword",
        "The input variable name",
        "Each iteration can perform input-dependent transfer/processing work.",
        "The symbol itself is fine.|Syntax does not specify cost.|Names do not include file size."
      ],
      [
        "H",
        "A code review labels every double-indented loop quadratic. What should replace that heuristic?",
        "Count actual visits",
        "Count indentation spaces",
        "Count semicolons",
        "Count comments",
        "Bounds, partition structure and per-iteration work determine total cost.",
        "Whitespace count is not execution count.|Punctuation does not determine work.|Comments do not execute."
      ],
      [
        "A",
        "A handler loops through n groups but every record belongs to exactly one group. What evidence distinguishes linear from product work?",
        "Total visits",
        "Only nested syntax",
        "Only group names",
        "Only source length",
        "Summing actual disjoint memberships can reveal O(n+records) traversal instead of a full cross-product.",
        "Nesting alone is insufficient.|Names do not count work.|Text size does not specify runtime visits."
      ]
    ]
  ],
  [
    "m2.c1",
    [
      [
        "E",
        "A one-line helper sorts all input records. Can the line be treated as one constant operation?",
        "No",
        "Always",
        "Only in Python",
        "Only in a comprehension",
        "A source line can contain input-dependent sorting work.",
        "Syntax length is not execution cost.|Python helpers still perform work.|Comprehensions do not make sorting free."
      ],
      [
        "E",
        "A slice values[:k] creates a new list. What storage grows with k?",
        "Copied references",
        "Only variable spelling",
        "Network sockets",
        "Database transactions",
        "The new list holds references for the selected entries.",
        "Names are not retained entries.|No socket operation is inherent.|Transactions are unrelated."
      ],
      [
        "M",
        "Every prefix of an n-item list is retained. What is the total reference-count order?",
        "O(n squared)",
        "O(n) always",
        "O(1)",
        "O(log n)",
        "The total selected lengths sum to n*(n+1)/2.",
        "Retaining every growing prefix adds more than one pass.|Output grows with n.|The sum is not logarithmic."
      ],
      [
        "M",
        "A generator is immediately converted to a list of all results. What memory claim becomes unsafe?",
        "Constant output memory",
        "Results are materialized",
        "A list was allocated",
        "Items are retained",
        "Materialization stores all generated output.",
        "Those are actual consequences.|Allocation is expected.|Retention is expected."
      ],
      [
        "M",
        "An API returns every ordered pair of n records. What lower bound comes from output count?",
        "Quadratic output",
        "Linear output always",
        "Constant output",
        "Logarithmic output",
        "The response contains n*n ordered pairs under the stated contract.",
        "All pairs exceed linear count as n grows.|Output is not fixed size.|The count is not logarithmic."
      ],
      [
        "M",
        "A helper sorts an n-item array on each of n iterations. What work must be included?",
        "Repeated sorting",
        "Only outer visits",
        "Only helper spelling",
        "Only argument count",
        "The sort cost repeats, so one loop count alone understates the operation.",
        "Outer visits omit body work.|Names do not specify cost.|Argument count does not specify sorting cost."
      ],
      [
        "H",
        "A precomputed map reduces scans but doubles retained data. What should acceptance evaluate?",
        "Memory and time",
        "Only time notation",
        "Only source length",
        "Only file names",
        "Optimization trades resources and must fit workload memory limits.",
        "Time alone misses retained state.|Text size is not heap usage.|Names do not measure resources."
      ],
      [
        "H",
        "A comparison function parses a large document each time a sort compares keys. What should be considered?",
        "Comparison cost",
        "Only n log n label",
        "Only return type",
        "Only function caption",
        "Comparison work can dominate and may be reduced with an appropriate precomputed key under correct semantics.",
        "The label assumes a comparison cost model.|Return type alone does not include parsing.|Captions do not execute."
      ],
      [
        "H",
        "A streaming endpoint emits all pairs without storing them. Which cost may fall while total output stays quadratic?",
        "Peak retained memory",
        "Total pair count",
        "Required output bytes always",
        "Number of emitted pairs",
        "Streaming can avoid retaining the full result while still producing all entries.",
        "The contract still contains all pairs.|Encoding aside, output count remains large.|Emission count is fixed by the contract."
      ],
      [
        "A",
        "A team promises linear time for materializing every pair by using a generator expression. What is the strongest review finding?",
        "Output bound conflicts",
        "Generator syntax proves it",
        "Names make it linear",
        "Lazy syntax removes pairs",
        "Materializing quadratic output cannot become linear merely through generator syntax.",
        "Syntax does not remove required output.|Names do not affect entry count.|Required pairs remain."
      ]
    ]
  ],
  [
    "m2.c2",
    [
      [
        "E",
        "A request checks n ids against an m-item list each time. Which repeated work is present?",
        "Membership scans",
        "Heap rebalancing",
        "Network publication",
        "Secret rotation",
        "List membership can rescan allowed entries for every requested id.",
        "No heap is required.|Networking is separate.|Rotation is unrelated."
      ],
      [
        "E",
        "A set membership index serves a whole fixed batch. Where should construction happen?",
        "Once before checks",
        "For every id",
        "Only after output",
        "Only while logging",
        "One preprocessing step supports the batch under a stable-input contract.",
        "Repeated construction wastes work.|The index must exist before use.|Logging is not the processing boundary."
      ],
      [
        "M",
        "The required output retains duplicate requested ids in their original order. Which loop source is suitable?",
        "Original request list",
        "Set intersection output",
        "Sorted set always",
        "Only unique keys",
        "Filtering the original sequence can preserve both order and multiplicity.",
        "Intersection loses duplicates.|Sorting and deduplication change the contract.|Unique keys omit repeats."
      ],
      [
        "M",
        "A membership optimization returns [1,3] instead of [3,1,3]. What changed?",
        "Result semantics",
        "Only process address",
        "Only helper caption",
        "Only source layout",
        "The output lost ordering and a repeated item.",
        "Addresses are not the result contract.|Captions do not explain data change.|Layout is unrelated."
      ],
      [
        "M",
        "A cached allowed-id set ignores user permissions updated during its lifetime. What must be defined?",
        "Freshness policy",
        "Only key color",
        "Only log wording",
        "Only variable length",
        "Derived authorization data needs controlled lifetime/invalidation and correct actor/scope.",
        "Colors do not update permissions.|Wording does not synchronize data.|Length does not control validity."
      ],
      [
        "M",
        "An index stores ids without tenant scope while ids repeat per tenant. What risk exists?",
        "Cross-scope decision",
        "Only cache miss rate",
        "Only formatting issue",
        "Only slower import",
        "An allowed id in one tenant can be applied incorrectly in another.",
        "The problem can cause false acceptance.|It is semantic rather than formatting.|Imports are unrelated."
      ],
      [
        "H",
        "The optimized and original functions are compared only on distinct present ids. Which additional case is valuable?",
        "Missing and repeated ids",
        "Only longer variable names",
        "Only a new comment",
        "Only filename changes",
        "These cases test filtering and duplicate preservation omitted by the first fixture.",
        "Names do not add behavior coverage.|Comments do not execute cases.|Filenames do not change inputs."
      ],
      [
        "H",
        "A set is built once but the source list mutates before processing ends. What evidence is needed?",
        "Snapshot or update contract",
        "Only set type name",
        "Only equality on old input",
        "Only first result",
        "Derived membership can be stale without a stable snapshot or maintained index policy.",
        "Type alone does not establish freshness.|Old equivalence omits mutation.|One result cannot establish ongoing correctness."
      ],
      [
        "H",
        "The indexed algorithm is expected linear but keys use pathological hashes. What should the claim state?",
        "Hash assumptions",
        "Guaranteed latency",
        "No memory cost",
        "No equality calls",
        "Expected hash-table bounds depend on key behavior and collision assumptions.",
        "Average asymptotics are not deadlines.|The index uses memory.|Equality can be needed."
      ],
      [
        "A",
        "An index speeds a benchmark but removes a required access filter. Should it be accepted?",
        "No, restore semantics",
        "Yes, speed is enough",
        "Yes, hide the filter",
        "Yes, shorten the output",
        "Performance evidence cannot justify changing required authorization/result behavior.",
        "Correctness remains required.|Hiding changes does not restore access control.|Shorter output does not establish permissions."
      ]
    ]
  ],
  [
    "m3.c1",
    [
      [
        "E",
        "A report needs the number of events per status. Which tool directly supports that aggregation?",
        "Counter",
        "Only deque",
        "Only heapq",
        "One file path",
        "Counter maps hashable categories to frequencies.",
        "Deque is a sequence.|A heap orders entries.|A path does not count events."
      ],
      [
        "E",
        "A group should collect multiple record ids under each course key. Which value shape fits?",
        "List per course",
        "Single boolean",
        "One global integer",
        "One last id only",
        "A per-key list can retain all matching ids.",
        "A boolean loses members.|One integer is not the member list.|Last-only loses earlier ids."
      ],
      [
        "M",
        "A dict comprehension receives the same id three times. Which duplicate behavior occurs ordinarily?",
        "Last value wins",
        "Automatic rejection",
        "All values grouped",
        "First value always",
        "Later assignment overwrites the same key's association.",
        "Rejection needs explicit validation.|Grouping needs a list/collection policy.|First-wins requires a different algorithm."
      ],
      [
        "M",
        "A developer uses dict.fromkeys(keys, []) for groups. What aliasing risk appears?",
        "Shared mutable list",
        "Independent list per key",
        "Automatic deep copy",
        "Immutable values",
        "The same supplied list object can be associated with every key.",
        "A factory would be needed for separate lists.|No deep copy is implied.|The list is mutable."
      ],
      [
        "M",
        "A Counter is read at an absent key. What does its documented default provide?",
        "Zero count",
        "A required KeyError",
        "A new network request",
        "A negative count always",
        "Counter returns zero for missing categories.",
        "This differs from ordinary dict indexing.|It is a local mapping operation.|A missing category is not inherently negative."
      ],
      [
        "M",
        "Grouped records are mutated after report construction. Why can the report change too?",
        "Reference aliases",
        "Only output sorting",
        "Only import order",
        "Only name length",
        "The group may hold references to the same mutable records.",
        "Sorting does not create copies.|Imports do not break aliases.|Names do not control object identity."
      ],
      [
        "H",
        "An index must reject duplicate business ids. What should insertion include?",
        "Explicit duplicate check",
        "Only last-write assignment",
        "Only pretty printing",
        "Only list sorting",
        "The contract needs a deliberate validation path before overwriting.",
        "That silently implements a different policy.|Formatting does not reject ids.|Sorting alone does not validate uniqueness."
      ],
      [
        "H",
        "A report requires alphabetical group keys. Does insertion order alone establish that?",
        "No",
        "Always",
        "Only for integers",
        "Only for three groups",
        "First-seen insertion order is different from explicit alphabetical sorting.",
        "The input may arrive in any order.|Key type does not equate insertion and sorted order.|Group count does not establish ordering."
      ],
      [
        "H",
        "A tenant report groups solely by course code and codes repeat across tenants. What key should be considered?",
        "Scoped composite",
        "Only shorter code",
        "Only lowercase code",
        "Only a timestamp",
        "A key containing tenant and course can preserve distinct group identities.",
        "Shortening can create more collisions.|Case normalization does not add tenant identity.|Time is not the specified scope."
      ],
      [
        "A",
        "A report needs an immutable historical view while source records remain mutable. What must its design address?",
        "Snapshot semantics",
        "Only dict syntax",
        "Only function length",
        "Only log severity",
        "Copying/versioning strategy must fit the needed isolation from later mutation and its memory cost.",
        "Syntax alone does not produce a deep snapshot.|Length is unrelated.|Severity does not control aliases."
      ]
    ]
  ],
  [
    "m3.c2",
    [
      [
        "E",
        "A min-heap stores due times 9, 1 and 4. Which due time is removed first?",
        "1",
        "9",
        "4",
        "Insertion count",
        "The minimum priority is removed first.",
        "That is the largest here.|It is not the smallest.|Count is not an entry priority."
      ],
      [
        "E",
        "A local FIFO worker appends jobs on the right. Which removal operation fits?",
        "Deque popleft",
        "List sort",
        "Heapify",
        "Set clear",
        "Removing from the left preserves right-end arrival order.",
        "Sorting changes arrival order.|Heapify selects priority semantics.|clear removes all entries."
      ],
      [
        "M",
        "Equal due times are followed by unique integer sequence values before dictionary payloads. What benefit follows?",
        "Stable tie order",
        "Automatic persistence",
        "Guaranteed fairness forever",
        "No memory use",
        "Comparable sequence values resolve ties before dictionary comparison and can retain arrival order.",
        "Persistence is separate.|Strict priority may still starve jobs.|Entries still use memory."
      ],
      [
        "M",
        "A queued priority is changed directly in the heap list. What should the algorithm do?",
        "Restore heap invariant",
        "Assume order survives",
        "Only rename the job",
        "Only add a comment",
        "Changing ordering data can invalidate the heap unless it is repaired or replaced appropriately.",
        "Order is not automatically restored.|Names do not rebalance.|Comments do not modify structure."
      ],
      [
        "M",
        "What is the usual work order for heapify over n entries?",
        "O(n)",
        "O(n squared)",
        "O(n factorial)",
        "O(1)",
        "Building a heap bottom-up is linear under ordinary comparison cost.",
        "No all-pairs comparison is needed.|No permutation enumeration occurs.|The entries must be processed."
      ],
      [
        "M",
        "A stream of urgent jobs delays normal jobs indefinitely. Which scheduling property is missing?",
        "Fairness policy",
        "Heap minimum access",
        "Tuple comparison",
        "Local storage",
        "Priority access alone does not prevent starvation.",
        "Minimum access may work correctly.|Comparison may work correctly.|The data is already stored locally."
      ],
      [
        "H",
        "Lazy cancellation leaves stale heap entries behind. What should resource planning include?",
        "Compaction policy",
        "Only payload names",
        "Only log severity",
        "Only endpoint casing",
        "Stale entries can accumulate and need bounded cleanup/compaction.",
        "Names do not reclaim entries.|Severity does not reduce retained objects.|Casing is unrelated."
      ],
      [
        "H",
        "A job is popped locally then the process crashes before its remote effect is recorded. What is not established by heap order?",
        "Delivery correctness",
        "Which priority was popped",
        "The tuple sequence",
        "The initial heap size",
        "Durability, acknowledgments and retry effects need a delivery protocol beyond a local heap.",
        "Those are local facts.|Sequence is explicit.|Initial size is known."
      ],
      [
        "H",
        "A business id must support arbitrary cancellation efficiently. What should the author avoid assuming about heapq alone?",
        "Direct id deletion",
        "Smallest-item access",
        "Comparable priority use",
        "Heap push availability",
        "heapq is not an automatic indexed arbitrary-removal structure; an additional design is needed.",
        "Minimum access is its purpose.|Comparable keys are appropriate.|Push is available."
      ],
      [
        "A",
        "A scheduler needs both priority and bounded wait for normal work. What should be evaluated beyond a min-heap?",
        "Scheduling policy",
        "Only heap syntax",
        "Only entry spelling",
        "Only print order",
        "Aging, quotas or another explicit fairness design may be needed; the container alone does not define the product policy.",
        "Syntax does not establish fairness.|Spelling is unrelated.|Printed order of one fixture is insufficient."
      ]
    ]
  ],
  [
    "m3.c3",
    [
      [
        "E",
        "A batching function accepts size zero under a positive-size contract. What should it do?",
        "Reject the input",
        "Loop forever",
        "Claim all work finished",
        "Drop every item silently",
        "Invalid size should fail clearly rather than create a non-progressing or misleading process.",
        "Infinite loops violate progress.|No work was established.|Dropping data violates coverage."
      ],
      [
        "E",
        "A fixed iterator contains eight items and batch size is three. How many items should the final batch contain?",
        "2",
        "0",
        "3",
        "8",
        "Two full batches consume six items and leave two.",
        "Remainders should not be dropped.|Only two remain.|Eight is the total input."
      ],
      [
        "M",
        "A producer yields small batches but the consumer stores every result. What remains unbounded as input grows?",
        "Retained output",
        "Batch size itself",
        "Iterator name",
        "The fixed size literal",
        "Producer batching does not prevent the consumer from accumulating all output.",
        "The selected bound remains fixed.|Names do not consume growing data.|A literal does not grow."
      ],
      [
        "M",
        "Which operation can consume the next k entries of an iterator without slicing a source list?",
        "islice",
        "heapify",
        "Counter total",
        "dict clear",
        "islice supports bounded iterator consumption.",
        "heapify builds ordering.|Counter aggregation is different.|clear deletes mapping entries."
      ],
      [
        "M",
        "An offset page is resumed after earlier elements are removed. What can happen?",
        "Items skipped",
        "Stable snapshot guaranteed",
        "All ids become unique",
        "Data becomes immutable",
        "Index positions can shift relative to the stored offset.",
        "Snapshot semantics are separate.|Pagination does not enforce identity.|The collection was mutable."
      ],
      [
        "M",
        "A keyset cursor uses only a nonunique timestamp. What should be added for stable total order?",
        "Tie-breaker id",
        "Random sleep",
        "Longer parameter name",
        "Private token text",
        "Equal timestamps need an additional deterministic ordering key.",
        "Delay does not define order.|Names do not break ties.|Secret content is unrelated."
      ],
      [
        "H",
        "A batch checkpoint is stored before effects complete, then the process crashes. What recovery risk appears?",
        "Skipped unfinished work",
        "Guaranteed exactly-once",
        "Automatic effect rollback",
        "Perfect coverage",
        "The saved progress can advance beyond uncompleted effects under this ordering.",
        "The ordering does not provide that guarantee.|External effects do not automatically roll back.|Coverage can be lost."
      ],
      [
        "H",
        "Effects complete before the checkpoint, then a crash causes retry. What must the operation address?",
        "Repeated effects",
        "Only batch spelling",
        "Only iterator type",
        "Only log color",
        "The batch may be repeated, so idempotency/deduplication or another explicit contract is needed.",
        "Spelling does not coordinate recovery.|Type alone does not prevent duplicates.|Colors are unrelated."
      ],
      [
        "H",
        "A cursor correctly continues order but omits the original tenant filter. What failed?",
        "Scope preservation",
        "Only key length",
        "Only batch caption",
        "Only source layout",
        "Every page must reapply the access/filter contract, not just order continuation.",
        "Length does not enforce scope.|Captions do not filter records.|Layout is unrelated."
      ],
      [
        "A",
        "A stream limits each batch to k inputs but one input can expand into a million retained outputs. What is the strongest memory assessment?",
        "Input bound insufficient",
        "Total memory bounded by k",
        "No output allocation",
        "Automatic spill to disk",
        "The output expansion and consumer retention must also be bounded for a memory claim.",
        "Input count alone omits expansion size.|Outputs use memory.|No spill mechanism is inherent."
      ]
    ]
  ]
]);
