'use strict';

const TIME_ZONE = 'Asia/Karachi';
const SEND_HOUR = 9;
const DAY = 86400000;
const STEPS = Object.freeze([
  { key: 'week', days: -7, label: '7 days before' },
  { key: 'four_days', days: -4, label: '4 days before' },
  { key: 'three_days', days: -3, label: '3 days before' },
  { key: 'one_day', days: -1, label: '1 day before' },
  { key: 'deadline', days: 0, label: 'Deadline day' },
  { key: 'extension', days: 1, label: 'Extension follow-up' },
]);
const DEFAULT_PHONE = '0314148929';
const DEFAULT_EMAIL = 'finance@echolens.digital';
const localFormatter = new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h23' });
function localTime(now = new Date()) {
  const parts = Object.fromEntries(localFormatter.formatToParts(now).map(p => [p.type, p.value]));
  return { date: `${parts.year}-${parts.month}-${parts.day}`, hour: Number(parts.hour) };
}
function validDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const ms = Date.parse(value + 'T00:00:00Z');
  return Number.isFinite(ms) && new Date(ms).toISOString().slice(0, 10) === value;
}
function schedule(deadline) {
  if (!validDate(deadline)) return [];
  return STEPS.map(step => ({ ...step, date: new Date(Date.parse(deadline + 'T00:00:00Z') + step.days * DAY).toISOString().slice(0, 10), id: `${deadline}:${step.key}` }));
}
function isPaid(registration, challan) {
  return challan.status === 'paid' || ['paid_cleared', 'enrolled'].includes(registration.payment_stage) || !!registration.enrolled_user_id;
}
function originalAccepted(registration, challan) {
  const delivery = registration.status?.delivery;
  return (delivery?.state === 'provider_accepted' && delivery.reference === challan.serial) || !!challan.sent_at;
}
function messageFor(registration, challan, step, { appUrl, phone, financeEmail }) {
  const date = new Date(challan.deadline + 'T00:00:00Z').toLocaleDateString('en-GB', { timeZone: 'UTC', day: 'numeric', month: 'long', year: 'numeric' });
  const amount = Number(challan.net_fee).toLocaleString('en-PK');
  const overdue = step.key === 'extension';
  const subject = overdue ? 'EchoLens - need more time for your course fee?' : step.key === 'deadline' ? 'EchoLens - your course fee is due today' : 'EchoLens - course fee payment reminder';
  const opening = overdue
    ? `The payment deadline of ${date} for ${challan.course_title} has passed, and our records do not yet show a verified payment.\n\nIf you would like to request an extension, text ${phone} or email ${financeEmail}. Our team will confirm the revised deadline; this email does not automatically extend it.`
    : `This is a reminder about your fee challan for ${challan.course_title}. Please complete your payment by ${date}${step.key === 'deadline' ? ' (today)' : ''}.`;
  const receipt = registration.status?.receipt_token;
  return {
    to: challan.student_email,
    subject,
    text: `Hello ${registration.name},\n\n${opening}\n\nChallan: ${challan.serial}\nAmount payable: PKR ${amount}\nPayment deadline: ${date}\n\n${receipt ? `View your challan and registration status: ${appUrl.replace(/\/$/, '')}/registration-status#${receipt}\n\n` : ''}If you have already paid, please email your payment screenshot, transaction ID, date and amount to ${financeEmail} so Finance can verify it. Please do not pay twice.\n\nEchoLens Admissions`,
  };
}

