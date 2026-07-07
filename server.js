'use strict';

/**
 * EchoLens LMS - server (v4)
 * Adds: admin password reset, registration numbers, multiple teachers per
 * course, coordinator (read-only) role, gem awards, streaks, public profiles.
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
const ai = require('./ai');
const mailer = require('./mailer');
const {
  Users, Courses, Batches, Enrollments, Sessions, Lessons, Assignments, Submissions, Announcements, Admin, GemEvents, Challenges, Hackathons, AiReports, Quests,
  coursesForUser, canManageBatch, canViewBatch, announcementRecipients, courseReport,
  gemsForStudentInBatch, totalGemsForStudent, studentLeaderboard, batchLeaderboard, courseLeaderboard,
  stageFor, gamifyFor, touchActivity,
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

// Students may submit only Word or PDF files.
const DOC_EXT = ['.pdf', '.doc', '.docx'];
function requireDocFile(req, res) {
  if (!req.file) { res.status(400).json({ error: 'Attach your work as a PDF or Word file.' }); return false; }
  const ext = path.extname(req.file.originalname).toLowerCase();
  if (!DOC_EXT.includes(ext)) {
    try { fs.unlinkSync(req.file.path); } catch {}
    res.status(400).json({ error: 'Only PDF or Word (.doc/.docx) files are accepted. Export your work and resubmit.' });
    return false;
  }
  return true;
}
// Extract readable text from an uploaded submission for the AI layer.
async function extractText(fileUrl) {
  if (!fileUrl) return { text: null, name: null };
  const name = path.basename(fileUrl);
  const full = path.join(UPLOAD_DIR, name);
  if (!fs.existsSync(full)) return { text: null, name };
  const ext = path.extname(name).toLowerCase();
  try {
    if (ext === '.pdf') {
      const pdfParse = require('pdf-parse');
      const out = await pdfParse(fs.readFileSync(full));
      return { text: (out.text || '').slice(0, 60000) || null, name };
    }
    if (ext === '.docx') {
      const mammoth = require('mammoth');
      const out = await mammoth.extractRawText({ path: full });
      return { text: (out.value || '').slice(0, 60000) || null, name };
    }
    if (['.txt', '.md', '.py', '.js', '.ipynb', '.csv', '.html', '.sql'].includes(ext)) {
      return { text: fs.readFileSync(full, 'utf8').slice(0, 60000), name };
    }
  } catch (e) { console.error('extractText failed:', e.message); }
  return { text: null, name };
}

app.use(express.json());
app.use(cookieParser());

/* ------------------------------ auth helpers ------------------------------ */
const sign = (u) => jwt.sign({ id: u.id, role: u.role, name: u.name }, JWT_SECRET, { expiresIn: '7d' });
function setAuthCookie(res, token) { res.cookie(COOKIE, token, { httpOnly: true, sameSite: 'lax', secure: isProd, maxAge: 7 * 24 * 60 * 60 * 1000 }); }
function currentUser(req) { const t = req.cookies[COOKIE]; if (!t) return null; try { return Users.byId(jwt.verify(t, JWT_SECRET).id); } catch { return null; } }
function authRequired(req, res, next) {
  const u = currentUser(req);
  if (!u) return res.status(401).json({ error: 'Please sign in to continue.' });
  req.user = u; touchActivity(u); next();
}
function adminRequired(req, res, next) { if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access only.' }); next(); }
function teacherOrAdmin(req, res, next) { if (!['admin', 'instructor'].includes(req.user.role)) return res.status(403).json({ error: 'Teachers and admins only.' }); next(); }
function staffView(req, res, next) { // admin, coordinator, or the course's teachers may VIEW oversight data
  if (['admin', 'coordinator', 'instructor'].includes(req.user.role)) return next();
  return res.status(403).json({ error: 'Not available for your role.' });
}
function manageBatch(req, res, next) { // WRITE access: admin or an assigned teacher
  const b = Batches.byId(req.params.id);
  if (!b) return res.status(404).json({ error: 'Course not found.' });
  if (!canManageBatch(req.user, b)) return res.status(403).json({ error: 'You cannot manage this course.' });
  req.batch = b; next();
}
function viewBatch(req, res, next) { // READ access: manage roles + coordinator + enrolled student
  const b = Batches.byId(req.params.id);
  if (!b) return res.status(404).json({ error: 'Course not found.' });
  if (!canViewBatch(req.user, b)) return res.status(403).json({ error: 'You are not on this course.' });
  req.batch = b; next();
}
const isEmail = (s) => typeof s === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);

/* --------------------------------- auth --------------------------------- */
app.post('/api/auth/login', (req, res) => {
  const { login, password } = req.body || {};
  const u = login && Users.byLogin(login);
  if (!u || !bcrypt.compareSync(String(password || ''), u.password_hash)) {
    return res.status(401).json({ error: 'Incorrect username or password.' });
  }
  setAuthCookie(res, sign(u));
  res.json({ ok: true, role: u.role });
});
app.post('/api/auth/logout', (req, res) => { res.clearCookie(COOKIE); res.json({ ok: true }); });
app.get('/api/auth/me', authRequired, (req, res) => {
  const u = req.user;
  res.json({
    id: u.id, name: u.name, role: u.role, username: u.username, email: u.email, reg_no: u.reg_no,
    profile: u.profile || {}, gamify: ['student', 'free'].includes(u.role) ? gamifyFor(u) : null,
    ai_enabled: ['admin', 'instructor'].includes(u.role) && ai.enabled(),
  });
});

/* ---------------------------------- me ---------------------------------- */
app.post('/api/me/password', authRequired, (req, res) => {
  const { current, next } = req.body || {};
  if (!bcrypt.compareSync(String(current || ''), req.user.password_hash)) return res.status(400).json({ error: 'Current password is incorrect.' });
  if (!next || String(next).length < 8) return res.status(400).json({ error: 'New password must be at least 8 characters.' });
  Users.setPassword(req.user.id, String(next));
  res.json({ ok: true });
});
app.post('/api/me/profile', authRequired, (req, res) => {
  const clean = {};
  for (const [k, v] of Object.entries(req.body || {})) {
    if (typeof v === 'string' && v.trim() && k.length < 40) clean[k.slice(0, 40)] = v.trim().slice(0, 300);
  }
  Users.updateProfile(req.user.id, clean);
  res.json({ ok: true });
});

