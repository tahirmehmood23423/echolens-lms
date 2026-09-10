'use strict';
// Resolve a file's purpose from its persisted reference. Unknown/orphaned
// files are never shared. Resume and talent-media access use their own routes.
function uploadKey(value, directory = '') {
  if (typeof value !== 'string' || !value) return null;
  let key = value.split(/[?#]/)[0];
  try { key = decodeURIComponent(key); } catch { return null; }
  if (key.includes('\\') || key.includes('\0') || /^[a-z]+:/i.test(key)) return null;
  if (key.startsWith('/uploads/')) key = key.slice(9);
  else if (key.startsWith('/')) return null;
  else if (directory && !key.includes('/')) key = directory + '/' + key;
  if (key.split('/').some(part => !part || part === '.' || part === '..')) return null;
  return key;
}
function canAccessUpload(user, requested, data) {
  const key = uploadKey(requested);
  if (!key || key.startsWith('resumes/') || key.startsWith('talent-projects/')) return false;
  const list = name => data[name] || [];
  const matches = (value, dir) => uploadKey(value, dir) === key;
  const uid = user && Number(user.id), role = user && user.role;
  const admin = role === 'admin', hr = admin || role === 'hr';
  const enrolled = batchId => list('enrollments').some(e => Number(e.user_id) === uid && Number(e.batch_id) === Number(batchId));
  const manages = batchId => admin || list('batches').some(b => Number(b.id) === Number(batchId) && role === 'instructor' && (b.instructor_ids || []).includes(uid));
  const course = batchId => !!user && (manages(batchId) || role === 'coordinator' || enrolled(batchId));
  const submission = (owner, batchId) => !!user && (admin || Number(owner) === uid || !!(batchId && (manages(batchId) || role === 'coordinator')));
  const department = id => hr || list('departments').some(d => Number(d.id) === Number(id) && Number(d.head_user_id) === uid);
  const questBatch = id => list('quests').find(q => Number(q.id) === Number(id))?.batch_id;
  // Evaluate private references before intentionally shareable references.
  for (const c of list('contracts')) {
    if (matches(c.pdf_filename, 'contracts') || matches(c.offer_letter_filename, 'contracts') || matches(c.submission_zip_filename)) return !!user && (hr || Number(c.user_id) === uid);
  }
  for (const u of list('users')) {
    if (matches(u.signature) || ['degree_files','transcript_files','certification_files'].some(k => (u.profile?.[k] || []).some(f => matches(f.filename)))) return !!user && (hr || Number(u.id) === uid);
  }
  for (const e of list('event_entries')) if (matches(e.payment_shot)) return !!user && (admin || Number(e.user_id) === uid);
  for (const s of list('quest_submissions')) if (matches(s.file_url)) return submission(s.user_id, questBatch(s.quest_id));
  for (const s of list('submissions')) if (matches(s.file_url)) return submission(s.user_id, list('assignments').find(a => a.id === s.assignment_id)?.batch_id);
  for (const collection of ['event_submissions','open_submissions','open_attempts']) for (const entry of list(collection)) {
    const s = entry.payload ? { ...entry.payload, user_id:entry.user_id } : entry.data || entry;
    if (matches(s.file_url) || (s.files || []).some(f => matches(f.url))) return submission(s.user_id);
  }
  for (const s of list('department_task_status')) if (matches(s.proof_attachment?.filename)) return !!user && (Number(s.user_id) === uid || department(list('department_tasks').find(t => t.id === s.task_id)?.department_id));
  for (const t of list('department_tasks')) if (matches(t.attachment?.filename)) return !!user && (department(t.department_id) || list('department_task_status').some(s => s.task_id === t.id && Number(s.user_id) === uid));
  for (const r of list('ambassador_reports')) if (matches(r.filename, 'ambassador-reports')) return !!user && (['admin','hr','finance','student_coordinator'].includes(role) || list('ambassadors').some(a => a.id === r.ambassador_id && Number(a.user_id) === uid && a.active));
  for (const l of list('lessons')) if (matches(l.url)) return course(l.batch_id);
  for (const f of list('task_files')) if (matches(f.url)) return course(questBatch(f.quest_id));
  // Public event material is explicitly published by an open event. Paid
  // materials require a confirmed registration; closed events are staff-only.
  for (const e of list('events')) if (matches(e.dataset_url) || (e.files || []).some(f => matches(f.url))) {
    if (admin) return true;
    if (!e.open) return false;
    if (e.entry !== 'paid' && ['both','open'].includes(e.scope)) return true;
    return !!user && list('event_entries').some(r => r.event_id === e.id && Number(r.user_id) === uid && (e.entry !== 'paid' || r.payment_status === 'confirmed'));
  }
  // Avatar sharing remains limited to authenticated product surfaces.
  if (list('users').some(u => matches(u.avatar))) return !!user;
  return false;
}
module.exports = { uploadKey, canAccessUpload };
