# Home comparison design

The comparison stays immediately below the main Home hero at `/#learning-options`. It follows the supplied image's hierarchy: eyebrow, centered serif heading and description, free/paid selector, two feature cards, icons and inclusion indicators, recommended paid badge, course CTAs, navy gradient banner and three supporting points. Spacing and text size are reduced for the existing site layout; cards stack on phones.

Free features cover recorded lessons, assignments, conditional AI grading, self-paced study, completion-based verified certificates and exclusion of paid cohort tools. Paid features cover live classes, practice tasks, instructor guidance, personalized feedback, compiler telemetry, enrolled learner portal tools and verified certificates. Free learner account access is clarified below the cards. Assignment counts are course-specific; unsupported popularity, learner-count and blanket certificate-endorsement claims are not copied from the reference.

The selector highlights the chosen card, exposes its selection through `aria-pressed`, and scrolls to it on phones with reduced-motion support. Course and banner links use the existing paid/free catalogue routes.

Validation: the actual-server browser checks passed at 1440px and 390px, including all 13 feature rows, selector interactions, comparison dimensions, viewport overflow, course filters, registration drafts, Back/Forward, nine shared-navigation routes, legacy Home redirects and demo isolation. Synthetic records and captured mail were used. Updated `evidence/comparison-completed-*.png` show the complete comparison.
