'use strict';
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
async function api(path, opts = {}) {
  const res = await fetch(path, { credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, ...opts });
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
const REMOTE_LABELS = { remote: 'Remote', onsite: 'Onsite', hybrid: 'Hybrid' };
const AVAILABILITY_LABELS = { immediately: 'Immediately', within_month: 'Within a month', after_graduation: 'After graduation', not_looking: 'Not looking' };
const WORK_TYPE_LABELS = { internship: 'Internship', part_time: 'Part time', full_time: 'Full time', freelance: 'Freelance' };
function checkboxGroup(box, name, labels) {
  box.innerHTML = Object.entries(labels).map(([k, l]) => `<label style="display:flex;gap:6px;align-items:center;font-weight:400"><input type="checkbox" name="${name}" value="${k}" style="width:auto">${l}</label>`).join('');
}
checkboxGroup($('remoteBox'), 'remote', REMOTE_LABELS);
checkboxGroup($('availBox'), 'availability', AVAILABILITY_LABELS);
checkboxGroup($('workBox'), 'work_type', WORK_TYPE_LABELS);

let LAST_FILTERS = {};
let NEXT_CURSOR = null;

function currentFilters() {
  const f = $('searchForm');
  const checked = (name) => [...f.querySelectorAll(`input[name="${name}"]:checked`)].map((c) => c.value);
  return {
    q: f.q.value.trim(),
    skills_text: f.skills_text.value.trim(),
    skills_mode: f.skills_mode.value,
    city: f.city.value.trim(),
    min_gems: f.min_gems.value,
    courses: f.courses.value.trim(),
    certificates: f.certificates.value.trim(),
    grad_year_min: f.grad_year_min.value,
    grad_year_max: f.grad_year_max.value,
    remote: checked('remote'),
    availability: checked('availability'),
    work_type: checked('work_type'),
    has_verified_projects: f.has_verified_projects.checked,
  };
}
async function resolveSkillIds(text) {
  const names = text.split(',').map((s) => s.trim()).filter(Boolean);
  const ids = [];
  for (const n of names) {
    try { const d = await api('/api/talent/skills?q=' + encodeURIComponent(n)); const hit = d.skills.find((s) => s.name.toLowerCase() === n.toLowerCase()) || d.skills[0]; if (hit) ids.push(hit.id); }
    catch { /* skip unmatched skill text */ }
  }
  return ids;
}
function buildQuery(filters, skillIds, cursor) {
  const p = new URLSearchParams();
  if (filters.q) p.set('q', filters.q);
  if (skillIds.length) { p.set('skills', skillIds.join(',')); p.set('skills_mode', filters.skills_mode); }
  if (filters.city) p.set('city', filters.city);
  if (filters.min_gems) p.set('min_gems', filters.min_gems);
  if (filters.courses) p.set('courses', filters.courses);
  if (filters.certificates) p.set('certificates', filters.certificates);
  if (filters.grad_year_min) p.set('grad_year_min', filters.grad_year_min);
  if (filters.grad_year_max) p.set('grad_year_max', filters.grad_year_max);
  if (filters.remote.length) p.set('remote', filters.remote.join(','));
  if (filters.availability.length) p.set('availability', filters.availability.join(','));
  if (filters.work_type.length) p.set('work_type', filters.work_type.join(','));
  if (filters.has_verified_projects) p.set('has_verified_projects', 'true');
  if (cursor) p.set('cursor', cursor);
  return p.toString();
}
function resultCard(r) {
  return `<div class="card" style="margin-bottom:10px"><div class="card-body" style="display:flex;gap:14px;flex-wrap:wrap;align-items:center">
    <div style="width:52px;height:52px;border-radius:50%;background:var(--bg);border:1px solid var(--line);display:flex;align-items:center;justify-content:center;font-weight:700;overflow:hidden">
      ${r.avatar ? `<img src="${esc(r.avatar)}" alt="" style="width:100%;height:100%;object-fit:cover">` : esc((r.name || 'S')[0])}
    </div>
    <div style="flex:1;min-width:200px">
      <div style="font-weight:700">${esc(r.name)}${r.verified_badge_count ? ` <span class="s" style="color:var(--ok);font-weight:700">&middot; ${r.verified_badge_count} verified project${r.verified_badge_count > 1 ? 's' : ''}</span>` : ''}</div>
      <div class="s" style="color:var(--muted)">${esc(r.headline || '')}</div>
      <div class="s" style="color:var(--muted-2)">${esc(r.city || '')}${r.availability ? ' &middot; ' + esc(AVAILABILITY_LABELS[r.availability] || r.availability) : ''}${r.level ? ' &middot; Level ' + esc(r.level) : ''} &middot; ${r.gems || 0} gems</div>
      ${(r.skills || []).length ? `<div style="margin-top:6px">${r.skills.map((s) => `<span class="badge" style="margin-right:4px"><span class="bd"></span>${esc(s)}</span>`).join('')}</div>` : ''}
    </div>
    <div style="display:flex;gap:6px">
      ${(r.project_thumbnails || []).map((p) => `<img src="${esc(p.cover_image || '')}" alt="${esc(p.title)}" style="width:60px;height:44px;object-fit:cover;border-radius:6px;border:1px solid var(--line);background:var(--bg)">`).join('')}
    </div>
    <a class="btn btn-ghost btn-sm" href="/talent/${encodeURIComponent(r.handle)}" target="_blank" rel="noopener">View profile</a>
  </div></div>`;
}
async function runSearch(append) {
  const filters = currentFilters();
  LAST_FILTERS = filters;
  const skillIds = filters.skills_text ? await resolveSkillIds(filters.skills_text) : [];
  const qs = buildQuery(filters, skillIds, append ? NEXT_CURSOR : null);
  try {
    const d = await api('/api/talent/search?' + qs);
    NEXT_CURSOR = d.next_cursor;
    $('loadMoreBtn').style.display = NEXT_CURSOR ? '' : 'none';
    const html = d.results.map(resultCard).join('') || '<div class="empty">No matching profiles.</div>';
    $('results').innerHTML = append ? $('results').innerHTML + html : html;
  } catch (e) { toast(e.message, true); }
}
function loadMore() { runSearch(true); }
$('searchForm').addEventListener('submit', (e) => { e.preventDefault(); runSearch(false); });
async function saveThisSearch() {
  const name = prompt('Name this saved search:');
  if (!name || !name.trim()) return;
  const weekly = confirm('Email you weekly when new profiles match this search?');
  const filters = currentFilters();
  const skillIds = filters.skills_text ? await resolveSkillIds(filters.skills_text) : [];
  try {
    await api('/api/talent/saved-searches', { method: 'POST', body: JSON.stringify({ name: name.trim(), notify_weekly: weekly, filters: { ...filters, skills: skillIds } }) });
    toast('Search saved.');
  } catch (e) { toast(e.message, true); }
}

(async () => {
  try {
    const me = await api('/api/auth/me');
    if (me.role !== 'recruiter' || !me.recruiter || me.recruiter.status !== 'approved') { location.href = '/dashboard'; return; }
  } catch { return; }
  $('gate').style.display = 'none';
  $('app').style.display = '';
  runSearch(false);
})();
