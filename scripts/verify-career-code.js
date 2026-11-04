#!/usr/bin/env node
'use strict';
/**
 * Runs every code question in the built-in comprehensive banks that declares
 * an expected output, and checks the real output matches it and matches the
 * correct option (see career/curriculum/verify.js).
 *   node scripts/verify-career-code.js [subtrack-id]
 * Exit code 1 if any mismatch. Used by test/career-curriculum.test.js.
 */
const path = require('path'), fs = require('fs');
const { verifyCode } = require('../career/curriculum/verify');
const dir = path.join(__dirname, '..', 'career', 'curriculum', 'questions');
const only = process.argv[2];
let bad = 0, ran = 0, skipped = 0;
for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.js') && x !== 'index.js')) {
  if (only && !f.startsWith(only)) continue;
  for (const q of require(path.join(dir, f))) {
    if (!q.code || q.expect == null) continue;
    const v = verifyCode(q);
    if (!v.ran) { skipped++; if (v.problem) console.log(`SKIPPED ${q.id}: ${v.problem}`); continue; }
    ran++;
    if (!v.ok) { bad++; console.log(`MISMATCH ${q.id}: ${v.problem}`); }
  }
}
console.log(`verified ${ran} code questions, ${bad} problems, ${skipped} not executed`);
process.exit(bad ? 1 : 0);
