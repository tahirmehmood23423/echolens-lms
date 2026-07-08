'use strict';

/**
 * EchoLens AI copilot - provider layer (v9)
 *
 * Teacher-facing only. Free-tier friendly by design:
 *  - Providers: Google Gemini (default) or Groq. Swap with one env var.
 *  - Automatic fallback: if BOTH keys are set and the primary provider fails
 *    with a quota/billing/rate error (or a 5xx), the call is retried on the
 *    other provider automatically. Teachers never see raw billing errors.
 *  - Per-user rate limit protects free-tier quotas.
 *  - Privacy: callers must never pass student names or emails.
 *
 * Env:
 *   AI_PROVIDER=gemini | groq        (default gemini)
 *   GEMINI_API_KEY=...               (free at aistudio.google.com)
 *   GROQ_API_KEY=...                 (free at console.groq.com)
 *   AI_MODEL=...                     (optional override for the PRIMARY provider)
 *   AI_HOURLY_LIMIT=30               (per user per hour)
 */

const PROVIDER = (process.env.AI_PROVIDER || 'gemini').toLowerCase();
const GEMINI_KEY = process.env.GEMINI_API_KEY || '';
const GROQ_KEY = process.env.GROQ_API_KEY || '';

// gemini-2.0-flash is being retired and its free-tier quotas collapsed;
// flash-lite has the most generous free quota of the 2.5 family.
const GEMINI_DEFAULT = 'gemini-2.5-flash-lite';
const GROQ_DEFAULT = 'llama-3.3-70b-versatile';
const MODEL = process.env.AI_MODEL || (PROVIDER === 'groq' ? GROQ_DEFAULT : GEMINI_DEFAULT);
const HOURLY_LIMIT = Number(process.env.AI_HOURLY_LIMIT || 30);

