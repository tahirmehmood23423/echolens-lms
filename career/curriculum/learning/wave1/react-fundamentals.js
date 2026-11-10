'use strict';
const {course}=require('./web-helper');
module.exports=course('react-fundamentals',[
  {
    "id": "react-component-props",
    "comp": "m1.c1",
    "title": "Compose components with explicit read-only props",
    "introduction": "A course card shows a lesson title and duration. A reusable component should receive those values through a clear interface rather than reach into unrelated global state or mutate its caller’s object.",
    "sections": [
      {
        "heading": "Components describe a view for given inputs",
        "paragraphs": [
          "A function component receives props and returns renderable React content. Component names begin with a capital letter in JSX so they are distinguished from built-in element names such as section and button. Treat props as read-only snapshots: a child should request a change through a callback rather than mutate an incoming object. Component composition lets a page combine smaller units with specific responsibilities.",
          "Keep rendering pure relative to external state. The same inputs should describe the same output, and rendering should not perform network writes or subscribe to external systems. React may render more than once or discard work; an irreversible operation triggered while computing markup can therefore occur at the wrong time."
        ]
      },
      {
        "heading": "Children and data flow are deliberate APIs",
        "paragraphs": [
          "Pass data down through props and use children for nested content when that makes the component interface clearer. A component is not a string replacement macro: it has identity and lifecycle in a real React tree. Choose semantic native elements so the UI still has meaningful headings, links and controls, and handle authority on the server rather than trusting a prop named isAdmin.",
          "The worked fixture uses actual React createElement and renderToStaticMarkup to compose a card with caller-supplied text. React escapes the title in the text context. It verifies server markup only; no client events, state transitions, mounting, focus or hydration are exercised."
        ]
      }
    ],
    "worked": {
      "lang": "javascript-react",
      "code": "const React = require(\"react\");\nconst {renderToStaticMarkup} = require(\"react-dom/server\");\nfunction Card({title}) { return React.createElement(\"article\", null, React.createElement(\"h2\", null, title)); }\nconsole.log(renderToStaticMarkup(React.createElement(Card, {title: \"Learn <React>\"})));",
      "expect": "<article><h2>Learn &lt;React&gt;</h2></article>",
      "problem": "Compose components with explicit read-only props using a synthetic local fixture.",
      "steps": [
        "Read the declared component or pure state transformation.",
        "Execute the fixture with the stated React SSR or JavaScript model boundary.",
        "Compare the concrete output and identify the browser behaviors the fixture did not exercise."
      ],
      "explanation": "This executes real React and ReactDOM server rendering with createElement, not a handwritten HTML renderer. SSR produces initial markup; it does not mount a browser, run effects, dispatch events, preserve client component identity or prove hydration."
    },
    "quiz": [
      [
        "What does a function component ordinarily receive as input?",
        "Props",
        "An automatic SQL cursor",
        "Only a DOM id",
        "Only a CSS stylesheet",
        "Props carry the inputs supplied by the parent component.",
        "Database access is not automatic.",
        "Inputs can include many declared values.",
        "Styling is not its only input."
      ],
      [
        "How should a component treat incoming props?",
        "As read-only inputs",
        "As its private mutable store",
        "As server authorization",
        "As arbitrary HTML code",
        "Props are snapshots supplied by the parent and should not be mutated by the child.",
        "Ownership remains outside the child’s local mutation.",
        "Client props cannot authorize server operations.",
        "Text props should not be treated as executable markup."
      ],
      [
        "What does composition enable?",
        "Combining focused components",
        "Automatic payment rollback",
        "Automatic schema validation",
        "Removing all HTML semantics",
        "Composition builds a larger view from smaller components with clear responsibilities.",
        "No transaction guarantee follows.",
        "Validation requires deliberate code.",
        "Semantic HTML still matters."
      ],
      [
        "A card changes props.lesson.title directly. What should its design use instead?",
        "A requested parent update",
        "Only a shorter prop name",
        "Only a new CSS class",
        "Only repeated mutation",
        "The owner should update data through an intentional callback or state path.",
        "Names do not fix ownership.",
        "Styling does not establish data flow.",
        "Repeating mutation preserves the defect."
      ],
      [
        "A component sends a purchase request while computing its return value. What is the problem?",
        "A render-time side effect",
        "Only an overly short function",
        "Only missing semicolons",
        "Only a capitalized name",
        "Rendering may repeat or be discarded, so irreversible effects do not belong in render calculation.",
        "Length is not the issue.",
        "Formatting does not fix effects.",
        "Capitalization is normal for components."
      ],
      [
        "A parent passes ordinary text containing angle brackets. What does React text rendering ordinarily do?",
        "Escapes it as text",
        "Executes it as JavaScript",
        "Always parses it as raw HTML",
        "Grants it server permission",
        "React escapes normal text children rather than treating them as raw HTML.",
        "Text is not evaluated as code.",
        "Raw HTML requires a separate dangerous API boundary.",
        "Rendering does not grant authority."
      ],
      [
        "A server receives isAdmin from a React prop. What must it still check?",
        "Authenticated permission",
        "Only the prop’s spelling",
        "Only the JSX indentation",
        "Only the component name",
        "Client-controlled UI state is not authoritative permission evidence.",
        "Names are not trust.",
        "Whitespace does not establish access.",
        "Component identity does not authorize requests."
      ],
      [
        "The SSR card prints escaped markup. Which claim still needs evidence?",
        "Browser mounting and interaction",
        "The returned server string",
        "The title’s escaped characters",
        "Actual server-renderer execution",
        "Static rendering does not mount an interactive browser tree.",
        "The string is directly observed.",
        "The escape result is in the output.",
        "The actual renderer is invoked."
      ]
    ],
    "mistakes": [
      "Mutating props rather than asking the data owner to update.",
      "Performing irreversible effects while rendering."
    ],
    "takeaways": [
      "Use focused components and explicit props.",
      "Keep render calculation pure and distinguish SSR evidence from browser interaction."
    ],
    "prerequisite_note": "Complete JavaScript DOM and Asynchronous Programming first. Bring function, reference, promise and lifecycle vocabulary; distinguish React component behavior from DOM APIs and from the deliberately bounded fixture."
  },
  {
    "id": "react-jsx-expressions",
    "comp": "m1.c1",
    "title": "Read JSX as expressions and preserve render purity",
    "introduction": "A lesson header combines text, an expression and an optional badge. JSX makes this readable, but it is still a description compiled into React operations rather than a browser accepting arbitrary source text as HTML.",
    "sections": [
      {
        "heading": "JSX is syntax around JavaScript expressions",
        "paragraphs": [
          "JSX commonly uses braces to embed JavaScript expressions as children or prop values. Strings, numbers, React elements and arrays of renderable children are common content; a plain object is not automatically a valid child describing a visible label. Use className for CSS classes in React DOM JSX and close tags consistently. A JSX return often needs one enclosing element or a Fragment.",
          "JSX transforms depend on the toolchain. The modern transform need not require a React import solely for JSX syntax, but the build must still be configured correctly. createElement is an authentic API for producing React elements without JSX compilation; using it in a fixture does not prove a project’s JSX transform works."
        ]
      },
      {
        "heading": "Event props receive functions",
        "paragraphs": [
          "Use onClick={handleSave} or a deliberate wrapper such as onClick={() => save(id)}. Writing onClick={save(id)} calls save during render and passes its return value, which usually violates the desired event contract. The same purity rule applies to any expression evaluated while computing the component output.",
          "The example constructs equivalent React elements with createElement and supplies computed children. Actual React SSR renders the semantic section and heading. It does not compile JSX, attach event handlers to a browser node or test a bundler, so JSX syntax and event behavior need their own toolchain and client checks."
        ]
      }
    ],
    "worked": {
      "lang": "javascript-react",
      "code": "const React = require(\"react\");\nconst {renderToStaticMarkup} = require(\"react-dom/server\");\nconst title = \"Functions\";\nconst completed = 2;\nconst view = React.createElement(\"section\", {className: \"lesson\"}, React.createElement(\"h2\", null, title), React.createElement(\"p\", null, `${completed} completed`));\nconsole.log(renderToStaticMarkup(view));",
      "expect": "<section class=\"lesson\"><h2>Functions</h2><p>2 completed</p></section>",
      "problem": "Read JSX as expressions and preserve render purity using a synthetic local fixture.",
      "steps": [
        "Read the declared component or pure state transformation.",
        "Execute the fixture with the stated React SSR or JavaScript model boundary.",
        "Compare the concrete output and identify the browser behaviors the fixture did not exercise."
      ],
      "explanation": "This executes real React and ReactDOM server rendering with createElement, not a handwritten HTML renderer. SSR produces initial markup; it does not mount a browser, run effects, dispatch events, preserve client component identity or prove hydration."
    },
    "quiz": [
      [
        "What do JSX braces commonly contain?",
        "JavaScript expressions",
        "Only raw CSS files",
        "Only SQL statements",
        "Only HTML comments",
        "Braces embed JavaScript expressions in the relevant JSX positions.",
        "CSS files are not the general expression contract.",
        "SQL is not executed by JSX.",
        "HTML comments are not JSX expression values."
      ],
      [
        "Which React DOM JSX prop expresses a CSS class?",
        "className",
        "classname always",
        "cssClass always",
        "classList as a string",
        "ClassName is the normal JSX DOM property for CSS classes.",
        "Lowercase classname is not the standard prop spelling.",
        "CssClass is not the standard DOM prop.",
        "ClassList is a DOM interface rather than this string prop."
      ],
      [
        "Which event expression passes a handler without invoking it immediately?",
        "onClick={handleSave}",
        "onClick={handleSave()}",
        "onClick={save(id)}",
        "onClick={alert(\"saved\")}",
        "The function reference is supplied for later event handling.",
        "The parentheses invoke the function during evaluation.",
        "That expression calls save during render.",
        "Alert executes during evaluation."
      ],
      [
        "A lesson component tries to render an ordinary object as its title child. What should it render instead?",
        "A defined renderable field",
        "Only the object’s type alias",
        "Only a renamed variable",
        "Only a larger object",
        "Choose the intended string or other valid React content rather than a plain object.",
        "Type aliases are erased.",
        "Names do not make objects renderable.",
        "Size does not establish content semantics."
      ],
      [
        "A save action executes while a button renders. Which source pattern is suspect?",
        "Passing a call result as onClick",
        "Passing a function reference",
        "Passing a wrapper function",
        "Declaring a pure local constant",
        "Calling the action in the prop expression runs it during rendering.",
        "A reference can defer execution.",
        "A wrapper can defer the call to an event.",
        "Pure local computation is appropriate."
      ],
      [
        "A team tests createElement output and claims its JSX compiler is configured. What is missing?",
        "Actual JSX transform evidence",
        "Only another HTML string",
        "Only a component display name",
        "Only response.ok",
        "CreateElement bypasses JSX syntax transformation and cannot prove the compiler setup.",
        "More strings do not run the transform.",
        "Naming is unrelated.",
        "HTTP status does not configure JSX."
      ],
      [
        "A component returns adjacent JSX siblings without a wrapper. What syntax can group them?",
        "A Fragment",
        "Only an import alias",
        "Only a CSS variable",
        "Only a promise rejection",
        "A Fragment groups children without requiring an extra DOM element.",
        "Aliases do not group syntax.",
        "CSS does not repair JSX structure.",
        "Rejections are unrelated."
      ],
      [
        "A JSX expression starts a network mutation to build a label. What principle is violated?",
        "Render purity",
        "Only component capitalization",
        "Only tab width",
        "Only optional chaining syntax",
        "Render evaluation must not initiate irreversible external effects merely to calculate markup.",
        "Naming is not the side-effect issue.",
        "Whitespace is unrelated.",
        "Optional chaining is a different operation."
      ]
    ],
    "mistakes": [
      "Calling the action in an event prop instead of passing a handler.",
      "Assuming a createElement fixture checks a JSX build pipeline."
    ],
    "takeaways": [
      "Treat JSX braces as evaluated JavaScript.",
      "Verify transform, render output and browser events at their respective boundaries."
    ],
    "prerequisite_note": "Complete JavaScript DOM and Asynchronous Programming first. Bring function, reference, promise and lifecycle vocabulary; distinguish React component behavior from DOM APIs and from the deliberately bounded fixture."
  },
  {
    "id": "react-lists-keys",
    "comp": "m1.c2",
    "title": "Render lists with stable identity and intentional conditions",
    "introduction": "A student reorders saved learning goals while editing one row. If rows use array indices as keys, local input state can appear attached to the wrong goal after the order changes.",
    "sections": [
      {
        "heading": "Keys identify siblings across renders",
        "paragraphs": [
          "Use a stable key from the data, such as a persistent goal id, when mapping records to elements. Keys need to be unique among the relevant siblings, not globally across the entire application. They help React match identity across insertions, deletions and reordering. Generating random keys during each render destroys stability and can force remounting.",
          "A key is special React metadata and is not supplied as an ordinary prop to the child. If the child needs the id, pass id explicitly as well. An index can be acceptable for a truly static list with no identity-sensitive changes, but it is not a safe default for an editable reordered list. Choose based on the identity requirement rather than silencing a warning."
        ]
      },
      {
        "heading": "Conditions must match the intended values",
        "paragraphs": [
          "Use explicit branches or a ternary for content that should appear only under a condition. The expression count && <Badge /> returns the left operand when it is falsy; if count is zero, React can render that zero rather than render nothing. Prefer count > 0 && <Badge /> when positivity is the intended condition. Missing, loading and empty states deserve distinct meanings where the interface requires them.",
          "The fixture renders two list items and an explicit empty-state condition through real SSR. Server HTML does not expose keys as normal attributes and does not perform a subsequent reorder. Stable identity and preservation of live input state still require an actual client-renderer test."
        ]
      }
    ],
    "worked": {
      "lang": "javascript-react",
      "code": "const React = require(\"react\");\nconst {renderToStaticMarkup} = require(\"react-dom/server\");\nconst goals = [{id: \"g1\", title: \"Read\"}, {id: \"g2\", title: \"Practice\"}];\nconst list = React.createElement(\"ul\", null, goals.map(goal => React.createElement(\"li\", {key: goal.id}, goal.title)));\nconsole.log(renderToStaticMarkup(list));\nconsole.log(renderToStaticMarkup(React.createElement(\"p\", null, goals.length > 0 ? \"Goals ready\" : \"No goals\")));",
      "expect": "<ul><li>Read</li><li>Practice</li></ul>\n<p>Goals ready</p>",
      "problem": "Render lists with stable identity and intentional conditions using a synthetic local fixture.",
      "steps": [
        "Read the declared component or pure state transformation.",
        "Execute the fixture with the stated React SSR or JavaScript model boundary.",
        "Compare the concrete output and identify the browser behaviors the fixture did not exercise."
      ],
      "explanation": "This executes real React and ReactDOM server rendering with createElement, not a handwritten HTML renderer. SSR produces initial markup; it does not mount a browser, run effects, dispatch events, preserve client component identity or prove hydration."
    },
    "quiz": [
      [
        "What should a list key normally represent?",
        "Stable sibling identity",
        "A random render timestamp",
        "Only the display position",
        "A global CSS selector",
        "Keys help React match the same logical item among siblings across changes.",
        "Changing timestamps destroy stability.",
        "Position can change during reordering.",
        "Keys are not CSS selectors."
      ],
      [
        "Does a child receive key as an ordinary prop?",
        "No",
        "Yes, always",
        "Only if the key is numeric",
        "Only in server output",
        "Key is special React metadata; pass an explicit id prop if needed.",
        "It is not an ordinary child prop.",
        "Its value type does not change that rule.",
        "SSR does not make it a normal prop."
      ],
      [
        "Which value can unexpectedly appear from count && element when count is zero?",
        "0",
        "Always an empty string",
        "Always the element",
        "Always a rejected promise",
        "The expression evaluates to zero, which React can render as text.",
        "It need not become an empty string.",
        "The right side is not chosen for zero.",
        "No promise is implied."
      ],
      [
        "A reorderable form uses array indices as keys and typed input follows the wrong row. What should keys use?",
        "Stable record ids",
        "Only the new index",
        "Only a random value per render",
        "Only the title’s first letter",
        "Persistent identity lets React associate state with the intended record across reordering.",
        "Position changes with order.",
        "Random values cause unstable identity.",
        "Initial letters may collide and change."
      ],
      [
        "A list generates Math.random keys each render. What is the likely consequence?",
        "Unstable remounting identity",
        "Guaranteed state preservation",
        "Automatic deduplication",
        "Stronger server authorization",
        "New keys tell React these are different identities, potentially remounting components.",
        "Stability is lost.",
        "Keys do not deduplicate domain data.",
        "Client keys do not authorize requests."
      ],
      [
        "Two independent lists each contain key lesson-1. Is that alone invalid?",
        "No, uniqueness is among siblings",
        "Yes, keys must be global UUIDs",
        "Yes, all keys must be numbers",
        "Only if CSS is absent",
        "Key uniqueness is scoped to the relevant sibling list.",
        "Global uniqueness is not required.",
        "Strings are valid keys.",
        "CSS does not set key scope."
      ],
      [
        "A client has no results yet because a request is pending. What should it avoid claiming?",
        "Confirmed empty results",
        "A loading state",
        "An unresolved outcome",
        "A pending request",
        "Pending and successfully empty are different outcomes and should not be confused.",
        "Loading can be appropriate.",
        "Unresolved is accurate.",
        "The request can still be pending."
      ],
      [
        "The SSR list fixture prints correct li text. What is not demonstrated?",
        "Client reorder state preservation",
        "The server’s list markup",
        "The text labels in output",
        "The createElement mapping call",
        "SSR does not execute a later client reconciliation with live row state.",
        "The markup is observed.",
        "The labels are rendered.",
        "The call actually runs."
      ]
    ],
    "mistakes": [
      "Using random keys or positional keys for identity-sensitive reorderings.",
      "Rendering zero accidentally through an unqualified && expression."
    ],
    "takeaways": [
      "Use stable data identity among siblings.",
      "Keep loading, empty and conditional output semantics explicit."
    ],
    "prerequisite_note": "Complete JavaScript DOM and Asynchronous Programming first. Bring function, reference, promise and lifecycle vocabulary; distinguish React component behavior from DOM APIs and from the deliberately bounded fixture."
  },
  {
    "id": "react-state-snapshots",
    "comp": "m2.c1",
    "title": "Read state as a render snapshot and use functional updates",
    "introduction": "A counter handles one click by requesting three increments. Reading the same rendered count three times does not observe three intermediate renders, so update form matters.",
    "sections": [
      {
        "heading": "State belongs to a component position",
        "paragraphs": [
          "Use useState at the top level of a function component or custom hook, following the Rules of Hooks. Its state value is a snapshot for that render. Calling the setter queues a requested update; it does not replace the local variable already captured by the current handler. React preserves state according to component identity and tree position, subject to keys and component type.",
          "If the next value depends on pending previous state, use a functional updater such as setCount(previous => previous + 1). Multiple functional updates can be composed against pending values. Repeating setCount(count + 1) in a single handler uses the same captured count expression each time, so it does not express three chained increments."
        ]
      },
      {
        "heading": "Updaters must stay pure",
        "paragraphs": [
          "An updater should calculate a value without side effects. React can call updater functions more than once in development checks, so network writes or mutation inside an updater can create misleading or duplicated effects. Event handlers are the place for user-triggered action coordination, with backend repeat safety where needed; rendering and updater calculation should stay pure.",
          "The fixture applies three ordinary JavaScript updater functions to a number and compares that with three replacements computed from one snapshot. It models the value algebra only and is not React’s queue implementation. It proves no batching policy, event timing, rerender count or concurrent rendering behavior."
        ]
      }
    ],
    "worked": {
      "lang": "javascript",
      "code": "const snapshot = 0;\nconst replacements = [snapshot + 1, snapshot + 1, snapshot + 1];\nconst updates = [n => n + 1, n => n + 1, n => n + 1];\nconsole.log(replacements.at(-1));\nconsole.log(updates.reduce((state, update) => update(state), snapshot));",
      "expect": "1\n3",
      "problem": "Read state as a render snapshot and use functional updates using a synthetic local fixture.",
      "steps": [
        "Read the declared component or pure state transformation.",
        "Execute the fixture with the stated React SSR or JavaScript model boundary.",
        "Compare the concrete output and identify the browser behaviors the fixture did not exercise."
      ],
      "explanation": "This executes a plain JavaScript state or request-coordination model. It is not a React renderer and does not prove hook scheduling, component rerenders, effect lifecycles, DOM events or browser behavior. Use it to trace the narrow algorithm, then verify integration in a real rendered application."
    },
    "quiz": [
      [
        "What is a state value inside one render’s event handler?",
        "A captured render snapshot",
        "A live variable changed by every setter",
        "A server database lock",
        "An automatic mutable reference",
        "The handler closes over the value from its render.",
        "A setter does not rewrite that captured local value.",
        "State is not a database lock.",
        "A state value is not automatically a ref."
      ],
      [
        "Which updater expresses dependence on pending previous count?",
        "setCount(n => n + 1)",
        "setCount(count + 1) repeated blindly",
        "count++ with no setter",
        "Mutating props.count",
        "A functional updater receives the pending value for the next calculation.",
        "Repeated replacements can share one snapshot.",
        "Direct local mutation does not request state update.",
        "Props should not be mutated."
      ],
      [
        "Where should useState normally be called?",
        "At component or custom-hook top level",
        "Inside an arbitrary click loop",
        "Inside a conditional return branch",
        "Inside a nested event callback",
        "Hooks must follow their ordering rules at the appropriate top level.",
        "Loops can change call order.",
        "Conditional hooks violate the rules.",
        "Handlers are not hook render calls."
      ],
      [
        "A handler requests count + 1 three times from count zero. Why might the result be one?",
        "All replacements use one snapshot",
        "Every setter ran synchronously inline",
        "React always ignores two setters",
        "JavaScript numbers are immutable errors",
        "Each expression was calculated from the same captured count rather than pending results.",
        "Captured state does not change inline.",
        "The issue is the requested values, not arbitrary ignoring.",
        "Numeric immutability does not prohibit state updates."
      ],
      [
        "A functional updater sends analytics before returning a new number. What should change?",
        "Use a pure updater",
        "Only rename its parameter",
        "Only add a longer timeout",
        "Only call it more often",
        "Updater calculations should be pure and may be invoked again during checks.",
        "Names do not remove effects.",
        "Delay does not establish purity.",
        "More calls can duplicate effects."
      ],
      [
        "A counter setter is followed immediately by console.log(count) in the same handler. What is logged from count?",
        "The captured render value",
        "Guaranteed newly committed state",
        "The server’s latest count",
        "An automatically awaited promise",
        "The local variable still belongs to the current render snapshot.",
        "The setter does not rewrite it.",
        "No server lookup is implied.",
        "State setters do not return a completion promise."
      ],
      [
        "A component is given a new key intentionally. What can happen to its state?",
        "It is reset with new identity",
        "It is always deeply cloned",
        "It moves into props automatically",
        "It becomes global server state",
        "A changed key can make React treat the position as a different component identity.",
        "Cloning is not the identity rule.",
        "State is not automatically converted to props.",
        "No server migration occurs."
      ],
      [
        "The pure updater model returns three. What is still unverified?",
        "React event and render scheduling",
        "The reducer’s numeric result",
        "The supplied updater functions",
        "The original snapshot value",
        "A plain JavaScript reduction does not execute React’s actual state lifecycle.",
        "That result is executed.",
        "Those functions run.",
        "The starting value is explicit."
      ]
    ],
    "mistakes": [
      "Expecting a setter to mutate the current handler’s captured state.",
      "Performing side effects inside a functional updater."
    ],
    "takeaways": [
      "Use functional updates when the next value depends on pending state.",
      "Treat state queue models as algorithm traces, not renderer evidence."
    ],
    "prerequisite_note": "Complete JavaScript DOM and Asynchronous Programming first. Bring function, reference, promise and lifecycle vocabulary; distinguish React component behavior from DOM APIs and from the deliberately bounded fixture."
  },
  {
    "id": "react-state-collections",
    "comp": "m2.c1",
    "title": "Update object and array state without mutating prior snapshots",
    "introduction": "A learning-goal editor changes one item in a list while other components still read the prior render’s values. Mutating the existing nested record can corrupt that shared snapshot and make change detection unreliable.",
    "sections": [
      {
        "heading": "Create new values along the changed path",
        "paragraphs": [
          "Treat state objects and arrays as read-only snapshots. For an object update, construct a new object and preserve unchanged fields deliberately. Spread is shallow: copying the outer object does not clone nested arrays or records. To change a nested record, copy the relevant objects along that path rather than modifying a reference shared with the previous snapshot.",
          "For collections, map can replace a selected item, filter can remove items and spread can add items without mutating the original array. Match records with stable domain ids rather than array positions when identity matters. Methods such as sort, reverse and splice mutate the array unless used on an intentional copy; consider nonmutating alternatives supported by the runtime."
        ]
      },
      {
        "heading": "Preserve references where no change is needed",
        "paragraphs": [
          "Return unchanged item references for unaffected rows, and construct a new changed record. This is a clarity and state-correctness technique; it does not imply that every component is automatically memoized or that a new reference alone guarantees optimal performance. Measure rendering problems separately instead of deep-cloning the entire application on every edit.",
          "The fixture uses a real map transformation on synthetic records, changes one record and compares references and values. It does not invoke useState, mount a React tree or prove rerender behavior. The output establishes the changed-path copying algorithm, leaving renderer integration to client tests."
        ]
      }
    ],
    "worked": {
      "lang": "javascript",
      "code": "const before = [{id: \"a\", done: false}, {id: \"b\", done: false}];\nconst after = before.map(item => item.id === \"b\" ? {...item, done: true} : item);\nconsole.log(before[1].done, after[1].done);\nconsole.log(before === after, before[0] === after[0], before[1] === after[1]);",
      "expect": "false true\nfalse true false",
      "problem": "Update object and array state without mutating prior snapshots using a synthetic local fixture.",
      "steps": [
        "Read the declared component or pure state transformation.",
        "Execute the fixture with the stated React SSR or JavaScript model boundary.",
        "Compare the concrete output and identify the browser behaviors the fixture did not exercise."
      ],
      "explanation": "This executes a plain JavaScript state or request-coordination model. It is not a React renderer and does not prove hook scheduling, component rerenders, effect lifecycles, DOM events or browser behavior. Use it to trace the narrow algorithm, then verify integration in a real rendered application."
    },
    "quiz": [
      [
        "What does object spread copy by default?",
        "One shallow level",
        "Every nested object deeply",
        "Every runtime prototype deeply",
        "Every DOM event listener",
        "Spread copies the selected own enumerable properties without recursively cloning referenced values.",
        "Nested references remain shared.",
        "It is not a deep prototype clone.",
        "Listeners are not cloned by object spread."
      ],
      [
        "Which array operation can create a list without selected records?",
        "filter",
        "splice on the original",
        "push on the original",
        "reverse on the original",
        "Filter returns a new array of matching elements without mutating the original array.",
        "Splice mutates the array.",
        "Push mutates the array.",
        "Reverse mutates the array."
      ],
      [
        "How should state snapshots generally be treated?",
        "As read-only values",
        "As a mutable global scratchpad",
        "As server permission grants",
        "As always deeply frozen objects",
        "Updates should construct new values rather than mutate previous render snapshots.",
        "Scratch mutation breaks the snapshot model.",
        "State does not authorize server actions.",
        "React state is not universally deeply frozen."
      ],
      [
        "An editor spreads an outer object then mutates its nested item. What is the problem?",
        "The nested reference is shared",
        "Spread guaranteed a deep clone",
        "The mutation affects only a type alias",
        "Every field was serialized first",
        "Shallow copying leaves the nested object aliased unless it is separately copied.",
        "Deep copying is not spread’s contract.",
        "Types do not own runtime mutation.",
        "No serialization is implied."
      ],
      [
        "A goal list replaces only the matching id through map. What should unchanged records normally retain?",
        "Their original references",
        "Random new identities always",
        "Deleted required fields",
        "A new server permission",
        "Keeping unaffected values unchanged makes the update precise without inventing unrelated changes.",
        "Random identities can harm preservation.",
        "Fields should remain valid.",
        "Updates do not authorize operations."
      ],
      [
        "A component calls state.sort directly before setting the same array. What should be reviewed?",
        "In-place mutation of state",
        "Only alphabetical order",
        "Only the array’s variable name",
        "Only the component filename",
        "Sort mutates its array, including a previous snapshot if it is used directly.",
        "Correct order does not excuse mutation.",
        "Naming does not change semantics.",
        "Files do not determine mutation."
      ],
      [
        "A team deep-clones all application state on each keystroke to improve performance. What should it do first?",
        "Measure precise updates",
        "Assume every clone is faster",
        "Only add random keys",
        "Only disable all input events",
        "Whole-tree cloning can add cost and destroy useful identity; measure the actual issue and update deliberately.",
        "Cloning is not automatically an optimization.",
        "Random keys cause instability.",
        "Disabling interaction is not a fix."
      ],
      [
        "The map fixture preserves the old record and changes the new one. What is not established?",
        "React rerender behavior",
        "The new array reference",
        "The old done value",
        "The replaced record reference",
        "Pure transformation output does not execute React reconciliation or state setters.",
        "The reference comparison runs.",
        "The old field is read.",
        "The changed-path comparison runs."
      ]
    ],
    "mistakes": [
      "Mutating nested data after only a shallow outer copy.",
      "Sorting the original state array in place."
    ],
    "takeaways": [
      "Copy values along the actual changed path.",
      "Measure rendering separately from immutable transformation correctness."
    ],
    "prerequisite_note": "Complete JavaScript DOM and Asynchronous Programming first. Bring function, reference, promise and lifecycle vocabulary; distinguish React component behavior from DOM APIs and from the deliberately bounded fixture."
  },
  {
    "id": "react-lift-state",
    "comp": "m2.c2",
    "title": "Lift shared state to a clear owner and pass callbacks",
    "introduction": "A filter input and a results panel must agree on the selected category. Keeping independent copies in both children allows them to drift apart after an update.",
    "sections": [
      {
        "heading": "One source of truth for shared meaning",
        "paragraphs": [
          "Move state needed by siblings to their closest appropriate common owner. Pass the current value down and pass callbacks through which children can request changes. A controlled child receives the important value from its parent rather than storing an unrelated competing copy. This pattern does not require every transient value in the application to become global state.",
          "Avoid copying props into local state merely to mirror them. That local state may stop following later prop changes, creating unclear ownership. If a component intentionally needs an editable draft separate from a committed value, name and design that distinction explicitly, including when it resets, commits or discards the draft."
        ]
      },
      {
        "heading": "Callbacks communicate intent",
        "paragraphs": [
          "A callback such as onCategoryChange(nextCategory) expresses what the child requests without giving it permission to mutate the parent’s object. The parent applies its rules and updates its state. Keep backend authorization independent from that UI ownership model; a callback’s presence is not authority to perform a protected action.",
          "The worked fixture models one owner receiving a child request and deriving two views from its updated category. It is ordinary JavaScript rather than React’s render cycle. It demonstrates the single-source calculation only; actual callbacks, scheduling, props and interaction need a mounted React integration test."
        ]
      }
    ],
    "worked": {
      "lang": "javascript",
      "code": "let selected = \"all\";\nfunction requestCategory(next) { selected = next; }\nrequestCategory(\"core\");\nconst filterView = {value: selected};\nconst resultsView = {category: selected};\nconsole.log(filterView.value, resultsView.category);",
      "expect": "core core",
      "problem": "Lift shared state to a clear owner and pass callbacks using a synthetic local fixture.",
      "steps": [
        "Read the declared component or pure state transformation.",
        "Execute the fixture with the stated React SSR or JavaScript model boundary.",
        "Compare the concrete output and identify the browser behaviors the fixture did not exercise."
      ],
      "explanation": "This executes a plain JavaScript state or request-coordination model. It is not a React renderer and does not prove hook scheduling, component rerenders, effect lifecycles, DOM events or browser behavior. Use it to trace the narrow algorithm, then verify integration in a real rendered application."
    },
    "quiz": [
      [
        "Where should state shared by siblings often live?",
        "An appropriate common owner",
        "Inside both children independently",
        "Inside a random DOM attribute",
        "Only in a server cookie",
        "A common owner can provide one source of truth and distribute values and callbacks.",
        "Independent copies can drift.",
        "DOM attributes do not define React state ownership.",
        "Not every UI value belongs in a cookie."
      ],
      [
        "What does a callback prop commonly communicate?",
        "A child’s requested action",
        "A right to mutate all parent data",
        "A server admin grant",
        "A new database transaction automatically",
        "The parent can apply its rules when the child requests a change.",
        "It is not blanket mutation authority.",
        "UI callbacks do not grant server privilege.",
        "Calling a function does not inherently create a transaction."
      ],
      [
        "Does lifting one shared value require globalizing all local state?",
        "No",
        "Yes, every value must be global",
        "Only in development",
        "Only for arrays",
        "Place each value at the owner appropriate to its actual consumers and lifecycle.",
        "Globalizing everything is unnecessary.",
        "The ownership principle is not environment-specific.",
        "It applies to many values."
      ],
      [
        "A search box copies query props into state and later ignores parent query changes. What needs clarification?",
        "Ownership and draft policy",
        "Only the textbox width",
        "Only the prop’s letter case",
        "Only a longer callback name",
        "Mirrored state can diverge unless the design explicitly distinguishes draft and committed values.",
        "Width does not establish ownership.",
        "Capitalization does not synchronize values.",
        "Names do not define reset behavior."
      ],
      [
        "Two sibling checkboxes store separate copies of one shared selection. What pattern helps?",
        "Lift the shared selection",
        "Only add two more copies",
        "Only use different colors",
        "Only rename the booleans",
        "A common owner can keep both views consistent through one value and update path.",
        "More copies add synchronization work.",
        "Color does not synchronize state.",
        "Naming does not prevent drift."
      ],
      [
        "A child mutates an incoming settings object instead of using onChange. What is violated?",
        "Owner update boundary",
        "Only HTML validity",
        "Only the default font",
        "Only a fetch timeout",
        "The callback is the intended request path; direct mutation breaks clear state ownership.",
        "Markup may still be valid.",
        "Fonts are unrelated.",
        "No request timeout is implied."
      ],
      [
        "An editor intentionally maintains a draft apart from a saved prop. What should it define?",
        "Reset, commit and discard rules",
        "Only a second variable name",
        "Only a larger local object",
        "Only a random component key",
        "Separate draft state needs explicit transitions and account or record lifecycle behavior.",
        "A name alone does not define transitions.",
        "Size does not establish policy.",
        "Random keys may destroy drafts unintentionally."
      ],
      [
        "The JavaScript owner model yields core in both views. What remains untested?",
        "Mounted React interaction",
        "The assigned category",
        "The two derived fields",
        "The synchronous request function",
        "The model has no React renderer, events or state scheduling.",
        "That value is explicit model state.",
        "Those fields are created.",
        "The function actually executes."
      ]
    ],
    "mistakes": [
      "Mirroring shared props into competing local state without a draft policy.",
      "Moving every UI detail into a global store by default."
    ],
    "takeaways": [
      "Give shared meaning one appropriate owner.",
      "Use callback props to request updates and define intentional draft lifecycles."
    ],
    "prerequisite_note": "Complete JavaScript DOM and Asynchronous Programming first. Bring function, reference, promise and lifecycle vocabulary; distinguish React component behavior from DOM APIs and from the deliberately bounded fixture."
  },
  {
    "id": "react-effect-sync",
    "comp": "m3.c1",
    "title": "Use effects to synchronize external systems after rendering",
    "introduction": "A chat panel must connect to the selected room and disconnect when that room changes or the panel disappears. That synchronization has a lifecycle distinct from calculating which room name to display.",
    "sections": [
      {
        "heading": "Effects connect React to systems outside render",
        "paragraphs": [
          "Use useEffect for synchronization such as a subscription, browser integration or another external system. An effect runs after React commits the relevant client update, with precise timing depending on the kind of work and interaction; do not reduce it to a universal after-paint guarantee. A value that can be computed directly from props or state usually belongs in render calculation rather than an effect that sets more state.",
          "An effect setup can return a cleanup function. When dependencies change, React runs the prior cleanup before the new setup; on unmount it runs the final cleanup. In development Strict Mode, an additional setup-and-cleanup cycle can help reveal missing cleanup. The implementation should tolerate this stress rather than relying on a single setup call forever."
        ]
      },
      {
        "heading": "Dependencies describe reactive inputs",
        "paragraphs": [
          "List every reactive value used by the effect according to the Rules of Hooks and the linter’s analysis. Do not suppress dependency warnings merely to stop reruns; restructure the code or ownership when the effect reads unstable values unnecessarily. An empty dependency list is not a universal promise of exactly one setup across every development lifecycle.",
          "The fixture uses real React SSR to render a component containing useEffect. The effect does not run during server rendering, so the output remains initial markup and the external observation stays false. That is a deliberately narrow omission check, not evidence of browser commit timing, subscription cleanup or development Strict Mode behavior."
        ]
      }
    ],
    "worked": {
      "lang": "javascript-react",
      "code": "const React = require(\"react\");\nconst {renderToStaticMarkup} = require(\"react-dom/server\");\nlet effectObserved = false;\nfunction Room() { React.useEffect(() => { effectObserved = true; }, []); return React.createElement(\"p\", null, \"Room lobby\"); }\nconsole.log(renderToStaticMarkup(React.createElement(Room)));\nconsole.log(effectObserved);",
      "expect": "<p>Room lobby</p>\nfalse",
      "problem": "Use effects to synchronize external systems after rendering using a synthetic local fixture.",
      "steps": [
        "Read the declared component or pure state transformation.",
        "Execute the fixture with the stated React SSR or JavaScript model boundary.",
        "Compare the concrete output and identify the browser behaviors the fixture did not exercise."
      ],
      "explanation": "This executes real React and ReactDOM server rendering with createElement, not a handwritten HTML renderer. SSR produces initial markup; it does not mount a browser, run effects, dispatch events, preserve client component identity or prove hydration."
    },
    "quiz": [
      [
        "What is a common purpose of useEffect?",
        "Synchronizing an external system",
        "Calculating every simple label",
        "Performing every render operation",
        "Replacing all event handlers",
        "Effects coordinate external synchronization after the relevant client commit.",
        "Pure derived labels can be computed in render.",
        "Rendering still describes UI.",
        "User actions can belong in handlers."
      ],
      [
        "What can an effect return for lifecycle cleanup?",
        "A cleanup function",
        "A rendered section always",
        "A second component type",
        "A SQL query string",
        "The returned function cleans up the previous synchronization when appropriate.",
        "Markup belongs in render output.",
        "A component type is not the cleanup contract.",
        "A string does not run cleanup."
      ],
      [
        "Do effects run during React server rendering?",
        "No",
        "Yes, all passive effects",
        "Only if the tag is p",
        "Only for text children",
        "UseEffect does not execute during server rendering.",
        "Client effect setup is omitted.",
        "The tag does not change that.",
        "Text children do not activate effects."
      ],
      [
        "A chat effect connects to a room but never disconnects. What is missing?",
        "Matching cleanup",
        "Only a heading style",
        "Only a new room name",
        "Only JSON indentation",
        "The setup should release the external connection during dependency changes or unmount.",
        "Styling does not release subscriptions.",
        "Names do not define lifecycle.",
        "Formatting does not disconnect."
      ],
      [
        "An effect derives fullName from first and last and stores it again. What may be simpler?",
        "Calculate fullName during render",
        "Add another mirrored state value",
        "Disable the dependency linter",
        "Use random keys each render",
        "Purely derived values often need no external synchronization effect.",
        "More copies add synchronization burden.",
        "Suppression hides the design issue.",
        "Random identity can reset state."
      ],
      [
        "Development Strict Mode exposes a duplicate subscription after a stress cycle. What should be fixed?",
        "Setup and cleanup symmetry",
        "Only disable all development checks",
        "Only increase a timeout",
        "Only rename useEffect",
        "The extra cycle can reveal missing cleanup that the design should tolerate.",
        "Disabling checks hides evidence.",
        "Time does not remove leaked subscriptions.",
        "Naming does not change lifecycle."
      ],
      [
        "A developer removes a roomId dependency though the effect reads it. What is the risk?",
        "A stale room synchronization",
        "Automatic request cancellation",
        "Guaranteed fewer bugs",
        "A validated server session",
        "The effect may remain synchronized to an obsolete value because its actual reactive input was omitted.",
        "No cancellation follows.",
        "Ignoring dependencies can introduce bugs.",
        "Dependencies do not validate identity."
      ],
      [
        "The SSR fixture leaves effectObserved false. Which behavior still needs a client test?",
        "Effect lifecycle",
        "The server’s initial markup",
        "The omitted server effect call",
        "The printed boolean",
        "SSR omission is not a client lifecycle execution.",
        "Markup is observed.",
        "That omission is the tested boundary.",
        "The boolean is directly logged."
      ]
    ],
    "mistakes": [
      "Using effects to store values derivable during render.",
      "Omitting dependencies to hide synchronization bugs."
    ],
    "takeaways": [
      "Use effects for external synchronization with symmetric cleanup.",
      "Treat SSR omission and client effect behavior as distinct evidence."
    ],
    "prerequisite_note": "Complete JavaScript DOM and Asynchronous Programming first. Bring function, reference, promise and lifecycle vocabulary; distinguish React component behavior from DOM APIs and from the deliberately bounded fixture."
  },
  {
    "id": "react-effect-dependencies",
    "comp": "m3.c1",
    "title": "Make effect dependencies honest and cleanup exact",
    "introduction": "A status panel subscribes with a callback that reads the current account. If dependencies are incomplete, the callback can continue using an old account; if a fresh object is recreated unnecessarily every render, the effect can reconnect too often.",
    "sections": [
      {
        "heading": "Reactive values must match the synchronization",
        "paragraphs": [
          "The dependency array is compared using Object.is for each entry. Objects and functions created during rendering normally have new identities each time unless their design stabilizes them. This can cause effect reruns even when their displayed contents look the same. First ask whether the object belongs inside the effect, outside the component or in a different API, rather than adding memoization mechanically.",
          "Include the reactive props, state and local functions that the effect actually reads according to its contract. For an interval that updates a count based only on prior count, a pure functional state updater can avoid capturing the rendered count unnecessarily. That is a specific design choice, not permission to omit other values such as a changed account id."
        ]
      },
      {
        "heading": "Cleanup must release the resource it acquired",
        "paragraphs": [
          "Capture the exact resource created by that setup in its cleanup closure. Clear the matching timer, remove the matching listener or disconnect the matching subscription. Avoid cleaning an unrelated newer resource through a mutable global reference. Effects with asynchronous work need explicit cancellation or ignore policies; the effect callback itself should not be async because its return contract is cleanup rather than a promise.",
          "The model creates two synthetic subscriptions, cleans the first and keeps the second active before cleaning it too. It tests cleanup ownership using ordinary JavaScript closures and sets. It does not invoke React dependencies, browser timers or actual subscriptions and therefore cannot prove the renderer’s setup/cleanup scheduling."
        ]
      }
    ],
    "worked": {
      "lang": "javascript",
      "code": "const active = new Set();\nfunction connect(id) { const token = {id}; active.add(token); return () => active.delete(token); }\nconst cleanupA = connect(\"A\");\ncleanupA();\nconst cleanupB = connect(\"B\");\nconsole.log([...active].map(token => token.id).join(\",\"));\ncleanupB();\nconsole.log(active.size);",
      "expect": "B\n0",
      "problem": "Make effect dependencies honest and cleanup exact using a synthetic local fixture.",
      "steps": [
        "Read the declared component or pure state transformation.",
        "Execute the fixture with the stated React SSR or JavaScript model boundary.",
        "Compare the concrete output and identify the browser behaviors the fixture did not exercise."
      ],
      "explanation": "This executes a plain JavaScript state or request-coordination model. It is not a React renderer and does not prove hook scheduling, component rerenders, effect lifecycles, DOM events or browser behavior. Use it to trace the narrow algorithm, then verify integration in a real rendered application."
    },
    "quiz": [
      [
        "How does React compare effect dependency entries?",
        "Object.is",
        "JSON serialization always",
        "Deep recursive equality always",
        "Only variable spelling",
        "Effect dependency comparisons use Object.is semantics.",
        "Serialization is not the specified comparison.",
        "Deep object comparison is not automatic.",
        "Names do not determine runtime identity."
      ],
      [
        "Should an effect callback itself normally be async?",
        "No, it returns cleanup or nothing",
        "Yes, it must return a promise",
        "Only when the tag is button",
        "Only for controlled inputs",
        "An async function returns a promise, which does not match the effect cleanup contract.",
        "Promises are not cleanup functions.",
        "Tags do not change that contract.",
        "Input control is unrelated."
      ],
      [
        "What should cleanup normally identify?",
        "The resource from that setup",
        "Any global newest resource",
        "Only the component filename",
        "Only a copied display label",
        "The cleanup closure should release the specific timer, listener or connection its setup acquired.",
        "A newer resource may belong to another lifecycle.",
        "Filenames do not identify resources.",
        "Labels need not own the resource."
      ],
      [
        "An effect depends on a new options object built each render and reconnects repeatedly. What matters?",
        "Its changing object identity",
        "Only JSON key order",
        "Only the connection’s color",
        "Only object property count",
        "A freshly created object differs under Object.is even with similar fields.",
        "Ordering is not the default comparison.",
        "Color is unrelated.",
        "Count alone does not stabilize identity."
      ],
      [
        "An interval’s update needs only the pending previous count. Which pattern can avoid a captured-count dependency?",
        "A pure functional updater",
        "Only dropping every dependency",
        "Only mutating the count variable",
        "Only serializing the callback",
        "The updater can express dependence on pending state without reading that rendered count.",
        "Other reactive dependencies may still be required.",
        "Mutation does not request valid state updates.",
        "Serialization does not implement updates."
      ],
      [
        "A cleanup reads a mutable global handle now pointing at a newer subscription. What can go wrong?",
        "It releases the wrong resource",
        "It guarantees exact cleanup",
        "It validates every callback",
        "It prevents all stale closures",
        "The original cleanup must retain ownership of what its setup created.",
        "A mutable global can drift.",
        "No validation follows.",
        "Stale references remain possible."
      ],
      [
        "A team silences exhaustive-deps for an account-sensitive effect. What should it review?",
        "Reactive input contract",
        "Only the warning’s font",
        "Only a larger array literal",
        "Only the filename extension",
        "Account changes can matter to synchronization; restructuring is safer than concealing an actual dependency.",
        "Display is irrelevant.",
        "Array size alone is not correctness.",
        "Extensions do not define lifecycle."
      ],
      [
        "The Set-based model leaves no subscriptions. What does it not test?",
        "React dependency scheduling",
        "The deletion of its tokens",
        "The modeled cleanup closures",
        "The final Set size",
        "The model has no React renderer and cannot verify actual effect reruns.",
        "Deletion executes.",
        "Closures are real JavaScript.",
        "The size is directly read."
      ]
    ],
    "mistakes": [
      "Making an effect callback async instead of managing async work inside setup.",
      "Cleaning a mutable global handle instead of the resource this setup created."
    ],
    "takeaways": [
      "Keep dependency lists aligned with actual reactive reads.",
      "Capture and clean the exact resource owned by each setup."
    ],
    "prerequisite_note": "Complete JavaScript DOM and Asynchronous Programming first. Bring function, reference, promise and lifecycle vocabulary; distinguish React component behavior from DOM APIs and from the deliberately bounded fixture."
  },
  {
    "id": "react-fetch-states",
    "comp": "m3.c2",
    "title": "Represent loading, error, empty and stale-request outcomes",
    "introduction": "A course search changes from one query to another while both requests are in flight. The older result may arrive last, so successful HTTP responses alone cannot decide which result should appear.",
    "sections": [
      {
        "heading": "An asynchronous view needs truthful states",
        "paragraphs": [
          "Track a meaningful request lifecycle such as idle, loading, success and error. A successful empty result is distinct from loading or failed data. Check response.ok and handle representation parsing or schema errors separately; fetch can fulfill for HTTP errors. Avoid treating all failures as an empty course catalog, which hides the service problem and misleads the user.",
          "Manual fetching in an effect must consider cache, duplicate requests, server rendering and framework integration. A framework data API or a well-designed query library may handle these concerns more completely than ad hoc effects. Teach a small manual pattern as bounded coordination rather than a universal production data architecture."
        ]
      },
      {
        "heading": "Prevent obsolete work from becoming current UI",
        "paragraphs": [
          "Each effect setup can keep an ignore flag or generation identity so cleanup prevents an obsolete result from updating the current view. AbortController can also cancel eligible local work, but cancellation does not prove a remote mutation was undone. Clear the old error or data only according to the intended loading policy; do not flash one account’s private result while another identity is loading.",
          "The fixture models two generations completing out of order and accepts only the current generation. It uses no network and no React renderer. This verifies the stale-result policy function on synthetic values, not browser fetch, hook lifecycles, server authorization or a complete loading interface."
        ]
      }
    ],
    "worked": {
      "lang": "javascript",
      "code": "let currentGeneration = 0;\nlet view = {status: \"idle\", data: null};\nfunction start() { currentGeneration += 1; view = {status: \"loading\", data: null}; return currentGeneration; }\nfunction finish(generation, data) { if (generation === currentGeneration) view = {status: \"success\", data}; }\nconst old = start();\nconst latest = start();\nfinish(latest, \"new courses\");\nfinish(old, \"obsolete courses\");\nconsole.log(view.status, view.data);",
      "expect": "success new courses",
      "problem": "Represent loading, error, empty and stale-request outcomes using a synthetic local fixture.",
      "steps": [
        "Read the declared component or pure state transformation.",
        "Execute the fixture with the stated React SSR or JavaScript model boundary.",
        "Compare the concrete output and identify the browser behaviors the fixture did not exercise."
      ],
      "explanation": "This executes a plain JavaScript state or request-coordination model. It is not a React renderer and does not prove hook scheduling, component rerenders, effect lifecycles, DOM events or browser behavior. Use it to trace the narrow algorithm, then verify integration in a real rendered application."
    },
    "quiz": [
      [
        "Does a fulfilled fetch prove HTTP success?",
        "No, inspect response status",
        "Yes, every 500 rejects",
        "Only for JSON routes",
        "Only for short responses",
        "HTTP error statuses can fulfill with a Response object.",
        "Fetch does not automatically reject every 500.",
        "The representation does not alter that rule.",
        "Length is unrelated."
      ],
      [
        "Which outcome differs from a confirmed empty result?",
        "A still-loading request",
        "A successful empty list",
        "A parsed empty array after success",
        "A valid zero-result response",
        "Loading has no completed successful result yet.",
        "That is an empty result.",
        "That can be a confirmed empty outcome.",
        "That can be a confirmed empty outcome."
      ],
      [
        "What can a generation check prevent?",
        "Applying an obsolete result",
        "Every remote side effect",
        "Every HTTP error",
        "Every browser repaint",
        "The check accepts results only when their request identity is still current.",
        "It does not reverse remote operations.",
        "Status errors still need handling.",
        "It does not control rendering globally."
      ],
      [
        "A course search for old text finishes after a newer search and overwrites it. What is needed?",
        "Stale-result policy",
        "Only another success badge",
        "Only longer query text",
        "Only an array sort",
        "A successful response must still belong to the current query before it is applied.",
        "Badges do not coordinate requests.",
        "Text length does not define freshness.",
        "Sorting does not choose request identity."
      ],
      [
        "An API returns 503 and the UI displays No courses. What should change?",
        "Distinguish error from empty",
        "Only hide the status code",
        "Only use an empty array sooner",
        "Only change the card border",
        "Service failure is not evidence of a successful zero-result search.",
        "Hiding status conceals truth.",
        "Inventing empty data preserves the defect.",
        "Appearance does not correct semantics."
      ],
      [
        "An effect cleanup marks its request result ignored. What is the main local goal?",
        "Avoid obsolete state application",
        "Guarantee the server rolled back",
        "Guarantee all fetches stopped",
        "Authorize the next account",
        "Ignoring obsolete results protects the current view without claiming remote cancellation or authority.",
        "Remote rollback is not implied.",
        "The network may continue.",
        "UI cleanup does not authorize."
      ],
      [
        "A search effect depends on query but omits query from dependencies. What can happen?",
        "It remains on an old query",
        "It validates every response",
        "It deduplicates all requests",
        "It guarantees current results",
        "The synchronization may not restart when the actual input changes.",
        "Validation is separate.",
        "No deduplication guarantee follows.",
        "Omitted inputs can create stale behavior."
      ],
      [
        "The synthetic generation model keeps new courses. What still requires integration evidence?",
        "Actual React fetch lifecycle",
        "The equality check it executed",
        "The final model string",
        "The two generation values",
        "No React component, network request or browser UI ran in the model.",
        "The comparison runs.",
        "The string is observed.",
        "The ids are explicit model inputs."
      ]
    ],
    "mistakes": [
      "Mapping every failed request to an empty successful result.",
      "Assuming canceling local work reverses a remote mutation."
    ],
    "takeaways": [
      "Represent request outcomes honestly.",
      "Apply results only while their query and account ownership are current."
    ],
    "prerequisite_note": "Complete JavaScript DOM and Asynchronous Programming first. Bring function, reference, promise and lifecycle vocabulary; distinguish React component behavior from DOM APIs and from the deliberately bounded fixture."
  },
  {
    "id": "react-controlled-inputs",
    "comp": "m4.c1",
    "title": "Build controlled inputs with explicit synchronous change handling",
    "introduction": "A lesson feedback form needs the current comment for validation and preview. A controlled input has a React-owned value, so each user change must update that value intentionally.",
    "sections": [
      {
        "heading": "Controlled means the value is supplied by React state",
        "paragraphs": [
          "A text input is controlled when value is supplied and its onChange handler updates the backing value. For ordinary text editing, update that state from the current event value synchronously; otherwise the input can revert to the supplied value. Initialize the controlled text value to a string, often an empty string, rather than switching from undefined to a string later.",
          "Checkboxes use checked and the event target’s checked boolean rather than text value for their on/off state. Associate labels with controls using htmlFor and matching id in JSX, or suitable native nesting. Keep accessible names, keyboard operation and relevant error associations part of the form contract rather than assuming React creates them automatically."
        ]
      },
      {
        "heading": "Form state is convenient input, not trusted authority",
        "paragraphs": [
          "Client validation can guide users but the server must independently validate and authorize the submitted operation. A disabled submit button alone does not prevent direct requests or guarantee repeat safety. Preserve intentional input during recoverable failures and avoid logging secrets while debugging a form.",
          "The real SSR fixture renders an initial controlled text value with a label and an onChange function. It proves actual server markup escaping and association attributes only. The handler is not invoked, no user types and no browser controlled-value reconciliation is exercised."
        ]
      }
    ],
    "worked": {
      "lang": "javascript-react",
      "code": "const React = require(\"react\");\nconst {renderToStaticMarkup} = require(\"react-dom/server\");\nfunction Feedback() { const [comment, setComment] = React.useState(\"\"); return React.createElement(\"label\", {htmlFor: \"comment\"}, \"Comment\", React.createElement(\"input\", {id: \"comment\", value: comment, onChange: event => setComment(event.target.value)})); }\nconsole.log(renderToStaticMarkup(React.createElement(Feedback)));",
      "expect": "<label for=\"comment\">Comment<input id=\"comment\" value=\"\"/></label>",
      "problem": "Build controlled inputs with explicit synchronous change handling using a synthetic local fixture.",
      "steps": [
        "Read the declared component or pure state transformation.",
        "Execute the fixture with the stated React SSR or JavaScript model boundary.",
        "Compare the concrete output and identify the browser behaviors the fixture did not exercise."
      ],
      "explanation": "This executes real React and ReactDOM server rendering with createElement, not a handwritten HTML renderer. SSR produces initial markup; it does not mount a browser, run effects, dispatch events, preserve client component identity or prove hydration."
    },
    "quiz": [
      [
        "Which prop controls an ordinary text input’s current value?",
        "value",
        "defaultChecked",
        "key alone",
        "className alone",
        "Value supplies the React-controlled text value.",
        "DefaultChecked initializes a checkbox-like control.",
        "Key determines identity rather than input text.",
        "Styling is not value ownership."
      ],
      [
        "Which checkbox property represents its on/off state?",
        "checked",
        "textContent",
        "href",
        "rows",
        "Checked is the relevant boolean state for a checkbox.",
        "Text content does not encode checked state.",
        "Href is a link destination.",
        "Rows describes textarea display sizing."
      ],
      [
        "What should a controlled text state usually start as when empty?",
        "An empty string",
        "undefined then string",
        "A random object",
        "null forever",
        "A string preserves the controlled text contract from the initial render.",
        "Switching from undefined can change controlledness.",
        "Objects are not appropriate text state.",
        "Null does not represent the intended controlled string."
      ],
      [
        "A user types but the input reverts because onChange never updates its state. What is missing?",
        "The backing value update",
        "Only a larger input width",
        "Only a different input id",
        "Only a server cookie",
        "A controlled input keeps showing its supplied value, so changes must update that source.",
        "Width does not change ownership.",
        "Id does not update state.",
        "Cookies are not the immediate change path."
      ],
      [
        "A checkbox handler reads event.target.value to decide selected state. What should it read?",
        "event.target.checked",
        "Only the placeholder",
        "Only the input id",
        "Only className",
        "Checked represents the checkbox’s boolean state rather than its string value field.",
        "Placeholder is a hint.",
        "Id is identity, not state.",
        "Class names are styling."
      ],
      [
        "A form has a visible label but no programmatic association. What should be fixed?",
        "Label-control association",
        "Only the text color",
        "Only the request timeout",
        "Only the state variable name",
        "A matching htmlFor/id relationship or valid nesting provides the intended native association.",
        "Color is insufficient.",
        "Timeouts do not label controls.",
        "Names do not create accessibility relationships."
      ],
      [
        "A disabled save button is treated as complete server validation. What remains necessary?",
        "Server authority",
        "Only another disabled prop",
        "Only an optimistic message",
        "Only local field trimming",
        "Direct requests can bypass UI controls, so the trusted server must enforce the contract.",
        "More UI state does not enforce remote rules.",
        "A message is not validation.",
        "Trimming alone is not complete enforcement."
      ],
      [
        "The SSR controlled input prints value empty. Which behavior was not exercised?",
        "User typing and state updates",
        "The label for attribute",
        "The initial value attribute",
        "The server-rendered input element",
        "SSR does not dispatch change events or reconcile a live controlled input.",
        "The attribute is printed.",
        "The value is in the output.",
        "The real renderer creates its markup."
      ]
    ],
    "mistakes": [
      "Passing value without updating its backing state on changes.",
      "Reading a checkbox’s string value instead of checked."
    ],
    "takeaways": [
      "Keep controlled values and change handlers consistent.",
      "Verify browser interaction and server enforcement separately from initial markup."
    ],
    "prerequisite_note": "Complete JavaScript DOM and Asynchronous Programming first. Bring function, reference, promise and lifecycle vocabulary; distinguish React component behavior from DOM APIs and from the deliberately bounded fixture."
  },
  {
    "id": "react-form-validation",
    "comp": "m4.c1",
    "title": "Validate forms while preserving useful recovery and truthful results",
    "introduction": "A registration form rejects an invalid display name and later receives a server rejection. Users need field-specific guidance and retained safe input, while the application must not create fake success or completion records.",
    "sections": [
      {
        "heading": "Validation has client and server responsibilities",
        "paragraphs": [
          "Client rules improve immediate feedback, while server rules protect the operation against direct or modified requests. Define required fields, length and format constraints from the actual contract. Trim only where the domain allows it; passwords and other fields may need exact preservation rather than unconditional normalization. Native browser constraints and custom validation should work together intentionally.",
          "On submit, prevent the native default only when the handler deliberately owns the replacement flow. Associate error text with the relevant input and choose a usable focus or announcement policy. A red border alone is not sufficient explanation. Distinguish an invalid field from a network failure, unauthorized request or conflicting server state."
        ]
      },
      {
        "heading": "Pending and submitted are different evidence",
        "paragraphs": [
          "Track pending operations to guide interaction and avoid accidental duplicates, but use backend idempotency where required for repeat-sensitive effects. Display success only after the operation’s defined success evidence. A local draft save is not a server enrollment, and an error is not evidence of an empty or completed assessment. Do not leak sensitive values through error URLs or telemetry.",
          "The example runs a plain JavaScript validation function on synthetic display names. It demonstrates a required/length rule and normalized successful result only. It does not render error associations, focus behavior, browser native validation, asynchronous submission or server enforcement."
        ]
      }
    ],
    "worked": {
      "lang": "javascript",
      "code": "function validateDisplayName(input) { const value = input.trim(); if (!value) return {ok: false, error: \"Enter a name\"}; if (value.length > 30) return {ok: false, error: \"Use at most 30 characters\"}; return {ok: true, value}; }\nconsole.log(JSON.stringify(validateDisplayName(\"   \")));\nconsole.log(JSON.stringify(validateDisplayName(\" Ada \")));",
      "expect": "{\"ok\":false,\"error\":\"Enter a name\"}\n{\"ok\":true,\"value\":\"Ada\"}",
      "problem": "Validate forms while preserving useful recovery and truthful results using a synthetic local fixture.",
      "steps": [
        "Read the declared component or pure state transformation.",
        "Execute the fixture with the stated React SSR or JavaScript model boundary.",
        "Compare the concrete output and identify the browser behaviors the fixture did not exercise."
      ],
      "explanation": "This executes a plain JavaScript state or request-coordination model. It is not a React renderer and does not prove hook scheduling, component rerenders, effect lifecycles, DOM events or browser behavior. Use it to trace the narrow algorithm, then verify integration in a real rendered application."
    },
    "quiz": [
      [
        "What does client validation not replace?",
        "Server contract enforcement",
        "Immediate user feedback",
        "Field-level guidance",
        "A useful editing experience",
        "The server must enforce trusted rules regardless of the UI path.",
        "Client checks can improve feedback.",
        "Guidance remains useful.",
        "Editing assistance is compatible with server rules."
      ],
      [
        "What should field errors help a user identify?",
        "Problem and recovery",
        "Only a random color change",
        "Only a compiler version",
        "Only the browser theme",
        "Usable feedback names the problem and how to correct it under the contract.",
        "Color alone lacks the required explanation.",
        "Versions are unrelated.",
        "Themes do not explain invalid data."
      ],
      [
        "When should a form report successful enrollment?",
        "After defined success evidence",
        "Before starting any request",
        "Whenever local text is nonempty",
        "Whenever a button is hidden",
        "A success claim should match the actual operation outcome.",
        "A future request may fail.",
        "Valid text is not enrollment.",
        "Visibility is not evidence."
      ],
      [
        "A red border appears but screen-reader users cannot find the error text. What needs verification?",
        "Accessible error association",
        "Only a different shade of red",
        "Only server CPU time",
        "Only object spread syntax",
        "Feedback needs programmatic association and usable navigation or announcements.",
        "Color alone does not establish access.",
        "CPU timing is a different concern.",
        "Spread does not label errors."
      ],
      [
        "A name validator trims whitespace. Should the same rule automatically be applied to passwords?",
        "No, follow each field’s contract",
        "Yes, every field is equivalent",
        "Only if the label is short",
        "Only after JSX rendering",
        "Normalization must preserve the intended meaning and exactness requirements of each field.",
        "Fields can have different semantics.",
        "Label length is unrelated.",
        "Rendering does not define normalization."
      ],
      [
        "A network failure clears all meaningful form input and says saved. What is wrong?",
        "Truthful recovery",
        "Only the default font",
        "Only a shorter message",
        "Only the route name",
        "The UI should retain suitable input and truthfully report failure rather than invent persistence.",
        "Styling does not fix evidence.",
        "Shorter false text is still false.",
        "Names do not change the outcome."
      ],
      [
        "A user submits a purchase twice while pending. What may be required beyond button state?",
        "Backend repeat safety",
        "Only a spinner",
        "Only another local boolean",
        "Only a second client check",
        "UI guards can be bypassed or race; repeat-sensitive operations may need server idempotency.",
        "Animation is not transaction protection.",
        "Client state alone is insufficient.",
        "More local checks do not constrain direct requests."
      ],
      [
        "The validator fixture rejects blanks and accepts Ada. What is still unverified?",
        "Real form behavior",
        "The trimmed synthetic value",
        "The returned error string",
        "The local length rule",
        "A pure function does not exercise rendered accessibility, native constraints or actual requests.",
        "The value is observed.",
        "The string is returned.",
        "The branch exists and can execute."
      ]
    ],
    "mistakes": [
      "Treating a valid client field as proof that the server operation succeeded.",
      "Using color alone to explain validation errors."
    ],
    "takeaways": [
      "Preserve useful recovery while reporting actual outcomes.",
      "Validate and authorize the trusted operation independently of client convenience checks."
    ],
    "prerequisite_note": "Complete JavaScript DOM and Asynchronous Programming first. Bring function, reference, promise and lifecycle vocabulary; distinguish React component behavior from DOM APIs and from the deliberately bounded fixture."
  },
  {
    "id": "react-uncontrolled-boundaries",
    "comp": "m4.c2",
    "title": "Choose controlled or uncontrolled ownership deliberately",
    "introduction": "A file-upload form uses browser-managed input while a live filter uses React-owned text. Neither pattern should be selected by habit; the owner and integration needs determine which approach fits.",
    "sections": [
      {
        "heading": "Uncontrolled inputs keep their current value in the DOM",
        "paragraphs": [
          "DefaultValue provides an initial value for an uncontrolled text input rather than controlling its current value on every render. Read the actual submitted value with the form or an appropriate ref when the interaction contract calls for it. A ref can hold a DOM node or another mutable value without requesting a rerender merely because ref.current changes.",
          "Controlled inputs receive value or checked from React and need change handling that keeps that value current. Avoid switching a single input between controlled and uncontrolled during its lifetime. File inputs have special browser constraints: a script cannot populate an arbitrary local file path as a selected file, and file selection must respect the browser’s security model."
        ]
      },
      {
        "heading": "Choose ownership from behavior and lifecycle",
        "paragraphs": [
          "Controlled values can be useful for live previews, dependent validation and coordinated state. Uncontrolled forms can fit simple submission or integration where DOM-owned current values are intended. Either design still needs accessible labels, clear reset behavior and server enforcement. Resetting React state and invoking native form reset are different operations whose effect depends on ownership.",
          "The fixture uses real React SSR to compare a defaultValue input and a value input. Both initial HTML strings include value text, demonstrating that static markup alone does not reveal subsequent ownership behavior. No typing, ref access, form reset or file-selection flow is executed."
        ]
      }
    ],
    "worked": {
      "lang": "javascript-react",
      "code": "const React = require(\"react\");\nconst {renderToStaticMarkup} = require(\"react-dom/server\");\nconsole.log(renderToStaticMarkup(React.createElement(\"input\", {name: \"draft\", defaultValue: \"seed\"})));\nconsole.log(renderToStaticMarkup(React.createElement(\"input\", {name: \"draft\", value: \"seed\", onChange: () => {}})));",
      "expect": "<input name=\"draft\" value=\"seed\"/>\n<input name=\"draft\" value=\"seed\"/>",
      "problem": "Choose controlled or uncontrolled ownership deliberately using a synthetic local fixture.",
      "steps": [
        "Read the declared component or pure state transformation.",
        "Execute the fixture with the stated React SSR or JavaScript model boundary.",
        "Compare the concrete output and identify the browser behaviors the fixture did not exercise."
      ],
      "explanation": "This executes real React and ReactDOM server rendering with createElement, not a handwritten HTML renderer. SSR produces initial markup; it does not mount a browser, run effects, dispatch events, preserve client component identity or prove hydration."
    },
    "quiz": [
      [
        "What does defaultValue normally provide?",
        "An initial uncontrolled value",
        "A continuously controlled value",
        "A server permission",
        "A guaranteed input validator",
        "DefaultValue initializes DOM-owned input rather than controlling each current value through React.",
        "Value is used for ongoing controlled ownership.",
        "It grants no permission.",
        "Initialization is not validation."
      ],
      [
        "Does changing ref.current alone request a component rerender?",
        "No",
        "Yes, like every state setter",
        "Only if the ref is named input",
        "Only after JSON parsing",
        "Refs hold mutable values without state-driven rerender requests for each change.",
        "Refs differ from state setters.",
        "Names are irrelevant.",
        "Parsing does not change ref behavior."
      ],
      [
        "Can script set an arbitrary local file path as the user’s selected upload?",
        "No",
        "Yes, through ordinary value props",
        "Only with a random key",
        "Only with defaultValue text",
        "Browser file input security does not permit arbitrary script-selected local files.",
        "A value prop cannot bypass that boundary.",
        "Keys do not grant file access.",
        "Initial text does not select a local file."
      ],
      [
        "A live preview must track every edit from one source. Which ownership may fit?",
        "Controlled React state",
        "An unrelated duplicate variable",
        "Only a hidden label",
        "Only an immutable prop with no change path",
        "A controlled input can keep the preview and text coordinated through one state value.",
        "Independent copies can drift.",
        "Labels do not own data.",
        "A fixed prop without updates cannot track edits."
      ],
      [
        "An input begins with value undefined and later receives text. What should be avoided?",
        "Switching ownership modes",
        "Only an empty label",
        "Only an extra CSS class",
        "Only a named component",
        "The input should not transition unintentionally from uncontrolled to controlled during its lifetime.",
        "Labels are a separate concern.",
        "Styling does not define ownership.",
        "Named components are normal."
      ],
      [
        "A form reset is expected to reset a controlled value whose state never changes. What needs review?",
        "The state reset path",
        "Only native defaultValue",
        "Only a server status",
        "Only a new input name",
        "A controlled value follows React state, so resetting it requires an appropriate state update.",
        "DefaultValue does not control its current value.",
        "HTTP status does not reset local state.",
        "Naming does not update it."
      ],
      [
        "A simple uncontrolled form reads values at submit time. What remains necessary?",
        "Validate and authorize",
        "Only a DOM ref name",
        "Only default text",
        "Only input width",
        "Ownership choice does not remove client usability or server contract and authority requirements.",
        "Names do not validate.",
        "Defaults do not establish valid current input.",
        "Width is unrelated."
      ],
      [
        "The two SSR input strings match. What can differ in a mounted app?",
        "Current-value ownership",
        "Their observed initial strings",
        "The printed name attributes",
        "The emitted seed text",
        "The same initial markup can lead to different controlled versus DOM-owned interaction behavior.",
        "Those strings are directly observed.",
        "The attributes match in output.",
        "The seed is rendered in both."
      ]
    ],
    "mistakes": [
      "Assuming identical initial HTML proves identical controlled behavior.",
      "Expecting ref mutation alone to trigger state-driven rendering."
    ],
    "takeaways": [
      "Choose and preserve one input ownership model.",
      "Test typing, reset and file boundaries in an actual browser integration."
    ],
    "prerequisite_note": "Complete JavaScript DOM and Asynchronous Programming first. Bring function, reference, promise and lifecycle vocabulary; distinguish React component behavior from DOM APIs and from the deliberately bounded fixture."
  }
],[
  {
    "id": "react-components",
    "title": "React documentation: Describing the UI",
    "url": "https://github.com/reactjs/react.dev/blob/7594a2b008489121bdf25f97320d11ac0422510e/src/content/learn/describing-the-ui.md",
    "source": {
      "repo": "reactjs/react.dev",
      "commit": "7594a2b008489121bdf25f97320d11ac0422510e",
      "path": "src/content/learn/describing-the-ui.md",
      "verification": "Official React documentation inspected at this pinned commit. SSR fixtures verify initial markup only; JavaScript models do not replace client renderer evidence."
    }
  },
  {
    "id": "react-state",
    "title": "React documentation: Queueing a Series of State Updates",
    "url": "https://github.com/reactjs/react.dev/blob/7594a2b008489121bdf25f97320d11ac0422510e/src/content/learn/queueing-a-series-of-state-updates.md",
    "source": {
      "repo": "reactjs/react.dev",
      "commit": "7594a2b008489121bdf25f97320d11ac0422510e",
      "path": "src/content/learn/queueing-a-series-of-state-updates.md",
      "verification": "Official React documentation inspected at this pinned commit. SSR fixtures verify initial markup only; JavaScript models do not replace client renderer evidence."
    }
  },
  {
    "id": "react-effects",
    "title": "React documentation: Synchronizing with Effects",
    "url": "https://github.com/reactjs/react.dev/blob/7594a2b008489121bdf25f97320d11ac0422510e/src/content/learn/synchronizing-with-effects.md",
    "source": {
      "repo": "reactjs/react.dev",
      "commit": "7594a2b008489121bdf25f97320d11ac0422510e",
      "path": "src/content/learn/synchronizing-with-effects.md",
      "verification": "Official React documentation inspected at this pinned commit. SSR fixtures verify initial markup only; JavaScript models do not replace client renderer evidence."
    }
  },
  {
    "id": "react-effect-api",
    "title": "React documentation: useEffect",
    "url": "https://github.com/reactjs/react.dev/blob/7594a2b008489121bdf25f97320d11ac0422510e/src/content/reference/react/useEffect.md",
    "source": {
      "repo": "reactjs/react.dev",
      "commit": "7594a2b008489121bdf25f97320d11ac0422510e",
      "path": "src/content/reference/react/useEffect.md",
      "verification": "Official React documentation inspected at this pinned commit. SSR fixtures verify initial markup only; JavaScript models do not replace client renderer evidence."
    }
  },
  {
    "id": "react-input",
    "title": "React documentation: input",
    "url": "https://github.com/reactjs/react.dev/blob/7594a2b008489121bdf25f97320d11ac0422510e/src/content/reference/react-dom/components/input.md",
    "source": {
      "repo": "reactjs/react.dev",
      "commit": "7594a2b008489121bdf25f97320d11ac0422510e",
      "path": "src/content/reference/react-dom/components/input.md",
      "verification": "Official React documentation inspected at this pinned commit. SSR fixtures verify initial markup only; JavaScript models do not replace client renderer evidence."
    }
  },
  {
    "id": "react-lists",
    "title": "React documentation: Rendering Lists",
    "url": "https://github.com/reactjs/react.dev/blob/7594a2b008489121bdf25f97320d11ac0422510e/src/content/learn/rendering-lists.md",
    "source": {
      "repo": "reactjs/react.dev",
      "commit": "7594a2b008489121bdf25f97320d11ac0422510e",
      "path": "src/content/learn/rendering-lists.md",
      "verification": "Official React documentation inspected at this pinned commit. SSR fixtures verify initial markup only; JavaScript models do not replace client renderer evidence."
    }
  }
]);
