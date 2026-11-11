# Wave 4 — active canonical completion checkpoint

Baseline: `3d6da14`, branch `codex/career-integrity-ux`. The existing74 authored drafts and all132 unique canonical IDs were recovered. Starting missing count58;15 complete authored job-role pathways. No prior course content has been regenerated or changed.

This is an active implementation checkpoint, not a claim that Wave4 content is complete. Only courses registered in `career/curriculum/learning/wave4/manifest.json` after executable, mapping, duplication, source and substantive assessment review gates count as accepted. Unregistered files can be in-progress authoring work.

Native verification now supports Dart3.13.7, Java21.0.12.1, Kotlin2.2.21 (standalone JVM, not Android) and CPU PyTorch2.15.0. Each uses the existing fail-closed bubblewrap boundary: private environment, read-only fixed runtime mounts, no workspace/home/network, process/CPU/address-space/output limits, no unsandboxed fallback. The existing runtime profiles retain their prior limits. All13 native/runtime/source-review bootstrap tests passed.

Recreate optional native development runtimes as the ordinary user with `bash scripts/setup-curriculum-native-runtimes.sh`; exact SDK SHA256 checks and CPU package pins are committed. Java21 with the `jdk.compiler` module must already be installed. Run `node --test test/curriculum-native.test.js` after recreation. These are development dependencies, not student-server dependencies.

The original Bash manual webpage still returns503. GNU's authoritative Bash5.2.37 source archive was retrieved successfully, matching the installed shell version, and its `doc/bashref.texi` was preserved. See `bash-source-recovery.json`. Prior course references remain unchanged; expert claim-by-claim review can use the recovered manual. Neither code execution nor reference retrieval grants human approval.

The baseline74 passed structural, bank and exact pinned/captured source checks again; prior executable evidence was reused only where code/expected-output hashes match. See `starting-state.json`. Representative H/A assessment review is required alongside mechanical checks; flagged recognition-only high-tier items are held for revision.

No student data migration, production testing, push, merge, deployment, content approval or publication has occurred. Final accepted-batch inventories, tests, review bundles and exact continuation IDs will be added at validated integration checkpoints.
