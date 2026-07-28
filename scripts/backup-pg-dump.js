'use strict';

/**
 * EchoLens LMS - real Postgres backup (U1b)
 *
 * Runs `pg_dump` against Supabase and publishes the compressed dump as a
 * GitHub Release asset in THIS repo - deliberately off the Render `/data`
 * disk (a disk on the same instance as the database's only other copy is
 * not a backup) and off Supabase itself (Supabase free plan has no backups
 * at all; Pro's backups are a separate, welcome layer, not a substitute for
 * an independent one - see RESTORE.md).
 *
 * Destination choice: GitHub Releases, not R2/S3. R2 is explicitly parked
 * (Showcase Feed work is on hold) and standing up a new bucket/credentials
 * for backups alone would be new infrastructure for a problem GitHub
 * Actions already solves for free at this data size - 2,000 free private-repo
 * minutes/month and per-asset storage outside the 500MB Actions-artifact cap
 * (see the cost note in RESTORE.md). Revisit if dumps outgrow a few hundred
 * MB or the team adopts R2 anyway.
 *
 * Intended trigger: .github/workflows/backup-pg-dump.yml (scheduled +
 * workflow_dispatch), not this repo's own server process - a scheduled job
 * living on the same Render instance as the app is one incident away from
 * dying with it.
 *
 * Usage:
 *   DIRECT_URL=postgresql://postgres.<ref>:<pw>@aws-0-<region>.pooler.supabase.com:5432/postgres \
 *   GH_TOKEN=... GH_REPO=owner/repo \
 *   node scripts/backup-pg-dump.js
 *
 * Requires the `pg_dump` and `gh` binaries on PATH (both preinstallable on
 * an ubuntu-latest GitHub Actions runner - see the workflow file).
 */

const { execFileSync } = require('child_process');
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const mailer = require('../mailer');

const RETENTION_COUNT = Number(process.env.BACKUP_RETENTION_COUNT || 30); // ~1 month of daily dumps
const RELEASE_TAG_PREFIX = 'db-backup-';
const ALERT_TO = process.env.BACKUP_ALERT_TO || 'ceo@echolens.digital';

// A local-disk status marker (NOT the backup itself - a few bytes recording
// whether the last run succeeded) so the app's own health check can report
// on the pg_dump backup without calling the GitHub API on every request.
// Deliberately next to DB_PATH so it survives on the same persistent disk
// the app already has - losing this marker loses only "when did we last
// check", never any actual data.
const STATUS_PATH = process.env.BACKUP_STATUS_PATH
  || path.join(path.dirname(process.env.DB_PATH || path.join(__dirname, '..', 'echolens.json')), 'backups', 'pg-dump-status.json');

function assertSessionPooler(url) {
  let parsed;
  try { parsed = new URL(url); } catch { throw new Error('DIRECT_URL is not a valid connection string.'); }
  // The direct db.<ref>.supabase.co host is IPv6-only without Supabase's
  // paid IPv4 add-on - GitHub Actions runners are IPv4-only, so a direct
  // host here fails opaquely with a connection timeout, not a clear error.
  // Catching it here turns that into an immediate, legible failure instead.
  if (!/\.pooler\.supabase\.com$/.test(parsed.hostname)) {
    throw new Error(
      `DIRECT_URL host "${parsed.hostname}" does not look like the Supabase session pooler ` +
      `(expected something ending in .pooler.supabase.com). The direct db.<ref>.supabase.co host ` +
      `is IPv6-only and will hang/fail on an IPv4-only GitHub Actions runner. Use the session pooler URL, port 5432.`
    );
  }
  if (parsed.port !== '5432') {
    console.warn(`WARNING: DIRECT_URL port is "${parsed.port}", not 5432 (session pooler / migration port). Port 6543 is the transaction pooler and does not support pg_dump's use of prepared statements reliably.`);
  }
  return parsed;
}

function writeStatus(status) {
  try {
    fs.mkdirSync(path.dirname(STATUS_PATH), { recursive: true });
    fs.writeFileSync(STATUS_PATH, JSON.stringify(status, null, 2));
  } catch (e) {
    console.error('[backup-pg-dump] could not write local status marker (non-fatal):', e.message);
  }
}

