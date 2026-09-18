'use strict';
const fs = require('node:fs/promises');
const path = require('node:path');
const { redactRowForLog } = require('./flush-diagnostics');
const DUMP_NAME = /^failed-flush-[\w.-]+\.json$/;

function invalid(message, status = 400) {
  return Object.assign(new Error(message), { status });
}

async function listDumps(directory) {
  let names;
  try { names = await fs.readdir(directory); }
  catch (error) { if (error.code === 'ENOENT') return []; throw error; }
  const files = [];
  for (const filename of names.filter(name => DUMP_NAME.test(name)).sort()) {
    try {
      const stat = await fs.lstat(path.join(directory, filename));
      if (stat.isFile() && !stat.isSymbolicLink()) files.push({ filename, size: stat.size, mtime: stat.mtime.toISOString() });
    } catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
  return files;
}

async function inspectDump(directory, filename) {
  if (typeof filename !== 'string' || !DUMP_NAME.test(filename)) throw invalid('Invalid failed-flush dump filename.');
  const target = path.join(directory, filename);
  let stat;
  try { stat = await fs.lstat(target); }
  catch (error) { if (error.code === 'ENOENT') throw invalid('Dump not found.', 404); throw error; }
  if (!stat.isFile() || stat.isSymbolicLink()) throw invalid('Only regular dump files may be inspected.');
  if (stat.size > 32 * 1024 * 1024) throw invalid('Dump exceeds the 32 MiB inspection limit.', 413);
  let dump;
  try { dump = JSON.parse(await fs.readFile(target, 'utf8')); }
  catch (error) { if (error instanceof SyntaxError) throw invalid('Invalid dump JSON.', 422); throw error; }
  if (!dump || typeof dump.collections !== 'object' || Array.isArray(dump.collections) || !dump.collections) throw invalid('Invalid dump collections.', 422);
  const collections = {};
  for (const [key, value] of Object.entries(dump.collections)) {
    const created = Array.isArray(value?.created) ? value.created : [];
    const updated = Array.isArray(value?.updated) ? value.updated : [];
    const deleted = Array.isArray(value?.deleted_ids) ? value.deleted_ids : [];
    Object.defineProperty(collections, key, { enumerable: true, value: {
      created: created.length, updated: updated.length, deleted: deleted.length,
      sample: redactRowForLog(created[0] || updated[0] || (deleted.length ? { id: deleted[0] } : null)),
    } });
  }
  return { filename, size: stat.size, mtime: stat.mtime.toISOString(), collections };
}

function register(app, { authRequired, adminRequired, directory }) {
  const handler = fn => async (req, res) => {
    try { res.json(await fn(req)); }
    catch (error) { res.status(error.status || 500).json({ error: error.status ? error.message : 'Cannot read failed-flush dumps.' }); }
  };
  app.get('/api/admin/list-dumps', authRequired, adminRequired, handler(() => listDumps(directory)));
  app.get('/api/admin/inspect-dump', authRequired, adminRequired, handler(req => inspectDump(directory, req.query.file)));
}

module.exports = { listDumps, inspectDump, register };
