'use strict';
const {course}=require('./web-helper');
module.exports=course("frontend-api-security",[
  {
    "id": "api-response-contract",
    "comp": "m1.c1",
    "title": "Separate transport success from application data",
    "introduction": "A billing screen displays an empty invoice list after its request receives 500. The UI must distinguish a failed request from a successful response containing no invoices.",
    "sections": [
      {
        "heading": "Separate transport success from application data",
        "paragraphs": [
          "fetch returns a promise for a Response and ordinarily fulfills even when the HTTP status is an error such as 404 or 500. Check response.ok or the intended status contract before treating the body as successful data. Network failures and aborts have different rejection behavior. Parsing JSON is another asynchronous boundary: an HTTP success does not guarantee valid JSON, the expected object shape or a valid business value.",
          "Represent loading, success with data, success with an empty list and failure as distinct states. Keep the prior usable data during revalidation when product policy allows it, but show its freshness honestly. A spinner should not erase an actionable error indefinitely. Validate external records before rendering fields that assume particular types; a TypeScript assertion alone does not inspect the response."
        ]
      },
      {
        "heading": "Work through the decision and its limits",
        "paragraphs": [
          "For an invoices endpoint, accept the agreed successful statuses and validate an array of invoice records. A 204 response may intentionally have no body, so blindly calling json() can be wrong. A 200 response with an empty array is a valid empty state, whereas a malformed payload needs a contract failure path. Do not expose raw server stack traces or private response fields in user-facing errors.",
          "The fixture maps synthetic status/body pairs to explicit states and checks a minimal array contract. It does not perform fetch, parse streamed JSON, authenticate a request or exercise browser rendering. Its evidence is the state-classification function; network and screen-reader announcements need separate integration review."
        ]
      }
    ],
    "worked": {
      "lang": "javascript",
      "code": "function classify(status,body){if(status<200||status>=300)return \"error\";if(!Array.isArray(body))return \"invalid\";return body.length?\"data\":\"empty\";}\nfor(const x of [[500,[]],[200,[]],[200,[{id:1}]]])console.log(classify(...x));",
      "expect": "error\nempty\ndata",
      "problem": "Separate transport success from application data",
      "steps": [
        "Identify the explicit inputs and trust boundary.",
        "Trace the code\u2019s state or validation decision.",
        "Compare the output and identify omitted browser or server behavior."
      ],
      "explanation": "The fixture maps synthetic status/body pairs to explicit states and checks a minimal array contract. It does not perform fetch, parse streamed JSON, authenticate a request or exercise browser rendering. Its evidence is the state-classification function; network and screen-reader announcements need separate integration review."
    },
    "quiz": [
      [
        "Does fetch ordinarily reject solely because HTTP status is 404?",
        "No, inspect response status",
        "Yes, every 4xx rejects",
        "Only if JSON is valid",
        "Only if a button is disabled",
        "Fetch can fulfill with an HTTP error response, so status must be checked.",
        "Yes, every 4xx rejects does not satisfy the stated requirement. Fetch can fulfill with an HTTP error response, so status must be checked.",
        "Only if JSON is valid does not satisfy the stated requirement. Fetch can fulfill with an HTTP error response, so status must be checked.",
        "Only if a button is disabled does not satisfy the stated requirement. Fetch can fulfill with an HTTP error response, so status must be checked."
      ],
      [
        "What does a successful empty list represent?",
        "An explicit empty state",
        "A transport failure always",
        "An authentication token",
        "An unhandled rejection always",
        "An empty successful result differs from failed retrieval.",
        "A transport failure always does not satisfy the stated requirement. An empty successful result differs from failed retrieval.",
        "An authentication token does not satisfy the stated requirement. An empty successful result differs from failed retrieval.",
        "An unhandled rejection always does not satisfy the stated requirement. An empty successful result differs from failed retrieval."
      ],
      [
        "What can fail after HTTP success?",
        "Body parsing and validation",
        "Only response status classification",
        "Only request header construction",
        "Only the preflight response policy",
        "Successful status does not guarantee a valid body or business shape.",
        "A successful status has already been classified and does not prove the body parses.",
        "Request header construction precedes receiving the successful response.",
        "A preflight policy controls access rather than the returned body's runtime shape."
      ],
      [
        "An invoice screen receives 500 with an empty JSON array. What should it show?",
        "A recoverable failure state",
        "A confirmed no-invoices state",
        "A completed payment banner",
        "An automatic logout always",
        "The error status must not be recast as successful empty business data.",
        "A confirmed no-invoices state does not satisfy the stated requirement. The error status must not be recast as successful empty business data.",
        "A completed payment banner does not satisfy the stated requirement. The error status must not be recast as successful empty business data.",
        "An automatic logout always does not satisfy the stated requirement. The error status must not be recast as successful empty business data."
      ],
      [
        "An endpoint returns 204 by contract. What should a caller avoid?",
        "Unconditional JSON parsing",
        "Checking the known status",
        "Handling the no-body result",
        "Using the documented contract",
        "A 204 response has no body to parse as ordinary JSON data.",
        "Checking the known status does not satisfy the stated requirement. A 204 response has no body to parse as ordinary JSON data.",
        "Handling the no-body result does not satisfy the stated requirement. A 204 response has no body to parse as ordinary JSON data.",
        "Using the documented contract does not satisfy the stated requirement. A 204 response has no body to parse as ordinary JSON data."
      ],
      [
        "A 200 response contains items:null where an array is required. What boundary failed?",
        "The response data contract",
        "The border radius contract",
        "The browser language setting",
        "The keyboard focus sequence",
        "External data requires shape validation independent of success status.",
        "The border radius contract does not satisfy the stated requirement. External data requires shape validation independent of success status.",
        "The browser language setting does not satisfy the stated requirement. External data requires shape validation independent of success status.",
        "The keyboard focus sequence does not satisfy the stated requirement. External data requires shape validation independent of success status."
      ],
      [
        "A revalidation fails while old data remains useful. Which UI can be honest?",
        "Stale data plus failure notice",
        "Fresh-success label on old data",
        "A spinner with no explanation",
        "A permanently empty list",
        "Preserving useful data can coexist with explicit freshness and error information.",
        "Fresh-success label on old data does not satisfy the stated requirement. Preserving useful data can coexist with explicit freshness and error information.",
        "A spinner with no explanation does not satisfy the stated requirement. Preserving useful data can coexist with explicit freshness and error information.",
        "A permanently empty list does not satisfy the stated requirement. Preserving useful data can coexist with explicit freshness and error information."
      ],
      [
        "The classifier prints error for 500. What remains untested?",
        "Actual fetch rejection behavior",
        "The numeric status comparison",
        "The input body\u2019s array type",
        "The returned string literal",
        "The synthetic classifier does not run the network API.",
        "The numeric status comparison does not satisfy the stated requirement. The synthetic classifier does not run the network API.",
        "The input body\u2019s array type does not satisfy the stated requirement. The synthetic classifier does not run the network API.",
        "The returned string literal does not satisfy the stated requirement. The synthetic classifier does not run the network API."
      ]
    ],
    "mistakes": [
      "Treating every fulfilled fetch as successful business data.",
      "Using an empty list to conceal request failure."
    ],
    "takeaways": [
      "Check status, parse and validate as separate boundaries.",
      "Give empty and failure states different meanings."
    ],
    "prerequisite_note": "JavaScript DOM and Async is the canonical prerequisite. Review promises, fetch, DOM text handling and event listeners. Here the new boundaries are status/data contracts, request ownership, browser credentials and server-enforced security; synthetic JavaScript fixtures do not replace browser or security integration tests."
  },
  {
    "id": "api-retry-policy",
    "comp": "m1.c1",
    "title": "Retry bounded reads without multiplying uncertain writes",
    "introduction": "A stock dashboard retries a failed read successfully, while a payment page repeats a charge after a timeout. The operation\u2019s semantics must determine the retry policy.",
    "sections": [
      {
        "heading": "Retry bounded reads without multiplying uncertain writes",
        "paragraphs": [
          "A retry is another request, not a rewind of the original operation. Safe reads are often retryable under a bounded policy, while writes may already have completed when a client loses the response. HTTP method semantics and the endpoint contract matter; never infer that a timeout means the server did nothing. For important writes, an agreed idempotency key can identify one logical operation across retries, with server-side storage and scope rules.",
          "Limit attempts and total time. Exponential backoff with jitter can reduce synchronized retry spikes, and a valid Retry-After response may supply relevant delay guidance. Authentication failures and validation errors usually need user or session recovery instead of blind retries. Offline and background behavior should avoid creating an invisible infinite request loop."
        ]
      },
      {
        "heading": "Work through the decision and its limits",
        "paragraphs": [
          "A read policy might permit three attempts for temporary unavailability while immediately returning a validation failure. A payment flow may instead query operation status after an ambiguous timeout and present a pending outcome. Client button disabling helps prevent local duplicate interactions but cannot guarantee server deduplication across devices, reloads or uncertain responses.",
          "The code prints a bounded synthetic delay schedule and classifies two status categories. It neither waits nor sends requests; the jitter source is omitted for deterministic output. Production behavior needs cancellation, delay limits and endpoint-specific retry decisions tested with synthetic failures and server evidence."
        ]
      }
    ],
    "worked": {
      "lang": "javascript",
      "code": "const delays=[0,200,400];\nconsole.log(delays.join(\",\"));\nconsole.log([503,422].map(s=>s===503?\"bounded retry\":\"fix input\").join(\"\\n\"));",
      "expect": "0,200,400\nbounded retry\nfix input",
      "problem": "Retry bounded reads without multiplying uncertain writes",
      "steps": [
        "Identify the explicit inputs and trust boundary.",
        "Trace the code\u2019s state or validation decision.",
        "Compare the output and identify omitted browser or server behavior."
      ],
      "explanation": "The code prints a bounded synthetic delay schedule and classifies two status categories. It neither waits nor sends requests; the jitter source is omitted for deterministic output. Production behavior needs cancellation, delay limits and endpoint-specific retry decisions tested with synthetic failures and server evidence."
    },
    "quiz": [
      [
        "What is a retry?",
        "A new request attempt",
        "A rollback of prior server work",
        "A guarantee of no duplicates",
        "A browser layout refresh",
        "Retrying sends another attempt and does not undo earlier processing.",
        "A rollback of prior server work does not satisfy the stated requirement. Retrying sends another attempt and does not undo earlier processing.",
        "A guarantee of no duplicates does not satisfy the stated requirement. Retrying sends another attempt and does not undo earlier processing.",
        "A browser layout refresh does not satisfy the stated requirement. Retrying sends another attempt and does not undo earlier processing."
      ],
      [
        "Why add jitter to retries?",
        "Reduce synchronized retry bursts",
        "Validate response JSON",
        "Authorize the current account",
        "Remove every network failure",
        "Jitter spreads timing instead of aligning many clients on the same schedule.",
        "Validate response JSON does not satisfy the stated requirement. Jitter spreads timing instead of aligning many clients on the same schedule.",
        "Authorize the current account does not satisfy the stated requirement. Jitter spreads timing instead of aligning many clients on the same schedule.",
        "Remove every network failure does not satisfy the stated requirement. Jitter spreads timing instead of aligning many clients on the same schedule."
      ],
      [
        "What should bound a retry policy?",
        "Attempts and elapsed budget",
        "Only the delay on the first attempt",
        "Only the server's cache lifetime",
        "Only the response payload size",
        "Retries need explicit resource and user-experience limits.",
        "An initial delay alone leaves the total retry count and duration unbounded.",
        "Cache lifetime does not bound attempts or time spent recovering.",
        "Payload size does not impose a retry stopping condition."
      ],
      [
        "A payment times out after reaching the server. What cannot be assumed?",
        "That no charge happened",
        "That the client timed out",
        "That the outcome is uncertain",
        "That recovery is needed",
        "A lost response does not establish that the server failed to apply the write.",
        "That the client timed out does not satisfy the stated requirement. A lost response does not establish that the server failed to apply the write.",
        "That the outcome is uncertain does not satisfy the stated requirement. A lost response does not establish that the server failed to apply the write.",
        "That recovery is needed does not satisfy the stated requirement. A lost response does not establish that the server failed to apply the write."
      ],
      [
        "A read receives 422 for invalid filters. Which response is appropriate?",
        "Fix the request input",
        "Retry forever unchanged",
        "Disable all status checking",
        "Mark the request successful",
        "A validation failure generally requires changed input rather than repeated identical requests.",
        "Retry forever unchanged does not satisfy the stated requirement. A validation failure generally requires changed input rather than repeated identical requests.",
        "Disable all status checking does not satisfy the stated requirement. A validation failure generally requires changed input rather than repeated identical requests.",
        "Mark the request successful does not satisfy the stated requirement. A validation failure generally requires changed input rather than repeated identical requests."
      ],
      [
        "A service supplies Retry-After during overload. What should the client consider?",
        "Valid server delay guidance",
        "Only its local CSS duration",
        "Only the request title",
        "Only a random route name",
        "Retry-After can inform bounded retry timing when applicable and valid.",
        "Only its local CSS duration does not satisfy the stated requirement. Retry-After can inform bounded retry timing when applicable and valid.",
        "Only the request title does not satisfy the stated requirement. Retry-After can inform bounded retry timing when applicable and valid.",
        "Only a random route name does not satisfy the stated requirement. Retry-After can inform bounded retry timing when applicable and valid."
      ],
      [
        "A UI disables Pay while submitting. What is still needed for cross-device duplicates?",
        "Server deduplication rules",
        "Only another disabled class",
        "Only a longer spinner",
        "Only a local array flag",
        "Local interaction blocking cannot enforce logical write uniqueness across clients.",
        "Only another disabled class does not satisfy the stated requirement. Local interaction blocking cannot enforce logical write uniqueness across clients.",
        "Only a longer spinner does not satisfy the stated requirement. Local interaction blocking cannot enforce logical write uniqueness across clients.",
        "Only a local array flag does not satisfy the stated requirement. Local interaction blocking cannot enforce logical write uniqueness across clients."
      ],
      [
        "The delay fixture has no actual timers. What is its evidence boundary?",
        "A policy schedule only",
        "Real network backoff behavior",
        "A complete outage recovery test",
        "A payment rollback guarantee",
        "The deterministic model prints choices without executing transport or timing.",
        "Real network backoff behavior does not satisfy the stated requirement. The deterministic model prints choices without executing transport or timing.",
        "A complete outage recovery test does not satisfy the stated requirement. The deterministic model prints choices without executing transport or timing.",
        "A payment rollback guarantee does not satisfy the stated requirement. The deterministic model prints choices without executing transport or timing."
      ]
    ],
    "mistakes": [
      "Assuming a timeout proves a write was not applied.",
      "Retrying permanent input errors without changing input."
    ],
    "takeaways": [
      "Bound retries by semantics, attempts and time.",
      "Reconcile uncertain writes using server contracts."
    ],
    "prerequisite_note": "JavaScript DOM and Async is the canonical prerequisite. Review promises, fetch, DOM text handling and event listeners. Here the new boundaries are status/data contracts, request ownership, browser credentials and server-enforced security; synthetic JavaScript fixtures do not replace browser or security integration tests."
  },
  {
    "id": "api-race-ownership",
    "comp": "m1.c2",
    "title": "Give asynchronous results explicit ownership",
    "introduction": "A student types two search terms quickly. The first request finishes last and replaces the newer results, making a technically successful screen show the wrong answer.",
    "sections": [
      {
        "heading": "Give asynchronous results explicit ownership",
        "paragraphs": [
          "Asynchronous completion order need not match initiation order. A search response belongs to the query, account and view state that created it. Capture a monotonically increasing request generation or compare an equivalent ownership token before committing a response. Merely sorting the resulting list cannot fix a response that belongs to the wrong query.",
          "AbortController can signal fetch cancellation and avoid unnecessary client work, but cancellation is not a universal server rollback mechanism. A request may already be processed, and downstream code can still need an ownership check before applying results. On account change or unmount, release relevant work and ensure stale responses cannot cross the new boundary."
        ]
      },
      {
        "heading": "Work through the decision and its limits",
        "paragraphs": [
          "Prevent duplicate submission through an explicit pending state and guarded handler rather than visual styling alone. For a write, the server must also enforce authorization, validation and any required idempotency. Disable or deduplicate the initiating action appropriately, restore usability on recoverable failure, and avoid automatically repeating an uncertain write because an old promise rejected.",
          "The fixture applies two simulated search completions in reverse order and commits only the current generation. It demonstrates a pure state invariant, not AbortController, browser event timing or server cancellation. Integration tests should control response order and confirm both stale-result rejection and accessible pending-state communication."
        ]
      }
    ],
    "worked": {
      "lang": "javascript",
      "code": "let current=2,shown=\"\";\nfor(const result of [{generation:2,text:\"new\"},{generation:1,text:\"old\"}]){if(result.generation===current)shown=result.text;}\nconsole.log(shown);",
      "expect": "new",
      "problem": "Give asynchronous results explicit ownership",
      "steps": [
        "Identify the explicit inputs and trust boundary.",
        "Trace the code\u2019s state or validation decision.",
        "Compare the output and identify omitted browser or server behavior."
      ],
      "explanation": "The fixture applies two simulated search completions in reverse order and commits only the current generation. It demonstrates a pure state invariant, not AbortController, browser event timing or server cancellation. Integration tests should control response order and confirm both stale-result rejection and accessible pending-state communication."
    },
    "quiz": [
      [
        "What is a request race in search?",
        "Completion order can differ",
        "All requests must use one URL",
        "The oldest result always wins",
        "Requests cannot overlap in a tab",
        "An older request may finish after a newer request and overwrite its results.",
        "Requests can race across either identical or different URLs.",
        "The oldest response must not automatically overwrite the latest intent.",
        "A browser can have overlapping asynchronous requests in one tab."
      ],
      [
        "What can identify the latest request owner?",
        "A request generation token",
        "Only a CSS selector",
        "Only a larger timeout",
        "Only a sorted result list",
        "A captured generation can be compared with the current request before committing results.",
        "Only a CSS selector does not satisfy the stated requirement. A captured generation can be compared with the current request before committing results.",
        "Only a larger timeout does not satisfy the stated requirement. A captured generation can be compared with the current request before committing results.",
        "Only a sorted result list does not satisfy the stated requirement. A captured generation can be compared with the current request before committing results."
      ],
      [
        "Does aborting fetch guarantee server rollback?",
        "No, server work may have run",
        "Yes, all writes are reverted",
        "Only if JSON was valid",
        "Only if response.ok is true",
        "Client cancellation cannot generally establish what the server has already applied.",
        "Yes, all writes are reverted does not satisfy the stated requirement. Client cancellation cannot generally establish what the server has already applied.",
        "Only if JSON was valid does not satisfy the stated requirement. Client cancellation cannot generally establish what the server has already applied.",
        "Only if response.ok is true does not satisfy the stated requirement. Client cancellation cannot generally establish what the server has already applied."
      ],
      [
        "Search B completes before older search A. Which response should own the current B view?",
        "The B-owned response",
        "Whichever response arrives last",
        "Always the longest payload",
        "Always the response with more rows",
        "Commit policy must follow current request ownership rather than arrival order.",
        "Whichever response arrives last does not satisfy the stated requirement. Commit policy must follow current request ownership rather than arrival order.",
        "Always the longest payload does not satisfy the stated requirement. Commit policy must follow current request ownership rather than arrival order.",
        "Always the response with more rows does not satisfy the stated requirement. Commit policy must follow current request ownership rather than arrival order."
      ],
      [
        "An account switch leaves a pending profile request. What boundary must block its late response?",
        "Current account ownership",
        "Only the new page title",
        "Only the response row count",
        "Only the image\u2019s aspect ratio",
        "An old account response must not overwrite the new account\u2019s view state.",
        "Only the new page title does not satisfy the stated requirement. An old account response must not overwrite the new account\u2019s view state.",
        "Only the response row count does not satisfy the stated requirement. An old account response must not overwrite the new account\u2019s view state.",
        "Only the image\u2019s aspect ratio does not satisfy the stated requirement. An old account response must not overwrite the new account\u2019s view state."
      ],
      [
        "A submit button looks disabled but its handler still sends writes. What is missing?",
        "An enforced pending guard",
        "Only a muted CSS color",
        "Only a pointer cursor",
        "Only a shorter label",
        "Actual interaction and handler policy must prevent local duplicate sends.",
        "Only a muted CSS color does not satisfy the stated requirement. Actual interaction and handler policy must prevent local duplicate sends.",
        "Only a pointer cursor does not satisfy the stated requirement. Actual interaction and handler policy must prevent local duplicate sends.",
        "Only a shorter label does not satisfy the stated requirement. Actual interaction and handler policy must prevent local duplicate sends."
      ],
      [
        "A newer request fails while an older one succeeds. Why not display the old result as current?",
        "It belongs to another intent",
        "It contains valid JSON",
        "It used the same method",
        "It has a successful status",
        "A successful status does not make stale-query data correct for the current view.",
        "It contains valid JSON does not satisfy the stated requirement. A successful status does not make stale-query data correct for the current view.",
        "It used the same method does not satisfy the stated requirement. A successful status does not make stale-query data correct for the current view.",
        "It has a successful status does not satisfy the stated requirement. A successful status does not make stale-query data correct for the current view."
      ],
      [
        "The token fixture displays new. What is outside its scope?",
        "Browser cancellation behavior",
        "The equality condition",
        "The synthetic order of results",
        "The final string assignment",
        "A pure ownership model does not execute AbortController or transport cancellation.",
        "The equality condition does not satisfy the stated requirement. A pure ownership model does not execute AbortController or transport cancellation.",
        "The synthetic order of results does not satisfy the stated requirement. A pure ownership model does not execute AbortController or transport cancellation.",
        "The final string assignment does not satisfy the stated requirement. A pure ownership model does not execute AbortController or transport cancellation."
      ]
    ],
    "mistakes": [
      "Letting the last completion win regardless of request ownership.",
      "Treating client cancellation as server rollback."
    ],
    "takeaways": [
      "Associate state updates with the current request context.",
      "Guard both success and failure transitions."
    ],
    "prerequisite_note": "JavaScript DOM and Async is the canonical prerequisite. Review promises, fetch, DOM text handling and event listeners. Here the new boundaries are status/data contracts, request ownership, browser credentials and server-enforced security; synthetic JavaScript fixtures do not replace browser or security integration tests."
  },
  {
    "id": "auth-cookie-boundary",
    "comp": "m2.c1",
    "title": "Compare cookie and bearer credential exposure",
    "introduction": "An internal portal must choose a session transport. The choice affects script exposure, cross-site request behavior and the server\u2019s defenses.",
    "sections": [
      {
        "heading": "Compare cookie and bearer credential exposure",
        "paragraphs": [
          "An HttpOnly cookie cannot be read through ordinary document.cookie access, reducing direct token theft through that interface. Secure limits cookie transmission to secure contexts under its semantics, and SameSite influences cross-site cookie sending. These flags do not remove XSS: malicious same-origin script may still initiate authenticated actions or read accessible page data.",
          "Bearer tokens sent in Authorization headers are explicit credentials whose possession can grant access. localStorage is readable by same-origin scripts, so persistent storage increases exposure to XSS and does not become safe because it is convenient. In-memory tokens have different persistence characteristics but remain exposed to active script compromise and require a renewal strategy. Avoid placing credentials in URLs where logs, history and referrers can spread them."
        ]
      },
      {
        "heading": "Work through the decision and its limits",
        "paragraphs": [
          "Cookie sessions need server-side session invalidation and a deliberate CSRF strategy for state-changing actions. Cross-origin fetch may require credentials:\"include\" plus precise server CORS responses when that architecture is intended. Credentials, allowed origins and cookie attributes are different controls, and browser enforcement does not replace server authorization of the actor and resource.",
          "The example models which synthetic cookie flags block one script-read surface and require secure transport. It does not create cookies or implement their browser algorithms. Actual attribute combinations, domain and path scope, cross-site policy and server-side expiration need integration checks with nonproduction credentials."
        ]
      }
    ],
    "worked": {
      "lang": "javascript",
      "code": "const cookie={httpOnly:true,secure:true,sameSite:\"Lax\"};\nconsole.log(cookie.httpOnly?\"not readable through document.cookie\":\"script-readable\");\nconsole.log(cookie.secure?\"secure transport\":\"transport risk\");",
      "expect": "not readable through document.cookie\nsecure transport",
      "problem": "Compare cookie and bearer credential exposure",
      "steps": [
        "Identify the explicit inputs and trust boundary.",
        "Trace the code\u2019s state or validation decision.",
        "Compare the output and identify omitted browser or server behavior."
      ],
      "explanation": "The example models which synthetic cookie flags block one script-read surface and require secure transport. It does not create cookies or implement their browser algorithms. Actual attribute combinations, domain and path scope, cross-site policy and server-side expiration need integration checks with nonproduction credentials."
    },
    "quiz": [
      [
        "Which cookie flag restricts ordinary script reading?",
        "HttpOnly",
        "Path=/ only",
        "SameSite=None only",
        "Max-Age=3600 only",
        "HttpOnly restricts exposure through document.cookie rather than all script-driven actions.",
        "Path=/ only does not satisfy the stated requirement. HttpOnly restricts exposure through document.cookie rather than all script-driven actions.",
        "SameSite=None only does not satisfy the stated requirement. HttpOnly restricts exposure through document.cookie rather than all script-driven actions.",
        "Max-Age=3600 only does not satisfy the stated requirement. HttpOnly restricts exposure through document.cookie rather than all script-driven actions."
      ],
      [
        "Which flag requests secure cookie transport?",
        "Secure",
        "Domain",
        "Expires",
        "Priority",
        "Secure limits transmission under the cookie\u2019s secure-context transport semantics.",
        "Domain does not satisfy the stated requirement. Secure limits transmission under the cookie\u2019s secure-context transport semantics.",
        "Expires does not satisfy the stated requirement. Secure limits transmission under the cookie\u2019s secure-context transport semantics.",
        "Priority does not satisfy the stated requirement. Secure limits transmission under the cookie\u2019s secure-context transport semantics."
      ],
      [
        "What is a bearer credential\u2019s core property?",
        "Possession can grant access",
        "It is harmless in every log",
        "It never expires",
        "It cannot be stolen by script",
        "Bearer tokens need careful handling because the holder may use them.",
        "It is harmless in every log does not satisfy the stated requirement. Bearer tokens need careful handling because the holder may use them.",
        "It never expires does not satisfy the stated requirement. Bearer tokens need careful handling because the holder may use them.",
        "It cannot be stolen by script does not satisfy the stated requirement. Bearer tokens need careful handling because the holder may use them."
      ],
      [
        "A team stores a session token in localStorage and calls it XSS-proof. What is wrong?",
        "Same-origin script can read it",
        "LocalStorage is always server-only",
        "Tokens cannot be text",
        "XSS affects CSS only",
        "LocalStorage is accessible to active same-origin JavaScript.",
        "LocalStorage is always server-only does not satisfy the stated requirement. LocalStorage is accessible to active same-origin JavaScript.",
        "Tokens cannot be text does not satisfy the stated requirement. LocalStorage is accessible to active same-origin JavaScript.",
        "XSS affects CSS only does not satisfy the stated requirement. LocalStorage is accessible to active same-origin JavaScript."
      ],
      [
        "An HttpOnly session is present during XSS. What can malicious script still potentially do?",
        "Send authenticated actions",
        "Read the cookie through normal API",
        "Automatically bypass every server rule",
        "Decrypt all TLS traffic",
        "HttpOnly reduces one theft surface but does not neutralize same-origin script execution.",
        "Read the cookie through normal API does not satisfy the stated requirement. HttpOnly reduces one theft surface but does not neutralize same-origin script execution.",
        "Automatically bypass every server rule does not satisfy the stated requirement. HttpOnly reduces one theft surface but does not neutralize same-origin script execution.",
        "Decrypt all TLS traffic does not satisfy the stated requirement. HttpOnly reduces one theft surface but does not neutralize same-origin script execution."
      ],
      [
        "A link contains access_token in its query. What exposure should be avoided?",
        "Credentials in URL records",
        "Only request-body compression",
        "Only origin-header disclosure",
        "Only a preflight request cache",
        "URLs can be recorded in history, logs and other navigation contexts.",
        "Compression does not address credentials recorded in history or access logs.",
        "The Origin header is not the credential-bearing query string described here.",
        "Preflight caching does not remove the token from the URL."
      ],
      [
        "A cross-origin cookie request is intended. What must be configured together?",
        "Client and server credential policy",
        "Only an Authorization header in JS",
        "Only a successful preflight status",
        "Only the API's cookie expiry time",
        "Credentialed cross-origin requests require compatible client and server browser-policy settings.",
        "An Authorization header does not configure cross-origin cookie sending and response access.",
        "A preflight success alone does not establish the actual response's credential policy.",
        "Cookie expiry alone does not enable browser credentials and compatible server CORS handling."
      ],
      [
        "The flag model prints secure transport. What is unproven?",
        "Actual cookie enforcement",
        "The supplied boolean value",
        "The chosen branch string",
        "The object property access",
        "A local object does not create or transmit a real browser cookie.",
        "The supplied boolean value does not satisfy the stated requirement. A local object does not create or transmit a real browser cookie.",
        "The chosen branch string does not satisfy the stated requirement. A local object does not create or transmit a real browser cookie.",
        "The object property access does not satisfy the stated requirement. A local object does not create or transmit a real browser cookie."
      ]
    ],
    "mistakes": [
      "Equating Secure with HttpOnly.",
      "Claiming cookie flags remove all XSS or authorization risk."
    ],
    "takeaways": [
      "Choose credential handling from explicit threat tradeoffs.",
      "Enforce authentication and authorization on the server."
    ],
    "prerequisite_note": "JavaScript DOM and Async is the canonical prerequisite. Review promises, fetch, DOM text handling and event listeners. Here the new boundaries are status/data contracts, request ownership, browser credentials and server-enforced security; synthetic JavaScript fixtures do not replace browser or security integration tests."
  },
  {
    "id": "auth-session-lifecycle",
    "comp": "m2.c2",
    "title": "Recover expired sessions without losing account boundaries",
    "introduction": "A document editor receives 401 after the user\u2019s session expires. Recovery should preserve appropriate draft work while avoiding endless refresh requests or cross-account leakage.",
    "sections": [
      {
        "heading": "Recover expired sessions without losing account boundaries",
        "paragraphs": [
          "A client route guard improves navigation and can avoid showing a page the current UI believes is unavailable. It is not an authorization boundary: users can invoke APIs directly or alter client state. Protected APIs must validate the session and resource permission on every relevant operation. Distinguish 401 authentication recovery from a 403 permission outcome according to the server\u2019s documented contract.",
          "Centralize a bounded session-expiry policy. Multiple concurrent 401 responses can trigger a refresh storm if every request starts renewal independently; a shared single-flight refresh promise can coordinate them. Retry a request only when the contract permits it, avoid replaying unsafe writes automatically, and ensure refresh failure terminates the loop and returns the interface to a clear signed-out state."
        ]
      },
      {
        "heading": "Work through the decision and its limits",
        "paragraphs": [
          "On sign-out or account change, clear or partition caches and drafts according to ownership and retention policy. A draft may be preservable for the same actor but inappropriate to expose to a different account. A return path after login must be constrained to permitted local destinations; blindly navigating to a user-supplied URL creates an open-redirect risk.",
          "The fixture classifies synthetic status values and filters cached records by account ownership. It is not an OAuth implementation, refresh protocol or route middleware test. Validate real expiry, forbidden access, simultaneous requests and account switching with isolated identities before relying on the client\u2019s recovery flow."
        ]
      }
    ],
    "worked": {
      "lang": "javascript",
      "code": "const actor=\"B\",cache=[{actor:\"A\",id:1},{actor:\"B\",id:2}];\nconsole.log(cache.filter(x=>x.actor===actor).map(x=>x.id).join(\",\"));\nconsole.log([401,403].map(x=>x===401?\"recover session\":\"permission denied\").join(\"\\n\"));",
      "expect": "2\nrecover session\npermission denied",
      "problem": "Recover expired sessions without losing account boundaries",
      "steps": [
        "Identify the explicit inputs and trust boundary.",
        "Trace the code\u2019s state or validation decision.",
        "Compare the output and identify omitted browser or server behavior."
      ],
      "explanation": "The fixture classifies synthetic status values and filters cached records by account ownership. It is not an OAuth implementation, refresh protocol or route middleware test. Validate real expiry, forbidden access, simultaneous requests and account switching with isolated identities before relying on the client\u2019s recovery flow."
    },
    "quiz": [
      [
        "What is a client route guard primarily?",
        "A navigation and presentation control",
        "A complete server permission rule",
        "A guarantee against direct API use",
        "A database transaction boundary",
        "Client guards improve UI flow but cannot enforce server access control.",
        "A complete server permission rule does not satisfy the stated requirement. Client guards improve UI flow but cannot enforce server access control.",
        "A guarantee against direct API use does not satisfy the stated requirement. Client guards improve UI flow but cannot enforce server access control.",
        "A database transaction boundary does not satisfy the stated requirement. Client guards improve UI flow but cannot enforce server access control."
      ],
      [
        "Which status commonly indicates authentication is needed?",
        "401",
        "200",
        "204",
        "304",
        "The documented 401 contract commonly triggers authentication recovery.",
        "200 does not satisfy the stated requirement. The documented 401 contract commonly triggers authentication recovery.",
        "204 does not satisfy the stated requirement. The documented 401 contract commonly triggers authentication recovery.",
        "304 does not satisfy the stated requirement. The documented 401 contract commonly triggers authentication recovery."
      ],
      [
        "What can single-flight refresh coordinate?",
        "Concurrent renewal requests",
        "Every CSS breakpoint",
        "All database schema migrations",
        "All image decoding steps",
        "A shared refresh operation can prevent concurrent requests from multiplying renewal work.",
        "Every CSS breakpoint does not satisfy the stated requirement. A shared refresh operation can prevent concurrent requests from multiplying renewal work.",
        "All database schema migrations does not satisfy the stated requirement. A shared refresh operation can prevent concurrent requests from multiplying renewal work.",
        "All image decoding steps does not satisfy the stated requirement. A shared refresh operation can prevent concurrent requests from multiplying renewal work."
      ],
      [
        "A user changes accounts but sees the previous account\u2019s cached profile. What boundary failed?",
        "Account-owned client state",
        "Only the card\u2019s padding",
        "Only the HTML title",
        "Only image compression",
        "Caches must be cleared or partitioned when ownership changes.",
        "Only the card\u2019s padding does not satisfy the stated requirement. Caches must be cleared or partitioned when ownership changes.",
        "Only the HTML title does not satisfy the stated requirement. Caches must be cleared or partitioned when ownership changes.",
        "Only image compression does not satisfy the stated requirement. Caches must be cleared or partitioned when ownership changes."
      ],
      [
        "An API returns 403 to an authenticated editor. Why is repeated login not the default fix?",
        "Permission may be missing",
        "Every 403 means a network outage",
        "Login always grants all roles",
        "The JSON must be an empty list",
        "Authorization denial is different from lacking an authenticated session.",
        "Every 403 means a network outage does not satisfy the stated requirement. Authorization denial is different from lacking an authenticated session.",
        "Login always grants all roles does not satisfy the stated requirement. Authorization denial is different from lacking an authenticated session.",
        "The JSON must be an empty list does not satisfy the stated requirement. Authorization denial is different from lacking an authenticated session."
      ],
      [
        "Ten requests receive 401 together. What avoids ten independent renewal calls?",
        "A shared refresh promise",
        "Ten independent retry loops",
        "A random delay only in CSS",
        "A page reload per response",
        "Single-flight renewal lets concurrent callers share one controlled recovery attempt.",
        "Ten independent retry loops does not satisfy the stated requirement. Single-flight renewal lets concurrent callers share one controlled recovery attempt.",
        "A random delay only in CSS does not satisfy the stated requirement. Single-flight renewal lets concurrent callers share one controlled recovery attempt.",
        "A page reload per response does not satisfy the stated requirement. Single-flight renewal lets concurrent callers share one controlled recovery attempt."
      ],
      [
        "A login returnTo accepts an arbitrary external URL. What risk follows?",
        "An open redirect",
        "A grid sizing error",
        "An automatic SQL join",
        "A stronger session cookie",
        "Post-login navigation should validate permitted local destinations.",
        "A grid sizing error does not satisfy the stated requirement. Post-login navigation should validate permitted local destinations.",
        "An automatic SQL join does not satisfy the stated requirement. Post-login navigation should validate permitted local destinations.",
        "A stronger session cookie does not satisfy the stated requirement. Post-login navigation should validate permitted local destinations."
      ],
      [
        "The cache fixture returns only actor B\u2019s record. What has not been tested?",
        "Real session invalidation",
        "The array filter predicate",
        "The supplied actor label",
        "The resulting record id",
        "A local filter does not validate authentication or server logout behavior.",
        "The array filter predicate does not satisfy the stated requirement. A local filter does not validate authentication or server logout behavior.",
        "The supplied actor label does not satisfy the stated requirement. A local filter does not validate authentication or server logout behavior.",
        "The resulting record id does not satisfy the stated requirement. A local filter does not validate authentication or server logout behavior."
      ]
    ],
    "mistakes": [
      "Treating a hidden route as protected data.",
      "Replaying uncertain writes during generic refresh recovery."
    ],
    "takeaways": [
      "Keep expiry and permission outcomes distinct.",
      "Partition private state by authenticated ownership."
    ],
    "prerequisite_note": "JavaScript DOM and Async is the canonical prerequisite. Review promises, fetch, DOM text handling and event listeners. Here the new boundaries are status/data contracts, request ownership, browser credentials and server-enforced security; synthetic JavaScript fixtures do not replace browser or security integration tests."
  },
  {
    "id": "auth-fetch-credentials",
    "comp": "m2.c1",
    "title": "Trace origins and credentialed requests precisely",
    "introduction": "A portal at app.example calls api.example. Developers expect cookies to appear automatically because both hosts share a parent domain, but origins and cookie rules are different concepts.",
    "sections": [
      {
        "heading": "Trace origins and credentialed requests precisely",
        "paragraphs": [
          "An origin is the combination of scheme, host and port. Two sibling subdomains are different origins even when they may be same-site under cookie policy. fetch credentials defaults to same-origin; credentials:\"include\" requests credential inclusion for intended cross-origin fetches subject to cookie scope and browser restrictions. Do not confuse this option with permission to read a cross-origin response.",
          "For credentialed CORS, the server needs a compatible explicit Access-Control-Allow-Origin and Access-Control-Allow-Credentials:true. A cross-origin Authorization header or non-safelisted content type can trigger preflight. The OPTIONS request checks browser permission for the actual cross-origin request; a successful preflight does not authorize a user or guarantee that the actual response will be readable."
        ]
      },
      {
        "heading": "Work through the decision and its limits",
        "paragraphs": [
          "Use an allowlist when reflecting origins and consider Vary:Origin when caching different origin-specific responses. Do not reflect arbitrary Origin values together with credentials. Cookies also require appropriate domain, path, Secure and SameSite behavior, and browser privacy controls can restrict third-party contexts. Diagnose the request headers, preflight and response separately.",
          "The fixture compares URL origins using the actual JavaScript URL implementation and reports the explicit cross-origin relationship. It sends no credentials and does not emulate CORS, SameSite or browser privacy policy. Use the result to name the boundary before testing network behavior with synthetic sessions."
        ]
      }
    ],
    "worked": {
      "lang": "javascript",
      "code": "const a=new URL(\"https://app.example.test/x\"),b=new URL(\"https://api.example.test/x\");\nconsole.log(a.origin===b.origin);\nconsole.log(a.origin);",
      "expect": "false\nhttps://app.example.test",
      "problem": "Trace origins and credentialed requests precisely",
      "steps": [
        "Identify the explicit inputs and trust boundary.",
        "Trace the code\u2019s state or validation decision.",
        "Compare the output and identify omitted browser or server behavior."
      ],
      "explanation": "The fixture compares URL origins using the actual JavaScript URL implementation and reports the explicit cross-origin relationship. It sends no credentials and does not emulate CORS, SameSite or browser privacy policy. Use the result to name the boundary before testing network behavior with synthetic sessions."
    },
    "quiz": [
      [
        "What defines a web origin?",
        "Scheme, host and port",
        "Only the parent domain",
        "Only the URL path",
        "Only the page\u2019s title",
        "Origins include scheme, host and port rather than just a shared site suffix.",
        "Only the parent domain does not satisfy the stated requirement. Origins include scheme, host and port rather than just a shared site suffix.",
        "Only the URL path does not satisfy the stated requirement. Origins include scheme, host and port rather than just a shared site suffix.",
        "Only the page\u2019s title does not satisfy the stated requirement. Origins include scheme, host and port rather than just a shared site suffix."
      ],
      [
        "What is fetch\u2019s default credentials mode?",
        "same-origin",
        "include for every host",
        "omit for every request",
        "all-sites",
        "Same-origin is the default credentials mode for fetch.",
        "include for every host does not satisfy the stated requirement. Same-origin is the default credentials mode for fetch.",
        "omit for every request does not satisfy the stated requirement. Same-origin is the default credentials mode for fetch.",
        "all-sites does not satisfy the stated requirement. Same-origin is the default credentials mode for fetch."
      ],
      [
        "Can same-site sibling hosts be cross-origin?",
        "Yes, their hosts differ",
        "No, parent domains merge origins",
        "Only with a different CSS file",
        "Only if their paths match",
        "Site and origin use different boundaries.",
        "No, parent domains merge origins does not satisfy the stated requirement. Site and origin use different boundaries.",
        "Only with a different CSS file does not satisfy the stated requirement. Site and origin use different boundaries.",
        "Only if their paths match does not satisfy the stated requirement. Site and origin use different boundaries."
      ],
      [
        "An app requests a sibling API with cookie credentials. What client option may be needed?",
        "credentials:\"include\"",
        "mode:\"no-cors\" for readable JSON",
        "cache:\"only-css\"",
        "redirect:\"authorize\"",
        "Include requests credential inclusion subject to cookie and browser rules.",
        "mode:\"no-cors\" for readable JSON does not satisfy the stated requirement. Include requests credential inclusion subject to cookie and browser rules.",
        "cache:\"only-css\" does not satisfy the stated requirement. Include requests credential inclusion subject to cookie and browser rules.",
        "redirect:\"authorize\" does not satisfy the stated requirement. Include requests credential inclusion subject to cookie and browser rules."
      ],
      [
        "The server returns wildcard origin with credentials enabled. What should be used instead?",
        "A permitted explicit origin",
        "A random CSS class",
        "An arbitrary reflected origin",
        "A second wildcard header",
        "Credentialed response access requires a compatible explicit allowed origin.",
        "A random CSS class does not satisfy the stated requirement. Credentialed response access requires a compatible explicit allowed origin.",
        "An arbitrary reflected origin does not satisfy the stated requirement. Credentialed response access requires a compatible explicit allowed origin.",
        "A second wildcard header does not satisfy the stated requirement. Credentialed response access requires a compatible explicit allowed origin."
      ],
      [
        "An Authorization header triggers OPTIONS. What is the likely browser mechanism?",
        "CORS preflight",
        "A session logout redirect",
        "A CSS layout recalculation",
        "A JSON array coercion",
        "Non-safelisted request headers can trigger preflight.",
        "A session logout redirect does not satisfy the stated requirement. Non-safelisted request headers can trigger preflight.",
        "A CSS layout recalculation does not satisfy the stated requirement. Non-safelisted request headers can trigger preflight.",
        "A JSON array coercion does not satisfy the stated requirement. Non-safelisted request headers can trigger preflight."
      ],
      [
        "A preflight succeeds. What must the actual API still enforce?",
        "Authentication and authorization",
        "Only the requested header allowlist",
        "Only the preflight cache duration",
        "Only the allowed request methods",
        "CORS permission is not an actor-resource authorization decision.",
        "A header allowlist does not establish the caller's identity or resource permission.",
        "Preflight cache duration does not authorize the actual business operation.",
        "Allowing an HTTP method is distinct from authorizing an actor to perform it."
      ],
      [
        "The URL fixture says origins differ. What remains untested?",
        "Cookie inclusion and CORS",
        "The parsed host value",
        "The origin equality comparison",
        "The printed origin text",
        "URL comparison does not execute browser cross-origin transport policy.",
        "The parsed host value does not satisfy the stated requirement. URL comparison does not execute browser cross-origin transport policy.",
        "The origin equality comparison does not satisfy the stated requirement. URL comparison does not execute browser cross-origin transport policy.",
        "The printed origin text does not satisfy the stated requirement. URL comparison does not execute browser cross-origin transport policy."
      ]
    ],
    "mistakes": [
      "Equating sibling subdomains with one origin.",
      "Using no-cors as a way to read protected JSON."
    ],
    "takeaways": [
      "Name the origin tuple before debugging CORS.",
      "Credential inclusion and response access are separate checks."
    ],
    "prerequisite_note": "JavaScript DOM and Async is the canonical prerequisite. Review promises, fetch, DOM text handling and event listeners. Here the new boundaries are status/data contracts, request ownership, browser credentials and server-enforced security; synthetic JavaScript fixtures do not replace browser or security integration tests."
  },
  {
    "id": "security-xss-sinks",
    "comp": "m3.c1",
    "title": "Keep untrusted content out of executable sinks",
    "introduction": "A support dashboard renders a customer\u2019s message using innerHTML. A message should remain text even when it contains markup-like characters.",
    "sections": [
      {
        "heading": "Keep untrusted content out of executable sinks",
        "paragraphs": [
          "Cross-site scripting occurs when attacker-controlled content executes in a trusted origin. A safe text sink such as textContent displays markup characters as text. Framework escaping generally helps in normal text interpolation, but dangerous HTML insertion APIs, script URLs and unsafe third-party code can cross different contexts. One encoding rule does not make every HTML, attribute, URL, CSS and JavaScript context safe.",
          "If a product truly requires rich HTML, use a maintained sanitizer with an explicit allowed-content policy and suitable integration. A regular expression that removes the word script cannot parse all browser HTML behavior. Sanitization, output context and subsequent DOM mutations must be reviewed together; content that was safe in one context can become dangerous when moved or transformed."
        ]
      },
      {
        "heading": "Work through the decision and its limits",
        "paragraphs": [
          "Validate navigation URLs by the application\u2019s permitted scheme and destination policy. A link to javascript: is not made harmless merely by placing it into a string template. Keep user content separate from code and avoid eval-like execution of untrusted input. Server validation and a Content Security Policy add layers but do not justify writing untrusted data into executable sinks.",
          "The fixture uses the actual URL parser to permit only HTTPS destinations under a tiny explicit policy. It does not implement HTML sanitization, create a DOM or prove a framework\u2019s escaping in every context. The scope is URL decision logic; browser tests must exercise the actual rendering sink and malicious input cases."
        ]
      }
    ],
    "worked": {
      "lang": "javascript",
      "code": "function allowed(raw){try{return new URL(raw).protocol===\"https:\";}catch{return false;}}\nconsole.log(allowed(\"javascript:alert(1)\"));\nconsole.log(allowed(\"https://help.example.test/\"));",
      "expect": "false\ntrue",
      "problem": "Keep untrusted content out of executable sinks",
      "steps": [
        "Identify the explicit inputs and trust boundary.",
        "Trace the code\u2019s state or validation decision.",
        "Compare the output and identify omitted browser or server behavior."
      ],
      "explanation": "The fixture uses the actual URL parser to permit only HTTPS destinations under a tiny explicit policy. It does not implement HTML sanitization, create a DOM or prove a framework\u2019s escaping in every context. The scope is URL decision logic; browser tests must exercise the actual rendering sink and malicious input cases."
    },
    "quiz": [
      [
        "Which DOM sink is appropriate for plain untrusted text?",
        "textContent",
        "innerHTML",
        "eval",
        "document.write",
        "TextContent creates text instead of interpreting the input as HTML markup.",
        "innerHTML does not satisfy the stated requirement. TextContent creates text instead of interpreting the input as HTML markup.",
        "eval does not satisfy the stated requirement. TextContent creates text instead of interpreting the input as HTML markup.",
        "document.write does not satisfy the stated requirement. TextContent creates text instead of interpreting the input as HTML markup."
      ],
      [
        "Does escaping for one output context secure every context?",
        "No, context matters",
        "Yes, all contexts parse equally",
        "Only if the string is long",
        "Only if CSS is disabled",
        "HTML, URL, attribute and script contexts have different interpretation rules.",
        "Yes, all contexts parse equally does not satisfy the stated requirement. HTML, URL, attribute and script contexts have different interpretation rules.",
        "Only if the string is long does not satisfy the stated requirement. HTML, URL, attribute and script contexts have different interpretation rules.",
        "Only if CSS is disabled does not satisfy the stated requirement. HTML, URL, attribute and script contexts have different interpretation rules."
      ],
      [
        "What should sanitize intentionally supported rich HTML?",
        "A maintained HTML sanitizer",
        "A regex removing script tag names",
        "An HTML parser with no safety policy",
        "URL encoding the entire document",
        "Robust sanitization needs a suitable parser and maintained allowlist policy.",
        "Tag-name removal misses executable attributes, URL schemes and parser edge cases.",
        "Parsing produces a document structure but does not apply a safe-content allowlist.",
        "URL encoding is not a policy for safely preserving intentionally supported HTML."
      ],
      [
        "A customer message contains <img onerror=...>. What should plain-message rendering do?",
        "Display it as text",
        "Insert it using innerHTML",
        "Run it after validation",
        "Move it into a script tag",
        "Plain-text content should not become executable markup.",
        "Insert it using innerHTML does not satisfy the stated requirement. Plain-text content should not become executable markup.",
        "Run it after validation does not satisfy the stated requirement. Plain-text content should not become executable markup.",
        "Move it into a script tag does not satisfy the stated requirement. Plain-text content should not become executable markup."
      ],
      [
        "A rich-text field removes only literal <script> tags. What remains concerning?",
        "Other executable HTML contexts",
        "Only external script tag sources",
        "Only mismatched closing HTML tags",
        "Only tags with lowercase names",
        "XSS can use many contexts beyond literal script elements.",
        "External script tags are only one path; handlers and unsafe URLs can also execute.",
        "Well-formed markup can contain executable attributes or dangerous URLs.",
        "Changing case does not provide a robust parser-aware safety policy."
      ],
      [
        "A user-supplied link starts with javascript:. Which policy is needed?",
        "An allowed URL-scheme policy",
        "Only HTML entity encoding of text",
        "Only adding target=_blank to links",
        "Only trimming surrounding whitespace",
        "Dangerous schemes must be rejected according to the navigation policy.",
        "Text encoding alone does not decide whether a URL scheme may execute code.",
        "A new browsing target does not make a javascript URL an acceptable destination.",
        "Whitespace trimming does not restrict the destination's scheme."
      ],
      [
        "A framework normally escapes text but a developer uses its raw-HTML escape hatch. What must be reviewed?",
        "HTML trust and sanitizer boundaries",
        "Only the framework's default escaping",
        "Only the response's valid JSON shape",
        "Only the route's authenticated state",
        "Raw HTML insertion bypasses the ordinary text-escaping protection.",
        "Raw-HTML insertion bypasses the normal escaped-text path.",
        "Valid JSON can contain a malicious HTML string.",
        "Authentication does not make all supplied HTML trusted."
      ],
      [
        "The URL fixture rejects javascript:. What is not proven?",
        "All DOM sinks are safe",
        "The parser\u2019s protocol result",
        "The HTTPS branch output",
        "The two boolean outputs",
        "A URL allow decision is not an HTML sanitization or rendering audit.",
        "The parser\u2019s protocol result does not satisfy the stated requirement. A URL allow decision is not an HTML sanitization or rendering audit.",
        "The HTTPS branch output does not satisfy the stated requirement. A URL allow decision is not an HTML sanitization or rendering audit.",
        "The two boolean outputs does not satisfy the stated requirement. A URL allow decision is not an HTML sanitization or rendering audit."
      ]
    ],
    "mistakes": [
      "Treating a script-tag regex as a sanitizer.",
      "Assuming framework text escaping covers raw HTML APIs."
    ],
    "takeaways": [
      "Match safe handling to the exact output context.",
      "Keep plain text separate from executable markup."
    ],
    "prerequisite_note": "JavaScript DOM and Async is the canonical prerequisite. Review promises, fetch, DOM text handling and event listeners. Here the new boundaries are status/data contracts, request ownership, browser credentials and server-enforced security; synthetic JavaScript fixtures do not replace browser or security integration tests."
  },
  {
    "id": "security-csrf-cors",
    "comp": "m3.c1",
    "title": "Distinguish forged requests from cross-origin reading",
    "introduction": "A malicious page submits a transfer form to a bank where the victim is signed in. The attacker does not need to read the response for the transfer to cause harm.",
    "sections": [
      {
        "heading": "Distinguish forged requests from cross-origin reading",
        "paragraphs": [
          "CSRF exploits a browser\u2019s ability to send ambient credentials with an unwanted state-changing request. A defense may combine appropriate SameSite cookies, server-validated anti-CSRF tokens and request origin checks under a deliberate architecture. Tokens must be bound and verified according to the server design; a hidden field with no validation is only decoration. GET should not perform state-changing operations.",
          "CORS primarily controls which cross-origin responses browser scripts may read. A browser can still send some cross-origin requests without a preflight, such as ordinary form submissions using safelisted content types. Blocking the attacker\u2019s ability to read the response does not undo a server-side transfer. Server permissions and CSRF defenses therefore remain necessary even with strict allowed origins."
        ]
      },
      {
        "heading": "Work through the decision and its limits",
        "paragraphs": [
          "XSS can undermine many CSRF defenses by acting inside the trusted origin and accessing tokens available to script. This does not make CSRF protection pointless; it means the defenses address distinct attack paths and should be layered. Cookie SameSite policies help but have context and compatibility details, so avoid presenting a single attribute as a universal complete solution.",
          "The fixture evaluates a narrow synthetic server rule requiring an expected origin and matching CSRF token before a write. It is not a production CSRF library, browser cookie simulation or cryptographic token generator. It demonstrates server-side rejection conditions; deployment requires an appropriate framework defense and tests covering relevant navigation and request contexts."
        ]
      }
    ],
    "worked": {
      "lang": "javascript",
      "code": "function allowWrite(origin,token){return origin===\"https://app.example.test\"&&token===\"synthetic-token\";}\nconsole.log(allowWrite(\"https://evil.example.test\",\"synthetic-token\"));\nconsole.log(allowWrite(\"https://app.example.test\",\"synthetic-token\"));",
      "expect": "false\ntrue",
      "problem": "Distinguish forged requests from cross-origin reading",
      "steps": [
        "Identify the explicit inputs and trust boundary.",
        "Trace the code\u2019s state or validation decision.",
        "Compare the output and identify omitted browser or server behavior."
      ],
      "explanation": "The fixture evaluates a narrow synthetic server rule requiring an expected origin and matching CSRF token before a write. It is not a production CSRF library, browser cookie simulation or cryptographic token generator. It demonstrates server-side rejection conditions; deployment requires an appropriate framework defense and tests covering relevant navigation and request contexts."
    },
    "quiz": [
      [
        "What is a central CSRF concern?",
        "Unwanted authenticated writes",
        "Only reading a public stylesheet",
        "Only a slow image decode",
        "Only a missing font fallback",
        "CSRF can cause a browser to send ambient credentials for an unwanted state-changing action.",
        "Only reading a public stylesheet does not satisfy the stated requirement. CSRF can cause a browser to send ambient credentials for an unwanted state-changing action.",
        "Only a slow image decode does not satisfy the stated requirement. CSRF can cause a browser to send ambient credentials for an unwanted state-changing action.",
        "Only a missing font fallback does not satisfy the stated requirement. CSRF can cause a browser to send ambient credentials for an unwanted state-changing action."
      ],
      [
        "Does blocked response reading guarantee no server effect?",
        "No, a request may still act",
        "Yes, CORS always rolls back writes",
        "Only if a form has a label",
        "Only if the server uses JSON",
        "Response access restrictions do not establish that the server did not process a request.",
        "Yes, CORS always rolls back writes does not satisfy the stated requirement. Response access restrictions do not establish that the server did not process a request.",
        "Only if a form has a label does not satisfy the stated requirement. Response access restrictions do not establish that the server did not process a request.",
        "Only if the server uses JSON does not satisfy the stated requirement. Response access restrictions do not establish that the server did not process a request."
      ],
      [
        "Where must a CSRF token be validated?",
        "At the server boundary",
        "Only in a CSS selector",
        "Only in a hidden field label",
        "Only in a client route title",
        "A token provides protection only when the trusted server validates the required relationship.",
        "Only in a CSS selector does not satisfy the stated requirement. A token provides protection only when the trusted server validates the required relationship.",
        "Only in a hidden field label does not satisfy the stated requirement. A token provides protection only when the trusted server validates the required relationship.",
        "Only in a client route title does not satisfy the stated requirement. A token provides protection only when the trusted server validates the required relationship."
      ],
      [
        "A bank changes balances on GET. What design should be corrected?",
        "State changes must avoid GET",
        "Only the page\u2019s image size",
        "Only its border color",
        "Only its text alignment",
        "Safe method semantics should not perform account-changing operations.",
        "Only the page\u2019s image size does not satisfy the stated requirement. Safe method semantics should not perform account-changing operations.",
        "Only its border color does not satisfy the stated requirement. Safe method semantics should not perform account-changing operations.",
        "Only its text alignment does not satisfy the stated requirement. Safe method semantics should not perform account-changing operations."
      ],
      [
        "An attacker submits a cross-site form and cannot read the reply. Why can it still be dangerous?",
        "The write may already occur",
        "The form automatically gets admin",
        "CORS decrypts the session",
        "JSON always executes scripts",
        "CSRF harm can be the server-side action, not response disclosure.",
        "The form automatically gets admin does not satisfy the stated requirement. CSRF harm can be the server-side action, not response disclosure.",
        "CORS decrypts the session does not satisfy the stated requirement. CSRF harm can be the server-side action, not response disclosure.",
        "JSON always executes scripts does not satisfy the stated requirement. CSRF harm can be the server-side action, not response disclosure."
      ],
      [
        "A hidden csrf field is accepted without checking its value. What is missing?",
        "Actual server token validation",
        "Only a longer field name",
        "Only a different input type",
        "Only a stronger CSS selector",
        "Unvalidated form content does not prove a trusted request.",
        "Only a longer field name does not satisfy the stated requirement. Unvalidated form content does not prove a trusted request.",
        "Only a different input type does not satisfy the stated requirement. Unvalidated form content does not prove a trusted request.",
        "Only a stronger CSS selector does not satisfy the stated requirement. Unvalidated form content does not prove a trusted request."
      ],
      [
        "A team treats SameSite as a complete XSS defense. What is wrong?",
        "It controls cookie sending",
        "It sanitizes rich-text input",
        "It blocks executable DOM sinks",
        "It validates third-party scripts",
        "SameSite concerns cookie sending and does not prevent trusted-origin script execution.",
        "SameSite does not sanitize HTML content before insertion.",
        "Cookie sending restrictions do not repair an executable DOM sink.",
        "A cookie attribute does not validate the behavior of included scripts."
      ],
      [
        "The origin/token model accepts its synthetic case. What needs specialist implementation?",
        "Real token lifecycle and binding",
        "The fixture's origin comparison",
        "The model's boolean conjunction",
        "The printed acceptance result",
        "A fixed token equality model is not a secure token system.",
        "The model already compares the supplied literal origin values.",
        "The conjunction is local logic rather than a deployed token lifecycle.",
        "A printed true value is already observed and does not prove production binding."
      ]
    ],
    "mistakes": [
      "Using CORS response restrictions as a complete CSRF defense.",
      "Checking only token presence rather than validity."
    ],
    "takeaways": [
      "Separate request effects from response reading.",
      "Apply server-validated layered request defenses."
    ],
    "prerequisite_note": "JavaScript DOM and Async is the canonical prerequisite. Review promises, fetch, DOM text handling and event listeners. Here the new boundaries are status/data contracts, request ownership, browser credentials and server-enforced security; synthetic JavaScript fixtures do not replace browser or security integration tests."
  },
  {
    "id": "security-csp-scripts",
    "comp": "m3.c2",
    "title": "Constrain script execution and third-party authority",
    "introduction": "An analytics widget is added to a billing page. A script inclusion gives code powerful access to the page, so review must consider authority as well as functionality.",
    "sections": [
      {
        "heading": "Constrain script execution and third-party authority",
        "paragraphs": [
          "Content-Security-Policy can restrict allowed resource and script execution sources. Prefer a deliberately restrictive script policy using reviewed nonce or hash mechanisms where suitable. A nonce must be unpredictable and fresh under the intended response design, and an allowed inline script must carry the matching nonce. unsafe-inline or broad allowlists can substantially weaken the intended protection; report-only policy is useful for observation but does not block violations.",
          "CSP is defense in depth, not an authorization system or a substitute for safe sinks. A permitted script can still misuse its legitimate authority. Report collection can identify unexpected dependencies, but reports need privacy-conscious handling and absence of reports does not prove the application has no vulnerabilities. Roll out with known flows and evaluate violations before enforcing a policy that could break critical interactions."
        ]
      },
      {
        "heading": "Work through the decision and its limits",
        "paragraphs": [
          "Third-party scripts generally execute with the embedding page\u2019s origin privileges unless isolated by an appropriate architecture. Subresource Integrity can verify an expected fetched resource hash, with suitable cross-origin setup, but it does not prove that the code is benign. Pin versions, review permissions and update policy, and consider sandboxed cross-origin frames or removing the dependency when that better fits the trust model.",
          "The fixture models the distinction between report-only and enforcing policy outcomes using supplied booleans. It does not create real CSP headers, validate nonces or fetch a script with integrity. Browser integration should check actual header delivery, intended script execution and blocked cases while retaining safe handling of content and credentials."
        ]
      }
    ],
    "worked": {
      "lang": "javascript",
      "code": "for(const enforcing of [false,true])console.log(enforcing?\"violation blocked\":\"violation reported only\");\nconsole.log(\"integrity verifies bytes, not intent\");",
      "expect": "violation reported only\nviolation blocked\nintegrity verifies bytes, not intent",
      "problem": "Constrain script execution and third-party authority",
      "steps": [
        "Identify the explicit inputs and trust boundary.",
        "Trace the code\u2019s state or validation decision.",
        "Compare the output and identify omitted browser or server behavior."
      ],
      "explanation": "The fixture models the distinction between report-only and enforcing policy outcomes using supplied booleans. It does not create real CSP headers, validate nonces or fetch a script with integrity. Browser integration should check actual header delivery, intended script execution and blocked cases while retaining safe handling of content and credentials."
    },
    "quiz": [
      [
        "Does CSP report-only block violations?",
        "No, it only reports",
        "Yes, it blocks inline execution",
        "Yes, it blocks external scripts",
        "No, it removes all script tags",
        "Report-only observes violations but does not enforce the blocking policy.",
        "Report-only records inline violations without blocking them.",
        "Report-only does not enforce external-script restrictions either.",
        "A reporting policy does not remove script elements from the page."
      ],
      [
        "What can Subresource Integrity verify?",
        "Expected resource bytes",
        "That code has benign intent",
        "The user\u2019s account permission",
        "Every transitive dependency",
        "Integrity checks compare fetched content with an expected digest rather than auditing behavior.",
        "That code has benign intent does not satisfy the stated requirement. Integrity checks compare fetched content with an expected digest rather than auditing behavior.",
        "The user\u2019s account permission does not satisfy the stated requirement. Integrity checks compare fetched content with an expected digest rather than auditing behavior.",
        "Every transitive dependency does not satisfy the stated requirement. Integrity checks compare fetched content with an expected digest rather than auditing behavior."
      ],
      [
        "What authority can a normal third-party script receive?",
        "Access within the embedding page",
        "Only its own stylesheet text",
        "Only its download hostname",
        "No access to page state",
        "A regular script can execute with the page\u2019s origin privileges.",
        "Only its own stylesheet text does not satisfy the stated requirement. A regular script can execute with the page\u2019s origin privileges.",
        "Only its download hostname does not satisfy the stated requirement. A regular script can execute with the page\u2019s origin privileges.",
        "No access to page state does not satisfy the stated requirement. A regular script can execute with the page\u2019s origin privileges."
      ],
      [
        "A CSP uses the same public nonce forever. What should be corrected?",
        "Fresh unpredictable nonces",
        "Only a longer fixed public nonce",
        "Only moving the nonce into HTML",
        "Only hiding the CSP header name",
        "A nonce should meet the intended unpredictable per-response execution authorization design.",
        "A longer predictable public constant remains reusable by an attacker.",
        "Nonces appear in HTML intentionally; their unpredictability and per-response freshness matter.",
        "Header-name concealment does not create a secure nonce lifecycle."
      ],
      [
        "A team adds unsafe-inline to silence all violations. What should review examine?",
        "Weakened execution restrictions",
        "Only the number of violation events",
        "Only the reporting endpoint latency",
        "Only the script compression ratio",
        "Unsafe-inline can undermine a script restriction strategy depending on the policy context.",
        "Fewer reports may result from weaker protection rather than safer code.",
        "Reporting latency does not establish whether unsafe-inline weakens execution control.",
        "Compression has no bearing on the policy's inline-script restrictions."
      ],
      [
        "A pinned analytics script passes integrity but sends private form data. What did integrity not establish?",
        "Trustworthy script behavior",
        "The matched resource bytes",
        "The presence of a hash",
        "The compared download content",
        "Byte identity cannot certify that the expected code behaves appropriately.",
        "The matched resource bytes does not satisfy the stated requirement. Byte identity cannot certify that the expected code behaves appropriately.",
        "The presence of a hash does not satisfy the stated requirement. Byte identity cannot certify that the expected code behaves appropriately.",
        "The compared download content does not satisfy the stated requirement. Byte identity cannot certify that the expected code behaves appropriately."
      ],
      [
        "An application has CSP but inserts raw attacker HTML. Which fix remains necessary?",
        "Repair the unsafe rendering sink",
        "Remove all server permissions",
        "Allow every remote script",
        "Trust every policy report",
        "CSP adds a layer and does not justify unsafe content handling.",
        "Remove all server permissions does not satisfy the stated requirement. CSP adds a layer and does not justify unsafe content handling.",
        "Allow every remote script does not satisfy the stated requirement. CSP adds a layer and does not justify unsafe content handling.",
        "Trust every policy report does not satisfy the stated requirement. CSP adds a layer and does not justify unsafe content handling."
      ],
      [
        "The fixture prints violation blocked. What still requires a browser?",
        "Actual policy header enforcement",
        "The boolean branch selection",
        "The final printed sentence",
        "The supplied false value",
        "The model does not deliver or enforce real CSP headers.",
        "The boolean branch selection does not satisfy the stated requirement. The model does not deliver or enforce real CSP headers.",
        "The final printed sentence does not satisfy the stated requirement. The model does not deliver or enforce real CSP headers.",
        "The supplied false value does not satisfy the stated requirement. The model does not deliver or enforce real CSP headers."
      ]
    ],
    "mistakes": [
      "Treating report-only as blocking protection.",
      "Confusing byte integrity with benign code behavior."
    ],
    "takeaways": [
      "Review third-party authority before inclusion.",
      "Enforce CSP as one layer alongside safe sinks."
    ],
    "prerequisite_note": "JavaScript DOM and Async is the canonical prerequisite. Review promises, fetch, DOM text handling and event listeners. Here the new boundaries are status/data contracts, request ownership, browser credentials and server-enforced security; synthetic JavaScript fixtures do not replace browser or security integration tests."
  }
],[
  {
    "id": "security-fetch",
    "title": "MDN: Using Fetch",
    "url": "https://github.com/mdn/content/blob/33afe694c61ec6a36bf2e363124c1210b25a5c0f/files/en-us/web/api/fetch_api/using_fetch/index.md",
    "source": {
      "repo": "mdn/content",
      "commit": "33afe694c61ec6a36bf2e363124c1210b25a5c0f",
      "path": "files/en-us/web/api/fetch_api/using_fetch/index.md",
      "verification": "Official source inspected at pinned commit; examples explicitly identify their execution boundary."
    }
  },
  {
    "id": "security-csp",
    "title": "MDN: CSP header",
    "url": "https://github.com/mdn/content/blob/33afe694c61ec6a36bf2e363124c1210b25a5c0f/files/en-us/web/http/reference/headers/content-security-policy/index.md",
    "source": {
      "repo": "mdn/content",
      "commit": "33afe694c61ec6a36bf2e363124c1210b25a5c0f",
      "path": "files/en-us/web/http/reference/headers/content-security-policy/index.md",
      "verification": "Official source inspected at pinned commit; examples explicitly identify their execution boundary."
    }
  },
  {
    "id": "security-cors",
    "title": "MDN: CORS",
    "url": "https://github.com/mdn/content/blob/33afe694c61ec6a36bf2e363124c1210b25a5c0f/files/en-us/web/http/guides/cors/index.md",
    "source": {
      "repo": "mdn/content",
      "commit": "33afe694c61ec6a36bf2e363124c1210b25a5c0f",
      "path": "files/en-us/web/http/guides/cors/index.md",
      "verification": "Official source inspected at pinned commit; examples explicitly identify their execution boundary."
    }
  },
  {
    "id": "security-cookies",
    "title": "MDN: Cookies",
    "url": "https://github.com/mdn/content/blob/33afe694c61ec6a36bf2e363124c1210b25a5c0f/files/en-us/web/http/guides/cookies/index.md",
    "source": {
      "repo": "mdn/content",
      "commit": "33afe694c61ec6a36bf2e363124c1210b25a5c0f",
      "path": "files/en-us/web/http/guides/cookies/index.md",
      "verification": "Official source inspected at pinned commit; examples explicitly identify their execution boundary."
    }
  }
]);
