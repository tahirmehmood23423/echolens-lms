# Shared public navigation

## Main Home destination

The main marketing website at `/` is now Home. Its existing hero, course highlights, events and FAQ remain, with compact free-versus-paid cards placed directly after the hero. Both cards link to the matching `/open` catalogue. All shared Home links, logos, course breadcrumbs and portal Home links now return to `/`. Old `/open`, `/open#home` and `/open#compare` entries redirect to main Home; the comparison alias opens `/#learning-options`. Demo Home links stay within the demo entry.

Updated desktop/mobile browser checks cover the main comparison, shared Home destinations, course and registration Back/Forward, demo isolation and all three legacy Home redirects.

The marketing website and server-rendered course pages had separate headers without Home. All public HTML screens now use the same navigation definition in `public-navigation.js`: Home, paid courses, free courses, events, announcements, feedback, compiler and FAQ. Home and the logo open `/open#home`; paid courses open `/open#paid`. The compact comparison stays on Home.

Server-rendered course pages call the definition directly. Run `node scripts/sync-public-navigation.cjs` after changing its links to regenerate the checked-in static headers. Shared CSS provides consistent wrapping, spacing, typography and focus indicators. Existing account controls on Open and Compiler remain connected to their page scripts. Public login links preserve their source page; role-based dashboard sidebars also have a Home link, including department roles.

Browser validation uses isolated synthetic records and captured mail. At 1440px and 390px, nine public routes have identical link labels and destinations, fit the viewport, and return correctly through Home and browser Back/Forward. Both learner course journeys still pass, including filters, language selection after refresh, registration drafts and sign-in dialogs. Screenshots in `evidence/shared-navigation-*` show the marketing site, course catalogue and login.
