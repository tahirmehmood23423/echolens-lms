'use strict';
// Read-only repository snapshots. Never initializes an application store or reads .env.
const fs = require('node:fs');
const path = require('node:path');
const C = require('../career/curriculum');
const { BUILTIN } = require('../career/curriculum/learning');
const { BANKS } = require('../career/curriculum/questions');
const { safeOutput, writeCheckpoint, digest } = require('./lib/curriculum-wave.cjs');

function fail(message) { throw new Error(message); }
function uniqueIndex(rows, label) {
  if (!Array.isArray(rows)) fail(label + ' must be an array.');
  const result = new Map();
  for (const row of rows) {
    if (!row || typeof row.id !== 'string' || result.has(row.id)) fail(label + ' has a missing or duplicate id.');
    result.set(row.id, row);
  }
  return result;
}
function sameIDs(actual, expected, label) {
  if (actual.length !== new Set(actual).size || actual.length !== expected.length || actual.some(id => !expected.includes(id))) fail(label + ' IDs must match uniquely.');
}
function inventoryIndex(inventory, label) {
  const index = uniqueIndex(inventory.subtracks, label + '.subtracks');
  sameIDs([...index.keys()], C.SUBTRACKS.map(s => s.id), label + ' canonical subtrack');
  for (const row of index.values()) {
    if (typeof row.authored_draft !== 'boolean') fail(label + ': missing authored_draft for ' + row.id);
    for (const field of ['lessons', 'questions', 'comprehensive_questions', 'verified_lesson_examples', 'checkpoint_modules']) {
      if (!Number.isInteger(row[field]) || row[field] < 0) fail(label + ': invalid ' + field + ' for ' + row.id);
    }
  }
  return index;
}
function totals(index) {
  const rows = [...index.values()].filter(row => row.authored_draft);
  const sum = key => rows.reduce((n, row) => n + row[key], 0);
  return { authored_subtracks: rows.length, modules: sum('checkpoint_modules'), lessons: sum('lessons'), formative: sum('questions'), formal: sum('comprehensive_questions'), verified_worked_examples: sum('verified_lesson_examples'), pending_human_reviews: rows.filter(row => row.human_review_pending === true).length };
}
function coverage(ids, index) {
  return { required: ids.length, authored: ids.filter(id => index.get(id).authored_draft).length, authored_ids: ids.filter(id => index.get(id).authored_draft), missing_ids: ids.filter(id => !index.get(id).authored_draft), pending_human_reviews: ids.filter(id => index.get(id).human_review_pending === true).length, released_subtracks: ids.filter(id => index.get(id).published === true).length };
}
function csv(rows, columns) {
  const cell = value => {
    const text = Array.isArray(value) ? value.join(';') : String(value ?? '');
    // Keep spreadsheet consumers from interpreting untrusted labels as formulas.
    const safe = /^[=+\-@\t\r]/.test(text) ? "'" + text : text;
    return '"' + safe.replace(/"/g, '""') + '"';
  };
  return [columns.map(cell).join(','), ...rows.map(row => columns.map(key => cell(row[key])).join(','))].join('\n') + '\n';
}
function summarize({ baseline, inventory, checkpoint, manifest }) {
  const before = inventoryIndex(baseline, 'baseline'), current = inventoryIndex(inventory, 'inventory');
  if (!Array.isArray(manifest.courses) || manifest.courses.some(id => typeof id !== 'string' || !C.subtrack(id))) fail('manifest.courses must contain canonical subtrack IDs.');
  const ids = manifest.courses;
  if (!Array.isArray(checkpoint.completed)) fail('checkpoint.completed must be an array.');
  sameIDs(ids, checkpoint.completed, 'Manifest and completed checkpoint');
  const checked = uniqueIndex(checkpoint.courses, 'checkpoint.courses');
  sameIDs([...checked.keys()], ids, 'Manifest and checkpoint course');
  if ((checkpoint.errors && (!Array.isArray(checkpoint.errors) || checkpoint.errors.length)) || (checkpoint.duplication?.errors && (!Array.isArray(checkpoint.duplication.errors) || checkpoint.duplication.errors.length))) fail('Checkpoint contains aggregate errors.');
  const actualNew = [...current.values()].filter(row => row.authored_draft && !before.get(row.id).authored_draft).map(row => row.id);
  sameIDs(ids, actualNew, 'Manifest and newly authored inventory');
  for (const row of before.values()) if (row.authored_draft && !current.get(row.id).authored_draft) fail('Prior authored course disappeared: ' + row.id);
  const newCourses = ids.map(id => {
    const row = checked.get(id), course = BUILTIN[id], bank = BANKS[id]?.questions, inv = current.get(id);
    if (!course || !Array.isArray(bank)) fail('Course is not integrated in BUILTIN/BANKS: ' + id);
    if (row.execution_passed !== true || !Array.isArray(row.errors) || row.errors.length) fail('Course lacks a successful error-free executable checkpoint: ' + id);
    if (row.fingerprint !== digest({ course, bank })) fail('Current course/bank fingerprint differs from checkpoint: ' + id);
    if (!Array.isArray(row.examples)) fail('Missing checkpoint example evidence: ' + id);
    const examples = uniqueIndex(row.examples, id + '.examples');
    const verified = course.lessons.filter(lesson => {
      const example = examples.get(lesson.id), worked = lesson.worked;
      return worked && example?.ok === true && example.ran === true && example.code_hash === digest({ code: worked.code, expect: worked.expect, lang: worked.lang || 'python' });
    }).length;
    if (verified !== course.lessons.length) fail('Worked-example evidence is missing or stale: ' + id);
    const counts = { modules: course.modules.length, lessons: course.lessons.length, formative: course.questions.length, formal: bank.length, verified_worked_examples: verified };
    for (const [field, value] of Object.entries({ modules: counts.modules, lessons: counts.lessons, formative: counts.formative, comprehensive: counts.formal })) if (row[field] !== value) fail('Checkpoint count differs from current content: ' + id + '.' + field);
    for (const [field, value] of Object.entries({ checkpoint_modules: counts.modules, lessons: counts.lessons, questions: counts.formative, comprehensive_questions: counts.formal, verified_lesson_examples: verified })) if (inv[field] !== value) fail('Inventory count differs from checked content: ' + id + '.' + field);
    if (!Array.isArray(inv.validation_errors) || inv.validation_errors.length) fail('Inventory contains course validation errors: ' + id);
    return { id, title: C.subtrack(id).title, ...counts, objectives:C.subtrack(id).modules.flatMap(m=>m.objectives).length, fingerprint: row.fingerprint, pending_human_review: inv.human_review_pending === true, human_approved: inv.human_approved === true, published: inv.published === true };
  });
  const careers = Object.keys(C.TRACKS).map(id => {
    const track = C.trackSubtracks(id), required = [...new Set([...track.core, ...track.variants])];
    return { id, baseline: coverage(required, before), current: coverage(required, current) };
  });
  const baselineRoles = uniqueIndex(baseline.job_roles, 'baseline.job_roles'), currentRoles = uniqueIndex(inventory.job_roles, 'inventory.job_roles');
  sameIDs([...baselineRoles.keys()], C.ROLES.map(role => role.id), 'Baseline role');
  sameIDs([...currentRoles.keys()], C.ROLES.map(role => role.id), 'Inventory role');
  const roles = C.ROLES.map(role => {
    const required = C.rolePath(role).required, a = coverage(required, before), b = coverage(required, current);
    return { id: role.id, title: role.title, career: role.track, required_ids: required, baseline: { ...a, authored_complete: a.missing_ids.length === 0, released: baselineRoles.get(role.id).complete === true }, current: { ...b, authored_complete: b.missing_ids.length === 0, released: currentRoles.get(role.id).complete === true } };
  });
  for(const career of careers){
    const ids=[...new Set(C.trackSubtracks(career.id).core.concat(C.trackSubtracks(career.id).variants))];
    career.current.missing_prerequisite_ids=[...new Set(ids.flatMap(id=>[...C.prereqClosure(id)]))].filter(id=>!current.get(id).authored_draft);
    career.current.authored_complete_roles=roles.filter(role=>role.career===career.id&&role.current.authored_complete).map(role=>role.id);
  }
  const prior = totals(before), total = totals(current), added = { authored_subtracks: newCourses.length };
  for (const key of ['modules', 'lessons', 'formative', 'formal', 'verified_worked_examples']) added[key] = newCourses.reduce((n, row) => n + row[key], 0);
  added.pending_human_reviews = newCourses.filter(row => row.pending_human_review).length;
  added.objectives=newCourses.reduce((n,row)=>n+row.objectives,0);
  total.states={missing:[...current.values()].filter(row=>!row.authored_draft).length,outline_only:[...current.values()].filter(row=>row.content_status==='outline_only').length,authored:total.authored_subtracks,automatically_validated:[...current.values()].filter(row=>row.technically_validated).length,human_review_pending:total.pending_human_reviews,human_reviewed:[...current.values()].filter(row=>row.human_reviewed).length,published:[...current.values()].filter(row=>row.published).length};
  const remaining = C.SUBTRACKS.filter(sub => !current.get(sub.id).authored_draft).map(sub => ({ id: sub.id, title: sub.title, prerequisites: sub.prereq, careers: careers.filter(track => track.current.missing_ids.includes(sub.id)).map(track => track.id), blocking_roles: roles.filter(role => role.current.missing_ids.includes(sub.id)).map(role => role.id) }));
  return {
    summary: { schema_version: 1, scope: 'Read-only repository snapshots; authored coverage is separate from human review and release. No production-state or additional test claims.', wave: manifest.wave || null, input_digests: { baseline: digest(baseline), inventory: digest(inventory), checkpoint: digest(checkpoint), manifest: digest(manifest) }, canonical_subtracks: C.SUBTRACKS.length, starting: prior, added, total, remaining_subtracks: remaining.length, authored_complete_roles: { baseline: roles.filter(role => role.baseline.authored_complete).map(role => role.id), current: roles.filter(role => role.current.authored_complete).map(role => role.id) }, released_roles: { baseline: roles.filter(role => role.baseline.released).map(role => role.id), current: roles.filter(role => role.current.released).map(role => role.id) } },
    careers, roles, newCourses, remaining,
  };
}
function main(argv) {
  const allowed = new Set(['--baseline', '--inventory', '--checkpoint', '--manifest', '--output']), args = {};
  if (argv.length !== 10) fail('Usage: node scripts/summarize-career-wave.cjs --baseline FILE --inventory FILE --checkpoint FILE --manifest FILE --output PRIVATE_DIRECTORY');
  for (let i = 0; i < argv.length; i += 2) {
    const key = argv[i];
    if (!allowed.has(key) || args[key] || !argv[i + 1] || argv[i + 1].startsWith('--')) fail('Unknown, duplicate or missing CLI argument: ' + key);
    args[key] = argv[i + 1];
  }
  const read = key => JSON.parse(fs.readFileSync(path.resolve(args[key]), 'utf8'));
  const result = summarize({ baseline: read('--baseline'), inventory: read('--inventory'), checkpoint: read('--checkpoint'), manifest: read('--manifest') });
  const outputs = {
    'summary.json': result.summary,
    'career-matrix.json': result.careers,
    'new-courses.json': result.newCourses,
    'remaining-subtracks.json': result.remaining,
    'job-role-matrix.json': result.roles,
  };
  const directory = path.resolve(args['--output']);
  const files = [...Object.keys(outputs), 'career-matrix.csv'].map(name => safeOutput(path.join(directory, name)));
  for (const file of files) if (fs.existsSync(file)) fail('Refusing to overwrite an existing snapshot artifact: ' + file);
  for (const [name, value] of Object.entries(outputs)) writeCheckpoint(path.join(directory, name), value);
  const rows = result.careers.map(row => ({ career: row.id, required: row.current.required, baseline_authored: row.baseline.authored, current_authored: row.current.authored, added_authored: row.current.authored - row.baseline.authored, baseline_missing: row.baseline.missing_ids, current_missing: row.current.missing_ids, pending_human_reviews: row.current.pending_human_reviews, released_subtracks: row.current.released_subtracks }));
  const target = files.at(-1), temporary = target + '.tmp';
  fs.writeFileSync(temporary, csv(rows, ['career', 'required', 'baseline_authored', 'current_authored', 'added_authored', 'baseline_missing', 'current_missing', 'pending_human_reviews', 'released_subtracks']), { flag: 'wx' });
  fs.renameSync(temporary, target);
  console.log(JSON.stringify({ output: directory, files: files.map(file => path.basename(file)), added_subtracks: result.newCourses.length, remaining_subtracks: result.remaining.length }, null, 2));
}
if (require.main === module) {
  try { main(process.argv.slice(2)); } catch (error) { console.error(error.message); process.exitCode = 1; }
}
module.exports = { summarize, main };
