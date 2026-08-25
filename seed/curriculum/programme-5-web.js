'use strict';

/**
 * EchoLens Curriculum seed data - Programme 5: Modern Responsive Web
 * Architecture. Transcribed verbatim from
 * EchoLens_Course_and_Module_Handbook.pdf (pages 51-62). See
 * programme-1-c.js for the video-URL note.
 */
module.exports = {
  code: 'P5',
  name: 'Modern Responsive Web Architecture',
  courses: [
    {
      code: 'WEB5.1',
      title: 'Semantic HTML and Web Accessibility: Build Sites Everyone Can Actually Use',
      level: 'Beginner',
      order_no: 1,
      capstone_artifact: 'DevFolio Accessible Personal Portfolio Platform',
      modules: [
        {
          order_no: 1,
          title: 'Document Structure and Semantic Elements',
          learning_outcome: 'Structure a page so that its outline is meaningful without any styling.',
          sections: {
            videos: [
              { channel: 'Fireship', title: 'HTML in 100 Seconds', length: '2 min' },
              { channel: 'Kevin Powell', title: 'Semantic HTML explained', length: '12 min' },
              { channel: 'Web Dev Simplified', title: 'Learn Semantic HTML In 15 Minutes', length: '15 min' },
            ],
            reading: "A generic container tells a browser, a search engine and a screen reader nothing. Semantic elements carry meaning that assistive technology uses to build a navigable outline, which is why a page built from headers, navigation, main, articles and sections is usable with styling switched off and a page built from generic containers is not. Heading order is part of that structure: screen reader users navigate by heading, and skipping a level breaks the map they are building of your page.",
            rules: [
              'One main element per page. It marks where the primary content begins for skip navigation.',
              'Heading levels never skip. Going from level two to level four breaks the document outline.',
              'Use a section only when it has a heading. Otherwise a generic container is honest and correct.',
              'Test by disabling styles. If the page still reads in a sensible order, the structure is sound.',
            ],
            example: {
              caption: 'A page outline that reads correctly without any styling',
              language: 'html',
              code: `<body>
  <header><nav aria-label="Primary"><!-- links --></nav></header>
  <main>
    <h1>Data Science Career Track</h1>
    <section aria-labelledby="curriculum">
      <h2 id="curriculum">Curriculum</h2>
      <article><h3>Module 1</h3><p>...</p></article>
    </section>
  </main>
  <footer><!-- contact --></footer>
</body>`,
            },
          },
          assignments: [
            { title: 'Assignment 1.1: Outline repair', brief: 'Fix the heading order in three supplied pages without changing the visual result.', pass_criteria: 'Outline validates with no skipped levels.' },
            { title: 'Assignment 1.2: Semantic refactor', brief: 'Convert a page built entirely from generic containers to semantic elements.', pass_criteria: 'Identical appearance, valid outline, passes the automated structure check.' },
          ],
          project: { title: 'Semantic rebuild of a landing page', brief: 'Rebuild a supplied container based landing page using semantic elements only, verified by an outline report and a styles disabled read through.' },
        },
        {
          order_no: 2,
          title: 'Images, Media and Alternative Text',
          learning_outcome: 'Deliver responsive media with alternative text that carries real information.',
          sections: {
            videos: [
              { channel: 'Kevin Powell', title: 'Responsive images with srcset and sizes', length: '13 min' },
              { channel: 'Web Dev Simplified', title: 'Learn SVG In 15 Minutes', length: '15 min' },
            ],
            reading: "Alternative text is not a caption and not a keyword list. It answers one question: what would the user miss if the image did not load. A decorative image takes empty alternative text so that assistive technology skips it, and an informative image takes a sentence that conveys the information. Responsive images solve a different problem: sending a two thousand pixel photograph to a phone wastes bandwidth that many users pay for by the megabyte, which matters more in this market than in most.",
            rules: [
              'Decorative images take empty alternative text. Informative images take a sentence stating the information.',
              'The srcset attribute offers sizes and the sizes attribute states the display width. The browser chooses.',
              'Use the picture element when the image itself changes, not merely its resolution.',
              'Inline vector graphics can be styled and made accessible with a title. Images cannot.',
            ],
            example: {
              caption: 'Responsive sources with honest alternative text',
              language: 'html',
              code: `<img
  src="cohort-800.jpg"
  srcset="cohort-400.jpg 400w, cohort-800.jpg 800w, cohort-1600.jpg 1600w"
  sizes="(max-width: 640px) 100vw, 50vw"
  alt="Students presenting a capstone project to a panel of three reviewers"
  width="800" height="450" loading="lazy">`,
            },
          },
          assignments: [
            { title: 'Assignment 2.1: Alternative text audit', brief: 'Rewrite the alternative text for twelve images, marking which should be empty.', pass_criteria: 'At least ten judged correctly with reasons.' },
            { title: 'Assignment 2.2: Payload reduction', brief: 'Convert a gallery to responsive sources and report the byte saving at mobile width.', pass_criteria: 'Measurable reduction, no visible quality loss.' },
          ],
          project: { title: 'Accessible media gallery', brief: 'Build a gallery with responsive sources, meaningful alternative text, keyboard navigation and captions, verified with a screen reader walkthrough.' },
        },
        {
          order_no: 3,
          title: 'Forms, Labels and Native Validation',
          learning_outcome: 'Build forms that are usable by keyboard and screen reader and validate before submission.',
          sections: {
            videos: [
              { channel: 'Web Dev Simplified', title: 'Learn HTML Forms In 15 Minutes', length: '15 min' },
              { channel: 'Kevin Powell', title: 'Styling form inputs and accessible labels', length: '12 min' },
            ],
            reading: "A form control without a programmatically associated label is unusable by a screen reader, and placeholder text is not a substitute because it disappears the moment typing begins. Native validation attributes do a large share of the work for free and, importantly, they work before any script loads. The remaining discipline is error messaging: an error must be announced, associated with its field, and describe how to fix the problem rather than merely stating that something is wrong.",
            rules: [
              'Every control needs a label associated by identifier. Placeholder text is not a label.',
              'Native attributes for required, type, pattern, minimum and maximum validate without any script.',
              'Group related controls in a field set with a legend. Radio groups are unusable without it.',
              'Associate the error message with its field and state the fix, not just the failure.',
            ],
            example: {
              caption: 'A field with a real label, native validation and a linked error',
              language: 'html',
              code: `<div class="field">
  <label for="phone">Mobile number</label>
  <input id="phone" name="phone" type="tel" required
         pattern="03[0-9]{2}-[0-9]{7}"
         aria-describedby="phone-help phone-error">
  <p id="phone-help">Format: 0300-1234567</p>
  <p id="phone-error" role="alert" hidden>Enter the number as 0300-1234567</p>
</div>`,
            },
          },
          assignments: [
            { title: 'Assignment 3.1: Label repair', brief: 'Fix the labelling in a supplied form with eight controls.', pass_criteria: 'Every control announced correctly, automated check clean.' },
            { title: 'Assignment 3.2: Native first validation', brief: 'Add validation using native attributes only, then enhance the messaging with script.', pass_criteria: 'Form still validates with script disabled.' },
          ],
          project: { title: 'Multi step registration form', brief: 'Build a three step registration form with per step validation, progress indication, keyboard navigation, announced errors and no data loss when moving between steps.' },
        },
        {
          order_no: 4,
          title: 'Accessibility Auditing and Discoverability',
          learning_outcome: 'Audit a page against the accessibility criteria and fix what fails.',
          sections: {
            videos: [
              { channel: 'Kevin Powell', title: 'Web accessibility basics', length: '14 min' },
              { channel: 'Fireship', title: 'Web Accessibility in 100 Seconds', length: '3 min' },
              { channel: 'Web Dev Simplified', title: 'Learn ARIA In 12 Minutes', length: '12 min' },
            ],
            reading: "Accessibility is testable, which makes it unlike most design questions. Contrast has a numeric threshold, focus order is observable by pressing the tab key, and roles are inspectable in the browser tools. The rule that saves the most trouble is that a native element with correct semantics beats a generic container with attributes bolted on, because the native element brings keyboard behaviour and state announcement with it. Metadata for search and sharing belongs in this module because it is the same discipline: describing your page accurately to a machine.",
            rules: [
              'Contrast: normal text needs a ratio of at least 4.5 to 1, large text at least 3 to 1.',
              'The first rule of the accessibility attributes is not to use them. A native element is almost always better.',
              'Focus must be visible and follow the reading order. Never remove the focus outline without replacing it.',
              'A focus trap is a modal that keyboard users cannot leave. Test every overlay for it.',
            ],
            example: {
              caption: 'A native control instead of a bolted on role',
              language: 'html',
              code: `<!-- fragile: needs script for keyboard, focus and state -->
<div role="button" tabindex="0" onclick="save()">Save</div>

<!-- correct: keyboard, focus and announcement are free -->
<button type="button" onclick="save()">Save</button>`,
            },
          },
          assignments: [
            { title: 'Assignment 4.1: Audit and fix', brief: 'Audit a supplied page and resolve every violation at the required level.', pass_criteria: 'Automated check clean and a manual keyboard pass completed.' },
            { title: 'Assignment 4.2: Focus trap hunt', brief: 'Find and fix the two focus traps in a supplied application.', pass_criteria: 'Every overlay escapable by keyboard.' },
          ],
          project: { title: 'Accessibility and discoverability audit report', brief: 'Audit a real public page, document every violation with its criterion, produce a fixed version and write a before and after report. This project feeds the course final project.' },
        },
      ],
    },
    {
      code: 'WEB5.2',
      title: 'CSS Architecture and Responsive Layout: Cascade, Box Model and Flexbox Mastery',
      level: 'Intermediate',
      order_no: 2,
      capstone_artifact: 'DevFolio Accessible Personal Portfolio Platform',
      modules: [
        {
          order_no: 1,
          title: 'The Cascade, Specificity and Design Tokens',
          learning_outcome: 'Predict which rule wins and build a themeable token system.',
          sections: {
            videos: [
              { channel: 'Kevin Powell', title: 'CSS specificity explained', length: '12 min' },
              { channel: 'Kevin Powell', title: 'CSS custom properties, a complete guide', length: '14 min' },
              { channel: 'Fireship', title: 'CSS Cascade Layers in 100 Seconds', length: '3 min' },
            ],
            reading: "Specificity is a comparison, not a score, and once that is clear the endless override war ends. The practical consequence is that the fix for a rule not applying is almost never to add an override of last resort, it is to lower the specificity of the competing rule. Custom properties change the picture further because they cascade and inherit, which means a theme is a set of values redefined at one place in the tree rather than a duplicate stylesheet.",
            rules: [
              'Specificity compares identifier count, then class count, then element count. A later rule wins only on a tie.',
              'The override of last resort is a maintenance debt. Reach for it only in a utility layer, never in components.',
              'Custom properties inherit. Redefine them on a wrapper element to retheme everything inside it.',
              'Cascade layers let you order whole groups of rules, so a reset can never accidentally outrank a component.',
            ],
            example: {
              caption: 'A token system retheming through one redefinition',
              language: 'css',
              code: `:root {
  --brand: #0E3457;
  --accent: #03C39A;
  --surface: #FAF8F3;
  --text: #12212F;
}
[data-theme="dark"] {
  --surface: #0B1620;
  --text: #E8EFF3;
}
.card { background: var(--surface); color: var(--text); border-top: 3px solid var(--accent); }`,
            },
          },
          assignments: [
            { title: 'Assignment 1.1: Specificity puzzles', brief: 'For eight rule pairs state which wins and why.', pass_criteria: 'At least six correct with reasons.' },
            { title: 'Assignment 1.2: Remove the overrides', brief: 'Eliminate every override of last resort from a supplied stylesheet without changing the rendered result.', pass_criteria: 'None remaining, visual output identical.' },
          ],
          project: { title: 'Themeable design token system', brief: 'Build a token system with light and dark themes, spacing and type scales, applied to a component set and switchable with a single attribute change.' },
        },
        {
          order_no: 2,
          title: 'The Box Model, Formatting Contexts and Overflow',
          learning_outcome: 'Diagnose layout defects from the box model rather than by trial and error.',
          sections: {
            videos: [
              { channel: 'Kevin Powell', title: 'The CSS box model explained', length: '11 min' },
              { channel: 'Kevin Powell', title: 'Margin collapsing explained', length: '10 min' },
            ],
            reading: "Most mysterious spacing comes from two behaviours: the default box sizing that adds padding and border on top of the declared width, and margin collapsing between adjacent vertical margins. Neither is a bug, and both become predictable once named. Formatting contexts explain the rest, including why an element containing only floated children has no height and why a scroll container behaves differently from its parent. Debugging layout is a matter of asking which box and which context, in that order.",
            rules: [
              'With border box sizing, the declared width includes padding and border. Set it globally and stop compensating.',
              'Adjacent vertical margins collapse to the larger of the two. Horizontal margins never collapse.',
              'A new formatting context is created by overflow, flex, grid or a few other properties. It contains floats and stops margin collapse.',
              'Overflow hidden clips silently. Overflow auto scrolls only when needed. Choose deliberately.',
            ],
            example: {
              caption: 'Predictable sizing and a contained context',
              language: 'css',
              code: `*, *::before, *::after { box-sizing: border-box; }
.card {
  inline-size: 320px;
  padding: 1.5rem;          /* included in the 320px, not added to it */
  border: 1px solid var(--line);
  display: flow-root;       /* new context: no margin escape, floats contained */
}`,
            },
          },
          assignments: [
            { title: 'Assignment 2.1: Spacing diagnosis', brief: 'Explain the cause of six spacing anomalies and fix each.', pass_criteria: 'At least five correct diagnoses with fixes.' },
            { title: 'Assignment 2.2: Overflow repair', brief: 'Fix three components where content escapes or is clipped.', pass_criteria: 'Content visible and scrollable as specified at every width.' },
          ],
          project: { title: 'Pixel accurate card component set', brief: 'Build a card set matching a supplied design at three widths, with consistent spacing, contained overflow and no magic numbers in the stylesheet.' },
        },
        {
          order_no: 3,
          title: 'Flexbox Alignment Mechanics',
          learning_outcome: 'Lay out one dimensional components with correct axis reasoning.',
          sections: {
            videos: [
              { channel: 'Kevin Powell', title: 'Learn Flexbox in 15 minutes', length: '15 min' },
              { channel: 'Fireship', title: 'Flexbox in 100 Seconds', length: '3 min' },
              { channel: 'Web Dev Simplified', title: 'Learn Flexbox In 15 Minutes', length: '15 min' },
            ],
            reading: "Nearly every flexbox difficulty is an axis mistake. Justification works along the main axis, alignment works along the cross axis, and changing the direction swaps which is which. Once that is internalised, the common patterns become one liners: a navigation bar with a pushed group, a card footer pinned to the bottom, a centred element. Modern gap spacing removed the last reason to space items with margins, which also removed the last row spacing defect.",
            rules: [
              'Justify along the main axis. Align along the cross axis. Changing direction swaps them.',
              'An automatic margin absorbs free space and is the cleanest way to push one group apart from another.',
              'Use gap for spacing between items. Margins on children produce edge defects when wrapping.',
              'Align self overrides the container alignment for one item without a wrapper.',
            ],
            example: {
              caption: 'A navigation bar with a pushed group and no margin hacks',
              language: 'css',
              code: `.nav {
  display: flex;
  align-items: center;     /* cross axis */
  gap: 1.5rem;
}
.nav__brand { margin-inline-end: auto; }   /* absorbs the free space */
.nav__cta   { align-self: stretch; display: grid; place-items: center; }`,
            },
          },
          assignments: [
            { title: 'Assignment 3.1: Axis drills', brief: 'Reproduce eight supplied layouts using flexbox only, with no positioning.', pass_criteria: 'All eight match at every test width.' },
            { title: 'Assignment 3.2: Margin to gap', brief: 'Convert a margin spaced layout to gap and fix the wrapping defects it reveals.', pass_criteria: 'Clean spacing at all widths.' },
          ],
          project: { title: 'Responsive site header', brief: 'Build a header with brand, navigation, search and a call to action that reflows cleanly from wide desktop to narrow mobile without a media query where possible.' },
        },
        {
          order_no: 4,
          title: 'Flexible Sizing, Wrapping and Intrinsic Layout',
          learning_outcome: 'Control how items grow, shrink and wrap under real content.',
          sections: {
            videos: [
              { channel: 'Kevin Powell', title: 'flex grow, flex shrink and flex basis explained', length: '13 min' },
              { channel: 'Kevin Powell', title: 'min content, max content and fit content', length: '11 min' },
            ],
            reading: "The growth, shrink and basis triple decides what happens when the container is bigger or smaller than the content, and the shorthand hides that the basis defaults differently than most people assume. The other half of this module is intrinsic sizing: keywords that let an element size itself from its own content rather than from a number the developer guessed. Layouts built from intrinsic sizes survive content changes, and layouts built from fixed pixel values break the first time a longer word arrives.",
            rules: [
              'The shorthand order is grow, shrink, basis. Basis wins over a declared width when both are present.',
              'An item cannot shrink below its minimum content size unless that minimum is explicitly lowered.',
              'Wrapping plus a basis with a minimum produces a responsive grid with no media query.',
              'Intrinsic keywords let content decide the size. Prefer them over guessed pixel values.',
            ],
            example: {
              caption: 'Auto wrapping cards with no media query at all',
              language: 'css',
              code: `.cloud {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}
.cloud > * {
  flex: 1 1 min(18rem, 100%);   /* grow, shrink, sensible basis */
  min-inline-size: 0;           /* allows shrink below content width */
}`,
            },
          },
          assignments: [
            { title: 'Assignment 4.1: Sizing predictions', brief: 'Predict the rendered width of items under six different declarations.', pass_criteria: 'At least four correct with reasons.' },
            { title: 'Assignment 4.2: Overflow under long content', brief: 'Fix three layouts that break when given a very long unbroken word.', pass_criteria: 'No horizontal scroll at any width.' },
          ],
          project: { title: 'Content aware tag cloud', brief: 'Build a tag cloud that wraps naturally, keeps even spacing, handles very long labels without overflow and needs no media query. This project feeds the course final project.' },
        },
      ],
    },
    {
      code: 'WEB5.3',
      title: 'Advanced CSS: Grid, Subgrid, Fluid Design Systems and Motion',
      level: 'Advanced',
      order_no: 3,
      capstone_artifact: 'DevFolio Accessible Personal Portfolio Platform',
      modules: [
        {
          order_no: 1,
          title: 'Two Dimensional Grid Layout',
          learning_outcome: 'Build layouts that reflow by themselves without breakpoint proliferation.',
          sections: {
            videos: [
              { channel: 'Kevin Powell', title: 'Learn CSS Grid in 20 minutes', length: '15 min' },
              { channel: 'Fireship', title: 'CSS Grid in 100 Seconds', length: '3 min' },
              { channel: 'Kevin Powell', title: 'auto fit vs auto fill in CSS Grid', length: '10 min' },
            ],
            reading: "Grid is the first layout system that is genuinely two dimensional, which means rows and columns are declared together rather than emerging from the content flow. The single most valuable pattern in it is the automatically fitting track with a minimum and maximum size, because it produces a responsive grid that adds and removes columns by itself as the container changes. That pattern replaces a stack of breakpoints with one line, and breakpoint sprawl is the main maintenance cost in most stylesheets.",
            rules: [
              'The fractional unit distributes leftover space after fixed tracks are placed.',
              'Automatically fitting tracks collapse empty ones. Automatically filling tracks keep them.',
              'A minimum and maximum track function gives a floor and a ceiling, which is what makes reflow automatic.',
              'Implicit rows are created as needed. Set their size explicitly when consistency matters.',
            ],
            example: {
              caption: 'A responsive grid with no media queries',
              language: 'css',
              code: `.editorial {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(20rem, 100%), 1fr));
  gap: clamp(1rem, 2vw, 2rem);
  grid-auto-rows: minmax(12rem, auto);
}
.editorial__feature { grid-column: span 2; }`,
            },
          },
          assignments: [
            { title: 'Assignment 1.1: Breakpoint elimination', brief: 'Replace a five breakpoint layout with an automatically reflowing grid.', pass_criteria: 'Identical behaviour at every width, no media query for column count.' },
            { title: 'Assignment 1.2: Track drills', brief: 'Reproduce six supplied layouts using grid tracks only.', pass_criteria: 'All six match at three widths.' },
          ],
          project: { title: 'Reflowing editorial grid', brief: 'Build a magazine style layout with feature and standard articles that reflows from one to four columns automatically and keeps a consistent vertical rhythm.' },
        },
        {
          order_no: 2,
          title: 'Named Areas, Subgrid and Alignment Across Components',
          learning_outcome: 'Align nested components to a shared grid and express layout by name.',
          sections: {
            videos: [
              { channel: 'Kevin Powell', title: 'CSS subgrid explained', length: '13 min' },
              { channel: 'Kevin Powell', title: 'grid template areas', length: '11 min' },
            ],
            reading: "Named template areas turn a layout into something readable in the stylesheet, because the declaration is a picture of the arrangement. Subgrid solves the harder problem that named areas cannot: making the internals of separate child components line up with each other. Before subgrid this required fixed heights or scripting, and the result broke the moment content differed. With it, a row of cards can have its titles, bodies and footers aligned across all cards regardless of content length.",
            rules: [
              'Template areas are declared as rows of names. Each name must form a rectangle.',
              'Subgrid makes a child use the parent tracks, which is how internals align across sibling components.',
              'Grid items can overlap deliberately by assigning them to the same lines, with layering controlled explicitly.',
              'Reordering by grid placement changes the visual order only. The reading order stays as written, which matters for accessibility.',
            ],
            example: {
              caption: 'Card internals aligned across siblings using subgrid',
              language: 'css',
              code: `.card-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; }

.card {
  display: grid;
  grid-template-rows: subgrid;   /* uses the parent rows */
  grid-row: span 3;              /* title, body, footer align across cards */
}`,
            },
          },
          assignments: [
            { title: 'Assignment 2.1: Area naming', brief: 'Express three supplied page layouts entirely with named areas.', pass_criteria: 'All three match and every area forms a rectangle.' },
            { title: 'Assignment 2.2: Alignment without heights', brief: 'Align card internals across a row without any fixed height.', pass_criteria: 'Alignment holds with content of very different lengths.' },
          ],
          project: { title: 'Asymmetric dashboard layout', brief: 'Build a dashboard with panels of differing sizes using named areas and subgrid aligned internals, holding its alignment under every supplied data set.' },
        },
        {
          order_no: 3,
          title: 'Fluid Type, Container Queries and Accessible Motion',
          learning_outcome: 'Scale a design continuously and animate without harming users.',
          sections: {
            videos: [
              { channel: 'Kevin Powell', title: 'Fluid typography with clamp', length: '12 min' },
              { channel: 'Kevin Powell', title: 'Container queries are here', length: '13 min' },
              { channel: 'Fireship', title: 'CSS Container Queries in 100 Seconds', length: '3 min' },
            ],
            reading: "Fluid sizing replaces a stack of breakpoint overrides with one expression that has a floor, a preferred value that scales with the viewport, and a ceiling. Container queries then fix the deeper flaw in responsive design: a component should respond to the space it has been given, not to the size of the window, which is what finally makes components genuinely portable. Motion belongs in the same module because scaling and animation both need a user preference check: for some users motion causes real physical discomfort.",
            rules: [
              'A clamped value takes a minimum, a preferred scaling value and a maximum. One line replaces several breakpoints.',
              'Container queries respond to the parent size, so a component behaves correctly wherever it is placed.',
              'Always honour the reduced motion preference. Replace movement with a fade or with nothing.',
              'Animate transform and opacity. Animating layout properties forces a full recalculation each frame.',
            ],
            example: {
              caption: 'Fluid type, a container query and a motion preference check',
              language: 'css',
              code: `h1 { font-size: clamp(1.75rem, 1.2rem + 2.5vw, 3.25rem); }

.panel { container-type: inline-size; }
@container (min-width: 34rem) {
  .panel__body { display: grid; grid-template-columns: 2fr 1fr; gap: 2rem; }
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
}`,
            },
          },
          assignments: [
            { title: 'Assignment 3.1: Breakpoint to fluid', brief: 'Convert a four breakpoint type scale to fluid expressions.', pass_criteria: 'Sizes match at the original breakpoints and scale smoothly between them.' },
            { title: 'Assignment 3.2: Portable component', brief: 'Make one component render correctly in a sidebar, a main column and a modal without any change.', pass_criteria: 'Correct in all three placements.' },
          ],
          project: { title: 'Fluid multi device layout', brief: 'Build a page whose type, spacing and component layout scale continuously across three device classes, with container aware components and a full reduced motion path.' },
        },
        {
          order_no: 4,
          title: 'Performance, Design Systems and the Course Capstone',
          learning_outcome: 'Ship an accessible interface inside a measured performance budget.',
          sections: {
            videos: [
              { channel: 'Fireship', title: 'Core Web Vitals explained', length: '9 min' },
              { channel: 'Kevin Powell', title: 'How to structure your CSS', length: '13 min' },
            ],
            reading: "An interface is finished when it meets a number, not when it looks done. Layout shift, interaction delay and largest paint time are all measurable and all fixable by specific means: reserving space for images and advertisements, avoiding long synchronous work, and loading the fonts and images that matter first. A design system is what keeps those numbers stable as a site grows, because it replaces one off decisions with a small set of tokens and components that have already been measured.",
            rules: [
              'Reserve space for every image and embed with width and height. Unreserved space is the main cause of layout shift.',
              'Set the performance budget before building. Measure on a mid range device, not a development laptop.',
              'A design system is tokens, components and rules for combining them. Anything else is a style guide.',
              'Document each component with its variants, its states and its accessibility notes, or it will be reimplemented.',
            ],
            example: {
              caption: 'Reserving space and loading in priority order',
              language: 'html',
              code: `<img src="hero.avif" width="1600" height="900"
     alt="Cohort graduation" fetchpriority="high">

<link rel="preload" as="font" type="font/woff2"
      href="/fonts/body.woff2" crossorigin>

<style> .hero { aspect-ratio: 16 / 9; } /* space reserved before load */ </style>`,
            },
          },
          assignments: [
            { title: 'Assignment 4.1: Shift elimination', brief: 'Reduce the layout shift on a supplied page below the required threshold.', pass_criteria: 'Measured score within budget.' },
            { title: 'Assignment 4.2: Component documentation', brief: 'Document three components with variants, states and accessibility notes.', pass_criteria: 'Another student can rebuild each from the documentation alone.' },
          ],
          project: { title: 'Course capstone: DevFolio accessible personal portfolio platform', brief: 'Build a production portfolio using grid and subgrid, a complete token system, three verified breakpoints, zero accessibility violations at the required level, a full reduced motion path and a met performance budget. Defended live.' },
        },
      ],
    },
  ],
};
