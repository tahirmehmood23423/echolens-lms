'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');

process.env.DB_PATH = path.join(os.tmpdir(), `echolens-shiplens-project-${crypto.randomUUID()}.json`);
const { Users, Events, allData } = require('../store');
const { project } = require('../shiplens-content');

test('ShipLens requires a live project and keeps an earlier attachment on link updates', () => {
  const owner = Users.createFixed({ name: 'ShipLens Builder', role: 'free', username: 'shiplens.project',
    email: 'shiplens-project@example.com', password: 'TestPassword123!' });
  const event = Events.create({ title: 'ShipLens project submission', kind: 'competition', series_kind: 'shiplens',
    entry: 'paid', scope: 'both', starts_at: '2026-01-01T00:00', ends_at: '2026-01-03T00:00', problems: [project] }, owner.id);
  event.shiplens_submission_deadline = '2099-01-01T00:00';
  allData().event_entries.push({ id: 401, event_id: event.id, user_id: owner.id, challenge_pid: 1,
    payment_status: 'confirmed', team_details: [{ name: owner.name, email: owner.email }] });

  const input = { event_id: event.id, user: owner, pid: 1, github_link: 'https://github.com/builder/shiplens',
    file_url: '/uploads/project.zip', file_name: 'project.zip' };
  assert.match(Events.submit(input).error, /live deployment URL/);
  const first = Events.submit({ ...input, render_link: 'https://project.onrender.com' });
  assert.equal(first.error, undefined);
  assert.equal(first.submission.file_name, 'project.zip');

  const updated = Events.submit({ ...input, file_url: null, file_name: null,
    render_link: 'https://project-v2.onrender.com' });
  assert.equal(updated.error, undefined);
  assert.equal(updated.submission.id, first.submission.id);
  assert.equal(updated.submission.file_url, '/uploads/project.zip');
  assert.equal(updated.submission.file_name, 'project.zip');
  assert.equal(updated.submission.render_link, 'https://project-v2.onrender.com');
});
