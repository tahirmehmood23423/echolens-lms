'use strict';
const {course}=require('./wave4-dsa-helper');
module.exports=course("recursion-backtracking",[
  {
    "slug": "base-contract",
    "title": "Prove termination with a decreasing measure",
    "intro": "A batch-processing routine recursively reduces a remaining count. The small-input case is a complete result, not merely a way to silence recursion. A correct contract describes valid inputs, the value returned at the boundary, and why every permitted recursive call approaches that boundary.",
    "sections": [
      [
        "Base cases and induction",
        "For factorial on nonnegative integers, factorial(0)=1 and factorial(n)=n*factorial(n-1) for n>0. The base value is the multiplicative identity: it makes factorial(1)=1 correct. Validate negative input separately, because repeatedly subtracting one from a negative integer moves away from zero. A measure that decreases over the nonnegative integers proves termination.",
        "For correctness, assume the smaller call returns the product from one through n-1. Multiplying by n gives the required product through n. This inductive argument separates correctness from termination. A function can terminate with the wrong answer, or return the right answers for small inputs while failing to terminate on a permitted boundary."
      ],
      [
        "Costs and operational limits",
        "The recurrence performs n recursive reductions and n multiplications, but an O(n) unit-cost operation count assumes multiplication has bounded cost. Factorial integers grow, so precise bit complexity must include operand size. There are n+1 live calls at the deepest point, giving O(n) call-stack frames in an ordinary Python implementation.",
        "A business service computing a small combinatorial count can use recursion for clarity, but must bound user-controlled depth or use iteration. Python raises RecursionError at a runtime-dependent depth; increasing the limit is not a proof of sufficient memory or safe execution. The local fixture deliberately uses tiny inputs and tests the invalid-input contract."
      ]
    ],
    "problem": "Compute factorial with an explicit zero base and reject a negative count.",
    "steps": [
      "Define the state, termination measure and result contract for the synthetic input.",
      "Trace each recursive choice or explicit continuation and check its invariant.",
      "Verify the result, then count calls, live state and output storage separately."
    ],
    "code": "def fact(n):\n    if n<0: raise ValueError(\"nonnegative required\")\n    if n==0: return 1\n    return n*fact(n-1)\nprint([fact(n) for n in range(6)])\ntry: fact(-1)\nexcept ValueError: print(\"rejected\")",
    "expect": "[1, 1, 2, 6, 24, 120]\nrejected",
    "limit": "Only nonnegative integer inputs are covered. The count is linear in recursive reductions, not a claim of linear bit complexity for unbounded integer multiplication.",
    "mistakes": [
      "Using zero as factorial(0) makes every positive result zero.",
      "A negative count needs validation rather than an endless descent away from zero."
    ],
    "takeaways": [
      "A base case supplies a mathematically correct result.",
      "Prove progress over a well-founded measure and distinguish frame count from arithmetic bit cost."
    ],
    "practice": [
      "What is factorial(0) in the stated recurrence?|1|0|-1|Undefined for all implementations|The empty product is one, preserving the multiplicative recurrence.",
      "Which measure proves factorial recursion terminates for nonnegative n?|Remaining n decreases|The return value always decreases|The source line number increases|The call stack shrinks before each call|Each recursive call uses a smaller nonnegative argument.",
      "Why reject n=-2 before recursive descent?|It moves away from zero|Negative integers cannot be stored|All negative input means zero factorial|Python rounds it to zero|The stated domain and termination measure exclude negatives.",
      "For fact(4), what value is returned after fact(3) returns six?|24|6|4|10|The current frame multiplies its own four by the smaller result.",
      "How many live fact calls exist at the deepest point for n=3 including fact(0)?|4|3|1|8|The frames correspond to arguments three, two, one and zero.",
      "Why is counting n multiplications not a full bit-cost analysis?|The operands grow with n|Multiplication never costs time|All Python integers have fixed width|The base case allocates no object|Unbounded integer multiplication depends on operand size."
    ],
    "formal": [
      "What does a recursive base case provide?|A direct boundary result|A guarantee of constant total time|A new thread for each input|A sorted call stack|A base case directly answers a boundary subproblem.",
      "Which input is outside the demonstrated factorial contract?|-3|0|1|5|Only nonnegative integers are accepted.",
      "Under a unit-cost multiplication model, what is factorial’s recursive call count order?|Theta(n)|Theta(log n)|Theta(n squared)|Theta(2 to n)|There is one recursive descent for each decrement.",
      "A capacity service defines fact(0)=0. What happens to fact(4) using n*fact(n-1)?|It returns zero|It returns 24|It raises only on positive input|It returns four|Every multiplication chain eventually includes the incorrect zero base.",
      "A counting API accepts arbitrary negative integers and only stops at n==0 while subtracting one. What is the defect?|The smaller result is correct|Every negative count instantly returns one|It has too many base cases|Its multiplication order is unstable|Negative arguments descend farther below zero and never reach the boundary.",
      "A service wants to prove fact correct by induction. Which assumption is appropriate at n>0?|fact(n-1) returns the correct smaller product|fact(n+1) already ran successfully|The operating system eliminates all calls|Every multiplication is one CPU cycle|The inductive step uses correctness of the smaller subproblem.",
      "A request supplies n far beyond the interpreter call-depth limit. What resource grows even if each frame does little arithmetic?|Call-stack depth proportional to n|Only a constant number of frames|A heap of sorted priorities|An adjacency matrix|Each n-1 call suspends its caller until return.",
      "A developer raises Python’s recursion limit and claims the routine now accepts unbounded input. What is missing?|A bound on available stack and memory resources|A different factorial identity|A proof that negative values are positive|A stable sorting key|A configuration limit change does not create unlimited resources.",
      "A reviewer states factorial runs in O(n) time for arbitrarily large integers without qualification. Which correction is precise?|Theta(n) multiplications with growing bit cost|A constant number of fixed-size integer operations|The result has exactly n bits|Its call count is Theta(log n)|Operation count and bit complexity use different cost models.",
      "A service must compute factorial for large allowed n without recursive-depth failure and must account for exact arithmetic growth. Which design fits?|Iteration plus size-aware resource limits|Tail recursion with an unconditional constant-stack claim|An unbounded recursion-limit increase|Float multiplication with guaranteed exact integer results|Iteration removes recursive frames, while domain limits and arithmetic analysis address remaining resources."
    ]
  },
  {
    "slug": "trace-branching",
    "title": "Trace branching calls and distinguish depth from work",
    "intro": "A forecast prototype recursively expands two candidate continuations for every remaining planning day. A short maximum call depth can hide an enormous total call count. Draw the call tree and count repeated subproblems before choosing a production design.",
    "sections": [
      [
        "Recursion tree arithmetic",
        "Consider a full binary call tree that returns at depth d and otherwise calls two children at d-1. Level j contains 2^j calls, so the total is 1+2+...+2^d=2^(d+1)-1. There are 2^d leaves. Maximum simultaneous recursive frames are only d+1 because depth-first evaluation completes one child before the next.",
        "For Fibonacci, the branches have sizes n-1 and n-2, so its call tree is not exactly a full depth-n binary tree. It still repeats subproblems extensively and has exponential growth without caching. State the actual recurrence rather than assigning the same exact count to every two-call function."
      ],
      [
        "Choose the right metric",
        "A workflow with depth twenty may appear safe for the interpreter while requiring more than a million full-binary-tree calls. Conversely, a single chain can have linear total work but unsafe call depth. Assess total calls, peak frames, retained outputs and expensive business operations independently.",
        "Recursion models control flow, not parallel execution. Ordinary Python calls run sequentially unless the program introduces concurrency. If each leaf triggers an expensive external action, a theoretical tree can create unacceptable side effects; the fixture only increments local counters and produces no network activity. Bound branching and depth before deploying a planner."
      ]
    ],
    "problem": "Count calls and leaves in a full two-child recursion tree.",
    "steps": [
      "Define the state, termination measure and result contract for the synthetic input.",
      "Trace each recursive choice or explicit continuation and check its invariant.",
      "Verify the result, then count calls, live state and output storage separately."
    ],
    "code": "def expand(d):\n    if d==0: return (1,1)\n    ca,la=expand(d-1); cb,lb=expand(d-1)\n    return (1+ca+cb,la+lb)\nfor depth in range(4):\n    print(depth, expand(depth))",
    "expect": "0 (1, 1)\n1 (3, 2)\n2 (7, 4)\n3 (15, 8)",
    "limit": "The fixture is a full equal-depth binary call tree, not Fibonacci and not parallel processing. Output counts agree with the geometric-series derivation.",
    "mistakes": [
      "Multiplying maximum depth by two does not count every branch.",
      "A logarithmic input reduction can still combine with branching to produce linear or greater total work."
    ],
    "takeaways": [
      "Count total tree nodes separately from the longest active path.",
      "Write the actual recurrence before using a known complexity result."
    ],
    "practice": [
      "At full binary recursion depth two, how many leaves exist?|4|2|3|7|Each of two levels doubles the number of leaf paths.",
      "How many active frames can a depth-d sequential binary recursion hold?|d+1|2 to d at every instant|Exactly one|d squared always|Only the current root-to-leaf path is simultaneously active.",
      "Does making two normal Python recursive calls execute them in parallel?|No|Yes, always on two CPU cores|Only at even depths|Only for integer arguments|Ordinary function calls run sequentially without explicit concurrency.",
      "A full binary expansion has depth four. How many total calls occur?|31|16|8|4|The geometric sum is 2 to the fifth minus one.",
      "Why can a shallow decision planner still be slow?|Exponential branch count|Depth always equals total work|The stack must be quadratic|Every leaf is constant time by definition|Many separate paths can share a small maximum depth.",
      "What differs between Fibonacci recursion and a full equal-depth binary tree?|Fibonacci child arguments decrease by different amounts|Fibonacci has no base cases|Both have exactly identical call counts for every n|Fibonacci always uses one branch|Its two children solve n-1 and n-2, yielding a different recurrence."
    ],
    "formal": [
      "What does the recursion tree’s height measure?|Maximum nested call depth|Total number of calls|Total output bytes always|Number of CPU cores|Height is the longest root-to-leaf path in call levels.",
      "How many children does each nonleaf have in the demonstrated expansion?|Two|One|Zero|A number equal to input length|The function explicitly invokes two smaller calls.",
      "What is the total-call formula for full binary depth d including depth zero?|2^(d+1)-1|d+1|2d|d squared|Summing powers of two from level zero through d gives this count.",
      "A forecast planner explores two choices for each of 10 remaining days. How many leaves does its full tree have?|1024|20|100|2047|Each of ten binary decisions doubles the number of complete paths.",
      "A profiler reports maximum depth 15 and roughly 65000 calls. Is that possible for a full binary recursive search?|Yes, depth 15 has 65535 calls|No, at most 30 calls exist|No, depth and call count are equal|Only if calls execute in parallel|The total tree size grows exponentially while the active path grows linearly.",
      "An engineer applies the exact full-tree formula to fib(n)=fib(n-1)+fib(n-2). What should be corrected?|Use the unequal-child recurrence for exact counts|Replace both calls with n/2 in the explanation|Claim all two-call recurrences are quadratic|Ignore repeated subproblems|The branch sizes and stopping conditions determine exact call counts.",
      "A routine recurses once on n-1 with constant local work. Which pair fits total time and live frames?|Theta(n) time and Theta(n) frames|Theta(2 to n) time and O(1) frames|Theta(log n) time and Theta(n squared) frames|O(1) time and Theta(n) frames|A single chain has n reductions and n suspended calls.",
      "A routine halves n into two disjoint halves until singletons and performs constant work per call. What total call order follows for n a power of two?|Theta(n)|Theta(log n)|Theta(n squared)|Theta(2 to n)|The tree has n leaves and 2n-1 total nodes.",
      "A branch planner triggers a purchase at every leaf and is tested with depth 25. Which risk requires a design change before real execution?|About 33 million leaf actions could be requested|Only 25 leaf actions are possible|No action runs until every call finishes|Python automatically deduplicates equal purchases|Branch count controls potential side effects independently of stack depth.",
      "A full binary depth-d search returns one constant-size result per leaf and materializes all results. Which bounds distinguish its resources?|Exponential calls/output; linear active depth|O(d) calls and O(1) output|Theta(d squared) output and O(1) frames|O(log d) work and Theta(2 to d) frames necessarily|The full tree has exponentially many leaves, but sequential depth-first traversal retains one active path before output storage."
    ]
  },
  {
    "slug": "recursive-structure",
    "title": "Summarize nested records with a structural invariant",
    "intro": "A reporting service receives nested lists of numeric subtotals. The input is a finite tree: a leaf is a number, and an internal node is a list of child records. A recursive function follows this structure and combines children without repeatedly slicing or flattening the data.",
    "sections": [
      [
        "Structural base and combination",
        "Define total(number)=number and total(list)=the sum of totals of its children. An empty list contributes the additive identity zero. The invariant is that every call returns the sum of exactly the numeric leaves in its own subtree. Structural induction proves the result because the parent combines complete, nonoverlapping child subtrees.",
        "The type contract matters. A Python string is iterable, but blindly treating every iterable as another container can recurse over characters indefinitely or apply unintended semantics. This fixture uses only lists and non-boolean integers; a broader data model needs explicit rules for tuples, null values, booleans and invalid records."
      ],
      [
        "Shape controls resources",
        "For N total nodes in the nested tree and constant-cost additions, each node is visited once, giving O(N) work. Maximum call depth is O(h), where h is tree height. A chain of nested singleton lists has h proportional to N, while a broad shallow list has low depth. The number of scalar leaves alone does not describe traversal cost when many empty containers exist.",
        "Sharing and cycles change the model. If two parents reference the same list and the business meaning counts occurrences, traversing it twice is intentional. If it represents one entity, deduplication by identity may be required. A self-referential list is not a finite tree and needs cycle detection or rejection. The example builds only fresh acyclic lists, so its proof remains within the stated contract."
      ]
    ],
    "problem": "Sum integer leaves in nested list records and count every visited node.",
    "steps": [
      "Define the state, termination measure and result contract for the synthetic input.",
      "Trace each recursive choice or explicit continuation and check its invariant.",
      "Verify the result, then count calls, live state and output storage separately."
    ],
    "code": "def total(node):\n    if isinstance(node,int) and not isinstance(node,bool): return node,1\n    if not isinstance(node,list): raise TypeError(\"list or integer required\")\n    value=0; visits=1\n    for child in node:\n        subtotal,count=total(child)\n        value+=subtotal; visits+=count\n    return value,visits\nprint(total([2,[3,[],4],5]))\nprint(total([]))",
    "expect": "(14, 7)\n(0, 1)",
    "limit": "The example counts list containers and numeric leaves. It assumes a finite acyclic tree and uses a unit-cost arithmetic model.",
    "mistakes": [
      "Counting only numeric leaves understates work when the structure contains many containers.",
      "Accepting arbitrary iterables can confuse strings and cyclic structures with finite trees."
    ],
    "takeaways": [
      "Align base cases with the input grammar.",
      "Specify identity and occurrence semantics before traversing shared records."
    ],
    "practice": [
      "What subtotal should an empty list contribute?|0|1|None always|Its memory address|Zero is the additive identity for combining child totals.",
      "What does structural induction assume for a parent list?|Correct child summaries|Every child is an integer|Every list has equal length|All records are sorted|Combining correct child summaries yields the parent summary.",
      "Why does the fixture explicitly reject booleans?|bool subclasses int|Booleans cannot be compared|Every boolean contains a cycle|Lists cannot store booleans|The type hierarchy and business grammar do not have to coincide.",
      "A nested record contains 100 empty lists and no numeric leaves. Is traversal constant time?|No, it still visits the containers|Yes, there are no leaves|Only if every list is distinct|Only if the input is sorted|Container nodes also contribute traversal work.",
      "A self-referential list contains itself. Which assumption fails?|Finite acyclic tree input|Every node has an identity|All integers are nonnegative|The additive identity is zero|Cycles invalidate the structural termination argument.",
      "How does a singleton-list chain affect recursive stack usage?|Linear nesting height|It guarantees logarithmic depth|It uses no recursive frames|It creates a balanced tree|Every nested singleton adds another active ancestor call."
    ],
    "formal": [
      "Which value is the additive identity for subtree summation?|Zero|One|Minus one|Infinity|Adding zero leaves a subtotal unchanged.",
      "What is the scalar base case in the demonstrated grammar?|A non-boolean integer leaf|Any iterable object|Every list including nonempty ones|Any dictionary automatically|Only an accepted scalar returns directly.",
      "For N nodes in an acyclic nested tree, how many node visits occur?|N|Only the number of leaves|N squared always|log N|The traversal enters each container and scalar once.",
      "A reporting input is [1,[2,3],[]]. What sum should it return?|6|3|5|0|All three numeric leaf values contribute once.",
      "A service recursively processes every iterable, including strings. What defect should be addressed?|Explicit scalar/container grammar|Every string becomes an empty list|Python cannot iterate text|Strings always contain zero characters|A generic iterable rule does not define safe recursive semantics for text.",
      "A shared list X=[5] appears twice in a parent list whose semantics count occurrences. What total is appropriate?|10|5|0|It must raise regardless of contract|Two occurrences contribute the same leaf value twice under occurrence semantics.",
      "A data model counts each entity only once even when referenced by many parents. What state may be required beyond tree recursion?|A visited-identity set|A stack of sorted scalar values only|No additional state for any graph|A random child order|Entity deduplication requires remembering which identities were already counted.",
      "A tree has N nodes but height N. Which complexity pair is justified under constant-cost arithmetic?|Linear time and worst-case linear frames|Logarithmic traversal time with constant live space|O(N squared) time necessarily|O(1) time and O(N) space|Each node is visited once while every ancestor can remain active.",
      "A recursive aggregation creates a sliced copy of the remaining child list at every step. Why can a naive linear-work claim fail?|Repeated suffix copies can add quadratic work|Slicing is always a constant-cost view in Python|The sum identity changes|All child lists become cyclic|Python list slicing copies references, and cumulative copied suffix sizes can be quadratic.",
      "A billing aggregate must handle shared entities once, reject cycles with useful diagnostics, and accept 100000-level nesting. Which design meets the constraints?|Iterative frames with active/completed states|Plain recursive sum with no state|A shallow type check and unlimited recursion claim|Deduplicate solely by equal subtotal values|Explicit frames avoid call-depth limits, while identity/color state separates cycles from completed shared substructures."
    ]
  },
  {
    "slug": "combinations-prune",
    "title": "Generate combinations using increasing choices and safe pruning",
    "intro": "A merchandising planner chooses k distinct products from n candidates. A combination ignores order, so enforcing increasing selected indices removes permutation duplicates before they are generated. A feasibility bound can prune prefixes that cannot possibly reach the required size.",
    "sections": [
      [
        "Search state and completeness",
        "The state consists of start, the first allowed next index, and path, the chosen indices in increasing order. To extend a path, try index i at or after start, append its value, recurse with i+1, then pop. When path has length k, copy it into the results. Every valid k-subset has exactly one increasing index sequence, proving uniqueness and completeness.",
        "If r selections remain but only n-start candidates are available, stop when n-start<r. This is safe because no extension can supply the missing choices. Equivalently, bound the loop so enough candidates remain after choosing i. Do not prune merely because a prefix looks expensive unless a valid lower bound proves every completion violates the business constraint."
      ],
      [
        "Output-aware analysis",
        "There are C(n,k) output combinations, each of length k, so materializing them needs Omega(k*C(n,k)) time and output storage. The recursive path and call depth use O(k) auxiliary space excluding outputs. Copying the path at success is essential because the same mutable list is later popped and reused.",
        "A planning tool may stream combinations to a scorer rather than keep every result, but it cannot avoid visiting all requested outputs when exhaustive enumeration is required. Business constraints can drastically reduce actual work without changing the unconstrained worst-case output count. Handle k=0 as one empty combination and k>n as no combination."
      ]
    ],
    "problem": "Enumerate two-product combinations with an availability pruning bound.",
    "steps": [
      "Define the state, termination measure and result contract for the synthetic input.",
      "Trace each recursive choice or explicit continuation and check its invariant.",
      "Verify the result, then count calls, live state and output storage separately."
    ],
    "code": "def choose(values,k):\n    out=[]; path=[]; n=len(values)\n    def visit(start):\n        remaining=k-len(path)\n        if remaining==0:\n            out.append(path.copy()); return\n        if n-start<remaining: return\n        for i in range(start,n-remaining+1):\n            path.append(values[i]); visit(i+1); path.pop()\n    visit(0); return out\nprint(choose([\"A\",\"B\",\"C\",\"D\"],2))\nprint(choose([\"A\"],0))\nprint(choose([\"A\"],2))",
    "expect": "[['A', 'B'], ['A', 'C'], ['A', 'D'], ['B', 'C'], ['B', 'D'], ['C', 'D']]\n[[]]\n[]",
    "limit": "Candidates are distinct by position. Duplicate product values require an additional value-level uniqueness policy. Output copying contributes to total work and storage.",
    "mistakes": [
      "Appending path itself stores aliases to one mutable object; append a copy at each solution.",
      "Recursing with i rather than i+1 allows reusing the same position and changes the problem."
    ],
    "takeaways": [
      "Increasing index order prevents permutation duplicates.",
      "A pruning rule needs a proof that it cannot remove a valid completion."
    ],
    "practice": [
      "Why recurse with next start equal to i+1?|Increasing unique positions|To allow unlimited reuse of position i|To sort payloads in place|To remove all duplicate values automatically|Later choices must follow the selected position.",
      "What does choosing zero products return?|One empty combination|No combinations|Every single product|An error by definition|There is exactly one way to choose no positions.",
      "When is the availability pruning test safe?|Fewer candidates remain than choices still needed|The current path has a low score with no bound|The input is not alphabetized|One value is repeated|No extension can fill the required number of positions.",
      "Why copy path when recording a result?|Later backtracking mutates the working path|Every list copy sorts values|It reduces all output space to constant|Python cannot append lists|Each stored result must preserve its own sequence.",
      "How many two-position combinations exist among five distinct positions?|10|20|25|5|C(5,2)=5*4/2 counts unordered pairs.",
      "A planner requires candidates without repetition. What does recursing with i instead of i+1 risk?|Selecting the same position repeatedly|Eliminating all longer paths|Making every result sorted by value|Using no stack frames|The current position remains eligible for the next choice."
    ],
    "formal": [
      "Does order distinguish [A,B] from [B,A] in a combination problem?|No|Yes always|Only for strings|Only when k is even|Combinations represent subsets rather than ordered selections.",
      "What is C(n,0)?|1|0|n|n squared|The empty subset is the unique size-zero choice.",
      "How many entries are in each materialized k-combination?|k|n always|C(n,k)|One always|Each solution contains exactly k selected values.",
      "A product planner needs 3 items but only 2 candidates remain after a prefix. What should the search do?|Prune the prefix|Emit the incomplete path|Reuse a candidate despite the contract|Restart with a random prefix|The remaining pool cannot fill the required slots.",
      "A team stores the same mutable path object for every solution. What is likely observed after the search pops all choices?|Stored references alias the emptied path|Stored results retain independent copied snapshots|Automatic deep copies|A sorted set of subsets|Appending a reference does not copy the list’s contents.",
      "A campaign picks 2 of 4 distinct placements without order. How many solutions must exhaustive output include?|6|4|8|12|There are four choices for the first position and three for the second, divided by two because order is ignored.",
      "A planner must materialize all length-k combinations. Which lower bound follows from writing the output?|Omega(k*C(n,k))|O(log n) always|O(1) regardless of k|Omega(n squared) for every k|Every output contains k values and there are C(n,k) outputs.",
      "A scorer prunes a prefix because its current cost exceeds budget, but later choices can have negative cost. Why can this lose valid solutions?|The cost is not a valid lower bound on every completion|Negative costs cannot be represented|Pruning always preserves completeness|Combinations require all costs positive by definition|Later negative values may bring the total back within budget.",
      "A combination generator streams each result to a consumer rather than collecting all. Which storage can shrink?|Materialized output storage|The mandatory length-k path in all cases|The input collection itself automatically|The number of required outputs|Streaming avoids retaining previously emitted combinations.",
      "A planner materializes every combination of n distinct positions as a separate k-element list, with1<=k<=n. Excluding input and retained output, the DFS keeps only one live path and O(k) frames. Which resource accounting is correct?|k*C(n,k) output cells; O(k) auxiliary state|C(n,k) output cells; O(k) total runtime|O(k) output cells; O(n^k) auxiliary state|k*C(n,k) output cells; O(C(n,k)) live path|There are C(n,k) result lists containing k entries each. Retained output therefore needs k*C(n,k) entries while one current path and recursion frames use O(k) auxiliary state; those resources must not be conflated."
    ]
  },
  {
    "slug": "permutations-state",
    "title": "Restore choices when enumerating permutations",
    "intro": "A test runner generates all orderings of a short set of workflow steps. Permutations distinguish order, so the search chooses any currently unused position at each level. Correct restoration lets one mutable path represent many independent branches without leaking state between them.",
    "sections": [
      [
        "Choose, explore, undo",
        "Maintain used[i] for each input position and a path of chosen values. Before descending, mark the position used and append its value; after the child returns, pop and clear used[i]. The invariant is that used positions correspond exactly to path positions. At length n, copy the completed path.",
        "For n distinct inputs, there are n choices at the first level, n-1 at the second, and so on, yielding n! leaves. Writing each full permutation costs O(n), so explicit output has Theta(n*n!) entries. The live path, flags and depth use O(n) auxiliary state, excluding retained results."
      ],
      [
        "Duplicate-value policy",
        "If input values repeat and equal-valued outputs should appear only once, distinct position choices can create duplicate value sequences. Sort first, then skip i when its value equals the previous value and that previous equal position is not used in the current prefix. This chooses one canonical order for equal unused positions at each level.",
        "The skip condition must account for used state: an earlier equal value already in the path does not prohibit using the later equal value deeper in that same path. A simpler per-depth set of already-tried values is another valid design. State whether duplicates are distinguished by identity or collapsed by value before selecting a rule."
      ]
    ],
    "problem": "Generate distinct value permutations for a repeated input.",
    "steps": [
      "Define the state, termination measure and result contract for the synthetic input.",
      "Trace each recursive choice or explicit continuation and check its invariant.",
      "Verify the result, then count calls, live state and output storage separately."
    ],
    "code": "def permutations(values):\n    values=sorted(values); used=[False]*len(values); path=[]; out=[]\n    def visit():\n        if len(path)==len(values): out.append(path.copy()); return\n        for i,x in enumerate(values):\n            if used[i]: continue\n            if i>0 and x==values[i-1] and not used[i-1]: continue\n            used[i]=True; path.append(x)\n            visit()\n            path.pop(); used[i]=False\n    visit(); return out\nprint(permutations([1,1,2]))\nprint(permutations([]))",
    "expect": "[[1, 1, 2], [1, 2, 1], [2, 1, 1]]\n[[]]",
    "limit": "The sorted fixture collapses equal values. For identity-distinct jobs with equal labels, suppressing equal-value branches could be incorrect.",
    "mistakes": [
      "Forgetting to clear used after returning suppresses valid sibling branches.",
      "Skipping every repeated value at every depth prevents valid outputs containing multiple copies."
    ],
    "takeaways": [
      "Backtracking restores the exact state expected by the next sibling.",
      "Value uniqueness and identity uniqueness are different contracts."
    ],
    "practice": [
      "What does used[i] mean?|Active path membership|Value i is globally forbidden forever|Output i has been printed|Position i has the smallest payload|The flag tracks membership in the active partial permutation.",
      "What must follow a successful recursive return from one chosen position?|Pop and clear used|Clear every output|Keep the choice marked forever|Sort the path in place|Restoration returns the parent state for exploring siblings.",
      "How many unique value permutations does [1,1,2] have?|3|6|2|1|There are 3!/2! distinct orderings when equal ones are indistinguishable.",
      "Why is the condition not used[i-1] part of duplicate skipping?|It suppresses equivalent unused sibling choices|It prevents using both copies in one solution|It forces all values to be distinct|It guarantees constant total time|An earlier equal position already in the prefix permits the later copy deeper down.",
      "What is the result for the empty input in the shown generator?|One empty permutation|No permutations|One None value|An error always|The initial empty path is already a complete length-zero ordering.",
      "A workflow has equal display labels but distinct task identities. Should equal-label branches always be removed?|Not if identities differ|Yes, labels define every identity|Only if labels are strings|Only after all results are printed|Deduplication semantics must match the business definition of a distinct ordering."
    ],
    "formal": [
      "Do permutations distinguish order?|Yes|No|Only for numeric inputs|Only for even lengths|Changing position order can produce a different permutation.",
      "How many permutations exist for three distinct items?|6|3|9|8|There are 3*2*1 possible orderings.",
      "What storage tracks chosen input positions in the fixture?|A boolean used array|Only a queue of completed outputs|A heap of priorities|An immutable scalar count only|Each position has an active-membership flag.",
      "A test generator forgets to reset used[i] after backtracking. What behavior follows?|Valid sibling permutations may disappear|Every output is automatically duplicated|The input sorts itself|The recursion depth becomes zero|A stale flag incorrectly forbids later branches from choosing that position.",
      "A team skips every value equal to its predecessor without checking used. Which valid result can be lost for [1,1,2]?|[1,1,2]|Only [2]|Only the empty sequence|None, this always works|The later equal one must remain selectable after the earlier one is already chosen.",
      "A generator materializes all permutations of n distinct tasks. What is the output-entry count?|Theta(n*n!)|Theta(n)|Theta(log n)|Theta(2n)|There are n! sequences and each contains n task entries.",
      "A runner retains only one current permutation and streams completed outputs. Which auxiliary state bound fits the used/path recursion design?|O(n)|O(n!) necessarily|O(1) universally|O(n squared) necessarily|Flags, path and depth each scale linearly with n, excluding outputs.",
      "A developer memoizes permutation calls only by depth. Why is this state key insufficient?|Different used sets allow different remaining choices|Every depth uniquely identifies the used positions|All paths of one length have identical outputs|Memoization never needs a key|Future choices depend on which positions were consumed, not just how many.",
      "A test planner needs only the first valid ordering. What change avoids exploring all later valid leaves?|Stop and propagate first success|Continue collecting all outputs then discard them|Duplicate every result twice|Remove the base case|Early success propagation terminates branches that are no longer needed.",
      "A generator has repeated values with multiplicities c1 through cr summing to n and must emit unique value orderings. Which lower-bound count should size the output budget?|n!/(c1!*...*cr!) sequences, each length n|n! distinct sequences even when all values are identical|Exactly n sequences for every multiplicity|2^r sequences independent of n|Permuting identical copies does not create new value sequences, so divide by each multiplicity factorial."
    ]
  },
  {
    "slug": "constraints-search",
    "title": "Prune constraint searches with reversible occupancy sets",
    "intro": "A scheduling prototype places one nonconflicting item per row on a small board. The n-queens model makes constraint state concrete: selected columns and the two diagonal identifiers summarize whether the next placement can coexist with the current prefix.",
    "sections": [
      [
        "Local feasibility and completeness",
        "Represent a partial board by the column chosen in each completed row. A placement at row r, column c conflicts if c is already used, r-c is an occupied descending diagonal, or r+c is an occupied ascending diagonal. If none is occupied, add all three identifiers, recurse to row r+1, then remove them on return.",
        "Every legal complete board has exactly one column per row and satisfies these three tests at every prefix. Therefore rejecting a placement with a shared occupied identifier cannot remove a legal board. Conversely, reaching row n with all tests preserved proves no two placed queens share a row, column or diagonal."
      ],
      [
        "Bound what pruning guarantees",
        "Without pruning, choosing among n columns in each of n rows gives n^n row-choice paths. Column uniqueness alone limits full permutations to n!, and diagonal checks reduce the visited search tree further in many cases. These are bounds and pruning effects, not a promise of polynomial worst-case search. Keep set membership’s expected constant-time assumption explicit.",
        "Occupancy sets and the path contain O(n) items for a depth-n search, excluding solutions. Copy each board at success or stream it. Symmetry reductions can improve counts but must preserve the requested output contract: counting mirrored boards as equivalent differs from enumerating every legal arrangement. A scheduling analogy also needs its own constraint model; queens is not a complete workforce scheduler."
      ]
    ],
    "problem": "Enumerate the two legal boards for four queens using reversible sets.",
    "steps": [
      "Define the state, termination measure and result contract for the synthetic input.",
      "Trace each recursive choice or explicit continuation and check its invariant.",
      "Verify the result, then count calls, live state and output storage separately."
    ],
    "code": "def queens(n):\n    cols=set(); down=set(); up=set(); path=[]; out=[]\n    def visit(r):\n        if r==n: out.append(path.copy()); return\n        for c in range(n):\n            if c in cols or r-c in down or r+c in up: continue\n            cols.add(c); down.add(r-c); up.add(r+c); path.append(c)\n            visit(r+1)\n            path.pop(); cols.remove(c); down.remove(r-c); up.remove(r+c)\n    visit(0); return out\nprint(queens(4))\nprint(queens(2))",
    "expect": "[[1, 3, 0, 2], [2, 0, 3, 1]]\n[]",
    "limit": "This is an isolated combinatorial fixture with zero-based columns. It demonstrates proven local pruning; it does not claim polynomial runtime or solve a real staffing model.",
    "mistakes": [
      "Leaving a diagonal identifier after backtracking incorrectly blocks sibling placements.",
      "Declaring every pruned search polynomial confuses practical reduction with worst-case proof."
    ],
    "takeaways": [
      "Constraint summaries must be updated and restored together.",
      "State whether symmetry-equivalent solutions are separate outputs."
    ],
    "practice": [
      "Which key identifies one descending diagonal for row r and column c?|r-c|r*c|r/c|r squared plus c|Positions sharing r-c lie on the same descending diagonal.",
      "Why is one row implicit in each recursion level?|One row per level|Rows never constrain queens|Every queen is placed in all rows|The board is sorted by payload|The control state enforces one placement per row.",
      "What must be restored after exploring a placement?|All choice state|Only the row number stored globally|All previously emitted boards|Every input cell|All state added for the choice must be removed for sibling branches.",
      "How many legal four-queen boards does the fixture emit?|2|4|8|16|The two zero-based column sequences satisfy all row, column and diagonal constraints.",
      "Can constraint pruning alone prove polynomial worst-case time?|No|Yes, every rejected branch yields polynomial work|Only for any set-based implementation|Only when output is copied|Pruning may reduce work without changing exponential or combinatorial worst-case growth.",
      "What does selecting columns [1,3,0,2] mean?|One column per row|Four queens all share row one|A priority queue has four keys|The board has only two rows|Each path index denotes a row and its value denotes the chosen column."
    ],
    "formal": [
      "Which two diagonal identifiers are used by the fixture?|r-c and r+c|r*c and r/c|r only and c only|n-r and n-c only|Constant row-minus-column and row-plus-column describe the two diagonal directions.",
      "What does reaching row n mean in the backtracking state?|The complete legal board is built|Every possible board was invalid|Only one queen was placed|The recursion must continue forever|All n rows have accepted one nonconflicting column each.",
      "What is live occupancy/path storage for n rows, excluding outputs?|O(n)|O(n!) necessarily|O(1) universally|O(n cubed) necessarily|Each placed queen adds a constant number of set entries and one path entry.",
      "A solver forgets to remove r+c after a branch returns. What happens?|Stale constraints reject later branches|More legal boards are guaranteed|The solution count is doubled exactly|Every board becomes symmetric|The occupancy set no longer represents just the active prefix.",
      "A staffing planner assumes the n-queens demonstration handles employee availability and legal rest periods. What is missing?|Domain-specific business constraints|A larger integer board size alone|A different print format|A stable sort on emitted boards|The fixture models geometric conflicts, not a full scheduling domain.",
      "A board prefix has a queen at (1,3). Which candidate shares its descending diagonal?| (2,4)| (2,3)| (2,1)| (0,3)|Both (1,3) and (2,4) have row-minus-column equal to minus two.",
      "A team counts mirrored boards as one solution but a customer requests every legal board. What must be reconsidered?|Symmetry reduction’s output contract|Whether sets support removal|The additive identity|Whether indices start at zero only|Collapsing mirrors changes the requested enumeration.",
      "A recursive solver tries n columns per row without any constraints. How many complete row-choice sequences are possible?|n^n|n|log n|n+1|There are n choices independently at each of n rows.",
      "A solver enforces unique columns before diagonal checks. What upper bound applies to complete column assignments?|n!|2n|n squared for all n|One always|A complete distinct-column assignment is a permutation of n columns.",
      "A service needs one feasible board under a strict node-expansion budget B. Which result protocol is accurate when the budget expires before exhaustive search?|Inconclusive unless a board was found|Report unsatisfiable because no board was found yet|Report all boards enumerated|Silently drop constraints to produce any board|Failure to find a solution within a budget is not a proof that no solution exists."
    ]
  },
  {
    "slug": "explicit-frames",
    "title": "Convert postorder recursion into explicit continuation frames",
    "intro": "A nested expression evaluator must handle a deep synthetic tree without relying on Python call depth. A direct recursive function computes children before combining them. An iterative translation must remember which child results are still pending and when the parent can combine them.",
    "sections": [
      [
        "Frames encode pending work",
        "Represent each traversal frame as (node, expanded). On first entry, schedule an expanded parent frame below its child frames. When the expanded frame is popped, all child computations have finished, so the evaluator can combine their stored results. This reproduces postorder return timing rather than merely visiting every node.",
        "For an expression tree, child evaluation order matters if operations are not commutative or have effects. Push frames in reverse desired visit order because the stack is LIFO. A separate value stack can collect child values; when combining subtraction, pop right then left and compute left-right, not the reverse."
      ],
      [
        "Resource comparison",
        "Replacing recursive calls with explicit frames avoids interpreter recursion limits, but the algorithm still needs pending state proportional to tree height in a binary depth-first walk. A value stack and retained subtree results also contribute to storage. For N nodes processed a bounded number of times, traversal work is O(N).",
        "A plain stack of node names may produce a preorder listing without preserving return values. Translate the continuation: identify what the recursive caller does after the child returns, then encode that action and the required locals. This method applies to expression evaluation, directory cleanup and tree summaries, while graphs additionally need identity and cycle policies."
      ]
    ],
    "problem": "Evaluate a small subtraction tree with explicit frames and a value stack.",
    "steps": [
      "Define the state, termination measure and result contract for the synthetic input.",
      "Trace each recursive choice or explicit continuation and check its invariant.",
      "Verify the result, then count calls, live state and output storage separately."
    ],
    "code": "expr=(\"-\",(\"-\",8,3),2)\nframes=[(expr,False)]; values=[]\nwhile frames:\n    node,done=frames.pop()\n    if isinstance(node,int): values.append(node)\n    elif done:\n        right=values.pop(); left=values.pop(); values.append(left-right)\n    else:\n        frames.append((node,True))\n        frames.append((node[2],False)); frames.append((node[1],False))\nprint(values)",
    "expect": "[3]",
    "limit": "The grammar contains only integers and binary subtraction tuples. The explicit stack preserves postorder and operand order; it does not imply constant total memory.",
    "mistakes": [
      "Popping left before right reverses noncommutative operands.",
      "Removing the completion marker loses the point at which the parent should combine results."
    ],
    "takeaways": [
      "Translate the caller continuation, not only its child calls.",
      "Explicit stacks move state; they do not erase it."
    ],
    "practice": [
      "Why does an expanded frame run after its children?|It is pushed below child frames|Python sorts stack frames|It is stored in a FIFO queue|The input tuple changes automatically|LIFO processing finishes frames placed above it first.",
      "For left-right subtraction, which value is popped first from the value stack after left then right evaluation?|Right|Left|The operator text|The root identity|The right result was most recently pushed.",
      "What does an explicit-frame translation avoid?|Recursive call-depth limit|All algorithmic storage|Every type error|All shared-node duplication|Pending continuations are stored in a container rather than nested calls.",
      "What is the result of (8-3)-2?|3|7|-7|13|The left subtree gives five, then the root subtracts two.",
      "Why is a node-only preorder listing insufficient for expression evaluation?|Missing return-state timing|All operators are commutative|A list cannot store integers|Every tree has one node|Evaluation must combine child results after they are available.",
      "For a skewed binary tree of height h, what pending-state bound can remain?|O(h)|Always O(1)|O(log h) always|No storage|A deep chain can retain one continuation per ancestor."
    ],
    "formal": [
      "What is a continuation in this context?|Pending caller work|A new copy of the whole program|A guaranteed parallel worker|A sorted node label|The caller has pending actions and local state after a child call.",
      "Which traversal order naturally supports child-result combination?|Postorder|Preorder only|Random order|Alphabetical order|Children must be evaluated before their parent combines values.",
      "How does a LIFO stack choose its next frame?|Most recent frame first|Earliest pushed first|Smallest payload first|Shortest subtree first|A LIFO stack removes its most recently pushed frame, so child scheduling order must be reversed when needed.",
      "An evaluator pushes left then right child frames. Which subtree runs first?|Right|Left|Both in parallel|Neither until the parent completes|The last pushed child is the first popped.",
      "A subtraction evaluator pops x then y and computes x-y after evaluating left then right. What is wrong?|It reverses the operands|It doubles both operands|It must use a queue for subtraction|It creates a cycle|The top result belongs to the right operand; correct combination is y-x.",
      "A directory tool must delete children before a parent directory. Which explicit-frame action timing fits?|Delete on completion frames|Delete on first entry|Delete only the root|Delete in sorted filename order without traversal|A completion frame runs after all child work.",
      "An engineer replaces recursion with an explicit stack and claims O(1) auxiliary space for any tree. What corrects the claim?|Pending frames can require O(h) space|Heap-allocated stacks consume no memory|Only recursive storage counts as space|All trees have constant height|Algorithmic workspace includes explicit containers and can grow with depth.",
      "An expression tree has N nodes, each pushed a constant number of times. What traversal work follows?|O(N)|O(N squared)|O(2 to N)|O(log N)|A bounded amount of frame work per node sums linearly.",
      "A recursive function uses a local loop index after each child returns. What must the iterative frame preserve?|The next child index and needed locals|Only the original function name|Only the final output count|No locals because recursion is removed|The continuation needs enough state to resume at the correct child.",
      "A deeply nested expression service requires correct noncommutative evaluation, O(h) pending state and no interpreter recursion dependence. Which design is appropriate?|Postorder frames and ordered value handling|A node-only stack that emits operators immediately|An unlimited recursion-limit increase|Sorting operands before evaluation|Frames reproduce return timing, scheduling preserves operand order, and explicit storage bounds pending depth."
    ]
  },
  {
    "slug": "tail-iteration",
    "title": "Replace linear tail recursion with a loop",
    "intro": "A synthetic retry-count calculator uses an accumulator and makes its recursive call as the final action. That tail position makes a loop translation straightforward, but Python does not promise tail-call elimination. Write iteration explicitly when call depth is not an acceptable resource.",
    "sections": [
      [
        "Tail position and state transfer",
        "A call is in tail position when its returned result is returned directly with no later computation in the current frame. For an accumulator sum, sum_tail(n,acc) calls sum_tail(n-1,acc+n). Both changing values become loop state. At each iteration assign the next values and continue until the same base condition holds.",
        "An ordinary factorial expression n*fact(n-1) is not tail recursive because multiplication remains after the call. Introducing an accumulator can change the control structure, but in Python it still creates one interpreter call per step. The optimization belongs to the runtime contract, not the surface appearance of a final return statement."
      ],
      [
        "Invariant and limits",
        "For summing integers one through original N, maintain acc plus the sum one through remaining n equal to the desired final total. The update acc+=n; n-=1 preserves that relationship. When n reaches zero, acc is the answer. There are N iterations and a fixed number of scalar variables.",
        "O(1) scalar-variable count is not constant bit storage for arbitrarily large integers. The accumulator needs enough bits for the result. For a streaming reducer over a finite list of fixed-size values, a loop can bound call overhead while the accumulator representation still needs explicit analysis. For branching recursion, a simple accumulator loop usually does not preserve all pending branches; use explicit frames or a different algorithm."
      ]
    ],
    "problem": "Sum one through n with a loop invariant instead of recursive calls.",
    "steps": [
      "Define the state, termination measure and result contract for the synthetic input.",
      "Trace each recursive choice or explicit continuation and check its invariant.",
      "Verify the result, then count calls, live state and output storage separately."
    ],
    "code": "def triangular(n):\n    if n<0: raise ValueError(\"nonnegative required\")\n    acc=0\n    while n:\n        acc+=n; n-=1\n    return acc\nprint(triangular(5))\nprint(triangular(0))\nprint(triangular(100000))",
    "expect": "15\n0\n5000050000",
    "limit": "The fixture verifies exact integer results without recursion. It counts a fixed number of scalar variables, while their integer bit lengths still grow with n.",
    "mistakes": [
      "Calling a function tail recursive does not grant Python automatic tail-call elimination.",
      "Updating an accumulator after changing a state variable may use the wrong old value; derive the simultaneous transition first."
    ],
    "takeaways": [
      "Tail-call state often maps directly to loop variables.",
      "Constant variable count and constant bit memory are different claims."
    ],
    "practice": [
      "Is return n*fact(n-1) a tail call?|No, multiplication remains after the call|Yes, every return expression is tail recursive|Only for even n|Only if n is an integer|Tail position permits no remaining caller computation.",
      "Does Python promise to eliminate tail-recursive frames?|No|Yes for every function|Only if the function name is short|Only for dictionary inputs|Do not assume tail-call optimization in the Python execution contract.",
      "Which loop variables replace sum_tail(n,acc)'s arguments?|n and acc|Only the final output list|A global recursion-depth counter alone|Every previous accumulator value|The state transition is represented by the current arguments.",
      "What is triangular(5) in the fixture?|15|5|25|10|The loop sums five plus four plus three plus two plus one.",
      "What does the loop return for n=0?|0|1|None|A RecursionError|The loop body is skipped and the additive accumulator stays zero.",
      "Why can a fixed number of integer variables still use growing bits?|Their numeric magnitudes can increase|Every Python integer is exactly one byte|Loops allocate no integers|Variable names encode the values|The representation size of arbitrary-precision integers depends on magnitude."
    ],
    "formal": [
      "What makes a call tail-positioned?|No caller operation remains|It is the first call in the file|It has a smaller argument only|It uses a list parameter|Its result is returned directly without a later caller operation.",
      "Which construct naturally replaces linear tail recursion?|A loop updating the current state|A heap requiring all previous states|A sort of every call frame|A new thread per iteration|Only one successor state needs to be carried forward.",
      "What is the loop’s iteration count when n starts at N>=0?|N|N squared|log N always|One always|Each iteration decrements n once until zero.",
      "A developer rewrites tail recursion in Python but keeps one recursive call per decrement. What space risk remains?|Linear recursive-call depth|Guaranteed constant frame usage|Only a constant-depth base frame|No memory allocation by definition|Python does not promise frame elimination for tail calls.",
      "A triangular loop decrements n before acc+=n. What result does it return for initial n=3?|3|6|9|0|It adds two, one and zero, omitting the original three.",
      "A reducer must process a million fixed-size records without interpreter recursion overflow. Which control structure fits?|An iterative accumulator loop|A recursive call for every record|Raising the recursion limit without bound|Recursing twice per record|Iteration avoids a chain of interpreter calls.",
      "A reviewer claims O(1) bits for an exact triangular sum with unbounded n. What is the correction?|O(log n) result bits|It needs exactly n! bits|It always fits one byte|It needs no stored result|The result is Theta(n squared), whose binary length grows logarithmically with n.",
      "A branch search has two unexplored child states per node. Why is one current-state accumulator insufficient in general?|Pending branches need their own representation|Tail recursion always explores every branch|All branches are identical|A scalar automatically stores an unbounded tree|A linear transition loop cannot silently preserve multiple continuations.",
      "A loop translation must preserve two arguments updated from the old state. Which method avoids accidental sequential dependence?|Compute the next-state expressions from old values before rebinding|Overwrite the first value and assume later formulas still use it|Randomize update order|Store every prior state forever|The loop must reproduce the recursive call’s argument values.",
      "An exact reducer must avoid call overflow, retain only a fixed number of running scalar values, and accept bounded input magnitudes. Which claim is precise?|Constant scalar count, size-dependent bits|Tail recursion guarantees constant Python frames|Constant variables imply unlimited exact arithmetic at zero cost|An explicit stack of all records meets constant workspace|The iterative state bound is valid under a specified value-size model and does not erase integer representation costs."
    ]
  },
  {
    "slug": "memo-state",
    "title": "Cache complete states without hiding recursion depth",
    "intro": "A planning counter repeatedly asks how many ways a remaining number of steps can be reached by one- or two-step moves. Overlapping subproblems invite memoization. A cache removes repeated work only when its key captures every input that affects future results.",
    "sections": [
      [
        "State identity and recurrence",
        "Let ways(n)=ways(n-1)+ways(n-2), with ways(0)=1 and ways(1)=1 for nonnegative n. An uncached recursive tree repeats the same n many times. A cache keyed by n computes each distinct state once, so there are O(n) state evaluations and O(n) cached integer results, assuming unit-cost additions and lookups.",
        "The first recursive descent can still be n frames deep. Memoization removes repeated calls after the first result becomes available; it does not make the recurrence bottom-up or eliminate the interpreter stack. Bottom-up iteration computes smaller states first and can retain only the previous two values for this recurrence."
      ],
      [
        "Key correctness and cost model",
        "If results also depend on allowed move lengths, remaining budget or a mutable rule set, n alone is not a complete key. Include immutable representations of all relevant state, separate caches per fixed configuration, or invalidate safely when rules change. Caching a function with time-dependent external side effects can also change behavior, so purity or an explicit cache contract matters.",
        "Large exact counts grow in bit length. O(n) additions is not automatically O(n) bit time, and O(n) cached numbers is not O(n) bits. A bounded cache may evict states and reintroduce recomputation. In production use a resource budget and a measured workload after proving the state model; the local fixture only verifies counts and the number of cache misses."
      ]
    ],
    "problem": "Compare cached top-down counting with a bottom-up two-value loop.",
    "steps": [
      "Define the state, termination measure and result contract for the synthetic input.",
      "Trace each recursive choice or explicit continuation and check its invariant.",
      "Verify the result, then count calls, live state and output storage separately."
    ],
    "code": "from functools import lru_cache\n@lru_cache(maxsize=None)\ndef ways(n):\n    if n<2: return 1\n    return ways(n-1)+ways(n-2)\ndef iterative(n):\n    a=b=1\n    for _ in range(2,n+1): a,b=b,a+b\n    return b\nprint(ways(8), iterative(8))\nprint(ways.cache_info().misses)\nprint(iterative(0))",
    "expect": "34 34\n9\n1",
    "limit": "The demonstrated domain is nonnegative integers with fixed moves {1,2}. The cache stores each n from zero to eight once; stack depth and integer size remain separate costs.",
    "mistakes": [
      "Caching by depth alone is wrong when choices depend on which items remain.",
      "Memoization can remove exponential repeated work while leaving a linear first-call stack depth."
    ],
    "takeaways": [
      "A cache key must be a sufficient description of the subproblem.",
      "Choose top-down, bottom-up and bounded-cache designs using separate work and storage models."
    ],
    "practice": [
      "What overlapping state repeats in ways(n)=ways(n-1)+ways(n-2)?|The same remaining n|Only the original input once|A different random configuration each time|The CPU thread identity|Multiple branches request equal smaller arguments.",
      "How many misses occur when the shown empty cache first computes ways(8)?|9|8|34|256|Arguments zero through eight each need one first evaluation.",
      "Does memoization eliminate the initial depth-n descent?|No|Yes, every cached function is iterative|Only if the result is positive|Only when keys are integers|States must first be computed, so the top-down chain remains.",
      "What is ways(4) with bases one and one?|5|4|8|3|The sequence for zero through four is one, one, two, three, five.",
      "Why can n alone be an invalid key if allowed moves change?|Rules affect future results|Integer keys are never hashable|Every rule set yields the same answer|Caches compare only object sizes|The key must include all state that influences the result.",
      "What storage can bottom-up ways counting reduce compared with storing all prior results?|Only two prior counts|It must retain every call frame|It eliminates integer bit length|It stores no result at all|Only the two immediately preceding states are needed for this recurrence."
    ],
    "formal": [
      "What does memoization store?|State-indexed computed results|Every source-code line|Only the largest input label|A randomly selected branch|A later request for the same state can reuse its computed result.",
      "What property makes cache reuse easiest to reason about?|Complete state fixes the result|Every call changes unkeyed external state|Inputs mutate during every call|The result depends on an unkeyed clock|Deterministic state-to-result behavior supports valid reuse.",
      "Under unit-cost arithmetic, how many distinct states does cached ways(n) evaluate?|O(n)|Theta(2 to n)|O(1)|Theta(n!)|The possible remaining arguments are zero through n.",
      "A planner changes allowed moves but reuses a cache keyed only by remaining distance. What bug can occur?|Stale results from the previous rules|Guaranteed correct automatic invalidation|A sorted output list|A smaller exact recursion depth|The old key does not distinguish configurations with different answers.",
      "A cached recurrence is invoked at n=100000 in ordinary Python. What failure remains possible before useful reuse?|RecursionError from the first descent|Guaranteed constant-stack execution|Automatic conversion to a loop|A hash collision always causing wrong answers|Top-down memoization still nests recursive calls.",
      "A service only needs the final ways(n) value, not a reconstruction path or every prefix count. Which alternative reduces retained state?|Bottom-up iteration with two prior counts|Store all recursive trace events|An unbounded result cache shared across all users|Materialize every valid step sequence|This recurrence’s transition depends on only two earlier values.",
      "A cache has capacity much smaller than the working set and frequently evicts needed states. What complexity concern arises?|Eviction can reintroduce repeated computation|Eviction guarantees every state computes once|The function becomes automatically parallel|Input semantics no longer matter|The usual one-evaluation-per-state argument assumes results remain available.",
      "A recursive route solver is memoized only by current node even though remaining fuel affects valid moves. Which key repairs the state model?|Node, fuel and relevant rule identity|The current node plus the display label only|Only the recursion depth|Only the maximum node label|Future feasible transitions depend on both location and resource state.",
      "A reviewer calls O(n) stored exact Fibonacci-like values O(n) bits. Why is that inaccurate?|Individual values have growing bit lengths|Every value takes n! bits|Python never stores integers|A cache stores only pointers to nonexistent values|Counting numeric entries omits their increasing representation sizes.",
      "A planner needs large-n exact counts, no recursion dependence, and minimum retained prior-count state under fixed {1,2} moves. Which design is appropriate?|Bottom-up two-value iteration with explicit big-integer resource bounds|Top-down recursion with an unlimited cache and constant-stack claim|Cache only the last input’s string label|Enumerate every route and count afterward|The recurrence needs two previous values; iteration avoids call depth while exact arithmetic still needs a size-aware budget."
    ]
  }
],["Doc/tutorial/controlflow.rst", "Doc/library/functools.rst", "Doc/library/sys.rst"]);
