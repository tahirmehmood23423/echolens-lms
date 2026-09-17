'use strict';

/**
 * EchoLens LMS - server (v4)
 * Adds: admin password reset, registration numbers, multiple teachers per
 * course, coordinator (read-only) role, gem awards, streaks, public profiles.
 */

require('dotenv').config();
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const express = require('express');
const demo = require('./demo/context');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const QRCode = require('qrcode');
const sharp = require('sharp');
const archiver = require('archiver');
const store = require('./store');
const db = require('./db');
const ai = require('./ai');
const mailer = require('./mailer');
const jaas = require('./jaas');
const { challanPdf } = require('./challan-pdf');
const { certificatePng } = require('./cert-image');
const { graderContext } = require('./problem-rubric');
const { ambassadorReportPdf } = require('./ambassador-report-pdf');
const { analyticsReportPdf } = require('./analytics-report-pdf');
const { generateContractPdf } = require('./contract-pdf');
const { generateOfferLetterPdf } = require('./offer-letter-pdf');
const { sessionVersion, validSession, safeReturnPath } = require('./session-security');
const uploadAccess = require('./upload-access');
const { validateEvidenceInput } = require('./evidence-submission');
const { deliverRegistrationMail } = require('./registration-delivery');
const { createAdmissionsReminders, validDate: validChallanDate } = require('./admissions-reminders');
const asyncRoute = require('./async-route');
const {
  Users, Courses, Batches, Enrollments, Sessions, Lessons, Assignments, Submissions, Announcements, Admin, GemEvents, Challenges, Hackathons, AiReports, Quests, Chat, ChatReads, officialCatalogue, catalogueFee,
  Attendance, Quizzes, Certificates, Settings, TaskFiles, riskReport, fullStudentProfile, openUserProfile,
  courseConcepts, finalProjectFor,
  Events, Leads, Suppressions, Analytics, OpenQuest, Registrations, PublicAnnouncements, Jobs, JobComments, Feedback, SupportTickets,
  DiscountCategories, Challans, Expenses, CoordinatorQueries, StaffGroups, StaffRecords, Ambassadors,
  AmbassadorGemEvents, AmbassadorReports, Contracts, ONBOARDING_ROLES, CONTRACT_ROLES,
  Departments, DepartmentMembers, DepartmentTasks, DepartmentAnnouncements,
  Companies, AuditLog,
  coursesForUser, canManageBatch, canViewBatch, announcementRecipients, courseReport,
  gemsForStudentInBatch, totalGemsForStudent, studentLeaderboard, batchLeaderboard, courseLeaderboard,
  stageFor, gamifyFor, touchActivity,
} = store;

const app = express();
const PORT = process.env.PORT || 3000;
const DEFAULT_JWT_SECRET = 'echolens-dev-secret-change-in-production';
const JWT_SECRET = process.env.JWT_SECRET || DEFAULT_JWT_SECRET;
const COOKIE = demo.enabled ? 'el_demo_token' : 'el_token';
// NODE_ENV=production alone is not trusted as "this is really Render" - this
// repo's own local .env sets NODE_ENV=production unconditionally (no
// comment explaining why), so a plain `node server.js` on a laptop reads as
// "production" to any check that only looks at NODE_ENV, tripping the
// JWT_SECRET/trust-proxy/Postgres-required guards below for no reason (or,
// worse, silently satisfying db-guard.js's production exemption). RENDER is
// a second signal Render's own infrastructure injects unconditionally into
// every service and a local .env would not set by accident - see
// db-guard.js's header for the fuller version of this reasoning.
const isProd = process.env.NODE_ENV === 'production' && process.env.RENDER === 'true';

// Part A load test harness only - scripts/loadtest-measure.js reads this to
// get RSS memory cross-platform without shelling out to OS-specific process
// tools. Explicitly opt-in and never on by default (LOADTEST_DIAG must be
// exactly '1'), same pattern as PERF_DEBUG in prisma-client.js - a real
// deploy never sets this.
if (process.env.LOADTEST_DIAG === '1') {
  app.get('/__loadtest/rss', (req, res) => res.json({ rss: process.memoryUsage().rss }));
}

// Auth cookies are signed with JWT_SECRET. If it falls back to the public
// default, anyone can forge an admin session - so refuse to boot in
// production, and warn loudly in development.
if (JWT_SECRET === DEFAULT_JWT_SECRET) {
  if (isProd) {
    console.error('FATAL: JWT_SECRET is not set. Set a long random JWT_SECRET in the environment before starting in production.');
    process.exit(1);
  }
  console.warn('WARNING: JWT_SECRET is not set - using the insecure default. Set JWT_SECRET before deploying.');
}

// Behind a hosting proxy (Render, Nginx) the app must trust it so that
// secure cookies and req.ip (used for login rate limiting) work correctly.
if (isProd) app.set('trust proxy', 1);

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, 'uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });
const AMBASSADOR_REPORTS_DIR = path.join(UPLOAD_DIR, 'ambassador-reports');
fs.mkdirSync(AMBASSADOR_REPORTS_DIR, { recursive: true });
const CONTRACTS_DIR = path.join(UPLOAD_DIR, 'contracts');
fs.mkdirSync(CONTRACTS_DIR, { recursive: true });
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOAD_DIR),
    filename: (req, file, cb) => cb(null, crypto.randomUUID() + '-' + file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')),
  }),
  limits: { fileSize: 50 * 1024 * 1024 },
});

// Students may submit only Word or PDF files.
const DOC_EXT = ['.pdf', '.doc', '.docx'];
// Ambassador duties may carry a document OR a picture (flyer, poster, photo proof).
const DUTY_ATTACH_EXT = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.gif', '.webp'];
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
    if (ext === '.xlsx') {
      return { text: (await extractXlsxText(fs.readFileSync(full))).slice(0, 60000) || null, name };
    }
    if (['.txt', '.md', '.py', '.js', '.ipynb', '.csv', '.html', '.sql'].includes(ext)) {
      return { text: fs.readFileSync(full, 'utf8').slice(0, 60000), name };
    }
  } catch (e) { console.error('extractText failed:', e.message); }
  return { text: null, name };
}
// Minimal .xlsx reader (an xlsx is a zip of XML): shared strings + every
// worksheet's cells become CSV-ish text the AI layer can read - enough for
// the Excel copilot and for grading BC-07 workbook submissions.
async function extractXlsxText(buffer) {
  const JSZip = require('jszip');
  const zip = await JSZip.loadAsync(buffer);
  const decode = (s) => String(s).replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&');
  let shared = [];
  const ss = zip.file('xl/sharedStrings.xml');
  if (ss) {
    const xml = await ss.async('string');
    shared = [...xml.matchAll(/<si(?:\s[^>]*)?>([\s\S]*?)<\/si>/g)]
      .map((m) => decode([...m[1].matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g)].map((t) => t[1]).join('')));
  }
  const colOf = (ref) => { let n = 0; for (const ch of String(ref).replace(/\d+/g, '')) n = n * 26 + (ch.charCodeAt(0) - 64); return n; };
  const sheets = Object.keys(zip.files).filter((f) => /^xl\/worksheets\/sheet\d+\.xml$/.test(f)).sort();
  const parts = [];
  for (const name of sheets.slice(0, 5)) {
    const xml = await zip.file(name).async('string');
    const rows = [];
    for (const rm of xml.matchAll(/<row[^>]*>([\s\S]*?)<\/row>/g)) {
      const cells = [];
      for (const cm of rm[1].matchAll(/<c\s([^>]*)>([\s\S]*?)<\/c>/g)) {
        const attrs = cm[1], inner = cm[2];
        const ref = (attrs.match(/r="([A-Z]+\d+)"/) || [])[1];
        const type = (attrs.match(/t="(\w+)"/) || [])[1];
        let v = (inner.match(/<v>([\s\S]*?)<\/v>/) || [])[1];
        if (type === 's' && v != null) v = shared[Number(v)] ?? '';
        else if (type === 'inlineStr') v = decode([...inner.matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g)].map((t) => t[1]).join(''));
        else if (v != null) v = decode(v);
        if (v == null) continue;
        const col = ref ? colOf(ref) : cells.length + 1;
        while (cells.length < col - 1) cells.push('');
        cells.push(String(v).replace(/\s+/g, ' ').trim());
      }
      if (cells.some((c) => c !== '')) rows.push(cells.join(', '));
      if (rows.length >= 400) break; // enough context for the AI without flooding it
    }
    if (rows.length) parts.push(`--- Sheet: ${name.replace(/^xl\/worksheets\/|\.xml$/g, '')} ---\n` + rows.join('\n'));
  }
  return parts.join('\n\n');
}

// Baseline security headers on every response. No CSP here on purpose - the
// pages rely on inline scripts and embed the Jitsi iframe, so a strict CSP
// would need per-page work; these headers are the safe, high-value subset.
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  if (isProd) res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});

if (demo.enabled) {
  app.use(require('./demo/read-only').middleware);
  app.get('/', (req, res) => res.type('html').send(require('./demo/landing')()));
  app.get('/api/demo/info', (req, res) => res.json({ read_only: true, accounts: require('./demo/accounts'), password: 'admin' }));
  app.get('/demo-sample.pdf', (req, res) => res.sendFile(path.join(UPLOAD_DIR, 'demo-sample.pdf')));
} else {
  require('./demo/proxy').register(app);
}
app.use(express.json({ limit: '1mb' })); // cap request bodies to blunt large-payload DoS
app.use(cookieParser());

// Perf diagnostics only, opt-in via PERF_DEBUG=1 (no effect otherwise - not
// registered at all, so zero overhead/behavior change by default). Placed
// this early so its timer wraps the whole request, including the
// pendingPersist()-gated response below - that's deliberately the thing
// being measured, not just route-handler CPU time. Pairs with the
// [perf] save()/boot load lines from store.js's persist path.
if (process.env.PERF_DEBUG) {
  const { getQueryCount } = require('./prisma-client');
  app.use((req, res, next) => {
    const t0 = Date.now();
    const q0 = getQueryCount();
    res.on('finish', () => {
      console.log(`[perf] ${req.method} ${req.originalUrl} -> ${res.statusCode} ${Date.now() - t0}ms, ${getQueryCount() - q0} Postgres round trips`);
    });
    next();
  });
}

// In JSON-file mode, store.save() writes to disk synchronously, so by the
// time a route handler calls res.json()/res.send() any mutation it just
// made is already durable - store.pendingPersist() resolves immediately.
// In Postgres mode, store.save() only *queues* the write (pg has no sync
// API), so without this, a client could get a 200 for a write that then
// failed to reach Postgres. This wrapper holds the actual response bytes
// back until that write settles, restoring the same "response means
// durable" guarantee, without touching any of the ~250 route handlers
// that call res.json()/res.send() today.
app.use((req, res, next) => {
  const origJson = res.json.bind(res);
  const origSend = res.send.bind(res);
  // Both guards report failure via origJson specifically (never through
  // `send`) - origSend forwards plain-object bodies to `this.json(...)`
  // internally, which by then would resolve to the guarded res.json and
  // wait on pendingPersist a second time. Harmless in practice (the
  // promise has already settled) but confusing, so it's avoided outright.
  const guard = (send) => (body) => {
    store.pendingPersist().then(
      () => send(body),
      (err) => {
        console.error('Request not acknowledged - a pending write failed to save:', err.message);
        res.status(500);
        origJson({ error: 'Something went wrong while saving. Please try again.' });
      }
    );
    return res;
  };
  res.json = guard(origJson);
  res.send = guard(origSend);
  next();
});

