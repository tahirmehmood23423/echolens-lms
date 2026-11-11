'use strict';
const {course}=require('./wave4-mobile-helper');
module.exports=course("mobile-ui-fundamentals",
[
  {
    "id": "mobile-ui-platform-choice",
    "title": "Choose a mobile delivery approach from product constraints",
    "comps": [
      "m1.c1"
    ],
    "intro": "A warehouse scanner and a public event catalogue have different needs. A platform decision starts with required capabilities and delivery constraints, not a claim that one framework is always faster or cheaper. Native applications target platform SDKs; cross-platform frameworks share selected code while integrating platform services; web applications run within browser capabilities.",
    "sections": [
      [
        "Compare the complete product",
        "List must-have device integrations, supported operating systems, offline work, accessibility obligations and the team\u2019s existing skills. A browser-delivered product can lower installation friction, but a required peripheral or background workflow must be checked against the target browser and operating-system versions. Cross-platform does not mean every plugin or behavior is identical across iOS and Android.",
        "Treat non-negotiable requirements as eligibility gates before applying a weighted score. Otherwise a strong marketing score can hide a missing scanner interface. Estimate development and maintenance costs over the supported release period, including native integration work, app review, testing and incident response."
      ],
      [
        "Separate evidence from assumptions",
        "Build a small capability spike on representative devices for the riskiest integration. Record observed behavior, version, permissions and failure modes. A successful emulator demo is useful evidence about that configuration; it does not establish camera quality, battery consumption or accessibility on every physical device.",
        "A decision record names the alternatives, why the chosen option meets the actual constraints, and which future requirement would cause reconsideration. For a catalogue that later adds continuous background location, revisit feasibility rather than treating the original choice as permanent."
      ]
    ],
    "code": "candidates=[{'name':'web','scanner':False,'score':92},{'name':'native','scanner':True,'score':80},{'name':'shared','scanner':True,'score':85}]\neligible=[c for c in candidates if c['scanner']]\nprint(max(eligible,key=lambda c:c['score'])['name'])",
    "expect": "shared",
    "problem": "Select an eligible scanner product after enforcing its must-have capability.",
    "steps": [
      "Mark scanner support as mandatory.",
      "Exclude candidates that fail the requirement.",
      "Compare scores only among eligible alternatives."
    ],
    "limit": "Python evaluates a supplied decision table. The scanner-support flags and scores are assumptions, not tested SDK capabilities or total-cost estimates.",
    "mistakes": [
      "Choosing the highest score before checking requirements admits an infeasible product. Enforce hard constraints first.",
      "Assuming shared code eliminates native testing ignores operating-system and plugin differences."
    ],
    "takeaways": [
      "Compare requirements before frameworks.",
      "Validate risky device capabilities on supported versions.",
      "Keep decision assumptions and reconsideration triggers explicit."
    ],
    "practice": [
      "For the scanner decision, which filter must precede the score comparison?|Capability eligibility|Highest score alone~An infeasible option can score well.|Smallest source tree~Code size does not establish the required peripheral.|Newest brand~Release age does not prove capability.|Eligibility is a prerequisite to ranking.",
      "What does a shared mobile codebase still require?|Platform-specific validation|One emulator result only~That covers only its configuration.|No operating-system testing~Shared logic does not unify OS services.|Identical permissions everywhere~Permission contracts differ.|Shared code can coexist with different native integration behavior.",
      "A capability spike passes on one Android model. Which conclusion is justified?|That tested configuration worked|All iPhones support it~No iOS evidence was collected.|Battery impact is negligible~Functional success does not measure energy.|The integration never needs maintenance~Future SDK changes can affect it.|Evidence must retain the tested environment boundary.",
      "An event catalogue adds mandatory offline ticket scanning. What should the team revisit?|Platform feasibility assumptions|Only the logo~Branding does not establish scanner support.|Only catalogue sorting~Ordering does not cover offline capability.|Only the release-note wording~Documentation cannot supply a missing interface.|A new hard requirement can invalidate an earlier platform decision.",
      "Two eligible designs differ in update cost and plugin maintenance. What comparison is relevant?|Lifecycle cost and risk|Only initial screens built~Initial throughput omits maintenance.|Only repository stars~Popularity is not a product cost model.|Only screenshot similarity~Appearance omits integration work.|Evaluate costs over the supported product lifetime.",
      "A browser approach lacks a required device interface but wins weighted scoring. What is the correct action?|Reject as ineligible|Increase its marketing weight~A weight cannot add the interface.|Assume a future browser update~An unverified future feature is not current evidence.|Hide the unsupported screen~The product still fails its requirement.|Hard requirements must not be traded away by a convenience score."
    ],
    "formal": [
      "Which characteristic primarily distinguishes a native mobile implementation?|Direct use of a platform SDK|Mandatory browser rendering~Native interfaces need not run inside a browser.|No installation package~Native distribution commonly uses packages.|Automatic cross-platform equality~Platform APIs differ.|A native implementation targets a particular platform SDK.",
      "What should a product decision record retain?|Constraints and assumptions|Only framework slogans~Slogans do not explain feasibility.|Only a team vote count~Votes omit technical constraints.|Only a single screenshot~A screenshot omits system behavior.|Decision context supports later reassessment.",
      "Why can cross-platform maintenance still include native work?|Platform-service bridges|All code executes in a browser~That is not a universal cross-platform model.|Permissions become irrelevant~Native services retain permission contracts.|The operating system stops changing~OS evolution still affects apps.|Shared application code does not erase native boundaries.",
      "A hospital app requires an integration certified only on one supported OS. Which platform evaluation comes first?|Verify the mandated OS integration|Rank visual animation libraries~Animation preference is secondary to feasibility.|Optimize catalogue search~Search cannot replace required integration.|Count shared components~Component reuse cannot prove certification.|The integration is a mandatory acceptance condition.",
      "A retail team compares a PWA and packaged app for occasional stock lookup with no device-only requirements. Which factor is relevant?|Channel friction and capability|Assume native is always cheaper~Cost depends on actual work and support.|Assume web never works offline~Offline capabilities depend on design and browser support.|Ignore users\u2019 supported devices~The delivery channel must work for them.|A suitable approach follows product constraints, not universal rankings.",
      "A shared framework supports the required camera API through a community plugin. What additional evidence matters?|Plugin health and compatibility|Only the plugin\u2019s display name~A name does not establish reliability.|Only the marketing screenshot~A picture does not exercise failure paths.|Only JavaScript syntax checks~Syntax cannot validate native camera integration.|Plugin health and real-device behavior affect lifecycle risk.",
      "A scanner SDK is verified on Android14 but the contracted fleet includes Android12; a Python eligibility model assumes both work. Which evidence package is still needed before accepting the cross-platform candidate?|Android12 integration and lifecycle-cost evidence|A second eligibility-model execution with the same flags~Repeating assumed inputs cannot verify the missing integration.|Android14 screenshot and initial implementation estimate~These omit the unsupported fleet and recurring costs.|A higher scanner score plus a browser compatibility table~Scores cannot establish the native fleet capability.|The model verifies its supplied logic, while native support and lifecycle cost remain external assumptions.",
      "A retail fleet requires Android12 camera scanning and offline drafts. A plugin works on Android15, while offline drafts pass locally. Which release conclusion respects both requirements?|Offline drafts pass; camera support on Android12 is unproven|Both features pass because the newer OS supports the camera~Newer-platform success does not establish the contracted older fleet.|Camera support passes; drafts remain unproven despite their test~The supplied local evidence does verify the tested draft path.|Both features fail because the OS versions differ~Missing evidence for one requirement does not invalidate the other test.|Track each requirement against evidence for its supported environment.",
      "Two eligible designs cost60 and90 initially. Over two years A needs six30-unit integration fixes and B needs two20-unit fixes; other support is equal. Which model-based choice minimizes total cost?|B at130 units rather than A at240|A at60 units because recurring fixes are excluded~The stated comparison includes the two-year fixes.|A at180 units rather than B at40~Those are recurring-only totals and omit initial cost.|B at110 units after counting one integration fix~The problem states two fixes for B.|A costs60+6\u00d730=240; B costs90+2\u00d720=130 under the given model.",
      "A product requires attestation plus an offline queue. A and B support both; C lacks the queue. Over two years A costs60 initially plus six30-unit fixes, B costs90 plus two20-unit fixes, and C costs100 plus one20-unit fix. The cap is250 and the goal is minimum eligible lifecycle cost. Which candidate and cost are correct?|B at130; A is eligible at240 and C fails the queue gate|A at60 because both A and B meet the capability gates~That omits A\u2019s recurring180-unit integration cost.|C at120 because it is cheaper than B over two years~Its lower cost cannot compensate for the missing mandatory queue.|B at110 after counting the cheaper fix once~The stated horizon includes two20-unit fixes.|First exclude C; then A totals240 and B130, both below250, so B is the lower eligible lifecycle cost."
    ],
    "lang": "python"
  },
  {
    "id": "mobile-ui-lifecycle",
    "title": "Separate lifecycle visibility from reliable business completion",
    "comps": [
      "m1.c2"
    ],
    "intro": "A delivery worker may switch apps while entering a parcel note. The operating system can pause work, reclaim a process or recreate a screen. A lifecycle callback describes an observed application state; it is not a guarantee that a final save or network request will finish.",
    "sections": [
      [
        "Recognize interruption boundaries",
        "Distinguish a visible screen, a foreground interactive app, a background app and a terminated process. These names do not form one universal callback sequence across platforms. In Flutter the framework exposes lifecycle state abstractions, while native integrations must still respect the operating system\u2019s scheduling and permission rules. Avoid assuming every state transition is delivered before a process disappears.",
        "Keep user intent and durable work separate from a UI component\u2019s lifetime. Save a draft at a defined edit boundary or through a bounded debounce whose loss tolerance is explicit. A server command needs an operation identity and a recoverable status; a loading spinner cannot be the only record that a payment was requested."
      ],
      [
        "Resume with reconciliation",
        "On resuming, check whether previously displayed data is stale and whether pending work needs reconciliation. Invalidate obsolete asynchronous completions when the screen\u2019s request identity changes. Cancellation is useful, but a request that has already reached a server may still commit; do not equate closing a screen with rolling back a remote effect.",
        "The fixture applies an old response only when its generation matches the current screen request. Generation checks protect a local display from stale completion; they do not authenticate a server, persist drafts, detect all races or decide what happened to a remote write. Test backgrounding, process recreation and network recovery as separate conditions."
      ]
    ],
    "code": "current_generation=3\nresponses=[(2,'old address'),(3,'new address')]\nshown='loading'\nfor generation,value in responses:\n    if generation==current_generation:\n        shown=value\nprint(shown)",
    "expect": "new address",
    "problem": "Keep an obsolete request completion from replacing the current address.",
    "steps": [
      "Give each logical screen request a generation.",
      "Ignore completions belonging to an earlier request.",
      "Apply the matching result to display state."
    ],
    "limit": "This Python loop verifies an identity comparison for supplied completions. It does not execute an operating-system lifecycle, cancellation mechanism or network request.",
    "mistakes": [
      "Saving only in an exit callback can lose data when no callback arrives. Save at intentional durable boundaries.",
      "Assuming cancellation reverses a remote write confuses UI lifetime with server transaction state."
    ],
    "takeaways": [
      "Lifecycle notifications are observations, not guaranteed finalization.",
      "Reconcile after interruption.",
      "Protect current display state from stale asynchronous completions."
    ],
    "practice": [
      "Where should an essential draft be durably saved?|An explicit durable-edit boundary|Only after a guaranteed exit callback~Such a callback is not guaranteed.|Only inside a spinner~A visual state is not durable storage.|Only after uninstall~The user cannot recover unsaved edits then.|Durability must not depend on receiving a final lifecycle event.",
      "Why tag a screen request with an identity?|Reject obsolete completions|Authorize bank transfers~An identity label is not an access-control decision.|Reserve background CPU forever~Tags do not change OS scheduling.|Guarantee network delivery~A label does not deliver a request.|A completion can be matched to the current logical request.",
      "A user closes a screen after a write times out. What must the app avoid assuming?|That the server rolled back|That the screen is no longer visible~Visibility can be observed locally.|That the response was not displayed~The UI state can establish that.|That reconciliation may be needed~Unknown write outcomes do require it.|A timeout or closed view does not prove no remote effect.",
      "An address request for account A finishes after the user selects B. Which display rule is safe?|Match the current request|Always display the last arrival~Arrival order does not preserve current intent.|Prefer the longest address~Text length is not request ownership.|Reuse A because it was authenticated~Authentication does not make A the selected account.|Current-request identity prevents this stale UI overwrite.",
      "The app resumes with cached stock data from yesterday. What action follows the product\u2019s freshness policy?|Revalidate or label the stale state|Treat foreground visibility as fresh data~A lifecycle state does not update stock.|Delete every local draft~Draft deletion is unrelated and harmful.|Replay all purchase commands~Blind replay can duplicate effects.|Resumption should reconcile data and pending work deliberately.",
      "A background callback schedules a save, but the process dies before commit. Which guarantee was missing?|A completed durable write|A darker background icon~Appearance does not commit bytes.|A larger in-memory object~Memory can disappear with the process.|A successful callback entry~Entering a callback does not finish its work.|Durability is established by the storage contract\u2019s completion boundary."
    ],
    "formal": [
      "What is a lifecycle callback primarily evidence of?|Observed app-state change|Guaranteed final business commit~Application visibility does not commit a transaction.|Unlimited background execution~Scheduling remains constrained.|Permanent process survival~Processes can be reclaimed.|Notifications describe app state rather than business success.",
      "Which state can disappear when a process is reclaimed?|Unsaved in-memory edits|A confirmed server record~A local process ending does not erase a committed remote record.|An already committed database row solely because RAM clears~Durable storage has a separate lifetime.|The platform\u2019s published documentation~Documentation is not app process memory.|Unsaved process memory can disappear when the operating system reclaims that process.",
      "What should resumption logic consider besides navigation?|Freshness and pending work|Only window color~Color does not reconcile work.|Only screen dimensions~Layout does not establish business state.|Only application branding~Branding is irrelevant to pending commands.|Resumption is an opportunity for state reconciliation.",
      "A parcel note is business-critical, but the app saves only on graceful shutdown. Which redesign addresses the failure mode?|Persist before shutdown|Add a longer shutdown animation~Animation does not guarantee callback delivery.|Keep two references to the same string~Both remain process memory.|Raise the request timeout indefinitely~Network waiting does not durably save edits.|Durable edit boundaries survive missing finalization callbacks.",
      "A refresh for route X returns after navigation to Y. Which acceptance predicate protects Y?|Current request identity|Response body has more fields~Shape alone does not establish relevance.|Response arrived most recently~An older request can arrive last.|Response HTTP status is 200~Success does not identify the selected route.|A successful response can still be obsolete for this screen.",
      "A payment timed out immediately before backgrounding. What should the resumed app show until status is known?|An honest pending state with reconciliation|A definite failure permitting a new payment~The original may already have committed.|A fabricated receipt~No confirmed success evidence exists.|A success state based on spinner completion~UI animation does not establish a transaction outcome.|Unknown remote outcomes need explicit reconciliation.",
      "A draft save starts in a background notification, but the OS can terminate without any later callback. The product permits at most one completed edit to be lost. Which design directly addresses that contract?|Commit at edit boundaries with an explicit one-edit loss policy|Move the same save to a later termination callback~The missing-callback risk remains.|Keep two in-memory copies until the next resume event~Both copies share process lifetime.|Acknowledge durable save when the background callback starts~Callback entry is not a committed write.|Durability must be tied to a completed storage boundary that matches the permitted loss.",
      "A reservation command may have reached the server when its view closes and cancels the local request. The UI then receives no response. What follows from this evidence?|The remote outcome is unknown and needs status reconciliation|The reservation was rolled back when local cancellation returned~Cancellation does not establish a server rollback.|The reservation succeeded because transmission was possible~Possible transmission is not confirmed commit.|A new reservation identity is safe because no response arrived~A lost response can hide an already committed operation.|Local cancellation and authoritative transaction outcome are independent.",
      "A screen test accepts a response only when requestGeneration equals currentGeneration. Which additional fixture targets the stale-result race rather than a cosmetic variation?|Complete A2 before A1 after revisiting the same account|Change the account display label while preserving completion order~That does not exercise an obsolete request winning arrival order.|Repeat the same successful request with a different title~That does not distinguish two in-flight generations.|Render the loading indicator with a different animation delay~Animation timing alone does not test response acceptance.|Out-of-order completion for repeated visits tests why generation matters beyond resource equality.",
      "A lifecycle trace visits account A generation2, B generation3, then A generation4. Cached A data is5. Generation4 times out; later generation2 succeeds with8 and generation3 succeeds with9. Policy retains useful cache after a failed current request and rejects obsolete responses. What should A show?|Cached5 as stale with the current timeout state|Fresh8 because the late response belongs to account A~Account equality does not make generation2 the current request.|Fresh9 because it is the last successful arrival~That belongs to both the wrong account and an obsolete generation.|An empty successful result because generation4 returned no data~A timeout is not a successful empty query.|Generation4 is current but failed; obsolete successes must not replace its stale-cache/error presentation."
    ],
    "lang": "python"
  },
  {
    "id": "mobile-ui-restoration",
    "title": "Restore drafts without confusing saved state and authoritative records",
    "comps": [
      "m1.c1",
      "m1.c2"
    ],
    "intro": "A shopping app can restore the customer\u2019s search filters after a process restart, yet must refresh current prices before checkout. Restoration is a product contract about which state survives which interruption. It is not equivalent to persisting every object or trusting every saved value forever.",
    "sections": [
      [
        "Classify state by authority and lifetime",
        "Ephemeral interaction state includes a pressed animation or an open transient menu. Restorable presentation state may include the selected tab, scroll anchor or draft form values. Durable domain state includes committed orders and user-created records. The same item can require different policies: a draft quantity may be restored, while stock availability must be revalidated against the authoritative service.",
        "Assign a stable identity to the draft and record its schema version. Migrate or reject saved presentation data deliberately when the application changes. A restored route containing an object identifier does not grant access to that object; apply current authorization and handle deleted or unavailable records. Restoration should improve continuity without bypassing current business constraints."
      ],
      [
        "Define safe precedence on return",
        "On launch, read compatible local state, display any useful cached content with an honest freshness indication, and reconcile with authoritative data. Avoid silently replacing unsent user edits with a remote default. If both local and server versions changed, use an explicit conflict rule rather than assuming the latest device clock proves correctness.",
        "The fixture distinguishes a durable draft from a stale stock snapshot. It retains the user\u2019s intended quantity while clamping nothing silently: it reports the stock conflict for a decision. This is a small state-policy calculation, not Flutter restoration APIs, secure persistence, authentication or an inventory transaction. Device-level testing must also cover upgrade, logout and process recreation."
      ]
    ],
    "code": "saved={'draft_quantity':7,'cached_stock':9}\nserver_stock=4\nprint('restore',saved['draft_quantity'])\nprint('needs_review',saved['draft_quantity']>server_stock)",
    "expect": "restore 7\nneeds_review True",
    "problem": "Restore a requested quantity while surfacing a changed availability constraint.",
    "steps": [
      "Read the saved user intent.",
      "Obtain authoritative stock for the decision.",
      "Retain the edit and flag a conflict instead of silently accepting it."
    ],
    "limit": "Python checks a supplied policy with literal state. It neither reads actual app storage nor reserves stock; revalidation and conflict handling still require application integration.",
    "mistakes": [
      "Treating a restored route as an access token bypasses current authorization. Recheck access.",
      "Overwriting a draft with remote defaults loses user intent. Distinguish local edits from cached server data."
    ],
    "takeaways": [
      "State lifetime and data authority are different dimensions.",
      "Version saved structures.",
      "Restoration never replaces business validation."
    ],
    "practice": [
      "Which restored value is user intent rather than authoritative inventory?|Draft quantity|Current sellable stock~The inventory service owns that fact.|Current payment settlement~Settlement requires authoritative evidence.|Current resource permission~Permissions must be evaluated by the service.|A draft records what the user requested, not whether it is presently feasible.",
      "Why version a saved draft structure?|Read or migrate the format|Grant permanent authorization~Schema metadata grants no permission.|Eliminate all storage failures~Versioning does not ensure successful writes.|Freeze business rules forever~Rules can change independently.|Saved formats can become incompatible with newer code.",
      "A saved deep link references a deleted invoice. What should restoration do?|Handle the missing resource explicitly|Recreate an invoice without consent~Navigation restoration must not fabricate domain records.|Display another customer\u2019s invoice~That changes identity and can disclose data.|Assume all saved IDs remain valid~Resources can be deleted.|Restored navigation must tolerate current resource state.",
      "A local note has unsent edits and the server has a newer title. Which policy is needed?|A conflict rule preserving visible user intent|Unconditionally overwrite the note~That can silently lose edits.|Treat device clock order as infallible~Clocks can disagree.|Mark both versions synchronized without comparison~That falsely claims convergence.|Concurrent edits require an explicit resolution contract.",
      "The customer logs out on a shared tablet. Which restored-state concern matters?|Isolate drafts by account|Keep every prior route globally visible~That can disclose another account\u2019s state.|Treat screen-lock state as account authorization~Device unlock and application identity differ.|Restore cached payment details for convenience~Sensitive prior-account data should not leak.|Restoration must respect the active account boundary.",
      "A fixture restores quantity seven while server stock is four. What has it established?|The need to resolve a quantity conflict|A successful stock reservation~No reservation was executed.|The platform\u2019s storage encryption~The fixture does not access device storage.|That clamping to four is always acceptable~Product consent and rules decide that.|The policy surfaces a conflict without inventing a transaction."
    ],
    "formal": [
      "Which state is normally transient rather than a durable order record?|A running button animation|A confirmed order identifier~That identifies domain state.|A submitted invoice~A submitted invoice has a business lifetime.|A recorded delivery event~That is a domain fact.|Transient rendering state need not be restored as business evidence.",
      "What is a schema version attached to saved UI state used for?|Format compatibility|User identity authentication~A version number is not a credential.|Inventory freshness~Versioning a format does not refresh stock.|Network reachability~Connectivity is a separate observation.|Saved formats require explicit interpretation across upgrades.",
      "Why should current price be checked after restoring a cart?|Saved intent can outlive authoritative price changes|Restoration always corrupts decimals~Corruption is not inherent to restoration.|A tab selection grants a discount~Navigation does not authorize pricing.|Local memory is the authoritative price source~Business price policy is server-owned.|Continuity should not substitute stale business facts.",
      "A bank restores an account route after token revocation. What is required before showing protected data?|Current identity and access|Only a valid route string~An identifier is not permission.|Only the old screenshot~A screenshot is stale sensitive data.|Only the saved scroll position~Position does not establish access.|Restored navigation remains subject to current access checks.",
      "A new release removes a field that an old draft requires. What should the loader do?|Migrate or report incompatibility|Deserialize blindly and assume defaults are harmless~Defaults can silently change user intent.|Delete every unrelated local record~That exceeds the scope of the incompatible state.|Pretend the old version was already submitted~No submission evidence exists.|Compatibility handling must preserve or honestly report the draft state.",
      "A warehouse app restarts offline with a pending count edit. Which presentation is honest?|Show the local edit as pending synchronization|Show a confirmed central stock update~The server has not acknowledged it.|Hide the edit and claim no work exists~That conceals saved user intent.|Issue a new central record on every repaint~Repainting is not an idempotent sync contract.|Local visibility and remote acceptance are distinct states.",
      "A restart restores quantity7 from a draft while authoritative stock is4. The product forbids silently changing requested quantities and requires current validation before purchase. Which result satisfies both rules?|Keep quantity7 as a draft and require conflict resolution|Clamp the draft to4 and mark the original request fulfilled~That silently changes the requested quantity and misreports fulfillment.|Keep quantity7 and mark stock reserved based on the saved cache~Saved intent does not establish current inventory acceptance.|Discard the draft and report the order as rejected by the server~The server has not made that stated order decision.|Continuity preserves the edit while authoritative stock creates a visible unresolved constraint.",
      "An account-A draft reload is pending when account B signs in; its schema is compatible with the current app. Which condition must still guard displaying the reload result?|Active account and current restore request both match|Its JSON parses and its schema version is current~Representation validity does not establish account ownership.|It arrived after the login screen finished animating~Arrival timing is not an account boundary.|Its cached resource ID exists in local storage~Existence does not authorize the current account to view it.|Restoration acceptance needs identity and relevance as well as valid representation.",
      "A recovery design stores the selected tab, scroll anchor and one-time password together. The product requires harmless UI continuity but prohibits retaining the OTP after its short-lived use. Which split matches those contracts?|Restore tab/anchor under their policy; expire the OTP separately|Keep all three until the user uninstalls the application~That violates the declared OTP lifetime.|Drop tab and anchor whenever the OTP expires~That unnecessarily couples unrelated state lifetimes.|Use the OTP as the persistent identifier of the saved navigation state~That misuses a short-lived secret as durable metadata.|Persistence lifetime and sensitivity must be determined for each field.",
      "The active user is A. An owned v1 draft encodes requested units as the string7; the v2 migration parses a nonnegative integer. Current stock is4 and policy forbids silent quantity changes. A second cached draft belongs to B. Which restoration result preserves all boundaries?|Migrate A\u2019s7 and flag stock conflict; do not display B\u2019s draft|Migrate A\u2019s7, clamp it to4 and report the original request fulfilled~That violates the explicit no-silent-change rule.|Reject A\u2019s compatible draft because stock is lower and restore B instead~Stock conflict does not authorize B\u2019s foreign draft.|Parse both drafts and display them because valid v2 format implies ownership~Schema validity does not establish the active user\u2019s ownership.|Ownership excludes B, migration retains A\u2019s intent, and current stock requires explicit conflict resolution."
    ],
    "lang": "python"
  },
  {
    "id": "mobile-ui-touch-focus",
    "title": "Design touch regions, labels and focus as separate requirements",
    "comps": [
      "m2.c1"
    ],
    "intro": "A nurse taps a small icon while wearing gloves, and another user reaches the same action through a screen reader. The visible glyph, the interactive hit region and the accessible name are different parts of the control. A beautiful icon can still be difficult to activate or impossible to identify.",
    "sections": [
      [
        "Size interactive regions deliberately",
        "Use the target platform\u2019s current guidance and the product\u2019s accessibility requirements to choose a minimum interactive area. Density-independent units are not physical pixels, so multiplying every design value by display density without understanding the framework can double-scale a layout. Keep enough spacing between neighboring targets to reduce accidental activation.",
        "A larger invisible hit region must not overlap another control ambiguously or intercept a scroll gesture. Measure the effective clickable region in the rendered UI and test its edges. The fixture assumes a product minimum of 48 logical units; this is an explicit design constraint for the exercise, not a universal claim about every platform\u2019s required minimum."
      ],
      [
        "Make interaction understandable",
        "Give meaningful actions an accessible name, role and enabled state. A decorative image should not add noisy duplicate announcements. Use focus order consistent with the task and reading order, retain a visible focus indication for keyboard or switch access, and return focus appropriately after a modal closes.",
        "Labels must describe the action or result rather than merely the icon\u2019s shape. A trash-can icon controlling an appointment should communicate cancellation or deletion precisely, including any confirmation requirement. Test with actual assistive technology and large text; arithmetic on rectangles does not verify semantics, gesture arbitration or physical usability."
      ]
    ],
    "code": "minimum=48\nvisible=(24,24)\nhit=(max(minimum,visible[0]),max(minimum,visible[1]))\nprint(hit)\nprint('padding per side',(hit[0]-visible[0])//2)",
    "expect": "(48, 48)\npadding per side 12",
    "problem": "Calculate a centered hit region under the stated product minimum.",
    "steps": [
      "Keep the visible glyph size separate from the required interactive size.",
      "Expand both hit-region dimensions to the explicit minimum.",
      "Split the additional width around the centered glyph."
    ],
    "limit": "The Python rectangle arithmetic assumes a non-overlapping layout. It does not execute touch dispatch, framework density conversion or assistive technology.",
    "mistakes": [
      "Enlarging only the image can distort the visual design without fixing the hit region. Inspect the interactive bounds.",
      "Using the icon filename as the accessible label can obscure the business action. Name the action."
    ],
    "takeaways": [
      "Measure the actual interactive region.",
      "Accessibility includes names, roles, states and focus.",
      "Platform measurements and product constraints must be explicit."
    ],
    "practice": [
      "In this fixture, what does the value 48 represent?|A stated product minimum in logical units|A guaranteed pixel count on every display~Density changes physical pixel mapping.|A universal rule for every platform~The exercise declares a local requirement.|The required icon artwork size~Hit regions and artwork differ.|The numeric requirement belongs to the given design contract.",
      "A 24-unit glyph is centered in a 48-unit hit region. What extra space is present per side?|12 logical units|24 on each side~That would yield72 total.|48 on each side~That would yield120 total.|Zero because the glyph is unchanged~The interactive region is larger.|The width difference is24 and is split equally.",
      "A large transparent hit region covers the adjacent Save button. What needs correction?|Non-overlapping hit regions|Only the icon\u2019s color~Color does not fix hit ownership.|Only the accessible label~A label does not resolve overlapping hit tests.|Only a longer animation~Animation does not assign the target correctly.|Interaction geometry must avoid conflicting controls.",
      "A screen reader announces icon_27.svg for canceling a visit. Which improvement addresses meaning?|Action name and button role|Rename only the source file~A filename change may not supply semantics.|Increase network timeout~Networking does not describe the control.|Hide every nearby label~That removes useful context.|An accessible name must explain the actual action.",
      "A modal closes after validation fails. What should focus handling consider?|A meaningful return or error location|Always the first element in the app~That can disorient the user.|Only the last painted pixel~Pixels do not define focus semantics.|Only the keyboard\u2019s color~Appearance is unrelated to focus location.|Focus should support continuing the task and understanding errors.",
      "A geometry test passes, but switch users cannot reach the action. What evidence is missing?|Assistive-input and focus testing|Another rectangle multiplication~More geometry does not exercise focus traversal.|A higher-resolution logo~Artwork resolution does not expose actions.|Only a server response code~The failure is in interaction access.|Target size alone is not complete accessibility."
    ],
    "formal": [
      "What can be larger than a visible mobile icon?|Its interactive hit region|Its server-side authorization solely due to size~Visual geometry grants no permission.|Its application identifier~An identifier is unrelated to bounds.|Its network timeout automatically~Touch size does not configure requests.|Hit geometry and visual artwork are separate concerns.",
      "Which label best conveys an action rather than an icon shape?|Cancel appointment|Cross-shaped image~Shape does not state the business effect.|Asset_103~An asset identifier is not meaningful action text.|Blue symbol~Color alone does not describe behavior.|Accessible names should communicate the action.",
      "Why should density-independent units be distinguished from pixels?|Logical-to-pixel mapping|Every phone has the same density~Device densities vary.|Logical units disable scaling~They participate in platform scaling rules.|Pixels determine authorization~Authorization has no geometric unit.|Correct measurements require understanding the framework\u2019s coordinate system.",
      "A 30-unit glyph has a required 50-unit centered hit width. What horizontal expansion is needed?|10 per side|20 per side~That creates70 total.|50 per side~That creates130 total.|No expansion~Thirty fails the stated50 requirement.|The difference is20, split equally around the glyph.",
      "A form is visually ordered top-to-bottom but focus jumps from Submit back to the first field. What should be inspected?|Focus order and task flow|Only the server hostname~The hostname does not define UI traversal.|Only the display refresh rate~Refresh timing does not establish focus order.|Only icon compression~Image compression cannot repair traversal.|Interaction order should support a coherent task sequence.",
      "A decorative separator is read aloud between every field. Which treatment is suitable?|Exclude decoration from redundant semantics|Give every line a numbered action role~That introduces more false controls.|Remove all field names~That destroys essential information.|Increase all touch regions~Geometry does not remove announcements.|Decorative elements should not add meaningless speech.",
      "Two adjacent controls each have a48-unit interactive width inside a96-unit region. Product rules also require an8-unit gap. Both labels are accessible. Which conclusion follows?|The geometry needs104 units, so this arrangement cannot meet the gap|The geometry passes because48+48 equals the available96~That calculation omits the required gap.|The labels compensate for the missing8 units of separation~Semantic labels do not create physical spacing.|The gap is satisfied if the two invisible hit regions overlap~Overlap conflicts with the required separation.|Target dimensions, separation and accessible meaning are independent acceptance requirements.",
      "A booking form is operable by touch and has correct screen-reader labels, but keyboard focus is invisible and Enter can activate an unclear field. Which next evidence is required?|Keyboard traversal, visible focus and activation behavior|Another test of target rectangles under touch input~That does not exercise the keyboard-specific failure.|An accessibility-label spelling check without interaction~Correct labels alone do not show focus or activation behavior.|A lower network timeout to make submission feedback faster~Network timing does not establish which control is focused.|Accessibility evidence must include the supported input modality and its actual task behavior.",
      "A destructive visit-cancel control meets the size minimum but sits against a frequently used harmless action; the two icons look similar. Which mitigation addresses the remaining interaction risk?|Distinct action meaning, sufficient separation and recovery policy|A larger hit region extending over the adjacent harmless action~That can increase ambiguous target ownership.|A shared label so both controls are announced consistently~That removes the semantic distinction between actions.|A faster destructive request to minimize visible delay~Speed does not reduce mistaken activation or its consequence.|Size is only one component of a safe destructive-action design.",
      "A120-unit toolbar has8-unit safe insets on each side, two48-unit hit regions and an8-unit gap. The glyphs are24 units, but the two action labels are swapped and keyboard order is reversed. Which assessment is correct under requirements for48-unit targets, separation and meaningful traversal?|Geometry fits104; correct the swapped labels and focus order|Geometry fails because24-unit glyphs imply24-unit hit regions~The problem explicitly gives48-unit interactive regions independent of glyphs.|Geometry needs112 units, so semantics can be deferred until widening~The content needs48+48+8=104, which equals120\u221216.|The toolbar passes all requirements because hit regions fit~Meaningful labels and traversal still fail despite correct geometry.|The104-unit content budget is exact; accessibility semantics and keyboard order require independent corrections."
    ],
    "lang": "python"
  },
  {
    "id": "mobile-ui-window-constraints",
    "title": "Adapt to the available window, insets and text size",
    "comps": [
      "m2.c2"
    ],
    "intro": "A customer opens a tablet app in a narrow split-screen window. Choosing layout from the device\u2019s marketing category would produce the wrong interface. Responsive layout reacts to available space; adaptive design can also select a different interaction pattern when the context changes.",
    "sections": [
      [
        "Measure the actual constraint",
        "Use the current window or local container constraints appropriate to the component. In Flutter, MediaQuery.sizeOf concerns the app window while LayoutBuilder exposes local layout constraints. A component inside a side panel should not assume the entire display width is available. Subtract explicit padding and gaps when deriving how many columns fit.",
        "Insets describe regions occupied or obstructed by system UI and transient input such as a keyboard. Safe-area handling and keyboard avoidance solve related but distinct problems. A control may avoid a display cutout yet still be obscured by the keyboard; test the actual screen state instead of treating one inset adjustment as universal."
      ],
      [
        "Preserve content under change",
        "Choose breakpoints from the content\u2019s minimum usable size, not a list of fashionable device widths. At large text sizes, a fixed-height row may clip its label even when the screen is wide. Allow wrapping, flexible height or an alternative layout while retaining the same underlying task state.",
        "Resizing or rotating should not submit a form, clear a draft or recreate a different business entity. Keep identity and data independent of layout selection. The example calculates two equal columns from a supplied width budget; it does not render fonts, evaluate intrinsic widget sizes or prove that text remains usable on a real device."
      ]
    ],
    "code": "window=720\npadding=24\ngap=16\nusable=window-2*padding\ncolumn=(usable-gap)/2\nprint(int(usable),int(column))\nprint('two columns',column>=300)",
    "expect": "672 328\ntwo columns True",
    "problem": "Derive two-column feasibility from actual available width and an explicit content minimum.",
    "steps": [
      "Subtract both outer padding regions.",
      "Reserve the gap exactly once.",
      "Divide the remaining width and compare with the stated minimum."
    ],
    "limit": "The Python calculation verifies supplied dimensions only. It does not measure real text, Flutter constraints, safe areas or keyboard obstruction.",
    "mistakes": [
      "Using physical device width in split-screen can overestimate the component\u2019s space. Measure the current relevant container.",
      "Fixing row height while ignoring large text can clip controls. Test content-driven sizing."
    ],
    "takeaways": [
      "Available constraints drive layout.",
      "Insets, text scale and orientation require testing.",
      "Layout changes must preserve task identity and edits."
    ],
    "practice": [
      "Which width should a split-screen component use?|Its current available constraint|The tablet\u2019s full display width~The app may occupy only part of it.|The product\u2019s largest screenshot~A screenshot is not a runtime constraint.|The server\u2019s response length~That is not a geometric measurement.|The component must fit the space it actually receives.",
      "What is the usable width for720 with24 padding on both sides?|672|696~That subtracts only one side.|704~That subtracts the gap rather than both padding regions.|720~That ignores padding.|Both padding regions are reserved, so720\u221224\u221224 gives672 usable units.",
      "For672 usable width and one16-unit gap, how wide is each of two equal columns?|328|336~That forgets the gap.|320~That subtracts the gap twice.|656~That is the combined column width.|Subtract the gap before dividing by two.",
      "A phone rotates while a user edits a note. Which state should layout selection preserve?|The same draft and its identity|A new submission per orientation~Rotation is not a submission command.|An empty draft to simplify rendering~That loses user work.|A different account chosen by width~Geometry must not change account identity.|Presentation changes must not redefine the business task.",
      "A button avoids the notch but disappears behind the keyboard. What was not addressed?|Keyboard-related obstruction|Only display density~Density alone does not express the keyboard inset.|Only the image\u2019s MIME type~Image format is unrelated.|Only the user\u2019s token expiry~Authentication does not position controls.|Safe-area handling does not automatically solve every keyboard layout case.",
      "A form fits at default text size but clips at200% text. Which correction is relevant?|Flexible height or layout|Lock text scaling globally~That removes accessibility support instead of accommodating it.|Fetch the same data twice~Fetching does not create layout room.|Rename the route~Navigation naming does not prevent clipping.|Layout must support the content under the required text-scale settings."
    ],
    "formal": [
      "What is a responsive mobile layout responding to?|Available layout space|Only the device brand~Brand does not determine current constraints.|Only account creation date~That is unrelated to geometry.|Only the backend language~Server implementation does not define window width.|The relevant constraint can change during one app session.",
      "What does a gap reserve between equal columns?|Inter-column space|An extra column~A gutter is not a content column.|Only font height~The gap here is horizontal.|A server storage quota~Geometric spacing is unrelated.|Gutters consume width from the layout budget.",
      "Why can local container width differ from window width?|Local container constraints|Every widget always owns the full window~Nested constraints limit available space.|Network compression changes screen width~Compression does not change geometry.|Window width exists only on tablets~Phones also have windows and local constraints.|Local layout should use the constraints appropriate to its own position.",
      "A two-column design needs300 per column and16 gap, plus24 padding on each side. What minimum window width is required?|664|616~That omits outer padding.|648~That omits the gutter.|600~That includes only the two columns.|600+16+48=664 under the stated assumptions.",
      "A tablet app runs in a500-unit split-screen window. The two-column minimum is664. Which choice follows the constraint?|Use the single-column arrangement|Force two columns because the hardware is a tablet~Hardware category does not override available space.|Reduce all text until it is unreadable~That violates content usability.|Use the full display width in the calculation~That width is not available to the app.|The window fails the stated two-column feasibility test.",
      "A hospital form passes separate tests for long translation, large text and an on-screen keyboard. The combined state has not been exercised. Which test closes the stated evidence gap?|The translated, enlarged-text form while the keyboard is visible|A second default-language screenshot with a larger display~That does not combine the conditions causing the risk.|A keyboard-free test that doubles the HTTP timeout~Timeout changes do not measure obstruction or wrapping.|A string-length count without rendering the enlarged form~String length cannot establish actual layout or visibility.|Context changes can interact; separate successes do not establish their combination.",
      "A panel receives320 units inside a1000-unit window. Its two-column layout requires300 per column plus16 gap and48 outer padding. Which scope and arrangement are valid?|Use the320-unit panel constraint and a single-column arrangement|Use the1000-unit window constraint and enable two columns~The panel does not own the rest of the window.|Use the full screen diagonal to satisfy the664-unit requirement~Diagonal size does not establish panel width.|Use the previous orientation width because the outer window is stable~The current local constraint is authoritative for this component.|The local allocation fails the664-unit two-column minimum.",
      "A booking form loses unsent values whenever orientation switches between one and two columns. Its server record and account identity are unchanged. Which boundary should be refactored?|Keep the logical draft outside the replaced layout-specific subtree|Create a new server booking for each column arrangement~That duplicates a business task for a presentation change.|Treat rotation as consent to reset the form to server defaults~That discards intent without an explicit product policy.|Store each field only in the newly created visual control~That retains the same lifetime coupling responsible for the loss.|Layout recreation should not own the lifetime of the business draft.",
      "A team\u2019s fixed breakpoint passes an English default-size form but long localized labels overflow at a larger width. Which evidence should determine the revised breakpoint?|Minimum usable content layout under supported text and locale settings|The most common device model\u2019s marketing display category~The actual content can overflow within that category.|The previous release\u2019s screenshot dimensions regardless of new labels~Old presentation evidence does not cover changed content.|The largest window the development laptop can display~That does not establish the minimum supported usable layout.|Breakpoints should follow relevant content constraints rather than a device-name heuristic.",
      "A700-unit window reserves20 per horizontal side and a20 gutter; two columns need320 each. Its600-unit height loses240 to keyboard,20 to safe inset and80 to header. Remaining content needs240 plus a48-unit action and16 gap. Which diagnosis follows?|Width fits; vertical demand exceeds260 available by44|Width fails by20, while the vertical content fits exactly~Horizontal space is640 for two320 columns; vertical demand is304.|Width fits and a keyboard-safe claim follows from that arithmetic~Horizontal fit does not establish vertical visibility.|Vertical space is340, so no overflow or focus handling is needed~That omits the80-unit header from the available-height calculation.|The horizontal budget is exact;600\u2212240\u221220\u221280=260, while240+48+16=304 requires scrolling or reflow."
    ],
    "lang": "python"
  },
  {
    "id": "mobile-ui-navigation",
    "title": "Keep navigation, back behavior and task state coherent",
    "comps": [
      "m2.c1",
      "m2.c2"
    ],
    "intro": "A support agent opens a ticket from a notification, edits its priority, and presses Back. Navigation must make the route and its parameters understandable without using the route itself as business authorization. The user should neither lose an unsaved edit silently nor return to an unrelated account\u2019s screen.",
    "sections": [
      [
        "Represent destinations and task identity",
        "A route identifies a destination and may carry an object identifier or presentation parameters. The destination loads current data and enforces access through the application\u2019s authoritative services. Prefer stable identifiers over passing a mutable object snapshot that becomes stale. A deep link is external input and must be parsed, bounded and validated before it influences the route graph.",
        "Define whether opening a detail creates a new task entry, selects an existing destination or replaces the current screen. The desired behavior depends on the product\u2019s navigation model. For a compact window, a list-to-detail stack may be appropriate; in a wider window the same selection can appear in a master-detail layout without duplicating the ticket\u2019s business identity."
      ],
      [
        "Design backward movement deliberately",
        "Back may dismiss a modal, leave a detail screen or exit a navigation branch. Unsaved changes need a product policy such as save, discard confirmation or a recoverable draft; simply blocking all back actions can trap the user. Retain meaningful focus and selected context when returning to a list.",
        "The fixture models a simple push and pop with destination identifiers. It does not implement platform gestures, Android system back, iOS navigation conventions or a framework router. Test deep-link entry, authentication transitions, resizing and nested navigation with the actual supported router version before claiming correct platform behavior."
      ]
    ],
    "code": "stack=['tickets']\nstack.append('ticket:42')\nstack.append('priority-dialog')\nprint(stack.pop())\nprint(stack[-1])",
    "expect": "priority-dialog\nticket:42",
    "problem": "Dismiss the current modal before leaving its owning detail destination.",
    "steps": [
      "Represent the current destination sequence.",
      "Push the dialog on top of its ticket.",
      "Pop the top entry and inspect the remaining current destination."
    ],
    "limit": "The Python list is only a navigation-stack model. It does not test a mobile router, accessibility focus return, platform back gestures or unsaved-change persistence.",
    "mistakes": [
      "Treating a deep-link ID as proof of access confuses navigation with authorization. Validate current permissions.",
      "Pushing duplicate task instances on every resize can split user edits. Keep task identity independent of layout."
    ],
    "takeaways": [
      "Destinations carry identity rather than permission.",
      "Back behavior must match the active navigation context.",
      "Compact and expanded layouts should share task state."
    ],
    "practice": [
      "What should a deep-linked ticket identifier establish by itself?|Requested resource identity|Permission to read the ticket~An identifier does not grant authorization.|A current ticket snapshot~The resource may have changed.|A successful login~A link is not identity evidence.|Navigation parameters identify a requested destination.",
      "In the stack tickets\u2192ticket42\u2192dialog, which entry is removed by one simple model pop?|The dialog|The entire account~One stack pop removes the top entry only.|The tickets root~The root is not at the top.|The server ticket~Navigation does not delete business data.|A stack pop removes the current top destination in this fixture.",
      "A detail screen is shown alongside a list after resizing. What should remain stable?|The selected ticket\u2019s task identity|A second conflicting ticket edit~Duplicating the task splits intent.|A forced server update~Resizing is not a business command.|A new account context~Layout must not switch identity.|Adaptive presentation should reuse the same logical selection.",
      "A deep link names a ticket from another tenant. What is required?|Current object-level authorization|Only syntactically valid route text~Syntax does not establish access.|Only a matching screen title~Labels do not authorize resources.|Only a successful push animation~An animation is not a policy check.|The authoritative service must enforce the active tenant boundary.",
      "A user presses Back with unsaved changes. Which design question matters?|An explicit edit-exit policy|Whether the route name is short~Length does not resolve lost work.|Whether the icon is cached~Caching does not preserve edits.|Whether the list has more rows~Row count does not define exit semantics.|Navigation should handle unsaved intent explicitly.",
      "The model pops a dialog correctly. Which claim is unsupported?|Native gestures and focus|The top list entry was removed~That follows the local Python operation.|The ticket remains below the dialog~The literal stack establishes that.|The final string is ticket42~The output demonstrates that local result.|A list fixture is not a native navigation or assistive-technology test."
    ],
    "formal": [
      "What is a route parameter usually suitable for conveying?|A stable resource identifier|Unlimited resource permission~Permission needs policy enforcement.|Guaranteed current server state~A parameter may be stale.|A completed payment~Navigation does not prove transaction completion.|A destination can use an identifier to load current data.",
      "What is the role of a navigation stack in the simple fixture?|Order the current destination history|Encrypt database records~The list performs no cryptography.|Issue server authorization grants~Navigation history is not a permission system.|Schedule guaranteed background work~A stack cannot control OS execution.|Stack ordering models entering and leaving destinations.",
      "Why is a mutable object snapshot risky as the only route data?|Stale resource snapshot|It prevents all navigation~Snapshots do not inherently block navigation.|It always creates a network request~A local object does not guarantee networking.|It automatically reveals every password~Sensitivity depends on its actual contents.|Stable identity allows the destination to reconcile current data.",
      "A notification opens an invoice while the user is signed out. Which flow is coherent?|Authenticate then authorize|Display protected fields before checking identity~That can disclose data.|Treat possession of the notification as permanent permission~Links can be forwarded or stale.|Discard all existing user drafts unconditionally~Authentication routing should not erase unrelated work.|External entry requires current identity and resource checks.",
      "A modal for editing priority is open over ticket42. Under the stated stack policy, what should Back dismiss first?|The priority modal|The remote ticket record~Back is not a delete command.|Every navigation branch~The top modal is the active context.|The authenticated session~Dismissal does not imply logout.|Backward movement follows the active navigation context.",
      "A ticket list can reorder while a user edits ticket42, and a shared device may switch accounts. Which key preserves the correct draft owner across these changes?|Stable account identity plus stable ticket identity|Current list-row index plus current orientation~Positions and geometry can change without changing the task.|Visible ticket title plus current viewport width~Titles can change or collide and width is presentational.|Arrival order of the latest list response alone~Network order does not identify a unique draft owner.|Draft ownership should follow stable business and account identities.",
      "A push notification supplies an unknown route name and a very large record ID. The app recognizes only a bounded set of ticket routes. Which acceptance step is appropriate?|Validate the supported route shape and bounded identifier before resolution|Pass the destination through directly because notification delivery succeeded~Transport delivery does not validate its navigation semantics.|Find the closest route name and coerce any integer into a valid ticket~That invents unsupported input interpretation.|Load a ticket before checking whether the destination is recognized~That can invoke unintended data access before input validation.|External navigation is untrusted input with an explicit accepted route contract.",
      "A ticket draft is open in compact mode, then becomes a two-pane view after resizing. Which result demonstrates correct task-state ownership?|One existing draft and selected ticket appear in the new presentation|Each pane creates an independent draft for the same ticket~That splits one task and can create conflicting edits.|The resize submits the draft so the second pane has fresh data~Presentation change is not user consent to submit.|The larger pane switches to a different account\u2019s ticket list~Layout does not establish account identity.|The presentation adapts while the logical task remains the same.",
      "An editor blocks Back for any changed field but exposes no save, discard or draft recovery path. Validation errors prevent submission. What requirement is missing?|A usable resolution path that preserves or explicitly discards intent|A stricter block that also disables every visible close control~That further traps the user without resolving the edit.|An automatic submit despite the validation errors~That violates domain validation rather than solving navigation.|A repeated login prompt before every Back press~Reauthentication does not provide an edit resolution path.|An unsaved-change policy needs understandable ways to continue or leave safely.",
      "A modal has unsaved priority edits for ticket42 after the app expands to two panes. Back first opens a discard confirmation; the user cancels it. A later Save fails validation. Under a policy that retains invalid unsaved edits, which state should remain?|The same ticket42 modal and draft remain unresolved|The modal closes because Back was pressed earlier~The user canceled the discard decision, so no exit was authorized.|A second ticket42 draft is created for the wide pane~Layout expansion does not create a second business task.|The invalid edit is submitted and the root route replaces the ticket~Validation failure does not permit submission or imply root navigation.|Canceling discard preserves the edit, and a failed Save does not satisfy the modal\u2019s exit policy."
    ],
    "lang": "python"
  },
  {
    "id": "mobile-ui-network-states",
    "title": "Make unreliable-network states visible without losing local work",
    "comps": [
      "m3.c1"
    ],
    "intro": "A field-sales app can show yesterday\u2019s customer list while offline, but it must not pretend a new order has been accepted by the server. Good mobile behavior separates available local information, pending user intent and confirmed remote effects.",
    "sections": [
      [
        "Model the feature\u2019s observable states",
        "A useful feature distinguishes initial loading, useful data, an empty successful result, a recoverable failure and stale cached data. An empty array from a successful query means something different from a timeout that returned no result. Keep visible data during refresh when the product allows it, and show a non-disruptive refresh or failure state instead of replacing the whole screen with a spinner.",
        "Connectivity indicators are hints, not promises that a particular request can complete. A device may have Wi-Fi but lack access to the service. Apply bounded timeouts and an explicit retry policy, and avoid repeating a non-idempotent operation without a stable operation identity and reconciliation strategy. Preserve unsent edits separately from cached server snapshots."
      ],
      [
        "Choose freshness and recovery policies",
        "Decide which operations can run offline. Reading a saved catalogue and drafting an order may be permitted, while final stock reservation requires current server validation. Label stale information with useful context and make pending versus failed versus confirmed states distinguishable. Do not hide an unsuccessful submission merely because an optimistic UI displayed a success animation.",
        "The fixture classifies local data and remote failure into a display state. A real implementation also requires storage, accessibility announcements, cancellation and synchronization tests. It should test a dropped connection after the remote server may already have committed, because a missing response is not evidence that a write failed."
      ]
    ],
    "code": "def view(cache,remote_ok,remote_rows):\n    if remote_ok:\n        return 'data' if remote_rows else 'empty'\n    return 'stale' if cache else 'error'\nprint(view(['customer'],False,[]))\nprint(view([],True,[]))",
    "expect": "stale\nempty",
    "problem": "Distinguish a failed refresh with useful cache from a successful empty response.",
    "steps": [
      "Check whether the remote request succeeded.",
      "Interpret emptiness only after success.",
      "Keep useful cached information explicitly stale when refresh fails."
    ],
    "limit": "This Python classifier uses supplied outcomes. It does not access connectivity, implement a cache or prove a remote write\u2019s outcome.",
    "mistakes": [
      "Treating a timeout as a successful empty list conceals failure. Keep outcome and payload semantics separate.",
      "Replaying an order with a fresh identity after a lost response can duplicate it. Reconcile the original operation."
    ],
    "takeaways": [
      "Empty, failed and stale are different states.",
      "Preserve local intent during network trouble.",
      "A connectivity icon is not proof of request success."
    ],
    "practice": [
      "When does an empty response represent a successful empty state?|Success with zero rows|Whenever no bytes arrived~A timeout can return no bytes.|Whenever Wi-Fi is enabled~Wi-Fi does not establish request success.|Whenever cache is missing~Cache absence says nothing about the response.|Payload emptiness must be interpreted with the request outcome.",
      "What can a connectivity indicator establish?|A limited connectivity hint|Guaranteed access to the inventory API~Routing and service failures can still occur.|A successful server write~Only operation evidence establishes that.|The freshness of saved customer data~Connectivity does not timestamp a cache.|Per-request behavior must still be observed.",
      "A refresh fails but useful cached data exists. What is an honest presentation?|Visible stale cache and retry|A confirmed fresh dataset~No successful refresh occurred.|A successful empty result~A failed request is not an empty query.|A fabricated server acknowledgment~No write acknowledgment exists.|Useful data can remain visible while its limitations are explicit.",
      "A drafted order is allowed offline but reservation requires current stock. What state fits before synchronization?|Pending remote validation|Confirmed stock reservation~No current reservation occurred.|A discarded local order~That loses an allowed draft.|A permanently failed order~Offline drafting is permitted.|Local intent is separate from remote acceptance.",
      "A request times out after a possible order commit. Which next step avoids unsupported assumptions?|Reconcile the original write|Immediately use a fresh order identity~That can create a second order.|Mark success from the spinner ending~Animation is not transaction evidence.|Treat missing response as proof of rollback~The server may have committed.|Unknown outcomes require status or idempotent recovery semantics.",
      "The classifier prints stale. What remains untested?|Real storage and transport|The supplied Boolean comparison~The local execution tests it.|The literal cache list\u2019s truth value~That is exercised by the branch.|The final string construction~The output establishes it.|A state-model result is not end-to-end networking evidence."
    ],
    "formal": [
      "What differentiates a stale-data state from a fresh-data state?|Data freshness evidence|The number of icons alone~Icons do not establish data currency.|A universal absence of records~Stale data can contain records.|A guaranteed server error forever~Refresh can later succeed.|Freshness is a property of the data and validation policy.",
      "What should unsent local edits be kept separate from?|Cached authoritative-service snapshots|The same account\u2019s identity~Edits still need ownership information.|Their own durable operation identifier~That supports tracking rather than replacement.|The user\u2019s explicit intent~The edits are that intent.|A refresh should not silently overwrite a pending edit.",
      "Why is an unbounded retry loop unsuitable for a mobile feature?|It can consume resources without reaching a useful outcome|Retries always succeed by definition~Failures can persist.|A retry counter guarantees time bounds~Each attempt can still wait indefinitely.|The operating system guarantees unlimited background time~Execution is constrained.|Bound attempts, elapsed time and resource use deliberately.",
      "A report refresh returns HTTP success and zero matching invoices. Which UI state is appropriate?|A successful empty result with context|A network failure solely because the array is empty~Empty data is not necessarily an error.|A stale cache warning despite fresh validation~That misstates the observed response.|A permanent loading spinner~The request has finished.|An empty successful query is a completed result.",
      "An app replaces a populated list with a full-screen spinner on every refresh. What alternative can preserve task continuity?|Content plus refresh state|Hide all data until the next app launch~That unnecessarily removes useful context.|Pretend refresh completed instantly~That misrepresents state.|Submit pending edits on each repaint~Rendering should not create side effects.|Presentation can distinguish initial loading from refreshing existing data.",
      "A courier\u2019s device reports Wi-Fi, yet a TLS-protected API call times out; the app has useful cached assignments. Which conclusion and presentation match the evidence?|Link is insufficient; show cache explicitly stale|The API must have succeeded because Wi-Fi is connected~Link connectivity does not establish end-to-end service success.|The successful result is an empty assignment list~No successful empty result was observed.|All cached assignments were deleted by the network failure~A failed request does not imply local deletion.|A specific request can fail despite an active link, while existing cache can remain useful.",
      "A retail app permits offline catalogue browsing but requires current pricing before checkout. Its cache is two days old and the network is unavailable. Which behavior meets the stated split?|Allow labeled stale browsing and leave checkout awaiting revalidation|Confirm the displayed cached price as final because browsing is allowed~Read permission does not waive the transaction freshness rule.|Disable the entire local catalogue because checkout is unavailable~The product explicitly permits offline browsing.|Rewrite cached timestamps to the present before showing checkout~That fabricates freshness without obtaining authoritative data.|Feature policies can distinguish read continuity from transaction acceptance.",
      "A delivery confirmation is submitted and its success animation completes, but the response is lost. The server offers lookup by the original operation ID. Which state and action are justified?|Unknown completion; reconcile using the original operation identity|Confirmed delivery; animations run only after remote commit~The stated animation is not authoritative commit evidence.|Definite failure; create a fresh delivery confirmation identity~The first operation may already have committed.|No pending operation; discard the original identity after timeout~That removes the supplied safe reconciliation path.|The response gap leaves an unknown outcome that can be reconciled without inventing a new action.",
      "A refresh fails while cached stock is old and an unsent local order exists. The product allows stale browsing but no offline order confirmation. Which state model preserves both rules?|Stale stock for browsing; local order pending remote validation|Fresh stock because the cache read succeeded; order confirmed locally~A local read does not refresh stock or confirm a server transaction.|Empty successful stock result; order removed as disposable cache~That misstates request failure and loses pending intent.|Refreshing forever with the local order overwritten by cached defaults~That hides the failure and replaces user edits.|Cached facts, local intent and confirmed effects must remain distinct.",
      "A medication request times out while schedule refresh also fails and old schedule cache remains. Later an authorized lookup by the original operation ID confirms the administration committed. The app may show cached schedules but must not invent offline confirmation. What state now matches the evidence?|Schedule stale; original administration confirmed; no duplicate submit|Schedule fresh because the operation-status lookup succeeded~The write lookup did not refresh the schedule dataset.|Administration still definitely failed, so create a new operation ID~The authoritative lookup confirmed the original commit.|Administration unknown forever because the initial response was lost~Later authoritative evidence resolves that earlier uncertainty.|Read freshness remains stale, while the confirmed original write status supersedes its previous unknown outcome."
    ],
    "lang": "python"
  },
  {
    "id": "mobile-ui-resource-budgets",
    "title": "Budget network, battery and storage with platform-aware scheduling",
    "comps": [
      "m3.c1",
      "m3.c2"
    ],
    "intro": "An inventory app that polls constantly can drain a worker\u2019s battery and transfer the same unchanged catalogue repeatedly. Resource constraints are product constraints: an app must decide how fresh data must be, when work may run, and which local information can safely be evicted.",
    "sections": [
      [
        "Quantify the work before tuning it",
        "Measure requests, payload bytes, CPU time, wakeups, cache size and user-visible freshness. Use those observations to find avoidable work. Batching updates may reduce repeated overhead, but large batches can increase latency or memory use. Pagination limits the amount fetched at once; it does not remove the need to continue through all pages when a complete result is required.",
        "Prefer event-driven or scheduled work appropriate to the feature instead of assuming a process can run a permanent loop in the background. Operating systems can defer background work, and low-power modes or permission changes can alter behavior. A requested schedule should not be presented as an exact delivery guarantee without a platform contract that supports it."
      ],
      [
        "Preserve the right data under pressure",
        "Separate disposable cache from pending user-created data. A cache may be evicted when it can be reconstructed, while unsynchronized work requires durable retention and a recovery policy. Define storage quotas, cleanup rules and an honest failure state when a critical write cannot be committed. Compression can reduce transferred bytes while increasing computation; validate the actual trade-off.",
        "The fixture compares two request plans under explicit per-request and per-record costs. It establishes the arithmetic for that model only. It does not measure radio power, OS batching, TLS overhead or real battery life. Use native profiling and representative network/device tests before making a resource-efficiency claim."
      ]
    ],
    "code": "records=120\nper_record=200\nrequest_overhead=1000\nfor batch in [10,40]:\n    requests=(records+batch-1)//batch\n    transferred=records*per_record+requests*request_overhead\n    print(batch,requests,transferred)",
    "expect": "10 12 36000\n40 3 27000",
    "problem": "Compare transfer overhead for two complete pagination plans with the same record payload.",
    "steps": [
      "Compute requests using ceiling division.",
      "Count each record payload once.",
      "Add the per-request overhead for the chosen plan."
    ],
    "limit": "Python verifies a synthetic byte-cost model. Actual compression ratios, retries, latency and device energy must be measured independently.",
    "mistakes": [
      "Deleting pending edits as if they were cache loses user work. Give durable intent a distinct retention rule.",
      "Promising exact background execution ignores operating-system scheduling constraints. Communicate pending work honestly."
    ],
    "takeaways": [
      "Optimize measured resource cost under freshness requirements.",
      "Batching changes trade-offs rather than eliminating them.",
      "Eviction and scheduling policies must respect data ownership and platform contracts."
    ],
    "practice": [
      "Which data is usually the safer first eviction candidate?|Reconstructible cache with a defined policy|The only copy of an unsent delivery note~That loses user-created work.|A pending command\u2019s only durable record~That impairs reliable reconciliation.|An unacknowledged audit event required by policy~Retention obligations differ from cache.|Eviction should prioritize data whose loss is explicitly recoverable.",
      "In the120-record model, how many40-record requests are needed?|3|4~That adds an unnecessary request for these exact bounds.|12~That is the10-record plan.|40~That confuses batch size with request count.|Ceiling division120/40 gives3.",
      "What does a requested background schedule fail to prove by itself?|Exact execution time on every device|That the app requested work~The request itself can be observed.|That a scheduling policy exists~The app can define one.|That delayed work can be shown as pending~That is an honest presentation option.|Actual execution remains subject to the platform\u2019s contract and conditions.",
      "A compressed response is smaller but expensive to decode on a low-end device. What should be compared?|Representative resource costs|Only compressed byte count~That ignores decode cost.|Only the compression library\u2019s name~A brand does not quantify the trade-off.|Only the number of screens~Screen count is not a performance measurement.|Resource choices must be evaluated against the complete product cost.",
      "A cleanup job treats pending local orders as disposable cache. Which correction is required?|Separate intent from cache|Delete orders more frequently~That increases loss rather than addressing it.|Hide the cleanup log~Concealing evidence does not fix retention.|Keep only the latest visual badge~A badge cannot reconstruct order contents.|Data classes need different retention and recovery rules.",
      "A batch plan saves9000 modeled bytes. Which claim remains unsupported?|A measured battery-life improvement|The computed byte difference~The arithmetic supports that figure.|The supplied number of requests~Ceiling division determines it.|The identical record payload total~The model fixes that quantity.|Byte accounting does not directly measure radio or CPU energy."
    ],
    "formal": [
      "What is a resource budget used to constrain?|Product resource limits|Only the color palette~Visual color choices are not this work budget.|Universal delivery guarantees~A budget does not guarantee execution.|Authorization scope automatically~Access policy is separate.|Budgets connect work and resource limits to product objectives.",
      "Why is a pending user edit different from an image cache?|Unique durable user intent|Images can never be downloaded again~Many cache entries are reconstructible.|Edits do not occupy storage~They also consume bytes.|A cache always requires legal retention~Retention depends on data and policy.|Eviction rules should reflect recoverability and obligations.",
      "When can batching be beneficial?|Overhead versus latency/memory|Always regardless of deadlines~Large batches can violate latency requirements.|Only when no records exist~Batching can apply to actual data.|Whenever it avoids authorization checks~Checks must still hold.|A batch-size choice has multiple cost dimensions.",
      "A page holds25 rows and the query has101 rows. How many requests are required for full retrieval under this simple model?|5|4~Four pages hold only100 rows.|25~That is page capacity, not request count.|101~That assumes one request per row.|Ceiling101/25 gives5 when no other protocol behavior intervenes.",
      "A weather app polls every second although forecasts update hourly and no stricter freshness is required. What should guide redesign?|The actual freshness need and measured polling overhead|A universal ban on all networking~The app still needs updates.|The assumption that one-second polling guarantees new data~The source changes less often.|Only the notification icon shape~That does not reduce redundant work.|Polling frequency should serve the required information freshness.",
      "An OS defers a requested inventory sync in low-power mode. The durable local queue still contains unacknowledged edits. Which message and state are consistent?|Sync pending; retain queued edits until confirmed processing|Sync completed because the scheduler accepted the request~Scheduling acceptance is not task completion.|All edits lost because execution was delayed~Deferral does not imply deletion of durable data.|Sync guaranteed at the original second after power mode changes~The evidence does not establish that exact execution guarantee.|Execution timing and durable queue state are different facts.",
      "Two complete transfer plans carry24000 record bytes. One uses twelve1000-byte overheads and the other three1000-byte overheads. Which saving follows without extending the model?|9000 transferred bytes; battery benefit remains unmeasured|12000 bytes and a guaranteed equal percentage energy saving~That omits the second plan\u2019s overhead and invents energy evidence.|3000 bytes because only the smaller overhead should be counted~The saving is the difference between total costs.|21000 bytes after removing all payload from one plan~Both complete plans still carry the same payload.|36000\u221227000=9000; real radio and CPU energy require measurement.",
      "A catalogue cache is at quota and a unique incident report requires a durable write. Cache entries are reconstructible, pending reports are not, and writes can fail. Which policy matches those facts?|Evict eligible cache, attempt the report write and disclose its outcome|Delete the newest incident report and keep frequently viewed cache~Popularity does not make unique intent reconstructible.|Announce the report saved before the storage operation finishes~That can conceal a failed durability boundary.|Retry the same failing write forever while holding all cache entries~Unbounded retries can worsen resource pressure without establishing durability.|Retention should follow recoverability, and saved status must follow the actual write result.",
      "A larger sync batch cuts requests but blocks the lowest-supported device for450ms; the product permits at most300ms interaction delay. Which conclusion follows?|The byte optimization fails the stated responsiveness requirement|The optimization passes because fewer requests dominates every budget~The product states an independent latency constraint.|The device becomes unsupported automatically after the measurement~A support-contract change requires an explicit product decision.|The delay is irrelevant when the response is compressed~Compression does not waive the interaction deadline.|A successful optimization must remain within all required resource and user-experience limits.",
      "A complete sync has125 records at200 bytes each,1000-byte overhead/request, at most40 records/request and a30000-byte cap. Compare25-record and40-record batches; pending edits must survive deferral. Which lowest-byte plan meets all stated limits?|Four requests at40/40/40/5 cost29000; retain pending edits until acknowledgment|Three40-record requests cost28000 and complete the whole sync~They retrieve only120 of125 records.|Five25-record requests cost25000 and beat the40-record plan~That omits5000 bytes of request overhead.|Four40-record requests cost29000 and scheduling may delete queued intent~The byte calculation fits but scheduling is not completion or permission to discard edits.|Payload is25000; five overheads produce30000, while four produce29000, with the last page partial and durability still required."
    ],
    "lang": "python"
  },
  {
    "id": "mobile-ui-platform-guidelines",
    "title": "Adapt interaction conventions while keeping the product\u2019s meaning stable",
    "comps": [
      "m3.c2"
    ],
    "intro": "A shared-code app can present the same appointment workflow on Android and iOS without copying every pixel. Platform conventions help users predict navigation, text entry and system interactions. Product consistency should preserve meaning and data integrity while allowing interaction details to suit the platform.",
    "sections": [
      [
        "Use guidelines as evidence, not decoration",
        "Material and Apple Human Interface guidance describe design systems and interaction expectations. Check the current relevant platform documentation and supported framework version before making a version-specific claim. A Material-looking color palette does not by itself establish correct Android behavior, and a Cupertino-looking button does not establish correct iOS navigation or accessibility.",
        "Separate shared destination data and business rules from the widgets that present them. A compact interface might use a bottom navigation pattern while a wider window uses a rail, but both should refer to the same stable destinations. Do not make account authorization, form validation or object identity depend on which visual component is selected."
      ],
      [
        "Validate conventions with real interactions",
        "Review back gestures, modal dismissal, text selection, permission prompts and external links using supported platform configurations. Preserve discoverability and accessibility instead of switching controls merely for stylistic uniformity. Explain unavoidable platform differences clearly in help content without suggesting that every shared component behaves identically.",
        "The fixture chooses a presentation label from platform and available width. The threshold is an exercise\u2019s product rule, not an official universal breakpoint. The calculation cannot demonstrate native gesture handling or compliance with either design system. A review checklist should record the relevant guideline revision, tested devices, observed exceptions and the rationale for product-specific deviations."
      ]
    ],
    "code": "def navigation(width,platform):\n    if width>=700:\n        return 'rail'\n    return 'bottom-bar' if platform=='android' else 'compact-tabs'\nprint(navigation(420,'android'))\nprint(navigation(900,'ios'))",
    "expect": "bottom-bar\nrail",
    "problem": "Choose presentation under a stated product policy while retaining a shared destination model.",
    "steps": [
      "Use the available width rather than the device name.",
      "Apply the declared wide-window policy first.",
      "Use the platform-specific compact presentation rule when space is narrow."
    ],
    "limit": "Python selects literal labels under an authored policy. It does not instantiate Material, Cupertino or native OS controls, and700 is not asserted to be an official breakpoint.",
    "mistakes": [
      "Equating platform compliance with a color theme overlooks behavior, semantics and permissions. Test interactions.",
      "Switching visual navigation while changing destination IDs breaks task continuity. Share stable destination meaning."
    ],
    "takeaways": [
      "Platform conventions cover behavior, not just appearance.",
      "Shared business identity can coexist with adaptive presentation.",
      "Document version-specific evidence and intentional deviations."
    ],
    "practice": [
      "What should remain stable when bottom navigation becomes a rail?|Destination identity and business rules|The exact pixel coordinates~Presentation intentionally changes.|A new account selected by layout~Layout should not switch identity.|A duplicate copy of every transaction~Navigation does not require new effects.|Shared destinations preserve the same logical workflow.",
      "What does choosing a Cupertino-looking widget establish alone?|A presentation choice only|Correctness of every system gesture~A widget choice is insufficient evidence.|Permission to skip accessibility tests~Semantics still need verification.|A current App Store approval~Store review is a separate process.|Appearance does not establish the entire interaction contract.",
      "The fixture uses700 as a width threshold. How should it be documented?|An explicit exercise product rule|A permanent universal platform breakpoint~No such claim was verified.|A server security boundary~It affects presentation only.|A physical pixel constant for all screens~The model uses supplied logical width.|The origin and scope of a design threshold must be clear.",
      "An app uses familiar platform colors but mishandles Back. What should be corrected?|The platform\u2019s Back behavior|Only a darker color~The failure is behavioral.|Only a new app icon~Branding does not define Back semantics.|Only the API payload order~That does not repair navigation.|Guideline-aligned presentation includes interaction behavior.",
      "Android and iOS share appointment validation but display different navigation controls. What is appropriate?|Shared rules; separate OS tests|Make validation weaker on the compact control~Visual style must not weaken business rules.|Assume one OS test proves the other~Their interaction paths can differ.|Use widget names as account permissions~Presentation metadata is not access policy.|Shared domain logic and platform-specific evidence complement each other.",
      "A reviewer finds a deliberate deviation from a guideline. What should accompany it?|A rationale and tested impact on supported users|A claim that all guidelines are irrelevant~A deviation needs justification.|A hidden removal from the review checklist~That conceals a known decision.|A fabricated guideline citation~Source evidence must be accurate.|Reviewable exceptions should have reasons and observed consequences."
    ],
    "formal": [
      "What is a design-system guideline useful for?|Expected interaction and presentation conventions|Automatic correctness of all business rules~Guidelines do not implement domain validation.|Guaranteed approval by every store~Review has additional requirements.|Permission to omit user testing~Guidance does not replace testing.|Conventions help users predict app behavior.",
      "Which layer should decide whether an appointment operation is allowed?|Authoritative domain policy|The chosen tab icon~Icons do not enforce policy.|The navigation rail\u2019s width~Geometry is not authorization.|The operating-system theme color~Theme metadata does not grant permission.|A visual adaptation must not become the permission boundary.",
      "Why record a guideline or framework version in review evidence?|Behavior and recommendations can evolve|The version replaces every test~A citation alone does not execute behavior.|All versions are guaranteed identical~Framework and policy changes occur.|Versions determine user identity~They do not authenticate users.|Version context bounds the claim being reviewed.",
      "A product shares four destination identifiers across phone and tablet presentations. Which change is safe in principle?|Adapt view; preserve task|Rename the selected customer based on width~Width does not change the customer.|Submit a new booking when selecting a rail style~A rendering choice is not a booking command.|Drop all permission checks on tablets~The form factor grants no additional authority.|Adaptive navigation can preserve one underlying destination model.",
      "A team says its app follows Android guidelines because all buttons use the same green. What evidence is missing?|Behavior and semantics|A longer color name~Naming the color differently adds no evidence.|A larger CSS file~Mobile behavior is not established by file size.|A higher API request limit~Rate limits do not prove UI conventions.|A theme choice is only a small part of platform usability.",
      "Android and iOS use different compact navigation controls for the same authorized account-overview workflow. Which evidence establishes functional consistency?|Each platform\u2019s supported input paths reach the same authorized task|Both screenshots contain identical pixel colors and text bytes~Pixel equality does not execute navigation or establish authorization.|One Android emulator passes, so iOS behavior is inferred from shared code~Native interaction boundaries still differ.|The control labels differ, so all domain validation must be duplicated~Presentation variation does not require divergent business rules.|Consistency concerns usable authorized task semantics, with platform-specific interaction evidence.",
      "An optional photo feature requests camera permission at launch, before its purpose is visible, and refusal blocks unrelated stock lookup. Which redesign best respects scope and user understanding?|Request camera in feature context and preserve unrelated lookup on refusal|Keep launch timing but use a more prominent request explanation only~The unrelated blocking and unnecessary early scope remain.|Ask again on every stock lookup until the user accepts~Repeated pressure does not make camera necessary for lookup.|Treat prior consent to notifications as permission to use the camera~Permissions cover distinct capabilities.|Permission necessity, timing and refusal behavior should follow the actual feature dependency.",
      "The fixture chooses a rail when width reaches700. It prints rail for a900-unit iOS window, but no native UI is executed. Which evidence is established?|The authored width-policy branch selected the rail label|The rail\u2019s native back gesture and focus order passed~Neither native interaction ran in the fixture.|The app complies with every current iOS navigation guideline~A branch calculation does not establish guideline compliance.|The App Store will accept the release containing this design~Store submission and review were not performed.|The result is limited to the supplied presentation-selection logic.",
      "A framework upgrade changes modal dismissal on one supported OS. Earlier screenshots and interaction logs are from the old version. Which evidence update is needed?|Retest changed supported interactions and record any justified exceptions|Reuse all old evidence because the product\u2019s color theme is unchanged~The relevant behavior changed independently of color.|Preserve the old tested-version label to avoid a review diff~That would misstate the dependency actually under review.|Disable dismissal and declare the original behavior equivalent~Removing an exit path is not evidence of equivalent usability.|Version-specific interaction assumptions need renewed evidence after the relevant change.",
      "Compact navigation stores index2 for appointments in [home,search,appointments,reports]. A wide rail reorders to [home,appointments,reports,search]. The draft belongs to account A and must survive resizing; current authorization is checked separately. Which state mapping preserves the selected task?|Persist appointments by stable ID, map it to rail index1 and retain A\u2019s draft|Reuse index2 in the rail because the numeric selection is unchanged~Rail index2 now identifies reports rather than appointments.|Copy the draft into a new reports task selected by index2~That changes business identity during a presentation transition.|Map to index1 but treat the old widget\u2019s visibility as authorization~Visibility is not the stated current access check.|Stable destination identity survives control reordering, and draft ownership and authorization remain separate from presentation indices."
    ],
    "lang": "python"
  }
],
[
  "ui/adaptive-responsive/general.md",
  "ui/adaptive-responsive/platform-adaptations.md",
  "ui/adaptive-responsive/safearea-mediaquery.md",
  "ui/accessibility/ui-design-and-styling.md",
  "app-architecture/design-patterns/offline-first.md"
]);
