'use strict';

/**
 * EchoLens LMS - server (v3, portal only)
 * Course-centric API with grading + gems, per-course dashboards, profile
 * questionnaires, CSV exports, course deletion, and durable data storage.
 */

require('dotenv').config();
const path = require('path');
const fs = require('fs');
const express = require('express');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const store = require('./store');
const mailer = require('./mailer');
const {
  Users, Courses, Batches, Enrollments, Sessions, Lessons, Assignments, Submissions, Announcements, Admin,
  coursesForUser, canManageBatch, announcementRecipients, courseReport, gemsForStudentInBatch, totalGemsForStudent,
  studentLeaderboard, courseLeaderboard, gemLevel,
} = store;

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'echolens-dev-secret-change-in-production';
const COOKIE = 'el_token';
const isProd = process.env.NODE_ENV === 'production';

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, 'uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOAD_DIR),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')),
  }),
  limits: { fileSize: 50 * 1024 * 1024 },
});

app.use(express.json());
app.use(cookieParser());

/* ----------------------------- auth helpers ----------------------------- */
const sign = (u) => jwt.sign({ id: u.id, role: u.role, name: u.name }, JWT_SECRET, { expiresIn: '7d' });
function setAuthCookie(res, token) { res.cookie(COOKIE, token, { httpOnly: true, sameSite: 'lax', secure: isProd, maxAge: 7 * 24 * 60 * 60 * 1000 }); }
function currentUser(req) { const t = req.cookies[COOKIE]; if (!t) return null; try { return Users.byId(jwt.verify(t, JWT_SECRET).id); } catch { return null; } }
function authRequired(req, res, next) { const u = currentUser(req); if (!u) return res.status(401).json({ error: 'Please sign in to continue.' }); req.user = u; next(); }
function adminRequired(req, res, next) { if (!req.user || req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access only.' }); next(); }
function manageBatch(req, res, next) {
  const b = Batches.byId(req.params.id);
  if (!b) return res.status(404).json({ error: 'Course not found.' });
  if (!canManageBatch(req.user, b)) return res.status(403).json({ error: 'You cannot manage this course.' });
  req.batch = b; next();
}
const isEmail = (s) => typeof s === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);

/* ------------------------------- auth API ------------------------------- */
app.post('/api/auth/login', (req, res) => {
  const { login, email, password } = req.body || {};
  const id = login || email;
  if (!id || !password) return res.status(400).json({ error: 'Enter your username and password.' });
  const row = Users.byLogin(id);
  if (!row || !bcrypt.compareSync(password, row.password_hash)) return res.status(401).json({ error: 'Username or password is incorrect.' });
  setAuthCookie(res, sign(row));
  res.json({ user: Users.byId(row.id) });
});
app.post('/api/auth/logout', (req, res) => { res.clearCookie(COOKIE); res.json({ ok: true }); });
app.get('/api/auth/me', (req, res) => { const u = currentUser(req); if (!u) return res.status(401).json({ error: 'Not signed in.' }); res.json({ user: u }); });

app.post('/api/me/password', authRequired, (req, res) => {
  const { current, next } = req.body || {};
  if (!next || next.length < 8) return res.status(400).json({ error: 'New password must be at least 8 characters.' });
  const row = Users.raw(req.user.id);
  if (!row || !bcrypt.compareSync(current || '', row.password_hash)) return res.status(401).json({ error: 'Your current password is incorrect.' });
  Users.updatePassword(req.user.id, next);
  res.json({ ok: true });
});

// Profile questionnaire (student + teacher). Whitelisted fields.
app.post('/api/me/profile', authRequired, (req, res) => {
  const allow = ['dob', 'age', 'gender', 'city', 'phone', 'status', 'highest_degree', 'university', 'field', 'organization', 'current_role', 'experience_years', 'specialization', 'bio', 'goal', 'linkedin'];
  const p = {}; const body = req.body || {};
  allow.forEach((k) => { if (body[k] !== undefined && body[k] !== null && body[k] !== '') p[k] = body[k]; });
  Users.updateProfile(req.user.id, p);
  res.json({ ok: true, user: Users.byId(req.user.id) });
});

/* ------------------------------ my space -------------------------------- */
app.get('/api/me/courses', authRequired, (req, res) => res.json({ courses: coursesForUser(req.user) }));
app.get('/api/me/schedule', authRequired, (req, res) => {
  const ids = coursesForUser(req.user).map((b) => b.id);
  res.json({ upcoming: Sessions.upcomingForBatches(ids, 30) });
});
app.get('/api/me/announcements', authRequired, (req, res) => res.json({ announcements: Announcements.forUser(req.user, 30) }));

app.get('/api/me/overview', authRequired, (req, res) => {
  const courses = coursesForUser(req.user);
  const ids = courses.map((b) => b.id);
  const out = { role: req.user.role, courses: courses.length, upcoming: Sessions.upcomingForBatches(ids, 5), announcements: Announcements.forUser(req.user, 5) };
  if (req.user.role === 'student') {
    const gems = totalGemsForStudent(req.user.id);
    out.gems = gems; out.level = gemLevel(gems);
    out.course_progress = courses.map((b) => ({ id: b.id, code: b.code, title: b.course_title, progress_pct: b.progress_pct, gems: gemsForStudentInBatch(req.user.id, b.id), gems_possible: b.gems_possible }));
  }
  res.json(out);
});

/* ---------------------------- course detail ----------------------------- */
app.get('/api/courses/:id', authRequired, (req, res) => {
  const b = Batches.byId(req.params.id);
  if (!b) return res.status(404).json({ error: 'Course not found.' });
  const manage = canManageBatch(req.user, b);
  const enrolled = Enrollments.isEnrolled(req.user.id, b.id);
  if (!manage && !enrolled) return res.status(403).json({ error: 'You are not part of this course.' });

  const assignments = Assignments.forBatch(b.id);
  const mySubs = req.user.role === 'student' ? Submissions.forStudent(req.user.id, assignments.map((a) => a.id)) : {};
  const assignmentsOut = assignments.map((a) => {
    const base = { id: a.id, title: a.title, description: a.description, due_date: a.due_date, file_url: a.file_url, points: a.points };
    if (manage) base.submission_count = Submissions.countForAssignment(a.id);
    if (req.user.role === 'student') {
      const s = mySubs[a.id];
      base.my_submission = s ? { file_url: s.file_url, note: s.note, submitted_at: s.submitted_at, gems: s.gems, remarks: s.remarks, graded: s.grade != null } : null;
    }
    return base;
  });

  const teacher = b.instructor_id ? Users.byId(b.instructor_id) : null;
  const out = {
    course: Batches.decorate(b), can_manage: manage, role: req.user.role,
    sessions: Sessions.forBatch(b.id), lessons: Lessons.forBatch(b.id),
    assignments: assignmentsOut, announcements: Announcements.forBatch(b.id),
    students: manage ? Enrollments.studentsForBatch(b.id) : [],
    teacher_profile: teacher ? { name: teacher.name, profile: teacher.profile || {} } : null,
  };
  if (req.user.role === 'student') {
    out.my_gems = gemsForStudentInBatch(req.user.id, b.id);
    out.my_gems_possible = out.course.gems_possible;
  }
  res.json(out);
});

app.get('/api/courses/:id/report', authRequired, manageBatch, (req, res) => res.json(courseReport(req.batch.id)));

/* ------------------- course management (admin or teacher) --------------- */
app.post('/api/courses/:id/sessions', authRequired, manageBatch, (req, res) => {
  const b = req.body || {}; if (!b.title) return res.status(400).json({ error: 'Class title is required.' });
  res.json({ id: Sessions.create({ ...b, batch_id: req.batch.id }) });
});
app.post('/api/courses/:id/lessons', authRequired, manageBatch, upload.single('file'), (req, res) => {
  const b = req.body || {}; if (!b.title) return res.status(400).json({ error: 'Title is required.' });
  if (req.file) b.url = '/uploads/' + req.file.filename;
  res.json({ id: Lessons.create({ ...b, course_id: req.batch.course_id, batch_id: req.batch.id }) });
});
app.post('/api/courses/:id/lessons/:lid/delete', authRequired, manageBatch, (req, res) => res.json({ ok: Lessons.remove(req.params.lid, req.batch.id) }));

app.post('/api/courses/:id/assignments', authRequired, manageBatch, upload.single('file'), (req, res) => {
  const b = req.body || {}; if (!b.title) return res.status(400).json({ error: 'Assignment title is required.' });
  if (req.file) b.file_url = '/uploads/' + req.file.filename;
  res.json({ id: Assignments.create({ ...b, batch_id: req.batch.id, created_by: req.user.id }) });
});
app.post('/api/courses/:id/assignments/:aid/delete', authRequired, manageBatch, (req, res) => res.json({ ok: Assignments.remove(req.params.aid, req.batch.id) }));

app.post('/api/courses/:id/announcements', authRequired, manageBatch, async (req, res) => {
  const b = req.body || {}; if (!b.title || !b.body) return res.status(400).json({ error: 'Title and message are required.' });
  const id = Announcements.create({ batch_id: req.batch.id, title: b.title, body: b.body }, req.user.id);
  const recipients = announcementRecipients(req.batch.id);
  if (recipients.length) { const m = mailer.announcementEmail(b.title, b.body, req.user.name, 'Course announcement'); mailer.sendMail({ bcc: recipients.map((r) => r.email), subject: m.subject, text: m.text, html: m.html }).catch(() => {}); }
  res.json({ id, notified: recipients.length });
});

/* ---------------------------- grading & subs ---------------------------- */
app.get('/api/assignments/:aid/submissions', authRequired, (req, res) => {
  const a = Assignments.byId(req.params.aid); if (!a) return res.status(404).json({ error: 'Assignment not found.' });
  if (!canManageBatch(req.user, Batches.byId(a.batch_id))) return res.status(403).json({ error: 'You cannot view these submissions.' });
  res.json({ assignment: a, submissions: Submissions.forAssignment(a.id) });
});
app.post('/api/submissions/:id/grade', authRequired, (req, res) => {
  const s = Submissions.byId(req.params.id); if (!s) return res.status(404).json({ error: 'Submission not found.' });
  const a = Assignments.byId(s.assignment_id);
  if (!canManageBatch(req.user, Batches.byId(a.batch_id))) return res.status(403).json({ error: 'You cannot grade this.' });
  const { grade, remarks } = req.body || {};
  if (grade == null || isNaN(Number(grade))) return res.status(400).json({ error: 'Enter a grade (0-100).' });
  res.json({ ok: true, submission: Submissions.grade(s.id, grade, remarks, req.user.id) });
});
app.post('/api/assignments/:aid/submit', authRequired, upload.single('file'), (req, res) => {
  const a = Assignments.byId(req.params.aid); if (!a) return res.status(404).json({ error: 'Assignment not found.' });
  if (!Enrollments.isEnrolled(req.user.id, a.batch_id)) return res.status(403).json({ error: 'You are not enrolled in this course.' });
  if (!req.file && !(req.body && req.body.note)) return res.status(400).json({ error: 'Attach a file (or add a note) to submit.' });
  const file_url = req.file ? '/uploads/' + req.file.filename : null;
  res.json({ ok: true, submission: Submissions.upsert({ assignment_id: a.id, user_id: req.user.id, file_url, note: (req.body || {}).note }) });
});

/* --------------------- admin: people on a course ------------------------ */
app.post('/api/courses/:id/students', authRequired, adminRequired, (req, res) => {
  const b = Batches.byId(req.params.id); if (!b) return res.status(404).json({ error: 'Course not found.' });
  let names = (req.body || {}).names; if (typeof names === 'string') names = names.split('\n');
  names = (names || []).map((n) => String(n).trim()).filter(Boolean);
  if (!names.length) return res.status(400).json({ error: 'Enter at least one student name.' });
  const created = names.map((name) => { const { user, password } = Users.create({ name, role: 'student' }); Enrollments.create(user.id, b.id); return { name: user.name, username: user.username, password }; });
  res.json({ created });
});
app.post('/api/courses/:id/remove-student', authRequired, adminRequired, (req, res) => {
  const b = Batches.byId(req.params.id); if (!b) return res.status(404).json({ error: 'Course not found.' });
  res.json({ ok: Enrollments.remove((req.body || {}).user_id, b.id) });
});
app.post('/api/courses/:id/teacher', authRequired, adminRequired, (req, res) => {
  const b = Batches.byId(req.params.id); if (!b) return res.status(404).json({ error: 'Course not found.' });
  const body = req.body || {};
  if (body.instructor_id) {
    const t = Users.byId(body.instructor_id); if (!t || t.role !== 'instructor') return res.status(400).json({ error: 'Choose a valid teacher.' });
    Batches.setInstructor(b.id, t.id); return res.json({ ok: true, assigned: { name: t.name, username: t.username } });
  }
  if (body.name && body.name.trim()) {
    const { user, password } = Users.create({ name: body.name.trim(), role: 'instructor', email: body.email && isEmail(body.email) ? body.email : null });
    Batches.setInstructor(b.id, user.id);
    if (user.email) { const m = mailer.welcomeEmail(user, password, 'Teacher'); mailer.sendMail({ to: user.email, subject: m.subject, text: m.text, html: m.html }).catch(() => {}); }
    return res.json({ ok: true, created: { name: user.name, username: user.username, password } });
  }
  res.status(400).json({ error: 'Provide a teacher to assign or a name to create one.' });
});
app.post('/api/courses/:id/remove-teacher', authRequired, adminRequired, (req, res) => {
  const b = Batches.byId(req.params.id); if (!b) return res.status(404).json({ error: 'Course not found.' });
  Batches.setInstructor(b.id, null); res.json({ ok: true });
});

/* --------------------------- admin: catalogue --------------------------- */
app.get('/api/admin/overview', authRequired, adminRequired, (req, res) => res.json(Admin.overview()));
app.get('/api/admin/leaderboard', authRequired, adminRequired, (req, res) => res.json({ students: studentLeaderboard(), courses: courseLeaderboard() }));
app.get('/api/admin/catalogue', authRequired, adminRequired, (req, res) => res.json({ courses: Courses.all() }));
app.get('/api/admin/teachers', authRequired, adminRequired, (req, res) => res.json({ teachers: Users.instructors() }));

app.post('/api/admin/courses', authRequired, adminRequired, (req, res) => {
  const b = req.body || {}; if (!b.code || !b.title || !b.tier) return res.status(400).json({ error: 'Code, title and tier are required.' });
  try { res.json({ id: Courses.create(b) }); } catch { res.status(409).json({ error: 'A course with this code already exists.' }); }
});
app.post('/api/admin/start-course', authRequired, adminRequired, (req, res) => {
  const b = req.body || {}; if (!b.course_id || !b.name) return res.status(400).json({ error: 'Choose a course and give the offering a name.' });
  const { id, code } = Batches.create({ course_id: b.course_id, name: b.name, start_date: b.start_date, status: b.status || 'running', instructor_id: b.instructor_id || null });
  res.json({ id, code });
});
app.post('/api/admin/courses/:id/delete', authRequired, adminRequired, (req, res) => res.json({ ok: Batches.remove(req.params.id) }));

app.post('/api/admin/broadcast', authRequired, adminRequired, async (req, res) => {
  const b = req.body || {}; if (!b.title || !b.body) return res.status(400).json({ error: 'Title and message are required.' });
  const id = Announcements.create({ batch_id: null, title: b.title, body: b.body }, req.user.id);
  const recipients = announcementRecipients(null);
  if (recipients.length) { const m = mailer.announcementEmail(b.title, b.body, req.user.name, 'All members'); mailer.sendMail({ bcc: recipients.map((r) => r.email), subject: m.subject, text: m.text, html: m.html }).catch(() => {}); }
  res.json({ id, notified: recipients.length });
});

/* ------------------------------ CSV exports ----------------------------- */
function csv(rows) {
  return rows.map((r) => r.map((v) => {
    const s = v == null ? '' : String(v);
    return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  }).join(',')).join('\r\n');
}
function sendCsv(res, filename, rows) {
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(csv(rows));
}
// All students across the platform
app.get('/api/admin/export/students.csv', authRequired, adminRequired, (req, res) => {
  const rows = [['Name', 'Username', 'Email', 'Total gems', 'Level', 'Degree', 'University', 'Status']];
  Users.list('student').forEach((u) => {
    const gems = totalGemsForStudent(u.id); const p = u.profile || {};
    rows.push([u.name, u.username, u.email || '', gems, gemLevel(gems), p.highest_degree || '', p.university || '', p.status || '']);
  });
  sendCsv(res, 'echolens-students.csv', rows);
});
// Students on one course offering
app.get('/api/admin/export/course/:id/students.csv', authRequired, adminRequired, (req, res) => {
  const rep = courseReport(req.params.id); const c = rep.course;
  const rows = [['Course', c.course_title], ['Code', c.code], ['Offering', c.name], [],
    ['Name', 'Username', 'Submitted', 'Total', 'Graded', 'Complete', 'Gems', 'Level', 'Avg grade', 'Last remark']];
  rep.students.forEach((s) => rows.push([s.name, s.username, s.submitted, s.total, s.graded, s.complete ? 'Yes' : 'No', s.gems, s.level, s.avg_grade == null ? '' : s.avg_grade, s.last_remark || '']));
  sendCsv(res, `echolens-${c.code}-students.csv`, rows);
});
// Only students who completed every task
app.get('/api/admin/export/course/:id/completed.csv', authRequired, adminRequired, (req, res) => {
  const rep = courseReport(req.params.id); const c = rep.course;
  const rows = [['Completed students - ' + c.code + ' ' + c.name], [], ['Name', 'Username', 'Gems', 'Level', 'Avg grade']];
  rep.students.filter((s) => s.complete).forEach((s) => rows.push([s.name, s.username, s.gems, s.level, s.avg_grade == null ? '' : s.avg_grade]));
  sendCsv(res, `echolens-${c.code}-completed.csv`, rows);
});
// Full database backup (JSON)
app.get('/api/admin/export/backup.json', authRequired, adminRequired, (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="echolens-backup-${new Date().toISOString().slice(0, 10)}.json"`);
  res.send(JSON.stringify(store.allData(), null, 2));
});

/* ------------------------------ static + pages -------------------------- */
app.use('/uploads', express.static(UPLOAD_DIR));
app.use(express.static(path.join(__dirname, 'public')));
app.get('/dashboard', (req, res) => res.sendFile(path.join(__dirname, 'public', 'dashboard.html')));
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'login.html')));

app.listen(PORT, () => {
  console.log(`EchoLens LMS running on http://localhost:${PORT}`);
  console.log(mailer.configured ? '[mail] SMTP configured' : '[mail] SMTP not configured - emails will be logged, not sent');
});
