# EchoLens LMS v18 - Admissions Office Release

**The Student Coordinator portal is now the Admissions Office** (existing accounts keep working - only the name and duties changed). Every registration from the website - courses, hackathons, events, competitions - lands in the Admissions Office portal, and an email goes to **admissions@echolens.digital** (override with `ADMISSIONS_EMAIL`) plus a confirmation email to the student.

**Admissions owns the fee challan.** For each registration a short form (like certificate generation) asks only for an optional extra discount and the payment deadline, then auto-generates a QR-verified challan. **Ambassador codes are cross-checked automatically**: the portal shows "Ambassador referral - NAME (code) verified" and a straight 10% is applied on its own; any other discount picked by admissions stacks on top. **Discount categories are now managed by the Admissions Office** (add / edit / deactivate any time - challans snapshot their discount, so history never changes). Bank details also moved to admissions and ship with **dummy placeholder details** (Meezan Bank / EchoLens Digital (Pvt) Ltd) until the real account is saved.

**The challan splits the catalogue fee into three parts** - Tuition fee (70%), Portal & LMS fee (20%), Examination & certification fee (10%) - and carries the student's name, Student ID, course, discounts, net payable, deadline, bank details and verification QR. After review, admissions clicks **Send to student**: the challan is emailed **as a PDF attachment** (generated server-side with pdfkit, QR included) with instructions to pay and send the **payment screenshot + payment record to finance@echolens.digital** (override with `FINANCE_EMAIL`). Admissions can also download the exact same PDF from the portal.

**Finance verifies, and enrollment is automatic.** The Finance portal now shows exactly the students whose challans were generated and mailed; the finance officer manually verifies the emailed proof and clicks **Verify & confirm payment** - the challan is marked paid and the student is **auto-enrolled** into the newest batch of the course (account created or upgraded, credentials emailed, admissions notified). If no batch is open yet, the registration waits at "Payment verified" and the Admissions Office can enroll manually once one opens.

**Category usernames.** Every account registered with an email now gets a username derived from it: the part before the @ stays, the domain becomes the department's own - `tahir@gmail.com` as a student becomes **tahir@student.echolens**. Domains per category: student.echolens, open.echolens (free tier), admin.echolens, teacher.echolens, coordinator.echolens, hr.echolens, finance.echolens, admissions.echolens (Admissions Office), staff.echolens. Duplicate name parts get a number (tahir2@student.echolens). Sign-in accepts username, email, or reg no as before; credential emails state the username. When a free open account becomes a paying student, its username moves from @open.echolens to @student.echolens automatically. Existing accounts keep their current usernames.

Migration: none. Role key `student_coordinator` is unchanged in the database; only labels, duties and endpoints moved. New env (optional): `ADMISSIONS_EMAIL`, `FINANCE_EMAIL`.

---

# EchoLens LMS v12.3.1 - QA Release

Full regression pass across every role (anonymous / open / student / teacher / admin) and every flow. Defects found and fixed:

**P0 - Staff trapped by the WhatsApp modal on the open site.** The open portal showed the mandatory WhatsApp prompt to every signed-in account, including admins and teachers - and the modal is deliberately non-dismissable, so staff were stuck (the reported screenshot). It now appears only for learner accounts, exactly like the LMS portal version.

**P0 - Expired sessions trapped users behind locked modals.** If a session expired (or was signed out in another tab) after a page loaded, any action returned "Please sign in to continue" inside a modal that could not be closed. All 401s on the open site now recover cleanly: the header updates to signed-out, any locked modal unlocks and closes, and the sign-in gate opens with "Your session expired - sign in again to continue where you left off."

**P1 - Stale JavaScript after deploys.** Pages loaded /js and /css assets with no version marker, so returning visitors ran the previous release's frontend against the new backend - the likely cause of buttons "going somewhere else." All local assets are now version-stamped (?v1230); bump the stamp on future releases.

**P1 - Compiler sign-up dead end.** The compiler's "Create a free account with email" button linked to the open home page instead of the signup flow; it now deep-links to /open#signup.

**P1 - Landing button routed free accounts to the wrong home.** The signed-in header button now sends open (free) accounts to /open and portal accounts to /dashboard.

**P1 - Staff hitting dead Submit buttons.** Admins and teachers browsing open quests saw Submit buttons that the server would reject. Staff now get a read-and-run preview with a clear note that submissions are for learner accounts.

Verified in regression: the full role-by-endpoint matrix (public endpoints open to all; events, certificates and contact behind sign-in; open submissions accepted for learners and refused for staff), event creation/registration/submission with the exact UI payload shapes, expired-cookie behaviour, and a static audit proving every onclick handler and element id referenced by the open portal, compiler and dashboard actually exists.

