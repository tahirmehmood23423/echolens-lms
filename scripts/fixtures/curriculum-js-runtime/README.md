# Optional private authoring runtime

The application does not depend on these packages. They support network-isolated curriculum example verification only. The lockfile pins TypeScript 5.9.3 and React/ReactDOM 19.2.0, including registry integrity hashes.

Copy `package.json` and `package-lock.json` into `/tmp/echolens-curriculum-runtimes/`, then run `npm ci --prefix /tmp/echolens-curriculum-runtimes --ignore-scripts --no-audit --no-fund` with the managed proxy/CA configuration. The verifier binds only `node_modules` read-only into its isolated filesystem. No package install script is enabled. Missing runtimes fail closed.

`typescript` uses actual strict type checking before emitted JavaScript execution, with diagnostic codes for rejected programs. `javascript-react` uses actual React server rendering; it does not prove browser event/effect behavior. Standard Python/SQL and plain JavaScript budgets remain unchanged.
