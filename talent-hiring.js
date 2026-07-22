'use strict';

/**
 * EchoLens LMS - Talent Marketplace: contact gating, shortlists, messaging
 * (Phase 5), plus admin safety and analytics (Phase 6).
 *
 * Same rules as talent.js: Postgres-only, 503s if DATABASE_URL isn't set.
 * Registered the same way: `require('./talent-hiring').register(app, {...})`.
 *
 * Contact details, resume download, and any direct identifying link are
 * NEVER rendered to a recruiter until the student accepts a contact
 * request for that specific recruiter - not before, and not just because
 * the recruiter is "approved" in general.
 */

const path = require('path');
const db = require('./db');
const store = require('./store');
const mailer = require('./mailer');
const searchConfig = require('./search-config');

const { Users, Companies, AuditLog } = store;

function requireDb(req, res, next) {
  if (!db.enabled()) return res.status(503).json({ error: 'The Talent Marketplace is not available - Postgres is not configured on this server.' });
  next();
}
/** Same shape as talent.js's rate limiter (kept local rather than shared - it's ten lines, not worth a new module for two call sites). Burst protection on top of the per-day cap enforced in the route itself. */
function rateLimiter({ max, windowMs, message }) {
  const hits = new Map();
  return (req, res, next) => {
    const key = req.user.id;
    const now = Date.now();
    const rec = hits.get(key);
    if (!rec || now - rec.windowStart > windowMs) { hits.set(key, { count: 1, windowStart: now }); return next(); }
    rec.count += 1;
    if (rec.count > max) return res.status(429).json({ error: message });
    next();
  };
}
const contactRateLimit = rateLimiter({ max: 10, windowMs: 5 * 60 * 1000, message: 'Too many contact requests in a short time - please slow down.' });
function csvCell(v) {
  const s = String(v ?? '');
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
function hi(name) { return `Hi ${String(name || '').trim().split(/\s+/)[0] || 'there'}`; }

module.exports = {
  register(app, { authRequired, requireRecruiter, adminRequired, APP_URL, UPLOAD_DIR }) {
    const RESUME_DIR = path.join(UPLOAD_DIR, 'resumes');

    function requireStudent(req, res, next) {
      if (req.user.role !== 'student') return res.status(403).json({ error: 'Students only.' });
      next();
    }
    async function getRequestForUser(id, userId) {
      const { rows } = await db.query('SELECT * FROM contact_requests WHERE id = $1', [id]);
      const r = rows[0];
      if (!r) return null;
      // node-postgres returns BIGINT columns as strings (to avoid silent
      // precision loss outside JS's safe integer range) - normalize to
      // numbers here so every comparison against req.user.id below (and
      // in every route that calls this) works, instead of failing silently.
      r.recruiter_id = Number(r.recruiter_id);
      r.student_id = Number(r.student_id);
      if (r.recruiter_id !== Number(userId) && r.student_id !== Number(userId)) return null;
      return r;
    }
    async function studentProfileSummary(userId) {
      const { rows } = await db.query('SELECT handle, headline, published FROM talent_profiles WHERE user_id = $1', [userId]);
      return rows[0] || {};
    }

    /* --------------------------- recruiter: contact requests --------------------------- */
    app.post('/api/talent/profile/:handle/contact-request', authRequired, requireDb, requireRecruiter, contactRateLimit, async (req, res) => {
      const { rows: profRows } = await db.query('SELECT * FROM talent_profiles WHERE handle = $1 AND published = true', [String(req.params.handle).toLowerCase()]);
      const profile = profRows[0];
      if (!profile) return res.status(404).json({ error: 'No published profile at this handle.' });
      const { message } = req.body || {};
      if (!message || !String(message).trim()) return res.status(400).json({ error: 'Write a short message stating the role and company.' });

      const recruiter = req.user;
      const company = recruiter.company_id ? Companies.byId(recruiter.company_id) : null;
      if (company) {
        const blocked = await db.query('SELECT 1 FROM blocked_companies WHERE student_id = $1 AND company_id = $2', [profile.user_id, company.id]);
        if (blocked.rows[0]) return res.status(403).json({ error: 'This student is not accepting contact requests from your company.' });
      }
      const todayCount = await db.query(
        `SELECT count(*)::int AS n FROM contact_requests WHERE recruiter_id = $1 AND created_at >= date_trunc('day', now())`,
        [recruiter.id]
      );
      if (todayCount.rows[0].n >= searchConfig.CONTACT_REQUESTS_DAILY_LIMIT) {
        return res.status(429).json({ error: `You've reached today's limit of ${searchConfig.CONTACT_REQUESTS_DAILY_LIMIT} contact requests. Try again tomorrow.` });
      }
      try {
        const { rows } = await db.query(
          `INSERT INTO contact_requests (recruiter_id, student_id, message) VALUES ($1,$2,$3) RETURNING *`,
          [recruiter.id, profile.user_id, String(message).trim().slice(0, 1000)]
        );
        const student = Users.byId(profile.user_id);
        if (student && student.email) {
          mailer.notify(student.email, 'A recruiter wants to contact you on EchoLens',
            `${hi(student.name)},\n\n${recruiter.name}${company ? ` from ${company.name}` : ''} would like to contact you through EchoLens.\n\nMessage: ${message}\n\nReview and respond from your Hiring Interest page: ${APP_URL}/dashboard`);
        }
        res.json({ ok: true, request: rows[0] });
      } catch (err) {
        if (err.code === '23505') return res.status(400).json({ error: 'You already have an open request with this student.' });
        throw err;
      }
    });
    app.get('/api/talent/recruiter/contact-requests', authRequired, requireDb, requireRecruiter, async (req, res) => {
      const { rows } = await db.query('SELECT * FROM contact_requests WHERE recruiter_id = $1 ORDER BY created_at DESC', [req.user.id]);
      const out = [];
      for (const r of rows) {
        const u = Users.byId(r.student_id);
        const prof = await studentProfileSummary(r.student_id);
        out.push({ id: Number(r.id), student_name: u ? u.name : 'Student', handle: prof.handle, headline: prof.headline, message: r.message, status: r.status, created_at: r.created_at, responded_at: r.responded_at });
      }
      res.json({ requests: out });
    });
    app.get('/api/talent/recruiter/contact-requests/:id', authRequired, requireDb, requireRecruiter, async (req, res) => {
      const r = await getRequestForUser(req.params.id, req.user.id);
      if (!r || r.recruiter_id !== req.user.id) return res.status(404).json({ error: 'Not found.' });
      const u = Users.byId(r.student_id);
      const prof = await studentProfileSummary(r.student_id);
      const out = { id: Number(r.id), status: r.status, message: r.message, created_at: r.created_at, student_name: u ? u.name : 'Student', handle: prof.handle };
      if (r.status === 'accepted') {
        out.email = u ? u.email : null;
        out.phone = u && u.profile ? u.profile.phone : null;
        out.has_resume = !!(await db.query('SELECT resume_filename FROM talent_profiles WHERE user_id = $1', [r.student_id])).rows[0]?.resume_filename;
      }
      res.json(out);
    });
    app.get('/api/talent/recruiter/contact-requests/:id/resume', authRequired, requireDb, requireRecruiter, async (req, res) => {
      const r = await getRequestForUser(req.params.id, req.user.id);
      if (!r || r.recruiter_id !== req.user.id || r.status !== 'accepted') return res.status(403).json({ error: 'Not available.' });
      const { rows } = await db.query('SELECT resume_filename FROM talent_profiles WHERE user_id = $1', [r.student_id]);
      if (!rows[0] || !rows[0].resume_filename) return res.status(404).json({ error: 'No resume uploaded.' });
      res.sendFile(path.join(RESUME_DIR, rows[0].resume_filename));
    });

    /* --------------------------- student: hiring interest --------------------------- */
    app.get('/api/talent/me/contact-requests', authRequired, requireDb, requireStudent, async (req, res) => {
      const { rows } = await db.query('SELECT * FROM contact_requests WHERE student_id = $1 ORDER BY created_at DESC', [req.user.id]);
      const out = [];
      for (const r of rows) {
        const recruiter = Users.byId(r.recruiter_id);
        const company = recruiter && recruiter.company_id ? Companies.byId(recruiter.company_id) : null;
        out.push({ id: Number(r.id), recruiter_name: recruiter ? recruiter.name : 'Recruiter', company: company ? company.name : null, company_id: company ? company.id : null, message: r.message, status: r.status, created_at: r.created_at });
      }
      res.json({ requests: out });
    });
    app.post('/api/talent/me/contact-requests/:id/accept', authRequired, requireDb, requireStudent, async (req, res) => {
      const r = await getRequestForUser(req.params.id, req.user.id);
      if (!r || r.student_id !== req.user.id) return res.status(404).json({ error: 'Not found.' });
      if (r.status !== 'pending') return res.status(400).json({ error: 'This request has already been responded to.' });
      await db.query(`UPDATE contact_requests SET status='accepted', responded_at=now() WHERE id=$1`, [r.id]);
      await db.query(`INSERT INTO contact_reveals (contact_request_id, recruiter_id, student_id, message) VALUES ($1,$2,$3,$4)`, [r.id, r.recruiter_id, r.student_id, r.message]);
      const recruiter = Users.byId(r.recruiter_id);
      if (recruiter && recruiter.email) mailer.notify(recruiter.email, 'A student accepted your contact request', `${hi(recruiter.name)},\n\n${req.user.name} accepted your contact request on EchoLens. You can now see their contact details and message them.\n\n${APP_URL}/talent/interest`);
      res.json({ ok: true });
    });
    app.post('/api/talent/me/contact-requests/:id/decline', authRequired, requireDb, requireStudent, async (req, res) => {
      const r = await getRequestForUser(req.params.id, req.user.id);
      if (!r || r.student_id !== req.user.id) return res.status(404).json({ error: 'Not found.' });
      if (r.status !== 'pending') return res.status(400).json({ error: 'This request has already been responded to.' });
      await db.query(`UPDATE contact_requests SET status='declined', responded_at=now() WHERE id=$1`, [r.id]);
      res.json({ ok: true });
    });
    app.post('/api/talent/me/block-company', authRequired, requireDb, requireStudent, async (req, res) => {
      const { company_id } = req.body || {};
      if (!company_id) return res.status(400).json({ error: 'No company specified.' });
      await db.query(`INSERT INTO blocked_companies (student_id, company_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`, [req.user.id, company_id]);
      // Blocking withdraws consent going forward - any still-open request
      // from that company is declined automatically. Recruiter -> company
      // lookup lives in the legacy store, not Postgres, so this is a JS
      // loop over the (small, per-student) set of pending requests rather
      // than a single SQL statement.
      const pending = (await db.query(`SELECT id, recruiter_id FROM contact_requests WHERE student_id=$1 AND status='pending'`, [req.user.id])).rows;
      for (const p of pending) {
        const recruiter = Users.byId(p.recruiter_id);
        if (recruiter && recruiter.company_id === Number(company_id)) {
          await db.query(`UPDATE contact_requests SET status='declined', responded_at=now() WHERE id=$1`, [p.id]);
        }
      }
      res.json({ ok: true });
    });
    app.get('/api/talent/me/blocked-companies', authRequired, requireDb, requireStudent, async (req, res) => {
      const { rows } = await db.query('SELECT company_id FROM blocked_companies WHERE student_id = $1', [req.user.id]);
      res.json({ companies: rows.map((r) => { const c = Companies.byId(r.company_id); return c ? { id: c.id, name: c.name } : null; }).filter(Boolean) });
    });
    app.delete('/api/talent/me/blocked-companies/:companyId', authRequired, requireDb, requireStudent, async (req, res) => {
      await db.query('DELETE FROM blocked_companies WHERE student_id = $1 AND company_id = $2', [req.user.id, req.params.companyId]);
      res.json({ ok: true });
    });

    /* --------------------------------- messaging --------------------------------- */
    app.get('/api/talent/contact-requests/:id/messages', authRequired, requireDb, async (req, res) => {
      const r = await getRequestForUser(req.params.id, req.user.id);
      if (!r) return res.status(404).json({ error: 'Not found.' });
      if (r.status !== 'accepted') return res.status(403).json({ error: 'Messaging opens once the contact request is accepted.' });
      const { rows } = await db.query('SELECT * FROM messages WHERE contact_request_id = $1 ORDER BY created_at', [r.id]);
      res.json({ messages: rows });
    });
    app.post('/api/talent/contact-requests/:id/messages', authRequired, requireDb, async (req, res) => {
      const r = await getRequestForUser(req.params.id, req.user.id);
      if (!r) return res.status(404).json({ error: 'Not found.' });
      if (r.status !== 'accepted') return res.status(403).json({ error: 'Messaging opens once the contact request is accepted.' });
      const { body } = req.body || {};
      if (!body || !String(body).trim()) return res.status(400).json({ error: 'Enter a message.' });
      const senderRole = req.user.id === r.recruiter_id ? 'recruiter' : 'student';
      const { rows } = await db.query('INSERT INTO messages (contact_request_id, sender_role, body) VALUES ($1,$2,$3) RETURNING *', [r.id, senderRole, String(body).trim().slice(0, 2000)]);
      const recipientId = senderRole === 'recruiter' ? r.student_id : r.recruiter_id;
      const recipient = Users.byId(recipientId);
      if (recipient && recipient.email) mailer.notify(recipient.email, 'New message on EchoLens', `${hi(recipient.name)},\n\nYou have a new message on EchoLens.\n\nSign in to read and reply: ${APP_URL}/dashboard`);
      res.json({ ok: true, message: rows[0] });
    });

    /* ---------------------------------- shortlists ---------------------------------- */
    app.get('/api/talent/shortlists', authRequired, requireDb, requireRecruiter, async (req, res) => {
      const { rows } = await db.query('SELECT * FROM shortlists WHERE recruiter_id = $1 ORDER BY created_at DESC', [req.user.id]);
      const out = [];
      for (const s of rows) {
        const cand = await db.query('SELECT * FROM shortlist_candidates WHERE shortlist_id = $1 ORDER BY created_at DESC', [s.id]);
        const candidates = (await Promise.all(cand.rows.map(async (c) => {
          const u = Users.byId(c.student_id);
          const prof = await studentProfileSummary(c.student_id);
          // A student unpublishing (themselves, or via admin override)
          // must immediately disappear from every recruiter's shortlist
          // view - the shortlist_candidates row itself is left alone
          // (it's the recruiter's own organizational note, not something
          // unpublishing should delete), it's just not shown while hidden.
          if (!prof.published) return null;
          return { student_id: Number(c.student_id), name: u ? u.name : 'Student', handle: prof.handle, note: c.note };
        }))).filter(Boolean);
        out.push({ id: Number(s.id), name: s.name, created_at: s.created_at, candidates });
      }
      res.json({ shortlists: out });
    });
    app.post('/api/talent/shortlists', authRequired, requireDb, requireRecruiter, async (req, res) => {
      const { name } = req.body || {};
      if (!name || !String(name).trim()) return res.status(400).json({ error: 'Name this shortlist.' });
      const { rows } = await db.query('INSERT INTO shortlists (recruiter_id, name) VALUES ($1,$2) RETURNING *', [req.user.id, String(name).trim().slice(0, 100)]);
      res.json({ ok: true, shortlist: rows[0] });
    });
    app.delete('/api/talent/shortlists/:id', authRequired, requireDb, requireRecruiter, async (req, res) => {
      await db.query('DELETE FROM shortlists WHERE id = $1 AND recruiter_id = $2', [req.params.id, req.user.id]);
      res.json({ ok: true });
    });
    async function ownShortlist(req, res) {
      const { rows } = await db.query('SELECT * FROM shortlists WHERE id = $1 AND recruiter_id = $2', [req.params.id, req.user.id]);
      if (!rows[0]) { res.status(404).json({ error: 'Shortlist not found.' }); return null; }
      return rows[0];
    }
    app.post('/api/talent/shortlists/:id/candidates', authRequired, requireDb, requireRecruiter, async (req, res) => {
      const list = await ownShortlist(req, res); if (!list) return;
      const { handle, note } = req.body || {};
      const prof = (await db.query('SELECT user_id FROM talent_profiles WHERE handle = $1 AND published = true', [String(handle || '').toLowerCase()])).rows[0];
      if (!prof) return res.status(404).json({ error: 'No published profile at that handle.' });
      await db.query(
        `INSERT INTO shortlist_candidates (shortlist_id, student_id, note) VALUES ($1,$2,$3) ON CONFLICT (shortlist_id, student_id) DO UPDATE SET note = EXCLUDED.note`,
        [list.id, prof.user_id, note ? String(note).slice(0, 500) : null]
      );
      res.json({ ok: true });
    });
    app.delete('/api/talent/shortlists/:id/candidates/:studentId', authRequired, requireDb, requireRecruiter, async (req, res) => {
      const list = await ownShortlist(req, res); if (!list) return;
      await db.query('DELETE FROM shortlist_candidates WHERE shortlist_id = $1 AND student_id = $2', [list.id, req.params.studentId]);
      res.json({ ok: true });
    });
    // CSV export: contact fields are populated only for candidates this
    // recruiter has an accepted contact_reveals row for - "containing only
    // revealed contacts", per spec, not a blanket contact-info dump of
    // every shortlisted student regardless of consent.
    app.get('/api/talent/shortlists/:id/export.csv', authRequired, requireDb, requireRecruiter, async (req, res) => {
      const list = await ownShortlist(req, res); if (!list) return;
      const candidates = (await db.query('SELECT * FROM shortlist_candidates WHERE shortlist_id = $1 ORDER BY created_at', [list.id])).rows;
      const revealed = new Set((await db.query('SELECT student_id FROM contact_reveals WHERE recruiter_id = $1', [req.user.id])).rows.map((r) => Number(r.student_id)));
      const lines = ['Name,Handle,Note,Email,Phone'];
      for (const c of candidates) {
        const u = Users.byId(c.student_id);
        const prof = await studentProfileSummary(c.student_id);
        const isRevealed = revealed.has(Number(c.student_id));
        lines.push([csvCell(u ? u.name : ''), csvCell(prof.handle || ''), csvCell(c.note || ''), csvCell(isRevealed && u ? u.email : ''), csvCell(isRevealed && u && u.profile ? u.profile.phone : '')].join(','));
      }
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${list.name.replace(/[^a-z0-9]+/gi, '-')}.csv"`);
      res.send(lines.join('\n'));
    });

    /* ------------------------------ reports (Phase 6) ------------------------------ */
    app.post('/api/talent/reports', authRequired, requireDb, async (req, res) => {
      const { target_type, target_id, reason } = req.body || {};
      if (!['profile', 'project'].includes(target_type)) return res.status(400).json({ error: 'Invalid report target.' });
      if (!reason || !String(reason).trim()) return res.status(400).json({ error: 'Describe the issue.' });
      await db.query('INSERT INTO reports (reporter_id, target_type, target_id, reason) VALUES ($1,$2,$3,$4)', [req.user.id, target_type, target_id, String(reason).trim().slice(0, 1000)]);
      res.json({ ok: true });
    });
    app.get('/api/admin/talent/reports', authRequired, adminRequired, requireDb, async (req, res) => {
      const status = req.query.status || 'open';
      const { rows } = await db.query('SELECT * FROM reports WHERE status = $1 ORDER BY created_at DESC', [status]);
      res.json({ reports: rows.map((r) => ({ ...r, id: Number(r.id), target_id: Number(r.target_id), reporter_name: r.reporter_id ? (Users.byId(r.reporter_id)?.name || 'Unknown') : 'Unknown' })) });
    });
    app.post('/api/admin/talent/reports/:id/resolve', authRequired, adminRequired, requireDb, async (req, res) => {
      await db.query(`UPDATE reports SET status='resolved', resolved_at=now(), resolved_by=$1 WHERE id=$2`, [req.user.id, req.params.id]);
      res.json({ ok: true });
    });
    app.post('/api/admin/talent/reports/:id/dismiss', authRequired, adminRequired, requireDb, async (req, res) => {
      await db.query(`UPDATE reports SET status='dismissed', resolved_at=now(), resolved_by=$1 WHERE id=$2`, [req.user.id, req.params.id]);
      res.json({ ok: true });
    });

    /* --------------------------- admin: unpublish (Phase 6) --------------------------- */
    app.post('/api/admin/talent/profiles/:userId/unpublish', authRequired, adminRequired, requireDb, async (req, res) => {
      const { reason } = req.body || {};
      if (!reason || !String(reason).trim()) return res.status(400).json({ error: 'Enter a reason - the student is told why.' });
      const { rows } = await db.query(`UPDATE talent_profiles SET published=false, unpublished_reason=$1, updated_at=now() WHERE user_id=$2 RETURNING handle`, [String(reason).trim().slice(0, 500), req.params.userId]);
      if (!rows[0]) return res.status(404).json({ error: 'Profile not found.' });
      AuditLog.record({ actor_id: req.user.id, action: 'talent_profile_unpublish', target_type: 'talent_profile', target_id: req.params.userId, detail: reason });
      const student = Users.byId(req.params.userId);
      if (student && student.email) mailer.notify(student.email, 'Your EchoLens talent profile was unpublished', `${hi(student.name)},\n\nAn EchoLens admin unpublished your talent profile.\n\nReason: ${reason}\n\nYou can edit your profile and republish once the issue is resolved.`);
      res.json({ ok: true });
    });
    app.post('/api/admin/talent/projects/:id/unpublish', authRequired, adminRequired, requireDb, async (req, res) => {
      const { reason } = req.body || {};
      if (!reason || !String(reason).trim()) return res.status(400).json({ error: 'Enter a reason - the student is told why.' });
      const { rows } = await db.query(`UPDATE projects SET visible=false, hidden_reason=$1, updated_at=now() WHERE id=$2 RETURNING user_id, title`, [String(reason).trim().slice(0, 500), req.params.id]);
      if (!rows[0]) return res.status(404).json({ error: 'Project not found.' });
      AuditLog.record({ actor_id: req.user.id, action: 'talent_project_unpublish', target_type: 'project', target_id: req.params.id, detail: reason });
      const student = Users.byId(rows[0].user_id);
      if (student && student.email) mailer.notify(student.email, 'Your EchoLens project was unpublished', `${hi(student.name)},\n\nAn EchoLens admin unpublished your project "${rows[0].title}".\n\nReason: ${reason}\n\nYou can edit it and make it visible again once the issue is resolved.`);
      res.json({ ok: true });
    });

    /* ------------------------------- analytics (Phase 6) ------------------------------- */
    app.get('/api/admin/talent/analytics', authRequired, adminRequired, requireDb, async (req, res) => {
      const publishedProfiles = (await db.query('SELECT count(*)::int AS n FROM talent_profiles WHERE published = true')).rows[0].n;
      const activeRecruiters = Users.all().filter((u) => u.role === 'recruiter' && u.status === 'approved').length;
      const searchesRun = (await db.query('SELECT count(*)::int AS n FROM search_log')).rows[0].n;
      const contactRequestsSent = (await db.query('SELECT count(*)::int AS n FROM contact_requests')).rows[0].n;
      const decided = (await db.query(`SELECT status, count(*)::int AS n FROM contact_requests WHERE status IN ('accepted','declined') GROUP BY status`)).rows;
      const accepted = decided.find((r) => r.status === 'accepted')?.n || 0;
      const declined = decided.find((r) => r.status === 'declined')?.n || 0;
      const acceptanceRate = (accepted + declined) ? Math.round((accepted / (accepted + declined)) * 100) : null;
      const revealedContacts = (await db.query('SELECT count(*)::int AS n FROM contact_reveals')).rows[0].n;
      const topSkills = (await db.query(`
        SELECT sk.name, count(*)::int AS n
        FROM search_log sl, jsonb_array_elements_text(coalesce(sl.filters->'skills', '[]'::jsonb)) skill_id_text
        JOIN skills sk ON sk.id = skill_id_text::bigint
        GROUP BY sk.name ORDER BY n DESC LIMIT 10
      `)).rows;
      res.json({
        published_profiles: publishedProfiles, active_recruiters: activeRecruiters, searches_run: searchesRun,
        contact_requests_sent: contactRequestsSent, acceptance_rate: acceptanceRate, revealed_contacts: revealedContacts,
        top_searched_skills: topSkills,
      });
    });

    /* --------------------------------- pages --------------------------------- */
    app.get('/talent/interest', (req, res) => res.sendFile(path.join(__dirname, 'public', 'talent-interest.html')));
  },
};
