'use strict';
const {course}=require('./wave4-algorithms-private');
module.exports=course("graphs",[
  {
    "slug": "relationships",
    "title": "Model vertices, edges and direction before traversal",
    "intro": "A fraud analyst links accounts by transfers while an infrastructure team links services by dependencies. Both systems contain relationships, but transfer direction, repeated transfers and disconnected accounts change the graph contract. Begin with the business question and preserve the information needed to answer it.",
    "sections": [
      [
        "Choose what a vertex and edge mean",
        "A graph G=(V,E) consists of vertices and edges between them. A directed edge u to v means an ordered relationship; an undirected edge means a symmetric relationship. An account that has no transfers still belongs to V. A transfer multigraph can retain several separate transfers between the same endpoints, whereas a simple graph collapses those parallel edges. A self-loop connects a vertex to itself. Decide explicitly whether each feature is permitted.",
        "A path follows adjacent vertices and respects edge direction. Reachability means at least one such path exists. Degree counts incident edges in an undirected graph; directed graphs distinguish indegree and outdegree. The sum of undirected degrees is 2E, counting a self-loop twice, because every edge has two endpoints. In a directed graph the sum of indegrees and the sum of outdegrees each equal E. These identities are useful ingestion checks."
      ],
      [
        "Build a complete adjacency-list contract",
        "Represent a directed graph as a mapping from every vertex to a list of outgoing neighbors. Include empty lists for sink and isolated vertices. Insert both directions for an undirected non-loop edge. If duplicate list entries represent real parallel edges, traversals must tolerate them and edge-counting code must count multiplicity. Sets remove duplicates but also discard multiplicity, and their iteration order should not be mistaken for a canonical business order.",
        "With adjacency lists the storage is O(V+E) and enumerating outgoing neighbors of u costs O(outdegree(u)). A hash-based dictionary lookup is expected constant time under ordinary hashing assumptions. These costs exclude long label hashing and payload storage. The fixture counts incoming transfers without silently inventing an outgoing edge from a recipient. Modeling a dependency backwards can yield a plausible but unusable deployment order."
      ]
    ],
    "problem": "Model vertices, edges and direction before traversal on a synthetic business fixture.",
    "steps": [
      "State the input contract and identify the invariant that must hold before each operation.",
      "Execute the fixture and follow each update using the displayed representation.",
      "Compare the result against the expected output and derive costs under the stated operation model."
    ],
    "code": "g={\"pay\":[\"ledger\",\"risk\"],\"ledger\":[],\"risk\":[\"ledger\"],\"audit\":[]}\nindegree={v:0 for v in g}\nfor targets in g.values():\n    for v in targets: indegree[v]+=1\nprint(indegree)\nprint(sum(map(len,g.values())))",
    "expect": "{'pay': 0, 'ledger': 2, 'risk': 1, 'audit': 0}\n3",
    "limit": "Graph ingestion must validate that every neighbor is a declared vertex. This fixture assumes closed labels, directed edges and no duplicate transfers.",
    "mistakes": [
      "Graph ingestion must validate that every neighbor is a declared vertex. This fixture assumes closed labels, directed edges and no duplicate transfers.",
      "Verify the contract and base cases before extending this fixture to production inputs."
    ],
    "takeaways": [
      "Choose what a vertex and edge mean: A graph G=(V,E) consists of vertices and edges between them.",
      "Build a complete adjacency-list contract: Represent a directed graph as a mapping from every vertex to a list of outgoing neighbors."
    ],
    "practice": [
      "What does a directed adjacency list normally store at vertex u?|Outgoing neighbors of u|Every predecessor of u|Only vertices with zero indegree|The entire sorted vertex set|Direction determines outgoing traversal; incoming neighbors require a reverse representation.",
      "Which graph element preserves an account with no relationships?|An explicit vertex entry|An invented self-loop|A duplicate edge|An omitted dictionary key|An isolated account remains a vertex even when its adjacency list is empty.",
      "An undirected fixture has degrees 3,2,2,1. How many edges does the degree-sum identity imply?|4|8|3|2|The degree total is eight and every undirected edge contributes two endpoints.",
      "A transfer service must preserve two payments with the same endpoints. Which representation fits?|A multigraph with payment edge IDs|A set of destination labels|A single boolean matrix cell|A map retaining only the last payment|Parallel edges retain separate transfer identities rather than merging distinct events.",
      "A deployment edge prerequisite to dependent is accidentally reversed. What changes?|The meaning of traversal direction|The number of stored vertex labels|The fact that adjacency lists exist|The need for a graph data model|Reversal changes which dependencies can be reached and invalidates the intended ordering interpretation.",
      "A relationship importer records an undirected A-B link only under A. Which check exposes the defect?|Check reciprocal neighbors|Check only the vertex count|Sort the labels alphabetically|Remove every degree-one vertex|Undirected adjacency must describe the same relationship from either endpoint."
    ],
    "formal": [
      "What is the defining difference between a simple graph and a multigraph?|Permission for parallel edges|Whether vertices have names|Whether traversal can terminate|Whether edges can be listed|A multigraph can retain multiple distinct edges between the same endpoints.",
      "Which quantity counts arrows entering a directed vertex?|Indegree|Outdegree|Path length|Component diameter|Indegree counts incoming edges and can differ from the outgoing count.",
      "What storage bound applies to an adjacency list with V vertices and E directed edges?|O(V+E)|O(V squared) necessarily|O(E squared)|O(log V)|One vertex record and one entry per directed edge yield linear combined storage.",
      "A support graph stores customer C with an empty neighbor list. Which statement follows?|C has no outgoing stored edges|C cannot have incoming edges|C does not belong to the graph|C must be a self-loop vertex|An empty outgoing list says nothing about predecessors and still represents a real vertex.",
      "A workflow contains A to B and B to A. Is B reachable from A?|Yes, by one directed edge|No, because direction forbids return|Only after adding a self-loop|Only when every vertex has degree two|The explicit A-to-B edge is a valid directed path regardless of a return edge.",
      "An ingestion audit finds total indegree 19 and total outdegree 18 in one complete directed graph. What is justified?|The counts are inconsistent|The graph must be disconnected|The graph must be acyclic|The graph has nineteen components|Both sums must equal the number of directed edges, including multiplicity.",
      "A contact model stores each undirected non-loop relation twice in neighbor lists. With 14 entries, how many relations exist?|7|14|28|13|Reciprocal storage contributes two adjacency entries for each undirected non-loop relation.",
      "A payments graph allows self-transfers. An undirected degree check counts a loop once. What correction is required?|Count that loop twice in degree|Delete the vertex containing it|Count every other edge twice again|Treat every loop as a new vertex|A loop has two endpoints at the same vertex, so it contributes two to undirected degree.",
      "A feed uses neighbor sets but later needs transfer frequencies. What information has already been lost?|Multiplicity of repeated transfers|The existence of each destination|The identity of each source key|Whether destinations are labels|A set merges repeated neighbors and cannot recover counts from presence alone.",
      "A billing import contains destination Z absent from the vertex registry; reports must include isolated registered clients and reject unknown accounts. Which ingestion policy preserves the contract?|Seed registry vertices and validate every endpoint|Create labels only when an outgoing edge occurs|Silently discard every edge reaching a sink|Treat missing destinations as zero-cost loops|Seeding preserves isolated clients while endpoint validation prevents accidental undeclared vertices."
    ]
  },
  {
    "slug": "storage",
    "title": "Choose graph storage using operations and density",
    "intro": "A route service may answer whether two stations connect directly thousands of times per second, while a build planner scans only actual dependency edges. The same graph can justify different representations because point membership, neighbor enumeration and memory have different costs.",
    "sections": [
      [
        "Compare list, set and matrix operations",
        "An adjacency matrix stores a cell for every ordered vertex pair and therefore uses Theta(V squared) cells. Direct edge presence is O(1) with indexed vertices, but scanning all neighbors of one vertex takes Theta(V). An adjacency list stores only present edges and enumerates neighbors in time proportional to degree. Testing membership in an unsorted neighbor list is O(degree); a neighbor hash set makes that test expected O(1) while increasing representation overhead.",
        "A weighted matrix must distinguish an absent edge from an edge of weight zero. Use a separate absence marker such as None rather than overloading zero when zero-cost connections are legal. For undirected graphs a matrix is symmetric if both directions use the same weight. A matrix can be reasonable for dense graphs where E is Theta(V squared), but density does not remove the need to account for cell size and memory limits."
      ],
      [
        "Index reverse relationships deliberately",
        "A reverse adjacency list maps a vertex to its predecessors. Building it takes O(V+E) time and storage, and allows a cancellation planner to find all tasks directly depending on a failed prerequisite. Keeping outgoing and reverse indexes consistent requires updating both at an edge mutation. A stale reverse index produces wrong business results even if each individual list is syntactically valid.",
        "Representation selection is an operation-budget decision. If V=100000 and E=300000, a dense matrix requires ten billion cells, while adjacency storage scales with roughly four hundred thousand vertex and edge records before overhead. This comparison is a space derivation rather than a runtime benchmark. The fixture represents zero-weight edges correctly and then builds a reverse index from the same edge source."
      ]
    ],
    "problem": "Choose graph storage using operations and density on a synthetic business fixture.",
    "steps": [
      "State the input contract and identify the invariant that must hold before each operation.",
      "Execute the fixture and follow each update using the displayed representation.",
      "Compare the result against the expected output and derive costs under the stated operation model."
    ],
    "code": "labels=[\"hub\",\"shop\",\"port\"]\nindex={v:i for i,v in enumerate(labels)}\nmatrix=[[None]*3 for _ in labels]\nfor u,v,w in [(\"hub\",\"shop\",0),(\"shop\",\"port\",7)]: matrix[index[u]][index[v]]=w\nreverse={v:[] for v in labels}\nfor i,u in enumerate(labels):\n    for j,v in enumerate(labels):\n        if matrix[i][j] is not None: reverse[v].append(u)\nprint(matrix[0])\nprint(reverse)",
    "expect": "[None, 0, None]\n{'hub': [], 'shop': ['hub'], 'port': ['shop']}",
    "limit": "The conversion scans V squared matrix cells; O(V+E) reverse-index construction requires starting from edge lists instead.",
    "mistakes": [
      "The conversion scans V squared matrix cells; O(V+E) reverse-index construction requires starting from edge lists instead.",
      "Verify the contract and base cases before extending this fixture to production inputs."
    ],
    "takeaways": [
      "Compare list, set and matrix operations: An adjacency matrix stores a cell for every ordered vertex pair and therefore uses Theta(V squared) cells.",
      "Index reverse relationships deliberately: A reverse adjacency list maps a vertex to its predecessors."
    ],
    "practice": [
      "Which matrix value safely distinguishes no edge from a free edge?|None for absence, zero for free|Zero for both states|One for both states|An empty vertex label for free|A distinct sentinel preserves the difference between zero weight and missing connectivity.",
      "What does a reverse adjacency index enumerate?|Immediate predecessors|All shortest distances|Only isolated vertices|Every simple cycle|Reversing each stored edge makes incoming neighbors directly available.",
      "A sparse graph has V labels and E links. Which operation on an unsorted neighbor list costs O(degree(u))?|Checking whether u has edge to v|Reading the vertex count|Fetching a known numeric cell|Comparing two integer labels|Membership may inspect every neighbor unless a suitable index is provided.",
      "A planner uses a dense matrix for one million sparse tasks. Which budget grows quadratically?|Number of allocated cells|Number of actual incoming edges|Length of the longest path only|Count of nonempty neighbor lists|The matrix allocates a cell for every ordered pair regardless of sparsity.",
      "A routing team updates outgoing links but not its reverse index. Which report can become stale?|Immediate upstream dependency lookup|The new outgoing neighbor list|The declared integer vertex count|The size of the numeric label format|The reverse view must be updated when edge direction or presence changes.",
      "A team needs expected constant-time edge membership in a sparse graph. Which representation fits?|Neighbor hash sets|Unsorted neighbor arrays only|A list of all possible pairs|A linear scan of all edges|Hash sets trade some overhead for expected constant-time membership under hashing assumptions."
    ],
    "formal": [
      "Which adjacency-matrix operation takes constant time with integer indexes?|Test one specified edge|Enumerate all present neighbors|Visit all reachable vertices|Count every connected component|A single cell lookup is constant time, whereas row enumeration must inspect V cells.",
      "What is the cell count in a directed adjacency matrix?|V squared|V+E always|E divided by V|log V|The matrix has one row and column for each vertex, including absent edges.",
      "How long does building reverse adjacency from an edge list take?|O(V+E)|O(V squared) necessarily|O(E factorial)|O(log E)|Initialize vertices and append one reversed entry per edge.",
      "A rail network has 50000 stations and few links per station. Which storage best supports scanning real links?|Adjacency lists|A fully materialized dense matrix|All simple paths in a table|A matrix for every connected component pair|Sparse adjacency avoids allocating entries for the enormous number of absent links.",
      "A direct-flight matrix uses zero as absence; a promotion adds a zero-price flight. What bug appears?|The flight is indistinguishable from absence|The graph automatically becomes undirected|The number of stations doubles|Every shortest route becomes negative|Overloading zero loses the distinction between a valid free connection and no connection.",
      "A route matrix row contains [None,5,None,0]. Which destination indexes have actual edges?|1 and 3|0 and 2|Only 1|Only 3|Both non-None values denote edges, including the zero-weight edge.",
      "A graph stores only outgoing lists. Finding every predecessor of x once may require what work?|Scan all vertex lists and edges|Inspect only x\u2019s outgoing list|Read exactly one unrelated matrix cell|Run a constant-time sort|Without an incoming index, any edge in the graph could point to x.",
      "A team converts a matrix by inspecting every cell, then claims O(V+E) for a sparse graph. What is wrong?|Its scan is Theta(V squared)|It used a dictionary for labels|Reverse edges cannot be built|Sparse graphs always need sorting|Scanning absent cells dominates when E is much smaller than V squared.",
      "A service stores both directions for each undirected edge in hash sets. What deletion keeps the representation consistent?|Remove v from u and u from v|Remove only the smaller label\u2019s entry|Drop both vertex identities|Rebuild only the indegree of u|An undirected adjacency relation must remain reciprocal after mutation.",
      "A sparse authorization graph needs fast predecessor enumeration and expected constant-time direct-edge checks under frequent changes. Which indexes meet those operations while retaining O(V+E) entries?|Outgoing and incoming neighbor hash sets|One unsorted global list with no indexes|A dense matrix plus all simple paths|Only a set of labels and one edge counter|Dual sparse hash indexes preserve directional membership and enumeration; every mutation must update both views."
    ]
  },
  {
    "slug": "components",
    "title": "Traverse disconnected graphs without losing vertices",
    "intro": "A customer-support network can contain several unrelated clusters. Starting from one account answers a reachability question, but a full inventory needs a traversal forest. Keep the distinction between undirected connectivity and directed reachability explicit.",
    "sections": [
      [
        "A component is a maximal connected region",
        "In an undirected graph, two vertices are connected when a path joins them. This relation partitions V into disjoint connected components, including singleton isolated vertices. Scan all vertices and launch a traversal only when a vertex is still unseen. Mark a neighbor before adding it to the worklist so parallel incoming discoveries do not add duplicate work. Each launch discovers exactly one previously unvisited component.",
        "A directed graph requires different language. Reachability need not be symmetric: A to B does not imply B to A. Weak connectivity ignores directions, whereas strong connectivity requires mutual reachability. The ordinary undirected component algorithm does not compute strongly connected components simply by running outgoing DFS from arbitrary roots. State which question a support dashboard actually needs."
      ],
      [
        "Prove coverage and bound the work",
        "The outer scan guarantees that every declared vertex eventually starts or joins a traversal. The visited set guarantees each vertex is expanded once. In an undirected adjacency list, each edge is examined twice, once from either endpoint, so the total bound is O(V+E) with O(V) auxiliary visited and worklist storage. Iterative traversal avoids recursion depth failure but still needs an explicit stack or queue.",
        "The fixture uses a deterministic outer label order and sorts each result only for presentation. Those sorts add work beyond traversal. Component numbers depend on root order and should not be used as permanent customer identities across imports. If incremental updates are required, recomputing every component after every edge insertion may be too costly; that is a separate dynamic-connectivity problem."
      ]
    ],
    "problem": "Traverse disconnected graphs without losing vertices on a synthetic business fixture.",
    "steps": [
      "State the input contract and identify the invariant that must hold before each operation.",
      "Execute the fixture and follow each update using the displayed representation.",
      "Compare the result against the expected output and derive costs under the stated operation model."
    ],
    "code": "g={\"A\":[\"B\"],\"B\":[\"A\"],\"C\":[],\"D\":[\"E\"],\"E\":[\"D\"]}\nseen=set(); groups=[]\nfor root in g:\n    if root in seen: continue\n    seen.add(root); stack=[root]; group=[]\n    while stack:\n        u=stack.pop(); group.append(u)\n        for v in g[u]:\n            if v not in seen: seen.add(v); stack.append(v)\n    groups.append(sorted(group))\nprint(groups)",
    "expect": "[['A', 'B'], ['C'], ['D', 'E']]",
    "limit": "Sorting each displayed component adds comparison work. Directed strong connectivity requires an appropriate SCC algorithm, not this undirected contract.",
    "mistakes": [
      "Sorting each displayed component adds comparison work. Directed strong connectivity requires an appropriate SCC algorithm, not this undirected contract.",
      "Verify the contract and base cases before extending this fixture to production inputs."
    ],
    "takeaways": [
      "A component is a maximal connected region: In an undirected graph, two vertices are connected when a path joins them.",
      "Prove coverage and bound the work: The outer scan guarantees that every declared vertex eventually starts or joins a traversal."
    ],
    "practice": [
      "What is an isolated vertex\u2019s undirected component?|A singleton containing that vertex|The empty set|Every vertex with no outgoing edge|An undefined graph region|An isolated vertex is connected to itself by the zero-edge path and forms a singleton component.",
      "Why scan every vertex after one component traversal?|Other components may be unreachable|The first traversal changes all labels|Every graph must have one root|Visited sets forbid connected graphs|A traversal reaches only its source component, so an outer scan covers disconnected regions.",
      "An undirected graph has one edge A-B and isolated C. How many traversal launches are needed for full components?|2|1|3|0|A and B share one component and C supplies the second singleton component.",
      "A dependency graph has only A to B. Does its outgoing reachability establish mutual connectivity?|No, B cannot reach A|Yes, any edge is automatically reciprocal|Yes, every directed graph is strongly connected|Only when the labels are sorted|Strong connectivity requires paths in both directions; the single arrow supplies only one.",
      "A scanner marks a vertex when pushing it to the stack. What duplication does this prevent?|Duplicate pending entries|All repeated business identifiers|The need to read adjacency lists|Every duplicate edge in the input|Early marking prevents multiple pending worklist entries for the same undiscovered vertex.",
      "A support export renumbers components after reordering input labels. What should the UI avoid?|Using numbers as durable IDs|Displaying the number of components|Listing isolated customer accounts|Showing members in lexical order|Traversal component identifiers depend on discovery order and do not define stable external IDs."
    ],
    "formal": [
      "Which relation defines strong connectivity in a directed graph?|Mutual reachability|Equal indegree|Identical outgoing labels|One edge in either direction|Every pair in a strongly connected component must be reachable in both directions.",
      "What graph operation defines weak connectivity?|Ignore edge directions|Delete all directed edges|Reverse only sink edges|Keep only self-loops|Weak connectivity computes connected regions in the underlying undirected graph.",
      "What is the auxiliary visited-set bound for a full traversal?|O(V)|O(E factorial)|O(log V) always|O(1) for every graph|A traversal may need to remember every vertex to avoid repeated expansion.",
      "A fraud graph has three disconnected clusters and four isolated accounts. How many undirected components exist?|7|3|4|12|Each connected cluster is one component and each isolated account contributes its own component.",
      "A component audit starts only from the first label. What outcome is incomplete?|Membership of unreachable components|Reachability inside the first component|Recognition of the starting vertex|The graph\u2019s directed-edge orientation|A single-source traversal never visits components with no path from that source.",
      "A directed service map A to B to C is scanned outward from A and called one SCC. Why is that label wrong?|C has no return path to A|A reaches C through two edges|The map has an odd vertex count|Adjacency lists cannot hold directed data|One-way reachability does not satisfy the mutual reachability required for an SCC.",
      "An undirected component walker expands each vertex once and scans each incident edge. What is the total traversal bound?|O(V+E)|O(VE) necessarily|O(V squared) for every sparse input|O(E log E) necessarily|Each vertex is expanded once and each edge contributes two adjacency inspections.",
      "A graph has parallel A-B edges. With marking on push, what happens to B during traversal from A?|B is scheduled once|B is expanded once per parallel edge|B is skipped permanently|B creates a separate component per edge|The first edge marks B, preventing later parallel edges from scheduling it again.",
      "A million-vertex chain exceeds the language recursion limit. What change preserves DFS coverage?|Use an explicit traversal stack|Remove the visited structure|Stop after the root and one child|Replace every edge with a self-loop|An explicit worklist moves recursion state into managed storage while retaining the same traversal invariant.",
      "A directed incident map must report groups where every service can call every other service. Memory allows O(V+E); merely ignoring direction would merge unrelated callers. Which interpretation must drive the algorithm choice?|Strongly connected components|Weakly connected components|Arbitrary outgoing DFS forest roots|Equal-indegree vertex buckets|The operational requirement is mutual directed reachability; weak components and arbitrary reachability forests do not establish it."
    ]
  },
  {
    "slug": "bfs",
    "title": "Derive shortest hop paths from the BFS layer invariant",
    "intro": "An incident team wants the fewest escalation links between an initial service and an owner. Every link counts as one hop. Breadth-first search processes a FIFO frontier in distance layers and discovers shortest edge counts without enumerating every possible route.",
    "sections": [
      [
        "Discovery finalizes unweighted distance",
        "Set dist[source]=0 and enqueue the source. On removing u from a FIFO queue, inspect its outgoing edges. For an undiscovered neighbor v set dist[v]=dist[u]+1, set parent[v]=u and enqueue v. Discovery, rather than removal, is the moment to mark v. The FIFO invariant ensures vertices are removed in nondecreasing distance and every pending distance differs from the current layer by at most one.",
        "Suppose v is first found from distance k. Any shorter source-to-v path would end in a predecessor at distance less than k, and that predecessor would already have been processed. It would have discovered v earlier, a contradiction. This proof relies on equal edge cost. A weighted graph with costs 1 and 100 can have a fewer-edge route that is more expensive, so ordinary BFS is not a minimum-weight solver."
      ],
      [
        "Reconstruct and bound the search",
        "Store one predecessor per discovered vertex, then walk parents backwards from the target and reverse the result. A parent chain strictly decreases distance, so it terminates at the source. Unreachable targets have no distance and must not be given a fabricated path. If only one target path is required, first discovery is enough to establish its distance; exploring the entire graph is unnecessary.",
        "An adjacency-list BFS takes O(Vr+Er) time in the reachable subgraph and O(Vr) auxiliary state. A deque supports efficient removals from the left; repeatedly using list.pop(0) shifts pending elements and can add quadratic movement. The fixture shows the parent path rather than assuming there is a unique shortest path. Neighbor order can choose among equal-hop alternatives without changing the optimal distance."
      ]
    ],
    "problem": "Derive shortest hop paths from the BFS layer invariant on a synthetic business fixture.",
    "steps": [
      "State the input contract and identify the invariant that must hold before each operation.",
      "Execute the fixture and follow each update using the displayed representation.",
      "Compare the result against the expected output and derive costs under the stated operation model."
    ],
    "code": "from collections import deque\ng={\"A\":[\"B\",\"C\"],\"B\":[\"D\"],\"C\":[\"D\"],\"D\":[\"E\"],\"E\":[]}\nq=deque([\"A\"]); dist={\"A\":0}; parent={}\nwhile q:\n    u=q.popleft()\n    for v in g[u]:\n        if v not in dist:\n            dist[v]=dist[u]+1; parent[v]=u; q.append(v)\npath=[\"E\"]\nwhile path[-1]!=\"A\": path.append(parent[path[-1]])\nprint(dist[\"E\"])\nprint(list(reversed(path)))",
    "expect": "3\n['A', 'B', 'D', 'E']",
    "limit": "BFS minimizes hop count only when edge costs are uniform. Its chosen parent path depends on neighbor order when shortest paths tie.",
    "mistakes": [
      "BFS minimizes hop count only when edge costs are uniform. Its chosen parent path depends on neighbor order when shortest paths tie.",
      "Verify the contract and base cases before extending this fixture to production inputs."
    ],
    "takeaways": [
      "Discovery finalizes unweighted distance: Set dist[source]=0 and enqueue the source.",
      "Reconstruct and bound the search: Store one predecessor per discovered vertex, then walk parents backwards from the target and reverse the result."
    ],
    "practice": [
      "Which worklist discipline gives ordinary BFS its layers?|FIFO queue|LIFO stack|Descending vertex sort|Random edge selection|First-in first-out processing completes earlier distance layers before later ones.",
      "When should a BFS vertex normally be marked discovered?|When it is enqueued|Only when all paths end|After every vertex is removed|Only after sorting its neighbors|Marking during enqueue prevents repeated frontier entries and fixes the first shortest-hop distance.",
      "A graph has A-B-D and A-C-D with unit edges. What is dist(A,D)?|2|1|3|4|Both routes use two edges and no direct A-D edge is present.",
      "A route service changes one link cost from 1 to 90. What BFS guarantee is lost?|Minimum total weight|Reachable-vertex detection|FIFO queue behavior|Parent links forming discovery paths|Unequal weights break the correspondence between fewest edges and cheapest total cost.",
      "A BFS uses list.pop(0) on a wide frontier. What extra cost can dominate?|Shifting remaining list elements|Comparing all edge weights|Reversing every graph edge|Computing strongly connected components|Front removal from a Python list moves the remaining elements, unlike deque.popleft.",
      "A target has no entry in the completed BFS distance map. What can be reported?|It is unreachable from the source|Its distance is necessarily zero|Its parent is the final visited vertex|It is absent from every graph|A complete BFS records every reachable vertex, so no distance means no source path under the graph contract."
    ],
    "formal": [
      "What does BFS minimize in an unweighted graph?|Number of edges on a path|Sum of arbitrary edge prices|Lexicographic vertex sequence|Maximum vertex degree|The FIFO layer invariant guarantees minimum hop count when all edges have equal cost.",
      "What value initializes the source distance?|Zero|One|The source degree|The total edge count|The source needs no traversed edge to reach itself, giving distance zero.",
      "Which structure reconstructs one shortest BFS path?|A predecessor map|A sorted edge-weight table|Only the final queue length|A count of unrelated components|Following first-discovery predecessors returns a path whose distance decreases by one per step.",
      "An escalation graph has S to A,B; A to T; B to C; C to T. Which discovered distance is valid?|T has distance 2|T has distance 1|T has distance 3 only|T has no distance|The path S-A-T has two unit edges and beats the three-edge alternative.",
      "A FIFO BFS discovers v from a distance-four node. What distance is assigned to v?|5|4|3|8|One additional unit edge extends the predecessor\u2019s distance from four to five.",
      "A support graph has two equal-hop routes to an owner. Reordering neighbor lists can change what?|The chosen predecessor path|The minimum hop count|The owner\u2019s reachability|The number of vertices in the graph|BFS preserves shortest distance but first-discovery tie choices depend on adjacency iteration.",
      "A target is discovered but not yet dequeued in ordinary BFS. May its hop distance be finalized?|Yes, FIFO first discovery is shortest|No, all simple paths must be enumerated|Only after finding a negative edge|Only if its label is alphabetically first|Any shorter predecessor layer would have been processed before the layer that first discovers the target.",
      "A service marks nodes only on dequeue and has many routes into one vertex. What resource can grow unnecessarily?|Duplicate pending queue entries|The mathematical shortest distance|The number of declared source labels|The count of actual graph vertices|Several predecessors may enqueue the same unmarked node before its first removal.",
      "A BFS reaches Vr vertices and scans Er outgoing edges using deque and expected hash access. What bound follows?|O(Vr+Er) time and O(Vr) state|O(Vr squared) time is unavoidable|O(Er factorial) time and O(1) state|O(log Vr) time for all targets|Each reached vertex is scheduled once and each outgoing edge is inspected once.",
      "A notification service must return one shortest hop path to T, stop as early as sound, and retain O(Vr) state. Edge costs are equal and adjacency is stable. Which stopping rule fits?|Stop when T is first discovered and follow parents|Stop when any neighbor of the source is found|Stop only after enumerating every simple route|Stop when T is first seen in a sorted label list|First discovery finalizes T\u2019s BFS distance; predecessor state reconstructs a valid shortest path without scanning all remaining reachable edges."
    ]
  },
  {
    "slug": "dfs",
    "title": "Use DFS state to distinguish active paths and finished work",
    "intro": "A dependency audit must detect cycles and explain a blocking chain. A visited flag alone records that a task was seen, but directed cycle detection needs to know whether a neighbor is still active on the current DFS path.",
    "sections": [
      [
        "Three states preserve the recursion meaning",
        "Color vertices white before discovery, gray while active and black after all outgoing edges have been inspected. A directed edge to a gray vertex is a back edge to an ancestor on the active path, proving a cycle. An edge to a black vertex can be a cross or forward relationship and does not by itself prove a cycle. A single visited boolean merges these distinct cases and can report false positives.",
        "Recursive DFS naturally retains an iterator position and return point for each active vertex. An iterative implementation needs frames containing that position, or an explicit enter/exit event discipline, to preserve gray-to-black transitions. Pushing a vertex and immediately marking it black before processing descendants destroys the active-path meaning. In an undirected graph, the reverse of the parent edge is expected and must be treated separately; parallel edges require edge IDs for precise parent-edge handling."
      ],
      [
        "Finish events support dependency reasoning",
        "On a finite graph, each vertex enters and exits once, and each outgoing edge is scanned once, producing O(V+E) traversal time. The color map needs O(V) storage and recursive depth can be V on a chain. Finish order supports topological reasoning only when directed cycles are absent. Reversing a valid DAG\u2019s DFS finish order puts every prerequisite before its dependent under prerequisite-to-dependent edge orientation.",
        "The fixture implements recursive coloring only on a tiny controlled graph and displays the cycle result. Production chain depth can exceed the runtime call limit, so an explicit frame stack is safer for unbounded depth. A cycle witness can be reconstructed from active parents; logging only a boolean is enough for a test but insufficient for a useful dependency incident report."
      ]
    ],
    "problem": "Use DFS state to distinguish active paths and finished work on a synthetic business fixture.",
    "steps": [
      "State the input contract and identify the invariant that must hold before each operation.",
      "Execute the fixture and follow each update using the displayed representation.",
      "Compare the result against the expected output and derive costs under the stated operation model."
    ],
    "code": "g={\"A\":[\"B\"],\"B\":[\"C\"],\"C\":[\"A\"],\"D\":[]}\ncolor={u:0 for u in g}\ndef visit(u):\n    color[u]=1\n    for v in g[u]:\n        if color[v]==1: return True\n        if color[v]==0 and visit(v): return True\n    color[u]=2\n    return False\nprint(any(color[u]==0 and visit(u) for u in g))",
    "expect": "True",
    "limit": "The fixture detects existence only and returns early, so not every discovered vertex is black at exit. It does not produce a cycle witness or handle unbounded recursion safely.",
    "mistakes": [
      "The fixture detects existence only and returns early, so not every discovered vertex is black at exit. It does not produce a cycle witness or handle unbounded recursion safely.",
      "Verify the contract and base cases before extending this fixture to production inputs."
    ],
    "takeaways": [
      "Three states preserve the recursion meaning: Color vertices white before discovery, gray while active and black after all outgoing edges have been inspected.",
      "Finish events support dependency reasoning: On a finite graph, each vertex enters and exits once, and each outgoing edge is scanned once, producing O(V+E) traversal time."
    ],
    "practice": [
      "What does gray mean in directed DFS coloring?|Active on the current search path|Never discovered|Finished with every outgoing edge|Unreachable in the entire graph|Gray records discovery without completion, so it represents an active DFS frame.",
      "Which directed edge proves a cycle during DFS?|An edge to a gray ancestor|Any edge to a black vertex|Every edge to a leaf|Any edge between distinct labels|A gray neighbor lies on the active ancestor path, closing a directed cycle.",
      "In a DAG diamond A to B,C and B,C to D, why is a second visit to finished D not a cycle proof?|Finished does not mean active ancestor|Every DAG has no shared neighbors|D must be the root|The graph has an even vertex count|A black vertex may be shared by separate branches without lying on the current active path.",
      "A dependency walker marks a vertex black immediately on entry. Which information is lost?|Whether it remains on the active path|Its original business label|The number of matrix columns|Whether it has any stored neighbors|Black must mean all outgoing work is complete; early blackening erases the active interval.",
      "An undirected DFS sees its parent via the reciprocal edge. What should it avoid?|Treating the parent edge as a cycle|Recording the parent\u2019s identity|Inspecting any other neighbor|Marking the child as visited|The ordinary two-way storage of one undirected edge is expected and is not itself a cycle.",
      "A deployment chain can have 100000 tasks. What protects DFS from call-depth failure?|An explicit stack of DFS frames|A larger vertex name|Sorting only the root\u2019s neighbors|Removing every gray color state|Explicit frames retain traversal progress without relying on a bounded language call stack."
    ],
    "formal": [
      "What state follows gray after all outgoing DFS edges finish?|Black|White|Undeclared|Negative distance|The black state means the vertex\u2019s outgoing exploration and active frame are complete.",
      "What extra detail does an iterative DFS frame need to simulate recursive finishing?|Remaining-neighbor position|A random priority seed|Only the global edge count|The largest vertex label|The algorithm must resume each parent\u2019s unprocessed neighbors after returning from a child.",
      "What traversal bound follows when every vertex and outgoing edge is handled once?|O(V+E)|O(V factorial)|O(log E)|O(VE) necessarily|Summing constant vertex work and one inspection per adjacency entry gives linear combined cost.",
      "A build graph contains A to B and B to A. DFS from A finds B\u2019s edge to gray A. What follows?|A directed cycle exists|The graph is a valid DAG|A must have zero indegree|Both edges can be ignored|The active path A-B plus B-A closes a directed loop.",
      "A trace exits D, then later reaches black D from another branch. Which response is sound?|Continue; this edge proves no cycle|Declare a cycle because D was ever seen|Turn every finished vertex white|Delete the incoming edge automatically|Only a gray destination proves an active ancestor cycle in directed DFS coloring.",
      "A team reverses finish order on a cyclic graph and deploys tasks. What validation is missing?|Reject cycles before ordering|Ensure labels have equal length|Force the first task to be the root|Sort the final report alphabetically|Reverse finish order is a topological order only when the directed graph is acyclic.",
      "A recursive cycle detector returns True early. Can callers assume every discovered color is black afterward?|No, active frames may remain gray|Yes, return automatically recolors vertices|Only if labels are strings|Only when the component is nonempty|Early return skips normal finish transitions, so color state is partial after finding a cycle.",
      "An undirected multigraph has two distinct edges joining u and its DFS parent. What tracking is needed to distinguish the return edge?|Parent edge identity|Only parent vertex identity|Only total component count|Only lexical neighbor ordering|Ignoring every edge to the parent can hide the second parallel edge; tracking the exact tree edge preserves multiplicity semantics.",
      "An incident tool wants a concrete directed cycle, not just True. What additional state is useful?|Parents of active DFS vertices|A list sorted by outdegree|Only the number of failed tasks|An array of all edge weights|The active parent chain from a gray ancestor to the current vertex plus the back edge forms a witness.",
      "A service must simulate recursive DFS finishing on a long directed chain, detect back edges, and use O(V) state without recursion. Which design preserves all required meanings?|Color map plus stack frames retaining neighbor iterators|A queue that blackens each node immediately on insertion|A visited set plus alphabetically sorted output|A stack that drops the parent before inspecting descendants|Retained frames keep ancestors active while children run, enabling correct gray-edge tests and finish transitions within linear state."
    ]
  },
  {
    "slug": "multi-source",
    "title": "Use multi-source BFS for nearest facilities and grid distances",
    "intro": "A warehouse wants the fewest walking steps from every aisle cell to any charging station. Running one search per station repeats most of the same edge scans. Multi-source BFS treats every station as an equally close starting point and expands one shared wavefront.",
    "sections": [
      [
        "Initialize all legitimate sources together",
        "Assign distance zero to every distinct station, mark all of them discovered and enqueue them before processing any neighbors. The FIFO invariant now measures minimum distance to the source set S: dist(v)=min over s in S of shortest_hops(s,v). Conceptually a super-source with zero-cost connections to all stations expresses this minimum, but ordinary unit-edge BFS must initialize stations at zero directly rather than adding a real extra hop.",
        "A grid is an implicit graph. Each open cell is a vertex, and legal neighboring moves are its outgoing edges. Four-way movement uses orthogonal offsets; diagonal movement changes the graph and therefore the distance. Obstacles are absent vertices or forbidden transitions, not merely cells with large distance. Validate row and column bounds before indexing because Python negative indexes otherwise refer to the opposite end of an array."
      ],
      [
        "State what nearest means and handle unreachable cells",
        "A queue can hold up to O(RC) cells in an R-by-C grid, and each open cell has at most four outgoing moves. Therefore traversal time and state are O(RC). Multi-source traversal saves the multiplicative number-of-stations factor compared with independent searches. Reusing one distance table also handles meeting wavefronts: only the first discovery of a cell assigns its minimum distance.",
        "If the source set is empty, no cell is reachable from a station, so leave distances unset. If equal-distance station ownership matters, specify a deterministic tie policy in addition to distance. Simple queue source order can select one equal-distance owner but does not implement an arbitrary business priority that may change later. The fixture uses one obstacle and two initialized sources and reports unset values for blocked cells."
      ]
    ],
    "problem": "Use multi-source BFS for nearest facilities and grid distances on a synthetic business fixture.",
    "steps": [
      "State the input contract and identify the invariant that must hold before each operation.",
      "Execute the fixture and follow each update using the displayed representation.",
      "Compare the result against the expected output and derive costs under the stated operation model."
    ],
    "code": "from collections import deque\nrows,cols=2,4; blocked={(0,2)}; sources=[(0,0),(1,3)]\ndist={s:0 for s in sources}; q=deque(sources)\nwhile q:\n    r,c=q.popleft()\n    for dr,dc in [(1,0),(-1,0),(0,1),(0,-1)]:\n        v=(r+dr,c+dc)\n        if 0<=v[0]<rows and 0<=v[1]<cols and v not in blocked and v not in dist:\n            dist[v]=dist[(r,c)]+1; q.append(v)\nfor r in range(rows): print([dist.get((r,c)) for c in range(cols)])",
    "expect": "[0, 1, None, 1]\n[1, 2, 1, 0]",
    "limit": "Four-neighbor equal-cost movement is assumed. Empty sources, blocked sources, ragged grids and weighted terrain require explicit validation or a different search.",
    "mistakes": [
      "Four-neighbor equal-cost movement is assumed. Empty sources, blocked sources, ragged grids and weighted terrain require explicit validation or a different search.",
      "Verify the contract and base cases before extending this fixture to production inputs."
    ],
    "takeaways": [
      "Initialize all legitimate sources together: Assign distance zero to every distinct station, mark all of them discovered and enqueue them before processing any neighbors.",
      "State what nearest means and handle unreachable cells: A queue can hold up to O(RC) cells in an R-by-C grid, and each open cell has at most four outgoing moves."
    ],
    "practice": [
      "What initial distance does each valid multi-source BFS seed receive?|Zero|One|Its queue position|The number of sources|Each source is at zero hops from the source set, so all seeds start in the same layer.",
      "How are all source seeds introduced for multi-source BFS?|Enqueue them before expansion|Finish one full BFS per seed first|Insert them only when reached from another seed|Give the last source a negative distance|Simultaneous initialization lets one frontier compute distance to the nearest source.",
      "A line has cells 0 through 4 and sources at 0 and 4. What is cell 2's nearest-source hop distance?|2|4|1|0|The middle cell is two unit moves from either endpoint source.",
      "A warehouse allows only orthogonal steps. Adding diagonal neighbors changes what?|The path-distance model|Only output formatting|Only the names of visited cells|Nothing about reachability or cost|New diagonal edges can shorten paths and connect regions under a different movement contract.",
      "A Python grid search reads row -1 before checking bounds. What bug can occur?|It accesses the final row|It always raises before reading|It automatically clamps to row zero|It creates a new source station|Negative indexing is valid in Python and can accidentally wrap a forbidden move.",
      "A grid has no station seeds. What distance policy is sound?|Leave all distances unset|Assign zero to every cell|Invent a station at the center|Return each cell\u2019s row number|The minimum distance to an empty source set has no reachable finite value."
    ],
    "formal": [
      "Which expression describes multi-source distance?|Minimum source-to-vertex hop count|Sum of every source distance|Maximum source-to-vertex hop count|The first source\u2019s label length|The shared wavefront finds the nearest source, not a sum or farthest-source objective.",
      "What is the maximum number of orthogonal neighbors of an interior grid cell?|4|2|8|1|Four-way movement uses up, down, left and right and excludes diagonals.",
      "Which grid element represents an impassable wall?|A forbidden cell or move|A zero-distance source|A mandatory outgoing edge|A duplicate queue entry|Walls must prevent traversal rather than being treated as already reachable cells.",
      "A map has two stations and a cell one step from one, five from the other. What distance should the shared BFS assign?|1|5|6|3|The objective minimizes distance over the seed set, so the nearer station determines the value.",
      "A station cell is initialized but left unmarked. What can another source wave do incorrectly?|Schedule the station again at a positive distance|Remove every wall from the map|Make all distances negative|Convert four-way moves into eight-way moves|Sources must be marked at distance zero so later paths cannot rediscover them as ordinary cells.",
      "An R-by-C open grid uses four-way moves and one distance map. What total traversal bound applies?|O(RC)|O((RC) factorial)|O(R+C) for every grid|O(log(RC))|There are RC vertices and at most four adjacency checks per cell.",
      "A team runs a complete BFS independently from each of K stations on the same grid. Which factor can multi-source BFS remove for nearest-distance output?|The repeated K search factor|The need to inspect reachable cells|Every unit of queue storage|The existence of obstacles|One shared wavefront processes each cell once instead of repeating the full exploration for each station.",
      "A cell ties between two stations and the UI shows an owner. What must be specified beyond distance correctness?|A station tie-breaking policy|A negative edge for each station|A requirement to visit walls|A forced unique shortest path|Distances can tie, so owner selection needs its own deterministic and documented policy.",
      "A wall separates all stations from a room. What should remain unset after traversal?|Distances for that unreachable room|Distances of every station|All walls' physical coordinates|The grid\u2019s row and column count|No legal source path crosses the wall, so the room has no finite source distance.",
      "A robot planner must return nearest-charger step distances in O(RC) time, preserve walls and allow only unit orthogonal moves. Which design meets the operation budget?|Seed every charger at zero in one BFS|Run DFS from each charger and keep first discovery|Run independent BFS for every open cell|Initialize one charger and ignore the rest|A single simultaneous FIFO expansion with shared visited distances processes the bounded-degree grid once and computes nearest-source hops."
    ]
  },
  {
    "slug": "dijkstra",
    "title": "Finalize nonnegative weighted distances with Dijkstra",
    "intro": "A delivery planner minimizes travel minutes rather than hop count. Edges can have different nonnegative costs. Dijkstra repeatedly finalizes the cheapest unresolved distance; its correctness rests on nonnegativity, not on the fact that a priority queue happens to be used.",
    "sections": [
      [
        "Relaxation creates candidate upper bounds",
        "Maintain dist[source]=0 and infinity for other vertices. Relax an edge u to v of weight w when dist[u]+w improves dist[v]; record the new distance and predecessor. A min-heap returns the smallest tentative candidate. In a lazy implementation, each improvement pushes a new heap entry instead of decreasing an existing key. Skip a popped entry when its stored distance no longer equals dist[u].",
        "When a current minimum vertex u is removed, any alternate path reaching it through unresolved vertices cannot be cheaper: the first unresolved step already has tentative distance at least dist[u], and all remaining weights are nonnegative. This finalization proof fails with negative edges. Dijkstra can run on directed or undirected graphs, but the weights and edge orientation must be represented consistently."
      ],
      [
        "Match the heap bound to the implementation",
        "In the lazy binary-heap version, up to O(E) improvements and entries can occur, yielding O((V+E) log(V+E)) time and O(V+E) auxiliary storage under constant-time numeric comparison. A decrease-key heap keeping one active entry per vertex has a different storage bound. Do not claim O(V) heap storage for lazy duplicate entries without an additional argument.",
        "A shortest-path fixture may stop when a target is popped with its current distance, because it is then finalized. Stopping when the target is first discovered is unsound for weighted edges: a later route may improve it. Zero-weight edges are valid; negative inputs should be rejected before relying on this algorithm. The fixture first proposes an expensive route to B, later improves it through C, and safely ignores the stale heap entry."
      ]
    ],
    "problem": "Finalize nonnegative weighted distances with Dijkstra on a synthetic business fixture.",
    "steps": [
      "State the input contract and identify the invariant that must hold before each operation.",
      "Execute the fixture and follow each update using the displayed representation.",
      "Compare the result against the expected output and derive costs under the stated operation model."
    ],
    "code": "import heapq\ng={\"A\":[(\"B\",8),(\"C\",2)],\"B\":[(\"D\",1)],\"C\":[(\"B\",1),(\"D\",9)],\"D\":[]}\ndist={\"A\":0}; heap=[(0,\"A\")]; stale=0\nwhile heap:\n    d,u=heapq.heappop(heap)\n    if d!=dist[u]: stale+=1; continue\n    for v,w in g[u]:\n        if d+w<dist.get(v,float(\"inf\")):\n            dist[v]=d+w; heapq.heappush(heap,(d+w,v))\nprint(dist)\nprint(stale)",
    "expect": "{'A': 0, 'B': 3, 'C': 2, 'D': 4}\n2",
    "limit": "The fixture assumes all weights are finite nonnegative numbers and labels are comparable strings. General payloads need a separate comparable heap tie key.",
    "mistakes": [
      "The fixture assumes all weights are finite nonnegative numbers and labels are comparable strings. General payloads need a separate comparable heap tie key.",
      "Verify the contract and base cases before extending this fixture to production inputs."
    ],
    "takeaways": [
      "Relaxation creates candidate upper bounds: Maintain dist[source]=0 and infinity for other vertices.",
      "Match the heap bound to the implementation: In the lazy binary-heap version, up to O(E) improvements and entries can occur, yielding O((V+E) log(V+E)) time and O(V+E) auxiliary storage under constant-time numeric comparison."
    ],
    "practice": [
      "What edge-weight restriction supports Dijkstra\u2019s finalization proof?|Nonnegative weights|Strictly decreasing weights|Only negative weights|Equal vertex labels|Nonnegative remaining edges prevent a later unresolved route from undercutting the current minimum.",
      "What does relaxing an edge attempt to improve?|The neighbor\u2019s tentative distance|The total vertex count|The source\u2019s business identity|Every unrelated edge weight|Relaxation compares the existing bound with the candidate distance through the current vertex.",
      "A route has A-B cost 10 and A-C-B costs 2 and 3. What is the shortest A-B cost?|5|10|2|13|The two-edge route through C costs five and improves the direct edge\u2019s cost ten.",
      "A lazy heap pops (9,u) but dist[u] is 4. What action is correct?|Skip this stale entry|Reset dist[u] to 9|Delete every edge entering u|Finalize u at 9 again|The entry no longer represents the best known distance, so processing it would duplicate obsolete work.",
      "A courier search first discovers target T at cost 20. Can it stop immediately?|No, a cheaper candidate may arrive later|Yes, discovery always finalizes weighted distance|Only if T\u2019s name sorts first|Only when the queue contains duplicates|Weighted first discovery is an upper bound; finalization occurs at the current minimum pop.",
      "A routing import includes a negative edge. What must the planner reconsider?|Dijkstra\u2019s correctness assumptions|Whether dictionary keys can be strings|The need to store any vertices|Whether paths have endpoints|A negative continuation can invalidate greedy finalization even if a sample run returns a plausible result."
    ],
    "formal": [
      "Which priority is removed first by a min-heap Dijkstra frontier?|Minimum distance|Largest outgoing degree|Newest edge identifier|Longest vertex label|The greedy proof requires taking the unresolved candidate with minimum known distance.",
      "Are zero-weight edges compatible with Dijkstra?|Yes, they are nonnegative|No, weights must exceed one|Only in undirected graphs|Only when the graph is a tree|Zero does not violate the nonnegative-path argument, though equal-distance ties may occur.",
      "What replaces decrease-key in a lazy heap implementation?|Push an improved entry and skip stale pops|Discard every improved distance|Sort the full matrix after each edge|Permanently finalize on first enqueue|Lazy duplicates preserve minimum candidates while obsolete versions are filtered when removed.",
      "A delivery graph has S-X=7, S-Y=1 and Y-X=2. After processing Y, what is dist[X]?|3|7|1|10|Relaxing Y-X proposes one plus two, which improves the previous upper bound seven.",
      "A current pop gives T distance 6 with nonnegative edges. What stopping rule is safe for a single target?|Stop at this nonstale minimum pop|Stop only after listing every path|Restart BFS from T|Wait for all heap entries to have equal keys|A nonstale minimum extraction finalizes T under Dijkstra\u2019s nonnegative-weight invariant.",
      "A candidate to v has cost 12 while dist[v]=9. What should relaxation do?|Keep 9|Replace 9 with 12|Set v to infinity|Delete the edge source|Relaxation changes state only for a strictly better candidate under this implementation.",
      "A team uses lazy duplicate heap entries yet promises O(V) heap storage. What is missing?|A bound excluding O(E) pending improvements|A requirement that all labels be strings|A proof that every graph is dense|An argument that source distance is zero|Several improvements to a vertex can coexist, so lazy frontier size may scale with edges rather than just vertices.",
      "A service heap stores equal-distance unorderable payloads. Which tuple avoids comparing those payloads?|Distance, unique counter, payload|Distance, payload, same counter|Payload, distance, unique counter|Only payload and distance|A unique comparable tie counter resolves equal distances before the heap reaches an unorderable payload.",
      "A route has a negative edge but no negative cycle. Does absence of negative cycles alone justify Dijkstra?|No, individual negative edges still break its proof|Yes, all shortest-path algorithms share that condition|Yes, a heap cancels negative costs|Only if every vertex has an outgoing edge|Dijkstra needs nonnegative edge weights, a stronger requirement than merely excluding negative cycles.",
      "A planner needs the cheapest route to T with finite nonnegative costs, uses a lazy heap and has O(V+E) working memory. Which implementation contract is sound?|Relax improvements, skip stale entries, stop on current T pop|Finalize T on its first push and retain one visited bit only|Allow negative discounts because the heap sorts distances|Claim one heap entry per vertex without maintaining decrease-key|This design matches both the finalization proof and the possible edge-proportional storage of lazy pending entries."
    ]
  },
  {
    "slug": "topological",
    "title": "Schedule prerequisites with Kahn topological ordering",
    "intro": "A build coordinator needs a task order in which every prerequisite finishes before its dependent begins. A topological order exists exactly when the directed graph is acyclic. Kahn\u2019s algorithm repeatedly removes tasks with no remaining prerequisites.",
    "sections": [
      [
        "Remaining indegree is the scheduling invariant",
        "Orient each edge from prerequisite to dependent, calculate indegree for every vertex and enqueue all zero-indegree vertices. Remove one ready vertex, append it to the order and decrement the indegree of each outgoing neighbor. Enqueue a neighbor precisely when its remaining indegree becomes zero. Indegree now counts incoming edges from tasks not yet removed, so zero means every prerequisite has already appeared.",
        "Multiple ready vertices indicate multiple valid choices. FIFO yields a valid order based on input order; a min-heap can enforce lexical priority but adds logarithmic ready-set operations. Neither a topological order nor a FIFO queue alone gives an optimal parallel makespan when task durations and worker limits matter. A scheduler must add resource and execution policies on top of prerequisite correctness."
      ],
      [
        "Detect incomplete removal rather than returning a false success",
        "If fewer than V vertices are removed, the residual graph has no zero-indegree vertex but still contains vertices. Following predecessor edges in a finite residual graph must revisit a vertex, proving a directed cycle. A partial order is useful diagnostic evidence, not a valid full deployment plan. Do not silently deploy the prefix as if all tasks were schedulable.",
        "Initializing indegrees and scanning each edge as its source is removed gives O(V+E) time with a deque and O(V) auxiliary state. Parallel edges must be counted and decremented consistently; deduplicating only one phase leaves incorrect residual counts. The fixture returns an explicit failure indicator for a cyclic graph and verifies edge positions on the acyclic order."
      ]
    ],
    "problem": "Schedule prerequisites with Kahn topological ordering on a synthetic business fixture.",
    "steps": [
      "State the input contract and identify the invariant that must hold before each operation.",
      "Execute the fixture and follow each update using the displayed representation.",
      "Compare the result against the expected output and derive costs under the stated operation model."
    ],
    "code": "from collections import deque\ndef order(g):\n    indegree={v:0 for v in g}\n    for ns in g.values():\n        for v in ns: indegree[v]+=1\n    q=deque(v for v in g if indegree[v]==0); out=[]\n    while q:\n        u=q.popleft(); out.append(u)\n        for v in g[u]:\n            indegree[v]-=1\n            if indegree[v]==0: q.append(v)\n    return out if len(out)==len(g) else None\nprint(order({\"fetch\":[\"compile\"],\"compile\":[\"test\"],\"test\":[],\"docs\":[]}))\nprint(order({\"A\":[\"B\"],\"B\":[\"A\"]}))",
    "expect": "['fetch', 'docs', 'compile', 'test']\nNone",
    "limit": "The order is a precedence solution rather than an optimized parallel schedule. Concurrent execution requires waiting for actual prerequisite completion, not merely queue removal.",
    "mistakes": [
      "The order is a precedence solution rather than an optimized parallel schedule. Concurrent execution requires waiting for actual prerequisite completion, not merely queue removal.",
      "Verify the contract and base cases before extending this fixture to production inputs."
    ],
    "takeaways": [
      "Remaining indegree is the scheduling invariant: Orient each edge from prerequisite to dependent, calculate indegree for every vertex and enqueue all zero-indegree vertices.",
      "Detect incomplete removal rather than returning a false success: If fewer than V vertices are removed, the residual graph has no zero-indegree vertex but still contains vertices."
    ],
    "practice": [
      "Which vertices initially enter Kahn\u2019s ready queue?|Vertices with indegree zero|Vertices with greatest outdegree|Only the alphabetically first vertex|Every sink regardless of prerequisites|Zero indegree means no prerequisite remains before any task has been removed.",
      "What does a topological order guarantee for edge u to v?|u appears before v|u and v appear consecutively|v appears before u|u and v have equal duration|Each directed prerequisite edge must point forward in the produced sequence.",
      "A graph has A to C and B to C. After removing only A, may C be ready?|No, B is still a prerequisite|Yes, one incoming edge is enough|Only if C is a sink|Only if labels sort as A,B,C|C becomes ready only after both incoming prerequisites have been removed.",
      "A build queue removes fewer than V tasks and then empties. What does that prove?|A directed cycle remains|The graph has no edges|Every task has completed|The order is unique|An unremoved finite residual graph with no zero-indegree vertex contains a directed cycle.",
      "A team wants lexical choice whenever several tasks are ready. What ready structure fits?|A min-heap of ready labels|A random vertex stack|A matrix of every possible path|A set of all finished task durations|A min-heap selects the smallest ready label while preserving the indegree eligibility rule.",
      "A graph import counts duplicate edges in indegree but decrements each distinct neighbor once. What breaks?|Remaining indegrees can stay too high|The source labels become negative|Every cycle is automatically removed|The adjacency memory becomes constant|Counting and removal must use the same edge multiplicity to maintain remaining indegree accurately."
    ],
    "formal": [
      "Which class of graph admits a topological ordering?|Directed acyclic graphs|Every directed graph|Only complete undirected graphs|Only graphs with one vertex|A topological order exists exactly when the directed graph has no cycle.",
      "When does Kahn\u2019s algorithm enqueue a newly available neighbor?|When its remaining indegree reaches zero|Whenever any incoming edge is seen|After sorting all graph vertices again|When its outdegree becomes largest|The transition to zero proves all unremoved prerequisite edges have been discharged.",
      "What bound applies to deque-based Kahn processing on adjacency lists?|O(V+E)|O(V factorial)|O(E squared) necessarily|O(log V)|Each vertex enters once and each outgoing edge causes one indegree decrement.",
      "A build graph has ready tasks A and B with no edge between them. What can be true?|Either order can be valid|Only A can legally be first|Only B can legally be first|The graph must contain a cycle|Unconstrained ready tasks can be selected in either order while respecting all prerequisite edges.",
      "A deployment tool returns a valid topological order. Does this alone minimize completion time with two workers?|No, duration and resource scheduling remain|Yes, any valid order is makespan optimal|Only if labels are sorted|Only if the queue uses a deque|Precedence feasibility and resource-constrained parallel scheduling are different optimization requirements.",
      "A graph has A to B, B to C, and C to B, plus isolated D. Which tasks can Kahn remove before blocking?|A and D|B and C only|Every task|Only C|A and D have no unresolved prerequisites, but B and C remain mutually blocked.",
      "An order is [A,C,B] for edges A to B and B to C. Which edge violates the order?|B to C|A to B|Neither edge|Both edges equally|C appears before its prerequisite B, so that edge points backward in the proposed ordering.",
      "A task queue marks dependents runnable when a prerequisite is merely assigned to a worker. What additional condition is needed?|Actual successful prerequisite completion|Alphabetical assignment order|A larger global vertex count|Deletion of every incoming edge from storage|A static topological list orders tasks, but concurrent execution must respect completion rather than dispatch alone.",
      "A cyclic build graph yields a nonempty removable prefix. What result should the API avoid?|Reporting that prefix as a complete valid order|Returning cycle diagnostics|Showing successfully removable tasks separately|Counting unremoved vertices|A partial prefix does not order all vertices and cannot be advertised as full DAG scheduling success.",
      "A build planner must detect cycles, preserve duplicate-edge meaning and produce lexical ready-task priority. Which algorithm satisfies the constraints and states its extra cost?|Kahn with consistent indegrees and a ready min-heap|FIFO Kahn with a claim of forced lexical order|Sort task labels once and ignore dependencies|DFS without cycle checks and a claim of uniqueness|Consistent edge counts maintain eligibility, heap choice enforces lexical priority, and ready operations add O(V log V) work to edge scanning."
    ]
  },
  {
    "slug": "dag-paths",
    "title": "Relax DAG paths in dependency order and audit algorithm contracts",
    "intro": "A project forecast needs earliest completion times along prerequisite chains, while a promotional route graph can include negative discounts without cycles. Topological order lets dynamic path calculations process every predecessor before its dependent.",
    "sections": [
      [
        "DAG relaxation needs no nonnegative-weight restriction",
        "For shortest paths in a DAG, initialize the source to zero and others to infinity. Process vertices in topological order and relax each outgoing edge. Every path into u ends at an earlier predecessor, so when u is processed its best source distance is complete. Negative edge weights are allowed because no cycle can bring a later improvement back to an already processed predecessor. Skip unreachable vertices instead of adding weights to an absent distance.",
        "For longest paths in a DAG, use negative infinity for unreachable state and replace minimum with maximum. Project earliest-finish time uses finish[v]=duration[v]+max finish[p] over predecessors p, with zero predecessor contribution for source tasks. This is a critical-path model under unlimited parallelism and no resource conflicts; it is a lower bound on completion time when a real worker limit forces extra serialization."
      ],
      [
        "Choose the solver from the business and mathematical contract",
        "Use BFS for equal-cost hop objectives, Dijkstra for arbitrary nonnegative edge costs and topological relaxation for weighted DAGs, including negative weights. A cycle invalidates topological relaxation; a negative edge invalidates the standard Dijkstra proof; a weighted objective invalidates ordinary BFS distance optimality. Graph size and storage determine practical feasibility only after correctness assumptions have been checked.",
        "Given a valid order, DAG relaxation inspects each vertex and edge once for O(V+E) time and O(V) distance and parent state. Producing the topological order also takes O(V+E) with deque Kahn. The fixture includes a negative discount and checks the resulting shortest route; a separate longest-chain calculation would need maximum state updates rather than reusing minimum values."
      ]
    ],
    "problem": "Relax DAG paths in dependency order and audit algorithm contracts on a synthetic business fixture.",
    "steps": [
      "State the input contract and identify the invariant that must hold before each operation.",
      "Execute the fixture and follow each update using the displayed representation.",
      "Compare the result against the expected output and derive costs under the stated operation model."
    ],
    "code": "g={\"S\":[(\"A\",4),(\"B\",7)],\"A\":[(\"B\",-3),(\"T\",8)],\"B\":[(\"T\",2)],\"T\":[]}\norder=[\"S\",\"A\",\"B\",\"T\"]; dist={\"S\":0}\nfor u in order:\n    if u not in dist: continue\n    for v,w in g[u]:\n        candidate=dist[u]+w\n        if candidate<dist.get(v,float(\"inf\")): dist[v]=candidate\nprint(dist)\nprint(all(order.index(u)<order.index(v) for u in g for v,w in g[u]))",
    "expect": "{'S': 0, 'A': 4, 'B': 1, 'T': 3}\nTrue",
    "limit": "The fixture supplies and verifies a topological order. Arbitrary production input must first obtain such an order and reject cycles; negative-cycle behavior is outside this DAG contract.",
    "mistakes": [
      "The fixture supplies and verifies a topological order. Arbitrary production input must first obtain such an order and reject cycles; negative-cycle behavior is outside this DAG contract.",
      "Verify the contract and base cases before extending this fixture to production inputs."
    ],
    "takeaways": [
      "DAG relaxation needs no nonnegative-weight restriction: For shortest paths in a DAG, initialize the source to zero and others to infinity.",
      "Choose the solver from the business and mathematical contract: Use BFS for equal-cost hop objectives, Dijkstra for arbitrary nonnegative edge costs and topological relaxation for weighted DAGs, including negative weights."
    ],
    "practice": [
      "Why can weighted DAG shortest paths allow negative edges?|No later return path is possible|A heap turns negatives into positives|Negative weights are ignored|All DAG edges have equal cost|Every predecessor is finalized before its dependent, and cycles cannot carry improvements back.",
      "What aggregation gives a DAG longest-path update?|Maximum candidate path value|Minimum candidate path value|Number of vertex labels|Alphabetical predecessor order|Longest-path dynamic programming chooses the largest reachable predecessor extension.",
      "A DAG has S-A cost 5, A-T cost -4 and S-T cost 3. What is shortest S-T cost?|1|3|5|9|The path through A costs five minus four, improving the direct cost three.",
      "A project task lasts 3 units and its latest prerequisite finishes at time 8. Under unlimited workers, when does it finish?|11|8|5|24|The task starts after its latest prerequisite and then consumes its own duration, giving eleven.",
      "A graph has unit edges and the goal is fewest transfer links. Which solver is sufficient?|BFS|Dijkstra with negative-edge support assumed|Topological sort without traversal|A longest-path update|Equal edge costs make hop layers optimal, so ordinary BFS supplies the required minimum link count.",
      "A proposed dependency order puts a vertex before one predecessor. What DAG-path guarantee is lost?|Predecessors are finalized|The vertex labels remain hashable|The graph has finite storage|Every edge still has a weight|Processing too early can miss a later predecessor improvement and fail to propagate it downstream."
    ],
    "formal": [
      "What initial state represents unreachable vertices in minimum-path DP?|Positive infinity or an absent entry|Zero for every vertex|Negative infinity for every vertex|The vertex\u2019s outdegree|Unreachable state must not compete as a real zero-cost path from the source.",
      "What graph property makes topological relaxation applicable?|Acyclic directed edges|Every edge has positive weight|Every vertex has equal degree|Exactly one connected component|A valid topological order requires an acyclic directed graph, regardless of weight signs.",
      "What is the path-relaxation bound after obtaining a DAG order?|O(V+E)|O(V squared) for all graphs|O(E factorial)|O(log V)|The ordered pass visits each vertex once and scans each edge once.",
      "A discount route graph is acyclic but includes cost -6. Which shortest-path method fits directly?|Topological DAG relaxation|Ordinary BFS ignoring prices|Dijkstra justified solely by no negative cycles|Descending-degree traversal|DAG order safely supports negative weights because every predecessor is processed before its successors.",
      "A worker-limited project takes longer than its longest precedence chain. Does that refute critical-path arithmetic?|No, resource contention adds delay|Yes, longest chains always equal real makespan|Only if there is an isolated task|Only when durations are integers|Critical-path duration assumes unlimited parallelism and is a lower bound when workers constrain concurrency.",
      "A DAG shortest-path pass processes an unreachable vertex with no stored distance. What should it do?|Skip its outgoing relaxation|Assign it zero and continue|Make it the new global source|Subtract its outdegree from every distance|No source path reaches that vertex, so its outgoing edges cannot extend a valid source path.",
      "A team reuses a min-path recurrence to calculate the longest project chain. What must change?|Maximize; use negative infinity|Only reverse each string label|Only change the output heading|Replace every duration by zero|Longest paths require maximizing reachable predecessor extensions rather than minimizing them.",
      "A graph audit finds a directed cycle before a DAG relaxation run. What should happen?|Reject the DAG method for this input|Keep the supplied arbitrary vertex order|Ignore the cycle\u2019s final edge silently|Claim negative weights cannot matter|A cycle means no topological order exists, invalidating the ordered predecessor-completion proof.",
      "A shortest-path API uses BFS for a graph with weights 2 and 5 and claims minimum total price. Which assumption is missing?|Uniform edge cost for hop optimality|Unique names for all edges|A guarantee of at least two components|Nonempty output formatting|Fewest edges and minimum total weight are different objectives when edge costs vary.",
      "A route planner has a verified DAG, arbitrary finite signed edge costs and a linear edge-scan budget. Which algorithm and justification fit?|Topological relaxation in O(V+E)|BFS; first discovery minimizes any weighted sum|Dijkstra; heaps support negative-edge finalization|Enumerate every simple route; claim linear work|Acyclicity supplies an order that finalizes all incoming contributions in one pass, achieving O(V+E) without a nonnegative-weight requirement."
    ]
  }
]);