**Deployment note:** set a permanent `JWT_SECRET` in the Render environment. Without it, any change to the default can invalidate every signed-in session after a redeploy - the most likely trigger of the mid-session sign-out that surfaced the P0 modal trap.

---

# EchoLens LMS v12.3 - Open Platform Release

**Course catalogue is fully public** - no sign-in needed to browse all 31 programs, prices, badges, and the Web Developer Path (`GET /api/public/catalogue`). Sign-in is now a modal that appears only where it matters: submitting work, joining events, earning certificates.

**Quests live inside their course, exactly like the LMS portal.** The Quests tab lists every course as a quest ladder; opening one shows every level and every task - the first week is open on paid programs (bootcamps open both week-1 sessions), free courses are open end to end, and locked levels show all task titles, points and difficulty with a Register button to unlock. Difficulties display uniformly as Easy / Medium / Hard.

**Free courses issue automatic certificates.** Open quests now have a real Submit button: submissions are AI-graded on the spot with the 10% reduction, gems are awarded by score and shown per task, progress bars track the course, and completing a fully free course (BC-03, BC-04, BC-06) above its pass mark issues a verified certificate automatically and emails it.

**Compiler only where it belongs.** Courses are code-mode or file-mode: coding tracks get the built-in compiler with Run + Submit; non-coding tracks (Prompt Engineering, Graphic Design, Canva, Excel, Marketing, Freelancing, Content Writing, Flutter, Video Editing, and the v11 no-IDE set) take file submissions instead - PDF, Word, PNG, JPEG, ZIP - all AI-gradable.

**In-site registration replaces the external form.** "Register" opens a short form (name, email, WhatsApp, city, course, note, honeypot-protected); submissions appear in the admin portal under Analytics and Leads as **New student registrations**, each with Contacted / Challan sent / Added to course checkmarks and an internal note - purely for the academy's records. Admin and student both receive confirmation email when SMTP is on.

**Announcements.** A new Announcements tab on the open website (plus a Latest section on Home) shows admin-published announcements - new cohorts, hackathons, webinars, discounts - with optional action links and pinning. Admins publish from the Events tab ("Website announcements"), optionally emailing portal / open / all audiences.

**Email addresses are actually checked.** Signup and registration verify the domain has MX records (fake domains are rejected), and when SMTP is configured a 6-digit code is emailed and must be entered before the account is created.

**Home tab.** The open site now opens on a proper home page: hero, quick stats, cards for every section, and the latest announcements. Deep links work: /open#courses, #quests, #events, #announcements, #register, #signup.

**Bug fixes.** Creating events from the admin portal was broken for every kind (an invalid CSS selector crashed the form handler) - hackathons, webinars, competitions and quests all create correctly now, and webinars no longer require tasks. Also fixed: stale problem rows leaking into webinar payloads.

---

# EchoLens LMS v12.2 - Professional UI & Auth Fixes

**Email sign-in fixed.** The "Create a free account with email" button on the open portal was wired to a function that did not exist, so email signup silently failed - now it opens the signup form correctly. Sign-in now also routes by role: open (free) accounts land on /open, portal accounts on /dashboard, both from the login page and the already-signed-in check.

