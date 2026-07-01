'use strict';

/**
 * EchoLens LMS - data store (v3)
 * Dependency-free store persisted to a JSON file (DB_PATH), written atomically.
 * Collections: users, courses (catalogue), batches (course offerings, each with
 * a unique code), enrollments, sessions, lessons, assignments, submissions,
 * announcements. Gamification: assignments carry points; graded submissions
 * award gems. A persistent username registry guarantees usernames are never
 * reused, even across deletions.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'echolens.json');
const USERNAME_DOMAIN = '@echolens.digital';

const empty = () => ({
  seq: { users: 0, courses: 0, batches: 0, enrollments: 0, sessions: 0, lessons: 0, assignments: 0, submissions: 0, announcements: 0 },
  issued_usernames: [],
  users: [], courses: [], batches: [], enrollments: [], sessions: [], lessons: [], assignments: [], submissions: [], announcements: [],
});

let data = empty();

function load() {
  if (fs.existsSync(DB_PATH)) {
    try { data = JSON.parse(fs.readFileSync(DB_PATH, 'utf8')); } catch { data = empty(); }
  }
  // Ensure every expected key exists (forward-compatible with older files).
  const base = empty();
  for (const k of Object.keys(base)) if (data[k] === undefined) data[k] = base[k];
  for (const k of Object.keys(base.seq)) if (data.seq[k] === undefined) data.seq[k] = 0;
}
function save() {
  const tmp = DB_PATH + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
  fs.renameSync(tmp, DB_PATH); // atomic replace - avoids partial/corrupt writes
}
function nextId(t) { data.seq[t] += 1; return data.seq[t]; }
function now() { return new Date().toISOString().replace('T', ' ').slice(0, 19); }
function today() { return new Date().toISOString().slice(0, 10); }
load();

/* --------------------------- credential helpers --------------------------- */
function slugify(name) {
  return String(name).toLowerCase().trim().replace(/[^a-z0-9\s.]/g, '').replace(/\s+/g, '.').replace(/\.+/g, '.').replace(/^\.|\.$/g, '');
}
function uniqueUsername(name) {
  const base = slugify(name) || 'user';
  const taken = (local) => data.issued_usernames.includes(local + USERNAME_DOMAIN) || data.users.some((u) => u.username === local + USERNAME_DOMAIN);
  let local = base, n = 1;
  while (taken(local)) { n += 1; local = base + n; }
  return local + USERNAME_DOMAIN;
}
function generatePassword() {
  const alphabet = 'abcdefghjkmnpqrstuvwxyz23456789';
  const bytes = crypto.randomBytes(8);
  let out = ''; for (let i = 0; i < 8; i++) out += alphabet[bytes[i] % alphabet.length];
  return out;
}

/* -------------------------------- gems ------------------------------------ */
const DEFAULT_ASSIGNMENT_POINTS = 100;
function gemLevel(gems) {
  if (gems >= 1200) return 'Platinum';
  if (gems >= 700) return 'Gold';
  if (gems >= 300) return 'Silver';
  return 'Bronze';
}

/* ------------------------------- users ------------------------------- */
const Users = {
  byId(id) {
    const u = data.users.find((x) => x.id === Number(id));
    return u ? { id: u.id, name: u.name, username: u.username, email: u.email, role: u.role, profile: u.profile || {}, profile_complete: !!u.profile_complete } : null;
  },
  byLogin(identifier) {
    const id = String(identifier || '').toLowerCase().trim();
    return data.users.find((x) => x.username === id || (x.email && x.email.toLowerCase() === id)) || null;
  },
  raw(id) { return data.users.find((x) => x.id === Number(id)) || null; },
  create({ name, role = 'student', email = null }) {
    const username = uniqueUsername(name);
    data.issued_usernames.push(username); // remember forever
    const plain = generatePassword();
    const id = nextId('users');
    data.users.push({
      id, name, username, email: email ? email.toLowerCase() : null,
      password_hash: bcrypt.hashSync(plain, 10), role, profile: {}, profile_complete: false, created_at: now(),
    });
    save();
    return { user: { id, name, username, email: email || null, role }, password: plain };
  },
  // Used by seed to make memorable demo logins.
  createFixed({ name, role, username, email, password }) {
    if (!data.issued_usernames.includes(username)) data.issued_usernames.push(username);
    const id = nextId('users');
    data.users.push({ id, name, username, email: email || null, password_hash: bcrypt.hashSync(password, 10), role, profile: {}, profile_complete: false, created_at: now() });
    save();
    return { id, name, username, role };
  },
  updatePassword(id, plain) { const u = Users.raw(id); if (!u) return false; u.password_hash = bcrypt.hashSync(plain, 10); save(); return true; },
  updateProfile(id, profile) {
    const u = Users.raw(id); if (!u) return false;
    u.profile = { ...(u.profile || {}), ...profile }; u.profile_complete = true; save(); return true;
  },
  list(role) {
    return data.users.filter((u) => (role ? u.role === role : true))
      .map((u) => ({ id: u.id, name: u.name, username: u.username, email: u.email, role: u.role, profile: u.profile || {} }))
      .sort((a, b) => a.name.localeCompare(b.name));
  },
  instructors() { return Users.list('instructor'); },
  countByRole(role) { return data.users.filter((u) => u.role === role).length; },
};

