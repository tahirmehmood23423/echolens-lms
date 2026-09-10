'use strict';
const inFlight = new Map();
async function deliverRegistrationMail(store, mailer, registration, message, { kind = 'challan', reference, resend = false } = {}) {
  const key = `${registration.id}:${kind}`;
  const prior = registration.status?.[kind === 'challan' ? 'delivery' : 'confirmation_delivery'];
  if (!resend && prior?.state === 'provider_accepted' && prior.reference === reference) return prior;
  if (inFlight.has(key)) return inFlight.get(key);
  const work = (async () => {
    store.Registrations.delivery(registration.id, 'queued', { reference }, kind);
    try {
      await store.pendingPersist();
      const outcome = await mailer.send(message);
      if (!outcome?.sent) throw new Error('Email provider did not accept the message.');
      const state = store.Registrations.delivery(registration.id, 'provider_accepted', { reference, provider_id: outcome.id || null }, kind);
      await store.pendingPersist();
      return state;
    } catch (error) {
      console.error(`[registration mail] ${kind} failed for registration ${registration.id}: ${error.message}`);
      return store.Registrations.delivery(registration.id, 'failed', { reference, message: 'Email could not be sent. Keep your receipt or download the PDF and try again.' }, kind);
    }
  })();
  inFlight.set(key, work);
  try { return await work; } finally { inFlight.delete(key); }
}
module.exports = { deliverRegistrationMail };
