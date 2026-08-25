'use strict';

/**
 * EchoLens Curriculum seed data - Programme 4: JavaScript and Interactive
 * Web Architecture. Transcribed verbatim from
 * EchoLens_Course_and_Module_Handbook.pdf (pages 39-50). See
 * programme-1-c.js for the video-URL note.
 */
module.exports = {
  code: 'P4',
  name: 'JavaScript and Interactive Web Architecture',
  courses: [
    {
      code: 'JS4.1',
      title: 'JavaScript Programming Foundations: Master the Language Behind Every Website',
      level: 'Beginner',
      order_no: 1,
      capstone_artifact: 'PulseBoard Real Time Interactive Dashboard',
      modules: [
        {
          order_no: 1,
          title: 'The Engine, Execution Contexts and Types',
          learning_outcome: 'Explain how the engine executes a script and predict coercion behaviour.',
          sections: {
            videos: [
              { channel: 'Fireship', title: 'JavaScript in 100 Seconds', length: '2 min' },
              { channel: 'Web Dev Simplified', title: 'Learn JavaScript Type Coercion In 10 Minutes', length: '10 min' },
              { channel: 'Fireship', title: 'JavaScript Pro Tips, Code This Not That', length: '12 min' },
            ],
            reading: "JavaScript runs inside an engine that maintains a call stack and a heap. Function declarations are hoisted completely, variables declared with the older keyword are hoisted without their value, and block scoped declarations exist but cannot be touched before their line, which is why the error message mentions a temporal zone. Type coercion is the other half of this module. The loose equality operator applies a conversion table that nobody memorises, which is why professional code uses strict equality everywhere and converts deliberately.",
            rules: [
              'Primitives are copied on assignment. Objects and arrays are shared by reference.',
              'Use strict equality always. Loose equality converts operands using rules that surprise even experienced developers.',
              'Falsy values are exactly: false, zero, empty string, null, undefined and not a number. Everything else is truthy.',
              'Prefer block scoped declarations. Reserve the constant form for anything not reassigned, which is most things.',
            ],
            example: {
              caption: 'Coercion made explicit rather than accidental',
              language: 'javascript',
              code: `console.log(0 == "");   // true, coerced
console.log(0 === "");  // false, no coercion

function toNumber(value) {
  const n = Number(value);
  if (Number.isNaN(n)) throw new TypeError(\`not numeric: \${value}\`);
  return n;
}`,
            },
          },
          assignments: [
            { title: 'Assignment 1.1: Coercion table', brief: 'Predict the result of twelve comparison expressions, then verify and explain every mismatch.', pass_criteria: 'At least eight correct with written reasons.' },
            { title: 'Assignment 1.2: Deep equality', brief: 'Write a function that compares nested objects and arrays by value.', pass_criteria: 'All hidden tests pass including nested arrays and null handling.' },
          ],
          project: { title: 'Type diagnostic tool', brief: 'Build a tool that takes any value and reports its type, its truthiness, its coerced forms and whether it is safely comparable, with a printed table for a supplied set of values.' },
        },
        {
          order_no: 2,
          title: 'Modern Control Flow and Safe Access',
          learning_outcome: 'Write defensive access patterns for uncertain data without nested conditionals.',
          sections: {
            videos: [
              { channel: 'Web Dev Simplified', title: 'Learn Optional Chaining In 6 Minutes', length: '6 min' },
              { channel: 'Fireship', title: '8 JavaScript Features You Should Be Using', length: '10 min' },
            ],
            reading: "Most real data arrives incomplete. Optional chaining stops evaluation the moment it meets a null or undefined instead of throwing, and nullish coalescing supplies a default only when the value is actually absent rather than merely falsy. Together they replace the deeply nested guard conditionals that dominate older code. The distinction between the nullish operator and the older logical alternative matters: a value of zero or an empty string is legitimate data, and the older operator would silently replace it.",
            rules: [
              'Optional chaining returns undefined instead of throwing when an intermediate value is absent.',
              'Nullish coalescing supplies a default only for null or undefined. The logical alternative also replaces zero and empty string.',
              'Destructure with defaults to state the expected shape at the point of use.',
              'Guard clauses at the top of a function are more readable than one deeply nested conditional.',
            ],
            example: {
              caption: 'Uncertain data handled without nesting',
              language: 'javascript',
              code: `function summarise(record = {}) {
  const city = record.address?.city ?? "unknown";
  const score = record.metrics?.score ?? 0;     // zero survives, unlike with ||
  const { tags = [] } = record;
  return \`\${city} | \${score} | \${tags.length} tags\`;
}`,
            },
          },
          assignments: [
            { title: 'Assignment 2.1: Flatten the nesting', brief: 'Rewrite four deeply nested guard blocks using modern operators.', pass_criteria: 'Identical behaviour with no nesting beyond one level.' },
            { title: 'Assignment 2.2: Batch validator', brief: 'Validate a list of partial records and report which fields are missing per record.', pass_criteria: 'No exception thrown on any malformed input.' },
          ],
          project: { title: 'Record validation pipeline', brief: 'Build a validator that accepts an array of incomplete records and produces a clean set plus a rejection report naming the exact missing or invalid field for each failure.' },
        },
        {
          order_no: 3,
          title: 'Closures, Currying and Private State',
          learning_outcome: 'Use closures to hold state privately and build reusable function factories.',
          sections: {
            videos: [
              { channel: 'Web Dev Simplified', title: 'Learn Closures In 7 Minutes', length: '7 min' },
              { channel: 'Fireship', title: 'Closures in JavaScript explained', length: '8 min' },
              { channel: 'Web Dev Simplified', title: 'Learn Debounce And Throttle In 16 Minutes', length: '14 min' },
            ],
            reading: "A closure is a function that keeps access to the variables of the scope where it was defined, even after that scope has returned. This is the mechanism behind private state in JavaScript, and it is what makes function factories possible: a function that returns a configured function. Debouncing and throttling are the two closures every front end developer eventually writes, one delaying work until input stops and the other limiting how often work runs, and confusing them causes real interface defects.",
            rules: [
              'A closure captures variables, not values. The captured variable keeps changing if the outer scope changes it.',
              'Debounce waits for a quiet period then runs once. Throttle runs at most once per interval.',
              'A factory function returning a configured function replaces repeated parameter passing.',
              'Closures are the standard way to hold private state without a class.',
            ],
            example: {
              caption: 'Debounce and throttle, side by side',
              language: 'javascript',
              code: `function debounce(fn, ms) {
  let timer;
  return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), ms); };
}

function throttle(fn, ms) {
  let last = 0;
  return (...args) => {
    const now = Date.now();
    if (now - last >= ms) { last = now; fn(...args); }
  };
}`,
            },
          },
          assignments: [
            { title: 'Assignment 3.1: Counter factory', brief: 'Build a counter factory where each counter is independent and cannot be tampered with from outside.', pass_criteria: 'All isolation tests pass.' },
            { title: 'Assignment 3.2: Choose the right limiter', brief: 'For six described interface scenarios choose debounce or throttle and justify.', pass_criteria: 'At least five correct with reasons.' },
          ],
          project: { title: 'Rate limiting utility library', brief: 'Build a library exporting debounce, throttle, a call counter and a memoise helper, each with a cancel method and a test harness demonstrating the timing behaviour.' },
        },
        {
          order_no: 4,
          title: 'Immutable Pipelines and Array Transformation',
          learning_outcome: 'Transform collections declaratively without mutating shared state.',
          sections: {
            videos: [
              { channel: 'Web Dev Simplified', title: 'Learn Map Filter Reduce In 10 Minutes', length: '10 min' },
              { channel: 'Fireship', title: 'Functional Programming in 100 Seconds', length: '3 min' },
            ],
            reading: "Mutating an array that another part of the program also holds is the source of an entire family of defects that are painful to reproduce. Transformation methods return new arrays, which makes data flow traceable: given the same input the same output follows. The reduce method is the general case that the others are special cases of, and once it is understood, chained pipelines replace most loops. The one caution is that sorting mutates in place, so it needs a copy first.",
            rules: [
              'Map, filter and flatMap return new arrays. Sort, splice and reverse mutate in place.',
              'Copy before sorting. Spreading the array into a new one is the shortest way.',
              'Reduce is the general fold. Map and filter can both be expressed with it.',
              'Chain no more than four stages before naming an intermediate result. Readability outranks brevity.',
            ],
            example: {
              caption: 'A chained analytics pipeline over nested records',
              language: 'javascript',
              code: `const revenue = orders
  .filter(o => o.status === "paid")
  .flatMap(o => o.items)
  .reduce((acc, item) => acc + item.price * item.qty, 0);

const topCities = [...orders]
  .sort((a, b) => b.total - a.total)
  .slice(0, 5)
  .map(o => o.city);`,
            },
          },
          assignments: [
            { title: 'Assignment 4.1: Mutation hunt', brief: 'Find and fix the three accidental mutations in a supplied module.', pass_criteria: 'All three found, original data provably unchanged.' },
            { title: 'Assignment 4.2: Reduce drill', brief: 'Express group by, count by and maximum by using reduce alone.', pass_criteria: 'All hidden tests pass with no loops.' },
          ],
          project: { title: 'Sales analytics pipeline', brief: 'Build a pipeline that turns a raw order feed into a dashboard payload with revenue by category, monthly trend and the top five customers, written entirely with immutable transformations. This project feeds the course final project.' },
        },
      ],
    },
    {
      code: 'JS4.2',
      title: 'The Browser Runtime: Event Loop, DOM Performance and Reactive Interfaces',
      level: 'Intermediate',
      order_no: 2,
      capstone_artifact: 'PulseBoard Real Time Interactive Dashboard',
      modules: [
        {
          order_no: 1,
          title: 'The Event Loop, Tasks and Microtasks',
          learning_outcome: 'Predict the execution order of synchronous code, timers and promises.',
          sections: {
            videos: [
              { channel: 'Fireship', title: 'The Async Await Episode I Promised', length: '12 min' },
              { channel: 'Web Dev Simplified', title: 'JavaScript Event Loop explained', length: '10 min' },
            ],
            reading: "JavaScript runs on a single thread, and everything that appears concurrent is actually queued. The engine finishes the current synchronous work, then drains the entire microtask queue, then takes one task from the macrotask queue and repeats. This ordering explains why a resolved promise callback always runs before a zero millisecond timer, and why a long synchronous loop freezes the interface completely. Once the model is clear, most asynchronous confusion disappears.",
            rules: [
              'Order: current synchronous code, then all microtasks, then one macrotask, then repeat.',
              'Promise callbacks are microtasks. Timer callbacks and interface events are macrotasks.',
              'A timer set to zero milliseconds is a request, not a promise. It runs after the current work and all microtasks.',
              'Long synchronous work blocks rendering. Break it into chunks that yield between them.',
            ],
            example: {
              caption: 'Execution order made explicit',
              language: 'javascript',
              code: `console.log("1 sync");
setTimeout(() => console.log("4 macrotask"), 0);
Promise.resolve().then(() => console.log("3 microtask"));
console.log("2 sync");
// prints 1, 2, 3, 4`,
            },
          },
          assignments: [
            { title: 'Assignment 1.1: Order prediction', brief: 'Predict the output order of six mixed scripts before running.', pass_criteria: 'At least four correct with written reasoning.' },
            { title: 'Assignment 1.2: Unblock the interface', brief: 'A supplied page freezes during a long computation. Chunk the work so the interface stays responsive.', pass_criteria: 'Same result, measured frame drops eliminated.' },
          ],
          project: { title: 'Priority task scheduler', brief: 'Build a scheduler that accepts tasks with priorities, runs them without blocking the interface, supports cancellation and reports queue depth in real time.' },
        },
        {
          order_no: 2,
          title: 'Document Internals and Render Cost',
          learning_outcome: 'Update the page efficiently and avoid layout thrashing.',
          sections: {
            videos: [
              { channel: 'Web Dev Simplified', title: 'Learn DOM Manipulation In 18 Minutes', length: '15 min' },
              { channel: 'Fireship', title: 'The DOM in 100 Seconds', length: '3 min' },
              { channel: 'Web Dev Simplified', title: 'Document Fragments explained', length: '8 min' },
            ],
            reading: "Reading a layout property forces the browser to finish any pending layout work before it can answer, so alternating reads and writes inside a loop makes the browser recompute layout on every iteration. That pattern, called layout thrashing, is the most common cause of a page that feels slow despite fast code. The fix is to batch: read everything, then write everything, and build detached subtrees in a fragment before attaching them once.",
            rules: [
              'Reading a geometry property forces layout. Alternating reads and writes in a loop forces it repeatedly.',
              'Batch all reads, then all writes. Never interleave them inside a loop.',
              'Build many nodes in a document fragment and attach once. One insertion instead of a thousand.',
              'Changes to transform and opacity can be composited without a full layout pass. Prefer them for animation.',
            ],
            example: {
              caption: 'Batched construction with a single insertion',
              language: 'javascript',
              code: `function renderRows(container, rows) {
  const frag = document.createDocumentFragment();
  for (const row of rows) {
    const el = document.createElement("tr");
    el.innerHTML = \`<td>\${row.name}</td><td>\${row.total}</td>\`;
    frag.appendChild(el);
  }
  container.replaceChildren(frag); // one layout pass
}`,
            },
          },
          assignments: [
            { title: 'Assignment 2.1: Thrashing repair', brief: 'A supplied loop reads and writes geometry alternately. Repair it and measure the difference.', pass_criteria: 'Correct output and a recorded improvement.' },
            { title: 'Assignment 2.2: Fragment rendering', brief: 'Render two thousand rows in under one hundred milliseconds.', pass_criteria: 'Measured render time within budget on the test machine.' },
          ],
          project: { title: 'High performance data grid', brief: 'Build a grid that renders and re sorts several thousand rows while keeping interaction responsive, with a visible performance readout.' },
        },
        {
          order_no: 3,
          title: 'Events, Propagation and Form Control',
          learning_outcome: 'Control event flow precisely and manage form state without surprises.',
          sections: {
            videos: [
              { channel: 'Web Dev Simplified', title: 'Learn JavaScript Event Bubbling And Capturing', length: '10 min' },
              { channel: 'Web Dev Simplified', title: 'Learn HTML Forms In 15 Minutes', length: '15 min' },
            ],
            reading: "An event travels down from the document to the target, then back up. Handlers attached in the default mode fire on the way up, which is why a click on a child also triggers a parent handler. The distinction between the element that was clicked and the element the handler is attached to is the single most useful thing to internalise here, because it is what makes delegation possible. Forms add their own default behaviours that must be prevented deliberately rather than worked around.",
            rules: [
              'Phases: capture downward, target, then bubble upward. Handlers bubble by default.',
              'The target property is what was interacted with. The current target is what the handler is attached to.',
              'Preventing the default action stops the browser behaviour. Stopping propagation stops other handlers. They are different.',
              'Validate on submit, not on every keystroke. Constant validation while typing is hostile to the user.',
            ],
            example: {
              caption: 'Target against current target in one handler',
              language: 'javascript',
              code: `form.addEventListener("submit", (e) => {
  e.preventDefault();                       // stop the page reload
  const data = Object.fromEntries(new FormData(form));
  if (!data.email) return show("Email is required");
  submit(data);
});

list.addEventListener("click", (e) => {
  console.log(e.target.tagName, e.currentTarget.id); // clicked vs attached
});`,
            },
          },
          assignments: [
            { title: 'Assignment 3.1: Propagation puzzles', brief: 'Predict which handlers fire and in what order for five nested structures.', pass_criteria: 'At least four correct with reasons.' },
            { title: 'Assignment 3.2: Dynamic form', brief: 'Build a form where rows can be added and removed and validation still applies to every row.', pass_criteria: 'All hidden interaction tests pass.' },
          ],
          project: { title: 'Dynamic form controller', brief: 'Build a controller for a form with repeatable sections, per field validation on submit, accessible error messaging and a clean serialised payload.' },
        },
        {
          order_no: 4,
          title: 'Event Delegation and Reactive Rendering',
          learning_outcome: 'Manage an interface with one listener and a single source of truth.',
          sections: {
            videos: [
              { channel: 'Web Dev Simplified', title: 'Learn Event Delegation In 8 Minutes', length: '8 min' },
              { channel: 'Fireship', title: 'Build a to do app with vanilla JavaScript', length: '12 min' },
            ],
            reading: "Attaching a listener to every element does not scale: elements added later have no listener, removed elements leak theirs, and the count grows without bound. Delegation attaches one listener to a stable container and identifies the action from the event target and a data attribute. Paired with a single state object that is the only source of truth, and a render function that draws the interface from that state, this produces a small reactive architecture with no framework at all.",
            rules: [
              'One listener on a stable ancestor. Identify the action from a data attribute on the target.',
              'Elements added after page load work automatically under delegation. Directly attached listeners do not.',
              'Keep one state object as the single source of truth. The interface is a function of that state.',
              'Never read application state back out of the document. The document is output, not storage.',
            ],
            example: {
              caption: 'One listener, one state object, one render',
              language: 'javascript',
              code: `const state = { items: [] };

list.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-action]");
  if (!btn) return;
  const id = Number(btn.dataset.id);
  if (btn.dataset.action === "delete") state.items = state.items.filter(i => i.id !== id);
  if (btn.dataset.action === "done")   state.items = state.items.map(i =>
    i.id === id ? { ...i, done: !i.done } : i);
  render(state);
});`,
            },
          },
          assignments: [
            { title: 'Assignment 4.1: Listener reduction', brief: 'Convert a page with forty listeners to a single delegated one.', pass_criteria: 'Identical behaviour, one listener, works for dynamically added elements.' },
            { title: 'Assignment 4.2: State as truth', brief: 'Refactor a component that reads values back from the document so that state is the only source.', pass_criteria: 'All hidden state tests pass.' },
          ],
          project: { title: 'Reactive task board', brief: 'Build a create, read, update and delete board driven by one state object and one delegated listener, with filtering, counts and no framework. This project feeds the course final project.' },
        },
      ],
    },
    {
      code: 'JS4.3',
      title: 'Advanced JavaScript Applications: Async Architecture, Storage and Web Security',
      level: 'Advanced',
      order_no: 3,
      capstone_artifact: 'PulseBoard Real Time Interactive Dashboard',
      modules: [
        {
          order_no: 1,
          title: 'Promises, Concurrency and Failure Policy',
          learning_outcome: 'Coordinate concurrent network work with retries, timeouts and cancellation.',
          sections: {
            videos: [
              { channel: 'Fireship', title: 'The Async Await Episode I Promised', length: '12 min' },
              { channel: 'Web Dev Simplified', title: 'Learn Fetch API In 6 Minutes', length: '6 min' },
              { channel: 'Web Dev Simplified', title: 'Promise.all, allSettled, race and any', length: '10 min' },
            ],
            reading: "Awaiting requests one after another when they do not depend on each other turns a fast page into a slow one. The combinators exist for exactly this: run them together and decide what partial failure means. All rejects as soon as one fails, which is right when every result is required, and all settled reports every outcome, which is right when a dashboard should render whatever succeeded. Every request also needs a timeout and a retry policy, because a call that never returns is worse than one that fails.",
            rules: [
              'Awaiting sequentially adds the durations. Running together takes the longest single duration.',
              'All rejects on first failure. All settled always resolves with the outcome of each.',
              'Exponential backoff waits base multiplied by two to the power of the attempt number, with a cap and random jitter.',
              'Attach an abort signal to every request so slow work can be cancelled when the user navigates away.',
            ],
            example: {
              caption: 'Concurrent fetch with timeout and capped backoff',
              language: 'javascript',
              code: `async function fetchWithRetry(url, attempts = 3) {
  for (let i = 0; i < attempts; i++) {
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), 5000);
    try {
      const res = await fetch(url, { signal: ac.signal });
      if (res.ok) return res.json();
    } catch { /* fall through to retry */ }
    finally { clearTimeout(timer); }
    await new Promise(r => setTimeout(r, Math.min(2 ** i * 250, 4000)));
  }
  throw new Error(\`failed after \${attempts} attempts: \${url}\`);
}`,
            },
          },
          assignments: [
            { title: 'Assignment 1.1: Sequential to concurrent', brief: 'Convert five sequential awaits into concurrent execution and measure the improvement.', pass_criteria: 'Same results and a recorded reduction in total time.' },
            { title: 'Assignment 1.2: Failure policy', brief: 'For four described dashboards choose between all and all settled and justify.', pass_criteria: 'At least three correct with reasons.' },
          ],
          project: { title: 'Resilient API client', brief: 'Build a client with concurrency limits, per request timeout, capped exponential backoff, cancellation and a request log showing every retry and its reason.' },
        },
        {
          order_no: 2,
          title: 'Browser Storage and Cache Strategy',
          learning_outcome: 'Choose a storage mechanism deliberately and design cache expiry.',
          sections: {
            videos: [
              { channel: 'Web Dev Simplified', title: 'Learn localStorage In 5 Minutes', length: '5 min' },
              { channel: 'Fireship', title: 'IndexedDB in 100 Seconds', length: '3 min' },
            ],
            reading: "The browser offers several storage mechanisms and they are not interchangeable. Simple key value storage is synchronous, string only and small, which makes it right for preferences and wrong for data sets. Session scoped storage clears with the tab. The indexed database is asynchronous, structured and large, and is the correct answer for anything resembling application data. The harder problem is not storage but invalidation: cached data without an expiry rule becomes wrong data that the user trusts.",
            rules: [
              'Simple key value storage is synchronous and blocks the thread. Keep it small and infrequent.',
              'Session storage clears when the tab closes. Local storage persists until cleared.',
              'Store a timestamp with every cache entry. On read, discard anything older than its allowed age.',
              'Storage can fail when the quota is exceeded. Wrap writes and degrade gracefully.',
            ],
            example: {
              caption: 'A cache entry that knows its own expiry',
              language: 'javascript',
              code: `const cache = {
  set(key, value, ttlMs) {
    try {
      localStorage.setItem(key, JSON.stringify({ value, expires: Date.now() + ttlMs }));
    } catch { /* quota exceeded: operate without cache */ }
  },
  get(key) {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const { value, expires } = JSON.parse(raw);
    if (Date.now() > expires) { localStorage.removeItem(key); return null; }
    return value;
  }
};`,
            },
          },
          assignments: [
            { title: 'Assignment 2.1: Mechanism choice', brief: 'For eight scenarios choose the storage mechanism and justify.', pass_criteria: 'At least six correct with reasons.' },
            { title: 'Assignment 2.2: Quota handling', brief: 'Make a supplied application survive a full storage quota without breaking.', pass_criteria: 'Application still functional with caching disabled.' },
          ],
          project: { title: 'Tiered cache manager', brief: 'Build a cache manager with memory and persistent tiers, per key expiry, a size cap with least recently used eviction and a hit rate report.' },
        },
        {
          order_no: 3,
          title: 'Web Security and Module Architecture',
          learning_outcome: 'Defend against injection and structure an application into modules.',
          sections: {
            videos: [
              { channel: 'Fireship', title: 'Web Security in 100 Seconds', length: '3 min' },
              { channel: 'Web Dev Simplified', title: 'Learn ES6 Modules In 10 Minutes', length: '10 min' },
              { channel: 'Fireship', title: 'CORS in 100 Seconds', length: '3 min' },
            ],
            reading: "Cross site scripting happens when data supplied by a user is treated as markup. The defence is not a filter list, it is a boundary: user data is inserted as text, never as markup, and if markup genuinely must be rendered it passes through a sanitiser with an allow list. The cross origin policy is the browser refusing to let one origin read another's responses without permission, and understanding that it is enforced by the browser rather than the server resolves most confusion about it.",
            rules: [
              'Insert user data as text content, never as markup. That single rule prevents most injection.',
              'Sanitise with an allow list of permitted elements and attributes. Deny lists are always incomplete.',
              'Cross origin restrictions are enforced by the browser. The response headers grant the permission.',
              'One module, one responsibility, one export surface. Circular imports are a design smell.',
            ],
            example: {
              caption: 'Text insertion against markup insertion',
              language: 'javascript',
              code: `// unsafe: user content becomes markup
el.innerHTML = \`<p>\${comment}</p>\`;

// safe: user content stays text
const p = document.createElement("p");
p.textContent = comment;
el.replaceChildren(p);`,
            },
          },
          assignments: [
            { title: 'Assignment 3.1: Injection audit', brief: 'Find and fix five injection points in a supplied application.', pass_criteria: 'All five closed, supplied attack payloads render as harmless text.' },
            { title: 'Assignment 3.2: Module split', brief: 'Split a single file application into modules with no circular imports.', pass_criteria: 'Builds and runs, dependency graph acyclic.' },
          ],
          project: { title: 'Comment system with a sanitiser', brief: 'Build a comment feature that accepts limited formatting through an allow list sanitiser, rejects everything else and passes a supplied set of attack payloads.' },
        },
        {
          order_no: 4,
          title: 'Application Architecture and the Course Capstone',
          learning_outcome: 'Assemble state, data access, rendering and accessibility into one production application.',
          sections: {
            videos: [
              { channel: 'Fireship', title: '10 modern JavaScript one liners', length: '9 min' },
              { channel: 'Web Dev Simplified', title: 'Learn Web Accessibility In 10 Minutes', length: '10 min' },
            ],
            reading: "A framework free application still needs an architecture, and the one that holds up is a strict separation: a state module that owns data, a data access module that owns network and storage, a render module that turns state into markup, and a controller that binds events to state changes. Every one of those can be tested alone. Accessibility belongs in this module rather than at the end, because keyboard access and focus management are architectural decisions, not a stylesheet pass.",
            rules: [
              'Four layers: state, data access, render, controller. Each depends only on the one below it.',
              'Render is a pure function of state. Given the same state it produces the same interface.',
              'Every interactive element must be reachable and operable by keyboard alone.',
              'Set a performance budget before building. Measure against it, not against how it feels.',
            ],
            example: {
              caption: 'A render function that is pure with respect to state',
              language: 'javascript',
              code: `function render(state) {
  root.replaceChildren(
    header(state.filter, state.items.length),
    listView(state.items.filter(matches(state.filter))),
    footer(state.items.filter(i => !i.done).length)
  );
}

function dispatch(action) {   // single entry point for every change
  state = reduce(state, action);
  render(state);
}`,
            },
          },
          assignments: [
            { title: 'Assignment 4.1: Layer separation', brief: 'Refactor a supplied tangled application into the four layers.', pass_criteria: 'No layer reaches past its neighbour, all tests pass.' },
            { title: 'Assignment 4.2: Keyboard pass', brief: 'Make a supplied interface fully keyboard operable with visible focus.', pass_criteria: 'Every action reachable without a pointer.' },
          ],
          project: { title: 'Course capstone: PulseBoard real time interactive dashboard', brief: 'Build a single page dashboard with reactive state and no framework, concurrent data fetching with backoff, tiered caching with expiry, injection defences and interaction held under one hundred milliseconds with one thousand records. Defended live.' },
        },
      ],
    },
  ],
};
