#!/usr/bin/env node
'use strict';
/**
 * Runs every code question that declares an expected output and checks the
 * real output matches it (and matches the correct option). Python only for
 * now; questions in other languages are reported as "not executed".
 *   node scripts/verify-career-code.js [subtrack-id]
 * Exit code 1 if any mismatch. Used by test/career-curriculum.test.js.
 */
const { execFileSync } = require('child_process');
const path = require('path'), fs = require('fs');
const dir = path.join(__dirname, '..', 'career', 'curriculum', 'questions');
const only = process.argv[2];
let bad = 0, ran = 0, skipped = 0;
for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.js') && x !== 'index.js')) {
  if (only && !f.startsWith(only)) continue;
  for (const q of require(path.join(dir, f))) {
    if (!q.code || q.expect == null) continue;
    if (q.lang !== 'python') { skipped++; continue; }
    let out;
    try { out = execFileSync('python3', ['-c', q.code], { encoding: 'utf8', timeout: 5000, stdio: ['pipe', 'pipe', 'pipe'] }).trimEnd(); }
    catch (e) { out = 'ERROR: ' + String(e.stderr || e.message).trim().split('\n').pop(); }
    ran++;
    if (out !== String(q.expect).trimEnd()) { bad++; console.log(`MISMATCH ${q.id}: expected ${JSON.stringify(q.expect)} got ${JSON.stringify(out)}`); }
    else if (q.options[q.answer].trim() !== String(q.expect).trim()) { bad++; console.log(`KEY ${q.id}: correct option differs from verified output`); }
  }
}
console.log(`verified ${ran} code questions, ${bad} problems, ${skipped} not executed (non-Python)`);
process.exit(bad ? 1 : 0);
