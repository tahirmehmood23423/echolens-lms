'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { shipLensFinanceEntries } = require('../shiplens-finance');

test('26 teams and 35 candidates count only their own current challans, including legacy partners', () => {
  const entries = [], registrations = [], challans = [];
  let id = 0;
  for (let team = 1; team <= 26; team++) {
    const entry = { id: team, event_id: 7, team_details: [] };
    for (let member = 0; member < (team <= 9 ? 2 : 1); member++) {
      id++;
      const email = `candidate${id}@example.test`;
      entry.team_details.push({ email });
      if (member === 0) entry.registration_id = id;
      registrations.push({ id, email, challan_serial: `C${id}`, status: { shiplens_event_id: 7, shiplens_entry_id: team } });
      challans.push({ id, registration_id: id, serial: `C${id}`, status: id <= 10 ? 'paid' : 'issued', net_fee: 500 });
    }
    entries.push(entry);
  }
  // A course payment, another series, and a stale paid challan must not count.
  registrations.push({ id: 100, email: entries[0].team_details[0].email, status: {} },
    { id: 101, email: entries[0].team_details[0].email, status: { shiplens_event_id: 8, shiplens_entry_id: 1 } });
  challans.push({ id: 100, registration_id: 100, status: 'paid' }, { id: 101, registration_id: 101, status: 'paid' },
    { id: 200, registration_id: 35, serial: 'OLD', status: 'paid' });
  const result = shipLensFinanceEntries(entries, registrations, challans);
  assert.equal(result.length, 26);
  assert.equal(result.flatMap(e => e.member_challans).length, 35);
  assert.equal(result.reduce((sum, e) => sum + e.paid_candidates, 0), 10);
  assert.deepEqual(result[0].registration_ids, [1, 2]);
  assert.equal(result[25].member_challans[0].status, 'issued');
  assert.equal(new Set(result.flatMap(e => e.member_challans.map(c => c.serial))).size, 35);
});

test('missing partner remains missing and invalid explicit links cannot borrow another team payment', () => {
  const entries = [{ id: 1, event_id: 7, registration_ids: [2, 2], team_details: [{ email: 'a@test' }, { email: 'b@test' }] }];
  const registrations = [{ id: 2, email: 'a@test', challan_serial: 'C2', status: { shiplens_event_id: 7, shiplens_entry_id: 2 } }];
  const result = shipLensFinanceEntries(entries, registrations, [{ registration_id: 2, serial: 'C2', status: 'paid' }]);
  assert.deepEqual(result[0].member_challans, [null, null]);
  assert.equal(result[0].paid_candidates, 0);
});