/* ------------------------------ courses ------------------------------ */
const TIER_ORDER = ['Bootcamp', 'Short Course', 'Specialist Track', 'Career Track'];
const Courses = {
  all() { return [...data.courses]; },
  byId(id) { return data.courses.find((c) => c.id === Number(id)) || null; },
  create(c) {
    if (data.courses.some((x) => x.code === c.code)) { const e = new Error('dup'); e.dup = true; throw e; }
    const id = nextId('courses');
    data.courses.push({ id, code: c.code, title: c.title, tier: c.tier, level: c.level || null, summary: c.summary || null,
      weeks: c.weeks ? Number(c.weeks) : null, hours: c.hours ? Number(c.hours) : null, price_pkr: c.price_pkr ? Number(c.price_pkr) : null, created_at: now() });
    save();
    return id;
  },
};

/* ------------------------------ batches ------------------------------ */
// Each offering gets a unique code derived from the catalogue course code.
function uniqueBatchCode(courseId) {
  const c = Courses.byId(courseId) || {};
  const prefix = (c.code || 'CRS');
  let n = 1;
  const exists = (code) => data.batches.some((b) => b.code === code);
  let code = `${prefix}-${String(n).padStart(3, '0')}`;
  while (exists(code)) { n += 1; code = `${prefix}-${String(n).padStart(3, '0')}`; }
  return code;
}
const Batches = {
  byId(id) { return data.batches.find((b) => b.id === Number(id)) || null; },
  create(b) {
    const id = nextId('batches');
    const code = uniqueBatchCode(b.course_id);
    data.batches.push({ id, code, course_id: Number(b.course_id), name: b.name, start_date: b.start_date || null,
      status: b.status || 'running', instructor_id: b.instructor_id ? Number(b.instructor_id) : null, seats: b.seats ? Number(b.seats) : 30, created_at: now() });
    save();
    return { id, code };
  },
  setInstructor(bid, instructorId) { const b = Batches.byId(bid); if (!b) return false; b.instructor_id = instructorId ? Number(instructorId) : null; save(); return true; },
  remove(bid) {
    const id = Number(bid);
    const b = Batches.byId(id); if (!b) return false;
    const assignmentIds = data.assignments.filter((a) => a.batch_id === id).map((a) => a.id);
    data.submissions = data.submissions.filter((s) => !assignmentIds.includes(s.assignment_id));
    data.assignments = data.assignments.filter((a) => a.batch_id !== id);
    data.sessions = data.sessions.filter((s) => s.batch_id !== id);
    data.lessons = data.lessons.filter((l) => l.batch_id !== id);
    data.enrollments = data.enrollments.filter((e) => e.batch_id !== id);
    data.announcements = data.announcements.filter((a) => a.batch_id !== id);
    data.batches = data.batches.filter((x) => x.id !== id);
    save();
    return true;
  },
  decorate(b) {
    if (!b) return null;
    const c = Courses.byId(b.course_id) || {};
    const t = b.instructor_id ? Users.byId(b.instructor_id) : null;
    const sessions = data.sessions.filter((s) => s.batch_id === b.id);
    const done = sessions.filter((s) => s.session_date && s.session_date < today()).length;
    const assignments = data.assignments.filter((a) => a.batch_id === b.id);
    const possible = assignments.reduce((sum, a) => sum + (a.points || DEFAULT_ASSIGNMENT_POINTS), 0);
    return {
      ...b, course_title: c.title, tier: c.tier, weeks: c.weeks, hours: c.hours, summary: c.summary,
      instructor_name: t ? t.name : null,
      enrolled: data.enrollments.filter((e) => e.batch_id === b.id).length,
      sessions_total: sessions.length, sessions_done: done,
      progress_pct: sessions.length ? Math.round((done / sessions.length) * 100) : 0,
      assignments_total: assignments.length, gems_possible: possible,
    };
  },
  all() { return data.batches.map(Batches.decorate).sort((a, b) => String(b.created_at).localeCompare(String(a.created_at))); },
  forTeacher(uid) { return data.batches.filter((b) => b.instructor_id === Number(uid)).map(Batches.decorate); },
};