**Google sign-in requires environment configuration** (this is why it reports "not configured"): set `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `APP_URL` (your deployed URL) on the server, and register `<APP_URL>/auth/google/callback` as an authorized redirect URI in the Google Cloud console. The Google button only appears once these are set.

**People view completed.** Admin People now lists Open website users as their own group, and every group heading shows its total count - so the number of accounts in the live database is always visible at a glance. If the production count differs from a local data file, the deployed persistent disk holds its own database: the seed never overwrites an existing `echolens.json`.

**Professional UI pass.** All decorative emoji removed from the open portal, compiler, landing page, and the v12 additions (landing feature icons are now clean SVG line icons); run/stop controls are plain text; status values are written out professionally (Pending verification, Not required, Open sign-up) with no raw machine-style text anywhere in the UI; sentence-case labels throughout; the landing registration band heading and secondary button are now readable on the dark background; the landing header button is renamed **LMS Portal**; the profile three-dot menu renders above surrounding cards on its own layer; and the task dataset box (upload controls) wraps cleanly inside its card with styled file inputs.

---

# EchoLens LMS v12.1 - August 2026 Catalogue Release

**The full August 2026 catalogue is live: 31 programs, 31 quest tracks.** The official catalogue (8 bootcamps, 11 short courses, 12 specialist tracks) now drives the whole platform, with correct prices, NEW / HIGH DEMAND / FLAGSHIP / FREE badges, and the Web Developer Path bundle (BC-04 -> SC-06 -> SC-07 -> ST-09, PKR 43,500, save 7,500). **15 brand-new quest tracks** were built for the new programs (BC-04..08, SC-06..11, ST-09..12) - every task includes course-session links, key documentation/resource links (MDN, official docs, free tools), and teacher-only solution guidelines.

**Free/paid split per the catalogue.** BC-03 (Everyday AI), BC-04 (Web Dev Kickstart) and BC-06 (Git & Freelance Launch) are fully free - every level open to signed-in members. Every paid program opens **Level 1 free** on the open problem set (OPEN_LEVELS env overrides). Free programs carry FREE badges in the problem set and catalogue.

**Catalogue is not openly visible.** The public landing page now shows only a teaser; the full catalogue with prices lives behind sign-in: the **Courses tab at /open** (clean table format like the problem set: code, badges, tier, duration, fee, Register / Start free buttons) and `GET /api/catalogue` (auth required). `/api/public/info` no longer exposes the catalogue.

**Key action buttons on the open portal (Courses tab + landing teaser):** Register for paid courses (Google Form), Campus Ambassador program application, and the **free webinar - 18 July, 4-5 PM**. Links are env-overridable: `REGISTRATION_FORM_URL`, `AMBASSADOR_FORM_URL`, `WEBINAR_URL`, `WEBINAR_LABEL`.

**Third-party platform names scrubbed.** No competitor platform names appear anywhere in the product UI, code comments, or docs - everything is branded as the EchoLens problem set / EchoLens compiler.

Also: SQL + Power BI (SC-03) batches now default the in-browser IDE ON (the compiler runs SQL natively); the new non-coding tracks default it OFF with per-batch teacher override.

---

# EchoLens LMS v12

## New in v12: Unified admin-run Events (quests / hackathons / competitions / webinars), EchoLens problem-set portal (clean professional problem-table workspace), C/C++/SQL compilers + free public compiler, leads database with email blasts, full analytics dashboard, AI auto-grading with automatic certificates

**One Events system, fully admin-controlled.** The new **Events** tab lets the admin create quests, hackathons, competitions, and webinars from a single form - choosing per event: **free or paid** (PKR fee + payment instructions), **inside the portal, on the open website, or both**, an optional **built-in compiler** (Python / C / C++ / SQL / web) with a **dataset URL** mounted into every run, admin-attached **documents**, tasks with difficulty and points, a **pass mark**, **AI auto-grading** on/off, **automatic certificates** on/off, prizes, and webinar meeting links. Creating an event can fire an **email announcement to portal students, open students, or everyone** in one click.

**Paid events use payment screenshots, not references.** Participants in paid events upload a **picture of the transaction** while registering; the admin sees the screenshot inline in the event's registrations panel and confirms or rejects it - the participant is emailed either way and can only submit once confirmed.

**Submissions: code, files, and links - graded by AI instantly.** Every event accepts **built-in-compiler code**, an **uploaded document** (any file), and/or a project link. With AI auto-grading on, submissions are scored on arrival with a **10% reduction applied to the AI's score**; when the average reaches the pass mark, a **QR-verified certificate is issued automatically** and emailed. Without an AI key (or auto-grading off), submissions wait for the admin's manual score - certificates still auto-issue at the pass mark.

**EchoLens problem-set portal (clean professional problem-table workspace) at /open.** The public playground became a clean professional workspace: a filterable **problem table** (status ticks, colored Easy/Medium/Hard chips, gems, Solve buttons) built from the open levels of every track, a split-pane **solve view** with the multi-language compiler, plus a **Quests & Events** tab where open users take admin-created events and collect certificates. **Nothing is accessible without signing in** - Google or a free email account (name, email, and **mandatory WhatsApp number**).

**Compilers grew again: C, C++, and SQL.** The task IDE, events, and the open portal now offer **C and C++** (compiled with real gcc/g++ through the free public Piston API, interactive stdin supported) and **SQL** (SQLite as WebAssembly, entirely in the browser - CSVs become tables automatically: sales.csv -> table sales). A standalone **free public compiler lives at /compiler** - sign in and use any language free of cost, with datasets **uploaded from your device or pulled from any URL** (a signed-in server proxy handles CORS).

**Students bring their own datasets.** Inside every quest task (and the open compiler), students can **upload their own CSV/JSON/text file** - it is mounted into the compiler in the browser (never uploaded to the server), so pd.read_csv('mydata.csv'), matplotlib charts, and SQL tables work on the student's data.

**Leads database + company email blasts.** Every open sign-in (Google or email) and every portal student becomes a **lead** (name, email, WhatsApp, source, date). WhatsApp is **mandatory** - a non-dismissable prompt collects it on first sign-in. The admin's new **Analytics & Leads** tab lists, filters, and **downloads leads as CSV**, and includes an **email composer**: write the announcement (enrollments, discounts, new batches), pick the audience (**portal / open / everyone incl. leads**), and it goes out from the company address (MAIL_FROM).

**A real analytics dashboard.** Total sign-ups, portal vs open users, leads, enrollments, event registrations/submissions, and certificates at a glance - plus a chart with a **metric dropdown** (sign-ups, enrollments, event registrations, event submissions, quest submissions, leads), **segment filters** (everyone / portal / open / specific course / specific event), and **daily / weekly / monthly / yearly** buttons.

**Fixes & polish.** The profile **... menu is no longer clipped** (Change password / Update profile / Upload picture / Sign out were hidden under the card - an overflow bug, fixed in CSS). Teachers can also upload their **certificate signature from inside any course** (course ... menu -> "My certificate signature"); the CEO signature stays a one-time admin setting. Certificate kinds now include quests and webinars.

Migration: none. Deploy over v11 - databases, tracks, submissions, gems, hackathons and challenges carry forward; new collections (events, leads) are created automatically and existing students with emails are back-filled into the leads list.

**Note:** the course catalogue / quest tracks were NOT changed in v12 - the updated catalogue PDF still needs to be provided so the tracks and the open-first-modules split can be built from it.

---

# EchoLens LMS v11

## New in v11: Live classes with attendance, AI/plagiarism integrity checks, QR-verified certificates, pop quizzes, deadlines with late penalties, at-risk radar, full-screen multi-language compiler with datasets, student search + complete profiles

**Live classes run inside the portal (no Zoom/Meet links).** Course staff press *Start live class* in the new **Live** tab; every enrolled student is emailed and a Join button appears in their portal. The class runs in an embedded open-source meeting room (Jitsi) - camera, mic, screen share, chat - without leaving EchoLens. **Attendance is automatic:** joining marks a student present, a heartbeat counts their minutes, and every class produces a present/absent sheet. Students see their own attendance percentage; teachers see the live roster and per-class sheets.

**AI & plagiarism detection on every assignment.** From the new grading page, one click runs an integrity report with two independent signals: (1) *similarity vs classmates* - token 3-gram matching that survives variable renaming, run across every submission to the same problem; (2) *AI-generated likelihood* - a model-based estimate with concrete indicators and a suggested viva question. Both are advisory drafts for the **teacher only**, never shown to students, never proof on their own.

**QR-verified certificates with one-click LinkedIn sharing.** Issue certificates per student or for the whole course (optionally only quest-completers) for courses, hackathons, or competitions. Each certificate carries the official academy name, the instructor's signature, the CEO's signature, the completion date, a unique serial, and a QR code that opens a public verification page - scan it and the server confirms it is genuine. Students get a *Print / Save as PDF* button and an *Add to LinkedIn* button that pre-fills LinkedIn's certification form. Admin sets the organisation name, CEO name and CEO signature once (People -> Certificate settings); instructors upload their signature from Profile -> ... -> Certificate signature.

**Pop quizzes on a timer.** Teachers create quizzes any time (hand-written or AI-generated, always reviewed first) and open them for a short window - 5 minutes, 15, whatever - even mid-class. Students see the quiz **only while it is open**, with a live countdown; when the window closes it disappears until the teacher reopens it. Auto-scored, gems awarded instantly, answers never leave the server. Teachers can optionally include a **practice IDE terminal inside the quiz** - a scratchpad where students run Python beside the questions ("what does this code print?").

**Deadlines with a late-work rule, stated on every task.** Installing a track sets each level's deadline to the end of its week (from the course start date); instructors change any deadline in one click. Students can still submit late, but late work loses **20% of its earned gems** - the rule is printed on every assignment card and in the task portal, and late submissions are flagged to the teacher.

**At-risk radar.** A dedicated course tab lists every student with attendance %, tasks submitted, and average grade, and flags exactly *why* someone is at risk (low attendance, missing work, low grades, gone quiet). Two or more flags = high risk, sorted to the top.

**Written (logic) assignments.** Teachers can add written problems to any level - the student explains the reasoning in words (typed, or uploaded as PDF/Word/text) instead of writing code. Courses that don't need a compiler at all (UI/UX, graphic design, WordPress, no-code automation, prompting) hide it automatically - every task gets a clean written-answer workspace instead - and teachers can toggle the compiler per course from the Quest tab.

**The compiler grew up.** Full-screen workspace (sidebar untouched) with a Focus mode that hides the brief; language picker with **Python and HTML/CSS/JS** (live web preview with console output); and **datasets attached to tasks** - a teacher uploads `sales.csv` once, and it is mounted into every student's Python filesystem automatically, so `pd.read_csv('sales.csv')` just works. Students can copy the file path in one click.

**Grading in its own tab.** The Grade button opens a dedicated page: brief + solution guideline, the student's runnable code (with the task's datasets mounted), AI review, integrity check, and the grade form side by side. Grades appear on the quest board immediately with clear chips: *Graded 85%*, *Submitted - not graded yet*, *Not submitted*.

**Find any student in seconds.** Admins and coordinators search everyone; teachers search their own students - by registration number or name. The result opens a complete profile: photo, personal details, every enrolled course with level, gems, submissions, average grade and attendance, plus certificates, badges and streaks. Course People tabs get their own search box too.

**Profiles are institute-grade.** Students and staff can record phone, CNIC/B-form, father/guardian name, DOB, address, emergency contact, education (and for staff: designation, qualification, expertise, joining date). Everyone can **upload a profile picture** - it shows in the top bar, chat and profiles. The profile page now has a **... menu** (top right) with Change password, Update profile, Upload picture, Certificate signature (teachers) and Sign out, keeping the page itself clean for the stage analytics.

**Chat with @tags, without message deletion.** Students tag their teacher and teachers tag any student with an @-autocomplete; tagged people are highlighted and emailed. Students can no longer delete messages - conversations are permanent, with moderation reserved for course staff.

---

# (v10 notes)

## New in v10: Professional compiler with a real terminal, full-page task workspace, anonymous course chat, email everywhere, public landing site with open quests

**The compiler is now a complete environment.** The v9 stdin-box design (which broke `input()` and confused students) is gone. In its place:
- **Interactive `input()`** - the program's prompt appears in the terminal, an input field opens right there, the student types and presses Enter, and the program continues. Exactly like a real terminal.
- **Scientific stack built in** - `numpy`, `pandas`, `matplotlib`, `scikit-learn` (and any other Pyodide package) load automatically from the imports in the code. No setup.
- **Charts render on screen** - matplotlib figures appear as images below the terminal output.
- **Live streamed output** - print() output appears as it happens, not all at the end. Python tracebacks are shown cleanly (internal Pyodide frames stripped) so students see *their* error.
- **Safe by construction** - still Pyodide in a Web Worker: zero server load, and a stuck loop is killed by a dual watchdog (45s silence / 4min hard cap, package downloads don't false-trigger). Stop button any time.
- How interactive input works without special headers: when input() needs an answer, the run pauses, the student answers in the terminal, and the program transparently re-runs with the answer queued - already-seen output is suppressed, so it looks and feels like a simple continuation.

**Tasks are a full page now, not a popup.** Opening a task lands on a dedicated workspace: assignment brief, resources, and status on the left; a professional IDE on the right - toolbar (language, Run/Stop, Clear), dark editor with Python auto-indent and Tab support, status bar, terminal, and the submit bar. File upload (PDF/Word) remains as a collapsible alternative for reports and notebooks. Teachers get the same terminal inside the grading modal to run student code interactively.

**Anonymous course chat.** Every course has a Chat tab. Students choose per message: post with their real name, or as their stable gem alias (e.g. "Opal-374" - same alias every time in that course, so conversations stay followable). Anonymity is absolute: the API never reveals who is behind an alias, not even to teachers, so shy students can finally ask. Teachers and admins always reply named with a role badge. Auto-refreshes every 12 seconds; teachers can moderate, students can delete their own messages.

**Email at every important moment** (works once SMTP is configured; silently logs otherwise):
- New student created with an email (add students as "Full Name, email") → credentials, username, password, and **registration number mailed automatically**
- Announcement posted → everyone on the course (as before)
- Quest track published → every enrolled student
- Student submits a task → the course teachers
- Teacher grades a task → the student (grade, gems, remarks)
- **Remind button** on every quest level (teachers) → emails exactly the students who haven't finished that level

**Public landing site with open quests.** Visiting the root URL now shows a proper website - what EchoLens is, every feature, the full course catalogue with PKR pricing, and a **free quest playground**: anyone can pick any of the 16 tracks and complete the first 3 levels in the real browser compiler, no account needed. Levels 4+ show locked with a "Register to unlock" call-to-action (registration/payment stays the academy's manual flow: pay via JazzCash/Easypaisa/bank, admin creates the account, credentials arrive by email). Sign in sits in the top corner and leads to /login; signed-in visitors see "Open dashboard" instead. Solutions are never exposed publicly, and locked levels hide their problems entirely.

Migration: none. Deploy over v9 - databases, tracks, submissions, gems, reviews all carry forward. New env: set the SMTP_* variables to activate email.

---

## New in v9: Built-in code compiler, assignments merged into quests, AI review sharing, overall reports

**The quest IS the assignment system now.** The separate Assignments tab, creation form, and routes are gone - quests replace them completely. Legacy assignment data stays in the database (all gems and history preserved), it just isn't surfaced anymore.

**Clean task portal.** Each quest problem now shows as a simple topic heading (title, difficulty, gems, status). Tapping it opens the task portal: the full assignment detail (brief, resources, teacher-only solution guideline) plus the submission portal - everything in one place.

**Built-in Python compiler.** Inside every task, students write code in a dark-themed editor, press Run, and see the output instantly - no more exporting Word/PDF documents for coding work. Direct submit sends exactly what's in the editor.
- Runs on **Pyodide inside a Web Worker**: entirely in the browser, zero server load (safe on Render Starter), and an infinite loop can never freeze the page - it's terminated at the 25s timeout with a friendly message.
- Lazy-loaded (~7 MB) only when Run is first pressed - page loads stay fast on slow connections.
- Supports `input()` via an optional stdin box; a "Written answer" mode for non-code tasks; Tab key indents.
- **File upload stays available** as a second mode for reports, screenshots, and notebook exports (PDF/Word only, enforced server-side as before).
- Teachers see the submitted code right in the grading modal, with their own Run and Copy buttons.

**AI review sharing - teacher permission only.** After running an AI review, the teacher gets a "Share key points with student" toggle. The student then sees the key concepts, mistakes, and better approach on their task - **never the suggested score**. Fresh reviews start unshared; resubmitting clears the old review automatically. Students can never access the raw review through the API.

**Complete reviews at three levels:**
- **Per task**: the AI review on each submission (as before, now code-aware - editor submissions are read directly, no text extraction needed).
- **Per course**: the skill report, now built from quest data (per-problem grades, teacher remarks, and AI review notes).
- **Overall, across all courses**: new "Overall" button in the Report tab generates one review covering every course the student has taken - progress comparison, strengths, direction. Teacher-reviewed before publishing, appears on the student's profile as "Across all courses".

**AI provider fix.** The "billing/quota" errors are gone: default model updated to gemini-2.5-flash-lite, quota errors translated into plain English, and **automatic fallback** - set both GEMINI_API_KEY and GROQ_API_KEY and the app switches providers silently when one runs out of quota.

**Also**: the Report tab now shows quest levels reached and quest-based at-risk detection (unsubmitted problems in unlocked levels); teacher pending-count and admin stats count quest submissions; badges and course-completion are quest-aware; gems_possible counts quest points.

Migration: none needed. Deploy over v8 - existing databases, tracks, submissions, and gems all carry forward untouched.

---

## New in v8: Full course catalogue, 16 prebuilt tracks, AI review layer

**Official catalogue built in.** All 21 courses from the August 2026 catalogue (bootcamps, short courses, specialist tracks, career tracks) with codes, tiers, durations, and PKR fees. Fresh installs get them seeded; existing deployments: Catalogue -> "Load official catalogue" (adds missing codes only, touches nothing else). Workflow is now: start a batch -> enroll students -> assign teachers -> install a quest track -> teacher uploads slides per week. Done.

**16 prebuilt quest tracks** - one for every bootcamp (4 levels), short course (6-12 levels), and 2-month specialist track (5 milestone levels). Every problem includes: a real-world scenario, an explicit "Course link: Week X - topic" line, student reference links (official docs, datasets, guides), and a **solution guideline visible only to teachers and admins** (grading criteria + common mistakes). Tracks are course-agnostic: install any track on any batch, now or in future courses.

**Teacher editing.** Teachers can edit any problem on their course - title, description, points, difficulty, reference links, and the solution guideline - without gating. Admin and teachers see every level unlocked; students remain hard-gated server-side.

**PDF/Word-only submissions.** Students can submit only .pdf/.doc/.docx (enforced server-side, not just in the file picker) - which makes every submission machine-readable for the AI layer.

**AI review layer.** On any submission, staff click "AI Review": the text is extracted from the PDF/Word file and the AI produces - question summary, what the student did, key concepts grasped, mistakes, a better approach, and a suggested score (informed by the private solution guideline). Cached per submission, regenerable. **The instructor always sets the final score** - which then converts to gems, level clearance, titles, stages, and leaderboards automatically, as before.

**Also**: 3D scoreboard podium for the top 3, the real EchoLens logo included, and env needs no changes (pdf-parse and mammoth install with npm install).

---


## New in v7: Quest system (prebuilt gamified assignments) + full-app 3D depth

**The Python Quest** - a prebuilt, gamified assignment ladder for "Python for Programming" (6 weeks, 12 sessions): 12 levels, 27 problems from Basic to Boss, covering Python foundations -> control flow -> data structures -> functions & files -> NumPy (x2) -> Pandas (x2) -> Matplotlib -> ML concepts -> train/test split & regression -> a capstone project.

- **Install in one click**: open a course -> Quest tab -> Install. (Admin or an assigned teacher.)
- **Hard level gating, enforced server-side**: a student cannot even submit to a locked level. A level passes when the instructor has graded every problem in it and the average reaches the pass mark (60%). Only then does the next level unlock.
- **Instructor-graded, always**: same grading flow as assignments, including "Draft with AI" (draft only - the teacher publishes).
- **Track titles**: Code Cadet -> Loop Ranger -> Data Wrangler -> Chart Crafter -> Model Maker -> ML Pathfinder, earned by cumulative track gems. Shown on the quest banner and scoreboard.
- **Quest map**: a game-style vertical path with spinning gem nodes - grey+lock (locked), pulsing gradient (current), teal (passed). The current level auto-expands.
- **Scoreboard**: per-course ranking by track gems and level reached, with each student's title and streak; your own row is highlighted.
- Quest gems count toward global gems, stages, and all leaderboards.
- Adding future tracks = dropping one content file into `tracks/` and registering it in store.js. No other code changes.

**3D across the whole app**: interactive pointer tilt on cards (courses, stats, prism, quest levels), a perspective depth layer, and CSS-3D spinning gems on the quest map - alongside the existing WebGL gems (login field, Progress Prism, public profile). Skips touch devices and reduced-motion users automatically. Data tables and forms deliberately stay flat: readability beats spectacle where people work.

---


## New in v6: Hackathons, payments, intelligence layer, backups

**Hackathons** (Hackathons in the sidebar - open to free-tier users and students)
- Time-boxed events with a start and end; submissions only accepted while live.
- Solo or team mode (teammates added by reg no, up to a set size); free or **paid entry**: paid events show your payment instructions (JazzCash / Easypaisa / bank), collect a transaction reference at registration, and block submissions until the admin confirms the payment.
- Admin judging: score each submission 0-100; live event leaderboard; **Finalize** awards prize gems to every member of the top three teams (source: hackathon).

**Intelligence layer** (teachers/admins; needs the AI key from v5)
- **AI skill reports** - one click per student in the course Report tab: generates a draft (Strengths / Areas to improve / Recommended focus domain / Next steps) from their real grades, remarks, and activity. The teacher reviews and publishes; published reports appear on the student's Profile. Drafts can be discarded. Student names are never sent to the AI provider.
- **AI class summary** - anonymised class-level analysis with concrete teaching actions for next week.
- **At-risk detection** (no AI needed) - the Report tab flags students with 2+ missing past-due assignments or 7+ days of inactivity, with the reason shown.

**Backups**
- The database is copied to `backups/` next to the database file on boot and every 12 hours; the last 20 copies are kept.
- Admin overview has a **Download backup** button - pull a copy off the server weekly. Off-server copies are the ones that save you.

---


## New in v5: AI Copilot + Free Tier

**Teacher AI Copilot** (teachers and admins only - students never see or touch AI)
- **AI grading drafts.** Inside any grading modal: "Draft with AI" reads the submission (text-based files are read in full; PDFs/images fall back to the brief and note), proposes a grade, student remarks, and a teacher-only rationale. You edit and publish - the AI never awards gems itself.
- **Quiz generator.** Topic + optional pasted lesson content -> ready multiple-choice quiz with answer key.
- **Course outline drafts.** Topic + weeks -> week-by-week curriculum with exercises and assignment ideas.
- **Teaching chat.** A copilot for lesson planning, explanations, and examples.
- Runs on **free-tier models**: Gemini (default, key from aistudio.google.com) or Groq (console.groq.com). Swap providers or move to paid models later with one env var - no code changes. Per-teacher hourly rate limit protects free quotas. Student names and emails are never sent to providers.

Env: `GEMINI_API_KEY=...` (or `AI_PROVIDER=groq` + `GROQ_API_KEY=...`), optional `AI_MODEL`, `AI_HOURLY_LIMIT` (default 30/user/hour). Unset = copilot hidden, everything else works.

**Free tier with Google sign-in**
- "Continue with Google" on the login page creates a free account: challenges, community leaderboard, gems, streaks, stages, badges, and a shareable public profile - but no courses, schedule, or portal content. The funnel: taste the progression, then upgrade to the paid portal.
- If a Google email matches an existing portal account, Google is linked to it instead of creating a duplicate.
- **Challenges.** Admin publishes open challenges (title, rules, difficulty, gem reward, optional deadline). Free users and students submit a public link (GitHub/Colab/Drive); admin reviews and approves - gems are awarded on approval, badges at 1 and 5 solved challenges. Rejected submissions can be resubmitted.

Env: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `APP_URL` (e.g. https://lms.echolens.digital). In Google Cloud console (APIs & Services -> Credentials -> OAuth client, type Web), add `<APP_URL>/auth/google/callback` as an authorized redirect URI. Unset = the Google button stays hidden.

---


A company-managed, gamified learning portal. Sign-in only; everything is organised around courses. Built with Node.js and Express, file-backed database, no build step.

## What's new in v4

**Requested fixes**
- **Admin password reset.** People > Reset password sets or generates a new password without touching the account - gems, streaks, enrollments, and submissions all stay. No more recreating accounts.
- **Registration numbers.** Every student gets a unique 6-7 digit reg no, never reused. Students can sign in with it, admins search by it, and it powers the public profile link.
- **Multi-course enrollment.** One student, many courses. Add existing students to any course by reg no or username (course > Manage > Add students > "Existing students").
- **Multiple teachers per course.** Assign as many teachers as needed; each sees the course in their dashboard with full teaching tools.
- **Coordinator role.** A view-only account that sees every course, report, and leaderboard but cannot add, remove, grade, or change anything. Create one from People > Add a coordinator.

**Gamification 2.0**
- **Stages.** Six named stages - Spark, Glow, Beam, Prism, Aurora, Nova - earned by total gems. The student dashboard opens with the Progress Prism: current stage, progress bar to the next, gems, and streak.
- **Streaks.** Any activity on a day extends a student's daily streak. Milestones award bonus gems automatically: 3 days +15, 7 days +40, 14 days +90, 30 days +200.
- **Bonus gems.** Teachers award 1-200 gems for attendance, participation, or helping peers (course > Manage > Award bonus gems) - so gems come from more than grades.
- **Badges.** Stage badges, streak milestones, first submission, 90%+ scores, and course completion.
- **Leaderboards.** Global learner board, per-course board (its own tab inside every course), and a courses board.
- **Public profiles.** Every student has a shareable page at `/u/<reg_no>` showing their stage, gems, streaks, badges, and courses - built for LinkedIn and WhatsApp sharing. No sign-in needed to view; it never exposes usernames or emails.

**Design refresh.** New visual system: deep-ink sidebar, gem-gradient accents, stage colours, Fraunces + Inter typography, redesigned cards, tables, modals, and a dedicated People area.

## Upgrading from v3 - your data is safe

Deploy v4 over v3 and the existing `echolens.json` upgrades itself on first start:
- every student is assigned a registration number,
- each course's single teacher becomes the first entry in its teachers list,
- streak fields and the gem-events collection are added,
- **all existing users, gems, grades, submissions, and enrollments are preserved untouched.**

Before deploying, download a copy of your current `echolens.json` from the Render disk as a backup. The migration is safe, but a backup before any upgrade is non-negotiable practice.

Keep your existing `public/img/logo.png` - this package does not include the logo file.

## Roles

- **admin** - everything: catalogue, courses, accounts, resets, enrolment, plus all teaching tools.
- **teacher** (`instructor`) - manages the courses they are assigned to: classes, content, assignments, grading, announcements, gem awards.
- **coordinator** - sees everything (overview, People, reports, leaderboards); changes nothing.
- **student** - their courses, schedule, content, assignments, gems, stage, streaks, and public profile.

## Run it locally

Node.js 18+.

```bash
npm install
npm run seed      # creates the database and demo accounts
npm start         # http://localhost:3000
```

Demo accounts (change after first sign-in): `admin@` / `teacher@` / `coordinator@` / `student@` `echolens.digital`, all with password `ChangeMe!2026`.

## Deploying on Render

Same as v3: web service with `npm install` build and `npm start` start command, persistent disk mounted (e.g. at `/data`), and env vars `DB_PATH=/data/echolens.json`, `UPLOAD_DIR=/data/uploads`, a strong `JWT_SECRET`, `NODE_ENV=production`. Push this code to your GitHub repo and Render redeploys; the database migrates itself on boot. Remember: after running the seed on a fresh server, restart the service.

Optional email: set `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM` and announcements are emailed to everyone on the course.

## Project structure

```
echolens-lms/
  server.js              Express app: auth + API (v4)
  store.js               Data store, gamification engine, v3->v4 migration
  mailer.js              Email (console-logs until SMTP is configured)
  package.json
  public/
    login.html           Sign-in (username, email, or reg no)
    dashboard.html       App shell
    profile.html         Public shareable student profile
    css/styles.css       v4 design system
    js/login.js
    js/dashboard.js      All views and role logic
    img/logo.png         (keep your existing logo here)
```

## Security notes

Bcrypt-hashed passwords, HTTP-only signed cookies, server-side role and course-ownership checks on every protected route (coordinators are blocked from all writes), output escaping in the browser, authenticated file access, 50 MB upload limit. Set a strong `JWT_SECRET` and `NODE_ENV=production` in production.
