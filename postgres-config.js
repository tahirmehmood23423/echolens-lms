'use strict';
const fs = require('node:fs');
const path = require('node:path');
const tls = require('node:tls');
const { X509Certificate } = require('node:crypto');

const SUPABASE_CA = path.join(__dirname, 'certs', 'supabase-production-ca.crt');
function certificates(text) {
  const certs = String(text).match(/-----BEGIN CERTIFICATE-----[\s\S]*?-----END CERTIFICATE-----/g);
  if (!certs?.length || /PRIVATE KEY/.test(text)) throw Error('Postgres CA configuration must contain public PEM CA certificates.');
  for (const pem of certs) {
    const cert = new X509Certificate(pem);
    if (!cert.ca) throw Error('Postgres trust configuration contains a certificate that is not a CA.');
    if (Date.parse(cert.validFrom) > Date.now() || Date.parse(cert.validTo) <= Date.now()) throw Error('A configured Postgres CA is not currently valid. Update the provider CA certificate.');
  }
  return certs;
}
function defaultRoots(env) {
  if (tls.getCACertificates) return tls.getCACertificates('default');
  // Node 18/20 fallback. Setting an explicit ca replaces implicit defaults,
  // so retain both bundled roots and an explicitly configured extra CA file.
  return [...tls.rootCertificates, ...(env.NODE_EXTRA_CA_CERTS ? certificates(fs.readFileSync(env.NODE_EXTRA_CA_CERTS, 'utf8')) : [])];
}
function postgresConfig(connectionString, env = process.env) {
  let url;
  try { url = new URL(connectionString); } catch { throw Error('Postgres connection URL is invalid. Check DATABASE_URL without logging its credentials.'); }
  if (!['postgres:', 'postgresql:'].includes(url.protocol)) throw Error('Postgres connection URL must use postgres:// or postgresql://.');
  const sslParams = Object.fromEntries(['sslrootcert', 'sslcert', 'sslkey'].map(k => [k, url.searchParams.get(k)]));
  // pg-connection-string otherwise replaces the explicit ssl object when the
  // URL contains SSL parameters, discarding ca or weakening verification.
  for (const key of ['ssl', 'sslmode', 'sslrootcert', 'sslcert', 'sslkey', 'uselibpqcompat']) url.searchParams.delete(key);
  if (env.PGSSLMODE === 'disable') return { connectionString: url.toString(), ssl: false }; // explicit local-development opt-out
  const host = url.hostname.toLowerCase();
  const isSupabase = host.endsWith('.supabase.co') || host.endsWith('.pooler.supabase.com') || host.endsWith('.pooler.supabase.net');
  let ca = [];
  const rootPath = env.PGSSLROOTCERT || sslParams.sslrootcert;
  if (rootPath) ca = certificates(fs.readFileSync(rootPath, 'utf8'));
  else if (env.PGSSLROOTCERT_PEM) ca = certificates(env.PGSSLROOTCERT_PEM.replace(/\\n/g, '\n'));
  else if (isSupabase) ca = certificates(fs.readFileSync(SUPABASE_CA, 'utf8'));
  const ssl = { rejectUnauthorized: true, ...(ca.length ? { ca: [...defaultRoots(env), ...ca] } : {}) };
  const certPath = env.PGSSLCERT || sslParams.sslcert, keyPath = env.PGSSLKEY || sslParams.sslkey;
  if (certPath) ssl.cert = fs.readFileSync(certPath, 'utf8');
  if (keyPath) ssl.key = fs.readFileSync(keyPath, 'utf8');
  return { connectionString: url.toString(), ssl };
}
module.exports = { postgresConfig, SUPABASE_CA };
