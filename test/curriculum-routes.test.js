'use strict';

/**
 * HTTP-level test for curriculum.js's lock enforcement (spec Phase 8 /
 * acceptance criteria #3): "A direct API request for a locked module
 * returns 403 with a reason string." Boots a minimal Express app with
 * curriculum.js's real routes and a stub authRequired middleware - no
 * Postgres, own scratch JSON files.
 *
 * Run: node --test test/curriculum-routes.test.js
 */
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const os = require('node:os');
const fs = require('node:fs');
const http = require('node:http');
const express = require('express');

const CURRICULUM_SCRATCH = path.join(os.tmpdir(), `curriculum-routes-test-${Date.now()}.json`);
const STORE_SCRATCH = path.join(os.tmpdir(), `curriculum-routes-store-${Date.now()}.json`);
process.env.CURRICULUM_DB_PATH = CURRICULUM_SCRATCH;
process.env.DB_PATH = STORE_SCRATCH;

const curriculumStore = require('../curriculum-store');
const { CATALOGUE } = require('../seed/curriculum');
const curriculumRoutes = require('../curriculum');

let server, baseUrl;
const STUDENT = { id: 9101, role: 'student' };

after(() => {
  server.close();
  for (const f of [CURRICULUM_SCRATCH, CURRICULUM_SCRATCH + '.tmp', STORE_SCRATCH, STORE_SCRATCH + '.tmp']) {
    try { fs.unlinkSync(f); } catch { /* already gone */ }
  }
});

before(async () => {
  await curriculumStore.seedCurriculum(CATALOGUE);
  const app = express();
  app.use(express.json());
  app.use((req, res, next) => { req.user = STUDENT; next(); }); // stub authRequired
  curriculumRoutes.register(app, {
    authRequired: (req, res, next) => next(), // already stubbed above
    teacherOrAdmin: (req, res, next) => next(),
    adminRequired: (req, res, next) => next(),
  });
  await new Promise((resolve) => { server = app.listen(0, resolve); });
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

test('a direct request for a locked module returns 403 with a reason string', async () => {
  const data = curriculumStore._allData();
  const cs11 = data.courses.find((c) => c.code === 'CS1.1');
  const module2 = data.modules.find((m) => m.course_id === cs11.id && m.order_no === 2);

  // Never enrolled, so module 2 (which nothing has unlocked) must 403.
  const res = await fetch(`${baseUrl}/api/curriculum/modules/${module2.id}`);
  assert.equal(res.status, 403);
  const body = await res.json();
  assert.equal(body.locked, true);
  assert.ok(typeof body.error === 'string' && body.error.length > 0, 'must carry a reason string');
});

test('module 1 becomes reachable after enrolling', async () => {
  const data = curriculumStore._allData();
  const cs11 = data.courses.find((c) => c.code === 'CS1.1');
  const module1 = data.modules.find((m) => m.course_id === cs11.id && m.order_no === 1);

  await fetch(`${baseUrl}/api/curriculum/courses/${cs11.id}/enroll`, { method: 'POST' });
  const res = await fetch(`${baseUrl}/api/curriculum/modules/${module1.id}`);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.locked, false);
  assert.equal(body.sections.length, 6, 'the six sections must be returned in order');
});
