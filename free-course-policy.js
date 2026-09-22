'use strict';
const { parseTimestamp } = require('./course-pacing');
const DAY = 86400000;
function deadline(enrollment) {
  if (Number.isFinite(parseTimestamp(enrollment.expires_at))) return enrollment.expires_at;
  const at = parseTimestamp(enrollment.enrolled_at);
  if (!Number.isFinite(at)) return null;
  const start = new Date(at), end = new Date(at);
  end.setUTCDate(1);
  end.setUTCMonth(end.getUTCMonth() + 3);
  const last = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth() + 1, 0)).getUTCDate();
  end.setUTCDate(Math.min(start.getUTCDate(), last));
  return end.toISOString();
}
function expired(enrollment, completed, now = Date.now()) {
  const due = parseTimestamp(deadline(enrollment));
  return !completed && Number.isFinite(due) && now >= due;
}
function remaining(enrollment, now = Date.now()) {
  const due = parseTimestamp(deadline(enrollment));
  return Number.isFinite(due) ? Math.max(0, Math.ceil((due - now) / DAY)) : null;
}
function messageFor(user, enrollment, track, kind, now = Date.now(), appUrl = 'https://www.echolens.digital') {
  const days = remaining(enrollment, now);
  const date = new Date(deadline(enrollment)).toLocaleString('en-GB', { timeZone: 'Asia/Karachi', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  const intro = kind === 'inactive' ? 'You have not opened this course for at least one week. Pick up where you left off and work on your next assignment.'
    : kind === 'expired' ? 'Your three-month free-course window has ended and your incomplete enrollment has been removed. Your submitted work and grades have been preserved. Contact support if you need help returning to the course.'
    : 'Keep going with your free certified course. Open the lessons, complete your assignments and meet the course requirements to earn your certificate.';
  return { to: user.email, subject: kind === 'expired' ? `EchoLens - free-course window ended: ${track.title}` : `EchoLens - ${kind === 'inactive' ? 'continue learning' : 'course completion reminder'}: ${track.title}`,
    text: `Hi ${user.name || 'learner'},\n\n${intro}\n\nCourse: ${track.title}\nCompletion deadline: ${date} (Pakistan time)\nRemaining time: ${days} day${days === 1 ? '' : 's'}\n\n${appUrl.replace(/\/$/, '')}/open#course/${encodeURIComponent(track.key)}\n\nCompleted courses stop receiving these reminders. Certificate eligibility depends on assessment and verification requirements.\n\n- EchoLens Digital` };
}
module.exports = { DAY, deadline, expired, remaining, messageFor };