/* -------------------------------- overview -------------------------------- */
app.get('/api/overview', authRequired, (req, res) => {
  const u = req.user;
  const base = {
    courses: coursesForUser(u),
    upcoming: Sessions.upcomingForUser(u).slice(0, 6),
    announcements: Announcements.forUser(u).slice(0, 5),
  };
  if (u.role === 'admin' || u.role === 'coordinator') {
    return res.json({ ...base, admin: Admin.overview(), leaderboard: studentLeaderboard().slice(0, 10) });
  }
  if (u.role === 'instructor') {
    const pending = base.courses.reduce((sum, b) => {
      return sum + Assignments.forBatch(b.id).reduce((s2, a) => s2 + Submissions.forAssignment(a.id).filter((x) => x.grade == null).length, 0);
    }, 0);
    return res.json({ ...base, teaching: { pending_to_grade: pending }, leaderboard: studentLeaderboard().slice(0, 10) });
  }
  if (u.role === 'free') {
    const mine = Challenges.mine(u.id);
    const open = Challenges.all().filter((c) => c.open);
    return res.json({
      ...base, gamify: gamifyFor(u), leaderboard: studentLeaderboard().slice(0, 10),
      free: { open_challenges: open.length, solved: Object.values(mine).filter((s) => s.status === 'approved').length },
    });
  }
  res.json({ ...base, gamify: gamifyFor(u), leaderboard: studentLeaderboard().slice(0, 10) });
});

/* ------------------------------ leaderboards ------------------------------ */
app.get('/api/leaderboard', authRequired, (req, res) => {
  res.json({ students: studentLeaderboard().slice(0, 50), courses: courseLeaderboard() });
});
app.get('/api/batches/:id/leaderboard', authRequired, viewBatch, (req, res) => {
  res.json({ leaderboard: batchLeaderboard(req.batch.id) });
});

/* ------------------------------ course detail ------------------------------ */
app.get('/api/batches/:id', authRequired, viewBatch, (req, res) => {
  const b = Batches.decorate(req.batch);
  const u = req.user;
  const assignments = Assignments.forBatch(b.id).map((a) => ({ ...a, submissions_count: Submissions.countForAssignment(a.id) }));
  const out = {
    batch: b,
    sessions: Sessions.forBatch(b.id),
    lessons: Lessons.forBatch(b.id),
    assignments,
    announcements: Announcements.forUser(u).filter((a) => a.batch_id === b.id),
    can_manage: canManageBatch(u, req.batch),
    leaderboard: batchLeaderboard(b.id).slice(0, 10),
  };
  if (u.role === 'student') {
    out.my_submissions = Submissions.forStudent(u.id, assignments.map((a) => a.id));
    out.my_gems_here = gemsForStudentInBatch(u.id, b.id);
  }
  if (['admin', 'coordinator', 'instructor'].includes(u.role)) {
    out.students = Enrollments.studentsForBatch(b.id).map((s) => ({ id: s.id, name: s.name, username: s.username, reg_no: s.reg_no, email: s.email }));
    out.report = courseReport(b.id);
  }
  res.json(out);
});

/* --------------------------- catalogue (admin) --------------------------- */
app.get('/api/admin/catalogue', authRequired, staffView, (req, res) => {
  res.json({ courses: Courses.all(), batches: Batches.all(), teachers: Users.all().filter((u) => u.role === 'instructor') });
});
app.post('/api/admin/courses', authRequired, adminRequired, (req, res) => {
  const { code, title, tier, level, weeks, hours, price_pkr, summary } = req.body || {};
  if (!title) return res.status(400).json({ error: 'A course title is required.' });
  const id = Courses.create({ code: code || null, title, tier: tier || null, level: level || null, weeks: Number(weeks) || null, hours: Number(hours) || null, price_pkr: Number(price_pkr) || null, summary: summary || null });
  res.json({ ok: true, id });
});
app.delete('/api/admin/courses/:id', authRequired, adminRequired, (req, res) => { Courses.remove(req.params.id); res.json({ ok: true }); });
app.post('/api/admin/batches', authRequired, adminRequired, (req, res) => {
  const { course_id, name, start_date } = req.body || {};
  if (!Courses.byId(course_id)) return res.status(400).json({ error: 'Choose a course from the catalogue.' });
  if (!name || !start_date) return res.status(400).json({ error: 'A cohort name and start date are required.' });
  const b = Batches.create({ course_id, name, start_date });
  res.json({ ok: true, batch: Batches.decorate(b) });
});
app.delete('/api/admin/batches/:id', authRequired, adminRequired, (req, res) => { Batches.remove(req.params.id); res.json({ ok: true }); });

