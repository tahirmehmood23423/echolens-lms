# Render startup: Supabase certificate trust

The previous TLS hardening required certificate authentication without supplying
the Supabase CA chain. Consequently startup could fail with
`self-signed certificate in certificate chain` even with valid database credentials.

`postgres-config.js` now supplies both official Supabase production roots for
Supabase database hosts, retaining Node's normal trusted CAs for public chains.
The certificates come from Supabase's official CLI, with pinned provenance and
fingerprints in `certs/README.md` and `test/postgres-tls.test.js`. Staging CAs
are excluded. No certificate is downloaded dynamically during startup.

Both the raw pg pool and Prisma adapter use this shared configuration. URL SSL
parameters are normalized so pg cannot discard the explicit CA or weaken
verification. Hostname and certificate verification remain enabled. Explicit
custom CA files (`PGSSLROOTCERT`, including a URL's `sslrootcert`) and inline
public PEM (`PGSSLROOTCERT_PEM`) remain available for other providers. The existing
explicit local-only development setting `PGSSLMODE=disable` is preserved.

No Render variable change should be necessary for the existing Supabase direct
or pooler hostname. Redeploy the repaired `v8-test` revision and check startup.
Production database access is not available in this development session, so a
successful live deployment is not claimed before observing those logs.

Validation: 27 isolated regressions passed, including eight TLS checks, real
successful and rejected TLS handshakes, hostname rejection, CA override handling,
URL parameter handling, assessment integrity, certificate issuance and Talent
startup resilience. The tests never connect to the production database and do
not change schema or student data.
