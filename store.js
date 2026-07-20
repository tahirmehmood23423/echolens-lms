'use strict';

/**
 * EchoLens LMS - data store (v4)
 * File-backed JSON store, written atomically. Backwards compatible with v3
 * databases: on load, existing data is migrated in place (registration
 * numbers assigned, single instructor_id lifted into instructor_ids, streak
 * fields added, gem_events collection created). Nothing is lost.
 *
 * New in v4:
 *  - users.reg_no        unique 6-7 digit registration number (students)
 *  - role 'coordinator'  read-only oversight role
 *  - batches.instructor_ids  multiple teachers per running course
 *  - gem_events          gems from sources beyond grading (streaks, bonuses)
 *  - streaks             daily activity streaks with milestone bonus gems
 *  - stages              named progression stages derived from total gems
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'echolens.json');
// (usernames are plain handles now - see uniqueUsername; no fake email domain)

/* ------------------------------ stages ------------------------------- */
// Named progression stages. Thresholds assume ~100-point assignments.
const STAGES = [
  { key: 'spark',  name: 'Spark',  min: 0 },
  { key: 'glow',   name: 'Glow',   min: 250 },
  { key: 'beam',   name: 'Beam',   min: 700 },
  { key: 'prism',  name: 'Prism',  min: 1400 },
  { key: 'aurora', name: 'Aurora', min: 2400 },
  { key: 'nova',   name: 'Nova',   min: 4000 },
];
const STREAK_MILESTONES = { 3: 15, 7: 40, 14: 90, 30: 200 }; // day -> bonus gems
const DEFAULT_ASSIGNMENT_POINTS = 100;

const empty = () => ({
  seq: { users: 0, courses: 0, batches: 0, enrollments: 0, sessions: 0, lessons: 0, assignments: 0, submissions: 0, announcements: 0, gem_events: 0, challenges: 0, challenge_submissions: 0, hackathons: 0, hackathon_entries: 0, hackathon_submissions: 0, ai_reports: 0, quests: 0, quest_submissions: 0, course_messages: 0, attendance: 0, quizzes: 0, quiz_attempts: 0, certificates: 0, task_files: 0, events: 0, event_entries: 0, event_submissions: 0, event_comments: 0, leads: 0, open_submissions: 0, registrations: 0, public_announcements: 0, chat_reads: 0, jobs: 0, job_comments: 0, discount_categories: 0, challans: 0, expenses: 0, coordinator_queries: 0, staff_groups: 0, staff_records: 0, ambassadors: 0 },
  issued_usernames: [],
  issued_regnos: [],
  users: [], courses: [], batches: [], enrollments: [], sessions: [], lessons: [], assignments: [], submissions: [], announcements: [], gem_events: [], challenges: [], challenge_submissions: [], hackathons: [], hackathon_entries: [], hackathon_submissions: [], ai_reports: [], quests: [], quest_submissions: [], course_messages: [], chat_reads: [],
  attendance: [], quizzes: [], quiz_attempts: [], certificates: [], task_files: [],
  events: [], event_entries: [], event_submissions: [], event_comments: [], leads: [], open_submissions: [], registrations: [], public_announcements: [],
  jobs: [], job_comments: [],
  discount_categories: [], challans: [], expenses: [], coordinator_queries: [], staff_groups: [], staff_records: [], ambassadors: [],
  settings: {
    cert: { org: 'EchoLens Academy', ceo_name: 'Tahir Mehmood', ceo_sig: null, tagline: 'Gamified Learning, Real Skills' },
    bank: { bank_name: 'Meezan Bank', account_title: 'EchoLens Digital (Pvt) Ltd', account_number: '0123-4567890-123', iban: 'PK36 MEZN 0000 0123 4567 8901', branch: 'Gulberg Branch, Lahore' },
  },
});

let data = empty();

function load() {
  if (fs.existsSync(DB_PATH)) {
    try { data = JSON.parse(fs.readFileSync(DB_PATH, 'utf8')); } catch { data = empty(); }
  }
  const base = empty();
  for (const k of Object.keys(base)) if (data[k] === undefined) data[k] = base[k];
  for (const k of Object.keys(base.seq)) if (data.seq[k] === undefined) data.seq[k] = 0;
  migrate();
}
function save() {
  const tmp = DB_PATH + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
  fs.renameSync(tmp, DB_PATH);
}
function nextId(t) { data.seq[t] += 1; return data.seq[t]; }
function now() { return new Date().toISOString().replace('T', ' ').slice(0, 19); }
function today() { return new Date().toISOString().slice(0, 10); }

/* ---------------------------- v3 -> v4 migration ---------------------------- */
function migrate() {
  let changed = false;
  // Multiple teachers: lift single instructor_id into instructor_ids.
  for (const b of data.batches) {
    if (!Array.isArray(b.instructor_ids)) {
      b.instructor_ids = b.instructor_id ? [Number(b.instructor_id)] : [];
      changed = true;
    }
  }
  // Registration numbers + streak fields for every user.
  for (const u of data.users) {
    if (['student', 'free'].includes(u.role) && !u.reg_no) { u.reg_no = issueRegNo(); changed = true; }
    if (u.streak === undefined) { u.streak = 0; u.best_streak = 0; u.last_active = null; changed = true; }
  }
  // v11: settings block + weekly deadlines on already-installed quests.
  if (!data.settings) { data.settings = empty().settings; changed = true; }
  if (!data.settings.cert) { data.settings.cert = empty().settings.cert; changed = true; }
  if (!data.settings.bank) { data.settings.bank = empty().settings.bank; changed = true; }
  // v17: registration/finance pipeline stage on pre-existing registrations.
  for (const r of data.registrations) {
    if (r.payment_stage === undefined) { r.payment_stage = r.status && r.status.added_to_course ? 'enrolled' : 'new'; changed = true; }
  }
  for (const q of data.quests) {
    if (q.deadline === undefined) { q.deadline = deadlineFromStart((data.batches.find((b) => b.id === q.batch_id) || {}).start_date, q.week); changed = true; }
  }
  // v12: unified events, leads, and their sequence counters.
  for (const t of ['events', 'event_entries', 'event_submissions', 'leads', 'open_submissions', 'registrations', 'public_announcements']) {
    if (!Array.isArray(data[t])) { data[t] = []; changed = true; }
    if (data.seq[t] === undefined) { data.seq[t] = 0; changed = true; }
  }
  // v12: every existing user with an email becomes a lead so the list is complete.
  for (const u of data.users) {
    if (u.email && ['student', 'free'].includes(u.role) && !data.leads.some((l) => l.email === u.email.toLowerCase())) {
      data.leads.push({ id: ++data.seq.leads, name: u.name, email: u.email.toLowerCase(), whatsapp: (u.profile || {}).phone || null, source: u.role === 'free' ? 'open' : 'portal', user_id: u.id, created_at: u.created_at || now(), updated_at: now() });
      changed = true;
    }
  }
  // v18: the Free Micro Courses (FC-01..FC-10) join existing databases on
  // boot - additive only, exactly like "Load official catalogue".
  for (const c of OFFICIAL_CATALOGUE) {
    if (c.code.startsWith('FC-') && !data.courses.some((x) => x.code === c.code)) { Courses.create(c); changed = true; }
  }
  if (changed) save();
}

// Default deadline: end of the quest's week, counted from the cohort start date.
function deadlineFromStart(startDate, week) {
  if (!startDate) return null;
  const d = new Date(startDate + 'T00:00:00');
  if (isNaN(d)) return null;
  d.setDate(d.getDate() + (Number(week) || 1) * 7);
  return d.toISOString().slice(0, 10);
}
const LATE_PENALTY = 0.20; // late submissions lose 20% of earned gems

// Tracks where the built-in compiler makes no sense: no-code automation,
// prompting, design, WordPress, and BI-tool courses. The task portal shows a
// clean written-answer workspace instead. Teachers can override per course.
const NO_IDE_TRACKS = new Set([
  'bc01-automation', 'bc02-prompting', 'bc03-everyday-ai',
  'sc02-genai', 'sc05-ai-tools',
  'st01-wordpress', 'st02-graphic-design', 'st03-uiux', 'st06-ai-agents',
  // August 2026 additions without an in-browser coding component
  // (teachers can still switch the IDE on per batch; SQL+Power BI now
  // defaults ON because the compiler runs SQL natively):
  'bc06-git-freelance', 'bc07-excel-ai', 'bc08-canva-ai',
  'sc08-marketing-seo', 'sc09-freelancing', 'sc10-graphic-basics', 'sc11-content-ai',
  'st11-flutter', 'st12-video-editing',
]);
function ideEnabled(bid) {
  const b = data.batches.find((x) => x.id === Number(bid));
  if (b && b.ide !== undefined && b.ide !== null) return !!b.ide; // teacher override wins
  const q = data.quests.find((x) => x.batch_id === Number(bid));
  return q ? !NO_IDE_TRACKS.has(q.track_key) : true;
}
function setIde(bid, enabled) {
  const b = data.batches.find((x) => x.id === Number(bid)); if (!b) return null;
  b.ide = !!enabled; save();
  return b.ide;
}

/* --------------------------- credential helpers --------------------------- */
function slugify(name) {
  return String(name).toLowerCase().trim().replace(/[^a-z0-9\s.]/g, '').replace(/\s+/g, '.').replace(/\.+/g, '.') || 'user';
}
function uniqueUsername(name) {
  // Plain handle (e.g. "bilal.ahmed"), deliberately NOT email-shaped: a
  // username is not an inbox. Used only for accounts created without an
  // email; everyone else gets a derived category username (below).
  const base = slugify(name);
  let candidate = base, i = 1;
  const taken = new Set([...data.issued_usernames, ...data.users.map((u) => u.username)]);
  while (taken.has(candidate)) { i += 1; candidate = `${base}${i}`; }
  data.issued_usernames.push(candidate);
  return candidate;
}
// v18: accounts registered with an email get a category username - the same
// local part, with the domain swapped for the department's own namespace:
// tahir@gmail.com as a student -> tahir@student.echolens. Sign-in continues
// to accept username, email, or reg no interchangeably.
const ROLE_USERNAME_DOMAIN = {
  student: 'student.echolens', free: 'open.echolens', admin: 'admin.echolens',
  instructor: 'teacher.echolens', coordinator: 'coordinator.echolens',
  hr: 'hr.echolens', finance: 'finance.echolens',
  student_coordinator: 'admissions.echolens', staff: 'staff.echolens',
};
function usernameFromEmail(email, role) {
  const local = String(email || '').split('@')[0].toLowerCase().replace(/[^a-z0-9._-]/g, '') || 'user';
  const domain = ROLE_USERNAME_DOMAIN[role] || 'echolens';
  const taken = new Set([...data.issued_usernames, ...data.users.map((u) => u.username).filter(Boolean)].map((s) => String(s).toLowerCase()));
  let candidate = `${local}@${domain}`, i = 1;
  while (taken.has(candidate)) { i += 1; candidate = `${local}${i}@${domain}`; }
  data.issued_usernames.push(candidate);
  return candidate;
}
function issueRegNo() {
  // Unique 6-7 digit number, never reused (persistent registry).
  const taken = new Set([...(data.issued_regnos || []), ...data.users.map((u) => u.reg_no).filter(Boolean)]);
  let reg;
  do {
    const digits = Math.random() < 0.5 ? 6 : 7;
    const min = 10 ** (digits - 1), max = 10 ** digits - 1;
    reg = String(crypto.randomInt(min, max + 1));
  } while (taken.has(reg));
  data.issued_regnos.push(reg);
  return reg;
}
function randomPassword() {
  const words = ['echo', 'lens', 'nova', 'beam', 'prism', 'delta', 'orbit', 'pixel', 'karachi', 'lahore', 'indus', 'quartz'];
  const w = () => words[crypto.randomInt(words.length)];
  return `${w()}-${w()}-${crypto.randomInt(10, 99)}`;
}

/* -------------------------------- users -------------------------------- */
const Users = {
  byId(id) { return data.users.find((u) => u.id === Number(id)) || null; },
  byLogin(login) {
    const s = String(login).trim().toLowerCase();
    return data.users.find((u) => (u.username && u.username.toLowerCase() === s) || (u.email && u.email.toLowerCase() === s) || (u.reg_no && u.reg_no === s)) || null;
  },
  // v18: one email can back accounts in several portals (each with its own
  // category username), so email lookups can match more than one account.
  allByLogin(login) {
    const s = String(login).trim().toLowerCase();
    return data.users.filter((u) => (u.username && u.username.toLowerCase() === s) || (u.email && u.email.toLowerCase() === s) || (u.reg_no && u.reg_no === s));
  },
  byReg(reg) { return data.users.find((u) => u.reg_no === String(reg).trim()) || null; },
  all() { return data.users.slice().sort((a, b) => a.name.localeCompare(b.name)); },
  countByRole(role) { return data.users.filter((u) => u.role === role).length; },
  create({ name, role, email = null, username = null }) {
    // v18: any account registered with an email gets a derived category
    // username (tahir@gmail.com + student -> tahir@student.echolens),
    // regardless of what the caller passed. Email-less flows keep the
    // name-based handle.
    if (email) username = usernameFromEmail(email, role);
    else username = username || uniqueUsername(name);
    const password = randomPassword();
    const u = {
      id: nextId('users'), name: String(name).trim(), role, username, email,
      reg_no: ['student', 'free'].includes(role) ? issueRegNo() : null,
      password_hash: bcrypt.hashSync(password, 10),
      profile: {}, streak: 0, best_streak: 0, last_active: null, created_at: now(),
    };
    data.users.push(u); save();
    return { user: u, password };
  },
  byGoogleSub(sub) { return data.users.find((u) => u.google_sub === String(sub)) || null; },
  findOrCreateGoogle({ sub, name, email }) {
    let u = Users.byGoogleSub(sub);
    if (u) return u;
    // If the email matches an existing LEARNER account, link Google to it
    // instead of creating a duplicate. Staff/department accounts sharing the
    // email are left alone - the person gets a separate free account, in line
    // with one-email-many-portals.
    u = email ? data.users.find((x) => ['free', 'student'].includes(x.role) && x.email && x.email.toLowerCase() === email.toLowerCase()) : null;
    if (u) { u.google_sub = String(sub); save(); return u; }
    u = {
      id: nextId('users'), name: String(name || 'Learner').trim(), role: 'free',
      username: email ? usernameFromEmail(email, 'free') : null, email: email || null, google_sub: String(sub),
      reg_no: issueRegNo(), password_hash: null,
      profile: {}, streak: 0, best_streak: 0, last_active: null, created_at: now(),
    };
    data.users.push(u); save();
    return u;
  },
  createFixed({ name, role, username, email, password }) {
    const u = {
      id: nextId('users'), name, role, username, email,
      reg_no: role === 'student' ? issueRegNo() : null,
      password_hash: bcrypt.hashSync(password, 10),
      profile: {}, streak: 0, best_streak: 0, last_active: null, created_at: now(),
    };
    data.users.push(u); data.issued_usernames.push(username); save();
    return u;
  },
  // Re-derives the category username after a role change (e.g. a free open
  // account becoming a paying student moves from @open.echolens to
  // @student.echolens). No-op for accounts without an email.
  deriveUsername(id) {
    const u = Users.byId(id); if (!u || !u.email) return u;
    u.username = usernameFromEmail(u.email, u.role); save();
    return u;
  },
  setPassword(id, plain) {
    const u = Users.byId(id); if (!u) return null;
    u.password_hash = bcrypt.hashSync(plain, 10); save();
    return u;
  },
  resetPassword(id) {
    // Admin reset: keeps the account (and all gems, submissions, enrollments).
    const u = Users.byId(id); if (!u) return null;
    const password = randomPassword();
    u.password_hash = bcrypt.hashSync(password, 10); save();
    return { user: u, password };
  },
  // Institute-grade profile fields. Students and staff share the base set;
  // staff get professional fields on top. Unknown keys are dropped.
  PROFILE_FIELDS: {
    base: ['phone', 'dob', 'gender', 'cnic', 'father_name', 'address', 'city', 'education', 'institute', 'emergency_contact', 'goal', 'links'],
    staff: ['designation', 'qualification', 'expertise', 'experience_years', 'joining_date', 'office_hours'],
  },
  updateProfile(id, profile) {
    const u = Users.byId(id); if (!u) return null;
    const allowed = [...Users.PROFILE_FIELDS.base, ...(['instructor', 'admin', 'coordinator'].includes(u.role) ? Users.PROFILE_FIELDS.staff : [])];
    const clean = {};
    for (const k of allowed) if (profile[k] !== undefined) clean[k] = String(profile[k]).slice(0, 300);
    u.profile = { ...(u.profile || {}), ...clean };
    for (const k of Object.keys(u.profile)) if (u.profile[k] === '') delete u.profile[k];
    save();
    return u;
  },
  setAvatar(id, url) { const u = Users.byId(id); if (!u) return null; u.avatar = url; save(); return u; },
  setSignature(id, url) { const u = Users.byId(id); if (!u) return null; u.signature = url; save(); return u; },
  remove(id) {
    const uid = Number(id);
    data.users = data.users.filter((u) => u.id !== uid);
    data.enrollments = data.enrollments.filter((e) => e.user_id !== uid);
    for (const b of data.batches) b.instructor_ids = (b.instructor_ids || []).filter((i) => i !== uid);
    save();
  },
  publicView(u) {
    if (!u) return null;
    const gems = totalGemsForStudent(u.id);
    return {
      name: u.name, reg_no: u.reg_no, gems,
      stage: stageFor(gems), streak: u.streak || 0, best_streak: u.best_streak || 0,
      badges: badgesFor(u), courses: coursesForUser(u).map((c) => ({ title: c.title, name: c.name })),
      member_since: (u.created_at || '').slice(0, 10),
    };
  },
};

/* ----------------------------- activity/streaks ----------------------------- */
function touchActivity(user) {
  // Called once per authenticated request; only does work once per day.
  const u = Users.byId(user.id); if (!u || !['student', 'free'].includes(u.role)) return;
  const t = today();
  if (u.last_active === t) return;
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  u.streak = u.last_active === yesterday ? (u.streak || 0) + 1 : 1;
  u.best_streak = Math.max(u.best_streak || 0, u.streak);
  u.last_active = t;
  const bonus = STREAK_MILESTONES[u.streak];
  if (bonus) GemEvents.create({ user_id: u.id, batch_id: null, amount: bonus, source: 'streak', note: `${u.streak}-day streak bonus` });
  save();
}

/* ------------------------------- gem events ------------------------------- */
const GemEvents = {
  create({ user_id, batch_id = null, amount, source, note = null, by = null }) {
    const ev = { id: nextId('gem_events'), user_id: Number(user_id), batch_id: batch_id ? Number(batch_id) : null, amount: Math.round(Number(amount) || 0), source, note, by, at: now() };
    data.gem_events.push(ev); save();
    return ev;
  },
  forStudent(uid) { return data.gem_events.filter((e) => e.user_id === Number(uid)); },
};

/* ------------------------------ gamification ------------------------------ */
function stageFor(gems) {
  let current = STAGES[0], next = null;
  for (let i = 0; i < STAGES.length; i++) {
    if (gems >= STAGES[i].min) { current = STAGES[i]; next = STAGES[i + 1] || null; }
  }
  const span = next ? next.min - current.min : 1;
  const into = next ? gems - current.min : 1;
  return {
    key: current.key, name: current.name, min: current.min,
    next: next ? { key: next.key, name: next.name, min: next.min } : null,
    progress: next ? Math.min(100, Math.round((into / span) * 100)) : 100,
    to_next: next ? next.min - gems : 0,
  };
}
function gemLevel(gems) { return stageFor(gems).name; } // kept for v3 compatibility

