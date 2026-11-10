'use strict';
const {build,pythonRef}=require('./infra-wave2-helper');
const data=[
  {
    "comp": "m1.c1",
    "title": "Separate image artifacts from container runtime state",
    "intro": "An API team confuses its reproducible image with files written by yesterday\u2019s running container. Start by identifying which state belongs to an artifact and which requires an explicit persistence plan.",
    "headings": [
      "Reason about the mechanism",
      "Apply the decision and inspect evidence",
      "Bound the verification"
    ],
    "sections": [
      [
        "An image is a packaged filesystem and execution configuration used to create containers. A container is a runtime instance with its own writable layer above image content. Multiple containers can originate from the same image without sharing their writable layers. Recreating a container therefore does not recover data kept only in its old writable layer.",
        "A Dockerfile describes build instructions. FROM selects a base, COPY adds build-context content, RUN executes build-time operations, and CMD supplies default runtime command arguments. Build-time RUN does not keep a server running in the resulting image; the runtime command starts a new process when the container starts."
      ],
      [
        "For a Python service, a schematic sequence is FROM python:3.13-slim, WORKDIR /app, COPY requirements.txt ., RUN python -m pip install --no-cache-dir -r requirements.txt, COPY . ., and CMD [\"python\", \"app.py\"]. Each instruction occupies its own Dockerfile line. Pin and review dependencies and the base digest for a controlled release; this sketch does not claim the mutable tag is immutable.",
        "An image digest identifies content, while a tag is a movable reference. Record the artifact digest that passed testing and promote that artifact. A clean image build is necessary evidence of a usable artifact, but runtime readiness and persistence require separate tests."
      ],
      [
        "The synthetic identifiers model artifact identity and isolated writable state. They are not valid registry digests and no Docker daemon, image, or process is created."
      ]
    ],
    "code": "import json\na=json.loads('{\"image\":\"sha256:abc\",\"container\":\"api-1\",\"writable\":[\"/tmp/cache\"]}')\nb={\"image\":a[\"image\"],\"container\":\"api-2\",\"writable\":[]}\nprint(a[\"image\"] == b[\"image\"])\nprint(b[\"writable\"])",
    "expect": "True\n[]",
    "problem": "Evaluate the local fixture for separate image artifacts from container runtime state.",
    "steps": [
      "Read the declared inputs and assumptions.",
      "Run the isolated Python fixture and compare its exact output.",
      "Explain which production evidence remains necessary."
    ],
    "limit": "The synthetic identifiers model artifact identity and isolated writable state. They are not valid registry digests and no Docker daemon, image, or process is created.",
    "mistakes": [
      "Treating a tag as immutable evidence.",
      "Keeping durable business records only in a container writable layer."
    ],
    "takeaways": [
      "Separate build artifacts from runtime instances.",
      "Promote the tested digest and explicitly locate persistent state."
    ],
    "practice": [
      [
        "What does a Docker image supply when a container is created?",
        "Filesystem and runtime defaults",
        "An already running server process",
        "A complete host operating system",
        "A durable shared application volume",
        "The image is an artifact used to instantiate runtime processes."
      ],
      [
        "Which Dockerfile instruction executes a build-time command?",
        "RUN",
        "CMD",
        "EXPOSE",
        "LABEL",
        "RUN executes during the build; CMD defines a runtime default."
      ],
      [
        "What is a container writable layer?",
        "Container-local filesystem changes",
        "A persistent shared registry layer",
        "A reusable host directory backup",
        "An immutable image manifest entry",
        "Writes in that layer belong to that container instance."
      ],
      [
        "Which identifier is appropriate for recording the exact tested image?",
        "The resolved content digest",
        "The currently assigned image tag",
        "The container\u2019s configured name",
        "The Dockerfile\u2019s filesystem path",
        "Digests identify content while tags can be reassigned."
      ],
      [
        "Which instruction copies selected context files into an image?",
        "COPY",
        "EXPOSE",
        "USER",
        "HEALTHCHECK",
        "COPY transfers files from the build context or a specified stage."
      ],
      [
        "What does CMD normally define?",
        "A default process and its arguments",
        "A process run at image build time",
        "A host-level process supervisor",
        "An automatically published endpoint",
        "CMD is execution configuration used at container start."
      ]
    ],
    "final": [
      [
        "A service team rebuilds from latest after approving yesterday\u2019s artifact. What evidence is missing?",
        "The rebuilt content may differ",
        "The old tag cannot be moved",
        "The old container determines CMD",
        "The Dockerfile is read at startup",
        "A mutable tag and another build can resolve to different content."
      ],
      [
        "A worker writes invoices inside its container and is recreated. What design should preserve invoices?",
        "Managed persistent storage",
        "A new container writable layer",
        "A new immutable image label",
        "A stable container display name",
        "The new runtime layer does not contain the old instance\u2019s writes."
      ],
      [
        "Two containers use the same image. One edits /app/config. What follows by default?",
        "Only that instance sees the edit",
        "Every peer inherits the edit",
        "The image digest changes in place",
        "The registry stores runtime edits",
        "Writable layers isolate instance changes unless shared mounts change the situation."
      ],
      [
        "A Dockerfile uses RUN python server.py and the server never exits. What is the build error in reasoning?",
        "Start the server at runtime",
        "Run it in every build instruction",
        "Keep the builder alive in production",
        "Use EXPOSE to start the process",
        "RUN must complete to produce the build step; runtime services start separately."
      ],
      [
        "A release log records only api:production. What improves reproducibility?",
        "The resolved artifact digest",
        "The current container uptime",
        "The deployment host\u2019s directory",
        "The latest assigned display tag",
        "A tag can move and does not uniquely record the approved content."
      ],
      [
        "A developer commits a container\u2019s temporary edit as the release process. What is the maintainability concern?",
        "A reviewable build recipe is missing",
        "The source tree updates automatically",
        "Commit always regenerates a Dockerfile",
        "Writable layers provide signed history",
        "A declarative reviewed recipe supports repeatable artifact production."
      ],
      [
        "A container exits after its main process completes. Which conclusion is justified?",
        "Its configured process ended",
        "Its source image was removed",
        "Its registry layers expired",
        "Its private kernel shut down",
        "A container lifecycle follows its main process, independently of image existence."
      ],
      [
        "An operator changes CMD in a Dockerfile but runs the old digest. What behavior should be expected?",
        "The old image keeps its configuration",
        "Docker rereads the local Dockerfile",
        "The old digest receives the new CMD",
        "Runtime startup rebuilds the image",
        "Dockerfile edits require producing and selecting a new artifact."
      ],
      [
        "A team tests one image and rebuilds separately for production. What weakens its assurance?",
        "Rebuilding may change the content",
        "Digest promotion disables runtime bugs",
        "Different hosts cannot use one digest",
        "Build caches establish artifact identity",
        "Building once and promoting the same content closes the artifact identity gap."
      ]
    ]
  },
  {
    "comp": "m1.c1",
    "title": "Order Dockerfile inputs for useful cache reuse",
    "intro": "A small application edit causes dependency downloads on every build. Model the dependency graph before trying to make builds faster.",
    "headings": [
      "Reason about the mechanism",
      "Apply the decision and inspect evidence",
      "Bound the verification"
    ],
    "sections": [
      [
        "Build cache reuse depends on instruction inputs and the state inherited from earlier instructions. COPY inputs changing invalidates that step and dependent steps. Put stable dependency manifests before frequently edited application source when the dependency install does not need the source tree.",
        "A common order is COPY requirements.txt ., RUN python -m pip install -r requirements.txt, then COPY src/ ./src/. Copying the entire repository before installing dependencies makes unrelated source edits affect dependency installation. Docker may still need network access or revalidation; a cache is an optimization, not a correctness guarantee."
      ],
      [
        "Use .dockerignore to exclude unnecessary context such as .git, local caches, test outputs and secrets. Ignore rules reduce accidental context exposure and needless input changes. They do not replace secret management or justify putting credentials in another build instruction.",
        "BuildKit cache mounts such as RUN --mount=type=cache,target=/root/.cache/pip python -m pip install -r requirements.txt retain package-manager downloads across builds without baking that cache into the result. Dependency locking and integrity checks remain necessary. A clean-cache build must still produce a valid artifact."
      ],
      [
        "This is a simplified sequential dependency model, not Docker\u2019s cache implementation. Actual cache keys, network behavior and BuildKit mounts must be checked with a real controlled build."
      ]
    ],
    "code": "import json\nchanged=set(json.loads('[\"src/api.py\"]'))\ninputs=[{\"requirements.txt\"},{\"requirements.txt\"},{\"src/api.py\"}]\ndirty=False\nfor group in inputs:\n dirty=dirty or bool(group & changed)\n print(\"rebuild\" if dirty else \"reuse\")",
    "expect": "reuse\nreuse\nrebuild",
    "problem": "Evaluate the local fixture for order dockerfile inputs for useful cache reuse.",
    "steps": [
      "Read the declared inputs and assumptions.",
      "Run the isolated Python fixture and compare its exact output.",
      "Explain which production evidence remains necessary."
    ],
    "limit": "This is a simplified sequential dependency model, not Docker\u2019s cache implementation. Actual cache keys, network behavior and BuildKit mounts must be checked with a real controlled build.",
    "mistakes": [
      "Copying all source before dependency installation without need.",
      "Assuming a cache hit proves dependencies are current or trustworthy."
    ],
    "takeaways": [
      "Place stable independent inputs early.",
      "Require builds to work with empty caches."
    ],
    "practice": [
      [
        "Why copy a dependency manifest before frequently edited source?",
        "Preserve independent cache reuse",
        "Prevent every network request",
        "Guarantee dependency integrity",
        "Eliminate dependency refreshes",
        "Source edits need not invalidate installation whose inputs are unchanged."
      ],
      [
        "What is .dockerignore used for?",
        "Exclude unnecessary context files",
        "Exclude files from runtime volumes",
        "Filter registry package downloads",
        "Authorize access to source secrets",
        "Context exclusions reduce irrelevant or sensitive build inputs."
      ],
      [
        "What should a correct build tolerate?",
        "A clean build with empty caches",
        "An undeclared cached dependency",
        "A developer\u2019s populated home folder",
        "A previously authenticated container",
        "Caches improve speed but should not supply required undeclared inputs."
      ],
      [
        "What does a cache mount primarily retain?",
        "Reusable package download data",
        "The service\u2019s production data",
        "The final stage\u2019s required files",
        "The deployment approval record",
        "Cache mounts optimize build work without being runtime persistence."
      ],
      [
        "Which change can invalidate a COPY step?",
        "A relevant build input changes",
        "The image\u2019s runtime uptime changes",
        "The host\u2019s display name changes",
        "The running service logs a request",
        "Cache checks consider the instruction\u2019s inputs."
      ],
      [
        "What complements caching for dependency control?",
        "Reviewed locks and integrity checks",
        "Only a persistent download cache",
        "Only a floating dependency range",
        "Only a previous successful build",
        "Cache reuse does not establish dependency correctness."
      ]
    ],
    "final": [
      [
        "A developer changes only src/api.py after manifests were copied and installed. Which ordering avoids needless installation invalidation?",
        "Manifest then install then source",
        "Source then install then manifest",
        "All files then dependency install",
        "Credentials then all source files",
        "Dependency work can precede unrelated source inputs."
      ],
      [
        "A build works only when a cache contains an undeclared wheel. What should the team fix?",
        "Declare the missing dependency",
        "Keep the warm cache mandatory",
        "Skip clean builds permanently",
        "Treat the cache as the lockfile",
        "The artifact must not rely on unexplained residual state."
      ],
      [
        "A .git directory frequently changes and is unnecessary for compilation. What is a useful context change?",
        "Exclude unused .git context",
        "Copy .git before dependencies",
        "Mount .git into the runtime app",
        "Add .git to an application layer",
        "Excluding unused context reduces transfer and invalidation risk."
      ],
      [
        "A cached dependency step hides a newly disclosed vulnerability. What response addresses the actual risk?",
        "Update and validate dependencies",
        "Trust cached packages indefinitely",
        "Only rename the runtime container",
        "Extend the old cache retention",
        "Freshness and security require dependency management beyond cache hits."
      ],
      [
        "A Dockerfile copies a secret token then deletes it later. What is wrong with relying on that deletion?",
        "Earlier layers can retain secrets",
        "Later deletion rotates the token",
        "A new layer encrypts old layers",
        "Final ls proves no secret remains",
        "Secrets must not be added to image layers in the first place."
      ],
      [
        "A team uses a pip cache mount. Which assumption remains necessary?",
        "Verify declared installation inputs",
        "Treat cached downloads as reviewed",
        "Use the cache as runtime storage",
        "Skip dependency integrity checks",
        "Caching package downloads does not replace verification."
      ],
      [
        "A build is slow transferring gigabytes of test artifacts. What should be examined first?",
        "Unnecessary build context content",
        "A missing published service port",
        "A runtime command quoting issue",
        "An insufficient restart interval",
        "Unnecessary context transfer is distinct from runtime configuration."
      ],
      [
        "A source edit invalidates all later stages of a simple sequential build. Which dependency rule explains it?",
        "Later steps inherit changed state",
        "Every cache hit rewrites the base",
        "Container logs always enter COPY",
        "Labels randomly invalidate RUN",
        "Dependent steps cannot reuse state based on different earlier content."
      ],
      [
        "A developer proposes removing dependency pins to improve cache hits. Which review response is sound?",
        "Keep pins and optimize input order",
        "Drop pins because caches lock inputs",
        "Replace manifests with cached files",
        "Use floating versions for integrity",
        "Performance work should preserve controlled dependency resolution."
      ]
    ]
  },
  {
    "comp": "m1.c1",
    "title": "Use multi-stage builds to separate build tools from runtime",
    "intro": "A service needs a compiler to build a native dependency but should not ship a compiler to production. Separate stages by artifact responsibilities.",
    "headings": [
      "Reason about the mechanism",
      "Apply the decision and inspect evidence",
      "Bound the verification"
    ],
    "sections": [
      [
        "Each FROM starts a stage with its own base and filesystem. Give stages names, for example FROM python:3.13-slim AS builder, and copy only required outputs into a later runtime stage with COPY --from=builder /wheels /wheels. Intermediate build tools do not automatically appear in the final stage.",
        "The runtime still needs every library and file required to execute those artifacts. A wheel containing native code may rely on shared libraries and ABI compatibility. A tiny image that cannot load its dependencies is not a successful optimization. Select compatible build and runtime bases and verify actual execution."
      ],
      [
        "Construct a builder stage that produces reviewed wheel files, then install those files in the final stage with an appropriate no-index workflow and remove temporary installation inputs if unnecessary. Separate the dependency lock, build environment and runtime dependency evidence so failures are diagnosable.",
        "Named stages and explicit copy paths make the artifact boundary reviewable. Avoid copying an entire builder root filesystem, which defeats the separation. Multi-stage builds reduce unnecessary shipped tools but do not by themselves establish non-root execution, vulnerability freedom or software provenance."
      ],
      [
        "Set selection illustrates a stage boundary. It does not build wheels, inspect ABI compatibility, or prove that a runtime image starts."
      ]
    ],
    "code": "import json\nbuilder=set(json.loads('[\"compiler\",\"wheel\",\"source\"]'))\nselected={\"wheel\"}\nruntime={\"python\",\"runtime-library\"}|(builder & selected)\nprint(\",\".join(sorted(runtime)))\nprint(\"compiler\" in runtime)",
    "expect": "python,runtime-library,wheel\nFalse",
    "problem": "Evaluate the local fixture for use multi-stage builds to separate build tools from runtime.",
    "steps": [
      "Read the declared inputs and assumptions.",
      "Run the isolated Python fixture and compare its exact output.",
      "Explain which production evidence remains necessary."
    ],
    "limit": "Set selection illustrates a stage boundary. It does not build wheels, inspect ABI compatibility, or prove that a runtime image starts.",
    "mistakes": [
      "Copying all builder files into the runtime stage.",
      "Assuming a copied native artifact has no external runtime libraries."
    ],
    "takeaways": [
      "Copy named outputs across explicit stages.",
      "Verify runtime compatibility after reducing shipped tools."
    ],
    "practice": [
      [
        "Which Dockerfile instruction starts another build stage?",
        "FROM",
        "EXPOSE",
        "LABEL",
        "STOPSIGNAL",
        "A new FROM establishes a stage with its own base."
      ],
      [
        "How can a later stage select files from a named builder?",
        "COPY --from=builder",
        "RUN --network=builder",
        "CMD --stage=builder",
        "USER --copy=builder",
        "COPY can take its source from another stage."
      ],
      [
        "What belongs in a runtime stage?",
        "Required artifacts and libraries",
        "All compiler caches and headers",
        "Every source and build credential",
        "The entire builder filesystem",
        "Runtime contents follow execution requirements."
      ],
      [
        "Why name a build stage?",
        "Stable readable stage references",
        "Automatic runtime root access",
        "Automatic registry publication",
        "Mandatory disabling of caches",
        "Names document the source of copied artifacts."
      ],
      [
        "What risk applies to native wheels?",
        "Runtime ABI and library mismatch",
        "Automatic bundling of every library",
        "An unnecessary interpreter dependency",
        "An automatic kernel replacement",
        "Native binaries depend on compatible runtime interfaces."
      ],
      [
        "What does multi-stage separation alone not prove?",
        "A vulnerability-free runtime",
        "An independently based stage",
        "A named cross-stage file source",
        "A final image without compilers",
        "Security requires additional evidence beyond artifact separation."
      ]
    ],
    "final": [
      [
        "A builder compiles a library against a newer system ABI than production has. What is the likely remedy?",
        "Align runtime ABI and test loading",
        "Copy only the artifact\u2019s README",
        "Rename the build stage to secure",
        "Declare its port with EXPOSE",
        "Artifact compatibility depends on its runtime interfaces."
      ],
      [
        "A reviewer sees COPY --from=builder / / in the runtime stage. What concern is justified?",
        "It imports unnecessary build content",
        "It guarantees minimum image size",
        "It verifies the software provenance",
        "It makes the root filesystem readonly",
        "Broad copying defeats a narrowly reviewed artifact boundary."
      ],
      [
        "A team removes the compiler from production and the app still starts. What claim is supported?",
        "That tested path needs no compiler",
        "Every runtime path is secure",
        "All architectures are supported",
        "No dependency needs future updates",
        "Runtime testing supports the exercised path, not universal security claims."
      ],
      [
        "A project has several numbered stages and inserts a new first stage. What improves maintainability?",
        "Use meaningful stage names",
        "Preserve numeric positions manually",
        "Copy every stage into the final one",
        "Remove all intermediate FROM lines",
        "Names reduce accidental reference drift when stages are rearranged."
      ],
      [
        "An image shrinks but crashes importing a native module. Which evidence matters next?",
        "Inspect loader and library errors",
        "Compare only compressed image sizes",
        "Increase the published port count",
        "Shorten the runtime stage name",
        "Minimality must preserve runtime requirements."
      ],
      [
        "A build token is needed to fetch a private package. Where should it enter the process?",
        "Use a controlled build secret",
        "Copy credentials into production",
        "Store credentials in image labels",
        "Commit the feed token with the lock",
        "Build secrets should not become image contents or public metadata."
      ],
      [
        "A reviewer asks whether a builder stage is automatically the release artifact. What is accurate?",
        "The selected target sets the output",
        "Every stage is always published",
        "The oldest stage is always selected",
        "All stages become one process",
        "The build target and final stage selection determine the output."
      ],
      [
        "A team copies a wheel without pinning dependency inputs. Which assurance is still missing?",
        "Controlled artifact provenance",
        "A valid name for the builder stage",
        "A syntactically valid COPY source",
        "An explicit removal of the compiler",
        "Stage separation does not define trustworthy dependency resolution."
      ],
      [
        "A production stage contains only Python and wheels but runs as root. What is the right conclusion?",
        "Review runtime privilege separately",
        "Trust automatic non-root selection",
        "Rely on wheel metadata for identity",
        "Assume removing compilers drops root",
        "USER and runtime security settings require explicit review."
      ]
    ]
  },
  {
    "comp": "m2.c1",
    "title": "Publish ports and resolve names on container networks",
    "intro": "An API listens correctly inside its container but a laptop cannot reach it. Separate process binding, container networking and host publication.",
    "headings": [
      "Reason about the mechanism",
      "Apply the decision and inspect evidence",
      "Bound the verification"
    ],
    "sections": [
      [
        "A process bound only to 127.0.0.1 inside a container accepts loopback traffic in that container\u2019s network namespace. For access through a published container interface, the service commonly listens on 0.0.0.0 at the intended container port. This is a process setting, separate from the host interface selected for publication.",
        "Docker CLI syntax -p 127.0.0.1:8080:8000 publishes host loopback port 8080 to container port 8000. Omitting a host address commonly publishes on all host interfaces, subject to engine behavior and host networking. EXPOSE documents intended ports but does not publish them by itself."
      ],
      [
        "On a user-defined bridge network, containers can resolve peers by configured network names. An API talking to a database service uses that service name and its container port, not localhost and not necessarily the host-published port. localhost inside the API refers to the API container itself.",
        "Publish only the externally required endpoints. A database used only by peer services need not have a host port mapping. Diagnose each boundary with process listening evidence, attached network configuration, name resolution and intended traffic paths; host firewall assumptions require real host inspection."
      ],
      [
        "This fixture parses declared publication metadata only. It does not create sockets, configure firewall rules or establish engine-specific network exposure."
      ]
    ],
    "code": "import json\np=json.loads('{\"host_ip\":\"127.0.0.1\",\"host_port\":8080,\"container_port\":8000}')\nprint(str(p[\"host_port\"])+\" -> \"+str(p[\"container_port\"]))\nprint(p[\"host_ip\"] == \"127.0.0.1\")",
    "expect": "8080 -> 8000\nTrue",
    "problem": "Evaluate the local fixture for publish ports and resolve names on container networks.",
    "steps": [
      "Read the declared inputs and assumptions.",
      "Run the isolated Python fixture and compare its exact output.",
      "Explain which production evidence remains necessary."
    ],
    "limit": "This fixture parses declared publication metadata only. It does not create sockets, configure firewall rules or establish engine-specific network exposure.",
    "mistakes": [
      "Using localhost to reach another container.",
      "Assuming EXPOSE publishes a host port."
    ],
    "takeaways": [
      "Trace process binding and publication separately.",
      "Use service names and container ports for peer traffic."
    ],
    "practice": [
      [
        "What does EXPOSE do by itself?",
        "Document intended service ports",
        "Publish selected host listeners",
        "Authorize incoming client requests",
        "Allocate public DNS service names",
        "EXPOSE is image metadata rather than a host port mapping."
      ],
      [
        "Inside an API container what does localhost refer to?",
        "Its own network namespace",
        "Its default database peer",
        "Its deployment host namespace",
        "Its shared registry endpoint",
        "Loopback is local to the namespace."
      ],
      [
        "In -p 8080:8000 which port is the container destination?",
        "8000",
        "8080",
        "Both are host-side listeners",
        "Neither is a destination port",
        "The host mapping forwards to the right-hand container port."
      ],
      [
        "What commonly enables peer name resolution on a bridge?",
        "A shared user-defined network",
        "Identical image tag references",
        "Equal container startup times",
        "Matching EXPOSE declarations",
        "User-defined bridge networking provides service-name resolution capabilities."
      ],
      [
        "Which publication narrows host binding to loopback?",
        "127.0.0.1:8080:8000",
        "0.0.0.0:8080:8000",
        "8080:8000 without an address",
        "EXPOSE 8000 without publication",
        "The explicit host loopback address narrows the selected host listener."
      ],
      [
        "Why might a service listening only on container loopback be unreachable through publication?",
        "Its process binds the wrong interface",
        "The host and container ports differ",
        "The image lacks a human-readable tag",
        "The service lacks persistent storage",
        "Process binding must match the intended network path."
      ]
    ],
    "final": [
      [
        "An API connects to localhost:5432 but Postgres is another service. What should change?",
        "The database name and container port",
        "The API\u2019s own loopback interface",
        "The API image\u2019s EXPOSE declaration",
        "The database\u2019s registry repository",
        "Peer traffic must target the peer\u2019s network address."
      ],
      [
        "A development admin console must be available only from the host. Which mapping best expresses that intent?",
        "127.0.0.1:9000:9000",
        "0.0.0.0:9000:9000",
        "9000:9000 without an address",
        "EXPOSE 9000 without publication",
        "An explicit loopback binding expresses the intended limited publication."
      ],
      [
        "A database is accessed only by an API on their shared private bridge. What is usually unnecessary?",
        "A host-published database port",
        "A running database listener",
        "A shared application network",
        "Valid database authentication",
        "Peer container traffic does not require host publication."
      ],
      [
        "A Dockerfile has EXPOSE 8000 but no runtime publication. Why does host port 8000 fail?",
        "No host forwarding rule exists",
        "The documented port must be 80",
        "The server must run at build time",
        "A compiler must run in the image",
        "Image metadata and runtime networking are different mechanisms."
      ],
      [
        "The host publishes 8080 to container 8000. A peer service uses api:8080 and fails. What should it normally use?",
        "api:8000 on the shared network",
        "localhost:8080 inside the peer",
        "api:8080 because it is published",
        "The image digest as a DNS name",
        "Peer traffic addresses the listening container port."
      ],
      [
        "Two services run on different user-defined bridges without intended connectivity. What should be checked?",
        "The intended network attachments",
        "The image tag equality policy",
        "The service timestamp alignment",
        "The common restart policy name",
        "Network membership determines available container paths."
      ],
      [
        "An operator publishes a service on all interfaces for convenience. What risk should be reviewed?",
        "Unintended host-side reachability",
        "Automatic image layer deletion",
        "A required DNS naming conflict",
        "Mandatory database recreation",
        "Broad publication can expand the reachable surface."
      ],
      [
        "A service still fails after a port mapping is added. Which evidence is most relevant next?",
        "Actual bind address and port",
        "The image tag retention policy",
        "The source documentation path",
        "The container display name order",
        "A forwarding rule cannot repair a process listening on the wrong endpoint."
      ],
      [
        "A team wants API access without exposing its database directly. What layout fits?",
        "Publish API and isolate database",
        "Publish all database interfaces",
        "Use EXPOSE as database authorization",
        "Disable API auth on bridge networks",
        "Publish only required external entry points and retain application controls."
      ]
    ]
  },
  {
    "comp": "m2.c1",
    "title": "Choose mounts and configuration with deliberate ownership",
    "intro": "A stateful service loses data during recreation while a developer\u2019s host source tree hides files installed in the image. Mounts change the filesystem view and its lifecycle.",
    "headings": [
      "Reason about the mechanism",
      "Apply the decision and inspect evidence",
      "Bound the verification"
    ],
    "sections": [
      [
        "A named volume is managed by Docker and has a lifecycle separate from an individual container. A bind mount maps a particular host path into the container. Bind mounts suit deliberate host integration but depend on host layout and permissions; volumes suit engine-managed persistent data. Neither is automatically a backup.",
        "Mounting over an existing directory obscures its image contents for that mount view. A development bind mount at /app can therefore hide dependencies installed there at build time. Mount only the required path and understand ownership and initialization behavior rather than assuming missing files were removed from the image."
      ],
      [
        "Configuration such as service mode or endpoint can enter through runtime environment variables. Environment variables are not a secrecy boundary: exposure through configuration inspection, process environments or logs must be considered. Do not bake credentials into Dockerfiles or source control; use a suitable controlled secret mechanism.",
        "Declare which component owns writes, which user ID executes the process, and how data will be backed up and restored. A read-only mount can reduce accidental modification where writes are unnecessary. Test restoring persistent data as well as recreating containers; retaining a volume is not proof of recoverability."
      ],
      [
        "The local dictionaries illustrate chosen storage lifetimes. No mount, permission change, Docker volume or backup is created."
      ]
    ],
    "code": "import json\ns=json.loads('{\"writable\":[\"cache\"],\"volume\":[\"invoice-1\"]}')\nrecreated={\"writable\":[],\"volume\":s[\"volume\"]}\nprint(recreated[\"volume\"])\nprint(recreated[\"writable\"])",
    "expect": "['invoice-1']\n[]",
    "problem": "Evaluate the local fixture for choose mounts and configuration with deliberate ownership.",
    "steps": [
      "Read the declared inputs and assumptions.",
      "Run the isolated Python fixture and compare its exact output.",
      "Explain which production evidence remains necessary."
    ],
    "limit": "The local dictionaries illustrate chosen storage lifetimes. No mount, permission change, Docker volume or backup is created.",
    "mistakes": [
      "Treating a named volume as a tested backup.",
      "Mounting a host tree over required installed files without checking the resulting view."
    ],
    "takeaways": [
      "Choose mounts by ownership and lifecycle.",
      "Separate nonsecret configuration from protected credentials."
    ],
    "practice": [
      [
        "What distinguishes a bind mount?",
        "Maps a particular host path",
        "Stores files inside an image layer",
        "Encrypts every application write",
        "Creates an immutable registry object",
        "Bind mounts depend on a particular host path and its permissions."
      ],
      [
        "What is a named volume suited for?",
        "Engine-managed persistent data",
        "Automatic database backup rotation",
        "Automatic host endpoint publication",
        "Immutable source version tracking",
        "A named volume has a lifecycle separate from an individual container."
      ],
      [
        "What happens when a mount covers an image directory?",
        "The mount obscures image contents",
        "The original image digest changes",
        "The original image layers disappear",
        "The registry receives runtime edits",
        "The mounted filesystem replaces the visible view at that path."
      ],
      [
        "What does a read-only mount restrict?",
        "Writes through that mount",
        "All network traffic from the service",
        "All image downloads on the host",
        "Every privileged host operation",
        "Read-only applies to the mount\u2019s write behavior."
      ],
      [
        "Which is a reasonable environment variable value?",
        "A nonsecret application mode",
        "A password guaranteed unobservable",
        "A complete host firewall policy",
        "A completed volume backup snapshot",
        "Environment variables suit configuration but are not inherently secret."
      ],
      [
        "What proves a backup is useful?",
        "A tested successful restore",
        "A retained named volume alone",
        "A large compressed image size",
        "An EXPOSE declaration for backup",
        "Recovery needs evidence that retained data can be restored correctly."
      ]
    ],
    "final": [
      [
        "A recreated container has an empty writable layer. Where should durable invoices have been placed?",
        "Managed storage and backup policy",
        "The old instance\u2019s /tmp directory",
        "A new image LABEL with its name",
        "A stable runtime container name",
        "Durable state needs a lifecycle independent of one runtime instance."
      ],
      [
        "A host source mount hides /app/site-packages installed in the image. What explains the failure?",
        "The mount obscures those files",
        "Docker deleted the registry layer",
        "The application image tag expired",
        "The volume changed Python versions",
        "The mounted path changes the process\u2019s visible filesystem."
      ],
      [
        "A team stores credentials in ENV instructions. What should review require?",
        "Use controlled secret delivery",
        "Delete it in a later image layer",
        "Rename the variable to PRIVATE",
        "Assume metadata is uninspectable",
        "Image configuration is not an appropriate secret storage boundary."
      ],
      [
        "A service runs as UID 10001 but its mounted directory permits only UID 0 writes. What must be reconciled?",
        "Intended ownership and permissions",
        "The alphabetical image tag order",
        "The published service port number",
        "The configured Compose service count",
        "The runtime identity must have appropriate access to its storage."
      ],
      [
        "A development bind mount works on one laptop but fails on another. What dependency should be investigated?",
        "Host path existence and permissions",
        "The registry tag retention order",
        "The image\u2019s LABEL naming scheme",
        "The source repository comment style",
        "Bind mounts couple the service to host filesystem assumptions."
      ],
      [
        "An operator removes an unused volume containing customer records. What was missing?",
        "A data lifecycle and recovery plan",
        "A larger container writable layer",
        "A different image repository name",
        "Additional host-published endpoints",
        "Persistence requires deliberate retention and deletion policies."
      ],
      [
        "An app only reads a static configuration file. Which mount setting reduces accidental edits?",
        "A read-only configuration mount",
        "A privileged application container",
        "A writable host root bind mount",
        "An unbounded process restart policy",
        "Limit writable access where the application does not need it."
      ],
      [
        "A password entered as a runtime environment variable appears in a debug log. What does this demonstrate?",
        "Environment delivery can leak",
        "Docker automatically rotates logs",
        "Volumes automatically encrypt logs",
        "Image scanning redacts every log",
        "Application and operational handling can expose runtime configuration."
      ],
      [
        "A team claims its persistent volume meets a four-hour recovery objective without testing restore. What is the gap?",
        "Measured backup and restore evidence",
        "A named volume\u2019s automatic offsite copy",
        "A recovery setting enforced by CMD",
        "Container recreation\u2019s automatic audit",
        "Recovery objectives require tested backup and restore evidence."
      ]
    ]
  },
  {
    "comp": "m2.c2",
    "title": "Describe a multi-container application with Compose",
    "intro": "An API, database and migration task are started by a series of remembered commands. A Compose file makes intended services, configuration and connections reviewable.",
    "headings": [
      "Reason about the mechanism",
      "Apply the decision and inspect evidence",
      "Bound the verification"
    ],
    "sections": [
      [
        "Compose describes services and their images or build inputs, networks, volumes and runtime settings in a declarative application model. A service is a configuration for containers; a project groups related resources. Service names provide useful peer addresses on the project\u2019s networks.",
        "A schematic YAML contains services: with api: and db: entries, image: values, and an api environment entry DB_HOST: db. A top-level volumes: declaration names persistent storage used by a service mount such as dbdata:/var/lib/postgresql/data. Exact database paths and image initialization behavior must match the selected image version."
      ],
      [
        "Compose variable interpolation resolves values from the invoking environment and configured environment files before creating services. It is distinct from passing a variable into a container\u2019s environment. Inspect the resolved model with docker compose config, taking care that resolved output may reveal sensitive configuration.",
        "Keep development overlays distinct from intended deployment settings. A local source bind mount or broad debug port may be appropriate for a laptop and inappropriate for a shared host. Review the resolved model as a whole, including service network membership, mount targets, artifact references and secret handling."
      ],
      [
        "JSON represents the YAML-compatible service model for offline inspection. It does not invoke Compose, validate all schema rules or assert database image path compatibility."
      ]
    ],
    "code": "import json\nc=json.loads('{\"services\":{\"api\":{\"environment\":{\"DB_HOST\":\"db\"}},\"db\":{\"image\":\"postgres:17\"}}}')\nservices=c[\"services\"]\nprint(services[\"api\"][\"environment\"][\"DB_HOST\"] in services)\nprint(len(services))",
    "expect": "True\n2",
    "problem": "Evaluate the local fixture for describe a multi-container application with compose.",
    "steps": [
      "Read the declared inputs and assumptions.",
      "Run the isolated Python fixture and compare its exact output.",
      "Explain which production evidence remains necessary."
    ],
    "limit": "JSON represents the YAML-compatible service model for offline inspection. It does not invoke Compose, validate all schema rules or assert database image path compatibility.",
    "mistakes": [
      "Confusing interpolation with container environment injection.",
      "Reusing development debug settings without deployment review."
    ],
    "takeaways": [
      "Describe connections and persistence explicitly.",
      "Review the resolved application configuration."
    ],
    "practice": [
      [
        "What does Compose describe?",
        "A multi-service application model",
        "A guaranteed cloud scheduling system",
        "An immutable source control store",
        "An automated database backup policy",
        "Compose coordinates service configuration and associated resources."
      ],
      [
        "What is a Compose service?",
        "A component\u2019s container configuration",
        "A registry authentication account",
        "A kernel isolation implementation",
        "A service billing subscription",
        "A service declares how a component should run."
      ],
      [
        "What typically names a peer database in Compose networking?",
        "The peer\u2019s declared service name",
        "The API container\u2019s localhost",
        "The image\u2019s registry repository",
        "The invoking host\u2019s username",
        "Services on a shared Compose network can use service names."
      ],
      [
        "Which command inspects resolved Compose configuration?",
        "docker compose config",
        "docker image history",
        "docker container logs",
        "docker volume inspect",
        "Config renders and validates the resolved model without starting the application."
      ],
      [
        "What does top-level volumes define?",
        "Named persistent volume resources",
        "Public service DNS registrations",
        "Image vulnerability exceptions",
        "Host firewall publication rules",
        "Service mounts can reference declared volume resources."
      ],
      [
        "Is interpolation the same as setting container environment variables?",
        "No; they act at different stages",
        "Yes; interpolation enters every env",
        "Yes; interpolation encrypts values",
        "No; interpolation runs only in db",
        "The rendered model and container environment are distinct stages."
      ]
    ],
    "final": [
      [
        "The API uses DB_HOST=localhost but the database is service db. What should configuration normally use?",
        "DB_HOST=db on a shared network",
        "DB_HOST=localhost inside the API",
        "DB_HOST equal to the API digest",
        "DB_HOST equal to a host username",
        "The peer service name identifies the database on the application network."
      ],
      [
        "A developer copies a debug Compose overlay to a shared production host. What needs review?",
        "Ports, mounts and debug settings",
        "Only the Compose file\u2019s name",
        "Only the comment indentation",
        "Only the service listing order",
        "Development conveniences may expose inappropriate paths or endpoints."
      ],
      [
        "A variable is interpolated into an image tag but absent from environment. What is expected?",
        "Only the selected model value changes",
        "Every service receives the variable",
        "Compose stores it as an encrypted secret",
        "It necessarily becomes a volume name",
        "Interpolation changes selected model values, not all runtime environments."
      ],
      [
        "A service references dbdata in its mount. Which top-level resource makes that named volume explicit?",
        "A top-level volumes declaration",
        "A top-level ports declaration",
        "A service command with EXPOSE",
        "An environment entry named dbdata",
        "Named resources belong in their corresponding top-level declarations."
      ],
      [
        "A rendered Compose configuration includes a credential. How should the output be handled?",
        "As potentially sensitive output",
        "As guaranteed public-safe output",
        "As automatically encrypted content",
        "As evidence of credential rotation",
        "Resolved configuration may expose values and must be handled accordingly."
      ],
      [
        "A database image upgrade changes its data directory conventions. What should happen before reuse?",
        "Review version-specific requirements",
        "Assume stable paths across all versions",
        "Delete existing data to clear warnings",
        "Only rename the database service",
        "Database image versions can change initialization and storage expectations."
      ],
      [
        "Two Compose services have no shared network. Which issue can prevent name-based peer communication?",
        "No intended network path exists",
        "Their image tags differ in spelling",
        "Their restart counts are unequal",
        "Their service comments do not match",
        "Service names help within appropriate shared networks."
      ],
      [
        "A teammate changes an environment file but the running process still shows old values. What distinction matters?",
        "New config needs appropriate application",
        "All running processes reread env files",
        "Compose never supplies env variables",
        "Every restart rewrites the image",
        "Existing runtime environments do not automatically track arbitrary file edits."
      ],
      [
        "A Compose file declares persistent storage. What does that fail to establish by itself?",
        "A tested backup and restore process",
        "An explicitly declared volume name",
        "An intended storage mount target",
        "A separate storage lifecycle intent",
        "Configuration expresses storage intent but not recovery verification."
      ]
    ]
  },
  {
    "comp": "m2.c2",
    "title": "Coordinate startup readiness and recoverable service behavior",
    "intro": "A Compose application starts the database container before the API, yet the API fails on its first query. Starting a process and accepting useful work are different states.",
    "headings": [
      "Reason about the mechanism",
      "Apply the decision and inspect evidence",
      "Bound the verification"
    ],
    "sections": [
      [
        "An ordinary depends_on relationship establishes startup order, not application readiness. A database process can exist while initializing and reject connections. A healthcheck evaluates a configured probe; with the supported long syntax, condition: service_healthy can wait for a dependency\u2019s healthcheck to pass before starting its dependent.",
        "A readiness check should test the ability needed by dependents without making destructive changes or requiring unnecessary privilege. Health checks have intervals, timeouts, retries and startup allowances. A passing probe is a sampled signal, not a guarantee that the next transaction will succeed."
      ],
      [
        "Applications still need bounded retries, timeouts and useful failure handling because dependencies can fail after initial startup. Use exponential backoff with a cap and jitter where appropriate to avoid synchronized retry storms. Retries must consider whether an operation is safe to repeat.",
        "Restart policy concerns process termination, while healthcheck status reports probe results. An unhealthy status does not inherently mean Compose will replace or restart that service. Diagnose application logs, exit status and dependency state rather than assuming a configured healthcheck is a complete self-healing platform."
      ],
      [
        "The finite state fixture models readiness gating only. It runs no probes, timers, Compose services, restarts or network retries."
      ]
    ],
    "code": "import json\nstates=json.loads('[\"starting\",\"starting\",\"healthy\"]')\nfor attempt,state in enumerate(states,1):\n if state == \"healthy\":\n  print(\"ready on attempt\",attempt)\n  break\nelse:\n print(\"timeout\")",
    "expect": "ready on attempt 3",
    "problem": "Evaluate the local fixture for coordinate startup readiness and recoverable service behavior.",
    "steps": [
      "Read the declared inputs and assumptions.",
      "Run the isolated Python fixture and compare its exact output.",
      "Explain which production evidence remains necessary."
    ],
    "limit": "The finite state fixture models readiness gating only. It runs no probes, timers, Compose services, restarts or network retries.",
    "mistakes": [
      "Equating startup order with readiness.",
      "Assuming an unhealthy status automatically restarts a Compose service."
    ],
    "takeaways": [
      "Readiness is a sampled application signal.",
      "Handle dependency loss after startup as well as initial ordering."
    ],
    "practice": [
      [
        "What does ordinary depends_on primarily express?",
        "Startup ordering",
        "Transactional readiness",
        "Automatic backup completion",
        "Image signature approval",
        "Ordering does not prove a service can satisfy requests."
      ],
      [
        "Which supported dependency condition waits for a healthcheck?",
        "service_healthy",
        "service_started_only",
        "port_exposed",
        "image_cached",
        "The long dependency syntax can wait for the declared health state."
      ],
      [
        "What should a readiness probe measure?",
        "Capability needed by dependents",
        "Only the service name\u2019s length",
        "Only the image\u2019s compressed size",
        "Only the resource\u2019s billing label",
        "Useful readiness checks exercise relevant service capability."
      ],
      [
        "What is a timeout for?",
        "A bounded wait for an operation",
        "A guaranteed successful response",
        "An encrypted failure log record",
        "An automatically published port",
        "Bounded waits prevent indefinite resource occupation."
      ],
      [
        "What does jitter help reduce?",
        "Synchronized retry bursts",
        "Every dependency outage",
        "The final image layer count",
        "The persistent database size",
        "Randomized retry timing reduces herd behavior."
      ],
      [
        "Does unhealthy status alone guarantee a Compose restart?",
        "No automatic guarantee",
        "Yes for every configured check",
        "Yes when EXPOSE is present",
        "Yes when the image is minimal",
        "Health status and process restart policy are separate mechanisms."
      ]
    ],
    "final": [
      [
        "The database process is running but rejects queries during initialization. What should startup coordination use?",
        "Readiness checks plus resilience",
        "Only the container-created event",
        "Only the image\u2019s declared label",
        "Only a public database listener",
        "A running process can precede usable service capability."
      ],
      [
        "An API starts after a healthy database then loses it an hour later. What is still required?",
        "Runtime timeouts and recovery",
        "Only startup dependency ordering",
        "Only a new Dockerfile comment",
        "Only a larger dependency cache",
        "Startup gating cannot prevent later dependency failure."
      ],
      [
        "All replicas retry failed requests at exactly one-second intervals. What change reduces load spikes?",
        "Capped backoff with jitter",
        "Infinite immediate request retries",
        "Timeout removal on all requests",
        "Additional published host ports",
        "Spreading retries reduces synchronized pressure on a struggling dependency."
      ],
      [
        "A healthcheck creates a new customer row each time. What is wrong?",
        "It changes business state",
        "It does not install packages",
        "It is too narrowly read-only",
        "It avoids using administrator access",
        "Repeated health evaluation should avoid corrupting application state."
      ],
      [
        "A retry duplicates a payment after a response timeout. What should be reviewed?",
        "Idempotency and deduplication",
        "Only the host publication rule",
        "Only the image repository tag",
        "Only the startup probe interval",
        "A timeout does not prove the first side effect failed to occur."
      ],
      [
        "A service is unhealthy but its main process stays alive. Why might restart: on-failure not act?",
        "The main process has not failed",
        "Healthchecks erase restart policies",
        "The source image must be corrupt",
        "Compose rejects all healthchecks",
        "Process exit policies are not automatic reactions to all unhealthy probes."
      ],
      [
        "A startup timeout is set below normal database initialization time. What is the likely operational effect?",
        "False failures during startup",
        "Guaranteed faster initialization",
        "Automatic database schema repair",
        "Immutable deployment image tags",
        "Probe allowances must fit measured service behavior."
      ],
      [
        "A probe succeeds once. Which conclusion is justified?",
        "Success at that sampled time",
        "Guaranteed future transaction success",
        "Verified security of every dependency",
        "Elimination of the need for retries",
        "Health is observational and time-bounded evidence."
      ],
      [
        "A deployment has repeated restarts with no useful logs. Which investigation is productive?",
        "Inspect logs and exit evidence",
        "Increase restart counts indefinitely",
        "Delete all persistent volumes first",
        "Assume a smaller image fixes it",
        "Restart loops need root-cause evidence and careful data preservation."
      ]
    ]
  },
  {
    "comp": "m3.c1",
    "title": "Reduce runtime privilege and filesystem authority",
    "intro": "A service needs to answer HTTP requests, yet its proposed configuration grants access to the host Docker socket. Review what authority the service actually needs.",
    "headings": [
      "Reason about the mechanism",
      "Apply the decision and inspect evidence",
      "Bound the verification"
    ],
    "sections": [
      [
        "Containers share the host kernel in ordinary Linux deployments. Namespace isolation is not the same as an independent virtual machine kernel. Granting privileged mode, broad host mounts or access to the Docker daemon can greatly expand a compromised workload\u2019s authority.",
        "USER selects the image\u2019s default runtime user, which can also be overridden by runtime configuration. Create and select a dedicated non-root identity, give it only necessary file access and test the actual workload. Non-root execution reduces some consequences of compromise but is not a complete sandbox or proof of safety."
      ],
      [
        "Read-only root filesystem settings, narrowly scoped writable mounts and dropping unnecessary Linux capabilities reduce accessible operations. A service may need /tmp or a cache directory to remain writable. Discover those needs with testing rather than solving every permission failure by returning to root.",
        "Do not mount the host Docker socket into an ordinary application for convenience. Control of a broadly authorized daemon commonly permits creation of highly privileged containers and host filesystem access. Review daemon access separately from application ports and avoid treating a socket as a harmless local file."
      ],
      [
        "This configuration review fixture checks only listed declarations. It does not inspect effective capabilities, kernel isolation, daemon authorization or mounted filesystem permissions."
      ]
    ],
    "code": "import json\np=json.loads('{\"uid\":10001,\"privileged\":false,\"mounts\":[\"/data\"]}')\nprint(p[\"uid\"] != 0 and not p[\"privileged\"])\nprint(\"/var/run/docker.sock\" not in p[\"mounts\"])",
    "expect": "True\nTrue",
    "problem": "Evaluate the local fixture for reduce runtime privilege and filesystem authority.",
    "steps": [
      "Read the declared inputs and assumptions.",
      "Run the isolated Python fixture and compare its exact output.",
      "Explain which production evidence remains necessary."
    ],
    "limit": "This configuration review fixture checks only listed declarations. It does not inspect effective capabilities, kernel isolation, daemon authorization or mounted filesystem permissions.",
    "mistakes": [
      "Granting daemon socket access as a routine application dependency.",
      "Using root to bypass every storage permission error."
    ],
    "takeaways": [
      "Minimize runtime identity and host authority.",
      "Verify effective configuration and required writable paths."
    ],
    "practice": [
      [
        "What does USER set in an image?",
        "Default runtime user identity",
        "Registry artifact ownership",
        "Host network firewall policy",
        "Database backup task identity",
        "USER configures the identity used for runtime instructions and commands."
      ],
      [
        "Why avoid unnecessary privileged mode?",
        "It expands host-related authority",
        "It guarantees reproducible builds",
        "It removes every application flaw",
        "It blocks all application networking",
        "Broad runtime privilege weakens useful isolation boundaries."
      ],
      [
        "What kernel do ordinary Linux containers use?",
        "The underlying host kernel",
        "A private kernel in each image",
        "A registry-managed guest kernel",
        "A language-specific Python kernel",
        "Container isolation generally shares the underlying host kernel."
      ],
      [
        "What does a read-only root filesystem require reviewing?",
        "Required writable application paths",
        "Only the image tag\u2019s spelling",
        "Only the project README contents",
        "Only the registry billing account",
        "Applications often need carefully scoped writable locations."
      ],
      [
        "What is risky about mounting the Docker socket?",
        "It can grant broad daemon control",
        "It is always a read-only log file",
        "It is necessary for ordinary HTTP",
        "It automatically drops capabilities",
        "Daemon access can enable control beyond the application\u2019s intended role."
      ],
      [
        "What does non-root execution provide?",
        "Reduced runtime privilege",
        "A complete isolation guarantee",
        "Automatic image signing evidence",
        "A guarantee of no writable state",
        "It is one control among several independent boundaries."
      ]
    ],
    "final": [
      [
        "An HTTP API requests the Docker socket only to list its own version. What should review prefer?",
        "Avoid broad daemon access",
        "Add privileged mode as a precaution",
        "Mount host root to simplify lookup",
        "Embed a host administrator password",
        "A small metadata need does not justify broad host control."
      ],
      [
        "A non-root app cannot write its cache. What should change first?",
        "Provision the cache path narrowly",
        "Run the application privileged",
        "Mount the whole host writable",
        "Remove all filesystem access checks",
        "Resolve the specific permission need while keeping privilege narrow."
      ],
      [
        "A container runs as UID 10001 but has a dangerous host mount. What conclusion is sound?",
        "Identity alone is insufficient",
        "UID 10001 neutralizes every mount",
        "Every host mount becomes readonly",
        "Non-root containers stop sharing kernels",
        "Identity and filesystem access must be assessed together."
      ],
      [
        "A team enables read-only root and sees failures writing /tmp. What is a targeted solution?",
        "Provide a scoped writable path",
        "Make the whole host filesystem writable",
        "Remove the dedicated runtime identity",
        "Disable every application log message",
        "Allow only the writes the service legitimately needs."
      ],
      [
        "An application needs no extra Linux capabilities. What is a reasonable hardening step?",
        "Drop unneeded capabilities",
        "Add all capabilities for portability",
        "Enable privileged mode by default",
        "Expose every available host device",
        "Reduce authority to operations the process actually requires."
      ],
      [
        "A runtime configuration overrides the image\u2019s USER to root. What matters in an audit?",
        "The effective runtime identity",
        "Only the Dockerfile\u2019s original USER",
        "Only the compressed artifact size",
        "Only the configured container name",
        "Runtime settings can alter the image default."
      ],
      [
        "A colleague calls containers equivalent to VMs because both isolate processes. What distinction matters?",
        "Containers share the host kernel",
        "Every container boots its own kernel",
        "VMs cannot isolate filesystems",
        "Containers remove kernel attack surfaces",
        "Shared-kernel isolation has different boundaries from a VM guest kernel."
      ],
      [
        "A compromised process can write only its cache mount. Which claim is justified?",
        "Narrower filesystem write scope",
        "No network requests are possible",
        "Every application flaw is removed",
        "No host review is necessary",
        "Filesystem restrictions address one dimension of authority."
      ],
      [
        "A socket is mounted read-only and the team assumes daemon requests are read-only. What is the flaw?",
        "Mount mode is not API authorization",
        "Readonly sockets become inert files",
        "Readonly removes the host daemon",
        "The kernel rejects all socket messages",
        "Socket communication authority depends on daemon access controls, not file-content write mode alone."
      ]
    ]
  },
  {
    "comp": "m3.c1",
    "title": "Select minimal maintained images and scan with context",
    "intro": "A smaller release image has fewer packages but includes a critical vulnerable library in its active request path. Size is useful information, not a security verdict.",
    "headings": [
      "Reason about the mechanism",
      "Apply the decision and inspect evidence",
      "Bound the verification"
    ],
    "sections": [
      [
        "Minimal runtime images reduce unnecessary components and often reduce transfer cost and attack surface. Select a maintained base appropriate to the application\u2019s runtime and diagnostics. A small image still needs supported cryptography, certificates, runtime libraries and a usable incident investigation approach.",
        "Pinning a base digest controls which content a build starts from, but it also requires deliberate refreshes. A fixed old digest remains old when a maintainer publishes a security update. Track update notices, rebuild affected artifacts, test them and promote reviewed replacements."
      ],
      [
        "Image scanners compare discovered packages and sometimes application dependencies against vulnerability intelligence. Findings depend on scanner coverage, data freshness, package detection and vulnerability context. Absence of findings is not proof that an image contains no exploitable flaw.",
        "Triage findings by severity, reachability, available fixes and compensating controls, documenting uncertainty and exceptions with expiry. Preserve an artifact inventory or SBOM tied to the image digest. A documented exception is a risk decision, not a reason to relabel a vulnerable package as fixed."
      ],
      [
        "The example applies a deliberately narrow declared policy to synthetic findings. It is not a scanner, a universal severity policy or an assessment of exploitability."
      ]
    ],
    "code": "import json\nf=json.loads('[{\"severity\":\"critical\",\"fixed\":true},{\"severity\":\"low\",\"fixed\":false}]')\nblock=any(x[\"severity\"] == \"critical\" and x[\"fixed\"] for x in f)\nprint(\"block\" if block else \"review\")",
    "expect": "block",
    "problem": "Evaluate the local fixture for select minimal maintained images and scan with context.",
    "steps": [
      "Read the declared inputs and assumptions.",
      "Run the isolated Python fixture and compare its exact output.",
      "Explain which production evidence remains necessary."
    ],
    "limit": "The example applies a deliberately narrow declared policy to synthetic findings. It is not a scanner, a universal severity policy or an assessment of exploitability.",
    "mistakes": [
      "Treating a zero-finding report as proof of zero vulnerabilities.",
      "Pinning a digest without an update process."
    ],
    "takeaways": [
      "Reduce unnecessary components while maintaining runtime support.",
      "Tie vulnerability decisions to artifact identity and evidence."
    ],
    "practice": [
      [
        "What is a benefit of a minimal runtime image?",
        "Fewer unnecessary components",
        "Guaranteed absence of vulnerabilities",
        "Automatic durable backup scheduling",
        "An independently booted guest kernel",
        "Removing unused components can reduce attack surface and transfer size."
      ],
      [
        "What does digest pinning control?",
        "The selected content version",
        "Automatic upstream patch adoption",
        "Absence of malicious code",
        "Runtime network authorization",
        "A digest identifies specific content and must be deliberately refreshed."
      ],
      [
        "What can an SBOM describe?",
        "Software component inventory",
        "Guaranteed exploitability results",
        "Effective runtime firewall policy",
        "Container process restart timing",
        "Component inventory supports later assessment and tracking."
      ],
      [
        "Why keep scanner intelligence current?",
        "Findings depend on current data",
        "It makes image tags immutable",
        "It prevents every programming flaw",
        "It replaces all runtime tests",
        "Detection depends partly on available vulnerability data."
      ],
      [
        "What should a risk exception include?",
        "Owner, justification and expiry",
        "Only a permanently ignored warning",
        "Only a deleted audit history entry",
        "Only a new fixed status label",
        "Exceptions need accountable review and reassessment."
      ],
      [
        "What does no scanner finding mean?",
        "No finding within scan coverage",
        "No vulnerability can possibly exist",
        "No authentication bugs can exist",
        "The host is necessarily fully patched",
        "Scanner results have bounded coverage."
      ]
    ],
    "final": [
      [
        "A tiny image ships an actively used vulnerable library. What should determine response?",
        "Context, risk and remediation",
        "Only compressed artifact size",
        "Only Dockerfile comment counts",
        "Only a slim tag in the name",
        "Minimal size does not negate a concrete vulnerable component."
      ],
      [
        "A pinned base receives a security fix upstream. What must the team do to adopt it?",
        "Adopt updated content and test",
        "Wait for the old digest to mutate",
        "Rename the running container",
        "Increase healthcheck frequency",
        "Content-addressed references do not automatically track new releases."
      ],
      [
        "A scanner misses an embedded dependency. What assurance is missing?",
        "Complete detection and coverage",
        "A shorter image repository name",
        "More published service listeners",
        "A longer process restart delay",
        "A scanner can only assess what it detects with relevant intelligence."
      ],
      [
        "A team deletes the scanner report to pass a gate. What is the correct response?",
        "Preserve and address findings",
        "Treat missing evidence as clean",
        "Relabel every finding as low risk",
        "Remove package names from reports",
        "A gate requires trustworthy evidence rather than suppression."
      ],
      [
        "A runtime image removes certificates and HTTPS calls fail. What should be restored?",
        "Restore required trusted CA material",
        "Disable all TLS certificate checking",
        "Install every builder tool blindly",
        "Publish an extra database endpoint",
        "Minimality must preserve secure required runtime behavior."
      ],
      [
        "An exception never expires and has no owner. What process weakness exists?",
        "No accountable reassessment",
        "Automatic image content immutability",
        "Proof that the scanner is incorrect",
        "Automatic adoption of available fixes",
        "Exceptions need ownership and time-bounded review."
      ],
      [
        "A release has an SBOM but no image association. What should be added?",
        "Exact artifact and provenance linkage",
        "Only the product\u2019s marketing name",
        "Only the container\u2019s startup time",
        "Only the invoking host username",
        "Inventory is useful when tied to the content actually deployed."
      ],
      [
        "Two scans disagree after one updates its database. What should be compared?",
        "Scanner data and package evidence",
        "Only the report\u2019s stored file size",
        "Only the application service uptime",
        "Only the Compose network names",
        "Different scanner data and detection can explain differing findings."
      ],
      [
        "A critical finding has no fix yet. What is a defensible next step?",
        "Assess and mitigate with ownership",
        "Mark fixed because no patch exists",
        "Assume the finding must be false",
        "Remove the vulnerability audit trail",
        "No available patch does not remove the risk or need for action."
      ]
    ]
  },
  {
    "comp": "m3.c1",
    "title": "Handle build secrets and preserve artifact evidence",
    "intro": "A private package feed requires authentication during a build. A team proposes passing the token through ARG and copying it into a temporary file. Review how information can outlive the build command.",
    "headings": [
      "Reason about the mechanism",
      "Apply the decision and inspect evidence",
      "Bound the verification"
    ],
    "sections": [
      [
        "ARG and ENV are not appropriate secret-delivery mechanisms. Values can be exposed through image metadata, build history, provenance or logs depending on usage and tooling. Deleting a file in a later layer does not erase sensitive content introduced into an earlier image layer.",
        "BuildKit supports secret mounts, for example RUN --mount=type=secret,id=feed_token a-build-command-that-reads-/run/secrets/feed_token, with a corresponding CLI secret source such as docker build --secret id=feed_token,src=token.txt . . The shown build command is schematic; use the package manager\u2019s documented file-based credential mechanism and avoid echoing credentials."
      ],
      [
        "A secret mount limits how the credential is supplied to that build step; it cannot prevent a malicious build command from transmitting the credential or writing it into outputs. Review build scripts, dependencies, logs and copied outputs. Restrict credential scope and duration and rotate exposed credentials promptly.",
        "Promote the tested artifact digest with associated source revision, dependency evidence and security findings. Keep provenance and scanner outputs tied to content identity. Credentials authorize access; they are not evidence that the retrieved package or resulting artifact is safe. Trust requires both restricted access and verified supply-chain inputs."
      ],
      [
        "The synthetic inventory checks declared artifact selection only. It does not inspect image layers, attestations, command logs, network exfiltration or actual secret handling."
      ]
    ],
    "code": "import json\nbuild=json.loads('{\"inputs\":[\"source\",\"lockfile\"],\"secret_mounts\":[\"feed_token\"],\"release_files\":[\"app.whl\"]}')\nprint(\"feed_token\" not in build[\"release_files\"])\nprint(sorted(build[\"inputs\"]))",
    "expect": "True\n['lockfile', 'source']",
    "problem": "Evaluate the local fixture for handle build secrets and preserve artifact evidence.",
    "steps": [
      "Read the declared inputs and assumptions.",
      "Run the isolated Python fixture and compare its exact output.",
      "Explain which production evidence remains necessary."
    ],
    "limit": "The synthetic inventory checks declared artifact selection only. It does not inspect image layers, attestations, command logs, network exfiltration or actual secret handling.",
    "mistakes": [
      "Passing credentials through ARG or ENV as if they were secret stores.",
      "Assuming secret mounts constrain a malicious command\u2019s behavior."
    ],
    "takeaways": [
      "Use documented secret delivery without baking credentials into artifacts.",
      "Link release evidence to exact content and rotate exposures."
    ],
    "practice": [
      [
        "Why avoid ARG for build credentials?",
        "Build-related exposure risk",
        "Automatic encryption of arguments",
        "Restriction to runtime use only",
        "Automatic feed-token rotation",
        "Build arguments are not a secret storage mechanism."
      ],
      [
        "Where does a default BuildKit secret mount commonly appear?",
        "/run/secrets/<selected ID>",
        "The public image tag metadata",
        "The host firewall configuration",
        "The registry repository description",
        "Secret mounts provide build-step access through a controlled file path."
      ],
      [
        "What must a build command avoid doing with a mounted credential?",
        "Log or copy it into artifacts",
        "Read the documented secret file",
        "Limit credential privileges",
        "Limit credential lifetime",
        "Secret delivery does not protect data deliberately leaked by the command."
      ],
      [
        "What should be recorded for artifact promotion?",
        "Digest-linked release evidence",
        "Only a mutable deployment tag",
        "Only the author\u2019s display name",
        "Only a successful login timestamp",
        "Content identity ties approval to the deployed artifact."
      ],
      [
        "What should happen after credential exposure?",
        "Rotate and investigate exposure",
        "Only delete its visible file later",
        "Only rename its variable identifier",
        "Assume old layers forget the token",
        "Exposure requires invalidating the credential and tracing consequences."
      ],
      [
        "Does authenticated package access establish package safety?",
        "No; verify the content separately",
        "Yes; authentication proves safe code",
        "Yes; private packages cannot be malicious",
        "No; authentication prevents every access",
        "Authorization and software trust answer different questions."
      ]
    ],
    "final": [
      [
        "A Dockerfile copies token.txt then removes it in a later RUN. What is the core concern?",
        "Earlier layers may retain it",
        "Later deletion guarantees erasure",
        "The registry automatically revokes it",
        "Final ls proves no prior exposure",
        "Layer history can preserve content hidden in the final view."
      ],
      [
        "A team switches from ARG to a secret mount but the script echoes the token. What still fails?",
        "The command still leaks it",
        "Secret mounts encrypt stdout",
        "Mounts prevent all logging",
        "The script cannot access its contents",
        "The consuming process can leak a secret despite secure delivery."
      ],
      [
        "A build dependency is untrusted and can read a secret mount. What boundary remains weak?",
        "The dependency can misuse it",
        "No build process can read it",
        "Docker proves dependencies benign",
        "It can leak only after deployment",
        "Secret mounts do not sandbox authorized readers from exfiltration."
      ],
      [
        "A private feed token has unrestricted administration access. What should be narrowed?",
        "Its scope and lifetime",
        "Only its variable identifier",
        "Only compressed image size",
        "Only the build stage comment",
        "Least privilege limits consequences of build credential compromise."
      ],
      [
        "A release review has a clean report for one digest but deploys another. What is missing?",
        "Evidence for the deployed digest",
        "An additional mutable image alias",
        "A longer healthcheck interval",
        "A larger package-manager cache",
        "Security evidence must identify the same artifact selected for release."
      ],
      [
        "A team stores token.txt in its repository but uses --secret. What is still wrong?",
        "Source history exposed the token",
        "The flag erases committed history",
        "Secret mounts forbid local source files",
        "The repository becomes encrypted",
        "Runtime or build secret mechanisms do not repair committed credential exposure."
      ],
      [
        "A builder copies its entire workspace into production. What should be investigated?",
        "Sensitive material crossed stages",
        "Only the stage naming convention",
        "Only the published endpoint count",
        "Only the container restart counter",
        "Copy boundaries must exclude sensitive build material."
      ],
      [
        "A security incident finds a token in a cached image layer. What is an appropriate response?",
        "Invalidate and investigate artifacts",
        "Only delete it in a later layer",
        "Assume old images cannot be accessed",
        "Remove the scanner\u2019s relevant policy",
        "Exposure persists beyond a final filesystem deletion."
      ],
      [
        "A provenance record names a source revision but omits the resulting digest. What linkage is incomplete?",
        "Association with the built artifact",
        "Association with the chosen editor",
        "Association with the published port",
        "Association with the largest table",
        "Provenance needs an association with produced content."
      ]
    ]
  }
];
const refs=[
  {
    "id": "docker-ref-0",
    "title": "Docker official documentation: best-practices.md",
    "url": "https://github.com/docker/docs/blob/b5b96e5d051a84d6077467f928b3f4ca06e8cc2e/content/manuals/build/building/best-practices.md",
    "source": {
      "repo": "docker/docs",
      "commit": "b5b96e5d051a84d6077467f928b3f4ca06e8cc2e",
      "path": "content/manuals/build/building/best-practices.md",
      "verification": "Pinned official documentation; offline fixtures model declared decisions and do not execute a container engine or deployment."
    }
  },
  {
    "id": "docker-ref-1",
    "title": "Docker official documentation: multi-stage.md",
    "url": "https://github.com/docker/docs/blob/b5b96e5d051a84d6077467f928b3f4ca06e8cc2e/content/manuals/build/building/multi-stage.md",
    "source": {
      "repo": "docker/docs",
      "commit": "b5b96e5d051a84d6077467f928b3f4ca06e8cc2e",
      "path": "content/manuals/build/building/multi-stage.md",
      "verification": "Pinned official documentation; offline fixtures model declared decisions and do not execute a container engine or deployment."
    }
  },
  {
    "id": "docker-ref-2",
    "title": "Docker official documentation: secrets.md",
    "url": "https://github.com/docker/docs/blob/b5b96e5d051a84d6077467f928b3f4ca06e8cc2e/content/manuals/build/building/secrets.md",
    "source": {
      "repo": "docker/docs",
      "commit": "b5b96e5d051a84d6077467f928b3f4ca06e8cc2e",
      "path": "content/manuals/build/building/secrets.md",
      "verification": "Pinned official documentation; offline fixtures model declared decisions and do not execute a container engine or deployment."
    }
  },
  {
    "id": "docker-ref-3",
    "title": "Docker official documentation: port-publishing.md",
    "url": "https://github.com/docker/docs/blob/b5b96e5d051a84d6077467f928b3f4ca06e8cc2e/content/manuals/engine/network/port-publishing.md",
    "source": {
      "repo": "docker/docs",
      "commit": "b5b96e5d051a84d6077467f928b3f4ca06e8cc2e",
      "path": "content/manuals/engine/network/port-publishing.md",
      "verification": "Pinned official documentation; offline fixtures model declared decisions and do not execute a container engine or deployment."
    }
  },
  {
    "id": "docker-ref-4",
    "title": "Docker official documentation: volumes.md",
    "url": "https://github.com/docker/docs/blob/b5b96e5d051a84d6077467f928b3f4ca06e8cc2e/content/manuals/engine/storage/volumes.md",
    "source": {
      "repo": "docker/docs",
      "commit": "b5b96e5d051a84d6077467f928b3f4ca06e8cc2e",
      "path": "content/manuals/engine/storage/volumes.md",
      "verification": "Pinned official documentation; offline fixtures model declared decisions and do not execute a container engine or deployment."
    }
  },
  {
    "id": "docker-ref-5",
    "title": "Docker official documentation: startup-order.md",
    "url": "https://github.com/docker/docs/blob/b5b96e5d051a84d6077467f928b3f4ca06e8cc2e/content/manuals/compose/how-tos/startup-order.md",
    "source": {
      "repo": "docker/docs",
      "commit": "b5b96e5d051a84d6077467f928b3f4ca06e8cc2e",
      "path": "content/manuals/compose/how-tos/startup-order.md",
      "verification": "Pinned official documentation; offline fixtures model declared decisions and do not execute a container engine or deployment."
    }
  },
  {
    "id": "docker-ref-6",
    "title": "Docker official documentation: _index.md",
    "url": "https://github.com/docker/docs/blob/b5b96e5d051a84d6077467f928b3f4ca06e8cc2e/content/manuals/engine/security/_index.md",
    "source": {
      "repo": "docker/docs",
      "commit": "b5b96e5d051a84d6077467f928b3f4ca06e8cc2e",
      "path": "content/manuals/engine/security/_index.md",
      "verification": "Pinned official documentation; offline fixtures model declared decisions and do not execute a container engine or deployment."
    }
  }
];
refs.push(pythonRef('json'));
const built=build('docker-containers',data,refs);
module.exports=built.course;
Object.defineProperty(module.exports,'__bank',{value:built.bank,enumerable:false});
