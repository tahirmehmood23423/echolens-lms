'use strict';
const {course}=require('./backend-helper');
const lessons=[
  {
    "id": "ops-recipe",
    "comp": "m1.c1",
    "title": "Write a reproducible backend image recipe",
    "before": "HTTP and Web Architecture is required. All fixtures are offline Python models or temporary local files; no container, deployment, cloud account or production service is mutated.",
    "intro": "A backend runs on a developer laptop because the working directory contains an unrecorded package and a local token. A useful Dockerfile records the runtime recipe while excluding secrets and unnecessary build inputs. Successful image construction is evidence about a build, not proof that the deployed API can serve traffic.",
    "sections": [
      [
        "Define the recipe and context",
        "A Dockerfile is an ordered image-build recipe. FROM chooses a base; WORKDIR establishes later working paths; COPY selects build-context content; RUN performs build-time commands; CMD supplies a default runtime command. Use a deliberate Python version and dependency lock strategy, and record the resulting image digest for promotion. A moving tag alone does not identify immutable bytes.",
        "For a Python service, copy dependency metadata before frequently changing application files when appropriate so dependency layers can be reused. Build cache is an optimization, not a reason to retain known vulnerable dependencies forever. The build context and .dockerignore determine which files can be sent to the builder; do not send local credentials merely because a later RUN deletes them."
      ],
      [
        "Review runtime ownership",
        "A representative recipe can use FROM python:3.13-slim, WORKDIR /app, COPY requirements.txt ., RUN python -m pip install --no-cache-dir -r requirements.txt, COPY app ./app, USER 10001, and CMD [\"python\", \"-m\", \"uvicorn\", \"app.main:app\", \"--host\", \"0.0.0.0\", \"--port\", \"8000\"]. Dependencies and writable paths must be compatible with that user. This is an illustrative recipe, not an executed build or a universal production baseline.",
        "Exec-form CMD supplies an argument vector without an implicit shell. The service still needs a signal/termination contract and suitable process management. The fixture serializes the intended runtime arguments; it does not execute Docker, install Uvicorn or establish that a particular app imports. A real isolated build and startup probe remain separate acceptance checks."
      ]
    ],
    "problem": "Construct an explicit runtime argument vector without shell interpolation.",
    "steps": [
      "Inspect the synthetic input and the stated operational contract.",
      "Run the isolated Python fixture.",
      "Compare its output with the contract and identify the untested deployment boundary."
    ],
    "code": "import json\ncommand = [\"python\", \"-m\", \"uvicorn\", \"app.main:app\", \"--host\", \"0.0.0.0\", \"--port\", \"8000\"]\nprint(json.dumps(command))\nprint(command[0] == \"python\" and command[-1] == \"8000\")",
    "expect": "[\"python\", \"-m\", \"uvicorn\", \"app.main:app\", \"--host\", \"0.0.0.0\", \"--port\", \"8000\"]\nTrue",
    "result": "The argument vector is explicit. No container build, signal delivery or network binding was tested.",
    "mistakes": [
      "A moving tag alone cannot identify immutable image bytes.",
      "A successful build does not prove application startup or graceful shutdown."
    ],
    "takeaways": [
      "Construct an explicit runtime argument vector without shell interpolation.",
      "The argument vector is explicit. No container build, signal delivery or network binding was tested."
    ],
    "refs": [
      "dockerfile",
      "best",
      "volumes",
      "logs",
      "python"
    ],
    "q": [
      [
        "E",
        "What does FROM choose in an image recipe?",
        "Base image",
        "Live user session",
        "Database backup",
        "Public hostname",
        "FROM establishes the base for the build stage.",
        "Sessions are runtime state.|Backups are separate artifacts.|DNS is separate configuration."
      ],
      [
        "E",
        "Which file limits the submitted build context?",
        ".dockerignore",
        "access.log",
        "server.pid",
        "README alone",
        "Docker uses .dockerignore patterns to exclude context entries.",
        "Logs do not filter context.|Pid files identify processes.|Prose alone does not enforce exclusion."
      ],
      [
        "M",
        "A token is copied in one layer and deleted later. What remains a concern?",
        "Earlier layer exposure",
        "Guaranteed secret removal",
        "Automatic credential rotation",
        "Encrypted source history",
        "Later deletion does not erase the secret from earlier image content.",
        "Deletion is not complete sanitization.|Rotation needs its own action.|History is not automatically encrypted."
      ],
      [
        "M",
        "Requirements rarely change but app files change daily. Which COPY order can improve reuse?",
        "Dependencies before app",
        "Everything before dependencies",
        "Token before requirements",
        "Random order each build",
        "Stable dependency inputs can keep dependency installation cached when application content changes.",
        "Broad early copies invalidate more cache.|Secrets must stay out.|Randomness reduces predictability."
      ],
      [
        "H",
        "A non-root runtime cannot write its cache directory. What should be reviewed?",
        "Path permissions",
        "Only image tag length",
        "Only HTTP method names",
        "Only database collation",
        "Runtime ownership and writable paths must fit the process user.",
        "Length does not grant filesystem rights.|Methods do not own paths.|Collation is unrelated."
      ],
      [
        "H",
        "An image builds successfully. Which claim still needs a separate check?",
        "Application startup",
        "Build completed",
        "Recipe parsed",
        "An image was emitted",
        "A successful build need not execute and verify the runtime service.",
        "These are build observations.|Parsing may already have occurred.|Image output is a build fact."
      ]
    ]
  },
  {
    "id": "ops-context",
    "comp": "m1.c1",
    "title": "Review layers and isolate build credentials",
    "before": "HTTP and Web Architecture is required. All fixtures are offline Python models or temporary local files; no container, deployment, cloud account or production service is mutated.",
    "intro": "A package repository needs a credential during dependency download. Baking that credential into ENV makes it available beyond the operation that needs it. Build inputs, build-only secrets and runtime settings have different lifetimes and should be reviewed separately.",
    "sections": [
      [
        "Keep build credentials ephemeral",
        "Use a supported build-secret mechanism when a build genuinely requires credentials, and ensure the invoked tool does not write them into an output artifact or log. ARG and ENV are not secret storage mechanisms. A multi-stage build can copy selected runtime artifacts from a builder, but it cannot magically sanitize secrets copied into those artifacts.",
        "A .dockerignore rule excluding .env and .git reduces accidental context exposure. Rules must be tested against the real directory layout and supported pattern semantics; a Python suffix filter is not an implementation of Docker pattern matching. Review package manager caches and generated files as well as tracked source files."
      ],
      [
        "Minimize the runtime surface deliberately",
        "Copy only needed runtime artifacts where the language/build system supports that separation. A smaller runtime may reduce unnecessary tools and dependencies, but size alone does not prove security. Verify the final image contents and required shared libraries; removing a build tool must not remove a library the service needs.",
        "The fixture performs an explicit allowlist projection over a synthetic file inventory. It illustrates the review boundary without reading repository secrets or claiming Docker matching semantics. Actual BuildKit secret mounts, layer inspection, vulnerability review and package downloads are outside this Python fixture."
      ]
    ],
    "problem": "Project a synthetic inventory into an explicit runtime allowlist.",
    "steps": [
      "Inspect the synthetic input and the stated operational contract.",
      "Run the isolated Python fixture.",
      "Compare its output with the contract and identify the untested deployment boundary."
    ],
    "code": "files = {\"app/main.py\": \"code\", \"requirements.txt\": \"deps\", \".env\": \"synthetic-secret\", \"tests/test_app.py\": \"test\"}\nallowed = {\"app/main.py\", \"requirements.txt\"}\nselected = sorted(path for path in files if path in allowed)\nprint(selected)\nprint(\".env\" not in selected)",
    "expect": "['app/main.py', 'requirements.txt']\nTrue",
    "result": "The selected inventory omits the synthetic secret. Docker ignore semantics and real layers were not executed.",
    "mistakes": [
      "Deleting a copied token in a later layer does not sanitize earlier layers.",
      "A clean final base cannot sanitize credentials embedded in copied artifacts."
    ],
    "takeaways": [
      "Project a synthetic inventory into an explicit runtime allowlist.",
      "The selected inventory omits the synthetic secret. Docker ignore semantics and real layers were not executed."
    ],
    "refs": [
      "dockerfile",
      "best",
      "volumes",
      "logs",
      "python"
    ],
    "q": [
      [
        "E",
        "Which build input should be excluded from a public image context?",
        "Local secret file",
        "Required source code",
        "Dependency metadata",
        "Public license text",
        "Local secrets should not be sent to a builder unnecessarily.",
        "The app may need source.|Metadata may be required.|Public licenses can be appropriate."
      ],
      [
        "E",
        "What is a multi-stage build designed to separate?",
        "Build and runtime stages",
        "Every customer account",
        "All network traffic",
        "Every database row",
        "Stages allow selected artifacts to move into a runtime image.",
        "Accounts need access controls.|Networking is separate.|Rows are not build stages."
      ],
      [
        "M",
        "A build-secret mount is used but the package tool prints its token. What remains unsafe?",
        "Build logs",
        "The mount syntax alone",
        "The stage name alone",
        "The source extension alone",
        "Secret handling includes tool output as well as delivery.",
        "Syntax does not erase logs.|Names do not control output.|Extensions do not redact data."
      ],
      [
        "M",
        "The final image is tiny. What still needs review?",
        "Required libraries",
        "Only the image label",
        "Only folder sorting",
        "Only editor settings",
        "A small image can still omit runtime dependencies or include unsafe ones.",
        "Labels do not prove dependency correctness.|Sorting is unrelated.|Editors are separate."
      ],
      [
        "H",
        "A builder copies a credential into the compiled output. Does a final-stage COPY sanitize it?",
        "No, inspect artifacts",
        "Yes, stages scrub bytes",
        "Yes, COPY encrypts it",
        "Yes, USER removes it",
        "Stage boundaries do not remove embedded secrets from selected artifacts.",
        "Stages do not scrub content.|COPY is not encryption.|User selection does not rewrite artifacts."
      ],
      [
        "H",
        "An allowlist model excludes .env. Which claim remains untested?",
        "Docker context matching",
        "The model selection",
        "The printed inventory",
        "The Python membership test",
        "A Python model does not implement or execute Docker pattern behavior.",
        "Those are local observations.|The inventory is printed.|Membership was executed."
      ]
    ]
  },
  {
    "id": "ops-runtime",
    "comp": "m1.c2",
    "title": "Separate images, containers, ports and volumes",
    "before": "HTTP and Web Architecture is required. All fixtures are offline Python models or temporary local files; no container, deployment, cloud account or production service is mutated.",
    "intro": "An operator restarts a disposable API container and discovers that uploaded files disappeared with its writable layer. The image, running container, published host port and persistent volume solve different problems. Understanding each boundary prevents accidental assumptions about persistence and reachability.",
    "sections": [
      [
        "Name the resources precisely",
        "An image is a packaged filesystem and configuration template. A container is an isolated running instance with its own writable layer and process lifecycle. Removing a container normally removes that writable layer; storing required durable data there without an external persistence policy risks loss. Containers share the host kernel under the runtime isolation model and are not equivalent to independent virtual machines.",
        "A volume provides data storage outside the container writable layer and can outlive a container. Persistence is not backup: accidental deletion or corrupt application writes can still affect the stored data. Backups need a defined recovery point, restore procedure and evidence that restored application data is usable."
      ],
      [
        "Trace the network path",
        "EXPOSE documents an intended container port but does not publish it on a host. A host-to-container port mapping controls publication; binding the service only to the container loopback interface can still make it unreachable through that path. Public ingress, host firewalls, reverse proxies and TLS termination each require their own explicit configuration.",
        "The fixture maps synthetic host ports to container ports and keeps a separate durable-data dictionary after discarding instance state. It is a naming and lifecycle model. It does not start namespaces, bind sockets, verify a Docker volume or establish that a service is publicly reachable."
      ]
    ],
    "problem": "Keep disposable process state separate from modeled persistent data.",
    "steps": [
      "Inspect the synthetic input and the stated operational contract.",
      "Run the isolated Python fixture.",
      "Compare its output with the contract and identify the untested deployment boundary."
    ],
    "code": "image = \"api@sha256:synthetic\"\ncontainer = {\"image\": image, \"cache\": \"temporary\"}\nvolume = {\"upload-1\": \"synthetic-content\"}\npublished = {8080: 8000}\ncontainer.clear()\nprint(published[8080])\nprint(volume[\"upload-1\"])\nprint(container)",
    "expect": "8000\nsynthetic-content\n{}",
    "result": "The model preserves its separate data dictionary. It provides no Docker persistence, backup or network evidence.",
    "mistakes": [
      "EXPOSE alone does not publish a host port.",
      "A persistent volume is not by itself a verified backup."
    ],
    "takeaways": [
      "Keep disposable process state separate from modeled persistent data.",
      "The model preserves its separate data dictionary. It provides no Docker persistence, backup or network evidence."
    ],
    "refs": [
      "dockerfile",
      "best",
      "volumes",
      "logs",
      "python"
    ],
    "q": [
      [
        "E",
        "What is a container relative to an image?",
        "Running instance",
        "Source-control branch",
        "Database transaction",
        "Certificate issuer",
        "A container instantiates an image with runtime state and a process lifecycle.",
        "Branches version source.|Transactions group changes.|Issuers manage certificates."
      ],
      [
        "E",
        "Does EXPOSE alone publish a host port?",
        "No",
        "Always",
        "Only for Python",
        "Only on weekends",
        "EXPOSE is metadata rather than host publication.",
        "Publication needs runtime networking configuration.|Language does not change that rule.|Time is irrelevant."
      ],
      [
        "M",
        "A required upload lives only in the writable layer. What lifecycle risk exists?",
        "Container removal loss",
        "Automatic offsite backup",
        "Guaranteed shared storage",
        "Permanent image mutation",
        "Removing the instance can remove its writable-layer data.",
        "Backups need explicit setup.|Sharing is not implied.|Runtime writes do not update the original image."
      ],
      [
        "M",
        "The app listens on container loopback only. What should be checked for host access?",
        "Listener binding",
        "Only package names",
        "Only SQL aliases",
        "Only the image author",
        "The binding address affects whether traffic from outside loopback can reach it.",
        "Names do not bind sockets.|Aliases are storage syntax.|Authorship is not reachability."
      ],
      [
        "H",
        "A named volume survives container replacement. What does that fail to prove?",
        "Recoverable backup",
        "Separate storage lifetime",
        "Replacement completed",
        "Data remained in that volume",
        "Persistence does not establish restoration after deletion or corruption.",
        "That is the observed lifecycle property.|Replacement can be observed.|Local retention is narrower than backup."
      ],
      [
        "H",
        "Two host ports map to one internal service port. Which values identify the application listener?",
        "Container port",
        "Only repository tag",
        "Only DNS label",
        "Only host username",
        "The application listens inside its network context; host mappings forward to that listener.",
        "Tags identify images.|DNS names resolve destinations.|Users do not identify the socket port."
      ],
      [
        "M",
        "A database uses a volume but no restore exercise exists. Which evidence is missing?",
        "Recovery verification",
        "Volume name spelling",
        "Container image caption",
        "Dependency file order",
        "A restore exercise checks whether preserved data can actually be recovered and used.",
        "Names do not test restoration.|Captions do not recover data.|Dependency order does not verify backups."
      ],
      [
        "H",
        "A service is reachable from the host but its public ingress is denied. What does the local probe establish?",
        "Host path only",
        "Global reachability",
        "Valid TLS everywhere",
        "All firewall paths",
        "A local connection verifies only the exercised network path.",
        "External routing may differ.|TLS endpoints need separate checks.|Other paths were not exercised."
      ]
    ]
  },
  {
    "id": "ops-config",
    "comp": "m2.c1",
    "title": "Validate configuration and protect runtime secrets",
    "before": "HTTP and Web Architecture is required. All fixtures are offline Python models or temporary local files; no container, deployment, cloud account or production service is mutated.",
    "intro": "A release accepts a missing timeout as zero and retries every failed dependency indefinitely. Environment delivery only transports text; the application must validate meaning and fail clearly when required settings are absent. Secret values also require access controls, rotation and redacted diagnostics.",
    "sections": [
      [
        "Parse once at the boundary",
        "Read environment settings during a deliberate startup/configuration phase. Distinguish required values from safe defaults, parse types explicitly and reject invalid ranges. A missing database credential should not silently choose a production-looking default. An explicit environment mapping in tests avoids altering shared process configuration.",
        "Keep secrets out of source, images, error responses and ordinary logs. Runtime injection from an approved secret system can reduce copying but does not itself prove encryption, authorization or rotation. Report a missing setting by name without printing its value. Treat configuration access as part of the service security boundary."
      ],
      [
        "Make invalid states visible",
        "Define whether a setting may change dynamically or only after restart. Multiple worker processes can retain different configuration snapshots if only one refreshes. For credentials, rotation needs an overlap/reload plan with bounded lifetimes and verification; changing a secret-store record alone does not prove every old connection stopped using it.",
        "The fixture validates a supplied dictionary and emits a stable error category for a zero timeout. It neither reads real environment variables nor contacts a secret manager. The successful case verifies the parser contract, while deployment injection and credential rotation need separate scoped evidence."
      ]
    ],
    "problem": "Reject an invalid timeout without exposing a synthetic credential.",
    "steps": [
      "Inspect the synthetic input and the stated operational contract.",
      "Run the isolated Python fixture.",
      "Compare its output with the contract and identify the untested deployment boundary."
    ],
    "code": "def load(env):\n    timeout = int(env.get(\"TIMEOUT_S\", \"5\"))\n    if not 1 <= timeout <= 30:\n        raise ValueError(\"invalid TIMEOUT_S\")\n    if not env.get(\"API_TOKEN\"):\n        raise ValueError(\"missing API_TOKEN\")\n    return timeout\nprint(load({\"API_TOKEN\": \"fixture-only\"}))\ntry:\n    load({\"TIMEOUT_S\": \"0\", \"API_TOKEN\": \"fixture-only\"})\nexcept ValueError as error:\n    print(error)",
    "expect": "5\ninvalid TIMEOUT_S",
    "result": "Only synthetic mapping parsing is tested. Secret injection, process refresh and cloud access are untested.",
    "mistakes": [
      "Parsing an integer without checking its allowed range can admit invalid settings.",
      "Updating a secret store does not prove every process adopted the new credential."
    ],
    "takeaways": [
      "Reject an invalid timeout without exposing a synthetic credential.",
      "Only synthetic mapping parsing is tested. Secret injection, process refresh and cloud access are untested."
    ],
    "refs": [
      "dockerfile",
      "best",
      "volumes",
      "logs",
      "python"
    ],
    "q": [
      [
        "E",
        "What type does environment delivery normally supply?",
        "Text",
        "Validated duration object",
        "Encrypted database row",
        "Trusted access decision",
        "Applications must parse environment strings into validated settings.",
        "Durations need explicit parsing.|Rows are separate.|Delivery is not authorization."
      ],
      [
        "E",
        "What should a missing-secret error identify?",
        "Setting name",
        "Entire secret value",
        "All request headers",
        "Private database records",
        "A name helps diagnosis without exposing sensitive content.",
        "Values should be protected.|Headers may contain credentials.|Records are unnecessary."
      ],
      [
        "M",
        "A timeout parses as zero but zero is forbidden. What validation is missing?",
        "Range validation",
        "Only string conversion",
        "Only variable naming",
        "Only log coloring",
        "Parsing a number does not establish that its value is operationally allowed.",
        "Conversion is already done.|Names do not constrain values.|Colors do not validate settings."
      ],
      [
        "M",
        "A secret store changes its value. What must rotation verify?",
        "Consumers refresh",
        "Every request gets admin",
        "Logs contain old tokens",
        "Images rebuild themselves",
        "Existing processes and connections may retain an older credential.",
        "Rotation must not grant excess rights.|Logging tokens creates exposure.|Store updates do not rebuild images."
      ],
      [
        "H",
        "One worker refreshes config but others retain old values. What should be reviewed?",
        "Process-wide rollout",
        "Only HTTP verbs",
        "Only SQL indentation",
        "Only repository licenses",
        "Configuration propagation must account for all active worker processes.",
        "Verbs do not refresh memory.|Indentation does not distribute state.|Licenses are unrelated."
      ],
      [
        "H",
        "A secret is supplied through an environment variable. Which claim needs separate evidence?",
        "Access protection",
        "The process received text",
        "The variable has a name",
        "The setting can be parsed",
        "The transport choice alone does not establish encryption, access control or rotation.",
        "Receipt is narrower.|Naming is observable.|Parsing is a local concern."
      ]
    ]
  },
  {
    "id": "ops-redaction",
    "comp": "m2.c1",
    "title": "Redact configuration diagnostics by construction",
    "before": "HTTP and Web Architecture is required. All fixtures are offline Python models or temporary local files; no container, deployment, cloud account or production service is mutated.",
    "intro": "A support endpoint dumps the entire configuration mapping to simplify incident response. That mapping includes signing material and a database URL with embedded credentials. Operational visibility should reveal safe state and validation categories without turning troubleshooting into credential distribution.",
    "sections": [
      [
        "Prefer a safe projection",
        "Build diagnostics from a reviewed allowlist of non-secret fields rather than print an arbitrary configuration object and hope a blacklist catches every key. Renaming a secret can bypass a key blacklist. URLs, exception strings and nested values may contain credentials even when their field names appear harmless.",
        "Expose whether required settings are present only if that information is appropriate for the endpoint audience. Restrict diagnostic access and avoid returning internal hostnames, full connection strings or private identifiers by default. Redaction is a data-flow property across logs, responses, traces and crash reports."
      ],
      [
        "Review the complete output path",
        "A structured logging library does not automatically remove secrets; application fields and exception serialization still need review. A test should exercise both expected and error paths with recognizable synthetic secret markers and inspect the actual captured output. Never insert a real credential merely to test redaction.",
        "The fixture selects only environment and timeout fields from a mapping containing a synthetic token. It tests this explicit projection, not every possible diagnostic path. Browser telemetry, infrastructure collectors, nested exception chains and third-party library logging remain separate review surfaces."
      ]
    ],
    "problem": "Emit only reviewed operational fields from a synthetic configuration.",
    "steps": [
      "Inspect the synthetic input and the stated operational contract.",
      "Run the isolated Python fixture.",
      "Compare its output with the contract and identify the untested deployment boundary."
    ],
    "code": "import json\nconfig = {\"ENV\": \"staging\", \"TIMEOUT_S\": 5, \"TOKEN\": \"SYNTHETIC_SECRET_MARKER\"}\nsafe = {key: config[key] for key in (\"ENV\", \"TIMEOUT_S\")}\noutput = json.dumps(safe, sort_keys=True)\nprint(output)\nprint(\"SYNTHETIC_SECRET_MARKER\" not in output)",
    "expect": "{\"ENV\": \"staging\", \"TIMEOUT_S\": 5}\nTrue",
    "result": "The explicit projection excludes this marker. It does not prove all logs or exception paths are redacted.",
    "mistakes": [
      "A blacklist can miss renamed or nested secrets.",
      "Structured logging does not automatically redact sensitive field values."
    ],
    "takeaways": [
      "Emit only reviewed operational fields from a synthetic configuration.",
      "The explicit projection excludes this marker. It does not prove all logs or exception paths are redacted."
    ],
    "refs": [
      "dockerfile",
      "best",
      "volumes",
      "logs",
      "python"
    ],
    "q": [
      [
        "E",
        "Which diagnostic design limits accidental field disclosure?",
        "Safe allowlist",
        "Dump every setting",
        "Print all headers",
        "Return full connection URLs",
        "An explicit allowlist exposes only reviewed diagnostic fields.",
        "Full dumps can reveal secrets.|Headers can contain credentials.|URLs can embed passwords."
      ],
      [
        "E",
        "Which token is appropriate for a redaction test?",
        "Synthetic marker",
        "Live production token",
        "Customer password",
        "Private signing key",
        "A recognizable invented marker supports safe output inspection.",
        "Real tokens create needless exposure.|Passwords must be protected.|Signing keys must stay private."
      ],
      [
        "M",
        "A secret key is renamed and bypasses a blacklist. What design improves robustness?",
        "Explicit projection",
        "Longer key names",
        "More secret logging",
        "Random capitalization",
        "Selecting known-safe fields avoids relying on every secret name being listed.",
        "Length does not enforce policy.|Logging secrets worsens exposure.|Case changes are not data-flow control."
      ],
      [
        "M",
        "A library emits a connection URL on failure. What path needs testing?",
        "Exception output",
        "Only success status",
        "Only HTML headings",
        "Only source filenames",
        "Error serialization can reveal embedded credentials.",
        "Success tests omit that path.|Headings do not capture logs.|Filenames do not redact exceptions."
      ],
      [
        "H",
        "Structured logs contain a raw Authorization field. What failed?",
        "Field selection",
        "JSON parsing alone",
        "Only request routing",
        "Only database sorting",
        "Structured format does not make a sensitive field safe to retain.",
        "Parsing can succeed while leaking.|Routing is separate.|Sorting is unrelated."
      ],
      [
        "H",
        "A projection test passes for one mapping. What is still outside its evidence?",
        "Other output paths",
        "The marker exclusion",
        "The selected keys",
        "The printed JSON",
        "One fixture does not prove third-party logs and nested exception handling are safe.",
        "These are observed local results.|The keys are explicit.|JSON output is captured."
      ]
    ]
  },
  {
    "id": "ops-promotion",
    "comp": "m2.c2",
    "title": "Promote the same artifact with environment-specific settings",
    "before": "HTTP and Web Architecture is required. All fixtures are offline Python models or temporary local files; no container, deployment, cloud account or production service is mutated.",
    "intro": "A team tests a staging image and then rebuilds from a moving branch for production. Even when the source appears unchanged, a dependency tag can resolve differently. Artifact identity and configuration identity must both be recorded so the tested result can be traced to the intended release.",
    "sections": [
      [
        "Separate build from promotion",
        "Build once under a recorded dependency and source policy, identify the artifact by digest, then promote that same artifact through the intended environments. Environment-specific endpoints, credentials and capacity belong in controlled runtime configuration. A tag can be useful for humans but can move; record immutable identity for audit and rollback decisions.",
        "Staging should exercise relevant behavior and compatibility, but it cannot establish identical production traffic, data distribution or external dependencies. Track what was checked, including startup, dependency access and migration compatibility, rather than equate the word staging with complete safety. Do not reuse production credentials merely to make staging look realistic."
      ],
      [
        "Gate changes with concrete evidence",
        "A release record can link source revision, artifact digest, configuration revision, schema compatibility and verification results. Promotion should reject an artifact that differs from the one checked under the release policy. Approval requirements and separation of duties depend on the organization; the fixture only models an identity gate and makes no deployment request.",
        "The Python example compares synthetic digest strings and rejects a candidate with different bytes under the declared contract. It does not validate an actual registry digest or signature. Registry permissions, provenance verification, rollout strategy and native runtime startup require separate integration evidence."
      ]
    ],
    "problem": "Reject promotion when the candidate artifact differs from the tested artifact.",
    "steps": [
      "Inspect the synthetic input and the stated operational contract.",
      "Run the isolated Python fixture.",
      "Compare its output with the contract and identify the untested deployment boundary."
    ],
    "code": "def promotable(tested, candidate):\n    return tested[\"digest\"] == candidate[\"digest\"] and tested[\"checks\"] == \"passed\"\ntested = {\"digest\": \"sha256:fixture-a\", \"checks\": \"passed\"}\nprint(promotable(tested, {\"digest\": \"sha256:fixture-a\"}))\nprint(promotable(tested, {\"digest\": \"sha256:fixture-b\"}))",
    "expect": "True\nFalse",
    "result": "This tests a synthetic identity policy. No registry, signature, environment promotion or deployment was accessed.",
    "mistakes": [
      "Rebuilding after staging can produce an artifact that was never tested.",
      "Matching image bytes do not guarantee matching production workload behavior."
    ],
    "takeaways": [
      "Reject promotion when the candidate artifact differs from the tested artifact.",
      "This tests a synthetic identity policy. No registry, signature, environment promotion or deployment was accessed."
    ],
    "refs": [
      "dockerfile",
      "best",
      "volumes",
      "logs",
      "python"
    ],
    "q": [
      [
        "E",
        "What should identify the exact promoted image bytes?",
        "Digest",
        "Moving branch name",
        "Developer nickname",
        "Support ticket title",
        "A content digest identifies the image artifact under the registry contract.",
        "Branches can move.|Nicknames do not identify bytes.|Titles are descriptive only."
      ],
      [
        "E",
        "Where should environment-specific service endpoints be selected?",
        "Runtime configuration",
        "Hardcoded secret layer",
        "Customer records",
        "A random build comment",
        "Configuration distinguishes deployment settings from the reusable artifact.",
        "Secret layers risk exposure.|Records are application data.|Comments do not configure a process."
      ],
      [
        "M",
        "Production rebuilds after staging passed. What evidence may no longer apply?",
        "Tested artifact identity",
        "The existence of staging",
        "The earlier test timestamp",
        "The source language",
        "A new build may produce different bytes and dependency resolution.",
        "Staging still existed.|The timestamp remains historical.|Language does not change the artifact mismatch."
      ],
      [
        "M",
        "A release record has only a friendly tag. What should be added?",
        "Immutable digest",
        "Raw credentials",
        "Every private record",
        "A random nickname",
        "Digest identity permits reliable tracing when tags move.",
        "Credentials must be protected.|Private data is unnecessary.|Nicknames do not identify content."
      ],
      [
        "H",
        "Staging used the same image. What remains production-specific?",
        "Workload behavior",
        "Image byte identity",
        "Recorded digest string",
        "The completed staging check",
        "Traffic, data and infrastructure can differ even with identical artifacts.",
        "Those bytes are held constant.|The record exists.|The check is historical evidence."
      ],
      [
        "H",
        "The candidate digest differs from the approved release. What should an identity gate do?",
        "Reject promotion",
        "Ignore the difference",
        "Rewrite test evidence",
        "Leak registry passwords",
        "The candidate does not match the checked artifact contract.",
        "Ignoring defeats the gate.|Evidence must remain truthful.|Secrets are unrelated."
      ],
      [
        "M",
        "A release manifest records source and digest but omits configuration. What can diagnosis miss?",
        "Setting differences",
        "The recorded source id",
        "The recorded image id",
        "The existence of a manifest",
        "Identical code bytes can behave differently under different configuration revisions.",
        "The source is already recorded.|The digest is already recorded.|The manifest exists."
      ],
      [
        "H",
        "A staging database is much smaller than production. What requires separate evidence?",
        "Production query behavior",
        "Staging startup result",
        "The chosen image digest",
        "The staging config name",
        "Data volume and distribution can change query plans and operational pressure.",
        "The startup observation remains valid.|Identity can stay the same.|Names do not prove workload behavior."
      ]
    ]
  },
  {
    "id": "ops-logs",
    "comp": "m3.c1",
    "title": "Diagnose failures with correlated structured logs",
    "before": "HTTP and Web Architecture is required. All fixtures are offline Python models or temporary local files; no container, deployment, cloud account or production service is mutated.",
    "intro": "A user reports that one request failed while the dashboard shows mostly successful traffic. A correlation id can connect request-level events without recording private payloads. Good diagnosis combines the event sequence, release identity and safe error categories rather than relying on the last line containing the word error.",
    "sections": [
      [
        "Record bounded diagnostic context",
        "Log timestamps, severity, event name, request/trace correlation id, release identity and safe outcome fields under a retention/access policy. A request id helps connect events; it is not an authentication token. Avoid unbounded user-controlled values and redact credentials or private payloads before they reach collection.",
        "Separate client-visible error messages from operator evidence. A safe external category can be linked to an internal event without exposing stack traces or database records. Structured fields support filtering, but correctness still depends on choosing meaningful events and collecting them reliably."
      ],
      [
        "Use logs to test hypotheses",
        "First identify the relevant time window and release, then follow the correlation id across service boundaries where propagation is supported. A missing downstream log can indicate a collection gap rather than prove no call happened. Compare logs with metrics/traces and dependency health before asserting a root cause.",
        "The fixture filters a fixed synthetic event list by request id and preserves order. It tests correlation selection only. It does not run a collector, synchronize clocks, propagate a trace across services or establish a real production cause. The example deliberately contains no real user content."
      ]
    ],
    "problem": "Follow one synthetic request through ordered safe log events.",
    "steps": [
      "Inspect the synthetic input and the stated operational contract.",
      "Run the isolated Python fixture.",
      "Compare its output with the contract and identify the untested deployment boundary."
    ],
    "code": "events = [{\"request_id\": \"r1\", \"event\": \"start\"}, {\"request_id\": \"r2\", \"event\": \"ok\"}, {\"request_id\": \"r1\", \"event\": \"dependency_timeout\"}]\nprint([event[\"event\"] for event in events if event[\"request_id\"] == \"r1\"])\nprint(all(\"token\" not in event for event in events))",
    "expect": "['start', 'dependency_timeout']\nTrue",
    "result": "The fixture selects correlated events. It does not verify collection completeness or determine a production root cause.",
    "mistakes": [
      "A missing downstream event does not prove no call happened.",
      "A correlation id must not be treated as an authentication credential."
    ],
    "takeaways": [
      "Follow one synthetic request through ordered safe log events.",
      "The fixture selects correlated events. It does not verify collection completeness or determine a production root cause."
    ],
    "refs": [
      "dockerfile",
      "best",
      "volumes",
      "logs",
      "python"
    ],
    "q": [
      [
        "E",
        "What links events from one request?",
        "Correlation id",
        "Only line length",
        "Only folder name",
        "Only page color",
        "A propagated correlation identifier helps join relevant events.",
        "Length is not identity.|Folders do not join requests.|Colors are presentation."
      ],
      [
        "E",
        "Should a request id grant authentication?",
        "No",
        "Always",
        "Only for errors",
        "Only in staging",
        "Correlation and authorization have different purposes.",
        "Ids can be caller-observable.|Errors do not grant access.|Staging still needs policy."
      ],
      [
        "M",
        "A log line contains a raw bearer token. What should change?",
        "Redact the field",
        "Increase retention",
        "Copy it to alerts",
        "Add more replicas",
        "Sensitive fields should be excluded before collection.",
        "Long retention increases exposure.|Alerts spread the token.|Replicas do not sanitize fields."
      ],
      [
        "M",
        "One downstream log is absent. What should diagnosis consider?",
        "Collection gaps",
        "Certain absence of a call",
        "Guaranteed client fault",
        "Automatic database corruption",
        "Missing telemetry does not prove the underlying event never happened.",
        "That inference is too strong.|Fault needs evidence.|Corruption is unsupported."
      ],
      [
        "H",
        "Events cross several services with skewed clocks. What improves interpretation?",
        "Trace context",
        "Only alphabetical sorting",
        "Only status label color",
        "Only branch names",
        "Trace/span relationships can supplement timestamps and correlation during diagnosis.",
        "Alphabetic order is not causal.|Color is presentation.|Branches do not establish event order."
      ],
      [
        "H",
        "A log filter finds a timeout event. Which conclusion exceeds the fixture?",
        "Production root cause",
        "A matching event exists",
        "The id was selected",
        "The list contains a timeout",
        "The fixed data does not establish what caused a real incident.",
        "These are observed fixture facts.|Selection was executed.|The event text is present."
      ]
    ]
  },
  {
    "id": "ops-metrics",
    "comp": "m3.c1",
    "title": "Interpret rates, latency and saturation together",
    "before": "HTTP and Web Architecture is required. All fixtures are offline Python models or temporary local files; no container, deployment, cloud account or production service is mutated.",
    "intro": "The average latency is stable while a small group of requests takes several seconds. A mean can hide a tail, and an error count can rise simply because traffic increased. Operational metrics need definitions, denominators and a time window before they can support a release decision.",
    "sections": [
      [
        "Choose interpretable signals",
        "Track request rate, error rate, latency distributions and saturation for resources such as worker queues or connection pools. Define which requests count as errors and which endpoints/time window are included. A rate needs a denominator; 20 failures among 100 requests differs from 20 among a million.",
        "A percentile describes a distribution under the measurement method, not a guarantee for every future request. Aggregating percentiles by averaging their values across instances is generally invalid; use compatible histograms or another justified aggregation. Low traffic can make short-window estimates unstable."
      ],
      [
        "Connect symptoms to bounded hypotheses",
        "A growing queue with high resource utilization can support a saturation hypothesis, but no single metric proves the bottleneck. Compare before/after release under comparable load and inspect dependencies. Increasing replicas may shift pressure to a database or provider instead of removing the cause.",
        "The fixture computes an error fraction and nearest-rank p95 from a tiny explicit list. This arithmetic is deterministic, but the list is not a production histogram or load test. It provides no throughput, alert quality or service-level objective evidence beyond the stated calculation."
      ]
    ],
    "problem": "Calculate a defined error fraction and a nearest-rank tail statistic.",
    "steps": [
      "Inspect the synthetic input and the stated operational contract.",
      "Run the isolated Python fixture.",
      "Compare its output with the contract and identify the untested deployment boundary."
    ],
    "code": "import math\nlatencies = sorted([10, 11, 12, 13, 14, 15, 16, 17, 18, 900])\np95 = latencies[math.ceil(0.95 * len(latencies)) - 1]\nfailures, requests = 2, 100\nprint(f\"{failures / requests:.2%}\")\nprint(p95)",
    "expect": "2.00%\n900",
    "result": "Only arithmetic over a tiny fixed sample is verified. No native service, traffic replay or alert effectiveness was tested.",
    "mistakes": [
      "Error counts without request volume can mislead diagnosis.",
      "Averaging instance percentiles does not generally yield a fleet percentile."
    ],
    "takeaways": [
      "Calculate a defined error fraction and a nearest-rank tail statistic.",
      "Only arithmetic over a tiny fixed sample is verified. No native service, traffic replay or alert effectiveness was tested."
    ],
    "refs": [
      "dockerfile",
      "best",
      "volumes",
      "logs",
      "python"
    ],
    "q": [
      [
        "E",
        "What denominator is needed for a request error fraction?",
        "Total requests",
        "Only image size",
        "Only file count",
        "Only process id",
        "Failures divided by total requests defines the selected request error fraction.",
        "Bytes are not requests.|Files are unrelated.|Pid is identity."
      ],
      [
        "E",
        "Which signal helps reveal slow-tail behavior?",
        "Latency distribution",
        "Only mean source length",
        "Only route spelling",
        "Only image author",
        "A distribution exposes tail behavior hidden by a mean.",
        "Source length is not response time.|Names do not measure delays.|Authorship is unrelated."
      ],
      [
        "M",
        "Failures double while traffic increases tenfold. What should be compared?",
        "Error fraction",
        "Only failure count",
        "Only repository size",
        "Only uptime text",
        "The denominator changes the interpretation of failures.",
        "Counts omit traffic context.|Repository size is unrelated.|Uptime text is insufficient."
      ],
      [
        "M",
        "A queue grows while workers stay busy. What hypothesis deserves testing?",
        "Saturation",
        "Guaranteed data loss",
        "Certain DNS failure",
        "Automatic secret rotation",
        "Queue growth and utilization can suggest resource pressure but need further evidence.",
        "Loss is not established.|DNS needs its own evidence.|Rotation is unrelated."
      ],
      [
        "H",
        "Can instance p95 values generally be averaged into fleet p95?",
        "No",
        "Always",
        "Only if names match",
        "Only on weekdays",
        "Percentiles are not generally composable by averaging; compatible distribution data is needed.",
        "Averages lose distribution shape.|Names do not change statistics.|Time of week is irrelevant."
      ],
      [
        "H",
        "A ten-row sample reports p95 of 900. What does that fail to establish?",
        "Future latency guarantee",
        "This calculation result",
        "The sample ordering",
        "The chosen rank rule",
        "A fixed sample statistic does not guarantee future request performance.",
        "Those are local arithmetic facts.|Sorting was executed.|The rule is explicit."
      ]
    ]
  },
  {
    "id": "ops-rollback",
    "comp": "m3.c2",
    "title": "Roll back with artifact and schema compatibility checks",
    "before": "HTTP and Web Architecture is required. All fixtures are offline Python models or temporary local files; no container, deployment, cloud account or production service is mutated.",
    "intro": "A new release returns errors after accepting writes in a changed format. Restoring the previous image may stop the immediate regression, but that binary may be unable to read the new rows. Rollback is a planned compatibility operation with verification, not merely selecting a smaller version number.",
    "sections": [
      [
        "Define rollback preconditions",
        "Keep the previous known-good artifact identity and configuration revision accessible under the release process. Check whether the previous binary can read the current schema and data, whether migrations were additive or destructive, and whether external effects need reconciliation. A code rollback cannot unsend mail or automatically restore a deleted database column.",
        "Prefer compatible expansion before destructive contraction when rolling versions overlap. Feature flags may reduce exposure when designed and tested, but they are not automatic data repair. Define who can execute rollback and which observations distinguish recovery from an unrelated traffic change. No live rollback is performed in this course."
      ],
      [
        "Verify recovery and preserve evidence",
        "A rollback decision can use error/latency changes, readiness and dependency behavior under an explicit time window. After the action, verify the intended artifact, configuration and representative safe operations. Retain incident evidence and reconcile any partially completed work; a green process alone does not prove business recovery.",
        "The fixture models a compatibility gate using a declared set of supported schema versions. It rejects a prior artifact that cannot read the current schema. The set is synthetic evidence supplied by the author, not discovered compatibility. Native rollback, restored backups and real migration behavior require separate tests."
      ]
    ],
    "problem": "Gate a rollback candidate against declared schema compatibility.",
    "steps": [
      "Inspect the synthetic input and the stated operational contract.",
      "Run the isolated Python fixture.",
      "Compare its output with the contract and identify the untested deployment boundary."
    ],
    "code": "candidates = {\"old\": {1}, \"compatible\": {1, 2}}\ncurrent_schema = 2\nfor release in (\"old\", \"compatible\"):\n    print(release, current_schema in candidates[release])",
    "expect": "old False\ncompatible True",
    "result": "The declared compatibility gate is checked. No migration, data restoration, traffic shift or deployment occurred.",
    "mistakes": [
      "Rolling back code does not recreate dropped data or reverse external effects.",
      "A live process alone does not establish business recovery."
    ],
    "takeaways": [
      "Gate a rollback candidate against declared schema compatibility.",
      "The declared compatibility gate is checked. No migration, data restoration, traffic shift or deployment occurred."
    ],
    "refs": [
      "dockerfile",
      "best",
      "volumes",
      "logs",
      "python"
    ],
    "q": [
      [
        "E",
        "What should a rollback identify precisely?",
        "Previous artifact",
        "Only shorter tag text",
        "Only older ticket number",
        "Only build duration",
        "Rollback needs a concrete known artifact and associated configuration.",
        "Tag length does not identify bytes.|Tickets are not artifacts.|Duration does not select a release."
      ],
      [
        "E",
        "Can a code rollback automatically unsend email?",
        "No",
        "Always",
        "Only with Python",
        "Only before midnight",
        "External effects require their own reconciliation policy.",
        "Code selection does not reverse remote delivery.|Language does not change this.|Clock time is irrelevant."
      ],
      [
        "M",
        "An old binary needs a column that was dropped. What blocks a simple rollback?",
        "Schema incompatibility",
        "Only log ordering",
        "Only hostname length",
        "Only source formatting",
        "The older code may fail against the current schema.",
        "Ordering does not restore columns.|Names do not provide compatibility.|Formatting is unrelated."
      ],
      [
        "M",
        "The process restarts cleanly after rollback. What still needs verification?",
        "Representative behavior",
        "Only image author name",
        "Only editor theme",
        "Only folder alphabetization",
        "Startup alone does not establish request or business recovery.",
        "Authorship is not behavior.|Themes are irrelevant.|Sorting folders does not verify service."
      ],
      [
        "H",
        "A release changed external payment state before failure. What additional work may be needed?",
        "Reconciliation",
        "Only artifact renaming",
        "Only deleting logs",
        "Only smaller replicas",
        "External effects can remain after the local code version changes.",
        "Names do not undo effects.|Logs are evidence to retain.|Replica size does not reconcile payments."
      ],
      [
        "H",
        "A compatibility model accepts schema 2 for a candidate. What must be independently established?",
        "Real compatibility",
        "Set membership result",
        "Current input value",
        "The candidate label",
        "A supplied set encodes an assumption; integration tests must verify the real code/data contract.",
        "Membership was executed.|The input is explicit.|The label is present."
      ],
      [
        "M",
        "A prior release artifact was deleted from the registry. What operational readiness failed?",
        "Rollback availability",
        "Image label formatting",
        "Log indentation",
        "Route naming",
        "A recovery plan needs accessible known artifacts under its retention policy.",
        "Formatting does not preserve images.|Indentation is unrelated.|Names do not provide artifacts."
      ],
      [
        "H",
        "After rollback, the old image runs but queued tasks use the new payload format. What needs checking?",
        "Worker compatibility",
        "Only web liveness",
        "Only image tags",
        "Only CPU idle time",
        "Asynchronous workers and queued message formats are part of the recovery compatibility boundary.",
        "Liveness omits task semantics.|Tags do not prove payload compatibility.|Idle CPU can coexist with failure."
      ]
    ]
  }
];
const refs=[
  {
    "id": "dockerfile",
    "title": "Docker documentation: dockerfile",
    "url": "https://github.com/docker/docs/blob/b5b96e5d051a84d6077467f928b3f4ca06e8cc2e/content/manuals/build/concepts/dockerfile.md",
    "source": {
      "repo": "docker/docs",
      "commit": "b5b96e5d051a84d6077467f928b3f4ca06e8cc2e",
      "path": "content/manuals/build/concepts/dockerfile.md",
      "verification": "Pinned official documentation. Original offline Python models; no container build or deployment executed."
    }
  },
  {
    "id": "best",
    "title": "Docker documentation: best",
    "url": "https://github.com/docker/docs/blob/b5b96e5d051a84d6077467f928b3f4ca06e8cc2e/content/manuals/build/building/best-practices.md",
    "source": {
      "repo": "docker/docs",
      "commit": "b5b96e5d051a84d6077467f928b3f4ca06e8cc2e",
      "path": "content/manuals/build/building/best-practices.md",
      "verification": "Pinned official documentation. Original offline Python models; no container build or deployment executed."
    }
  },
  {
    "id": "volumes",
    "title": "Docker documentation: volumes",
    "url": "https://github.com/docker/docs/blob/b5b96e5d051a84d6077467f928b3f4ca06e8cc2e/content/manuals/engine/storage/volumes.md",
    "source": {
      "repo": "docker/docs",
      "commit": "b5b96e5d051a84d6077467f928b3f4ca06e8cc2e",
      "path": "content/manuals/engine/storage/volumes.md",
      "verification": "Pinned official documentation. Original offline Python models; no container build or deployment executed."
    }
  },
  {
    "id": "logs",
    "title": "Docker documentation: logs",
    "url": "https://github.com/docker/docs/blob/b5b96e5d051a84d6077467f928b3f4ca06e8cc2e/content/manuals/engine/logging/_index.md",
    "source": {
      "repo": "docker/docs",
      "commit": "b5b96e5d051a84d6077467f928b3f4ca06e8cc2e",
      "path": "content/manuals/engine/logging/_index.md",
      "verification": "Pinned official documentation. Original offline Python models; no container build or deployment executed."
    }
  },
  {
    "id": "python",
    "title": "Python 3.13: configuration mappings and environment",
    "url": "https://github.com/python/cpython/blob/42155a0feaca9ba6991942c323cbe9fb7278be3c/Doc/library/os.rst",
    "source": {
      "repo": "python/cpython",
      "commit": "42155a0feaca9ba6991942c323cbe9fb7278be3c",
      "path": "Doc/library/os.rst",
      "verification": "Pinned official source; only synthetic mapping fixtures are executed."
    }
  }
];
module.exports=course('backend-deployment-ops',lessons,refs);
