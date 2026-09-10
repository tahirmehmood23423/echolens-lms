# Free-course curriculum review

The machine-readable inventory records every published free course, module, lesson and assignment, including the complete existing lesson text, instructions, grading criteria and resources. `course-inventory-before.json` preserves the original mappings; `course-inventory.json` captures the final local API. `lesson-review.csv` joins each assignment to its resource and verification evidence. `video-inventory.csv` lists each unique original video, reuse, availability and both playback methods.

## What was checked

All 131 original unique YouTube resources were opened on the provider's watch page and attempted in an embedded player. Availability comes from the provider's playability response, not a thumbnail. Standard embedded playback required advancing media time. The second pass uses the app's actual `videoEmbedHtml` output, privacy-enhanced host and a click in the player, requiring media time greater than one second. A short playback sample proves that playback started, not that the entire recording is intact or suitable.

The original `in-app-videos.json` three-video probe used an incorrect hidden-control selector. Its timeouts are inconclusive and superseded by `in-app-playback.json`; they must not be counted as broken videos. Standard playback and in-app playback can have different outcomes because of browser policy, timing and network conditions. UNVERIFIED playback needs a manual check using the normal Play control on the target network/device, inspection of any provider restriction, and a longer seek/play sample. No video was confirmed removed or private in this run.

Transcript retrieval returned empty responses or timed out. Provider titles and available creator chapters/descriptions were inspected for topic mismatches and specific timestamps. These are partial content evidence. Every row retains **UNVERIFIED full lesson/assignment coverage** unless the precise reviewed scope is stated. An instructor must inspect the relevant segment or obtain accessible captions and solve the assignment using only the lesson and declared prerequisites before marking full coverage verified. Availability, embed loading and chapter relevance are separate checks.

## Narrow corrections implemented

