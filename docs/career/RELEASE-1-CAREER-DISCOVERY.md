# EchoLens Career Tracks — Technical Audit and Release 1 (Welcome & Career Discovery)

Status: implemented on branch `v8-test`. **Not deployed.** Production deployment needs explicit approval.

---

## 1. Audit: what the repository already has

### Stack
| Area | What exists |
|---|---|
| Frontend | Multi-page static HTML/CSS/vanilla JS in `public/` (no SPA framework). `/career` is a server-rendered shell (`career/page.js`) with a hash-routed app (`public/js/career.js`). Student portal: `public/js/dashboard.js`. |
| Backend | Express (`server.js`). Career features live in `career/` and are mounted with `career/routes.js` → `/api/career/*`, `/api/admin/career/*`. |
| Data | `store.js`: JSON file, legacy JSONB or Prisma-normalised Postgres. Career data needs **no schema migration**: config, questions and tracks live in `settings.career_*`; student data in `users[].profile.career` (persisted by all three store modes). |
| Auth | JWT cookie (`currentUser`, `authRequired`, `adminRequired`), roles `free` / `student` (learners), staff roles. |
| Tests | `node --test` (`npm test`). 13 pre-existing failures unrelated to Career Tracks. |
| Staging/prod | Single Express app, `NODE_ENV`, `DATABASE_URL`, `JWT_SECRET`. No separate staging config in the repo. |

### Career Tracks features versus the master requirements
| Requirement | Status before Release 1 |
|---|---|
| 12 career tracks with 6-stage roadmaps | ✅ `career/tracks.js` (admin-editable text, status, skill weights) |
| Shared skill taxonomy (global skill ids, versioned) | ✅ `career/skills.js` — 85 skills; each maps only to real EchoLens modules; missing modules reported as content gaps |
| Quiz-only, auto-graded, server-side assessments | ✅ `career/engine.js` + `service.js` — MCQ only (typed and staff-reviewed items retired), answer keys never sent, randomised options, alternate forms, duplicate-submit protection, rate limits |
| Question banks with versions, draft/reviewed/published, history | ✅ 902 published MCQs (+32 discovery), edits create new unreviewed versions, attempts store question versions |
| Common CS assessment | ✅ 25 MCQs, but aimed at learners who already study CS — **too hard as a first-contact quiz** |
| Scoring: bands, per-skill and per-category scores, minimum evidence, critical prerequisites | ✅ configurable, versioned (`career_config`) |
| Skill-gap analysis + recommendations to real modules | ✅ |
| Multiple roadmaps (1 primary + up to 2 secondary), pause/resume/archive, evidence reuse with depth/version/recency rules | ✅ `career/roadmaps.js` |
| Admin: banks, question review, scoring, tracks, analytics | ✅ `public/js/career-admin.js` |
| Welcome / career-discovery journey | ❌ missing (only an optional preferences form) |
| Beginner discovery quiz | ❌ missing |
| Interest-based, explainable recommendations | ❌ missing |
| Guest (no-account) exploration with result saved on sign-in | ❌ missing (assessments required an account) |
| Job roles (36), JD references, role checklists | ❌ missing → Release 2 |
| Subskills, prerequisite graph, lesson hierarchy, topic quizzes, mastery checkpoints | ❌ missing → Releases 2–4 |
| Gamification for career learning | ⚠ EchoLens gems/streaks exist (`GemEvents`) but are not wired to career activity → Release 5 |

### Reused, not duplicated
Release 1 reuses the existing quiz engine (`assembleForm`, `publicQuestion`, `gradeResponse`), question-bank management (review/publish/versioning in the admin panel), the track catalogue, the roadmap enrolment rules, rate limiting, auth and the `/career` page shell.

---

## 2. Release 1 — what was built

**Student journey:** Welcome → five optional questions → beginner quiz (optional) → suggested tracks with reasons → choose **any** of the 12 tracks → roadmap.

### Welcome (`#discover`)
- "Discover What You Can Become." — supporting message, beginner assurance, 3-step indicator, **Start Exploring**, **Skip for now**, lightweight SVG illustration with subtle animation (disabled under `prefers-reduced-motion`).
- Opens automatically **once**, only for people with no career activity (no preferences, attempts or roadmaps) who have not skipped it. Existing students are never pushed into it; they launch it from the **Discover** tab, the dashboard card ("Career Discovery"), the empty roadmap screen or the home page.
- Guests explore without an account; progress is kept in the browser and attached to the account after sign-in. Partially completed onboarding resumes ("Continue where I left off"), including an unfinished quiz.

### Onboarding questions (`#discover/about/1..5`)
Exactly the five questions in the brief (interests, programming experience, technologies, goal, enjoyment), multiple choice, every one skippable; "Not sure yet"/"None yet" are exclusive. Experience is labelled self-reported and never used as proficiency. Stored in `profile.career.discovery.answers`.

