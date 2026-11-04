'use strict';
/**
 * Executes a code question and compares the real output with its declared
 * expected output. Python runs in python3; SQL runs in an in-memory SQLite
 * database (rows printed as "a, b; c, d", NULL as NULL, "(no rows)" when
 * empty). Used by scripts/verify-career-code.js for the built-in banks and
 * by the admin import/edit paths, so a wrong code answer cannot be marked
 * reviewed. If python3 is not installed the result is { ran: false }.
 */
const { execFileSync } = require('child_process');

const SQL_RUNNER = [
  'import sqlite3, sys',
  'code = sys.argv[1].strip().rstrip(";")',
  'i = code.rfind(";")',
  'con = sqlite3.connect(":memory:")',
  'con.executescript(code[:i + 1])',
  'rows = con.execute(code[i + 1:]).fetchall()',
  'fmt = lambda v: "NULL" if v is None else str(v)',
  'print("; ".join(", ".join(fmt(v) for v in r) for r in rows) if rows else "(no rows)")',
].join('\n');

/** Returns { ran, ok, output, problem }. Non-executable questions return { ran: false }. */
function verifyCode(q) {
  if (!q || !q.code || q.expect == null || !['python', 'sql'].includes(q.lang)) return { ran: false };
  let output;
  try { output = execFileSync('python3', q.lang === 'sql' ? ['-I', '-c', SQL_RUNNER, q.code] : ['-I', '-c', q.code], { encoding: 'utf8', timeout: 5000, stdio: ['pipe', 'pipe', 'pipe'] }).trimEnd(); }
  catch (e) {
    if (e.code === 'ENOENT') return { ran: false, problem: 'python3 is not available, so the code was not executed' };
    output = 'ERROR: ' + String(e.stderr || e.message).trim().split('\n').pop();
  }
  if (output !== String(q.expect).trimEnd()) return { ran: true, ok: false, output, problem: `the code actually prints ${JSON.stringify(output)}, not the declared ${JSON.stringify(String(q.expect))}` };
  if (Array.isArray(q.options) && Number.isInteger(q.answer) && String(q.options[q.answer]).trim() !== String(q.expect).trim()) return { ran: true, ok: false, output, problem: 'the correct option does not match the verified code output' };
  return { ran: true, ok: true, output };
}
module.exports = { verifyCode };
