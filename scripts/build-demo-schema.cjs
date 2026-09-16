'use strict';
// Build an empty, migrated database image locally. No application store,
// .env, database URL, provider key or customer record is read by this script.
const fs = require('node:fs');
const path = require('node:path');
const { PGlite } = require('@electric-sql/pglite');
const { runTalentMigrations } = require('../migrations/run');
(async () => {
  const pg = new PGlite();
  try {
    await pg.waitReady;
    const pool = { connect: async () => ({ query: async (sql, params) => params ? pg.query(sql, params) : (await pg.exec(sql)).at(-1), release() {} }) };
    await runTalentMigrations(pool);
    const blob = await pg.dumpDataDir('gzip');
    const bytes = Buffer.from(await blob.arrayBuffer());
    fs.writeFileSync(path.join(__dirname, '../demo/talent-schema.tar.gz'), bytes);
    console.log('Wrote empty Talent demo schema: ' + bytes.length + ' bytes');
  } finally { await pg.close(); }
})().catch(err => { console.error(err); process.exitCode = 1; });
