'use strict';
(function () {
  function projectCard(project, escapeHtml, schedule) {
    if (!project) return '';
    const e = escapeHtml;
    if (project.locked) return `<div class="shiplens-project" style="padding:16px;border:1px solid var(--line);border-radius:12px;background:var(--bg,#f7f8fc)">
      <span style="font-size:11px;font-weight:700;text-transform:uppercase;color:var(--primary)">${e(project.difficulty || 'Project')} level</span>
      <h3 style="margin:6px 0">${e(project.title || 'ShipLens project')}</h3>
      <p style="margin:0;line-height:1.6">The full project brief and visual reference open ${schedule?.task_opens_at ? 'on ' + e(String(schedule.task_opens_at).replace('T', ' ')) : 'when the task window starts'}.</p>
    </div>`;
    const block = (label, value) => value ? `<div style="padding:12px;border:1px solid var(--line);border-radius:10px;background:var(--card,#fff)"><strong>${label}</strong><p style="white-space:pre-line;margin:6px 0 0;line-height:1.6">${e(value)}</p></div>` : '';
    return `<div class="shiplens-project" style="display:grid;gap:10px;margin:12px 0">
      <div style="padding:14px;border-radius:12px;background:linear-gradient(135deg,#17264b,#4f46e5);color:white">
        <span style="font-size:11px;text-transform:uppercase;letter-spacing:.12em;opacity:.8">${e(project.difficulty || 'Project')} level</span>
        <h3 style="margin:5px 0;color:white">${e(project.title || 'ShipLens project')}</h3>
        <p style="white-space:pre-line;line-height:1.6;margin:0;color:#fff">${e(project.description || '')}</p>
      </div>
      ${project.visual_url ? `<figure style="margin:0;border:1px solid var(--line);border-radius:12px;overflow:hidden"><img src="${e(project.visual_url)}" alt="Visual reference for ${e(project.title || 'ShipLens project')}" loading="lazy" style="display:block;width:100%;max-height:360px;object-fit:contain;background:#f8fafc"><figcaption style="padding:8px 12px;font-size:12px">Visual reference supplied by the competition organizer</figcaption></figure>` : ''}
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:10px">
        ${block('Goal', project.objective)}${block('What to deliver', project.deliverables)}${block('How it is judged', project.acceptance_criteria)}
      </div>
      <div style="padding:10px 12px;border-radius:10px;background:var(--bg,#f7f8fc);font-size:12px">Read the brief → Build your project → Deploy it → Submit GitHub and live links</div>
    </div>`;
  }
  function fields(ev, escapeHtml, user) {
    const e = escapeHtml;
    const profile = user?.profile || {};
    const member = (prefix, label, values = {}) => `
      <fieldset style="border:1px solid var(--line);border-radius:10px;padding:12px;margin:10px 0"><legend style="font-weight:700">${label}</legend>
        <label class="field"><span>Full name</span><input name="${prefix}_name" value="${e(values.name || '')}" required maxlength="120"></label>
        <label class="field"><span>Email</span><input name="${prefix}_email" type="email" value="${e(values.email || '')}" required maxlength="200" ${prefix === 'lead' ? 'readonly' : ''}></label>
        <label class="field"><span>WhatsApp number</span><input name="${prefix}_whatsapp" type="tel" value="${e(values.whatsapp || '')}" required maxlength="40"></label>
        <label class="field"><span>University</span><input name="${prefix}_university" value="${e(values.university || '')}" required maxlength="160"></label>
        <label class="field"><span>Year of study</span><input name="${prefix}_year" value="${e(values.year || '')}" required maxlength="40" placeholder="e.g. 2nd year"></label>
      </fieldset>`;
    return `<p class="hint">This series has one detailed project. One challan covers a team of one or two. Finance confirms payment before submissions open.</p>
      ${projectCard((ev.problems || [])[0], e, ev.shiplens_schedule)}
      <input type="hidden" name="challenge_pid" value="${(ev.problems || [])[0]?.pid || 1}">
      <label class="field"><span>Team size</span><select name="team_size"><option value="1">1 person</option><option value="2">2 people</option></select></label>
      ${member('lead', 'Team lead', { name: user?.name, email: user?.email, whatsapp: profile.whatsapp || profile.phone, university: profile.university, year: profile.study_year })}
      <div data-shiplens-teammate hidden>${member('mate', 'Second team member')}</div>`;
  }
  function wire(form) {
    const size = form.elements.team_size;
    const teammate = form.querySelector('[data-shiplens-teammate]');
    const update = () => {
      const pair = size.value === '2';
      teammate.hidden = !pair;
      teammate.querySelectorAll('input').forEach((input) => { input.disabled = !pair; });
    };
    size.addEventListener('change', update);
    update();
  }
  function read(form) {
    const member = (prefix) => ({
      name: form.elements[`${prefix}_name`].value.trim(), email: form.elements[`${prefix}_email`].value.trim(),
      whatsapp: form.elements[`${prefix}_whatsapp`].value.trim(), university: form.elements[`${prefix}_university`].value.trim(),
      year: form.elements[`${prefix}_year`].value.trim(),
    });
    return { challenge_pid: form.elements.challenge_pid.value, team_details: [member('lead'), ...(form.elements.team_size.value === '2' ? [member('mate')] : [])] };
  }
  window.ShipLensUI = { fields, wire, read, projectCard };
})();
