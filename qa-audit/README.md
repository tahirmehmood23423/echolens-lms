# EchoLens product QA audit — 2026-09-09

Start with [the detailed report](audit-report.md) or [the searchable HTML report](audit-report.html).

- [Workflow matrix](workflow-matrix.csv): 96 scoped outcomes, steps and evidence.
- [Broken-workflow register](broken-workflows.csv): 20 confirmed defects and exact failing steps.
- [UI/UX screen review](screen-review.md) and [CSV](ui-ux-findings.csv).
- [Prioritized redesign backlog](redesign-backlog.csv).
- [Role/access inventory](role-access-inventory.csv), [route inventory](route-inventory.csv), [dashboard views](dashboard-views.json).
- [Evidence](evidence/) and [source fingerprints](source-fingerprints.json).

No product source changes were made. Local audit scripts use synthetic records only. The local-server harness disables .env loading and external credentials, using ignored runtime/data.json and runtime/uploads. Never point these scripts at production. Some scripts are one-shot scenarios that mutate their own synthetic fixtures; re-running them against the same runtime is not a clean regression reset. Do not treat raw harness failures as product issues; see the report's supersession notes.

To regenerate reports from curated data: node qa-audit/generate-report.cjs. To inspect the HTML report, open audit-report.html locally. External integrations and unexecuted scenarios are explicitly marked in the matrix.
