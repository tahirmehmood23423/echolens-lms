# Career integrity and student experience changes

Security corrections and the student interface are separate local commits.
Neither commit is authorization to push or deploy.

The integrity layer now issues private per-attempt choice identifiers, filters
private assessment snapshots out of profile responses, enforces server deadlines,
snapshots grading rules, retains history and qualifying pass evidence, promotes
required prerequisites, and exposes canonical knowledge evidence alongside the
existing practical-course evidence. These measures remain distinct: passing a
knowledge quiz never fabricates lesson completion or professional competence.

Question verification requires Linux `bubblewrap` (`bwrap`), Python 3 and enabled
user namespaces. It runs without application files, inherited environment or
network access, with read-only interpreter libraries, disposable temporary
storage and resource/output limits. It fails closed when isolation is unavailable;
there is no unsandboxed fallback. Install/test this prerequisite on the intended
host before enabling admin code-question imports. Existing published banks remain
usable without executing their snippets on student requests.

Database TLS now verifies certificates. Set `PGSSLROOTCERT` to the provider's CA
certificate file if its chain is not already trusted. `PGSSLMODE=disable` remains
for explicitly configured isolated local databases. No production connection or
migration is performed by these changes.

Canonical competencies have their own versioned identifiers in the shared skill
API. They are not silently treated as equivalent to broader legacy skills.
Career progress now includes these results, a chosen target role and the next
available subtrack, independently of course completion and role readiness.

No student records, passwords, submissions or existing scores are reset.
Existing attempts are retained. Pre-fix active forms receive opaque choice IDs
when resumed, preserving their saved answers. Historical pre-fix results remain
historical records; they cannot retrospectively establish assessment integrity.

The remaining 127 comprehensive question banks and lesson content are not
created by this change. Their availability must continue to be reported honestly.