/* ---------------------------- enrollments ---------------------------- */
const Enrollments = {
  isEnrolled(uid, bid) { return data.enrollments.some((e) => e.user_id === Number(uid) && e.batch_id === Number(bid)); },
  create(uid, bid) {
    if (Enrollments.isEnrolled(uid, bid)) return null;
    const id = nextId('enrollments');
    data.enrollments.push({ id, user_id: Number(uid), batch_id: Number(bid), status: 'active', enrolled_at: now() });
    save();
    return id;
  },
  remove(uid, bid) {
    const before = data.enrollments.length;
    data.enrollments = data.enrollments.filter((e) => !(e.user_id === Number(uid) && e.batch_id === Number(bid)));
    save();
    return data.enrollments.length < before;
  },
  forUser(uid) {
    return data.enrollments.filter((e) => e.user_id === Number(uid)).map((e) => Batches.decorate(Batches.byId(e.batch_id)))
      .filter(Boolean).sort((a, b) => String(b.start_date).localeCompare(String(a.start_date)));
  },
  studentsForBatch(bid) {
    return data.enrollments.filter((e) => e.batch_id === Number(bid)).map((e) => {
      const u = Users.byId(e.user_id) || {};
      return { id: u.id, name: u.name, username: u.username, email: u.email, profile: u.profile || {} };
    }).filter((s) => s.id).sort((a, b) => String(a.name).localeCompare(String(b.name)));
  },
  count() { return data.enrollments.length; },
};

/* --------------------- courses + schedule for a user ------------------ */
function coursesForUser(user) {
  if (user.role === 'admin') return Batches.all();
  if (user.role === 'instructor') return Batches.forTeacher(user.id);
  return Enrollments.forUser(user.id);
}
function canManageBatch(user, batch) {
  if (!batch) return false;
  if (user.role === 'admin') return true;
  return user.role === 'instructor' && batch.instructor_id === user.id;
}

/* ------------------------------ sessions ----------------------------- */
const Sessions = {
  create(s) {
    const id = nextId('sessions');
    data.sessions.push({ id, batch_id: Number(s.batch_id), week_no: s.week_no ? Number(s.week_no) : null, title: s.title,
      session_date: s.session_date || null, start_time: s.start_time || null, end_time: s.end_time || null, join_url: s.join_url || null, recording_url: s.recording_url || null });
    save();
    return id;
  },
  forBatch(bid) {
    return data.sessions.filter((s) => s.batch_id === Number(bid))
      .sort((a, b) => String(a.session_date).localeCompare(String(b.session_date)) || String(a.start_time).localeCompare(String(b.start_time)));
  },
  upcomingForBatches(batchIds, limit = 20) {
    const set = new Set(batchIds.map(Number));
    return data.sessions.filter((s) => set.has(s.batch_id))
      .map((s) => ({ ...s, course_title: (Courses.byId((Batches.byId(s.batch_id) || {}).course_id) || {}).title }))
      .sort((a, b) => String(a.session_date).localeCompare(String(b.session_date)) || String(a.start_time).localeCompare(String(b.start_time)))
      .slice(0, limit);
  },
};

