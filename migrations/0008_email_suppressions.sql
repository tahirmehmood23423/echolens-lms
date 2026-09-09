-- 0008: email suppression list (store.js `email_suppressions` collection /
-- store.js `Suppressions`).
--
-- Every address that hard-bounced or was permanently rejected by the bulk
-- ESP on a past send. store.js's Suppressions module loads this before any
-- blast and filters those addresses out; they are skipped on every future
-- run. The matching lead/user row is deliberately left in place - a bounce
-- is a delivery fact, not a reason to lose the contact.
--
-- Real columns, not the (id, data JSONB) blob pattern: store.js's
-- Suppressions module owns every read and write to this table directly, so
-- there is nothing to gain from the generic shape here. Suppressions._hydrate()
-- also issues this exact CREATE ... IF NOT EXISTS at boot and on first write,
-- so a deploy that forgets to run migrations degrades to "not skipping past
-- bounces" rather than crashing a blast - running this migration just makes
-- that the documented, up-front path.

CREATE TABLE IF NOT EXISTS email_suppressions (
  email      TEXT PRIMARY KEY,
  reason     TEXT,
  code       TEXT,
  source     TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
