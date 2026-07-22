'use strict';
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const REMOTE_LABELS = { remote: 'Remote', onsite: 'Onsite', hybrid: 'Hybrid' };
const AVAILABILITY_LABELS = { immediately: 'Immediately', within_month: 'Within a month', after_graduation: 'After graduation', not_looking: 'Not looking' };
const WORK_TYPE_LABELS = { internship: 'Internship', part_time: 'Part time', full_time: 'Full time', freelance: 'Freelance' };
const MONTHS = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function projectCard(handle, p) {
  return `<a href="/talent/${encodeURIComponent(handle)}/projects/${p.id}" style="text-decoration:none;color:inherit;display:block;border:1px solid var(--line);border-radius:14px;overflow:hidden;background:#fff">
    ${p.cover_image ? `<img src="${esc(p.cover_image)}" alt="" style="width:100%;height:140px;object-fit:cover;display:block">` : `<div style="width:100%;height:140px;background:var(--canvas)"></div>`}
    <div style="padding:12px 14px">
      <div style="font-weight:700;font-size:14.5px">${esc(p.title)}</div>
      <div class="s" style="color:var(--muted);margin-top:2px">${p.verified ? '<span style="color:var(--ok);font-weight:700">Verified by EchoLens</span>' : 'Self-added'}</div>
      ${(p.tech_stack || []).length ? `<div class="s" style="color:var(--muted-2);margin-top:6px">${esc(p.tech_stack.slice(0, 4).join(' &middot; '))}</div>` : ''}
    </div>
  </a>`;
}

(async () => {
  const handle = decodeURIComponent(location.pathname.split('/').filter(Boolean)[1] || '');
  const card = document.getElementById('card');
  try {
    const res = await fetch(`/api/talent/profile/${encodeURIComponent(handle)}`);
    const p = await res.json();
    if (!res.ok) throw new Error(p.error || 'Profile not found.');
    document.title = `${p.name} - EchoLens Talent Profile`;

    const v = p.verified || {};
    const courseRows = (v.courses || []).map((c) => `<div style="display:flex;justify-content:space-between;gap:10px;padding:6px 0;border-bottom:1px solid var(--line)">
      <span>${esc(c.title)}${c.completed ? ' <span class="s" style="color:var(--ok)">&middot; Completed</span>' : ''}</span>
      <span class="s" style="color:var(--muted)">${c.completion_pct != null ? c.completion_pct + '% avg grade' : ''}</span>
    </div>`).join('');
    const certRows = (v.certificates || []).map((c) => `<div style="padding:6px 0;border-bottom:1px solid var(--line)">
      <a href="${esc(c.verify_url)}" target="_blank" rel="noopener">${esc(c.title)}</a>
      <span class="s" style="color:var(--muted)"> &middot; ${esc(c.completion_date || '')}</span>
    </div>`).join('');

    const linkBtns = ['github', 'linkedin', 'website'].filter((k) => p.links && p.links[k])
      .map((k) => `<a class="btn btn-ghost btn-sm" href="${esc(p.links[k])}" target="_blank" rel="noopener">${k === 'github' ? 'GitHub' : k === 'linkedin' ? 'LinkedIn' : 'Website'}</a>`).join(' ');

    const eduHtml = (p.education || []).length ? `<div class="pub-sec">Education</div>
      ${p.education.map((e) => `<div style="padding:6px 0;border-bottom:1px solid var(--line)">
        <strong>${esc(e.school)}</strong>${e.degree ? ' &middot; ' + esc(e.degree) : ''}${e.field ? ' in ' + esc(e.field) : ''}
        <div class="s" style="color:var(--muted)">${esc(e.start_year || '')}${e.end_year ? ' - ' + esc(e.end_year) : ''}</div>
      </div>`).join('')}` : '';
    const expHtml = (p.experience || []).length ? `<div class="pub-sec">Experience</div>
      ${p.experience.map((e) => `<div style="padding:6px 0;border-bottom:1px solid var(--line)">
        <strong>${esc(e.role)}</strong>${e.company ? ' at ' + esc(e.company) : ''}
        <div class="s" style="color:var(--muted)">${esc(e.start_date || '')}${e.end_date ? ' - ' + esc(e.end_date) : ''}</div>
        ${e.description ? `<div class="s" style="margin-top:2px">${esc(e.description)}</div>` : ''}
      </div>`).join('')}` : '';

    const verifiedProjects = (p.projects || []).filter((x) => x.verified);
    const otherProjects = (p.projects || []).filter((x) => !x.verified);

    card.innerHTML = `
      <div class="pub-head">
        <div>
          <h1>${esc(p.name)}</h1>
          ${p.headline ? `<div class="s" style="color:var(--muted);font-size:15px;margin-top:2px">${esc(p.headline)}</div>` : ''}
          <div class="s" style="color:var(--muted);margin-top:6px">
            ${p.city ? esc(p.city) : ''}${p.remote_pref ? ' &middot; ' + esc(REMOTE_LABELS[p.remote_pref] || p.remote_pref) : ''}
            ${p.availability ? ' &middot; ' + esc(AVAILABILITY_LABELS[p.availability] || p.availability) : ''}
          </div>
          ${(p.work_type || []).length ? `<div style="margin-top:8px">${p.work_type.map((w) => `<span class="badge" style="margin-right:6px"><span class="bd"></span>${esc(WORK_TYPE_LABELS[w] || w)}</span>`).join('')}</div>` : ''}
        </div>
      </div>
      ${p.about ? `<div class="pub-sec">About</div><p>${esc(p.about)}</p>` : ''}
      ${(p.skills || []).length ? `<div class="pub-sec">Skills</div><div class="badge-grid">${p.skills.map((s) => `<span class="badge"><span class="bd"></span>${esc(s)}</span>`).join('')}</div>` : ''}
      ${linkBtns ? `<div class="pub-sec">Links</div><div style="display:flex;gap:8px;flex-wrap:wrap">${linkBtns}</div>` : ''}
      <div class="pub-sec">Verified by EchoLens</div>
      <div style="border:1.5px solid #0FBFA8;background:#0FBFA80d;border-radius:14px;padding:14px 16px">
        <div class="pub-stats" style="margin:0 0 10px">
          <div class="pub-stat"><div class="n">${v.level ? esc(v.level.name) : '-'}</div><div class="l">Level</div></div>
          <div class="pub-stat"><div class="n">${v.gems ?? 0}</div><div class="l">Gems</div></div>
          <div class="pub-stat"><div class="n">${(v.certificates || []).length}</div><div class="l">Certificates</div></div>
        </div>
        ${courseRows ? `<div class="s" style="font-weight:700;margin:10px 0 4px">Courses completed</div>${courseRows}` : ''}
        ${certRows ? `<div class="s" style="font-weight:700;margin:10px 0 4px">Certificates</div>${certRows}` : ''}
      </div>
      ${eduHtml}${expHtml}
      ${(p.projects || []).length ? `<div class="pub-sec">Projects</div>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px">
          ${verifiedProjects.map((x) => projectCard(p.handle, x)).join('')}
          ${otherProjects.map((x) => projectCard(p.handle, x)).join('')}
        </div>` : ''}
      <div id="contactBox"></div>
      <div class="pub-foot">
        <button type="button" onclick="reportProfile(${JSON.stringify(p.user_id)})" style="background:none;border:none;color:var(--muted-2);text-decoration:underline;cursor:pointer;font-size:12px">Report this profile</button><br>
        EchoLens &middot; Empowering Pakistan through Artificial Intelligence
      </div>`;
    wireContactRequest(handle);
  } catch (e) {
    card.innerHTML = `<div class="empty" style="padding:40px 10px">${esc(e.message)}</div>`;
  }
})();

