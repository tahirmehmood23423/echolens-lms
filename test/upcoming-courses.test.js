'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const up = require('../upcoming-courses');

const base = { title: 'GenAI Engineering', price_pkr: 20000, reg_opens: '2026-11-01', reg_closes: '2026-11-30', published: true };

test('a course is listed only while published and registration has not closed', () => {
  const c = up.normalize(base);
  assert.equal(up.phase(c, '2026-10-20'), 'upcoming');
  assert.equal(up.phase(c, '2026-11-01'), 'open');
  assert.equal(up.phase(c, '2026-11-30'), 'open'); // closing day is still open
  assert.equal(up.phase(c, '2026-12-01'), 'closed');
  assert.equal(up.isListed(c, '2026-10-20'), true);
  assert.equal(up.isListed(c, '2026-12-01'), false);
  assert.equal(up.acceptsRegistration(c, '2026-10-20'), false);
  assert.equal(up.phase({ ...c, published: false }, '2026-11-10'), 'draft');
});

test('syllabus textarea parses into modules with topics', () => {
  assert.deepEqual(up.syllabus('Week 1: Foundations\n- Tokens\n- Prompts\n\nWeek 2: RAG\n- Embeddings'), [
    { title: 'Week 1: Foundations', topics: ['Tokens', 'Prompts'] },
    { title: 'Week 2: RAG', topics: ['Embeddings'] },
  ]);
});

test('class dates parse, drop invalid lines and sort by date', () => {
  assert.deepEqual(up.classDates('2026-12-03 Lab\nnot a date\n2026-12-01 - Orientation'), [
    { date: '2026-12-01', title: 'Orientation' }, { date: '2026-12-03', title: 'Lab' },
  ]);
});

test('prerequisites and outcomes are one per line, bullets stripped', () => {
  const c = up.normalize({ ...base, prerequisites: '- Basic Python\n\n* Git', outcomes: 'Ship a RAG app' });
  assert.deepEqual(c.prerequisites, ['Basic Python', 'Git']);
  assert.deepEqual(c.outcomes, ['Ship a RAG app']);
});

test('validation requires a title, a fee and a closing date in order', () => {
  assert.match(up.validate(up.normalize({ ...base, price_pkr: 0 })), /fee/);
  assert.match(up.validate(up.normalize({ ...base, reg_closes: '' })), /closes/);
  assert.match(up.validate(up.normalize({ ...base, reg_opens: '2026-12-05' })), /open before/);
  assert.equal(up.validate(up.normalize(base)), null);
});

test('an update keeps fields the request leaves out', () => {
  const prev = up.normalize({ ...base, outcomes: 'A\nB' });
  const next = up.normalize({ title: 'Renamed' }, prev);
  assert.equal(next.title, 'Renamed');
  assert.deepEqual(next.outcomes, ['A', 'B']);
  assert.equal(next.price_pkr, 20000);
});

test('scheduling: class days and dates are generated from the schedule', () => {
  assert.deepEqual(up.weekdays('Mon, Wed and Friday'), [1, 3, 5]);
  assert.deepEqual(up.scheduleDates('2026-12-01', '2026-12-10', 'Tue, Thu').map((d) => d.date), ['2026-12-01', '2026-12-03', '2026-12-08', '2026-12-10']);
  assert.deepEqual(up.scheduleDates('2026-12-10', '2026-12-01', 'Tue'), [], 'end before start gives nothing');
  assert.equal(up.monthLabel('2027-01-05'), 'January 2027');
});

test('scheduling: a catalogue course becomes a cohort with its own outline, only dates are asked for', () => {
  const fs = require('node:fs'), os = require('node:os'), path = require('node:path');
  const dbPath = path.join(os.tmpdir(), 'echolens-upc-' + process.pid + '.json');
  process.env.DATABASE_URL = ''; process.env.DB_PATH = dbPath;
  const store = require('../store');
  try {
    const cat = store.UpcomingCourses.catalogue();
    assert.equal(cat.length, store.officialCatalogue({ includeUnpublished: true }).filter((c) => c.price_pkr > 0).length);
    for (const c of cat) assert.ok(c.syllabus.length > 0 && c.outcomes.length > 0 && c.description, `${c.code} has an outline`);
    const out = store.UpcomingCourses.schedule({ from_code: 'ST-05', reg_closes: '2099-12-20', classes_start: '2100-01-05', classes_end: '2100-01-31', class_days: 'Tue, Thu', class_time: '7-9 PM' }, 1);
    assert.ok(!out.error, out.error);
    const c = out.course;
    assert.equal(c.code, 'ST-05-0001'); assert.equal(c.source_code, 'ST-05');
    assert.match(c.title, /Generative AI Engineering - January 2100 cohort/);
    assert.equal(c.price_pkr, cat.find((x) => x.code === 'ST-05').price_pkr, 'catalogue fee by default');
    assert.equal(c.class_dates.length, 8); assert.equal(c.class_days, 'Tue, Thu');
    assert.ok(c.syllabus.length >= 5 && c.outcomes.length >= 3);
    assert.equal(c.phase, 'open');
    assert.equal(store.catalogueFee(c.code), c.price_pkr, 'Admissions charges the cohort fee');
    // Minimal admin flow: course plus registration dates; content is resolved server-side.
    const datesOnly = store.UpcomingCourses.schedule({ from_code: 'ST-05', reg_opens: '2099-10-01', reg_closes: '2099-10-31', title: 'Ignore injected title', outcomes: ['Ignore injected content'] }, 1);
    assert.ok(!datesOnly.error, datesOnly.error);
    assert.deepEqual(datesOnly.course.outcomes, c.outcomes);
    assert.deepEqual(datesOnly.course.syllabus, c.syllabus);
    assert.equal(datesOnly.course.description, c.description);
    assert.equal(datesOnly.course.price_pkr, c.price_pkr);
    assert.equal(datesOnly.course.classes_start, null);
    assert.deepEqual(datesOnly.course.class_dates, []);
    assert.equal(datesOnly.course.reg_opens, '2099-10-01');
    assert.equal(datesOnly.course.reg_closes, '2099-10-31');
    assert.equal(store.UpcomingCourses.byCode(c.code).title, c.title, 'new cohort leaves existing records intact');
    // A second cohort the same month gets its own code; a fee override is respected.
    const second = store.UpcomingCourses.schedule({ from_code: 'ST-05', reg_closes: '2099-12-20', classes_start: '2100-01-19', price_pkr: 18000 }, 1).course;
    assert.equal(second.code, 'ST-05-0001-B'); assert.equal(second.price_pkr, 18000);
    assert.match(store.UpcomingCourses.schedule({ from_code: 'NOPE', reg_closes: '2099-12-20' }, 1).error, /catalogue/);
    assert.match(store.UpcomingCourses.schedule({ from_code: 'ST-05' }, 1).error, /registration closes/);
  } finally { if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath); }
});
