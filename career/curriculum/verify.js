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
const fs=require('node:fs'),path=require('node:path');
const SANDBOX = ['--unshare-all', '--die-with-parent', '--new-session', '--ro-bind', '/usr', '/usr', '--ro-bind', '/lib', '/lib', '--ro-bind', '/lib64', '/lib64', '--proc', '/proc', '--dev', '/dev', '--tmpfs', '/tmp', '--chdir', '/tmp', '--clearenv', '--setenv', 'PATH', '/usr/bin'];
const LIMITS = 'import resource,sys\nresource.setrlimit(resource.RLIMIT_CPU,(2,2))\nresource.setrlimit(resource.RLIMIT_AS,(268435456,268435456))\nresource.setrlimit(resource.RLIMIT_FSIZE,(1048576,1048576))\nresource.setrlimit(resource.RLIMIT_NPROC,(16,16))\nexec(sys.argv[1])';
const PACKAGE_ROOT='/opt/codex/runtimes/codex-primary-runtime/dependencies/python';
const PACKAGE_PYTHON=path.join(PACKAGE_ROOT,'bin/python');
const JS_LIMITS='import resource,os,sys\nresource.setrlimit(resource.RLIMIT_CPU,(2,2))\nresource.setrlimit(resource.RLIMIT_AS,(2147483648,2147483648))\nresource.setrlimit(resource.RLIMIT_FSIZE,(1048576,1048576))\nresource.setrlimit(resource.RLIMIT_NPROC,(32,32))\nos.execv("/node",["/node","--jitless","--max-old-space-size=64","-e",sys.argv[1]])';
// Optional scientific/framework profile: unchanged standard-library limits above.
// The known development runtime is read-only; no workspace, home or credentials are bound.
const PACKAGE_LIMITS=LIMITS.replace('(268435456,268435456)','(1073741824,1073741824)');

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
  if (!q || !q.code || q.expect == null || !['python', 'sql','javascript','python-pandas','python-fastapi'].includes(q.lang)) return { ran: false };
  const packages=['python-pandas','python-fastapi'].includes(q.lang);
  if(packages&&!fs.existsSync(PACKAGE_PYTHON))return {ran:true,ok:false,problem:'The read-only Python package verification runtime is unavailable. No unsandboxed fallback is permitted.'};
  const sandbox=[...SANDBOX];let command=['/usr/bin/python3','-I','-c',LIMITS,q.lang==='sql'?SQL_RUNNER:q.code,...(q.lang==='sql'?[q.code]:[])];
  if(q.lang==='javascript'){sandbox.push('--ro-bind',process.execPath,'/node');command=['/usr/bin/python3','-I','-c',JS_LIMITS,q.code];}
  if(packages){sandbox.push('--ro-bind',PACKAGE_ROOT,PACKAGE_ROOT,'--setenv','OPENBLAS_NUM_THREADS','1','--setenv','OMP_NUM_THREADS','1','--setenv','NUMEXPR_NUM_THREADS','1');command=[PACKAGE_PYTHON,'-I','-c',PACKAGE_LIMITS,q.code];}
  let output;
  try { output = execFileSync('bwrap', [...sandbox,...command], { encoding: 'utf8', timeout: 5000, maxBuffer: 65536, env: {}, stdio: ['pipe', 'pipe', 'pipe'] }).trimEnd(); }
  catch (e) {
    if (e.code === 'ENOENT' || String(e.stderr || '').includes('bwrap:')) return { ran: true, ok: false, problem: 'Secure question verification requires bubblewrap and Linux user namespaces. No unsandboxed fallback is permitted.' };
    output = 'ERROR: ' + String(e.stderr || e.message).trim().split('\n').pop();
  }
  if (output !== String(q.expect).trimEnd()) return { ran: true, ok: false, output, problem: `the code actually prints ${JSON.stringify(output)}, not the declared ${JSON.stringify(String(q.expect))}` };
  if (Array.isArray(q.options) && Number.isInteger(q.answer) && String(q.options[q.answer]).trim() !== String(q.expect).trim()) return { ran: true, ok: false, output, problem: 'the correct option does not match the verified code output' };
  return { ran: true, ok: true, output,...(q.lang==='javascript'?{runtime:'Node.js '+process.versions.node,profile:'Isolated Node; JIT disabled, 64 MiB heap, 2 GiB virtual address space, 2 CPU seconds, no network'}:packages?{profile:'Isolated read-only Python package runtime; 1 GiB virtual address space, 2 CPU seconds, single-thread numerical libraries, no network'}:{}) };
}
module.exports = { verifyCode };
