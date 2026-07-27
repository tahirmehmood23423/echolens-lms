'use strict';

/* EchoLens LMS v20 - Showcase Feed (authed feed page, /showcase)
   No polling anywhere in this file - the feed loads once on mount, and a
   "new posts" pill is offered only in response to real signals (the tab
   regaining focus/visibility), never a setInterval loop. */

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
async function api(path, opts = {}) {
  const isForm = opts.body instanceof FormData;
  const res = await fetch(path, { credentials: 'same-origin', headers: isForm ? {} : { 'Content-Type': 'application/json' }, ...opts });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401) { location.href = '/login'; throw new Error('Signed out.'); }
  if (!res.ok) throw new Error(data.error || 'Something went wrong.');
  return data;
}
function toast(text, isErr) {
  const t = $('toast');
  t.textContent = text; t.className = 'toast show' + (isErr ? ' err' : '');
  clearTimeout(t._h); t._h = setTimeout(() => (t.className = 'toast'), 2600);
}
function timeAgo(nowStr) {
  // now()-format "YYYY-MM-DD HH:MM:SS", stored/served as UTC (see store.js's DATE-TYPE CONVENTION).
  const then = new Date(String(nowStr).replace(' ', 'T') + 'Z').getTime();
  const s = Math.max(0, Math.round((Date.now() - then) / 1000));
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 86400 * 7) return `${Math.floor(s / 86400)}d ago`;
  return new Date(then).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}
function avatarHtml(url, name, size = 36) {
  return url ? `<span class="avatar av-sm" style="width:${size}px;height:${size}px"><img src="${esc(url)}" alt=""></span>`
    : `<span class="avatar av-sm" style="width:${size}px;height:${size}px">${esc((name || 'E').trim()[0].toUpperCase())}</span>`;
}
function stagePill(stageKey) {
  const NAMES = { spark: 'Spark', glow: 'Glow', beam: 'Beam', prism: 'Prism', aurora: 'Aurora', nova: 'Nova' };
  return `<span class="stage-pill stage-${esc(stageKey)}" style="padding:2px 9px;font-size:10.5px">${NAMES[stageKey] || stageKey}</span>`;
}
function heartIcon() { return `<svg viewBox="0 0 24 24"><path d="M12 21s-7.5-4.6-10-9.3C.4 8.1 2.3 4.5 6 4.5c2.1 0 3.6 1.1 6 3.4 2.4-2.3 3.9-3.4 6-3.4 3.7 0 5.6 3.6 4 7.2C19.5 16.4 12 21 12 21z"/></svg>`; }
function commentIcon() { return `<svg viewBox="0 0 24 24"><path d="M21 11.5a8.4 8.4 0 0 1-8.9 8.4 9 9 0 0 1-3.5-.6L3 21l1.8-5.4A8.4 8.4 0 0 1 4 11.5 8.4 8.4 0 0 1 12.5 3 8.4 8.4 0 0 1 21 11.5z"/></svg>`; }

/* --------------------------------- state --------------------------------- */
let ME = null;
let NEXT_CURSOR = null;
let NEWEST_SEEN_ID = null; // for the "new posts" pill check on visibility/focus
let R2_BASE = ''; // set from the feed API's own r2_base field (see imgSrc) - Postgres only ever stores the key, never a full URL

/* --------------------------------- feed --------------------------------- */
function postCard(p) {
  const images = p.images || [];
  const imgHtml = images.length <= 1
    ? (images[0] ? `<div class="sc-img-wrap"><img src="${esc(imgSrc(images[0]))}" alt="" loading="lazy"></div>` : '')
    : `<div class="sc-img-grid">${images.slice(0, 4).map((im) => `<img src="${esc(imgSrc(im))}" alt="" loading="lazy">`).join('')}</div>`;
  const author = p.author || { name: 'A student', stage: 'spark' };
  return `<div class="sc-card" data-post="${p.id}">
    <div class="sc-card-head">
      ${avatarHtml(author.avatar, author.name)}
      <div class="who">
        <div class="name">${esc(author.name)} ${stagePill(author.stage)}</div>
        <div class="when">${timeAgo(p.created_at)} &middot; <span class="sc-visibility-tag">${p.visibility === 'PUBLIC' ? 'Public' : 'Cohort'}</span></div>
      </div>
    </div>
    <a href="/showcase/p/${p.id}" style="text-decoration:none;color:inherit">
      ${imgHtml}
      <div class="sc-card-body"><div class="sc-caption">${esc(p.caption)}</div></div>
    </a>
    <div class="sc-actions">
      <button class="sc-action-btn ${p.viewer_has_liked ? 'liked' : ''}" onclick="toggleLike(${p.id}, this)">${heartIcon()}<span class="cnt">${p.like_count}</span></button>
      <a class="sc-action-btn" href="/showcase/p/${p.id}#comments" style="text-decoration:none">${commentIcon()}<span class="cnt">${p.comment_count}</span></a>
      <span class="sc-action-spacer"></span>
      <button class="sc-action-btn" onclick="reportPost(${p.id})">Report</button>
    </div>
  </div>`;
}
// The r2Key/thumbKey columns are all Postgres ever stores (constraint:
// never a full public URL) - this is the one place a browsable <img src>
// gets built from one, using thumbKey for feed thumbnails (never
// re-derived from r2Key - see r2-upload.js). R2_BASE comes from the feed
// API's own response, not a page-injected global (this page is a plain
// static file, no server-side templating).
function imgSrc(image) { return R2_BASE + '/' + (image.thumb_key || image.r2_key); }

