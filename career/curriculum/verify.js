'use strict';
/**
 * Executes a code question and compares the real output with its declared
 * expected output. Python runs in a resource-limited bubblewrap sandbox; SQL runs in an in-memory SQLite
 * database (rows printed as "a, b; c, d", NULL as NULL, "(no rows)" when
 * empty). Used by scripts/verify-career-code.js for the built-in banks and
 * by the admin import/edit paths, so a wrong code answer cannot be marked
 * reviewed. Missing OS isolation fails closed and refuses verification.
 */
const { execFileSync } = require('child_process');
const SANDBOX = ['--unshare-all', '--die-with-parent', '--new-session', '--ro-bind', '/usr', '/usr', '--ro-bind', '/lib', '/lib', '--ro-bind', '/lib64', '/lib64', '--proc', '/proc', '--dev', '/dev', '--tmpfs', '/tmp', '--chdir', '/tmp', '--clearenv', '--setenv', 'PATH', '/usr/bin'];
const LIMITS = 'import resource,sys\nresource.setrlimit(resource.RLIMIT_CPU,(2,2))\nresource.setrlimit(resource.RLIMIT_AS,(268435456,268435456))\nresource.setrlimit(resource.RLIMIT_FSIZE,(1048576,1048576))\nresource.setrlimit(resource.RLIMIT_NPROC,(16,16))\nexec(sys.argv[1])';

const SQL_RUNNER = [
  'import sqlite3, sys',
  'code = sys.argv[2].strip().rstrip(";")',
  'i = code.rfind(";")',
  'con = sqlite3.connect(":memory:")',
  'con.execute("PRAGMA foreign_keys = ON")',
  'con.executescript(code[:i + 1])',
  'rows = con.execute(code[i + 1:]).fetchall()',
  'fmt = lambda v: "NULL" if v is None else str(v)',
  'print("; ".join(", ".join(fmt(v) for v in r) for r in rows) if rows else "(no rows)")',
].join('\n');

/** Returns { ran, ok, output, problem }. Non-executable questions return { ran: false }. */
function verifyCode(q) {
  if (!q || !q.code || q.expect == null || !['python', 'sql'].includes(q.lang)) return { ran: false };
  let output;
  try { output = execFileSync('bwrap', [...SANDBOX, '/usr/bin/python3', '-I', '-c', LIMITS, q.lang === 'sql' ? SQL_RUNNER : q.code, ...(q.lang === 'sql' ? [q.code] : [])], { encoding: 'utf8', timeout: 5000, maxBuffer: 65536, env: {}, stdio: ['pipe', 'pipe', 'pipe'] }).trimEnd(); }
  catch (e) {
    if (e.code === 'ENOENT' || String(e.stderr || '').includes('bwrap:')) return { ran: true, ok: false, problem: 'Secure question verification requires bubblewrap and Linux user namespaces. No unsandboxed fallback is permitted.' };
    output = 'ERROR: ' + String(e.stderr || e.message).trim().split('\n').pop();
  }
  if (output !== String(q.expect).trimEnd()) return { ran: true, ok: false, output, problem: `the code actually prints ${JSON.stringify(output)}, not the declared ${JSON.stringify(String(q.expect))}` };
  if (Array.isArray(q.options) && Number.isInteger(q.answer) && String(q.options[q.answer]).trim() !== String(q.expect).trim()) return { ran: true, ok: false, output, problem: 'the correct option does not match the verified code output' };
  return { ran: true, ok: true, output };
}
module.exports = { verifyCode };