/* ------------------------------ lessons ------------------------------ */
const Lessons = {
  create(l) {
    const id = nextId('lessons');
    data.lessons.push({ id, course_id: Number(l.course_id), batch_id: l.batch_id ? Number(l.batch_id) : null,
      week_no: l.week_no ? Number(l.week_no) : null, title: l.title, type: l.type || 'reading', url: l.url || null, position: l.position ? Number(l.position) : 0, created_at: now() });
    save();
    return id;
  },
  forBatch(bid) {
    return data.lessons.filter((l) => l.batch_id === Number(bid))
      .sort((a, b) => (a.week_no || 0) - (b.week_no || 0) || (a.position || 0) - (b.position || 0));
  },
  remove(id, bid) {
    const before = data.lessons.length;
    data.lessons = data.lessons.filter((l) => !(l.id === Number(id) && l.batch_id === Number(bid)));
    save();
    return data.lessons.length < before;
  },
};

/* ---------------------------- assignments ---------------------------- */
const Assignments = {
  byId(id) { return data.assignments.find((a) => a.id === Number(id)) || null; },
  create(a) {
    const id = nextId('assignments');
    data.assignments.push({ id, batch_id: Number(a.batch_id), title: a.title, description: a.description || null,
      due_date: a.due_date || null, file_url: a.file_url || null, points: a.points ? Number(a.points) : DEFAULT_ASSIGNMENT_POINTS, created_by: a.created_by || null, created_at: now() });
    save();
    return id;
  },
  forBatch(bid) { return data.assignments.filter((a) => a.batch_id === Number(bid)).sort((a, b) => String(b.created_at).localeCompare(String(a.created_at))); },
  remove(id, bid) {
    const aid = Number(id);
    data.submissions = data.submissions.filter((s) => s.assignment_id !== aid);
    const before = data.assignments.length;
    data.assignments = data.assignments.filter((a) => !(a.id === aid && a.batch_id === Number(bid)));
    save();
    return data.assignments.length < before;
  },
};

/* ---------------------------- submissions ---------------------------- */
const Submissions = {
  byId(id) { return data.submissions.find((s) => s.id === Number(id)) || null; },
  upsert({ assignment_id, user_id, file_url, note }) {
    let s = data.submissions.find((x) => x.assignment_id === Number(assignment_id) && x.user_id === Number(user_id));
    if (s) { s.file_url = file_url || s.file_url; s.note = note || s.note; s.submitted_at = now(); }
    else {
      s = { id: nextId('submissions'), assignment_id: Number(assignment_id), user_id: Number(user_id), file_url: file_url || null, note: note || null,
        submitted_at: now(), grade: null, gems: 0, remarks: null, graded_at: null, graded_by: null };
      data.submissions.push(s);
    }
    save();
    return s;
  },
  grade(id, gradePct, remarks, graderId) {
    const s = Submissions.byId(id); if (!s) return null;
    const a = Assignments.byId(s.assignment_id) || { points: DEFAULT_ASSIGNMENT_POINTS };
    const pct = Math.max(0, Math.min(100, Number(gradePct)));
    s.grade = pct; s.gems = Math.round((a.points || DEFAULT_ASSIGNMENT_POINTS) * pct / 100);
    s.remarks = remarks || null; s.graded_at = now(); s.graded_by = graderId || null;
    save();
    return s;
  },
  forAssignment(aid) {
    return data.submissions.filter((s) => s.assignment_id === Number(aid)).map((s) => {
      const u = Users.byId(s.user_id) || {}; return { ...s, student_name: u.name, student_username: u.username };
    }).sort((a, b) => String(a.student_name).localeCompare(String(b.student_name)));
  },
  forStudent(uid, assignmentIds) {
    const set = new Set(assignmentIds.map(Number)); const out = {};
    data.submissions.filter((s) => s.user_id === Number(uid) && set.has(s.assignment_id)).forEach((s) => { out[s.assignment_id] = s; });
    return out;
  },
  countForAssignment(aid) { return data.submissions.filter((s) => s.assignment_id === Number(aid)).length; },
};

