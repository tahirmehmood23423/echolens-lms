'use strict';

/**
 * EchoLens LMS - Talent Marketplace: student profiles + projects (Phases 2-3)
 *
 * Genuinely new, Postgres-only data (see migrations/0003_talent_profiles.sql
 * for why these tables don't follow the JSONB-per-row translation the
 * legacy collections use). Every route here 503s with a clear message if
 * DATABASE_URL isn't set - there is no JSON-file fallback for this feature,
 * by design (see the Phase 0 summary).
 *
 * Registered into server.js the same way coursepages.js is:
 * `require('./talent').register(app, { authRequired, APP_URL, UPLOAD_DIR })`.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const { marked } = require('marked');
const db = require('./db');
const store = require('./store');
const mailer = require('./mailer');
const searchConfig = require('./search-config');

const { Users, Quests, coursesForUser } = store;

/* --------------------------------- helpers --------------------------------- */
function escA(s) { return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
function jsonLd(obj) { return `<script type="application/ld+json">${JSON.stringify(obj).replace(/</g, '\\u003c')}</script>`; }
function slugify(s) {
  return String(s || '').toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'student';
}
function isOptionalUrl(s) {
  if (!s) return true;
  try { return ['http:', 'https:'].includes(new URL(String(s)).protocol); } catch { return false; }
}
// Markdown is student-authored and rendered on a page anyone (including a
// signed-out visitor) can open, so any raw HTML in the source is escaped
// BEFORE the markdown parser runs - only tags marked's own transforms
// generate (from **, #, [text](url), etc.) ever reach the page. This closes
// the raw-<script>-in-markdown XSS vector without a second sanitizer pass.
function renderMarkdownSafe(md) {
  if (!md) return '';
  const escaped = String(md).slice(0, 20000).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  return marked.parse(escaped, { breaks: true });
}
function detectImageType(buf) {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpeg';
  if (buf.length >= 8 && buf.slice(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'png';
  if (buf.length >= 12 && buf.slice(0, 4).toString('ascii') === 'RIFF' && buf.slice(8, 12).toString('ascii') === 'WEBP') return 'webp';
  return null;
}
function detectPdf(buf) { return buf.length >= 5 && buf.slice(0, 5).toString('ascii') === '%PDF-'; }
function randomFilename(ext) { return crypto.randomBytes(20).toString('hex') + ext; }

const WORK_TYPES = ['internship', 'part_time', 'full_time', 'freelance'];
const AVAILABILITY = ['immediately', 'within_month', 'after_graduation', 'not_looking'];
const REMOTE_PREFS = ['remote', 'onsite', 'hybrid'];

/* --------------------------------- db access --------------------------------- */
async function getProfileByUserId(userId) {
  const { rows } = await db.query('SELECT * FROM talent_profiles WHERE user_id = $1', [userId]);
  return rows[0] || null;
}
async function getProfileByHandle(handle) {
  const { rows } = await db.query('SELECT * FROM talent_profiles WHERE handle = $1', [handle]);
  return rows[0] || null;
}
async function uniqueHandleFrom(base) {
  const root = slugify(base);
  let candidate = root, i = 1;
  // Small table, small loop - simplest correct way to avoid a race-prone
  // "check then insert" gap mattering: the UNIQUE constraint is still the
  // real guarantee (see createProfile's catch), this just picks a sane
  // first guess so a fresh handle rarely needs a retry at all.
  while (await getProfileByHandle(candidate)) { i += 1; candidate = `${root}-${i}`; }
  return candidate;
}
async function skillsForUser(userId) {
  const { rows } = await db.query(
    `SELECT s.id, s.name, ss.source, ss.needs_review FROM student_skills ss JOIN skills s ON s.id = ss.skill_id WHERE ss.user_id = $1 ORDER BY s.name`,
    [userId]
  );
  return rows.map((r) => ({ ...r, id: Number(r.id) })); // see projectPublicView's comment on BIGINT-as-string
}

/** Completeness checklist - weights sum to 100. A profile cannot be published below 60. */
async function computeCompleteness(profile, skillsCount) {
  const checklist = [
    { key: 'headline', label: 'Headline', weight: 10, done: !!(profile.headline && profile.headline.trim()) },
    { key: 'about', label: 'About', weight: 15, done: !!(profile.about && profile.about.trim().length >= 40) },
    { key: 'city', label: 'City and remote preference', weight: 10, done: !!(profile.city && profile.remote_pref) },
    { key: 'availability', label: 'Availability', weight: 10, done: !!profile.availability },
    { key: 'work_type', label: 'Work type sought', weight: 10, done: !!(profile.work_type && profile.work_type.length) },
    { key: 'skills', label: 'At least 3 skills', weight: 15, done: skillsCount >= 3 },
    { key: 'education', label: 'At least one education entry', weight: 10, done: !!(profile.education && profile.education.length) },
    { key: 'experience', label: 'At least one experience entry (or none if not applicable)', weight: 5, done: !!(profile.experience && profile.experience.length) },
    { key: 'resume', label: 'Resume uploaded', weight: 10, done: !!profile.resume_filename },
    { key: 'links', label: 'At least one link (GitHub, LinkedIn, or website)', weight: 5, done: !!(profile.links && Object.values(profile.links).some(Boolean)) },
  ];
  const pct = checklist.reduce((sum, c) => sum + (c.done ? c.weight : 0), 0);
  return { pct, checklist, can_publish: pct >= 60 };
}

/** The "verified by EchoLens" block: read-only, derived live from the existing gamification/course/certificate data - never stored on the profile itself. */
function verifiedBlockFor(user, APP_URL) {
  const p = store.fullStudentProfile(user.id);
  if (!p) return null;
  return {
    level: p.stage, gems: p.gems, streak: p.streak,
    courses: p.courses.map((c) => ({
      title: c.title, gems: c.gems, level: c.level, levels_total: c.levels_total,
      completed: !!c.completed, completion_pct: c.avg_grade,
    })),
    certificates: p.certificates.map((c) => ({ ...c, verify_url: `${APP_URL}/cert?s=${c.serial}` })),
  };
}

/** Final-level (capstone) graded quest submissions for this student across every batch they're in - the curriculum's own "this is the portfolio piece" signal (see store.js's finalProjectFor), reused here instead of inventing a second one. */
function portfolioEligibleSubmissions(userId) {
  const out = [];
  const data = store.allData();
  for (const b of coursesForUser(Users.byId(userId))) {
    const quests = Quests.forBatch(b.id);
    if (!quests.length) continue;
    const finalQuest = quests[quests.length - 1];
    for (const p of finalQuest.problems) {
      const sub = data.quest_submissions.find((s) => s.quest_id === finalQuest.id && s.pid === p.pid && s.user_id === Number(userId));
      if (sub && sub.grade != null) out.push({ submission_id: sub.id, batch_id: b.id, course_title: b.title || b.name, task_title: p.title, grade: sub.grade, submitted_at: sub.submitted_at });
    }
  }
  return out;
}

function projectPublicView(row) {
  return {
    // node-postgres returns BIGINT columns as strings (avoids silent
    // precision loss outside JS's safe integer range) - coerced to a
    // number here so it matches the numeric literal dashboard.js's
    // onclick="fn(${p.id})" handlers produce; without this, client-side
    // `.find(x => x.id === id)` lookups silently fail ("6" !== 6).
    id: Number(row.id), title: row.title, summary: row.summary,
    description_html: renderMarkdownSafe(row.description_markdown),
    tech_stack: row.tech_stack || [], cover_image: row.cover_image ? `/talent-media/${row.cover_image}` : null,
    gallery: (row.gallery || []).map((f) => `/talent-media/${f}`),
    repo_url: row.repo_url, demo_url: row.demo_url, role_played: row.role_played, team_size: row.team_size,
    completed_month: row.completed_month, completed_year: row.completed_year,
    verified: row.verified, source: row.source, visible: row.visible, hidden_reason: row.hidden_reason || null,
    course_name: row.course_name, task_title: row.task_title, instructor_grade: row.instructor_grade, submission_date: row.submission_date,
  };
}

/* --------------------------------- search (Phase 4) --------------------------------- */
// Gems/level/completed-courses/certificates live in the legacy store, not
// Postgres, so they can't be joined live in the search query below -
// mirror them onto talent_profiles so search stays a single, real,
// keyset-paginated SQL query. Called right after the moments most likely
// to change them for one student (profile save/publish, course-project
// publish) and swept for every published profile on a timer - see
// migrations/0004_talent_search.sql's header for the staleness trade-off.
async function refreshSearchCache(userId) {
  const p = store.fullStudentProfile(userId);
  if (!p) return;
  const gems = p.gems;
  const level = p.stage ? p.stage.name : null;
  const completedCourses = p.courses.filter((c) => c.completed).map((c) => c.title);
  const certTitles = p.certificates.map((c) => c.title);
  await db.query(
    `UPDATE talent_profiles SET gems_cache=$1, level_cache=$2, completed_course_titles=$3, certificate_titles=$4 WHERE user_id=$5`,
    [gems, level, completedCourses, certTitles, userId]
  );
}
async function refreshAllSearchCaches() {
  const { rows } = await db.query('SELECT user_id FROM talent_profiles WHERE published = true');
  for (const r of rows) {
    try { await refreshSearchCache(r.user_id); } catch (e) { console.error('[talent] search cache refresh failed for user', r.user_id, e.message); }
  }
}

// Same weighted checklist as computeCompleteness() above, written as SQL
// because every input (profile fields, skill_ids, resume) is already in
// Postgres - kept in sync with that function by hand; there is no way to
// share one implementation across JS and a SQL expression.
const COMPLETENESS_SQL = `(
  (CASE WHEN tp.headline IS NOT NULL AND length(trim(tp.headline)) > 0 THEN 10 ELSE 0 END) +
  (CASE WHEN tp.about IS NOT NULL AND length(trim(tp.about)) >= 40 THEN 15 ELSE 0 END) +
  (CASE WHEN tp.city IS NOT NULL AND length(trim(tp.city)) > 0 AND tp.remote_pref IS NOT NULL THEN 10 ELSE 0 END) +
  (CASE WHEN tp.availability IS NOT NULL THEN 10 ELSE 0 END) +
  (CASE WHEN coalesce(array_length(tp.work_type, 1), 0) > 0 THEN 10 ELSE 0 END) +
  (CASE WHEN coalesce(array_length(tp.skill_ids, 1), 0) >= 3 THEN 15 ELSE 0 END) +
  (CASE WHEN jsonb_array_length(tp.education) > 0 THEN 10 ELSE 0 END) +
  (CASE WHEN jsonb_array_length(tp.experience) > 0 THEN 5 ELSE 0 END) +
  (CASE WHEN tp.resume_filename IS NOT NULL THEN 10 ELSE 0 END) +
  (CASE WHEN coalesce(tp.links->>'github', '') <> '' OR coalesce(tp.links->>'linkedin', '') <> '' OR coalesce(tp.links->>'website', '') <> '' THEN 5 ELSE 0 END)
) / 100.0`;

function buildSearchQuery(f) {
  const where = ['tp.published = true'];
  const params = [];
  let textRankExpr = '0';
  if (f.q) {
    params.push(f.q);
    const i = params.length;
    textRankExpr = `ts_rank(tp.search_vector, websearch_to_tsquery('english', $${i}))`;
    where.push(`(tp.search_vector @@ websearch_to_tsquery('english', $${i})
      OR EXISTS (SELECT 1 FROM projects pr WHERE pr.user_id = tp.user_id AND pr.visible AND pr.search_vector @@ websearch_to_tsquery('english', $${i}))
      OR EXISTS (SELECT 1 FROM student_skills ss JOIN skills sk ON sk.id = ss.skill_id WHERE ss.user_id = tp.user_id AND sk.name ILIKE '%' || $${i} || '%'))`);
  }
  if (f.skills.length) { params.push(f.skills); where.push(f.skills_mode === 'or' ? `tp.skill_ids && $${params.length}::bigint[]` : `tp.skill_ids @> $${params.length}::bigint[]`); }
  if (f.courses.length) { params.push(f.courses); where.push(`tp.completed_course_titles && $${params.length}::text[]`); }
  if (f.certificates.length) { params.push(f.certificates); where.push(`tp.certificate_titles && $${params.length}::text[]`); }
  if (f.min_gems) { params.push(f.min_gems); where.push(`tp.gems_cache >= $${params.length}`); }
  if (f.city) { params.push(`%${f.city}%`); where.push(`tp.city ILIKE $${params.length}`); }
  if (f.remote.length) { params.push(f.remote); where.push(`tp.remote_pref = ANY($${params.length}::text[])`); }
  if (f.availability.length) { params.push(f.availability); where.push(`tp.availability = ANY($${params.length}::text[])`); }
  if (f.work_type.length) { params.push(f.work_type); where.push(`tp.work_type && $${params.length}::text[]`); }
  if (f.has_verified_projects) where.push(`EXISTS (SELECT 1 FROM projects pr WHERE pr.user_id = tp.user_id AND pr.verified AND pr.visible)`);
  if (f.grad_year_min || f.grad_year_max) {
    params.push(f.grad_year_min || 0); const minI = params.length;
    params.push(f.grad_year_max || 9999); const maxI = params.length;
    where.push(`EXISTS (SELECT 1 FROM jsonb_array_elements(tp.education) e WHERE (e->>'end_year') ~ '^[0-9]+$' AND (e->>'end_year')::int BETWEEN $${minI} AND $${maxI})`);
  }
  const freshnessExpr = `GREATEST(0, 1 - EXTRACT(EPOCH FROM (now() - tp.updated_at)) / 86400.0 / ${Number(searchConfig.FRESHNESS_HALF_LIFE_DAYS)})`;
  const scoreExpr = `(${textRankExpr}) * ${searchConfig.WEIGHTS.TEXT_RANK} + (${freshnessExpr}) * ${searchConfig.WEIGHTS.FRESHNESS} + (${COMPLETENESS_SQL}) * ${searchConfig.WEIGHTS.COMPLETENESS}`;
  return { where: where.join(' AND '), params, scoreExpr };
}

/** Real, single-query, keyset-paginated search - every filter here is Postgres-native (see migrations/0004_talent_search.sql for how courses/certs/gems got there). */
async function searchProfiles(filters, cursor) {
  const { where, params, scoreExpr } = buildSearchQuery(filters);
  const qp = [...params];
  let cursorClause = '';
  if (cursor) { qp.push(cursor.score, cursor.id); cursorClause = `AND (score, id) < ($${qp.length - 1}::double precision, $${qp.length}::bigint)`; }
  qp.push(searchConfig.RESULTS_PER_PAGE);
  const { rows } = await db.query(
    `WITH scored AS (
       SELECT tp.id, tp.user_id, tp.handle, tp.headline, tp.city, tp.remote_pref, tp.availability, tp.level_cache, tp.gems_cache, tp.updated_at,
         (${scoreExpr}) AS score
       FROM talent_profiles tp
       WHERE ${where}
     )
     SELECT * FROM scored WHERE true ${cursorClause} ORDER BY score DESC, id DESC LIMIT $${qp.length}`,
    qp
  );
  return rows;
}
async function decorateSearchResults(rows) {
  if (!rows.length) return [];
  const userIds = rows.map((r) => r.user_id);
  const skillsRes = await db.query(`SELECT ss.user_id, sk.name FROM student_skills ss JOIN skills sk ON sk.id = ss.skill_id WHERE ss.user_id = ANY($1::bigint[]) ORDER BY sk.name`, [userIds]);
  const skillsByUser = {};
  for (const r of skillsRes.rows) (skillsByUser[r.user_id] = skillsByUser[r.user_id] || []).push(r.name);
  const projRes = await db.query(`SELECT user_id, id, title, cover_image, verified FROM projects WHERE user_id = ANY($1::bigint[]) AND visible = true ORDER BY verified DESC, created_at DESC`, [userIds]);
  const projByUser = {}; const verifiedCount = {};
  for (const r of projRes.rows) { (projByUser[r.user_id] = projByUser[r.user_id] || []).push(r); if (r.verified) verifiedCount[r.user_id] = (verifiedCount[r.user_id] || 0) + 1; }
  return rows.map((r) => {
    const u = Users.byId(r.user_id);
    return {
      handle: r.handle, name: u ? u.name : 'Student', avatar: u ? u.avatar || null : null,
      headline: r.headline, city: r.city, remote_pref: r.remote_pref, availability: r.availability,
      level: r.level_cache, gems: r.gems_cache,
      skills: (skillsByUser[r.user_id] || []).slice(0, 5),
      verified_badge_count: verifiedCount[r.user_id] || 0,
      project_thumbnails: (projByUser[r.user_id] || []).slice(0, 2).map((p) => ({ id: p.id, title: p.title, cover_image: p.cover_image ? `/talent-media/${p.cover_image}` : null })),
      cursor: Buffer.from(JSON.stringify({ score: r.score, id: r.id })).toString('base64'),
    };
  });
}
async function runWeeklyDigests(APP_URL) {
  const { rows: searches } = await db.query(`SELECT * FROM saved_searches WHERE notify_weekly = true AND (last_notified_at IS NULL OR last_notified_at < now() - interval '7 days')`);
  for (const s of searches) {
    try {
      const results = await searchProfiles(s.filters || {}, null);
      const prevIds = new Set((s.last_result_ids || []).map(Number));
      const fresh = results.filter((r) => !prevIds.has(Number(r.user_id)));
      if (fresh.length) {
        const recruiter = Users.byId(s.recruiter_id);
        if (recruiter && recruiter.email) {
          mailer.notify(recruiter.email, `New matches for your saved search "${s.name}"`,
            `${fresh.length} new student profile(s) match your saved search "${s.name}":\n\n${fresh.map((r) => `${APP_URL}/talent/${r.handle}`).join('\n')}`);
        }
      }
      await db.query('UPDATE saved_searches SET last_notified_at = now(), last_result_ids = $1 WHERE id = $2', [results.map((r) => r.user_id), s.id]);
    } catch (e) { console.error('[talent] weekly digest failed for saved search', s.id, e.message); }
  }
}

function requireDb(req, res, next) {
  if (!db.enabled()) return res.status(503).json({ error: 'The Talent Marketplace is not available - Postgres is not configured on this server.' });
  next();
}
function requireStudent(req, res, next) {
  if (req.user.role !== 'student') return res.status(403).json({ error: 'Only students have a talent profile.' });
  next();
}
/** Small in-memory sliding-window limiter, same shape as server.js's loginThrottle - keyed by signed-in user id (these routes are always authRequired first) rather than IP, since search/contact abuse is a per-account concern. */
function rateLimiter({ max, windowMs, message }) {
  const hits = new Map(); // userId -> { count, windowStart }
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
const searchRateLimit = rateLimiter({ max: 60, windowMs: 5 * 60 * 1000, message: 'Too many searches - please slow down and try again in a few minutes.' });

module.exports = {
  register(app, { authRequired, requireRecruiter, APP_URL, UPLOAD_DIR }) {
    const RESUME_DIR = path.join(UPLOAD_DIR, 'resumes');
    const PROJECTS_DIR = path.join(UPLOAD_DIR, 'projects');
    fs.mkdirSync(RESUME_DIR, { recursive: true });
    fs.mkdirSync(PROJECTS_DIR, { recursive: true });
    app.use('/talent-media', express.static(PROJECTS_DIR));

    if (db.enabled()) {
      setInterval(() => refreshAllSearchCaches().catch((e) => console.error('[talent] search cache sweep failed:', e.message)), searchConfig.CACHE_REFRESH_MINUTES * 60 * 1000);
      setInterval(() => runWeeklyDigests(APP_URL).catch((e) => console.error('[talent] weekly digest run failed:', e.message)), 60 * 60 * 1000); // hourly check; only acts once 7 days have passed per saved search
    }

    const resumeUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });
    const imageUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 8 * 1024 * 1024 } });

    async function processAndSaveImage(buffer) {
      const type = detectImageType(buffer);
      if (!type) return { error: 'Only JPEG, PNG or WEBP images are accepted.' };
      const filename = randomFilename('.jpg');
      const out = await sharp(buffer).rotate().resize({ width: 1600, withoutEnlargement: true }).jpeg({ quality: 82 }).toBuffer();
      fs.writeFileSync(path.join(PROJECTS_DIR, filename), out);
      return { filename };
    }
    function deleteProjectImage(filename) {
      if (!filename) return;
      try { fs.unlinkSync(path.join(PROJECTS_DIR, path.basename(filename))); } catch { /* already gone */ }
    }

    async function ownProject(req, res) {
      const { rows } = await db.query('SELECT * FROM projects WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
      if (!rows[0]) { res.status(404).json({ error: 'Project not found.' }); return null; }
      return rows[0];
    }

    /* ----------------------------- my profile ----------------------------- */
    app.get('/api/talent/me', authRequired, requireDb, requireStudent, async (req, res) => {
      let profile = await getProfileByUserId(req.user.id);
      const skills = profile ? await skillsForUser(req.user.id) : [];
      const completeness = await computeCompleteness(profile || {}, skills.length);
      res.json({
        profile: profile ? {
          handle: profile.handle, headline: profile.headline, about: profile.about, city: profile.city,
          remote_pref: profile.remote_pref, availability: profile.availability, work_type: profile.work_type,
          salary_band: profile.salary_band, salary_visible: profile.salary_visible, links: profile.links,
          education: profile.education, experience: profile.experience, has_resume: !!profile.resume_filename,
          published: profile.published, unpublished_reason: profile.unpublished_reason || null,
        } : null,
        skills, completeness,
        verified: verifiedBlockFor(req.user, APP_URL),
        public_url: profile ? `${APP_URL}/talent/${profile.handle}` : null,
      });
    });

    app.put('/api/talent/me', authRequired, requireDb, requireStudent, async (req, res) => {
      const b = req.body || {};
      if (b.remote_pref !== undefined && b.remote_pref !== null && !REMOTE_PREFS.includes(b.remote_pref)) return res.status(400).json({ error: 'Invalid remote preference.' });
      if (b.availability !== undefined && b.availability !== null && !AVAILABILITY.includes(b.availability)) return res.status(400).json({ error: 'Invalid availability.' });
      const workType = Array.isArray(b.work_type) ? b.work_type.filter((w) => WORK_TYPES.includes(w)) : [];
      const links = {
        github: isOptionalUrl(b.links?.github) ? (b.links?.github || null) : null,
        linkedin: isOptionalUrl(b.links?.linkedin) ? (b.links?.linkedin || null) : null,
        website: isOptionalUrl(b.links?.website) ? (b.links?.website || null) : null,
      };
      if (b.links && ((b.links.github && !isOptionalUrl(b.links.github)) || (b.links.linkedin && !isOptionalUrl(b.links.linkedin)) || (b.links.website && !isOptionalUrl(b.links.website)))) {
        return res.status(400).json({ error: 'Enter valid links (starting with http:// or https://).' });
      }
      const education = Array.isArray(b.education) ? b.education.slice(0, 15).map((e) => ({
        school: String(e.school || '').slice(0, 200), degree: String(e.degree || '').slice(0, 200),
        field: String(e.field || '').slice(0, 200), start_year: e.start_year || null, end_year: e.end_year || null,
      })) : [];
      const experience = Array.isArray(b.experience) ? b.experience.slice(0, 15).map((e) => ({
        company: String(e.company || '').slice(0, 200), role: String(e.role || '').slice(0, 200),
        start_date: String(e.start_date || '').slice(0, 20), end_date: String(e.end_date || '').slice(0, 20),
        description: String(e.description || '').slice(0, 1000),
      })) : [];
      const about = b.about != null ? String(b.about).slice(0, 1200) : null;

      let profile = await getProfileByUserId(req.user.id);
      if (!profile) {
        const handle = await uniqueHandleFrom(req.user.name || 'student');
        const { rows } = await db.query(
          `INSERT INTO talent_profiles (user_id, handle, headline, about, city, remote_pref, availability, work_type, salary_band, salary_visible, links, education, experience)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
          [req.user.id, handle, b.headline ? String(b.headline).slice(0, 150) : null, about, b.city ? String(b.city).slice(0, 100) : null,
            b.remote_pref || null, b.availability || null, workType, b.salary_band ? String(b.salary_band).slice(0, 100) : null, !!b.salary_visible,
            JSON.stringify(links), JSON.stringify(education), JSON.stringify(experience)]
        );
        profile = rows[0];
      } else {
        const { rows } = await db.query(
          `UPDATE talent_profiles SET headline=$1, about=$2, city=$3, remote_pref=$4, availability=$5, work_type=$6, salary_band=$7, salary_visible=$8, links=$9, education=$10, experience=$11, updated_at=now()
           WHERE user_id=$12 RETURNING *`,
          [b.headline ? String(b.headline).slice(0, 150) : null, about, b.city ? String(b.city).slice(0, 100) : null,
            b.remote_pref || null, b.availability || null, workType, b.salary_band ? String(b.salary_band).slice(0, 100) : null, !!b.salary_visible,
            JSON.stringify(links), JSON.stringify(education), JSON.stringify(experience), req.user.id]
        );
        profile = rows[0];
      }
      refreshSearchCache(req.user.id).catch(() => {});
      res.json({ ok: true, handle: profile.handle });
    });

    app.post('/api/talent/me/handle', authRequired, requireDb, requireStudent, async (req, res) => {
      const handle = slugify((req.body || {}).handle);
      if (handle.length < 3) return res.status(400).json({ error: 'Choose a handle with at least 3 characters.' });
      const existing = await getProfileByHandle(handle);
      const mine = await getProfileByUserId(req.user.id);
      if (existing && (!mine || existing.id !== mine.id)) return res.status(400).json({ error: 'That handle is already taken.' });
      if (!mine) return res.status(400).json({ error: 'Save your profile before choosing a handle.' });
      await db.query('UPDATE talent_profiles SET handle=$1, updated_at=now() WHERE user_id=$2', [handle, req.user.id]);
      res.json({ ok: true, handle });
    });

    app.post('/api/talent/me/publish', authRequired, requireDb, requireStudent, async (req, res) => {
      const profile = await getProfileByUserId(req.user.id);
      if (!profile) return res.status(400).json({ error: 'Fill in your profile before publishing.' });
      const skills = await skillsForUser(req.user.id);
      const completeness = await computeCompleteness(profile, skills.length);
      if (!completeness.can_publish) return res.status(400).json({ error: `Your profile is ${completeness.pct}% complete - it must be at least 60% before you can publish.`, completeness });
      await db.query('UPDATE talent_profiles SET published=true, unpublished_reason=NULL, updated_at=now() WHERE user_id=$1', [req.user.id]);
      await refreshSearchCache(req.user.id).catch(() => {});
      res.json({ ok: true, public_url: `${APP_URL}/talent/${profile.handle}` });
    });
    app.post('/api/talent/me/unpublish', authRequired, requireDb, requireStudent, async (req, res) => {
      await db.query('UPDATE talent_profiles SET published=false, updated_at=now() WHERE user_id=$1', [req.user.id]);
      res.json({ ok: true });
    });

    /* ------------------------------- resume ------------------------------- */
    app.post('/api/talent/me/resume', authRequired, requireDb, requireStudent, resumeUpload.single('file'), async (req, res) => {
      if (!req.file) return res.status(400).json({ error: 'Attach a PDF file.' });
      if (!detectPdf(req.file.buffer)) return res.status(400).json({ error: 'Only PDF files are accepted for a resume.' });
      const profile = await getProfileByUserId(req.user.id);
      if (!profile) return res.status(400).json({ error: 'Save your profile before uploading a resume.' });
      const filename = randomFilename('.pdf');
      fs.writeFileSync(path.join(RESUME_DIR, filename), req.file.buffer);
      if (profile.resume_filename) { try { fs.unlinkSync(path.join(RESUME_DIR, profile.resume_filename)); } catch { /* already gone */ } }
      await db.query('UPDATE talent_profiles SET resume_filename=$1, updated_at=now() WHERE user_id=$2', [filename, req.user.id]);
      res.json({ ok: true });
    });
    // Never served under a public static mount - the owner only. Contact
    // gating for recruiters is Phase 5's job; until it exists nobody but
    // the student themselves can fetch this.
    app.get('/api/talent/me/resume', authRequired, requireDb, requireStudent, async (req, res) => {
      const profile = await getProfileByUserId(req.user.id);
      if (!profile || !profile.resume_filename) return res.status(404).json({ error: 'No resume uploaded.' });
      res.sendFile(path.join(RESUME_DIR, profile.resume_filename));
    });

    /* ------------------------------- skills ------------------------------- */
    app.get('/api/talent/skills', authRequired, requireDb, async (req, res) => {
      const q = String(req.query.q || '').trim();
      if (q.length < 1) return res.json({ skills: [] });
      const { rows } = await db.query(`SELECT id, name FROM skills WHERE name ILIKE $1 ORDER BY name LIMIT 15`, [`%${q}%`]);
      res.json({ skills: rows.map((r) => ({ id: Number(r.id), name: r.name })) });
    });
    app.post('/api/talent/me/skills', authRequired, requireDb, requireStudent, async (req, res) => {
      const { skill_id, name } = req.body || {};
      let skillId = skill_id ? Number(skill_id) : null;
      if (!skillId && name && String(name).trim()) {
        const clean = String(name).trim().slice(0, 60);
        const existing = await db.query('SELECT id FROM skills WHERE lower(name) = lower($1)', [clean]);
        if (existing.rows[0]) skillId = existing.rows[0].id;
        else {
          const inserted = await db.query(`INSERT INTO skills (name, source, needs_review) VALUES ($1, 'freetext', true) RETURNING id`, [clean]);
          skillId = inserted.rows[0].id;
        }
      }
      if (!skillId) return res.status(400).json({ error: 'Choose a skill or enter one.' });
      const skillRow = (await db.query('SELECT source, needs_review FROM skills WHERE id = $1', [skillId])).rows[0];
      const countRow = (await db.query('SELECT count(*)::int AS n FROM student_skills WHERE user_id = $1', [req.user.id])).rows[0];
      if (countRow.n >= 40) return res.status(400).json({ error: 'You can list up to 40 skills.' });
      await db.query(
        `INSERT INTO student_skills (user_id, skill_id, source, needs_review) VALUES ($1,$2,$3,$4) ON CONFLICT (user_id, skill_id) DO NOTHING`,
        [req.user.id, skillId, skillRow.source === 'catalogue' ? 'catalogue' : 'freetext', !!skillRow.needs_review]
      );
      res.json({ ok: true, skills: await skillsForUser(req.user.id) });
    });
    app.delete('/api/talent/me/skills/:skillId', authRequired, requireDb, requireStudent, async (req, res) => {
      await db.query('DELETE FROM student_skills WHERE user_id = $1 AND skill_id = $2', [req.user.id, req.params.skillId]);
      res.json({ ok: true, skills: await skillsForUser(req.user.id) });
    });

    /* ------------------------------ projects: mine ------------------------------ */
    app.get('/api/talent/me/portfolio-eligible', authRequired, requireDb, requireStudent, async (req, res) => {
      const eligible = portfolioEligibleSubmissions(req.user.id);
      const published = await db.query('SELECT source_submission_id FROM projects WHERE user_id = $1 AND source_submission_id IS NOT NULL', [req.user.id]);
      const publishedIds = new Set(published.rows.map((r) => Number(r.source_submission_id)));
      res.json({ eligible: eligible.filter((e) => !publishedIds.has(e.submission_id)) });
    });
    app.post('/api/talent/me/projects/from-submission', authRequired, requireDb, requireStudent, async (req, res) => {
      const { submission_id } = req.body || {};
      const eligible = portfolioEligibleSubmissions(req.user.id).find((e) => e.submission_id === Number(submission_id));
      if (!eligible) return res.status(400).json({ error: 'That submission is not eligible to publish as a project.' });
      try {
        const { rows } = await db.query(
          `INSERT INTO projects (user_id, source, verified, title, summary, completed_month, completed_year, visible, course_name, task_title, instructor_grade, submission_date, source_submission_id)
           VALUES ($1,'course',true,$2,$3,$4,$5,true,$6,$7,$8,$9,$10) RETURNING *`,
          [req.user.id, eligible.task_title, `Graded coursework from ${eligible.course_title}.`,
            new Date(eligible.submitted_at).getMonth() + 1, new Date(eligible.submitted_at).getFullYear(),
            eligible.course_title, eligible.task_title, eligible.grade, eligible.submitted_at, eligible.submission_id]
        );
        await refreshSearchCache(req.user.id).catch(() => {});
        res.json({ ok: true, project: projectPublicView(rows[0]) });
      } catch (err) {
        if (err.code === '23505') return res.status(400).json({ error: 'This submission has already been published as a project.' });
        throw err;
      }
    });
    app.get('/api/talent/me/projects', authRequired, requireDb, requireStudent, async (req, res) => {
      const { rows } = await db.query('SELECT * FROM projects WHERE user_id = $1 ORDER BY verified DESC, created_at DESC', [req.user.id]);
      res.json({ projects: rows.map(projectPublicView) });
    });
    app.post('/api/talent/me/projects', authRequired, requireDb, requireStudent, async (req, res) => {
      const b = req.body || {};
      if (!b.title || !String(b.title).trim()) return res.status(400).json({ error: 'Enter a project title.' });
      if (!isOptionalUrl(b.repo_url) || !isOptionalUrl(b.demo_url)) return res.status(400).json({ error: 'Enter valid links, or leave them blank.' });
      const { rows } = await db.query(
        `INSERT INTO projects (user_id, source, verified, title, summary, description_markdown, tech_stack, repo_url, demo_url, role_played, team_size, completed_month, completed_year)
         VALUES ($1,'manual',false,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
        [req.user.id, String(b.title).slice(0, 150), b.summary ? String(b.summary).slice(0, 300) : null,
          b.description_markdown ? String(b.description_markdown).slice(0, 20000) : null,
          Array.isArray(b.tech_stack) ? b.tech_stack.map((t) => String(t).slice(0, 40)).slice(0, 20) : [],
          b.repo_url || null, b.demo_url || null, b.role_played ? String(b.role_played).slice(0, 100) : null,
          b.team_size ? Number(b.team_size) : null, b.completed_month ? Number(b.completed_month) : null, b.completed_year ? Number(b.completed_year) : null]
      );
      res.json({ ok: true, project: projectPublicView(rows[0]) });
    });
    app.put('/api/talent/me/projects/:id', authRequired, requireDb, requireStudent, async (req, res) => {
      const proj = await ownProject(req, res); if (!proj) return;
      const b = req.body || {};
      if (!isOptionalUrl(b.repo_url) || !isOptionalUrl(b.demo_url)) return res.status(400).json({ error: 'Enter valid links, or leave them blank.' });
      // Verified snapshot fields (title, course_name, task_title,
      // instructor_grade, submission_date, verified, source) are never
      // editable here - only the presentation around them is.
      const nextVisible = b.visible !== undefined ? !!b.visible : proj.visible;
      const { rows } = await db.query(
        `UPDATE projects SET summary=$1, description_markdown=$2, tech_stack=$3, repo_url=$4, demo_url=$5, role_played=$6, team_size=$7, completed_month=$8, completed_year=$9, visible=$10, hidden_reason=$11, updated_at=now()
         WHERE id=$12 RETURNING *`,
        [b.summary !== undefined ? String(b.summary).slice(0, 300) : proj.summary,
          b.description_markdown !== undefined ? String(b.description_markdown).slice(0, 20000) : proj.description_markdown,
          Array.isArray(b.tech_stack) ? b.tech_stack.map((t) => String(t).slice(0, 40)).slice(0, 20) : proj.tech_stack,
          b.repo_url !== undefined ? (b.repo_url || null) : proj.repo_url,
          b.demo_url !== undefined ? (b.demo_url || null) : proj.demo_url,
          b.role_played !== undefined ? (b.role_played ? String(b.role_played).slice(0, 100) : null) : proj.role_played,
          b.team_size !== undefined ? (b.team_size ? Number(b.team_size) : null) : proj.team_size,
          b.completed_month !== undefined ? (b.completed_month ? Number(b.completed_month) : null) : proj.completed_month,
          b.completed_year !== undefined ? (b.completed_year ? Number(b.completed_year) : null) : proj.completed_year,
          nextVisible,
          nextVisible ? null : proj.hidden_reason, // re-showing it (student fixed the issue) clears the admin's note, same as profile republish
          proj.id]
      );
      res.json({ ok: true, project: projectPublicView(rows[0]) });
    });
    app.delete('/api/talent/me/projects/:id', authRequired, requireDb, requireStudent, async (req, res) => {
      const proj = await ownProject(req, res); if (!proj) return;
      deleteProjectImage(proj.cover_image);
      (proj.gallery || []).forEach(deleteProjectImage);
      await db.query('DELETE FROM projects WHERE id = $1', [proj.id]);
      res.json({ ok: true });
    });
    app.post('/api/talent/me/projects/:id/cover', authRequired, requireDb, requireStudent, imageUpload.single('file'), async (req, res) => {
      const proj = await ownProject(req, res); if (!proj) return;
      if (!req.file) return res.status(400).json({ error: 'Attach an image.' });
      const out = await processAndSaveImage(req.file.buffer);
      if (out.error) return res.status(400).json({ error: out.error });
      deleteProjectImage(proj.cover_image);
      await db.query('UPDATE projects SET cover_image=$1, updated_at=now() WHERE id=$2', [out.filename, proj.id]);
      res.json({ ok: true, cover_image: `/talent-media/${out.filename}` });
    });
    app.post('/api/talent/me/projects/:id/gallery', authRequired, requireDb, requireStudent, imageUpload.single('file'), async (req, res) => {
      const proj = await ownProject(req, res); if (!proj) return;
      if (!req.file) return res.status(400).json({ error: 'Attach an image.' });
      const gallery = proj.gallery || [];
      if (gallery.length >= 6) return res.status(400).json({ error: 'A project can have up to 6 gallery images.' });
      const out = await processAndSaveImage(req.file.buffer);
      if (out.error) return res.status(400).json({ error: out.error });
      const next = [...gallery, out.filename];
      await db.query('UPDATE projects SET gallery=$1, updated_at=now() WHERE id=$2', [JSON.stringify(next), proj.id]);
      res.json({ ok: true, gallery: next.map((f) => `/talent-media/${f}`) });
    });
    app.delete('/api/talent/me/projects/:id/gallery/:index', authRequired, requireDb, requireStudent, async (req, res) => {
      const proj = await ownProject(req, res); if (!proj) return;
      const idx = Number(req.params.index);
      const gallery = proj.gallery || [];
      if (idx < 0 || idx >= gallery.length) return res.status(400).json({ error: 'No such image.' });
      deleteProjectImage(gallery[idx]);
      const next = gallery.filter((_, i) => i !== idx);
      await db.query('UPDATE projects SET gallery=$1, updated_at=now() WHERE id=$2', [JSON.stringify(next), proj.id]);
      res.json({ ok: true, gallery: next.map((f) => `/talent-media/${f}`) });
    });

    /* ------------------------------- recruiter search (Phase 4) ------------------------------- */
    app.get('/api/talent/search', authRequired, requireDb, requireRecruiter, searchRateLimit, async (req, res) => {
      const q = req.query;
      const splitList = (v) => (v ? String(v).split(',').map((s) => s.trim()).filter(Boolean) : []);
      const filters = {
        q: q.q ? String(q.q).trim().slice(0, 200) : '',
        skills: splitList(q.skills).map(Number).filter((n) => Number.isFinite(n)),
        skills_mode: q.skills_mode === 'or' ? 'or' : 'and',
        courses: splitList(q.courses),
        certificates: splitList(q.certificates),
        min_gems: q.min_gems ? Number(q.min_gems) : 0,
        city: q.city ? String(q.city).trim().slice(0, 100) : '',
        remote: splitList(q.remote).filter((v) => REMOTE_PREFS.includes(v)),
        availability: splitList(q.availability).filter((v) => AVAILABILITY.includes(v)),
        work_type: splitList(q.work_type).filter((v) => WORK_TYPES.includes(v)),
        has_verified_projects: q.has_verified_projects === 'true',
        grad_year_min: q.grad_year_min ? Number(q.grad_year_min) : 0,
        grad_year_max: q.grad_year_max ? Number(q.grad_year_max) : 0,
      };
      let cursor = null;
      if (q.cursor) {
        try { cursor = JSON.parse(Buffer.from(String(q.cursor), 'base64').toString('utf8')); }
        catch { return res.status(400).json({ error: 'Invalid cursor.' }); }
      }
      const rows = await searchProfiles(filters, cursor);
      const results = await decorateSearchResults(rows);
      db.query('INSERT INTO search_log (recruiter_id, filters, result_count) VALUES ($1,$2,$3)', [req.user.id, JSON.stringify(filters), results.length]).catch(() => {});
      res.json({
        results: results.map(({ cursor: _c, ...rest }) => rest),
        next_cursor: results.length === searchConfig.RESULTS_PER_PAGE ? results[results.length - 1].cursor : null,
      });
    });
    app.get('/api/talent/saved-searches', authRequired, requireDb, requireRecruiter, async (req, res) => {
      const { rows } = await db.query('SELECT * FROM saved_searches WHERE recruiter_id = $1 ORDER BY created_at DESC', [req.user.id]);
      res.json({ saved_searches: rows });
    });
    app.post('/api/talent/saved-searches', authRequired, requireDb, requireRecruiter, async (req, res) => {
      const { name, filters, notify_weekly } = req.body || {};
      if (!name || !String(name).trim()) return res.status(400).json({ error: 'Name this search.' });
      const { rows } = await db.query(
        'INSERT INTO saved_searches (recruiter_id, name, filters, notify_weekly) VALUES ($1,$2,$3,$4) RETURNING *',
        [req.user.id, String(name).trim().slice(0, 100), JSON.stringify(filters || {}), !!notify_weekly]
      );
      res.json({ ok: true, saved_search: rows[0] });
    });
    app.delete('/api/talent/saved-searches/:id', authRequired, requireDb, requireRecruiter, async (req, res) => {
      await db.query('DELETE FROM saved_searches WHERE id = $1 AND recruiter_id = $2', [req.params.id, req.user.id]);
      res.json({ ok: true });
    });

    /* ------------------------------- public ------------------------------- */
    // Registered before /talent/profile/:handle so the literal path always
    // wins over the param route.
    app.get('/api/talent/projects', requireDb, async (req, res) => {
      const q = String(req.query.q || '').trim();
      const params = [];
      let where = 'p.visible = true AND tp.published = true';
      if (q) { params.push(`%${q}%`); where += ` AND (p.title ILIKE $${params.length} OR p.summary ILIKE $${params.length})`; }
      const limit = Math.min(60, Math.max(1, Number(req.query.limit) || 24));
      params.push(limit);
      const { rows } = await db.query(
        `SELECT p.*, tp.handle FROM projects p JOIN talent_profiles tp ON tp.user_id = p.user_id
         WHERE ${where} ORDER BY p.verified DESC, p.created_at DESC LIMIT $${params.length}`,
        params
      );
      res.json({ projects: rows.map((r) => ({ ...projectPublicView(r), handle: r.handle })) });
    });
    app.get('/api/talent/profile/:handle', requireDb, async (req, res) => {
      const profile = await getProfileByHandle(String(req.params.handle).toLowerCase());
      if (!profile || !profile.published) return res.status(404).json({ error: 'No published profile at this handle.' });
      const u = Users.byId(profile.user_id);
      if (!u) return res.status(404).json({ error: 'No published profile at this handle.' });
      const skills = await skillsForUser(profile.user_id);
      const { rows: projects } = await db.query('SELECT * FROM projects WHERE user_id = $1 AND visible = true ORDER BY verified DESC, created_at DESC', [profile.user_id]);
      res.json({
        user_id: u.id, name: u.name, handle: profile.handle, headline: profile.headline, about: profile.about, city: profile.city,
        remote_pref: profile.remote_pref, availability: profile.availability, work_type: profile.work_type,
        salary_band: profile.salary_visible ? profile.salary_band : null,
        links: profile.links, education: profile.education, experience: profile.experience,
        skills: skills.map((s) => s.name),
        verified: verifiedBlockFor(u, APP_URL),
        projects: projects.map(projectPublicView),
        // Resume and any contact detail are never rendered here - Phase 5
        // owns the recruiter contact-request/reveal flow this waits for.
      });
    });
    app.get('/api/talent/profile/:handle/projects/:projectId', requireDb, async (req, res) => {
      const profile = await getProfileByHandle(String(req.params.handle).toLowerCase());
      if (!profile || !profile.published) return res.status(404).json({ error: 'Not found.' });
      const { rows } = await db.query('SELECT * FROM projects WHERE id = $1 AND user_id = $2 AND visible = true', [req.params.projectId, profile.user_id]);
      if (!rows[0]) return res.status(404).json({ error: 'Not found.' });
      res.json({ name: Users.byId(profile.user_id)?.name, handle: profile.handle, project: projectPublicView(rows[0]) });
    });

    /* --------------------------------- pages ---------------------------------
     * Literal paths (/talent/search, /talent/projects) are registered before
     * the /talent/:handle param routes so Express matches them first. */
    app.get('/talent/search', (req, res) => res.sendFile(path.join(__dirname, 'public', 'talent-search.html')));
    app.get('/talent/projects', (req, res) => res.sendFile(path.join(__dirname, 'public', 'talent-projects.html')));
    // Server-rendered <title>/<meta description>/JSON-LD so a search engine
    // (which doesn't run the client JS that fetches the actual data) can
    // still index and rank these pages - same pattern server.js's
    // certPageWithOg already uses for /cert, extended with a real <title>
    // rewrite and Person/CreativeWork JSON-LD, not just Open Graph tags.
    app.get('/talent/:handle/projects/:projectId', async (req, res) => {
      let html = fs.readFileSync(path.join(__dirname, 'public', 'talent-project.html'), 'utf8');
      try {
        if (db.enabled()) {
          const profile = await getProfileByHandle(String(req.params.handle).toLowerCase());
          if (profile && profile.published) {
            const { rows } = await db.query('SELECT * FROM projects WHERE id = $1 AND user_id = $2 AND visible = true', [req.params.projectId, profile.user_id]);
            const proj = rows[0];
            const u = proj && Users.byId(profile.user_id);
            if (proj && u) {
              const title = `${proj.title} by ${u.name} | EchoLens Talent Marketplace`;
              const description = (proj.summary || `A project by ${u.name} on EchoLens.`).slice(0, 300);
              const url = `${APP_URL}/talent/${profile.handle}/projects/${proj.id}`;
              const ld = jsonLd({
                '@context': 'https://schema.org', '@type': 'CreativeWork', name: proj.title, description,
                url, author: { '@type': 'Person', name: u.name, url: `${APP_URL}/talent/${profile.handle}` },
                keywords: (proj.tech_stack || []).join(', ') || undefined,
                image: proj.cover_image ? `${APP_URL}/talent-media/${proj.cover_image}` : undefined,
              });
              const head = `<title>${escA(title)}</title>
<meta name="description" content="${escA(description)}">
<link rel="canonical" href="${escA(url)}">
<meta property="og:type" content="article">
<meta property="og:title" content="${escA(title)}">
<meta property="og:description" content="${escA(description)}">
<meta property="og:url" content="${escA(url)}">
${proj.cover_image ? `<meta property="og:image" content="${escA(APP_URL)}/talent-media/${escA(proj.cover_image)}">` : ''}
${ld}`;
              html = html.replace('<title>EchoLens Talent Project</title>', head);
            }
          }
        }
      } catch (e) { console.error('[talent] SEO render failed for project page:', e.message); }
      res.type('html').send(html);
    });
    app.get('/talent/:handle', async (req, res) => {
      let html = fs.readFileSync(path.join(__dirname, 'public', 'talent-profile.html'), 'utf8');
      try {
        if (db.enabled()) {
          const profile = await getProfileByHandle(String(req.params.handle).toLowerCase());
          const u = profile && profile.published ? Users.byId(profile.user_id) : null;
          if (profile && u) {
            const title = `${u.name}${profile.headline ? ' - ' + profile.headline : ''} | EchoLens Talent Marketplace`;
            const description = (profile.about || `${u.name}'s verified EchoLens talent profile - real course projects, certificates and skills.`).slice(0, 300);
            const url = `${APP_URL}/talent/${profile.handle}`;
            const skills = await skillsForUser(profile.user_id);
            const ld = jsonLd({
              '@context': 'https://schema.org', '@type': 'Person', name: u.name, description, url,
              jobTitle: profile.headline || undefined,
              address: profile.city ? { '@type': 'PostalAddress', addressLocality: profile.city } : undefined,
              knowsAbout: skills.length ? skills.map((s) => s.name) : undefined,
              sameAs: [profile.links?.github, profile.links?.linkedin, profile.links?.website].filter(Boolean),
            });
            const head = `<title>${escA(title)}</title>
<meta name="description" content="${escA(description)}">
<link rel="canonical" href="${escA(url)}">
<meta property="og:type" content="profile">
<meta property="og:title" content="${escA(title)}">
<meta property="og:description" content="${escA(description)}">
<meta property="og:url" content="${escA(url)}">
${ld}`;
            html = html.replace('<title>EchoLens Talent Profile</title>', head);
          }
        }
      } catch (e) { console.error('[talent] SEO render failed for profile page:', e.message); }
      res.type('html').send(html);
    });
  },
};
