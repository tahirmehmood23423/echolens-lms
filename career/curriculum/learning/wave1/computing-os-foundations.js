'use strict';
const {build,pythonRef}=require('./infra-helper');
const data=[
  {
    "comp": "m1.c1",
    "title": "Separate processes, threads and kernel services",
    "intro": "A hospital registration program and a billing program share one machine. The operating system must schedule their work while preventing one ordinary program from reading another program’s private memory. Learn which boundaries are process isolation and which are shared coordination.",
    "headings": [
      "Understand the boundary",
      "Apply it to an operating decision",
      "Check the model and its limits"
    ],
    "sections": [
      [
        "A process is a running program together with resources such as an address space and open handles. A thread is an execution stream inside a process; threads normally share that process’s memory and resources. Two threads do not become isolated merely because they have different names. A program file on disk is not itself a running process.",
        "The kernel is the privileged component that mediates access to protected resources. A user application requests operations through system-call interfaces rather than changing arbitrary hardware or kernel state. This separation supports protection but does not make application authorization or input validation unnecessary."
      ],
      [
        "Schedulers divide available CPU time among runnable threads/processes. A thread waiting for disk or a network response may be blocked rather than consuming CPU. More threads can improve responsiveness for some workloads, but coordination overhead and shared-state races can also increase. Thread count alone is not a measure of throughput.",
        "For the hospital system, separate worker processes can limit the impact of an ordinary application crash. Within one process, workers sharing an appointment counter need a synchronization design. Process isolation is a boundary, not proof that a shared database operation is atomic."
      ],
      [
        "The fixture represents address spaces as separate dictionaries and a thread pair as two references to one dictionary. Updating the shared counter is visible through both references, while the other process’s model stays unchanged. This makes sharing explicit without spawning real threads or inspecting host processes.",
        "The model does not implement scheduling, virtual memory, locks or kernel protection. Real operating systems enforce these through implementation-specific mechanisms. Use it to identify the intended ownership of data before selecting an actual concurrency primitive."
      ]
    ],
    "code": "a = {\"appointments\": 2}\nb = {\"appointments\": 9}\nthread_one = a\nthread_two = a\nthread_one[\"appointments\"] += 1\nprint(thread_two[\"appointments\"])\nprint(b[\"appointments\"])",
    "expect": "3\n9",
    "problem": "Predict which model worker observes a shared update.",
    "steps": [
      "Create independent process records.",
      "Point two thread references at one record.",
      "Update through one reference and inspect both boundaries."
    ],
    "limit": "These are ordinary Python references, not a simulation of real kernel-enforced address spaces or thread scheduling.",
    "mistakes": [
      "Treating threads as independent memory sandboxes.",
      "Using a process count as proof of useful CPU work."
    ],
    "takeaways": [
      "Identify the sharing boundary before coordinating state.",
      "Separate scheduling, isolation and application permissions."
    ],
    "practice": [
      [
        "What distinguishes a running process from a program file?",
        "It owns execution state",
        "It is only source text",
        "It is always a kernel module",
        "It cannot hold open files",
        "A process includes running state and resources rather than merely stored instructions."
      ],
      [
        "What do threads in one ordinary process normally share?",
        "An address space",
        "Only a filename",
        "No writable state",
        "A separate physical machine",
        "Threads usually share the process address space and therefore need coordination for shared writes."
      ],
      [
        "Which component mediates privileged resource access?",
        "The kernel",
        "The UI theme",
        "The browser bookmark list",
        "The source formatter",
        "The kernel exposes controlled interfaces for operations requiring system authority."
      ],
      [
        "Why can a blocked worker show little CPU usage?",
        "It is waiting for a resource",
        "It has completed every job",
        "It lacks a process identifier",
        "It is guaranteed deadlocked",
        "Waiting for I/O is different from being runnable and actively executing on a CPU."
      ],
      [
        "What does the dictionary model demonstrate?",
        "Reference sharing",
        "Kernel memory protection",
        "Actual CPU scheduling",
        "Production race freedom",
        "The output follows Python reference identity and illustrates sharing, not actual OS enforcement."
      ],
      [
        "What is required when threads update one invariant?",
        "A coordination design",
        "Different display names",
        "Only more threads",
        "Separate log colors",
        "Concurrent shared-state changes need synchronization or an appropriate atomic data operation."
      ],
      [
        "Which count alone fails to prove throughput?",
        "The number of threads",
        "Completed jobs per minute",
        "Measured request latency",
        "Recorded successful work",
        "A larger thread pool can add contention and overhead without increasing completed work."
      ],
      [
        "What remains necessary with process isolation?",
        "Application access checks",
        "Removing all input validation",
        "Giving every worker root",
        "Sharing all secret files",
        "OS isolation does not decide which authenticated application user may access a business record."
      ]
    ],
    "final": [
      [
        "A stored executable has never been launched. Which statement is accurate?",
        "It is not yet a running process",
        "It already owns a CPU timeslice",
        "It must hold a live socket",
        "It already has private runtime memory",
        "Stored instructions do not create live execution resources until an execution instance exists."
      ],
      [
        "Two worker references point to the same model dictionary. What follows?",
        "Their updates can be visible to each other",
        "They form separate kernel namespaces",
        "Their writes are automatically serialized",
        "They cannot affect one another",
        "Reference sharing is visible in the fixture and does not imply any synchronization guarantee."
      ],
      [
        "What is the role of a system-call interface?",
        "Request controlled OS operations",
        "Grant every caller administrator rights",
        "Replace every business permission check",
        "Turn source code into a user account",
        "The interface lets user programs request mediated operations without unrestricted kernel access."
      ],
      [
        "A registration worker crashes while a separate billing process continues. What boundary helped?",
        "Process separation",
        "Identical thread names",
        "A shared mutable counter",
        "An executable extension",
        "A distinct process can contain some application failures, although shared dependencies can still fail."
      ],
      [
        "A dashboard is slow while CPU usage is low and workers await storage. What should be examined?",
        "The I/O wait path",
        "Only the CPU model name",
        "Only the number of icons",
        "An assumed need for more cores",
        "Low CPU with blocked workers suggests examining waits rather than assuming CPU saturation."
      ],
      [
        "A team adds 200 threads and sees more lock contention. Which conclusion fits?",
        "More concurrency can add overhead",
        "Thread count guarantees more useful work",
        "The kernel has stopped scheduling",
        "Shared memory has become isolated",
        "Contention and coordination cost can offset the benefit of additional execution streams."
      ],
      [
        "An ordinary worker must read another customer’s record only with permission. Which control is still required?",
        "Application authorization",
        "Only a process id",
        "Only the executable path",
        "A high scheduling priority",
        "The OS process boundary does not encode customer-level business permissions."
      ],
      [
        "Two billing threads read the same balance then each write a result. What needs review?",
        "Shared-state synchronization",
        "The spelling of their labels",
        "Whether the process has a logo",
        "The order of source comments",
        "An invariant spanning read and write can race unless coordinated through an appropriate atomic mechanism."
      ],
      [
        "A service is runnable but has not received CPU time yet. What subsystem chooses execution order?",
        "The scheduler",
        "The file extension mapper",
        "The text editor",
        "The account display formatter",
        "The scheduler determines when runnable execution streams receive available CPU time."
      ],
      [
        "A manager says this dictionary output certifies production process isolation. What is missing?",
        "Actual OS-boundary evidence",
        "A larger dictionary key",
        "A different print format",
        "More synthetic appointment names",
        "A reference model illustrates a concept but does not execute or validate kernel protection mechanisms."
      ]
    ]
  },
  {
    "comp": "m1.c1",
    "title": "Reason about virtual memory and bounded resources",
    "intro": "A university export job grows until the application becomes unresponsive. Memory is not just a single free-space number: virtual mappings, resident pages, limits and shared machine capacity describe different constraints.",
    "headings": [
      "Understand the boundary",
      "Apply it to an operating decision",
      "Check the model and its limits"
    ],
    "sections": [
      [
        "Virtual memory gives a process an address-space abstraction. Some mapped pages may be resident in physical RAM, backed by files or moved to swap according to the operating system. A virtual size is not the same as current resident memory, and a large address space does not prove all of it occupies RAM.",
        "The kernel manages mappings and protection boundaries, while allocation inside the process is also influenced by the runtime and application. A successful allocation does not promise unlimited future growth or freedom from out-of-memory termination. Resource limits and containers may impose constraints below the host’s total capacity."
      ],
      [
        "Bound resource-consuming operations by input size and measured working set. Exporting an entire university’s records into one in-memory list scales differently from a bounded streaming pipeline. Streaming still requires careful buffering, timeouts and downstream handling; merely naming a function stream does not bound memory.",
        "When memory pressure appears, correlate process resident usage, growth over time, workload and system pressure. A filesystem cache can use RAM productively; indiscriminately clearing caches or disabling limits can harm performance or remove containment. Measurements must match the question being asked."
      ],
      [
        "The fixture calculates a simple admission decision using current modeled usage, a requested reservation and a fixed budget. It permits equality and rejects a request exceeding the budget. The declared units are MiB rather than bytes, avoiding an unstated conversion.",
        "This arithmetic is not a real allocator or host pressure monitor. Concurrent admissions need atomic accounting, actual memory usage can differ from estimates, and operating-system policies remain relevant. The model teaches budget reasoning rather than an operational capacity guarantee."
      ]
    ],
    "code": "budget_mib = 256\nused_mib = 192\nfor request_mib in [32, 64, 80]:\n    print(used_mib + request_mib <= budget_mib)",
    "expect": "True\nTrue\nFalse",
    "problem": "Decide whether a modeled reservation fits within a declared memory budget.",
    "steps": [
      "Keep all values in the declared unit.",
      "Add current usage and one proposed reservation.",
      "Compare the total with the permitted upper boundary."
    ],
    "limit": "A sequential budget predicate does not measure real memory, coordinate concurrent reservations or guarantee that the host can satisfy an allocation.",
    "mistakes": [
      "Comparing virtual size directly with resident usage as if they were identical.",
      "Disabling resource limits before investigating growth."
    ],
    "takeaways": [
      "Specify units and which memory measurement matters.",
      "Use bounded work and verify actual pressure under representative load."
    ],
    "practice": [
      [
        "What does virtual memory provide?",
        "An address-space abstraction",
        "Unlimited physical RAM",
        "A guarantee no process can fail",
        "Only a disk directory name",
        "Virtual addresses abstract mappings and protection rather than promising unlimited physical memory."
      ],
      [
        "Which measurement approximates currently resident pages?",
        "Resident memory",
        "Executable filename length",
        "Virtual size alone",
        "The count of login accounts",
        "Resident usage describes pages currently in RAM under the measurement’s documented semantics."
      ],
      [
        "What should an export’s memory policy bound?",
        "Its working set and buffering",
        "Only its function name",
        "Only its output filename",
        "Only its log message length",
        "A bounded algorithm must control retained data and buffering, not merely advertise streaming."
      ],
      [
        "Why state MiB explicitly in a budget?",
        "To avoid unit ambiguity",
        "To encrypt the values",
        "To remove all estimation error",
        "To disable operating limits",
        "A comparison is meaningful only when amounts use compatible and clearly defined units."
      ],
      [
        "What is the fixture’s equality policy?",
        "An exact fit is allowed",
        "Every exact fit is rejected",
        "The budget doubles on equality",
        "Usage becomes zero on equality",
        "The predicate uses less-than-or-equal, so a reservation reaching the boundary is accepted."
      ],
      [
        "Which evidence can reveal a memory leak trend?",
        "Repeated usage trends",
        "Only one source filename",
        "Only a process icon",
        "Only a CPU vendor string",
        "Growth over comparable workloads and time is more informative than a single unrelated identifier."
      ],
      [
        "What may be smaller than total host RAM?",
        "A container memory limit",
        "The name of a kernel API",
        "Every virtual address value",
        "A service’s version string",
        "A workload can be constrained by a local resource limit even when the host has more RAM."
      ],
      [
        "Why is concurrent admission a separate problem?",
        "Reservations can race",
        "Addition is never deterministic",
        "Every process shares one Python dict",
        "Memory budgets make locking impossible",
        "Independent checks can accept competing reservations unless accounting is coordinated atomically."
      ]
    ],
    "final": [
      [
        "Which value alone does not establish physical RAM consumption?",
        "Virtual address-space size",
        "Documented resident usage",
        "Measured machine pressure",
        "Observed resident growth",
        "Virtual mappings need not all be backed by resident physical pages simultaneously."
      ],
      [
        "Why can a workload fail below the host’s memory total?",
        "Its own limit can be lower",
        "Host totals guarantee each process all RAM",
        "All mapped pages are permanently resident",
        "Limits apply only to file names",
        "Per-container or per-process limits can constrain a workload below machine-wide capacity."
      ],
      [
        "What does the model check for each reservation?",
        "Declared total versus budget",
        "Actual page allocation success",
        "The current kernel eviction order",
        "A production out-of-memory guarantee",
        "It evaluates a numerical policy without invoking an allocator or pressure monitor."
      ],
      [
        "A student-record export retains every row until completion. Which redesign addresses growth?",
        "Bound retained batches",
        "Rename it streaming",
        "Remove the memory limit",
        "Log every record first",
        "Bounded batching or carefully designed streaming reduces retained state; naming does not change behavior."
      ],
      [
        "A service uses 192 MiB under a 256 MiB budget and requests 64 MiB. What is the modeled result?",
        "The exact fit is accepted",
        "It always exceeds the limit",
        "The current usage is reset",
        "The reservation is silently halved",
        "The fixture accepts equality because the sum is exactly the declared budget."
      ],
      [
        "A team mixes bytes and MiB in one comparison. What should be corrected first?",
        "Normalize the units",
        "Increase the process priority",
        "Disable all measurements",
        "Change the output font",
        "Different magnitude units make capacity comparisons invalid unless converted consistently."
      ],
      [
        "RAM use includes a substantial useful file cache. What is a sound response?",
        "Investigate pressure and workload",
        "Delete caches without diagnosis",
        "Assume every cache byte is a leak",
        "Grant every process unlimited memory",
        "Cache usage can be productive, so pressure and workload evidence should guide action."
      ],
      [
        "Two export jobs both pass a check against the same free budget before either reserves. What remains missing?",
        "Atomic budget reservation",
        "More precision in a label",
        "A longer export filename",
        "A different log timezone",
        "Concurrent check-then-reserve operations can overcommit unless the accounting operation is coordinated."
      ],
      [
        "An allocator succeeds in a small fixture. Which claim is unsupported?",
        "Future growth is always safe",
        "The shown allocation succeeded",
        "The fixture reached its output",
        "The current test used a bounded input",
        "A local successful allocation does not certify future workload size or production pressure behavior."
      ],
      [
        "A developer reports only CPU usage for a memory-pressure incident. What additional evidence is relevant?",
        "Resident growth and workload limits",
        "Only the executable’s spelling",
        "Only the number of UI routes",
        "The color of the monitoring chart",
        "The investigation needs measurements and constraints describing memory rather than a CPU metric alone."
      ]
    ]
  },
  {
    "comp": "m1.c2",
    "title": "Understand filesystem paths, metadata and access bits",
    "intro": "A retail service stores invoices under a directory tree. Correctly naming a file, knowing whether it exists and being authorized to read it are different questions. A path is an address in a filesystem namespace, not a permission grant.",
    "headings": [
      "Understand the boundary",
      "Apply it to an operating decision",
      "Check the model and its limits"
    ],
    "sections": [
      [
        "An absolute path begins from a filesystem root; a relative path is interpreted from a current directory or another declared base. Windows and POSIX use different path conventions. Parse them with the appropriate path model rather than splitting every path on one guessed separator.",
        "Filesystem entries have metadata such as type, ownership and permissions. Directories organize name lookup, and a symbolic link can redirect resolution. A text path normalization operation alone does not prove the resolved target is inside an authorized directory when links, mount points or concurrent changes are involved."
      ],
      [
        "Traditional POSIX mode bits distinguish owner, group and other read/write/execute permissions. For a regular file, execute relates to executing its contents. For a directory, execute supports traversal and name lookup, while read supports listing names. Effective access can additionally involve ACLs, capabilities, mount policy and the actual process identity.",
        "An invoice application should minimize stored permissions and check business ownership before delivery. World-readable storage can bypass the application boundary if another path serves the files. File extension, hidden naming and a successful existence test are not authorization controls."
      ],
      [
        "The fixture uses PurePosixPath to inspect lexical components and the stat module to inspect a synthetic mode value. It does not create or open an invoice. The output shows a parent path, a suffix and the owner-read bit.",
        "These observations describe syntax and a modeled bit pattern only. They do not resolve symbolic links, check actual host permissions, inspect ACLs or prove safe file serving. Real access checks must be aligned with the operating system and application’s intended trust boundary."
      ]
    ],
    "code": "from pathlib import PurePosixPath\nimport stat\np = PurePosixPath(\"/srv/invoices/receipt.pdf\")\nmode = 0o640\nprint(p.parent)\nprint(p.suffix)\nprint(bool(mode & stat.S_IRUSR))",
    "expect": "/srv/invoices\n.pdf\nTrue",
    "problem": "Inspect a synthetic POSIX invoice path and one modeled permission bit.",
    "steps": [
      "Parse with the declared POSIX path model.",
      "Read parent and suffix without accessing disk.",
      "Mask the modeled owner-read bit."
    ],
    "limit": "Pure path parsing and synthetic mode inspection do not establish actual filesystem authorization or safe symlink resolution.",
    "mistakes": [
      "Treating a filename suffix or hidden name as an access control.",
      "Assuming lexical path cleanup resolves every filesystem boundary."
    ],
    "takeaways": [
      "Separate path syntax, actual resolution and authorization.",
      "Evaluate directory traversal and file access under the real identity."
    ],
    "practice": [
      [
        "What makes a path relative?",
        "It needs a declared base",
        "It always names a secret",
        "It grants write permission",
        "It cannot contain directories",
        "Relative paths depend on a current or otherwise specified base directory."
      ],
      [
        "What does PurePosixPath inspect without disk access?",
        "Lexical path structure",
        "Actual file ownership",
        "Live ACL enforcement",
        "Every symbolic-link target",
        "Pure paths represent syntax and do not query filesystem metadata or resolve live links."
      ],
      [
        "What does the owner-read bit describe?",
        "A modeled permission flag",
        "The customer owning an invoice",
        "A guarantee the file exists",
        "Encryption of the contents",
        "A mode bit concerns an OS access class, not application business identity or file existence."
      ],
      [
        "What does directory execute commonly permit?",
        "Traversal and lookup",
        "Automatic listing of every name",
        "Encryption of children",
        "Unrestricted file editing",
        "Directory search/traversal differs from reading its entries or modifying children."
      ],
      [
        "Why is a file suffix insufficient for access control?",
        "It is naming metadata",
        "It always verifies the owner",
        "It proves a safe link target",
        "It grants a signed session",
        "An extension describes a name convention, not an authorization decision."
      ],
      [
        "What does a symbolic link affect?",
        "Path resolution",
        "The numeric CPU count",
        "The user’s password verifier",
        "Every network packet’s port",
        "A link can redirect name resolution to another target under filesystem rules."
      ],
      [
        "What may supplement traditional POSIX mode bits?",
        "Access-control lists",
        "The filename’s font",
        "Only a URL fragment",
        "The screen brightness",
        "Actual access may include ACLs and other OS policy beyond the basic three permission classes."
      ],
      [
        "Which boundary remains for serving invoices?",
        "Business ownership checks",
        "Only the file extension",
        "Only path string length",
        "Only the directory label",
        "Filesystem permissions do not automatically decide which application customer may receive an invoice."
      ]
    ],
    "final": [
      [
        "Which path needs a working-directory context to interpret?",
        "invoices/receipt.pdf",
        "/srv/invoices/receipt.pdf",
        "An already resolved absolute target",
        "A mounted root directory",
        "The relative form is interpreted from a base rather than from the filesystem root."
      ],
      [
        "What does suffix inspection establish?",
        "The lexical extension",
        "Actual content safety",
        "Live read permission",
        "Authorized customer identity",
        "The suffix property describes the final path component and does not inspect file bytes or access policy."
      ],
      [
        "Why choose PureWindowsPath for Windows syntax?",
        "Its parsing rules match that path form",
        "It grants Windows administrator access",
        "It resolves every UNC target online",
        "It installs a Windows kernel",
        "A pure path class models naming conventions without providing operating-system privileges or connectivity."
      ],
      [
        "A service lets any customer download a world-readable invoice file. Which check is missing at the app boundary?",
        "Customer access checks",
        "Only a longer suffix",
        "Only a hidden filename",
        "Only a directory color",
        "OS readability does not encode which authenticated customer owns a business document."
      ],
      [
        "A team strips dot segments then claims every file is confined. What still requires review?",
        "Actual resolution and links",
        "Only the output capitalization",
        "Only the text editor encoding",
        "Whether every path has a suffix",
        "Lexical normalization alone does not settle symbolic-link, mount or concurrent filesystem behavior."
      ],
      [
        "A directory allows reading names but denies traversal. Which distinction matters?",
        "Listing and lookup differ",
        "Read always implies execute",
        "Directory permissions are ignored",
        "File suffixes grant traversal",
        "Directory read and execute/search serve different operations, so listing does not guarantee access to each child."
      ],
      [
        "An invoice exists but the service account lacks access. Which claim is wrong?",
        "Existence guarantees readable contents",
        "Existence and access are distinct",
        "The account identity matters",
        "Actual access policy must be evaluated",
        "Finding a name does not grant permission to open the target under the current identity."
      ],
      [
        "A 0640 synthetic mode has owner-read set. What does the fixture prove?",
        "That bit is present",
        "A real file is readable by every user",
        "Every ACL grants access",
        "The invoice belongs to the requester",
        "A numerical mask establishes a property of the supplied integer, not the host’s effective permissions."
      ],
      [
        "A hidden filename is exposed through another route. What is the underlying mistake?",
        "Obscurity was treated as permission",
        "The name had too many letters",
        "The file used an absolute path",
        "The owner-read bit was documented",
        "Hiding a name does not enforce access when another route can retrieve the same resource."
      ],
      [
        "A storage reviewer must certify effective access. What evidence exceeds this pure-path fixture?",
        "Real identity and policy checks",
        "Another lexical suffix print",
        "A different parent path label",
        "An extra string length assertion",
        "Effective access depends on actual filesystem and account policy, not path syntax alone."
      ]
    ]
  },
  {
    "comp": "m2.c1",
    "title": "Distinguish account identity, groups and granted authority",
    "intro": "A university support employee belongs to a helpdesk group but should not automatically become an admissions administrator. Accounts identify operating principals; groups support policy organization; permissions determine allowed operations.",
    "headings": [
      "Understand the boundary",
      "Apply it to an operating decision",
      "Check the model and its limits"
    ],
    "sections": [
      [
        "A user account represents an operating-system principal. A group collects identities for policy or administration. A process runs with a security context, which can include effective user and group information. A displayed username supplied in an input file is not trusted evidence of that context.",
        "Separate human interactive accounts from service accounts where the operating model requires it. A service account should receive only the resources its job needs, not a copy of every administrator permission. Shared human accounts weaken accountability because actions cannot be reliably attributed to one person."
      ],
      [
        "Group membership can simplify granting read access to a support directory, but membership needs an owner and lifecycle review. Joining one group should not be interpreted as universal permission outside its actual policy scope. Removing a person’s employment record is not by itself proof that every active credential or cached membership was revoked.",
        "The model checks a synthetic process account’s groups against a required group for one read operation. It does not query the host identity service or account directory. Real systems can apply additional policy, primary/supplementary group semantics and session refresh rules."
      ]
    ],
    "code": "actor = {\"user\": \"support-demo\", \"groups\": {\"helpdesk\"}}\nprint(\"helpdesk\" in actor[\"groups\"])\nprint(\"admissions-admin\" in actor[\"groups\"])",
    "expect": "True\nFalse",
    "problem": "Evaluate two group-membership predicates for a synthetic support principal.",
    "steps": [
      "Represent the known account separately from its group set.",
      "Check the explicitly required membership.",
      "Observe that an unrelated group is not granted."
    ],
    "limit": "The set model demonstrates scoped membership decisions only; it is not a live account lookup, authentication system or complete access-control implementation.",
    "mistakes": [
      "Trusting a username posted in an input document as the process identity.",
      "Using shared administrator accounts for routine service execution."
    ],
    "takeaways": [
      "Keep identity, membership and operation permission distinct.",
      "Review service and human account lifecycles."
    ],
    "practice": [
      [
        "What does an operating-system user account represent?",
        "A security principal",
        "A universal permission grant",
        "A filename extension",
        "A CPU scheduling algorithm",
        "An account identifies an operating principal while separate policy controls its allowed actions."
      ],
      [
        "What is a group commonly used to organize?",
        "Shared access policy",
        "Physical RAM pages",
        "Every network route",
        "Application source formatting",
        "Groups support membership-based administration and policy rather than arbitrary machine resources."
      ],
      [
        "What should determine a service account’s grants?",
        "Its required operations",
        "Every administrator privilege",
        "The longest group name",
        "Its dashboard color",
        "Least privilege starts from the resources and actions needed for the service’s actual job."
      ],
      [
        "Why avoid one shared human administrator account?",
        "Attribution becomes weaker",
        "It eliminates all password risks",
        "It always prevents logins",
        "It disables audit logging automatically",
        "Shared credentials make it harder to attribute actions reliably to a specific responsible person."
      ],
      [
        "What is missing from a posted username alone?",
        "Verified identity context",
        "A text representation",
        "A possible account label",
        "An input string",
        "A caller-controlled name does not prove the operating or authenticated principal behind an action."
      ],
      [
        "Does helpdesk membership grant admissions-admin in the fixture?",
        "No",
        "Always on weekdays",
        "Only if the string is longer",
        "Yes for every read",
        "The model grants only explicitly present membership, not an unrelated group by implication."
      ],
      [
        "What needs review when a person leaves an organization?",
        "Accounts and active authority",
        "Only their display name",
        "Only their browser theme",
        "Only their old desk location",
        "Offboarding must address credentials, sessions and memberships rather than a single descriptive record."
      ],
      [
        "What does the set fixture fail to establish?",
        "Actual host membership",
        "Its own membership result",
        "The supplied account label",
        "The existence of a Python set",
        "It evaluates synthetic data and never queries the operating system or identity directory."
      ]
    ],
    "final": [
      [
        "Which concept identifies a principal rather than granting every action?",
        "A user account",
        "A universal administrator role",
        "An unbounded permission wildcard",
        "An always-allow policy",
        "Identity and allowed authority are separate aspects of access control."
      ],
      [
        "What does a group-membership decision require?",
        "A trusted membership source",
        "A caller’s preferred group label",
        "Only a matching display color",
        "A filename containing admin",
        "Membership used for permission must come from a source whose authority is established."
      ],
      [
        "Why separate a service account from routine human login?",
        "Separate lifecycle needs",
        "To remove every access check",
        "To share all employee credentials",
        "To prevent any useful auditing",
        "Services and people have different operations, credential lifecycles and attribution requirements."
      ],
      [
        "A helpdesk worker can read support logs. May the application infer permission to change admissions decisions?",
        "No, that is another grant",
        "Yes because both use one machine",
        "Yes if their username is long",
        "Yes if support logs are readable",
        "A scoped group grant does not authorize an unrelated sensitive operation."
      ],
      [
        "A worker posts user=administrator in a request body. Which identity should an OS operation use?",
        "Trusted process context",
        "The posted label",
        "The longest account name",
        "Any group in the request",
        "Caller data must not substitute for trusted account and privilege context."
      ],
      [
        "An account is removed from HR but its active service credentials remain valid. What is unproven?",
        "Complete offboarding",
        "The HR record changed",
        "The credential still has authority",
        "The service can receive requests",
        "Updating a personnel record does not establish revocation throughout the credential lifecycle."
      ],
      [
        "An administrator grants a web worker full machine rights to read one log. What should be reduced?",
        "The grant’s scope",
        "The log’s timestamp precision",
        "Only the username length",
        "Only the file’s title",
        "Authority should be limited to the required operation rather than every privileged resource."
      ],
      [
        "An audit lists actions under one shared support account. What conclusion is limited?",
        "Individual attribution",
        "The account label used",
        "The logged operation category",
        "The observed event time",
        "Shared account use does not uniquely identify the person responsible for each action."
      ],
      [
        "A synthetic membership test passes. What is required before claiming real access is correct?",
        "Actual identity-policy evidence",
        "A second printed account alias",
        "A longer group string",
        "More sample employee names",
        "A model result does not establish live directory state or effective OS access policy."
      ],
      [
        "A team reviews group access annually but never removes temporary incident grants. What is missing?",
        "Grant lifecycle control",
        "A new display convention",
        "A larger user identifier",
        "Another source-code formatter",
        "Temporary authority needs explicit expiry or review and revocation tied to its actual use."
      ]
    ]
  },
  {
    "comp": "m2.c1",
    "title": "Apply least privilege and separate administrative operations",
    "intro": "A logistics worker needs to append one application log. Running the entire application as administrator would also expose package management, system configuration and other customers’ data. Reduce authority at the boundary where it is needed.",
    "headings": [
      "Understand the boundary",
      "Apply it to an operating decision",
      "Check the model and its limits"
    ],
    "sections": [
      [
        "Least privilege grants the minimum actions on the minimum resources for the required duration. It is not simply selecting the shortest role name. Administrative operations should be separate from ordinary request handling when possible, with controlled elevation and audit evidence.",
        "On Linux, root and privileged mechanisms can bypass many ordinary restrictions. On Windows, administrator membership and elevation affect the security context, and policies can further constrain operation. A process should not assume that a desktop user’s visible account name proves every privilege is active."
      ],
      [
        "Start from a capability inventory: append this log, read this configuration, bind this listener and communicate with this dependency. Avoid wildcard write grants just because one narrowly scoped access failed. Investigate ownership, target path and required operation before escalating.",
        "The fixture represents grants as exact operation/resource pairs. A worker can append the designated log but cannot edit system configuration. This is a policy model, not an implementation of POSIX capabilities, sudo, Windows UAC or an audited privilege broker."
      ]
    ],
    "code": "grants = {(\"append\", \"/var/log/demo/app.log\")}\nfor action, target in [(\"append\", \"/var/log/demo/app.log\"), (\"write\", \"/etc/demo.conf\")]:\n    print((action, target) in grants)",
    "expect": "True\nFalse",
    "problem": "Distinguish one necessary append grant from unrelated configuration authority.",
    "steps": [
      "List the required operation and target.",
      "Match exact operation-resource pairs.",
      "Reject a pair not explicitly granted."
    ],
    "limit": "Exact tuples illustrate scope; real operating-system elevation and effective access need their own reviewed implementation.",
    "mistakes": [
      "Escalating the entire service after one denied file operation.",
      "Treating a role name as evidence of its actual permissions."
    ],
    "takeaways": [
      "Inventory actual operations before granting authority.",
      "Keep routine execution separate from controlled administration."
    ],
    "practice": [
      [
        "What does least privilege minimize?",
        "Unneeded authority",
        "Every useful log field",
        "All available CPU cores",
        "The length of all filenames",
        "Least privilege limits actions, resources and duration to the job’s actual requirements."
      ],
      [
        "Why separate administrative operations from request handlers?",
        "To narrow privileged exposure",
        "To make every request root",
        "To remove audit evidence",
        "To share every secret",
        "Separating routine and privileged work can reduce the impact of a handler failure or compromise."
      ],
      [
        "What should precede adding a wildcard write grant?",
        "Inspect the failed operation",
        "Disable all file controls",
        "Rename the service admin",
        "Delete every error log",
        "Determine the required target, action and existing policy before broadening access."
      ],
      [
        "What does the tuple fixture match?",
        "Action and resource together",
        "Only a user’s display name",
        "Only the count of characters",
        "Every path with the same suffix",
        "Permission scope includes both the operation and the target resource."
      ],
      [
        "Which operation is denied by the fixture?",
        "Writing /etc/demo.conf",
        "Appending the designated log",
        "Checking the grant set",
        "Reading the synthetic tuple",
        "The only configured authority is append access to one specified log target."
      ],
      [
        "Why is a role’s name insufficient?",
        "Its grants define authority",
        "Long names always grant more",
        "Short names always grant less",
        "Names cannot be stored in logs",
        "A label does not reveal whether its actual permission set is narrow or broad."
      ],
      [
        "What must a temporary privileged grant include?",
        "A lifecycle policy",
        "Only a permanent wildcard",
        "An unrecorded shared password",
        "A public support URL",
        "Temporary authority needs issuance, use and retirement or expiry under a defined policy."
      ],
      [
        "What does the tuple model not implement?",
        "Real privilege elevation",
        "An exact membership lookup",
        "A synthetic allow decision",
        "A synthetic deny decision",
        "It compares data and does not invoke sudo, UAC, capabilities or another elevation mechanism."
      ]
    ],
    "final": [
      [
        "Which is the narrower grant for a log writer?",
        "Append one designated log",
        "Write every file on the host",
        "Run every command as root",
        "Change every service account",
        "Resource- and action-specific authority better matches a limited logging requirement."
      ],
      [
        "Why does a denied operation not justify universal elevation?",
        "The missing grant may be narrow",
        "All denials mean the kernel is broken",
        "Root is required for every write",
        "File permissions are only cosmetic",
        "Diagnosis can reveal a scoped access need instead of a need for unrestricted authority."
      ],
      [
        "What should an administrative audit record support?",
        "Who changed which resource",
        "Public release of every secret",
        "A shared anonymous operator",
        "Only the terminal color",
        "Useful accountability needs actor, action and target evidence without unnecessary sensitive disclosure."
      ],
      [
        "A logistics application cannot append one log and is redeployed as root. What is the risk?",
        "Excess authority expands impact",
        "Appending becomes cryptographically verified",
        "All business permissions become correct",
        "Its memory is now isolated by role name",
        "Broad privilege exposes resources unrelated to the original narrow requirement."
      ],
      [
        "A grant permits append but a request attempts arbitrary overwrite. What must the policy distinguish?",
        "Operation semantics",
        "Only path capitalization",
        "Only request-body indentation",
        "Only a route’s marketing name",
        "Different actions on one resource can carry materially different authority and impact."
      ],
      [
        "A temporary incident grant is never removed. What principle has weakened?",
        "Time-bounded privilege",
        "The application’s source formatting",
        "The existence of a process",
        "The naming of the log file",
        "Authority intended for a short event should not silently become permanent operational access."
      ],
      [
        "A reviewer sees role=limited but the role grants every resource. What should be judged?",
        "The actual permission set",
        "Only the reassuring label",
        "Only the username spelling",
        "Only the role description length",
        "Permission semantics determine authority regardless of how a role is named."
      ],
      [
        "A Windows service runs under a different account from the interactive desktop user. Which context matters for its file operation?",
        "The service’s effective context",
        "The desktop wallpaper owner",
        "The account named in a request body",
        "The author of the executable",
        "Effective operation authority belongs to the executing security context, subject to actual policy."
      ],
      [
        "A team wants a package update during a support request. Which design deserves review?",
        "A separate controlled admin path",
        "Root rights on every public handler",
        "Public unauthenticated package commands",
        "A caller-selected administrator name",
        "Privileged maintenance should not be casually embedded in ordinary request authority."
      ],
      [
        "The model denies a tuple. Can it certify the deployed host denies that operation?",
        "No, deployment evidence is needed",
        "Yes, strings enforce every OS policy",
        "Yes, all hosts use this Python set",
        "Yes, denied text revokes real credentials",
        "A policy illustration does not establish actual operating-system enforcement or configuration."
      ]
    ]
  },
  {
    "comp": "m2.c1",
    "title": "Review permission changes and preserve accountability",
    "intro": "A customer-support team changes access during a staffing rotation. A correct grant today can become excessive tomorrow. Permission review includes issuance, ownership, evidence and revocation rather than merely checking that a login succeeds.",
    "headings": [
      "Understand the boundary",
      "Apply it to an operating decision",
      "Check the model and its limits"
    ],
    "sections": [
      [
        "An access review asks whether each principal still needs each grant, who is responsible for approving it and how exceptions expire. Service accounts and automation identities need review as well as employees. A successful login demonstrates a narrow authentication event, not appropriate permission scope.",
        "Accountability depends on protected evidence: record the verified operator, action, target and outcome using an agreed time basis. Avoid recording raw passwords, session tokens or unnecessary personal data. Restrict log access and retention because audit evidence can itself be sensitive."
      ],
      [
        "Revocation must consider running sessions, cached identity data and remote dependencies under the system’s documented behavior. Deleting one configuration line does not prove every current process or credential has lost authority. Verify the intended negative case after the change.",
        "The fixture filters a list of synthetic grants against an explicit expiry boundary and emits only nonsecret review fields. It models a reviewer’s inventory decision, not real-time access enforcement, a directory synchronization system or proof that all active sessions were revoked."
      ]
    ],
    "code": "now = 100\ngrants = [{\"principal\": \"support-demo\", \"expires\": 120}, {\"principal\": \"temp-demo\", \"expires\": 100}]\nactive = [g[\"principal\"] for g in grants if now < g[\"expires\"]]\nprint(active)",
    "expect": "['support-demo']",
    "problem": "Identify which synthetic grant remains inside its declared validity interval.",
    "steps": [
      "Define the current fixture time.",
      "Apply the strict now-before-expiry rule.",
      "Project only the principal label for review."
    ],
    "limit": "This list transformation does not revoke credentials, update host users or invalidate actual application sessions.",
    "mistakes": [
      "Treating a successful login as proof that all grants remain justified.",
      "Logging raw credentials to improve audit detail."
    ],
    "takeaways": [
      "Review justification and expiry as well as account existence.",
      "Test actual revocation behavior at the relevant boundary."
    ],
    "practice": [
      [
        "What question belongs in an access review?",
        "Does this grant remain needed?",
        "Does the account label look friendly?",
        "Is the username longer than before?",
        "Does the desktop have a new theme?",
        "Access review evaluates continuing necessity and accountable approval of actual authority."
      ],
      [
        "Which identities need periodic access review?",
        "People and service identities",
        "Only employees with laptops",
        "Only accounts lacking a photo",
        "Only the newest usernames",
        "Automation and service accounts can retain unnecessary authority just as human accounts can."
      ],
      [
        "What should audit evidence avoid exposing?",
        "Raw session credentials",
        "The safe action category",
        "The verified actor reference",
        "The recorded outcome",
        "Credentials in audit logs create additional authority-bearing disclosure paths."
      ],
      [
        "What is the fixture’s expiry-equality result?",
        "The grant is inactive",
        "The grant becomes permanent",
        "The grant is renewed twice",
        "The grant changes principal",
        "The model requires now strictly before expiry, so equality is outside the valid interval."
      ],
      [
        "Why verify a negative case after revocation?",
        "To check intended denial",
        "To delete all historical evidence",
        "To publish every account secret",
        "To rename every role",
        "A recorded change is not the same as evidence that the relevant access path now rejects the grant."
      ],
      [
        "What can make revocation behavior noninstantaneous?",
        "Sessions and cached state",
        "Only filename capitalization",
        "Only a chart’s font size",
        "The count of source comments",
        "Active or cached authority can outlive a configuration change under the system’s lifecycle rules."
      ],
      [
        "Why control access to audit logs?",
        "They can contain sensitive evidence",
        "They are always public by definition",
        "They never identify a principal",
        "They replace every permission check",
        "Operational evidence may reveal sensitive activities and needs its own access and retention policy."
      ],
      [
        "What is the fixture actually doing?",
        "Filtering synthetic records",
        "Changing real host accounts",
        "Killing active user sessions",
        "Rotating production secrets",
        "It transforms supplied data without accessing a live identity or operating-system service."
      ]
    ],
    "final": [
      [
        "What does a successful login fail to establish?",
        "Every grant is justified",
        "A credential was accepted in that event",
        "A login path returned success",
        "The observed authentication occurred",
        "Authentication success does not evaluate whether the account’s full permission set remains necessary."
      ],
      [
        "Why assign an owner to a temporary grant?",
        "Someone must review its lifecycle",
        "It makes the grant universally safe",
        "It removes every expiry condition",
        "It replaces all audit records",
        "Accountable ownership supports review, renewal decisions and timely removal of exceptional authority."
      ],
      [
        "Which audit field can be useful without copying a credential?",
        "Verified actor reference",
        "Raw refresh token",
        "Plaintext password",
        "The full authorization header",
        "A safe actor identifier supports attribution without reproducing authority-bearing secret values."
      ],
      [
        "A staff rotation removes a group entry but old sessions keep acting. What needs review?",
        "Effective revocation behavior",
        "Only the spelling of the group",
        "Only the number of log files",
        "Whether the UI has refreshed its logo",
        "Permission lifecycle must account for existing sessions and cached claims, not only the edited record."
      ],
      [
        "A grant expires at 100 and now is 100 under now<expires. Is it active?",
        "No",
        "Yes until 101 automatically",
        "Yes until the next login",
        "Yes if its label is short",
        "The declared strict interval excludes the equality boundary."
      ],
      [
        "A log includes every password to make investigations easier. What is wrong?",
        "Audit evidence now leaks authority",
        "More log detail is always harmless",
        "Passwords cease to be secrets in logs",
        "Only failed passwords need protection",
        "Operational logging must preserve useful evidence while excluding raw credentials and controlling disclosure."
      ],
      [
        "A review considers only human staff and ignores an old integration account. What is missing?",
        "Service-identity governance",
        "A new chart layout",
        "Another account display prefix",
        "A shorter review document",
        "Nonhuman principals also retain grants and require justification, owners and lifecycle management."
      ],
      [
        "A reviewer approves a change but never tests the denied operation. What remains unproven?",
        "The intended enforcement result",
        "That a review record exists",
        "That a proposal was written",
        "That an approver clicked approval",
        "Administrative intent is distinct from observed access behavior after the change."
      ],
      [
        "A team deletes all audit history during offboarding. What tradeoff was ignored?",
        "Retention and accountability",
        "A requirement for longer usernames",
        "A rule that logs must be public",
        "A need for higher CPU priority",
        "Offboarding should follow evidence-retention policy rather than destroying relevant accountability data indiscriminately."
      ],
      [
        "A synthetic filtered list excludes temp-demo. Which claim is unsupported?",
        "Its live session was revoked",
        "The list applied the fixture predicate",
        "The fixture excluded equality",
        "The supplied records were evaluated",
        "The model does not contact any real session or account enforcement system."
      ]
    ]
  },
  {
    "comp": "m3.c1",
    "title": "Navigate Windows and POSIX paths deliberately",
    "intro": "A support runbook names a Windows log directory while the engineer’s terminal is on Linux. Treating both strings with one separator rule can select the wrong parent or construct an invalid location. Choose the path convention before navigating.",
    "headings": [
      "Understand the boundary",
      "Apply it to an operating decision",
      "Check the model and its limits"
    ],
    "sections": [
      [
        "POSIX paths commonly use slash-separated names rooted at /. Windows paths can include drive letters and UNC shares, and path interpretation can depend on the current drive or directory. A path copied from another machine is not proof that the target exists on this host.",
        "Use navigation commands such as pwd and ls on a POSIX shell or Get-Location and Get-ChildItem in PowerShell to establish context. Inspect before changing data. Command names and aliases vary, so distinguish shell vocabulary from the operating-system operation being requested."
      ],
      [
        "Relative paths make a script dependent on its working directory unless a stable base is chosen. Services and scheduled jobs often start in a different directory from an interactive terminal. Construct configuration and log paths from explicit, documented bases rather than assuming the engineer’s terminal context.",
        "The fixture parses a Windows path and a POSIX path using the matching pure-path classes. It inspects the drive and parent lexically without opening files or connecting to a share. It does not provide a cross-platform filesystem compatibility layer or grant permission to those locations."
      ]
    ],
    "code": "from pathlib import PureWindowsPath, PurePosixPath\nw = PureWindowsPath(\"C:/ProgramData/Demo/app.log\")\np = PurePosixPath(\"/var/log/demo/app.log\")\nprint(w.drive)\nprint(p.parent)",
    "expect": "C:\n/var/log/demo",
    "problem": "Identify drive and parent under two explicit path conventions.",
    "steps": [
      "Choose the parser matching each path form.",
      "Read the Windows drive component.",
      "Read the POSIX parent without accessing disk."
    ],
    "limit": "Pure path objects inspect syntax; the fixture does not verify file existence, share availability or permission on either operating system.",
    "mistakes": [
      "Using one guessed separator for every platform.",
      "Assuming a service inherits the interactive terminal’s working directory."
    ],
    "takeaways": [
      "Establish platform and base directory before navigating.",
      "Keep lexical path interpretation separate from live filesystem access."
    ],
    "practice": [
      [
        "Which command commonly shows a POSIX working directory?",
        "pwd",
        "chmod",
        "kill",
        "useradd",
        "The pwd command reports the current working directory rather than changing permissions or processes."
      ],
      [
        "Which PowerShell command reports current location?",
        "Get-Location",
        "Stop-Service",
        "Set-ExecutionPolicy",
        "Remove-Item",
        "Get-Location reports location context without being a service or deletion operation."
      ],
      [
        "Why can relative paths fail in a scheduled job?",
        "Its working directory differs",
        "Relative paths encrypt contents",
        "Every scheduler removes directories",
        "A path suffix changes the kernel",
        "A different starting directory changes what a relative name refers to."
      ],
      [
        "What does a Windows drive component identify lexically?",
        "A drive prefix",
        "A verified remote credential",
        "A Linux user group",
        "A guaranteed physical disk",
        "A drive prefix is part of path syntax and does not establish the underlying physical storage or authority."
      ],
      [
        "What should precede destructive filesystem work?",
        "Inspect the target context",
        "Assume the current location",
        "Copy a command blindly",
        "Disable all path checks",
        "Confirming location and target reduces accidental operations on unintended resources."
      ],
      [
        "What does the POSIX model return as parent?",
        "/var/log/demo",
        "C:",
        "The current host’s username",
        "A live network share",
        "PurePosixPath computes the lexical parent of the supplied path without querying the host."
      ],
      [
        "What is not proved by copying a runbook path?",
        "That it exists here",
        "That the text was copied",
        "That a location was named",
        "That the runbook has characters",
        "A location on one machine or environment need not exist on another."
      ],
      [
        "What should a robust service path use?",
        "A documented stable base",
        "Only a terminal’s last directory",
        "A caller-selected root account",
        "An arbitrary browser URL",
        "Explicit bases avoid depending on an incidental interactive working directory."
      ]
    ],
    "final": [
      [
        "Which path type models drive-letter syntax?",
        "PureWindowsPath",
        "PurePosixPath as universal Windows resolution",
        "A URL parser as an ACL checker",
        "A hostname as a directory",
        "The Windows pure-path model understands drive and Windows separator conventions lexically."
      ],
      [
        "What is a relative path interpreted against?",
        "A current or declared base",
        "Every account on the machine",
        "The kernel version string",
        "A universal cloud region",
        "Without an absolute root, the interpretation depends on context or an explicit base."
      ],
      [
        "What is the safe first step when a runbook’s target is uncertain?",
        "Confirm platform and location",
        "Run recursive deletion",
        "Grant root to the terminal",
        "Assume every path is local",
        "Inspection establishes context before a potentially destructive operation."
      ],
      [
        "A Linux support terminal receives C:/ProgramData/Demo/app.log. What should the engineer avoid?",
        "Assuming native POSIX meaning",
        "Identifying its Windows syntax",
        "Checking the actual target machine",
        "Using the appropriate path parser",
        "Cross-platform strings require deliberate interpretation rather than assuming the local convention applies."
      ],
      [
        "An application works interactively but misses a relative config under a service. What is a likely context difference?",
        "The working directory",
        "The host timezone",
        "The number of desktop icons",
        "The user’s screen resolution",
        "A service can start in a different directory, changing relative path resolution."
      ],
      [
        "A pure path parser accepts a string. What can still be unknown?",
        "Actual existence and access",
        "Its lexical path components",
        "Its supplied text",
        "The parser class used",
        "Syntactic interpretation is distinct from querying a live filesystem or evaluating permission."
      ],
      [
        "A script splits every path on slash and loses a Windows drive context. What should replace that assumption?",
        "Platform-aware path handling",
        "A longer filename extension",
        "A different terminal font",
        "A larger process identifier",
        "Appropriate path abstractions preserve conventions that ad hoc splitting can mishandle."
      ],
      [
        "A team runs an unverified delete command after changing terminals. Which precaution was missed?",
        "Inspecting the target context",
        "Naming the script descriptively",
        "Adding more comments only",
        "Choosing a shorter alias",
        "The active location and actual target must be checked at execution time rather than assumed from another terminal."
      ],
      [
        "A UNC share name is parsed successfully while the network is disconnected. What does success mean?",
        "Only syntax was interpreted",
        "The share is reachable",
        "The user authenticated remotely",
        "The files were synchronized",
        "Pure parsing does not perform network lookup, authentication or transfer."
      ],
      [
        "A documentation screenshot shows /var/log/demo. Can that certify this host contains it?",
        "No, inspect this environment",
        "Yes, screenshots create directories",
        "Yes, every Linux host has the same app",
        "Yes, paths bypass installation",
        "Application-specific directories depend on actual installation and environment state."
      ]
    ]
  },
  {
    "comp": "m3.c1",
    "title": "Find and interpret logs without exposing private data",
    "intro": "A university portal reports an error at a known time. The useful evidence may be in an application log, a system journal or Windows Event Log. Search by the relevant service and time window instead of dumping every log and credential into a support ticket.",
    "headings": [
      "Understand the boundary",
      "Apply it to an operating decision",
      "Check the model and its limits"
    ],
    "sections": [
      [
        "Logs record events from a particular source and perspective. A single event can show that an application observed a failure, but may not identify the root cause. Establish the service, timestamp interpretation, severity and a safe correlation identifier before joining evidence.",
        "On systemd-based Linux systems, journalctl can filter journal entries by unit and time. Windows Event Viewer and PowerShell event-log tools expose channel/provider-based evidence under the system’s permissions. Not every Linux distribution uses systemd and not every application writes to the same location."
      ],
      [
        "Use narrow, read-only collection to reduce noise and disclosure. Logs can contain personal data, credentials or internal topology; a log being readable locally does not make it suitable for public sharing. Redact according to a reviewed policy while preserving the facts needed to investigate.",
        "The fixture filters synthetic structured events by service and severity, then projects safe fields. It demonstrates selection and data minimization without reading host logs. It does not validate journal retention, Windows event providers, clock synchronization or a production redaction pipeline."
      ]
    ],
    "code": "events = [{\"service\":\"portal\", \"level\":\"ERROR\", \"id\":\"r1\", \"detail\":\"SYNTHETIC-PRIVATE\"}, {\"service\":\"billing\", \"level\":\"ERROR\", \"id\":\"r2\"}, {\"service\":\"portal\", \"level\":\"INFO\", \"id\":\"r3\"}]\nselected = [{\"id\": e[\"id\"], \"level\": e[\"level\"]} for e in events if e[\"service\"] == \"portal\" and e[\"level\"] == \"ERROR\"]\nprint(selected)",
    "expect": "[{'id': 'r1', 'level': 'ERROR'}]",
    "problem": "Collect a narrow synthetic portal error record without its private detail field.",
    "steps": [
      "Select the requested service.",
      "Restrict the severity to the investigated event class.",
      "Project only the declared safe fields."
    ],
    "limit": "This supplied-list filter does not inspect real logs or establish complete redaction of nested, evolving production data.",
    "mistakes": [
      "Treating every logged error as an already-proven root cause.",
      "Sharing unrestricted logs because they were locally readable."
    ],
    "takeaways": [
      "Identify source and time semantics before correlating events.",
      "Collect the minimum safe evidence needed for the question."
    ],
    "practice": [
      [
        "What should identify the relevant log source?",
        "Service or provider context",
        "Only the terminal font",
        "Only the longest file",
        "Every account’s password",
        "Source context links an event to the component that recorded it."
      ],
      [
        "What is journalctl commonly used to inspect?",
        "The systemd journal",
        "A universal Windows registry",
        "All cloud invoices",
        "Every browser’s local storage",
        "On systemd-based systems it queries journal data subject to permissions and configuration."
      ],
      [
        "What should a time-window investigation establish?",
        "Timestamp interpretation",
        "Only the event’s color",
        "Only the hostname length",
        "The engineer’s keyboard layout",
        "Timezone, clock and timestamp meaning affect correlation across sources."
      ],
      [
        "Why collect only relevant records?",
        "Reduce noise and disclosure",
        "Guarantee no failure occurred",
        "Remove every audit trail",
        "Avoid all source attribution",
        "Narrow evidence helps focus analysis while limiting unrelated sensitive information exposure."
      ],
      [
        "What is a safe correlation identifier intended to do?",
        "Link related events",
        "Carry a raw session token",
        "Replace all authorization",
        "Reveal every request body",
        "Correlation should connect evidence without reproducing authority-bearing credentials or full private payloads."
      ],
      [
        "What does the fixture omit?",
        "The private detail field",
        "The selected event id",
        "The declared severity",
        "The supplied service filter",
        "The projection emits only the explicitly allowlisted id and level fields."
      ],
      [
        "Can an application error alone prove root cause?",
        "No",
        "Always for any ERROR label",
        "Only if its message is long",
        "Yes after changing the font",
        "An observed failure is evidence from one component and needs context before causal conclusions."
      ],
      [
        "Which platform tool can inspect Windows event channels?",
        "Event Viewer",
        "journalctl as every Windows default",
        "chmod as a log viewer",
        "A path suffix parser",
        "Windows Event Viewer provides channel/provider-based log inspection under the machine’s policy."
      ]
    ],
    "final": [
      [
        "What does a log event primarily establish?",
        "What its source observed",
        "The full causal chain automatically",
        "That every related host agrees",
        "That no other failure exists",
        "A record is evidence from its producer’s perspective rather than a complete causal explanation."
      ],
      [
        "Why is a raw access token inappropriate as a correlation id?",
        "It carries credential authority",
        "It is too informative about formatting",
        "It prevents every log write",
        "It cannot be stored as text",
        "Copying credentials into routine logs creates additional places from which authority can be exposed."
      ],
      [
        "What scope is useful when querying a systemd journal?",
        "Relevant unit and time",
        "Every secret environment value",
        "All user passwords",
        "Only the screen brightness",
        "Narrow source/time filters focus the question and reduce unrelated data collection."
      ],
      [
        "A support ticket asks for all logs from every service. What should be considered first?",
        "Relevant evidence and disclosure",
        "Whether the zip filename is short",
        "Whether every log uses uppercase",
        "Only the ticket’s theme",
        "Broad collection can expose sensitive unrelated data and bury useful evidence in noise."
      ],
      [
        "Two services use different timezones in their log display. What must correlation account for?",
        "Consistent time interpretation",
        "Only alphabetic event ordering",
        "Only the longest timestamp string",
        "The order files were opened",
        "Events must be aligned using actual time semantics rather than visually similar local labels."
      ],
      [
        "A portal log says database timeout. What is the next sound interpretation?",
        "A symptom needing context",
        "A proven database fault",
        "Proof every query is corrupt",
        "Proof the network is perfect",
        "The message reports one observed condition, not a complete root-cause determination."
      ],
      [
        "An engineer can read a private log locally. May it be posted publicly without review?",
        "No",
        "Yes, read means publish",
        "Yes if copied as plain text",
        "Yes after changing the filename",
        "Local operational access and public disclosure authority are different permissions and responsibilities."
      ],
      [
        "A projection test excludes one private field. What broader assurance remains unproven?",
        "Complete production redaction",
        "The shown field was excluded",
        "The fixture output was selected",
        "The input was synthetic",
        "A flat allowlist test does not cover nested fields, future schema changes or actual pipeline handling."
      ],
      [
        "A Linux machine has no systemd journal. What should the runbook do?",
        "Use its actual logging system",
        "Assume logs cannot exist",
        "Install an unrelated service blindly",
        "Treat Windows channels as local files",
        "Tooling and log location depend on the installed operating system and service configuration."
      ],
      [
        "A reviewer wants evidence for a user-facing error without private payloads. Which design fits?",
        "Safe identifiers and outcomes",
        "Complete raw request bodies",
        "Every authentication header",
        "An unfiltered environment dump",
        "Useful diagnosis can rely on selected nonsecret metadata under an explicit disclosure policy."
      ]
    ]
  },
  {
    "comp": "m3.c1",
    "title": "Distinguish service configuration from current process health",
    "intro": "A logistics API is configured to start at boot but is currently stopped. Another process is running but has failed its application health check. Service configuration, process existence and useful behavior need separate evidence.",
    "headings": [
      "Understand the boundary",
      "Apply it to an operating decision",
      "Check the model and its limits"
    ],
    "sections": [
      [
        "A service manager supervises configured units or services according to policy. In systemd, a service can be enabled for activation at boot yet not currently active; starting a service now and enabling future startup are different actions. Windows Services similarly separates startup configuration from current service state.",
        "A running process does not prove the application can serve its dependency-dependent workload. Health checks should measure an appropriate behavior and avoid publishing sensitive configuration. A restart can temporarily restore service while hiding evidence of a recurring fault, so inspect and preserve relevant diagnostics first."
      ],
      [
        "Use read-only state and recent logs to establish the affected unit, last change and observed failure before modifying it. On an owned isolated host, an authorized operator can then apply a narrowly scoped correction and verify the intended result. Do not restart every service or disable authentication to make a check appear green.",
        "The fixture evaluates synthetic service records containing enabled, running and healthy fields. It distinguishes startup intent from current state and identifies a running but unhealthy service. It does not call a service manager, restart host processes or contact any live health endpoint."
      ]
    ],
    "code": "services = [{\"name\":\"portal\", \"enabled\":True, \"running\":False, \"healthy\":False}, {\"name\":\"jobs\", \"enabled\":False, \"running\":True, \"healthy\":False}]\nprint(services[0][\"enabled\"] and not services[0][\"running\"])\nprint([s[\"name\"] for s in services if s[\"running\"] and not s[\"healthy\"]])",
    "expect": "True\n['jobs']",
    "problem": "Separate future-start configuration, process state and modeled service health.",
    "steps": [
      "Inspect enabled and running as distinct fields.",
      "Identify running records whose health is false.",
      "Avoid inferring live behavior beyond the supplied fixture."
    ],
    "limit": "Synthetic booleans illustrate state distinctions; real service state and health require actual manager, logs and workload-specific evidence.",
    "mistakes": [
      "Equating enabled at boot with active now.",
      "Treating process existence as proof of useful service behavior."
    ],
    "takeaways": [
      "Collect state and relevant diagnostics before disruptive action.",
      "Verify the business behavior after an authorized correction."
    ],
    "practice": [
      [
        "What does enabling a service commonly configure?",
        "Future activation policy",
        "Guaranteed current health",
        "Immediate successful requests",
        "Every dependency’s correctness",
        "Startup configuration describes activation policy and does not itself prove the service is running or healthy."
      ],
      [
        "What does process existence fail to establish?",
        "Useful application health",
        "That a process record exists",
        "That a runtime instance is present",
        "That execution state was observed",
        "A process can exist while its workload or dependencies are failing."
      ],
      [
        "Why inspect logs before a restart?",
        "Preserve diagnostic context",
        "To grant public admin access",
        "To erase the failure history",
        "To bypass all dependency checks",
        "Restarting can change state and lose useful context without resolving the underlying cause."
      ],
      [
        "What should a health endpoint avoid exposing?",
        "Secret configuration",
        "A safe readiness outcome",
        "A documented status code",
        "A nonsecret service category",
        "Health evidence should not leak credentials or unnecessary internal configuration."
      ],
      [
        "Which model field describes current execution?",
        "running",
        "enabled as an absolute synonym",
        "The display-name length",
        "The list’s position",
        "The model deliberately separates whether a service is running from whether it is enabled."
      ],
      [
        "Which fixture service is running but unhealthy?",
        "jobs",
        "portal as a running service",
        "Every service is healthy",
        "No service has a state",
        "The jobs record has running true and healthy false under the supplied data."
      ],
      [
        "What should follow an authorized service correction?",
        "Verify intended behavior",
        "Assume a green icon proves all",
        "Delete every incident note",
        "Disable all future checks",
        "Verification should evaluate the affected behavior rather than merely recording that an action was attempted."
      ],
      [
        "Why avoid restarting every service blindly?",
        "It adds unrelated disruption",
        "It always improves every fault",
        "It preserves every volatile clue",
        "It certifies all permissions",
        "Broad disruptive action can affect healthy components and obscure the original failure context."
      ]
    ],
    "final": [
      [
        "Which service property is distinct from being active now?",
        "Boot activation policy",
        "Its current running flag",
        "Its observed execution state",
        "Its present process status",
        "Enabling future activation and starting a current instance are separate operations."
      ],
      [
        "What can a running process still lack?",
        "A functioning dependency",
        "A process identity by definition",
        "Any runtime state whatsoever",
        "An executable instruction stream",
        "Process existence does not guarantee dependency availability or useful workload behavior."
      ],
      [
        "Why should a health check match its purpose?",
        "Different behaviors prove different readiness",
        "Every 200 response proves all business flows",
        "A process id replaces every check",
        "A static filename certifies dependencies",
        "The check must support the specific liveness or readiness claim being made."
      ],
      [
        "A logistics unit is enabled but stopped. Which interpretation fits?",
        "Startup intent differs from state",
        "Enabled guarantees current execution",
        "The host must have no logs",
        "The service is necessarily healthy",
        "Configuration for future activation does not imply an active instance at this moment."
      ],
      [
        "A worker responds to ping but cannot reach its database. What remains uncertain?",
        "Application readiness",
        "That an echo response was seen",
        "An echo path",
        "That the host had an IP route",
        "A narrow network response does not prove the dependency path needed for the actual workload."
      ],
      [
        "An operator restarts first and then asks for transient failure evidence. What was risked?",
        "Loss of diagnostic context",
        "A guarantee of stronger attribution",
        "Automatic preservation of all memory",
        "A proof the issue was fixed",
        "Changing process state can discard context that would help explain the original failure."
      ],
      [
        "A health route prints the entire environment. What should be corrected?",
        "Its disclosure boundary",
        "Only its URL capitalization",
        "Only its icon",
        "The count of enabled units",
        "Health diagnostics should return appropriate safe status rather than authority-bearing configuration values."
      ],
      [
        "A service restart command succeeds but requests still fail. What must be verified?",
        "The intended workload",
        "Only that a command exited zero",
        "Only the terminal prompt",
        "Only the service’s label length",
        "Successful control-plane action is not the same as restored application behavior."
      ],
      [
        "A team disables authorization so a readiness request returns green. What is wrong?",
        "The check masks a broken boundary",
        "Security checks are irrelevant to health",
        "Green output certifies all workloads",
        "Disabling permission is required for diagnostics",
        "Tests should preserve required security properties and diagnose the actual configuration or access issue."
      ],
      [
        "Can the synthetic service dictionary certify systemd’s live state?",
        "No",
        "Yes, names are enough",
        "Yes on every Windows host",
        "Yes if the names match",
        "No service manager or actual health endpoint is queried by the supplied model."
      ]
    ]
  }
];
const built=build('computing-os-foundations',data,['os','pathlib','subprocess','logging'].map(pythonRef));
module.exports=built.course;
Object.defineProperty(module.exports,'__bank',{value:built.bank,enumerable:false});