### Discovery quiz (`#discover/quiz`)
- New bank `career/banks/discovery.js`: **32 MCQs**, 4 in each of 8 areas — how computers work, programming logic, variables and data types, conditions and loops, algorithms, working with data, internet and web, how software is built.
- Each quiz: **12 questions, ~6 minutes**, every area covered, retakes prefer unseen questions. Concept, predict-the-output, find-the-error and scenario MCQs; every technical word is explained in the question; syntax-highlighted snippets; skip any question; no negative marking; skipped ≠ wrong.
- After submitting: per-area feedback in positive language ("New to you — a great place to start"), links to real free EchoLens lessons for areas to work on, and a review of every question with the correct answer and explanation.
- **Screening only:** the result is stored under `career.discovery.quiz`, never as an assessment attempt, so it never becomes verified skill evidence and never affects roadmap readiness.

### Recommendations (`career/discovery.js`)
- Transparent rule table: each answer option (and each strongly answered quiz area) lists the tracks it adds points to; every rule that fires becomes a sentence ("Recommended because you're interested in artificial intelligence and working with data.").
- **Rules only add points.** A low quiz score or no prior programming never lowers or hides a track (tested: no Python + low quiz still recommends AI/ML first when that is the interest). The quiz changes the *starting point* text ("Start from the very beginning with Python for AI… no experience needed"), drawn from each track's real first-stage skills.
- "Not sure yet" → beginner-friendly tracks. Top 3 shown, plus all 12 tracks with **Choose this track**; choosing a non-suggested track is accepted and recorded (`chosen_recommended: false`) for analytics.
- Configuration is versioned and editable: Admin → Career Assessments → **Career Discovery** (JSON rules, validated against real option ids and track slugs; reset to defaults; usage analytics incl. override rate).

### Feature flag
`settings.career_discovery_config.enabled` (default on). Off → APIs return 404, the welcome never auto-opens, the Discover tab shows a short notice. Toggle in the admin tab.

---

## 3. Files

Created
- `career/discovery.js` — questions, rule-based recommender, config validation
- `career/banks/discovery.js` — 32 discovery MCQs
- `public/js/career-discovery.js` — welcome, questions, quiz, results views
- `test/career-discovery.test.js` — 9 tests
- `docs/career/RELEASE-1-CAREER-DISCOVERY.md` — this document

Modified
- `career/service.js` — discovery service (signed tokens, state, quiz, claim, analytics, config)
- `career/routes.js` — discovery endpoints; optional (guest) user
- `career/skills.js` — 8 `Discovery` areas mapped to existing free lessons
- `career/banks/index.js` — registers the discovery bank
- `career/page.js` — loads `career-discovery.js`
- `public/js/career.js` — Discover tab, routing, auto-open rule, empty-state link
- `public/js/career-admin.js` — Career Discovery admin tab
- `public/js/dashboard.js` — dashboard card link
- `public/css/career.css` — discovery styles
- `public/landing.html` — "Discover your career" link under Test Your Skills
- `server.js` — passes `optionalUser` and the signing secret to the career routes

### Database migrations
None. New data lives in existing JSON fields: `users[].profile.career.discovery` and `settings.career_discovery_config`. Nothing existing is altered or deleted.

### APIs
| Method & path | Access | Purpose |
|---|---|---|
| `GET /api/career/discovery` | public | questions, tracks, quiz availability, flag; learner state when signed in |
| `POST /api/career/discovery/quiz` | public (rate-limited) | start a quiz: 12 public questions + signed form token |
| `POST /api/career/discovery/quiz/resume` | public | rebuild questions from a form token |
| `POST /api/career/discovery/quiz/submit` | public (rate-limited) | grade on the server; result, review, recommendations, signed result token |
| `POST /api/career/discovery/recommendations` | public | suggestions from answers (+ signed result) or the learner's saved data |
| `PUT /api/career/me/discovery` | learner | save answers/step, dismiss, completed, chosen track |
| `POST /api/career/me/discovery/claim` | learner | attach a guest's answers and signed result after sign-in |
| `GET/PUT /api/admin/career/discovery`, `POST …/reset` | admin | rules, flag, analytics (audit-logged) |

Security: form and result tokens are HMAC-SHA256 signed (`JWT_SECRET`, domain-separated), expire (3 h / 60 days), are bound to the learner who started them, and are verified in constant time; forged or stale tokens are rejected. Answer keys and explanations are never sent before submission. Re-submitting the same form returns the stored result.

---

## 4. Tests

`node --test test/career-discovery.test.js` → 9/9 pass. Full suite: 217 pass, 13 fail — the same 13 failures as before this work.

Covered: quiz shape and key protection; Scenario 1 (complete beginner as guest, skips, no penalty, foundation-first suggestions, real lesson links, nothing stored for guests); forged/foreign/expired tokens; learner save/resume, duplicate submit, result kept out of the skill profile, unseen questions on retake; additive transparent recommendations (beginner can be recommended AI/ML); Scenario 5 (recommended Frontend, chooses Cybersecurity, gets that roadmap; override recorded); guest result claimed after sign-in without overwriting a newer result; Scenario 8 (existing student keeps data, not pushed into the welcome); admin rule validation, versioning, feature flag.