function pruneOldReleases(repo) {
  const list = JSON.parse(execFileSync('gh', [
    'release', 'list', '--repo', repo, '--json', 'tagName,createdAt',
    '--limit', '1000',
  ], { encoding: 'utf8' }));
  const backups = list
    .filter((r) => r.tagName.startsWith(RELEASE_TAG_PREFIX))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const toDelete = backups.slice(RETENTION_COUNT);
  for (const r of toDelete) {
    console.log(`[backup-pg-dump] pruning old backup release ${r.tagName}`);
    execFileSync('gh', ['release', 'delete', r.tagName, '--repo', repo, '--yes', '--cleanup-tag'], { stdio: 'inherit' });
  }
  return { keptCount: Math.min(backups.length, RETENTION_COUNT), deletedCount: toDelete.length };
}

async function main() {
  const directUrl = process.env.DIRECT_URL;
  const repo = process.env.GH_REPO;
  if (!directUrl) throw new Error('DIRECT_URL is not set.');
  if (!repo) throw new Error('GH_REPO is not set (e.g. "owner/echolens-lms").');
  assertSessionPooler(directUrl);

  const startedAt = new Date();
  const stamp = startedAt.toISOString().replace(/[:.]/g, '-');
  const tag = `${RELEASE_TAG_PREFIX}${stamp}`;
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'echolens-backup-'));
  const dumpPath = path.join(tmpDir, `echolens-${stamp}.dump`);

  try {
    console.log(`[backup-pg-dump] dumping to ${dumpPath} ...`);
    // -Fc: custom format, compressed internally (zlib) - also the format
    // pg_restore needs for selective/parallel restore, so this doubles as
    // "compressed output" and "restorable output" in one flag.
    execFileSync('pg_dump', ['--dbname', directUrl, '-Fc', '-f', dumpPath], {
      stdio: 'inherit',
      env: { ...process.env, PGCONNECT_TIMEOUT: '30' },
    });

    const bytes = fs.statSync(dumpPath).size;
    const sha256 = crypto.createHash('sha256').update(fs.readFileSync(dumpPath)).digest('hex');
    console.log(`[backup-pg-dump] dump complete: ${(bytes / 1024 / 1024).toFixed(2)} MB, sha256=${sha256}`);

    execFileSync('gh', [
      'release', 'create', tag, dumpPath,
      '--repo', repo,
      '--title', `DB backup ${stamp}`,
      '--notes', `Automated pg_dump (custom format) of the production database.\nBytes: ${bytes}\nSHA-256: ${sha256}\nSee RESTORE.md for how to restore this file.`,
    ], { stdio: 'inherit' });

    const { keptCount, deletedCount } = pruneOldReleases(repo);

    writeStatus({
      ok: true,
      at: startedAt.toISOString(),
      tag,
      bytes,
      sha256,
      durationMs: Date.now() - startedAt.getTime(),
      retained: keptCount,
      pruned: deletedCount,
    });
    console.log('[backup-pg-dump] done.');
  } catch (err) {
    console.error('[backup-pg-dump] FAILED:', err.message);
    writeStatus({ ok: false, at: startedAt.toISOString(), error: err.message });
    // Awaited, not mailer.notify()'s usual fire-and-forget: this script's
    // process exits right after main() settles, which would race a
    // background send in a normal notify() call and could kill it
    // mid-flight (fine inside the long-lived server process; not fine here).
    await mailer.send({
      to: ALERT_TO,
      subject: 'EchoLens: nightly Postgres backup failed',
      text: `The scheduled pg_dump backup failed at ${startedAt.toISOString()}.\n\nError: ${err.message}\n\n` +
        `This means today has no independent backup beyond Supabase's own (Pro-plan) daily backup, if enabled. ` +
        `Check the GitHub Actions run for the full log. See RESTORE.md for manual recovery steps.\n\n- EchoLens`,
    }).catch((mailErr) => console.error('[backup-pg-dump] failure alert email also failed:', mailErr.message));
    throw err;
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

main().catch(() => process.exit(1));
