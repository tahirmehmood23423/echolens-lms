'use strict';

/**
 * EchoLens LMS - Showcase Feed backend (v20)
 *
 * Registered into server.js the same way talent.js is:
 * `require('./showcase').register(app, { authRequired, teacherOrAdmin })`.
 *
 * All data-layer logic (visibility, level-gating, cursor pagination,
 * counters, moderation, gems) lives in store.js's Showcase object - this
 * file only ever does HTTP/multipart/R2 concerns: parsing the request,
 * running images through r2-upload.js, and turning store.js's {error}/null
 * returns into the right status code. See store.js's "v20: Showcase Feed"
 * section for the actual business rules and why they're implemented the
 * way they are.
 */

const fs = require('fs');
const path = require('path');
const express = require('express');
const multer = require('multer');
const store = require('./store');
const r2 = require('./r2-upload');

const { Showcase, Users, Batches, canManageBatch, stageFor, totalGemsForStudent } = store;

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: r2.MAX_UPLOAD_BYTES, files: r2.MAX_IMAGES_PER_POST } });

// Postgres only ever stores the R2 key (never a full URL, see r2-upload.js
// and Showcase.hydratePost) - this is where a browsable URL gets built from
// one, both for API responses (r2_base, read by the frontend) and for the
// server-rendered teaser's absolute og:image below.
const R2_PUBLIC_BASE = (process.env.R2_PUBLIC_BASE_URL || '').replace(/\/$/, '');
function escA(s) { return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

/** Same shape as talent.js's own rateLimiter (keyed by signed-in user id, not IP - every route here is authRequired first, so per-account throttling is the right fit, unlike server.js's IP-keyed rateLimit() built for unauthenticated abuse). Small enough to duplicate locally rather than reach across modules for it - talent.js does the same. */
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
// Tightest on post creation (constraint: "every write endpoint, tightest
// limit on post creation") - the rest are generous enough not to interfere
// with normal use (rapid like/unlike toggling, a real comment thread).
const limitCreatePost = rateLimiter({ max: 5, windowMs: 60 * 60 * 1000, message: 'Too many posts - please wait a while before publishing another.' });
const limitDeletePost = rateLimiter({ max: 20, windowMs: 60 * 60 * 1000, message: 'Too many requests - please slow down.' });
const limitLike = rateLimiter({ max: 60, windowMs: 5 * 60 * 1000, message: 'Too many requests - please slow down.' });
const limitComment = rateLimiter({ max: 20, windowMs: 10 * 60 * 1000, message: 'Too many comments - please slow down.' });
const limitReport = rateLimiter({ max: 10, windowMs: 60 * 60 * 1000, message: 'Too many reports - please try again later.' });
const limitModeration = rateLimiter({ max: 60, windowMs: 60 * 60 * 1000, message: 'Too many requests - please slow down.' });

module.exports = {
  register(app, { authRequired, teacherOrAdmin, APP_URL }) {
    const router = express.Router();

    /* ------------------------------- page routes ------------------------------- */
    // No authRequired here, on purpose - every page route in this codebase
    // is served unauthenticated at the HTML level (see server.js's own
    // comment on /dashboard); the underlying API calls are what actually
    // gate access, and the client redirects to /login on a 401. Matches
    // talent.js's /talent/search, /talent/projects pattern exactly.
    app.get('/showcase', (req, res) => res.sendFile(path.join(__dirname, 'public', 'showcase.html')));

    // Server-rendered public teaser + Open Graph/Twitter tags, same pattern
    // server.js's certPageWithOg and talent.js's /talent/:handle already
    // use: read the static template, string-inject <title>/meta tags (and
    // here, the teaser's own data as an inline script - no second HTTP
    // round trip needed since the data's already in hand). A post that
    // isn't PUBLIC+PUBLISHED+level-gate-passed gets a 404 status - eligible
    // per Showcase.passesLevelGate(null, post): a viewer-less check, so a
    // level-gated post correctly gets no teaser at all (matches BATCH/
    // PENDING_REVIEW/REMOVED, all excluded the same way).
    //
    // The 404 status is for crawlers/anonymous visitors only - it does not
    // stop the page's own client script from running. A signed-in viewer
    // with real access (e.g. a batchmate opening a BATCH-visibility post
    // that has no public teaser) still gets the full authed view: showcase-
    // post.js always tries GET /api/showcase/posts/:id itself and upgrades
    // the page if that succeeds, regardless of what the server rendered.
    app.get('/showcase/p/:id', (req, res) => {
      let html = fs.readFileSync(path.join(__dirname, 'public', 'showcase-post.html'), 'utf8');
      const post = Showcase.postById(req.params.id);
      const eligible = !!(post && post.status === 'PUBLISHED' && post.visibility === 'PUBLIC' && Showcase.passesLevelGate(null, post));
      if (!eligible) return res.status(404).type('html').send(html);

      const hydrated = Showcase.hydratePost(post);
      const author = Users.byId(post.author_user_id);
      const gems = author ? totalGemsForStudent(author.id) : 0;
      const stage = stageFor(gems);
      const firstImage = hydrated.images[0];
      const ogImage = firstImage ? `${R2_PUBLIC_BASE}/${firstImage.r2_key}` : `${APP_URL}/img/og-image.png`;
      const title = `${author ? author.name : 'A student'} on the EchoLens Showcase`;
      const description = (post.caption || '').slice(0, 200) || `${author ? author.name : 'A student'}'s project on EchoLens Digital.`;
      const url = `${APP_URL}/showcase/p/${post.id}`;
      const head = `<title>${escA(title)}</title>
<meta name="description" content="${escA(description)}">
<link rel="canonical" href="${escA(url)}">
<meta property="og:type" content="article">
<meta property="og:site_name" content="EchoLens Digital">
<meta property="og:title" content="${escA(title)}">
<meta property="og:description" content="${escA(description)}">
<meta property="og:url" content="${escA(url)}">
<meta property="og:image" content="${escA(ogImage)}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="${escA(ogImage)}">`;
      html = html.replace('<title>EchoLens Showcase</title>', head);

      const teaser = {
        id: post.id,
        caption: post.caption,
        author: author ? { name: author.name } : null,
        stage: { key: stage.key, name: stage.name },
        gems,
        image: firstImage ? { url: `${R2_PUBLIC_BASE}/${firstImage.r2_key}`, width: firstImage.width, height: firstImage.height } : null,
      };
      // Escapes "</script>" so the JSON payload can never break out of this
      // inline script block - same technique talent.js's jsonLd() uses.
      html = html.replace('window.__SHOWCASE_TEASER__ = null;', `window.__SHOWCASE_TEASER__ = ${JSON.stringify(teaser).replace(/</g, '\\u003c')};`);
      res.type('html').send(html);
    });

    /* ------------------------------- feed / read ------------------------------- */
    router.get('/feed', authRequired, (req, res) => {
      res.json({ ...Showcase.feed(req.user, req.query.cursor ? String(req.query.cursor) : null), r2_base: R2_PUBLIC_BASE });
    });

    router.get('/posts/:id', authRequired, (req, res) => {
      const post = Showcase.getPost(req.user, req.params.id);
      if (!post) return res.status(404).json({ error: 'Post not found.' }); // also covers "exists but gated/hidden" - never confirms existence of content a viewer can't see
      res.json({ post, r2_base: R2_PUBLIC_BASE });
    });

    /* --------------------------------- create --------------------------------- */
    router.post('/posts', authRequired, limitCreatePost, upload.array('images', r2.MAX_IMAGES_PER_POST), async (req, res) => {
      const files = req.files || [];
      if (!files.length) return res.status(400).json({ error: 'At least one image is required.' });
      if (files.length > r2.MAX_IMAGES_PER_POST) return res.status(400).json({ error: `A post can have at most ${r2.MAX_IMAGES_PER_POST} images.` });
      if (!r2.enabled()) return res.status(503).json({ error: 'Image uploads are not configured yet.' });

      // Reserved synchronously, before any await - see
      // Showcase.reservePostId()'s own comment for why that ordering is
      // load-bearing (a concurrent request must never be able to consume
      // the same id before this one's images finish uploading).
      const reservedPostId = Showcase.reservePostId();

      let images;
      try {
        images = [];
        for (const f of files) images.push(await r2.processAndUploadImage({ buffer: f.buffer, postId: reservedPostId }));
      } catch (err) {
        return res.status(400).json({ error: err.message || 'Image upload failed.' });
      }

      const result = Showcase.createPost({
        author: req.user,
        caption: req.body.caption,
        visibility: req.body.visibility,
        batchId: req.body.batch_id,
        questSubmissionId: req.body.quest_submission_id ? Number(req.body.quest_submission_id) : null,
        images,
        reservedId: reservedPostId,
      });
      if (result.error) return res.status(400).json({ error: result.error });
      res.json({ post: Showcase.hydratePost(result), r2_base: R2_PUBLIC_BASE });
    });

    /* --------------------------------- delete --------------------------------- */
    // "author or staff" - staff here reuses Chat.remove's exact authority
    // (canManageBatch for that post's own batch, or admin), extended with
    // the author's own right to delete their own post. See store.js's
    // isStaffFor for why a batch-less post falls back to admin-only.
    router.delete('/posts/:id', authRequired, limitDeletePost, (req, res) => {
      const post = Showcase.postById(req.params.id);
      if (!post) return res.status(404).json({ error: 'Post not found.' });
      const isAuthor = post.author_user_id === req.user.id;
      const staff = req.user.role === 'admin' || (post.batch_id != null && canManageBatch(req.user, Batches.byId(post.batch_id)));
      if (!isAuthor && !staff) return res.status(403).json({ error: 'Only the author or course staff can delete this post.' });
      res.json({ post: Showcase.removePost(post, req.user, isAuthor ? null : 'Removed by staff.') });
    });

    router.delete('/comments/:id', authRequired, limitDeletePost, (req, res) => {
      const comment = Showcase.commentById(req.params.id);
      if (!comment) return res.status(404).json({ error: 'Comment not found.' });
      const post = Showcase.postById(comment.post_id);
      const isAuthor = comment.author_user_id === req.user.id;
      const staff = req.user.role === 'admin' || (post && post.batch_id != null && canManageBatch(req.user, Batches.byId(post.batch_id)));
      if (!isAuthor && !staff) return res.status(403).json({ error: 'Only the author or course staff can delete this comment.' });
      res.json({ comment: Showcase.removeComment(comment, req.user) });
    });

    /* ---------------------------------- likes ---------------------------------- */
    // Idempotent (constraint #1) - see store.js's like()/unlike() header
    // comment for why this is race-free without catching a constraint
    // violation, given this app's synchronous-write architecture.
    router.post('/posts/:id/like', authRequired, limitLike, (req, res) => {
      const result = Showcase.like(req.params.id, req.user.id);
      if (result.error) return res.status(404).json({ error: result.error });
      res.json({ post: Showcase.hydratePost(result) });
    });
    router.delete('/posts/:id/like', authRequired, limitLike, (req, res) => {
      const result = Showcase.unlike(req.params.id, req.user.id);
      if (result.error) return res.status(404).json({ error: result.error });
      res.json({ post: Showcase.hydratePost(result) });
    });

    /* -------------------------------- comments -------------------------------- */
    router.post('/posts/:id/comments', authRequired, limitComment, (req, res) => {
      const result = Showcase.addComment(req.params.id, req.user, (req.body || {}).body);
      if (result.error) return res.status(400).json({ error: result.error });
      const u = req.user;
      res.json({ comment: { id: result.id, body: result.body, created_at: result.created_at, author: { id: u.id, name: u.name, avatar: u.avatar } } });
    });

    /* --------------------------------- reports --------------------------------- */
    router.post('/report', authRequired, limitReport, (req, res) => {
      const b = req.body || {};
      const result = Showcase.report({ reporter: req.user, targetType: b.target_type, targetId: b.target_id, reason: b.reason });
      if (result.error) return res.status(400).json({ error: result.error });
      res.json({ report: result });
    });

    /* ------------------------------- moderation ------------------------------- */
    router.get('/moderation/queue', authRequired, teacherOrAdmin, (req, res) => {
      res.json({ ...Showcase.moderationQueue(req.user), r2_base: R2_PUBLIC_BASE });
    });
    router.post('/moderation/:id/action', authRequired, teacherOrAdmin, limitModeration, (req, res) => {
      const b = req.body || {};
      if (!['post', 'report'].includes(b.target_type)) return res.status(400).json({ error: 'target_type must be "post" or "report".' });
      if (!['approve', 'remove', 'dismiss'].includes(b.action)) return res.status(400).json({ error: 'Unknown action.' });
      const result = Showcase.moderationAction({ actor: req.user, targetType: b.target_type, id: req.params.id, action: b.action, reason: b.reason });
      if (result.error) return res.status(400).json({ error: result.error });
      res.json({ ok: true });
    });

    app.use('/api/showcase', router);
  },
};
