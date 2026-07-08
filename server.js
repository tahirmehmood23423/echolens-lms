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
  Users, Courses, Batches, Enrollments, Sessions, Lessons, Assignments, Submissions, Announcements, Admin, GemEvents, Challenges, Hackathons, AiReports, Quests, Chat, officialCatalogue,
  LiveClasses, Attendance, Quizzes, Certificates, Settings, TaskFiles, riskReport, fullStudentProfile,
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
    avatar: u.avatar || null, signature: u.signature || null,
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
    const pending = base.courses.reduce((sum, b) => sum + Quests.pendingCount(b.id), 0);
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
  const out = {
    batch: b,
    sessions: Sessions.forBatch(b.id),
    lessons: Lessons.forBatch(b.id),
    announcements: Announcements.forUser(u).filter((a) => a.batch_id === b.id),
    can_manage: canManageBatch(u, req.batch),
    leaderboard: batchLeaderboard(b.id).slice(0, 10),
  };
  if (u.role === 'student') {
    out.my_gems_here = gemsForStudentInBatch(u.id, b.id);
  }
  if (['admin', 'coordinator', 'instructor'].includes(u.role)) {
    out.students = Enrollments.studentsForBatch(b.id).map((s) => ({ id: s.id, name: s.name, username: s.username, reg_no: s.reg_no, email: s.email, avatar: s.avatar || null }));
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
    // Each line: "Full Name" or "Full Name, email@domain" - with an email,
    // the credentials (username, password, registration number) are mailed.
    const parts = String(raw).split(',').map((x) => x.trim());
    const name = parts[0]; if (!name) continue;
    const email = parts[1] && isEmail(parts[1]) ? parts[1] : null;
    const { user, password } = Users.create({ name, role: 'student', email });
    Enrollments.create(user.id, b.id);
    created.push({ name: user.name, username: user.username, reg_no: user.reg_no, password, email, emailed: !!(email && mailer.configured) });
    if (email) {
      const bd = Batches.decorate(b);
      mailer.notify(email, 'Welcome to EchoLens - your account',
        `Hi ${user.name},\n\nYour EchoLens account is ready for ${bd.title || bd.name}.\n\nRegistration number: ${user.reg_no}\nUsername: ${user.username}\nPassword: ${password}\n\nSign in at ${APP_URL} and change your password from Profile after your first login.`);
    }
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
/* -------------------------- assignments (removed) -------------------------- */
// The quest system is the assignment system. Legacy assignment data stays in
// the database (gems and history are preserved) but is no longer surfaced,
// and no new assignments or assignment submissions can be created.

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

/* ------------------------------- course chat ------------------------------- */
// In-course Q&A. Students pick per message: real name or anonymous gem
// alias (stable per course). The API never reveals who an anonymous poster
// is - not even to teachers. Staff replies are always named.
// Everyone taggable in this course: teachers + enrolled students (names only).
function chatMembers(batch) {
  const teachers = (batch.instructor_ids || []).map((tid) => Users.byId(tid)).filter(Boolean)
    .map((u) => ({ id: u.id, name: u.name, role: 'instructor' }));
  const students = Enrollments.studentsForBatch(batch.id).map((u) => ({ id: u.id, name: u.name, role: 'student' }));
  return [...teachers, ...students];
}
app.get('/api/batches/:id/chat', authRequired, viewBatch, (req, res) => {
  res.json({
    messages: Chat.forBatch(req.batch.id, req.user),
    my_alias: ['student', 'free'].includes(req.user.role) ? Chat.myAlias(req.user.id, req.batch.id) : null,
    can_moderate: canManageBatch(req.user, req.batch) || req.user.role === 'admin',
    members: chatMembers(req.batch), // for @-tagging
  });
});
app.post('/api/batches/:id/chat', authRequired, viewBatch, (req, res) => {
  const body = String((req.body || {}).body || '').trim();
  if (!body) return res.status(400).json({ error: 'Write a message first.' });
  if (body.length > 2000) return res.status(400).json({ error: 'Keep messages under 2000 characters.' });
  // Resolve @mentions server-side against real course members. Students can
  // tag their teacher; teachers can tag any student. Longest names first so
  // "@Ali Raza" beats "@Ali".
  const members = chatMembers(req.batch).sort((a, b) => b.name.length - a.name.length);
  const mentions = [];
  for (const mem of members) {
    if (mem.id === req.user.id) continue;
    if (new RegExp('@' + mem.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i').test(body) && !mentions.some((x) => x.id === mem.id)) {
      mentions.push({ id: mem.id, name: mem.name, role: mem.role });
    }
  }
  const anonymous = !!(req.body || {}).anonymous && !mentions.length; // tagging someone reveals you - no anonymous tags
  const m = Chat.post({ batch_id: req.batch.id, user: req.user, body, anonymous, mentions });
  // Email the tagged people so nothing gets missed.
  const bd = Batches.decorate(req.batch);
  const mails = mentions.map((x) => (Users.byId(x.id) || {}).email).filter(Boolean);
  if (mails.length) {
    mailer.notify(mails, `You were tagged in ${bd.title || bd.name} chat`,
      `${req.user.name} tagged you in the course chat of ${bd.title || bd.name}:\n\n"${body.slice(0, 400)}"\n\nOpen the course chat to reply: ${APP_URL}/dashboard`);
  }
  res.json({ ok: true, message: m });
});
// v11: messages are permanent for learners - only course staff or the admin
// can remove a message (moderation), so conversations cannot be scrubbed.
app.delete('/api/chat/:id', authRequired, (req, res) => {
  const m = Chat.byId(req.params.id);
  if (!m) return res.status(404).json({ error: 'Message not found.' });
  const b = Batches.byId(m.batch_id);
  if (!(canManageBatch(req.user, b) || req.user.role === 'admin')) return res.status(403).json({ error: 'Messages cannot be deleted. Only course staff can moderate the chat.' });
  Chat.remove(m.id); res.json({ ok: true });
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
  if (!G_ID || !G_SECRET) return res.redirect('/login?err=' + encodeURIComponent('Google sign-in is not configured yet.'));
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
    res.redirect('/login?err=' + encodeURIComponent(e.message || 'Google sign-in failed.'));
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

const TEXT_EXT = ['.txt', '.md', '.py', '.js', '.ts', '.html', '.css', '.json', '.ipynb', '.csv', '.sql', '.java', '.c', '.cpp'];
// Prefer the code a student wrote in the built-in editor; fall back to
// extracting text from an uploaded file.
async function submissionText(sub) {
  if (sub.code) {
    const ext = sub.language === 'python' ? 'py' : 'txt';
    return { text: String(sub.code).slice(0, 60000), name: `submission.${ext}` };
  }
  return extractText(sub.file_url);
}

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
// Per-problem performance lines for one student on one course, built from
// quest submissions. Includes teacher remarks and (teacher-side only) the
// AI review's noted mistakes, so course/overall reports synthesize both.
function questPerformanceDetail(bid, uid) {
  const quests = Quests.forBatch(bid);
  const subs = store.allData().quest_submissions;
  const lines = [];
  for (const q of quests) {
    for (const p of q.problems) {
      const sub = subs.find((x) => x.quest_id === q.id && x.pid === p.pid && x.user_id === Number(uid));
      let line = `- L${q.no} "${p.title}" (${p.difficulty}): `;
      if (!sub) line += 'NOT SUBMITTED';
      else if (sub.grade == null) line += 'submitted, ungraded';
      else {
        line += `${sub.grade}%`;
        if (sub.remarks) line += ` - teacher said: ${String(sub.remarks).slice(0, 200)}`;
        if (sub.ai_review && sub.ai_review.mistakes) line += ` - review noted: ${String(sub.ai_review.mistakes).replace(/\n/g, '; ').slice(0, 200)}`;
      }
      lines.push(line);
    }
  }
  return lines.join('\n');
}
app.post('/api/ai/skill-report', authRequired, teacherOrAdmin, async (req, res) => {
  try {
    const { user_id, batch_id } = req.body || {};
    const b = Batches.byId(batch_id);
    if (!b || !canManageBatch(req.user, b)) return res.status(403).json({ error: 'You cannot manage this course.' });
    const report = courseReport(b.id);
    const row = report.students.find((s) => s.id === Number(user_id));
    if (!row) return res.status(404).json({ error: 'Student not on this course.' });
    const performance = `Average grade: ${row.avg != null ? row.avg + '%' : 'n/a'}. Submitted ${row.submitted}/${row.total_assignments} tasks. Level ${row.level}/${row.of_levels}. Gems in course: ${row.gems}. Activity streak: ${row.streak} days.\nTasks:\n${questPerformanceDetail(b.id, row.id)}`;
    const markdown = await ai.skillReport(req.user.id, { courseTitle: report.batch.title || report.batch.name, performance });
    const rec = AiReports.create({ user_id: row.id, batch_id: b.id, markdown, scope: 'course' }, req.user.id);
    res.json({ ok: true, report: rec });
  } catch (e) { res.status(e.status || 500).json({ error: e.message }); }
});
// Overall report: every course the student has taken, in one review.
// Teachers may generate it for students on their own courses; admin for anyone.
app.post('/api/ai/overall-report', authRequired, teacherOrAdmin, async (req, res) => {
  try {
    const target = Users.byId((req.body || {}).user_id);
    if (!target || target.role !== 'student') return res.status(404).json({ error: 'Student not found.' });
    const batches = Enrollments.batchesForStudent(target.id);
    if (!batches.length) return res.status(400).json({ error: 'This student is not enrolled in any course yet.' });
    if (req.user.role !== 'admin' && !batches.some((b) => canManageBatch(req.user, b))) {
      return res.status(403).json({ error: 'You can only generate overall reports for students on your own courses.' });
    }
    const blocks = batches.map((b) => {
      const rep = courseReport(b.id);
      const row = rep.students.find((s) => s.id === target.id);
      const title = rep.batch.title || rep.batch.name;
      if (!row || !rep.assignments.length) return `COURSE: ${title}\n(no quest track or no activity yet)`;
      return `COURSE: ${title}\nAverage: ${row.avg != null ? row.avg + '%' : 'n/a'} | Submitted ${row.submitted}/${row.total_assignments} | Level ${row.level}/${row.of_levels} | Gems ${row.gems}\n${questPerformanceDetail(b.id, target.id)}`;
    });
    const g = gamifyFor(target);
    const performance = `Courses taken: ${batches.length}. Total gems: ${g.gems}. Stage: ${g.stage.name}. Best streak: ${g.best_streak} days.\n\n${blocks.join('\n\n')}`;
    const markdown = await ai.overallReport(req.user.id, { performance });
    const rec = AiReports.create({ user_id: target.id, batch_id: null, markdown, scope: 'overall' }, req.user.id);
    res.json({ ok: true, report: rec });
  } catch (e) { res.status(e.status || 500).json({ error: e.message }); }
});
// Overall reports (batch_id null) can be published/removed by admin or the
// teacher who generated them; course reports by anyone managing that course.
function canManageReport(u, r) {
  if (!r) return false;
  if (r.batch_id == null) return u.role === 'admin' || r.by === u.id;
  return canManageBatch(u, Batches.byId(r.batch_id));
}
app.post('/api/ai-reports/:id/publish', authRequired, teacherOrAdmin, (req, res) => {
  const r = AiReports.byId(req.params.id);
  if (!canManageReport(req.user, r)) return res.status(403).json({ error: 'Not your course.' });
  res.json({ ok: true, report: AiReports.publish(r.id) });
});
app.delete('/api/ai-reports/:id', authRequired, teacherOrAdmin, (req, res) => {
  const r = AiReports.byId(req.params.id);
  if (!canManageReport(req.user, r)) return res.status(403).json({ error: 'Not your course.' });
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
  const bd = Batches.decorate(req.batch);
  const studentMails = Enrollments.studentsForBatch(req.batch.id).map((u) => u.email).filter(Boolean);
  mailer.notify(studentMails, `New quest published - ${bd.title || bd.name}`,
    `Your instructor just published the quest track for ${bd.title || bd.name}: ${out.levels} levels of assignments.\n\nLevel 1 is open now - sign in and start earning gems: ${APP_URL}/dashboard`);
  res.json(out);
});
// Teacher nudge: email every enrolled student who has not finished this
// level's tasks yet. Manual by design - quests gate on passing, not dates.
app.post('/api/quests/:qid/remind', authRequired, (req, res) => {
  const q = Quests.byId(req.params.qid);
  if (!q) return res.status(404).json({ error: 'Level not found.' });
  if (!canManageBatch(req.user, Batches.byId(q.batch_id))) return res.status(403).json({ error: 'You cannot manage this course.' });
  const bd = Batches.decorate(Batches.byId(q.batch_id));
  const subs = store.allData().quest_submissions;
  const behind = Enrollments.studentsForBatch(q.batch_id).filter((u) =>
    q.problems.some((p) => !subs.some((x) => x.quest_id === q.id && x.pid === p.pid && x.user_id === u.id)));
  const mails = behind.map((u) => u.email).filter(Boolean);
  mailer.notify(mails, `Reminder - Level ${q.no} tasks are waiting (${bd.title || bd.name})`,
    `A friendly reminder from your instructor: you still have unsubmitted tasks in Level ${q.no}: ${q.title}.\n\nOpen the quest, write your solution in the built-in editor, and submit: ${APP_URL}/dashboard`);
  res.json({ ok: true, reminded: mails.length, behind: behind.length });
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
  // Students never see the raw AI review or its suggested score - only the
  // key points their teacher explicitly chose to share.
  const sanitizeSub = (s) => ({
    id: s.id, quest_id: s.quest_id, pid: s.pid,
    code: s.code || null, language: s.language || null, file_url: s.file_url || null,
    note: s.note, grade: s.grade, gems: s.gems, remarks: s.remarks, submitted_at: s.submitted_at,
    late: !!s.late, late_deduction: s.late_deduction || 0,
    shared_review: (s.review_shared && s.ai_review) ? {
      key_concepts: s.ai_review.key_concepts || null,
      mistakes: s.ai_review.mistakes || null,
      better_approach: s.ai_review.better_approach || null,
    } : null,
  });
  const mySubsRaw = isStudent ? Quests.mySubs(req.user.id, req.batch.id) : {};
  const mySubs = {};
  for (const k of Object.keys(mySubsRaw)) mySubs[k] = sanitizeSub(mySubsRaw[k]);
  res.json({
    installed: true,
    progress: isStudent ? progress : { ...progress, levels: progress.levels.map((l) => ({ ...l, unlocked: true })) }, // staff and admin see every level and solution, no gating
    my_subs: mySubs,
    task_files: Quests.forBatch(req.batch.id).flatMap((q) => TaskFiles.forQuest(q.id)), // datasets attached to problems
    late_penalty_pct: 20,
    ide_enabled: store.ideEnabled(req.batch.id), // no-code courses hide the compiler
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

  const body = req.body || {};
  const code = typeof body.code === 'string' ? body.code.replace(/\r\n/g, '\n') : '';
  const isWritten = p.type === 'written' || !store.ideEnabled(q.batch_id); // no-IDE courses submit written work everywhere
  let payload = null;
  if (req.file) {
    // File mode. Coding tasks: PDF/Word. Written (logic) problems also accept
    // plain-text files, since the answer is prose.
    const okExt = isWritten ? [...DOC_EXT, '.txt'] : DOC_EXT;
    const ext = path.extname(req.file.originalname).toLowerCase();
    if (!okExt.includes(ext)) {
      try { fs.unlinkSync(req.file.path); } catch {}
      return res.status(400).json({ error: isWritten ? 'Only PDF, Word (.doc/.docx) or text (.txt) files are accepted for written answers.' : 'Only PDF or Word (.doc/.docx) files are accepted.' });
    }
    payload = { file_url: `/uploads/${req.file.filename}` };
  } else if (code.trim().length >= 5) {
    // Editor mode: Python / web (HTML+CSS+JS) code, or a typed written answer.
    if (code.length > 200000) return res.status(400).json({ error: 'Your solution is too long - keep it under 200,000 characters.' });
    payload = { code, language: ['python', 'text', 'web'].includes(String(body.language)) ? String(body.language) : (isWritten ? 'text' : 'python') };
  } else {
    return res.status(400).json({ error: isWritten ? 'Write your logical answer in the editor, or upload it as a PDF or text file.' : 'Write your solution in the editor, or attach it as a PDF/Word file.' });
  }
  const s = Quests.submit({ quest_id: q.id, pid: p.pid, user_id: req.user.id, ...payload, note: body.note });
  const batch = Batches.decorate(Batches.byId(q.batch_id));
  const teacherMails = (Batches.byId(q.batch_id).instructor_ids || []).map((tid) => (Users.byId(tid) || {}).email).filter(Boolean);
  mailer.notify(teacherMails, `New submission - ${batch.title || batch.name}`,
    `${req.user.name} submitted "${p.title}" (Level ${q.no}: ${q.title}).\n\nOpen the course to review and grade it: ${APP_URL}/dashboard`);
  res.json({ ok: true, submission: s });
});
// Teacher permission gate: share (or unshare) the AI review's key points
// with the student who submitted. The suggested score is never shared.
app.post('/api/quest-submissions/:id/share-review', authRequired, (req, res) => {
  const s = Quests.subById(req.params.id);
  if (!s) return res.status(404).json({ error: 'Submission not found.' });
  const q = Quests.byId(s.quest_id);
  if (!canManageBatch(req.user, Batches.byId(q.batch_id))) return res.status(403).json({ error: 'You cannot manage this course.' });
  if (!s.ai_review) return res.status(400).json({ error: 'Run the AI review first - there is nothing to share yet.' });
  s.review_shared = !!(req.body || {}).share;
  s.review_shared_at = s.review_shared ? new Date().toISOString().replace('T', ' ').slice(0, 19) : null;
  store.persist();
  res.json({ ok: true, shared: s.review_shared });
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
  const graded = Quests.grade(s.id, Number(grade), remarks, req.user.id);
  const student = Users.byId(s.user_id);
  const p = q.problems.find((x) => x.pid === s.pid) || {};
  if (student && student.email) {
    mailer.notify(student.email, `Your task was graded - ${p.title || 'quest task'}`,
      `Hi ${student.name},\n\nYour submission for "${p.title}" (Level ${q.no}) was graded: ${graded.grade}% - you earned ${graded.gems} gems.${graded.remarks ? '\n\nYour teacher says: ' + graded.remarks : ''}\n\nSee your progress: ${APP_URL}/dashboard`);
  }
  res.json({ ok: true, submission: graded });
});
// AI draft for quest submissions - same rules: draft only, teacher publishes.
app.post('/api/ai/quest-grade-draft', authRequired, teacherOrAdmin, async (req, res) => {
  try {
    const s = Quests.subById(req.body?.submission_id);
    if (!s) return res.status(404).json({ error: 'Submission not found.' });
    const q = Quests.byId(s.quest_id);
    if (!canManageBatch(req.user, Batches.byId(q.batch_id))) return res.status(403).json({ error: 'You cannot grade on this course.' });
    const p = q.problems.find((x) => x.pid === s.pid) || {};
    const { text, name } = await submissionText(s);
    const draft = await ai.gradeDraft(req.user.id, {
      assignmentTitle: `${q.title} - ${p.title}`, assignmentBrief: p.description, points: p.points || 100,
      studentNote: s.note, fileText: text, fileName: name,
    });
    res.json({ draft, readable: !!text });
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
// v11: teachers add extra problems to a level - e.g. a WRITTEN logic problem
// where the student explains the reasoning instead of coding it.
app.post('/api/quests/:qid/problems', authRequired, (req, res) => {
  const q = Quests.byId(req.params.qid);
  if (!q) return res.status(404).json({ error: 'Level not found.' });
  if (!canManageBatch(req.user, Batches.byId(q.batch_id))) return res.status(403).json({ error: 'You cannot edit this course.' });
  const { title, description } = req.body || {};
  if (!title || !description) return res.status(400).json({ error: 'A title and problem statement are required.' });
  const p = Quests.addProblem(q.id, req.body);
  res.json({ ok: true, problem: p });
});
app.delete('/api/quests/:qid/problems/:pid', authRequired, (req, res) => {
  const q = Quests.byId(req.params.qid);
  if (!q) return res.status(404).json({ error: 'Level not found.' });
  if (!canManageBatch(req.user, Batches.byId(q.batch_id))) return res.status(403).json({ error: 'You cannot edit this course.' });
  if (q.problems.length <= 1) return res.status(400).json({ error: 'A level needs at least one problem.' });
  Quests.removeProblem(q.id, req.params.pid);
  res.json({ ok: true });
});
// Single submission with full context - powers the dedicated grading page.
app.get('/api/quest-submissions/:id', authRequired, (req, res) => {
  const s = Quests.subById(req.params.id);
  if (!s) return res.status(404).json({ error: 'Submission not found.' });
  const q = Quests.byId(s.quest_id);
  const b = Batches.byId(q.batch_id);
  if (!(canManageBatch(req.user, b) || req.user.role === 'coordinator')) return res.status(403).json({ error: 'Not available for your role.' });
  const p = q.problems.find((x) => x.pid === s.pid) || {};
  const u = Users.byId(s.user_id) || {};
  const bd = Batches.decorate(b);
  res.json({
    submission: { ...s, student_name: u.name, student_reg: u.reg_no, student_avatar: u.avatar || null },
    problem: p, quest: { id: q.id, no: q.no, title: q.title, topic: q.topic, deadline: q.deadline || null, batch_id: q.batch_id },
    course: { id: b.id, title: bd.title || bd.name, cohort: bd.name },
    can_grade: canManageBatch(req.user, b),
    files: TaskFiles.forProblem(q.id, s.pid),
  });
});

/* ----------------------- AI review layer (teacher-only) ----------------------- */
// Summarizes the question + student solution, lists mistakes, a better
// approach, key concepts grasped, and a suggested score. Cached per
// submission. The instructor ALWAYS decides the final score.
app.post('/api/ai/review', authRequired, teacherOrAdmin, async (req, res) => {
  try {
    const { submission_id, force } = req.body || {};
    const sub = Quests.subById(submission_id);
    if (!sub) return res.status(404).json({ error: 'Submission not found.' });
    const q = Quests.byId(sub.quest_id);
    const p = q.problems.find((x) => x.pid === sub.pid) || {};
    if (!canManageBatch(req.user, Batches.byId(q.batch_id))) return res.status(403).json({ error: 'You cannot grade on this course.' });
    if (sub.ai_review && !force) return res.json({ review: sub.ai_review, cached: true, shared: !!sub.review_shared });
    const { text, name } = await submissionText(sub);
    const review = await ai.review(req.user.id, {
      problemTitle: `${q.title} - ${p.title}`, problemBrief: p.description, points: p.points || 100,
      solutionGuideline: p.solution || null,
      studentNote: sub.note, fileText: text, fileName: name,
    });
    review.readable = !!text;
    sub.ai_review = review;
    sub.review_shared = false; // a fresh review is unshared until the teacher decides
    store.persist(); // cache the review on the submission record
    res.json({ review, cached: false, shared: false });
  } catch (e) { res.status(e.status || 500).json({ error: e.message }); }
});

/* ---------------------------- official catalogue ---------------------------- */
app.post('/api/admin/catalogue/load-official', authRequired, adminRequired, (req, res) => {
  res.json({ ok: true, ...store.loadOfficialCatalogue() });
});

/* ------------------------- public site (no sign-in) ------------------------- */
// The landing page shows what EchoLens offers and lets anyone try the first
// levels of every quest track in the browser compiler. Everything beyond the
// open levels requires an account (created by the academy after payment).
const OPEN_LEVELS = 3;
app.get('/api/public/info', (req, res) => {
  res.json({
    catalogue: officialCatalogue(),
    stats: {
      students: Users.countByRole('student') + Users.countByRole('free'),
      courses: officialCatalogue().length,
      tracks: Quests.tracks().length,
    },
    open_levels: OPEN_LEVELS,
    contact: 'echolens816@gmail.com',
  });
});
app.get('/api/public/tracks', (req, res) => res.json({ tracks: Quests.tracks(), open_levels: OPEN_LEVELS }));
app.get('/api/public/tracks/:key', (req, res) => {
  const t = Quests.trackDef(req.params.key);
  if (!t) return res.status(404).json({ error: 'Track not found.' });
  const levels = t.levels.map((l) => {
    if (l.no <= OPEN_LEVELS) {
      return {
        no: l.no, week: l.week, title: l.title, topic: l.topic, locked: false,
        problems: l.problems.map((p, i) => ({ pid: i + 1, title: p.title, description: p.description, points: p.points || 100, difficulty: p.difficulty, refs: p.refs || [] })),
      };
    }
    return { no: l.no, week: l.week, title: l.title, topic: l.topic, locked: true, problems_count: l.problems.length };
  });
  res.json({ track: { key: t.key, title: t.title, description: t.description, pass_mark: t.pass_mark, total_points: t.total_points, course_code: t.course_code || null }, levels, open_levels: OPEN_LEVELS });
});

/* ================================ v11 routes ================================ */

/* ------------------------- avatars & signatures ------------------------- */
// Course staff decide whether their course shows the built-in compiler.
// No-code tracks (automation, prompting, UI/UX, graphics, WordPress, BI
// tools) default to OFF; coding tracks default to ON.
app.post('/api/batches/:id/ide', authRequired, manageBatch, (req, res) => {
  res.json({ ok: true, ide_enabled: store.setIde(req.batch.id, !!(req.body || {}).enabled) });
});
const IMG_EXT = ['.png', '.jpg', '.jpeg', '.webp'];
function requireImage(req, res, maxMb = 3) {
  if (!req.file) { res.status(400).json({ error: 'Choose an image first.' }); return false; }
  const ext = path.extname(req.file.originalname).toLowerCase();
  if (!IMG_EXT.includes(ext)) { try { fs.unlinkSync(req.file.path); } catch {} res.status(400).json({ error: 'Only PNG, JPG or WebP images are accepted.' }); return false; }
  if (req.file.size > maxMb * 1024 * 1024) { try { fs.unlinkSync(req.file.path); } catch {} res.status(400).json({ error: `Keep the image under ${maxMb} MB.` }); return false; }
  return true;
}
app.post('/api/me/avatar', authRequired, upload.single('file'), (req, res) => {
  if (!requireImage(req, res)) return;
  Users.setAvatar(req.user.id, `/uploads/${req.file.filename}`);
  res.json({ ok: true, avatar: `/uploads/${req.file.filename}` });
});
// Instructors upload their signature once; it appears on every certificate
// they sign. PNG with transparent background looks best.
app.post('/api/me/signature', authRequired, teacherOrAdmin, upload.single('file'), (req, res) => {
  if (!requireImage(req, res, 1)) return;
  Users.setSignature(req.user.id, `/uploads/${req.file.filename}`);
  res.json({ ok: true, signature: `/uploads/${req.file.filename}` });
});

/* ------------------------- live classes + attendance ------------------------- */
// The class runs INSIDE the portal (embedded Jitsi room - open source, no
// account needed). Joining marks attendance; a heartbeat counts minutes.
app.post('/api/batches/:id/live/start', authRequired, manageBatch, (req, res) => {
  const out = LiveClasses.create({ batch_id: req.batch.id, title: (req.body || {}).title, started_by: req.user.id });
  if (out.error) return res.status(400).json({ error: out.error });
  const bd = Batches.decorate(req.batch);
  const mails = Enrollments.studentsForBatch(req.batch.id).map((u) => u.email).filter(Boolean);
  mailer.notify(mails, `Live class started - ${bd.title || bd.name}`,
    `${req.user.name} just started "${out.live.title}" live inside the portal.\n\nJoin from the Live tab of your course: ${APP_URL}/dashboard`);
  res.json(out);
});
app.post('/api/live/:id/end', authRequired, (req, res) => {
  const c = LiveClasses.byId(req.params.id);
  if (!c) return res.status(404).json({ error: 'Class not found.' });
  if (!canManageBatch(req.user, Batches.byId(c.batch_id))) return res.status(403).json({ error: 'You cannot manage this course.' });
  LiveClasses.end(c.id);
  res.json({ ok: true });
});
app.get('/api/batches/:id/live', authRequired, viewBatch, (req, res) => {
  const active = LiveClasses.active(req.batch.id);
  const staff = ['admin', 'coordinator', 'instructor'].includes(req.user.role);
  const past = LiveClasses.forBatch(req.batch.id).filter((c) => c.ended_at).slice(0, 30).map((c) => {
    const sheet = Attendance.sheet(c);
    const present = sheet.filter((r) => r.present).length;
    const row = { id: c.id, title: c.title, date: c.date, started_at: c.started_at, ended_at: c.ended_at, present, absent: sheet.length - present, total: sheet.length };
    if (!staff) row.me_present = sheet.some((r) => r.id === req.user.id && r.present);
    return row;
  });
  const out = { active: active ? { id: active.id, title: active.title, room: staff || req.user.role === 'student' ? active.room : null, started_at: active.started_at } : null, past, can_manage: canManageBatch(req.user, req.batch) };
  if (active && staff) out.live_attendance = Attendance.sheet(active);
  if (req.user.role === 'student') out.my_rate = Attendance.rate(req.user.id, req.batch.id);
  res.json(out);
});
app.post('/api/live/:id/join', authRequired, (req, res) => {
  const c = LiveClasses.byId(req.params.id);
  if (!c || c.ended_at) return res.status(404).json({ error: 'This class has ended.' });
  const b = Batches.byId(c.batch_id);
  if (!canViewBatch(req.user, b)) return res.status(403).json({ error: 'You are not on this course.' });
  if (req.user.role === 'student') Attendance.mark(c.id, req.user.id); // attendance = actually joining the room
  res.json({ ok: true, room: c.room, display_name: req.user.name });
});
app.post('/api/live/:id/heartbeat', authRequired, (req, res) => {
  const c = LiveClasses.byId(req.params.id);
  if (!c || c.ended_at) return res.json({ ok: true, ended: true });
  if (req.user.role === 'student') Attendance.heartbeat(c.id, req.user.id);
  res.json({ ok: true });
});
app.get('/api/live/:id/attendance', authRequired, staffView, (req, res) => {
  const c = LiveClasses.byId(req.params.id);
  if (!c) return res.status(404).json({ error: 'Class not found.' });
  if (!canViewBatch(req.user, Batches.byId(c.batch_id))) return res.status(403).json({ error: 'You are not on this course.' });
  res.json({ class: { id: c.id, title: c.title, date: c.date, started_at: c.started_at, ended_at: c.ended_at }, sheet: Attendance.sheet(c) });
});

/* ------------------------------ live quizzes ------------------------------ */
app.get('/api/batches/:id/quizzes', authRequired, viewBatch, (req, res) => {
  const staff = ['admin', 'coordinator', 'instructor'].includes(req.user.role);
  const all = Quizzes.forBatch(req.batch.id);
  if (staff) {
    return res.json({
      can_manage: canManageBatch(req.user, req.batch),
      quizzes: all.map((q) => ({ ...q, open: Quizzes.isOpen(q), attempts: Quizzes.results(q.id).length })),
    });
  }
  // Students: only quizzes that are open right now (without answers), plus
  // their own past attempts. Closed quizzes disappear until reopened.
  res.json({
    quizzes: all.filter((q) => Quizzes.isOpen(q)).map((q) => {
      const mine = Quizzes.myAttempt(q.id, req.user.id);
      return {
        id: q.id, title: q.title, points: q.points, closes_at: q.closes_at, duration_min: q.duration_min,
        allow_ide: !!q.allow_ide, // shows a practice IDE terminal beside the questions
        questions: mine ? [] : q.questions.map((x) => ({ no: x.no, q: x.q, options: x.options })), // answers never leave the server
        taken: !!mine, my_score: mine ? mine.score_pct : null,
      };
    }),
    my_attempts: store.allData().quiz_attempts.filter((a) => a.user_id === req.user.id && all.some((q) => q.id === a.quiz_id))
      .map((a) => ({ quiz_id: a.quiz_id, title: (Quizzes.byId(a.quiz_id) || {}).title, score_pct: a.score_pct, correct: a.correct, total: a.total, gems: a.gems, taken_at: a.taken_at })),
  });
});
app.post('/api/batches/:id/quizzes', authRequired, manageBatch, (req, res) => {
  const out = Quizzes.create({ batch_id: req.batch.id, ...req.body, created_by: req.user.id });
  if (out.error) return res.status(400).json({ error: out.error });
  res.json(out);
});
// AI-generated quiz (teacher reviews before opening it).
app.post('/api/batches/:id/quizzes/generate', authRequired, manageBatch, async (req, res) => {
  try {
    const { topic, count, level } = req.body || {};
    if (!topic) return res.status(400).json({ error: 'Give the quiz a topic first.' });
    const questions = await ai.quizJson(req.user.id, { topic, count, level });
    if (!questions.length) return res.status(502).json({ error: 'The AI did not return usable questions - try again.' });
    res.json({ ok: true, questions });
  } catch (e) { res.status(e.status || 500).json({ error: e.message }); }
});
function manageQuiz(req, res, next) {
  const q = Quizzes.byId(req.params.id);
  if (!q) return res.status(404).json({ error: 'Quiz not found.' });
  if (!canManageBatch(req.user, Batches.byId(q.batch_id))) return res.status(403).json({ error: 'You cannot manage this course.' });
  req.quiz = q; next();
}
app.post('/api/quizzes/:id/open', authRequired, manageQuiz, (req, res) => {
  const q = Quizzes.open(req.quiz.id, (req.body || {}).minutes);
  const b = Batches.decorate(Batches.byId(q.batch_id));
  const mails = Enrollments.studentsForBatch(q.batch_id).map((u) => u.email).filter(Boolean);
  mailer.notify(mails, `Quiz is LIVE for ${q.duration_min} minutes - ${b.title || b.name}`,
    `"${q.title}" is open right now and closes in ${q.duration_min} minutes.\n\nTake it from the Quizzes tab: ${APP_URL}/dashboard`);
  res.json({ ok: true, quiz: q });
});
app.post('/api/quizzes/:id/close', authRequired, manageQuiz, (req, res) => { Quizzes.close(req.quiz.id); res.json({ ok: true }); });
app.delete('/api/quizzes/:id', authRequired, manageQuiz, (req, res) => { Quizzes.remove(req.quiz.id); res.json({ ok: true }); });
app.get('/api/quizzes/:id/results', authRequired, staffView, (req, res) => {
  const q = Quizzes.byId(req.params.id);
  if (!q) return res.status(404).json({ error: 'Quiz not found.' });
  if (!canViewBatch(req.user, Batches.byId(q.batch_id))) return res.status(403).json({ error: 'You are not on this course.' });
  res.json({ quiz: { id: q.id, title: q.title, questions: q.questions, points: q.points }, results: Quizzes.results(q.id) });
});
app.post('/api/quizzes/:id/attempt', authRequired, (req, res) => {
  if (req.user.role !== 'student') return res.status(403).json({ error: 'Only students take quizzes.' });
  const q = Quizzes.byId(req.params.id);
  if (!q) return res.status(404).json({ error: 'Quiz not found.' });
  if (!canViewBatch(req.user, Batches.byId(q.batch_id))) return res.status(403).json({ error: 'You are not on this course.' });
  const out = Quizzes.attempt(q.id, req.user.id, (req.body || {}).answers);
  if (out.error) return res.status(400).json({ error: out.error });
  res.json({ ok: true, score_pct: out.attempt.score_pct, correct: out.attempt.correct, total: out.attempt.total, gems: out.attempt.gems });
});

/* --------------------- datasets attached to quest problems --------------------- */
app.get('/api/quests/:qid/problems/:pid/files', authRequired, (req, res) => {
  const q = Quests.byId(req.params.qid);
  if (!q) return res.status(404).json({ error: 'Level not found.' });
  if (!canViewBatch(req.user, Batches.byId(q.batch_id))) return res.status(403).json({ error: 'You are not on this course.' });
  res.json({ files: TaskFiles.forProblem(q.id, req.params.pid) });
});
const DATA_EXT = ['.csv', '.tsv', '.txt', '.json', '.xlsx', '.xls', '.parquet', '.zip'];
app.post('/api/quests/:qid/problems/:pid/files', authRequired, upload.single('file'), (req, res) => {
  const q = Quests.byId(req.params.qid);
  if (!q) return res.status(404).json({ error: 'Level not found.' });
  if (!canManageBatch(req.user, Batches.byId(q.batch_id))) return res.status(403).json({ error: 'Only course staff attach datasets.' });
  if (!req.file) return res.status(400).json({ error: 'Choose a dataset file first.' });
  const ext = path.extname(req.file.originalname).toLowerCase();
  if (!DATA_EXT.includes(ext)) { try { fs.unlinkSync(req.file.path); } catch {} return res.status(400).json({ error: 'Datasets can be CSV, TSV, TXT, JSON, Excel, Parquet or ZIP.' }); }
  const f = TaskFiles.add({ quest_id: q.id, pid: req.params.pid, name: req.file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_'), url: `/uploads/${req.file.filename}`, size: req.file.size, by: req.user.id });
  res.json({ ok: true, file: f });
});
app.delete('/api/task-files/:id', authRequired, (req, res) => {
  const f = TaskFiles.byId(req.params.id);
  if (!f) return res.status(404).json({ error: 'File not found.' });
  const q = Quests.byId(f.quest_id);
  if (!canManageBatch(req.user, Batches.byId(q.batch_id))) return res.status(403).json({ error: 'Only course staff remove datasets.' });
  TaskFiles.remove(f.id);
  res.json({ ok: true });
});

/* --------------------------- integrity (teacher-only) --------------------------- */
// Two independent signals, both advisory:
//  1. Similarity: token 3-gram Jaccard against every other submission to the
//     same problem in this course - catches copying between classmates.
//  2. AI likelihood: model-based estimate that the work is AI-generated.
function normalizeForSimilarity(text) {
  return String(text || '').toLowerCase()
    .replace(/#.*$/gm, '').replace(/\/\/.*$/gm, '').replace(/"""[\s\S]*?"""/g, '') // strip comments
    .replace(/[a-z_][a-z0-9_]*/g, 'v') // rename identifiers so renaming variables doesn't hide copying
    .replace(/\s+/g, ' ').trim();
}
function trigrams(s) {
  const t = new Set(); const words = s.split(' ');
  for (let i = 0; i < words.length - 2; i++) t.add(words[i] + ' ' + words[i + 1] + ' ' + words[i + 2]);
  return t;
}
function similarityPct(a, b) {
  const A = trigrams(normalizeForSimilarity(a)), B = trigrams(normalizeForSimilarity(b));
  if (!A.size || !B.size) return 0;
  let inter = 0; for (const x of A) if (B.has(x)) inter++;
  return Math.round((inter / (A.size + B.size - inter)) * 100);
}
app.post('/api/ai/integrity', authRequired, teacherOrAdmin, async (req, res) => {
  try {
    const { submission_id, force } = req.body || {};
    const sub = Quests.subById(submission_id);
    if (!sub) return res.status(404).json({ error: 'Submission not found.' });
    const q = Quests.byId(sub.quest_id);
    if (!canManageBatch(req.user, Batches.byId(q.batch_id))) return res.status(403).json({ error: 'You cannot review this course.' });
    if (sub.integrity && !force) return res.json({ integrity: sub.integrity, cached: true });
    const p = q.problems.find((x) => x.pid === sub.pid) || {};
    const { text } = sub.code ? { text: sub.code } : await extractText(sub.file_url);
    // 1) cross-student similarity on the same problem
    const others = store.allData().quest_submissions.filter((s) => s.quest_id === sub.quest_id && s.pid === sub.pid && s.id !== sub.id);
    const matches = [];
    for (const o of others) {
      const otherText = o.code || (await extractText(o.file_url)).text;
      if (!otherText || !text) continue;
      const pct = similarityPct(text, otherText);
      if (pct >= 40) {
        const u = Users.byId(o.user_id) || {};
        matches.push({ student: u.name, reg_no: u.reg_no, similarity: pct });
      }
    }
    matches.sort((a, b) => b.similarity - a.similarity);
    // 2) AI-likelihood (only if AI is configured and we have readable text)
    let aiCheck = null;
    if (ai.enabled() && text) {
      try { aiCheck = await ai.integrity(req.user.id, { problemTitle: p.title, problemBrief: p.description, text, kind: p.type }); }
      catch (e) { aiCheck = { error: e.message }; }
    }
    const report = {
      checked_at: new Date().toISOString().slice(0, 16).replace('T', ' '),
      readable: !!text,
      similarity: { compared: others.length, matches: matches.slice(0, 5) },
      ai_check: aiCheck,
      note: 'Advisory signals only - never proof. Confirm with a quick viva before acting.',
    };
    sub.integrity = report; store.persist();
    res.json({ integrity: report, cached: false });
  } catch (e) { res.status(e.status || 500).json({ error: e.message }); }
});

/* ------------------------ student search + full profile ------------------------ */
// Admin/coordinator: search everyone. Teacher: only students on their courses.
function visibleStudents(user) {
  const students = Users.all().filter((u) => ['student', 'free'].includes(u.role));
  if (['admin', 'coordinator'].includes(user.role)) return students;
  const myBatchIds = Batches.all().filter((b) => (b.instructor_ids || []).includes(user.id)).map((b) => b.id);
  const myStudentIds = new Set(store.allData().enrollments.filter((e) => myBatchIds.includes(e.batch_id)).map((e) => e.user_id));
  return students.filter((u) => myStudentIds.has(u.id));
}
app.get('/api/students/search', authRequired, staffView, (req, res) => {
  const q = String(req.query.q || '').trim().toLowerCase();
  if (!q) return res.json({ students: [] });
  const hits = visibleStudents(req.user).filter((u) =>
    (u.reg_no && u.reg_no.includes(q)) || u.name.toLowerCase().includes(q) || (u.username && u.username.toLowerCase().includes(q)))
    .slice(0, 20)
    .map((u) => ({ id: u.id, name: u.name, reg_no: u.reg_no, avatar: u.avatar || null, courses: coursesForUser(u).map((b) => b.title || b.name).slice(0, 3) }));
  res.json({ students: hits });
});
app.get('/api/students/:id/full', authRequired, staffView, (req, res) => {
  const target = Users.byId(req.params.id);
  if (!target || !['student', 'free'].includes(target.role)) return res.status(404).json({ error: 'Student not found.' });
  if (!visibleStudents(req.user).some((u) => u.id === target.id)) return res.status(403).json({ error: 'This student is not on any of your courses.' });
  res.json({ student: fullStudentProfile(target.id) });
});

/* ------------------------------ at-risk students ------------------------------ */
app.get('/api/batches/:id/at-risk', authRequired, viewBatch, staffView, (req, res) => {
  res.json({ report: riskReport(req.batch.id) });
});

/* --------------------------- QR verified certificates --------------------------- */
// Certificate settings: official organisation name, tagline, CEO name and
// CEO signature image. Admin-only.
app.get('/api/admin/cert-settings', authRequired, teacherOrAdmin, (req, res) => res.json({ settings: Settings.cert() }));
app.post('/api/admin/cert-settings', authRequired, adminRequired, (req, res) => {
  res.json({ ok: true, settings: Settings.setCert(req.body || {}) });
});
app.post('/api/admin/cert-settings/ceo-signature', authRequired, adminRequired, upload.single('file'), (req, res) => {
  if (!requireImage(req, res, 1)) return;
  const settings = Settings.setCert({ ceo_sig: `/uploads/${req.file.filename}` });
  res.json({ ok: true, settings });
});
// Issue one certificate (course completion / hackathon / competition).
app.post('/api/certificates/issue', authRequired, teacherOrAdmin, (req, res) => {
  const { reg_no, user_id, batch_id, kind, title, completion_date, detail } = req.body || {};
  const student = user_id ? Users.byId(user_id) : Users.byReg(String(reg_no || ''));
  if (!student) return res.status(404).json({ error: 'No student found for that registration number.' });
  if (batch_id) {
    const b = Batches.byId(batch_id);
    if (!b) return res.status(404).json({ error: 'Course not found.' });
    if (!canManageBatch(req.user, b)) return res.status(403).json({ error: 'You cannot issue certificates on this course.' });
  } else if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Only the admin issues certificates outside a course.' });
  }
  if (!title) return res.status(400).json({ error: 'A course / hackathon / competition name is required.' });
  const instructorId = req.user.role === 'instructor' ? req.user.id
    : (batch_id ? ((Batches.byId(batch_id).instructor_ids || [])[0] || null) : null);
  const out = Certificates.issue({ user_id: student.id, batch_id, kind, title, completion_date, detail, instructor_id: instructorId, issued_by: req.user.id });
  if (out.error) return res.status(400).json({ error: out.error });
  const cert = out.cert;
  if (student.email) {
    mailer.notify(student.email, `Your certificate is ready - ${cert.title}`,
      `Congratulations ${student.name}!\n\nYour verified certificate for "${cert.title}" has been issued (serial ${cert.serial}).\n\nView, download and share it to LinkedIn from your profile, or open it directly: ${APP_URL}/cert?s=${cert.serial}`);
  }
  res.json({ ok: true, cert, url: `${APP_URL}/cert?s=${cert.serial}` });
});
// Issue for every student who COMPLETED the course's quest track.
app.post('/api/batches/:id/certificates/issue-all', authRequired, manageBatch, (req, res) => {
  const bd = Batches.decorate(req.batch);
  const title = (req.body || {}).title || bd.title || bd.name;
  const completion_date = (req.body || {}).completion_date;
  const onlyCompleted = (req.body || {}).only_completed !== false;
  const instructorId = req.user.role === 'instructor' ? req.user.id : ((req.batch.instructor_ids || [])[0] || null);
  const issued = [], skipped = [];
  for (const u of Enrollments.studentsForBatch(req.batch.id)) {
    const prog = Quests.installed(req.batch.id) ? Quests.progress(u.id, req.batch.id) : null;
    if (onlyCompleted && prog && !prog.completed) { skipped.push(u.name); continue; }
    const out = Certificates.issue({ user_id: u.id, batch_id: req.batch.id, kind: 'course', title, completion_date, detail: `Cohort: ${bd.name}`, instructor_id: instructorId, issued_by: req.user.id });
    if (out.ok) {
      issued.push(u.name);
      if (u.email) mailer.notify(u.email, `Your certificate is ready - ${title}`, `Congratulations ${u.name}! Your verified certificate for "${title}" is ready: ${APP_URL}/cert?s=${out.cert.serial}`);
    }
  }
  res.json({ ok: true, issued: issued.length, skipped: skipped.length, skipped_names: skipped.slice(0, 20) });
});
app.get('/api/certificates/mine', authRequired, (req, res) => {
  res.json({ certificates: Certificates.forUser(req.user.id).map((c) => ({ ...Certificates.publicView(c), url: `${APP_URL}/cert?s=${c.serial}` })) });
});
app.get('/api/batches/:id/certificates', authRequired, viewBatch, staffView, (req, res) => {
  res.json({ certificates: Certificates.forBatch(req.batch.id).map((c) => ({ serial: c.serial, student_name: c.student_name, reg_no: c.reg_no, title: c.title, completion_date: c.completion_date })) });
});
app.delete('/api/certificates/:serial', authRequired, adminRequired, (req, res) => {
  const c = Certificates.bySerial(req.params.serial);
  if (!c) return res.status(404).json({ error: 'Certificate not found.' });
  Certificates.revoke(c.id);
  res.json({ ok: true });
});
// PUBLIC verification: this is what the QR code opens. Anyone (an employer,
// LinkedIn viewer) can confirm the certificate is genuine.
app.get('/api/verify/:serial', (req, res) => {
  const c = Certificates.bySerial(req.params.serial);
  if (!c) return res.status(404).json({ valid: false, error: 'No certificate exists for this serial. It may have been revoked.' });
  res.json({ valid: true, certificate: Certificates.publicView(c), verify_url: `${APP_URL}/cert?s=${c.serial}` });
});
// Signature images must be publicly visible on the certificate page.
app.get('/api/public/cert-image/:name', (req, res) => {
  const name = path.basename(String(req.params.name));
  const full = path.join(UPLOAD_DIR, name);
  const c = Settings.cert();
  const allowed = new Set([c.ceo_sig, ...store.allData().certificates.map((x) => x.instructor_sig)].filter(Boolean).map((u) => path.basename(u)));
  if (!allowed.has(name) || !fs.existsSync(full)) return res.status(404).send('Not found');
  res.sendFile(full);
});

/* --------------------------------- static --------------------------------- */
app.use('/uploads', authGate, express.static(UPLOAD_DIR));
function authGate(req, res, next) { if (!currentUser(req)) return res.status(401).send('Sign in to view files.'); next(); }
app.use(express.static(path.join(__dirname, 'public')));
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'landing.html')));
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'public', 'login.html')));
app.get('/dashboard', (req, res) => res.sendFile(path.join(__dirname, 'public', 'dashboard.html')));
app.get('/grade', (req, res) => res.sendFile(path.join(__dirname, 'public', 'grade.html')));
app.get('/cert', (req, res) => res.sendFile(path.join(__dirname, 'public', 'cert.html')));
app.get('/verify', (req, res) => res.sendFile(path.join(__dirname, 'public', 'cert.html')));

app.use((err, req, res, next) => {
  if (err) return res.status(400).json({ error: err.message || 'Something went wrong.' });
  next();
});

app.listen(PORT, () => console.log(`EchoLens LMS v11 running on http://localhost:${PORT}`));
