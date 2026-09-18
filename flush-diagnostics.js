'use strict';

const REDACTED = '[redacted]';
const SENSITIVE_FIELDS = new Set([
  'email', 'student_email', 'password', 'password_hash', 'whatsapp', 'phone',
  'google_sub', 'signature', 'instructor_sig', 'account_number', 'iban',
  'access_token', 'refresh_token', 'api_key', 'secret',
]);

/** Redact nested profiles, arrays and bank snapshots without mutating source records. */
function redactRowForLog(value) {
  if (Array.isArray(value)) return value.map(redactRowForLog);
  if (!value || typeof value !== 'object') return value;
  if (value instanceof Date) return value.toISOString();
  return Object.fromEntries(Object.entries(value).map(([key, child]) => [
    key, SENSITIVE_FIELDS.has(key.replace(/[A-Z]/g, c => `_${c.toLowerCase()}`))
      ? REDACTED : redactRowForLog(child),
  ]));
}

function failureDetails(error) {
  return {
    code: error.code || null,
    message: typeof error.message === 'string' && error.message.trim()
      ? error.message : String(error),
    meta: error.meta ?? null,
  };
}

/** Run before any replay writes, including dry-run validation. Never omit placeholders silently. */
function assertReplayableDump(value, location = '$') {
  if (value === REDACTED) {
    const error = new Error(`Cannot replay redacted field at ${location}; restore its original value from a trusted source before replay.`);
    error.code = 'REDACTED_FLUSH_DUMP';
    throw error;
  }
  if (value && typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) assertReplayableDump(child, `${location}.${key}`);
  }
}

module.exports = { redactRowForLog, failureDetails, assertReplayableDump };