function submissionGems(uid, aids = null) {
  return data.submissions
    .filter((s) => s.user_id === Number(uid) && (aids ? aids.includes(s.assignment_id) : true))
    .reduce((sum, s) => sum + (s.gems || 0), 0);
}
function totalGemsForStudent(uid) {
  return submissionGems(uid) + GemEvents.forStudent(uid).reduce((s, e) => s + e.amount, 0) + questGemsGlobal(uid) + openQuestGemsGlobal(uid);
}
function gemsForStudentInBatch(uid, bid) {
  const aids = data.assignments.filter((a) => a.batch_id === Number(bid)).map((a) => a.id);
  const ev = data.gem_events.filter((e) => e.user_id === Number(uid) && e.batch_id === Number(bid)).reduce((s, e) => s + e.amount, 0);
  return submissionGems(uid, aids) + ev + Quests.trackGems(uid, bid);
}
function badgesFor(u) {
  const out = [];
  const gems = totalGemsForStudent(u.id);
  const st = stageFor(gems);
  out.push({ key: `stage-${st.key}`, label: `${st.name} stage`, kind: 'stage' });
  for (const d of Object.keys(STREAK_MILESTONES)) {
    if ((u.best_streak || 0) >= Number(d)) out.push({ key: `streak-${d}`, label: `${d}-day streak`, kind: 'streak' });
  }
  const wins = data.challenge_submissions.filter((cs) => cs.user_id === u.id && cs.status === 'approved').length;
  if (wins >= 1) out.push({ key: 'challenge-1', label: 'Challenge solved', kind: 'moment' });
  if (wins >= 5) out.push({ key: 'challenge-5', label: '5 challenges solved', kind: 'moment' });
  const subs = [...data.submissions.filter((s) => s.user_id === u.id), ...data.quest_submissions.filter((s) => s.user_id === u.id)];
  if (subs.length) out.push({ key: 'first-submit', label: 'First submission', kind: 'moment' });
  if (subs.some((s) => (s.grade || 0) >= 90)) out.push({ key: 'top-marks', label: '90%+ on a task', kind: 'moment' });
  // Course completion: the quest track fully passed (or, for legacy courses
  // without a track, every old assignment graded).
  for (const e of data.enrollments.filter((x) => x.user_id === u.id)) {
    const b = Batches.byId(e.batch_id); const c = b ? Courses.byId(b.course_id) : null;
    if (Quests.installed(e.batch_id)) {
      const prog = Quests.progress(u.id, e.batch_id);
      if (prog && prog.completed) out.push({ key: `complete-${e.batch_id}`, label: `Completed ${c ? c.title : 'a course'}`, kind: 'course' });
    } else {
      const aids = data.assignments.filter((a) => a.batch_id === e.batch_id).map((a) => a.id);
      if (aids.length && aids.every((aid) => data.submissions.some((s) => s.user_id === u.id && s.assignment_id === aid && s.grade != null))) {
        out.push({ key: `complete-${e.batch_id}`, label: `Completed ${c ? c.title : 'a course'}`, kind: 'course' });
      }
    }
  }
  return out;
}
function gamifyFor(u) {
  const gems = totalGemsForStudent(u.id);
  return {
    gems, stage: stageFor(gems), streak: u.streak || 0, best_streak: u.best_streak || 0,
    badges: badgesFor(u), stages: STAGES,
    recent_events: GemEvents.forStudent(u.id).slice(-6).reverse(),
  };
}

/* ------------------------------- courses ------------------------------- */
const Courses = {
  byId(id) { return data.courses.find((c) => c.id === Number(id)) || null; },
  byCode(code) { return data.courses.find((c) => c.code === String(code || '').toUpperCase()) || null; },
  all() { return data.courses.slice(); },
  create(c) { const id = nextId('courses'); data.courses.push({ id, ...c, created_at: now() }); save(); return id; },
  remove(id) { data.courses = data.courses.filter((c) => c.id !== Number(id)); save(); },
};

/* ------------------------------- batches ------------------------------- */
function batchCode() {
  let code;
  do { code = 'EL-' + crypto.randomInt(1000, 9999); } while (data.batches.some((b) => b.code === code));
  return code;
}
const Batches = {
  byId(id) { return data.batches.find((b) => b.id === Number(id)) || null; },
  all() { return data.batches.map((b) => Batches.decorate(b)); },
  create({ course_id, name, start_date, status = 'running', instructor_ids = [] }) {
    const b = { id: nextId('batches'), course_id: Number(course_id), code: batchCode(), name, start_date, status, instructor_ids: instructor_ids.map(Number), created_at: now() };
    data.batches.push(b); save();
    return b;
  },
  addTeacher(bid, uid) {
    const b = Batches.byId(bid); if (!b) return null;
    if (!b.instructor_ids.includes(Number(uid))) { b.instructor_ids.push(Number(uid)); save(); }
    return b;
  },
  removeTeacher(bid, uid) {
    const b = Batches.byId(bid); if (!b) return null;
    b.instructor_ids = b.instructor_ids.filter((i) => i !== Number(uid)); save();
    return b;
  },
  decorate(b) {
    if (!b) return null;
    const c = Courses.byId(b.course_id) || {};
    const teachers = (b.instructor_ids || []).map((id) => Users.byId(id)).filter(Boolean).map((t) => ({ id: t.id, name: t.name }));
    const questPoints = data.quests.filter((q) => q.batch_id === b.id)
      .reduce((s, q) => s + q.problems.reduce((s2, p) => s2 + (p.points || DEFAULT_ASSIGNMENT_POINTS), 0), 0);
    const legacyPoints = data.assignments.filter((a) => a.batch_id === b.id).reduce((s, a) => s + (a.points || DEFAULT_ASSIGNMENT_POINTS), 0);
    const points = questPoints + legacyPoints;
    return {
      ...b, title: c.title, tier: c.tier, level: c.level, weeks: c.weeks, hours: c.hours, summary: c.summary,
      teachers, teacher_names: teachers.map((t) => t.name).join(', ') || null,
      students: data.enrollments.filter((e) => e.batch_id === b.id).length,
      gems_possible: points,
    };
  },
  remove(id) {
    const bid = Number(id);
    const aids = data.assignments.filter((a) => a.batch_id === bid).map((a) => a.id);
    data.batches = data.batches.filter((b) => b.id !== bid);
    data.enrollments = data.enrollments.filter((e) => e.batch_id !== bid);
    data.sessions = data.sessions.filter((s) => s.batch_id !== bid);
    data.lessons = data.lessons.filter((l) => l.batch_id !== bid);
    data.assignments = data.assignments.filter((a) => a.batch_id !== bid);
    data.submissions = data.submissions.filter((s) => !aids.includes(s.assignment_id));
    data.announcements = data.announcements.filter((a) => a.batch_id !== bid);
    data.gem_events = data.gem_events.filter((e) => e.batch_id !== bid);
    save();
  },
};

/* ------------------------------ enrollments ------------------------------ */
const Enrollments = {
  create(uid, bid) {
    if (data.enrollments.some((e) => e.user_id === Number(uid) && e.batch_id === Number(bid))) return null; // already enrolled; multi-course is fine, duplicates are not
    const e = { id: nextId('enrollments'), user_id: Number(uid), batch_id: Number(bid), created_at: now() };
    data.enrollments.push(e); save();
    return e;
  },
  remove(uid, bid) { data.enrollments = data.enrollments.filter((e) => !(e.user_id === Number(uid) && e.batch_id === Number(bid))); save(); },
  studentsForBatch(bid) {
    return data.enrollments.filter((e) => e.batch_id === Number(bid)).map((e) => Users.byId(e.user_id)).filter(Boolean)
      .sort((a, b) => a.name.localeCompare(b.name));
  },
  batchesForStudent(uid) { return data.enrollments.filter((e) => e.user_id === Number(uid)).map((e) => Batches.byId(e.batch_id)).filter(Boolean); },
  all() { return data.enrollments.slice(); },
};

function coursesForUser(u) {
  if (!u) return [];
  if (u.role === 'free') return [];
  if (u.role === 'admin' || u.role === 'coordinator') return Batches.all();
  if (u.role === 'instructor') return data.batches.filter((b) => (b.instructor_ids || []).includes(u.id)).map((b) => Batches.decorate(b));
  return Enrollments.batchesForStudent(u.id).map((b) => Batches.decorate(b));
}
function canManageBatch(u, b) {
  if (!u || !b) return false;
  if (u.role === 'admin') return true;
  if (u.role === 'instructor') return (b.instructor_ids || []).includes(u.id);
  return false; // coordinators and students never manage
}
function canViewBatch(u, b) {
  if (!u || !b) return false;
  if (u.role === 'admin' || u.role === 'coordinator') return true;
  if (u.role === 'instructor') return (b.instructor_ids || []).includes(u.id);
  return data.enrollments.some((e) => e.user_id === u.id && e.batch_id === b.id);
}

/* ------------------------------- sessions ------------------------------- */
// A scheduled class. Each one carries its own built-in video room (embedded
// Jitsi, open source) - no external Zoom/Meet link needed. A teacher/admin
// "starts" the room when class begins, students "join" from that same
// session, and attendance is tracked per session automatically.
const Sessions = {
  create(s) {
    const rec = {
      id: nextId('sessions'), ...s, batch_id: Number(s.batch_id),
      room: `EchoLens-${s.batch_id}-${crypto.randomBytes(6).toString('hex')}`, // unguessable Jitsi room name
      started_at: null, ended_at: null, started_by: null,
      created_at: now(),
    };
    data.sessions.push(rec); save(); return rec;
  },
  byId(id) { return data.sessions.find((s) => s.id === Number(id)) || null; },
  remove(id) {
    const sid = Number(id);
    data.sessions = data.sessions.filter((s) => s.id !== sid);
    data.attendance = data.attendance.filter((a) => a.session_id !== sid);
    save();
  },
  forBatch(bid) { return data.sessions.filter((s) => s.batch_id === Number(bid)).sort((a, b) => String(a.session_date + a.start_time).localeCompare(b.session_date + b.start_time)); },
  // Classes that have actually been started at least once, most recent first.
  held(bid) { return data.sessions.filter((s) => s.batch_id === Number(bid) && s.started_at).sort((a, b) => String(b.started_at).localeCompare(a.started_at)); },
  upcomingForUser(u) {
    const bids = coursesForUser(u).map((b) => b.id);
    const t = today();
    return data.sessions.filter((s) => bids.includes(s.batch_id) && s.session_date >= t)
      .sort((a, b) => String(a.session_date + a.start_time).localeCompare(b.session_date + b.start_time))
      .map((s) => { const b = Batches.byId(s.batch_id); const c = b ? Courses.byId(b.course_id) : null; return { ...s, course_title: c ? c.title : '', batch_name: b ? b.name : '' }; });
  },
  active(bid) { return data.sessions.find((s) => s.batch_id === Number(bid) && s.started_at && !s.ended_at) || null; },
  start(id, userId) {
    const s = Sessions.byId(id); if (!s) return { error: 'Class not found.' };
    const already = Sessions.active(s.batch_id);
    if (already && already.id !== s.id) return { error: 'Another class is already live on this course. End it first.' };
    s.started_at = now(); s.started_by = userId; s.ended_at = null; save();
    return { ok: true, session: s };
  },
  end(id) { const s = Sessions.byId(id); if (!s) return null; s.ended_at = now(); save(); return s; },
};

/* -------------------------------- lessons -------------------------------- */
const Lessons = {
  create(l) { const rec = { id: nextId('lessons'), ...l, batch_id: Number(l.batch_id), created_at: now() }; data.lessons.push(rec); save(); return rec; },
  remove(id) { data.lessons = data.lessons.filter((l) => l.id !== Number(id)); save(); },
  forBatch(bid) { return data.lessons.filter((l) => l.batch_id === Number(bid)).sort((a, b) => (a.week_no - b.week_no) || (a.position || 0) - (b.position || 0)); },
};

/* ------------------------------ assignments ------------------------------ */
const Assignments = {
  byId(id) { return data.assignments.find((a) => a.id === Number(id)) || null; },
  create(a) { const rec = { id: nextId('assignments'), points: DEFAULT_ASSIGNMENT_POINTS, ...a, batch_id: Number(a.batch_id), created_at: now() }; data.assignments.push(rec); save(); return rec; },
  remove(id) {
    const aid = Number(id);
    data.assignments = data.assignments.filter((a) => a.id !== aid);
    data.submissions = data.submissions.filter((s) => s.assignment_id !== aid);
    save();
  },
  forBatch(bid) { return data.assignments.filter((a) => a.batch_id === Number(bid)).sort((a, b) => String(a.due_date).localeCompare(String(b.due_date))); },
};

/* ------------------------------ submissions ------------------------------ */
const Submissions = {
  byId(id) { return data.submissions.find((s) => s.id === Number(id)) || null; },
  upsert({ assignment_id, user_id, file_url, note }) {
    let s = data.submissions.find((x) => x.assignment_id === Number(assignment_id) && x.user_id === Number(user_id));
    if (s) { s.file_url = file_url || s.file_url; s.note = note ?? s.note; s.submitted_at = now(); }
    else { s = { id: nextId('submissions'), assignment_id: Number(assignment_id), user_id: Number(user_id), file_url, note: note || null, grade: null, gems: 0, remarks: null, submitted_at: now() }; data.submissions.push(s); }
    save();
    return s;
  },
  grade(id, pct, remarks, graderId) {
    const s = Submissions.byId(id); if (!s) return null;
    const a = Assignments.byId(s.assignment_id) || {};
    pct = Math.max(0, Math.min(100, Number(pct)));
    s.grade = pct; s.gems = Math.round((a.points || DEFAULT_ASSIGNMENT_POINTS) * pct / 100);
    s.remarks = remarks || null; s.graded_at = now(); s.graded_by = graderId || null;
    save();
    return s;
  },
  forAssignment(aid) {
    return data.submissions.filter((s) => s.assignment_id === Number(aid)).map((s) => {
      const u = Users.byId(s.user_id) || {}; return { ...s, student_name: u.name, student_username: u.username, student_reg: u.reg_no };
    }).sort((a, b) => String(a.student_name).localeCompare(String(b.student_name)));
  },
  forStudent(uid, assignmentIds) {
    const set = new Set(assignmentIds.map(Number)); const out = {};
    data.submissions.filter((s) => s.user_id === Number(uid) && set.has(s.assignment_id)).forEach((s) => { out[s.assignment_id] = s; });
    return out;
  },
  countForAssignment(aid) { return data.submissions.filter((s) => s.assignment_id === Number(aid)).length; },
};

/* ----------------------------- announcements ----------------------------- */
const Announcements = {
  create({ batch_id, title, body }, author_id) {
    const a = { id: nextId('announcements'), batch_id: batch_id ? Number(batch_id) : null, author_id, title, body, created_at: now() };
    data.announcements.push(a); save();
    return a;
  },
  remove(id) { data.announcements = data.announcements.filter((a) => a.id !== Number(id)); save(); },
  forUser(u) {
    const bids = coursesForUser(u).map((b) => b.id);
    return data.announcements.filter((a) => a.batch_id === null || bids.includes(a.batch_id))
      .sort((a, b) => String(b.created_at).localeCompare(a.created_at))
      .map((a) => {
        const author = a.author_id ? Users.byId(a.author_id) : null;
        const b = a.batch_id ? Batches.byId(a.batch_id) : null;
        const c = b ? Courses.byId(b.course_id) : null;
        return { ...a, author_name: author ? author.name : 'EchoLens', course_title: c ? c.title : null };
      });
  },
};
function announcementRecipients(batchId) {
  let users;
  if (batchId) {
    const b = Batches.byId(batchId);
    const ids = new Set(Enrollments.studentsForBatch(batchId).map((s) => s.id));
    (b?.instructor_ids || []).forEach((i) => ids.add(i));
    users = [...ids].map((id) => Users.byId(id)).filter(Boolean);
  } else users = data.users.slice();
  return users.filter((u) => u && u.email).map((u) => ({ name: u.name, email: u.email }));
}

/* ------------------------------- challenges ------------------------------- */
const Challenges = {
  byId(id) { return data.challenges.find((c) => c.id === Number(id)) || null; },
  all() { return data.challenges.slice().sort((a, b) => String(b.created_at).localeCompare(a.created_at)); },
  create({ title, description, difficulty, gems, due_date }, by) {
    const c = { id: nextId('challenges'), title, description: description || null, difficulty: difficulty || 'Beginner', gems: Math.max(5, Math.min(500, Number(gems) || 50)), due_date: due_date || null, open: true, created_by: by, created_at: now() };
    data.challenges.push(c); save();
    return c;
  },
  setOpen(id, open) { const c = Challenges.byId(id); if (c) { c.open = !!open; save(); } return c; },
  remove(id) {
    data.challenges = data.challenges.filter((c) => c.id !== Number(id));
    data.challenge_submissions = data.challenge_submissions.filter((s) => s.challenge_id !== Number(id));
    save();
  },
  submit({ challenge_id, user_id, link, note }) {
    let s = data.challenge_submissions.find((x) => x.challenge_id === Number(challenge_id) && x.user_id === Number(user_id));
    if (s && s.status === 'approved') return s; // solved already - keep the win
    if (s) { s.link = link; s.note = note || null; s.status = 'pending'; s.submitted_at = now(); }
    else { s = { id: nextId('challenge_submissions'), challenge_id: Number(challenge_id), user_id: Number(user_id), link, note: note || null, status: 'pending', remarks: null, submitted_at: now() }; data.challenge_submissions.push(s); }
    save();
    return s;
  },
  review(sid, { approve, remarks, gems }, by) {
    const s = data.challenge_submissions.find((x) => x.id === Number(sid)); if (!s) return null;
    const c = Challenges.byId(s.challenge_id) || {};
    const already = s.status === 'approved';
    s.status = approve ? 'approved' : 'rejected';
    s.remarks = remarks || null; s.reviewed_at = now(); s.reviewed_by = by;
    if (approve && !already) {
      GemEvents.create({ user_id: s.user_id, batch_id: null, amount: Math.round(Number(gems) || c.gems || 50), source: 'challenge', note: `Challenge: ${c.title || ''}`.trim(), by });
    }
    save();
    return s;
  },
  mine(uid) { const out = {}; data.challenge_submissions.filter((s) => s.user_id === Number(uid)).forEach((s) => { out[s.challenge_id] = s; }); return out; },
  submissionsFor(cid) {
    return data.challenge_submissions.filter((s) => s.challenge_id === Number(cid)).map((s) => {
      const u = Users.byId(s.user_id) || {}; return { ...s, user_name: u.name, user_reg: u.reg_no, user_tier: u.role };
    }).sort((a, b) => String(b.submitted_at).localeCompare(a.submitted_at));
  },
  pendingCount() { return data.challenge_submissions.filter((s) => s.status === 'pending').length; },
};

