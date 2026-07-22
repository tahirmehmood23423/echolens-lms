'use strict';
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const MONTHS = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

(async () => {
  const parts = location.pathname.split('/').filter(Boolean); // ['talent', handle, 'projects', id]
  const handle = decodeURIComponent(parts[1] || '');
  const projectId = parts[3] || '';
  const card = document.getElementById('card');
  try {
    const res = await fetch(`/api/talent/profile/${encodeURIComponent(handle)}/projects/${encodeURIComponent(projectId)}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Project not found.');
    const p = data.project;
    document.title = `${p.title} - ${data.name} | EchoLens`;

    const completedLabel = p.completed_month && p.completed_year ? `${MONTHS[p.completed_month]} ${p.completed_year}` : (p.completed_year || '');
    const verifiedBox = p.verified ? `<div style="border:1.5px solid #0FBFA8;background:#0FBFA80d;border-radius:14px;padding:12px 16px;margin:14px 0">
      <div style="font-weight:700;color:var(--ok)">Verified by EchoLens</div>
      <div class="s" style="color:var(--muted);margin-top:4px">${esc(p.course_name || '')}${p.task_title ? ' &middot; ' + esc(p.task_title) : ''}${p.instructor_grade != null ? ' &middot; Graded ' + esc(p.instructor_grade) + '%' : ''}${p.submission_date ? ' &middot; ' + esc(String(p.submission_date).slice(0, 10)) : ''}</div>
    </div>` : '';

    const gallery = (p.gallery || []).length ? `<div class="pub-sec">Gallery</div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:10px">
        ${p.gallery.map((g) => `<a href="${esc(g)}" target="_blank" rel="noopener"><img src="${esc(g)}" alt="" style="width:100%;border-radius:10px;border:1px solid var(--line)"></a>`).join('')}
      </div>` : '';

    const links = [
      p.repo_url ? `<a class="btn btn-ghost btn-sm" href="${esc(p.repo_url)}" target="_blank" rel="noopener">Repository</a>` : '',
      p.demo_url ? `<a class="btn btn-primary btn-sm" href="${esc(p.demo_url)}" target="_blank" rel="noopener">Live demo</a>` : '',
    ].filter(Boolean).join(' ');

    card.innerHTML = `
      <a href="/talent/${encodeURIComponent(handle)}" class="s" style="color:var(--muted)">&larr; ${esc(data.name)}'s profile</a>
      ${p.cover_image ? `<img src="${esc(p.cover_image)}" alt="" style="width:100%;max-height:340px;object-fit:cover;border-radius:14px;margin:12px 0">` : ''}
      <h1 style="margin-top:6px">${esc(p.title)}</h1>
      ${p.summary ? `<div class="s" style="color:var(--muted);font-size:15px">${esc(p.summary)}</div>` : ''}
      <div class="s" style="color:var(--muted);margin-top:8px">${[p.role_played, p.team_size ? `Team of ${p.team_size}` : '', completedLabel].filter(Boolean).join(' &middot; ')}</div>
      ${(p.tech_stack || []).length ? `<div class="badge-grid" style="margin-top:10px">${p.tech_stack.map((t) => `<span class="badge"><span class="bd"></span>${esc(t)}</span>`).join('')}</div>` : ''}
      ${links ? `<div style="margin-top:12px;display:flex;gap:8px">${links}</div>` : ''}
      ${verifiedBox}
      ${p.description_html ? `<div class="pub-sec">About this project</div><div class="talent-md">${p.description_html}</div>` : ''}
      ${gallery}
      <div class="pub-foot">
        <button type="button" onclick="reportProject(${JSON.stringify(p.id)})" style="background:none;border:none;color:var(--muted-2);text-decoration:underline;cursor:pointer;font-size:12px">Report this project</button><br>
        EchoLens &middot; Empowering Pakistan through Artificial Intelligence
      </div>`;
  } catch (e) {
    card.innerHTML = `<div class="empty" style="padding:40px 10px">${esc(e.message)}</div>`;
  }
})();

async function reportProject(projectId) {
  const reason = prompt('What is wrong with this project? (you must be signed in)');
  if (!reason || !reason.trim()) return;
  try {
    const res = await fetch('/api/talent/reports', {
      credentials: 'same-origin', method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target_type: 'project', target_id: projectId, reason: reason.trim() }),
    });
    if (res.status === 401) { alert('Sign in to report a project.'); return; }
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Could not submit report.');
    alert('Thank you - our team will review this.');
  } catch (e) { alert(e.message); }
}