/* ----------------------------- gamification --------------------------- */
function gemsForStudentInBatch(uid, bid) {
  const aids = data.assignments.filter((a) => a.batch_id === Number(bid)).map((a) => a.id);
  return data.submissions.filter((s) => s.user_id === Number(uid) && aids.includes(s.assignment_id)).reduce((sum, s) => sum + (s.gems || 0), 0);
}
function totalGemsForStudent(uid) {
  return data.submissions.filter((s) => s.user_id === Number(uid)).reduce((sum, s) => sum + (s.gems || 0), 0);
}
function studentLeaderboard() {
  return data.users.filter((u) => u.role === 'student').map((u) => {
    const gems = totalGemsForStudent(u.id);
    return { id: u.id, name: u.name, username: u.username, gems, level: gemLevel(gems) };
  }).sort((a, b) => b.gems - a.gems);
}
function courseLeaderboard() {
  return data.batches.map((b) => {
    const aids = data.assignments.filter((a) => a.batch_id === b.id).map((a) => a.id);
    const gems = data.submissions.filter((s) => aids.includes(s.assignment_id)).reduce((sum, s) => sum + (s.gems || 0), 0);
    const c = Courses.byId(b.course_id) || {};
    return { id: b.id, code: b.code, title: c.title, name: b.name, gems, gems_possible: Batches.decorate(b).gems_possible };
  }).sort((a, b) => b.gems - a.gems);
}

/* --------------------------- course report ---------------------------- */
// Per-student completion + gems + latest remark, for admin/teacher dashboards.
function courseReport(bid) {
  const b = Batches.decorate(Batches.byId(bid));
  const assignments = Assignments.forBatch(bid);
  const aids = assignments.map((a) => a.id);
  const students = Enrollments.studentsForBatch(bid).map((s) => {
    const subs = data.submissions.filter((x) => x.user_id === s.id && aids.includes(x.assignment_id));
    const graded = subs.filter((x) => x.grade != null);
    const gems = subs.reduce((sum, x) => sum + (x.gems || 0), 0);
    const lastRemark = graded.map((x) => x.remarks).filter(Boolean).slice(-1)[0] || null;
    const avg = graded.length ? Math.round(graded.reduce((t, x) => t + x.grade, 0) / graded.length) : null;
    return {
      id: s.id, name: s.name, username: s.username,
      submitted: subs.length, graded: graded.length, total: assignments.length,
      complete: assignments.length > 0 && subs.length >= assignments.length,
      gems, level: gemLevel(gems), avg_grade: avg, last_remark: lastRemark,
    };
  });
  return {
    course: b, assignments_total: assignments.length,
    sessions_total: b.sessions_total, sessions_done: b.sessions_done, progress_pct: b.progress_pct,
    complete_students: students.filter((s) => s.complete).length, students,
  };
}

/* ---------------------------- announcements -------------------------- */
const Announcements = {
  create(a, authorId) {
    const id = nextId('announcements');
    data.announcements.push({ id, batch_id: a.batch_id ? Number(a.batch_id) : null, author_id: authorId || null, title: a.title, body: a.body, created_at: now() });
    save();
    return id;
  },
  forBatch(bid) { return data.announcements.filter((a) => a.batch_id === Number(bid) || a.batch_id == null).map(withAuthor).sort((a, b) => String(b.created_at).localeCompare(String(a.created_at))); },
  forUser(user, limit = 20) {
    const ids = coursesForUser(user).map((b) => b.id);
    return data.announcements.filter((a) => a.batch_id == null || ids.includes(a.batch_id)).map(withAuthor)
      .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at))).slice(0, limit);
  },
};
function withAuthor(a) { const u = a.author_id ? Users.byId(a.author_id) : null; return { ...a, author_name: u ? u.name : null }; }
function announcementRecipients(batchId) {
  let users;
  if (batchId) {
    const b = Batches.byId(batchId);
    const ids = new Set(Enrollments.studentsForBatch(batchId).map((s) => s.id));
    if (b && b.instructor_id) ids.add(b.instructor_id);
    users = [...ids].map((id) => Users.byId(id)).filter(Boolean);
  } else users = data.users.slice();
  return users.filter((u) => u && u.email).map((u) => ({ name: u.name, email: u.email }));
}