/* ------------------------- people on a course (admin) ------------------------- */
// Add students: new by name (credentials generated) or existing by reg no / username.
app.post('/api/batches/:id/students', authRequired, adminRequired, (req, res) => {
  const b = Batches.byId(req.params.id);
  if (!b) return res.status(404).json({ error: 'Course not found.' });
  const { names, existing } = req.body || {};
  const created = [], added = [], missing = [];
  for (const raw of Array.isArray(names) ? names : []) {
    const name = String(raw).trim(); if (!name) continue;
    const { user, password } = Users.create({ name, role: 'student' });
    Enrollments.create(user.id, b.id);
    created.push({ name: user.name, username: user.username, reg_no: user.reg_no, password });
  }
  for (const raw of Array.isArray(existing) ? existing : []) {
    const u = Users.byLogin(String(raw).trim());
    if (u && u.role === 'student') { Enrollments.create(u.id, b.id); added.push({ name: u.name, reg_no: u.reg_no }); }
    else missing.push(String(raw).trim());
  }
  res.json({ ok: true, created, added, missing });
});
app.delete('/api/batches/:id/students/:uid', authRequired, adminRequired, (req, res) => {
  Enrollments.remove(req.params.uid, req.params.id); res.json({ ok: true });
});
// Teachers: several per course. Add a new teacher by name, or an existing one by id/username.
app.post('/api/batches/:id/teachers', authRequired, adminRequired, (req, res) => {
  const b = Batches.byId(req.params.id);
  if (!b) return res.status(404).json({ error: 'Course not found.' });
  const { name, existing } = req.body || {};
  if (existing) {
    const u = /^\d+$/.test(String(existing)) ? Users.byId(existing) : Users.byLogin(String(existing));
    if (!u || u.role !== 'instructor') return res.status(400).json({ error: 'No teacher found for that name or username.' });
    Batches.addTeacher(b.id, u.id);
    return res.json({ ok: true, teacher: { id: u.id, name: u.name } });
  }
  if (!name || !String(name).trim()) return res.status(400).json({ error: 'A teacher name is required.' });
  const { user, password } = Users.create({ name: String(name).trim(), role: 'instructor' });
  Batches.addTeacher(b.id, user.id);
  res.json({ ok: true, teacher: { id: user.id, name: user.name }, credentials: { username: user.username, password } });
});
app.delete('/api/batches/:id/teachers/:uid', authRequired, adminRequired, (req, res) => {
  Batches.removeTeacher(req.params.id, req.params.uid); res.json({ ok: true });
});

