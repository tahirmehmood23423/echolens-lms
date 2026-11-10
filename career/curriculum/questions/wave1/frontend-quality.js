'use strict';
const {bank}=require('../../learning/wave1/web-helper');
module.exports=bank("frontend-quality",[
  {
    "comp": "m1.c1",
    "rows": [
      [
        "What supports predictable native keyboard activation?",
        "A semantic native control",
        "A focusable div with a click handler",
        "A span with role=button alone",
        "An anchor without an href attribute",
        "Native controls provide established keyboard interaction for their semantics.",
        "Focusability and a click handler do not supply the full native keyboard activation contract.",
        "Role=button changes semantics without automatically adding keyboard behavior.",
        "An anchor without href does not provide the expected native link navigation behavior."
      ],
      [
        "What does removing outline without replacement risk?",
        "Hiding keyboard focus",
        "Increasing every hit target",
        "Improving the tab order",
        "Adding a form label",
        "Focus indication can disappear even though the control remains focusable.",
        "Increasing every hit target does not satisfy the stated requirement. Focus indication can disappear even though the control remains focusable.",
        "Improving the tab order does not satisfy the stated requirement. Focus indication can disappear even though the control remains focusable.",
        "Adding a form label does not satisfy the stated requirement. Focus indication can disappear even though the control remains focusable."
      ],
      [
        "What should a modal supply beyond an ARIA role?",
        "Its required focus behavior",
        "Only the aria-modal attribute",
        "Only a role=dialog snapshot",
        "Only a visually centered overlay",
        "Roles describe semantics but do not implement the modal interaction contract.",
        "Aria-modal describes modality but does not implement focus entry, containment or return.",
        "A role snapshot cannot verify focus behavior during interaction.",
        "Visual centering does not make a dialog operable with a keyboard."
      ],
      [
        "A keyboard user reaches a payment dialog but cannot close it. What is the release blocker?",
        "An incomplete keyboard escape path",
        "Only a longer entry animation delay",
        "Only an uncached decorative image",
        "Only a delayed analytics request",
        "The dialog must provide an appropriate operable close and recovery path.",
        "Decorative entry timing does not repair the missing keyboard close path.",
        "An uncached decorative image does not explain inability to dismiss the dialog.",
        "Analytics completion should not determine whether the user can escape a payment dialog."
      ],
      [
        "A desktop layout visually moves Submit before all fields. What should review compare?",
        "DOM order and visual task order",
        "Only the computed grid column widths",
        "Only the alignment of form field labels",
        "Only the number of visible form fields",
        "Visual movement can create a confusing mismatch with keyboard and reading order.",
        "Track widths do not expose the mismatch between visual sequence and document order.",
        "Aligned labels do not establish the task's keyboard or reading sequence.",
        "Counting fields omits their placement relative to Submit in the DOM."
      ],
      [
        "A custom control adds tabindex=0 but still ignores Enter and Space. What remains missing?",
        "Appropriate activation behavior",
        "Only the presence of a tabindex value",
        "Only the accessible name's spelling",
        "Only the element's pointer styling",
        "Focusable does not mean correctly operable; semantic control behavior still matters.",
        "Tabindex makes a control focusable without adding Enter and Space activation.",
        "An accessible name identifies the control but does not implement its activation behavior.",
        "Pointer styling does not create keyboard event handling."
      ],
      [
        "A form failure sends focus to a random header. Which alternative helps recovery?",
        "A deliberate error and field strategy",
        "Always send focus back to the submit button",
        "Always clear every field before retrying",
        "Always focus the page title after a failure",
        "Focus movement and announced errors should support the next corrective task.",
        "The submit button alone may not direct users to the relevant error and field.",
        "Clearing every field can lose correct work and impede recovery.",
        "A generic page-title focus target can omit the specific error and required correction."
      ],
      [
        "A modal traps focus after it closes. What lifecycle defect is likely?",
        "Containment cleanup is incomplete",
        "The image is too compressed",
        "The route title is too short",
        "The success response is empty",
        "Temporary focus containment must be removed when the modal interaction ends.",
        "The image is too compressed does not satisfy the stated requirement. Temporary focus containment must be removed when the modal interaction ends.",
        "The route title is too short does not satisfy the stated requirement. Temporary focus containment must be removed when the modal interaction ends.",
        "The success response is empty does not satisfy the stated requirement. Temporary focus containment must be removed when the modal interaction ends."
      ],
      [
        "A keyboard smoke test activates only the first button. What coverage should be added?",
        "The complete critical journey",
        "Only another first-button test",
        "Only a static screenshot",
        "Only a CSS variable assertion",
        "Users must complete the full flow including failure recovery, not merely reach one control.",
        "Only another first-button test does not satisfy the stated requirement. Users must complete the full flow including failure recovery, not merely reach one control.",
        "Only a static screenshot does not satisfy the stated requirement. Users must complete the full flow including failure recovery, not merely reach one control.",
        "Only a CSS variable assertion does not satisfy the stated requirement. Users must complete the full flow including failure recovery, not merely reach one control."
      ],
      [
        "An audit uses array order as proof of accessibility. What evidence must supplement it?",
        "Rendered keyboard and human review",
        "Only another correctly ordered data array",
        "Only a successful build of the component",
        "Only a snapshot of the authored markup",
        "Actual focus behavior, perception and task comprehension exceed the local sequence model.",
        "Another array remains a data model rather than a rendered keyboard journey.",
        "A successful component build does not exercise focus or interaction.",
        "Authored markup snapshots do not establish live keyboard operation or human usability."
      ]
    ]
  },
  {
    "comp": "m1.c2",
    "rows": [
      [
        "What is the strongest default when HTML supplies the desired semantics?",
        "Use the native element",
        "Replace it with a generic div",
        "Add every possible ARIA role",
        "Hide it from accessibility tools",
        "Native elements often supply matching semantics and interaction with fewer custom responsibilities.",
        "Replace it with a generic div does not satisfy the stated requirement. Native elements often supply matching semantics and interaction with fewer custom responsibilities.",
        "Add every possible ARIA role does not satisfy the stated requirement. Native elements often supply matching semantics and interaction with fewer custom responsibilities.",
        "Hide it from accessibility tools does not satisfy the stated requirement. Native elements often supply matching semantics and interaction with fewer custom responsibilities."
      ],
      [
        "What does aria-label primarily contribute?",
        "An accessible name",
        "Automatic keyboard event handling",
        "An API access permission",
        "A focus containment algorithm",
        "Aria-label participates in accessible naming rather than implementing interaction.",
        "Automatic keyboard event handling does not satisfy the stated requirement. Aria-label participates in accessible naming rather than implementing interaction.",
        "An API access permission does not satisfy the stated requirement. Aria-label participates in accessible naming rather than implementing interaction.",
        "A focus containment algorithm does not satisfy the stated requirement. Aria-label participates in accessible naming rather than implementing interaction."
      ],
      [
        "Why must ARIA state update with UI state?",
        "To avoid misleading semantic exposure",
        "To make keyboard handlers unnecessary",
        "To replace all visible state indicators",
        "To ensure every panel remains focusable",
        "Assistive technology should receive a truthful description of the control’s current state.",
        "ARIA state does not implement the component's keyboard handlers.",
        "Semantic state should agree with visible state rather than replace visible indicators.",
        "Expanded-state exposure does not by itself make every panel focusable."
      ],
      [
        "A custom button has role and a name but cannot receive focus. What is incomplete?",
        "The operable interaction design",
        "Only its semantic role spelling",
        "Only its visible label text",
        "Only its icon dimensions",
        "Semantics alone do not provide focus and activation behavior.",
        "Only its semantic role spelling does not satisfy the stated requirement. Semantics alone do not provide focus and activation behavior.",
        "Only its visible label text does not satisfy the stated requirement. Semantics alone do not provide focus and activation behavior.",
        "Only its icon dimensions does not satisfy the stated requirement. Semantics alone do not provide focus and activation behavior."
      ],
      [
        "A native button is assigned a conflicting role to satisfy a lint rule. Which review is needed?",
        "Whether the added semantics are valid",
        "Only whether the custom role passes lint",
        "Only whether the button still looks native",
        "Only whether the click handler still runs",
        "ARIA should improve accurate meaning rather than contradict the native control.",
        "Passing lint alone does not prove a role is valid for the native element.",
        "A native appearance can coexist with conflicting exposed semantics.",
        "A working click handler does not establish the correctness of the accessibility role."
      ],
      [
        "A disclosure\u2019s icon rotates but its expanded state remains false. What should the test assert?",
        "Visible and semantic state agree",
        "Only the transform angle",
        "Only the internal boolean name",
        "Only the component\u2019s file path",
        "User-facing state includes both displayed content and exposed control state.",
        "Only the transform angle does not satisfy the stated requirement. User-facing state includes both displayed content and exposed control state.",
        "Only the internal boolean name does not satisfy the stated requirement. User-facing state includes both displayed content and exposed control state.",
        "Only the component\u2019s file path does not satisfy the stated requirement. User-facing state includes both displayed content and exposed control state."
      ],
      [
        "A label reference combines two distant texts into a confusing name. What should guide the repair?",
        "A concise purpose-matching name",
        "Only adding more ids",
        "Only a larger font",
        "Only longer reference strings",
        "Resolved references must still produce a useful, coherent accessible name.",
        "Only adding more ids does not satisfy the stated requirement. Resolved references must still produce a useful, coherent accessible name.",
        "Only a larger font does not satisfy the stated requirement. Resolved references must still produce a useful, coherent accessible name.",
        "Only longer reference strings does not satisfy the stated requirement. Resolved references must still produce a useful, coherent accessible name."
      ],
      [
        "A component library claims tabs support after role snapshots pass. Which evidence is missing?",
        "Keyboard and selection behavior",
        "Only the attributes\u2019 byte count",
        "Only a second role snapshot",
        "Only the package\u2019s download count",
        "Tabs require an interaction contract beyond static semantic attributes.",
        "Only the attributes\u2019 byte count does not satisfy the stated requirement. Tabs require an interaction contract beyond static semantic attributes.",
        "Only a second role snapshot does not satisfy the stated requirement. Tabs require an interaction contract beyond static semantic attributes.",
        "Only the package\u2019s download count does not satisfy the stated requirement. Tabs require an interaction contract beyond static semantic attributes."
      ],
      [
        "A voice user sees Submit but its accessible name is Confirm payment now. Which issue deserves review?",
        "Visible-label naming consistency",
        "Only the card\u2019s shadow size",
        "Only the download compression",
        "Only server token expiration",
        "Accessible names should retain the visible wording needed to identify the control.",
        "Only the card\u2019s shadow size does not satisfy the stated requirement. Accessible names should retain the visible wording needed to identify the control.",
        "Only the download compression does not satisfy the stated requirement. Accessible names should retain the visible wording needed to identify the control.",
        "Only server token expiration does not satisfy the stated requirement. Accessible names should retain the visible wording needed to identify the control."
      ],
      [
        "A developer adds aria-hidden=true to an interactive subtree to silence an audit. What is dangerous?",
        "Focusable content may lose semantic exposure",
        "The subtree is removed from the visual layout",
        "All descendants are removed from tab order",
        "The element gains automatic focus containment",
        "Hiding focusable interactive content from accessibility exposure can create unusable controls.",
        "Aria-hidden affects accessibility exposure rather than removing visible layout.",
        "Aria-hidden does not automatically remove descendants from keyboard tab order.",
        "The attribute does not implement focus containment."
      ]
    ]
  },
  {
    "comp": "m2.c1",
    "rows": [
      [
        "What should a component test usually observe after an action?",
        "A meaningful user-facing result",
        "Only the hook\u2019s local name",
        "Only a generated style id",
        "Only the component filename",
        "Behavioral results make the test resilient to internal refactors that preserve the contract.",
        "Only the hook\u2019s local name does not satisfy the stated requirement. Behavioral results make the test resilient to internal refactors that preserve the contract.",
        "Only a generated style id does not satisfy the stated requirement. Behavioral results make the test resilient to internal refactors that preserve the contract.",
        "Only the component filename does not satisfy the stated requirement. Behavioral results make the test resilient to internal refactors that preserve the contract."
      ],
      [
        "What is the subject of a pure unit test?",
        "A bounded function contract",
        "Every deployed user journey",
        "The whole browser network",
        "All assistive technology behavior",
        "A unit test establishes focused evidence at its declared boundary.",
        "Every deployed user journey does not satisfy the stated requirement. A unit test establishes focused evidence at its declared boundary.",
        "The whole browser network does not satisfy the stated requirement. A unit test establishes focused evidence at its declared boundary.",
        "All assistive technology behavior does not satisfy the stated requirement. A unit test establishes focused evidence at its declared boundary."
      ],
      [
        "What should asynchronous assertions wait for?",
        "A relevant condition within a bound",
        "A mandatory ten-second sleep",
        "The test runner\u2019s wall clock only",
        "A random timeout value",
        "Condition-based waits align synchronization with the behavior under test.",
        "A mandatory ten-second sleep does not satisfy the stated requirement. Condition-based waits align synchronization with the behavior under test.",
        "The test runner\u2019s wall clock only does not satisfy the stated requirement. Condition-based waits align synchronization with the behavior under test.",
        "A random timeout value does not satisfy the stated requirement. Condition-based waits align synchronization with the behavior under test."
      ],
      [
        "A refactor renames local state but preserves all UI behavior and breaks many tests. What likely went wrong?",
        "Tests depended on internal structure",
        "The user contract necessarily changed",
        "Every refactor needs more snapshots",
        "The API is now forbidden",
        "Tests coupled to private implementation can fail on behavior-preserving changes.",
        "The user contract necessarily changed does not satisfy the stated requirement. Tests coupled to private implementation can fail on behavior-preserving changes.",
        "Every refactor needs more snapshots does not satisfy the stated requirement. Tests coupled to private implementation can fail on behavior-preserving changes.",
        "The API is now forbidden does not satisfy the stated requirement. Tests coupled to private implementation can fail on behavior-preserving changes."
      ],
      [
        "A test asserts Loading appears but never verifies it disappears. Which bug can escape?",
        "A permanently pending interface",
        "A wrongly compressed image only",
        "An incorrectly named test file",
        "A missing package comment",
        "State transitions need completion and recovery assertions, not just initial-state checks.",
        "A wrongly compressed image only does not satisfy the stated requirement. State transitions need completion and recovery assertions, not just initial-state checks.",
        "An incorrectly named test file does not satisfy the stated requirement. State transitions need completion and recovery assertions, not just initial-state checks.",
        "A missing package comment does not satisfy the stated requirement. State transitions need completion and recovery assertions, not just initial-state checks."
      ],
      [
        "A mock returns success without checking the submitted payload. What can still be wrong?",
        "The request data contract",
        "Only the mock\u2019s return syntax",
        "Only the test folder path",
        "Only the heading text size",
        "A user-visible success fixture can conceal an incorrect payload unless the seam validates it.",
        "Only the mock\u2019s return syntax does not satisfy the stated requirement. A user-visible success fixture can conceal an incorrect payload unless the seam validates it.",
        "Only the test folder path does not satisfy the stated requirement. A user-visible success fixture can conceal an incorrect payload unless the seam validates it.",
        "Only the heading text size does not satisfy the stated requirement. A user-visible success fixture can conceal an incorrect payload unless the seam validates it."
      ],
      [
        "A component suite shares mutable mock data across tests. What risk follows?",
        "Order-dependent results",
        "Guaranteed stronger coverage",
        "Automatic state isolation",
        "Mandatory server authorization",
        "Cross-test mutation can make outcomes depend on execution order.",
        "Guaranteed stronger coverage does not satisfy the stated requirement. Cross-test mutation can make outcomes depend on execution order.",
        "Automatic state isolation does not satisfy the stated requirement. Cross-test mutation can make outcomes depend on execution order.",
        "Mandatory server authorization does not satisfy the stated requirement. Cross-test mutation can make outcomes depend on execution order."
      ],
      [
        "A suite checks only snapshots of a disabled button. What behavior is still unproved?",
        "Actual duplicate-submit prevention",
        "The initial disabled attribute in markup",
        "The generated pending-state CSS class",
        "The existence of the saved snapshot file",
        "Static markup does not establish handler guards or interaction timing.",
        "Saved disabled markup does not prove handlers reject repeated submissions.",
        "A pending CSS class is presentation rather than duplicate-write prevention.",
        "A snapshot file's existence does not exercise live interactions."
      ],
      [
        "A test waits for success but ignores an intervening error announcement. What should improve?",
        "Assertions about relevant failure states",
        "Only increasing the maximum wait duration",
        "Only taking another success screenshot",
        "Only checking that the request was issued",
        "A meaningful contract includes error presentation and recovery when relevant.",
        "A longer timeout can still pass while an important error announcement goes unchecked.",
        "Another success screenshot omits transient or recovery failure behavior.",
        "A sent request does not establish how intermediate failures are communicated."
      ],
      [
        "A team calls pure function tests complete component evidence. Which validation closes the boundary?",
        "A real renderer interaction test",
        "Only another pure string check",
        "Only a type alias snapshot",
        "Only the unit file checksum",
        "Mounted behavior needs renderer or browser evidence beyond a local model.",
        "Only another pure string check does not satisfy the stated requirement. Mounted behavior needs renderer or browser evidence beyond a local model.",
        "Only a type alias snapshot does not satisfy the stated requirement. Mounted behavior needs renderer or browser evidence beyond a local model.",
        "Only the unit file checksum does not satisfy the stated requirement. Mounted behavior needs renderer or browser evidence beyond a local model."
      ]
    ]
  },
  {
    "comp": "m2.c2",
    "rows": [
      [
        "Which property makes journey tests reproducible?",
        "Independent controlled test state",
        "A shared real customer cart",
        "A dependency on yesterday\u2019s run",
        "An unbounded wait loop",
        "Controlled isolation avoids external state making outcomes unpredictable.",
        "A shared real customer cart does not satisfy the stated requirement. Controlled isolation avoids external state making outcomes unpredictable.",
        "A dependency on yesterday\u2019s run does not satisfy the stated requirement. Controlled isolation avoids external state making outcomes unpredictable.",
        "An unbounded wait loop does not satisfy the stated requirement. Controlled isolation avoids external state making outcomes unpredictable."
      ],
      [
        "What should a critical-flow suite include besides success?",
        "Relevant failure and recovery",
        "Only a second logo screenshot",
        "Only a minified bundle check",
        "Only another page title",
        "Users need the application to handle errors and allow corrective action.",
        "Only a second logo screenshot does not satisfy the stated requirement. Users need the application to handle errors and allow corrective action.",
        "Only a minified bundle check does not satisfy the stated requirement. Users need the application to handle errors and allow corrective action.",
        "Only another page title does not satisfy the stated requirement. Users need the application to handle errors and allow corrective action."
      ],
      [
        "What does a fully stubbed browser suite not establish?",
        "Real backend integration correctness",
        "The exercised UI branch behavior",
        "The configured mock response",
        "The browser\u2019s rendered result",
        "Stubs replace the backend and therefore cannot validate its actual behavior.",
        "The exercised UI branch behavior does not satisfy the stated requirement. Stubs replace the backend and therefore cannot validate its actual behavior.",
        "The configured mock response does not satisfy the stated requirement. Stubs replace the backend and therefore cannot validate its actual behavior.",
        "The browser\u2019s rendered result does not satisfy the stated requirement. Stubs replace the backend and therefore cannot validate its actual behavior."
      ],
      [
        "A checkout test clicks Buy and passes on a toast while the server returns 500. What should be asserted?",
        "The successful server-backed outcome",
        "Only the presence of a green success toast",
        "Only the number of dispatched click events",
        "Only a successful client route transition",
        "The claimed purchase requires verified successful persistence, not optimistic presentation alone.",
        "The toast is the misleading UI signal and cannot establish server success.",
        "A click count proves an input event rather than a completed purchase.",
        "A client navigation can occur even when the server rejects the order."
      ],
      [
        "A journey fails after a server deploy but all API stubs still return old shapes. What boundary is missing?",
        "Contract integration against real behavior",
        "Only another matching success-stub snapshot",
        "Only a second successful mock payload case",
        "Only a longer browser test timeout value",
        "Stale mocks can conceal actual response contract changes.",
        "A snapshot of an outdated stub continues to miss the changed server contract.",
        "Another mock payload does not validate deployed backend behavior.",
        "More waiting cannot make an obsolete response shape match the live server."
      ],
      [
        "A suite captures login request bodies in public screenshots. What should evidence handling do?",
        "Exclude credentials from artifacts",
        "Upload every body for convenience",
        "Use real customer identities",
        "Disable all failure reporting",
        "Useful diagnostics must avoid exposing secrets or unnecessary personal information.",
        "Upload every body for convenience does not satisfy the stated requirement. Useful diagnostics must avoid exposing secrets or unnecessary personal information.",
        "Use real customer identities does not satisfy the stated requirement. Useful diagnostics must avoid exposing secrets or unnecessary personal information.",
        "Disable all failure reporting does not satisfy the stated requirement. Useful diagnostics must avoid exposing secrets or unnecessary personal information."
      ],
      [
        "A payment error recovery test retries with a new logical operation id after uncertainty. What must be reviewed?",
        "Write idempotency and reconciliation",
        "Only re-enabling the retry button quickly",
        "Only replacing the pending-state message",
        "Only resetting the request timeout counter",
        "A retry test must preserve the server contract for uncertain write outcomes.",
        "Re-enabling the button does not resolve whether the earlier write committed.",
        "Pending-message changes do not preserve logical operation identity.",
        "Resetting a timeout counter does not prevent a duplicate write after an uncertain outcome."
      ],
      [
        "An end-to-end test passes only when another test runs first. Which defect should be fixed?",
        "Hidden setup dependency",
        "Only the screenshot format",
        "Only the browser window title",
        "Only the source map URL",
        "Each test needs explicit independent prerequisites rather than inherited side effects.",
        "Only the screenshot format does not satisfy the stated requirement. Each test needs explicit independent prerequisites rather than inherited side effects.",
        "Only the browser window title does not satisfy the stated requirement. Each test needs explicit independent prerequisites rather than inherited side effects.",
        "Only the source map URL does not satisfy the stated requirement. Each test needs explicit independent prerequisites rather than inherited side effects."
      ],
      [
        "A team retries every failing test five times and reports only eventual success. What should be investigated?",
        "The underlying nondeterminism",
        "Only the final green badge",
        "Only the test filename length",
        "Only the number of attempts",
        "Retries can mask flakiness and should not replace diagnosis of timing or state leaks.",
        "Only the final green badge does not satisfy the stated requirement. Retries can mask flakiness and should not replace diagnosis of timing or state leaks.",
        "Only the test filename length does not satisfy the stated requirement. Retries can mask flakiness and should not replace diagnosis of timing or state leaks.",
        "Only the number of attempts does not satisfy the stated requirement. Retries can mask flakiness and should not replace diagnosis of timing or state leaks."
      ],
      [
        "A release claims a complete checkout journey after testing only the cart page. Which evidence is missing?",
        "Submission and confirmation boundaries",
        "Only a screenshot of the populated cart",
        "Only a unit test for the subtotal function",
        "Only successful navigation to the cart URL",
        "A complete journey must reach and verify the task’s intended outcome.",
        "A populated cart image does not establish order submission or confirmation.",
        "Subtotal arithmetic is only one bounded part of checkout.",
        "Reaching the cart URL does not exercise the payment and confirmation boundaries."
      ]
    ]
  },
  {
    "comp": "m3.c1",
    "rows": [
      [
        "Which common good LCP threshold is relevant?",
        "At most 2.5 seconds",
        "At most 4 seconds",
        "At most 5 seconds",
        "At most 10 seconds",
        "LCP commonly uses a 2.5-second good threshold under the relevant field evaluation.",
        "Four seconds exceeds the commonly used good LCP threshold of 2.5 seconds.",
        "Five seconds is slower than the good LCP boundary.",
        "Ten seconds is far beyond the good LCP boundary."
      ],
      [
        "Which common good INP threshold is relevant?",
        "At most 200 milliseconds",
        "At most 500 milliseconds",
        "At most 1000 milliseconds",
        "At most 300 milliseconds",
        "INP commonly uses a 200ms good threshold under the relevant evaluation.",
        "Five hundred milliseconds exceeds the commonly used good INP threshold.",
        "One thousand milliseconds is a full second and exceeds the good INP boundary.",
        "Three hundred milliseconds is above the good INP threshold of 200 milliseconds."
      ],
      [
        "Which common good CLS threshold is relevant?",
        "At most 0.1",
        "At most 0.25",
        "At most 0.5",
        "At most 1.0",
        "CLS is a unitless shift metric with a common good threshold of 0.1.",
        "A CLS score of 0.25 exceeds the good boundary of 0.1.",
        "A score of 0.5 is greater instability than the good threshold permits.",
        "A score of 1.0 is not the commonly used good CLS boundary."
      ],
      [
        "A page has fast LCP but a slow filter interaction. What should be investigated independently?",
        "Main-thread interaction work",
        "Only the hero transfer size",
        "Only the image\u2019s alt text",
        "Only the initial HTML title",
        "Loading and responsiveness are different dimensions with distinct causes.",
        "Only the hero transfer size does not satisfy the stated requirement. Loading and responsiveness are different dimensions with distinct causes.",
        "Only the image\u2019s alt text does not satisfy the stated requirement. Loading and responsiveness are different dimensions with distinct causes.",
        "Only the initial HTML title does not satisfy the stated requirement. Loading and responsiveness are different dimensions with distinct causes."
      ],
      [
        "A release reduces average load time but worsens the intended tail percentile. What should acceptance consider?",
        "The target distribution criterion",
        "Only the reduced arithmetic mean value",
        "Only the single fastest supported device",
        "Only the improvement in the median value",
        "Averages cannot substitute for the required percentile and representative population.",
        "An improved mean can coexist with a worse target tail percentile.",
        "The fastest device does not represent the distribution acceptance targets.",
        "An improved median does not establish that the required tail percentile improved."
      ],
      [
        "A layout shift comes from a late inserted banner. Which repair targets the cause?",
        "Plan stable space or insertion behavior",
        "Only minify scripts used by the banner",
        "Only revalidate the banner's cached response",
        "Only compress the banner image further",
        "Stability depends on geometry changes, not merely transfer speed.",
        "Script minification does not reserve space for the late banner.",
        "Cache revalidation does not prevent an inserted banner from moving existing content.",
        "Image compression alone does not stabilize the banner's insertion geometry."
      ],
      [
        "A trace shows a large script task before click handling begins. Which INP part can this worsen?",
        "Input delay",
        "Only image source selection",
        "Only CSS color contrast",
        "Only request origin matching",
        "Busy main-thread work can postpone processing of the user\u2019s interaction.",
        "Only image source selection does not satisfy the stated requirement. Busy main-thread work can postpone processing of the user\u2019s interaction.",
        "Only CSS color contrast does not satisfy the stated requirement. Busy main-thread work can postpone processing of the user\u2019s interaction.",
        "Only request origin matching does not satisfy the stated requirement. Busy main-thread work can postpone processing of the user\u2019s interaction."
      ],
      [
        "A 2MB hero downloads quickly but waits to paint. Which phase should diagnosis inspect?",
        "Render delay after resource load",
        "Only DNS resolution before the transfer",
        "Only transfer size before decompression",
        "Only the connection handshake duration",
        "LCP can remain slow after transfer because rendering is blocked or delayed.",
        "DNS work occurs before the download and cannot explain the wait after completion.",
        "Transfer-size work is not the post-download wait before painting described here.",
        "The connection handshake precedes resource delivery rather than explaining subsequent render delay."
      ],
      [
        "A desktop lab score is used to declare every mobile user fast. What evidence is missing?",
        "Representative field segmentation",
        "Only a second desktop lab measurement",
        "Only a higher-resolution desktop capture",
        "Only the minimum observed request latency",
        "Different populations can have substantially different actual performance.",
        "Another desktop run does not supply evidence about mobile field users.",
        "Higher screenshot resolution does not measure real mobile performance.",
        "A minimum latency value omits device, network and experience distributions."
      ],
      [
        "A synthetic percentile fixture passes. What is needed before claiming a production improvement?",
        "Measured representative before/after data",
        "Only the model's expected percentile output",
        "Only a passing comparison to a fixed limit",
        "Only a successful deployment of the bundle",
        "A local calculation cannot establish user-impact changes without actual measurements.",
        "Correct synthetic output does not measure a live change in user experience.",
        "A fixed-threshold fixture uses supplied data rather than representative production observations.",
        "Deployment success does not establish a measured performance improvement."
      ]
    ]
  },
  {
    "comp": "m3.c2",
    "rows": [
      [
        "Why use a content fingerprint for immutable assets?",
        "Changed bytes receive a new URL",
        "It grants user permission",
        "It validates every API schema",
        "It removes all network failures",
        "Content-based URLs allow stable immutable versions without serving changed bytes under the same key.",
        "It grants user permission does not satisfy the stated requirement. Content-based URLs allow stable immutable versions without serving changed bytes under the same key.",
        "It validates every API schema does not satisfy the stated requirement. Content-based URLs allow stable immutable versions without serving changed bytes under the same key.",
        "It removes all network failures does not satisfy the stated requirement. Content-based URLs allow stable immutable versions without serving changed bytes under the same key."
      ],
      [
        "What does no-cache permit with revalidation?",
        "Stored response reuse after validation",
        "Never storing any part of the response",
        "Serving cached data without checking freshness",
        "Making every response permanently immutable",
        "No-cache requires validation before reuse rather than categorically forbidding storage.",
        "No-store, rather than no-cache, expresses a storage prohibition.",
        "No-cache requires validation before reuse rather than permitting unchecked stale reuse.",
        "Immutable has different semantics and does not describe no-cache revalidation."
      ],
      [
        "What can dynamic import enable?",
        "Deferred code loading",
        "Automatic benign dependencies",
        "Automatic server authorization",
        "Guaranteed zero execution cost",
        "Dynamic imports can defer module loading while retaining runtime and network tradeoffs.",
        "Automatic benign dependencies does not satisfy the stated requirement. Dynamic imports can defer module loading while retaining runtime and network tradeoffs.",
        "Automatic server authorization does not satisfy the stated requirement. Dynamic imports can defer module loading while retaining runtime and network tradeoffs.",
        "Guaranteed zero execution cost does not satisfy the stated requirement. Dynamic imports can defer module loading while retaining runtime and network tradeoffs."
      ],
      [
        "A deployment deletes previous assets immediately while caches hold old HTML. Which failure is likely?",
        "Broken references for older clients",
        "Automatic reload of every existing client",
        "Guaranteed reuse of the newest asset graph",
        "Automatic invalidation of every browser cache",
        "Earlier HTML can still request the removed fingerprinted resources.",
        "Deleting resources does not force existing clients to load compatible replacement HTML.",
        "Old HTML can still reference the deleted graph rather than the newest filenames.",
        "A server-side deletion does not invalidate every user's browser cache."
      ],
      [
        "A team sets immutable caching on changing HTML under one URL. What needs review?",
        "Fresh discovery of the asset graph",
        "Only the HTML\u2019s indentation",
        "Only the page\u2019s icon color",
        "Only the route\u2019s display title",
        "Clients need an appropriate way to discover current HTML and associated asset references.",
        "Only the HTML\u2019s indentation does not satisfy the stated requirement. Clients need an appropriate way to discover current HTML and associated asset references.",
        "Only the page\u2019s icon color does not satisfy the stated requirement. Clients need an appropriate way to discover current HTML and associated asset references.",
        "Only the route\u2019s display title does not satisfy the stated requirement. Clients need an appropriate way to discover current HTML and associated asset references."
      ],
      [
        "A dependency appears twice in the bundle graph. Which change could reduce work?",
        "Resolve unnecessary duplicate inclusion",
        "Only minify both dependency copies again",
        "Only rename one of the dependency modules",
        "Only split both copies into separate chunks",
        "Deduplication and dependency selection can reduce transfer and runtime overhead.",
        "Minifying both copies can leave duplicated execution and dependency weight.",
        "Renaming a module does not eliminate equivalent code included twice.",
        "Separating duplicated code into chunks can preserve the same unnecessary total work."
      ],
      [
        "A service worker keeps serving a broken release after rollback. What lifecycle coverage is missing?",
        "Cache update and rollback behavior",
        "Only testing on a fresh browser profile",
        "Only restoring the server's HTML response",
        "Only uploading the previous bundle again",
        "Client-side cache control adds an independent lifecycle that must be tested.",
        "A fresh profile omits the existing service worker and its stored release.",
        "Old server HTML may still be intercepted by a worker serving cached faulty assets.",
        "Uploading a prior bundle does not itself update or evict a service worker cache."
      ],
      [
        "A lazy chunk is fetched only after the user clicks, causing a long wait. What should the team evaluate?",
        "The split and prefetch tradeoff",
        "Only the number of emitted chunk filenames",
        "Only the time spent displaying the spinner",
        "Only the size of the initial HTML document",
        "Deferral can improve initial work while worsening later interaction if not balanced with likely demand.",
        "Counting filenames does not show when optional code should be discovered or prefetched.",
        "A spinner duration is a symptom rather than the splitting and discovery decision.",
        "Initial HTML size alone omits the delayed code fetch needed after interaction."
      ],
      [
        "A caching change improves speed but leaks one tenant\u2019s report to another. What takes priority?",
        "Correct private cache separation",
        "Only the improved byte count",
        "Only the higher cache hit rate",
        "Only the shorter request time",
        "Performance acceptance must retain authorization and privacy correctness.",
        "Only the improved byte count does not satisfy the stated requirement. Performance acceptance must retain authorization and privacy correctness.",
        "Only the higher cache hit rate does not satisfy the stated requirement. Performance acceptance must retain authorization and privacy correctness.",
        "Only the shorter request time does not satisfy the stated requirement. Performance acceptance must retain authorization and privacy correctness."
      ],
      [
        "A bundle optimization is accepted from file size alone. Which evidence would strengthen it?",
        "Measured loading and runtime outcomes",
        "Only the total number of emitted bundles",
        "Only the minifier's successful exit status",
        "Only comparing the compressed byte counts",
        "Real user-facing performance depends on transfer, execution and critical-path effects.",
        "Bundle count does not quantify transfer, parsing or runtime behavior.",
        "Minifier success does not measure the user's loading or interaction outcomes.",
        "Compressed bytes alone omit execution cost and loading behavior."
      ]
    ]
  },
  {
    "comp": "m4.c1",
    "rows": [
      [
        "What should a reproducible build record include?",
        "Source and dependency identity",
        "Only a team chat timestamp",
        "Only the browser window size",
        "Only a screenshot filename",
        "Source revision and dependency state help identify how the artifact was produced.",
        "Only a team chat timestamp does not satisfy the stated requirement. Source revision and dependency state help identify how the artifact was produced.",
        "Only the browser window size does not satisfy the stated requirement. Source revision and dependency state help identify how the artifact was produced.",
        "Only a screenshot filename does not satisfy the stated requirement. Source revision and dependency state help identify how the artifact was produced."
      ],
      [
        "What makes a frontend value public?",
        "Delivery to the browser",
        "A variable name without SECRET",
        "The absence of minification",
        "The use of CSS modules",
        "Anything shipped to the browser should be considered accessible to users.",
        "A variable name without SECRET does not satisfy the stated requirement. Anything shipped to the browser should be considered accessible to users.",
        "The absence of minification does not satisfy the stated requirement. Anything shipped to the browser should be considered accessible to users.",
        "The use of CSS modules does not satisfy the stated requirement. Anything shipped to the browser should be considered accessible to users."
      ],
      [
        "What does build success primarily establish?",
        "The packaging step completed",
        "Every production user flow passed",
        "Every API permission is correct",
        "Every cache is current",
        "Build completion is one stage and does not prove deployed runtime behavior.",
        "Every production user flow passed does not satisfy the stated requirement. Build completion is one stage and does not prove deployed runtime behavior.",
        "Every API permission is correct does not satisfy the stated requirement. Build completion is one stage and does not prove deployed runtime behavior.",
        "Every cache is current does not satisfy the stated requirement. Build completion is one stage and does not prove deployed runtime behavior."
      ],
      [
        "A pipeline validates artifact A but uploads artifact B. Which gate should prevent this?",
        "Digest-linked promotion records",
        "Only matching human labels",
        "Only a shorter build name",
        "Only a second console message",
        "Artifact identity must connect validation and promotion without substituting different bytes.",
        "Only matching human labels does not satisfy the stated requirement. Artifact identity must connect validation and promotion without substituting different bytes.",
        "Only a shorter build name does not satisfy the stated requirement. Artifact identity must connect validation and promotion without substituting different bytes.",
        "Only a second console message does not satisfy the stated requirement. Artifact identity must connect validation and promotion without substituting different bytes."
      ],
      [
        "A production bundle exposes a supposedly secret API key. Which response addresses the boundary?",
        "Move secret authority to the server",
        "Rename the bundled variable to PRIVATE",
        "Encode the secret in a separate client file",
        "Disable source maps for the public bundle",
        "Browser-held secrets remain extractable; server-side authority and credential rotation policy need appropriate handling.",
        "Changing a bundled variable's name leaves its value readable by the client.",
        "A separate delivered file remains available to browser users.",
        "Removing source maps does not hide a reusable key embedded in client bytes."
      ],
      [
        "A lockfile is ignored during release builds. What risk grows?",
        "Dependency resolution drift",
        "Automatic stronger repeatability",
        "Guaranteed smaller bundles",
        "Universal cache compatibility",
        "Unpinned resolution can produce a different dependency graph at build time.",
        "Automatic stronger repeatability does not satisfy the stated requirement. Unpinned resolution can produce a different dependency graph at build time.",
        "Guaranteed smaller bundles does not satisfy the stated requirement. Unpinned resolution can produce a different dependency graph at build time.",
        "Universal cache compatibility does not satisfy the stated requirement. Unpinned resolution can produce a different dependency graph at build time."
      ],
      [
        "A release uses a runtime endpoint config file. What must be verified separately from the bundle digest?",
        "The applied configuration identity",
        "Only the compiled JavaScript artifact hash",
        "Only the source code commit's branch name",
        "Only the default config in the repository",
        "An unchanged artifact can behave differently under different runtime configuration.",
        "A bundle hash cannot identify configuration delivered and applied separately.",
        "A branch name does not prove the actual runtime endpoints and settings.",
        "The repository default can differ from the configuration active in the environment."
      ],
      [
        "A site is promoted without testing deep links. Which deployment defect can escape?",
        "Missing route fallback behavior",
        "Only the local formatter result",
        "Only the CSS token naming",
        "Only the test folder casing",
        "SPA deep links depend on hosting configuration in addition to the built assets.",
        "Only the local formatter result does not satisfy the stated requirement. SPA deep links depend on hosting configuration in addition to the built assets.",
        "Only the CSS token naming does not satisfy the stated requirement. SPA deep links depend on hosting configuration in addition to the built assets.",
        "Only the test folder casing does not satisfy the stated requirement. SPA deep links depend on hosting configuration in addition to the built assets."
      ],
      [
        "A rollback plan contains only a source branch name. What is more actionable?",
        "A known-good artifact and config",
        "Only a screenshot of the old site",
        "Only a promise to rebuild later",
        "Only a longer release note",
        "Recovery needs identifiable deployable bytes and compatible configuration.",
        "Only a screenshot of the old site does not satisfy the stated requirement. Recovery needs identifiable deployable bytes and compatible configuration.",
        "Only a promise to rebuild later does not satisfy the stated requirement. Recovery needs identifiable deployable bytes and compatible configuration.",
        "Only a longer release note does not satisfy the stated requirement. Recovery needs identifiable deployable bytes and compatible configuration."
      ],
      [
        "An incident affects only release R17 on one environment. What diagnostic linkage is useful?",
        "Artifact and environment release ids",
        "Only the user\u2019s theme choice",
        "Only the CSS selector count",
        "Only the project\u2019s marketing name",
        "Release identity narrows the relevant deployed bytes and configuration for investigation.",
        "Only the user\u2019s theme choice does not satisfy the stated requirement. Release identity narrows the relevant deployed bytes and configuration for investigation.",
        "Only the CSS selector count does not satisfy the stated requirement. Release identity narrows the relevant deployed bytes and configuration for investigation.",
        "Only the project\u2019s marketing name does not satisfy the stated requirement. Release identity narrows the relevant deployed bytes and configuration for investigation."
      ]
    ]
  },
  {
    "comp": "m4.c2",
    "rows": [
      [
        "Why include release identity in client errors?",
        "To locate the relevant deployed code",
        "To authorize the user automatically",
        "To disable every source map",
        "To replace all reproduction steps",
        "A release identifier helps connect an error to exact artifact and configuration context.",
        "To authorize the user automatically does not satisfy the stated requirement. A release identifier helps connect an error to exact artifact and configuration context.",
        "To disable every source map does not satisfy the stated requirement. A release identifier helps connect an error to exact artifact and configuration context.",
        "To replace all reproduction steps does not satisfy the stated requirement. A release identifier helps connect an error to exact artifact and configuration context."
      ],
      [
        "What denominator can make failure counts interpretable?",
        "Relevant operation attempts",
        "Only the number of CSS files",
        "Only the repository age",
        "Only the icon count",
        "Rates need a meaningful population of opportunities for the failure.",
        "Only the number of CSS files does not satisfy the stated requirement. Rates need a meaningful population of opportunities for the failure.",
        "Only the repository age does not satisfy the stated requirement. Rates need a meaningful population of opportunities for the failure.",
        "Only the icon count does not satisfy the stated requirement. Rates need a meaningful population of opportunities for the failure."
      ],
      [
        "What must match a diagnostic source map?",
        "The exact generated release code",
        "Only the project\u2019s display title",
        "Only a nearby branch name",
        "Only the package\u2019s logo",
        "Maps describe a particular generated artifact and can mislead if mismatched.",
        "Only the project\u2019s display title does not satisfy the stated requirement. Maps describe a particular generated artifact and can mislead if mismatched.",
        "Only a nearby branch name does not satisfy the stated requirement. Maps describe a particular generated artifact and can mislead if mismatched.",
        "Only the package\u2019s logo does not satisfy the stated requirement. Maps describe a particular generated artifact and can mislead if mismatched."
      ],
      [
        "A new release has 20 failures in 100 attempts while the old one has 100 in 10000. Which comparison is more meaningful than raw counts?",
        "Operation failure rates",
        "Only the larger event count",
        "Only alphabetical release order",
        "Only the total log bytes",
        "The rates are 20% and 1%, revealing different failure likelihood despite raw counts.",
        "Only the larger event count does not satisfy the stated requirement. The rates are 20% and 1%, revealing different failure likelihood despite raw counts.",
        "Only alphabetical release order does not satisfy the stated requirement. The rates are 20% and 1%, revealing different failure likelihood despite raw counts.",
        "Only the total log bytes does not satisfy the stated requirement. The rates are 20% and 1%, revealing different failure likelihood despite raw counts."
      ],
      [
        "A client reports a correlation id but no secrets. How can this help diagnosis?",
        "Link sanitized client and server evidence",
        "Authenticate the account from the ID alone",
        "Recover every server event without access",
        "Replace release identity in client reports",
        "A designed identifier can connect relevant events without copying sensitive payloads.",
        "A correlation identifier links evidence without authenticating an account.",
        "The identifier does not bypass permissions or guarantee retention of all server events.",
        "Correlation across a request does not replace the identity of the deployed code."
      ],
      [
        "An alert triggers on every isolated network error and becomes ignored. What should improve?",
        "Actionable rate and impact thresholds",
        "Only sending the same alert to more people",
        "Only increasing the total event retention",
        "Only retrying every failed request forever",
        "Operational signals should distinguish meaningful degradation from expected isolated failures.",
        "Wider distribution of the same noisy signal does not improve its actionability.",
        "Longer retention does not distinguish isolated failures from high-impact incidents.",
        "Unbounded retries can amplify failures and do not establish meaningful alert thresholds."
      ],
      [
        "A handled API error never appears in uncaught-error monitoring. What coverage should be added?",
        "Deliberate handled-failure signals",
        "Only a larger stack trace font",
        "Only another global throw listener",
        "Only a route screenshot",
        "Handled failures may require explicit measurement because they do not escape as uncaught exceptions.",
        "Only a larger stack trace font does not satisfy the stated requirement. Handled failures may require explicit measurement because they do not escape as uncaught exceptions.",
        "Only another global throw listener does not satisfy the stated requirement. Handled failures may require explicit measurement because they do not escape as uncaught exceptions.",
        "Only a route screenshot does not satisfy the stated requirement. Handled failures may require explicit measurement because they do not escape as uncaught exceptions."
      ],
      [
        "A team publishes private form values inside reproduction artifacts. What boundary failed?",
        "Diagnostic data minimization",
        "Only the source map format",
        "Only the event timestamp",
        "Only the screenshot resolution",
        "Failure evidence must avoid exposing unnecessary private customer data.",
        "Only the source map format does not satisfy the stated requirement. Failure evidence must avoid exposing unnecessary private customer data.",
        "Only the event timestamp does not satisfy the stated requirement. Failure evidence must avoid exposing unnecessary private customer data.",
        "Only the screenshot resolution does not satisfy the stated requirement. Failure evidence must avoid exposing unnecessary private customer data."
      ],
      [
        "Monitoring reports no errors for one device type, but its SDK fails to initialize. What conclusion is valid?",
        "The absence of events is inconclusive",
        "The device has no reportable failures",
        "The release is verified on that device",
        "The SDK prevented all critical errors",
        "Missing telemetry can mean missing observation rather than successful behavior.",
        "A broken SDK can suppress reports despite real failures.",
        "Missing telemetry is not verification that the device's user flows work.",
        "Failure to initialize monitoring does not prevent application errors."
      ],
      [
        "An incident report has a stack trace but no release id and many deployed versions. What should be added?",
        "Exact artifact context",
        "Only another generic error message",
        "Only the browser\u2019s theme",
        "Only the page\u2019s background color",
        "Diagnosis needs to identify which generated code and configuration produced the event.",
        "Only another generic error message does not satisfy the stated requirement. Diagnosis needs to identify which generated code and configuration produced the event.",
        "Only the browser\u2019s theme does not satisfy the stated requirement. Diagnosis needs to identify which generated code and configuration produced the event.",
        "Only the page\u2019s background color does not satisfy the stated requirement. Diagnosis needs to identify which generated code and configuration produced the event."
      ]
    ]
  },
  {
    "comp": "m4.c1",
    "rows": [
      [
        "What is outside a frontend asset rollback\u2019s automatic scope?",
        "Undoing business data writes",
        "Restoring old JavaScript bytes",
        "Selecting old stylesheet bytes",
        "Reapplying compatible public config",
        "Client artifact restoration does not itself reverse persisted business operations.",
        "Restoring old JavaScript bytes does not satisfy the stated requirement. Client artifact restoration does not itself reverse persisted business operations.",
        "Selecting old stylesheet bytes does not satisfy the stated requirement. Client artifact restoration does not itself reverse persisted business operations.",
        "Reapplying compatible public config does not satisfy the stated requirement. Client artifact restoration does not itself reverse persisted business operations."
      ],
      [
        "What can keep serving a faulty client after server rollback?",
        "A service worker cache",
        "Only an HTML heading",
        "Only a route display name",
        "Only a font weight rule",
        "Client-side caching has an independent lifecycle that can retain older assets.",
        "Only an HTML heading does not satisfy the stated requirement. Client-side caching has an independent lifecycle that can retain older assets.",
        "Only a route display name does not satisfy the stated requirement. Client-side caching has an independent lifecycle that can retain older assets.",
        "Only a font weight rule does not satisfy the stated requirement. Client-side caching has an independent lifecycle that can retain older assets."
      ],
      [
        "What should recovery monitoring distinguish?",
        "Errors by client release version",
        "Only the total icon count",
        "Only the server\u2019s folder name",
        "Only the deploy command length",
        "Different clients may execute different releases during recovery.",
        "Only the total icon count does not satisfy the stated requirement. Different clients may execute different releases during recovery.",
        "Only the server\u2019s folder name does not satisfy the stated requirement. Different clients may execute different releases during recovery.",
        "Only the deploy command length does not satisfy the stated requirement. Different clients may execute different releases during recovery."
      ],
      [
        "A rollback removes all new files including resources referenced by old open tabs. What is unsafe?",
        "Breaking still-active asset references",
        "Only storing old files under hashed names",
        "Only preserving compatible earlier assets",
        "Only recording the previous release digest",
        "Clients can require assets from versions other than the server’s current HTML.",
        "Content-hashed names support stable references rather than causing the described deletion failure.",
        "Preserving compatible files keeps old tabs' references usable.",
        "Recording a digest aids traceability but does not break an asset reference."
      ],
      [
        "A release migrates API fields incompatibly and rollback restores old UI. What must be checked?",
        "The old client's server compatibility",
        "Only whether the previous bundle builds",
        "Only whether old CSS downloads correctly",
        "Only the artifact's original commit hash",
        "Restoring the UI does not make the current API compatible with its expectations.",
        "A successful build does not prove the older client's fields match the current server.",
        "Stylesheet delivery does not test the restored client's API contract.",
        "A source commit identifies code without establishing compatibility with the deployed backend."
      ],
      [
        "A canary shows increased checkout failures for the new version. What makes rollback actionable?",
        "A known-good compatible promotion path",
        "Only the source branch of an earlier build",
        "Only a screenshot of the former checkout",
        "Only disabling the failed canary's alerts",
        "A tested artifact/config recovery path supports prompt controlled restoration.",
        "A branch name alone does not identify a validated deployable artifact and configuration.",
        "A screenshot cannot provide a compatible promotion or rollback mechanism.",
        "Disabling alerts conceals the failure without restoring checkout."
      ],
      [
        "A forced reload loses a customer’s unsaved form. Which recovery dimension was overlooked?",
        "Preserving or managing in-progress work",
        "Only the compressed reload transfer size",
        "Only the source map upload completion",
        "Only the visual smoothness of the spinner",
        "User state needs an intentional policy during version transitions.",
        "A small transfer does not protect the customer's unsaved form values.",
        "Source map upload does not preserve current browser work.",
        "A smooth spinner can accompany a destructive reload that loses drafts."
      ],
      [
        "A rollback smoke test passes on a clean browser but fails for returning users. Which case is missing?",
        "Existing cache and session states",
        "Only a second fresh-browser smoke test",
        "Only a faster clean-client connection",
        "Only another clean-browser viewport size",
        "Real recovery must account for clients carrying prior assets, caches and state.",
        "Repeating a clean-browser test continues to omit retained user state.",
        "A faster fresh connection does not exercise an old cache or session.",
        "A viewport change in another clean browser does not reproduce returning-client state."
      ],
      [
        "A release is rolled back but database-side actions remain. What should the incident report state?",
        "Client recovery and data status separately",
        "All prior work was automatically undone",
        "No user action could have happened",
        "Only the CSS was ever involved",
        "Recovery evidence must distinguish restored client behavior from persistent business effects.",
        "All prior work was automatically undone does not satisfy the stated requirement. Recovery evidence must distinguish restored client behavior from persistent business effects.",
        "No user action could have happened does not satisfy the stated requirement. Recovery evidence must distinguish restored client behavior from persistent business effects.",
        "Only the CSS was ever involved does not satisfy the stated requirement. Recovery evidence must distinguish restored client behavior from persistent business effects."
      ],
      [
        "A team declares recovery from the deployment exit code alone. Which confirmation is still needed?",
        "Observed critical-flow recovery",
        "Only another upload log",
        "Only the branch name",
        "Only the current file count",
        "Successful artifact transfer is not proof that affected users can complete their tasks.",
        "Only another upload log does not satisfy the stated requirement. Successful artifact transfer is not proof that affected users can complete their tasks.",
        "Only the branch name does not satisfy the stated requirement. Successful artifact transfer is not proof that affected users can complete their tasks.",
        "Only the current file count does not satisfy the stated requirement. Successful artifact transfer is not proof that affected users can complete their tasks."
      ]
    ]
  }
]);
