#!/usr/bin/env bash
# Read-only anonymous PostgREST probes. Never loads .env, SQL, or application code.
# Disable inherited xtrace BEFORE reading credentials. Do not invoke with bash -v.
set +x
set -euo pipefail

usage() {
  cat <<'HELP'
Usage: bash scripts/verify-rls.sh [--tables FILE]
Required environment: SUPABASE_URL, SUPABASE_ANON_KEY
Requires Bash, curl, and the project's existing Node.js runtime; no npm packages.
FILE adds exact public table names, one per line (# comments allowed), including
contact_* names exported from db/security/inspect-api-surface.sql.
GET only; at most one row per table. Records and credentials are never printed.
Exit 0: all probes denied/schema unexposed. Exit 1: data exposed.
Exit 2: inconclusive/configuration/transport error (including any empty array).
An empty array is not proof: the table may be empty. This script never tests writes.
HELP
}

tables_file=''
while (($#)); do
  case "$1" in
    --tables) [[ $# -ge 2 ]] || { usage >&2; exit 2; }; tables_file="$2"; shift 2 ;;
    --help|-h) usage; exit 0 ;;
    *) usage >&2; exit 2 ;;
  esac
done
for executable in curl node; do
  command -v "$executable" >/dev/null 2>&1 || { printf 'Missing required tool: %s\n' "$executable" >&2; exit 2; }
done

# Validate without printing either value. Reject service/authenticated JWTs and
# secret keys: privileged credentials would produce a misleading RLS test.
# JWT decoding checks role only; Supabase itself must validate the signature.
if ! key_mode=$(node -e '
try {
  const u = new URL(process.env.SUPABASE_URL || "");
  if (u.username || u.password || u.search || u.hash || !["", "/"].includes(u.pathname)) throw Error();
  if (u.protocol !== "https:" && !(u.protocol === "http:" && ["localhost", "127.0.0.1", "[::1]"].includes(u.hostname))) throw Error();
  const key = process.env.SUPABASE_ANON_KEY || "";
  if (!/^[A-Za-z0-9_.-]+$/.test(key)) throw Error();
  if (key.startsWith("sb_publishable_") && key.length > 15) process.stdout.write("publishable");
  else {
    const parts = key.split(".");
    if (parts.length !== 3 || JSON.parse(Buffer.from(parts[1], "base64url")).role !== "anon") throw Error();
    process.stdout.write("anon-jwt");
  }
} catch { process.exit(2); }
'); then
  printf 'Configuration rejected: supply a project URL and an anon/publishable key, never a secret/service-role/user key. HTTPS required except loopback.\n' >&2
  exit 2
fi
base_url=${SUPABASE_URL%/}

# Pass credentials over stdin, NOT process arguments or temporary files.
# -q first disables ~/.curlrc; fixed GET and no redirect following prevent an
# external config/redirect from changing the method or forwarding credentials.
# Bodies stay in memory and only go to local JSON parsers, never to logs/files.
request() {
  local endpoint="$1" accept="$2"
  {
    printf 'header = "apikey: %s"\n' "$SUPABASE_ANON_KEY"
    if [[ "$key_mode" == 'anon-jwt' ]]; then
      printf 'header = "Authorization: Bearer %s"\n' "$SUPABASE_ANON_KEY"
    fi
    printf 'header = "Accept-Profile: public"\n'
    printf 'header = "Accept: %s"\n' "$accept"
  } | curl -q --config - --request GET --silent --connect-timeout 5 --max-time 20 \
      --proto '=https,http' --url "$endpoint" --write-out '\n%{http_code}' 2>/dev/null
}

tables=(talent_profiles contact_requests contact_reveals feedback student_skills saved_searches)
if [[ -n "$tables_file" ]]; then
  [[ -r "$tables_file" ]] || { printf 'Cannot read table inventory file.\n' >&2; exit 2; }
  while IFS= read -r table || [[ -n "$table" ]]; do
    table=${table%$'\r'}
    [[ -z "$table" || "$table" == \#* ]] && continue
    [[ "$table" =~ ^[A-Za-z_][A-Za-z0-9_]*$ ]] || { printf 'Invalid table name in inventory file.\n' >&2; exit 2; }
    tables+=("$table")
  done < "$tables_file"
fi

# Discover additional contact_* paths in the anonymous OpenAPI document. Hidden
# tables may be omitted; this cannot replace the owner's catalog inventory.
if discovery=$(request "$base_url/rest/v1/" 'application/openapi+json'); then
  discovery_status=${discovery##*$'\n'}
  discovery_body=${discovery%$'\n'*}
  if [[ "$discovery_status" == 200 ]]; then
    if contacts=$(printf '%s' "$discovery_body" | node -e '
      let text=""; process.stdin.setEncoding("utf8"); process.stdin.on("data", x => text+=x);
      process.stdin.on("end", () => { try {
        const doc=JSON.parse(text); if (!doc.paths || typeof doc.paths !== "object") throw Error();
        for (const path of Object.keys(doc.paths)) if (/^\/contact_[A-Za-z0-9_]+$/.test(path)) console.log(path.slice(1));
      } catch { process.exitCode=2; } });
    '); then
      while IFS= read -r table; do [[ -z "$table" ]] || tables+=("$table"); done <<< "$contacts"
    else
      printf 'Discovery unavailable: use --tables with the dashboard contact_* inventory.\n'
    fi
  else
    printf 'Discovery HTTP %s: use --tables with the dashboard contact_* inventory.\n' "$discovery_status"
  fi
else
  printf 'Discovery transport failure: use --tables with the dashboard contact_* inventory.\n'
fi
unset discovery discovery_body contacts

printf 'Anonymous GET probes (public schema; no record contents printed):\n'
exposed=0
inconclusive=0
seen='|'
for table in "${tables[@]}"; do
  [[ "$seen" == *"|$table|"* ]] && continue
  seen+="$table|"
  if ! response=$(request "$base_url/rest/v1/$table?select=*&limit=1" 'application/json'); then
    printf '%-28s TRANSPORT_ERROR (inconclusive)\n' "$table"
    inconclusive=1
    continue
  fi
  status=${response##*$'\n'}
  body=${response%$'\n'*}
  parsed=$(printf '%s' "$body" | node -e '
    let text=""; process.stdin.setEncoding("utf8"); process.stdin.on("data", x => text+=x);
    process.stdin.on("end", () => { try {
      const value=JSON.parse(text);
      if (Array.isArray(value)) console.log("rows " + value.length);
      else if (value && typeof value.code === "string" && /^[A-Za-z0-9_]+$/.test(value.code)) console.log("error " + value.code);
      else console.log("invalid");
    } catch { console.log("invalid"); } });
  ')
  if [[ "$status" =~ ^(200|206)$ && "$parsed" == 'rows '* && "${parsed#rows }" != 0 ]]; then
    printf '%-28s EXPOSED (HTTP %s; at least one row visible)\n' "$table" "$status"
    exposed=1
  elif [[ "$status" =~ ^(200|206)$ && "$parsed" == 'rows 0' ]]; then
    printf '%-28s EMPTY (HTTP %s; denied rows OR genuinely empty table)\n' "$table" "$status"
    inconclusive=1
  elif [[ "$status" =~ ^(401|403)$ && "$parsed" == 'error 42501' ]]; then
    printf '%-28s DENIED (HTTP %s; database permission denied)\n' "$table" "$status"
  elif [[ "$status" == 406 && "$parsed" == 'error PGRST106' ]]; then
    printf '%-28s SCHEMA_NOT_EXPOSED (HTTP 406)\n' "$table"
  elif [[ "$status" == 404 ]]; then
    printf '%-28s NOT_FOUND (HTTP 404; missing or hidden; inconclusive)\n' "$table"
    inconclusive=1
  else
    printf '%-28s INCONCLUSIVE (HTTP %s; unexpected/auth/config response)\n' "$table" "$status"
    inconclusive=1
  fi
  unset body response
done

printf 'Coverage: OpenAPI can omit hidden contact_* tables; supply the dashboard inventory with --tables.\n'
printf 'GET probes never prove write denial. Confirm table flags, zero policies, role/grant checks, and views/RPC review separately.\n'
if ((exposed)); then exit 1; fi
if ((inconclusive)); then exit 2; fi
printf 'All requested probes denied access or rejected the public schema.\n'
