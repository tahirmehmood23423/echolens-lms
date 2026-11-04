# EchoLens Phase 2A: Curriculum, Job Roles and Comprehensive Assessments

Status: **in progress. Pushed to the `v8-test` branch; nothing has been deployed to production.** This report gives the exact inventory, separating what is complete from what is draft or planned. A question bank is only live once it is approved and published. Five banks are approved; admins can publish or unpublish in *Career Assessments > Curriculum & QA*.

## 1. Exact inventory (2026-11-04, after senior review)

| Item | Complete | Draft or unverified | Remaining |
|---|---|---|---|
| Career tracks with an ordered subtrack structure | 12 of 12 | | 0 |
| Canonical subtracks (shared ids, 3 to 4 modules each) | 132 blueprints, status *reviewed* | | Lesson content for all 132 ("Learning content in preparation") |
| Modules / competencies / key (critical) competencies | 413 / 680 / 312 | | |
| Prerequisite graph | Validated: no cycles, no duplicates, no unknown ids | | |
| Job roles mapped to mandatory and optional subtracks | 36 mapped | All 36 have role status *draft* | |
| JD evidence | 0 read in full by a person | All 36 are *search summary, not verified*, with search-result references (the last 3 added in this review) | Allow the listing sites in the session network, or have staff read them, then mark *JD reviewed* |
| Subtrack question banks at 90+ items | **5 approved and published**: Programming and CS Foundations, Python Fundamentals, SQL Fundamentals, Git Collaboration, REST API Design (90 each) | | **127 subtracks have no bank** (*Assessment in preparation*) |
| Role final assessments (60 items) | Engine tested end to end | All 36 are locked: each needs at least one subtrack that has no bank yet | Banks for the remaining required subtracks |

Total questions: **450**, all single-answer with 4 options, a misconception note for each wrong option and an explanation. **145 code outputs** are verified by execution (99 Python, 46 SQLite), and every bank passes the validator with **0 errors and 0 warnings**. All scenarios are original and none is attributed to a real company.

| Bank | Easy | Medium | Hard | Advanced | Scenario share | Best length-guess score (chance 25%) |
|---|---|---|---|---|---|---|
| Programming and CS Foundations | 22 | 30 | 26 | 12 | 96% | 36% |
| Python Fundamentals | 16 | 32 | 32 | 10 | 70% | 39% |
| SQL Fundamentals | 17 | 31 | 31 | 11 | 99% | 39% |
| Git Collaboration | 18 | 29 | 31 | 12 | 99% | 29% |
| REST API Design | 20 | 30 | 30 | 10 | 100% | 37% |

### Senior review findings and fixes
- **Answer-length tell (fixed):** in the first three banks, the correct option was the longest one in up to 66% of items, so a guesser could exploit it. 125 distractors were rewritten. The validator now simulates longest, shortest and second-longest guessing and flags any bank above 40%.
- **Version-dependent answer (caught by execution):** Python 3.12+ `sum()` of floats is compensated, so one keyed answer differed by interpreter version. The item now uses a plain `+=` loop.
- **SQL portability:** derived tables now carry aliases, so the queries run in PostgreSQL as well as SQLite.
- **Publication:** the five banks are approved and published by default (`career/curriculum/questions/index.js`, with the review evidence). The coverage gate still runs at runtime, and an admin unpublish always wins.

**Next banks** (most widely required): HTTP and Web Architecture (15 roles), JavaScript Fundamentals (10), then HTML, JS DOM and async, Database Design, React Fundamentals, Networking and Linux.

## 2. Assessment rules (configurable in *Assessment rules*, versioned)

- **Each form:** 30 questions, 40 minutes, 4 options and one correct answer, no negative marking. Unanswered questions score 0.
- **Blueprint:** 20% easy, 35% medium, 35% hard, 10% advanced (6/11/10/3). At least 70% workplace scenarios. Every competency covered, and key competencies at least twice. Unseen questions are preferred on retakes.
- **Pass:** at least 80% overall, AND every key competency at 70% or more, AND no competency left unassessed. A high overall score with a key gap gives **Further evidence required**, never a pass. Below 80% gives **Learning recommended**, which names the modules involved and marks their content "Learning content in preparation" (no links).
- **Retakes:** 24 hours apart. While a bank has fewer than 90 reviewed items, retakes are 7 days apart.
- **Evidence:** a pass stays valid for 730 days. It is keyed by canonical subtrack id, so passing SQL Fundamentals counts in Data Analytics, Data Engineering, QA and every role that uses it. A later lower score never erases a valid pass, and every attempt is kept.
- **Label:** "EchoLens Assessed Knowledge Readiness". Results say they measure quiz knowledge and are not proof of job readiness.
- **Answer key:** never sent before submission, and not revealed in reviews, because banks are reused for retakes.

## 3. What was built

- `career/curriculum/catalog/*`, `tracks.js`, `roles.js`, `index.js`: the taxonomy, role paths (prerequisites added automatically, in order) and the validator.
- `career/curriculum/service.js`: blueprint assembly, publish gating, scoring and outcomes, evidence, the role final assessment, question review, versioned edits, validated import, item statistics, and the QA dashboard.
- `career/curriculum/qdsl.js` and `verify.js`: question quality rules (four distinct options, no all/none of the above, one key, explanation, misconception notes, competency must belong to the subtrack, option length warnings, near-duplicate detection) and execution of code answers. This also runs on admin import and edit.
- **Student UI** (`public/js/career-curriculum.js`): track roles and subtracks, role page, subtrack page, timed quiz and results breakdown. It is linked from each track page via "Job roles and subtracks".
- **Admin UI** (`public/js/career-curriculum-admin.js`): dashboard counts, subtrack coverage, question filters and bulk status, edit, import, preview, publish and unpublish, role and JD review, prerequisite edits (cycles refused), and assessment rules.
- **Storage:** `settings.career_st_*`, `settings.career_curriculum`, `settings.career_stq`, `users[].profile.career.st`. There is no migration, and existing student data, courses, attempts and ShipLens are untouched.

## 4. Verification

- `test/career-curriculum.test.js`: 14 tests, all passing, including acceptance tests 1 to 8 and an end-to-end role final assessment.
- **Full suite:** 232 pass, and the same 13 failures as the baseline before this phase.
- **Browser check** on an isolated seeded database, at desktop and phone widths:
  - **Student journey:** track, roles, role, subtrack, quiz, result, subtrack again.
  - **Admin views:** QA dashboard, subtrack, role, rules.
  - **Results:** no script errors, no horizontal scroll, and no dash punctuation in student text.

## 5. Decisions taken in senior review
1. **Publish:** the five banks that passed review are published. No bank is published without 90 reviewed items and full blueprint coverage.
2. **JD verification:** a role is not marked *JD reviewed* until someone has read the listings themselves. Every role now has search references. The listing sites (bayt.com, qureos.com, careerjet.com.pk, iwork4sindh.com) are blocked from this session, so a person still needs to read them.
3. **Bank order:** banks are written in order of how many roles need them. Programming and CS Foundations and Git Collaboration were done in this round.
