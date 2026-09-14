'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');

process.env.DB_PATH = path.join(os.tmpdir(), `echolens-support-${crypto.randomUUID()}.json`);
const store = require('../store');
const { Feedback, SupportTickets } = store;

test('support tickets stay private and leave the admin queue after resolution', () => {
  const review = Feedback.create({ name: 'Learner', email: 'learner@example.com', message: 'The course was useful.', rating: 5 });
  const createdAround = Date.now();
  const ticket = SupportTickets.create({
    user_id: 42,
    name: 'Learner',
    email: 'LEARNER@example.com',
    category: 'compiler',
    subject: 'Dark editor text is hidden',
    message: 'The code text cannot be read when dark mode is enabled.',
    context: 'Compiler',
  });

  assert.match(ticket.ticket_no, /^EL-\d{6}$/);
  assert.equal(ticket.email, 'learner@example.com');
  const expectedAt = new Date(ticket.expected_by).getTime();
  assert.ok(expectedAt >= createdAround + (48 * 60 * 60 * 1000) - 1000);
  assert.ok(expectedAt <= createdAround + (48 * 60 * 60 * 1000) + 1000);
  assert.deepEqual(Feedback.all().map((item) => item.id), [review.id]);
  assert.equal(Feedback.approved().length, 0);
  assert.deepEqual(SupportTickets.open().map((item) => item.id), [ticket.id]);

  SupportTickets.markAcknowledged(ticket.id, true);
  assert.equal(SupportTickets.byId(ticket.id).acknowledgement_email_sent, true);
  const waiting = SupportTickets.addAdminMessage(ticket.id, 'Which browser and version are you using?', 'Admin User', true);
  assert.equal(waiting.status, 'waiting_on_user');
  assert.equal(waiting.messages[0].author, 'admin');
  assert.equal(SupportTickets.open().length, 1);
  const replied = SupportTickets.addUserMessage(ticket.id, 'Chrome 140 on Windows 11.', { name: 'Learner' });
  assert.equal(replied.status, 'open');
  assert.equal(replied.messages[1].author, 'user');
  assert.equal(SupportTickets.forUser({ id: 42, email: 'learner@example.com' })[0].id, ticket.id);
  assert.equal(SupportTickets.forUser({ id: 77, email: 'other@example.com' }).length, 0);
  const resolved = SupportTickets.resolve(ticket.id, 'The compiler theme contrast was corrected.', 'Admin User', true);
  assert.equal(resolved.status, 'resolved');
  assert.equal(resolved.resolution_email_sent, true);
  assert.equal(SupportTickets.open().length, 0);
  assert.equal(SupportTickets.byId(ticket.id).resolution, 'The compiler theme contrast was corrected.');
  assert.equal(SupportTickets.addUserMessage(ticket.id, 'One more reply', { name: 'Learner' }), null);
});

test('legacy feedback entries without a type remain public-feedback records', () => {
  store.allData().feedback.push({ id: 999, name: 'Legacy', message: 'Older review', status: 'approved', created_at: new Date().toISOString() });
  assert.equal(Feedback.byId(999).name, 'Legacy');
  assert.equal(Feedback.approved().some((item) => item.id === 999), true);
  assert.equal(SupportTickets.byId(999), null);
});
