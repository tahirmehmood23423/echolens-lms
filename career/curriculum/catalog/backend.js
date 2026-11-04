'use strict';
/** Programming foundations, Python and backend engineering subtracks (shared by Backend, Full-Stack, AI, Data, GenAI and SE tracks). */
const { S } = require('../dsl');

module.exports = [
  S('programming-foundations', 'Programming and Computer Science Foundations', 'How programs run, how to think computationally, and the core building blocks every language shares.',
    { level: 'foundation', depth: 1, hours: 20, refs: ['cs104-python', 'fc01-c-basics'] }, [
      ['How computers run programs', ['!Explain how source code becomes running instructions (interpreted vs compiled)', 'Describe memory, storage and the CPU in terms of what a program uses', 'Represent numbers and text in binary and identify overflow and precision limits']],
      ['Variables, types and expressions', ['!Predict the value of expressions involving operators, precedence and type conversion', 'Choose an appropriate data type for a value', 'Trace how assignment changes program state step by step']],
      ['Control flow', ['!Predict the output of programs using conditions and loops', 'Identify off-by-one and infinite-loop errors', 'Choose between for, while and early exit for a task']],
      ['Functions and problem decomposition', ['!Trace function calls, parameters and return values', 'Break a business problem into smaller functions', 'Write step-by-step algorithms (pseudocode) for everyday tasks']],
    ]),
  S('python-fundamentals', 'Python Fundamentals', 'Core Python for any career: values, collections, control flow, functions, errors and files.',
    { level: 'beginner', depth: 2, hours: 30, prereq: ['programming-foundations'], refs: ['cs104-python'] }, [
      ['Values, strings and expressions', ['!Predict results of arithmetic including integer division, modulo and float behaviour', 'Manipulate strings with indexing, slicing, methods and f-strings', 'Convert between types safely (int, float, str, bool)']],
      ['Collections', ['!Choose between list, tuple, set and dict for a requirement', 'Predict results of list and dict operations, including mutation and aliasing', 'Use comprehensions to filter and transform data']],
      ['Control flow and functions', ['!Trace loops, conditions, break and continue', 'Define functions with default, keyword and variable arguments', 'Explain variable scope and avoid mutable default arguments']],
      ['Errors, files and modules', ['!Handle exceptions with try/except/else/finally appropriately', 'Read and write text and CSV files safely with context managers', 'Organise code into modules and use the standard library']],
    ]),
  S('python-intermediate-oop', 'Intermediate Python and Object-Oriented Programming', 'Classes, data modelling, iteration protocols and idiomatic Python for maintainable code.',
    { level: 'intermediate', depth: 3, hours: 30, prereq: ['python-fundamentals'], refs: ['python-advanced'] }, [
      ['Classes and objects', ['!Model business entities with classes, attributes and methods', 'Predict behaviour of instance vs class attributes', 'Use dataclasses and special methods (__str__, __eq__) appropriately']],
      ['Inheritance, composition and interfaces', ['!Choose composition or inheritance for a design', 'Predict method resolution and super() calls', 'Apply polymorphism to replace long if/elif chains']],
      ['Iterators, generators and decorators', ['!Use generators to process large data lazily', 'Explain iterables, iterators and the iteration protocol', 'Use context managers and decorators for cross-cutting behaviour']],
      ['Robust Python', ['!Design custom exceptions and error-handling boundaries', 'Use type hints and simple validation to prevent bugs', 'Manage dependencies with virtual environments and pinned requirements']],
    ]),
  S('practical-data-structures', 'Data Structures and Backend Problem Solving', 'Choosing the right data structure and reasoning about cost in everyday backend code.',
    { level: 'intermediate', depth: 2, hours: 20, prereq: ['python-fundamentals'], refs: ['tt-dsa-interviews'] }, [
      ['Choosing data structures', ['!Choose list, dict, set, queue or heap for a backend requirement', 'Explain average lookup cost for lists versus hash maps']],
      ['Complexity in practice', ['!Estimate time complexity of loops and nested loops in request handlers', 'Identify accidental quadratic work such as membership checks in loops']],
      ['Common backend patterns', ['Use dictionaries for grouping, counting and indexing records', 'Use queues and priority queues for jobs and scheduling', 'Paginate and batch work over large collections']],
    ]),
  S('http-web-architecture', 'HTTP, Networking and Web Architecture', 'How requests travel, what HTTP really says, and how web systems are put together.',
    { level: 'beginner', depth: 2, hours: 20, prereq: ['programming-foundations'], refs: ['cs106-html-css', 'tt-go-backend'] }, [
      ['Networking for web developers', ['!Explain DNS resolution, IP, ports and TCP connections for a web request', 'Describe what TLS/HTTPS protects and what it does not']],
      ['HTTP in depth', ['!Choose correct methods and status codes for operations', 'Interpret request and response headers (content type, caching, cookies)', 'Explain idempotency and safety of HTTP methods']],
      ['Web architecture', ['!Describe client-server, stateless servers, proxies, load balancers and CDNs', 'Explain sessions, cookies and tokens at a conceptual level', 'Trace a request through a typical production stack']],
    ]),
  S('rest-api-design', 'REST API Design and Integration', 'Designing, versioning and consuming reliable HTTP APIs used by real clients.',
    { level: 'intermediate', depth: 3, hours: 25, prereq: ['http-web-architecture'], refs: ['tt-go-backend'] }, [
      ['Resource design', ['!Design resource URLs, methods and response shapes for a domain', 'Choose filtering, sorting and pagination strategies', 'Return consistent, useful error responses']],
      ['Validation and contracts', ['!Validate input and reject bad requests with the right status', 'Document APIs with OpenAPI and version them without breaking clients']],
      ['Reliability', ['!Make retries safe with idempotency keys', 'Use timeouts, rate limits and backoff when calling and serving APIs', 'Apply HTTP caching (ETag, Cache-Control) correctly']],
      ['Integrating third-party APIs', ['Handle partial failures and webhooks', 'Protect secrets and handle API keys safely']],
    ]),
  S('fastapi-backend', 'FastAPI and Python Backend Development', 'Building production-ready Python APIs with FastAPI.',
    { level: 'intermediate', depth: 3, hours: 25, prereq: ['python-intermediate-oop', 'rest-api-design'], refs: [] }, [
      ['FastAPI fundamentals', ['!Define routes, path and query parameters and request bodies', 'Use Pydantic models for validation and serialization']],
      ['Application structure', ['!Structure an app with routers, dependencies and settings', 'Separate handlers, services and data access']],
      ['Async and background work', ['!Explain when async helps and when it blocks the event loop', 'Use background tasks and queues for slow work']],
      ['Production concerns', ['Handle errors with exception handlers and consistent responses', 'Configure CORS, logging and health checks']],
    ]),
  S('node-express', 'Node.js, Express and Server APIs', 'Server-side JavaScript: the event loop, Express, middleware and APIs.',
    { level: 'intermediate', depth: 3, hours: 25, prereq: ['js-dom-async', 'rest-api-design'], refs: ['js-advanced'] }, [
      ['Node.js runtime', ['!Explain the event loop and why CPU-heavy work blocks a Node server', 'Use modules, npm packages and environment configuration']],
      ['Express applications', ['!Build routes and middleware chains, and order them correctly', 'Parse and validate request bodies and parameters']],
      ['Async error handling', ['!Handle promise rejections and errors in async handlers', 'Use centralized error middleware']],
      ['Data access from Node', ['Connect to SQL or MongoDB databases with pooling', 'Prevent injection with parameterised queries or ODM validation']],
    ]),
  S('sql-fundamentals', 'SQL Fundamentals', 'Querying relational data correctly: filtering, joining, aggregating and handling NULLs.',
    { level: 'beginner', depth: 2, hours: 25, prereq: [], refs: ['tt-postgresql-internals'] }, [
      ['Relational basics and SELECT', ['!Write SELECT queries with filtering, sorting and limits', 'Explain tables, rows, columns, primary and foreign keys', 'Handle NULL correctly in comparisons and aggregates']],
      ['Joins', ['!Choose INNER, LEFT and other joins to answer a question', 'Detect row multiplication (fan-out) caused by joins']],
      ['Aggregation', ['!Use GROUP BY, HAVING and aggregate functions correctly', 'Count distinct entities and avoid double counting']],
      ['Changing data', ['Write INSERT, UPDATE and DELETE safely with WHERE clauses', 'Use subqueries and CASE expressions']],
    ]),
  S('database-design', 'Database Design and PostgreSQL', 'Designing schemas that keep data correct: keys, relationships, constraints and normalisation.',
    { level: 'intermediate', depth: 3, hours: 20, prereq: ['sql-fundamentals'], refs: ['tt-postgresql-internals'] }, [
      ['Modelling relationships', ['!Model one-to-many and many-to-many relationships with keys', 'Choose natural or surrogate keys']],
      ['Constraints and integrity', ['!Enforce rules with NOT NULL, UNIQUE, CHECK and foreign keys', 'Choose correct PostgreSQL data types (numeric, timestamp with time zone, text, JSONB)']],
      ['Normalisation', ['!Identify update anomalies and normalise to remove them', 'Decide when controlled denormalisation is justified']],
    ]),
  S('db-integration-performance', 'Database Integration, Transactions and Performance', 'Using databases from application code: transactions, concurrency, indexes and query performance.',
    { level: 'advanced', depth: 3, hours: 25, prereq: ['database-design'], refs: ['tt-postgresql-internals'] }, [
      ['Transactions and concurrency', ['!Use transactions to keep multi-step changes atomic', 'Prevent race conditions with locks or constraints', 'Explain isolation levels and their anomalies']],
      ['Indexes and query plans', ['!Choose indexes for common query patterns', 'Read EXPLAIN output to find slow steps']],
      ['Application data access', ['!Detect and fix N+1 query patterns', 'Use connection pooling and pagination', 'Write safe schema migrations for live systems']],
    ]),
  S('api-security-auth', 'Authentication, Authorization and API Security', 'Protecting APIs and user data: identity, sessions, tokens, permissions and common attacks.',
    { level: 'intermediate', depth: 3, hours: 25, prereq: ['rest-api-design'], refs: [] }, [
      ['Authentication', ['!Store passwords with slow salted hashing', 'Compare session cookies and JWTs and their trade-offs', 'Design password reset and MFA flows safely']],
      ['Authorization', ['!Enforce object-level authorization on every request', 'Model roles and permissions (RBAC)']],
      ['Web and API attacks', ['!Prevent SQL injection, XSS and CSRF', 'Apply rate limiting and brute-force protection', 'Handle secrets and configuration securely']],
    ]),
  S('backend-testing-reliability', 'Backend Testing, Debugging and Reliability', 'Proving backend code works and keeping it working: tests, debugging and resilient behaviour.',
    { level: 'intermediate', depth: 3, hours: 20, prereq: ['python-fundamentals'], refs: [] }, [
      ['Testing strategy', ['!Write unit tests with clear assertions', 'Choose unit, integration and end-to-end tests appropriately', 'Use fixtures, mocks and test databases']],
      ['Debugging', ['!Diagnose failures from stack traces and logs', 'Reproduce intermittent bugs and isolate causes']],
      ['Reliability', ['!Handle failures with timeouts, retries and graceful degradation', 'Log structured events and expose health checks']],
    ]),
  S('backend-deployment-ops', 'Docker, Deployment and Backend Operations', 'Shipping a backend: containers, configuration, environments and day-two operations.',
    { level: 'intermediate', depth: 2, hours: 20, prereq: ['http-web-architecture'], refs: ['tt-cloud-devops'] }, [
      ['Containerising an app', ['!Write a Dockerfile for a backend service', 'Explain images, containers, ports and volumes']],
      ['Configuration and environments', ['!Keep secrets and settings in environment configuration', 'Promote builds through dev, staging and production']],
      ['Operating a service', ['Read logs and metrics to diagnose production issues', 'Roll back a bad release safely']],
    ]),
];
