'use strict';

/* EchoLens LMS v20 - Showcase composer (shared component)
   Loaded on both /showcase (showcase.js, "Share your work" button) and
   the quest task workspace (dashboard.js, "Share to Showcase" after a
   passed, graded submission - see step 6 Part B). One implementation,
   two mount points: builds its own modal DOM into document.body on first
   use rather than depending on markup already being in the host page, so
   neither page needs to carry a copy of this markup.

   window.ShowcaseComposer.open({
     questSubmissionId,             // optional - pre-fills the quest attachment chip
     prefilledFiles,                // optional array of File/Blob - e.g. a captured matplotlib plot, still attachable/removable like any picked image
     defaultVisibility,             // optional 'BATCH' | 'PUBLIC', defaults to 'BATCH'
     onPublished(post),             // optional callback, called after a successful publish (modal is closed first)
   })
*/
window.ShowcaseComposer = (() => {
  const MAX_IMAGES = 4;
  const MAX_CAPTION = 2000;

  function esc(s) { return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
  async function api(path, opts = {}) {
    const isForm = opts.body instanceof FormData;
    const res = await fetch(path, { credentials: 'same-origin', headers: isForm ? {} : { 'Content-Type': 'application/json' }, ...opts });
    const data = await res.json().catch(() => ({}));
    if (res.status === 401) { location.href = '/login'; throw new Error('Signed out.'); }
    if (!res.ok) throw new Error(data.error || 'Something went wrong.');
    return data;
  }

  let els = null; // built once, lazily
  let pickedFiles = [];
  let questSubmissionId = null;
  let onPublished = null;

  function build() {
    const wrap = document.createElement('div');
    wrap.className = 'modal-overlay';
    wrap.id = 'scComposerOverlay';
    wrap.innerHTML = `
      <div class="modal wide">
        <button class="close" id="scComposerClose" type="button">&times;</button>
        <h3>Share your work</h3>
        <div id="scQuestChip"></div>
        <div class="sc-picker" id="scPicker"></div>
        <input type="file" id="scFileInput" accept="image/jpeg,image/png,image/webp" multiple style="display:none">
        <div class="field">
          <span>Caption</span>
          <textarea id="scCaptionInput" maxlength="${MAX_CAPTION}" placeholder="What did you build?"></textarea>
        </div>
        <div class="sc-charcount" id="scCharCount">0 / ${MAX_CAPTION}</div>
        <div class="sc-vis-toggle" id="scVisToggle">
          <div class="sc-vis-opt" data-vis="BATCH">My cohort only</div>
          <div class="sc-vis-opt" data-vis="PUBLIC">Public</div>
        </div>
        <div class="form-msg" id="scComposerMsg"></div>
        <button class="btn btn-primary btn-block" id="scPublishBtn">Publish</button>
      </div>`;
    document.body.appendChild(wrap);

    const $ = (id) => document.getElementById(id);
    els = {
      overlay: wrap, close: $('scComposerClose'), picker: $('scPicker'), fileInput: $('scFileInput'),
      caption: $('scCaptionInput'), charCount: $('scCharCount'), visToggle: $('scVisToggle'),
      msg: $('scComposerMsg'), publishBtn: $('scPublishBtn'), questChip: $('scQuestChip'),
    };

    els.close.addEventListener('click', close);
    wrap.addEventListener('click', (e) => { if (e.target === wrap) close(); });
    els.picker.addEventListener('click', (e) => {
      if (e.target.closest('.rm')) return; // handled by the button's own listener, not the slot click-to-add
      if (pickedFiles.length < MAX_IMAGES) els.fileInput.click();
    });
    els.fileInput.addEventListener('change', (e) => {
      const room = MAX_IMAGES - pickedFiles.length;
      const accepted = ['image/jpeg', 'image/png', 'image/webp'];
      // Client-side filtering is a courtesy for a fast error message only -
      // the server re-validates every byte via magic numbers (r2-upload.js).
      const picked = Array.from(e.target.files).filter((f) => accepted.includes(f.type)).slice(0, room);
      if (picked.length < e.target.files.length) toastOrAlert('Only JPEG, PNG, or WebP images are accepted.');
      pickedFiles = pickedFiles.concat(picked);
      e.target.value = '';
      renderPicker();
    });
    els.caption.addEventListener('input', () => {
      const n = els.caption.value.length;
      els.charCount.textContent = `${n} / ${MAX_CAPTION}`;
      els.charCount.classList.toggle('over', n > MAX_CAPTION);
    });
    els.visToggle.addEventListener('click', (e) => {
      const opt = e.target.closest('.sc-vis-opt'); if (!opt) return;
      els.visToggle.querySelectorAll('.sc-vis-opt').forEach((x) => x.classList.remove('active'));
      opt.classList.add('active');
    });
    els.publishBtn.addEventListener('click', publish);
  }

  // Prefers a page-local toast() if the host page defines one (both
  // showcase.js and dashboard.js do); falls back to alert() so this
  // component never depends on either page's specific DOM for its own
  // baseline error reporting.
  function toastOrAlert(msg) { if (typeof window.toast === 'function') window.toast(msg, true); else alert(msg); }

  function renderPicker() {
    const slots = [];
    for (let i = 0; i < MAX_IMAGES; i++) {
      const f = pickedFiles[i];
      if (f) slots.push(`<div class="sc-picker-slot"><img src="${URL.createObjectURL(f)}" alt=""><button type="button" class="rm" data-i="${i}">&times;</button></div>`);
      else slots.push(`<div class="sc-picker-slot">${i === pickedFiles.length ? '+' : ''}</div>`);
    }
    els.picker.innerHTML = slots.join('');
    els.picker.querySelectorAll('.rm').forEach((btn) => {
      btn.addEventListener('click', (e) => { e.stopPropagation(); pickedFiles.splice(Number(btn.dataset.i), 1); renderPicker(); });
    });
  }

  function close() {
    els.overlay.classList.remove('open');
    pickedFiles = []; questSubmissionId = null; onPublished = null;
    els.caption.value = ''; els.charCount.textContent = `0 / ${MAX_CAPTION}`; els.msg.style.display = 'none';
    els.visToggle.querySelectorAll('.sc-vis-opt').forEach((x) => x.classList.remove('active'));
  }

  async function publish() {
    const msg = els.msg;
    msg.style.display = 'none';
    const caption = els.caption.value.trim();
    if (!caption) { msg.textContent = 'Write a caption for your post.'; msg.style.display = 'block'; return; }
    if (caption.length > MAX_CAPTION) { msg.textContent = `Caption is too long (max ${MAX_CAPTION} characters).`; msg.style.display = 'block'; return; }
    if (!pickedFiles.length) { msg.textContent = 'Attach at least one image.'; msg.style.display = 'block'; return; }
    const activeVis = els.visToggle.querySelector('.sc-vis-opt.active');
    const visibility = activeVis ? activeVis.dataset.vis : 'BATCH';
    const fd = new FormData();
    fd.append('caption', caption);
    fd.append('visibility', visibility);
    if (questSubmissionId) fd.append('quest_submission_id', questSubmissionId);
    pickedFiles.forEach((f) => fd.append('images', f));
    els.publishBtn.disabled = true; els.publishBtn.textContent = 'Publishing…';
    try {
      const d = await api('/api/showcase/posts', { method: 'POST', body: fd });
      const cb = onPublished;
      close();
      if (cb) cb(d.post);
    } catch (e) {
      msg.textContent = e.message; msg.style.display = 'block';
    } finally {
      els.publishBtn.disabled = false; els.publishBtn.textContent = 'Publish';
    }
  }

  function open(opts = {}) {
    if (!els) build();
    pickedFiles = Array.isArray(opts.prefilledFiles) ? opts.prefilledFiles.slice(0, MAX_IMAGES) : [];
    questSubmissionId = opts.questSubmissionId || null;
    onPublished = typeof opts.onPublished === 'function' ? opts.onPublished : null;
    renderPicker();
    els.questChip.innerHTML = questSubmissionId
      ? `<div class="sc-quest-chip">&#127942; Attached to your passed quest ${pickedFiles.length ? '&middot; output attached automatically' : ''} &middot; <a href="#" id="scRemoveQuest" style="color:inherit">remove</a></div>` : '';
    const rm = document.getElementById('scRemoveQuest');
    if (rm) rm.addEventListener('click', (e) => { e.preventDefault(); questSubmissionId = null; open({ ...opts, questSubmissionId: null }); });
    els.visToggle.querySelectorAll('.sc-vis-opt').forEach((x) => x.classList.toggle('active', x.dataset.vis === (opts.defaultVisibility === 'PUBLIC' ? 'PUBLIC' : 'BATCH')));
    els.overlay.classList.add('open');
  }

  /** Converts a data: URL (e.g. a matplotlib figure rendered as <img src="data:image/png;base64,...">) into a File the composer/FormData can attach - used by dashboard.js's quest-completion hook, exposed here since this is the one place that already knows the composer's expected shape. */
  async function fileFromDataUrl(dataUrl, filename) {
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    return new File([blob], filename, { type: blob.type || 'image/png' });
  }

  return { open, close, fileFromDataUrl };
})();