/* ------------------------------ users (admin) ------------------------------ */
app.get('/api/admin/users', authRequired, staffView, (req, res) => {
  res.json({
    users: Users.all().map((u) => ({
      id: u.id, name: u.name, role: u.role, username: u.username, email: u.email, reg_no: u.reg_no,
      gems: u.role === 'student' ? totalGemsForStudent(u.id) : null,
      courses: coursesForUser(u).map((b) => b.title || b.name).slice(0, 4),
    })),
  });
});
// Password reset without losing the account: set a chosen password or generate one.
app.post('/api/admin/users/:id/password', authRequired, adminRequired, (req, res) => {
  const target = Users.byId(req.params.id);
  if (!target) return res.status(404).json({ error: 'User not found.' });
  const { password } = req.body || {};
  if (password) {
    if (String(password).length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters.' });
    Users.setPassword(target.id, String(password));
    return res.json({ ok: true, username: target.username, password: String(password) });
  }
  const out = Users.resetPassword(target.id);
  res.json({ ok: true, username: out.user.username, password: out.password });
});
app.post('/api/admin/coordinators', authRequired, adminRequired, (req, res) => {
  const { name, email } = req.body || {};
  if (!name || !String(name).trim()) return res.status(400).json({ error: 'A name is required.' });
  const { user, password } = Users.create({ name: String(name).trim(), role: 'coordinator', email: isEmail(email) ? email : null });
  res.json({ ok: true, credentials: { name: user.name, username: user.username, password } });
});
app.delete('/api/admin/users/:id', authRequired, adminRequired, (req, res) => {
  if (Number(req.params.id) === req.user.id) return res.status(400).json({ error: 'You cannot remove your own account.' });
  Users.remove(req.params.id); res.json({ ok: true });
});

/* ------------------------- sessions / lessons / work ------------------------- */
app.post('/api/batches/:id/sessions', authRequired, manageBatch, (req, res) => {
  const { week_no, title, session_date, start_time, end_time, join_url } = req.body || {};
  if (!title || !session_date) return res.status(400).json({ error: 'A title and date are required.' });
  const s = Sessions.create({ batch_id: req.batch.id, week_no: Number(week_no) || null, title, session_date, start_time: start_time || null, end_time: end_time || null, join_url: join_url || null });
  res.json({ ok: true, session: s });
});
app.delete('/api/sessions/:id', authRequired, (req, res) => {
  const s = store.allData().sessions.find((x) => x.id === Number(req.params.id));
  if (!s) return res.status(404).json({ error: 'Class not found.' });
  if (!canManageBatch(req.user, Batches.byId(s.batch_id))) return res.status(403).json({ error: 'You cannot manage this course.' });
  Sessions.remove(s.id); res.json({ ok: true });
});
app.post('/api/batches/:id/lessons', authRequired, manageBatch, upload.single('file'), (req, res) => {
  const { week_no, title, type, url } = req.body || {};
  if (!title) return res.status(400).json({ error: 'A title is required.' });
  const fileUrl = req.file ? `/uploads/${req.file.filename}` : (url || null);
  if (!fileUrl) return res.status(400).json({ error: 'Attach a file or provide a link.' });
  const l = Lessons.create({ course_id: req.batch.course_id, batch_id: req.batch.id, week_no: Number(week_no) || null, title, type: type || 'resource', url: fileUrl, position: 0 });
  res.json({ ok: true, lesson: l });
});
app.delete('/api/lessons/:id', authRequired, (req, res) => {
  const l = store.allData().lessons.find((x) => x.id === Number(req.params.id));
  if (!l) return res.status(404).json({ error: 'Content not found.' });
  if (!canManageBatch(req.user, Batches.byId(l.batch_id))) return res.status(403).json({ error: 'You cannot manage this course.' });
  Lessons.remove(l.id); res.json({ ok: true });
});
app.post('/api/batches/:id/assignments', authRequired, manageBatch, upload.single('file'), (req, res) => {
  const { title, description, due_date, points } = req.body || {};
  if (!title) return res.status(400).json({ error: 'A title is required.' });
  const a = Assignments.create({
    batch_id: req.batch.id, title, description: description || null, due_date: due_date || null,
    points: Math.max(10, Math.min(1000, Number(points) || 100)),
    file_url: req.file ? `/uploads/${req.file.filename}` : null, created_by: req.user.id,
  });
  res.json({ ok: true, assignment: a });
});
app.delete('/api/assignments/:id', authRequired, (req, res) => {
  const a = Assignments.byId(req.params.id);
  if (!a) return res.status(404).json({ error: 'Assignment not found.' });
  if (!canManageBatch(req.user, Batches.byId(a.batch_id))) return res.status(403).json({ error: 'You cannot manage this course.' });
  Assignments.remove(a.id); res.json({ ok: true });
});

/* ------------------------------- submissions ------------------------------- */
app.post('/api/assignments/:id/submit', authRequired, upload.single('file'), (req, res) => {
  if (req.user.role !== 'student') return res.status(403).json({ error: 'Only students submit assignments.' });
  const a = Assignments.byId(req.params.id);
  if (!a) return res.status(404).json({ error: 'Assignment not found.' });
  if (!canViewBatch(req.user, Batches.byId(a.batch_id))) return res.status(403).json({ error: 'You are not on this course.' });
  if (!requireDocFile(req, res)) return;
  const s = Submissions.upsert({ assignment_id: a.id, user_id: req.user.id, file_url: `/uploads/${req.file.filename}`, note: (req.body || {}).note });
  res.json({ ok: true, submission: s });
});
app.get('/api/assignments/:id/submissions', authRequired, (req, res) => {
  const a = Assignments.byId(req.params.id);
  if (!a) return res.status(404).json({ error: 'Assignment not found.' });
  const b = Batches.byId(a.batch_id);
  const canSee = canManageBatch(req.user, b) || req.user.role === 'coordinator';
  if (!canSee) return res.status(403).json({ error: 'Not available for your role.' });
  res.json({ assignment: a, submissions: Submissions.forAssignment(a.id) });
});
app.post('/api/submissions/:id/grade', authRequired, (req, res) => {
  const s = Submissions.byId(req.params.id);
  if (!s) return res.status(404).json({ error: 'Submission not found.' });
  const a = Assignments.byId(s.assignment_id);
  if (!canManageBatch(req.user, Batches.byId(a.batch_id))) return res.status(403).json({ error: 'You cannot grade on this course.' });
  const { grade, remarks } = req.body || {};
  if (grade == null || isNaN(Number(grade))) return res.status(400).json({ error: 'Enter a grade between 0 and 100.' });
  const out = Submissions.grade(s.id, Number(grade), remarks, req.user.id);
  res.json({ ok: true, submission: out });
});

/* ------------------------------- gem awards ------------------------------- */
// Teachers/admin can award bonus gems for participation, attendance, helping peers.
app.post('/api/batches/:id/award', authRequired, manageBatch, (req, res) => {
  const { user_id, amount, reason } = req.body || {};
  const target = Users.byId(user_id);
  if (!target || target.role !== 'student') return res.status(400).json({ error: 'Choose a student on this course.' });
  const amt = Math.round(Number(amount));
  if (!amt || amt < 1 || amt > 200) return res.status(400).json({ error: 'Award between 1 and 200 gems.' });
  const ev = GemEvents.create({ user_id: target.id, batch_id: req.batch.id, amount: amt, source: 'award', note: (reason || '').slice(0, 200) || 'Teacher award', by: req.user.id });
  res.json({ ok: true, event: ev });
});

/* ------------------------------ announcements ------------------------------ */
app.get('/api/announcements', authRequired, (req, res) => res.json({ announcements: Announcements.forUser(req.user) }));
app.post('/api/batches/:id/announcements', authRequired, manageBatch, (req, res) => {
  const { title, body } = req.body || {};
  if (!title || !body) return res.status(400).json({ error: 'A title and message are required.' });
  const a = Announcements.create({ batch_id: req.batch.id, title, body }, req.user.id);
  mailer.sendAnnouncement(announcementRecipients(req.batch.id), title, body).catch(() => {});
  res.json({ ok: true, announcement: a });
});
app.post('/api/admin/announcements', authRequired, adminRequired, (req, res) => {
  const { title, body } = req.body || {};
  if (!title || !body) return res.status(400).json({ error: 'A title and message are required.' });
  const a = Announcements.create({ batch_id: null, title, body }, req.user.id);
  mailer.sendAnnouncement(announcementRecipients(null), title, body).catch(() => {});
  res.json({ ok: true, announcement: a });
});

/* ----------------------------- public profiles ----------------------------- */
app.get('/api/public/profile/:reg', (req, res) => {
  const u = Users.byReg(req.params.reg);
  if (!u || !['student', 'free'].includes(u.role)) return res.status(404).json({ error: 'No profile found for that registration number.' });
  res.json(Users.publicView(u));
});
app.get('/u/:reg', (req, res) => res.sendFile(path.join(__dirname, 'public', 'profile.html')));


/* ------------------------------ Google OAuth ------------------------------ */
// Free-tier sign-in. No extra dependencies: the standard OAuth2 code flow
// with native fetch. Configure GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and
// APP_URL (e.g. https://lms.echolens.digital) in the environment; add
// `${APP_URL}/auth/google/callback` as an authorized redirect URI in the
// Google Cloud console.
const G_ID = process.env.GOOGLE_CLIENT_ID || '';
const G_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const APP_URL = (process.env.APP_URL || `http://localhost:${PORT}`).replace(/\/$/, '');
const G_REDIRECT = `${APP_URL}/auth/google/callback`;

app.get('/api/auth/providers', (req, res) => res.json({ google: !!(G_ID && G_SECRET) }));

app.get('/auth/google', (req, res) => {
  if (!G_ID || !G_SECRET) return res.redirect('/?err=' + encodeURIComponent('Google sign-in is not configured yet.'));
  const state = jwt.sign({ n: Date.now() }, JWT_SECRET, { expiresIn: '10m' });
  const params = new URLSearchParams({
    client_id: G_ID, redirect_uri: G_REDIRECT, response_type: 'code',
    scope: 'openid email profile', state, prompt: 'select_account',
  });
  res.redirect('https://accounts.google.com/o/oauth2/v2/auth?' + params.toString());
});

app.get('/auth/google/callback', async (req, res) => {
  try {
    const { code, state } = req.query;
    jwt.verify(String(state || ''), JWT_SECRET); // CSRF protection
    if (!code) throw new Error('Sign-in was cancelled.');
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ code: String(code), client_id: G_ID, client_secret: G_SECRET, redirect_uri: G_REDIRECT, grant_type: 'authorization_code' }),
    });
    const tok = await tokenRes.json();
    if (!tokenRes.ok || !tok.access_token) throw new Error('Google sign-in failed - try again.');
    const infoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', { headers: { Authorization: `Bearer ${tok.access_token}` } });
    const info = await infoRes.json();
    if (!info.sub) throw new Error('Could not read your Google profile.');
    const u = Users.findOrCreateGoogle({ sub: info.sub, name: info.name, email: info.email });
    setAuthCookie(res, sign(u));
    res.redirect('/dashboard');
  } catch (e) {
    res.redirect('/?err=' + encodeURIComponent(e.message || 'Google sign-in failed.'));
  }
});

