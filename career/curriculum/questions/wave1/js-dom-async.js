'use strict';
const {bank}=require('../../learning/wave1/web-helper');
module.exports=bank('js-dom-async',[
  {
    "comp": "m1.c1",
    "rows": [
      [
        "Which selection API returns the first matching element or null?",
        "querySelector",
        "querySelectorAll",
        "createElement",
        "JSON.parse",
        "querySelector returns one matching element or null.",
        "QuerySelectorAll returns a static NodeList.",
        "Creating a node does not select an existing match.",
        "JSON parsing does not select nodes."
      ],
      [
        "What does createElement produce?",
        "An element node",
        "A server record",
        "An HTTP response",
        "An automatically attached child",
        "It creates an element that can then be configured and inserted.",
        "DOM creation does not persist server data.",
        "No network response is created.",
        "Creation alone does not insert it."
      ],
      [
        "Which assignment displays angle brackets as ordinary text?",
        "node.textContent = value",
        "node.innerHTML = value",
        "eval(value)",
        "new Function(value)()",
        "TextContent sets text rather than parsing HTML markup.",
        "InnerHTML interprets markup.",
        "Eval interprets code.",
        "Function construction interprets code."
      ],
      [
        "A help desk displays ticket titles supplied by customers. Which insertion fits literal text?",
        "Assign the title to textContent",
        "Concatenate titles into innerHTML",
        "Build inline handlers from titles",
        "Run titles as expressions",
        "Literal ticket text should not be interpreted as markup or code.",
        "Markup parsing exceeds that contract.",
        "Handlers are executable code contexts.",
        "Expressions execute rather than display data."
      ],
      [
        "An admin screen selects a button after navigation and receives null. What should it do?",
        "Handle a missing-control state",
        "Read its disabled property immediately",
        "Assume it is an empty NodeList",
        "Create a server permission",
        "A nullable selection requires a lifecycle-aware absence path.",
        "Dereferencing null fails.",
        "QuerySelector does not return a NodeList.",
        "DOM selection cannot grant authority."
      ],
      [
        "A dashboard replaces a panel’s textContent and loses nested buttons. Why?",
        "Existing child content was replaced",
        "TextContent preserves all controls",
        "The server deleted the buttons",
        "The CSS selector changed itself",
        "Setting textContent replaces child content with text.",
        "Preservation is not this operation’s contract.",
        "No server effect follows from this assignment.",
        "The selector is independent."
      ],
      [
        "A search UI saves querySelectorAll results before adding another result row. What should it expect?",
        "The saved NodeList stays static",
        "Every collection is live",
        "The saved list inserts the row itself",
        "The list becomes null automatically",
        "QuerySelectorAll returns a static NodeList rather than a live collection.",
        "Collection liveness depends on the API.",
        "Selection does not perform insertion.",
        "Adding a node does not null out the list."
      ],
      [
        "A review card uses textContent for a title and sets href from customer input. What still needs review?",
        "The destination URL safety policy",
        "Only the text node’s length",
        "Whether textContent encrypts href",
        "Whether all URLs become harmless text",
        "Text insertion does not validate a separate URL context.",
        "Length alone does not establish URL safety.",
        "TextContent provides no encryption.",
        "Href remains a URL destination."
      ],
      [
        "A portal replaces a focused form subtree with freshly created nodes. What needs explicit testing?",
        "Focus and interaction continuity",
        "Only the new node count",
        "Only successful JSON serialization",
        "Only a server response header",
        "Replacing controls can affect focus and keyboard interaction.",
        "Node count omits user continuity.",
        "JSON does not exercise focus.",
        "Headers do not establish DOM focus behavior."
      ],
      [
        "A security review accepts a text-intent object model as proof that browser innerHTML is safe. What is the evidence gap?",
        "The browser parser was not exercised",
        "Object equality proves sanitization",
        "Node always runs a browser DOM",
        "Literal strings cannot contain markup",
        "A view model does not execute markup parsing or establish sanitizer behavior.",
        "Equality does not test browser interpretation.",
        "Node has no default browser document.",
        "Strings can contain markup-shaped text."
      ]
    ]
  },
  {
    "comp": "m1.c2",
    "rows": [
      [
        "What does event.currentTarget identify during a listener call?",
        "The listener’s registered target",
        "Always the deepest clicked child",
        "Always the document",
        "The authenticated account",
        "CurrentTarget reflects the target on which that listener is registered.",
        "Target and currentTarget can differ.",
        "Listeners need not be on document.",
        "Event dispatch does not establish account identity."
      ],
      [
        "What is needed to remove a registered listener?",
        "Same callback and capture",
        "An equivalent new function body",
        "Only the same variable spelling",
        "Only the event type",
        "Removal depends on the registered function identity and matching capture semantics.",
        "New function objects have different identities.",
        "A name is not the function object.",
        "Type alone cannot identify the registration."
      ],
      [
        "Which option automatically removes a listener after its first invocation?",
        "once: true",
        "capture: true",
        "passive: true",
        "bubbles: true",
        "Once requests removal after that listener runs once.",
        "Capture chooses phase.",
        "Passive constrains cancellation behavior.",
        "Bubbles is an event characteristic, not this removal option."
      ],
      [
        "A checkout repeatedly mounts a panel and one click invokes three handlers. What should be inspected?",
        "Listener setup and teardown",
        "Only the button’s color",
        "Only JSON indentation",
        "Only the database index name",
        "Repeated mounts can retain registrations unless cleanup matches setup.",
        "Color does not remove callbacks.",
        "Formatting does not control registration.",
        "Index naming does not explain local listeners."
      ],
      [
        "A form handler calls preventDefault but its parent listener still runs. Why?",
        "Cancellation differs from propagation",
        "PreventDefault always stops bubbling",
        "The server retried the event",
        "Every event ignores preventDefault",
        "Default cancellation and propagation control are separate concepts.",
        "PreventDefault does not generally stop propagation.",
        "No remote retry is implied.",
        "Cancelable defaults can be prevented."
      ],
      [
        "A delegated list handler sees a click on an icon inside a button. What must its lookup handle?",
        "Nested targets/ownership",
        "Only direct button targets",
        "Only the document title",
        "Only clicks with no ancestors",
        "Delegation must resolve the intended control and ensure it belongs to the delegated container.",
        "Targets can be nested descendants.",
        "Titles do not identify the clicked control.",
        "Ancestor relationships enable delegation."
      ],
      [
        "A modal uses an anonymous callback on setup and a new anonymous callback on cleanup. What is wrong?",
        "Cleanup uses a different function",
        "Matching source text guarantees removal",
        "Anonymous callbacks cannot run",
        "Every callback is removed on render",
        "Distinct function objects do not match the registered callback.",
        "Textual similarity is not identity.",
        "Anonymous functions are callable.",
        "Rendering does not universally remove listeners."
      ],
      [
        "A developer uses stopPropagation as duplicate-payment protection. What is missing?",
        "Repeat-operation guards",
        "Only a larger click target",
        "Only a second listener",
        "Only textContent assignment",
        "Propagation control does not enforce pending-state or backend idempotency requirements.",
        "Target size does not establish transaction uniqueness.",
        "More listeners can add duplicate work.",
        "Text insertion does not coordinate payment operations."
      ],
      [
        "An event listener is registered with capture true and removed with capture false. Why may it remain?",
        "The capture flag does not match",
        "Type names are case-insensitive",
        "Removal never supports capture",
        "Callbacks are copied by value",
        "Capture participates in matching the listener for removal.",
        "Event type matching is not repaired by case assumptions.",
        "Capture is supported and relevant.",
        "The same callback identity can still have differing capture registrations."
      ],
      [
        "A Node EventTarget fixture passes once and removal tests. Which claim exceeds its evidence?",
        "Native browser form behavior",
        "The fixture callback count",
        "The tested once option",
        "The removal using the same callback",
        "Node EventTarget does not render a form or implement the full browser DOM tree interaction tested by that claim.",
        "The count is observed.",
        "The option is exercised.",
        "The matching removal call is exercised."
      ]
    ]
  },
  {
    "comp": "m2.c1",
    "rows": [
      [
        "Which code runs before queued promise reactions in an ordinary script turn?",
        "Current-stack statements",
        "Every timer callback",
        "The next network response",
        "Every future click handler",
        "The current JavaScript stack runs to completion before queued microtasks run.",
        "Timers are later tasks.",
        "Network completion does not interrupt the stack.",
        "Future events do not preempt this stack."
      ],
      [
        "What queue receives a fulfilled promise’s then reaction?",
        "The microtask queue",
        "The CSS cascade",
        "The call stack immediately inline",
        "The database transaction queue",
        "Promise reactions run asynchronously as microtasks.",
        "CSS resolution is a different subsystem.",
        "Then callbacks do not run inline merely because the promise is fulfilled.",
        "No database is involved."
      ],
      [
        "Does setTimeout(fn, 0) guarantee immediate execution?",
        "No, it schedules a later eligible task",
        "Yes, before the next statement",
        "Yes, before every microtask",
        "Yes, at an exact wall-clock instant",
        "A zero delay is not synchronous execution or an exact scheduling guarantee.",
        "The remaining stack continues first.",
        "Pending microtasks can run first.",
        "Load and task scheduling affect actual time."
      ],
      [
        "A page logs A, schedules a zero timer, queues a resolved-promise reaction, and logs B. What comes first?",
        "A then B",
        "Timer then A",
        "Promise then A",
        "Timer then promise then B",
        "The two synchronous logs complete before the queued callbacks.",
        "Scheduling does not execute the timer inline.",
        "Promise reactions are asynchronous.",
        "B is part of the current synchronous stack."
      ],
      [
        "A status page queues a promise reaction and a timer in one script. With no other complications, which runs first?",
        "The queued promise reaction callback",
        "The timer by registration priority alone",
        "Whichever prints a shorter string",
        "Both simultaneously on one stack",
        "A microtask checkpoint runs queued promise reactions before the later timer task.",
        "Registration order across these queue kinds does not override the checkpoint.",
        "String length is irrelevant.",
        "Callbacks do not execute simultaneously on the same stack."
      ],
      [
        "A recursive queueMicrotask loop keeps appending another microtask. What is a risk?",
        "Task/render starvation",
        "Guaranteed smooth animation",
        "Automatic migration to a worker",
        "Automatic backend throttling",
        "Continuously draining newly queued microtasks can delay other work.",
        "Microtask churn can harm responsiveness.",
        "Queuing does not create a worker.",
        "No server throttle is implied."
      ],
      [
        "A CPU-heavy loop blocks a spinner despite fetch being asynchronous. Why?",
        "A busy main-thread execution stack",
        "Fetch makes every computation parallel",
        "The spinner authorizes scheduling",
        "Promises interrupt loops",
        "Asynchronous I/O does not make synchronous CPU work nonblocking.",
        "The loop remains synchronous.",
        "UI elements do not grant execution time.",
        "Promise reactions wait for stack completion."
      ],
      [
        "A timer records a delay longer than requested under load. What is defensible?",
        "A minimum delay, not a fixed deadline",
        "The clock proves the browser is invalid",
        "Timers guarantee exact deadlines",
        "Every delay means a network retry",
        "Timer callbacks wait until eligible scheduling and main-thread availability.",
        "Delay alone does not establish a browser defect.",
        "Exact deadline execution is not guaranteed.",
        "Timers can be late without any network."
      ],
      [
        "A worker performs a calculation while the UI listens for its message. What remains true?",
        "Messages are asynchronous boundaries",
        "The worker directly owns document nodes",
        "Every shared object is copied by reference",
        "The message interrupts the current handler",
        "Worker communication must be treated as asynchronous coordination.",
        "Ordinary workers do not directly manipulate document DOM.",
        "Structured clone and transfer have defined semantics.",
        "The current JavaScript handler completes first."
      ],
      [
        "A performance review proves ordering in Node and concludes every browser paint occurs at the same point. What is wrong?",
        "Browser rendering untested",
        "Node output timestamps prove every paint",
        "Microtasks are CSS frames",
        "A timer forces a paint before it runs",
        "JavaScript queue output alone does not prove actual rendering opportunities in a browser.",
        "Node does not perform browser painting.",
        "Microtasks are scheduled callbacks, not frames.",
        "A timer does not universally force a prior paint."
      ]
    ]
  },
  {
    "comp": "m3.c1",
    "rows": [
      [
        "What does an async function return?",
        "A promise",
        "Always its final plain value synchronously",
        "Always undefined",
        "A browser element",
        "Async functions return promises reflecting completion or failure.",
        "The caller receives a promise even when a plain value is returned internally.",
        "Successful returns can fulfill with other values.",
        "No DOM result is required."
      ],
      [
        "How can await observe a rejected promise inside an async function?",
        "By throwing at the awaiting expression",
        "By converting every rejection to null",
        "By ignoring every rejection",
        "By retrying forever automatically",
        "An awaited rejection throws and can be caught by surrounding try/catch.",
        "Null conversion requires explicit code.",
        "Rejections are not universally ignored.",
        "Await supplies no automatic retry policy."
      ],
      [
        "What must an async helper do for its caller to await inner work?",
        "Return or await the relevant promise",
        "Only start it and return nothing",
        "Only rename the callback",
        "Only use a longer timeout",
        "The helper’s completion contract must include the inner asynchronous operation.",
        "Detached work can outlive the helper.",
        "Names do not connect promise lifetimes.",
        "Delays do not establish completion ownership."
      ],
      [
        "A save handler reports success before its asynchronous write finishes. Which defect is likely?",
        "Detached write promise",
        "The response was too short",
        "The button lacked a border",
        "The array was sorted",
        "The handler’s success path must depend on actual write completion.",
        "Length does not establish sequencing.",
        "Styling is unrelated.",
        "Sorting does not own the write promise."
      ],
      [
        "An async function catches an error, logs it, and returns undefined. What does its caller usually receive?",
        "A promise fulfilled with undefined",
        "The original rejection automatically",
        "A process exit automatically",
        "A retry promise automatically",
        "Catching without rethrowing or rejecting converts this path into normal completion.",
        "The catch consumed that error.",
        "Logging does not terminate the process.",
        "No retry is created implicitly."
      ],
      [
        "A profile loader must always clear a pending flag after success or failure. Which construct fits?",
        "finally",
        "Only a success then handler",
        "Only the initial assignment",
        "Only a comment",
        "Finally is intended for cleanup after either outcome, with care not to mask errors.",
        "Success-only work misses rejection paths.",
        "The initial assignment cannot observe completion.",
        "Comments do not execute cleanup."
      ],
      [
        "A try block calls an async helper without await and expects to catch its later rejection. What needs correction?",
        "Handle the rejection",
        "Only change const to let",
        "Only indent the call",
        "Only add JSON.parse",
        "A surrounding synchronous try does not catch a later detached promise rejection.",
        "Binding mutability does not attach error handling.",
        "Formatting is not control flow.",
        "Parsing is unrelated."
      ],
      [
        "A notification failure should not claim the payment itself failed after the payment committed. What should the flow preserve?",
        "Separate payment and notification outcomes",
        "One invented rollback result",
        "Only a generic success log",
        "A guarantee that catch reverses payment",
        "Different remote effects need distinct outcome and recovery policies.",
        "A local failure does not prove reversal.",
        "A log can hide the failed notification.",
        "Catch does not undo committed external effects."
      ],
      [
        "A cleanup finally returns a default value after an awaited operation rejects. What can happen?",
        "It masks the rejection",
        "Finally can never change outcomes",
        "The rejection always wins over return",
        "The operation retries",
        "A finally return can replace the earlier completion, hiding failure.",
        "Finally code can override completion.",
        "A new return changes the outcome.",
        "No retry occurs automatically."
      ],
      [
        "A loader suppresses all errors to keep the UI green, including schema errors and permission failures. What is the review concern?",
        "Failure causes and truthful state are hidden",
        "Catching proves data validity",
        "Every error is transient",
        "A fulfilled promise proves authorization",
        "Broad suppression can hide actionable failures and invent a successful-looking state.",
        "Handling an exception does not validate data.",
        "Permission and contract failures need not be transient.",
        "Promise fulfillment is not permission evidence."
      ]
    ]
  },
  {
    "comp": "m3.c2",
    "rows": [
      [
        "Which tool waits for all input fulfillments and rejects when an input rejects?",
        "Promise.all",
        "Array.map alone",
        "JSON.stringify",
        "setInterval",
        "Promise.all combines promises with fail-fast rejection semantics.",
        "Map constructs an array but does not await its promises.",
        "Serialization does not coordinate asynchronous work.",
        "Intervals schedule repeated callbacks."
      ],
      [
        "Which tool provides a result record for every input promise outcome?",
        "Promise.allSettled",
        "Promise.resolve alone",
        "Array.filter",
        "clearTimeout",
        "AllSettled fulfills with status records after all inputs settle.",
        "Resolve handles a value or promise, not an outcome list by itself.",
        "Filter is synchronous array selection.",
        "Clearing a timer does not collect results."
      ],
      [
        "Does Promise.all start functions passed as uncalled values?",
        "No, call them explicitly",
        "Yes, all functions are invoked automatically",
        "Only functions named fetch",
        "Only arrow functions",
        "Promise.all consumes iterable values; it does not call supplied function values.",
        "Function values are ordinary values unless called.",
        "Names do not change this contract.",
        "Syntax does not cause automatic invocation."
      ],
      [
        "A settings page needs independent profile and preferences requests. Which can reduce waiting?",
        "Start both independent requests; await all",
        "Await profile before starting preferences always",
        "Use synchronous busy waiting",
        "Assume requests need no errors",
        "Independent work can overlap when started before awaiting the combined result.",
        "Unnecessary sequencing adds latency.",
        "Busy waiting blocks progress.",
        "Parallel work still requires failure handling."
      ],
      [
        "A shipping request needs the order id returned by an order-creation request. Which order is valid?",
        "Await the actual order id",
        "Run shipping with a guessed id",
        "Use Promise.all to invent the id",
        "Ignore creation failure",
        "The second operation depends on the first result and must use the actual successful id.",
        "Guessing can affect the wrong record.",
        "Concurrency tools do not create dependency data.",
        "Failure must stop or redirect dependent work."
      ],
      [
        "A dashboard must display successful panels even if one optional panel fails. Which result strategy fits?",
        "Collect each operation’s settled outcome",
        "Treat any failure as proof all failed",
        "Discard every result silently",
        "Retry successful writes blindly",
        "Per-operation outcomes allow a deliberate partial-success interface.",
        "One rejection does not mean every operation failed.",
        "Silence loses useful evidence.",
        "Blind retries can duplicate effects."
      ],
      [
        "A batch importer launches fifty thousand requests at once. What should be considered?",
        "A limit on simultaneous in-flight requests",
        "Only renaming Promise.all",
        "Only larger JSON indentation",
        "Assuming parallel means unlimited capacity",
        "Concurrency limits can protect the client and service from excessive in-flight work.",
        "Naming does not limit execution.",
        "Formatting is unrelated.",
        "Resources and rate limits remain finite."
      ],
      [
        "A Promise.all rejects after one write fails. What must not be assumed?",
        "Other writes were undone",
        "The aggregate rejected",
        "Some other operations may continue",
        "Compensation may be needed",
        "Fail-fast aggregate rejection does not cancel or reverse the other operations.",
        "That is observed aggregate behavior.",
        "Other operations can continue.",
        "Recovery policy may need compensation."
      ],
      [
        "A team assumes result order in Promise.all matches completion order. What is correct?",
        "Results keep input order",
        "Results are randomly shuffled",
        "Fastest response is always first",
        "Responses are sorted by status",
        "Promise.all preserves input ordering in its fulfillment values.",
        "The order is specified.",
        "Completion speed does not reorder the array.",
        "Status is not a sort key."
      ],
      [
        "An importer retries a failed aggregate containing partially committed writes. What must its design address?",
        "Idempotency and per-item recovery",
        "Only repeating the same aggregate forever",
        "Only a larger timeout",
        "Only catching the last rejection",
        "Partial remote success means retry safety depends on operation identity and actual effects.",
        "Blind repetition can duplicate committed work.",
        "Time alone does not reconcile state.",
        "One rejection does not enumerate all committed outcomes."
      ]
    ]
  },
  {
    "comp": "m4.c1",
    "rows": [
      [
        "Does fetch normally reject its promise merely because status is 404?",
        "No; check HTTP status",
        "Yes, every 404 rejects",
        "Only if the body is HTML",
        "Only if the URL is short",
        "HTTP error responses can fulfill with a Response object.",
        "A status error is not automatically a transport rejection.",
        "The body format does not determine this rule.",
        "URL length is irrelevant."
      ],
      [
        "What status range does Response.ok represent?",
        "200 through 299",
        "Every status below 500",
        "Only 200",
        "Only valid JSON bodies",
        "Ok reflects the HTTP success status range.",
        "Redirect and client-error ranges are not all ok.",
        "Other 2xx statuses also qualify.",
        "Ok does not validate the representation."
      ],
      [
        "What does response.json return?",
        "A parsing promise",
        "A guaranteed valid object synchronously",
        "A new permission grant",
        "A retry timer",
        "Json asynchronously consumes and parses the body.",
        "Parsing can fail and is asynchronous.",
        "Body parsing does not authorize.",
        "No retry is implied."
      ],
      [
        "A catalog API returns 500 with an HTML error page. What must the client handle?",
        "Status and representation errors",
        "Only an empty product array",
        "Automatic fetch rejection for 500",
        "A guaranteed JSON error object",
        "Status and representation are separate contracts; HTML will not satisfy expected JSON parsing.",
        "An empty list invents a business outcome.",
        "Fetch can fulfill for 500.",
        "The response format must be checked or handled."
      ],
      [
        "A delete endpoint returns 204 with no representation. Which client behavior is suspect?",
        "Always attempting JSON body parsing",
        "Checking the documented status",
        "Displaying a defined success state",
        "Handling an empty body deliberately",
        "No-content success does not require a JSON body to parse.",
        "Status checking is appropriate.",
        "The interface can represent successful deletion.",
        "Explicit empty-body handling matches the contract."
      ],
      [
        "A report reads response.json twice on the same un-cloned body. What is relevant?",
        "Body consumption semantics",
        "Only the endpoint spelling",
        "Only pretty printing",
        "Only an extra let binding",
        "A response body is generally a single-consumption stream unless appropriately cloned or buffered.",
        "Names do not reset streams.",
        "Formatting does not allow rereading.",
        "A binding does not duplicate body data."
      ],
      [
        "A search field changes quickly and old responses overwrite newer ones. What is needed?",
        "Stale-result control",
        "Only a longer animation",
        "Only response.ok",
        "Only GET method selection",
        "The UI must ensure results correspond to the current query; successful status alone does not order requests.",
        "Animation does not coordinate outcomes.",
        "Ok says nothing about request freshness.",
        "GET responses can arrive out of order."
      ],
      [
        "A client aborts a request after a remote purchase may have committed. What can it conclude?",
        "Remote reversal is unproved",
        "The purchase definitely disappeared",
        "Every database rolled back",
        "The payment never reached the service",
        "Abort affects local request processing and cannot prove remote transactional reversal.",
        "The external effect may exist.",
        "No universal transaction rollback is implied.",
        "Delivery may already have occurred."
      ],
      [
        "A response is ok and parses as JSON but lacks a required amount field. What remains necessary?",
        "Validate required response fields",
        "Assuming success proves every field",
        "Only another status check",
        "Only changing the content type",
        "HTTP success and JSON syntax do not establish the expected object shape.",
        "Business validity needs further checks.",
        "Status is already known and cannot supply the field.",
        "A header change cannot repair missing data."
      ],
      [
        "A local Response fixture passes status and JSON assertions. Which claim needs separate evidence?",
        "Browser-origin behavior",
        "The supplied status",
        "The local JSON parsing result",
        "The constructed response.ok value",
        "An in-memory Response is not a real browser-origin network interaction.",
        "That input is explicit.",
        "Parsing actually runs.",
        "Ok is directly read."
      ]
    ]
  },
  {
    "comp": "m4.c2",
    "rows": [
      [
        "What direct value representation does Web Storage use?",
        "Strings",
        "Live function closures",
        "Arbitrary object identities",
        "DOM node graphs",
        "Web Storage stores string keys and values.",
        "Functions are not persisted as live closures.",
        "Objects require deliberate serialization.",
        "DOM graphs are not directly stored."
      ],
      [
        "Which storage commonly persists a preference across browser sessions?",
        "localStorage",
        "A local function variable",
        "A pending promise",
        "A selected DOM node",
        "LocalStorage commonly persists subject to clearing and browser policy.",
        "A local variable does not survive page lifecycle.",
        "Promises are transient runtime objects.",
        "A DOM reference is not persistent storage."
      ],
      [
        "Are localStorage operations promise-based asynchronous calls?",
        "No; it is synchronous",
        "Yes, each waits for HTTP",
        "Only for string values",
        "Only after JSON parsing",
        "Web Storage calls are synchronous and can affect responsiveness.",
        "They do not inherently perform a network wait.",
        "Strings are its normal values.",
        "Parsing does not change API scheduling."
      ],
      [
        "A shared kiosk logs out a student and restores the old draft for the next person. What was missed?",
        "Ownership and lifecycle",
        "Only a shorter key name",
        "Only gzip compression",
        "Only a different border color",
        "Account-specific convenience state must not cross identity boundaries.",
        "Short keys do not establish ownership.",
        "Compression does not isolate users.",
        "Appearance does not protect stored data."
      ],
      [
        "A browser blocks storage access or quota is exhausted. What should the application do?",
        "Handle the save failure",
        "Always claim the draft was saved",
        "Skip server authorization",
        "Delete unrelated records",
        "Storage can fail; the interface must reflect the actual persistence outcome.",
        "A failed write is not success.",
        "Server authority remains necessary.",
        "Unrelated deletion is not a justified recovery policy."
      ],
      [
        "A release changes a stored settings shape. What supports safe reads?",
        "Schema versioning and validation",
        "Assuming all saved data is current",
        "Only renaming the CSS class",
        "Only sorting JSON keys",
        "Stored data can outlive application versions and require migration or rejection.",
        "Persistence does not guarantee compatibility.",
        "Styling cannot migrate records.",
        "Key order does not establish shape compatibility."
      ],
      [
        "A page sees role=admin in localStorage. What may the backend infer?",
        "No authoritative server permission",
        "The user has every server privilege",
        "The JSON proves identity",
        "Persistence proves an administrator approved it",
        "Client-controlled storage cannot independently grant server authority.",
        "Protected operations need server checks.",
        "Syntax is not identity evidence.",
        "Persistence does not show approval."
      ],
      [
        "A developer describes sessionStorage as one globally shared store across all tabs forever. What should be corrected?",
        "Its session/context scope",
        "The fact that it stores strings",
        "The need to validate saved data",
        "The possibility of access failure",
        "SessionStorage has scoped context and lifecycle semantics, including opener-copy nuances.",
        "String storage is accurate.",
        "Validation remains appropriate.",
        "Access can fail under policy."
      ],
      [
        "A preference record contains malformed JSON. Which restoration path is appropriate?",
        "Use a safe parse fallback",
        "Treat it as a passed assessment",
        "Execute the string as JavaScript",
        "Copy it into innerHTML",
        "Stored text is untrusted input and requires safe parsing and validation.",
        "Convenience state cannot establish assessment evidence.",
        "Execution introduces a code interpretation risk.",
        "Markup insertion does not validate the record."
      ],
      [
        "A local state model uses Map and passes serialization tests. Which guarantee is still unproved?",
        "Browser scope/persistence",
        "The model’s stored JSON string",
        "The parsed fixture version",
        "The model key lookup",
        "Map does not implement browser Web Storage lifetime, origin or context behavior.",
        "The string is executed model data.",
        "The version can be checked locally.",
        "Map lookup itself executes."
      ]
    ]
  },
  {
    "comp": "m1.c2",
    "rows": [
      [
        "Which event property commonly identifies the originating target as exposed by the event model?",
        "target",
        "currentTarget always",
        "defaultPrevented",
        "timeStamp",
        "Target identifies the exposed originating target, with retargeting nuances.",
        "CurrentTarget identifies the listener’s registered target.",
        "DefaultPrevented reports cancellation state.",
        "TimeStamp is timing data."
      ],
      [
        "What does stopPropagation primarily affect?",
        "Further event propagation",
        "Every default action automatically",
        "Remote authorization",
        "Stored JSON schema",
        "It controls propagation rather than being a general default-action or permission mechanism.",
        "Default cancellation is separate.",
        "Server authorization is independent.",
        "Storage schemas are unrelated."
      ],
      [
        "Which condition makes preventDefault meaningful for canceling an action?",
        "Allowed event cancellation",
        "Any variable named event",
        "Only a red button",
        "Only a successful HTTP response",
        "Cancellation depends on the event contract and listener constraints, including passive behavior.",
        "A name does not set event semantics.",
        "Color is irrelevant.",
        "HTTP status does not define event cancellation."
      ],
      [
        "A table delegates delete clicks from its body. A nested table can also match closest. What extra check matters?",
        "This table’s controls",
        "Only a matching icon class",
        "Only the number of table rows",
        "Only whether the click is fast",
        "Delegation should enforce the intended ownership boundary rather than accept unrelated nested controls.",
        "Visual classes alone can match unrelated descendants.",
        "Counts do not establish ownership.",
        "Speed is not a boundary."
      ],
      [
        "A popup registers listeners with an AbortSignal for its lifecycle. What must cleanup do?",
        "Abort the intended controller",
        "Create another unrelated controller",
        "Only drop a local variable",
        "Only disable CSS animation",
        "Aborting the controller associated with those registrations can remove their signal-bound listeners.",
        "An unrelated signal has no ownership relation.",
        "Losing a variable does not necessarily remove listeners.",
        "Animation controls are independent."
      ],
      [
        "A card click listener navigates, but its child favorite button should not navigate. What requires a policy?",
        "Nested control behavior",
        "Only the card’s image width",
        "Only the JSON field order",
        "Only the server hostname",
        "Nested controls need intentional behavior so one action does not trigger an unintended parent action.",
        "Width alone does not define interaction.",
        "Field order is unrelated.",
        "Hostnames do not control local propagation."
      ],
      [
        "A passive touch listener calls preventDefault and expects scrolling to stop. What should be reviewed?",
        "Passive-listener rules",
        "Only callback indentation",
        "Only an extra promise",
        "Only the request header count",
        "Passive listeners indicate cancellation will not be used, so preventDefault is not a reliable cancellation strategy there.",
        "Formatting does not change options.",
        "Promises do not override passive semantics.",
        "Headers concern network requests."
      ],
      [
        "A listener is removed after work finishes, yet multiple rapid clicks start work before removal. What is missing?",
        "Guards while work is pending",
        "Only eventual listener cleanup",
        "Only a different function name",
        "Only innerHTML escaping",
        "Cleanup after completion does not prevent overlapping actions while the operation is pending.",
        "Eventual cleanup leaves a race window.",
        "Names do not coordinate state.",
        "Escaping does not guard repeat submission."
      ],
      [
        "A delegated handler remains on a container while child buttons are replaced. Why can it still work?",
        "New descendant events reach that container",
        "The old button listeners were cloned",
        "Every new child has a server listener",
        "Event delegation persists the old child nodes",
        "Delegation attaches the listener to an ancestor and resolves current event descendants.",
        "Replacing nodes does not clone arbitrary listener registrations.",
        "Server listeners are not DOM listeners.",
        "The old nodes need not remain."
      ],
      [
        "A component framework renders through portals or shadow roots and delegation assumptions fail. What should engineers verify?",
        "The actual event contract",
        "Only ordinary ancestor diagrams",
        "Only target text length",
        "Only a Node EventTarget counter",
        "Retargeting and framework event behavior require evidence for the actual rendered topology.",
        "A simplified tree can omit crucial boundaries.",
        "Text length does not establish propagation.",
        "Node EventTarget does not reproduce that topology."
      ]
    ]
  },
  {
    "comp": "m3.c1",
    "rows": [
      [
        "What does throwing inside an async function normally produce for its caller?",
        "A rejected promise",
        "A synchronous return of the error value",
        "An automatically fulfilled null",
        "An infinite timer",
        "An unhandled throw in the async function rejects its returned promise.",
        "An error is not implicitly returned as a normal value.",
        "Null needs explicit conversion.",
        "No timer is implied."
      ],
      [
        "Can await be used on a non-promise value inside an async function?",
        "Yes, adopting the value",
        "No, it must always throw",
        "Only if the value is null",
        "Only if the value is a DOM node",
        "Await accepts values as well as promises, while its continuation remains asynchronous.",
        "Plain values are accepted.",
        "Acceptance is not limited to null.",
        "DOM nodes have no special exclusivity."
      ],
      [
        "What is an unhandled rejection?",
        "An unhandled promise error",
        "Any caught validation error",
        "Every 404 Response",
        "Every resolved undefined",
        "Rejected promises need deliberate handling; otherwise the runtime may report an unhandled rejection.",
        "A caught error is handled in that path.",
        "HTTP status does not necessarily reject fetch.",
        "Undefined can be a fulfilled value."
      ],
      [
        "An editor’s autosave catches network failure and shows Saved anyway. What should change?",
        "Report the actual outcome",
        "Only shorten the status text",
        "Only increase font size",
        "Only rename the promise",
        "The UI must not claim persistence when its save failed.",
        "Short wording can still be false.",
        "Font size does not fix state truth.",
        "Names do not alter error handling."
      ],
      [
        "A poller awaits one request per loop but ignores an external stop flag. What else does it need?",
        "Lifecycle stop policy",
        "Only more await keywords",
        "Only a larger array",
        "Only Promise.resolve around the loop",
        "Await sequences operations but does not by itself define when polling must stop.",
        "Additional awaits do not create ownership policy.",
        "Capacity is unrelated.",
        "Promise wrapping does not implement cancellation."
      ],
      [
        "An account changes while a profile load is awaiting. What must happen before applying the result?",
        "Check current identity",
        "Assume every fulfilled result is current",
        "Only inspect JSON whitespace",
        "Only test response.ok",
        "Asynchronous completion can cross identity and navigation boundaries.",
        "Fulfillment does not guarantee freshness or ownership.",
        "Whitespace does not establish identity.",
        "Status success is not account continuity."
      ],
      [
        "A background refresh rejects after the caller returned. How should ownership be expressed?",
        "Handle the detached operation’s rejection",
        "Ignore it because the caller finished",
        "Assume try/catch outside already caught it",
        "Return a success message as evidence",
        "Detached operations still need a defined outcome and error policy.",
        "Caller completion does not handle later rejection.",
        "A synchronous outer catch cannot catch a later detached rejection.",
        "A message does not establish work success."
      ],
      [
        "A fetch-and-parse helper returns a promise but its caller forgets await and checks if(result). Why is that misleading?",
        "The promise object itself is truthy",
        "A pending promise is always false",
        "Truthiness validates JSON fields",
        "Every promise resolves true",
        "The check observes the promise object, not the eventual parsed data or failure.",
        "Objects are truthy.",
        "Truthiness does not validate shape.",
        "Promises can fulfill with many values or reject."
      ],
      [
        "A retry handler catches every error including invalid credentials and retries without bound. What needs design?",
        "Bounded eligible retries",
        "Only a shorter delay forever",
        "Only a new variable name",
        "Only more catch blocks",
        "Not every failure is transient; retries require bounded policy and meaningful outcomes.",
        "Unbounded repetition can worsen the failure.",
        "Names do not define policy.",
        "Catch count does not establish safe retries."
      ],
      [
        "A purchase workflow awaits three services and logs one final success. The second commits but the third times out. What is needed?",
        "Partial remote recovery",
        "Assume await made all services atomic",
        "Assume timeout proves no effect",
        "Overwrite all records as successful",
        "Await sequences completion but does not create a distributed transaction or prove remote non-execution.",
        "Atomicity needs an explicit protocol.",
        "A timeout can leave the effect uncertain.",
        "Invented success corrupts state and evidence."
      ]
    ]
  }
]);
