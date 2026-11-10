'use strict';
const {course}=require('./web-helper');
const units=[
  {
    "id": "ts-function-contracts",
    "comp": "m1.c1",
    "title": "Type values and function contracts before crossing a boundary",
    "introduction": "An invoicing tool accepts an amount and returns a formatted label. A typed function can catch accidental string arguments while code is checked, but an HTTP payload remains untrusted data until the program validates it.",
    "sections": [
      {
        "heading": "Annotations describe permitted values",
        "paragraphs": [
          "TypeScript checks JavaScript programs using static types. Write amount: number on a parameter and a return annotation such as string when that contract helps review. Type inference often supplies local types from initializers, so every variable does not need an annotation. The type number includes ordinary JavaScript numeric values, including NaN and Infinity; a business amount still needs appropriate runtime rules.",
          "A function type connects parameter and result expectations. For example, (amount: number) => string describes a callable value, whereas calling a function executes its body. A declared string result does not make a numeric runtime value safe by magic: the compiler reports incompatible checked code, while assertions, any and unchecked external values can bypass important protection."
        ]
      },
      {
        "heading": "Static safety has an input boundary",
        "paragraphs": [
          "Use unknown for data whose shape is not established. Narrow or validate it before use. A type assertion such as payload as Invoice is a request to trust the programmer; it does not generate a runtime invoice validator. Keep a useful distinction between compiler evidence about checked source and evidence about an actual external value.",
          "The worked fixture defines a typed formatter, lets inference determine a local numeric value and compiles a real call. Its fixed synthetic input proves only that the example checks and produces its stated output. Currency precision, localization, arbitrary JSON and deployed billing constraints require additional implementation and validation."
        ]
      }
    ],
    "worked": {
      "lang": "typescript",
      "code": "function label(amount: number): string { return `USD ${amount.toFixed(2)}`; }\nconst amount = 12.5;\nconsole.log(label(amount));",
      "expect": "USD 12.50",
      "problem": "Type values and function contracts before crossing a boundary. Compile the actual TypeScript fixture under strict checking, then inspect its runtime output.",
      "steps": [
        "Identify the declared input and output types.",
        "Run the pinned compiler with strict checking and emit only after successful checking.",
        "Execute the emitted JavaScript and compare the observed output with the declared result."
      ],
      "explanation": "The example uses the real TypeScript compiler and emitted JavaScript. It does not validate arbitrary network data or prove browser interaction; static annotations are erased and runtime boundaries need their own checks."
    },
    "quiz": [
      [
        "What does a TypeScript type annotation primarily guide?",
        "Static checking",
        "Runtime encryption",
        "Server authorization",
        "Browser rendering",
        "Annotations guide compile-time analysis and are ordinarily erased from JavaScript output.",
        "Types do not encrypt values.",
        "Permission checks need runtime authority.",
        "DOM rendering is separate."
      ],
      [
        "Which annotation describes a numeric parameter?",
        "amount: number",
        "amount: string",
        "amount: boolean",
        "amount: never",
        "Number permits JavaScript numeric values at the static boundary.",
        "String describes text.",
        "Boolean describes true or false.",
        "Never describes no possible value."
      ],
      [
        "What does a function return annotation specify?",
        "The expected result type",
        "The measured latency",
        "The HTTP response status",
        "The deployment region",
        "A return annotation documents and checks the function result contract.",
        "Time is not encoded by this annotation.",
        "Status is a separate value and contract.",
        "Regions are configuration."
      ],
      [
        "An API payload is asserted as Invoice. What has not happened?",
        "Runtime shape validation",
        "A compiler trust instruction",
        "An assertion expression",
        "A static type override",
        "An assertion does not inspect external fields or reject malformed objects.",
        "That is what the assertion requests.",
        "The source contains an assertion.",
        "The checker can adopt the requested type."
      ],
      [
        "A billing amount is NaN but typed number. What remains necessary?",
        "A valid-amount check",
        "Only another annotation",
        "Only a string template",
        "Only a const binding",
        "Number includes NaN, so business-valid numeric constraints need runtime checking.",
        "Repeating number cannot exclude NaN at runtime.",
        "Formatting does not establish validity.",
        "Const prevents reassignment, not NaN."
      ],
      [
        "A helper accepts number and returns string. Which callable type fits?",
        "(x: number) => string",
        "(x: string) => number",
        "(x: boolean) => void",
        "(x: never) => never",
        "The parameter and result types must match the declared contract.",
        "Both directions are reversed.",
        "The input and output differ.",
        "Never does not describe this operation."
      ],
      [
        "A response is stored as unknown. What is needed before reading invoice fields?",
        "Narrow or validate its shape",
        "Assume every field exists",
        "Replace all fields with any",
        "Treat unknown as a valid invoice",
        "Unknown requires evidence before operations that depend on its shape.",
        "Missing or wrong fields remain possible.",
        "Any discards the useful check.",
        "The annotation does not establish an invoice."
      ],
      [
        "A fixture compiles and prints USD 12.50. What is still unproved?",
        "Every external billing input",
        "This synthetic call’s output",
        "The formatter’s checked signature",
        "The example’s emitted execution",
        "A single checked synthetic example is not exhaustive validation of an external billing boundary.",
        "The output is directly observed.",
        "The compiler checks the signature.",
        "The emitted code executes."
      ]
    ],
    "mistakes": [
      "Using an assertion as a JSON validator.",
      "Assuming number means a finite positive business amount."
    ],
    "takeaways": [
      "Distinguish compile-time contracts from runtime validation.",
      "Use inference locally and explicit contracts at meaningful boundaries."
    ],
    "prerequisite_note": "Complete JavaScript Fundamentals first. Use values, functions and object references from that course; TypeScript adds compile-time analysis rather than replacing JavaScript runtime semantics."
  },
  {
    "id": "ts-object-shapes",
    "comp": "m1.c1",
    "title": "Describe object shapes with interfaces and aliases",
    "introduction": "A scheduling service shares a lesson summary across several functions. A structural interface documents the fields those functions need without requiring every object to come from the same constructor.",
    "sections": [
      {
        "heading": "An interface names an object contract",
        "paragraphs": [
          "An interface can declare fields and method signatures. A type alias can name an object type as well as unions, tuples and other type expressions. Both can represent many ordinary object contracts; choose based on the modeling need and team conventions. Interfaces can be extended and participate in declaration merging, while a type alias cannot be reopened in the same way.",
          "TypeScript is largely structural: a value can satisfy a target when its compatible members meet that target’s requirements. It does not generally require matching nominal class names. Excess-property checks on fresh object literals catch likely mistakes, but they are not an exact-object runtime validation system. A compatible variable can carry additional properties."
        ]
      },
      {
        "heading": "Keep a useful minimal contract",
        "paragraphs": [
          "A summary function should depend on the fields it actually needs. That makes the function reusable and keeps the required shape understandable. Do not put a password into a public summary type just because another internal object happens to have one. Static assignability does not strip extra runtime properties when you serialize the original object.",
          "The example passes a larger in-memory value to a function that needs only id and title. Compilation demonstrates structural compatibility, and execution demonstrates reading the declared fields. No serialization filter is run: returning or logging the original larger object could still expose its additional data."
        ]
      }
    ],
    "worked": {
      "lang": "typescript",
      "code": "interface LessonSummary { id: string; title: string; }\nfunction titleOf(item: LessonSummary): string { return `${item.id}: ${item.title}`; }\nconst internal = {id: \"L1\", title: \"Interfaces\", draft: true};\nconsole.log(titleOf(internal));\nconsole.log(internal.draft);",
      "expect": "L1: Interfaces\ntrue",
      "problem": "Describe object shapes with interfaces and aliases. Compile the actual TypeScript fixture under strict checking, then inspect its runtime output.",
      "steps": [
        "Identify the declared input and output types.",
        "Run the pinned compiler with strict checking and emit only after successful checking.",
        "Execute the emitted JavaScript and compare the observed output with the declared result."
      ],
      "explanation": "The example uses the real TypeScript compiler and emitted JavaScript. It does not validate arbitrary network data or prove browser interaction; static annotations are erased and runtime boundaries need their own checks."
    },
    "quiz": [
      [
        "Which construct can name a union type?",
        "A type alias",
        "An HTML attribute",
        "An HTTP method",
        "A CSS selector",
        "A type alias can name object and non-object type expressions, including unions.",
        "Markup does not define static unions.",
        "HTTP methods describe operations.",
        "Selectors target elements."
      ],
      [
        "What does structural compatibility examine?",
        "Compatible required members",
        "Only constructor spelling",
        "Only variable name length",
        "Only source file location",
        "Assignability is generally based on compatible structure rather than matching nominal names.",
        "Names alone are not the general rule.",
        "Length does not determine types.",
        "Location alone is not compatibility."
      ],
      [
        "Can an interface describe an object’s required fields?",
        "Yes",
        "Only after deployment",
        "Only with a browser",
        "Only for JSON strings",
        "Interfaces are a standard way to describe object shapes in checked source.",
        "Deployment is not required.",
        "No DOM is needed.",
        "The type is not limited to JSON strings."
      ],
      [
        "A summary function accepts a variable with extra fields. What may explain this?",
        "Structural assignability",
        "Automatic field deletion",
        "Encrypted excess properties",
        "A new server schema",
        "A compatible object may have more members than the target requires.",
        "Assignment does not strip runtime properties.",
        "Types do not encrypt fields.",
        "Static assignment is not a server migration."
      ],
      [
        "A developer serializes the original object after assigning it to a public interface. What is the risk?",
        "Extra runtime fields remain",
        "The interface removed all extras",
        "JSON only emits interface fields",
        "The alias encrypts private data",
        "Type annotations do not transform or sanitize the runtime object.",
        "Static checking does not strip properties.",
        "JSON serialization sees runtime properties.",
        "Aliases supply no encryption."
      ],
      [
        "A fresh literal misspells title as titel. Which check can help?",
        "Excess-property checking",
        "DNS resolution",
        "CSS specificity",
        "Cookie expiry",
        "Fresh-object checks can flag likely property mistakes alongside missing required members.",
        "DNS does not inspect types.",
        "CSS does not validate object fields.",
        "Cookies are separate state."
      ],
      [
        "A library needs an augmentable object declaration. Which capability differs from aliases?",
        "Interface declaration merging",
        "Runtime schema encryption",
        "Automatic response filtering",
        "Browser hydration ownership",
        "Compatible interface declarations can merge, while aliases cannot be reopened equivalently.",
        "Declarations do not encrypt schemas.",
        "Runtime filtering needs code.",
        "Hydration is unrelated."
      ],
      [
        "A typed public view contains only id and title. What guarantees data minimization at runtime?",
        "Explicitly constructing the view",
        "Only assigning a wider object",
        "Only naming it PublicView",
        "Only changing its type alias",
        "Selecting the actual output fields prevents extra source properties from being included in that constructed value.",
        "Assignability does not strip fields.",
        "Names are not transformations.",
        "Alias changes are erased."
      ]
    ],
    "mistakes": [
      "Assuming structural assignment removes extra properties.",
      "Treating an interface as a runtime data validator."
    ],
    "takeaways": [
      "Model the fields consumers require.",
      "Construct explicit public output values where data minimization matters."
    ],
    "prerequisite_note": "Complete JavaScript Fundamentals first. Use values, functions and object references from that course; TypeScript adds compile-time analysis rather than replacing JavaScript runtime semantics."
  },
  {
    "id": "ts-optional-readonly",
    "comp": "m1.c2",
    "title": "Use optional and readonly properties without inventing guarantees",
    "introduction": "A profile card may omit a subtitle, and a configuration object should not be reassigned through its public type. Optionality and readonly express those compile-time intentions while leaving several runtime details explicit.",
    "sections": [
      {
        "heading": "Optional is a presence contract",
        "paragraphs": [
          "A property subtitle?: string may be absent. Reading it can produce undefined, so consumers must handle that possibility under strictNullChecks. A missing property and a present property whose value is undefined can differ at runtime, for example with the in operator or Object.keys. The exactOptionalPropertyTypes flag refines whether explicitly assigning undefined is allowed for an optional property whose declared type does not include it.",
          "Use nullish coalescing when only null or undefined should trigger a default. A logical-or default also replaces meaningful falsy values such as an empty string or zero. Decide what the product means by missing instead of assuming every falsy value should disappear."
        ]
      },
      {
        "heading": "Readonly is scoped static protection",
        "paragraphs": [
          "A readonly property cannot be reassigned through that checked view, but readonly does not generally imply deep immutability or runtime freezing. A readonly array prohibits mutating methods through its type; a nested mutable object can still have mutable fields unless its own type is readonly too. Aliases may expose the same runtime object through other compatible views.",
          "The fixture reads an omitted subtitle and mutates a nested array reachable through a readonly property. This is deliberate evidence of the shallow boundary: the property reference is not replaced, but the referenced array changes. Object.freeze is a separate runtime operation and is itself shallow unless a deeper policy is implemented."
        ]
      }
    ],
    "worked": {
      "lang": "typescript",
      "code": "interface Settings { readonly tags: string[]; subtitle?: string; }\nconst settings: Settings = {tags: [\"core\"]};\nsettings.tags.push(\"typed\");\nconsole.log(settings.subtitle ?? \"No subtitle\");\nconsole.log(settings.tags.join(\",\"));",
      "expect": "No subtitle\ncore,typed",
      "problem": "Use optional and readonly properties without inventing guarantees. Compile the actual TypeScript fixture under strict checking, then inspect its runtime output.",
      "steps": [
        "Identify the declared input and output types.",
        "Run the pinned compiler with strict checking and emit only after successful checking.",
        "Execute the emitted JavaScript and compare the observed output with the declared result."
      ],
      "explanation": "The example uses the real TypeScript compiler and emitted JavaScript. It does not validate arbitrary network data or prove browser interaction; static annotations are erased and runtime boundaries need their own checks."
    },
    "quiz": [
      [
        "What can an optional property read produce when absent?",
        "undefined",
        "A compiler-created string",
        "A new object automatically",
        "A guaranteed null",
        "An absent optional member reads as undefined under JavaScript property semantics.",
        "No default string is invented.",
        "No object is created implicitly.",
        "Null requires an actual null value."
      ],
      [
        "Does readonly automatically freeze a JavaScript object?",
        "No",
        "Yes, deeply always",
        "Only in browser tabs",
        "Only after JSON parsing",
        "Readonly is primarily a static restriction and does not itself call Object.freeze.",
        "Deep freezing is not implied.",
        "Runtime location does not create freezing.",
        "Parsing does not activate readonly."
      ],
      [
        "Which operator defaults only for null or undefined?",
        "??",
        "||",
        "&&",
        "===",
        "Nullish coalescing preserves other falsy values such as zero and empty string.",
        "Logical or also replaces other falsy values.",
        "And has different selection semantics.",
        "Equality compares rather than supplying this default."
      ],
      [
        "A readonly tags property holds a mutable string array. What may remain allowed?",
        "Pushing through that array",
        "Reassigning the property freely",
        "Assuming deep runtime freezing",
        "Treating all nested data as never",
        "Readonly on the property protects reassignment of its reference, not every nested mutation.",
        "The property itself is protected through that view.",
        "No freeze is implied.",
        "Never is not the nested type."
      ],
      [
        "A UI uses a logical-or fallback and loses an intentional empty subtitle. Which behavior caused it?",
        "Falsy-value fallback",
        "Readonly enforcement",
        "Interface declaration merging",
        "Network cancellation",
        "Logical or selects the fallback for an empty string because it is falsy.",
        "Readonly is unrelated.",
        "Merging does not evaluate values.",
        "No request is involved."
      ],
      [
        "A record omits subtitle. Another contains subtitle: undefined. What can distinguish them at runtime?",
        "Property presence checks",
        "Only a string annotation",
        "Only a type alias name",
        "Only a readonly modifier",
        "The in operator or own-property checks can observe presence independently of the read value.",
        "Annotations are erased.",
        "Names are not runtime tests.",
        "Readonly does not create presence checks."
      ],
      [
        "A team enables exactOptionalPropertyTypes. What should be revisited?",
        "Explicit undefined",
        "Only CSS custom properties",
        "Only timer delays",
        "Only response ordering",
        "The flag distinguishes absence from explicit undefined where the property type does not include undefined.",
        "CSS is not this type option.",
        "Scheduling is unrelated.",
        "Ordering is a different concern."
      ],
      [
        "An immutable-config claim relies only on readonly at one top-level property. What is missing?",
        "A defined deep runtime policy",
        "Only a longer interface name",
        "Only a new import alias",
        "Only optional field syntax",
        "Deep runtime immutability needs deliberate treatment of nested values and aliases, not just a shallow annotation.",
        "Names do not freeze values.",
        "Imports do not define immutability.",
        "Optionality concerns presence."
      ]
    ],
    "mistakes": [
      "Equating readonly with deep runtime Object.freeze.",
      "Replacing an intentional empty string with an accidental logical-or fallback."
    ],
    "takeaways": [
      "Handle absent values explicitly.",
      "Separate property reassignment restrictions from nested mutation and runtime freezing."
    ],
    "prerequisite_note": "Complete JavaScript Fundamentals first. Use values, functions and object references from that course; TypeScript adds compile-time analysis rather than replacing JavaScript runtime semantics."
  },
  {
    "id": "ts-union-narrowing",
    "comp": "m2.c1",
    "title": "Narrow unions with evidence that matches the operation",
    "introduction": "A search filter accepts either a numeric page id or a text query. The caller’s union is honest about those possibilities; the implementation must establish which member it has before using a member-specific operation.",
    "sections": [
      {
        "heading": "A union preserves alternatives",
        "paragraphs": [
          "The type string | number permits either a string or a number. Before narrowing, only operations valid for the whole union are safe. A typeof check such as typeof value === \"string\" narrows the string branch and allows string-specific methods there. The other branch can then use number operations when these are the only declared alternatives.",
          "Control-flow analysis follows guards, assignments and reachable paths. Equality checks, the in operator and instanceof can provide useful evidence, but each has a specific runtime meaning. Typeof null is \"object\", so an object check alone is not a non-null object validator. Arrays also need appropriate checks such as Array.isArray when their distinction matters."
        ]
      },
      {
        "heading": "User-defined predicates are a promise to the checker",
        "paragraphs": [
          "A function with return type value is Customer is a type predicate. The compiler trusts its declared implication when it returns true, so the implementation must actually establish the claimed properties. Merely returning true or testing one unrelated flag can make the checked program unsound. Validate the precise fields needed, including nested values where the contract requires them.",
          "The worked function handles both members of a small declared union with typeof. It does not implement a general object validator, branded identifier validation or business-level query policy. Its two calls demonstrate that each branch produces the expected label under actual compiled execution."
        ]
      }
    ],
    "worked": {
      "lang": "typescript",
      "code": "function describe(value: string | number): string {\n  return typeof value === \"string\" ? value.toUpperCase() : value.toFixed(0);\n}\nconsole.log(describe(\"draft\"));\nconsole.log(describe(7));",
      "expect": "DRAFT\n7",
      "problem": "Narrow unions with evidence that matches the operation. Compile the actual TypeScript fixture under strict checking, then inspect its runtime output.",
      "steps": [
        "Identify the declared input and output types.",
        "Run the pinned compiler with strict checking and emit only after successful checking.",
        "Execute the emitted JavaScript and compare the observed output with the declared result."
      ],
      "explanation": "The example uses the real TypeScript compiler and emitted JavaScript. It does not validate arbitrary network data or prove browser interaction; static annotations are erased and runtime boundaries need their own checks."
    },
    "quiz": [
      [
        "What does a string-or-number union permit?",
        "Either a string or a number",
        "Only their concatenation",
        "Only numeric strings",
        "A value of neither type",
        "A union represents alternatives among its members.",
        "Concatenation is an operation, not this type.",
        "Numbers need not be strings.",
        "Members define the permitted alternatives."
      ],
      [
        "Which guard narrows a value to string in an appropriate union?",
        "typeof value === \"string\"",
        "value as string alone",
        "A longer variable name",
        "JSON.stringify(value)",
        "Typeof provides runtime evidence used by control-flow analysis.",
        "An assertion asks for trust rather than checking.",
        "Names do not inspect values.",
        "Serialization can stringify non-strings too."
      ],
      [
        "What does typeof null evaluate to in JavaScript?",
        "\"object\"",
        "\"null\"",
        "\"undefined\"",
        "\"never\"",
        "Null has the historical typeof result object, so non-null validation needs additional checks.",
        "There is no null typeof result.",
        "Undefined has a different value.",
        "Never is a static type, not a typeof string."
      ],
      [
        "A filter accepts string or number and calls toUpperCase before any guard. What is missing?",
        "A string branch guard",
        "Only a return annotation",
        "Only a console log",
        "Only a renamed parameter",
        "The method is not available on every union member.",
        "A result annotation does not narrow the input.",
        "Logging does not establish the branch.",
        "Naming does not change the value."
      ],
      [
        "A predicate declares value is Customer but always returns true. What is the risk?",
        "Unjustified narrowing",
        "Automatic schema validation",
        "Deep runtime cloning",
        "Compile-time encryption",
        "A declared predicate can mislead the checker if its implementation does not establish the claim.",
        "The signature does not generate validation.",
        "No cloning is implied.",
        "Types do not encrypt."
      ],
      [
        "A validator checks typeof value === object without excluding null. What case remains unsafe?",
        "null",
        "A nonempty string",
        "A boolean true",
        "A numeric zero",
        "Null satisfies typeof object but is not safe for ordinary object property access.",
        "Strings have typeof string.",
        "Booleans have typeof boolean.",
        "Zero has typeof number."
      ],
      [
        "A parser needs an array rather than any object. Which evidence helps?",
        "Array.isArray(value)",
        "Only typeof object",
        "Only a type assertion",
        "Only a filename suffix",
        "Array.isArray tests actual array identity in the relevant runtime sense.",
        "Object alone includes many non-array values and null.",
        "Assertions do not inspect the value.",
        "Filenames do not establish runtime shape."
      ],
      [
        "A custom guard checks customer.id but ignores a required nested address before promising a full Customer. What should change?",
        "Validate the promised shape",
        "Only shorten the type name",
        "Only add any to the address",
        "Only return true sooner",
        "A predicate must establish the contract it claims, including required nested structure.",
        "Names do not fix missing evidence.",
        "Any hides the gap.",
        "Returning sooner weakens validation."
      ]
    ],
    "mistakes": [
      "Using assertions where the operation needs real narrowing evidence.",
      "Forgetting that typeof null is object."
    ],
    "takeaways": [
      "Narrow according to the runtime distinction the operation needs.",
      "Review custom predicates as trusted validation code."
    ],
    "prerequisite_note": "Complete JavaScript Fundamentals first. Use values, functions and object references from that course; TypeScript adds compile-time analysis rather than replacing JavaScript runtime semantics."
  },
  {
    "id": "ts-discriminated-results",
    "comp": "m2.c1",
    "title": "Represent result states with discriminated unions",
    "introduction": "A file import can be pending, successful or failed. A single bag of optional fields permits contradictory combinations; a discriminated union makes the permitted state shapes explicit.",
    "sections": [
      {
        "heading": "The discriminant selects a valid state shape",
        "paragraphs": [
          "Give each union member a shared property with a distinct literal value, such as kind: \"ready\" or kind: \"error\". In a branch checking kind, TypeScript can narrow to the associated member and allow its member-specific fields. A ready member can require data while an error member requires a message, avoiding a shape where both are optional everywhere.",
          "Keep the tag and payload relationship intact. Destructuring and analysis have nuanced support, so choose clear branch-local reads when it improves understanding. Do not cast to a different member just to silence a branch error; that discards the state guarantee rather than repairing the transition."
        ]
      },
      {
        "heading": "Exhaustiveness turns new variants into review work",
        "paragraphs": [
          "A never assignment in the default branch of an exhaustive switch can make a future unhandled variant a compile-time error. This is a static closed-union guarantee, not a claim that arbitrary remote strings are impossible. Validate external inputs before treating them as members of that closed union.",
          "The fixture defines a ready/error result and uses a switch with an explicit never check. Both synthetic states execute. If a new declared variant is added without handling it, the exhaustiveness code should fail checking; if an external object lies about its tag, runtime validation is still necessary."
        ]
      }
    ],
    "worked": {
      "lang": "typescript",
      "code": " type Result = {kind: \"ready\"; count: number} | {kind: \"error\"; message: string};\nfunction render(result: Result): string {\n  switch (result.kind) {\n    case \"ready\": return `Count ${result.count}`;\n    case \"error\": return result.message;\n    default: { const impossible: never = result; return impossible; }\n  }\n}\nconsole.log(render({kind: \"ready\", count: 3}));\nconsole.log(render({kind: \"error\", message: \"Try again\"}));",
      "expect": "Count 3\nTry again",
      "problem": "Represent result states with discriminated unions. Compile the actual TypeScript fixture under strict checking, then inspect its runtime output.",
      "steps": [
        "Identify the declared input and output types.",
        "Run the pinned compiler with strict checking and emit only after successful checking.",
        "Execute the emitted JavaScript and compare the observed output with the declared result."
      ],
      "explanation": "The example uses the real TypeScript compiler and emitted JavaScript. It does not validate arbitrary network data or prove browser interaction; static annotations are erased and runtime boundaries need their own checks."
    },
    "quiz": [
      [
        "What makes a common discriminant useful?",
        "Distinct literal tag values",
        "Only longer property names",
        "Only optional payload fields",
        "Only readonly arrays",
        "Literal tags let the checker associate a branch with a particular union member.",
        "Length does not create a discriminant.",
        "Optional fields alone allow ambiguity.",
        "Array mutability is separate."
      ],
      [
        "What type can represent an unreachable exhaustive branch?",
        "never",
        "any",
        "string",
        "unknown",
        "Never represents no possible value in the fully narrowed branch.",
        "Any removes checking.",
        "String permits values.",
        "Unknown does not assert impossibility."
      ],
      [
        "What should a ready result require when count is essential?",
        "A count field on that member",
        "Every field optional always",
        "An error message instead",
        "A runtime type alias object",
        "Member-specific required fields encode the valid state shape.",
        "Universal optionality loses the invariant.",
        "The error payload belongs to another variant.",
        "Type aliases are not runtime objects."
      ],
      [
        "An importer has state ready but no data because every field was optional. What modeling change helps?",
        "Use state-specific members",
        "Only add another optional field",
        "Only rename ready to done",
        "Only log the object",
        "A discriminated union can require data for success and a message for failure.",
        "More optionality does not establish the relation.",
        "Renaming does not constrain shape.",
        "Logs do not repair the model."
      ],
      [
        "A team adds a canceled member and the never check fails. What does that indicate?",
        "A newly unhandled variant",
        "A runtime database outage",
        "A broken JavaScript engine",
        "An invalid server certificate",
        "The compiler found a reachable union member in the formerly exhaustive branch.",
        "No database evidence is involved.",
        "The error follows type coverage.",
        "Certificates are unrelated."
      ],
      [
        "A remote response says kind: ready but omits count. What must occur before trusting Result?",
        "Validate the external data",
        "Only assert as Result",
        "Only use a switch",
        "Only change the tag spelling",
        "The closed static union cannot validate arbitrary remote data by itself.",
        "Assertions do not inspect fields.",
        "A switch on an unvalidated tag may still access missing data.",
        "Spelling changes do not validate payloads."
      ],
      [
        "A developer casts the error branch to the ready member to access count. What is wrong?",
        "It bypasses state evidence",
        "The cast creates missing count",
        "Every error has count by default",
        "The tag encrypts the payload",
        "The code bypasses rather than satisfies the union’s relationship between tag and fields.",
        "Assertions do not construct fields.",
        "No such default is implied.",
        "Tags do not encrypt data."
      ],
      [
        "A public API evolves to return a new result tag while an older client assumes a closed union. What needs design?",
        "Unknown-state policy",
        "Only a local never annotation",
        "Only sorting union members",
        "Only removing error messages",
        "Static exhaustiveness in one source version does not guarantee that a remote evolving contract stays closed.",
        "The annotation cannot constrain the server.",
        "Order is not compatibility.",
        "Deleting messages loses information."
      ]
    ],
    "mistakes": [
      "Using one object with every state field optional.",
      "Casting across result variants instead of fixing the state transition."
    ],
    "takeaways": [
      "Encode valid states and required payloads together.",
      "Use exhaustive checks while validating external contract evolution."
    ],
    "prerequisite_note": "Complete JavaScript Fundamentals first. Use values, functions and object references from that course; TypeScript adds compile-time analysis rather than replacing JavaScript runtime semantics."
  },
  {
    "id": "ts-null-strictness",
    "comp": "m2.c2",
    "title": "Handle null and undefined without hiding missing data",
    "introduction": "A lookup can fail to find a lesson. The UI should explain absence, not crash after a non-null assertion. Strict null checking makes that possibility visible while runtime handling determines the user’s experience.",
    "sections": [
      {
        "heading": "Strict null checking preserves absence",
        "paragraphs": [
          "With strictNullChecks enabled, null and undefined are distinct from ordinary string or object values unless the type includes them. Array.find can return undefined when no match exists, so a consumer must check that result, use a defined fallback or propagate an explicit missing-result type. A non-null assertion removes the compiler warning but does not insert a runtime check.",
          "Optional chaining stops a property access or call chain at a nullish receiver and yields undefined. It does not validate arbitrary nested shapes, authorize access or guarantee that the eventual result is present. Nullish coalescing can supply a specific absence fallback while preserving meaningful zero and empty-string values."
        ]
      },
      {
        "heading": "Choose domain behavior rather than suppressing the warning",
        "paragraphs": [
          "An absent lesson could mean a not-found page, an obsolete saved link or a temporary synchronization issue. Choose a deliberate product behavior rather than silently creating an empty lesson or marking it complete. Narrow as close as practical to the operation that needs the value, and account for asynchronous changes to identity or mutable state.",
          "The example uses a real array lookup, handles its missing result with optional chaining and a fallback, and separately finds a present record. It executes only synthetic local data. A production navigation flow still needs HTTP, authorization and stale-link behavior checked at its actual boundaries."
        ]
      }
    ],
    "worked": {
      "lang": "typescript",
      "code": "const lessons = [{id: \"intro\", title: \"Start\"}];\nconst missing = lessons.find(item => item.id === \"missing\");\nconsole.log(missing?.title ?? \"Lesson not found\");\nconst found = lessons.find(item => item.id === \"intro\");\nconsole.log(found ? found.title : \"Lesson not found\");",
      "expect": "Lesson not found\nStart",
      "problem": "Handle null and undefined without hiding missing data. Compile the actual TypeScript fixture under strict checking, then inspect its runtime output.",
      "steps": [
        "Identify the declared input and output types.",
        "Run the pinned compiler with strict checking and emit only after successful checking.",
        "Execute the emitted JavaScript and compare the observed output with the declared result."
      ],
      "explanation": "The example uses the real TypeScript compiler and emitted JavaScript. It does not validate arbitrary network data or prove browser interaction; static annotations are erased and runtime boundaries need their own checks."
    },
    "quiz": [
      [
        "What can Array.find return when no member matches?",
        "undefined",
        "Always the first item",
        "Always an empty array",
        "A new default member",
        "Find reports no matching member with undefined.",
        "It does not substitute the first item.",
        "It returns one item or undefined, not an array.",
        "It creates no default object."
      ],
      [
        "Does a non-null assertion insert a runtime absence check?",
        "No",
        "Yes, always",
        "Only in strict mode",
        "Only in the browser",
        "The assertion affects checking and is erased rather than creating runtime validation.",
        "No check is generated by that assertion.",
        "Strict mode does not change that erasure.",
        "The runtime environment does not add the check."
      ],
      [
        "When does optional chaining stop the chain at its guarded receiver?",
        "For null or undefined",
        "For every falsy value",
        "Only for an empty array",
        "Only for NaN",
        "Optional chaining uses nullish absence, not general truthiness.",
        "Zero and false do not trigger that same short circuit.",
        "An empty array is still an object.",
        "NaN is not nullish."
      ],
      [
        "A lesson lookup uses found!.title and crashes for an obsolete id. What failed?",
        "Runtime absence handling",
        "Only compiler installation",
        "Only title capitalization",
        "Only CSS layout",
        "The assertion suppressed static concern without handling an actually absent value.",
        "The runtime failure can occur with a working compiler.",
        "Capitalization does not create a record.",
        "Layout is unrelated."
      ],
      [
        "A count of zero is replaced by a default when logical-or defaulting runs. What operator fits nullish absence only?",
        "count ?? 10",
        "count && 10",
        "count === 10",
        "count as number",
        "Nullish coalescing preserves zero while replacing null and undefined.",
        "And has different selection semantics.",
        "Equality compares instead of defaulting.",
        "An assertion does not select a fallback."
      ],
      [
        "A type is a union of Lesson and undefined under strict checking. What is needed before direct title access?",
        "Evidence that Lesson is present",
        "Only a longer property name",
        "Only JSON.stringify on the id",
        "Only a definite-assignment promise",
        "The union includes absence and must be narrowed or handled safely.",
        "Names do not remove undefined.",
        "Serializing an id does not prove a match.",
        "An unchecked promise is not evidence."
      ],
      [
        "A missing lesson is silently marked complete to avoid an error screen. Why is that wrong?",
        "It invents learning evidence",
        "It is required by strict mode",
        "It proves successful navigation",
        "It repairs the canonical graph",
        "Absence handling must preserve truthful progress rather than manufacture completion.",
        "Strict checking does not require false completion.",
        "A missing record is not successful learning.",
        "The graph is not fixed by invented state."
      ],
      [
        "A pre-await null check is followed by mutable shared state changing during the await. What must the design consider?",
        "Rechecking the actual value used",
        "Assuming old evidence is eternal",
        "Only another exclamation mark",
        "Only disabling all strict options",
        "Asynchronous boundaries can invalidate assumptions about mutable or external state.",
        "Prior observations need not remain current.",
        "An assertion adds no runtime protection.",
        "Disabling checks conceals the risk."
      ]
    ],
    "mistakes": [
      "Using ! as a runtime null check.",
      "Inventing successful progress when a record is missing."
    ],
    "takeaways": [
      "Treat absence as an explicit domain outcome.",
      "Use optional chaining and nullish defaults only where they match the contract."
    ],
    "prerequisite_note": "Complete JavaScript Fundamentals first. Use values, functions and object references from that course; TypeScript adds compile-time analysis rather than replacing JavaScript runtime semantics."
  },
  {
    "id": "ts-generic-relations",
    "comp": "m3.c1",
    "title": "Use generics to preserve relationships between inputs and outputs",
    "introduction": "A reusable first-item helper should return a value compatible with the array it receives. A generic parameter expresses that relationship, whereas any accepts too much and loses the result information.",
    "sections": [
      {
        "heading": "A type parameter relates positions",
        "paragraphs": [
          "A generic function first<T>(items: readonly T[]): T | undefined relates the input element type to the result. Type inference often supplies T from the argument. A caller passing strings gets string | undefined, while numeric input produces number | undefined. A generic type parameter is not a runtime constructor or a validator for external data.",
          "A function that returns T cannot safely invent an arbitrary value of T because callers may choose types with additional requirements. Return an actual member, accept a value-producing callback, or constrain the design honestly. Avoid generics used only once when a simpler parameter type expresses the same contract without a relationship."
        ]
      },
      {
        "heading": "Unknown, any and generics serve different purposes",
        "paragraphs": [
          "Unknown preserves the need to establish evidence before operations. Any largely opts out of checking and can let unsafe operations flow through a program. A generic T preserves caller-specific relationships without granting arbitrary methods on T. The implementation can use only operations valid under its declared constraint.",
          "The fixture implements first with an explicit empty-array result and calls it for strings and numbers. It compiles the same body for these checked call sites and runs emitted JavaScript. There is no runtime type parameter, so a remote response asserted to be T would still need actual schema validation."
        ]
      }
    ],
    "worked": {
      "lang": "typescript",
      "code": "function first<T>(items: readonly T[]): T | undefined { return items[0]; }\nconsole.log(first([\"alpha\", \"beta\"]));\nconsole.log(first([4, 5]));\nconsole.log(first<string>([]) ?? \"empty\");",
      "expect": "alpha\n4\nempty",
      "problem": "Use generics to preserve relationships between inputs and outputs. Compile the actual TypeScript fixture under strict checking, then inspect its runtime output.",
      "steps": [
        "Identify the declared input and output types.",
        "Run the pinned compiler with strict checking and emit only after successful checking.",
        "Execute the emitted JavaScript and compare the observed output with the declared result."
      ],
      "explanation": "The example uses the real TypeScript compiler and emitted JavaScript. It does not validate arbitrary network data or prove browser interaction; static annotations are erased and runtime boundaries need their own checks."
    },
    "quiz": [
      [
        "What does T connect in a generic first-item function?",
        "Input and result types",
        "Only runtime timestamps",
        "Only file path names",
        "Only compiler version strings",
        "A type parameter preserves a caller-specific relationship between element and result.",
        "Time is not its role.",
        "Paths are unrelated.",
        "Version numbers do not establish the type relation."
      ],
      [
        "Does a generic parameter exist as a normal JavaScript runtime value?",
        "No",
        "Yes, as every class constructor",
        "Only when called twice",
        "Only in a browser",
        "Generic parameters are static and erased from emitted JavaScript.",
        "A type parameter is not automatically a constructor.",
        "Call count does not change erasure.",
        "The browser does not restore erased types."
      ],
      [
        "Why can first<T> return undefined for an empty array?",
        "No element exists",
        "T is always undefined",
        "The compiler creates a default T",
        "Empty arrays are HTTP errors",
        "The return type must represent the possibility of no item.",
        "T can be many element types.",
        "A generic function cannot invent every possible T.",
        "Arrays are local data, not response statuses."
      ],
      [
        "A generic identity helper is replaced with any input and any output. What is lost?",
        "The type relationship",
        "Only runtime speed",
        "Only source formatting",
        "Only promise scheduling",
        "Any discards the caller-specific static relation the generic preserved.",
        "Type erasure means speed is not this key distinction.",
        "Formatting is unrelated.",
        "No asynchronous scheduling is implied."
      ],
      [
        "A generic function returns {} as T without evidence. What is the concern?",
        "T may require missing fields",
        "Every T accepts an empty object",
        "The cast validates T at runtime",
        "The compiler builds those fields",
        "The caller may instantiate T with required members absent from the empty object.",
        "That is not true for arbitrary T.",
        "Assertions do not validate.",
        "No runtime construction follows from a type parameter."
      ],
      [
        "A helper reads .length on unconstrained T. What should its contract express?",
        "A length constraint",
        "Only a shorter T name",
        "Only any on the return",
        "Only strict false",
        "The implementation needs a declared constraint permitting the operation.",
        "Names do not grant members.",
        "Any weakens the result without justifying the input operation.",
        "Disabling checking hides the contract issue."
      ],
      [
        "A generic API decoder claims JSON is T solely by assertion. What remains unverified?",
        "The actual response shape",
        "The syntactic generic call",
        "The parsed JSON syntax",
        "The chosen static type name",
        "The parameter cannot establish that external fields match the requested type.",
        "The source can contain a generic call.",
        "Successful parsing can establish JSON syntax only.",
        "A type name can exist without runtime evidence."
      ],
      [
        "A first-item function returns T rather than a union with undefined for arbitrary arrays. What needs correction?",
        "Its empty-input contract",
        "Only its function spelling",
        "Only its return variable name",
        "Only its file extension",
        "A possibly empty array cannot guarantee a present first element without an additional precondition or representation.",
        "Names do not create an element.",
        "Bindings do not change absence.",
        "Extensions do not establish array nonemptiness."
      ]
    ],
    "mistakes": [
      "Replacing a meaningful generic relationship with any.",
      "Claiming arbitrary JSON becomes T through an assertion."
    ],
    "takeaways": [
      "Use type parameters to relate values.",
      "Represent empty and external-input cases honestly."
    ],
    "prerequisite_note": "Complete JavaScript Fundamentals first. Use values, functions and object references from that course; TypeScript adds compile-time analysis rather than replacing JavaScript runtime semantics."
  },
  {
    "id": "ts-generic-constraints",
    "comp": "m3.c1",
    "title": "Constrain reusable operations with keyof and indexed access",
    "introduction": "A settings editor reads one named field from an object. The key must belong to that object, and the returned type should match the chosen field rather than becoming a broad unhelpful union or any.",
    "sections": [
      {
        "heading": "Constrain the operation rather than the caller’s entire domain",
        "paragraphs": [
          "The constraint K extends keyof T limits a key parameter to property keys known for T. The indexed access type T[K] then describes the value associated with that key. For a known object with retries: number and label: string, choosing retries can retain a numeric result while choosing label retains text. Keyof is static knowledge about a type, not a runtime list of keys.",
          "Constraints expose the members an implementation may use. A length-bearing constraint can permit .length but cannot promise a specific array method unless the constraint includes it. Keep constraints as small as practical and avoid forcing unrelated business objects into an artificial inheritance hierarchy when structural requirements suffice."
        ]
      },
      {
        "heading": "Mapped utility types alter views, not values",
        "paragraphs": [
          "Readonly<T>, Partial<T> and Pick<T, K> can derive useful static views. Partial makes properties optional; it does not recursively validate a patch or grant permission to update every field. Pick selects members in a type expression but does not strip runtime properties from a supplied object. Construct and authorize actual outputs and updates deliberately.",
          "The fixture uses keyof and T[K] for a real typed field reader, then prints numeric and text values. It neither validates a user-provided key string nor implements a permissions policy. External keys need a runtime allowlist or another explicit validation boundary before being treated as authorized field choices."
        ]
      }
    ],
    "worked": {
      "lang": "typescript",
      "code": "function read<T, K extends keyof T>(value: T, key: K): T[K] { return value[key]; }\nconst settings = {retries: 3, label: \"stable\"};\nconsole.log(read(settings, \"retries\"));\nconsole.log(read(settings, \"label\"));",
      "expect": "3\nstable",
      "problem": "Constrain reusable operations with keyof and indexed access. Compile the actual TypeScript fixture under strict checking, then inspect its runtime output.",
      "steps": [
        "Identify the declared input and output types.",
        "Run the pinned compiler with strict checking and emit only after successful checking.",
        "Execute the emitted JavaScript and compare the observed output with the declared result."
      ],
      "explanation": "The example uses the real TypeScript compiler and emitted JavaScript. It does not validate arbitrary network data or prove browser interaction; static annotations are erased and runtime boundaries need their own checks."
    },
    "quiz": [
      [
        "What does keyof T represent statically?",
        "Known property keys of T",
        "Every runtime value of T",
        "Only object values",
        "A network response body",
        "Keyof produces a type of keys known from the static type.",
        "It does not enumerate every value.",
        "Keys and values differ.",
        "No request is involved."
      ],
      [
        "What does T[K] describe in a constrained field reader?",
        "The chosen property’s type",
        "Only the key’s string length",
        "The compiler’s memory limit",
        "A JSON parsing error",
        "Indexed access relates the key choice to the corresponding property value type.",
        "Length is unrelated.",
        "Memory configuration is separate.",
        "Parsing does not define this type expression."
      ],
      [
        "Does Pick<T, K> automatically remove runtime properties?",
        "No",
        "Yes, during assignment",
        "Only when strict is true",
        "Only inside interfaces",
        "Pick derives a static type and does not transform the object by itself.",
        "Assignment does not filter fields.",
        "Strictness does not add runtime filtering.",
        "Interfaces do not change erasure."
      ],
      [
        "A settings reader accepts an unchecked user key as keyof Settings. What is missing?",
        "Runtime key validation",
        "Only an alias for keyof",
        "Only a const annotation",
        "Only a promise wrapper",
        "The assertion does not prove the external key belongs to the intended allowed set.",
        "Aliasing does not inspect input.",
        "Const does not validate its value.",
        "Promises do not validate keys."
      ],
      [
        "A patch is typed Partial<User> and includes role. What must still be enforced?",
        "Authorized update fields",
        "Only JSON indentation",
        "Only property order",
        "Only type alias naming",
        "A partial static shape does not authorize privileged field changes.",
        "Whitespace does not establish permission.",
        "Ordering does not establish authority.",
        "Names do not restrict server effects."
      ],
      [
        "A generic constraint promises length: number. What can code safely assume from that alone?",
        "A numeric length member",
        "Every Array mutation method",
        "A DOM node identity",
        "A nonempty collection",
        "The constraint provides that member, not every capability of arrays or nodes.",
        "A length-bearing object need not be an array.",
        "The constraint does not imply DOM identity.",
        "Length can be zero."
      ],
      [
        "A library wants return types specific to each selected key. Which relation fits?",
        "K extends keyof T and T[K]",
        "Only string and any",
        "Only unknown and never",
        "Only an untyped dictionary",
        "A constrained key parameter and indexed result preserve key-value relationships.",
        "Any loses specificity.",
        "These do not encode the needed relation.",
        "Untyped dictionaries lose useful information."
      ],
      [
        "A public view is declared Readonly<Pick<Internal, Keys>>. What does this not establish?",
        "Runtime data sanitization",
        "A selected static member set",
        "A readonly checked view",
        "A derived type expression",
        "Utility types do not implement runtime filtering, deep freezing or input validation.",
        "Pick can select members in the type.",
        "Readonly applies a checked view.",
        "The expression is a valid type derivation."
      ]
    ],
    "mistakes": [
      "Using keyof assertions to trust arbitrary external field names.",
      "Treating Partial as permission to update privileged fields."
    ],
    "takeaways": [
      "Preserve key-to-value relationships with constraints.",
      "Keep utility type views separate from runtime transformations and authority."
    ],
    "prerequisite_note": "Complete JavaScript Fundamentals first. Use values, functions and object references from that course; TypeScript adds compile-time analysis rather than replacing JavaScript runtime semantics."
  },
  {
    "id": "ts-tooling-diagnostics",
    "comp": "m3.c2",
    "title": "Configure strict checking and read compiler diagnostics",
    "introduction": "A team migrates a JavaScript utility into TypeScript. A green JavaScript execution is useful runtime evidence, but it cannot replace compiling the typed source with the actual project settings and interpreting the reported errors.",
    "sections": [
      {
        "heading": "Tsconfig defines the checking environment",
        "paragraphs": [
          "A tsconfig.json defines the project inputs and compiler options. Strict enables a family of stronger checks, including strictNullChecks and noImplicitAny; some useful checks such as noUncheckedIndexedAccess and exactOptionalPropertyTypes are separate opt-ins. Review the actual effective configuration rather than assuming a single flag covers every desired property.",
          "Target affects emitted language compatibility and default library selection. Lib describes available API declarations, not runtime polyfills. Module and moduleResolution must fit the execution or bundling environment. Setting a DOM library can allow document references to type-check without creating document in Node, just as a Promise declaration does not install a runtime implementation."
        ]
      },
      {
        "heading": "Classify the error before changing the code",
        "paragraphs": [
          "Read the diagnostic location, expected type and actual type. Ask whether the source contains a real bug, the declared contract is wrong, or project configuration is mismatched. Do not silence every error with any, a non-null assertion or disabled strictness. Use noEmitOnError or an equivalent build gate when erroneous output must not be produced.",
          "The worked fixture contains a deliberately incompatible assignment protected by @ts-expect-error. The real compiler must find an error at that line; if the expected diagnostic disappears, the directive itself becomes an error. The remaining valid code then runs. This verifies a specific static negative case without claiming that executing JavaScript alone checked TypeScript."
        ]
      }
    ],
    "worked": {
      "lang": "typescript",
      "code": "// @ts-expect-error: this assignment must be rejected as incompatible\nconst invalid: number = \"not-a-number\";\nconst valid: number = 4;\nconsole.log(valid * 2);",
      "expect": "8",
      "problem": "Configure strict checking and read compiler diagnostics. Compile the actual TypeScript fixture under strict checking, then inspect its runtime output.",
      "steps": [
        "Identify the declared input and output types.",
        "Run the pinned compiler with strict checking and emit only after successful checking.",
        "Execute the emitted JavaScript and compare the observed output with the declared result."
      ],
      "explanation": "The example uses the real TypeScript compiler and emitted JavaScript. It does not validate arbitrary network data or prove browser interaction; static annotations are erased and runtime boundaries need their own checks."
    },
    "quiz": [
      [
        "Which tool checks TypeScript static compatibility?",
        "The TypeScript compiler",
        "Node execution alone",
        "JSON.stringify",
        "A CSS preprocessor",
        "The compiler analyzes TypeScript types under its configured options.",
        "Running emitted JavaScript does not check erased types.",
        "Serialization is not type analysis.",
        "CSS processing does not check TypeScript."
      ],
      [
        "What does noEmitOnError control?",
        "Emitting when errors exist",
        "Browser cookie lifetime",
        "Server authorization order",
        "Runtime object freezing",
        "The option prevents output emission when compiler errors are reported.",
        "Cookies are unrelated.",
        "Type checking does not implement permission order.",
        "No freeze is implied."
      ],
      [
        "Does adding DOM to lib create document inside Node?",
        "No",
        "Yes, globally always",
        "Only with strict true",
        "Only with readonly types",
        "Lib supplies declarations, not an actual browser DOM implementation.",
        "Declarations do not create runtime APIs.",
        "Strictness does not install document.",
        "Readonly is unrelated."
      ],
      [
        "A project disables strict to hide undefined errors. What should reviewers first inspect?",
        "The missing-value contract",
        "Only diagnostic font size",
        "Only source line count",
        "Only variable capitalization",
        "The errors may reveal a real absence path that needs handling rather than suppression.",
        "Display formatting does not fix behavior.",
        "Line count is not a contract.",
        "Capitalization does not prove presence."
      ],
      [
        "A @ts-expect-error line becomes valid after a refactor. What should the compiler report?",
        "An unused expectation diagnostic",
        "Guaranteed runtime success only",
        "An automatic server rollback",
        "A generated null check",
        "The directive expects a diagnostic on the next line and is itself flagged if none occurs.",
        "The check is static rather than a runtime success guarantee.",
        "No server effect exists.",
        "The directive does not insert checks."
      ],
      [
        "A team enables strict and assumes indexed reads can never be undefined. Which option needs separate consideration?",
        "noUncheckedIndexedAccess",
        "Only sourceMap",
        "Only pretty",
        "Only removeComments",
        "Unchecked indexed access has its own compiler option beyond the basic strict family.",
        "Source maps aid debugging rather than this check.",
        "Pretty changes diagnostic formatting.",
        "Comment removal does not change indexed types."
      ],
      [
        "A function compiles against a modern API declaration but fails on an older runtime. What was not provided by types?",
        "A runtime implementation",
        "A static API declaration",
        "A compiler-visible signature",
        "A chosen library configuration",
        "Declarations and targets do not automatically install missing APIs or polyfills.",
        "Those can have been present during checking.",
        "A signature can be known statically.",
        "Configuration can be explicit yet runtime support absent."
      ],
      [
        "A production build runs plain Node on JavaScript fixtures and calls TypeScript verified. What evidence is missing?",
        "Real TypeScript checking",
        "Only another console log",
        "Only a file rename",
        "Only a JSON status report",
        "TypeScript claims require the real compiler and relevant settings, not execution of a language with erased types.",
        "Logging adds no type analysis.",
        "Renaming does not run the checker.",
        "Reports must reflect actual compilation."
      ]
    ],
    "mistakes": [
      "Treating API declarations as runtime polyfills.",
      "Silencing errors before understanding the source and configuration contract."
    ],
    "takeaways": [
      "Compile with the relevant effective configuration.",
      "Use negative compiler cases and runtime checks as distinct evidence."
    ],
    "prerequisite_note": "Complete JavaScript Fundamentals first. Use values, functions and object references from that course; TypeScript adds compile-time analysis rather than replacing JavaScript runtime semantics."
  }
];
module.exports=course('typescript-fundamentals',units,[
  {
    "id": "ts-types",
    "title": "TypeScript Handbook: Everyday Types",
    "url": "https://github.com/microsoft/TypeScript-Website/blob/a93dd416c393cbc7570b829a9e0c753b2678249f/packages/documentation/copy/en/handbook-v2/Everyday%20Types.md",
    "source": {
      "repo": "microsoft/TypeScript-Website",
      "commit": "a93dd416c393cbc7570b829a9e0c753b2678249f",
      "path": "packages/documentation/copy/en/handbook-v2/Everyday Types.md",
      "verification": "Pinned official TypeScript documentation source inspected against the lesson claims; actual fixtures require the pinned compiler."
    }
  },
  {
    "id": "ts-objects",
    "title": "TypeScript Handbook: Object Types",
    "url": "https://github.com/microsoft/TypeScript-Website/blob/a93dd416c393cbc7570b829a9e0c753b2678249f/packages/documentation/copy/en/handbook-v2/Object%20Types.md",
    "source": {
      "repo": "microsoft/TypeScript-Website",
      "commit": "a93dd416c393cbc7570b829a9e0c753b2678249f",
      "path": "packages/documentation/copy/en/handbook-v2/Object Types.md",
      "verification": "Pinned official TypeScript documentation source inspected against the lesson claims; actual fixtures require the pinned compiler."
    }
  },
  {
    "id": "ts-narrow",
    "title": "TypeScript Handbook: Narrowing",
    "url": "https://github.com/microsoft/TypeScript-Website/blob/a93dd416c393cbc7570b829a9e0c753b2678249f/packages/documentation/copy/en/handbook-v2/Narrowing.md",
    "source": {
      "repo": "microsoft/TypeScript-Website",
      "commit": "a93dd416c393cbc7570b829a9e0c753b2678249f",
      "path": "packages/documentation/copy/en/handbook-v2/Narrowing.md",
      "verification": "Pinned official TypeScript documentation source inspected against the lesson claims; actual fixtures require the pinned compiler."
    }
  },
  {
    "id": "ts-generics",
    "title": "TypeScript Handbook: Generics",
    "url": "https://github.com/microsoft/TypeScript-Website/blob/a93dd416c393cbc7570b829a9e0c753b2678249f/packages/documentation/copy/en/handbook-v2/Type%20Manipulation/Generics.md",
    "source": {
      "repo": "microsoft/TypeScript-Website",
      "commit": "a93dd416c393cbc7570b829a9e0c753b2678249f",
      "path": "packages/documentation/copy/en/handbook-v2/Type Manipulation/Generics.md",
      "verification": "Pinned official TypeScript documentation source inspected against the lesson claims; actual fixtures require the pinned compiler."
    }
  },
  {
    "id": "ts-options",
    "title": "TypeScript Handbook: Compiler Options",
    "url": "https://github.com/microsoft/TypeScript-Website/blob/a93dd416c393cbc7570b829a9e0c753b2678249f/packages/tsconfig-reference/copy/en/options/strict.md",
    "source": {
      "repo": "microsoft/TypeScript-Website",
      "commit": "a93dd416c393cbc7570b829a9e0c753b2678249f",
      "path": "packages/tsconfig-reference/copy/en/options/strict.md",
      "verification": "Pinned official TypeScript documentation source inspected against the lesson claims; actual fixtures require the pinned compiler."
    }
  }
]);
