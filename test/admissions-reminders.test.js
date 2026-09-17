'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createAdmissionsReminders, schedule, validDate, localTime } = require('../admissions-reminders');
function fixture() {
  let now = new Date('2026-10-17T04:00:00Z');
  let data = { registrations: [{ id: 1, name: 'Sample Applicant', email: 'applicant@qa.invalid', challan_serial: 'C1', payment_stage: 'challan_sent', status: { receipt_token: 'a'.repeat(64), delivery: { state: 'provider_accepted', reference: 'C1' } } }],
    challans: [{ serial: 'C1', registration_id: 1, deadline: '2026-10-25', student_email: 'applicant@qa.invalid', course_title: 'Sample course', net_fee: 12500, status: 'issued' }] };
  let durable = structuredClone(data);
  let pending = null;
  const store = { Registrations: { all: () => data.registrations, byId: id => data.registrations.find(r => r.id === Number(id)) }, Challans: { bySerial: id => data.challans.find(c => c.serial === id) },
    persist() { pending = structuredClone(data); }, async pendingPersist() { durable = pending; }, Suppressions: { has: () => false } };
  const messages = [];
  const mailer = { configured: true, async send(m) { messages.push(m); return { sent: true, id: 'provider-' + messages.length }; } };
  const create = () => createAdmissionsReminders(store, mailer, { clock: () => now, pause: async () => {} });
  return { store, mailer, messages, create, get data() { return data; }, get durable() { return durable; }, restart() { data = structuredClone(durable); return create(); }, date(day, hour = '04:00:00') { now = new Date(day + 'T' + hour + 'Z'); } };
}
test('calendar schedule uses Pakistan dates, including month/year/leap boundaries', () => {
  assert.deepEqual(schedule('2026-10-25').map(s => s.date), ['2026-10-18', '2026-10-21', '2026-10-22', '2026-10-24', '2026-10-25', '2026-10-26']);
  assert.equal(schedule('2027-01-01')[0].date, '2026-12-25');
  assert.equal(schedule('2028-03-01')[4].date, '2028-03-01');
  for (const d of ['2026-02-29', '2026-04-31', '2026-00-25', '2026-13-01', '25/10/2026', null]) assert.equal(validDate(d), false);
  assert.equal(validDate('2028-02-29'), true);
  assert.deepEqual(localTime(new Date('2026-10-17T20:00:00Z')), { date: '2026-10-18', hour: 1 });
});
test('six reminders are delivered once, persist across restart, and stop after the extension email', async () => {
  const f = fixture(); let service = f.create(); await service.configure('C1', true, 9);
  for (const day of ['18', '21', '22', '24', '25', '26']) {
    f.date('2026-10-' + day, '03:59:00'); assert.equal((await service.run()).sent, 0);
    f.date('2026-10-' + day); assert.equal((await service.run()).sent, 1);
    service = f.restart(); assert.equal((await service.run()).sent, 0);
  }
  f.date('2026-10-30'); assert.equal((await service.run()).sent, 0);
  assert.equal(f.messages.length, 6);
  assert.match(f.messages[4].subject, /due today/);
  assert.match(f.messages[5].text, /text 0314148929 or email finance@echolens.digital/);
  assert.match(f.messages[5].text, /does not automatically extend/);
  assert.match(f.messages[0].text, /PKR 12,500/);
  assert.match(f.messages[0].text, /registration-status#[a]{64}/);
  assert.match(f.messages[0].text, /do not pay twice/);
  assert.ok(service.view('C1').steps.every(s => s.state === 'provider_accepted'));
});
test('draft, paused, paid, enrolled, suppressed, invalid and replaced challans are excluded', async () => {
  for (const mutate of [f => { f.data.registrations[0].status.delivery = null; }, f => { f.data.challans[0].status = 'paid'; }, f => { f.data.registrations[0].payment_stage = 'paid_cleared'; }, f => { f.data.registrations[0].payment_stage = 'enrolled'; }, f => { f.data.registrations[0].challan_serial = 'C2'; }, f => { f.data.challans[0].student_email = ''; }, f => { f.data.challans[0].net_fee = 0; }, f => { f.store.Suppressions.has = () => true; }]) {
    const f = fixture(), service = f.create(); await service.configure('C1', true, 9); mutate(f); f.date('2026-10-18'); await service.run(); assert.equal(f.messages.length, 0);
  }
  const f = fixture(), service = f.create(); await service.configure('C1', true, 9); await service.configure('C1', false, 9); f.date('2026-10-18'); await service.run(); assert.equal(f.messages.length, 0);
  await service.configure('C1', true, 9); await service.run(); assert.equal(f.messages.length, 1);
  await service.configure('C1', false, 9); await service.configure('C1', true, 9); await service.run(); assert.equal(f.messages.length, 1);
  f.data.challans[0].status = 'paid'; await assert.rejects(service.configure('C1', true, 9), /Payment is already verified/);
});
test('late generation skips earlier dates, and downtime sends only the latest due reminder', async () => {
  const f = fixture(), service = f.create(); f.date('2026-10-23'); await service.configure('C1', true, 9); await service.run(); assert.equal(f.messages.length, 0);
  f.date('2026-10-24'); await service.run(); assert.equal(f.messages.length, 1);
  const g = fixture(), other = g.create(); await other.configure('C1', true, 9); g.date('2026-10-24'); await other.run(); await other.run(); assert.equal(g.messages.length, 1);
  assert.equal(other.view('C1').steps.filter(s => s.state === 'skipped').length, 3);
  g.date('2026-10-29'); await other.run(); assert.equal(g.messages.length, 2); assert.match(g.messages[1].subject, /need more time/);
});
test('parallel checks and a payment during durable claim do not send duplicate or paid reminders', async () => {
  const f = fixture(), service = f.create(); await service.configure('C1', true, 9); f.date('2026-10-18');
  await Promise.all([service.run(), service.run(), service.run()]); assert.equal(f.messages.length, 1);
  const g = fixture(), other = g.create(); await other.configure('C1', true, 9); g.date('2026-10-18');
  const persist = g.store.pendingPersist;
  g.store.pendingPersist = async () => { await persist(); g.data.challans[0].status = 'paid'; };
  await other.run(); assert.equal(g.messages.length, 0);
});
test('storage failure prevents sending; an uncertain delivery is not automatically resent after restart', async () => {
  const f = fixture(), service = f.create(); await service.configure('C1', true, 9); f.date('2026-10-18');
  f.store.pendingPersist = async () => { throw Error('Synthetic storage failure'); };
  await assert.rejects(service.run(), /storage failure/); assert.equal(f.messages.length, 0);
  const g = fixture(); let other = g.create(); await other.configure('C1', true, 9); g.date('2026-10-18');
  const persist = g.store.pendingPersist;
  g.store.pendingPersist = async () => { if (g.messages.length) throw Error('Acknowledgement persistence failure'); await persist(); };
  await assert.rejects(other.run(), /persistence failure/); assert.equal(g.messages.length, 1);
  g.store.pendingPersist = persist; other = g.restart(); await other.run(); assert.equal(g.messages.length, 1);
  assert.equal(other.view('C1').steps[0].state, 'delivery_unknown');
});
test('explicit rejection retries are bounded, transport timeouts are not replayed', async () => {
  const f = fixture(), service = f.create(); await service.configure('C1', true, 9); f.date('2026-10-18'); let attempts = 0;
  f.mailer.send = async () => { attempts++; const error = Error('Provider rejected'); error.statusCode = 503; throw error; };
  for (const hour of ['04', '04', '05', '06', '07']) { f.date('2026-10-18', hour + ':00:00'); await service.run(); }
  assert.equal(attempts, 3); assert.equal(service.view('C1').steps[0].state, 'failed');
  const g = fixture(), other = g.create(); await other.configure('C1', true, 9); g.date('2026-10-18'); let calls = 0;
  g.mailer.send = async () => { calls++; throw Error('Network timeout'); }; await other.run(); g.date('2026-10-18', '08:00:00'); await other.run();
  assert.equal(calls, 1); assert.equal(other.view('C1').steps[0].state, 'delivery_unknown');
});
test('legacy challans are not enrolled automatically and provider configuration is required', async () => {
  const f = fixture(), service = f.create(); f.date('2026-10-18'); await service.run(); assert.equal(f.messages.length, 0);
  assert.equal(service.view('C1').enabled, false); await service.configure('C1', true, 9);
  f.mailer.configured = false; await service.run(); assert.equal(f.messages.length, 0);
});
test('reminder settings and delivery history round-trip through the production Prisma JSON mapping', async () => {
  const f = fixture(), service = f.create(); await service.configure('C1', true, 9); f.date('2026-10-18'); await service.run();
  const mapping = require('../schema-map');
  const columns = mapping.COLLECTIONS.find(c => c[0] === 'registrations')[3];
  const written = mapping.buildPrismaRow('registrations', columns, f.data.registrations[0], 'reminder-test');
  const restored = mapping.rowFromPrisma('registrations', columns, written);
  assert.deepEqual(restored.status, f.data.registrations[0].status);
});
test('capped sweeps continue with remaining applicants and sender rejection stops the run', async () => {
  const f = fixture();
  for (const id of [2, 3]) {
    f.data.registrations.push({ ...structuredClone(f.data.registrations[0]), id, challan_serial: 'C' + id, status: { delivery: { state: 'provider_accepted', reference: 'C' + id } } });
    f.data.challans.push({ ...f.data.challans[0], serial: 'C' + id, registration_id: id });
  }
  const service = createAdmissionsReminders(f.store, f.mailer, { clock: () => new Date('2026-10-18T04:00:00Z'), pause: async () => {}, maxPerRun: 2 });
  for (const id of [1, 2, 3]) await service.configure('C' + id, true, 9);
  assert.equal((await service.run()).sent, 2); assert.equal((await service.run()).sent, 1); assert.equal(f.messages.length, 3);
  const g = fixture(), other = g.create(); await other.configure('C1', true, 9); g.date('2026-10-18');
  g.mailer.send = async () => { const err = Error('Sender blocked'); err.statusCode = 429; throw err; };
  const result = await other.run(); assert.equal(result.failed, 1); assert.equal(result.attempted, 1);
});