async function loadFeed(reset) {
  const feedEl = $('feed');
  if (reset) { feedEl.innerHTML = '<div class="empty">Loading&hellip;</div>'; NEXT_CURSOR = null; }
  try {
    const d = await api('/api/showcase/feed' + (NEXT_CURSOR ? '?cursor=' + encodeURIComponent(NEXT_CURSOR) : ''));
    R2_BASE = d.r2_base || R2_BASE;
    if (reset || feedEl.querySelector('.empty')) feedEl.innerHTML = '';
    if (!d.posts.length && reset) feedEl.innerHTML = '<div class="empty">No posts yet. Be the first to share your work.</div>';
    else feedEl.insertAdjacentHTML('beforeend', d.posts.map(postCard).join(''));
    NEXT_CURSOR = d.next_cursor;
    $('loadMoreBtn').style.display = NEXT_CURSOR ? '' : 'none';
    if (reset && d.posts.length) NEWEST_SEEN_ID = d.posts[0].id;
  } catch (e) {
    if (reset) feedEl.innerHTML = `<div class="empty">${esc(e.message)}</div>`;
    else toast(e.message, true);
  }
}
$('loadMoreBtn').addEventListener('click', () => loadFeed(false));

/** Event-driven only (tab focus/visibility) - never a timer. Checks the newest post id against what's already on screen and offers a pill instead of silently reflowing the feed under the reader. */
async function checkForNewPosts() {
  if (!NEWEST_SEEN_ID) return;
  try {
    const d = await api('/api/showcase/feed');
    if (d.posts.length && d.posts[0].id !== NEWEST_SEEN_ID) $('newPill').classList.add('show');
  } catch { /* silent - this is a background courtesy check, not a user action */ }
}
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') checkForNewPosts(); });
window.addEventListener('focus', checkForNewPosts);
$('newPill').addEventListener('click', () => { $('newPill').classList.remove('show'); loadFeed(true); });

async function toggleLike(id, btn) {
  const liked = btn.classList.contains('liked');
  const cntEl = btn.querySelector('.cnt');
  try {
    const d = liked ? await api(`/api/showcase/posts/${id}/like`, { method: 'DELETE' }) : await api(`/api/showcase/posts/${id}/like`, { method: 'POST' });
    btn.classList.toggle('liked', !liked);
    cntEl.textContent = d.post.like_count;
  } catch (e) { toast(e.message, true); }
}
async function reportPost(id) {
  const reason = prompt('What is wrong with this post?');
  if (!reason || !reason.trim()) return;
  try {
    await api('/api/showcase/report', { method: 'POST', body: JSON.stringify({ target_type: 'POST', target_id: id, reason: reason.trim() }) });
    toast('Thank you - our team will review this.');
  } catch (e) { toast(e.message, true); }
}

/* -------------------------------- composer -------------------------------- */
// Shared component (public/js/showcase-composer.js) - also mounted on the
// quest task workspace for the one-tap share hook (see dashboard.js). This
// page never builds its own modal; it only calls ShowcaseComposer.open().
function openComposer(questSubmissionId) {
  ShowcaseComposer.open({
    questSubmissionId: questSubmissionId || null,
    onPublished(post) {
      toast(post.status === 'PENDING_REVIEW' ? 'Posted - waiting for a quick review before it goes live.' : 'Posted to your showcase!');
      loadFeed(true);
    },
  });
}
$('composeBtn').addEventListener('click', () => openComposer());

/* --------------------------------- boot --------------------------------- */
(async () => {
  try {
    ME = await api('/api/auth/me');
    const qs = new URLSearchParams(location.search);
    await loadFeed(true);
    if (qs.get('compose') === '1') openComposer(qs.get('quest_submission_id') ? Number(qs.get('quest_submission_id')) : null);
  } catch (e) {
    $('gate').innerHTML = `<div class="empty">${esc(e.message)}</div>`;
    return;
  }
  $('gate').style.display = 'none';
  $('app').style.display = '';
})();
