'use strict';

/**
 * EchoLens AI copilot - provider layer (v5)
 *
 * Teacher-facing only. Free-tier friendly by design:
 *  - Providers: Google Gemini (default) or Groq. Swap with one env var -
 *    no code changes - so moving to paid models later is a config change.
 *  - Per-user rate limit protects free-tier quotas.
 *  - Privacy: callers must never pass student names or emails. Submissions
 *    are graded anonymously (free tiers may train on inputs).
 *
 * Env:
 *   AI_PROVIDER=gemini | groq        (default gemini)
 *   GEMINI_API_KEY=...               (free at aistudio.google.com)
 *   GROQ_API_KEY=...                 (free at console.groq.com)
 *   AI_MODEL=...                     (optional override)
 *   AI_HOURLY_LIMIT=30               (per user per hour)
 */

const PROVIDER = (process.env.AI_PROVIDER || 'gemini').toLowerCase();
const GEMINI_KEY = process.env.GEMINI_API_KEY || '';
const GROQ_KEY = process.env.GROQ_API_KEY || '';
const MODEL = process.env.AI_MODEL || (PROVIDER === 'groq' ? 'llama-3.3-70b-versatile' : 'gemini-2.0-flash');
const HOURLY_LIMIT = Number(process.env.AI_HOURLY_LIMIT || 30);

function enabled() {
  return PROVIDER === 'groq' ? !!GROQ_KEY : !!GEMINI_KEY;
}

/* ------------------------------ rate limiting ------------------------------ */
const usage = new Map(); // userId -> { count, resetAt }
function checkLimit(userId) {
  const now = Date.now();
  let u = usage.get(userId);
  if (!u || now > u.resetAt) { u = { count: 0, resetAt: now + 3600_000 }; usage.set(userId, u); }
  if (u.count >= HOURLY_LIMIT) {
    const mins = Math.ceil((u.resetAt - now) / 60000);
    const err = new Error(`AI hourly limit reached - try again in about ${mins} minutes.`);
    err.status = 429;
    throw err;
  }
  u.count += 1;
}

/* ------------------------------- providers ------------------------------- */
async function callGemini(system, messages) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_KEY}`;
  const contents = messages.map((m) => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }));
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: system }] },
      contents,
      generationConfig: { temperature: 0.4, maxOutputTokens: 2048 },
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error?.message || `Gemini error (${res.status}).`);
  const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') || '';
  if (!text) throw new Error('The AI returned an empty answer - try again.');
  return text;
}

async function callGroq(system, messages) {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${GROQ_KEY}` },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: 'system', content: system }, ...messages],
      temperature: 0.4, max_tokens: 2048,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error?.message || `Groq error (${res.status}).`);
  const text = data.choices?.[0]?.message?.content || '';
  if (!text) throw new Error('The AI returned an empty answer - try again.');
  return text;
}

async function complete(userId, system, messages) {
  if (!enabled()) { const e = new Error('AI is not configured. Set GEMINI_API_KEY or GROQ_API_KEY in the environment.'); e.status = 503; throw e; }
  checkLimit(userId);
  return PROVIDER === 'groq' ? callGroq(system, messages) : callGemini(system, messages);
}

/* ------------------------------ copilot tasks ------------------------------ */
const BASE = 'You are the EchoLens teaching copilot, helping teachers at an AI education academy in Pakistan. Be concrete, practical, and concise. Answer in clear English.';

async function chat(userId, messages) {
  const trimmed = messages.slice(-12).map((m) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: String(m.content).slice(0, 4000) }));
  return complete(userId, BASE + ' You help with lesson planning, explaining concepts, writing examples, and any teaching question.', trimmed);
}

async function gradeDraft(userId, { assignmentTitle, assignmentBrief, points, studentNote, fileText, fileName }) {
  const system = BASE + `
You draft assignment feedback for a TEACHER to review - you never grade finally; the teacher decides.
Reply in EXACTLY this format:
GRADE: <number 0-100>
REMARKS: <2-4 sentences of specific, encouraging feedback for the student: what was done well, what to improve>
RATIONALE: <1-2 sentences for the teacher only, explaining the suggested grade>
If you cannot read the submission content, base the draft on what you have, suggest a conservative grade, and say so in the rationale.`;
  const content = `Assignment: ${assignmentTitle} (out of ${points} points)
Brief: ${assignmentBrief || 'Not provided.'}
Student note: ${studentNote || 'None.'}
Submitted file: ${fileName || 'unknown'}
Submission content:
${fileText ? fileText.slice(0, 14000) : '[File content not readable as text - PDF/image/binary. Draft from the brief and note only.]'}`;
  const raw = await complete(userId, system, [{ role: 'user', content }]);
  const grade = Number((raw.match(/GRADE:\s*(\d{1,3})/i) || [])[1]);
  const remarks = ((raw.match(/REMARKS:\s*([\s\S]*?)(?=RATIONALE:|$)/i) || [])[1] || '').trim();
  const rationale = ((raw.match(/RATIONALE:\s*([\s\S]*)$/i) || [])[1] || '').trim();
  return {
    grade: Number.isFinite(grade) ? Math.max(0, Math.min(100, grade)) : null,
    remarks: remarks || raw.trim().slice(0, 600),
    rationale,
  };
}

