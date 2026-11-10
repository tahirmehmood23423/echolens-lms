'use strict';
const {bank}=require('../../learning/wave1/web-helper');
module.exports=bank('typescript-fundamentals',[
  {
    "comp": "m1.c1",
    "rows": [
      [
        "Which declaration describes a text result from a numeric input?",
        "function f(x: number): string",
        "function f(x: string): number",
        "function f(x: boolean): void",
        "function f(x: never): never",
        "Parameter and return annotations must match the stated input and output.",
        "The direction is reversed.",
        "The input and output differ.",
        "Never excludes actual permitted inputs."
      ],
      [
        "What does inference use for a local initialized variable?",
        "Its initializer and context",
        "Only the variable’s spelling",
        "Only the file’s line count",
        "Only the current timezone",
        "The checker can infer a type from values and surrounding type context.",
        "Names do not determine values’ types.",
        "Line count is unrelated.",
        "Timezone does not set static types."
      ],
      [
        "What does any generally reduce?",
        "Static checking protection",
        "Runtime memory addresses",
        "HTTP redirect counts",
        "Browser tab lifetimes",
        "Any largely opts out of type checking and can propagate unchecked operations.",
        "It does not relocate memory.",
        "It does not configure HTTP.",
        "It does not control tabs."
      ],
      [
        "A tax helper expects number but a checked caller passes text. What should resolve the mismatch?",
        "Clarify and satisfy the contract",
        "Assert every input as any",
        "Disable all compiler checks",
        "Assume strings are always numbers",
        "The source should deliberately parse or reject text according to the actual contract.",
        "Any hides rather than resolves the mismatch.",
        "Global suppression removes useful evidence.",
        "Not every string is numeric."
      ],
      [
        "A payroll input arrives from JSON and is annotated as Salary. What evidence is still needed?",
        "Runtime data validation",
        "Only the Salary spelling",
        "Only a return annotation",
        "Only a readonly property",
        "External data may violate the claimed static shape and business constraints.",
        "A name does not inspect a payload.",
        "Output annotations do not validate input.",
        "Readonly does not establish input validity."
      ],
      [
        "A finance amount is Infinity despite a number annotation. Which safeguard matters?",
        "Finite business-value checks",
        "Only repeating number twice",
        "Only replacing let with const",
        "Only a template literal",
        "Number includes Infinity, so the business contract needs explicit runtime constraints.",
        "Duplicate annotations do not narrow runtime values.",
        "Const does not ensure finiteness.",
        "Formatting can display invalid amounts."
      ],
      [
        "A logger needs a callback taking Error and returning void. What should its type express?",
        "That input and return contract",
        "Only an arbitrary string key",
        "Only the server’s IP address",
        "Only a generic object value",
        "A callable type should declare the accepted parameter and intended return behavior.",
        "A key is not the callback signature.",
        "Network location does not define typing.",
        "Object alone does not describe callability."
      ],
      [
        "A migration uses any to access every response field without errors. What was established?",
        "Checking was bypassed there",
        "Every field exists in production",
        "The server validates every client",
        "All responses share one shape",
        "The absence of diagnostics after using any is not proof of runtime correctness.",
        "Any permits unsupported accesses.",
        "Client types do not prove server validation.",
        "Responses may still vary."
      ],
      [
        "A service accepts an optional callback but calls it unconditionally. What should be examined?",
        "A callback presence check",
        "Only its function name",
        "Only the response size",
        "Only the compiler logo",
        "An optional callable may be absent and requires a valid invocation path.",
        "Naming does not prove presence.",
        "Payload size is unrelated.",
        "Branding is not evidence."
      ],
      [
        "A team exports a typed invoice helper while consumers use unchecked JavaScript. What must its safety claim include?",
        "The unchecked input boundary",
        "A universal type guarantee",
        "Automatic runtime validation",
        "Automatic rejection of all JSON",
        "Static checked callers and unchecked runtime callers provide different evidence and need boundary handling.",
        "Types do not constrain every caller at runtime.",
        "No validator is generated by annotations alone.",
        "JSON is not universally rejected."
      ]
    ]
  },
  {
    "comp": "m1.c1",
    "rows": [
      [
        "Which feature allows compatible interface declarations to combine?",
        "Declaration merging",
        "Runtime object freezing",
        "JSON key sorting",
        "Promise settlement",
        "Interfaces can participate in declaration merging under the language rules.",
        "Freezing is a runtime operation.",
        "Key sorting is unrelated.",
        "Promises describe asynchronous outcomes."
      ],
      [
        "What does a type alias name?",
        "A type expression",
        "A guaranteed runtime object",
        "A network session",
        "A compiler process",
        "Aliases can name object types, unions and other type expressions.",
        "They are erased rather than constructing objects.",
        "Sessions are runtime state.",
        "An alias is not an executable process."
      ],
      [
        "Does assigning a value to an interface sanitize its runtime fields?",
        "No",
        "Yes, all extra fields vanish",
        "Only if exported",
        "Only in strict mode",
        "Static assignability does not transform the underlying object.",
        "No universal removal occurs.",
        "Exports do not add filtering.",
        "Strictness does not add runtime sanitization."
      ],
      [
        "A university passes an internal lesson object to a title-only function. Why can it compile?",
        "The required shape is compatible",
        "All fields were deleted first",
        "Every object has every property",
        "The function accepts all JSON",
        "Structural compatibility can allow extra members on a compatible variable.",
        "No deletion is needed or implied.",
        "Missing required members still matter.",
        "A typed function does not accept arbitrary shapes."
      ],
      [
        "A public serializer receives a wider object under a narrow type. What should prevent secret leakage?",
        "Construct allowed output fields",
        "Only rename the type Public",
        "Only mark the argument readonly",
        "Only pass through the original",
        "Runtime field selection is required when the output must exclude extra source properties.",
        "Names do not filter data.",
        "Readonly does not strip fields.",
        "Passing through preserves extras."
      ],
      [
        "A fresh config literal contains retryCout instead of retryCount. Which feedback is useful?",
        "A property diagnostic",
        "Only a timer warning",
        "Only an HTTP status",
        "Only a browser paint",
        "The checker can flag missing required or excess misspelled properties in a fresh literal.",
        "Scheduling feedback does not check names.",
        "HTTP is not involved.",
        "Rendering does not establish shape."
      ],
      [
        "A package must add fields to an existing compatible interface declaration. Which mechanism may fit?",
        "Interface augmentation",
        "Runtime monkey-patching only",
        "A duplicate alias declaration",
        "A type assertion on every call",
        "Declaration merging or module augmentation can describe supported interface additions.",
        "Runtime patching alone does not update types safely.",
        "Aliases cannot be reopened equivalently.",
        "Assertions do not define the shared declaration."
      ],
      [
        "A team models a success-or-error value. Why might an alias be appropriate?",
        "It can name a union expression",
        "It creates a runtime validator",
        "It forbids all future variants",
        "It encrypts discriminant values",
        "Type aliases can directly name union types suited to alternative state shapes.",
        "Validation needs code.",
        "Remote evolution remains possible.",
        "Types do not encrypt."
      ],
      [
        "A typed view is assigned from a variable with sensitive extra fields. Which runtime equality can still hold?",
        "Both references point to one object",
        "The view is always a fresh clone",
        "All extra fields become undefined",
        "The compiler freezes both objects",
        "An annotation can preserve the same underlying reference and properties.",
        "Assignment need not clone.",
        "Types do not erase runtime properties.",
        "No freeze follows."
      ],
      [
        "A review sees two identically shaped interfaces with different domain names and assumes nominal isolation. What should it verify?",
        "Structural compatibility",
        "Only declaration line numbers",
        "Only property indentation",
        "Only source-map settings",
        "Different names alone do not generally create nominal separation; branding or stronger designs may be needed.",
        "Line positions do not isolate types.",
        "Formatting is irrelevant.",
        "Source maps do not enforce domain identity."
      ]
    ]
  },
  {
    "comp": "m1.c2",
    "rows": [
      [
        "What does optional property syntax directly allow?",
        "Property absence",
        "Deep object freezing",
        "Automatic server defaults",
        "Guaranteed nonempty text",
        "The question mark permits the property to be absent under the declared object contract.",
        "Freezing is separate.",
        "Defaults need runtime behavior.",
        "Optional text can be absent or empty."
      ],
      [
        "What does ReadonlyArray prohibit through its checked view?",
        "Mutating array methods",
        "Every nested object mutation",
        "All property reads",
        "Every runtime alias",
        "The readonly array interface omits mutating operations through that type.",
        "Nested values can retain mutable fields.",
        "Reading remains allowed.",
        "Other aliases may still exist."
      ],
      [
        "Which flag refines absence versus explicit undefined for optional properties?",
        "exactOptionalPropertyTypes",
        "noUncheckedIndexedAccess",
        "noPropertyAccessFromIndexSignature",
        "allowImportingTsExtensions",
        "The flag changes checking of explicit undefined assignments to optional members.",
        "Indexed access checking addresses a different question.",
        "Index-signature property access checking does not set optional assignment semantics.",
        "Import extension policy does not define optional assignment semantics."
      ],
      [
        "A card intentionally uses an empty subtitle. Which default preserves it?",
        "subtitle ?? fallback",
        "subtitle or fallback always",
        "Always replace empty text",
        "Always assert non-null",
        "Nullish defaulting preserves empty strings while handling null and undefined.",
        "Logical-or semantics replace empty text.",
        "That defeats the stated intent.",
        "An assertion supplies no fallback."
      ],
      [
        "A settings property is readonly but its array accepts push. Why?",
        "The property protection is shallow",
        "Readonly always freezes recursively",
        "Push removes the readonly type",
        "Arrays cannot be nested fields",
        "The property reference cannot be reassigned through that view, but its mutable array can change.",
        "Deep freezing is not implied.",
        "Push does not mutate a type annotation.",
        "Arrays can be object fields."
      ],
      [
        "A persisted object omits a field while another stores that field as undefined. What test can distinguish presence?",
        "An own-property check",
        "Only reading the missing value",
        "Only a type alias",
        "Only the property’s color",
        "Presence and a read result of undefined are distinct runtime facts.",
        "Both reads can yield undefined.",
        "Aliases do not inspect runtime presence.",
        "Color is unrelated."
      ],
      [
        "A team applies Object.freeze to a config with nested objects. What remains to assess?",
        "Nested mutability",
        "Only top-level spelling",
        "Only the compile target",
        "Only a Promise type",
        "Object.freeze is shallow; nested objects can remain mutable without an additional policy.",
        "Spelling does not freeze data.",
        "Target does not implement deep freezing.",
        "Promises are unrelated."
      ],
      [
        "A patch API makes every User field optional. What does that not authorize?",
        "Changing privileged fields",
        "Omitting unchanged fields",
        "A partial static shape",
        "Optional property reads",
        "Optionality expresses shape, not permission to update sensitive fields.",
        "Omission can be appropriate for patches.",
        "Partial can derive that shape.",
        "Reads still require absence handling."
      ],
      [
        "A readonly view and a mutable alias refer to the same object. What runtime outcome is possible?",
        "The mutable alias changes it",
        "Every alias becomes frozen",
        "The object is cloned on assignment",
        "Changes are encrypted automatically",
        "Readonly does not generally remove other runtime aliases or freeze the object.",
        "Types do not call freeze.",
        "Annotations do not clone.",
        "No encryption occurs."
      ],
      [
        "A codebase promises immutable configuration solely with readonly nested references. What would substantiate that stronger claim?",
        "A complete mutation policy",
        "Only an interface rename",
        "Only optional members",
        "Only noImplicitAny",
        "Deep immutability requires deliberate runtime and alias treatment suited to the data graph.",
        "Names do not constrain mutation.",
        "Optionality concerns absence.",
        "Implicit-any checking does not establish freezing."
      ]
    ]
  },
  {
    "comp": "m2.c1",
    "rows": [
      [
        "Which guard can recognize actual arrays?",
        "Array.isArray",
        "typeof value === \"object\" alone",
        "A string assertion",
        "A readonly annotation",
        "Array.isArray supplies runtime evidence that a value is an array.",
        "Object includes non-arrays and null.",
        "Assertions do not inspect values.",
        "Readonly does not identify arrays."
      ],
      [
        "What does a type predicate’s value is Customer return type promise?",
        "True implies the Customer shape",
        "Every Customer is encrypted",
        "Every input is valid JSON",
        "The predicate never executes",
        "A user-defined predicate tells the checker what a true result establishes.",
        "Predicates do not encrypt.",
        "JSON validity is a different property.",
        "The function runs to produce a result."
      ],
      [
        "What can control-flow narrowing follow?",
        "Control-flow evidence",
        "Only comments",
        "Only file extensions",
        "Only source line counts",
        "The checker uses control-flow evidence about possible values.",
        "Comments alone do not narrow values.",
        "Extensions do not inspect branches.",
        "Length is unrelated."
      ],
      [
        "A union of string and number is formatted with toFixed. What is needed first?",
        "A numeric branch guard",
        "Only a template literal",
        "Only a result assertion",
        "Only a readonly parameter",
        "The operation must be valid for the narrowed numeric member.",
        "Formatting does not narrow.",
        "Result assertions do not establish input type.",
        "Readonly does not determine numeric identity."
      ],
      [
        "A validator accepts null after testing only typeof object. What is the missing boundary?",
        "Exclude null explicitly",
        "Only enable source maps",
        "Only shorten the function",
        "Only return any",
        "Null has typeof object and needs separate treatment before ordinary property access.",
        "Maps do not change runtime values.",
        "Length is irrelevant.",
        "Any hides the unsafe access."
      ],
      [
        "A guard checks id is string but promises id and address are valid. What should review require?",
        "Evidence for every promised part",
        "Only the return type spelling",
        "Only a truthy id",
        "Only an early return true",
        "A predicate must justify the shape it claims, not a weaker partial condition.",
        "The spelling is not validation.",
        "Truthiness does not validate the full structure.",
        "An early return can accept invalid inputs."
      ],
      [
        "A boolean flag named isCustomer is true but came from an untrusted payload. What follows?",
        "It needs independent evidence",
        "The name proves a Customer",
        "Every nested field is valid",
        "The backend granted a role",
        "A client-supplied flag is not a substitute for inspecting the required shape and authority.",
        "Names do not validate.",
        "Nested fields remain unproved.",
        "Flags do not grant server permission."
      ],
      [
        "A class instance check is used for plain parsed JSON objects. What must engineers consider?",
        "The actual prototype contract",
        "Only matching JSON key order",
        "Only the class name string",
        "Only a compiler interface",
        "Instanceof examines runtime prototype relationships rather than merely matching a structural interface.",
        "Ordering does not establish a prototype.",
        "A string name is not the prototype relation.",
        "Interfaces are erased."
      ],
      [
        "A filter removes falsy values and accidentally drops the numeric id zero. What needs correction?",
        "The intended absence predicate",
        "Only another type assertion",
        "Only a longer id string",
        "Only moving the file",
        "Truthiness is broader than nullish absence and may discard valid domain values.",
        "Assertions do not restore discarded data.",
        "The contract must decide valid ids.",
        "File location is unrelated."
      ],
      [
        "A reusable guard depends on a mutable global flag instead of the value’s fields. What is the technical risk?",
        "Unsound narrowing of inputs",
        "Automatic deep validation",
        "Guaranteed structural cloning",
        "A faster compiler-only path",
        "The true result may not establish the promised properties of the actual input.",
        "No deep inspection occurs.",
        "No cloning follows.",
        "Runtime guard correctness matters, not merely compilation speed."
      ]
    ]
  },
  {
    "comp": "m2.c1",
    "rows": [
      [
        "What property is commonly used to discriminate union variants?",
        "A shared literal-valued tag",
        "An arbitrary optional comment",
        "Only an array index",
        "Only a generated UUID",
        "A common property with distinct literal values identifies the associated variant.",
        "An optional comment need not distinguish variants.",
        "Indexes do not inherently encode state shapes.",
        "Identity alone does not relate payload types."
      ],
      [
        "What does an exhaustive never check reveal after adding a variant?",
        "An unhandled declared case",
        "Every network request failed",
        "A missing CSS style",
        "A slow JSON parser",
        "The newly reachable member cannot be assigned to never.",
        "There is no network evidence.",
        "Styling is unrelated.",
        "Parsing speed is separate."
      ],
      [
        "Why require data only on the success member?",
        "To encode valid state relations",
        "To encrypt success payloads",
        "To prevent every runtime error",
        "To remove server validation",
        "The union links a tag with the fields valid and required for that state.",
        "Types do not encrypt.",
        "Runtime inputs can still violate assumptions.",
        "External data still needs validation."
      ],
      [
        "A loader models ready and failed with optional data and optional error everywhere. What defect can that allow?",
        "Conflicting state shapes",
        "Only a slower compiler",
        "Only invalid variable names",
        "Only timer throttling",
        "Universal optional fields can admit missing or conflicting state payloads.",
        "Speed is not the key modeling issue.",
        "Names may be valid while the shape is weak.",
        "Timers are separate."
      ],
      [
        "An importer switches on state.kind and accesses count only in ready. What supports that access?",
        "Tag-based narrowing",
        "Only console logging",
        "Only a database index",
        "Only an import alias",
        "The literal tag check narrows to the member declaring count.",
        "Logs do not establish the type.",
        "Indexes are unrelated.",
        "Aliases do not inspect the state."
      ],
      [
        "A client receives a new server tag absent from its compiled union. What should the client boundary do?",
        "Handle unknown external variants",
        "Assume never makes it impossible",
        "Only reorder switch cases",
        "Only cast to a known member",
        "A source-level closed union cannot prevent an evolving remote service from sending other data.",
        "Never is not a runtime network filter.",
        "Ordering does not validate tags.",
        "Casting discards evidence."
      ],
      [
        "A cancel button must transition pending to canceled, whose member needs no result data. What helps model it?",
        "A separate canceled variant",
        "Adding data: any everywhere",
        "Removing the state tag",
        "Marking every field optional",
        "A dedicated variant states which payload belongs to cancellation without inventing success data.",
        "Any loses structure.",
        "Without a tag the relationship is harder to express.",
        "Universal optionality permits contradictions."
      ],
      [
        "A team silences an exhaustiveness error with as never after adding a case. What is lost?",
        "Detection of missing behavior",
        "Only JavaScript compatibility",
        "Only field ordering",
        "Only a source comment",
        "The assertion bypasses evidence that the new variant has no implemented branch.",
        "The issue is behavior coverage, not target syntax.",
        "Order is unrelated.",
        "The assertion affects checking rather than just comments."
      ],
      [
        "A success tag comes from local code but its payload was copied unchecked from JSON. What remains necessary?",
        "Validate the payload contract",
        "Only trust the local tag",
        "Only use a longer type name",
        "Only add readonly to the tag",
        "Constructing a known tag does not validate the nested external payload.",
        "The tag does not inspect data.",
        "Names add no evidence.",
        "Readonly does not establish shape."
      ],
      [
        "A process has partial, ready and error variants with distinct retry rules. Which design preserves the rule relationship?",
        "Variant-specific typed handling",
        "One generic success boolean",
        "An optional string for all rules",
        "An assertion after every branch",
        "Handling each variant explicitly connects its payload and permitted transitions with its meaning.",
        "One boolean cannot express all three states clearly.",
        "A loose optional field loses invariants.",
        "Assertions bypass rather than encode rules."
      ]
    ]
  },
  {
    "comp": "m2.c2",
    "rows": [
      [
        "Which strict option tracks null and undefined as distinct types?",
        "strictNullChecks",
        "removeComments",
        "sourceRoot",
        "pretty",
        "StrictNullChecks makes absence visible in assignability and operations.",
        "Comments affect output.",
        "Source roots relate to debugging paths.",
        "Pretty is formatting."
      ],
      [
        "What does the postfix non-null assertion change?",
        "The checker’s view",
        "The runtime value",
        "The server’s data",
        "The object’s prototype",
        "The assertion removes nullish possibilities from the static view without checking the actual value.",
        "It does not replace null.",
        "It does not alter remote records.",
        "It does not change prototypes."
      ],
      [
        "Which value is preserved by nullish coalescing when used as the left operand?",
        "0",
        "undefined",
        "null",
        "void 0",
        "Zero is not nullish and is preserved by the operator.",
        "Undefined triggers the fallback.",
        "Null triggers the fallback.",
        "Both nullish alternatives trigger it rather than being preserved."
      ],
      [
        "A course lookup has no match. Which response preserves progress truth?",
        "Show the defined missing state",
        "Mark the absent lesson passed",
        "Invent a new completion record",
        "Reuse another student’s result",
        "Missing data needs a truthful domain outcome rather than fabricated learning evidence.",
        "Absence is not completion.",
        "Invented records corrupt evidence.",
        "Another student’s data violates identity boundaries."
      ],
      [
        "A field may be undefined and code reads field.length. What should precede the access?",
        "A valid presence branch",
        "Only an import statement",
        "Only a comment saying safe",
        "Only changing const to let",
        "The code needs a path where the receiver is known to be present.",
        "Imports do not prove presence.",
        "Comments are not runtime evidence.",
        "Mutability does not remove undefined."
      ],
      [
        "A city field is intentionally an empty string. Which defaulting rule avoids replacing it?",
        "Nullish-only fallback",
        "General truthiness fallback",
        "Always use the longest string",
        "Always use an assertion",
        "Nullish coalescing handles absence while preserving empty text if that is the domain contract.",
        "Truthiness replaces empty strings.",
        "Length is unrelated to the intended semantics.",
        "Assertions do not choose fallback values."
      ],
      [
        "A UI checks shared.currentUser then awaits a request before reading it again. What may require handling?",
        "Identity changes",
        "Only string capitalization",
        "Only object key order",
        "Only source formatting",
        "Mutable external state can change across asynchronous work; the actual value used must be current and authorized.",
        "Case does not establish identity continuity.",
        "Ordering does not prevent mutation.",
        "Formatting is not synchronization."
      ],
      [
        "A team suppresses all missing-value errors with !. Which evidence is absent?",
        "Runtime presence guarantees",
        "The presence of assertions",
        "A compiler-visible annotation",
        "An edited source file",
        "Assertions do not establish that data exists when execution reaches the access.",
        "The source may contain them.",
        "The checker can see annotations.",
        "The edit exists but is not runtime protection."
      ],
      [
        "A nested optional chain returns undefined rather than a string. What should the consumer do?",
        "Handle its optional result",
        "Assume a string was created",
        "Only call toUpperCase directly",
        "Only rename the receiver",
        "Optional chaining can produce undefined; later operations must respect that result type.",
        "It does not invent a string.",
        "Direct access can fail on absence.",
        "Naming does not change the value."
      ],
      [
        "A database model permits null while the UI type permits only undefined for absence. What should the boundary define?",
        "An explicit absence mapping",
        "Only a blind type assertion",
        "Only JSON key sorting",
        "Only a narrower variable name",
        "Contracts must deliberately preserve or normalize distinct absence representations.",
        "An assertion hides the mismatch.",
        "Sorting does not map null.",
        "Names do not convert values."
      ]
    ]
  },
  {
    "comp": "m3.c1",
    "rows": [
      [
        "What can a generic function preserve that any commonly loses?",
        "Input-output type relations",
        "Every runtime object field",
        "All server permissions",
        "A fixed memory address",
        "Generics relate positions while retaining information from the caller’s chosen types.",
        "They do not retain every runtime property by themselves.",
        "Permissions are runtime authority.",
        "Addresses are not a type relation."
      ],
      [
        "What does a constraint provide to a generic implementation?",
        "Allowed structural operations",
        "A runtime data validator",
        "A guarantee of nonempty input",
        "A new network connection",
        "A constraint specifies members or relationships the implementation may rely on.",
        "It does not generate validation.",
        "Nonemptiness needs a relevant constraint.",
        "No network operation is created."
      ],
      [
        "Can a generic parameter alone construct any possible T?",
        "No",
        "Yes, using an empty object",
        "Only with a shorter name",
        "Only after two calls",
        "Arbitrary T may impose unknown requirements that an empty value cannot satisfy.",
        "An empty object cannot satisfy every T.",
        "Naming is irrelevant.",
        "Call count does not establish construction."
      ],
      [
        "A generic first helper accepts possibly empty arrays. Which return contract fits?",
        "T or undefined",
        "Always T with no condition",
        "Always string",
        "Always a fresh T object",
        "An empty input has no first element, so the result must represent absence unless a stronger precondition exists.",
        "A present value is not guaranteed.",
        "The input need not contain strings.",
        "The function cannot invent arbitrary T."
      ],
      [
        "A mapper accepts values of T and a callback from T to U. What should its output relate to?",
        "An array of U",
        "Only an array of T",
        "Only an array of never",
        "Only an untyped string",
        "Each mapped callback result has type U, so the output array should preserve that result relationship.",
        "The transformation may change types.",
        "Never does not represent actual results.",
        "An arbitrary string loses the contract."
      ],
      [
        "A decoder exposes parse<T>(text) and asserts parsed JSON as T. What must callers understand?",
        "T does not validate runtime data",
        "The syntax proves every field",
        "The parser constructs all defaults",
        "Generic calls reject bad schemas",
        "Parsing JSON syntax and choosing T do not establish the requested schema.",
        "Static syntax does not inspect fields.",
        "Defaults need code.",
        "No schema rejection is generated solely by T."
      ],
      [
        "A generic helper reads x.length but its constraint is {}. What is missing?",
        "A length-bearing constraint",
        "Only a longer function name",
        "Only a return type any",
        "Only a new file",
        "The declared input bound must include the operation the implementation needs.",
        "Names do not provide members.",
        "Any on output does not justify input access.",
        "File placement does not define shape."
      ],
      [
        "A reusable helper must return the same exact subtype it receives. Why avoid a broad base-type return?",
        "It loses caller-specific members",
        "It always crashes at runtime",
        "It forbids every interface",
        "It forces network retries",
        "A generic relationship can preserve a subtype while a broad return exposes only the base members.",
        "Loss of precision need not crash immediately.",
        "Interfaces can still be used.",
        "Retries are unrelated."
      ],
      [
        "A generic factory needs a default instance of T. What additional input can make that honest?",
        "A caller-supplied factory",
        "Only an assertion on {}",
        "Only an unconstrained T",
        "Only renaming T to Model",
        "A value-producing callback can construct a valid caller-specific instance under its contract.",
        "An assertion does not build required fields.",
        "Unconstrained T supplies no constructor.",
        "Names do not create values."
      ],
      [
        "A library adds type parameters that occur once and create no relation. What should review consider?",
        "A simpler direct parameter type",
        "Automatically replacing all with any",
        "Disabling strict checks",
        "Adding more unused parameters",
        "Generics are useful for relationships; unnecessary parameters can complicate APIs without improving precision.",
        "Any discards checking.",
        "Suppression does not simplify honestly.",
        "Unused parameters add complexity."
      ]
    ]
  },
  {
    "comp": "m3.c1",
    "rows": [
      [
        "What does K extends keyof T restrict?",
        "K to keys known for T",
        "T to only string values",
        "Every key to a runtime UUID",
        "Every value to readonly",
        "The bound relates the key parameter to the static object type.",
        "Values can have many types.",
        "UUIDs are unrelated.",
        "Readonly is a separate modifier."
      ],
      [
        "What static expression gives the value type at key K of T?",
        "T[K]",
        "T[]",
        "keyof K",
        "typeof \"T\"",
        "Indexed access names the property value type for the selected key.",
        "An array of T is different.",
        "Keyof K concerns K’s keys.",
        "The string literal is unrelated."
      ],
      [
        "What does Partial<T> do at the type level?",
        "Makes its properties optional",
        "Recursively validates all values",
        "Deletes every runtime field",
        "Authorizes every patch operation",
        "Partial derives a view with optional members rather than executing a transformation or permission check.",
        "Validation requires code.",
        "Types do not delete fields.",
        "Shape does not grant authority."
      ],
      [
        "A settings reader gets key label from a typed object with numeric retries and text label. What type should T[K] preserve?",
        "The label’s text type",
        "Always an arbitrary number",
        "Always unknown regardless of key",
        "Always a function",
        "The selected key relates to its corresponding member type.",
        "Retries being numeric does not make label numeric.",
        "The key-specific relation can retain more precision.",
        "The property is text in this contract."
      ],
      [
        "An external query parameter is asserted as keyof User. What needs verification?",
        "Allowed keys at runtime",
        "Only the query’s length",
        "Only the interface name",
        "Only the source extension",
        "External strings require actual validation before treating them as valid and authorized field choices.",
        "Length does not prove membership.",
        "Names do not inspect input.",
        "Extensions do not constrain users."
      ],
      [
        "A Pick type includes id and title while its runtime input also has passwordHash. What should output code do?",
        "Construct id and title explicitly",
        "Serialize the wider input blindly",
        "Assume Pick stripped the hash",
        "Only mark passwordHash readonly",
        "Static selection does not filter the source object, so actual output selection matters.",
        "Blind serialization can leak extras.",
        "No stripping occurs automatically.",
        "Readonly does not prevent disclosure."
      ],
      [
        "A patch type is Partial<Account>. What should server authorization independently constrain?",
        "Permitted fields and actor",
        "Only whether JSON parsed",
        "Only optional syntax",
        "Only property order",
        "A structurally valid patch may still attempt forbidden updates by an unauthorized actor.",
        "Syntax is not permission.",
        "Optionality does not authorize.",
        "Order is unrelated."
      ],
      [
        "A generic accepts {length: number}. Which assumption exceeds that constraint?",
        "The value supports push",
        "It has numeric length",
        "Length may be zero",
        "The member is declared",
        "Length-bearing objects need not be arrays and need not implement push.",
        "That is the promised member.",
        "Zero is compatible with number.",
        "The declaration is the constraint."
      ],
      [
        "A typed key selector is applied to a runtime object missing required properties. What boundary failed?",
        "Actual object validity",
        "Only keyof syntax",
        "Only source map generation",
        "Only code indentation",
        "Static key relations assume the value actually meets its declared type, which external inputs may violate.",
        "Keyof itself can be well-formed.",
        "Maps do not validate objects.",
        "Formatting is unrelated."
      ],
      [
        "An API wants to accept a safe subset of patchable keys and retain each value’s type. Which design direction fits?",
        "Allowed key-value relations",
        "A free string key with any value",
        "A cast to every model type",
        "A public object with all fields mutable",
        "The API should combine allowed key constraints, key-value relationships and runtime boundary checks.",
        "Free strings and any lose protection.",
        "Broad casts bypass contracts.",
        "Unrestricted mutation overexposes capability."
      ]
    ]
  },
  {
    "comp": "m3.c2",
    "rows": [
      [
        "What does the strict compiler flag enable?",
        "A family of stronger checks",
        "Every optional compiler check",
        "Every runtime validator",
        "Every JavaScript polyfill",
        "Strict enables a specified family, while some useful options remain separate opt-ins.",
        "Not all checks belong to strict.",
        "Static flags do not generate general validators.",
        "Declarations and flags do not install APIs."
      ],
      [
        "What does lib configure?",
        "Available API declarations",
        "Guaranteed runtime APIs",
        "The server’s storage quota",
        "The browser’s cookie policy",
        "Lib selects declaration sets available to static checking.",
        "Declarations do not ensure implementation.",
        "Storage quotas are runtime policy.",
        "Cookies are separate."
      ],
      [
        "What is the purpose of @ts-expect-error in a negative fixture?",
        "Require a diagnostic at the next line",
        "Ignore every future error in the file",
        "Disable JavaScript execution always",
        "Create a runtime exception",
        "The directive is itself reported if the next line produces no diagnostic.",
        "Its scope is not the whole file.",
        "Valid compiled code can still execute.",
        "It does not generate an exception."
      ],
      [
        "A build reports an incompatible assignment. What should the team inspect first?",
        "Actual and intended types",
        "Only the error text’s color",
        "Only dependency download speed",
        "Only the compiler logo",
        "Interpret the diagnostic and contract before changing the source or options.",
        "Color does not fix the mismatch.",
        "Network throughput does not explain assignability.",
        "Branding is unrelated."
      ],
      [
        "A build emits code despite diagnostics and a deployment picks it up. Which option can block that emission?",
        "noEmitOnError",
        "Only pretty",
        "Only sourceRoot",
        "Only removeComments",
        "NoEmitOnError prevents emitting output when errors exist under that build.",
        "Pretty only formats diagnostics.",
        "SourceRoot affects debugging references.",
        "Comment removal is unrelated."
      ],
      [
        "A Node program compiles with DOM declarations and then document is undefined. Why?",
        "Declarations did not create a DOM",
        "Strict mode deleted document",
        "The type alias renamed document",
        "NoEmitOnError encrypts globals",
        "API types describe an environment but do not implement its objects.",
        "Strictness does not delete browser globals.",
        "Aliases are erased.",
        "Emission policy does not encrypt."
      ],
      [
        "A team assumes strict includes exact optional-property assignment semantics. What should be checked?",
        "exactOptionalPropertyTypes separately",
        "Only whether comments are removed",
        "Only the current branch name",
        "Only JavaScript minification",
        "The flag is a separate opt-in and affects explicit undefined assignment to optional fields.",
        "Comments do not set semantics.",
        "Branches do not define compiler behavior.",
        "Minification is not the static check."
      ],
      [
        "A modern API type-checks but is absent in the deployed engine. What must compatibility work provide?",
        "Actual runtime support",
        "Only a declaration file",
        "Only an assertion on the global",
        "Only a passing type alias test",
        "Declared APIs do not install implementations; the runtime must actually support the operation.",
        "A declaration alone is insufficient.",
        "An assertion creates no function.",
        "Type aliases do not execute APIs."
      ],
      [
        "A project upgrades TypeScript and sees newly reported errors. What is a sound response?",
        "Review diagnostics and config deliberately",
        "Delete every failing source file",
        "Disable all strict options immediately",
        "Treat every new error as false",
        "Compiler evolution can reveal bugs or changed analysis; examine the actual contract and migration effects.",
        "Deleting code is not a general fix.",
        "Suppression can hide defects.",
        "Errors need evidence-based review."
      ],
      [
        "A report claims TypeScript verified because plain Node printed the expected output. What additional evidence is essential?",
        "Real compiler checking and settings",
        "Only more console output",
        "Only a .ts filename",
        "Only a screenshot of the result",
        "Runtime JavaScript execution cannot check erased TypeScript contracts; the actual compiler must run.",
        "Logging does not perform type analysis.",
        "An extension alone runs no checker.",
        "A screenshot cannot replace the static check."
      ]
    ]
  }
]);
