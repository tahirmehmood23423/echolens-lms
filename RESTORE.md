# EchoLens LMS — restore procedure

Written for whoever is on call when something looks wrong with the data, at
whatever hour that happens. Read the first section before touching anything.

---

## 0. Is data actually lost, or is the app just misbehaving?

Most "the data is gone" reports are not that. Check in this order before
you restore anything — a restore is not free (see §5), so don't reach for
it until you've ruled these out:

1. **Hit `GET /api/admin/backup` (via the admin overview page's system
   health panel, or curl it directly as an admin).** It reports:
   - `Postgres Flush` — `consecutiveFlushFailures`. If this is > 0, writes
     are failing and queuing up in memory, not landing in Postgres. The app
     may look like it's "working" (requests succeed once the in-memory
     snapshot updates) while nothing is actually being saved. **This is the
     single most important thing to check before restarting anything** —
     see §4.
   - `Backup Service` — when the last pg_dump backup succeeded.
2. **Check Render's logs for the actual error.** `console.error` lines
   prefixed `[store]` are this app's own diagnostics — flush failures,
   Postgres connection errors, and (if it got that far) a fail-fast restart
   are all logged with enough detail to name the offending table.
3. **Query Postgres directly** (see §2 for the connection string) — do the
   rows you think are missing actually exist?
   ```sql
   SELECT count(*) FROM users;
   SELECT max(created_at) FROM quest_submissions;
   ```
   If the counts look right, the data isn't lost — something else is wrong
   (a bad deploy, a frontend bug, a permissions issue). Don't restore.
4. **If Postgres itself is unreachable** (not just slow) — check Supabase's
   own status page and the project dashboard before assuming your data is
   gone. A network/outage issue looks identical to data loss from inside
   the app.

Only move to an actual restore (§2 or §3) once you've confirmed rows are
genuinely missing or corrupted in Postgres itself.

---

## 1. Four different things people mean by "restore" here

| What | What it is | When you'd use it |
|---|---|---|
| **pg_dump backup** (§2) | Nightly automated dump of the live Postgres database, stored as a GitHub Release in this repo | Postgres data is lost/corrupted and you need it back |
| **Supabase's own backup** (§3) | Automatic daily backup Supabase itself takes (Pro plan only, once enabled) | Same as above — a second, independent option |
| **`failed-flush-*.json` dump** (§4) | A handful of rows that were in memory but never made it to Postgres before a crash | The app crashed after a flush failure — you're recovering *recent unsaved writes*, not restoring the whole database |
| **`echolens.json`** (§5) | The pre-Postgres-cutover snapshot, frozen since **2026-07-26** | Almost never — see the warning in §5 before you touch this |

These are not interchangeable. Using the wrong one either does nothing
useful or actively reverts real data — read the section for the one you
actually need.

---

## 2. Restoring from a pg_dump backup

Backups are produced nightly by `.github/workflows/backup-pg-dump.yml`
(`scripts/backup-pg-dump.js`), uploaded as GitHub Releases in this repo
tagged `db-backup-<timestamp>`, retained for the last 30. Each release's
notes include the file's SHA-256 and byte size.

### 2a. Get the dump file

```bash
gh release list --repo <owner>/<repo> | grep db-backup   # find the tag you want
gh release download db-backup-<timestamp> --repo <owner>/<repo> -D ./restore-tmp
```

Verify it wasn't corrupted in transit:
```bash
sha256sum restore-tmp/echolens-*.dump   # compare against the release notes
```

### 2b. Restore into a SCRATCH database first — never directly into production

```bash
# Session pooler, port 5432 — same host class the backup itself was taken
# from. The direct db.<ref>.supabase.co host is IPv6-only and will hang on
# most runners/laptops without the IPv4 add-on.
createdb -h aws-0-<region>.pooler.supabase.com -p 5432 -U postgres.<project-ref> echolens_restore_check
pg_restore -h aws-0-<region>.pooler.supabase.com -p 5432 -U postgres.<project-ref> \
  -d echolens_restore_check --no-owner --no-acl \
  restore-tmp/echolens-<timestamp>.dump
```

Sanity-check row counts and a few recent rows against what you expect
before going anywhere near the real database:
```sql
SELECT count(*) FROM users;
SELECT count(*) FROM quest_submissions;
SELECT max(created_at) FROM quest_submissions;
```

### 2c. Restore into production (only after 2b looks right)

This is a real, hard-to-reverse action against live data. Get a second
person to confirm before running it if at all possible.

1. **Stop the Render service first** (or at minimum accept that writes
   during the restore window can be lost — the app has no way to pause
   writes on its own). From Render's dashboard: suspend the service.
2. Decide scope:
   - **Whole-database restore** (only if the database is broadly
     corrupted): drop and recreate the target tables, then
     `pg_restore ... -d postgres` against the real connection string,
     using `--clean --if-exists` so it drops existing objects first.
     This is the most destructive option — everything written since the
     dump's timestamp is gone. Confirm you accept that before running it.
   - **Selective table restore** (a specific table got corrupted, the rest
     is fine): `pg_restore -t <table_name> ...` restores just that table.
     Prefer this whenever the damage is scoped — it's much less to lose.
3. Restart the Render service, then immediately check `Postgres Flush` in
   system health and confirm a few known-recent rows are present.

---

## 3. Restoring from Supabase's own daily backup (Pro plan)

Once the Supabase project is on Pro, Supabase takes its own daily backup
with 7-day retention, independent of the pg_dump job above (defense in
depth — different infrastructure, different failure modes). To restore:

1. Supabase Dashboard → the project → **Database** → **Backups**.
2. Pick a backup point (Pro plan backups are daily snapshots, not
   point-in-time — you're choosing a day, not a timestamp within it).
3. Supabase restores **in place, into the same project** — there is no
   "restore to a scratch copy first" option here the way there is with a
   pg_dump file. Treat this as a last resort, or use it to spin up a
   temporary project you then diff against production, not as your first
   move.
4. This action is irreversible from Supabase's side once started. Stop the
   Render service first, same as §2c.

Supabase's dashboard is the source of truth for the exact current flow —
check it before relying on the steps above, since restore UIs change.

---

## 4. `failed-flush-*.json` — recovering writes that never reached Postgres

### What it is

`store.js` batches writes and flushes them to Postgres in one transaction.
If a flush fails 3 times in a row (`FAIL_FAST_THRESHOLD`), the process
writes everything that was in memory but not yet persisted to
`/data/failed-flush-<ISO-timestamp>.json`, then exits so Render restarts it
clean. This file is the **diff since the last successful flush** — not a
full backup, not the whole database, just whatever was about to be lost.

### How to read it

```json
{
  "dumped_at": "...",
  "failure": { "collection": "...", "op": "...", "code": "...", "message": "..." },
  "collections": { "users": [ /* changed/new rows */ ], "...": [] },
  "seq_changes": { "...": 123 }
}
```
- `failure` tells you *why* it failed — usually a Prisma error code
  (`P2002` = unique constraint, etc.) and which table/column.
- `collections` holds the actual rows that need to go back in. Row fields
  matching `email`, `password_hash`, `whatsapp`, `phone`, `google_sub`,
  `signature`, `account_number`, `iban` are redacted (`[redacted]`) — this
  file is safe to attach to an internal ticket, but it also means you
  **cannot replay it as-is**; see below.

### How to replay it

**Do not restore this file directly into Postgres — the note field in the
dump itself says so, and it's redacted, so a raw import would corrupt
those fields anyway.** Instead:

1. Fix whatever caused the failure first (check `failure.message` — often
   a duplicate key or a bad foreign key from data that changed between the
   failed attempts).
2. For each row in `collections`, re-create it **through the normal
   application code path** (the actual API endpoint or an admin action),
   not raw SQL — this keeps auto-generated ids, sequence counters
   (`seq_changes`), and cross-table relations consistent the way a real
   request would.
3. Redacted fields (email, etc.) need to come from the user directly or
   from `failed-flush-*.json`'s own less-redacted console.error sibling
   line in Render's logs from the same incident (still redacted, but
   sometimes enough context survives to identify the row without the
   value itself).
4. Cross-check `seq_changes` against Postgres's actual current sequence
   values before doing bulk re-inserts, so you don't collide with rows
   created by other users in the meantime.

### The bigger warning this section exists for

**A running process's in-memory snapshot can hold data Postgres does not.**
If persistence has been silently failing (check `Postgres Flush` in system
health — `consecutiveFlushFailures`), the app *looks* fine because reads
are served from memory, but a restart loses everything since the last
successful flush, with no dump file if it never crossed the 3-failure
threshold.

**Before restarting or redeploying anything during an incident:**
1. Check `GET /api/admin/backup`'s `Postgres Flush` status.
2. If `consecutiveFlushFailures > 0`, do **not** restart the process yet —
   that's exactly the data a restart would lose. Fix the underlying cause
   first (bad connection, schema mismatch, disk full on Supabase's side),
   confirm flushes succeed again, and only then restart if still needed.
3. If a restart is unavoidable before you can fix the cause, that's what
   the fail-fast dump exists for — but it only fires automatically at the
   3-failure threshold, not on every restart. If failures are below that
   threshold and you must restart anyway, there is no automatic dump; the
   in-flight diff is simply lost. Weigh that before restarting.

---

## 5. `echolens.json` — the pre-cutover snapshot

`echolens.json` (at `DB_PATH`, `/data/echolens.json` on Render) is a
**frozen snapshot from the moment this app cut over from the JSON file
store to Postgres — 2026-07-26.** `save()` stopped writing to this file the
instant Postgres mode went live (see `store.js`); it has not changed since,
regardless of anything that has happened in the app since that date.

**Restoring or reverting to this file reverts every user, course,
enrollment, gem, submission, and certificate created or changed since
2026-07-26 to whatever existed at that moment.** For a live app with real
users, that is almost certainly not what you want. This file's only
legitimate uses are:
- A last-resort reference if Postgres itself is unrecoverable and no
  pg_dump/Supabase backup exists either (should not happen once §2 and §3
  are both in place).
- Forensic comparison — "did this row exist before cutover?" — never as
  something to restore wholesale.

If you ever find yourself about to point `DB_PATH` at this file and
restart the app in Postgres mode expecting it to matter: it won't — Postgres
mode ignores `DB_PATH` for reads/writes entirely once `DATABASE_URL` is
set. The only way this file becomes live data again is manually re-running
`migrate:import` against an empty database, which is a full revert, not a
partial one.

---

## Reference: connection strings

- **Session pooler (port 5432)** — use for `pg_dump`, `pg_restore`, and
  anything from a laptop or CI runner: `aws-0-<region>.pooler.supabase.com:5432`.
  IPv4-safe.
- **Transaction pooler (port 6543)** — what the running app uses
  (`DATABASE_URL`). Not reliable for `pg_dump`/`pg_restore` (prepared
  statements).
- **Direct host** (`db.<ref>.supabase.co`) — IPv6-only without Supabase's
  paid IPv4 add-on. Avoid from any IPv4-only environment (most CI runners,
  many home networks) — it fails as a hang/timeout, not a clear error.

Real credentials live in `.env` (commented out on purpose — see that
file's own header) and in this repo's `BACKUP_DIRECT_URL` GitHub Actions
secret. Never commit them.