/* -------------------------------- hackathons -------------------------------- */
function hackStatus(h) {
  const now = new Date().toISOString().slice(0, 16).replace('T', ' ');
  const st = String(h.starts_at || '').replace('T', ' ');
  const en = String(h.ends_at || '').replace('T', ' ');
  if (h.finalized) return 'finalized';
  if (now < st) return 'upcoming';
  if (now <= en) return 'live';
  return 'ended';
}
const Hackathons = {
  byId(id) { return data.hackathons.find((h) => h.id === Number(id)) || null; },
  all() { return data.hackathons.slice().sort((a, b) => String(b.starts_at).localeCompare(a.starts_at)).map((h) => ({ ...h, status: hackStatus(h), entries: data.hackathon_entries.filter((e) => e.hackathon_id === h.id).length })); },
  create(h, by) {
    const rec = {
      id: nextId('hackathons'), title: h.title, theme: h.theme || null,
      starts_at: h.starts_at, ends_at: h.ends_at,
      mode: h.mode === 'team' ? 'team' : 'solo', team_max: Math.max(1, Math.min(6, Number(h.team_max) || 4)),
      entry: h.entry === 'paid' ? 'paid' : 'free', fee_pkr: Number(h.fee_pkr) || 0,
      pay_instructions: h.pay_instructions || null,
      prizes: { first: Number(h.prize1) || 300, second: Number(h.prize2) || 150, third: Number(h.prize3) || 75 },
      finalized: false, created_by: by, created_at: now(),
    };
    data.hackathons.push(rec); save();
    return rec;
  },
  remove(id) {
    const hid = Number(id);
    const eids = data.hackathon_entries.filter((e) => e.hackathon_id === hid).map((e) => e.id);
    data.hackathons = data.hackathons.filter((h) => h.id !== hid);
    data.hackathon_entries = data.hackathon_entries.filter((e) => e.hackathon_id !== hid);
    data.hackathon_submissions = data.hackathon_submissions.filter((s) => !eids.includes(s.entry_id));
    save();
  },
  entryFor(hid, uid) {
    return data.hackathon_entries.find((e) => e.hackathon_id === Number(hid) && e.member_ids.includes(Number(uid))) || null;
  },
  register({ hackathon_id, user, team_name, member_regs, payment_ref }) {
    const h = Hackathons.byId(hackathon_id); if (!h) return { error: 'Hackathon not found.' };
    if (hackStatus(h) === 'ended' || h.finalized) return { error: 'Registration is closed.' };
    if (Hackathons.entryFor(h.id, user.id)) return { error: 'You are already registered (or on a team) for this event.' };
    const member_ids = [user.id];
    const resolved = [], missing = [];
    if (h.mode === 'team') {
      for (const raw of (member_regs || []).slice(0, h.team_max - 1)) {
        const m = Users.byLogin(String(raw).trim());
        if (m && ['student', 'free'].includes(m.role) && m.id !== user.id) {
          if (Hackathons.entryFor(h.id, m.id)) return { error: `${m.name} is already on another team for this event.` };
          member_ids.push(m.id); resolved.push(m.name);
        } else if (String(raw).trim()) missing.push(String(raw).trim());
      }
    }
    if (h.entry === 'paid' && !String(payment_ref || '').trim()) return { error: 'A payment reference is required for this paid event.' };
    const e = {
      id: nextId('hackathon_entries'), hackathon_id: h.id,
      team_name: h.mode === 'team' ? (String(team_name || '').trim() || `${user.name.split(' ')[0]}'s team`) : user.name,
      member_ids, registered_by: user.id,
      payment_status: h.entry === 'paid' ? 'pending' : 'na',
      payment_ref: h.entry === 'paid' ? String(payment_ref).trim().slice(0, 120) : null,
      registered_at: now(),
    };
    data.hackathon_entries.push(e); save();
    return { entry: e, resolved, missing };
  },
  confirmPayment(entryId, ok, by) {
    const e = data.hackathon_entries.find((x) => x.id === Number(entryId)); if (!e) return null;
    e.payment_status = ok ? 'confirmed' : 'rejected'; e.payment_by = by; save();
    return e;
  },
  submit({ hackathon_id, user, link, note }) {
    const h = Hackathons.byId(hackathon_id); if (!h) return { error: 'Hackathon not found.' };
    if (hackStatus(h) !== 'live') return { error: 'Submissions are only open while the event is live.' };
    const e = Hackathons.entryFor(h.id, user.id);
    if (!e) return { error: 'Register for the event first.' };
    if (h.entry === 'paid' && e.payment_status !== 'confirmed') return { error: 'Your payment is not confirmed yet.' };
    let s = data.hackathon_submissions.find((x) => x.entry_id === e.id);
    if (s) { s.link = link; s.note = note || null; s.submitted_at = now(); }
    else { s = { id: nextId('hackathon_submissions'), hackathon_id: h.id, entry_id: e.id, link, note: note || null, score: null, remarks: null, submitted_at: now() }; data.hackathon_submissions.push(s); }
    save();
    return { submission: s };
  },
  score(sid, score, remarks, by) {
    const s = data.hackathon_submissions.find((x) => x.id === Number(sid)); if (!s) return null;
    s.score = Math.max(0, Math.min(100, Number(score))); s.remarks = remarks || null; s.judged_by = by; s.judged_at = now(); save();
    return s;
  },
  board(hid) {
    return data.hackathon_submissions.filter((s) => s.hackathon_id === Number(hid)).map((s) => {
      const e = data.hackathon_entries.find((x) => x.id === s.entry_id) || {};
      return { ...s, team_name: e.team_name, members: (e.member_ids || []).map((id) => (Users.byId(id) || {}).name).filter(Boolean), payment_status: e.payment_status, entry_id: e.id };
    }).sort((a, b) => (b.score ?? -1) - (a.score ?? -1) || String(a.submitted_at).localeCompare(b.submitted_at));
  },
  entries(hid) {
    return data.hackathon_entries.filter((e) => e.hackathon_id === Number(hid)).map((e) => ({
      ...e, members: e.member_ids.map((id) => { const u = Users.byId(id) || {}; return { name: u.name, reg_no: u.reg_no }; }),
    }));
  },
  finalize(hid, by) {
    const h = Hackathons.byId(hid); if (!h) return { error: 'Hackathon not found.' };
    if (h.finalized) return { error: 'Already finalized.' };
    const board = Hackathons.board(hid).filter((s) => s.score != null);
    if (!board.length) return { error: 'Score at least one submission before finalizing.' };
    const prizes = [h.prizes.first, h.prizes.second, h.prizes.third];
    const winners = [];
    board.slice(0, 3).forEach((s, i) => {
      const e = data.hackathon_entries.find((x) => x.id === s.entry_id);
      for (const uid of e.member_ids) {
        GemEvents.create({ user_id: uid, batch_id: null, amount: prizes[i], source: 'hackathon', note: `#${i + 1} in ${h.title}`, by });
      }
      winners.push({ rank: i + 1, team: e.team_name, gems_each: prizes[i] });
    });
    h.finalized = true; save();
    return { winners };
  },
};

/* -------------------------------- AI reports -------------------------------- */
const AiReports = {
  // scope 'course' (batch_id set) or 'overall' (batch_id null - covers every course).
  create({ user_id, batch_id, markdown, scope }, by) {
    const r = {
      id: nextId('ai_reports'), user_id: Number(user_id),
      batch_id: batch_id == null ? null : Number(batch_id),
      scope: scope || (batch_id == null ? 'overall' : 'course'),
      markdown, status: 'draft', created_at: now(), by,
    };
    data.ai_reports.push(r); save();
    return r;
  },
  byId(id) { return data.ai_reports.find((r) => r.id === Number(id)) || null; },
  publish(id) { const r = AiReports.byId(id); if (r) { r.status = 'published'; r.published_at = now(); save(); } return r; },
  remove(id) { data.ai_reports = data.ai_reports.filter((r) => r.id !== Number(id)); save(); },
  forBatch(bid) {
    // Course reports for this batch, plus overall reports for its students.
    const studentIds = new Set(data.enrollments.filter((e) => e.batch_id === Number(bid)).map((e) => e.user_id));
    return data.ai_reports
      .filter((r) => r.batch_id === Number(bid) || (r.batch_id == null && studentIds.has(r.user_id)))
      .map((r) => ({ ...r, student_name: (Users.byId(r.user_id) || {}).name, scope: r.scope || (r.batch_id == null ? 'overall' : 'course') }));
  },
  publishedFor(uid) {
    return data.ai_reports.filter((r) => r.user_id === Number(uid) && r.status === 'published').map((r) => {
      if (r.batch_id == null) return { ...r, course_title: 'Across all courses' };
      const b = Batches.byId(r.batch_id); const c = b ? Courses.byId(b.course_id) : null;
      return { ...r, course_title: c ? c.title : 'Course' };
    });
  },
};

/* --------------------------------- quests --------------------------------- */
// Prebuilt gamified assignment ladders. Levels unlock strictly in order: the
// instructor must grade every problem in a level, and the level average must
// reach the track's pass mark, before the next level opens for that student.
const TRACKS = {};
(function loadTracks() {
  // short-courses-full is loaded LAST so its complete builds override the
  // earlier thin stubs for the same keys (python-6w, sc02/sc03/sc06/sc07).
  const all = [require('./tracks/python'), ...require('./tracks/bootcamps'), ...require('./tracks/short-courses'), ...require('./tracks/specialist'), ...require('./tracks/august-2026'), ...require('./tracks/short-courses-full'), ...require('./tracks/free-micro')];
  for (const t of all) {
    // Normalize: compute title thresholds from total points if only names given.
    const total = t.levels.reduce((s1, l) => s1 + l.problems.reduce((s2, p) => s2 + (p.points || 100), 0), 0);
    if (!t.titles && Array.isArray(t.titleNames)) {
      const fr = [0, 0.18, 0.4, 0.65, 0.88];
      t.titles = t.titleNames.map((name, i) => ({ name, min: Math.round(total * (fr[i] ?? (i / t.titleNames.length)) / 10) * 10 }));
    }
    t.pass_mark = t.pass_mark || 60;
    t.total_points = total;
    TRACKS[t.key] = t;
  }
})();

const Quests = {
  // submission_mode: a track can declare its own workspace ('doc', 'prompt',
  // 'code-ai', 'excel-ai', 'multi'); otherwise no-IDE tracks take files and
  // coding tracks use the built-in compiler.
  tracks() { return Object.values(TRACKS).map((t) => ({ key: t.key, title: t.title, description: t.description, levels: t.levels.length, course_code: t.course_code || null, total_points: t.total_points, free: !!t.free, submission_mode: t.submission || (NO_IDE_TRACKS.has(t.key) ? 'file' : 'code') })); },
  trackDef(key) { return TRACKS[key] || null; },
  installed(bid) { return data.quests.some((q) => q.batch_id === Number(bid)); },
  install(bid, trackKey) {
    const t = TRACKS[trackKey]; if (!t) return { error: 'Unknown track.' };
    if (Quests.installed(bid)) return { error: 'A track is already installed on this course.' };
    const batch = data.batches.find((b) => b.id === Number(bid)) || {};
    for (const lvl of t.levels) {
      data.quests.push({
        id: nextId('quests'), batch_id: Number(bid), track_key: t.key,
        no: lvl.no, week: lvl.week, session: lvl.session, title: lvl.title, topic: lvl.topic,
        deadline: deadlineFromStart(batch.start_date, lvl.week), // end of that week; instructor can change it
        problems: lvl.problems.map((p, i) => ({ pid: i + 1, type: p.type || 'code', ...p })),
        created_at: now(),
      });
    }
    save();
    return { ok: true, levels: t.levels.length };
  },
  updateProblem(qid, pid, fields) {
    const q = Quests.byId(qid); if (!q) return null;
    const p = q.problems.find((x) => x.pid === Number(pid)); if (!p) return null;
    const allowed = ['title', 'description', 'points', 'difficulty', 'solution', 'hint'];
    for (const k of allowed) if (fields[k] !== undefined) p[k] = k === 'points' ? Math.max(10, Math.min(1000, Number(fields[k]) || p.points)) : String(fields[k]).slice(0, 4000);
    if (fields.type !== undefined && ['code', 'written'].includes(fields.type)) p.type = fields.type;
    if (Array.isArray(fields.refs)) p.refs = fields.refs.filter((r) => Array.isArray(r) && r[1]).slice(0, 6);
    // Grading criteria: a short checklist shown to students of what the task
    // is looking for - optional, teacher-authored, never the solution itself.
    if (Array.isArray(fields.criteria)) p.criteria = fields.criteria.map((c) => String(c).slice(0, 200)).filter(Boolean).slice(0, 8);
    save();
    return p;
  },
  // Teachers can add extra problems to a level - e.g. a written logic problem
  // next to the coding tasks.
  addProblem(qid, { title, description, points, difficulty, type, solution, hint, criteria }) {
    const q = Quests.byId(qid); if (!q) return null;
    const pid = q.problems.reduce((m, p) => Math.max(m, p.pid), 0) + 1;
    const p = {
      pid, title: String(title).slice(0, 200), description: String(description || '').slice(0, 4000),
      points: Math.max(10, Math.min(1000, Number(points) || 100)),
      difficulty: ['Basic', 'Core', 'Boss'].includes(difficulty) ? difficulty : 'Core',
      type: type === 'written' ? 'written' : 'code',
      solution: solution ? String(solution).slice(0, 4000) : undefined,
      hint: hint ? String(hint).slice(0, 4000) : undefined,
      criteria: Array.isArray(criteria) ? criteria.map((c) => String(c).slice(0, 200)).filter(Boolean).slice(0, 8) : undefined,
    };
    q.problems.push(p); save();
    return p;
  },
  removeProblem(qid, pid) {
    const q = Quests.byId(qid); if (!q) return false;
    const before = q.problems.length;
    q.problems = q.problems.filter((p) => p.pid !== Number(pid));
    data.quest_submissions = data.quest_submissions.filter((s) => !(s.quest_id === q.id && s.pid === Number(pid)));
    save();
    return q.problems.length < before;
  },
  updateLevel(qid, fields) {
    const q = Quests.byId(qid); if (!q) return null;
    for (const k of ['title', 'topic']) if (fields[k]) q[k] = String(fields[k]).slice(0, 300);
    if (fields.deadline !== undefined) q.deadline = /^\d{4}-\d{2}-\d{2}$/.test(String(fields.deadline)) ? String(fields.deadline) : null;
    save();
    return q;
  },
  uninstall(bid) {
    const qids = data.quests.filter((q) => q.batch_id === Number(bid)).map((q) => q.id);
    data.quests = data.quests.filter((q) => q.batch_id !== Number(bid));
    data.quest_submissions = data.quest_submissions.filter((s) => !qids.includes(s.quest_id));
    save();
  },
  forBatch(bid) { return data.quests.filter((q) => q.batch_id === Number(bid)).sort((a, b) => a.no - b.no); },
  byId(id) { return data.quests.find((q) => q.id === Number(id)) || null; },
  submit({ quest_id, pid, user_id, file_url, code, language, note }) {
    const q = Quests.byId(quest_id);
    const isLate = !!(q && q.deadline && today() > q.deadline);
    let s = data.quest_submissions.find((x) => x.quest_id === Number(quest_id) && x.pid === Number(pid) && x.user_id === Number(user_id));
    if (s) {
      // Latest submission wins: switching mode replaces the previous one.
      if (code) { s.code = code; s.language = language || 'python'; s.file_url = null; }
      else if (file_url) { s.file_url = file_url; s.code = null; s.language = null; }
      s.note = note ?? s.note; s.submitted_at = now();
      s.late = s.late || isLate; // once late, always late - resubmitting doesn't reset it
      // The old AI review + integrity report no longer match the new work.
      delete s.ai_review; delete s.review_shared; delete s.review_shared_at; delete s.integrity;
    } else {
      s = {
        id: nextId('quest_submissions'), quest_id: Number(quest_id), pid: Number(pid), user_id: Number(user_id),
        file_url: file_url || null, code: code || null, language: code ? (language || 'python') : null,
        note: note || null, grade: null, gems: 0, remarks: null, submitted_at: now(), late: isLate,
      };
      data.quest_submissions.push(s);
    }
    save();
    return s;
  },
  subById(id) { return data.quest_submissions.find((s) => s.id === Number(id)) || null; },
  grade(sid, pct, remarks, by) {
    const s = Quests.subById(sid); if (!s) return null;
    const q = Quests.byId(s.quest_id); const p = q ? q.problems.find((x) => x.pid === s.pid) : null;
    pct = Math.max(0, Math.min(100, Number(pct)));
    s.grade = pct;
    const full = Math.round(((p && p.points) || 100) * pct / 100);
    s.gems = s.late ? Math.round(full * (1 - LATE_PENALTY)) : full; // late = -20% gems, grade % untouched
    s.late_deduction = s.late ? full - s.gems : 0;
    s.remarks = remarks || null; s.graded_at = now(); s.graded_by = by;
    save();
    return s;
  },
  mySubs(uid, bid) {
    const qids = Quests.forBatch(bid).map((q) => q.id);
    const out = {};
    data.quest_submissions.filter((s) => s.user_id === Number(uid) && qids.includes(s.quest_id))
      .forEach((s) => { out[`${s.quest_id}:${s.pid}`] = s; });
    return out;
  },
  levelPassed(uid, quest, passMark) {
    // Passed = every problem graded AND average grade >= pass mark.
    const subs = quest.problems.map((p) => data.quest_submissions.find((s) => s.quest_id === quest.id && s.pid === p.pid && s.user_id === Number(uid)));
    if (subs.some((s) => !s || s.grade == null)) return false;
    const avg = subs.reduce((sum, s) => sum + s.grade, 0) / subs.length;
    return avg >= passMark;
  },
  progress(uid, bid) {
    const quests = Quests.forBatch(bid);
    if (!quests.length) return null;
    const t = TRACKS[quests[0].track_key] || { pass_mark: 60, titles: [{ min: 0, name: 'Learner' }] };
    let unlockedUpTo = 1;
    const levels = quests.map((q) => {
      const passed = Quests.levelPassed(uid, q, t.pass_mark);
      if (passed && q.no === unlockedUpTo) unlockedUpTo = q.no + 1;
      return { quest: q, passed };
    });
    const gems = Quests.trackGems(uid, bid);
    let title = t.titles[0], nextTitle = null;
    for (let i = 0; i < t.titles.length; i++) if (gems >= t.titles[i].min) { title = t.titles[i]; nextTitle = t.titles[i + 1] || null; }
    return {
      track: { key: t.key, title: t.title, description: t.description, pass_mark: t.pass_mark, titles: t.titles },
      levels: levels.map((l) => ({ ...l, unlocked: l.quest.no <= unlockedUpTo })),
      unlocked_up_to: Math.min(unlockedUpTo, quests.length),
      gems, title: title.name, next_title: nextTitle,
      completed: levels.every((l) => l.passed),
    };
  },
  trackGems(uid, bid) {
    const qids = Quests.forBatch(bid).map((q) => q.id);
    return data.quest_submissions.filter((s) => s.user_id === Number(uid) && qids.includes(s.quest_id)).reduce((sum, s) => sum + (s.gems || 0), 0);
  },
  scoreboard(bid) {
    const quests = Quests.forBatch(bid);
    if (!quests.length) return [];
    const t = TRACKS[quests[0].track_key] || { pass_mark: 60, titles: [{ min: 0, name: 'Learner' }] };
    return Enrollments.studentsForBatch(bid).map((u) => {
      let level = 0;
      for (const q of quests) { if (Quests.levelPassed(u.id, q, t.pass_mark)) level = q.no; else break; }
      const gems = Quests.trackGems(u.id, bid);
      let title = t.titles[0];
      for (const ti of t.titles) if (gems >= ti.min) title = ti;
      return { id: u.id, name: u.name, reg_no: u.reg_no, gems, level, of: quests.length, title: title.name, streak: u.streak || 0 };
    }).sort((a, b) => b.gems - a.gems || b.level - a.level);
  },
  submissionsFor(qid) {
    return data.quest_submissions.filter((s) => s.quest_id === Number(qid)).map((s) => {
      const u = Users.byId(s.user_id) || {};
      return { ...s, student_name: u.name, student_reg: u.reg_no };
    }).sort((a, b) => (a.pid - b.pid) || String(a.student_name).localeCompare(String(b.student_name)));
  },
  pendingCount(bid) {
    const qids = Quests.forBatch(bid).map((q) => q.id);
    return data.quest_submissions.filter((s) => qids.includes(s.quest_id) && s.grade == null).length;
  },
  // Ungraded submissions for a batch, with quest/problem/student details -
  // powers the teacher portal's "Grades" page and Overview "to review" list.
  pendingSubmissionsForBatch(bid) {
    const out = [];
    Quests.forBatch(bid).forEach((q) => {
      data.quest_submissions.filter((s) => s.quest_id === q.id && s.grade == null).forEach((s) => {
        const u = Users.byId(s.user_id) || {};
        const p = q.problems.find((x) => x.pid === s.pid) || {};
        out.push({
          submission_id: s.id, quest_id: q.id, pid: s.pid, level: q.no, quest_title: q.title,
          problem_title: p.title || '', student_id: u.id, student_name: u.name, student_reg: u.reg_no,
          submitted_at: s.submitted_at, late: !!s.late,
        });
      });
    });
    return out.sort((a, b) => String(a.submitted_at).localeCompare(b.submitted_at));
  },
};