/* ----------------------------- AI copilot (teachers) ----------------------------- */
app.get('/api/ai/status', authRequired, (req, res) => res.json({ enabled: ai.enabled() && ['admin', 'instructor'].includes(req.user.role), provider: ai.provider(), model: ai.model() }));

app.post('/api/ai/chat', authRequired, teacherOrAdmin, async (req, res) => {
  try {
    const messages = Array.isArray(req.body?.messages) ? req.body.messages : [];
    if (!messages.length) return res.status(400).json({ error: 'Say something first.' });
    res.json({ reply: await ai.chat(req.user.id, messages) });
  } catch (e) { res.status(e.status || 500).json({ error: e.message }); }
});

app.post('/api/ai/quiz', authRequired, teacherOrAdmin, async (req, res) => {
  try {
    const { topic, content, count, level } = req.body || {};
    if (!topic) return res.status(400).json({ error: 'Give the quiz a topic.' });
    res.json({ markdown: await ai.quiz(req.user.id, { topic, content, count: Math.min(15, Number(count) || 5), level }) });
  } catch (e) { res.status(e.status || 500).json({ error: e.message }); }
});

app.post('/api/ai/outline', authRequired, teacherOrAdmin, async (req, res) => {
  try {
    const { topic, weeks, audience } = req.body || {};
    if (!topic) return res.status(400).json({ error: 'Give the course a topic.' });
    res.json({ markdown: await ai.outline(req.user.id, { topic, weeks: Math.min(24, Number(weeks) || 6), audience }) });
  } catch (e) { res.status(e.status || 500).json({ error: e.message }); }
});

// AI grade DRAFT: proposes grade + remarks for the teacher to review.
// The AI never publishes gems - only /api/submissions/:id/grade does, and
// that stays teacher-only. Student identity is never sent to the provider.
const TEXT_EXT = ['.txt', '.md', '.py', '.js', '.ts', '.html', '.css', '.json', '.ipynb', '.csv', '.sql', '.java', '.c', '.cpp'];
app.post('/api/ai/grade-draft', authRequired, teacherOrAdmin, async (req, res) => {
  try {
    const s = Submissions.byId(req.body?.submission_id);
    if (!s) return res.status(404).json({ error: 'Submission not found.' });
    const a = Assignments.byId(s.assignment_id);
    if (!canManageBatch(req.user, Batches.byId(a.batch_id))) return res.status(403).json({ error: 'You cannot grade on this course.' });
    let fileText = null, fileName = null;
    if (s.file_url) {
      fileName = path.basename(s.file_url);
      const ext = path.extname(fileName).toLowerCase();
      const full = path.join(UPLOAD_DIR, fileName);
      if (TEXT_EXT.includes(ext) && fs.existsSync(full)) {
        try { fileText = fs.readFileSync(full, 'utf8').slice(0, 60000); } catch {}
      }
    }
    const draft = await ai.gradeDraft(req.user.id, {
      assignmentTitle: a.title, assignmentBrief: a.description, points: a.points || 100,
      studentNote: s.note, fileText, fileName,
    });
    res.json({ draft, readable: !!fileText });
  } catch (e) { res.status(e.status || 500).json({ error: e.message }); }
});

