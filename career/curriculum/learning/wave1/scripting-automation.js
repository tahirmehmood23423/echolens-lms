'use strict';
const {build,ref}=require('./ops-wave3-helper');
const data=[
  {
    "comp": "m1.c1",
    "title": "Quote arguments and preserve file boundaries",
    "intro": "A payroll export contains spaces and wildcard characters in filenames. A Bash variable is text; expanding it unquoted can turn one intended argument into several or expand a pattern against the working directory. Begin by distinguishing shell syntax from the data passed to a command.",
    "sections": [
      [
        "Expansion and quoting",
        "In Bash, double quotes preserve the expanded value of a parameter as one word while still allowing parameter expansion. Single quotes preserve literal characters and do not expand a variable. Unquoted expansions can undergo word splitting and pathname expansion; an array preserves a list of arguments without rebuilding shell syntax.",
        "Use printf with a fixed format rather than treating untrusted text as the format. Prefer explicit positional arguments and use -- where the target utility supports it to end option parsing. Quoting does not make a dangerous operation harmless; it preserves argument boundaries."
      ],
      [
        "Apply an argument contract",
        "The example invokes the actual /usr/bin/bash interpreter through Python subprocess with a list of arguments. Bash receives two positional parameters, including one containing a space. The script prints each quoted argument on its own line, without evaluating user content as shell code.",
        "An operations wrapper should validate permitted paths and operations separately from quoting. eval and bash -c with interpolated external text introduce an interpretation boundary that an argument array would otherwise avoid. Review permissions before introducing a write operation."
      ]
    ],
    "code": "import subprocess, tempfile\nwith tempfile.TemporaryDirectory() as work:\n    result = subprocess.run(['/usr/bin/bash', '--noprofile', '--norc', '-c', 'for item in \"$@\"; do printf \"<%s>\\n\" \"$item\"; done', 'fixture', 'pay roll.csv', '*.csv'], cwd=work, capture_output=True, text=True, check=True)\n    print(result.stdout, end='')",
    "expect": "<pay roll.csv>\n<*.csv>",
    "practice": "Which Bash quoting form permits parameter expansion while preserving one expanded word?|Double quotes|Single quotes|No quotes|A comment|Double quotes expand parameters without ordinary word splitting and globbing on that expansion.\nWhat does \"$@\" preserve inside a loop?|Each original positional argument|One scalar joining all original positional arguments|One joined argument|A filename expansion|Quoted at-sign expands positional arguments as separate words.\nWhy use a fixed printf format?|Keep data out of format interpretation|Allow the incoming value to choose printf conversions|Encrypt all arguments|Disable exit statuses|The format is syntax while subsequent arguments are data.\nAn export filename contains spaces. Which expansion preserves its boundary?|\"$file\"|$file|eval \"$file\"|bash -c \"$file\"|Quoting preserves the filename as one argument instead of splitting it.\nA path begins with a hyphen. What additional convention helps a supporting utility?|Place -- before paths|Remove all quotes|Use eval|Discard the path|The utility can interpret -- as the end of options; support must be checked per command.\nA wrapper receives untrusted text. Which approach avoids parsing it as shell code?|Pass it as an argument|Interpolate into eval|Append it to bash -c|Treat it as a printf format|Argument passing preserves the distinction between executable syntax and input data.",
    "final": "What does single quoting do to $HOME in a Bash word?|Keeps the text literal|Expands the home directory|Runs a home command|Removes the word|Single quotes suppress parameter expansion.\nWhich Bash structure best holds an argument list with spaces?|An array|A space-joined scalar|An eval string|A comment|An array retains element boundaries for quoted array expansion.\nWhat operation can follow an unquoted parameter expansion?|Word splitting|Automatic encryption|Role authentication|Exit-code validation|Bash may split the result according to the field-splitting rules.\nA billing script prints an incoming value containing percent signs. What is appropriate?|printf '%s' \"$value\"|printf \"$value\"|eval \"$value\"|Run the value as a command|A fixed format treats percent signs in the supplied value as data.\nA partner sends a filename *.csv that must remain literal. Which invocation preserves it?|command -- \"$file\"|command $file|eval command \"$file\"|command $(echo $file)|Quoted expansion prevents the wildcard from becoming a pathname pattern here.\nA report job joins arguments into one string then re-parses it. What should replace that design?|Preserve an argument array|Add another eval|Remove filename spaces globally|Trust every caller|A list can represent argument boundaries without reconstructing shell syntax.\nAn operator believes quotes authorize deletion of a customer path. What remains necessary?|Validate allowed paths and operation|Authorize deletion whenever the filename expansion is quoted|Only quote the command name|Only remove comments|Quoting controls parsing; permission and path policies are separate obligations.\nThe fixture prints two bracketed lines. Which behavior was actually exercised?|Real Bash positional expansion|A deployed payroll export|A production permission review|A cloud API mutation|The subprocess runs Bash locally with synthetic arguments and no external service.\nA script passes external text after bash -c as $1. Which condition preserves its data role?|Quote fixed-script \"$1\"|Concatenate it into the script|Evaluate it with eval|Make it the command name|The fixed script should reference the positional argument as data rather than parse it as new syntax.\nAn audit requires a literal dollar sign in a template. Which Bash representation works?|Single-quoted '$amount'|Unquoted $amount|Double-quoted \"$amount\"|Command substitution of amount|Single quoting retains the dollar sign and variable name literally.",
    "mistakes": [
      "Joining an array into a scalar loses boundaries.",
      "Quoting does not validate a destructive path."
    ],
    "takeaways": [
      "Separate script syntax from external data.",
      "Preserve lists as lists across process boundaries."
    ],
    "problem": "Print literal filenames through actual Bash.",
    "steps": [
      "Create an empty temporary working directory.",
      "Pass two arguments to a fixed Bash script.",
      "Print quoted positional arguments and compare exact output."
    ],
    "limit": "Only Bash argument handling is executed; no payroll service, host configuration or production file is accessed."
  },
  {
    "comp": "m1.c1",
    "title": "Control loops and interpret exit statuses",
    "intro": "A nightly reconciliation must record which local task failed and stop a dependent publication. Shell commands communicate success with exit status zero, but a failure has meaning only in the surrounding control flow. Explicit branches are easier to audit than assuming every nonzero result will terminate a script.",
    "sections": [
      [
        "Statuses and branches",
        "A simple command supplies a status to the shell; zero conventionally means success and nonzero signals another outcome. if and while test statuses, not the human wording printed to stdout. Capture a status immediately because a later command replaces $?.",
        "A for loop iterates over words or quoted array elements. continue skips the rest of the current iteration; break exits the loop. A failed item should be recorded with a stable identifier, and dependent work should follow an explicit policy rather than accidentally continuing."
      ],
      [
        "Bounded execution policy",
        "set -e has contextual exceptions, including common conditional and list contexts, so it is not a substitute for explicit failure handling. Commands expected to fail as part of probing should be in a deliberate conditional with a documented interpretation.",
        "This example runs a deterministic Bash loop in an empty temporary directory. It labels an expected false result and continues to another item. It demonstrates control flow without claiming a successful deployment or relying on an external command whose behavior might vary."
      ]
    ],
    "code": "import subprocess, tempfile\nscript = 'for name in alpha beta; do if [ \"$name\" = alpha ]; then printf \"ok:%s\\n\" \"$name\"; else false; status=$?; printf \"failed:%s:%s\\n\" \"$name\" \"$status\"; fi; done'\nwith tempfile.TemporaryDirectory() as work:\n    result = subprocess.run(['/usr/bin/bash','--noprofile','--norc','-c',script],cwd=work,capture_output=True,text=True,check=True)\n    print(result.stdout,end='')",
    "expect": "ok:alpha\nfailed:beta:1",
    "practice": "Which exit status conventionally means success?|0|1|127|Every positive number|Zero is the conventional successful command status.\nWhat does $? describe?|Most recent command status|All previous failures|The current username|The remaining loop count|A later command replaces the value observed through $?.\nWhat does break do in a loop?|Exits the loop|Skips only the next argument|Restarts Bash|Changes the working directory|Break leaves the enclosing loop rather than merely skipping its remaining body.\nA probe can legitimately return nonzero. Where should its meaning be handled?|An explicit conditional|An unexamined final line|Only a log filename|An arbitrary delay|The conditional can distinguish expected absence from a failure requiring termination.\nA script runs echo before capturing a failed status. What changed?|The original status was overwritten|The earlier failure status remains preserved through logging|The command became idempotent|Bash encrypted the result|The latest command status replaces the earlier value of $?.\nA publication depends on reconciliation. What should gate it?|Verified reconciliation success|Only reaching the last line|Only an empty stdout|Only an existing log file|An explicit dependency gate prevents publishing after an unsuccessful required step.",
    "final": "What does if command test in Bash?|The command exit status|The length of stdout|The filename suffix|The wall-clock date|Bash conditional execution is based on the command status.\nWhich action skips the rest of one loop iteration?|continue|break|exit|exec|Continue moves to the next iteration while break leaves the loop.\nWhy capture a failure status immediately?|Later commands replace it|It expires after one second|It is stored in the filename|It cannot be assigned|The special parameter reports only the latest executed command status.\nA nightly check prints ERROR but exits zero. What will a status-based gate see?|Status success|Automatic failure from the text|An unavailable shell|A signal termination|Output text does not automatically determine the command exit status.\nA task returns status 2 for malformed input. What should the wrapper do?|Map that documented outcome explicitly|Assume all nonzero outcomes mean missing file|Ignore the status after logging|Convert it to success unconditionally|Outcome handling must follow the tool contract rather than treating all failures identically.\nA team relies on set -e inside every if condition. Which caveat belongs in review?|Errexit has contextual exceptions|Errexit validates business output|Errexit quotes filenames|Errexit retries all failures|Conditional contexts affect errexit behavior and require explicit reasoning.\nOne item fails in a batch where independent items may continue. What evidence should be retained?|Per-item results|Only the final echo status|Only the first item name|Only elapsed time|An overall result must reflect failed required items even when independent work continues.\nAn engineer wants to leave both a function and its script after a fatal prerequisite. Which scope distinction matters?|return versus exit|return always powers off the host|break leaves every process|continue terminates the interpreter|Control commands have different scopes and must match the intended failure boundary.\nA failed command is followed by printf and the script exits zero. What would improve its contract?|Propagate the required failure deliberately|Always use the final logging command as the wrapper exit status|Rename stdout|Sleep before exiting|The wrapper must retain and propagate failure rather than allowing a successful log statement to hide it.\nThe supplied loop labels beta failed but Python check=True succeeds. Why?|The Bash script final printf succeeded|Python never checks statuses|Bash false always returns zero|Printed failure text raises no possible concern|The overall process status follows its actual shell control flow, which ended with successful printing.",
    "mistakes": [
      "Reading $? after logging loses the original result.",
      "set -e is not universal business error handling."
    ],
    "takeaways": [
      "Use explicit gates for dependent operations.",
      "Distinguish per-item status from the wrapper status."
    ],
    "problem": "Run and inspect explicit Bash success and failure branches.",
    "steps": [
      "Start Bash with profiles disabled.",
      "Record the expected false status immediately.",
      "Compare labels with the process exit contract."
    ],
    "limit": "The fixture tests shell branching only and intentionally returns overall success after printing both records."
  },
  {
    "comp": "m1.c1",
    "title": "Use nounset, pipefail and cleanup deliberately",
    "intro": "A maintenance script pipes a collector into a formatter. The formatter succeeds even when collection fails, leaving a plausible empty report. Strict shell options help expose some defects, but their scope and exceptions must be explained before operators rely on them.",
    "sections": [
      [
        "Options with precise scope",
        "set -u reports many expansions of unset parameters; optional values should use an intentional default such as ${name:-fallback}. An empty value and an unset value are different states, and a default policy should say whether both are acceptable. Avoid printing secret defaults into diagnostic output.",
        "Without pipefail, a pipeline normally reports its last command status. With pipefail, it reports the rightmost nonzero status if any command fails, otherwise zero. PIPESTATUS contains individual statuses but must be captured before another command overwrites them."
      ],
      [
        "Cleanup and termination",
        "A trap can run cleanup on EXIT, and a temporary directory should have a defined owner and lifetime. Cleanup code must quote paths, avoid broad deletion patterns and account for interruption. A trap does not guarantee cleanup after SIGKILL, a host crash or an abrupt power loss.",
        "The fixture executes false piped to true with pipefail enabled and reads the status immediately. It then uses an explicit default for an unset variable under nounset. No report file is published, and these successful demonstrations do not certify a larger script is transactionally safe."
      ]
    ],
    "code": "import subprocess, tempfile\nscript = 'set -uo pipefail; false | true; status=$?; printf \"pipeline:%s\\n\" \"$status\"; printf \"mode:%s\\n\" \"${OPTIONAL_MODE:-dry}\"'\nwith tempfile.TemporaryDirectory() as work:\n    result=subprocess.run(['/usr/bin/bash','--noprofile','--norc','-c',script],cwd=work,capture_output=True,text=True,check=True)\n    print(result.stdout,end='')",
    "expect": "pipeline:1\nmode:dry",
    "practice": "What does pipefail change?|Pipeline status aggregation|The option changes how the shell splits expanded arguments|Filesystem permissions|Command authentication|It reports a pipeline failure even when a later command succeeds.\nWhat does ${name:-fallback} supply?|A value when unset or empty|A fallback only when the parameter is unset but not empty|A retry count from Bash|A pipeline status|The colon-minus expansion intentionally handles unset or null values.\nWhich signal cannot be trapped for cleanup?|SIGKILL|SIGTERM|SIGINT|EXIT pseudo-signal|SIGKILL cannot be caught by a process.\nA collector fails but its formatter succeeds. What can expose the pipeline failure?|Enable pipefail and handle its status|Trust the formatter status as the status of every pipeline stage|Only change the report title|Discard stderr|Pipefail prevents the formatter success from being the only reported pipeline status.\nA required variable is absent under nounset. What is the intended outcome?|An unset expansion is reported|It is always silently empty|It becomes the current directory|It inherits a cloud role|Nounset exposes missing inputs but does not choose a valid business default.\nAn EXIT trap removes a temporary directory. What remains a limit?|Crashes can prevent cleanup|Every crash executes traps|The trap encrypts files|The trap proves idempotency|Cleanup hooks are useful but cannot run after every possible termination.",
    "final": "Without pipefail which command normally determines pipeline status?|The final command|The first command|Every command returns one combined sum|The command with longest output|Ordinary pipeline status follows the final command unless an option changes the rule.\nWith pipefail which failure is selected when several commands fail?|Rightmost nonzero status|Largest numeric status|Earliest timestamp|Sum of all statuses|Bash pipefail uses the rightmost nonzero pipeline status.\nWhat does nounset primarily expose?|Unset parameter expansion|World-writable directories|Expired API tokens|All logical errors|The option reports many missing-variable uses rather than proving whole-script correctness.\nA formatter succeeds after a failed collector and the script publishes empty output. What review change helps?|Gate publication on pipeline success|Publish first then inspect logs|Remove pipefail|Treat empty output as proof of success|A generated artifact should not be published when its required upstream stage failed.\nAn optional environment variable may be missing. What is appropriate under set -u?|An explicit validated default|Disable all input checking|Assume it exists in every shell|Use eval to fill it|An intentional parameter default documents missing-input behavior while preserving validation.\nAn operator reads PIPESTATUS after echo. What is the concern?|Echo replaced the pipeline status array|Echo retried the pipeline|The array records all historical commands|The status array is immutable|Individual pipeline statuses need capture before another command changes them.\nA temporary directory path contains spaces. Which cleanup practice matters?|Quote the exact owned path|Delete an unquoted glob|Delete the parent directory|Evaluate the path as code|Cleanup must preserve boundaries and remain scoped to the directory this run owns.\nA process is killed with SIGKILL during cleanup. Which recovery assumption is valid?|A later scavenging policy may be needed|The EXIT trap necessarily completed|The cleanup log proves deletion|Nounset prevented termination|Uncatchable termination can leave temporary artifacts requiring bounded later handling.\nA team enables set -euo pipefail and claims every failed business operation is caught. What is missing?|Explicit failure gates|Only an extra comment|Only a different shell prompt|Only a longer variable name|Strict options help detect specific shell conditions but do not establish semantic correctness.\nThe fixture prints pipeline:1 then mode:dry. What does that establish?|Local Bash semantics|A live collector recovered|Production reports were published|Every signal executes cleanup|The real Bash process exercised those options against deterministic local commands.",
    "mistakes": [
      "Strict options do not make every script correct.",
      "A trap is not guaranteed after uncatchable termination."
    ],
    "takeaways": [
      "Capture pipeline evidence before another command.",
      "Specify missing-variable and cleanup policies explicitly."
    ],
    "problem": "Exercise actual Bash pipeline failure and safe optional defaults.",
    "steps": [
      "Enable nounset and pipefail.",
      "Capture the failed pipeline status immediately.",
      "Expand an optional input with an intentional default."
    ],
    "limit": "The local interpreter validates these shell semantics only; no host service or cloud resource changes."
  },
  {
    "comp": "m2.c1",
    "title": "Launch child processes with explicit contracts",
    "intro": "A support utility compresses an approved export and reads its summary. Python subprocess gives the caller separate control over executable arguments, working directory, timeout and output. Treat each of those choices as part of an interface contract rather than hiding them in a shell string.",
    "sections": [
      [
        "Argument lists and execution",
        "subprocess.run accepts an argument list that avoids shell interpretation when shell=False, its default. The executable must still be trusted: an argument list cannot make an arbitrary executable safe. Prefer an explicit executable in controlled teaching fixtures and pass external values only in permitted argument positions.",
        "check=True raises CalledProcessError for a nonzero completed status. capture_output=True collects stdout and stderr separately; text=True decodes them as text using the applicable encoding policy. Handle output size and secret content before collecting arbitrary logs in memory."
      ],
      [
        "Bounded child behavior",
        "A timeout prevents an indefinitely running direct child from blocking the caller, but process trees and remote work require their own cancellation strategy. A timeout is an ambiguous outcome for external effects: the caller may not know whether a remote operation completed before communication stopped.",
        "The fixture invokes the current Python interpreter as a deterministic child. It deliberately returns a nonzero status and inspects the separate streams without raising. This validates subprocess handling only; it neither launches a service nor reaches an API."
      ]
    ],
    "code": "import subprocess, sys\nresult=subprocess.run([sys.executable,'-c','import sys; print(\"partial\"); print(\"bad-input\",file=sys.stderr); sys.exit(2)'],capture_output=True,text=True,timeout=3)\nprint(result.returncode)\nprint(result.stdout.strip())\nprint(result.stderr.strip())",
    "expect": "2\npartial\nbad-input",
    "practice": "Which subprocess form avoids shell interpretation by default?|An argument list with shell=False|A concatenated command string executed with shell=True|An eval expression|A concatenated Bash script|Argument lists preserve executable arguments without shell parsing.\nWhat does check=True do after a nonzero completed status?|Raises CalledProcessError|Silently returns zero|Retries forever|Deletes stderr|The caller can handle failed completion as an exception.\nWhat does capture_output=True collect?|Separate stdout and stderr|Only the working directory|All host logs|Only the exit signal|The result retains the two output streams separately.\nA child may hang. Which run parameter bounds the wait?|timeout|shell=True|cwd='/'|text=True|A timeout bounds the waiting period while requiring explicit failure handling.\nAn export argument includes a semicolon. What preserves it as data?|Pass it as one list element|Concatenate a shell command|Enable eval|Make it the executable|Without shell parsing the semicolon is not a shell separator.\nA tool prints credentials on stderr. What should logging do?|Redact or exclude sensitive output|Merge stderr with stdout and store the complete response|Discard all exit statuses|Rename stderr to stdout|Output capture does not make sensitive content appropriate to share.",
    "final": "Which result attribute holds a completed child status?|returncode|stdout|args only|encoding|CompletedProcess.returncode reports the child's completion status.\nWhich option requests text decoding?|text=True|check=False|shell=True|cwd=None|Text mode decodes captured bytes instead of returning bytes.\nDoes an argument list make an untrusted executable safe?|No|Yes under every permission|Only if the list is short|Only if stderr is empty|Shell avoidance preserves parsing boundaries but cannot authorize arbitrary program behavior.\nA support job receives an unexpected child status 2. What should its contract specify?|Whether to raise or handle that documented status|Accept partial stdout as success regardless of completed status|Publish output regardless|Ignore the result object|The caller should deliberately interpret the child's completion contract.\nA timeout occurs after an API helper started a write. Which inference is justified?|Completion may be uncertain|The write certainly never happened|The write certainly rolled back|Every retry is harmless|A caller timeout does not establish the fate of an external side effect.\nAn engineer needs a controlled fixture interpreter. Which choice is strongest here?|Use sys.executable|Use an arbitrary user-supplied executable|Invoke eval|Trust an unrelated PATH entry|The currently running interpreter provides a known executable for the local test.\nA report tool emits millions of lines. What should change before capture_output is used in production?|Design output bounds or streaming|Assume capture is disk-backed|Disable all timeouts|Combine it with eval|Captured output is held in memory and needs a volume policy.\nA diagnostic combines stdout and stderr and loses error context. Which capability helps?|Separate streams|Always discard stderr|Only inspect the filename|Treat every printed line as success|Separate streams preserve the distinction between normal output and diagnostic output.\nA wrapper changes cwd to a user path without validation. What remains despite shell=False?|Filesystem scope risk|No possible file access|Automatic sandbox isolation|Guaranteed read-only behavior|The working directory and program permissions still influence what the child can access.\nThe fixture reports 2, partial and bad-input. What was verified?|Real child status and separate streams|The actual remote export completed despite its local error|A cloud retry succeeded|A service restarted|The executed child supplied deterministic local outputs and a deliberate failure status.",
    "mistakes": [
      "A timeout does not prove an external write failed.",
      "Avoid logging captured secrets or unbounded output."
    ],
    "takeaways": [
      "Make executable, arguments and cwd explicit.",
      "Treat timeout and completed failure as different cases."
    ],
    "problem": "Inspect a failed local child without losing its streams.",
    "steps": [
      "Run the current Python interpreter as a child.",
      "Capture output with a bounded timeout.",
      "Read return code and both streams separately."
    ],
    "limit": "No external command, host service or remote side effect is exercised."
  },
  {
    "comp": "m2.c1",
    "title": "Walk paths safely and publish complete local files",
    "intro": "A synchronization script receives a tenant-relative report path. Joining that string to a base directory is not sufficient: parent traversal and symbolic links can escape the intended scope. Separate path selection, validation and final publication so partial output never masquerades as a complete report.",
    "sections": [
      [
        "Path containment and ownership",
        "pathlib.Path represents filesystem paths but does not itself authorize access. Resolve a candidate against an approved root and verify its relationship to that root before operating. Absolute input paths, .. segments and symlinks can invalidate assumptions made from the raw string.",
        "A resolve-and-check sequence can still race with changes to the filesystem. Production tools operating in adversarial writable directories need stronger descriptor-based and ownership protections; this teaching fixture owns its temporary directory and does not claim to eliminate time-of-check/time-of-use attacks."
      ],
      [
        "Publish after validation",
        "Write a candidate file in the destination filesystem, validate the complete content and replace the target with os.replace. A same-filesystem replacement supports atomic visibility on common supported filesystems, but durable recovery may require file and directory syncing and a defined crash-consistency strategy.",
        "The example creates a local report under its owned temporary root, writes a staging file and replaces the target. It reads the target to verify visibility. It does not synchronize any production directory or prove durability after power loss."
      ]
    ],
    "code": "from pathlib import Path\nimport tempfile, os\nwith tempfile.TemporaryDirectory() as work:\n    root=Path(work).resolve()\n    target=(root/'report.txt').resolve()\n    print(target.is_relative_to(root))\n    staged=root/'report.tmp'\n    staged.write_text('rows=3\\n',encoding='utf-8')\n    os.replace(staged,target)\n    print(target.read_text(encoding='utf-8').strip())",
    "expect": "True\nrows=3",
    "practice": "Does pathlib authorize a path?|No, policy is separate|Yes for absolute paths|Yes after string concatenation|Only when the filename is short|Path objects provide operations rather than an access-control policy.\nWhat can .. segments affect?|Resolved path scope|HTTP status codes|Bash exit conventions|The number of CPU cores|Parent traversal can move a candidate outside an intended directory.\nWhat does os.replace support locally?|Replacing a destination entry|A cloud transaction|Universal cross-filesystem atomicity|A database rollback|Replacement operates on filesystem entries with platform and filesystem limits.\nA tenant submits an absolute output path. What should the wrapper do?|Enforce the allowed-root policy|Trust that joining makes it relative|Write before checking|Use the path as shell code|Absolute inputs can bypass an intended base unless explicitly validated.\nA reader must avoid half-written reports. Which pattern helps?|Stage then replace after validation|Write directly over the live file|Delete the directory first|Publish each partial line|The staging pattern separates incomplete generation from target visibility.\nAn attacker can swap symlinks after validation. What is the concern?|A time-of-check/time-of-use race|Only text encoding|Only a missing newline|Automatic atomic authorization|Filesystem changes can invalidate a prior containment decision.",
    "final": "Which operation interprets a path through filesystem resolution?|Path.resolve|str.lower|json.dumps|print|Resolution accounts for path structure and symlinks subject to platform behavior.\nWhich check tests a resolved candidate's containment relationship?|is_relative_to|A substring match anywhere|Filename length|Whether it contains a dot|A structural path relationship is stronger than a raw substring test.\nDoes same-filesystem replacement alone guarantee power-loss durability?|No|Yes on every device|Only for a short filename|Only with UTF-8|Visibility and durable persistence are separate properties.\nA target is /safe-reports-other/a and the base is /safe-reports. Why reject a raw startswith test?|Sibling-prefix collision|All absolute paths are invalid|The extension is missing|The target must be a directory|Path containment depends on components rather than shared character prefixes.\nA symlink inside the output folder points outside. What should containment checks consider?|The resolved destination|Only the link's displayed name|Only the extension|Only the modification date|Following links can move access outside the approved tree.\nA report is validated only after replacing the live target. What should be reordered?|Validate staging before publication|Replace the target first and validate the newly visible file afterward|Log fewer details|Rename the validation function|Validation needs to gate visibility of the new artifact.\nA staging file is created on another filesystem and replacement fails. Which assumption needs correction?|Same-filesystem staging|All renames cross devices atomically|File names cannot contain dots|Python forbids temporary files|Atomic replacement assumptions are constrained by filesystem boundaries and platform behavior.\nA regulated workflow requires crash recovery after acknowledged completion. What additional design is relevant?|Durability design|Only a success print|Only atomic visibility|Only a longer target filename|Durability requires a deliberate persistence and recovery contract beyond replacing a name.\nThe temporary fixture succeeds. Can it prove symlink attacks are impossible in a shared writable production tree?|No|Yes for every process|Yes if the root starts with slash|Yes if the output is text|The fixture's exclusive temporary ownership does not model hostile concurrent directory changes.\nA scheduled script sees a path it cannot access. What should it preserve?|Scoped failure|Automatic chmod of the entire host|A root-shell fallback|A broad recursive delete|Access failures should be handled within policy instead of silently expanding operational authority.",
    "mistakes": [
      "A string prefix is not path containment.",
      "Atomic visibility is different from crash durability."
    ],
    "takeaways": [
      "Validate paths before operating and explain race limits.",
      "Publish only complete validated artifacts."
    ],
    "problem": "Stage and replace one owned local report.",
    "steps": [
      "Create an owned temporary root.",
      "Resolve and check the candidate destination.",
      "Write staging bytes and replace the target."
    ],
    "limit": "Only an exclusive local temporary directory is tested; adversarial concurrency and power-loss durability require expert review."
  },
  {
    "comp": "m2.c1",
    "title": "Design API retries around effect uncertainty",
    "intro": "A partner ingestion API occasionally returns throttling responses. A retry policy needs bounded attempts, a deadline and an understanding of side effects. A GET and an unprotected charge request have different retry risks even when they fail with the same timeout message.",
    "sections": [
      [
        "Request and response contracts",
        "Validate the endpoint, method, authentication source, expected status and response schema before using an API. HTTPS peer verification protects the intended channel; a successful transport exchange does not prove that the business response contains complete or correct data. Keep credentials in approved secret mechanisms rather than source code or logs.",
        "Distinguish retriable transient conditions from permanent validation or authorization failures. Honor applicable Retry-After instructions and use bounded exponential backoff with jitter where appropriate. Per-attempt timeouts and an overall deadline keep retries from multiplying into unbounded latency."
      ],
      [
        "Repeat effects deliberately",
        "An idempotency key works only when the API defines and enforces its scope, lifetime and conflict behavior. Preserve the same key when retrying one logical operation; generating a new key for every attempt can create duplicate effects. A timeout can leave the remote outcome unknown.",
        "The fixture feeds synthetic status codes to a pure decision function. It schedules a bounded retry decision for throttling and a stop for authorization failure. It performs no network traffic and verifies neither a provider API nor its idempotency implementation."
      ]
    ],
    "code": "def decision(status, attempt, maximum=3):\n    if 200 <= status < 300:\n        return 'accept'\n    if status in {429, 503} and attempt < maximum:\n        return 'retry-with-budget'\n    return 'stop'\nprint(decision(429,1))\nprint(decision(403,1))\nprint(decision(503,3))",
    "expect": "retry-with-budget\nstop\nstop",
    "practice": "What bounds total retry latency?|An overall deadline|Only one attempt timeout|An unlimited queue|A longer API name|Attempt timeouts alone can accumulate across retries and delays.\nWhat does HTTP 429 commonly indicate?|Rate limiting|A valid response body by itself|A permanent local file error|TLS verification success by definition|Throttling may be retriable according to the service contract.\nWhat should happen to an idempotency key during a retry of one operation?|Preserve it under the API contract|Replace it every attempt|Publish it with credentials|Use the status code as the key|A stable logical-operation key enables the provider's deduplication semantics.\nA charge times out after submission. What should the caller assume?|Its effect is uncertain|It certainly never happened|It was certainly rolled back|A new charge is always safe|Timeout alone does not establish whether the provider committed the operation.\nAn API returns 403. Which default is safer than repeated blind attempts?|Stop and investigate authorization|Retry without limit|Disable HTTPS verification|Create new credentials in logs|Authorization failures usually need a permission or credential correction under the service contract.\nA retry policy computes delays but never contacts a server. What has it verified?|Decision logic only|Provider availability|Live Retry-After parsing|Remote deduplication|A pure fixture validates its supplied decision rules without integration evidence.",
    "final": "What should a client validate after an HTTP success status?|Schema and semantics|Only the hostname length|Only the JSON whitespace|Nothing further|A transport or status success does not establish complete usable business data.\nWhy add jitter to bounded backoff?|Reduce synchronized retry waves|Retry all clients at the same deterministic backoff boundary|Guarantee success|Remove deadlines|Randomized delays can reduce clients retrying together during overload.\nWhat controls idempotency-key meaning?|Provider contract|The caller's variable name|The length of stderr|The local clock alone|Deduplication works only within the provider's defined semantics and lifetime.\nA service sends Retry-After with a throttling response. What should a compatible client do?|Budgeted waiting|Always retry immediately|Ignore all provider guidance|Disable authentication|Server guidance should shape waiting while respecting the caller's deadline and attempt limits.\nA team retries every 400 response five times. What is wrong with that default?|Permanent input errors need correction|Repeated attempts automatically correct an unchanged invalid payload|Five retries encrypt data|Retries remove malformed payloads|Repeating an unchanged invalid request normally does not fix its validation problem.\nA client generates a fresh idempotency key after each timeout. Which risk grows?|Duplicate business effects|A guaranteed single charge|Automatic rollback|No remote execution|New keys may represent new operations to a deduplicating service.\nA retry loop has three attempts but each can wait forever. What is missing?|Bounded waits|Only another attempt counter|Only a retry log|Only an HTTP method name|Attempt count does not bound elapsed time without bounded waits.\nA successful paginated response includes a next-page token. What should ingestion do?|Follow the documented pagination contract|Use the first page as the complete dataset because its status was successful|Treat the token as a password|Retry the first page forever|Completeness depends on reading the service's pagination semantics and validating accumulated results.\nAn operator logs full authorization headers to debug retries. Which correction preserves useful evidence?|Safe metadata|Publish every token to the dashboard|Disable peer verification|Remove all attempt limits|Diagnostic evidence can preserve outcomes and identifiers while excluding credential values.\nThe synthetic function stops at the attempt maximum. What remains untested?|Live integration|The local branch condition|The supplied integer comparison|The printed decision strings|No real API, parser or idempotency service was exercised by the model.",
    "mistakes": [
      "Retrying an uncertain write can duplicate its effects.",
      "A status code does not validate the response schema."
    ],
    "takeaways": [
      "Separate transient failure from invalid requests.",
      "Budget attempts and time while preserving operation identity."
    ],
    "problem": "Evaluate a bounded synthetic API retry policy.",
    "steps": [
      "Classify only documented transient statuses.",
      "Check the remaining attempt budget.",
      "Return decisions without performing any network request."
    ],
    "limit": "This model does not contact an API or certify provider-specific retry semantics."
  },
  {
    "comp": "m3.c1",
    "title": "Make repeated runs converge safely",
    "intro": "A report preparation job may be rerun after its worker disconnects. Idempotency means repeating the same logical operation has the same intended effect, rather than appending duplicates each time. Define the desired state and the allowed changes before implementing the loop.",
    "sections": [
      [
        "Desired state and repeatability",
        "Compare current state with desired state before writing, and make the equality rule explicit. Replacing a local configuration with the same validated bytes can converge; appending the same record repeatedly does not. Nondeterministic timestamps embedded in desired content can prevent a no-change result.",
        "Use a stable logical operation identifier when effects must be recorded once. A check-then-write can race across workers, so concurrent execution may require locking, transactions or provider-supported conditional updates. A local dictionary demonstration cannot prove distributed exactly-once execution."
      ],
      [
        "Detect change and preserve failures",
        "A dry run should report intended changes without performing them. The planning path and execution path should share validation rules so that dry-run success means the plan was valid within its stated scope, rather than merely bypassing all work.",
        "The fixture compares an owned local file with desired bytes, writes only when different and reports the second run unchanged. It demonstrates sequential convergence. It does not cover concurrent writers, crash recovery or external operations."
      ]
    ],
    "code": "from pathlib import Path\nimport tempfile\ndef converge(path, desired):\n    if path.exists() and path.read_text(encoding='utf-8') == desired:\n        return 'unchanged'\n    path.write_text(desired,encoding='utf-8')\n    return 'changed'\nwith tempfile.TemporaryDirectory() as work:\n    target=Path(work)/'settings.txt'\n    print(converge(target,'mode=dry\\n'))\n    print(converge(target,'mode=dry\\n'))",
    "expect": "changed\nunchanged",
    "practice": "A nightly script reconciles one report manifest against desired content and may run twice after a lost acknowledgment. What property should its repeated effect preserve?|Stable intended effect under repetition|Every retry creates another copy of the same intended record|Always appending records|Unlimited retries|Repeating the logical operation should not multiply its intended effect.\nWhich operation is generally not idempotent without deduplication?|Append the same event each run|Set a value to the same bytes|Ensure a directory exists|Read a fixed local file|Repeated appends create additional records.\nWhat should a dry run omit?|Actual mutations|Input validation|Planned changes|Scope reporting|A dry run calculates and reports changes without applying them.\nA job rewrites identical bytes every run. What comparison can reduce needless change?|Compare current and desired content|Compare only the target filename and ignore its contents|Ignore current content|Append a timestamp|A content comparison exposes a no-change state under the defined equality rule.\nTwo workers pass a missing-record check simultaneously. What is needed?|A concurrency-safe write condition|Perform another existence check immediately before the write|Another unchecked read|Only a random sleep|Separate checks and writes can race without an atomic coordination mechanism.\nA fixture converges sequentially. Which claim would exceed it?|Distributed exactly-once delivery|A second local run is unchanged|The target has desired bytes|The comparison returned equal|A sequential local example does not test distributed delivery or concurrency.",
    "final": "Which pattern expresses convergence?|Observe then reconcile toward desired state|Execute the write every time without comparing the existing resource|Generate a fresh identity each retry|Discard all existing content|Reconciliation compares reality with a defined target.\nWhy can inserting the current timestamp break a no-change check?|Changing content|Time disables Python|The file becomes encrypted|Timestamps force cloud access|Changing generated data prevents equality even when the logical configuration is stable.\nWhat is separate from sequential idempotency?|Concurrent update safety|A repeatable comparison|A stable intended effect|A no-change outcome|Concurrent workers introduce races not established by a sequential rerun.\nA scheduler retries an already successful import. Which design avoids duplicate rows?|A stable key with enforced uniqueness|Create a fresh operation key on every retry and append the row|Unconditional appends|Only a success message|A stable operation or record identity can support an atomic deduplication constraint.\nA dry run skips path validation and reports safe. What should change?|Shared validation|Apply changes during dry run|Remove all path checks|Trust the printed label|Dry-run output should be based on a valid scoped plan.\nAn operator wants to know why a rerun made no edits. What should the result include?|Unchanged result|A fabricated write count|Only elapsed time|An empty success response|No-change is a useful distinct outcome for reconciliation and review.\nA worker crashes after writing but before acknowledgment. What supports safe resumption?|Re-observe state using stable operation identity|Treat lack of acknowledgment as evidence that no write occurred|Always append again|Delete all previous outputs|Recovery must account for a possibly completed effect before acknowledgment.\nA file already matches desired bytes but has incorrect ownership. Is byte equality sufficient for an ownership task?|No|Yes, bytes encode all metadata|Yes if the filename is short|Only timestamps matter|The equality and reconciliation contract must include every required state dimension.\nA retry-safe API update is called with a different payload under the same key. What must be checked?|Conflict semantics|Only the request count|Only the DNS name|Only local stderr|Key reuse with changed content can be rejected or behave differently under the provider's semantics.\nThe example returns changed then unchanged. What remains a review item?|Concurrency and crash behavior|The second comparison result|The literal file content|The local return labels|The deterministic example validates one sequential convergence path, not broader reliability properties.",
    "mistakes": [
      "A preliminary existence check is not an atomic deduplication guarantee.",
      "Changing generated timestamps can defeat convergence."
    ],
    "takeaways": [
      "Define desired state and equality precisely.",
      "Treat unchanged as an intentional successful outcome."
    ],
    "problem": "Reconcile one owned local file twice.",
    "steps": [
      "Read current bytes when present.",
      "Write only when the desired text differs.",
      "Run again and verify unchanged."
    ],
    "limit": "Sequential local idempotency does not establish concurrency safety or distributed exactly-once processing."
  },
  {
    "comp": "m3.c1",
    "title": "Log useful outcomes without leaking sensitive data",
    "intro": "A finance operations script must explain partial failures without publishing customer details. Useful logs capture what happened, to which scoped operation and with what result. They should not turn every request payload into an unlimited diagnostic archive.",
    "sections": [
      [
        "Operational event design",
        "Record a stable operation identifier, safe resource label, stage, attempt, elapsed duration and outcome where they help investigation. Severity should reflect actionability: expected no-change need not be an error, while an exhausted required operation needs a clear failure signal.",
        "Structured logs give fields a consistent meaning for searching and aggregation. Correlation identifiers connect related events without requiring a raw customer payload. Avoid credentials, tokens and unnecessary personal data; retention and access controls are still needed for apparently harmless metadata."
      ],
      [
        "Test and redact at the boundary",
        "Redaction is easier when the logger accepts an allowlisted event schema. A blacklist that removes only one known password field may miss nested tokens or newly named secrets. Prefer excluding sensitive values before serialization rather than relying on downstream dashboards to hide them.",
        "The fixture serializes only explicitly selected fields from a synthetic event. It verifies that an excluded token is absent in the output. It does not configure a log collector, retention service or enterprise access policy."
      ]
    ],
    "code": "import json\nincoming={'operation':'sync-17','stage':'validate','outcome':'failed','token':'do-not-log','customer_email':'person@example.test'}\nallowed=('operation','stage','outcome')\nevent={key:incoming[key] for key in allowed}\nprint(json.dumps(event,sort_keys=True))\nprint('token' in event)",
    "expect": "{\"operation\": \"sync-17\", \"outcome\": \"failed\", \"stage\": \"validate\"}\nFalse",
    "practice": "What does a correlation identifier support?|Connecting related events|Authorizing every user|Encrypting the log store|Removing all retention needs|A shared safe identifier links observations across stages.\nWhich logging policy best limits accidental fields?|An allowlisted event schema|Serialize every input value|Log every authorization header|Trust arbitrary nested objects|Selecting permitted fields reduces exposure from unexpected input data.\nShould an expected unchanged outcome always be an error?|No|Yes under every policy|Only if it has an identifier|Only if logs are JSON|Severity should match operational meaning and actionability.\nA token appears in a diagnostic object. Where should exclusion happen?|Before serialization|Only in a public dashboard theme|After posting to an issue|Never for synthetic-looking strings|Keeping sensitive values out of emitted logs reduces downstream exposure.\nA failed batch needs investigation. Which fields help without raw records?|Operation, stage and outcome|All customer payloads|All API credentials|The full password database|Scoped metadata can explain progress without publishing sensitive contents.\nA redaction test removes only password but misses access_token. What is the weakness?|An incomplete blacklist|Excessive quoting|Too many attempt limits|Too little stdout|Field-name blacklists can miss new or nested sensitive values.",
    "final": "Which property makes structured logs easier to query?|Consistent named fields|Unbounded raw payloads|Random severity words|Different meaning per worker|A stable field schema supports filtering and aggregation.\nWhich data should generally be excluded from routine logs?|Authorization credentials|A safe stage label|A bounded outcome code|A nonsecret operation id|Authority-bearing credentials do not belong in ordinary diagnostic output.\nDoes JSON serialization enforce a privacy policy?|No|Yes for all keys|Only if sorted|Only if compact|Serialization encodes data; it does not decide whether that data should be disclosed.\nA finance sync fails after two completed stages. What log design supports reconstruction?|Correlated stages|Only a final generic error|A full database dump|An unrelated random id per line|Consistent identifiers and stage results expose the bounded workflow history.\nA script logs no-change as critical every minute. What should be reconsidered?|Severity policy|Only the font size|Only the process name|The JSON ordering|Alert-worthy severity should represent a condition requiring action rather than routine convergence.\nAn engineer removes tokens from a dashboard but leaves raw collector output. What remains?|Sensitive data in the logging pipeline|The collector automatically removes secrets when dashboard fields are hidden|A guaranteed deletion|Only a cosmetic issue|Presentation filtering does not remove values already emitted or retained upstream.\nA nested secret field is added to an incoming response. Which design reduces accidental logging?|Allowlist fields|Copy the whole response|Blacklist only password|Log unknown fields by default|An allowlist avoids automatically emitting newly introduced data.\nA support team wants latency evidence. Which field is useful without storing request bodies?|Bounded elapsed duration|Every card number|The raw authorization header|The complete session cookie|Timing can support diagnosis without persisting sensitive request content.\nThe local fixture excludes token. What remains unverified?|Collector retention and access policy|The emitted JSON field order proves the collector retention policy|The serialized result|The token membership check|A serialization test does not configure or verify a real logging service.\nAn operation id itself embeds a customer email address. What should review recognize?|Metadata can still identify people|Every identifier is anonymous|Only payloads contain personal data|Sorted JSON removes identity|Identifiers and labels require their own minimization and access policy.",
    "mistakes": [
      "Redacting only in the UI leaves upstream copies.",
      "Metadata can still contain personal information."
    ],
    "takeaways": [
      "Log bounded stages and outcomes with safe identifiers.",
      "Select safe fields before emitting an event."
    ],
    "problem": "Serialize an allowlisted synthetic event.",
    "steps": [
      "Create a synthetic input including sensitive-looking fields.",
      "Select only permitted diagnostic fields.",
      "Encode and check that the token key was excluded."
    ],
    "limit": "Only local field selection and serialization are verified; no collector, retention or access controls are configured."
  },
  {
    "comp": "m3.c1",
    "title": "Test failure paths and resume from checkpoints",
    "intro": "A scheduled report works on the happy path but loses progress when an intermediate input is malformed. Reliable automation tests missing inputs, child failure, timeouts and interrupted resumption alongside success. A checkpoint is evidence of verified progress, not a command to skip all earlier validation forever.",
    "sections": [
      [
        "Injectable boundaries",
        "Separate pure planning logic from filesystem, subprocess and network adapters. Tests can supply deterministic responses at those boundaries without touching production services. A fake proves how the caller responds to the supplied contract; it does not prove the real dependency follows that contract.",
        "Test assertions should cover outcomes and preserved state, including a failure that must prevent publication. Use temporary directories for file behavior and bounded local processes for subprocess contracts. Keep clocks and random behavior controllable when testing deadlines and retry ordering."
      ],
      [
        "Recover with exact evidence",
        "A resumable checkpoint should bind completed units to stable input identities or content hashes and record the state transition durably under the chosen storage contract. Reuse is justified only when the relevant inputs and tool version still match; otherwise recomputation may be necessary.",
        "The fixture computes a content hash and permits reuse only for an exact match. It then changes the input to demonstrate invalidation. It is a pure local model of resume eligibility, not a durable journal, crash-consistent transaction or exactly-once scheduler."
      ]
    ],
    "code": "import hashlib\ndef digest(text):\n    return hashlib.sha256(text.encode()).hexdigest()\ncheckpoint={'input_hash':digest('rows-v1'),'verified':True}\ndef reusable(text):\n    return checkpoint['verified'] and checkpoint['input_hash']==digest(text)\nprint(reusable('rows-v1'))\nprint(reusable('rows-v2'))",
    "expect": "True\nFalse",
    "practice": "What does a dependency fake establish?|Caller behavior under supplied responses|The production provider follows the same contract as the fake|Production credentials|Real network latency|The fake controls the dependency contract and tests the caller against that contract.\nWhy use temporary directories in file tests?|Isolate owned test artifacts|Mutate production files faster|Bypass all path validation|Guarantee host crash recovery|Temporary fixtures limit effects to disposable local data.\nWhat invalidates a content-bound checkpoint?|Changed relevant input|An unchanged hash|The same verified outcome|A repeated read|Resume eligibility depends on matching the inputs used for the recorded result.\nA required child fails in a test. What should be asserted?|Publication is prevented|Only a log line exists|Only the test duration|Only a function name|The meaningful failure contract includes stopping dependent effects.\nA retry test waits using real minutes. What improves determinism?|Inject a controllable clock and delay boundary|Use real wall-clock waits and random delays in every unit test|Contact a public API repeatedly|Use random unseeded sleeps|Controlled timing verifies policy without long or flaky real waits.\nA checkpoint says done but lacks input identity. What is missing?|Evidence that reuse matches current work|The worker identity proves the checkpoint applies to current input|Only another log format|Only the worker hostname|Completion alone cannot establish that the stored result applies to current inputs.",
    "final": "Which separation improves deterministic automation tests?|Boundary separation|All logic in one shell string|Only global mutable state|A live API for every branch|Boundary separation allows controlled outcomes without production effects.\nWhat is a useful failure-path assertion?|Required output remains unpublished|Only the returned error message matters even if output was published|The file extension is familiar|The code contains a try block|Tests should observe the intended behavior under failure rather than implementation decoration.\nWhat does an exact input hash support?|Reuse eligibility|Proving human approval|Encrypting all files|Preventing every race|A digest binds recorded results to specific content but does not supply other guarantees.\nA parser changes versions while input bytes stay fixed. What should the checkpoint policy consider?|Tool versions|Only the input filename|Only the previous worker id|Only wall-clock day|A changed interpretation can invalidate a result even when raw input matches.\nA test fake always returns success. Which risk remains?|Failure behavior is untested|Every branch is covered|Real integration is guaranteed|The API cannot time out|Success-only fixtures do not exercise failure, uncertainty or recovery contracts.\nA worker writes done before validating output. What must change?|Verify then record|Skip verification on every rerun|Delete the input hash|Always trust the done flag|A checkpoint should represent completed validated progress rather than an intended future action.\nA test invokes a real cloud deletion to check failure handling. Which boundary would suit this curriculum?|Fake boundary|A larger production account|An administrator token in source|A public host chosen randomly|The caller's response can be tested without mutating real infrastructure.\nA corrupted checkpoint is encountered during restart. What is appropriate?|Fail safely or recompute under an explicit policy|Trust the completion flag even when the remaining evidence is malformed|Publish stale output automatically|Ignore every validation field|Recovery must not treat malformed evidence as verified completion.\nThe fixture prints True then False. Which conclusion is supported?|Hash invalidation|The scheduler is crash safe|A journal was durably committed|A production report is correct|The model verifies only an exact-hash eligibility condition.\nA reviewer sees isolated tests and passing code but no external API exercise. What should be recorded?|Pending review|The API is fully certified|The course is published|The learner is job-ready|Local automated evidence has a defined scope and does not replace external or educational review.",
    "mistakes": [
      "A fake is not evidence of real provider behavior.",
      "A done flag without identity can reuse stale work."
    ],
    "takeaways": [
      "Test failure effects as well as successful return values.",
      "Bind resumable evidence to relevant content and versions."
    ],
    "problem": "Invalidate a local resume decision when content changes.",
    "steps": [
      "Hash the verified input.",
      "Compare a repeated input against checkpoint evidence.",
      "Change the input and verify reuse is rejected."
    ],
    "limit": "The hash model is not a durable scheduler or integration test; crash consistency and provider behavior remain explicit review limits."
  }
];
const refs=['subprocess','pathlib','os','logging','hashlib'].map(name=>ref('python-'+name,'python/cpython','42155a0feaca9ba6991942c323cbe9fb7278be3c','Doc/library/'+name+'.rst','Python 3.13 '+name+' official reference'));
refs.push({id:'bash-manual',title:'GNU Bash Reference Manual — external source retrieval pending',url:'https://www.gnu.org/software/bash/manual/bash.html',source:{kind:'unavailable-reference',retrieval_status:503,checked_at:'2026-11-10',verification:'Official manual URL. Retrieval of full and chapter HTTPS pages returned 503 on 2026-11-10; no captured official response or immutable revision is claimed. Real installed Bash examples execute locally; expert Bash source review remains blocked.'}});
const built=build('scripting-automation',data,refs);module.exports=built.course;Object.defineProperty(module.exports,'__bank',{value:built.bank,enumerable:false});
