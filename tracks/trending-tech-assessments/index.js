'use strict';
/**
 * Assessments for the Top Trending Tech courses (TT-01..TT-06), keyed by the
 * catalogue's assignment code (A1.1 .. A6.12):
 *   quizzes[code] - five auto-checked multiple-choice questions per lecture
 *   tasks[code]   - a compiler-solvable coding task, only where the browser
 *                   compiler can genuinely do the work
 * Answer keys never leave the server: see publicQuiz() and gradeQuiz().
 */
const crypto = require('node:crypto');
const parts = ['tt-01', 'tt-02', 'tt-03', 'tt-04', 'tt-05', 'tt-06'].map((name) => require(`./${name}`));

// Authors tend to put the right answer in the same slot. Shuffle each
// question's options with a seed derived from the question itself, so the
// order is stable across restarts (stored answers stay valid) but the
// correct option lands evenly across A-D.
function seededOrder(seed, n) {
  const order = [...Array(n).keys()];
  for (let i = n - 1; i > 0; i--) {
    const j = crypto.createHash('sha256').update(`${seed}#${i}`).digest().readUInt32BE(0) % (i + 1);
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
}
function buildQuestion(code, index, [question, options, answer, explanation]) {
  const order = seededOrder(`${code}:${index}:${question}`, options.length);
  return {
    id: index + 1,
    question,
    options: order.map((i) => options[i]),
    answer: order.indexOf(answer),
    explanation,
  };
}

const quizzes = {};
const tasks = {};
for (const part of parts) {
  for (const [code, rows] of Object.entries(part.quizzes)) quizzes[code] = rows.map((row, index) => buildQuestion(code, index, row));
  Object.assign(tasks, part.tasks);
}

/** The learner-facing copy: questions and options, never the answer key. */
function publicQuiz(quiz) {
  if (!quiz || !Array.isArray(quiz.questions)) return null;
  return { questions: quiz.questions.map((q) => ({ id: q.id, question: q.question, options: q.options.slice() })) };
}

/**
 * Scores submitted answers (an array of option indexes, one per question).
 * Returns {error} for malformed input, otherwise the percentage score and a
 * per-question breakdown (with the explanation) to show after submission.
 */
function gradeQuiz(quiz, answers) {
  const questions = quiz?.questions || [];
  if (!questions.length) return { error: 'This quiz has no questions.' };
  if (!Array.isArray(answers) || answers.length !== questions.length) return { error: `Answer all ${questions.length} questions before submitting.` };
  const results = questions.map((q, i) => {
    const chosen = answers[i];
    if (!Number.isInteger(chosen) || chosen < 0 || chosen >= q.options.length) return null;
    return { id: q.id, chosen, correct: chosen === q.answer, correct_option: q.answer, explanation: q.explanation };
  });
  if (results.some((r) => r == null)) return { error: 'Choose one option for every question.' };
  const correct = results.filter((r) => r.correct).length;
  return { score: Math.round((correct / questions.length) * 100), correct, total: questions.length, results };
}

module.exports = { quizzes, tasks, publicQuiz, gradeQuiz };
