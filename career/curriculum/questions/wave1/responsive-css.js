'use strict';
const {bank}=require('../../learning/wave1/web-helper');
module.exports=bank("responsive-css",[
  {
    "comp": "m1.c1",
    "rows": [
      [
        "What is the main axis of flex-direction:row tied to?",
        "The inline direction",
        "The block direction",
        "The physical right edge",
        "The document tab sequence",
        "Row follows inline direction, which depends on writing mode and direction.",
        "Block direction defines a column main axis rather than row.",
        "The inline direction may run right to left and is not a fixed physical edge.",
        "Tab sequence comes from document order, not the flex main axis."
      ],
      [
        "Which items become flex items?",
        "Direct in-flow children",
        "Every nested descendant",
        "Only elements with ids",
        "Only button elements",
        "A flex context lays out its direct in-flow children.",
        "Every nested descendant does not satisfy the stated requirement. A flex context lays out its direct in-flow children.",
        "Only elements with ids does not satisfy the stated requirement. A flex context lays out its direct in-flow children.",
        "Only button elements does not satisfy the stated requirement. A flex context lays out its direct in-flow children."
      ],
      [
        "What does gap provide in a flex container?",
        "Gutters between items",
        "Space around the container",
        "Padding inside each item",
        "The minimum width of items",
        "Gap separates adjacent items without adding an outside gutter.",
        "Gap does not add outside spacing around the container.",
        "Padding adds space within an item rather than between siblings.",
        "Gap adds separation without setting an item's minimum size."
      ],
      [
        "A right-to-left dashboard aligns a row using hard-coded left assumptions. What should guide the repair?",
        "Logical axis relationships",
        "Reverse the DOM on every locale",
        "Keep physical left alignment",
        "Set direction on labels alone",
        "Logical axes follow writing direction and better express the intended alignment.",
        "Changing DOM order per locale can damage stable reading and focus order.",
        "Physical left alignment does not express the locale's inline start.",
        "Changing label direction alone leaves the layout-axis assumptions intact."
      ],
      [
        "A header needs centered cross-axis boxes despite varied heights. Which declaration fits?",
        "align-items:center",
        "justify-content:center",
        "align-content:center",
        "align-self:stretch",
        "Align-items controls cross-axis placement of flex items.",
        "Justify-content centers along the main axis, not the cross axis.",
        "Align-content distributes lines, not individual boxes within a line.",
        "Stretch fills the cross size rather than centering varied heights."
      ],
      [
        "A support bar has three items with even free space only between them. Which value fits?",
        "space-between",
        "space-around",
        "space-evenly",
        "flex-start",
        "Space-between places free space in intervening intervals without outer distribution.",
        "space-around does not satisfy the stated requirement. Space-between places free space in intervening intervals without outer distribution.",
        "space-evenly does not satisfy the stated requirement. Space-between places free space in intervening intervals without outer distribution.",
        "flex-start does not satisfy the stated requirement. Space-between places free space in intervening intervals without outer distribution."
      ],
      [
        "A designer wants equal space around every action including half-sized outer intervals. Which distribution fits?",
        "space-around",
        "space-between",
        "flex-start",
        "baseline",
        "Space-around gives each item equal surrounding allocation, producing half outer intervals.",
        "space-between does not satisfy the stated requirement. Space-around gives each item equal surrounding allocation, producing half outer intervals.",
        "flex-start does not satisfy the stated requirement. Space-around gives each item equal surrounding allocation, producing half outer intervals.",
        "baseline does not satisfy the stated requirement. Space-around gives each item equal surrounding allocation, producing half outer intervals."
      ],
      [
        "A locale change flips inline direction. What can row-reverse additionally do?",
        "Reverse that main direction",
        "Reverse keyboard navigation",
        "Switch to the block direction",
        "Restore the original DOM order",
        "Row-reverse reverses the direction defined by row but does not establish accessible source order.",
        "Visual reversal does not reverse the keyboard navigation sequence.",
        "Row-reverse keeps the inline axis and reverses its direction.",
        "Flex direction does not rewrite the DOM sequence."
      ],
      [
        "A bar shrinks until there is no positive free space. What should the engineer stop assuming?",
        "Distribution creates room",
        "Gap has a declared value",
        "Children have base sizes",
        "Flex axes still exist",
        "Space distribution cannot manufacture positive room when content consumes the available width.",
        "Gap has a declared value does not satisfy the stated requirement. Space distribution cannot manufacture positive room when content consumes the available width.",
        "Children have base sizes does not satisfy the stated requirement. Space distribution cannot manufacture positive room when content consumes the available width.",
        "Flex axes still exist does not satisfy the stated requirement. Space distribution cannot manufacture positive room when content consumes the available width."
      ],
      [
        "A review finds the correct action visually first but last in DOM order. What is the strongest remedy?",
        "Correct source sequencing",
        "Reverse the visual row again",
        "Set positive tabindex values",
        "Apply order to the last action",
        "Meaningful DOM order supports reading and focus before visual layout adjustments.",
        "Another visual reversal leaves the conflicting DOM sequence in place.",
        "Positive tabindex creates a separate focus order rather than repairing source structure.",
        "Order changes appearance without correcting document reading order."
      ]
    ]
  },
  {
    "comp": "m1.c1",
    "rows": [
      [
        "What does flex-grow:0 mean for positive space allocation?",
        "No grow share for that item",
        "Its base size becomes zero",
        "It no longer shrinks at all",
        "Its width is fixed to content",
        "A zero grow factor prevents positive free-space growth but does not set the base size.",
        "A zero growth factor leaves the flex basis intact.",
        "Flex-shrink controls negative-space participation independently.",
        "The item can still have a non-content basis and participate in shrinking."
      ],
      [
        "What does flex-shrink:0 request?",
        "No shrink participation",
        "No starting content size",
        "Automatic text clipping",
        "Equal sizing of all peers",
        "The item does not participate in negative free-space shrink allocation.",
        "No starting content size does not satisfy the stated requirement. The item does not participate in negative free-space shrink allocation.",
        "Automatic text clipping does not satisfy the stated requirement. The item does not participate in negative free-space shrink allocation.",
        "Equal sizing of all peers does not satisfy the stated requirement. The item does not participate in negative free-space shrink allocation."
      ],
      [
        "Which shorthand starts from an auto basis?",
        "flex:auto",
        "flex:1 1 0px",
        "flex:0 1 0px",
        "flex:1 0 0px",
        "Flex auto corresponds to a growable and shrinkable auto-basis item.",
        "A zero-pixel basis does not start from the item's auto size.",
        "Changing the grow factor does not make a zero basis auto.",
        "Disabling shrink still leaves this shorthand with a zero basis."
      ],
      [
        "A description and icon have grow factors 2 and 1 with 90px positive space. What is the extra share in an unconstrained model?",
        "60px and 30px",
        "45px and 45px",
        "90px and 90px",
        "30px and 60px",
        "Two thirds and one third of positive free space follow the declared growth ratio.",
        "45px and 45px does not satisfy the stated requirement. Two thirds and one third of positive free space follow the declared growth ratio.",
        "90px and 90px does not satisfy the stated requirement. Two thirds and one third of positive free space follow the declared growth ratio.",
        "30px and 60px does not satisfy the stated requirement. Two thirds and one third of positive free space follow the declared growth ratio."
      ],
      [
        "A finance table uses overflow:hidden to make a total fit. What should the review prioritize?",
        "Preserving the complete total",
        "Clip it to the visible cell",
        "Scale all text below legibility",
        "Put the total only in a tooltip",
        "A layout repair must retain meaningful financial information.",
        "Clipping can hide meaningful digits from the financial total.",
        "Unreadably small text sacrifices access even when the box fits.",
        "A tooltip alone does not guarantee access across keyboard and touch input."
      ],
      [
        "A wide child ignores a parent’s flexible width. Which DevTools value is especially useful?",
        "Computed minimum main size",
        "Only the network initiator",
        "Only the document title",
        "Only storage quota",
        "Minimum constraints can explain why the child will not follow shrink allocation.",
        "The grow factor concerns positive free space rather than the minimum shrink limit.",
        "Border thickness can add width but does not expose an automatic minimum constraint.",
        "Alignment positions items without revealing their minimum main size."
      ],
      [
        "A sidebar has a maximum width and stops growing. Where can remaining free space go?",
        "Other eligible growing items",
        "Always outside the viewport",
        "Only into the stopped sidebar",
        "Nowhere under all conditions",
        "The algorithm can redistribute space when a constrained item freezes.",
        "Always outside the viewport does not satisfy the stated requirement. The algorithm can redistribute space when a constrained item freezes.",
        "Only into the stopped sidebar does not satisfy the stated requirement. The algorithm can redistribute space when a constrained item freezes.",
        "Nowhere under all conditions does not satisfy the stated requirement. The algorithm can redistribute space when a constrained item freezes."
      ],
      [
        "A team expects flex:1 to preserve every content-based starting width. What needs correction?",
        "Its zero-basis behavior",
        "Its automatic intrinsic basis",
        "Its lack of shrink allocation",
        "Its fixed minimum content width",
        "The common flex 1 expansion uses a zero basis, unlike auto-basis sizing.",
        "Flex:1 commonly uses a zero basis rather than an intrinsic auto basis.",
        "Flex:1 permits shrinking; it does not remove negative-space allocation.",
        "The shorthand does not impose a fixed min-content width itself."
      ],
      [
        "An identifier must remain copyable on mobile. Which repair is defensible?",
        "Allow wrapping or usable scrolling",
        "Clip with no expansion control",
        "Shrink text without a lower bound",
        "Replace text with a screenshot",
        "The policy should preserve access to the complete value.",
        "Clipping without expansion loses access to the full identifier.",
        "Unbounded text shrinking can make the value unusable even if it fits.",
        "A screenshot does not preserve direct text selection and copying."
      ],
      [
        "A sizing incident only occurs with translated text. What evidence best evaluates the fix?",
        "Real long-label rendering",
        "Only the arithmetic fixture",
        "Only English screenshots",
        "Only style lint success",
        "Intrinsic content and language expansion need actual layout checks.",
        "Only the arithmetic fixture does not satisfy the stated requirement. Intrinsic content and language expansion need actual layout checks.",
        "Only English screenshots does not satisfy the stated requirement. Intrinsic content and language expansion need actual layout checks.",
        "Only style lint success does not satisfy the stated requirement. Intrinsic content and language expansion need actual layout checks."
      ]
    ]
  },
  {
    "comp": "m1.c1",
    "rows": [
      [
        "What does nowrap require of flex line collection?",
        "A single flex line",
        "A single text line per item",
        "A zero minimum item width",
        "A fixed height on every item",
        "Nowrap keeps items on one flex line even when sizes create overflow.",
        "Flex line collection is independent of text wrapping inside an item.",
        "Nowrap does not reset the automatic minimum size.",
        "One flex line can contain items with different heights."
      ],
      [
        "Which value preserves an uncluttered start edge on short lines?",
        "justify-content:flex-start",
        "justify-content:space-between",
        "align-items:stretch",
        "flex-direction:row-reverse",
        "Start alignment avoids distributing the final line’s spare width between items.",
        "justify-content:space-between does not satisfy the stated requirement. Start alignment avoids distributing the final line’s spare width between items.",
        "align-items:stretch does not satisfy the stated requirement. Start alignment avoids distributing the final line’s spare width between items.",
        "flex-direction:row-reverse does not satisfy the stated requirement. Start alignment avoids distributing the final line’s spare width between items."
      ],
      [
        "Can align-items replace align-content?",
        "No, they align different things",
        "Yes, both distribute lines",
        "Yes, both size flex items",
        "No, one changes the main axis",
        "Align-items positions items within lines whereas align-content distributes the lines.",
        "Align-items positions items within each line rather than distributing lines.",
        "Neither property replaces the flex sizing factors.",
        "Both operate on cross-axis alignment rather than changing the main axis."
      ],
      [
        "A controls panel needs 12px gutters between rows and columns. Which concise rule fits?",
        "gap:12px",
        "column-gap:12px",
        "row-gap:12px",
        "padding:12px",
        "Gap creates internal row and column gutters without trailing external spacing.",
        "Column-gap alone does not supply the requested row gutters.",
        "Row-gap alone does not supply the requested column gutters.",
        "Container padding adds outside inset rather than gutters between children."
      ],
      [
        "A toolbar wraps when zoom increases. Which outcome should the team protect?",
        "Every action stays reachable",
        "Every action keeps one fixed line",
        "Only the first action remains",
        "All action text becomes an image",
        "Responsive wrapping should preserve access as effective content space changes.",
        "Every action keeps one fixed line does not satisfy the stated requirement. Responsive wrapping should preserve access as effective content space changes.",
        "Only the first action remains does not satisfy the stated requirement. Responsive wrapping should preserve access as effective content space changes.",
        "All action text becomes an image does not satisfy the stated requirement. Responsive wrapping should preserve access as effective content space changes."
      ],
      [
        "A final line is stretched by space-between. What is a content-driven alternative?",
        "Use start alignment with gaps",
        "Add invisible focusable fillers",
        "Delete the final filter",
        "Force the whole page wider",
        "Start alignment with explicit gutters avoids artificial holes between the remaining items.",
        "Add invisible focusable fillers does not satisfy the stated requirement. Start alignment with explicit gutters avoids artificial holes between the remaining items.",
        "Delete the final filter does not satisfy the stated requirement. Start alignment with explicit gutters avoids artificial holes between the remaining items.",
        "Force the whole page wider does not satisfy the stated requirement. Start alignment with explicit gutters avoids artificial holes between the remaining items."
      ],
      [
        "A multi-line bar has fixed spare height. Which property distributes lines within that height?",
        "align-content",
        "align-self",
        "flex-grow on the parent",
        "text-decoration",
        "Align-content addresses cross-axis distribution of multiple flex lines.",
        "align-self does not satisfy the stated requirement. Align-content addresses cross-axis distribution of multiple flex lines.",
        "flex-grow on the parent does not satisfy the stated requirement. Align-content addresses cross-axis distribution of multiple flex lines.",
        "text-decoration does not satisfy the stated requirement. Align-content addresses cross-axis distribution of multiple flex lines."
      ],
      [
        "A row’s item widths vary significantly. What invalidates a constant-capacity formula?",
        "Different hypothetical item sizes",
        "Only consistent gap values",
        "Only semantic button markup",
        "Only source-order preservation",
        "Variable sizes mean the fixed-width grouping simplification no longer describes collection.",
        "A fixed container width does not invalidate a formula that assumes that width.",
        "A consistent gap is already compatible with a constant-capacity formula.",
        "A child count alone does not expose the varying item-width assumption."
      ],
      [
        "A translated button is wider than the container. Which test is necessary?",
        "The single-item narrow-width case",
        "The average item at desktop width",
        "The shortest label at narrow width",
        "Only all items at the widest width",
        "Even one flex item must have an intentional fit or overflow policy.",
        "An average width at desktop size can hide a single oversized item.",
        "The shortest label cannot reproduce the reported oversized translation.",
        "The widest viewport avoids the narrow-width failure condition."
      ],
      [
        "A designer reverses wrapped rows visually. What must accessibility review compare?",
        "Visual and DOM sequence",
        "Only pointer target alignment",
        "Only the calculated row count",
        "Only the spacing of the last row",
        "Visual rearrangement can diverge from reading and keyboard order.",
        "Pointer alignment does not establish the keyboard reading sequence.",
        "A row count cannot reveal visual versus focus ordering.",
        "Gap size measures spacing rather than the order of interactive elements."
      ]
    ]
  },
  {
    "comp": "m2.c1",
    "rows": [
      [
        "Which grid property describes explicit rows?",
        "grid-template-rows",
        "grid-auto-columns",
        "flex-wrap",
        "line-height",
        "Grid-template-rows sets the explicit row track list.",
        "grid-auto-columns does not satisfy the stated requirement. Grid-template-rows sets the explicit row track list.",
        "flex-wrap does not satisfy the stated requirement. Grid-template-rows sets the explicit row track list.",
        "line-height does not satisfy the stated requirement. Grid-template-rows sets the explicit row track list."
      ],
      [
        "What separates adjacent grid tracks?",
        "gap",
        "outline-offset",
        "text-indent",
        "font-size-adjust",
        "Gap introduces gutters between tracks.",
        "outline-offset does not satisfy the stated requirement. Gap introduces gutters between tracks.",
        "text-indent does not satisfy the stated requirement. Gap introduces gutters between tracks.",
        "font-size-adjust does not satisfy the stated requirement. Gap introduces gutters between tracks."
      ],
      [
        "Does 1fr automatically mean one equal viewport fraction?",
        "No, remaining sizing matters",
        "Yes, it divides viewport width",
        "Yes, it includes fixed columns",
        "Yes, it ignores all grid gaps",
        "Fr operates within grid sizing after other relevant track constraints.",
        "A fractional unit shares available grid space rather than viewport width.",
        "Fixed columns consume space before fractional distribution.",
        "Declared gaps consume available space and cannot be ignored."
      ],
      [
        "A dashboard contains 200px and 1fr columns with a 24px gap in 900px. What is the simple remainder?",
        "676px",
        "700px",
        "724px",
        "900px",
        "The available flexible remainder is 900 minus 200 minus 24.",
        "700px does not satisfy the stated requirement. The available flexible remainder is 900 minus 200 minus 24.",
        "724px does not satisfy the stated requirement. The available flexible remainder is 900 minus 200 minus 24.",
        "900px does not satisfy the stated requirement. The available flexible remainder is 900 minus 200 minus 24."
      ],
      [
        "A report table is wider than its allocated track. Which policy preserves its data?",
        "A usable contained scroller",
        "Clip overflowing columns",
        "Remove numeric columns",
        "Expand the entire viewport",
        "Contained scrolling can preserve wide tabular information without forcing page-wide overflow.",
        "Clipping removes access to data beyond the allocated track.",
        "Removing numeric columns destroys the report's information.",
        "Expanding the whole page can create an unusable global horizontal overflow."
      ],
      [
        "A developer changes only grid-item min-width:0. What might still constrain the layout?",
        "The track sizing definition",
        "Only the item border color",
        "Only the table cell spacing",
        "Only the grid row placement",
        "Track constraints and item constraints are related but distinct sizing inputs.",
        "Border color does not impose an intrinsic track minimum.",
        "Table spacing may affect content size but does not identify the grid track constraint.",
        "Row placement concerns vertical position rather than the reported column width."
      ],
      [
        "A 1fr and 2fr pair shares 600px under unconstrained assumptions. Which allocation fits?",
        "200px and 400px",
        "300px and 300px",
        "400px and 200px",
        "600px and 1200px",
        "The fractional factors allocate one third and two thirds of the remainder.",
        "300px and 300px does not satisfy the stated requirement. The fractional factors allocate one third and two thirds of the remainder.",
        "400px and 200px does not satisfy the stated requirement. The fractional factors allocate one third and two thirds of the remainder.",
        "600px and 1200px does not satisfy the stated requirement. The fractional factors allocate one third and two thirds of the remainder."
      ],
      [
        "A screenshot looks correct with short sample data. What should a dashboard fixture add?",
        "Long and unbreakable content",
        "Only the shortest supported text",
        "Only an empty-state screenshot",
        "Only a second theme variant",
        "Intrinsic minimum behavior often appears with realistic long content.",
        "Short labels avoid the intrinsic-width stress being investigated.",
        "An empty state does not exercise the report's populated cells.",
        "A theme variant does not introduce difficult intrinsic content."
      ],
      [
        "A team sets a zero track minimum and claims all content now fits. What is missing?",
        "An item overflow strategy",
        "A larger fixed row count",
        "A new auto-placement direction",
        "A second template area name",
        "Track shrinkage alone does not determine how oversized item content is presented.",
        "A row count does not decide how wide content remains accessible.",
        "Auto-placement direction does not resolve item content overflow.",
        "Area names place items without giving their content an overflow policy."
      ],
      [
        "A grid audit must explain unexpected width. Which tool evidence is most direct?",
        "Computed tracks and grid overlay",
        "Only the authored CSS file size",
        "Only the row label character count",
        "Only the source order of rules",
        "Browser layout inspection reveals computed track geometry and item boundaries.",
        "File size cannot explain the browser's resolved track widths.",
        "Label length alone does not show the final track sizing result.",
        "Rule order alone omits intrinsic sizing and resolved grid constraints."
      ]
    ]
  },
  {
    "comp": "m2.c1",
    "rows": [
      [
        "What is an implicit grid track?",
        "A track created beyond the explicit grid",
        "A track declared inside a named grid area",
        "A collapsed auto-fit repetition",
        "A gap between two grid tracks",
        "Auto-placement or placement outside the explicit grid can create implicit tracks.",
        "A named area describes placement within grid cells; it does not make a track implicit.",
        "Collapsed auto-fit tracks belong to the explicit repeated track definition.",
        "A gap separates tracks and is not itself a track."
      ],
      [
        "Which syntax requests a two-track span?",
        "span 2",
        "width 2",
        "track pair",
        "line twice",
        "Span 2 asks placement to cover two tracks.",
        "width 2 does not satisfy the stated requirement. Span 2 asks placement to cover two tracks.",
        "track pair does not satisfy the stated requirement. Span 2 asks placement to cover two tracks.",
        "line twice does not satisfy the stated requirement. Span 2 asks placement to cover two tracks."
      ],
      [
        "Why use named areas for a page skeleton?",
        "Readable structural placement",
        "Automatic semantic structure",
        "Automatic keyboard navigation",
        "Automatic source rearrangement",
        "Named areas improve layout expression but do not supply semantics or permissions.",
        "Area names do not create semantic HTML landmarks.",
        "Named areas do not establish keyboard interaction or focus order.",
        "Visual placement does not rearrange the source document."
      ],
      [
        "A template row has three area cells while the next has two. What should be repaired?",
        "The row cell count consistency",
        "Alphabetically ordered names",
        "Equal area name character counts",
        "Identical pixel heights per row",
        "Template area strings must define a consistent number of cells per row.",
        "Alphabetical ordering of names is not a grid-template requirement.",
        "Area names may have different string lengths.",
        "Rows may have different heights while retaining equal cell counts."
      ],
      [
        "A page creates unexpectedly tall extra rows. Which declaration deserves review?",
        "grid-auto-rows",
        "grid-template-columns",
        "grid-auto-flow",
        "align-items",
        "Implicit rows use grid-auto-rows rather than only the explicit row definition.",
        "Grid-template-columns sets explicit column sizing rather than extra row height.",
        "Grid-auto-flow controls placement direction and density rather than implicit row size.",
        "Align-items positions or stretches items within tracks rather than defining row sizing."
      ],
      [
        "A photo gallery uses dense packing and every tile has a link. What should QA inspect?",
        "Focus movement against placement",
        "Only intrinsic image resolution",
        "Only the computed track widths",
        "Only the number of gap intervals",
        "Keyboard focus can follow source order while dense placement rearranges visual positions.",
        "Resolution affects visual quality rather than focus sequence.",
        "Track widths alone do not reveal keyboard movement through dense placement.",
        "Counting gaps does not compare visual placement with DOM focus order."
      ],
      [
        "A two-column layout becomes one column on phones. Which strategy best preserves reading?",
        "Keep sensible DOM order",
        "Generate a second hidden page",
        "Assign random tabindex values",
        "Reverse every child on mobile",
        "Semantic source order works across layout templates without artificial focus sequences.",
        "Generate a second hidden page does not satisfy the stated requirement. Semantic source order works across layout templates without artificial focus sequences.",
        "Assign random tabindex values does not satisfy the stated requirement. Semantic source order works across layout templates without artificial focus sequences.",
        "Reverse every child on mobile does not satisfy the stated requirement. Semantic source order works across layout templates without artificial focus sequences."
      ],
      [
        "A developer uses grid-column:2 / 2 expecting width. Why is that suspicious?",
        "The boundaries coincide",
        "It always spans every column",
        "It defines exactly two tracks",
        "It overrides all line names",
        "Identical start and end line references do not describe the intended two-track interval.",
        "It always spans every column does not satisfy the stated requirement. Identical start and end line references do not describe the intended two-track interval.",
        "It defines exactly two tracks does not satisfy the stated requirement. Identical start and end line references do not describe the intended two-track interval.",
        "It overrides all line names does not satisfy the stated requirement. Identical start and end line references do not describe the intended two-track interval."
      ],
      [
        "A new item appears outside named page areas. What can explain it?",
        "Auto-placement into available grid space",
        "Automatic creation of a new document route",
        "Automatic named-area duplication",
        "Source-order reversal by default",
        "Items without explicit area assignment can still be auto-placed.",
        "CSS placement cannot create document routes; an unnamed item can simply be auto-placed.",
        "An unnamed item does not duplicate named template areas.",
        "Auto-placement follows source order unless other placement rules intervene."
      ],
      [
        "An accessibility audit finds main content visually before navigation but focus jumps elsewhere. What should change first?",
        "The structural order design",
        "Only the grid gutter width",
        "Only the positive tabindex values",
        "Only the chosen breakpoint unit",
        "A coherent source sequence avoids relying on visual placement to communicate reading order.",
        "Gutter changes do not repair document reading order.",
        "Positive tabindex can create further focus-order inconsistencies.",
        "Breakpoint units cannot reconcile an unsuitable structural sequence."
      ]
    ]
  },
  {
    "comp": "m2.c2",
    "rows": [
      [
        "What is the principal dimension model of Flexbox?",
        "One-dimensional",
        "Two-dimensional shared tracks",
        "One item per container only",
        "One physical direction only",
        "Flexbox lays out an axis and handles each wrapped line independently.",
        "Grid provides shared two-dimensional tracks; Flexbox sizes a main axis at a time.",
        "A flex container can have many children and wrap into multiple lines.",
        "Flex direction follows logical axes rather than a single fixed physical direction."
      ],
      [
        "Which repeated-track keyword can preserve empty track slots?",
        "auto-fill",
        "auto-fit only",
        "space-between",
        "fit-content only",
        "Auto-fill retains repeated empty slots where auto-fit can collapse them.",
        "auto-fit only does not satisfy the stated requirement. Auto-fill retains repeated empty slots where auto-fit can collapse them.",
        "space-between does not satisfy the stated requirement. Auto-fill retains repeated empty slots where auto-fit can collapse them.",
        "fit-content only does not satisfy the stated requirement. Auto-fill retains repeated empty slots where auto-fit can collapse them."
      ],
      [
        "Must an entire page use a single layout system?",
        "No, choose per relationship",
        "Yes, nested layout modes conflict",
        "Yes, child flex cancels parent grid",
        "No, but each item needs positioning",
        "Nested contexts can express distinct relationships within the same page.",
        "A child can establish its own flex context inside a grid item.",
        "A flex context in a child does not cancel its parent's grid context.",
        "Nested layout modes do not require positioning every child."
      ],
      [
        "A dashboard aligns row headers with data cards in shared columns. What should guide the choice?",
        "Two-dimensional alignment needs",
        "Only equal-sized gap requirements",
        "Only the shortest CSS declaration",
        "Only the desired number of children",
        "The relationship across both axes favors explicit track coordination.",
        "Equal gaps alone do not require coordinated row and column tracks.",
        "Shorter syntax does not establish the relationship the design needs.",
        "The child count alone does not prove shared two-axis alignment needs."
      ],
      [
        "A chat composer has a growing textbox beside a send button. Which model is a sensible start?",
        "A flex row",
        "Only dense grid packing",
        "Only multi-column text flow",
        "Only floats and clearing",
        "The primary relationship is a single main-axis distribution with one flexible item.",
        "Only dense grid packing does not satisfy the stated requirement. The primary relationship is a single main-axis distribution with one flexible item.",
        "Only multi-column text flow does not satisfy the stated requirement. The primary relationship is a single main-axis distribution with one flexible item.",
        "Only floats and clearing does not satisfy the stated requirement. The primary relationship is a single main-axis distribution with one flexible item."
      ],
      [
        "A team uses Grid and declares accessibility solved. Which responsibility remains?",
        "Semantics and interaction review",
        "Only switching fr units to pixels",
        "Only removing explicit track names",
        "Only nesting another grid container",
        "Layout mechanisms do not create meaningful names or keyboard behavior.",
        "Changing units does not create correct semantics or interaction.",
        "Track names do not determine accessible control behavior.",
        "Another grid context does not supply accessible names or keyboard operation."
      ],
      [
        "A product list has only two cards in a wide auto-fit grid. Why might they grow wider?",
        "Empty repeated tracks collapse",
        "All tracks use fixed widths",
        "Empty tracks reserve full width",
        "Auto-fit duplicates the existing cards",
        "Collapsed empty tracks permit the remaining flexible tracks to use more space.",
        "Auto-fit tracks can be flexible rather than fixed-width.",
        "Auto-fill preserves empty repeated slots; auto-fit collapses them.",
        "Auto-fit changes track allocation without creating duplicate cards."
      ],
      [
        "A gallery should preserve possible column slots even when sparse. Which keyword better matches?",
        "auto-fill",
        "auto-fit",
        "nowrap",
        "baseline",
        "Auto-fill retains empty repeated tracks rather than collapsing them like auto-fit.",
        "auto-fit does not satisfy the stated requirement. Auto-fill retains empty repeated tracks rather than collapsing them like auto-fit.",
        "nowrap does not satisfy the stated requirement. Auto-fill retains empty repeated tracks rather than collapsing them like auto-fit.",
        "baseline does not satisfy the stated requirement. Auto-fill retains empty repeated tracks rather than collapsing them like auto-fit."
      ],
      [
        "A design mixes long tags and strict catalog columns. What is a reasonable architecture?",
        "Flex tags inside a grid page",
        "One forced layout for every child",
        "Absolute coordinates for all labels",
        "Duplicate DOM per breakpoint",
        "Different nested contexts can directly represent different component requirements.",
        "One forced layout for every child does not satisfy the stated requirement. Different nested contexts can directly represent different component requirements.",
        "Absolute coordinates for all labels does not satisfy the stated requirement. Different nested contexts can directly represent different component requirements.",
        "Duplicate DOM per breakpoint does not satisfy the stated requirement. Different nested contexts can directly represent different component requirements."
      ],
      [
        "A review asks why a card system uses Grid. Which evidence is useful?",
        "A demonstrated shared-track need",
        "Only existing framework defaults",
        "Only matching the previous page",
        "Only the count of CSS properties",
        "A concrete alignment requirement makes the tool choice reviewable.",
        "A framework default is not evidence of the design's alignment requirements.",
        "Similarity to another page does not explain this page's track relationships.",
        "Counting declarations does not show a need for shared tracks."
      ]
    ]
  },
  {
    "comp": "m3.c1",
    "rows": [
      [
        "What is a CSS pixel?",
        "A reference length unit",
        "Always one hardware pixel",
        "An image byte count",
        "Only a print dot",
        "CSS pixels are reference units and can differ from physical device pixels.",
        "Always one hardware pixel does not satisfy the stated requirement. CSS pixels are reference units and can differ from physical device pixels.",
        "An image byte count does not satisfy the stated requirement. CSS pixels are reference units and can differ from physical device pixels.",
        "Only a print dot does not satisfy the stated requirement. CSS pixels are reference units and can differ from physical device pixels."
      ],
      [
        "Why avoid disabling user zoom?",
        "Users need adaptable magnification",
        "Avoid all viewport breakpoints",
        "Force every font size to pixels",
        "Prevent any browser text resizing",
        "Magnification is a user access requirement that responsive design should accommodate.",
        "Breakpoints do not replace users' need for magnification.",
        "Pixel font declarations do not justify restricting page zoom.",
        "Preventing text resizing removes an adaptation users may need."
      ],
      [
        "What should determine a layout breakpoint?",
        "A content-driven layout need",
        "The most common device category",
        "The original designer's screen width",
        "The server's desktop user-agent list",
        "A breakpoint is justified by an observed change in content and available space.",
        "A device category does not determine whether the actual content fits.",
        "The designer's screen can differ from users' available viewports.",
        "A user-agent list cannot cover split windows and content expansion."
      ],
      [
        "A navigation stacks by default and becomes a row above 42rem. Which direction is this?",
        "Mobile-first enhancement",
        "Desktop-only fixed layout",
        "Mandatory landscape detection",
        "Server-only responsive rendering",
        "A small baseline plus wider min-width enhancement is mobile-first.",
        "Desktop-only fixed layout does not satisfy the stated requirement. A small baseline plus wider min-width enhancement is mobile-first.",
        "Mandatory landscape detection does not satisfy the stated requirement. A small baseline plus wider min-width enhancement is mobile-first.",
        "Server-only responsive rendering does not satisfy the stated requirement. A small baseline plus wider min-width enhancement is mobile-first."
      ],
      [
        "A tablet app is used in a narrow split window. What makes device-category assumptions weak?",
        "Actual viewport space differs",
        "Device pixels become CSS pixels",
        "Split windows remove the viewport",
        "Orientation determines a fixed width",
        "Available layout width can differ substantially from the device’s full display.",
        "Splitting a window does not turn physical pixels into CSS pixels.",
        "The viewport remains present but its available width changes.",
        "Orientation alone does not prescribe a fixed usable viewport width."
      ],
      [
        "A designer uses orientation to assume enough room for a menu. What should be measured instead?",
        "Available content width",
        "Only the screen diagonal length",
        "Only the current orientation flag",
        "Only the device pixel ratio",
        "Orientation does not establish that the menu’s content fits.",
        "Diagonal size does not reveal the menu's available CSS width.",
        "Orientation is only a coarse signal and does not prove content fit.",
        "Pixel ratio describes density rather than the available layout width."
      ],
      [
        "A component is embedded in two differently sized panels. Which responsive mechanism can target its local context?",
        "Container size queries",
        "Only viewport orientation",
        "Only browser user-agent text",
        "Only a global z-index",
        "Container queries can respond to an eligible ancestor container’s dimensions.",
        "Only viewport orientation does not satisfy the stated requirement. Container queries can respond to an eligible ancestor container’s dimensions.",
        "Only browser user-agent text does not satisfy the stated requirement. Container queries can respond to an eligible ancestor container’s dimensions.",
        "Only a global z-index does not satisfy the stated requirement. Container queries can respond to an eligible ancestor container’s dimensions."
      ],
      [
        "A viewport setting includes maximum-scale=1 to conceal clipping. What should be corrected?",
        "The clipping and zoom restriction",
        "Keep the cap; shrink every label",
        "Remove overflow with hidden content",
        "Fix a width from the device category",
        "Preventing enlargement hides the symptom while restricting access.",
        "Keeping the zoom cap leaves the accessibility restriction unresolved.",
        "Hiding overflowing content sacrifices access rather than repairing fit.",
        "Device-category widths fail when the actual window differs."
      ],
      [
        "A navigation still overflows at its tested breakpoint with German labels. What evidence is missing?",
        "Representative expanded content",
        "Only another English desktop view",
        "Only the mean translation length",
        "Only the CSS syntax check output",
        "Content-driven thresholds need representative language and text-size cases.",
        "English labels do not reproduce the translated-text expansion.",
        "A mean length hides the longest labels that cause overflow.",
        "Syntax checks do not measure rendered translated content."
      ],
      [
        "A production page passes desktop screenshots but fails on phones. Which validation adds direct evidence?",
        "Real narrow viewport rendering",
        "Only another desktop screenshot",
        "Only the computed media query text",
        "Only the unit model's width constant",
        "Browser layout checks reveal viewport and content interactions absent from arithmetic.",
        "Another desktop screenshot does not exercise narrow-width behavior.",
        "Media query text alone does not prove how content renders.",
        "A unit-model constant does not execute browser layout."
      ]
    ]
  },
  {
    "comp": "m3.c1",
    "rows": [
      [
        "Which unit is root-font-relative?",
        "rem",
        "vw",
        "px",
        "dvh",
        "Rem expresses a length relative to the root font size.",
        "vw does not satisfy the stated requirement. Rem expresses a length relative to the root font size.",
        "px does not satisfy the stated requirement. Rem expresses a length relative to the root font size.",
        "dvh does not satisfy the stated requirement. Rem expresses a length relative to the root font size."
      ],
      [
        "Which function can choose the smaller of two CSS lengths?",
        "min()",
        "max()",
        "url()",
        "counter()",
        "Min selects the smallest resulting value among its arguments.",
        "max() does not satisfy the stated requirement. Min selects the smallest resulting value among its arguments.",
        "url() does not satisfy the stated requirement. Min selects the smallest resulting value among its arguments.",
        "counter() does not satisfy the stated requirement. Min selects the smallest resulting value among its arguments."
      ],
      [
        "Does fluid typography by itself prove zoom accessibility?",
        "No, real enlargement needs testing",
        "Yes, vw tracks the user's font size",
        "Yes, clamp removes all zoom problems",
        "No, fluid type cannot be accessible",
        "Fluid calculations can still produce poor behavior under enlargement.",
        "Viewport-relative units do not directly track the user's preferred font size.",
        "Clamp bounds a calculation but does not prove enlargement remains usable.",
        "Fluid typography can be accessible when tested under real user settings."
      ],
      [
        "A clamped preferred value reaches 52px but the maximum is 40px. What is the bounded result?",
        "40px",
        "52px",
        "24px",
        "92px",
        "The maximum caps a preferred value above the upper bound.",
        "52px does not satisfy the stated requirement. The maximum caps a preferred value above the upper bound.",
        "24px does not satisfy the stated requirement. The maximum caps a preferred value above the upper bound.",
        "92px does not satisfy the stated requirement. The maximum caps a preferred value above the upper bound."
      ],
      [
        "A card uses width:100% plus content-box padding and overflows. Which assumption failed?",
        "Declared width includes every outer part",
        "Percentage widths always reference the viewport",
        "Padding is excluded from layout",
        "Borders shrink the content width",
        "Content-box width excludes padding and borders that can increase the outer box.",
        "Percentage resolution depends on the property and containing block; here content-box padding adds to the declared width.",
        "Padding participates in outer geometry even with content-box sizing.",
        "Content-box borders add outside the declared content width rather than shrinking it."
      ],
      [
        "A mobile full-height drawer must track current browser chrome changes. Which family is relevant?",
        "Dynamic viewport units",
        "Only printer point units",
        "Only ch character units",
        "Only percentage font weights",
        "Dvh represents dynamic viewport height, subject to actual browser behavior and interaction testing.",
        "Only printer point units does not satisfy the stated requirement. Dvh represents dynamic viewport height, subject to actual browser behavior and interaction testing.",
        "Only ch character units does not satisfy the stated requirement. Dvh represents dynamic viewport height, subject to actual browser behavior and interaction testing.",
        "Only percentage font weights does not satisfy the stated requirement. Dvh represents dynamic viewport height, subject to actual browser behavior and interaction testing."
      ],
      [
        "A landing page wants a stable small viewport height baseline. Which unit is relevant?",
        "svh",
        "lvh only",
        "fr",
        "rem only",
        "Svh relates to the small viewport size rather than dynamic or large height.",
        "lvh only does not satisfy the stated requirement. Svh relates to the small viewport size rather than dynamic or large height.",
        "fr does not satisfy the stated requirement. Svh relates to the small viewport size rather than dynamic or large height.",
        "rem only does not satisfy the stated requirement. Svh relates to the small viewport size rather than dynamic or large height."
      ],
      [
        "A preferred heading size combines rem and vw. Why keep font-relative bounds?",
        "To constrain extremes meaningfully",
        "Prevent user text enlargement",
        "Replace every responsive breakpoint",
        "Force equal size at every viewport",
        "Bounds help control extremes but still require real zoom and content checks.",
        "Font-relative bounds should respect adaptation rather than prevent it.",
        "Bounded font sizing does not replace every other responsive layout decision.",
        "A preferred fluid value can still change within its bounds."
      ],
      [
        "A 40rem article sits inside a 300px panel. Which rule can retain fit?",
        "width:min(100%,40rem)",
        "width:40rem with no other constraint",
        "min-width:40rem everywhere",
        "white-space:nowrap on all text",
        "The minimum of parent-relative full width and the cap can fit the smaller context.",
        "width:40rem with no other constraint does not satisfy the stated requirement. The minimum of parent-relative full width and the cap can fit the smaller context.",
        "min-width:40rem everywhere does not satisfy the stated requirement. The minimum of parent-relative full width and the cap can fit the smaller context.",
        "white-space:nowrap on all text does not satisfy the stated requirement. The minimum of parent-relative full width and the cap can fit the smaller context."
      ],
      [
        "A product review claims clamp proves readable typography. What additional evidence is needed?",
        "Rendered text across user settings",
        "Only the authored clamp expression",
        "Only the minimum font size token",
        "Only one default desktop screenshot",
        "Readability involves actual fonts, content, contrast and enlargement behavior.",
        "An expression shows intent but does not measure rendered legibility.",
        "One size token does not cover zoom, text settings and narrow widths.",
        "A default screenshot omits user settings that can expose clipping."
      ]
    ]
  },
  {
    "comp": "m3.c2",
    "rows": [
      [
        "What does a width descriptor such as 640w describe?",
        "The candidate’s intrinsic width",
        "Rendered image slot width",
        "The device pixel density",
        "The compressed resource size",
        "A w descriptor states candidate intrinsic pixel width for source selection.",
        "The width descriptor describes a source resource rather than its CSS slot.",
        "Density descriptors use x; a w descriptor gives intrinsic pixel width.",
        "Compressed byte size is a transfer property rather than the width descriptor."
      ],
      [
        "What does a 2x descriptor express?",
        "A density candidate",
        "A mandatory two-column grid",
        "A doubled alt attribute",
        "A two-second cache lifetime",
        "Density descriptors relate image candidates to display density.",
        "A mandatory two-column grid does not satisfy the stated requirement. Density descriptors relate image candidates to display density.",
        "A doubled alt attribute does not satisfy the stated requirement. Density descriptors relate image candidates to display density.",
        "A two-second cache lifetime does not satisfy the stated requirement. Density descriptors relate image candidates to display density."
      ],
      [
        "Can one source set freely mix w and x descriptors?",
        "No, use a consistent descriptor kind",
        "Yes, if sizes lists each width",
        "Yes, if each URL is different",
        "Yes, when picture wraps the image",
        "Width and density descriptor contracts should not be mixed in one source set.",
        "Sizes supplies slot information and does not legalize mixed descriptor kinds.",
        "Different URLs do not remove descriptor consistency requirements.",
        "Picture source rules do not permit mixing incompatible descriptors in a single srcset."
      ],
      [
        "A catalog uses 2400px originals for tiny cards. What should be measured after adding candidates?",
        "Actual transferred image bytes",
        "Only the CSS selector count",
        "Only alt text character count",
        "Only the build folder name",
        "Network evidence can show whether appropriate sources reduce transfer cost.",
        "Only the CSS selector count does not satisfy the stated requirement. Network evidence can show whether appropriate sources reduce transfer cost.",
        "Only alt text character count does not satisfy the stated requirement. Network evidence can show whether appropriate sources reduce transfer cost.",
        "Only the build folder name does not satisfy the stated requirement. Network evidence can show whether appropriate sources reduce transfer cost."
      ],
      [
        "A banner must show the full legal disclaimer embedded at its edge. Which crop decision is unsafe?",
        "Unreviewed object-fit:cover",
        "Preserving the full image",
        "A deliberate contain policy",
        "Providing equivalent real text",
        "Cropping can remove essential information and requires content review.",
        "Preserving the full image does not satisfy the stated requirement. Cropping can remove essential information and requires content review.",
        "A deliberate contain policy does not satisfy the stated requirement. Cropping can remove essential information and requires content review.",
        "Providing equivalent real text does not satisfy the stated requirement. Cropping can remove essential information and requires content review."
      ],
      [
        "A browser chooses a different candidate than the simple DPR model. What is a sound interpretation?",
        "The model omits UA behavior",
        "The model overrides browser choice",
        "All DPR values require one resource",
        "Candidate order fixes request choice",
        "Source selection involves browser behavior beyond the teaching heuristic.",
        "The arithmetic model cannot override the user agent's source selection.",
        "One DPR may still permit choices influenced by slot size and other browser factors.",
        "Candidate ordering alone does not fix the browser's selected resource."
      ],
      [
        "A responsive image stretches vertically after a CSS change. Which relationship should be restored?",
        "Its intended aspect ratio",
        "Only its cache-control text",
        "Only its file extension",
        "Only the request’s method",
        "Preserving ratio avoids distortion unless a deliberate crop policy is intended.",
        "Only its cache-control text does not satisfy the stated requirement. Preserving ratio avoids distortion unless a deliberate crop policy is intended.",
        "Only its file extension does not satisfy the stated requirement. Preserving ratio avoids distortion unless a deliberate crop policy is intended.",
        "Only the request’s method does not satisfy the stated requirement. Preserving ratio avoids distortion unless a deliberate crop policy is intended."
      ],
      [
        "A card has width descriptors but an inaccurate sizes value. What can suffer?",
        "Candidate selection efficiency",
        "Only the CSS rendered slot width",
        "Only the semantic image alternative",
        "Only the source image aspect ratio",
        "An incorrect expected slot can cause unnecessarily large or inadequate source selection.",
        "Sizes informs source selection rather than directly setting CSS layout width.",
        "Semantic alternatives are controlled by alt and surrounding markup.",
        "Sizes does not alter the source file's intrinsic aspect ratio."
      ],
      [
        "A page reserves no space for gallery images. Which performance symptom can result?",
        "Layout shifts during loading",
        "Guaranteed lower input latency",
        "Automatic source compression",
        "A server authorization bypass",
        "Unreserved media can move surrounding content when dimensions become known.",
        "Guaranteed lower input latency does not satisfy the stated requirement. Unreserved media can move surrounding content when dimensions become known.",
        "Automatic source compression does not satisfy the stated requirement. Unreserved media can move surrounding content when dimensions become known.",
        "A server authorization bypass does not satisfy the stated requirement. Unreserved media can move surrounding content when dimensions become known."
      ],
      [
        "A review asks whether responsive image markup works. Which evidence is strongest?",
        "Rendered slots and network requests",
        "Only the nominal device pixel ratio",
        "Only the supplied candidate names",
        "Only the source markup formatter",
        "Browser checks connect actual display geometry to source selection and transfer.",
        "DPR alone omits the rendered slot and actual browser resource choice.",
        "Candidate filenames do not prove which resource was transferred.",
        "Formatting verifies source style rather than browser selection and delivery."
      ]
    ]
  }
]);