// Quest gems count toward global stages and course totals.
function questGemsGlobal(uid) { return data.quest_submissions.filter((s) => s.user_id === Number(uid)).reduce((sum, s) => sum + (s.gems || 0), 0); }
// Free/open quest (OpenQuest) gems count toward the same global total - an
// open user's stage, badges and leaderboard rank should reflect their free
// course work, not just challenges/portal courses.
function openQuestGemsGlobal(uid) { return data.open_submissions.filter((s) => s.user_id === Number(uid)).reduce((sum, s) => sum + (s.gems || 0), 0); }

/* ------------------------------ course chat ------------------------------ */
// Anonymous-friendly Q&A inside each course. Students choose per message
// whether to show their real name or a stable gem alias (same alias every
// time in the same course, so conversations stay followable). The alias is
// anonymous to EVERYONE - the API never reveals who is behind it, not even
// to teachers, so shy students can ask freely. Staff always post named.
const ALIAS_GEMS = ['Amber', 'Opal', 'Jade', 'Ruby', 'Topaz', 'Pearl', 'Onyx', 'Coral', 'Quartz', 'Zircon', 'Garnet', 'Beryl'];
function chatAlias(uid, bid) {
  const h = ((Number(uid) * 2654435761) ^ (Number(bid) * 40503)) >>> 0;
  return `${ALIAS_GEMS[h % ALIAS_GEMS.length]}-${(h % 900) + 100}`;
}
const Chat = {
  post({ batch_id, user, body, anonymous, mentions }) {
    const staff = ['admin', 'instructor', 'coordinator'].includes(user.role);
    const m = {
      id: nextId('course_messages'), batch_id: Number(batch_id), user_id: user.id,
      body: String(body).slice(0, 2000),
      anonymous: staff ? false : !!anonymous, // staff always post with their name
      staff_role: staff ? user.role : null,
      mentions: Array.isArray(mentions) ? mentions.slice(0, 10) : [], // [{id,name}] resolved server-side
      created_at: now(),
    };
    data.course_messages.push(m); save();
    return Chat.render(m, user);
  },
  render(m, viewer) {
    const u = Users.byId(m.user_id) || {};
    return {
      id: m.id, batch_id: m.batch_id, body: m.body, created_at: m.created_at,
      display_name: m.anonymous ? chatAlias(m.user_id, m.batch_id) : (u.name || 'Learner'),
      avatar: m.anonymous ? null : (u.avatar || null),
      anonymous: !!m.anonymous,
      staff_role: m.staff_role || null,
      mentions: m.mentions || [],
      mentions_me: viewer ? (m.mentions || []).some((x) => x.id === viewer.id) : false,
      mine: viewer ? m.user_id === viewer.id : false,
    };
  },
  forBatch(bid, viewer) {
    return data.course_messages
      .filter((m) => m.batch_id === Number(bid))
      .slice(-200)
      .map((m) => Chat.render(m, viewer));
  },
  byId(id) { return data.course_messages.find((m) => m.id === Number(id)) || null; },
  remove(id) { data.course_messages = data.course_messages.filter((m) => m.id !== Number(id)); save(); },
  myAlias: chatAlias,
};

// Tracks when a user last read a course's chat, so a global "Messages" view
// can show a real per-course unread count instead of faking one.
const ChatReads = {
  mark(uid, bid) {
    let r = data.chat_reads.find((x) => x.user_id === Number(uid) && x.batch_id === Number(bid));
    if (r) r.last_read_at = now();
    else data.chat_reads.push({ id: nextId('chat_reads'), user_id: Number(uid), batch_id: Number(bid), last_read_at: now() });
    save();
  },
  lastRead(uid, bid) {
    const r = data.chat_reads.find((x) => x.user_id === Number(uid) && x.batch_id === Number(bid));
    return r ? r.last_read_at : null;
  },
};

/* ------------------------------ leaderboards ------------------------------ */
function studentLeaderboard() {
  return data.users.filter((u) => ['student', 'free'].includes(u.role)).map((u) => {
    const gems = totalGemsForStudent(u.id);
    return { id: u.id, name: u.name, reg_no: u.reg_no, gems, stage: stageFor(gems), streak: u.streak || 0, tier: u.role === 'free' ? 'free' : 'portal' };
  }).sort((a, b) => b.gems - a.gems);
}
function batchLeaderboard(bid) {
  return Enrollments.studentsForBatch(bid).map((u) => {
    const gems = gemsForStudentInBatch(u.id, bid);
    return { id: u.id, name: u.name, reg_no: u.reg_no, gems, stage: stageFor(totalGemsForStudent(u.id)), streak: u.streak || 0 };
  }).sort((a, b) => b.gems - a.gems);
}
function courseLeaderboard() {
  return data.batches.map((b) => {
    const aids = data.assignments.filter((a) => a.batch_id === b.id).map((a) => a.id);
    const graded = data.submissions.filter((s) => aids.includes(s.assignment_id)).reduce((sum, s) => sum + (s.gems || 0), 0);
    const bonus = data.gem_events.filter((e) => e.batch_id === b.id).reduce((s, e) => s + e.amount, 0);
    const c = Courses.byId(b.course_id) || {};
    return { id: b.id, code: b.code, title: c.title, name: b.name, gems: graded + bonus, gems_possible: Batches.decorate(b).gems_possible };
  }).sort((a, b) => b.gems - a.gems);
}

/* ------------------------------ course report ------------------------------ */
// Quest-based: the quest track IS the assignment system. Every problem in
// the installed track is a task; "missing" counts unsubmitted problems in
// levels the student has already unlocked (i.e. work that is open to them).
function courseReport(bid) {
  const b = Batches.decorate(Batches.byId(bid));
  const quests = Quests.forBatch(bid);
  const problems = quests.flatMap((q) => q.problems.map((p) => ({
    quest_id: q.id, pid: p.pid, level: q.no, week: q.week,
    title: `L${q.no} · ${p.title}`, points: p.points || DEFAULT_ASSIGNMENT_POINTS, difficulty: p.difficulty,
  })));
  const qids = quests.map((q) => q.id);
  const students = Enrollments.studentsForBatch(bid).map((s) => {
    const subs = data.quest_submissions.filter((x) => x.user_id === s.id && qids.includes(x.quest_id));
    const graded = subs.filter((x) => x.grade != null);
    const gems = gemsForStudentInBatch(s.id, bid);
    const lastRemark = graded.map((x) => x.remarks).filter(Boolean).slice(-1)[0] || null;
    const avg = graded.length ? Math.round(graded.reduce((sum, x) => sum + x.grade, 0) / graded.length) : null;
    const inactive_days = s.last_active ? Math.floor((Date.now() - new Date(s.last_active + 'T00:00:00').getTime()) / 86400000) : null;
    const prog = quests.length ? Quests.progress(s.id, bid) : null;
    const openLevel = prog ? prog.unlocked_up_to : 0;
    const missing = problems.filter((p) => p.level <= openLevel && !subs.some((x) => x.quest_id === p.quest_id && x.pid === p.pid)).length;
    return {
      id: s.id, name: s.name, username: s.username, reg_no: s.reg_no, email: s.email,
      submitted: subs.length, graded: graded.length, total_assignments: problems.length,
      level: openLevel, of_levels: quests.length,
      gems, avg, streak: s.streak || 0, stage: stageFor(totalGemsForStudent(s.id)), last_remark: lastRemark,
      inactive_days, missing,
      at_risk: (inactive_days == null || inactive_days >= 7) || missing >= 2,
    };
  });
  return { batch: b, assignments: problems, students };
}

/* --------------------------------- admin --------------------------------- */
const Admin = {
  overview() {
    return {
      students: Users.countByRole('student'), teachers: Users.countByRole('instructor'),
      free_users: Users.countByRole('free'), challenges: data.challenges.length,
      pending_challenge_reviews: Challenges.pendingCount(),
      coordinators: Users.countByRole('coordinator'),
      courses: data.courses.length, running_courses: data.batches.length,
      enrollments: data.enrollments.length,
      assignments: data.quests.reduce((s, q) => s + q.problems.length, 0) + data.assignments.length,
      submissions: data.submissions.length + data.quest_submissions.length,
      graded: data.submissions.filter((s) => s.grade != null).length + data.quest_submissions.filter((s) => s.grade != null).length,
      total_gems: data.users.filter((u) => u.role === 'student').reduce((s, u) => s + totalGemsForStudent(u.id), 0),
      batches: Batches.all(),
    };
  },
  // v16: admin portal redesign - growth series, recent registrations, top
  // courses, estimated revenue and announcements for the new Overview page.
  dashboard() {
    const users = Users.all();
    const students = users.filter((u) => u.role === 'student');
    const teachers = users.filter((u) => u.role === 'instructor');
    const courses = Courses.all();
    const batches = Batches.all();
    const enrollments = Enrollments.all();

    const weekOverWeek = (items, field) => {
      const nowMs = Date.now(), week = 7 * 86400000;
      const at = (it) => new Date(String(it[field] || '').replace(' ', 'T')).getTime();
      const thisWeek = items.filter((it) => { const t = at(it); return t > nowMs - week && t <= nowMs; }).length;
      const prevWeek = items.filter((it) => { const t = at(it); return t > nowMs - 2 * week && t <= nowMs - week; }).length;
      return prevWeek ? Math.round(((thisWeek - prevWeek) / prevWeek) * 100) : (thisWeek ? 100 : 0);
    };

    const dailyUsers = seriesFrom(users, 'created_at', 'daily');
    const growth = { labels: dailyUsers.labels.slice(-7), counts: dailyUsers.counts.slice(-7) };

    const recent_registrations = users.slice()
      .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)))
      .slice(0, 5)
      .map((u) => ({ id: u.id, name: u.name, email: u.email, role: u.role, avatar: u.avatar || null, created_at: u.created_at }));

    const byCourse = new Map();
    batches.forEach((b) => {
      if (!b.course_id) return;
      const row = byCourse.get(b.course_id) || { course_id: b.course_id, title: b.title, students: 0 };
      row.students += b.students || 0;
      byCourse.set(b.course_id, row);
    });
    const top_courses = [...byCourse.values()].sort((a, b) => b.students - a.students).slice(0, 5);

    const today = new Date();
    const monthPrefix = today.toISOString().slice(0, 7);
    let revenue_this_month = 0;
    enrollments.forEach((e) => {
      if (String(e.created_at).slice(0, 7) !== monthPrefix) return;
      const b = Batches.byId(e.batch_id); if (!b) return;
      const c = Courses.byId(b.course_id);
      if (c && c.price_pkr) revenue_this_month += c.price_pkr;
    });

    const recent_announcements = PublicAnnouncements.all().slice(0, 3).map((a) => {
      const author = a.created_by ? Users.byId(a.created_by) : null;
      return { id: a.id, title: a.title, body: a.body, kind: a.kind, created_at: a.created_at, author_name: author ? author.name : 'Super Admin' };
    });

    return {
      totals: {
        total_users: users.length, total_users_delta: weekOverWeek(users, 'created_at'),
        students: students.length, students_delta: weekOverWeek(students, 'created_at'),
        courses: courses.length, courses_delta: weekOverWeek(courses, 'created_at'),
        teachers: teachers.length,
        enrollments: enrollments.length, enrollments_delta: weekOverWeek(enrollments, 'created_at'),
        revenue_this_month, revenue_month_label: today.toLocaleDateString('en-US', { month: 'long' }),
      },
      growth, recent_registrations, top_courses, recent_announcements,
    };
  },
};

/* ---------------------------- official catalogue ---------------------------- */
const OFFICIAL_CATALOGUE = [
  // August 2026 cohort - 31 live, instructor-led programs.
  // badges: free | new | high_demand | flagship. free_mode: 'open' (no account
  // needed to watch) | 'signin' (free with sign-in) | undefined (paid; Level 1
  // of the quest is free for signed-in community members).
  { code: 'BC-01', title: 'AI Automation with n8n & Make.com', tier: 'Bootcamp', weeks: 2, hours: 8, price_pkr: 5000, badges: ['high_demand'], summary: 'Build real business automations that connect apps, data and AI - workflows agencies bill $30-70/hour for.' },
  { code: 'BC-02', title: 'Prompt Engineering & ChatGPT/Claude Mastery', tier: 'Bootcamp', weeks: 2, hours: 8, price_pkr: 5000, badges: ['high_demand'], summary: 'Structured prompting, tool use and reusable prompt systems that make AI dependable daily.' },
  { code: 'BC-03', title: 'Everyday AI: Smarter Study, Work & Content', tier: 'Bootcamp', weeks: 2, hours: 8, price_pkr: 0, badges: ['free'], free_mode: 'open', summary: 'Our fully open bootcamp: practical AI for studies, office work and content creation.' },
  { code: 'BC-04', title: 'Web Dev Kickstart: HTML, CSS & JavaScript', tier: 'Bootcamp', weeks: 2, hours: 8, price_pkr: 0, badges: ['free', 'new', 'high_demand'], free_mode: 'signin', summary: 'Your first real webpage, built live in our in-browser compiler with quests, gems and a leaderboard.' },
  { code: 'BC-05', title: 'AI-Assisted Coding with Cursor, Claude & Copilot', tier: 'Bootcamp', weeks: 2, hours: 8, price_pkr: 5000, badges: ['new', 'high_demand'], summary: 'Agentic IDEs, AI pair programming and review workflows that multiply what one developer can ship.' },
  { code: 'BC-06', title: 'Git, GitHub & Freelance Profile Launch', tier: 'Bootcamp', weeks: 2, hours: 8, price_pkr: 0, badges: ['free', 'new'], free_mode: 'signin', summary: 'Version control plus a polished GitHub and Upwork/Fiverr presence before your first client.' },
  { code: 'BC-07', title: 'Excel + AI for Office Professionals', tier: 'Bootcamp', weeks: 2, hours: 8, price_pkr: 5000, badges: ['new'], summary: 'Clean data, build reports and automate repetitive office work by pairing Excel with AI assistants.' },
  { code: 'BC-08', title: 'Canva & AI Content Creation', tier: 'Bootcamp', weeks: 2, hours: 8, price_pkr: 5000, badges: [], summary: 'Design social posts, brand kits and marketing visuals quickly with Canva + AI tools.' },
  { code: 'SC-01', title: 'Python for Data Science', tier: 'Short Course', weeks: 6, hours: 24, price_pkr: 12500, badges: ['high_demand'], summary: 'Pandas, NumPy and Matplotlib applied to real datasets, ending with a portfolio analysis project.' },
  { code: 'SC-02', title: 'Generative AI Essentials', tier: 'Short Course', weeks: 6, hours: 24, price_pkr: 14000, badges: ['high_demand'], summary: 'LLMs, embeddings, retrieval and building your first AI-powered features with today\'s APIs.' },
  { code: 'SC-03', title: 'Data Analytics with SQL & Power BI', tier: 'Short Course', weeks: 6, hours: 24, price_pkr: 13500, badges: ['high_demand'], summary: 'Production-grade SQL queries turned into interactive Power BI dashboards decision-makers use.' },
  { code: 'SC-04', title: 'Introduction to Machine Learning', tier: 'Short Course', weeks: 6, hours: 24, price_pkr: 13000, badges: [], summary: 'Train, evaluate and honestly interpret your first models - the foundation for every advanced AI track.' },
  { code: 'SC-05', title: 'AI Automation Tools Track', tier: 'Short Course', weeks: 6, hours: 24, price_pkr: 14000, badges: [], summary: 'A deeper pass across n8n, Make, Zapier and AI agents wired into real business processes.' },
  { code: 'SC-06', title: 'Frontend Web Development with HTML, CSS & JavaScript', tier: 'Short Course', weeks: 6, hours: 24, price_pkr: 13000, badges: ['new', 'high_demand'], summary: 'From blank file to responsive, deployed website - practiced quest by quest in the EchoLens compiler.' },
  { code: 'SC-07', title: 'JavaScript Deep Dive: DOM, Async & APIs', tier: 'Short Course', weeks: 6, hours: 24, price_pkr: 13000, badges: ['new', 'high_demand'], summary: 'The bridge to React: master the DOM, asynchronous JavaScript and consuming real REST APIs.' },
  { code: 'SC-08', title: 'Digital Marketing & SEO Fundamentals', tier: 'Short Course', weeks: 6, hours: 24, price_pkr: 12000, badges: ['new'], summary: 'Run real campaigns: search optimisation, paid social basics and analytics.' },
  { code: 'SC-09', title: 'Freelancing & Client Acquisition Mastery', tier: 'Short Course', weeks: 6, hours: 24, price_pkr: 9000, badges: ['new'], summary: 'Positioning, proposals, pricing and client communication - turning skills into income.' },
  { code: 'SC-10', title: 'Graphic Design Basics', tier: 'Short Course', weeks: 6, hours: 24, price_pkr: 10000, badges: [], summary: 'Core design principles, typography and brand assets - a solid visual foundation.' },
  { code: 'SC-11', title: 'Content Writing with AI', tier: 'Short Course', weeks: 6, hours: 24, price_pkr: 9000, badges: [], summary: 'Professional writing workflows pairing human judgement with AI drafting, editing and research.' },
  { code: 'ST-01', title: 'WordPress Development', tier: 'Specialist Track', weeks: 8, hours: 32, price_pkr: 20000, badges: [], summary: 'Custom themes, WooCommerce stores and performance hardening - a large, reliable freelance market.' },
  { code: 'ST-02', title: 'Graphic Designing', tier: 'Specialist Track', weeks: 8, hours: 32, price_pkr: 20000, badges: [], summary: 'A full professional design track: brand identity, collateral and a portfolio built to client standards.' },
  { code: 'ST-03', title: 'UI/UX Designing', tier: 'Specialist Track', weeks: 8, hours: 32, price_pkr: 21000, badges: ['high_demand'], summary: 'Research, wireframing and high-fidelity product design in Figma, closing with a shipped-quality case study.' },
  { code: 'ST-04', title: 'Data Analytics Specialist Track', tier: 'Specialist Track', weeks: 8, hours: 32, price_pkr: 21500, badges: ['high_demand'], summary: 'Python, SQL, statistics and data storytelling - the complete analyst skill set employers hire for.' },
  { code: 'ST-05', title: 'Generative AI Engineering', tier: 'Specialist Track', weeks: 8, hours: 32, price_pkr: 22500, badges: ['high_demand'], summary: 'Production LLM systems: retrieval-augmented generation, evaluation and deployment.' },
  { code: 'ST-06', title: 'AI Agents & Automation Engineering', tier: 'Specialist Track', weeks: 8, hours: 32, price_pkr: 23000, badges: ['high_demand'], summary: 'Multi-step, tool-calling AI agents that plan, act and integrate with real business systems.' },
  { code: 'ST-07', title: 'Machine Learning Fundamentals', tier: 'Specialist Track', weeks: 8, hours: 32, price_pkr: 21500, badges: [], summary: 'Classical ML done rigorously: feature engineering, model selection and honest evaluation.' },
  { code: 'ST-08', title: 'Deep Learning with PyTorch', tier: 'Specialist Track', weeks: 8, hours: 32, price_pkr: 23000, badges: [], summary: 'Neural networks, computer vision and transfer learning, through to deploying a trained model.' },
  { code: 'ST-09', title: 'Full-Stack JavaScript: React, Node & PostgreSQL', tier: 'Specialist Track', weeks: 8, hours: 32, price_pkr: 25000, badges: ['new', 'flagship'], summary: 'Our premium flagship: build and deploy a complete production web application on the 2026 stack.' },
  { code: 'ST-10', title: 'React + Next.js Frontend Specialist', tier: 'Specialist Track', weeks: 8, hours: 32, price_pkr: 22000, badges: ['new', 'high_demand'], summary: 'Component architecture, state management and server-side rendering with Next.js.' },
  { code: 'ST-11', title: 'Mobile Apps with Flutter', tier: 'Specialist Track', weeks: 8, hours: 32, price_pkr: 22000, badges: ['new'], summary: 'One codebase, two app stores: build and publish real Android and iOS apps.' },
  { code: 'ST-12', title: 'Video Editing', tier: 'Specialist Track', weeks: 8, hours: 32, price_pkr: 20000, badges: [], summary: 'Professional editing workflows, pacing and delivery for client and commercial work.' },
  // Free Micro Courses - one 60-90 minute slot, purely quest based, 8 quests
  // each, automatic certificate. Deliberately outside the paid catalogue.
  { code: 'FC-01', title: 'Basics of C Programming', tier: 'Micro Course', weeks: 1, hours: 1.5, price_pkr: 0, badges: ['free'], free_mode: 'signin', summary: 'The language everything else was built on - your first compiling, running C programs in one slot.' },
  { code: 'FC-02', title: 'Basics of C++ and Objects', tier: 'Micro Course', weeks: 1, hours: 1.5, price_pkr: 0, badges: ['free'], free_mode: 'signin', summary: 'Your first taste of object oriented thinking - cout, cin, functions, and a working class.' },
  { code: 'FC-03', title: 'Basics of Java', tier: 'Micro Course', weeks: 1, hours: 1.5, price_pkr: 0, badges: ['free'], free_mode: 'signin', summary: 'The language of enterprise and Android - one running program removes the setup barrier.' },
  { code: 'FC-04', title: 'Basics of Linux and the Command Line', tier: 'Micro Course', weeks: 1, hours: 1, price_pkr: 0, badges: ['free'], free_mode: 'signin', summary: 'Stop being scared of the black screen - an hour of real terminal commands.' },
  { code: 'FC-05', title: 'Basics of Data Structures', tier: 'Micro Course', weeks: 1, hours: 1.5, price_pkr: 0, badges: ['free'], free_mode: 'signin', summary: 'How programs actually store things - arrays, stacks, and queues in plain English.' },
  { code: 'FC-06', title: 'Basics of Algorithms and Flowcharts', tier: 'Micro Course', weeks: 1, hours: 1, price_pkr: 0, badges: ['free'], free_mode: 'signin', summary: 'Think like a programmer before you write code - no programming language at all.' },
  { code: 'FC-07', title: 'Basics of Computer Networking', tier: 'Micro Course', weeks: 1, hours: 1, price_pkr: 0, badges: ['free'], free_mode: 'signin', summary: 'What actually happens when you open a website - IPs, DNS, and your home network.' },
  { code: 'FC-08', title: 'Basics of Cybersecurity and Online Safety', tier: 'Micro Course', weeks: 1, hours: 1, price_pkr: 0, badges: ['free'], free_mode: 'signin', summary: 'Protect your accounts, your money, and your data - useful to every single person.' },
  { code: 'FC-09', title: 'Basics of Cloud Computing', tier: 'Micro Course', weeks: 1, hours: 1, price_pkr: 0, badges: ['free'], free_mode: 'signin', summary: 'Where every modern app actually lives - nothing to install, nothing to pay for.' },
  { code: 'FC-10', title: 'Basics of Regex and Text Patterns', tier: 'Micro Course', weeks: 1, hours: 1, price_pkr: 0, badges: ['free'], free_mode: 'signin', summary: 'Find any pattern in any text, instantly - a small skill with an outsized payoff.' },
];
// The Web Developer Path bundle - the recommended beginner-to-job route.
const LEARNING_PATHS = [
  { key: 'web-dev-path', title: 'The Web Developer Path', codes: ['BC-04', 'SC-06', 'SC-07', 'ST-09'],
    summary: 'Complete beginner to job-ready full-stack developer on the highest-demand 2026 stack: JavaScript foundations, React and PostgreSQL.',
    bundle_pkr: 43500, full_pkr: 51000, save_pkr: 7500 },
];
function loadOfficialCatalogue() {
  let added = 0;
  for (const c of OFFICIAL_CATALOGUE) {
    const existing = data.courses.find((x) => x.code === c.code);
    if (!existing) { Courses.create(c); added += 1; }
    // Keep the stored copy's price in step with the official catalogue, so a
    // price change in code reaches databases that already hold the course.
    else if (existing.price_pkr !== c.price_pkr) { existing.price_pkr = c.price_pkr; save(); }
  }
  return { added, total: OFFICIAL_CATALOGUE.length };
}

