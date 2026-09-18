(() => {
  'use strict';
  const form = document.getElementById('contactForm');
  if (!form) return;
  const button = form.querySelector('button[type="submit"]');
  const status = document.getElementById('contactStatus');
  const reply = document.getElementById('contactReply');
  let sending = false;
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (sending || !form.reportValidity()) return;
    sending = true; button.disabled = true;
    status.classList.remove('contact-error'); status.textContent = 'Submitting your request…';
    reply.hidden = true;
    const body = Object.fromEntries(new FormData(form));
    body.context = '/contact';
    try {
      const response = await fetch(form.action, { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await response.json();
      if (!response.ok) throw Error(data.error || 'The request could not be submitted.');
      if (!data.ticket?.ticket_no) throw Error('A ticket confirmation was not returned. Please email info@echolens.digital.');
      status.textContent = `Ticket ${data.ticket.ticket_no} submitted. Our team aims to resolve it within 24–48 hours.` + (data.email_sent ? ' Acknowledgment email sent.' : ' Keep your ticket link; acknowledgment email is currently unavailable.');
      if (data.ticket.reply_url) {
        const url = new URL(data.ticket.reply_url, location.href);
        // Secure token links are private; never put them in public markup or logs.
        if (url.pathname === '/open' && /^#ticket=EL-\d{6}&token=/.test(url.hash)) { reply.href = '/open' + url.hash; reply.hidden = false; }
      }
      form.reset();
    } catch (error) {
      status.classList.add('contact-error');
      status.textContent = error.message + ' Your entered details have been kept. You can also email info@echolens.digital. If submission was interrupted, check for an acknowledgment before retrying.';
    } finally {
      sending = false; button.disabled = false; status.focus();
    }
  });
})();
