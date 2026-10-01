'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
process.env.DB_PATH = path.join(os.tmpdir(), `echolens-trending-tech-${crypto.randomUUID()}.json`);

const tracks = require('../tracks/trending-tech');
const { completion } = require('../learning-attempts');
const { validateEvidenceInput } = require('../evidence-submission');
const { COLLECTIONS, buildPrismaRow, rowFromPrisma } = require('../schema-map');
const store = require('../store');
const { Quests, OpenQuest, OpenAttempts, Users, Certificates } = store;

test('Revision 3 catalogue contains the exact published course structure', () => {
  const result = tracks.validateTrendingTechCatalogue(tracks);
  assert.deepEqual(result.counts, { courses: 6, modules: 24, lectures: 72, quizzes: 72, questions: 360, coding_tasks: 31, optional_projects: 41, capstones: 6, videos_ready: 72 });
  assert.equal(result.valid, true);
  assert.equal(result.errors.length, 0);
  assert.deepEqual(tracks.map((track) => track.course_code), ['TT-01', 'TT-02', 'TT-03', 'TT-04', 'TT-05', 'TT-06']);
  for (const track of tracks) {
    assert.equal(track.published, true);
    assert.ok(track.modules.every((module) => !module.resources), 'optional module deep dives are not shipped');
    for (const level of track.levels) {
      const [quiz, second] = level.problems;
      assert.equal(quiz.grading_mode, 'quiz');
      assert.equal(quiz.required, true);
      assert.equal(quiz.quiz.questions.length, 5);
      // Every lecture has either a required compiler task or an optional project.
      assert.ok(second.submission.mode === 'code' ? second.required && second.language : second.optional && !second.required);
    }
    assert.equal(track.capstone.weight, 40);
    assert.equal(track.assignment_weight, 60);
    for (const level of track.levels) {
      assert.equal(level.videos[0].url, level.video_url);
      for (const video of level.videos) {
        assert.ok(video.duration_seconds > 0 && video.duration_seconds < 1200, video.title);
        assert.equal(video.playable_in_embed, true);
        assert.match(video.checked_at, /^\d{4}-\d{2}-\d{2}T/);
      }
    }
    assert.doesNotMatch(JSON.stringify(track), /\u2022|link to be pasted on publish/);
  }
});

test('trending tech courses are open for enrollment like every other free course', () => {
  assert.equal(store.officialCatalogue().filter((course) => course.code.startsWith('TT-')).length, 6);
  assert.equal(Quests.tracks().filter((track) => track.course_code?.startsWith('TT-')).length, 6);
  const listed = store.publicCatalogue().filter((course) => course.code.startsWith('TT-'));
  assert.deepEqual(listed.map((course) => course.code), ['TT-01', 'TT-02', 'TT-03', 'TT-04', 'TT-05', 'TT-06']);
  assert.ok(listed.every((course) => course.available === true && !course.coming_soon && course.track_key));
  assert.ok(listed.every((course) => !OpenQuest.isStaged(course.track_key)));
  store.allData().users.push({ id: 890, role: 'student', name: 'Tech Track Learner', profile: {} });
  assert.equal(OpenQuest.enroll(890, listed[0].track_key).existing, false);
});

test('release validation accepts 72 unique direct videos and rejects placeholders or duplicates', () => {
  const ready = JSON.parse(JSON.stringify(tracks));
  let number = 0;
  for (const track of ready) for (const level of track.levels) level.video_url = `https://www.youtube.com/watch?v=${String(++number).padStart(11, '0')}`;
  assert.equal(tracks.validateTrendingTechCatalogue(ready).valid, true);
  ready[0].levels[0].video_url = 'https://youtube.com/@echolensdigital';
  assert.match(tracks.validateTrendingTechCatalogue(ready).errors[0], /direct YouTube/);
  ready[0].levels[0].video_url = ready[0].levels[1].video_url;
  assert.ok(tracks.validateTrendingTechCatalogue(ready).errors.some((error) => /duplicates/.test(error)));
});

test('release validation rejects a YouTube video that disables embedding', async () => {
  const ready = JSON.parse(JSON.stringify(tracks));
  let number = 0;
  for (const track of ready) for (const level of track.levels) level.video_url = `https://www.youtube.com/watch?v=${String(++number).padStart(11, '0')}`;
  const fetchImpl = async (url) => ({
    ok: true,
    status: 200,
    text: async () => String(url).includes('00000000001') ? '{"playableInEmbed":false}' : '{"playableInEmbed":true}',
  });
  const result = await tracks.validateYouTubeEmbeddability(ready, fetchImpl);
  assert.equal(result.valid, false);
  assert.deepEqual(result.errors, ['TT-01 lecture 1.1: YouTube reports that this video cannot be embedded.']);
});

