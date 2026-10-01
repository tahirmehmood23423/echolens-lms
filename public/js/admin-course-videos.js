'use strict';
(() => {
  const byId = id => document.getElementById(id);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[c]);
  const count = n => n == null ? 'Unavailable' : Number(n).toLocaleString();
  let courses = [];
  function draw() {
    const query = byId('search').value.trim().toLowerCase();
    const selected = byId('course').value;
    const rows = courses.flatMap(c => c.lessons.map(l => ({ course:c, lesson:l }))).filter(({ course:c, lesson:l }) =>
      (!selected || c.key === selected) && (!query || [c.title, l.title, l.module, ...l.videos.map(v => `${v.title} ${v.channel}`)].join(' ').toLowerCase().includes(query)));
    byId('status').textContent = `${rows.length} lessons · ${rows.reduce((n, r) => n + r.lesson.videos.length, 0)} video links`;
    byId('lessons').innerHTML = rows.map(({ course:c, lesson:l }) => `<article>
      <div class="course-label">${esc(c.code)} · ${esc(c.title)} · ${esc(l.module)}</div>
      <h2>${esc(l.lecture_no)} — ${esc(l.title)}</h2><p>${esc(l.coverage)}</p>
      <p><a href="/open#course/${encodeURIComponent(c.key)}/lesson/${l.no}">Open lecture in course</a></p>
      ${l.videos.map(v => {
        let id; try { id = new URL(v.url).searchParams.get('v'); } catch {}
        if (!/^[\w-]{11}$/.test(id || '')) return '<p>Video link unavailable.</p>';
        return `<section class="video"><h3>${v.optional ? 'Optional companion: ' : ''}${esc(v.title)}</h3>
          <p class="metrics">${esc(v.channel)} · ${esc(v.length)} · ${count(v.views)} views · ${count(v.comments)} comments<br>Checked ${esc(v.checked_at ? new Date(v.checked_at).toLocaleString() : 'not recorded')}</p>
          <div class="actions"><button type="button" data-play="${id}">Preview video</button><a href="https://www.youtube.com/watch?v=${id}" target="_blank" rel="noopener noreferrer">Open on YouTube / comments ↗</a></div><div class="player-slot"></div></section>`;
      }).join('')}</article>`).join('') || '<p>No matching lessons.</p>';
  }
  byId('lessons').addEventListener('click', event => {
    const button = event.target.closest('[data-play]');
    if (!button) return;
    const slot = button.closest('.video').querySelector('.player-slot');
    if (slot.firstChild) { slot.replaceChildren(); button.textContent = 'Preview video'; return; }
    const frame = document.createElement('iframe');
    frame.className = 'player'; frame.src = `https://www.youtube-nocookie.com/embed/${button.dataset.play}`;
    frame.title = button.closest('.video').querySelector('h3').textContent;
    frame.allow = 'accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture';
    frame.allowFullscreen = true; frame.referrerPolicy = 'strict-origin-when-cross-origin';
    slot.append(frame); button.textContent = 'Close preview';
  });
  byId('course').addEventListener('change', draw);
  byId('search').addEventListener('input', draw);
  byId('download').addEventListener('click', () => {
    const rows = [['Course','Lecture','Topic','Video','Channel','URL','Duration','Seconds','Views','Comments','Checked at','Optional companion']];
    for (const c of courses) for (const l of c.lessons) for (const v of l.videos) rows.push([c.title,l.lecture_no,l.title,v.title,v.channel,v.url,v.length,v.duration_seconds,v.views,v.comments,v.checked_at,!!v.optional]);
    const csv = rows.map(row => row.map(cell => '"' + String(cell ?? '').replace(/^[=+@-]/, "'$&").replaceAll('"', '""') + '"').join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob(['\uFEFF' + csv], { type:'text/csv;charset=utf-8' }));
    const a = document.createElement('a'); a.href = url; a.download = 'upcoming-course-videos.csv'; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  fetch('/api/admin/course-videos', { credentials:'same-origin', cache:'no-store' }).then(async response => {
    if (response.status === 401) { location.replace('/login?returnTo=%2Fadmin%2Fcourse-videos'); return; }
    if (!response.ok) throw Error(response.status === 403 ? 'Sign in with an administrator account to review videos.' : 'Could not load videos. Reload to retry.');
    const data = await response.json(); courses = data.courses;
    for (const c of courses) { const option = document.createElement('option'); option.value = c.key; option.textContent = `${c.code} — ${c.title}`; byId('course').append(option); }
    byId('download').disabled = false; draw();
  }).catch(error => { byId('status').textContent = error.message; });
})();
