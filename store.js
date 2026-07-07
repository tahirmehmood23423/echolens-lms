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
const USERNAME_DOMAIN = '@echolens.digital';

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
  seq: { users: 0, courses: 0, batches: 0, enrollments: 0, sessions: 0, lessons: 0, assignments: 0, submissions: 0, announcements: 0, gem_events: 0, challenges: 0, challenge_submissions: 0, hackathons: 0, hackathon_entries: 0, hackathon_submissions: 0, ai_reports: 0, quests: 0, quest_submissions: 0 },
  issued_usernames: [],
  issued_regnos: [],
  users: [], courses: [], batches: [], enrollments: [], sessions: [], lessons: [], assignments: [], submissions: [], announcements: [], gem_events: [], challenges: [], challenge_submissions: [], hackathons: [], hackathon_entries: [], hackathon_submissions: [], ai_reports: [], quests: [], quest_submissions: [],
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
  if (changed) save();
}

/* --------------------------- credential helpers --------------------------- */
function slugify(name) {
  return String(name).toLowerCase().trim().replace(/[^a-z0-9\s.]/g, '').replace(/\s+/g, '.').replace(/\.+/g, '.') || 'user';
}
function uniqueUsername(name) {
  const base = slugify(name);
  let candidate = base + USERNAME_DOMAIN, i = 1;
  const taken = new Set([...data.issued_usernames, ...data.users.map((u) => u.username)]);
  while (taken.has(candidate)) { i += 1; candidate = `${base}${i}${USERNAME_DOMAIN}`; }
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
  byReg(reg) { return data.users.find((u) => u.reg_no === String(reg).trim()) || null; },
  all() { return data.users.slice().sort((a, b) => a.name.localeCompare(b.name)); },
  countByRole(role) { return data.users.filter((u) => u.role === role).length; },
  create({ name, role, email = null }) {
    const username = uniqueUsername(name);
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
    // If an email matches an existing portal account, link Google to it instead
    // of creating a duplicate free account.
    u = email ? data.users.find((x) => x.email && x.email.toLowerCase() === email.toLowerCase()) : null;
    if (u) { u.google_sub = String(sub); save(); return u; }
    u = {
      id: nextId('users'), name: String(name || 'Learner').trim(), role: 'free',
      username: null, email: email || null, google_sub: String(sub),
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
  updateProfile(id, profile) {
    const u = Users.byId(id); if (!u) return null;
    u.profile = { ...(u.profile || {}), ...profile }; save();
    return u;
  },
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
  return submissionGems(uid) + GemEvents.forStudent(uid).reduce((s, e) => s + e.amount, 0) + questGemsGlobal(uid);
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
  const subs = data.submissions.filter((s) => s.user_id === u.id);
  if (subs.length) out.push({ key: 'first-submit', label: 'First submission', kind: 'moment' });
  if (subs.some((s) => (s.grade || 0) >= 90)) out.push({ key: 'top-marks', label: '90%+ on an assignment', kind: 'moment' });
  // Course completion: every assignment in an enrolled batch graded.
  for (const e of data.enrollments.filter((x) => x.user_id === u.id)) {
    const aids = data.assignments.filter((a) => a.batch_id === e.batch_id).map((a) => a.id);
    if (aids.length && aids.every((aid) => subs.some((s) => s.assignment_id === aid && s.grade != null))) {
      const b = Batches.byId(e.batch_id); const c = b ? Courses.byId(b.course_id) : null;
      out.push({ key: `complete-${e.batch_id}`, label: `Completed ${c ? c.title : 'a course'}`, kind: 'course' });
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
    const points = data.assignments.filter((a) => a.batch_id === b.id).reduce((s, a) => s + (a.points || DEFAULT_ASSIGNMENT_POINTS), 0);
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
const Sessions = {
  create(s) { const rec = { id: nextId('sessions'), ...s, batch_id: Number(s.batch_id), created_at: now() }; data.sessions.push(rec); save(); return rec; },
  remove(id) { data.sessions = data.sessions.filter((s) => s.id !== Number(id)); save(); },
  forBatch(bid) { return data.sessions.filter((s) => s.batch_id === Number(bid)).sort((a, b) => String(a.session_date + a.start_time).localeCompare(b.session_date + b.start_time)); },
  upcomingForUser(u) {
    const bids = coursesForUser(u).map((b) => b.id);
    const t = today();
    return data.sessions.filter((s) => bids.includes(s.batch_id) && s.session_date >= t)
      .sort((a, b) => String(a.session_date + a.start_time).localeCompare(b.session_date + b.start_time))
      .map((s) => { const b = Batches.byId(s.batch_id); const c = b ? Courses.byId(b.course_id) : null; return { ...s, course_title: c ? c.title : '', batch_name: b ? b.name : '' }; });
  },
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
  create({ user_id, batch_id, markdown }, by) {
    const r = { id: nextId('ai_reports'), user_id: Number(user_id), batch_id: Number(batch_id), markdown, status: 'draft', created_at: now(), by };
    data.ai_reports.push(r); save();
    return r;
  },
  byId(id) { return data.ai_reports.find((r) => r.id === Number(id)) || null; },
  publish(id) { const r = AiReports.byId(id); if (r) { r.status = 'published'; r.published_at = now(); save(); } return r; },
  remove(id) { data.ai_reports = data.ai_reports.filter((r) => r.id !== Number(id)); save(); },
  forBatch(bid) {
    return data.ai_reports.filter((r) => r.batch_id === Number(bid)).map((r) => ({ ...r, student_name: (Users.byId(r.user_id) || {}).name }));
  },
  publishedFor(uid) {
    return data.ai_reports.filter((r) => r.user_id === Number(uid) && r.status === 'published').map((r) => {
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
  const all = [require('./tracks/python'), ...require('./tracks/bootcamps'), ...require('./tracks/short-courses'), ...require('./tracks/specialist')];
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
  tracks() { return Object.values(TRACKS).map((t) => ({ key: t.key, title: t.title, description: t.description, levels: t.levels.length, course_code: t.course_code || null, total_points: t.total_points })); },
  trackDef(key) { return TRACKS[key] || null; },
  installed(bid) { return data.quests.some((q) => q.batch_id === Number(bid)); },
  install(bid, trackKey) {
    const t = TRACKS[trackKey]; if (!t) return { error: 'Unknown track.' };
    if (Quests.installed(bid)) return { error: 'A track is already installed on this course.' };
    for (const lvl of t.levels) {
      data.quests.push({
        id: nextId('quests'), batch_id: Number(bid), track_key: t.key,
        no: lvl.no, week: lvl.week, session: lvl.session, title: lvl.title, topic: lvl.topic,
        problems: lvl.problems.map((p, i) => ({ pid: i + 1, ...p })),
        created_at: now(),
      });
    }
    save();
    return { ok: true, levels: t.levels.length };
  },
  updateProblem(qid, pid, fields) {
    const q = Quests.byId(qid); if (!q) return null;
    const p = q.problems.find((x) => x.pid === Number(pid)); if (!p) return null;
    const allowed = ['title', 'description', 'points', 'difficulty', 'solution'];
    for (const k of allowed) if (fields[k] !== undefined) p[k] = k === 'points' ? Math.max(10, Math.min(1000, Number(fields[k]) || p.points)) : String(fields[k]).slice(0, 4000);
    if (Array.isArray(fields.refs)) p.refs = fields.refs.filter((r) => Array.isArray(r) && r[1]).slice(0, 6);
    save();
    return p;
  },
  updateLevel(qid, fields) {
    const q = Quests.byId(qid); if (!q) return null;
    for (const k of ['title', 'topic']) if (fields[k]) q[k] = String(fields[k]).slice(0, 300);
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
  submit({ quest_id, pid, user_id, file_url, note }) {
    let s = data.quest_submissions.find((x) => x.quest_id === Number(quest_id) && x.pid === Number(pid) && x.user_id === Number(user_id));
    if (s) { s.file_url = file_url || s.file_url; s.note = note ?? s.note; s.submitted_at = now(); }
    else {
      s = { id: nextId('quest_submissions'), quest_id: Number(quest_id), pid: Number(pid), user_id: Number(user_id), file_url, note: note || null, grade: null, gems: 0, remarks: null, submitted_at: now() };
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
    s.grade = pct; s.gems = Math.round(((p && p.points) || 100) * pct / 100);
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
};

// Quest gems count toward global stages and course totals.
function questGemsGlobal(uid) { return data.quest_submissions.filter((s) => s.user_id === Number(uid)).reduce((sum, s) => sum + (s.gems || 0), 0); }

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
function courseReport(bid) {
  const b = Batches.decorate(Batches.byId(bid));
  const assignments = Assignments.forBatch(bid);
  const aids = assignments.map((a) => a.id);
  const students = Enrollments.studentsForBatch(bid).map((s) => {
    const subs = data.submissions.filter((x) => x.user_id === s.id && aids.includes(x.assignment_id));
    const graded = subs.filter((x) => x.grade != null);
    const gems = gemsForStudentInBatch(s.id, bid);
    const lastRemark = graded.map((x) => x.remarks).filter(Boolean).slice(-1)[0] || null;
    const avg = graded.length ? Math.round(graded.reduce((sum, x) => sum + x.grade, 0) / graded.length) : null;
    const inactive_days = s.last_active ? Math.floor((Date.now() - new Date(s.last_active + 'T00:00:00').getTime()) / 86400000) : null;
    const dueAids = assignments.filter((a) => a.due_date && a.due_date < today()).map((a) => a.id);
    const missing = dueAids.filter((aid) => !subs.some((x) => x.assignment_id === aid)).length;
    return {
      id: s.id, name: s.name, username: s.username, reg_no: s.reg_no, email: s.email,
      submitted: subs.length, graded: graded.length, total_assignments: aids.length,
      gems, avg, streak: s.streak || 0, stage: stageFor(totalGemsForStudent(s.id)), last_remark: lastRemark,
      inactive_days, missing,
      at_risk: (inactive_days == null || inactive_days >= 7) || missing >= 2,
    };
  });
  return { batch: b, assignments, students };
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
      enrollments: data.enrollments.length, assignments: data.assignments.length, submissions: data.submissions.length,
      graded: data.submissions.filter((s) => s.grade != null).length,
      total_gems: data.users.filter((u) => u.role === 'student').reduce((s, u) => s + totalGemsForStudent(u.id), 0),
      batches: Batches.all(),
    };
  },
};

/* ---------------------------- official catalogue ---------------------------- */
const OFFICIAL_CATALOGUE = [
  { code: 'BC-01', title: 'AI Automation with n8n & Make.com', tier: 'Bootcamp', level: 'Beginner', weeks: 2, hours: 8, price_pkr: 5000, summary: 'Fast-paced, high-impact introduction to business automation.' },
  { code: 'BC-02', title: 'Prompt Engineering & ChatGPT/Claude Mastery', tier: 'Bootcamp', level: 'Beginner', weeks: 2, hours: 8, price_pkr: 5000, summary: 'From casual chatting to engineered, reusable prompts.' },
  { code: 'BC-03', title: 'Everyday AI: Smarter Study, Work & Content', tier: 'Bootcamp', level: 'Beginner', weeks: 2, hours: 8, price_pkr: 5000, summary: 'Make AI a daily advantage in study, work, and content.' },
  { code: 'SC-01', title: 'Python for Data Science', tier: 'Short Course', level: 'Foundational', weeks: 6, hours: 24, price_pkr: 12500, summary: 'Core Python through NumPy, pandas, Matplotlib and first ML.' },
  { code: 'SC-02', title: 'Generative AI Essentials', tier: 'Short Course', level: 'Foundational', weeks: 6, hours: 24, price_pkr: 14000, summary: 'Understand, use, and build with generative AI.' },
  { code: 'SC-03', title: 'Data Analytics with SQL & Power BI', tier: 'Short Course', level: 'Foundational', weeks: 6, hours: 24, price_pkr: 13500, summary: 'End-to-end analytics: querying, dashboards & business reporting.' },
  { code: 'SC-04', title: 'Introduction to Machine Learning', tier: 'Short Course', level: 'Foundational', weeks: 6, hours: 24, price_pkr: 13000, summary: 'From ML intuition to trained, honestly-evaluated models.' },
  { code: 'SC-05', title: 'AI Automation Tools Track', tier: 'Short Course', level: 'Foundational', weeks: 6, hours: 24, price_pkr: 14000, summary: 'Modern productivity toolkits for business workflows.' },
  { code: 'ST-01', title: 'WordPress Development', tier: 'Specialist Track', level: 'Intermediate', weeks: 8, hours: 32, price_pkr: 20000, summary: 'Themes, custom layouts & client-ready delivery.' },
  { code: 'ST-02', title: 'Graphic Designing', tier: 'Specialist Track', level: 'Intermediate', weeks: 8, hours: 32, price_pkr: 20000, summary: 'Brand identity, marketing collateral & creative assets.' },
  { code: 'ST-03', title: 'UI/UX Designing', tier: 'Specialist Track', level: 'Intermediate', weeks: 8, hours: 32, price_pkr: 21000, summary: 'Wireframing, prototyping, user journeys & Figma mastery.' },
  { code: 'ST-04', title: 'Data Analytics Specialist Track', tier: 'Specialist Track', level: 'Intermediate', weeks: 8, hours: 32, price_pkr: 21500, summary: 'The full analyst workflow: Python, SQL, statistics, storytelling.' },
  { code: 'ST-05', title: 'Generative AI Engineering', tier: 'Specialist Track', level: 'Intermediate', weeks: 8, hours: 32, price_pkr: 22500, summary: 'Engineering real LLM applications: RAG, evaluation, production.' },
  { code: 'ST-06', title: 'AI Agents & Automation Engineering', tier: 'Specialist Track', level: 'Intermediate', weeks: 8, hours: 32, price_pkr: 23000, summary: 'From tool-calling to multi-step autonomous agents.' },
  { code: 'ST-07', title: 'Machine Learning Fundamentals', tier: 'Specialist Track', level: 'Intermediate', weeks: 8, hours: 32, price_pkr: 21500, summary: 'The complete classical ML toolkit with rigor.' },
  { code: 'ST-08', title: 'Deep Learning with PyTorch', tier: 'Specialist Track', level: 'Intermediate', weeks: 8, hours: 32, price_pkr: 23000, summary: 'Tensors to trained networks: vision, transfer learning, deployment.' },
  { code: 'CT-01', title: 'Full-Stack Development (Laravel)', tier: 'Career Track', level: 'Advanced', weeks: 12, hours: 48, price_pkr: 40000, summary: 'Robust backend development, MVC patterns & database architectures.' },
  { code: 'CT-02', title: 'Complete Data Science Bootcamp', tier: 'Career Track', level: 'Advanced', weeks: 12, hours: 48, price_pkr: 38000, summary: 'Flagship multi-project data science program.' },
  { code: 'CT-03', title: 'Generative AI & LLM Engineering Mastery', tier: 'Career Track', level: 'Advanced', weeks: 12, hours: 48, price_pkr: 42000, summary: 'Flagship GenAI engineering program with portfolio.' },
  { code: 'CT-04', title: 'AI Engineering Career Track', tier: 'Career Track', level: 'Advanced', weeks: 12, hours: 48, price_pkr: 45000, summary: 'The flagship for serious AI career-builders.' },
  { code: 'CT-05', title: 'Machine Learning Engineer Track', tier: 'Career Track', level: 'Advanced', weeks: 12, hours: 48, price_pkr: 40000, summary: 'Multi-project ML engineering with interview prep.' },
];
function loadOfficialCatalogue() {
  let added = 0;
  for (const c of OFFICIAL_CATALOGUE) {
    if (!data.courses.some((x) => x.code === c.code)) { Courses.create(c); added += 1; }
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
  ].forEach(([wk, title, d, st, et]) => Sessions.create({ batch_id: b1.id, week_no: wk, title, session_date: d, start_time: st, end_time: et, join_url: 'https://meet.google.com/your-live-class-link' }));
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

load();

module.exports = {
  Users, Courses, Batches, Enrollments, Sessions, Lessons, Assignments, Submissions, Announcements, Admin, GemEvents, Challenges, Hackathons, AiReports, Quests, backupNow, loadOfficialCatalogue, persist: save,
  coursesForUser, canManageBatch, canViewBatch, announcementRecipients, courseReport,
  gemsForStudentInBatch, totalGemsForStudent, studentLeaderboard, batchLeaderboard, courseLeaderboard,
  stageFor, gemLevel, gamifyFor, touchActivity, STAGES,
  seed, DB_PATH, allData: () => data,
};

if (require.main === module && process.argv.includes('--seed')) seed();
