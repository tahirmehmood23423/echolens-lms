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
