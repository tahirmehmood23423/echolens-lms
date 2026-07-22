'use strict';
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function card(p) {
  return `<a href="/talent/${encodeURIComponent(p.handle)}/projects/${p.id}" style="text-decoration:none;color:inherit;display:block;border:1px solid var(--line);border-radius:14px;overflow:hidden;background:#fff">
    ${p.cover_image ? `<img src="${esc(p.cover_image)}" alt="" style="width:100%;height:150px;object-fit:cover;display:block">` : `<div style="width:100%;height:150px;background:var(--canvas)"></div>`}
    <div style="padding:12px 14px">
      <div style="font-weight:700;font-size:14.5px">${esc(p.title)}</div>
      <div class="s" style="color:var(--muted);margin-top:2px">${p.verified ? '<span style="color:var(--ok);font-weight:700">Verified by EchoLens</span>' : 'Self-added'}</div>
      ${(p.tech_stack || []).length ? `<div class="s" style="color:var(--muted-2);margin-top:6px">${esc(p.tech_stack.slice(0, 4).join(' &middot; '))}</div>` : ''}
    </div>
  </a>`;
}
async function load(q) {
  const grid = document.getElementById('grid');
  grid.innerHTML = '<div class="empty">Loading&hellip;</div>';
  try {
    const res = await fetch(`/api/talent/projects${q ? '?q=' + encodeURIComponent(q) : ''}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Could not load projects.');
    grid.innerHTML = data.projects.length
      ? `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:14px">${data.projects.map(card).join('')}</div>`
      : '<div class="empty">No projects match your search.</div>';
  } catch (e) {
    grid.innerHTML = `<div class="empty">${esc(e.message)}</div>`;
  }
}
let t = null;
document.getElementById('q').addEventListener('input', (e) => { clearTimeout(t); t = setTimeout(() => load(e.target.value.trim()), 250); });
load('');
