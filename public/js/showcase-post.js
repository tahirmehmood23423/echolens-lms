'use strict';

/* EchoLens LMS v20 - Showcase post page (/showcase/p/:id)
   Always renders window.__SHOWCASE_TEASER__ first if present (server-
   rendered, works with zero JS for crawlers/signed-out visitors), then
   always attempts the authed API regardless of whether a teaser was
   rendered - a signed-in viewer with real access (e.g. a batchmate on a
   BATCH-visibility post, which has no public teaser at all) still gets
   upgraded to the full view. See showcase.js's /showcase/p/:id route for
   why the server can 404 the teaser while this script still runs fine. */

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
async function api(path, opts = {}) {
  const isForm = opts.body instanceof FormData;
  const res = await fetch(path, { credentials: 'same-origin', headers: isForm ? {} : { 'Content-Type': 'application/json' }, ...opts });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}
function avatarHtml(url, name, size = 40) {
  return url ? `<span class="avatar av-sm" style="width:${size}px;height:${size}px"><img src="${esc(url)}" alt=""></span>`
    : `<span class="avatar av-sm" style="width:${size}px;height:${size}px">${esc((name || 'E').trim()[0].toUpperCase())}</span>`;
}
function timeAgo(nowStr) {
  const then = new Date(String(nowStr).replace(' ', 'T') + 'Z').getTime();
  const s = Math.max(0, Math.round((Date.now() - then) / 1000));
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 86400 * 7) return `${Math.floor(s / 86400)}d ago`;
  return new Date(then).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}
function heartIcon() { return `<svg viewBox="0 0 24 24" width="17" height="17" style="stroke:currentColor;fill:none;stroke-width:1.8;vertical-align:-3px"><path d="M12 21s-7.5-4.6-10-9.3C.4 8.1 2.3 4.5 6 4.5c2.1 0 3.6 1.1 6 3.4 2.4-2.3 3.9-3.4 6-3.4 3.7 0 5.6 3.6 4 7.2C19.5 16.4 12 21 12 21z"/></svg>`; }

const PARTS = location.pathname.split('/').filter(Boolean); // ['showcase', 'p', id]
const POST_ID = PARTS[2] || '';
const TEASER = window.__SHOWCASE_TEASER__;

function renderTeaser(t) {
  document.title = `${t.author ? t.author.name : 'A student'} on the EchoLens Showcase`;
  $('content').innerHTML = `
    ${t.image ? `<img class="sc-teaser-img" src="${esc(t.image.url)}" alt="">` : ''}
    <div style="display:flex;align-items:center;gap:12px;margin-top:4px">
      ${avatarHtml(null, t.author ? t.author.name : 'E')}
      <div>
        <div style="font-weight:700">${esc(t.author ? t.author.name : 'A student')}</div>
        <div style="margin-top:3px"><span class="stage-pill stage-${esc(t.stage.key)}">${esc(t.stage.name)} stage</span> <span class="s" style="color:var(--muted)">&middot; ${t.gems} gems</span></div>
      </div>
    </div>
    <div class="sc-caption" style="margin-top:14px">${esc(t.caption)}</div>
    <div class="sc-teaser-cta">
      <a class="btn btn-primary" href="/login">Sign in to see the full Showcase</a>
    </div>
    <div class="pub-foot">EchoLens Digital &middot; Innovate &middot; Educate &middot; Elevate</div>`;
}
function renderUnavailable() {
  $('content').innerHTML = `<div class="empty" style="padding:40px 10px">This post isn&rsquo;t available - it may be private to a cohort, still awaiting review, or removed.</div>
    <div class="sc-teaser-cta"><a class="btn btn-ghost" href="/login">Sign in</a></div>`;
}

function commentRow(c, canRemove) {
  return `<div class="sc-comment-row" data-comment="${c.id}">
    ${avatarHtml(c.author && c.author.avatar, c.author && c.author.name, 30)}
    <div style="flex:1;min-width:0">
      <div class="t">${esc(c.author ? c.author.name : 'Someone')} <span class="when">&middot; ${timeAgo(c.created_at)}</span></div>
      <div class="s">${esc(c.body)}</div>
      ${canRemove ? `<button class="rm-comment" onclick="removeComment(${c.id})">Delete</button>` : ''}
    </div>
  </div>`;
}

let ME = null;
let POST = null;

