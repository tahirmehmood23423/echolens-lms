'use strict';
const {bank}=require('../../learning/wave1/backend-helper');
module.exports=bank('backend-deployment-ops',[
  [
    "m1.c1",
    [
      [
        "E",
        "A backend recipe starts with FROM python:3.13-slim. What is being selected?",
        "Base image",
        "Running request",
        "Published host port",
        "Database snapshot",
        "FROM establishes the stage base.",
        "Requests occur at runtime.|Publication is separate.|Snapshots are data artifacts."
      ],
      [
        "E",
        "A team needs a default process for a new image. Which instruction is relevant?",
        "CMD",
        "EXPOSE alone",
        "COPY alone",
        "LABEL alone",
        "CMD supplies the image default command under runtime override rules.",
        "EXPOSE documents ports.|COPY transfers files.|LABEL stores metadata."
      ],
      [
        "M",
        "A Dockerfile installs dependencies after copying every changing source file. What cache issue can follow?",
        "Repeated installation",
        "Guaranteed faster builds",
        "Automatic lock updates",
        "Permanent cache immunity",
        "Source changes can invalidate subsequent dependency installation layers.",
        "Broad invalidation need not be faster.|Locks do not update themselves.|Cache keys depend on inputs."
      ],
      [
        "M",
        "A backend launches through a shell command string. What should the process review include?",
        "Signal handling",
        "README size",
        "SQL alias length",
        "DNS spelling",
        "Shell and process topology affect how termination reaches the service.",
        "Size does not determine signals.|Aliases are unrelated.|Names do not determine child handling."
      ],
      [
        "M",
        "A version tag resolves to new bytes next week. What should release records retain?",
        "Image digest",
        "tag color",
        "branch nickname",
        "support owner",
        "An immutable artifact identity supports traceability when tags move.",
        "Colors do not identify content.|Nicknames can move or be ambiguous.|Ownership is not byte identity."
      ],
      [
        "H",
        "A Python image runs as user 10001 but copied files are unreadable to that user. What failed?",
        "Runtime permissions",
        "HTTP idempotency",
        "Database isolation",
        "Request pagination",
        "The selected user must be able to read needed runtime files.",
        "Methods are separate.|Isolation is storage behavior.|Pagination does not grant file access."
      ],
      [
        "H",
        "The build cached an old dependency layer after a vulnerability notice. What is required?",
        "Dependency review",
        "Blind cache trust",
        "container restart",
        "tag renaming",
        "Caching saves work but does not replace a dependency update and rebuild policy.",
        "Cache reuse says nothing about vulnerability status.|Restart retains the same dependency bytes.|Names do not repair packages."
      ],
      [
        "H",
        "A copied dependency lock fixes Python packages but the base tag moves. Which input still varies?",
        "Base image bytes",
        "The lockfile text",
        "The source extension",
        "The route name",
        "Reproducibility depends on all relevant inputs including the base image.",
        "The lock can stay fixed.|Extensions do not identify the base.|Route names do not pin image content."
      ],
      [
        "H",
        "A recipe has an exec-form CMD. What remains necessary before claiming graceful shutdown?",
        "Runtime signal test",
        "JSON formatting",
        "image size check",
        "source linting",
        "Argument-vector form helps process behavior but actual termination and cleanup need verification.",
        "Formatting does not execute shutdown.|Size is unrelated.|Linting does not deliver signals."
      ],
      [
        "A",
        "A recipe builds from a pinned digest and lockfile but downloads an unverified script at build time. Which review is strongest?",
        "Review all inputs",
        "Trust the lock alone",
        "Trust the digest alone",
        "Ignore the script",
        "Every relevant build input needs an integrity and change policy.",
        "The lock does not cover arbitrary scripts.|The base digest does not cover later downloads.|The script changes executed content."
      ]
    ]
  ],
  [
    "m1.c1",
    [
      [
        "E",
        "A build directory contains .env with a private token. What should context preparation do?",
        "Exclude the secret",
        "Copy then rename it",
        "Publish it as metadata",
        "Append it to logs",
        "Unneeded secrets should not enter the build context.",
        "Renaming preserves sensitive content.|Metadata can expose it.|Logs spread it."
      ],
      [
        "E",
        "A builder compiles assets and the final stage needs only their output. Which Docker feature fits?",
        "Multi-stage build",
        "Port publication",
        "Database locking",
        "DNS delegation",
        "Stages can separate build tooling from selected runtime artifacts.",
        "Ports handle networking.|Locks coordinate storage.|DNS resolves names."
      ],
      [
        "M",
        "A build ARG carries a repository password. What should the author reconsider?",
        "Secret delivery",
        "argument spelling",
        "app route order",
        "image caption",
        "ARG is not a safe secret-storage mechanism; use supported scoped secret handling.",
        "Names do not protect values.|Routes are runtime behavior.|Captions do not control exposure."
      ],
      [
        "M",
        "A multi-stage build copies the entire builder filesystem. What benefit may be lost?",
        "Runtime minimization",
        "The existence of stages",
        "The ability to name files",
        "The Dockerfile syntax",
        "Broad copying can carry tools, caches and unwanted artifacts into the runtime.",
        "Stages still exist.|Files can still be named.|The recipe may remain syntactically valid."
      ],
      [
        "M",
        "A package tool writes its temporary credential to a cache copied into the final image. What needs inspection?",
        "Artifact contents",
        "stage names",
        "host port",
        "health URL",
        "Secret mount lifetime does not sanitize tool-generated artifacts.",
        "Names do not rewrite bytes.|Ports are separate.|Health paths do not inspect files."
      ],
      [
        "H",
        "A blacklist excludes TOKEN but misses PASSWORD in a generated file. What improves review?",
        "Context allowlisting",
        "More key aliases only",
        "Longer layer names",
        "Random file ordering",
        "An explicit minimal context policy reduces reliance on enumerating every possible secret name.",
        "Aliases can still miss unknown names.|Names do not filter data.|Ordering does not exclude files."
      ],
      [
        "H",
        "An engineer removes a compiler from the final stage and breaks a native extension. What was missed?",
        "Runtime libraries",
        "source comments",
        "request labels",
        "volume names",
        "Compiled extensions can need shared libraries even when the compiler is unnecessary.",
        "Comments do not provide libraries.|Labels are unrelated.|Volumes do not supply libraries automatically."
      ],
      [
        "H",
        "A build uses a secret mount. Which additional observation is needed?",
        "No secret outputs",
        "mount success",
        "stage count",
        "tag length",
        "Tools can still leak mounted data into logs or artifacts, so outputs need review.",
        "Mount success proves only delivery.|Count does not prove confidentiality.|Length is unrelated."
      ],
      [
        "H",
        "A .dockerignore model works for a toy list. What is needed for the actual build context?",
        "Real pattern test",
        "Python equality",
        "a text screenshot",
        "more toy files",
        "Docker matching and real directory structure need direct scoped verification.",
        "Equality does not implement matching.|Screenshots do not exercise behavior.|More invented inputs cannot prove actual context."
      ],
      [
        "A",
        "A build artifact embeds a credential, then the final stage uses a secret-free base. What is the best conclusion?",
        "Leak still possible",
        "Base scrubs outputs",
        "Stage boundary encrypts it",
        "Non-root removes it",
        "Embedded secret bytes can cross a selected artifact boundary into a clean base.",
        "The base does not sanitize copied content.|Stages do not encrypt content.|User choice does not erase bytes."
      ]
    ]
  ],
  [
    "m1.c2",
    [
      [
        "E",
        "An image is used to start three isolated API instances. What are those instances?",
        "Containers",
        "Source branches",
        "Volume backups",
        "DNS zones",
        "Containers are runtime instances of the packaged image.",
        "Branches version source.|Backups preserve data.|Zones serve DNS records."
      ],
      [
        "E",
        "An operator needs data to outlive one container. Which resource is relevant?",
        "Persistent volume",
        "writable layer",
        "EXPOSE",
        "image label",
        "A volume separates data lifetime from the container writable layer.",
        "The layer is tied to the instance.|EXPOSE is port metadata.|Labels do not persist application data."
      ],
      [
        "M",
        "A Dockerfile says EXPOSE 8000 and the host cannot connect. What should be checked?",
        "Port publication",
        "file extension",
        "Python variable case",
        "image author",
        "EXPOSE alone does not create a host-to-container mapping.",
        "Extensions do not publish ports.|Case is unrelated.|Authorship does not configure networking."
      ],
      [
        "M",
        "The service binds 127.0.0.1 inside its container. What can block forwarded traffic?",
        "Listener scope",
        "dependency names",
        "request count",
        "repository age",
        "A loopback-only listener may not accept traffic arriving on the container network interface.",
        "Names do not bind sockets.|Count does not define the interface.|Age is unrelated."
      ],
      [
        "M",
        "A container is replaced and its local upload directory disappears. What design was fragile?",
        "Writable-layer storage",
        "Immutable image identity",
        "Explicit port mapping",
        "Synthetic request ids",
        "Required durable uploads need an appropriate persistence policy beyond disposable instance storage.",
        "Image identity is useful.|Mapping is separate.|Ids do not determine persistence."
      ],
      [
        "H",
        "A volume survives replacement but a user deletes a file. Which capability is still needed?",
        "Restore procedure",
        "another restart",
        "new image tag",
        "larger host port",
        "Persistence does not provide recovery from deletion without backups or another recovery mechanism.",
        "Restarts do not restore removed bytes.|Tags select code.|Ports do not recover data."
      ],
      [
        "H",
        "Host port 8080 forwards to container port 8000. Which value should the app listen on internally?",
        "8000",
        "8080 always",
        "Either port randomly",
        "No listening port",
        "The forwarding destination must match the internal listener under the network contract.",
        "Host and container ports can differ.|Random selection breaks the mapping.|The service needs a listener."
      ],
      [
        "H",
        "A published port is reachable locally but not externally. What boundary may differ?",
        "Ingress policy",
        "CMD JSON",
        "module name",
        "requirements order",
        "Host binding, firewall and external routing can differ from local access.",
        "CMD syntax alone does not determine external policy.|Names are unrelated.|Order does not open firewalls."
      ],
      [
        "H",
        "An image is immutable but an instance writes temporary files. Where do ordinary writes go?",
        "Writable layer",
        "Original image layers",
        "Source repository",
        "Registry tag text",
        "Container runtime writes normally go to the instance layer or configured mounts.",
        "The source image is not rewritten.|The repository is separate.|Tag text is metadata."
      ],
      [
        "A",
        "A volume test preserves one file. Which recovery claim would exceed that result?",
        "Backup recoverability",
        "That file persisted",
        "The volume was mounted",
        "Replacement used the mount",
        "Retention in a volume does not verify restore after corruption or deletion.",
        "Those may be observed scope facts.|Mounting can be verified.|Reuse is narrower than backup recovery."
      ]
    ]
  ],
  [
    "m2.c1",
    [
      [
        "E",
        "A process reads TIMEOUT_S from its environment. What should it do before use?",
        "Parse and validate",
        "Assume safe numeric input",
        "Treat it as permission",
        "Return it to all users",
        "Environment values need explicit type and range handling.",
        "Text can be invalid.|Settings are not authorization.|Some settings may be sensitive."
      ],
      [
        "E",
        "A required API_TOKEN is absent at startup. What is a useful diagnostic?",
        "Missing setting name",
        "Raw token dump",
        "Full private config",
        "Customer payload log",
        "The name supports repair without exposing secret content.",
        "No token should be dumped.|Full config may contain other secrets.|Payloads are unnecessary."
      ],
      [
        "M",
        "An empty string bypasses a key-existence check for a required secret. What should validation include?",
        "Value validity",
        "key sorting",
        "letter case",
        "JSON whitespace",
        "Presence of a key is not enough when empty content violates the setting contract.",
        "Sorting does not validate content.|Case alone does not establish validity.|Whitespace formatting is unrelated."
      ],
      [
        "M",
        "A retry count parses as minus one. What must the configuration layer enforce?",
        "Allowed range",
        "integer syntax",
        "log timestamp",
        "process name",
        "A parsed integer can still be outside operational limits.",
        "Syntax already succeeded.|Timestamps do not constrain retries.|Names do not validate values."
      ],
      [
        "M",
        "Tests temporarily change os.environ and fail to restore it. What risk follows?",
        "Shared test leakage",
        "Automatic isolation",
        "Guaranteed encryption",
        "slower imports",
        "Other tests can inherit modified process configuration.",
        "Process globals need cleanup.|Environment use does not encrypt content.|Behavior can change beyond imports."
      ],
      [
        "H",
        "A process loads credentials once at startup. A store rotates them later. What must the plan address?",
        "Refresh lifecycle",
        "store value",
        "code comments",
        "image labels",
        "Consumers may retain old credentials until reload or restart under the application contract.",
        "Store update alone does not prove adoption.|Comments do not refresh memory.|Labels do not renew connections."
      ],
      [
        "H",
        "A secret is injected as environment text. What should not be inferred from that alone?",
        "Protected access",
        "A value is present",
        "A name was used",
        "Text reached a process",
        "Delivery mode alone does not prove confidentiality, authorization or rotation.",
        "Presence is narrower evidence.|Names are observable.|Receipt is separate from protection."
      ],
      [
        "H",
        "Two worker processes report different timeout settings after refresh. What needs coordination?",
        "Configuration rollout",
        "SQL aliases",
        "route naming",
        "static asset size",
        "Independent process snapshots need an explicit propagation/restart policy.",
        "Aliases do not distribute settings.|Names do not refresh memory.|Assets are separate."
      ],
      [
        "H",
        "A startup error includes the full database URL containing credentials. What should be changed?",
        "Safe error output",
        "timeout value",
        "module imports",
        "file permissions",
        "Configuration validation must avoid exposing secrets through exceptions and logs.",
        "Changing timeout does not redact URLs.|Imports do not sanitize errors.|Permissions alone do not remove emitted text."
      ],
      [
        "A",
        "A credential rotation updates the store and restarts half the workers. Which acceptance evidence is missing?",
        "Consumer transition",
        "store timestamp",
        "one new connection",
        "a deployment label",
        "Rotation must account for remaining workers and long-lived connections under its overlap/revocation policy.",
        "Time records do not prove adoption.|One connection misses other consumers.|Labels do not establish state."
      ]
    ]
  ],
  [
    "m2.c1",
    [
      [
        "E",
        "A support view should show only ENV and TIMEOUT_S. Which design fits?",
        "Explicit projection",
        "Dump all mappings",
        "Serialize all exceptions",
        "Return every header",
        "Selecting reviewed fields limits accidental disclosure.",
        "Mappings may include secrets.|Exceptions can include URLs.|Headers may contain credentials."
      ],
      [
        "E",
        "A redaction test needs a recognizable token. Which value is appropriate?",
        "Invented marker",
        "Live signing key",
        "Real password",
        "Customer session token",
        "Synthetic markers allow output checks without exposing credentials.",
        "Signing material must stay private.|Passwords must stay private.|Sessions must stay private."
      ],
      [
        "M",
        "A debug endpoint returns config.__dict__. What is the main review concern?",
        "Unreviewed disclosure",
        "response ordering",
        "route casing",
        "indentation",
        "Automatic object dumps can expose new or sensitive fields without review.",
        "Ordering does not remove secrets.|Case is unrelated.|Indentation does not filter data."
      ],
      [
        "M",
        "A safe log policy excludes TOKEN but permits arbitrary nested metadata. What needs inspection?",
        "Nested values",
        "top-level keys",
        "line count",
        "logger name",
        "Sensitive data can appear inside nested structures despite safe-looking top-level names.",
        "Top-level checks can miss embedded content.|Count does not establish safety.|Names do not sanitize payloads."
      ],
      [
        "M",
        "The success path redacts a URL but the exception path prints it raw. What coverage is missing?",
        "Failure output",
        "normal response",
        "startup banner",
        "source lint",
        "Tests must exercise error serialization as well as successful paths.",
        "Normal output already passed.|Banners do not cover exceptions.|Lint may not inspect runtime values."
      ],
      [
        "M",
        "An operator wants all headers in logs to debug one outage. What is safer under a reviewed policy?",
        "Selected safe fields",
        "All bearer tokens",
        "All session cookies",
        "All private payloads",
        "Choose bounded diagnostic fields that support the hypothesis without exposing credentials.",
        "Tokens enable access.|Cookies can enable access.|Private payloads are unnecessary by default."
      ],
      [
        "H",
        "Structured JSON logs include a password field. What is the best assessment?",
        "Format is insufficient",
        "JSON guarantees secrecy",
        "Collectors scrub all keys",
        "Passwords become hashes",
        "Serialization structure does not protect sensitive field content.",
        "JSON is not encryption.|Collector behavior needs evidence.|Printing does not hash data."
      ],
      [
        "H",
        "A blacklist is bypassed when DB_PASSWORD is renamed CREDENTIAL. What principle helps?",
        "Allow safe fields",
        "Use longer secrets only",
        "Add random casing",
        "Print twice for review",
        "A known-safe projection does not depend on anticipating every secret field name.",
        "Length does not stop disclosure.|Case does not enforce data flow.|Duplication spreads exposure."
      ],
      [
        "H",
        "A marker never appears in one captured log. Which claim is justified?",
        "That path excluded it",
        "Every sink is safe",
        "All traces are clean",
        "All crash dumps are safe",
        "The evidence is bounded to the exercised input and output path.",
        "Other sinks were not tested.|Trace exporters were not exercised.|Crash paths were not exercised."
      ],
      [
        "A",
        "A redaction library passes tests but a third-party SDK logs raw requests. What must the review cover?",
        "Complete output flow",
        "library version",
        "handler response",
        "field order",
        "Confidentiality depends on all emitters and sinks, including libraries and collectors.",
        "Version identity does not prove configuration.|Responses omit other logging paths.|Order does not remove content."
      ]
    ]
  ],
  [
    "m2.c2",
    [
      [
        "E",
        "Staging passed for image digest A. What should production promotion select under a build-once policy?",
        "Digest A",
        "Any latest tag",
        "A fresh random build",
        "An older unknown image",
        "Promotion should preserve the checked artifact identity.",
        "Tags can move.|A new build may differ.|Unknown artifacts lack the intended evidence."
      ],
      [
        "E",
        "Two environments need different provider endpoints. Where should that difference normally live?",
        "Environment config",
        "Embedded secret layer",
        "Customer database rows",
        "Source filename suffix",
        "Runtime settings can vary while the promoted artifact stays identical.",
        "Secret layers risk exposure.|Customer rows are unrelated.|Names do not configure runtime reliably."
      ],
      [
        "M",
        "A friendly release tag is reassigned to another image. Which record still identifies the tested bytes?",
        "Digest",
        "Tag wording alone",
        "Branch nickname",
        "Ticket priority",
        "A content digest supplies immutable artifact identity under the registry contract.",
        "Wording can remain while target changes.|Branches move.|Priority does not identify bytes."
      ],
      [
        "M",
        "A production rebuild downloads newer dependencies than staging. What risk follows?",
        "Untested artifact",
        "Identical verified bytes",
        "Automatic safer release",
        "Guaranteed compatibility",
        "The new build can differ from the artifact that passed checks.",
        "Dependency changes can change bytes.|Newer does not establish safety.|Compatibility needs evidence."
      ],
      [
        "M",
        "The same image uses a different secret and endpoint in production. What else should a release record identify?",
        "Config revision",
        "Raw secret text",
        "Every user record",
        "Developer screen size",
        "Configuration identity supports traceability without disclosing secret values.",
        "Values should be protected.|Private records are unnecessary.|Screen size is unrelated."
      ],
      [
        "M",
        "A staging check covers startup only. Which claim is too strong?",
        "Full production safety",
        "Staging process started",
        "That check completed",
        "The image was exercised",
        "Startup evidence does not prove workload, dependency and data behavior in production.",
        "Those are bounded observations.|Completion is historical.|Execution is narrower than safety."
      ],
      [
        "H",
        "A candidate has digest B while policy approved digest A. What should the gate do?",
        "Reject mismatch",
        "Relabel old evidence",
        "Ignore changed bytes",
        "Publish credentials",
        "A candidate mismatch violates the declared identity contract.",
        "Evidence must remain truthful.|Ignoring defeats the gate.|Credentials are unrelated."
      ],
      [
        "H",
        "A team promotes one image but runs a destructive migration between environments. What additional gate matters?",
        "Schema compatibility",
        "artifact equality",
        "tag spelling",
        "folder count",
        "The same application bytes can encounter incompatible schema/data state.",
        "Equality alone omits schema changes.|Spelling does not establish compatibility.|Folders are unrelated."
      ],
      [
        "H",
        "Staging reuses a real production credential to imitate realism. What should be reviewed?",
        "Environment isolation",
        "image size",
        "app title",
        "log color",
        "Credential scope and environment separation should fit the access policy.",
        "Size does not limit credential access.|Titles are unrelated.|Colors do not enforce scope."
      ],
      [
        "A",
        "A digest matches but provenance checks required by policy fail. Is identity alone sufficient for promotion?",
        "No, satisfy policy",
        "Yes, ignore provenance",
        "Yes, rename the tag",
        "Yes, delete test logs",
        "Artifact equality does not replace other required release gates such as integrity/provenance checks.",
        "Skipping gates violates the declared contract.|Names do not repair evidence.|Deleting evidence does not establish trust."
      ]
    ]
  ],
  [
    "m3.c1",
    [
      [
        "E",
        "A support engineer follows events using request_id r77. What does that field provide?",
        "Correlation",
        "Access permission",
        "Database lock",
        "Secret rotation",
        "The id connects events for diagnosis.",
        "Authorization is separate.|Locks coordinate state.|Rotation changes credentials."
      ],
      [
        "E",
        "A log needs the deployed code identity. Which field helps?",
        "Release digest",
        "User password",
        "Raw cookie",
        "Private body text",
        "Artifact identity links observations to a release without sensitive payloads.",
        "Passwords must stay private.|Cookies may grant access.|Bodies may contain private data."
      ],
      [
        "M",
        "An event list contains several requests. What should a request-level filter use?",
        "Matching id",
        "line length",
        "severity color",
        "filename",
        "A shared correlation value selects the intended request events.",
        "Length is not identity.|Color is presentation.|A file can hold many requests."
      ],
      [
        "M",
        "A service logs every body to investigate latency. What concern needs review?",
        "Sensitive payloads",
        "table spelling",
        "branch labels",
        "date formatting",
        "Bodies can contain private or credential data unnecessary for diagnosis.",
        "Spelling is unrelated.|Labels do not protect bodies.|Formatting does not redact content."
      ],
      [
        "M",
        "The last error line mentions a database timeout. What should diagnosis avoid?",
        "Premature certainty",
        "Checking dependencies",
        "Comparing release times",
        "Inspecting metrics",
        "One symptom does not prove the root cause without corroborating evidence.",
        "Dependency checks help.|Release correlation helps.|Metrics can test hypotheses."
      ],
      [
        "M",
        "A downstream event is missing from collection. Which explanation remains possible?",
        "Telemetry gap",
        "Certain no-call result",
        "Guaranteed client fault",
        "Certain data deletion",
        "Collection loss or sampling can hide a real event.",
        "Absence is not conclusive.|Fault attribution needs evidence.|Deletion is unsupported."
      ],
      [
        "H",
        "A caller supplies a correlation id. What must authorization still verify?",
        "Actor permissions",
        "the id length",
        "log presence",
        "trace color",
        "A correlation token is not proof of identity or permission.",
        "Length does not authorize.|Logs do not grant access.|Colors are unrelated."
      ],
      [
        "H",
        "Timestamps differ across hosts because clocks drift. What other evidence can help ordering?",
        "Span relationships",
        "alphabetic order",
        "endpoint length",
        "tag names",
        "Trace parent/child structure can add causal context beyond wall clocks.",
        "Alphabetic order is arbitrary.|Length is not time.|Names do not prove causality."
      ],
      [
        "H",
        "A green dashboard conflicts with one failed request report. What should be inspected?",
        "Request-level evidence",
        "fleet average",
        "page title",
        "repository count",
        "Aggregates can hide individual failures; correlation supports targeted investigation.",
        "Average alone can mask tails.|Titles do not explain failure.|Counts are unrelated."
      ],
      [
        "A",
        "A trace links three services but one library strips the propagated id. What is the strongest next step?",
        "Verify propagation path",
        "Assume no downstream work",
        "Invent missing events",
        "Treat id as a credential",
        "Instrumentation should test where context is lost and preserve evidence limits.",
        "Missing context is not proof of no work.|Invented data is not evidence.|Correlation is not authorization."
      ]
    ]
  ],
  [
    "m3.c1",
    [
      [
        "E",
        "Two errors occurred among one hundred requests. Which value is the error fraction?",
        "2 percent",
        "20 percent",
        "50 percent",
        "200 percent",
        "Two divided by one hundred is 0.02.",
        "Twenty percent would mean twenty errors.|Half would mean fifty errors.|Two hundred percent exceeds this count ratio."
      ],
      [
        "E",
        "Which measurement best exposes a small slow-request tail?",
        "Latency distribution",
        "code size",
        "process name",
        "host label",
        "The distribution can show slow observations hidden by a mean.",
        "Code size is not latency.|Names do not measure delays.|Labels are metadata."
      ],
      [
        "M",
        "Errors rise from ten to twenty while requests rise from one hundred to one thousand. What happened to the error fraction?",
        "It decreased",
        "It doubled",
        "It stayed equal",
        "It became unknowable",
        "The fraction changes from ten percent to two percent.",
        "Counts doubled but denominators changed more.|The ratios differ.|Both inputs are supplied."
      ],
      [
        "M",
        "An alert counts failures without a time window. What definition is missing?",
        "Measurement interval",
        "app name",
        "image author",
        "table prefix",
        "Rates and trends need an explicit time interval and population.",
        "Names do not define the interval.|Authorship is unrelated.|Prefixes do not define rates."
      ],
      [
        "M",
        "A mean latency stays low while p99 grows. What does that suggest?",
        "Tail degradation",
        "Every request is slow",
        "No latency issue",
        "Guaranteed data loss",
        "A small slow subset can change the tail while leaving the mean relatively low.",
        "The mean/tail combination does not imply all requests.|Tail behavior can still matter.|Loss is not established."
      ],
      [
        "M",
        "A pool queue grows after a release. Which metric adds useful context?",
        "Checkout wait",
        "source lines",
        "image caption",
        "route spelling",
        "Queue wait helps distinguish resource contention from execution time.",
        "Lines do not measure waiting.|Captions are unrelated.|Names do not measure latency."
      ],
      [
        "H",
        "An engineer averages ten instance p95 values to report fleet p95. What is the issue?",
        "Invalid aggregation",
        "Always exact result",
        "Required by HTTP",
        "Independent of samples",
        "Percentiles generally need compatible distribution aggregation, not averaging instance percentiles.",
        "Distribution shape matters.|HTTP does not prescribe this.|Samples determine percentiles."
      ],
      [
        "H",
        "Scaling API replicas increases database connection pressure. What should diagnosis consider?",
        "Shifted bottleneck",
        "Unlimited capacity",
        "Guaranteed lower latency",
        "Automatic lock removal",
        "Extra upstream concurrency can overload a downstream resource.",
        "Resources remain finite.|Latency may worsen.|More replicas do not remove locks."
      ],
      [
        "H",
        "A histogram uses different bucket layouts on different instances. What must aggregation review?",
        "Bucket compatibility",
        "metric name",
        "label color",
        "endpoint title",
        "Combined distribution arithmetic needs compatible measurement definitions and buckets.",
        "A shared name alone is insufficient.|Color is presentation.|Titles do not align buckets."
      ],
      [
        "A",
        "A low-traffic service has one failure in a one-minute window. Which alert review is most useful?",
        "Window and volume",
        "failure wording",
        "image tag size",
        "process nickname",
        "Small denominators make short-window proportions volatile; the policy must fit traffic and impact.",
        "Wording does not stabilize statistics.|Size is unrelated.|Names do not define alert quality."
      ]
    ]
  ],
  [
    "m3.c2",
    [
      [
        "E",
        "A rollback selects the previous tested image. What should identify that artifact?",
        "Immutable digest",
        "older tag length",
        "ticket number",
        "build date",
        "A concrete immutable identity supports selecting the intended previous artifact.",
        "Length is not identity.|Tickets are not image bytes.|Dates can include many builds."
      ],
      [
        "E",
        "A bad release already sent email. Can switching its image reverse delivery?",
        "No",
        "Always",
        "with Docker",
        "with a restart",
        "External effects need their own reconciliation; image selection does not unsend mail.",
        "Automatic reversal is not provided.|Docker does not reverse remote mail.|Restarting does not retract it."
      ],
      [
        "M",
        "The current schema dropped a column needed by the previous binary. What is the key rollback risk?",
        "Incompatibility",
        "slower logs",
        "longer tag",
        "name ordering",
        "Old code can fail against a schema missing its required representation.",
        "Logs do not restore schema.|Tag length is unrelated.|Ordering names does not change compatibility."
      ],
      [
        "M",
        "A rollback restores code but keeps an incompatible config revision. What must the plan include?",
        "Config compatibility",
        "source formatting",
        "cache label",
        "app caption",
        "The known-good behavior depends on suitable configuration as well as code bytes.",
        "Formatting does not select settings.|Labels do not restore configuration.|Captions are unrelated."
      ],
      [
        "M",
        "A rolled-back process is alive but cannot complete reads. What verification was insufficient?",
        "Liveness alone",
        "Representative checks",
        "Schema tests",
        "Dependency probes",
        "A live process does not establish useful request behavior.",
        "Representative checks would help.|Schema tests would help.|Dependency probes can add evidence."
      ],
      [
        "M",
        "A destructive migration removed historical data. What can code rollback fail to provide?",
        "Data restoration",
        "Previous source version",
        "A selected old image",
        "An earlier command",
        "Changing application bytes does not reconstruct removed data; recovery needs its own tested mechanism.",
        "Source may be available.|The image may be selected.|Commands can be recorded."
      ],
      [
        "H",
        "A feature flag stops new writes but old malformed records remain. What may still be needed?",
        "Data repair",
        "flag rename",
        "smaller image",
        "extra logging",
        "Stopping exposure does not repair already persisted invalid data.",
        "Names do not repair records.|Size is unrelated.|Logging provides evidence but not repair."
      ],
      [
        "H",
        "The error rate falls after rollback while traffic also collapses. What should recovery analysis include?",
        "Traffic context",
        "raw error count",
        "release nickname",
        "log color",
        "A changed denominator can explain lower error counts independently of recovery.",
        "Count alone can mislead.|Names do not measure behavior.|Colors are presentation."
      ],
      [
        "H",
        "A previous artifact cannot read schema 3 but another tested candidate can. What should candidate choice consider?",
        "Compatibility evidence",
        "age ranking",
        "image size",
        "tag alphabet",
        "Rollback candidates must fit current data/schema and the intended recovery contract.",
        "Older is not automatically compatible.|Size does not establish correctness.|Alphabetic order is arbitrary."
      ],
      [
        "A",
        "A rollback lowers errors but leaves duplicate external payments and missing audit evidence. What is the strongest assessment?",
        "Recovery incomplete",
        "Fully recovered now",
        "Delete all traces",
        "rename incident",
        "Operational recovery includes reconciling business effects and preserving sufficient evidence, not just one metric.",
        "Lower errors do not undo payments.|Evidence should be retained under policy.|Names do not repair state."
      ]
    ]
  ]
]);
