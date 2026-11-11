'use strict';
const {course}=require('./wave4-ai-helper');
module.exports=course("agent-workflows",[
  {
    "slug": "bounded-design",
    "title": "Choose deterministic workflow boundaries before autonomy",
    "intro": "A support operation must decide whether to route requests through a fixed approval process or let a model choose the next action. The choice is about uncertainty and control: a workflow defines allowed states and transitions, while an agent proposes actions within a controlled execution environment.",
    "sections": [
      [
        "Separate proposals from authoritative transitions",
        "Use a fixed workflow when the required sequence and decision rules are known, especially when policy or audit requires explicit gates. A model can still classify an incoming message or draft a response inside one bounded step. The application validates the result and selects an allowed transition; model text does not authorize a refund or override a required review. Autonomy can help when the path genuinely depends on exploratory evidence, but it adds failure modes and monitoring requirements.",
        "Represent state with named values, typed inputs and explicit completion conditions. A transition should declare its prerequisites, expected output and effect category. Distinguish read-only information gathering from consequential writes. Stop when the goal is met, the task is impossible within policy, or a budget is exhausted. A step limit prevents an infinite loop but does not make every allowed step safe."
      ],
      [
        "Fit design to the operational contract",
        "A deterministic refund policy can require verified order ownership, eligibility, approval and a deduplicated write. Replacing it with one unbounded model prompt would remove observable control points. Conversely, forcing an exploratory document search into one hard-coded keyword query may underserve the task. Start with the smallest sufficient control structure, measure failures, and expand freedom only where evidence justifies the additional complexity.",
        "The fixture permits a refund transition only after eligibility and approval facts are present. It is an offline state predicate, not an AI planner or real financial integration. A production workflow also needs authenticated facts, persistence, concurrency handling and authoritative authorization at execution time."
      ]
    ],
    "code": "def route(s):\n    if not s[\"eligible\"]: return \"decline\"\n    if not s[\"approved\"]: return \"await_review\"\n    return \"refund_ready\"\nprint(route({\"eligible\":True,\"approved\":False}))\nprint(route({\"eligible\":True,\"approved\":True}))",
    "expect": "await_review\nrefund_ready",
    "steps": [
      "Check the supplied eligibility fact first.",
      "Require approval before the effect-ready state.",
      "Compare the route with and without the approval fact."
    ],
    "problem": "Model a bounded support-policy transition using synthetic facts.",
    "limit": "This pure Python predicate exercises two local transitions only. It neither verifies the facts nor executes a real refund, model call or authorization service.",
    "mistakes": [
      "Do not treat a model proposal as authoritative permission for a side effect.",
      "Do not confuse a finite step count with proof that each step satisfies policy."
    ],
    "takeaways": [
      "Use fixed transitions where requirements are known and consequential.",
      "Bounded autonomy still requires application validation and authoritative execution controls."
    ],
    "practice": [
      "What does a fixed workflow make explicit?|Allowed states and transitions|Every future model sentence|A universal solution to uncertainty|Permission from any model response|A workflow defines its control flow and gates rather than relying on an unconstrained sequence of proposals.",
      "When is a fixed approval sequence a suitable starting point?|Known policy with required gates|An entirely unknown exploratory path|A desire to avoid all event records|A need to accept arbitrary tool names|A known approval policy benefits from explicit gates that can be inspected and tested.",
      "Does a five-step limit alone establish safe actions?|No, action checks remain needed|Yes, every finite plan is safe|Only if every action is a write|Only if the model is confident|A finite plan may still contain unauthorized or harmful actions unless each effect is checked.",
      "A model says an invoice refund is approved without an approval record. What should execution require?|Authoritative approval evidence|The same statement repeated twice|A higher generated confidence score|A longer natural-language explanation|Consequential transitions must depend on trustworthy policy evidence rather than generated assertions.",
      "An exploratory task needs varied searches but cannot send payments. Which boundary is appropriate?|Flexible search with denied writes|All tools enabled for exploration|No trace records for search steps|Generated text grants payment access|Exploration can be bounded to permitted read operations without expanding financial authority.",
      "The goal is reached after step two of a ten-step budget. What should control flow do?|Stop with a recorded outcome|Spend all remaining steps anyway|Clear all prior evidence records|Restart until ten calls are used|A budget is an upper bound, not a requirement to continue after the completion condition is satisfied."
    ],
    "formal": [
      "Which workflow property is distinct from model fluency?|Explicit transition constraints|The length of generated prose|The number of adjectives used|A preferred tone of response|Control-flow constraints are enforced application behavior, separate from how convincingly a model writes.",
      "What is the role of a model-generated tool proposal?|Input to an application decision|An authoritative policy exception|A completed external side effect|Proof the caller owns the resource|The application must validate and authorize a proposed action before any effect can occur.",
      "Why separate read steps from effectful write steps?|Their risk and controls differ|Reads never expose private data|Writes always need no approval|Only writes consume any budget|Read and write effects require appropriate controls; reads can also need privacy and permission checks.",
      "A refund policy has ownership, eligibility and approval gates. Which design preserves the stated contract?|An explicit gated transition flow|One unrestricted prompt with tools|A confidence threshold without gates|A shared approval flag for all orders|The required policy gates should remain explicit rather than being substituted by model confidence or global state.",
      "An autonomous assistant reaches a state with no permitted next action. What outcome is appropriate?|Stop or escalate with context|Invent a new permission boundary|Repeat the failed action forever|Treat absence of action as approval|A blocked state needs a declared failure/escalation path within the permitted control model.",
      "A business asks for faster replies but a proposed design removes mandatory review before issuing credits. What tradeoff is unacceptable under the requirement?|Bypassing the required review gate|Drafting a reply before review|Caching read-only product facts|Recording per-step latency data|A speed optimization cannot override an explicitly mandatory consequential-action gate.",
      "A workflow has used two of three allowed transitions. It is eligible but not approved; a model proposes setting approved=true, although only the reviewer endpoint may do that. Recording a blocked result consumes one transition. Which resulting state respects every rule?|Blocked at transition three; no effect|Refund completed at transition three|Blocked with counter reset to zero|Refund completed but audit omitted|The proposal cannot change authoritative approval. Persisting the blocked decision uses the final transition, preserving both the effect gate and the transition limit.",
      "An application allows exploration only on public product documents, but a proposed tool opens tenant records. What must happen before execution?|Reject the out-of-scope proposal|Allow it if the answer sounds useful|Hide its name while executing|Run it twice to improve confidence|The exploration boundary limits permitted data sources; utility does not confer extra authorization.",
      "A planner is uncertain whether the task is complete and repeatedly generates checks that consume the budget. Which specification is missing or weak?|Observable completion criteria|Alphabetical state names only|A longer default greeting message|A global constant cluster count|An explicit testable completion criterion reduces unnecessary loops and makes stopping behavior reviewable.",
      "A refund plan was built at revision 8 with approval bound to that revision. A cancellation commits revision 9 before execution. Three of four allowed transitions have been used; an atomic blocked-state update needs the final transition. Which action preserves current authorization, the limit and audit history?|Reject the stale effect and commit blocked state|Execute revision 8 approval before recording cancellation|Reset the transition count and reuse the approval|Apply the refund then append a compensating audit entry|Cancellation invalidates the stale plan. The final allowed transition can record the blocked decision without executing an effect under obsolete approval."
    ],
    "lang": "python"
  },
  {
    "slug": "typed-routing",
    "title": "Route tasks and handoffs through validated contracts",
    "intro": "A university assistant handles admissions, fees and account-access questions. Routing can use a deterministic classifier or a model-generated proposal, but the execution layer must map that result to an allowed destination and a constrained input contract.",
    "sections": [
      [
        "Validate destination and payload",
        "A route name is data until the application checks it against an allowlist. Avoid importing modules, opening URLs or calling functions directly from unconstrained model strings. Validate a structured result, then resolve a known route to a known handler. A handoff should include the minimum necessary facts and provenance for the recipient, not the entire raw conversation by default.",
        "Define what ownership transfers: a recipient may become responsible for the next conversational turn, one specific subtask or an entire case. Specify which component retains authority to perform effects and who records the final outcome. Multiple specialized agents do not automatically provide independent verification when they share the same prompt, flawed source or unsupported assumption."
      ],
      [
        "Prevent handoff loops and authority expansion",
        "Track handoff count, visited routes or a task-specific state graph. A cycle between admissions and fees can exhaust time even if every destination is valid. Allow escalation or a controlled terminal state when routing confidence is low or repeated transfers are not productive. A transfer changes control context, not the caller’s tenant, authentication or permissions.",
        "The fixture resolves a supplied route only through a fixed handler table. An unsupported route receives an escalation result. It demonstrates controlled name resolution rather than actual model classification, identity validation or production university systems. The historical OpenAI notebook illustrates handoff concepts; it is explicitly not evidence that an old example library is production supported."
      ]
    ],
    "code": "handlers={\"fees\":lambda p:\"fees:\"+p[\"case\"],\"admissions\":lambda p:\"admissions:\"+p[\"case\"]}\ndef dispatch(route,payload):\n    handler=handlers.get(route)\n    return handler(payload) if handler else \"escalate\"\nprint(dispatch(\"fees\",{\"case\":\"case-7\"}))\nprint(dispatch(\"shell\",{\"case\":\"case-7\"}))",
    "expect": "fees:case-7\nescalate",
    "steps": [
      "Resolve a validated route name against the fixed handler mapping.",
      "Pass a minimal synthetic case identifier to the selected handler.",
      "Escalate an unsupported route instead of dynamically executing it."
    ],
    "problem": "Compare an allowed route and an unsupported destination.",
    "limit": "Actual local Python handler dispatch executes; it does not evaluate a model classifier or confer authority on the supplied case identifier.",
    "mistakes": [
      "Do not execute arbitrary function names or URLs taken from a routing proposal.",
      "Do not treat a handoff as a change to the caller’s resource permissions."
    ],
    "takeaways": [
      "Handoff contracts define destination, payload, ownership and termination.",
      "Specialization changes task handling without automatically expanding authority."
    ],
    "practice": [
      "What should resolve a proposed route into executable behavior?|An allowlisted handler mapping|Dynamic evaluation of route text|The longest generated explanation|An arbitrary model-supplied URL|Route proposals require controlled resolution to known handlers rather than direct code execution.",
      "What should a minimal handoff payload preserve?|Relevant facts and provenance|Every raw secret in the session|Only the destination greeting|A copied global approval boolean|The recipient needs sufficient relevant evidence with provenance while unnecessary sensitive context should be omitted.",
      "Does transferring a case grant the recipient broader caller permissions?|No, authorization still applies|Yes, all handoffs become admin|Only if two models agree aloud|Only if the route name is long|A handoff changes workflow control and does not create additional authority over resources.",
      "Fees and admissions keep transferring the same case. What control is useful?|A transfer bound and escalation|An unlimited retry instruction|A hidden history reset each turn|Automatic approval after a cycle|A bounded handoff policy can stop unproductive cycles and preserve context for escalation.",
      "Two agents repeat the same unsupported source claim. What is still missing?|Independent evidence validation|A third identical paraphrase|A larger total agent count only|An extra confidence adjective|Repeated output from shared assumptions is not independent verification of the underlying claim.",
      "A router emits an unknown tool destination. What should the dispatcher do?|Reject or escalate the route|Import a module with that name|Execute it using the host shell|Guess a privileged alternative|Unknown destinations must not become arbitrary executable actions."
    ],
    "formal": [
      "What does a handoff primarily transfer in an agent workflow?|Defined responsibility or control|The user's legal identity|Unrestricted system authority|A guarantee of answer correctness|A handoff contract transfers a stated task/control role while permissions and verification remain separate.",
      "Why validate a structured routing result?|Constrain its accepted contract|Guarantee model classification truth|Bypass all destination allowlists|Replace authentication checks|Schema and allowlist validation constrain what the application can accept without proving the proposed classification is correct.",
      "What should happen to route inputs containing unexpected executable code?|Treat them as untrusted data|Run them to identify the destination|Append them to a shell command|Grant temporary administrative access|Routing strings and payloads are untrusted data and should not be interpreted as executable code.",
      "A university workflow permits fees and admissions handlers but receives route=database-admin. Which response matches its scope?|Reject the unsupported destination|Execute because the route is precise|Create the destination dynamically|Forward the caller's full secrets|The allowed destination set is authoritative and cannot be expanded by a proposed name.",
      "A handoff needs a case summary but not a password from an earlier turn. Which payload choice is appropriate?|Summary with relevant evidence only|Full transcript including password|Only the password for convenience|A globally shared conversation log|Minimum necessary context preserves task utility while avoiding needless sensitive-data propagation.",
      "One component delegates a read-only quote to another agent. The recipient then proposes issuing a credit. What must remain enforced?|Original effect authorization limits|Recipient's self-declared expanded role|Authority from the successful quote|A larger route-priority integer|Delegation of a read task does not authorize a later financial write without the required policy checks.",
      "A triage implementation invokes globals()[route] from a model response. Which control should replace that behavior?|Explicit allowed handler lookup|A longer route prompt only|Sorting available global names|Removing the routing trace log|A fixed allowlist prevents arbitrary global function resolution from untrusted route proposals.",
      "An escalation policy caps three handoffs; a case already used all three and remains unresolved. Which outcome is appropriate?|Persist unresolved state and escalate|Reset the counter without audit|Transfer once more under a new id|Declare the customer's issue solved|A reached bound needs an honest controlled terminal/escalation state rather than hidden budget bypass or invented success.",
      "A handoff changes the case handler while tenant ownership checks still refer to the authenticated user. Why is that correct?|Control transfer preserves access scope|All recipients become tenant owners|The handoff string proves ownership|Case ids encode universal permission|Changing which component works on a case does not change the user's underlying resource authorization.",
      "A handoff policy allows three transfers, independent evidence and only case-id disclosure. A and B read source S; C can check independent source T. Which proposed route provides the required second evidence source within the disclosure and transfer limits?|A to B to C, sharing only the case id|A to B to A, repeating source S findings|A to B to C, sharing the complete private transcript|A to B to C to A to B, sharing only the case id|The first route uses two transfers and reaches independent source T with minimum disclosure. Repetition is not independence, full transcripts violate scope, and four transfers exceed the cap."
    ],
    "lang": "python"
  },
  {
    "slug": "bounded-search",
    "title": "Bound exploration by steps, deadlines and side-effect rules",
    "intro": "A procurement assistant can search catalogs and compare suppliers, but its exploration must finish before a request deadline and cannot place orders. Several resource limits apply simultaneously: permitted operations, remaining steps, elapsed time and monetary budget.",
    "sections": [
      [
        "Multiple budgets express different constraints",
        "A maximum number of calls does not bound wall-clock duration unless each call also has a finite timeout or deadline-aware cancellation. A token cap does not limit an expensive external write, and a monetary cap does not authorize a prohibited action. Check all applicable constraints before dispatch, reserve scarce budget when concurrency exists, and reconcile actual consumption afterward.",
        "Repeated observations should carry provenance and time. If a search produces no new useful evidence, another identical call may consume budget without improving the decision. Define a stop or escalation policy for repeated unproductive results. For consequential tools, a timeout can leave the external effect unknown; safe recovery must reconcile effect state rather than blindly retrying under a fresh operation identity."
      ],
      [
        "Finite state does not remove execution races",
        "Use a clear order: validate scope, establish current state, check budgets/deadline, authorize the proposed operation, reserve any necessary capacity, dispatch and record the result. A concurrent worker must not spend the same unreserved budget. Deadline and authorization checks at planning time can become stale before queued execution, so recheck at the authoritative execution boundary.",
        "The fixture tests a read-search policy against a step bound and an elapsed-time deadline using supplied integers. It is a deterministic offline predicate and has no real clock, network cancellation or distributed budget reservation. Those operational properties require separate integration testing."
      ]
    ],
    "code": "def permit(action,steps,now,deadline):\n    return action==\"search\" and steps<3 and now<deadline\nprint(permit(\"search\",2,8,10))\nprint(permit(\"search\",2,10,10))\nprint(permit(\"purchase\",0,1,10))",
    "expect": "True\nFalse\nFalse",
    "steps": [
      "Check the read-only action scope.",
      "Require both remaining step budget and time before the exclusive deadline.",
      "Verify that available time does not authorize a prohibited purchase."
    ],
    "problem": "Apply scope, step and deadline constraints before a synthetic dispatch.",
    "limit": "Local predicate evaluation is verified. It does not test real cancellation, concurrency-safe reservations or any external tool execution.",
    "mistakes": [
      "Do not interpret remaining call budget as permission to perform an out-of-scope operation.",
      "Do not retry an unknown external write under a new identity before reconciling its effect."
    ],
    "takeaways": [
      "Each budget bounds a different resource or risk and must be enforced explicitly.",
      "Execution-time checks and reconciliation are necessary beyond a planning-time predicate."
    ],
    "practice": [
      "Why does a call-count bound not itself cap elapsed time?|Individual calls may wait indefinitely|Every call consumes equal wall time|Calls always finish within one second|Token limits guarantee cancellation|Without bounded waits or deadline-aware cancellation, a finite number of calls can still exceed the required duration.",
      "Can unused monetary budget authorize a prohibited purchase?|No, scope checks are separate|Yes, budget implies write access|Only after one successful search|Only if two suppliers are compared|Resource capacity does not confer authority for actions outside the allowed scope.",
      "What is a useful stop signal for exploratory search?|No useful new evidence within policy|A requirement to spend every token|An arbitrary new operation identity|An instruction to hide failed calls|A search policy can stop or escalate when further allowed calls are not producing useful progress.",
      "A queued operation was approved before its deadline but executes after it. What should be rechecked?|Current execution-time constraints|Only the original prompt wording|Only the queue's numeric position|The spelling of the supplier id|Planning-time checks can become stale, so the execution boundary must re-evaluate relevant deadlines and authorization.",
      "Two workers see the same remaining cost budget. What prevents overspending before both calls launch?|An atomic budget reservation|Separate unchecked budget reads|Only a shared log message|A random sleep before dispatch|Concurrent capacity use requires an atomic reservation or equivalent coordination rather than independent optimistic checks.",
      "A purchase tool times out with unknown commit status. What is safer than a fresh retry identity?|Reconcile the existing operation|Assume no purchase happened|Force a second unrelated purchase|Delete the previous tool result|A timeout does not prove absence of an effect; reconciliation preserves the original operation's identity and avoids duplicate writes."
    ],
    "formal": [
      "Which budget directly limits the count of dispatched steps?|A maximum permitted step count|The final prose word count only|A supplier popularity ranking|The number of saved user profiles|A step cap constrains dispatch count but does not replace time, cost or authority limits.",
      "What makes a loop termination condition observable?|A checkable goal or stop state|A confident model adjective|A promise to stop eventually|A hidden mutable instruction|A defined condition can be evaluated and audited rather than inferred from vague generated confidence.",
      "Why retain tool-operation identity during uncertain recovery?|To reconcile a possibly completed effect|To force a new independent write|To prove the server never received it|To erase the prior deadline|A stable operation identity can support status lookup and safe deduplication after ambiguous completion.",
      "A search has steps=2 of3 and now=10 with an exclusive deadline10. Which dispatch decision follows?|Deny because deadline reached|Allow because one step remains|Allow because budget is positive|Deny only if all tools are writes|All constraints must hold; remaining step count does not override a reached exclusive deadline.",
      "A workflow can spend at most20 units and two concurrent calls each reserve12. Which policy respects the cap?|Reserve atomically before launch|Allow both after separate reads|Log the excess after completion|Assume one call probably fails|Atomic reservation prevents concurrent approvals from jointly exceeding the shared cap.",
      "A model repeats an identical catalog search four times without new evidence. Which policy improvement addresses waste?|Detect nonprogress and stop|Increase the same search priority|Remove every source timestamp|Declare repeated results independent|Repeated unchanged evidence is not independent progress and can trigger a bounded stop/escalation rule.",
      "A service caps five tool calls but allows each to block without timeout. What stated guarantee is unsupported?|A bounded end-to-end duration|At most five dispatches total|A known permitted action set|A finite counter representation|A call-count bound alone does not constrain how long each call may wait.",
      "A write is still queued when approval is revoked; the worker retains an old approved plan. Which boundary needs enforcement?|Authorization at actual execution|Only approval at initial planning|Only a human-readable route name|Only the request token limit|Queued execution can outlive prior approval, so current authoritative permission must be checked before the effect.",
      "A timed-out purchase may have committed; only read-only reconciliation is allowed now. Which next action fits that constraint?|Query status under the existing identity|Submit a new purchase to test certainty|Retry with a new random purchase id|Treat timeout as a guaranteed rollback|A permitted status lookup can resolve uncertainty without creating an additional prohibited or duplicate write.",
      "A read-only workflow has spent 26 of 30 seconds and three of four calls. Persisting the result needs a reserved one second. Which remaining call can be admitted under worst-case bounds without changing scope or budgets?|A read capped at two seconds, then persist|A read capped at four seconds, then persist|A purchase capped at one second, then persist|An eight-second read with the call counter reset|Four seconds remain. A two-second read plus one-second persistence fits and remains read-only; four plus one exceeds the deadline, a purchase violates scope, and resetting a counter does not create time."
    ],
    "lang": "python"
  },
  {
    "slug": "context-provenance",
    "title": "Keep working context useful without laundering evidence",
    "intro": "A customer-support workflow can accumulate thousands of messages, retrieved pages and tool results. The active model context is a limited working representation, not a complete or automatically authoritative record. Summarization reduces size but can also discard caveats or merge conflicting claims.",
    "sections": [
      [
        "Separate raw evidence from working summaries",
        "Maintain durable source records with identifiers, timestamps and access scope; construct the working context from relevant allowed evidence. A summary should preserve the distinction between what a user claimed, what a tool returned and what has been independently verified. It should not promote a tentative statement into an approved fact. Attach provenance pointers so a later step can recover detail when the summary is insufficient.",
        "Context limits count the representation actually supplied to a model, including instructions, tool schemas, messages and requested output allowance. Character counts are not universal token counts. Truncating the oldest messages can remove a still-applicable consent boundary or approval expiration. Keep critical policy/state in authoritative application records, then include an appropriate current view in the model context."
      ],
      [
        "Protect state across summarization",
        "If two sources disagree, preserve the disagreement and its timing rather than selecting the most convenient statement. Retrieved documents and tool output can contain instructions, but those are evidence content rather than authority to change the application’s policy. A summary is still untrusted data unless its claims are validated for the intended use. Review whether sensitive facts are necessary before copying them into another agent’s context.",
        "The fixture constructs a short summary record carrying two original evidence IDs and a conflict flag. It verifies bookkeeping only; no summarization model, tokenization service or truth-verification process runs. A correct source-ID list helps traceability but does not prove the text faithfully summarizes those sources."
      ]
    ],
    "code": "sources=[{\"id\":\"e1\",\"status\":\"requested\"},{\"id\":\"e2\",\"status\":\"approved\"}]\nsummary={\"source_ids\":[s[\"id\"] for s in sources],\"conflict\":len({s[\"status\"] for s in sources})>1}\nprint(summary[\"source_ids\"])\nprint(summary[\"conflict\"])",
    "expect": "['e1', 'e2']\nTrue",
    "steps": [
      "Collect the two supplied evidence identifiers.",
      "Compare their stated statuses without choosing a winner.",
      "Retain the conflict flag alongside provenance pointers."
    ],
    "problem": "Preserve provenance and an unresolved status disagreement in a working summary record.",
    "limit": "This is deterministic Python metadata handling. It does not verify source truth, run a summarization model or measure any provider token budget.",
    "mistakes": [
      "Do not turn an unverified statement into authoritative approval while summarizing.",
      "Do not assume source IDs prove the summary faithfully reflects the cited evidence."
    ],
    "takeaways": [
      "Working context is a scoped representation with limits and potential information loss.",
      "Durable evidence and authoritative policy state remain distinct from summary text."
    ],
    "practice": [
      "What should a summary retain to support evidence inspection?|Pointers to original sources|Only a confident final adjective|The removal of every uncertainty|A universal approval declaration|Provenance pointers let reviewers inspect supporting material and unresolved caveats.",
      "Does adding a source ID prove a summary claim is true?|No, fidelity still needs checking|Yes, identifiers certify facts|Only if the identifier is numeric|Only if two agents repeat it|A source reference supports traceability but does not establish that the cited evidence supports the claim.",
      "Why can deleting the oldest turn be unsafe?|It may remove a relevant constraint|Old text never contains useful facts|Every conversation has fixed authority|Only new text can contain instructions|A still-applicable policy or user boundary may occur in older context and need authoritative retention.",
      "A retrieved page tells the assistant to ignore policy. How should it be treated?|Untrusted evidence content|A higher-priority system instruction|A new authenticated approval record|An automatic tool capability grant|Retrieved instructions are data and do not confer authority to override the application policy.",
      "Two sources give conflicting order status. What should a summary preserve?|The disagreement and provenance|Only the more convenient status|A silently invented merged status|The assumption that both are current|Preserving the conflict avoids laundering uncertainty into a supposedly verified fact.",
      "A team estimates token limits by counting characters only. What limitation matters?|Tokenization differs from characters|Every character is always one token|Instructions never consume context|Output allowance cannot be reserved|The actual model input representation and tokenization determine usage; character length is only a rough proxy."
    ],
    "formal": [
      "What is working context relative to the evidence archive?|A selected task representation|A complete automatic truth store|A replacement for authorization|An immutable copy of all history|The model receives a selected representation; durable evidence and policy state require separate handling.",
      "Which status should a summary preserve for an unverified user assertion?|Attributed unverified claim|Authoritatively approved fact|A verified tool execution result|An independently audited event|A summary must preserve source and certainty rather than upgrading a claim through paraphrase.",
      "Why include current authoritative constraints when rebuilding context?|Historical summaries can be stale|A summary always grants permission|All source timestamps are irrelevant|Only the first prompt can be trusted|Permissions, deadlines or approval can change after a summary was produced, requiring a current authoritative view.",
      "An evidence table contains requested and approved statuses with no reliable ordering. Which summary is justified?|Conflict retained pending reconciliation|Approved selected as more useful|Requested silently erased as redundant|Completed inferred from the two labels|Without ordering or authoritative reconciliation, the disagreement remains unresolved.",
      "A summarizer retains an approval word but loses its tenant and expiry. What is required before a write?|Recheck scoped current approval|Execute because approval is mentioned|Copy the summary to a second model|Remove the expired source reference|The missing scope/time conditions are essential and must come from authoritative approval state before execution.",
      "A model window holds16000tokens; instructions/tools use3000 and output reserve2000. What maximum remains for evidence under this accounting?|11000tokens for supplied evidence|16000tokens for supplied evidence|14000tokens for supplied evidence|19000tokens for supplied evidence|The remaining allowance is16000minus3000minus2000, or11000; actual provider accounting must still be verified.",
      "A summary cites an old price source and a newer correction but reports only the old value. Which audit detects the problem?|Claim-to-source temporal comparison|Checking that the citation list is nonempty|Counting the number of summary sentences|Comparing agent role names alphabetically|A nonempty citation list is insufficient; compare the actual claim with relevant source content and chronology.",
      "A workflow must preserve consent revocation while compressing history. Where should the authoritative revocation live?|Durable scoped application state|Only a generated conversation summary|Only the oldest truncated message|An optional decorative trace label|A consequential constraint should survive context reduction in authoritative durable state, with a current view supplied as needed.",
      "Two specialists receive summaries from one flawed source and agree. What evidence is absent from that agreement?|Independent support for the claim|Reproducible wording of the summary|A count of specialist responses|A record that the source was shared|Agreement from a common unsupported input does not establish independent verification of its claim.",
      "A context budget is 4,000 tokens. Mandatory authorization, conflict and citation records use 1,800. Optional indivisible evidence A uses 1,800 for utility 8; B uses 1,200 for utility 4; C uses 1,000 for utility 6. Which selection maximizes utility while retaining all mandatory evidence?|Mandatory plus B and C: 4,000 tokens, utility 10|Mandatory plus A and B: 4,800 tokens, utility 12|Mandatory plus A and C: 4,600 tokens, utility 14|A and B and C without mandatory authorization|B and C fill the remaining 2,200-token capacity and yield utility 10, exceeding A alone at utility 8. The higher-utility combinations exceed the cap; deleting mandatory constraints is forbidden."
    ],
    "lang": "python"
  },
  {
    "slug": "scoped-memory",
    "title": "Retrieve long-term memory under current access policy",
    "intro": "A help-desk assistant remembers prior cases to avoid asking the same questions. Long-term memory can help continuity, but it is a data system: retention, tenant boundaries, correction, deletion and retrieval authorization need explicit policies independent of conversational convenience.",
    "sections": [
      [
        "Conversation state is not a universal memory pool",
        "Short-term working state supports the current task; long-term records can persist across sessions. Store a purpose and scope for each retained fact. A preference, an account balance and an incident allegation have different reliability, sensitivity and freshness needs. Do not promote temporary reasoning into a permanent verified personal attribute merely because it appeared in a conversation.",
        "A memory retrieval candidate must pass current authorization before its contents are included in context. Semantic similarity is not an access-control decision. Apply tenant/user/resource filters with authoritative identity, then verify candidates as appropriate at the storage boundary. Caches and embeddings can also reveal sensitive associations, so deletion/correction workflows must cover derived representations and retained copies under the actual policy."
      ],
      [
        "Freshness, corrections and traceable use",
        "Preserve source and observation time so the assistant can distinguish historical facts from current state. A stored shipping address may be outdated; an old approval may have expired. When memory is corrected, avoid silently retaining the old value as equally current. Keep only the audit material permitted by retention policy and make any ongoing use of historical data clear to reviewers.",
        "The fixture filters synthetic memory rows using tenant identity and an expiry timestamp before returning text. It is a simple policy calculation, not a production vector-store ACL implementation or secure deletion demonstration. Real systems must prevent unauthorized rows from reaching model context and logs, including through caches and error paths."
      ]
    ],
    "code": "rows=[{\"tenant\":\"a\",\"expires\":10,\"text\":\"allowed\"},{\"tenant\":\"b\",\"expires\":10,\"text\":\"other\"},{\"tenant\":\"a\",\"expires\":4,\"text\":\"expired\"}]\nnow=5\nvisible=[r[\"text\"] for r in rows if r[\"tenant\"]==\"a\" and now<r[\"expires\"]]\nprint(visible)",
    "expect": "['allowed']",
    "steps": [
      "Check each record against the authenticated synthetic tenant.",
      "Apply the exclusive expiry rule using the supplied time.",
      "Return only content that passes both conditions."
    ],
    "problem": "Filter memory candidates by tenant and freshness before constructing context.",
    "limit": "Only an in-memory predicate is tested. It does not establish database ACL enforcement, secure deletion, vector-index filtering correctness or a legal retention policy.",
    "mistakes": [
      "Do not use vector similarity as a substitute for tenant/resource permission.",
      "Do not assume deleting one source row also removes every cached or embedded copy."
    ],
    "takeaways": [
      "Persistent memory requires scoped purpose, provenance and retention rules.",
      "Authorization and freshness must be applied before memory enters context."
    ],
    "practice": [
      "Why is semantic similarity insufficient to authorize memory retrieval?|Similarity does not establish access|Similar records always share tenants|Embedding distances encode permission|The model can infer all current roles|Relevance to a query and permission to access a record are separate properties.",
      "Which property helps distinguish historical memory from current facts?|Source time and validity scope|The longest stored text alone|An arbitrary memory row number|A high generated confidence word|Timestamps and validity conditions support interpretation of when a remembered claim applies.",
      "What should a correction process consider besides source text?|Caches and derived representations|Only the display color of memories|Only the alphabetical key ordering|A permanent duplicate of every value|Information may persist in derived stores or caches and needs a defined correction/deletion policy there too.",
      "A similar case belongs to another tenant. What must occur before context inclusion?|Deny unauthorized retrieval|Include it without identifying names|Ask the model to forget it afterward|Treat high similarity as permission|Current access policy must govern candidate inclusion before sensitive content reaches context.",
      "A memory fact expires at10 and the current time is10 under an exclusive expiry rule. Is it valid?|No, its validity window ended|Yes, expiry includes all later times|Only if its text is concise|Only if the route uses an agent|An exclusive rule requires current time strictly less than the expiry boundary.",
      "A prior approval is stored as a permanent user preference. What design error occurs?|Conflating scoped authority and memory|Using too many source timestamps|Keeping any reference to past events|Making an explicit retention policy|Approval has task/resource/time conditions and must not become a reusable permanent preference."
    ],
    "formal": [
      "Which memory property is distinct from retrieval relevance?|Current access authorization|The vector similarity magnitude|The number of matching tokens|The ordering of search results|A relevant result can still be inaccessible; authorization must be established separately.",
      "Why attach purpose to retained memory facts?|Limit justified retention and use|Guarantee indefinite storage rights|Replace the source evidence record|Convert every claim into a preference|Purpose supports appropriate retention and use boundaries without granting unlimited future reuse.",
      "What should happen before private memory enters an agent prompt?|Scope and validity checks|A public citation of the raw record|Automatic reuse across all tenants|A longer summary of the same secret|Checks must precede context inclusion because later redaction cannot undo a prior disclosure.",
      "TenantA has one valid row, tenantB one valid row and tenantA one expired row. Which count survives tenantA plus freshness filters?|One permitted current row|Two rows because tenantA matches|Two rows because expiry matches|Three rows because all are relevant|Both scope and freshness are necessary; only the valid tenantA row satisfies the conjunction.",
      "A memory cache key omits tenant identity and returns a previous tenant's answer. What boundary is broken?|Cross-tenant context isolation|Only the average latency target|The numeric ordering of row ids|The embedding vector dimension|Cache scoping can leak data even if the underlying retrieval store has a tenant filter.",
      "A user corrects an address, but the semantic index still surfaces the old address as current. Which process needs repair?|Correction propagation and validity|Only the similarity threshold value|The model's maximum output tokens|The ordering of agent role names|Corrections must propagate or invalidate stale derived representations and preserve clear current-versus-historical semantics.",
      "A storage layer filters only after returning raw candidates to the model for classification. Why is that too late?|Unauthorized content already escaped|The model cannot compare text at all|Filtering requires a target label|Every candidate is always public|Authorization must gate content before model inclusion, not after the sensitive material is already disclosed.",
      "A purchase approval expires at12 for orderX; memory recalls approved at13 for orderY. Which missing conditions prevent relying on it?|Time and resource scope both fail|Only its sentence length is too short|Only the route destination changed|The old memory has insufficient tokens|An expired approval for a different resource does not authorize the proposed new action regardless of remembered wording.",
      "A deletion request removes the primary row while replicas and embeddings remain live. Which claim is unsupported without further evidence?|Complete deletion of retained data|Deletion of that primary row|A need to inspect derived copies|A record that a request was received|Removing a single representation does not establish erasure from all retained and derived locations.",
      "A memory query is for tenant A under policy revision 5 at time 12:00. R1 is A/revision4/current; R2 is B/revision5/current; R3 is A/revision5/valid until13:00; R4 is A/revision5/expired11:00. Which evidence may support the answer without bypassing tenant, correction or validity rules?|R3 with its revision and source pointer retained|R1 and R3 merged because both belong to tenant A|R2 and R3 merged because both use revision 5|R3 and R4 merged because revision overrides expiry|Only R3 meets tenant, current revision and time-validity checks. Revision and source provenance must remain attached so later correction and audit can identify the evidence used."
    ],
    "lang": "python"
  },
  {
    "slug": "checkpoint-resume",
    "title": "Resume durable state without duplicating effects",
    "intro": "A workflow worker can crash after sending a tool request but before saving its result. Resuming from a durable checkpoint should recover what is known, what is uncertain and which effects may already have occurred. A serialized conversation alone cannot resolve an external write’s commit status.",
    "sections": [
      [
        "Checkpoint state and transition versions",
        "Persist the workflow identifier, current state, transition version, relevant evidence and pending operation identities. A resume operation should load a compatible schema and validate the checkpoint rather than interpreting arbitrary stored instructions as executable code. Store the minimum required sensitive content and protect the checkpoint as an application data resource.",
        "Use concurrency control when multiple workers can claim the same transition. A compare-and-set update from version v to v+1 succeeds only if the stored version is still v. This can prevent two workers from both recording themselves as the owner of one local transition. It does not by itself guarantee that an external API runs exactly once. Effects require an appropriate stable identity, transactional design or reconciliation protocol across the relevant system boundary."
      ],
      [
        "Recover uncertain work honestly",
        "Distinguish planned, dispatched, completed and reconciled statuses. If a process dies after dispatch, a later worker should not assume no effect occurred merely because a local completion record is absent. Query the authoritative external operation status where supported; retry according to that service’s idempotency and conflict contract. Do not reuse an operation identity with changed payload unless the documented contract allows that behavior.",
        "The fixture uses an in-memory SQLite conditional update twice from the same old version. Only the first advances the row. It demonstrates atomic local version checking, not distributed exactly-once effects, durable disk recovery or an external idempotency service."
      ]
    ],
    "code": "import sqlite3\nc=sqlite3.connect(\":memory:\")\nc.execute(\"CREATE TABLE state(id TEXT PRIMARY KEY, version INTEGER)\")\nc.execute(\"INSERT INTO state VALUES (?,?)\",(\"w\",0))\na=c.execute(\"UPDATE state SET version=1 WHERE id=? AND version=0\",(\"w\",)).rowcount\nb=c.execute(\"UPDATE state SET version=1 WHERE id=? AND version=0\",(\"w\",)).rowcount\nprint(a,b)\nprint(c.execute(\"SELECT version FROM state\").fetchone()[0])",
    "expect": "1 0\n1",
    "steps": [
      "Create one synthetic workflow row at version zero.",
      "Attempt the same expected-version transition twice.",
      "Observe one successful row update and one stale-version rejection."
    ],
    "problem": "Prevent two local claims of the same transition using a conditional SQL update.",
    "limit": "Actual SQLite conditional updates execute in memory. There is no external effect, multi-process durability proof, production database transaction test or distributed exactly-once guarantee.",
    "mistakes": [
      "Do not infer no external effect solely from a missing local completion record.",
      "Do not call a local version update a distributed exactly-once execution guarantee."
    ],
    "takeaways": [
      "Checkpoint versions and operation identities support controlled recovery.",
      "Ambiguous external effects require reconciliation at the effect authority."
    ],
    "practice": [
      "What does an expected-version update prevent locally?|A stale transition overwriting state|Every possible external duplicate|All loss of disk data after a crash|Any future schema incompatibility|A conditional version update rejects a transition based on an outdated stored version.",
      "What must a checkpoint distinguish after a dispatched write times out?|Unknown versus confirmed completion|Only positive versus negative wording|The alphabetical order of tool names|The length of the prior conversation|Uncertain completion must remain explicit until authoritative effect status is reconciled.",
      "Does saving a conversation provide distributed exactly-once effects?|No, effect coordination is separate|Yes, every saved message commits once|Only if the transcript is compressed|Only if the workflow uses three agents|A transcript records context and cannot by itself coordinate an external system's write semantics.",
      "Two workers attempt version0 to1 using a conditional update. What should the second observe after the first succeeds?|A stale-version failure|A second successful version0 claim|A new approval automatically|An external refund rollback|Once version advances, the old expected-version predicate no longer matches the row.",
      "An operation key is reused with a different refund amount. What must be checked?|The service's conflict contract|Only the key's character length|The order of agent handoffs|Whether the previous text was polite|Idempotency behavior for changed payload under a reused identity is service-specific and may be a conflict.",
      "A restart loads a checkpoint with an unsupported schema version. What is appropriate?|Validate and migrate or stop|Execute its fields as code|Silently discard all past effects|Assume it means the latest format|Resumption needs a compatible validated state representation rather than an unchecked interpretation of old data."
    ],
    "formal": [
      "What does a durable workflow identifier connect?|Related state and operation records|Universal permission to all tools|A complete proof of correctness|An automatic new user identity|A stable identifier supports association of checkpoints, transitions and effect records across retries.",
      "Why persist a pending operation identity before recovery decisions?|To inspect a potentially issued effect|To guarantee the request never arrived|To authorize a changed-payload retry|To remove the need for status checks|The identity lets recovery reason about the same logical operation rather than inventing a second action.",
      "Which claim exceeds a local compare-and-set update?|Exactly-once external side effects|A stale local version was rejected|One transition advanced its version|A row count identified the winner|Local state coordination alone does not atomically control external service execution.",
      "A row starts at version4; two workers update only where version4 and set version5. What are valid sequential success counts?|One update then zero updates|One update then one update|Zero updates then zero updates|Two updates then two updates|The first matching update changes the stored version, making the second expected-version predicate stale.",
      "A worker crashes after a payment provider accepted a request but before local result storage. What is unknown locally?|The final authoritative effect status|Whether any local task was created|The original operation identity if saved|The existence of the planned amount|The local gap leaves external completion uncertain; missing local completion does not prove the provider did nothing.",
      "A recovery routine creates a new key for every timeout retry. What risk increases?|Duplicate logical external effects|Guaranteed atomic local rollback|Automatic preservation of deduplication|A fixed external operation identity|A new key can be treated as a distinct operation and defeat deduplication of the original uncertain request.",
      "A checkpoint schema changes amount from integer cents to decimal units without migration. Which recovery risk requires action?|Misinterpreted persisted effect inputs|Only a different field sort order|The need for a longer route label|An increase in principal components|Schema compatibility includes units and meaning; blindly loading the old representation can change consequential amounts.",
      "One transaction commits a local ready state, but a separate external write has no dedup/status contract. Which guarantee remains unsupported?|Atomic exactly-once across both systems|Durability of the local commit|A known local transition version|A need for external-effect reconciliation|A local commit cannot establish atomic behavior across an uncoordinated external effect boundary.",
      "A resume policy sees dispatched/unknown keyK and current approval revoked. Which permitted action can reduce uncertainty without repeating the write?|Authorized read-only status reconciliation|A fresh write using new keyJ|A hidden approval reset in the checkpoint|A forced replay of the old tool command|Current revoked approval prevents repeating the write; appropriately authorized status lookup can clarify the existing effect.",
      "State revision 7 records refund key K with unknown remote outcome. A stale worker expects revision 6; a status lookup now confirms K succeeded. Which recovery respects the local version check and avoids a second refund?|Reconcile K; record success with current-version CAS|Accept the revision-6 update because K has now succeeded|Create key K2 and refund again before updating revision 7|Retry K as a new operation and discard the old checkpoint|The stale compare-and-set cannot overwrite revision 7. Reconciliation establishes that K already succeeded; a current-version conditional update records that evidence without issuing another logical refund."
    ],
    "lang": "python"
  },
  {
    "slug": "trace-structure",
    "title": "Trace causal steps without logging private payloads",
    "intro": "A multi-step agent service needs to explain why a customer request took several seconds and which tool caused a failure. A trace records relationships among operations. It should connect decisions and effects without collecting every sensitive prompt, credential or returned document.",
    "sections": [
      [
        "Trace identity and causal structure",
        "Use a workflow or request correlation identifier and a span identifier for each step. A parent-child relationship can show that a tool call was launched by a particular planning step. Concurrent siblings can overlap in time, so their duration sum is not the same as end-to-end wall time. A missing span may indicate instrumentation or export loss rather than a tool that never executed.",
        "Useful attributes include tool class, outcome category, latency, retry count, source identifiers, model/runtime version and budget consumption. Sensitive payloads need redaction or omission under an explicit data policy. Request identifiers help correlation but are not authorization credentials. Do not allow possession of a trace ID to grant access to another tenant’s case."
      ],
      [
        "Instrument outcomes and missing evidence",
        "Separate a denied proposal, validation failure, timeout, external business rejection and model-generation failure. They suggest different remediation. Record whether a result is known or ambiguous; avoid a single success boolean that hides a timed-out write’s unknown effect. Sampling and exporter failures should be visible so reviewers know what evidence is missing. A trace is an operational record, not proof that a generated explanation is factually correct.",
        "The fixture stores two sibling span intervals and compares summed duration with their covering wall interval. It verifies simple timing arithmetic and shows concurrency overlap. It does not run a tracing backend, synchronize clocks, verify provider billing or establish production service-level latency."
      ]
    ],
    "code": "spans=[{\"id\":\"a\",\"parent\":\"root\",\"start\":0,\"end\":4},{\"id\":\"b\",\"parent\":\"root\",\"start\":1,\"end\":5}]\nprint(sum(s[\"end\"]-s[\"start\"] for s in spans))\nprint(max(s[\"end\"] for s in spans)-min(s[\"start\"] for s in spans))\nprint({s[\"parent\"] for s in spans})",
    "expect": "8\n5\n{'root'}",
    "steps": [
      "Calculate the two individual span durations.",
      "Compute the wall interval covering both overlapping spans.",
      "Retain their shared causal parent without assuming sequential execution."
    ],
    "problem": "Contrast summed tool time with elapsed time for overlapping synthetic spans.",
    "limit": "Only local integer timing arithmetic executes. Clock skew, missing spans, queue time and real tracing collection require additional integration evidence.",
    "mistakes": [
      "Do not add concurrent span durations and present the result as request wall time.",
      "Do not place raw authorization tokens or private documents into routine trace attributes."
    ],
    "takeaways": [
      "Causal identifiers and outcome categories make traces useful without indiscriminate payload capture.",
      "Operational traces have sampling, timing and truth limitations that reports should disclose."
    ],
    "practice": [
      "What does a parent span identifier describe?|A causal operation relationship|A universal access credential|A calibrated model confidence|A mandatory sequential ordering|Parent-child links describe causal structure; child operations can still overlap in time.",
      "Why can summed tool durations exceed wall time?|Concurrent tool spans overlap|Every recorded time is invalid|The model completed before start|Trace ids are always duplicated|Overlapping sibling operations contribute individually to a sum while sharing elapsed wall-clock time.",
      "Should a trace identifier authorize access to a case?|No, access policy is separate|Yes, any unique identifier grants access|Only if the identifier is hexadecimal|Only if its string length exceeds twenty|Correlation identifiers support diagnostics and do not establish resource permission.",
      "A timeout is logged simply as success=false after a write. What important distinction may be missing?|Whether the effect is unknown|Only the output font chosen|The order of span field names|Whether tool names are lowercase|A timeout can leave an external write outcome uncertain, requiring a different recovery path than a known rejection.",
      "A diagnostic exporter samples away some spans. What should reviewers know?|Trace evidence is incomplete|Unseen operations never occurred|Every missing span was denied|The workflow must be error-free|Sampling or loss limits what can be inferred from absence of instrumentation.",
      "A logger copies a bearer token into a trace. Which correction is appropriate?|Omit or redact the credential|Move it to a longer attribute|Encode it as a correlation id|Repeat it in every child span|Useful operational metadata can be retained without storing an authorization secret."
    ],
    "formal": [
      "Which trace field links a tool operation to the step that launched it?|Its parent span relationship|The customer's password value|Its preferred display color|The number of output adjectives|A parent relationship supports causal linkage among workflow operations.",
      "What does an absent span prove by itself?|Only that its evidence is absent|The tool was never dispatched|The tool completed successfully|No external effect can exist|Instrumentation loss and sampling can omit real operations, so absence alone is not execution proof.",
      "Why distinguish denied and timed-out operations?|Their recovery semantics differ|Their names must sort differently|Both imply no possible effect|Both require unconditional replay|A known denial and ambiguous timeout can require different next actions, particularly for writes.",
      "Two sibling spans cover[0,4] and[1,5]. What are summed and covering durations?|8summed,5covering|5summed,8covering|4summed,4covering|9summed,9covering|Each span lasts4, while their combined wall interval runs from0 through5.",
      "A trace stores model name but not a configuration revision after prompts change. What reproducibility evidence is incomplete?|The effective execution configuration|The existence of a trace identifier|The fact that a tool name was logged|The order of JSON attributes|Model identity alone does not identify changed prompts, policies or tool configuration affecting execution.",
      "A support analyst receives a trace ID for another tenant and asks the API for its spans. What check remains necessary?|Current tenant/resource authorization|Whether the ID looks random enough|Whether the trace has child spans|Whether the model output is fluent|Possession of a diagnostic identifier does not replace access control for the associated resource.",
      "A sampled trace lacks a payment span, but the provider ledger shows a committed payment. Which conclusion is justified?|Trace absence did not prove no effect|The ledger must be fabricated by definition|Sampling guarantees no writes can happen|The request identifier authorized payment|Authoritative effect records can reveal a real operation omitted by sampling or instrumentation loss.",
      "A latency report sums two fully overlapping6second calls as12seconds request latency. What correction is needed under zero other work?|Report6seconds wall duration|Report12seconds as confirmed wall time|Report0seconds because calls overlap|Report3seconds by averaging all times|Concurrent durations do not add to wall time; two same-interval6second calls span6seconds.",
      "A failure taxonomy labels all tool problems network-error, including policy denial and invalid arguments. Which debugging capability is lost?|Cause-specific remediation routing|The ability to count total spans|The ability to format timestamps|The source request identifier|Different causes require different recovery; collapsing them obscures whether to correct inputs, stop or retry.",
      "A parent span runs from 0 to120ms. Child A runs10 to90ms and B runs30 to110ms; the trace reports dropped spans. Which timing conclusion is supported without treating missing observations as idle time?|Observed children overlap60ms; missing spans prevent complete attribution|Child durations sum160ms, so parent latency must be160ms|Observed children overlap20ms and every uncovered interval is idle|Parent minus child-duration sum gives minus40ms of idle time|The overlap is min(90,110)-max(10,30)=60ms. Concurrent child durations can exceed parent duration, and dropped spans prevent assigning all unobserved time to idleness."
    ],
    "lang": "python"
  },
  {
    "slug": "cost-accounting",
    "title": "Account for usage, retries and concurrent budget reservations",
    "intro": "A workflow can perform several model calls and tool requests before producing one answer. Cost belongs to the whole logical task, including retries, branches and canceled work according to the provider’s actual contract. A final-response token count alone does not describe the task’s resource usage.",
    "sections": [
      [
        "Make units and rates explicit",
        "Compute modeled cost from separately measured input/output units and their applicable rates. State the rate version and accounting assumptions, including caching or discounts only if actually supported and observed. Use integer smallest-currency units or Decimal arithmetic where rounding matters. A synthetic token calculation is not a current provider quote or a billing reconciliation.",
        "Reserve budget before dispatch when parallel branches can spend concurrently, then reconcile the reservation with actual usage. A cap checked only after completion can detect overspend without preventing it. Shared task budgets should include all attempted calls that are chargeable under the relevant contract, not only successful final turns. Keep reported estimates distinct from settled invoice amounts."
      ],
      [
        "Bound service time as well as money",
        "Lower cost does not automatically imply faster completion or better task quality. Track latency, error rates and useful outcomes alongside spend. An invalid-argument correction may add another call, while an ambiguous write may need a read-only reconciliation step. Cost pressure never grants permission to skip approval or send sensitive context to an otherwise disallowed destination.",
        "The fixture uses Decimal to calculate two calls with explicitly synthetic input/output rates. It includes the retry in the total. No provider is contacted, rates are illustrative and token counts are supplied constants; the example verifies arithmetic and accounting scope only."
      ]
    ],
    "code": "from decimal import Decimal\nrate_in=Decimal(\"0.000002\")\nrate_out=Decimal(\"0.000006\")\ncalls=[(1000,100),(500,50)]\ncost=sum((Decimal(i)*rate_in+Decimal(o)*rate_out for i,o in calls),Decimal(0))\nprint(f\"{cost:.5f}\")\nprint(sum(i+o for i,o in calls))",
    "expect": "0.00390\n1650",
    "steps": [
      "Calculate input and output charges for each supplied call using explicit decimal rates.",
      "Include both initial and retry usage in the logical task sum.",
      "Report modeled monetary cost separately from the supplied total token count."
    ],
    "problem": "Compute a two-call modeled task cost without floating-point currency ambiguity.",
    "limit": "The example verifies synthetic Decimal arithmetic, not current vendor prices, observed tokenizer counts, cache eligibility or actual invoice charges.",
    "mistakes": [
      "Do not omit chargeable retries from task-level usage because the final response succeeded.",
      "Do not label illustrative rates or modeled estimates as a current provider invoice."
    ],
    "takeaways": [
      "Usage, rate version, units and rounding form an explicit cost model.",
      "Concurrency-safe reservations and final reconciliation serve different purposes."
    ],
    "practice": [
      "Why keep input and output usage separate in a cost model?|Their rates can differ|Their sum is always zero|Output is universally free|Only output uses any resources|Different usage categories can have different rates and accounting rules.",
      "What should a synthetic price calculation be labeled?|A modeled illustrative estimate|A verified current provider invoice|A guarantee of future billing|An independent model-quality score|Supplied example rates verify arithmetic but not a live provider contract or invoice.",
      "Why reserve budget before concurrent dispatch?|Avoid jointly approving excess spend|Guarantee every call will succeed|Authorize any requested tool effect|Eliminate all rate version changes|Atomic reservation prevents multiple workers from each treating the same remaining capacity as available.",
      "A successful task used one failed chargeable call and one retry. What should cost aggregation include?|Both chargeable attempts|Only the final successful output|Only calls with fluent answers|Neither call after a retry|Task accounting includes chargeable attempted work under the actual contract, not only the successful final turn.",
      "A cost cap is checked only after two expensive calls finish. What does it fail to provide?|Prevention of that overspend|Detection of the recorded total|A comparison against a threshold|A reason to inspect the account|An after-the-fact check can flag a violation but cannot prevent already incurred usage.",
      "A cheaper model destination is prohibited for sensitive data. What governs routing?|The data-access policy still applies|Any positive savings overrides policy|The shortest generated answer wins|The lower rate grants new authority|Cost optimization does not authorize disallowed disclosure or destinations."
    ],
    "formal": [
      "What evidence is needed to turn estimated model cost into reconciled actual cost?|Observed usage under applicable rates|Only the final response length|Only the number of agents named|A remembered price from an old blog|Reconciliation needs observed usage and the relevant contract/rate treatment, not a textual estimate alone.",
      "Why can Decimal be useful in a currency example?|It represents stated decimal arithmetic|It retrieves current provider rates|It guarantees no service-side charges|It measures tokens automatically|Decimal avoids some binary floating-point representation surprises when applying stated decimal rates.",
      "Which item can task-level accounting otherwise miss?|Chargeable failed attempts|Only alphabetic tool names|The order of JSON object keys|A numerical workflow version|Failed or retried work can still consume billable resources according to the applicable contract.",
      "At input rate0.000002 and output rate0.000006, a call uses1000input and100output units. What is modeled cost?|0.00260currency units|0.00620currency units|0.00110currency units|0.00026currency units|Input costs0.002 and output costs0.0006, totaling0.0026 under the supplied synthetic rates.",
      "A retry consumes half the first call's1000input/100output units at the same rates. What is the combined modeled total?|0.00390currency units|0.00260currency units|0.00520currency units|0.00130currency units|The first call costs0.0026 and the half-sized retry costs0.0013, totaling0.0039.",
      "Two parallel calls each reserve0.7 with a total task cap1.0 and no other spend. Which admission policy respects the cap?|Admit only one reservation initially|Admit both after independent reads|Admit both and round total downward|Treat retries as universally free|Two reservations would total1.4; atomic budget accounting must prevent both from consuming the same available1.0.",
      "A dashboard multiplies all tokens by the cheaper input rate although output has a higher rate. What error results?|Understated modeled output charges|A guaranteed correct task invoice|A higher accuracy score for answers|A more precise input tokenizer|Combining categories under the lower rate undercounts output cost when its applicable rate is greater.",
      "An invoice includes a documented cache discount, but the example has no cache-hit evidence. Which estimate is defensible?|Do not assume discount eligibility|Apply the discount to every input|Treat cached tokens as output only|Delete rate-version information|A discounted category should be applied only when the contract and observed usage support eligibility.",
      "A workflow has0.2budget left; an authorized status lookup needs0.1 while repeating an uncertain write needs0.15 but lacks approval. Which is admissible on stated facts?|The authorized status lookup only|Either action because both are cheap|The write because it uses fewer calls|Neither because all recovery is free|Affordability and authority are independent; the read meets both stated constraints while the write lacks required approval.",
      "A cost cap is1.00. Settled spend is0.25 and A reserves0.30. B reserves0.40; C requests0.20 but is initially denied. A then settles at0.10 and releases its reservation, after which C retries. With B still pending, what accounting follows atomic admission?|Spend0.35, reservations0.60, available0.05|Spend0.55, reservations0.40, available0.05|Spend0.35, reservations0.90, available minus0.25|Spend0.25, reservations0.60, available0.15|Initially B fits but C does not. Settling A adds0.10 to0.25 and removes its0.30 reservation, permitting C. Pending B and C reserve0.60, leaving1.00-0.35-0.60=0.05."
    ],
    "lang": "python"
  },
  {
    "slug": "workflow-evaluation",
    "title": "Evaluate workflow outcomes and expose uncertainty",
    "intro": "A customer-service agent can produce a persuasive answer even when it routed the wrong case, missed an approval gate or failed to save state. Evaluation must inspect the task outcome and process constraints, not only the final prose.",
    "sections": [
      [
        "Measure outcomes and process separately",
        "Define a task rubric before testing: was the user’s requirement met, was the answer supported, were tools authorized, were sensitive records scoped correctly and was the final effect state known? Record intermediate failures even if a later answer looks fluent. A pass rate based on final text alone can hide unsafe successful-looking executions.",
        "Use representative normal cases, edge cases and injected operational failures such as stale checkpoints, missing sources, invalid arguments, revoked approval and timed-out writes. Synthetic tests establish behavior on their fixtures; they do not prove population effectiveness. Separate development/tuning cases from a held-out evaluation set to reduce overfitting to familiar prompts. Compare rates with denominators and uncertainty rather than selecting only favorable examples."
      ],
      [
        "Connect evaluation back to operations",
        "Trace review can identify which stage failed, but logs may be incomplete and should not become a second store of private raw payloads. Distinguish safe blocked outcomes from task success: denying an unauthorized write can be the correct policy behavior even when the requested business action remains incomplete. A regression gate should preserve both task-quality and safety constraints.",
        "The fixture evaluates three synthetic cases against a combined outcome-and-policy rule. A superficially completed case with a policy violation fails, and a safely blocked but incomplete case is not called task success. The arithmetic does not grade real language-model outputs or estimate production performance."
      ]
    ],
    "code": "cases=[{\"done\":True,\"policy_ok\":True},{\"done\":True,\"policy_ok\":False},{\"done\":False,\"policy_ok\":True}]\npassed=[c[\"done\"] and c[\"policy_ok\"] for c in cases]\nprint(sum(passed),len(passed))\nprint(sum(c[\"policy_ok\"] for c in cases))",
    "expect": "1 3\n2",
    "steps": [
      "Evaluate completion and policy compliance as distinct supplied facts.",
      "Require both for the combined task-success count.",
      "Report policy compliance separately so a safe block is not mislabeled as completed work."
    ],
    "problem": "Compute distinct synthetic task-success and policy-compliance counts.",
    "limit": "The fixture verifies boolean accounting on supplied synthetic outcomes. It does not perform semantic answer grading, representative population evaluation or actual production monitoring.",
    "mistakes": [
      "Do not count fluent output as evidence of authorized, correct tool execution.",
      "Do not silently label a safe blocked request as a completed business task."
    ],
    "takeaways": [
      "Task quality and process constraints need separate measurable evidence.",
      "Representative failure fixtures and held-out cases complement outcome accounting."
    ],
    "practice": [
      "Why evaluate intermediate workflow steps as well as final text?|Unsafe effects can hide behind fluent output|Final text always proves tool correctness|Every trace record is automatically complete|A longer answer implies a safer process|A persuasive final answer does not establish that prior actions obeyed policy or produced the claimed effects.",
      "Is a safely denied unauthorized write automatically task completion?|No, safe block is a separate outcome|Yes, every denial completes the user goal|Only if the output contains an apology|Only if the task used multiple agents|Correct policy enforcement and successful completion of the requested business action are distinct outcomes.",
      "Why reserve held-out workflow cases?|Assess behavior beyond tuned examples|Guarantee every future task succeeds|Avoid defining an evaluation rubric|Replace all operational monitoring|An independent case set reduces the risk of reporting performance only on familiar cases used during tuning.",
      "A polished refund message is returned although the tool was denied. What evidence is missing for its claim?|Confirmed authorized effect|The model's chosen response tone|The count of output adjectives|The alphabetical tool ordering|The final message must not claim an effect without authoritative confirmation of permitted execution.",
      "A trace exporter drops some failed spans. Which evaluation caveat is necessary?|Recorded failures may be incomplete|No omitted operation could have failed|Every missing span is a success|The measured denominator doubles|Instrumentation loss limits completeness of the observed failure evidence.",
      "A synthetic suite tests one timeout behavior. What can be claimed?|That supplied fixture was exercised|All production failures are covered|A universal user satisfaction rate|A guaranteed absence of future errors|A passing synthetic case supports its bounded behavior, not exhaustive effectiveness or population coverage."
    ],
    "formal": [
      "Which combined criterion distinguishes successful safe execution from fluent failure?|Completed and policy compliant|The longest final response|The largest number of tools used|A high self-reported confidence|Both fulfilling the task and respecting process constraints are required for combined success.",
      "Why define an adjudication rubric before inspecting results?|Prevent post-hoc goal changes|Guarantee one hundred percent accuracy|Remove all evaluator disagreements|Eliminate every unknown effect state|A predeclared rubric limits post-hoc changes that favor a desired pass-rate narrative.",
      "What is the role of a stale-checkpoint test fixture?|Exercise a specific recovery boundary|Prove every disk failure is recoverable|Estimate all users' satisfaction scores|Replace source-version evidence|The fixture checks the supplied stale-state behavior within a bounded scenario rather than all recovery conditions.",
      "Three cases have(done,policy)=(true,true),(true,false),(false,true). What is combined success count?|One of three cases|Two of three cases|Three of three cases|Zero of three cases|Only the first case satisfies both completion and policy constraints, while policy alone passes in two.",
      "A release improves final-answer accuracy but introduces cross-tenant memory disclosure in one case. Which gate should fail under an isolation requirement?|The tenant-isolation regression gate|Only a decorative wording preference|No gate because average accuracy rose|Only the maximum token-count check|A required access boundary cannot be traded away by a higher average answer-quality score.",
      "A team repeatedly edits prompts after seeing held-out test labels. What status should that set now have?|A used development/evaluation set|A permanently untouched final test|An independent unseen population sample|A guaranteed unbiased quality benchmark|Repeated tuning against its outcomes means it no longer supplies untouched final evaluation evidence.",
      "A refund workflow safely blocks expired approval but does not issue a refund. Which outcome pair is accurate?|Policy pass, task incomplete|Policy failure, task complete|Policy pass, task complete|Both outcomes necessarily unknown|Enforcing the expired-approval boundary is policy-correct while the requested refund remains uncompleted.",
      "An evaluation reviews20selected easy cases but claims98%all-task reliability. What is unsupported on those facts?|Whole-population reliability|A count of those20reviewed cases|A description of the selection policy|A need for harder failure cases|A selected easy-case sample cannot justify a precise whole-population reliability claim without representative evidence.",
      "A timed-out write has unknown effect and the final answer claims no charge occurred. Which correction is needed?|Reconcile before a firm claim|Keep the claim if prose is concise|Assume every timeout means rollback|Call a new write to create certainty|Unknown effect state must not be turned into a definite no-charge statement without authoritative reconciliation.",
      "A release requires at least95 completed tasks out of100, zero unauthorized effects and at least90% success on10 crash-recovery cases. Results are96 completions, one unauthorized effect and8 successful recoveries. What gate result follows from independent mandatory thresholds?|Completion passes; safety and recovery fail, so reject release|The96% completion score overrides the other two results|The three metrics may be averaged to waive the safety failure|Eight recovered cases satisfy90%, so only safety needs review|Completion reaches96%, but one unauthorized effect violates the zero-tolerance gate and8/10 is80%, below90%. Passing one metric cannot compensate for either independent failure."
    ],
    "lang": "python"
  }
],[
  {
    "id": "workflow-orchestration",
    "title": "OpenAI Cookbook: Orchestrating agents, historical routines and handoffs example",
    "url": "https://github.com/openai/openai-cookbook/blob/2d5b1a9b6e706a732b03048d701c7086fda5f010/examples/Orchestrating_agents.ipynb",
    "source": {
      "repo": "openai/openai-cookbook",
      "commit": "2d5b1a9b6e706a732b03048d701c7086fda5f010",
      "path": "examples/Orchestrating_agents.ipynb",
      "verification": "Pinned historical notebook read. It presents routines/handoffs and explicitly labels Swarm as a proof-of-concept, not a production library. These lessons use independent offline Python mechanisms, do not call its SDK and do not assert current provider API compatibility."
    }
  },
  {
    "id": "workflow-sqlite",
    "title": "Python sqlite3: transactions and DB-API interfaces",
    "url": "https://github.com/python/cpython/blob/42155a0feaca9ba6991942c323cbe9fb7278be3c/Doc/library/sqlite3.rst",
    "source": {
      "repo": "python/cpython",
      "commit": "42155a0feaca9ba6991942c323cbe9fb7278be3c",
      "path": "Doc/library/sqlite3.rst",
      "verification": "Official pinned sqlite3 documentation inspected. The local expected-version fixture executes actual in-memory SQLite conditional updates and claims no distributed exactly-once effects."
    }
  }
]);
