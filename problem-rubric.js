'use strict';

/**
 * What the automatic grader is told about a problem.
 *
 * This exists because the grader used to be told almost nothing: it received
 * the title, the brief and the code, but NOT the `criteria` - the very
 * "What we're looking for" checklist the student is shown. With no rubric it
 * invented its own standard, and marked a textbook-correct C submission 0.
 *
 * Keeping the extraction here means server.js (which grades) and
 * scripts/audit-rubrics.js (which checks every course is gradable) can never
 * drift apart: whatever the audit says the grader will see, it really sees.
 */

/**
 * The expected output stated in a brief. Course content uses two shapes and
 * both are real, so both must parse - an earlier version handled only the
 * block form and would have silently sent no target for 148 problems:
 *
 *   Expected Output:            (block, FC-01 / FC-02)
 *   Original Price in main: 100
 *
 *   Expected Output: Total: 50.0 | Type: <class 'float'>   (inline, CS-104)
 */
function expectedOutputOf(problem) {
  if (!problem) return null;
  if (problem.expected_output) return String(problem.expected_output).trim() || null;
  const brief = String(problem.description || '');
  const m = brief.match(/Expected Output:[ \t]*(?:\r?\n([\s\S]*?)(?:\r?\n[ \t]*\r?\n|$)|([^\r\n]+))/i);
  if (!m) return null;
  const value = (m[1] != null ? m[1] : m[2] || '').trim();
  return value || null;
}

/** The sample input a brief states, if any - context the grader needs to judge output. */
function sampleInputOf(problem) {
  if (!problem) return null;
  const m = String(problem.description || '').match(/(?:Sample )?Input:[ \t]*(?:\r?\n([\s\S]*?)(?:\r?\n[ \t]*\r?\n|$)|([^\r\n]+))/i);
  if (!m) return null;
  const value = (m[1] != null ? m[1] : m[2] || '').trim();
  return !value || /^none$/i.test(value) ? null : value;
}

/** Everything about a problem that should reach the grader, in one object. */
function graderContext(problem, track) {
  return {
    criteria: (Array.isArray(problem?.criteria) ? problem.criteria : []).filter(Boolean),
    solution: problem?.solution || null,
    expectedOutput: expectedOutputOf(problem),
    sampleInput: sampleInputOf(problem),
    passMark: problem?.pass_mark ?? track?.pass_mark ?? 60,
  };
}

module.exports = { expectedOutputOf, sampleInputOf, graderContext };
