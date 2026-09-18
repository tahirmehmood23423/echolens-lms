'use strict';
// Only an explicitly supplied loopback test server; never reads .env/store data.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { execFileSync } = require('node:child_process');
const { Client } = require('pg');
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const planner = require('../normalized-flush-plan');

async function main() {
  if (!process.env.TEST_DATABASE_URL) throw Error('TEST_DATABASE_URL is required; use an isolated local PostgreSQL server.');
  const base = new URL(process.env.TEST_DATABASE_URL);
  if (!['localhost', '127.0.0.1', '[::1]'].includes(base.hostname)) throw Error('This step-2 benchmark only permits a loopback test server.');
  const name = `echolens_flush_bench_${Date.now()}`;
  const adminUrl = new URL(base); adminUrl.pathname = '/postgres';
  const admin = new Client({ connectionString: adminUrl.toString(), ssl: false });
  await admin.connect();
  let client;
  try {
    // Identifier is generated locally, never supplied by a caller.
    await admin.query(`CREATE DATABASE "${name}"`);
    const url = new URL(base); url.pathname = '/' + name;
    const connection = new Client({ connectionString: url.toString(), ssl: false });
    await connection.connect();
    try {
      const directory = path.join(__dirname, '../prisma/migrations');
      for (const migration of fs.readdirSync(directory).sort()) {
        const file = path.join(directory, migration, 'migration.sql');
        if (fs.existsSync(file)) await connection.query(fs.readFileSync(file, 'utf8'));
      }
    } finally { await connection.end(); }
    let queries = 0;
    client = new PrismaClient({ adapter: new PrismaPg({ connectionString: url.toString(), ssl: false }), log: [{ emit: 'event', level: 'query' }] });
    client.$on('query', () => queries++);
    const rows = Number(process.env.FLUSH_BENCH_ROWS || 5000);
    if (!Number.isSafeInteger(rows) || rows < 1 || rows > 50000) throw Error('FLUSH_BENCH_ROWS must be 1..50000');
    const runs = Number(process.env.FLUSH_BENCH_RUNS || 3);
    if (!Number.isSafeInteger(runs) || runs < 1 || runs > 10) throw Error('FLUSH_BENCH_RUNS must be 1..10');
    const users = Array.from({ length: rows }, (_, i) => ({ id: i + 1, name: 'Synthetic ' + i, role: 'student',
      username: 'bench' + i, email: `bench${i}@qa.invalid`, password_hash: 'synthetic-not-a-real-credential',
      profile: { enrollment: { opened: false }, sample: 'x'.repeat(1024) }, streak: 0, best_streak: 0,
      created_at: '2026-09-18 00:00:00', onboarding_complete: true }));
    const snapshot = { users, seq: { users: rows }, settings: {}, feedback: [], issued_usernames: [], issued_regnos: [] };
    const seed = planner.prepareFlush(snapshot);
    for (const operation of seed.operations) await operation.execute(client);
    const baseline = seed.nextSnapshot;
    const changed = { ...snapshot, users: users.map(user => ({ ...user, streak: 1, profile: { ...user.profile, enrollment: { opened: true } } })) };
    const old = execFileSync('git', ['show', '78736d0:store.js'], { encoding: 'utf8', cwd: path.join(__dirname, '..') });
    const current = fs.readFileSync(path.join(__dirname, '../store.js'), 'utf8');
    function extract(source) {
      return source.slice(source.indexOf('async function persistAllToPostgresNormalized('), source.indexOf('/** Queues a Postgres persist', source.indexOf('async function persistAllToPostgresNormalized(')) >= 0
        ? source.indexOf('/** Queues a Postgres persist', source.indexOf('async function persistAllToPostgresNormalized('))
        : source.indexOf('/** Capture only when', source.indexOf('async function persistAllToPostgresNormalized(')));
    }
    const results = [];
    for (const [label, source] of [['before', old], ['after', current]]) {
      for (let run = 0; run < runs; run++) {
        let queryMs = 0, callbackMs = 0, transactionMs = 0;
        const observed = { $transaction: async (callback, options) => {
          const start = performance.now();
          try {
            return await client.$transaction(async tx => {
              const begin = performance.now();
              const wrapped = new Proxy(tx, { get(target, key) {
                const model = target[key];
                if (!model || typeof model !== 'object') return model;
                return new Proxy(model, { get(model, op) {
                  if (typeof model[op] !== 'function') return model[op];
                  return async args => { const t0 = performance.now(); try { return await model[op](args); } finally { queryMs += performance.now() - t0; } };
                } });
              } });
              try { return await callback(wrapped); } finally { callbackMs += performance.now() - begin; }
            }, options);
          } finally { transactionMs += performance.now() - start; }
        } };
        const context = vm.createContext({ performance, Date, console: { log() {}, warn() {}, error: console.error },
          process: { env: {} }, lastPersistedSnapshot: baseline, lastSuccessfulFlushAt: null, consecutiveFlushFailures: 0,
          lastFlushTiming: null, lastFlushFailure: null,
          require: module => module === './prisma-client' ? { getPrismaClient: () => observed, getQueryCount: () => queries }
            : require(path.join(__dirname, '..', module)),
        });
        vm.runInContext(extract(source), context);
        const t0 = performance.now(), q0 = queries;
        const captured = label === 'after' ? planner.captureSnapshot(changed) : changed;
        const captureMs = label === 'after' ? performance.now() - t0 : 0;
        await context.persistAllToPostgresNormalized(captured, captureMs);
        const totalMs = performance.now() - t0;
        const scanSerializeMs = label === 'after' ? context.lastFlushTiming.scanSerializeMs : callbackMs - queryMs;
        results.push({ label, run: run + 1, rows, totalMs, scanSerializeMs,
          dbMs: label === 'after' ? context.lastFlushTiming.dbMs : transactionMs - scanSerializeMs,
          transactionMs, queries: queries - q0 });
      }
    }
    console.log(JSON.stringify({ server: 'isolated local PostgreSQL', results }, null, 2));
  } finally {
    if (client) await client.$disconnect();
    await admin.query(`DROP DATABASE IF EXISTS "${name}" WITH (FORCE)`);
    await admin.end();
  }
}
main().catch(error => { console.error({ code: error.code, message: error.message.slice(-1500), meta: error.meta }); process.exitCode = 1; });