/* ------------------------------ auth helpers ------------------------------ */
const sign = (u) => jwt.sign({ id: u.id, role: u.role, name: u.name, sv: sessionVersion(u, JWT_SECRET) }, JWT_SECRET, { expiresIn: '7d' });
function setAuthCookie(res, token) { res.cookie(COOKIE, token, { httpOnly: true, sameSite: 'lax', secure: isProd, maxAge: 7 * 24 * 60 * 60 * 1000 }); }
function currentUser(req) { const t = req.cookies[COOKIE]; if (!t) return null; try { const payload = jwt.verify(t, JWT_SECRET); const user = Users.byId(payload.id); return validSession(payload, user, JWT_SECRET) ? user : null; } catch { return null; } }
// A deactivated ambassador (HR "removed" them via DELETE /api/hr/ambassadors/:id,
// which deactivates rather than deletes - see store.js's Ambassadors.setActive)
// keeps their `users` row, so a still-valid 7-day session cookie would
// otherwise keep working. Checked here (not baked into currentUser) so every
// other role's lookup stays a single cheap Users.byId with no extra query.
function isDeactivatedAmbassador(u) {
  if (u.role !== 'ambassador') return false;
  const a = Ambassadors.byUserId(u.id);
  return !a || !a.active;
}
function authRequired(req, res, next) {
  const u = currentUser(req);
  if (!u || isDeactivatedAmbassador(u)) return res.status(401).json({ error: 'Please sign in to continue.' });
  req.user = u; if (!demo.enabled) touchActivity(u); next();
}
function adminRequired(req, res, next) { if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access only.' }); next(); }
// Talent Marketplace: a recruiter must be BOTH the right role AND verified
// by an admin - a pending or rejected recruiter account exists (so they
// can sign in and see their status) but is otherwise not a recruiter yet.
function requireRecruiter(req, res, next) {
  if (req.user.role !== 'recruiter') return res.status(403).json({ error: 'Recruiter access only.' });
  if (req.user.status !== 'approved') return res.status(403).json({ error: 'Your recruiter account has not been verified yet.' });
  next();
}
function teacherOrAdmin(req, res, next) { if (!['admin', 'instructor'].includes(req.user.role)) return res.status(403).json({ error: 'Teachers and admins only.' }); next(); }
function staffView(req, res, next) { // admin, coordinator, or the course's teachers may VIEW oversight data
  if (['admin', 'coordinator', 'instructor'].includes(req.user.role)) return next();
  return res.status(403).json({ error: 'Not available for your role.' });
}
// v17: narrow department gates - each isolated role plus admin, nothing else.
function financeOnly(req, res, next) { if (['admin', 'finance'].includes(req.user.role)) return next(); return res.status(403).json({ error: 'Not available for your role.' }); }
function studentCoordinatorOnly(req, res, next) { if (['admin', 'student_coordinator'].includes(req.user.role)) return next(); return res.status(403).json({ error: 'Not available for your role.' }); }
// v18: the Student Coordinator portal is now the Admissions Office. The role
// key stays 'student_coordinator' so existing accounts keep working.
const admissionsOnly = studentCoordinatorOnly;
const ADMISSIONS_EMAIL = process.env.ADMISSIONS_EMAIL || 'admissions@echolens.digital';
const FINANCE_EMAIL = process.env.FINANCE_EMAIL || 'finance@echolens.digital';
const admissionsReminders = createAdmissionsReminders(store, mailer, {
  appUrl: process.env.APP_URL || 'https://www.echolens.digital',
  phone: process.env.ADMISSIONS_EXTENSION_PHONE,
  financeEmail: FINANCE_EMAIL,
});
function hrOnly(req, res, next) { if (['admin', 'hr'].includes(req.user.role)) return next(); return res.status(403).json({ error: 'Not available for your role.' }); }
function ambassadorOnly(req, res, next) { if (req.user.role !== 'ambassador') return res.status(403).json({ error: 'Not available for your role.' }); next(); }
// Ambassador commission reports are shared reading across four departments -
// HR manages the program, Finance and the Admissions Office handle the money
// and enrollments behind the numbers, and admin sees everything.
function ambassadorReportsAccess(req, res, next) {
  if (['admin', 'hr', 'finance', 'student_coordinator'].includes(req.user.role)) return next();
  return res.status(403).json({ error: 'Not available for your role.' });
}
// Departments: HR/admin can manage any department; once a head is named,
// that head can manage their own department end-to-end (roster, tasks,
// announcements) the same way. Loads req.department for the route handler.
function departmentManage(req, res, next) {
  const d = Departments.byId(req.params.id);
  if (!d) return res.status(404).json({ error: 'Department not found.' });
  if (!['admin', 'hr'].includes(req.user.role) && d.head_user_id !== req.user.id) {
    return res.status(403).json({ error: 'Only HR/admin or this department’s head can do that.' });
  }
  req.department = d;
  next();
}
function staffOnly(req, res, next) { if (['admin', 'staff'].includes(req.user.role)) return next(); return res.status(403).json({ error: 'Not available for your role.' }); }
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
// v18: every outgoing email greets with just the first name - "Hi Tahir".
const hi = (name) => `Hi ${String(name || '').trim().split(/\s+/)[0] || 'there'}`;

/* --------------------------------- auth --------------------------------- */
// Generic in-memory IP rate limiter for unauthenticated endpoints. Public
// POST routes are the whole abuse surface of this app: two of them send an
// email on every call, and the rest write a row. Without a cap, a single
// script can burn the SMTP quota (and the sending domain's reputation) or
// flood the leads table.
const RATE_BUCKETS = new Map(); // name -> Map(ip -> { count, first })
function rateLimit(name, { max, windowMs, message }) {
  if (!RATE_BUCKETS.has(name)) RATE_BUCKETS.set(name, new Map());
  const bucket = RATE_BUCKETS.get(name);
  return function limiter(req, res, next) {
    const ip = req.ip || req.connection?.remoteAddress || 'unknown';
    const now = Date.now();
    let rec = bucket.get(ip);
    if (!rec || now - rec.first > windowMs) rec = { count: 0, first: now };
    rec.count += 1;
    bucket.set(ip, rec);
    if (rec.count > max) {
      const mins = Math.max(1, Math.ceil((rec.first + windowMs - now) / 60000));
      res.setHeader('Retry-After', String(mins * 60));
      return res.status(429).json({ error: message || `Too many requests. Please try again in about ${mins} minute${mins === 1 ? '' : 's'}.` });
    }
    next();
  };
}
// Deliberately generous: these must never block a real person filling in a
// form twice, only a script hammering the endpoint.
const limitEmailSend = rateLimit('email-send', { max: 5, windowMs: 15 * 60 * 1000, message: 'Too many verification emails requested. Please wait a few minutes and try again.' });
const limitSignup = rateLimit('signup', { max: 10, windowMs: 60 * 60 * 1000, message: 'Too many sign-up attempts from this network. Please try again later.' });
const limitLead = rateLimit('lead', { max: 20, windowMs: 60 * 60 * 1000, message: 'Too many submissions from this network. Please try again later.' });
const limitFeedback = rateLimit('feedback', { max: 10, windowMs: 60 * 60 * 1000, message: 'Too many submissions from this network. Please try again later.' });
const limitSupportTicket = rateLimit('support-ticket', { max: 5, windowMs: 60 * 60 * 1000, message: 'Too many support tickets were submitted from this network. Please wait before trying again.' });
const limitSupportReply = rateLimit('support-reply', { max: 20, windowMs: 60 * 60 * 1000, message: 'Too many ticket replies were submitted from this network. Please wait before trying again.' });

// Drop expired entries from every throttle map every 10 minutes.
setInterval(() => {
  const now = Date.now();
  for (const [, bucket] of RATE_BUCKETS) {
    for (const [ip, rec] of bucket) if (now - rec.first > 60 * 60 * 1000) bucket.delete(ip);
  }
  for (const [ip, rec] of LOGIN_ATTEMPTS) {
    if (now - rec.first > LOGIN_WINDOW_MS && (!rec.blockedUntil || rec.blockedUntil < now)) LOGIN_ATTEMPTS.delete(ip);
  }
}, 10 * 60 * 1000).unref();

// Simple in-memory brute-force throttle: after too many failed attempts from
// one IP within the window, further attempts are refused until it cools down.
// Successful logins reset the counter. No external dependency needed.
const LOGIN_ATTEMPTS = new Map(); // ip -> { count, first, blockedUntil }
const LOGIN_MAX = 10;             // failures allowed per window
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
function loginThrottle(req, res, next) {
  const ip = req.ip || req.connection?.remoteAddress || 'unknown';
  const now = Date.now();
  const rec = LOGIN_ATTEMPTS.get(ip);
  if (rec && rec.blockedUntil && rec.blockedUntil > now) {
    const mins = Math.ceil((rec.blockedUntil - now) / 60000);
    return res.status(429).json({ error: `Too many sign-in attempts. Try again in about ${mins} minute${mins === 1 ? '' : 's'}.` });
  }
  req._loginIp = ip;
  next();
}
function noteLoginFail(ip) {
  const now = Date.now();
  let rec = LOGIN_ATTEMPTS.get(ip);
  if (!rec || now - rec.first > LOGIN_WINDOW_MS) rec = { count: 0, first: now, blockedUntil: 0 };
  rec.count += 1;
  if (rec.count >= LOGIN_MAX) rec.blockedUntil = now + LOGIN_WINDOW_MS;
  LOGIN_ATTEMPTS.set(ip, rec);
}
app.post('/api/auth/login', loginThrottle, (req, res) => {
  const { login, password } = req.body || {};
  // v18: one email can back accounts in several portals, each with its own
  // category username (tahir@finance.echolens, tahir@hr.echolens, ...).
  // Signing in by email tries the password against every matching account;
  // usernames are unique so they always resolve to exactly one.
  // Google-only accounts have no password_hash at all - bcrypt throws on a
  // null hash rather than just returning false, so guard it explicitly.
  const matches = (login ? Users.allByLogin(login) : [])
    .filter((u) => u.password_hash && bcrypt.compareSync(String(password || ''), u.password_hash));
  if (!matches.length) {
    noteLoginFail(req._loginIp);
    return res.status(401).json({ error: 'Incorrect username or password.' });
  }
  if (matches.length > 1) {
    // Correct password for more than one portal account on this email - the
    // person has proven ownership, so naming their own usernames is safe.
    return res.status(400).json({ error: `This email is linked to accounts in more than one portal. Sign in with the username of the one you want: ${matches.map((u) => u.username).join(', ')}.` });
  }
  const u = matches[0];
  if (isDeactivatedAmbassador(u)) return res.status(401).json({ error: 'This ambassador account has been deactivated. Contact HR.' });
  LOGIN_ATTEMPTS.delete(req._loginIp); // successful sign-in clears the counter
  setAuthCookie(res, sign(u));
  res.json({ ok: true, role: u.role });
});
app.post('/api/auth/logout', (req, res) => { res.clearCookie(COOKIE); res.json({ ok: true }); });
app.get('/api/auth/me', authRequired, (req, res) => {
  const u = req.user;
  res.json({
    id: u.id, name: u.name, role: u.role, username: u.username, email: u.email, reg_no: u.reg_no,
    demo_read_only: demo.enabled,
    avatar: u.avatar || null, signature: u.signature || null,
    profile: u.profile || {}, gamify: ['student', 'free'].includes(u.role) ? gamifyFor(u) : null,
    ai_enabled: ['admin', 'instructor'].includes(u.role) && ai.enabled(),
    onboarding_complete: u.onboarding_complete !== false,
    learner_profile_complete: Users.learnerProfileComplete(u),
    recruiter: u.role === 'recruiter' ? recruiterView(u) : null,
  });
});

/* v18: self-service password reset for open (free) accounts - portal
 * students/staff still go through the admin (see login.html), on purpose:
 * paid-course accounts stay admin-supervised. Tokens are one-time, 30-minute,
 * in-memory - the same lightweight pattern as EMAIL_CODES below. */
const RESET_TOKENS = new Map(); // token -> { userId, expires }
function pruneResetTokens() { const t = Date.now(); for (const [k, v] of RESET_TOKENS) if (v.expires < t) RESET_TOKENS.delete(k); }
app.post('/api/auth/forgot-password', limitEmailSend, async (req, res) => {
  const { email } = req.body || {};
  if (!isEmail(email)) return res.status(400).json({ error: 'Enter a valid email address.' });
  pruneResetTokens();
  // One reply for every outcome so this endpoint can't be used to probe which
  // emails have accounts. Self-service covers free open-website accounts only;
  // LMS portal passwords are reset by the academy - and the message says so
  // instead of pretending an email went out.
  const genericMsg = 'If that email has a free EchoLens account, a reset link is on its way - check your inbox and spam folder. LMS portal passwords are reset by the academy: WhatsApp 0314 1479109 or info@echolens.digital.';
  const u = Users.allByLogin(String(email).trim()).find((x) => x.role === 'free') || null;
  if (!u) return res.json({ ok: true, message: genericMsg });
  const token = crypto.randomBytes(24).toString('hex');
  RESET_TOKENS.set(token, { userId: u.id, expires: Date.now() + 30 * 60000, return_to:safeReturnPath(req.body.returnTo,APP_URL,'/open#free') });
  const link = `${APP_URL}/reset-password?token=${token}`;
  if (mailer.configured) {
    mailer.notify(u.email, 'Reset your EchoLens password',
      `${hi(u.name)},\n\nReset your password here (this link expires in 30 minutes):\n${link}\n\nIf you didn't ask for this, you can ignore this email - your password is unchanged.`);
    return res.json({ ok: true, message: genericMsg });
  }
  // No SMTP on this server. In development, hand the link back so the flow is
  // testable; in production NEVER leak it - returning it would let anyone
  // take over any free account - just log the gap loudly for the operator.
  if (isProd) {
    console.error(`forgot-password: SMTP is not configured - reset email NOT sent for user #${u.id}. Set SMTP_HOST/SMTP_USER/SMTP_PASS.`);
    return res.json({ ok: true, message: genericMsg });
  }
  res.json({ ok: true, message: 'Email is not configured on this server - use this link directly:', dev_link: link });
});
app.post('/api/auth/reset-password', (req, res) => {
  const { token, password } = req.body || {};
  pruneResetTokens();
  const rec = token && RESET_TOKENS.get(String(token));
  if (!rec) return res.status(400).json({ error: 'This reset link is invalid or has expired - request a new one.' });
  if (!password || String(password).length < 8) return res.status(400).json({ error: 'Choose a password of at least 8 characters.' });
  const u = Users.byId(rec.userId);
  if (!u) return res.status(404).json({ error: 'Account not found.' });
  Users.setPassword(u.id, String(password));
  RESET_TOKENS.delete(String(token));
  setAuthCookie(res, sign(u));
  res.json({ ok: true, role: u.role, return_to:rec.return_to||'/open#free' });
});

/* ---------------------------------- me ---------------------------------- */
app.post('/api/me/password', authRequired, (req, res) => {
  const { current, next } = req.body || {};
  if (!next || String(next).length < 8) return res.status(400).json({ error: 'New password must be at least 8 characters.' });
  // Google-only accounts (no password_hash yet) have nothing to verify -
  // this doubles as "set a password" for them, not just "change" it.
  if (req.user.password_hash && !bcrypt.compareSync(String(current || ''), req.user.password_hash)) {
    return res.status(400).json({ error: 'Current password is incorrect.' });
  }
  Users.setPassword(req.user.id, String(next));
  setAuthCookie(res, sign(Users.byId(req.user.id)));
  res.json({ ok: true });
});
app.post('/api/me/profile', authRequired, (req, res) => {
  const clean = {};
  for (const [k, v] of Object.entries(req.body || {})) {
    if ((typeof v === 'string' || v === null) && k.length < 40) clean[k] = String(v ?? '').trim().slice(0, 300);
  }
  const updated = Users.updateProfile(req.user.id, clean);
  res.json({ ok: true, profile:updated.profile });
});

/* v16: admin portal - real system health checks (no fake "all green"). Each
 * check inspects an actual resource this process depends on. */
function systemHealth() {
  const checks = [{ name: 'Web Server', ok: true, detail: `Responding ? up ${Math.round(process.uptime() / 60)}m` }];
  let dbOk = true; try { fs.accessSync(store.DB_PATH, fs.constants.R_OK | fs.constants.W_OK); } catch { dbOk = false; }
  checks.push({ name: 'Database', ok: db.enabled() ? store.flushHealth().consecutiveFlushFailures===0 : dbOk, status:db.enabled()?'configured':'test_mode', detail:db.enabled()?'PostgreSQL connected at startup; see flush status below.':'Local JSON store; PostgreSQL integration is not active.' });
  let storageOk = true; try { fs.accessSync(UPLOAD_DIR, fs.constants.R_OK | fs.constants.W_OK); } catch { storageOk = false; }
  checks.push({ name: 'Storage', ok: storageOk, detail: storageOk ? 'Uploads folder writable' : 'Uploads folder not writable' });
  checks.push({ name: 'Email Service', ok: mailer.configured, status:mailer.configured?'configured':'disabled', detail: mailer.configured ? 'SMTP configured' : 'SMTP not configured - emails are logged only' });
  const mailStatus = mailer.status();
  checks.push({
    name: 'Bulk Mail (outreach)', status:mailStatus.bulk.dryRun?'test_mode':mailStatus.bulk.configured?'configured':'disabled',
    ok: mailStatus.bulk.configured || mailStatus.bulk.dryRun,
    detail: mailStatus.bulk.dryRun
      ? `DRY RUN - blasts are logged, not sent (MAIL_DRY_RUN). Provider: ${mailStatus.bulk.provider || 'none'}${mailStatus.bulk.configured ? ', configured' : ', NOT configured'}`
      : (mailStatus.bulk.configured ? `Live via ${mailStatus.bulk.provider}` : `Provider ${mailStatus.bulk.provider || 'none'} NOT configured - blasts will refuse`),
  });
  let backupOk = false, backupDetail = 'No backups yet', lastBackup = null;
  if (db.enabled()) {
    // Postgres mode: the real backup is the scheduled pg_dump GitHub Action
    // (scripts/backup-pg-dump.js), which runs off this instance entirely and
    // only leaves behind a small local status marker - see U1a/U1b in
    // RESTORE.md for why this replaced the old JSON-snapshot copy check.
    try {
      const statusPath = path.join(path.dirname(store.DB_PATH), 'backups', 'pg-dump-status.json');
      const status = JSON.parse(fs.readFileSync(statusPath, 'utf8'));
      lastBackup = status.at;
      backupOk = !!status.ok && Date.now() - new Date(status.at).getTime() < 36 * 3600000; // 36h: daily job + margin
      backupDetail = !status.ok
        ? `Last pg_dump run FAILED: ${status.error || 'unknown error'}`
        : backupOk ? `pg_dump backed up ${(status.bytes / 1024 / 1024).toFixed(1)}MB within the last 36h` : 'Last successful pg_dump was over 36h ago';
    } catch { backupDetail = 'No pg_dump backup recorded yet - see RESTORE.md'; }
  } else {
    try {
      const dir = path.join(path.dirname(store.DB_PATH), 'backups');
      const files = fs.readdirSync(dir).filter((f) => f.endsWith('.json'));
      if (files.length) {
        const latest = files.map((f) => fs.statSync(path.join(dir, f)).mtimeMs).sort((a, b) => b - a)[0];
        lastBackup = new Date(latest).toISOString();
        backupOk = Date.now() - latest < 24 * 3600000;
        backupDetail = backupOk ? 'Backed up within the last 24h' : 'Last backup was over 24h ago';
      }
    } catch { /* backups directory not created yet */ }
  }
  checks.push({ name: 'Backup Service', ok: backupOk, detail: backupDetail, last_backup: lastBackup });
  // Postgres-only (see step 5's architecture note on store.js's flush
  // model) - nothing to report in JSON-file mode, where save() writes
  // synchronously and there is no queued/batched flush to fail.
  if (db.enabled()) {
    const fh = store.flushHealth();
    const ok = fh.consecutiveFlushFailures === 0;
    const detail = ok
      ? (fh.lastSuccessfulFlushAt ? `Last flush ${fh.secondsSinceLastSuccessfulFlush}s ago` : 'No writes flushed yet this process')
      : `${fh.consecutiveFlushFailures} consecutive failure(s) - persistence may be wedged. Last: ${fh.lastFailure?.collection || '?'} (${fh.lastFailure?.code || 'unknown'})`;
    checks.push({ name: 'Postgres Flush', ok, detail, flush: fh });
  }
  checks.push({name:'Automated grading',ok:ai.enabled(),status:ai.enabled()?'configured':'disabled',detail:ai.enabled()?'Provider configured; check attempt outcomes for delivery.':'Unavailable; saved attempts can be reviewed by an administrator.'});
  return checks;
}

/* -------------------------------- overview -------------------------------- */
app.get('/api/overview', authRequired, (req, res) => {
  const u = req.user;
  const base = {
    courses: coursesForUser(u),
    upcoming: Sessions.upcomingForUser(u).slice(0, 6),
    announcements: Announcements.forUser(u).slice(0, 5),
  };
  if (u.role === 'admin' || u.role === 'coordinator') {
    return res.json({
      ...base, admin: Admin.overview(), dashboard: Admin.dashboard(), system_health: systemHealth(),
      leaderboard: studentLeaderboard().slice(0, 10),
    });
  }
  if (u.role === 'instructor') {
    const myBatches = base.courses;
    const pending = myBatches.reduce((sum, b) => sum + Quests.pendingCount(b.id), 0);
    const todayStr = new Date().toISOString().slice(0, 10);
    const todaySessions = Sessions.upcomingForUser(u).filter((s) => s.session_date === todayStr);

    // Assignments to review: pending submissions grouped by quest level, across every course taught.
    const reviewRows = [];
    myBatches.forEach((b) => {
      const pendingSubs = Quests.pendingSubmissionsForBatch(b.id);
      if (!pendingSubs.length) return;
      const byQuest = new Map();
      pendingSubs.forEach((s) => {
        if (!byQuest.has(s.quest_id)) byQuest.set(s.quest_id, { quest_id: s.quest_id, pid: s.pid, level: s.level, title: s.quest_title, to_review: 0, students: new Set() });
        const row = byQuest.get(s.quest_id);
        row.to_review += 1; row.students.add(s.student_id);
      });
      const totalStudents = Enrollments.studentsForBatch(b.id).length;
      byQuest.forEach((row) => {
        reviewRows.push({
          batch_id: b.id, course_title: b.title || b.name, quest_id: row.quest_id, pid: row.pid,
          title: `${b.title || b.name} · Level ${row.level}: ${row.title}`,
          submitted: row.students.size, total: totalStudents, to_review: row.to_review,
        });
      });
    });
    reviewRows.sort((a, b) => b.to_review - a.to_review);

    // Active students: everyone enrolled across every course this teacher teaches.
    const studentIds = new Set();
    myBatches.forEach((b) => Enrollments.studentsForBatch(b.id).forEach((s) => studentIds.add(s.id)));

    // Avg class progress: mean of each enrolled student's quest completion %.
    let progSum = 0, progCount = 0;
    myBatches.forEach((b) => {
      if (!Quests.installed(b.id)) return;
      Enrollments.studentsForBatch(b.id).forEach((s) => {
        const prog = Quests.progress(s.id, b.id);
        if (!prog || !prog.levels.length) return;
        progSum += (prog.levels.filter((l) => l.passed).length / prog.levels.length) * 100;
        progCount += 1;
      });
    });

    return res.json({
      ...base,
      teaching: {
        pending_to_grade: pending,
        today_sessions: todaySessions,
        assignments_to_review: reviewRows.slice(0, 8),
        active_students: studentIds.size,
        avg_progress: progCount ? Math.round(progSum / progCount) : 0,
      },
      leaderboard: studentLeaderboard().slice(0, 10),
    });
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

/* v13: cross-course aggregators for the student portal redesign - the quest/
 * quiz/lesson systems are all strictly per-batch, so these merge them across
 * every course a student is enrolled in for the new Overview/Assignments/
 * Quizzes/Resources views. */
app.get('/api/my/courses', authRequired, (req, res) => {
  if (req.user.role !== 'student') return res.json({ courses: [] });
  const courses = coursesForUser(req.user).map((b) => {
    const installed = Quests.installed(b.id);
    const prog = installed ? Quests.progress(req.user.id, b.id) : null;
    const total = prog ? prog.levels.length : 0;
    const passed = prog ? prog.levels.filter((l) => l.passed).length : 0;
    const nextLevel = prog ? (prog.levels.find((l) => !l.passed && l.unlocked) || null) : null;
    return {
      ...b,
      progress_pct: total ? Math.round((passed / total) * 100) : 0,
      next_level: nextLevel ? { no: nextLevel.quest.no, title: nextLevel.quest.title, deadline: nextLevel.quest.deadline } : null,
      lesson_count: Lessons.forBatch(b.id).length,
    };
  });
  res.json({ courses });
});
app.get('/api/my/recommended', authRequired, (req, res) => {
  if (req.user.role !== 'student') return res.json({ courses: [] });
  const myCodes = new Set(coursesForUser(req.user).map((b) => Courses.byId(b.course_id)?.code).filter(Boolean));
  const rank = { flagship: 0, high_demand: 1, new: 2, free: 3 };
  const out = officialCatalogue()
    .filter((c) => !myCodes.has(c.code))
    .sort((a, b) => Math.min(...(a.badges || []).map((x) => rank[x] ?? 9), 9) - Math.min(...(b.badges || []).map((x) => rank[x] ?? 9), 9))
    .slice(0, 6);
  res.json({ courses: out });
});

/* v15: teacher portal - cross-course aggregators. The quest/attendance/report
 * systems are all per-batch, so these merge them across every course a
 * teacher teaches for the new Students/Grades/Attendance/Analytics pages. */
function teacherBatches(req) {
  if (!['instructor', 'admin', 'coordinator'].includes(req.user.role)) return null;
  return coursesForUser(req.user);
}
app.get('/api/teacher/students', authRequired, (req, res) => {
  const batches = teacherBatches(req);
  if (!batches) return res.status(403).json({ error: 'Not available for your role.' });
  const rows = [];
  batches.forEach((b) => {
    courseReport(b.id).students.forEach((s) => rows.push({ ...s, batch_id: b.id, course_title: b.title || b.name }));
  });
  rows.sort((a, b) => a.name.localeCompare(b.name));
  res.json({ students: rows, courses: batches.map((b) => ({ id: b.id, title: b.title || b.name })) });
});
app.get('/api/teacher/grades', authRequired, (req, res) => {
  const batches = teacherBatches(req);
  if (!batches) return res.status(403).json({ error: 'Not available for your role.' });
  const rows = [];
  batches.forEach((b) => {
    Quests.pendingSubmissionsForBatch(b.id).forEach((s) => rows.push({ ...s, batch_id: b.id, course_title: b.title || b.name }));
  });
  rows.sort((a, b) => String(a.submitted_at).localeCompare(b.submitted_at));
  res.json({ pending: rows });
});
app.get('/api/teacher/attendance', authRequired, (req, res) => {
  const batches = teacherBatches(req);
  if (!batches) return res.status(403).json({ error: 'Not available for your role.' });
  const courses = batches.map((b) => {
    const active = Sessions.active(b.id);
    const past = Sessions.held(b.id).slice(0, 15).map((s) => {
      const sheet = Attendance.sheet(s);
      const present = sheet.filter((r) => r.present).length;
      return { id: s.id, title: s.title, date: s.session_date, present, absent: sheet.length - present, total: sheet.length };
    });
    const avg_rate = past.length ? Math.round((past.reduce((s, c) => s + (c.total ? c.present / c.total : 0), 0) / past.length) * 100) : null;
    return { batch_id: b.id, course_title: b.title || b.name, total_students: Enrollments.studentsForBatch(b.id).length, active: active ? { id: active.id, title: active.title } : null, past, avg_rate };
  });
  res.json({ courses });
});
app.get('/api/teacher/analytics', authRequired, (req, res) => {
  const batches = teacherBatches(req);
  if (!batches) return res.status(403).json({ error: 'Not available for your role.' });
  const courses = batches.map((b) => {
    const rep = courseReport(b.id);
    const graded = rep.students.filter((s) => s.avg != null);
    const avg_grade = graded.length ? Math.round(graded.reduce((s, x) => s + x.avg, 0) / graded.length) : null;
    const withLevels = rep.students.filter((s) => s.of_levels);
    const avg_progress = withLevels.length ? Math.round(withLevels.reduce((s, x) => s + (x.level / x.of_levels) * 100, 0) / withLevels.length) : 0;
    return {
      batch_id: b.id, course_title: b.title || b.name, students: rep.students.length,
      avg_grade, avg_progress, at_risk: rep.students.filter((s) => s.at_risk).length,
      total_gems: rep.students.reduce((s, x) => s + x.gems, 0),
    };
  });
  const studentIds = new Set();
  batches.forEach((b) => Enrollments.studentsForBatch(b.id).forEach((s) => studentIds.add(s.id)));
  res.json({ courses, total_students: studentIds.size, top_learners: studentLeaderboard().slice(0, 10) });
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
  const staff = ['admin', 'coordinator', 'instructor'].includes(u.role);
  // Each session carries its own built-in class room; once it has been
  // started at least once, attach an attendance summary so the Classes tab
  // can show present/absent counts without a separate round trip.
  const sessions = Sessions.forBatch(b.id).map((s) => {
    const row = { ...s };
    if (s.started_at) {
      const sheet = Attendance.sheet(s);
      const present = sheet.filter((r) => r.present).length;
      row.attendance_summary = { present, absent: sheet.length - present, total: sheet.length };
      if (!staff) row.me_present = sheet.some((r) => r.id === u.id && r.present);
    }
    return row;
  });
  const out = {
    batch: b,
    sessions,
    lessons: Lessons.forBatch(b.id),
    announcements: Announcements.forUser(u).filter((a) => a.batch_id === b.id),
    can_manage: canManageBatch(u, req.batch),
    leaderboard: batchLeaderboard(b.id).slice(0, 10),
  };
  if (u.role === 'student') {
    out.my_gems_here = gemsForStudentInBatch(u.id, b.id);
    out.my_rate = Attendance.rate(u.id, b.id);
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
// Add students: new by name + real email (credentials generated and mailed
// there - a candidate's login username is never a real inbox, so a genuine
// email is required for every new account) or existing by reg no / username.
app.post('/api/batches/:id/students', authRequired, adminRequired, async (req, res) => {
  const b = Batches.byId(req.params.id);
  if (!b) return res.status(404).json({ error: 'Course not found.' });
  const { names, existing } = req.body || {};
  const created = [], added = [], missing = [], invalid = [];
  for (const raw of Array.isArray(names) ? names : []) {
    // Each line: "Full Name, email@domain" - the email is mandatory so the
    // generated password and registration number can always be mailed to
    // the candidate directly.
    const parts = String(raw).split(',').map((x) => x.trim());
    const name = parts[0]; if (!name) continue;
    const email = (parts[1] || '').toLowerCase();
    if (!isEmail(email)) { invalid.push(`${raw} - missing or invalid email`); continue; }
    if (!(await emailDomainExists(email))) { invalid.push(`${raw} - that email domain does not receive mail`); continue; }
    if (Users.allByLogin(email).some((u) => ['student', 'free'].includes(u.role))) { invalid.push(`${raw} - a learner account with this email already exists (add them as an existing student instead)`); continue; }
    const { user, password } = Users.create({ name, role: 'student', email, username: email });
    Enrollments.create(user.id, b.id);
    created.push({ name: user.name, username: user.username, reg_no: user.reg_no, password, email, emailed: mailer.configured });
    const bd = Batches.decorate(b);
    mailer.notify(email, 'Welcome to EchoLens - your account',
      `${hi(user.name)},\n\nYour EchoLens account is ready for ${bd.title || bd.name}.\n\nRegistration number: ${user.reg_no}\nUsername: ${user.username}\nEmail: ${user.email}\nPassword: ${password}\n\nSign in at ${APP_URL} with your username or email and change your password from Profile after your first login.`);
  }
  for (const raw of Array.isArray(existing) ? existing : []) {
    const u = Users.byLogin(String(raw).trim());
    if (u && u.role === 'student') { Enrollments.create(u.id, b.id); added.push({ name: u.name, reg_no: u.reg_no }); }
    else missing.push(String(raw).trim());
  }
  res.json({ ok: true, created, added, missing, invalid });
});
app.delete('/api/batches/:id/students/:uid', authRequired, adminRequired, (req, res) => {
  Enrollments.remove(req.params.uid, req.params.id); res.json({ ok: true });
});
// Teachers: several per course. Add a new teacher by name, or an existing one by id/username.
// Assigning (not managing content/grading) is also open to student_coordinator,
// so one instructor can be put on multiple courses by admin or Admissions Office.
function canAssignInstructors(req, res, next) { if (['admin', 'student_coordinator'].includes(req.user.role)) return next(); return res.status(403).json({ error: 'Not available for your role.' }); }
app.post('/api/batches/:id/teachers', authRequired, canAssignInstructors, (req, res) => {
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
app.delete('/api/batches/:id/teachers/:uid', authRequired, canAssignInstructors, (req, res) => {
  const b = Batches.byId(req.params.id);
  if (!b) return res.status(404).json({ error: 'Course not found.' });
  Batches.removeTeacher(b.id, req.params.uid); res.json({ ok: true });
});

/* ------------------------------ users (admin) ------------------------------ */
app.get('/api/admin/users', authRequired, staffView, (req, res) => {
  res.json({
    users: Users.all().map((u) => ({
      id: u.id, name: u.name, role: u.role, username: u.username, email: u.email, reg_no: u.reg_no,
      gems: ['student', 'free'].includes(u.role) ? totalGemsForStudent(u.id) : null,
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
// Portal staff accounts are generated from a name + email; the credentials
// (username, password, sign-in link) are emailed to that address directly.
const STAFF_ROLE_LABEL = { coordinator: 'Coordinator', hr: 'HR', finance: 'Finance', student_coordinator: 'Admissions Office', ambassador: 'Ambassador', instructor: 'Instructor', staff: 'Staff' };
function mailStaffCredentials(user, password, role) {
  if (!user.email) return;
  mailer.notify(user.email, `Your EchoLens ${STAFF_ROLE_LABEL[role] || 'portal'} account`,
    `${hi(user.name)},\n\nYour EchoLens ${STAFF_ROLE_LABEL[role] || 'portal'} account is ready.\n\nUsername: ${user.username}\nEmail: ${user.email}\nPassword: ${password}\n\nSign in at ${APP_URL}/login with your username or email, and change your password from Settings after your first login.`);
}
// The email is mandatory and must be exact: the account is generated FROM it
// (username = local part @ department domain) and the credentials are mailed
// to that same address. One email may hold accounts in several portals, so
// only a duplicate within the SAME role is refused.
async function validateStaffEmail(email, res, role) {
  const em = String(email || '').trim().toLowerCase();
  if (!isEmail(em)) { res.status(400).json({ error: 'A valid email is required - the account is generated from it and the username and password are mailed there.' }); return null; }
  if (!(await emailDomainExists(em))) { res.status(400).json({ error: 'That email domain does not receive mail - check the spelling, the credentials must reach this inbox.' }); return null; }
  if (Users.allByLogin(em).some((u) => u.role === role)) { res.status(400).json({ error: `This email already has an account in this portal (${STAFF_ROLE_LABEL[role] || role}). The same email can be added to other portals, but only once per portal.` }); return null; }
  return em;
}
app.post('/api/admin/coordinators', authRequired, adminRequired, async (req, res) => {
  const { name, email } = req.body || {};
  if (!name || !String(name).trim()) return res.status(400).json({ error: 'A name is required.' });
  const em = await validateStaffEmail(email, res, 'coordinator'); if (!em) return;
  const { user, password } = Users.create({ name: String(name).trim(), role: 'coordinator', email: em, username: em });
  mailStaffCredentials(user, password, 'coordinator');
  res.json({ ok: true, credentials: { name: user.name, username: user.username, password }, emailed: true });
});
// v17: department portals - HR, Finance, Student Coordinator. Distinct from
// 'coordinator' (broad read-only academic oversight, unchanged above): each
// of these roles is isolated to its own portal only, credentials issued by
// name + email exactly like the coordinator flow.
const DEPT_ROLE_ENDPOINTS = {
  hr: '/api/admin/hr',
  finance: '/api/admin/finance',
  student_coordinator: '/api/admin/student-coordinators',
};
for (const [role, path_] of Object.entries(DEPT_ROLE_ENDPOINTS)) {
  app.post(path_, authRequired, adminRequired, async (req, res) => {
    const { name, email } = req.body || {};
    if (!name || !String(name).trim()) return res.status(400).json({ error: 'A name is required.' });
    const em = await validateStaffEmail(email, res, role); if (!em) return;
    const { user, password } = Users.create({ name: String(name).trim(), role, email: em, username: em });
    mailStaffCredentials(user, password, role);
    res.json({ ok: true, credentials: { name: user.name, username: user.username, password }, emailed: true });
  });
}

/* ------------------------------- ambassadors -------------------------------
 * HR creates ambassadors from a name + email (+ their university); a real
 * portal login is issued alongside a unique 4-digit referral code, and both
 * are emailed together with a QR code that pre-fills the code on the
 * open-web registration form. Students entering the code get 10% off,
 * verified automatically, and the ambassador earns gems once that student is
 * actually enrolled (see enrollRegistrationIntoBatch), weighted by how hard
 * that course category is to sell (Settings.ambassadorGemRates). */
async function ambassadorQrAttachment(code) {
  const buf = await QRCode.toBuffer(`${APP_URL}/open?amb=${code}`, { width: 320, margin: 1 });
  return { filename: `ambassador-${code}-qr.png`, content: buf };
}
app.get('/api/hr/ambassadors', authRequired, hrOnly, (req, res) => {
  res.json({ ambassadors: Ambassadors.all().map((a) => ({ ...a, uses: Ambassadors.usesFor(a.code) })) });
});
app.post('/api/hr/ambassadors', authRequired, hrOnly, async (req, res) => {
  const { name, email, university } = req.body || {};
  if (!name || String(name).trim().length < 2) return res.status(400).json({ error: "Enter the ambassador's full name." });
  const em = await validateStaffEmail(email, res, 'ambassador'); if (!em) return;
  const { user, password } = Users.create({ name: String(name).trim(), role: 'ambassador', email: em, username: em });
  const a = Ambassadors.create({ name, email: em, university, user_id: user.id }, req.user.id);
  const ambassadorsDept = Departments.byName('Ambassadors');
  if (ambassadorsDept) DepartmentMembers.add(ambassadorsDept.id, user.id, req.user.id);
  let attachments;
  try { attachments = [await ambassadorQrAttachment(a.code)]; } catch { attachments = undefined; }
  mailer.notify(a.email, 'Your EchoLens ambassador account',
    `${hi(a.name)},\n\nWelcome aboard - you are now an EchoLens ambassador. Your portal account is ready:\n\nUsername: ${user.username}\nEmail: ${user.email}\nPassword: ${password}\n\nSign in at ${APP_URL}/login to see your duties, referrals and leaderboard rank.\n\nYour personal referral code is:\n\n    ${a.code}\n\nShare it (or the attached QR code, which opens the registration form with your code already filled in) with students: anyone who registers with it gets 10% off their course fee, and once they're enrolled you earn gems.\n\nEchoLens Digital`,
    attachments);
  res.json({ ok: true, ambassador: a, credentials: { name: user.name, username: user.username, password } });
});
app.delete('/api/hr/ambassadors/:id', authRequired, hrOnly, (req, res) => {
  // Deactivates rather than deletes: their user account, referral history,
  // gem events and commission reports all stay on record (HR asked that
  // former ambassadors be kept, like past batches/employees, just no longer
  // shown as current). Ambassadors.setActive(false) alone already stops the
  // referral code from being accepted (byCode filters on `active`) and drops
  // them off the visible department roster (see departmentDetail below);
  // authRequired and the login route below both also check `active` so an
  // already-issued session cookie can't keep the portal open past removal.
  const a = Ambassadors.setActive(req.params.id, false);
  if (!a) return res.status(404).json({ error: 'Ambassador not found.' });
  res.json({ ok: true });
});
app.post('/api/hr/ambassadors/:id/reactivate', authRequired, hrOnly, (req, res) => {
  const a = Ambassadors.setActive(req.params.id, true);
  if (!a) return res.status(404).json({ error: 'Ambassador not found.' });
  res.json({ ok: true, ambassador: a });
});
app.get('/api/hr/ambassadors/gem-rates', authRequired, hrOnly, (req, res) => res.json({ rates: Settings.ambassadorGemRates() }));
app.put('/api/hr/ambassadors/gem-rates', authRequired, hrOnly, (req, res) => res.json({ ok: true, rates: Settings.setAmbassadorGemRates(req.body || {}) }));
// Ambassador duty/task assignment now lives in the generic Departments
// system (see below) - the "Ambassadors" department is auto-seeded and
// every ambassador is auto-added to it in POST /api/hr/ambassadors above.

/* ------------------------------- instructors (HR hire) -------------------------------
 * HR creates instructors from a name + email, exactly like ambassadors: a
 * portal login is issued and auto-added to the "Teachers" department. This
 * is distinct from the older quick teacher-picker at
 * POST /api/batches/:id/teachers (admin-only, no email/onboarding/contract) -
 * that endpoint stays as a fast in-course fallback. An instructor hired here
 * goes through onboarding (POST /api/me/onboarding) with mandatory
 * qualification documents, which auto-generates and emails their contract. */
function instructorLite(u) {
  const batches = Batches.all().filter((b) => (b.instructor_ids || []).includes(u.id))
    .map((b) => ({ id: b.id, code: b.code, name: b.name, title: b.title, status: b.status }));
  return { id: u.id, name: u.name, email: u.email, instructor_tag: (u.profile || {}).instructor_tag || null, batches };
}
app.get('/api/hr/instructors', authRequired, hrOnly, (req, res) => {
  res.json({ instructors: Users.all().filter((u) => u.role === 'instructor').map(instructorLite) });
});
app.post('/api/hr/instructors', authRequired, hrOnly, async (req, res) => {
  const { name, email } = req.body || {};
  if (!name || String(name).trim().length < 2) return res.status(400).json({ error: "Enter the instructor's full name." });
  const em = await validateStaffEmail(email, res, 'instructor'); if (!em) return;
  const { user, password } = Users.create({ name: String(name).trim(), role: 'instructor', email: em, username: em });
  const teachers = Departments.byName('Teachers');
  if (teachers) DepartmentMembers.add(teachers.id, user.id, req.user.id);
  mailStaffCredentials(user, password, 'instructor');
  res.json({ ok: true, credentials: { name: user.name, username: user.username, password }, emailed: true });
});
// HR-set short specialization highlight (e.g. "AI Automation Instructor",
// "Web Developer") - shown to admin/student_coordinator when assigning
// instructors to courses.
app.put('/api/hr/instructors/:userId/tag', authRequired, hrOnly, (req, res) => {
  const target = Users.byId(req.params.userId);
  if (!target || target.role !== 'instructor') return res.status(404).json({ error: 'Instructor not found.' });
  Users.setInstructorTag(target.id, (req.body || {}).tag);
  res.json({ ok: true, instructor: instructorLite(target) });
});
// Read-only instructor directory + a lightweight batch list, for the
// "assign instructor to course" picker - open to admin/hr/student_coordinator
// without exposing the full course-management surface (grading, lessons,
// content stay admin+assigned-instructor only, per canManageBatch).
app.get('/api/instructors-lite', authRequired, (req, res) => {
  if (!['admin', 'hr', 'student_coordinator'].includes(req.user.role)) return res.status(403).json({ error: 'Not available for your role.' });
  res.json({ instructors: Users.all().filter((u) => u.role === 'instructor').map(instructorLite) });
});
app.get('/api/course-batches-lite', authRequired, (req, res) => {
  if (!['admin', 'hr', 'student_coordinator'].includes(req.user.role)) return res.status(403).json({ error: 'Not available for your role.' });
  res.json({ batches: Batches.all().map((b) => ({ id: b.id, code: b.code, title: b.title, name: b.name, status: b.status, teachers: b.teachers })) });
});

/* --------------------- ambassador monthly commission reports ---------------------
 * On the 5th of every month, one PDF per active ambassador is generated on
 * the real company letterhead, covering the previous calendar month's
 * confirmed payments, and emailed to them. HR can also trigger this on
 * demand (e.g. to backfill a missed month or regenerate one). */
function previousPeriod(d) {
  const y = d.getFullYear(), m = d.getMonth(); // month is 0-based; m-1 with y rollover via Date
  const prev = new Date(y, m - 1, 1);
  return `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`;
}
async function generateAmbassadorReports(period, { force = false } = {}) {
  let generated = 0;
  const signoff = { ...Settings.ambassadorReportSignoff(), ceo_name: Settings.cert().ceo_name };
  for (const a of Ambassadors.all().filter((x) => x.active)) {
    if (!force && AmbassadorReports.existsFor(a.id, period)) continue;
    const rows = Ambassadors.monthlyRows(a.code, period);
    const buf = await ambassadorReportPdf({ ambassador: a, period, rows, signoff });
    const filename = `ambassador-${a.id}-${period}.pdf`;
    fs.writeFileSync(path.join(AMBASSADOR_REPORTS_DIR, filename), buf);
    if (force) AmbassadorReports.removeExisting(a.id, period);
    const total_paid = rows.reduce((s, r) => s + r.amount_paid, 0);
    const total_commission = rows.reduce((s, r) => s + r.commission, 0);
    AmbassadorReports.create({ ambassador_id: a.id, period, filename, student_count: rows.length, total_paid, total_commission });
    generated += 1;
    mailer.notify(a.email, `Your EchoLens commission report - ${period}`,
      `${hi(a.name)},\n\nYour ambassador commission report for ${period} is attached: ${rows.length} referral${rows.length === 1 ? '' : 's'} paid, totalling ${total_commission.toLocaleString('en-US')} PKR in commission.\n\nSign in at ${APP_URL}/login to view or re-download it any time from your portal.\n\nEchoLens Digital`,
      [{ filename, content: buf }]);
  }
  return { generated, period };
}
// Runs hourly; only acts on the 5th, and only once per calendar month
// (Settings.ambassadorReportLastRun guards against a restart re-triggering
// it the same day).
function checkAmbassadorReportSchedule() {
  const now = new Date();
  if (now.getDate() !== 5) return;
  const runKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  if (Settings.ambassadorReportLastRun() === runKey) return;
  generateAmbassadorReports(previousPeriod(now))
    .then(({ generated, period }) => { Settings.setAmbassadorReportLastRun(runKey); console.log(`Ambassador reports: generated ${generated} for ${period}.`); })
    .catch((e) => console.error('Ambassador report generation failed:', e.message));
}
if (!demo.enabled) {
  setTimeout(checkAmbassadorReportSchedule, 10 * 1000);
  setInterval(checkAmbassadorReportSchedule, 60 * 60 * 1000);
}

// Shared across HR, Finance, the Admissions Office and admin - see
// ambassadorReportsAccess. Only the sign-off names (below) stay HR-only.
app.get('/api/ambassador-reports', authRequired, ambassadorReportsAccess, (req, res) => {
  const rows = AmbassadorReports.all().map((r) => ({ ...r, ambassador: (Ambassadors.byId(r.ambassador_id) || {}).name || 'Removed ambassador' }));
  res.json({ reports: rows });
});
app.post('/api/ambassador-reports/generate', authRequired, ambassadorReportsAccess, async (req, res) => {
  const period = /^\d{4}-\d{2}$/.test((req.body || {}).period) ? req.body.period : previousPeriod(new Date());
  try { res.json({ ok: true, ...(await generateAmbassadorReports(period, { force: true })) }); }
  catch (e) { res.status(500).json({ error: 'Could not generate reports - try again.' }); }
});
app.get('/api/ambassador-reports/:id/download', authRequired, ambassadorReportsAccess, (req, res) => {
  const r = AmbassadorReports.byId(req.params.id);
  if (!r) return res.status(404).json({ error: 'Report not found.' });
  res.download(path.join(AMBASSADOR_REPORTS_DIR, r.filename), r.filename);
});
app.post('/api/ambassador-reports/:id/email', authRequired, ambassadorReportsAccess, (req, res) => {
  const r = AmbassadorReports.byId(req.params.id);
  if (!r) return res.status(404).json({ error: 'Report not found.' });
  const to = String((req.body || {}).to || '').trim();
  if (!isEmail(to)) return res.status(400).json({ error: 'Enter a valid email address.' });
  const amb = Ambassadors.byId(r.ambassador_id);
  let buf;
  try { buf = fs.readFileSync(path.join(AMBASSADOR_REPORTS_DIR, r.filename)); }
  catch { return res.status(404).json({ error: 'The report file is missing - try regenerating it.' }); }
  mailer.notify(to, `EchoLens ambassador commission report - ${amb ? amb.name : 'ambassador'} - ${r.period}`,
    `Attached: the commission report for ${amb ? amb.name : 'this ambassador'} covering ${r.period} - ${r.student_count} referral${r.student_count === 1 ? '' : 's'} paid, PKR ${Number(r.total_commission).toLocaleString('en-US')} commission due.\n\nShared by ${req.user.name} (${req.user.email || req.user.username}) from the EchoLens portal.\n\nEchoLens Digital`,
    [{ filename: r.filename, content: buf }]);
  res.json({ ok: true });
});
app.get('/api/ambassador-reports/signoff', authRequired, ambassadorReportsAccess, (req, res) => res.json({ signoff: Settings.ambassadorReportSignoff(), ceo_name: Settings.cert().ceo_name }));
app.put('/api/ambassador-reports/signoff', authRequired, hrOnly, (req, res) => res.json({ ok: true, signoff: Settings.setAmbassadorReportSignoff(req.body || {}) }));

/* ============================== departments ==============================
 * Generic org-structure layer: HR/admin create departments (Ambassadors,
 * Teachers, Interns, Staff are seeded by default - see migrate() in
 * store.js - plus any custom ones), add/remove members, and name a head.
 * Once named, the head manages their own department (roster, tasks,
 * announcements) exactly like HR can - see departmentManage above. */
function departmentDetail(d) {
  return {
    ...d,
    members: DepartmentMembers.forDepartment(d.id)
      .map((m) => ({ m, amb: Ambassadors.byUserId(m.user_id) }))
      // A deactivated ambassador (HR "removed" them - see DELETE
      // /api/hr/ambassadors/:id) stays a department_members row so their
      // history is intact, but drops off the roster HR actually sees.
      .filter(({ amb }) => !amb || amb.active)
      .map(({ m, amb }) => {
        const staffRecord = m.user.role === 'staff' ? StaffRecords.byUserId(m.user_id) : null;
        const contract = ['ambassador', 'instructor'].includes(m.user.role) ? Contracts.byUserId(m.user_id) : null;
        return {
          user_id: m.user_id, name: m.user.name, role: m.user.role, email: m.user.email,
          ambassador: amb ? { id: amb.id, code: amb.code, gems: amb.gems, university: amb.university } : null,
          instructor_tag: m.user.role === 'instructor' ? ((m.user.profile || {}).instructor_tag || null) : undefined,
          employment_type: staffRecord ? staffRecord.employment_type : undefined,
          contract_status: contract ? contract.status : undefined,
        };
      }),
    tasks: DepartmentTasks.forDepartment(d.id),
    announcements: DepartmentAnnouncements.forDepartment(d.id),
  };
}
app.get('/api/hr/departments', authRequired, hrOnly, (req, res) => {
  // Matches departmentDetail's own filter below: a deactivated ambassador
  // still has a department_members row (their history is kept) but
  // shouldn't count toward the roster HR sees.
  const activeMemberCount = (id) => DepartmentMembers.forDepartment(id)
    .filter((m) => { const amb = Ambassadors.byUserId(m.user_id); return !amb || amb.active; }).length;
  res.json({ departments: Departments.all().map((d) => ({ ...d, member_count: activeMemberCount(d.id) })) });
});
app.post('/api/hr/departments', authRequired, hrOnly, (req, res) => {
  const { name } = req.body || {};
  if (!name || !String(name).trim()) return res.status(400).json({ error: 'A name is required.' });
  if (Departments.byName(name)) return res.status(400).json({ error: 'A department with this name already exists.' });
  res.json({ ok: true, department: Departments.create({ name }, req.user.id) });
});
app.put('/api/hr/departments/:id', authRequired, hrOnly, (req, res) => {
  const d = Departments.rename(req.params.id, (req.body || {}).name);
  if (!d) return res.status(404).json({ error: 'Department not found.' });
  res.json({ ok: true, department: d });
});
app.put('/api/hr/departments/:id/head', authRequired, hrOnly, (req, res) => {
  const { user_id } = req.body || {};
  if (user_id && !DepartmentMembers.isMember(req.params.id, user_id)) return res.status(400).json({ error: 'The head must already be a member of this department.' });
  const d = Departments.setHead(req.params.id, user_id || null);
  if (!d) return res.status(404).json({ error: 'Department not found.' });
  res.json({ ok: true, department: d });
});
app.delete('/api/hr/departments/:id', authRequired, hrOnly, (req, res) => { Departments.remove(req.params.id); res.json({ ok: true }); });
// Small people-search for the "Add member" / "Set head" pickers - open to
// any internal (non-student/free) role since it only returns name/email/role.
app.get('/api/hr/users-lite', authRequired, (req, res) => {
  if (['student', 'free'].includes(req.user.role)) return res.status(403).json({ error: 'Not available for your role.' });
  const q = String(req.query.q || '').trim().toLowerCase();
  const rows = Users.all()
    .filter((u) => !['student', 'free'].includes(u.role))
    .filter((u) => !q || u.name.toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q))
    .slice(0, 20)
    .map((u) => ({ id: u.id, name: u.name, role: u.role, email: u.email }));
  res.json({ users: rows });
});
app.get('/api/department/:id', authRequired, departmentManage, (req, res) => res.json({ department: departmentDetail(req.department) }));
app.post('/api/department/:id/members', authRequired, departmentManage, (req, res) => {
  const target = Users.byId((req.body || {}).user_id);
  if (!target) return res.status(404).json({ error: 'User not found.' });
  DepartmentMembers.add(req.department.id, target.id, req.user.id);
  res.json({ ok: true, department: departmentDetail(req.department) });
});
app.delete('/api/department/:id/members/:userId', authRequired, departmentManage, (req, res) => {
  DepartmentMembers.remove(req.department.id, req.params.userId);
  if (req.department.head_user_id === Number(req.params.userId)) Departments.setHead(req.department.id, null);
  res.json({ ok: true, department: departmentDetail(req.department) });
});
app.post('/api/department/:id/tasks', authRequired, departmentManage, upload.single('file'), (req, res) => {
  const { title, description, scope, member_user_id } = req.body || {};
  if (!title || !String(title).trim()) {
    if (req.file) { try { fs.unlinkSync(req.file.path); } catch {} }
    return res.status(400).json({ error: 'A title is required.' });
  }
  if (scope === 'member' && !DepartmentMembers.isMember(req.department.id, member_user_id)) {
    if (req.file) { try { fs.unlinkSync(req.file.path); } catch {} }
    return res.status(400).json({ error: 'Pick which member this task is for.' });
  }
  let attachment = null;
  if (req.file) {
    const ext = path.extname(req.file.originalname).toLowerCase();
    if (!DUTY_ATTACH_EXT.includes(ext)) {
      try { fs.unlinkSync(req.file.path); } catch {}
      return res.status(400).json({ error: 'Only PDF, Word or image files (jpg/png/gif/webp) are accepted.' });
    }
    attachment = { filename: req.file.filename, original_name: req.file.originalname };
  }
  const { task, recipients } = DepartmentTasks.create({ department_id: req.department.id, title, description, scope, member_user_id, attachment }, req.user.id);
  for (const u of recipients) {
    if (!u.email) continue;
    mailer.notify(u.email, `New task assigned: ${task.title}`,
      `${hi(u.name)},\n\nA new task has been assigned to you in ${req.department.name}.\n\n${task.title}\n${task.description ? '\n' + task.description + '\n' : ''}${attachment ? '\nAn attachment is included - view it from your portal.\n' : ''}\nSign in at ${APP_URL}/login to view it and mark it done.\n\nEchoLens Digital`);
  }
  res.json({ ok: true, task });
});
app.post('/api/department/:id/announcements', authRequired, departmentManage, (req, res) => {
  const { title, body } = req.body || {};
  if (!title || !String(title).trim()) return res.status(400).json({ error: 'A title is required.' });
  const a = DepartmentAnnouncements.create({ department_id: req.department.id, title, body }, req.user.id);
  for (const m of DepartmentMembers.forDepartment(req.department.id)) {
    if (!m.user.email) continue;
    mailer.notify(m.user.email, `${req.department.name}: ${a.title}`, `${hi(m.user.name)},\n\n${a.body}\n\nSign in at ${APP_URL}/login to see it in your portal.\n\nEchoLens Digital`);
  }
  res.json({ ok: true, announcement: a });
});
app.get('/api/my-departments', authRequired, (req, res) => {
  const memberships = DepartmentMembers.forUser(req.user.id);
  const out = memberships.map((m) => {
    const tasks = DepartmentTasks.forUser(req.user.id).filter((t) => t.task.department_id === m.department_id);
    return {
      id: m.department.id, name: m.department.name, is_head: m.department.head_user_id === req.user.id,
      tasks, progress: { done: tasks.filter((t) => t.status === 'done').length, total: tasks.length },
      announcements: DepartmentAnnouncements.forDepartment(m.department_id),
    };
  });
  res.json({ departments: out });
});
app.post('/api/my-departments/tasks/:taskId/complete', authRequired, upload.single('file'), (req, res) => {
  let proof_attachment = null;
  if (req.file) {
    const ext = path.extname(req.file.originalname).toLowerCase();
    if (!DUTY_ATTACH_EXT.includes(ext)) {
      try { fs.unlinkSync(req.file.path); } catch {}
      return res.status(400).json({ error: 'Only PDF, Word or image files (jpg/png/gif/webp) are accepted.' });
    }
    proof_attachment = { filename: req.file.filename, original_name: req.file.originalname };
  }
  const s = DepartmentTasks.markDone(req.params.taskId, req.user.id, { note: (req.body || {}).note, proof_attachment });
  if (!s) { if (req.file) { try { fs.unlinkSync(req.file.path); } catch {} } return res.status(404).json({ error: 'Task not found for you.' }); }
  res.json({ ok: true });
});

/* ------------------------------- onboarding -------------------------------
 * Instructors, staff, ambassadors and HR must complete a first-login profile
 * (contact/address/qualifications, plus mandatory documents for instructors)
 * before using their portal - see requireOnboarding() in dashboard.js. For
 * ambassador/instructor specifically, a successful submission auto-generates
 * and emails their contract (see issueContract below). */
const CONTRACT_DEADLINE_MS = 2 * 24 * 3600 * 1000; // 2 days to sign & submit
async function writeContractPdf(user) {
  const settings = Settings.cert();
  const profile = user.profile || {};
  const ambassador = user.role === 'ambassador' ? Ambassadors.byUserId(user.id) : null;
  const pdfBuffer = await generateContractPdf({ role: user.role, user, profile, ambassador, settings });
  const filename = `contract-${user.role}-${user.id}-${Date.now()}.pdf`;
  fs.writeFileSync(path.join(CONTRACTS_DIR, filename), pdfBuffer);
  return { filename, pdfBuffer };
}
function mailContract(user, pdfBuffer, deadline_at) {
  mailer.notify(user.email, `Your EchoLens ${STAFF_ROLE_LABEL[user.role]} contract`,
    `${hi(user.name)},\n\nCongratulations - your details have been received. Attached is your ${STAFF_ROLE_LABEL[user.role]} contract.\n\nPlease print it, sign it, gather any documents it asks for, and upload everything as a single .zip file from your portal within 2 days (by ${new Date(deadline_at).toLocaleString('en-GB')}). Once we receive it, your official offer letter will follow by email.\n\nSign in at ${APP_URL}/login to submit.\n\nEchoLens Digital`,
    [{ filename: `EchoLens-${STAFF_ROLE_LABEL[user.role]}-Contract.pdf`, content: pdfBuffer }]);
}
async function issueContract(user) {
  const { filename, pdfBuffer } = await writeContractPdf(user);
  const deadline_at = new Date(Date.now() + CONTRACT_DEADLINE_MS).toISOString();
  const contract = Contracts.create({ user_id: user.id, role: user.role, pdf_filename: filename, deadline_at });
  mailContract(user, pdfBuffer, deadline_at);
  return contract;
}
async function issueOfferLetter(user, contract) {
  // The CEO signature is always the typed authorised name (see
  // letterhead-flow.signatureName) - never an uploaded image.
  const settings = Settings.cert();
  const profile = user.profile || {};
  const ambassador = user.role === 'ambassador' ? Ambassadors.byUserId(user.id) : null;
  const pdfBuffer = await generateOfferLetterPdf({ role: user.role, user, profile, ambassador, settings });
  const filename = `offer-${user.role}-${user.id}-${Date.now()}.pdf`;
  fs.writeFileSync(path.join(CONTRACTS_DIR, filename), pdfBuffer);
  Contracts.markOfferLetterSent(contract.id, { offer_letter_filename: filename });
  mailer.notify(user.email, `Your EchoLens ${STAFF_ROLE_LABEL[user.role]} offer letter`,
    `${hi(user.name)},\n\nThank you for returning your signed contract. Attached is your official EchoLens offer letter, confirming your appointment.\n\nWelcome aboard!\n\nEchoLens Digital`,
    [{ filename: `EchoLens-${STAFF_ROLE_LABEL[user.role]}-Offer-Letter.pdf`, content: pdfBuffer }]);
}
const ONBOARDING_DOC_FIELDS = [{ name: 'degree_files', maxCount: 5 }, { name: 'transcript_files', maxCount: 5 }, { name: 'certification_files', maxCount: 5 }];
app.post('/api/me/onboarding', authRequired, upload.fields(ONBOARDING_DOC_FIELDS), async (req, res) => {
  const files = req.files || {};
  const cleanup = () => { for (const key of Object.keys(files)) for (const f of files[key]) { try { fs.unlinkSync(f.path); } catch {} } };
  if (!ONBOARDING_ROLES.includes(req.user.role)) { cleanup(); return res.status(403).json({ error: 'Not applicable for your role.' }); }
  const { phone, whatsapp, father_name, address, education } = req.body || {};
  const experience_years = req.body ? req.body.experience_years : undefined;
  if (!phone || !String(phone).trim()) { cleanup(); return res.status(400).json({ error: 'Phone number is required.' }); }
  if (!whatsapp || !String(whatsapp).trim()) { cleanup(); return res.status(400).json({ error: 'WhatsApp number is required.' }); }
  if (!father_name || !String(father_name).trim()) { cleanup(); return res.status(400).json({ error: "Father's name is required." }); }
  if (!address || !String(address).trim()) { cleanup(); return res.status(400).json({ error: 'Address is required.' }); }
  if (!education || !String(education).trim()) { cleanup(); return res.status(400).json({ error: 'Highest qualification is required.' }); }
  const docFields = {};
  if (req.user.role === 'instructor') {
    for (const [key, label, required] of [['degree_files', 'degree', true], ['transcript_files', 'transcript', true], ['certification_files', 'certification', false]]) {
      const list = files[key] || [];
      if (required && !list.length) { cleanup(); return res.status(400).json({ error: `Upload at least one ${label} document.` }); }
      for (const f of list) {
        const ext = path.extname(f.originalname).toLowerCase();
        if (!DUTY_ATTACH_EXT.includes(ext)) { cleanup(); return res.status(400).json({ error: 'Only PDF, Word or image files (jpg/png/gif/webp) are accepted for documents.' }); }
      }
      docFields[key] = list.map((f) => ({ filename: f.filename, original_name: f.originalname }));
    }
  } else {
    cleanup(); // documents are instructor-only; nothing else is expected/kept
  }
  Users.updateProfile(req.user.id, { ...req.body, experience_years: experience_years === undefined ? '0' : experience_years });
  if (req.user.role === 'instructor') Users.setInstructorDocs(req.user.id, docFields);
  Users.setOnboarded(req.user.id);
  const freshUser = Users.byId(req.user.id);
  if (CONTRACT_ROLES.includes(req.user.role) && freshUser.email) {
    try {
      const contract = await issueContract(freshUser);
      return res.json({ ok: true, contract: { status: contract.status, deadline_at: contract.deadline_at } });
    } catch (e) {
      console.error('Contract generation failed:', e.message);
      return res.json({ ok: true, contract_error: 'Your profile was saved, but the contract could not be generated automatically - contact HR.' });
    }
  }
  res.json({ ok: true });
});

/* --------------------------- contract sign & submit ---------------------------
 * Ambassador/instructor only: after onboarding auto-emails the contract
 * (issueContract above), the hire has 2 days to sign it by hand, gather any
 * required documents, and upload everything as one .zip - which immediately
 * triggers the offer letter (issueOfferLetter above). */
app.get('/api/me/contract', authRequired, (req, res) => {
  if (!CONTRACT_ROLES.includes(req.user.role)) return res.json({ contract: null });
  res.json({ contract: Contracts.byUserId(req.user.id) });
});
app.post('/api/contract/submit', authRequired, upload.single('file'), (req, res) => {
  const drop = () => { if (req.file) { try { fs.unlinkSync(req.file.path); } catch {} } };
  if (!CONTRACT_ROLES.includes(req.user.role)) { drop(); return res.status(403).json({ error: 'Not applicable for your role.' }); }
  const contract = Contracts.byUserId(req.user.id);
  if (!contract || contract.status !== 'sent') {
    drop();
    return res.status(400).json({ error: contract && contract.status === 'submitted' ? 'You have already submitted your signed contract.' : 'No contract is currently awaiting your signature.' });
  }
  if (!req.file) return res.status(400).json({ error: 'Attach your signed contract and documents as a single .zip file.' });
  if (path.extname(req.file.originalname).toLowerCase() !== '.zip') { drop(); return res.status(400).json({ error: 'Only a .zip file is accepted - package your signed contract and documents together.' }); }
  if (contract.deadline_at && new Date() > new Date(contract.deadline_at)) { drop(); return res.status(400).json({ error: 'The 2-day signing window has passed - contact HR to have your contract resent.' }); }
  // Move the zip into the contracts dir (multer already dropped it in UPLOAD_DIR).
  const dest = path.join(CONTRACTS_DIR, req.file.filename);
  try { fs.renameSync(req.file.path, dest); } catch {}
  const updated = Contracts.markSubmitted(contract.id, { submission_zip_filename: req.file.filename });
  for (const h of Users.all().filter((u) => u.role === 'hr' && u.email)) {
    mailer.notify(h.email, `Contract submitted: ${req.user.name}`,
      `${hi(h.name)},\n\n${req.user.name} (${STAFF_ROLE_LABEL[req.user.role]}) has submitted their signed contract and documents. Their offer letter has been emailed automatically.\n\nSign in at ${APP_URL}/login to view the HR contract tracker.\n\nEchoLens Digital`);
  }
  issueOfferLetter(req.user, updated).catch((e) => console.error('Offer letter generation failed:', e.message));
  res.json({ ok: true });
});
/* HR visibility into every contract, and a "resend" action that resets the
 * 2-day deadline (the soft way this deadline is enforced - it flags overdue
 * hires to HR rather than silently locking their account). */
app.get('/api/hr/contracts', authRequired, hrOnly, (req, res) => {
  res.json({
    contracts: Contracts.all().map((c) => {
      const u = Users.byId(c.user_id);
      return { ...c, name: u ? u.name : 'Removed account', email: u ? u.email : null };
    }),
  });
});
app.post('/api/hr/contracts/:id/resend', authRequired, hrOnly, async (req, res) => {
  const c = Contracts.byId(req.params.id);
  if (!c) return res.status(404).json({ error: 'Contract not found.' });
  const user = Users.byId(c.user_id);
  if (!user) return res.status(404).json({ error: 'That account no longer exists.' });
  try {
    const { filename, pdfBuffer } = await writeContractPdf(user);
    const deadline_at = new Date(Date.now() + CONTRACT_DEADLINE_MS).toISOString();
    const fresh = Contracts.resend(c.id, { pdf_filename: filename, deadline_at });
    mailContract(user, pdfBuffer, deadline_at);
    res.json({ ok: true, contract: fresh });
  } catch (e) { res.status(500).json({ error: 'Could not regenerate the contract: ' + e.message }); }
});
// HR-controlled deadline extension: HR decides how many extra days a
// specific hire gets to sign & submit, without regenerating the contract
// PDF (see resend above for that heavier option). Extends from today, so it
// works the same whether the original 2-day window is still open or has
// already lapsed.
app.post('/api/hr/contracts/:id/extend-deadline', authRequired, hrOnly, (req, res) => {
  const c = Contracts.byId(req.params.id);
  if (!c) return res.status(404).json({ error: 'Contract not found.' });
  if (c.status !== 'sent') return res.status(400).json({ error: 'Only a contract still awaiting signature can have its deadline extended.' });
  const user = Users.byId(c.user_id);
  if (!user) return res.status(404).json({ error: 'That account no longer exists.' });
  const days = Number((req.body || {}).days);
  if (!Number.isFinite(days) || days <= 0 || days > 90) return res.status(400).json({ error: 'Enter a number of days between 1 and 90.' });
  const deadline_at = new Date(Date.now() + days * 24 * 3600 * 1000).toISOString();
  const fresh = Contracts.extendDeadline(c.id, { deadline_at });
  if (user.email) {
    mailer.notify(user.email, `Your EchoLens ${STAFF_ROLE_LABEL[user.role]} contract deadline was extended`,
      `${hi(user.name)},\n\nHR has extended your contract signing deadline. You now have until ${new Date(deadline_at).toLocaleString('en-GB')} to sign it, gather any required documents, and upload everything as a single .zip file from your portal.\n\nSign in at ${APP_URL}/login to submit.\n\nEchoLens Digital`);
  }
  res.json({ ok: true, contract: fresh });
});

/* --------------------------- ambassador self-service --------------------------- */
app.get('/api/ambassador/me', authRequired, ambassadorOnly, (req, res) => {
  const a = Ambassadors.byUserId(req.user.id);
  if (!a) return res.status(404).json({ error: 'Ambassador record not found.' });
  const rank = Ambassadors.leaderboard().find((x) => x.id === a.id);
  res.json({ ambassador: { ...a, uses: Ambassadors.usesFor(a.code), rank: rank ? rank.rank : null }, gem_events: AmbassadorGemEvents.forAmbassador(a.id).slice(0, 20) });
});
app.get('/api/ambassador/qr', authRequired, ambassadorOnly, async (req, res) => {
  const a = Ambassadors.byUserId(req.user.id);
  if (!a) return res.status(404).json({ error: 'Ambassador record not found.' });
  try {
    const dataUrl = await QRCode.toDataURL(`${APP_URL}/open?amb=${a.code}`, { width: 320, margin: 1 });
    res.json({ qr: dataUrl, url: `${APP_URL}/open?amb=${a.code}` });
  } catch { res.status(500).json({ error: 'Could not generate the QR code - try again.' }); }
});
// Ambassador tasks now come from /api/my-departments (the "Ambassadors" department).
app.get('/api/ambassador/referrals', authRequired, ambassadorOnly, (req, res) => {
  const a = Ambassadors.byUserId(req.user.id);
  if (!a) return res.status(404).json({ error: 'Ambassador record not found.' });
  const rows = Registrations.all().filter((r) => r.ambassador_code === a.code)
    .map((r) => ({ name: r.name, email: r.email, course_title: r.course_title, payment_stage: r.payment_stage, created_at: r.created_at }));
  res.json({ referrals: rows });
});
app.get('/api/ambassador/leaderboard', authRequired, ambassadorOnly, (req, res) => res.json({ leaderboard: Ambassadors.leaderboard() }));
app.get('/api/ambassador/leaderboard/universities', authRequired, ambassadorOnly, (req, res) => res.json({ leaderboard: Ambassadors.universityLeaderboard() }));
app.get('/api/ambassador/reports', authRequired, ambassadorOnly, (req, res) => {
  const a = Ambassadors.byUserId(req.user.id);
  if (!a) return res.status(404).json({ error: 'Ambassador record not found.' });
  res.json({ reports: AmbassadorReports.forAmbassador(a.id) });
});
app.get('/api/ambassador/reports/:id/download', authRequired, ambassadorOnly, (req, res) => {
  const a = Ambassadors.byUserId(req.user.id);
  if (!a) return res.status(404).json({ error: 'Ambassador record not found.' });
  const r = AmbassadorReports.byId(req.params.id);
  if (!r || r.ambassador_id !== a.id) return res.status(404).json({ error: 'Report not found.' });
  res.download(path.join(AMBASSADOR_REPORTS_DIR, r.filename), r.filename);
});
app.delete('/api/admin/users/:id', authRequired, adminRequired, (req, res) => {
  if (Number(req.params.id) === req.user.id) return res.status(400).json({ error: 'You cannot remove your own account.' });
  Users.remove(req.params.id); res.json({ ok: true });
});

/* --------------------------- v16: enrollments (admin) --------------------------- */
app.get('/api/admin/enrollments', authRequired, staffView, (req, res) => {
  const rows = Enrollments.all().map((e) => {
    const student = Users.byId(e.user_id);
    const b = Batches.byId(e.batch_id);
    const c = b ? Courses.byId(b.course_id) : null;
    return {
      id: e.id, student_id: student ? student.id : null, student_name: student ? student.name : 'Unknown',
      reg_no: student ? student.reg_no : null, batch_id: e.batch_id,
      course_title: c ? c.title : (b ? b.name : 'Unknown'), batch_name: b ? b.name : null,
      price_pkr: c ? c.price_pkr : null, created_at: e.created_at,
    };
  }).sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
  res.json({ enrollments: rows });
});

/* ----------------------------- v16: finance (admin) ----------------------------- */
// No payment gateway exists in this app - revenue is estimated from each
// course's list price x its enrollments, clearly labeled as an estimate.
app.get('/api/admin/finance', authRequired, staffView, (req, res) => {
  const enrollments = Enrollments.all();
  const byCourse = new Map();
  enrollments.forEach((e) => {
    const b = Batches.byId(e.batch_id); if (!b) return;
    const c = Courses.byId(b.course_id); if (!c) return;
    const row = byCourse.get(c.id) || { course_id: c.id, title: c.title, price_pkr: c.price_pkr || 0, enrollments: 0, revenue: 0 };
    row.enrollments += 1; row.revenue += c.price_pkr || 0;
    byCourse.set(c.id, row);
  });
  const courses = [...byCourse.values()].sort((a, b) => b.revenue - a.revenue);
  const total_revenue = courses.reduce((s, c) => s + c.revenue, 0);
  const todayD = new Date();
  const months = [];
  // Build buckets in UTC throughout (matching the UTC-sourced created_at
  // strings) - mixing a local Date with .toISOString() here would silently
  // shift every bucket by the server's UTC offset.
  for (let i = 5; i >= 0; i--) months.push(new Date(Date.UTC(todayD.getUTCFullYear(), todayD.getUTCMonth() - i, 1)).toISOString().slice(0, 7));
  const byMonth = Object.fromEntries(months.map((m) => [m, 0]));
  enrollments.forEach((e) => {
    const m = String(e.created_at).slice(0, 7);
    if (byMonth[m] === undefined) return;
    const b = Batches.byId(e.batch_id); const c = b && Courses.byId(b.course_id);
    if (c && c.price_pkr) byMonth[m] += c.price_pkr;
  });
  res.json({
    total_revenue, revenue_this_month: byMonth[months[months.length - 1]],
    revenue_month_label: todayD.toLocaleDateString('en-US', { month: 'long' }),
    courses, trend: { labels: months, values: months.map((m) => byMonth[m]) },
  });
});

/* ------------------------- v16: system health & logs (admin) ------------------------- */
app.get('/api/admin/system-health', authRequired, staffView, (req, res) => {
  const ROLE_LABEL = { admin: 'Admin', instructor: 'Teacher', coordinator: 'Coordinator', student: 'Student', free: 'Free-tier', hr: 'HR', finance: 'Finance', student_coordinator: 'Admissions Office' };
  const events = [];
  Users.all().forEach((u) => events.push({ at: u.created_at, kind: 'user', text: `New ${ROLE_LABEL[u.role] || u.role} account: ${u.name}` }));
  Courses.all().forEach((c) => events.push({ at: c.created_at, kind: 'course', text: `New course added to catalogue: ${c.title}` }));
  Batches.all().forEach((b) => events.push({ at: b.created_at, kind: 'batch', text: `New cohort started: ${b.title || b.name} (${b.name})` }));
  if (db.enabled()) {
    // Postgres mode: backups/ no longer receives new files (see U1a) - the
    // one event worth surfacing is the last successful pg_dump, from its
    // status marker, not a directory listing that's now permanently stale.
    try {
      const status = JSON.parse(fs.readFileSync(path.join(path.dirname(store.DB_PATH), 'backups', 'pg-dump-status.json'), 'utf8'));
      if (status.ok) events.push({ at: status.at.replace('T', ' ').slice(0, 19), kind: 'backup', text: 'Database backup created (pg_dump)' });
    } catch { /* no pg_dump status recorded yet */ }
  } else {
    try {
      const dir = path.join(path.dirname(store.DB_PATH), 'backups');
      fs.readdirSync(dir).filter((f) => f.endsWith('.json')).forEach((f) => {
        const st = fs.statSync(path.join(dir, f));
        events.push({ at: st.mtime.toISOString().replace('T', ' ').slice(0, 19), kind: 'backup', text: 'Database backup created' });
      });
    } catch { /* backups directory not created yet */ }
  }
  events.sort((a, b) => String(b.at).localeCompare(String(a.at)));
  res.json({ health: systemHealth(), events: events.slice(0, 30) });
});
// v20 (Showcase Feed architecture note, Part A2): dedicated flush-health
// endpoint, same auth pattern as its sibling above - so this can be checked
// (or polled by an external monitor later) without pulling the full
// system-health payload. Also folded into systemHealth()'s own "Postgres
// Flush" check above, so it shows up wherever admin already looks.
app.get('/api/admin/flush-health', authRequired, staffView, (req, res) => {
  if (!db.enabled()) return res.json({ enabled: false });
  res.json({ enabled: true, ...store.flushHealth() });
});

/* ------------------------- sessions / lessons / work ------------------------- */
app.post('/api/batches/:id/sessions', authRequired, manageBatch, (req, res) => {
  const { week_no, title, session_date, start_time, end_time } = req.body || {};
  if (!title || !session_date) return res.status(400).json({ error: 'A title and date are required.' });
  const s = Sessions.create({ batch_id: req.batch.id, week_no: Number(week_no) || null, title, session_date, start_time: start_time || null, end_time: end_time || null });
  res.json({ ok: true, session: s });
});
app.delete('/api/sessions/:id', authRequired, (req, res) => {
  const s = Sessions.byId(req.params.id);
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
app.get('/api/my/resources', authRequired, (req, res) => {
  if (req.user.role !== 'student') return res.json({ courses: [] });
  const courses = coursesForUser(req.user).map((b) => ({
    batch_id: b.id, course_title: b.title || b.name, lessons: Lessons.forBatch(b.id),
  }));
  res.json({ courses });
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
  if (!target || target.role !== 'student' || !Enrollments.all().some(e => e.user_id === target.id && e.batch_id === req.batch.id)) return res.status(400).json({ error: 'Choose a student enrolled on this course.' });
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
    can_post:req.user.role!=='coordinator',
    members: chatMembers(req.batch), // for @-tagging
  });
});
app.post('/api/batches/:id/chat', authRequired, viewBatch, (req, res) => {
  if(req.user.role==='coordinator')return res.status(403).json({error:'Coordinators have read-only course access.'});
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
// v13: "Messages" in the student portal is the existing per-course chat,
// aggregated across every enrolled course with a real unread count.
app.get('/api/my/messages', authRequired, (req, res) => {
  if (!['student', 'instructor'].includes(req.user.role)) return res.json({ threads: [], total_unread: 0 });
  const threads = coursesForUser(req.user).map((b) => {
    const msgs = Chat.forBatch(b.id, req.user);
    const lastRead = ChatReads.lastRead(req.user.id, b.id);
    const unread = msgs.filter((m) => !m.mine && (!lastRead || m.created_at > lastRead)).length;
    return { batch_id: b.id, course_title: b.title || b.name, unread, last_message: msgs[msgs.length - 1] || null };
  });
  res.json({ threads, total_unread: threads.reduce((s, t) => s + t.unread, 0) });
});
app.post('/api/batches/:id/chat/read', authRequired, viewBatch, (req, res) => {
  ChatReads.mark(req.user.id, req.batch.id);
  res.json({ ok: true });
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
  // A site-wide announcement reaches every user - that is a bulk send, so it
  // goes through the ESP (DRY by default), not the mailbox. A single batch's
  // announcement (the route above) stays on the transactional path.
  const emails = announcementRecipients(null).map((r) => r.email).filter(Boolean);
  if (emails.length) {
    Suppressions.load()
      .then((suppressed) => mailer.sendBulk(emails, `EchoLens: ${title}`, `${body}\n\n- EchoLens`, {
        label: `admin-announcement ${a.id}`,
        isSuppressed: (em) => suppressed.has(em),
        onReject: ({ email, code, reason }) => Suppressions.add({ email, code, reason, source: 'admin-announcement' }).catch(() => {}),
      }))
      .catch((e) => console.error('[admin-announcement] bulk send failed:', e.message));
  }
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
// Links in outgoing emails always point at the live site - never localhost.
// Override with APP_URL only when deliberately testing against another host.
const APP_URL = (process.env.APP_URL || 'https://www.echolens.digital').replace(/\/$/, '');
const G_REDIRECT = `${APP_URL}/auth/google/callback`;

app.get('/api/auth/providers', (req, res) => res.json({ google: !!(G_ID && G_SECRET) }));

app.get('/auth/google', (req, res) => {
  if (!G_ID || !G_SECRET) return res.redirect('/login?err=' + encodeURIComponent('Google sign-in is not configured yet.'));
  const back = safeReturnPath(req.query.returnTo || req.query.back, APP_URL);
  const state = jwt.sign({ nonce: crypto.randomBytes(24).toString('hex'), back }, JWT_SECRET, { expiresIn: '10m' });
  res.cookie('el_oauth_state', state, { httpOnly: true, sameSite: 'lax', secure: isProd, maxAge: 600000 });
  const params = new URLSearchParams({
    client_id: G_ID, redirect_uri: G_REDIRECT, response_type: 'code',
    scope: 'openid email profile', state, prompt: 'select_account',
  });
  res.redirect('https://accounts.google.com/o/oauth2/v2/auth?' + params.toString());
});

app.get('/auth/google/callback', async (req, res) => {
  try {
    const { code, state } = req.query;
    if (!state || req.cookies.el_oauth_state !== state) throw new Error('Sign-in expired. Please start again.');
    const oauthState = jwt.verify(String(state), JWT_SECRET);
    res.clearCookie('el_oauth_state');
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
    if (u.email && u.profile?.marketing_opt_in==='yes') Leads.upsert({ name: u.name, email: u.email, whatsapp: (u.profile || {}).phone || null, source: 'google', user_id: u.id });
    setAuthCookie(res, sign(u));
    // Google sign-ins from the open site go back to the open site.
    const back = safeReturnPath(oauthState.back, APP_URL, u.role === 'free' ? '/open#free' : '/dashboard');
    res.clearCookie('el_back');
    res.redirect(back);
  } catch (e) {
    res.redirect('/login?err=' + encodeURIComponent(e.message || 'Google sign-in failed.'));
  }
});

/* ----------------------------- AI copilot (teachers) ----------------------------- */
app.get('/api/ai/status', authRequired, (req, res) => res.json({
  enabled: ai.enabled() && ['admin', 'instructor'].includes(req.user.role),
  provider: ai.provider(),
  model: ai.model(),
  // Admins also see which keys the running process actually picked up (never
  // the keys themselves), so a missing env var is one request away from proof.
  ...(req.user.role === 'admin' ? { diagnostics: ai.status() } : {}),
}));

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

/* ------------------------ AI compiler assistant (any signed-in learner) ------------------------ */
// Same guarded assistant for both the free-standing /compiler page and a
// real quest task's IDE - when qid/pid are given, the assignment brief is
// looked up server-side (never trusted from the client) so the guidance can
// reference the actual task. See ai.js's codeHelp/stripCodeFences for the
// "never write code" guardrail itself.
app.post('/api/compiler/ai', authRequired, async (req, res) => {
  try {
    const { action, code, language, question, qid, pid } = req.body || {};
    if (!question && !(code && String(code).trim())) return res.status(400).json({ error: 'Write some code or ask a question first.' });
    let assignment = null;
    if (qid && pid) {
      const q = Quests.byId(qid);
      if (q && canViewBatch(req.user, Batches.byId(q.batch_id))) {
        const p = q.problems.find((x) => x.pid === Number(pid));
        if (p) assignment = { title: `${q.title} - ${p.title}`, brief: p.description };
      }
    }
    res.json({ reply: await ai.codeHelp(req.user.id, { action, code, language, question, assignment }) });
  } catch (e) { res.status(e.status || 500).json({ error: e.message }); }
});
// Stateless activity report for the standalone /compiler page - no
// assignment or submission to attach to, so nothing is persisted here.
app.post('/api/compiler/activity-report', authRequired, async (req, res) => {
  try {
    const telemetry = sanitizeTelemetry((req.body || {}).telemetry);
    if (!telemetry) return res.status(400).json({ error: 'No activity to report yet - write some code first.' });
    res.json({ text: await ai.activityReport(req.user.id, { assignmentTitle: null, telemetry }) });
  } catch (e) { res.status(e.status || 500).json({ error: e.message }); }
});
// Only numeric fields, clamped to sane ranges - telemetry is client-computed
// and must never be trusted blindly into storage or an AI prompt.
function sanitizeTelemetry(t) {
  if (!t || typeof t !== 'object') return null;
  const num = (v, max) => { const n = Number(v); return Number.isFinite(n) && n >= 0 ? Math.min(n, max) : 0; };
  return {
    totalMs: num(t.totalMs, 24 * 3600_000),
    activeMs: num(t.activeMs, 24 * 3600_000),
    idleMs: num(t.idleMs, 24 * 3600_000),
    timeToFirstKeystrokeMs: t.timeToFirstKeystrokeMs == null ? null : num(t.timeToFirstKeystrokeMs, 24 * 3600_000),
    keystrokes: num(t.keystrokes, 1_000_000),
    runs: num(t.runs, 10_000),
    aiRequests: num(t.aiRequests, 10_000),
  };
}

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
  if(s?.error)return res.status(409).json({error:s.error});
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
  const h = Hackathons.byId(req.params.id);
  mailer.notify(ADMISSIONS_EMAIL, `New hackathon registration - ${req.user.name}`,
    `${req.user.name} registered for the hackathon "${h ? h.title : req.params.id}"${team_name ? ` (team: ${team_name})` : ''}.\nEmail: ${req.user.email || '-'}`);
  if (req.user.email) {
    mailer.notify(req.user.email, `EchoLens - you're registered${h ? ` for ${h.title}` : ''}`,
      `${hi(req.user.name)},\n\nWe received your hackathon registration${h ? ` for "${h.title}"` : ''}${team_name ? ` with team "${team_name}"` : ''}.\n\nEchoLens Digital`);
  }
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
// Both endpoints download store.DB_PATH, which in Postgres mode is a frozen
// pre-cutover snapshot that never changes (see store.js's backupNow() for
// why) - serving it as "the backup" would tell an admin they have a safety
// net they don't. In Postgres mode real backups are the scheduled pg_dump
// job (see scripts/backup-pg-dump.js and RESTORE.md); refuse instead of
// silently handing back stale data.
app.get('/api/admin/backup', authRequired, adminRequired, (req, res) => {
  if (db.enabled()) {
    return res.status(409).json({ error: 'JSON-snapshot backups are disabled in Postgres mode - the underlying file no longer changes. See RESTORE.md for the pg_dump-based backup this environment actually uses.' });
  }
  store.backupNow();
  res.download(store.DB_PATH, `echolens-backup-${new Date().toISOString().slice(0, 10)}.json`);
});
// Same data, plus every uploaded file (certificates, submissions, payment
// screenshots, ambassador reports) - streamed as a zip so nothing is
// buffered fully in memory even if uploads/ is large.
app.get('/api/admin/backup.zip', authRequired, adminRequired, (req, res) => {
  if (db.enabled()) {
    return res.status(409).json({ error: 'JSON-snapshot backups are disabled in Postgres mode - the underlying file no longer changes. See RESTORE.md for the pg_dump-based backup this environment actually uses.' });
  }
  store.backupNow();
  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', `attachment; filename="echolens-full-backup-${new Date().toISOString().slice(0, 10)}.zip"`);
  const archive = archiver('zip', { zlib: { level: 9 } });
  archive.on('error', (err) => { console.error('Backup zip failed:', err.message); res.destroy(err); });
  archive.pipe(res);
  archive.file(store.DB_PATH, { name: 'echolens.json' });
  if (fs.existsSync(UPLOAD_DIR)) archive.directory(UPLOAD_DIR, 'uploads');
  archive.finalize();
});
if (!demo.enabled) {
  store.backupNow(); // one on boot
  setInterval(() => store.backupNow(), 12 * 3600 * 1000); // and every 12 hours
}


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
    telemetry: s.telemetry || null,
    activity_report: s.activity_report || null,
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
// v13: "Assignments" in the student portal - quests are the real assignment
// system (see the "assignments (removed)" note above), but only reachable
// per-course today. This merges every enrolled course's quest levels into
// one flat list.
app.get('/api/my/quests', authRequired, (req, res) => {
  if (req.user.role !== 'student') return res.json({ courses: [] });
  const courses = coursesForUser(req.user).filter((b) => Quests.installed(b.id)).map((b) => {
    const prog = Quests.progress(req.user.id, b.id);
    return {
      batch_id: b.id, course_title: b.title || b.name, track_title: prog.track.title,
      unlocked_up_to: prog.unlocked_up_to, total_levels: prog.levels.length, completed: prog.completed,
      levels: prog.levels.map((l) => ({ no: l.quest.no, title: l.quest.title, deadline: l.quest.deadline, passed: l.passed, unlocked: l.unlocked })),
    };
  });
  res.json({ courses });
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
    // Editor mode: any language supported by the shared compiler, or a typed
    // written answer. Preserve the selected language so teachers can run the
    // submission with the same runtime the student used.
    if (code.length > 200000) return res.status(400).json({ error: 'Your solution is too long - keep it under 200,000 characters.' });
    payload = { code, language: ['python', 'javascript', 'typescript', 'c', 'cpp', 'java', 'go', 'sql', 'web', 'text'].includes(String(body.language)) ? String(body.language) : (isWritten ? 'text' : 'python') };
  } else {
    return res.status(400).json({ error: isWritten ? 'Write your logical answer in the editor, or upload it as a PDF or text file.' : 'Write your solution in the editor, or attach it as a PDF/Word file.' });
  }
  const s = Quests.submit({ quest_id: q.id, pid: p.pid, user_id: req.user.id, ...payload, note: body.note, telemetry: sanitizeTelemetry(body.telemetry) });
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
      `${hi(student.name)},\n\nYour submission for "${p.title}" (Level ${q.no}) was graded: ${graded.grade}% - you earned ${graded.gems} gems.${graded.remarks ? '\n\nYour teacher says: ' + graded.remarks : ''}\n\nSee your progress: ${APP_URL}/dashboard`);
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

/* ----------------------- activity report (student or teacher) ----------------------- */
// Turns the telemetry captured while the student worked (time, run count and
// AI help count) into a short readable report. Unlike
// the AI review above, there is no grading signal here, so both the
// submitting student and the instructor can generate/view it. Cached like
// the AI review, with the same force-to-regenerate escape hatch.
app.post('/api/quest-submissions/:id/activity-report', authRequired, async (req, res) => {
  try {
    const s = Quests.subById(req.params.id);
    if (!s) return res.status(404).json({ error: 'Submission not found.' });
    const q = Quests.byId(s.quest_id);
    const b = Batches.byId(q.batch_id);
    if (!(canManageBatch(req.user, b) || req.user.id === s.user_id)) return res.status(403).json({ error: 'Not available for your role.' });
    if (!s.telemetry) return res.status(400).json({ error: 'No activity was recorded for this submission yet.' });
    const { force } = req.body || {};
    if (s.activity_report && !force) return res.json({ report: s.activity_report, cached: true });
    const p = q.problems.find((x) => x.pid === s.pid) || {};
    const text = await ai.activityReport(req.user.id, { assignmentTitle: `${q.title} - ${p.title}`, telemetry: s.telemetry });
    s.activity_report = { text, generated_at: new Date().toISOString().replace('T', ' ').slice(0, 19) };
    store.persist();
    res.json({ report: s.activity_report, cached: false });
  } catch (e) { res.status(e.status || 500).json({ error: e.message }); }
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
const OPEN_LEVELS = Number(process.env.OPEN_LEVELS || 1); // catalogue: Level 1 of every paid course is free; free tracks open fully
// Newsletter sign-up from the landing page: every email becomes a lead the
// admin can download. No account is created and nothing is emailed back.
app.post('/api/public/subscribe', limitLead, (req, res) => {
  if ((req.body || {}).company) return res.json({ ok: true }); // honeypot: bots fill it, humans never see it
  const email = String((req.body || {}).email || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return res.status(400).json({ error: 'Enter a valid email address.' });
  Leads.upsert({ name: email.split('@')[0], email, source: 'newsletter' });
  res.json({ ok: true });
});

app.get('/api/public/info', (req, res) => {
  res.json({
    // v12: the full catalogue is no longer openly visible - it lives behind
    // sign-in at /open (Courses tab) and GET /api/catalogue.
    stats: {
      students: Users.countByRole('student') + Users.countByRole('free'),
      courses: officialCatalogue().length,
      tracks: Quests.tracks().length,
    },
    capabilities:{grading:ai.enabled(),talent:db.enabled(),email:mailer.configured},
    stages:store.STAGES,
    open_levels: OPEN_LEVELS,
    contact: 'info@echolens.digital',
  });
});
app.get('/api/public/tracks', (req, res) => res.json({ tracks: Quests.tracks(), open_levels: OPEN_LEVELS }));
app.get('/api/public/tracks/:key', (req, res) => {
  const t = Quests.trackDef(req.params.key);
  const previewOnly = !!(t && t.published === false && t.staged_catalogue);
  if (!t || (t.published === false && !previewOnly)) return res.status(404).json({ error: 'Track not found.' });
  // Free programs open every level; paid programs open just the first quest
  // (a single level) so every course - bootcamps included - offers the same
  // one-quest taste, and the rest is visible but locked until enrolment.
  // A free course is NOT open just because it is free. Its levels unlock on a
  // CONFIRMED enrolment (course-pacing.js: enrol now, seat confirmed an hour
  // later). Until then the learner gets the same locked shape a paid course
  // shows - titles, points and difficulty, but no brief, hint or video URL -
  // so the syllabus stays browsable while the content stays shut. Staff keep
  // full visibility for review.
  // This route is public (no authRequired), so req.user is never populated -
  // read the session directly. A signed-out visitor simply has no seat.
  const viewer = currentUser(req);
  const seat = t.free && viewer ? OpenQuest.enrollment(viewer.id, t.key) : null;
  const staffPreview = !!viewer && !['free', 'student'].includes(viewer.role);
  const freeOpen = staffPreview || !!(seat && seat.active);
  const openN = previewOnly ? 0 : t.free ? (freeOpen ? t.levels.length : 0) : OPEN_LEVELS;
  const mode = Quests.tracks({ includeUnpublished: true }).find((x) => x.key === t.key)?.submission_mode || 'code';
  const levels = t.levels.map((l) => {
    if (l.no <= openN) {
      return {
        no: l.no, week: l.week, session:l.session, module_no:l.module_no||null, module_title:l.module_title||null, lecture_no:l.lecture_no||null, title: l.title, topic: l.topic, analogy:l.analogy||null, covered:l.covered||null, video_title:l.video_title||null, video_runtime:l.video_runtime||null, video_outline:l.video_outline||null, video_url: l.video_url || null, resource_url:l.resource_url||null,resource_note:l.resource_note||null, videos:l.videos||[], locked: false,
        problems: l.problems.map((p, i) => ({ pid: p.pid ?? i + 1, code:p.code||null, duration:p.duration||null, required:p.required!==false&&!p.optional, optional:!!p.optional, pass_mark:p.pass_mark??t.pass_mark??60, language:p.language||t.default_language,starter_code:p.starter_code||p.starter||null, title: p.title, description: p.description, deliverable:p.deliverable||null, submission_text:p.submission_text||null, submission:p.submission||null, grading_mode:p.grading_mode||t.grading_mode||'automatic', points: p.points || 100, difficulty: p.difficulty, refs: p.refs || [], criteria: p.criteria || [], hint: p.hint || null, reference: p.reference || null })),
      };
    }
    // Locked levels: every task is listed (title, points, difficulty) so the
    // full course is visible - briefs and resources unlock on enrolment.
    // On a FREE course the lock is the enrolment gate, so the lecture text and
    // video URL go too: leaving them in would hand over exactly the content
    // the confirmed-seat rule exists to withhold. Paid courses keep their
    // existing teaser shape - that preview is deliberate and unrelated.
    return {
      no: l.no, week: l.week, module_no:l.module_no||null, module_title:l.module_title||null, lecture_no:l.lecture_no||null, title: l.title, topic: t.free ? null : l.topic, video_url: t.free ? null : (l.video_url || null), locked: true,
      problems: l.problems.map((p, i) => ({ pid: i + 1, title: p.title, points: p.points || 100, difficulty: p.difficulty, locked: true })),
    };
  });
  res.json({ track: { key: t.key, title: t.title, description: t.description, outcome: t.outcome || null, format:t.format||null, time_commitment:t.time_commitment||null, prerequisites:t.prerequisites||null, environment:t.environment||null, assessment:t.assessment||null, warnings:t.warnings||[], modules:t.modules||[], capstone:t.capstone||null, assignment_weight:t.assignment_weight||null, capstone_weight:t.capstone_weight||null, inline_video_only:!!t.inline_video_only, published:t.published!==false, available:!previewOnly, coming_soon:previewOnly, grading_mode:t.grading_mode||null, key_concepts: t.key_concepts || [], clos: t.clos || [], end_project: t.end_project || null, pass_mark: t.pass_mark, total_points: t.total_points, course_code: t.course_code || null, free: !!t.free, submission_mode: mode, friendly_grading: !!t.friendly_grading, default_language: t.default_language || null }, levels, open_levels: openN, enrollment: seat ? { active: seat.active, enrolled_at: seat.enrolled_at, activates_at: seat.activates_at || null, confirmation_note: seat.confirmation_note || null } : null, staff_preview: staffPreview });
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

/* ------------------------- scheduled classes: live room + attendance ------------------------- */
// Every scheduled class has a built-in room (embedded Jitsi - open source, no
// account needed). A teacher/admin starts it when class begins; joining marks
// attendance and a heartbeat counts minutes in the room.
app.post('/api/sessions/:id/start', authRequired, (req, res) => {
  const s = Sessions.byId(req.params.id);
  if (!s) return res.status(404).json({ error: 'Class not found.' });
  const b = Batches.byId(s.batch_id);
  if (!canManageBatch(req.user, b)) return res.status(403).json({ error: 'You cannot manage this course.' });
  const out = Sessions.start(s.id, req.user.id);
  if (out.error) return res.status(400).json({ error: out.error });
  const bd = Batches.decorate(b);
  const mails = Enrollments.studentsForBatch(b.id).map((u) => u.email).filter(Boolean);
  mailer.notify(mails, `Class started - ${s.title}`,
    `${req.user.name} just started "${s.title}" (${bd.title || bd.name}) live inside the portal.\n\nJoin from the Classes tab of your course: ${APP_URL}/dashboard`);
  res.json({ ok: true, session: out.session });
});
app.post('/api/sessions/:id/end', authRequired, (req, res) => {
  const s = Sessions.byId(req.params.id);
  if (!s) return res.status(404).json({ error: 'Class not found.' });
  if (!canManageBatch(req.user, Batches.byId(s.batch_id))) return res.status(403).json({ error: 'You cannot manage this course.' });
  Sessions.end(s.id);
  res.json({ ok: true });
});
app.post('/api/sessions/:id/join', authRequired, (req, res) => {
  const s = Sessions.byId(req.params.id);
  if (!s || !s.started_at || s.ended_at) return res.status(404).json({ error: 'This class is not live right now.' });
  const b = Batches.byId(s.batch_id);
  if (!canViewBatch(req.user, b)) return res.status(403).json({ error: 'You are not on this course.' });
  if (req.user.role === 'student') Attendance.mark(s.id, req.user.id); // attendance = actually joining the room
  const out = { ok: true, room: s.room, display_name: req.user.name, provider: jaas.configured ? 'jaas' : 'jitsi' };
  // JaaS (8x8.vc): a fresh, room-scoped JWT signed server-side - the private
  // key never reaches the client. Falls back to the free, unauthenticated
  // meet.jit.si server when JaaS isn't configured.
  if (jaas.configured) {
    out.app_id = jaas.appId;
    out.jwt = jaas.sign({ room: s.room, user: req.user, moderator: canManageBatch(req.user, b) });
  }
  res.json(out);
});
app.post('/api/sessions/:id/heartbeat', authRequired, (req, res) => {
  const s = Sessions.byId(req.params.id);
  if (!s || s.ended_at) return res.json({ ok: true, ended: true });
  if (req.user.role === 'student') Attendance.heartbeat(s.id, req.user.id);
  res.json({ ok: true });
});
app.get('/api/sessions/:id/attendance', authRequired, staffView, (req, res) => {
  const s = Sessions.byId(req.params.id);
  if (!s) return res.status(404).json({ error: 'Class not found.' });
  if (!canViewBatch(req.user, Batches.byId(s.batch_id))) return res.status(403).json({ error: 'You are not on this course.' });
  res.json({ class: { id: s.id, title: s.title, date: s.session_date, started_at: s.started_at, ended_at: s.ended_at }, sheet: Attendance.sheet(s) });
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
// v13: "Quizzes" in the student portal - quizzes are strictly per-course
// today, this merges every enrolled course's open quizzes + past attempts.
app.get('/api/my/quizzes', authRequired, (req, res) => {
  if (req.user.role !== 'student') return res.json({ open: [], mine: [] });
  const open = [], mine = [];
  for (const b of coursesForUser(req.user)) {
    for (const q of Quizzes.forBatch(b.id)) {
      const attempt = Quizzes.myAttempt(q.id, req.user.id);
      if (Quizzes.isOpen(q) && !attempt) {
        open.push({ id: q.id, title: q.title, batch_id: b.id, course_title: b.title || b.name, closes_at: q.closes_at, points: q.points });
      }
      if (attempt) {
        mine.push({ quiz_id: q.id, title: q.title, batch_id: b.id, course_title: b.title || b.name, score_pct: attempt.score_pct, taken_at: attempt.taken_at });
      }
    }
  }
  res.json({ open, mine: mine.sort((a, b) => String(b.taken_at).localeCompare(String(a.taken_at))) });
});
app.post('/api/batches/:id/quizzes', authRequired, manageBatch, (req, res) => {
  const fields = {};
  for (const key of ['title','questions','duration_min','points','allow_ide']) if (req.body?.[key] !== undefined) fields[key] = req.body[key];
  const out = Quizzes.create({ ...fields, batch_id: req.batch.id, created_by: req.user.id });
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
// Certificate settings: official organisation name, tagline and CEO name.
// The CEO signature is always the typed name, never an uploaded image -
// there is deliberately no signature-upload route.
app.get('/api/admin/cert-settings', authRequired, teacherOrAdmin, (req, res) => res.json({ settings: Settings.cert() }));
app.post('/api/admin/cert-settings', authRequired, adminRequired, (req, res) => {
  res.json({ ok: true, settings: Settings.setCert(req.body || {}) });
});
/* ------------------------- v24: certificate partner (WebEra) -------------------------
 * A named partner organisation certificates can be issued "in collaboration
 * with" - same typed-signature convention as EchoLens's own CEO (no
 * uploaded signature image). Which certificates carry it is a property of
 * the course/event itself (Batches.partner / Events.partner, toggled below)
 * so it travels through automatic issuance too, not just manual; free/open
 * tracks are static code rather than DB records, so they get their own
 * opt-in list (settings.partner_tracks).
 */
app.get('/api/admin/partner-settings', authRequired, teacherOrAdmin, (req, res) => {
  res.json({
    partner: Settings.partner(),
    partner_tracks: Settings.partnerTracks(),
    tracks: Quests.tracks().filter((t) => t.free).map((t) => ({ key: t.key, title: t.title, course_code: t.course_code })),
  });
});
app.post('/api/admin/partner-settings', authRequired, adminRequired, (req, res) => {
  res.json({ ok: true, partner: Settings.setPartner(req.body || {}) });
});
// Logo upload: normalised to a fixed public/img/ path (via sharp) so it is
// reachable without sign-in - the /cert verification page is public, unlike
// everything under /uploads (which requires a session).
const PARTNER_LOGO_PATH = path.join(__dirname, 'public', 'img', 'partner-logo.png');
app.post('/api/admin/partner-settings/logo', authRequired, adminRequired, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Choose a logo image first.' });
  try {
    await sharp(req.file.path).resize(400, 400, { fit: 'inside', withoutEnlargement: true }).png().toFile(PARTNER_LOGO_PATH);
    const partner = Settings.setPartnerLogo(`/img/partner-logo.png?v=${Date.now()}`);
    res.json({ ok: true, partner });
  } catch (e) {
    res.status(400).json({ error: 'Could not process that image - try a PNG, JPEG or SVG.' });
  } finally {
    try { fs.unlinkSync(req.file.path); } catch {}
  }
});
app.post('/api/admin/partner-settings/track', authRequired, adminRequired, (req, res) => {
  const { key, on } = req.body || {};
  if (!key || !Quests.trackDef(key)) return res.status(404).json({ error: 'Track not found.' });
  res.json({ ok: true, partner_tracks: Settings.setPartnerTrack(key, !!on) });
});
// A specific paid/portal course - toggled from that course's own admin menu.
app.post('/api/batches/:id/partner', authRequired, adminRequired, (req, res) => {
  const partner = Batches.setPartner(req.params.id, !!(req.body || {}).on);
  if (partner === null) return res.status(404).json({ error: 'Course not found.' });
  res.json({ ok: true, partner });
});
// Issue one certificate (course completion / hackathon / competition).
app.post('/api/certificates/issue', authRequired, teacherOrAdmin, asyncRoute(async (req, res) => {
  const { reg_no, user_id, batch_id, kind, title, completion_date, detail, partner } = req.body || {};
  const allowIncomplete = req.body?.allow_incomplete === true;
  if (allowIncomplete && req.user.role !== 'admin') return res.status(403).json({ error: 'Only an admin can issue a certificate before track completion.' });
  let completionOverridden = false;
  const student = user_id ? Users.byId(user_id) : Users.byReg(String(reg_no || ''));
  if (!student) return res.status(404).json({ error: 'No student found for that registration number.' });
  if (batch_id) {
    const b = Batches.byId(batch_id);
    if (!b) return res.status(404).json({ error: 'Course not found.' });
    if (!canManageBatch(req.user, b)) return res.status(403).json({ error: 'You cannot issue certificates on this course.' });
    if (!Enrollments.all().some(e => e.user_id === student.id && e.batch_id === b.id)) return res.status(400).json({ error: 'This learner is not enrolled in the course.' });
    const progress = Quests.progress(student.id, b.id);
    if (!progress?.completed) {
      if (!allowIncomplete) return res.status(400).json({ error: 'Course completion has not been established. Grade the required assessments or ask an admin to enable the manual certificate override.' });
      completionOverridden = true;
    }
  } else if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Only the admin issues certificates outside a course.' });
  }
  if (!title) return res.status(400).json({ error: 'A course / hackathon / competition name is required.' });
  const instructorId = req.user.role === 'instructor' ? req.user.id
    : (batch_id ? ((Batches.byId(batch_id).instructor_ids || [])[0] || null) : null);
  // Snapshot the course's concepts and the student's final-level (capstone)
  // work onto the certificate now, while the quest data is still fresh -
  // this is what the QR verification page shows, so it must reflect the
  // course as it stood at the moment the certificate was earned.
  const concepts = batch_id && Quests.installed(batch_id) ? courseConcepts(batch_id) : [];
  const finalProject = batch_id && Quests.installed(batch_id) ? finalProjectFor(batch_id, student.id) : null;
  // Defaults to the course's own WebEra-collaboration flag (if any); an
  // admin issuing by hand can still tick/untick it for this one certificate.
  const isPartner = partner !== undefined ? !!partner : !!(batch_id && Batches.byId(batch_id).partner);
  const out = Certificates.issue({ user_id: student.id, batch_id, kind, title, completion_date, detail, instructor_id: instructorId, issued_by: req.user.id, concepts, final_project: finalProject, partner: isPartner, deferSave: true });
  if (out.error) return res.status(400).json({ error: out.error });
  const cert = out.cert;
  if (!out.existing) {
    if (completionOverridden) AuditLog.record({ actor_id: req.user.id, action: 'certificate_completion_override', target_type: 'certificate', target_id: cert.id, detail: { user_id: student.id, batch_id: Number(batch_id), serial: cert.serial, bulk: false }, deferSave: true });
    store.persist();
  }
  await store.pendingPersist();
  if (!out.existing && student.email) {
    mailer.notify(student.email, `Your certificate is ready - ${cert.title}`,
      `Congratulations ${student.name}!\n\nYour verified certificate for "${cert.title}" has been issued (serial ${cert.serial}).\n\nView, download and share it to LinkedIn from your profile, or open it directly: ${APP_URL}/cert?s=${cert.serial}`);
  }
  res.json({ ok: true, cert, existing: !!out.existing, url: `${APP_URL}/cert?s=${cert.serial}` });
}));
// Completion is required by default; only an admin can explicitly include
// enrolled learners whose track is incomplete (including no submissions).
app.post('/api/batches/:id/certificates/issue-all', authRequired, manageBatch, asyncRoute(async (req, res) => {
  const allowIncomplete = req.body?.only_completed === false;
  if (allowIncomplete && req.user.role !== 'admin') return res.status(403).json({ error: 'Only an admin can issue certificates before track completion.' });
  const bd = Batches.decorate(req.batch);
  const title = (req.body || {}).title || bd.title || bd.name;
  const completion_date = (req.body || {}).completion_date;
  const instructorId = req.user.role === 'instructor' ? req.user.id : ((req.batch.instructor_ids || [])[0] || null);
  const installed = Quests.installed(req.batch.id);
  const concepts = installed ? courseConcepts(req.batch.id) : [];
  const bodyPartner = (req.body || {}).partner;
  const isPartner = bodyPartner !== undefined ? !!bodyPartner : !!req.batch.partner;
  const issued = [], skipped = [], existing = [];
  for (const u of Enrollments.studentsForBatch(req.batch.id)) {
    const prog = installed ? Quests.progress(u.id, req.batch.id) : null;
    if (!prog?.completed && !allowIncomplete) { skipped.push(u.name); continue; }
    const finalProject = installed ? finalProjectFor(req.batch.id, u.id) : null;
    const out = Certificates.issue({ user_id: u.id, batch_id: req.batch.id, kind: 'course', title, completion_date, detail: `Cohort: ${bd.name}`, instructor_id: instructorId, issued_by: req.user.id, concepts, final_project: finalProject, partner: isPartner, deferSave: true });
    if (out.existing) { existing.push(u.name); continue; }
    if (out.ok) {
      if (!prog?.completed) AuditLog.record({ actor_id: req.user.id, action: 'certificate_completion_override', target_type: 'certificate', target_id: out.cert.id, detail: { user_id: u.id, batch_id: req.batch.id, serial: out.cert.serial, bulk: true }, deferSave: true });
      issued.push({ student: u, cert: out.cert });
    }
  }
  if (issued.length) store.persist();
  await store.pendingPersist();
  for (const { student: u, cert } of issued) {
    if (u.email) mailer.notify(u.email, `Your certificate is ready - ${title}`, `Congratulations ${u.name}! Your verified certificate for "${title}" is ready: ${APP_URL}/cert?s=${cert.serial}`);
  }
  res.json({ ok: true, issued: issued.length, existing: existing.length, skipped: skipped.length, skipped_names: skipped.slice(0, 20) });
}));
app.get('/api/certificates/mine', authRequired, (req, res) => {
  res.json({ certificates: Certificates.forUser(req.user.id).map((c) => ({ ...Certificates.publicView(c), url: `${APP_URL}/cert?s=${c.serial}` })) });
});
// v18: the signed-in account's open-web profile/dashboard - tracks, hackathons,
// events, challenges, certificates and gems, all in one place. One login works
// everywhere: portal accounts see their open-web activity here too.
app.get('/api/my/open-profile', authRequired, (req, res) => {
  const p = openUserProfile(req.user);
  p.certificates = p.certificates.map((c) => ({ ...c, url: `${APP_URL}/cert?s=${c.serial}` }));
  res.json({ profile: p });
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
// PUBLIC verification for a fee challan - what its QR code opens.
app.get('/api/verify-challan/:serial', (req, res) => {
  const c = Challans.bySerial(req.params.serial);
  if (!c) return res.status(404).json({ valid: false, error: 'No challan exists for this serial.' });
  res.json({ valid: true, challan: Challans.publicView(c), verify_url: `${APP_URL}/challan?s=${c.serial}` });
});
// Instructor signature images must be publicly visible on the certificate
// page. The CEO signature is never an image (always the typed name), so it
// is deliberately not in this allow-list.
app.get('/api/public/cert-image/:name', (req, res) => {
  const name = path.basename(String(req.params.name));
  const full = path.join(UPLOAD_DIR, name);
  const allowed = new Set(store.allData().certificates.map((x) => x.instructor_sig).filter(Boolean).map((u) => path.basename(u)));
  if (!allowed.has(name) || !fs.existsSync(full)) return res.status(404).send('Not found');
  res.sendFile(full);
});

/* ================================ v12 routes ================================ */

/* --------------------------- open sign-up + leads --------------------------- */
// Anyone can create a FREE open account with learner contact and education
// details, but no chosen password. The email is verified up front (MX check, plus a
// mailed 6-digit code when SMTP is configured - proof the inbox is real and
// reachable) BEFORE the account exists. Once verified, the system generates
// a password and emails it there, so the working inbox is confirmed for a
// second time by the one place the credentials can ever be read from. Every
// open user also becomes a lead the admin can download.
const LEARNER_STUDY_YEARS = new Set(['1', '2', '3', '4', '5+', 'graduated', 'other']);
function learnerProfileInput(body) {
  const contact = String(body.whatsapp || body.phone || '').trim();
  const city = String(body.city || '').trim();
  const university = String(body.university || '').trim();
  const degree = String(body.degree || '').trim();
  const studyYear = String(body.study_year || '').trim().toLowerCase();
  if (contact.replace(/\D/g, '').length < 10) return { error: 'Enter a valid contact or WhatsApp number.' };
  if (city.length < 2 || city.length > 100) return { error: 'Enter your city.' };
  if (university.length < 2 || university.length > 150) return { error: 'Enter your university, college, school, or institute.' };
  if (degree.length < 2 || degree.length > 150) return { error: 'Enter your degree or current program.' };
  if (!LEARNER_STUDY_YEARS.has(studyYear)) return { error: 'Choose your current study year.' };
  return { profile: {
    phone: contact, whatsapp: contact, city, university, institute: university, degree,
    education: degree, study_year: studyYear, goal: String(body.goal || '').trim().slice(0, 300),
    marketing_opt_in: body.marketing_opt_in === true ? 'yes' : 'no',
  } };
}
app.post('/api/auth/register-open', limitSignup, async (req, res) => {
  const { name, email, code } = req.body || {};
  if (!name || String(name).trim().length < 2) return res.status(400).json({ error: 'Enter your full name.' });
  if (!isEmail(email)) return res.status(400).json({ error: 'Enter a valid email address.' });
  if (!(await emailDomainExists(email))) return res.status(400).json({ error: 'That email domain does not receive mail - check the spelling and try again.' });
  const mailDown = signupMailDown();
  if (mailer.configured && !mailDown && !emailCodeValid(email, code)) return res.status(400).json({ error: 'Enter the 6-digit verification code we emailed you (request a new one if it expired).' });
  const learnerInput = learnerProfileInput(req.body || {});
  if (learnerInput.error) return res.status(400).json({ error: learnerInput.error });
  if (Users.allByLogin(email).some((u) => ['student', 'free'].includes(u.role))) return res.status(400).json({ error: 'A learner account with this email already exists - sign in instead.' });
  const { user, password } = Users.create({ name: String(name).trim(), role: 'free', email: String(email).trim().toLowerCase(), username: String(email).trim().toLowerCase() });
  Users.updateProfile(user.id, learnerInput.profile);
  Leads.upsert({ name: user.name, email: user.email, whatsapp: learnerInput.profile.phone, source: 'open-signup', user_id: user.id });
  setAuthCookie(res, sign(Users.byId(user.id)));
  // mailDown: mail is known to be undeliverable right now (see signupMailDown
  // above) - skip the send entirely rather than let it fail against Zoho's
  // quota, same as the no-SMTP case just below.
  if (!mailDown) {
    mailer.notify(user.email, 'Welcome to EchoLens - your password',
      `${hi(user.name)},\n\nYour free EchoLens account is live. Your registration number is ${user.reg_no}.\n\nSign in any time with:\nUsername: ${user.username}\nEmail: ${user.email}\nPassword: ${password}\n\nYou can change your password from Profile after signing in.\n\nSolve open quests, use the free compiler, join hackathons and webinars, and earn verified certificates: ${APP_URL}/open`);
  }
  const out = { ok: true, role: 'free' };
  if (!mailer.configured || mailDown) {
    out.password = password; // nothing will deliver it any other way right now
    out.mail_paused = mailer.configured && mailDown; // distinguishes "outage" from the permanent no-SMTP dev case, for the UI copy
  }
  res.json(out);
});

// WhatsApp is MANDATORY for every learner. The dashboard and the open site
// block until this is filled; it lands in the lead record too.
app.post('/api/me/contact', authRequired, (req, res) => {
  const { whatsapp } = req.body || {};
  if (!whatsapp || String(whatsapp).replace(/\D/g, '').length < 10) return res.status(400).json({ error: 'Enter a valid WhatsApp number (e.g. 03XX-XXXXXXX).' });
  Users.updateProfile(req.user.id, { phone: String(whatsapp).trim(),marketing_opt_in:req.body.marketing_opt_in===true?'yes':'no' });
  if (req.user.email && req.body.marketing_opt_in===true) Leads.upsert({ name: req.user.name, email: req.user.email, whatsapp: String(whatsapp).trim(), source: req.user.role === 'free' ? 'open' : 'portal', user_id: req.user.id });
  res.json({ ok: true });
});

/* ------------------------- Talent Marketplace: recruiters (Phase 1) -------------------------
 * A recruiter is a `users` row (role: 'recruiter') like any other account -
 * same JWT cookie, same /api/auth/login, same /api/auth/me - with
 * verification state layered on top (see Users.createRecruiter and
 * Users.setRecruiterStatus in store.js). requireRecruiter (auth helpers,
 * above) is what later phases use to gate the actual marketplace once it
 * exists; nothing in this phase needs to be approved to be *seen*, only to
 * search or contact students, so no route uses it yet.
 */
const DEFAULT_BLOCKED_RECRUITER_DOMAINS = ['gmail.com', 'googlemail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'live.com', 'protonmail.com', 'proton.me'];
const BLOCKED_RECRUITER_DOMAINS = process.env.RECRUITER_BLOCKED_EMAIL_DOMAINS
  ? process.env.RECRUITER_BLOCKED_EMAIL_DOMAINS.split(',').map((d) => d.trim().toLowerCase()).filter(Boolean)
  : DEFAULT_BLOCKED_RECRUITER_DOMAINS;
function recruiterView(u) {
  const c = u.company_id ? Companies.byId(u.company_id) : null;
  return {
    status: u.status, status_reason: u.status_reason || null,
    designation: u.designation || null, city: u.city || null, hiring_note: u.hiring_note || null,
    override_requested: !!u.override_requested, override_reason: u.override_reason || null,
    company: c ? { id: c.id, name: c.name, website: c.website, domain: c.domain, size_band: c.size_band } : null,
  };
}
function isOptionalUrl(s) {
  if (!s) return true;
  try { return ['http:', 'https:'].includes(new URL(String(s)).protocol); } catch { return false; }
}

app.post('/api/recruiters/signup', limitSignup, async (req, res) => {
  const { full_name, work_email, company_name, company_website, designation, city, company_size_band, hiring_note, override_requested, override_reason } = req.body || {};
  if (!full_name || String(full_name).trim().length < 2) return res.status(400).json({ error: 'Enter your full name.' });
  if (!isEmail(work_email)) return res.status(400).json({ error: 'Enter a valid work email address.' });
  if (!company_name || !String(company_name).trim()) return res.status(400).json({ error: 'Enter your company name.' });
  if (!designation || !String(designation).trim()) return res.status(400).json({ error: 'Enter your designation.' });
  if (!city || !String(city).trim()) return res.status(400).json({ error: 'Enter your city.' });
  if (!company_size_band || !String(company_size_band).trim()) return res.status(400).json({ error: 'Choose a company size.' });
  if (!hiring_note || !String(hiring_note).trim()) return res.status(400).json({ error: 'Tell us what you typically hire for.' });
  if (!isOptionalUrl(company_website)) return res.status(400).json({ error: 'Enter a valid company website (starting with http:// or https://), or leave it blank.' });

  const email = String(work_email).trim().toLowerCase();
  const domain = email.split('@')[1] || '';
  const overrideRequested = !!override_requested;
  if (BLOCKED_RECRUITER_DOMAINS.includes(domain) && !overrideRequested) {
    return res.status(400).json({
      needs_override: true,
      error: `Please sign up with your company email address, not a personal ${domain} address. If your company is too small to have its own domain email, check the box below and tell us a little more - we review these by hand.`,
    });
  }
  if (overrideRequested && (!override_reason || !String(override_reason).trim())) {
    return res.status(400).json({ error: 'Tell us briefly why you do not have a company domain email.' });
  }
  if (!(await emailDomainExists(email))) return res.status(400).json({ error: 'That email domain does not receive mail - check the spelling and try again.' });
  if (Users.allByLogin(email).some((u) => u.role === 'recruiter')) return res.status(400).json({ error: 'A recruiter account with this work email already exists - sign in instead.' });

  const company = Companies.findOrCreateByEmail(email, { name: company_name, website: company_website || null, size_band: company_size_band });
  const { user, password } = Users.createRecruiter({
    name: String(full_name).trim(), email, company_id: company.id,
    designation: String(designation).trim().slice(0, 150), city: String(city).trim().slice(0, 100),
    hiring_note: String(hiring_note).trim().slice(0, 1000),
    override_requested: overrideRequested, override_reason: overrideRequested ? String(override_reason).trim().slice(0, 500) : null,
  });
  setAuthCookie(res, sign(user));
  mailer.notify(user.email, 'Your EchoLens recruiter account is pending review',
    `${hi(user.name)},\n\nThanks for signing up to search verified student talent on EchoLens. Your account is now pending review by our team - we will email you as soon as a decision is made, usually within one business day.\n\nSign in any time with:\nUsername: ${user.username}\nEmail: ${user.email}\nPassword: ${password}\n\nYou can change your password from Settings after signing in.`);
  const adminEmails = Users.all().filter((a) => a.role === 'admin' && a.email).map((a) => a.email);
  mailer.notify(adminEmails, 'New recruiter awaiting verification',
    `A new recruiter signed up and is waiting for review: ${user.name} (${user.email}), ${company.name} - ${user.designation}.` +
    (overrideRequested ? `\n\nThey requested review without a company domain email: ${user.override_reason}` : '') +
    `\n\nReview: ${APP_URL}/admin/recruiters`);
  const out = { ok: true };
  if (!mailer.configured) out.password = password; // dev fallback: no SMTP to deliver it anywhere else
  res.json(out);
});

// A recruiter asked for more information (status 'needs_info') updates
// their own details and puts themselves back in the review queue.
app.post('/api/recruiter/resubmit', authRequired, (req, res) => {
  if (req.user.role !== 'recruiter') return res.status(403).json({ error: 'Recruiter access only.' });
  if (req.user.status !== 'needs_info') return res.status(400).json({ error: 'Your account is not awaiting more information.' });
  const { company_name, company_website, designation, city, hiring_note } = req.body || {};
  if (company_website !== undefined && !isOptionalUrl(company_website)) return res.status(400).json({ error: 'Enter a valid company website, or leave it blank.' });
  if (company_name && String(company_name).trim()) {
    const c = Companies.byId(req.user.company_id);
    if (c) {
      c.name = String(company_name).trim();
      if (company_website !== undefined) c.website = company_website || null;
      store.persist();
    }
  }
  const u = Users.resubmitRecruiter(req.user.id, { designation, city, hiring_note });
  if (!u) return res.status(400).json({ error: 'Could not update your account.' });
  AuditLog.record({ actor_id: req.user.id, action: 'recruiter_resubmit', target_type: 'user', target_id: u.id });
  res.json({ ok: true, recruiter: recruiterView(u) });
});

/* -------------------------- admin: recruiter verification queue -------------------------- */
app.get('/api/admin/recruiters', authRequired, adminRequired, (req, res) => {
  const status = req.query.status;
  const all = Users.all().filter((u) => u.role === 'recruiter');
  const list = status ? all.filter((u) => u.status === status) : all;
  const counts = { pending: 0, approved: 0, rejected: 0, needs_info: 0 };
  for (const u of all) if (counts[u.status] !== undefined) counts[u.status] += 1;
  res.json({
    recruiters: list
      .slice().sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)))
      .map((u) => ({ id: u.id, name: u.name, email: u.email, created_at: u.created_at, ...recruiterView(u) })),
    counts,
  });
});
app.post('/api/admin/recruiters/:id/approve', authRequired, adminRequired, (req, res) => {
  const u = Users.byId(req.params.id);
  if (!u || u.role !== 'recruiter') return res.status(404).json({ error: 'Recruiter not found.' });
  Users.setRecruiterStatus(u.id, 'approved', { by: req.user.id });
  AuditLog.record({ actor_id: req.user.id, action: 'recruiter_approve', target_type: 'user', target_id: u.id });
  if (u.email) mailer.notify(u.email, 'Welcome to the EchoLens Talent Marketplace',
    `${hi(u.name)},\n\nYour EchoLens recruiter account is verified. You can now sign in to the Talent Marketplace.\n\nSign in: ${APP_URL}/login`);
  res.json({ ok: true, recruiter: recruiterView(Users.byId(u.id)) });
});
app.post('/api/admin/recruiters/:id/reject', authRequired, adminRequired, (req, res) => {
  const u = Users.byId(req.params.id);
  if (!u || u.role !== 'recruiter') return res.status(404).json({ error: 'Recruiter not found.' });
  const { reason } = req.body || {};
  if (!reason || !String(reason).trim()) return res.status(400).json({ error: 'Enter a reason - it is shown to the recruiter.' });
  Users.setRecruiterStatus(u.id, 'rejected', { reason: String(reason).trim().slice(0, 1000) });
  AuditLog.record({ actor_id: req.user.id, action: 'recruiter_reject', target_type: 'user', target_id: u.id, detail: reason });
  if (u.email) mailer.notify(u.email, 'Your EchoLens recruiter application',
    `${hi(u.name)},\n\nWe are not able to verify your EchoLens recruiter account at this time.\n\nReason: ${reason}\n\nIf you believe this is a mistake, reply to this email.`);
  res.json({ ok: true, recruiter: recruiterView(Users.byId(u.id)) });
});
app.post('/api/admin/recruiters/:id/request-info', authRequired, adminRequired, (req, res) => {
  const u = Users.byId(req.params.id);
  if (!u || u.role !== 'recruiter') return res.status(404).json({ error: 'Recruiter not found.' });
  const { message } = req.body || {};
  if (!message || !String(message).trim()) return res.status(400).json({ error: 'Enter what you need from the recruiter.' });
  Users.setRecruiterStatus(u.id, 'needs_info', { reason: String(message).trim().slice(0, 1000) });
  AuditLog.record({ actor_id: req.user.id, action: 'recruiter_request_info', target_type: 'user', target_id: u.id, detail: message });
  if (u.email) mailer.notify(u.email, 'More information needed for your EchoLens recruiter account',
    `${hi(u.name)},\n\nWe need a bit more information before we can verify your EchoLens recruiter account.\n\n${message}\n\nSign in to update your details: ${APP_URL}/login`);
  res.json({ ok: true, recruiter: recruiterView(Users.byId(u.id)) });
});

/* --------------------------------- events ---------------------------------
 * The unified admin-generated system: quests, hackathons, competitions and
 * webinars - free or paid (payment screenshot verified by admin), inside the
 * portal, on the open site, or both, with an optional built-in compiler,
 * dataset URL, admin documents, AI auto-grading (-10%), pass marks, and
 * automatic certificates.
 */
function eventNotify(ev, audience) {
  if (!audience || audience === 'none') return 0;
  const emails = Leads.emailsFor(audience);
  if (!emails.length) return 0;
  const kindLabel = { quest: 'quest', hackathon: 'hackathon', competition: 'competition', webinar: 'webinar' }[ev.kind] || 'event';
  const when = ev.starts_at ? `\nStarts: ${String(ev.starts_at).replace('T', ' ')}${ev.ends_at ? '\nEnds: ' + String(ev.ends_at).replace('T', ' ') : ''}` : (ev.duration_minutes ? `\nDuration: about ${ev.duration_minutes} minutes` : '');
  const feeLine = ev.entry === 'paid' ? `\nEntry fee: PKR ${ev.fee_pkr}` : '\nEntry: FREE';
  const certLine = ev.auto_certificate ? `\nCertificate: automatic verified certificate at ${ev.pass_mark}%+ score` : '';
  mailer.notify(emails, `New ${kindLabel} on EchoLens: ${ev.title}`,
    `A new ${kindLabel} just went live on EchoLens.\n\n${ev.title}\n${String(ev.description || '').slice(0, 600)}${when}${feeLine}${certLine}\n\nJoin here: ${APP_URL}${ev.scope === 'portal' ? '/dashboard' : '/open'}`);
  return emails.length;
}

app.get('/api/events', authRequired, (req, res) => {
  const isAdmin = req.user.role === 'admin';
  // One login, everything included: free accounts see open-web events only;
  // portal accounts see their portal events PLUS all open-web events.
  const visible = isAdmin ? Events.all()
    : req.user.role === 'free' ? Events.forScope('open')
    : [...new Map([...Events.forScope('portal'), ...Events.forScope('open')].map((e) => [e.id, e])).values()].sort((a, b) => b.id - a.id);
  const list = visible
    .map((ev) => ({
      ...ev,
      my_entry: Events.entryFor(ev.id, req.user.id),
      my_progress: Events.entryFor(ev.id, req.user.id) ? Events.progressFor(ev, req.user.id) : null,
    }));
  res.json({ events: list, is_admin: isAdmin, can_play: ['free', 'student'].includes(req.user.role) });
});
app.get('/api/public/events', (req, res) => {
  res.json({ events: Events.forScope('open').filter((e) => e.open !== false).map((e) => Events.publicView(e)) });
});
app.get('/api/events/:id', authRequired, (req, res) => {
  const ev = Events.byId(req.params.id);
  if (!ev) return res.status(404).json({ error: 'Event not found.' });
  const d = Events.decorate(ev);
  const isAdmin = req.user.role === 'admin';
  const entry = Events.entryFor(ev.id, req.user.id);
  const gate = Events.canParticipate(ev, req.user.id);
  const mySubs = {};
  if (entry) for (const p of (ev.problems.length ? ev.problems : [{ pid: null }])) {
    const s = Events.submissionFor(ev.id, req.user.id, p.pid);
    if (s) mySubs[p.pid || 0] = { pid: s.pid, code: s.code, language: s.language, file_name: s.file_name, link: s.link, score: s.score, ai_feedback: s.ai_feedback, graded_by: s.graded_by === 'ai' ? 'ai' : (s.graded_by ? 'admin' : null), submitted_at: s.submitted_at, certified: s.certified };
  }
  // Meeting links (webinars) only for confirmed participants or staff.
  const showLink = isAdmin || (entry && gate.ok);
  res.json({
    event: { ...d, meeting_link: showLink ? d.meeting_link : null },
    my_entry: entry, can_participate: gate.ok, participate_msg: gate.ok ? null : gate.why,
    my_submissions: mySubs,
    my_progress: entry ? Events.progressFor(ev, req.user.id) : null,
    board: Events.board(ev.id).slice(0, 50),
    comments: Events.comments(ev.id),
    entries: isAdmin ? Events.entries(ev.id) : undefined,
    submissions: isAdmin ? Events.submissionsForAdmin(ev.id) : undefined,
    is_admin: isAdmin,
  });
});
app.post('/api/admin/events', authRequired, adminRequired, (req, res) => {
  const b = req.body || {};
  if (!b.title) return res.status(400).json({ error: 'Give the event a title.' });
  if (['hackathon', 'competition', 'webinar'].includes(b.kind) && (!b.starts_at || !b.ends_at)) {
    return res.status(400).json({ error: 'Start and end date-times are required for this kind of event.' });
  }
  const ev = Events.create(b, req.user.id);
  const notified = eventNotify(ev, b.notify);
  res.json({ ok: true, event: Events.decorate(ev), notified });
});
app.patch('/api/admin/events/:id', authRequired, adminRequired, (req, res) => {
  const ev = Events.update(req.params.id, req.body || {});
  if (!ev) return res.status(404).json({ error: 'Event not found.' });
  res.json({ ok: true, event: Events.decorate(ev) });
});
app.delete('/api/admin/events/:id', authRequired, adminRequired, (req, res) => { Events.remove(req.params.id); res.json({ ok: true }); });
// Admin attaches documents (rules PDF, datasets, briefs) to any event.
app.post('/api/admin/events/:id/files', authRequired, adminRequired, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Choose a file first.' });
  const ev = Events.addFile(req.params.id, { name: req.file.originalname, url: `/uploads/${req.file.filename}` });
  if (!ev) return res.status(404).json({ error: 'Event not found.' });
  res.json({ ok: true, files: ev.files });
});
app.delete('/api/admin/events/:id/files/:name', authRequired, adminRequired, (req, res) => {
  const ev = Events.removeFile(req.params.id, req.params.name);
  if (!ev) return res.status(404).json({ error: 'Event not found.' });
  res.json({ ok: true, files: ev.files });
});
// Registration. Paid events REQUIRE a payment screenshot (image) which the
// admin verifies by eye before the participant can submit anything.
app.post('/api/events/:id/register', authRequired, upload.single('file'), (req, res) => {
  if (!['free', 'student'].includes(req.user.role)) return res.status(403).json({ error: 'Events are for learners.' });
  const ev = Events.byId(req.params.id);
  if (!ev) return res.status(404).json({ error: 'Event not found.' });
  let shot = null;
  if (ev.entry === 'paid') {
    if (!requireImage(req, res, 5)) return;
    shot = `/uploads/${req.file.filename}`;
  }
  const out = Events.register({ event_id: ev.id, user: req.user, payment_shot: shot });
  if (out.error) return res.status(400).json({ error: out.error });
  // Every event / hackathon / competition / webinar registration is reported
  // to the Admissions Office, and the participant gets a confirmation email.
  const evKind = ev.kind || 'event';
  mailer.notify(ADMISSIONS_EMAIL, `New ${evKind} registration - ${req.user.name}`,
    `${req.user.name} registered for the ${evKind} "${ev.title}".\nEmail: ${req.user.email || '-'}${ev.entry === 'paid' ? '\nEntry: paid - a payment screenshot was uploaded for verification.' : '\nEntry: free'}\n\nDetails are in the Admissions Office portal (Event registrations) and the admin Events tab.`);
  if (req.user.email) {
    mailer.notify(req.user.email, `EchoLens - you're registered for ${ev.title}`,
      `${hi(req.user.name)},\n\nWe received your registration for the ${evKind} "${ev.title}".${ev.entry === 'paid' ? ' Your payment screenshot is being verified - you will get a confirmation email once it is cleared.' : ' You are all set - see the event page for dates and details.'}\n\nEchoLens Digital`);
  }
  if (ev.entry === 'paid') {
    const admins = store.allData().users.filter((u) => u.role === 'admin' && u.email).map((u) => u.email);
    mailer.notify(admins, `Payment to verify - ${ev.title}`, `${req.user.name} registered for "${ev.title}" and uploaded a payment screenshot. Verify it from the Events tab in the admin portal.`);
  }
  res.json({ ok: true, ...out });
});
app.post('/api/admin/event-entries/:id/payment', authRequired, adminRequired, (req, res) => {
  const e = Events.confirmPayment(req.params.id, !!(req.body || {}).confirm, req.user.id);
  if (!e) return res.status(404).json({ error: 'Entry not found.' });
  const u = Users.byId(e.user_id);
  const ev = Events.byId(e.event_id);
  if (u && u.email && ev) {
    mailer.notify(u.email, `Payment ${e.payment_status} - ${ev.title}`,
      e.payment_status === 'confirmed'
        ? `Your payment for "${ev.title}" is confirmed - you can now participate and submit. Good luck!`
        : `Your payment screenshot for "${ev.title}" could not be verified. Reply to this email or contact the academy to resolve it.`);
  }
  res.json({ ok: true, entry: e });
});
// Submissions: editor code, an uploaded file (any document), and/or a link -
// per problem for quests/competitions, single for hackathons. When the event
// has AI auto-grading on, the submission is graded immediately with a 10%
// reduction, and a certificate is issued automatically at the pass mark.
app.post('/api/events/:id/submit', authRequired, upload.single('file'), async (req, res) => {
  if (!['free', 'student'].includes(req.user.role)) return res.status(403).json({ error: 'Events are for learners.' });
  const ev = Events.byId(req.params.id);
  if (!ev) return res.status(404).json({ error: 'Event not found.' });
  const body = req.body || {};
  let file_url = null, file_name = null;
  if (req.file) { file_url = `/uploads/${req.file.filename}`; file_name = req.file.originalname; }
  if (body.link && !/^https?:\/\//i.test(String(body.link))) return res.status(400).json({ error: 'Links must start with http:// or https://' });
  const out = Events.submit({
    event_id: ev.id, user: req.user, pid: body.pid || null,
    code: body.code || null, language: body.language || null, output: body.output || null,
    file_url, file_name, link: body.link || null, note: body.note || null,
  });
  if (out.error) return res.status(400).json({ error: out.error });
  let graded = null, cert = null;
  if (ev.auto_grade && ai.enabled()) {
    try {
      const pr = (ev.problems || []).find((p) => p.pid === Number(body.pid)) || { title: ev.title, description: ev.description };
      let text = out.submission.code;
      if (!text && file_url) { const ex = await extractText(file_url); text = ex.text; }
      if (!text && out.submission.link) text = `The participant submitted only a link: ${out.submission.link}. Grade conservatively based on the task; you cannot open links.`;
      const evRubric = graderContext(pr, ev);
      const g = await ai.autoGrade(req.user.id, {
        eventTitle: ev.title, problemTitle: pr.title, problemBrief: pr.description,
        passMark: ev.pass_mark, code: out.submission.code, language: out.submission.language, text,
        criteria: evRubric.criteria, solution: evRubric.solution,
        expectedOutput: evRubric.expectedOutput, sampleInput: evRubric.sampleInput,
        output: out.submission.output || null,
      });
      graded = Events.applyAiGrade(out.submission.id, g.score, g.feedback);
      const c = Events.maybeCertify(ev, req.user.id, ev.created_by);
      if (c && c.cert && !c.existing) {
        cert = c.cert;
        if (req.user.email) mailer.notify(req.user.email, `Certificate earned - ${ev.title}`,
          `Congratulations ${req.user.name}!\n\nYou passed "${ev.title}" and your verified certificate has been issued automatically (serial ${cert.serial}).\n\nView, download and share it: ${APP_URL}/cert?s=${cert.serial}`);
      }
    } catch (e) { console.error('Auto-grade failed:', e.message); /* stays pending for manual scoring */ }
  }
  res.json({ ok: true, submission: graded || out.submission, cert: cert ? { serial: cert.serial, url: `${APP_URL}/cert?s=${cert.serial}` } : null, progress: Events.progressFor(ev, req.user.id) });
});
// Discussion thread on an event - open to any signed-in user; staff or the
// author can delete a comment.
app.get('/api/events/:id/comments', authRequired, (req, res) => {
  const ev = Events.byId(req.params.id);
  if (!ev) return res.status(404).json({ error: 'Event not found.' });
  res.json({ comments: Events.comments(ev.id) });
});
app.post('/api/events/:id/comments', authRequired, (req, res) => {
  const ev = Events.byId(req.params.id);
  if (!ev) return res.status(404).json({ error: 'Event not found.' });
  const out = Events.addComment({ event_id: ev.id, user: req.user, body: (req.body || {}).body });
  if (out.error) return res.status(400).json({ error: out.error });
  res.json({ ok: true, comment: out.comment });
});
app.delete('/api/events/:id/comments/:cid', authRequired, (req, res) => {
  const out = Events.removeComment(req.params.cid, req.user);
  if (out.error) return res.status(400).json({ error: out.error });
  res.json({ ok: true });
});
app.post('/api/admin/event-submissions/:id/score', authRequired, adminRequired, (req, res) => {
  const { score, remarks } = req.body || {};
  if (score == null || isNaN(Number(score))) return res.status(400).json({ error: 'Score 0-100 required.' });
  const s = Events.score(req.params.id, score, remarks, req.user.id);
  if (!s) return res.status(404).json({ error: 'Submission not found.' });
  const ev = Events.byId(s.event_id);
  const c = ev ? Events.maybeCertify(ev, s.user_id, req.user.id) : null;
  if (c && c.cert && !c.existing) {
    const u = Users.byId(s.user_id);
    if (u && u.email) mailer.notify(u.email, `Certificate earned - ${ev.title}`, `Congratulations ${u.name}! You passed "${ev.title}" - your verified certificate: ${APP_URL}/cert?s=${c.cert.serial}`);
  }
  res.json({ ok: true, submission: s, cert: c && c.cert ? { serial: c.cert.serial } : null, progress: ev ? Events.progressFor(ev, s.user_id) : null });
});

/* ------------------------------ leads & email ------------------------------ */
app.get('/api/admin/leads', authRequired, adminRequired, (req, res) => res.json({ leads: Leads.all() }));
// Email suppression list: addresses that hard-bounced or were rejected by
// the ESP on a past blast and are skipped on every future send. An admin can
// review it and, rarely, un-suppress an address they know is now valid.
app.get('/api/admin/suppressions', authRequired, adminRequired, (req, res) => res.json({ suppressions: Suppressions.all() }));
app.delete('/api/admin/suppressions/:email', authRequired, adminRequired, async (req, res) => {
  const removed = await Suppressions.remove(req.params.email);
  AuditLog.record({ actor_id: req.user.id, action: 'suppression_remove', target_type: 'email', detail: req.params.email });
  res.json({ ok: true, removed });
});
app.get('/api/admin/leads.csv', authRequired, adminRequired, (req, res) => {
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="echolens-leads-${new Date().toISOString().slice(0, 10)}.csv"`);
  res.send(Leads.csv());
});
// Manually add contacts to the leads database - a conference list, a
// referral introduction, anyone the admin wants in the cold-mailing list
// without them ever having signed up. Joins the same table as sign-up leads,
// so it is included in every "leads" / "everyone" email blast below.
// Accepts one or many emails (comma or newline separated). Any address that
// already belongs to a registered user, or is already in the leads database,
// is silently skipped rather than duplicated - the remaining new addresses
// are added.
app.post('/api/admin/leads', authRequired, adminRequired, (req, res) => {
  const { name, email, whatsapp } = req.body || {};
  const rawList = String(email || '').split(/[,\n]+/).map((s) => s.trim().toLowerCase()).filter(Boolean);
  const uniqueEmails = [...new Set(rawList)];
  if (!uniqueEmails.length) return res.status(400).json({ error: 'Enter at least one email address.' });
  const bad = uniqueEmails.find((em) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em));
  if (bad) return res.status(400).json({ error: `"${bad}" is not a valid email address.` });

  const existingLeadEmails = new Set(Leads.all().map((l) => l.email));
  const added = [];
  const skipped = [];
  // deferSave: true on every row below - a bulk paste can be 100+ emails,
  // and saving after each one would queue that many separate Postgres
  // transactions for a single request. One store.persist() after the loop
  // covers everything (leads + the audit log entry) in one flush.
  for (const em of uniqueEmails) {
    const existingUser = Users.byLogin(em);
    const isExistingUser = existingUser && existingUser.email && existingUser.email.toLowerCase() === em;
    if (isExistingUser || existingLeadEmails.has(em)) { skipped.push(em); continue; }
    const lead = Leads.upsert({
      name: uniqueEmails.length === 1 ? String(name || '').trim() : '',
      email: em,
      whatsapp: uniqueEmails.length === 1 ? String(whatsapp || '').trim() : '',
      source: 'manual',
      deferSave: true,
    });
    added.push(lead);
    existingLeadEmails.add(em);
  }
  AuditLog.record({ actor_id: req.user.id, action: 'lead_add_manual', target_type: 'lead', detail: `+${added.length}${skipped.length ? `, skipped ${skipped.length} (already exist): ${skipped.slice(0, 50).join(', ')}` : ''}`, deferSave: true });
  store.persist();
  res.json({ ok: true, added, skipped, count_added: added.length, count_skipped: skipped.length });
});
// One composer for everything: announcements, enrollment openings, discounts,
// new batches, cold outreach to the leads database - the admin writes the
// mail, picks the audience, optionally attaches documents/pictures and the
// direct registration link, and it goes out from the company address
// (MAIL_FROM, info@echolens.digital) like a real cold-mailing platform.
const BLAST_ATTACH_EXT = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.csv', '.jpg', '.jpeg', '.png', '.gif', '.webp'];
const BLAST_MAX_TOTAL_BYTES = 20 * 1024 * 1024; // most mail servers reject bigger attachments
app.post('/api/admin/email-blast', authRequired, adminRequired, upload.array('files', 5), (req, res) => {
  const cleanup = () => { for (const f of req.files || []) { try { fs.unlinkSync(f.path); } catch {} } };
  const { subject, body, audience, registration_link } = req.body || {};
  if (!subject || !body) { cleanup(); return res.status(400).json({ error: 'Write a subject and a message.' }); }
  if (!['portal', 'open', 'all', 'leads'].includes(audience)) { cleanup(); return res.status(400).json({ error: 'Pick an audience: leads, portal students, open students, or everyone.' }); }
  for (const f of req.files || []) {
    if (!BLAST_ATTACH_EXT.includes(path.extname(f.originalname).toLowerCase())) {
      cleanup();
      return res.status(400).json({ error: `${f.originalname}: attach PDFs, Word/Excel/PowerPoint documents, or images only.` });
    }
  }
  const totalBytes = (req.files || []).reduce((n, f) => n + f.size, 0);
  if (totalBytes > BLAST_MAX_TOTAL_BYTES) { cleanup(); return res.status(400).json({ error: 'Attachments are too large - keep the total under 20 MB.' }); }
  const emails = Leads.emailsFor(audience);
  if (!emails.length) { cleanup(); return res.status(400).json({ error: 'No email addresses found for that audience yet.' }); }
  const attachments = (req.files || []).map((f) => ({ filename: f.originalname, content: fs.readFileSync(f.path) }));
  cleanup();
  let text = String(body).slice(0, 8000);
  if (registration_link === '1' || registration_link === 'true') {
    const registrationUrl = /^https?:\/\//i.test(KEY_LINKS.registration) ? KEY_LINKS.registration : `${APP_URL}${KEY_LINKS.registration}`;
    text += `\n\nRegister directly here: ${registrationUrl}`;
  }
  // A blast is outreach: it goes through the BULK provider (ESP HTTP API),
  // never the personal SMTP mailbox. It is DRY by default (MAIL_DRY_RUN) -
  // it logs the recipients and counts and sends nothing until an operator
  // sets MAIL_DRY_RUN=false. mailer.sendBulk paces it, and its circuit
  // breaker aborts the ENTIRE run the instant the ESP signals abuse / quota
  // / a sender block, or after too many consecutive failures - a failing run
  // must stop, not grind through the rest of the list.
  //
  // The response below doesn't wait for the send. Once it settles, every
  // address the ESP permanently rejected is added to the suppression list
  // (Suppressions.add, also called live via onReject) and skipped on every
  // future blast. The lead row itself is kept - a bounce is not a reason to
  // silently delete contact data.
  Suppressions.load()
    .then((suppressed) => mailer.sendBulk(emails, String(subject).slice(0, 200), text, {
      label: `email-blast ${audience}`,
      attachments: attachments.length ? attachments : undefined,
      isSuppressed: (em) => suppressed.has(em),
      onReject: ({ email, code, reason }) => Suppressions.add({ email, code, reason, source: `blast:${audience}` }).catch(() => {}),
    }))
    .then((result) => {
      if (result.dryRun) {
        console.log(`[email-blast] ${audience}: DRY RUN - ${result.requested} requested, ${result.suppressed.length} suppressed, 0 sent (MAIL_DRY_RUN)`);
        AuditLog.record({ actor_id: req.user.id, action: 'email_blast_dryrun', target_type: 'email_blast', detail: `${audience}: DRY RUN, ${result.requested} would-be recipients, ${result.suppressed.length} suppressed`, deferSave: true });
        store.persist();
        return;
      }
      const abortNote = result.aborted ? ` - ABORTED: ${result.abortReason}` : '';
      console.log(`[email-blast] ${audience} via ${result.provider}: ${result.sent.length} sent, ${result.tempFail.length} deferred, ${result.permanentFail.length} rejected, ${result.suppressed.length} pre-suppressed, of ${result.requested}${abortNote}`);
      AuditLog.record({
        actor_id: req.user.id,
        action: result.aborted ? 'email_blast_aborted' : 'email_blast_done',
        target_type: 'email_blast',
        detail: `${audience} via ${result.provider}: ${result.sent.length}/${result.requested} sent, ${result.tempFail.length} deferred, ${result.permanentFail.length} rejected, ${result.suppressed.length} suppressed${abortNote}`,
        deferSave: true,
      });
      for (const bad of result.permanentFail) Suppressions.add({ email: bad, reason: 'hard bounce during blast', source: `blast:${audience}` }).catch(() => {});
      store.persist();
    })
    .catch((e) => console.error('[email-blast] send failed:', e.message));
  AuditLog.record({ actor_id: req.user.id, action: 'email_blast', target_type: 'email_blast', detail: `${audience} (${emails.length})${attachments.length ? ` +${attachments.length} attachment(s)` : ''} - ${subject}` });
  // `queued`, not `sent`: sendBulk runs in the background in paced batches.
  // The real outcome lands in the audit log once it finishes.
  res.json({ ok: true, queued: emails.length, dry_run: mailer.bulkDryRun, provider: mailer.status().bulk.provider, attachments: attachments.length });
});

/* -------------------------------- analytics -------------------------------- */
// Complete stats to monitor progress: totals, plus time-series with segment
// dropdowns (portal / open / a specific course, batch, or event) and daily /
// weekly / monthly / yearly granularity.
// A custom date range (both 'YYYY-MM-DD', or neither) scopes every count and
// the chart to that window instead of the fixed default lookback - used by
// the Reports page's date pickers ("last 2 weeks", "this month", etc.) and
// by both downloadable report formats below.
function parseDateRange(q) {
  const from = /^\d{4}-\d{2}-\d{2}$/.test(String((q || {}).from || '')) ? String(q.from) : null;
  const to = /^\d{4}-\d{2}-\d{2}$/.test(String((q || {}).to || '')) ? String(q.to) : null;
  return (from && to) ? { from, to } : { from: null, to: null };
}
app.get('/api/admin/analytics', authRequired, staffView, (req, res) => {
  const { metric, segment, granularity, batch_id, event_id } = req.query || {};
  const { from, to } = parseDateRange(req.query);
  res.json({
    totals: Analytics.overview({ from, to }),
    series: Analytics.series({
      metric: String(metric || 'signups'), segment: String(segment || 'all'),
      granularity: ['daily', 'weekly', 'monthly', 'yearly'].includes(String(granularity)) ? String(granularity) : 'daily',
      batch_id: batch_id || null, event_id: event_id || null, from, to,
    }),
    batches: Batches.all().map((b) => ({ id: b.id, name: b.name })),
    events: Events.all().map((e) => ({ id: e.id, title: e.title, kind: e.kind })),
    range: { from, to },
  });
});
// Downloadable versions of the Reports page: the same summary totals shown
// as cards, plus the time series for whichever metric/segment/granularity
// (and optional date range) is currently selected - so "Monthly" + download
// gives a monthly report, and picking a date range gives a report for just
// those days/weeks. Two formats: a plain CSV, and a letterhead-branded PDF
// (stats table + bar chart) suitable for printing or sharing as-is.
const ANALYTICS_METRIC_LABEL = { signups: 'New sign-ups', enrollments: 'Course enrollments', event_registrations: 'Event registrations', event_submissions: 'Event submissions', quest_submissions: 'Quest submissions', leads: 'New leads' };
const ANALYTICS_SEGMENT_LABEL = { all: 'Everyone', portal: 'Portal students', open: 'Open (website) students' };
function loadAnalyticsReport(query) {
  const { metric, segment, granularity, batch_id, event_id } = query || {};
  const gran = ['daily', 'weekly', 'monthly', 'yearly'].includes(String(granularity)) ? String(granularity) : 'daily';
  const met = String(metric || 'signups');
  const seg = String(segment || 'all');
  const { from, to } = parseDateRange(query);
  const series = Analytics.series({ metric: met, segment: seg, granularity: gran, batch_id: batch_id || null, event_id: event_id || null, from, to });
  const totals = Analytics.overview({ from, to });
  return { totals, series, metric: met, segment: seg, granularity: gran, from, to };
}
app.get('/api/admin/analytics.csv', authRequired, staffView, (req, res) => {
  const { totals: t, series, metric: met, segment, granularity: gran, from, to } = loadAnalyticsReport(req.query);
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const rows = [];
  rows.push([esc(`EchoLens report - generated ${new Date().toISOString().slice(0, 10)}`)].join(','));
  rows.push([esc(from && to ? `Report period: ${from} to ${to}` : 'Report period: all time')].join(','));
  rows.push('');
  rows.push('Summary totals');
  for (const [label, val] of [
    ['Total sign-ups', t.total_signups], ['Portal students', t.portal_students], ['Open (website) users', t.open_users],
    ['Leads collected', t.leads], ['Course enrollments', t.enrollments], ['Event registrations', t.event_registrations],
    ['Event submissions', t.event_submissions], ['Certificates issued', t.certificates_issued], ['Running courses', t.running_courses],
  ]) rows.push([esc(label), val].join(','));
  rows.push('');
  rows.push([esc(`${ANALYTICS_METRIC_LABEL[met] || met} (${gran}${met === 'signups' ? ', ' + (ANALYTICS_SEGMENT_LABEL[segment] || 'Everyone') : ''})`)].join(','));
  rows.push(['Date', 'Count'].join(','));
  series.labels.forEach((label, i) => rows.push([esc(label), series.counts[i]].join(',')));
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="echolens-report-${gran}-${new Date().toISOString().slice(0, 10)}.csv"`);
  res.send(rows.join('\n'));
});
app.get('/api/admin/analytics.pdf', authRequired, staffView, async (req, res) => {
  try {
    const report = loadAnalyticsReport(req.query);
    const pdf = await analyticsReportPdf({ ...report, settings: Settings.cert() });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="echolens-report-${report.granularity}-${new Date().toISOString().slice(0, 10)}.pdf"`);
    res.send(pdf);
  } catch (e) { res.status(500).json({ error: 'Could not generate the report PDF: ' + e.message }); }
});

/* ----------------------------- dataset URL proxy -----------------------------
 * The compiler can read a dataset straight from a URL. Browsers block most
 * cross-origin fetches (CORS), so this signed-in-only proxy pulls the file
 * server-side: text/CSV/JSON only, 15 MB cap, http(s) only.
 */
// SSRF guard: a signed-in user must not be able to point this proxy at the
// server's own network - cloud metadata endpoints, localhost, or private
// LAN ranges. Resolve the host and reject anything that isn't a public IP.
function isPrivateIp(ip) {
  if (!ip) return true;
  if (ip.includes(':')) { // IPv6
    const l = ip.toLowerCase();
    return l === '::1' || l.startsWith('fc') || l.startsWith('fd') || l.startsWith('fe80') || l.startsWith('::ffff:127.') || l.startsWith('::ffff:10.') || l.startsWith('::ffff:192.168.') || l.startsWith('::ffff:169.254.');
  }
  const p = ip.split('.').map(Number);
  if (p.length !== 4 || p.some((n) => Number.isNaN(n))) return true;
  return p[0] === 127 || p[0] === 10 || p[0] === 0 ||
    (p[0] === 169 && p[1] === 254) ||                 // link-local + cloud metadata (169.254.169.254)
    (p[0] === 172 && p[1] >= 16 && p[1] <= 31) ||
    (p[0] === 192 && p[1] === 168) ||
    (p[0] === 100 && p[1] >= 64 && p[1] <= 127) ||    // carrier-grade NAT
    p[0] >= 224;                                      // multicast / reserved
}
async function assertPublicHost(hostname) {
  // A bare IP literal is checked directly; a name is resolved and every
  // returned address must be public (defends against DNS that maps a public
  // name to a private address).
  const net = require('net');
  if (net.isIP(hostname)) { if (isPrivateIp(hostname)) throw new Error('private'); return; }
  const addrs = await dns.lookup(hostname, { all: true });
  if (!addrs.length || addrs.some((a) => isPrivateIp(a.address))) throw new Error('private');
}
app.get('/api/fetch-dataset', authRequired, async (req, res) => {
  try {
    const url = String(req.query.url || '');
    if (!/^https?:\/\//i.test(url)) return res.status(400).json({ error: 'Give a full http(s) URL to the dataset.' });
    try { await assertPublicHost(new URL(url).hostname); }
    catch { return res.status(400).json({ error: 'That URL points to a private or internal address and cannot be fetched.' }); }
    const r = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(20000) });
    if (!r.ok) return res.status(400).json({ error: `The dataset URL answered ${r.status}.` });
    const buf = Buffer.from(await r.arrayBuffer());
    if (buf.length > 15 * 1024 * 1024) return res.status(400).json({ error: 'Dataset too large - keep it under 15 MB.' });
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('X-Dataset-Name', path.basename(new URL(url).pathname) || 'dataset.csv');
    res.send(buf);
  } catch (e) { res.status(400).json({ error: 'Could not fetch that URL - check it opens in a browser and try again.' }); }
});


/* ------------------------- v12: catalogue & key links -------------------------
 * The August 2026 catalogue - 31 programs with prices, badges, free modes and
 * the enrolment links. Sign-in required: the catalogue is not openly visible.
 */
const KEY_LINKS = {
  registration: process.env.REGISTRATION_FORM_URL || '/open#register',
};
app.get(['/api/catalogue', '/api/public/catalogue'], (req, res) => {
  const enrollment_counts = {};
  Users.all().forEach((u) => (u.profile?.free_course_enrollments || []).forEach((e) => {
    if (e.track_key) enrollment_counts[e.track_key] = (enrollment_counts[e.track_key] || 0) + 1;
  }));
  res.json({
    catalogue: store.publicCatalogue().map((c) => ({ ...c, enrollment_count: enrollment_counts[c.track_key] || 0 })),
    paths: store.learningPaths().map(p => ({ ...p, enrollment_available: false, availability_reason: 'Bundle enrollment is not available yet. Choose an individual course.' })),
    free_families: store.freeFamilies(),
    links: KEY_LINKS,
    cohort: null,
    counts:{total:officialCatalogue().length,free:officialCatalogue().filter(c=>c.price_pkr===0).length, open_web_enrollments:Object.values(enrollment_counts).reduce((a,b)=>a+b,0)},
  });
});


/* =============================== v12.3 routes =============================== */
const dns = require('dns').promises;

/* Real-world email checks (item 8): format, then an MX lookup so obviously
 * fake domains are rejected at signup. When SMTP is configured, a 6-digit
 * verification code is emailed and must be entered - proof the inbox exists. */
async function emailDomainExists(email) {
  try {
    const domain = String(email).split('@')[1];
    if (!domain) return false;
    const mx = await Promise.race([
      dns.resolveMx(domain),
      new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 4000)),
    ]);
    return Array.isArray(mx) && mx.length > 0;
  } catch (e) {
    if (e.code === 'ENOTFOUND' || e.code === 'ENODATA') return false;
    return true; // DNS unavailable: do not block signups on infrastructure hiccups
  }
}
const EMAIL_CODES = new Map(); // email -> { code, expires, tries }
/**
 * TEMPORARY: Zoho's transactional mailbox hit its daily send limit on
 * 2026-09-14 (resets ~24h later). Until it resets, a verification code or
 * welcome email sent through it never arrives - which was silently blocking
 * every open-course signup behind a code field nobody could ever fill in.
 *
 * While this is active, open signup behaves exactly like the existing
 * "no SMTP configured" path below: no code is requested, no mail is
 * attempted, and the generated password is returned in the API response
 * once so the student can still sign in later.
 *
 *   SIGNUP_MAIL_DOWN=false   turn it off immediately (Zoho has recovered)
 *   SIGNUP_MAIL_DOWN=true    force it on, ignoring the auto window
 *   unset                    auto: on for 24h from this process starting
 */
const SIGNUP_MAIL_DOWN_OVERRIDE = process.env.SIGNUP_MAIL_DOWN;
const SIGNUP_MAIL_DOWN_AUTO_UNTIL = Date.now() + 24 * 3600_000;
function signupMailDown() {
  if (SIGNUP_MAIL_DOWN_OVERRIDE != null) return SIGNUP_MAIL_DOWN_OVERRIDE.toLowerCase() === 'true';
  return Date.now() < SIGNUP_MAIL_DOWN_AUTO_UNTIL;
}
app.post('/api/auth/email-code', limitEmailSend, async (req, res) => {
  const { email } = req.body || {};
  if (!isEmail(email)) return res.status(400).json({ error: 'Enter a valid email address.' });
  if (!(await emailDomainExists(email))) return res.status(400).json({ error: 'That email domain does not receive mail - check the spelling and try again.' });
  if (!mailer.configured || signupMailDown()) return res.json({ ok: true, verification: false }); // no SMTP, or mail temporarily down: MX check is the gate
  const code = String(Math.floor(100000 + Math.random() * 900000));
  EMAIL_CODES.set(String(email).toLowerCase(), { code, expires: Date.now() + 10 * 60 * 1000, tries: 0 });
  mailer.notify(email, 'Your EchoLens verification code', `Your EchoLens verification code is ${code}. It expires in 10 minutes. If you did not request this, ignore this email.`);
  res.json({ ok: true, verification: true });
});
function emailCodeValid(email, code) {
  const rec = EMAIL_CODES.get(String(email).toLowerCase());
  if (!rec) return false;
  if (Date.now() > rec.expires || rec.tries >= 5) { EMAIL_CODES.delete(String(email).toLowerCase()); return false; }
  rec.tries += 1;
  if (rec.code !== String(code)) return false;
  EMAIL_CODES.delete(String(email).toLowerCase());
  return true;
}

/* ------------------------- public announcements (item 7) ------------------------- */
app.get('/api/public/announcements', (req, res) => res.json({ announcements: PublicAnnouncements.all() }));
app.post('/api/admin/public-announcements', authRequired, adminRequired, (req, res) => {
  const b = req.body || {};
  if (!b.title || !b.body) return res.status(400).json({ error: 'Give the announcement a title and a message.' });
  const a = PublicAnnouncements.create(b, req.user.id);
  if (['portal', 'open', 'all'].includes(b.notify)) {
    const emails = Leads.emailsFor(b.notify);
    // An announcement to a whole audience is outreach - route it through the
    // bulk provider (ESP), never the personal mailbox. DRY by default.
    if (emails.length) {
      const text = `${a.body}${a.link ? `\n\n${a.link_label || 'More details'}: ${a.link}` : ''}\n\nSee all announcements: ${APP_URL}/open`;
      Suppressions.load()
        .then((suppressed) => mailer.sendBulk(emails, `EchoLens announcement: ${a.title}`, text, {
          label: `public-announcement ${a.id}`,
          isSuppressed: (em) => suppressed.has(em),
          onReject: ({ email, code, reason }) => Suppressions.add({ email, code, reason, source: 'public-announcement' }).catch(() => {}),
        }))
        .catch((e) => console.error('[public-announcement] bulk send failed:', e.message));
    }
  }
  res.json({ ok: true, announcement: a });
});
app.patch('/api/admin/public-announcements/:id', authRequired, adminRequired, (req, res) => {
  const a = PublicAnnouncements.update(req.params.id, req.body || {});
  if (!a) return res.status(404).json({ error: 'Announcement not found.' });
  res.json({ ok: true, announcement: a });
});
app.delete('/api/admin/public-announcements/:id', authRequired, adminRequired, (req, res) => { PublicAnnouncements.remove(req.params.id); res.json({ ok: true }); });

/* ------------------------------- jobs board (v17) -------------------------------
 * Admin sources and posts jobs; every signed-in student, teacher and
 * coordinator can browse, discuss in comments, and apply directly with the
 * employer via the link/email on the posting - EchoLens never brokers the
 * application itself.
 */
app.get('/api/jobs', authRequired, (req, res) => {
  res.json({ jobs: Jobs.all().map(Jobs.summary) });
});
app.get('/api/jobs/:id', authRequired, (req, res) => {
  const j = Jobs.byId(req.params.id);
  if (!j) return res.status(404).json({ error: 'Job not found.' });
  res.json({ job: Jobs.detail(j), comments: JobComments.forJob(j.id) });
});
app.post('/api/admin/jobs', authRequired, adminRequired, (req, res) => {
  const b = req.body || {};
  if (!b.title || !b.company || !b.description) return res.status(400).json({ error: 'Title, company and description are required.' });
  if (!b.apply_url && !b.apply_email) return res.status(400).json({ error: 'Add an application link or an email so students can apply.' });
  if (b.apply_url && !/^https?:\/\//i.test(String(b.apply_url))) return res.status(400).json({ error: 'The application link must start with http:// or https://.' });
  const job = Jobs.create({ ...b, posted_by: req.user.id });
  res.json({ ok: true, job: Jobs.detail(job) });
});
app.patch('/api/admin/jobs/:id', authRequired, adminRequired, (req, res) => {
  const b = req.body || {};
  if (b.apply_url && !/^https?:\/\//i.test(String(b.apply_url))) return res.status(400).json({ error: 'The application link must start with http:// or https://.' });
  const job = Jobs.update(req.params.id, b);
  if (!job) return res.status(404).json({ error: 'Job not found.' });
  res.json({ ok: true, job: Jobs.detail(job) });
});
app.delete('/api/admin/jobs/:id', authRequired, adminRequired, (req, res) => {
  if (!Jobs.byId(req.params.id)) return res.status(404).json({ error: 'Job not found.' });
  Jobs.remove(req.params.id); res.json({ ok: true });
});
app.post('/api/jobs/:id/comments', authRequired, (req, res) => {
  const j = Jobs.byId(req.params.id);
  if (!j) return res.status(404).json({ error: 'Job not found.' });
  const body = String((req.body || {}).body || '').trim();
  if (!body) return res.status(400).json({ error: 'Write a comment first.' });
  const c = JobComments.create({ job_id: j.id, user: req.user, body });
  res.json({ ok: true, comment: c });
});
app.delete('/api/jobs/comments/:id', authRequired, (req, res) => {
  const c = JobComments.byId(req.params.id);
  if (!c) return res.status(404).json({ error: 'Comment not found.' });
  if (c.user_id !== req.user.id && req.user.role !== 'admin') return res.status(403).json({ error: 'You can only delete your own comment.' });
  JobComments.remove(c.id); res.json({ ok: true });
});

/* ------------------- in-site course registration (item 6) ------------------- */
app.post('/api/public/register-interest', limitLead, asyncRoute(async (req, res) => {
  const b = { ...req.body };
  if (b.company) return res.json({ ok: true }); // honeypot field: bots fill it, humans never see it
  const resolved = store.resolveOffering(b.course_code);
  if (resolved.error) return res.status(400).json({ error: resolved.error });
  b.course_code = resolved.offer.code; b.course_title = resolved.offer.title;
  if (!b.name || String(b.name).trim().length < 2) return res.status(400).json({ error: 'Enter your full name.' });
  if (!isEmail(b.email)) return res.status(400).json({ error: 'Enter a valid email address.' });
  if (!(await emailDomainExists(b.email))) return res.status(400).json({ error: 'That email domain does not receive mail - check the spelling.' });
  if (!b.whatsapp || String(b.whatsapp).replace(/\D/g, '').length < 10) return res.status(400).json({ error: 'Enter your WhatsApp number (e.g. 03XX-XXXXXXX).' });
  // Optional ambassador referral code: 4 digits, checked automatically. A
  // valid code attaches the ambassador plus the 10% discount category, which
  // then flows through to the fee challan on its own.
  const rawCode = String(b.ambassador_code || '').trim();
  if (rawCode) {
    if (!/^\d{4}$/.test(rawCode)) return res.status(400).json({ error: 'Ambassador codes are 4 digits - check the code or leave the field empty.' });
    const amb = Ambassadors.byCode(rawCode);
    if (!amb) return res.status(400).json({ error: 'That ambassador code is not recognised - check it with your ambassador or leave the field empty.' });
    b.ambassador_code = amb.code;
    b.ambassador_name = amb.name;
    let cat = DiscountCategories.all().find((c) => c.active && c.type === 'percent' && c.value === 10 && /ambassador/i.test(c.name));
    if (!cat) cat = DiscountCategories.create({ name: 'Ambassador referral', type: 'percent', value: 10 }, null);
    b.discount_category_id = cat.id;
  } else { delete b.ambassador_code; }
  const previous = Registrations.find(b.email, b.course_code);
  if (previous) {
    const sameRequest = previous.status?.request_key && previous.status.request_key === b.request_key;
    return res.json({ ok: true, existing: true, reference: `EL-R-${previous.id}`, receipt_url: sameRequest ? `/registration-status#${Registrations.receiptToken(previous)}` : null, message: 'A registration for this email and course already exists. Use your saved receipt or recover it by email.' });
  }
  const r = Registrations.create(b);
  if(b.marketing_opt_in===true)Leads.upsert({ name: r.name, email: r.email, whatsapp: r.whatsapp, source: 'course-registration' });
  // Every registration lands in the Admissions Office inbox (plus the admins)
  // so admissions can generate and send the fee challan from their portal.
  const admins = store.allData().users.filter((u) => u.role === 'admin' && u.email).map((u) => u.email);
  mailer.notify([ADMISSIONS_EMAIL, ...admins], `New course registration - ${r.name}`, `${r.name} registered${r.course_title ? ` for ${r.course_code} ${r.course_title}` : ''}.\nEmail: ${r.email}\nWhatsApp: ${r.whatsapp}${r.city ? `\nCity: ${r.city}` : ''}${r.note ? `\nNote: ${r.note}` : ''}${r.ambassador_code ? `\n\nAMBASSADOR REFERRAL: code ${r.ambassador_code} from ambassador ${r.ambassador_name} was verified automatically - a straight 10% discount applies to this student's challan.` : ''}\n\nGenerate and send the fee challan from the Admissions Office portal.`);
  await deliverRegistrationMail(store, mailer, r, { to: r.email, subject: 'EchoLens - registration received', text: 'Your registration for ' + r.course_title + ' is saved. Keep this private receipt to check your next step: ' + APP_URL + '/registration-status#' + Registrations.receiptToken(r) }, { kind: 'confirmation', reference: String(r.id) });
  res.json({ ok: true, reference: `EL-R-${r.id}`, receipt_url: `/registration-status#${Registrations.receiptToken(r)}`, message: 'Registration saved. Keep your private receipt link to check the next step.' });
}));
app.get('/api/admin/registrations', authRequired, staffView, (req, res) => res.json({ registrations: Registrations.all(), pending: Registrations.pendingCount() }));
app.get('/registration-status', (req, res) => res.sendFile(path.join(__dirname, 'public', 'registration-status.html')));
app.post('/api/public/registration-status', limitLead, (req, res) => {
  const r = Registrations.byReceipt(req.body?.token);
  if (!r) return res.status(404).json({ error: 'Receipt link not found. Recover your link by email or contact Admissions.' });
  const c = r.challan_serial && Challans.bySerial(r.challan_serial);
  res.setHeader('Cache-Control', 'private, no-store');
  res.json({ reference: `EL-R-${r.id}`, offering: r.course_title, stage: r.payment_stage, delivery: r.status.delivery || null, confirmation_delivery: r.status.confirmation_delivery || null, amount: c ? c.net_fee : null, deadline: c ? c.deadline : null, has_challan: !!c, enrolled: r.payment_stage === 'enrolled' });
});
app.post('/api/public/registration-challan', limitLead, asyncRoute(async (req, res) => {
  const r = Registrations.byReceipt(req.body?.token);
  const c = r?.challan_serial && Challans.bySerial(r.challan_serial);
  if (!c) return res.status(404).json({ error: 'No challan is available for this receipt yet.' });
  try { res.setHeader('Cache-Control', 'private, no-store'); res.type('pdf').send(await challanPdf(c, `${APP_URL}/challan?s=${c.serial}`)); }
  catch { res.status(503).json({ error: 'The PDF is temporarily unavailable. Please retry.' }); }
}));
app.post('/api/public/registrations/recover', limitEmailSend, asyncRoute(async (req, res) => {
  if (!isEmail(req.body?.email)) return res.status(400).json({ error: 'Enter your registration email address.' });
  if (!mailer.configured) return res.status(503).json({ error: 'Receipt email recovery is temporarily unavailable. Contact Admissions with your email address or registration reference.' });
  const records = Registrations.all().filter(r => r.email === String(req.body.email).trim().toLowerCase());
  if (records.length) {
    try { const delivery=await mailer.send({ to: records[0].email, subject: 'Your private EchoLens registration receipts', text: records.map(r => `${r.course_title}: ${APP_URL}/registration-status#${Registrations.receiptToken(r)}`).join('\n') }); if(!delivery.sent)throw new Error('Provider rejected receipt recovery'); }
    catch { return res.status(503).json({ error: 'Receipt recovery is temporarily unavailable. Please retry or contact Admissions.' }); }
  }
  res.json({ ok: true, message: 'If registrations match that email, their private receipt links have been handed to the email provider. Check your inbox and spam folder.' });
}));
app.patch('/api/admin/registrations/:id', authRequired, adminRequired, (req, res) => {
  const r = Registrations.update(req.params.id, req.body || {});
  if (!r) return res.status(404).json({ error: 'Registration not found.' });
  res.json({ ok: true, registration: r });
});
app.delete('/api/admin/registrations/:id', authRequired, adminRequired, (req, res) => { Registrations.remove(req.params.id); res.json({ ok: true }); });

/* ============================== public feedback wall ==============================
 * Anyone on the open site (signed in or not) can leave feedback - it lands
 * as 'pending' and only shows up on GET /api/public/feedback (the public,
 * shareable wall) once an admin approves it. Keeps the open site (no login
 * wall) safe from raw unmoderated text while still letting new visitors and
 * LinkedIn shares see real, vetted feedback.
 */
app.post('/api/public/feedback', limitFeedback, (req, res) => {
  const b = req.body || {};
  if (b.company) return res.json({ ok: true }); // honeypot field: bots fill it, humans never see it
  const message = String(b.message || '').trim();
  if (message.length < 5) return res.status(400).json({ error: 'Write a little more before submitting.' });
  if (message.length > 1000) return res.status(400).json({ error: 'Keep feedback under 1000 characters.' });
  if (b.email && !isEmail(b.email)) return res.status(400).json({ error: 'Enter a valid email address, or leave it blank.' });
  const f = Feedback.create({ name: b.name, email: b.email, message, rating: b.rating, source: 'open-site' });
  res.json({ ok: true, feedback: { id: f.id, status: f.status } });
});
// Public, unauthenticated: the approved feedback wall itself - anyone
// visiting the open site (or a link shared on LinkedIn) can see it.
app.get('/api/public/feedback', (req, res) => {
  res.json({ feedback: Feedback.approved().slice(0, 100).map((f) => ({ id: f.id, name: f.name, message: f.message, rating: f.rating, created_at: f.created_at, reply: f.reply, replied_at: f.replied_at })) });
});
app.get('/api/admin/feedback', authRequired, adminRequired, (req, res) => res.json({ feedback: Feedback.all() }));
app.post('/api/admin/feedback/:id/approve', authRequired, adminRequired, (req, res) => {
  const f = Feedback.setStatus(req.params.id, 'approved', req.user.name);
  if (!f) return res.status(404).json({ error: 'Feedback not found.' });
  res.json({ ok: true, feedback: f });
});
app.post('/api/admin/feedback/:id/reject', authRequired, adminRequired, (req, res) => {
  const f = Feedback.setStatus(req.params.id, 'rejected', req.user.name);
  if (!f) return res.status(404).json({ error: 'Feedback not found.' });
  res.json({ ok: true, feedback: f });
});
// Admin reply: shown next to the feedback in the moderation queue always,
// and on the public wall once the feedback itself is approved. Emailed to
// the submitter too, if they left an address.
app.post('/api/admin/feedback/:id/reply', authRequired, adminRequired, (req, res) => {
  const text = String((req.body || {}).reply || '').trim();
  if (text.length > 1000) return res.status(400).json({ error: 'Keep the reply under 1000 characters.' });
  const f = Feedback.reply(req.params.id, text, req.user.name);
  if (!f) return res.status(404).json({ error: 'Feedback not found.' });
  if (f.reply && f.email) {
    mailer.notify(f.email, 'EchoLens replied to your feedback',
      `${hi(f.name)},\n\nThanks again for your feedback:\n"${f.message}"\n\nOur reply:\n${f.reply}\n\nEchoLens Digital`);
  }
  res.json({ ok: true, feedback: f });
});
app.delete('/api/admin/feedback/:id', authRequired, adminRequired, (req, res) => {
  if (!Feedback.remove(req.params.id)) return res.status(404).json({ error: 'Feedback not found.' });
  res.json({ ok: true });
});

app.post('/api/me/learner-profile', authRequired, (req, res) => {
  if (!['student', 'free'].includes(req.user.role)) return res.status(403).json({ error: 'Learner profile details are for student accounts.' });
  const parsed = learnerProfileInput(req.body || {});
  if (parsed.error) return res.status(400).json({ error: parsed.error });
  const user = Users.updateProfile(req.user.id, parsed.profile);
  if (user.email) Leads.upsert({ name: user.name, email: user.email, whatsapp: parsed.profile.phone, source: user.role === 'free' ? 'open-profile' : 'portal-profile', user_id: user.id });
  res.json({ ok: true, profile: user.profile, learner_profile_complete: Users.learnerProfileComplete(user) });
});

/* Private support tickets live beside the feedback workflow in the UI, but
 * are never returned by the public feedback wall. Signed-in owners can read
 * their tickets directly; emailed links carry a short-lived signed token so
 * anonymous reporters can safely continue the same conversation in-portal. */
function supportTicketView(ticket) {
  return {
    id: ticket.id, ticket_no: ticket.ticket_no, subject: ticket.subject, message: ticket.message,
    category: ticket.category, context: ticket.context, status: ticket.status, created_at: ticket.created_at,
    expected_by: ticket.expected_by, updated_at: ticket.updated_at || ticket.created_at,
    messages: Array.isArray(ticket.messages) ? ticket.messages.map((m) => ({ id: m.id, author: m.author, name: m.name, message: m.message, created_at: m.created_at })) : [],
    resolution: ticket.resolution, resolved_at: ticket.resolved_at,
  };
}
function supportTicketToken(ticket) {
  return jwt.sign({ purpose: 'support-ticket', ticket_id: ticket.id, email: ticket.email }, JWT_SECRET, { expiresIn: '30d' });
}
function supportTicketLink(ticket) {
  return `${APP_URL}/open#ticket=${ticket.ticket_no}&token=${encodeURIComponent(supportTicketToken(ticket))}`;
}
function supportTicketFromRequest(req) {
  const id = String(req.params.id || '');
  const ticket = /^EL-\d{6}$/.test(id) ? SupportTickets.byId(Number(id.slice(3))) : SupportTickets.byId(id);
  if (!ticket) return null;
  const account = currentUser(req);
  if (account && (ticket.user_id === account.id || ticket.email === String(account.email || '').toLowerCase())) return ticket;
  try {
    const payload = jwt.verify(String(req.query.token || (req.body || {}).token || ''), JWT_SECRET);
    if (payload.purpose === 'support-ticket' && payload.ticket_id === ticket.id && payload.email === ticket.email) return ticket;
  } catch {}
  return null;
}
function supportAdminEmails() {
  return [...new Set([ADMISSIONS_EMAIL, ...store.allData().users.filter((u) => u.role === 'admin' && u.email).map((u) => u.email)].map((email) => String(email || '').trim().toLowerCase()).filter(Boolean))];
}
app.post('/api/public/support-tickets', limitSupportTicket, asyncRoute(async (req, res) => {
  const b = req.body || {};
  if (b.company) return res.status(201).json({ ok: true }); // honeypot
  const account = currentUser(req);
  const name = String(account?.name || b.name || '').trim();
  const email = String(account?.email || b.email || '').trim().toLowerCase();
  const category = String(b.category || 'other').trim().toLowerCase();
  const subject = String(b.subject || '').trim();
  const message = String(b.message || '').trim();
  const context = String(b.context || '').trim();
  const categories = new Set(['compiler', 'course', 'account', 'payment', 'certificate', 'event', 'other']);
  if (name.length < 2) return res.status(400).json({ error: 'Enter your name.' });
  if (!isEmail(email)) return res.status(400).json({ error: 'Enter a valid email so we can confirm and resolve your ticket.' });
  if (!categories.has(category)) return res.status(400).json({ error: 'Choose a valid issue category.' });
  if (subject.length < 5 || subject.length > 120) return res.status(400).json({ error: 'Summarise the issue in 5 to 120 characters.' });
  if (message.length < 10 || message.length > 2000) return res.status(400).json({ error: 'Describe the issue in 10 to 2000 characters.' });
  if (context.length > 300) return res.status(400).json({ error: 'Keep the page or feature detail under 300 characters.' });
  const ticket = SupportTickets.create({ user_id: account?.id, name, email, category, subject, message, context, source: account ? 'signed-in-user' : 'open-site' });
  const replyUrl = supportTicketLink(ticket);
  const delivery = await mailer.notify(email, `Support ticket ${ticket.ticket_no} received`,
    `${hi(name)},\n\nWe received your support ticket ${ticket.ticket_no}: "${ticket.subject}".\n\nOur team will review it and aims to resolve your problem within 24 to 48 hours. You can read updates and reply securely inside the portal:\n\n${replyUrl}\n\nKeep this ticket number for reference.\n\nEchoLens Digital`);
  const emailSent = delivery.sent.includes(email);
  SupportTickets.markAcknowledged(ticket.id, emailSent);
  res.status(201).json({
    ok: true,
    ticket: { ticket_no: ticket.ticket_no, status: ticket.status, created_at: ticket.created_at, expected_by: ticket.expected_by, reply_url: replyUrl },
    email_sent: emailSent,
    message: `Ticket ${ticket.ticket_no} was submitted. Our team aims to resolve it within 24 to 48 hours.`,
  });
}));

app.get('/api/support-tickets', authRequired, (req, res) => {
  res.json({ tickets: SupportTickets.forUser(req.user).map(supportTicketView) });
});
app.get('/api/public/support-tickets/:id', (req, res) => {
  const ticket = supportTicketFromRequest(req);
  if (!ticket) return res.status(404).json({ error: 'Ticket not found or the secure reply link has expired.' });
  res.json({ ticket: supportTicketView(ticket) });
});
app.post('/api/public/support-tickets/:id/replies', limitSupportReply, asyncRoute(async (req, res) => {
  const ticket = supportTicketFromRequest(req);
  if (!ticket) return res.status(404).json({ error: 'Ticket not found or the secure reply link has expired.' });
  if (ticket.status === 'resolved') return res.status(409).json({ error: 'This ticket is resolved. Submit a new ticket if you still need help.' });
  const message = String((req.body || {}).message || '').trim();
  if (message.length < 5 || message.length > 2000) return res.status(400).json({ error: 'Write a reply between 5 and 2000 characters.' });
  const account = currentUser(req);
  const updated = SupportTickets.addUserMessage(ticket.id, message, account || { name: ticket.name });
  await store.pendingPersist();
  mailer.notify(supportAdminEmails(), `Reply received on support ticket ${ticket.ticket_no}`,
    `${ticket.name} replied to ${ticket.ticket_no}, "${ticket.subject}":\n\n${message}\n\nOpen the admin ticket queue: ${APP_URL}/dashboard#view=admin-feedback`);
  res.status(201).json({ ok: true, ticket: supportTicketView(updated) });
}));

app.get('/api/admin/support-tickets', authRequired, adminRequired, (req, res) => {
  res.json({ tickets: SupportTickets.open() });
});

app.post('/api/admin/support-tickets/:id/request-info', authRequired, adminRequired, asyncRoute(async (req, res) => {
  const message = String((req.body || {}).message || '').trim();
  if (message.length < 5 || message.length > 2000) return res.status(400).json({ error: 'Write a message between 5 and 2000 characters.' });
  const ticket = SupportTickets.byId(req.params.id);
  if (!ticket || ticket.status === 'resolved') return res.status(404).json({ error: 'Open support ticket not found.' });
  const replyUrl = supportTicketLink(ticket);
  const delivery = await mailer.notify(ticket.email, `More information needed for support ticket ${ticket.ticket_no}`,
    `${hi(ticket.name)},\n\nEchoLens Support needs more information about ${ticket.ticket_no}, "${ticket.subject}":\n\n${message}\n\nReply securely inside the portal:\n\n${replyUrl}\n\nEchoLens Digital`);
  const emailSent = delivery.sent.includes(ticket.email);
  if (mailer.configured && !emailSent) return res.status(503).json({ error: 'The message email could not be delivered. Nothing was added to the ticket, so you can retry.' });
  const updated = SupportTickets.addAdminMessage(ticket.id, message, req.user.name, emailSent);
  await store.pendingPersist();
  res.json({ ok: true, ticket: supportTicketView(updated), email_sent: emailSent });
}));

app.post('/api/admin/support-tickets/:id/resolve', authRequired, adminRequired, asyncRoute(async (req, res) => {
  const resolution = String((req.body || {}).resolution || '').trim();
  if (resolution.length < 5 || resolution.length > 2000) return res.status(400).json({ error: 'Write a resolution message between 5 and 2000 characters.' });
  const ticket = SupportTickets.byId(req.params.id);
  if (!ticket || ticket.status !== 'open') return res.status(404).json({ error: 'Open support ticket not found.' });
  const delivery = await mailer.notify(ticket.email, `Support ticket ${ticket.ticket_no} resolved`,
    `${hi(ticket.name)},\n\nYour support ticket ${ticket.ticket_no}, "${ticket.subject}", has been resolved.\n\nResolution:\n${resolution}\n\nIf the issue continues, submit a new ticket and include this ticket number.\n\nEchoLens Digital`);
  const emailSent = delivery.sent.includes(ticket.email);
  if (mailer.configured && !emailSent) return res.status(503).json({ error: 'The resolution email could not be delivered. The ticket remains open so you can retry.' });
  const resolved = SupportTickets.resolve(ticket.id, resolution, req.user.name, emailSent);
  res.json({ ok: true, ticket: { ticket_no: resolved.ticket_no, status: resolved.status, resolved_at: resolved.resolved_at }, email_sent: emailSent });
}));

/* ============================== v18: ADMISSIONS OFFICE ==============================
 * A registration flows: new -> challan_issued -> challan_sent -> paid_cleared
 * -> enrolled. The Admissions Office (formerly the Student Coordinator) owns
 * the challan: discount categories, bank details, generating and mailing it.
 * Finance owns verification: once they confirm the payment proof the student
 * is enrolled automatically.
 */
app.get('/api/admissions/discount-categories', authRequired, admissionsOnly, (req, res) => res.json({ categories: DiscountCategories.all() }));
app.post('/api/admissions/discount-categories', authRequired, admissionsOnly, (req, res) => {
  const { name, type, value } = req.body || {};
  if (!name || !String(name).trim()) return res.status(400).json({ error: 'Give the discount a name.' });
  res.json({ ok: true, category: DiscountCategories.create({ name, type, value }, req.user.id) });
});
app.patch('/api/admissions/discount-categories/:id', authRequired, admissionsOnly, (req, res) => {
  const c = DiscountCategories.update(req.params.id, req.body || {});
  if (!c) return res.status(404).json({ error: 'Discount category not found.' });
  res.json({ ok: true, category: c });
});
app.delete('/api/admissions/discount-categories/:id', authRequired, admissionsOnly, (req, res) => { DiscountCategories.remove(req.params.id); res.json({ ok: true }); });

app.get('/api/admissions/bank-details', authRequired, admissionsOnly, (req, res) => res.json({ bank: Settings.bank() }));
app.post('/api/admissions/bank-details', authRequired, admissionsOnly, (req, res) => res.json({ ok: true, bank: Settings.setBank(req.body || {}) }));

app.post('/api/admissions/registrations/:id/challan', authRequired, admissionsOnly, asyncRoute(async (req, res) => {
  const { discount_category_id, deadline, auto_reminders = true } = req.body || {};
  if (!validChallanDate(deadline)) return res.status(400).json({ error: 'Set a valid deadline date for this challan.' });
  if (typeof auto_reminders !== 'boolean') return res.status(400).json({ error: 'Automatic reminders must be on or off.' });
  const out = Challans.generate({ registration_id: req.params.id, discount_category_id: discount_category_id || null, deadline, generated_by: req.user.id });
  if (out.error) return res.status(400).json({ error: out.error });
  if (!out.existing) await admissionsReminders.configure(out.challan.serial, auto_reminders, req.user.id);
  await store.pendingPersist();
  res.json({ ok: true, challan: out.challan, reminders: admissionsReminders.view(out.challan.serial) });
}));
app.get('/api/admissions/challans/:serial/reminders', authRequired, admissionsOnly, (req, res) => {
  const reminders = admissionsReminders.view(req.params.serial);
  if (!reminders) return res.status(404).json({ error: 'Challan not found.' });
  res.json({ reminders });
});
app.patch('/api/admissions/challans/:serial/reminders', authRequired, admissionsOnly, asyncRoute(async (req, res) => {
  if (typeof req.body?.enabled !== 'boolean') return res.status(400).json({ error: 'Choose whether automatic reminders are enabled.' });
  const c = Challans.bySerial(req.params.serial);
  if (!c) return res.status(404).json({ error: 'Challan not found.' });
  const r = Registrations.byId(c.registration_id);
  if (req.body.enabled && (c.status === 'paid' || ['paid_cleared', 'enrolled'].includes(r?.payment_stage))) return res.status(400).json({ error: 'Payment is verified; reminders have stopped.' });
  res.json({ ok: true, reminders: await admissionsReminders.configure(c.serial, req.body.enabled, req.user.id) });
}));
app.post('/api/admissions/challans/:serial/send', authRequired, admissionsOnly, asyncRoute(async (req, res) => {
  const c = Challans.bySerial(req.params.serial);
  if (!c) return res.status(404).json({ error: 'Challan not found.' });
  // The challan itself travels as a PDF attachment; the email body carries a
  // short summary plus the payment-proof instructions.
  let attachments;
  try {
    const pdf = await challanPdf(c, `${APP_URL}/challan?s=${c.serial}`);
    attachments = [{ filename: `EchoLens-Challan-${c.serial}.pdf`, content: pdf, contentType: 'application/pdf' }];
  } catch (e) {
    console.error('Challan PDF generation failed:', e.message);
    return res.status(500).json({ error: 'Could not generate the challan PDF - try again.' });
  }
  const registration = Registrations.byId(c.registration_id);
  const delivery = await deliverRegistrationMail(store, mailer, registration, {
    to: c.student_email, subject: 'EchoLens - fee challan for ' + c.course_title,
    text: 'Your fee challan is attached. Amount payable: PKR ' + c.net_fee + '. Deadline: ' + c.deadline + '. After paying, send the transaction record to ' + FINANCE_EMAIL + '. Keep your private registration receipt for status updates.', attachments,
  }, { kind: 'challan', reference: c.serial, resend: req.body?.resend === true });
  if (delivery.state !== 'provider_accepted') return res.status(503).json({ error: delivery.message, delivery });
  if (['new','challan_issued','challan_sent'].includes(registration.payment_stage)) Challans.markSent(c.serial);
  res.json({ ok: true, delivery, message: 'Accepted by the email provider. Inbox delivery is not confirmed.' });
}));
// Lets the Admissions Office download the exact PDF the student receives.
app.get('/api/admissions/challans/:serial/pdf', authRequired, admissionsOnly, async (req, res) => {
  const c = Challans.bySerial(req.params.serial);
  if (!c) return res.status(404).json({ error: 'Challan not found.' });
  try {
    const pdf = await challanPdf(c, `${APP_URL}/challan?s=${c.serial}`);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="EchoLens-Challan-${c.serial}.pdf"`);
    res.send(pdf);
  } catch (e) {
    console.error('Challan PDF generation failed:', e.message);
    res.status(500).json({ error: 'Could not generate the challan PDF - try again.' });
  }
});

/* ============================== v18: FINANCE PORTAL ==============================
 * Finance sees every registration whose challan was generated and mailed,
 * verifies the payment proof sent to the finance inbox, and confirms it -
 * which marks the challan paid and auto-enrolls the student.
 */
app.get('/api/finance/registrations', authRequired, financeOnly, (req, res) => {
  const rows = Registrations.all().map((r) => ({ ...r, challans: Challans.forRegistration(r.id) }));
  res.json({ registrations: rows, finance_email: FINANCE_EMAIL });
});
app.post('/api/finance/registrations/:id/clear', authRequired, financeOnly, (req, res) => {
  const r = Registrations.byId(req.params.id);
  if (!r || !r.challan_serial) return res.status(400).json({ error: 'The Admissions Office has not generated a challan for this registration yet.' });
  if(Challans.bySerial(r.challan_serial)?.status==='paid')return res.json({ok:true,existing:true,registration:r});
  const c = Challans.markPaid(r.challan_serial, req.user.id);
  if (!c) return res.status(404).json({ error: 'Challan not found.' });
  // Payment confirmed. Enrollment stays a human step: several batches of the
  // same course can run at once, so the student moves to the Admissions
  // Office's "Ready to enroll" folder where a coordinator picks the batch.
  mailer.notify(ADMISSIONS_EMAIL, `Payment confirmed - enroll ${r.name}`,
    `Finance verified the payment for ${r.name} (${r.email}) against challan ${c.serial} for ${r.course_title || r.course_code}. Enroll them into their batch from the Admissions Office portal ("Ready to enroll" folder).`);
  mailer.notify(r.email, 'EchoLens - payment confirmed',
    `${hi(r.name)},\n\nYour payment for ${r.course_title || r.course_code} has been verified by our finance team. Our admissions team is now placing you in your batch - your account details and course access will arrive in a separate email shortly.`);
  res.json({ ok: true, registration: Registrations.byId(r.id) });
});

app.get('/api/finance/expenses', authRequired, financeOnly, (req, res) => res.json({ expenses: Expenses.all() }));
app.post('/api/finance/expenses', authRequired, financeOnly, (req, res) => {
  const { date, category, description, amount } = req.body || {};
  if (!amount || Number(amount) <= 0) return res.status(400).json({ error: 'Enter a valid amount.' });
  res.json({ ok: true, expense: Expenses.create({ date, category, description, amount }, req.user.id) });
});
app.delete('/api/finance/expenses/:id', authRequired, financeOnly, (req, res) => { Expenses.remove(req.params.id); res.json({ ok: true }); });
app.get('/api/finance/balance-sheet', authRequired, financeOnly, (req, res) => res.json(Expenses.balanceSheet()));

/* -------- Admissions Office portal: registrations, challans, enrollment fallback -------- */
// Enrolls the registered student into a batch: creates (or upgrades) the
// account, records the enrollment, emails the student, and advances the
// pipeline to "enrolled". Shared by Finance's payment confirmation
// (auto-enroll) and the Admissions Office's manual fallback.
const enrollmentWork=new Map();
async function enrollRegistrationIntoBatch(r,b){if(enrollmentWork.has(r.id))return enrollmentWork.get(r.id);const job=performRegistrationEnrollment(r,b);enrollmentWork.set(r.id,job);try{return await job;}finally{enrollmentWork.delete(r.id);}}
async function performRegistrationEnrollment(r, b) {
  if(r.payment_stage==='enrolled')return r.enrolled_batch_id===b.id?{registration:r,existing:true}:{error:'Already enrolled in another batch. Use the explicit batch-transfer workflow.'};
  // One email can hold accounts in several portals: enroll into the LEARNER
  // account when one exists; staff accounts on the same email are ignored
  // and a separate student account is created alongside them.
  let u = Users.allByLogin(r.email).find((x) => ['student', 'free'].includes(x.role)) || null;
  let password = null, freshAccount = false;
  if (u) {
    if (u.role === 'free') {
      u.role = 'student'; // now a paying student, not a free-tier account
      Users.deriveUsername(u.id); // @open.echolens -> @student.echolens
    }
  } else {
    if (!(await emailDomainExists(r.email))) return { error: 'That email domain does not receive mail - check with the student before enrolling.' };
    const created = Users.create({ name: r.name, role: 'student', email: r.email });
    u = created.user; password = created.password; freshAccount = true;
  }
  Enrollments.create(u.id, b.id);
  const bd = Batches.decorate(b);
  // Ambassador referral payout: only now, at real paid enrollment (not the
  // earlier interest-registration step), weighted by how hard this course
  // category is to sell (Settings.ambassadorGemRates).
  if (r.ambassador_code) {
    const amb = Ambassadors.byCode(r.ambassador_code);
    const rate = Settings.ambassadorGemRates()[bd.tier];
    if (amb && rate) {
      Ambassadors.addGems(amb.id, rate, { source: 'enrollment', course_tier: bd.tier, registration_id: r.id, batch_id: b.id, note: `${u.name} enrolled in ${bd.title || bd.name}` });
      mailer.notify(amb.email, `+${rate} gems - your referral just enrolled`,
        `${hi(amb.name)},\n\nGreat news - ${u.name} just enrolled in ${bd.title || bd.name} using your referral code (${amb.code}). You've earned ${rate} gems.\n\nSign in at ${APP_URL}/login to see your updated total and leaderboard rank.\n\nEchoLens Digital`);
    }
  }
  if (freshAccount) {
    mailer.notify(r.email, 'Welcome to EchoLens - payment confirmed, your account is ready',
      `${hi(u.name)},\n\nYour payment has been verified and you are now enrolled in ${bd.title || bd.name}.\n\nRegistration number: ${u.reg_no}\nUsername: ${u.username}\nEmail: ${u.email}\nPassword: ${password}\n\nSign in at ${APP_URL} with your username or email and change your password from Profile after your first login.`);
  } else {
    mailer.notify(r.email, `Payment confirmed - you're enrolled in ${bd.title || bd.name}`,
      `${hi(u.name)},\n\nYour payment has been verified and you have been enrolled in ${bd.title || bd.name}. Your student username is ${u.username} - sign in at ${APP_URL} with it (or your email) to get started.`);
  }
  const updated = Registrations._setStage(r.id, 'enrolled', { enrolled_user_id: u.id, enrolled_batch_id: b.id });
  return { registration: updated, credentials: freshAccount ? { username: u.username, password } : null };
}
// Manual registration: some students register through channels outside the
// website (e.g. a Google Form), which never reach Registrations.create() on
// their own - Admissions enters those here so the rest of the pipeline
// (challan, Finance verification, enrollment) works exactly the same as a
// website registration. Same validation as the public route, minus the
// honeypot/rate-limit (this is an authenticated staff action).
app.post('/api/admissions/registrations', authRequired, admissionsOnly, asyncRoute(async (req, res) => {
  const b = { ...req.body };
  const resolved = store.resolveOffering(b.course_code);
  if (resolved.error) return res.status(400).json({ error: resolved.error });
  b.course_code = resolved.offer.code; b.course_title = resolved.offer.title;
  if (!b.name || String(b.name).trim().length < 2) return res.status(400).json({ error: "Enter the student's full name." });
  if (!isEmail(b.email)) return res.status(400).json({ error: 'Enter a valid email address.' });
  if (!(await emailDomainExists(b.email))) return res.status(400).json({ error: 'That email domain does not receive mail - check the spelling.' });
  if (!b.whatsapp || String(b.whatsapp).replace(/\D/g, '').length < 10) return res.status(400).json({ error: "Enter the student's WhatsApp number (e.g. 03XX-XXXXXXX)." });
  if (!b.course_code || !b.course_title) return res.status(400).json({ error: 'Select the course the student registered for.' });
  const previous = Registrations.find(b.email, b.course_code);
  if (previous) return res.json({ ok: true, existing: true, registration: previous });
  const rawCode = String(b.ambassador_code || '').trim();
  if (rawCode) {
    if (!/^\d{4}$/.test(rawCode)) return res.status(400).json({ error: 'Ambassador codes are 4 digits - check the code or leave the field empty.' });
    const amb = Ambassadors.byCode(rawCode);
    if (!amb) return res.status(400).json({ error: 'That ambassador code is not recognised - check it with the ambassador or leave the field empty.' });
    b.ambassador_code = amb.code;
    b.ambassador_name = amb.name;
    let cat = DiscountCategories.all().find((c) => c.active && c.type === 'percent' && c.value === 10 && /ambassador/i.test(c.name));
    if (!cat) cat = DiscountCategories.create({ name: 'Ambassador referral', type: 'percent', value: 10 }, null);
    b.discount_category_id = cat.id;
  } else {
    delete b.ambassador_code;
    // No ambassador code: Admissions may still pick a discount directly (the
    // form only ever offers real, active categories, so no extra lookup is
    // needed here - unlike the ambassador-code path above).
    if (!b.discount_category_id) b.discount_category_id = null;
  }
  b.note = ['Registered manually by Admissions Office (e.g. via an external form).', b.note ? String(b.note).trim() : ''].filter(Boolean).join(' ');
  const r = Registrations.create(b);

  mailer.notify(r.email, 'EchoLens - registration received', `${hi(r.name)},\n\nWe have you down for registration${r.course_title ? ` for ${r.course_title}` : ''}.${r.ambassador_code ? ' Your ambassador code was accepted - a 10% discount will be applied to your fee challan.' : ''} Our Admissions Office will email you the fee challan with the payment details and next steps shortly.\n\nEchoLens Digital`);
  res.json({ ok: true, registration: r });
}));
app.get('/api/admissions/registrations', authRequired, admissionsOnly, (req, res) => {
  const rows = Registrations.all().map((r) => {
    const course = Courses.byCode(r.course_code);
    const available_batches = course ? Batches.all().filter((b) => b.course_id === course.id).map((b) => ({ id: b.id, name: b.name, start_date: b.start_date, status: b.status })) : [];
    return { ...r, course_fee: catalogueFee(r.course_code, course), challans: Challans.forRegistration(r.id), available_batches };
  });
  res.json({ registrations: rows, admissions_email: ADMISSIONS_EMAIL, finance_email: FINANCE_EMAIL });
});
// Manual fallback for cleared payments that could not auto-enroll (e.g. no
// batch was open when Finance confirmed).
app.post('/api/admissions/registrations/:id/enroll', authRequired, admissionsOnly, asyncRoute(async (req, res) => {
  const r = Registrations.byId(req.params.id);
  if (!r) return res.status(404).json({ error: 'Registration not found.' });
  if(r.payment_stage==='enrolled')return res.json({ok:true,existing:true,registration:r});
  if (r.payment_stage !== 'paid_cleared') return res.status(400).json({ error: 'This registration is not yet cleared by Finance.' });
  const b = Batches.byId((req.body || {}).batch_id);
  const course = Courses.byCode(r.course_code);
  if (!b || !course || b.course_id !== course.id || ['completed','archived','cancelled'].includes(b.status)) return res.status(400).json({ error: 'Choose a valid batch for this course.' });
  const out = await enrollRegistrationIntoBatch(r, b);
  if (out.error) return res.status(400).json({ error: out.error });
  res.json({ ok: true, ...out });
}));
app.get('/api/coordinator/queries', authRequired, studentCoordinatorOnly, (req, res) => res.json({ queries: CoordinatorQueries.all() }));
app.post('/api/coordinator/queries/:id/reply', authRequired, studentCoordinatorOnly, (req, res) => {
  const { body } = req.body || {};
  if (!body || !String(body).trim()) return res.status(400).json({ error: 'Write a reply first.' });
  const q = CoordinatorQueries.reply(req.params.id, { from_role: 'coordinator', from_name: req.user.name, body });
  if (!q) return res.status(404).json({ error: 'Query not found.' });
  res.json({ ok: true, query: q });
});
app.patch('/api/coordinator/queries/:id', authRequired, studentCoordinatorOnly, (req, res) => {
  const q = CoordinatorQueries.setStatus(req.params.id, (req.body || {}).status);
  if (!q) return res.status(404).json({ error: 'Query not found.' });
  res.json({ ok: true, query: q });
});

/* ------------------------- student-side: contact my coordinator ------------------------- */
app.get('/api/my/queries', authRequired, (req, res) => {
  if (req.user.role !== 'student') return res.json({ queries: [] });
  res.json({ queries: CoordinatorQueries.forStudent(req.user.id) });
});
app.post('/api/my/queries', authRequired, (req, res) => {
  if (req.user.role !== 'student') return res.status(403).json({ error: 'Queries are for enrolled students.' });
  const { subject, body } = req.body || {};
  if (!body || !String(body).trim()) return res.status(400).json({ error: 'Write your question or issue first.' });
  const q = CoordinatorQueries.create({ student_id: req.user.id, student_name: req.user.name, subject, body });
  res.json({ ok: true, query: q });
});
app.post('/api/my/queries/:id/reply', authRequired, (req, res) => {
  if (req.user.role !== 'student') return res.status(403).json({ error: 'Queries are for enrolled students.' });
  const q = CoordinatorQueries.byId(req.params.id);
  if (!q || q.student_id !== req.user.id) return res.status(404).json({ error: 'Query not found.' });
  const { body } = req.body || {};
  if (!body || !String(body).trim()) return res.status(400).json({ error: 'Write a message first.' });
  res.json({ ok: true, query: CoordinatorQueries.reply(req.params.id, { from_role: 'student', from_name: req.user.name, body }) });
});

/* ============================== v17: HR PORTAL ==============================
 * HR creates 'staff' accounts directly (unlike the other department roles,
 * which admin creates) - this is HR's own onboarding function.
 */
app.get('/api/hr/groups', authRequired, hrOnly, (req, res) => res.json({ groups: StaffGroups.all() }));
app.post('/api/hr/groups', authRequired, hrOnly, (req, res) => {
  const { name } = req.body || {};
  if (!name || !String(name).trim()) return res.status(400).json({ error: 'Give the group a name.' });
  res.json({ ok: true, group: StaffGroups.create(req.body || {}) });
});
app.patch('/api/hr/groups/:id', authRequired, hrOnly, (req, res) => {
  const g = StaffGroups.update(req.params.id, req.body || {});
  if (!g) return res.status(404).json({ error: 'Group not found.' });
  res.json({ ok: true, group: g });
});
app.delete('/api/hr/groups/:id', authRequired, hrOnly, (req, res) => { StaffGroups.remove(req.params.id); res.json({ ok: true }); });

app.get('/api/hr/staff', authRequired, hrOnly, (req, res) => res.json({ staff: StaffRecords.all() }));
app.post('/api/hr/staff', authRequired, hrOnly, async (req, res) => {
  const { name, email, phone, position, employment_type, group_id } = req.body || {};
  if (!name || !String(name).trim()) return res.status(400).json({ error: 'A name is required.' });
  if (!isEmail(email)) return res.status(400).json({ error: 'Enter a valid email address - credentials are emailed there.' });
  if (Users.allByLogin(email).some((u) => u.role === 'staff')) return res.status(400).json({ error: 'This email already has a staff account. The same email can be added to other portals, but only once per portal.' });
  if (!(await emailDomainExists(email))) return res.status(400).json({ error: 'That email domain does not receive mail - check the spelling.' });
  const em = String(email).trim().toLowerCase();
  const { user, password } = Users.create({ name: String(name).trim(), role: 'staff', email: em, username: em });
  const record = StaffRecords.create({ user_id: user.id, name: user.name, email: em, phone, position, employment_type, group_id });
  const dept = Departments.byName(record.employment_type === 'intern' ? 'Interns' : 'Staff');
  if (dept) DepartmentMembers.add(dept.id, user.id, req.user.id);
  mailer.notify(em, 'Welcome to EchoLens - your staff account',
    `${hi(user.name)},\n\nYour EchoLens staff account is ready.\n\nUsername: ${user.username}\nEmail: ${user.email}\nPassword: ${password}\n\nSign in at ${APP_URL} with your username or email to see your team, instructions, and follow-ups.`);
  res.json({ ok: true, staff: record, credentials: { name: user.name, username: user.username, password } });
});
app.patch('/api/hr/staff/:id', authRequired, hrOnly, (req, res) => {
  const s = StaffRecords.update(req.params.id, req.body || {});
  if (!s) return res.status(404).json({ error: 'Staff record not found.' });
  res.json({ ok: true, staff: s });
});
app.delete('/api/hr/staff/:id', authRequired, hrOnly, (req, res) => {
  const s = StaffRecords.byId(req.params.id);
  // Same department_members FK cleanup as DELETE /api/hr/ambassadors/:id
  // above - every staff/intern is auto-added to a department on creation.
  if (s) { DepartmentMembers.removeAllForUser(s.user_id); Users.remove(s.user_id); }
  StaffRecords.remove(req.params.id);
  res.json({ ok: true });
});
app.post('/api/hr/staff/:id/instructions', authRequired, hrOnly, (req, res) => {
  const { body } = req.body || {};
  if (!body || !String(body).trim()) return res.status(400).json({ error: 'Write the instruction first.' });
  const s = StaffRecords.addInstruction(req.params.id, { body, by: req.user.name });
  if (!s) return res.status(404).json({ error: 'Staff record not found.' });
  res.json({ ok: true, staff: s });
});
app.post('/api/hr/staff/:id/follow-ups', authRequired, hrOnly, (req, res) => {
  const { body } = req.body || {};
  if (!body || !String(body).trim()) return res.status(400).json({ error: 'Write the follow-up first.' });
  const s = StaffRecords.addFollowUp(req.params.id, { body, by: req.user.name });
  if (!s) return res.status(404).json({ error: 'Staff record not found.' });
  res.json({ ok: true, staff: s });
});

/* ============================== v17: STAFF PORTAL ============================== */
app.get('/api/staff/me', authRequired, staffOnly, (req, res) => {
  const s = StaffRecords.byUserId(req.user.id);
  if (!s) return res.status(404).json({ error: 'No staff record found for this account yet - ask HR.' });
  res.json({ staff: s, group: s.group_id ? StaffGroups.byId(s.group_id) : null });
});
app.post('/api/staff/follow-ups/:idx/respond', authRequired, staffOnly, (req, res) => {
  const s = StaffRecords.byUserId(req.user.id);
  if (!s) return res.status(404).json({ error: 'No staff record found for this account.' });
  const { response } = req.body || {};
  if (!response || !String(response).trim()) return res.status(400).json({ error: 'Write your response first.' });
  const updated = StaffRecords.respondFollowUp(s.id, req.params.idx, response);
  res.json({ ok: true, staff: updated });
});

/* -------------- open quest submissions + certificates (items 3, 10) --------------
 * Submit code or a file (PDF, Word, PNG, JPEG) per problem. AI grades it on
 * the spot with the 10% reduction; gems accrue per problem; completing a
 * fully free course above its pass mark issues the certificate automatically.
 */
// Per-course workspaces decide what a submission looks like:
//   doc      -> one PDF/Word report            prompt   -> the Prompt Lab workbook (text)
//   code-ai  -> compiler code                  excel-ai -> the Excel workbook (or copilot session)
//   multi    -> several PDF/image files        file/code -> the classic defaults
const OPEN_SUBMIT_RULES = {
  doc: { pattern: /\.(pdf|docx?)$/i, error: 'This course takes Word or PDF submissions only - export your report and resubmit.' },
  'excel-ai': { pattern: /\.(xlsx|csv)$/i, error: 'Upload your workbook as .xlsx or .csv (save modern Excel format, not the old .xls).' },
  multi: { pattern: /\.(pdf|png|jpe?g)$/i, error: 'This course takes PDF or image (PNG/JPEG) submissions.', multiple: true },
  file: { pattern: /\.(pdf|docx?|pptx?|txt|md|ipynb|png|jpe?g|zip)$/i, error: 'Upload PDF, Word, text, notebook, PNG, JPEG, or ZIP files.' },
  evidence: { pattern: /\.(pdf|docx?|pptx?|txt|md|ipynb|png|jpe?g|zip|mp4|webm|mov|csv|json|ya?ml|toml|sql|py|go|js|ts|tsx|proto|tf)$/i, error: 'Upload a supported document, source, archive, image, or recording file.', multiple: true },
};
async function submitOpenAssessment(req, res, assessmentKind) {
  const allFiles = [...((req.files || {}).file || []), ...((req.files || {}).files || [])];
  const cleanup = () => { for (const f of allFiles) { try { fs.unlinkSync(f.path); } catch {} } };
  if (!['free', 'student'].includes(req.user.role)) { cleanup(); return res.status(403).json({ error: 'Quests are for learners.' }); }
  const b = req.body || {};
  const track = Quests.trackDef(String(b.track_key || ''));
  if (!track || track.published === false) { cleanup(); return res.status(404).json({ error: 'Course not found.' }); }
  const kind = assessmentKind === 'capstone' ? 'capstone' : 'assignment';
  const level = kind === 'capstone' ? 0 : Number(b.level);
  const pid = kind === 'capstone' ? 0 : Number(b.pid);
  const problem = kind === 'capstone' ? track.capstone : track.levels.find((item) => item.no === level)?.problems.find((item) => item.pid === pid);
  if (!problem) { cleanup(); return res.status(400).json({ error: kind === 'capstone' ? 'This course does not have a capstone.' : 'Task not found.' }); }
  const mode = problem.submission?.mode || track.submission || (Quests.tracks().find((item) => item.key === track.key) || {}).submission_mode || 'code';
  const rule = OPEN_SUBMIT_RULES[mode] || OPEN_SUBMIT_RULES.file;
  const submissionRule = problem.submission || {};
  const maxFiles = Math.min(8, Number(submissionRule.files?.max ?? (rule.multiple ? 8 : 1)));
  if (allFiles.length > maxFiles || (allFiles.length > 1 && !rule.multiple)) { cleanup(); return res.status(400).json({ error: `This assessment takes at most ${maxFiles} evidence file${maxFiles === 1 ? '' : 's'}.` }); }
  for (const f of allFiles) {
    if (!rule.pattern.test(f.originalname)) { cleanup(); return res.status(400).json({ error: rule.error }); }
  }
  const evidenceCheck = validateEvidenceInput({ rawLinks:b.links, notes:b.notes, files:allFiles, rule:submissionRule, hasCode:!!String(b.code || '').trim() });
  if (evidenceCheck.error) { cleanup(); return res.status(400).json({ error:evidenceCheck.error }); }
  const { links, notes } = evidenceCheck;
  let file_url = null, file_name = null, extra_files = [];
  if (allFiles.length) {
    file_url = `/uploads/${allFiles[0].filename}`;
    file_name = allFiles[0].originalname;
    extra_files = allFiles.slice(1).map((f) => ({ url: `/uploads/${f.filename}`, name: f.originalname }));
  }
  const evidenceFiles = allFiles.map((f) => ({ url: `/uploads/${f.filename}`, name: f.originalname, size: f.size }));
  const evidence = mode === 'evidence' || kind === 'capstone' ? { links, notes: notes || null, files: evidenceFiles } : null;
  const request_key = b.request_key || crypto.randomUUID();
  if (!/^[\w-]{16,80}$/.test(request_key)) { cleanup(); return res.status(400).json({error:'Invalid submission request key.'}); }
  const fingerprint = crypto.createHash('sha256').update(JSON.stringify([track.key,String(level),String(pid),kind,b.code||null,b.language||null,links,notes,...allFiles.map(f=>[f.originalname,crypto.createHash('sha256').update(fs.readFileSync(f.path)).digest('hex')])])).digest('hex');
  const previous = store.allData().open_attempts.find(a=>a.user_id===req.user.id&&a.request_key===request_key);
  if (previous && previous.payload.fingerprint !== fingerprint) { cleanup(); return res.status(409).json({error:'This request key belongs to different work.'}); }
  const out = OpenQuest.submit({ user:req.user,track_key:track.key,level,pid,assessment_kind:kind,code:b.code||null,language:b.language||null,output:b.output||null,file_url,file_name,files:extra_files,evidence,request_key,fingerprint });
  if(out.error){cleanup();return res.status(out.status||400).json({error:out.error,unlocks_at:out.unlocks_at||null});}
  if(out.existing)cleanup();
  if(!ai.enabled() && out.attempt.status==='queued')store.OpenAttempts.fail(out.attempt.id,'Grading is unavailable. Your attempt is saved. Retry later or request staff review.');
  await store.pendingPersist();
  const awaitingReview = out.attempt.status === 'awaiting_review';
  return res.status(out.existing?200:202).json({ok:true,existing:!!out.existing,attempt:store.OpenAttempts.public(out.attempt),submission:out.submission,graded:out.attempt.status==='completed',note:awaitingReview?'Evidence saved and sent for staff review.':out.attempt.status==='failed'?out.attempt.payload.error:`Submission received. Your grade arrives within ${pacing.GRADING_WINDOW_HOURS} hours, and the next module opens as soon as this one is fully graded. You do not need to stay on this page.`,grade_due_by:kind==='capstone'?null:pacing.gradeDueBy(out.submission.submitted_at)});
}
app.post('/api/open/submit', authRequired, upload.fields([{ name: 'file', maxCount: 1 }, { name: 'files', maxCount: 7 }]), asyncRoute((req, res) => submitOpenAssessment(req, res, 'assignment')));
app.post('/api/open/capstone/submit', authRequired, upload.fields([{ name: 'file', maxCount: 1 }, { name: 'files', maxCount: 7 }]), asyncRoute((req, res) => submitOpenAssessment(req, res, 'capstone')));
app.get('/api/open/capstone/attempts', authRequired, openLearnerRequired, (req,res)=>res.json({attempts:store.OpenAttempts.list(req.user.id,String(req.query.track||''),0,0).map(store.OpenAttempts.public)}));
/**
 * A free course has been completed: send the learner their certificate, with
 * the PNG attached so it arrives as a file rather than only a link. Certificates
 * for events were already emailed; free-course ones never were, so a learner who
 * finished while away from the page was told nothing at all.
 *
 * maybeCertify() returns {existing:true} for an already-issued certificate, so
 * passing its result straight in makes this send exactly once per course.
 */
async function announceCourseCompletion(uid, track_key, certResult) {
  if (!certResult || certResult.existing || !certResult.cert) return;
  const u = Users.byId(uid);
  if (!u || !u.email) return;
  const cert = certResult.cert;
  const verifyUrl = `${APP_URL}/cert?s=${cert.serial}`;
  let attachments;
  try {
    const png = await certificatePng(Certificates.publicView(cert), verifyUrl);
    attachments = [{ filename: `EchoLens-certificate-${cert.serial}.png`, content: png }];
  } catch (e) {
    // A rendering failure must not cost the learner the email itself.
    console.error('[certificate] could not render the PNG for', cert.serial, '-', e.message);
  }
  const first = String(u.name || '').trim().split(/\s+/)[0] || 'there';
  mailer.notify(
    u.email,
    `Congratulations - you have completed ${cert.title}`,
    `Hi ${first},

You have completed ${cert.title}. Your verified certificate is attached, and it is permanently available here:

${verifyUrl}

Serial: ${cert.serial}

Anyone can verify it from that page - the QR code on the certificate points to it, so it holds up on a CV or a LinkedIn profile.

Well done, and thank you for learning with us.

- EchoLens`,
    attachments,
  );
  console.log(`[certificate] emailed ${cert.serial} (${cert.title}) to user ${uid}.`);
}

const pacing = require('./course-pacing');
/**
 * The learner-facing view of an attempt. Nothing is hidden - a grade shows the
 * moment it is awarded - but an attempt still waiting on the grader carries the
 * deadline it is promised by, so the UI can say "within 8 hours" instead of
 * showing an unexplained blank.
 */
function learnerAttempt(a) {
  const view = store.OpenAttempts.public(a);
  if (a.payload?.score != null) return { ...view, grade_pending: false, grade_due_by: null };
  return { ...view, grade_pending: true, grade_due_by: pacing.gradeDueBy(a.created_at) };
}
function openLearnerRequired(req, res, next) {
  if (['free', 'student'].includes(req.user.role)) return next();
  return res.status(403).json({ error: 'Free-course enrollment and progress are for learner accounts only.' });
}
function learnerProfileRequired(req, res, next) {
  if (Users.learnerProfileComplete(req.user)) return next();
  return res.status(409).json({ error: 'Complete your learner profile before enrolling in a course.' });
}
app.get('/api/open/enrollments', authRequired, openLearnerRequired, (req, res) => {
  const courses = OpenQuest.enrollments(req.user.id);
  const gate = pacing.canEnroll(courses);
  res.json({
    courses,
    waitlist: OpenQuest.waitlist(req.user.id),
    active: gate.active, limit: gate.limit, can_enroll: gate.ok,
  });
});

/* ------------------------- launch waitlist (staged courses) -------------------------
 * A learner reserves a seat on a course whose videos are not published yet.
 * It grants no content and costs none of their two active-course slots; it
 * only buys them the launch email. See OpenQuest.reserve in store.js.
 */
app.post('/api/open/waitlist', authRequired, openLearnerRequired, asyncRoute(async (req, res) => {
  const out = OpenQuest.reserve(req.user.id, String(req.body.track_key || ''));
  if (out.error) return res.status(out.status).json({ error: out.error });
  await store.pendingPersist();
  res.status(out.existing ? 200 : 201).json({ ok: true, ...out, waitlist: OpenQuest.waitlist(req.user.id) });
}));
app.delete('/api/open/waitlist/:track', authRequired, openLearnerRequired, asyncRoute(async (req, res) => {
  const out = OpenQuest.unreserve(req.user.id, String(req.params.track || ''));
  if (out.error) return res.status(out.status).json({ error: out.error });
  await store.pendingPersist();
  res.json({ ok: true, waitlist: OpenQuest.waitlist(req.user.id) });
}));
/**
 * Admin: email everyone holding a seat on a track that it has launched. Goes
 * through the BULK provider, never the transactional mailbox - a waitlist can
 * be hundreds of addresses and that path is capped at TRANSACTIONAL_MAX_PER_RUN
 * for good reason (see mail-provider split in mailer.js). Nobody is emailed
 * twice: markNotified stamps each reservation as it goes out.
 */
app.post('/api/admin/tracks/:key/launch-notice', authRequired, adminRequired, asyncRoute(async (req, res) => {
  const key = String(req.params.key || '');
  const t = Quests.trackDef(key);
  if (!t) return res.status(404).json({ error: 'Track not found.' });
  if (t.published === false) return res.status(409).json({ error: 'Publish the course before telling its waitlist it has launched.' });
  const waiting = OpenQuest.waitlistFor(key).filter((u) => u.email);
  if (!waiting.length) return res.json({ ok: true, notified: 0, note: 'Nobody is waiting on this course.' });
  const subject = `${t.title} is now open on EchoLens`;
  const text = `The course you reserved a seat on has launched.\n\n${t.title}\n${t.description || ''}\n\nSign in and start module 1: ${APP_URL}/open\n\nYou can study two courses at a time, and one module opens per day.\n\n- EchoLens`;
  const result = await mailer.sendBulk(waiting.map((u) => u.email), subject, text, { label: 'course-launch:' + key });
  const sent = new Set((result.sent || []).map((e) => String(e).toLowerCase()));
  for (const u of waiting) if (sent.has(String(u.email).toLowerCase())) OpenQuest.markNotified(u.id, key);
  await store.pendingPersist();
  res.json({ ok: true, requested: waiting.length, notified: sent.size, dry_run: !!result.dryRun, aborted: !!result.aborted, reason: result.abortReason || null });
}));
/* ------------------- admin: manually enroll students in a free course -------------------
 * Same shape as /api/batches/:id/students (add students to a paid batch):
 * new candidates by "Full Name, email" (account created, credentials mailed)
 * or existing accounts by reg no / username / email (just enrolled). Every
 * enrolment - admin-driven or self-service - goes through OpenQuest.enroll,
 * so the two-course cap and the confirmation window apply identically either
 * way; the confirmation-opens-the-course email is the existing sweep, not
 * something this route sends itself.
 */
// The same test OpenQuest.enroll() applies internally: a track can be
// t.free && t.published while its OFFICIAL_CATALOGUE entry is still
// unpublished (or vice versa) - only a course that is enrollable through the
// catalogue is actually enrollable at all, so this route must agree with
// that, not just the raw track flags, or the admin dropdown would offer
// courses OpenQuest.enroll() then refuses every single time.
function freePublishedTrack(key) {
  const t = Quests.trackDef(key);
  if (!t || !t.free) return null;
  const inCatalogue = store.publicCatalogue().some((c) => c.track_key === key && c.price_pkr === 0 && c.available);
  return inCatalogue ? t : null;
}
app.get('/api/admin/open-courses/:key/students', authRequired, adminRequired, (req, res) => {
  const t = freePublishedTrack(req.params.key);
  if (!t) return res.status(404).json({ error: 'Free course not found.' });
  res.json({ ok: true, track: { key: t.key, title: t.title, course_code: t.course_code || null }, students: OpenQuest.studentsFor(t.key) });
});
app.get('/api/admin/open-courses-progress', authRequired, adminRequired, (req, res) => {
  const certificates = store.allData().certificates || [];
  const courses = store.publicCatalogue().filter((c) => c.price_pkr === 0 && c.track_key && c.available);
  const report = courses.map((c) => {
    const students = OpenQuest.studentsFor(c.track_key);
    const enrolled = students.length;
    const completed = students.filter((s) => s.completed).length;
    const lectureTotal = (Quests.trackDef(c.track_key)?.levels || []).length;
    const lecturesCovered = students.reduce((n, s) => n + Number(s.completed_levels || s.levels_completed || 0), 0);
    const certs = certificates.filter((x) => x.track_key === c.track_key || x.title === c.title).length;
    return { code: c.code, title: c.title, enrolled, completed, completion_rate: enrolled ? Math.round(completed / enrolled * 100) : 0, lectures_total: enrolled * lectureTotal, lectures_covered: lecturesCovered, certificates: certs };
  });
  res.json({ courses: report, totals: { enrolled: report.reduce((n, x) => n + x.enrolled, 0), certificates: report.reduce((n, x) => n + x.certificates, 0) } });
});
app.post('/api/admin/open-courses/:key/students', authRequired, adminRequired, asyncRoute(async (req, res) => {
  const t = freePublishedTrack(req.params.key);
  if (!t) return res.status(404).json({ error: 'Free course not found.' });
  const { names, existing } = req.body || {};
  const created = [], added = [], missing = [], invalid = [];
  const mailDown = signupMailDown();
  for (const raw of Array.isArray(names) ? names : []) {
    // Each line: "Full Name, email@domain" - a real email is mandatory so the
    // generated username/password can always be mailed to the candidate.
    const parts = String(raw).split(',').map((x) => x.trim());
    const name = parts[0]; if (!name) continue;
    const email = (parts[1] || '').toLowerCase();
    if (!isEmail(email)) { invalid.push(`${raw} - missing or invalid email`); continue; }
    if (!(await emailDomainExists(email))) { invalid.push(`${raw} - that email domain does not receive mail`); continue; }
    if (Users.allByLogin(email).some((u) => ['student', 'free'].includes(u.role))) { invalid.push(`${raw} - a learner account with this email already exists (add them as an existing student instead)`); continue; }
    const { user, password } = Users.create({ name, role: 'free', email, username: email });
    const enrolled = OpenQuest.adminEnroll(user.id, t.key);
    if (enrolled.error) { invalid.push(`${raw} - account created, but could not enrol: ${enrolled.error}`); continue; }
    const emailed = mailer.configured && !mailDown;
    if (emailed) {
      mailer.notify(email, 'Welcome to EchoLens - your account',
        `${hi(user.name)},\n\nAn EchoLens account has been created for you and you have been enrolled in ${t.title}.\n\nRegistration number: ${user.reg_no}\nUsername: ${user.username}\nEmail: ${user.email}\nPassword: ${password}\n\nSign in at ${APP_URL} with your username or email and change your password from Profile after your first login.\n\n${enrolled.enrollment.confirmation_note || 'The course is open now - start module 1 any time.'}`);
    }
    created.push({ name: user.name, username: user.username, reg_no: user.reg_no, password, email, emailed, mail_paused: mailer.configured && mailDown });
  }
  for (const raw of Array.isArray(existing) ? existing : []) {
    const u = Users.byLogin(String(raw).trim());
    if (!u || !['free', 'student'].includes(u.role)) { missing.push(String(raw).trim()); continue; }
    const enrolled = OpenQuest.adminEnroll(u.id, t.key);
    if (enrolled.error) { invalid.push(`${u.name} (${raw}) - ${enrolled.error}`); continue; }
    added.push({ name: u.name, reg_no: u.reg_no, existing: !!enrolled.existing });
  }
  await store.pendingPersist();
  res.json({ ok: true, track: { key: t.key, title: t.title }, created, added, missing, invalid });
}));

app.post('/api/open/enrollments', authRequired, openLearnerRequired, learnerProfileRequired, asyncRoute(async (req, res) => {
  const out = OpenQuest.enroll(req.user.id, String(req.body.track_key || ''));
  if (out.error) return res.status(out.status).json({ error: out.error });
  await store.pendingPersist();
  // Free-course enrollments are included in the daily admissions digest.
  const adminEmailSent = null;
  res.status(out.existing ? 200 : 201).json({ ok: true, ...out, admin_email_sent: adminEmailSent, progress: { ...OpenQuest.progress(req.user.id, out.enrollment.track_key), enrolled: true } });
}));
app.get('/api/open/attempts', authRequired, openLearnerRequired, (req,res)=>res.json({attempts:store.OpenAttempts.list(req.user.id,String(req.query.track||''),req.query.level,req.query.pid).map(learnerAttempt)}));
app.post('/api/open/attempts/:id/retry',authRequired,openLearnerRequired,asyncRoute(async (req,res)=>{
  if(!ai.enabled())return res.status(503).json({error:'Grading is still unavailable. Your attempt and previous grades are saved. Ask staff for a review.'});
  const out=store.OpenAttempts.retry(req.params.id,req.user.id);
  if(out.error)return res.status(out.status||400).json({error:out.error});
  await store.pendingPersist();res.json({ok:true,attempt:learnerAttempt(out.attempt)});
}));
app.get('/api/admin/open-attempts',authRequired,adminRequired,(req,res)=>res.json({attempts:store.allData().open_attempts.filter(a=>['awaiting_review','failed'].includes(a.status)).map(a=>{const submission=store.allData().open_submissions.find(s=>s.id===a.submission_id),learner=Users.byId(a.user_id);return {...store.OpenAttempts.public(a),assessment_kind:submission?.assessment_kind||(a.level===0&&a.pid===0?'capstone':'assignment'),problem_title:submission?.problem_title||null,learner_name:learner?.name||null};})}));
app.post('/api/admin/open-attempts/:id/grade',authRequired,adminRequired,asyncRoute(async (req,res)=>{
  const a=store.OpenAttempts.byId(req.params.id);if(!a)return res.status(404).json({error:'Attempt not found.'});
  if(a.status==='processing')return res.status(409).json({error:'This attempt is being graded. Wait until grading finishes.'});
  if(a.status==='completed')return res.json({ok:true,existing:true,attempt:store.OpenAttempts.public(a)});
  const score=Number(req.body.score);if(req.body.score==null||req.body.score===''||!Number.isFinite(score)||score<0||score>100||!String(req.body.feedback||'').trim())return res.status(400).json({error:'Provide a score from 0 to 100 and written feedback.'});
  store.OpenAttempts.complete(a.id,score,req.body.feedback,'staff:'+req.user.id);
  const certificate=OpenQuest.maybeCertify(a.user_id,a.track_key,req.user.id);
  announceModuleUnlock(a.user_id,a.track_key); // a staff grade opens the next module too
  await announceCourseCompletion(a.user_id,a.track_key,certificate).catch(e=>console.error('[certificate] email failed:',e.message));
  await store.pendingPersist();res.json({ok:true,attempt:store.OpenAttempts.public(a),certificate:certificate?.cert||null});
}));
/**
 * Tell a learner their next module is open, the moment the grade that opened it
 * lands. Called from the grading worker's onComplete and from the staff-grading
 * route, so it fires whoever did the marking. moduleUnlockToAnnounce() returns
 * an unlock at most once, so a regrade or a restart cannot re-send it.
 */
function announceModuleUnlock(uid, track_key) {
  let out;
  try { out = OpenQuest.moduleUnlockToAnnounce(uid, track_key); }
  catch (e) { console.error('[module-unlock] check failed:', e.message); return; }
  if (!out) return;
  const first = String(out.user.name || '').trim().split(/\s+/)[0] || 'there';
  mailer.notify(
    out.user.email,
    `Module ${out.module.no} is open: ${out.course}`,
    `Hi ${first},\n\nYour work on module ${out.previous.no} has been graded, so module ${out.module.no} of ${out.course} is now open.\n\n${out.module.title}\n\nPick up where you left off: ${APP_URL}/open\n\nAs always, your grades arrive within ${pacing.GRADING_WINDOW_HOURS} hours of submitting, and the module after this one opens as soon as this one is fully graded.\n\n- EchoLens`,
  );
  console.log(`[module-unlock] told user ${uid} that module ${out.module.no} of ${track_key} is open.`);
}

/* ------------------- enrolment confirmation sweep -------------------
 * A free-course seat is taken on enrolment and confirmed an hour later
 * (course-pacing.js). Access does not depend on this sweep - isEnrollmentActive
 * is a clock comparison, so a course opens on time even if the process was
 * down. The sweep exists only to send the confirmation the learner was
 * promised, and confirmed_at makes that exactly-once. It runs on the
 * transactional path, batched under TRANSACTIONAL_MAX_PER_RUN, because this is
 * mail the recipient is expecting right now rather than outreach.
 */
async function sweepEnrollmentConfirmations() {
  const due = OpenQuest.dueForConfirmation(15);
  if (!due.length) return;
  for (const row of due) {
    if (row.user.email) {
      const first = String(row.user.name || '').trim().split(/\s+/)[0] || 'there';
      const delivery = await mailer.notify(
        row.user.email,
        `Congratulations - you are enrolled in ${row.title}`,
        `Hi ${first},\n\nCongratulations! Your enrolment in ${row.title} is confirmed and the course is now open.\n\nStart module 1: ${APP_URL}/open\n\nHow your free certified course works:\n- You can study up to two active courses at a time.\n- The next module opens as soon as the current module's required assignments are graded and passed.\n- Grades are released as soon as they are ready, within ${pacing.GRADING_WINDOW_HOURS} hours of submission.\n- Complete the required assessments to earn your verified certificate.\n\nWelcome to the course, and best of luck with your learning!`,
      );
      const sent = delivery.sent.includes(String(row.user.email).toLowerCase());
      OpenQuest.markConfirmationAttempt(row.user.id, row.track_key, { sent, error: sent ? null : 'The email provider did not accept the confirmation message.' });
    } else {
      OpenQuest.markConfirmationAttempt(row.user.id, row.track_key, { sent: false, error: 'The learner account has no email address.' });
    }
  }
  await store.pendingPersist();
  console.log(`[enrolment] confirmed ${due.length} seat(s).`);
}
let lastFreeEnrollmentDigestAt = Date.now();
async function sendFreeEnrollmentDigest() {
  const now = Date.now();
  const rows = [];
  Users.all().forEach((u) => (u.profile?.free_course_enrollments || []).forEach((e) => {
    const at = Date.parse(e.enrolled_at || '');
    if (at > lastFreeEnrollmentDigestAt && at <= now) rows.push({ user: u, enrollment: e });
  }));
  lastFreeEnrollmentDigestAt = now;
  if (!rows.length) return;
  const lines = rows.map((r, i) => `${i + 1}. ${r.user.name} <${r.user.email || 'no email'}> - ${r.enrollment.track_key} (${r.enrollment.enrolled_at})`).join('\n');
  await mailer.notify(supportAdminEmails(), `EchoLens open-web enrollment report - ${rows.length} new`, `Open-web free-course enrollments received in the last 24 hours:\n\n${lines}\n\nView the complete report in the admin portal: ${APP_URL}/dashboard#view=admin-students`);
}
if (process.env.NODE_ENV !== 'test' && !demo.enabled) {
  const confirmTimer = setInterval(() => { sweepEnrollmentConfirmations().catch((e) => console.error('[enrolment] sweep failed:', e.message)); }, 60_000);
  confirmTimer.unref();
  const digestTimer = setInterval(() => { sendFreeEnrollmentDigest().catch((e) => console.error('[enrolment digest] failed:', e.message)); }, 24 * 60 * 60 * 1000);
  digestTimer.unref();
}

const gradingWorker = require('./grading-worker').createGradingWorker({
  attempts:store.OpenAttempts,persist:()=>store.pendingPersist(),enabled:()=>ai.enabled(),
  grade:async a=>{
    const p=a.payload,track=Quests.trackDef(a.track_key);let text=p.code;
    if(!text&&p.file_url){const parts=[];for(const url of [p.file_url,...(p.files||[]).map(f=>f.url)]){const x=await extractText(url);if(x.text)parts.push(x.text);}text=parts.join('\n\n');}
    if(!text)throw new Error('No readable submission content');
    // The rubric, the reference solution and the program's REAL output all go to
    // the grader. Without the rubric it invented its own standard; without the
    // output it guessed at behaviour from source and got it wrong.
    const rubric=graderContext(p.problem,track);
    return ai.autoGrade(a.user_id,{eventTitle:track?.title,problemTitle:p.problem.title,problemBrief:p.problem.description,passMark:rubric.passMark,code:p.code,language:p.language,text,criteria:rubric.criteria,solution:rubric.solution,expectedOutput:rubric.expectedOutput,sampleInput:rubric.sampleInput,output:p.output||null});
  },onComplete:async a=>{
    const certified=OpenQuest.maybeCertify(a.user_id,a.track_key);
    announceModuleUnlock(a.user_id,a.track_key);
    await announceCourseCompletion(a.user_id,a.track_key,certified).catch(e=>console.error('[certificate] email failed:',e.message));
  },
});
app.get('/api/open/progress', authRequired, openLearnerRequired, asyncRoute(async (req, res) => {
  const track = String(req.query.track || '');
  let prog = OpenQuest.progress(req.user.id, track);
  if (!prog) return res.status(404).json({ error: 'Course not found.' });
  // Repair certificates for completions that finished while the grading worker
  // or mail process was restarting. This is idempotent and keeps the learner's
  // progress page authoritative without requiring a second submission.
  if (!demo.enabled && prog.passed && !prog.certificate) {
    const issued = OpenQuest.maybeCertify(req.user.id, track);
    if (issued) { await store.pendingPersist(); prog = OpenQuest.progress(req.user.id, track); }
  }
  res.json({ progress: { ...prog, enrolled: !!OpenQuest.enrollment(req.user.id, track) } });
}));

/* ---------------- learner AI copilot for the quest workspaces ----------------
 * kind 'prompt' -> BC-02's Prompt Lab: runs the student's prompt like a real
 *                  model so they build a submit-ready workbook.
 * kind 'excel'  -> BC-07's Excel copilot: answers/analyses/edits in the
 *                  context of the sheet they loaded.
 * (BC-05's coding copilot reuses POST /api/compiler/ai.)
 */
app.post('/api/open/ai', authRequired, async (req, res) => {
  try {
    const { kind, prompt, question, sheet, sheet_name, history } = req.body || {};
    if (kind === 'prompt') return res.json({ reply: await ai.promptLab(req.user.id, { prompt }) });
    if (kind === 'excel') return res.json({ reply: await ai.excelCopilot(req.user.id, { question, sheetText: sheet, fileName: sheet_name, history }) });
    res.status(400).json({ error: 'Unknown copilot kind.' });
  } catch (e) { res.status(e.status || 500).json({ error: e.message }); }
});
// Load a workbook into the Excel copilot: the file is read server-side
// (.xlsx via the zip reader, .csv as text), the extracted sheet text goes
// back to the browser as copilot context, and the temp upload is removed.
app.post('/api/open/excel-extract', authRequired, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Choose your Excel or CSV file first.' });
  const drop = () => { try { fs.unlinkSync(req.file.path); } catch {} };
  try {
    const name = req.file.originalname;
    if (!/\.(xlsx|csv)$/i.test(name)) { drop(); return res.status(400).json({ error: 'Upload a .xlsx or .csv file (save modern Excel format, not the old .xls).' }); }
    const text = /\.csv$/i.test(name)
      ? fs.readFileSync(req.file.path, 'utf8').slice(0, 60000)
      : (await extractXlsxText(fs.readFileSync(req.file.path))).slice(0, 60000);
    drop();
    if (!text) return res.status(400).json({ error: 'Could not read any data from that file - check it opens in Excel and try again.' });
    res.json({ ok: true, name, text, preview: text.split('\n').slice(0, 8).join('\n') });
  } catch (e) { drop(); res.status(500).json({ error: 'Could not read that workbook: ' + e.message }); }
});

/* --------------------------------- static --------------------------------- */
// File URLs keep their existing shape; access is resolved from persisted purpose.
function authGate(req, res, next) {
  const current = currentUser(req);
  const user = current && !isDeactivatedAmbassador(current) ? current : null;
  const name = req.path.replace(/^\//, '');
  if (!uploadAccess.canAccessUpload(user, name, store.allData())) return res.status(user ? 403 : 401).send(user ? 'You do not have access to this file.' : 'Sign in to view this file.');
  res.setHeader('Cache-Control', 'private, no-store');
  next();
}
// Dynamic sitemap: the static entries below (courses, landing, etc.) are
// read straight from the committed public/sitemap.xml file, then every
// currently-published talent profile is appended - registered ahead of
// express.static so this route wins instead of that file being served
// as-is. "Add profiles to the sitemap only when published" means this
// has to be generated per-request, not a static file.
app.get('/sitemap.xml', async (req, res) => {
  let base = '';
  try { base = fs.readFileSync(path.join(__dirname, 'public', 'sitemap.xml'), 'utf8'); } catch { base = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n</urlset>'; }
  let profileUrls = '';
  if (db.enabled()) {
    try {
      // The talent marketplace migration (0003_talent_profiles.sql) has not
      // necessarily been run yet - migrations are manual (`npm run migrate`),
      // not applied on boot. Querying a missing table throws on every
      // /sitemap.xml hit, so check it exists first and skip cleanly until the
      // migration lands.
      const { rows: [{ present }] } = await db.query("SELECT to_regclass('public.talent_profiles') IS NOT NULL AS present");
      if (present) {
        const { rows } = await db.query('SELECT handle, updated_at FROM talent_profiles WHERE published = true');
        profileUrls = rows.map((r) => `  <url>\n    <loc>${APP_URL}/talent/${r.handle}</loc>\n    <lastmod>${new Date(r.updated_at).toISOString().slice(0, 10)}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.6</priority>\n  </url>`).join('\n');
      }
    } catch (e) { console.error('[sitemap] could not list published talent profiles:', e.message); }
  }
  const xml = profileUrls ? base.replace('</urlset>', profileUrls + '\n</urlset>') : base;
  res.type('application/xml').send(xml);
});
app.use('/uploads', authGate, express.static(UPLOAD_DIR));
app.use(express.static(path.join(__dirname, 'public')));
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'landing.html')));
/* Server-rendered Course structured data for /open so search engines can index
 * the catalogue (the visible list is drawn client-side from /api/public/catalogue).
 * Built once and cached because the official catalogue is static. */
let OPEN_HTML_CACHE = null;
function buildOpenHtml() {
  const file = path.join(__dirname, 'public', 'open.html');
  let html = fs.readFileSync(file, 'utf8');
  const items = officialCatalogue().map((c, i) => {
    const isFree = !c.price_pkr;
    const course = {
      '@type': 'Course',
      name: c.title,
      description: c.summary || (c.title + ' - an EchoLens ' + (c.tier || 'course') + '.'),
      url: 'https://www.echolens.digital/open',
      provider: { '@type': 'EducationalOrganization', name: 'EchoLens Digital', url: 'https://www.echolens.digital/' },
      offers: {
        '@type': 'Offer',
        category: isFree ? 'Free' : 'Paid',
        price: isFree ? '0' : String(c.price_pkr),
        priceCurrency: 'PKR',
        availability: 'https://schema.org/InStock',
      },
      hasCourseInstance: {
        '@type': 'CourseInstance',
        courseMode: 'Online',
        courseWorkload: c.hours ? ('PT' + c.hours + 'H') : undefined,
        location: { '@type': 'VirtualLocation', url: 'https://www.echolens.digital/open' },
      },
    };
    return { '@type': 'ListItem', position: i + 1, item: course };
  });
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'EchoLens Course Catalogue',
    numberOfItems: items.length,
    itemListElement: items,
  };
  const json = JSON.stringify(ld).replace(/</g, '\\u003c');
  const tag = '<script type="application/ld+json">\n' + json + '\n</script>\n</head>';
  return html.replace('</head>', tag);
}
app.get('/open', (req, res) => {
  try {
    if (!OPEN_HTML_CACHE) OPEN_HTML_CACHE = buildOpenHtml();
    res.type('html').send(OPEN_HTML_CACHE);
  } catch (e) {
    res.sendFile(path.join(__dirname, 'public', 'open.html'));
  }
});
app.get('/compiler', (req, res) => res.sendFile(path.join(__dirname, 'public', 'compiler.html')));
require('./coursepages').register(app); // SEO landing page per course: /courses and /courses/:slug
require('./talent').register(app, { authRequired, requireRecruiter, APP_URL, UPLOAD_DIR }); // Talent Marketplace: student profiles, projects, search (Phases 2-4)
require('./talent-hiring').register(app, { authRequired, requireRecruiter, adminRequired, APP_URL, UPLOAD_DIR }); // Talent Marketplace: contact gating, shortlists, messaging, admin safety/analytics (Phases 5-6)
require('./showcase').register(app, { authRequired, teacherOrAdmin, APP_URL }); // Showcase Feed (v20) - backend (step 4) + frontend pages (step 5)
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'public', 'login.html')));
app.get('/reset-password', (req, res) => res.sendFile(path.join(__dirname, 'public', 'reset-password.html')));
app.get('/recruiter-signup', (req, res) => res.sendFile(path.join(__dirname, 'public', 'recruiter-signup.html')));
app.get('/privacy', (req, res) => res.sendFile(path.join(__dirname, 'public', 'privacy.html')));
app.get('/dashboard', (req, res) => res.sendFile(path.join(__dirname, 'public', 'dashboard.html')));
// Same single-page app as /dashboard, unauthenticated at the HTML level
// exactly like every other page here (see the api() helper's 401 handler
// in dashboard.js) - dashboard.js reads location.pathname and jumps
// straight to the admin recruiter queue when it's this path (redirecting
// away if the signed-in user isn't an admin), so admins get the literal
// /admin/recruiters URL Phase 1 asks for without a second HTML file to
// keep in sync with the rest of the admin shell.
app.get('/admin/recruiters', (req, res) => res.sendFile(path.join(__dirname, 'public', 'dashboard.html')));
app.get('/grade', (req, res) => res.sendFile(path.join(__dirname, 'public', 'grade.html')));
// v18: /cert carries OpenGraph tags for the specific certificate, so pasting
// (or prefilling) the link on LinkedIn/WhatsApp shows the certificate as a
// PICTURE in the post - social crawlers never run JavaScript, so the tags
// must be injected server-side.
function certPageWithOg(req, res) {
  let html = fs.readFileSync(path.join(__dirname, 'public', 'cert.html'), 'utf8');
  const c = req.query.s ? Certificates.bySerial(String(req.query.s)) : null;
  if (c) {
    const url = `${APP_URL}/cert?s=${encodeURIComponent(c.serial)}`;
    const escA = (s) => String(s ?? '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
    const og = `
<meta property="og:type" content="website">
<meta property="og:site_name" content="EchoLens Digital">
<meta property="og:title" content="${escA(c.student_name)} - ${escA(c.title)} | Verified Certificate">
<meta property="og:description" content="${escA(c.student_name)} earned the verified certificate &quot;${escA(c.title)}&quot; from EchoLens Digital. Serial ${escA(c.serial)} - scan or open to verify authenticity.">
<meta property="og:url" content="${escA(url)}">
<meta property="og:image" content="${escA(APP_URL)}/api/cert-og/${encodeURIComponent(c.serial)}.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="${escA(APP_URL)}/api/cert-og/${encodeURIComponent(c.serial)}.png">`;
    html = html.replace('</title>', '</title>' + og);
  }
  res.type('html').send(html);
}
app.get('/cert', certPageWithOg);
app.get('/verify', certPageWithOg);
// The certificate as a shareable 1200x630 PNG - used as the og:image and
// downloadable for posting anywhere.
app.get('/api/cert-og/:serial.png', async (req, res) => {
  const c = Certificates.bySerial(req.params.serial);
  if (!c) return res.status(404).json({ error: 'No certificate exists for this serial.' });
  try {
    const png = await certificatePng(Certificates.publicView(c), `${APP_URL}/cert?s=${c.serial}`);
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.send(png);
  } catch (e) {
    console.error('Certificate image failed:', e.message);
    res.status(500).json({ error: 'Could not render the certificate image.' });
  }
});
app.get('/challan', (req, res) => res.sendFile(path.join(__dirname, 'public', 'challan.html')));

app.use((err, req, res, next) => {
  if (err) {
    if (res.headersSent) return next(err);
    // Preserve a meaningful status when the error carries one (e.g. 413 for an
    // over-limit body, 400 for malformed JSON); default to 400 otherwise.
    const status=err.status||err.statusCode||(err instanceof multer.MulterError?400:503);
    console.error('[request failed]',req.method,req.path,err.code||'',err.message);
    return res.status(status>=400&&status<600?status:503).json({error:status>=500?'This request could not finish. Your prior saved work is available; please retry.':err.message||'Check the request and try again.'});
  }
  next();
});

// U2: a production deploy must never silently fall back to the JSON file
// store - store.js only writes DB_PATH in JSON-file mode (see backupNow()'s
// comment), so once a deploy has ever run on Postgres that file is a frozen
// pre-cutover snapshot. If DATABASE_URL is simply unset/mistyped,
// store.initFromPostgres() below no-ops and boots on that stale file with
// no error at all - this app would look fine and serve wrong data.
// NODE_ENV is trusted for "is this production" (isProd, above), but an
// *unset* NODE_ENV must not be a way to dodge this guard - DB_PATH under
// /data only happens via Render's own persistent-disk env vars (see
// README's Render setup section), so it's a second, independent signal
// that this process is meant to be the real deployment even if NODE_ENV
// itself got left off by mistake.
const looksLikeProductionDeploy = isProd || /^[/\\]data[/\\]/.test(store.DB_PATH);
if (looksLikeProductionDeploy && !db.enabled()) {
  console.error(
    'FATAL: this process looks like a production deploy (' +
    (isProd ? 'NODE_ENV=production' : `NODE_ENV is NOT set, but DB_PATH (${store.DB_PATH}) is under /data, which only Render's persistent-disk setup does`) +
    ') but DATABASE_URL is not set at all. Booting anyway would silently fall back to the JSON file store - ' +
    'a frozen pre-cutover snapshot, not live data, with nothing to indicate the difference. ' +
    'Set DATABASE_URL (and DIRECT_URL, for migrations) in the environment before starting. Refusing to boot.'
  );
  process.exit(1);
}
// DATABASE_URL present but unreachable (bad credentials, network, schema
// not migrated yet) is the other half of "loud, not silent" - already
// handled below: store.initFromPostgres() throws in that case (see its
// own DATABASE_URL-set-but-Postgres-empty guard and Prisma's own connection
// errors), and this catch exits rather than falling back to anything.
(async () => {
  try {
    await store.initFromPostgres();
  } catch (err) {
    console.error('FATAL: could not start against Postgres:', err.message);
    process.exit(1);
  }

  if (!demo.enabled) {
    gradingWorker.start();
    admissionsReminders.start();
  }
  const listener = app.listen(PORT, demo.enabled ? '127.0.0.1' : undefined, () => {
    if (demo.enabled) {
      if (process.send) process.send({ type: 'ready', port: listener.address().port });
      return;
    }
    console.log(`EchoLens LMS v12.3 running on http://localhost:${PORT}`);
    console.log(`Data store: ${store.isUsingPostgres() ? 'Postgres (DATABASE_URL)' : `JSON file (${store.DB_PATH})`}`);
    // Live-class video provider: JaaS (8x8.vc, no time cap) vs the free public
    // meet.jit.si server, which disconnects embedded calls after 5 minutes.
    if (jaas.configured) {
      console.log('Live classes: JaaS (8x8.vc) configured - no 5-minute cap.');
    } else {
      console.warn('Live classes: JaaS NOT configured - falling back to meet.jit.si, which DISCONNECTS embedded calls after 5 minutes. Set JAAS_APP_ID, JAAS_KID and JAAS_PRIVATE_KEY to fix.');
    }
  });
})();
