'use strict';
const policy = require('./free-course-policy');
const { parseTimestamp } = require('./course-pacing');

function createFreeCourseReminders(store, mailer, options = {}) {
  const clock = options.clock || (() => new Date());
  const pause = options.pause || (() => new Promise(r => setTimeout(r, 400)));
  const cap = Math.max(1, Math.min(20, Number(options.maxPerRun || process.env.TRANSACTIONAL_MAX_PER_RUN) || 20));
  let inFlight, timer;
  async function persist() { store.persist(); await store.pendingPersist(); }
  function candidates() {
    const rows = [];
    for (const user of store.Users.all()) {
      if (!['free', 'student'].includes(user.role)) continue;
      const existing = Array.isArray(user.profile?.free_course_enrollments) ? user.profile.free_course_enrollments : null;
      const saved = existing || [];
      // Materialise submission-only legacy enrollments without resetting work.
      for (const submission of store.allData().open_submissions) {
        if (submission.user_id !== user.id || saved.some(e => e.track_key === submission.track_key)) continue;
        if (!store.Quests.trackDef(submission.track_key)?.free) continue;
        saved.push({ track_key: submission.track_key, enrolled_at: submission.submitted_at });
      }
      // Only write the key when there is something to record, or it was already
      // there. This sweep runs at boot and hourly over EVERY free/student user;
      // assigning unconditionally stamped `free_course_enrollments: []` onto
      // hundreds of profiles that never had it, and since the Postgres flush
      // diffs rows by their serialized JSON, each of those became a "changed"
      // row. That is what turned a no-op sweep into ~380 per-row UPDATEs inside
      // the single 60s flush transaction and wedged persistence outright.
      if (existing || saved.length) {
        user.profile = { ...(user.profile || {}), free_course_enrollments: saved };
      }
      for (const enrollment of saved) {
        const track = store.Quests.trackDef(enrollment.track_key);
        if (!track?.free) continue;
        if (!policy.deadline(enrollment)) {
          enrollment.legacy_enrolled_at = enrollment.enrolled_at || null;
          enrollment.enrolled_at = clock().toISOString();
          enrollment.deadline_origin = 'legacy-undated-first-check';
          store.AuditLog.record({ action: 'free_course_deadline_initialized', target_type: 'user', target_id: user.id, detail: { track_key: track.key }, deferSave: true });
        }
        enrollment.expires_at = policy.deadline(enrollment);
        enrollment.reminders ||= { deliveries: [] };
        enrollment.reminders.deliveries ||= [];
        rows.push({ user, enrollment, track });
      }
    }
    return rows.sort((a, b) => String(a.enrollment.reminders.last_attempt_at || '').localeCompare(b.enrollment.reminders.last_attempt_at || ''));
  }
  async function sweep() {
    const result = { sent: 0, failed: 0, expired: 0, attempted: 0 };
    if (require('./demo/context').enabled) return result;
    const now = clock().getTime();
    const rows = candidates();
    // Expiry is independent of mail configuration and is enforced by request gates too.
    for (const row of rows) {
      if (row.enrollment.removed_at || !policy.expired(row.enrollment, store.OpenQuest.progress(row.user.id, row.track.key)?.passed, now)) continue;
      const removed = store.OpenQuest.removeEnrollment(row.user.id, row.track.key, 'expired', null, new Date(now).toISOString());
      row.enrollment = removed.enrollment;
      store.AuditLog.record({ action: 'free_course_expired', target_type: 'user', target_id: row.user.id, detail: { track_key: row.track.key }, deferSave: true });
      result.expired++;
    }
    await persist();
    if (mailer.configured === false) return result;
    let failures = 0;
    for (const { user, enrollment, track } of rows) {
      if (result.attempted >= cap) break;
      if (!user.email || store.Suppressions.has(user.email) || store.OpenQuest.progress(user.id, track.key)?.passed) continue;
      if (enrollment.removed_at && enrollment.removal_reason !== 'expired') continue;
      const plan = enrollment.reminders;
      const latestAttempt = parseTimestamp(plan.last_attempt_at);
      if (Number.isFinite(latestAttempt) && now - latestAttempt < policy.DAY) continue;
      const start = parseTimestamp(enrollment.enrolled_at);
      const opened = parseTimestamp(enrollment.last_opened_at || enrollment.enrolled_at);
      const interval = Math.floor((now - start) / (14 * policy.DAY));
      const inactivityWeek = Math.floor((now - opened) / (7 * policy.DAY));
      let kind, key;
      if (enrollment.removed_at) { kind = 'expired'; key = 'expired'; }
      else if (interval >= 1 && !plan.deliveries.some(d => d.kind === 'completion' && d.interval === interval && d.state !== 'failed')) { kind = 'completion'; key = 'completion:' + interval; }
      else if (inactivityWeek >= 1) { kind = 'inactive'; key = 'inactive:' + (enrollment.last_opened_at || enrollment.enrolled_at) + ':' + inactivityWeek; }
      else continue;
      let entry = plan.deliveries.find(d => d.key === key);
      // A durable claim with an unknown outcome is never blindly resent.
      if (entry && (entry.state !== 'failed' || entry.permanent || entry.attempts >= 3)) continue;
      if (!entry) { entry = { key, kind, interval, attempts: 0 }; plan.deliveries.push(entry); }
      Object.assign(entry, { state: 'claimed', attempted_at: new Date(now).toISOString(), attempts: entry.attempts + 1 });
      plan.last_attempt_at = entry.attempted_at;
      await persist();
      // Re-check after persistence: an admin may remove the seat while it is awaited.
      const current = (store.Users.byId(user.id)?.profile?.free_course_enrollments || []).find(e => e.track_key === track.key);
      if (current !== enrollment || (kind !== 'expired' && current.removed_at) || (kind === 'inactive' && now - parseTimestamp(current.last_opened_at || current.enrolled_at) < 7 * policy.DAY) || store.OpenQuest.progress(user.id, track.key)?.passed) { entry.state = 'cancelled'; await persist(); continue; }
      result.attempted++;
      try {
        const outcome = await mailer.send(policy.messageFor(user, enrollment, track, kind, now, options.appUrl));
        entry.state = outcome?.sent ? 'provider_accepted' : 'failed';
        if (outcome?.sent) { entry.accepted_at = clock().toISOString(); result.sent++; failures = 0; }
        else { result.failed++; failures++; }
      } catch (error) {
        entry.state = error.statusCode || error.responseCode || error.permanent || error.abuse ? 'failed' : 'delivery_unknown';
        entry.permanent = !!error.permanent;
        entry.error = String(error.message).slice(0, 300);
        if (error.permanent && store.Suppressions.add) await store.Suppressions.add({ email: user.email, reason: error.message, code: error.statusCode || error.responseCode, source: 'free-course-reminder' });
        result.failed++; failures++;
        await persist();
        if (error.abuse || [401, 402, 403, 429].includes(error.statusCode) || failures >= 3) break;
        await pause(); continue;
      }
      await persist();
      if (failures >= 3) break;
      await pause();
    }
    return result;
  }
  function run() { if (!inFlight) inFlight = sweep().finally(() => { inFlight = null; }); return inFlight; }
  function start() {
    if (timer || process.env.NODE_ENV === 'test' || require('./demo/context').enabled) return;
    const tick = () => run().catch(error => console.error('[free-course reminders]', error.message));
    timer = setInterval(tick, 60 * 60 * 1000); timer.unref(); tick();
  }
  function stop() { clearInterval(timer); timer = null; }
  return { run, start, stop };
}
module.exports = { createFreeCourseReminders };