/* ------------------------------- admin ------------------------------- */
const Admin = {
  overview() {
    return {
      students: Users.countByRole('student'), teachers: Users.countByRole('instructor'),
      courses: data.courses.length, running_courses: data.batches.length,
      enrollments: data.enrollments.length, assignments: data.assignments.length, submissions: data.submissions.length,
      graded: data.submissions.filter((s) => s.grade != null).length,
      total_gems: data.submissions.reduce((sum, s) => sum + (s.gems || 0), 0),
      batches: Batches.all(),
    };
  },
};

/* -------------------------------- seed ------------------------------- */
function seed() {
  data = empty();
  const admin = Users.createFixed({ name: 'EchoLens Admin', role: 'admin', username: 'admin@echolens.digital', email: 'admin@echolens.digital', password: 'ChangeMe!2026' });
  const teacher = Users.createFixed({ name: 'Lead Teacher', role: 'instructor', username: 'teacher@echolens.digital', email: 'teacher@echolens.digital', password: 'ChangeMe!2026' });
  const student = Users.createFixed({ name: 'Demo Student', role: 'student', username: 'student@echolens.digital', email: 'student@echolens.digital', password: 'ChangeMe!2026' });

  const courses = [
    { code:'BC-PY', title:'Python for AI - Bootcamp', tier:'Bootcamp', level:'Beginner', weeks:2, hours:8, price_pkr:4500, summary:'Applied Python through the libraries used in real AI work.' },
    { code:'SC-GENAI', title:'Generative AI Foundations', tier:'Short Course', level:'Foundational', weeks:6, hours:24, price_pkr:12500, summary:'Concepts and tooling behind modern Gen AI.' },
    { code:'ST-RAG', title:'Generative AI Engineering', tier:'Specialist Track', level:'Intermediate', weeks:8, hours:32, price_pkr:18500, summary:'Project-driven RAG and LLM application engineering.' },
    { code:'CT-AIENG', title:'AI Engineering Career Track', tier:'Career Track', level:'Advanced', weeks:12, hours:48, price_pkr:32000, summary:'A portfolio-driven flagship for serious career-builders.' },
  ];
  const ids = {}; courses.forEach((c) => { ids[c.code] = Courses.create(c); });

  const b1 = Batches.create({ course_id: ids['ST-RAG'], name: 'July 2026 Cohort', start_date: '2026-07-07', status: 'running', instructor_id: teacher.id });
  Enrollments.create(student.id, b1.id);
  [
    [1, 'Course kickoff and the RAG mental model', '2026-07-07', '20:00', '22:00'],
    [1, 'Embeddings and vector stores in practice', '2026-07-09', '20:00', '22:00'],
    [2, 'Building a retrieval pipeline', '2026-07-14', '20:00', '22:00'],
  ].forEach(([wk, title, d, st, et]) => Sessions.create({ batch_id: b1.id, week_no: wk, title, session_date: d, start_time: st, end_time: et, join_url: 'https://meet.google.com/your-live-class-link' }));
  Lessons.create({ course_id: ids['ST-RAG'], batch_id: b1.id, week_no: 1, title: 'Week 1 slides: RAG overview', type: 'slides', url: '#', position: 1 });
  Assignments.create({ batch_id: b1.id, title: 'Build a mini RAG service', description: 'Submit a short notebook describing your retrieval pipeline.', due_date: '2026-07-20', points: 100, created_by: teacher.id });

  Announcements.create({ batch_id: null, title: 'Welcome to EchoLens', body: 'Sign in to reach your courses, schedule, content and assignments.' }, admin.id);

  save();
  console.log('Seed complete. Database file:', DB_PATH);
  console.log('Sign-in accounts (username / password) - change after first login:');
  console.log('  admin@echolens.digital   / ChangeMe!2026  (admin)');
  console.log('  teacher@echolens.digital / ChangeMe!2026  (teacher)');
  console.log('  student@echolens.digital / ChangeMe!2026  (student)');
}

module.exports = {
  Users, Courses, Batches, Enrollments, Sessions, Lessons, Assignments, Submissions, Announcements, Admin,
  coursesForUser, canManageBatch, announcementRecipients, courseReport, gemsForStudentInBatch, totalGemsForStudent,
  studentLeaderboard, courseLeaderboard, gemLevel, seed, DB_PATH, allData: () => data,
};

if (require.main === module && process.argv.includes('--seed')) seed();
