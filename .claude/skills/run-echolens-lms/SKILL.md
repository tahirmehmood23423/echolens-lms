---
name: run-echolens-lms
description: Build, run, and drive the EchoLens LMS (Express + static HTML/JS). Use when asked to start EchoLens, seed its database, run the server, take a screenshot of the portal/compiler/open site, or verify a change actually works in the browser.
---

EchoLens LMS is a plain Express server (`server.js`) that serves static
multi-page HTML/CSS/JS from `public/` and stores data in a single JSON
file (`store.js`, no database server). There is no build step and no
SPA framework - it's driven like any browser app: start the server,
then drive a headless Chromium against it with the Playwright driver
at `.claude/skills/run-echolens-lms/driver.mjs` (`chromium-cli` is not
installed in this environment, so this script is the equivalent
harness). All paths below are relative to the repo root
(`echolens-v4/`).

## Prerequisites

Node.js >= 18 (this environment has v24). No OS packages needed - the
app itself has no native deps. The driver needs a Chromium binary for
Playwright, downloaded once:

```bash
cd .claude/skills/run-echolens-lms
npm install                      # installs the `playwright` package here only
npx playwright install chromium  # downloads the browser (~300MB, one-time; cached under %LOCALAPPDATA%\ms-playwright)
```

## Setup

App dependencies are already vendored in the repo root's `node_modules`.
If missing, from the repo root: `npm install`.

**Never point the app at the real `echolens.json`** while testing -
it holds real accounts/data. Use an isolated DB via `DB_PATH` (this is
just an env var `store.js` already reads - no code changes needed) and
seed it with the built-in demo accounts:

```bash
mkdir -p /tmp/echolens-run
DB_PATH=/tmp/echolens-run/echolens.json node store.js --seed
```

This prints and creates four accounts, all password `ChangeMe!2026`:
`admin@echolens.digital` (admin), `teacher@echolens.digital` (instructor),
`coordinator@echolens.digital` (coordinator), `student@echolens.digital`
(student) - already enrolled in one seeded course with one upcoming
class and one announcement.

## Build

No build step - static files are served as-is.

## Run (agent path)

Start the server against the isolated DB, on a scratch port, in the
background:

```bash
DB_PATH=/tmp/echolens-run/echolens.json \
UPLOAD_DIR=/tmp/echolens-run/uploads \
PORT=3100 JWT_SECRET=dev-test-secret NODE_ENV=development \
node server.js > /tmp/echolens-run/server.log 2>&1 &

timeout 30 bash -c 'until curl -sf http://localhost:3100/ >/dev/null; do sleep 1; done'
```

Then drive it with the Playwright script:

```bash
cd .claude/skills/run-echolens-lms
BASE_URL=http://localhost:3100 node driver.mjs <flow>
```

| flow | what it does |
|---|---|
| `smoke` (default) | signs in as admin, teacher, student in turn, screenshots each dashboard, signs out between |
| `student` | signs in as the demo student, clicks through Overview → My courses → Challenges → Profile |
| `teacher` | signs in as the demo teacher, screenshots Overview and My courses |
| `admin` | signs in as admin, screenshots Overview, People, Analytics & Leads |
| `open` | loads the public `/open` portal (no auth) |
| `compiler` | signs in as student, opens `/compiler`, clicks Run on the default Python snippet, waits for real output |

Two extra scripts in the same folder check the Python plotting path
(`BASE_URL=... node plot-check.mjs` / `plot-check2.mjs`): the first runs a
seaborn snippet that downloads a remote dataset and asserts two separate
figures plus working Download PNG buttons; the second covers `input()`
re-runs, plots without `plt.show()`, plots before an exception, remote
`read_csv`, and a dead URL.

Screenshots land in `.claude/skills/run-echolens-lms/screenshots/<flow>-<step>.png`.
The driver prints any non-CDN console/page errors it saw at the end of
the run - check that output, not just the screenshot.

Stop the server when done: `taskkill //F //PID <pid>` on Windows (the
pid is echoed by the shell, or `netstat -ano | grep :3100`), or
`kill %1` if it's a job in your current shell.

## Run (human path)

`npm start` (or `node server.js`) boots on `PORT` (default 3000)
against `echolens.json` in the repo root - open `http://localhost:3000`
in a real browser. Ctrl-C to stop. Useless in a headless container;
use the agent path above instead.

## Test

No automated test suite is defined in `package.json` (no `test`
script). Verification is done by actually driving the app, as above.

---

## Gotchas

- **Student/free accounts hit a non-dismissable "WhatsApp number"
  modal on first dashboard load** (`public/js/dashboard.js`
  `requireWhatsapp()`). It blocks every other click until submitted.
  The driver's `login()` helper detects `input[name="whatsapp"]` and
  fills/submits it automatically - admin, teacher, and coordinator
  accounts never see it, only `student`/`free` roles do.
- **The in-browser Python compiler is real, not mocked.** `/compiler`
  loads Pyodide from a CDN into the page and actually executes the
  code client-side - clicking Run and waiting ~10-15s for output
  (`Hello EchoLens!` for the default snippet) works fine headlessly,
  but don't shortcut it with a fixed short timeout; wait for the
  output text to appear.
- **Two decorative `<script>` tags load from `cdnjs.cloudflare.com`**
  (three.js, for the login page and dashboard background art). If run
  fully offline these 404/timeout and the driver's error filter
  already excludes them - don't treat them as real failures, but do
  treat any *other* console error as real.
- **The `login()` helper's post-login wait is a URL regex**
  (`/\/(dashboard|open)$/`) because free/open accounts land on `/open`
  while every other role lands on `/dashboard` - don't hardcode one URL.
- **`/login` redirects away immediately if a session cookie is already
  present** (its inline script checks `/api/auth/me` on load). In the
  `smoke` flow, switching roles without clearing the cookie would land
  silently on the *previous* role's dashboard instead of erroring. The
  driver clears cookies between roles (`context.clearCookies()`, not a
  UI "Sign out" click) and `login()` asserts the `#rolePill` text
  matches the expected role, so a stale session fails loudly instead
  of producing a mislabeled screenshot.

## Troubleshooting

- **`Executable doesn't exist at ...chrome-headless-shell.exe`**: the
  Playwright browser binary wasn't downloaded yet. Run
  `npx playwright install chromium` inside
  `.claude/skills/run-echolens-lms/`.
- **`Cannot find package 'playwright'`**: you ran the driver from
  outside its own directory, or never ran `npm install` in
  `.claude/skills/run-echolens-lms/`. The driver's dependency is
  scoped to that folder, not the app's root `node_modules`.
- **Port already in use on 3100**: a previous test server is still
  running. Find it with `netstat -ano | grep :3100` and stop that
  process before relaunching, or pick a different `PORT`.
