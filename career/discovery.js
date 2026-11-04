'use strict';
/**
 * Career Discovery - pure logic, no storage access.
 *
 * 1. ONBOARDING QUESTIONS: five short, skippable multiple-choice questions.
 *    Answers are self-reported preferences. They are never treated as
 *    verified proficiency.
 *
 * 2. RECOMMENDATIONS: a transparent, rule-based scorer. Every point a track
 *    receives comes from a named rule (an interest, something the student
 *    enjoys, a goal, a technology explored, a strong quiz area), and every
 *    rule that fired becomes a plain-language reason. Rules only ADD points:
 *    low prior knowledge or a low quiz score never lowers a track, so a
 *    beginner with no Python is still free to be shown, and to choose, AI/ML.
 *    The quiz changes the suggested STARTING POINT, not which careers are open.
 *    The whole rule table is configuration, editable by admins.
 */

const QUESTIONS = [
  { id: 'interests', title: 'What interests you?', hint: 'Choose as many as you like.', multi: true, options: [
    ['websites', 'Building websites'], ['mobile', 'Creating mobile applications'], ['ai', 'Artificial intelligence'],
    ['data', 'Working with data'], ['security', 'Cybersecurity'], ['cloud', 'Cloud and infrastructure'],
    ['software', 'Building software'], ['problems', 'Solving programming problems'], ['testing', 'Testing applications'],
    ['unsure', 'Not sure yet'],
  ] },
  { id: 'experience', title: 'How much programming have you learned?', hint: 'There is no wrong answer - beginners are very welcome.', multi: false, options: [
    ['never', 'I have never programmed'], ['basics', 'I know basic concepts'], ['simple', 'I can write simple programs'],
    ['projects', 'I have built small projects'], ['experienced', 'I have experience developing applications'],
  ] },
  { id: 'technologies', title: 'Which technologies have you explored?', hint: 'Choose any you have tried, even briefly.', multi: true, options: [
    ['python', 'Python'], ['c_cpp', 'C/C++'], ['java', 'Java'], ['javascript', 'JavaScript'], ['html_css', 'HTML/CSS'],
    ['sql', 'SQL'], ['git', 'Git/GitHub'], ['none', 'None yet'],
  ] },
  { id: 'goal', title: 'What is your learning goal?', hint: 'Pick the one that fits best right now.', multi: false, options: [
    ['explore', 'Explore computer science'], ['first_language', 'Learn my first programming language'],
    ['practical', 'Develop practical technical skills'], ['internship', 'Prepare for internships'],
    ['job', 'Prepare for entry-level jobs'], ['improve', 'Improve my existing technical skills'],
    ['switch', 'Switch to a different technology career'],
  ] },
  { id: 'enjoy', title: 'What do you enjoy doing?', hint: 'Choose as many as you like.', multi: true, options: [
    ['design', 'Designing visual interfaces'], ['logic', 'Solving logical problems'], ['analysis', 'Analyzing information'],
    ['systems', 'Understanding how systems work'], ['intelligent', 'Exploring intelligent technologies'],
    ['protect', 'Protecting systems and information'],
  ] },
];
const QMAP = new Map(QUESTIONS.map((q) => [q.id, q]));
const label = (qid, opt) => (QMAP.get(qid)?.options.find(([id]) => id === opt) || [])[1] || opt;

/** Clean submitted answers: unknown options dropped, multi-select de-duplicated, everything optional. */
function cleanAnswers(raw = {}) {
  const out = {};
  for (const q of QUESTIONS) {
    const ids = q.options.map(([id]) => id), v = raw[q.id];
    if (q.multi) {
      let list = [...new Set([].concat(v || []).map(String))].filter((x) => ids.includes(x));
      // "Not sure yet" / "None yet" cannot be combined with real choices.
      if (list.length > 1) list = list.filter((x) => x !== 'unsure' && x !== 'none');
      if (list.length) out[q.id] = list;
    } else if (ids.includes(String(v))) out[q.id] = String(v);
  }
  return out;
}

/* ------------------------------ matching rules ------------------------------ */
const FE = 'frontend-web-developer', BE = 'backend-developer', FS = 'full-stack-web-developer', MO = 'mobile-app-developer',
  ML = 'ai-machine-learning-engineer', GA = 'generative-ai-llm-developer', DA = 'data-analyst-business-intelligence',
  DE = 'data-engineer', SC = 'cybersecurity-analyst', OP = 'cloud-devops-engineer', QA = 'software-qa-test-automation',
  SE = 'software-engineering-dsa';

