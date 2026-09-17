'use strict';
// Explicit mail-only sample sender. Never imports the store, server or database.
const fs = require('fs'), path = require('path');
const policy = require('../free-course-policy');
const now = Date.now(), track = { key: 'fc01-c-basics', title: 'Sample Free Certified Course' };
const enrollment = { enrolled_at: new Date(now - 14 * policy.DAY).toISOString() };
const toIndex = process.argv.indexOf('--to'), to = toIndex < 0 ? null : process.argv[toIndex + 1];
if (to && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) throw Error('Provide a valid sample-recipient email.');
const samples = ['inactive', 'completion', 'expired'].map(kind => {
  const record = kind === 'expired' ? { enrolled_at: new Date(now - 100 * policy.DAY).toISOString() } : enrollment;
  const message = policy.messageFor({ name: 'Fictional Demo Learner', email: to || 'CEO_ADDRESS_PENDING' }, record, track, kind, now);
  return { kind, ...message, subject: '[SAMPLE] ' + message.subject, text: 'SAMPLE ONLY - fictional learner; no real enrollment was changed.\n\n' + message.text };
});
const target = path.join(__dirname, '../qa-implementation/evidence/free-course-reminder-samples.json');
fs.writeFileSync(target, JSON.stringify(samples, null, 2));
if (!process.argv.includes('--send')) { console.log('Three sample emails prepared; no mail sent.'); process.exit(0); }
if (!to) throw Error('--send requires an explicit --to recipient.');
// Only copy transactional-mail settings from .env; never load DATABASE_URL.
const envFile = path.join(__dirname, '../.env');
const settings = fs.existsSync(envFile) ? require('dotenv').parse(fs.readFileSync(envFile)) : {};
for (const name of ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'SMTP_RATE_LIMIT', 'SMTP_RATE_DELTA_MS', 'MAIL_FROM', 'ZEPTO_SEND_MAIL_TOKEN', 'ZEPTO_SEND_MAIL_URL']) {
  if (process.env[name] == null && settings[name] != null) process.env[name] = settings[name];
}
(async () => {
  const mailer = require('../mailer');
  if (!mailer.configured) throw Error('Transactional mail is not configured. Samples remain prepared.');
  const results = [];
  for (const sample of samples) {
    const result = await mailer.send(sample);
    results.push({ kind: sample.kind, to, accepted: !!result?.sent });
    fs.writeFileSync(target.replace('samples.json', 'sample-delivery.json'), JSON.stringify(results, null, 2));
    if (!result?.sent) throw Error('Provider did not accept the sample; stopped.');
    console.log(sample.kind + ': accepted by transactional provider');
    await new Promise(resolve => setTimeout(resolve, 600));
  }
  require('../mail-provider').getTransactionalProvider().close?.();
})().catch(error => { console.error('Sample send failed: ' + error.message); require('../mail-provider').getTransactionalProvider().close?.(); process.exitCode = 1; });
