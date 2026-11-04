'use strict';
/** Software QA & Test Automation Engineer track. */
const { mc, out, written, submission } = require('../q');

module.exports = [
  // ---- Testing principles ----
  mc('qa-pr-01', 'qa.principles', 1, 'What is the difference between verification and validation?', ['Verification checks the product is built right (meets the spec); validation checks it is the right product for users', 'They mean the same thing', 'Verification is done only by users', 'Validation means fixing bugs'], 0,
    'Verification asks "did we build it correctly?"; validation asks "did we build the correct thing?".'),
  mc('qa-pr-02', 'qa.principles', 2, 'Why can testing never prove that software has no bugs?', ['Testing can show bugs exist, but there are far too many inputs and paths to test them all', 'Testers are not careful enough', 'Bugs disappear after testing', 'Only users find bugs'], 0,
    'Exhaustive testing is impossible for non-trivial software, so testers choose cases that are most likely to reveal defects.'),
  mc('qa-pr-p1', 'qa.principles', 2, 'A release passed every test, yet users immediately hit a crash on the payment page. The tests only covered the login and course pages. What principle was missed?',
    ['Risk-based testing: test the most critical and most-used flows (such as payment) first', 'Testing everything equally is always enough', 'Payment pages cannot be tested', 'More tests on login'], 0,
    'Limited test time should go first to the areas where failures hurt most.', { practical: true }),
  mc('qa-pr-s1', 'qa.principles', 3, 'You have one day to test a release before an exam-registration deadline. How do you plan?',
    ['Prioritise the registration and payment flows and recent changes, run a smoke test of the rest, and report remaining risk clearly', 'Test every page in alphabetical order', 'Skip testing and release', 'Only test the design'], 0,
    'When time is short, focus on critical paths and changed areas, and be explicit about what was not tested.', { type: 'scenario' }),

  // ---- Test case design ----
  mc('qa-td-01', 'qa.test_design', 1, 'What is boundary-value analysis?', ['Testing values at, just below and just above the edges of valid ranges', 'Testing only the middle of a range', 'Testing random values', 'Testing the user interface colours'], 0,
    'Defects cluster at boundaries such as off-by-one errors, so edges get dedicated tests.'),
  mc('qa-td-02', 'qa.test_design', 2, 'An age field accepts 18 to 60. Which set of values best tests the boundaries?', ['17, 18, 60, 61', '20, 30, 40', '18 only', '-1000 and 1000'], 0,
    'Each boundary is tested on both sides: 17 and 61 must be rejected, 18 and 60 accepted.'),
  mc('qa-td-p1', 'qa.test_design', 2, 'A discount applies when the cart total is Rs 2,000 or more. The test cases are 1,000, 3,000 and 5,000. Which important case is missing?',
    ['Exactly 2,000 (and 1,999)', '10,000', 'Negative 5,000', 'Nothing is missing'], 0,
    'The rule changes at 2,000, so values at and just below that boundary catch mistakes like > instead of >=.', { practical: true }),
  mc('qa-td-s1', 'qa.test_design', 3, 'A login form has email, password and "remember me". You can write only five test cases. Which set gives the best coverage?',
    ['Valid login; wrong password; unknown email; empty fields; "remember me" keeps you signed in after restarting the browser', 'Five valid logins with different emails', 'Five tests of the page colours', 'Five tests of the forgot-password link only'], 0,
    'Cover the main success path, the main failure paths, input validation and the extra feature - not repeats of one case.', { type: 'scenario' }),

  // ---- Bug reporting ----
  mc('qa-br-01', 'qa.bug_reports', 1, 'What should every bug report include?', ['Steps to reproduce, expected result, actual result and the environment', 'Only a title', 'The tester\'s opinion of the developer', 'A request to fix it today'], 0,
    'A developer must be able to reproduce the bug and see exactly how actual behaviour differs from expected.'),
  mc('qa-br-02', 'qa.bug_reports', 2, 'What is the difference between severity and priority?', ['Severity is how much damage the bug does; priority is how soon it should be fixed', 'They are the same', 'Severity is decided by users only', 'Priority is the number of testers'], 0,
    'A typo on the home page may be low severity but high priority; a crash in a rare admin tool may be high severity but lower priority.'),
  mc('qa-br-p1', 'qa.bug_reports', 2, 'Which bug report title is most useful?', ['"Checkout: Pay button does nothing for cart totals over Rs 99,999 (Chrome 129, Android)"', '"Payment broken!!!"', '"Bug"', '"Please check the app"'], 0,
    'A good title names the area, the behaviour and the condition, so it can be triaged without opening the report.', { practical: true }),
  mc('qa-br-s1', 'qa.bug_reports', 3, 'You found a bug but cannot reproduce it reliably - it happens about one time in ten. What do you do?',
    ['Report it with everything you know (frequency, steps tried, logs, screenshots, environment) and mark it intermittent', 'Do not report it', 'Report it as always failing', 'Wait until it happens ten times in a row'], 0,
    'Intermittent bugs are real; details and logs help developers find timing or data-dependent causes.', { type: 'scenario' }),

  // ---- API testing ----
  mc('qa-ap-01', 'qa.api_testing', 1, 'In API testing, what should you check besides the status code?', ['The response body, headers and error messages', 'Only the status code', 'The font of the response', 'Nothing else'], 0,
    'A 200 response with the wrong data is still a bug; check the content and contract too.'),
  mc('qa-ap-02', 'qa.api_testing', 2, 'Which is a negative API test?', ['Sending a request with a missing required field and expecting 400 with a clear error', 'Sending a valid request and expecting 200', 'Reading the API docs', 'Measuring the server temperature'], 0,
    'Negative tests check that invalid input is rejected safely and clearly.'),
  mc('qa-ap-p1', 'qa.api_testing', 2, 'In a Playwright API test, which assertion correctly checks that creating a course returns 201 with the course title?',
    ["expect(res.status()).toBe(201);\nexpect((await res.json()).title).toBe('Python 101');", "expect(res).toBeTruthy();", "console.log(res.status());", "expect(201).toBe(201);"], 0,
    'Assert on the real response values; logging or asserting constants does not test anything.',
    { practical: true, code: "const res = await request.post('/api/courses', { data: { title: 'Python 101' } });" }),
  mc('qa-ap-s1', 'qa.api_testing', 3, 'The mobile and web apps both use the same API. Which testing approach catches API problems before either app breaks?',
    ['Automated API tests (including contract checks) running in CI on every change', 'Manual testing of the web app only', 'Waiting for user reports', 'Testing only the database'], 0,
    'Testing the API directly finds problems once, before they appear in every client.', { type: 'scenario' }),

  // ---- Automation ----
  mc('qa-au-01', 'qa.automation', 1, 'Which tests are usually the best first candidates for automation?', ['Stable, repetitive regression checks of important flows', 'One-off exploratory sessions', 'Usability opinions', 'Features still being designed'], 0,
    'Automation pays back on tests you run often and that rarely change.'),
  mc('qa-au-02', 'qa.automation', 2, 'Why prefer locators such as getByRole("button", { name: "Save" }) over long CSS paths like div > div:nth-child(3) > button?', ['They follow what the user sees, so tests break less when layout changes', 'They run on the server', 'CSS selectors are not allowed', 'They are shorter to type only'], 0,
    'User-facing locators survive markup refactors and also nudge the app towards accessible markup.'),
  mc('qa-au-p1', 'qa.automation', 3, 'This test fails randomly because the results load slowly. What is the fix?',
    ["Use an auto-waiting assertion: await expect(page.getByText('3 results')).toBeVisible();", 'Add waitForTimeout(10000) everywhere', 'Run the test twice and keep the pass', 'Delete the assertion'], 0,
    'Fixed sleeps are slow and still flaky; web-first assertions wait until the condition holds or time out.',
    { type: 'debug', code: "await page.getByRole('button', { name: 'Search' }).click();\nconst text = await page.locator('.count').textContent();\nexpect(text).toBe('3 results');" }),
  mc('qa-au-s1', 'qa.automation', 3, 'The automated UI suite takes 90 minutes, so developers stop running it. What do you do?',
    ['Move most checks down to faster unit/API tests, keep a small UI suite for critical flows, and run tests in parallel', 'Add more UI tests', 'Run it once a month', 'Delete all tests'], 0,
    'The test pyramid keeps most checks fast and cheap, leaving a few end-to-end tests for key journeys.', { type: 'scenario' }),

  // ---- Regression and CI ----
  mc('qa-rg-01', 'qa.regression_ci', 1, 'What is regression testing?', ['Re-testing existing features after a change to make sure they still work', 'Testing a feature for the first time', 'Testing hardware', 'Removing old tests'], 0,
    'Changes can break things that used to work; regression tests catch that.'),
  mc('qa-rg-02', 'qa.regression_ci', 2, 'Why run automated tests in CI on every pull request?', ['To catch regressions before code is merged', 'To make the build slower', 'To replace code review', 'Because CI cannot build code otherwise'], 0,
    'Running tests on each change gives fast feedback and stops broken code reaching the main branch.'),
  mc('qa-rg-p1', 'qa.regression_ci', 2, 'In this GitHub Actions workflow the tests never run. What is missing?',
    ['A step that runs the tests, for example - run: npm test', 'A second checkout step', 'A longer job name', 'The on: section must be removed'], 0,
    'The workflow installs dependencies but has no step that executes the test command.',
    { type: 'debug', code: 'on: [pull_request]\njobs:\n  test:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - run: npm ci' }),
  mc('qa-rg-s1', 'qa.regression_ci', 3, 'One test fails randomly in CI about once a week, and people now ignore red builds. What should the team do?',
    ['Quarantine and fix the flaky test quickly, and keep the build trustworthy', 'Ignore red builds permanently', 'Delete CI', 'Re-run until green and say nothing'], 0,
    'Flaky tests destroy trust in CI. Track and fix them so a red build always means something.', { type: 'scenario' }),

  // ---- Reviewed ----
  written('qa-wr-01', 'qa.test_design', 2, 'theory', 'Explain equivalence partitioning and boundary-value analysis, and how they work together, using a field that accepts marks from 0 to 100.',
    [['Equivalence partitioning: groups inputs that should behave the same; test one value per group', 2], ['Boundary-value analysis: test at and around the edges', 2], ['Correct example values for 0-100 (e.g. -1, 0, 100, 101 and a middle value)', 2]],
    'Equivalence partitioning splits inputs into groups the system should treat alike - below 0, 0 to 100, above 100 - and tests one value from each. Boundary-value analysis adds values at and next to each edge: -1, 0, 1, 99, 100, 101. Together they give few tests with high defect-finding power.'),
  submission('qa-sb-01', ['qa.test_design', 'qa.bug_reports'], 2, 'Write six test cases (ID, steps, test data, expected result) for an online exam timer that auto-submits answers when 30 minutes run out. Then list one area your cases do not cover.',
    [['Covers the normal path (timer counts down, auto-submits at zero)', 2], ['Covers edge cases (refresh/reconnect, submitting just before zero, slow network)', 2], ['Each case has clear steps, data and an expected result', 2], ['Identifies a realistic missing-coverage area', 1]],
    'TC1 timer starts at 30:00; TC2 answers saved and auto-submitted at 00:00; TC3 manual submit at 00:05 is accepted once; TC4 page refresh keeps the remaining time; TC5 connection lost at 00:00 submits saved answers on reconnect; TC6 a second submission is rejected. Not covered: time-zone or device clock tampering.'),
  written('qa-wr-02', 'qa.regression_ci', 3, 'scenario', 'Your team releases every week, and last month two releases broke the fee-payment page. Propose a testing strategy so this does not happen again.',
    [['Automated regression tests for the payment flow (API and a few UI checks)', 2], ['Tests run in CI on every change and block merges when failing', 2], ['Pre-release smoke test / staging check of critical flows', 1], ['Learns from incidents (add a test for each bug found)', 1]],
    'Add API tests for fee calculation and payment, plus a few end-to-end UI checks of checkout, and run them in CI on every pull request with failures blocking merge. Run a short smoke test on staging before each release, and turn every payment bug into a new automated test.'),
];