async function quiz(userId, { topic, content, count, level }) {
  const system = BASE + ' You write quizzes teachers can use directly. Output clean markdown only - no preamble.';
  const prompt = `Write a ${count || 5}-question multiple-choice quiz${level ? ` at ${level} level` : ''} on: ${topic}.
${content ? 'Base it strictly on this lesson content:\n' + String(content).slice(0, 10000) : ''}
Format each question as:
**Q1. <question>**
A) ... B) ... C) ... D) ...
Then at the very end add an "Answer key" section listing the correct letters with one-line explanations.`;
  return complete(userId, system, [{ role: 'user', content: prompt }]);
}

async function outline(userId, { topic, weeks, audience }) {
  const system = BASE + ' You design course curricula. Output clean markdown only - no preamble.';
  const prompt = `Design a ${weeks || 6}-week course outline on "${topic}" for ${audience || 'beginners in Pakistan learning practical AI skills'}.
For each week give: a title, 3-4 bullet topics, one hands-on exercise, and one assignment idea. End with 3 capstone project ideas.`;
  return complete(userId, system, [{ role: 'user', content: prompt }]);
}

async function skillReport(userId, { courseTitle, performance }) {
  const system = BASE + ` You write end-of-course skill reports that a TEACHER reviews before a student sees them.
Refer to the learner only as "you" - never invent a name. Output clean markdown with EXACTLY these sections:
## Strengths
## Areas to improve
## Recommended focus domain
## Suggested next steps
Base every claim strictly on the performance data given. Be encouraging but honest; 150-250 words total.`;
  const content = `Course: ${courseTitle}\nPerformance data (grades are percentages):\n${performance}`;
  return complete(userId, system, [{ role: 'user', content }]);
}

async function classSummary(userId, { courseTitle, table }) {
  const system = BASE + ' You analyse class performance for the teacher. Output clean markdown: 1) overall picture in 2-3 sentences, 2) topics/assignments the class struggled with, 3) students-at-risk patterns (refer to students by row number only, never names), 4) three concrete teaching actions for next week.';
  return complete(userId, system, [{ role: 'user', content: `Course: ${courseTitle}\nAnonymised class data:\n${table}` }]);
}

async function review(userId, { problemTitle, problemBrief, points, solutionGuideline, studentNote, fileText, fileName }) {
  const system = BASE + ` You review a student's submitted solution FOR THE TEACHER. The teacher decides the final score - you only assist.
Reply in EXACTLY this format (keep every heading):
QUESTION SUMMARY: <2 lines: what the problem asked>
SOLUTION SUMMARY: <2-3 lines: what the student actually did>
KEY CONCEPTS GRASPED: <comma-separated concepts the student demonstrably used correctly>
MISTAKES: <bullet-like lines of concrete errors or gaps; write "None found" if genuinely none>
BETTER APPROACH: <2-3 lines: how the solution could be improved>
SUGGESTED SCORE: <number 0-100>
Base everything strictly on the submission text. If the content was unreadable, say so and suggest a conservative score.`;
  const content = `Problem: ${problemTitle} (out of ${points} points)
Brief: ${problemBrief || 'Not provided.'}
${solutionGuideline ? 'Teacher solution guideline (private): ' + solutionGuideline : ''}
Student note: ${studentNote || 'None.'}
Submitted file: ${fileName || 'unknown'}
Submission content:
${fileText ? fileText.slice(0, 14000) : '[Content not readable as text.]'}`;
  const raw = await complete(userId, system, [{ role: 'user', content }]);
  const grab = (label, next) => ((raw.match(new RegExp(label + ':\\s*([\\s\\S]*?)(?=' + next + ':|$)', 'i')) || [])[1] || '').trim();
  return {
    question_summary: grab('QUESTION SUMMARY', 'SOLUTION SUMMARY'),
    solution_summary: grab('SOLUTION SUMMARY', 'KEY CONCEPTS GRASPED'),
    key_concepts: grab('KEY CONCEPTS GRASPED', 'MISTAKES'),
    mistakes: grab('MISTAKES', 'BETTER APPROACH'),
    better_approach: grab('BETTER APPROACH', 'SUGGESTED SCORE'),
    suggested_score: (() => { const n = Number((raw.match(/SUGGESTED SCORE:\s*(\d{1,3})/i) || [])[1]); return Number.isFinite(n) ? Math.max(0, Math.min(100, n)) : null; })(),
    raw,
  };
}

module.exports = { enabled, provider: () => PROVIDER, model: () => MODEL, chat, gradeDraft, quiz, outline, skillReport, classSummary, review };
