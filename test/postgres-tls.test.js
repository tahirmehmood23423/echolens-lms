'use strict';
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const tls = require('node:tls');
const { X509Certificate } = require('node:crypto');
const { execFileSync } = require('node:child_process');
const { once } = require('node:events');
const ConnectionParameters = require('pg/lib/connection-parameters');
const { postgresConfig, SUPABASE_CA } = require('../postgres-config');

let temp, server, port, ca;
before(async () => {
  temp = fs.mkdtempSync(path.join(os.tmpdir(), 'echolens-tls-'));
  const openssl = args => execFileSync('openssl', args, { cwd: temp, stdio: 'ignore', timeout: 10000 });
  openssl(['req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-keyout', 'ca.key', '-out', 'ca.crt', '-days', '2', '-subj', '/CN=EchoLens isolated test CA', '-addext', 'basicConstraints=critical,CA:TRUE']);
  openssl(['req', '-newkey', 'rsa:2048', '-nodes', '-keyout', 'server.key', '-out', 'server.csr', '-subj', '/CN=localhost']);
  fs.writeFileSync(path.join(temp, 'extensions'), 'subjectAltName=DNS:localhost,IP:127.0.0.1\nextendedKeyUsage=serverAuth\n');
  openssl(['x509', '-req', '-in', 'server.csr', '-CA', 'ca.crt', '-CAkey', 'ca.key', '-CAcreateserial', '-out', 'server.crt', '-days', '2', '-extfile', 'extensions']);
  ca = fs.readFileSync(path.join(temp, 'ca.crt'), 'utf8');
  server = tls.createServer({ key: fs.readFileSync(path.join(temp, 'server.key')), cert: fs.readFileSync(path.join(temp, 'server.crt')) + ca }, socket => socket.end('trusted'));
  server.on('tlsClientError', () => {}); server.listen(0, '127.0.0.1'); await once(server, 'listening'); port = server.address().port;
});
after(async () => { if (server) await new Promise(resolve => server.close(resolve)); if (temp) fs.rmSync(temp, { recursive: true, force: true }); });
function connect(ssl, servername = 'localhost') {
  return new Promise((resolve, reject) => {
    const socket = tls.connect({ host: '127.0.0.1', port, ...ssl, servername });
    let text = ''; socket.on('data', d => { text += d; }); socket.once('end', () => resolve(text)); socket.once('error', reject);
  });
}
test('provider production roots are valid CA certificates, pinned to the official published fingerprints', () => {
  const certs = fs.readFileSync(SUPABASE_CA, 'utf8').match(/-----BEGIN CERTIFICATE-----[\s\S]*?-----END CERTIFICATE-----/g).map(pem => new X509Certificate(pem));
  assert.equal(certs.length, 2);
  assert.deepEqual(certs.map(c => c.fingerprint256), [
    '80:70:25:AD:50:D4:ED:21:9D:2C:9C:7D:29:9C:00:4F:82:4E:B0:0C:F7:F6:5A:FE:F6:07:D0:7B:72:E6:CA:FA',
    '5F:9B:77:95:1A:7A:A1:30:3F:9B:58:EE:A9:BF:A8:9E:35:8C:FD:C1:5F:97:86:FF:10:D4:93:0A:72:2C:9A:E2',
  ]);
  for (const cert of certs) { assert.ok(cert.ca); assert.ok(cert.verify(cert.publicKey)); assert.ok(Date.parse(cert.validTo) > Date.now()); assert.doesNotMatch(cert.subject, /Staging/); }
});
test('Supabase direct and pooler hosts receive provider trust; lookalike and unrelated hosts do not', () => {
  for (const host of ['db.example.supabase.co', 'aws-0-example.pooler.supabase.com']) {
    const cfg = postgresConfig(`postgresql://user:synthetic@${host}/postgres`, {});
    assert.equal(cfg.ssl.rejectUnauthorized, true); assert.ok(cfg.ssl.ca.length > 2);
  }
  for (const host of ['db.example.com', 'supabase.co.attacker.invalid', 'not-supabase.co']) assert.equal(postgresConfig(`postgresql://user@${host}/db`, {}).ssl.ca, undefined);
});
test('connection URL SSL flags cannot erase the trusted CA or disable validation in pg', () => {
  const cfg = postgresConfig('postgresql://user:synthetic@db.example.supabase.co/postgres?sslmode=require&ssl=false&uselibpqcompat=true&application_name=echolens', {});
  const parsed = new ConnectionParameters(cfg);
  assert.equal(parsed.ssl.rejectUnauthorized, true); assert.ok(parsed.ssl.ca.length > 2);
  assert.equal(new URL(cfg.connectionString).searchParams.get('application_name'), 'echolens');
  assert.equal(new URL(cfg.connectionString).searchParams.has('sslmode'), false);
});
test('untrusted self-signed server chain is rejected rather than silently bypassed', async () => {
  await assert.rejects(connect(postgresConfig('postgresql://user@localhost/db', {}).ssl), e => ['SELF_SIGNED_CERT_IN_CHAIN', 'UNABLE_TO_VERIFY_LEAF_SIGNATURE'].includes(e.code));
});
test('CA file permits a real TLS handshake while hostname authentication remains enabled', async () => {
  const cfg = postgresConfig('postgresql://user@localhost/db?sslmode=require', { PGSSLROOTCERT: path.join(temp, 'ca.crt') });
  assert.equal(await connect(new ConnectionParameters(cfg).ssl), 'trusted');
  await assert.rejects(connect(cfg.ssl, 'incorrect-host.invalid'), e => e.code === 'ERR_TLS_CERT_ALTNAME_INVALID');
});
test('inline PEM supports Render environment variables, with custom trust taking precedence', async () => {
  const cfg = postgresConfig('postgresql://user@db.example.supabase.co/db', { PGSSLROOTCERT_PEM: ca.replace(/\n/g, '\\n') });
  assert.equal(await connect(cfg.ssl), 'trusted');
  assert.ok(!cfg.ssl.ca.some(pem => pem.includes('MIIDxDCCAqyg')));
});
test('URL CA paths work and malformed CA configuration fails closed', async () => {
  const cfg = postgresConfig('postgresql://user@localhost/db?sslrootcert=' + encodeURIComponent(path.join(temp, 'ca.crt')), {});
  assert.equal(await connect(cfg.ssl), 'trusted');
  assert.throws(() => postgresConfig('postgresql://user@localhost/db', { PGSSLROOTCERT_PEM: 'not a certificate' }), /public PEM CA/);
});
test('explicit non-TLS local configuration is preserved', () => {
  assert.equal(postgresConfig('postgresql://user@localhost/db', { PGSSLMODE: 'disable' }).ssl, false);
});