// Only ever shown to a signed-in, approved recruiter - checked server
// side too on the actual POST, this is purely to decide whether to show
// the button at all.
async function wireContactRequest(handle) {
  const box = document.getElementById('contactBox');
  let me;
  try { me = await (await fetch('/api/auth/me', { credentials: 'same-origin' })).json(); } catch { return; }
  if (!me || me.role !== 'recruiter' || !me.recruiter || me.recruiter.status !== 'approved') return;
  box.innerHTML = `<div class="pub-sec">Contact</div>
    <button class="btn btn-primary btn-sm" id="reqContactBtn">Request contact</button>
    <form id="reqContactForm" style="display:none;margin-top:10px">
      <label class="field"><span>Message (state your role and company)</span><textarea name="message" rows="3" required placeholder="e.g. Hiring Manager at Acme Corp, we have a frontend internship that matches your profile."></textarea></label>
      <button class="btn btn-primary btn-sm" type="submit">Send request</button>
      <div class="form-msg" id="reqMsg"></div>
    </form>`;
  document.getElementById('reqContactBtn').addEventListener('click', () => {
    document.getElementById('reqContactBtn').style.display = 'none';
    document.getElementById('reqContactForm').style.display = '';
  });
  document.getElementById('reqContactForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = e.target; const btn = f.querySelector('button'); btn.disabled = true;
    const msgEl = document.getElementById('reqMsg');
    try {
      const res = await fetch(`/api/talent/profile/${encodeURIComponent(handle)}/contact-request`, {
        credentials: 'same-origin', method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: f.message.value.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not send request.');
      msgEl.className = 'form-msg ok'; msgEl.textContent = 'Request sent. You will be notified if the student accepts.';
      f.querySelector('button').remove();
    } catch (err) { msgEl.className = 'form-msg err'; msgEl.textContent = err.message; btn.disabled = false; }
  });
}

async function reportProfile(userId) {
  const reason = prompt('What is wrong with this profile? (you must be signed in)');
  if (!reason || !reason.trim()) return;
  try {
    const res = await fetch('/api/talent/reports', {
      credentials: 'same-origin', method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target_type: 'profile', target_id: userId, reason: reason.trim() }),
    });
    if (res.status === 401) { alert('Sign in to report a profile.'); return; }
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Could not submit report.');
    alert('Thank you - our team will review this.');
  } catch (e) { alert(e.message); }
}
