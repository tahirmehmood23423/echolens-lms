'use strict';

// Real HTTP server with synthetic JSON LMS records and an empty, in-memory
// Postgres engine for Talent. Never loads .env or connects to an external DB.
const path = require('node:path');
require('dotenv').config = () => ({ parsed: {} });
for (const key of Object.keys(process.env)) {
  if (/^(DATABASE_URL|DIRECT_URL|SMTP_|MAIL_|BULK_|BREVO_|ZEPTO|GROQ_|GEMINI_|GOOGLE_|JAAS_|R2_|AWS_|RENDER|AI_)/.test(key)) delete process.env[key];
}
const runtime = process.env.ECHOLENS_TEST_RUNTIME;
if (!runtime) throw new Error('An isolated test runtime directory is required.');
Object.assign(process.env, {
  NODE_ENV: 'test', DATABASE_URL: '', DIRECT_URL: '', PORT: '0',
  DB_PATH: path.join(runtime, 'store.json'), UPLOAD_DIR: path.join(runtime, 'uploads'),
  JWT_SECRET: 'synthetic-talent-regression-secret', MAIL_DRY_RUN: 'true',
});

const store = require('../../store');
const db = require('../../db');
const { PGlite } = require('@electric-sql/pglite');
const pg = new PGlite();
const { runTalentMigrations } = require('../../migrations/run');
const pool = { connect: async () => ({
  query: async (sql, params) => params ? pg.query(sql, params) : (await pg.exec(sql)).at(-1),
  release() {},
}) };
const users = [
  { id: 1, name: 'Synthetic Admin', role: 'admin', reg_no: 'TEST-ADMIN', profile: {} },
  { id: 2, name: 'Synthetic Learner', role: 'student', reg_no: 'TEST-STUDENT', profile: {} },
];
store.allData().users = users;
store.persist();
require('../../mailer').notify = async () => ({ sent: false, skipped: true });
require('../../ai').enabled = () => false;

const init = store.initFromPostgres;
store.initFromPostgres = async () => {
  await init();
  await pg.waitReady;
  // Enable only Talent's raw queries after JSON-store initialization. Missing
  // tables now produce actual PostgreSQL 42P01 errors through the HTTP routes.
  db.enabled = () => true;
  db.query = (sql, params) => pg.query(sql, params);
};
const express = require('express');
const listen = express.application.listen;
express.application.listen = function (...args) {
  const server = listen.apply(this, args);
  server.on('listening', () => {
    const jwt = require('jsonwebtoken');
    const { sessionVersion } = require('../../session-security');
    const cookies = Object.fromEntries(users.map(user => [user.role, 'el_token=' + jwt.sign({
      id: user.id, sv: sessionVersion(user, process.env.JWT_SECRET),
    }, process.env.JWT_SECRET)]));
    process.send({ type: 'ready', port: server.address().port, cookies });
  });
  return server;
};
process.on('message', async (message) => {
  if (message !== 'migrate') return;
  try {
    await runTalentMigrations(pool);
    process.send({ type: 'migrated' });
  } catch (err) {
    process.send({ type: 'migration-error', error: err.message });
  }
});
require('../../server');