const DEFAULT_CONFIG = {
  enabled: true,
  version: 1,
  top_n: 3,
  // Points per matching rule. Interests and enjoyment matter most; technologies
  // explored and strong quiz areas are small, positive-only nudges.
  weights: { interests: 3, enjoy: 2, goal: 1, technologies: 1, quiz: 1 },
  interests: {
    websites: [FE, FS, BE], mobile: [MO], ai: [ML, GA], data: [DA, DE, ML], security: [SC], cloud: [OP, DE],
    software: [SE, BE, FS], problems: [SE, BE], testing: [QA], unsure: [],
  },
  enjoy: {
    design: [FE, MO], logic: [SE, BE, QA], analysis: [DA, ML, DE], systems: [OP, BE, SC], intelligent: [GA, ML], protect: [SC, QA],
  },
  goal: { explore: [], first_language: [], practical: [], internship: [], job: [], improve: [], switch: [] },
  technologies: {
    python: [ML, GA, DA, DE, BE], c_cpp: [SE], java: [SE, MO, BE], javascript: [FE, FS, BE], html_css: [FE, FS], sql: [DA, DE, BE], git: [OP], none: [],
  },
  // Quiz areas answered strongly (>= quiz_strong %) give a small nudge.
  quiz_strong: 70,
  quiz: {
    'disc.web': [FE, FS], 'disc.data': [DA, DE], 'disc.logic': [SE, QA], 'disc.algorithms': [SE], 'disc.software': [QA, BE],
    'disc.computing': [OP, SC], 'disc.control': [], 'disc.variables': [],
  },
  // Shown when nothing matched (or "Not sure yet"): tracks with gentle first stages.
  beginner_friendly: [FE, DA, SE],
};

/** Validate an admin-edited config. Returns { config } or { error }. */
function validateConfig(c, trackSlugs) {
  if (!c || typeof c !== 'object' || Array.isArray(c)) return { error: 'The configuration must be a JSON object.' };
  const slugs = new Set(trackSlugs), err = (m) => ({ error: m });
  const out = { ...DEFAULT_CONFIG, ...c, weights: { ...DEFAULT_CONFIG.weights, ...(c.weights || {}) } };
  for (const [k, v] of Object.entries(out.weights)) {
    if (!(k in DEFAULT_CONFIG.weights)) return err(`Unknown weight "${k}".`);
    if (typeof v !== 'number' || v < 0 || v > 10) return err(`Weight "${k}" must be a number from 0 to 10.`);
  }
  if (!Number.isInteger(out.top_n) || out.top_n < 1 || out.top_n > 6) return err('top_n must be a whole number from 1 to 6.');
  if (typeof out.quiz_strong !== 'number' || out.quiz_strong < 0 || out.quiz_strong > 100) return err('quiz_strong must be a percentage from 0 to 100.');
  if (typeof out.enabled !== 'boolean') return err('enabled must be true or false.');
  const tables = { interests: 'interests', enjoy: 'enjoy', goal: 'goal', technologies: 'technologies' };
  for (const [key, qid] of Object.entries(tables)) {
    const allowed = new Set(QMAP.get(qid).options.map(([id]) => id)), table = out[key];
    if (!table || typeof table !== 'object' || Array.isArray(table)) return err(`"${key}" must map answer options to lists of track slugs.`);
    for (const [opt, list] of Object.entries(table)) {
      if (!allowed.has(opt)) return err(`"${key}" has an unknown answer option "${opt}".`);
      if (!Array.isArray(list) || list.some((s) => !slugs.has(s))) return err(`"${key}.${opt}" must list known career track slugs.`);
    }
  }
  if (!out.quiz || typeof out.quiz !== 'object' || Array.isArray(out.quiz)) return err('"quiz" must map quiz areas to track slugs.');
  for (const [area, list] of Object.entries(out.quiz)) {
    if (!/^disc\./.test(area)) return err(`"quiz" has an unknown area "${area}".`);
    if (!Array.isArray(list) || list.some((s) => !slugs.has(s))) return err(`"quiz.${area}" must list known career track slugs.`);
  }
  if (!Array.isArray(out.beginner_friendly) || !out.beginner_friendly.length || out.beginner_friendly.some((s) => !slugs.has(s))) return err('beginner_friendly must list at least one known track slug.');
  return { config: out };
}

const joinWords = (list) => (list.length <= 1 ? list.join('') : `${list.slice(0, -1).join(', ')} and ${list[list.length - 1]}`);
const lower = (s) => s.charAt(0).toLowerCase() + s.slice(1);

