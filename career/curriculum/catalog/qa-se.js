'use strict';
/** Software QA & test automation, and software engineering & DSA subtracks. */
const { S } = require('../dsl');

module.exports = [
  S('sdlc-foundations', 'Software Development and SDLC Foundations', 'How software is planned, built, tested and released.',
    { level: 'foundation', depth: 1, hours: 10, refs: [] }, [
      ['Life cycle models', ['!Compare waterfall, agile, scrum and kanban', 'Describe roles in a product team']],
      ['Requirements', ['!Read user stories and acceptance criteria and spot gaps']],
      ['Releases', ['Describe environments, builds and release processes']],
    ]),
  S('qa-principles', 'QA Principles and Testing Methodologies', 'Why and how software is tested.',
    { level: 'beginner', depth: 2, hours: 12, prereq: ['sdlc-foundations'], refs: [] }, [
      ['Testing principles', ['!Apply testing principles (defects cluster, exhaustive testing is impossible)', 'Distinguish verification and validation']],
      ['Test levels and types', ['!Choose unit, integration, system and acceptance testing', 'Distinguish functional and non-functional testing']],
      ['Risk-based testing', ['!Prioritise testing by risk and impact']],
    ]),
  S('test-design', 'Test Planning and Test Case Design', 'Designing effective test cases and plans.',
    { level: 'intermediate', depth: 3, hours: 15, prereq: ['qa-principles'], refs: [] }, [
      ['Test design techniques', ['!Apply equivalence partitioning and boundary value analysis', 'Use decision tables and state transitions']],
      ['Test cases', ['!Write clear test cases with preconditions, steps and expected results']],
      ['Test plans', ['Write a test plan with scope, approach, entry and exit criteria']],
    ]),
  S('defect-management', 'Defect Management and Bug Reporting', 'Reporting and managing defects so they get fixed.',
    { level: 'beginner', depth: 2, hours: 8, prereq: ['qa-principles'], refs: [] }, [
      ['Bug reports', ['!Write reproducible bug reports with environment, steps and evidence']],
      ['Triage', ['!Distinguish severity and priority and triage defects']],
      ['Defect life cycle', ['Track defects through their life cycle and verify fixes']],
    ]),
  S('functional-regression-exploratory', 'Functional, Regression and Exploratory Testing', 'Testing features, protecting old behaviour and exploring for surprises.',
    { level: 'intermediate', depth: 2, hours: 12, prereq: ['test-design'], refs: [] }, [
      ['Functional testing', ['!Test features against requirements, including negative cases']],
      ['Regression testing', ['!Select and maintain regression suites for changes']],
      ['Exploratory testing', ['Run time-boxed exploratory sessions with charters']],
    ]),
  S('web-api-testing', 'Web and API Testing', 'Testing web applications and HTTP APIs.',
    { level: 'intermediate', depth: 3, hours: 15, prereq: ['functional-regression-exploratory', 'http-web-architecture'], refs: [] }, [
      ['Web testing', ['!Test forms, browsers, sessions and responsive layouts', 'Use DevTools for evidence']],
      ['API testing', ['!Assert status codes, response bodies, headers and error handling', 'Test authentication and authorization rules']],
      ['Contracts and data', ['Use schema and contract tests and isolated test data']],
    ]),
  S('test-data-management', 'SQL and Test Data Management', 'Preparing and verifying data for testing.',
    { level: 'intermediate', depth: 2, hours: 10, prereq: ['sql-fundamentals'], refs: [] }, [
      ['Test data', ['!Create isolated, repeatable test data and clean it up']],
      ['Database verification', ['!Verify application changes in the database with SQL']],
      ['Privacy', ['Mask production data used for testing']],
    ]),
  S('playwright-automation', 'Playwright/Selenium Fundamentals', 'Automating browser tests with Playwright and Selenium.',
    { level: 'intermediate', depth: 3, hours: 20, prereq: ['js-fundamentals', 'web-api-testing'], refs: [] }, [
      ['Locators and actions', ['!Choose stable locators (roles, test ids) and perform actions']],
      ['Waiting and assertions', ['!Use auto-waiting and web-first assertions instead of fixed sleeps']],
      ['Test setup', ['!Isolate tests with fixtures and authenticated state', 'Run tests across browsers']],
    ]),
  S('automation-frameworks', 'Automation Frameworks and Test Architecture', 'Building maintainable automation suites.',
    { level: 'advanced', depth: 3, hours: 15, prereq: ['playwright-automation'], refs: [] }, [
      ['Framework design', ['!Use page objects, fixtures and helpers for maintainable tests']],
      ['Test pyramid', ['!Balance unit, API and UI tests for speed and confidence']],
      ['Flakiness', ['!Diagnose and fix flaky tests']],
    ]),
  S('ci-test-reporting', 'CI/CD Integration and Test Reporting', 'Running tests in pipelines and reporting results.',
    { level: 'intermediate', depth: 2, hours: 10, prereq: ['automation-frameworks', 'git-collaboration'], refs: [] }, [
      ['Tests in CI', ['!Run tests on pull requests and gate merges', 'Parallelise and shard test runs']],
      ['Reporting', ['!Publish reports, traces and artifacts for failures']],
      ['Quality gates', ['Define quality gates and release criteria']],
    ]),
  S('performance-quality-engineering', 'Performance, Reliability and Quality Engineering', 'Testing performance and building quality into delivery.',
    { level: 'advanced', depth: 3, hours: 12, prereq: ['web-api-testing'], refs: [] }, [
      ['Performance testing', ['!Design load, stress and soak tests and read their results', 'Interpret latency percentiles and throughput']],
      ['Reliability testing', ['Test failure recovery and resilience']],
      ['Quality engineering', ['Shift testing left and track quality metrics']],
    ]),

  // ---------------- Software engineering & DSA ----------------
  S('oop-principles', 'Object-Oriented Programming', 'Designing with objects: encapsulation, inheritance, polymorphism and SOLID basics.',
    { level: 'intermediate', depth: 3, hours: 20, prereq: ['programming-foundations'], refs: ['fc02-cpp-objects', 'cpp-advanced'] }, [
      ['Encapsulation', ['!Model entities with classes that protect their invariants']],
      ['Inheritance and polymorphism', ['!Use polymorphism to remove conditionals', 'Apply the Liskov substitution principle']],
      ['Composition and interfaces', ['!Prefer composition and program to interfaces']],
    ]),
  S('java-fundamentals', 'Java Fundamentals', 'The Java language and its object model for Java developer roles.',
    { level: 'intermediate', depth: 3, hours: 30, prereq: ['programming-foundations'], refs: [], kind: 'variant' }, [
      ['Language basics', ['!Use types, control flow, strings and arrays in Java', 'Explain primitives versus references and equals versus ==']],
      ['Classes and interfaces', ['!Write classes, interfaces and generics in Java']],
      ['Collections and streams', ['!Choose List, Set and Map implementations', 'Use streams and lambdas']],
      ['Exceptions and tooling', ['Handle checked and unchecked exceptions', 'Build projects with Maven or Gradle']],
    ]),
  S('complexity-analysis', 'Algorithm Analysis and Complexity', 'Reasoning about time and space cost.',
    { level: 'intermediate', depth: 3, hours: 12, prereq: ['programming-foundations'], refs: ['tt-dsa-interviews'] }, [
      ['Big-O', ['!Derive time complexity of loops and recursion']],
      ['Space and amortised cost', ['!Analyse space complexity and amortised operations']],
      ['Trade-offs', ['Choose algorithms under real input sizes and memory limits']],
    ]),
  S('arrays-strings-hashing', 'Arrays, Strings and Hashing', 'Core array, string and hash-map techniques.',
    { level: 'intermediate', depth: 3, hours: 15, prereq: ['complexity-analysis'], refs: ['tt-dsa-interviews'] }, [
      ['Arrays', ['!Use two pointers and sliding windows']],
      ['Strings', ['!Manipulate strings efficiently and handle immutability']],
      ['Hashing', ['!Use hash maps and sets for counting, grouping and lookup']],
    ]),
  S('linear-structures', 'Linked Lists, Stacks and Queues', 'Linear data structures and their classic uses.',
    { level: 'intermediate', depth: 3, hours: 12, prereq: ['complexity-analysis'], refs: ['tt-dsa-interviews'] }, [
      ['Linked lists', ['!Manipulate linked lists with pointers (reverse, detect cycles, find middle)']],
      ['Stacks', ['!Use stacks for parsing, undo and depth-first processing']],
      ['Queues', ['!Use queues, deques and priority queues for scheduling and BFS']],
    ]),
  S('recursion-backtracking', 'Recursion and Backtracking', 'Solving problems by self-reference and systematic search.',
    { level: 'intermediate', depth: 3, hours: 12, prereq: ['complexity-analysis'], refs: ['tt-dsa-interviews'] }, [
      ['Recursion', ['!Write recursive functions with correct base cases and trace them']],
      ['Backtracking', ['!Generate combinations and permutations with pruning']],
      ['Recursion trade-offs', ['Convert recursion to iteration and avoid stack overflow']],
    ]),
  S('searching-sorting', 'Searching and Sorting', 'Searching and sorting algorithms and when to use them.',
    { level: 'intermediate', depth: 3, hours: 12, prereq: ['complexity-analysis'], refs: ['tt-dsa-interviews'] }, [
      ['Searching', ['!Apply binary search, including on answer spaces']],
      ['Sorting', ['!Compare merge sort, quicksort and heap sort by time, space and stability']],
      ['Practical sorting', ['Use built-in sorts with custom keys correctly']],
    ]),
  S('trees-bst', 'Trees and Binary Search Trees', 'Hierarchical data and ordered search.',
    { level: 'intermediate', depth: 3, hours: 12, prereq: ['recursion-backtracking'], refs: ['tt-dsa-interviews'] }, [
      ['Tree traversal', ['!Traverse trees in pre-, in-, post- and level order']],
      ['Binary search trees', ['!Search, insert and validate BSTs and explain balancing']],
      ['Heaps and tries', ['Use heaps and tries for priority and prefix problems']],
    ]),
  S('graphs', 'Graphs and Traversal Algorithms', 'Modelling relationships and traversing graphs.',
    { level: 'advanced', depth: 3, hours: 15, prereq: ['linear-structures', 'recursion-backtracking'], refs: ['tt-dsa-interviews'] }, [
      ['Graph representation', ['!Model problems as graphs with adjacency lists']],
      ['Traversal', ['!Use BFS and DFS, including shortest paths in unweighted graphs']],
      ['Weighted and ordered graphs', ['!Apply Dijkstra and topological sort']],
    ]),
  S('greedy-dp', 'Greedy Algorithms and Dynamic Programming', 'Optimisation by greedy choice and reuse of subproblems.',
    { level: 'advanced', depth: 4, hours: 20, prereq: ['recursion-backtracking'], refs: ['tt-dsa-interviews'] }, [
      ['Greedy', ['!Decide when a greedy choice is provably correct']],
      ['Dynamic programming', ['!Identify overlapping subproblems and write memoised or tabulated solutions']],
      ['Classic DP problems', ['Solve knapsack, sequence and grid DP problems']],
    ]),
  S('debugging-testing', 'Debugging and Software Testing', 'Finding bugs systematically and proving code works.',
    { level: 'intermediate', depth: 2, hours: 12, prereq: ['programming-foundations'], refs: ['cs104-python'] }, [
      ['Debugging', ['!Reproduce, isolate and fix bugs using stack traces, logging and debuggers', 'Use git bisect to find regressions']],
      ['Unit testing', ['!Write unit tests with meaningful assertions and edge cases']],
      ['Testable code', ['Design code that is easy to test']],
    ]),
  S('software-design', 'Software Design Principles and Maintainability', 'Designing code that is easy to change.',
    { level: 'advanced', depth: 3, hours: 15, prereq: ['oop-principles'], refs: ['python-advanced'] }, [
      ['Design principles', ['!Apply single responsibility, DRY, KISS and YAGNI judiciously']],
      ['Coupling and dependencies', ['!Reduce coupling with dependency injection and interfaces']],
      ['Refactoring', ['Refactor safely in small steps with tests']],
    ]),
  S('engineering-problem-solving', 'Technical Problem Solving and Engineering Decisions', 'Making sound engineering decisions under real constraints.',
    { level: 'advanced', depth: 3, hours: 12, prereq: ['complexity-analysis'], refs: [] }, [
      ['Problem solving', ['!Clarify requirements and constraints before designing a solution']],
      ['Trade-offs', ['!Compare solutions by correctness, performance, cost and maintainability']],
      ['Communicating decisions', ['Explain and document decisions for a team']],
    ]),
];
