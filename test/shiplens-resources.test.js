'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');

process.env.DB_PATH = path.join(os.tmpdir(), `echolens-shiplens-resources-${crypto.randomUUID()}.json`);
const { Users, Events, allData } = require('../store');
const { project } = require('../shiplens-content');

const admin = Users.createFixed({ name: 'Res Admin', role: 'admin', username: 'shiplens.res.admin', email: 'resadmin@example.com', password: 'TestPassword123!' });
const paid = Users.createFixed({ name: 'Paid Lead', role: 'free', username: 'shiplens.res.paid', email: 'paid@example.com', password: 'TestPassword123!' });
const unpaid = Users.createFixed({ name: 'Unpaid Lead', role: 'free', username: 'shiplens.res.unpaid', email: 'unpaid@example.com', password: 'TestPassword123!' });
const stranger = Users.createFixed({ name: 'Stranger', role: 'free', username: 'shiplens.res.stranger', email: 'stranger@example.com', password: 'TestPassword123!' });

function series() {
  const ev = Events.create({ title: 'ShipLens resources', kind: 'competition', series_kind: 'shiplens', entry: 'paid', scope: 'both',
    starts_at: '2026-01-01T00:00', ends_at: '2026-01-03T00:00', problems: [project] }, admin.id);
  const entries = allData().event_entries;
  entries.push({ id: 9000 + ev.id * 2, event_id: ev.id, user_id: paid.id, challenge_pid: 1, payment_status: 'confirmed', team_details: [{ name: paid.name, email: paid.email }] });
  entries.push({ id: 9001 + ev.id * 2, event_id: ev.id, user_id: unpaid.id, challenge_pid: 1, payment_status: 'pending', team_details: [{ name: unpaid.name, email: unpaid.email }] });
  return ev;
}
const see = (ev, vis, user) => Events.visibleFiles(Events.byId(ev.id), user).some((f) => f.visibility === vis);

test('documents and links are stored with title, note, kind and visibility', () => {
  const ev = series();
  Events.addFile(ev.id, { name: 'Branch data', url: '/uploads/abc-branches.csv', note: 'Seed data', visibility: 'task' });
  const link = Events.addLink(ev.id, { name: 'Figma mockup', url: 'https://figma.com/file/x', visibility: 'public' });
  assert.equal(link.error, undefined);
  const [file, ln] = Events.byId(ev.id).files;
  assert.equal(file.kind, 'file'); assert.equal(file.note, 'Seed data'); assert.ok(file.rid);
  assert.equal(ln.kind, 'link'); assert.equal(ln.visibility, 'public');
  assert.match(Events.addLink(ev.id, { name: 'Bad', url: 'javascript:alert(1)' }).error, /http/);
  assert.match(Events.addLink(ev.id, { name: '', url: 'https://x.dev' }).error, /title/);
  assert.equal(Events.addFile(ev.id, { name: 'X', url: '/uploads/x', visibility: 'everyone' }).files.at(-1).visibility, 'task', 'unknown visibility falls back to the safest');
  Events.removeFile(ev.id, file.rid);
  assert.ok(!Events.byId(ev.id).files.some((f) => f.rid === file.rid));
});

test('task resources stay hidden until the task opens, and only for paid teams', () => {
  const ev = series();
  Events.addFile(ev.id, { name: 'Task doc', url: '/uploads/t-doc.pdf', visibility: 'task' });
  Events.addFile(ev.id, { name: 'Rules', url: '/uploads/t-rules.pdf', visibility: 'teams' });
  Events.addLink(ev.id, { name: 'Overview', url: 'https://example.com/overview', visibility: 'public' });
  // Registration closed, no competition dates yet.
  assert.equal(see(ev, 'task', paid), false);
  assert.equal(see(ev, 'teams', paid), true);
  assert.equal(see(ev, 'teams', unpaid), false);
  assert.equal(see(ev, 'public', stranger), true);
  assert.equal(see(ev, 'public', null), true);
  assert.equal(see(ev, 'task', admin), true);
  // Admin opens the window: task resources open for paid teams only.
  Events.setShipLensWindow(ev.id, { task_opens_at: '2026-01-04T00:00', submission_deadline: '2099-01-01T00:00' });
  assert.equal(see(ev, 'task', paid), true);
  assert.equal(see(ev, 'task', unpaid), false);
  assert.equal(see(ev, 'task', stranger), false);
  assert.equal(see(ev, 'task', null), false);
});

test('legacy attachments without a visibility are treated as task resources', () => {
  const ev = series();
  Events.byId(ev.id).files = [{ name: 'old.pdf', url: '/uploads/old.pdf' }];
  assert.equal(Events.visibleFiles(Events.byId(ev.id), paid).length, 0);
  Events.removeFile(ev.id, 'old.pdf');
  assert.equal(Events.byId(ev.id).files.length, 0, 'old attachments are still removable by name');
});
