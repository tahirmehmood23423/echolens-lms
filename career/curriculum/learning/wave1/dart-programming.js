'use strict';
const {course}=require('./wave4-native-private');
module.exports=course('dart-programming',[
  {
    "id": "dart-types-bindings",
    "title": "Distinguish a variable binding from the object it references",
    "comps": [
      "m1.c1"
    ],
    "intro": "Dart code in a mobile app moves values between forms, models and services. A variable has a static type that determines which operations are permitted, and a binding may or may not be reassigned. Object mutability is a separate property: final can protect a reference without freezing the referenced collection.",
    "sections": [
      [
        "Types and inference",
        "Use an explicit type when it explains an API contract and inference when a local initializer makes the type clear. var does not mean dynamically typed: var count=3 infers an integer type rather than promising that any later value is allowed. dynamic defers selected checks to runtime, while Object expresses a common non-null supertype without allowing every member access.",
        "final permits one initialization of its binding; that initializer can run at runtime. const requires a compile-time constant value and can create immutable constant collections. A final List<int> can still have mutable contents unless its actual collection is immutable. Do not equate a final field with deep immutability of every object reachable through it."
      ],
      [
        "Apply the distinction to product data",
        "For an order draft, keep a mutable local working collection only when editing is intended. For a published model, choose an immutable snapshot or expose a read-only contract appropriate to ownership. If a nested object remains mutable, an unmodifiable outer list still does not freeze that nested object. Explain this boundary in the model contract.",
        "The native example uses a final list and changes its contents. It runs in Dart SDK3.13.7, showing actual language semantics rather than a Python approximation. It does not use Flutter widgets or prove safe concurrent application architecture; the point is the difference between binding assignment and object mutation."
      ]
    ],
    "code": "void main(){ final amounts=<int>[2,3]; amounts.add(4); const tax=2; print(amounts.reduce((a,b)=>a+b)+tax); }",
    "expect": "11",
    "problem": "Calculate a total after modifying a collection referenced by a final binding.",
    "steps": [
      "Infer the fixed binding type from the typed list.",
      "Append to the mutable list object without reassigning the binding.",
      "Sum the three entries and add the constant adjustment."
    ],
    "limit": "Native Dart3.13.7 executes the list mutation and arithmetic. No Flutter SDK, UI lifecycle, network or deep-immutability proof is involved.",
    "mistakes": [
      "Assuming var permits every later type confuses inference with dynamic dispatch. Follow the inferred static type.",
      "Assuming final freezes a list ignores object mutability. Use an appropriate immutable collection when required."
    ],
    "takeaways": [
      "Binding stability and object mutability differ.",
      "const has compile-time restrictions.",
      "Make ownership and nested mutability explicit."
    ],
    "practice": [
      "What does final primarily restrict for a Dart local binding?|Reassignment of that binding|Mutation of every referenced object~The object may remain mutable.|All runtime computation in its initializer~A final initializer can run at runtime.|Every method call on the value~The value still exposes permitted operations.|A final binding is initialized once, which does not recursively freeze its value.",
      "A final list receives add(4). Which property decides whether mutation succeeds?|The list object\u2019s mutability|The variable name\u2019s length~Names do not establish mutation policy.|Whether the binding can be reassigned~Binding reassignment and object mutation differ.|The app\u2019s current route~Routing does not change this language contract.|A final reference can point to either a mutable or immutable list.",
      "A team uses var count=3 and later wants to assign text. Which claim is correct?|Inference selected an integer type|var removes static typing~Inference still chooses a static type.|All values are converted to strings~There is no such automatic binding conversion.|final would be needed to infer int~Final is not required for type inference.|The initializer determines the inferred local type under the language rules.",
      "An immutable order model exposes a final mutable list supplied by its caller. What risk remains?|The caller can mutate shared contents|The binding automatically becomes null~Final does not introduce nullability.|Every element is recursively copied~Assigning a list does not deep-copy it.|The constructor cannot run at runtime~Final fields can be initialized at runtime.|Sharing the same mutable object preserves an external mutation path.",
      "A runtime-configured value must be initialized once. Which declaration concept fits?|A final runtime binding|Only a compile-time const~The configuration is not known at compile time.|A dynamic value to disable reassignment~Dynamic does not make the binding immutable.|A const annotation on every consumer~Consumers cannot make a runtime value constant.|Final permits one initialization whose value is computed at runtime.",
      "A const outer collection contains constant values. What should a reviewer avoid claiming from a different final collection?|That final alone supplies the same immutability|That const has compile-time requirements~This property is explicitly supported by the stated language contract.|That a final binding has one initialization~That is the binding rule.|That object ownership remains relevant~Ownership still matters.|The two declarations express different guarantees about values and bindings."
    ],
    "formal": [
      "What is the purpose of a Dart static type?|Permitted operations and assignments|Select the mobile screen\u2019s pixel density~Density is not a language type rule.|Automatically deep-copy every assignment~Types do not imply copies.|Guarantee every runtime operation succeeds~Validly typed operations can still fail.|Static typing constrains code before it runs but is not a universal success guarantee.",
      "Which declaration requires a compile-time constant initializer?|const|final in every case~Final can use runtime initialization.|var in every case~Inference permits runtime values.|dynamic in every case~Dynamic does not impose constant initialization.|Const has compile-time constant restrictions.",
      "A final list contains2 and3, then receives4. What sum is printed by the shown native fixture?|9|5~That ignores the successful mutation.|4~That is the appended item, not the sum.|ERROR~A mutable list can be changed through a final reference.|The binding is stable while its mutable contents become2,3,4.",
      "A report model stores a caller\u2019s mutable List<int> directly in a final field. The caller later appends a row. Which behavior follows?|The model observes the shared list mutation|The field silently rebinds to a new copy~No copy was created.|The caller\u2019s list becomes compile-time constant~A final reference does not change the object class.|The append is rejected solely because another reference is final~Mutability belongs to the list, not the other binding.|Both references still identify the same mutable object.",
      "A configuration value comes from a runtime parser and must never be rebound. Which design is appropriate?|A final runtime binding plus parsed-value validation|A const binding initialized by the runtime parser~That initializer is not a compile-time constant.|A dynamic binding with no validation~Dynamic neither freezes the binding nor validates business meaning.|A mutable global reassigned on every read~That violates the stated stable-binding intent.|Final handles one-time binding; validation handles the value\u2019s domain correctness.",
      "A developer replaces a typed local with dynamic to call a missing method without an analyzer complaint. What risk moves later?|A member-dispatch failure can occur at runtime|All method names become valid implementations~Dynamic does not manufacture missing methods.|The object is automatically converted to the required type~There is no universal conversion.|Every data validation check becomes unnecessary~Business validity is independent of dispatch.|Dynamic defers selected checks rather than proving the call is meaningful.",
      "A final model field points to an unmodifiable list of mutable item objects. Which guarantee is actually supported?|Outer list fixed; items may mutate|Every nested item is deeply frozen by the final field~Neither final nor outer-list protection implies that.|The outer list must remain growable because items are mutable~Outer and nested mutability are independent.|The caller can always append through this unmodifiable interface~That operation is prohibited by the collection contract.|Review the entire reachable object graph when deep immutability is required.",
      "A mobile draft needs editable rows; a submitted snapshot must not change when callers edit their original list. Which design matches both lifetimes?|Mutable draft; owned submission snapshot|Expose the original list through a final field in both models~The submitted model still shares its mutable contents.|Declare the runtime draft const and append to it~A constant collection cannot serve the required mutation path.|Store only a dynamic reference and rely on the UI not to mutate it~That adds no enforceable snapshot boundary.|Separate mutable editing ownership from the immutable submission representation."
    ],
    "lang": "dart",
    "formal_code": {
      "2": {
        "code": "void main(){final x=<int>[2,3];x.add(4);print(x.reduce((a,b)=>a+b));}",
        "expect": "9",
        "lang": "dart"
      }
    },
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
    "id": "dart-nullable-values",
    "title": "Handle absent data with nullable types and explicit fallback rules",
    "comps": [
      "m1.c2"
    ],
    "intro": "A customer profile can omit an optional nickname. Sound null safety lets its type express that absence, so the compiler can require an explicit decision before code calls a member that is not valid on null. This is a representation guarantee; it does not tell the product which fallback is appropriate.",
    "sections": [
      [
        "Read nullable operators precisely",
        "String? can hold a string or null. A null-aware access such as nickname?.length evaluates to null when the receiver is null. The operator ?? selects its right-hand fallback only when the left operand is null, not when it is empty, zero or false. Check empty-string business rules separately when they matter.",
        "The assertion operator ! says that the programmer expects a nullable value to be non-null at that point. If the expectation is false, the program can throw at runtime. It is not a request to supply a default, and repeated assertions do not validate a remote response. Prefer flow checks, explicit fallbacks or a stronger model boundary when absence is expected."
      ],
      [
        "Separate absence from invalid meaning",
        "A null-safe profile can still contain an invalid email address or an empty required display name. Validate business rules at the appropriate boundary after parsing. For optional text, decide whether blank text is meaningful, should be normalized, or should trigger a fallback. Preserve the difference if it matters for auditing user input.",
        "The example evaluates a missing nickname and an empty nickname under the same null-only rule. It demonstrates the actual operators in the installed native Dart runtime. It does not validate user identity or make a server response trustworthy, and it does not turn an optional field into a mandatory one."
      ]
    ],
    "code": "void main(){ String? missing; String? empty=''; print(missing?.length??-1); print(empty.length); print(empty??'Guest'); }",
    "expect": "-1\n0\n",
    "problem": "Compare missing and empty text under a null-only fallback rule.",
    "steps": [
      "Evaluate null-aware length on the missing value.",
      "Use the fallback only because that result is null.",
      "Observe that empty text has length zero and does not use the text fallback."
    ],
    "limit": "Native Dart executes the nullable operators. The final empty line is an empty value, not proof of profile validation or authentication.",
    "mistakes": [
      "Replacing every ! assertion with confidence in the API hides expected absence. Validate the boundary.",
      "Treating ?? as an empty-string test mixes null absence with content rules. Test blanks explicitly when required."
    ],
    "takeaways": [
      "Nullable types express absence.",
      "?? is null-only.",
      "Null safety does not validate business content."
    ],
    "practice": [
      "Which value activates the fallback in left??right?|null|An empty string automatically~Empty text is a non-null value.|Zero automatically~Zero is not null.|False automatically~False is a valid non-null Boolean.|The operator tests nullness rather than general truthiness.",
      "A String? may contain null. What does a failed ! expectation do?|It can throw at runtime|It inserts an empty string~Assertion does not manufacture a fallback.|It authenticates the source~Null assertions are not access control.|It changes the declaration into const~Nullability and const are different concepts.|The programmer\u2019s assertion can be wrong for an actual null value.",
      "A nickname is empty but not null. What should the app do if blanks also require Guest?|Apply an explicit blank-content rule|Use ?? alone and assume it tests blanks~The operator falls back only for null.|Add more ! assertions~Assertions do not implement an empty-string policy.|Change the field to dynamic~Dynamic does not validate content.|Business rules may distinguish null, empty and whitespace values.",
      "A null-safe response includes an empty required email. What remains necessary?|Business-content validation|A second nullable marker on String~More nullability does not make the email meaningful.|A const keyword on the response~Const does not validate email syntax.|A forced member access with !~An assertion does not establish valid content.|Type safety and domain validity solve different problems.",
      "A nullable count is0. What does count??10 return?|0|10~Zero is non-null.|null~The supplied value is not null.|ERROR~A nullable integer can hold zero.|Null fallback retains valid zero values.",
      "A remote field can legitimately be absent. Which boundary is stronger than scattering assertions?|Parse into a model with an explicit absence policy|Trust every parsed map entry because JSON is valid~Syntax does not determine required field semantics.|Assert every field after every widget rebuild~That duplicates an unchecked assumption.|Erase all types using dynamic~That moves rather than resolves checks.|A model boundary can establish how absence is represented and handled."
    ],
    "formal": [
      "What does String? add to the set of allowed String values?|null|A guarantee that every string is non-empty~Nullable typing does not constrain contents.|A permanent runtime default of Guest~Fallbacks require application logic.|Every unrelated object type~The type remains restricted.|The nullable type includes null alongside its underlying values.",
      "What does optional?.length evaluate to when optional is null?|null|0~Null-aware access does not invent a length.|The string Guest~It does not supply that fallback.|A successful authentication result~Member access is unrelated to identity.|Null-aware access short-circuits the member lookup.",
      "A nullable score is0 and its fallback is10. What does the native expression score??10 print?|0|10~The score is present even though it is zero.|null~The actual value is zero.|ERROR~This is a valid null-coalescing expression.|The fallback is used only for a null left operand.",
      "A profile response omits optional nickname but includes required email as blank text. Which policy handles both facts?|Apply each field\u2019s absence and validity rules|Reject the nickname solely because it is nullable~The field is explicitly optional.|Accept the email because it is non-null~Non-nullness does not satisfy the required email rule.|Replace all fields with one fallback without recording invalid input~That conflates different field contracts.|Each field needs the appropriate representation and domain policy.",
      "A nickname is an empty string and the screen uses nickname??Guest. What is displayed under that expression?|The empty string|Guest~The left operand is not null.|The literal word null~The value is empty text, not null.|A null-assertion error~The expression has no assertion operator.|A null-only fallback does not implement a blank-text fallback.",
      "A nullable field passes a non-null check, but the user-provided text still violates an allowed-length rule. What follows?|Non-null typing passes but domain validation fails|The length rule is automatically waived by promotion~Promotion establishes type information, not arbitrary policy.|The value must have become null again~Invalid length does not imply nullness.|Declaring the value final makes its length valid~Binding stability cannot establish content validity.|Type promotion and business validation have distinct guarantees.",
      "A contract permits null as unknown balance and0 as a verified zero balance. A reviewer proposes treating both as missing. Which concern is valid?|It erases the unknown-versus-zero distinction|Zero cannot be represented by an int~Zero is a valid integer.|Nullable values are always strings~The type can be int?.|A fallback makes all arithmetic cryptographically secure~Fallback policy has no such guarantee.|Null-only handling preserves verified zero as different from unknown.",
      "A parsing boundary returns either a validated profile or a structured error. Downstream code currently applies! to every map field. Which refactor best reduces unchecked assumptions?|Centralize validation in a typed parser|Add! to the structured error too~That does not validate the original fields.|Convert the entire profile to dynamic and let widgets fail later~That increases deferred failures.|Treat valid JSON syntax as a validated profile~Syntax alone does not establish field contracts.|A stronger model boundary can centralize and expose the absence and validity decisions."
    ],
    "lang": "dart",
    "formal_code": {
      "2": {
        "code": "void main(){int? score=0;print(score??10);}",
        "expect": "0",
        "lang": "dart"
      }
    },
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
    "id": "dart-initialization",
    "title": "Choose safe initialization boundaries",
    "comps": [
      "m1.c1",
      "m1.c2"
    ],
    "intro": "A dependency created after startup is different from a value that may legitimately be absent. Dart offers nullable fields and late initialization for these distinct contracts. Selecting a declaration is a design decision about object lifetime, not a way to silence the analyzer.",
    "sections": [
      [
        "Mechanism and terminology",
        "A late variable promises initialization before its first read. Reading an uninitialized late variable throws a runtime error. A late final field permits one successful initialization; it does not make repeated startup callbacks safe. Prefer constructor injection when a dependency is necessary for every valid instance.",
        "Flow analysis can promote eligible locals after a null check. Keep the check close to the use and consider whether mutation or callbacks can invalidate assumptions. A nullable dependency exposes absence in the type; a late dependency hides an initialization obligation in lifecycle code."
      ],
      [
        "Apply and verify",
        "For a session identifier loaded from storage, decide whether the app can represent a signed-out state. If it can, nullable state may accurately describe the product. If every repository requires an identifier, construct the repository only after a validated identifier exists rather than leaving it temporarily invalid.",
        "The fixture initializes a late final fee once and sums it with a nullable discount fallback. Trace the binding and the business calculation separately. Tests should also exercise missing initialization, duplicate initialization and legitimate zero discounts instead of covering only successful startup."
      ]
    ],
    "code": "void main(){late final int fee;fee=7;int? discount;print(fee-(discount??0));}",
    "expect": "7",
    "problem": "Initialize a one-time fee and preserve an absent discount policy.",
    "steps": [
      "Declare a late final integer.",
      "Assign it before any read.",
      "Apply a null-only zero-discount fallback."
    ],
    "limit": "Executed using native Dart SDK3.13.7 in an isolated process without network. This fixture verifies the shown language behavior; production Flutter integration still requires platform tests.",
    "mistakes": [
      "Using late to represent expected absence creates runtime initialization failures. Use a nullable state or valid construction boundary.",
      "A second initialization of late final is not an idempotent update. Guard lifecycle ownership or redesign the state."
    ],
    "takeaways": [
      "late moves an initialization obligation to runtime.",
      "Construct required dependencies in valid states."
    ],
    "practice": [
      "A late local is read before initialization. What happens?|A runtime initialization error|It automatically becomes zero~Late does not supply a numeric default.|It automatically becomes null~A non-null late value does not gain nullability.|Its constructor runs twice~Reading a variable does not invent a constructor call.|Late promises initialization before reading and checks that promise at runtime.",
      "A fee is7 and nullable discount is null. What does fee-(discount??0) produce?|7|0~The fallback replaces only the discount.|-7~The operands are not reversed.|ERROR~The fallback supplies a valid integer.|The missing discount becomes0, so7-0=7.",
      "A repository always needs a tenant id. Which construction is strongest?|Require a validated id in its constructor|Read an uninitialized late id on demand~That postpones failure.|Use! on an optional global~That does not establish tenant validity.|Silently use another tenant\u2019s id~That violates the required identity boundary.|Constructor injection establishes the dependency for every valid instance.",
      "A login screen legitimately begins signed out. Which representation fits?|Explicit nullable or sealed authentication state|An uninitialized late user read during rendering~Expected absence should be representable.|A non-null user forced with!~An assertion does not create a user.|A shared previous user as default~That can mix identities.|Signed-out is an expected state rather than an initialization accident.",
      "A late final token has already been initialized. Can a refresh assign a different token?|No, that binding is one-time initialized|Yes because late means mutable~Late changes initialization timing.|Yes because strings are immutable~Value immutability does not permit binding reassignment.|Only if the new token has equal length~Length is unrelated.|Choose a mutable state holder when replacement is part of the contract.",
      "A local int? is checked for null before arithmetic. Which mechanism can permit its non-null use?|Flow promotion|Automatic encryption~Typing does not encrypt.|Deep copying~The check does not copy.|A mandatory background isolate~Promotion is static analysis.|Eligible checked locals can be treated as non-null in the guarded flow."
    ],
    "formal": [
      "What obligation does late introduce?|Initialize before first read|Always initialize at compile time~Late permits deferred runtime initialization.|Always permit reassignment of final~Final remains one-time initialized.|Always make the value nullable~Late does not add null.|Late defers initialization and checks access at runtime.",
      "Which field declaration best communicates expected optional text?|String?|late String solely to avoid absence~Late expresses an initialization promise.|const String from an unknown future value~Const requires a constant initializer.|dynamic solely to permit null~Dynamic erases useful contract information.|A nullable type directly represents optional text.",
      "A batch applies base12, initialized late fee3, and nullable discount0 using base+fee-(discount??5). What is the result?|15|10~Zero is non-null, so5 is not selected.|12~The fee still applies.|18~The discount expression does not add3.|12+3-0=15 because null coalescing preserves zero.",
      "A widget reads late session during initial render, while async storage loading assigns it later. Which change satisfies valid signed-out rendering and prevents initialization errors?|Explicit auth states; construct services when valid|Add! after the late read~The initialization error occurs before a nullable assertion could help.|Mark the field final and keep the same read order~Final does not initialize the field.|Move the same uninitialized read into a getter~A getter does not establish readiness.|An explicit state model lets rendering handle expected absence and delays required dependencies safely.",
      "A startup callback may run twice and assigns late final config each time. Why is this design unsafe even if values match?|A second initialization is forbidden|Equal values automatically coalesce~Late final does not deduplicate writes.|The second callback must run in a new isolate~The scenario does not create one.|Final makes both assignments compile-time constants~Runtime callbacks do not become constant.|Equality of values does not turn a second initialization into a legal first assignment.",
      "A cache records null for unknown quantity and0 for confirmed empty stock. A calculation uses (quantity??8)+2. Which pair results for unknown and confirmed empty?|10 and2|10 and10~Zero is not missing.|2 and2~Unknown uses the fallback8.|8 and0~The expression adds2.|The null case is8+2 and the zero case is0+2.",
      "An account service needs an immutable verified account id but tokens refresh and signed-out must be rendered. Which ownership design meets all three constraints?|Separate service identity, token and auth state|Put id and tokens in late final globals and rewrite both on refresh~Final globals conflict with refresh and account isolation.|Use one nullable global for every account and assert it in all methods~That does not establish service identity or safe absence.|Reuse the prior account service after switching ids~That preserves the wrong service ownership.|Separate permanent service identity, replaceable credentials and expected authentication state.",
      "A guarded local int? value is non-null. What still requires separate validation before using it as a seat count?|Its allowed range|Whether null exists as a language value~The guard already addresses this use.|Whether every integer is a string~It is an integer.|Whether the binding name starts with a vowel~Naming does not validate counts.|A non-null integer can still be negative or exceed capacity."
    ],
    "lang": "dart",
    "formal_code": {},
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
    "id": "dart-collection-pipeline",
    "title": "Transform typed collections without losing intent",
    "comps": [
      "m2.c1"
    ],
    "intro": "A cart calculation combines selection, transformation and aggregation. Dart Iterable operations make each stage explicit: where selects elements, map transforms them, and fold accumulates a result with a chosen initial value. Knowing which stages are lazy helps explain execution and ownership.",
    "sections": [
      [
        "Mechanism and terminology",
        "where and map generally produce lazy iterables. Their callbacks run as the iterable is consumed, and a second iteration may run callbacks again. Use toList when a concrete snapshot is required. A snapshot of object references is still not a deep copy of those objects.",
        "A fold with initial0 can sum an empty integer collection safely. reduce combines existing elements and needs at least one element. For maps, choose a key collision policy explicitly: overwriting a previous value may be right for latest-state data but wrong for an event history."
      ],
      [
        "Apply and verify",
        "A store filters unavailable items before calculating payable totals. Selecting before an expensive mapping can save work, but changing order is only valid when the operations preserve the required semantics. Keep money in an appropriate representation and use tested rounding rules at the boundary.",
        "The fixture uses integer minor units so arithmetic is exact for this simplified example. It filters values at least20, doubles each retained amount and folds from0. It proves the collection transformation, not tax law or a complete monetary model."
      ]
    ],
    "code": "void main(){final totals=[10,20,30].where((x)=>x>=20).map((x)=>x*2);print(totals.fold<int>(0,(a,b)=>a+b));}",
    "expect": "100",
    "problem": "Trace a filter-map-fold pricing pipeline.",
    "steps": [
      "Keep20 and30.",
      "Transform retained values to40 and60.",
      "Accumulate from0 to100."
    ],
    "limit": "Executed using native Dart SDK3.13.7 in an isolated process without network. This fixture verifies the shown language behavior; production Flutter integration still requires platform tests.",
    "mistakes": [
      "Using reduce on an empty cart fails. Fold with an explicit identity when empty input is valid.",
      "Treating lazy iterables as permanent snapshots hides later source changes. Materialize when ownership requires it."
    ],
    "takeaways": [
      "Know whether a result is lazy.",
      "Choose an aggregation identity and collision policy."
    ],
    "practice": [
      "Which operation selects matching Dart iterable elements?|where|map~Map transforms every consumed element.|fold~Fold accumulates a result.|add~Add mutates a growable collection.|Where retains only elements satisfying its predicate.",
      "What is the sum of an empty list using fold<int>(0,(a,b)=>a+b)?|0|null~The initial accumulator is0.|ERROR~Fold supports an empty source.|1~One is not the supplied identity.|With no elements the initial accumulator is returned.",
      "A callback passed to map has side effects. Why can consuming the iterable twice be surprising?|The callback may run again|Map always eagerly stores one result~Map is normally lazy.|The source becomes immutable~Laziness does not freeze it.|Every callback executes on a new thread~Map does not imply threading.|Repeated iteration can repeat lazy callback work.",
      "A report must retain today\u2019s row ordering after tomorrow\u2019s source edits. What should it create?|An owned list snapshot|Only a lazy iterable view~It can observe later source contents.|A dynamic alias to the same list~An alias is not a snapshot.|A final binding to the same list~Final does not copy it.|Materialization establishes a list at the chosen time, subject to nested object ownership.",
      "A cart contains4,7,9, selects values above5 and sums them. What total results?|16|20~That includes4.|9~Both7 and9 match.|12~The matching values sum to16.|For the stated inputs, selection retains7 and9.",
      "A map receives the same customer id twice with direct assignment. Which policy is applied?|Last assignment wins|Both values automatically form an event log~A map key has one associated value.|The first value is always permanent~Assignment can replace it.|Every duplicate key throws~Ordinary assignment replaces a value.|Choose grouping when all historical values are needed."
    ],
    "formal": [
      "Which collection operation accumulates with an explicit initial value?|fold|where~Where selects elements.|map~Map transforms elements.|contains~Contains tests membership.|Fold starts with the supplied accumulator.",
      "Which call materializes an iterable as a list?|toList()|where()~The filter is generally lazy.|map()~Mapping is generally lazy.|isEmpty~That inspects emptiness.|ToList creates a list of the iterated results.",
      "A store has prices8,15,22, keeps prices above10 and subtracts2 from each. What subtotal follows?|33|45~That includes8 and ignores discounts.|37~That omits the two discounts.|29~That subtracts too much.|For the stated inputs, 15-2+22-2=33.",
      "A lazy map increments an audit counter for each of3 rows. The same iterable is fully consumed twice. How many increments occur if the source is unchanged?|6|3~The callback can run on each iteration.|1~It runs per element, not once per iterable.|0~Both consumers evaluate the mapping.|Two complete traversals of three mapped elements cause six increments.",
      "A pipeline applies where(x>5), map(x*3), fold(0,+) to2,6,8. Which result is correct?|42|48~That wrongly includes2.|14~That ignores the mapping.|18~That misses8.|The retained6 and8 become18 and24, summing42.",
      "A report needs the latest value per key while an audit needs every transition. Which pair of structures meets both constraints?|Latest-state map plus append-only history|One overwriting map for both~Overwriting destroys earlier transitions.|One set of keys for both~Keys alone omit values and transitions.|A lazy key iterator as permanent history~It neither stores snapshots nor events.|Different retention contracts require different representations.",
      "A checkout iterates a lazy taxed-price map twice, and tax computation reads mutable policy each time. It must show exactly the charged amounts, avoid duplicate computation and preserve order. Which change meets the requirements?|One validated ordered checkout snapshot|Make only the iterable binding final~Its callbacks may still reexecute.|Call map again independently for the charge~That allows policy drift and duplicates work.|Convert prices to a set before both passes~That can lose duplicates and ordered line identity.|A single owned result snapshot fixes the calculation boundary while retaining line order.",
      "A reduce call fails for an empty filtered result. Which repair preserves a legitimate zero total?|Use fold with initial0|Insert an arbitrary item priced1~That alters the total.|Catch the error and charge the last customer\u2019s total~That violates input ownership.|Use! on the empty iterable~A null assertion does not create elements.|Zero is the addition identity for an empty valid cart."
    ],
    "lang": "dart",
    "formal_code": {},
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
    "id": "dart-function-contracts",
    "title": "Design named and optional parameter contracts",
    "comps": [
      "m2.c2"
    ],
    "intro": "Functions define a reusable operation and its input contract. In Dart, positional parameters encode order, named parameters expose call-site meaning, and required named parameters demand an explicit argument. Optional parameters need a clear absence or default policy.",
    "sections": [
      [
        "Mechanism and terminology",
        "Named parameters are declared in braces. Use required when a named argument must be supplied. A non-null optional parameter needs an appropriate constant default unless the declaration has another supported initialization contract. Optional positional parameters use brackets and are filled by position.",
        "Default values are part of the public behavior. A default of one unit may be helpful for a single-item purchase but dangerous for a bulk import where missing quantity should be rejected. Nullability and requiredness are separate: a required nullable parameter requires the caller to acknowledge the argument while allowing null as its value."
      ],
      [
        "Apply and verify",
        "An invoice helper should make discount and units clear at every call site. Keep validation close to the function boundary so a negative quantity cannot silently become a credit. Side effects such as payment capture should be separated from a pure total calculation to simplify retries and tests.",
        "The native example has a required unit price and default units. Trace which call uses the default and which supplies an override. The arithmetic is deliberately pure; it does not perform a payment, and integer overflow or currency conversions require their own domain choices."
      ]
    ],
    "code": "int total({required int price,int units=1})=>price*units; void main(){print(total(price:7));print(total(price:7,units:3));}",
    "expect": "7\n21",
    "problem": "Compare a required named argument with an optional default.",
    "steps": [
      "Read the named contract.",
      "Call once with units omitted.",
      "Call again with three units."
    ],
    "limit": "Executed using native Dart SDK3.13.7 in an isolated process without network. This fixture verifies the shown language behavior; production Flutter integration still requires platform tests.",
    "mistakes": [
      "Optional positional flags obscure meaning. Named arguments help distinguish independent business controls.",
      "A default is not validation. Reject invalid explicit values separately."
    ],
    "takeaways": [
      "Requiredness and nullability differ.",
      "Choose defaults as domain policy."
    ],
    "practice": [
      "Which syntax marks a mandatory named Dart argument?|required|late~Late concerns initialization timing.|dynamic~Dynamic changes checking.|const~Const concerns compile-time values.|Required makes omission of that named argument invalid.",
      "A total function defaults units to1. At price9 with units omitted, what is the result?|9|0~The default is1, not0.|18~Two units were not requested.|ERROR~The optional argument has a default.|For the stated inputs, 9 times1 is9.",
      "Why might named parameters improve two boolean settings?|Names clarify each setting|They make every bool nullable~Naming does not change the type.|They remove validation requirements~Input contracts still need validation.|They always run concurrently~Parameter syntax does not schedule work.|Names communicate the role of otherwise similar values.",
      "A required nullable argument is omitted. Is the omission valid?|No, required still requires the argument|Yes because nullability removes requiredness~These are independent properties.|Only when the app is offline~Connectivity is unrelated.|Only for final callers~Final is not a caller category.|The caller may pass null but must supply the argument.",
      "A function defaults units to1 but receives units:-2. What protects the business rule?|Explicit range validation|The default automatically replaces negative values~Defaults apply to omission.|The named parameter converts -2 to2~Naming does not alter values.|The int type forbids negative numbers~Int includes negative values.|Validate the domain separately from parameter syntax.",
      "A pure quote calculation is retried. What is simpler than retrying a function that also charges a card?|Separate quote from capture|Removing all function parameters~That hides input dependencies.|Using dynamic for every field~That weakens type information.|Making the card capture a default value~Defaults cannot establish idempotency.|Pure calculation can repeat without duplicating payment capture."
    ],
    "formal": [
      "What do braces around Dart parameters introduce?|Named parameters|A new isolate~Parameters do not create isolates.|A constant map result~Declaration syntax is not a returned map.|Only positional arguments~Braces name the arguments.|Named arguments are supplied by their parameter names.",
      "When is an optional parameter default selected?|When the caller omits that argument|Whenever the explicit argument is negative~Defaults are not range normalization.|Only after every exception~Errors do not universally trigger defaults.|Whenever a caller uses a variable~Variables are valid explicit arguments.|Omission selects the declared default.",
      "A quote is price11*units with units default1 and fee default2. Calling quote(price:11,units:4) gives what total if it adds fee once?|46|44~That omits the default fee.|52~That applies the fee per unit.|13~That ignores the explicit units.|For the stated inputs, 11*4+2=46.",
      "A bulk importer must reject missing quantity, while a single-item quick-add defaults to one. Which API separation preserves both contracts?|Required import quantity; quick-add wrapper|One silent default1 in the import function~That accepts missing bulk data.|A nullable quantity asserted everywhere~That turns expected input errors into runtime assertions.|A dynamic quantity defaulting to text~That weakens a numeric contract.|Required input at the import boundary and a deliberate wrapper express different business operations.",
      "A helper accepts required String? coupon. A caller supplies coupon:null and another omits coupon entirely. Which calls satisfy requiredness?|The explicit-null call only|Both because nullable means optional~Nullability does not permit omission.|Neither because required forbids null~The declared type allows null.|Only the omitted call~That reverses the contract.|The parameter must be present, and its value may be null.",
      "A total uses base8, units3, discount default0 and fee default2; the call supplies discount4. What result follows for base*units-discount+fee?|22|26~That ignores the explicit discount.|18~That subtracts the discount twice.|20~That omits the fee.|For the stated inputs, 8*3-4+2=22.",
      "A public checkout helper has two positional booleans, performs capture during quote calculation and silently uses quantity1 for absent imports. Which redesign meets clarity, retry safety and data-quality requirements?|Named validated inputs; pure quote; keyed capture|Rename local variables while retaining every external contract~That leaves ambiguous calls and side effects.|Make every argument optional and catch all errors as success~That hides invalid input and payment uncertainty.|Use one dynamic map and charge on every read~That worsens type and retry boundaries.|The changes address separate call-site, side-effect and validation constraints.",
      "A function receives an explicit zero quantity where zero is forbidden. Which behavior should its default policy imply?|Reject explicit zero through validation|Always substitute1 because zero is false~Dart does not use this numeric truthiness rule.|Skip type checking because the parameter is named~Names do not remove checking.|Convert zero to null automatically~There is no such parameter conversion.|Omission defaults and explicit invalid inputs need distinct treatment."
    ],
    "lang": "dart",
    "formal_code": {},
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
    "id": "dart-collection-apis",
    "title": "Combine typed transformations and function boundaries",
    "comps": [
      "m2.c1",
      "m2.c2"
    ],
    "intro": "A reusable reporting API should specify both how it transforms data and which caller controls are legal. Collection operations answer how rows flow; function contracts answer who selects thresholds, whether source order matters and whether the result is a view or an owned snapshot.",
    "sections": [
      [
        "Mechanism and terminology",
        "Declare input and output types so the compiler can check the shape of callbacks and values. A List<int> return makes materialization visible in the contract. An Iterable<int> return can deliberately expose lazy work, but document that repeated iteration may re-evaluate transformations.",
        "Maps support lookup by key and may return null when a key is absent. If stored values themselves are nullable, a null lookup alone cannot distinguish missing key from a present null value. Use containsKey where the distinction matters, and do not force every lookup with! as a substitute for a missing-key policy."
      ],
      [
        "Apply and verify",
        "A fulfillment report can accept required rows and a named minimum amount. Select eligible amounts, sort an owned copy if a new ordering is needed, and leave the caller\u2019s source intact. Sorting a shared input is an observable side effect even if the function name sounds like a read operation.",
        "The fixture filters with an explicit threshold, materializes a new list and prints both the result and original. The result list shares immutable integer values safely here. With mutable row objects, additional ownership decisions are needed to prevent later edits from changing the report."
      ]
    ],
    "code": "List<int> selected(List<int> rows,{required int min})=>rows.where((x)=>x>=min).toList();void main(){final src=[3,8,5];final out=selected(src,min:5)..sort();print(out);print(src);}",
    "expect": "[5, 8]\n[3, 8, 5]",
    "problem": "Create a sorted report without sorting the caller\u2019s list.",
    "steps": [
      "Filter by the required minimum.",
      "Materialize an owned list and sort it.",
      "Compare the original ordering."
    ],
    "limit": "Executed using native Dart SDK3.13.7 in an isolated process without network. This fixture verifies the shown language behavior; production Flutter integration still requires platform tests.",
    "mistakes": [
      "Sorting a shared input mutates caller state. Copy when the contract promises a read-only calculation.",
      "Forcing map lookup assumes key presence. Choose and test an absence policy."
    ],
    "takeaways": [
      "Specify lazy versus materialized results.",
      "Preserve caller ownership across reusable APIs."
    ],
    "practice": [
      "Why call toList before sorting a filtered report?|To own a sortable result list|To encrypt the rows~Materialization is not encryption.|To make all nested objects immutable~It is not a deep freeze.|To require a network request~The operation is local.|The report can reorder its own list rather than the caller\u2019s collection.",
      "A map key is absent. What does ordinary lookup commonly return?|null|null is impossible~Missing keys are a normal map case.|An automatically inserted value~Lookup does not generally insert.|The previous key\u2019s value~Keys do not fall back that way.|Handle absence according to the map contract.",
      "A report filters3,8,5 at minimum5 and sorts ascending. Which output results?|5,8|3,5,8~Three fails the threshold.|8,5~That is the unsorted filtered order.|5 only~Eight also qualifies.|Filtering retains8 and5; ascending sort gives5,8.",
      "A map stores nullable values. What distinguishes missing key from present null?|containsKey|A forced! lookup~That throws for both null outcomes.|Changing the binding to final~That does not reveal membership.|Calling map.toString twice~String rendering is not the membership API.|Membership and value nullability are distinct facts.",
      "A helper sorts its List parameter directly. Which promise would it violate?|That the input ordering is preserved|That integers support comparison~Those operations are supported by the declared language types.|That the helper has parameters~This property is explicitly supported by the stated language contract.|That the result is local~A local function can mutate shared objects.|Sorting changes the passed list object.",
      "Why expose a threshold as a named argument?|Its role is explicit at the call site|It becomes a compile-time constant~Named arguments can be runtime values.|It cannot be invalid~Validation remains necessary.|It forces eager collection evaluation~Parameter syntax does not choose laziness.|Naming communicates what the numeric control means."
    ],
    "formal": [
      "What contract should an API document when returning Iterable instead of a snapshot?|Possible lazy re-evaluation|Guaranteed deep copying~Iterable does not imply a copy.|Guaranteed network isolation~The return type does not enforce it.|Guaranteed one-time evaluation~Repeated iteration can rerun work.|Consumers need to know when transformations execute.",
      "Which operation answers whether a Dart map contains a specific key?|containsKey|isNotEmpty~That only says some entry exists.|values.first~That reads an arbitrary first value.|length.isEven~Parity does not identify a key.|ContainsKey tests membership for the requested key.",
      "A helper selects amounts at least6 from4,9,6,9, materializes and sorts them. What sum and count result?|24 and3|28 and4~Four is excluded.|15 and2~Both repeated9 values remain.|18 and2~Six also qualifies.|9+6+9=24 and filtering preserves duplicate rows.",
      "A dashboard must sort a report, preserve source order and retain two equal-price line items. Which transformation fits?|Filter into a new list then sort that list|Sort the source and convert to a set~That mutates order and loses duplicate values.|Convert to a set before copying~That removes legitimate duplicate rows.|Return the same source reference with a final binding~That supplies no ownership boundary.|A list preserves multiplicity and copying isolates list-level sorting.",
      "A nullable map has key a mapped to null and no key b. Which pair of containsKey results occurs?|true then false|false then false~Stored null does not mean missing key.|true then true~Key b is absent.|false then true~That reverses membership.|ContainsKey observes keys independently from their values.",
      "A report API returns a copied list of mutable Invoice objects. A caller changes one Invoice amount. What guarantee remains valid?|Outer order isolated; nested values shared|Every invoice was deep-copied~List materialization copies references.|No mutation can occur through any reference~Other references may exist.|The copied list must automatically re-sort~Lists do not reactively sort themselves.|List ownership and element ownership are separate contracts.",
      "A daily ledger must preserve duplicates, fix values at cutoff, sort independently and expose a required validated cutoff. Which design meets all constraints?|Validate cutoff; own row values; sort the copy|Return a lazy iterable over live mutable rows~Values can drift after cutoff.|Use a set of row amounts and sort the source~That loses duplicates and mutates source order.|Keep the source list final and rename it snapshot~A name and stable binding do not copy data.|Snapshot value ownership, list multiplicity and explicit input validation are all needed.",
      "A typed API requires a minimum integer but receives a negative one that violates policy. Which check is still needed?|Domain range validation|Replacing List with dynamic~That removes useful checks.|Making the result lazy~That does not validate input.|Calling containsKey on the integer~That is not an integer operation.|Static types establish shape, not every domain constraint."
    ],
    "lang": "dart",
    "formal_code": {},
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
    "id": "dart-immutable-models",
    "title": "Build valid class instances and immutable snapshots",
    "comps": [
      "m3.c1"
    ],
    "intro": "Classes combine data and behavior under a named contract. A constructor should establish invariants that every method can rely on. For mobile domain data, immutable values simplify reasoning about state transitions because an update becomes a new value rather than an invisible change to a shared object.",
    "sections": [
      [
        "Mechanism and terminology",
        "Fields declared final cannot be rebound after initialization, but referenced collections still need ownership decisions. A constructor can take a defensive list copy and expose an unmodifiable view or snapshot. These choices protect outer structure; mutable objects inside the list require separate copying or immutable element models.",
        "Named constructors communicate creation modes, while factory constructors can validate, cache or select an implementation. A const constructor permits constant instances when its invocation and fields meet constant rules; it does not require every instance to be created at compile time. Keep validation rules visible rather than relying on constructor naming alone."
      ],
      [
        "Apply and verify",
        "An order snapshot should retain the submitted quantities even when a caller edits its original draft. Copying at construction is a clear boundary. An app can then keep the editable draft separate from a submitted immutable representation and compare explicit revisions during synchronization.",
        "The fixture stores a defensive unmodifiable list of integers. After the caller appends another amount, the order total remains unchanged. It proves outer collection ownership for immutable integer elements, not a general deep copy of arbitrary mutable object graphs."
      ]
    ],
    "code": "class Order {final List<int> amounts;Order(List<int> input):amounts=List.unmodifiable(input);int get total=>amounts.fold(0,(a,b)=>a+b);}void main(){final draft=[4,6];final order=Order(draft);draft.add(9);print(order.total);print(draft.length);}",
    "expect": "10\n3",
    "problem": "Create an order snapshot independent of later draft list edits.",
    "steps": [
      "Copy the supplied amounts into an unmodifiable list.",
      "Append to the original draft.",
      "Read the snapshot total and draft length."
    ],
    "limit": "Executed using native Dart SDK3.13.7 in an isolated process without network. This fixture verifies the shown language behavior; production Flutter integration still requires platform tests.",
    "mistakes": [
      "Storing a caller-owned list directly in a final field preserves a mutation path. Copy at the ownership boundary.",
      "Calling an outer list immutable does not establish immutable nested elements. Model nested values deliberately."
    ],
    "takeaways": [
      "Constructors should establish invariants.",
      "Defensive copying defines snapshot ownership."
    ],
    "practice": [
      "What should a constructor establish?|A valid initial instance state|A guarantee that every future method succeeds~Runtime operations can still fail.|Automatic persistence to disk~Constructors do not imply storage.|A new isolate per field~Fields do not create isolates.|Construction is an invariant boundary.",
      "A snapshot copies amounts4 and6, then the source receives9. What is the snapshot sum?|10|19~The new source element is not in the snapshot.|9~That is only the appended element.|3~That is the source length.|The copied values remain4 and6.",
      "Does final List<int> alone prevent add on a mutable list?|No|Yes for every list~Final restricts binding reassignment.|Only on Android~This is a language ownership issue.|Only when length is even~Parity does not control mutability.|A mutable object can be changed through a final reference.",
      "When can a const constructor be invoked without creating a compile-time constant expression?|An ordinary non-const invocation|Never~Const constructors also support ordinary invocation.|Only when all fields are dynamic~Dynamic is not required.|Only after the object becomes nullable~Nullability is unrelated.|A const constructor permits constant construction but does not force every use to be constant.",
      "What remains mutable in an unmodifiable list of mutable customer objects?|Shared customer objects|The list length through add~The list rejects structural mutation.|Every final binding~Final bindings still cannot be reassigned.|Nothing under any alias~Nested objects may be shared.|Outer structure and element mutability differ.",
      "A submitted order must not follow draft edits. Which boundary matters?|Copy or otherwise own the submitted values|Rename draft to submitted~Names do not change aliasing.|Store the draft in a final field without copying~The object remains shared.|Read the same draft later~That follows later edits.|An owned snapshot separates submission from editing."
    ],
    "formal": [
      "What does a Dart class constructor primarily initialize?|An instance and its fields|Every future network response~Construction cannot control remote data.|A mandatory Flutter widget tree~Classes need not be widgets.|Only global variables~Constructors initialize instances.|Constructors define valid instance creation.",
      "What does a defensive list copy separate?|Outer list ownership|Every nested object automatically~Copies can retain element references.|All persistence transactions~A local copy does not commit data.|All concurrent processes~A list copy is not process coordination.|A new list isolates list-level edits.",
      "A snapshot copies2,5,7 and the source removes5. What total does the snapshot retain?|14|9~That is the changed source total.|7~That is only one element.|12~The snapshot still has all three values.|2+5+7=14 at the snapshot boundary.",
      "An order constructor stores List.unmodifiable(input), whose elements are mutable Item objects. A caller edits an Item price. Which guarantee was insufficient?|Outer protection still shares mutable items|The constructor never executes~This property is explicitly supported by the stated language contract.|Final automatically deep-copies elements~It does not.|Unmodifiable always sorts by price~It does not sort.|Deep snapshot requirements must cover element ownership too.",
      "A model requires nonnegative quantities but its constructor accepts -3. Which change addresses the actual invariant?|Reject invalid quantities|Make the field final only~Final preserves an invalid value just as well.|Rename the constructor valid~Names do not enforce rules.|Wrap the object in a list~That does not change quantity validity.|Type and binding guarantees do not substitute for domain validation.",
      "A submitted cart copies integer amounts6 and8, while a draft replaces8 with1 and adds3. Which totals are snapshot and draft?|14 and10|10 and10~The snapshot is independent.|14 and17~The draft replaced8 instead of retaining it.|10 and14~That swaps the lifetimes.|Snapshot6+8=14; draft6+1+3=10.",
      "A checkout model must preserve a submitted revision, prohibit collection edits, and prevent caller edits to mutable line objects from changing totals. Which design meets all three?|Revisioned immutable lines in an owned list|Store a final alias to the caller\u2019s mutable list~Both structure and element changes remain shared.|Only wrap the original mutable line objects in an unmodifiable outer list~Element edits still leak.|Make the total getter read the live draft each time~That violates submitted revision stability.|The snapshot must protect both outer structure and nested values and identify its revision.",
      "Why keep editable drafts separate from submitted snapshots?|They have different mutation and ownership contracts|Because final fields cannot hold numbers~Concrete typed implementations can support this operation.|Because classes always require databases~They do not.|Because a const constructor performs network validation~It does not.|Distinct models expose distinct lifetimes."
    ],
    "lang": "dart",
    "formal_code": {},
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
    "id": "dart-abstract-contracts",
    "title": "Program to abstract contracts with deliberate mixins",
    "comps": [
      "m3.c2"
    ],
    "intro": "An abstract class describes a capability or family of objects without requiring every consumer to know the implementation. A mixin contributes reusable instance behavior. Their roles overlap in syntax but differ in design: substitutable contracts help testing, while mixins reuse implementation across suitable hosts.",
    "sections": [
      [
        "Mechanism and terminology",
        "Abstract methods declare behavior that concrete implementations must provide. Consumers can accept the abstraction and work with an in-memory fake during testing or a real service in an application. A valid substitute must preserve semantic promises such as ordering, error policy and ownership, not only match method names.",
        "A mixin can reuse methods and fields across classes. When its behavior assumes host capabilities, constrain those assumptions through an appropriate on clause or explicit abstract members. Avoid mixins that quietly depend on unrelated global state; reuse that hides dependencies makes lifecycle and testing harder to reason about."
      ],
      [
        "Apply and verify",
        "A pricing service can consume a TaxPolicy abstraction so test cases choose a deterministic policy without contacting a remote service. A reusable formatting or counting behavior may fit a mixin if the host contract is clear. Do not use inheritance merely because two classes have one similar field.",
        "The native fixture implements a small policy and applies a mixin that exposes an operation. It executes ordinary Dart dispatch. It does not establish remote tax correctness or prove that every implementation satisfies the domain\u2019s legal and business requirements."
      ]
    ],
    "code": "abstract class Fee {int add(int x);}mixin Label {String label()=>\"quoted\";}class Flat extends Fee with Label {@override int add(int x)=>x+3;}void main(){Fee f=Flat();print(f.add(7));print((f as Flat).label());}",
    "expect": "10\nquoted",
    "problem": "Use abstract dispatch and an independent mixin.",
    "steps": [
      "Define the fee capability.",
      "Implement it and reuse a label method.",
      "Call through the abstraction and inspect the reused behavior."
    ],
    "limit": "Executed using native Dart SDK3.13.7 in an isolated process without network. This fixture verifies the shown language behavior; production Flutter integration still requires platform tests.",
    "mistakes": [
      "Matching method signatures alone does not establish substitutability. Test shared semantic contracts.",
      "Adding a mixin with hidden global dependencies spreads coupling. Make host requirements explicit."
    ],
    "takeaways": [
      "Abstract contracts separate consumers from implementations.",
      "Mixins reuse behavior under explicit host assumptions."
    ],
    "practice": [
      "Can an abstract Dart class be instantiated directly?|No|Yes without implementing abstract members~It is abstract.|Only when its name is short~Naming length is irrelevant.|Only in an async function~Async does not remove abstraction.|Use a concrete implementation.",
      "What does a mixin primarily contribute?|Reusable instance behavior|An automatic network connection~Mixins do not imply networking.|A mandatory database table~Persistence is unrelated.|Compile-time execution of every method~Ordinary methods run at runtime.|A mixin supplies behavior to suitable classes.",
      "A Fee policy adds3 to an input7. What result follows through abstract dispatch?|10|7~The concrete implementation adds3.|3~That ignores the input.|ERROR~A concrete implementation can be called through an abstraction.|Dispatch invokes the implemented operation.",
      "A fake repository returns rows in reverse order while the contract promises ascending order. Is signature matching enough?|No, the semantic ordering promise also matters|Yes because all lists are interchangeable~Order is part of the promised behavior.|Yes if the fake is shorter~Code length is irrelevant.|No because fakes can never implement abstractions~They can when they preserve the contract.|Substitution includes behavioral guarantees.",
      "When should host requirements of a mixin be explicit?|When reused methods rely on host capabilities|Only after production failure~Dependencies should be designed beforehand.|Never because mixins remove dependencies~They do not.|Only when the app has no classes~Mixins apply to classes.|Constraints and abstract members can expose assumptions.",
      "Why inject a policy abstraction in tests?|Inject a deterministic fake|Avoid every runtime error forever~Tests cannot promise that.|Erase all types~Abstraction preserves a typed boundary.|Make all pricing rules legally correct~That needs domain verification.|A controlled implementation isolates the consumer behavior."
    ],
    "formal": [
      "What is an abstract method declaration used for?|Required concrete behavior|A method that can never be called~Concrete implementations are callable.|A mandatory global variable~Methods are not globals.|A replacement for every constructor~Constructors remain needed.|It declares a contract without supplying that implementation.",
      "Which Dart feature is intended for reusable behavior across suitable classes?|mixin|nullable marker~That adds nullability.|await~That sequences an async result.|const literal~That creates a constant value.|Mixins are a language reuse mechanism.",
      "A policy returns base+fee with fee4. Two inputs6 and9 are quoted. What is their total?|23|15~That omits both fees.|19~That applies the fee only once.|27~That applies an extra fee.|For the stated inputs, (6+4)+(9+4)=23.",
      "A repository contract promises snapshot results and ascending ids. An implementation returns a live mutable collection in descending order. Which tests should reject it?|Ownership and ordering tests|Only constructor-name tests~Names do not establish behavior.|Only whether the class uses a mixin~That does not prove these promises.|No tests because the type is correct~Types do not cover all semantics.|Both independent contract promises are violated.",
      "A mixin computes total using host.items and assumes every item is validated. Which redesign makes reuse safer?|Declare and test validated host capabilities|Read an unrelated mutable global items list~That hides ownership.|Cast every host to dynamic~That defers missing-member failures.|Catch all failures and return a successful charge~That hides invalid state.|Explicit requirements make the dependency reviewable.",
      "A fee implementation adds2 per request, while another adds5 once per batch. A consumer assumes per-request fees on3 requests with base4 each. Which total matches its contract for the first implementation?|18|17~That applies a single5 batch fee instead.|14~That adds2 only once.|12~That omits fees.|Three requests each cost4+2, so18.",
      "A checkout needs interchangeable offline and online pricing policies, deterministic tests and a shared audit-label method without global state. Which design satisfies the constraints?|Inject a contract; reuse an explicit label mixin|Put all policies in a global dynamic map and read whichever exists~That hides selection and weakens checking.|Inherit from an unrelated widget only for its label~That couples domain policy to UI lifetime.|Declare one abstract policy and instantiate it directly~Abstract classes cannot be directly instantiated.|Separate contract, implementation selection and narrow behavior reuse.",
      "What should a reviewer verify when replacing one implementation behind an abstract type?|Preservation of behavioral promises|Only identical source length~Length does not establish substitution.|Only the same private field names~Consumers depend on the public contract.|Only that both classes have constructors~That is insufficient.|Preserve semantics as well as compatible signatures."
    ],
    "lang": "dart",
    "formal_code": {},
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
    "id": "dart-class-state-transitions",
    "title": "Model revisions through explicit immutable transitions",
    "comps": [
      "m3.c1",
      "m3.c2"
    ],
    "intro": "Immutable models turn an edit into creation of a new instance. A transition method can preserve identity and revision while changing only permitted values. This makes state changes inspectable and avoids a consumer seeing half of a multi-field update through shared mutable references.",
    "sections": [
      [
        "Mechanism and terminology",
        "A copy-style method is an application convention rather than an automatic guarantee of deep copying. Decide what omitted parameters mean, especially when a field may intentionally be set to null. A nullable parameter with ?? fallback cannot distinguish omitted input from an explicit request to clear a nullable field without another sentinel or representation.",
        "An abstract store contract can define how revisions are saved. If concurrent edits matter, include expected-revision checking at the durable storage boundary. An immutable client value does not by itself prevent a server from accepting a stale write or guarantee atomicity across multiple devices."
      ],
      [
        "Apply and verify",
        "For an offline inventory editor, compute the next local model without mutating the displayed old model. Send the expected revision with the write and reconcile a conflict explicitly. Keep the user\u2019s unsaved draft separate from the last confirmed server snapshot so a rejected write does not falsely appear confirmed.",
        "The fixture creates a new counter value with a higher revision and prints both old and new states. It demonstrates local transition semantics only. Durable conflict detection, database transactions and Android or Flutter rendering are outside the executed program."
      ]
    ],
    "code": "class Stock {final int units,rev;const Stock(this.units,this.rev);Stock remove(int n){if(n<0||n>units)throw ArgumentError();return Stock(units-n,rev+1);}}void main(){const old=Stock(9,2);final next=old.remove(4);print(\"${old.units}:${old.rev}\");print(\"${next.units}:${next.rev}\");}",
    "expect": "9:2\n5:3",
    "problem": "Produce an inventory revision without mutating the previous value.",
    "steps": [
      "Validate the requested removal.",
      "Create a new value with reduced stock and incremented revision.",
      "Print both instances to confirm the old value remains intact."
    ],
    "limit": "Executed using native Dart SDK3.13.7 in an isolated process without network. This fixture verifies the shown language behavior; production Flutter integration still requires platform tests.",
    "mistakes": [
      "A copy method that reuses mutable nested objects can still share changes. Review nested ownership.",
      "Immutable client objects do not solve concurrent server updates. Enforce revision policy where writes commit."
    ],
    "takeaways": [
      "Transitions should preserve explicit invariants.",
      "Local immutability and durable concurrency are different guarantees."
    ],
    "practice": [
      "What does an immutable transition normally return?|A new model value|A mutation of every old reference~Old values should remain stable.|An automatic database commit~Local construction does not persist.|A mandatory new isolate~Object construction is not isolate creation.|An update creates a distinct value.",
      "Stock9 at revision2 removes4. What new pair results?|5 at revision3|5 at revision2~The transition increments revision.|13 at revision3~Removal subtracts4.|9 at revision3~The quantity changes.|For the stated inputs, 9-4=5 and2+1=3.",
      "Does local immutability prevent two devices overwriting the same server revision?|No|Yes without server checks~Both can still send stale writes.|Only when fields are final~Final does not coordinate devices.|Only when values are integers~Value type does not solve remote concurrency.|The write boundary needs a concurrency policy.",
      "Why is value??oldValue insufficient for clearing an optional field?|Null and omission are conflated|Null always means a new empty string~There is no such rule.|Optional fields cannot be cleared~They can with an explicit contract.|Copy methods always deep-copy~That is not guaranteed.|A sentinel or distinct update representation can express clearing.",
      "A removal exceeds available stock. Which transition behavior protects the invariant?|Reject before creating the new valid state|Allow negative stock silently~That violates the stated invariant.|Increment revision without changing units and claim success~That misrepresents the operation.|Reuse an unrelated customer\u2019s stock~That violates ownership.|Validate preconditions before producing the accepted transition.",
      "Why keep unsaved and confirmed snapshots separate?|A rejected write must not appear confirmed|Immutable values cannot be shown in UI~Concrete typed implementations can support this operation.|All writes are guaranteed to succeed~They are not.|Revision numbers automatically authorize users~They do not.|State should reflect the actual confirmation boundary."
    ],
    "formal": [
      "What does a revision field help identify?|A particular state version|An authorization principal by itself~A revision is not identity.|A guaranteed network connection~Versioning does not connect.|A compile-time constant timestamp~Revisions can be runtime values.|It supports explicit version reasoning.",
      "What is a copy-style method not guaranteed to do automatically?|Deep-copy every nested object|Return an object when implemented that way~It can do that.|Use parameters~It may use parameters.|Preserve fields intentionally~Its implementation can preserve them.|Deep ownership depends on the implementation.",
      "A stock model starts units12,rev5. Sequential valid removals3 and2 each increment revision. What state results?|7,rev7|7,rev6~There were two transitions.|9,rev7~That ignores the second removal.|17,rev7~Removal does not add stock.|For the stated inputs, 12-3-2=7 and5+2=7.",
      "Two clients read server revision4 with stock10 and each remove7. Why must the server check expected revision atomically?|Both writes rely on the same stale version|Final client fields automatically reject the second request~They do not coordinate the server.|A revision is equivalent to a permission grant~It is not authorization.|The second request must always contain a syntax error~It can be well formed but stale.|A commit-time compare prevents both writes being accepted against the same prior version.",
      "A copy helper uses newNickname??oldNickname. The old nickname is Lee and the caller supplies null to clear it. What result follows?|Lee remains|The field clears~Null selects the fallback.|A compile-time constant is created~The expression has no such effect.|The revision is always reset~No revision rule is shown.|This API conflates explicit clearing with omission.",
      "An old model has units8 and revision1. remove(0) is valid and increments revision. Then remove(3) occurs. What final state follows under that stated policy?|5 at revision3|5 at revision2~The zero removal still counts as a transition under the stated policy.|8 at revision3~The second removal changes units.|11 at revision3~Removal subtracts.|Two accepted transitions increment twice, leaving8-0-3=5.",
      "An offline editor must retain the confirmed snapshot, allow a nickname to be cleared and reject stale saves. Which design meets all requirements?|Separate draft, clear-intent and commit revision|Use one shared mutable model and interpret every null as unchanged~That loses clearing and confirmed-state separation.|Use final fields only and omit server revision checks~Final does not prevent stale server writes.|Increment local revision and mark every request successful before response~That invents confirmation.|The requirements span value representation, UI state ownership and durable concurrency.",
      "What must accompany revision checks for protected records?|Actor-and-record authorization|Only a matching revision number~Knowing a revision does not grant access.|A shorter class name~Naming is unrelated.|A const constructor~Construction mode does not authorize writes.|Concurrency control and access control solve different requirements."
    ],
    "lang": "dart",
    "formal_code": {},
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
    "id": "dart-future-sequencing",
    "title": "Sequence dependent Futures and overlap independent work",
    "comps": [
      "m4.c1"
    ],
    "intro": "A Future represents a value or error that becomes available later. An async function returns a Future and await suspends that function until the awaited result settles. This supports readable dependency ordering without implying that CPU work automatically moves to another isolate.",
    "sections": [
      [
        "Mechanism and terminology",
        "Await a dependency before using its result. For independent operations, start both before awaiting their combined results when the resource budget permits. Sequential awaiting of two independent delayed operations adds their waits; concurrent starts can overlap waits, but actual duration depends on scheduling, service behavior and resource contention.",
        "The event loop allows other queued work while an async operation is suspended. A long synchronous computation can still block an isolate. Use isolates or an appropriate architecture for expensive CPU work rather than adding async to a function declaration and assuming it becomes parallel."
      ],
      [
        "Apply and verify",
        "A profile screen may fetch an account and settings independently, then merge them after both complete. A request for an account-specific balance depends on the validated account id and must not begin using a guessed or stale id. Draw the dependency graph before choosing await placement.",
        "The fixture creates two futures, waits for both, and sums their results in input order. It verifies native Future composition with deterministic values. It does not measure production latency, demonstrate parallel CPU execution or call a remote service."
      ]
    ],
    "code": "Future<int> price(int x) async=>x;Future<void> main() async {final values=await Future.wait([price(4),price(7)]);print(values.fold<int>(0,(a,b)=>a+b));}",
    "expect": "11",
    "problem": "Combine independent future values.",
    "steps": [
      "Start both price operations.",
      "Await their combined completion.",
      "Sum the ordered results."
    ],
    "limit": "Executed using native Dart SDK3.13.7 in an isolated process without network. This fixture verifies the shown language behavior; production Flutter integration still requires platform tests.",
    "mistakes": [
      "Adding async does not move synchronous CPU work off the isolate. Measure and choose appropriate concurrency.",
      "Starting dependent requests before their identifiers are validated can use stale identity. Respect the dependency graph."
    ],
    "takeaways": [
      "Future completion carries a value or error.",
      "Overlap only work that is actually independent."
    ],
    "practice": [
      "What does a Future represent?|A later value or error|A guaranteed background thread~Futures do not imply threads.|A permanently synchronous integer~Completion can be deferred.|A mandatory network request~Futures can complete locally.|A future models asynchronous completion.",
      "A Dart function awaits a pending account Future before using its result. Which execution path pauses while other ready events may still run?|The awaiting function continuation|The isolate’s entire event queue~Await permits other ready work to run on the event loop.|All pending Futures globally~Other asynchronous operations can continue independently.|The completed Future’s stored result~Suspension concerns function execution rather than changing a stored result.|Execution after the await resumes when that Future settles; awaiting does not suspend the entire isolate or unrelated asynchronous work.",
      "Independent waits take40ms and60ms under ideal overlap. What lower-bound combined wait is expected after starting both together?|60ms|100ms~That is sequential addition.|20ms~Overlap does not subtract durations.|0ms~Both operations still need to finish.|The slower operation determines ideal combined completion.",
      "A balance request needs a validated account id from a profile Future. What must happen first?|Await and validate the profile id|Start balance with a guessed id~That violates the dependency.|Mark the balance method async only~The modifier does not supply the id.|Use the prior user\u2019s id~That crosses identity ownership.|Dependent work must wait for its valid input.",
      "Does an async declaration automatically make a long loop parallel?|No|Yes on every platform~Async does not create an isolate.|Only if the loop has integers~Element types do not create parallelism.|Only if the function returns Future<void>~Return type does not move CPU work.|Synchronous work still executes on the current isolate unless explicitly moved.",
      "Future.wait receives futures producing4 and7. What sum follows after successful completion?|11|47~The integers are added, not concatenated.|7~Both results are retained.|0~Successful futures contain actual values.|The result list can be aggregated after completion."
    ],
    "formal": [
      "What does an async Dart function return?|A Future|Always a Stream~Streams represent sequences of events.|Always a new isolate~Async does not create one.|Only a compile-time constant~Async work occurs at runtime.|Async functions expose completion through a Future.",
      "Which construct consumes a Future result in sequential async code?|await|yield alone~Yield belongs to generators.|mixin~Mixins reuse class behavior.|const~Const concerns compile-time values.|Await resumes with the completed value or throws its error.",
      "Independent operations take80ms and120ms with no contention. Starting both before awaiting saves how much ideal wait compared with sequential execution?|80ms|120ms~Sequential200 minus concurrent120 is80.|200ms~That is the sequential total.|0ms~Independent waits can overlap.|200-120=80ms under the stated ideal assumptions.",
      "A workflow loads id in30ms, then balance in70ms, while unrelated settings takes50ms. All begin as early as dependencies allow. What is the ideal completion time?|100ms|150ms~Settings can overlap the dependent chain.|70ms~Balance cannot start before the id.|50ms~The id/balance chain is longer.|The critical path is30+70=100ms, larger than settings50ms.",
      "A list contains futureA producing2 after30ms and futureB producing9 after10ms. After Future.wait, what is the ordered value list?|2,9|9,2~The list preserves input future order, not completion order.|2 only~Both successful futures are represented.|11~Wait returns a list, not an automatic sum.|Result positions correspond to input positions.",
      "A screen freezes during a500ms synchronous parser inside an async function before its first await. Which diagnosis and remedy fit?|CPU still blocks; evaluate an isolate|Await automatically makes the parser parallel, so the freeze is impossible~Async does not guarantee offloading.|Add more final declarations~Binding stability does not schedule work.|Start another identical parser on the same isolate~That adds work rather than removing blocking.|Choose concurrency appropriate to CPU work and measure serialization overhead.",
      "A checkout needs a validated account from a40ms operation, account-specific limits in60ms, and independent catalog data in80ms; it must never use another account and has budget for two concurrent requests. Which schedule meets the constraints and minimizes ideal latency?|Account+catalog, then limits:100ms|Start limits with a cached prior account and finish in80ms~That violates identity correctness.|Run all three sequentially for180ms~Correct ordering is possible but unnecessarily serializes catalog.|Start three requests together using an unvalidated id~That violates both dependency and stated concurrency budget.|The dependent chain is100ms while catalog overlaps within the two-request budget.",
      "What can a Future complete with besides a value?|An error|Only a widget~Futures are not restricted to widgets.|Only null regardless of type~Type contracts still apply.|Only a database row~Futures are general.|Async callers need an error policy as well as a success path."
    ],
    "lang": "dart",
    "formal_code": {},
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
    "id": "dart-stream-events",
    "title": "Consume event sequences with explicit stream lifetimes",
    "comps": [
      "m4.c1",
      "m4.c2"
    ],
    "intro": "A Stream delivers a sequence of asynchronous events rather than one completion value. Data events may be followed by more data, errors or completion. This makes streams suitable for updates and incremental results, provided the consumer owns its subscription and understands the source\u2019s delivery semantics.",
    "sections": [
      [
        "Mechanism and terminology",
        "Use await for to process events sequentially in an async function. An async* generator produces a stream with yield. A single-subscription stream normally allows one listener over its lifetime; a broadcast stream supports multiple listeners under its documented behavior and does not automatically replay all prior events.",
        "A subscription has a lifetime. Cancel it when its owner no longer needs updates, and define how errors are reported. Pausing a subscription does not automatically guarantee that every upstream source stops producing or that memory stays bounded; buffering and backpressure depend on the source and protocol."
      ],
      [
        "Apply and verify",
        "An order-status screen should stop listening when its state owner is disposed or switches orders. Tag or scope updates to the current order so delayed events from the old subscription do not replace the new state. If history is required after reconnect, add durable replay or a resynchronization query rather than assuming a broadcast channel stores events.",
        "The fixture generates three integer events and consumes them with await for. It proves sequential generator consumption and accumulation in native Dart. No network, device sensor or infinite stream is used, so tests for disconnection, cancellation and resource use remain necessary for those integrations."
      ]
    ],
    "code": "Stream<int> events() async* {yield 2;yield 5;yield 3;}Future<void> main() async {var total=0;await for(final n in events()){total+=n;}print(total);}",
    "expect": "10",
    "problem": "Aggregate a finite asynchronous event stream.",
    "steps": [
      "Create an async* generator.",
      "Consume each yielded value with await for.",
      "Print after stream completion."
    ],
    "limit": "Executed using native Dart SDK3.13.7 in an isolated process without network. This fixture verifies the shown language behavior; production Flutter integration still requires platform tests.",
    "mistakes": [
      "Assuming broadcast means replay can lose required history. Design replay explicitly.",
      "Leaving subscriptions alive after ownership changes can leak resources and apply stale events. Cancel or scope them."
    ],
    "takeaways": [
      "A stream models many events.",
      "Subscription ownership and replay policy must be explicit."
    ],
    "practice": [
      "Which Dart syntax declares an asynchronous generator?|async*|async alone~Async alone returns a Future.|const~Const does not generate events.|late~Late concerns initialization.|Async* supports yielding stream events.",
      "What does await for consume?|A Stream|Only a synchronous int~Integers are not event sequences.|Only an abstract class~Abstraction is unrelated.|A mandatory operating-system thread~Streams do not require one.|Await for iterates asynchronous stream events.",
      "A stream yields2,5,3 and totals them. What result follows at completion?|10|3~That is only the final event.|25~The code adds, not concatenates.|0~The loop consumes events.|For the stated inputs, 2+5+3=10.",
      "Does a broadcast stream automatically replay every event to late listeners?|No|Yes because broadcast means storage~Broadcast concerns multiple listeners.|Only when the listener uses final~Binding syntax does not enable replay.|Only for integer events~Event type does not establish replay.|Historical delivery requires an explicit source contract.",
      "Who should cancel a no-longer-needed subscription?|Its lifecycle owner|An unrelated screen chosen randomly~Ownership should be explicit.|The type checker at runtime~Static analysis is not resource cleanup.|Nobody because streams always stop instantly~Sources may be long lived.|Tie resource lifetime to the consumer that requested it.",
      "Why can pausing be insufficient for a bounded-memory guarantee?|The source may continue and buffer events|Pause always writes events to disk~There is no universal disk behavior.|Every stream has infinite memory~Resources are finite.|Pausing converts events to constants~It does not.|Backpressure depends on source and protocol behavior."
    ],
    "formal": [
      "Which keyword emits an event from an async* generator?|yield|await by itself~Await consumes a completion rather than emitting an event.|required~That marks a parameter contract.|implements~That declares a class relationship.|Yield supplies generator output.",
      "What does a single-subscription stream normally permit?|One listener over its lifetime|Unlimited simultaneous listeners by default~That is not its subscription contract.|No events~It can emit many events.|Automatic replay to every new listener~That is not promised.|Choose broadcast deliberately when multiple listeners are required.",
      "A stream yields4,1,6; a consumer keeps events greater than2 and sums them. What total results?|10|11~One is filtered out.|6~Four also qualifies.|7~That includes1 but omits4.|For the stated inputs, 4+6=10.",
      "A screen switches from orderA to orderB, but a delayedA update arrives. Which design prevents stale display and resource leakage?|Cancel old listener; guard current order id|Accept whichever event arrives last regardless of id~Arrival time does not prove ownership.|Keep both forever and overwrite one shared value~That leaks work and mixes identities.|Use a final binding for the stream alone~That does not manage its subscription.|Cancellation and identity checks address both lifetime and delayed delivery.",
      "A producer emits200 events/s while a consumer processes120 events/s and the system buffers every excess event. How many events accumulate over5s from an empty queue?|400|80~That is one second\u2019s excess.|600~That is consumed count over five seconds.|1000~That is total produced, not backlog.|For the stated inputs, (200-120)*5=400.",
      "A late subscriber to a non-replaying broadcast source joins after three events and receives two subsequent events. How many of those five events are delivered to it under this contract?|2|5~Earlier events are not replayed.|3~That counts the missed history.|0~It receives subsequent live events.|Broadcast delivery does not imply historical storage.",
      "A live stock feed must support late subscribers, bounded memory and recovery after disconnection. Which design meets those constraints better than a raw broadcast stream?|Bounded scoped feed plus versioned resync|Assume broadcast automatically stores unlimited history~It does not and unlimited storage conflicts with bounded memory.|Pause every listener forever and keep all events in RAM~That grows without bound.|Drop all old events without any version or snapshot mechanism~A reconnecting consumer cannot establish complete state.|Delivery, capacity and recovery require explicit coordinated contracts.",
      "What should stream consumers define besides data handling?|Error and completion policies|Only variable naming~Names do not handle source failures.|Only whether integers are even~Parity is unrelated.|Only an app icon~Presentation does not own stream recovery.|Streams can fail or finish as well as emit values."
    ],
    "lang": "dart",
    "formal_code": {},
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
    "id": "dart-async-recovery",
    "title": "Handle asynchronous errors without inventing success",
    "comps": [
      "m4.c2"
    ],
    "intro": "Async errors need an explicit owner. A try/catch around an awaited Future can handle its failure; a try block that merely starts work may finish before the future fails. Recovery should preserve what is known about the operation instead of turning every failure into an apparently successful default.",
    "sections": [
      [
        "Mechanism and terminology",
        "Place await inside the try block whose catch owns the failure. Use finally for cleanup that must occur after success or failure, and avoid cleanup code that unintentionally hides the original exception. A failed read can often be retried; a write with uncertain outcome may already have committed and needs an idempotency or reconciliation strategy.",
        "A timeout limits how long a caller waits for a result. It does not by itself prove that underlying work was cancelled or rolled back. An application must ignore stale results, cancel through a supported operation contract when available and distinguish local waiting policy from remote side-effect completion."
      ],
      [
        "Apply and verify",
        "For a payment screen, a lost response must not immediately trigger an unkeyed duplicate charge. Retain an operation identifier, reconcile status and retry only under an idempotent server contract. For a read-only profile request, bounded retry with observable failures may be appropriate, but stale responses should still be scoped to the current request.",
        "The fixture awaits a failing local Future, catches a typed error and executes cleanup in finally. It verifies actual exception flow in native Dart. It does not simulate payment infrastructure, prove remote cancellation or establish a production retry policy."
      ]
    ],
    "code": "Future<int> load() async {throw StateError(\"offline\");}Future<void> main() async {try{print(await load());}on StateError{print(\"retryable-read\");}finally{print(\"cleanup\");}}",
    "expect": "retryable-read\ncleanup",
    "problem": "Observe an awaited failure and unconditional cleanup.",
    "steps": [
      "Start and await the failing operation inside try.",
      "Match its StateError handler.",
      "Run finally after handling the failure."
    ],
    "limit": "Executed using native Dart SDK3.13.7 in an isolated process without network. This fixture verifies the shown language behavior; production Flutter integration still requires platform tests.",
    "mistakes": [
      "Catching around an unawaited call can miss its later failure. Attach or await a handler at the owning boundary.",
      "Returning a success value for an uncertain write invents confirmation. Reconcile with the operation contract."
    ],
    "takeaways": [
      "Awaited errors participate in try/catch.",
      "Timeout, cancellation and rollback are distinct."
    ],
    "practice": [
      "Where should await be placed to catch a future\u2019s error with try/catch?|Inside the owning try block|Only after the catch block~That catch no longer owns the await.|Nowhere because futures cannot fail~They can complete with errors.|Inside a const initializer~Async runtime work is not a constant initializer.|The thrown awaited error follows the surrounding exception handling.",
      "What does finally provide?|Cleanup after success or failure|Automatic rollback of any remote operation~Local cleanup does not roll back remote state.|Automatic success conversion~Finally does not establish success.|A new thread for each error~It does not create threads.|Finally executes when control leaves the protected flow.",
      "A request times out locally. What is still possible?|The remote operation may complete|It was necessarily cancelled~Timeout alone does not prove cancellation.|It never started~It may already be running.|It was necessarily rolled back~That needs a remote contract.|Waiting policy and remote outcome differ.",
      "A payment response is lost. Why is a blind unkeyed retry unsafe?|The first attempt may already have charged|The same variable name cannot be reused~Naming is unrelated.|Every retry is guaranteed read-only~A payment write has side effects.|Timeout means no bytes were sent~It does not prove that.|Use idempotency and status reconciliation for uncertain writes.",
      "A catch block returns balance0 for every read failure and labels it verified. What is wrong?|Unknown falsely becomes zero|Zero cannot be an integer~The integer type can represent zero as a valid value.|Catch blocks cannot return values~Concrete typed implementations can support this operation.|Every offline value is necessarily correct~Offline state may be stale or absent.|Preserve unknown or stale status instead of inventing evidence.",
      "A loading flag must reset after both success and error. Which structure fits?|finally|Only the success branch~Failures would leave the flag set.|A const declaration~That does not clean up lifecycle state.|An unrelated map lookup~That does not guarantee reset.|Finally centralizes cleanup for both outcomes."
    ],
    "formal": [
      "What can an awaited failed Future do at the await point?|Throw at the await point|Always return0~No default is implied.|Always restart the program~The caller can handle it.|Automatically become a successful stream~Failure does not change abstraction.|Catch the error at an appropriate owner.",
      "What does a local timeout alone establish?|Only its local waiting deadline elapsed|The server rolled back~That is not established.|The request never reached the server~That is not established.|The operation cannot complete later~It may continue.|Do not infer remote outcome from a waiting deadline.",
      "A read retries after delays100ms then200ms, and each of three attempts takes50ms before failure. What elapsed time is spent before final failure, ignoring overhead?|450ms|300ms~That omits attempt durations.|350ms~That omits two attempt durations.|600ms~The stated delays total300 and attempts150.|For the stated inputs, 3*50+100+200=450ms.",
      "Two save requests share a client entity, but the first result arrives after the second. Which handling preserves current UI state without claiming remote cancellation?|Apply results by current operation version|Always use the last arriving result~Late arrival can be stale.|Assume timeout deleted the first save~Timeout does not establish rollback.|Set every caught failure to saved=true~That invents success.|Result eligibility and remote operation status must be handled explicitly.",
      "A server supports an idempotency key per logical payment. The response to keyK is lost. Which retry preserves the logical operation identity?|Reuse keyK and reconcile status|Generate a fresh key for every timeout~That may create another logical payment.|Remove the key because the first response was lost~That loses deduplication identity.|Mark success locally without consulting status~That invents confirmation.|The same logical operation must retain its idempotency identity under the server contract.",
      "A timeout is300ms, while the remote write commits at500ms after the client stopped waiting. What follows?|Local timeout can precede remote commit|The commit is impossible after timeout~Local waiting does not prove cancellation.|The client necessarily saw the500ms response~It stopped waiting at300ms.|The write must have rolled back at300ms~No rollback contract was given.|Reconciliation is needed because local and remote lifetimes differ.",
      "A checkout must avoid duplicate charges, report uncertain outcomes accurately and clear loading state after all branches. Which design meets all three constraints?|Keyed reconciliation, typed catch and finally|Retry each failure with a new payment key and report success0~That risks duplicates and invents confirmation.|Catch only synchronous invocation and leave the future unobserved~Async errors may escape and loading remains wrong.|Assume timeout cancels the server and immediately offer another charge~That confuses waiting with remote outcome.|The design coordinates error ownership, idempotency, honest state and cleanup.",
      "A stream emits an error during await for inside try. What should the consumer specify?|Source-specific failure and recovery policy|That every error means a successful empty history~That invents data meaning.|That final bindings prevent stream failures~They do not.|That async errors are impossible to catch~They can be handled.|Error recovery must preserve the meaning of the stream\u2019s data."
    ],
    "lang": "dart",
    "formal_code": {},
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
],["variables.md", "built-in-types.md", "functions.md", "collections.md", "classes.md", "mixins.md", "async.md", "error-handling.md"],{repo:'dart-lang/site-www',commit:'fc23978a6dc0cd59a690519c2284e5f5821656f3',base:'src/content/language/',title:'Official Dart language: ',verification:'Pinned official Git bytes read from isolated /tmp/echolens-native-dart-reference. Native language fixtures execute on Dart3.13.7; no Flutter or device integration is asserted.'});
