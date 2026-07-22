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
function showTab(tab) {
  $('tab-requests').style.display = tab === 'requests' ? '' : 'none';
  $('tab-shortlists').style.display = tab === 'shortlists' ? '' : 'none';
  $('tabRequestsBtn').className = 'btn btn-sm ' + (tab === 'requests' ? 'btn-primary' : 'btn-ghost');
  $('tabShortlistsBtn').className = 'btn btn-sm ' + (tab === 'shortlists' ? 'btn-primary' : 'btn-ghost');
  if (tab === 'requests') renderRequests(); else renderShortlists();
}

async function renderRequests() {
  const box = $('tab-requests');
  box.innerHTML = '<div class="empty">Loading&hellip;</div>';
  const d = await api('/api/talent/recruiter/contact-requests');
  box.innerHTML = d.requests.length ? d.requests.map(requestRow).join('') : '<div class="empty">No contact requests sent yet - find candidates from Talent Search.</div>';
}
function requestRow(r) {
  const statusColor = r.status === 'accepted' ? 'var(--ok)' : r.status === 'declined' ? 'var(--danger)' : 'var(--muted)';
  return `<div class="card" style="margin-bottom:10px"><div class="card-body">
    <div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap">
      <div><strong>${esc(r.student_name)}</strong> ${r.handle ? `<a class="s" href="/talent/${encodeURIComponent(r.handle)}" target="_blank" rel="noopener">View profile</a>` : ''}</div>
      <span class="s" style="color:${statusColor};font-weight:700;text-transform:capitalize">${esc(r.status)}</span>
    </div>
    <div class="s" style="color:var(--muted);margin-top:4px">${esc(r.message)}</div>
    ${r.status === 'accepted' ? `<div id="detail-${r.id}" style="margin-top:10px"><button class="btn btn-ghost btn-sm" onclick="openRequestDetail(${r.id})">View contact details &amp; message</button></div>` : ''}
  </div></div>`;
}
async function openRequestDetail(id) {
  const box = $('detail-' + id);
  box.innerHTML = '<div class="empty">Loading&hellip;</div>';
  const d = await api(`/api/talent/recruiter/contact-requests/${id}`);
  const msgs = await api(`/api/talent/contact-requests/${id}/messages`);
  box.innerHTML = `
    <div class="s"><strong>Email:</strong> ${esc(d.email || '-')}</div>
    <div class="s"><strong>Phone:</strong> ${esc(d.phone || '-')}</div>
    ${d.has_resume ? `<a class="btn btn-ghost btn-sm" href="/api/talent/recruiter/contact-requests/${id}/resume" target="_blank" rel="noopener">Download resume</a>` : ''}
    <div class="pub-sec" style="margin-top:10px">Messages</div>
    <div id="msgs-${id}" style="max-height:220px;overflow:auto;border:1px solid var(--line);border-radius:8px;padding:8px;margin-bottom:8px">
      ${msgs.messages.length ? msgs.messages.map((m) => `<div style="margin-bottom:6px"><strong>${m.sender_role === 'recruiter' ? 'You' : esc(d.student_name)}:</strong> ${esc(m.body)}</div>`).join('') : '<div class="s" style="color:var(--muted)">No messages yet.</div>'}
    </div>
    <form onsubmit="return sendMessage(event, ${id})" style="display:flex;gap:8px">
      <input name="body" placeholder="Write a message" style="flex:1" required>
      <button class="btn btn-primary btn-sm" type="submit">Send</button>
    </form>`;
}
async function sendMessage(e, id) {
  e.preventDefault();
  const f = e.target;
  try {
    await api(`/api/talent/contact-requests/${id}/messages`, { method: 'POST', body: JSON.stringify({ body: f.body.value.trim() }) });
    f.body.value = '';
    openRequestDetail(id);
  } catch (err) { toast(err.message, true); }
  return false;
}

let SHORTLISTS = [];
async function renderShortlists() {
  const box = $('tab-shortlists');
  box.innerHTML = '<div class="empty">Loading&hellip;</div>';
  const d = await api('/api/talent/shortlists');
  SHORTLISTS = d.shortlists;
  box.innerHTML = `
    <div class="card" style="margin-bottom:12px"><div class="card-body" style="display:flex;gap:8px;align-items:center">
      <input id="newShortlistName" placeholder="New shortlist name" style="flex:1">
      <button class="btn btn-primary btn-sm" onclick="createShortlist()">Create</button>
    </div></div>
    ${SHORTLISTS.length ? SHORTLISTS.map(shortlistCard).join('') : '<div class="empty">No shortlists yet.</div>'}`;
}
function shortlistCard(s) {
  return `<div class="card" style="margin-bottom:12px"><div class="card-body">
    <div style="display:flex;justify-content:space-between;align-items:center">
      <h3 style="margin:0">${esc(s.name)}</h3>
      <div style="display:flex;gap:8px">
        <a class="btn btn-ghost btn-sm" href="/api/talent/shortlists/${s.id}/export.csv">Export CSV</a>
        <button class="btn btn-danger btn-sm" onclick="deleteShortlist(${s.id})">Delete</button>
      </div>
    </div>
    <div style="display:flex;gap:8px;margin:10px 0">
      <input id="addHandle-${s.id}" placeholder="Student handle">
      <input id="addNote-${s.id}" placeholder="Note (optional)" style="flex:1">
      <button class="btn btn-primary btn-sm" onclick="addCandidate(${s.id})">Add</button>
    </div>
    ${s.candidates.length ? s.candidates.map((c) => `<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid var(--line)">
      <div><a href="/talent/${encodeURIComponent(c.handle || '')}" target="_blank" rel="noopener">${esc(c.name)}</a> ${c.note ? `<span class="s" style="color:var(--muted)"> - ${esc(c.note)}</span>` : ''}</div>
      <button class="btn btn-ghost btn-sm" onclick="removeCandidate(${s.id},${c.student_id})">Remove</button>
    </div>`).join('') : '<div class="s" style="color:var(--muted)">No candidates yet.</div>'}
  </div></div>`;
}
async function createShortlist() {
  const name = $('newShortlistName').value.trim();
  if (!name) return;
  try { await api('/api/talent/shortlists', { method: 'POST', body: JSON.stringify({ name }) }); renderShortlists(); }
  catch (e) { toast(e.message, true); }
}
async function deleteShortlist(id) {
  if (!confirm('Delete this shortlist?')) return;
  try { await api(`/api/talent/shortlists/${id}`, { method: 'DELETE' }); renderShortlists(); }
  catch (e) { toast(e.message, true); }
}
async function addCandidate(id) {
  const handle = $(`addHandle-${id}`).value.trim();
  const note = $(`addNote-${id}`).value.trim();
  if (!handle) return;
  try { await api(`/api/talent/shortlists/${id}/candidates`, { method: 'POST', body: JSON.stringify({ handle, note }) }); renderShortlists(); }
  catch (e) { toast(e.message, true); }
}
async function removeCandidate(id, studentId) {
  try { await api(`/api/talent/shortlists/${id}/candidates/${studentId}`, { method: 'DELETE' }); renderShortlists(); }
  catch (e) { toast(e.message, true); }
}

(async () => {
  try {
    const me = await api('/api/auth/me');
    if (me.role !== 'recruiter' || !me.recruiter || me.recruiter.status !== 'approved') { location.href = '/dashboard'; return; }
  } catch { return; }
  $('gate').style.display = 'none';
  $('app').style.display = '';
  showTab('requests');
})();