/* ---------------------------------- seed ---------------------------------- */
function seed() {
  data = empty();
  const admin = Users.createFixed({ name: 'EchoLens Admin', role: 'admin', username: 'admin@echolens.digital', email: 'admin@echolens.digital', password: 'ChangeMe!2026' });
  const teacher = Users.createFixed({ name: 'Lead Teacher', role: 'instructor', username: 'teacher@echolens.digital', email: 'teacher@echolens.digital', password: 'ChangeMe!2026' });
  const coord = Users.createFixed({ name: 'Student Coordinator', role: 'coordinator', username: 'coordinator@echolens.digital', email: 'coordinator@echolens.digital', password: 'ChangeMe!2026' });
  const student = Users.createFixed({ name: 'Demo Student', role: 'student', username: 'student@echolens.digital', email: 'student@echolens.digital', password: 'ChangeMe!2026' });

  loadOfficialCatalogue();
  const sc01 = data.courses.find((c) => c.code === 'SC-01');

  const b1 = Batches.create({ course_id: sc01.id, name: 'August 2026 Cohort', start_date: '2026-08-01', status: 'running', instructor_ids: [teacher.id] });
  Enrollments.create(student.id, b1.id);
  [
    [1, 'Course kickoff and the RAG mental model', '2026-07-07', '20:00', '22:00'],
    [1, 'Variables, types and first programs', '2026-07-09', '20:00', '22:00'],
    [2, 'Control flow: conditionals and loops', '2026-07-14', '20:00', '22:00'],
  ].forEach(([wk, title, d, st, et]) => Sessions.create({ batch_id: b1.id, week_no: wk, title, session_date: d, start_time: st, end_time: et }));
  Lessons.create({ course_id: sc01.id, batch_id: b1.id, week_no: 1, title: 'Week 1 slides: Python foundations', type: 'slides', url: '#', position: 1 });
  Assignments.create({ batch_id: b1.id, title: 'Setup proof: your first script', description: 'Submit a PDF showing your Python setup and first program running.', due_date: '2026-08-10', points: 100, created_by: teacher.id });
  Announcements.create({ batch_id: null, title: 'Welcome to EchoLens', body: 'Sign in to reach your courses, schedule, content and assignments.' }, admin.id);
  save();
  console.log('Seed complete. Database file:', DB_PATH);
  console.log('Accounts (username / password) - change after first login:');
  console.log('  admin@echolens.digital       / ChangeMe!2026  (admin)');
  console.log('  teacher@echolens.digital     / ChangeMe!2026  (teacher)');
  console.log('  coordinator@echolens.digital / ChangeMe!2026  (coordinator)');
  console.log('  student@echolens.digital     / ChangeMe!2026  (student, reg no: ' + student.reg_no + ')');
}

/* ============================== v11 features ============================== */

/* ------------------------------ attendance ------------------------------ */
// Joining a scheduled class's built-in room marks attendance automatically;
// heartbeats accumulate minutes spent in the room.
const Attendance = {
  mark(sessionId, userId) {
    let a = data.attendance.find((x) => x.session_id === Number(sessionId) && x.user_id === Number(userId));
    if (!a) {
      a = { id: nextId('attendance'), session_id: Number(sessionId), user_id: Number(userId), joined_at: now(), minutes: 0 };
      data.attendance.push(a); save();
    }
    return a;
  },
  heartbeat(sessionId, userId) {
    const a = Attendance.mark(sessionId, userId);
    a.minutes = (a.minutes || 0) + 1; a.last_seen = now(); save();
    return a;
  },
  forSession(sessionId) { return data.attendance.filter((a) => a.session_id === Number(sessionId)); },
  // Attendance sheet for one class: every enrolled student, present or absent.
  sheet(session) {
    const present = new Map(Attendance.forSession(session.id).map((a) => [a.user_id, a]));
    return Enrollments.studentsForBatch(session.batch_id).map((u) => {
      const a = present.get(u.id);
      return { id: u.id, name: u.name, reg_no: u.reg_no, present: !!a, joined_at: a ? a.joined_at : null, minutes: a ? a.minutes : 0 };
    }).sort((x, y) => Number(y.present) - Number(x.present) || x.name.localeCompare(y.name));
  },
  // % of this course's held classes a student attended.
  rate(uid, bid) {
    const held = Sessions.held(bid);
    if (!held.length) return null;
    const attended = held.filter((s) => data.attendance.some((a) => a.session_id === s.id && a.user_id === Number(uid))).length;
    return { attended, total: held.length, pct: Math.round((attended / held.length) * 100) };
  },
};

/* ------------------------------ live quizzes ------------------------------ */
// Teachers pop a quiz any time (even mid-class). It stays open for a short
// window; outside the window nobody can take it until the teacher reopens.
const Quizzes = {
  create({ batch_id, title, questions, duration_min, points, created_by }) {
    const qs = (Array.isArray(questions) ? questions : []).slice(0, 30).map((q, i) => ({
      no: i + 1, q: String(q.q || '').slice(0, 500),
      options: (Array.isArray(q.options) ? q.options : []).slice(0, 6).map((o) => String(o).slice(0, 200)),
      answer: Number(q.answer) || 0, // index into options - never sent to students
    })).filter((q) => q.q && q.options.length >= 2);
    if (!qs.length) return { error: 'Add at least one question with two options.' };
    const quiz = {
      id: nextId('quizzes'), batch_id: Number(batch_id), title: String(title || 'Pop quiz').slice(0, 200),
      questions: qs, duration_min: Math.max(1, Math.min(180, Number(duration_min) || 10)),
      points: Math.max(5, Math.min(200, Number(points) || 20)),
      allow_ide: !!arguments[0].allow_ide, // teacher choice: show a practice IDE terminal during the quiz
      opened_at: null, closes_at: null, created_by, created_at: now(),
    };
    data.quizzes.push(quiz); save();
    return { ok: true, quiz };
  },
  byId(id) { return data.quizzes.find((q) => q.id === Number(id)) || null; },
  forBatch(bid) { return data.quizzes.filter((q) => q.batch_id === Number(bid)).sort((a, b) => b.id - a.id); },
  open(id, minutes) {
    const q = Quizzes.byId(id); if (!q) return null;
    if (minutes) q.duration_min = Math.max(1, Math.min(180, Number(minutes)));
    q.opened_at = now();
    q.closes_at = new Date(Date.now() + q.duration_min * 60000).toISOString();
    save();
    return q;
  },
  close(id) { const q = Quizzes.byId(id); if (!q) return null; q.closes_at = new Date().toISOString(); save(); return q; },
  isOpen(q) { return !!(q.opened_at && q.closes_at && new Date(q.closes_at) > new Date()); },
  remove(id) {
    data.quizzes = data.quizzes.filter((q) => q.id !== Number(id));
    data.quiz_attempts = data.quiz_attempts.filter((a) => a.quiz_id !== Number(id));
    save();
  },
  attempt(quizId, userId, answers) {
    const q = Quizzes.byId(quizId); if (!q) return { error: 'Quiz not found.' };
    if (!Quizzes.isOpen(q)) return { error: 'This quiz is closed. Your teacher has to reopen it.' };
    if (data.quiz_attempts.some((a) => a.quiz_id === q.id && a.user_id === Number(userId))) return { error: 'You already took this quiz.' };
    let correct = 0;
    q.questions.forEach((qq, i) => { if (Number((answers || [])[i]) === qq.answer) correct += 1; });
    const scorePct = Math.round((correct / q.questions.length) * 100);
    const gems = Math.round(q.points * scorePct / 100);
    const a = {
      id: nextId('quiz_attempts'), quiz_id: q.id, user_id: Number(userId),
      answers: (answers || []).slice(0, q.questions.length).map(Number),
      correct, total: q.questions.length, score_pct: scorePct, gems, taken_at: now(),
    };
    data.quiz_attempts.push(a);
    if (gems > 0) GemEvents.create({ user_id: Number(userId), batch_id: q.batch_id, amount: gems, source: 'quiz', note: `Quiz: ${q.title}` });
    save();
    return { ok: true, attempt: a };
  },
  myAttempt(quizId, userId) { return data.quiz_attempts.find((a) => a.quiz_id === Number(quizId) && a.user_id === Number(userId)) || null; },
  results(quizId) {
    return data.quiz_attempts.filter((a) => a.quiz_id === Number(quizId)).map((a) => {
      const u = Users.byId(a.user_id) || {};
      return { ...a, name: u.name, reg_no: u.reg_no };
    }).sort((a, b) => b.score_pct - a.score_pct);
  },
};

/* ------------------------- QR verified certificates ------------------------- */
// Key concepts covered = each installed quest level's title/topic, in order.
function courseConcepts(bid) {
  return Quests.forBatch(bid).map((q) => ({ no: q.no, title: q.title, topic: q.topic || null }));
}
// Final/capstone project = the highest-numbered quest level's problems and
// this student's submissions for them. Snapshotted onto the certificate at
// issue time (not looked up live later) so it stays accurate even if the
// course content or submissions change afterwards.
function finalProjectFor(bid, uid) {
  const quests = Quests.forBatch(bid); // sorted ascending by .no
  if (!quests.length) return null;
  const finalQuest = quests[quests.length - 1];
  const items = finalQuest.problems.map((p) => {
    const s = data.quest_submissions.find((x) => x.quest_id === finalQuest.id && x.pid === p.pid && x.user_id === Number(uid));
    if (!s) return null;
    return {
      problem_title: p.title, problem_description: p.description || null,
      file_url: s.file_url || null, code: s.code || null, language: s.language || null,
      note: s.note || null, grade: s.grade,
    };
  }).filter(Boolean);
  if (!items.length) return null;
  return { level_no: finalQuest.no, level_title: finalQuest.title, level_topic: finalQuest.topic || null, items };
}
const Certificates = {
  serial() {
    let s;
    do { s = `EL-${new Date().getFullYear()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`; }
    while (data.certificates.some((c) => c.serial === s));
    return s;
  },
  issue({ user_id, batch_id, kind, title, completion_date, detail, instructor_id, issued_by, concepts, final_project }) {
    const u = Users.byId(user_id); if (!u) return { error: 'Student not found.' };
    // One certificate per student per course/title - reissue replaces it.
    data.certificates = data.certificates.filter((c) => !(c.user_id === u.id && c.title === title));
    const instructor = instructor_id ? Users.byId(instructor_id) : null;
    const cert = {
      id: nextId('certificates'), serial: Certificates.serial(),
      user_id: u.id, student_name: u.name, reg_no: u.reg_no,
      batch_id: batch_id ? Number(batch_id) : null,
      kind: ['course', 'hackathon', 'competition', 'quest', 'webinar'].includes(kind) ? kind : 'course',
      title: String(title).slice(0, 200),
      detail: String(detail || '').slice(0, 400),
      completion_date: /^\d{4}-\d{2}-\d{2}$/.test(String(completion_date)) ? completion_date : today(),
      instructor_name: instructor ? instructor.name : null,
      instructor_sig: instructor ? (instructor.signature || null) : null,
      concepts: Array.isArray(concepts) ? concepts.slice(0, 40) : [],
      final_project: final_project || null,
      issued_by, issued_at: now(),
    };
    data.certificates.push(cert); save();
    return { ok: true, cert };
  },
  bySerial(s) { return data.certificates.find((c) => c.serial === String(s).trim().toUpperCase()) || null; },
  forUser(uid) { return data.certificates.filter((c) => c.user_id === Number(uid)).sort((a, b) => b.id - a.id); },
  forBatch(bid) { return data.certificates.filter((c) => c.batch_id === Number(bid)); },
  revoke(id) { data.certificates = data.certificates.filter((c) => c.id !== Number(id)); save(); },
  // Public view: what the QR verification page shows. No emails, no ids.
  publicView(c) {
    const s = Settings.cert();
    return {
      serial: c.serial, student_name: c.student_name, reg_no: c.reg_no,
      kind: c.kind, title: c.title, detail: c.detail, completion_date: c.completion_date,
      instructor_name: c.instructor_name, instructor_sig: c.instructor_sig,
      org: s.org, tagline: s.tagline, ceo_name: s.ceo_name, ceo_sig: s.ceo_sig,
      concepts: c.concepts || [], final_project: c.final_project || null,
      issued_at: (c.issued_at || '').slice(0, 10),
    };
  },
};
const Settings = {
  cert() { return data.settings && data.settings.cert ? data.settings.cert : empty().settings.cert; },
  setCert(fields) {
    if (!data.settings) data.settings = empty().settings;
    const c = data.settings.cert;
    for (const k of ['org', 'ceo_name', 'tagline']) if (fields[k] !== undefined) c[k] = String(fields[k]).slice(0, 200);
    if (fields.ceo_sig !== undefined) c.ceo_sig = fields.ceo_sig;
    save();
    return c;
  },
  // v18: bank details the Admissions Office sets once and every challan
  // snapshots. Databases saved before the dummy defaults existed hold all-empty
  // strings, so an effectively blank record also falls back to the defaults.
  bank() {
    const b = data.settings && data.settings.bank;
    if (!b || !Object.values(b).some((v) => String(v || '').trim())) return empty().settings.bank;
    return b;
  },
  setBank(fields) {
    if (!data.settings) data.settings = empty().settings;
    if (!data.settings.bank) data.settings.bank = empty().settings.bank;
    const b = data.settings.bank;
    for (const k of ['bank_name', 'account_title', 'account_number', 'iban', 'branch']) if (fields[k] !== undefined) b[k] = String(fields[k]).slice(0, 200);
    save();
    return b;
  },
};

/* ------------------------- datasets attached to tasks ------------------------- */
// Teachers attach CSVs (or any data file) to a quest problem; the built-in
// compiler mounts them into Python's filesystem so pd.read_csv('name.csv')
// works exactly like on a laptop.
const TaskFiles = {
  add({ quest_id, pid, name, url, size, by }) {
    const f = { id: nextId('task_files'), quest_id: Number(quest_id), pid: Number(pid), name: String(name).slice(0, 200), url, size: Number(size) || 0, by, created_at: now() };
    data.task_files.push(f); save();
    return f;
  },
  byId(id) { return data.task_files.find((f) => f.id === Number(id)) || null; },
  forProblem(qid, pid) { return data.task_files.filter((f) => f.quest_id === Number(qid) && f.pid === Number(pid)); },
  forQuest(qid) { return data.task_files.filter((f) => f.quest_id === Number(qid)); },
  remove(id) { data.task_files = data.task_files.filter((f) => f.id !== Number(id)); save(); },
};

/* ------------------------------ at-risk report ------------------------------ */
// A student is flagged when attendance is low, assignments are missing, or
// grades are below the pass mark. Staff see WHY, not just a score.
function riskReport(bid) {
  const quests = Quests.forBatch(bid);
  const openQuests = quests; // staff view considers all published levels
  const totalProblems = openQuests.reduce((s, q) => s + q.problems.length, 0);
  return Enrollments.studentsForBatch(bid).map((u) => {
    const subs = data.quest_submissions.filter((s) => s.user_id === u.id && openQuests.some((q) => q.id === s.quest_id));
    const graded = subs.filter((s) => s.grade != null);
    const avg = graded.length ? Math.round(graded.reduce((s, x) => s + x.grade, 0) / graded.length) : null;
    const att = Attendance.rate(u.id, bid);
    const missing = Math.max(0, totalProblems - subs.length);
    const reasons = [];
    if (att && att.pct < 60) reasons.push(`Attended ${att.attended}/${att.total} classes (${att.pct}%)`);
    if (totalProblems > 0 && missing / totalProblems > 0.4) reasons.push(`${missing} of ${totalProblems} tasks not submitted`);
    if (avg != null && avg < 60) reasons.push(`Average grade ${avg}%`);
    const lastActive = u.last_active || null;
    if (lastActive && (Date.now() - new Date(lastActive + 'T00:00:00')) > 7 * 86400000) reasons.push(`Inactive since ${lastActive}`);
    const level = reasons.length >= 2 ? 'high' : reasons.length === 1 ? 'watch' : 'ok';
    return {
      id: u.id, name: u.name, reg_no: u.reg_no, email: u.email || null,
      attendance: att, submitted: subs.length, total_tasks: totalProblems, avg_grade: avg,
      last_active: lastActive, risk: level, reasons,
    };
  }).sort((a, b) => ({ high: 0, watch: 1, ok: 2 }[a.risk] - { high: 0, watch: 1, ok: 2 }[b.risk]) || a.name.localeCompare(b.name));
}

