# Home comparison and student portal showcase

## Audit and plan
Express serves plain HTML/CSS/JavaScript. Home is / (public/landing.html); free and paid catalogues are /open#free and /open#paid. Course details use the existing /courses/:slug or open-web course routes. Actual role-based student screens live at /dashboard and the isolated demo equivalents /demo/dashboard and /demo/compiler. The existing demo already has fictional cohorts, grades, sessions, talent profiles and DEMO certificates; no duplicate dashboard or auth implementation is required.

Reuse the Inter/Georgia typography, navy text, pale background, purple/blue gradients, rounded cards, shared public navigation and existing selector. Keep the comparison immediately after the Home hero. Add the portal tour immediately after the comparison and before existing highlights. Capture actual demo screens under a provider-free temporary fixture, compress to WebP, build static accessible tabs, link to existing student demo, test responsive and existing routes, then publish the reviewed changes.

## 1. Added
Refined comparison; major student portal showcase; actual student overview; five numbered explanations; Learning Path, Live Classes, Code, Feedback, Progress and Career tabs; seven-step journey; certificate explanation with actual DEMO preview; final paid/free/demo calls to action; expanded image previews.

## 2. Files
Modified: public/landing.html, demo/landing.js, server.js (demo landing presentation only), public/js/demo-guard.js (student tour presentation), PRODUCT_FEATURES.md, qa-implementation/open-comparison-browser.cjs.
Created: public/css/portal-showcase.css, public/js/portal-showcase.js, public/img/portal-demo/{overview,learning,classes,code,feedback,progress,career,certificate}.webp, qa-implementation/capture-portal-demo.cjs, qa-implementation/portal-showcase-browser.cjs, qa-implementation/portal-showcase-links.cjs, this report, responsive evidence and results JSON.

## 3. New components
Static portal showcase, keyboard-accessible feature tabs, native preview dialog, learning journey, certificate comparison, conversion footer.

## 4. Reused components
Home comparison and selector; shared navigation; actual student course, schedule, assignment, progress, talent and compiler screens; certificate image renderer; isolated read-only demo; existing Google Analytics gtag.

## 5. Demo discovery
/demo is an existing isolated twelve-role client demonstration. /demo/?portal=student narrows the entry to the student account. Student-tour banners omit role switching, and internal Home links retain that entry. Default /demo continues serving the full client demo. Server authorization and authentication rules are unchanged.

## 6. Routes
No new routes. The existing demo root accepts a student presentation query. Main Home, catalogue, login, signup and course routes retain their behavior.

## 7. CTA destinations
Free: /open#free. Instructor-led: /open#paid. Inside portal: #portal-showcase. Student demo: /demo/?portal=student. Sample verification: /demo/cert?s=DEMO-STUDENT-001.

## 8. Responsive
Two comparison cards on desktop, stacked on phones; tab list horizontally scrolls; tour copy and screenshots stack below 1024px; journey becomes vertical below 600px; certificates and final buttons stack. Expanded previews allow panning readable screenshots on small screens.

## 9. Accessibility
Native links/buttons; tab roles and selected state; roving focus; Left/Right/Home/End keys; native modal with Escape and focus return; named expanded previews; alt text; explicit image dimensions; visible focus; 44px feature controls; reduced-motion support. Callouts accompany screenshots as readable text rather than relying on tiny screenshot labels.

## 10. Performance and analytics
Lazy, asynchronously decoded WebP images with fixed aspect ratios. No homepage iframe, dashboard bundle, authenticated portal requests for the showcase, new dependency or new provider. Existing landing account detection remains. Tab assets load on selection. Analytics: free_course_cta_clicked, paid_course_cta_clicked, portal_demo_clicked, portal_feature_viewed and one-time certificate_section_viewed. Events contain only feature names, no learner identity. No analytics provider means tracking safely does nothing.

## 11. Validation
Actual Express application run against temporary fictional JSON records, dotenv disabled and external providers removed. Showcase browser test covers 1440,1280,1024,768,430,390,360; all six tab images, keyboard navigation, dialog opening/Escape, touch height, loaded certificate images, no page overflow or JavaScript errors; student-only demo and blocked writes; signup UI, isolated account creation/free enrollment, actual password login and paid application intake. Existing comparison browser regression covers free and paid catalogues, course context, filter refresh, registration drafts, modal Back/Forward, shared public navigation across nine routes at 1440/390, demo scoping and legacy Home redirects. Store/API tests cover free enrollment, paid application offering/delivery rules and twelve demo roles. All seven widths passed; 26 enrollment/registration/demo tests passed. Separate link checks verified all five analytics event types, CTA destinations, local footer destinations and student-tour Home without a role-switch banner. Production data and live mail are never used.

## 12 and 13. Bugs found and fixed
Wrong certificate image endpoint corrected to existing /api/cert-og/:serial.png; verification query corrected to s. Larger readable comparison text plus a secondary CTA required updating the previous compact-card height check. Windows pipe encoding converted new decorative characters; new copy uses HTML entities/ASCII. Screenshots can be unreadable at phone scale; expand-and-pan preview added. Lazy certificate rendering is explicitly awaited in visual QA. Student marketing entry initially retained the multi-role switch banner; student-tour presentation removes it.

## 14. Limits and accurate claims
?One assignment? is not a universal free-course rule: actual tracks vary, so copy says Assignments. AI grading is conditional and evidence can require staff review. Free learners already have course/progress/submission/support access; the comparison describes a standard self-paced account rather than denying portal access. Paid certificates can record concepts/final project and verify authenticity; there is no separately scored certificate CLO matrix or independently verified instructor endorsement, so neither is advertised. Telemetry describes work patterns, not authoritative grades. No unsupported 5,000+ learner count, most-students preference, guaranteed job outcome or instant feedback claim was added. Live service availability still depends on production configuration. Demo meetings, execution, uploads, writes and external actions are disabled.

## 15. Next improvements
Confirm production provider availability and cohort offerings before campaigns; refresh screenshots when portal UI changes; evaluate analytics conversion after deployment; add formal per-CLO assessment evidence only if product requirements and certification records support it.
