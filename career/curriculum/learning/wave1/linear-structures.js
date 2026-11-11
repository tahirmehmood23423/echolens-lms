'use strict';
const {course}=require('./wave4-dsa-helper');
module.exports=course("linear-structures",[
  {
    "slug": "reverse-links",
    "title": "Reverse a chain without losing its suffix",
    "intro": "A shipment chain represents the next parcel using a node reference. Reversing the delivery order changes those references, not the parcel values. A safe implementation must preserve the unprocessed suffix before replacing a link. This lesson builds the invariant needed to reason about that mutation.",
    "sections": [
      [
        "References and ownership",
        "A singly linked node contains a payload and a reference to its successor, or None at the end. The head reference identifies the first node; it is not a permanent sentinel unless the API says so. Assigning a local name to a node does not copy the node. Two names may observe the same mutable object. This matters when an application retains a pointer into a route while another routine reverses it.",
        "Let prev name the reversed prefix and cur the first unprocessed node. Initially the prefix is empty. Each iteration saves cur.next, redirects cur.next to prev, and advances both names. The disjoint prefix and suffix together contain exactly the original nodes; no new payload node is required. At termination cur is None and prev is the new head."
      ],
      [
        "Cost and integration",
        "There is one iteration per node, so n link rewrites give Theta(n) time in the unit-cost reference model. Only a fixed number of node references are live in the algorithm, giving O(1) auxiliary space. This excludes the already allocated input nodes. A recursive reversal also visits n nodes but retains n suspended calls unless the runtime eliminates them; Python does not promise that optimization.",
        "A route service should return the new head and update its owning field. The old head becomes the tail. Reversing while another reader follows next references can expose a partial route, so ownership or synchronization belongs in the surrounding design. Test an empty chain, a singleton, and several nodes; a cyclic input violates the termination assumption."
      ]
    ],
    "problem": "Reverse a three-node shipment route while retaining every node.",
    "steps": [
      "Identify the representation and state its invariant before changing any link or index.",
      "Trace the fixture operation by operation, preserving references needed by later steps.",
      "Check the result and derive the operation and storage bounds separately."
    ],
    "code": "class Node:\n    def __init__(self, value, nxt=None):\n        self.value, self.next = value, nxt\ndef reverse(head):\n    prev, cur = None, head\n    while cur is not None:\n        nxt = cur.next\n        cur.next = prev\n        prev, cur = cur, nxt\n    return prev\nhead = Node(4, Node(7, Node(9)))\nhead = reverse(head)\nvalues=[]\nwhile head is not None:\n    values.append(head.value); head=head.next\nprint(values)\nprint(reverse(None))",
    "expect": "[9, 7, 4]\nNone",
    "limit": "The fixture checks order and the empty case. The loop invariant supplies the linear-time, constant-auxiliary-space claim; it assumes a finite acyclic list.",
    "mistakes": [
      "Saving the successor after overwriting next loses access to the suffix; save it first.",
      "Returning the old head exposes only the new tail; return prev."
    ],
    "takeaways": [
      "Treat reference identity separately from payload equality.",
      "A mutation invariant must account for both processed and unprocessed nodes."
    ],
    "practice": [
      "Before reversing node A whose next is B, which reference must be saved?|B|The final head only|A.value only|None always|Saving the old successor preserves the unprocessed suffix.",
      "What does iterative reverse return for an empty chain?|None|A new zero-valued node|An exception by definition|The original tail object|No iteration runs and prev remains None.",
      "Why does an external pointer to the old head still name the same object after reversal?|Object identity is retained|The payload was copied|Python changes all aliases|The list becomes immutable|Changing next does not rebind other references.",
      "A reversal has prev naming 7->4 and cur naming 9->None. What must the next rewrite do?|Set 9.next to node 7|Set 7.next to node 9|Set 4.next to node 9|Clear 7.next|The current node joins the front of the reversed prefix.",
      "A finite chain has one node X. After reverse, what is the returned identity?|X itself|A copy of X|None|An unrelated sentinel|The sole node becomes both head and tail without allocation.",
      "A team needs payload order reversed but stable node links for external readers. Which approach satisfies that contract?|Build a separate output representation|Mutate every next reference in place|Clear the head's next|Swap only the two local runner names|A separate representation avoids exposing partial link mutation to readers."
    ],
    "formal": [
      "Which field connects singly linked nodes?|A successor reference|An array index that must be contiguous|A copy of every later value|A mandatory parent reference|A node stores a reference to its next node.",
      "Which condition marks the end of a conventional finite chain?|next is None|value is zero|The head value repeats|The node address is even|None is the explicit end sentinel in this representation.",
      "A reversal loop holds prev, cur and nxt only. Its auxiliary space is what?|O(1)|Theta(n)|Theta(n log n)|Theta(n squared)|A fixed number of references is independent of list length.",
      "A parcel service redirects cur.next before saving it. What failure can follow?|The unprocessed suffix can be lost|Payloads automatically sort|The algorithm becomes constant time|The garbage collector reconstructs the suffix|The original successor must be retained before mutation.",
      "A route has 200 nodes. A correct iterative reversal rewrites each next once. How many next assignments occur?|200|199|400|1|Each of the 200 nodes receives one next assignment including the old head.",
      "A caller ignores reverse(head)'s return value. What does its old head now reach in a multi-node chain?|Only the old head|The entire reversed chain|A sorted chain|A fresh copy of the route|The original head has next set to None.",
      "A system must reverse ten million existing nodes using constant additional node references. Which design meets the storage constraint?|Iterative pointer reversal|Recursive reversal with one call per node|Copy all values into an array|Build a second linked chain|The iterative algorithm holds a bounded number of references.",
      "A reviewer claims reversal is O(1) time because it allocates no nodes. Which correction is justified?|Theta(n) time, O(1) auxiliary space|It is Theta(n squared) time|It must use Theta(n) extra space|It is O(log n) time|Allocation space and pointer-update counts are different resources.",
      "A route reader shares an interior node with a mutating reverser. What assumption needs attention?|Concurrent readers may observe partially reversed links|All aliases receive a new deep copy|Payload equality guarantees safe concurrency|Reference assignment automatically locks the chain|Local correctness does not provide a consistent snapshot to concurrent traversals.",
      "An API requires the original chain unchanged, linear time, and only constant extra space while returning a separately owned reversed linked chain of n nodes. What conclusion follows?|Theta(n) output nodes are required|Pointer reversal satisfies immutability|Recursion removes output storage|A single sentinel can encode all new nodes|A separately owned materialized chain requires n nodes even if auxiliary workspace is constant."
    ]
  },
  {
    "slug": "middle-two-runners",
    "title": "Find the middle using two traversal speeds",
    "intro": "A monitoring agent needs the midpoint of an incident chain whose length is not stored. A slow runner advances once while a fast runner advances twice. The relative progress is an arithmetic relationship that determines both the answer and the even-length convention.",
    "sections": [
      [
        "Derive the position invariant",
        "After k completed iterations, slow has advanced k links and fast has advanced 2k links, provided both steps were available. Test fast and fast.next before dereferencing the next next field. When fast reaches the end, the slow runner has covered approximately half the chain. Starting both at the head returns the second middle for even lengths.",
        "For a chain indexed 0 through n-1, the returned index is floor(n/2). For n=4 it is 2, not 1. Neither convention is universally correct; a split operation must specify which middle it needs. To choose the first middle, adjust the fast starting position or termination rule and retrace empty, odd and even cases."
      ],
      [
        "Apply and bound the scan",
        "The runners together perform a linear number of reference steps and retain two node names, so time is O(n) and auxiliary space is O(1). This improves on storing all node references in an array merely to select its midpoint. It does not provide random access to later queries; repeated midpoint queries on a changing chain may justify a different representation.",
        "In a support system the midpoint may split a work batch, but sharing the returned node does not detach either half. Cutting requires updating a predecessor link. A cycle invalidates the end-based proof and can cause the midpoint loop to run forever. Require an acyclic chain or validate cycles separately."
      ]
    ],
    "problem": "Return the second middle value for an even route and the sole middle for an odd route.",
    "steps": [
      "Identify the representation and state its invariant before changing any link or index.",
      "Trace the fixture operation by operation, preserving references needed by later steps.",
      "Check the result and derive the operation and storage bounds separately."
    ],
    "code": "def middle(head):\n    slow = fast = head\n    while fast is not None and fast[1] is not None:\n        slow = slow[1]; fast = fast[1][1]\n    return None if slow is None else slow[0]\nprint(middle((1,(2,(3,(4,None))))))\nprint(middle((1,(2,(3,None)))))\nprint(middle(None))",
    "expect": "3\n2\nNone",
    "limit": "Tuples here provide immutable node links for tracing; a production node class has the same runner invariant. The function requires no cycle.",
    "mistakes": [
      "Checking fast.next before fast can dereference None; guard in short-circuit order.",
      "Calling the returned node the first middle silently changes the even-length contract."
    ],
    "takeaways": [
      "Runner positions yield a proof, not just a mnemonic.",
      "Specify whether a split retains or detaches shared suffixes."
    ],
    "practice": [
      "For n=6, what zero-based index does slow return when both runners start at head?|3|2|5|0|The second-middle variant returns floor(n/2).",
      "Which guard permits two fast steps safely?|fast is not None and fast.next is not None|slow is not None only|fast.next.next is not None without other checks|head.value is positive|Both current fast and its successor must exist before taking two steps.",
      "Does returning a middle reference detach the front half?|No, links are unchanged|Yes, all predecessors disappear|Yes, next is cleared automatically|Only for odd lengths|Traversal does not mutate any next field.",
      "After three complete middle-runner iterations, how far has fast moved?|Six links|Three links|Nine links|One link|Fast takes two successor steps per completed iteration.",
      "A three-node chain is split immediately before the returned middle. Which part has one node?|The left part|Both parts|The right part|Neither part|The middle is node index one, so only node zero precedes it.",
      "Why does a next-only linked node not support direct predecessor lookup?|No backward link is stored|Its payload must be a string|Python prohibits two names per node|All chains are circular|Finding a predecessor may require traversal from an owning head."
    ],
    "formal": [
      "How many links does slow advance per completed runner iteration?|One|Two|Zero|Three|Slow takes one successor step.",
      "What is the middle result for an empty chain in the stated API?|None|Index zero|A new sentinel node|Always an exception|The loop is skipped and the empty result is explicit.",
      "What relationship holds after k iterations before termination?|O(1)|Slow advanced 2k and fast k links|Both advanced k squared links|Fast always names the tail|The body applies one and two successor operations respectively.",
      "An incident batch has seven nodes indexed zero through six. Which index is the middle?|3|2|4|6|The slow runner stops at floor(7/2).",
      "An engineer needs the first middle of an eight-node batch. What must change from the second-middle variant?|Adjust the convention to return index 3|Keep the second middle at index four|Sort node payloads first|Store only the last node|The second-middle algorithm returns index 4, so the convention needs an explicit change.",
      "A queue needs its midpoint after every one of n appends using a fresh full runner scan. What is total worst-case traversal work?|Theta(n squared)|Theta(log n)|Theta(n)|Theta(1)|The successive scan lengths sum to 1+2+...+n.",
      "A scheduler assumes that finding the middle also frees the first half. Which correction is needed?|Traversal returns an alias and does not sever links|The garbage collector deletes all earlier nodes immediately|Tuple links become mutable|The middle reference owns every predecessor|No links or owning references are changed by the scan.",
      "A 12-node list uses both runners at head. How many slow advances occur?|6|5|12|24|Fast takes six pairs of steps, so slow advances six links.",
      "A service must use O(1) workspace to select one middle from a finite list whose length is unknown. Which approach fits?|Two runners|Copy every node reference into a vector|Hash each visited node|Recursively compute and retain every suffix length|Two node references suffice and each advances linearly.",
      "A split API wants equal halves for even n and an extra left node for odd n while modifying only one next field. What additional information is needed beyond the second-middle pointer?|The cut predecessor and odd-length policy|Only the total count and payload sum|Only the tail payload|A random pivot value|Detaching a half requires locating and rewriting the boundary predecessor; the middle pointer alone lacks a backward link."
    ]
  },
  {
    "slug": "cycle-identity",
    "title": "Detect cycles through identity and relative motion",
    "intro": "A corrupted next reference can make a task chain revisit an earlier node. Repeated task labels do not prove corruption because distinct tasks can share a label. Cycle detection compares node identity and uses a finite-state argument to avoid retaining an unbounded visited set.",
    "sections": [
      [
        "Why runners meet",
        "Move slow one edge and fast two edges after first checking that fast can advance twice. If the list terminates, the guard fails and there is no reachable cycle. If it enters a cycle of length lambda, both runners eventually lie inside it. Each further iteration changes their relative position by one modulo lambda, so they meet within lambda more iterations.",
        "Let mu be the number of links before the cycle entry. At a meeting after t slow steps, the extra distance t traveled by fast is a multiple of lambda. Reset one runner to head and move both at speed one. After mu steps they meet at the entry because the meeting position is congruent to minus mu modulo lambda."
      ],
      [
        "Practical limits",
        "Cycle detection takes O(mu+lambda) time and O(1) auxiliary references. A visited-identity set is easier to inspect and can retain a path, but takes O(mu+lambda) additional entries. Both methods require stable links during the traversal. A changing graph can invalidate the proof or give an inconsistent answer.",
        "An ingestion repair tool should detect and report first; removing a cycle is a separate, authorized mutation. To break it, find the predecessor of the entry within the cycle, then clear that next field. Do not clear an arbitrary meeting link and assume every originally reachable node stays in the chain."
      ]
    ],
    "problem": "Detect whether node-index references contain a cycle without confusing equal payloads.",
    "steps": [
      "Identify the representation and state its invariant before changing any link or index.",
      "Trace the fixture operation by operation, preserving references needed by later steps.",
      "Check the result and derive the operation and storage bounds separately."
    ],
    "code": "def cyclic(nxt, head):\n    slow = fast = head\n    while fast is not None and nxt[fast] is not None:\n        slow=nxt[slow]; fast=nxt[nxt[fast]]\n        if slow == fast: return True\n    return False\nprint(cyclic([1,2,1],0))\nprint(cyclic([1,2,None],0))\nprint(cyclic([0],0))",
    "expect": "True\nFalse\nTrue",
    "limit": "Integer indices represent distinct node identities in the fixture, not task payloads. The modular-distance proof assumes links do not change during detection.",
    "mistakes": [
      "Comparing values can report a false cycle when different nodes carry the same label.",
      "Comparing initial slow and fast before moving reports every nonempty chain as cyclic."
    ],
    "takeaways": [
      "Relative speed creates a modular progress measure.",
      "Detection, locating the entry and safely repairing the chain are separate operations."
    ],
    "practice": [
      "Two distinct nodes both contain task label X. Is that enough to prove a cycle?|No, compare identity and reachability|Yes, labels uniquely imply identity|Only if X is a string|Only for an even-length chain|Equal payloads do not imply revisiting the same node.",
      "When should the standard Floyd loop first compare runner identity?|After advancing both runners|Before either runner moves at initialization|Only after fast is None|Only after changing links|Both names initially equal head even for an acyclic list.",
      "What does a self-loop detection return?|A cycle exists|The list is empty|Acyclic because length is one|Insufficient memory|Both runners revisit the same node after their moves.",
      "A chain tail points back to the head. What is its noncyclic prefix length mu?|Zero|The total number of nodes|One for every payload|The cycle length plus one|The cycle begins at the head so no preceding acyclic segment exists.",
      "Which test distinguishes an unreachable cycle elsewhere in memory from a reachable cycle?|Traverse from the given head only|Compare all payloads in the process|Count unrelated allocated nodes|Reject every chain with a duplicate label|A head-specific detector only reasons about its reachable successor component.",
      "For a cycle of length five, how does the runner separation change per normal Floyd iteration?|By one modulo five|By zero forever|By five squared|By a random amount|Fast gains one edge per iteration over slow within the cycle."
    ],
    "formal": [
      "What property identifies a repeated node in a cycle test?|Object identity|Payload sort order|Positive payload|Allocation timestamp only|A cycle revisits the same node object.",
      "What happens to fast in an acyclic finite list?|It reaches the end guard|It must meet slow after movement|It becomes a new node|It reverses the chain|Fast eventually encounters None or a last node.",
      "What is Floyd detection's auxiliary reference bound?|O(1)|Theta(n)|Theta(n squared)|Theta(2 to n)|Only a fixed number of runners is retained.",
      "A task chain has a 30-node prefix and a 5-node cycle. Which asymptotic bound applies?|O(mu+lambda)|O(mu times lambda) necessarily|O(log(mu+lambda))|O(2 to lambda)|The runners reach the cycle then meet within one cycle of relative steps.",
      "An audit stores every visited node identity to report its exact path. What trade-off replaces Floyd's constant workspace?|Linear additional identity storage|Constant storage regardless of path length|Quadratic time is unavoidable|Payload values become unique|Remembering each distinct visited node takes linear space.",
      "A repair job finds a runner meeting inside a cycle and must preserve all formerly reachable nodes in one chain. Which link should it clear?|The cycle predecessor of the entry|The head's next always|The meeting node's next always|Every node's next|Breaking the final cycle edge preserves the full prefix and one complete cycle traversal.",
      "A chain mutates while Floyd runners traverse. Which proof assumption fails?|The stable-successor-graph assumption|The fixed allocation order of node payloads|Payloads must be sorted|The prefix must be empty|The relative-motion argument assumes unchanged edges.",
      "A developer doubles both runner speeds. Why is meeting no longer guaranteed by the standard argument?|Equal speeds may preserve the offset|All cycles become shorter|Auxiliary space becomes quadratic|None checks become unnecessary|Equal speeds do not close an existing offset around a cycle.",
      "A fraud pipeline must locate a cycle entry after detection using constant extra space. What is the next step?|Reset one to head; advance both one step|Reset both runners to the meeting node and stop|Sort task labels|Allocate an array of every possible node|The distance congruence makes equal-speed runners meet at entry.",
      "In Floyd's standard one/two-speed method, the cycle length is lambda and slow has traveled t steps at a meeting. Which fact supports entry recovery?|t is a multiple of lambda|t must equal mu|lambda must be even|Fast has visited each prefix node twice|The difference in traveled distances is t and must be a whole number of cycle laps."
    ]
  },
  {
    "slug": "balanced-delimiters",
    "title": "Parse nested delimiters with a stack",
    "intro": "A rules editor validates parentheses, square brackets and braces before accepting a configuration. Counting opens and closes is insufficient: nesting order matters. A stack records precisely the unmatched openings that a later closing delimiter must satisfy.",
    "sections": [
      [
        "State the parser invariant",
        "After scanning any prefix, the stack contains unmatched opening delimiters in encounter order; its top is the most recent unmatched opener. On an opening symbol, push it. On a closing symbol, reject if the stack is empty or its top has the wrong type; otherwise pop. Accept only if the final stack is empty.",
        "For the prefix ([ the top is [. The next character ) is invalid even though a total-count check might eventually balance. This is a local correctness argument: every accepted closing symbol matches the nearest still-unmatched opening of the same type. An empty final stack then proves no opening was left unfinished."
      ],
      [
        "Scope and resource reasoning",
        "For n input characters each character causes at most one push or pop, so time is O(n) under constant-cost delimiter lookup. The maximum stack size equals maximum nesting depth d and can be n, giving O(d) auxiliary space and O(n) worst case. Shallow documents do not require storing all characters.",
        "This fixture treats every bracket as structural. A programming-language parser must first account for strings, escaped quotes and comments; a bracket inside a quoted string may not be syntax. A configuration editor can use this lesson as its delimiter stage, but must not claim this alone validates the complete grammar or business schema."
      ]
    ],
    "problem": "Validate delimiter nesting and reject a crossed pair.",
    "steps": [
      "Identify the representation and state its invariant before changing any link or index.",
      "Trace the fixture operation by operation, preserving references needed by later steps.",
      "Check the result and derive the operation and storage bounds separately."
    ],
    "code": "def balanced(text):\n    stack=[]; closes={\")\":\"(\",\"]\":\"[\",\"}\":\"{\"}\n    for ch in text:\n        if ch in \"([{\": stack.append(ch)\n        elif ch in closes:\n            if not stack or stack.pop()!=closes[ch]: return False\n    return not stack\nprint(balanced(\"{[()]}\"))\nprint(balanced(\"([)]\"))\nprint(balanced(\"(\"))",
    "expect": "True\nFalse\nFalse",
    "limit": "The fixture validates delimiter characters only. The stack proof establishes linear scanning and nesting-depth space, not full language parsing.",
    "mistakes": [
      "Counting delimiters ignores type and nesting; retain unmatched openings in order.",
      "Popping an empty stack before checking it turns ordinary invalid input into an exception."
    ],
    "takeaways": [
      "LIFO order naturally models nesting.",
      "State what lexical preprocessing a parser assumes."
    ],
    "practice": [
      "What must be on top before consuming ]?|[|(|{|Any opening delimiter|The nearest unmatched opener must have matching type.",
      "Why is (() rejected at end?|An opening remains on the stack|It has an even number of symbols|The stack was never used|Every nested expression is invalid|Acceptance requires no unmatched openings.",
      "Which structure models nearest unmatched opening first?|Stack|FIFO queue|Sorted set|Min-heap|The most recent unmatched opener must be matched first.",
      "A scanned prefix is ([ and the next symbol is ]. What stack remains after processing it?|One opening parenthesis|One opening square bracket|An empty stack|Two closing delimiters|The square bracket matches and pops, leaving the unmatched parenthesis.",
      "Why can completed sibling pairs be discarded from parser state?|Only unmatched opens matter|Their text is always invalid|The final grammar ignores delimiters|A queue remembers them elsewhere|Only unmatched openings determine future delimiter obligations.",
      "A validator accepts every input with equal total opens and closes. Which input disproves its correctness?|)(|()|[]|{}|A closing delimiter before any opener violates prefix validity despite equal totals."
    ],
    "formal": [
      "Which order does a stack provide?|Last in, first out|First in, first out|Smallest first|Random access order|A stack removes its most recently pushed item.",
      "What stack state accepts an otherwise valid delimiter scan at end?|Empty|Exactly one opening|All closings retained|Sorted openings|Every opening must have been matched and popped.",
      "What extra space is needed for delimiter depth d?|O(d)|Always O(1)|O(n squared)|O(log d) necessarily|One unmatched opener is retained for each active nesting level.",
      "A rules editor accepts ([)] because opening and closing counts match. Which invariant is missing?|The matching stack-top type rule|All opening values must be sorted|Queue arrival order must be preserved|Input length must be prime|Correct totals do not enforce nesting.",
      "A document contains a million sibling pairs () with depth one. What is the delimiter stack's maximum size?|1|One million|Two million|Zero|Each pair is completed before the next starts.",
      "A JSON editor scans brackets inside quoted strings as syntax. What additional stage is needed?|Handle strings and escapes lexically|Increase the stack capacity without lexical context|Sorting all delimiters|Replacing the stack with a heap|Quoted characters require lexical context before delimiter parsing.",
      "A validator pops before checking whether the stack is empty. Which input exposes the error immediately?|)|()|[]|{}|A leading closing symbol has no opener to pop.",
      "A delimiter service handles n nested openings followed by n closings. What are time and peak stack bounds?|Theta(n) time and Theta(n) stack entries|Theta(n squared) time and O(1) space|Theta(log n) time and Theta(n) space|O(1) time and O(1) space|There are 2n scanned symbols and n simultaneous unmatched openings.",
      "A streaming validator must reject malformed prefixes early without retaining completed pairs. Which state is sufficient?|A stack of unmatched opening types|The full input in reverse|Only separate totals for each type|A FIFO of completed pairs|Completed matched pairs no longer affect future validity; unmatched nesting does.",
      "An adversarial configuration can have depth n while a service allows only B<n stack entries. Which policy preserves correctness within its memory budget?|Enforce an explicit depth limit B|Silently discard the oldest opening|Accept once counts match modulo B|Use a queue to make nesting constant space|Exact unrestricted nesting needs depth-proportional state; an explicit depth limit bounds resource use without false acceptance."
    ]
  },
  {
    "slug": "undo-stack",
    "title": "Represent undo as reversible commands",
    "intro": "A dashboard editor wants users to undo and redo text edits. Storing only the visible text loses the information required to reverse a deletion. A command log captures inverse data before mutation and uses two stacks to preserve a linear editing history.",
    "sections": [
      [
        "Two-stack history",
        "The undo stack holds committed commands with enough information to invert them. Undo pops the latest command, applies its inverse and pushes the command onto redo. Redo pops the latest undone command, reapplies it and puts it back on undo. Thus the next redo is the command most recently undone.",
        "A fresh edit after undo creates a new branch. In a linear-history design, clear redo before accepting that edit. Otherwise redo may replay commands against a document state for which their offsets are no longer valid. Branching histories are possible, but require an explicit graph and conflict policy rather than an accidental second stack."
      ],
      [
        "Correctness and memory",
        "Store deleted content and positions, or a valid inverse operation, before mutating the document. A command that changes external state may not be safely reversible merely because its UI can undo text. Keep command execution atomic relative to history changes so a failed inverse does not leave stacks claiming an operation occurred.",
        "Stack push and pop at a Python list end are amortized constant time, but editing an immutable string or copying a snapshot costs proportional to copied content. An undo history retaining h full snapshots of size s can require Theta(hs) storage. This lesson uses small integers so the example isolates stack ordering; a real editor must bound history and payload memory separately."
      ]
    ],
    "problem": "Trace two undo operations, one redo and a fresh edit that clears redo.",
    "steps": [
      "Identify the representation and state its invariant before changing any link or index.",
      "Trace the fixture operation by operation, preserving references needed by later steps.",
      "Check the result and derive the operation and storage bounds separately."
    ],
    "code": "value=0; undo=[]; redo=[]\ndef edit(delta):\n    global value\n    value+=delta; undo.append(delta); redo.clear()\ndef back():\n    global value\n    delta=undo.pop(); value-=delta; redo.append(delta)\ndef forward():\n    global value\n    delta=redo.pop(); value+=delta; undo.append(delta)\nedit(4); edit(7); back(); back(); forward()\nprint(value, undo, redo)\nedit(2)\nprint(value, undo, redo)",
    "expect": "4 [4] [7]\n6 [4, 2] []",
    "limit": "Integer deltas have exact inverses here. Document commands need position and removed-content data, and external side effects may require compensation rather than literal inversion.",
    "mistakes": [
      "Retaining redo after a fresh edit replays a stale branch in a linear-history product.",
      "Counting command objects alone ignores the memory held by snapshots or deleted text."
    ],
    "takeaways": [
      "History operations and document operations have separate costs.",
      "Capture inverse information before destructive edits."
    ],
    "practice": [
      "After undoing the last edit, where is that command placed for possible replay?|Redo stack|At the bottom of undo|A sorted priority queue|Nowhere by definition|Redo retains commands in the order needed for replay.",
      "What should a fresh edit do to redo in a linear history?|Clear it|Sort it|Replay it first without user intent|Duplicate it into undo|The new edit branches from the current document state.",
      "What data is necessary to undo a deletion?|Removed text and position|Only the new document length|Only the user's name|Only the deleted byte count|The inverse must reconstruct the removed content at its location.",
      "After edits +3,+8 and one undo, what value remains from zero?|3|8|11|0|Undo reverses the most recent +8 command only.",
      "A history stores 50 one-byte edits and one 10MB deletion. Why is command count a poor memory bound?|One inverse payload can dominate retained bytes|Every command object has identical payload size|Deletion never needs inverse data|A stack compresses all text automatically|History memory depends on retained payload sizes as well as entry count.",
      "What must happen if a redo command fails before applying any change?|Keep history/state consistent|Mark it successfully committed anyway|Erase all prior undo entries|Apply every later command first|A failed state transition must not be recorded as a completed edit."
    ],
    "formal": [
      "Which command is undone first?|Latest committed command|The earliest command|The shortest command|A random command|The most recently committed command is on top of the undo stack, so LIFO reverses that edit first.",
      "What does redo do after a successful undo?|Reapply the most recently undone command|Reverse the oldest surviving command|Erase all document data|Sort all historical commands|Redo reverses the last undo in linear history.",
      "What is the amortized cost of Python list-end stack push?|O(1)|Theta(n) for every push|Theta(n squared)|Theta(log n) for every push|Occasional resizing is spread across many appends.",
      "An editor stores only the deleted character count. Why can exact undo fail?|Different deleted texts can have the same length|All deletes are inherently irreversible|Stacks cannot store text|Redo always contains the original document|Length alone does not identify the removed content.",
      "A user edits A then B, undoes B, and makes C. What should remain redoable under a linear policy?|No discarded-branch command|B automatically|A automatically|Both A and B in arrival order|A fresh edit clears redo because the old future is abandoned.",
      "An editor retains 1000 complete snapshots of s characters each. What memory model applies ignoring sharing?|Theta(1000 times s)|O(1)|Theta(log s)|Theta(s/1000)|Each snapshot retains its own document content.",
      "An undo inverse fails midway but the history was already transferred to redo. What invariant is endangered?|History/document consistency|Redo is guaranteed correct|All commands become constant time|Deleted text is automatically restored|History transitions must agree with successful document transitions.",
      "A billing dashboard offers undo after sending a payment request. Which design concern is essential?|An explicit compensation policy|A UI stack automatically retracts settled payments|Any command has an exact inverse|Deleting the stack reverses the bank transfer|External effects are not necessarily reversible by local state changes.",
      "A text command inserts m characters into an immutable string of length n. Why is O(1) undo-stack mutation not the total edit cost?|Constructing the new string can take O(n+m)|Stacks always sort inserted characters|Every edit takes O(log n)|The string is changed without allocation|The document representation can dominate the stack bookkeeping.",
      "A strict history budget is B bytes and commands carry variable-size deleted text. What admission strategy respects it while preserving valid remaining undo operations?|Track bytes; evict complete old history units|Limit only the command count regardless of payload size|Drop random bytes from command payloads|Keep every inverse and claim constant memory|Variable payloads require byte accounting; truncating inverse data corrupts retained commands."
    ]
  },
  {
    "slug": "iterative-dfs",
    "title": "Use stack frames for depth-first processing",
    "intro": "A deployment inspector walks nested dependency groups and needs to process children before finalizing their parent. Replacing recursion with a stack requires preserving the work that remains after each child. A stack of node names alone may preserve reachability but lose postorder timing.",
    "sections": [
      [
        "Explicit continuation state",
        "Recursive calls retain a return address, local state and the next child to process. An iterative traversal must represent equivalent continuation state explicitly. One common postorder frame is (node, expanded): an unexpanded frame schedules the same node as expanded, then schedules children; an expanded frame emits the node after its children finish.",
        "Because the stack is LIFO, push the right child before the left child to visit left first. For preorder, emit when a node is removed before scheduling its children. For postorder, defer emission until the expanded frame returns to the top. Traversal order is part of an API when it governs cleanup, serialization or dependency planning."
      ],
      [
        "Bound the frontier",
        "A tree with n nodes is processed a constant number of times per node in the expanded-marker method, so the time bound is O(n). On a binary tree the pending path and deferred siblings use O(h) stack entries for height h, with h potentially n for a chain. An explicit stack avoids Python call-depth limits but does not make all depth-first state constant space.",
        "For general graphs, a visited policy prevents repeated processing and cycles. Marking discovery when scheduling avoids repeated queued entries. Trees need no visited set if their structure guarantees a unique parent and no cycle. A dependency graph with shared children requires a graph algorithm and may need cycle detection, so do not assume a tree traversal produces a valid build order automatically."
      ]
    ],
    "problem": "Emit a binary dependency tree in postorder using expanded frames.",
    "steps": [
      "Identify the representation and state its invariant before changing any link or index.",
      "Trace the fixture operation by operation, preserving references needed by later steps.",
      "Check the result and derive the operation and storage bounds separately."
    ],
    "code": "children={\"root\":(\"left\",\"right\"),\"left\":(),\"right\":()}\nstack=[(\"root\",False)]; out=[]\nwhile stack:\n    node,done=stack.pop()\n    if done: out.append(node)\n    else:\n        stack.append((node,True))\n        for child in reversed(children[node]):\n            stack.append((child,False))\nprint(out)",
    "expect": "['left', 'right', 'root']",
    "limit": "The fixture is an acyclic tree. Shared dependency graphs require visited and cycle policies beyond this tree-specific demonstration.",
    "mistakes": [
      "Emitting a parent before children gives preorder, not postorder cleanup.",
      "Replacing calls with a stack removes the runtime call limit but retains depth-dependent algorithmic storage."
    ],
    "takeaways": [
      "An explicit frame represents suspended computation.",
      "Push children in reverse desired visit order."
    ],
    "practice": [
      "To visit left before right with a LIFO stack, which is pushed first?|Right|Left|Both at an identical stack location|The parent payload only|The last pushed child is popped first.",
      "When is an expanded postorder frame emitted?|After its scheduled children complete|Immediately before its children are pushed|Only when it is a leaf|Before the root is first seen|The expanded frame waits below its child frames.",
      "What runtime risk does an explicit traversal stack avoid?|Recursive depth overflow|All heap allocation|All cycles automatically|Every possible memory limit|State moves to an explicit container rather than nested interpreter calls.",
      "What does preorder do at first visit to a node?|Emit before traversing its children|Emit only after all descendants|Wait for the next tree|Always sort its children|Preorder performs the node action at entry.",
      "A leaf's unexpanded frame is popped. What can be scheduled next in the marker method?|Its completion frame|A nonexistent child|The entire tree twice|A FIFO layer sentinel only|The leaf can complete when its deferred frame is processed.",
      "What property allows tree DFS to omit a visited set safely?|Unique parent paths and no cycles|Alphabetical labels|Equal leaf depths|All payloads are distinct numbers|A true rooted tree cannot reach one node through multiple child paths."
    ],
    "formal": [
      "Which traversal emits a parent after its children?|Postorder|Preorder|Level order always|Sorted order always|Postorder completes descendants before the parent.",
      "Which information does an expanded-marker frame contain?|Node and completion-state marker|Only the total node count|Only the maximum payload|A sorted copy of all descendants|The marker distinguishes entry from deferred completion.",
      "For a binary tree of height h, what workspace bound does standard depth-first frame traversal have?|O(h)|Always O(1)|Always Theta(n squared)|O(log h)|The active path and deferred siblings grow with height.",
      "A cleanup service destroys a parent resource before its children. Which traversal correction fits child-first disposal?|Defer the parent to its expanded frame|Sort resource names|Push the root twice without markers|Use preorder deliberately|Postorder preserves descendant-before-parent actions.",
      "A tree root has children L and R. A preorder loop pushes L then R. What emission follows the root?|R then L|L then R|Neither child|A guaranteed alphabetical sort|LIFO removes the later pushed R first.",
      "A nested catalog is a chain of 50000 nodes. What workspace remains after replacing recursive DFS with explicit frames?|Theta(50000) chain-depth state|O(1) state regardless of pending path depth|Theta(log log 50000)|No storage at all|The pending continuation depth is still linear in the chain height.",
      "A dependency graph has shared child X under two parents. A tree-only traversal emits X twice. Which change targets this issue?|A visited/discovery policy|Reverse every edge without analysis|Use equal payloads as identity|Assume all DAGs are trees|Shared graph vertices require identity-based processing semantics.",
      "A graph traversal marks visited only when removing a node, allowing many predecessors to schedule it first. What can grow unnecessarily?|Duplicate pending entries|The payload bit length only|The number of distinct vertices|The graph's edge weights|Marking at scheduling can avoid repeated frontier entries for the same vertex.",
      "A binary tree has n nodes and each frame is processed twice at most. What time bound follows?|O(n)|O(n squared)|O(2 to n)|O(log n) for full traversal|A constant number of operations per node sums linearly.",
      "A production graph requires each prerequisite finalized before a task and rejects dependency cycles. Why is a plain tree expanded-marker walk insufficient?|Graph identity and cycle handling|Expanded frames guarantee every graph is acyclic|A stack always finds a shortest path|Postorder removes repeated vertices automatically|A valid dependency ordering must account for shared nodes and cycles, not just parent-child timing."
    ]
  },
  {
    "slug": "fifo-bfs",
    "title": "Use FIFO order for breadth-first distance",
    "intro": "A support router explores escalation links one hop at a time. If every edge has equal cost, processing the oldest discovered task first ensures the first discovery of a node uses the fewest hops. A deque supplies efficient operations at both ends for this frontier.",
    "sections": [
      [
        "Layer invariant",
        "Initialize the source distance to zero and append it to a queue. Repeatedly remove from the front, inspect outgoing neighbors, and append each unseen neighbor with distance one more than the current node. Mark a node when it is enqueued. Queue entries then appear in nondecreasing distance order.",
        "The first discovered path is shortest in edge count because any shorter predecessor would have been processed in an earlier layer. This proof depends on equal edge costs. With travel times or monetary costs, a one-edge route may be worse than a two-edge route, so FIFO discovery is not a weighted shortest-path method."
      ],
      [
        "Represent the work efficiently",
        "With adjacency lists, each reachable vertex is enqueued once and each outgoing edge is inspected once. Time is O(V+E); distance and frontier storage are O(V). Python list.pop(0) shifts remaining elements and can make repeated dequeues expensive. collections.deque.popleft expresses the required operation efficiently.",
        "An inbound work queue may additionally need bounded capacity, acknowledgements, persistence and fairness. A local deque is a data structure, not a durable message broker. For a synthetic escalation graph it is enough to demonstrate FIFO correctness; real failures and retries belong in a separate service protocol."
      ]
    ],
    "problem": "Compute shortest unweighted hop counts in an escalation graph.",
    "steps": [
      "Identify the representation and state its invariant before changing any link or index.",
      "Trace the fixture operation by operation, preserving references needed by later steps.",
      "Check the result and derive the operation and storage bounds separately."
    ],
    "code": "from collections import deque\ng={\"A\":[\"B\",\"C\"],\"B\":[\"D\"],\"C\":[\"D\"],\"D\":[]}\ndist={\"A\":0}; q=deque([\"A\"])\nwhile q:\n    u=q.popleft()\n    for v in g[u]:\n        if v not in dist:\n            dist[v]=dist[u]+1; q.append(v)\nprint(dist)\nprint(len(dist))",
    "expect": "{'A': 0, 'B': 1, 'C': 1, 'D': 2}\n4",
    "limit": "The graph is local and unweighted. The fixture checks hop counts; the vertex/edge visitation argument provides the complexity bound.",
    "mistakes": [
      "Using list.pop(0) repeatedly shifts the remaining list; use a deque for FIFO removal.",
      "Marking only after dequeue can schedule the same node through multiple parents."
    ],
    "takeaways": [
      "FIFO preserves unweighted distance layers.",
      "Queue behavior does not imply durability or weighted optimality."
    ],
    "practice": [
      "Which deque operation removes the oldest item after append adds new work?|popleft|pop|appendleft|clear|Appending right and removing left gives FIFO order.",
      "When should standard BFS mark a vertex discovered?|When it is enqueued|Only after every neighbor has enqueued it|After traversal ends|Only when its payload is zero|Discovery marking prevents duplicate frontier scheduling.",
      "What distance does BFS optimize in an unweighted graph?|Number of edges|Arbitrary total monetary cost|Largest edge label|Lexical node order|Each edge contributes one equal step.",
      "In BFS, a source has no outgoing edges. What distance map is produced?|Only source mapped to zero|An empty map|Source mapped to one|Every graph node mapped to zero|Initialization discovers the source and no neighbors are added.",
      "A deque contains A,B,C from left to right. After popleft then append D, what is its order?|B,C,D|D,B,C|C,B,D|A,B,D|FIFO removes A and appends D at the opposite end.",
      "Why record a BFS parent at first discovery rather than replacing it with every later edge?|It preserves a shortest-hop predecessor|Later parents always have smaller distance|It prevents any graph from having cycles|The node payload becomes immutable|First discovery fixes a minimum-edge path under the layer invariant."
    ],
    "formal": [
      "What order does a FIFO queue remove items in?|Arrival order|Reverse arrival order|Numerical priority order|Random order|The oldest inserted item is removed first.",
      "Which Python container supports efficient append and popleft?|collections.deque|An immutable tuple|A string|A set with sorted removal|A deque directly supports both end operations.",
      "What is adjacency-list BFS time over reachable vertices and edges?|O(V+E)|O(V times E) necessarily|O(log V)|O(1)|Each reachable vertex and outgoing edge is processed a bounded number of times.",
      "An escalation graph has paths A-D and A-B-D with unit edge costs. Which distance is assigned to D?|1|2|3|It cannot be reached|The direct edge reaches D in the first layer.",
      "A route has a direct edge costing 100 and a two-edge path costing 2. Why is FIFO BFS insufficient for minimum cost?|Equal edge-cost assumptions are violated|BFS never visits direct neighbors|Two edges always cost more than one|Deque capacity must equal cost|Hop count does not order unequal path costs.",
      "A wide star graph queues n-1 leaves after its center. What is worst-case frontier space?|Theta(n)|O(1)|Theta(log n)|Theta(n squared)|All leaves can wait simultaneously.",
      "An ingestion loop repeatedly removes index zero from a Python list of n queued jobs. What worst-case total shift work can result?|Theta(n squared)|Theta(n)|Theta(log n)|O(1)|Successive front removals shift n-1,n-2,... items.",
      "A cyclic escalation graph is traversed without a discovered set. What failure can occur?|Repeated revisits can prevent termination|FIFO guarantees cycle removal|Every node is visited exactly once automatically|The graph becomes a tree|A queue alone does not remember visited identities.",
      "A service must reconstruct one shortest-hop route after BFS. Which additional state suffices?|A first-discovery predecessor|Every possible route|Only the largest queue size|A sorted copy of all node labels|One parent per discovered vertex reconstructs a shortest-path tree.",
      "A dense unweighted graph has V vertices and Theta(V squared) edges, all reachable. Under adjacency-list BFS with discovery marking, which bounds fit?|Theta(V squared) time; O(V) auxiliary space|Theta(V) time and Theta(V squared) frontier|Theta(log V) time and O(1) space|Theta(V cubed) time necessarily|Every edge must be inspected, while each vertex is enqueued only once; the input adjacency storage is excluded from auxiliary space."
    ]
  },
  {
    "slug": "deque-windows",
    "title": "Maintain a monotonic deque for sliding maxima",
    "intro": "A traffic dashboard needs the largest request count in each recent fixed-width window. Rescanning every window repeats work. A deque of candidate indices can discard values that can never again become a maximum while retaining correct expiration information.",
    "sections": [
      [
        "Candidate invariant",
        "Store indices in increasing time order while their corresponding values decrease from front to back. Before adding index i, remove expired front indices smaller than i-k+1. Remove back indices whose values are less than or equal to the new value, then append i. The front names the maximum of the current window.",
        "A new value at least as large as an older candidate dominates it: the new value is no smaller and will expire later. The older candidate can never be needed for a future window that still contains it. Retaining indices rather than values also distinguishes equal values and tells exactly when a candidate expires."
      ],
      [
        "Amortized count and constraints",
        "Every index is appended once and removed at most once, either from the front by expiration or the back by domination. Across n inputs there are O(n) deque operations, even if one arrival triggers many back removals. Workspace is O(k) candidate indices; the output list adds O(n-k+1) result storage if materialized.",
        "This maximum-specific dominance rule does not automatically compute medians or arbitrary quantiles. A dashboard needing a median requires a different data structure and deletion policy. Validate 1 <= k <= n for the demonstrated finite-array contract. Streaming services can emit outputs incrementally to avoid storing all prior result values."
      ]
    ],
    "problem": "Compute width-three window maxima without rescanning every window.",
    "steps": [
      "Identify the representation and state its invariant before changing any link or index.",
      "Trace the fixture operation by operation, preserving references needed by later steps.",
      "Check the result and derive the operation and storage bounds separately."
    ],
    "code": "from collections import deque\ndef maxima(xs,k):\n    if not 1<=k<=len(xs): raise ValueError(\"invalid window\")\n    q=deque(); out=[]\n    for i,x in enumerate(xs):\n        while q and q[0]<i-k+1: q.popleft()\n        while q and xs[q[-1]]<=x: q.pop()\n        q.append(i)\n        if i>=k-1: out.append(xs[q[0]])\n    return out\nprint(maxima([1,3,-1,-3,5,3,6,7],3))\nprint(maxima([2,2],1))",
    "expect": "[3, 3, 5, 5, 6, 7]\n[2, 2]",
    "limit": "Numeric comparisons are treated as constant-cost. The append/remove accounting proves linear work; printed examples verify values and boundary behavior.",
    "mistakes": [
      "Storing only values obscures which equal-valued candidate expires; retain indices.",
      "Multiplying the outer loop count by the worst one-step pop count ignores that each index is removed once."
    ],
    "takeaways": [
      "Dominance plus expiration gives the candidate rule.",
      "Amortized analysis counts operations across the complete stream."
    ],
    "practice": [
      "What does the deque front represent after each completed window update?|The current window maximum's index|The smallest value ever seen|The total request sum|The newest index unconditionally|Candidates decrease in value from front to back.",
      "Why remove an older candidate when a newer value is at least as large?|No smaller; expires later|Older values can never be compared|The window must contain distinct values|All equal values are invalid|No future window containing the older candidate can prefer it to the newer no-smaller one.",
      "What index expires at time i for width k?|Any index less than i-k+1|Every index greater than i|Only index i|Every negative value|The live window starts at i-k+1.",
      "For width two, after samples 9 then 8, which candidate values remain?|9,8|8 only|9 only|No candidates|The lower new value does not dominate the older larger value.",
      "For width two, sample 10 arrives after 9,8. Which values remain after expiration and domination?|10 only|9,8,10|8,10|9,10|Nine expires and ten dominates eight.",
      "Why is the window start i-k+1 rather than i-k?|Inclusive width is k|Arrays must use one-based indexing|All windows omit the current value|Deque entries store payload counts|Inclusive endpoints from i-k+1 through i contain k indices."
    ],
    "formal": [
      "What information is stored in a monotonic window deque?|Candidate indices|Only the final maximum ever|All sorted result windows|Only input length|Indices support both value comparison and expiration.",
      "How are candidate values ordered for window maxima?|Nonincreasing from front to back|Increasing from front to back|Randomly|All strictly negative|Smaller or equal dominated back values are removed before appending.",
      "How many times is one index appended during a scan?|Once|k times|n times|Once per earlier window|Each input position is considered at its own arrival.",
      "A dashboard scans [4,1,3] with width 2. What maxima are emitted?|[4,3]|[1,1]|[4,4]|[3,4]|The two windows are [4,1] and [1,3].",
      "A width-k stream is strictly decreasing. What is the maximum candidate deque size?|k|1|n squared|0|No candidate is dominated before it expires, so all k window indices can remain.",
      "One new sample removes k-1 candidates from the back. Why is total scan work still O(n)?|Each removed index can never be removed again|Every individual update is worst-case O(1)|The values must be random|The deque sorts in O(log n)|A global one-insertion/one-removal accounting gives the amortized bound.",
      "A streaming report only needs to emit maxima to a consumer. Which storage can be avoided?|The full output array|The live candidate deque in every input case|The window width setting|All current indices even for decreasing input|Incremental emission removes output accumulation while candidate state remains necessary.",
      "An engineer reuses maximum-deque domination to calculate medians. Why is this invalid?|Smaller values still affect rank|Medians always equal maxima|Deque operations cannot compare numbers|A median has no window definition|Discarding smaller values preserves maxima but loses rank information.",
      "A sample equal to the current back value arrives and the algorithm removes the older equal candidate. Is correctness preserved?|Yes; newer equal values expire later|No, every duplicate must remain forever|Only when k equals one|Only if the equal value is zero|The newer candidate has the same value and a longer remaining lifetime.",
      "A system allows O(k) workspace and must output all n-k+1 maxima without materializing them. Which complexity statement is accurate under constant-cost comparisons?|O(n) work; O(k) auxiliary state|O(nk) total work is mandatory|O(1) total storage including all pending candidates|O(log n) total scan time|Each index enters and leaves at most once, and at most k live indices need be retained."
    ]
  },
  {
    "slug": "priority-scheduling",
    "title": "Schedule by priority with heap tuples",
    "intro": "A maintenance dispatcher serves the most urgent pending task first rather than the earliest arrival. A heap maintains a partial ordering that exposes the smallest key efficiently. An explicit sequence number resolves equal priorities deterministically without comparing arbitrary task objects.",
    "sections": [
      [
        "Heap invariant and stable ties",
        "A min-heap stores each parent key no greater than either child key. This ensures only the root is globally minimum; the underlying array is not sorted. heappush repairs the path upward and heappop repairs the path downward, so each uses O(log n) comparisons in the worst case on n pending entries.",
        "Represent an entry as (priority, sequence, task). Python tuple comparison first examines priority, then sequence. A unique increasing sequence yields FIFO tie order and prevents comparison of non-orderable task payloads. Smaller numeric keys mean earlier service in this min-heap convention; reverse the priority encoding if the business uses larger numbers for greater urgency."
      ],
      [
        "Scheduling policies and resources",
        "Building a heap with heapify is O(n) because most nodes are near leaves and require little downward work. Inserting n entries individually is O(n log n) as a general worst-case bound. Keeping only the best k items in a bounded heap uses O(k) retained entries, but the min/max orientation depends on whether the root should be the best item to serve or the worst retained item to evict.",
        "A heap does not guarantee fairness. A stream of urgent arrivals can indefinitely postpone low-priority work; aging or separate service quotas may be needed. Priority updates and cancellations also need design: mutating a stored key in place breaks the invariant unless repaired, while lazy invalidation retains stale entries until cleanup."
      ]
    ],
    "problem": "Process equal-priority tasks in arrival order without comparing payload dictionaries.",
    "steps": [
      "Identify the representation and state its invariant before changing any link or index.",
      "Trace the fixture operation by operation, preserving references needed by later steps.",
      "Check the result and derive the operation and storage bounds separately."
    ],
    "code": "import heapq\nheap=[]\nfor seq,(priority,name) in enumerate([(2,\"batch\"),(1,\"urgent-A\"),(1,\"urgent-B\")]):\n    heapq.heappush(heap,(priority,seq,{\"name\":name}))\nout=[]\nwhile heap:\n    out.append(heapq.heappop(heap)[2][\"name\"])\nprint(out)",
    "expect": "['urgent-A', 'urgent-B', 'batch']",
    "limit": "This local heap demonstrates deterministic ordering, not durable execution, fairness or distributed exactly-once handling.",
    "mistakes": [
      "Equal priorities without a tie-break key may compare incompatible payloads.",
      "Changing an in-heap priority without repair invalidates future extraction order."
    ],
    "takeaways": [
      "A heap gives a minimum, not a fully sorted array.",
      "Priority policy, tie order and starvation policy must be explicit."
    ],
    "practice": [
      "What key is returned first by a Python min-heap?|The smallest key|The largest key|The newest entry always|A random leaf|The min-heap invariant places a globally minimal key at the root.",
      "Why include a unique sequence before a dictionary payload?|An ordered unique tie key|Make heapify quadratic|Prevent all cancellation|Turn the heap into a linked list|Tuple comparison stops at the unequal sequence field.",
      "Does a heap array necessarily appear fully sorted?|No|Yes, always ascending|Yes, always descending|Only with duplicate keys|The invariant constrains parent-child relations rather than all array positions.",
      "A heap stores priorities 1,4,2 in a valid array. Is the array sorted?|No, heap order permits 4 before 2|Yes, every heap array is ascending|No, because 1 cannot be root|Only if all tasks have equal payloads|Both child keys exceed the root even though siblings are unsorted.",
      "What is the tie behavior of unique increasing sequence keys?|Earlier sequence comes first|Later arrivals always compare smaller|Task dictionaries are compared first|Equal priorities are rejected|Tuple comparison uses sequence only after equal priority.",
      "A job is popped for execution but execution fails. Does heap removal itself provide automatic retry?|No, retry belongs to execution policy|Yes, the heap reinserts failed tasks|Yes, tuples preserve exactly-once semantics|Only when priority is zero|The data structure orders entries; application protocol handles failure and retry."
    ],
    "formal": [
      "Which structure exposes the smallest priority efficiently?|Min-heap|Unordered FIFO queue|Plain stack|An immutable unsorted tuple alone|The root of a min-heap has a smallest key.",
      "What is a standard worst-case heappush bound for n existing entries?|O(log n)|O(1) for every push|Theta(n squared)|Theta(2 to n)|A push repairs at most a root-to-leaf path.",
      "What does heapify do to an existing entry list?|Build a heap in O(n) time|Sort it fully in O(n) time|Remove all duplicate payloads|Guarantee FIFO for every key|Bottom-up repair yields a heap with a linear total work bound.",
      "A dispatcher uses smaller numbers for urgency and entries (priority,sequence,task). Which task is first among (2,0,A), (1,1,B), (1,2,C)?|B|A|C|All must have equal priority|Priority one precedes two and sequence one precedes two.",
      "A developer changes a heap entry's priority from 50 to 0 without repair. What can happen?|The next pop may miss the actual smallest entry|The root is always repaired automatically|The entire array instantly sorts|Payload dictionaries become comparable|Arbitrary mutation bypasses heap maintenance.",
      "An endless stream of urgent tasks prevents low-priority work from running. What property is missing?|A fairness or aging policy|The parent-child heap invariant|A dictionary payload|A unique sequence alone|Correct priority extraction does not prevent starvation.",
      "A scheduler cancels jobs by marking entries stale and skips them only on pop. What storage concern arises?|Stale entries may accumulate and need compaction|Cancelled entries vanish immediately|The heap becomes constant size|No memory remains associated with stale payloads|Lazy deletion retains entries until they reach removal or cleanup.",
      "A service receives n jobs already in a list before dispatch begins. Which initialization has the stronger general construction bound?|O(n) heapify construction|Sorting in O(1)|Appending without heapify always preserves heap order|Reversing the list guarantees a heap|Bottom-up heap construction has a linear work bound.",
      "A top-k largest-score service stores k retained scores and wants to evict the weakest retained score on improvement. Which orientation is useful?|Min-heap of retained scores|Max-heap with the strongest at root for every eviction|FIFO queue ignoring scores|Stack of all historical scores|The minimum retained score is the eviction threshold for keeping the largest k.",
      "A priority service must support deterministic equal-priority FIFO, unorderable task payloads, and arbitrary cancellations while bounding stale storage. Which design addresses all three?|Sequence keys, active map, bounded stale cleanup|Use (priority,payload-dict) and mutate keys directly|Use only a sequence stack with no priority key|Keep all cancelled entries forever and claim O(active jobs) storage|The tuple separates ordering from payloads, the map tracks cancellation, and compaction restores a bound relative to active work."
    ]
  }
],["Doc/tutorial/datastructures.rst", "Doc/library/collections.rst", "Doc/library/heapq.rst"]);
