'use strict';
/** Software Engineering & Data Structures/Algorithms track. Code in Python. */
const { mc, out, written, submission } = require('../q');

module.exports = [
  // ---- OOP ----
  mc('se-oo-01', 'se.oop', 1, 'What is encapsulation in object-oriented programming?', ['Keeping an object\'s data and the methods that use it together, and hiding internal details', 'Copying objects', 'Writing all code in one file', 'Deleting unused classes'], 0,
    'Encapsulation protects an object\'s internal state behind a clear interface.'),
  out('se-oo-02', 'se.oop', 2, 'What does this print?', 'class Animal:\n    def sound(self):\n        return "..."\n\nclass Dog(Animal):\n    def sound(self):\n        return "Woof"\n\nprint(Dog().sound())', ['Woof'],
    'Dog overrides sound, so calling it on a Dog uses the subclass version (polymorphism).'),
  mc('se-oo-p1', 'se.oop', 2, 'Every Student shares the same list of courses: adding a course to one student adds it to all. What is the fix?',
    ['Create the list per instance in __init__: self.courses = []', 'Rename courses to Courses', 'Make courses a tuple', 'Delete the class attribute and use a global'], 0,
    'A list defined at class level is one object shared by all instances. Creating it in __init__ gives each student their own.',
    { type: 'debug', code: 'class Student:\n    courses = []\n    def enrol(self, c):\n        self.courses.append(c)' }),
  mc('se-oo-s1', 'se.oop', 3, 'A payment module needs card, JazzCash and bank-transfer payments, and more methods will be added later. Which design fits?',
    ['A common PaymentMethod interface with one class per method, so new methods are added without changing existing code', 'One huge function with an if/elif for every method', 'Copy-paste the code for each method', 'Store the method name in a global variable'], 0,
    'Programming to an interface (open/closed principle) lets you add behaviour by adding classes.', { type: 'scenario' }),

  // ---- Arrays and strings ----
  out('se-ar-01', 'se.arrays_strings', 1, 'What does this print?', 'nums = [10, 20, 30, 40]\nprint(nums[-1])', ['40'], 'Negative indexes count from the end; -1 is the last element.'),
  out('se-ar-02', 'se.arrays_strings', 2, 'What does this print?', 's = "programming"\nprint(s[3:7])', ['gram'], 'Slicing takes indexes 3 up to (not including) 7: g, r, a, m.'),
  mc('se-ar-p1', 'se.arrays_strings', 3, 'You need two numbers in a SORTED list that add up to a target, in O(n) time. Which approach works?',
    ['Two pointers: start at both ends; move left up if the sum is too small, right down if too big', 'Check every pair with two nested loops', 'Sort the list again inside a loop', 'Pick random pairs'], 0,
    'On sorted data, moving the pointers inwards finds the pair in a single pass; nested loops are O(n^2).', { practical: true }),
  mc('se-ar-s1', 'se.arrays_strings', 3, 'A feature must find whether any two students in a list of 100,000 share the same email. Which approach is best?',
    ['Insert emails into a set while scanning; a repeat means a duplicate (O(n))', 'Compare every pair of students', 'Sort by name and print the list', 'Ask users to check'], 0,
    'A hash set gives constant-time membership checks, so one pass finds duplicates.', { type: 'scenario' }),

  // ---- Linked lists ----
  mc('se-ll-01', 'se.linked_lists', 1, 'What does each node in a singly linked list store?', ['A value and a reference to the next node', 'Only an index', 'The whole list', 'A reference to the previous node only'], 0,
    'Nodes chain together through next references.'),
  mc('se-ll-02', 'se.linked_lists', 2, 'Compared with an array, what is a linked list good at?', ['Inserting or removing at a known node in O(1) without shifting elements', 'Fast access to the i-th element', 'Using less memory per element', 'Binary search'], 0,
    'Linked lists avoid shifting elements, but finding the i-th element takes O(n).'),
  mc('se-ll-p1', 'se.linked_lists', 3, 'This function should reverse a linked list, but it loses the rest of the list after the first node. Which line fixes the loop body?',
    ['nxt = cur.next; cur.next = prev; prev = cur; cur = nxt', 'cur.next = prev; cur = cur.next', 'prev = cur; cur = cur.next', 'cur = prev; prev = cur.next'], 0,
    'Save the next node before redirecting cur.next, otherwise the rest of the list is unreachable.',
    { type: 'debug', code: 'def reverse(head):\n    prev, cur = None, head\n    while cur:\n        cur.next = prev\n        prev = cur\n        cur = cur.next\n    return prev' }),
  mc('se-ll-s1', 'se.linked_lists', 3, 'A music app needs "next" and "previous" song buttons and must remove songs from the middle of a playlist quickly. Which structure fits?',
    ['A doubly linked list (with a hash map from song to node for fast lookup)', 'A single string of song names', 'A sorted array that is rebuilt each time', 'A stack'], 0,
    'Doubly linked nodes move both ways and unlink in O(1); a map finds the node quickly.', { type: 'scenario' }),

  // ---- Stacks and queues ----
  mc('se-sq-01', 'se.stacks_queues', 1, 'Which structure is used to undo the last action in a text editor?', ['A stack', 'A queue', 'A tree', 'A graph'], 0, 'Undo removes the most recent action first: last in, first out.'),
  mc('se-sq-02', 'se.stacks_queues', 2, 'Why is collections.deque better than a list for a queue in Python?', ['popleft() is O(1), while list.pop(0) shifts every element (O(n))', 'deque sorts items', 'Lists cannot hold strings', 'deque uses no memory'], 0,
    'deque is a double-ended queue optimised for both ends.'),
  mc('se-sq-p1', 'se.stacks_queues', 3, 'Which algorithm correctly checks whether brackets such as "([]{})" are balanced?',
    ['Push each opening bracket; on a closing bracket pop and check it matches; at the end the stack must be empty', 'Count opening and closing brackets and compare totals', 'Reverse the string and compare', 'Sort the characters'], 0,
    'Counting fails for "([)]"; a stack checks that each closing bracket matches the most recent unmatched opening one.', { practical: true }),
  mc('se-sq-s1', 'se.stacks_queues', 3, 'A printing service in a computer lab must print jobs in the order they arrive, but staff jobs should go first. Which structure fits?',
    ['A priority queue (or one queue per priority level)', 'A stack', 'An unsorted list scanned randomly', 'A single variable'], 0,
    'A priority queue serves higher-priority items first and keeps arrival order within a priority.', { type: 'scenario' }),

  // ---- Trees and graphs ----
  mc('se-tg-01', 'se.trees_graphs', 1, 'In a binary search tree, where are values smaller than a node stored?', ['In its left subtree', 'In its right subtree', 'In the root only', 'Anywhere'], 0, 'BST order: left smaller, right larger, which makes search O(log n) when balanced.'),
  mc('se-tg-02', 'se.trees_graphs', 2, 'Which traversal finds the shortest path (fewest edges) in an unweighted graph?', ['Breadth-first search', 'Depth-first search', 'In-order traversal', 'Random walk'], 0,
    'BFS explores level by level, so the first time it reaches a node is by the fewest edges.'),
  mc('se-tg-p1', 'se.trees_graphs', 3, 'This DFS on a graph with cycles never finishes. What is missing?',
    ['A visited set: skip nodes already visited and mark each node when first reached', 'A larger recursion limit', 'Sorting the neighbours', 'A return statement inside the loop'], 0,
    'Without tracking visited nodes, DFS follows cycles forever.',
    { type: 'debug', code: 'def dfs(node, graph):\n    for nxt in graph[node]:\n        dfs(nxt, graph)' }),
  mc('se-tg-s1', 'se.trees_graphs', 3, 'You must plan the cheapest bus route between two cities, where each road has a different fare. Which algorithm fits?',
    ['Dijkstra\'s algorithm (non-negative weights)', 'Plain breadth-first search', 'Binary search', 'Bubble sort'], 0,
    'With weighted edges, BFS no longer gives the cheapest path; Dijkstra does when weights are non-negative.', { type: 'scenario' }),

  // ---- Algorithms ----
  mc('se-al-01', 'se.algorithms', 1, 'What must be true for binary search to work?', ['The data must be sorted', 'The data must contain only numbers', 'The list must have an even length', 'Nothing'], 0,
    'Binary search discards half the range each step, which only makes sense on sorted data.'),
  mc('se-al-02', 'se.algorithms', 2, 'What is the key idea of dynamic programming?', ['Solve overlapping subproblems once and reuse their results', 'Try random solutions', 'Always use recursion without storing results', 'Sort the input first'], 0,
    'Memoising or tabulating subproblem results avoids recomputing them.'),
  out('se-al-p1', 'se.algorithms', 3, 'What does this print?', 'def ways(n, memo={}):\n    if n <= 1:\n        return 1\n    if n not in memo:\n        memo[n] = ways(n - 1) + ways(n - 2)\n    return memo[n]\n\nprint(ways(5))', ['8'],
    'ways counts the ways to climb n stairs taking 1 or 2 steps: 1, 1, 2, 3, 5, 8 for n = 0..5.', { category: 'practical' }),
  mc('se-al-s1', 'se.algorithms', 3, 'You must schedule exams in rooms so that no student has two exams at the same time. How would you model the problem?',
    ['As graph colouring: exams are nodes, an edge joins exams sharing a student, and colours are time slots', 'As sorting exams alphabetically', 'As binary search on room numbers', 'As a single queue'], 0,
    'Recognising the underlying problem lets you reuse known algorithms and heuristics.', { type: 'scenario' }),

  // ---- Complexity ----
  mc('se-cx-01', 'se.complexity', 1, 'What is the time complexity of accessing nums[i] in a Python list?', ['O(1)', 'O(n)', 'O(log n)', 'O(n^2)'], 0, 'Lists are arrays underneath, so indexing is constant time.'),
  mc('se-cx-02', 'se.complexity', 2, 'Two nested loops each run n times. What is the overall complexity?', ['O(n^2)', 'O(n)', 'O(2n)', 'O(log n)'], 0, 'n iterations of an n-step loop gives n x n operations.'),
  mc('se-cx-p1', 'se.complexity', 3, 'This duplicate check is too slow for 100,000 items. What is its complexity, and how do you make it O(n)?',
    ['O(n^2); use a set to remember seen items', 'O(n); it is already optimal', 'O(log n); sort first', 'O(1); nothing to change'], 0,
    'Each `in` on a list scans it, inside a loop - quadratic. Set membership is O(1) on average.',
    { type: 'debug', code: 'def has_dup(items):\n    seen = []\n    for x in items:\n        if x in seen:\n            return True\n        seen.append(x)\n    return False' }),
  mc('se-cx-s1', 'se.complexity', 3, 'An O(n^2) algorithm takes 1 second for 1,000 items. Roughly how long for 10,000 items?', ['About 100 seconds', 'About 10 seconds', 'About 2 seconds', 'About 1,000 seconds'], 0,
    '10 times the input means 10^2 = 100 times the work for a quadratic algorithm.', { type: 'scenario' }),

  // ---- Software design ----
  mc('se-ds-01', 'se.design', 1, 'What does the single-responsibility principle say?', ['A class or module should have one reason to change', 'Every program should have one class', 'Functions should have one line', 'Only one developer should edit a file'], 0,
    'Separating responsibilities keeps changes small and code easier to test.'),
  mc('se-ds-02', 'se.design', 2, 'Why pass a database object into a class (dependency injection) instead of creating it inside?', ['So the class can be tested with a fake database and reused with different ones', 'It runs faster', 'It hides bugs', 'Python requires it'], 0,
    'Injected dependencies make code testable and loosely coupled.'),
  mc('se-ds-p1', 'se.design', 3, 'This function calculates a fee, saves it to the database and emails the student. What is the best refactor?',
    ['Split it: a pure calculate_fee() plus separate save and notify steps, so the calculation can be unit-tested', 'Make it longer', 'Add more parameters', 'Copy it into each caller'], 0,
    'Separating pure logic from side effects makes each part testable and reusable.', { type: 'debug' }),
  mc('se-ds-s1', 'se.design', 3, 'A teammate wants to add a complex plugin system "in case we need it later" to a two-week project. What do you advise?',
    ['Build the simplest design that meets today\'s requirements, keep it clean, and refactor when a real need appears (YAGNI)', 'Build the plugin system first', 'Skip design entirely', 'Rewrite the project in another language'], 0,
    'Speculative complexity costs time now and often never pays off.', { type: 'scenario' }),

  // ---- Reviewed ----
  written('se-wr-01', 'se.complexity', 2, 'theory', 'Explain what Big-O notation describes and compare the complexity of linear search and binary search, saying when each can be used.',
    [['Big-O describes how cost grows with input size (worst case / upper bound)', 2], ['Linear search O(n), binary search O(log n)', 2], ['Binary search needs sorted data; linear works on any data', 2]],
    'Big-O describes how running time (or memory) grows as the input grows, usually in the worst case. Linear search checks items one by one, O(n), and works on any list; binary search halves a sorted range each step, O(log n), but needs sorted data.'),
  submission('se-sb-01', ['se.algorithms', 'se.arrays_strings'], 3, 'Write a Python function first_unique(s) that returns the index of the first character that appears exactly once in s, or -1 if none. State its time complexity and include three test cases (with an edge case).',
    [['Correct result, including -1 when none', 3], ['O(n) approach (count, then scan) with the complexity stated correctly', 2], ['Three tests including an edge case (empty string or all repeated)', 2], ['Readable code', 1]],
    'from collections import Counter\ndef first_unique(s):\n    counts = Counter(s)\n    for i, ch in enumerate(s):\n        if counts[ch] == 1:\n            return i\n    return -1\n# O(n) time, O(k) extra space\nassert first_unique("leetcode") == 0\nassert first_unique("aabb") == -1\nassert first_unique("") == -1'),
  written('se-wr-02', 'se.design', 3, 'scenario', 'You join a team whose 3,000-line "utils.py" is edited by everyone and breaks often. Describe how you would improve it safely without stopping feature work.',
    [['Adds tests around current behaviour before changing it', 2], ['Splits by responsibility into smaller modules incrementally', 2], ['Small, reviewable steps alongside feature work', 1], ['Agrees conventions/ownership to prevent regrowth', 1]],
    'First write characterisation tests for the most-used functions so behaviour is protected. Then move functions into cohesive modules a few at a time, keeping imports working, in small reviewed pull requests between feature tasks. Agree module ownership and conventions so the file does not grow back.'),
];
