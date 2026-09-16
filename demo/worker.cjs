'use strict';

// This process must never load the website's environment or storage. Accounts
// exist only in a new temporary store; Talent uses a separate temporary SQL database.
if (process.env.ECHOLENS_DEMO_WORKER !== '1' || !process.send) throw new Error('Demo workers must be started by the demo proxy.');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const safeEnv = {};
for (const key of ['PATH', 'Path', 'SystemRoot', 'SYSTEMROOT', 'WINDIR', 'TEMP', 'TMP', 'TMPDIR', 'HOME', 'USERPROFILE', 'LOCALAPPDATA', 'APP_URL']) if (process.env[key]) safeEnv[key] = process.env[key];
for (const key of Object.keys(process.env)) delete process.env[key];
Object.assign(process.env, safeEnv);
const runtime = fs.mkdtempSync(path.join(os.tmpdir(), 'echolens-demo-'));
Object.assign(process.env, safeEnv, {
  ECHOLENS_DEMO_WORKER: '1', NODE_ENV: 'test', PORT: '0', DATABASE_URL: '', DIRECT_URL: '',
  JWT_SECRET: crypto.randomBytes(48).toString('hex'), MAIL_DRY_RUN: 'true',
  DB_PATH: path.join(runtime, 'store.json'), UPLOAD_DIR: path.join(runtime, 'uploads'),
});
require('dotenv').config = () => ({ parsed: {} });
process.on('disconnect', () => process.exit(0));
process.on('SIGTERM', () => process.exit(0));
process.on('exit', () => {
  // The only removable directory is the direct temp child created above.
  if (path.dirname(path.resolve(runtime)) === path.resolve(os.tmpdir()) && path.basename(runtime).startsWith('echolens-demo-')) {
    try { fs.rmSync(runtime, { recursive: true, force: true }); } catch {}
  }
});
const store = require('../store');
const db = require('../db');
require('../mailer').notify = async () => ({ sent: false, skipped: true });
require('../ai').enabled = () => false;
const { PGlite } = require('@electric-sql/pglite');
// Loading the checked-in empty schema avoids running initdb (and creating a
// second WebAssembly database) on the live web service. This image contains
// schema and skill vocabulary only; demo accounts are created below.
const pg = new PGlite({
  dataDir: path.join(runtime, 'talent-db'),
  loadDataDir: new Blob([fs.readFileSync(path.join(__dirname, 'talent-schema.tar.gz'))]),
  initialMemory: 128 * 1024 * 1024,
  startParams: [...PGlite.defaultStartParams, '-c', 'shared_buffers=8MB', '-c', 'work_mem=1MB', '-c', 'maintenance_work_mem=8MB'],
});
const { runTalentMigrations } = require('../migrations/run');
const pool = { connect: async () => ({
  query: async (sql, params) => params ? pg.query(sql, params) : (await pg.exec(sql)).at(-1), release() {},
}) };
function freeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return;
  Object.values(value).forEach(freeze); Object.freeze(value);
}
store.initFromPostgres = async () => {
  await pg.waitReady;
  await runTalentMigrations(pool);
  await require('./seed')(store, pg);
  store.persist();
  freeze(store.allData());
  require('./context').lock();
  await pg.exec('SET default_transaction_read_only = on');
  db.enabled = () => true;
  db.query = (sql, params) => pg.query(sql, params);
};
// Local IPC inspection for regression tests; no HTTP endpoint exposes this.
process.on('message', async message => {
  if (message !== 'inspect') return;
  const tables = ['talent_profiles', 'projects', 'contact_requests', 'messages', 'search_log'];
  const rows = [];
  for (const table of tables) rows.push((await pg.query(`SELECT * FROM ${table} ORDER BY id`)).rows);
  process.send({ type: 'inspection', rss: process.memoryUsage().rss, digest: crypto.createHash('sha256').update(JSON.stringify([store.allData(), rows])).digest('hex'),
    storage: runtime, users: store.Users.all().map(u => u.username), readOnly: (await pg.query('SHOW default_transaction_read_only')).rows[0].default_transaction_read_only });
});
require('../server');