async function renderFull() {
  const { ok, status, data } = await api(`/api/showcase/posts/${POST_ID}`);
  if (!ok) {
    if (status === 401 && TEASER) return; // not signed in - the teaser (if any) already stands
    if (!TEASER) renderUnavailable();
    return;
  }
  POST = data.post;
  const r2Base = data.r2_base || '';
  document.title = `${POST.author ? POST.author.name : 'A student'} on the EchoLens Showcase`;

  const meRes = await api('/api/auth/me');
  ME = meRes.ok ? meRes.data : null;

  const images = (POST.images || []).map((im) => `${r2Base}/${im.r2_key}`);
  const gallery = images.length <= 1
    ? (images[0] ? `<img class="sc-teaser-img" src="${esc(images[0])}" alt="">` : '')
    : `<div class="sc-img-grid" style="border-radius:14px;overflow:hidden;margin:14px 0">${images.map((u) => `<img src="${esc(u)}" alt="">`).join('')}</div>`;

  const isAuthor = ME && POST.author && ME.id === POST.author.id;
  const canModerate = ME && ['admin', 'instructor'].includes(ME.role);
  const deleteBtn = (isAuthor || canModerate)
    ? `<button class="btn btn-ghost btn-sm" onclick="deletePost()">Delete post</button>` : '';

  $('card').style.maxWidth = '640px';
  $('content').innerHTML = `
    <div style="display:flex;align-items:center;gap:12px">
      ${avatarHtml(POST.author && POST.author.avatar, POST.author && POST.author.name)}
      <div style="flex:1">
        <div style="font-weight:700">${esc(POST.author ? POST.author.name : 'A student')}</div>
        <div class="s" style="color:var(--muted)">${timeAgo(POST.created_at)} &middot; ${POST.visibility === 'PUBLIC' ? 'Public' : 'Cohort'}</div>
      </div>
      <a class="btn btn-ghost btn-sm" href="/showcase">All posts</a>
    </div>
    ${gallery}
    <div class="sc-caption" style="margin-top:12px">${esc(POST.caption)}</div>
    <div class="sc-actions" style="padding-left:0;padding-right:0">
      <button class="sc-action-btn ${POST.viewer_has_liked ? 'liked' : ''}" id="likeBtn" onclick="toggleLike()">${heartIcon()}<span id="likeCount">${POST.like_count}</span></button>
      <button class="sc-action-btn" onclick="reportPost()">Report</button>
      <span class="sc-action-spacer"></span>
      ${deleteBtn}
    </div>
    <div id="comments" style="margin-top:8px">
      <div class="pub-sec">Comments</div>
      <div id="commentList">${(POST.comments || []).map((c) => commentRow(c, ME && (ME.id === (c.author && c.author.id) || canModerate))).join('') || '<div class="empty">No comments yet.</div>'}</div>
      ${ME ? `<div class="sc-comment-form"><textarea id="commentInput" placeholder="Add a comment&hellip;" maxlength="1000"></textarea><button class="btn btn-primary btn-sm" onclick="postComment()">Post</button></div>` : ''}
    </div>`;
}

async function toggleLike() {
  const btn = $('likeBtn');
  const liked = btn.classList.contains('liked');
  const { ok, data } = await api(`/api/showcase/posts/${POST_ID}/like`, { method: liked ? 'DELETE' : 'POST' });
  if (!ok) { alert(data.error || 'Sign in to like posts.'); return; }
  btn.classList.toggle('liked', !liked);
  $('likeCount').textContent = data.post.like_count;
}
async function postComment() {
  const el = $('commentInput');
  const body = el.value.trim();
  if (!body) return;
  const { ok, data } = await api(`/api/showcase/posts/${POST_ID}/comments`, { method: 'POST', body: JSON.stringify({ body }) });
  if (!ok) { alert(data.error || 'Could not post comment.'); return; }
  el.value = '';
  const list = $('commentList');
  if (list.querySelector('.empty')) list.innerHTML = '';
  list.insertAdjacentHTML('beforeend', commentRow(data.comment, true));
}
async function removeComment(id) {
  if (!confirm('Delete this comment?')) return;
  const { ok, data } = await api(`/api/showcase/comments/${id}`, { method: 'DELETE' });
  if (!ok) { alert(data.error || 'Could not delete comment.'); return; }
  const row = document.querySelector(`[data-comment="${id}"]`);
  if (row) row.remove();
}
async function deletePost() {
  if (!confirm('Delete this post? This cannot be undone.')) return;
  const { ok, data } = await api(`/api/showcase/posts/${POST_ID}`, { method: 'DELETE' });
  if (!ok) { alert(data.error || 'Could not delete post.'); return; }
  location.href = '/showcase';
}
async function reportPost() {
  const reason = prompt('What is wrong with this post?');
  if (!reason || !reason.trim()) return;
  const { ok, data } = await api('/api/showcase/report', { method: 'POST', body: JSON.stringify({ target_type: 'POST', target_id: Number(POST_ID), reason: reason.trim() }) });
  alert(ok ? 'Thank you - our team will review this.' : (data.error || 'Sign in to report a post.'));
}

(async () => {
  if (TEASER) renderTeaser(TEASER);
  else if (!POST_ID) { renderUnavailable(); return; }
  await renderFull();
})();
