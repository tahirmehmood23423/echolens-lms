'use strict';
const {build,pythonRef}=require('./infra-wave2-helper');
const data=[
  {
    "comp": "m1.c1",
    "title": "Choose service models by retained operating responsibility",
    "intro": "A university wants an admissions portal without maintaining every infrastructure layer itself. IaaS, PaaS and SaaS describe different abstractions, but none removes the institution’s responsibility for its own data, identity choices and lawful use.",
    "headings": [
      "Understand the boundary",
      "Apply it to an operating decision",
      "Check the model and its limits"
    ],
    "sections": [
      [
        "Infrastructure as a Service exposes configurable compute, storage and networking on provider infrastructure. The customer commonly retains guest operating-system and application administration. Platform as a Service abstracts more runtime operations, while Software as a Service provides an application capability. The boundary depends on the actual service contract rather than a marketing label.",
        "A managed service can reduce undifferentiated operational work while changing portability, customization, observability and cost tradeoffs. More abstraction is not automatically appropriate for every workload. Document which team patches, configures, monitors and recovers each relevant layer."
      ],
      [
        "For admissions, compare required customization, integration constraints, identity management and data handling before selecting a model. A SaaS application can still be misconfigured to expose records, and an IaaS virtual machine can still need application authorization. A provider’s infrastructure controls do not grant each student access to every resource.",
        "The fixture classifies three synthetic operating tasks by the chosen responsibility model. It is an explicit planning table, not a complete AWS legal or security contract. No cloud account is accessed and no service is provisioned."
      ]
    ],
    "code": "owners = {\"physical_host\":\"provider\", \"guest_os\":\"customer\", \"application_permissions\":\"customer\"}\nprint([task for task, owner in owners.items() if owner == \"customer\"])",
    "expect": "['guest_os', 'application_permissions']",
    "problem": "Identify retained customer tasks in a synthetic IaaS responsibility table.",
    "steps": [
      "Read the declared service model.",
      "Select tasks assigned to the customer.",
      "Keep physical infrastructure and application authority separate."
    ],
    "limit": "The table models one stated boundary and does not certify any actual provider contract, deployment or compliance requirement.",
    "mistakes": [
      "Assuming every managed service removes application permissions work.",
      "Choosing a model solely from the amount of provider branding."
    ],
    "takeaways": [
      "Map operational ownership by layer.",
      "Compare abstraction benefits with workload constraints."
    ],
    "practice": [
      [
        "What does IaaS typically expose?",
        "Configurable infrastructure",
        "A completed business workflow",
        "Every customer permission",
        "Only a finished SaaS application",
        "IaaS supplies infrastructure abstractions while customers retain substantial workload administration."
      ],
      [
        "What does SaaS primarily provide?",
        "An application capability",
        "A universal ownership exemption",
        "Every source-code repository",
        "A guaranteed legal compliance result",
        "SaaS delivers an application service, but customer configuration, identity and data responsibilities remain relevant."
      ],
      [
        "Why document patch ownership?",
        "Service boundaries differ",
        "All models assign every patch to users",
        "Every managed service is identical",
        "Labels automatically enforce ownership",
        "Actual service contracts distribute maintenance responsibilities differently across layers."
      ],
      [
        "Does cloud management replace app authorization?",
        "No",
        "Always",
        "Only for private records",
        "Only in one region",
        "Managed infrastructure does not decide which authenticated user may access each business resource."
      ],
      [
        "What can higher abstraction change?",
        "Control and operating tradeoffs",
        "The need for all data policy",
        "Every business requirement automatically",
        "The organization’s legal identity",
        "Managed layers can reduce work while changing customization, portability and operational visibility."
      ],
      [
        "What does the fixture identify?",
        "Declared customer tasks",
        "Actual AWS resource ownership",
        "A production audit verdict",
        "A live patch inventory",
        "The supplied dictionary records one planning model rather than observed cloud-account state."
      ],
      [
        "Why compare the actual service contract?",
        "Labels can hide differences",
        "Marketing names define every control",
        "All platforms use one guest OS",
        "Every provider assigns identical duties",
        "The real service boundary and features determine retained operational tasks."
      ],
      [
        "What should guide service-model selection?",
        "Workload requirements",
        "Only the longest product name",
        "Only a promotional diagram",
        "Only the provider’s logo",
        "Customization, integration, operation, data and cost needs should drive the selection."
      ]
    ],
    "final": [
      [
        "Which model commonly leaves guest-OS administration with the customer?",
        "IaaS virtual machines",
        "Every SaaS application",
        "All hosted email offerings",
        "A universally fully managed app",
        "An infrastructure VM typically retains customer responsibility for its guest operating system and workload."
      ],
      [
        "What remains relevant in a managed application?",
        "Customer identity configuration",
        "A claim every record is public",
        "The absence of all data policy",
        "Automatic legal approval",
        "A managed application can still be configured incorrectly or granted excessive customer-side access."
      ],
      [
        "What should a responsibility matrix assign?",
        "Tasks to accountable owners",
        "Every task to an empty label",
        "Only provider marketing terms",
        "Every user to administrator",
        "Useful ownership mapping connects concrete operational tasks with responsible parties."
      ],
      [
        "A university chooses SaaS then grants all students administrator access. Which assumption failed?",
        "Management removes access duties",
        "SaaS can provide application features",
        "Students can have user accounts",
        "Configuration can affect behavior",
        "Provider operation does not eliminate customer-side identity and permission responsibilities."
      ],
      [
        "A team moves a VM to cloud and stops applying guest updates. What should be reviewed?",
        "The retained patch boundary",
        "Only the machine’s nickname",
        "Only the invoice heading",
        "The number of login icons",
        "IaaS commonly leaves guest operating-system maintenance with the customer under the actual service model."
      ],
      [
        "A managed platform limits runtime customization needed by a legacy app. What matters in selection?",
        "Control versus abstraction",
        "Only the service’s popularity",
        "Only its dashboard color",
        "The spelling of its region",
        "Operational convenience must be weighed against the workload’s actual customization constraints."
      ],
      [
        "An architect selects solely by the term serverless. What evidence is missing?",
        "The concrete workload contract",
        "Only a longer project title",
        "Only the function’s display label",
        "The number of provider logos",
        "A marketing category does not settle service limits, retained tasks, dependencies or failure behavior."
      ],
      [
        "A provider secures physical hosts. Does that decide which student owns an application record?",
        "No, it is another boundary",
        "Yes, physical controls grant every role",
        "Yes, managed disks encode all student ids",
        "Yes, host security replaces app policy",
        "Infrastructure protection and application object authorization are separate responsibilities."
      ],
      [
        "A responsibility table lists guest_os as customer. What did the fixture establish?",
        "Its declared task assignment",
        "A live configuration audit",
        "Every AWS service’s full terms",
        "A complete compliance certification",
        "The table illustrates explicitly supplied ownership rather than inspecting provider or organizational practice."
      ],
      [
        "A team needs less runtime maintenance but can accept platform constraints. What comparison is relevant?",
        "A more managed abstraction",
        "Only the VM’s hostname",
        "Only a new repository name",
        "A larger office subnet",
        "A platform-managed model may reduce runtime operations when its constraints fit the actual workload."
      ]
    ]
  },
  {
    "comp": "m1.c1",
    "title": "Apply shared responsibility to data and service configuration",
    "intro": "A retail team stores invoices in managed cloud storage. The provider operates the storage infrastructure, but a customer policy can still disclose invoices publicly. Shared responsibility must be translated into specific configuration and data controls.",
    "headings": [
      "Understand the boundary",
      "Apply it to an operating decision",
      "Check the model and its limits"
    ],
    "sections": [
      [
        "AWS describes security of the cloud as the provider’s infrastructure responsibility and security in the cloud as customer responsibilities that vary by service. This distinction is not a claim that every service has the same customer workload. Review the actual control boundary, data classification and access configuration for each selected service.",
        "Customer duties can include identity grants, data handling, encryption configuration and application security under the service’s model. Provider attestations support assurance about their scope, but do not automatically certify a customer’s workload, jurisdictional obligations or permission choices."
      ],
      [
        "Write concrete negative cases: an unauthenticated reader must not receive private invoices, a worker must not gain unrelated storage rights, and logs must not expose customer secrets. Use managed controls with least-privilege policy and verify the intended behavior in an isolated environment before release.",
        "The fixture applies an explicit data-classification rule to synthetic object metadata. It flags a private object whose declared visibility is public. This is a policy consistency check, not a cloud storage scanner, an access test or a legal assessment."
      ]
    ],
    "code": "objects = [{\"id\":\"invoice-demo\", \"classification\":\"private\", \"public\":True}, {\"id\":\"brochure-demo\", \"classification\":\"public\", \"public\":True}]\nprint([o[\"id\"] for o in objects if o[\"classification\"] == \"private\" and o[\"public\"]])",
    "expect": "['invoice-demo']",
    "problem": "Find a contradiction between supplied data classification and visibility intent.",
    "steps": [
      "Read each synthetic classification.",
      "Flag public visibility for a private object.",
      "Report only the safe object label."
    ],
    "limit": "The metadata check does not inspect S3 policies, effective permissions, stored contents or legal compliance.",
    "mistakes": [
      "Treating a provider attestation as workload-specific approval.",
      "Assuming a managed storage name makes every access policy safe."
    ],
    "takeaways": [
      "Translate responsibility into explicit workload controls.",
      "Verify classification and effective access separately."
    ],
    "practice": [
      [
        "What does shared responsibility vary with?",
        "The selected service",
        "Only the logo size",
        "Only the invoice font",
        "The customer’s browser theme",
        "Different service abstractions leave different operational and security tasks with the customer."
      ],
      [
        "What is a customer-side cloud control example?",
        "Identity grant configuration",
        "Physical host replacement in every SaaS",
        "Provider datacenter construction",
        "Every fiber cable repair",
        "Customers often control their workload’s identities and access policy even when infrastructure is managed."
      ],
      [
        "Does a provider attestation certify every customer app?",
        "No",
        "Always",
        "Only if the app is popular",
        "Only for long account names",
        "Assurance applies to its documented scope and does not automatically validate every customer workload."
      ],
      [
        "Why classify data before exposure decisions?",
        "Sensitivity guides policy",
        "Classification encrypts every object",
        "Labels enforce all IAM automatically",
        "All records must be public",
        "Data classification helps determine intended disclosure and handling requirements but needs actual enforcement."
      ],
      [
        "What is inconsistent in the fixture?",
        "A private object marked public",
        "A public brochure marked public",
        "The presence of an object id",
        "Every synthetic classification",
        "The supplied metadata contradicts the declared private-data visibility rule for invoice-demo."
      ],
      [
        "What must remain distinct from declared visibility?",
        "Effective access behavior",
        "A stored boolean by itself",
        "A written metadata field",
        "A classification label",
        "Configuration intent or metadata does not prove the actual path permits or denies access as intended."
      ],
      [
        "Why use negative access cases?",
        "To verify denied paths",
        "To grant broad fallback rights",
        "To publish every private object",
        "To remove every log",
        "Testing unauthorized cases can reveal boundary failures hidden by success-only checks."
      ],
      [
        "What does the fixture not inspect?",
        "Actual cloud policies",
        "The supplied classification",
        "The selected object label",
        "A local boolean expression",
        "The model neither authenticates to a cloud account nor evaluates a real service’s permission engine."
      ]
    ],
    "final": [
      [
        "Which part of shared responsibility is workload-specific?",
        "Customer configuration duties",
        "The provider’s logo design",
        "The universal spelling of cloud",
        "Every datacenter’s street name",
        "Customer obligations depend on selected services, configuration, data and applicable requirements."
      ],
      [
        "What is a provider compliance report not equivalent to?",
        "Customer workload approval",
        "Evidence within its stated scope",
        "A documented provider assurance artifact",
        "A source for scoped review",
        "A provider report does not establish every customer-side configuration, control or legal requirement."
      ],
      [
        "What should private-invoice policy explicitly define?",
        "Permitted readers and handling",
        "Only a friendly bucket name",
        "Only the file extension",
        "A longer organization title",
        "Sensitivity must be translated into concrete intended access and data-lifecycle controls."
      ],
      [
        "A retail storage service is managed but its policy exposes invoices publicly. What failed?",
        "Customer access configuration",
        "The existence of managed storage",
        "The invoice’s ability to have a name",
        "Every datacenter’s power supply",
        "Managed infrastructure does not prevent an overly permissive customer-side disclosure policy by definition."
      ],
      [
        "A worker receives wildcard storage rights to read one prefix. Which principle is weakened?",
        "Least privilege",
        "The ability to store objects",
        "The syntax of an object key",
        "The length of a region name",
        "The grant exceeds the resources and operations actually needed for the workload."
      ],
      [
        "A team labels records private but never tests anonymous reads. What is missing?",
        "Effective access evidence",
        "Only a longer classification label",
        "Only a dashboard screenshot",
        "A new file suffix",
        "A data label expresses intent and needs corresponding enforced policy and relevant negative-case checks."
      ],
      [
        "A production audit copies private payloads into public logs. What secondary boundary failed?",
        "Evidence disclosure policy",
        "Only the application’s title",
        "Only the log’s timestamp format",
        "The service’s product category",
        "Diagnostic evidence itself can leak sensitive data and needs controlled collection and access."
      ],
      [
        "The metadata model flags invoice-demo. Can it prove the live bucket is public?",
        "No, actual policy is untested",
        "Yes, local labels configure S3",
        "Yes, all object ids resolve live",
        "Yes, every private label is a probe",
        "The fixture evaluates supplied data and neither reads nor tests a deployed storage service."
      ],
      [
        "A legal obligation depends on data location. What should the cloud design review include?",
        "Applicable workload requirements",
        "Only a generic provider slogan",
        "Only a shortened service name",
        "The number of documentation pages",
        "Provider infrastructure assurance does not replace evaluating the customer workload’s actual legal and data requirements."
      ],
      [
        "A service changes abstraction level during migration. What should be revisited?",
        "The responsibility boundary",
        "Only the app’s icon",
        "Only the repository name",
        "The number of staff photos",
        "Different service models can shift retained patching, configuration, recovery and operational tasks."
      ]
    ]
  },
  {
    "comp": "m1.c2",
    "title": "Separate Regions, Availability Zones and recovery objectives",
    "intro": "A university wants its portal to survive a local facility failure while keeping records in an approved geography. A Region and an Availability Zone define different infrastructure scopes, and replication is not automatically a complete recovery plan.",
    "headings": [
      "Understand the boundary",
      "Apply it to an operating decision",
      "Check the model and its limits"
    ],
    "sections": [
      [
        "An AWS Region is a geographic infrastructure area containing multiple Availability Zones. An AZ is an isolated location within a Region designed with independent infrastructure characteristics and network connectivity to other zones. Exact available services and zone identifiers are account/context dependent; do not assume a label is a universal physical-location mapping across accounts.",
        "Multi-AZ designs can improve resilience to an individual zone failure, but application topology, state replication, dependency placement and failover behavior determine the result. Multi-Region designs add latency, consistency, cost and operational tradeoffs rather than guaranteeing instant recovery or legal compliance."
      ],
      [
        "Recovery time objective describes the tolerated restoration duration; recovery point objective describes tolerated data loss measured as a time window. Backups, replication and tested restoration support different failure scenarios. A replicated accidental deletion can still require a recoverable backup or versioned recovery strategy.",
        "The fixture counts distinct modeled zones and compares a supplied replication lag with a recovery-point target. It does not locate AWS facilities, measure real replication, run failover or verify regulatory residency. Its output illustrates design evidence that would need actual implementation tests."
      ]
    ],
    "code": "placements = [\"zone-a\", \"zone-a\", \"zone-b\"]\nreplication_lag_minutes = 3\nrpo_minutes = 5\nprint(len(set(placements)))\nprint(replication_lag_minutes <= rpo_minutes)",
    "expect": "2\nTrue",
    "problem": "Check modeled zone diversity and a declared data-loss-window target.",
    "steps": [
      "Count unique zone labels rather than instances.",
      "Compare supplied replication lag and RPO in the same unit.",
      "Keep topology and recovery evidence separate."
    ],
    "limit": "The calculation does not establish actual AZ independence, observed recovery time, data durability or compliance.",
    "mistakes": [
      "Counting three instances in one zone as three independent zones.",
      "Treating replication as a tested restore and complete disaster-recovery plan."
    ],
    "takeaways": [
      "Design across actual failure scopes.",
      "State and test RTO and RPO separately."
    ],
    "practice": [
      [
        "What is an Availability Zone relative to a Region?",
        "A scope within a Region",
        "A universal customer role",
        "Every continent at once",
        "A single application process",
        "AWS Regions contain multiple AZs, while the exact workload placement still needs deliberate design."
      ],
      [
        "What does RTO concern?",
        "Restoration duration",
        "Every byte’s encryption key",
        "The number of user accounts",
        "The DNS record’s spelling",
        "Recovery time objective states the targeted restoration time after a relevant disruption."
      ],
      [
        "What does RPO concern?",
        "Tolerated data-loss window",
        "The port number of a router",
        "The number of source files",
        "Every application’s response schema",
        "Recovery point objective concerns the tolerated age/window of lost data under the recovery requirement."
      ],
      [
        "Why count distinct zones rather than instances?",
        "Instances can share one failure scope",
        "Every instance is a separate region",
        "Names guarantee physical independence",
        "More processes always mean more zones",
        "Several instances in one zone do not provide the same placement diversity as multiple zones."
      ],
      [
        "Does replication replace every backup need?",
        "No",
        "Always",
        "Only for private records",
        "Only with long zone names",
        "Replicated corruption or deletion can require independent recovery capabilities beyond current replicas."
      ],
      [
        "What can multi-Region design add?",
        "Consistency and cost tradeoffs",
        "Automatic legal compliance",
        "Guaranteed zero recovery time",
        "A universal permission model",
        "Cross-Region operation introduces operational and data-management decisions in addition to resilience benefits."
      ],
      [
        "What does the fixture’s two represent?",
        "Distinct supplied zone labels",
        "Verified physical datacenters",
        "A successful real failover",
        "The number of AWS accounts",
        "The set counts labels in supplied model data and does not inspect actual infrastructure."
      ],
      [
        "Why test restoration procedures?",
        "Plans can differ from behavior",
        "A document guarantees every recovery",
        "Backups always restore instantly",
        "RPO automatically configures routing",
        "Observed recovery behavior is needed to evaluate whether the planned process meets its objectives."
      ]
    ],
    "final": [
      [
        "Which scope contains Availability Zones?",
        "A Region",
        "An application thread",
        "A local directory",
        "A user’s role label",
        "AZs are infrastructure locations within an AWS Region rather than application-level identities."
      ],
      [
        "What does a three-minute lag within a five-minute modeled RPO show?",
        "The modeled bound is met",
        "A real recovery was completed",
        "All backups are valid",
        "Every user request is durable",
        "The arithmetic compares declared values and does not measure or execute a recovery operation."
      ],
      [
        "What does RTO differ from?",
        "Tolerated data-loss window",
        "A restoration-time target",
        "A recovery-duration requirement",
        "A specified time objective",
        "RTO concerns restoration duration, while RPO concerns the tolerated data-loss interval."
      ],
      [
        "A portal has three instances all in one zone. What resilience claim is unsupported?",
        "Three-zone placement diversity",
        "Three instances exist",
        "The deployment has compute resources",
        "A topology can have repeated zones",
        "Instance count does not establish separate infrastructure failure scopes."
      ],
      [
        "A replicated table is accidentally deleted in every replica. What recovery capability matters?",
        "Recoverable historical state",
        "Only more identical live replicas",
        "A longer region label",
        "A higher CPU count",
        "Replication can propagate unwanted changes, so historical backup or versioned recovery can be necessary."
      ],
      [
        "A team proposes cross-Region writes with no consistency analysis. What tradeoff needs review?",
        "Replication and state semantics",
        "Only the region’s spelling",
        "Only the app’s button style",
        "The number of office desks",
        "Multi-Region state management can affect consistency, latency, conflicts and failure handling."
      ],
      [
        "A compliance requirement limits data geography. What must be verified?",
        "Actual data placement",
        "Only an application nickname",
        "Only a marketing map",
        "The number of backups listed",
        "The workload’s selected services, replicas and recovery copies must be evaluated against the actual location requirement."
      ],
      [
        "A zone label matches in two accounts. What assumption should be avoided?",
        "It always means one physical zone",
        "Labels can be contextual",
        "Placement needs account context",
        "Provider documentation can define identifiers",
        "AZ naming can be account/context dependent, so labels should not be treated as universal physical mappings without evidence."
      ],
      [
        "A backup job reports success but no restore is tested. What remains uncertain?",
        "Recoverability under the target",
        "That a backup event was reported",
        "That a task returned success",
        "That an artifact may exist",
        "Backup creation evidence is not the same as validated restoration within RTO/RPO requirements."
      ],
      [
        "Can the fixture certify a deployed multi-AZ architecture survives a failure?",
        "No, actual failover evidence is needed",
        "Yes, Python sets create independence",
        "Yes, two labels ensure all resilience",
        "Yes, every replica has zero lag",
        "The local labels and supplied lag do not execute or verify real placement, dependencies or recovery behavior."
      ]
    ]
  },
  {
    "comp": "m2.c1",
    "title": "Select compute from execution and operating constraints",
    "intro": "A retail order service needs request handling, while a nightly conversion job runs only after files arrive. EC2, Lambda and containers offer different execution and operating models; choose from runtime, state, scaling and control requirements.",
    "headings": [
      "Understand the boundary",
      "Apply it to an operating decision",
      "Check the model and its limits"
    ],
    "sections": [
      [
        "EC2 provides virtual machines with substantial guest and application control and corresponding administration. Lambda runs functions under a managed execution model with documented runtime, invocation, duration and resource limits. Containers package processes and dependencies but still need an execution platform; using a container does not by itself define who manages hosts or scaling.",
        "Compare long-running work, startup behavior, dependencies, concurrency, operational visibility and required runtime features. A workload with local durable-state assumptions needs a storage design rather than assuming a function or container filesystem persists across replacement. Check current service limits instead of hardcoding remembered quotas into architecture claims."
      ],
      [
        "A request service and a triggered conversion job can reasonably use different compute models. Managed execution can reduce some maintenance but introduces platform behavior and integration decisions. A successful invocation does not prove downstream business completion or exactly-once effects.",
        "The fixture chooses from a deliberately narrow decision table using supplied requirements. It demonstrates a reasoning aid, not an AWS recommendation engine or cost/performance benchmark. No instance, function or container is launched."
      ]
    ],
    "code": "workloads = [{\"name\":\"daemon\", \"needs_guest_control\":True}, {\"name\":\"event-job\", \"needs_guest_control\":False}]\nprint([(w[\"name\"], \"vm-candidate\" if w[\"needs_guest_control\"] else \"managed-candidate\") for w in workloads])",
    "expect": "[('daemon', 'vm-candidate'), ('event-job', 'managed-candidate')]",
    "problem": "Classify supplied workloads by one explicit operating-control requirement.",
    "steps": [
      "Read the modeled guest-control need.",
      "Return a candidate category rather than a guaranteed final design.",
      "Record other service constraints as remaining review."
    ],
    "limit": "One requirement is insufficient for final compute selection; real limits, dependencies, security, cost and measured behavior remain untested.",
    "mistakes": [
      "Assuming containers automatically remove host-management work.",
      "Treating a function invocation as proof of every external business effect."
    ],
    "takeaways": [
      "Select an execution model from explicit constraints.",
      "Keep state, limits and operational ownership in the decision."
    ],
    "practice": [
      [
        "What does EC2 commonly provide?",
        "Virtual machines",
        "A universal application permission",
        "Only object keys",
        "A complete SaaS workflow",
        "EC2 offers compute instances while the guest and workload still need appropriate management."
      ],
      [
        "What does a container package?",
        "A process environment",
        "A full cloud responsibility exemption",
        "Every user’s identity",
        "A guaranteed physical host",
        "Container packaging does not itself define the hosting platform or remove operational duties."
      ],
      [
        "Why review function limits?",
        "The execution model is bounded",
        "Managed functions have no constraints",
        "Every invocation runs forever",
        "Only names affect compatibility",
        "Managed runtimes have documented limits and lifecycle behavior that must fit the workload."
      ],
      [
        "What should hold durable state across replacement?",
        "An appropriate storage design",
        "Only a temporary local directory",
        "The container’s display name",
        "A function’s current memory",
        "Replaceable execution environments should not be assumed to retain required state indefinitely."
      ],
      [
        "Does an invocation success prove a business workflow finished?",
        "No",
        "Always",
        "Only for event triggers",
        "Only with JSON input",
        "The actual operation contract and downstream effects determine what completion evidence means."
      ],
      [
        "What does the fixture return?",
        "Candidate categories",
        "An actual deployed AWS service",
        "A measured monthly bill",
        "A verified production architecture",
        "The local table illustrates one criterion and does not provision, benchmark or certify a workload."
      ],
      [
        "Why can one app use several compute models?",
        "Its workloads differ",
        "All models are identical",
        "Only one model permits HTTP",
        "Every application needs one VM",
        "Different execution and control requirements can justify different services within one architecture."
      ],
      [
        "What should inform a final selection?",
        "Limits, operations and workload",
        "Only the service’s popularity",
        "Only a guessed price",
        "Only the source file count",
        "A defensible choice evaluates actual requirements and supported behavior rather than one label."
      ]
    ],
    "final": [
      [
        "Which option commonly gives direct guest-OS control?",
        "An EC2-style VM",
        "Every SaaS application",
        "An object-storage key",
        "A DNS cache entry",
        "A VM model provides substantial guest control and corresponding administration responsibilities."
      ],
      [
        "What must a container deployment still choose?",
        "An execution platform",
        "A guarantee of no host lifecycle",
        "A universal storage account",
        "Every customer’s role",
        "Packaging a container does not specify whether hosts, orchestration and scaling are customer- or provider-managed."
      ],
      [
        "Why is local function state not a general durability contract?",
        "Execution environments can be replaced",
        "All files are always replicated",
        "Memory survives every crash",
        "Functions own physical disks forever",
        "Managed execution lifecycle can discard local state, so required persistence needs an appropriate service and contract."
      ],
      [
        "A daemon needs unsupported guest customization. What criterion matters?",
        "Required runtime control",
        "Only the app’s logo",
        "Only its code indentation",
        "The number of documentation links",
        "Service constraints and required operating-system features must match the workload’s needs."
      ],
      [
        "An event job repeats after a delivery retry. Which design remains necessary?",
        "Duplicate-effect handling",
        "A claim managed means exactly once",
        "Only a longer event name",
        "A new function icon",
        "Invocation and delivery mechanisms do not remove the need to define repeated side effects."
      ],
      [
        "A team chooses Lambda without checking duration or dependency needs. What is missing?",
        "Execution-constraint review",
        "Only a new repository label",
        "Only a larger dashboard",
        "The count of users in HR",
        "Runtime limits and supported dependencies must fit the actual job before selection."
      ],
      [
        "A container’s temporary filesystem is used for permanent orders. What boundary is wrong?",
        "Compute versus persistence",
        "Every local write is illegal",
        "Containers cannot hold files",
        "All orders must be public",
        "A replaceable runtime is not a general durable business-state store."
      ],
      [
        "A VM service and a managed job have different patch boundaries. What should be documented?",
        "Operational ownership by service",
        "Only their common project name",
        "Only the team’s office location",
        "A universal serverless slogan",
        "The selected services distribute runtime and platform maintenance differently."
      ],
      [
        "A candidate table picks managed-candidate. Can it certify the cheapest service?",
        "No, cost evidence is separate",
        "Yes, booleans calculate AWS bills",
        "Yes, managed is always cheaper",
        "Yes, every job has identical load",
        "The model does not use measured demand, current pricing or a complete service design."
      ],
      [
        "An order API returns accepted after starting a function. What should be claimed?",
        "The documented accepted state",
        "Every downstream effect completed",
        "Payment settlement is guaranteed",
        "All retries are unnecessary",
        "Acceptance must be distinguished from verified completion of the actual business operation."
      ]
    ]
  },
  {
    "comp": "m2.c1",
    "title": "Match object and block storage to access semantics",
    "intro": "A university stores uploaded lecture files and a virtual machine’s local filesystem. Object storage and block storage solve different access problems, so a familiar filename is not enough to choose the service.",
    "headings": [
      "Understand the boundary",
      "Apply it to an operating decision",
      "Check the model and its limits"
    ],
    "sections": [
      [
        "S3 provides object storage addressed through buckets and object keys under its API and policy model. It is suited to many file-like artifacts, archives and application objects, but is not simply a remote POSIX disk. EBS provides block storage volumes for supported EC2 use, with filesystem and lifecycle design handled in the workload’s operating context.",
        "Compare object access, block-device semantics, latency, throughput, update patterns, sharing, lifecycle and recovery needs. Storage durability, service availability, backup history and authorized access are distinct properties. A durable object can still be disclosed through an incorrect policy or intentionally deleted without an appropriate recovery strategy."
      ],
      [
        "Use explicit lifecycle and retention policy for uploads, temporary artifacts and recovery copies. Encrypt as required, grant only intended readers/writers and test restoration or version recovery for the relevant failure scenario. Do not assume every service class, replication choice or geographic copy satisfies the same requirement.",
        "The fixture routes supplied access requirements to object or block candidates and checks a simple retention classification. It creates no bucket or volume, reads no real files and does not benchmark either service. The output is an educational decision model with intentionally limited criteria."
      ]
    ],
    "code": "needs = {\"lecture_upload\":\"object-api\", \"guest_filesystem\":\"block-device\"}\nchoice = {\"object-api\":\"object-candidate\", \"block-device\":\"block-candidate\"}\nprint([choice[mode] for mode in needs.values()])",
    "expect": "['object-candidate', 'block-candidate']",
    "problem": "Relate two explicit access modes to storage candidates.",
    "steps": [
      "Identify the required API or device abstraction.",
      "Map each requirement to a candidate category.",
      "Leave capacity, recovery and security review separate."
    ],
    "limit": "The fixture is not a storage performance test or proof of any deployed retention, durability or access control.",
    "mistakes": [
      "Treating an object key as a universal POSIX filesystem path.",
      "Equating durability with authorization or historical recoverability."
    ],
    "takeaways": [
      "Choose storage by access semantics and lifecycle.",
      "Test recovery and permissions as separate requirements."
    ],
    "practice": [
      [
        "What abstraction does S3 primarily expose?",
        "Objects through an API",
        "A universal POSIX disk",
        "Every process’s RAM",
        "A guaranteed user role",
        "Object storage uses service-specific API semantics rather than being identical to a local filesystem."
      ],
      [
        "What does EBS primarily provide?",
        "Block volumes",
        "Only web-page templates",
        "A finished SaaS portal",
        "A global DNS hierarchy",
        "Block storage presents a device-style abstraction for supported compute use and needs workload-level design."
      ],
      [
        "Why compare update patterns?",
        "Access semantics affect fit",
        "All storage operations are identical",
        "Only file names determine cost",
        "Every write must be public",
        "Object and block access models have different operational and workload tradeoffs."
      ],
      [
        "Does durability prove authorized access?",
        "No",
        "Always",
        "Only for private objects",
        "Only with a short key",
        "Data persistence properties and permission enforcement are separate controls."
      ],
      [
        "What does a retention policy define?",
        "Data lifecycle policy",
        "Every user’s password",
        "The kernel scheduler",
        "Only a filename’s color",
        "Retention and lifecycle rules govern keeping or retiring data under workload requirements."
      ],
      [
        "What should recovery planning test?",
        "The intended restore case",
        "Only that an upload succeeded",
        "Only a service icon",
        "The length of a bucket label",
        "Creation or replication evidence does not establish recovery behavior for deletion, corruption or disaster."
      ],
      [
        "What does the fixture provision?",
        "Nothing",
        "A live S3 bucket",
        "An EC2 volume",
        "A public storage policy",
        "The local dictionaries model candidate selection without cloud API calls or resource creation."
      ],
      [
        "What remains after choosing object storage?",
        "Policy and lifecycle design",
        "A guarantee all data is public",
        "Automatic legal approval",
        "No further operational work",
        "The selected abstraction still needs appropriate permissions, retention, protection and recovery behavior."
      ]
    ],
    "final": [
      [
        "Which service abstraction is object-oriented storage?",
        "S3-style object APIs",
        "An attached block-device filesystem",
        "A process heap",
        "A local CPU register",
        "Object storage is addressed through object-service semantics rather than block-device operations."
      ],
      [
        "Which requirement suggests a block-storage candidate?",
        "A guest filesystem device",
        "Only public web images by definition",
        "A DNS lookup",
        "A user’s role name",
        "A workload expecting a block device and filesystem differs from one using object operations."
      ],
      [
        "What does a durable copy not necessarily provide?",
        "Historical recovery",
        "Some persistence assurance",
        "Stored data under its contract",
        "A retained current representation",
        "Replicating or retaining current state is not equivalent to recovering from earlier deletion or corruption."
      ],
      [
        "A lecture upload service assumes every object key supports local rename semantics. What needs correction?",
        "The storage API model",
        "Only the filename’s length",
        "Only the app’s brand",
        "The number of readers",
        "Object APIs and local filesystem operations can have different semantics and must not be interchanged casually."
      ],
      [
        "A team declares invoices secure because storage is durable but permits anonymous reads. What failed?",
        "Access policy",
        "The existence of stored objects",
        "The ability to choose a service",
        "The mathematical object count",
        "Durability does not prevent disclosure when the workload’s permission policy is wrong."
      ],
      [
        "A VM loses local working files after replacement. What requirement was missing?",
        "Persistence lifecycle",
        "Only a longer instance name",
        "A new file suffix",
        "A different console theme",
        "Required data must be placed and retained under a storage contract that survives the relevant compute lifecycle."
      ],
      [
        "A recovery copy is stored in another location. What must still be reviewed?",
        "Recovery and placement",
        "Only its reassuring label",
        "Only the folder icon",
        "Only the backup filename",
        "Copies need tested restoration, access controls and placement consistent with the workload’s actual requirements."
      ],
      [
        "The fixture chooses object-candidate for uploads. Can it certify performance targets?",
        "No, measurement is separate",
        "Yes, dictionary lookup benchmarks S3",
        "Yes, objects have no latency",
        "Yes, all uploads have one size",
        "The model evaluates an abstraction choice without representative service throughput or latency evidence."
      ],
      [
        "An administrator configures automatic data deletion. What should be explicit?",
        "Retention and recovery policy",
        "Only the task’s title",
        "Only the object’s suffix",
        "The number of console tabs",
        "Lifecycle deletion can affect business and recovery obligations and must follow the actual intended policy."
      ],
      [
        "A storage service encrypts data at rest. What customer control remains necessary?",
        "Who may read the data",
        "Only a new diagram color",
        "Only a longer volume id",
        "The keyboard layout",
        "Encryption at rest does not replace authorization controlling service-mediated reads and disclosure."
      ]
    ]
  },
  {
    "comp": "m2.c1",
    "title": "Use managed databases with explicit data and recovery contracts",
    "intro": "A retail application needs relational constraints and transactions for orders. A managed database can reduce engine operations, but schema, query correctness, permissions, capacity and recovery still need deliberate design.",
    "headings": [
      "Understand the boundary",
      "Apply it to an operating decision",
      "Check the model and its limits"
    ],
    "sections": [
      [
        "RDS provides managed relational database offerings under supported engine and deployment options. The service can manage selected infrastructure and maintenance tasks, while the customer still owns workload choices such as schema, queries, data access and appropriate configuration. Service features, versions and failover behavior depend on the selected offering.",
        "Object storage is not a substitute for a transactional relational workload merely because it stores bytes. Likewise a database is not always the best place for large unstructured upload artifacts. Connect access patterns, consistency needs, recovery objectives and operations before choosing the persistence component."
      ],
      [
        "Backups and high availability address different failures. A failover replica can improve availability but may reproduce an unwanted write; a backup still needs restore testing and retention aligned with recovery requirements. Manage connection pools and transient errors without blindly replaying non-idempotent business operations.",
        "The fixture uses isolated SQLite to demonstrate a small relational invariant, not to emulate RDS or a specific engine’s deployed behavior. It rejects a negative quantity through a CHECK constraint and confirms the valid row. No production database URL or cloud account is used."
      ]
    ],
    "code": "import sqlite3\ndb = sqlite3.connect(\":memory:\")\ndb.execute(\"CREATE TABLE items(id INTEGER PRIMARY KEY, quantity INTEGER NOT NULL CHECK(quantity > 0))\")\ndb.execute(\"INSERT INTO items VALUES(1, 2)\")\ntry:\n    db.execute(\"INSERT INTO items VALUES(2, -1)\")\nexcept sqlite3.IntegrityError:\n    print(\"rejected\")\nprint(db.execute(\"SELECT quantity FROM items WHERE id=1\").fetchone()[0])\ndb.close()",
    "expect": "rejected\n2",
    "problem": "Verify one relational constraint using a fresh in-memory database.",
    "steps": [
      "Create a synthetic constrained table.",
      "Observe rejection of the invalid row.",
      "Read the valid row without contacting another engine."
    ],
    "limit": "SQLite verifies this fixture’s constraint only; it does not establish RDS failover, engine equivalence, concurrency or operational performance.",
    "mistakes": [
      "Assuming managed database operation makes every query and permission safe.",
      "Treating a replica as protection against every unwanted write."
    ],
    "takeaways": [
      "Match relational requirements to the selected engine contract.",
      "Test restore and failover separately with appropriate infrastructure."
    ],
    "practice": [
      [
        "What does a managed database not remove?",
        "Schema and access duties",
        "All workload data by definition",
        "Every supported engine feature",
        "The existence of storage",
        "Customers retain responsibility for correct schema, queries and data access under the service model."
      ],
      [
        "Why choose a relational engine for order invariants?",
        "Its data-operation contract fits",
        "The name always guarantees profit",
        "Every object store is identical",
        "Only row count matters",
        "Transactions, constraints and query requirements should drive a relational persistence decision."
      ],
      [
        "What differs from backup recovery?",
        "Availability failover",
        "A retained recovery artifact",
        "A historical restore point",
        "A recovery copy",
        "Failover serves availability while backups can support recovery from historical data loss or unwanted changes."
      ],
      [
        "Does a replica prevent every accidental deletion?",
        "No",
        "Always",
        "Only for short table names",
        "Only with a public endpoint",
        "Replication can propagate unwanted data changes, so recovery needs a broader design."
      ],
      [
        "What should a connection pool bound?",
        "Database connection use",
        "Every user’s authority automatically",
        "All customer passwords",
        "The region’s physical size",
        "A pool controls workload connections and must fit engine and application capacity."
      ],
      [
        "What does the SQLite fixture reject?",
        "A negative quantity",
        "Every valid order",
        "A cloud region",
        "A database username",
        "The CHECK constraint requires a positive quantity in the synthetic table."
      ],
      [
        "What must retry handling consider?",
        "The operation’s effect",
        "Only a new query title",
        "Only a longer hostname",
        "The dashboard’s color",
        "A transient error can leave an uncertain business outcome, so replay needs appropriate semantics."
      ],
      [
        "Does the fixture test RDS failover?",
        "No",
        "Always",
        "Only if SQLite imports",
        "Only with an integer key",
        "The in-memory local engine does not contact or reproduce a managed database deployment."
      ]
    ],
    "final": [
      [
        "Which responsibility remains with a managed relational workload?",
        "Correct queries and schema",
        "Physical datacenter construction",
        "Every provider disk replacement",
        "All service hardware procurement",
        "Managed infrastructure does not create correct business data rules and access behavior by itself."
      ],
      [
        "Why distinguish failover from restore?",
        "They address different failures",
        "They are universally identical",
        "Backups always serve live traffic",
        "Every replica is a historical archive",
        "Availability mechanisms and historical recovery capabilities solve different operational problems."
      ],
      [
        "What does the fixture prove about its CHECK rule?",
        "It rejects the shown invalid row",
        "RDS has identical concurrency behavior",
        "All cloud databases are secure",
        "Every future query is correct",
        "The isolated SQLite test supports only the declared fixture’s observed constraint behavior."
      ],
      [
        "An app stores order transitions as arbitrary object overwrites without its required relational invariants. What needs review?",
        "The persistence contract",
        "Only the object key’s spelling",
        "Only a new console tab",
        "The count of regions",
        "The chosen storage model must support the workload’s actual consistency, integrity and access needs."
      ],
      [
        "A managed database is public with broad credentials. What boundary still matters?",
        "Customer access configuration",
        "Only the engine’s popularity",
        "Only the maintenance-window name",
        "The provider’s marketing label",
        "Service management does not automatically impose the customer’s least-privilege and exposure requirements."
      ],
      [
        "A deleted record is rapidly removed from every replica. What might recover earlier state?",
        "A tested historical restore",
        "Only another current replica",
        "A longer table name",
        "A new connection-pool label",
        "Historical recovery needs an appropriate retained point and verified restoration procedure."
      ],
      [
        "A transient connection error appears after an order write. Why avoid blind retry?",
        "The effect can be uncertain",
        "Every error guarantees rollback",
        "All writes are read-only",
        "Connections grant exactly-once semantics",
        "A client-visible failure does not by itself settle whether the remote business operation committed."
      ],
      [
        "A team validates only SQLite and claims production RDS performance. What evidence is missing?",
        "The actual engine workload test",
        "Only more synthetic row names",
        "Only a larger code block",
        "The number of Python imports",
        "A local engine fixture does not establish managed-service behavior, capacity or representative performance."
      ],
      [
        "A large upload artifact and transactional order row share one app. Must they use one storage model?",
        "No, requirements can differ",
        "Yes, every app has one persistence API",
        "Yes, all bytes need identical semantics",
        "Yes, a database label fixes every need",
        "Different data access and integrity requirements can justify different persistence components."
      ],
      [
        "A backup reports success but restoration misses the target duration. What needs correction?",
        "The recovery capability",
        "Only the backup’s friendly name",
        "Only the table title",
        "The number of dashboard icons",
        "Recovery objectives require tested behavior rather than merely a successful backup-creation status."
      ]
    ]
  },
  {
    "comp": "m3.c1",
    "title": "Estimate cloud spend with explicit units and uncertainty",
    "intro": "A customer-support team needs a monthly cost estimate before choosing a workload design. A price per hour or per request is only one part of a bill; demand, storage, transfer, managed features and discounts can all matter.",
    "headings": [
      "Understand the boundary",
      "Apply it to an operating decision",
      "Check the model and its limits"
    ],
    "sections": [
      [
        "Break an estimate into measurable usage dimensions: instance-hours, requests, retained storage, data movement and other service-specific charges. Use current official pricing for the selected region and offering, and record whether values are estimates, negotiated rates or observed bill data. Do not present a synthetic lesson rate as an AWS quote.",
        "Separate fixed assumptions from uncertain demand. Peak concurrency, retries, growth, replication and transfer can change costs. Currency, time units, included allowances, taxes and commitment terms need explicit treatment in a real financial decision. A cheap per-unit price does not establish the cheapest complete architecture."
      ],
      [
        "Calculate a base case and meaningful demand variations before choosing a commitment. Monitor actual usage after release and reconcile differences rather than assuming the estimate is a cap. Budget alerts can support decisions but do not automatically prevent all charges.",
        "The fixture uses Decimal for a clearly invented hourly rate and a fixed usage count, then doubles the demand. It demonstrates unit-consistent arithmetic without fetching AWS pricing, reading billing records or making a purchase."
      ]
    ],
    "code": "from decimal import Decimal\nfixture_rate = Decimal(\"0.10\")\nusage_hours = Decimal(\"100\")\nprint(fixture_rate * usage_hours)\nprint(fixture_rate * usage_hours * 2)",
    "expect": "10.00\n20.00",
    "problem": "Compare two synthetic usage estimates using an invented unit rate.",
    "steps": [
      "Label the rate as a fixture rather than provider pricing.",
      "Multiply compatible units with decimal arithmetic.",
      "Evaluate a doubled-demand case."
    ],
    "limit": "The numbers are not current AWS prices, a complete bill or a contractual spending limit.",
    "mistakes": [
      "Treating a unit-price example as a complete provider quote.",
      "Ignoring transfer, replication or retry-driven demand."
    ],
    "takeaways": [
      "State units, source and uncertainty.",
      "Reconcile estimates with observed usage after release."
    ],
    "practice": [
      [
        "What should accompany a cost number?",
        "Usage and rate assumptions",
        "Only a provider logo",
        "Only an instance nickname",
        "Only the source-file count",
        "A meaningful estimate explains the measured dimensions and rates producing the amount."
      ],
      [
        "Why use current pricing for a real decision?",
        "Rates depend on offering and context",
        "Fixture rates are official quotes",
        "Every region always costs the same",
        "All services have one permanent rate",
        "Actual service, region and commercial terms matter to a real cost calculation."
      ],
      [
        "What can retries change financially?",
        "Consumed usage",
        "Only the request’s font",
        "The legal currency symbol",
        "The name of the billing month",
        "Repeated work can consume additional requests, compute or transfer under the relevant charging model."
      ],
      [
        "What does a low unit price not prove?",
        "Lowest total design cost",
        "The unit has a price",
        "A rate can be multiplied",
        "A service can have usage",
        "Total cost depends on the full design and demand, not one isolated rate."
      ],
      [
        "What is the lesson rate?",
        "An invented fixture value",
        "A guaranteed AWS quote",
        "A negotiated contract",
        "The current bill",
        "The example explicitly uses synthetic arithmetic values rather than provider pricing data."
      ],
      [
        "Does an estimate cap actual spend?",
        "No",
        "Always",
        "Only if written in Decimal",
        "Only for short job names",
        "An estimate is a forecast under assumptions and is not an enforcement or commercial limit."
      ],
      [
        "Why compare demand scenarios?",
        "Usage is uncertain",
        "All customers use the same load",
        "Prices alone determine traffic",
        "Every forecast is exact",
        "Sensitivity analysis shows how cost changes when plausible workload assumptions differ."
      ],
      [
        "What does Decimal help represent here?",
        "Exact decimal arithmetic",
        "Live AWS billing state",
        "All legal tax rules",
        "Every currency conversion",
        "The class supports decimal calculations but does not supply rates or complete financial policy."
      ]
    ],
    "final": [
      [
        "What should a defensible cost estimate disclose?",
        "Its rates and usage basis",
        "Only the total’s font",
        "Only a product slogan",
        "The number of team members",
        "Readers need explicit assumptions and data sources to assess a forecast’s meaning and uncertainty."
      ],
      [
        "What must remain separate from synthetic pricing?",
        "A real provider quote",
        "A labeled classroom example",
        "A local multiplication result",
        "An invented unit rate",
        "A lesson’s made-up values cannot be presented as current service prices or contractual terms."
      ],
      [
        "Why include transfer and replication in review?",
        "They can add bill dimensions",
        "Only compute can ever cost money",
        "All data movement is free",
        "Storage names define every charge",
        "The full architecture can consume several chargeable resources beyond the obvious compute component."
      ],
      [
        "A team estimates100hours at a fixture0.10rate. What is the modeled amount?",
        "10.00",
        "100.00",
        "0.10",
        "1000.00",
        "Multiplying100compatible hour units by0.10per hour produces10.00in the declared synthetic currency units."
      ],
      [
        "Demand doubles while the model’s unit rate stays constant. What happens to that component?",
        "It doubles",
        "It always stays fixed",
        "It becomes zero",
        "It becomes a spending cap",
        "The linear fixture doubles its usage component, while real service pricing can require a richer model."
      ],
      [
        "An architecture is selected from the lowest VM hourly rate alone. What is missing?",
        "The full workload cost model",
        "Only a longer VM label",
        "Only the chart’s title",
        "The number of deployment files",
        "Storage, transfer, scaling, operations and required service features can change the complete cost comparison."
      ],
      [
        "A customer treats a budget forecast as a guaranteed maximum bill. What needs correction?",
        "Forecast versus enforcement",
        "Only a currency symbol",
        "Only the budget’s nickname",
        "The region’s spelling",
        "A forecast under assumptions is not itself a technical or contractual prevention of higher charges."
      ],
      [
        "An estimate omits retry traffic during dependency failures. Which uncertainty matters?",
        "Failure-driven usage amplification",
        "Only the request’s capitalization",
        "Only the monitoring logo",
        "The number of source comments",
        "Retries and other repeated work can increase consumed resources beyond the happy-path demand model."
      ],
      [
        "A commitment is purchased from one optimistic usage guess. What should precede that choice?",
        "Demand and term review",
        "Only renaming the project",
        "Only a shorter invoice number",
        "A new office chart",
        "Financial commitments should be evaluated against realistic demand uncertainty and the actual commercial conditions."
      ],
      [
        "Can this Decimal example certify the next AWS invoice?",
        "No, actual billing evidence is needed",
        "Yes, all services share the fixture rate",
        "Yes, decimal math fetches pricing",
        "Yes, taxes and transfer are always zero",
        "The fixture neither retrieves provider pricing nor includes a complete deployed usage and billing model."
      ]
    ]
  },
  {
    "comp": "m3.c1",
    "title": "Use budgets and alerts as decision support, not universal stop switches",
    "intro": "A university sets an alert for cloud spend and assumes costs cannot exceed it. Budgets, forecasts, notifications and configured actions are different mechanisms with timing and scope that must be understood.",
    "headings": [
      "Understand the boundary",
      "Apply it to an operating decision",
      "Check the model and its limits"
    ],
    "sections": [
      [
        "AWS Budgets supports monitoring cost or usage and configured notifications and actions under its documented features. Billing information and alerts have processing and delivery behavior; do not assume a budget threshold instantly stops every resource or guarantees no additional charges. The configured action scope and prerequisites matter.",
        "Choose thresholds from expected usage, risk and who can respond. Alerts need accountable ownership, appropriate delivery channels and a runbook explaining investigation, approval and safe corrective actions. Automatically stopping a critical service can reduce spend while violating availability or data-processing obligations."
      ],
      [
        "Investigate whether a rise comes from expected demand, a configuration error, waste, a pricing assumption or unauthorized activity. Preserve useful evidence and avoid deleting production resources blindly. Cost control should respect security, reliability and recovery requirements.",
        "The fixture compares synthetic actual spend with a threshold and creates one alert label. It does not read AWS billing, send a notification, configure a budget action or stop a resource. The comparison demonstrates a trigger condition, not timely delivery or enforcement."
      ]
    ],
    "code": "actual = 120\nthreshold = 100\nalerts = [\"review_required\"] if actual >= threshold else []\nprint(alerts)\nprint(actual <= threshold)",
    "expect": "['review_required']\nFalse",
    "problem": "Distinguish a supplied alert trigger from a spending-cap guarantee.",
    "steps": [
      "Compare actual and threshold under the declared rule.",
      "Create a review signal when the boundary is reached.",
      "Observe that the alert does not change the spend value."
    ],
    "limit": "A local comparison is not billing ingestion, notification delivery or an automatic resource-control mechanism.",
    "mistakes": [
      "Treating a notification threshold as a universal instant cap.",
      "Stopping critical resources without impact and recovery review."
    ],
    "takeaways": [
      "Assign ownership and a cost-response runbook.",
      "Understand alert latency, configured action scope and operational tradeoffs."
    ],
    "practice": [
      [
        "What is a budget alert distinct from?",
        "A universal spending cap",
        "A notification condition",
        "A configured signal",
        "A threshold-based review cue",
        "A notification does not by itself prevent all future charges or stop every resource."
      ],
      [
        "Why assign an alert owner?",
        "Someone must respond",
        "Ownership automatically stops costs",
        "Every inbox is always monitored",
        "Names enforce billing policy",
        "Cost signals need accountable investigation and response rather than merely existing configuration."
      ],
      [
        "What can alert processing involve?",
        "Delay and delivery behavior",
        "A guarantee of instant action",
        "Universal resource deletion",
        "Automatic legal approval",
        "Billing data and notification paths have documented timing and behavior that affect response."
      ],
      [
        "What should a cost runbook consider?",
        "Service-impact review",
        "Only the project’s color",
        "Only the account nickname",
        "Every employee’s password",
        "Corrective action must account for availability, security, data and recovery consequences."
      ],
      [
        "What does the fixture’s alert change?",
        "Only the review signal",
        "The actual spend value",
        "Every cloud resource’s state",
        "The provider’s invoice terms",
        "The local code emits a label and leaves the supplied actual amount unchanged."
      ],
      [
        "Why investigate the cause of a rise?",
        "Cause-specific responses",
        "All increases are attacks",
        "All increases are harmless",
        "Every increase requires deletion",
        "Demand, waste, errors and unauthorized use can require different corrective decisions."
      ],
      [
        "Does a configured action always affect every resource?",
        "No",
        "Always",
        "Only when a label is short",
        "Only at midnight",
        "Budget action behavior depends on actual supported configuration, scope and prerequisites."
      ],
      [
        "What should not appear in a public cost incident?",
        "Reusable credentials",
        "A safe aggregate amount",
        "A nonsecret workload category",
        "The existence of an alert",
        "Cost investigation evidence should not expose cloud credentials or private operational details."
      ]
    ],
    "final": [
      [
        "What does threshold detection prove by itself?",
        "The comparison condition matched",
        "Every resource was stopped",
        "No more charges can occur",
        "The notification was delivered instantly",
        "A trigger condition is separate from delivery, response and enforcement behavior."
      ],
      [
        "Why are budget actions scope-dependent?",
        "Configuration defines effects",
        "All alerts delete every service",
        "Thresholds rewrite provider terms",
        "Every resource has one universal switch",
        "Supported actions and their prerequisites determine what a particular budget automation can do."
      ],
      [
        "What should accompany a cost alert?",
        "An accountable response path",
        "Only an unmonitored inbox",
        "A public credential dump",
        "A blanket deletion command",
        "A practical alert needs an owner, channel and runbook for safe investigation and correction."
      ],
      [
        "A university crosses its alert threshold but spending continues. What assumption was wrong?",
        "Alert equals instant cap",
        "Costs can be measured",
        "Thresholds can trigger signals",
        "Owners can review resources",
        "Notification configuration is not a universal guarantee that every subsequent charge is prevented."
      ],
      [
        "An automated response stops the admissions database during registration. What tradeoff was ignored?",
        "Cost versus service needs",
        "Only the database’s label",
        "Only the number of alerts",
        "The chart’s axis color",
        "Cost actions must consider availability, processing and recovery requirements rather than optimizing spend alone."
      ],
      [
        "An alert email is never received although the threshold matched. What needs verification?",
        "The delivery and response path",
        "Only the threshold’s font",
        "Only a larger dashboard",
        "The workload’s repository name",
        "Trigger evaluation does not establish that the intended notification channel and responsible team received it."
      ],
      [
        "A cost rise follows legitimate enrollment demand. Which response is defensible?",
        "Review demand and efficiency",
        "Assume every increase is malicious",
        "Delete all records instantly",
        "Disable identity controls",
        "Cost diagnosis should use workload context before choosing a proportionate operational action."
      ],
      [
        "A team blindly deletes backup resources to reduce spend. What requirement may be harmed?",
        "Recovery capability",
        "The number of chart labels",
        "Only a browser preference",
        "The length of a region string",
        "Cost optimization must preserve required retention, restoration and resilience capabilities."
      ],
      [
        "The fixture emits review_required at120versus100. What remains untested?",
        "Real billing and controls",
        "The local comparison result",
        "The supplied numeric values",
        "The printed label",
        "No billing system, notification path or cloud action is accessed by this deterministic model."
      ],
      [
        "A budget monitor handles credentials from an incident report. What policy remains necessary?",
        "Controlled secret handling",
        "Publishing all evidence publicly",
        "Disabling audit trails",
        "Granting every reviewer administrator",
        "Cost operations still operate within security boundaries and must protect authority-bearing data."
      ]
    ]
  },
  {
    "comp": "m3.c1",
    "title": "Allocate spend with tags and optimize without breaking requirements",
    "intro": "A SaaS team wants to understand which product consumes shared infrastructure. Tags and allocation rules help accountability, while right-sizing needs measured demand and service objectives rather than an arbitrary reduction target.",
    "headings": [
      "Understand the boundary",
      "Apply it to an operating decision",
      "Check the model and its limits"
    ],
    "sections": [
      [
        "Tags attach key-value metadata to supported resources and can support organization and cost allocation under the relevant service and billing configuration. Coverage is not universal, and a tag does not automatically prove ownership, prevent access or retroactively assign every historical charge. Define required keys, accountable owners and how unallocated shared costs are handled.",
        "Right-sizing compares actual utilization and workload needs with chosen capacity. An idle resource may be waste, a deliberate failover reserve, a scheduled workload or a mismeasured component. Consider peak demand, latency, reliability and recovery before removing capacity or changing commitments."
      ],
      [
        "Evaluate optimization as a change: identify a hypothesis, measure a relevant baseline, test the new configuration in isolation, preserve rollback and compare the workload’s service objectives afterward. A lower bill with broken availability is not a successful requirement-preserving change.",
        "The fixture aggregates supplied synthetic costs by a validated product label, placing missing labels into unallocated. It does not read billing exports, verify AWS tag activation or establish that every real cost is allocatable. The arithmetic supports an honest review inventory rather than forced false precision."
      ]
    ],
    "code": "costs = [{\"product\":\"portal\", \"amount\":4}, {\"product\":\"portal\", \"amount\":6}, {\"amount\":3}]\ntotals = {}\nfor row in costs:\n    key = row.get(\"product\", \"unallocated\")\n    totals[key] = totals.get(key, 0) + row[\"amount\"]\nprint(totals)",
    "expect": "{'portal': 10, 'unallocated': 3}",
    "problem": "Allocate supplied costs while preserving a visible missing-tag bucket.",
    "steps": [
      "Read the declared product label when present.",
      "Aggregate amounts without dropping unmatched records.",
      "Retain unallocated cost explicitly for review."
    ],
    "limit": "This is a supplied-data aggregation, not a live billing reconciliation or proof of AWS tag coverage and activation.",
    "mistakes": [
      "Dropping untagged charges to make the allocation chart look complete.",
      "Removing reserve capacity without checking reliability requirements."
    ],
    "takeaways": [
      "Keep attribution gaps visible.",
      "Optimize against measured demand and the full service contract."
    ],
    "practice": [
      [
        "What do resource tags provide?",
        "Key-value metadata",
        "Automatic universal IAM approval",
        "A guarantee all charges are allocated",
        "A replacement for every owner review",
        "Tags can support organization and allocation but are not universal enforcement or coverage mechanisms."
      ],
      [
        "Why retain unallocated cost?",
        "It exposes attribution gaps",
        "It makes missing data disappear",
        "Every cost has a trusted product",
        "Tags retroactively fix all history",
        "A visible unmatched bucket avoids hiding costs that the chosen mapping cannot honestly assign."
      ],
      [
        "What should guide right-sizing?",
        "Measured workload needs",
        "Only the lowest possible capacity",
        "Only a manager’s favorite number",
        "The shortest resource name",
        "Capacity changes should reflect demand and objectives rather than an arbitrary reduction alone."
      ],
      [
        "Can an idle instance be deliberate?",
        "Yes",
        "Never",
        "Only if its name is long",
        "Only with no tags",
        "Idle capacity may serve failover, burst or scheduled requirements and needs contextual review."
      ],
      [
        "What should optimization preserve?",
        "Service and recovery requirements",
        "Only the chart’s appearance",
        "Every previous price assumption",
        "A universal zero-cost goal",
        "A lower cost is not success if the change violates required availability, latency, security or recovery."
      ],
      [
        "What does a product tag not automatically establish?",
        "Actual accountable ownership",
        "That metadata exists",
        "That a key has a value",
        "A possible allocation label",
        "A label needs governance and verification before it can be treated as a reliable ownership record."
      ],
      [
        "What does the fixture assign missing labels to?",
        "unallocated",
        "portal automatically",
        "A real AWS account",
        "A new billing currency",
        "Missing attribution is retained in an explicit category instead of silently discarded or guessed."
      ],
      [
        "What should follow a capacity change?",
        "Relevant behavior comparison",
        "Deleting every baseline",
        "Assuming cheaper means healthy",
        "Disabling all load tests",
        "The changed workload should be checked against its objectives and recovery plan using appropriate evidence."
      ]
    ],
    "final": [
      [
        "What is an honest response to incomplete allocation metadata?",
        "Keep an unallocated category",
        "Drop unmatched spend",
        "Assign every gap to the largest team",
        "Invent product labels",
        "Incomplete mapping should remain visible rather than creating false attribution precision."
      ],
      [
        "What does right-sizing require beyond one idle snapshot?",
        "Workload and objective context",
        "Only the resource’s nickname",
        "Only a lower target number",
        "A new billing-chart style",
        "Peak, reserve, scheduled and recovery needs can make a single low-utilization sample misleading."
      ],
      [
        "What can tag governance define?",
        "Required keys and owners",
        "Every provider’s legal terms",
        "All physical datacenter routes",
        "A universal encryption algorithm",
        "Governance makes labels consistent and accountable but does not replace unrelated technical controls."
      ],
      [
        "A team removes failover capacity because it looks idle. What may be lost?",
        "Required resilience",
        "Only a nicer graph",
        "A longer resource label",
        "The number of invoices",
        "Reserve resources can exist to meet failure-handling objectives rather than steady-state utilization."
      ],
      [
        "A cost chart excludes all untagged rows. What is wrong?",
        "It hides attribution gaps",
        "It proves every owner is known",
        "It validates tag enforcement",
        "It guarantees lower actual spend",
        "Discarding unallocated charges makes the chart incomplete without reducing the real cost."
      ],
      [
        "An optimizer halves capacity and violates response-time targets. Was the requirement-preserving change successful?",
        "No",
        "Yes if the bill is lower",
        "Yes if the graph is attractive",
        "Yes if all tags exist",
        "Optimization must meet the workload’s service requirements as well as its cost goal."
      ],
      [
        "A resource has product=portal. Does that alone authorize access to its data?",
        "No, permissions are separate",
        "Yes, every product tag grants all users",
        "Yes, labels replace IAM",
        "Yes, allocation metadata is a credential",
        "Tagging for organization or cost does not automatically create the intended data-access authority."
      ],
      [
        "The synthetic aggregation totals portal10and unallocated3. What did it verify?",
        "Supplied grouping math",
        "A complete AWS invoice",
        "All tag activation settings",
        "Real ownership approval",
        "The local list transformation does not retrieve billing or inspect cloud tag configuration."
      ],
      [
        "A service cannot apply the desired allocation tag to every charge. What should the report state?",
        "The coverage limitation",
        "A claim allocation is complete",
        "Only the product’s logo",
        "A guessed perfect mapping",
        "Honest allocation distinguishes supported tagged costs, shared rules and remaining unattributed amounts."
      ],
      [
        "A proposed optimization has no rollback plan. What operational step is missing?",
        "Recovery from unintended effects",
        "Only a shorter change title",
        "Only a new tag prefix",
        "A different cost-chart color",
        "Cost changes can harm workload behavior and need an appropriate recovery path like other operational changes."
      ]
    ]
  }
];
const refs=[
  {
    "id": "aws-shared-responsibility",
    "title": "AWS official shared responsibility guidance",
    "url": "https://aws.amazon.com/compliance/shared-responsibility-model/",
    "source": {
      "kind": "official-http-snapshot",
      "repo": "aws/official-documentation-snapshots",
      "path": "shared-responsibility.html",
      "url": "https://aws.amazon.com/compliance/shared-responsibility-model/",
      "sha256": "d40bce9b61cf522712d759809ee22d38d0610a4e785e9f4da2a87bc52e38a43b",
      "fetched_at": "2026-11-09T17:12:01.371159+00:00"
    }
  },
  {
    "id": "aws-global-infrastructure",
    "title": "AWS official global infrastructure guidance",
    "url": "https://docs.aws.amazon.com/global-infrastructure/latest/regions/aws-regions-availability-zones.html",
    "source": {
      "kind": "official-http-snapshot",
      "repo": "aws/official-documentation-snapshots",
      "path": "global-infrastructure.html",
      "url": "https://docs.aws.amazon.com/global-infrastructure/latest/regions/aws-regions-availability-zones.html",
      "sha256": "c9f3d179d619bfef8722b75b45fb1d5f3dec8f444f53506ca1e66216b946be31",
      "fetched_at": "2026-11-09T17:12:01.371314+00:00"
    }
  },
  {
    "id": "aws-cloud-overview",
    "title": "AWS official cloud overview guidance",
    "url": "https://docs.aws.amazon.com/whitepapers/latest/aws-overview/what-is-cloud-computing.html",
    "source": {
      "kind": "official-http-snapshot",
      "repo": "aws/official-documentation-snapshots",
      "path": "cloud-overview.html",
      "url": "https://docs.aws.amazon.com/whitepapers/latest/aws-overview/what-is-cloud-computing.html",
      "sha256": "acfe204351970dbea9ef87c6ecd434caf63a3fee147324ad0e2fe200ae2474b1",
      "fetched_at": "2026-11-09T17:12:01.371426+00:00"
    }
  },
  {
    "id": "aws-cost-management",
    "title": "AWS official cost management guidance",
    "url": "https://docs.aws.amazon.com/cost-management/latest/userguide/budgets-managing-costs.html",
    "source": {
      "kind": "official-http-snapshot",
      "repo": "aws/official-documentation-snapshots",
      "path": "cost-management.html",
      "url": "https://docs.aws.amazon.com/cost-management/latest/userguide/budgets-managing-costs.html",
      "sha256": "8ef78fef6163b8168f8409b47e7ded0f55649f6907cb487522b8138cc226a2c2",
      "fetched_at": "2026-11-09T17:12:01.371523+00:00"
    }
  }
];
refs.push(pythonRef('decimal'));
const built=build('cloud-aws-foundations',data,refs);
module.exports=built.course;
Object.defineProperty(module.exports,'__bank',{value:built.bank,enumerable:false});
