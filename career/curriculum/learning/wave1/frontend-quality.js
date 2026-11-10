'use strict';
const {course}=require('./web-helper');
module.exports=course("frontend-quality",[
  {
    "id": "quality-keyboard-focus",
    "comp": "m1.c1",
    "title": "Keep every critical action reachable and focus visible",
    "introduction": "A checkout works with a mouse but its custom payment control cannot be reached using Tab. Accessibility review begins with real task completion through different input methods.",
    "sections": [
      {
        "heading": "Keep every critical action reachable and focus visible",
        "paragraphs": [
          "Use semantic native controls such as button and a href when they match the intended action. Native behavior provides keyboard activation and established accessibility semantics that a styled div does not acquire automatically. Keyboard users need a meaningful focus sequence and a perceivable indicator; removing outline without a suitable replacement conceals location. Avoid positive tabindex values as a way to patch a badly ordered document.",
          "Modal dialogs need deliberate initial focus, containment while open, a clear close path and appropriate focus restoration. The exact interaction must suit the dialog\u2019s task and implementation; merely assigning role=\"dialog\" does not provide those behaviors. Avoid trapping users in nonmodal content, and ensure sticky headers or overlays do not obscure the focused control."
        ]
      },
      {
        "heading": "Work through the decision and its limits",
        "paragraphs": [
          "A purchase path should be tested from entry through confirmation with keyboard input. Include error recovery: if submission fails, focus and messaging must help identify the issue without making users rediscover the form. Content order matters alongside visible layout, especially when CSS moves controls away from document sequence. Touch and pointer success do not establish keyboard usability.",
          "The fixture filters a simplified control list into an expected tab sequence under supplied native/disabled flags. It does not implement the HTML focus algorithm, visibility, inert regions or shadow DOM. Real keyboard traversal and focus visibility remain required in browser tests and human review."
        ]
      }
    ],
    "worked": {
      "lang": "javascript",
      "code": "const controls=[{id:\"email\",disabled:false},{id:\"coupon\",disabled:true},{id:\"pay\",disabled:false}];\nconsole.log(controls.filter(x=>!x.disabled).map(x=>x.id).join(\" -> \"));",
      "expect": "email -> pay",
      "problem": "Keep every critical action reachable and focus visible",
      "steps": [
        "Read the synthetic fixture and its declared contract.",
        "Trace the exact calculation or assertion.",
        "Separate the observed output from real browser and production evidence."
      ],
      "explanation": "The fixture filters a simplified control list into an expected tab sequence under supplied native/disabled flags. It does not implement the HTML focus algorithm, visibility, inert regions or shadow DOM. Real keyboard traversal and focus visibility remain required in browser tests and human review."
    },
    "quiz": [
      [
        "Which element ordinarily supplies native button semantics?",
        "button",
        "div with only a click handler",
        "span with only a CSS class",
        "p with only a title",
        "A native button supplies established interaction and accessibility semantics.",
        "div with only a click handler does not satisfy the stated requirement. A native button supplies established interaction and accessibility semantics.",
        "span with only a CSS class does not satisfy the stated requirement. A native button supplies established interaction and accessibility semantics.",
        "p with only a title does not satisfy the stated requirement. A native button supplies established interaction and accessibility semantics."
      ],
      [
        "What must keyboard focus remain?",
        "Visible and meaningful",
        "Always hidden",
        "Always on the first element",
        "Only indicated by sound",
        "Users need to perceive focus and follow a useful task sequence.",
        "Always hidden does not satisfy the stated requirement. Users need to perceive focus and follow a useful task sequence.",
        "Always on the first element does not satisfy the stated requirement. Users need to perceive focus and follow a useful task sequence.",
        "Only indicated by sound does not satisfy the stated requirement. Users need to perceive focus and follow a useful task sequence."
      ],
      [
        "What is risky about positive tabindex repairs?",
        "They create a separate focus order",
        "They always remove focus",
        "They validate server permissions",
        "They ensure every modal is correct",
        "Positive tabindex can create an artificial ordering that is difficult to maintain.",
        "They always remove focus does not satisfy the stated requirement. Positive tabindex can create an artificial ordering that is difficult to maintain.",
        "They validate server permissions does not satisfy the stated requirement. Positive tabindex can create an artificial ordering that is difficult to maintain.",
        "They ensure every modal is correct does not satisfy the stated requirement. Positive tabindex can create an artificial ordering that is difficult to maintain."
      ],
      [
        "A Pay div responds to clicks but not keyboard input. Which redesign is strongest?",
        "Use a native button",
        "Only add a pointer cursor",
        "Only increase its contrast",
        "Only rename its CSS class",
        "Native semantics and keyboard behavior fit a button action better than presentation alone.",
        "Only add a pointer cursor does not satisfy the stated requirement. Native semantics and keyboard behavior fit a button action better than presentation alone.",
        "Only increase its contrast does not satisfy the stated requirement. Native semantics and keyboard behavior fit a button action better than presentation alone.",
        "Only rename its CSS class does not satisfy the stated requirement. Native semantics and keyboard behavior fit a button action better than presentation alone."
      ],
      [
        "A modal opens and focus remains behind it. What must its interaction design address?",
        "Initial focus and containment",
        "Only the modal\u2019s border radius",
        "Only the server\u2019s response size",
        "Only the route\u2019s capitalization",
        "Modal interaction needs appropriate focus movement and containment while open.",
        "Only the modal\u2019s border radius does not satisfy the stated requirement. Modal interaction needs appropriate focus movement and containment while open.",
        "Only the server\u2019s response size does not satisfy the stated requirement. Modal interaction needs appropriate focus movement and containment while open.",
        "Only the route\u2019s capitalization does not satisfy the stated requirement. Modal interaction needs appropriate focus movement and containment while open."
      ],
      [
        "A dialog closes and focus disappears to the page start. What should be reviewed?",
        "Focus restoration",
        "Only the animation speed",
        "Only the image type",
        "Only the HTTP method",
        "Closing should restore focus to an appropriate logical location.",
        "Only the animation speed does not satisfy the stated requirement. Closing should restore focus to an appropriate logical location.",
        "Only the image type does not satisfy the stated requirement. Closing should restore focus to an appropriate logical location.",
        "Only the HTTP method does not satisfy the stated requirement. Closing should restore focus to an appropriate logical location."
      ],
      [
        "A sticky banner hides the focused checkout control. What is the usability issue?",
        "Focus is obscured",
        "The button is now authorized",
        "The JSON is invalid",
        "The font cannot load",
        "Focused controls need to remain perceivable and usable despite overlays.",
        "The button is now authorized does not satisfy the stated requirement. Focused controls need to remain perceivable and usable despite overlays.",
        "The JSON is invalid does not satisfy the stated requirement. Focused controls need to remain perceivable and usable despite overlays.",
        "The font cannot load does not satisfy the stated requirement. Focused controls need to remain perceivable and usable despite overlays."
      ],
      [
        "The sequence model prints email then pay. What remains untested?",
        "Actual browser Tab traversal",
        "The disabled filter result",
        "The supplied control order",
        "The final joined string",
        "The simplified array filter does not run HTML focus behavior.",
        "The disabled filter result does not satisfy the stated requirement. The simplified array filter does not run HTML focus behavior.",
        "The supplied control order does not satisfy the stated requirement. The simplified array filter does not run HTML focus behavior.",
        "The final joined string does not satisfy the stated requirement. The simplified array filter does not run HTML focus behavior."
      ]
    ],
    "mistakes": [
      "Replacing native controls with click-only presentation.",
      "Removing focus indication to match a mockup."
    ],
    "takeaways": [
      "Verify complete keyboard tasks.",
      "Treat focus movement as interaction behavior."
    ],
    "prerequisite_note": "React Fundamentals is the canonical prerequisite. Review component state, events, effects and form ownership. This course adds accessibility contracts, layered testing, measured performance and release operations. Node assertion and arithmetic examples verify their stated models; browser, assistive technology and deployed-system evidence remain separate review tasks."
  },
  {
    "id": "quality-labels-contrast",
    "comp": "m1.c1",
    "title": "Connect names, errors and contrast to real controls",
    "introduction": "A registration form uses placeholders as labels and red borders as the only error cue. The interface needs durable names and recoverable explanations.",
    "sections": [
      {
        "heading": "Connect names, errors and contrast to real controls",
        "paragraphs": [
          "A visible label associated through for and id gives a text input a persistent purpose; a placeholder is a hint that can disappear and is not a full label replacement. Group related controls with appropriate semantics such as fieldset and legend. Connect relevant descriptions and error text to the control, for example with aria-describedby, while preserving concise useful naming.",
          "Communicate errors with meaningful text and a recovery action rather than color alone. aria-invalid can indicate invalidity but does not explain how to fix it. Live regions may announce asynchronous messages when used deliberately; excessive announcements or repeatedly replacing whole regions can overwhelm users. Consider timing and whether focus movement already communicates the same information."
        ]
      },
      {
        "heading": "Work through the decision and its limits",
        "paragraphs": [
          "WCAG text contrast commonly requires 4.5:1 for normal text and 3:1 for qualifying large text under the relevant AA criterion and exceptions. Use actual foreground/background relationships and avoid rounding a failing ratio into a pass. Component boundaries and focus indicators have their own requirements; one passing text pair does not certify the whole form.",
          "The fixture evaluates supplied contrast ratios without rounding and constructs an explicit label/error relationship record. It does not measure rendered colors, compute a browser accessibility tree or test announcements. Actual states, backgrounds and assistive technology behavior need review."
        ]
      }
    ],
    "worked": {
      "lang": "javascript",
      "code": "for(const ratio of [4.49,4.5])console.log(ratio>=4.5?\"pass normal-text threshold\":\"fail normal-text threshold\");",
      "expect": "fail normal-text threshold\npass normal-text threshold",
      "problem": "Connect names, errors and contrast to real controls",
      "steps": [
        "Read the synthetic fixture and its declared contract.",
        "Trace the exact calculation or assertion.",
        "Separate the observed output from real browser and production evidence."
      ],
      "explanation": "The fixture evaluates supplied contrast ratios without rounding and constructs an explicit label/error relationship record. It does not measure rendered colors, compute a browser accessibility tree or test announcements. Actual states, backgrounds and assistive technology behavior need review."
    },
    "quiz": [
      [
        "What should a text input have beyond a placeholder?",
        "A persistent associated label",
        "A placeholder used as the only name",
        "An unassociated nearby text element",
        "A tooltip shown only while hovering",
        "A label provides a stable accessible purpose beyond transient placeholder hints.",
        "Placeholder text can disappear and does not replace a persistent label.",
        "Nearby text needs a programmatic association to name the intended input reliably.",
        "Hover-only text is not a persistent label and can be unavailable to keyboard or touch users."
      ],
      [
        "Is color alone enough for an error cue?",
        "No, add meaningful information",
        "Yes, if errors always appear in red",
        "Yes, if contrast exceeds the minimum",
        "No, replace all text with error icons",
        "Users need information that does not depend only on perceiving color.",
        "Red is not a universally distinguishable explanation of an error.",
        "Adequate contrast does not communicate the error's meaning without another cue.",
        "An unlabeled icon can be as ambiguous as color and does not replace meaningful error information."
      ],
      [
        "What can aria-describedby connect?",
        "Relevant descriptive text",
        "A server authorization rule",
        "A CSS module import",
        "An image encoding profile",
        "It associates descriptive content with the control for accessible presentation.",
        "A server authorization rule does not satisfy the stated requirement. It associates descriptive content with the control for accessible presentation.",
        "A CSS module import does not satisfy the stated requirement. It associates descriptive content with the control for accessible presentation.",
        "An image encoding profile does not satisfy the stated requirement. It associates descriptive content with the control for accessible presentation."
      ],
      [
        "A password error only says Invalid. What should be improved?",
        "Specific recovery guidance",
        "Only a brighter red",
        "Only a faster fade",
        "Only a larger request timeout",
        "Users need to understand the problem and how to correct it.",
        "Only a brighter red does not satisfy the stated requirement. Users need to understand the problem and how to correct it.",
        "Only a faster fade does not satisfy the stated requirement. Users need to understand the problem and how to correct it.",
        "Only a larger request timeout does not satisfy the stated requirement. Users need to understand the problem and how to correct it."
      ],
      [
        "A normal text ratio is 4.49 against a 4.5 threshold. What should a reviewer avoid?",
        "Rounding it into a pass",
        "Using the actual ratio",
        "Checking the right criterion",
        "Reviewing the real background",
        "A below-threshold ratio must not be rounded up to claim success.",
        "Using the actual ratio does not satisfy the stated requirement. A below-threshold ratio must not be rounded up to claim success.",
        "Checking the right criterion does not satisfy the stated requirement. A below-threshold ratio must not be rounded up to claim success.",
        "Reviewing the real background does not satisfy the stated requirement. A below-threshold ratio must not be rounded up to claim success."
      ],
      [
        "A label vanishes after typing because it was only a placeholder. What design helps?",
        "A visible associated label",
        "Only a remembered placeholder",
        "Only a colored underline",
        "Only a longer input value",
        "Persistent labels remain available while users review or correct their input.",
        "Only a remembered placeholder does not satisfy the stated requirement. Persistent labels remain available while users review or correct their input.",
        "Only a colored underline does not satisfy the stated requirement. Persistent labels remain available while users review or correct their input.",
        "Only a longer input value does not satisfy the stated requirement. Persistent labels remain available while users review or correct their input."
      ],
      [
        "A live region announces every keystroke and every full form rerender. What should be reviewed?",
        "Announcement timing and scope",
        "Only the icon\u2019s file format",
        "Only the route\u2019s wording",
        "Only the number of packages",
        "Overly frequent announcements can impair comprehension and control.",
        "Only the icon\u2019s file format does not satisfy the stated requirement. Overly frequent announcements can impair comprehension and control.",
        "Only the route\u2019s wording does not satisfy the stated requirement. Overly frequent announcements can impair comprehension and control.",
        "Only the number of packages does not satisfy the stated requirement. Overly frequent announcements can impair comprehension and control."
      ],
      [
        "The ratio fixture distinguishes 4.49 and 4.5. What is outside scope?",
        "Rendered contrast sampling",
        "The supplied numeric ratio values",
        "The threshold comparison operation",
        "The generated pass/fail messages",
        "The fixture accepts ratios as inputs instead of measuring a rendered interface.",
        "The ratios are supplied inputs rather than sampled from rendered foreground and background colors.",
        "The numeric threshold comparison is the operation the fixture does execute.",
        "The fixture's output strings are observed; the untested part is browser rendering."
      ]
    ],
    "mistakes": [
      "Relying on placeholder text as the sole label.",
      "Using red alone to explain input errors."
    ],
    "takeaways": [
      "Keep labels and recovery instructions persistent.",
      "Evaluate actual contrast without rounding failures upward."
    ],
    "prerequisite_note": "React Fundamentals is the canonical prerequisite. Review component state, events, effects and form ownership. This course adds accessibility contracts, layered testing, measured performance and release operations. Node assertion and arithmetic examples verify their stated models; browser, assistive technology and deployed-system evidence remain separate review tasks."
  },
  {
    "id": "quality-native-aria",
    "comp": "m1.c2",
    "title": "Use ARIA to fill semantic gaps without inventing behavior",
    "introduction": "A product team adds role=\"button\" to every clickable element and assumes the accessibility work is complete. ARIA communicates semantics but does not create interaction.",
    "sections": [
      {
        "heading": "Use ARIA to fill semantic gaps without inventing behavior",
        "paragraphs": [
          "Prefer native HTML when it expresses the required role and behavior. A button element already supports a button action; adding role=\"button\" to a generic element does not automatically add activation keys, disabled behavior or focusability. ARIA can supplement native semantics when needed, but invalid or conflicting roles can make a correct control harder to understand.",
          "Accessible names should match the visible purpose. aria-label can override other naming sources and may unintentionally hide useful visible wording from the accessible name. aria-labelledby can reference visible label elements; ensure ids resolve and the combined name is useful. Avoid adding ARIA merely to increase the number of attributes in a review."
        ]
      },
      {
        "heading": "Work through the decision and its limits",
        "paragraphs": [
          "A disclosure can use a native button with aria-expanded reflecting whether controlled content is currently visible. The state must update with interaction; an attribute permanently set to false misrepresents an open panel. A tabs widget has a richer keyboard and selection contract than a row of links, so follow the appropriate interaction pattern instead of copying one role in isolation.",
          "The fixture checks synthetic expansion state and referenced ids as a small consistency contract. It does not build an accessibility tree, implement tabs or prove assistive technology support. Review actual native behavior and semantic exposure together with real keyboard and screen-reader testing."
        ]
      }
    ],
    "worked": {
      "lang": "javascript",
      "code": "const open=true,ariaExpanded=\"true\",ids=new Set([\"details\"]);\nconsole.log(String(open)===ariaExpanded);\nconsole.log(ids.has(\"details\"));",
      "expect": "true\ntrue",
      "problem": "Use ARIA to fill semantic gaps without inventing behavior",
      "steps": [
        "Read the synthetic fixture and its declared contract.",
        "Trace the exact calculation or assertion.",
        "Separate the observed output from real browser and production evidence."
      ],
      "explanation": "The fixture checks synthetic expansion state and referenced ids as a small consistency contract. It does not build an accessibility tree, implement tabs or prove assistive technology support. Review actual native behavior and semantic exposure together with real keyboard and screen-reader testing."
    },
    "quiz": [
      [
        "Does role=\"button\" add keyboard behavior automatically?",
        "No, behavior remains explicit",
        "Yes, all keys are implemented",
        "Only when CSS is loaded",
        "Only on high-density screens",
        "ARIA roles describe semantics but do not implement native interaction behavior.",
        "Yes, all keys are implemented does not satisfy the stated requirement. ARIA roles describe semantics but do not implement native interaction behavior.",
        "Only when CSS is loaded does not satisfy the stated requirement. ARIA roles describe semantics but do not implement native interaction behavior.",
        "Only on high-density screens does not satisfy the stated requirement. ARIA roles describe semantics but do not implement native interaction behavior."
      ],
      [
        "Which starting point suits a disclosure trigger?",
        "A native button",
        "A click-only div",
        "A decorative img only",
        "A hidden paragraph",
        "A native button provides appropriate action semantics and keyboard behavior.",
        "A click-only div does not satisfy the stated requirement. A native button provides appropriate action semantics and keyboard behavior.",
        "A decorative img only does not satisfy the stated requirement. A native button provides appropriate action semantics and keyboard behavior.",
        "A hidden paragraph does not satisfy the stated requirement. A native button provides appropriate action semantics and keyboard behavior."
      ],
      [
        "What should aria-expanded reflect?",
        "The current expansion state",
        "The initial expansion state only",
        "The panel's intended target state",
        "The user's last navigation route",
        "State attributes should agree with the current interaction state.",
        "A fixed initial value becomes false semantic information after interaction.",
        "The target state can differ from the actual current state and must not misrepresent it.",
        "A route name does not describe whether this disclosure is expanded."
      ],
      [
        "A visible Save control has aria-label=\"Delete\". What is wrong?",
        "The accessible name conflicts",
        "The color must be blue",
        "The request needs a GET",
        "The image needs more pixels",
        "Conflicting names can mislead assistive and speech-input users.",
        "The color must be blue does not satisfy the stated requirement. Conflicting names can mislead assistive and speech-input users.",
        "The request needs a GET does not satisfy the stated requirement. Conflicting names can mislead assistive and speech-input users.",
        "The image needs more pixels does not satisfy the stated requirement. Conflicting names can mislead assistive and speech-input users."
      ],
      [
        "A team copies role=\"tab\" onto ordinary links. What else must be assessed?",
        "The complete tabs interaction contract",
        "Only the role's presence in a snapshot",
        "Only a matching tab-like visual style",
        "Only a successful click on one link",
        "A role brings expectations about keyboard movement and selection behavior.",
        "A role snapshot cannot establish keyboard navigation and selection behavior.",
        "Visual tabs do not create the required semantics and interaction model.",
        "One successful click does not test the complete tabs contract."
      ],
      [
        "An aria-labelledby id points to nothing. What needs repair?",
        "The naming reference",
        "Only the HTTP cache",
        "Only the grid gap",
        "Only the animation speed",
        "Referenced labels must resolve to appropriate actual elements.",
        "Only the HTTP cache does not satisfy the stated requirement. Referenced labels must resolve to appropriate actual elements.",
        "Only the grid gap does not satisfy the stated requirement. Referenced labels must resolve to appropriate actual elements.",
        "Only the animation speed does not satisfy the stated requirement. Referenced labels must resolve to appropriate actual elements."
      ],
      [
        "An open panel still exposes aria-expanded=false. What should change?",
        "Synchronize semantic state",
        "Only change the visual icon rotation",
        "Only set a CSS class named expanded",
        "Only make the panel receive focus",
        "The exposed state must accurately describe the visible interaction state.",
        "Icon rotation changes appearance while leaving the false ARIA state exposed.",
        "A CSS class does not update the accessible expanded state by itself.",
        "Moving focus does not repair the incorrect expanded value."
      ],
      [
        "The state fixture prints true. What remains unverified?",
        "The real accessibility tree",
        "The supplied collection of panel IDs",
        "The model's boolean state comparison",
        "The conversion of the boolean to text",
        "A consistency model is not a browser semantic or assistive technology test.",
        "The ID collection is supplied to the model rather than inspected in a rendered document.",
        "The model's state comparison is already executed locally.",
        "The printed true value establishes text conversion rather than assistive-technology exposure."
      ]
    ],
    "mistakes": [
      "Adding a role while omitting its expected behavior.",
      "Letting ARIA state disagree with the displayed UI."
    ],
    "takeaways": [
      "Prefer native semantics and supplement deliberately.",
      "Test behavior and exposed state together."
    ],
    "prerequisite_note": "React Fundamentals is the canonical prerequisite. Review component state, events, effects and form ownership. This course adds accessibility contracts, layered testing, measured performance and release operations. Node assertion and arithmetic examples verify their stated models; browser, assistive technology and deployed-system evidence remain separate review tasks."
  },
  {
    "id": "quality-component-contract",
    "comp": "m2.c1",
    "title": "Test component outcomes through user-visible contracts",
    "introduction": "A save-button test inspects a private state variable and passes even though the confirmation text never appears. Tests should observe the behavior users depend on.",
    "sections": [
      {
        "heading": "Test component outcomes through user-visible contracts",
        "paragraphs": [
          "A component test should exercise a meaningful interaction and assert the resulting visible or accessible outcome. Query by role and accessible name when they match how users identify controls, rather than relying on private hook state or arbitrary CSS class names. The goal is a stable behavioral contract, not a ban on all implementation-specific tests: pure algorithms can still have focused unit tests at their own boundary.",
          "Control external dependencies at an appropriate seam, such as a synthetic API handler, and supply deliberate pending, success, empty and failure cases. Mocking the component\u2019s own logic can make a test pass without exercising its behavior. Assertions about called functions alone often miss whether the user received useful feedback or whether the submitted payload was correct."
        ]
      },
      {
        "heading": "Work through the decision and its limits",
        "paragraphs": [
          "Asynchronous UI assertions should wait for a relevant condition with a bounded timeout rather than a fixed sleep. A fixed delay can be too short on a slow runner and unnecessarily long when the UI is ready early. Isolate state between tests, avoid production identities, and use interactions that approximate actual user input for the level under test.",
          "The fixture uses Node\u2019s assertion module to check a pure submit-state contract. It is an executable unit example, not a mounted component test, DOM query or browser interaction. The teaching pattern must be applied in a real renderer or browser suite before claiming component behavior has been verified."
        ]
      }
    ],
    "worked": {
      "lang": "javascript",
      "code": "const assert=require(\"node:assert/strict\");\nfunction view(pending){return {disabled:pending,label:pending?\"Saving\":\"Save\"};}\nassert.deepEqual(view(true),{disabled:true,label:\"Saving\"});\nassert.equal(view(false).label,\"Save\");\nconsole.log(\"2 assertions passed\");",
      "expect": "2 assertions passed",
      "problem": "Test component outcomes through user-visible contracts",
      "steps": [
        "Read the synthetic fixture and its declared contract.",
        "Trace the exact calculation or assertion.",
        "Separate the observed output from real browser and production evidence."
      ],
      "explanation": "The fixture uses Node\u2019s assertion module to check a pure submit-state contract. It is an executable unit example, not a mounted component test, DOM query or browser interaction. The teaching pattern must be applied in a real renderer or browser suite before claiming component behavior has been verified."
    },
    "quiz": [
      [
        "Which assertion best represents a component behavior contract?",
        "The expected visible outcome",
        "Only a private state variable name",
        "Only the generated CSS hash",
        "Only the file\u2019s line count",
        "Tests should observe the meaningful result of an interaction.",
        "Only a private state variable name does not satisfy the stated requirement. Tests should observe the meaningful result of an interaction.",
        "Only the generated CSS hash does not satisfy the stated requirement. Tests should observe the meaningful result of an interaction.",
        "Only the file\u2019s line count does not satisfy the stated requirement. Tests should observe the meaningful result of an interaction."
      ],
      [
        "What can role and name queries express?",
        "How a control is identified",
        "A server authentication secret",
        "A compiler\u2019s internal symbol table",
        "A network\u2019s physical path",
        "Semantic queries can match user-facing control identification.",
        "A server authentication secret does not satisfy the stated requirement. Semantic queries can match user-facing control identification.",
        "A compiler\u2019s internal symbol table does not satisfy the stated requirement. Semantic queries can match user-facing control identification.",
        "A network\u2019s physical path does not satisfy the stated requirement. Semantic queries can match user-facing control identification."
      ],
      [
        "Why avoid fixed sleeps for asynchronous UI?",
        "They can be flaky and wasteful",
        "They validate more states",
        "They make all races impossible",
        "They replace assertions",
        "Condition-based waiting can finish when the expected state occurs within a bound.",
        "They validate more states does not satisfy the stated requirement. Condition-based waiting can finish when the expected state occurs within a bound.",
        "They make all races impossible does not satisfy the stated requirement. Condition-based waiting can finish when the expected state occurs within a bound.",
        "They replace assertions does not satisfy the stated requirement. Condition-based waiting can finish when the expected state occurs within a bound."
      ],
      [
        "A Save test mocks the entire component and checks its mock was called. What is missing?",
        "The component's real behavior",
        "Only the mock's invocation arguments",
        "Only the mock's recorded call count",
        "Only the mock's configured return value",
        "Replacing the subject under test can bypass the behavior the test is supposed to verify.",
        "Mock argument assertions still avoid executing the real component.",
        "A recorded call count proves invocation of the replacement rather than UI behavior.",
        "A mock return value cannot establish what the actual Save component does."
      ],
      [
        "A test clicks Save and checks only that fetch was called. Which assertion adds user value?",
        "The success or failure feedback",
        "Only the mock\u2019s variable name",
        "Only the CSS class count",
        "Only the test file extension",
        "A request call alone does not establish the user-facing outcome.",
        "Only the mock\u2019s variable name does not satisfy the stated requirement. A request call alone does not establish the user-facing outcome.",
        "Only the CSS class count does not satisfy the stated requirement. A request call alone does not establish the user-facing outcome.",
        "Only the test file extension does not satisfy the stated requirement. A request call alone does not establish the user-facing outcome."
      ],
      [
        "A test uses a generated CSS hash to find Submit. Which query is often more robust?",
        "Role plus accessible name",
        "Only the bundle checksum",
        "Only a random array index",
        "Only a timestamp attribute",
        "A semantic query relates to the control\u2019s purpose rather than incidental styling output.",
        "Only the bundle checksum does not satisfy the stated requirement. A semantic query relates to the control\u2019s purpose rather than incidental styling output.",
        "Only a random array index does not satisfy the stated requirement. A semantic query relates to the control\u2019s purpose rather than incidental styling output.",
        "Only a timestamp attribute does not satisfy the stated requirement. A semantic query relates to the control\u2019s purpose rather than incidental styling output."
      ],
      [
        "A pending-state test never covers rejection. What important contract is missing?",
        "Recovery after failure",
        "Only another success payload",
        "Only the default font",
        "Only a static heading",
        "Users need a usable retry or correction path when the external operation fails.",
        "Only another success payload does not satisfy the stated requirement. Users need a usable retry or correction path when the external operation fails.",
        "Only the default font does not satisfy the stated requirement. Users need a usable retry or correction path when the external operation fails.",
        "Only a static heading does not satisfy the stated requirement. Users need a usable retry or correction path when the external operation fails."
      ],
      [
        "The Node fixture passes two assertions. What has not been run?",
        "A mounted component interaction",
        "The pure state function",
        "The pending label comparison",
        "The disabled property check",
        "The fixture verifies a pure contract and does not render or dispatch user events.",
        "The pure state function does not satisfy the stated requirement. The fixture verifies a pure contract and does not render or dispatch user events.",
        "The pending label comparison does not satisfy the stated requirement. The fixture verifies a pure contract and does not render or dispatch user events.",
        "The disabled property check does not satisfy the stated requirement. The fixture verifies a pure contract and does not render or dispatch user events."
      ]
    ],
    "mistakes": [
      "Mocking the subject instead of its external dependency.",
      "Using sleeps instead of bounded condition waits."
    ],
    "takeaways": [
      "Assert outcomes users can observe.",
      "Identify the exact boundary each test exercises."
    ],
    "prerequisite_note": "React Fundamentals is the canonical prerequisite. Review component state, events, effects and form ownership. This course adds accessibility contracts, layered testing, measured performance and release operations. Node assertion and arithmetic examples verify their stated models; browser, assistive technology and deployed-system evidence remain separate review tasks."
  },
  {
    "id": "quality-end-to-end",
    "comp": "m2.c2",
    "title": "Exercise critical journeys with isolated identities and controlled state",
    "introduction": "A checkout passes component tests but fails after a successful login redirect. An end-to-end test must connect the boundaries users cross.",
    "sections": [
      {
        "heading": "Exercise critical journeys with isolated identities and controlled state",
        "paragraphs": [
          "Choose a small set of critical complete journeys such as sign in, select a product, submit an order and confirm the recorded outcome. End-to-end coverage should cross the relevant real application boundaries using synthetic accounts and isolated data. A browser-only journey against entirely stubbed APIs proves a different boundary from a test with an isolated real backend; describe the distinction accurately.",
          "Reset or uniquely provision test data so repeated runs are independent. Avoid relying on an order left by a previous test or a shared real customer account. Wait for user-visible conditions or known network milestones instead of arbitrary sleeps. Stable locators should express control semantics where possible, and failure artifacts should include enough context without exposing credentials or private data."
        ]
      },
      {
        "heading": "Work through the decision and its limits",
        "paragraphs": [
          "Cover a meaningful failure and recovery route in addition to the happy path. For checkout, a recoverable validation error followed by correction is often more revealing than a second nominal purchase. Verify server state when the journey\u2019s guarantee concerns a persisted write; a success toast alone could appear before the operation actually succeeds.",
          "The fixture checks an explicit synthetic journey event sequence and an order-count invariant. It does not launch a browser, authenticate an account or persist an order. It is a specification example for assertions to apply in the real isolated end-to-end suite, whose runtime evidence remains separate."
        ]
      }
    ],
    "worked": {
      "lang": "javascript",
      "code": "const assert=require(\"node:assert/strict\");\nconst events=[\"login\",\"select\",\"submit\",\"confirmed\"];\nassert.equal(events.at(-1),\"confirmed\");\nassert.equal(events.filter(x=>x===\"submit\").length,1);\nconsole.log(\"journey contract checked\");",
      "expect": "journey contract checked",
      "problem": "Exercise critical journeys with isolated identities and controlled state",
      "steps": [
        "Read the synthetic fixture and its declared contract.",
        "Trace the exact calculation or assertion.",
        "Separate the observed output from real browser and production evidence."
      ],
      "explanation": "The fixture checks an explicit synthetic journey event sequence and an order-count invariant. It does not launch a browser, authenticate an account or persist an order. It is a specification example for assertions to apply in the real isolated end-to-end suite, whose runtime evidence remains separate."
    },
    "quiz": [
      [
        "What is a suitable end-to-end target?",
        "A critical complete user journey",
        "Only a private helper rename",
        "Only a CSS variable spelling",
        "Only one array assignment",
        "End-to-end tests connect the boundaries needed for a meaningful user task.",
        "Only a private helper rename does not satisfy the stated requirement. End-to-end tests connect the boundaries needed for a meaningful user task.",
        "Only a CSS variable spelling does not satisfy the stated requirement. End-to-end tests connect the boundaries needed for a meaningful user task.",
        "Only one array assignment does not satisfy the stated requirement. End-to-end tests connect the boundaries needed for a meaningful user task."
      ],
      [
        "What kind of account should test journeys use?",
        "Isolated synthetic identities",
        "A shared production customer",
        "An administrator\u2019s real account",
        "An untracked public password",
        "Synthetic isolated identities avoid customer impact and support reproducibility.",
        "A shared production customer does not satisfy the stated requirement. Synthetic isolated identities avoid customer impact and support reproducibility.",
        "An administrator\u2019s real account does not satisfy the stated requirement. Synthetic isolated identities avoid customer impact and support reproducibility.",
        "An untracked public password does not satisfy the stated requirement. Synthetic isolated identities avoid customer impact and support reproducibility."
      ],
      [
        "Why reset or uniquely provision data?",
        "To keep runs independent",
        "To remove every assertion",
        "To avoid all negative cases",
        "To hide failed transactions",
        "Independent data prevents tests from relying on previous runs or each other.",
        "To remove every assertion does not satisfy the stated requirement. Independent data prevents tests from relying on previous runs or each other.",
        "To avoid all negative cases does not satisfy the stated requirement. Independent data prevents tests from relying on previous runs or each other.",
        "To hide failed transactions does not satisfy the stated requirement. Independent data prevents tests from relying on previous runs or each other."
      ],
      [
        "A checkout shows success but creates no order. Which assertion would reveal it?",
        "Verify the persisted order",
        "Only assert the success toast appeared",
        "Only confirm the Buy click was dispatched",
        "Only count the route transition events",
        "A persisted-write guarantee requires evidence of the recorded server outcome.",
        "A success toast can appear even when no server order exists.",
        "Dispatching a click does not prove the server persisted the intended order.",
        "Route changes can succeed without completing the business write."
      ],
      [
        "A browser suite stubs every backend response. Which claim should be limited?",
        "Real backend integration coverage",
        "The browser rendered the page",
        "The stub returned its payload",
        "The UI handled the fixture",
        "Full stubbing does not verify actual backend behavior.",
        "The browser rendered the page does not satisfy the stated requirement. Full stubbing does not verify actual backend behavior.",
        "The stub returned its payload does not satisfy the stated requirement. Full stubbing does not verify actual backend behavior.",
        "The UI handled the fixture does not satisfy the stated requirement. Full stubbing does not verify actual backend behavior."
      ],
      [
        "Two tests use the same cart and fail depending on order. What should change?",
        "Independent test state",
        "Only a larger timeout",
        "Only a slower animation",
        "Only a new screenshot name",
        "Shared mutable business state makes journeys interfere.",
        "Only a larger timeout does not satisfy the stated requirement. Shared mutable business state makes journeys interfere.",
        "Only a slower animation does not satisfy the stated requirement. Shared mutable business state makes journeys interfere.",
        "Only a new screenshot name does not satisfy the stated requirement. Shared mutable business state makes journeys interfere."
      ],
      [
        "A login redirect bug escapes component tests. Which coverage is relevant?",
        "The real multi-page login flow",
        "Only the input formatter unit",
        "Only the button snapshot",
        "Only a CSS parser check",
        "Cross-boundary navigation behavior needs an appropriate integration journey.",
        "Only the input formatter unit does not satisfy the stated requirement. Cross-boundary navigation behavior needs an appropriate integration journey.",
        "Only the button snapshot does not satisfy the stated requirement. Cross-boundary navigation behavior needs an appropriate integration journey.",
        "Only a CSS parser check does not satisfy the stated requirement. Cross-boundary navigation behavior needs an appropriate integration journey."
      ],
      [
        "The event fixture ends at confirmed. What remains untested?",
        "The browser and backend flow",
        "The fixture's last recorded event",
        "The model's submit-event count",
        "The local assertion's execution",
        "A local sequence is a specification model, not an end-to-end run.",
        "The final fixture event is already known from the supplied sequence.",
        "Counting synthetic submit events does not exercise the deployed order flow.",
        "The local assertion ran; browser interaction and backend integration remain outside its scope."
      ]
    ],
    "mistakes": [
      "Calling a stubbed browser test real backend coverage.",
      "Relying on a success toast to prove persistence."
    ],
    "takeaways": [
      "Use isolated data and explicit journey outcomes.",
      "Exercise relevant failure and recovery boundaries."
    ],
    "prerequisite_note": "React Fundamentals is the canonical prerequisite. Review component state, events, effects and form ownership. This course adds accessibility contracts, layered testing, measured performance and release operations. Node assertion and arithmetic examples verify their stated models; browser, assistive technology and deployed-system evidence remain separate review tasks."
  },
  {
    "id": "quality-test-layers",
    "comp": "m2.c1",
    "title": "Choose test layers that expose the actual defect",
    "introduction": "A team responds to every regression by adding another slow browser test. A useful suite allocates evidence to the smallest boundary that can reveal the problem.",
    "sections": [
      {
        "heading": "Choose test layers that expose the actual defect",
        "paragraphs": [
          "Pure calculations such as price rounding can be tested directly with focused unit cases. A component\u2019s interaction needs a renderer or browser; an API contract needs integration with the actual boundary or a contract verification process. End-to-end tests add confidence that the pieces work together but cost more to diagnose and maintain. The right layer follows the failure mechanism rather than a fixed count target.",
          "Test doubles should preserve the contract that matters. A fake network response that never returns malformed JSON cannot test parsing recovery. A fake clock can make timeout policy deterministic but does not establish actual network scheduling. Be explicit about what is replaced, then add appropriate evidence at the boundary where the replacement stops being representative."
        ]
      },
      {
        "heading": "Work through the decision and its limits",
        "paragraphs": [
          "Use code coverage to find unexercised paths, not to prove correctness from a percentage. A line can execute without an assertion that would detect a wrong result. Mutation testing can sometimes reveal weak assertions by changing behavior and checking whether tests fail, but it has its own runtime and interpretation costs.",
          "The fixture contrasts a meaningful equality assertion with a deliberately insufficient truthiness observation for zero. It runs actual Node assertions for the stated function result. No DOM, browser or coverage instrument is involved; the example explains why executing a branch and checking its precise contract are different evidence."
        ]
      }
    ],
    "worked": {
      "lang": "javascript",
      "code": "const assert=require(\"node:assert/strict\");\nfunction discount(total){return total===0?0:total*0.9;}\nassert.equal(discount(0),0);\nconsole.log(\"zero-value contract asserted\");",
      "expect": "zero-value contract asserted",
      "problem": "Choose test layers that expose the actual defect",
      "steps": [
        "Read the synthetic fixture and its declared contract.",
        "Trace the exact calculation or assertion.",
        "Separate the observed output from real browser and production evidence."
      ],
      "explanation": "The fixture contrasts a meaningful equality assertion with a deliberately insufficient truthiness observation for zero. It runs actual Node assertions for the stated function result. No DOM, browser or coverage instrument is involved; the example explains why executing a branch and checking its precise contract are different evidence."
    },
    "quiz": [
      [
        "Which layer suits a pure deterministic calculation?",
        "A focused unit test",
        "Only a production smoke test",
        "Only a full browser checkout",
        "Only a CSS screenshot",
        "A direct unit case can verify a bounded calculation contract efficiently.",
        "Only a production smoke test does not satisfy the stated requirement. A direct unit case can verify a bounded calculation contract efficiently.",
        "Only a full browser checkout does not satisfy the stated requirement. A direct unit case can verify a bounded calculation contract efficiently.",
        "Only a CSS screenshot does not satisfy the stated requirement. A direct unit case can verify a bounded calculation contract efficiently."
      ],
      [
        "Does 100% line coverage prove correctness?",
        "No, assertions still matter",
        "Yes, every bug is impossible",
        "Only for large files",
        "Only if comments are covered",
        "Executed lines can still produce wrong results that assertions never inspect.",
        "Yes, every bug is impossible does not satisfy the stated requirement. Executed lines can still produce wrong results that assertions never inspect.",
        "Only for large files does not satisfy the stated requirement. Executed lines can still produce wrong results that assertions never inspect.",
        "Only if comments are covered does not satisfy the stated requirement. Executed lines can still produce wrong results that assertions never inspect."
      ],
      [
        "What should a test double preserve?",
        "The relevant external contract",
        "Only a convenient success shape",
        "Only the component\u2019s private name",
        "Only a screenshot\u2019s dimensions",
        "A useful double must represent the behavior needed to test the intended boundary.",
        "Only a convenient success shape does not satisfy the stated requirement. A useful double must represent the behavior needed to test the intended boundary.",
        "Only the component\u2019s private name does not satisfy the stated requirement. A useful double must represent the behavior needed to test the intended boundary.",
        "Only a screenshot\u2019s dimensions does not satisfy the stated requirement. A useful double must represent the behavior needed to test the intended boundary."
      ],
      [
        "A mock never rejects, so the error path is never exercised. What should be added?",
        "A deliberate failure fixture",
        "Only more success snapshots",
        "Only a larger fake payload",
        "Only a longer timeout",
        "Failure and recovery need explicit controlled inputs.",
        "Only more success snapshots does not satisfy the stated requirement. Failure and recovery need explicit controlled inputs.",
        "Only a larger fake payload does not satisfy the stated requirement. Failure and recovery need explicit controlled inputs.",
        "Only a longer timeout does not satisfy the stated requirement. Failure and recovery need explicit controlled inputs."
      ],
      [
        "A pure tax function has a rounding bug. Which test most directly targets it?",
        "Boundary-value calculation cases",
        "Only a full login browser flow",
        "Only a header screenshot",
        "Only a package install check",
        "Focused numeric boundary cases isolate the calculation defect.",
        "Only a full login browser flow does not satisfy the stated requirement. Focused numeric boundary cases isolate the calculation defect.",
        "Only a header screenshot does not satisfy the stated requirement. Focused numeric boundary cases isolate the calculation defect.",
        "Only a package install check does not satisfy the stated requirement. Focused numeric boundary cases isolate the calculation defect."
      ],
      [
        "A line runs but its incorrect output never fails a test. What is weak?",
        "The assertion contract",
        "Only the coverage collector",
        "Only the source filename",
        "Only the bundler version",
        "Coverage counts execution, while assertions determine whether wrong behavior is detected.",
        "Only the coverage collector does not satisfy the stated requirement. Coverage counts execution, while assertions determine whether wrong behavior is detected.",
        "Only the source filename does not satisfy the stated requirement. Coverage counts execution, while assertions determine whether wrong behavior is detected.",
        "Only the bundler version does not satisfy the stated requirement. Coverage counts execution, while assertions determine whether wrong behavior is detected."
      ],
      [
        "A fake clock test passes. Which claim is still limited?",
        "Real network timing behavior",
        "The fake schedule\u2019s result",
        "The explicit timeout branch",
        "The deterministic assertion",
        "A controlled clock does not reproduce every transport and browser scheduling interaction.",
        "The fake schedule\u2019s result does not satisfy the stated requirement. A controlled clock does not reproduce every transport and browser scheduling interaction.",
        "The explicit timeout branch does not satisfy the stated requirement. A controlled clock does not reproduce every transport and browser scheduling interaction.",
        "The deterministic assertion does not satisfy the stated requirement. A controlled clock does not reproduce every transport and browser scheduling interaction."
      ],
      [
        "The zero-value fixture passes. What has it established?",
        "One exact pure-function result",
        "Complete checkout correctness",
        "Every discount policy",
        "Browser rendering success",
        "The assertion proves only the stated input and result contract.",
        "Complete checkout correctness does not satisfy the stated requirement. The assertion proves only the stated input and result contract.",
        "Every discount policy does not satisfy the stated requirement. The assertion proves only the stated input and result contract.",
        "Browser rendering success does not satisfy the stated requirement. The assertion proves only the stated input and result contract."
      ]
    ],
    "mistakes": [
      "Chasing coverage percentage without effective assertions.",
      "Adding expensive journeys for defects a smaller layer can isolate."
    ],
    "takeaways": [
      "Choose evidence from the defect boundary.",
      "Make doubles and omissions explicit."
    ],
    "prerequisite_note": "React Fundamentals is the canonical prerequisite. Review component state, events, effects and form ownership. This course adds accessibility contracts, layered testing, measured performance and release operations. Node assertion and arithmetic examples verify their stated models; browser, assistive technology and deployed-system evidence remain separate review tasks."
  },
  {
    "id": "quality-vitals-diagnosis",
    "comp": "m3.c1",
    "title": "Diagnose loading, responsiveness and stability separately",
    "introduction": "A dashboard\u2019s hero loads slowly, filters respond late and cards jump during loading. These symptoms belong to different performance dimensions and need different evidence.",
    "sections": [
      {
        "heading": "Diagnose loading, responsiveness and stability separately",
        "paragraphs": [
          "Core Web Vitals distinguish Largest Contentful Paint for loading experience, Interaction to Next Paint for responsiveness and Cumulative Layout Shift for visual stability. Common good thresholds are LCP at most 2.5 seconds, INP at most 200 milliseconds and CLS at most 0.1, evaluated using the relevant field percentile and context. A single lab run is diagnostic evidence, not a guarantee of the field distribution.",
          "Use DevTools traces and network waterfalls to identify causes rather than optimizing by guesswork. A slow LCP can include resource discovery delay, transfer time and render delay; INP can reflect input delay, event processing and presentation delay. Layout shifts can arise from unreserved media, injected content and late font changes. Improving one metric does not automatically improve the others."
        ]
      },
      {
        "heading": "Work through the decision and its limits",
        "paragraphs": [
          "Segment field data by relevant device and navigation context, and compare changes against an appropriate baseline. Averages can conceal poor tail experience, so assess the intended percentile rather than reporting only a fast developer laptop. Lab tooling helps reproduce mechanisms while real-user measurement captures actual traffic conditions; both have limits and complement each other.",
          "The fixture calculates a declared nearest-rank percentile for a small synthetic LCP sample and compares it to a threshold. It is not a complete field aggregation method, browser trace or real-user measurement pipeline. Its purpose is to demonstrate why percentile selection differs from averaging before interpreting production evidence."
        ]
      }
    ],
    "worked": {
      "lang": "javascript",
      "code": "const samples=[1200,1800,2200,2400,4000].sort((a,b)=>a-b);\nconst p75=samples[Math.ceil(.75*samples.length)-1];\nconsole.log(p75);\nconsole.log(p75<=2500?\"good LCP sample\":\"needs improvement\");",
      "expect": "2400\ngood LCP sample",
      "problem": "Diagnose loading, responsiveness and stability separately",
      "steps": [
        "Read the synthetic fixture and its declared contract.",
        "Trace the exact calculation or assertion.",
        "Separate the observed output from real browser and production evidence."
      ],
      "explanation": "The fixture calculates a declared nearest-rank percentile for a small synthetic LCP sample and compares it to a threshold. It is not a complete field aggregation method, browser trace or real-user measurement pipeline. Its purpose is to demonstrate why percentile selection differs from averaging before interpreting production evidence."
    },
    "quiz": [
      [
        "Which metric concerns visual stability?",
        "CLS",
        "LCP",
        "INP",
        "Response.ok",
        "Cumulative Layout Shift measures unexpected layout shift behavior.",
        "LCP does not satisfy the stated requirement. Cumulative Layout Shift measures unexpected layout shift behavior.",
        "INP does not satisfy the stated requirement. Cumulative Layout Shift measures unexpected layout shift behavior.",
        "Response.ok does not satisfy the stated requirement. Cumulative Layout Shift measures unexpected layout shift behavior."
      ],
      [
        "Which metric concerns interaction responsiveness?",
        "INP",
        "CLS",
        "LCP",
        "Image byte count",
        "Interaction to Next Paint evaluates responsiveness across user interactions.",
        "CLS does not satisfy the stated requirement. Interaction to Next Paint evaluates responsiveness across user interactions.",
        "LCP does not satisfy the stated requirement. Interaction to Next Paint evaluates responsiveness across user interactions.",
        "Image byte count does not satisfy the stated requirement. Interaction to Next Paint evaluates responsiveness across user interactions."
      ],
      [
        "Which metric concerns largest visible content loading?",
        "LCP",
        "INP",
        "CLS",
        "Tab index",
        "Largest Contentful Paint represents a loading-experience milestone.",
        "INP does not satisfy the stated requirement. Largest Contentful Paint represents a loading-experience milestone.",
        "CLS does not satisfy the stated requirement. Largest Contentful Paint represents a loading-experience milestone.",
        "Tab index does not satisfy the stated requirement. Largest Contentful Paint represents a loading-experience milestone."
      ],
      [
        "A hero is discovered late despite a fast transfer. Which diagnosis is relevant?",
        "Resource discovery delay",
        "Only cumulative shift score",
        "Only the input handler length",
        "Only the cookie path",
        "LCP can be delayed before the resource request even starts.",
        "Only cumulative shift score does not satisfy the stated requirement. LCP can be delayed before the resource request even starts.",
        "Only the input handler length does not satisfy the stated requirement. LCP can be delayed before the resource request even starts.",
        "Only the cookie path does not satisfy the stated requirement. LCP can be delayed before the resource request even starts."
      ],
      [
        "A click waits behind a long main-thread task. Which metric is most directly relevant?",
        "INP",
        "Only image dimensions",
        "Only font file count",
        "Only cache age",
        "Main-thread delays can degrade interaction responsiveness measured by INP.",
        "Only image dimensions does not satisfy the stated requirement. Main-thread delays can degrade interaction responsiveness measured by INP.",
        "Only font file count does not satisfy the stated requirement. Main-thread delays can degrade interaction responsiveness measured by INP.",
        "Only cache age does not satisfy the stated requirement. Main-thread delays can degrade interaction responsiveness measured by INP."
      ],
      [
        "An image moves text when it loads. Which prevention should be investigated?",
        "Reserve its intended space",
        "Only reduce click handler size",
        "Only rename the image",
        "Only reorder source comments",
        "Known dimensions or aspect ratio can prevent loading-related layout movement.",
        "Only reduce click handler size does not satisfy the stated requirement. Known dimensions or aspect ratio can prevent loading-related layout movement.",
        "Only rename the image does not satisfy the stated requirement. Known dimensions or aspect ratio can prevent loading-related layout movement.",
        "Only reorder source comments does not satisfy the stated requirement. Known dimensions or aspect ratio can prevent loading-related layout movement."
      ],
      [
        "A lab run is fast but mobile field data is slow. What should be compared?",
        "Representative user conditions",
        "Only the fastest run",
        "Only the bundle filename",
        "Only the developer\u2019s monitor",
        "Field conditions can differ in device, network and navigation behavior.",
        "Only the fastest run does not satisfy the stated requirement. Field conditions can differ in device, network and navigation behavior.",
        "Only the bundle filename does not satisfy the stated requirement. Field conditions can differ in device, network and navigation behavior.",
        "Only the developer\u2019s monitor does not satisfy the stated requirement. Field conditions can differ in device, network and navigation behavior."
      ],
      [
        "The sample percentile is 2400ms. What has not been collected?",
        "Real-user performance data",
        "The sorted supplied values",
        "The rank calculation",
        "The threshold comparison",
        "The fixture operates on synthetic values rather than actual traffic.",
        "The sorted supplied values does not satisfy the stated requirement. The fixture operates on synthetic values rather than actual traffic.",
        "The rank calculation does not satisfy the stated requirement. The fixture operates on synthetic values rather than actual traffic.",
        "The threshold comparison does not satisfy the stated requirement. The fixture operates on synthetic values rather than actual traffic."
      ]
    ],
    "mistakes": [
      "Treating a lab score as the complete field distribution.",
      "Optimizing transfer size without identifying the delayed phase."
    ],
    "takeaways": [
      "Distinguish loading, responsiveness and stability.",
      "Diagnose causes with traces and representative field evidence."
    ],
    "prerequisite_note": "React Fundamentals is the canonical prerequisite. Review component state, events, effects and form ownership. This course adds accessibility contracts, layered testing, measured performance and release operations. Node assertion and arithmetic examples verify their stated models; browser, assistive technology and deployed-system evidence remain separate review tasks."
  },
  {
    "id": "quality-resource-delivery",
    "comp": "m3.c2",
    "title": "Optimize resources with cache correctness and bundle evidence",
    "introduction": "A release makes the initial JavaScript smaller but serves old HTML that references removed assets. Performance changes must retain a coherent deployment and cache contract.",
    "sections": [
      {
        "heading": "Optimize resources with cache correctness and bundle evidence",
        "paragraphs": [
          "Measure bundle composition and route needs before splitting code. Dynamic import can defer code until needed, but excessive fragmentation can add request and execution overhead. Remove unnecessary dependencies and avoid shipping the same library twice where the build permits deduplication. A smaller compressed download does not automatically imply low parse, compile and execution cost on slower devices.",
          "Use fingerprinted asset filenames for long-lived immutable caching when the URL changes with content. HTML often needs a different revalidation policy so clients can discover the current asset graph. Cache-Control:no-cache means stored responses must be revalidated before reuse under its semantics; it does not mean no storage. no-store directs caches not to store the response. Do not cache private user data under a public shared policy."
        ]
      },
      {
        "heading": "Work through the decision and its limits",
        "paragraphs": [
          "Optimize images with appropriate dimensions, compression and priority, retaining visual meaning and alternatives. Keep old fingerprinted assets available long enough for clients holding previous HTML, or use an equivalent safe deployment strategy. Service workers add another cache lifecycle and should be tested for update and rollback behavior rather than assumed to help automatically.",
          "The fixture creates content-derived synthetic asset names and illustrates that changed content has a changed key. It does not run a bundler, send HTTP caching headers or implement a service worker. Browser network inspection, asset availability and deployment compatibility tests are needed to prove actual delivery behavior."
        ]
      }
    ],
    "worked": {
      "lang": "javascript",
      "code": "const {createHash}=require(\"node:crypto\");\nconst key=s=>createHash(\"sha256\").update(s).digest(\"hex\").slice(0,8);\nconsole.log(key(\"v1\")===key(\"v1\"));\nconsole.log(key(\"v1\")!==key(\"v2\"));",
      "expect": "true\ntrue",
      "problem": "Optimize resources with cache correctness and bundle evidence",
      "steps": [
        "Read the synthetic fixture and its declared contract.",
        "Trace the exact calculation or assertion.",
        "Separate the observed output from real browser and production evidence."
      ],
      "explanation": "The fixture creates content-derived synthetic asset names and illustrates that changed content has a changed key. It does not run a bundler, send HTTP caching headers or implement a service worker. Browser network inspection, asset availability and deployment compatibility tests are needed to prove actual delivery behavior."
    },
    "quiz": [
      [
        "What should a content-fingerprinted asset URL do when bytes change?",
        "Change its fingerprint",
        "Keep every URL fixed forever",
        "Lose its MIME type",
        "Become a user password",
        "Content-derived naming lets different immutable resources have distinct URLs.",
        "Keep every URL fixed forever does not satisfy the stated requirement. Content-derived naming lets different immutable resources have distinct URLs.",
        "Lose its MIME type does not satisfy the stated requirement. Content-derived naming lets different immutable resources have distinct URLs.",
        "Become a user password does not satisfy the stated requirement. Content-derived naming lets different immutable resources have distinct URLs."
      ],
      [
        "Does no-cache mean no storage?",
        "No, it requires revalidation",
        "Yes, storage is prohibited",
        "Only for CSS assets",
        "Only for all HTTPS pages",
        "No-cache and no-store express different caching rules.",
        "Yes, storage is prohibited does not satisfy the stated requirement. No-cache and no-store express different caching rules.",
        "Only for CSS assets does not satisfy the stated requirement. No-cache and no-store express different caching rules.",
        "Only for all HTTPS pages does not satisfy the stated requirement. No-cache and no-store express different caching rules."
      ],
      [
        "Which directive tells caches not to store?",
        "no-store",
        "no-cache only",
        "max-age=31536000",
        "immutable only",
        "No-store directs caches not to retain the response.",
        "no-cache only does not satisfy the stated requirement. No-store directs caches not to retain the response.",
        "max-age=31536000 does not satisfy the stated requirement. No-store directs caches not to retain the response.",
        "immutable only does not satisfy the stated requirement. No-store directs caches not to retain the response."
      ],
      [
        "An old HTML page refers to deleted hashed JavaScript. What is needed?",
        "Compatible retained assets",
        "Only a newly generated filename hash",
        "Only a successful new-bundle upload",
        "Only a clean-browser smoke test",
        "Clients with earlier HTML still need its referenced assets available.",
        "A new filename does not restore the old resource referenced by cached HTML.",
        "Uploading the new bundle does not preserve compatibility for older clients.",
        "A clean browser avoids the cached HTML that reproduces this rollout defect."
      ],
      [
        "A private account response is marked public for a shared cache. What risk needs repair?",
        "Cross-user data exposure",
        "Only slower decoding",
        "Only a larger border",
        "Only an uncompressed font",
        "Private data must not be exposed through inappropriate shared caching.",
        "Only slower decoding does not satisfy the stated requirement. Private data must not be exposed through inappropriate shared caching.",
        "Only a larger border does not satisfy the stated requirement. Private data must not be exposed through inappropriate shared caching.",
        "Only an uncompressed font does not satisfy the stated requirement. Private data must not be exposed through inappropriate shared caching."
      ],
      [
        "A route loads a large editor library before it is needed. Which optimization is worth measuring?",
        "Defer optional editor code",
        "Split only the tiny route metadata",
        "Preload the editor on every page",
        "Inline the editor in initial HTML",
        "Code splitting can defer optional route work when its tradeoffs are measured.",
        "Splitting tiny metadata leaves the large optional editor on the initial path.",
        "Preloading everywhere still spends resources before the editor is needed.",
        "Inlining the editor increases initial work rather than deferring optional code."
      ],
      [
        "A compressed bundle shrinks but interaction stays slow. What should be measured next?",
        "Parse and execution work",
        "Only filename length",
        "Only HTML indentation",
        "Only the favicon size",
        "Transfer bytes and main-thread execution cost are different performance factors.",
        "Only filename length does not satisfy the stated requirement. Transfer bytes and main-thread execution cost are different performance factors.",
        "Only HTML indentation does not satisfy the stated requirement. Transfer bytes and main-thread execution cost are different performance factors.",
        "Only the favicon size does not satisfy the stated requirement. Transfer bytes and main-thread execution cost are different performance factors."
      ],
      [
        "The hash fixture prints two true values. What remains unverified?",
        "Actual HTTP cache behavior",
        "Equal-input hash stability",
        "Changed-input key difference",
        "The digest function\u2019s execution",
        "A filename model does not exercise cache headers or deployed assets.",
        "Equal-input hash stability does not satisfy the stated requirement. A filename model does not exercise cache headers or deployed assets.",
        "Changed-input key difference does not satisfy the stated requirement. A filename model does not exercise cache headers or deployed assets.",
        "The digest function\u2019s execution does not satisfy the stated requirement. A filename model does not exercise cache headers or deployed assets."
      ]
    ],
    "mistakes": [
      "Using no-cache and no-store as interchangeable terms.",
      "Deleting assets still referenced by cached HTML."
    ],
    "takeaways": [
      "Measure bytes and main-thread work separately.",
      "Keep cache policy coherent with deployment versions."
    ],
    "prerequisite_note": "React Fundamentals is the canonical prerequisite. Review component state, events, effects and form ownership. This course adds accessibility contracts, layered testing, measured performance and release operations. Node assertion and arithmetic examples verify their stated models; browser, assistive technology and deployed-system evidence remain separate review tasks."
  },
  {
    "id": "quality-performance-experiment",
    "comp": "m3.c1",
    "title": "Run performance experiments that distinguish causes from noise",
    "introduction": "A team celebrates one fast run after removing a library. Reliable diagnosis requires representative conditions and a comparison that supports the claimed effect.",
    "sections": [
      {
        "heading": "Run performance experiments that distinguish causes from noise",
        "paragraphs": [
          "State a hypothesis tied to a mechanism, such as reducing a long task by deferring a noncritical editor. Hold relevant conditions stable when comparing lab traces and repeat enough measurements to understand variance. A single warm-cache run after a cold-cache baseline changes more than one factor and cannot cleanly identify the optimization\u2019s effect.",
          "Separate lab experiments from field evaluation. Lab runs can inspect a particular device/network profile and reveal main-thread or loading phases. Field data can show real population outcomes but includes release timing, traffic mix and other confounders. Use appropriate segmentation and cautious interpretation before attributing every difference to one code change."
        ]
      },
      {
        "heading": "Work through the decision and its limits",
        "paragraphs": [
          "Track functional and accessibility regressions during optimization. Removing an accessible error message may reduce DOM work but harm the task; deferring critical controls may lower initial bytes while making interaction worse. Define an acceptance criterion that includes the intended performance measure and preserved product behavior.",
          "The code calculates medians for supplied before/after samples and prints their difference. It does not establish causation, significance or real browser performance. Treat the arithmetic as a way to summarize a controlled experiment\u2019s data, with experiment design and production evidence reviewed separately."
        ]
      }
    ],
    "worked": {
      "lang": "javascript",
      "code": "const median=a=>[...a].sort((x,y)=>x-y)[Math.floor(a.length/2)];\nconst before=[300,320,310],after=[220,210,230];\nconsole.log(median(before)-median(after));",
      "expect": "90",
      "problem": "Run performance experiments that distinguish causes from noise",
      "steps": [
        "Read the synthetic fixture and its declared contract.",
        "Trace the exact calculation or assertion.",
        "Separate the observed output from real browser and production evidence."
      ],
      "explanation": "The code calculates medians for supplied before/after samples and prints their difference. It does not establish causation, significance or real browser performance. Treat the arithmetic as a way to summarize a controlled experiment\u2019s data, with experiment design and production evidence reviewed separately."
    },
    "quiz": [
      [
        "What should a performance hypothesis identify?",
        "A measurable mechanism",
        "Only a preferred library name",
        "Only a new CSS class",
        "Only a release slogan",
        "A useful hypothesis connects a change to a specific performance cause and outcome.",
        "Only a preferred library name does not satisfy the stated requirement. A useful hypothesis connects a change to a specific performance cause and outcome.",
        "Only a new CSS class does not satisfy the stated requirement. A useful hypothesis connects a change to a specific performance cause and outcome.",
        "Only a release slogan does not satisfy the stated requirement. A useful hypothesis connects a change to a specific performance cause and outcome."
      ],
      [
        "Why control cache conditions in a comparison?",
        "They can change measured timing",
        "They make all tests identical",
        "They authorize the user",
        "They remove every network cost",
        "Warm and cold caches can materially affect results independent of the code change.",
        "They make all tests identical does not satisfy the stated requirement. Warm and cold caches can materially affect results independent of the code change.",
        "They authorize the user does not satisfy the stated requirement. Warm and cold caches can materially affect results independent of the code change.",
        "They remove every network cost does not satisfy the stated requirement. Warm and cold caches can materially affect results independent of the code change."
      ],
      [
        "Does a median difference prove causation?",
        "No, experiment design matters",
        "Yes, any difference is causal",
        "Only when it is positive",
        "Only when samples are arrays",
        "A summary statistic alone does not control confounders or establish causality.",
        "Yes, any difference is causal does not satisfy the stated requirement. A summary statistic alone does not control confounders or establish causality.",
        "Only when it is positive does not satisfy the stated requirement. A summary statistic alone does not control confounders or establish causality.",
        "Only when samples are arrays does not satisfy the stated requirement. A summary statistic alone does not control confounders or establish causality."
      ],
      [
        "A baseline is cold-cache and the new run is warm-cache. What is the comparison issue?",
        "A changed confounding condition",
        "A guaranteed code improvement",
        "An automatic security fix",
        "A missing array sort only",
        "Different cache conditions can explain timing differences apart from the implementation.",
        "A guaranteed code improvement does not satisfy the stated requirement. Different cache conditions can explain timing differences apart from the implementation.",
        "An automatic security fix does not satisfy the stated requirement. Different cache conditions can explain timing differences apart from the implementation.",
        "A missing array sort only does not satisfy the stated requirement. Different cache conditions can explain timing differences apart from the implementation."
      ],
      [
        "A smaller bundle defers the checkout button\u2019s code until late. What must acceptance evaluate?",
        "Critical interaction readiness",
        "Only compressed byte count",
        "Only the file\u2019s hash",
        "Only the import statement count",
        "Initial transfer savings should not break or delay the intended task.",
        "Only compressed byte count does not satisfy the stated requirement. Initial transfer savings should not break or delay the intended task.",
        "Only the file\u2019s hash does not satisfy the stated requirement. Initial transfer savings should not break or delay the intended task.",
        "Only the import statement count does not satisfy the stated requirement. Initial transfer savings should not break or delay the intended task."
      ],
      [
        "A field comparison mixes low-end mobile before with desktop after. What should improve?",
        "Representative segmentation",
        "Only the metric\u2019s label",
        "Only the chart\u2019s font",
        "Only the sample id strings",
        "Population changes can confound apparent improvements.",
        "Only the metric\u2019s label does not satisfy the stated requirement. Population changes can confound apparent improvements.",
        "Only the chart\u2019s font does not satisfy the stated requirement. Population changes can confound apparent improvements.",
        "Only the sample id strings does not satisfy the stated requirement. Population changes can confound apparent improvements."
      ],
      [
        "An optimization removes error feedback to reduce rendering work. What is the regression?",
        "Recovery and accessibility",
        "Only a lower component render count",
        "Only fewer browser DOM mutations",
        "Only a smaller client script bundle",
        "Performance work must preserve meaningful usable behavior.",
        "A reduced render count can conceal the loss of necessary error feedback.",
        "Fewer DOM mutations are not a sufficient outcome when users cannot recover.",
        "A smaller script bundle does not justify removing accessible recovery information."
      ],
      [
        "The median fixture prints 90. What is not established?",
        "Causal production improvement",
        "The sorted sample medians",
        "The subtraction result",
        "The declared sample inputs",
        "Synthetic summary arithmetic cannot establish real user impact or causation.",
        "The sorted sample medians does not satisfy the stated requirement. Synthetic summary arithmetic cannot establish real user impact or causation.",
        "The subtraction result does not satisfy the stated requirement. Synthetic summary arithmetic cannot establish real user impact or causation.",
        "The declared sample inputs does not satisfy the stated requirement. Synthetic summary arithmetic cannot establish real user impact or causation."
      ]
    ],
    "mistakes": [
      "Comparing different cache and device conditions as one causal result.",
      "Accepting speed changes that break task behavior."
    ],
    "takeaways": [
      "Tie experiments to a mechanism and representative conditions.",
      "Preserve functionality and accessibility during optimization."
    ],
    "prerequisite_note": "React Fundamentals is the canonical prerequisite. Review component state, events, effects and form ownership. This course adds accessibility contracts, layered testing, measured performance and release operations. Node assertion and arithmetic examples verify their stated models; browser, assistive technology and deployed-system evidence remain separate review tasks."
  },
  {
    "id": "quality-release-pipeline",
    "comp": "m4.c1",
    "title": "Build once and promote an identifiable artifact",
    "introduction": "A staging build passes tests, but production rebuilds from a newer dependency graph. The deployed artifact no longer matches the thing that was verified.",
    "sections": [
      {
        "heading": "Build once and promote an identifiable artifact",
        "paragraphs": [
          "A release pipeline should produce an identifiable build artifact from a known source revision and dependency lock state. Promote the verified artifact across environments when the architecture permits, injecting intended environment configuration through a controlled contract. Rebuilding independently can create drift from time, dependency resolution or build-time variables, so record what actually reached each environment.",
          "Classify configuration as build-time public frontend values, runtime public values or server-only secrets. Anything included in a browser bundle is readable by users; a variable name containing SECRET does not make its contents private. Validate required endpoints and environment identifiers before promotion so a staging client does not accidentally target production writes."
        ]
      },
      {
        "heading": "Work through the decision and its limits",
        "paragraphs": [
          "Gate promotion with relevant automated checks, a release record and a rollback plan. A successful build command establishes packaging, not the complete application journey. Post-deploy smoke checks should verify representative critical flows and asset availability without using real customer data. Keep the release identity visible in diagnostics to connect issues to the actual artifact.",
          "The fixture hashes synthetic build bytes and compares the same artifact across two environment records. It does not run a CI provider, deploy a site or prove configuration correctness. Real promotion evidence needs the recorded artifact digest, applied configuration and environment-specific smoke checks."
        ]
      }
    ],
    "worked": {
      "lang": "javascript",
      "code": "const {createHash}=require(\"node:crypto\");\nconst digest=createHash(\"sha256\").update(\"synthetic-build-v1\").digest(\"hex\");\nconst staging={digest},production={digest};\nconsole.log(staging.digest===production.digest);",
      "expect": "true",
      "problem": "Build once and promote an identifiable artifact",
      "steps": [
        "Read the synthetic fixture and its declared contract.",
        "Trace the exact calculation or assertion.",
        "Separate the observed output from real browser and production evidence."
      ],
      "explanation": "The fixture hashes synthetic build bytes and compares the same artifact across two environment records. It does not run a CI provider, deploy a site or prove configuration correctness. Real promotion evidence needs the recorded artifact digest, applied configuration and environment-specific smoke checks."
    },
    "quiz": [
      [
        "What identifies the exact promoted build?",
        "An artifact digest and revision",
        "Only a branch nickname",
        "Only a screenshot title",
        "Only the release meeting date",
        "A digest and source identity connect verification to the deployed artifact.",
        "Only a branch nickname does not satisfy the stated requirement. A digest and source identity connect verification to the deployed artifact.",
        "Only a screenshot title does not satisfy the stated requirement. A digest and source identity connect verification to the deployed artifact.",
        "Only the release meeting date does not satisfy the stated requirement. A digest and source identity connect verification to the deployed artifact."
      ],
      [
        "Can a browser bundle keep an embedded secret private?",
        "No, users can inspect it",
        "Yes, if the name says SECRET",
        "Only if it is minified",
        "Only if CSS is external",
        "Code and values delivered to the browser are accessible to its users.",
        "Yes, if the name says SECRET does not satisfy the stated requirement. Code and values delivered to the browser are accessible to its users.",
        "Only if it is minified does not satisfy the stated requirement. Code and values delivered to the browser are accessible to its users.",
        "Only if CSS is external does not satisfy the stated requirement. Code and values delivered to the browser are accessible to its users."
      ],
      [
        "Why promote a verified artifact?",
        "To reduce rebuild drift",
        "To skip all smoke tests",
        "To remove every config value",
        "To grant all users access",
        "Artifact promotion retains the exact built content that was verified.",
        "To skip all smoke tests does not satisfy the stated requirement. Artifact promotion retains the exact built content that was verified.",
        "To remove every config value does not satisfy the stated requirement. Artifact promotion retains the exact built content that was verified.",
        "To grant all users access does not satisfy the stated requirement. Artifact promotion retains the exact built content that was verified."
      ],
      [
        "Staging passes but production rebuilds with changed dependencies. What evidence gap exists?",
        "The deployed artifact differs",
        "Only the route\u2019s font changed",
        "Only the release title differs",
        "Only the screenshot is old",
        "The verified build and deployed bytes may no longer match.",
        "Only the route\u2019s font changed does not satisfy the stated requirement. The verified build and deployed bytes may no longer match.",
        "Only the release title differs does not satisfy the stated requirement. The verified build and deployed bytes may no longer match.",
        "Only the screenshot is old does not satisfy the stated requirement. The verified build and deployed bytes may no longer match."
      ],
      [
        "A frontend environment variable contains a database password. What should change?",
        "Keep the secret on the server",
        "Rename the build variable to PRIVATE",
        "Base64-encode the bundled password",
        "Deliver the password in runtime config",
        "A browser-delivered value cannot be protected by naming or encoding.",
        "A variable name does not hide a password delivered in browser assets.",
        "Base64 is reversible encoding rather than a server-side secret boundary.",
        "A runtime configuration file delivered to the browser is also public to that client."
      ],
      [
        "A staging client points at production write APIs. What contract needs validation?",
        "Endpoint environment mapping",
        "Only the successful bundle digest",
        "Only the configured UI locale",
        "Only the source dependency lockfile",
        "Correct environment targeting is part of safe release configuration.",
        "A digest identifies the bundle but may not identify separately applied runtime endpoints.",
        "Locale configuration does not establish the target API environment.",
        "A dependency lockfile does not validate whether staging writes go to production."
      ],
      [
        "A build exits successfully but routes fail after promotion. What was still needed?",
        "Environment smoke checks",
        "Only another minifier run",
        "Only a new folder name",
        "Only a code comment",
        "Packaging success does not establish deployed navigation and asset correctness.",
        "Only another minifier run does not satisfy the stated requirement. Packaging success does not establish deployed navigation and asset correctness.",
        "Only a new folder name does not satisfy the stated requirement. Packaging success does not establish deployed navigation and asset correctness.",
        "Only a code comment does not satisfy the stated requirement. Packaging success does not establish deployed navigation and asset correctness."
      ],
      [
        "The digest fixture prints true. What remains untested?",
        "Actual deployment and config",
        "The input-byte hash",
        "The compared digest values",
        "The equality expression",
        "A synthetic artifact comparison does not deploy or verify an environment.",
        "The input-byte hash does not satisfy the stated requirement. A synthetic artifact comparison does not deploy or verify an environment.",
        "The compared digest values does not satisfy the stated requirement. A synthetic artifact comparison does not deploy or verify an environment.",
        "The equality expression does not satisfy the stated requirement. A synthetic artifact comparison does not deploy or verify an environment."
      ]
    ],
    "mistakes": [
      "Embedding private credentials in frontend environment variables.",
      "Verifying one build and deploying another."
    ],
    "takeaways": [
      "Connect checks to exact artifact identity.",
      "Verify environment configuration and runtime journeys."
    ],
    "prerequisite_note": "React Fundamentals is the canonical prerequisite. Review component state, events, effects and form ownership. This course adds accessibility contracts, layered testing, measured performance and release operations. Node assertion and arithmetic examples verify their stated models; browser, assistive technology and deployed-system evidence remain separate review tasks."
  },
  {
    "id": "quality-error-monitoring",
    "comp": "m4.c2",
    "title": "Monitor failures with useful context and restrained data",
    "introduction": "A production bug report says only Something went wrong. The team needs release and failure context without copying customer secrets into telemetry.",
    "sections": [
      {
        "heading": "Monitor failures with useful context and restrained data",
        "paragraphs": [
          "Capture error category, release identity and relevant environment or route context to make failures actionable. Browser uncaught errors and unhandled promise rejections cover some paths, while handled API failures need deliberate operational signals. Avoid logging credentials, raw private form values or entire response bodies by default. A stable sanitized correlation identifier can connect client and server evidence when the architecture supports it.",
          "Source maps can help map minified stack traces to authored code, but their storage and access should follow the release\u2019s artifact policy. Uploading them privately to an authorized diagnostic service is different from exposing all source assets publicly. Ensure maps match the exact release; an incorrect map can mislead diagnosis."
        ]
      },
      {
        "heading": "Work through the decision and its limits",
        "paragraphs": [
          "Track error rate against a meaningful denominator and segment by release or platform as relevant. Alert on actionable changes instead of every isolated event, with thresholds that reflect the product\u2019s critical flows. Sampling and deduplication can reduce volume but may hide rare critical failures if applied carelessly. Monitoring is evidence for recovery decisions, not proof that unreported users had no problems.",
          "The fixture calculates a synthetic failure rate and emits a sanitized record containing only category and release. It does not collect real browser events, upload telemetry or prove regulatory compliance. Review actual SDK defaults, transport and retention under the application\u2019s data policy, and test that credentials are excluded from diagnostic artifacts."
        ]
      }
    ],
    "worked": {
      "lang": "javascript",
      "code": "const failures=5,attempts=100;\nconsole.log((100*failures/attempts).toFixed(1)+\"%\");\nconsole.log(JSON.stringify({category:\"api_timeout\",release:\"synthetic-r1\"}));",
      "expect": "5.0%\n{\"category\":\"api_timeout\",\"release\":\"synthetic-r1\"}",
      "problem": "Monitor failures with useful context and restrained data",
      "steps": [
        "Read the synthetic fixture and its declared contract.",
        "Trace the exact calculation or assertion.",
        "Separate the observed output from real browser and production evidence."
      ],
      "explanation": "The fixture calculates a synthetic failure rate and emits a sanitized record containing only category and release. It does not collect real browser events, upload telemetry or prove regulatory compliance. Review actual SDK defaults, transport and retention under the application\u2019s data policy, and test that credentials are excluded from diagnostic artifacts."
    },
    "quiz": [
      [
        "Which context helps connect an error to deployed code?",
        "The release identity",
        "Only the user\u2019s font size",
        "Only the button\u2019s color",
        "Only the route\u2019s word count",
        "Release identifiers connect diagnostics to the actual deployed artifact.",
        "Only the user\u2019s font size does not satisfy the stated requirement. Release identifiers connect diagnostics to the actual deployed artifact.",
        "Only the button\u2019s color does not satisfy the stated requirement. Release identifiers connect diagnostics to the actual deployed artifact.",
        "Only the route\u2019s word count does not satisfy the stated requirement. Release identifiers connect diagnostics to the actual deployed artifact."
      ],
      [
        "Should telemetry copy access tokens by default?",
        "No, exclude sensitive credentials",
        "Yes, they simplify every report",
        "Only if the string is short",
        "Only when the request fails",
        "Credentials should not be propagated into diagnostic records.",
        "Yes, they simplify every report does not satisfy the stated requirement. Credentials should not be propagated into diagnostic records.",
        "Only if the string is short does not satisfy the stated requirement. Credentials should not be propagated into diagnostic records.",
        "Only when the request fails does not satisfy the stated requirement. Credentials should not be propagated into diagnostic records."
      ],
      [
        "What can source maps support?",
        "Map traces to original source",
        "Automatically reproduce user state",
        "Automatically identify root cause",
        "Automatically select a safe rollback",
        "Matching source maps can make bundled stack traces more actionable.",
        "Source maps translate code locations without recreating the user's state.",
        "Mapped code can aid diagnosis but does not automatically establish root cause.",
        "A source map does not prove a rollback is compatible or safe."
      ],
      [
        "A telemetry SDK logs full payment form bodies. What should be changed?",
        "Sanitize the captured data",
        "Only compress the log file",
        "Only rename the event",
        "Only increase sampling",
        "Diagnostics should avoid collecting private values that are not needed for diagnosis.",
        "Only compress the log file does not satisfy the stated requirement. Diagnostics should avoid collecting private values that are not needed for diagnosis.",
        "Only rename the event does not satisfy the stated requirement. Diagnostics should avoid collecting private values that are not needed for diagnosis.",
        "Only increase sampling does not satisfy the stated requirement. Diagnostics should avoid collecting private values that are not needed for diagnosis."
      ],
      [
        "An error spike begins with one release. What segmentation helps?",
        "Compare error rate by release",
        "Only count all events forever",
        "Only inspect the logo version",
        "Only sort routes alphabetically",
        "Release-level rates can associate a regression with a specific artifact.",
        "Only count all events forever does not satisfy the stated requirement. Release-level rates can associate a regression with a specific artifact.",
        "Only inspect the logo version does not satisfy the stated requirement. Release-level rates can associate a regression with a specific artifact.",
        "Only sort routes alphabetically does not satisfy the stated requirement. Release-level rates can associate a regression with a specific artifact."
      ],
      [
        "A minified stack is mapped using the wrong release\u2019s source map. What risk follows?",
        "Misleading source locations",
        "Guaranteed accurate debugging",
        "Automatic safe remediation",
        "A faster network connection",
        "Source maps must match the exact built code they describe.",
        "Guaranteed accurate debugging does not satisfy the stated requirement. Source maps must match the exact built code they describe.",
        "Automatic safe remediation does not satisfy the stated requirement. Source maps must match the exact built code they describe.",
        "A faster network connection does not satisfy the stated requirement. Source maps must match the exact built code they describe."
      ],
      [
        "A monitoring dashboard has few events because sampling excludes a rare critical failure. What needs review?",
        "Coverage of critical failures",
        "Only the total event count average",
        "Only the overall sampling percentage",
        "Only the fastest reporting endpoint",
        "Volume reduction should not conceal important low-frequency failures.",
        "An average event count can hide exclusion of rare severe failures.",
        "One overall percentage does not show whether critical error classes are retained.",
        "Faster delivery does not recover events excluded by sampling policy."
      ],
      [
        "The fixture prints a 5% failure rate. What has not been measured?",
        "Actual production error traffic",
        "The supplied count division",
        "The percentage formatting",
        "The sanitized object string",
        "The rate is computed from synthetic input rather than a live monitoring system.",
        "The supplied count division does not satisfy the stated requirement. The rate is computed from synthetic input rather than a live monitoring system.",
        "The percentage formatting does not satisfy the stated requirement. The rate is computed from synthetic input rather than a live monitoring system.",
        "The sanitized object string does not satisfy the stated requirement. The rate is computed from synthetic input rather than a live monitoring system."
      ]
    ],
    "mistakes": [
      "Logging private payloads to make debugging convenient.",
      "Using raw failure counts without an attempt denominator."
    ],
    "takeaways": [
      "Capture actionable release-linked context.",
      "Keep telemetry data deliberate and sanitized."
    ],
    "prerequisite_note": "React Fundamentals is the canonical prerequisite. Review component state, events, effects and form ownership. This course adds accessibility contracts, layered testing, measured performance and release operations. Node assertion and arithmetic examples verify their stated models; browser, assistive technology and deployed-system evidence remain separate review tasks."
  },
  {
    "id": "quality-rollback-assets",
    "comp": "m4.c1",
    "title": "Rollback with compatible assets and observable recovery",
    "introduction": "A faulty frontend release is rolled back, but clients still execute its cached bundle. A recovery plan must account for the versions already in users\u2019 browsers.",
    "sections": [
      {
        "heading": "Rollback with compatible assets and observable recovery",
        "paragraphs": [
          "A frontend rollback restores a known-good artifact and compatible configuration. It does not automatically revert backend data, schema changes or actions already performed by users. Review compatibility across the old client, new server and cached asset graph. Progressive rollout can limit exposure, but recovery still needs clear signals and a tested path.",
          "Fingerprint immutable assets and retain versions needed by cached HTML or open tabs. Service workers can continue serving an earlier or faulty cache independently of the server\u2019s current files. A rollback runbook should describe the actual update lifecycle and how clients obtain a coherent version without creating a reload loop or discarding unsaved work unnecessarily."
        ]
      },
      {
        "heading": "Work through the decision and its limits",
        "paragraphs": [
          "Verify recovery through critical-flow smoke tests and monitoring segmented by release. A successful deployment job does not prove that the affected population has recovered, especially when caches or long-lived sessions are involved. Track which versions still produce failures, and communicate any required user action through an intentional product flow.",
          "The fixture checks whether a supplied rollback artifact\u2019s required assets remain available and distinguishes frontend recovery from data reversal. It does not deploy, invalidate caches or exercise a service worker. Actual rollback evidence needs compatible environment tests and observed post-change behavior."
        ]
      }
    ],
    "worked": {
      "lang": "javascript",
      "code": "const required=[\"app.old.js\",\"app.old.css\"],available=new Set([\"app.old.js\",\"app.old.css\",\"app.new.js\"]);\nconsole.log(required.every(x=>available.has(x)));\nconsole.log(\"frontend rollback is not data rollback\");",
      "expect": "true\nfrontend rollback is not data rollback",
      "problem": "Rollback with compatible assets and observable recovery",
      "steps": [
        "Read the synthetic fixture and its declared contract.",
        "Trace the exact calculation or assertion.",
        "Separate the observed output from real browser and production evidence."
      ],
      "explanation": "The fixture checks whether a supplied rollback artifact\u2019s required assets remain available and distinguishes frontend recovery from data reversal. It does not deploy, invalidate caches or exercise a service worker. Actual rollback evidence needs compatible environment tests and observed post-change behavior."
    },
    "quiz": [
      [
        "Does a frontend rollback reverse prior server data changes?",
        "No, data needs separate handling",
        "Yes, old client assets undo all writes",
        "Yes, reloading rolls back server state",
        "No, because rollback cannot restore JS",
        "Restoring client assets does not undo server-side operations or schema changes.",
        "Restoring old JavaScript does not undo writes already committed by the server.",
        "Reloading the browser cannot reverse completed server-side business operations.",
        "Rollback can restore JavaScript assets; the separate concern is persisted business data."
      ],
      [
        "What should a rollback target identify?",
        "Known-good artifact and config",
        "Only an old screenshot",
        "Only a remembered branch label",
        "Only a release meeting note",
        "Recovery needs exact compatible deployable content and configuration.",
        "Only an old screenshot does not satisfy the stated requirement. Recovery needs exact compatible deployable content and configuration.",
        "Only a remembered branch label does not satisfy the stated requirement. Recovery needs exact compatible deployable content and configuration.",
        "Only a release meeting note does not satisfy the stated requirement. Recovery needs exact compatible deployable content and configuration."
      ],
      [
        "Why retain older fingerprinted assets?",
        "Cached clients can reference them",
        "They force every open tab to reload",
        "They guarantee old API compatibility",
        "They undo previous server-side writes",
        "Older HTML and open clients can still depend on their version’s resources.",
        "Retaining files does not force existing tabs to reload.",
        "Asset availability alone does not guarantee API contract compatibility.",
        "Stored older assets do not reverse previously committed data changes."
      ],
      [
        "A rollback changes server files but a service worker serves the broken cache. What is missing?",
        "Client cache lifecycle recovery",
        "Only a successful upload exit code",
        "Only a CSS comment",
        "Only the new release title",
        "Client caching can preserve a release independently of the current server artifact.",
        "Only a successful upload exit code does not satisfy the stated requirement. Client caching can preserve a release independently of the current server artifact.",
        "Only a CSS comment does not satisfy the stated requirement. Client caching can preserve a release independently of the current server artifact.",
        "Only the new release title does not satisfy the stated requirement. Client caching can preserve a release independently of the current server artifact."
      ],
      [
        "An old client cannot call the newly changed API after rollback. What must the plan account for?",
        "Cross-version API compatibility",
        "Only the older client's route fallback",
        "Only retention of the old stylesheet",
        "Only a clean-browser loading result",
        "Recovery must consider interactions between client and server versions.",
        "A route fallback helps navigation but does not restore a removed API field.",
        "Stylesheet retention does not make the old client's API requests compatible.",
        "A successful clean load may omit the API interaction that the old client needs."
      ],
      [
        "A deployment job succeeds after rollback but errors continue for old tabs. Which evidence matters?",
        "Release-segmented user outcomes",
        "Only the green deployment badge",
        "Only the artifact\u2019s folder size",
        "Only a new screenshot",
        "Actual clients can retain versions and need observable recovery evidence.",
        "Only the green deployment badge does not satisfy the stated requirement. Actual clients can retain versions and need observable recovery evidence.",
        "Only the artifact\u2019s folder size does not satisfy the stated requirement. Actual clients can retain versions and need observable recovery evidence.",
        "Only a new screenshot does not satisfy the stated requirement. Actual clients can retain versions and need observable recovery evidence."
      ],
      [
        "A recovery flow reloads endlessly and loses drafts. What should be redesigned?",
        "Update and draft-preservation policy",
        "Only the retry spinner's frame rate",
        "Only the new bundle's compression mode",
        "Only the deployment script's exit code",
        "Version recovery should avoid loops and unnecessary loss of user work.",
        "A smoother spinner does not bound reloads or preserve unsaved drafts.",
        "Compression does not establish a safe update lifecycle.",
        "A successful deploy command does not prove browser recovery preserves in-progress work."
      ],
      [
        "The fixture says all old assets exist. What is untested?",
        "Real rollout and cache behavior",
        "The presence of supplied asset names",
        "The fixture's set membership operation",
        "The printed final availability result",
        "Availability in a synthetic set does not establish deployed serving or client update behavior.",
        "The asset names are supplied to the fixture rather than discovered in live caches.",
        "Set membership is the local operation already exercised.",
        "The printed result reflects supplied data rather than the behavior of returning browsers."
      ]
    ],
    "mistakes": [
      "Assuming client rollback automatically reverses server writes.",
      "Ignoring existing caches and open tabs during recovery."
    ],
    "takeaways": [
      "Plan exact compatible recovery artifacts.",
      "Verify user outcomes after restoring the release."
    ],
    "prerequisite_note": "React Fundamentals is the canonical prerequisite. Review component state, events, effects and form ownership. This course adds accessibility contracts, layered testing, measured performance and release operations. Node assertion and arithmetic examples verify their stated models; browser, assistive technology and deployed-system evidence remain separate review tasks."
  }
],[
  {
    "id": "quality-access",
    "title": "MDN: Accessibility",
    "url": "https://github.com/mdn/content/blob/33afe694c61ec6a36bf2e363124c1210b25a5c0f/files/en-us/learn_web_development/core/accessibility/html/index.md",
    "source": {
      "repo": "mdn/content",
      "commit": "33afe694c61ec6a36bf2e363124c1210b25a5c0f",
      "path": "files/en-us/learn_web_development/core/accessibility/html/index.md",
      "verification": "Official source inspected at pinned commit; examples explicitly identify their execution boundary."
    }
  },
  {
    "id": "quality-aria",
    "title": "MDN: WAI-ARIA basics",
    "url": "https://github.com/mdn/content/blob/33afe694c61ec6a36bf2e363124c1210b25a5c0f/files/en-us/learn_web_development/core/accessibility/wai-aria_basics/index.md",
    "source": {
      "repo": "mdn/content",
      "commit": "33afe694c61ec6a36bf2e363124c1210b25a5c0f",
      "path": "files/en-us/learn_web_development/core/accessibility/wai-aria_basics/index.md",
      "verification": "Official source inspected at pinned commit; examples explicitly identify their execution boundary."
    }
  },
  {
    "id": "quality-performance",
    "title": "MDN: Web performance",
    "url": "https://github.com/mdn/content/blob/33afe694c61ec6a36bf2e363124c1210b25a5c0f/files/en-us/web/performance/index.md",
    "source": {
      "repo": "mdn/content",
      "commit": "33afe694c61ec6a36bf2e363124c1210b25a5c0f",
      "path": "files/en-us/web/performance/index.md",
      "verification": "Official source inspected at pinned commit; examples explicitly identify their execution boundary."
    }
  },
  {
    "id": "quality-cache",
    "title": "MDN: HTTP caching",
    "url": "https://github.com/mdn/content/blob/33afe694c61ec6a36bf2e363124c1210b25a5c0f/files/en-us/web/http/guides/caching/index.md",
    "source": {
      "repo": "mdn/content",
      "commit": "33afe694c61ec6a36bf2e363124c1210b25a5c0f",
      "path": "files/en-us/web/http/guides/caching/index.md",
      "verification": "Official source inspected at pinned commit; examples explicitly identify their execution boundary."
    }
  }
]);
