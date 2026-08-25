'use strict';

/**
 * Regression test for the 2026-08-25 production incident: the first
 * certificate ever issued with a real, non-null final_project (a
 * structured object - store.js's finalProjectFor()) crashed Prisma's
 * write with "Argument finalProject: Invalid value provided. Expected
 * String or Null, provided Object.", because schema.prisma types that
 * column String? and it was never registered as a JSON column in
 * schema-map.js. That single failed write poisoned the shared Postgres
 * flush queue (see store.js's "bounded fail-fast" design), which turned
 * into unbounded memory growth and a full process OOM crash - so this
 * isn't just a correctness bug, it's the actual trigger for that outage.
 *
 * No live database needed - schema-map.js's row conversion functions are
 * pure data transformations.
 *
 * Run: node --test test/certificate-final-project.test.js
 */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const schemaMap = require('../schema-map');

const CERT_COLUMNS = schemaMap.COLLECTIONS.find((c) => c[0] === 'certificates')[3];

// The exact shape store.js's finalProjectFor() produces (server.js) and
// the exact certificate from the production crash log.
const REAL_FINAL_PROJECT = {
  level_no: 12, level_title: 'The Capstone', level_topic: 'End-to-end regression project',
  items: [{
    problem_title: 'Full Pipeline: Predict the Price', problem_description: 'Build a regression model.',
    file_url: null, code: 'import pandas as pd\nprint("hello")', language: 'python', note: null, grade: 75,
  }],
};

test('a certificate with a real final_project object no longer throws on the Postgres write boundary', () => {
  const rec = {
    id: 49, serial: 'EL-2026-4D37123A', user_id: 28, student_name: 'Rameen Jawad', reg_no: '625913',
    batch_id: 2, kind: 'course', title: 'Python for Data Science', detail: 'Cohort: 1',
    completion_date: '2026-08-25', instructor_name: 'Tahir Mehmood', instructor_sig: null,
    issued_by: 24, issued_at: '2026-08-25 11:24:57',
    concepts: [{ no: 1, title: 'First Contact', topic: 'Python foundations' }],
    final_project: REAL_FINAL_PROJECT,
    source_kind: null, source_id: null,
  };

  const row = schemaMap.buildPrismaRow('certificates', CERT_COLUMNS, rec, 'certificates#49');
  assert.equal(typeof row.finalProject, 'string', 'finalProject must be a string for the String? Prisma column, never an object');
  assert.doesNotThrow(() => JSON.parse(row.finalProject));
});

test('final_project round-trips exactly through write then read', () => {
  const rec = { id: 49, final_project: REAL_FINAL_PROJECT };
  const written = schemaMap.buildPrismaRow('certificates', CERT_COLUMNS, rec, 'certificates#49');
  const readBack = schemaMap.rowFromPrisma('certificates', CERT_COLUMNS, { id: 49, finalProject: written.finalProject });
  assert.deepEqual(readBack.final_project, REAL_FINAL_PROJECT);
});

test('a null final_project (the common case - most certificates have no capstone snapshot) stays null both ways', () => {
  const written = schemaMap.buildPrismaRow('certificates', CERT_COLUMNS, { id: 50, final_project: null }, 'certificates#50');
  assert.equal(written.finalProject, null);
  const readBack = schemaMap.rowFromPrisma('certificates', CERT_COLUMNS, { id: 50, finalProject: null });
  assert.equal(readBack.final_project, null);
});

test('concepts (a real Json column) is unaffected by the final_project fix - still passed through as-is', () => {
  const concepts = [{ no: 1, title: 'First Contact', topic: 'Python foundations' }];
  const written = schemaMap.buildPrismaRow('certificates', CERT_COLUMNS, { id: 51, concepts, final_project: null }, 'certificates#51');
  assert.deepEqual(written.concepts, concepts, 'concepts must stay a real array/object for its Json column, not get JSON-stringified');
});