function enabled() {
  return !!(GEMINI_KEY || GROQ_KEY);
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

/* --------------------------- error classification --------------------------- */
function isRetryable(status, message) {
  if (status === 429 || status === 402 || (status >= 500 && status < 600)) return true;
  const m = String(message || '').toLowerCase();
  return /quota|billing|exceeded|resource.?exhausted|rate.?limit|overloaded|unavailable/.test(m);
}
function friendly(providerName, status, rawMessage) {
  const m = String(rawMessage || '').toLowerCase();
  if (status === 429 || /quota|resource.?exhausted|rate.?limit/.test(m)) {
    return `${providerName} free-tier quota is used up for now. It resets automatically (per-minute limits within a minute, daily limits at midnight Pacific). No billing is required - just wait, or set the other provider's key so the app can switch automatically.`;
  }
  if (/billing|payment/.test(m) || status === 402) {
    return `${providerName} says this API key's project needs attention (billing/quota). Easiest fix: create a fresh free key (Gemini: aistudio.google.com, Groq: console.groq.com) and update the environment variable - no payment needed for free-tier use.`;
  }
  if (status === 401 || status === 403 || /api key|permission|unauthorized/.test(m)) {
    return `${providerName} rejected the API key. Check the key in the server environment (no extra spaces) and that the key is active.`;
  }
  if (status >= 500) return `${providerName} is having a temporary problem (${status}). Try again in a minute.`;
  return rawMessage || `${providerName} error (${status}).`;
}

/* ------------------------------- providers ------------------------------- */
async function callGemini(system, messages, model) {
  const useModel = model || (PROVIDER === 'gemini' ? MODEL : GEMINI_DEFAULT);
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${useModel}:generateContent?key=${GEMINI_KEY}`;
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
  if (!res.ok) {
    const raw = data.error?.message || `Gemini error (${res.status}).`;
    const err = new Error(friendly('Gemini', res.status, raw));
    err.status = res.status; err.retryable = isRetryable(res.status, raw);
    throw err;
  }
  const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') || '';
  if (!text) { const e = new Error('The AI returned an empty answer - try again.'); e.retryable = true; throw e; }
  return text;
}

async function callGroq(system, messages, model) {
  const useModel = model || (PROVIDER === 'groq' ? MODEL : GROQ_DEFAULT);
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${GROQ_KEY}` },
    body: JSON.stringify({
      model: useModel,
      messages: [{ role: 'system', content: system }, ...messages],
      temperature: 0.4, max_tokens: 2048,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const raw = data.error?.message || `Groq error (${res.status}).`;
    const err = new Error(friendly('Groq', res.status, raw));
    err.status = res.status; err.retryable = isRetryable(res.status, raw);
    throw err;
  }
  const text = data.choices?.[0]?.message?.content || '';
  if (!text) { const e = new Error('The AI returned an empty answer - try again.'); e.retryable = true; throw e; }
  return text;
}

/* ------------------------- completion with fallback ------------------------- */
async function complete(userId, system, messages) {
  if (!enabled()) { const e = new Error('AI is not configured. Set GEMINI_API_KEY or GROQ_API_KEY in the environment.'); e.status = 503; throw e; }
  checkLimit(userId);

  const primaryIsGroq = PROVIDER === 'groq';
  const primary = primaryIsGroq ? { fn: callGroq, ok: !!GROQ_KEY, name: 'Groq' } : { fn: callGemini, ok: !!GEMINI_KEY, name: 'Gemini' };
  const backup = primaryIsGroq ? { fn: callGemini, ok: !!GEMINI_KEY, name: 'Gemini' } : { fn: callGroq, ok: !!GROQ_KEY, name: 'Groq' };

  if (!primary.ok && backup.ok) return backup.fn(system, messages);

  try {
    return await primary.fn(system, messages);
  } catch (err) {
    if (err.retryable && backup.ok) {
      console.warn(`[ai] ${primary.name} failed (${err.message}) - falling back to ${backup.name}.`);
      return backup.fn(system, messages);
    }
    throw err;
  }
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

async function overallReport(userId, { performance }) {
  const system = BASE + ` You write an OVERALL learning report covering EVERY course a learner has taken, which a TEACHER reviews before the learner sees it.
Refer to the learner only as "you" - never invent a name. Output clean markdown with EXACTLY these sections:
## Overall picture
## Strengths across courses
## Areas to improve
## Recommended direction
## Suggested next steps
Base every claim strictly on the performance data given. Compare progress between courses where useful. Be encouraging but honest; 200-320 words total.`;
  return complete(userId, system, [{ role: 'user', content: `Performance data across all courses (grades are percentages):\n${performance}` }]);
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

/* --------------------------- integrity (teacher-only) --------------------------- */
// Estimates how likely a submission was AI-generated. This is a SIGNAL for
// the teacher, never proof - the response says so explicitly. Combined
// server-side with cross-student similarity for the full integrity report.
async function integrity(userId, { problemTitle, problemBrief, text, kind }) {
  const system = BASE + ` You are an academic-integrity assistant for TEACHERS. Analyse whether a student ${kind === 'written' ? 'written answer' : 'code submission'} shows signs of being AI-generated. You are advisory only - never proof.
Reply in EXACTLY this format:
AI LIKELIHOOD: <number 0-100, your estimated probability the work is largely AI-generated>
VERDICT: <one of: Likely original / Unclear / Possibly AI-assisted / Likely AI-generated>
INDICATORS: <2-4 short lines of concrete observations, e.g. commenting style, vocabulary vs level, boilerplate patterns, over-perfection>
ADVICE: <1-2 lines: what the teacher should do next, e.g. a quick viva question to ask the student>`;
  const content = `Problem: ${problemTitle}\nBrief: ${problemBrief || 'Not provided.'}\nStudent submission:\n${String(text || '').slice(0, 14000) || '[Empty]'}`;
  const raw = await complete(userId, system, [{ role: 'user', content }]);
  const grab = (label, next) => ((raw.match(new RegExp(label + ':\\s*([\\s\\S]*?)(?=' + next + ':|$)', 'i')) || [])[1] || '').trim();
  const n = Number((raw.match(/AI LIKELIHOOD:\s*(\d{1,3})/i) || [])[1]);
  return {
    ai_likelihood: Number.isFinite(n) ? Math.max(0, Math.min(100, n)) : null,
    verdict: grab('VERDICT', 'INDICATORS') || 'Unclear',
    indicators: grab('INDICATORS', 'ADVICE'),
    advice: grab('ADVICE', '$$$'),
  };
}

// Structured quiz for the live pop-quiz feature: strict JSON the server can store.
async function quizJson(userId, { topic, content, count, level }) {
  const system = BASE + ' You write multiple-choice quizzes. Reply with ONLY a JSON array, no markdown, no backticks, no preamble.';
  const prompt = `Write exactly ${Math.max(1, Math.min(20, Number(count) || 5))} multiple-choice questions${level ? ` at ${level} level` : ''} on: ${topic}.
${content ? 'Base them strictly on this content:\n' + String(content).slice(0, 8000) : ''}
JSON schema: [{"q":"question text","options":["A","B","C","D"],"answer":0}] where answer is the INDEX of the correct option. Reply with the JSON array only.`;
  const raw = await complete(userId, system, [{ role: 'user', content: prompt }]);
  const cleaned = raw.replace(/```json|```/g, '').trim();
  const start = cleaned.indexOf('['), end = cleaned.lastIndexOf(']');
  if (start === -1 || end === -1) { const e = new Error('The AI reply was not valid quiz JSON - try again.'); e.status = 502; throw e; }
  const arr = JSON.parse(cleaned.slice(start, end + 1));
  return arr.filter((q) => q && q.q && Array.isArray(q.options) && q.options.length >= 2);
}

module.exports = { enabled, provider: () => PROVIDER, model: () => MODEL, chat, gradeDraft, quiz, quizJson, outline, skillReport, overallReport, classSummary, review, integrity };