/* -------------------------------- challenges -------------------------------- */
// Open challenges: the free tier's home, also open to portal students.
app.get('/api/challenges', authRequired, (req, res) => {
  const canPlay = ['free', 'student'].includes(req.user.role);
  res.json({
    challenges: Challenges.all(),
    mine: canPlay ? Challenges.mine(req.user.id) : {},
    can_play: canPlay,
    is_admin: req.user.role === 'admin',
  });
});
app.post('/api/challenges/:id/submit', authRequired, (req, res) => {
  if (!['free', 'student'].includes(req.user.role)) return res.status(403).json({ error: 'Challenges are for learners.' });
  const c = Challenges.byId(req.params.id);
  if (!c || !c.open) return res.status(404).json({ error: 'This challenge is not open.' });
  const { link, note } = req.body || {};
  if (!link || !/^https?:\/\//i.test(String(link))) return res.status(400).json({ error: 'Share a link to your work (GitHub, Colab, Drive...).' });
  res.json({ ok: true, submission: Challenges.submit({ challenge_id: c.id, user_id: req.user.id, link: String(link).slice(0, 400), note }) });
});
app.post('/api/admin/challenges', authRequired, adminRequired, (req, res) => {
  const { title, description, difficulty, gems, due_date } = req.body || {};
  if (!title) return res.status(400).json({ error: 'A challenge title is required.' });
  res.json({ ok: true, challenge: Challenges.create({ title, description, difficulty, gems, due_date }, req.user.id) });
});
app.post('/api/admin/challenges/:id/open', authRequired, adminRequired, (req, res) => {
  const c = Challenges.setOpen(req.params.id, !!req.body?.open);
  if (!c) return res.status(404).json({ error: 'Challenge not found.' });
  res.json({ ok: true, challenge: c });
});
app.delete('/api/admin/challenges/:id', authRequired, adminRequired, (req, res) => { Challenges.remove(req.params.id); res.json({ ok: true }); });
app.get('/api/admin/challenges/:id/submissions', authRequired, staffView, (req, res) => {
  res.json({ challenge: Challenges.byId(req.params.id), submissions: Challenges.submissionsFor(req.params.id) });
});
app.post('/api/challenge-submissions/:id/review', authRequired, adminRequired, (req, res) => {
  const { approve, remarks, gems } = req.body || {};
  const s = Challenges.review(req.params.id, { approve: !!approve, remarks, gems }, req.user.id);
  if (!s) return res.status(404).json({ error: 'Submission not found.' });
  res.json({ ok: true, submission: s });
});


/* -------------------------------- hackathons -------------------------------- */
app.get('/api/hackathons', authRequired, (req, res) => {
  const list = Hackathons.all().map((h) => {
    const entry = Hackathons.entryFor(h.id, req.user.id);
    return { ...h, my_entry: entry ? { team_name: entry.team_name, payment_status: entry.payment_status } : null };
  });
  res.json({ hackathons: list, can_play: ['free', 'student'].includes(req.user.role), is_admin: req.user.role === 'admin' });
});
app.get('/api/hackathons/:id', authRequired, (req, res) => {
  const h = Hackathons.byId(req.params.id);
  if (!h) return res.status(404).json({ error: 'Hackathon not found.' });
  const full = Hackathons.all().find((x) => x.id === h.id);
  const entry = Hackathons.entryFor(h.id, req.user.id);
  res.json({
    hackathon: full,
    board: Hackathons.board(h.id),
    my_entry: entry || null,
    entries: ['admin', 'coordinator'].includes(req.user.role) ? Hackathons.entries(h.id) : undefined,
  });
});
app.post('/api/admin/hackathons', authRequired, adminRequired, (req, res) => {
  const { title, starts_at, ends_at } = req.body || {};
  if (!title || !starts_at || !ends_at) return res.status(400).json({ error: 'Title, start, and end are required.' });
  res.json({ ok: true, hackathon: Hackathons.create(req.body, req.user.id) });
});
app.delete('/api/admin/hackathons/:id', authRequired, adminRequired, (req, res) => { Hackathons.remove(req.params.id); res.json({ ok: true }); });
app.post('/api/hackathons/:id/register', authRequired, (req, res) => {
  if (!['free', 'student'].includes(req.user.role)) return res.status(403).json({ error: 'Events are for learners.' });
  const { team_name, member_regs, payment_ref } = req.body || {};
  const out = Hackathons.register({ hackathon_id: req.params.id, user: req.user, team_name, member_regs: Array.isArray(member_regs) ? member_regs : [], payment_ref });
  if (out.error) return res.status(400).json({ error: out.error });
  res.json({ ok: true, ...out });
});
app.post('/api/hackathons/:id/submit', authRequired, (req, res) => {
  if (!['free', 'student'].includes(req.user.role)) return res.status(403).json({ error: 'Events are for learners.' });
  const { link, note } = req.body || {};
  if (!link || !/^https?:\/\//i.test(String(link))) return res.status(400).json({ error: 'Share a public link to your project.' });
  const out = Hackathons.submit({ hackathon_id: req.params.id, user: req.user, link: String(link).slice(0, 400), note });
  if (out.error) return res.status(400).json({ error: out.error });
  res.json({ ok: true, ...out });
});
app.post('/api/admin/hackathon-entries/:id/payment', authRequired, adminRequired, (req, res) => {
  const e = Hackathons.confirmPayment(req.params.id, !!req.body?.confirm, req.user.id);
  if (!e) return res.status(404).json({ error: 'Entry not found.' });
  res.json({ ok: true, entry: e });
});
app.post('/api/admin/hackathon-submissions/:id/score', authRequired, adminRequired, (req, res) => {
  const { score, remarks } = req.body || {};
  if (score == null || isNaN(Number(score))) return res.status(400).json({ error: 'Score 0-100 required.' });
  const s = Hackathons.score(req.params.id, score, remarks, req.user.id);
  if (!s) return res.status(404).json({ error: 'Submission not found.' });
  res.json({ ok: true, submission: s });
});
app.post('/api/admin/hackathons/:id/finalize', authRequired, adminRequired, (req, res) => {
  const out = Hackathons.finalize(req.params.id, req.user.id);
  if (out.error) return res.status(400).json({ error: out.error });
  res.json({ ok: true, ...out });
});

/* ------------------------- AI skill reports & analytics ------------------------- */
app.post('/api/ai/skill-report', authRequired, teacherOrAdmin, async (req, res) => {
  try {
    const { user_id, batch_id } = req.body || {};
    const b = Batches.byId(batch_id);
    if (!b || !canManageBatch(req.user, b)) return res.status(403).json({ error: 'You cannot manage this course.' });
    const report = courseReport(b.id);
    const row = report.students.find((s) => s.id === Number(user_id));
    if (!row) return res.status(404).json({ error: 'Student not on this course.' });
    // Anonymized per-assignment detail: titles + grades + remarks, never the name.
    const detail = report.assignments.map((a) => {
      const sub = store.allData().submissions.find((x) => x.assignment_id === a.id && x.user_id === row.id);
      return `- ${a.title}: ${sub ? (sub.grade != null ? sub.grade + '%' + (sub.remarks ? ' - teacher said: ' + sub.remarks : '') : 'submitted, ungraded') : 'NOT SUBMITTED'}`;
    }).join('\n');
    const performance = `Average grade: ${row.avg != null ? row.avg + '%' : 'n/a'}. Submitted ${row.submitted}/${row.total_assignments}. Gems in course: ${row.gems}. Activity streak: ${row.streak} days.\nAssignments:\n${detail}`;
    const markdown = await ai.skillReport(req.user.id, { courseTitle: report.batch.title || report.batch.name, performance });
    const rec = AiReports.create({ user_id: row.id, batch_id: b.id, markdown }, req.user.id);
    res.json({ ok: true, report: rec });
  } catch (e) { res.status(e.status || 500).json({ error: e.message }); }
});
app.post('/api/ai-reports/:id/publish', authRequired, teacherOrAdmin, (req, res) => {
  const r = AiReports.byId(req.params.id);
  if (!r || !canManageBatch(req.user, Batches.byId(r.batch_id))) return res.status(403).json({ error: 'Not your course.' });
  res.json({ ok: true, report: AiReports.publish(r.id) });
});
app.delete('/api/ai-reports/:id', authRequired, teacherOrAdmin, (req, res) => {
  const r = AiReports.byId(req.params.id);
  if (!r || !canManageBatch(req.user, Batches.byId(r.batch_id))) return res.status(403).json({ error: 'Not your course.' });
  AiReports.remove(r.id); res.json({ ok: true });
});
app.get('/api/batches/:id/reports', authRequired, viewBatch, staffView, (req, res) => res.json({ reports: AiReports.forBatch(req.batch.id) }));
app.get('/api/me/reports', authRequired, (req, res) => res.json({ reports: AiReports.publishedFor(req.user.id) }));
app.post('/api/ai/class-summary', authRequired, teacherOrAdmin, async (req, res) => {
  try {
    const b = Batches.byId(req.body?.batch_id);
    if (!b || !canManageBatch(req.user, b)) return res.status(403).json({ error: 'You cannot manage this course.' });
    const r = courseReport(b.id);
    const table = r.students.map((s, i) => `Row ${i + 1}: avg ${s.avg ?? 'n/a'}%, submitted ${s.submitted}/${s.total_assignments}, missing ${s.missing}, inactive ${s.inactive_days ?? '?'}d, at-risk: ${s.at_risk}`).join('\n');
    res.json({ markdown: await ai.classSummary(req.user.id, { courseTitle: r.batch.title || r.batch.name, table }) });
  } catch (e) { res.status(e.status || 500).json({ error: e.message }); }
});

/* --------------------------------- backups --------------------------------- */
app.get('/api/admin/backup', authRequired, adminRequired, (req, res) => {
  store.backupNow();
  res.download(store.DB_PATH, `echolens-backup-${new Date().toISOString().slice(0, 10)}.json`);
});
store.backupNow(); // one on boot
setInterval(() => store.backupNow(), 12 * 3600 * 1000); // and every 12 hours


/* ---------------------------------- quests ---------------------------------- */
app.get('/api/tracks', authRequired, staffView, (req, res) => res.json({ tracks: Quests.tracks() }));
app.post('/api/batches/:id/install-track', authRequired, manageBatch, (req, res) => {
  const out = Quests.install(req.batch.id, req.body?.track);
  if (out.error) return res.status(400).json({ error: out.error });
  res.json(out);
});
app.delete('/api/batches/:id/track', authRequired, adminRequired, (req, res) => {
  Quests.uninstall(req.params.id); res.json({ ok: true });
});
app.get('/api/batches/:id/quest', authRequired, viewBatch, (req, res) => {
  if (!Quests.installed(req.batch.id)) return res.json({ installed: false, tracks: ['admin', 'instructor'].includes(req.user.role) ? Quests.tracks() : [] });
  const isStudent = req.user.role === 'student';
  const rawProgress = Quests.progress(isStudent ? req.user.id : 0, req.batch.id);
  const stripSolutions = (prog) => ({
    ...prog,
    levels: prog.levels.map((l) => ({
      ...l,
      quest: { ...l.quest, problems: l.quest.problems.map(({ solution, ...rest }) => rest) },
    })),
  });
  const progress = isStudent ? stripSolutions(rawProgress) : rawProgress;
  res.json({
    installed: true,
    progress: isStudent ? progress : { ...progress, levels: progress.levels.map((l) => ({ ...l, unlocked: true })) }, // staff and admin see every level and solution, no gating
    my_subs: isStudent ? Quests.mySubs(req.user.id, req.batch.id) : {},
    scoreboard: Quests.scoreboard(req.batch.id),
    can_manage: canManageBatch(req.user, req.batch),
    pending: ['admin', 'coordinator', 'instructor'].includes(req.user.role) ? Quests.pendingCount(req.batch.id) : undefined,
    me: isStudent ? { id: req.user.id } : null,
  });
});
app.post('/api/quests/:qid/problems/:pid/submit', authRequired, upload.single('file'), (req, res) => {
  if (req.user.role !== 'student') return res.status(403).json({ error: 'Only students submit quest problems.' });
  const q = Quests.byId(req.params.qid);
  if (!q) return res.status(404).json({ error: 'Level not found.' });
  if (!canViewBatch(req.user, Batches.byId(q.batch_id))) return res.status(403).json({ error: 'You are not on this course.' });
  const p = q.problems.find((x) => x.pid === Number(req.params.pid));
  if (!p) return res.status(404).json({ error: 'Problem not found.' });
  // HARD GATE: the level must be unlocked for this student.
  const prog = Quests.progress(req.user.id, q.batch_id);
  const lvl = prog.levels.find((l) => l.quest.id === q.id);
  if (!lvl || !lvl.unlocked) return res.status(403).json({ error: 'This level is locked - pass the previous level first.' });
  if (!requireDocFile(req, res)) return;
  const s = Quests.submit({ quest_id: q.id, pid: p.pid, user_id: req.user.id, file_url: `/uploads/${req.file.filename}`, note: (req.body || {}).note });
  res.json({ ok: true, submission: s });
});
app.get('/api/quests/:qid/submissions', authRequired, (req, res) => {
  const q = Quests.byId(req.params.qid);
  if (!q) return res.status(404).json({ error: 'Level not found.' });
  const b = Batches.byId(q.batch_id);
  if (!(canManageBatch(req.user, b) || req.user.role === 'coordinator')) return res.status(403).json({ error: 'Not available for your role.' });
  res.json({ quest: q, submissions: Quests.submissionsFor(q.id) });
});
app.post('/api/quest-submissions/:id/grade', authRequired, (req, res) => {
  const s = Quests.subById(req.params.id);
  if (!s) return res.status(404).json({ error: 'Submission not found.' });
  const q = Quests.byId(s.quest_id);
  if (!canManageBatch(req.user, Batches.byId(q.batch_id))) return res.status(403).json({ error: 'You cannot grade on this course.' });
  const { grade, remarks } = req.body || {};
  if (grade == null || isNaN(Number(grade))) return res.status(400).json({ error: 'Enter a grade between 0 and 100.' });
  res.json({ ok: true, submission: Quests.grade(s.id, Number(grade), remarks, req.user.id) });
});
// AI draft for quest submissions - same rules: draft only, teacher publishes.
app.post('/api/ai/quest-grade-draft', authRequired, teacherOrAdmin, async (req, res) => {
  try {
    const s = Quests.subById(req.body?.submission_id);
    if (!s) return res.status(404).json({ error: 'Submission not found.' });
    const q = Quests.byId(s.quest_id);
    if (!canManageBatch(req.user, Batches.byId(q.batch_id))) return res.status(403).json({ error: 'You cannot grade on this course.' });
    const p = q.problems.find((x) => x.pid === s.pid) || {};
    let fileText = null, fileName = null;
    if (s.file_url) {
      fileName = path.basename(s.file_url);
      const ext = path.extname(fileName).toLowerCase();
      const full = path.join(UPLOAD_DIR, fileName);
      if (TEXT_EXT.includes(ext) && fs.existsSync(full)) { try { fileText = fs.readFileSync(full, 'utf8').slice(0, 60000); } catch {} }
    }
    const draft = await ai.gradeDraft(req.user.id, {
      assignmentTitle: `${q.title} - ${p.title}`, assignmentBrief: p.description, points: p.points || 100,
      studentNote: s.note, fileText, fileName,
    });
    res.json({ draft, readable: !!fileText });
  } catch (e) { res.status(e.status || 500).json({ error: e.message }); }
});


/* --------------------------- quest problem editing --------------------------- */
app.patch('/api/quests/:qid/problems/:pid', authRequired, (req, res) => {
  const q = Quests.byId(req.params.qid);
  if (!q) return res.status(404).json({ error: 'Level not found.' });
  if (!canManageBatch(req.user, Batches.byId(q.batch_id))) return res.status(403).json({ error: 'You cannot edit this course.' });
  const p = Quests.updateProblem(q.id, req.params.pid, req.body || {});
  if (!p) return res.status(404).json({ error: 'Problem not found.' });
  res.json({ ok: true, problem: p });
});
app.patch('/api/quests/:qid', authRequired, (req, res) => {
  const q = Quests.byId(req.params.qid);
  if (!q) return res.status(404).json({ error: 'Level not found.' });
  if (!canManageBatch(req.user, Batches.byId(q.batch_id))) return res.status(403).json({ error: 'You cannot edit this course.' });
  res.json({ ok: true, quest: Quests.updateLevel(q.id, req.body || {}) });
});

/* ----------------------- AI review layer (teacher-only) ----------------------- */
// Summarizes the question + student solution, lists mistakes, a better
// approach, key concepts grasped, and a suggested score. Cached per
// submission. The instructor ALWAYS decides the final score.
app.post('/api/ai/review', authRequired, teacherOrAdmin, async (req, res) => {
  try {
    const { kind, submission_id, force } = req.body || {};
    let sub, problemTitle, problemBrief, points, solutionGuideline, batchId;
    if (kind === 'quest') {
      sub = Quests.subById(submission_id);
      if (!sub) return res.status(404).json({ error: 'Submission not found.' });
      const q = Quests.byId(sub.quest_id);
      batchId = q.batch_id;
      const p = q.problems.find((x) => x.pid === sub.pid) || {};
      problemTitle = `${q.title} - ${p.title}`; problemBrief = p.description; points = p.points || 100; solutionGuideline = p.solution || null;
    } else {
      sub = Submissions.byId(submission_id);
      if (!sub) return res.status(404).json({ error: 'Submission not found.' });
      const a = Assignments.byId(sub.assignment_id);
      batchId = a.batch_id;
      problemTitle = a.title; problemBrief = a.description; points = a.points || 100; solutionGuideline = null;
    }
    if (!canManageBatch(req.user, Batches.byId(batchId))) return res.status(403).json({ error: 'You cannot grade on this course.' });
    if (sub.ai_review && !force) return res.json({ review: sub.ai_review, cached: true });
    const { text, name } = await extractText(sub.file_url);
    const review = await ai.review(req.user.id, {
      problemTitle, problemBrief, points, solutionGuideline,
      studentNote: sub.note, fileText: text, fileName: name,
    });
    review.readable = !!text;
    sub.ai_review = review;
    store.persist(); // cache the review on the submission record
    res.json({ review, cached: false });
  } catch (e) { res.status(e.status || 500).json({ error: e.message }); }
});

/* ---------------------------- official catalogue ---------------------------- */
app.post('/api/admin/catalogue/load-official', authRequired, adminRequired, (req, res) => {
  res.json({ ok: true, ...store.loadOfficialCatalogue() });
});

/* --------------------------------- static --------------------------------- */
app.use('/uploads', authGate, express.static(UPLOAD_DIR));
function authGate(req, res, next) { if (!currentUser(req)) return res.status(401).send('Sign in to view files.'); next(); }
app.use(express.static(path.join(__dirname, 'public')));
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'login.html')));
app.get('/dashboard', (req, res) => res.sendFile(path.join(__dirname, 'public', 'dashboard.html')));

app.use((err, req, res, next) => {
  if (err) return res.status(400).json({ error: err.message || 'Something went wrong.' });
  next();
});

app.listen(PORT, () => console.log(`EchoLens LMS v4 running on http://localhost:${PORT}`));
