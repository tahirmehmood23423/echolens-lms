# Supabase production certificate authorities

These are public CA certificates, not private keys. They are used only for
Supabase database hostnames; ordinary providers retain Node's normal trust store.
Both the original and rotated production roots are included. Staging is excluded.

Source: Supabase official CLI, commit `192c6a5ddd2c229768064e93ad15be00d285e371`,
[`apps/cli/src/command-internal/pgdelta-ssl.ts`](https://github.com/supabase/cli/blob/192c6a5ddd2c229768064e93ad15be00d285e371/apps/cli/src/command-internal/pgdelta-ssl.ts).
Retrieved over the configured HTTPS Git proxy. Each certificate is checked for
CA status, self-signature and validity in the regression suite.

Refresh these certificates from the provider before they expire. A custom
`PGSSLROOTCERT` file or `PGSSLROOTCERT_PEM` value takes precedence.
