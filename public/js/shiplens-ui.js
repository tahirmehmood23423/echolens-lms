'use strict';
(function () {
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
    return `<p class="hint">Choose one of the three difficulty levels - the full project brief opens the day after registration closes. One challan covers a team of one or two. Finance confirms payment before submissions open.</p>
      <label class="field"><span>Project challenge</span><select name="challenge_pid" required>
        ${(ev.problems || []).map((p) => `<option value="${p.pid}">${e(p.difficulty)} — ${e(p.title)}</option>`).join('')}
      </select></label>
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
  window.ShipLensUI = { fields, wire, read };
})();
