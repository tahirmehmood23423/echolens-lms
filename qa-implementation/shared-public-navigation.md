# Shared public navigation

The marketing website and server-rendered course pages had separate headers without Home. All public HTML screens now use the same navigation definition in `public-navigation.js`: Home, paid courses, free courses, events, announcements, feedback, compiler and FAQ. Home and the logo open `/open#home`; paid courses open `/open#paid`. The compact comparison stays on Home.

Server-rendered course pages call the definition directly. Run `node scripts/sync-public-navigation.cjs` after changing its links to regenerate the checked-in static headers. Shared CSS provides consistent wrapping, spacing, typography and focus indicators. Existing account controls on Open and Compiler remain connected to their page scripts. Public login links preserve their source page; role-based dashboard sidebars also have a Home link, including department roles.

Browser validation uses isolated synthetic records and captured mail. At 1440px and 390px, nine public routes have identical link labels and destinations, fit the viewport, and return correctly through Home and browser Back/Forward. Both learner course journeys still pass, including filters, language selection after refresh, registration drafts and sign-in dialogs. Screenshots in `evidence/shared-navigation-*` show the marketing site, course catalogue and login.
