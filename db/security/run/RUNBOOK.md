# RLS runbook — Supabase SQL Editor

Copy-paste checklist for enabling row-level security on the `public` schema.
The SQL in `01`/`02`/`03` is byte-identical to the executable SQL in
`db/security/enable-rls.sql`, which stays the reviewed source of truth; these
files only add comment headers and split it into the three stages you run.

Read `db/security/README.md` first if you have not already. Run
`db/security/inspect-api-surface.sql` before stage 2 if you have not inspected
the API surface yet.

---

## 1. Stage 1 — BEFORE snapshot

1. Open the Supabase dashboard → **SQL Editor** → new query.
2. Paste the whole of **`01-before.sql`** and run it.
3. **Save the result to a file before you do anything else.** Use the editor's
   download/export, or copy the rows into a local file such as
   `rls-before-<date>.csv`. Keep it outside this repository.

**Why this is not optional:** the result lists exactly the tables that were
unprotected before you started. Stage 2 enables RLS on every public table, and
the rollback template can only safely disable the tables on this list — a table
that already had RLS before today must stay protected. If you lose this list,
you have no safe way to undo stage 2.

Any number of rows here is fine, including zero.

---

## 2. Stage 2 — enable RLS

Do not start until step 1's result is saved.

1. New query. Paste the whole of **`02-enable.sql`** and run it.
2. Expect **"Success. No rows returned."**

It is one transaction with a 5-second `lock_timeout`, so it either fully
succeeds or changes nothing at all.

### The two guard exceptions — stop, do not work around either

**`An API client role bypasses RLS or effectively owns a public table: review role privileges before proceeding`**

The `anon` or `authenticated` role is a superuser, has `BYPASSRLS`, or
effectively owns one of your public tables. RLS does not restrict any of those,
so enabling it would leave the data just as reachable while looking protected.
Stop and fix the role privileges. Deleting the guard would give you a green
result and no actual protection.

**`Existing public-table policies found: review inspect-api-surface.sql results before enabling CASE A zero-policy RLS. No policies were dropped.`**

Policies already exist on public tables. Enabling RLS *activates* existing
policies rather than ignoring them, and this configuration is built on the
assumption that there are none, so the result would not be "deny all". Nothing
was dropped. Stop, run `db/security/inspect-api-surface.sql`, and understand
what those policies grant before going further.

In both cases nothing was changed — the transaction rolled back. Fix the cause
and rerun the entire file from the top. Do not edit the SQL to get past a guard.

Other failures you may see: a lock timeout (traffic held a conflicting lock —
nothing changed, retry when quieter), or a permission error on `ALTER TABLE`
(the SQL Editor role does not own the tables — stop and check the role).

---

## 3. Stage 3 — AFTER verification

1. New query. Paste the whole of **`03-after.sql`** and run it.
2. **It must return ZERO rows.** That is the pass condition.

If any row comes back, that table is still unprotected — stage 2 did not commit,
or a table was created in between. Rerun stage 2, then this query again.

This checks table flags only. It does not verify views, RPC/function
permissions, future tables, or whether the Data API is reachable.

---

## 4. Verify anonymously from your machine

Run the read-only probe script from the **repo root**, in **Git Bash** (you are
on Windows; this is a bash script and will not run in PowerShell or cmd):

```bash
cd /c/Users/"Tahir Mehmood"/Downloads/echolens-lms-v8/echolens-v4
read -r -p 'Supabase project URL: ' SUPABASE_URL
read -r -s -p 'Supabase anon/publishable key: ' SUPABASE_ANON_KEY; echo
export SUPABASE_URL SUPABASE_ANON_KEY
bash scripts/verify-rls.sh
unset SUPABASE_ANON_KEY SUPABASE_URL
```

`read -rs` keeps the key off the terminal and out of shell history; it is never
passed as a command argument. Use the **anon/publishable** key — the script
rejects service-role and secret keys, because a privileged key would produce a
misleading result.

If you have a `contact_*` table inventory exported from
`inspect-api-surface.sql`, add it: `bash scripts/verify-rls.sh --tables path/to/tables.txt`

Exit codes: `0` every probe denied or the schema is not exposed · `1` data is
exposed · `2` inconclusive (including any empty array — an empty table and a
denied read look the same over the API). The script only tests reads; it never
proves writes are denied.

---

## 5. Remove `public` from the exposed schemas

Dashboard → **Settings → API → Exposed schemas** → remove `public`.

Nothing in this application uses the Supabase Data API — it talks to Postgres
directly through Prisma/`pg` from the server. Unexposing `public` removes the
PostgREST path entirely instead of relying on RLS to deny each request, which is
the stronger of the two protections. Do this before you would ever consider
running the rollback template.

---

## 6. Rotate the anon key

Dashboard → **Settings → API Keys** → rotate the anon/publishable key.

**Rotating it cannot break this application.** Repository evidence:
`@supabase/supabase-js`, `createClient`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`,
`NEXT_PUBLIC_SUPABASE*`, `VITE_SUPABASE*` and `service_role` have zero
occurrences in first-party application and browser code, and there is no
`supabase` dependency in `package.json` or `package-lock.json`
(`db/security/README.md`, "Repository findings"). The only files naming those
variables are the verification tooling itself — `scripts/verify-rls.sh`,
`test/rls-security.test.js` and the security docs — which read them from your
environment at the moment you run them. The app's database access is
`DATABASE_URL`/`DIRECT_URL`, which the key rotation does not touch.

After rotating, use the new key when you rerun the script in step 4.

---

## If you need to undo stage 2

See `99-rollback-TEMPLATE.sql`. It is inert as written: you must complete
step 5 first, paste your saved stage 1 table list into the empty array, and
uncomment the block. Only disable tables that appear on that saved list.
