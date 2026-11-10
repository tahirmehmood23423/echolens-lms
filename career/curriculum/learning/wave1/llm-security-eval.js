'use strict';
const {build,reference}=require('./llm-wave3-helper');
module.exports=build("llm-security-eval", [
  {
    "slug": "trust-boundaries",
    "comp": "m1.c1",
    "title": "Keep retrieved instructions outside the authority boundary",
    "intro": "A helpdesk assistant reads an uploaded policy attachment. Its text can describe a policy, but it must not redefine which account the assistant can access.",
    "headings": [
      "Define the decision and its boundary",
      "Apply and verify the engineering policy"
    ],
    "sections": [
      [
        "Prompt injection attempts to make instructions in an untrusted input control behavior beyond the input’s legitimate role. A direct attempt arrives in a user message; an indirect attempt arrives through documents, tool results or other external content. The important distinction is the trust boundary crossed, rather than whether suspicious words appear.",
        "Treat retrieved text as evidence to summarize, not as an authority source for tool policy. Separate trusted application configuration from user content, delimit evidence clearly, and retain document provenance. Delimiters improve interpretation but do not create a security boundary that a model is guaranteed to respect."
      ],
      [
        "Application code must enforce allowlisted operations, account scope and least privilege independently of generated text. A document that claims an administrator approved a new action is still only document content. A model can propose a request; the server decides whether the authenticated actor may perform it.",
        "The fixture selects tools from a trusted allowlist and ignores a requested tool absent from that set. This deliberately narrow demonstration tests operation selection only. Real deployments also require argument validation, per-resource authorization, output controls and adversarial evaluation on owned test environments."
      ]
    ],
    "problem": "Keep retrieved instructions outside the authority boundary using a declared synthetic fixture.",
    "code": "allowed = {\"lookup_policy\"}\nproposals = [\"lookup_policy\", \"export_accounts\"]\naccepted = [name for name in proposals if name in allowed]\nprint(accepted)\nprint(len(proposals) - len(accepted))",
    "expect": "['lookup_policy']\n1",
    "limit": "An operation-name allowlist alone does not establish argument safety, resource ownership or resistance to every prompt injection.",
    "steps": [
      "Identify the fixture inputs and the invariant stated in the lesson.",
      "Apply the explicit calculation or validation rule in application code.",
      "Compare the printed result with the expected output and identify the untested production assumptions."
    ],
    "mistakes": [
      "An operation-name allowlist alone does not establish argument safety, resource ownership or resistance to every prompt injection.",
      "Assuming this isolated fixture replaces representative integration tests and human review."
    ],
    "takeaways": [
      "Prompt injection attempts to make instructions in an untrusted input control behavior beyond the input’s legitimate role.",
      "Application code must enforce allowlisted operations, account scope and least privilege independently of generated text."
    ],
    "cards": [
      [
        "What identifies an indirect injection source?",
        "Which source would carry an indirect rather than direct injection attempt?",
        "Retrieved external text",
        "Authenticated user request",
        "Server policy constant",
        "Signed deployment setting",
        "Indirect injection enters through material the application reads as external data."
      ],
      [
        "Can delimiters guarantee isolation of instructions?",
        "What security property do evidence delimiters alone fail to guarantee?",
        "Instruction isolation",
        "Readable source labels",
        "Prompt segmentation",
        "Evidence formatting",
        "Text formatting can aid interpretation but is not an application authorization mechanism."
      ],
      [
        "Who authorizes a model-proposed operation?",
        "Which component should decide whether a generated action is allowed?",
        "Server authorization code",
        "Instruction hierarchy alone",
        "Model-generated role",
        "Retrieved policy text",
        "Permissions must derive from authenticated application state and enforced policy."
      ],
      [
        "Which policy blocks tools absent from a reviewed set?",
        "A support document requests an export tool outside the feature’s configured capabilities. What control rejects it?",
        "Server tool allowlist",
        "More evidence examples",
        "Lower sampling variance",
        "Source-domain ranking",
        "The server must constrain executable capabilities independently of document instructions."
      ],
      [
        "What is the correct trust treatment for claimed administrator instructions in data?",
        "An uploaded guide says its author has approved all account access. What should the application do?",
        "Current account permissions",
        "Document-author approval",
        "Repeated access claim",
        "Summary-based permission",
        "Document content cannot expand the authenticated actor’s permissions."
      ],
      [
        "What invariant must survive a model ignoring an evidence warning?",
        "An assistant follows an untrusted instruction despite a prompt warning. What must still prevent an unauthorized write?",
        "Server authorization",
        "Input warning text",
        "Output style scoring",
        "Document truncation",
        "Enforced authorization must hold even when generated behavior is compromised."
      ],
      [
        "How can a security evaluation distinguish access enforcement from blanket refusal?",
        "After reformatting retrieved evidence, one injected document no longer triggers an export. The old attack and legitimate export requests both use the same tool name. Which next evaluation best tests protection without mistaking blanket refusal for success?",
        "Test attack variants and authorized exports with server traces",
        "Repeat the blocked document and count every refusal as safe",
        "Remove exports from all tests and compare answer fluency",
        "Test benign summaries and treat valid schemas as isolation",
        "Use owned regression cases containing attack variants and permitted actions, and inspect server authorization traces. Repeating one refusal or removing legitimate exports cannot distinguish robust authorization from blanket denial."
      ],
      [
        "Does read access imply permission to execute instructions in a source?",
        "A retrieved troubleshooting page contains an operational command. What does reading the page authorize by itself?",
        "No execution permission",
        "Cited command execution",
        "Trusted-looking actions",
        "Domain-wide tool access",
        "Evidence access and action authorization are distinct capabilities."
      ],
      [
        "What scope should an injection exercise use?",
        "A class wants to test indirect injection defenses without impacting anyone else. Where should cases run?",
        "Owned isolated fixture",
        "Public third-party service",
        "Unreviewed live traffic",
        "Unrelated tenant workspace",
        "Defensive evaluation should use authorized synthetic inputs and owned environments."
      ],
      [
        "How can a security evaluation distinguish access enforcement from blanket refusal?",
        "A user may read policy A but cannot export customers. A relevant attachment requests an export; its schema is valid. The model emits a valid export call, and ordinary authorized summaries must remain available. Which enforcement path meets both requirements?",
        "Reject export by server scope; allow the policy summary",
        "Run export after schema checks; redact its visible result",
        "Reject all attachment requests, including permitted summaries",
        "Allow export if a second model confirms the citation",
        "Schema validity and model agreement establish neither permission nor tenant scope. Server authorization must reject the export before execution while allowing the independently permitted policy summary."
      ]
    ]
  },
  {
    "slug": "data-minimization",
    "comp": "m1.c2",
    "title": "Minimize model context and diagnostic data",
    "intro": "A payroll assistant needs a department policy, while its source record also contains employee identifiers. Sending the whole record would expand the exposure without improving the task.",
    "headings": [
      "Define the decision and its boundary",
      "Apply and verify the engineering policy"
    ],
    "sections": [
      [
        "Data minimization means supplying only the information required for the permitted task. First establish purpose and audience, then select fields. Authentication proves who the caller is; authorization establishes which records and fields that actor may access. A model’s helpfulness does not replace either check.",
        "Redaction is a transformation with limitations. Pattern-based masking can miss uncommon identifiers or remove legitimate content. Pseudonymous values can remain linkable personal data. A digest is not automatically anonymous, especially for a small predictable identifier space. Preserve data classification after transformation unless a justified review changes it."
      ],
      [
        "Logs, traces, caches and evaluation datasets are additional destinations for sensitive information. Prefer request ids, structured outcome labels and coarse metrics over raw prompts. Set access, retention and deletion policies deliberately. Provider retention, training use, region and contractual requirements must be verified for the actual deployment.",
        "The fixture projects an allowlisted subset of fields rather than attempting to recognize every possible secret. This proves exclusion of two known fixture fields only. A production pipeline must cover nested objects, free text, exception traces and authorized field-level access before any outbound call."
      ]
    ],
    "problem": "Minimize model context and diagnostic data using a declared synthetic fixture.",
    "code": "record = {\"department\": \"support\", \"policy\": \"leave-v2\", \"employee_id\": \"E17\", \"salary\": 50000}\nfields = {\"department\", \"policy\"}\ncontext = {k: v for k, v in record.items() if k in fields}\nprint(sorted(context))\nprint(\"salary\" in context)",
    "expect": "['department', 'policy']\nFalse",
    "limit": "Field projection does not detect personal information embedded in permitted free text or nested values.",
    "steps": [
      "Identify the fixture inputs and the invariant stated in the lesson.",
      "Apply the explicit calculation or validation rule in application code.",
      "Compare the printed result with the expected output and identify the untested production assumptions."
    ],
    "mistakes": [
      "Field projection does not detect personal information embedded in permitted free text or nested values.",
      "Assuming this isolated fixture replaces representative integration tests and human review."
    ],
    "takeaways": [
      "Data minimization means supplying only the information required for the permitted task.",
      "Logs, traces, caches and evaluation datasets are additional destinations for sensitive information."
    ],
    "cards": [
      [
        "What is data minimization?",
        "Which rule defines a minimized model request?",
        "Authorized necessary data",
        "All accessible records",
        "All recent conversations",
        "All hashed identifiers",
        "Data selection should reflect purpose and access scope, rather than storage availability."
      ],
      [
        "Is a predictable identifier hash automatically anonymous?",
        "Which transformed identifier still requires a linkage-risk assessment?",
        "Hashed employee number",
        "Public policy title",
        "Generic support topic",
        "Nonpersonal feature flag",
        "Small identifier spaces and linkage can preserve personal-data risk after hashing."
      ],
      [
        "Does redaction equal authorization?",
        "Which security decision must precede selecting private fields?",
        "Access permission",
        "Output fluency",
        "Token affordability",
        "Request brevity",
        "Masking content does not grant permission to use the underlying record."
      ],
      [
        "What should a routine trace store instead of raw private prompts?",
        "A payroll service wants failure diagnostics with lower personal-data exposure. Which trace choice fits?",
        "Id and failure category",
        "Complete raw prompts",
        "All trace payloads",
        "Full employee records",
        "Structured diagnostics can support debugging with less sensitive content."
      ],
      [
        "What does field allowlisting miss?",
        "A policy field contains a copied employee phone number. Why is projection alone insufficient?",
        "Private content in text",
        "Top-level key count",
        "Known salary-key removal",
        "Dictionary representation",
        "Allowed containers can still contain information outside the task’s purpose."
      ],
      [
        "What must be checked for an external provider?",
        "A team selects a hosted model for personnel questions. Which evidence is required before sending records?",
        "Applicable data terms",
        "Advertised model accuracy",
        "A favorable vendor demo",
        "Response-token capacity",
        "Retention, region, training use and contractual fit depend on the actual service configuration."
      ],
      [
        "Why retain access restrictions after pseudonymization?",
        "A user’s name is replaced by a stable tag in support logs. What remains relevant?",
        "Linkability and access",
        "Automatic public access",
        "Indefinite retention",
        "Assumed anonymization",
        "Stable tags can connect records and retain personal-data sensitivity."
      ],
      [
        "Which additional destination must a deletion plan cover?",
        "A customer’s prompt was removed from the request database but remains in a response cache. What is missing?",
        "Cache retention lifecycle",
        "Only primary-store removal",
        "Only prompt redaction",
        "Only provider cancellation",
        "Data lifecycle policies must include secondary stores as well as the primary database."
      ],
      [
        "How should privacy-safe evaluations be built?",
        "A team needs regression cases based on sensitive incidents. Which preparation is suitable?",
        "Reviewed scoped cases",
        "Raw production copies",
        "Public incident transcripts",
        "Automatic research exemption",
        "Evaluation datasets are separate data destinations requiring appropriate scope and controls."
      ],
      [
        "What does a fixture excluding a salary key prove?",
        "A privacy review approves a department-only prompt, but traces capture the original full record and a stable hashed employee id. What change addresses the remaining exposure?",
        "Minimize traces and assess linkability",
        "Hash salary values and retain all traces",
        "Delete the outbound prompt but keep raw logs",
        "Treat approved prompt fields as approval for all logs",
        "Minimization must cover secondary destinations, and stable hashes can remain linkable personal data."
      ]
    ]
  },
  {
    "slug": "tenant-isolation",
    "comp": "m1.c2",
    "title": "Preserve tenant scope across retrieval and caches",
    "intro": "A support portal serves multiple businesses. Similar questions must not cause one business’s private policy excerpts to enter another business’s answer.",
    "headings": [
      "Define the decision and its boundary",
      "Apply and verify the engineering policy"
    ],
    "sections": [
      [
        "Tenant isolation must hold before data reaches the model. Scope retrieval with the authenticated tenant and current access rules, then verify returned records. Never trust a tenant identifier emitted by the model as proof of membership. Relevance ranking determines usefulness only among records already permitted for the request.",
        "Every derived artifact inherits its source restrictions: summaries, embeddings metadata, cached answers and diagnostic excerpts can all disclose information. A cache key should include the authorization domain and relevant policy or corpus version. Even then, current access can change and require invalidation or a new permission check."
      ],
      [
        "A useful invariant is that all evidence ids supplied for tenant A belong to A’s authorized set at the time of use. Test this through retrieval, generation inputs, caches and fallbacks. Track denied results without writing their full private contents into ordinary logs.",
        "The fixture filters a small record list using a trusted tenant value. The rejected count is observable without printing the other tenant’s text. It demonstrates scope enforcement on supplied metadata, not proof that metadata are trustworthy or that the production database query is isolated."
      ]
    ],
    "problem": "Preserve tenant scope across retrieval and caches using a declared synthetic fixture.",
    "code": "tenant = \"north\"\nrows = [{\"id\": 1, \"tenant\": \"north\"}, {\"id\": 2, \"tenant\": \"south\"}, {\"id\": 3, \"tenant\": \"north\"}]\nvisible = [r[\"id\"] for r in rows if r[\"tenant\"] == tenant]\nprint(visible)\nprint(len(rows) - len(visible))",
    "expect": "[1, 3]\n1",
    "limit": "A trusted tenant filter over supplied rows does not verify database row security, metadata authenticity or cache invalidation.",
    "steps": [
      "Identify the fixture inputs and the invariant stated in the lesson.",
      "Apply the explicit calculation or validation rule in application code.",
      "Compare the printed result with the expected output and identify the untested production assumptions."
    ],
    "mistakes": [
      "A trusted tenant filter over supplied rows does not verify database row security, metadata authenticity or cache invalidation.",
      "Assuming this isolated fixture replaces representative integration tests and human review."
    ],
    "takeaways": [
      "Tenant isolation must hold before data reaches the model.",
      "A useful invariant is that all evidence ids supplied for tenant A belong to A’s authorized set at the time of use."
    ],
    "cards": [
      [
        "Does relevance authorize a retrieved record?",
        "Which condition must a relevant private document also satisfy?",
        "Current access policy",
        "Embedding score alone",
        "Source-domain reputation",
        "Exact keyword overlap",
        "Retrieval usefulness cannot override resource permissions."
      ],
      [
        "Where should tenant scope originate?",
        "What is a trusted source for the request’s tenant identity?",
        "Server identity context",
        "Generated tenant field",
        "Document ownership claim",
        "Editable profile label",
        "Server identity and membership checks define the authorization context."
      ],
      [
        "Do summaries preserve source restrictions?",
        "Which artifact can still disclose private source information?",
        "Source-derived summary",
        "Empty generic template",
        "Public feature name",
        "Random request nonce",
        "Compression does not remove the confidentiality of retained facts."
      ],
      [
        "What belongs in a private response cache key?",
        "Two businesses ask the same policy question. What prevents a shared answer key from colliding across them?",
        "Scope and source versions",
        "Question text alone",
        "Output language alone",
        "Model family alone",
        "Private cache identity must reflect the scope and evidence under which the answer was produced."
      ],
      [
        "What is needed when access changes?",
        "An employee loses access after a cached answer was created. What should reuse consider?",
        "Current permissions",
        "Original access alone",
        "Original quality score",
        "Cache age alone",
        "An answer can outlive the permission that originally allowed it."
      ],
      [
        "Why filter before model context construction?",
        "A team sends every tenant’s retrieved results and asks the model to hide forbidden ones. What boundary is already lost?",
        "Disclosure into context",
        "Only ranking order",
        "Only output syntax",
        "Only citation availability",
        "Forbidden data should not be supplied to generation as a substitute for access enforcement."
      ],
      [
        "How should rejected private results be logged?",
        "A retrieval bug returns another tenant’s record. Which diagnostic is appropriate?",
        "Scoped failure metadata",
        "Forbidden document text",
        "Entire provider request",
        "Unredacted user profile",
        "Troubleshooting must not create an additional unprotected disclosure path."
      ],
      [
        "Which check catches isolation regressions?",
        "A shared summary cache is introduced. What test is especially important?",
        "Cross-tenant reuse denial",
        "Only same-tenant hits",
        "Only cache throughput",
        "Only public-query success",
        "Isolation must be tested across derived stores, not only the original database."
      ],
      [
        "What should a fallback preserve?",
        "A private search backend fails and a backup retriever is used. Which constraint remains mandatory?",
        "Authorized evidence scope",
        "All backup records",
        "Only matching query terms",
        "Only result count limits",
        "Availability recovery must not relax confidentiality boundaries."
      ],
      [
        "What remains unproved by a local tenant filter?",
        "A user loses access while a private answer is cached. The question and policy version are unchanged. Which cache design respects the new state?",
        "Recheck access or invalidate on permission change",
        "Reuse until the policy version changes",
        "Reuse while the question matches exactly",
        "Ask the model whether the user still belongs",
        "Permission freshness can change independently of content freshness and must remain enforced on reuse."
      ]
    ]
  },
  {
    "slug": "semantic-validation",
    "comp": "m2.c1",
    "title": "Validate meaning after structured parsing",
    "intro": "A refund assistant returns valid JSON with a negative amount. Syntax is correct, while the business decision is invalid.",
    "headings": [
      "Define the decision and its boundary",
      "Apply and verify the engineering policy"
    ],
    "sections": [
      [
        "Output validation has several layers. Parsing checks representation; a schema checks shape and types; semantic rules check permitted values and relationships. Authorization checks whether this actor may request the operation on this resource. Each layer answers a different question and should expose a structured failure category.",
        "Provider-supported structured output can reduce malformed representations under its actual contract, but it does not prove that a cited fact is supported or a transaction is permitted. Treat generated identifiers, amounts and enum selections as untrusted proposals. Reject unknown fields where the interface requires a closed schema."
      ],
      [
        "Use explicit numeric ranges and cross-field checks. In Python, bool is a subclass of int, so an integer-amount check may need type(value) is int rather than isinstance(value, int). Decide units such as cents in the contract to avoid floating-point money ambiguity. Missing information should lead to clarification or safe failure.",
        "The fixture validates an integer amount within a declared cap and demonstrates why True must not pass as a monetary value. It does not implement a full JSON Schema validator, verify account ownership or establish any real refund entitlement."
      ]
    ],
    "problem": "Validate meaning after structured parsing using a declared synthetic fixture.",
    "code": "def valid_amount(value):\n    return type(value) is int and 0 <= value <= 5000\nprint(valid_amount(2500))\nprint(valid_amount(-1))\nprint(valid_amount(True))",
    "expect": "True\nFalse\nFalse",
    "limit": "A range/type check does not establish refund entitlement, source truth or authorization for a real account.",
    "steps": [
      "Identify the fixture inputs and the invariant stated in the lesson.",
      "Apply the explicit calculation or validation rule in application code.",
      "Compare the printed result with the expected output and identify the untested production assumptions."
    ],
    "mistakes": [
      "A range/type check does not establish refund entitlement, source truth or authorization for a real account.",
      "Assuming this isolated fixture replaces representative integration tests and human review."
    ],
    "takeaways": [
      "Output validation has several layers.",
      "Use explicit numeric ranges and cross-field checks."
    ],
    "cards": [
      [
        "Does syntactically valid JSON prove business correctness?",
        "Which property requires more than JSON parsing?",
        "Business validity",
        "JSON brace balance",
        "Object decoding",
        "String escape validity",
        "A parsed value can still violate domain rules or permissions."
      ],
      [
        "Why reject booleans as money integers explicitly in Python?",
        "What can isinstance(True, int) cause in a naive amount validator?",
        "Boolean accepted as int",
        "Every integer rejected",
        "Automatic cents conversion",
        "JSON parsing failure",
        "Python bool inherits from int; exact integer types can be necessary for a closed amount contract."
      ],
      [
        "Which representation reduces ambiguous monetary units?",
        "What should an amount field declare explicitly?",
        "Amount units and bounds",
        "Only field presence",
        "Only decimal formatting",
        "Only maximum length",
        "A clear cents or other currency-unit contract is necessary for meaningful validation."
      ],
      [
        "What follows valid structure but a negative refund?",
        "A refund payload parses and matches its field names, yet amount_cents is negative. Which layer rejects it?",
        "Semantic range validation",
        "JSON parsing alone",
        "Schema field names alone",
        "Citation checks alone",
        "Business value constraints go beyond representation and field shape."
      ],
      [
        "What follows a permitted amount for the wrong customer?",
        "An amount is within range but the generated order id belongs to someone else. Which check is required?",
        "Resource authorization",
        "Only range expansion",
        "Only output repair",
        "Only schema parsing",
        "Domain validity does not imply permission to access or act on an identified resource."
      ],
      [
        "What should happen with an unsupported extra field?",
        "A closed tool contract receives an unexpected admin_override property. Which behavior is suitable?",
        "Reject extra fields",
        "Apply extra fields",
        "Trust generated flags",
        "Disable type checks",
        "Closed schemas prevent unreviewed fields from influencing application behavior."
      ],
      [
        "How should missing required evidence be handled?",
        "A decision requires an invoice date that is absent from authorized records. What should the feature do?",
        "Clarify missing evidence",
        "Invent required evidence",
        "Assume current date",
        "Trust parse success",
        "Required domain information cannot be manufactured by structural validation."
      ],
      [
        "What should validation errors expose to the model?",
        "A response fails a range constraint. What repair feedback is useful without disclosing private state?",
        "Rule and failure label",
        "Private account examples",
        "Complete database state",
        "Provider secret values",
        "Minimal structured feedback can support repair without broadening data exposure."
      ],
      [
        "Can structured output prove source entailment?",
        "A provider guarantees a supported schema mode, and the answer cites the wrong fee. What remains necessary?",
        "Claim evidence support",
        "Only parse success",
        "Only citation syntax",
        "Only enum membership",
        "A structurally constrained answer can still misstate its evidence."
      ],
      [
        "What is the correct scope of the amount fixture?",
        "A schema-valid request has an integer amount within bounds, but its order belongs to another tenant. A retry proposes the same id. What should the application do?",
        "Deny the resource operation outside the repair loop",
        "Raise the amount cap and retry validation",
        "Treat repeated valid structure as approval",
        "Execute because the model followed the schema",
        "Authorization failures are not syntax defects and cannot be repaired by repeating generated proposals."
      ]
    ]
  },
  {
    "slug": "fallbacks",
    "comp": "m2.c1",
    "title": "Bound retries and preserve safe fallbacks",
    "intro": "A policy assistant receives an invalid response twice during a provider incident. Retrying forever would waste quota while delaying a useful failure message.",
    "headings": [
      "Define the decision and its boundary",
      "Apply and verify the engineering policy"
    ],
    "sections": [
      [
        "Reliability includes knowing when to stop. Set an overall deadline, per-attempt timeout and retry budget. Retry transient transport failures only under an explicit policy; malformed or semantically invalid output can use a small repair budget. Permanent authorization and configuration failures need correction rather than repeated calls.",
        "Exponential backoff with jitter can reduce synchronized retry pressure, but the entire retry sequence must remain inside the request deadline. Failed attempts may still consume provider limits or spend. Record attempt counts and the final outcome so an apparently successful request does not hide expensive recovery."
      ],
      [
        "A fallback should fit the same task requirements as the primary path. A tested alternate model may be acceptable for some tasks, while a source-only answer or human escalation is safer for others. A privacy or permission requirement cannot be waived to restore availability. Do not describe a partial answer as complete.",
        "The local fixture walks a predefined sequence of validation results and stops at a fixed attempt cap. It uses no real waiting and invokes no provider. The arithmetic tests a stop policy, not live backoff timing, transport cancellation or actual model quality."
      ]
    ],
    "problem": "Bound retries and preserve safe fallbacks using a declared synthetic fixture.",
    "code": "outcomes = [False, False, True]\nlimit = 2\nattempts = 0\naccepted = False\nfor result in outcomes[:limit]:\n    attempts += 1\n    if result:\n        accepted = True\n        break\nprint(attempts)\nprint(\"answer\" if accepted else \"escalate\")",
    "expect": "2\nescalate",
    "limit": "A simulated attempt cap does not measure real timeout propagation, provider cancellation or fallback answer quality.",
    "steps": [
      "Identify the fixture inputs and the invariant stated in the lesson.",
      "Apply the explicit calculation or validation rule in application code.",
      "Compare the printed result with the expected output and identify the untested production assumptions."
    ],
    "mistakes": [
      "A simulated attempt cap does not measure real timeout propagation, provider cancellation or fallback answer quality.",
      "Assuming this isolated fixture replaces representative integration tests and human review."
    ],
    "takeaways": [
      "Reliability includes knowing when to stop.",
      "A fallback should fit the same task requirements as the primary path."
    ],
    "cards": [
      [
        "What bounds a repair loop?",
        "Which pair prevents unbounded recovery attempts?",
        "Attempt cap and deadline",
        "Only per-call timeout",
        "Only maximum output",
        "Only retry backoff",
        "Both attempts and elapsed work should be constrained."
      ],
      [
        "Does a failed request necessarily consume no quota?",
        "Which retry-cost assumption is unsafe?",
        "Failures always free",
        "Attempts consume limits",
        "Retries need budgeting",
        "Spend includes recovery",
        "Failed requests can count toward limits or incur work; costs depend on the service contract."
      ],
      [
        "What does jitter reduce?",
        "Why add randomized variation to backoff delays?",
        "Retry synchronization",
        "Unsupported claims",
        "Permission denials",
        "Permanent configuration",
        "Jitter spreads retry timing across callers without repairing domain or access errors."
      ],
      [
        "Should permission denial be retried blindly?",
        "A tool returns an authorization denial. Which recovery is appropriate?",
        "Preserve access denial",
        "Retry denied access",
        "Use broader credentials",
        "Change resource ids",
        "Authorization failures should not trigger attempts to bypass the access policy."
      ],
      [
        "What should happen after the repair budget is exhausted?",
        "A policy answer fails required validation on every allowed attempt. What response fits?",
        "Safe failure escalation",
        "Publish last candidate",
        "Ignore invalid fields",
        "Retry without bound",
        "A bounded failure path is safer and more predictable than unchecked output or endless work."
      ],
      [
        "Which constraint applies to alternate models?",
        "A regional primary endpoint fails. A backup violates a mandatory data-location requirement. What should routing do?",
        "Backup remains ineligible",
        "Region waiver on failure",
        "Short-prompt exemption",
        "Retry-count exemption",
        "Fallbacks remain subject to the same hard deployment constraints."
      ],
      [
        "What does a useful incident metric include?",
        "A service eventually succeeds after repeated calls, but spend rises. Which diagnostic helps?",
        "Attempts per request",
        "Only final success",
        "Only response size",
        "Only user count",
        "Final success alone can conceal costly or slow recovery paths."
      ],
      [
        "How should a source-only fallback be labeled?",
        "A model fails and the app displays only the retrieved policy excerpt. What should the interface indicate?",
        "Limited source result",
        "Complete personalized ruling",
        "Confirmed application write",
        "Fully validated decision",
        "Users need to understand what the fallback did and what remains unresolved."
      ],
      [
        "What must a retry respect beyond per-attempt timeout?",
        "A request has little deadline remaining after the first failure. What should the retry scheduler enforce?",
        "Remaining total deadline",
        "Fresh deadline per retry",
        "Only attempt duration",
        "Only output-token limit",
        "Retry sequences must fit the caller’s total latency budget."
      ],
      [
        "What does the fixed-outcome loop prove?",
        "A primary endpoint times out after most of the deadline. Its backup shares the same provider pool and violates a location requirement. Which recovery is defensible?",
        "Stop safely within the remaining deadline",
        "Switch to the backup because availability dominates",
        "Retry both endpoints without a total cap",
        "Return the last unvalidated candidate as complete",
        "Neither a shared constrained dependency nor an ineligible backup provides a justified recovery path; deadline and privacy gates remain binding."
      ]
    ]
  },
  {
    "slug": "release-gates",
    "comp": "m2.c1",
    "title": "Gate output and consequential actions separately",
    "intro": "An assistant prepares a benefits eligibility explanation and a proposed account update. The explanation can be shown only after checks, and the write needs its own authorization path.",
    "headings": [
      "Define the decision and its boundary",
      "Apply and verify the engineering policy"
    ],
    "sections": [
      [
        "Detective guardrails classify or validate candidate behavior; preventive controls constrain what the system can actually do. A classifier can have false positives and false negatives, so treat its output as one signal within a designed policy. Server authorization, resource scoping and approved tool contracts remain enforced controls.",
        "Parallel validation can reduce elapsed time when independent checks run together. However, releasing text before its required checks finish creates a disclosure race. A rejected answer cannot reliably be recalled after the user has received it. Decide whether to buffer the whole response or release only explicitly safe units."
      ],
      [
        "Separate read-only responses from consequential effects. A validated explanation does not authorize a database write. If policy requires approval, bind that approval to the exact resource, action and relevant version; recheck before execution. A changed proposal must not inherit approval for a different action.",
        "The fixture computes release eligibility from two booleans and independently computes write eligibility from permission and approval. It illustrates policy conjunction, not a real moderator, approval service or race-free transaction implementation."
      ]
    ],
    "problem": "Gate output and consequential actions separately using a declared synthetic fixture.",
    "code": "content_valid = True\nscope_valid = False\nrelease = content_valid and scope_valid\npermission = True\napproved = False\nexecute = permission and approved\nprint(release)\nprint(execute)",
    "expect": "False\nFalse",
    "limit": "Boolean gate arithmetic does not establish classifier accuracy, approval authenticity or atomic action execution.",
    "steps": [
      "Identify the fixture inputs and the invariant stated in the lesson.",
      "Apply the explicit calculation or validation rule in application code.",
      "Compare the printed result with the expected output and identify the untested production assumptions."
    ],
    "mistakes": [
      "Boolean gate arithmetic does not establish classifier accuracy, approval authenticity or atomic action execution.",
      "Assuming this isolated fixture replaces representative integration tests and human review."
    ],
    "takeaways": [
      "Detective guardrails classify or validate candidate behavior; preventive controls constrain what the system can actually do.",
      "Separate read-only responses from consequential effects."
    ],
    "cards": [
      [
        "Are guardrail classifiers infallible?",
        "Which limitation applies to learned guardrails?",
        "Classification errors",
        "Perfect attack detection",
        "Guaranteed source truth",
        "Complete access enforcement",
        "Classifier outputs are fallible signals that require task-specific evaluation."
      ],
      [
        "Does explanation validation authorize a write?",
        "Which decision needs a separate policy check?",
        "Consequential action",
        "Validated text rendering",
        "Response token counting",
        "Citation formatting",
        "Answer quality and action permission are different decision boundaries."
      ],
      [
        "Can rejected output always be recalled?",
        "Why buffer text until a mandatory privacy check finishes?",
        "Irrevocable disclosure",
        "Guaranteed factual truth",
        "Universal streaming ban",
        "Zero-latency validation",
        "Premature disclosure can already occur before a later check rejects the response."
      ],
      [
        "What if one mandatory release check fails?",
        "An answer passes syntax but fails tenant-scope validation. Which release decision fits?",
        "Block candidate release",
        "Average mandatory checks",
        "Release partial private text",
        "Ignore failed scope",
        "Mandatory constraints are conjunctive; one required failure blocks release."
      ],
      [
        "What binds approval to an operation?",
        "A reviewer approves changing one account’s address. What should approval identify?",
        "Action scope and version",
        "All future account writes",
        "Only reviewer identity",
        "Only approval timestamp",
        "Approval scope must match the operation actually executed."
      ],
      [
        "Can changed proposals reuse old approval?",
        "An approved amount changes before execution. What should the workflow require?",
        "Revalidate action approval",
        "Reuse stale approval",
        "Skip changed-value checks",
        "Execute both proposals",
        "Material changes can invalidate the evidence and intent behind approval."
      ],
      [
        "What should over-refusal evaluation include?",
        "A safety filter blocks many harmless benefits questions. Which metric complements attack blocking?",
        "Benign request acceptance",
        "Only attack catch count",
        "Only refusal volume",
        "Only classifier confidence",
        "Useful guardrails must be assessed for unnecessary denials as well as missed risks."
      ],
      [
        "What can run in parallel safely?",
        "A response needs independent content and citation checks. Which design preserves the release gate?",
        "Await all required checks",
        "Release after first pass",
        "Ignore slower validation",
        "Treat pending as passed",
        "Parallel computation need not weaken the requirement that all mandatory checks pass."
      ],
      [
        "What protects against guardrail bypass?",
        "A generated answer fools an input classifier into allowing a tool request. Which layer still matters?",
        "Enforced tool permissions",
        "Classifier score alone",
        "Prompt warning alone",
        "Evidence formatting alone",
        "Preventive authorization constrains effects even when detective classification fails."
      ],
      [
        "What does the Boolean gate demonstration leave untested?",
        "A privacy classifier runs in parallel with generation and rejects after text reaches the user. A later deletion message is sent. Which redesign addresses the failure?",
        "Gate release on required checks before disclosure",
        "Only increase the classifier rejection threshold",
        "Only add a warning after every generated answer",
        "Treat deletion messages as proof of recall",
        "Mandatory checks must finish before sensitive release because a later rejection cannot reliably undo disclosure."
      ]
    ]
  },
  {
    "slug": "evaluation-design",
    "comp": "m3.c1",
    "title": "Build representative and challenge evaluation sets",
    "intro": "A new support prompt improves common answers but fails cancellation exceptions. A useful evaluation must reveal that tradeoff before release.",
    "headings": [
      "Define the decision and its boundary",
      "Apply and verify the engineering policy"
    ],
    "sections": [
      [
        "An evaluation case needs an input, allowed evidence, expected behavior and a scoring rule. Cover common user needs, important segments and deliberately difficult boundary cases. Separate a production-frequency sample for estimating typical behavior from a challenge set for detecting critical weaknesses; their aggregate scores answer different questions.",
        "Keep development examples distinct from the final holdout. Repeatedly editing prompts against hidden test answers makes those cases part of development decisions. Check duplicate content and case families across splits, not only record ids. Freeze versions of the task, corpus, prompt and model to make comparisons interpretable."
      ],
      [
        "Include abstention, source freshness, privacy and permission cases when the feature requires them. Critical failures should have explicit release gates rather than being diluted by a high overall average. Domain experts must review ambiguous labels and high-impact expected behavior.",
        "The fixture checks overlap between supplied case-family ids and reports an uncovered segment. It demonstrates two set operations under declared metadata. Distinct family names do not prove semantic independence, and a coverage label does not establish representative case quality."
      ]
    ],
    "problem": "Build representative and challenge evaluation sets using a declared synthetic fixture.",
    "code": "development = {\"refund-normal\", \"cancel-exception\"}\nholdout = {\"cancel-exception\", \"privacy-scope\"}\nrequired = {\"refund\", \"cancel\", \"privacy\"}\ncovered = {\"refund\", \"cancel\"}\nprint(sorted(development & holdout))\nprint(sorted(required - covered))",
    "expect": "['cancel-exception']\n['privacy']",
    "limit": "Metadata intersection does not detect every semantic duplicate or establish that supplied cases represent production traffic.",
    "steps": [
      "Identify the fixture inputs and the invariant stated in the lesson.",
      "Apply the explicit calculation or validation rule in application code.",
      "Compare the printed result with the expected output and identify the untested production assumptions."
    ],
    "mistakes": [
      "Metadata intersection does not detect every semantic duplicate or establish that supplied cases represent production traffic.",
      "Assuming this isolated fixture replaces representative integration tests and human review."
    ],
    "takeaways": [
      "An evaluation case needs an input, allowed evidence, expected behavior and a scoring rule.",
      "Include abstention, source freshness, privacy and permission cases when the feature requires them."
    ],
    "cards": [
      [
        "What defines an executable evaluation case?",
        "Which bundle makes a case assessable?",
        "Case evidence and rubric",
        "Only a sample answer",
        "Only a model identity",
        "Only a task label",
        "A case needs enough context and criteria to determine task success."
      ],
      [
        "Does a challenge-set average estimate production frequency?",
        "What distinguishes a deliberately adversarial challenge set?",
        "Targeted failure coverage",
        "Production prevalence",
        "Unbiased traffic estimate",
        "Universal model ranking",
        "Challenge cases test boundaries and need not match real traffic frequencies."
      ],
      [
        "Can different ids guarantee independent cases?",
        "Which split check should supplement identifier separation?",
        "Semantic content overlap",
        "Only record-id overlap",
        "Only split file names",
        "Only timestamp overlap",
        "Different identifiers may still represent duplicate or closely related tasks."
      ],
      [
        "What if a critical segment regresses?",
        "A prompt improves overall accuracy but leaks private evidence in one tenant case. What should release do?",
        "Critical failure gate",
        "Overall mean only",
        "Rare-case exclusion",
        "Rounded summary rate",
        "Mandatory security behavior must not be averaged away by common-case success."
      ],
      [
        "What happens after repeated holdout tuning?",
        "A team changes prompts after inspecting every final test error. How should those cases now be treated?",
        "Development-influenced data",
        "Untouched holdout",
        "Independent release audit",
        "Automatically fresh cases",
        "Test exposure and resulting design choices weaken independent final evaluation."
      ],
      [
        "Who resolves ambiguous high-impact labels?",
        "Two benefits experts disagree about the expected decision for an exception. What is appropriate?",
        "Expert label adjudication",
        "Model-generated truth",
        "Silent case exclusion",
        "Majority guess without review",
        "Ambiguous policy expectations need domain clarification rather than arbitrary automatic labels."
      ],
      [
        "Which versions belong in evaluation evidence?",
        "A corpus update changes the applicable policy. What should a result record identify?",
        "Prompt and model versions",
        "Only feature name",
        "Only run duration",
        "Only report date",
        "Results are meaningful for a particular configuration and evidence snapshot."
      ],
      [
        "What coverage is missing from happy-path tests?",
        "An assistant answers routine questions but has no insufficient-evidence cases. Which behavior needs testing?",
        "Evidence abstention",
        "Only greeting quality",
        "Only citation count",
        "Only output length",
        "Reliability includes knowing when available evidence cannot support an answer."
      ],
      [
        "How should representative and challenge results be presented?",
        "A test suite mixes frequent requests with many constructed attacks. What preserves interpretation?",
        "Separate sample reporting",
        "Unlabeled pooled rate",
        "Only favorable subsets",
        "Self-confidence average",
        "Different sampling purposes should remain visible when interpreting performance."
      ],
      [
        "What does the family-overlap fixture establish?",
        "A release improves common-case quality but fails one mandatory privacy case. Its challenge set overrepresents attacks. How should the team interpret results?",
        "Block on the gate and report separate sample purposes",
        "Ship because common cases dominate traffic",
        "Estimate production attack prevalence from the challenge set",
        "Remove the failure to rebalance the dataset",
        "A challenge set measures targeted behavior rather than prevalence, and critical requirements remain binding independently of the mean."
      ]
    ]
  },
  {
    "slug": "metrics",
    "comp": "m3.c1",
    "title": "Interpret failure metrics and uncertainty",
    "intro": "A safety classifier blocks most prohibited requests but also rejects legitimate users. One accuracy number obscures the operational costs of both errors.",
    "headings": [
      "Define the decision and its boundary",
      "Apply and verify the engineering policy"
    ],
    "sections": [
      [
        "For a detector, choose which outcome is positive before calculating metrics. Here positive means a prohibited case flagged. Precision is true positives divided by all flagged cases; recall is true positives divided by all truly prohibited cases. False positives block legitimate work, while false negatives allow prohibited behavior through.",
        "Accuracy can look strong when most cases are benign, even if a detector misses important prohibited cases. Examine counts, denominators and segment results. Precision and recall tradeoffs depend on the threshold, class prevalence and deployment costs. An evaluation fraction is not a calibrated per-answer probability."
      ],
      [
        "When comparing model or prompt versions, use the same eligible cases and rubric and inspect paired changes. Report sample size and uncertainty; zero observed failures in a small suite is not proof of zero real risk. Repeated stochastic trials may be useful where variation matters.",
        "The fixture computes precision and recall from invented confusion counts and handles zero denominators explicitly. It makes the metric definitions observable. It does not estimate real-world detection quality, select an optimal threshold or establish a statistical confidence interval."
      ]
    ],
    "problem": "Interpret failure metrics and uncertainty using a declared synthetic fixture.",
    "code": "tp, fp, fn = 6, 2, 4\nprecision = tp / (tp + fp) if tp + fp else None\nrecall = tp / (tp + fn) if tp + fn else None\nprint(f\"{precision:.2f}\")\nprint(f\"{recall:.2f}\")",
    "expect": "0.75\n0.60",
    "limit": "Invented confusion counts illustrate definitions without measuring a deployed detector or calibrating its probability scores.",
    "steps": [
      "Identify the fixture inputs and the invariant stated in the lesson.",
      "Apply the explicit calculation or validation rule in application code.",
      "Compare the printed result with the expected output and identify the untested production assumptions."
    ],
    "mistakes": [
      "Invented confusion counts illustrate definitions without measuring a deployed detector or calibrating its probability scores.",
      "Assuming this isolated fixture replaces representative integration tests and human review."
    ],
    "takeaways": [
      "For a detector, choose which outcome is positive before calculating metrics.",
      "When comparing model or prompt versions, use the same eligible cases and rubric and inspect paired changes."
    ],
    "cards": [
      [
        "Which denominator defines precision for a prohibited-case detector?",
        "Which denominator defines precision when flagged is positive?",
        "All flagged cases",
        "Truly prohibited cases",
        "Only benign cases",
        "Only all passed cases",
        "Precision measures how many flagged cases are actually prohibited."
      ],
      [
        "What is recall for that detector?",
        "Which denominator defines prohibited-case recall?",
        "All prohibited references",
        "Only flagged benign cases",
        "Only valid responses",
        "All observed outputs",
        "Recall measures how many actual prohibited cases were detected."
      ],
      [
        "What does a false positive mean here?",
        "Which error rejects legitimate work?",
        "Benign input denied",
        "Prohibited case allowed",
        "Prohibited case flagged",
        "Benign case allowed",
        "With prohibited as positive, false positives are mistaken flags on benign cases."
      ],
      [
        "Why can high accuracy conceal poor detection?",
        "A suite is overwhelmingly benign and a detector allows everything. Which risk remains?",
        "Zero prohibited-case recall",
        "Perfect safe detection",
        "Guaranteed valid release",
        "No imbalance effect",
        "A majority-class strategy can have high accuracy while detecting no prohibited inputs."
      ],
      [
        "How should zero observed critical failures be reported?",
        "A small suite finds no leaks. What claim is justified?",
        "No leaks in tested sample",
        "Exactly zero leak risk",
        "Universal future safety",
        "Formal proof of isolation",
        "Finite observations cannot establish the absence of unobserved failures."
      ],
      [
        "What should a threshold change evaluate?",
        "A stricter detector threshold catches more attacks but blocks more normal requests. What pair matters?",
        "Recall and benign denials",
        "Only total flag volume",
        "Only classifier certainty",
        "Only response length",
        "Both missed prohibited cases and unnecessary denials affect usefulness and risk."
      ],
      [
        "What supports a fair version comparison?",
        "Two prompts are evaluated on different difficulty sets. What should be corrected?",
        "Matched cases and rubric",
        "Only matched timestamps",
        "Only matching model labels",
        "Only equal sample counts",
        "Case-distribution differences can confound apparent performance changes."
      ],
      [
        "Can a benchmark fraction serve as per-answer confidence?",
        "A model scores 90 percent on a task set. What does that not automatically provide?",
        "Per-answer calibration",
        "Observed aggregate score",
        "Reported sample size",
        "Version-specific results",
        "Aggregate task success and per-instance probability calibration are different properties."
      ],
      [
        "Why inspect segment denominators?",
        "A minority-language segment has one successful case and a perfect percentage. What is essential context?",
        "Segment sample denominator",
        "Universal language competence",
        "Only mean request cost",
        "Only mean response length",
        "A percentage without its denominator can imply stronger evidence than the sample supports."
      ],
      [
        "What does the confusion-count example measure?",
        "A detector has high accuracy on a mostly benign set but misses many prohibited cases. Which report best supports a threshold decision?",
        "Class counts recall precision and benign rejection",
        "Only overall accuracy with more decimal places",
        "Only the number of accepted requests",
        "Only confidence values on successful examples",
        "Class imbalance and operational costs require confusion counts and both missed-risk and over-refusal measures."
      ]
    ]
  },
  {
    "slug": "regression-evidence",
    "comp": "m3.c1",
    "title": "Make regression evidence traceable and actionable",
    "intro": "A support team must decide whether a model upgrade can ship. Each failed requirement needs a reproducible case and an owner, not just an average score.",
    "headings": [
      "Define the decision and its boundary",
      "Apply and verify the engineering policy"
    ],
    "sections": [
      [
        "A regression record should identify the case, requirement, configuration, outcome and relevant evidence without copying unnecessary private data. Preserve immutable case ids and versioned rubrics so a changed expected answer is distinguishable from a changed model behavior. Store failures alongside successes.",
        "Release policy should be declared before comparing candidates. It can require no critical privacy failures, minimum supported-answer quality and a latency budget. Aggregate gates are useful only when their definitions and samples are clear. A model-name alias does not substitute for a recorded version or deployment identifier."
      ],
      [
        "Route failures into targeted remediation: fix retrieval for missing evidence, adjust output validation for invalid values, or tighten authorization for scope failures. Add a regression case when an incident reveals a missing requirement, then re-evaluate the candidate and any fallbacks that share the behavior.",
        "The fixture applies two explicit gates to a small synthetic result list and reports the failing case ids. This is a release-policy illustration. It neither automatically approves educational content nor establishes that the test set exhaustively covers operational risk."
      ]
    ],
    "problem": "Make regression evidence traceable and actionable using a declared synthetic fixture.",
    "code": "cases = [{\"id\": \"a\", \"critical\": True, \"passed\": True}, {\"id\": \"b\", \"critical\": True, \"passed\": False}, {\"id\": \"c\", \"critical\": False, \"passed\": True}]\nfailures = [c[\"id\"] for c in cases if c[\"critical\"] and not c[\"passed\"]]\nquality = sum(c[\"passed\"] for c in cases) / len(cases)\nprint(failures)\nprint(not failures and quality >= 0.8)",
    "expect": "['b']\nFalse",
    "limit": "A release-gate fixture is not exhaustive assurance, human approval or authorization to deploy any system.",
    "steps": [
      "Identify the fixture inputs and the invariant stated in the lesson.",
      "Apply the explicit calculation or validation rule in application code.",
      "Compare the printed result with the expected output and identify the untested production assumptions."
    ],
    "mistakes": [
      "A release-gate fixture is not exhaustive assurance, human approval or authorization to deploy any system.",
      "Assuming this isolated fixture replaces representative integration tests and human review."
    ],
    "takeaways": [
      "A regression record should identify the case, requirement, configuration, outcome and relevant evidence without copying unnecessary private data.",
      "Route failures into targeted remediation: fix retrieval for missing evidence, adjust output validation for invalid values, or tighten authorization for scope failures."
    ],
    "cards": [
      [
        "What makes regression results traceable?",
        "Which metadata connect a failure to the evaluated behavior?",
        "Versioned case evidence",
        "Only report screenshots",
        "Only model family name",
        "Only evaluation date",
        "Reproducibility requires the task and system conditions behind the result."
      ],
      [
        "Should failed cases be retained?",
        "Which results belong in an honest evaluation report?",
        "Failures and successes",
        "Only accepted responses",
        "Only favorable cases",
        "Only completed requests",
        "Omitting failures distorts release evidence and prevents targeted improvement."
      ],
      [
        "What should an alias upgrade trigger?",
        "Which change requires fresh behavior evidence?",
        "Underlying version",
        "Report formatting",
        "Dashboard rearrangement",
        "Chart label update",
        "An unchanged marketing alias can still hide a material model change."
      ],
      [
        "What should a critical failure gate do?",
        "A candidate passes mean quality but fails a required privacy case. Which release result follows?",
        "Block candidate release",
        "Average privacy with speed",
        "Drop the rare case",
        "Quietly relax criteria",
        "A declared hard gate remains binding even when other scores are strong."
      ],
      [
        "Where should a missing-evidence failure lead?",
        "An answer cannot find an applicable cancellation rule. Which initial investigation fits?",
        "Retrieval coverage",
        "Only output formatting",
        "Only sampling controls",
        "Only response caching",
        "Remediation should target the layer responsible for missing evidence."
      ],
      [
        "What if the rubric changes?",
        "An expert corrects the expected policy interpretation. How should the team preserve traceability?",
        "Version and rerun",
        "Silent label overwrite",
        "Delete earlier evidence",
        "Assume model regression",
        "Expected-behavior changes must be distinguishable from model regressions."
      ],
      [
        "Which fallback needs regression coverage?",
        "A primary model passes release checks but the failover model was never tested. What is missing?",
        "Fallback task evaluation",
        "Only backup availability",
        "Only endpoint compatibility",
        "Only routing configuration",
        "A fallback becomes part of user-visible behavior and must satisfy relevant requirements."
      ],
      [
        "How should incident evidence improve evaluation?",
        "An authorized incident review reveals a previously untested privacy boundary. What should follow?",
        "Scoped incident regression",
        "Public raw transcript",
        "Remove difficult gates",
        "Only revise documentation",
        "Lessons from incidents should become scoped test coverage without unnecessary data exposure."
      ],
      [
        "When should release thresholds be set?",
        "A team selects whichever threshold makes the newest candidate pass. What improves validity?",
        "Predeclared gates",
        "Candidate-specific thresholds",
        "Only best observed score",
        "Hidden acceptance criteria",
        "Post hoc goal changes weaken the meaning of a passing result."
      ],
      [
        "What does a gate passing authorize?",
        "An expert changes a reference label after a policy update while a new model is being tested. Which process preserves interpretability?",
        "Version the rubric and compare both models on it",
        "Overwrite old results and attribute all gains to the model",
        "Keep the stale reference to preserve the original score",
        "Lower the release threshold until the candidate passes",
        "A changed expected behavior is a separate change from a model upgrade and needs explicit versioned re-evaluation."
      ]
    ]
  }
], [reference("guardrails","examples/How_to_use_guardrails.ipynb","OpenAI Cookbook: guardrail limitations"),reference("hallucination","examples/Developing_hallucination_guardrails.ipynb","OpenAI Cookbook: evaluation-led guardrails")]);
