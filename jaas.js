'use strict';
/* ============================================================================
 * JaaS (8x8.vc) live-class authentication.
 *
 * The private key lives ONLY here on the server and never reaches the
 * browser. Each time a user joins a live class, the server mints a fresh,
 * short-lived JWT scoped to that one room and hands only the token (not the
 * key) to the client, which passes it to the Jitsi iframe API.
 *
 * Configure via JAAS_APP_ID, JAAS_KID and JAAS_PRIVATE_KEY (see .env.example).
 * When unconfigured (e.g. local dev without the secret), `configured` is
 * false and callers fall back to the public, unauthenticated meet.jit.si
 * server so nothing breaks.
 * ========================================================================== */
const jwt = require('jsonwebtoken');

const APP_ID = process.env.JAAS_APP_ID || '';
const KID = process.env.JAAS_KID || '';
// Accept either a real multi-line PEM or a single-line value with escaped
// \n (common when a hosting dashboard's env var UI won't take newlines).
const PRIVATE_KEY = (process.env.JAAS_PRIVATE_KEY || '').replace(/\\n/g, '\n').trim();

const configured = !!(APP_ID && KID && PRIVATE_KEY);

// Signs a JWT scoped to one specific room (not "*") so a leaked token can't
// be replayed into any other room on the tenant. Moderators (teachers/admin)
// get recording rights; everyone else joins as a plain participant.
function sign({ room, user, moderator }) {
  const nowSec = Math.floor(Date.now() / 1000);
  return jwt.sign(
    {
      aud: 'jitsi', iss: 'chat', sub: APP_ID, room: String(room),
      nbf: nowSec - 10,
      context: {
        features: {
          livestreaming: !!moderator, 'file-upload': true, 'outbound-call': false,
          'sip-outbound-call': false, transcription: true, 'list-visitors': false,
          recording: !!moderator, flip: false,
        },
        user: {
          'hidden-from-recorder': false, moderator: !!moderator,
          name: String(user.name || 'Guest'), id: String(user.id),
          avatar: user.avatar || '', email: user.email || '',
        },
      },
    },
    PRIVATE_KEY,
    { algorithm: 'RS256', expiresIn: '3h', keyid: KID },
  );
}

module.exports = { configured, appId: APP_ID, sign };
