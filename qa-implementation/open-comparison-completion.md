# Open-web comparison and course navigation completion

The existing free/paid comparison design remains the default `/open#compare` view. The catalogue now provides a return link. The mobile comparison toggle supports Arrow Left/Right and Home/End, with the selected control in the tab order.

Fixed catalogue hydration overwriting saved history filters during refresh. A selected free language now survives refresh and course-return navigation. Registration forms retain their draft through Back/Forward and refresh; Escape returns to the underlying course.

Updated copy to describe free learner access, course-specific assignments, conditional AI grading, staff evidence review and completion-based certificates. Removed unsupported popularity and blanket instructor-endorsement claims.

Validation: `node qa-implementation/open-comparison-browser.cjs` passed at 1440px and 390px using the actual server with synthetic records, temporary JSON persistence and captured mail. Checks cover comparison links, paid search filters, course breadcrumbs, browser Back/Forward, registration drafts, free language refresh, sign-in modal navigation, keyboard switching, viewport overflow and JavaScript errors. No production database or outbound email was used.

Evidence: `evidence/comparison-completed-1440.png`, `evidence/comparison-completed-390.png`, and `evidence/comparison-completed-results.json`.