/* ------------------------- full student profile (staff) ------------------------- */
// Open-web activity: free quest tracks (OpenQuest), hackathons and events
// registered for (portal or open tier - membership is by user_id either
// way), and community challenges. Shared by the admin's student profile
// modal and the open user's own self-service profile page.
function openActivity(uid) {
  const trackKeys = [...new Set(data.open_submissions.filter((s) => s.user_id === Number(uid)).map((s) => s.track_key))];
  const tracks = trackKeys.map((key) => {
    const t = TRACKS[key]; if (!t) return null;
    const prog = OpenQuest.progress(uid, key);
    return { key, title: t.title, description: t.description, free: !!t.free, ...prog };
  }).filter(Boolean);
  const hackathons = data.hackathon_entries.filter((e) => (e.member_ids || []).includes(Number(uid))).map((e) => {
    const h = Hackathons.byId(e.hackathon_id); if (!h) return null;
    const sub = data.hackathon_submissions.find((s) => s.entry_id === e.id);
    return { id: h.id, title: h.title, status: hackStatus(h), team_name: e.team_name, payment_status: e.payment_status, registered_at: e.registered_at, submitted: !!sub, score: sub ? sub.score : null };
  }).filter(Boolean);
  const events = data.event_entries.filter((e) => e.user_id === Number(uid)).map((e) => {
    const ev = Events.byId(e.event_id); if (!ev) return null;
    const sub = data.event_submissions.find((s) => s.event_id === ev.id && s.user_id === Number(uid));
    return { id: ev.id, title: ev.title, kind: ev.kind, status: Events.status(ev), payment_status: e.payment_status, registered_at: e.registered_at, submitted: !!sub, score: sub ? sub.score : null };
  }).filter(Boolean);
  const mine = Challenges.mine(uid);
  const challenges = Object.entries(mine).map(([cid, s]) => {
    const c = Challenges.byId(cid); if (!c) return null;
    return { id: c.id, title: c.title, status: s.status, gems: c.gems || 0 };
  }).filter(Boolean);
  return { tracks, hackathons, events, challenges };
}
function fullStudentProfile(uid) {
  const u = Users.byId(uid); if (!u) return null;
  const gems = totalGemsForStudent(u.id);
  const courses = coursesForUser(u).map((b) => {
    const bd = Batches.decorate(b);
    const prog = Quests.installed(b.id) ? Quests.progress(u.id, b.id) : null;
    const qids = Quests.forBatch(b.id).map((q) => q.id);
    const subs = data.quest_submissions.filter((s) => s.user_id === u.id && qids.includes(s.quest_id));
    return {
      batch_id: b.id, title: bd.title || bd.name, cohort: bd.name, code: bd.code,
      gems: gemsForStudentInBatch(u.id, b.id),
      level: prog ? prog.unlocked_up_to : null, levels_total: prog ? prog.levels.length : null,
      quest_title: prog ? prog.title : null, completed: prog ? prog.completed : null,
      submitted: subs.length, graded: subs.filter((s) => s.grade != null).length,
      avg_grade: subs.filter((s) => s.grade != null).length ? Math.round(subs.filter((s) => s.grade != null).reduce((x, s) => x + s.grade, 0) / subs.filter((s) => s.grade != null).length) : null,
      attendance: Attendance.rate(u.id, b.id),
    };
  });
  return {
    id: u.id, name: u.name, role: u.role, reg_no: u.reg_no, username: u.username, email: u.email,
    avatar: u.avatar || null, profile: u.profile || {}, created_at: (u.created_at || '').slice(0, 10),
    gems, stage: stageFor(gems), streak: u.streak || 0, best_streak: u.best_streak || 0, last_active: u.last_active,
    badges: badgesFor(u), courses, ...openActivity(u.id),
    certificates: Certificates.forUser(u.id).map((c) => ({ serial: c.serial, title: c.title, kind: c.kind, completion_date: c.completion_date })),
  };
}
// Self-service profile for an open (free) account - same shape of activity
// data as the admin view above, plus whether a password is set at all
// (Google-only accounts have none, so "change password" becomes "set one").
function openUserProfile(u) {
  const gems = totalGemsForStudent(u.id);
  return {
    id: u.id, name: u.name, reg_no: u.reg_no, email: u.email, avatar: u.avatar || null,
    member_since: (u.created_at || '').slice(0, 10), gems, stage: stageFor(gems),
    streak: u.streak || 0, best_streak: u.best_streak || 0, badges: badgesFor(u),
    has_password: !!u.password_hash, ...openActivity(u.id),
    certificates: Certificates.forUser(u.id).map((c) => ({ serial: c.serial, title: c.title, kind: c.kind, completion_date: c.completion_date })),
  };
}

/* ------------------------------- ambassadors -------------------------------
 * HR-created referral partners. Each carries a unique 4-digit code; students
 * who enter it on the open-web registration form get 10% off automatically. */
const Ambassadors = {
  all() { return data.ambassadors.slice().sort((a, b) => b.id - a.id); },
  byId(id) { return data.ambassadors.find((a) => a.id === Number(id)) || null; },
  byCode(code) {
    const c = String(code || '').trim();
    return c ? data.ambassadors.find((a) => a.active && a.code === c) || null : null;
  },
  create({ name, email }, by) {
    let code;
    do { code = String(Math.floor(1000 + Math.random() * 9000)); } while (data.ambassadors.some((a) => a.code === code));
    const a = {
      id: nextId('ambassadors'), name: String(name || '').trim().slice(0, 120),
      email: String(email || '').trim().toLowerCase().slice(0, 200),
      code, active: true, created_by: by || null, created_at: now(),
    };
    data.ambassadors.push(a); save();
    return a;
  },
  remove(id) { data.ambassadors = data.ambassadors.filter((a) => a.id !== Number(id)); save(); },
  usesFor(code) { return data.registrations.filter((r) => r.ambassador_code === code).length; },
};

function backupNow() {
  try {
    if (!fs.existsSync(DB_PATH)) return null;
    const dir = path.join(path.dirname(DB_PATH), 'backups');
    fs.mkdirSync(dir, { recursive: true });
    const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-');
    const dest = path.join(dir, `echolens-${stamp}.json`);
    fs.copyFileSync(DB_PATH, dest);
    const files = fs.readdirSync(dir).filter((f) => f.startsWith('echolens-')).sort();
    while (files.length > 20) fs.unlinkSync(path.join(dir, files.shift()));
    return dest;
  } catch (e) { console.error('Backup failed:', e.message); return null; }
}

/* ============================== v12: EVENTS ==============================
 * One unified system for admin-created quests, hackathons, competitions and
 * webinars. Every event carries: scope (inside the portal / on the open site
 * / both), entry (free or paid with a payment-screenshot flow), an optional
 * built-in compiler (python/c/cpp/sql/web) with an optional dataset URL,
 * admin-attached documents, problems (for quests & competitions), a pass
 * mark, AI auto-grading (with a 10% reduction), and automatic certificates.
 */
const EVENT_KINDS = ['quest', 'hackathon', 'competition', 'webinar'];
const EVENT_SCOPES = ['portal', 'open', 'both'];
const EVENT_LANGS = ['none', 'python', 'c', 'cpp', 'sql', 'web'];

const Events = {
  byId(id) { return data.events.find((e) => e.id === Number(id)) || null; },
  status(ev) {
    // v18: an admin-set deadline (a plain date) wins over everything else -
    // once it has passed, the event is over for submissions no matter its
    // kind or open flag. Open quests use this as their specific cutoff.
    if (ev.deadline && today() > ev.deadline) return 'ended';
    if (ev.kind === 'quest' && !ev.starts_at) return ev.open ? 'live' : 'closed';
    const t = new Date().toISOString().slice(0, 16).replace('T', ' ');
    const st = String(ev.starts_at || '').replace('T', ' ');
    const en = String(ev.ends_at || '').replace('T', ' ');
    if (!ev.open) return 'closed';
    if (st && t < st) return 'upcoming';
    if (!en || t <= en) return 'live';
    return 'ended';
  },
  decorate(ev) {
    return {
      ...ev,
      status: Events.status(ev),
      entries_count: data.event_entries.filter((x) => x.event_id === ev.id).length,
      submissions_count: data.event_submissions.filter((x) => x.event_id === ev.id).length,
      comments_count: data.event_comments.filter((x) => x.event_id === ev.id).length,
    };
  },
  all() { return data.events.slice().sort((a, b) => b.id - a.id).map((e) => Events.decorate(e)); },
  forScope(scope) { // 'portal' or 'open' - 'both' events show everywhere
    return Events.all().filter((e) => e.scope === scope || e.scope === 'both');
  },
  create(b, by) {
    const problems = Array.isArray(b.problems) ? b.problems.slice(0, 40).map((p, i) => ({
      pid: i + 1,
      title: String(p.title || `Task ${i + 1}`).slice(0, 200),
      description: String(p.description || '').slice(0, 8000),
      points: Math.max(5, Math.min(500, Number(p.points) || 100)),
      difficulty: ['Easy', 'Medium', 'Hard'].includes(p.difficulty) ? p.difficulty : 'Easy',
      input_spec: String(p.input_spec || '').slice(0, 1000) || null,
      output_spec: String(p.output_spec || '').slice(0, 1000) || null,
      example_input: String(p.example_input || '').slice(0, 1000) || null,
      example_output: String(p.example_output || '').slice(0, 1000) || null,
    })) : [];
    const ev = {
      id: nextId('events'),
      kind: EVENT_KINDS.includes(b.kind) ? b.kind : 'quest',
      title: String(b.title || '').slice(0, 200),
      description: String(b.description || '').slice(0, 8000),
      scope: EVENT_SCOPES.includes(b.scope) ? b.scope : 'both',
      entry: b.entry === 'paid' ? 'paid' : 'free',
      fee_pkr: Number(b.fee_pkr) || 0,
      pay_instructions: String(b.pay_instructions || '').slice(0, 1000) || null,
      starts_at: b.starts_at || null, ends_at: b.ends_at || null,
      // Admin-set cutoff date for open quests (and any event): submissions
      // and certificate eligibility close after this date.
      deadline: /^\d{4}-\d{2}-\d{2}$/.test(String(b.deadline || '')) ? b.deadline : null,
      duration_minutes: Math.max(0, Math.min(600, Number(b.duration_minutes) || 0)) || null,
      pass_mark: Math.max(0, Math.min(100, Number(b.pass_mark) || 0)),
      auto_grade: !!b.auto_grade,
      auto_certificate: !!b.auto_certificate,
      compiler: EVENT_LANGS.includes(b.compiler) ? b.compiler : 'none',
      dataset_url: String(b.dataset_url || '').slice(0, 500) || null,
      files: [],
      problems,
      prizes: { first: Number(b.prize1) || 0, second: Number(b.prize2) || 0, third: Number(b.prize3) || 0 },
      meeting_link: String(b.meeting_link || '').slice(0, 400) || null,
      open: b.open !== false,
      created_by: by, created_at: now(),
    };
    data.events.push(ev); save();
    return ev;
  },
  update(id, b) {
    const ev = Events.byId(id); if (!ev) return null;
    for (const k of ['title', 'description', 'pay_instructions', 'dataset_url', 'meeting_link']) if (b[k] !== undefined) ev[k] = String(b[k]).slice(0, 8000) || null;
    if (b.kind !== undefined && EVENT_KINDS.includes(b.kind)) ev.kind = b.kind;
    if (b.scope !== undefined && EVENT_SCOPES.includes(b.scope)) ev.scope = b.scope;
    if (b.entry !== undefined) ev.entry = b.entry === 'paid' ? 'paid' : 'free';
    if (b.fee_pkr !== undefined) ev.fee_pkr = Number(b.fee_pkr) || 0;
    if (b.starts_at !== undefined) ev.starts_at = b.starts_at || null;
    if (b.ends_at !== undefined) ev.ends_at = b.ends_at || null;
    if (b.deadline !== undefined) ev.deadline = /^\d{4}-\d{2}-\d{2}$/.test(String(b.deadline || '')) ? b.deadline : null;
    if (b.duration_minutes !== undefined) ev.duration_minutes = Math.max(0, Math.min(600, Number(b.duration_minutes) || 0)) || null;
    if (b.pass_mark !== undefined) ev.pass_mark = Math.max(0, Math.min(100, Number(b.pass_mark) || 0));
    if (b.auto_grade !== undefined) ev.auto_grade = !!b.auto_grade;
    if (b.auto_certificate !== undefined) ev.auto_certificate = !!b.auto_certificate;
    if (b.compiler !== undefined && EVENT_LANGS.includes(b.compiler)) ev.compiler = b.compiler;
    if (b.open !== undefined) ev.open = !!b.open;
    if (Array.isArray(b.problems)) {
      ev.problems = b.problems.slice(0, 40).map((p, i) => ({
        pid: i + 1, title: String(p.title || `Task ${i + 1}`).slice(0, 200),
        description: String(p.description || '').slice(0, 8000),
        points: Math.max(5, Math.min(500, Number(p.points) || 100)),
        difficulty: ['Easy', 'Medium', 'Hard'].includes(p.difficulty) ? p.difficulty : 'Easy',
        input_spec: String(p.input_spec || '').slice(0, 1000) || null,
        output_spec: String(p.output_spec || '').slice(0, 1000) || null,
        example_input: String(p.example_input || '').slice(0, 1000) || null,
        example_output: String(p.example_output || '').slice(0, 1000) || null,
      }));
    }
    save();
    return ev;
  },
  addFile(id, { name, url }) {
    const ev = Events.byId(id); if (!ev) return null;
    ev.files = ev.files || [];
    ev.files.push({ name: String(name).slice(0, 200), url });
    save();
    return ev;
  },
  removeFile(id, name) {
    const ev = Events.byId(id); if (!ev) return null;
    ev.files = (ev.files || []).filter((f) => f.name !== name);
    save();
    return ev;
  },
  remove(id) {
    const eid = Number(id);
    data.events = data.events.filter((e) => e.id !== eid);
    data.event_entries = data.event_entries.filter((e) => e.event_id !== eid);
    data.event_submissions = data.event_submissions.filter((s) => s.event_id !== eid);
    data.event_comments = data.event_comments.filter((c) => c.event_id !== eid);
    save();
  },
  entryFor(eid, uid) { return data.event_entries.find((e) => e.event_id === Number(eid) && e.user_id === Number(uid)) || null; },
  register({ event_id, user, payment_shot }) {
    const ev = Events.byId(event_id); if (!ev) return { error: 'Event not found.' };
    const st = Events.status(ev);
    if (st === 'ended' || st === 'closed') return { error: 'Registration is closed for this event.' };
    if (Events.entryFor(ev.id, user.id)) return { error: 'You are already registered for this event.' };
    if (ev.entry === 'paid' && !payment_shot) return { error: 'Upload a screenshot of your payment transaction to register.' };
    const e = {
      id: nextId('event_entries'), event_id: ev.id, user_id: user.id,
      name: user.name, reg_no: user.reg_no || null, tier: user.role === 'free' ? 'open' : 'portal',
      payment_status: ev.entry === 'paid' ? 'pending' : 'na',
      payment_shot: ev.entry === 'paid' ? payment_shot : null,
      registered_at: now(),
    };
    data.event_entries.push(e); save();
    return { entry: e };
  },
  confirmPayment(entryId, ok, by) {
    const e = data.event_entries.find((x) => x.id === Number(entryId)); if (!e) return null;
    e.payment_status = ok ? 'confirmed' : 'rejected'; e.payment_by = by; e.payment_at = now(); save();
    return e;
  },
  canParticipate(ev, uid) {
    const e = Events.entryFor(ev.id, uid);
    if (!e) return { ok: false, why: 'Register for this event first.' };
    if (ev.entry === 'paid' && e.payment_status !== 'confirmed') {
      return { ok: false, why: e.payment_status === 'rejected' ? 'Your payment was rejected - contact the admin.' : 'Your payment is being verified by the admin.' };
    }
    return { ok: true, entry: e };
  },
  submissionFor(eid, uid, pid) {
    return data.event_submissions.find((s) => s.event_id === Number(eid) && s.user_id === Number(uid) && (s.pid || null) === (pid ? Number(pid) : null)) || null;
  },
  submit({ event_id, user, pid, code, language, file_url, file_name, link, note }) {
    const ev = Events.byId(event_id); if (!ev) return { error: 'Event not found.' };
    const st = Events.status(ev);
    if (st !== 'live') return { error: st === 'upcoming' ? 'This event has not started yet.' : 'This event is over - submissions are closed.' };
    const gate = Events.canParticipate(ev, user.id);
    if (!gate.ok) return { error: gate.why };
    if (pid && !(ev.problems || []).some((p) => p.pid === Number(pid))) return { error: 'Task not found on this event.' };
    if (!code && !file_url && !link) return { error: 'Submit code, a file, or a link to your work.' };
    let s = Events.submissionFor(ev.id, user.id, pid);
    const fields = {
      code: code ? String(code).slice(0, 60000) : null,
      language: language ? String(language).slice(0, 20) : null,
      file_url: file_url || null, file_name: file_name || null,
      link: link ? String(link).slice(0, 400) : null,
      note: note ? String(note).slice(0, 500) : null,
      submitted_at: now(),
    };
    if (s) { Object.assign(s, fields, { ai_score: null, score: null, ai_feedback: null, graded_by: null, graded_at: null, certified: s.certified || false }); }
    else {
      s = { id: nextId('event_submissions'), event_id: ev.id, entry_id: gate.entry.id, user_id: user.id, pid: pid ? Number(pid) : null, ...fields, ai_score: null, score: null, ai_feedback: null, graded_by: null, graded_at: null, certified: false };
      data.event_submissions.push(s);
    }
    save();
    return { submission: s, event: ev };
  },
  // AI auto-grade: raw AI score gets a 10% reduction before it counts.
  applyAiGrade(sid, aiScore, feedback) {
    const s = data.event_submissions.find((x) => x.id === Number(sid)); if (!s) return null;
    const raw = Math.max(0, Math.min(100, Number(aiScore) || 0));
    s.ai_score = raw;
    s.score = Math.round(raw * 0.9); // AI-graded work carries a 10% reduction
    s.ai_feedback = String(feedback || '').slice(0, 2000) || null;
    s.graded_by = 'ai'; s.graded_at = now(); save();
    return s;
  },
  score(sid, score, remarks, by) {
    const s = data.event_submissions.find((x) => x.id === Number(sid)); if (!s) return null;
    s.score = Math.max(0, Math.min(100, Number(score)));
    s.ai_feedback = remarks ? String(remarks).slice(0, 2000) : s.ai_feedback;
    s.graded_by = by; s.graded_at = now(); save();
    return s;
  },
  // A participant passes when every problem is graded (or the single
  // submission for problem-less events) and the average score reaches the
  // event's pass mark.
  progressFor(ev, uid) {
    const mine = data.event_submissions.filter((s) => s.event_id === ev.id && s.user_id === Number(uid));
    const total = (ev.problems || []).length || 1;
    const graded = mine.filter((s) => s.score != null);
    const avg = graded.length ? Math.round(graded.reduce((a, s) => a + s.score, 0) / graded.length) : null;
    const complete = graded.length >= total;
    return { submitted: mine.length, graded: graded.length, total, avg, complete, passed: complete && avg != null && avg >= (ev.pass_mark || 0) };
  },
  maybeCertify(ev, uid, issuedBy) {
    if (!ev.auto_certificate) return null;
    const prog = Events.progressFor(ev, uid);
    if (!prog.passed) return null;
    const already = data.certificates.find((c) => c.user_id === Number(uid) && c.title === ev.title);
    if (already) return { cert: already, existing: true };
    const kindMap = { quest: 'quest', hackathon: 'hackathon', competition: 'competition', webinar: 'webinar' };
    const out = Certificates.issue({
      // v18: certificates never carry grade, pass-mark or grading-method
      // info - just proof of completion.
      user_id: uid, batch_id: null, kind: kindMap[ev.kind] || 'course', title: ev.title,
      completion_date: today(), detail: null,
      instructor_id: null, issued_by: issuedBy || ev.created_by,
    });
    if (out.ok) {
      const subs = data.event_submissions.filter((s) => s.event_id === ev.id && s.user_id === Number(uid));
      for (const s of subs) s.certified = true;
      save();
      return { cert: out.cert };
    }
    return null;
  },
  entries(eid) {
    return data.event_entries.filter((e) => e.event_id === Number(eid)).map((e) => {
      const u = Users.byId(e.user_id) || {};
      const ev = Events.byId(eid);
      return { ...e, email: u.email || null, whatsapp: (u.profile || {}).phone || null, progress: ev ? Events.progressFor(ev, e.user_id) : null };
    }).sort((a, b) => String(b.registered_at).localeCompare(a.registered_at));
  },
  board(eid) {
    const ev = Events.byId(eid); if (!ev) return [];
    const byUser = {};
    for (const s of data.event_submissions.filter((x) => x.event_id === ev.id)) {
      byUser[s.user_id] = byUser[s.user_id] || [];
      byUser[s.user_id].push(s);
    }
    return Object.entries(byUser).map(([uid, subs]) => {
      const u = Users.byId(uid) || {};
      const graded = subs.filter((s) => s.score != null);
      const avg = graded.length ? Math.round(graded.reduce((a, s) => a + s.score, 0) / graded.length) : null;
      return { user_id: Number(uid), name: u.name || 'Learner', reg_no: u.reg_no || null, tier: u.role === 'free' ? 'open' : 'portal', submissions: subs.length, graded: graded.length, avg, passed: Events.progressFor(ev, uid).passed };
    }).sort((a, b) => (b.avg ?? -1) - (a.avg ?? -1));
  },
  submissionsForAdmin(eid) {
    return data.event_submissions.filter((s) => s.event_id === Number(eid)).map((s) => {
      const u = Users.byId(s.user_id) || {};
      return { ...s, user_name: u.name, reg_no: u.reg_no || null, tier: u.role === 'free' ? 'open' : 'portal' };
    }).sort((a, b) => String(b.submitted_at).localeCompare(a.submitted_at));
  },
  // Discussion: a lightweight comment thread on each event. Learners and staff
  // can post; staff (or the author) can delete.
  comments(eid) {
    return data.event_comments
      .filter((c) => c.event_id === Number(eid))
      .sort((a, b) => String(a.created_at).localeCompare(b.created_at))
      .map((c) => {
        const u = Users.byId(c.user_id) || {};
        return { ...c, avatar: (u.profile || {}).avatar || u.avatar || null, staff: ['admin', 'instructor'].includes(u.role) };
      });
  },
  commentCount(eid) { return data.event_comments.filter((c) => c.event_id === Number(eid)).length; },
  addComment({ event_id, user, body }) {
    const ev = Events.byId(event_id); if (!ev) return { error: 'Event not found.' };
    const text = String(body || '').trim();
    if (!text) return { error: 'Write something before posting.' };
    const c = {
      id: nextId('event_comments'), event_id: ev.id, user_id: user.id,
      name: user.name || 'Learner', role: user.role || 'free',
      body: text.slice(0, 2000), created_at: now(),
    };
    data.event_comments.push(c); save();
    const u = Users.byId(user.id) || {};
    return { comment: { ...c, avatar: (u.profile || {}).avatar || u.avatar || null, staff: ['admin', 'instructor'].includes(u.role) } };
  },
  removeComment(cid, user) {
    const c = data.event_comments.find((x) => x.id === Number(cid)); if (!c) return { error: 'Comment not found.' };
    const isStaff = ['admin', 'instructor'].includes(user.role);
    if (c.user_id !== user.id && !isStaff) return { error: 'You can only delete your own comments.' };
    data.event_comments = data.event_comments.filter((x) => x.id !== c.id); save();
    return { ok: true };
  },
  publicView(ev) { // what the open site shows before registering
    const d = Events.decorate(ev);
    return {
      id: d.id, kind: d.kind, title: d.title, description: d.description,
      entry: d.entry, fee_pkr: d.fee_pkr, pay_instructions: d.pay_instructions,
      starts_at: d.starts_at, ends_at: d.ends_at, deadline: d.deadline, duration_minutes: d.duration_minutes,
      pass_mark: d.pass_mark, auto_grade: d.auto_grade, auto_certificate: d.auto_certificate,
      compiler: d.compiler, status: d.status, entries_count: d.entries_count,
      problems_count: (d.problems || []).length, prizes: d.prizes, meeting_link: null,
    };
  },
};

