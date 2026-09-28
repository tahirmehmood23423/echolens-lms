'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { correctLegacyShipLensSeries, project } = require('../shiplens-content');

function draft(entries = []) {
  return {
    events: [{ id: 9, title: 'ShipLens 1.0', series_kind: 'shiplens', fee_pkr: 500,
      starts_at: '2026-09-28T15:00', ends_at: '2026-10-11T23:59',
      problems: [{ pid: 1 }, { pid: 2 }, { pid: 3 }] }],
    event_entries: entries,
  };
}

test('unregistered ShipLens 1.0 becomes one detailed project without changing its schedule or fee', () => {
  const data = draft();
  assert.equal(correctLegacyShipLensSeries(data), 1);
  const event = data.events[0];
  assert.equal(event.id, 9);
  assert.equal(event.fee_pkr, 500);
  assert.equal(event.starts_at, '2026-09-28T15:00');
  assert.equal(event.ends_at, '2026-10-11T23:59');
  assert.equal(event.problems.length, 1);
  assert.deepEqual(event.problems[0], project);
  for (const key of ['description', 'objective', 'deliverables', 'acceptance_criteria', 'visual_url']) {
    assert.ok(event.problems[0][key], `${key} is present`);
  }
  assert.equal(correctLegacyShipLensSeries(data), 0, 'migration is idempotent');
});

test('registered teams are not silently moved to another project', () => {
  const data = draft([{ id: 1, event_id: '9', challenge_pid: 3 }]);
  assert.equal(correctLegacyShipLensSeries(data), 0);
  assert.equal(data.events[0].problems.length, 3);
});
