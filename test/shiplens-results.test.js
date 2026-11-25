'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');

process.env.DB_PATH = path.join(os.tmpdir(), `echolens-shiplens-results-${crypto.randomUUID()}.json`);
const { Users, Events, allData } = require('../store');
const { project } = require('../shiplens-content');

const admin = Users.createFixed({ name: 'Results Admin', role: 'admin', username: 'shiplens.results.admin', email: 'resultsadmin@example.com', password: 'TestPassword123!' });
let n = 0;
function team({ autoCert = false, partnerAccount = true } = {}) {
  n++;
  const lead = Users.createFixed({ name: `Lead ${n}`, role: 'free', username: `sl.lead.${n}`, email: `lead${n}@example.com`, password: 'TestPassword123!' });
  const partner = partnerAccount ? Users.createFixed({ name: `Partner ${n}`, role: 'free', username: `sl.partner.${n}`, email: `partner${n}@example.com`, password: 'TestPassword123!' }) : null;
  const ev = Events.create({ title: `ShipLens results ${n}`, kind: 'competition', series_kind: 'shiplens', entry: 'paid', scope: 'both', pass_mark: 60,
    auto_certificate: autoCert, starts_at: '2026-01-01T00:00', ends_at: '2026-01-03T00:00', problems: [project] }, admin.id);
  const entry = { id: 7000 + n, event_id: ev.id, user_id: lead.id, challenge_pid: 1, payment_status: 'confirmed',
    team_details: [{ name: lead.name, email: lead.email }, { name: `Partner ${n}`, email: `partner${n}@example.com` }] };
  allData().event_entries.push(entry);
  return { ev, entry, lead, partner };
}
const certsFor = (ev) => allData().certificates.filter((c) => c.source_kind === 'event' && String(c.source_id) === String(ev.id));

test('grading a team with no portal submission records an email submission that counts everywhere', () => {
  const { ev, entry, lead, partner } = team();
  const out = Events.gradeShipLensTeam(ev.id, entry.id, { score: 72, remarks: 'Solid work', github_link: 'https://github.com/a/b', live_link: 'https://b.onrender.com' }, admin.id);
  assert.equal(out.error, undefined);
  assert.equal(out.passed, true);
  assert.equal(out.submission.submitted_via, 'email');
  assert.equal(out.submission.entry_id, entry.id);
  const [row] = Events.shipLensResults(Events.byId(ev.id));
  assert.equal(row.submission.via, 'email');
  assert.equal(row.submission.score, 72);
  assert.equal(row.submission.live_link, 'https://b.onrender.com');
  // Both members see the same reviewed result.
  assert.equal(Events.progressFor(ev, lead.id).passed, true);
  assert.equal(Events.progressFor(ev, partner.id).passed, true);
  // Regrading updates the same record rather than adding another.
  Events.gradeShipLensTeam(ev.id, entry.id, { score: 40 }, admin.id);
  assert.equal(allData().event_submissions.filter((s) => s.entry_id === entry.id).length, 1);
  assert.equal(Events.shipLensResults(Events.byId(ev.id))[0].passed, false);
});

test('grade validation', () => {
  const { ev, entry } = team();
  assert.match(Events.gradeShipLensTeam(ev.id, entry.id, { score: 120 }, admin.id).error, /0 to 100/);
  assert.match(Events.gradeShipLensTeam(ev.id, entry.id, { score: '' }, admin.id).error, /0 to 100/);
  assert.match(Events.gradeShipLensTeam(ev.id, entry.id, { score: 70, github_link: 'not a url' }, admin.id).error, /GitHub/);
  assert.match(Events.gradeShipLensTeam(ev.id, 999999, { score: 70 }, admin.id).error, /not found/);
});

test('admin issues and revokes certificates per member; a member without an account is reported', () => {
  const { ev, entry, lead } = team({ partnerAccount: false });
  const first = Events.issueShipLensCertificate(ev.id, entry.id, 0, admin.id);
  assert.ok(first.cert.serial);
  assert.equal(first.user.id, lead.id);
  assert.equal(Events.issueShipLensCertificate(ev.id, entry.id, 0, admin.id).existing, true, 'issuing twice does not duplicate');
  assert.equal(Events.issueShipLensCertificate(ev.id, entry.id, 1, admin.id).error, 'no_account');
  const row = Events.shipLensResults(Events.byId(ev.id))[0];
  assert.equal(row.members[0].certificate.serial, first.cert.serial);
  assert.equal(row.members[1].has_account, false);
  assert.equal(Events.revokeShipLensCertificate(ev.id, first.cert.id).ok, true);
  assert.equal(certsFor(ev).length, 0);
  assert.ok(Events.revokeShipLensCertificate(ev.id + 1000, first.cert.id).error);
});

test('auto-certificate on a passing grade covers both team members', () => {
  const { ev, entry, lead, partner } = team({ autoCert: true });
  Events.gradeShipLensTeam(ev.id, entry.id, { score: 90 }, admin.id);
  const out = Events.maybeCertify(Events.byId(ev.id), lead.id, admin.id);
  assert.equal(out.issued.length, 2);
  assert.deepEqual(certsFor(ev).map((c) => c.user_id).sort(), [lead.id, partner.id].sort());
});
