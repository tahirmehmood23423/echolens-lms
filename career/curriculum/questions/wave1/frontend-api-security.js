'use strict';
const {bank}=require('../../learning/wave1/web-helper');
module.exports=bank("frontend-api-security",[
  {
    "comp": "m1.c1",
    "rows": [
      [
        "What does Response.ok summarize?",
        "A status in the 200\u2013299 range",
        "A validated application schema",
        "A server authorization grant",
        "A complete JSON parse",
        "Ok describes successful-range HTTP status, not the payload\u2019s business validity.",
        "A validated application schema does not satisfy the stated requirement. Ok describes successful-range HTTP status, not the payload\u2019s business validity.",
        "A server authorization grant does not satisfy the stated requirement. Ok describes successful-range HTTP status, not the payload\u2019s business validity.",
        "A complete JSON parse does not satisfy the stated requirement. Ok describes successful-range HTTP status, not the payload\u2019s business validity."
      ],
      [
        "Which outcome needs its own UI state?",
        "Successful empty results",
        "Only nonempty results",
        "Only CSS load completion",
        "Only build-time imports",
        "A valid empty response should have deliberate presentation distinct from loading or failure.",
        "Only nonempty results does not satisfy the stated requirement. A valid empty response should have deliberate presentation distinct from loading or failure.",
        "Only CSS load completion does not satisfy the stated requirement. A valid empty response should have deliberate presentation distinct from loading or failure.",
        "Only build-time imports does not satisfy the stated requirement. A valid empty response should have deliberate presentation distinct from loading or failure."
      ],
      [
        "What does a type assertion do to received JSON?",
        "It does not validate runtime shape",
        "It validates only top-level fields",
        "It coerces every field to its type",
        "It rejects unexpected object keys",
        "Static assertions do not inspect or reject actual incoming data.",
        "A type assertion performs no runtime field checks, including top-level checks.",
        "An assertion does not coerce received JSON values.",
        "Unexpected keys remain unless explicit runtime validation rejects them."
      ],
      [
        "A search request resolves with 403 and JSON explaining forbidden access. What should happen before rendering results?",
        "Apply the error-status policy",
        "Render it as an empty search",
        "Treat JSON validity as permission",
        "Retry without credentials forever",
        "Valid JSON does not turn a forbidden HTTP response into successful result data.",
        "Render it as an empty search does not satisfy the stated requirement. Valid JSON does not turn a forbidden HTTP response into successful result data.",
        "Treat JSON validity as permission does not satisfy the stated requirement. Valid JSON does not turn a forbidden HTTP response into successful result data.",
        "Retry without credentials forever does not satisfy the stated requirement. Valid JSON does not turn a forbidden HTTP response into successful result data."
      ],
      [
        "A service returns 200 with a string instead of the agreed list. Which safeguard catches this?",
        "Runtime response validation",
        "Only response.ok",
        "Only a compile-time interface",
        "Only a loading spinner",
        "Status checking and data-shape validation establish different evidence.",
        "Only response.ok does not satisfy the stated requirement. Status checking and data-shape validation establish different evidence.",
        "Only a compile-time interface does not satisfy the stated requirement. Status checking and data-shape validation establish different evidence.",
        "Only a loading spinner does not satisfy the stated requirement. Status checking and data-shape validation establish different evidence."
      ],
      [
        "A screen conflates never-loaded and loaded-empty states. Which transition needs explicit representation?",
        "Successful resolution with no items",
        "A request still waiting for a response",
        "A rejected request with no cached data",
        "A refresh keeping an older result list",
        "The UI must know when loading has actually succeeded even without records.",
        "Pending is distinct from a successfully completed empty result.",
        "A rejected request is an error rather than a successful empty response.",
        "A stale refresh result does not represent the first successful empty load."
      ],
      [
        "A caller checks ok and then json() rejects. Which recovery design is sound?",
        "Handle parsing failure explicitly",
        "Mark the data confirmed empty",
        "Ignore it because status succeeded",
        "Assume the browser is offline",
        "Body parse failure is a separate contract failure and should not fabricate data.",
        "Mark the data confirmed empty does not satisfy the stated requirement. Body parse failure is a separate contract failure and should not fabricate data.",
        "Ignore it because status succeeded does not satisfy the stated requirement. Body parse failure is a separate contract failure and should not fabricate data.",
        "Assume the browser is offline does not satisfy the stated requirement. Body parse failure is a separate contract failure and should not fabricate data."
      ],
      [
        "A dashboard logs the full rejected response including private account details. What should change?",
        "Sanitize diagnostic payloads",
        "Expose the same payload to users",
        "Disable all request identifiers",
        "Store credentials in error text",
        "Useful diagnostics should avoid copying secrets and unnecessary personal data.",
        "Expose the same payload to users does not satisfy the stated requirement. Useful diagnostics should avoid copying secrets and unnecessary personal data.",
        "Disable all request identifiers does not satisfy the stated requirement. Useful diagnostics should avoid copying secrets and unnecessary personal data.",
        "Store credentials in error text does not satisfy the stated requirement. Useful diagnostics should avoid copying secrets and unnecessary personal data."
      ],
      [
        "A product keeps old invoices after a refresh error. What prevents misleading users?",
        "Show freshness and recovery context",
        "Silently label old values current",
        "Clear every historical invoice",
        "Retry writes on every repaint",
        "Retained data needs explicit freshness and recoverable failure communication.",
        "Silently label old values current does not satisfy the stated requirement. Retained data needs explicit freshness and recoverable failure communication.",
        "Clear every historical invoice does not satisfy the stated requirement. Retained data needs explicit freshness and recoverable failure communication.",
        "Retry writes on every repaint does not satisfy the stated requirement. Retained data needs explicit freshness and recoverable failure communication."
      ],
      [
        "A team claims its classifier proves API reliability. Which evidence is still missing?",
        "Real status and malformed-body tests",
        "Only successful response-body fixtures",
        "Only a static TypeScript compilation",
        "Only the model's expected label output",
        "A local classifier cannot establish transport, parsing and actual UI integration behavior.",
        "Success-only fixtures omit rejected statuses and malformed bodies.",
        "Static types do not validate real HTTP status and parsing behavior.",
        "The classifier's own output does not exercise a browser or API failure boundary."
      ]
    ]
  },
  {
    "comp": "m1.c1",
    "rows": [
      [
        "What can an idempotency key identify?",
        "One logical write operation",
        "Every user\u2019s permanent password",
        "A CSS component class",
        "The browser\u2019s viewport size",
        "An agreed server contract can use the key to deduplicate one logical operation.",
        "Every user\u2019s permanent password does not satisfy the stated requirement. An agreed server contract can use the key to deduplicate one logical operation.",
        "A CSS component class does not satisfy the stated requirement. An agreed server contract can use the key to deduplicate one logical operation.",
        "The browser\u2019s viewport size does not satisfy the stated requirement. An agreed server contract can use the key to deduplicate one logical operation."
      ],
      [
        "Which retry pattern increases delay across attempts?",
        "Exponential backoff",
        "Continuous busy looping",
        "Unbounded instant recursion",
        "Random payload mutation",
        "Backoff increases waiting time while jitter can spread client attempts.",
        "Continuous busy looping does not satisfy the stated requirement. Backoff increases waiting time while jitter can spread client attempts.",
        "Unbounded instant recursion does not satisfy the stated requirement. Backoff increases waiting time while jitter can spread client attempts.",
        "Random payload mutation does not satisfy the stated requirement. Backoff increases waiting time while jitter can spread client attempts."
      ],
      [
        "Is every POST automatically safe to repeat?",
        "No, the operation contract matters",
        "Yes, POST bodies uniquely identify writes",
        "Yes, a timeout proves no write occurred",
        "Yes, HTTP clients deduplicate by default",
        "POST can apply non-idempotent effects and uncertainty requires an explicit recovery design.",
        "Identical bodies do not automatically identify one logical operation.",
        "A timeout can occur after the server commits the write.",
        "HTTP clients do not universally deduplicate repeated POST operations."
      ],
      [
        "An order POST returns no response, and the server may have created the order. Which recovery best protects correctness?",
        "Check its logical operation status",
        "Create a new id for every retry",
        "Assume failure and place twice",
        "Hide every previous order",
        "The same logical operation should be reconciled rather than multiplied.",
        "Create a new id for every retry does not satisfy the stated requirement. The same logical operation should be reconciled rather than multiplied.",
        "Assume failure and place twice does not satisfy the stated requirement. The same logical operation should be reconciled rather than multiplied.",
        "Hide every previous order does not satisfy the stated requirement. The same logical operation should be reconciled rather than multiplied."
      ],
      [
        "A stock read gets transient 503 responses. Which retry design is defensible?",
        "Capped backoff with cancellation",
        "Infinite immediate retries",
        "Silent retries after page exit",
        "Retrying with random credentials",
        "Bounded retries can recover temporary reads without uncontrolled load.",
        "Infinite immediate retries does not satisfy the stated requirement. Bounded retries can recover temporary reads without uncontrolled load.",
        "Silent retries after page exit does not satisfy the stated requirement. Bounded retries can recover temporary reads without uncontrolled load.",
        "Retrying with random credentials does not satisfy the stated requirement. Bounded retries can recover temporary reads without uncontrolled load."
      ],
      [
        "Thousands of clients retry after exactly one second. What change reduces the coordinated burst?",
        "Jitter the bounded delay",
        "Increase all requests equally",
        "Force every tab to reload",
        "Disable status-based handling",
        "Randomized timing can spread the same population across a delay interval.",
        "Increase all requests equally does not satisfy the stated requirement. Randomized timing can spread the same population across a delay interval.",
        "Force every tab to reload does not satisfy the stated requirement. Randomized timing can spread the same population across a delay interval.",
        "Disable status-based handling does not satisfy the stated requirement. Randomized timing can spread the same population across a delay interval."
      ],
      [
        "A token expired and API returns 401. What should supersede generic read retry?",
        "Session recovery policy",
        "Retrying the same expired token",
        "Treating it as empty data",
        "Doubling the result page size",
        "Expired credentials need controlled authentication recovery rather than unchanged retries.",
        "Retrying the same expired token does not satisfy the stated requirement. Expired credentials need controlled authentication recovery rather than unchanged retries.",
        "Treating it as empty data does not satisfy the stated requirement. Expired credentials need controlled authentication recovery rather than unchanged retries.",
        "Doubling the result page size does not satisfy the stated requirement. Expired credentials need controlled authentication recovery rather than unchanged retries."
      ],
      [
        "A caller reuses an idempotency key for a different purchase payload. What must the contract address?",
        "Key scope and payload consistency",
        "Only matching the purchase endpoint URL",
        "Only using a new key after each timeout",
        "Only keeping the key in browser memory",
        "Servers must define key ownership, retention and payload mismatch behavior.",
        "One endpoint can accept many different operations, so its URL is not enough.",
        "A fresh key can identify a second purchase rather than a retry of the first.",
        "Storage location does not establish server key scope or payload-consistency checks."
      ],
      [
        "A support UI retries after the user leaves the screen. Which control is missing?",
        "Cancellation and request ownership",
        "Only increasing the request timeout",
        "Only disabling the departure animation",
        "Only caching the next successful result",
        "Work should respect the lifetime and ownership of the initiating interaction.",
        "A longer timeout lets abandoned work continue for longer.",
        "Departure animation does not cancel or disown network callbacks.",
        "Caching a later result does not stop obsolete retries or updates."
      ],
      [
        "A load test shows retries worsen an outage. Which design change addresses feedback amplification?",
        "Reduce bounded retry pressure",
        "Remove every response status",
        "Retry writes without identity",
        "Increase every retry count",
        "Retry budgets and backoff should reduce additional load during degradation.",
        "Remove every response status does not satisfy the stated requirement. Retry budgets and backoff should reduce additional load during degradation.",
        "Retry writes without identity does not satisfy the stated requirement. Retry budgets and backoff should reduce additional load during degradation.",
        "Increase every retry count does not satisfy the stated requirement. Retry budgets and backoff should reduce additional load during degradation."
      ]
    ]
  },
  {
    "comp": "m1.c2",
    "rows": [
      [
        "Which order is unsafe to assume for asynchronous responses?",
        "Initiation equals completion order",
        "Each request has a distinct start time",
        "A response may complete out of order",
        "The same URL can have concurrent calls",
        "Independent asynchronous work can finish in a different order than it started.",
        "A start time can be recorded without any assumption about completion order.",
        "Out-of-order completion is possible and is the reason ownership checks are needed.",
        "Concurrent same-URL calls are possible and do not imply ordered completion."
      ],
      [
        "What should a response retain for safe ownership checks?",
        "Its initiating context",
        "Only the array\u2019s final length",
        "Only the current CSS theme",
        "Only the last route title",
        "The response must be associated with the query or account that created it.",
        "Only the array\u2019s final length does not satisfy the stated requirement. The response must be associated with the query or account that created it.",
        "Only the current CSS theme does not satisfy the stated requirement. The response must be associated with the query or account that created it.",
        "Only the last route title does not satisfy the stated requirement. The response must be associated with the query or account that created it."
      ],
      [
        "What does a disabled presentation alone fail to guarantee?",
        "Handler-level duplicate prevention",
        "A visible disabled appearance change",
        "The disabled attribute in saved markup",
        "A screenshot showing the pending style",
        "Visual styling is not an enforced request-state guard.",
        "Visible styling does not guarantee the handler rejects duplicate invocation.",
        "Saved disabled markup does not test all live invocation paths.",
        "A screenshot cannot prove handler-level protection under rapid repeated events."
      ],
      [
        "A search uses one global loading boolean for overlapping requests. What ambiguity results?",
        "An old completion can clear new loading",
        "A loading flag serializes all requests",
        "The last-started request always ends last",
        "All earlier request handlers are removed",
        "Request ownership must apply to pending-state updates as well as successful data.",
        "A boolean flag does not serialize independent network operations.",
        "The last-started request can complete before an older one.",
        "Setting one loading flag does not remove earlier asynchronous handlers."
      ],
      [
        "A request is aborted after the server committed an order. What should recovery preserve?",
        "The uncertain server outcome",
        "A guarantee the order vanished",
        "A mandatory duplicate purchase",
        "An assumption of empty history",
        "Cancellation does not undo server-side effects, so reconcile the logical operation.",
        "A guarantee the order vanished does not satisfy the stated requirement. Cancellation does not undo server-side effects, so reconcile the logical operation.",
        "A mandatory duplicate purchase does not satisfy the stated requirement. Cancellation does not undo server-side effects, so reconcile the logical operation.",
        "An assumption of empty history does not satisfy the stated requirement. Cancellation does not undo server-side effects, so reconcile the logical operation."
      ],
      [
        "A stale error arrives after newer success. What should its handler do?",
        "Reject the outdated state update",
        "Replace success with old failure",
        "Clear the current account data",
        "Retry all previous generations",
        "Error transitions also need ownership checks to avoid corrupting the current view.",
        "Replace success with old failure does not satisfy the stated requirement. Error transitions also need ownership checks to avoid corrupting the current view.",
        "Clear the current account data does not satisfy the stated requirement. Error transitions also need ownership checks to avoid corrupting the current view.",
        "Retry all previous generations does not satisfy the stated requirement. Error transitions also need ownership checks to avoid corrupting the current view."
      ],
      [
        "A handler checks pending only after awaiting fetch. What is wrong with duplicate protection?",
        "The guard is applied too late",
        "The status check is too strict",
        "The JSON body is too small",
        "The account name is too long",
        "The pending boundary should be set synchronously before yielding to overlapping interactions.",
        "The status check is too strict does not satisfy the stated requirement. The pending boundary should be set synchronously before yielding to overlapping interactions.",
        "The JSON body is too small does not satisfy the stated requirement. The pending boundary should be set synchronously before yielding to overlapping interactions.",
        "The account name is too long does not satisfy the stated requirement. The pending boundary should be set synchronously before yielding to overlapping interactions."
      ],
      [
        "A team aborts old searches but still sees stale parsed data commit. What strengthens the design?",
        "A commit-time ownership check",
        "Only aborting before body parsing starts",
        "Only retaining the most recent URL text",
        "Only clearing results before each call",
        "Cancellation and state-commit ownership complement each other across asynchronous boundaries.",
        "An abort can arrive after parsing or callbacks have advanced.",
        "The same URL can serve successive intents, so URL text is insufficient ownership evidence.",
        "Clearing before sending does not stop an older completion from committing later."
      ],
      [
        "A screen changes tenants while retaining the same URL pattern. Which ownership key must account for that?",
        "Tenant and request context",
        "Only the URL pathname text",
        "Only the HTTP method",
        "Only the browser\u2019s font size",
        "Identical route shapes do not imply identical authorized data ownership.",
        "Only the URL pathname text does not satisfy the stated requirement. Identical route shapes do not imply identical authorized data ownership.",
        "Only the HTTP method does not satisfy the stated requirement. Identical route shapes do not imply identical authorized data ownership.",
        "Only the browser\u2019s font size does not satisfy the stated requirement. Identical route shapes do not imply identical authorized data ownership."
      ],
      [
        "A race test uses immediate fixed responses and always passes. What missing test is most revealing?",
        "Controlled out-of-order completion",
        "Only another immediate success response",
        "Only a second identical response payload",
        "Only a higher request timeout constant",
        "Deliberate completion inversion directly tests stale-result handling.",
        "Immediate ordered success avoids the race that ownership checks must handle.",
        "An identical payload can hide an obsolete state update.",
        "A larger timeout does not deliberately reverse completion order."
      ]
    ]
  },
  {
    "comp": "m2.c1",
    "rows": [
      [
        "What does SameSite influence?",
        "Cross-site cookie sending",
        "JSON schema validation",
        "Password entropy measurement",
        "JavaScript lexical scope",
        "SameSite affects when cookies accompany cross-site requests.",
        "JSON schema validation does not satisfy the stated requirement. SameSite affects when cookies accompany cross-site requests.",
        "Password entropy measurement does not satisfy the stated requirement. SameSite affects when cookies accompany cross-site requests.",
        "JavaScript lexical scope does not satisfy the stated requirement. SameSite affects when cookies accompany cross-site requests."
      ],
      [
        "Does HttpOnly eliminate XSS impact?",
        "No, active script remains dangerous",
        "Yes, all scripts become inert",
        "Yes, server rules are unnecessary",
        "Only when a cookie has a name",
        "Malicious script can still act in the origin even without reading the cookie directly.",
        "Yes, all scripts become inert does not satisfy the stated requirement. Malicious script can still act in the origin even without reading the cookie directly.",
        "Yes, server rules are unnecessary does not satisfy the stated requirement. Malicious script can still act in the origin even without reading the cookie directly.",
        "Only when a cookie has a name does not satisfy the stated requirement. Malicious script can still act in the origin even without reading the cookie directly."
      ],
      [
        "Why are bearer tokens sensitive?",
        "A holder may exercise their authority",
        "They are bound to one browser by default",
        "They prove every requested resource owner",
        "They become harmless once URL-encoded",
        "Possession can be sufficient to use the represented access within its scope.",
        "Bearer credentials are not inherently bound to one browser.",
        "Possession does not replace resource-specific permission checks.",
        "Encoding changes representation without removing the token's authority."
      ],
      [
        "A session cookie has Secure but no HttpOnly. Which claim is unsupported?",
        "Same-origin scripts cannot read it",
        "Secure transport is requested",
        "Cookie scope still matters",
        "Server expiration still matters",
        "Secure and HttpOnly address different exposure surfaces.",
        "Secure transport is requested does not satisfy the stated requirement. Secure and HttpOnly address different exposure surfaces.",
        "Cookie scope still matters does not satisfy the stated requirement. Secure and HttpOnly address different exposure surfaces.",
        "Server expiration still matters does not satisfy the stated requirement. Secure and HttpOnly address different exposure surfaces."
      ],
      [
        "A token is kept only in memory. Which risk remains under active XSS?",
        "Script compromise of active authority",
        "A guarantee that no script can use it",
        "Only persistence after the browser exits",
        "Automatic protection from forged writes",
        "In-memory storage reduces some persistence but cannot make active script compromise harmless.",
        "In-memory storage does not stop an active origin script from using current authority.",
        "Avoiding disk persistence leaves active-session compromise possible.",
        "Storage location alone does not establish a complete request-forgery defense."
      ],
      [
        "A cross-origin request includes cookies but the server uses wildcard allowed origin with credentials. What needs correction?",
        "A specific compatible allowed origin",
        "An allowed-origin list containing a star",
        "Only Access-Control-Allow-Headers:*",
        "Only a longer Access-Control-Max-Age",
        "Credentialed CORS does not accept wildcard origin in place of an explicit allowed origin.",
        "A wildcard allowed origin is incompatible with credentialed response sharing.",
        "Allowed headers do not replace the required compatible allowed-origin response.",
        "Preflight lifetime does not repair the credentialed-origin mismatch."
      ],
      [
        "A cookie session logs out only by hiding UI controls. What must the server also do?",
        "Invalidate the session authority",
        "Only clear the component's user object",
        "Only remove the account navigation link",
        "Only redirect to a public landing page",
        "Session termination must revoke or expire the server-recognized credential state.",
        "Clearing a local user object leaves a reusable server session potentially active.",
        "Removing navigation changes presentation rather than session authority.",
        "A redirect alone does not invalidate the server credential."
      ],
      [
        "An API accepts a client isAdmin flag alongside a valid session. What should establish permission?",
        "Server actor-resource authorization",
        "The signed-in client's isAdmin boolean",
        "The presence of an admin route component",
        "The requested resource owner's URL value",
        "Authentication identifies authority but each protected action still needs server permission checks.",
        "Client-supplied role flags can be modified by the caller.",
        "A visible admin component is not server authorization evidence.",
        "A caller-controlled owner value must be checked against the authenticated actor."
      ],
      [
        "A company chooses cookies to reduce direct token extraction. What additional write protection remains relevant?",
        "A deliberate CSRF defense",
        "Only a new CSS reset",
        "Only source map hiding",
        "Only filename hashing",
        "Automatically sent cookie credentials need state-changing request protection appropriate to the architecture.",
        "Only a new CSS reset does not satisfy the stated requirement. Automatically sent cookie credentials need state-changing request protection appropriate to the architecture.",
        "Only source map hiding does not satisfy the stated requirement. Automatically sent cookie credentials need state-changing request protection appropriate to the architecture.",
        "Only filename hashing does not satisfy the stated requirement. Automatically sent cookie credentials need state-changing request protection appropriate to the architecture."
      ],
      [
        "A storage decision review compares only page reload convenience. What is missing?",
        "Threat and renewal tradeoffs",
        "Only the token variable\u2019s case",
        "Only the API\u2019s marketing name",
        "Only the number of imports",
        "Credential placement must consider script exposure, persistence, renewal and server control.",
        "Only the token variable\u2019s case does not satisfy the stated requirement. Credential placement must consider script exposure, persistence, renewal and server control.",
        "Only the API\u2019s marketing name does not satisfy the stated requirement. Credential placement must consider script exposure, persistence, renewal and server control.",
        "Only the number of imports does not satisfy the stated requirement. Credential placement must consider script exposure, persistence, renewal and server control."
      ]
    ]
  },
  {
    "comp": "m2.c2",
    "rows": [
      [
        "Can users bypass a client route guard to call an API?",
        "Yes, server checks remain required",
        "No, hiding routes blocks direct API calls",
        "No, built JavaScript cannot be modified",
        "Yes, but a valid JSON body grants access",
        "Client presentation logic is not a trustworthy server enforcement boundary.",
        "A direct caller can bypass route presentation entirely.",
        "Delivered JavaScript can be inspected or bypassed by the client.",
        "Valid JSON is a data-format property rather than an authorization grant."
      ],
      [
        "What does an authenticated 403 commonly mean?",
        "The action is forbidden",
        "The response is always empty",
        "The session necessarily never existed",
        "The network necessarily failed",
        "403 commonly represents denied permission under the endpoint contract.",
        "The response is always empty does not satisfy the stated requirement. 403 commonly represents denied permission under the endpoint contract.",
        "The session necessarily never existed does not satisfy the stated requirement. 403 commonly represents denied permission under the endpoint contract.",
        "The network necessarily failed does not satisfy the stated requirement. 403 commonly represents denied permission under the endpoint contract."
      ],
      [
        "What must terminate a refresh failure?",
        "The bounded recovery loop",
        "All server access logs",
        "Every CSS animation",
        "The page\u2019s heading hierarchy",
        "Failure should lead to a clear recoverable signed-out state instead of endless renewal.",
        "All server access logs does not satisfy the stated requirement. Failure should lead to a clear recoverable signed-out state instead of endless renewal.",
        "Every CSS animation does not satisfy the stated requirement. Failure should lead to a clear recoverable signed-out state instead of endless renewal.",
        "The page\u2019s heading hierarchy does not satisfy the stated requirement. Failure should lead to a clear recoverable signed-out state instead of endless renewal."
      ],
      [
        "A session refresh succeeds but a queued payment POST may already have run. Which replay policy is safest?",
        "Follow the write idempotency contract",
        "Blindly replay every request",
        "Replace the account id locally",
        "Assume refresh rolled back payment",
        "Authentication recovery does not resolve uncertain write effects.",
        "Blindly replay every request does not satisfy the stated requirement. Authentication recovery does not resolve uncertain write effects.",
        "Replace the account id locally does not satisfy the stated requirement. Authentication recovery does not resolve uncertain write effects.",
        "Assume refresh rolled back payment does not satisfy the stated requirement. Authentication recovery does not resolve uncertain write effects."
      ],
      [
        "A user logs out on a shared device. Which client data requires ownership review?",
        "Private caches and retained drafts",
        "Only the generic public help content",
        "Only the shared application stylesheet",
        "Only the public content-hashed logo file",
        "Sensitive state should not leak across subsequent identities on the device.",
        "Generic public help normally has no account-specific ownership to clear.",
        "A shared stylesheet is public presentation rather than retained private state.",
        "A public logo does not contain the user's cached records or drafts."
      ],
      [
        "An API validates a session but omits object ownership checks. What remains vulnerable?",
        "Cross-account resource access",
        "Only the session cookie's transport flag",
        "Only the response content type spelling",
        "Only the application's route animation",
        "Authentication alone does not establish permission for a particular resource.",
        "A Secure cookie does not establish ownership of the requested object.",
        "A content type does not prevent one account requesting another's resource.",
        "Route animation is unrelated to server object authorization."
      ],
      [
        "A route flashes private cached content before redirecting after expiry. What needs redesign?",
        "The initial state and cache boundary",
        "Only hiding the expired route's menu link",
        "Only redirecting after the first render",
        "Only increasing the session TTL locally",
        "Client recovery should avoid exposing stale private state during transitions.",
        "A hidden menu does not stop initial private cache rendering.",
        "A redirect after rendering can expose data before access recovery completes.",
        "A locally extended TTL cannot establish valid server authority or safe cache ownership."
      ],
      [
        "A refresh endpoint repeatedly returns 401 and the interceptor retries itself. What control is needed?",
        "Exclude and bound renewal recursion",
        "Use a new retry counter on every refresh",
        "Treat the refresh 401 as another refresh",
        "Keep retrying until one request succeeds",
        "Renewal logic must avoid intercepting itself into an infinite loop.",
        "Resetting the counter on every refresh makes the overall loop unbounded.",
        "Refreshing again on the refresh endpoint's own rejection creates recursion.",
        "Waiting indefinitely can exhaust resources without recovering the session."
      ],
      [
        "An account switch retains a same-named document draft. What decides safe reuse?",
        "Explicit owner and retention policy",
        "Only matching the saved document title",
        "Only using the same document route URL",
        "Only the draft's last-modified timestamp",
        "Names are not sufficient evidence that a draft belongs to the new actor.",
        "Two accounts can have documents with the same title.",
        "A route pathname can be reused across different owners.",
        "Modification time does not establish who may access a retained draft."
      ],
      [
        "A review says route tests prove API access control. Which test is still necessary?",
        "Direct unauthorized API requests",
        "Only a second redirect screenshot",
        "Only a shorter login URL",
        "Only another client prop check",
        "Server access control must be tested independently of the navigation path.",
        "Only a second redirect screenshot does not satisfy the stated requirement. Server access control must be tested independently of the navigation path.",
        "Only a shorter login URL does not satisfy the stated requirement. Server access control must be tested independently of the navigation path.",
        "Only another client prop check does not satisfy the stated requirement. Server access control must be tested independently of the navigation path."
      ]
    ]
  },
  {
    "comp": "m2.c1",
    "rows": [
      [
        "What can a different port change?",
        "The origin",
        "Only the URL fragment",
        "Only the document language",
        "Only the image aspect ratio",
        "Port participates in the origin tuple.",
        "Only the URL fragment does not satisfy the stated requirement. Port participates in the origin tuple.",
        "Only the document language does not satisfy the stated requirement. Port participates in the origin tuple.",
        "Only the image aspect ratio does not satisfy the stated requirement. Port participates in the origin tuple."
      ],
      [
        "What does CORS primarily govern for browser scripts?",
        "Cross-origin response access",
        "Every server permission rule",
        "All cross-site request sending",
        "All network encryption",
        "CORS controls browser script access under the cross-origin policy rather than replacing server security.",
        "Every server permission rule does not satisfy the stated requirement. CORS controls browser script access under the cross-origin policy rather than replacing server security.",
        "All cross-site request sending does not satisfy the stated requirement. CORS controls browser script access under the cross-origin policy rather than replacing server security.",
        "All network encryption does not satisfy the stated requirement. CORS controls browser script access under the cross-origin policy rather than replacing server security."
      ],
      [
        "What does credentials:\"include\" fail to guarantee?",
        "That every cookie will be sent",
        "That inclusion was requested",
        "That the option is explicit",
        "That policy still applies",
        "Cookie scope, SameSite and browser restrictions can still prevent transmission.",
        "That inclusion was requested does not satisfy the stated requirement. Cookie scope, SameSite and browser restrictions can still prevent transmission.",
        "That the option is explicit does not satisfy the stated requirement. Cookie scope, SameSite and browser restrictions can still prevent transmission.",
        "That policy still applies does not satisfy the stated requirement. Cookie scope, SameSite and browser restrictions can still prevent transmission."
      ],
      [
        "A sibling API call includes credentials yet the cookie is absent. What should be inspected?",
        "Cookie scope and browser policy",
        "Only the button\u2019s tab order",
        "Only the response array length",
        "Only the screen resolution",
        "Credentials mode is only one condition in cookie inclusion.",
        "Only the button\u2019s tab order does not satisfy the stated requirement. Credentials mode is only one condition in cookie inclusion.",
        "Only the response array length does not satisfy the stated requirement. Credentials mode is only one condition in cookie inclusion.",
        "Only the screen resolution does not satisfy the stated requirement. Credentials mode is only one condition in cookie inclusion."
      ],
      [
        "A server reflects any Origin and permits credentials. What is the architectural defect?",
        "Unrestricted credentialed origin trust",
        "Only an unnecessarily long origin string",
        "Only the number of supported HTTP verbs",
        "Only the endpoint's response compression",
        "Arbitrary credentialed origins can expose protected responses to untrusted pages.",
        "The flaw is accepting untrusted origins with credentials, regardless of string length.",
        "Allowed verbs do not restrict which origins gain credentialed access.",
        "Compression does not create or repair an origin trust boundary."
      ],
      [
        "An origin-specific CORS response is cached without variation. Which header can help correct cache separation?",
        "Vary:Origin",
        "Content-Length:Origin",
        "Accept:Cookie",
        "Location:Origin",
        "Vary communicates that response selection depends on the request\u2019s Origin header.",
        "Content-Length:Origin does not satisfy the stated requirement. Vary communicates that response selection depends on the request\u2019s Origin header.",
        "Accept:Cookie does not satisfy the stated requirement. Vary communicates that response selection depends on the request\u2019s Origin header.",
        "Location:Origin does not satisfy the stated requirement. Vary communicates that response selection depends on the request\u2019s Origin header."
      ],
      [
        "A developer uses no-cors to bypass a JSON access error. What outcome should be expected for the script?",
        "An opaque unreadable response",
        "A fully readable JSON response",
        "Automatic credential approval",
        "Automatic server authorization",
        "No-cors restricts requests and produces an opaque response rather than granting arbitrary read access.",
        "A fully readable JSON response does not satisfy the stated requirement. No-cors restricts requests and produces an opaque response rather than granting arbitrary read access.",
        "Automatic credential approval does not satisfy the stated requirement. No-cors restricts requests and produces an opaque response rather than granting arbitrary read access.",
        "Automatic server authorization does not satisfy the stated requirement. No-cors restricts requests and produces an opaque response rather than granting arbitrary read access."
      ],
      [
        "A preflight allows a header, but the actual response lacks compatible CORS headers. What can happen?",
        "Browser script access is blocked",
        "The user is automatically admin",
        "The JSON becomes a CSS file",
        "The server always rolls back work",
        "The actual response also participates in CORS checks, and server effects may still have occurred.",
        "The user is automatically admin does not satisfy the stated requirement. The actual response also participates in CORS checks, and server effects may still have occurred.",
        "The JSON becomes a CSS file does not satisfy the stated requirement. The actual response also participates in CORS checks, and server effects may still have occurred.",
        "The server always rolls back work does not satisfy the stated requirement. The actual response also participates in CORS checks, and server effects may still have occurred."
      ],
      [
        "A protected endpoint is called by a nonbrowser client. What must protect the data?",
        "Server authentication and permissions",
        "Only a compatible credentialed CORS rule",
        "Only the browser's preflight acceptance",
        "Only a trusted-looking Origin header",
        "Nonbrowser callers are not confined by browser CORS enforcement.",
        "Nonbrowser callers are not constrained by browser CORS response access rules.",
        "A nonbrowser client does not need a successful browser preflight.",
        "An Origin header can be supplied by a nonbrowser caller and is not authentication."
      ],
      [
        "A debugging note equates same-site with same-origin. What should replace it?",
        "Separate site and origin analysis",
        "Treat all sibling hosts as one origin",
        "Treat different ports as different sites",
        "Assume all cross-origin calls are cross-site",
        "Cookie site boundaries and origin tuples solve different policy questions.",
        "Sibling hosts can be same-site while remaining different origins.",
        "Ports distinguish origins but do not by themselves define distinct sites.",
        "Same-site sibling services can still be cross-origin."
      ]
    ]
  },
  {
    "comp": "m3.c1",
    "rows": [
      [
        "What trust boundary does XSS cross?",
        "Untrusted content becomes origin code",
        "An invalid JSON body becomes a parse error",
        "A foreign origin reads an allowed response",
        "A cookie follows its declared path scope",
        "Attacker-controlled content executes with the page origin’s authority.",
        "A JSON parse failure does not execute attacker content as origin code.",
        "Permitted cross-origin response access is a CORS relationship rather than XSS itself.",
        "Cookie path matching does not turn content into executable origin code."
      ],
      [
        "Which input should remain text in a plain message view?",
        "Markup-looking customer content",
        "Only strings without brackets",
        "Only locally typed content",
        "Only content under ten letters",
        "A plain-text contract should not reinterpret customer input as HTML.",
        "Only strings without brackets does not satisfy the stated requirement. A plain-text contract should not reinterpret customer input as HTML.",
        "Only locally typed content does not satisfy the stated requirement. A plain-text contract should not reinterpret customer input as HTML.",
        "Only content under ten letters does not satisfy the stated requirement. A plain-text contract should not reinterpret customer input as HTML."
      ],
      [
        "Why is regex removal of script tags insufficient?",
        "HTML has other execution paths",
        "Only external script URLs are dangerous",
        "HTML entity decoding removes all handlers",
        "Event attributes are inert without script tags",
        "Attack paths include attributes and URL contexts beyond the filtered literal pattern.",
        "Inline event handlers and dangerous URL contexts can execute without external script tags.",
        "Entity handling does not automatically strip executable attributes.",
        "Event attributes can be executable without a script element."
      ],
      [
        "A sanitized string is later concatenated into JavaScript source. What mistake has occurred?",
        "A new unsafe output context",
        "A guaranteed safe reuse",
        "An automatic permission grant",
        "A complete encoding upgrade",
        "Sanitization for HTML does not establish safety inside generated JavaScript.",
        "A guaranteed safe reuse does not satisfy the stated requirement. Sanitization for HTML does not establish safety inside generated JavaScript.",
        "An automatic permission grant does not satisfy the stated requirement. Sanitization for HTML does not establish safety inside generated JavaScript.",
        "A complete encoding upgrade does not satisfy the stated requirement. Sanitization for HTML does not establish safety inside generated JavaScript."
      ],
      [
        "A review sees textContent replaced with innerHTML to support line breaks. What is a safer plain-text design?",
        "Keep text and style whitespace",
        "Execute the text first",
        "Strip only closing tags",
        "Trust the first message only",
        "Whitespace styling can preserve presentation without turning content into markup.",
        "Execute the text first does not satisfy the stated requirement. Whitespace styling can preserve presentation without turning content into markup.",
        "Strip only closing tags does not satisfy the stated requirement. Whitespace styling can preserve presentation without turning content into markup.",
        "Trust the first message only does not satisfy the stated requirement. Whitespace styling can preserve presentation without turning content into markup."
      ],
      [
        "A developer relies on CSP while retaining raw untrusted HTML. What should change?",
        "Repair the unsafe sink too",
        "Remove all server validation",
        "Permit every inline script",
        "Assume CSP is authorization",
        "CSP is defense in depth and does not make unsafe content insertion acceptable.",
        "Remove all server validation does not satisfy the stated requirement. CSP is defense in depth and does not make unsafe content insertion acceptable.",
        "Permit every inline script does not satisfy the stated requirement. CSP is defense in depth and does not make unsafe content insertion acceptable.",
        "Assume CSP is authorization does not satisfy the stated requirement. CSP is defense in depth and does not make unsafe content insertion acceptable."
      ],
      [
        "A file-upload preview accepts arbitrary link schemes. What is missing?",
        "A scheme and destination policy",
        "Only a larger preview box",
        "Only a shorter file name",
        "Only additional CSS animations",
        "Navigation targets need a context-specific allow policy.",
        "Only a larger preview box does not satisfy the stated requirement. Navigation targets need a context-specific allow policy.",
        "Only a shorter file name does not satisfy the stated requirement. Navigation targets need a context-specific allow policy.",
        "Only additional CSS animations does not satisfy the stated requirement. Navigation targets need a context-specific allow policy."
      ],
      [
        "A third-party script reads page data after an XSS exploit. Which cookie flag alone cannot prevent this?",
        "HttpOnly",
        "An explicit text sink",
        "A restrictive sanitizer policy",
        "A reviewed script allowlist",
        "HttpOnly blocks ordinary cookie reading but not all page-data access by active script.",
        "An explicit text sink does not satisfy the stated requirement. HttpOnly blocks ordinary cookie reading but not all page-data access by active script.",
        "A restrictive sanitizer policy does not satisfy the stated requirement. HttpOnly blocks ordinary cookie reading but not all page-data access by active script.",
        "A reviewed script allowlist does not satisfy the stated requirement. HttpOnly blocks ordinary cookie reading but not all page-data access by active script."
      ],
      [
        "A sanitizer’s output is modified by another library. What should security review verify?",
        "Safety after the full transformation",
        "Only the initial sanitized HTML string",
        "Only whether the original parser succeeded",
        "Only the sanitizer's default configuration",
        "Subsequent transformations can invalidate assumptions about sanitized content.",
        "An initially safe string may become unsafe after later rewriting.",
        "Successful parsing alone does not establish safe final output.",
        "Defaults do not prove that subsequent libraries preserve the sanitizer's safety guarantees."
      ],
      [
        "A test escapes < but misses a dangerous href scheme. What coverage gap exists?",
        "Context-specific attack cases",
        "Only additional plain-text angle brackets",
        "Only more valid rich-text examples",
        "Only a larger set of harmless URL paths",
        "Different sinks require tests for their actual interpretation rules.",
        "Text encoding cases do not cover a link destination's scheme policy.",
        "Valid rich-text examples omit adversarial output contexts.",
        "Harmless paths do not test executable or otherwise forbidden URL schemes."
      ]
    ]
  },
  {
    "comp": "m3.c1",
    "rows": [
      [
        "Which HTTP method should avoid state-changing business effects?",
        "GET",
        "POST for intended changes",
        "PATCH for intended updates",
        "DELETE for intended removals",
        "GET is defined with safe semantics and should not perform state changes.",
        "POST for intended changes does not satisfy the stated requirement. GET is defined with safe semantics and should not perform state changes.",
        "PATCH for intended updates does not satisfy the stated requirement. GET is defined with safe semantics and should not perform state changes.",
        "DELETE for intended removals does not satisfy the stated requirement. GET is defined with safe semantics and should not perform state changes."
      ],
      [
        "What does a server anti-CSRF token check establish?",
        "The required request-token relationship",
        "That every requested object is authorized",
        "That all same-origin scripts are trusted",
        "That every token-shaped string is valid",
        "The token check contributes request authenticity evidence under its design.",
        "A CSRF token relationship does not replace object-level authorization.",
        "A valid request token does not prove all same-origin scripts are safe.",
        "Token shape alone is insufficient; the server must validate the expected relationship."
      ],
      [
        "Can ordinary cross-site forms send requests without granting response reading?",
        "Yes, sending and reading differ",
        "No, CORS blocks every form",
        "Only if CSS is inline",
        "Only if the response is empty",
        "Some requests can be sent while browser scripts remain unable to read their responses.",
        "No, CORS blocks every form does not satisfy the stated requirement. Some requests can be sent while browser scripts remain unable to read their responses.",
        "Only if CSS is inline does not satisfy the stated requirement. Some requests can be sent while browser scripts remain unable to read their responses.",
        "Only if the response is empty does not satisfy the stated requirement. Some requests can be sent while browser scripts remain unable to read their responses."
      ],
      [
        "A transfer API relies only on no Access-Control-Allow-Origin header. What is missing?",
        "A write-request CSRF defense",
        "Only a faster JSON parser",
        "Only a smaller transaction id",
        "Only a client route guard",
        "CORS response restrictions do not replace protection against unwanted credentialed writes.",
        "Only a faster JSON parser does not satisfy the stated requirement. CORS response restrictions do not replace protection against unwanted credentialed writes.",
        "Only a smaller transaction id does not satisfy the stated requirement. CORS response restrictions do not replace protection against unwanted credentialed writes.",
        "Only a client route guard does not satisfy the stated requirement. CORS response restrictions do not replace protection against unwanted credentialed writes."
      ],
      [
        "A CSRF token is stored in a field but never associated with the session. What needs review?",
        "Token validation and binding design",
        "Only the presence of a token input field",
        "Only using a token longer than the user ID",
        "Only hiding the token with display:none",
        "A secure token scheme needs the server’s intended binding and validation rules.",
        "A hidden field's presence does not prove a valid session-bound token check.",
        "Length alone does not establish token validity or binding.",
        "Visual hiding does not change the server's validation semantics."
      ],
      [
        "An application fixes CSRF and then permits raw attacker HTML in the account page. What remains dangerous?",
        "Trusted-origin script execution",
        "Only cross-site image loading",
        "Only the old CSS bundle",
        "Only the number of cookies",
        "XSS can act within the origin and undermine available request protections.",
        "Only cross-site image loading does not satisfy the stated requirement. XSS can act within the origin and undermine available request protections.",
        "Only the old CSS bundle does not satisfy the stated requirement. XSS can act within the origin and undermine available request protections.",
        "Only the number of cookies does not satisfy the stated requirement. XSS can act within the origin and undermine available request protections."
      ],
      [
        "A third-party integration requires cross-site cookies. What should the team assess?",
        "The full credential and CSRF design",
        "Only setting SameSite=None on every cookie",
        "Only adding CORS headers to GET responses",
        "Only moving the integration to a new port",
        "Cross-site credential use requires deliberate layered protections and compatibility checks.",
        "SameSite=None can enable sending but does not provide the complete CSRF defense.",
        "Read-response CORS rules alone do not secure credentialed writes.",
        "A different port changes origin but does not settle site, cookie or CSRF policy."
      ],
      [
        "A server rejects missing tokens but accepts any supplied string. Which test exposes the issue?",
        "An invalid token value case",
        "Only the happy-path valid form",
        "Only a static input screenshot",
        "Only a page refresh test",
        "Presence is different from correctness, so invalid tokens must be rejected.",
        "Only the happy-path valid form does not satisfy the stated requirement. Presence is different from correctness, so invalid tokens must be rejected.",
        "Only a static input screenshot does not satisfy the stated requirement. Presence is different from correctness, so invalid tokens must be rejected.",
        "Only a page refresh test does not satisfy the stated requirement. Presence is different from correctness, so invalid tokens must be rejected."
      ],
      [
        "A route has correct role checks but accepts an unwanted victim request. Which concern remains distinct?",
        "Request forgery protection",
        "Only permission naming",
        "Only heading order",
        "Only image optimization",
        "An authorized actor\u2019s ambient session can be abused through a forged request.",
        "Only permission naming does not satisfy the stated requirement. An authorized actor\u2019s ambient session can be abused through a forged request.",
        "Only heading order does not satisfy the stated requirement. An authorized actor\u2019s ambient session can be abused through a forged request.",
        "Only image optimization does not satisfy the stated requirement. An authorized actor\u2019s ambient session can be abused through a forged request."
      ],
      [
        "A review claims one fixed string equality fixture proves CSRF protection. What is still needed?",
        "Framework lifecycle and adversarial tests",
        "Only another equality test on fixed strings",
        "Only a token-shaped value in static HTML",
        "Only the successful fixture's boolean result",
        "Real protection includes token generation, binding, expiry and request-context behavior.",
        "Another fixed equality fixture omits token generation, expiry, binding and adversarial cases.",
        "Static token markup does not exercise validation or lifecycle behavior.",
        "The fixture's boolean output does not establish deployed framework protection."
      ]
    ]
  },
  {
    "comp": "m3.c2",
    "rows": [
      [
        "What is a CSP nonce used to mark?",
        "An authorized script instance",
        "Every script hosted on the same domain",
        "Every script in an authenticated response",
        "Only scripts with an integrity attribute",
        "A matching nonce can authorize a script under a nonce-based policy.",
        "A nonce authorizes matching script instances rather than every script on a host.",
        "Authentication of the page request does not automatically authorize all included scripts.",
        "Integrity and CSP nonces are distinct controls and neither implies the other's presence."
      ],
      [
        "What is a hash-based script rule tied to?",
        "Specific script content",
        "The user\u2019s display name",
        "The viewport\u2019s height",
        "The endpoint\u2019s row count",
        "A content hash matches the allowed script bytes rather than a general origin label.",
        "The user\u2019s display name does not satisfy the stated requirement. A content hash matches the allowed script bytes rather than a general origin label.",
        "The viewport\u2019s height does not satisfy the stated requirement. A content hash matches the allowed script bytes rather than a general origin label.",
        "The endpoint\u2019s row count does not satisfy the stated requirement. A content hash matches the allowed script bytes rather than a general origin label."
      ],
      [
        "Does an integrity hash prove a library is safe?",
        "No, behavior still needs review",
        "Yes, any hashed code is benign",
        "Only if the file is minified",
        "Only if the file has comments",
        "Integrity establishes expected content, not whether that content should be trusted.",
        "Yes, any hashed code is benign does not satisfy the stated requirement. Integrity establishes expected content, not whether that content should be trusted.",
        "Only if the file is minified does not satisfy the stated requirement. Integrity establishes expected content, not whether that content should be trusted.",
        "Only if the file has comments does not satisfy the stated requirement. Integrity establishes expected content, not whether that content should be trusted."
      ],
      [
        "A report-only rollout records unexpected inline scripts. What is a sound next step?",
        "Review dependencies before enforcement",
        "Enforce immediately without journey checks",
        "Mark report-only as equivalent to blocking",
        "Trust every reported source automatically",
        "Observation should inform a reviewed policy that supports intended flows and constrains unexpected execution.",
        "Immediate enforcement without checking critical flows can break legitimate interactions.",
        "A reporting-only policy does not block the violations it records.",
        "Automatically trusting reported sources defeats the review of which scripts deserve authority."
      ],
      [
        "A third-party widget needs only a narrow message interface. Which architecture can reduce direct page authority?",
        "An appropriately isolated iframe",
        "A normal unrestricted script tag",
        "A permanent public CSP nonce",
        "An inline eval wrapper",
        "A cross-origin sandboxed frame with reviewed messaging can reduce direct embedding-page access.",
        "A normal unrestricted script tag does not satisfy the stated requirement. A cross-origin sandboxed frame with reviewed messaging can reduce direct embedding-page access.",
        "A permanent public CSP nonce does not satisfy the stated requirement. A cross-origin sandboxed frame with reviewed messaging can reduce direct embedding-page access.",
        "An inline eval wrapper does not satisfy the stated requirement. A cross-origin sandboxed frame with reviewed messaging can reduce direct embedding-page access."
      ],
      [
        "A script allowlist trusts an entire host that serves user uploads. What should be questioned?",
        "The host-wide trust boundary",
        "Only whether the host has a TLS certificate",
        "Only whether the URL uses a short path",
        "Only whether the upload is cacheable",
        "Broad trusted hosts may include attacker-controlled executable content.",
        "TLS authenticates transport to a host but does not make user uploads trusted script.",
        "Path brevity does not prove the resource's trust or behavior.",
        "Cacheability does not determine whether user-controlled code can execute."
      ],
      [
        "A CSP report includes sensitive URLs and query values. What should handling minimize?",
        "Unnecessary private diagnostics",
        "Only the number of report files",
        "Only the JSON indentation",
        "Only the timestamp precision",
        "Security telemetry should avoid leaking sensitive data while preserving useful evidence.",
        "Only the number of report files does not satisfy the stated requirement. Security telemetry should avoid leaking sensitive data while preserving useful evidence.",
        "Only the JSON indentation does not satisfy the stated requirement. Security telemetry should avoid leaking sensitive data while preserving useful evidence.",
        "Only the timestamp precision does not satisfy the stated requirement. Security telemetry should avoid leaking sensitive data while preserving useful evidence."
      ],
      [
        "An enforcing CSP breaks checkout after a new dependency deploy. Which validation was insufficient?",
        "Critical-flow policy compatibility",
        "Only a snapshot of the CSP header text",
        "Only verifying the checkout route exists",
        "Only the new dependency's build exit code",
        "Actual intended script flows must be tested under the delivered policy.",
        "A static header snapshot omits new dependencies' runtime behavior under enforcement.",
        "Route existence does not establish that checkout scripts can execute safely.",
        "Build success does not exercise the browser's enforcing CSP during checkout."
      ],
      [
        "A compromised allowed analytics vendor changes its script at the same URL. Which control can detect unexpected bytes when configured correctly?",
        "Subresource Integrity",
        "SameSite cookie restrictions",
        "A report-only CSP header",
        "A client route permission guard",
        "Integrity can reject a fetched resource that differs from the pinned expected digest.",
        "SameSite governs cookie sending rather than verifying script resource bytes.",
        "Report-only CSP does not verify the exact bytes of an otherwise allowed script.",
        "A route guard does not detect a changed third-party script resource."
      ],
      [
        "A dashboard has no CSP reports and still uses eval on user input. What conclusion is justified?",
        "The unsafe sink still needs repair",
        "No reports prove all input safe",
        "CSP replaced source review",
        "The user input is now trusted",
        "Absence of reports is not evidence that unsafe execution paths are acceptable.",
        "No reports prove all input safe does not satisfy the stated requirement. Absence of reports is not evidence that unsafe execution paths are acceptable.",
        "CSP replaced source review does not satisfy the stated requirement. Absence of reports is not evidence that unsafe execution paths are acceptable.",
        "The user input is now trusted does not satisfy the stated requirement. Absence of reports is not evidence that unsafe execution paths are acceptable."
      ]
    ]
  }
]);