test('capstone completion uses 60 percent assignment average and 40 percent capstone score', () => {
  const track = tracks[0];
  const submissions = track.levels.flatMap((level) => level.problems.filter((problem) => problem.required).map((problem) => ({ assessment_kind: 'assignment', level: level.no, pid: problem.pid, score: 80 })));
  let progress = completion(track, submissions);
  assert.equal(progress.assignments_passed, true);
  assert.equal(progress.capstone.unlocked, true);
  assert.equal(progress.passed, false);
  assert.equal(progress.weighted_score, null);
  submissions.push({ assessment_kind: 'capstone', level: 0, pid: 0, score: 90 });
  progress = completion(track, submissions);
  assert.equal(progress.assignment_average, 80);
  assert.equal(progress.weighted_score, 84);
  assert.equal(progress.capstone.passed, true);
  assert.equal(progress.passed, true);
});

test('evidence validation enforces HTTPS links, required fields, counts and safe normalization', () => {
  const rule = { links: { min: 1, max: 2 }, files: { min: 1, max: 2 }, notes: { required: true, max_length: 12 }, require_any: true };
  assert.match(validateEvidenceInput({ rawLinks: '[]', notes: '', files: [], rule }).error, /at least 1 required HTTPS/);
  assert.match(validateEvidenceInput({ rawLinks: '["http://example.com"]', notes: 'review note', files: [{}], rule }).error, /must use HTTPS/);
  assert.match(validateEvidenceInput({ rawLinks: '["not a url"]', notes: 'review note', files: [{}], rule }).error, /complete HTTPS URL/);
  assert.match(validateEvidenceInput({ rawLinks: '["https://example.com"]', notes: '', files: [{}], rule }).error, /required evidence notes/);
  assert.match(validateEvidenceInput({ rawLinks: '["https://example.com"]', notes: 'review note', files: [], rule }).error, /required evidence file/);
  const valid = validateEvidenceInput({ rawLinks: '["https://example.com/path", "https://example.com/path"]', notes: '123456789012345', files: [{}], rule });
  assert.deepEqual(valid.links, ['https://example.com/path']);
  assert.equal(valid.notes, '123456789012');
});

test('normalized database mapping preserves assessment kind and structured evidence', () => {
  const columns = COLLECTIONS.find(([collection]) => collection === 'open_submissions')[3];
  const source = {
    assessment_kind: 'capstone',
    evidence: { links: ['https://example.com/project'], notes: 'Reviewer notes', files: [{ name: 'result.pdf' }] },
  };
  const prismaRow = buildPrismaRow('open_submissions', columns, source, 'test.open_submissions');
  assert.equal(prismaRow.assessmentKind, 'capstone');
  assert.deepEqual(prismaRow.evidence, source.evidence);
  const restored = rowFromPrisma('open_submissions', columns, prismaRow);
  assert.equal(restored.assessment_kind, 'capstone');
  assert.deepEqual(restored.evidence, source.evidence);
});

