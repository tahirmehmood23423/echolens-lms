'use strict';
const {build,pythonRef}=require('./infra-helper');
const data=[
  {
    "comp": "m1.c1",
    "title": "Navigate an isolated filesystem before changing it",
    "intro": "A support engineer must collect a configuration file from an application directory. Establish the current directory and exact target before copying, editing or deleting anything. A shell prompt is a convenience, not evidence that the intended location is selected.",
    "headings": [
      "Understand the boundary",
      "Apply it to an operating decision",
      "Check the model and its limits"
    ],
    "sections": [
      [
        "pwd reports the current directory, cd changes the shell’s working directory and ls lists directory entries under its options and permissions. Relative names are interpreted from the current context, so service scripts and interactive terminals can select different files with the same text. Use explicit bases for repeatable administration.",
        "Inspect before mutation: confirm the expected directory, filename and type, then choose the narrow operation. A leading dash in an untrusted filename can be parsed as an option by many commands; use documented option termination or safe path construction. Quoting protects shell argument grouping but does not authorize a target."
      ],
      [
        "The fixture creates a temporary directory in the verifier’s disposable /tmp and uses an explicit working directory for a subprocess. It runs pwd and compares the actual output with the created path rather than depending on a random temporary name. No real application or student directory is accessed.",
        "The successful comparison demonstrates working-directory control in this isolated process. It does not certify host permissions, every shell’s quoting rules or safety of an arbitrary recursive command. Production operations still need authorization, backups where appropriate and an accurately inspected target."
      ]
    ],
    "code": "import tempfile, subprocess\nfrom pathlib import Path\nwith tempfile.TemporaryDirectory() as d:\n    root = Path(d)\n    result = subprocess.run([\"pwd\"], cwd=root, check=True, capture_output=True, text=True)\n    print(result.stdout.strip() == str(root))",
    "expect": "True",
    "problem": "Verify a subprocess runs in the explicitly chosen disposable directory.",
    "steps": [
      "Create an isolated temporary base.",
      "Run pwd with cwd set to that base.",
      "Compare actual output without printing an environment-dependent path."
    ],
    "limit": "Only a temporary-directory operation is tested; no production target or shell injection boundary is exercised.",
    "mistakes": [
      "Assuming every terminal or service shares one current directory.",
      "Running a recursive change before inspecting the target."
    ],
    "takeaways": [
      "Choose an explicit base and inspect it first.",
      "Keep argument handling separate from authorization."
    ],
    "practice": [
      [
        "What does pwd commonly report?",
        "The current directory",
        "Every user’s password",
        "All service health states",
        "The entire package database",
        "The command reports working-directory context rather than unrelated account or service data."
      ],
      [
        "What does cd change in a shell?",
        "Its working directory",
        "The kernel version",
        "Every filesystem permission",
        "The source account’s identity",
        "Changing directory alters the context for relative paths within that shell."
      ],
      [
        "Why can a relative filename select the wrong target?",
        "The base context differs",
        "Every filename is encrypted",
        "The disk always renames it",
        "All processes share one directory",
        "Relative interpretation depends on the caller’s current or explicitly chosen directory."
      ],
      [
        "What should precede a destructive command?",
        "Inspect exact target and type",
        "Assume the prompt is right",
        "Disable all access policy",
        "Copy a path blindly",
        "Inspection and authorization should establish the intended scope before changing data."
      ],
      [
        "What does subprocess cwd set?",
        "The child’s starting directory",
        "The host’s root account",
        "Every running service’s directory",
        "A universal filesystem sandbox",
        "The cwd argument controls that child’s working-directory context, not the entire host’s isolation policy."
      ],
      [
        "Why use an argument list in the example?",
        "Keep arguments explicit",
        "Grant automatic file ownership",
        "Enable every shell expansion",
        "Replace all permission checks",
        "Passing a list avoids relying on shell string parsing for this fixed command invocation."
      ],
      [
        "What does a leading dash in a filename risk?",
        "Option interpretation",
        "Automatic encryption",
        "A new user account",
        "Guaranteed file corruption",
        "Many command-line tools can treat such a token as an option unless documented handling is used."
      ],
      [
        "What does quoting not establish?",
        "Target authorization",
        "Argument grouping in a shell",
        "A representation of whitespace",
        "A shell string boundary",
        "Correct quoting addresses parsing, not whether the operator is permitted to act on the target."
      ]
    ],
    "final": [
      [
        "What establishes how a relative path is interpreted?",
        "Its directory context",
        "The filename’s color",
        "The CPU vendor label",
        "The number of shell aliases",
        "Relative names depend on a current or declared base directory."
      ],
      [
        "What does the fixture’s true output establish?",
        "The child used its chosen cwd",
        "Every host path is safe",
        "Production data was inspected",
        "All shells share that directory",
        "The comparison checks the actual subprocess working directory inside the disposable fixture."
      ],
      [
        "Which safety property is distinct from quoting?",
        "Authorization to change the target",
        "Grouping whitespace into an argument",
        "Escaping shell metacharacters",
        "Preserving a literal string",
        "Parsing correctly does not prove that an operation is authorized or aimed at the intended resource."
      ],
      [
        "A support terminal changed directories after a runbook was copied. What should happen before deletion?",
        "Reconfirm the exact target",
        "Trust the old prompt screenshot",
        "Run it as root immediately",
        "Ignore the changed context",
        "The active execution context must be established at the time of a potentially destructive operation."
      ],
      [
        "A service cannot find config.json while an interactive shell can. What difference is relevant?",
        "Their working directories",
        "Their terminal font choices",
        "Their desktop wallpaper",
        "Their source comment counts",
        "Identical relative names can resolve differently when starting directories differ."
      ],
      [
        "A filename begins with a dash. Which handling deserves review?",
        "Documented option termination",
        "Only a shorter suffix",
        "Only a new display label",
        "A longer process identifier",
        "Tools may interpret leading-dash arguments as options unless the command’s safe path/option rules are used."
      ],
      [
        "An operator sees a friendly prompt and assumes the target directory is correct. What evidence is missing?",
        "Location and target checks",
        "Only a longer prompt theme",
        "Only more aliases",
        "A new terminal background",
        "Prompts can be misleading or stale; direct inspection supports the real target decision."
      ],
      [
        "Can this temporary pwd fixture certify safe production cleanup?",
        "No, that needs scoped evidence",
        "Yes, pwd authorizes all deletion",
        "Yes, random paths protect every host",
        "Yes, every service shares the fixture",
        "The test neither examines production targets nor performs their authorization and recovery checks."
      ]
    ]
  },
  {
    "comp": "m1.c1",
    "title": "Inspect and replace file content with a recovery plan",
    "intro": "A logistics configuration file needs one corrected value. The goal is a controlled change with validation and a recovery path, not an unreviewed whole-directory rewrite.",
    "headings": [
      "Understand the boundary",
      "Apply it to an operating decision",
      "Check the model and its limits"
    ],
    "sections": [
      [
        "cat, head and tail can inspect text, while less supports paged reading where available. These tools do not validate that a configuration is correct for its consumer. Inspect size and encoding before loading an unexpectedly large or binary file into a terminal. Sensitive configuration must not be pasted into public support logs.",
        "Use an appropriate editor or a validated transformation for an authorized change. Preserve required ownership and permissions, test syntax with the consumer’s supported validation method and prepare rollback. Replacing a path with a new file can affect metadata, links and concurrent readers, so filesystem atomicity is not a complete deployment transaction."
      ],
      [
        "The fixture writes synthetic text inside a disposable directory and uses head to read exactly one line. It then changes the known file through Python and confirms the expected content. No environment file, host service configuration or student record is opened.",
        "The output verifies the shown text operation only. It does not prove safe concurrent production replacement, service reload behavior, file durability after a crash or configuration semantics for a real daemon. Those require the actual consumer and operational checks."
      ]
    ],
    "code": "import tempfile, subprocess\nfrom pathlib import Path\nwith tempfile.TemporaryDirectory() as d:\n    p = Path(d) / \"demo.conf\"\n    p.write_text(\"limit=10\\nmode=test\\n\")\n    r = subprocess.run([\"head\", \"-n\", \"1\", str(p)], check=True, capture_output=True, text=True)\n    print(r.stdout.strip())\n    p.write_text(\"limit=20\\nmode=test\\n\")\n    print(p.read_text().splitlines()[0])",
    "expect": "limit=10\nlimit=20",
    "problem": "Inspect one synthetic setting and verify its explicit replacement.",
    "steps": [
      "Create a known disposable text file.",
      "Read one line through the actual head command.",
      "Write and reread the intended new fixture value."
    ],
    "limit": "Actual local text commands are tested, but no real daemon validates or reloads this synthetic configuration.",
    "mistakes": [
      "Treating a text edit as proof the application accepted its configuration.",
      "Dumping sensitive configuration into unrestricted diagnostics."
    ],
    "takeaways": [
      "Inspect narrowly and preserve a recovery path.",
      "Validate with the actual consumer before relying on a change."
    ],
    "practice": [
      [
        "What does head -n 1 request for a text file?",
        "Its first line",
        "A complete daemon validation",
        "Every permission bit",
        "A guaranteed safe reload",
        "head selects text output and does not validate the meaning of a configuration."
      ],
      [
        "Why inspect size before reading a file?",
        "Avoid unbounded terminal output",
        "To grant write permission",
        "To encrypt its contents",
        "To replace the service owner",
        "Large or binary input can be unsuitable for indiscriminate display or loading."
      ],
      [
        "What should accompany a configuration correction?",
        "Validation and recovery",
        "Only a new filename",
        "A public secret dump",
        "An unlimited root shell",
        "A controlled change needs evidence the consumer accepts it and a way to recover if behavior fails."
      ],
      [
        "What can replacement change besides content?",
        "File metadata",
        "The meaning of every user role",
        "All network routing policy",
        "The CPU instruction set",
        "Replacing an inode or path can affect ownership, permissions, links and concurrent readers."
      ],
      [
        "Why avoid posting complete configuration publicly?",
        "It can contain secrets",
        "Every setting is public by law",
        "Text cannot carry credentials",
        "Only filenames can be private",
        "Configuration can include authority-bearing or sensitive operational values."
      ],
      [
        "What does the fixture actually edit?",
        "A disposable synthetic file",
        "The host’s service configuration",
        "The production environment file",
        "Every student’s stored profile",
        "The temporary path is created inside the isolated fixture and is unrelated to application data."
      ],
      [
        "What should verify configuration syntax?",
        "The consumer’s supported check",
        "Only the number of lines",
        "Only a successful cat command",
        "A new terminal tab",
        "Readable text can still be invalid for the service that interprets it."
      ],
      [
        "Does a successful write prove crash durability?",
        "No",
        "Always",
        "Only for short strings",
        "Only if head printed a line",
        "A completed text operation does not by itself establish persistence guarantees under storage failure."
      ]
    ],
    "final": [
      [
        "Which command selects a file’s initial lines?",
        "head",
        "systemctl enable",
        "chmod",
        "tail",
        "head reads a bounded prefix of text under its options and does not change service configuration."
      ],
      [
        "What remains necessary after text is syntactically readable?",
        "Consumer-specific validation",
        "A guarantee all settings are valid",
        "Only a larger terminal",
        "Only a shorter path",
        "Readable text does not establish that a real configuration consumer accepts its syntax and meaning."
      ],
      [
        "Why preserve rollback material for an authorized edit?",
        "The new behavior may fail",
        "It automatically prevents every fault",
        "It replaces all syntax checks",
        "It grants the operator new authority",
        "Recovery preparation supports restoring a known state when the change has unintended effects."
      ],
      [
        "A logistics config is edited successfully but the daemon rejects it. What distinction matters?",
        "Writing and validation differ",
        "Every successful write is deployment success",
        "The file cannot contain text",
        "The daemon must be healthy",
        "Filesystem write success does not imply the application can parse or use the new configuration."
      ],
      [
        "An engineer replaces a file and accidentally broadens its permissions. What was missed?",
        "Metadata preservation",
        "Only the setting’s spelling",
        "Only the source comment length",
        "Only the chart title",
        "A controlled replacement must consider ownership and permissions as well as text content."
      ],
      [
        "A support request asks for the full environment file. What should be reviewed before sharing?",
        "Private disclosure risks",
        "Only the attachment filename",
        "Only the terminal line count",
        "The user’s color theme",
        "Configuration often contains credentials and should be minimized or redacted according to policy."
      ],
      [
        "A test prints limit=20 from its temporary file. What did it establish?",
        "The shown fixture replacement",
        "A live daemon reload",
        "Crash-safe production persistence",
        "All old clients accepted the change",
        "The output checks a local synthetic text operation and does not exercise production consumers or storage failures."
      ],
      [
        "A file is renamed atomically but a multi-service release is inconsistent. What was overclaimed?",
        "Whole-release atomicity",
        "A path operation occurred",
        "The new name can reference a file",
        "An inode can hold text",
        "One filesystem action does not coordinate application state, service reloads and external dependencies as a single transaction."
      ]
    ]
  },
  {
    "comp": "m1.c2",
    "title": "Build pipelines with explicit input and exit semantics",
    "intro": "A support report needs ERROR lines from a synthetic log. Pipes and redirection compose commands, but careless quoting, truncation and ignored failures can lose data or produce a misleading empty report.",
    "headings": [
      "Understand the boundary",
      "Apply it to an operating decision",
      "Check the model and its limits"
    ],
    "sections": [
      [
        "A pipe connects one command’s standard output to another command’s standard input. Standard error is a separate stream unless explicitly redirected. A pipeline’s success semantics depend on the shell; in common Bash usage, pipefail changes how a failure in an earlier stage affects the pipeline status. Inspect the actual tool and shell contract rather than assuming every stage succeeded.",
        "Output redirection with > commonly truncates or creates the target, whereas >> appends. grep searches matching lines under its pattern syntax, while find traverses selected directory scopes and predicates. Quoting patterns preserves intended shell arguments; a grep pattern and a shell glob are not the same language."
      ],
      [
        "The fixture creates a synthetic log and pipes its bytes to grep through subprocess input. It records grep’s actual output and exit status without using a shell. An ERROR match prints one line and a zero return code. It does not establish Bash pipeline failure behavior or production log-search coverage.",
        "For an operational pipeline, specify the target scope, expected match/no-match behavior, error handling and safe destination before changing files. Avoid interpreting grep’s no-match result as a tool crash or overwriting the source log with its own output."
      ]
    ],
    "code": "import subprocess\ntext = \"INFO ready\\nERROR fixture_failure\\n\"\nr = subprocess.run([\"grep\", \"ERROR\"], input=text, capture_output=True, text=True)\nprint(r.stdout.strip())\nprint(r.returncode)",
    "expect": "ERROR fixture_failure\n0",
    "problem": "Run an actual isolated grep selection on supplied synthetic text.",
    "steps": [
      "Provide fixed nonsecret input bytes.",
      "Pass the pattern as a distinct command argument.",
      "Inspect both selected output and return code."
    ],
    "limit": "This subprocess does not execute a shell pipeline or prove shell-specific pipefail and redirection behavior.",
    "mistakes": [
      "Redirecting output onto the input file before understanding truncation.",
      "Assuming the final pipeline stage proves every earlier stage succeeded."
    ],
    "takeaways": [
      "Treat stdout, stderr and exit status as distinct evidence.",
      "Use documented shell semantics and intentional output destinations."
    ],
    "practice": [
      [
        "What does a pipe normally connect?",
        "stdout to stdin",
        "Every stderr stream automatically",
        "A user account to root",
        "All files to a network route",
        "Ordinary pipeline composition connects one process’s output stream to another’s input."
      ],
      [
        "Which redirection commonly truncates a target?",
        ">",
        ">> as a universal truncate rule",
        "A read-only grep pattern",
        "A process identifier",
        "The greater-than output redirection commonly creates or truncates its destination before command output is written."
      ],
      [
        "What does grep select?",
        "Matching text lines",
        "Every mounted filesystem",
        "All active systemd units",
        "The machine’s default gateway",
        "grep interprets its pattern language to select matching text rather than administer unrelated resources."
      ],
      [
        "What does find commonly traverse?",
        "A scoped filesystem tree",
        "Only HTTP status codes",
        "All cloud billing accounts",
        "The live TCP stream",
        "find evaluates filesystem traversal and predicates under its selected roots and permissions."
      ],
      [
        "Why inspect an exit status as well as output?",
        "Empty output has multiple causes",
        "Output always proves success",
        "Exit codes encrypt the result",
        "Every nonzero means identical failure",
        "The same visible output can accompany no matches, tool errors or upstream failures under different contracts."
      ],
      [
        "What is separate from stdout by default?",
        "stderr",
        "The command’s argument list",
        "The file’s suffix",
        "The current username",
        "Standard error is a distinct process stream unless redirected or otherwise combined."
      ],
      [
        "What does Bash pipefail affect?",
        "Pipeline failure reporting",
        "The kernel’s subnet mask",
        "Every file’s ownership",
        "The application’s role grants",
        "The shell option changes how earlier stage failures contribute to the pipeline’s reported status."
      ],
      [
        "Does this grep fixture execute shell redirection?",
        "No",
        "Always",
        "Only with uppercase input",
        "Only when grep returns zero",
        "subprocess passes fixed arguments and supplied input without a shell command string."
      ]
    ],
    "final": [
      [
        "Which stream is normally passed through a plain pipe?",
        "Standard output",
        "All standard error automatically",
        "The parent’s credentials",
        "Every open disk file",
        "A plain pipe composes stdout and stdin while stderr remains separate unless redirected."
      ],
      [
        "Why can a pipeline’s last stage return success after an earlier failure?",
        "Shell status semantics vary",
        "Earlier processes cannot fail",
        "Pipes automatically retry forever",
        "All shells use universal pipefail",
        "A shell may report only a final-stage status unless its configured semantics account for other failures."
      ],
      [
        "What is a grep pattern distinct from?",
        "A shell glob",
        "A text-matching instruction",
        "An argument supplied to grep",
        "A possible regular expression",
        "Pattern interpretation by grep and filename expansion by a shell are different languages and stages."
      ],
      [
        "A report command uses > on the source log path. What is the risk?",
        "Input truncation before reading",
        "Automatic evidence encryption",
        "A guarantee of complete output",
        "A new protected audit copy",
        "Output redirection can truncate its target before the command reads the original input."
      ],
      [
        "A no-match grep result returns no selected lines. What should the script use?",
        "The documented exit contract",
        "An assumption the host is down",
        "A claim every input was invalid",
        "Only the output filename",
        "No-match and execution errors have distinct meanings under the tool’s documented status behavior."
      ],
      [
        "A support pipeline ignores stderr and reports no errors found after a permission failure. What was missed?",
        "Failure evidence handling",
        "Only the log’s extension",
        "Only the match’s font",
        "The account’s display prefix",
        "An empty stdout report can hide a failed read unless stderr and status are considered deliberately."
      ],
      [
        "The isolated grep prints one ERROR line and zero. What does it verify?",
        "That supplied selection succeeded",
        "Bash pipefail was configured",
        "Every production log was scanned",
        "The original incident’s root cause",
        "The fixture ran one actual grep selection on fixed input and did not inspect any live incident or shell settings."
      ],
      [
        "A find command starts at an unintended broad root. Which safety decision was missed?",
        "Explicit traversal scope",
        "Only a shorter predicate",
        "Only the terminal theme",
        "A new hostname alias",
        "Filesystem searches should use intentional authorized roots to avoid unnecessary load and disclosure."
      ]
    ]
  },
  {
    "comp": "m2.c1",
    "title": "Read mode bits and directory traversal correctly",
    "intro": "A clinic stores a report in a directory readable by a service group. Decide which account class receives which action and remember that directory traversal differs from reading a regular file.",
    "headings": [
      "Understand the boundary",
      "Apply it to an operating decision",
      "Check the model and its limits"
    ],
    "sections": [
      [
        "Traditional POSIX modes represent owner, group and other read/write/execute bits. Numeric forms such as 0640 are octal: owner read/write, group read and no permissions for others. chmod changes mode bits, while ownership and additional ACL or mount policy can also affect effective access.",
        "For directories, read supports listing names and execute supports search/traversal. Write relates to changing directory entries subject to other conditions; it is not simply permission to modify every existing child’s contents. Avoid blanket chmod 777 as a repair for an unexplained access failure."
      ],
      [
        "The fixture creates a disposable file, sets 0640 and reads back its actual permission bits. It uses a temporary directory owned by the fixture process rather than a real clinic path. The test checks the mode returned by stat and whether the other-read bit is absent.",
        "Effective access on another host can involve actual users/groups, ACLs, capabilities, privilege and mount options. The mode check is useful evidence for this synthetic file, but it is not a complete access decision or proof of patient-level application authorization."
      ]
    ],
    "code": "import tempfile, os, stat\nfrom pathlib import Path\nwith tempfile.TemporaryDirectory() as d:\n    p = Path(d)/\"report.txt\"\n    p.write_text(\"SYNTHETIC\")\n    os.chmod(p, 0o640)\n    mode = stat.S_IMODE(p.stat().st_mode)\n    print(oct(mode))\n    print(bool(mode & stat.S_IROTH))",
    "expect": "0o640\nFalse",
    "problem": "Set and inspect actual permission bits on one disposable fixture file.",
    "steps": [
      "Create a synthetic temporary file.",
      "Apply the explicit octal mode.",
      "Read back the mode and test the other-read bit."
    ],
    "limit": "The isolated mode operation does not evaluate real account groups, ACLs or business-record ownership.",
    "mistakes": [
      "Using world-writable permissions to bypass diagnosis.",
      "Confusing directory search with regular-file execution."
    ],
    "takeaways": [
      "Interpret action bits in the resource’s context.",
      "Investigate effective access before broadening permissions."
    ],
    "practice": [
      [
        "What base is used in 0640 mode notation?",
        "Octal",
        "Decimal-only accounting",
        "Hexadecimal networking",
        "A DNS prefix",
        "The numeric mode uses octal digits to encode permission-bit groups."
      ],
      [
        "What does 0640 give others in basic mode bits?",
        "No permissions",
        "Read and write",
        "Execute only",
        "Every owner permission",
        "The final octal zero clears the traditional other permission bits."
      ],
      [
        "What does chmod primarily change?",
        "Mode bits",
        "Every account’s identity",
        "The file’s business owner",
        "The service’s TLS certificate",
        "chmod modifies filesystem permission modes rather than application identity or cryptographic trust."
      ],
      [
        "What does directory execute commonly support?",
        "Search and traversal",
        "Automatic content editing",
        "Universal listing rights",
        "Password verification",
        "Directory execute has search/traversal semantics and is not ordinary file execution."
      ],
      [
        "Why avoid chmod 777 as a default fix?",
        "It broadens access unnecessarily",
        "It always preserves least privilege",
        "It encrypts every file",
        "It validates every ACL",
        "World-wide grants can expose data and bypass the intended narrow policy."
      ],
      [
        "What does the fixture read back?",
        "The temporary file mode",
        "A patient’s real record",
        "Every ACL on the host",
        "A live service’s user list",
        "The isolated stat result describes the file created by the fixture."
      ],
      [
        "Which policy can supplement basic modes?",
        "An ACL",
        "A filename color",
        "A chart heading",
        "The editor’s theme",
        "Access-control lists and other OS policy can influence effective access beyond mode bits."
      ],
      [
        "Does owner-read prove customer authorization?",
        "No",
        "Always",
        "Only with octal notation",
        "Only for text files",
        "OS account-class permissions do not encode the application’s customer-resource boundary."
      ]
    ],
    "final": [
      [
        "What does the group digit 4 mean in 0640?",
        "Read without write or execute",
        "Read and write and execute",
        "Write only",
        "Execute only",
        "The octal read bit is four, while write and execute have distinct bit values."
      ],
      [
        "What does the fixture’s false other-read output establish?",
        "That mode bit is absent",
        "No user can ever read the file",
        "Every host ACL denies access",
        "The business owner is authenticated",
        "The test checks one returned mode flag rather than every factor in effective access."
      ],
      [
        "Why distinguish directory and regular-file execute?",
        "Their operational meanings differ",
        "Directories never have modes",
        "File extensions set every mode",
        "Execute always means edit content",
        "Directory search/traversal semantics differ from executing a regular file."
      ],
      [
        "A clinic access problem is fixed with world-wide write permission. What needs review?",
        "The unnecessary grant scope",
        "Only the report’s title",
        "Only the decimal formatting",
        "The user’s screen size",
        "A broad permission change can violate the original restricted data-access requirement."
      ],
      [
        "A service has mode read permission but an ACL denies access. Which assumption failed?",
        "Modes alone decide everything",
        "ACLs can affect access",
        "The file can have metadata",
        "A service runs under an identity",
        "Effective access can include ACL policy and other operating-system constraints beyond basic bits."
      ],
      [
        "An operator wants to traverse a directory but cannot list names. Which distinction is relevant?",
        "Search versus listing",
        "Read and execute are always identical",
        "Directories have no action bits",
        "The report’s suffix grants access",
        "Directory execute/search and read/listing permissions control different operations."
      ],
      [
        "A temporary file reports 0640. Does it certify production clinic storage is protected?",
        "No, real policy needs evidence",
        "Yes, mode prints secure every host",
        "Yes, every report shares this inode",
        "Yes, Python changes production ACLs",
        "The test operates only on its disposable file and does not inspect production identity or storage policy."
      ],
      [
        "A reviewer sees correct modes but the API serves all patients’ reports to everyone. What is still missing?",
        "Application authorization",
        "A longer octal number",
        "A new chmod alias",
        "Only a different filename",
        "Filesystem access for the service does not determine each requester’s business permission."
      ]
    ]
  },
  {
    "comp": "m2.c1",
    "title": "Manage ownership and group changes with operational scope",
    "intro": "A team transfers an application directory from a developer account to a dedicated service identity. Ownership changes can affect future access and running workflows, so apply them to the intended resources rather than an unreviewed recursive tree.",
    "headings": [
      "Understand the boundary",
      "Apply it to an operating decision",
      "Check the model and its limits"
    ],
    "sections": [
      [
        "chown changes owner information under the system’s privilege rules; chgrp changes group information. The effective result depends on account/group existence, filesystem semantics and permitted authority. A username written in a runbook is not proof that the intended numeric identity is the same on every host.",
        "Before a recursive change, inventory the selected tree and understand links, mount boundaries and other applications sharing it. Do not make a broad ownership change to repair a single missing read grant without checking the actual requirement. Preserve an appropriate recovery record of prior ownership where necessary."
      ],
      [
        "Group membership changes may not alter every already-running process or login session immediately. Re-evaluate the actual process security context according to the operating environment rather than assuming the account database edit has refreshed all authority. Keep service and human account lifecycles distinct.",
        "The fixture models numeric owner and group metadata and a narrow proposed change for one synthetic file. It prints before and after pairs and confirms an unrelated record remains unchanged. It does not call chown, create users or modify any actual host ownership."
      ]
    ],
    "code": "files = {\"app.log\": {\"uid\":1001, \"gid\":2001}, \"other.log\": {\"uid\":1002, \"gid\":2002}}\nprint((files[\"app.log\"][\"uid\"], files[\"app.log\"][\"gid\"]))\nfiles[\"app.log\"][\"uid\"] = 3001\nprint((files[\"app.log\"][\"uid\"], files[\"app.log\"][\"gid\"]))\nprint(files[\"other.log\"][\"uid\"])",
    "expect": "(1001, 2001)\n(3001, 2001)\n1002",
    "problem": "Review the scope of a modeled owner-only change.",
    "steps": [
      "Record the initial synthetic identity pair.",
      "Change only the selected file’s owner.",
      "Check group preservation and the untouched record."
    ],
    "limit": "The metadata dictionary is not an operating-system ownership update or proof of effective access after such a change.",
    "mistakes": [
      "Changing an entire shared tree for one access error.",
      "Assuming a membership edit refreshes all live process credentials."
    ],
    "takeaways": [
      "Inventory scope before ownership mutations.",
      "Verify effective identity and access after authorized changes."
    ],
    "practice": [
      [
        "What does chown concern?",
        "File ownership",
        "Every TCP route",
        "The application’s response schema",
        "The user’s password verifier",
        "chown changes ownership information under OS and filesystem policy."
      ],
      [
        "What does chgrp concern?",
        "File group ownership",
        "The kernel’s scheduler choice",
        "The cloud region",
        "The HTTP status phrase",
        "chgrp targets group ownership rather than unrelated process or protocol state."
      ],
      [
        "Why inspect a tree before recursive changes?",
        "Scope may include shared resources",
        "Recursion is always read-only",
        "Names grant automatic approval",
        "Every subdirectory belongs to one app",
        "Broad traversal can touch resources outside the intended operational change."
      ],
      [
        "What may remain stale after a group database edit?",
        "A running process context",
        "Only a filename extension",
        "Every stored timestamp",
        "The source-code license",
        "Existing sessions or processes may retain prior identity context until refreshed under the system’s behavior."
      ],
      [
        "Why compare numeric identities across hosts?",
        "Names can map differently",
        "Every name has one global uid",
        "Numbers encrypt account access",
        "All hosts share one local user database",
        "Local naming can resolve to different numeric identities, so migration assumptions need verification."
      ],
      [
        "What did the owner-only model preserve?",
        "The selected group",
        "Every production ACL",
        "A real host account",
        "The service’s live credentials",
        "The fixture changes only its uid field while retaining the supplied gid."
      ],
      [
        "Does the model call chown?",
        "No",
        "Yes on every dictionary update",
        "Only for numeric ids",
        "Only when a log suffix exists",
        "It manipulates synthetic records and invokes no ownership-changing OS operation."
      ],
      [
        "What should follow a real authorized ownership change?",
        "Effective-access verification",
        "An assumption all clients refreshed",
        "Deletion of all prior evidence",
        "A public credential dump",
        "The intended operation should be checked under its actual identity and filesystem policy."
      ]
    ],
    "final": [
      [
        "Which operation changes the owner under OS policy?",
        "chown",
        "curl",
        "dig",
        "journalctl as an owner editor",
        "Ownership administration is a filesystem identity operation rather than network or log querying."
      ],
      [
        "Why is a host-local username not sufficient migration evidence?",
        "Its numeric mapping may differ",
        "Names always authorize every file",
        "All hosts use one fixed uid list",
        "The spelling determines filesystem type",
        "Local account resolution can associate the same label with different numeric principals."
      ],
      [
        "What does recursive scope review protect against?",
        "Unintended resource changes",
        "Every possible hardware failure",
        "All future password disclosure",
        "The need for any permission policy",
        "Reviewing traversal scope helps prevent altering unrelated or shared filesystem resources."
      ],
      [
        "A service account cannot read one log, so an operator takes ownership of every mounted volume. What is wrong?",
        "The change exceeds the need",
        "Every volume must share one owner",
        "Mounts never contain other apps",
        "Ownership fixes application logic",
        "The correction should be tied to the actual required action and target rather than blanket authority changes."
      ],
      [
        "A user is added to a group but an old worker still fails access. Which context deserves inspection?",
        "The worker’s effective groups",
        "Only the group’s display color",
        "Only the terminal title",
        "Only the log file’s suffix",
        "Running processes may retain identity context that differs from the newly edited account database."
      ],
      [
        "A tree includes linked or mounted resources used by another service. What must a recursive operation consider?",
        "Traversal and sharing boundaries",
        "Only the root directory’s nickname",
        "Only the owner’s biography",
        "The number of source comments",
        "Real traversal semantics and shared ownership determine which resources a broad operation can affect."
      ],
      [
        "The model changes app.log uid but leaves other.log unchanged. What did it demonstrate?",
        "A scoped metadata transformation",
        "A real host account migration",
        "A live chmod operation",
        "Complete access correctness",
        "The dictionary update illustrates intended scope without changing or testing actual filesystem enforcement."
      ],
      [
        "After ownership changes, an operator checks only that the command exited zero. What remains unproven?",
        "The required access behavior",
        "That a command ran",
        "That a status was returned",
        "That a proposal was executed",
        "Control-plane success does not establish that the intended identity can now perform its required operation safely."
      ]
    ]
  },
  {
    "comp": "m2.c1",
    "title": "Use sudo through reviewed privilege boundaries",
    "intro": "A support employee needs to restart one approved service. Giving an unrestricted privileged shell is a much larger grant than allowing one reviewed administrative operation with accountable identity.",
    "headings": [
      "Understand the boundary",
      "Apply it to an operating decision",
      "Check the model and its limits"
    ],
    "sections": [
      [
        "sudo can execute commands under a configured target identity and policy. Its behavior depends on sudoers configuration, command matching, environment rules and authentication policy. It is not a universal safety wrapper: a permitted command that can spawn a shell or edit arbitrary privileged files may provide much more authority than its friendly name suggests.",
        "Use least privilege and operational review for maintenance actions. Confirm the exact target and command semantics, preserve useful audit evidence and avoid passing untrusted arguments into an elevated command. Do not share privileged passwords or embed them in scripts and tickets."
      ],
      [
        "Environment variables and search paths can affect command behavior, so privilege policy must consider the actual executable, arguments and allowed environment. A runbook should distinguish reading service status from restarting it and should state the authorized scope explicitly.",
        "The fixture uses an exact allowlist for a synthetic operator’s permitted administrative action. It denies a generic shell request. This does not parse sudoers, authenticate the operator, model shell escapes or execute a privileged command; it illustrates why command scope matters."
      ]
    ],
    "code": "allowed = {(\"restart\", \"demo-worker.service\")}\nrequests = [(\"restart\", \"demo-worker.service\"), (\"shell\", \"root\")]\nprint([r in allowed for r in requests])",
    "expect": "[True, False]",
    "problem": "Compare a scoped maintenance operation with a broad shell request.",
    "steps": [
      "Declare the narrow synthetic grant.",
      "Evaluate exact operation-target pairs.",
      "Reject the unlisted broad authority request."
    ],
    "limit": "The allowlist is not sudo enforcement, command-escape analysis or a privileged execution test.",
    "mistakes": [
      "Assuming every sudo-permitted command has narrow behavior.",
      "Passing caller-controlled command arguments into privileged execution."
    ],
    "takeaways": [
      "Review executable semantics and environment, not only labels.",
      "Keep privilege scope auditable and tied to the maintenance need."
    ],
    "practice": [
      [
        "What determines sudo’s allowed behavior?",
        "Its configured policy",
        "Only the word sudo",
        "The command’s screen color",
        "Every caller’s preferred role",
        "sudo authority depends on actual policy and the behavior of the permitted command."
      ],
      [
        "Why review a permitted editor command carefully?",
        "It may modify broad privileged state",
        "Editors cannot write files",
        "A friendly name removes authority",
        "Editing always needs no audit",
        "An elevated editor can provide authority beyond a narrowly described maintenance task."
      ],
      [
        "What should a restart grant identify?",
        "The named service action",
        "Every shell command",
        "All user passwords",
        "Only a convenient nickname",
        "A scoped maintenance grant should bind the intended action and target."
      ],
      [
        "Why avoid privileged passwords in scripts?",
        "They become exposed credentials",
        "They cannot be read as text",
        "Scripts automatically encrypt secrets",
        "Passwords are harmless after copying",
        "Stored shared credentials can leak or be reused outside the intended operational boundary."
      ],
      [
        "What can influence an elevated command’s behavior?",
        "Arguments and environment",
        "Only the terminal font",
        "Only the desktop icon",
        "The operator’s display initials",
        "Executable path, arguments and environment can expand or redirect actual privileged behavior."
      ],
      [
        "What is denied by the fixture?",
        "The root-shell request",
        "The named restart request",
        "Reading the synthetic set",
        "An exact listed pair",
        "The broad shell action is absent from the explicit allowed operation set."
      ],
      [
        "Does the fixture implement sudoers parsing?",
        "No",
        "Always",
        "Only for .service names",
        "Only when the answer is true",
        "The local tuple comparison does not parse or enforce an operating-system privilege policy."
      ],
      [
        "What should audit evidence support?",
        "Accountable maintenance actions",
        "Public release of passwords",
        "Anonymous shared authority",
        "Only the command’s font",
        "Privileged work should retain appropriate actor, action, target and outcome evidence without credentials."
      ]
    ],
    "final": [
      [
        "Why is a generic privileged shell broader than restarting one service?",
        "It permits unrelated operations",
        "It always disables the CPU",
        "It can only read one status",
        "It is the same grant by definition",
        "A shell can execute many actions outside the narrow approved maintenance target."
      ],
      [
        "What must privilege review consider beyond a command label?",
        "The command’s real capabilities",
        "Only the alias length",
        "Only the window title",
        "The number of spaces in the runbook",
        "A seemingly narrow tool can expose shell escapes or arbitrary privileged file operations."
      ],
      [
        "Why control untrusted elevated arguments?",
        "They redirect authority",
        "Arguments never affect authority",
        "sudo encrypts every argument",
        "Only filenames can be untrusted",
        "A privileged executable may act on caller-selected targets or options unless scope is constrained."
      ],
      [
        "A support task needs one restart but the operator receives unrestricted root. What principle is weakened?",
        "Least privilege",
        "The existence of a process",
        "The naming of a service",
        "The syntax of timestamps",
        "The granted actions and resources exceed the actual maintenance requirement."
      ],
      [
        "A sudo-permitted utility can launch a shell. What must the policy assessment recognize?",
        "Its effective authority may be broad",
        "Its utility name guarantees safety",
        "Shell features are always disabled",
        "An allowlist entry cannot be risky",
        "Actual tool behavior can make a nominally specific permission equivalent to broader privileged execution."
      ],
      [
        "An operator posts the privileged password in a ticket for convenience. What is the issue?",
        "Credential exposure risk",
        "Only the ticket title is short",
        "Every ticket is a secret store",
        "Passwords expire when copied",
        "Operational communication must not expose reusable authority-bearing secrets to unintended readers."
      ],
      [
        "A tuple model rejects shell/root. Can it certify sudo on the host rejects shell escapes?",
        "No, real policy needs review",
        "Yes, Python sets configure sudo",
        "Yes, all utilities have no shell features",
        "Yes, denied strings revoke every role",
        "The model does not execute or analyze the host’s actual privilege policy and allowed programs."
      ],
      [
        "A runbook checks status but the support tool silently restarts the service. What needs correction?",
        "The operation’s stated scope",
        "Only the service’s description",
        "Only a new color scheme",
        "The user’s preferred timezone",
        "Read-only diagnosis and disruptive control actions require distinct authorization and clear operational behavior."
      ]
    ]
  },
  {
    "comp": "m3.c1",
    "title": "Inspect systemd units before controlled service changes",
    "intro": "A university background worker is enabled but not active. Service startup intent, current state and readiness are different facts. Inspect the intended unit before taking an authorized control action.",
    "headings": [
      "Understand the boundary",
      "Apply it to an operating decision",
      "Check the model and its limits"
    ],
    "sections": [
      [
        "On systemd-based systems, systemctl status and related show/list operations inspect units and their state. start requests activation now; enable configures activation links according to the unit’s installation metadata. These are different operations, and some units are static, transient or otherwise not intended for enable in the same way.",
        "stop and restart can disrupt in-flight work. reload requests a service-supported configuration reload, whereas daemon-reload refreshes the manager’s unit configuration; neither should be treated as a universal guarantee that every application has accepted new settings. Check the unit and application documentation."
      ],
      [
        "Before a change, collect relevant state, logs and the dependency context. After a correction, verify the intended service behavior rather than only a command exit status. A running process can still fail readiness because of a dependency, invalid configuration or an exhausted resource.",
        "The fixture compares supplied unit state records and selects enabled-but-inactive units. It never invokes systemctl or modifies a host service. Actual systemd behavior is grounded in the pinned official systemctl reference and still needs appropriate deployment-specific evidence."
      ]
    ],
    "code": "units = [{\"name\":\"worker.service\", \"enabled\":True, \"active\":False}, {\"name\":\"web.service\", \"enabled\":True, \"active\":True}]\nprint([u[\"name\"] for u in units if u[\"enabled\"] and not u[\"active\"]])",
    "expect": "['worker.service']",
    "problem": "Find a startup/state mismatch in supplied unit records.",
    "steps": [
      "Keep enabled and active as separate fields.",
      "Select only enabled-but-inactive records.",
      "Report the unit name without changing any service."
    ],
    "limit": "This local selection does not query or control systemd and does not establish why a real unit is inactive.",
    "mistakes": [
      "Equating enable with immediate successful start.",
      "Confusing daemon-reload with application-level reload and readiness."
    ],
    "takeaways": [
      "Choose the intended control operation deliberately.",
      "Verify actual workload behavior after an authorized change."
    ],
    "practice": [
      [
        "What does systemctl start request?",
        "Activation now",
        "Every future boot grant",
        "A guaranteed healthy database",
        "A user-account migration",
        "Starting a unit requests present activation rather than merely configuring future startup links."
      ],
      [
        "What does systemctl enable commonly configure?",
        "Activation links",
        "Immediate complete health",
        "All application permissions",
        "Every live session’s revocation",
        "Enable concerns installation metadata and activation configuration, distinct from the current active state."
      ],
      [
        "What does daemon-reload refresh?",
        "Manager unit configuration",
        "Every database row",
        "All application sessions",
        "Every package on disk",
        "The operation reloads the manager’s unit definitions, not universal application-level state."
      ],
      [
        "Why inspect before restart?",
        "Restart can disrupt work",
        "Restart is always read-only",
        "All failures vanish permanently",
        "Logs cannot exist before restart",
        "A restart changes process state and can interrupt work or discard useful diagnostic context."
      ],
      [
        "What can remain false while a process runs?",
        "Readiness",
        "Existence of that process",
        "Its observed runtime state",
        "Its ability to have a pid",
        "Process existence does not guarantee dependency-dependent application behavior."
      ],
      [
        "Which fixture unit is enabled but inactive?",
        "worker.service",
        "web.service",
        "Every unit is inactive",
        "No record has enabled true",
        "The supplied worker record has enabled true and active false."
      ],
      [
        "What should verify recovery?",
        "The intended behavior",
        "Only a green prompt",
        "Only a longer unit name",
        "Deleting every error message",
        "Recovery evidence should test the affected workload instead of relying on a cosmetic or control-command signal."
      ],
      [
        "Does the fixture call systemctl?",
        "No",
        "Yes for every .service string",
        "Only when enabled is true",
        "Only if the name is short",
        "The supplied unit list is a policy model and performs no service-manager operation."
      ]
    ],
    "final": [
      [
        "Which pair should not be treated as equivalent?",
        "Enabled and active",
        "A unit name and its exact text",
        "A boolean and its copied value",
        "A supplied list and its iteration",
        "Startup configuration and present state describe different service facts."
      ],
      [
        "What is different from daemon-reload?",
        "Application-supported reload",
        "Refreshing manager unit definitions",
        "Reading new unit configuration",
        "Updating the manager’s definition view",
        "Application reload behavior is separate from having the manager reread unit files."
      ],
      [
        "Why inspect the specific unit’s documentation?",
        "Control behavior varies",
        "Every unit supports every action",
        "All static units must be enabled",
        "All reloads restart every dependency",
        "Different unit types and applications support different lifecycle and reload semantics."
      ],
      [
        "A worker is enabled but inactive. What should the report say?",
        "Those two states differ",
        "Enable guarantees it is serving",
        "Every dependency is healthy",
        "The process must be accepting requests",
        "The observation does not establish current execution or explain the reason for inactivity."
      ],
      [
        "An operator runs daemon-reload and claims every app loaded its new settings. What was overclaimed?",
        "Manager reload is app acceptance",
        "Unit files can be read",
        "The manager can refresh definitions",
        "A command can return success",
        "Refreshing manager configuration does not certify that each service reloaded or accepted its own configuration."
      ],
      [
        "A restart exits successfully but scheduled work still fails. What must be checked?",
        "The workload and dependencies",
        "Only the unit label",
        "Only the terminal theme",
        "The number of configuration comments",
        "Control-plane success is distinct from useful application behavior and its required dependencies."
      ],
      [
        "A training list selects worker.service. Can it identify the production root cause?",
        "No, it does not inspect the host",
        "Yes, inactive always means a bad package",
        "Yes, enable fields capture logs",
        "Yes, every unit uses these records",
        "The synthetic fixture does not gather real unit state, logs or dependency evidence."
      ]
    ]
  },
  {
    "comp": "m3.c1",
    "title": "Read unit journals with time and disclosure boundaries",
    "intro": "A customer-support API has repeated failures during one deployment window. A focused journal query is more useful than copying all machine logs into an unrestricted ticket.",
    "headings": [
      "Understand the boundary",
      "Apply it to an operating decision",
      "Check the model and its limits"
    ],
    "sections": [
      [
        "journalctl queries the systemd journal where available and permitted. Unit and time filters can narrow evidence, while output formats and boot selection affect interpretation. Establish the relevant boot, clock and timestamp context before correlating events across a restart or another host.",
        "An ERROR entry is an observation from a producer, not an automatic root-cause verdict. Read surrounding context and correlate safe request or deployment identifiers. Retention limits, permissions and forwarding configuration can explain missing evidence without proving no event occurred."
      ],
      [
        "Minimize collected data and protect logs. Raw credentials, private payloads and personal details should not be copied into routine reports. A useful incident record can preserve event category, verified component, safe correlation and outcome without publishing entire requests.",
        "The fixture filters synthetic events by unit and a half-open time window, then projects safe ids. It demonstrates the selected boundary and excludes an event exactly at the end. It does not query a journal, synchronize clocks or validate a production redaction pipeline."
      ]
    ],
    "code": "events = [{\"unit\":\"api.service\",\"time\":10,\"id\":\"e1\"}, {\"unit\":\"api.service\",\"time\":20,\"id\":\"e2\"}, {\"unit\":\"other.service\",\"time\":15,\"id\":\"e3\"}]\nprint([e[\"id\"] for e in events if e[\"unit\"] == \"api.service\" and 10 <= e[\"time\"] < 20])",
    "expect": "['e1']",
    "problem": "Select a unit’s synthetic events in an explicit half-open interval.",
    "steps": [
      "Filter the correct unit.",
      "Include the start boundary and exclude the end.",
      "Project safe event identifiers only."
    ],
    "limit": "A supplied-event filter is not an actual journal query or proof that omitted real-world events never occurred.",
    "mistakes": [
      "Treating missing retained logs as proof that no failure happened.",
      "Sharing full credential-bearing records to make diagnosis easier."
    ],
    "takeaways": [
      "State unit, boot and time context.",
      "Preserve useful evidence while minimizing disclosure."
    ],
    "practice": [
      [
        "What does a unit filter narrow?",
        "The source scope",
        "Every host’s clock drift",
        "All user permissions",
        "Every application secret",
        "Filtering by unit selects the relevant producer scope rather than changing the system."
      ],
      [
        "Why establish the boot context?",
        "Restarts affect event interpretation",
        "Every boot uses identical process ids",
        "Logs cannot span boots",
        "Boot names encrypt records",
        "The selected boot and lifecycle matter when correlating events around restarts."
      ],
      [
        "What does a missing log not prove?",
        "No event occurred",
        "No matching retained record was found",
        "The query had an outcome",
        "The selected view lacks that event",
        "Retention, filtering, access and collection gaps can explain absent evidence."
      ],
      [
        "What is a half-open interval [10,20)?",
        "Start included, end excluded",
        "Both ends always included",
        "Only the end included",
        "Every time is accepted",
        "The declared mathematical boundary includes 10 and excludes 20."
      ],
      [
        "Which field is safer than a raw token for correlation?",
        "A nonsecret event id",
        "A plaintext password",
        "A refresh credential",
        "A complete authorization header",
        "Correlation should connect evidence without exposing reusable authority."
      ],
      [
        "Why inspect context around an error?",
        "A message is not the full cause",
        "Every ERROR proves a vendor fault",
        "Context always replaces permissions",
        "Errors cannot be logged accurately",
        "Causal interpretation requires relevant surrounding evidence rather than one label alone."
      ],
      [
        "What does the fixture output?",
        "e1 only",
        "e2 only",
        "e3 only",
        "Every supplied event",
        "Only e1 matches the unit and the declared half-open window."
      ],
      [
        "Does the fixture synchronize clocks?",
        "No",
        "Yes when integers are ordered",
        "Only for one unit name",
        "Only for ERROR severity",
        "Comparing synthetic numbers does not establish real machine clock accuracy or synchronization."
      ]
    ],
    "final": [
      [
        "What determines whether historical journal evidence remains available?",
        "Retention and collection policy",
        "Only the event’s spelling",
        "Only the service’s logo",
        "The number of shell aliases",
        "Configured persistence, retention and collection behavior affect which events can be queried."
      ],
      [
        "Why define timezone or clock interpretation?",
        "Cross-source times need alignment",
        "All timestamps are universally identical",
        "A timezone grants service authority",
        "Logs always use local midnight",
        "Accurate correlation requires understanding the actual time basis and clock behavior."
      ],
      [
        "What does a journal error label alone establish?",
        "A producer recorded an error",
        "The entire root cause is proven",
        "All dependencies are faulty",
        "Every user request failed",
        "Severity is one piece of evidence and does not automatically determine full causality or impact."
      ],
      [
        "A support report includes complete auth headers from logs. What is the risk?",
        "Credential exposure risk",
        "Only excessive line wrapping",
        "All headers are harmless",
        "The journal encrypts public tickets",
        "Operational evidence must not reproduce raw authority-bearing data in unintended channels."
      ],
      [
        "A deployment ends at time20 and the query uses time<20. Is an event at20 selected?",
        "No",
        "Yes by definition",
        "Only if it has a short id",
        "Always after a reboot",
        "The half-open interval excludes the endpoint equality case."
      ],
      [
        "No matching entries appear after a retention rotation. What conclusion is justified?",
        "Evidence may be unavailable",
        "The failure never happened",
        "The service must be healthy",
        "All alerts were necessarily false",
        "Absence from a retained query view is not proof that no relevant event occurred."
      ],
      [
        "Can the synthetic filter certify journalctl’s production permissions?",
        "No, actual access is separate",
        "Yes, event ids configure groups",
        "Yes, all journals are public",
        "Yes, Python integers grant read access",
        "The fixture neither opens a journal nor evaluates the host’s actual log-access policy."
      ]
    ]
  },
  {
    "comp": "m3.c2",
    "title": "Diagnose CPU, memory and disk with comparable measurements",
    "intro": "A retail API becomes slow at peak time. CPU percentage, memory usage, filesystem space and inode availability answer different questions. Gather workload-related measurements before selecting a repair.",
    "headings": [
      "Understand the boundary",
      "Apply it to an operating decision",
      "Check the model and its limits"
    ],
    "sections": [
      [
        "Commands such as ps and top can inspect process activity, while free, vmstat, df and du answer different resource questions under their documented behavior. df reports filesystem space information; du summarizes directory usage and can differ because of permissions, deleted-open files, mount layout and sparse files. A full byte counter is not the only reason writes can fail.",
        "CPU saturation differs from I/O waiting, memory pressure differs from a large virtual mapping, and free space differs from available inode capacity. Compare samples over a defined interval and correlate request load, latency and errors. One snapshot cannot establish a leak, a sustained bottleneck or a causal mechanism."
      ],
      [
        "Prioritize the symptom affecting users, then investigate a constrained resource hypothesis. Avoid deleting arbitrary logs, killing unrelated processes or disabling limits before preserving evidence and checking the actual target. Cleanup and restarts can be useful authorized corrections but need scope and verification.",
        "The fixture calculates supplied filesystem byte and inode usage ratios. It shows a filesystem with available bytes but exhausted modeled inodes. It does not read host disk, inspect processes or measure actual latency, so the example supports resource distinction rather than a production diagnosis."
      ]
    ],
    "code": "capacity = {\"bytes_used\": 40, \"bytes_total\": 100, \"inodes_used\": 10, \"inodes_total\": 10}\nprint(capacity[\"bytes_used\"] / capacity[\"bytes_total\"])\nprint(capacity[\"inodes_used\"] == capacity[\"inodes_total\"])",
    "expect": "0.4\nTrue",
    "problem": "Distinguish synthetic byte capacity from inode exhaustion.",
    "steps": [
      "Compute the declared byte fraction.",
      "Compare the separate inode count with its capacity.",
      "Avoid inferring real host status from fixture values."
    ],
    "limit": "These arithmetic results are not live df, du, process or storage-performance measurements.",
    "mistakes": [
      "Treating free bytes as proof every filesystem write can succeed.",
      "Calling one high memory snapshot a proven leak."
    ],
    "takeaways": [
      "Match each metric to the question it answers.",
      "Correlate trends and workload before causal conclusions."
    ],
    "practice": [
      [
        "What does df commonly report?",
        "Filesystem space information",
        "Every app’s response correctness",
        "All customer permissions",
        "Every packet’s route",
        "df concerns mounted filesystem capacity rather than application business behavior."
      ],
      [
        "What does du commonly summarize?",
        "Directory storage usage",
        "Every process’s role grants",
        "All TCP retransmissions",
        "The kernel’s DNS cache",
        "du traverses selected filesystem content under its options and access context."
      ],
      [
        "Why can df and du differ?",
        "They measure different views",
        "One must always be broken",
        "Both always include identical files",
        "Numbers grant different permissions",
        "Mounts, deleted-open files, permissions and allocation behavior can make the views differ legitimately."
      ],
      [
        "What can block creating files despite free bytes?",
        "Inode exhaustion",
        "Only a long hostname",
        "Only a short source comment",
        "The app’s chart color",
        "Filesystem metadata capacity can be constrained independently from available byte storage."
      ],
      [
        "What does a single high memory sample not prove?",
        "A memory leak",
        "That a sample was observed",
        "A reported current measurement",
        "A possible investigation clue",
        "A leak claim needs comparable workload/time evidence rather than one isolated value."
      ],
      [
        "Why correlate resource metrics with latency?",
        "To investigate user impact",
        "To replace all measurements",
        "To make all counters equal",
        "To avoid defining the workload",
        "Workload and user-facing behavior help evaluate whether a resource observation is relevant to the incident."
      ],
      [
        "What does the fixture’s 0.4 describe?",
        "The supplied byte fraction",
        "Live CPU saturation",
        "Production disk latency",
        "The host’s real memory limit",
        "The ratio follows only the provided synthetic byte counts."
      ],
      [
        "What should precede deleting incident logs?",
        "Scope and evidence review",
        "An assumption all logs are disposable",
        "Disabling every service",
        "A public secret dump",
        "Cleanup can destroy evidence and needs a justified narrow target and retention-aware plan."
      ]
    ],
    "final": [
      [
        "Which capacity can be exhausted separately from bytes?",
        "Inodes",
        "A filename’s font",
        "The service’s display initials",
        "The source-code indentation",
        "Filesystem metadata availability can limit file creation even with free data-block capacity."
      ],
      [
        "Why compare measurements over time?",
        "A snapshot is limited evidence",
        "One sample proves every trend",
        "Time series grant root access",
        "Metrics cannot vary by workload",
        "Trends under comparable conditions support growth and saturation reasoning better than an isolated observation."
      ],
      [
        "What distinguishes CPU saturation from I/O wait?",
        "The constrained activity differs",
        "Both always mean more cores fix it",
        "Both prove the same root cause",
        "Neither can affect latency",
        "Runnable computation pressure and waiting for I/O require different diagnostic reasoning."
      ],
      [
        "A disk has40of100byte units used but all modeled inodes used. What conclusion fits?",
        "Byte and inode capacity differ",
        "All writes must succeed",
        "The disk is physically broken",
        "CPU usage is exactly40percent",
        "The fixture shows one available capacity dimension does not establish another."
      ],
      [
        "An operator runs du on a partial accessible tree and compares it with df for the whole mount. What should be recognized?",
        "Different measured scopes",
        "Every difference is corruption",
        "Permissions never affect traversal",
        "All mounts contain one directory",
        "Different scope and access views can legitimately produce different storage totals."
      ],
      [
        "A service is slow with low CPU and blocked storage operations. What deserves investigation?",
        "Storage latency and queues",
        "Only a higher CPU frequency",
        "Only a new process name",
        "Only the web page’s theme",
        "Low computation use with blocking points toward examining waits rather than assuming CPU saturation."
      ],
      [
        "Can this arithmetic fixture certify a production disk bottleneck?",
        "No, workload evidence is needed",
        "Yes, ratios measure latency automatically",
        "Yes, dictionaries inspect mount state",
        "Yes, every disk shares these counters",
        "The example does not observe actual filesystem, device or user-facing performance behavior."
      ]
    ]
  },
  {
    "comp": "m4.c1",
    "title": "Maintain packages through trusted repositories and tested changes",
    "intro": "A Linux worker needs a security update. Package installation changes executable code and dependencies, so use the distribution’s supported manager, trusted sources and an isolated validation path before affecting a real service.",
    "headings": [
      "Understand the boundary",
      "Apply it to an operating decision",
      "Check the model and its limits"
    ],
    "sections": [
      [
        "Package managers such as apt on Debian-family systems and dnf on supported RPM-based distributions resolve packages from configured repositories under their trust and policy model. Refreshing repository metadata is distinct from installing upgrades. A command copied for another distribution may be invalid or unsafe in the current environment.",
        "Review the intended package, version constraints, dependency changes and service restart implications. A signed repository helps establish source trust but does not prove every version is free of vulnerabilities or operational defects. Keep inventory, advisories, rollback/recovery plans and post-change tests in the maintenance workflow."
      ],
      [
        "Do not pipe an unreviewed downloaded script into a privileged shell just because installation is inconvenient. Preserve the configured proxy, certificate trust and repository policy, and keep credentials out of command histories and support reports. An application’s lockfile and a host package database have different scopes.",
        "The fixture compares two synthetic package inventories and reports the changed component. It does not contact a repository, install software, run a package manager or restart a host service. The lesson’s operational commands remain examples for authorized environments, not actions performed by this content check."
      ]
    ],
    "code": "before = {\"worker\":\"1.0\", \"helper\":\"2.1\"}\nafter = {\"worker\":\"1.1\", \"helper\":\"2.1\"}\nprint([name for name in after if before.get(name) != after[name]])",
    "expect": "['worker']",
    "problem": "Review a synthetic package-version change without installing anything.",
    "steps": [
      "Record the before inventory.",
      "Compare the proposed after versions.",
      "Report only components whose selected version changed."
    ],
    "limit": "The version comparison does not assess vulnerabilities, package provenance, dependency resolution or actual installation behavior.",
    "mistakes": [
      "Treating a metadata refresh as an applied software upgrade.",
      "Assuming a trusted source guarantees every version is operationally safe."
    ],
    "takeaways": [
      "Use the supported manager and reviewed source policy.",
      "Validate intended behavior and recovery after updates."
    ],
    "practice": [
      [
        "What is distinct from installing upgrades?",
        "Refreshing package metadata",
        "Applying a selected new binary",
        "Changing the installed version",
        "Replacing an installed component",
        "Metadata refresh updates available package information rather than necessarily changing installed software."
      ],
      [
        "Why identify the distribution first?",
        "Package tooling differs",
        "Every Linux host uses one manager",
        "Distribution names grant root",
        "Only the desktop logo matters",
        "Supported package managers and operational conventions depend on the actual distribution."
      ],
      [
        "What should an update review include?",
        "Dependency and restart effects",
        "Only a longer version label",
        "Only the download filename",
        "Every user’s private password",
        "Package changes can affect dependencies and service behavior beyond the named top-level component."
      ],
      [
        "Does a signed source prove no vulnerabilities?",
        "No",
        "Always",
        "Only for short package names",
        "Only on weekdays",
        "Source authenticity is different from vulnerability freedom and operational correctness."
      ],
      [
        "Why avoid an unreviewed privileged install script?",
        "It executes broad trusted code",
        "HTTPS makes all scripts harmless",
        "Scripts cannot change files",
        "The package manager forbids inspection",
        "Executing arbitrary installation logic with elevated authority can affect many unrelated resources."
      ],
      [
        "What does the inventory fixture report?",
        "The changed worker version",
        "A completed host upgrade",
        "A live advisory finding",
        "Every installed dependency",
        "The synthetic comparison identifies only a supplied version difference."
      ],
      [
        "What should follow an applied authorized update?",
        "Relevant behavior checks",
        "Only deleting all incident logs",
        "Assuming versions prove health",
        "Disabling authentication for tests",
        "Operational validation should confirm the intended workload and security properties after change."
      ],
      [
        "What should stay out of command-history evidence?",
        "Credentials",
        "A safe package name",
        "A nonsecret version label",
        "The supported manager’s name",
        "Reusable secrets should not be exposed through routine installation commands or shared diagnostics."
      ]
    ],
    "final": [
      [
        "Which action is not equivalent to a package upgrade?",
        "Metadata refresh",
        "Installing a selected new version",
        "Replacing a package’s files",
        "Applying an intended update",
        "Refreshing available package information need not change the installed executable code."
      ],
      [
        "Why consider dependency changes?",
        "They can alter service behavior",
        "Only top-level names affect execution",
        "Dependencies never contain code",
        "Signatures prevent all incompatibility",
        "A package update can resolve or replace components that materially affect the workload."
      ],
      [
        "What does source-signature verification support?",
        "Source authenticity",
        "Universal vulnerability freedom",
        "Guaranteed application compatibility",
        "Automatic business authorization",
        "Trusting the distribution channel is useful but not a complete correctness or security proof."
      ],
      [
        "An engineer copies an apt command onto an unrelated distribution. What should be checked?",
        "The supported package workflow",
        "Only the command’s font",
        "Only the terminal width",
        "The hostname’s capitalization",
        "Package commands and repository policy must match the actual operating environment."
      ],
      [
        "A worker update restarts a service during active processing. What planning was needed?",
        "Operational impact and recovery",
        "Only a shorter version number",
        "Only the package’s icon",
        "The account’s display nickname",
        "Maintenance should account for in-flight work, restart behavior and a practical recovery path."
      ],
      [
        "A version comparison prints worker. Can it certify the update is secure?",
        "No, further evidence is required",
        "Yes, every larger number is safe",
        "Yes, strings verify signatures",
        "Yes, dictionaries scan vulnerabilities",
        "The local inventory diff does not inspect provenance, advisories, tests or a deployed package."
      ],
      [
        "A troubleshooting guide asks users to disable certificate checks for installation. What should be repaired instead?",
        "The intended trust configuration",
        "Only the package filename",
        "Only the shell’s greeting",
        "A different progress-bar color",
        "Installation should preserve peer/source trust and correct the configuration issue rather than removing verification."
      ]
    ]
  },
  {
    "comp": "m4.c1",
    "title": "Schedule cron jobs with explicit environment and time assumptions",
    "intro": "A university wants a daily synthetic-report job. Scheduling is more than writing five time fields: the job needs a known executable, environment, timezone, logging and a policy for missed or overlapping work.",
    "headings": [
      "Understand the boundary",
      "Apply it to an operating decision",
      "Check the model and its limits"
    ],
    "sections": [
      [
        "Traditional crontab entries commonly use minute, hour, day-of-month, month and day-of-week fields followed by a command. Syntax and extensions vary by cron implementation. System crontabs can include an additional user field, so do not copy a user-crontab line into another format without checking the local documentation.",
        "Scheduled jobs often run with a smaller environment and a different working directory from an interactive shell. Use explicit paths and configuration, capture safe output and errors, and define credentials through approved mechanisms rather than embedding them in the schedule. Timezone and daylight-saving behavior need implementation-specific review."
      ],
      [
        "A frequent job can overlap with an earlier slow invocation; a schedule alone is not a concurrency lock or exactly-once guarantee. Decide how to handle overlap, missed runs, retries and catch-up from the business requirement. Test in an isolated environment before relying on the schedule for customer-visible work.",
        "The fixture parses one deliberately simple five-field expression as text and checks its declared hour/minute values. It is not a complete cron parser or scheduler and does not install a crontab. It demonstrates field position, while real syntax validation belongs to the actual supported scheduler."
      ]
    ],
    "code": "schedule = \"15 2 * * *\"\nminute, hour, day, month, weekday = schedule.split()\nprint((minute, hour))\nprint(day == month == weekday == \"*\")",
    "expect": "('15', '2')\nTrue",
    "problem": "Inspect the positions in a simple synthetic five-field cron expression.",
    "steps": [
      "Split the known simple expression.",
      "Read minute and hour in their defined order.",
      "Check the remaining wildcard fields without scheduling a job."
    ],
    "limit": "String splitting is not full cron validation, timezone calculation or evidence that any real job will execute.",
    "mistakes": [
      "Assuming an interactive terminal’s environment carries into a scheduled job.",
      "Treating a recurring schedule as an overlap lock or exactly-once delivery system."
    ],
    "takeaways": [
      "State environment, timezone and failure behavior.",
      "Validate with the actual scheduler and workload contract."
    ],
    "practice": [
      [
        "Which field comes first in a common five-field crontab?",
        "Minute",
        "Year in every implementation",
        "User id in every user crontab",
        "The executable path",
        "Traditional five-field timing starts with minute, followed by hour and calendar fields."
      ],
      [
        "Why use explicit executable paths in jobs?",
        "The environment can differ",
        "Cron grants every shell alias",
        "Interactive PATH is universal",
        "Every job starts in one terminal",
        "A scheduler may supply a different or limited environment from an interactive session."
      ],
      [
        "What does the fixture’s 15 2 begin with?",
        "Minute15 and hour2",
        "Hour15 and minute2",
        "A guaranteed UTC instant",
        "A complete yearly timetable",
        "The simple example uses the documented minute/hour field order without resolving timezone behavior."
      ],
      [
        "What does scheduling alone not prevent?",
        "Overlapping invocations",
        "The existence of a command string",
        "A recurring trigger definition",
        "A documented timing rule",
        "A trigger schedule does not provide mutual exclusion for work that runs longer than its interval."
      ],
      [
        "Why review timezone behavior?",
        "Calendar interpretation matters",
        "All cron systems are UTC by law",
        "Timezones grant filesystem permissions",
        "DST never changes clocks",
        "Actual scheduler timezone and daylight-saving semantics affect when calendar triggers occur."
      ],
      [
        "What can differ in a system crontab format?",
        "An additional user field",
        "Every TCP packet’s port",
        "The CPU’s instruction set",
        "The application’s JSON schema",
        "Some system-level formats include a user column that ordinary user crontabs do not."
      ],
      [
        "What must remain outside a public schedule file?",
        "Raw reusable credentials",
        "A safe command path",
        "A timing expression",
        "A nonsecret job label",
        "Schedules should use approved secret mechanisms rather than exposing credentials in readable configuration."
      ],
      [
        "Does the fixture install a cron job?",
        "No",
        "Always when strings split",
        "Only if wildcards are present",
        "Only when the hour is2",
        "It parses supplied text and never calls crontab or a scheduler API."
      ]
    ],
    "final": [
      [
        "What is a schedule distinct from?",
        "An execution guarantee",
        "A trigger definition",
        "A configuration expression",
        "A declared timing policy",
        "A schedule describes intended triggering and does not prove every run occurred successfully."
      ],
      [
        "Why define overlap handling?",
        "Jobs can exceed their interval",
        "Schedules automatically lock all resources",
        "Only one process can exist on Linux",
        "Every command finishes instantly",
        "Recurring triggers can start another invocation before earlier work completes unless controlled deliberately."
      ],
      [
        "What must a production timing claim specify?",
        "Its scheduler and time context",
        "Only the expression’s length",
        "Only the job’s nickname",
        "The screen’s brightness",
        "Timezone, implementation and calendar behavior are necessary to interpret the intended execution times."
      ],
      [
        "A report runs manually but fails under cron. Which context should be checked?",
        "Runtime paths and context",
        "Only the terminal theme",
        "Only the user’s photo",
        "The number of browser bookmarks",
        "Scheduled execution can differ in PATH, working directory, configuration and available environment values."
      ],
      [
        "An engineer pastes a user-crontab entry into a format expecting a user column. What was missed?",
        "The actual file format",
        "Only the line’s font size",
        "Only a longer command name",
        "The application’s color palette",
        "Cron implementations and system versus user formats can have different required fields."
      ],
      [
        "The split fixture accepts five tokens. Can it certify all cron syntax is valid?",
        "No, it is not a full parser",
        "Yes, every five strings are valid",
        "Yes, Python starts the schedule",
        "Yes, wildcards validate all ranges",
        "The example handles one known expression and does not implement field ranges, extensions or actual scheduler validation."
      ],
      [
        "A daily report must recover from missed execution after downtime. What needs design?",
        "Missed-run recovery rules",
        "Only a new job title",
        "Only a larger log file",
        "A longer executable suffix",
        "Business requirements must determine how unexecuted work is detected and recovered rather than assuming a schedule guarantees catch-up."
      ]
    ]
  },
  {
    "comp": "m4.c1",
    "title": "Make recurring operational work bounded, observable and recoverable",
    "intro": "A scheduled inventory report must not create duplicate customer notifications when retried. A reliable job defines its identity, state transition, bounded work and failure evidence rather than merely returning success from a shell.",
    "headings": [
      "Understand the boundary",
      "Apply it to an operating decision",
      "Check the model and its limits"
    ],
    "sections": [
      [
        "Idempotent work has a defined repeated-effect contract. Replacing a report for a fixed date can differ from sending a notification or charging a customer; each operation needs its own duplicate-handling design. Use stable operation identity and durable state where needed, and do not infer exactly-once external effects from a local flag.",
        "Set bounded retries, deadlines and resource limits, preserve safe structured outcomes and alert on meaningful failure. Distinguish a failed job invocation from an uncertain downstream result. Cleanup and retry must not delete evidence or replay a non-idempotent action blindly."
      ],
      [
        "Use isolated tests for normal completion, repeat execution, partial failure and overlapping attempts. A local in-memory set can illustrate deduplication but cannot coordinate replicas or survive process loss. Production operations may require transactional state, a queue contract, provider idempotency and reconciliation.",
        "The fixture handles repeated synthetic report identifiers through one process-local completed set. It prints created once and already_done on the repeat. It sends no notifications and changes no persistent application data, making the exact demonstrated boundary explicit."
      ]
    ],
    "code": "completed = set()\ndef run(report_id):\n    if report_id in completed:\n        return \"already_done\"\n    completed.add(report_id)\n    return \"created\"\nprint(run(\"report-demo-1\"))\nprint(run(\"report-demo-1\"))",
    "expect": "created\nalready_done",
    "problem": "Observe repeat handling for one synthetic report id in one process.",
    "steps": [
      "Choose one stable fixture operation id.",
      "Record its first completion in local state.",
      "Repeat the same id and inspect the declared response."
    ],
    "limit": "This in-memory sequential model does not provide durable, concurrent or distributed exactly-once execution and has no external side effect.",
    "mistakes": [
      "Assuming a local completed set coordinates every replica.",
      "Retrying an uncertain external action without its operation contract."
    ],
    "takeaways": [
      "Define repeat and partial-failure semantics.",
      "Use durable coordination and reconciliation where the actual effect requires them."
    ],
    "practice": [
      [
        "What does idempotency describe?",
        "A repeated-effect contract",
        "A guarantee every invocation is identical",
        "A universal absence of failures",
        "The number of shell processes",
        "Idempotency concerns the operation’s defined effect under repetition rather than a blanket reliability guarantee."
      ],
      [
        "Why use a stable operation id?",
        "To recognize the same work",
        "To grant root privileges",
        "To encrypt every log line",
        "To replace every timeout",
        "A consistent identity supports appropriate duplicate handling and state correlation."
      ],
      [
        "What does an in-memory completed set not survive?",
        "Process loss",
        "A sequential membership check",
        "A local function call",
        "A printed string",
        "Process-local state disappears when the process is lost and cannot be treated as durable coordination."
      ],
      [
        "What should retry policy include?",
        "Bounds and operation semantics",
        "Unlimited immediate attempts",
        "Only a new display label",
        "A guarantee every timeout means no effect",
        "Retries need budgets and an understanding of whether an earlier uncertain action may have taken effect."
      ],
      [
        "Which failure case deserves isolated testing?",
        "Partial completion",
        "Only the happy path",
        "Only a renamed variable",
        "Only a larger log title",
        "Partial progress and uncertain results expose behavior that a success-only test cannot establish."
      ],
      [
        "What is the fixture’s repeat result?",
        "already_done",
        "created twice",
        "A real notification sent",
        "A provider refund completed",
        "The second call sees the same id in the supplied process-local completed set."
      ],
      [
        "What should observability avoid exposing?",
        "Credentials/private data",
        "A safe outcome category",
        "A nonsecret operation id",
        "The bounded retry count",
        "Useful job evidence can be recorded without copying authority-bearing or unnecessary sensitive data."
      ],
      [
        "Does the fixture coordinate two replicas?",
        "No",
        "Always",
        "Only for short ids",
        "Only if both print success",
        "A single local Python set is not shared durable state across independent processes or replicas."
      ]
    ],
    "final": [
      [
        "What does a repeat-safe report design need first?",
        "A defined effect and identity",
        "A promise every effect is identical",
        "Only the newest filename",
        "Only a longer cron expression",
        "Duplicate behavior must be defined for the actual operation and recognized through suitable identity."
      ],
      [
        "Why is an external timeout an uncertain result?",
        "The effect may have happened",
        "Timeout guarantees no processing",
        "All providers roll back instantly",
        "Every retry is automatically safe",
        "A missing response does not establish that a remote side effect did not occur."
      ],
      [
        "What can a local in-memory dedupe test establish?",
        "Its sequential fixture behavior",
        "Durable exactly-once delivery",
        "Cross-region transaction safety",
        "Provider settlement completion",
        "The shown set supports only local sequential repeat handling in the running fixture."
      ],
      [
        "A notification job retries after an uncertain provider response and sends twice. What was missing?",
        "A duplicate-effect contract",
        "Only a shorter email subject",
        "Only a new terminal tab",
        "A different cron nickname",
        "Non-idempotent external actions need a defined identity, provider/reconciliation policy and retry behavior."
      ],
      [
        "A job’s completed set disappears after restart. What requirement was unmet?",
        "Durable state where needed",
        "The ability to hold a Python string",
        "The syntax of function calls",
        "The existence of a schedule",
        "Process-local memory does not preserve work history through failure or coordinate later instances."
      ],
      [
        "An incident script retries forever while a dependency is failing. What should be bounded?",
        "Attempts, time and resource use",
        "Only the script’s title",
        "Only the job’s color",
        "The number of source comments",
        "Unbounded retries can amplify load and delay recovery without establishing a successful effect."
      ],
      [
        "The fixture prints created then already_done. Can it certify no real customer received duplicates?",
        "No, there is no external action",
        "Yes, every provider uses this set",
        "Yes, printed ids control email",
        "Yes, all retries are disabled",
        "No notification or production workflow is exercised, so the model cannot establish real delivery behavior."
      ]
    ]
  }
];
const refs=['os','pathlib','subprocess'].map(pythonRef);
refs.push({id:'systemctl',title:'Official systemctl reference',url:'https://github.com/systemd/systemd/blob/6cf990ea2931a901aaba4e0e5ee1d8fda86a4a76/man/systemctl.xml',source:{repo:'systemd/systemd',commit:'6cf990ea2931a901aaba4e0e5ee1d8fda86a4a76',path:'man/systemctl.xml',verification:'Pinned official command source; no host service is controlled.'}});
refs.push({id:'journalctl',title:'Official journalctl reference',url:'https://github.com/systemd/systemd/blob/6cf990ea2931a901aaba4e0e5ee1d8fda86a4a76/man/journalctl.xml',source:{repo:'systemd/systemd',commit:'6cf990ea2931a901aaba4e0e5ee1d8fda86a4a76',path:'man/journalctl.xml',verification:'Pinned official command source; no host journal is read.'}});
refs.push({id:'coreutils',title:'GNU Coreutils official manual source',url:'https://github.com/coreutils/coreutils/blob/40d9fe3e036e8ac404d81bb2f90a353e67440e92/doc/coreutils.texi',source:{repo:'coreutils/coreutils',commit:'40d9fe3e036e8ac404d81bb2f90a353e67440e92',path:'doc/coreutils.texi',verification:'Pinned official source; isolated temporary commands only.'}});
const built=build('linux-sysadmin',data,refs);
module.exports=built.course;
Object.defineProperty(module.exports,'__bank',{value:built.bank,enumerable:false});