| Lesson | Before | Current correction | Evidence and limit |
|---|---|---|---|
| Python basics lesson 3: input and casting | Advanced Python Hindi recording | Existing Mosh beginner recording at 9:08 | [Creator video](https://www.youtube.com/watch?v=kqtD5dpn9C8&t=548s): input chapter 9:08, conversion 10:48. Full assignment still needs pedagogical review. |
| JavaScript basics lesson 5: strings and templates | Python strings recording | Existing Caleb Curry JavaScript recording at 1:51:19 plus MDN template-literal reference | [Creator video](https://www.youtube.com/watch?v=9M4XKi25I2M&t=6679s): string datatype 1:51:19, string methods 1:57:08. [MDN template literals](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals) covers the language-specific template syntax. |
| JavaScript basics lesson 6: iteration | Python loops recording | Same JavaScript recording at 2:45:11 plus MDN loop guide | [Creator video](https://www.youtube.com/watch?v=9M4XKi25I2M&t=9911s): introduction to loops at 2:45:11. [MDN loops and iteration](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Loops_and_iteration) supplements specific loop forms. |
| Advanced JavaScript lesson 12: async generators | Python generators recording | Explicit Read lesson guide action; wrong video mapping removed from this JS lesson | [MDN async generators](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function*) is the correct language reference. A replacement video remains **OPEN**. The useful Python resource remains in its appropriate Python lesson and original inventory. |

The player now respects verified timestamp parameters and maintains a 16:9 ratio on mobile. A browser check confirms the 548-second parameter and the rendered mobile aspect ratio. The 131-video playback pass samples the base recordings; it does not claim playback or comprehension of every individual timestamped segment.

## Confirmed mismatch still needing a verified replacement

C++ basics lesson 10 requires classes, objects and access control, but its [linked introductory recording](https://www.youtube.com/watch?v=S3nx34WFXjI) has installation and first-program chapters. It supplies insufficient evidence for the bank-account exercise. Keep the authored lesson and assignment; select and inspect an appropriate classes/access-control segment before changing its video. A matching search title alone is not an approved replacement.

## Coverage gaps to review before calling the curriculum complete

These are topic/assignment coverage concerns based on the available chapters and titles, not claims that every recording is defective. The per-lesson CSV includes the corresponding review note.

| Course | Specific review work |
|---|---|
| C fundamentals | Lesson 2 uses a variables/output recording for program-entry anatomy; lesson 3 needs explicit escape sequences; lesson 13 requires break/continue beyond a basic loop recording. |
| C++ fundamentals | Verify auto/const in lesson 4, overloading in lesson 9, destructors in lesson 11, and replace the confirmed lesson 10 mismatch. |
| Python fundamentals | Verify modern f-strings, list comprehensions, LEGB as well as lambda, and exception handling alongside file I/O. |
| JavaScript fundamentals | Add inspected chapter offsets for reused long recordings; lesson 2 needs scope/hoisting sections. Verify filter/reduce as well as map in lesson 7 and currying as well as higher-order functions in lesson 12. |
| HTML/CSS fundamentals | Generally aligned chapter topics; still solve every assignment from the supplied explanation/example. Check form labels, keyboard use and responsive outcomes in the exercises. |
| Advanced C | The memory-address recording needs explicit malloc/free/leak coverage; struct-pointer material needs actual linked-list construction/traversal. Confirm masks and binary I/O with runnable examples. |
| Advanced C++ | Class templates currently use function-template material; verify Rule of Five/move semantics, vtables and algorithm predicates/lambdas beyond introductory examples. |
| Advanced Python | Verify metaclasses beyond ABCs, slots beyond weak references, and decorators beyond simple wrappers. The contextlib video is in French without a language label: disclose language or provide an inspected equivalent. |
| Advanced JavaScript | Verify #private fields, property descriptors/freeze, current microtask behavior, all four promise combinators and worker/isolation prerequisites. Async-generator video replacement remains open. |
| Advanced web | Cascade layers does not alone teach theme variables; subgrid does not alone teach auto-fit; container queries does not alone teach clamp. Verify backdrop-filter for the glass task, animation delay for staggered items, actual lazy-loading implementation, and hosting deployment beyond Git commands. Very short Sass/Tailwind/PostCSS introductions need practical worked examples. |

## Proposed revised outlines — not applied

Preserve IDs, completion records and existing useful explanations. These outlines organize additions and prerequisite checks; they are not permission to replace the published course wholesale.

| Path | Proposed module sequence | Changes requiring content review |
|---|---|---|
| C foundations → advanced | Toolchain and I/O → types/operators → control flow → functions → pointers/heap → structured data → file I/O/callbacks | Add memory diagrams and leak-check demonstration; supply a complete linked-list worked example before its task. |
| C++ foundations → advanced | Streams/types → strings/containers → references/functions → objects/lifetime → inheritance/interfaces → value semantics/templates → STL/ownership | Add an actual class/access-control lesson; separate function templates and class templates; pair constructors with destructor/RAII behavior. |
| Python foundations → advanced | Runtime/data → branching/collections → functions/scope → objects/files/errors → iterators/decorators → descriptors/context managers → concurrency | Explicit f-string/comprehension practice; separate slots/weakref/metaclasses objectives; label recording language and local-interpreter requirements. |
| JavaScript foundations → advanced | Runtime/types → strings/collections → functions/objects → async basics → object model/iteration → scheduling/cancellation → workers/shared memory | Remove cross-language dependencies; give task-specific timestamps; add explicit async-generator, modern microtask and allSettled examples. |
| HTML/CSS foundations → advanced | Semantic structure/forms → cascade/layout → responsive patterns → interaction/accessibility → architecture/build tools → performance/deployment | Add custom-property, auto-fit, clamp and backdrop-filter examples; provide real Sass/PostCSS setup and a verified deploy walkthrough. |

Before promoting an advanced course, declare prerequisite course/skills, execution environment and tool setup next to its outcome. C/C++ need a supported compiler and interactive/file behavior; Python concurrency/file exercises need a suitable interpreter; Sass/PostCSS need a build step; JavaScript workers/shared memory need the required origin/isolation support. The generic browser preview does not prove those environments work. Supply a tested local-tool fallback where the built-in runner cannot perform the exercise. These additions remain **NEEDS DECISION** for the curriculum owner rather than silently changing assessment requirements.

## Acceptance checklist for the content owner

For each UNVERIFIED row: confirm the spoken language and prerequisites, inspect the precise segment, add a verified timestamp when a long recording is reused, solve the assignment from its declared inputs, confirm the runner supports it, and record reviewer/date/evidence. Keep the existing assignment IDs and thresholds. Do not add a compulsory final exam unless an actual configured assessment has been authored and reviewed.