Browser check (Playwright, desktop 1280 px and phone 390 px): full guest journey → choose a non-suggested track → sign in → roadmap created as Primary and the guest result attached; signed-in revisit does not re-open the welcome; no page errors, no horizontal overflow on phone.

### Manual test
1. Start the app with an isolated DB (see `.claude/skills/run-echolens-lms`), open `/career` in a private window → the welcome opens.
2. Start Exploring → answer or skip the five questions → take the quiz (skip a few) → results: area feedback, answer review, 3 suggestions with reasons, all 12 tracks.
3. Choose a track that was **not** suggested → sign in as `student@echolens.digital` → you land on My Roadmaps with that track as Primary.
4. Open `/career` again → you go to the tracks list, not the welcome. Use the **Discover** tab to restart.
5. Admin (`admin@echolens.digital`) → Career Assessments → Career Discovery: edit a rule, save, re-check suggestions; untick **Enabled** to switch the feature off.

### Rollback
Code-only change: revert the Release 1 commit. Stored `profile.career.discovery` and `settings.career_discovery_config` are ignored by older code, so no data clean-up is needed; switching the flag off hides the feature without a redeploy.

---

## 5. Proposed architecture for later releases

The existing JSON-document approach (versioned records in `settings`, per-student records in `profile.career`) has carried Releases 0–1 without migrations. Job roles, subskills and lessons are larger, admin-authored, relational content, so from Release 2 they should get **Prisma tables** (behind the existing `schema.prisma` migration flow), while student evidence keeps its current shape.

| Requested entity | Where it lives today / planned |
|---|---|
| CareerTrack | `career/tracks.js` + `settings.career_tracks` (admin edits) — exists |
| JobRole, JobRoleRequirement, JobDescriptionReference | **Release 2** new tables: role → required/preferred skill ids with required depth; JD references with source URL, retrieval date, role-profile version, review status |
| Skill, Subskill, SkillPrerequisite | `career/skills.js` (global ids, versions) — exists; **Release 2** adds subskill rows and a prerequisite edge table |
| CareerCurriculum, CurriculumStage, LearningModule, Lesson, LessonResource | Track stages exist; modules map to existing course levels. **Release 4** adds lesson records with review status (draft/reviewed/published) |
| Assessment, AssessmentBlueprint | `assessmentDef` (plans per skill) — exists; Release 3 makes blueprints admin-editable per role/skill |
| AssessmentQuestion, QuestionOption, QuestionSkillMapping | question banks + `settings.career_questions` (status, edits, versions, history) — exists |
| AssessmentAttempt, AssessmentResponse | `profile.career.attempts[].result.responses` (question version, config version) — exists |
| SkillEvidence, StudentSkillProfile, SkillGap | `E.skillProfile` + `roadmaps.skillRecord` (proficiency, evidence type, version, coverage, verification) — exists |
| StudentCareerPreference, CareerRecommendation | `profile.career.discovery` (answers, quiz, chosen track, config version) — **Release 1** |
| RoadmapEnrollment, RoadmapProgress | `profile.career.enrollments` — exists |
| LearningProgress | course progress via `open_submissions` — exists; lesson-level progress in Release 4 |
| SkillRecommendation | computed per request (`skillGaps`) — exists |

Rules carried forward: publishing a role or skill pathway requires reviewed lessons and adequate published question coverage (the existing coverage check is the model); role readiness stays a *knowledge* indicator; discovery results never count as evidence.

---

## 6. Remaining work (honest gaps)

- **Release 2 — job roles:** the 36-role catalogue needs real, reviewed job-description references. None are bundled; role profiles must be created as **drafts marked "requires review"** until sources are attached. Not started.
- **Release 3 — skill quizzes:** diagnostic vs mastery checkpoint split and subskill-level scoring are not implemented (today: track assessments + per-skill reassessments).
- **Release 4 — pilot curriculum (Junior Python Backend Developer):** lesson hierarchy and topic quizzes do not exist yet. Existing EchoLens courses cover parts (Python, SQL, HTTP); FastAPI-specific lessons are a content gap.
- **Release 5:** gems/achievements for career learning, "Continue learning", upcoming quizzes.
- Discovery quiz questions: **finalised** in a subject-specialist review (2026-11-04). Every item has one defensible answer; joke distractors were replaced with real beginner misconceptions (for example "https means the site is honest", "a list of ingredients is an algorithm", "5 > 3 so the AND statement is true"); all code outputs were verified by running them. Admins can still retire or edit any item in Admin → Question banks → *Career Discovery quiz* (edits become new, unpublished versions).
- The recommendation weights are defaults, not calibrated; review them with pilot data (the admin analytics show the override rate).
