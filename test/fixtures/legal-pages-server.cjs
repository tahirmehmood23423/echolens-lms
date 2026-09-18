'use strict';
// Isolated synthetic runtime: never load .env, connect to PG, or send real mail.
const path = require('node:path'), fs = require('node:fs');
require('dotenv').config = () => ({ parsed: {} });
for (const key of Object.keys(process.env)) {
  if (/^(DATABASE_URL|DIRECT_URL|TEST_DATABASE_URL|SMTP_|MAIL_|BULK_|BREVO_|ZEPTO|GROQ_|GEMINI_|GOOGLE_|JAAS_|R2_|AWS_|RENDER|AI_|FLUSH_|ADMISSIONS_|FINANCE_)/.test(key)) delete process.env[key];
}
const runtime = process.env.ECHOLENS_TEST_RUNTIME;
if (!runtime) throw Error('Isolated test runtime required');
const childProcess = require('node:child_process'), originalFork = childProcess.fork;
const workers = [];
childProcess.fork = function (...args) {
  const child = originalFork.apply(this, args);
  workers.push(child.pid); fs.writeFileSync(path.join(runtime, 'workers.json'), JSON.stringify(workers));
  return child;
};
Object.assign(process.env, { NODE_ENV: 'test', DATABASE_URL: '', DIRECT_URL: '', PORT: '0',
  DB_PATH: path.join(runtime, 'store.json'), UPLOAD_DIR: path.join(runtime, 'uploads'),
  JWT_SECRET: 'synthetic-legal-pages-test-secret', MAIL_DRY_RUN: 'true', APP_URL: 'http://localhost' });
const mailer = require('../../mailer');
mailer.notify = async () => ({ sent: [], failed: [] });
mailer.configured = false;
require('../../ai').enabled = () => false;
const express = require('express'), listen = express.application.listen;
express.application.listen = function (...args) {
  const server = listen.apply(this, args);
  server.on('listening', () => process.send?.({ port: server.address().port }));
  return server;
};
require('../../server');
