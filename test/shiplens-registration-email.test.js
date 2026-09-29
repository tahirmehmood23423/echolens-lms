'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');

process.env.DB_PATH = path.join(os.tmpdir(), `echolens-shiplens-email-${crypto.randomUUID()}.json`);
const { Users, Events, Registrations } = require('../store');
const { project } = require('../shiplens-content');

test('ShipLens sends the challan to the entered contact email while retaining the signed-in owner', () => {
  const owner = Users.createFixed({ name: 'Team Lead', role: 'free', username: 'shiplens.lead',
    email: 'account@example.com', password: 'TestPassword123!' });
  owner.reg_no = '1234567';
  const event = Events.create({ title: 'ShipLens email check', kind: 'competition', series_kind: 'shiplens',
    entry: 'paid', scope: 'both', fee_pkr: 500, starts_at: '2026-01-01T00:00',
    ends_at: '2099-01-01T00:00', problems: [project] }, owner.id);
  const contactEmail = 'challan@example.com';
  const out = Events.register({ event_id: event.id, user: owner, challenge_pid: 1,
    team_details: [{ name: 'Team Lead', email: contactEmail, whatsapp: '03001234567',
      university: 'Example University', year: '2' }] });

  assert.equal(out.error, undefined);
  assert.equal(out.entry.user_id, owner.id);
  assert.equal(out.entry.team_details[0].email, contactEmail);
  assert.equal(Registrations.byId(out.entry.registration_id).email, contactEmail);
  assert.equal(out.challan.student_email, contactEmail);
  assert.equal(out.challan.student_id, String(owner.reg_no));
  assert.equal(out.challan.net_fee, 500, 'ShipLens challans charge a flat PKR 500');
  assert.equal(Users.byId(owner.id).email, 'account@example.com');
});

test('ShipLens fixes the fee at PKR 500 when events are created or edited', () => {
  const owner = Users.createFixed({ name: 'Event Admin', role: 'admin', username: 'shiplens.admin',
    email: 'admin@example.com', password: 'TestPassword123!' });
  const event = Events.create({ title: 'ShipLens fee check', kind: 'competition', series_kind: 'shiplens',
    entry: 'paid', scope: 'both', fee_pkr: 1250, starts_at: '2026-01-01T00:00',
    ends_at: '2099-01-01T00:00', problems: [project] }, owner.id);
  assert.equal(event.fee_pkr, 500);
  assert.equal(Events.update(event.id, { fee_pkr: 900 }).fee_pkr, 500);
});
