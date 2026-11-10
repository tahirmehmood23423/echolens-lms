'use strict';
const {course}=require('./web-helper');
module.exports=course("responsive-css",[
  {
    "id": "responsive-flex-axes",
    "comp": "m1.c1",
    "title": "Reason about flex axes and alignment",
    "introduction": "A booking toolbar needs a title at one end and actions at the other. Its alignment should survive translated labels and changes in writing direction.",
    "sections": [
      {
        "heading": "Reason about flex axes and alignment",
        "paragraphs": [
          "A flex container establishes a one-dimensional layout for its direct children. The main axis follows flex-direction; row follows the inline direction and column follows the block direction. justify-content distributes available main-axis space, while align-items supplies cross-axis alignment. In a row under the common horizontal writing mode these often resemble horizontal and vertical alignment, but hard-coding that interpretation fails when direction or writing mode changes.",
          "Start with semantic HTML in the intended reading order, then use display:flex, gap and alignment to express the relationship. gap inserts gutters between items rather than requiring a trailing margin correction. align-self can override one item\u2019s cross-axis alignment. baseline alignment is often useful for mixed font sizes; center aligns boxes rather than typographic baselines. A toolbar is not automatically keyboard usable merely because its geometry looks right."
        ]
      },
      {
        "heading": "Work through the decision and its limits",
        "paragraphs": [
          "For a 600px inner width, item widths of 180px and 120px and a 16px gap leave 284px of unused space. With justify-content:space-between, the gap is a minimum gutter and the extra space goes between the two items. An auto margin can instead absorb free main-axis space before a selected item. Decide whether the design describes distribution across every item or a boundary between groups.",
          "The fixture computes supplied free space and labels the selected axes. It executes JavaScript arithmetic only, not a layout engine: intrinsic sizes, writing modes, margins and browser rounding remain outside the calculation. Inspect the real toolbar at narrow widths and keyboard focus states before accepting the design."
        ]
      }
    ],
    "worked": {
      "lang": "javascript",
      "code": "const width=600, items=[180,120], gap=16;\nconsole.log(width-items.reduce((a,b)=>a+b,0)-gap);\nconsole.log(\"row: main=inline, cross=block\");",
      "expect": "284\nrow: main=inline, cross=block",
      "problem": "Calculate available toolbar space and identify axis-specific controls.",
      "steps": [
        "Sum the supplied item widths.",
        "Subtract items and gutter from inner width.",
        "Relate the result to space distribution."
      ],
      "explanation": "The fixture computes supplied free space and labels the selected axes. It executes JavaScript arithmetic only, not a layout engine: intrinsic sizes, writing modes, margins and browser rounding remain outside the calculation. Inspect the real toolbar at narrow widths and keyboard focus states before accepting the design."
    },
    "quiz": [
      [
        "Which property establishes flex layout?",
        "display:flex",
        "position:flex",
        "layout:flex",
        "float:flex",
        "The display property establishes the flex formatting context.",
        "position:flex does not satisfy the stated requirement. The display property establishes the flex formatting context.",
        "layout:flex does not satisfy the stated requirement. The display property establishes the flex formatting context.",
        "float:flex does not satisfy the stated requirement. The display property establishes the flex formatting context."
      ],
      [
        "Which property distributes main-axis space?",
        "justify-content",
        "align-items",
        "font-weight",
        "text-transform",
        "Justify-content distributes space along the flex main axis.",
        "align-items does not satisfy the stated requirement. Justify-content distributes space along the flex main axis.",
        "font-weight does not satisfy the stated requirement. Justify-content distributes space along the flex main axis.",
        "text-transform does not satisfy the stated requirement. Justify-content distributes space along the flex main axis."
      ],
      [
        "What does align-self change?",
        "One item\u2019s cross alignment",
        "Every descendant\u2019s source order",
        "The parent\u2019s HTTP method",
        "All sibling font sizes",
        "Align-self overrides cross-axis alignment for the selected flex item.",
        "Every descendant\u2019s source order does not satisfy the stated requirement. Align-self overrides cross-axis alignment for the selected flex item.",
        "The parent\u2019s HTTP method does not satisfy the stated requirement. Align-self overrides cross-axis alignment for the selected flex item.",
        "All sibling font sizes does not satisfy the stated requirement. Align-self overrides cross-axis alignment for the selected flex item."
      ],
      [
        "A vertical toolbar uses flex-direction:column. Where does justify-content operate?",
        "Along the block axis",
        "Always along physical width",
        "Along text color channels",
        "Only on first-line text",
        "Column makes the block direction the main axis in the container.",
        "Always along physical width does not satisfy the stated requirement. Column makes the block direction the main axis in the container.",
        "Along text color channels does not satisfy the stated requirement. Column makes the block direction the main axis in the container.",
        "Only on first-line text does not satisfy the stated requirement. Column makes the block direction the main axis in the container."
      ],
      [
        "A row toolbar mixes 12px and 24px labels. Which alignment follows text baselines?",
        "align-items:baseline",
        "justify-content:stretch",
        "align-items:space-between",
        "gap:baseline",
        "Baseline alignment relates typographic baselines rather than box centers.",
        "justify-content:stretch does not satisfy the stated requirement. Baseline alignment relates typographic baselines rather than box centers.",
        "align-items:space-between does not satisfy the stated requirement. Baseline alignment relates typographic baselines rather than box centers.",
        "gap:baseline does not satisfy the stated requirement. Baseline alignment relates typographic baselines rather than box centers."
      ],
      [
        "A menu uses row-reverse to repair a mistaken HTML order. What remains concerning?",
        "Reading and focus sequence",
        "The number of style rules",
        "The image file format",
        "The variable naming case",
        "Visual reordering does not reliably rewrite document and keyboard order.",
        "The number of style rules does not satisfy the stated requirement. Visual reordering does not reliably rewrite document and keyboard order.",
        "The image file format does not satisfy the stated requirement. Visual reordering does not reliably rewrite document and keyboard order.",
        "The variable naming case does not satisfy the stated requirement. Visual reordering does not reliably rewrite document and keyboard order."
      ],
      [
        "A toolbar has two groups and only the second should move to the end. Which can absorb intervening free space?",
        "An auto main-axis margin",
        "A mandatory line break",
        "A larger font weight",
        "A fixed negative z-index",
        "An auto margin can absorb available flex-axis free space before distribution.",
        "A mandatory line break does not satisfy the stated requirement. An auto margin can absorb available flex-axis free space before distribution.",
        "A larger font weight does not satisfy the stated requirement. An auto margin can absorb available flex-axis free space before distribution.",
        "A fixed negative z-index does not satisfy the stated requirement. An auto margin can absorb available flex-axis free space before distribution."
      ],
      [
        "The fixture prints 284px free space. What still requires a browser?",
        "Intrinsic item sizing",
        "The stated subtraction",
        "The supplied width constant",
        "The sum of input numbers",
        "The arithmetic does not measure rendered content or run flex layout.",
        "The stated subtraction does not satisfy the stated requirement. The arithmetic does not measure rendered content or run flex layout.",
        "The supplied width constant does not satisfy the stated requirement. The arithmetic does not measure rendered content or run flex layout.",
        "The sum of input numbers does not satisfy the stated requirement. The arithmetic does not measure rendered content or run flex layout."
      ]
    ],
    "mistakes": [
      "Treating main axis as permanently horizontal.",
      "Using visual reversal to conceal incorrect source order."
    ],
    "takeaways": [
      "Name axes before choosing alignment.",
      "Preserve meaningful document order."
    ],
    "prerequisite_note": "CSS Fundamentals is the canonical prerequisite: review the box model, cascade, relative units and contrast. This course develops layout relationships and responsive media rather than repeating those foundations. JavaScript fixtures are bounded arithmetic and policy models; actual CSS requires browser review."
  },
  {
    "id": "responsive-flex-sizing",
    "comp": "m1.c1",
    "title": "Distribute flex growth and shrinkage without losing content",
    "introduction": "A subscription panel places a flexible description beside a purchase button. Long account identifiers expose why flex sizing is more than assigning percentages.",
    "sections": [
      {
        "heading": "Distribute flex growth and shrinkage without losing content",
        "paragraphs": [
          "flex-basis supplies the initial main size before positive or negative free space is distributed. flex-grow allocates positive free space according to growth factors; flex-shrink distributes negative free space using scaled shrink factors that include base sizes. The shorthand flex:1 ordinarily expands to a growable, shrinkable item with a zero basis, while flex:auto starts from auto basis. Compare the actual basis when seemingly equal factors produce unequal results.",
          "Flex items commonly have an automatic minimum main size influenced by content. A long unbreakable identifier can prevent the flexible item from shrinking as intended. min-width:0 on the appropriate row item permits shrinkage, but the content still needs a suitable wrap or overflow policy. overflow-wrap:anywhere may help identifiers; silently clipping a price or action label can make a purchase flow unusable."
        ]
      },
      {
        "heading": "Work through the decision and its limits",
        "paragraphs": [
          "Suppose two items start at 200px and 100px with shrink factors of 1, and must lose 60px. Their scaled factors are 200 and 100, so the simplified unconstrained allocation removes 40px and 20px. This explains why identical shrink factors do not imply identical pixel losses. Real flex layout can freeze an item at a min or max constraint and redistribute remaining space.",
          "The example calculates only an unconstrained two-item shrink step. It excludes automatic minimum sizes, border-box conversions, iterative freezing and browser subpixel placement. Use it to reason about a hypothesis, then inspect computed sizes and overflowing content in DevTools rather than treating the ratio as the full CSS algorithm."
        ]
      }
    ],
    "worked": {
      "lang": "javascript",
      "code": "const basis=[200,100], loss=60;\nconst total=basis.reduce((a,b)=>a+b,0);\nconsole.log(basis.map(x=>x-loss*x/total).join(\",\"));",
      "expect": "160,80",
      "problem": "Trace scaled shrink shares for two supplied bases.",
      "steps": [
        "Compute total base size.",
        "Allocate loss in the base-size ratio.",
        "Subtract loss and identify omitted constraints."
      ],
      "explanation": "The example calculates only an unconstrained two-item shrink step. It excludes automatic minimum sizes, border-box conversions, iterative freezing and browser subpixel placement. Use it to reason about a hypothesis, then inspect computed sizes and overflowing content in DevTools rather than treating the ratio as the full CSS algorithm."
    },
    "quiz": [
      [
        "Which value supplies an initial flex main size?",
        "flex-basis",
        "align-items",
        "line-height",
        "z-index",
        "Flex-basis participates in the initial size before free-space allocation.",
        "align-items does not satisfy the stated requirement. Flex-basis participates in the initial size before free-space allocation.",
        "line-height does not satisfy the stated requirement. Flex-basis participates in the initial size before free-space allocation.",
        "z-index does not satisfy the stated requirement. Flex-basis participates in the initial size before free-space allocation."
      ],
      [
        "Which factor allocates positive free space?",
        "flex-grow",
        "flex-shrink",
        "font-stretch",
        "opacity",
        "Flex-grow controls proportional allocation of available positive space.",
        "flex-shrink does not satisfy the stated requirement. Flex-grow controls proportional allocation of available positive space.",
        "font-stretch does not satisfy the stated requirement. Flex-grow controls proportional allocation of available positive space.",
        "opacity does not satisfy the stated requirement. Flex-grow controls proportional allocation of available positive space."
      ],
      [
        "What scales a flex shrink factor?",
        "The item\u2019s base size",
        "The file\u2019s line count",
        "The tab index value",
        "The image\u2019s alt length",
        "Negative space uses scaled shrink factors incorporating the flex base size.",
        "The file\u2019s line count does not satisfy the stated requirement. Negative space uses scaled shrink factors incorporating the flex base size.",
        "The tab index value does not satisfy the stated requirement. Negative space uses scaled shrink factors incorporating the flex base size.",
        "The image\u2019s alt length does not satisfy the stated requirement. Negative space uses scaled shrink factors incorporating the flex base size."
      ],
      [
        "A text flex item refuses to shrink around a long account code. What deserves inspection?",
        "Automatic minimum size",
        "Only its background color",
        "Only the endpoint port",
        "Only the button\u2019s title",
        "Content-based automatic minimums can constrain flex shrinkage.",
        "Only its background color does not satisfy the stated requirement. Content-based automatic minimums can constrain flex shrinkage.",
        "Only the endpoint port does not satisfy the stated requirement. Content-based automatic minimums can constrain flex shrinkage.",
        "Only the button\u2019s title does not satisfy the stated requirement. Content-based automatic minimums can constrain flex shrinkage."
      ],
      [
        "A repair sets min-width:0 but the long code still paints outside. What else is needed?",
        "A content overflow policy",
        "Only another grow factor",
        "Only a darker border",
        "Only a shorter selector",
        "Permitting box shrinkage does not itself wrap or otherwise manage its content.",
        "Only another grow factor does not satisfy the stated requirement. Permitting box shrinkage does not itself wrap or otherwise manage its content.",
        "Only a darker border does not satisfy the stated requirement. Permitting box shrinkage does not itself wrap or otherwise manage its content.",
        "Only a shorter selector does not satisfy the stated requirement. Permitting box shrinkage does not itself wrap or otherwise manage its content."
      ],
      [
        "Two bases are 200 and 100 with equal shrink factors. Which loses more pixels in the simple model?",
        "The 200px item",
        "Both lose exactly equally",
        "The 100px item",
        "Neither can ever shrink",
        "Scaled factors make the larger base contribute more to shrink allocation.",
        "Both lose exactly equally does not satisfy the stated requirement. Scaled factors make the larger base contribute more to shrink allocation.",
        "The 100px item does not satisfy the stated requirement. Scaled factors make the larger base contribute more to shrink allocation.",
        "Neither can ever shrink does not satisfy the stated requirement. Scaled factors make the larger base contribute more to shrink allocation."
      ],
      [
        "A team sets flex-shrink:0 on a buy button. What tradeoff should be checked?",
        "Room for adjacent content",
        "Guaranteed page-wide fit",
        "Automatic label translation",
        "Guaranteed contrast compliance",
        "Preserving one item\u2019s width may force other content to shrink or overflow.",
        "Guaranteed page-wide fit does not satisfy the stated requirement. Preserving one item\u2019s width may force other content to shrink or overflow.",
        "Automatic label translation does not satisfy the stated requirement. Preserving one item\u2019s width may force other content to shrink or overflow.",
        "Guaranteed contrast compliance does not satisfy the stated requirement. Preserving one item\u2019s width may force other content to shrink or overflow."
      ],
      [
        "The shrink model yields 160 and 80. What could change real results?",
        "Min and max constraints",
        "Only source file comments",
        "Only API status names",
        "Only deployment tags",
        "Actual flex sizing can freeze constrained items and redistribute space.",
        "Only source file comments does not satisfy the stated requirement. Actual flex sizing can freeze constrained items and redistribute space.",
        "Only API status names does not satisfy the stated requirement. Actual flex sizing can freeze constrained items and redistribute space.",
        "Only deployment tags does not satisfy the stated requirement. Actual flex sizing can freeze constrained items and redistribute space."
      ]
    ],
    "mistakes": [
      "Assuming equal shrink factors mean equal pixel losses.",
      "Fixing overflow by hiding essential purchase information."
    ],
    "takeaways": [
      "Distinguish basis, growth and shrink factors.",
      "Inspect minimum constraints before guessing new widths."
    ],
    "prerequisite_note": "CSS Fundamentals is the canonical prerequisite: review the box model, cascade, relative units and contrast. This course develops layout relationships and responsive media rather than repeating those foundations. JavaScript fixtures are bounded arithmetic and policy models; actual CSS requires browser review."
  },
  {
    "id": "responsive-flex-wrapping",
    "comp": "m1.c1",
    "title": "Wrap repeated actions while retaining usable spacing",
    "introduction": "A filter bar has more options than a narrow device can display on one line. Wrapping should expose every option without producing unexplained gaps.",
    "sections": [
      {
        "heading": "Wrap repeated actions while retaining usable spacing",
        "paragraphs": [
          "flex-wrap:wrap allows items to form multiple lines instead of forcing a single line. Each line runs its own main-axis distribution, so a short final line may spread items differently under space-between. align-content distributes multiple lines in cross-axis free space; it does not replace align-items, which aligns the items on each line. An unconstrained-height container may have no extra cross-axis room for align-content to distribute.",
          "Prefer gap for consistent inter-item and inter-line gutters. When actions need a consistent left or logical start edge, justify-content:flex-start is often clearer than distributing the final line. A responsive component should also tolerate one unusually long label. Wrapping an entire button does not guarantee that the text inside can break or that its minimum width fits the viewport."
        ]
      },
      {
        "heading": "Work through the decision and its limits",
        "paragraphs": [
          "With supplied outer item widths of 120px, a 16px gutter and 300px available width, two items require 256px and three require 392px. A greedy illustration therefore puts five identical items on lines of two, two and one. Real flex line collection uses hypothetical main sizes and its own constraints; this example only explains the spacing arithmetic before inspecting actual layout.",
          "The JavaScript fixture derives a simplified line capacity and groups synthetic identifiers. It neither creates elements nor tests focus movement. Review narrow widths, magnified text and translated strings in the application, and retain source order so keyboard navigation corresponds to a sensible sequence across wrapped lines."
        ]
      }
    ],
    "worked": {
      "lang": "javascript",
      "code": "const width=300,item=120,gap=16;\nconst capacity=Math.floor((width+gap)/(item+gap));\nconst ids=[\"a\",\"b\",\"c\",\"d\",\"e\"];\nfor(let i=0;i<ids.length;i+=capacity)console.log(ids.slice(i,i+capacity).join(\",\"));",
      "expect": "a,b\nc,d\ne",
      "problem": "Group a synthetic filter list under a declared fixed-size capacity.",
      "steps": [
        "Calculate how many fixed items and gutters fit.",
        "Partition identifiers using that capacity.",
        "Separate this arithmetic from browser and focus evidence."
      ],
      "explanation": "The JavaScript fixture derives a simplified line capacity and groups synthetic identifiers. It neither creates elements nor tests focus movement. Review narrow widths, magnified text and translated strings in the application, and retain source order so keyboard navigation corresponds to a sensible sequence across wrapped lines."
    },
    "quiz": [
      [
        "Which declaration permits multiple flex lines?",
        "flex-wrap:wrap",
        "overflow:auto",
        "align-items:wrap",
        "display:multiline",
        "Flex-wrap controls whether flex items can wrap into multiple lines.",
        "overflow:auto does not satisfy the stated requirement. Flex-wrap controls whether flex items can wrap into multiple lines.",
        "align-items:wrap does not satisfy the stated requirement. Flex-wrap controls whether flex items can wrap into multiple lines.",
        "display:multiline does not satisfy the stated requirement. Flex-wrap controls whether flex items can wrap into multiple lines."
      ],
      [
        "What aligns multiple flex lines in extra cross space?",
        "align-content",
        "justify-items",
        "font-variant",
        "text-indent",
        "Align-content distributes flex lines when there is cross-axis space to distribute.",
        "justify-items does not satisfy the stated requirement. Align-content distributes flex lines when there is cross-axis space to distribute.",
        "font-variant does not satisfy the stated requirement. Align-content distributes flex lines when there is cross-axis space to distribute.",
        "text-indent does not satisfy the stated requirement. Align-content distributes flex lines when there is cross-axis space to distribute."
      ],
      [
        "How is main-axis free space handled after wrapping?",
        "Separately on each line",
        "Across a single shared row",
        "Only by the last item",
        "Only by the tallest item",
        "Each flex line performs its main-axis layout independently.",
        "Across a single shared row does not satisfy the stated requirement. Each flex line performs its main-axis layout independently.",
        "Only by the last item does not satisfy the stated requirement. Each flex line performs its main-axis layout independently.",
        "Only by the tallest item does not satisfy the stated requirement. Each flex line performs its main-axis layout independently."
      ],
      [
        "A final filter line has two widely separated actions. Which setting often explains it?",
        "justify-content:space-between",
        "justify-content:space-around",
        "justify-content:space-evenly",
        "justify-content:flex-start",
        "Space-between puts the available line width between the two actions, including on the final line.",
        "Space-around also leaves outer intervals rather than placing the two actions at the line edges.",
        "Space-evenly distributes equal outer and inner intervals rather than putting all free space between actions.",
        "Flex-start groups actions at the start rather than spreading them across the line."
      ],
      [
        "A bar has one line and no spare height. Why does align-content appear inactive?",
        "No spare line space",
        "It needs two flex containers",
        "It only works with columns",
        "It requires fixed child widths",
        "Align-content needs applicable cross-axis line space and does not position a lone item like align-items.",
        "Align-content distributes line space inside one flex container.",
        "Columns can also use align-content; lack of spare line space is the issue here.",
        "Fixed child widths do not create cross-axis line space to distribute."
      ],
      [
        "An oversized filter still overflows a wrapped bar. What must be examined?",
        "That item\u2019s minimum and text sizing",
        "Only the remaining item count",
        "Only a service worker version",
        "Only the number of style imports",
        "Wrapping cannot guarantee that each individual item fits the container.",
        "Only the remaining item count does not satisfy the stated requirement. Wrapping cannot guarantee that each individual item fits the container.",
        "Only a service worker version does not satisfy the stated requirement. Wrapping cannot guarantee that each individual item fits the container.",
        "Only the number of style imports does not satisfy the stated requirement. Wrapping cannot guarantee that each individual item fits the container."
      ],
      [
        "Five equal filters fit two per line. What simplified grouping follows?",
        "Two, two, one",
        "Three, two",
        "One, four",
        "Five on one line",
        "The given capacity yields two full lines and a final singleton.",
        "Three, two does not satisfy the stated requirement. The given capacity yields two full lines and a final singleton.",
        "One, four does not satisfy the stated requirement. The given capacity yields two full lines and a final singleton.",
        "Five on one line does not satisfy the stated requirement. The given capacity yields two full lines and a final singleton."
      ],
      [
        "A wrapped filter UI passes the arithmetic model. What remains untested?",
        "Actual keyboard navigation",
        "The slice array results",
        "The declared item width",
        "The calculated capacity",
        "A grouping calculation does not exercise focus movement or browser layout.",
        "The slice array results does not satisfy the stated requirement. A grouping calculation does not exercise focus movement or browser layout.",
        "The declared item width does not satisfy the stated requirement. A grouping calculation does not exercise focus movement or browser layout.",
        "The calculated capacity does not satisfy the stated requirement. A grouping calculation does not exercise focus movement or browser layout."
      ]
    ],
    "mistakes": [
      "Expecting wrapping to solve an individually oversized control.",
      "Using space-between without inspecting the final line."
    ],
    "takeaways": [
      "Each flex line distributes its own space.",
      "Preserve every control under narrow widths and zoom."
    ],
    "prerequisite_note": "CSS Fundamentals is the canonical prerequisite: review the box model, cascade, relative units and contrast. This course develops layout relationships and responsive media rather than repeating those foundations. JavaScript fixtures are bounded arithmetic and policy models; actual CSS requires browser review."
  },
  {
    "id": "responsive-grid-tracks",
    "comp": "m2.c1",
    "title": "Size explicit grid tracks and prevent accidental overflow",
    "introduction": "A reporting dashboard needs a sidebar and a main table area. Grid expresses their shared row and column relationships while track minimums determine what can actually fit.",
    "sections": [
      {
        "heading": "Size explicit grid tracks and prevent accidental overflow",
        "paragraphs": [
          "A grid container lays out direct children against rows and columns. grid-template-columns defines explicit columns; grid-template-rows defines explicit rows. Fractional fr units allocate a share of leftover space rather than a percentage of the entire viewport. Fixed tracks, gaps and intrinsic contributions affect the space remaining for flexible tracks. A one-fr track may retain an automatic minimum that a long table can enlarge.",
          "Use minmax(0,1fr) when a track should be allowed to shrink below the content-based automatic minimum and the content has an intentional overflow treatment. This is not permission to hide a large table: a contained horizontal scroller may be appropriate for the table while the page itself remains usable. Distinguish the track\u2019s minimum from an item\u2019s min-width, which can separately affect overflow."
        ]
      },
      {
        "heading": "Work through the decision and its limits",
        "paragraphs": [
          "For an 1100px inner grid with a 240px sidebar and a 20px gutter, 840px remain for a flexible content track. With two flexible columns using 1fr and 2fr after these deductions, the illustrative shares become 280px and 560px. The ratio applies only to the remaining flexible allocation and under the stated unconstrained assumptions.",
          "The code computes those supplied track shares and prints a useful CSS declaration as text. It does not parse CSS, measure intrinsic table width or run the Grid sizing algorithm. Inspect the actual grid overlay and scroll behavior, including focusable cells or links, when validating a dashboard."
        ]
      }
    ],
    "worked": {
      "lang": "javascript",
      "code": "const available=1100-240-20;\nconsole.log(available);\nconsole.log([available/3,available*2/3].join(\",\"));\nconsole.log(\"minmax(0, 1fr)\");",
      "expect": "840\n280,560\nminmax(0, 1fr)",
      "problem": "Allocate supplied leftover width across fractional track weights.",
      "steps": [
        "Subtract the fixed sidebar and gap.",
        "Divide the remainder into three fractional shares.",
        "Identify content sizing omitted by the model."
      ],
      "explanation": "The code computes those supplied track shares and prints a useful CSS declaration as text. It does not parse CSS, measure intrinsic table width or run the Grid sizing algorithm. Inspect the actual grid overlay and scroll behavior, including focusable cells or links, when validating a dashboard."
    },
    "quiz": [
      [
        "Which property declares explicit grid columns?",
        "grid-template-columns",
        "grid-auto-flow",
        "column-count:auto",
        "flex-direction",
        "Grid-template-columns describes the explicit column track list.",
        "grid-auto-flow does not satisfy the stated requirement. Grid-template-columns describes the explicit column track list.",
        "column-count:auto does not satisfy the stated requirement. Grid-template-columns describes the explicit column track list.",
        "flex-direction does not satisfy the stated requirement. Grid-template-columns describes the explicit column track list."
      ],
      [
        "What does fr distribute?",
        "Shares of leftover track space",
        "Fixed physical device pixels",
        "Percentages of every ancestor",
        "Only the item\u2019s text width",
        "Fractional tracks share remaining space after applicable sizing contributions.",
        "Fixed physical device pixels does not satisfy the stated requirement. Fractional tracks share remaining space after applicable sizing contributions.",
        "Percentages of every ancestor does not satisfy the stated requirement. Fractional tracks share remaining space after applicable sizing contributions.",
        "Only the item\u2019s text width does not satisfy the stated requirement. Fractional tracks share remaining space after applicable sizing contributions."
      ],
      [
        "What is a grid item ordinarily?",
        "A direct in-flow child",
        "Every nested text node element",
        "Only the first descendant",
        "Only a positioned tooltip",
        "Direct in-flow children participate as grid items.",
        "Every nested text node element does not satisfy the stated requirement. Direct in-flow children participate as grid items.",
        "Only the first descendant does not satisfy the stated requirement. Direct in-flow children participate as grid items.",
        "Only a positioned tooltip does not satisfy the stated requirement. Direct in-flow children participate as grid items."
      ],
      [
        "A 1100px grid reserves 240px plus a 20px gap. How much remains in the simple model?",
        "840px",
        "860px",
        "1100px",
        "240px",
        "Subtract the fixed sidebar and gutter before allocating the remaining width.",
        "860px does not satisfy the stated requirement. Subtract the fixed sidebar and gutter before allocating the remaining width.",
        "1100px does not satisfy the stated requirement. Subtract the fixed sidebar and gutter before allocating the remaining width.",
        "240px does not satisfy the stated requirement. Subtract the fixed sidebar and gutter before allocating the remaining width."
      ],
      [
        "A table forces a 1fr track beyond its container. Which minimum deserves inspection?",
        "The auto track minimum",
        "Only the grid container gap",
        "Only the table border width",
        "Only the row sizing function",
        "A flexible track can still have a content-based automatic minimum.",
        "Gap consumes layout space but does not identify the automatic track minimum.",
        "Border width adds geometry but does not explain an intrinsic track minimum.",
        "Row sizing controls the other axis rather than this column overflow."
      ],
      [
        "A table track must shrink while keeping full content scrollable. Which track pattern fits?",
        "minmax(0,1fr)",
        "minmax(900px,1fr)",
        "repeat(0,1fr)",
        "grid-template:fixed",
        "An explicit zero minimum permits track shrinkage when coupled with a usable content overflow policy.",
        "minmax(900px,1fr) does not satisfy the stated requirement. An explicit zero minimum permits track shrinkage when coupled with a usable content overflow policy.",
        "repeat(0,1fr) does not satisfy the stated requirement. An explicit zero minimum permits track shrinkage when coupled with a usable content overflow policy.",
        "grid-template:fixed does not satisfy the stated requirement. An explicit zero minimum permits track shrinkage when coupled with a usable content overflow policy."
      ],
      [
        "A designer calls 2fr twice the entire grid width. What is wrong?",
        "Fr divides leftover space",
        "Fr includes fixed tracks first",
        "Fr ignores declared gutters",
        "Fr sets the grid container width",
        "Fractional allocation relates to remaining track space, not a multiplier of whole container width.",
        "Fixed tracks consume space before fr shares are distributed.",
        "Gutters are subtracted before sharing remaining space.",
        "Fr sizes tracks rather than setting the container's total width."
      ],
      [
        "The fixture returns 280 and 560. What requires real layout evidence?",
        "Intrinsic sizing effects",
        "The ratio multiplication",
        "The supplied sidebar width",
        "The string\u2019s printed content",
        "The model omits content contributions and the actual grid algorithm.",
        "The ratio multiplication does not satisfy the stated requirement. The model omits content contributions and the actual grid algorithm.",
        "The supplied sidebar width does not satisfy the stated requirement. The model omits content contributions and the actual grid algorithm.",
        "The string\u2019s printed content does not satisfy the stated requirement. The model omits content contributions and the actual grid algorithm."
      ]
    ],
    "mistakes": [
      "Treating fr as a percentage of the complete viewport.",
      "Shrinking a track while losing access to table data."
    ],
    "takeaways": [
      "Account for gaps and fixed tracks before fractional space.",
      "Inspect both track and item minimums."
    ],
    "prerequisite_note": "CSS Fundamentals is the canonical prerequisite: review the box model, cascade, relative units and contrast. This course develops layout relationships and responsive media rather than repeating those foundations. JavaScript fixtures are bounded arithmetic and policy models; actual CSS requires browser review."
  },
  {
    "id": "responsive-grid-placement",
    "comp": "m2.c1",
    "title": "Place grid content while preserving logical reading order",
    "introduction": "An editorial page contains a header, navigation, article and related links. Grid placement should clarify the page without moving keyboard focus into a confusing visual sequence.",
    "sections": [
      {
        "heading": "Place grid content while preserving logical reading order",
        "paragraphs": [
          "Grid lines bound tracks. grid-column:1 / 3 spans from line 1 to line 3, crossing two tracks; grid-column:span 2 requests a two-track span from its resolved start. Named grid-template-areas can make a page skeleton readable. Each named area must form a rectangle, and the number of area cells must be consistent across the declared rows.",
          "Auto-placement inserts items without a complete explicit position, potentially creating implicit tracks. grid-auto-rows and grid-auto-columns size those implicit tracks. grid-auto-flow:dense may backfill holes with later items, which can change visual sequence relative to document order. Use this behavior only after checking whether the content\u2019s reading and focus order remains meaningful."
        ]
      },
      {
        "heading": "Work through the decision and its limits",
        "paragraphs": [
          "A header can span the whole two-column page while the article and navigation occupy the next row. On a narrow display, redefine the template as a single column with a sensible document sequence. It is often easier to start with semantic source order and then provide desktop placement than to repair a visually composed but semantically scrambled page.",
          "The example checks a supplied rectangular area matrix and computes a line span with JavaScript arrays. It deliberately does not claim to implement CSS parsing or auto-placement. Browser review must verify actual line resolution, implicit track growth and keyboard traversal, particularly if dense packing or explicit reordering is introduced."
        ]
      }
    ],
    "worked": {
      "lang": "javascript",
      "code": "const areas=[[\"header\",\"header\"],[\"nav\",\"main\"]];\nconsole.log(areas.every(r=>r.length===2));\nconsole.log(3-1);\nconsole.log(areas[1].join(\",\"));",
      "expect": "true\n2\nnav,main",
      "problem": "Inspect a supplied page-area matrix and a two-track line interval.",
      "steps": [
        "Check each supplied row\u2019s declared width.",
        "Subtract line indices to count crossed tracks.",
        "Separate matrix checks from CSS and accessibility validation."
      ],
      "explanation": "The example checks a supplied rectangular area matrix and computes a line span with JavaScript arrays. It deliberately does not claim to implement CSS parsing or auto-placement. Browser review must verify actual line resolution, implicit track growth and keyboard traversal, particularly if dense packing or explicit reordering is introduced."
    },
    "quiz": [
      [
        "What does grid-column:1 / 3 span?",
        "Two column tracks",
        "Three column tracks",
        "One row only",
        "No grid tracks",
        "The span crosses the interval between line one and line three.",
        "Three column tracks does not satisfy the stated requirement. The span crosses the interval between line one and line three.",
        "One row only does not satisfy the stated requirement. The span crosses the interval between line one and line three.",
        "No grid tracks does not satisfy the stated requirement. The span crosses the interval between line one and line three."
      ],
      [
        "What shape must a named grid area form?",
        "A rectangle",
        "Any disconnected cells",
        "Only a diagonal",
        "Only one entire viewport",
        "A named template area must occupy a rectangular region.",
        "Any disconnected cells does not satisfy the stated requirement. A named template area must occupy a rectangular region.",
        "Only a diagonal does not satisfy the stated requirement. A named template area must occupy a rectangular region.",
        "Only one entire viewport does not satisfy the stated requirement. A named template area must occupy a rectangular region."
      ],
      [
        "Which property sizes implicit rows?",
        "grid-auto-rows",
        "grid-template-areas",
        "justify-content",
        "text-align",
        "Grid-auto-rows defines the size of rows created in the implicit grid.",
        "grid-template-areas does not satisfy the stated requirement. Grid-auto-rows defines the size of rows created in the implicit grid.",
        "justify-content does not satisfy the stated requirement. Grid-auto-rows defines the size of rows created in the implicit grid.",
        "text-align does not satisfy the stated requirement. Grid-auto-rows defines the size of rows created in the implicit grid."
      ],
      [
        "A later card fills an earlier hole under dense packing. What order must be compared?",
        "Visual and reading order",
        "Only font load order",
        "Only response header order",
        "Only stylesheet names",
        "Dense auto-placement can make visual placement diverge from source order.",
        "Only font load order does not satisfy the stated requirement. Dense auto-placement can make visual placement diverge from source order.",
        "Only response header order does not satisfy the stated requirement. Dense auto-placement can make visual placement diverge from source order.",
        "Only stylesheet names does not satisfy the stated requirement. Dense auto-placement can make visual placement diverge from source order."
      ],
      [
        "A header crosses two columns. Which line placement expresses that in a two-column grid?",
        "grid-column:1 / 3",
        "grid-column:1 / 2",
        "grid-row:3 / 4",
        "grid-column:3 / 3",
        "A two-column grid has three bounding column lines.",
        "grid-column:1 / 2 does not satisfy the stated requirement. A two-column grid has three bounding column lines.",
        "grid-row:3 / 4 does not satisfy the stated requirement. A two-column grid has three bounding column lines.",
        "grid-column:3 / 3 does not satisfy the stated requirement. A two-column grid has three bounding column lines."
      ],
      [
        "A named area occupies disjoint top-left and bottom-right cells. What is wrong?",
        "The area is not rectangular",
        "The name needs capital letters",
        "The file must use JSON",
        "The columns require flexbox",
        "Disjoint cells do not satisfy the rectangular-area requirement.",
        "The name needs capital letters does not satisfy the stated requirement. Disjoint cells do not satisfy the rectangular-area requirement.",
        "The file must use JSON does not satisfy the stated requirement. Disjoint cells do not satisfy the rectangular-area requirement.",
        "The columns require flexbox does not satisfy the stated requirement. Disjoint cells do not satisfy the rectangular-area requirement."
      ],
      [
        "A mobile article should precede related links for reading. What should determine source order?",
        "A meaningful content sequence",
        "Only desktop visual position",
        "Only shorter CSS rules",
        "Only route alphabetization",
        "Logical document sequence should support reading independently of visual placement.",
        "Only desktop visual position does not satisfy the stated requirement. Logical document sequence should support reading independently of visual placement.",
        "Only shorter CSS rules does not satisfy the stated requirement. Logical document sequence should support reading independently of visual placement.",
        "Only route alphabetization does not satisfy the stated requirement. Logical document sequence should support reading independently of visual placement."
      ],
      [
        "The matrix fixture returns true. What has it established?",
        "Only equal declared row lengths",
        "Complete CSS validity",
        "All focus orders pass",
        "Dense packing is accessible",
        "The array test does not validate the full grid syntax or interactive behavior.",
        "Complete CSS validity does not satisfy the stated requirement. The array test does not validate the full grid syntax or interactive behavior.",
        "All focus orders pass does not satisfy the stated requirement. The array test does not validate the full grid syntax or interactive behavior.",
        "Dense packing is accessible does not satisfy the stated requirement. The array test does not validate the full grid syntax or interactive behavior."
      ]
    ],
    "mistakes": [
      "Confusing line numbers with track counts.",
      "Using dense packing without checking focus order."
    ],
    "takeaways": [
      "Named areas require rectangular geometry.",
      "Source order remains meaningful across responsive templates."
    ],
    "prerequisite_note": "CSS Fundamentals is the canonical prerequisite: review the box model, cascade, relative units and contrast. This course develops layout relationships and responsive media rather than repeating those foundations. JavaScript fixtures are bounded arithmetic and policy models; actual CSS requires browser review."
  },
  {
    "id": "responsive-layout-choice",
    "comp": "m2.c2",
    "title": "Choose the layout model from content relationships",
    "introduction": "A storefront has both a category toolbar and a product gallery. Choosing one layout tool for every component makes alignment fragile and responsive behavior harder to explain.",
    "sections": [
      {
        "heading": "Choose the layout model from content relationships",
        "paragraphs": [
          "Flexbox is primarily one-dimensional: each line distributes its items independently. Grid coordinates rows and columns together, which is useful when a gallery requires shared column boundaries across rows. Choose from the relationship rather than the component\u2019s name. A toolbar may use flex while its surrounding page uses grid; nesting formatting contexts is normal and avoids forcing a single system to express unrelated constraints.",
          "Content-driven sizing and layout-driven sizing solve different needs. If variable-width badges should wrap naturally without aligning all rows, flex is often a good fit. If product cards must align to a repeated column structure, grid may express that directly. Neither model supplies semantic HTML, keyboard behavior, authorization or complete responsive image policy; these responsibilities stay explicit."
        ]
      },
      {
        "heading": "Work through the decision and its limits",
        "paragraphs": [
          "auto-fit and auto-fill in repeat() can create a responsive track count using a suitable minmax() range. They behave differently when empty repeated tracks remain: auto-fit can collapse empty tracks, allowing occupied tracks to expand, whereas auto-fill preserves the repeated track slots. A minimum wider than the container can still overflow; account for genuinely narrow widths when selecting the minimum.",
          "The fixture classifies stated layout requirements using a small explicit decision table. It is a teaching decision aid, not an automated CSS designer or browser benchmark. Validate the selected model with real content and edge cases, and document why aligned tracks or independent wrapping matter for this particular component."
        ]
      }
    ],
    "worked": {
      "lang": "javascript",
      "code": "const requirements=[{name:\"filters\",sharedColumns:false},{name:\"catalog\",sharedColumns:true}];\nconsole.log(requirements.map(x=>x.name+\":\"+(x.sharedColumns?\"grid\":\"flex\")).join(\"\\n\"));",
      "expect": "filters:flex\ncatalog:grid",
      "problem": "Choose a model for two stated component relationships.",
      "steps": [
        "Read whether each case requires shared columns.",
        "Apply the explicit local decision rule.",
        "Identify real content checks still needed."
      ],
      "explanation": "The fixture classifies stated layout requirements using a small explicit decision table. It is a teaching decision aid, not an automated CSS designer or browser benchmark. Validate the selected model with real content and edge cases, and document why aligned tracks or independent wrapping matter for this particular component."
    },
    "quiz": [
      [
        "Which model naturally coordinates rows and columns?",
        "Grid",
        "Only inline text",
        "Only absolute positioning",
        "Only floats",
        "Grid provides a two-dimensional track structure.",
        "Only inline text does not satisfy the stated requirement. Grid provides a two-dimensional track structure.",
        "Only absolute positioning does not satisfy the stated requirement. Grid provides a two-dimensional track structure.",
        "Only floats does not satisfy the stated requirement. Grid provides a two-dimensional track structure."
      ],
      [
        "Which model commonly suits a single action row?",
        "Flexbox",
        "Only CSS counters",
        "Only table captions",
        "Only background images",
        "Flexbox expresses one-dimensional content distribution.",
        "Only CSS counters does not satisfy the stated requirement. Flexbox expresses one-dimensional content distribution.",
        "Only table captions does not satisfy the stated requirement. Flexbox expresses one-dimensional content distribution.",
        "Only background images does not satisfy the stated requirement. Flexbox expresses one-dimensional content distribution."
      ],
      [
        "Can a grid item itself be a flex container?",
        "Yes, contexts can nest",
        "No, CSS forbids nesting",
        "Only with JavaScript layout",
        "Only without text",
        "An element can participate in an outer grid and establish an inner flex context.",
        "No, CSS forbids nesting does not satisfy the stated requirement. An element can participate in an outer grid and establish an inner flex context.",
        "Only with JavaScript layout does not satisfy the stated requirement. An element can participate in an outer grid and establish an inner flex context.",
        "Only without text does not satisfy the stated requirement. An element can participate in an outer grid and establish an inner flex context."
      ],
      [
        "A gallery needs matching column boundaries across rows. Which model directly expresses this?",
        "Grid tracks",
        "Independent flex lines",
        "Only margin-left values",
        "Only white-space rules",
        "Shared tracks coordinate the cross-row column structure.",
        "Independent flex lines does not satisfy the stated requirement. Shared tracks coordinate the cross-row column structure.",
        "Only margin-left values does not satisfy the stated requirement. Shared tracks coordinate the cross-row column structure.",
        "Only white-space rules does not satisfy the stated requirement. Shared tracks coordinate the cross-row column structure."
      ],
      [
        "A tag cloud wants varied item widths and independent wraps. Which starting model fits?",
        "Wrapping flexbox",
        "A forced fixed-column table",
        "Only absolute coordinates",
        "A page-wide hidden overflow",
        "Flex lines allow content-led one-dimensional wrapping.",
        "A forced fixed-column table does not satisfy the stated requirement. Flex lines allow content-led one-dimensional wrapping.",
        "Only absolute coordinates does not satisfy the stated requirement. Flex lines allow content-led one-dimensional wrapping.",
        "A page-wide hidden overflow does not satisfy the stated requirement. Flex lines allow content-led one-dimensional wrapping."
      ],
      [
        "A designer changes auto-fill to auto-fit with few cards. What may happen to empty tracks?",
        "They can collapse",
        "They always become focusable",
        "They always add markup",
        "They remove all row gaps",
        "Auto-fit collapses empty repeated tracks after placement under its sizing behavior.",
        "They always become focusable does not satisfy the stated requirement. Auto-fit collapses empty repeated tracks after placement under its sizing behavior.",
        "They always add markup does not satisfy the stated requirement. Auto-fit collapses empty repeated tracks after placement under its sizing behavior.",
        "They remove all row gaps does not satisfy the stated requirement. Auto-fit collapses empty repeated tracks after placement under its sizing behavior."
      ],
      [
        "A grid\u2019s minimum card width is wider than a phone. What must be checked?",
        "The narrow-container minimum",
        "Only the largest monitor",
        "Only the endpoint region",
        "Only the route\u2019s file size",
        "A fixed minimum can exceed available space even with responsive repetition.",
        "Only the largest monitor does not satisfy the stated requirement. A fixed minimum can exceed available space even with responsive repetition.",
        "Only the endpoint region does not satisfy the stated requirement. A fixed minimum can exceed available space even with responsive repetition.",
        "Only the route\u2019s file size does not satisfy the stated requirement. A fixed minimum can exceed available space even with responsive repetition."
      ],
      [
        "The model chooses grid for a catalog. What has it not proven?",
        "Rendered usability",
        "The supplied catalog flag",
        "The selected mapping branch",
        "The returned grid label",
        "A decision table does not measure actual layout or interaction.",
        "The flag is supplied to the model rather than validated by rendering.",
        "The selected mapping branch is already established by the output.",
        "The returned label is known; it is not evidence of actual catalog usability."
      ]
    ],
    "mistakes": [
      "Choosing layout from framework fashion instead of relationships.",
      "Claiming a layout system guarantees accessibility."
    ],
    "takeaways": [
      "Grid coordinates tracks; flex distributes along an axis.",
      "Combine layout contexts when relationships differ."
    ],
    "prerequisite_note": "CSS Fundamentals is the canonical prerequisite: review the box model, cascade, relative units and contrast. This course develops layout relationships and responsive media rather than repeating those foundations. JavaScript fixtures are bounded arithmetic and policy models; actual CSS requires browser review."
  },
  {
    "id": "responsive-viewport",
    "comp": "m3.c1",
    "title": "Start with the viewport and content-driven breakpoints",
    "introduction": "A support page appears as a tiny desktop page on a phone. Correct responsive behavior begins by understanding the layout viewport before adding more media queries.",
    "sections": [
      {
        "heading": "Start with the viewport and content-driven breakpoints",
        "paragraphs": [
          "Use a viewport meta element with name=\"viewport\" and content=\"width=device-width, initial-scale=1\" so mobile browsers can use an appropriate layout viewport. CSS pixels are reference units, not necessarily individual hardware pixels. Do not disable user zoom with maximum-scale or user-scalable restrictions as a shortcut for inflexible layouts; users need magnification and content must remain usable when enlarged.",
          "Mobile-first CSS begins with a working small-layout baseline and adds changes with min-width media queries when content needs more room. Pick breakpoints where the design fails or gains a useful arrangement, rather than assuming every product needs a particular phone model\u2019s width. Media query evaluation concerns the media feature being queried; width concerns the viewport, while container queries address an element\u2019s available container context."
        ]
      },
      {
        "heading": "Work through the decision and its limits",
        "paragraphs": [
          "A navigation bar that stops fitting below 42rem can stack by default and become a row at a content-tested min-width threshold. Use the same content fixtures with long labels and text enlargement when choosing that threshold. Device orientation alone is a poor proxy for enough space because split windows, zoom and unusual devices break fixed assumptions.",
          "The fixture compares supplied viewport widths against a declared breakpoint and reports the selected conceptual layout. It does not emulate the meta element, browser zoom, media query parsing or rem resolution. The output is evidence for the conditional rule alone; browser checks must verify that CSS and real content produce the intended result."
        ]
      }
    ],
    "worked": {
      "lang": "javascript",
      "code": "const breakpoint=672;\nfor(const width of [360,800])console.log(width+\":\"+(width>=breakpoint?\"row\":\"stack\"));",
      "expect": "360:stack\n800:row",
      "problem": "Apply a declared breakpoint to two supplied viewport widths.",
      "steps": [
        "Identify the baseline stack state.",
        "Compare each width to the threshold.",
        "Distinguish branch testing from real viewport behavior."
      ],
      "explanation": "The fixture compares supplied viewport widths against a declared breakpoint and reports the selected conceptual layout. It does not emulate the meta element, browser zoom, media query parsing or rem resolution. The output is evidence for the conditional rule alone; browser checks must verify that CSS and real content produce the intended result."
    },
    "quiz": [
      [
        "Which meta setting relates layout width to the device?",
        "width=device-width",
        "width=desktop-only",
        "screen=fixed",
        "layout=wide",
        "The viewport setting allows an appropriate mobile layout viewport.",
        "width=desktop-only does not satisfy the stated requirement. The viewport setting allows an appropriate mobile layout viewport.",
        "screen=fixed does not satisfy the stated requirement. The viewport setting allows an appropriate mobile layout viewport.",
        "layout=wide does not satisfy the stated requirement. The viewport setting allows an appropriate mobile layout viewport."
      ],
      [
        "What is a mobile-first baseline?",
        "A usable small-layout default",
        "A mandatory phone-only product",
        "A separate DOM for each phone",
        "A guarantee of fast networks",
        "Mobile-first starts with small-screen usability and adds enhancements as room permits.",
        "A mandatory phone-only product does not satisfy the stated requirement. Mobile-first starts with small-screen usability and adds enhancements as room permits.",
        "A separate DOM for each phone does not satisfy the stated requirement. Mobile-first starts with small-screen usability and adds enhancements as room permits.",
        "A guarantee of fast networks does not satisfy the stated requirement. Mobile-first starts with small-screen usability and adds enhancements as room permits."
      ],
      [
        "Which query commonly adds wider layouts?",
        "min-width",
        "max-color",
        "font-family",
        "response-time",
        "A min-width query applies once the tested viewport width reaches the threshold.",
        "max-color does not satisfy the stated requirement. A min-width query applies once the tested viewport width reaches the threshold.",
        "font-family does not satisfy the stated requirement. A min-width query applies once the tested viewport width reaches the threshold.",
        "response-time does not satisfy the stated requirement. A min-width query applies once the tested viewport width reaches the threshold."
      ],
      [
        "A page looks tiny on a phone despite small-screen CSS. What should be inspected early?",
        "Viewport meta settings",
        "Image intrinsic dimensions",
        "The computed line height",
        "The navigation source order",
        "A desktop-like mobile viewport can prevent the expected responsive presentation.",
        "Image dimensions may cause local overflow but do not explain the initial page-scale configuration.",
        "Line height can affect text spacing without setting the mobile layout viewport.",
        "Navigation order does not configure the phone's layout viewport width."
      ],
      [
        "A team picks breakpoints solely from device brands. What should guide the decision instead?",
        "Actual content fit",
        "Only market slogans",
        "Only package version numbers",
        "Only image EXIF data",
        "Breakpoints should reflect when the content needs a different layout.",
        "Only market slogans does not satisfy the stated requirement. Breakpoints should reflect when the content needs a different layout.",
        "Only package version numbers does not satisfy the stated requirement. Breakpoints should reflect when the content needs a different layout.",
        "Only image EXIF data does not satisfy the stated requirement. Breakpoints should reflect when the content needs a different layout."
      ],
      [
        "A user zooms and labels collide. Which fix protects usability?",
        "Adapt layout at enlarged text",
        "Disable all zoom gestures",
        "Delete long labels",
        "Hide every overflowing action",
        "User enlargement should remain usable rather than being blocked.",
        "Disable all zoom gestures does not satisfy the stated requirement. User enlargement should remain usable rather than being blocked.",
        "Delete long labels does not satisfy the stated requirement. User enlargement should remain usable rather than being blocked.",
        "Hide every overflowing action does not satisfy the stated requirement. User enlargement should remain usable rather than being blocked."
      ],
      [
        "A widget sits inside a narrow sidebar on a wide page. Which context is most relevant to its fit?",
        "Local container width",
        "The full viewport width",
        "The screen diagonal size",
        "The device pixel density",
        "Viewport width alone may not describe a component’s actual available width.",
        "A wide viewport can contain a narrow sidebar with different local constraints.",
        "Screen diagonal size does not tell the widget its available container width.",
        "Pixel density describes hardware-to-CSS scaling rather than local layout space."
      ],
      [
        "The width fixture chooses row at 800. What remains unverified?",
        "The CSS query in a browser",
        "The numeric comparison",
        "The supplied threshold",
        "The selected branch label",
        "The model does not parse CSS or render content.",
        "The numeric comparison does not satisfy the stated requirement. The model does not parse CSS or render content.",
        "The supplied threshold does not satisfy the stated requirement. The model does not parse CSS or render content.",
        "The selected branch label does not satisfy the stated requirement. The model does not parse CSS or render content."
      ]
    ],
    "mistakes": [
      "Disabling zoom to conceal content collisions.",
      "Choosing breakpoints only from device labels."
    ],
    "takeaways": [
      "Start with usable small content.",
      "Choose thresholds using actual fit evidence."
    ],
    "prerequisite_note": "CSS Fundamentals is the canonical prerequisite: review the box model, cascade, relative units and contrast. This course develops layout relationships and responsive media rather than repeating those foundations. JavaScript fixtures are bounded arithmetic and policy models; actual CSS requires browser review."
  },
  {
    "id": "responsive-fluid-units",
    "comp": "m3.c1",
    "title": "Constrain fluid sizing without sacrificing reading",
    "introduction": "An account portal needs headings that scale gently and a content area that does not stretch into unreadably long lines. Relative units need clear bounds and reference contexts.",
    "sections": [
      {
        "heading": "Constrain fluid sizing without sacrificing reading",
        "paragraphs": [
          "Percentages refer to a property-specific containing context; they are not universally percentages of viewport width. rem relates to root font size, em has a font-relative context, and vw represents a fraction of viewport width. Use these relationships intentionally: a max-width on a readable article may constrain line length while width:100% allows it to fit smaller parents. Include padding and border through an appropriate box-sizing policy.",
          "clamp(minimum, preferred, maximum) constrains a preferred value between bounds. A heading such as clamp(1.5rem, 1rem + 2vw, 2.5rem) can grow with viewport width while retaining font-relative bounds. A pure viewport-sized font can become too small on narrow windows and interact poorly with text enlargement; do not assume fluid sizing automatically preserves zoom usability."
        ]
      },
      {
        "heading": "Work through the decision and its limits",
        "paragraphs": [
          "A dashboard card may use width:min(100%, 40rem), with internal spacing that also works on phones. Dynamic mobile browser chrome complicates full-height designs: small, large and dynamic viewport units represent different viewport concepts. Choose among svh, lvh and dvh based on whether stability, maximum space or current visible-height adaptation fits the interaction, then test actual mobile behavior.",
          "The example numerically clamps a supplied preferred size for three viewport values with an assumed 16px root. It neither resolves actual CSS computed values nor tests browser zoom, mobile browser chrome or font metrics. Use the numbers to explain the bounds, and validate readable rendered content under user enlargement and narrow containers."
        ]
      }
    ],
    "worked": {
      "lang": "javascript",
      "code": "const root=16;\nfor(const width of [200,800,1600]){const preferred=root+0.02*width;console.log(Math.min(2.5*root,Math.max(1.5*root,preferred)));}",
      "expect": "24\n32\n40",
      "problem": "Trace a bounded heading-size calculation under supplied assumptions.",
      "steps": [
        "Convert the rem bounds using the stated root.",
        "Compute the preferred size for each viewport.",
        "Clamp each value and identify browser checks."
      ],
      "explanation": "The example numerically clamps a supplied preferred size for three viewport values with an assumed 16px root. It neither resolves actual CSS computed values nor tests browser zoom, mobile browser chrome or font metrics. Use the numbers to explain the bounds, and validate readable rendered content under user enlargement and narrow containers."
    },
    "quiz": [
      [
        "What does clamp() provide?",
        "A bounded preferred value",
        "An automatic contrast pass",
        "A mandatory grid layout",
        "A fixed hardware pixel size",
        "Clamp constrains a preferred calculation between minimum and maximum bounds.",
        "An automatic contrast pass does not satisfy the stated requirement. Clamp constrains a preferred calculation between minimum and maximum bounds.",
        "A mandatory grid layout does not satisfy the stated requirement. Clamp constrains a preferred calculation between minimum and maximum bounds.",
        "A fixed hardware pixel size does not satisfy the stated requirement. Clamp constrains a preferred calculation between minimum and maximum bounds."
      ],
      [
        "What does rem reference?",
        "The root font size",
        "The current API response",
        "The image byte count",
        "The selected border width",
        "Rem is relative to the root element\u2019s font size.",
        "The current API response does not satisfy the stated requirement. Rem is relative to the root element\u2019s font size.",
        "The image byte count does not satisfy the stated requirement. Rem is relative to the root element\u2019s font size.",
        "The selected border width does not satisfy the stated requirement. Rem is relative to the root element\u2019s font size."
      ],
      [
        "What does 1vw represent?",
        "One percent of viewport width",
        "One percent of every parent",
        "One physical screen dot",
        "One root font size",
        "Vw is a viewport-width-relative unit.",
        "One percent of every parent does not satisfy the stated requirement. Vw is a viewport-width-relative unit.",
        "One physical screen dot does not satisfy the stated requirement. Vw is a viewport-width-relative unit.",
        "One root font size does not satisfy the stated requirement. Vw is a viewport-width-relative unit."
      ],
      [
        "A preferred font calculation is 20px with 24px and 40px bounds. What is used in the arithmetic model?",
        "24px",
        "20px",
        "40px",
        "64px",
        "The lower bound raises a preferred value that is below the minimum.",
        "20px does not satisfy the stated requirement. The lower bound raises a preferred value that is below the minimum.",
        "40px does not satisfy the stated requirement. The lower bound raises a preferred value that is below the minimum.",
        "64px does not satisfy the stated requirement. The lower bound raises a preferred value that is below the minimum."
      ],
      [
        "A fluid heading becomes too small in a narrow window. What improves the sizing contract?",
        "A suitable minimum bound",
        "Only a wider desktop image",
        "Only disabling selection",
        "Only a faster API",
        "A minimum can preserve a useful floor while the preferred calculation stays fluid.",
        "Only a wider desktop image does not satisfy the stated requirement. A minimum can preserve a useful floor while the preferred calculation stays fluid.",
        "Only disabling selection does not satisfy the stated requirement. A minimum can preserve a useful floor while the preferred calculation stays fluid.",
        "Only a faster API does not satisfy the stated requirement. A minimum can preserve a useful floor while the preferred calculation stays fluid."
      ],
      [
        "An article fills a huge monitor with very long lines. Which constraint helps?",
        "A readable maximum width",
        "Only full viewport width",
        "Only a fixed line count",
        "Only an image background",
        "A maximum content width can limit excessive line length.",
        "Only full viewport width does not satisfy the stated requirement. A maximum content width can limit excessive line length.",
        "Only a fixed line count does not satisfy the stated requirement. A maximum content width can limit excessive line length.",
        "Only an image background does not satisfy the stated requirement. A maximum content width can limit excessive line length."
      ],
      [
        "A team assumes 50% always means half the viewport. What should be clarified?",
        "Its reference box",
        "The current pixel density",
        "The font download size",
        "The viewport aspect ratio",
        "Percentage reference contexts depend on the property and containing layout.",
        "Pixel density does not choose a percentage property's reference box.",
        "Font resource byte size does not determine percentage width resolution.",
        "Viewport aspect ratio does not make all percentages viewport-relative."
      ],
      [
        "The clamp fixture prints 24, 32, 40. What remains to test?",
        "Text enlargement usability",
        "The arithmetic bounds",
        "The declared root assumption",
        "The three input widths",
        "A numerical calculation does not exercise actual browser text scaling.",
        "The arithmetic bounds does not satisfy the stated requirement. A numerical calculation does not exercise actual browser text scaling.",
        "The declared root assumption does not satisfy the stated requirement. A numerical calculation does not exercise actual browser text scaling.",
        "The three input widths does not satisfy the stated requirement. A numerical calculation does not exercise actual browser text scaling."
      ]
    ],
    "mistakes": [
      "Assuming every percentage references the viewport.",
      "Equating fluid text with proven zoom usability."
    ],
    "takeaways": [
      "Use bounds to manage fluid extremes.",
      "Test text preferences and real containing contexts."
    ],
    "prerequisite_note": "CSS Fundamentals is the canonical prerequisite: review the box model, cascade, relative units and contrast. This course develops layout relationships and responsive media rather than repeating those foundations. JavaScript fixtures are bounded arithmetic and policy models; actual CSS requires browser review."
  },
  {
    "id": "responsive-image-sources",
    "comp": "m3.c2",
    "title": "Serve appropriate image candidates without distorting content",
    "introduction": "A marketplace sends a 2400px product image into every 320px card. Responsive image selection can reduce transfer work while preserving the product\u2019s appearance.",
    "sections": [
      {
        "heading": "Serve appropriate image candidates without distorting content",
        "paragraphs": [
          "A responsive CSS image often needs max-width:100% and height:auto so it can shrink within its container while maintaining its intrinsic aspect ratio. Supplying width and height attributes establishes an aspect ratio before the resource arrives and can reserve space. Cropping via object-fit:cover is a separate visual decision: it can make uniform thumbnails but may conceal important product details.",
          "srcset with width descriptors supplies candidate intrinsic widths, and sizes describes the expected rendered slot size for matching media conditions. The browser combines this information with device pixel ratio and other selection considerations. A density-descriptor set uses candidates such as 1x and 2x under a different contract. Do not mix descriptor kinds in one source set or treat sizes as CSS that directly sets the displayed width."
        ]
      },
      {
        "heading": "Work through the decision and its limits",
        "paragraphs": [
          "If a card slot is 320 CSS pixels and an assumed pixel ratio is 2, a rough target is 640 source pixels. Candidates at 320, 640 and 1280 give the browser alternatives. This target is explanatory rather than a promise of the selected request: the user agent has its own selection behavior, caches and network considerations. Inspect actual network transfers and rendered sharpness.",
          "The fixture selects the smallest supplied candidate meeting a synthetic slot-times-ratio target. It does not implement HTML source selection or fetch any image. Verify actual srcset and sizes markup in a browser, reserve space and compare transfer bytes under realistic narrow-screen conditions."
        ]
      }
    ],
    "worked": {
      "lang": "javascript",
      "code": "const slot=320,ratio=2,candidates=[320,640,1280];\nconst target=slot*ratio;\nconsole.log(target);\nconsole.log(candidates.find(w=>w>=target));",
      "expect": "640\n640",
      "problem": "Estimate a candidate width for a supplied card slot and display ratio.",
      "steps": [
        "Multiply the declared CSS slot by the ratio.",
        "Find the first supplied candidate reaching that target.",
        "Explain why a browser can make a different choice."
      ],
      "explanation": "The fixture selects the smallest supplied candidate meeting a synthetic slot-times-ratio target. It does not implement HTML source selection or fetch any image. Verify actual srcset and sizes markup in a browser, reserve space and compare transfer bytes under realistic narrow-screen conditions."
    },
    "quiz": [
      [
        "Which CSS pairing preserves ratio while allowing shrinkage?",
        "max-width:100%; height:auto",
        "width:1000px; height:10px",
        "min-width:2000px; height:100%",
        "overflow:hidden; opacity:0",
        "A maximum responsive width with auto height can retain intrinsic ratio.",
        "width:1000px; height:10px does not satisfy the stated requirement. A maximum responsive width with auto height can retain intrinsic ratio.",
        "min-width:2000px; height:100% does not satisfy the stated requirement. A maximum responsive width with auto height can retain intrinsic ratio.",
        "overflow:hidden; opacity:0 does not satisfy the stated requirement. A maximum responsive width with auto height can retain intrinsic ratio."
      ],
      [
        "What does srcset provide?",
        "Alternative image candidates",
        "Mandatory keyboard shortcuts",
        "A server authorization rule",
        "A replacement page title",
        "Srcset lists sources with width or density descriptors for candidate selection.",
        "Mandatory keyboard shortcuts does not satisfy the stated requirement. Srcset lists sources with width or density descriptors for candidate selection.",
        "A server authorization rule does not satisfy the stated requirement. Srcset lists sources with width or density descriptors for candidate selection.",
        "A replacement page title does not satisfy the stated requirement. Srcset lists sources with width or density descriptors for candidate selection."
      ],
      [
        "What does sizes describe with width descriptors?",
        "The expected rendered slot size",
        "The file\u2019s compressed byte count",
        "A compulsory download limit",
        "The CSS border thickness",
        "Sizes gives source selection information about the image\u2019s expected display slot.",
        "The file\u2019s compressed byte count does not satisfy the stated requirement. Sizes gives source selection information about the image\u2019s expected display slot.",
        "A compulsory download limit does not satisfy the stated requirement. Sizes gives source selection information about the image\u2019s expected display slot.",
        "The CSS border thickness does not satisfy the stated requirement. Sizes gives source selection information about the image\u2019s expected display slot."
      ],
      [
        "A 320px slot at an assumed ratio of 2 has what rough source target?",
        "640 source pixels",
        "160 source pixels",
        "3200 source pixels",
        "2 source pixels",
        "The explanatory target multiplies CSS slot width by device pixel ratio.",
        "160 source pixels does not satisfy the stated requirement. The explanatory target multiplies CSS slot width by device pixel ratio.",
        "3200 source pixels does not satisfy the stated requirement. The explanatory target multiplies CSS slot width by device pixel ratio.",
        "2 source pixels does not satisfy the stated requirement. The explanatory target multiplies CSS slot width by device pixel ratio."
      ],
      [
        "An image jumps the page when it loads. Which markup can reserve aspect-ratio space?",
        "Width and height attributes",
        "Only a longer alt string",
        "Only a new filename",
        "Only a CSS color token",
        "Dimensions can establish an aspect ratio before the image loads.",
        "Only a longer alt string does not satisfy the stated requirement. Dimensions can establish an aspect ratio before the image loads.",
        "Only a new filename does not satisfy the stated requirement. Dimensions can establish an aspect ratio before the image loads.",
        "Only a CSS color token does not satisfy the stated requirement. Dimensions can establish an aspect ratio before the image loads."
      ],
      [
        "A product\u2019s edge is missing from a uniform thumbnail. Which rule may explain this?",
        "object-fit:cover",
        "height:auto only",
        "display:inline only",
        "font-weight:normal",
        "Cover fills the box and can crop content beyond its aspect ratio.",
        "height:auto only does not satisfy the stated requirement. Cover fills the box and can crop content beyond its aspect ratio.",
        "display:inline only does not satisfy the stated requirement. Cover fills the box and can crop content beyond its aspect ratio.",
        "font-weight:normal does not satisfy the stated requirement. Cover fills the box and can crop content beyond its aspect ratio."
      ],
      [
        "A developer treats sizes as the image\u2019s layout width. What needs correction?",
        "It informs candidate selection",
        "It always overrides CSS width",
        "It sets the border-box height",
        "It changes the file\u2019s metadata",
        "Sizes participates in source selection rather than directly establishing CSS layout.",
        "It always overrides CSS width does not satisfy the stated requirement. Sizes participates in source selection rather than directly establishing CSS layout.",
        "It sets the border-box height does not satisfy the stated requirement. Sizes participates in source selection rather than directly establishing CSS layout.",
        "It changes the file\u2019s metadata does not satisfy the stated requirement. Sizes participates in source selection rather than directly establishing CSS layout."
      ],
      [
        "The candidate model chooses 640. What remains unverified?",
        "The browser\u2019s actual request",
        "The target multiplication",
        "The ordered candidate list",
        "The returned array value",
        "The local algorithm is not the user agent\u2019s source selection implementation.",
        "The target multiplication does not satisfy the stated requirement. The local algorithm is not the user agent\u2019s source selection implementation.",
        "The ordered candidate list does not satisfy the stated requirement. The local algorithm is not the user agent\u2019s source selection implementation.",
        "The returned array value does not satisfy the stated requirement. The local algorithm is not the user agent\u2019s source selection implementation."
      ]
    ],
    "mistakes": [
      "Using sizes as if it were a CSS width declaration.",
      "Cropping important image content without review."
    ],
    "takeaways": [
      "Provide accurate candidate and slot information.",
      "Preserve aspect ratio and reserve loading space."
    ],
    "prerequisite_note": "CSS Fundamentals is the canonical prerequisite: review the box model, cascade, relative units and contrast. This course develops layout relationships and responsive media rather than repeating those foundations. JavaScript fixtures are bounded arithmetic and policy models; actual CSS requires browser review."
  },
  {
    "id": "responsive-media-priority",
    "comp": "m3.c2",
    "title": "Prioritize visible media and test responsive delivery",
    "introduction": "A news page defers every image and its headline photograph appears late. Responsive delivery also needs a priority policy based on what users see first.",
    "sections": [
      {
        "heading": "Prioritize visible media and test responsive delivery",
        "paragraphs": [
          "loading=\"lazy\" can defer offscreen images, reducing initial network work. It is usually inappropriate to lazy-load the likely largest visible hero merely because lazy loading helped a long gallery. The browser\u2019s lazy-loading thresholds are implementation details, so test the actual page rather than promising an exact request distance. fetchpriority=\"high\" is a hint for an important image, not a guarantee of immediate display.",
          "Use picture when art direction or format alternatives require multiple source rules. Art direction changes the image composition for a context; resolution switching supplies different sizes of the same composition. Source order and media or type matching affect selection. Keep a meaningful fallback img with appropriate alt text and dimensions; source elements do not remove that responsibility."
        ]
      },
      {
        "heading": "Work through the decision and its limits",
        "paragraphs": [
          "Image compression, dimensions and encoding should match the content. A photograph and a logo can justify different formats, and support or quality requirements matter. Video needs an intentional poster, controls, captions and loading policy; autoplaying large media can consume bandwidth and create accessibility problems. Responsive CSS alone does not make an oversized resource cheap to transfer.",
          "The fixture sorts a synthetic image request plan into eager and lazy groups using a supplied above-fold flag. It does not observe the browser fold, schedule requests or calculate LCP. Validate performance with network and field evidence, check the hero\u2019s actual display timing, and inspect accessibility alternatives for image and video content."
        ]
      }
    ],
    "worked": {
      "lang": "javascript",
      "code": "const media=[{id:\"hero\",visible:true},{id:\"gallery\",visible:false}];\nfor(const x of media)console.log(x.id+\":\"+(x.visible?\"eager\":\"lazy\"));",
      "expect": "hero:eager\ngallery:lazy",
      "problem": "Make an explicit eager versus lazy plan for supplied media visibility.",
      "steps": [
        "Read each synthetic visibility flag.",
        "Keep the declared visible hero eager.",
        "Separate the plan from measured browser scheduling."
      ],
      "explanation": "The fixture sorts a synthetic image request plan into eager and lazy groups using a supplied above-fold flag. It does not observe the browser fold, schedule requests or calculate LCP. Validate performance with network and field evidence, check the hero\u2019s actual display timing, and inspect accessibility alternatives for image and video content."
    },
    "quiz": [
      [
        "What is a common use for loading=\"lazy\"?",
        "Deferring offscreen images",
        "Authenticating image requests",
        "Replacing image alternatives",
        "Guaranteeing zero layout shift",
        "Lazy loading can delay resources not immediately needed for visible content.",
        "Authenticating image requests does not satisfy the stated requirement. Lazy loading can delay resources not immediately needed for visible content.",
        "Replacing image alternatives does not satisfy the stated requirement. Lazy loading can delay resources not immediately needed for visible content.",
        "Guaranteeing zero layout shift does not satisfy the stated requirement. Lazy loading can delay resources not immediately needed for visible content."
      ],
      [
        "What is fetchpriority primarily?",
        "A browser scheduling hint",
        "A guarantee of instant decoding",
        "A server permission check",
        "An image format converter",
        "Fetchpriority expresses relative importance but does not guarantee timing.",
        "A guarantee of instant decoding does not satisfy the stated requirement. Fetchpriority expresses relative importance but does not guarantee timing.",
        "A server permission check does not satisfy the stated requirement. Fetchpriority expresses relative importance but does not guarantee timing.",
        "An image format converter does not satisfy the stated requirement. Fetchpriority expresses relative importance but does not guarantee timing."
      ],
      [
        "What can picture support?",
        "Art direction",
        "Automatic image compression",
        "Automatic density detection",
        "Automatic CSS slot sizing",
        "Picture can select sources by media conditions and format support.",
        "Picture selects sources; it does not compress their encoded bytes.",
        "Density switching is described by candidates; picture also supports composition changes.",
        "CSS determines layout sizing rather than picture automatically establishing a slot width."
      ],
      [
        "A headline hero is likely the LCP image. What policy deserves reconsideration?",
        "Lazy-loading the hero",
        "Reserving its aspect ratio",
        "Writing descriptive alt text",
        "Compressing its image bytes",
        "Deferring the likely visible LCP resource can delay its appearance.",
        "Reserving aspect-ratio space helps stability rather than deferring the visible resource.",
        "An accurate alternative describes the image without postponing its request.",
        "Compression can reduce transfer work rather than deliberately defer the hero."
      ],
      [
        "A mobile banner needs a different crop rather than just fewer pixels. Which requirement is this?",
        "Art direction",
        "Only density switching",
        "Only font substitution",
        "Only cache invalidation",
        "Art direction changes composition to suit the display context.",
        "Only density switching does not satisfy the stated requirement. Art direction changes composition to suit the display context.",
        "Only font substitution does not satisfy the stated requirement. Art direction changes composition to suit the display context.",
        "Only cache invalidation does not satisfy the stated requirement. Art direction changes composition to suit the display context."
      ],
      [
        "A developer says width:100% makes a huge video cheap. What is missing?",
        "Media delivery choices",
        "Another layout breakpoint",
        "A smaller CSS width value",
        "A fixed aspect ratio",
        "Visual scaling does not reduce the bytes of a requested video resource.",
        "Another breakpoint changes presentation rather than reducing the video bytes transferred.",
        "A smaller CSS width does not make the requested video resource smaller.",
        "A fixed aspect ratio reserves geometry rather than reducing network delivery cost."
      ],
      [
        "A picture contains source rules but no meaningful fallback img. What needs repair?",
        "Fallback image semantics",
        "Only the source indentation",
        "Only the route title",
        "Only a grid gutter",
        "The img supplies the fallback and its semantic alternative and dimensions.",
        "Only the source indentation does not satisfy the stated requirement. The img supplies the fallback and its semantic alternative and dimensions.",
        "Only the route title does not satisfy the stated requirement. The img supplies the fallback and its semantic alternative and dimensions.",
        "Only a grid gutter does not satisfy the stated requirement. The img supplies the fallback and its semantic alternative and dimensions."
      ],
      [
        "The media plan prints hero:eager. What has not been measured?",
        "Actual hero load timing",
        "The supplied visibility flag",
        "The branch\u2019s string result",
        "The array traversal",
        "The scheduling plan does not execute network loading or measure LCP.",
        "The supplied visibility flag does not satisfy the stated requirement. The scheduling plan does not execute network loading or measure LCP.",
        "The branch\u2019s string result does not satisfy the stated requirement. The scheduling plan does not execute network loading or measure LCP.",
        "The array traversal does not satisfy the stated requirement. The scheduling plan does not execute network loading or measure LCP."
      ]
    ],
    "mistakes": [
      "Lazy-loading every image including a critical hero.",
      "Assuming visual scaling reduces transfer size."
    ],
    "takeaways": [
      "Match loading priority to visible content needs.",
      "Verify actual requests and visible loading metrics."
    ],
    "prerequisite_note": "CSS Fundamentals is the canonical prerequisite: review the box model, cascade, relative units and contrast. This course develops layout relationships and responsive media rather than repeating those foundations. JavaScript fixtures are bounded arithmetic and policy models; actual CSS requires browser review."
  }
],[
  {
    "id": "responsive-flex",
    "title": "MDN: Flexbox",
    "url": "https://github.com/mdn/content/blob/33afe694c61ec6a36bf2e363124c1210b25a5c0f/files/en-us/web/css/guides/flexible_box_layout/basic_concepts/index.md",
    "source": {
      "repo": "mdn/content",
      "commit": "33afe694c61ec6a36bf2e363124c1210b25a5c0f",
      "path": "files/en-us/web/css/guides/flexible_box_layout/basic_concepts/index.md",
      "verification": "Official source inspected at pinned commit; examples explicitly identify their execution boundary."
    }
  },
  {
    "id": "responsive-grid",
    "title": "MDN: Grid",
    "url": "https://github.com/mdn/content/blob/33afe694c61ec6a36bf2e363124c1210b25a5c0f/files/en-us/web/css/guides/grid_layout/basic_concepts/index.md",
    "source": {
      "repo": "mdn/content",
      "commit": "33afe694c61ec6a36bf2e363124c1210b25a5c0f",
      "path": "files/en-us/web/css/guides/grid_layout/basic_concepts/index.md",
      "verification": "Official source inspected at pinned commit; examples explicitly identify their execution boundary."
    }
  },
  {
    "id": "responsive-images",
    "title": "MDN: Responsive images",
    "url": "https://github.com/mdn/content/blob/33afe694c61ec6a36bf2e363124c1210b25a5c0f/files/en-us/web/html/guides/responsive_images/index.md",
    "source": {
      "repo": "mdn/content",
      "commit": "33afe694c61ec6a36bf2e363124c1210b25a5c0f",
      "path": "files/en-us/web/html/guides/responsive_images/index.md",
      "verification": "Official source inspected at pinned commit; examples explicitly identify their execution boundary."
    }
  }
]);

