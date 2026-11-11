'use strict';
const {course}=require('./wave4-native-private');
const c=course('kotlin-android',[
  {
    "id": "kotlin-nullable-models",
    "title": "Represent absence and immutable UI values",
    "comps": [
      "m1.c1"
    ],
    "intro": "An Android screen receives values from users, storage and remote services. Kotlin types make expected absence visible, while data classes give a concise representation for UI values. Neither type safety nor generated copy functions automatically validate business rules or deeply freeze referenced objects.",
    "sections": [
      [
        "Mechanism and terminology",
        "A String? permits null; a safe call ?. skips member access on null, and ?: chooses a fallback only for null. Empty strings and zero values do not trigger the Elvis fallback. The assertion !! can throw when an assumption is wrong. Prefer explicit absence handling and validated model boundaries for data that legitimately may be missing.",
        "Data classes generate value-oriented operations from primary-constructor properties, including copy and equality. Copy is shallow: a mutable list property remains shared unless separately copied. A val binding prevents reassignment but does not make the referenced object immutable. Kotlin List is a read-only interface, not a universal deep-immutability guarantee."
      ],
      [
        "Android application and verification boundary",
        "A profile UI should distinguish unknown nickname from invalid required email. Validate external data before constructing a domain model, then expose only the state required for rendering. If a screen publishes a snapshot, own its collection values instead of retaining mutable aliases from a repository.",
        "The native fixture copies a data class but deliberately shares a mutable list, then observes the mutation through both models. It demonstrates why copy alone cannot serve as a deep snapshot. The null-safe fallback is a separate rule from the ownership behavior."
      ]
    ],
    "code": "data class Cart(val rows: MutableList<Int>)\nfun main(){val a=Cart(mutableListOf(2,3));val b=a.copy();a.rows.add(4);val label:String?=null;println(b.rows.sum());println(label?:\"Guest\")}",
    "expect": "9\nGuest",
    "problem": "Trace shallow copying and a nullable fallback.",
    "steps": [
      "Copy a data class containing a mutable list.",
      "Append through the original model.",
      "Read the copy and evaluate the null fallback."
    ],
    "limit": "Compiled and executed with official Kotlin2.2.21 on standalone JDK21, isolated without network. The fixture verifies Kotlin language or extracted pure decision logic. Android framework, Compose rendering, lifecycle, permission dialogs and WorkManager scheduling are source-reviewed, not executed in an emulator.",
    "mistakes": [
      "Treating val as a deep freeze hides shared mutable objects. Review the referenced graph.",
      "Using !! for expected absence converts a valid missing state into a runtime failure. Model the state explicitly."
    ],
    "takeaways": [
      "Nullability and business validity differ.",
      "Data-class copy is shallow."
    ],
    "practice": [
      "What does String? permit in addition to strings?|null|Only empty text~Empty strings already belong to String.|Every integer~Nullability does not erase the underlying type.|Automatic Guest text~A fallback needs application logic.|The nullable type includes null alongside strings.",
      "A nullable integer is0. What does value?:8 return?|0|8~Zero is non-null.|null~The actual value is zero.|ERROR~Elvis works with a nullable integer.|The fallback is selected only for null, preserving zero.",
      "Does data-class copy deep-copy a MutableList property?|No|Yes for every property~Copy reuses property values unless overridden.|Only when the model uses val~Val does not copy objects.|Only on a device~The language rule does not depend on an emulator.|Referenced mutable objects may remain shared.",
      "A required email is blank but non-null. What remains necessary?|Business validation|Another safe call~Safe calls address nullness.|A !! assertion~An assertion does not validate contents.|Renaming the property~Names do not enforce rules.|Null safety does not prove a field satisfies domain requirements.",
      "A mutable list2,3 is shared by a copied model and receives4. What sum does the copy observe?|9|5~The copied property still references the shared list.|4~That is only the appended item.|0~The list is not empty.|Both models reference the same2,3,4 collection.",
      "Why can a read-only List view still change?|A mutable alias still exists|Read-only means it is always a constant~An interface does not freeze all aliases.|Val automatically clones every element~It does not.|Lists always come from a network~They may be local.|Ownership matters in addition to the exposed interface."
    ],
    "formal": [
      "Which Kotlin operator asserts that a nullable value is non-null?|!!|?.~A safe call handles absence rather than asserting.|?:~Elvis chooses a fallback.|==~Equality compares values.|A failed not-null assertion can throw at runtime.",
      "What kind of copy does a generated data-class copy normally perform?|Shallow|Deep recursive~Nested objects are not automatically cloned.|Database transactional~Copy is a language-level operation.|Encrypted~No encryption is implied.|Property values, including object references, are reused unless replaced.",
      "A nullable count0 uses (count?:5)+3. What result follows?|3|8~Zero does not select the fallback.|5~The expression adds3 to the present zero.|ERROR~The fallback yields a valid integer.|The present0 is retained and0+3=3.",
      "A copied Cart shares amounts4,6 with the original. The original replaces6 with9. What sum does the copied cart observe?|13|10~That assumes a deep snapshot.|19~Replacement does not retain the old6.|9~Four remains too.|Both properties point to the same list, now4,9.",
      "A submitted invoice must preserve amounts after caller edits and prohibit downstream list mutation. Which boundary meets both requirements?|Owned immutable lines in a read-only snapshot|Only declare the caller’s MutableList property val~The shared object remains mutable.|Use generated copy without replacing its list~The copy remains shallow.|Cast the list to a read-only interface while retaining caller ownership~The caller can still mutate it.|Own both collection and element values when snapshot stability is required.",
      "A nullable nickname is empty text. A screen uses nickname?:Guest. What does it display?|Empty text|Guest~The string is non-null.|null~It contains empty text, not null.|An assertion error~The expression contains no assertion.|Elvis handles null only; blank-content policy is separate.",
      "A profile requires a validated email, optional nickname and stable submitted address list. Which design meets all constraints?|Validate email; nullable nickname; owned addresses|Use non-null String for everything and trust valid JSON~JSON syntax does not validate field meaning.|Force every map field with !! and retain mutable caller addresses~That hides expected absence and shares edits.|Make the outer profile val and skip all validation~Val does not establish domain validity or deep ownership.|Separate domain validation, expected absence and snapshot ownership.",
      "A Java API may return a platform type. What should a Kotlin boundary avoid assuming?|No remaining interop null risk|That external values need validation~Those checks are still necessary at the boundary.|That nullable types can represent absence~The stated type or API permits that behavior.|That !! can throw~That type or API can support the stated value.|Interop and unchecked assertions remain possible null-failure boundaries."
    ],
    "lang": "kotlin",
    "formal_levels": [
      "E",
      "M",
      "M",
      "H",
      "H",
      "H",
      "A",
      "M"
    ],
    "formal_scenarios": [
      false,
      false,
      true,
      true,
      true,
      true,
      true,
      true
    ]
  },
  {
    "id": "kotlin-suspend-boundaries",
    "title": "Understand suspension and structured coroutine ownership",
    "comps": [
      "m1.c2"
    ],
    "intro": "Kotlin suspend functions can pause and resume through continuations. The suspend modifier does not itself create a thread or choose a dispatcher. Android apps normally use kotlinx.coroutines and lifecycle scopes to own asynchronous work, keeping cancellation and errors tied to the feature that requested it.",
    "sections": [
      [
        "Mechanism and terminology",
        "In production Android code, viewModelScope.launch owns screen business work until its ViewModel is cleared. Use withContext with an appropriate dispatcher for blocking I/O or CPU work when needed. A suspending API may already be main-safe; inspect its contract rather than blindly switching every operation. GlobalScope usually escapes the ownership needed for a screen operation.",
        "Structured concurrency connects child jobs to a parent scope. Cancellation is cooperative: suspending operations typically check it, while CPU loops may need explicit checks. Do not catch CancellationException and report success; rethrow it when catching broadly unless a deliberate higher-level contract says otherwise. Independent async operations can overlap, while dependent operations must await valid inputs."
      ],
      [
        "Android application and verification boundary",
        "A search feature should cancel superseded work and prevent stale responses from updating the current query. Scope ownership controls lifetime; a request identity check handles APIs that cannot truly cancel remote work. Keep these two concerns separate. An unobserved job that updates a destroyed screen creates both resource and correctness problems.",
        "The executable uses Kotlin standard-library startCoroutine and suspendCoroutine to resume a continuation synchronously. It proves language suspension plumbing and result delivery. It deliberately does not claim to execute kotlinx.coroutines dispatchers, lifecycle cancellation or Android scheduling; those APIs require the Android/library integration test boundary."
      ]
    ],
    "code": "import kotlin.coroutines.*\nsuspend fun value():Int=suspendCoroutine{it.resume(7)}\nfun main(){val job:suspend ()->Int={value()+2};job.startCoroutine(object:Continuation<Int>{override val context=EmptyCoroutineContext;override fun resumeWith(result:Result<Int>){println(result.getOrThrow())}})}",
    "expect": "9",
    "problem": "Start a standard-library coroutine and observe its result.",
    "steps": [
      "Create a suspend function that resumes with7.",
      "Compose a suspend computation adding2.",
      "Receive the completed Result through a Continuation."
    ],
    "limit": "Compiled and executed with official Kotlin2.2.21 on standalone JDK21, isolated without network. The fixture verifies Kotlin language or extracted pure decision logic. Android framework, Compose rendering, lifecycle, permission dialogs and WorkManager scheduling are source-reviewed, not executed in an emulator.",
    "mistakes": [
      "A suspend modifier does not move blocking work off the UI thread. Use a main-safe implementation and appropriate dispatcher.",
      "Swallowing cancellation as success can leave stale state. Preserve cancellation semantics."
    ],
    "takeaways": [
      "Suspension is not automatic parallelism.",
      "Own jobs through a scope and preserve cancellation."
    ],
    "practice": [
      "Does suspend alone choose a background thread?|No|Yes for every call~Suspend does not select a dispatcher.|Only when the return type is Int~The result type does not schedule work.|Only on Android21~This is not an API-level thread rule.|A suspend function can execute on its caller’s context.",
      "Which scope commonly owns ViewModel business work?|viewModelScope|GlobalScope for every screen~Global lifetime escapes screen ownership.|An unrelated Activity instance~That can leak the wrong owner.|No scope at all~Ownership still matters.|The scope is cancelled when its ViewModel is cleared.",
      "Why rethrow CancellationException from a broad catch?|To preserve cooperative cancellation|To guarantee a payment succeeded~Cancellation does not prove remote outcome.|To deep-copy the job~Exceptions do not copy jobs.|To reset every server transaction~Local cancellation does not roll back servers.|Cancellation is a control signal rather than a normal success value.",
      "A coroutine resumes with7 and adds2. What result arrives at its continuation?|9|7~The computation adds2.|2~That ignores the resumed value.|ERROR~The shown standard-library continuation is valid.|For this contract, the composed result is7+2=9.",
      "A500ms blocking loop runs in a main-context launch. What risk remains?|UI thread blocking|Automatic CPU parallelism~Launch does not inherently offload every operation.|A mandatory compile-time error~Blocking code may compile.|Automatic rollback of UI state~No rollback is implied.|Choose a main-safe implementation or an appropriate dispatcher.",
      "A new query supersedes an old request that cannot be cancelled remotely. What else protects UI correctness?|Current-request identity checks|Trust last arrival regardless of query~The old result may arrive later.|Rename both jobs current~Names do not establish identity.|Use !! on the result~Null assertions do not reject stale work.|Scope cancellation and stale-result eligibility address different boundaries."
    ],
    "formal": [
      "What Kotlin language mechanism carries a suspended computation’s continuation?|Continuation|A data-class copy~Copy does not schedule continuation.|A manifest permission~Permissions govern platform access.|A navigation route~Routes do not resume computation.|Continuations represent where execution can resume.",
      "Which library supplies launch, async and common coroutine scopes?|kotlinx.coroutines|Only Kotlin data classes~Data classes are a language feature.|Only Navigation Compose~Navigation does not supply the general coroutine library.|Only WorkManager~WorkManager schedules durable work.|The coroutine library adds builders and structured concurrency tools.",
      "Independent reads take70ms and110ms ideally. Starting both concurrently instead of sequentially saves how much wait?|70ms|110ms~180-110=70.|180ms~That is the sequential total.|0ms~Independent waits may overlap.|The ideal critical path falls from180ms to110ms.",
      "A validated user id takes20ms, its dependent balance takes60ms, and independent settings takes50ms. With sufficient resources, what is the ideal completion time?|80ms|130ms~Settings can overlap the dependent chain.|60ms~Balance cannot start before id validation.|50ms~The chain takes longer.|The id/balance critical path is20+60=80ms.",
      "A CPU loop never suspends or checks cancellation. The parent is cancelled. What should engineers avoid assuming?|Instant forced CPU interruption|That cooperative checks can help~The stated type or API permits that behavior.|That parent-child ownership matters~The documented API supports that behavior.|That blocking can affect responsiveness~That type or API can support the stated value.|Cancellation is cooperative rather than universal forced interruption.",
      "A ViewModel launches a search for A, then B, and A finishes last. Which design protects current results and lifetime?|Cancel old work; gate results by current query|Launch every request in GlobalScope and accept last arrival~That escapes ownership and permits stale results.|Use val for each query and omit result guards~Stable bindings do not compare ownership.|Catch all failures including cancellation as empty success~That misrepresents cancellation and data.|Combine lifetime management with result eligibility.",
      "A feature needs parallel independent reads, fail-together cancellation and no updates after its owner clears. Which design meets the constraints?|Owned structured children with cancellation|Use detached GlobalScope jobs with callbacks to a destroyed Activity~That loses lifetime ownership.|Run blocking operations on the main thread and swallow cancellation~That breaks responsiveness and cancellation.|Retry every cancelled job forever~That conflicts with owner lifetime.|Structured parent-child ownership coordinates completion and cancellation.",
      "A local timeout occurs during a remote write. Which fact is still unknown without a server contract?|Whether the remote write committed|Whether the local deadline elapsed~That is known.|Whether a timeout is a waiting policy~That behavior is part of the stated contract.|Whether error handling needs ownership~The documented API supports that behavior.|Cancellation or timeout does not prove remote rollback."
    ],
    "lang": "kotlin",
    "formal_levels": [
      "E",
      "M",
      "M",
      "H",
      "H",
      "H",
      "A",
      "M"
    ],
    "formal_scenarios": [
      false,
      false,
      true,
      true,
      true,
      true,
      true,
      true
    ]
  },
  {
    "id": "kotlin-typed-state",
    "title": "Combine typed collections with async state boundaries",
    "comps": [
      "m1.c1",
      "m1.c2"
    ],
    "intro": "A screen should expose data and loading or error status as a coherent state. Typed Kotlin collections can derive visible rows, while immutable data classes make each emitted value inspectable. Async jobs must publish states that reflect what actually completed instead of converting every failure into a confirmed empty result.",
    "sections": [
      [
        "Mechanism and terminology",
        "Collection map and filter produce transformed collections, while sequences can defer transformations until consumption. Use an owned snapshot when UI rendering must be stable for a state version. If elements are mutable, copying only the list still shares element state. Keep domain identity and revision fields available when asynchronous results may race.",
        "A sealed UI-state hierarchy can represent Loading, Content and Error without invalid combinations such as loading=false, success=true and missing data. A StateFlow can expose current state from a ViewModel, and update should compute from the current value when concurrent atomic updates matter. Do not assume a non-atomic read-modify-write sequence is safe just because the holder is reactive."
      ],
      [
        "Android application and verification boundary",
        "A warehouse app filters available stock and sums selected quantities for a visible badge. The repository remains the source of durable truth; a failed refresh can retain known cached content with an explicit stale/error marker. Marking an empty list as fresh success after failure hides a very different operational condition.",
        "The pure Kotlin example derives a new state from a list and sums its quantities. It verifies collections and data-class state construction. Android StateFlow collection and coroutine racing are covered as source-reviewed integration concepts, not by this standalone execution."
      ]
    ],
    "code": "data class Row(val id:Int,val units:Int)\ndata class Ui(val rows:List<Row>,val total:Int)\nfun main(){val rows=listOf(Row(1,0),Row(2,4),Row(3,6));val visible=rows.filter{it.units>0};val state=Ui(visible,visible.sumOf{it.units});println(\"${state.rows.size}:${state.total}\")}",
    "expect": "2:10",
    "problem": "Derive visible inventory state from immutable rows.",
    "steps": [
      "Filter out zero stock.",
      "Sum retained unit counts.",
      "Construct one coherent UI value."
    ],
    "limit": "Compiled and executed with official Kotlin2.2.21 on standalone JDK21, isolated without network. The fixture verifies Kotlin language or extracted pure decision logic. Android framework, Compose rendering, lifecycle, permission dialogs and WorkManager scheduling are source-reviewed, not executed in an emulator.",
    "mistakes": [
      "Converting refresh failure to confirmed empty content erases evidence of failure. Retain explicit error or stale status.",
      "An atomic holder does not make arbitrary multi-step updates atomic. Use its supported update operation or another synchronization contract."
    ],
    "takeaways": [
      "Publish coherent states.",
      "Keep cached, fresh and failed outcomes distinguishable."
    ],
    "practice": [
      "Which Kotlin operation selects matching collection rows?|filter|map~Map transforms values.|sumOf~SumOf aggregates a numeric projection.|copy~Copy creates a data-class value.|Filter retains values satisfying its predicate.",
      "What can a sealed UI-state hierarchy help prevent?|Invalid status combinations|Every network failure~Representation does not eliminate failures.|All stale writes automatically~Durable concurrency needs its own contract.|Every null in Java code~Interop can still introduce null risks.|Distinct states constrain representable combinations.",
      "Rows have units0,4,6 and visible means units>0. What count and sum result?|2 and10|3 and10~Zero-stock row is excluded from count.|2 and6~Four also contributes.|1 and4~Six also qualifies.|The retained rows have4 and6 units.",
      "A failed refresh returns emptyList and labels it fresh. What is lost?|Failure-versus-empty meaning|Only the list’s type~It can remain correctly typed.|Only function parameter names~They are unrelated.|Nothing because empty always means failure~Empty may be a valid successful result.|A coherent state must preserve outcome meaning.",
      "A list snapshot contains mutable Row objects. What remains shared if no rows are copied?|The row objects|The new list length through every alias~Outer lists can be separate.|Every local variable binding~Bindings are independent.|The compiler process~The collection does not control it.|Copying a list is shallow with respect to object elements.",
      "Why include a request token when publishing async results?|Reject stale completions|Make every integer nullable~Tokens do not change types.|Avoid all server authorization~Tokens are not access control.|Make failures become success~They do not.|Result identity protects current state from stale completion."
    ],
    "formal": [
      "Which Kotlin operation sums a numeric projection of collection elements?|sumOf|filter~Filtering selects elements.|contains~Contains tests membership.|copy~Copy is a data-class operation.|SumOf aggregates the chosen numeric value per element.",
      "What does StateFlow conceptually expose?|A current state value and updates to collectors|A durable database transaction by itself~State holders are not persistence engines.|Unlimited historical replay of every prior value~State is not an event archive.|An automatic permission grant~Reactive state cannot grant platform rights.|It is used for observable current state.",
      "A visible-stock filter keeps units>2 from1,3,5,2. What sum remains?|8|11~That includes excluded1 and2.|10~Two is not greater than2.|5~Three also qualifies.|Only3 and5 match, so the sum is8.",
      "Two callbacks each read count5, compute+1 and separately assign the result. What value can a lost update leave?|6|7 necessarily~Both read the same initial value.|10 necessarily~The operation is increment, not sum of reads.|0 necessarily~No reset was specified.|A non-atomic read-modify-write can overwrite one increment.",
      "A refresh fails while cached rows remain useful. Which state conveys both facts?|Cached stale content with refresh-error status|Fresh empty success~That changes both data and outcome meaning.|Loading forever with no status~That hides completed failure.|Delete all rows and claim server confirmation~No confirmation occurred.|Represent known data and refresh outcome honestly.",
      "A requestA returns rows totaling12 after requestB returned18. B is current. What total should a token-guarded UI retain?|18|12~A is stale despite arriving later.|30~The responses are snapshots, not additive events.|0~A stale response does not imply empty content.|Only the current request’s snapshot is eligible.",
      "An inventory UI must avoid impossible status combinations, preserve cached data on refresh failure and reject stale query results. Which design meets all three?|Typed states, honest cache status and query tokens|Use three independent booleans and accept every completion~That permits invalid combinations and stale results.|Return fresh empty data on every error~That hides failures and cached content.|Make the list binding val and omit state ownership~Val alone cannot solve these requirements.|Representation, outcome semantics and async identity need explicit boundaries.",
      "When should sequence laziness be documented for UI consumers?|When consumption can re-evaluate live inputs|Only when the list is empty~Laziness can matter at any size.|Never because sequences are always snapshots~They are not.|Only after publication approval~It is part of the API contract now.|Consumers need to know when values are actually computed."
    ],
    "lang": "kotlin",
    "formal_levels": [
      "E",
      "M",
      "M",
      "H",
      "H",
      "H",
      "A",
      "M"
    ],
    "formal_scenarios": [
      false,
      false,
      true,
      true,
      true,
      true,
      true,
      true
    ]
  },
  {
    "id": "kotlin-compose-hoisting",
    "title": "Build composables around values and events",
    "comps": [
      "m2.c1"
    ],
    "intro": "Compose describes UI from state. A composable may be called repeatedly as relevant state changes, so rendering should describe the current value rather than own unrelated persistence or network side effects. State hoisting moves a value to the lowest common owner that needs to read or change it.",
    "sections": [
      [
        "Mechanism and terminology",
        "A stateless child receives its current value and event callbacks. For example, @Composable fun Quantity(value: Int, onChange: (Int) -> Unit) can render Text(value.toString()) and invoke onChange(value+1) from a Button click. The child reports user intent; its owner decides whether a transition is valid and publishes the next state. This is unidirectional data flow.",
        "Local ephemeral state can use remember { mutableStateOf(...) }. Hoisting is needed when siblings share the value or business logic owns it. Do not hoist every animation detail into a global singleton; choose ownership by lifetime and who needs the information. A child that keeps a second independent copy of a parent-owned value creates competing sources of truth."
      ],
      [
        "Android application and verification boundary",
        "A basket screen has a quantity selector and total label. The screen or ViewModel owns quantity so both derive from the same accepted state. The selector emits an increment request, validation enforces stock limits and the total updates from the accepted quantity. A disabled button is helpful feedback but does not replace validation at the business boundary.",
        "The native Kotlin fixture executes an extracted state reducer and event callback. The lesson’s Compose API example is source-reviewed against official TasksScreen.kt, which passes values and callbacks into content. This isolated program does not run @Composable code, create an Android window or test accessibility."
      ]
    ],
    "code": "data class Basket(val units:Int,val price:Int)\nfun increment(b:Basket,max:Int)=if(b.units<max)b.copy(units=b.units+1) else b\nfun main(){var state=Basket(2,7);val onPlus={state=increment(state,3)};onPlus();onPlus();println(\"${state.units}:${state.units*state.price}\")}",
    "expect": "3:21",
    "problem": "Apply two increment events under a shared stock limit.",
    "steps": [
      "Keep quantity in one owner.",
      "Apply each event through the validated reducer.",
      "Derive the total from the accepted state."
    ],
    "limit": "Compiled and executed with official Kotlin2.2.21 on standalone JDK21, isolated without network. The fixture verifies Kotlin language or extracted pure decision logic. Android framework, Compose rendering, lifecycle, permission dialogs and WorkManager scheduling are source-reviewed, not executed in an emulator.",
    "mistakes": [
      "Keeping separate parent and child quantities causes drift. Pass the owned value and events.",
      "Performing a charge during composition can repeat side effects. Execute it from an explicit operation boundary."
    ],
    "takeaways": [
      "Composables describe current state.",
      "Hoist shared values to an appropriate common owner."
    ],
    "practice": [
      "What does state hoisting usually pass to a child?|A value and event callbacks|A second unsynchronized copy only~That creates competing truth.|A database password~That is not a UI state contract.|A mandatory Activity singleton~Ownership should follow needs.|The owner retains state while the child renders and emits intent.",
      "Where should a shared sibling value live?|At a suitable common owner|In two independent remembered copies~Those can diverge.|Only in the first Text node~The second sibling still needs it.|In a random global variable~Global lifetime is not automatically appropriate.|The common owner can provide a consistent value to both consumers.",
      "A basket starts units2 at price7 and max3. Two increment events are validated. What total follows?|21|28~The second increment exceeds the maximum.|14~One increment is accepted.|3~That is the final units, not total.|The accepted quantity is3 and3*7=21.",
      "Why avoid payment capture directly in a composable body?|Repeated rendering can repeat capture|Composables can never read state~Reading state is central.|Every recomposition creates a new account~It does not.|Kotlin forbids functions in UI~Composable functions are functions.|Rendering frequency must not control durable side-effect count.",
      "A selector and total show different quantities. What should be reviewed first?|Competing state ownership|The icon file extension~That does not explain independent values.|The class name length~Naming length is unrelated.|The number of import lines~Imports do not establish truth.|Both consumers should derive from one accepted state.",
      "Does disabling an increment button replace domain validation?|No|Yes for all callers~Other paths can call the operation.|Only when the button is blue~Color has no contract role.|Only on tablets~Device size is unrelated.|Validate the operation boundary even when UI feedback prevents common mistakes."
    ],
    "formal": [
      "What does unidirectional data flow mean in a typical Compose screen?|State flows down and user events flow up|Children mutate every parent field directly~That hides ownership.|Every event starts a network request~Events may be local.|All state belongs to a global singleton~Ownership can be local or feature scoped.|A clear owner publishes state after processing intent.",
      "Which Compose facility remembers a value across recompositions at a retained call site?|remember|A plain local initialized on every call~It is recreated when the body executes.|A manifest permission~Permissions do not retain composition values.|WorkManager~It schedules background work.|Remember associates retained values with composition identity.",
      "A quantity starts1, price8, max3. Four valid increment requests are attempted through a capped reducer. What units and total result?|3 and24|5 and40~The cap rejects increments beyond3.|2 and16~More than one increment is accepted.|3 and8~The total multiplies by quantity.|The first two increments reach3; later ones are rejected, total24.",
      "A child remembers quantity independently while the parent resets quantity after a server update. Which redesign preserves one source of truth?|Parent-owned value plus emitted change events|Keep both and let latest rendering choose randomly~That is not a synchronization contract.|Move both copies to GlobalScope~Coroutine lifetime does not merge state.|Rename one quantity to cached~Naming does not synchronize it.|Hoisting ensures both child and total consume accepted parent state.",
      "A screen has a search query shared by a filter and results, plus a private expand animation. Which ownership meets sharing and lifetime constraints?|Shared query owner; local private animation|Make every field global~That gives local animation unnecessary lifetime.|Keep two independent queries and synchronize by frame count~That is fragile and duplicates truth.|Put the query only in the results Text~The filter cannot reliably own edits.|Ownership follows readers, writers and lifetime rather than one universal scope.",
      "A reducer refuses quantity above stock4. Starting at3, two increments and one decrement occur. What final quantity and total at price6 result?|3 and18|4 and24~The final decrement reduces4 to3.|5 and30~The second increment is rejected.|2 and12~The first increment succeeds before decrement.|For this contract, 3→4→4→3 gives18.",
      "A basket starts at quantity2, unit price40 and stock3. A reducer validates both UI and deep-link inputs: it applies UI quantity3, then rejects deep-link quantity4. Total is derived from accepted quantity. Two recompositions trigger the same capture key, and the service deduplicates that key. Which final state follows?|Quantity3, total120, one capture|Quantity4, total160, one capture~The deep-link quantity exceeds stock and must be rejected.|Quantity3, total80, one capture~Total must be derived from accepted quantity rather than retained independently.|Quantity3, total120, two captures~The stated service contract deduplicates identical capture keys.|The accepted update sets quantity3 and therefore total3 times40=120; rejected input cannot change that state, and the supplied key contract permits one capture.",
      "When should UI-only transient state remain local?|When readers and lifetime are local|Never because all state must be global~That is excessive ownership.|Only when it is a String~Type does not choose lifetime.|Only after process death~Local ownership is a design decision before execution.|Hoist as far as needed by sharing and behavior."
    ],
    "lang": "kotlin",
    "formal_levels": [
      "E",
      "M",
      "M",
      "H",
      "H",
      "H",
      "A",
      "M"
    ],
    "formal_scenarios": [
      false,
      false,
      true,
      true,
      true,
      true,
      true,
      true
    ]
  },
  {
    "id": "kotlin-recomposition-effects",
    "title": "Keep recomposition safe and effects correctly keyed",
    "comps": [
      "m2.c2"
    ],
    "intro": "Recomposition re-executes composables whose observed state requires updated UI. It can occur often, be skipped or be abandoned, so the body must not rely on executing exactly once. Effects provide explicit lifecycle-bound places for work that cannot be expressed as a pure UI description.",
    "sections": [
      [
        "Mechanism and terminology",
        "LaunchedEffect(key) launches a coroutine tied to the composition and restarts it when its key changes. Choose keys that identify the work, such as an item id, rather than unrelated visual values that cause needless reloads. rememberUpdatedState can provide the latest callback to a long-lived effect without making every callback instance a restart key.",
        "DisposableEffect(key) fits resources with acquire/release behavior and must clean up in onDispose. remember caches a value by composition identity and keys; it is not disk persistence. Reading ordinary mutable objects that Compose does not observe can leave UI stale, so publish observable state or immutable values through supported state holders."
      ],
      [
        "Android application and verification boundary",
        "A detail screen should reload when itemId changes, not on every redraw caused by an animation. A sensor listener should be registered and unregistered with its owner, and a delayed callback should use the current callback contract. Recomposition tests should count side effects separately from rendering calls.",
        "The native Kotlin fixture models effect-key changes and counts eligible loads. It verifies the extracted key-decision logic. Actual LaunchedEffect cancellation, Compose snapshots and frame scheduling are source-reviewed concepts that require Compose tests; this program is not a replacement for them."
      ]
    ],
    "code": "fun main(){val keys=listOf(\"A\",\"A\",\"B\",\"B\",\"A\");var previous:String?=null;var loads=0;for(key in keys){if(key!=previous){loads++;previous=key}};println(loads)}",
    "expect": "3",
    "problem": "Count loads for changing item identities rather than every render.",
    "steps": [
      "Observe the sequence of item ids.",
      "Load only when the identity differs from the prior one.",
      "Count the three distinct transitions."
    ],
    "limit": "Compiled and executed with official Kotlin2.2.21 on standalone JDK21, isolated without network. The fixture verifies Kotlin language or extracted pure decision logic. Android framework, Compose rendering, lifecycle, permission dialogs and WorkManager scheduling are source-reviewed, not executed in an emulator.",
    "mistakes": [
      "Launching directly in composition can repeat uncontrolled work. Use an appropriate effect or owner scope.",
      "Using a visual progress value as a data-load key restarts unrelated work. Key by operation identity."
    ],
    "takeaways": [
      "Composition is not an exactly-once callback.",
      "Keys define effect restart identity."
    ],
    "practice": [
      "Which Compose API runs a composition-owned coroutine keyed by identity?|LaunchedEffect|Text~Text describes UI content.|data class~That is a Kotlin model declaration.|Manifest~A manifest does not own composition coroutines.|LaunchedEffect coordinates work with composition lifetime and keys.",
      "What should DisposableEffect cleanup do?|Release the resource in onDispose|Charge the user again~Cleanup is not payment intent.|Assume the resource lives forever~That leaks ownership.|Store all state in a route~Navigation arguments are not resource cleanup.|Resource release belongs to the effect’s disposal boundary.",
      "A key sequence is A,A,B,B,A. How many identity-change loads occur from no initial key?|3|5~Repeated equal keys do not restart under this policy.|2~Returning toA is another transition.|1~B changes the key.|The firstA, thenB, thenA each trigger work.",
      "Why is a network request in a composable body unsafe?|The body can run repeatedly or be abandoned|Compose guarantees exactly one call~It does not.|A Kotlin function cannot make requests~The issue is ownership, not function capability.|Every request is automatically deduplicated~No universal guarantee exists.|Use an effect or feature operation with explicit lifetime.",
      "Does remember alone survive process death?|No|Yes as durable storage~Remember is composition retention.|Only when the value is Int~Type does not provide persistence.|Only on a landscape screen~Orientation does not make it durable.|Use saved-state or durable storage according to the requirement.",
      "A long-lived effect needs the latest callback without restarting for each callback object. Which tool may fit?|rememberUpdatedState|A stale captured callback forever~That may call outdated behavior.|A global callback for every screen~That loses ownership.|A different itemId on every frame~That forces restarts.|It can supply a current value to an effect without changing its operation identity."
    ],
    "formal": [
      "What can happen to a composable execution during recomposition?|It may run again, be skipped or be abandoned|It always commits a durable transaction~Rendering is not persistence.|It always runs exactly once per screen lifetime~That is not guaranteed.|It automatically authorizes all network requests~UI execution is not access control.|Keep rendering free of uncontrolled side effects.",
      "Which Compose effect is suited to cleanup of registered listeners?|DisposableEffect|Only a plain local variable~That does not define disposal.|Only an app icon~Presentation is unrelated.|Only a data-class constructor~Construction does not own composition cleanup.|Its onDispose block releases acquired resources.",
      "A screen renders8 times while itemId remainsA, then changes toB and renders4 times. A load effect is keyed only by itemId. How many starts occur under this simplified retained-composition model?|2|12~Rendering count is not key-change count.|8~That counts only the first renders.|4~That counts only the second renders.|InitialA and transition toB start the two operations.",
      "A progress animation updates60 times per second. A product-load effect uses progress as its key. What correction preserves reload on product changes while avoiding animation-triggered restarts?|Use product id as the effect key|Remove every key and manually launch in the body~That loses controlled identity.|Make progress final after each update~Stable bindings do not fix chosen identity.|Use a random key every frame~That guarantees more restarts.|The key should identify the operation’s input dependency.",
      "A listener effect registers once forA, switches toB and then leaves composition. How many unregister calls are required when each registration owns one listener?|2|0~Both listeners need cleanup.|1~The A listener must be disposed on key change as well.|3~There are two registrations, not three.|DisposeA at the switch andB at final exit.",
      "A mutable list is edited in place but no observable state changes. Why might the UI remain stale?|The mutation may be unobserved|All lists always trigger recomposition~Ordinary collection mutation is not universally observed.|The list must have become null~Mutation does not imply nullness.|Remember automatically persists edits to disk~It does not.|Publish observable state or a new immutable value through a supported holder.",
      "A detail screen needs reloads only for item changes, latest event callbacks and clean listener disposal. Which combination meets all requirements?|Item-keyed work, fresh callbacks and disposal|Launch in the body and retain every listener globally~That repeats work and leaks resources.|Key every effect by animation progress and capture the first callback forever~That restarts unrelated work and keeps stale behavior.|Use remember as durable storage and omit disposal~That does not provide persistence or cleanup.|Effect identity, callback freshness and resource lifetime require separate choices.",
      "What evidence is still required beyond the pure key-count fixture?|Compose effect and lifecycle tests|No further evidence because a loop is an emulator~It is not.|Only a renamed variable~That does not test the framework.|Only a count of imports~Imports do not establish behavior.|The fixture validates extracted logic, not the Android runtime."
    ],
    "lang": "kotlin",
    "formal_levels": [
      "E",
      "M",
      "M",
      "H",
      "H",
      "H",
      "A",
      "M"
    ],
    "formal_scenarios": [
      false,
      false,
      true,
      true,
      true,
      true,
      true,
      true
    ]
  },
  {
    "id": "kotlin-compose-lists",
    "title": "Preserve list identity and derived state during updates",
    "comps": [
      "m2.c1",
      "m2.c2"
    ],
    "intro": "A lazy Compose list reuses composition work as rows enter, leave or move. Stable item identity helps remembered row state follow the business item rather than a changing position. Derived display values should come from the same accepted data snapshot to avoid inconsistent badges and totals.",
    "sections": [
      [
        "Mechanism and terminology",
        "In LazyColumn, supply a stable unique key such as items(rows, key = { it.id }) for reorderable rows. An index is a position, not an identity: inserting a row at the front shifts every later index. Duplicate keys violate the unique-item assumption and should be resolved at the data boundary rather than ignored.",
        "Calculate simple derived values directly when cheap. derivedStateOf can be useful when observed inputs change more often than the derived result and reducing invalidations is worthwhile; it is not a universal performance improvement. Measure expensive transformations, preserve correct snapshot ownership and avoid caching with incomplete keys that retain outdated results."
      ],
      [
        "Android application and verification boundary",
        "A field-service list allows selecting jobs while a server refresh reorders them. Selection should be keyed by job id and reconciled when jobs disappear or authorization changes. Passing only business ids through events keeps the operation scoped without exposing mutable row internals to every composable.",
        "The Kotlin fixture inserts a row at the front and compares identity-based selection with old positional selection. It demonstrates why positions drift under list changes. It does not measure lazy-list rendering or verify rememberSaveable behavior in a real Android process."
      ]
    ],
    "code": "data class Job(val id:Int)\nfun main(){val old=listOf(Job(10),Job(20));val selectedId=20;val next=listOf(Job(5))+old;println(next.indexOfFirst{it.id==selectedId});println(next[1].id)}",
    "expect": "2\n10",
    "problem": "Keep job identity stable after insertion changes positions.",
    "steps": [
      "Select job20 in the old list.",
      "Insert job5 at the front.",
      "Compare the selected id’s new index with the old positional index."
    ],
    "limit": "Compiled and executed with official Kotlin2.2.21 on standalone JDK21, isolated without network. The fixture verifies Kotlin language or extracted pure decision logic. Android framework, Compose rendering, lifecycle, permission dialogs and WorkManager scheduling are source-reviewed, not executed in an emulator.",
    "mistakes": [
      "Using row indices as long-term selection ids changes meaning after insertion. Use business identity.",
      "Caching derived totals without all relevant keys can display stale data. Validate cache dependencies."
    ],
    "takeaways": [
      "Stable keys describe identity.",
      "Derive totals from a coherent state version."
    ],
    "practice": [
      "What is a good key for a reorderable Compose row?|A stable unique business id|Its current index in every case~Indices shift under insertion and reorder.|A random value per recomposition~That destroys retained identity.|Its displayed price when duplicates are possible~Prices are not unique identities.|Keys should follow the same logical item across changes.",
      "What can duplicate list keys violate?|The unique-item identity assumption|Only the font choice~Keys govern identity.|The fact that Int can represent zero~That is unrelated.|The compiler’s date setting~Dates do not resolve key collisions.|Resolve duplicate identities at a defined data boundary.",
      "A list10,20 gets5 inserted at its front. What id is now at index1?|10|20~Twenty moves to index2.|5~Five is at index0.|30~No such item exists.|For this contract, the new list is5,10,20.",
      "When may derivedStateOf help?|Less frequent derived-result changes|For every variable without measurement~It adds its own cost.|Only for immutable constants~Constants do not need reactive derivation.|To make a network request exactly once~It is not a side-effect API.|Use it for an appropriate derived-state performance pattern.",
      "A selected job disappears after refresh. What must the app define?|A selection reconciliation policy|Automatic access to a different job~That changes identity without intent.|A guarantee that all indices stay fixed~Deletion shifts positions.|A new global scope for every row~That does not resolve selection meaning.|Selection must remain meaningful under data changes.",
      "Why can an incomplete remember key produce stale totals?|Missing cache dependencies|Remember always recalculates every statement~Caching is intended to retain values.|Final automatically tracks all dependencies~Final does not define remember keys.|Totals can never be derived~The stated type or API permits that behavior.|Cache identity must include the inputs that determine its result."
    ],
    "formal": [
      "What does an index describe?|A current position|A permanent business identity~Position can change.|A permission grant~Position does not authorize access.|A durable revision by itself~Indices are not version contracts.|Use ids for identity across reordering.",
      "What should a lazy-list key be for distinct rows?|Stable and unique in that list|Random on every render~That changes identity constantly.|Always zero~That duplicates keys.|Always the same displayed label~Labels can repeat or change.|Stable unique keys preserve logical row identity.",
      "A listA,B,C hasB selected by id. After insertingX first and removingA, what position doesB occupy using zero-based indexing?|1|0~The inserted X occupies index0.|2~A was removed after insertion.|3~There are only three remaining items.|For this contract, the resulting list isX,B,C.",
      "A list row remembers expanded state by position. A new row is inserted first. What is the central correctness risk?|Expansion may follow the wrong item|All rows are automatically deleted~Insertion does not imply deletion.|Every id changes by language rule~Business ids need not change.|All state is persisted to disk~Remember is not disk persistence.|Position-based identity can move local state to another row.",
      "A badge sums selected prices4,7,9. A refresh changes only selected price7 to10. What should the derived total become?|23|20~That is the old total.|30~The old7 was replaced, not retained.|13~All selected items still contribute.|4+10+9=23 from the updated coherent snapshot.",
      "A cached total depends on rows and currency conversion rate, but remember is keyed only by rows. The rate changes from2 to3 with base sum10. What stale and correct totals can result?|20 and30|30 and20~That reverses old and new rates.|10 and10~The stated conversion multiplies by the rate.|50 and30~The old rate result is20.|Missing the rate dependency can retain10*2 instead of10*3.",
      "A job list reorders during refresh, selection must follow ids, disappeared jobs must not remain actionable and totals must use the new prices. Which design meets all constraints?|Stable ids, eligible selection and current totals|Persist only old indices and reuse old totals~That loses identity and freshness.|Assign random row keys and retain deleted ids forever~That breaks retention and eligibility.|Make every row globally mutable and sum on composition count~That has no coherent snapshot boundary.|Identity, selection eligibility and derived-state freshness must be coordinated.",
      "Does a pure Kotlin insertion fixture prove Compose rendering behavior?|No; Compose tests remain necessary|Yes because every list is a composable~A Kotlin list is not a UI runtime.|Only if the ids are Int~Id type does not create rendering.|Only if the output is short~Output length is unrelated.|The fixture verifies the identity reasoning, not actual composition."
    ],
    "lang": "kotlin",
    "formal_levels": [
      "E",
      "M",
      "M",
      "H",
      "H",
      "H",
      "A",
      "M"
    ],
    "formal_scenarios": [
      false,
      false,
      true,
      true,
      true,
      true,
      true,
      true
    ]
  },
  {
    "id": "kotlin-viewmodel-lifetimes",
    "title": "Separate configuration retention from process recovery",
    "comps": [
      "m3.c1"
    ],
    "intro": "Android can recreate an Activity during a configuration change and can later reclaim an app process. These are different boundaries. A ViewModel retains feature state across configuration recreation while its owner remains in scope, but it is not durable storage and does not survive process death by retaining its old object.",
    "sections": [
      [
        "Mechanism and terminology",
        "Keep screen business state in a suitably scoped ViewModel and expose immutable UI state. Avoid retaining an Activity, View or composition-owned object in a long-lived ViewModel because their lifetimes differ. Inject a repository for durable data and use application-safe dependencies when a platform service truly needs a context.",
        "SavedStateHandle can retain small reconstruction inputs such as a filter or record id through supported saved-state restoration. It is not a replacement for durable business storage, large payloads or a guaranteed checkpoint of every recent write. Store authoritative records in the repository and reconstruct state from identifiers after process recreation."
      ],
      [
        "Android application and verification boundary",
        "A task screen remembers the selected filter while task records remain in persistent storage. Official TasksViewModel uses SavedStateHandle.getStateFlow for the filter and combines it with repository task data. A configuration change should not trigger loss of an in-progress business operation solely because a new Activity appears; a cleared ViewModel should release its owned jobs.",
        "The native fixture separates small restored inputs from a repository and reconstructs a visible result. It verifies the reconstruction function, not Android saved-state timing or operating-system process eviction. Those require lifecycle and process-restoration instrumentation."
      ]
    ],
    "code": "data class Saved(val min:Int)\nfun restore(s:Saved,repository:List<Int>)=repository.filter{it>=s.min}\nfun main(){val saved=Saved(5);println(restore(saved,listOf(2,5,8)).sum())}",
    "expect": "13",
    "problem": "Reconstruct screen results from saved inputs and durable records.",
    "steps": [
      "Restore the small filter value.",
      "Load the repository records independently.",
      "Apply the filter to produce the visible total."
    ],
    "limit": "Compiled and executed with official Kotlin2.2.21 on standalone JDK21, isolated without network. The fixture verifies Kotlin language or extracted pure decision logic. Android framework, Compose rendering, lifecycle, permission dialogs and WorkManager scheduling are source-reviewed, not executed in an emulator.",
    "mistakes": [
      "Assuming ViewModel survives process death confuses object retention with restoration. Persist authoritative data.",
      "Retaining an Activity in a ViewModel can outlive the Activity. Use dependencies with an appropriate lifetime."
    ],
    "takeaways": [
      "Configuration retention and process recovery differ.",
      "Save reconstruction inputs; persist business truth."
    ],
    "practice": [
      "Does the same ViewModel object survive process death?|No|Yes because it survives rotation~Rotation and process death differ.|Only if its fields are val~Val does not preserve a process.|Only if it contains a list~Collection type does not create durability.|A new process needs reconstructed state and durable data.",
      "What belongs in SavedStateHandle for reconstruction?|Small reconstruction inputs|An entire unbounded image archive~Large business payloads need suitable storage.|A live Activity instance~That is lifecycle-owned and not a durable input.|A database password for public display~Secrets are not screen reconstruction state.|Save concise inputs and retrieve authoritative data separately.",
      "A restored minimum5 filters records2,5,8. What visible sum results?|13|15~Two is below the threshold.|8~Five also matches.|7~That adds2 and5 instead.|The retained values5 and8 sum13.",
      "Why avoid storing an Activity in a ViewModel?|It can outlive that Activity|Activities are immutable integers~They are lifecycle objects.|ViewModels cannot have fields~The stated type or API permits that behavior.|Every context is a database transaction~Context is not a transaction.|Mismatched lifetimes can retain obsolete UI resources.",
      "A screen’s ViewModel is cleared. What should happen to its owned screen jobs?|Cancel under scope ownership|They must run forever~That conflicts with owner lifetime.|They become durable WorkManager jobs automatically~No automatic conversion occurs.|They become compile-time constants~Jobs are runtime operations.|Choose a longer-lived durable mechanism explicitly when the task requires it.",
      "Where should confirmed task records live for process recovery?|A durable repository store|Only in a remembered composable variable~That is not durable storage.|Only in an Activity field~The process can be lost.|Only in a delayed callback~Callbacks are not authoritative persistence.|Persistent data can be reloaded after recreation."
    ],
    "formal": [
      "What boundary does a retained ViewModel commonly bridge?|Configuration recreation within its owner’s scope|Every future process death through the same object~The old process is gone.|Every app uninstall~Uninstall can remove app data.|Every server outage~Object retention is not network availability.|It separates feature state from a particular Activity instance.",
      "What is SavedStateHandle not a substitute for?|Durable business truth|Small reconstruction inputs~Those are an intended use.|A selected filter key~That is a suitable small value.|A record identifier~That can support reloading.|Saved state has a different role from durable records.",
      "A saved filter requires values>=4. Repository values1,4,7,9 are reloaded after process recreation. What count and sum result?|3 and20|4 and21~One fails the filter.|2 and16~Four also matches.|3 and21~One is excluded from the sum.|4+7+9=20 across three visible records.",
      "A draft is stored only in a ViewModel. It survives rotation but disappears after process kill. Which change addresses that exact requirement?|Persist drafts; restore through concise ids|Make the field val~That does not survive process loss.|Keep an Activity reference in the ViewModel~That leaks UI lifetime without adding durability.|Disable recomposition~Rendering behavior does not persist data.|Durable recovery requires a persistent checkpoint, not only retained memory.",
      "A ViewModel holds a100MB bitmap and an Activity reference to survive rotations. Which redesign best reduces lifetime and restoration problems?|Media by durable id; no retained Activity|Put both objects into route strings~Routes are not a media store.|Mark both fields final~Stable bindings do not solve lifetime or size.|Recreate the Activity from the stored reference~An obsolete reference is not reconstruction.|Store data at the right layer and use concise reconstruction inputs.",
      "A user selects filter7; the last successfully saved-state snapshot contains filter5, and durable records are unchanged. What should engineers avoid guaranteeing after abrupt process death?|That every latest in-memory selection must restore as7|That durable records can be reloaded~The stated type or API permits that behavior.|That small filters can be saved inputs~The stated type or API permits that behavior.|That the restored filter may be5 under the stated snapshot~The stated snapshot can restore that prior value.|Saved-state timing is not a durable transaction guarantee for every in-memory edit.",
      "A field app needs rotation continuity, recoverable submitted jobs after process loss and no leaked Activity. Which architecture meets all constraints?|Scoped UI state, durable jobs and safe ownership|Store all jobs only in ViewModel fields and retain the first Activity~That fails process recovery and leaks lifetime.|Put every job payload into a global object~Global memory also dies with the process.|Assume remember is permanent disk storage~It is not.|Different lifetimes require retained state, durable truth and safe dependencies.",
      "What should a process-restoration test verify beyond a pure restore function?|Saved-state and repository restoration tests|Only string length of the class name~That does not test restoration.|Only the number of fields~Structure does not establish lifecycle behavior.|Nothing because JVM execution kills Android processes~It does not.|The native fixture covers logic while instrumentation covers platform restoration."
    ],
    "lang": "kotlin",
    "formal_levels": [
      "E",
      "M",
      "M",
      "H",
      "H",
      "H",
      "A",
      "M"
    ],
    "formal_scenarios": [
      false,
      false,
      true,
      true,
      true,
      true,
      true,
      true
    ]
  },
  {
    "id": "kotlin-navigation-contracts",
    "title": "Navigate with stable identifiers and explicit back-stack policy",
    "comps": [
      "m3.c2"
    ],
    "intro": "Navigation Compose maps routes to destinations and manages a back stack. A route should carry the information needed to reconstruct a destination, usually a stable identifier rather than a large mutable object. The destination loads current authorized data through its owner and repository.",
    "sections": [
      [
        "Mechanism and terminology",
        "A NavHost defines destinations and a NavController performs navigation. Pass callbacks into reusable screens rather than giving every child the controller. This keeps UI components testable and centralizes route construction. Route syntax and typed-route support depend on the chosen Navigation version; the pinned official sample uses explicit string routes and arguments.",
        "launchSingleTop can avoid another copy when the target is already on top. popUpTo removes entries back to a target, with inclusive deciding whether that target is removed too. saveState and restoreState support deliberate multiple-back-stack behavior where appropriate; they do not authorize access or replace durable data loading."
      ],
      [
        "Android application and verification boundary",
        "A list-to-detail flow passes taskId, and detail validates and loads the current task. A deep link is input from outside the trusted UI path: validate its shape and enforce authorization at the data boundary. Never treat possession of a route id as proof that the current user may view the record.",
        "The Kotlin fixture models a simplified back-stack pop policy with immutable string identifiers. It verifies the stated list transformation only. Actual NavController behavior, deep links and Android back gestures require Navigation integration tests with the selected library version."
      ]
    ],
    "code": "fun main(){val stack=mutableListOf(\"home\",\"list\",\"detail\");val target=stack.indexOf(\"list\");while(stack.size>target+1)stack.removeAt(stack.lastIndex);stack.add(\"edit\");println(stack.joinToString(\">\"))}",
    "expect": "home>list>edit",
    "problem": "Pop above a retained list destination then open edit.",
    "steps": [
      "Find the list target.",
      "Remove entries above it while retaining the target.",
      "Append the edit destination."
    ],
    "limit": "Compiled and executed with official Kotlin2.2.21 on standalone JDK21, isolated without network. The fixture verifies Kotlin language or extracted pure decision logic. Android framework, Compose rendering, lifecycle, permission dialogs and WorkManager scheduling are source-reviewed, not executed in an emulator.",
    "mistakes": [
      "Passing a whole mutable record through a route risks stale and oversized state. Pass a stable id and reload.",
      "Treating deep-link ids as authorization skips the actual access boundary. Validate current actor and record scope."
    ],
    "takeaways": [
      "Routes carry reconstruction inputs.",
      "Back-stack policy and access control are distinct."
    ],
    "practice": [
      "What component performs Navigation Compose navigation actions?|NavController|Only a data class~Models do not manage the framework stack.|Only WorkManager~It schedules work.|Only a permission dialog~Dialogs do not define routes.|A controller manages navigation through the host’s graph.",
      "What should a detail route commonly carry?|A stable record identifier|An unbounded mutable database snapshot~That is large and can become stale.|A raw database password~That is not a navigation input.|An Activity instance serialized as truth~Activity objects are lifecycle resources.|The destination can reload current data by id.",
      "Stack home,list,detail pops above list exclusively and appends edit. What stack results?|home,list,edit|home,edit~Exclusive pop retains list.|home,list,detail,edit~Detail was popped.|edit only~Home and list remain.|Entries above list are removed, then edit is appended.",
      "Does knowing a deep-link record id authorize access?|No|Yes for every route~Identifiers are not access grants.|Only when the id is an Int~Type does not authorize.|Only after rotation~Recreation does not authorize.|Enforce the current actor’s record scope at the data boundary.",
      "Why pass navigation callbacks into reusable screens?|Testable UI; centralized route policy|Make navigation impossible~Callbacks can request navigation.|Avoid every state update~UI still consumes state.|Automatically persist all records~Callbacks do not imply storage.|Screens emit intent while the owner chooses routes.",
      "What does inclusive=true mean for a popUpTo target?|The target itself is also removed|The target is always retained~That is the noninclusive distinction.|Every route is duplicated~Popping removes entries.|All records are deleted from the database~Back-stack changes are not data deletion.|Inclusive controls whether the target entry remains."
    ],
    "formal": [
      "What does a NavHost define?|A graph of destinations|Only durable job retry rules~That is a work-scheduling concern.|Only permission rationale text~That is a platform access concern.|A deep-copy algorithm for models~Navigation does not provide that.|The host connects routes to destination content.",
      "What does launchSingleTop commonly avoid?|A duplicate of the current top destination|Every duplicate anywhere in every stack~Its guarantee is narrower.|Every database duplicate~Navigation does not deduplicate storage.|Every authentication failure~Stack policy is not access control.|It controls top-destination duplication under navigation policy.",
      "Stack A,B,C,D pops toB inclusive. How many entries remain immediately after the pop?|1|2~Inclusive removesB too.|3~C andD are aboveB and removed.|4~The operation removes entries.|OnlyA remains afterB,C,D are removed.",
      "A detail screen receives a full old task object in a route while the repository has a newer authorized revision. Which redesign improves freshness and reconstruction?|Route by id; load current authorized data|Keep the old route object authoritative forever~That ignores new revisions.|Pass the entire repository as a string~That is not a valid ownership boundary.|Trust every field because the route is internal~Deep links and stale state still require validation.|An id allows current data loading and access checks.",
      "A stack is home,search,detail. Navigation pops above home noninclusive, then opens settings. What stack results?|home,settings|settings only~Noninclusive keeps home.|home,search,settings~Search is above home and is popped.|home,search,detail,settings~The pop is ignored in that answer.|Retain home, remove search/detail, append settings.",
      "A route id parses correctly but belongs to another tenant. Which result is appropriate?|Deny the out-of-tenant record|Allow because parsing succeeded~Syntax is not authorization.|Allow because launchSingleTop is true~Stack configuration does not grant access.|Copy the record into the current tenant silently~That changes ownership without authorization.|Validation includes actor and record scope, not just route shape.",
      "A tablet app needs independent tab histories, current detail data and secure deep links. Which design meets all constraints?|Save tab stacks; route by id; authorize reloads|Put full mutable records in global routes and trust their ids~That risks stale data and missing access checks.|Use one random route per frame~That destroys stable history.|Treat restoreState as authorization and skip repository checks~Restoration is not access control.|History policy, data freshness and authorization remain separate requirements.",
      "What needs framework testing beyond the pure stack fixture?|Navigation and deep-link integration tests|Only whether Kotlin can print a string~That does not test Navigation.|Only whether routes have short names~Names do not establish stack semantics.|Nothing because mutableListOf is NavController~It is not.|The fixture verifies extracted policy, not Android navigation execution."
    ],
    "lang": "kotlin",
    "formal_levels": [
      "E",
      "M",
      "M",
      "H",
      "H",
      "H",
      "A",
      "M"
    ],
    "formal_scenarios": [
      false,
      false,
      true,
      true,
      true,
      true,
      true,
      true
    ]
  },
  {
    "id": "kotlin-lifecycle-collection",
    "title": "Collect state only while the screen owns observation",
    "comps": [
      "m3.c1",
      "m3.c2"
    ],
    "intro": "Observing a stream is work with a lifecycle. A ViewModel may keep business state beyond one Activity instance, while the visible screen should collect updates under an appropriate lifecycle policy. Navigation changes ownership: a previous destination must not continue applying updates to the current destination’s state.",
    "sections": [
      [
        "Mechanism and terminology",
        "Compose screens can use collectAsStateWithLifecycle for lifecycle-aware observable state. In other Android UI code, repeatOnLifecycle can restart collection when the lifecycle reaches a chosen active state and cancel its block below that state. Select the owner and minimum state deliberately rather than assuming every collector should run for the entire process.",
        "A StateFlow contains current state, not a guaranteed durable queue of every event. For one-time actions, define acknowledgment or state transition semantics so recreation does not silently lose required work or repeat a destructive operation. Navigation and snackbars often need carefully scoped consumption; a transient channel alone is not durable business confirmation."
      ],
      [
        "Android application and verification boundary",
        "Official TasksScreen collects ViewModel uiState with collectAsStateWithLifecycle and reports message display back through a callback. This illustrates an explicit observation and acknowledgment boundary. A payment result should also be recorded durably if it must survive process loss; showing a snackbar does not establish that a payment committed.",
        "The native fixture filters updates by active screen identity and visibility. It tests the pure eligibility rule. It does not emulate lifecycle transitions or prove flow collection cancellation, which require Android instrumentation and coroutine test tools."
      ]
    ],
    "code": "data class Update(val screen:String,val value:Int)\nfun main(){val current=\"B\";val visible=true;val updates=listOf(Update(\"A\",4),Update(\"B\",7),Update(\"A\",9));val accepted=updates.filter{visible&&it.screen==current};println(accepted.sumOf{it.value})}",
    "expect": "7",
    "problem": "Accept only visible current-destination updates.",
    "steps": [
      "Set the current screen identity.",
      "Reject updates from the old destination.",
      "Aggregate eligible current-screen values."
    ],
    "limit": "Compiled and executed with official Kotlin2.2.21 on standalone JDK21, isolated without network. The fixture verifies Kotlin language or extracted pure decision logic. Android framework, Compose rendering, lifecycle, permission dialogs and WorkManager scheduling are source-reviewed, not executed in an emulator.",
    "mistakes": [
      "A collector bound to a process-wide scope can outlive its screen. Choose the owner deliberately.",
      "Assuming every state stream is a durable event queue hides loss and duplicate-consumption risks. Define acknowledgment and storage."
    ],
    "takeaways": [
      "Observation has a lifecycle.",
      "Current state and durable events have different contracts."
    ],
    "practice": [
      "Which Compose API supports lifecycle-aware Flow state collection?|collectAsStateWithLifecycle|collectAsState without lifecycle policy~Plain state collection alone does not add the lifecycle-aware policy requested.|Only data-class copy~Copy does not collect a Flow.|Only popUpTo~That changes navigation stack policy.|It connects observation to lifecycle-aware UI state.",
      "What does a StateFlow represent primarily?|Current observable state|A durable archive of all past events~It is not an event database.|An automatic permission grant~State does not grant platform rights.|A permanent Activity reference~It should not retain UI by definition.|Consumers observe current state and updates rather than a guaranteed full history.",
      "Current screenB accepts visible updatesA4,B7,A9. What sum is accepted?|7|20~A updates are stale for this owner.|16~That includesA9.|0~B7 is eligible.|The current-identity predicate admits onlyB7.",
      "Why acknowledge that a message was displayed?|Explicit consumption state|To prove a server charge committed~UI display is not durable payment evidence.|To guarantee every callback runs once forever~The protocol still needs correct ownership.|To disable all future messages~Acknowledgment should be scoped.|An explicit transition prevents ambiguous repeated presentation.",
      "A stopped screen no longer needs live sensor values. What should its observation policy address?|Stop unnecessary observation|Keeping all listeners forever~That wastes lifetime-bound resources.|Changing sensor values to constants~That does not release resources.|Deleting the navigation graph~That is not the required resource boundary.|Observation should follow the owner’s active lifetime.",
      "A payment result must survive process death. Where should confirmation be recorded?|Durable business storage|Only in a transient snackbar~Presentation may be lost.|Only in a remembered boolean~That is not durable.|Only in the last collector callback~Callbacks are not authoritative storage.|Durability belongs to the business outcome record."
    ],
    "formal": [
      "What does repeatOnLifecycle help manage?|Lifecycle-scoped collection|Permanent retention of every Activity~That would leak lifetime.|Automatic deep-link authorization~Lifecycle is not access control.|Automatic database schema creation~That is unrelated.|It ties active work to a chosen lifecycle state.",
      "What must a one-time UI action protocol define?|Action acknowledgment|Only a text color~Presentation does not define delivery.|Only an import order~Imports do not establish ownership.|That every Flow is durable~That is false.|The app needs a clear policy for recreation and repeated observation.",
      "A lifecycle rule accepts updates only when active. Over phases active3 events, inactive5 events, active2 events, how many are eligible under that rule?|5|10~Inactive updates are excluded.|8~That includes the inactive phase instead of both active phases.|2~The first active phase also counts.|3+2=5 active-phase events are eligible.",
      "A collector is launched in a global scope and writes to an Activity destroyed after rotation. Which redesign meets ownership requirements?|Lifecycle-bound UI observation|Keep the old Activity in a singleton~That prolongs obsolete UI ownership.|Rename the global scope screenScope~Names do not change lifetime.|Disable null checks on the Activity~That does not restore a destroyed owner.|Separate retained business state from lifecycle-bound observation.",
      "A message id42 is displayed and acknowledged in state; rotation restores that acknowledged state. What should the protocol avoid doing?|Redisplaying42 merely for a new collector|Loading current state~That is appropriate.|Retaining the acknowledgment meaning~That is appropriate.|Allowing later message43~A new id is a new message.|Consumption belongs to message identity, not collector instance count.",
      "A current destinationC receives updatesB8,C3,C5 while visible, thenC9 while inactive. What total is eligible under both identity and visibility checks?|8|25~That includes stale and inactive updates.|17~That includes inactiveC9.|3~C5 is also visible and current.|OnlyC3 andC5 pass both checks.",
      "A delivery app needs no offscreen GPS work, recoverable delivery confirmation and no repeated completion navigation after rotation. Which design meets all three?|Active GPS, durable confirmation and consumed intent|Run every sensor globally and use a snackbar as the only confirmation~That leaks work and loses durable truth.|Assume StateFlow stores every past event permanently~It does not.|Navigate on every recomposition that sees any non-null object~That can repeat navigation.|Resource lifetime, business durability and action acknowledgment need distinct contracts.",
      "What does the native eligibility fixture leave unverified?|Lifecycle collection tests|Whether equality on strings works~The fixture executes that.|Whether filtering can select rows~The fixture executes that.|Whether integer addition works~The fixture executes that.|Source review and platform tests complement the extracted decision logic."
    ],
    "lang": "kotlin",
    "formal_levels": [
      "E",
      "M",
      "M",
      "H",
      "H",
      "H",
      "A",
      "M"
    ],
    "formal_scenarios": [
      false,
      false,
      true,
      true,
      true,
      true,
      true,
      true
    ]
  },
  {
    "id": "kotlin-runtime-permissions",
    "title": "Request permission in context and preserve a denied path",
    "comps": [
      "m4.c1"
    ],
    "intro": "Android permissions govern access to protected capabilities. Manifest declarations and runtime grants are related but distinct: declaring a dangerous permission does not mean the user has granted it. Permission behavior also depends on device API level and target SDK, so use a current feature-specific permission contract rather than one universal dialog rule.",
    "sections": [
      [
        "Mechanism and terminology",
        "Check current permission status before a protected operation and request access in the context of a user action that needs it. Official permission samples use registerForActivityResult(ActivityResultContracts.RequestPermission()) and launch the requested permission, handling the asynchronous Boolean result. Register the launcher with the appropriate lifecycle owner rather than recreating it ad hoc for every click.",
        "Explain a rationale when appropriate, support denial gracefully and avoid repeated coercive prompts. A false shouldShowRequestPermissionRationale result alone is not proof of permanent denial because it can also occur before the first request. Track request history and use the documented platform flow for the specific permission and API level. Permissions can later change, so do not treat a cached grant as permanent."
      ],
      [
        "Android application and verification boundary",
        "A receipt-capture feature can request CAMERA only when the user chooses capture and offer a file picker or manual entry when access is denied. If using a system picker or delegated intent, inspect that API’s own permission and URI-grant contract rather than asking for broad storage access by habit. A permission grant does not authorize uploading the selected image to any remote account.",
        "The native fixture evaluates a pure decision table for grant, rationale and prior request state. It verifies the chosen application policy, not system dialogs or every Android permission edge case. Device tests must cover grant, denial, settings changes and the exact target/device API combinations."
      ]
    ],
    "code": "fun next(granted:Boolean,requested:Boolean,rationale:Boolean)=when{granted->\"use\";rationale->\"explain\";!requested->\"request\";else->\"fallback/settings\"}\nfun main(){println(next(false,false,false));println(next(false,true,false));println(next(true,true,false))}",
    "expect": "request\nfallback/settings\nuse",
    "problem": "Distinguish first request from a prior denied path.",
    "steps": [
      "Check an already granted capability first.",
      "Handle contextual explanation or the first request.",
      "Preserve a fallback/settings path after prior denial without inferring from rationale alone."
    ],
    "limit": "Compiled and executed with official Kotlin2.2.21 on standalone JDK21, isolated without network. The fixture verifies Kotlin language or extracted pure decision logic. Android framework, Compose rendering, lifecycle, permission dialogs and WorkManager scheduling are source-reviewed, not executed in an emulator.",
    "mistakes": [
      "Manifest declaration is not a runtime grant. Check current access at the operation boundary.",
      "Rationale=false alone cannot identify permanent denial. Include request history and current documented behavior."
    ],
    "takeaways": [
      "Request only the needed capability in context.",
      "Denial and revocation are supported product states."
    ],
    "practice": [
      "Does a manifest CAMERA declaration alone prove a runtime grant?|No|Yes on every Android version~Runtime rules differ by API and permission.|Only if the app has a ViewModel~Architecture does not grant access.|Only if the button is disabled~UI state does not grant permission.|Declaration and current access are distinct.",
      "Which API family can request a permission with a lifecycle-aware result contract?|Activity Result APIs|Only data-class copy~Copy does not request platform access.|Only a map lookup~A map is not a permission broker.|Only WorkManager tags~Tags do not request user grants.|RequestPermission returns the user decision through the registered launcher callback.",
      "Granted=false, requested=false, rationale=false enters the shown policy. Which action follows?|request|use~The permission is not granted.|fallback/settings~The policy treats this as the first request.|delete account~That is not a permission policy branch.|Request history distinguishes a first request from prior denial.",
      "Does rationale=false alone prove permanent denial?|No|Yes universally~It can also occur before the first request.|Only for any Int value~Integer values are unrelated.|Only after recomposition~Recomposition does not define the platform status.|Use history and the documented permission-specific flow.",
      "A user denies camera access. Which feature behavior is appropriate?|A meaningful non-camera fallback|Crash because denial is impossible~Denial is a valid user choice.|Prompt forever on each frame~That is coercive and uncontrolled.|Upload a prior user’s photo~That violates data ownership.|The app should support the denied state honestly.",
      "A cached grant was true last week. What should happen before protected use now?|Check current access|Assume the grant can never change~Users and the system can change access.|Use !! on the cache~An assertion does not grant permission.|Skip every error path~Protected access can still fail.|Permission state is not permanently fixed by a past observation."
    ],
    "formal": [
      "What does a permission grant authorize primarily?|The protected platform capability|Every remote business operation~Platform permission is not server authorization.|Every future permission automatically~Grants are capability-specific.|Every other user’s records~That violates data scope.|Platform access and application authorization are separate boundaries.",
      "What must permission behavior be checked against?|Device, target and capability|Only the Kotlin variable name~Naming does not define platform rules.|Only screen orientation~Orientation does not define the permission contract.|Only bank question count~Assessment structure is unrelated.|Permission rules vary by version and capability.",
      "The shown decision policy receives false,true,true. Which result follows?|explain|request~Rationale takes precedence in the policy.|use~The grant is false.|fallback/settings~The rationale branch is selected first.|The policy explains context before a renewed user-driven request.",
      "An app interprets every rationale=false as permanent denial and immediately opens settings on first use. What missing fact matters?|The prior request history|Whether the button text is long~That does not distinguish first use.|Whether the id is final~Binding stability does not track history.|Whether the app has a list~Collections do not establish permission state.|A false rationale can occur before the first request.",
      "A receipt app needs one image, graceful denial and minimum broad access. Which design best meets the constraints?|Narrow picker/camera access plus fallback|Request every storage and location permission on launch~That exceeds feature needs.|Treat denial as account deletion~That is unrelated and destructive.|Assume selecting a URI grants access to every file~URI access is scoped by its contract.|Choose the narrow platform capability and preserve fallback behavior.",
      "A current grant is revoked between a UI check and protected use. Which defense is still needed?|Handle failure and recheck access|Assume the earlier check makes failure impossible~Access can change.|Catch the failure and claim a photo was captured~That invents success.|Retry forever without user context~That does not restore authorization.|A check is an observation, not a permanent access guarantee.",
      "A camera feature must avoid premature requests, support denial, distinguish first request from prior denial and never upload another account’s image. Which design meets all constraints?|Contextual request, history, fallback and scoped upload|Request on every composition and use the last available image globally~That repeats prompts and risks cross-account data.|Treat rationale=false as a grant~It says nothing of the kind.|Use a manifest declaration as both runtime and server permission~These are different boundaries.|The flow combines contextual platform access with application data ownership.",
      "What does the standalone permission-policy fixture not verify?|Device permission tests|The printed branch strings~Those are executed.|The Kotlin when ordering~That is executed.|The Boolean inputs~They are supplied directly.|Platform tests must validate the policy against actual Android behavior."
    ],
    "lang": "kotlin",
    "formal_levels": [
      "E",
      "M",
      "M",
      "H",
      "H",
      "H",
      "A",
      "M"
    ],
    "formal_scenarios": [
      false,
      false,
      true,
      true,
      true,
      true,
      true,
      true
    ]
  },
  {
    "id": "kotlin-durable-work",
    "title": "Schedule deferrable durable work with explicit retry semantics",
    "comps": [
      "m4.c2"
    ],
    "intro": "WorkManager schedules deferrable work that should remain eligible beyond a particular screen or process lifetime. It is suitable for durable synchronization and uploads under constraints, but it is not an exact wall-clock timer or a guarantee that a job runs immediately when enqueued.",
    "sections": [
      [
        "Mechanism and terminology",
        "A WorkRequest names a worker and can carry small input Data and constraints such as connected network or charging. The system chooses execution timing under constraints and platform limits. For a long-lived payload, store durable content and pass an identifier or URI with a valid access contract rather than putting the full content into a small work-input bundle.",
        "A worker returns success, failure or retry according to outcome. Use retry for a potentially transient condition with a bounded application policy, and failure for a non-recoverable input or business rejection. Work may run more than once across retries and interruptions, so writes need idempotency and checkpoints; scheduling uniqueness alone does not make remote effects exactly once."
      ],
      [
        "Android application and verification boundary",
        "A photo app should persist an upload record, enqueue work with the record id and require suitable network conditions. The worker loads current authorized data, performs an idempotent operation and records confirmed completion durably. If the user logs out, reconcile account ownership instead of uploading under the next user’s credentials.",
        "The native Kotlin fixture classifies synthetic outcomes into worker-result policies and counts retryable cases. It does not instantiate Android Worker or execute WorkManager. Official BlurViewModel and BlurWorker source establish request construction, chaining, constraints and explicit results; the sample’s deliberate sleep is teaching scaffolding, not production advice."
      ]
    ],
    "code": "fun policy(code:Int)=when{code in 200..299->\"success\";code==429||code in 500..599->\"retry\";else->\"failure\"}\nfun main(){println(listOf(200,429,503,400).map(::policy).joinToString(\",\"))}",
    "expect": "success,retry,retry,failure",
    "problem": "Classify upload outcomes under an explicit synthetic policy.",
    "steps": [
      "Identify confirmed success responses.",
      "Choose retry for the stated transient classes.",
      "Reject permanent input failures."
    ],
    "limit": "Compiled and executed with official Kotlin2.2.21 on standalone JDK21, isolated without network. The fixture verifies Kotlin language or extracted pure decision logic. Android framework, Compose rendering, lifecycle, permission dialogs and WorkManager scheduling are source-reviewed, not executed in an emulator.",
    "mistakes": [
      "Returning success for every exception falsely confirms work. Classify and preserve uncertain outcomes.",
      "Assuming unique work prevents duplicate remote writes confuses scheduling with idempotency. Use a server-side operation identity."
    ],
    "takeaways": [
      "Durable scheduling is not exact timing.",
      "Retryable work must tolerate repeated execution."
    ],
    "practice": [
      "What kind of work is WorkManager designed for?|Deferrable durable background work|An exact animation frame callback~Frame timing belongs to UI rendering.|Every immediate permission dialog~Permissions are user interactions.|A guarantee of exact wall-clock execution~Scheduling depends on system conditions.|It persists scheduling intent under platform rules.",
      "Which worker outcome requests another attempt?|retry|success~That confirms completion.|failure~That marks non-recoverable failure under the policy.|println~Printing is not a worker result.|Retry expresses a retryable outcome to the scheduler.",
      "Under the shown synthetic HTTP policy,503 maps to what?|retry|success~A503 is not a confirmed success.|failure in every case~The stated policy treats5xx as transient.|permission granted~HTTP status does not grant Android permission.|The explicit policy retries the5xx range.",
      "Why should upload input carry an id rather than a huge image body?|Reference a durable payload by id|Ids automatically authorize every file~Access still needs checks.|WorkManager cannot load any data~Workers can use repositories.|Images are always compile-time constants~They are runtime content.|Store large payloads appropriately and pass reconstruction inputs.",
      "Can WorkManager guarantee execution exactly at9:00?|No|Yes regardless of constraints~System scheduling and constraints matter.|Only if the worker uses val~Binding syntax does not schedule exact time.|Only when a data class is used~Model syntax does not change scheduling guarantees.|It is a deferrable scheduler, not an exact timer.",
      "An upload response is lost. What prevents duplicate business effects on retry?|Stable idempotency key|Only a unique work name~Scheduler deduplication does not prove remote exactly-once effects.|Only a renamed worker~Names do not deduplicate remote writes.|Always reporting success~That invents confirmation.|The remote operation needs its own deduplication contract."
    ],
    "formal": [
      "What are WorkRequest constraints used for?|Network/charging eligibility conditions|Authorization to any tenant’s records~Constraints do not grant access.|Guaranteed exact completion times~They restrict eligibility, not timing certainty.|Automatic deep-copying of image data~They do not copy payloads.|The system schedules eligible work under platform rules.",
      "What does worker success mean under a well-designed contract?|Confirmed completion|Every exception was hidden~That is not confirmation.|The task merely started~Starting is not completing.|A local timeout happened~Timeout may leave outcome unknown.|Report success only when the operation’s completion requirement is satisfied.",
      "A worker processes6 records and checkpoints after each confirmed idempotent write. It stops after confirming4. How many records remain to confirm on recovery?|2|6~That ignores durable checkpoints.|4~That counts completed records.|0~Two records remain.|6-4=2 records still require confirmation.",
      "An upload timeout occurs after the server committed. Which recovery plan avoids a second logical upload?|Reuse the key; reconcile before confirming|Generate a new key and upload blindly~That may create a duplicate.|Assume every timeout means no commit~That is not established.|Delete the durable input before checking outcome~That can make recovery impossible.|Stable operation identity handles uncertain remote completion.",
      "A work item requires connected network and charging. Network is available but charging is false. What should the app avoid promising?|Execution with unmet constraints|That the request can remain pending~That type or API can support the stated value.|That constraints can delay work~The stated type or API permits that behavior.|That later eligibility may permit execution~The stated snapshot can restore that prior value.|All required eligibility conditions must be met under the scheduler contract.",
      "A policy retries responses429,500,503 and permanently fails400. For outcomes200,429,400,503,201, how many are retryable?|2|3~Two2xx results are successes and400 is permanent in this policy.|1~Both429 and503 retry.|5~Not every outcome is transient.|Only429 and503 meet the stated retry conditions.",
      "An offline upload must survive process loss, wait for network, avoid duplicate remote effects and not cross accounts after logout. Which design meets all constraints?|Durable scoped payload; constraints; keyed writes|Keep the photo only in an Activity field and retry with new keys~That loses durability and risks duplicates.|Put the full photo in every route and use whichever user is current~That crosses ownership and uses the wrong transport.|Treat unique work name as both authorization and exactly-once guarantee~It supplies neither guarantee.|Durability, scheduling eligibility, ownership and remote idempotency are separate contracts.",
      "What integration evidence is still needed beyond the policy fixture?|Worker scheduling and interruption tests|Only a sum of integers~That does not test Android scheduling.|Only the number of question rows~Structure does not establish runtime behavior.|None because a when expression is a Worker~It is not.|The fixture verifies classification logic, not framework execution."
    ],
    "lang": "kotlin",
    "formal_levels": [
      "E",
      "M",
      "M",
      "H",
      "H",
      "H",
      "A",
      "M"
    ],
    "formal_scenarios": [
      false,
      false,
      true,
      true,
      true,
      true,
      true,
      true
    ]
  },
  {
    "id": "kotlin-work-chains",
    "title": "Compose recoverable work chains and minimal platform access",
    "comps": [
      "m4.c1",
      "m4.c2"
    ],
    "intro": "Background pipelines often combine multiple durable stages: validate an input, transform it, upload it and record confirmation. Each stage needs clear inputs, outputs and failure semantics. A scheduler can express dependencies, but it cannot invent durable ownership, permanent URI access or exactly-once business effects.",
    "sections": [
      [
        "Mechanism and terminology",
        "WorkManager chaining uses continuation.then(...) to express downstream dependencies. Only start stages whose required predecessors succeeded under the chain policy. Unique work names and policies such as KEEP or REPLACE govern how a new scheduling request relates to existing unfinished work. REPLACE can cancel existing work, but cancellation alone does not undo side effects already committed remotely.",
        "A content URI is a reference with a particular access contract. If work must run later, ensure the chosen API supports the needed persisted grant or copy the selected content into suitable app-owned durable storage while access is available. Do not assume every temporary picker grant lasts until arbitrary background execution. Apply least privilege and close opened resources."
      ],
      [
        "Android application and verification boundary",
        "A receipt pipeline can persist the selected content, validate metadata, transform it and upload with an operation key. If the user selects another receipt, choose whether to keep the first operation, replace pending work or create a separate logical operation. A new selection is not automatically a retry of the old upload. Make the policy visible in durable records and user status.",
        "The Kotlin fixture computes the critical path of a small dependency graph with parallel transforms followed by upload. It verifies dependency arithmetic. The official WorkManager sample shows a linear cleanup→blur→save chain with charging constraints on save. Real URI grants, cancellation and platform scheduling remain device-test requirements."
      ]
    ],
    "code": "fun main(){val validate=2;val transformA=4;val transformB=7;val upload=3;val finish=validate+maxOf(transformA,transformB)+upload;println(finish)}",
    "expect": "12",
    "problem": "Calculate a pipeline’s ideal critical path.",
    "steps": [
      "Run validation before both independent transforms.",
      "Wait for the slower transform.",
      "Add the dependent upload duration."
    ],
    "limit": "Compiled and executed with official Kotlin2.2.21 on standalone JDK21, isolated without network. The fixture verifies Kotlin language or extracted pure decision logic. Android framework, Compose rendering, lifecycle, permission dialogs and WorkManager scheduling are source-reviewed, not executed in an emulator.",
    "mistakes": [
      "Replacing work does not roll back an already committed upload. Reconcile side effects through operation identity.",
      "A temporary content URI grant may expire before deferred work executes. Secure durable access under the API contract."
    ],
    "takeaways": [
      "Dependency chains preserve prerequisites.",
      "Platform access and remote side effects need their own recovery contracts."
    ],
    "practice": [
      "What does a work-chain dependency express?|Required predecessor success|Every stage starts simultaneously~Dependencies impose order.|Every network write is exactly once~Scheduling does not prove remote idempotency.|Every URI grant becomes permanent~Access contracts remain separate.|Chain structure models required stage order.",
      "What does REPLACE not guarantee for already committed remote effects?|Rollback|Cancellation request for existing work under policy~The policy can replace unfinished work.|A new scheduling relationship~That is what the policy addresses.|A need to reconcile uncertainty~Reconciliation can still be needed.|Cancelling local scheduled work does not undo remote commits.",
      "Validation2s precedes parallel transforms4s and7s, then upload3s. What is the ideal finish time?|12s|16s~The transforms can overlap.|9s~Upload still needs3s after the7s path.|7s~Validation and upload are omitted.|For this contract, 2+max(4,7)+3=12s.",
      "A picker URI grant is temporary but upload runs tomorrow. Which boundary needs attention?|Durable legal input access|Only the worker class name~Naming does not extend access.|Only launchSingleTop~Navigation policy does not preserve URI permission.|Only nullable syntax~Types do not create grants.|Deferred work must still be able to read its input legally and reliably.",
      "What should happen to opened platform streams?|Close them under an owned resource scope|Keep them forever~That leaks resources.|Convert them to route labels~That does not close them.|Assume every garbage collection closes them promptly~Prompt cleanup should be explicit.|Use appropriate resource-management constructs such as use where supported.",
      "A new image selection is not the same logical upload as a failed prior image. What should distinguish them?|Separate operation identities|The same idempotency key for all images forever~That can conflate different operations.|Only the displayed color~That does not identify payload ownership.|Only a shared global counter with no persistence~That may not survive recovery.|Idempotency identity follows a logical operation and its payload contract."
    ],
    "formal": [
      "What is a content URI primarily?|A provider-scoped content reference|A guarantee of unrestricted filesystem access~URI access is scoped.|An automatically uploaded image~A reference does not perform upload.|A permanent permission by definition~Grants can be temporary.|Inspect the supplying API’s access rules.",
      "What do unique-work policies primarily govern?|Named-work scheduling relationships|Server authorization to every account~They do not grant it.|Guaranteed remote rollback~Cancellation is not rollback.|Infinite input bundle capacity~Work data remains bounded.|They coordinate named work scheduling, not all business semantics.",
      "Validation3s precedes parallel stages5s and8s, then finalize2s. What is the ideal critical path?|13s|18s~That serializes independent stages.|10s~Validation is omitted.|8s~Both dependent endpoints are omitted.|For this contract, 3+max(5,8)+2=13s.",
      "An upload commits, then REPLACE cancels the worker before local acknowledgment. Which recovery state is most honest?|Uncertain outcome; reconcile by operation id|The upload definitely never happened~It already committed in the scenario.|Local cancellation proves remote rollback~It does not.|The new user automatically owns the old upload~Account ownership does not transfer.|Durable status must reflect uncertainty until reconciled.",
      "A job needs network and charging, but its input URI access expires before either becomes true. Which design is robust?|Persist supported access or own a copy|Assume constraints renew URI grants~Scheduling eligibility does not grant content access.|Retry the expired URI forever~Retries cannot manufacture permission.|Request every unrelated platform permission~That is broader and may not solve the URI contract.|Input durability must cover the planned execution lifetime.",
      "A pipeline stagesA2s thenB3s thenC4s runs once, fails afterB’s durable checkpoint and restarts fromC. How much stage execution time is needed across both runs, excluding retries inside stages?|9s|14s~That needlessly rerunsA andB despite the checkpoint.|4s~That omits the first run’s work.|18s~That doubles every stage.|The first run completes2+3 and recovery completes4, totaling9s.",
      "A deferred media pipeline must survive process loss, retain legal input access, avoid duplicate uploads after replacement and expose accurate status. Which design meets all requirements?|Durable input, checkpoints and keyed reconciliation|Store only a temporary URI in memory and treat cancellation as rollback~That fails access, durability and outcome accuracy.|Use one global key for all users and images~That conflates ownership and operations.|Return success before opening input to improve throughput~That invents completion.|Durable input, stage recovery, idempotency and honest status must align.",
      "What remains unverified by the critical-path fixture?|Device worker/grant tests|The maxOf arithmetic~That is executed.|The integer stage durations~Those are supplied.|The printed sum~That is executed.|Source review does not replace device integration tests."
    ],
    "lang": "kotlin",
    "formal_levels": [
      "E",
      "M",
      "M",
      "H",
      "H",
      "H",
      "A",
      "M"
    ],
    "formal_scenarios": [
      false,
      false,
      true,
      true,
      true,
      true,
      true,
      true
    ]
  }
],["null-safety.md", "data-classes.md", "collections/collections-overview.md", "coroutines-overview.md"],{repo:'JetBrains/kotlin-web-site',commit:'c0c20bb7efdb798e90b024d7de8d1078de3a4057',base:'docs/topics/',title:'Official Kotlin: ',verification:'Pinned official source bytes read in isolated /tmp/echolens-native-kotlin-reference. Kotlin2.2.21/JDK21 fixtures verify language and extracted logic only; Android APIs are source-reviewed and need device tests.'});
const nativeRefs=[["android/architecture-samples", "ee66e1526b84c026615df032c705842b7d2a521f", "app/src/main/java/com/example/android/architecture/blueprints/todoapp/tasks/TasksScreen.kt"], ["android/architecture-samples", "ee66e1526b84c026615df032c705842b7d2a521f", "app/src/main/java/com/example/android/architecture/blueprints/todoapp/tasks/TasksViewModel.kt"], ["android/architecture-samples", "ee66e1526b84c026615df032c705842b7d2a521f", "app/src/main/java/com/example/android/architecture/blueprints/todoapp/TodoNavigation.kt"], ["android/permissions-samples", "eb80f0faff479a34b5ee1ed1d246c1c94e3d0b01", "PermissionsActivityResultKotlin/Application/src/main/java/com/example/android/basicpermissions/MainActivity.kt"], ["android/codelab-android-workmanager", "d0960a669598b985af0b7875062f6a27940d25f3", "app/src/main/java/com/example/background/BlurViewModel.kt"], ["android/codelab-android-workmanager", "d0960a669598b985af0b7875062f6a27940d25f3", "app/src/main/java/com/example/background/workers/BlurWorker.kt"]];
for(const [i,[repo,commit,path]] of nativeRefs.entries()){const id='kotlin-android.android-ref'+i;c.references.push({id,title:'Official Android sample: '+path.split('/').pop(),url:'https://github.com/'+repo+'/blob/'+commit+'/'+path,source:{repo,commit,path,verification:'Exact pinned source read from isolated official checkout. Source-reviewed Android API evidence; no emulator execution claimed.'}});for(const lesson of c.lessons)lesson.references.push(id);}
module.exports=c;
