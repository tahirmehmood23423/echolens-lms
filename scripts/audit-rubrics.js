'use strict';
/**
 * Rubric audit for every free self-paced course.
 *
 * The AI grader can only be as good as what it is given. A correct C submission
 * was once marked 0 because the grader never received the problem's `criteria`
 * - the same "What we're looking for" checklist the student sees. That hole is
 * fixed in ai.js/server.js; this script guards the other half: that every
 * problem actually HAS a usable rubric to send.
 *
 * Checks, per problem:
 *   criteria      - present, and not a single vague line
 *   solution      - a reference answer for the grader to compare against
 *   expected      - code tasks state their expected output in the brief
 *   brief         - long enough to be gradable at all
 *   contradiction - a criterion that asks for a value to stay UNCHANGED is the
 *                   exact shape that used to trip the grader up; flagged so the
 *                   wording can be checked by hand.
 *
 * Usage:  node scripts/audit-rubrics.js [--json] [--all]
 *   --all   include paid/staged tracks too (default: free tracks only)
 */
const path = require('path');
const os = require('os');
const crypto = require('crypto');
process.env.DB_PATH = process.env.DB_PATH || path.join(os.tmpdir(), `echolens-audit-${crypto.randomUUID()}.json`);

const { Quests } = require('../store');

const JSON_OUT = process.argv.includes('--json');
const ALL = process.argv.includes('--all');

// The SAME extractor the grader uses, so what this audit reports is exactly
// what the grader will and will not receive.
const { expectedOutputOf: expectedOutput } = require('../problem-rubric');

const CODE_LANGS = new Set(['c', 'cpp', 'python', 'javascript', 'java', 'go', 'sql', 'web']);

function auditProblem(track, level, problem) {
  const issues = [];
  const criteria = Array.isArray(problem.criteria) ? problem.criteria.filter(Boolean) : [];
  const lang = problem.language || track.default_language;
  const isCode = CODE_LANGS.has(String(lang || '').toLowerCase());

  if (!criteria.length) {
    issues.push(['error', 'no criteria - the grader has no rubric and must invent its own standard']);
  } else {
    if (criteria.length === 1 && criteria[0].length < 40) {
      issues.push(['warn', 'a single short criterion is thin - the grader will fill the gaps itself']);
    }
    for (const c of criteria) {
      if (String(c).trim().length < 15) issues.push(['warn', `criterion too terse to grade: "${c}"`]);
    }
    // The pass-by-value shape: "stays unchanged" reads to a weak model as
    // "nothing happened", which is how correct work got marked wrong.
    if (criteria.some((c) => /\bunchanged\b|\bstill exactly\b|\bnot? (?:change|modif)/i.test(c))) {
      issues.push(['note', 'rubric asks for something to stay UNCHANGED - the shape that broke grading before']);
    }
  }

  if (!problem.solution) issues.push(['warn', 'no reference solution for the grader to compare against']);
  if (String(problem.description || '').trim().length < 60) issues.push(['error', 'brief too short to grade']);
  if (isCode && !expectedOutput(problem)) {
    issues.push(['warn', 'code task with no parsable "Expected Output:" block in the brief']);
  }
  const pass = problem.pass_mark ?? track.pass_mark;
  if (pass == null) issues.push(['warn', 'no pass mark on the problem or the track']);

  return issues.map(([level_, message]) => ({
    severity: level_,
    track: track.key,
    course: track.course_code || track.key,
    level: level.no,
    lesson: level.title,
    problem: problem.title,
    message,
  }));
}

function run() {
  const tracks = Quests.tracks({ includeUnpublished: true })
    .map((t) => Quests.trackDef(t.key))
    .filter(Boolean)
    .filter((t) => (ALL ? true : t.free));

  const findings = [];
  let problems = 0;
  for (const t of tracks) {
    for (const level of t.levels || []) {
      for (const p of level.problems || []) {
        problems += 1;
        findings.push(...auditProblem(t, level, p));
      }
    }
    if (t.capstone) {
      problems += 1;
      findings.push(...auditProblem(t, { no: 0, title: 'Capstone' }, { ...t.capstone, language: null }));
    }
  }

  if (JSON_OUT) {
    console.log(JSON.stringify({ tracks: tracks.length, problems, findings }, null, 2));
    return findings.some((f) => f.severity === 'error') ? 1 : 0;
  }

  const bySeverity = { error: [], warn: [], note: [] };
  for (const f of findings) bySeverity[f.severity].push(f);

  console.log(`Rubric audit - ${tracks.length} ${ALL ? '' : 'free '}tracks, ${problems} problems\n`);
  for (const sev of ['error', 'warn', 'note']) {
    const rows = bySeverity[sev];
    console.log(`${sev.toUpperCase()}: ${rows.length}`);
    // Group identical messages so a systemic gap reads as one line, not 200.
    const byMessage = new Map();
    for (const r of rows) {
      if (!byMessage.has(r.message)) byMessage.set(r.message, []);
      byMessage.get(r.message).push(r);
    }
    for (const [message, rs] of [...byMessage].sort((a, b) => b[1].length - a[1].length)) {
      console.log(`  ${rs.length.toString().padStart(4)}x  ${message}`);
      for (const r of rs.slice(0, 4)) console.log(`          ${r.course} L${r.level} "${r.problem}"`);
      if (rs.length > 4) console.log(`          ... and ${rs.length - 4} more`);
    }
    console.log('');
  }

  const perCourse = new Map();
  for (const f of findings.filter((x) => x.severity !== 'note')) {
    perCourse.set(f.course, (perCourse.get(f.course) || 0) + 1);
  }
  if (perCourse.size) {
    console.log('Issues by course:');
    for (const [course, n] of [...perCourse].sort((a, b) => b[1] - a[1])) console.log(`  ${String(n).padStart(4)}  ${course}`);
  } else {
    console.log('No errors or warnings - every problem carries a gradable rubric.');
  }
  return bySeverity.error.length ? 1 : 0;
}

process.exitCode = run();
