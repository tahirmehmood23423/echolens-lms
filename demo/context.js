'use strict';

// Enabled only in the separate, credential-free demo worker, never by a
// request header, account role, cookie, or query parameter.
const enabled = process.env.ECHOLENS_DEMO_WORKER === '1';
let locked = false;
module.exports = { enabled, get locked() { return locked; }, lock() { locked = true; } };