/* ============================== v17: JOBS BOARD ==============================
 * Admin posts jobs sourced from the market; every signed-in student, teacher
 * and coordinator can browse them, discuss in a comment thread, and apply
 * directly with the employer (a link and/or email on the posting) - EchoLens
 * itself never handles the application.
 */
const JOB_TYPES = ['Full-time', 'Part-time', 'Internship', 'Contract', 'Freelance'];
const Jobs = {
  create(j) {
    const rec = {
      id: nextId('jobs'),
      title: String(j.title || '').slice(0, 200),
      company: String(j.company || '').slice(0, 150),
      location: j.location ? String(j.location).slice(0, 150) : null,
      job_type: JOB_TYPES.includes(j.job_type) ? j.job_type : 'Full-time',
      experience_level: j.experience_level ? String(j.experience_level).slice(0, 100) : null,
      salary_range: j.salary_range ? String(j.salary_range).slice(0, 100) : null,
      description: String(j.description || '').slice(0, 4000),
      requirements: j.requirements ? String(j.requirements).slice(0, 2000) : null,
      apply_url: /^https?:\/\//i.test(String(j.apply_url || '')) ? String(j.apply_url).slice(0, 400) : null,
      apply_email: j.apply_email ? String(j.apply_email).slice(0, 200) : null,
      deadline: /^\d{4}-\d{2}-\d{2}$/.test(String(j.deadline)) ? j.deadline : null,
      status: 'open',
      posted_by: j.posted_by, created_at: now(),
    };
    data.jobs.push(rec); save();
    return rec;
  },
  byId(id) { return data.jobs.find((j) => j.id === Number(id)) || null; },
  all() { return data.jobs.slice().sort((a, b) => b.id - a.id); },
  update(id, fields) {
    const j = Jobs.byId(id); if (!j) return null;
    for (const k of ['title', 'company', 'location', 'experience_level', 'salary_range']) {
      if (fields[k] !== undefined) j[k] = fields[k] ? String(fields[k]).slice(0, 200) : null;
    }
    for (const k of ['description', 'requirements']) {
      if (fields[k] !== undefined) j[k] = fields[k] ? String(fields[k]).slice(0, 4000) : null;
    }
    if (fields.job_type !== undefined && JOB_TYPES.includes(fields.job_type)) j.job_type = fields.job_type;
    if (fields.apply_url !== undefined) j.apply_url = /^https?:\/\//i.test(String(fields.apply_url || '')) ? String(fields.apply_url).slice(0, 400) : null;
    if (fields.apply_email !== undefined) j.apply_email = fields.apply_email ? String(fields.apply_email).slice(0, 200) : null;
    if (fields.deadline !== undefined) j.deadline = /^\d{4}-\d{2}-\d{2}$/.test(String(fields.deadline)) ? fields.deadline : null;
    if (fields.status !== undefined && ['open', 'closed'].includes(fields.status)) j.status = fields.status;
    save();
    return j;
  },
  remove(id) {
    const jid = Number(id);
    data.jobs = data.jobs.filter((j) => j.id !== jid);
    data.job_comments = data.job_comments.filter((c) => c.job_id !== jid);
    save();
  },
  summary(j) {
    const poster = Users.byId(j.posted_by);
    return {
      id: j.id, title: j.title, company: j.company, location: j.location, job_type: j.job_type,
      experience_level: j.experience_level, salary_range: j.salary_range, deadline: j.deadline,
      status: j.status, created_at: j.created_at,
      comment_count: data.job_comments.filter((c) => c.job_id === j.id).length,
      posted_by_name: poster ? poster.name : 'EchoLens',
    };
  },
  detail(j) {
    const poster = Users.byId(j.posted_by);
    return { ...j, posted_by_name: poster ? poster.name : 'EchoLens' };
  },
};
const JobComments = {
  create({ job_id, user, body }) {
    const c = {
      id: nextId('job_comments'), job_id: Number(job_id),
      user_id: user.id, user_name: user.name, user_role: user.role, user_avatar: user.avatar || null,
      body: String(body).slice(0, 1000), created_at: now(),
    };
    data.job_comments.push(c); save();
    return c;
  },
  byId(id) { return data.job_comments.find((c) => c.id === Number(id)) || null; },
  forJob(jid) { return data.job_comments.filter((c) => c.job_id === Number(jid)).sort((a, b) => a.id - b.id); },
  remove(id) { data.job_comments = data.job_comments.filter((c) => c.id !== Number(id)); save(); },
};

/* ============================== v12: LEADS ==============================
 * Every open sign-in (Google or email) and every portal student becomes a
 * lead: name, email, WhatsApp, source, and when they arrived. The admin can
 * list, download (CSV), and email them.
 */
const Leads = {
  upsert({ name, email, whatsapp, source, user_id }) {
    if (!email) return null;
    let l = data.leads.find((x) => x.email && x.email.toLowerCase() === String(email).toLowerCase());
    if (l) {
      if (name) l.name = String(name).slice(0, 120);
      if (whatsapp) l.whatsapp = String(whatsapp).slice(0, 40);
      if (user_id) l.user_id = Number(user_id);
      if (source && !l.source) l.source = source;
      l.updated_at = now(); save();
      return l;
    }
    l = {
      id: nextId('leads'), name: String(name || '').slice(0, 120), email: String(email).slice(0, 200).toLowerCase(),
      whatsapp: String(whatsapp || '').slice(0, 40) || null,
      source: String(source || 'open').slice(0, 30), user_id: user_id ? Number(user_id) : null,
      created_at: now(), updated_at: now(),
    };
    data.leads.push(l); save();
    return l;
  },
  all() {
    return data.leads.slice().sort((a, b) => String(b.created_at).localeCompare(a.created_at)).map((l) => {
      const u = l.user_id ? Users.byId(l.user_id) : null;
      return { ...l, tier: u ? (u.role === 'free' ? 'open' : u.role) : 'lead' };
    });
  },
  csv() {
    const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const rows = [['Name', 'Email', 'WhatsApp', 'Source', 'Tier', 'Created'].join(',')];
    for (const l of Leads.all()) rows.push([esc(l.name), esc(l.email), esc(l.whatsapp), esc(l.source), esc(l.tier), esc(l.created_at)].join(','));
    return rows.join('\n');
  },
  emailsFor(audience) {
    // portal = enrolled/portal students; open = free-tier users; all = both + raw leads
    const emails = new Set();
    for (const u of data.users) {
      if (!u.email) continue;
      if (audience === 'portal' && u.role === 'student') emails.add(u.email.toLowerCase());
      if (audience === 'open' && u.role === 'free') emails.add(u.email.toLowerCase());
      if (audience === 'all' && ['student', 'free'].includes(u.role)) emails.add(u.email.toLowerCase());
    }
    if (audience === 'all') for (const l of data.leads) if (l.email) emails.add(l.email.toLowerCase());
    return [...emails];
  },
};

/* ============================== v12: ANALYTICS ==============================
 * Time series and totals for the admin dashboard: sign-ups (portal / open /
 * all), enrollments per batch, event registrations, submissions - bucketed
 * daily, weekly, monthly, or yearly.
 */
function bucketKey(iso, granularity) {
  const d = String(iso || '').slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return null;
  if (granularity === 'yearly') return d.slice(0, 4);
  if (granularity === 'monthly') return d.slice(0, 7);
  if (granularity === 'weekly') {
    const dt = new Date(d + 'T00:00:00Z');
    const day = (dt.getUTCDay() + 6) % 7; // Monday start
    dt.setUTCDate(dt.getUTCDate() - day);
    return dt.toISOString().slice(0, 10);
  }
  return d; // daily
}
function bucketRange(granularity) {
  const out = [];
  const t = new Date();
  const n = granularity === 'yearly' ? 5 : granularity === 'monthly' ? 12 : granularity === 'weekly' ? 12 : 30;
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(t);
    if (granularity === 'yearly') { d.setFullYear(t.getFullYear() - i); out.push(String(d.getFullYear())); }
    else if (granularity === 'monthly') { d.setMonth(t.getMonth() - i); out.push(d.toISOString().slice(0, 7)); }
    else if (granularity === 'weekly') { d.setDate(t.getDate() - i * 7); out.push(bucketKey(d.toISOString(), 'weekly')); }
    else { d.setDate(t.getDate() - i); out.push(d.toISOString().slice(0, 10)); }
  }
  return out;
}
function seriesFrom(items, dateField, granularity) {
  const labels = bucketRange(granularity);
  const counts = Object.fromEntries(labels.map((l) => [l, 0]));
  for (const it of items) {
    const k = bucketKey(it[dateField], granularity);
    if (k != null && counts[k] !== undefined) counts[k] += 1;
  }
  return { labels, counts: labels.map((l) => counts[l]) };
}
const Analytics = {
  overview() {
    const students = data.users.filter((u) => u.role === 'student');
    const openUsers = data.users.filter((u) => u.role === 'free');
    return {
      total_signups: students.length + openUsers.length,
      portal_students: students.length,
      open_users: openUsers.length,
      leads: data.leads.length,
      enrollments: data.enrollments.length,
      events: data.events.length,
      event_registrations: data.event_entries.length,
      event_submissions: data.event_submissions.length,
      certificates_issued: data.certificates.length,
      running_courses: data.batches.length,
    };
  },
  series({ metric = 'signups', segment = 'all', granularity = 'daily', batch_id = null, event_id = null }) {
    let items = [];
    let dateField = 'created_at';
    if (metric === 'signups') {
      items = data.users.filter((u) => (segment === 'portal' ? u.role === 'student' : segment === 'open' ? u.role === 'free' : ['student', 'free'].includes(u.role)));
    } else if (metric === 'enrollments') {
      items = data.enrollments.filter((e) => !batch_id || e.batch_id === Number(batch_id));
    } else if (metric === 'event_registrations') {
      items = data.event_entries.filter((e) => !event_id || e.event_id === Number(event_id));
      dateField = 'registered_at';
    } else if (metric === 'event_submissions') {
      items = data.event_submissions.filter((s) => !event_id || s.event_id === Number(event_id));
      dateField = 'submitted_at';
    } else if (metric === 'quest_submissions') {
      items = data.quest_submissions.filter((s) => {
        if (!batch_id) return true;
        const q = data.quests.find((x) => x.id === s.quest_id);
        return q && q.batch_id === Number(batch_id);
      });
      dateField = 'submitted_at';
    } else if (metric === 'leads') {
      items = data.leads;
    }
    return seriesFrom(items, dateField, granularity);
  },
};

/* ============================== v12.3: OPEN QUEST SUBMISSIONS ==============================
 * Real submissions for the open problem set: signed-in learners submit code
 * or files per problem, get AI-graded (10% reduction), earn gems, and - on
 * completing a fully free track above its pass mark - receive an automatic
 * verified certificate.
 */
const OpenQuest = {
  key(track_key, level, pid) { return `${track_key}:${level}:${pid}`; },
  find(uid, track_key, level, pid) {
    return data.open_submissions.find((s) => s.user_id === Number(uid) && s.track_key === track_key && s.level === Number(level) && s.pid === Number(pid)) || null;
  },
  submit({ user, track_key, level, pid, code, language, file_url, file_name, files }) {
    const t = TRACKS[track_key];
    if (!t) return { error: 'Course not found.' };
    const lvl = t.levels.find((l) => l.no === Number(level));
    if (!lvl) return { error: 'Level not found.' };
    // Paid programs open only the first quest (one level); free programs open all.
    const openN = t.free ? t.levels.length : Number(process.env.OPEN_LEVELS || 1);
    if (Number(level) > openN) return { error: 'This level is locked - register for the course to unlock it.' };
    const pr = lvl.problems.find((p) => p.pid === Number(pid) || lvl.problems.indexOf(p) + 1 === Number(pid));
    if (!pr) return { error: 'Task not found.' };
    if (!code && !file_url) return { error: 'Submit your code or upload your work as a file.' };
    let s = OpenQuest.find(user.id, track_key, level, pid);
    const fields = {
      code: code ? String(code).slice(0, 60000) : null,
      language: language ? String(language).slice(0, 20) : null,
      file_url: file_url || null, file_name: file_name || null,
      files: Array.isArray(files) && files.length ? files : null, // extra files beyond the first (multi-file courses)
      submitted_at: now(),
    };
    if (s) { s.attempts = (s.attempts || 1) + 1; Object.assign(s, fields, { score: null, gems: 0, feedback: null, graded_at: null }); }
    else {
      s = { id: nextId('open_submissions'), user_id: user.id, track_key, level: Number(level), pid: Number(pid),
            problem_title: pr.title, points: pr.points || 100, ...fields, score: null, gems: 0, feedback: null, graded_at: null, attempts: 1 };
      data.open_submissions.push(s);
    }
    save();
    return { submission: s, problem: pr, track: t };
  },
  applyGrade(sid, aiScore, feedback) {
    const s = data.open_submissions.find((x) => x.id === Number(sid)); if (!s) return null;
    const raw = Math.max(0, Math.min(100, Number(aiScore) || 0));
    s.score = Math.round(raw * 0.9); // AI grading carries the standard 10% reduction
    s.gems = Math.round((s.score / 100) * (s.points || 100));
    s.feedback = String(feedback || '').slice(0, 1500) || null;
    s.graded_at = now(); save();
    return s;
  },
  progress(uid, track_key) {
    const t = TRACKS[track_key]; if (!t) return null;
    const mine = data.open_submissions.filter((s) => s.user_id === Number(uid) && s.track_key === track_key);
    const byKey = {};
    for (const s of mine) byKey[`${s.level}:${s.pid}`] = { score: s.score, gems: s.gems, feedback: s.feedback, submitted_at: s.submitted_at, file_name: s.file_name, has_code: !!s.code, attempts: s.attempts || 1 };
    const totalProblems = t.levels.reduce((a, l) => a + l.problems.length, 0);
    const graded = mine.filter((s) => s.score != null);
    const avg = graded.length ? Math.round(graded.reduce((a, s) => a + s.score, 0) / graded.length) : null;
    return {
      submissions: byKey,
      gems: mine.reduce((a, s) => a + (s.gems || 0), 0),
      attempted: mine.length, graded: graded.length, total: totalProblems, avg,
      complete: graded.length >= totalProblems,
      passed: graded.length >= totalProblems && avg != null && avg >= (t.pass_mark || 60),
    };
  },
  // Fully free tracks issue an automatic verified certificate on completion.
  maybeCertify(uid, track_key, issuedBy) {
    const t = TRACKS[track_key];
    if (!t || !t.free) return null;
    const prog = OpenQuest.progress(uid, track_key);
    if (!prog || !prog.passed) return null;
    const already = data.certificates.find((c) => c.user_id === Number(uid) && c.title === t.title);
    if (already) return { cert: already, existing: true };
    const out = Certificates.issue({
      // v18: certificates never carry grade, pass-mark or grading-method
      // info - just proof of completion.
      user_id: uid, batch_id: null, kind: 'course', title: t.title,
      completion_date: today(), detail: null,
      instructor_id: null, issued_by: issuedBy || 1,
    });
    return out.ok ? { cert: out.cert } : null;
  },
};

