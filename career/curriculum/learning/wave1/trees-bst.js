'use strict';
const {course}=require('./wave4-dsa-helper');
module.exports=course('trees-bst',[
  {
    "slug": "depth-orders",
    "title": "Choose preorder, inorder and postorder for tree work",
    "intro": "A document tree supports several reports: a parent-first outline, an ordered key listing and a child-first cleanup plan. Traversals visit the same nodes but place the node action at different stages. Model the action timing explicitly before selecting an algorithm.",
    "sections": [
      [
        "Three visits around the children",
        "For a binary node, preorder emits the node then traverses left and right. Inorder traverses left, emits the node, then traverses right. Postorder traverses left and right before emitting the node. Empty subtrees produce no output and form the base case. Each traversal visits each node once when the input is a finite tree.",
        "The traversal contract includes a left/right order. A general document tree may have many ordered children, for which preorder and postorder extend naturally; binary inorder depends on the two-child representation. An inorder listing is sorted only when the tree also satisfies a binary-search ordering invariant. Arbitrary binary trees do not become ordered just because their traversal is named inorder."
      ],
      [
        "Work and ownership",
        "With N nodes and constant work per node, all three depth-first traversals take O(N) time and O(h) recursive frames, excluding the output sequence, for height h. Materializing N emitted values adds O(N) output storage. A highly skewed tree can make h proportional to N and exceed Python call-depth limits.",
        "Use preorder for parent-first descriptions and postorder when a parent action requires completed children. Tree serialization needs shape information as well as values; preorder values alone cannot always reconstruct an arbitrary binary tree. Null markers or another valid reconstruction contract distinguish missing children. The fixture reports three orders on one small immutable tree."
      ]
    ],
    "problem": "Compare the three depth-first action timings on a binary document tree.",
    "steps": [
      "Define the node, key and structural invariants for the synthetic fixture.",
      "Trace structural operations and state which ordering or prefix property is preserved.",
      "Check outputs and derive time and live-state bounds from tree height, width or key length."
    ],
    "code": "tree=(\"A\",(\"B\",None,None),(\"C\",(\"D\",None,None),None))\ndef orders(node):\n    if node is None: return [],[],[]\n    value,left,right=node\n    lp,li,lo=orders(left); rp,ri,ro=orders(right)\n    return [value]+lp+rp, li+[value]+ri, lo+ro+[value]\nfor result in orders(tree): print(result)",
    "expect": "['A', 'B', 'C', 'D']\n['B', 'A', 'D', 'C']\n['B', 'D', 'C', 'A']",
    "limit": "This compact fixture concatenates result lists; on skewed trees those copies can add quadratic work. The O(N) traversal bound applies to emitting into one shared output or streaming, not this concatenating representation.",
    "mistakes": [
      "Inorder is sorted only under a BST invariant, not for every binary tree.",
      "Preorder values without null markers may lose structural information."
    ],
    "takeaways": [
      "Traversal names specify node-action timing.",
      "Include output copying and tree shape in the complexity model."
    ],
    "practice": [
      "Which traversal emits a node before either child?|Preorder|Inorder|Postorder|Level order only|Preorder performs the action on entry to a node.",
      "Which traversal emits left subtree, then node, then right subtree?|Inorder|Preorder|Postorder|Reverse arrival order|Inorder places the node action between its two child traversals.",
      "Which traversal fits child-first resource cleanup?|Postorder|Preorder|Inorder always|Alphabetical order|Postorder completes both subtrees before acting on the parent.",
      "Does inorder sort an arbitrary binary tree\u2019s values?|No|Yes|Only if it has even size|Only if all values are strings|Sorted output additionally requires a binary-search ordering invariant.",
      "What is the output for an empty subtree?|No emitted nodes|One zero node|The parent\u2019s value again|An automatic new leaf|The base case contributes an empty traversal.",
      "Why can repeated recursive list concatenation exceed linear work?|Earlier subtree outputs are recopied|Every node has more than two children|Python lists are linked nodes|All traversals require sorting|Repeated copies on a skewed tree can sum to quadratic movement."
    ],
    "formal": [
      "What traversal emits a node after both child subtrees?|Postorder|Preorder|Inorder|Priority order|Postorder defers the parent action until its descendants finish.",
      "What is the base case for a missing binary subtree?|Return without visiting a node|Allocate a replacement root|Repeat the parent call|Sort the remaining nodes|A missing subtree contributes no node action.",
      "How many node actions occur in a full traversal of an N-node tree?|N|h only|N squared always|log N|Each node is acted on exactly once.",
      "A document tree has root R, left leaf L and right leaf Q. What is its preorder?|R,L,Q|L,R,Q|L,Q,R|Q,L,R|The parent is emitted first, followed by left and right.",
      "A report uses the same R/L/Q tree. What is its inorder?|L,R,Q|R,L,Q|Q,R,L|L,Q,R|Inorder emits left, then parent, then right.",
      "A cleanup plan uses the same R/L/Q tree. What is its postorder?|L,Q,R|R,L,Q|L,R,Q|Q,R,L|Both children precede the parent.",
      "A serializer writes only preorder values for a binary tree with one root and one child. Why is shape ambiguous?|The child could be left or right|The root value is always lost|Preorder cannot visit leaves|Both trees must be balanced|Without null markers or equivalent structure, either child position yields the same value sequence.",
      "A depth-first traversal appends every node once into one shared list. What bounds apply for N nodes and height h?|O(N) time; O(h) stack; O(N) output|O(log N) time, O(1) total storage|O(N squared) time for every tree|O(1) time, O(N) frames|Per-node work is constant while stack and output storage have distinct bounds.",
      "An implementation forms left_output+[node]+right_output at each ancestor of a chain. What movement cost can arise?|Theta(N squared)|Theta(log N)|O(1)|Theta(N) guaranteed|Each ancestor copies a growing subtree result, summing one through N.",
      "A document service needs a lossless binary-tree serialization with repeated values and a parent-first stream, using O(h) traversal state excluding emitted data. Which design fits?|Preorder traversal with explicit missing-child markers|Inorder values without structure|Sorting all values then discarding node links|Preorder values alone with no reconstruction contract|Preorder plus null markers records both node values and branching structure, and depth-first state scales with height."
    ]
  },
  {
    "slug": "breadth-shape",
    "title": "Measure hierarchy width with level-order traversal",
    "intro": "An operations dashboard groups a management hierarchy by distance from its root. Level-order traversal uses a FIFO frontier to emit all nodes of one depth before the next. Its memory requirement follows tree width rather than the height that governs depth-first traversal.",
    "sections": [
      [
        "Levels and boundaries",
        "Initialize a queue with the root when it exists. At the beginning of each level, record the current queue length and remove exactly that many nodes. Append their children for the following level. The fixed level count prevents newly enqueued children from being included in the current row.",
        "A node at depth d has d parent-child edges from the root. Height can count edges or nodes, so state the convention: this course uses edge height zero for a singleton and negative one for an empty tree when needed. The number of nonempty levels is h+1. In a binary tree, level d has at most 2^d nodes."
      ],
      [
        "Space and shape",
        "For N nodes, level-order work is O(N). The frontier can contain nodes from the current and next levels, so it is O(w), where w is maximum level width, up to a constant factor. A broad balanced tree may need a large frontier while a long chain has width one. Collecting all level lists additionally retains O(N) output.",
        "Completeness, fullness and balance are different shape properties. A perfect binary tree has every internal node with two children and all leaves at one depth; it has 2^(h+1)-1 nodes. A complete binary tree fills levels left to right, allowing a partial final level. A full binary tree gives every node zero or two children but need not have shallow height."
      ]
    ],
    "problem": "Collect hierarchy levels while separating newly scheduled children from the current level.",
    "steps": [
      "Define the node, key and structural invariants for the synthetic fixture.",
      "Trace structural operations and state which ordering or prefix property is preserved.",
      "Check outputs and derive time and live-state bounds from tree height, width or key length."
    ],
    "code": "from collections import deque\ntree=(\"A\",(\"B\",None,None),(\"C\",(\"D\",None,None),None))\nq=deque([tree]); levels=[]\nwhile q:\n    level=[]\n    for _ in range(len(q)):\n        value,left,right=q.popleft(); level.append(value)\n        if left is not None:q.append(left)\n        if right is not None:q.append(right)\n    levels.append(level)\nprint(levels)\nprint(max(map(len,levels)))",
    "expect": "[['A'], ['B', 'C'], ['D']]\n2",
    "limit": "The fixture is a finite binary tree. It materializes levels, so total retained output is linear even when the frontier is narrow.",
    "mistakes": [
      "Using a changing queue length as the loop condition can mix later levels into the current row.",
      "A full binary tree is not necessarily perfect or balanced."
    ],
    "takeaways": [
      "Freeze the current frontier count to define one level.",
      "Choose frontier memory estimates using width, not only height."
    ],
    "practice": [
      "What is the root depth under the edge-count convention?|0|1|-1|The node count|The root has zero parent-child edges from itself.",
      "Why snapshot queue length at the start of a level?|To process only that level\u2019s nodes|To prevent all child discovery|To sort the level by payload|To make every tree perfect|Children appended during processing belong to the next level.",
      "What shape measure bounds a BFS frontier up to a constant factor?|Maximum level width|Only recursive height|Total key magnitude|Number of null markers|The queue holds portions of adjacent levels.",
      "How many nodes can binary level three contain at most?|8|3|6|16|At most two children per node gives 2 to the third nodes.",
      "What is a perfect binary tree of edge height two\u2019s node count?|7|4|6|8|The complete levels contain one plus two plus four nodes.",
      "Does a full binary tree necessarily have logarithmic height?|No|Yes|Only if keys are strings|Only if traversal is iterative|A full tree can remain highly skewed while each internal node has two children."
    ],
    "formal": [
      "Which traversal groups nodes by root distance?|Level order|Postorder|Inorder|Heap extraction|A FIFO traversal visits successive depth layers.",
      "What is singleton edge height?|Zero|One|Minus one|Two|A singleton\u2019s longest root-to-leaf path contains zero edges.",
      "What is a complete binary tree\u2019s final-level placement rule?|Filled from left to right|Filled from right to left|Only odd positions exist|Every leaf must share one depth|Completeness allows a partial last level but forbids gaps before its occupied positions.",
      "A hierarchy is a chain of 1000 nodes. What is its maximum level width?|1|1000|500|10|There is exactly one node at each depth.",
      "A perfect binary tree has edge height four. How many leaves does it have?|16|4|15|31|All leaves occupy level four, which contains 2 to the fourth nodes.",
      "A perfect binary tree has 31 total nodes. What is its edge height?|4|5|15|30|31 equals 2 to the fifth minus one, so height is four.",
      "A dashboard chooses BFS for a very broad hierarchy and claims O(height) frontier memory. Which correction applies?|Frontier memory depends on width|Every BFS uses constant space|Only payload bytes matter|Height always equals width|BFS may retain a whole broad level even when depth is small.",
      "A loop processes while count<len(queue) and appends children inside the same loop. What should be changed for stable level boundaries?|Capture the level size once|Recompute the length after every append|Replace every child with its parent|Sort the entire queue after each pop|A fixed initial count separates current-level work from newly appended children.",
      "A service streams each completed level instead of retaining all level lists. Which storage reduction is possible?|Remove cumulative O(N) output retention|Remove the current frontier for every tree|Remove the input nodes automatically|Reduce required visits below N|Streaming avoids collecting previous output levels, but current traversal state remains.",
      "A hierarchy export must process N nodes, emit depth groups, retain no past output and fit a frontier budget B. Which admission metric directly matters?|Peak live frontier across levels|Only maximum recursive depth|Only the root\u2019s key length|Whether the tree is named complete|BFS space is controlled by simultaneously pending layer nodes, while streaming removes accumulated output storage."
    ]
  },
  {
    "slug": "iterative-inorder",
    "title": "Walk ordered nodes with an explicit ancestor stack",
    "intro": "A directory index may become deep enough that recursive inorder traversal is unsafe. An explicit ancestor stack reproduces left-node-right order while allowing incremental output. The stack records ancestors whose own actions and right subtrees are still pending.",
    "sections": [
      [
        "Left descent invariant",
        "Keep cur as the next subtree to descend and stack as its unfinished ancestor path. Push cur while moving left until cur is None. Pop the closest pending ancestor, emit it, then set cur to its right child. Each node is pushed once and popped once. The left subtree has finished when its ancestor is emitted.",
        "This procedure works on any binary tree, but its emitted values are sorted only for a valid BST. To produce the kth smallest key in a strict BST, count emitted nodes and stop at k. The work is O(h+k) in the usual traversal accounting, and extra state is O(h); stopping early does not require materializing all N values."
      ],
      [
        "Empty, deep and changing trees",
        "The loop condition is stack or cur is not None because pending ancestors can remain after reaching a missing child. A loop that checks only cur can terminate at the first leaf and lose the rest of the tree. Explicit storage avoids interpreter recursion depth, but a skewed path still requires O(h) ancestor references.",
        "Traversal assumes stable links. Concurrent rotations or deletions can cause missing or repeated records unless the index supplies a snapshot, a lock or a documented weak-consistency iterator. The example builds a tiny immutable tree so its inorder sequence and stop behavior can be checked without concurrency or production data."
      ]
    ],
    "problem": "Yield inorder values incrementally using an explicit ancestor stack.",
    "steps": [
      "Define the node, key and structural invariants for the synthetic fixture.",
      "Trace structural operations and state which ordering or prefix property is preserved.",
      "Check outputs and derive time and live-state bounds from tree height, width or key length."
    ],
    "code": "def inorder(root):\n    stack=[]; cur=root\n    while stack or cur is not None:\n        while cur is not None:\n            stack.append(cur); cur=cur[1]\n        cur=stack.pop(); yield cur[0]; cur=cur[2]\ntree=(4,(2,(1,None,None),(3,None,None)),(6,None,None))\nvalues=inorder(tree)\nprint(next(values),next(values))\nprint(list(values))\nprint(list(inorder(None)))",
    "expect": "1 2\n[3, 4, 6]\n[]",
    "limit": "The generator retains an ancestor path and emits values lazily. O(h) auxiliary space excludes any caller-created list of all outputs.",
    "mistakes": [
      "Checking only cur loses pending ancestors when left descent reaches None.",
      "Calling a generator lazy does not mean the caller can materialize unlimited outputs within constant memory."
    ],
    "takeaways": [
      "An explicit ancestor stack preserves inorder return timing.",
      "Iterator consistency must be defined when structural mutation is allowed."
    ],
    "practice": [
      "What does the explicit inorder stack retain?|Unfinished ancestors|All emitted records forever|Only rightmost leaves|Sorted copies of all subtrees|Each stacked ancestor still awaits its node action or right subtree.",
      "What follows emitting a popped node?|Descend into its right subtree|Restart from the root|Clear every pending ancestor|Visit its left subtree again|The left subtree is complete, so inorder continues right.",
      "Which outer guard preserves pending ancestors?|stack or cur is not None|cur is not None only|stack is empty only|root.value is positive|Either a subtree or an unfinished ancestor can supply more work.",
      "How often is one node pushed in the standard inorder walk?|Once|Once per output before it|N times always|Never if it has a right child|Every node enters the ancestor path on its one initial descent.",
      "What does an empty root yield?|No values|One None payload|The previous root value|An exception by contract|No current node or pending frame exists.",
      "What resource remains depth-dependent after removing recursion?|Ancestor-reference storage|Interpreter recursive-call count|Only network bandwidth|No resource at all|The explicit stack can hold a full root-to-leaf path."
    ],
    "formal": [
      "When is a node emitted in iterative inorder?|After left, before right|Before both children|After both children|Only after the entire tree|The ancestor stack resumes at the point between child traversals.",
      "What input property makes inorder keys ascending?|The BST ordering invariant|A binary shape alone|A perfect shape alone|Unique node labels alone|All left descendants must be smaller and all right descendants larger under the chosen policy.",
      "What is full inorder traversal time with one push/pop per node?|O(N)|O(log N)|O(N squared) necessarily|O(1)|Every node incurs a constant number of stack operations.",
      "A strict BST contains keys 1,2,3,4,6. Which values appear in its first three inorder emissions?|1,2,3|4,2,1|6,4,3|2,3,4|Valid BST inorder produces increasing keys.",
      "A kth-smallest API stops after k inorder emissions. Which bound includes initial descent?|O(h+k)|O(k) regardless of height|O(log k) always|O(N squared)|The initial ancestor path can cost h before the first output, followed by amortized traversal steps.",
      "A tree is a chain of N left children. What peak ancestor stack size can occur?|Theta(N)|O(1)|Theta(log N)|Zero|All ancestors are pushed before the first node is emitted.",
      "A developer writes while cur is not None as the only outer condition. What can be lost after a leaf is emitted?|Pending ancestor and right-subtree work|The tree\u2019s allocated root identity|Every already yielded value|Only duplicate payloads|The stack can remain nonempty even when cur is None.",
      "A consumer turns the inorder generator into list(...). What storage must now be counted?|O(N) retained output references|Only O(1) output state|No memory because it began as a generator|Only the root node|Materializing all emitted values adds output-size storage.",
      "A tree rotates concurrently while an inorder iterator holds ancestor references. What design question matters?|Iterator consistency guarantees|Whether integers are comparable|Whether the tree has a name|Only the output separator|Changing structure can invalidate the assumed traversal path and ordering behavior.",
      "A sorted-index API needs the first k keys, must avoid recursive calls, and may retain O(h) traversal references but no full output list. Which plan fits?|Inorder stack; stop after k outputs|Recursively concatenate every subtree result first|BFS with an assertion that levels are sorted|Sort all node values after collecting them|The generator preserves BST order, avoids call depth and can stop without storing the complete traversal."
    ]
  },
  {
    "slug": "bst-paths",
    "title": "Search and insert with a global ordering contract",
    "intro": "A mutable numeric index routes smaller keys left and larger keys right. Every search decision discards an entire subtree because the ordering rule applies to all descendants, not only immediate children. The tree height determines path length and can vary greatly with insertion order.",
    "sections": [
      [
        "Path invariant and duplicates",
        "For a strict BST, all keys in a node\u2019s left subtree are smaller than its key, and all right-subtree keys are larger. Search compares target with the current key and follows exactly one child when unequal. Insert follows the same path until a missing child is found, then attaches a leaf there.",
        "Choose a duplicate policy first: reject, update an existing payload, or retain a count at the matching node. Placing duplicates arbitrarily on either side makes validation and range-query contracts ambiguous. The fixture treats an equal key as already present and leaves the tree unchanged, preserving strict ordering."
      ],
      [
        "Height and workload",
        "Search and insert take O(h+1) comparisons for edge height h, excluding key-comparison bit cost. A balanced N-node tree has h=O(log N), but sorted insertion into an unbalanced BST creates a chain with h=N-1. Inserting N increasing distinct keys can therefore take Theta(N squared) total comparisons.",
        "A BST supports ordered operations that an unordered hash table does not directly provide, such as successor and range iteration. A hash table may offer expected constant-time exact lookup under appropriate assumptions, while balanced trees give logarithmic ordered paths. Pick based on required operations, memory and update behavior rather than assuming every structure called a tree is logarithmic."
      ]
    ],
    "problem": "Insert keys without duplicates and search using the same strict ordering rule.",
    "steps": [
      "Define the node, key and structural invariants for the synthetic fixture.",
      "Trace structural operations and state which ordering or prefix property is preserved.",
      "Check outputs and derive time and live-state bounds from tree height, width or key length."
    ],
    "code": "class Node:\n    def __init__(self,key): self.key=key; self.left=self.right=None\ndef insert(root,key):\n    if root is None:return Node(key)\n    cur=root\n    while True:\n        if key==cur.key:return root\n        side=\"left\" if key<cur.key else \"right\"\n        child=getattr(cur,side)\n        if child is None:setattr(cur,side,Node(key)); return root\n        cur=child\ndef contains(root,key):\n    while root is not None:\n        if key==root.key:return True\n        root=root.left if key<root.key else root.right\n    return False\nroot=None\nfor key in [4,2,6,1,3,2]:root=insert(root,key)\nprint(contains(root,3),contains(root,5))\nprint(root.left.key,root.left.right.key)",
    "expect": "True False\n2 3",
    "limit": "This unbalanced BST has a reject-existing-key policy. Its O(h) path bound does not promise logarithmic height for arbitrary insertions.",
    "mistakes": [
      "A balanced-looking sample does not establish worst-case height after future updates.",
      "An unstated duplicate policy creates inconsistent search and validation semantics."
    ],
    "takeaways": [
      "BST ordering is a descendant-wide invariant.",
      "Express path complexity in height before substituting a balance guarantee."
    ],
    "practice": [
      "Which subtree contains a smaller target in a strict BST?|Left|Right|Both always|Neither unless balanced|Every right-subtree key exceeds the current key.",
      "What does the fixture do on an existing equal key?|Leave the tree unchanged|Insert equal copies on both sides|Delete the existing key|Reverse both children|Its explicit policy rejects a duplicate insertion.",
      "Where is a new distinct key attached?|At a missing search link|Always as the root|Always at the leftmost leaf|At a random existing node|Following comparisons finds the only valid leaf position for this shape.",
      "What determines unbalanced BST search path length?|Tree height|Only leaf payload size|Always log N|Always one comparison|A path can extend from root to deepest leaf.",
      "What shape can increasing insertion order produce without balancing?|A rightward chain|A perfect tree always|A max-heap array|A cycle automatically|Every new key exceeds all earlier keys and follows right children.",
      "Why choose an ordered tree over a plain hash index in some workloads?|Range and successor operations|All tree operations are constant time|Trees cannot have collisions in values|Trees never allocate nodes|Ordered structure supports navigation by key order."
    ],
    "formal": [
      "What relation holds for every left descendant in a strict BST?|It is smaller than the ancestor key|It is only smaller than its parent when convenient|It equals the root always|It is larger than every right descendant only|The invariant restricts whole subtrees, not just immediate children.",
      "When does a failed BST search terminate?|At a missing child|At the first larger key always|Only after visiting every node|When the root is balanced|A missing path link proves the target has no location under the invariant.",
      "What is search complexity in terms of edge height h?|O(h+1)|O(log h) always|O(N squared)|O(1) always|At most one comparison per node along one root-to-leaf path is needed.",
      "An index inserts 1,2,3,4 into an initially empty unbalanced BST. What is its edge height?|3|2|1|0|Each larger key extends the rightward chain by one edge.",
      "A lookup in that chain searches for 4. How many key nodes are inspected?|4|1|2|3|The search follows keys one, two, three and four.",
      "An index rejects duplicate keys. After inserting [5,3,7,3], how many nodes exist?|3|4|2|1|The second insertion of three does not create a node.",
      "A reviewer calls every BST search O(log N). Which assumption is missing?|A guaranteed logarithmic height|Unique payload display names|An odd node count|A FIFO traversal|An unbalanced BST may have linear height.",
      "A workload inserts N increasing keys into an ordinary unbalanced BST. What total comparison growth can occur?|Theta(N squared)|Theta(log N)|Theta(N)|O(1)|Successive search paths have lengths growing from zero through N-1.",
      "A service needs repeated key-range scans as well as logarithmic exact lookup. Which structure supplies the required ordered guarantee under updates?|A balanced search tree|An unbalanced BST with arbitrary insertion|A plain unordered set without extra ordering|A stack of arrival events|Maintained balancing bounds path height while preserving key order.",
      "A mutable index accepts distinct adversarial keys, needs worst-case O(log N) lookup and insertion, and must enumerate ranges in key order. Which design is justified?|A self-balancing BST with explicit duplicate and update contracts|A plain BST justified by one random benchmark|A sorted singly linked list with logarithmic indexed access assumed|A heap used as if every subtree were BST ordered|Balanced search-tree invariants give logarithmic paths and ordered traversal under arbitrary valid insertion sequences."
    ]
  },
  {
    "slug": "validate-bounds",
    "title": "Validate BST descendants with inherited strict bounds",
    "intro": "A migrated index passes a check that each left child is smaller than its parent and each right child larger. Yet a deep descendant can violate an ancestor\u2019s ordering range. Carry inherited bounds to validate the complete strict-BST invariant.",
    "sections": [
      [
        "Propagate ancestor restrictions",
        "Start with no lower or upper bound. For node key x, reject when x is not strictly above a present lower bound or strictly below a present upper bound. Its left child inherits the old lower bound and upper x; its right child inherits lower x and the old upper bound. Every ancestor restriction remains in the permitted interval.",
        "For root ten, left child five and five\u2019s right child twelve, the local child checks pass: five<ten and twelve>five. The inherited upper bound ten rejects twelve because it lies anywhere in the root\u2019s left subtree. Strict inequalities also reject duplicates under this course\u2019s unique-key policy."
      ],
      [
        "Alternative validation and cost",
        "An inorder traversal of a finite binary tree can validate a strict BST by checking that each emitted key is greater than the previous key. This is equivalent under a coherent total ordering and the strict no-duplicates policy. A bound validator makes the specific violated ancestor interval easier to report.",
        "Each node is checked once, giving O(N) time under fixed-cost comparisons and O(h) recursive frames, or explicit frames if implemented iteratively. Numeric sentinels such as zero are invalid universal bounds when negative keys are allowed; use an absent-bound marker. Cycles and multiple-parent identity constraints are separate structural checks when input is not guaranteed to be a tree."
      ]
    ],
    "problem": "Reject an ancestor-range violation that a parent-only test would miss.",
    "steps": [
      "Define the node, key and structural invariants for the synthetic fixture.",
      "Trace structural operations and state which ordering or prefix property is preserved.",
      "Check outputs and derive time and live-state bounds from tree height, width or key length."
    ],
    "code": "def valid(node,lo=None,hi=None):\n    if node is None:return True\n    key,left,right=node\n    if lo is not None and key<=lo:return False\n    if hi is not None and key>=hi:return False\n    return valid(left,lo,key) and valid(right,key,hi)\nbad=(10,(5,None,(12,None,None)),None)\ngood=(10,(5,None,(8,None,None)),(14,None,None))\nprint(valid(bad),valid(good))\nprint(valid((-2,(-3,None,None),None)))",
    "expect": "False True\nTrue",
    "limit": "The fixture supports ordered numeric keys and assumes an acyclic tree. Bounds enforce strict unique-key semantics; alternate duplicate policies need corresponding inequalities.",
    "mistakes": [
      "Checking immediate children alone misses ancestor-range violations.",
      "Using zero as an implicit lower bound rejects legitimate negative keys."
    ],
    "takeaways": [
      "Every descent narrows inherited allowed ranges.",
      "Validation complexity includes visiting all nodes, not a single search path."
    ],
    "practice": [
      "Why is root 10 with left child 5 and 5\u2019s right child 12 invalid?|Twelve exceeds its ancestor bound|Five is not smaller than ten|Every right child is forbidden|The tree has an odd number of nodes|All nodes in the root\u2019s left subtree must remain below ten.",
      "What bound does a left subtree inherit from its parent key x?|Upper bound x|Lower bound x|Both bounds removed|A fixed zero lower bound|Left-descendant keys must be strictly smaller than x.",
      "What bound does a right subtree inherit from parent x?|Lower bound x|Upper bound x|Only its leaf count|No ancestor constraints|Right-descendant keys must be strictly greater than x.",
      "Does strict bound validation accept equal keys?|No|Yes on either side|Only on the left|Only on the right|The strict-BST policy excludes duplicates everywhere.",
      "Why use None for an absent numeric bound?|Zero may be a legitimate internal key|None is always smaller than integers|All keys are nonnegative by definition|It forces logarithmic validation|Absence must be represented separately from any permitted numeric value.",
      "How much work does full validation require in the worst case?|O(N)|O(log N) always|O(1)|O(N squared) necessarily|Every node may need its key checked once."
    ],
    "formal": [
      "What does an inherited lower bound require?|The key must be strictly greater|The key must be strictly smaller|The key must equal the bound|The key must be positive only|A strict right-side ancestor restriction excludes equal or smaller keys.",
      "What inorder property characterizes a valid strict BST on a finite binary tree?|Strictly increasing keys|Only nondecreasing node depths|All leaves first|Equal key frequencies|Inorder must place every left key before a larger parent and every right key after it.",
      "What is the recursive workspace bound for bound validation?|O(h)|O(1) for every shape|O(N squared)|O(log h)|Active validator frames follow one ancestor path.",
      "A migrated tree has root 20 and a right-subtree descendant 18 under local parent 25. What rejects it?|Inherited lower bound twenty|Only checking eighteen against twenty-five|Counting leaves|Reversing inorder output|The entire right subtree must stay above twenty.",
      "A validator initializes lower=0 for all input trees. Which valid key can it reject incorrectly?|-5|5|10|100|Zero is not a universal lower bound when negative keys are permitted.",
      "A strict-BST validator permits key==upper. What bug can follow?|Duplicate or ancestor-equal keys may pass|All valid negative keys are rejected|The tree becomes balanced|All bounds become redundant|Strict left ranges require key<upper, not key<=upper.",
      "A source claims a BST but can contain cycles. Is inherited-key validation alone sufficient as an input-shape validator?|No, structural cycle checks are separate|Yes, key comparisons remove all cycles|Only if values are floats|Only when height is even|The recursive bound proof assumes a finite tree; malformed references need structural handling.",
      "A validator checks only root children and returns true. What correctness gap remains?|Deeper ancestor constraints are unchecked|Root comparison is always impossible|All leaves are automatically valid|Only payload formatting is missing|BST restrictions apply recursively across entire subtrees.",
      "A service uses inorder validation and remembers only the previous key. What inequality should each next key satisfy under a strict policy?|next_key>previous_key|next_key>=previous_key|next_key<=previous_key|next_key==previous_key|Strict increase rejects both misplaced keys and duplicates.",
      "An imported numeric index may be deep, include negative keys, and must reject ancestor violations and cycles without recursive-call dependence. Which approach fits?|Explicit bound frames plus identity-based structural state|Parent-only comparisons with zero sentinel bounds|A heapify call followed by assuming BST validity|A recursive inorder call with unbounded safe-depth claims|Bounds handle all ancestor restrictions and negative keys; explicit frames and identity states address depth and malformed cyclic structure."
    ]
  },
  {
    "slug": "rotations-height",
    "title": "Preserve search order while repairing height",
    "intro": "A frequently updated index can become a chain even though every key remains correctly ordered. Self-balancing trees add height-related invariants and use rotations to change shape without changing inorder key order. A rotation must reconnect both its middle subtree and its owning parent link.",
    "sections": [
      [
        "Rotation mechanics",
        "For a right rotation, let y be the subtree root and x=y.left. Save beta=x.right. Set x.right=y and y.left=beta, then return x as the new subtree root. Before rotation, all keys in x.left are below x, beta lies between x and y, and y.right exceeds y. After rotation these same key ranges remain valid.",
        "The caller must attach the returned root to its parent or the overall root field. If metadata such as height or subtree size is stored, recompute the lower moved node y before recomputing new root x. A rotation preserves order but does not automatically restore every balance invariant after an arbitrary update; the balancing algorithm decides where and which rotations are needed."
      ],
      [
        "Guarantees and height arithmetic",
        "An AVL tree requires child-subtree heights to differ by at most one at every node. Its minimum node count at height h grows at least as a Fibonacci-like recurrence, implying logarithmic height. Red-black trees use color/black-height rules to achieve a different logarithmic guarantee. Do not claim a plain BST inherits those guarantees without maintaining the extra rules.",
        "In a perfect binary tree, N=2^(h+1)-1 and h=log2(N+1)-1. A general balanced tree need not be perfect, so exact perfect-tree formulas are not its universal node count. Rotations have O(1) local pointer work; finding the update location and repairing metadata along ancestors still costs O(log N) when logarithmic height is maintained."
      ]
    ],
    "problem": "Right-rotate a three-key chain and verify preserved inorder keys.",
    "steps": [
      "Define the node, key and structural invariants for the synthetic fixture.",
      "Trace structural operations and state which ordering or prefix property is preserved.",
      "Check outputs and derive time and live-state bounds from tree height, width or key length."
    ],
    "code": "class Node:\n    def __init__(self,key,left=None,right=None): self.key=key; self.left=left; self.right=right\ndef rotate_right(y):\n    x=y.left; beta=x.right\n    x.right=y; y.left=beta; return x\ndef inorder(n):\n    return [] if n is None else inorder(n.left)+[n.key]+inorder(n.right)\nroot=Node(3,Node(2,Node(1)))\nprint(inorder(root))\nroot=rotate_right(root)\nprint(root.key,inorder(root))",
    "expect": "[1, 2, 3]\n2 [1, 2, 3]",
    "limit": "The fixture demonstrates one valid local rotation, not a complete AVL insertion implementation. Height guarantees require maintaining the full balancing invariant after every update.",
    "mistakes": [
      "Dropping beta loses an entire middle subtree during rotation.",
      "A local rotation result must be reattached through the owner\u2019s link."
    ],
    "takeaways": [
      "Rotations preserve inorder ordering through explicit key-range reasoning.",
      "Logarithmic update guarantees require maintained global balance rules."
    ],
    "practice": [
      "In a right rotation at y, which node becomes the new subtree root?|y.left|y.right|The global maximum|The old root\u2019s parent always|The left child rises above y while preserving inorder key ranges.",
      "What happens to beta=x.right during right rotation?|It becomes y.left|It is discarded|It becomes x.left|It becomes the global root|Its keys lie between x and y, so it belongs under y on the left.",
      "What output property does a valid rotation preserve?|Inorder key sequence|Every node depth|The original root identity|Every stored height value|Rotation changes shape while retaining binary-search ordering.",
      "Does one sample rotation prove a complete AVL implementation?|No|Yes|Only with three nodes|Only for sorted keys|A full implementation must maintain balance and metadata across all updates.",
      "Why update y\u2019s height before x\u2019s after a right rotation?|x uses the new y height|Both heights are always zero|Heights are payload values|The order never matters|The lower moved node\u2019s metadata must be correct before its parent\u2019s recomputation.",
      "What is local pointer-work cost of one rotation?|O(1)|O(N)|O(N log N)|O(2 to N)|A fixed number of links are read and rewritten."
    ],
    "formal": [
      "Which invariant is added by AVL balancing?|Child heights differ by at most one|Every node has two children|All leaves have exactly equal depth|Every key is a prime|The bounded height difference constrains the whole tree\u2019s height.",
      "What does a rotation change?|Local tree shape|The sorted key order necessarily|Every payload\u2019s value|The number of keys|Rotation relinks a fixed local region without adding or removing keys.",
      "What height bound supports balanced-BST path guarantees?|O(log N)|Theta(N) always|O(N squared)|O(1) for arbitrary N|Maintained balance prevents long chain shapes.",
      "A right rotation saves no beta and sets y.left=None. What data can be lost?|The former x.right subtree|Only the root\u2019s label|The entire y.right subtree always|No reachable nodes|Beta must be reattached as y.left to preserve its nodes and key ranges.",
      "A caller performs rotate_right(root) but ignores its return. What ownership update is missing?|Rebind the owner\u2019s root|Sort all payloads|Delete the new root|Clear the right subtree|The returned node is the new root of the rotated region.",
      "After a right rotation, old root y has leaf children and new root x has child y and one missing child. Using empty height -1, what are their new heights?|y=1 and x=2|y=2 and x=1|y=0 and x=0|y=1 and x=1|Compute y from its leaf children first, then x from y and its missing child; heights are one and two.",
      "A team says one rotation makes an arbitrary chain balanced forever. What is missing?|Balancing on every update|A name for the root|A second copy of each payload|Only an output separator|Future insertions/deletions can break balance and require systematic repair.",
      "A rotation changes child links but stored subtree sizes remain unchanged. Which operation may become incorrect?|Rank/select queries using stale sizes|Plain payload printing only|Integer equality|The number of Python variable names|Augmented metadata must match the new child structure for rank computations.",
      "An AVL update searches a logarithmic-height path and repairs a constant amount per visited ancestor. What time bound follows?|O(log N)|O(1) total|Theta(N squared)|Theta(N!)|Path length is logarithmic and each ancestor requires bounded local work.",
      "A key index needs worst-case logarithmic updates and rank queries, and uses rotations during rebalancing. Which invariant set must its implementation maintain?|BST ranges, balance and subtree sizes|Only parent-child key comparisons|Only a correct root payload|Only one successful sample rotation|Ordering supports search, balancing bounds height, and size metadata supports correct rank/select results after relinking."
    ]
  },
  {
    "slug": "heap-topk",
    "title": "Use heap order for a bounded best-candidate set",
    "intro": "A recommendation service retains the three highest synthetic scores from a long stream. It does not need ordered predecessor or prefix operations, so a bounded heap is more direct than a BST. Heap parent-child order exposes an extremum without ordering every subtree as a search tree.",
    "sections": [
      [
        "Heap versus BST order",
        "A min-heap requires each parent key to be no larger than its children. It does not require every left descendant to be smaller than every right descendant, and arbitrary key search can require O(n) inspection. A strict BST has subtree key ranges that support ordered search but does not necessarily place the minimum at its root.",
        "To retain k largest scores, keep a min-heap of the current retained set. When fewer than k values exist, push. After it fills, replace the root only if a new score exceeds that smallest retained value. The root is the threshold a new candidate must beat. Equal-score policy matters when records include identities and ties affect business output."
      ],
      [
        "Costs and output order",
        "Each candidate requires at most O(log k) heap repair, yielding O(n log k) total processing with O(k) retained scores for k>=2; k=1 can use a single running maximum. Sorting the retained k values adds O(k log k) if final descending output is required. Reading an unsorted heap array does not already provide ranked output.",
        "Python heapq works on lists and compares tuple components lexicographically. Include explicit tie keys when payloads are not orderable or deterministic ties are needed. A heap is a local priority structure; persistence, cancellations and distributed scheduling semantics require additional system design. The fixture limits itself to score retention and final ordering."
      ]
    ],
    "problem": "Retain three highest scores with a bounded min-heap.",
    "steps": [
      "Define the node, key and structural invariants for the synthetic fixture.",
      "Trace structural operations and state which ordering or prefix property is preserved.",
      "Check outputs and derive time and live-state bounds from tree height, width or key length."
    ],
    "code": "import heapq\ndef top_scores(values,k):\n    if k<1:raise ValueError(\"positive k required\")\n    heap=[]\n    for score in values:\n        if len(heap)<k:heapq.heappush(heap,score)\n        elif score>heap[0]:heapq.heapreplace(heap,score)\n    return sorted(heap,reverse=True)\nprint(top_scores([4,8,2,9,5,7],3))\nprint(top_scores([2,1],5))",
    "expect": "[9, 8, 7]\n[2, 1]",
    "limit": "The result contains scores rather than identity-bearing tied records. Retained state is bounded by min(k,n), while the final sorted result adds output storage.",
    "mistakes": [
      "A min-heap of retained winners exposes the weakest winner, which is the correct eviction candidate.",
      "Heap arrays are partially ordered and must not be mistaken for sorted ranked output."
    ],
    "takeaways": [
      "Heap order and BST order support different queries.",
      "A bounded candidate set can avoid a full sort when k is small."
    ],
    "practice": [
      "Why does top-k-largest retention use a min-heap of winners?|The weakest winner is at the root|The strongest winner must be evicted first|All scores become ascending globally|A heap forbids duplicate scores|The root is the threshold to replace when a better score arrives.",
      "Can arbitrary lookup in an ordinary heap rely on BST left/right key ranges?|No|Yes|Only when n is odd|Only for numeric keys|Heap order constrains parents and children but not full search subtrees.",
      "What should happen to a score below a full winner heap\u2019s root?|Ignore it|Replace the strongest winner|Clear every retained score|Increase k silently|It cannot belong among the largest k seen so far.",
      "What extra step gives a ranked descending top-k result?|Sort the retained scores|Read the heap array directly|Reverse arrival order|Discard the root only|The heap array is not a fully sorted ranking.",
      "For k=1, which simpler state is sufficient?|One running maximum|Every historical score|A full BST path|A million-entry min-heap|Only the highest score seen so far needs to be retained.",
      "What must a record-level tie policy consider beyond score values?|Task identity and tie ordering|Only the Python source filename|Only the root\u2019s array offset|Only whether n is even|Equal scores can correspond to distinct records with business-specific tie semantics."
    ],
    "formal": [
      "What is at the root of a min-heap?|A minimum key|A median key always|The newest key always|A maximum key always|Parent-child inequalities make the root globally minimal.",
      "Does a heap array have to be fully sorted?|No|Yes|Only for unique keys|Only for integer payloads|Sibling and cross-subtree positions are not totally ordered.",
      "What retained-score bound does a top-k heap have?|O(k)|Theta(n) always|Theta(n squared)|O(log k)|At most k candidate scores remain stored.",
      "A size-three winner heap retains [5,8,9] as a valid min-heap. A new score seven arrives. Which scores should remain?|7,8,9|5,7,8|5,8,9|5,7,9|Seven replaces the smallest retained winner five.",
      "The same heap receives score four instead. What should happen?|Keep the existing winners|Replace nine with four|Clear the heap|Retain four extra winners|Four is below the weakest retained winner.",
      "A service scans n scores with a size-k heap, k>=2. What comparison-work bound fits?|O(n log k)|O(log n) total|O(n squared) necessarily|O(k) independent of n|Each candidate can cause at most a logarithmic heap operation.",
      "A dashboard displays the internal heap list as a sorted ranking. What contract is missing?|A final ordering step|A larger recursion limit|A unique root variable name|A duplicate-free input|Heap order exposes only an extremum, not the sorted sequence.",
      "An index needs exact lookup and ordered range queries. Why is a heap not a substitute for a balanced BST?|It lacks searchable left/right subtree ranges|Its root never has a key|It cannot store tuples|It always uses more than quadratic memory|Heap partial order does not support logarithmic arbitrary key routing.",
      "A top-k record heap has equal scores and unorderable dictionary payloads. What key design avoids payload comparison?|Insert a unique ordered tie key|Compare dictionaries directly|Drop every equal-score task|Use the payload\u2019s mutable size only|A unique earlier tuple field decides ties before comparison reaches the payload.",
      "A stream has n scores, k is much smaller than n, all top-k values must be ranked and only O(k) candidates may remain live. Which complexity description fits?|O(n log k+k log k) time; O(k) space|O(n log n) is mandatory for every k|O(log n) time with O(1) storage|O(n squared) work is unavoidable|A bounded heap processes candidates, then sorting only retained winners produces the requested ranking within O(k) storage."
    ]
  },
  {
    "slug": "trie-prefix",
    "title": "Build a prefix index with terminal markers",
    "intro": "A command palette needs to tell whether a character prefix exists and whether that exact command was registered. A trie shares common prefixes across keys, while a terminal marker distinguishes a complete key from an internal path.",
    "sections": [
      [
        "Prefix and key semantics",
        "A trie node maps one next character to each child. Inserting a word follows or creates one edge per character, then marks the final node terminal. Exact lookup follows all characters and checks the terminal flag. Prefix lookup only requires that the path exists; it does not require the endpoint to be terminal.",
        "If cat and catalog are stored, the node reached after cat can be terminal and still have children. Inserting an empty word sets the root terminal under a contract that permits empty keys. Case normalization and Unicode segmentation should be decided before insertion and queries; a trie over Python characters is not automatically a locale-aware or grapheme-aware index."
      ],
      [
        "Length-sensitive bounds",
        "For a key of length L with expected constant-time dictionary child lookup, insertion and exact lookup take O(L) expected time. A trie storing many keys can require a node per distinct prefix, bounded by one plus the sum of inserted key lengths. This can use more pointer/dictionary overhead than a compact sorted array even when asymptotic key lookup looks attractive.",
        "Autocomplete first descends through prefix length P, then visits the required suffix subtree. Enumerating m outputs has costs for visited nodes and emitted characters; a prefix match does not make unbounded output constant time. Lexicographic suggestions need a child-ordering policy, because arbitrary insertion order is not necessarily character order."
      ]
    ],
    "problem": "Distinguish an exact command from a proper prefix in a character trie.",
    "steps": [
      "Define the node, key and structural invariants for the synthetic fixture.",
      "Trace structural operations and state which ordering or prefix property is preserved.",
      "Check outputs and derive time and live-state bounds from tree height, width or key length."
    ],
    "code": "class Trie:\n    def __init__(self):self.children={}; self.end=False\n    def insert(self,word):\n        node=self\n        for ch in word:node=node.children.setdefault(ch,Trie())\n        node.end=True\n    def find(self,text):\n        node=self\n        for ch in text:\n            if ch not in node.children:return None\n            node=node.children[ch]\n        return node\nroot=Trie()\nfor word in [\"car\",\"cart\",\"cat\"]:root.insert(word)\nprint(root.find(\"ca\") is not None,root.find(\"ca\").end)\nprint(root.find(\"car\").end,root.find(\"dog\") is None)",
    "expect": "True False\nTrue True",
    "limit": "The fixture uses character keys and expected dictionary lookup. setdefault evaluates its default eagerly, so temporary Trie objects may be constructed even when an edge already exists; the retained-prefix count remains the structural bound.",
    "mistakes": [
      "A prefix path is not proof that the exact key was inserted; check the terminal marker.",
      "Assuming trie memory equals only character bytes ignores per-node dictionaries and references."
    ],
    "takeaways": [
      "Terminal state separates full keys from prefixes.",
      "Analyze trie operations by key length and requested output, not only number of keys."
    ],
    "practice": [
      "What distinguishes an exact stored key from a prefix-only path?|A terminal marker|The node\u2019s depth parity|The root\u2019s memory address|A heap priority|The final node must be marked as a complete key.",
      "Can a terminal node also have children?|Yes|No|Only at the root|Only for duplicate words|One stored word can be a prefix of another.",
      "What represents an empty stored word under the allowed contract?|A terminal root|No possible representation|A mandatory zero character|A second disconnected trie|The zero-character path ends at the root.",
      "What does prefix lookup require?|The character path exists|The endpoint is always a leaf|The endpoint is terminal always|Every key has equal length|A prefix may be shared by longer stored keys without itself being stored.",
      "What input dimension primarily controls exact trie lookup?|Key length|Only total key count|Only leaf count|Only root degree squared|One child transition is needed per character.",
      "Does a basic character trie automatically provide human-language collation?|No|Yes|Only for ASCII-plus-emoji|Only when every word is lowercase|Normalization and locale/grapheme semantics require explicit policies."
    ],
    "formal": [
      "What does a trie edge usually represent here?|One next character|A whole sorted array|A heap rotation|Only a word\u2019s length|Following edges spells a prefix character by character.",
      "What state is needed at a complete stored-word endpoint?|Terminal=true|No child dictionary ever|A negative depth|A maximum-heap root|Terminal state records exact membership independently of children.",
      "Under expected constant-time child maps, what is length-L exact lookup time?|O(L)|O(log L) always|O(1) independent of L|Theta(N squared) always|The lookup follows at most one edge per input character.",
      "A trie stores \"cart\" but not \"car\". What should exact lookup of \"car\" return?|False|True|Only if \"cart\" is terminal|An arbitrary answer|The path exists but its endpoint is not marked terminal.",
      "The same trie receives \"car\". What changes at the existing prefix endpoint?|Its terminal flag becomes true|Its children must be deleted|The root must rotate|Every node is rebuilt|Insertion can mark an existing path without destroying longer words.",
      "A trie stores keys of total length S. What general retained-node upper bound fits an ordinary prefix trie?|S+1|Exactly one always|S squared necessarily|Only log S|At most one node is created per inserted character plus the root.",
      "A command palette must output all suggestions under a popular prefix. What cost cannot be omitted?|Suffix visits and emitted characters|Only the prefix descent ever|No cost after the first match|Only the number of root children|Autocomplete must traverse and write the requested results.",
      "A developer expects suggestions in lexical order because child dictionaries preserve insertion order. What must be specified?|Lexically ordered child traversal|A larger recursion limit alone|An arbitrary arrival shuffle|Only a terminal flag|Insertion order is not necessarily lexicographic character order.",
      "A product normalizes words with casefold on insertion but not on lookup. What bug can appear?|Equivalent queries may miss keys|Every key is duplicated automatically|The trie becomes a heap|All prefixes become terminal|Insertion and queries must use compatible normalization.",
      "An autocomplete index must distinguish exact words, share prefixes, normalize consistently and return at most k lexically ordered suggestions. Which design addresses all requirements?|Trie terminals; normalized, ordered top-k traversal|A trie that marks every visited prefix terminal|An unordered heap of whole words with no prefix check|Raw character insertion with a claim of universal locale sorting|Terminal markers preserve membership, normalization aligns key semantics, and ordered traversal with a k limit bounds requested outputs."
    ]
  },
  {
    "slug": "trie-delete",
    "title": "Delete a key without destroying shared prefixes",
    "intro": "A feature-flag command registry removes retired commands while preserving longer and shorter commands that share paths. Trie deletion has two separate actions: clear exact membership, then prune only nodes that no longer serve any stored key.",
    "sections": [
      [
        "Deletion invariant",
        "Follow the key and retain the parent-edge path. If an edge is missing or the endpoint is not terminal, the exact key was absent and no state should change. Otherwise clear the endpoint terminal flag. Walk the retained path backward and remove a child only when it is nonterminal and has no children.",
        "Stop pruning at a terminal node or a node with another child. Deleting car must preserve cart because the r node still has a t child. Deleting cart while car remains should remove only the unused t suffix, retaining the terminal r endpoint. These tests express why shared prefix nodes are resources owned by multiple keys."
      ],
      [
        "Resource and query policy",
        "For key length L, following and pruning a path takes O(L) expected time with dictionary child operations and uses O(L) retained parent references in this iterative implementation. A recursive deletion uses depth-L call frames instead. The number of removed nodes is at most L, and deletion does not necessarily release dictionary capacity back to an operating system immediately.",
        "If autocomplete caches subtree counts or top suggestions, insertion and deletion must update that metadata consistently along ancestors. A trie with correct exact membership can still return stale suggestions from invalidated caches. Concurrency requires an explicit snapshot or locking policy while paths are pruned; the synthetic example mutates a privately owned dictionary trie only."
      ]
    ],
    "problem": "Delete exact keys while preserving longer words and pruning unused suffixes.",
    "steps": [
      "Define the node, key and structural invariants for the synthetic fixture.",
      "Trace structural operations and state which ordering or prefix property is preserved.",
      "Check outputs and derive time and live-state bounds from tree height, width or key length."
    ],
    "code": "END=object()\ndef add(root,word):\n    node=root\n    for ch in word:node=node.setdefault(ch,{})\n    node[END]=True\ndef remove(root,word):\n    path=[]; node=root\n    for ch in word:\n        if ch not in node:return False\n        path.append((node,ch)); node=node[ch]\n    if END not in node:return False\n    del node[END]\n    for parent,ch in reversed(path):\n        if parent[ch]:break\n        del parent[ch]\n    return True\ndef has(root,word):\n    node=root\n    for ch in word:\n        if ch not in node:return False\n        node=node[ch]\n    return END in node\nroot={}\nfor word in [\"car\",\"cart\",\"cat\"]:add(root,word)\nprint(remove(root,\"car\"),has(root,\"cart\"),has(root,\"car\"))\nprint(remove(root,\"cart\"),has(root,\"cat\"))\nprint(remove(root,\"ca\"))",
    "expect": "True True False\nTrue True\nFalse",
    "limit": "The opaque END object cannot collide with character edges in this fixture. The trie is privately owned; metadata caching and concurrent mutation need additional policies.",
    "mistakes": [
      "Deleting the entire prefix path can remove other keys that share it.",
      "Pruning a terminal node loses a shorter surviving key even if it has no children."
    ],
    "takeaways": [
      "Clear membership first, then prune only unneeded nodes.",
      "Update cached subtree metadata together with structural changes."
    ],
    "practice": [
      "When is a trie node safe to prune after deleting one key?|Nonterminal and childless|Terminal with any children|Any node on the path|Every root child|Only a node unused by both exact membership and longer keys may disappear.",
      "Deleting \"car\" while \"cart\" remains should preserve what?|The path for cart|Only the root|No r node|Only unrelated first letters|The longer key still needs the shared prefix and its suffix.",
      "What does deleting a prefix that was never terminal do?|Report no match|Delete every longer key|Mark the prefix terminal|Clear the entire root|A prefix-only path is not an exact stored key.",
      "Why retain parent-edge pairs during iterative deletion?|To prune backward without recursion|To sort all suggestions|To compare unrelated payload dictionaries|To make key length constant|Parents are needed to remove now-unused child references.",
      "What metadata may need updating beyond terminal flags?|Cached suggestions|Only source-file names|Only print separators|No metadata ever|Structural changes can invalidate derived prefix summaries.",
      "What is the opaque END object\u2019s role in the fixture?|A non-character terminal key|The last Unicode character|A missing child pointer|A numeric priority|The sentinel cannot collide with ordinary character edges."
    ],
    "formal": [
      "What is the first membership change when removing an existing key?|Clear its terminal marker|Delete the root unconditionally|Reverse every edge|Sort the child maps|Exact membership is removed before deciding which structural nodes are unused.",
      "What stops backward pruning safely?|A surviving terminal or child|Only reaching an even depth|A payload comparison with zero|Any uppercase letter|The node still represents a key or supports a longer one.",
      "What is iterative deletion\u2019s retained parent-path space for key length L?|O(L)|O(1) for every key|O(N squared)|O(log L) always|The explicit path can hold one parent-edge pair per character.",
      "A registry stores \"car\" and \"cart\" and removes \"cart\". Which key must remain?|car|Only cart|Neither|Only ca|The shorter terminal node is still a valid stored command.",
      "A registry stores only \"cart\" and attempts to remove \"car\". What is correct?|No change; car was not stored|Remove cart as a descendant|Create car automatically|Delete the root c edge|A nonterminal prefix is not an exact membership match.",
      "A deletion routine prunes a childless node even when terminal. What can it destroy?|A surviving shorter key|Only unused allocations|The numeric ordering of unrelated heaps|No membership information|A terminal leaf can itself be a complete key still needed by the registry.",
      "An autocomplete cache is not invalidated after removing a command. What user-visible defect can occur?|Suggestions still include the retired key|Exact trie lookup must always remain true|The entire trie sorts descending|Every other key is deleted|Derived suggestion data can be stale even when exact membership is correct.",
      "A very long key risks Python recursion limits in recursive deletion. What iterative replacement preserves pruning capability?|An explicit parent-edge path|Only the final node reference|An unsorted list of all words|A repeated root reparse with no state requirement|The path records the ancestors needed for backward pruning without recursive calls.",
      "A deletion removes L nodes but process memory does not immediately fall by their nominal dictionary sizes. What assumption was too strong?|Allocator behavior guarantees immediate OS release|The deleted nodes are necessarily still reachable|Dictionaries cannot be freed|All deletions require rebuilding the root|Logical removal and object reclamation do not promise immediate operating-system memory reduction.",
      "A shared prefix index supports exact keys, cached suggestion counts and concurrent readers. Which deletion protocol needs review for correctness?|Update terminal, prune, refresh caches, define consistency|Clear every node whose characters appear in the deleted key|Remove only the display label and leave every cache trusted|Prune every path edge regardless of other terminals|Membership, shared structure, derived metadata and reader observations must remain consistent through the update."
    ]
  }
],['Doc/tutorial/datastructures.rst','Doc/library/heapq.rst','Doc/builtins/stdtypes.rst']);
