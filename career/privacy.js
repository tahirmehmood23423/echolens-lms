'use strict';
// Assessment state belongs to the assessment API, never a general profile.
// Copy response objects; do not remove anything from persisted student data.
function studentResponse(value) {
  if (Array.isArray(value)) return value.map(studentResponse);
  if (!value || typeof value !== 'object' || value instanceof Date || Buffer.isBuffer(value)) return value;
  return Object.fromEntries(Object.entries(value).filter(([key]) => key !== 'career').map(([key, v]) => [key, studentResponse(v)]));
}
module.exports = { studentResponse };