/** Where a student should start, from the quiz and (self-reported) experience. Never a ceiling. */
function startingPoint(quiz, answers) {
  const exp = answers.experience;
  if (quiz && quiz.score != null) {
    if (quiz.score < 40) return 'foundation';
    if (quiz.score < 75) return 'beginner';
    return ['projects', 'experienced'].includes(exp) ? 'intermediate' : 'beginner';
  }
  if (!exp || exp === 'never' || exp === 'basics') return 'foundation';
  return 'beginner';
}

/**
 * Score every track and explain the top ones.
 *   tracks: [{ slug, title, first_skills: [skill names] }]
 *   quiz:   { score, areas: { 'disc.web': { score, name } } } or null
 * Returns { recommendations: [{ slug, title, score, reasons, start }], all: [{ slug, score }], basis }
 */
function recommend(answers, quiz, tracks, config = DEFAULT_CONFIG) {
  const a = cleanAnswers(answers), w = config.weights;
  const pts = new Map(tracks.map((t) => [t.slug, 0])), why = new Map(tracks.map((t) => [t.slug, { interests: [], enjoy: [], goal: [], technologies: [], quiz: [] }]));
  const add = (key, slugs, text) => { for (const s of slugs || []) if (pts.has(s)) { pts.set(s, pts.get(s) + w[key]); if (!why.get(s)[key].includes(text)) why.get(s)[key].push(text); } };
  for (const opt of a.interests || []) add('interests', config.interests[opt], lower(label('interests', opt)));
  for (const opt of a.enjoy || []) add('enjoy', config.enjoy[opt], lower(label('enjoy', opt)));
  if (a.goal) add('goal', config.goal[a.goal], lower(label('goal', a.goal)));
  for (const opt of a.technologies || []) add('technologies', config.technologies[opt], label('technologies', opt));
  if (quiz && quiz.areas) for (const [area, r] of Object.entries(quiz.areas)) if (r.score != null && r.score >= config.quiz_strong) add('quiz', config.quiz[area], lower(r.name || area));

  const order = new Map(tracks.map((t, i) => [t.slug, i]));
  const ranked = [...pts.entries()].sort((x, y) => y[1] - x[1] || order.get(x[0]) - order.get(y[0]));
  const anyMatch = ranked.some(([, p]) => p > 0);
  const start = startingPoint(quiz, a);
  const pick = anyMatch ? ranked.filter(([, p]) => p > 0).slice(0, config.top_n).map(([s]) => s) : [];
  // Fill with beginner-friendly tracks when there is little to go on (for example "Not sure yet").
  for (const s of config.beginner_friendly) if (pick.length < config.top_n && !pick.includes(s) && pts.has(s)) pick.push(s);

  const byTrack = new Map(tracks.map((t) => [t.slug, t]));
  const recommendations = pick.map((slug) => {
    const t = byTrack.get(slug), r = why.get(slug), reasons = [];
    if (r.interests.length) reasons.push(`You're interested in ${joinWords(r.interests)}.`);
    if (r.enjoy.length) reasons.push(`You enjoy ${joinWords(r.enjoy)}.`);
    if (r.technologies.length) reasons.push(`You've already explored ${joinWords(r.technologies)}, which this track uses.`);
    if (r.quiz.length) reasons.push(`Your quiz answers on ${joinWords(r.quiz)} were strong.`);
    if (!reasons.length) reasons.push('A friendly starting point if you are still exploring: its first stage assumes no experience.');
    const first = (t.first_skills || []).slice(0, 2);
    const startText = start === 'foundation'
      ? `Start from the very beginning${first.length ? ` with ${joinWords(first)}` : ''} - no experience needed.`
      : start === 'beginner' ? `You can begin with ${first.length ? joinWords(first) : 'the first stage'}.`
        : `You may be able to move quickly through ${first.length ? joinWords(first) : 'the first stage'} - a skill check will show you where to start.`;
    return { slug, title: t.title, score: pts.get(slug), matched: pts.get(slug) > 0, reasons, start: startText };
  });
  return { recommendations, all: ranked.map(([slug, score]) => ({ slug, score })), starting_point: start,
    basis: { answers: a, quiz_score: quiz ? quiz.score : null, config_version: config.version } };
}

module.exports = { QUESTIONS, DEFAULT_CONFIG, cleanAnswers, validateConfig, recommend, startingPoint, label };