test('learner capstone waits for assignments, enters staff review, and gates its certificate', () => {
  const track = tracks[0], official = store.officialCatalogue({ includeUnpublished: true }).find((course) => course.code === track.course_code);
  track.published = true; official.published = true;
  const data = store.allData();
  data.users = [{ id: 901, role: 'student', name: 'Tech Track Learner', reg_no: 'TT901', profile: {} }];
  data.open_submissions = []; data.open_attempts = []; data.certificates = [];
  assert.equal(OpenQuest.enroll(901, track.key).existing, false);
  // A seat is confirmed an hour after enrolling (course-pacing.js). Backdate it
  // so the refusal below is the one this test is about - assignments not passed
  // yet - rather than the enrolment still being unconfirmed.
  const learnerRow = Users.byId(901);
  learnerRow.profile.free_course_enrollments = learnerRow.profile.free_course_enrollments
    .map((e) => ({ ...e, activates_at: new Date(Date.now() - 3600_000).toISOString() }));
  const early = OpenQuest.submit({ user: Users.byId(901), track_key: track.key, assessment_kind: 'capstone', evidence: { links: ['https://example.com/project'], notes: null, files: [] }, request_key: 'capstone-request-early', fingerprint: 'early' });
  assert.equal(early.status, 409);
  assert.match(early.error, /assignments/i, 'refused for the capstone prerequisite, not the seat');
  let id = 0;
  // Backdated past the 12h grade hold (course-pacing.js): a grade awarded
  // moments ago is deliberately not visible yet, so seeding "now" would leave
  // the capstone locked for a reason this test is not about.
  const released = new Date(Date.now() - 24 * 3600_000).toISOString();
  for (const level of track.levels) for (const problem of level.problems.filter((item) => item.required)) data.open_submissions.push({ id: ++id, user_id: 901, track_key: track.key, assessment_kind: 'assignment', level: level.no, pid: problem.pid, problem_title: problem.title, points: 10, score: 80, gems: 8, attempts: 1, submitted_at: released });
  data.seq.open_submissions = id;
  assert.equal(OpenQuest.progress(901, track.key).capstone.unlocked, true);
  const submitted = OpenQuest.submit({ user: Users.byId(901), track_key: track.key, assessment_kind: 'capstone', evidence: { links: ['https://example.com/project'], notes: 'Reviewer access is documented.', files: [] }, request_key: 'capstone-request-0001', fingerprint: 'capstone-fingerprint' });
  assert.equal(submitted.attempt.status, 'awaiting_review');
  assert.equal(OpenQuest.maybeCertify(901, track.key), null);
  OpenAttempts.complete(submitted.attempt.id, 90, 'All capstone deliverables verified.', 'staff:1');
  const progress = OpenQuest.progress(901, track.key);
  assert.equal(progress.weighted_score, 84);
  assert.equal(progress.passed, true);
  const issued = OpenQuest.maybeCertify(901, track.key, 1);
  assert.ok(issued.cert);
  assert.equal(Certificates.publicView(issued.cert).final_project.items[0].problem_title, track.capstone.title);
  assert.equal(JSON.stringify(Certificates.publicView(issued.cert)).includes('example.com/project'), false);
});

test('quiz answers are graded on the server and the key never reaches learners', () => {
  const { publicQuiz, gradeQuiz } = require('../tracks/trending-tech-assessments');
  const quiz = tracks[2].levels[0].problems[0].quiz;
  const shown = JSON.stringify(publicQuiz(quiz));
  assert.doesNotMatch(shown, /"answer"|explanation/);
  assert.equal(gradeQuiz(quiz, quiz.questions.map((q) => q.answer)).score, 100);
  assert.equal(gradeQuiz(quiz, quiz.questions.map((q, i) => (i < 3 ? q.answer : (q.answer + 1) % q.options.length))).score, 60);
  assert.match(gradeQuiz(quiz, [0]).error, /Answer all 5/);
  assert.match(gradeQuiz(quiz, [0, 0, 0, 0, 7]).error, /every question/);
});

test('a module of quizzes is graded instantly and opens the next module', () => {
  const track = tracks.find((t) => t.course_code === 'TT-04');
  const data = store.allData();
  data.users.push({ id: 950, role: 'student', name: 'Quiz Learner', profile: {} });
  assert.equal(OpenQuest.enroll(950, track.key).existing, false);
  const u = Users.byId(950);
  u.profile.free_course_enrollments = u.profile.free_course_enrollments.map((e) => ({ ...e, activates_at: new Date(Date.now() - 3600_000).toISOString() }));
  const wrong = OpenQuest.submit({ user: u, track_key: track.key, level: 1, pid: 1, quiz_answers: [0], request_key: 'quiz-request-bad-0001', fingerprint: 'bad' });
  assert.equal(wrong.status, 400);
  const optional = OpenQuest.submit({ user: u, track_key: track.key, level: 1, pid: 2, evidence: { links: ['https://example.com/x'], notes: null, files: [] }, request_key: 'quiz-request-opt-0001', fingerprint: 'opt' });
  assert.equal(optional.attempt.status, 'awaiting_review', 'optional projects still go to staff');
  for (const level of track.levels.filter((l) => l.module_no === 1)) {
    const quiz = level.problems[0].quiz;
    const out = OpenQuest.submit({ user: u, track_key: track.key, level: level.no, pid: 1, quiz_answers: quiz.questions.map((q) => q.answer), request_key: `quiz-request-${level.no}-000001`, fingerprint: `q${level.no}` });
    assert.equal(out.attempt.status, 'completed');
    assert.equal(out.submission.score, 100);
    assert.equal(out.quiz_result.correct, 5);
  }
  const modules = OpenQuest.progress(950, track.key).modules;
  assert.equal(modules[0].status, 'complete', 'the ungraded optional project does not hold the module');
  assert.equal(modules[1].status, 'available');
});
