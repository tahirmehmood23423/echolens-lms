'use strict';
const { test } = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), os = require('node:os'), path = require('node:path');
const { fork } = require('node:child_process'), { once } = require('node:events');
const { pages, render } = require('../legal-pages');
const { groups } = require('../public-footer');

test('public information routes, every header/footer target and contact submission work without production services', { timeout: 90000 }, async t => {
  const runtime = fs.mkdtempSync(path.join(os.tmpdir(), 'echolens-legal-pages-'));
  const child = fork(path.join(__dirname, 'fixtures/legal-pages-server.cjs'), [], { env: { ...process.env, ECHOLENS_TEST_RUNTIME: runtime }, silent: true, execArgv: [] });
  let logs = ''; child.stdout.on('data', data => logs += data); child.stderr.on('data', data => logs += data);
  t.after(async () => {
    const workers = path.join(runtime, 'workers.json');
    if (fs.existsSync(workers)) for (const pid of JSON.parse(fs.readFileSync(workers))) { try { process.kill(pid); } catch {} }
    if (child.exitCode === null && child.signalCode === null) { const exited = once(child, 'exit'); child.kill(); await exited; }
    assert.equal(path.dirname(path.resolve(runtime)), path.resolve(os.tmpdir()));
    assert.ok(path.basename(runtime).startsWith('echolens-legal-pages-'));
    fs.rmSync(runtime, { recursive: true, force: true });
  });
  const ready = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(Error(logs)), 20000);
    child.once('message', data => { clearTimeout(timer); resolve(data); });
    child.once('exit', () => { clearTimeout(timer); reject(Error(logs)); });
  });
  const base = 'http://127.0.0.1:' + ready.port;
  for (const route of [...Object.keys(pages), '/privacy', '/privacy.html']) {
    const response = await fetch(base + route), html = await response.text();
    assert.equal(response.status, 200, route);
    assert.match(html, /<meta name="description" content="[^"]+">/);
    assert.match(html, /<time datetime="2026-09-18">18 September 2026<\/time>/);
    assert.ok(html.includes(require('../public-navigation').render()), route + ' shared header');
    for (const legal of Object.keys(pages)) assert.ok(html.includes(`href="${legal}"`), route + ' footer missing ' + legal);
  }
  const { anchors, crawl } = await import('../scripts/check-links.mjs');
  const navTargets = new Set([...anchors(require('../public-navigation').render()), ...groups.flatMap(([, links]) => links.map(([, target]) => target)), '/privacy']);
  for (const target of navTargets) if (target.startsWith('/')) assert.equal((await fetch(base + target)).status, 200, target);
  const result = await crawl(base, { log() {} });
  assert.deepEqual(result.failures, [], JSON.stringify(result.failures));
  // Existing placeholder anchors are reported, rather than hidden or deleted.
  fs.writeFileSync(path.join(runtime, 'crawl.json'), JSON.stringify(result));
  console.log('PUBLIC_LINK_AUDIT ' + JSON.stringify(result));
  const submit = body => fetch(base + '/api/public/support-tickets', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  assert.equal((await submit({ name: 'Student', email: 'bad', subject: 'Privacy request', message: 'Please correct my account.' })).status, 400);
  const response = await submit({ name: 'Synthetic Student', email: 'student@qa.invalid', category: 'account', subject: 'Privacy correction request', message: 'Please explain how I can correct my account details.', context: '/contact' });
  assert.equal(response.status, 201);
  const body = await response.json(); assert.match(body.ticket.ticket_no, /^EL-\d{6}$/);
  assert.equal(body.email_sent, false); assert.match(body.ticket.reply_url, /\/open#ticket=EL-\d{6}&token=/);
  const ticketURL = new URL(body.ticket.reply_url), parameters = new URLSearchParams(ticketURL.hash.slice(1));
  const ticket = await fetch(base + '/api/public/support-tickets/' + parameters.get('ticket') + '?token=' + encodeURIComponent(parameters.get('token')));
  assert.equal(ticket.status, 200); assert.equal((await ticket.json()).ticket.subject, 'Privacy correction request');
});

test('required ad choices and unresolved age/retention facts remain explicit', () => {
  const privacy = render('/privacy-policy');
  assert.ok(privacy.includes('https://www.google.com/settings/ads'));
  assert.ok(privacy.includes('https://www.aboutads.info/choices'));
  for (const field of ['COMPANY_ADDRESS', 'MINIMUM_ACCOUNT_AGE', 'PARENTAL_CONSENT_AND_CHILDRENS_DATA_PRACTICE', 'DATA_RETENTION_AND_DELETION_POLICY']) assert.ok(privacy.includes(`[[${field} — TAHIR TO FILL]]`));
  assert.ok(render('/terms').includes('[[LEARNER_PAYMENT_CANCELLATION_AND_REFUND_POLICY — TAHIR TO FILL]]'));
});
