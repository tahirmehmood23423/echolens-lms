'use strict';
(() => {
  const escape = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const skeleton = () => '<section class="cx-loading" role="status" aria-label="Loading career details"><span class="cx-skeleton cx-wide"></span><span class="cx-skeleton"></span><div class="cx-loading-grid"><span class="cx-skeleton cx-block"></span><span class="cx-skeleton cx-block"></span><span class="cx-skeleton cx-block"></span></div><span class="sr-only">Loading. Please wait.</span></section>';
  function code(text, lang = '') {
    const pattern = /(#[^\n]*|\/\/[^\n]*|--[^\n]*|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\b(?:def|return|if|else|elif|for|while|in|import|from|as|class|try|except|raise|with|True|False|None|const|let|function|SELECT|FROM|WHERE|JOIN|ON|GROUP|BY|ORDER|NULL|AND|OR|INSERT|CREATE|TABLE|COUNT|AS|LIMIT|UPDATE|SET|DELETE)\b|\b\d+(?:\.\d+)?\b)/g;
    let at = 0, out = '';
    for (const m of String(text).matchAll(pattern)) {
      out += escape(text.slice(at, m.index));
      const tone = /^(#|\/\/|--)/.test(m[0]) ? 'comment' : /^["']/.test(m[0]) ? 'string' : /^\d/.test(m[0]) ? 'number' : 'keyword';
      out += `<span class="cx-code-${tone}">${escape(m[0])}</span>`; at = m.index + m[0].length;
    }
    return `<div class="cx-code"><span class="cx-code-lang">${escape(lang || 'Code')}</span><pre tabindex="0" aria-label="${escape(lang || 'Code')} snippet"><code>${out + escape(text.slice(at))}</code></pre></div>`;
  }
  function dialog(title, body, confirmLabel = 'Continue', cancelLabel = 'Go back') {
    return new Promise(resolve => {
      const previous = document.activeElement, el = document.createElement('dialog'); el.className = 'cx-dialog';
      el.innerHTML = `<form method="dialog"><h2 id="cxDialogTitle">${escape(title)}</h2><div>${body}</div><div class="cr-actions"><button class="cr-btn ghost" value="cancel" autofocus>${escape(cancelLabel)}</button><button class="cr-btn" value="confirm">${escape(confirmLabel)}</button></div></form>`;
      el.setAttribute('aria-labelledby', 'cxDialogTitle'); document.body.append(el);
      el.addEventListener('close', () => { const ok = el.returnValue === 'confirm'; el.remove(); previous?.focus(); resolve(ok); }, { once: true }); el.showModal();
    });
  }
  function progress(c) {
    if (!c) return '';
    const target = c.target, next = c.active || c.next;
    return `<section class="cx-command" aria-labelledby="cxNextTitle"><div><span class="cx-eyebrow">Your next step</span><h2 id="cxNextTitle">${escape(target?.title || 'Build your career, one skill at a time')}</h2><p>${next ? escape(next.title) : 'Explore a career and choose the role you want to grow into.'}</p><div class="cr-actions"><a class="cr-btn" href="${escape(next?.href || '#tracks')}">${c.active ? 'Continue assessment' : c.next ? c.next.available ? 'Continue your skill journey' : 'View learning plan' : 'Explore careers'} <span aria-hidden="true">→</span></a>${target ? `<a class="cr-btn ghost" href="#role/${escape(target.id)}">View target role</a>` : ''}</div></div><div class="cx-measures"><div><b>${c.assessed_competencies}</b><span>Competencies assessed</span><small>Quiz knowledge evidence</small></div><div><b>${c.required ? `${c.passed} / ${c.required}` : 'Not started'}</b><span>Subtracks passed</span><small>Not lesson completion</small></div><div><b>${target ? target.readiness.ready ? 'Requirements met' : 'In progress' : 'Not selected'}</b><span>Role knowledge readiness</span><small>${target ? `${target.readiness.passed} of ${target.readiness.required} required subtracks` : 'Choose a target role to begin'}</small></div></div></section>`;
  }
  function evidence(c) {
    if (!c?.competencies?.length) return '';
    return `<details class="cr-panel"><summary><b>Assessed knowledge evidence (${c.competencies.length} competencies)</b></summary><p class="cr-small cr-muted">Canonical quiz competencies are shared across matching subtracks and roles. They do not substitute for practical coursework or differently defined skills.</p>${c.competencies.map(s => `<div class="cu-row cu-comp"><span>${escape(s.name)}<small>${escape(s.group)}</small></span><span class="cr-bar" role="img" aria-label="${s.proficiency ? s.proficiency.score + ' percent' : 'Not assessed'}"><i style="width:${s.proficiency?.score || 0}%"></i></span><b>${s.proficiency ? s.proficiency.score + '%' : 'Not assessed'}</b></div>`).join('')}</details>`;
  }
  window.CareerUI = { escape, skeleton, code, dialog, progress, evidence };
})();