function createAdmissionsReminders(store, mailer, options = {}) {
  const clock = options.clock || (() => new Date());
  const config = {
    appUrl: options.appUrl || 'https://www.echolens.digital',
    phone: options.phone || DEFAULT_PHONE,
    financeEmail: options.financeEmail || DEFAULT_EMAIL,
  };
  const maxPerRun = options.maxPerRun || Math.max(1, Math.min(100, Number(process.env.TRANSACTIONAL_MAX_PER_RUN) || 20));
  const pause = options.pause || (() => new Promise(resolve => setTimeout(resolve, 350)));
  let inFlight = null, timer = null;
  function records(serial) {
    const challan = store.Challans.bySerial(serial);
    const registration = challan && store.Registrations.byId(challan.registration_id);
    return { challan, registration, plan: registration?.status?.challan_reminders };
  }
  function eligible(r, c, plan) {
    return !!(r && c && plan?.enabled && plan.serial === c.serial && r.challan_serial === c.serial && c.status === 'issued'
      && !isPaid(r, c) && !store.Suppressions?.has(c.student_email) && !Object.values(plan.history).some(h => h.permanent)
      && Number(c.net_fee) > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.student_email || '') && originalAccepted(r, c));
  }
  async function persist() { store.persist(); await store.pendingPersist(); }
  async function configure(serial, enabled, by) {
    const { registration: r, challan: c, plan: prior } = records(serial);
    if (!r || !c || r.challan_serial !== c.serial) throw new Error('Current challan not found.');
    if (enabled && isPaid(r, c)) throw new Error('Payment is already verified; reminders have stopped.');
    if (enabled && !validDate(c.deadline)) throw new Error('A valid challan deadline is required.');
    const at = clock().toISOString();
    const plan = prior?.serial === c.serial ? prior : { serial: c.serial, history: {}, created_at: at };
    // Re-enabling retains delivery history, but never sends earlier dates.
    if (enabled && !plan.enabled) plan.start_date = localTime(clock()).date;
    Object.assign(plan, { enabled, updated_at: at, updated_by: by || null });
    r.status = { ...r.status, challan_reminders: plan };
    await persist();
    return view(serial);
  }
  function view(serial) {
    const { registration: r, challan: c, plan } = records(serial);
    if (!r || !c) return null;
    const now = clock(), today = localTime(now).date;
    const steps = schedule(c.deadline);
    const paid = isPaid(r, c);
    const active = !!plan?.enabled && plan.serial === c.serial;
    const current = steps.filter(step => step.date <= today && step.date >= (plan?.start_date || today)).at(-1);
    const blocked = store.Suppressions?.has(c.student_email) || Object.values(plan?.history || {}).some(h => h.permanent);
    const reason = paid ? 'Payment verified — reminders stopped' : !active ? 'Automatic reminders are off' : blocked ? 'Email delivery is blocked for this recipient' : !originalAccepted(r, c) ? 'Waiting for the challan email to be accepted' : 'Automatic reminders are on';
    return {
      enabled: active, paid, reason, time_zone: TIME_ZONE, send_time: '09:00', phone: config.phone, finance_email: config.financeEmail,
      steps: steps.map(step => {
        const entry = plan?.history?.[step.id];
        const state = entry?.state === 'sending' ? 'delivery_unknown' : entry?.state || (paid ? 'stopped' : !active ? 'off' : step.date < (plan.start_date || today) || (current && step.date < current.date) ? 'skipped' : 'scheduled');
        return { ...step, state, attempts: entry?.attempts || 0, at: entry?.accepted_at || entry?.attempted_at || null, retry_at: entry?.retry_at || null, message: messageFor(r, c, step, config) };
      }),
    };
  }
  async function sweep() {
    const summary = { sent: 0, failed: 0, attempted: 0 };
    if (mailer.configured === false || require('./demo/context').enabled) return summary;
    const now = clock(), local = localTime(now);
    if (local.hour < SEND_HOUR) return summary;
    // Oldest last attempt first prevents a capped run starving registrations.
    const candidates = store.Registrations.all().filter(r => r.status?.challan_reminders?.enabled)
      .sort((a, b) => String(a.status.challan_reminders.last_attempt_at || '').localeCompare(b.status.challan_reminders.last_attempt_at || ''));
    let failures = 0;
    for (const candidate of candidates) {
      const { registration: r, challan: c, plan } = records(candidate.challan_serial);
      if (!eligible(r, c, plan)) continue;
      // Only the latest due step is eligible. A restart never sends a backlog
      // of several stale reminders to one applicant on the same day.
      const step = schedule(c.deadline).filter(s => s.date <= local.date && s.date >= plan.start_date).at(-1);
      if (!step) continue;
      const previous = plan.history[step.id];
      if (previous && (previous.state !== 'failed' || previous.attempts >= 3 || !previous.retry_at || previous.retry_at > now.toISOString())) continue;
      if (Object.values(plan.history).some(h => h.accepted_at && localTime(new Date(h.accepted_at)).date === local.date)) continue;
      if (summary.attempted >= maxPerRun) break;
      const entry = { state: 'sending', attempted_at: now.toISOString(), attempts: (previous?.attempts || 0) + 1 };
      plan.history[step.id] = entry;
      plan.last_attempt_at = entry.attempted_at;
      // Persist the claim before touching the provider. On restart a claim
      // without an acknowledgement is not retried automatically.
      await persist();
      if (!eligible(store.Registrations.byId(r.id), store.Challans.bySerial(c.serial), r.status.challan_reminders)) {
        entry.state = 'stopped'; await persist(); continue;
      }
      summary.attempted++;
      let outcome;
      try {
        outcome = await mailer.send(messageFor(r, c, step, config));
      } catch (err) {
        // An explicit provider rejection can be retried. Transport timeouts
        // have an unknown delivery outcome and must not cause duplicate mail.
        const rejected = !!(err.statusCode || err.responseCode || err.permanent || err.abuse);
        entry.state = rejected ? 'failed' : 'delivery_unknown';
        entry.permanent = !!err.permanent;
        entry.retry_at = rejected && !err.permanent && entry.attempts < 3 ? new Date(now.getTime() + 3600000).toISOString() : null;
        summary.failed++; failures++;
        await persist();
        if (err.abuse || [401, 402, 403, 429].includes(err.statusCode) || failures >= 3) break;
        await pause(); continue;
      }
      if (outcome?.sent) {
        Object.assign(entry, { state: 'provider_accepted', accepted_at: clock().toISOString(), provider_id: typeof outcome.id === 'string' ? outcome.id.slice(0, 2000) : null });
        summary.sent++; failures = 0;
      } else {
        Object.assign(entry, { state: 'failed', retry_at: entry.attempts < 3 ? new Date(now.getTime() + 3600000).toISOString() : null });
        summary.failed++; failures++;
      }
      // Never change accepted to failed if this write fails: memory still
      // prevents a duplicate, and the durable claim protects a restart.
      await persist();
      if (failures >= 3) break;
      await pause();
    }
    return summary;
  }
  function run() {
    if (inFlight) return inFlight;
    inFlight = sweep().finally(() => { inFlight = null; });
    return inFlight;
  }
  function start() {
    if (timer || require('./demo/context').enabled || process.env.NODE_ENV === 'test') return;
    const tick = () => run().catch(err => console.error('[admissions reminders] check failed:', err.message));
    timer = setInterval(tick, 15 * 60 * 1000); timer.unref(); tick();
  }
  function stop() { clearInterval(timer); timer = null; }
  return { configure, view, run, start, stop };
}
module.exports = { createAdmissionsReminders, schedule, validDate, localTime, messageFor, DEFAULT_PHONE, DEFAULT_EMAIL };
