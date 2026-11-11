'use strict';
const {course}=require('./wave4-algorithms-private');
module.exports=course("greedy-dp",[
  {
    "slug": "exchange",
    "title": "Prove interval scheduling by exchanging the first choice",
    "intro": "A room-booking service must accept the largest number of nonoverlapping meetings in one room. All accepted meetings have equal value. Choosing an early-finishing compatible meeting is safe, but choosing the shortest duration or earliest start requires different reasoning and can fail.",
    "sections": [
      [
        "Define compatibility and the optimization target",
        "Represent meetings as half-open intervals [start,finish), with start strictly less than finish. Back-to-back meetings are compatible because an interval finishing at t does not overlap one starting at t. Sort by increasing finish time and repeatedly accept a meeting whose start is at least the last accepted finish. The objective is maximum count, not maximum total revenue or covered duration.",
        "To prove the greedy choice, take an optimal schedule O whose first meeting is o. Let g be the globally earliest-finishing meeting. Since finish(g)<=finish(o), replacing o with g cannot conflict with any later meeting in O. The replacement preserves the number of meetings and leaves at least as much remaining time. Therefore some optimum begins with g, and applying the same argument to the compatible suffix proves the whole algorithm."
      ],
      [
        "Separate the proof from plausible heuristics",
        "Earliest start can select a long meeting that blocks many short ones. Shortest duration can select a central meeting that overlaps two otherwise compatible meetings. Largest individual value can fail when two smaller-value meetings together earn more. An exchange proof must preserve feasibility and the claimed objective; saying a choice looks locally best is not a proof. Weighted interval scheduling generally needs a dynamic program.",
        "Sorting n meetings costs O(n log n) comparisons and scanning costs O(n). If the input is already ordered by finish, the scan alone is O(n); the result list takes O(k) space for k accepted meetings. A boundary contract determines whether equality is compatible. The fixture accepts adjacent reservations and exposes the order rather than claiming that one sample proves the greedy theorem."
      ]
    ],
    "problem": "Prove interval scheduling by exchanging the first choice on a synthetic business fixture.",
    "steps": [
      "State the input contract and identify the invariant that must hold before each operation.",
      "Execute the fixture and follow each update using the displayed representation.",
      "Compare the result against the expected output and derive costs under the stated operation model."
    ],
    "code": "meetings=[(\"long\",0,7),(\"intro\",0,2),(\"review\",2,4),(\"demo\",4,6)]\nchosen=[]; end=float(\"-inf\")\nfor name,start,finish in sorted(meetings,key=lambda x:x[2]):\n    if start>=end: chosen.append(name); end=finish\nprint(chosen)",
    "expect": "['intro', 'review', 'demo']",
    "limit": "The exchange proof requires equal-value maximum count and one room. Revenue weights or multiple rooms change the problem contract.",
    "mistakes": [
      "The exchange proof requires equal-value maximum count and one room. Revenue weights or multiple rooms change the problem contract.",
      "Verify the contract and base cases before extending this fixture to production inputs."
    ],
    "takeaways": [
      "Define compatibility and the optimization target: Represent meetings as half-open intervals [start,finish), with start strictly less than finish.",
      "Separate the proof from plausible heuristics: Earliest start can select a long meeting that blocks many short ones."
    ],
    "practice": [
      "Which interval order supports maximum-count one-room scheduling?|Increasing finish time|Increasing start time only|Decreasing duration|Decreasing name length|Earliest finish leaves at least as much time for the remaining compatible suffix.",
      "For half-open intervals, are [1,3) and [3,5) compatible?|Yes, their occupied times do not overlap|No, sharing any boundary always conflicts|Only when durations differ|Only when labels are identical|The end boundary is excluded, so a meeting may begin exactly when another ends.",
      "Bookings [0,8),[0,2),[2,4),[4,6) all have equal value. What count does earliest finish accept?|3|1|2|4|The three short adjacent bookings fit while the long booking blocks them.",
      "A booking team optimizes revenue with unequal weights. What must be reconsidered?|The maximum-count greedy proof|Whether intervals can be sorted|Whether starts have numeric values|Whether one room exists|An exchange preserving count need not preserve total weight, so weighted scheduling needs another argument or algorithm.",
      "An optimal schedule starts with o and greedy g finishes no later. Why can o be replaced by g?|Later meetings remain compatible|Every meeting has the same start|The replacement makes all gaps zero|The room count increases|Ending earlier cannot invalidate later start constraints, and the number accepted stays unchanged.",
      "A service treats touching intervals as conflicting. Which comparison changes?|Require start greater than prior finish|Require finish less than start|Sort by name instead of finish|Accept every interval with equal endpoints|The compatibility boundary changes from start>=finish to strict inequality under a closed-boundary conflict policy."
    ],
    "formal": [
      "What is an exchange argument used to establish?|A safe local choice preserves an optimum|Every local heuristic is optimal|Sorting is always unnecessary|All feasible schedules have equal count|The proof transforms an optimum to include the greedy choice without reducing objective value.",
      "What is the total comparison bound when unsorted intervals are sorted first?|O(n log n)|O(n) guaranteed|O(log n)|O(n factorial)|The sorting phase dominates the single linear compatibility scan.",
      "Which objective is directly solved by earliest-finish interval selection?|Maximum accepted count in one room|Maximum weighted revenue always|Minimum total task duration always|Maximum number of simultaneous rooms|The exchange proof preserves the number of equal-value compatible intervals.",
      "A room has [0,5),[1,2),[2,3),[3,4). Earliest-start selection begins with which problematic booking?|[0,5)|[1,2)|[2,3)|[3,4)|The earliest-start long booking blocks three mutually compatible shorter meetings.",
      "A schedule\u2019s first optimal interval finishes at 9 and greedy\u2019s finishes at 6. What is preserved by exchanging them?|Feasibility of all later intervals|Every interval\u2019s revenue|The original first interval\u2019s identity|A guarantee of no idle time|Any later interval starting at or after nine also starts after six, so it remains compatible.",
      "A team claims shortest-duration-first always works. Which fixture refutes it?|[0,4),[4,8),[3,5)|[0,1),[1,2),[2,3)|[0,5) alone|Three disjoint equal-length intervals|The short central [3,5) blocks both compatible outer intervals, yielding one rather than two.",
      "A system already stores intervals in finish order. What work remains for greedy selection?|One linear scan|A mandatory quadratic search|Enumerating every subset|Sorting by all start permutations|The algorithm only needs to test compatibility once per interval after finish ordering is available.",
      "An interval list contains finish earlier than start. What should preprocessing do?|Validate the interval contract|Silently accept it as a free booking|Treat it as a negative room count|Move it to every accepted schedule|The interval model assumes valid start-finish ordering and must not rely on malformed times.",
      "A reviewer uses a sample with three successful meetings as proof of greedy optimality. What evidence is still needed?|A general exchange proof|A larger screenshot of that sample|The names of the three meetings|A faster timer on the same fixture|Concrete outputs check examples, while the exchange argument covers all valid inputs under the model.",
      "A booking engine needs maximum count for half-open, equal-value intervals with O(n log n) preprocessing. Which specification and proof align?|Sort finishes; exchange the first optimal booking|Sort starts; assume fewer gaps implies optimum|Pick greatest value; ignore the equal-value premise|Enumerate subsets; claim the scan is linear|Finish order and the replace-first exchange establish optimal count, with sorting plus a linear selection scan."
    ]
  },
  {
    "slug": "counterexamples",
    "title": "Reject unsafe greedy rules with coin-change counterexamples",
    "intro": "A vending system must return an exact amount using the fewest coins. Taking the largest affordable denomination works in some currency systems but fails for arbitrary configured denominations. A small adversarial instance can invalidate a universal greedy claim.",
    "sections": [
      [
        "Feasibility does not imply optimality",
        "For unlimited positive integer denominations, largest-first repeatedly takes the greatest coin not exceeding the remaining amount. Every chosen coin reduces the remainder, but the process can get stuck if the available coins cannot represent the remainder. Even when a unit coin guarantees termination, the returned count may not be minimal. With denominations 1,3,4 and amount 6, largest-first returns 4+1+1 while 3+3 uses fewer coins.",
        "An invalid greedy theorem is refuted by one valid counterexample. To search systematically, enumerate small amounts, compare greedy output against a trusted exhaustive or DP oracle, and retain the smallest failing case. This experiment finds defects but agreement over a finite range does not prove correctness for all amounts. The proof obligation depends on denomination structure, not on how many random tests passed."
      ],
      [
        "State resource and objective variants precisely",
        "Unlimited coin supply differs from bounded inventory: taking an available large coin can consume stock needed for another request, and an unlimited-supply DP cannot model counts without extending its state. Minimizing coin count also differs from minimizing handling cost when denominations have different per-coin costs. Reject zero and negative denominations because they can prevent progress or create unbounded behavior.",
        "For amount A and d denominations, the oracle dp[a]=1+min dp[a-c] over valid coins computes minimum count in O(Ad) time and O(A) space, with dp[0]=0 and infinity for impossible amounts. This is pseudo-polynomial in numeric amount rather than polynomial in the number of bits representing A. The fixture compares a greedy candidate to the oracle and displays the counterexample directly."
      ]
    ],
    "problem": "Reject unsafe greedy rules with coin-change counterexamples on a synthetic business fixture.",
    "steps": [
      "State the input contract and identify the invariant that must hold before each operation.",
      "Execute the fixture and follow each update using the displayed representation.",
      "Compare the result against the expected output and derive costs under the stated operation model."
    ],
    "code": "coins=[1,3,4]; amount=6\nremaining=amount; used=[]\nfor coin in sorted(coins,reverse=True):\n    while remaining>=coin: used.append(coin); remaining-=coin\ndp=[0]+[float(\"inf\")]*amount\nfor a in range(1,amount+1):\n    dp[a]=min((1+dp[a-c] for c in coins if c<=a),default=float(\"inf\"))\nprint(used)\nprint(dp[amount])",
    "expect": "[4, 1, 1]\n2",
    "limit": "The DP oracle assumes unlimited positive integer coins and a bounded numeric amount. A finite test range cannot establish a universal denomination theorem.",
    "mistakes": [
      "The DP oracle assumes unlimited positive integer coins and a bounded numeric amount. A finite test range cannot establish a universal denomination theorem.",
      "Verify the contract and base cases before extending this fixture to production inputs."
    ],
    "takeaways": [
      "Feasibility does not imply optimality: For unlimited positive integer denominations, largest-first repeatedly takes the greatest coin not exceeding the remaining amount.",
      "State resource and objective variants precisely: Unlimited coin supply differs from bounded inventory: taking an available large coin can consume stock needed for another request, and an unlimited-supply DP cannot model counts without extending its state."
    ],
    "practice": [
      "What does one valid greedy counterexample establish?|The universal correctness claim is false|Every greedy algorithm is false|The DP oracle is necessarily wrong|The problem has no feasible solution|A universal statement is refuted by any valid input on which its claimed optimality fails.",
      "For coins 1,3,4 and amount 6, what is an optimal coin count?|2|3|4|6|Two coins of value three beat the largest-first combination four plus one plus one.",
      "Which coin input violates the positive-denomination progress assumption?|A zero-valued coin|A unit-valued coin|A coin larger than the amount|Two distinct positive coin values|A zero coin need not reduce the remainder and invalidates the progress argument.",
      "A product tests largest-first on amounts up to 100 and finds no failure. What conclusion is justified?|Only tested cases agree|Correctness for every amount is proved|Bounded stock is now supported|Time complexity becomes constant|Finite testing establishes evidence for that range, not a general proof over all amounts.",
      "A kiosk has one coin of each value but uses an unlimited-supply oracle. What contract is wrong?|Inventory limits are omitted|The amount must be negative|Coins cannot be sorted|Every valid combination has one coin|A bounded-inventory problem needs state or transitions that enforce available counts.",
      "A configuration has coins 4 and 6 with amount 5. What should an exact-change solver report?|No feasible exact combination|One coin of value six|A negative remaining amount accepted|Zero coins as successful change|Positive combinations of four and six cannot sum to five, so impossibility is a valid outcome."
    ],
    "formal": [
      "What base value initializes a minimum-coin amount DP?|dp[0]=0|dp[0]=1|Every state equals zero|Every state equals its denomination|An amount of zero needs no coins, providing the recurrence\u2019s reachable base case.",
      "What sentinel is suitable for an impossible minimum-count state?|Positive infinity|Negative infinity|Zero|The smallest denomination|An impossible state must not appear better than real nonnegative coin counts.",
      "What does pseudo-polynomial O(Ad) depend on?|Amount A and coin count d|Only the bit length of A|Only the number of valid outputs|The number of currency names|The state count scales with the amount\u2019s magnitude, which can be exponential in its encoding length.",
      "A kiosk uses coins 1,5,7 to return 10. Largest-first uses 7+1+1+1. Which better choice refutes optimality?|5+5|7+5|1+1|7+7|Two fives achieve the exact amount with fewer coins than the four-coin greedy result.",
      "A test harness compares greedy to an exact small-input oracle. Why retain the first failing case?|It gives a reproducible counterexample|It proves every larger amount fails|It removes the need to validate the oracle|It guarantees bounded-stock support|A small failing input isolates the violated claim and can become a regression fixture.",
      "A largest-first routine is run without a unit coin and leaves remainder 1. What status is correct?|This greedy attempt failed to make exact change|The original problem is always impossible|Rounding to zero is exact change|The remaining coin count must be negative|A stuck greedy attempt does not prove that a different combination could not represent the original amount.",
      "A planner targets amount 10^12 with only O(A) memory available in theory. What practical issue matters?|Amount-indexed storage may be infeasible|Positive coins make storage constant|The bit encoding forces only twelve states|Every DP row can be omitted without proof|Pseudo-polynomial state size can be enormous even when the amount has a compact input encoding.",
      "A handling fee differs by coin type. Which recurrence objective needs adjustment?|Minimize summed handling cost|Minimize lexical denomination names|Maximize the number of table cells|Always minimize coin count unchanged|Per-coin handling costs require weighted transitions rather than assuming every selected coin costs one unit.",
      "An oracle computes dp[a] from smaller a-c with positive c. Which evaluation order is valid?|Increasing amount order|Only descending amount order|Random order with no revisits|Only prime amounts first|Every dependency has smaller amount, so increasing order completes needed subproblems first.",
      "A cash service allows arbitrary positive denominations, unlimited stock and exact change; a finite test reveals greedy failures. Which robust bounded-amount design fits?|Amount DP with impossible-state handling and oracle tests|Largest-first plus a claim based on many passing cases|Round every leftover remainder down to zero|Reuse a bounded-stock table while ignoring stock values|The recurrence explores every last-coin choice, represents impossibility and can validate greedy candidates within a clearly bounded amount budget."
    ]
  },
  {
    "slug": "fractional",
    "title": "Match value-density greedy reasoning to divisibility",
    "intro": "A logistics buyer can purchase divisible bulk materials up to a transport capacity. Taking the greatest value per weight first is optimal only because partial quantities are legal and value scales linearly with quantity.",
    "sections": [
      [
        "Derive the exchange per unit capacity",
        "For item i with positive weight wi and nonnegative value vi, define density ri=vi/wi. In fractional knapsack choose xi between zero and one to maximize sum vi*xi subject to sum wi*xi<=W. Sort density descending, take each item fully while it fits, then take the fraction that fills remaining capacity. Zero-weight items require separate treatment before any division.",
        "If a feasible solution allocates positive capacity to a lower-density item while a higher-density item remains partly unused, move a small weight delta from the former to the latter. Feasibility is preserved and value changes by delta*(rhigh-rlow)>=0. Repeating exchanges yields the greedy density order. This proof depends on arbitrary divisibility; it does not permit exchanging fractions of indivisible machines."
      ],
      [
        "Contrast fractional and zero-one decisions",
        "In 0/1 knapsack xi must be zero or one. With capacity 50 and items (weight,value) (10,60),(20,100),(30,120), density greedy takes the first two for value 160, while the last two fit exactly for value 220. Fractional greedy can take part of the third item and reaches 240. These are different feasible sets, so a proof for one does not transfer to the other.",
        "Sorting gives O(n log n) comparisons and the allocation scan takes O(n). Floating-point densities can obscure exact ordering near ties; compare rational values with cross multiplication when values are exact integers and overflow is controlled. Python integers grow rather than wrapping, but multiplication then has a bit-cost dependent on magnitude. The fixture uses fractions to state the fractional amount and objective exactly."
      ]
    ],
    "problem": "Match value-density greedy reasoning to divisibility on a synthetic business fixture.",
    "steps": [
      "State the input contract and identify the invariant that must hold before each operation.",
      "Execute the fixture and follow each update using the displayed representation.",
      "Compare the result against the expected output and derive costs under the stated operation model."
    ],
    "code": "from fractions import Fraction\nitems=[(10,60),(20,100),(30,120)]; capacity=50; value=Fraction(0)\nfor weight,worth in sorted(items,key=lambda x:Fraction(x[1],x[0]),reverse=True):\n    take=min(Fraction(1),Fraction(capacity,weight))\n    value+=take*worth; capacity-=take*weight\n    if capacity==0: break\nprint(value)\nprint(100+120)",
    "expect": "240\n220",
    "limit": "Fractional density greedy is not a solver for indivisible 0/1 selection. Exact rational arithmetic has representation costs beyond a constant-time numeric model.",
    "mistakes": [
      "Fractional density greedy is not a solver for indivisible 0/1 selection. Exact rational arithmetic has representation costs beyond a constant-time numeric model.",
      "Verify the contract and base cases before extending this fixture to production inputs."
    ],
    "takeaways": [
      "Derive the exchange per unit capacity: For item i with positive weight wi and nonnegative value vi, define density ri=vi/wi.",
      "Contrast fractional and zero-one decisions: In 0/1 knapsack xi must be zero or one."
    ],
    "practice": [
      "What ratio orders fractional knapsack items?|Value divided by weight|Weight divided by item count|Name length divided by value|Arrival time divided by capacity|Value density measures the benefit gained per unit of scarce capacity.",
      "Which variable range defines fractional selection?|0<=x<=1|x is only zero or one|x must exceed one|x must be negative|Fractional items allow any partial amount from none through the full available item.",
      "Capacity is 5 and a divisible item weighs 10 with value 30. What value can half the item provide?|15|30|5|60|Linear divisibility gives one half of both weight and value, so five weight yields value fifteen.",
      "A purchase involves indivisible machines. Which density-greedy proof step fails?|Exchanging fractional portions|Sorting numeric values|Comparing two ratios|Recording the available capacity|The exchange may require fractions that are not legal choices under the indivisible contract.",
      "A ratio implementation receives weight zero. What preprocessing is required?|Handle that item before dividing|Divide and round toward zero|Give it an arbitrary negative ratio|Discard every other positive item|The density formula divides by weight and needs explicit handling of zero-weight inputs.",
      "A financial planner uses exact integer values but almost equal densities. What comparison avoids floating rounding?|Compare cross products exactly|Round every density to an integer|Sort only by item labels|Assume all near ties are equal|Comparing v1*w2 and v2*w1 preserves exact rational ordering when integer arithmetic is exact."
    ],
    "formal": [
      "What resource does fractional knapsack constrain?|Total selected weight|Number of source-code lines|Sum of item identifiers|Length of the sorted label list|The optimization permits partial choices while bounding the weighted total by capacity.",
      "Why does a density exchange never reduce value when replacing lower density?|Delta times density difference|Every item has identical weight|Capacity becomes unlimited|The number of items must double|Moving equal weight to a no-lower-density item preserves feasibility and does not decrease objective value.",
      "What phase dominates the basic unsorted fractional algorithm?|Sorting by density|Enumerating all subsets|Building an amount table for every bit|Recursively visiting every permutation|Density ordering costs O(n log n), followed by a linear allocation pass.",
      "A bulk buyer shifts two units of weight from density 3 to density 5. What is the value change?|Increase by 4|Decrease by 4|Increase by 10|No change|The change is two times the difference five minus three, which equals four.",
      "A capacity-50 zero-one request has (10,60),(20,100),(30,120). Which selection has value 220?|The weight-20 and weight-30 items|The weight-10 and weight-20 items|Only the weight-30 item|All three full items|The latter two fit exactly at weight fifty and sum to value two hundred twenty.",
      "A fractional planner fills capacity after taking part of one item. What should it do next?|Stop, because no capacity remains|Take every lower-density item fully|Reset the remaining capacity|Round the partial item up to full|Once capacity is exhausted, further positive-weight selection would violate feasibility.",
      "A zero-one implementation returns the fractional optimum 240 for the capacity-50 fixture. What error is likely?|It admitted an illegal partial item|It sorted values into ascending order|It rejected all positive weights|It modeled an empty capacity|The fractional upper bound can exceed the best feasible indivisible choice because it uses partial quantities.",
      "A proof compares benefit per unit weight but item value is nonlinear in quantity. What assumption fails?|Constant density under division|The existence of item labels|The need for a capacity variable|The ability to list candidate items|Nonlinear value means exchanging equal weight need not change value by a fixed density difference.",
      "A Python implementation uses huge integer cross products. Which cost-model caveat is sound?|Big-integer multiplication has bit costs|All arithmetic wraps to a signed byte|Exact integers forbid comparison|Cross products always need constant memory|Python integer operation costs depend on operand magnitude, so constant-time numeric models require bounded sizes.",
      "A procurement service must maximize linear value of divisible positive-weight goods, support exact rational prices and fit O(n) allocation output. Which plan has a matching proof?|Sort exact densities and fill capacity by exchanges|Use density greedy for indivisible machines without review|Round densities to names and fill alphabetically|Enumerate every fractional real number as a candidate|Divisibility and linear value justify density exchanges; exact ordering and one pass after sorting produce the feasible optimum."
    ]
  },
  {
    "slug": "memoization",
    "title": "Define a memoized state that captures every future choice",
    "intro": "A recursive optimizer often reaches the same remaining decision repeatedly through different histories. Memoization shares the result only when the cached state fully determines the future feasible choices and objective.",
    "sections": [
      [
        "State is a mathematical subproblem, not a convenient cache key",
        "For a simple staircase with one- or two-step moves, ways(n)=ways(n-1)+ways(n-2), ways(0)=1 and ways(n<0)=0. Multiple recursive paths reach the same remaining n, so memoization computes each distinct n once. A cache key is valid because the allowed moves and goal remain fixed and the future answer depends only on remaining steps.",
        "For knapsack, remaining capacity alone is insufficient when only some items remain available. The state must also identify the item index or equivalent remaining set. Similarly, a path search with restrictions on already visited vertices cannot generally cache only the current vertex. Two histories may reach the same vertex with different legal continuations. Omitting relevant state yields fast but incorrect reuse."
      ],
      [
        "Count states and transitions separately",
        "Without caching, the staircase recursion has overlapping branches and exponentially many calls. With caching there are O(n) distinct nonnegative states and O(1) outgoing recurrence terms per state, giving O(n) arithmetic operations. Cache storage and worst-case recursive stack depth are O(n). Large counts have increasing bit lengths, so the arithmetic-operation count is distinct from full bit complexity.",
        "A top-down implementation can avoid unreachable states, but recursion depth still threatens large n. Cache lifetime matters when rates, denominations or item data change: either include configuration in the key or create a fresh solver cache for each immutable configuration. The fixture counts cache misses to verify reuse on a small input; it does not infer the asymptotic bound from elapsed time."
      ]
    ],
    "problem": "Define a memoized state that captures every future choice on a synthetic business fixture.",
    "steps": [
      "State the input contract and identify the invariant that must hold before each operation.",
      "Execute the fixture and follow each update using the displayed representation.",
      "Compare the result against the expected output and derive costs under the stated operation model."
    ],
    "code": "from functools import cache\ncalls=0\n@cache\ndef ways(n):\n    global calls\n    calls+=1\n    if n<0: return 0\n    if n==0: return 1\n    return ways(n-1)+ways(n-2)\nprint(ways(6))\nprint(calls)\nprint(ways(6),calls)",
    "expect": "13\n8\n13 8",
    "limit": "Eight computed states include -1 and 0 through 6. Memoization removes repeated states but does not remove the linear recursive-depth requirement.",
    "mistakes": [
      "Eight computed states include -1 and 0 through 6. Memoization removes repeated states but does not remove the linear recursive-depth requirement.",
      "Verify the contract and base cases before extending this fixture to production inputs."
    ],
    "takeaways": [
      "State is a mathematical subproblem, not a convenient cache key: For a simple staircase with one- or two-step moves, ways(n)=ways(n-1)+ways(n-2), ways(0)=1 and ways(n<0)=0.",
      "Count states and transitions separately: Without caching, the staircase recursion has overlapping branches and exponentially many calls."
    ],
    "practice": [
      "What condition makes two recursive calls share a cached answer safely?|Their states determine the same future problem|Their call times are close|Their variable names have equal length|They return the same value once by chance|A valid state includes every fact that affects legal future choices or the objective.",
      "What does overlapping subproblems mean?|Repeated equivalent states|Every recursive call has different input|All subproblems use disjoint memory|Only the base case has an answer|Repeated equivalent states create opportunities for memoized result reuse.",
      "For one- or two-step climbing with ways(0)=1, what is ways(3)?|3|2|4|1|The sequences 1+1+1, 1+2 and 2+1 are the three ordered ways.",
      "A knapsack cache stores only capacity while the remaining item index changes. What can go wrong?|Reusing different item sets|The cache necessarily becomes empty|Every answer doubles exactly|No recursive base case is needed|Equal capacity does not imply the same problem when different items remain eligible.",
      "A memoized solver captures mutable price data that changes between calls. What cache policy is safe?|Invalidate or key the configuration version|Assume cached values update themselves|Retain old answers indefinitely|Change only the display labels|Answers depend on prices, so configuration changes must be reflected in cache identity or lifetime.",
      "A top-down DP has only O(n) distinct states but very deep recursion. What resource can still fail?|The language call stack|The declared input label count|The four-option quiz format|The existence of base cases|Memoization reduces repeated computation but does not automatically bound call depth below the runtime limit."
    ],
    "formal": [
      "What does a memoization cache map?|Subproblem state to solved result|Every output to a random input|Only line numbers to exceptions|Every call time to the source filename|The cache reuses an already solved result for an equivalent future subproblem state.",
      "What must every terminating recursive DP provide?|Base cases and progress toward them|An unbounded self-call with unchanged state|A random restart after each cache hit|A different programming language per state|Memoization alone does not cure a cycle of unresolved calls; recurrence dependencies must reach solved bases.",
      "How is a standard DP operation bound derived?|States times work per state|Only measured duration of one run|Number of source-code characters|Largest answer position in a quiz|Counting distinct states and the transitions or work for each gives a general cost derivation.",
      "A staircase solver recomputes ways(4) from both ways(5) and ways(6). What optimization shares that result?|Memoize remaining-step state|Sort every returned integer|Remove the zero-step base case|Use a different variable name|Equivalent remaining-step subproblems have the same answer and can be cached once.",
      "A restricted route solver caches only node u despite different visited sets. Why is this unsafe?|Visited history limits routes|Every node has the same name|All graphs are acyclic|Caches cannot use integer keys|When revisits are forbidden, the visited set affects the remaining feasible routes and belongs in the state.",
      "A cached recurrence has 200 states and at most 5 constant-cost transitions per state. What operation bound model applies?|O(200 times 5) for those states|O(2 to the power 200) necessarily|O(1) because caching exists|O(200 factorial) necessarily|Each distinct state evaluates only its bounded set of transitions once, excluding lookup and arithmetic magnitude caveats.",
      "A new demand forecast changes the horizon and tariffs but reuses an unversioned global cache. What is the likely correctness defect?|Stale answers for changed future costs|Every result becomes unreachable|All recursion automatically becomes breadth first|The state count must be zero|Cached subproblem answers no longer correspond to the new immutable problem configuration.",
      "A top-down solver explores only reachable states in a sparse state graph. What benefit can it have over a full rectangular table?|Avoiding unused states|Eliminating all transition costs|Proving every greedy choice correct|Guaranteeing constant stack depth|Demand-driven recursion can skip states that no valid decision sequence reaches.",
      "An arbitrary-precision counting DP has O(n) additions but huge results. What should a complexity note distinguish?|Arithmetic-operation count and bit cost|Vertex count and meeting labels|Source line count and font size|Question difficulty and answer order|Big-integer additions become more expensive as result bit length grows, beyond a unit-cost arithmetic model.",
      "A solver revisits the same capacity with different item prefixes, uses mutable prices and must serve repeated configurations. Which memoization design preserves correctness?|Key item position, capacity and immutable configuration|Key only capacity and keep old global results|Cache only the most recent numeric answer|Ignore item availability when a cache hit exists|The cache identity must distinguish every fact affecting future choices, including remaining items and price configuration."
    ]
  },
  {
    "slug": "tabulation",
    "title": "Evaluate a recurrence in dependency order",
    "intro": "A support team counts valid processing schedules for a fixed number of steps. Bottom-up dynamic programming turns a recursive dependency graph into an ordered table computation with explicit initialization and no recursive stack.",
    "sections": [
      [
        "Read the dependency graph before choosing loop order",
        "For step counts, dp[0]=1 and dp[i]=dp[i-1]+dp[i-2] with out-of-range terms contributing zero. Increasing i is valid because both dependencies have already been computed. The empty solution often has count one rather than zero: it acts as the neutral completed prefix from which nonempty choices extend. For minimum-cost problems, the neutral base cost is zero and impossible states use positive infinity instead.",
        "An evaluation order must be topological with respect to state dependencies. Merely writing nested loops does not guarantee correctness. In an amount DP with positive coin sizes, smaller amounts precede larger amounts. In a two-index sequence recurrence, dependencies may require earlier rows and columns. A cyclic recurrence needs additional methods; filling a table once in arbitrary order cannot generally solve it."
      ],
      [
        "Count combinations and sequences using different transition meanings",
        "For unlimited coin values, looping amounts outside and coins inside counts ordered sequences: 1+2 and 2+1 arise from different final choices. Looping coin types outside and amounts increasing inside counts combinations, because each type is introduced in one fixed order. Both programs can use addition and the same dp[0]=1 yet answer different business questions. Define whether order matters before selecting loops.",
        "For d coins and amount A, both one-dimensional counting variants take O(Ad) arithmetic operations and O(A) table entries. The answer values can have many bits. The fixture compares amount 4 with coins 1 and 2: five ordered sequences exist but only three multisets. This is an algorithm trace explaining semantics rather than an interchangeable coding style."
      ]
    ],
    "problem": "Evaluate a recurrence in dependency order on a synthetic business fixture.",
    "steps": [
      "State the input contract and identify the invariant that must hold before each operation.",
      "Execute the fixture and follow each update using the displayed representation.",
      "Compare the result against the expected output and derive costs under the stated operation model."
    ],
    "code": "coins=[1,2]; amount=4\nsequences=[1]+[0]*amount\nfor a in range(1,amount+1):\n    for c in coins:\n        if c<=a: sequences[a]+=sequences[a-c]\ncombinations=[1]+[0]*amount\nfor c in coins:\n    for a in range(c,amount+1): combinations[a]+=combinations[a-c]\nprint(sequences)\nprint(combinations)",
    "expect": "[1, 1, 2, 3, 5]\n[1, 1, 2, 2, 3]",
    "limit": "Loop ordering changes the counted object. Neither variant enforces bounded inventory; both allow unlimited occurrences of each positive coin type.",
    "mistakes": [
      "Loop ordering changes the counted object. Neither variant enforces bounded inventory; both allow unlimited occurrences of each positive coin type.",
      "Verify the contract and base cases before extending this fixture to production inputs."
    ],
    "takeaways": [
      "Read the dependency graph before choosing loop order: For step counts, dp[0]=1 and dp[i]=dp[i-1]+dp[i-2] with out-of-range terms contributing zero.",
      "Count combinations and sequences using different transition meanings: For unlimited coin values, looping amounts outside and coins inside counts ordered sequences: 1+2 and 2+1 arise from different final choices."
    ],
    "practice": [
      "What must a bottom-up evaluation order respect?|The recurrence\u2019s dependency order|Alphabetical variable names|The largest final answer first|Random row selection|Each needed predecessor must already be solved when a state is evaluated.",
      "Why does a counting recurrence often use dp[0]=1?|There is one empty construction|An empty construction costs one coin|Every state must start at one|Zero amounts are invalid|The empty construction supplies the valid neutral prefix from which first choices are extended.",
      "Using steps 1 and 2, how many ordered ways make total 4?|5|3|4|2|The five sequences are 1111,112,121,211 and 22, so order matters.",
      "A billing DP counts 1+2 and 2+1 separately, but the product wants unordered bundles. What needs revision?|State transitions and loop semantics|Only the table\u2019s print format|Only the final numeric data type|The order of question options|Counting sequences differs from counting multisets and requires a different enumeration discipline.",
      "A table reads dp[i-1] before that cell is computed. What proof condition fails?|Predecessor completion|The ability to allocate arrays|Every answer being nonnegative|The existence of variable i|Bottom-up correctness assumes all dependencies are valid solved values before the current update.",
      "A minimum-cost table initializes every state to zero. What bug can appear?|Impossible states look free|Every path is automatically optimal|The source base case disappears from memory|All amounts become negative|Unreachable non-base states need an impossible sentinel rather than a valid zero cost."
    ],
    "formal": [
      "What does amount-outer, coin-inner counting normally distinguish?|Different orderings of chosen coins|Only unordered denomination counts|Only solutions using every coin once|Only the largest denomination|Each final-coin choice extends all smaller ordered sequences, counting different orders separately.",
      "What does coin-outer, increasing-amount counting normally count?|Unordered unlimited-coin combinations|Every permutation of each multiset|Only zero-one selections|Only single-coin solutions|Introducing denominations in a fixed outer order gives each multiset one generation path.",
      "What table storage is used by a one-dimensional amount DP?|O(A)|O(A factorial)|O(log A) necessarily|O(1) for all variants|The array has one entry for every amount from zero through A.",
      "A store offers unlimited bundle sizes 1 and 2. How many unordered bundles total 4?|3|5|4|2|The combinations are four ones, two ones plus one two, and two twos.",
      "A schedule counter has dp[i]=dp[i-1]+dp[i-2]. Which loop direction satisfies its dependencies?|Increasing i|Decreasing i without saved prior values|Only even i|A random permutation of i|Both smaller indexes must already hold completed counts when computing i.",
      "A bounded-stock product reuses increasing-amount unlimited-coin updates. What can it allow illegally?|Repeated use beyond inventory|Only the empty solution|Negative coin denominations|No use of any coin|Increasing amount can reuse the same denomination in the current pass, so stock limits require a different state or update.",
      "A reviewer swaps the two counting loops without redefining the objective. Why is this risky?|It changes whether order is counted|It only changes whitespace|It always preserves every answer|It removes the need for a base case|Loop nesting defines which decisions may be revisited and whether arrangements have distinct construction paths.",
      "A count table uses large arbitrary-precision integers. What bound needs an explicit caveat?|O(Ad) counts arithmetic operations|O(Ad) means each answer fits a byte|Every addition is free|The input amount has no encoding length|The operation count does not by itself include the growing bit cost of exact large-count arithmetic.",
      "A recurrence has a genuine circular dependency among unresolved states. Can one arbitrary forward pass generally solve it?|No, dependency handling must change|Yes, assigning zero makes every cycle valid|Only if variable names are sorted|Only if the table is printed afterward|Acyclic predecessor completion is absent, so a single pass needs another valid formulation or iterative method with its own proof.",
      "A package counter must treat two denomination orders as the same bundle, use unlimited stock and fit O(A) entries. Which update discipline matches that contract?|Coin types outside, amounts increasing inside|Amounts outside with each last coin counted separately|Amounts decreasing to enforce single use per coin|Randomly shuffle both loops after every update|A fixed denomination introduction order counts each multiset once while increasing amounts permit repeated use of the active type."
    ]
  },
  {
    "slug": "space",
    "title": "Compress DP storage only after proving value lifetimes",
    "intro": "A forecasting service must fit its recurrence into a small memory budget. Many tables can discard states once no future update needs them, but compression changes which version of a value is read and can silently change the algorithm.",
    "sections": [
      [
        "A rolling window follows the dependency radius",
        "The recurrence f(i)=f(i-1)+f(i-2) needs only the previous two completed values. Maintain a=f(i-2) and b=f(i-1), compute next=a+b, then shift a,b=b,next. At the start of every iteration the pair invariant identifies the exact indexes represented. Updating a first and then computing b from the changed a can accidentally use a value twice. Simultaneous assignment or an explicit temporary preserves both old inputs.",
        "This compression reduces auxiliary numeric slots from O(n) to O(1), but outputting every value still requires O(n) output work and possibly O(n) stored output. Exact integer magnitudes may grow with n, so constant slots do not imply constant bytes. If the consumer needs an arbitrary old state or reconstruction path, discarding the table may remove required information."
      ],
      [
        "Previous row and current row are different versions",
        "For 0/1 knapsack, a one-row capacity update must run downward so dp[c-w] is still from the previous item row. Running upward makes it a current-row value and permits repeated use of the same item, turning the recurrence into an unbounded variant. For grid paths that depend on the current row\u2019s left cell and previous row\u2019s same column, increasing columns intentionally reads one old and one newly updated value.",
        "A compressed algorithm needs a liveness proof: name each read value, say which logical table version it represents, and establish that no overwritten value is needed later. The fixture shows a rolling staircase pair and contrasts upward and downward updates for one weight-two item. Its outputs demonstrate why changing loop direction changes feasible item reuse."
      ]
    ],
    "problem": "Compress DP storage only after proving value lifetimes on a synthetic business fixture.",
    "steps": [
      "State the input contract and identify the invariant that must hold before each operation.",
      "Execute the fixture and follow each update using the displayed representation.",
      "Compare the result against the expected output and derive costs under the stated operation model."
    ],
    "code": "a,b=1,1\nfor i in range(2,7): a,b=b,a+b\nprint(b)\nup=[0]*5; down=[0]*5\nfor c in range(2,5): up[c]=max(up[c],up[c-2]+3)\nfor c in range(4,1,-1): down[c]=max(down[c],down[c-2]+3)\nprint(up)\nprint(down)",
    "expect": "13\n[0, 0, 3, 3, 6]\n[0, 0, 3, 3, 3]",
    "limit": "Constant slot count excludes big-integer byte growth and output storage. One-row value optimization does not automatically retain a valid chosen-item reconstruction.",
    "mistakes": [
      "Constant slot count excludes big-integer byte growth and output storage. One-row value optimization does not automatically retain a valid chosen-item reconstruction.",
      "Verify the contract and base cases before extending this fixture to production inputs."
    ],
    "takeaways": [
      "A rolling window follows the dependency radius: The recurrence f(i)=f(i-1)+f(i-2) needs only the previous two completed values.",
      "Previous row and current row are different versions: For 0/1 knapsack, a one-row capacity update must run downward so dp[c-w] is still from the previous item row."
    ],
    "practice": [
      "What justifies a two-value rolling recurrence?|Only two prior values stay live|Every DP is inherently constant space|Old values are always zero|Tables have no reconstruction uses|A dependency-lifetime proof shows older values will never be read again.",
      "Why use simultaneous assignment when shifting two DP values?|Preserve both old inputs|Sort every output numerically|Force the answer to stay small|Remove every base case|The next value must use the old pair rather than an already overwritten component.",
      "One zero-one item weighs 2 and is worth 3 with capacity 4. What is the correct maximum value?|3|6|4|0|The single item may be selected at most once, regardless of unused remaining capacity.",
      "A one-row zero-one knapsack loops capacity upward. What illegal behavior may occur?|Reusing the same item repeatedly|Discarding all existing item values|Changing capacity into item count|Forcing every item weight to zero|A current-row predecessor can already include this item, so the update may take it again.",
      "A compressed recurrence uses two slots containing enormous integers. What does O(1) slots fail to guarantee?|Constant byte storage|A fixed number of variables|A defined recurrence|The ability to add values|The number of bits per stored integer may grow even when the slot count stays fixed.",
      "A product now needs the selected-item list, but only final values were stored. What must be reconsidered?|Reconstruction state or recomputation|Only the output font|Whether numeric addition is allowed|The existence of item names|Discarded predecessor decisions may be necessary to recover a valid optimal selection."
    ],
    "formal": [
      "What is the key question before overwriting a DP cell?|Is the old version still needed?|Is the variable name short?|Has the current line run before?|Is the answer option first?|Storage compression is valid only when overwritten logical state is no longer live.",
      "Which capacity direction preserves previous-item state in zero-one knapsack?|Descending capacity|Ascending capacity|Only capacity zero|Random capacities without revisits|A smaller capacity has not yet been updated for the current item during the descending pass.",
      "What distinguishes auxiliary space from output storage?|Output may grow even when working state is small|Output is always free|Auxiliary space includes every past database|Output never contains DP values|A rolling solver can use few working slots while a requested full sequence still needs linear output.",
      "A rolling pair before iteration i stores f(i-2),f(i-1). What is the next pair after a correct update?|f(i-1),f(i)|f(i),f(i)|f(i-2),f(i)|f(i+1),f(i+2)|Shifting keeps the most recent two completed recurrence values for the next iteration.",
      "A grid recurrence reads above and left while updating left to right in one row. Which versions are used?|Old above and new left|Two old previous-row left values|Two arbitrary future cells|Only the untouched last column|The current cell retains the previous row until overwritten, while the left cell already holds the current row.",
      "A one-row update at c reads dp[c-w] after it was updated for the same item. Which variant does this support?|Unbounded item reuse|Strict zero-one use|Exactly one item total|No item choices at all|The predecessor can include the current item, permitting another copy in the same pass.",
      "A team states rolling Fibonacci has constant memory in bytes for arbitrary n. What correction is needed?|Constant slots, growing bit sizes|Linear slots are always mandatory|All values fit in one fixed byte|No recurrence can be compressed|Exact Fibonacci-like counts grow in bit length, so a constant number of values still occupies increasing bytes.",
      "A forecast API emits all n DP values to a client. Can it claim O(1) total output size?|No, n values must be emitted|Yes, rolling state compresses network output|Only if values are positive|Only if no list is allocated|Working-memory compression does not eliminate the requested output volume.",
      "A compressed solver returns a wrong result only after loop order changes. What is the most useful review artifact?|An old/new value-read trace|A timing screenshot alone|A list of variable name lengths|A new course title|Tracing which table version each read denotes exposes accidental reuse or premature overwriting.",
      "An item planner has O(W) value storage, zero-one availability and no need to reconstruct choices. Which implementation preserves the two-row recurrence?|For each item, scan capacity downward|For each item, scan upward and reuse current-row values|Scan random capacities until values look stable|Retain only the global maximum without capacity state|Descending capacity keeps every transition\u2019s predecessor in the previous-item version while reducing value storage to one row."
    ]
  },
  {
    "slug": "knapsack",
    "title": "Solve zero-one knapsack and reconstruct a feasible optimum",
    "intro": "A maintenance planner selects indivisible upgrades subject to a budget. Each upgrade may be chosen once. A state containing both item prefix and remaining capacity prevents accidental reuse and supports a precise skip-or-take recurrence.",
    "sections": [
      [
        "Derive the two choices from the last item",
        "Let dp[i][c] be the best total value using the first i items with total weight at most c. The base row dp[0][c]=0 represents choosing nothing. For item i with weight w and value v, skip gives dp[i-1][c]. If w<=c, take gives dp[i-1][c-w]+v. Their maximum is optimal because every feasible selection either excludes the item or includes it once and leaves a valid previous-prefix subproblem.",
        "Using at-most capacity matters: zero is a legitimate empty selection for every c. Exact-fill variants need unreachable sentinels for positive capacities in the base row. Nonnegative integer capacity makes an indexed table possible. If weights are real measurements, discretization introduces a modeling decision and potential feasibility error rather than being a harmless type conversion."
      ],
      [
        "Reconstruct using the same row semantics",
        "Starting at i=n,c=W, compare dp[i][c] to dp[i-1][c]. If equal, skipping is consistent with an optimum. Otherwise the item was taken in the chosen optimum; record it and reduce c by w. Always decrement i, so no item can be emitted twice. Ties can yield multiple optimal selections and a deterministic policy should be specified if users need repeatable output.",
        "There are (n+1)(W+1) states and constant skip/take work per state, giving O(nW) time and O(nW) table storage for this reconstruction. One-row values can reduce storage to O(W), but reconstruction needs additional design. W is a numeric bound, so the algorithm is pseudo-polynomial. The fixture prints both the optimum and a legal item set, then checks total selected weight against the budget."
      ]
    ],
    "problem": "Solve zero-one knapsack and reconstruct a feasible optimum on a synthetic business fixture.",
    "steps": [
      "State the input contract and identify the invariant that must hold before each operation.",
      "Execute the fixture and follow each update using the displayed representation.",
      "Compare the result against the expected output and derive costs under the stated operation model."
    ],
    "code": "items=[(\"A\",2,3),(\"B\",3,4),(\"C\",4,5)]; W=5\ndp=[[0]*(W+1) for _ in range(len(items)+1)]\nfor i,(name,w,v) in enumerate(items,1):\n    for c in range(W+1):\n        dp[i][c]=dp[i-1][c]\n        if w<=c: dp[i][c]=max(dp[i][c],dp[i-1][c-w]+v)\nchosen=[]; c=W\nfor i in range(len(items),0,-1):\n    if dp[i][c]!=dp[i-1][c]:\n        name,w,v=items[i-1]; chosen.append(name); c-=w\nprint(dp[-1][W])\nprint(list(reversed(chosen)))",
    "expect": "7\n['A', 'B']",
    "limit": "This table solves at-most integer capacity with each listed item available once. Exact-fill, bounded multiplicities and real-weight precision require different contracts.",
    "mistakes": [
      "This table solves at-most integer capacity with each listed item available once. Exact-fill, bounded multiplicities and real-weight precision require different contracts.",
      "Verify the contract and base cases before extending this fixture to production inputs."
    ],
    "takeaways": [
      "Derive the two choices from the last item: Let dp[i][c] be the best total value using the first i items with total weight at most c.",
      "Reconstruct using the same row semantics: Starting at i=n,c=W, compare dp[i][c] to dp[i-1][c]."
    ],
    "practice": [
      "What does dp[i][c] represent in prefix zero-one knapsack?|Best value using first i items within c|Best value using every item repeatedly|The exact number of sorted items|The earliest finish time of item c|The item prefix encodes availability and the capacity bounds the selected total weight.",
      "Which row supplies a taken item\u2019s predecessor value?|The previous item row|The current item row after reuse|The final row regardless of i|A randomly selected row|Taking item i once leaves a subproblem that cannot include that same item again.",
      "Items (2,3),(3,4),(4,5) fit capacity 5. What is the optimum value?|7|8|9|5|The first two items weigh five and give seven, beating the single weight-four item.",
      "An exact-fill solver sets every positive-capacity base state to zero. What can it admit?|Underfilled selections|Only negative-weight items|No empty prefix at all|Every item exactly once|Zero base values incorrectly treat unfilled capacity as reachable under an exact-fill contract.",
      "A reconstruction chooses item i. Which state update prevents its reuse?|Decrement i and subtract its weight|Keep i and reset capacity upward|Only decrement the objective value|Return to the final item row|Moving to the previous prefix removes the chosen item from further availability.",
      "A warehouse models real weights by rounding downward to integers. What can be violated?|The true physical capacity limit|The existence of item identifiers|The ability to compare values|The zero-item base row|Rounding weights down may admit a selection whose true total exceeds the real capacity."
    ],
    "formal": [
      "What mathematical partition justifies skip-or-take?|Exclude or include the last item|Every optimal set has equal weight|Every item has the same value|Every feasible set uses all items|The two exhaustive cases reduce to previous-prefix subproblems without overlap in item availability.",
      "Why is O(nW) called pseudo-polynomial?|It scales with numeric capacity W|It ignores every item|It is exponential in n for all W|It depends only on log W|A capacity with few input bits can have a very large magnitude and thus a large indexed table.",
      "What does an at-most-capacity empty-prefix row contain?|Zeros for all capacities|Infinity for every capacity including zero|The capacity index as value|One copy of every item value|Choosing nothing is feasible within any nonnegative capacity and gives objective zero.",
      "An upgrade weighs 6 but current capacity is 4. Which transition is legal?|Skip the upgrade|Take it and allow negative capacity|Take half under a zero-one contract|Add its value without weight|The take branch is unavailable when the item exceeds remaining capacity.",
      "A reconstruction sees dp[i][c]=dp[i-1][c]. What choice remains optimal?|Skip item i|Take item i necessarily|Take every earlier item|Reset c to zero necessarily|The previous-prefix solution already achieves the same optimum, so skipping is consistent with a tie policy.",
      "A compressed value table is asked to produce selected item IDs. What is missing unless designed separately?|History or recomputation|The numeric capacity bound|The list of available values|The final optimum number|Final values alone may not retain which earlier row decisions produced a feasible optimal set.",
      "A budget planner has n=100 and W=10^10. What limits this DP despite modest n?|The enormous capacity state count|The count of item labels only|The fact that values are positive|The absence of a greedy ratio|Numeric-capacity indexing can be impractical when W is huge even for a small number of items.",
      "Two different selections tie for maximum value. What should a repeatable reporting API define?|A deterministic tie policy|A claim that one optimum cannot exist|A requirement to include both sets at once|A rule that changes item weights|Multiple optimal outputs are legitimate, so stable presentation needs an explicit choice policy.",
      "A checker validates only the returned value, not the returned selected IDs. What defect may escape?|An invalid selected-item list|An alphabetically unsorted course title|A missing timer screenshot|A nonempty item description|Value optimality does not ensure the emitted item list respects budget and single-use constraints.",
      "A procurement engine needs both optimal value and a legal chosen set for integer budget W, with O(nW) memory available. Which complete design fits?|Prefix-capacity table and backward row reconstruction|Density greedy followed by fractional item output|One capacity scalar with no item state|Current-row repeated takes under a zero-one label|The two-dimensional recurrence preserves item availability and its row comparisons reconstruct one feasible optimum without reusing items."
    ]
  },
  {
    "slug": "sequences",
    "title": "Compute longest common subsequences and distinguish substrings",
    "intro": "A document-comparison service wants an order-preserving shared sequence between revisions. Shared characters need not be adjacent. Longest common subsequence uses two prefix lengths to describe the remaining alignment choices.",
    "sections": [
      [
        "Derive the prefix recurrence",
        "Let L[i][j] be the length of a longest common subsequence of prefixes a[:i] and b[:j]. Empty-prefix borders are zero. If final characters match, L[i][j]=1+L[i-1][j-1]. Otherwise L[i][j]=max(L[i-1][j],L[i][j-1]). In the mismatch case, a shared subsequence cannot use both distinct final characters as the same aligned position, so at least one can be excluded.",
        "A subsequence preserves order while permitting gaps. A substring must be contiguous and uses a different recurrence: matching characters extend a diagonal run, while mismatch resets that run to zero. Reusing the LCS maximum-of-neighbors recurrence for substring length would bridge forbidden gaps. Neither recurrence alone produces a complete edit script with insertions and deletions; reconstructing alignment requires decisions and a defined tie policy."
      ],
      [
        "Preserve versioned cells during compression and reconstruction",
        "Filling increasing i and j satisfies the upper, left and diagonal dependencies. A full table costs O(mn) time and O(mn) entries. Rolling two rows reduces length-only storage to O(n), and using the shorter string as the column dimension gives O(min(m,n)) entries. One row additionally needs the old diagonal value saved before overwrite.",
        "Backtracking from L[m][n], equal characters contribute a shared symbol and move diagonally. Otherwise move to an upper or left cell with the retained optimum. Equal neighbors can permit multiple optimal subsequences. The fixture reconstructs one valid result and does not imply uniqueness. Unicode character segmentation and normalization need product decisions before a text comparison treats code points as user-perceived characters."
      ]
    ],
    "problem": "Compute longest common subsequences and distinguish substrings on a synthetic business fixture.",
    "steps": [
      "State the input contract and identify the invariant that must hold before each operation.",
      "Execute the fixture and follow each update using the displayed representation.",
      "Compare the result against the expected output and derive costs under the stated operation model."
    ],
    "code": "a=\"ABCBDAB\"; b=\"BDCABA\"\nL=[[0]*(len(b)+1) for _ in range(len(a)+1)]\nfor i,x in enumerate(a,1):\n    for j,y in enumerate(b,1):\n        L[i][j]=1+L[i-1][j-1] if x==y else max(L[i-1][j],L[i][j-1])\ni,j=len(a),len(b); out=[]\nwhile i and j:\n    if a[i-1]==b[j-1]: out.append(a[i-1]); i-=1; j-=1\n    elif L[i-1][j]>=L[i][j-1]: i-=1\n    else: j-=1\nprint(L[-1][-1])\nprint(\"\".join(reversed(out)))",
    "expect": "4\nBCBA",
    "limit": "One optimal subsequence is reconstructed under the upper-neighbor tie rule. Code-point matching is assumed, and a full edit script or grapheme-aware comparison requires more modeling.",
    "mistakes": [
      "One optimal subsequence is reconstructed under the upper-neighbor tie rule. Code-point matching is assumed, and a full edit script or grapheme-aware comparison requires more modeling.",
      "Verify the contract and base cases before extending this fixture to production inputs."
    ],
    "takeaways": [
      "Derive the prefix recurrence: Let L[i][j] be the length of a longest common subsequence of prefixes a[:i] and b[:j].",
      "Preserve versioned cells during compression and reconstruction: Filling increasing i and j satisfies the upper, left and diagonal dependencies."
    ],
    "practice": [
      "What distinguishes a subsequence from a substring?|Gaps are allowed while order is preserved|Characters may be arbitrarily reordered|Every character must be adjacent|Every occurrence must be unique|A subsequence can skip positions but retains the relative order of selected elements.",
      "What are the LCS table values along empty-prefix borders?|Zero|One|The full opposite string length|Negative infinity|An empty sequence shares no nonempty subsequence with any prefix.",
      "What is the LCS length of ABC and AC?|2|3|1|0|A followed by C appears in both in order, even though B is skipped in ABC.",
      "A product requires contiguous shared text but uses LCS max-of-neighbors updates. What can it report incorrectly?|A shared sequence spanning forbidden gaps|Only empty shared strings|Only reversed text|A count of all characters in both texts|LCS permits gaps, whereas longest-common-substring matching must reset a run after mismatch.",
      "A one-row LCS update overwrites the diagonal before reading it. What state must be retained?|The old previous-row diagonal|Only the final table value|The largest character code|The number of files on disk|A match depends on L[i-1][j-1], which must survive the row overwrite until used.",
      "A diff tool has several optimal LCS alignments. What reporting requirement helps repeatability?|A deterministic backtracking tie rule|A claim that all LCS results are unique|A forced random choice every run|Deleting repeated characters first|Equal-valued neighbors can lead to different valid optimal alignments, so ties need a defined policy."
    ],
    "formal": [
      "What state indexes the standard LCS recurrence?|Two prefix lengths|Only the total character count|Only the most recent character value|The number of matching symbols so far|Two prefix positions identify the exact sequence-pair subproblem and its remaining alignment choices.",
      "What update applies when the two final prefix characters match?|One plus the diagonal predecessor|Zero regardless of prior matches|Sum of the upper and left values|Product of the prefix lengths|A matching final pair extends an optimal common subsequence of the two shorter prefixes.",
      "What is the full LCS table\u2019s time bound for lengths m and n?|O(mn)|O(m+n) guaranteed|O(log(mn))|O(m factorial)|The algorithm computes one constant-transition cell for each prefix pair.",
      "A comparison has a mismatch at prefixes i,j. Which recurrence preserves LCS optimality?|Max of upper and left cells|One plus the current cell|Reset the whole table to zero|Sum all diagonal entries|At least one distinct final character is excluded, giving the maximum of the two reduced-prefix cases.",
      "A report compares AXBYC with ABC. Which length distinguishes subsequence matching from contiguous matching?|LCS 3, longest common substring 1|LCS 1, longest common substring 3|Both lengths 5|Both lengths 0|ABC occurs in order with gaps, while no two adjacent characters form a shared contiguous run.",
      "A length-only LCS service has a strict memory budget. Which dimension should index rolling-row columns?|The shorter sequence|The longer sequence always|The number of possible Unicode values|The sum of both lengths|The recurrence is symmetric in the input sequences, so choosing the shorter column dimension minimizes row storage.",
      "A full-table backtrack finds equal characters at i-1,j-1. Which move reconstructs a shared symbol?|Record it and move diagonally|Record both and remain in the same cell|Move only right toward larger indexes|Discard every earlier match|A matching pair contributes one subsequence symbol and reduces both prefix lengths.",
      "A user expects visually identical accented text to match, but code points differ. What prerequisite decision is missing?|Text normalization policy|Only the table\u2019s row numbering|Whether characters have any order|The count of browser screenshots|Code-point equality may differ from user-perceived text equivalence, requiring explicit normalization and grapheme rules.",
      "A service saves only two rows then promises arbitrary alignment reconstruction without recomputation. What needs justification?|How discarded decisions are recovered|Whether string lengths are integers|Whether the input has a title|The existence of the zero border|Length compression discards earlier table choices, so reconstructing an alignment needs additional storage or a reconstruction algorithm.",
      "A document tool needs LCS length for strings of sizes m,n, may skip characters and has O(min(m,n)) value memory. Which design satisfies the contract?|Rolling-row LCS with the shorter column dimension|Substring recurrence resetting all mismatches|Sort both strings then count equal characters|One scalar maximum with no prefix dependencies|The two-prefix recurrence preserves order with gaps and rolling rows keep only the live predecessor values for length computation."
    ]
  },
  {
    "slug": "grids",
    "title": "Solve grid recurrences with obstacles and explicit boundaries",
    "intro": "A warehouse route planner counts monotone paths through a floor grid. Moves are right or down and blocked cells cannot be entered. This restricted movement forms a DAG, so each cell can combine already-computed predecessor values.",
    "sections": [
      [
        "Path counting and path cost use different algebra",
        "For a nonblocked cell, ways[r][c]=ways[r-1][c]+ways[r][c-1], with missing boundary predecessors contributing zero and ways[0][0]=1 only if the origin is open. A blocked cell has zero ways regardless of neighbors. Right/down moves strictly increase row plus column, so row-major evaluation respects dependencies and the recurrence counts disjoint last-step cases.",
        "For minimum path cost, replace addition across alternatives with minimum, then add the current cell cost. Use positive infinity for blocked or unreachable cells and initialize the origin to its own cost if the model charges every entered cell. Mixing the count base one with cost base zero changes the meaning. Allowing four-way movement introduces cycles and invalidates this simple one-pass recurrence without another shortest-path formulation."
      ],
      [
        "Bound memory and expose edge cases",
        "An R-by-C grid has RC states and at most two incoming recurrence terms per cell, giving O(RC) arithmetic work. One rolling row takes O(C) entries: before an update dp[c] is the value from above, and dp[c-1] is the updated value from the left. An obstacle must reset dp[c] to zero for counts; leaving the old value would leak paths from the preceding row through the blocked cell.",
        "Empty grids, blocked origins and blocked destinations need defined results. Counts can grow rapidly and require big-integer or modular arithmetic; a modulo result is a different reported quantity from an exact count. The fixture compares a full count table and a one-row implementation on the same obstacle grid. Matching examples provide a regression check, while the last-step partition explains correctness for every valid monotone grid."
      ]
    ],
    "problem": "Solve grid recurrences with obstacles and explicit boundaries on a synthetic business fixture.",
    "steps": [
      "State the input contract and identify the invariant that must hold before each operation.",
      "Execute the fixture and follow each update using the displayed representation.",
      "Compare the result against the expected output and derive costs under the stated operation model."
    ],
    "code": "grid=[[0,0,0],[0,1,0],[0,0,0]]\nR,C=len(grid),len(grid[0]); table=[[0]*C for _ in range(R)]\nfor r in range(R):\n    for c in range(C):\n        if grid[r][c]: continue\n        if r==0 and c==0: table[r][c]=1\n        else: table[r][c]=(table[r-1][c] if r else 0)+(table[r][c-1] if c else 0)\nrow=[0]*C; row[0]=1\nfor r in range(R):\n    for c in range(C):\n        if grid[r][c]: row[c]=0\n        elif c: row[c]+=row[c-1]\nprint(table[-1][-1])\nprint(row)",
    "expect": "2\n[1, 1, 2]",
    "limit": "The grid is nonempty and rectangular, and only right/down moves are legal. Four-way movement, negative-cycle costs and nonmonotone revisits require different graph reasoning.",
    "mistakes": [
      "The grid is nonempty and rectangular, and only right/down moves are legal. Four-way movement, negative-cycle costs and nonmonotone revisits require different graph reasoning.",
      "Verify the contract and base cases before extending this fixture to production inputs."
    ],
    "takeaways": [
      "Path counting and path cost use different algebra: For a nonblocked cell, ways[r][c]=ways[r-1][c]+ways[r][c-1], with missing boundary predecessors contributing zero and ways[0][0]=1 only if the origin is open.",
      "Bound memory and expose edge cases: An R-by-C grid has RC states and at most two incoming recurrence terms per cell, giving O(RC) arithmetic work."
    ],
    "practice": [
      "Why is right/down grid movement acyclic?|Every move increases row plus column|Every cell has equal cost|Obstacles remove every edge|Rows must contain distinct labels|A strictly increasing coordinate sum prevents returning to a previously visited coordinate.",
      "What count belongs to a blocked cell?|Zero|One|The sum of all row counts|The grid width|No legal route may enter the obstacle, so it contributes no paths to later cells.",
      "An open 2-by-2 grid allows only right and down. How many origin-to-corner paths exist?|2|4|1|0|The valid move sequences are right-down and down-right.",
      "A one-row path counter leaves dp[c] unchanged at an obstacle. What defect appears?|Paths leak through the blocked cell|The row count always becomes negative|Every path is counted exactly once|All later columns become independent sources|The old value from above must be cleared because the obstacle cannot transmit any incoming path.",
      "A planner adds left and up moves but keeps one row-major recurrence pass. What assumption breaks?|Acyclic predecessor ordering|Rectangular indexing only|The need to check obstacles|The existence of cell coordinates|Four-way moves can return to earlier cells, so a simple topological right/down recurrence no longer models the graph.",
      "A minimum-cost grid uses count-style addition of upper and left values. What operation should select alternatives?|Minimum, then add current cost|Product, then subtract current cost|Maximum regardless of objective|String concatenation of coordinates|Alternative route costs are minimized, whereas independent route counts are added."
    ],
    "formal": [
      "What base count applies to an open starting cell?|One empty-move path|Zero for every grid|The number of columns|Positive infinity|There is one way to be at the open origin before taking any move.",
      "What boundary value contributes for a nonexistent counting predecessor?|Zero|One|The final answer|The current cell\u2019s coordinate sum|A predecessor outside the grid provides no valid incoming route.",
      "What is the rolling-row counting space bound on an R-by-C grid?|O(C) entries|O(RC) entries necessarily|O(2 to the power RC) entries|O(log C) entries|The current row reuses the previous row\u2019s values one column at a time.",
      "A 3-by-3 monotone grid blocks only its center. How many corner-to-corner paths remain?|2|6|4|0|Only the routes going along the top then right edge or left then bottom edge avoid the center.",
      "A route-count grid has a blocked origin. What must the final count be?|Zero|One for the empty path anyway|The row count|The column count|No valid path may start on an impassable origin under the stated obstacle contract.",
      "A rolling cell dp[c] is about to update in left-to-right order. Which values are live?|Above in dp[c], left in dp[c-1]|Right in dp[c-1], below in dp[c]|Two future cells from the next row|Only the final destination count|The untouched current slot carries the previous row and the prior slot already carries the current row.",
      "A billing report requests exact route counts but the implementation reduces modulo 1009. What is wrong?|Modulo is not the exact count|The grid automatically gains cycles|Obstacles can no longer be represented|Every path count becomes negative|Modular arithmetic may be valid for a specified modulo objective, but it is not the requested exact integer count.",
      "A minimum-cost model charges the start cell\u2019s cost. What initial value is correct?|The origin\u2019s own cost|One because counting starts at one|Zero regardless of cell cost|The destination\u2019s row index|The recurrence must include the origin charge once when the model charges all entered cells including the start.",
      "A monotone minimum-cost route encounters an unreachable predecessor. What sentinel should not win a minimum?|Positive infinity|Zero|Negative infinity|The predecessor\u2019s row number|Positive infinity preserves impossibility under minimum selection, unlike a free zero or attractive negative sentinel.",
      "A warehouse needs exact monotone path counts with obstacles and O(C) value slots, including blocked endpoints. Which design preserves the recurrence?|Rolling sums, obstacle resets, open-origin base|Leave obstacle slots unchanged to save writes|Use four-way neighbors in one unchanged forward pass|Initialize every cell to one and sum all rows|The logical above/left versions, zero reset for blocked cells and open-origin base together preserve the count recurrence within one row of storage."
    ]
  }
]);
