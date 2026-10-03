'use strict';
const crypto = require('node:crypto');

// Challenges are deliberately ephemeral: a server restart requires a new PIN.
module.exports = function passwordRecovery({ now = Date.now } = {}) {
  const challenges = new Map(), grants = new Map();
  const digest = value => crypto.createHash('sha256').update(value).digest();
  function prune() {
    for (const map of [challenges, grants]) for (const [key, rec] of map) if (rec.expires <= now()) map.delete(key);
  }
  function invalidate(userId) {
    for (const map of [challenges, grants]) for (const [key, rec] of map) if (rec.userId === userId) map.delete(key);
  }
  return {
    issue(email, userId, return_to) {
      prune();
      const old = challenges.get(email);
      if (old && old.sentAt + 60000 > now()) return null;
      invalidate(userId);
      const pin = String(crypto.randomInt(0, 1000000)).padStart(6, '0');
      challenges.set(email, { userId, return_to, hash: digest(pin), tries: 0, sentAt: now(), expires: now() + 10 * 60000 });
      return pin;
    },
    cancel(email) { challenges.delete(email); },
    verify(email, pin) {
      prune();
      const rec = challenges.get(email);
      if (!rec) return null;
      rec.tries++;
      if (rec.tries >= 5) challenges.delete(email);
      if (!/^\d{6}$/.test(pin) || !crypto.timingSafeEqual(rec.hash, digest(pin))) return null;
      challenges.delete(email);
      const token = crypto.randomBytes(32).toString('hex');
      grants.set(token, { userId: rec.userId, return_to: rec.return_to, expires: now() + 10 * 60000 });
      return token;
    },
    get(token) { prune(); return grants.get(token); },
    consume(token) { const rec = grants.get(token); if (rec) invalidate(rec.userId); },
  };
};
