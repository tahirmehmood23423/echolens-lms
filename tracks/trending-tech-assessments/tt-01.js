'use strict';
// TT-01 Modern Full Stack Development with Next.js and TypeScript.
// Quiz rows: [question, options, index of the correct option, explanation].
module.exports = {
  quizzes: {
    'A1.1': [
      ['What does JSX compile to?', ['HTML strings sent to the browser', 'Function calls that create element objects', 'A template that the browser parses at runtime', 'CSS-in-JS style objects'], 1, 'JSX is syntax sugar for createElement-style calls that return plain element objects.'],
      ['Why describe props with an exported TypeScript interface?', ['It makes the component render faster', 'It is required for JSX to compile', 'Callers get compile-time checking and editor hints for every prop', 'It lets React skip re-rendering'], 2, 'The interface is a contract the compiler enforces at every call site.'],
      ['Which annotation defeats type checking and should be avoided for props?', ['any', 'unknown', 'never', 'readonly'], 0, '`any` switches the checker off for that value; `unknown` forces you to narrow first.'],
      ['How do you mark a prop as optional in an interface?', ['prop: optional string', 'prop?: string', 'prop!: string', 'prop: string | void'], 1, 'A trailing `?` makes the property optional (its type becomes string | undefined).'],
      ['A component must be named with...', ['a lowercase first letter', 'a `use` prefix', 'a capital first letter so JSX treats it as a component', 'a `.component.tsx` file name'], 2, 'Lowercase JSX tags are treated as HTML elements; capitalised ones as components.'],
    ],
    'A1.2': [
      ['When is useReducer a better fit than several useState calls?', ['When state is a single boolean', 'When several related values change together through well-defined actions', 'When the component has no state', 'When you need to fetch data'], 1, 'A reducer centralises related transitions in one pure function.'],
      ['A reducer function must be...', ['async so it can await data', 'pure: (state, action) => new state, with no side effects', 'allowed to mutate state in place', 'called directly from JSX'], 1, 'Reducers are pure; side effects belong in event handlers or effects.'],
      ['What is the benefit of a typed action union like { type: "next" } | { type: "back" }?', ['Smaller bundles', 'The compiler narrows each case and flags unknown action types', 'Actions run in parallel', 'It removes the need for a switch'], 1, 'Discriminated unions let TypeScript narrow on the `type` field and catch typos.'],
      ['Why should you never mutate the existing state object inside a reducer?', ['Mutation is a syntax error', 'React compares references, so mutation can skip re-renders and cause stale UI', 'Objects cannot be mutated in TypeScript', 'It throws at runtime'], 1, 'Returning a new object gives React a new reference to detect the change.'],
      ['setCount(count + 1) called twice in one handler increments by 1. Which form increments by 2?', ['setCount(count + 2) twice', 'setCount(c => c + 1) twice', 'count++ twice', 'setCount(count) then setCount(count + 1)'], 1, 'The updater form receives the latest pending state each time.'],
    ],
    'A1.3': [
      ['What should an effect return to avoid leaks when the component unmounts?', ['A promise', 'A cleanup function', 'The new state', 'Nothing - React cleans up automatically'], 1, 'The returned cleanup runs before the next effect and on unmount.'],
      ['What does a debounce of 300 ms do to ten fast keystrokes?', ['Fires ten requests 300 ms apart', 'Fires one request 300 ms after the last keystroke', 'Fires the first request immediately and ignores the rest forever', 'Delays every request by 3 seconds'], 1, 'Each keystroke resets the timer, so only the final value is used.'],
      ['Inside a useDebounce hook, which call cancels the pending timer?', ['clearInterval', 'clearTimeout', 'cancelAnimationFrame', 'AbortController.abort'], 1, 'setTimeout returns an id that clearTimeout cancels in the cleanup.'],
      ['What makes a function a custom hook?', ['It returns JSX', 'Its name starts with `use` and it calls other hooks', 'It is declared with `async`', 'It lives in a hooks folder'], 1, 'The `use` prefix lets the rules-of-hooks lint check it.'],
      ['An effect with an empty dependency array [] runs...', ['on every render', 'once after the first render (and cleans up on unmount)', 'never', 'only when props change'], 1, 'No dependencies means nothing can trigger a re-run.'],
    ],
    'A1.4': [
      ['In the Next.js App Router, components are by default...', ['Client Components', 'Server Components', 'Static HTML only', 'Web Components'], 1, 'App Router components are Server Components unless marked otherwise.'],
      ['Which directive turns a file into a Client Component?', ['"use server"', '"use client"', '"client only"', 'export const runtime = "client"'], 1, '"use client" at the top marks the client boundary.'],
      ['A key benefit of rendering markdown in a Server Component is...', ['The markdown parser is never shipped in the client JavaScript bundle', 'It enables useState', 'It works without a server', 'It disables caching'], 0, 'Server-only code stays on the server, shrinking First Load JS.'],
      ['Which of these can a Server Component NOT use?', ['async/await', 'Reading files with fs', 'useState and onClick handlers', 'Database queries'], 2, 'Interactivity and state hooks require a Client Component.'],
      ['How do you pass data from a Server Component to a Client Component?', ['Through serialisable props', 'Through a global variable', 'Through localStorage', 'It is impossible'], 0, 'Props crossing the boundary must be serialisable (no functions).'],
    ],
    'A1.5': [
      ['What is a Server Action?', ['A REST endpoint written in Express', 'An async function marked "use server" that runs on the server when called from a form or client', 'A browser extension API', 'A GitHub Actions workflow'], 1, 'Server Actions are server functions that forms can invoke directly.'],
      ['Why can a form backed by a Server Action work with JavaScript disabled?', ['It uses WebSockets', 'The form posts natively to the server like a classic HTML form', 'It stores data in cookies', 'It cannot'], 1, 'Progressive enhancement: the <form action> posts even without client JS.'],
      ['What does revalidatePath("/tasks") do after an insert?', ['Deletes the page', 'Marks cached data for that route stale so the next render shows fresh data', 'Redirects the user to /tasks', 'Runs the test suite'], 1, 'It purges the route cache so the list reflects the new row.'],
      ['Where must input from a Server Action be validated?', ['Only in the browser', 'On the server, inside the action, because clients can be bypassed', 'Nowhere - Next.js validates automatically', 'Only in the database'], 1, 'Server Actions are public endpoints; always validate server-side.'],
      ['Which object does a form-bound Server Action receive?', ['A Request', 'FormData', 'A JSON string', 'The React state'], 1, 'Form actions are called with the submitted FormData.'],
    ],
    'A1.6': [
      ['What does a Suspense boundary show while its children are loading?', ['Nothing', 'Its fallback (e.g. a skeleton)', 'An error page', 'The previous page'], 1, 'The fallback renders until the suspended content resolves.'],
      ['Why wrap two slow panels in separate Suspense boundaries?', ['So each panel streams in independently as soon as its data is ready', 'To make both load together', 'To disable streaming', 'Because one boundary per page is not allowed'], 0, 'Separate boundaries avoid the slowest query blocking everything.'],
      ['What does a loading.tsx file in an App Router segment provide?', ['A Suspense fallback for that route segment', 'A loading spinner for images only', 'A service worker', 'A test fixture'], 0, 'loading.tsx wraps the segment in Suspense automatically.'],
      ['Streaming means the server...', ['sends the full page only after all data loads', 'sends HTML in chunks as parts become ready', 'sends JSON instead of HTML', 'renders only on the client'], 1, 'The shell arrives first and suspended parts follow.'],
      ['Which network setting best reveals whether panels stream independently?', ['Offline', 'Throttling to a slow profile such as Slow 3G', 'Disabling the cache only', 'HTTP/1.0 mode'], 1, 'Slow throttling makes the ordering of chunks visible.'],
    ],
    'A1.7': [
      ['In Prisma, where are models defined?', ['package.json', 'schema.prisma', '.env', 'next.config.js'], 1, 'schema.prisma holds the datasource, generator and models.'],
      ['What does `npx prisma migrate dev` do?', ['Deletes the database', 'Creates a SQL migration from schema changes and applies it to the dev database', 'Starts the Next.js server', 'Seeds random data only'], 1, 'It diffs the schema, writes a migration and applies it.'],
      ['A composite unique constraint on (orderId, productId) guarantees...', ['each order has one item only', 'the same product cannot appear twice in the same order', 'product ids are globally unique', 'orders cannot be deleted'], 1, 'Uniqueness applies to the pair, not to each column alone.'],
      ['Why should duplicates be rejected by the database rather than application code?', ['The database enforces it even under concurrent requests and other code paths', 'Application code cannot read data', 'It is faster to write', 'Prisma requires it'], 0, 'Constraints are the last line of defence against races.'],
      ['A foreign key from OrderItem.orderId to Order.id ensures...', ['every OrderItem references an existing Order', 'orders are sorted', 'ids are strings', 'orders have at least one item'], 0, 'Referential integrity prevents orphan rows.'],
    ],
    'A1.8': [
      ['What is the main property of a database transaction?', ['It runs faster', 'All its statements succeed together or none take effect', 'It cannot read data', 'It runs in the browser'], 1, 'Atomicity: a failure rolls everything back.'],
      ['If a simulated payment error is thrown inside an interactive transaction, the stock decrement...', ['stays applied', 'is rolled back', 'is applied twice', 'is queued for later'], 1, 'Throwing inside the transaction aborts and rolls it back.'],
      ['Why is cursor pagination preferred over OFFSET for large, changing tables?', ['It is stable and efficient: it seeks from the last seen key instead of skipping rows', 'It returns random rows', 'It needs no index', 'OFFSET is not valid SQL'], 0, 'OFFSET rescans skipped rows and can duplicate or skip rows when data changes.'],
      ['A cursor for order history is typically...', ['the page number', 'the id (or created_at + id) of the last row returned', 'a random token', 'the total row count'], 1, 'The next query asks for rows after that key.'],
      ['Which index best supports `WHERE userId = ? ORDER BY id` pagination?', ['An index on (userId, id)', 'An index on (id, userId) only', 'No index', 'A full-text index'], 0, 'Leading equality column then the sort column lets the index serve both.'],
    ],
    'A1.9': [
      ['What does a Zod schema provide at runtime?', ['Nothing - it is types only', 'Parsing and validation of unknown input, with typed output', 'Database migrations', 'CSS styling'], 1, 'Zod validates real data at runtime and infers TypeScript types.'],
      ['Which HTTP status suits a well-formed request whose fields fail validation?', ['200', '301', '422', '500'], 2, '422 Unprocessable Entity signals semantic validation failure.'],
      ['`schema.safeParse(body)` returns...', ['a thrown error on failure', 'an object with success true/false and data or error', 'a promise', 'a boolean only'], 1, 'safeParse never throws; check `success`.'],
      ['In the App Router, a POST handler for /api/checkout lives in...', ['pages/api/checkout.js only', 'app/api/checkout/route.ts exporting POST', 'middleware.ts', 'next.config.js'], 1, 'Route handlers export functions named after HTTP methods.'],
      ['Field-level errors are useful because...', ['they hide which field failed', 'the client can show each message next to the right input', 'they make responses smaller', 'browsers require them'], 1, 'Per-field errors map directly onto form fields.'],
    ],
    'A1.10': [
      ['How should passwords be stored?', ['In plain text', 'Base64 encoded', 'Hashed with a slow, salted algorithm such as bcrypt or argon2', 'Encrypted with a key in the client'], 2, 'Slow salted hashes resist offline cracking.'],
      ['Why should a failed sign-in say "Invalid email or password" rather than "No such user"?', ['It is shorter', 'It avoids user enumeration', 'It is required by OAuth', 'It improves SEO'], 1, 'Different messages reveal which emails are registered.'],
      ['Which cookie flag stops JavaScript from reading the session cookie?', ['Secure', 'HttpOnly', 'SameSite', 'Path'], 1, 'HttpOnly hides the cookie from document.cookie, limiting XSS theft.'],
      ['What does SameSite=Lax mainly protect against?', ['SQL injection', 'Cross-site request forgery on most cross-site requests', 'Brute force', 'Clickjacking'], 1, 'Lax withholds the cookie on most cross-site subrequests and POSTs.'],
      ['In OAuth sign-in with Google, who verifies the user\'s password?', ['Your app', 'Google, the identity provider', 'The browser', 'Nobody'], 1, 'Your app receives tokens, never the Google password.'],
    ],
    'A1.11': [
      ['Where does Next.js middleware run?', ['After the page renders', 'Before a request reaches the route, at the edge/server', 'Only in the browser', 'Only at build time'], 1, 'Middleware intercepts requests before routing completes.'],
      ['Why is a middleware redirect alone not enough to protect an admin Server Action?', ['Middleware cannot redirect', 'Actions can be invoked directly, so the action must check the role itself', 'Server Actions ignore cookies', 'It is enough'], 1, 'Defence in depth: authorise where the data is changed.'],
      ['Which status does a temporary redirect to the sign-in page commonly use in Next.js middleware?', ['200', '307', '404', '503'], 1, 'NextResponse.redirect defaults to 307 Temporary Redirect.'],
      ['A `matcher` in middleware config is used to...', ['match CSS selectors', 'limit which paths the middleware runs on', 'match database rows', 'choose the Node version'], 1, 'matcher restricts middleware to e.g. /admin/:path*.'],
      ['Authorisation answers which question?', ['Who are you?', 'What are you allowed to do?', 'Is the server up?', 'Which browser is this?'], 1, 'Authentication is identity; authorisation is permission.'],
    ],
    'A1.12': [
      ['What is a smoke test?', ['A load test with millions of users', 'A small set of end-to-end checks that the critical paths work at all', 'A unit test of one function', 'A security scan'], 1, 'Smoke tests catch "is it on fire" failures quickly.'],
      ['Which tool drives a real browser for end-to-end tests?', ['Vitest', 'Playwright', 'ESLint', 'Prettier'], 1, 'Playwright automates Chromium, Firefox and WebKit.'],
      ['Environment variables prefixed with NEXT_PUBLIC_ are...', ['server only', 'inlined into the client bundle and visible to anyone', 'encrypted', 'ignored in production'], 1, 'Never put secrets in NEXT_PUBLIC_ variables.'],
      ['Running tests in GitHub Actions on every push helps because...', ['it replaces code review', 'regressions are caught before merge on a clean machine', 'it makes builds smaller', 'it deploys automatically in all cases'], 1, 'CI gives a reproducible, automatic quality gate.'],
      ['Where should production secrets such as DATABASE_URL live?', ['Committed in .env', 'In the hosting provider\'s encrypted environment settings', 'In a public README', 'Hard-coded in the client'], 1, 'Keep secrets out of the repository and the client bundle.'],
    ],
  },
  tasks: {
    'A1.1': {
      language: 'typescript',
      title: 'Typed product card (TypeScript + JSX in the compiler)',
      description: 'In the EchoLens compiler (TypeScript), write an exported `ProductCardProps` interface (name, price, stock, variants: string[]) and an exported `ProductCard` component that renders the name, the price formatted to two decimals, a variant list, and an inventory badge that reads "In stock" when stock > 0 and "Sold out" otherwise. Render three instances with `console.log(renderToString(<ProductCard ... />))`. Do not use `any` anywhere.',
      criteria: ['The type check passes with no errors and no use of `any`.', 'Props are described by an exported interface.', 'Three instances with different props are printed.', 'The badge text changes when stock crosses zero.'],
      hint: 'JSX in the compiler is printed with renderToString(). A component is a function taking typed props and returning JSX.Element.',
    },
    'A1.2': {
      language: 'typescript',
      title: 'Checkout wizard reducer (TypeScript)',
      description: 'Write an exported `checkoutReducer(state, action)` for a three-step checkout (personal details, shipping address, payment method). Model the actions as a typed union (e.g. next, back, update a field). Add a `canSubmit(state)` function that is true only when every required field is filled. Then drive the reducer with a sequence of actions and print the state after each step.',
      criteria: ['Actions are a discriminated union and the type check passes.', 'Moving forward and back keeps data entered at step one present at step three.', 'The step never goes below 1 or above 3.', 'canSubmit is false until all required fields are filled, then true.'],
      hint: 'Return a new object from every case ({ ...state, step: state.step + 1 }) - never mutate state.',
    },
    'A1.3': {
      language: 'typescript',
      title: 'Debounce utility with cleanup (TypeScript)',
      description: 'Implement a generic `debounce<T extends unknown[]>(fn: (...args: T) => void, delay: number)` that returns a debounced function plus a `cancel()` method. Simulate ten fast keystrokes (one every 50 ms) calling the debounced search with the growing text, and show that the search runs exactly once, about 300 ms after the last keystroke. Then show that `cancel()` prevents a pending call.',
      criteria: ['Ten rapid calls produce exactly one invocation with the final value.', 'The invocation happens roughly 300 ms after the last call (print the measured delay).', 'cancel() stops a pending invocation.', 'The type check passes with no use of `any`.'],
      hint: 'Keep the timer id in a closure; clearTimeout it on every call and in cancel(). Use Date.now() to measure the delay.',
    },
  },
};