/* ============================== v12.3: STUDENT REGISTRATIONS ==============================
 * The in-site registration form for paid courses. Every submission lands in
 * the admin portal with follow-up tracking: contacted, challan sent, added
 * to a course - plus notes, purely for the academy's records.
 */
const Registrations = {
  create(b) {
    const r = {
      id: nextId('registrations'),
      name: String(b.name || '').slice(0, 120),
      email: String(b.email || '').slice(0, 200).toLowerCase(),
      whatsapp: String(b.whatsapp || '').slice(0, 40),
      city: String(b.city || '').slice(0, 80) || null,
      course_code: String(b.course_code || '').slice(0, 12) || null,
      course_title: String(b.course_title || '').slice(0, 200) || null,
      note: String(b.note || '').slice(0, 600) || null,
      // Ambassador referral: a valid 4-digit code (validated by the server)
      // records who referred the student and pre-attaches the 10% discount.
      ambassador_code: String(b.ambassador_code || '').slice(0, 4) || null,
      ambassador_name: b.ambassador_name ? String(b.ambassador_name).slice(0, 120) : null,
      status: { contacted: false, challan_sent: false, added_to_course: false },
      admin_note: null,
      // v17: registration -> challan -> payment -> enrollment pipeline.
      discount_category_id: b.discount_category_id || null, challan_serial: null, payment_stage: 'new',
      enrolled_user_id: null, enrolled_batch_id: null, cleared_by: null, cleared_at: null,
      created_at: now(), updated_at: now(),
    };
    data.registrations.push(r); save();
    return r;
  },
  all() { return data.registrations.slice().sort((a, b) => b.id - a.id); },
  byId(id) { return data.registrations.find((x) => x.id === Number(id)) || null; },
  update(id, b) {
    const r = data.registrations.find((x) => x.id === Number(id)); if (!r) return null;
    if (b.status && typeof b.status === 'object') {
      for (const k of ['contacted', 'challan_sent', 'added_to_course']) if (b.status[k] !== undefined) r.status[k] = !!b.status[k];
    }
    if (b.admin_note !== undefined) r.admin_note = String(b.admin_note || '').slice(0, 600) || null;
    r.updated_at = now(); save();
    return r;
  },
  remove(id) { data.registrations = data.registrations.filter((x) => x.id !== Number(id)); save(); },
  pendingCount() { return data.registrations.filter((r) => !r.status.contacted).length; },
  // Internal - advances the pipeline stage; keeps the legacy status booleans
  // (used by the existing admin widget) in sync as a courtesy.
  _setStage(id, stage, fields = {}) {
    const r = data.registrations.find((x) => x.id === Number(id)); if (!r) return null;
    r.payment_stage = stage;
    Object.assign(r, fields);
    if (stage === 'challan_sent') r.status.challan_sent = true;
    if (stage === 'enrolled') r.status.added_to_course = true;
    r.updated_at = now(); save();
    return r;
  },
};

/* ============================== v17: DISCOUNT CATEGORIES ==============================
 * Finance-managed fee discounts applied when a challan is generated. Snapshot
 * onto the challan at generation time, so editing/deactivating a category
 * later never rewrites history.
 */
const DiscountCategories = {
  create({ name, type, value }, by) {
    const d = {
      id: nextId('discount_categories'),
      name: String(name || '').slice(0, 100),
      type: type === 'flat' ? 'flat' : 'percent',
      value: Math.max(0, Number(value) || 0),
      active: true, created_by: by, created_at: now(),
    };
    data.discount_categories.push(d); save();
    return d;
  },
  all() { return data.discount_categories.slice().sort((a, b) => a.name.localeCompare(b.name)); },
  byId(id) { return data.discount_categories.find((x) => x.id === Number(id)) || null; },
  update(id, b) {
    const d = DiscountCategories.byId(id); if (!d) return null;
    if (b.name !== undefined) d.name = String(b.name).slice(0, 100);
    if (b.type !== undefined) d.type = b.type === 'flat' ? 'flat' : 'percent';
    if (b.value !== undefined) d.value = Math.max(0, Number(b.value) || 0);
    if (b.active !== undefined) d.active = !!b.active;
    save();
    return d;
  },
  remove(id) { data.discount_categories = data.discount_categories.filter((x) => x.id !== Number(id)); save(); },
  // Computed net fee for a gross amount, using this category if given.
  apply(grossFee, categoryId) {
    const gross = Number(grossFee) || 0;
    if (!categoryId) return { label: null, amount: 0, net: gross };
    const d = DiscountCategories.byId(categoryId);
    if (!d) return { label: null, amount: 0, net: gross };
    const amount = d.type === 'flat' ? Math.min(gross, d.value) : Math.round(gross * (d.value / 100));
    return { label: `${d.name} (${d.type === 'flat' ? 'Rs ' + d.value.toLocaleString('en-US') : d.value + '%'})`, amount, net: Math.max(0, gross - amount) };
  },
};

/* ============================== v17: CHALLANS ==============================
 * QR-verified fee challans - mirrors the Certificates pattern exactly (same
 * random-serial + collision-check + publicView whitelist shape).
 */
const Challans = {
  serial() {
    let s;
    do { s = `EL-CH-${new Date().getFullYear()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`; }
    while (data.challans.some((c) => c.serial === s));
    return s;
  },
  // The catalogue fee is presented on the challan split into three heads;
  // the last head absorbs rounding so the parts always sum to the gross fee.
  splitFee(gross) {
    const tuition = Math.round(gross * 0.7), portal = Math.round(gross * 0.2);
    return [
      { label: 'Tuition fee', amount: tuition },
      { label: 'Portal & LMS fee', amount: portal },
      { label: 'Examination & certification fee', amount: Math.max(0, gross - tuition - portal) },
    ];
  },
  generate({ registration_id, discount_category_id, deadline, generated_by }) {
    const r = Registrations.byId(registration_id); if (!r) return { error: 'Registration not found.' };
    const course = Courses.byCode(r.course_code);
    const gross = course ? Number(course.price_pkr) || 0 : 0;
    // An ambassador referral attached at registration always applies on its
    // own; any other discount the Admissions Office picks stacks on top.
    // Both are computed on the gross fee and snapshotted onto the challan.
    const discounts = [];
    const addDiscount = (catId) => {
      if (!catId || discounts.some((d) => d.category_id === Number(catId))) return;
      const applied = DiscountCategories.apply(gross, catId);
      if (applied.label) discounts.push({ category_id: Number(catId), label: applied.label, amount: applied.amount });
    };
    if (r.ambassador_code) addDiscount(r.discount_category_id);
    addDiscount(discount_category_id);
    if (!r.ambassador_code) addDiscount(r.discount_category_id);
    const discount_amount = Math.min(gross, discounts.reduce((s, d) => s + d.amount, 0));
    const student = Users.byLogin(r.email);
    const bank = Settings.bank();
    const ch = {
      id: nextId('challans'), serial: Challans.serial(), registration_id: r.id,
      course_code: r.course_code, course_title: r.course_title || (course ? course.title : ''),
      student_name: r.name, student_email: r.email,
      student_id: student && student.reg_no ? String(student.reg_no) : 'REG-' + String(r.id).padStart(5, '0'),
      gross_fee: gross, fee_parts: Challans.splitFee(gross),
      discount_category_id: discounts.length ? discounts[0].category_id : null,
      discounts,
      discount_label: discounts.map((d) => d.label).join(' + ') || null,
      discount_amount, net_fee: Math.max(0, gross - discount_amount),
      deadline: /^\d{4}-\d{2}-\d{2}$/.test(String(deadline)) ? deadline : null,
      bank_snapshot: { ...bank },
      status: 'issued',
      generated_by, generated_at: now(), sent_at: null, paid_confirmed_by: null, paid_confirmed_at: null,
    };
    data.challans.push(ch); save();
    // Keep the ambassador linkage on the registration intact for re-issues;
    // only remember an explicitly chosen extra discount otherwise.
    if (!r.ambassador_code && discount_category_id) r.discount_category_id = Number(discount_category_id);
    Registrations._setStage(r.id, 'challan_issued', { challan_serial: ch.serial });
    return { ok: true, challan: ch };
  },
  all() { return data.challans.slice().sort((a, b) => b.id - a.id); },
  bySerial(s) { return data.challans.find((c) => c.serial === String(s).trim().toUpperCase()) || null; },
  forRegistration(rid) { return data.challans.filter((c) => c.registration_id === Number(rid)).sort((a, b) => b.id - a.id); },
  markSent(serial) {
    const c = Challans.bySerial(serial); if (!c) return null;
    c.sent_at = now(); save();
    Registrations._setStage(c.registration_id, 'challan_sent');
    return c;
  },
  markPaid(serial, by) {
    const c = Challans.bySerial(serial); if (!c) return null;
    c.status = 'paid'; c.paid_confirmed_by = by; c.paid_confirmed_at = now(); save();
    Registrations._setStage(c.registration_id, 'paid_cleared', { cleared_by: by, cleared_at: now() });
    return c;
  },
  // Public view for the QR verification page - no internal ids.
  publicView(c) {
    return {
      serial: c.serial, course_title: c.course_title, student_name: c.student_name,
      student_id: c.student_id || null,
      gross_fee: c.gross_fee, fee_parts: c.fee_parts || Challans.splitFee(c.gross_fee),
      discounts: c.discounts || (c.discount_label ? [{ label: c.discount_label, amount: c.discount_amount }] : []),
      discount_label: c.discount_label, discount_amount: c.discount_amount, net_fee: c.net_fee,
      deadline: c.deadline, bank: c.bank_snapshot, status: c.status,
      generated_at: (c.generated_at || '').slice(0, 10),
    };
  },
};

/* ============================== v17: EXPENSES ==============================
 * Finance's operating-expense ledger, paired with cleared-challan income to
 * form the balance sheet. Categories/format are a working default for now -
 * to be refined once Finance shares their reference bookkeeping sheet.
 */
const Expenses = {
  create({ date, category, description, amount }, by) {
    const e = {
      id: nextId('expenses'),
      date: /^\d{4}-\d{2}-\d{2}$/.test(String(date)) ? date : today(),
      category: String(category || 'General').slice(0, 80),
      description: String(description || '').slice(0, 300),
      amount: Math.max(0, Number(amount) || 0),
      added_by: by, created_at: now(),
    };
    data.expenses.push(e); save();
    return e;
  },
  all() { return data.expenses.slice().sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id); },
  remove(id) { data.expenses = data.expenses.filter((x) => x.id !== Number(id)); save(); },
  // Income = net fee of every cleared/paid challan (the money actually collected).
  balanceSheet() {
    const income = data.challans.filter((c) => c.status === 'paid').reduce((s, c) => s + c.net_fee, 0);
    const expenseTotal = data.expenses.reduce((s, e) => s + e.amount, 0);
    const byCategory = {};
    for (const e of data.expenses) byCategory[e.category] = (byCategory[e.category] || 0) + e.amount;
    return {
      income, expenses: expenseTotal, balance: income - expenseTotal,
      paid_challans: data.challans.filter((c) => c.status === 'paid').length,
      expense_by_category: Object.entries(byCategory).map(([category, amount]) => ({ category, amount })).sort((a, b) => b.amount - a.amount),
    };
  },
};

/* ============================== v17: STUDENT COORDINATOR QUERIES ==============================
 * A lightweight, course-agnostic query/ticket thread between a student and
 * the Student Coordinator team (shared inbox - any coordinator can reply).
 */
const CoordinatorQueries = {
  create({ student_id, student_name, subject, body }) {
    const q = {
      id: nextId('coordinator_queries'), student_id: Number(student_id), student_name,
      subject: String(subject || 'Query').slice(0, 150),
      messages: [{ from_role: 'student', from_name: student_name, body: String(body || '').slice(0, 2000), at: now() }],
      status: 'open', created_at: now(), updated_at: now(),
    };
    data.coordinator_queries.push(q); save();
    return q;
  },
  all() { return data.coordinator_queries.slice().sort((a, b) => b.id - a.id); },
  byId(id) { return data.coordinator_queries.find((x) => x.id === Number(id)) || null; },
  forStudent(uid) { return data.coordinator_queries.filter((q) => q.student_id === Number(uid)).sort((a, b) => b.id - a.id); },
  reply(id, { from_role, from_name, body }) {
    const q = CoordinatorQueries.byId(id); if (!q) return null;
    q.messages.push({ from_role, from_name, body: String(body || '').slice(0, 2000), at: now() });
    if (from_role === 'coordinator' && q.status === 'open') q.status = 'open'; // stays open until explicitly resolved
    q.updated_at = now(); save();
    return q;
  },
  setStatus(id, status) {
    const q = CoordinatorQueries.byId(id); if (!q) return null;
    q.status = status === 'resolved' ? 'resolved' : 'open';
    q.updated_at = now(); save();
    return q;
  },
};

/* ============================== v17: HR - GROUPS & STAFF ==============================
 * Paid staff and interns get their own isolated login (role 'staff'). HR
 * organizes them into groups, posts one-way instructions, and runs a
 * two-way follow-up log per person.
 */
const StaffGroups = {
  create({ name, description }) {
    const g = { id: nextId('staff_groups'), name: String(name || '').slice(0, 100), description: String(description || '').slice(0, 400), created_at: now() };
    data.staff_groups.push(g); save();
    return g;
  },
  all() { return data.staff_groups.slice().sort((a, b) => a.name.localeCompare(b.name)); },
  byId(id) { return data.staff_groups.find((x) => x.id === Number(id)) || null; },
  update(id, b) {
    const g = StaffGroups.byId(id); if (!g) return null;
    if (b.name !== undefined) g.name = String(b.name).slice(0, 100);
    if (b.description !== undefined) g.description = String(b.description).slice(0, 400);
    save();
    return g;
  },
  remove(id) {
    data.staff_groups = data.staff_groups.filter((x) => x.id !== Number(id));
    for (const s of data.staff_records) if (s.group_id === Number(id)) s.group_id = null;
    save();
  },
};
const StaffRecords = {
  create({ user_id, name, email, phone, position, employment_type, group_id }) {
    const s = {
      id: nextId('staff_records'), user_id: Number(user_id),
      name: String(name || '').slice(0, 120), email: String(email || '').slice(0, 200).toLowerCase(),
      phone: String(phone || '').slice(0, 40) || null, position: String(position || '').slice(0, 100) || null,
      employment_type: employment_type === 'intern' ? 'intern' : 'paid_staff',
      group_id: group_id ? Number(group_id) : null, status: 'active', joined_at: today(),
      instructions: [], follow_ups: [], created_at: now(),
    };
    data.staff_records.push(s); save();
    return s;
  },
  all() { return data.staff_records.slice().sort((a, b) => a.name.localeCompare(b.name)); },
  byId(id) { return data.staff_records.find((x) => x.id === Number(id)) || null; },
  byUserId(uid) { return data.staff_records.find((x) => x.user_id === Number(uid)) || null; },
  update(id, b) {
    const s = StaffRecords.byId(id); if (!s) return null;
    if (b.phone !== undefined) s.phone = String(b.phone).slice(0, 40) || null;
    if (b.position !== undefined) s.position = String(b.position).slice(0, 100) || null;
    if (b.employment_type !== undefined) s.employment_type = b.employment_type === 'intern' ? 'intern' : 'paid_staff';
    if (b.group_id !== undefined) s.group_id = b.group_id ? Number(b.group_id) : null;
    if (b.status !== undefined) s.status = b.status === 'inactive' ? 'inactive' : 'active';
    save();
    return s;
  },
  remove(id) { data.staff_records = data.staff_records.filter((x) => x.id !== Number(id)); save(); },
  addInstruction(id, { body, by }) {
    const s = StaffRecords.byId(id); if (!s) return null;
    s.instructions.push({ body: String(body || '').slice(0, 2000), by, at: now() });
    save();
    return s;
  },
  addFollowUp(id, { body, by }) {
    const s = StaffRecords.byId(id); if (!s) return null;
    s.follow_ups.push({ body: String(body || '').slice(0, 2000), by, at: now(), response: null, responded_at: null });
    save();
    return s;
  },
  respondFollowUp(id, followUpIndex, response) {
    const s = StaffRecords.byId(id); if (!s) return null;
    const f = s.follow_ups[Number(followUpIndex)]; if (!f) return null;
    f.response = String(response || '').slice(0, 2000); f.responded_at = now();
    save();
    return s;
  },
};

/* ============================== v12.3: PUBLIC ANNOUNCEMENTS ==============================
 * Announcements the admin publishes to the open website: new cohorts,
 * hackathons, webinars, discounts - with an optional action link.
 */
const PublicAnnouncements = {
  create(b, by) {
    const a = {
      id: nextId('public_announcements'),
      kind: ['cohort', 'hackathon', 'webinar', 'discount', 'info'].includes(b.kind) ? b.kind : 'info',
      title: String(b.title || '').slice(0, 200),
      body: String(b.body || '').slice(0, 4000),
      link: /^https?:\/\//i.test(String(b.link || '')) ? String(b.link).slice(0, 400) : null,
      link_label: String(b.link_label || '').slice(0, 60) || null,
      pinned: !!b.pinned,
      created_by: by, created_at: now(),
    };
    data.public_announcements.push(a); save();
    return a;
  },
  all() {
    return data.public_announcements.slice().sort((a, b) => (b.pinned - a.pinned) || (b.id - a.id));
  },
  remove(id) { data.public_announcements = data.public_announcements.filter((x) => x.id !== Number(id)); save(); },
  update(id, b) {
    const a = data.public_announcements.find((x) => x.id === Number(id)); if (!a) return null;
    for (const k of ['title', 'body', 'link_label']) if (b[k] !== undefined) a[k] = String(b[k]).slice(0, 4000) || null;
    if (b.link !== undefined) a.link = /^https?:\/\//i.test(String(b.link || '')) ? String(b.link).slice(0, 400) : null;
    if (b.pinned !== undefined) a.pinned = !!b.pinned;
    if (b.kind !== undefined && ['cohort', 'hackathon', 'webinar', 'discount', 'info'].includes(b.kind)) a.kind = b.kind;
    save();
    return a;
  },
};

load();

module.exports = {
  Users, Courses, Batches, Enrollments, Sessions, Lessons, Assignments, Submissions, Announcements, Admin, GemEvents, Challenges, Hackathons, AiReports, Quests, Chat, ChatReads, backupNow, loadOfficialCatalogue, officialCatalogue: () => OFFICIAL_CATALOGUE, learningPaths: () => LEARNING_PATHS, persist: save,
  coursesForUser, canManageBatch, canViewBatch, announcementRecipients, courseReport,
  gemsForStudentInBatch, totalGemsForStudent, studentLeaderboard, batchLeaderboard, courseLeaderboard,
  stageFor, gemLevel, gamifyFor, touchActivity, STAGES,
  Attendance, Quizzes, Certificates, Settings, TaskFiles, riskReport, fullStudentProfile, openUserProfile, ideEnabled, setIde,
  courseConcepts, finalProjectFor,
  Events, Leads, Analytics, OpenQuest, Registrations, PublicAnnouncements, Jobs, JobComments,
  DiscountCategories, Challans, Expenses, CoordinatorQueries, StaffGroups, StaffRecords, Ambassadors,
  seed, DB_PATH, allData: () => data,
};

if (require.main === module && process.argv.includes('--seed')) seed();
