# EchoLens Phase 2A: Curriculum, Job Roles and Comprehensive Assessments

Status: **in progress, staging only. Nothing has been deployed.** This report gives the exact inventory, separating what is complete from what is draft or planned. A generated or reviewed question bank is **not** a published assessment. Students only see an assessment after an admin publishes it in *Career Assessments > Curriculum & QA*.

## 1. Exact inventory (2026-11-04)

| Item | Complete | Draft or unverified | Remaining |
|---|---|---|---|
| Career tracks with an ordered subtrack structure | 12 of 12 | | 0 |
| Canonical subtracks (shared ids, 3 to 4 modules each) | 132 blueprints, status *reviewed* | | Lesson content for all 132 ("Learning content in preparation") |
| Modules / competencies / key (critical) competencies | 413 / 680 / 312 | | |
| Prerequisite graph | Validated: no cycles, no duplicates, no unknown ids | | |
| Job roles mapped to mandatory and optional subtracks | 36 mapped | All 36 have role status *draft* | Human review of each role |
| JD evidence | 0 human-verified | 33 *search summary, not verified*; 3 *JD verification required* (Android Developer, React Native Developer, Junior Security Engineer) | Admin reads current listings and marks *JD reviewed* |
| Subtrack question banks at 90+ reviewed items | **3**: Python Fundamentals (90), SQL Fundamentals (90), REST API Design and Integration (90) | | **129 subtracks have no bank** (status *Assessment in preparation*) |
| Published subtrack assessments | 0 in production | The 3 banks above are *ready to publish* | Admin publish decision, after this staging review |
| Role final assessments (60 items) | Engine built and tested | All 36 show *blueprint*: they open only when every required subtrack is published | Banks for every required subtrack |

Total questions written: **270**. All are single-answer MCQs with 4 options, a misconception note for each wrong option, and an explanation. 107 code-output items are verified by running them (61 in Python, 46 in SQLite), and every bank passes the validator with **0 errors and 0 warnings**.

| Bank | Easy | Medium | Hard | Advanced | Scenario share | Items per competency |
|---|---|---|---|---|---|---|
| Python Fundamentals | 16 | 32 | 32 | 10 | 70% | 5 to 10 |
| SQL Fundamentals | 17 | 31 | 31 | 11 | 99% | 10 |
| REST API Design | 20 | 30 | 30 | 10 | 100% | 9 |

Every scenario is original and is not attributed to a real company.

**Next banks to write** (most widely required first): Programming and CS Foundations (needed by 30 roles), Git Collaboration (26), HTTP and Web Architecture (15), JavaScript Fundamentals (10), then HTML, JS DOM and async, Database Design, React Fundamentals, Networking and Linux.

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

- `test/career-curriculum.test.js`: 13 tests, all passing, including acceptance tests 1 to 8.
- **Full suite:** 231 pass, and the same 13 failures as the baseline before this phase.
- **Browser check** on an isolated seeded database, at desktop and phone widths:
  - **Student journey:** track, roles, role, subtrack, quiz, result, subtrack again.
  - **Admin views:** QA dashboard, subtrack, role, rules.
  - **Results:** no script errors, no horizontal scroll, and no dash punctuation in student text.

## 5. Decisions needed from EchoLens before production

1. Review and approve publishing the 3 ready assessments.
2. Assign a person to verify JD references for the 36 roles. Three have no usable references yet.
3. Confirm the next bank batch and its order.
