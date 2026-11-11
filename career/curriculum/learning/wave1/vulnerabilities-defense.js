'use strict';
const {course}=require('./wave4-security-helper');
module.exports=course('vulnerabilities-defense',[
  {
    "id": "vuln-asset-evidence",
    "title": "Connect findings to deployed component evidence",
    "intro": "A security team receives an advisory for a parser used in several products. It must establish which deployed artifacts actually contain the affected component and who owns their treatment before interpreting a scanner report as a completed risk decision.",
    "sections": [
      [
        "Build a useful finding record",
        "A vulnerability is a weakness that can be exploited under relevant conditions. A finding is evidence about a possible weakness in an asset; it needs validation against the actual product, version, configuration and usage. A component inventory or software bill of materials can describe dependencies, including transitive components introduced by other packages. It is an input to analysis, not proof that every listed component is exploitable.",
        "Record the affected asset, deployed version or digest, advisory reference, evidence time, owner and observed exposure. An installed library may be unused, conditionally reachable or loaded only by an internal job. Conversely, a version not found by one scanner can still exist in a bundled binary or container layer. Scope and evidence limitations should remain visible rather than being translated into an unconditional safe label."
      ],
      [
        "Reconcile reports with actual deployment",
        "A source manifest describes intended dependencies, while a lockfile resolves versions and a built artifact captures what is shipped. Runtime inventory may differ again when an old image remains deployed. Reconcile these layers, especially after a patch: changing the manifest alone does not replace an active workload. Direct and transitive dependencies need a supported upgrade path and regression testing.",
        "The fixture joins synthetic deployed components to an explicitly defined affected-version set. Version membership is exact for these supplied labels; it is not a general semantic-version parser and makes no claim about real CVEs. The output identifies assets for investigation, not confirmed exploitation. No network scanning occurs. An operational inventory would also capture provenance, build identity, deployment location and accountable treatment."
      ]
    ],
    "code": "deployed={'portal':'1.4','worker':'1.7','archive':'1.4'}\naffected={'1.3','1.4','1.5'}\nprint(sorted(a for a,v in deployed.items() if v in affected))",
    "expect": "['archive', 'portal']",
    "problem": "Match synthetic deployed version labels against an explicit advisory set.",
    "steps": [
      "Use observed deployed component versions.",
      "Match against the supplied affected set.",
      "Produce candidate assets for owner-led validation."
    ],
    "limit": "Exact-set matching verifies only this synthetic inventory. It does not evaluate real advisories, scan systems or establish exploitability.",
    "mistakes": [
      "Treating a source manifest as the full runtime inventory misses stale artifacts.",
      "Calling every scanner match exploited confuses potential applicability with incident evidence."
    ],
    "takeaways": [
      "Link findings to deployed artifacts and accountable owners.",
      "Keep evidence scope and uncertainty with the finding."
    ],
    "practice": [
      "What does a component inventory primarily describe?|Components present in its recorded scope|Proof every component is exploitable~Presence and exploitability are different claims.|Proof no hidden dependency exists~Inventory coverage can be incomplete.|Approval to scan external systems~An inventory does not grant testing authorization.|An inventory records component presence within its evidence scope.",
      "What is a transitive dependency?|An indirect dependency|Only a package installed by hand~Indirect inclusion is the defining relationship.|A network firewall rule~That is not a package dependency relationship.|An expired certificate~That is a different asset condition.|A dependency can bring additional components into the application indirectly.",
      "Why record the finding owner?|To assign accountable treatment|To make severity unnecessary~Ownership does not replace impact analysis.|To guarantee immediate exploitation~An owner does not determine attacker activity.|To remove the need for evidence~Treatment still requires accurate evidence.|An accountable owner coordinates validation, remediation and exception decisions.",
      "A manifest is patched, but production still runs the old image digest. What should triage use?|The actual deployed artifact evidence|Only the updated manifest~Intended source state does not replace an active image.|Only the pull-request title~A title does not show runtime state.|The latest package marketing version~Availability does not prove deployment.|A finding's applicability depends on what is actually deployed.",
      "The affected set is1.3,1.4,1.5; a worker runs1.7. What can the fixture establish?|The worker is not an exact-set match|The worker has no vulnerabilities at all~The model only covers this supplied advisory set.|The worker was patched today~No change history is supplied.|The worker was remotely scanned~The fixture only reads a local dictionary.|Not matching this set does not establish broad security or remediation history.",
      "A scanner cannot inspect a bundled binary dependency. What should the report retain?|The coverage limitation|An unconditional safe status~Absence of inspection is not evidence of safety.|A claim that the binary is exploited~The limitation alone is not incident evidence.|A made-up component version~Invented inventory undermines triage.|Evidence gaps should remain explicit and trigger appropriate independent validation."
    ],
    "formal": [
      "What separates a vulnerability from evidence of exploitation?|A weakness need not have been used|Every weakness proves an incident~Existence and attacker use are separate questions.|Exploitation only means a version string exists~A version match is applicability evidence.|A CVE identifier is an attack log~It is an identifier, not observed activity.|Finding an exploitable weakness does not by itself prove it was exploited.",
      "Which artifact best identifies a specific immutable deployed container build?|Its recorded image digest|The package's display name alone~A name can refer to multiple versions or builds.|A developer's preferred branch name~That does not identify the running artifact.|A generic product logo~A logo has no build identity.|A content-addressed image digest can identify the exact recorded artifact.",
      "What should accompany advisory applicability evidence?|Observed asset and version context|Only a severity adjective~A label does not identify the affected deployment.|Only a public proof-of-concept title~That does not show applicability to this asset.|Only the scanner's window size~Presentation is unrelated to evidence.|Useful findings connect the advisory to a particular observed asset and component state.",
      "The fixture records portal1.4, worker1.7 and archive1.4. Which assets match the affected set?|portal and archive|worker only~Version1.7 is not in the supplied affected set.|All three~The worker does not match.|None because versions are strings~The explicit set contains the same string labels.|Both1.4 deployments match the supplied exact affected-version set.",
      "A package is removed from source, but a legacy job still imports a bundled copy. Which inventory layer needs attention?|The deployed job artifact|Only the current source manifest~The active legacy copy exists outside that manifest's current state.|Only the application's favicon~Presentation does not describe shipped components.|Only the advisory publication date~Date alone does not locate the bundled copy.|Runtime and built-artifact evidence can reveal dependencies missed by source-only review.",
      "A scanner flags a component using filename inference, but the vendor backported a fix. What should analysts do?|Validate patch and build provenance|Mark exploited solely from the filename~Name-based inference does not prove an unpatched vulnerable build.|Suppress every future finding from that scanner~One ambiguity does not invalidate all evidence.|Ignore the vendor without inspecting the patch~The backport claim needs validation rather than dismissal.|Applicability should consider the actual build and authoritative patch evidence, not only inferred version labels.",
      "A direct dependency pins an affected transitive parser and its upgrade changes the API. Which plan fits?|Test a supported parent upgrade or documented mitigation|Edit an installed child file with no reproducible build~That can be overwritten and lacks controlled provenance.|Suppress the advisory because it is transitive~Indirect components can still expose the application.|Change only the parent package's display name~Names do not remove vulnerable code.|The dependency chain and compatibility impact need a supported, tested treatment path.",
      "A development scanner reports no findings, but production's image is six months older. Which inference is valid?|Production needs its own artifact reconciliation|The development result proves production is clean~The artifacts differ and may contain different dependencies.|The older image must be exploited~Age alone is not incident evidence.|Only network exposure matters, so versions can be ignored~Version and reachability both contribute to applicability.|A clean result is scoped to the inspected artifact and cannot be transferred blindly to another deployment.",
      "An advisory lists versions below2.0, but the fixture only uses explicit strings. What must not be claimed?|General version-range evaluation|Exact set membership was computed~That is exactly the fixture's implemented operation.|The dictionary contains three assets~That is observable from the fixture.|Candidate assets need investigation~That is an appropriate interpretation.|The local example is not a semantic-version or vendor-advisory parser.",
      "An organization must prove remediation across current services and retained emergency images. Which evidence is sufficient for this scope?|Reconciled deployment evidence|Only a patched main branch~That does not cover active or emergency artifacts.|Only a scanner screenshot from one developer laptop~Its scope does not cover the required deployment inventory.|A blanket safe label for every unknown version~Unknown versions remain unresolved evidence gaps.|The stated scope requires matching actual deployable artifacts to validated treatment, including fallback images."
    ]
  },
  {
    "id": "vuln-cve-cvss",
    "title": "Interpret identifiers, severity and contextual risk",
    "intro": "A weekly report places every CVE into one sorted list. Analysts need to distinguish the identifier, the severity model and the organization\u2019s risk decision so a high score does not hide a more urgent exposed service.",
    "sections": [
      [
        "Use the labels precisely",
        "A CVE identifier names a publicly cataloged vulnerability record; it is not a severity score, proof of active exploitation or complete inventory of all weaknesses. One issue may have vendor-specific tracking before a public identifier exists. The absence of a CVE does not establish that a custom authorization bug is harmless.",
        "CVSS communicates standardized technical severity under a specified version and metric vector. Different versions use different metrics and equations, so compare the complete versioned vector rather than treating any number as a direct probability or financial-loss estimate. A base severity score is not the same as organization-specific risk. Exposure, reachability, business impact, exploitation evidence and compensating controls shape the local decision."
      ],
      [
        "Make assumptions visible",
        "A score can help prioritize analysis, but a private isolated asset with a high base score may be less urgent than an actively exploited lower-scoring weakness in an exposed business-critical system. That comparison does not make either weakness disappear. Record why the treatment order differs and reassess when isolation, usage or threat evidence changes.",
        "The fixture ranks three fictional findings under an explicitly authored priority tuple: active exploitation evidence first, then internet exposure, then supplied severity. It does not calculate CVSS, parse a vector or claim to implement a universal risk standard. A real program must choose an approved policy, record the score source and version, and connect exceptions to accountable owners and expiry."
      ]
    ],
    "code": "findings=[{'id':'A','active':0,'exposed':0,'severity':9.8},{'id':'B','active':1,'exposed':1,'severity':7.5},{'id':'C','active':0,'exposed':1,'severity':8.0}]\nranked=sorted(findings,key=lambda f:(f['active'],f['exposed'],f['severity']),reverse=True)\nprint([f['id'] for f in ranked])",
    "expect": "['B', 'C', 'A']",
    "problem": "Rank fictional findings with a transparent local priority tuple.",
    "steps": [
      "Use supplied evidence rather than infer exploitation from a score.",
      "Sort by the explicit tuple in priority order.",
      "Explain why a higher base severity can rank later."
    ],
    "limit": "This is not the CVSS formula and not an external risk rating. The tuple is a deliberately explicit teaching policy for three synthetic findings.",
    "mistakes": [
      "Interpreting a CVSS score as an exploitation probability misstates its purpose.",
      "Treating no CVE as no vulnerability misses private, custom and newly discovered weaknesses."
    ],
    "takeaways": [
      "Preserve score version and vector provenance.",
      "Explain local treatment order with contextual evidence."
    ],
    "practice": [
      "What is a CVE identifier primarily used for?|Vulnerability reference|Measuring incident probability~An identifier is not a probability score.|Approving a penetration test~An identifier provides no authorization.|Guaranteeing a fixed patch date~Patch availability is separate.|The identifier provides a common reference to a vulnerability record.",
      "What does CVSS primarily communicate?|Versioned technical severity|A guaranteed dollar loss~Severity metrics do not directly predict financial loss.|Proof an attacker used the weakness~Scoring is not observed exploitation.|The number of affected customers automatically~Asset and customer counts require separate evidence.|CVSS expresses technical severity through a specified scoring version and vector.",
      "Why retain the CVSS version with a score?|Metric meanings and formulas differ|Every version has identical metrics~Scoring systems evolve.|The version is the affected package version~These are different version fields.|It proves the finding was patched~Scoring provenance is not remediation evidence.|A bare number loses important interpretation context.",
      "A custom cross-tenant authorization bug has no CVE. Which conclusion is justified?|It still needs risk treatment|It cannot be a vulnerability~A public identifier is not required for a harmful weakness.|It is automatically lower than every CVE~Identifier presence does not determine business impact.|It is only a cosmetic issue~Cross-tenant access can expose protected data.|Local weaknesses require analysis even without public catalog identifiers.",
      "The tuple prioritizes active evidence before exposure before severity. Why does B7.5 outrank A9.8 in the fixture?|B has active evidence|The algorithm subtracts the scores~It uses lexicographic tuple ordering.|CVSS universally requires this order~The fixture defines a local policy, not the CVSS formula.|A's score is invalid because it is high~The scenario does not invalidate that supplied score.|The first tuple component dominates the later severity component.",
      "A report calls9.8 a98 percent exploitation probability. What needs correction?|The score's interpretation|Only the report's decimal formatting~A different format does not fix the meaning.|Only the vulnerability identifier~The identifier does not turn severity into probability.|The application's hostname~Hostname does not define the scoring scale.|A severity score is not a directly stated attack probability."
    ],
    "formal": [
      "Does a CVE identifier prove active exploitation?|No; activity needs separate evidence|Yes; every CVE is an incident log~Cataloging and observed attacker behavior differ.|Only for high-numbered identifiers~Identifier numbering does not establish activity.|Only when the identifier contains a year~The year is not exploitation evidence.|A CVE names a record and does not itself show attacker use.",
      "Which field is needed to interpret a CVSS metric string accurately?|The scoring-system version|The browser viewport width~Presentation does not define scoring semantics.|The owner's job title alone~Ownership does not identify the score version.|The number of report pages~Report length is not scoring provenance.|CVSS versions define their applicable metrics and equations.",
      "What is organization-specific risk broader than?|A technical severity score alone|All business context by definition~Business context is part of risk assessment.|The need for treatment ownership~Ownership remains relevant.|Any evidence of exposure~Exposure is one important contextual input.|Local risk combines technical conditions with organizational consequences and threat evidence.",
      "Under the fixture tuple, C is exposed with severity8.0 and A is isolated with severity9.8; neither has active evidence. Which ranks first?|C under the stated policy|A because every score always dominates~Exposure precedes severity in the supplied tuple.|They must tie because both lack active evidence~Later tuple fields break the tie.|Neither can be ranked without inventing CVEs~The fixture can rank its supplied fictional records.|Equal active flags make exposure the next deciding component.",
      "A finding's score was copied without its vector or source version. What should the analyst recover?|Version and vector provenance|Only a larger decimal precision~Extra digits do not restore the missing model information.|Only a shorter report title~Titles do not define metric semantics.|Only the scanner vendor's logo~Branding is not the complete score evidence.|Version and vector context help validate and interpret the supplied score.",
      "An exposed flaw has known active exploitation, while a higher-scoring flaw is isolated. What decision is defensible?|Prioritize with documented contextual evidence|Always ignore the isolated flaw permanently~Lower urgency does not remove its weakness.|Always sort solely by the highest number~That discards relevant threat and exposure evidence.|Treat both as the same because both have identifiers~Identifiers do not capture all risk differences.|Treatment order can reflect current exposure and exploitation while retaining both findings for management.",
      "A team compares a CVSS3.x base score with a CVSS4.0 score as if all metrics were identical. What is needed?|Version-aware interpretation|Removal of every numerical score~Scores can remain useful with correct context.|Changing the package version to match CVSS~Software versions and score versions are unrelated.|Assuming identical vectors across versions~The metrics and formulas differ.|Comparison should retain the model version and understand its semantics rather than equating all fields.",
      "An internal service loses isolation during a migration. Its base score is unchanged. What should happen to local priority?|Reassess changed exposure|Keep the old priority because the score is identical~The contextual risk inputs changed.|Delete the vulnerability identifier~Identifier removal does not change the weakness.|Declare automatic exploitation~Exposure change is not itself proof of an incident.|A stable technical severity does not imply stable organizational risk when exposure changes.",
      "A compensating control blocks one attack path, but the finding record suppresses all future alerts permanently. What is missing?|Bounded control reassessment|Permanent suppression after one test~A single result does not guarantee the control assumptions remain valid.|Only lower the base severity score~Changing a reported score does not manage the control\u2019s actual lifetime or coverage.|Only alert when the vendor publishes a patch~Exposure or bypass conditions can change before a vendor release.|A mitigation can justify a documented local adjustment while still requiring review when conditions change.",
      "A triage policy ranks active evidence then exposure then severity. FindingX is active0/exposed1/severity9.9, Y is1/0/4.0 and Z is0/1/8.0. Which order follows?|Y X Z|X Z Y~That puts severity ahead of the policy's active-evidence field.|X Y Z~X cannot outrank an active finding under the stated first component.|Y Z X~X andZ tie on early fields, so9.9 outranks8.0.|Lexicographic descending order first selectsY, then sorts the two equally exposed inactive findings by severity."
    ]
  },
  {
    "id": "vuln-priority-treatment",
    "title": "Choose treatment using reachability and business impact",
    "intro": "A hospital vendor has a fixed maintenance window and several open findings. Good prioritization identifies urgent exposure, reachable vulnerable behavior and operational consequences while documenting what remains untreated.",
    "sections": [
      [
        "Link exploitability to conditions",
        "Severity describes potential technical impact, while exploitability depends on required conditions such as authentication, reachable code paths and attacker-controlled input. Exposure describes where and by whom the asset can be reached. An internal label is not proof of isolation: trusted services, compromised endpoints and misrouted networks can still access internal systems. Validate relevant conditions rather than assuming a network diagram enforces them.",
        "Business criticality changes the consequence of compromise or interruption. A patch for a critical service may need staged validation and a maintenance plan, but operational importance is not a reason for indefinite inaction. Compare remediation, removing an affected feature, restricting access and monitored temporary mitigation against the specific attack path and availability requirements."
      ],
      [
        "Make a defensible treatment record",
        "A useful decision includes the owner, action, due date, expected risk reduction, residual paths and retest evidence. Risk acceptance must come from accountable authorized decision makers; a developer hiding the warning is not acceptance. Temporary controls need an expiry or review date and an escalation path if a fix remains unavailable.",
        "The example calculates a fictional priority score using supplied weights for reachability, known active evidence and business criticality. It labels the calculation as local, not CVSS or probability. The most valuable output is the visible reasoning and remaining assumptions. In production, use the approved program policy and update the record as reachability evidence, exploitation activity or vendor fixes change."
      ]
    ],
    "code": "cases={'A':{'reachable':1,'active':0,'critical':1},'B':{'reachable':1,'active':1,'critical':0},'C':{'reachable':0,'active':0,'critical':1}}\nfor name,c in cases.items():\n score=3*c['reachable']+4*c['active']+2*c['critical']\n print(name,score)",
    "expect": "A 5\nB 7\nC 2",
    "problem": "Apply an explicitly fictional weighted triage rule.",
    "steps": [
      "Read the three supplied binary conditions.",
      "Apply the local weights3,4 and2.",
      "Keep the scoring assumption distinct from a standardized severity model."
    ],
    "limit": "This arithmetic does not estimate real incident probability or calculate CVSS. The values are synthetic policy inputs, not observed system evidence.",
    "mistakes": [
      "Calling an asset internal does not prove vulnerable paths are unreachable.",
      "Silencing a scanner warning is not an accountable residual-risk decision."
    ],
    "takeaways": [
      "Trace the actual attack path and business consequence.",
      "Time-limit compensating controls and retain untreated findings."
    ],
    "practice": [
      "What does exposure analysis ask?|Who can reach the relevant asset or path|Only how many lines of code exist~Size is not reachability.|Only the CVE's publication year~Date does not establish access paths.|Only whether the service name says internal~A label is not enforced isolation.|Exposure connects a weakness to reachable entry points and actors.",
      "What makes a temporary mitigation accountable?|Owner, scope and review deadline|A permanent hidden suppression~That removes visibility without a bounded decision.|Only a higher log volume~Logging does not document treatment authority.|Only a renamed vulnerability~Renaming does not reduce risk.|Temporary controls need explicit responsibility and reassessment.",
      "Who should authorize risk acceptance?|The authorized risk owner|Any script that can hide warnings~Suppression is not organizational authority.|The first user seeing an error~Observation does not confer risk-acceptance authority.|A public package name~A component label cannot approve risk.|Acceptance requires the organization's authorized risk decision process.",
      "A service is labeled internal but accepts requests from many partner networks. What should analysts verify?|Actual reachable attack paths|Only the label's capitalization~Text formatting does not enforce isolation.|Only the server's rack number~Location alone does not describe partner access.|No further evidence because internal means safe~The stated partner connectivity contradicts that assumption.|Exposure should be demonstrated by the actual authorized configuration and data paths.",
      "A patch risks service interruption and the flaw is actively exploited. Which plan is strongest?|Urgent staged treatment|Indefinite delay because uptime matters~That leaves the active exposure untreated.|Immediate untested changes to every node~That can create avoidable operational failure.|Hide the advisory until the next annual review~Suppression does not reduce exposure.|Both compromise risk and availability need a controlled urgent response and evidence-based interim treatment.",
      "A local score gives reachability3, activity4 and criticality2. A reachable active noncritical service scores what?|7|5~That would substitute criticality for activity.|9~Criticality is zero in this case.|4~That omits the reachability term.|Three plus four plus zero equals seven."
    ],
    "formal": [
      "Which condition is separate from vulnerability severity?|Whether the vulnerable behavior is reachable|Whether a vulnerability can have impact~Potential impact contributes to severity.|Whether a scoring model exists~That is scoring infrastructure, not the exposure condition.|Whether a score is numeric~Representation is not reachability.|A severe weakness may require conditions not present in every deployment.",
      "What does residual risk mean after a mitigation?|Risk that remains under the control's assumptions|Proof the vulnerability never existed~Mitigation does not rewrite history.|Automatic permission to ignore future evidence~Conditions can change and need review.|The number of patched files only~File count does not describe remaining exposure.|Controls can reduce a risk while leaving other paths or failure assumptions.",
      "What should close a remediation task?|Validated treatment evidence|Only changing its ticket status~A status field does not establish technical completion.|Only sending the owner an email~Communication is not retest evidence.|Only hiding the scanner entry~Suppression is not remediation.|Closure should match the treatment objective and retain appropriate verification.",
      "The fictional rule is3R+4A+2C. A case hasR0,A0,C1. What is its score?|2|9~That assumes every condition is present.|3~That is the reachability weight, butR is zero.|0~Criticality contributes two.|Only the criticality term is nonzero.",
      "An application disables its affected import feature but a scheduled worker still uses the same parser. What remains?|The worker path|Complete remediation by definition~The worker still invokes the affected component.|Only a documentation problem~The path can retain technical exposure.|Proof that the parser is harmless~The described remaining use contradicts that conclusion.|Mitigation scope must cover all relevant entry points and execution paths.",
      "A business owner accepts a thirty-day exception with network restrictions. What should happen at expiry?|Review or remediate|Renew silently forever~That defeats the bounded acceptance.|Delete evidence of the original finding~That impairs accountability.|Assume the patch installed itself~Expiry does not perform remediation.|A temporary exception needs an explicit review or completed fix at the agreed boundary.",
      "Two controls exist: a rule blocks public traffic and a job accepts partner uploads. What must reachability analysis include?|The partner-upload processing path|Only the public firewall rule~The alternate path can still reach vulnerable behavior.|Only successful browser logins~The scheduled upload path may differ.|Only the server's hostname~Naming does not show code reachability.|Blocking one entry point does not prove every path to vulnerable processing is closed.",
      "A finding has a high score but no confirmed active exploitation. The team writes actively exploited to secure budget. What is wrong?|The evidence claim is unsupported|High scores always prove activity~Severity and observed exploitation are separate.|Budget needs authorize invented facts~Resource needs do not justify false evidence.|The identifier format makes it true~Catalog identifiers are not attack telemetry.|Triage must separate supported observations from potential impact and uncertainty.",
      "A compensating rule is effective only while a proxy is mandatory, but a new direct backend route is added. What should happen?|Revalidate and treat the bypass path|Keep the old exception because the rule still exists~The route violates its dependency assumption.|Reduce the warning severity automatically~The new path can increase exposure.|Assume every route passes through the proxy~The scenario explicitly adds a direct path.|Mitigation effectiveness depends on the architecture assumptions remaining true.",
      "A critical system has an urgent reachable flaw, a patch requiring reboot and a tested restriction that removes the vulnerable feature. Which staged plan fits?|Restrict, monitor and patch|Wait indefinitely because reboot is inconvenient~That leaves long-term weakness and unmanaged risk.|Reboot all nodes without compatibility checks~That can create avoidable outage and does not prove the fix works.|Keep only an alert and mark the flaw remediated~Detection alone does not remove the reachable weakness.|A defensible plan reduces current exposure while preserving an owned, tested path to permanent remediation."
    ]
  },
  {
    "id": "vuln-sql-boundary",
    "title": "Separate SQL structure from untrusted values",
    "intro": "A support application searches a synthetic customer database. The safe design must prevent input from becoming SQL syntax and independently enforce which tenant rows the caller may read.",
    "sections": [
      [
        "Bind values rather than concatenate syntax",
        "SQL injection arises when untrusted data changes the query structure. Parameterized queries keep statement structure separate from bound data values. A username containing punctuation remains a value rather than an added condition. Data from a database or partner service can still be untrusted when it later enters a new query; prior storage does not make string concatenation safe.",
        "Parameters normally stand for values, not arbitrary table names, column names or sort keywords. When a user chooses a sort field, map the choice to fixed application-owned identifiers and reject unknown choices. Identifier quoting can protect syntax in a given API, but it does not decide which table the caller is authorized to query."
      ],
      [
        "Preserve authorization and least privilege",
        "A perfectly parameterized query can still return another tenant\u2019s data if the tenant predicate is missing or derived from an untrusted request field. Use trusted identity and policy context to scope the query, and limit the application database account to the operations it needs. Stored procedures and ORMs can also be vulnerable when they construct dynamic query text unsafely.",
        "The fixture creates a temporary in-memory SQLite database and issues a bound-value search for an unusual literal string. It then performs a tenant-scoped query. All data is synthetic, the database vanishes with the process, and there is no connection to another service. The example tests the actual parameter-binding API without demonstrating an exploit against any external target."
      ]
    ],
    "code": "import sqlite3\ndb=sqlite3.connect(':memory:')\ndb.execute('create table users(tenant text,name text)')\ndb.executemany('insert into users values(?,?)',[('north','ada'),('south','bea')])\nprint(db.execute('select count(*) from users where name=?', (\"name with ' punctuation\",)).fetchone()[0])\nprint(db.execute('select name from users where tenant=?',('north',)).fetchall())",
    "expect": "0\n[('ada',)]",
    "problem": "Use actual parameter binding and a tenant predicate in an isolated synthetic database.",
    "steps": [
      "Create two fictional tenant rows in memory.",
      "Bind a punctuation-bearing value without changing SQL structure.",
      "Apply a separate trusted tenant scope."
    ],
    "limit": "The fixture validates SQLite value binding and query output only. It does not prove a real application authorizes tenants or safely handles every dynamic identifier.",
    "mistakes": [
      "Escaping or stripping a few characters is not a complete substitute for bound values.",
      "Parameterization does not fix an omitted business-authorization predicate."
    ],
    "takeaways": [
      "Keep query syntax application-owned and bind untrusted values.",
      "Apply object and tenant permissions independently of injection prevention."
    ],
    "practice": [
      "What boundary does parameter binding protect?|SQL structure versus data values|User permission versus every tenant~Binding alone does not establish authorization.|Network encryption versus plaintext~TLS addresses transport protection.|Password entropy versus length~Password generation is a separate concern.|Bound values are not interpreted as additional SQL syntax by the binding API.",
      "Can a normal value placeholder stand for an arbitrary SQL column name?|No; use fixed mappings|Yes; all SQL syntax is a value~Identifiers and values have different grammar roles.|Only if the column name is lowercase~Case does not change placeholder semantics.|Only after base64 encoding~Encoding does not make a value placeholder an identifier.|Dynamic identifiers require an appropriate application-owned allowlist or mapping.",
      "Does using an ORM eliminate injection automatically?|No; unsafe query construction can remain|Yes; object APIs make every string safe~Raw or interpolated queries can still be unsafe.|Only when the table is small~Table size does not define the query boundary.|Only if the ORM uses long class names~Naming is unrelated.|ORM query languages and raw-query escape hatches can still cross the syntax/data boundary.",
      "The fixture binds a punctuation-bearing nonexistent username. What result is expected?|Zero matching rows|Every row because punctuation changes syntax~The input is bound as one literal value.|The table is deleted automatically~The statement is a SELECT with a bound value.|A network connection opens~The database is in memory.|A bound input matches only a row with that literal value, and none exists here.",
      "A tenant-scoped endpoint safely binds a caller-supplied tenant ID with no permission check. What remains?|Cross-tenant authorization risk|SQL injection by definition~Binding may correctly prevent injection while authorization still fails.|Only a missing index~An index does not decide who may access tenant data.|Only a password-storage concern~The flaw concerns resource scope.|Data binding does not make an untrusted tenant choice authorized.",
      "A UI permits sort=name or sort=created. Which implementation fits?|Map choices to fixed approved SQL identifiers|Concatenate any requested sort text~That allows untrusted query structure.|Bind the entire ORDER BY clause as one value~Value binding does not generate intended SQL syntax.|Remove apostrophes and accept everything else~Character stripping is not a sufficient identifier policy.|A fixed mapping limits dynamic syntax to application-owned choices."
    ],
    "formal": [
      "Which API behavior keeps a search input from changing SQL grammar?|Binding it as a parameter value|Concatenating it into the query text~That mixes untrusted content with SQL syntax.|Renaming the input variable~Names do not alter query execution semantics.|Logging it before concatenation~Logging does not make the construction safe.|Parameter binding separates literal values from the statement structure.",
      "What additional boundary can a tenant predicate enforce when based on trusted context?|The permitted resource scope|The choice of TLS cipher~A WHERE clause does not negotiate TLS.|The entropy of user passwords~Query scoping does not generate passwords.|The certificate trust path~Database predicates do not validate certificates.|A correctly authorized tenant filter limits which rows the business operation may access.",
      "Can stored procedures contain SQL injection weaknesses?|Yes; unsafe internal dynamic SQL can remain|No; all procedure text is automatically parameterized~A procedure may concatenate dynamic strings.|Only if called over HTTP~The source protocol does not determine internal query safety.|Only if no indexes exist~Indexes do not prevent syntax injection.|Safe procedure calls do not automatically make the procedure's internal query construction safe.",
      "The fixture's trusted tenant is north. Which name is returned?|ada|bea~Bea belongs to south in the fixture.|Both names~The tenant predicate excludes south.|No names~A north row exists and matches.|The bound tenant condition selects the single north row.",
      "A developer parameterizes search but concatenates a stored report title into a later query. Which issue persists?|Second-use unsafe query construction|All stored data becomes trusted~Storage does not remove untrusted provenance.|The first parameterized query must be vulnerable~Its correctness is independent of the later unsafe construction.|Only a browser-encoding issue~The described new boundary is SQL syntax.|Data can cause injection when reused unsafely later, even after being stored safely.",
      "An application uses a database superuser for read-only search. What defense is missing?|Least database privilege|Only a larger connection pool~Capacity does not constrain database authority.|Only a longer username~Naming does not reduce permissions.|Only an extra SELECT parameter~Binding does not restrict the account's overall authority.|A narrowly scoped database principal reduces the impact of application errors or compromise.",
      "A report allows only name and created sort keys, but unknown values fall back to raw request text. What should change?|Reject unknown values or use a fixed safe default|Keep the fallback because known values are mapped~The unknown path bypasses the intended syntax boundary.|Encode raw text as base64 then concatenate~Encoding is not a SQL identifier policy.|Log unknown values and still execute them~Detection does not make the query safe.|Every dynamic syntax path must remain within the fixed application-owned mapping.",
      "A bound query selects by invoice ID without tenant or object authorization. Another tenant guesses a valid ID. What is needed?|Object authorization|More quote escaping~The described risk is unauthorized access, not syntax injection.|Only a random-looking ID~Identifier obscurity does not enforce permission.|Only a database index on ID~An index accelerates the unauthorized lookup.|Parameterization prevents syntax injection but does not establish the caller's right to the selected invoice.",
      "A procedure call binds every argument, but its body concatenates the argument into EXECUTE text. What review boundary matters?|Internal dynamic SQL binding|Only the bound procedure-call arguments~The new unsafe construction occurs inside the procedure after outer binding.|Only the database account\u2019s read privilege~Least privilege can reduce impact but does not repair the inner syntax/data boundary.|Only filtering spaces from the argument~Character removal is not a substitute for binding dynamic data values.|Each syntax-construction boundary requires safe handling; binding the outer call does not protect an unsafe inner query.",
      "A support search must support user filters and two sort fields while denying cross-tenant rows. Which design fits?|Bound filter values, fixed sort mapping and trusted tenant authorization|Bound filter values with arbitrary concatenated sort text~That leaves a query-structure path unsafe.|Fixed sort mapping with caller-chosen tenant and no authorization~That leaves cross-tenant access open.|Escaped search text using a superuser and no tenant filter~That lacks the required boundaries and least privilege.|The constraints require separate protection for value binding, dynamic identifiers and resource authorization."
    ]
  },
  {
    "id": "vuln-xss-context",
    "title": "Render untrusted content with the right browser context",
    "intro": "A service displays customer comments in a support dashboard. Some comments need plain text, while approved rich text needs a controlled HTML feature set; these two requirements should not use the same rendering shortcut.",
    "sections": [
      [
        "Identify the parser receiving the value",
        "Cross-site scripting happens when untrusted data is interpreted as executable browser content. Plain text inside an HTML element should use the framework\u2019s escaping or a safe text API. HTML text, HTML attributes, URLs, CSS and JavaScript are different contexts with different interpretation rules. An HTML encoder is not a universal JavaScript or URL policy.",
        "When users intentionally author limited HTML, use a maintained sanitizer with a deliberately configured allowed feature set. Encoding all markup is appropriate for displaying literal text, but it does not preserve a rich-text feature. Sanitizing HTML is different from validating a URL scheme; a URL can be syntactically present in safe markup yet still require an allowed-scheme policy."
      ],
      [
        "Combine safe sinks with defense in depth",
        "Prefer APIs that treat input as text rather than parsing HTML, and avoid framework escape hatches unless the content has been processed through the appropriate boundary. Content Security Policy can reduce some consequences and provide defense in depth, but it is not a complete replacement for safe rendering. Stored comments are still untrusted when another user views them.",
        "The fixture uses Python\u2019s HTML escaping for text that would be inserted in an HTML text context. It demonstrates literal rendering preparation, not a browser execution test or rich HTML sanitizer. It also evaluates a small explicit URL-scheme policy. A real UI must use the correct framework API, handle canonical parsing consistently and test the actual receiving context."
      ]
    ],
    "code": "import html\nfrom urllib.parse import urlsplit\nprint(html.escape('<b>note</b>'))\ndef permitted(url):\n return urlsplit(url).scheme in {'https'}\nprint(permitted('https://example.test/help'))\nprint(permitted('javascript:synthetic'))",
    "expect": "&lt;b&gt;note&lt;/b&gt;\nTrue\nFalse",
    "problem": "Prepare literal HTML text and evaluate an explicit URL-scheme allowlist.",
    "steps": [
      "Escape markup intended to remain literal text.",
      "Parse the URL scheme separately from HTML encoding.",
      "Reject a scheme outside the example HTTPS-only policy."
    ],
    "limit": "HTML escaping is not HTML sanitization or a universal JavaScript encoder. The URL check is a narrow local policy, not a complete browser-navigation security implementation.",
    "mistakes": [
      "Using one encoder for every browser context can leave parser-specific gaps.",
      "A CSP policy does not excuse unsafe HTML insertion."
    ],
    "takeaways": [
      "Choose protection for the actual receiving context.",
      "Distinguish plain-text rendering, rich-text sanitization and URL policy."
    ],
    "practice": [
      "What is the defining XSS boundary failure?|Data becomes browser code|Every failed database query~SQL errors are a different boundary.|Every expired certificate~Certificate validity is a transport-trust issue.|Every slow page load~Performance alone does not establish XSS.|XSS crosses the data-to-executable browser interpretation boundary.",
      "Which protection fits plain text inside an HTML element?|Safe text rendering|Parsing the input as arbitrary HTML~That can interpret untrusted markup.|Only hiding the comment field~Hidden data can still enter unsafe rendering paths.|Only hashing the text~A digest does not display the requested text.|Plain-text rendering must preserve input as data rather than markup.",
      "What is needed when approved user content must retain limited HTML?|A maintained HTML sanitizer|Only a generic string length limit~Length does not constrain executable markup semantics.|Only base64 encoding and decoding before insertion~Decoding restores the untrusted markup.|Only a certificate renewal~Transport trust does not sanitize content.|A sanitizer can retain allowed markup while removing disallowed HTML behavior.",
      "The fixture escapes<b>note</b> for literal text. What output begins the result?|&lt;b&gt;|<b>~That would preserve the raw opening tag.|%3Cb%3E~That is URL-style encoding, not the HTML escape result.|A SHA-256 digest~The function performs HTML escaping, not hashing.|HTML escaping replaces the angle brackets with entities in this context.",
      "A comment is safe in HTML text but is later concatenated into an inline script. What needs review?|The new JavaScript-in-HTML context|Only whether it was stored in a database~Storage does not make it safe in every parser.|Only its original text encoder~A different receiving parser needs the appropriate protection.|Only the database index~Indexes do not affect browser parsing.|Safety is contextual; a value can require different handling when moved to a script context.",
      "A dashboard relies on CSP while inserting arbitrary comments as HTML. What remains necessary?|Safe rendering or sanitization|Only a longer CSP header name~Header naming does not remove unsafe insertion.|Only a second identical policy string~Duplication does not repair the sink.|Only a shorter comment timeout~Timing does not constrain executable markup.|CSP is defense in depth and should accompany protection at the rendering boundary."
    ],
    "formal": [
      "Why is HTML escaping not a universal browser defense?|Different parsers interpret data differently|Every browser uses only one grammar~HTML, JavaScript, URL and CSS contexts differ.|Escaping always encrypts input~Encoding is representation, not secrecy.|All framework APIs disable execution automatically~Unsafe APIs can still parse executable content.|The receiving context determines which protection is appropriate.",
      "What is a safe text sink intended to avoid?|Parsing input as HTML markup|All database access~A rendering sink does not define data storage.|All network requests by the application~The property concerns text interpretation.|The need to authenticate users~Rendering safety and authentication are separate.|A text API keeps supplied content as text in the ordinary element context.",
      "Is user content trusted merely because it was stored earlier?|No; stored content can still be untrusted|Yes; databases sanitize every browser context~Storage does not implement context-specific rendering.|Only after midnight~Time does not change provenance.|Only if its row has an index~Indexing is unrelated.|Stored XSS results when previously stored untrusted data reaches an unsafe browser sink.",
      "The fixture allows only the https URL scheme. What result follows for javascript:synthetic?|False|True because the string contains letters~Alphabetic content does not determine allowed schemes.|True after HTML escaping only~Encoding does not change the scheme policy.|A database row is deleted~The fixture only parses a URL.|The parsed scheme is not in the explicit HTTPS-only allowlist.",
      "A rich-text editor stores sanitized HTML, then a plugin appends raw user markup. Which condition fails?|The final rendered content is no longer fully sanitized|The database must have lost its index~Indexes do not affect the added markup.|Sanitization permanently protects later modifications~Untrusted postprocessing can reintroduce unsafe content.|Only the editor's color palette~Presentation is not the trust boundary.|The complete value reaching the HTML sink must satisfy the sanitizer's intended policy.",
      "An application escapes a URL as HTML but accepts any scheme in href. What extra control is needed?|An appropriate parsed URL policy|Only escaping the ampersands twice~Repeated encoding does not define permitted navigation schemes.|Only a longer anchor label~Text length does not constrain the URL.|Only using HTTPS for page delivery~The page's transport does not validate the link target.|HTML attribute encoding and URL-scheme validation address separate interpretation boundaries.",
      "A framework escapes text by default, but a developer uses its raw-HTML escape hatch. What should reviewers require?|Justified sanitization at that boundary|No review because the framework is safe by default~The escape hatch bypasses that default protection.|Only a larger component file~File size does not establish safe rendering.|Only the input's database type~A text column does not sanitize HTML.|Bypassing the safe default requires an explicit appropriate protection for the raw HTML sink.",
      "A service strips<script> tags but allows arbitrary HTML attributes. Why is the rule insufficient?|Executable behavior is not limited to one tag|Every XSS payload requires that exact tag~Browser execution paths are broader.|Attributes are always plain text~Some attributes contain code or additional parsers.|Only lowercase tags matter~Case handling alone does not establish a sanitizer policy.|A tag blacklist cannot replace a maintained context-aware sanitization strategy.",
      "A developer pre-encodes text and then assigns it to a normal element's textContent. What usability issue can result?|Literal encoded entities are displayed|The API necessarily parses the input as HTML~A normal text sink preserves text.|The browser decrypts the string~No encryption is involved.|The database transaction rolls back~Rendering does not imply database rollback.|A safe text API normally takes original text; pre-encoding can display entity notation rather than the intended characters.",
      "A support UI needs plain comments, limited rich descriptions and safe external links. Which design fits?|Text, HTML and URL controls|One HTML encoder applied to every script and URL context~Different parsers need different protections.|CSP alone with arbitrary HTML insertion~That leaves the primary unsafe rendering boundary.|A blacklist of one tag for every content type~That is not sufficient context-aware protection.|The three requirements need distinct handling matched to text, HTML and navigation semantics."
    ]
  },
  {
    "id": "vuln-web-controls",
    "title": "Close object-access and configuration gaps",
    "intro": "A tenant application hides administrative links but still exposes object endpoints. A defensive review must examine server authorization and configuration rather than equating a missing button or random identifier with access control.",
    "sections": [
      [
        "Authorize the object and operation",
        "Broken access control occurs when a principal can perform an action outside its allowed scope. Vertical failures can expose privileged operations to ordinary users; horizontal failures can expose another user\u2019s or tenant\u2019s objects. Server checks should evaluate trusted identity, requested action and the actual resource on every relevant path, including background jobs and alternate API routes.",
        "A random identifier can make enumeration harder, but it is not permission enforcement. The server must deny unauthorized object access even when the caller knows the identifier. Client-side controls improve navigation but cannot decide the security boundary because callers can send requests independently of the rendered interface."
      ],
      [
        "Treat configuration as executable policy",
        "Security misconfiguration includes unnecessary services, exposed management endpoints, unsafe defaults and overly broad credentials or permissions. A secure baseline identifies required behavior and rejects unintended exposure. Debug settings can leak sensitive errors or enable features that were never intended for production. Disabling one UI control does not remove an exposed server capability.",
        "The fixture uses a tiny in-memory object inventory and enforces tenant equality and an action allowlist with default denial for missing objects. It is a policy trace rather than a web server. Real applications need negative tests through actual routes and consistent enforcement around data reads and writes, including race-sensitive operations and trusted attribute sources."
      ]
    ],
    "code": "objects={41:{'tenant':'north'},42:{'tenant':'south'}}\ndef permitted(tenant,action,oid):\n obj=objects.get(oid)\n return bool(obj and tenant==obj['tenant'] and action in {'read'})\nprint(permitted('north','read',41))\nprint(permitted('north','read',42))\nprint(permitted('north','delete',41))\nprint(permitted('north','read',99))",
    "expect": "True\nFalse\nFalse\nFalse",
    "problem": "Trace object existence, tenant scope and operation checks.",
    "steps": [
      "Resolve the actual requested object.",
      "Require its tenant to match trusted caller context.",
      "Reject unlisted operations and absent objects."
    ],
    "limit": "This fixture does not authenticate users or implement an HTTP authorization layer. A real service must derive context from trusted evidence and enforce the policy on every relevant operation.",
    "mistakes": [
      "Hiding an admin button does not block a direct API request.",
      "Random object IDs do not replace an object-level permission decision."
    ],
    "takeaways": [
      "Deny unauthorized resource operations even with a known object ID.",
      "Review actual exposed services and defaults against a secure baseline."
    ],
    "practice": [
      "What is horizontal broken access control?|Unauthorized peer-object access|Only a database syntax error~That is a different failure class.|Only failure to render a menu~Presentation alone does not describe unauthorized access.|Only an expired certificate~Certificate validity concerns transport trust.|Horizontal failures cross resource ownership or tenant boundaries at a similar privilege level.",
      "Where must security-sensitive authorization be enforced?|At the trusted server operation boundary|Only in a hidden browser button~Callers can send requests outside the UI.|Only in a public documentation page~Documentation does not execute a denial.|Only in a random identifier generator~Unpredictability does not establish permission.|The server must decide whether the principal may perform the resource operation.",
      "What does deny by default mean for unmatched requests?|Reject unless an applicable rule permits|Allow until an explicit block appears~That is an allow-by-default model.|Allow if the object ID is long~Identifier length does not grant permission.|Accept after a client hides the error~Presentation does not determine authority.|A missing authorization rule should not silently grant access.",
      "A north user knows south object42's identifier. What does the fixture return for read?|False|True because the identifier is known~Knowledge of an ID does not satisfy tenant equality.|True because read is an allowed action~The tenant condition is independently required.|No result because it scans a server~The fixture is a local dictionary predicate.|The object exists but belongs to a different tenant, so the request is denied.",
      "A debug endpoint remains reachable in production after its menu is removed. What needs treatment?|The exposed server capability|Only the menu styling~The endpoint still exists regardless of navigation.|Only the random seed for object IDs~That does not remove the debug route.|Only a second documentation warning~Warnings do not enforce configuration.|Exposure is determined by actual reachable service behavior, not UI links.",
      "A service binds SQL values safely but lets every logged-in user export all tenants. What failure remains?|Broken resource authorization|No security failure because SQL is bound~Injection prevention does not authorize exports.|Only a certificate-chain error~No certificate issue is described.|Only a password-length issue~The operation lacks tenant authorization.|Different security boundaries require independent controls."
    ],
    "formal": [
      "What is vertical broken access control?|Lower-privileged callers performing privileged actions|Only another user's record at the same privilege~That is a horizontal boundary example.|Only a failed network ping~Reachability failure does not define privilege escalation.|Only a missing database index~Performance structures do not define access control.|Vertical failures cross intended privilege levels.",
      "What does an unguessable object identifier provide by itself?|Reduced guessing convenience|Proof of caller authorization~A known random ID can still be used without permission.|Guaranteed tenant isolation~The server must enforce scope.|A replacement for every permission check~Identifier secrecy is not an authorization model.|Opaque IDs can reduce enumeration but cannot establish permission.",
      "Which configuration deserves explicit production review?|Management/debug exposure|Only the text editor font~That does not govern runtime exposure.|Only the length of source comments~Comment length is not a deployed control.|Only the color of log charts~Visualization does not define service permissions.|Management and debug features can expose powerful or sensitive behavior.",
      "The fixture permits only read. A north user requests delete on north object41. What follows?|Deny because the action is unlisted|Allow because the tenant matches~Tenant equality is only one required condition.|Allow because the object exists~Existence does not grant every operation.|Deny because all north reads fail~The fixture permits an authorized north read.|The action allowlist independently excludes deletion.",
      "An endpoint authorizes before loading the object and trusts a tenant query parameter. What should change?|Trusted resource authorization|Only rename the parameter~Names do not make caller-controlled context trustworthy.|Only require a longer tenant string~Length does not prove authorization.|Only make the object ID random~That does not validate tenant ownership.|Authorization needs trustworthy subject and resource attributes rather than caller assertions.",
      "A UI route checks permissions, but a batch export route skips them. What test is needed?|Batch-route denial test|Only an allowed batch export test~Success for a permitted caller does not demonstrate denial for an unauthorized one.|Only the UI route\u2019s denial test~The batch entry point bypasses that route and needs its own coverage.|Only a parameterized-query test~Injection prevention does not establish resource authorization.|Each relevant entry point must enforce the intended authorization boundary.",
      "A default admin account remains active after deployment with a shared secret. Which treatment fits?|Control default privilege|Rotate the shared password only~Rotation can improve secret handling but leaves shared default privilege and attribution gaps.|Restrict only the UI menu~Direct access to the privileged server path can remain.|Record logins without restricting use~Detection alone does not reconcile the default account with the approved access baseline.|Default privileged access should be reconciled with the approved production baseline and accountability requirements.",
      "A resource changes tenant between a permission check and a write. What advanced concern appears?|Authorization consistency|Only a longer object ID~Identifier length does not prevent state races.|Only HTML escaping~The problem is authorization state consistency, not rendering.|Only certificate renewal~Transport identity does not synchronize resource changes.|Authorization and mutation need an appropriate atomic or otherwise consistent relationship when resource state can change.",
      "An absent object produces an allow result because code treats a missing tenant as a wildcard. What principle is violated?|Default denial for unresolved resources|The requirement that every request succeeds~Security does not require accepting unresolved objects.|The need for a larger index~An index does not define missing-object policy.|The use of modern TLS~TLS is independent of this authorization bug.|Unknown resource context should not silently broaden access.",
      "A SaaS API needs tenant-isolated reads and approved admin writes across UI and worker routes. Which design fits?|Consistent per-route authorization|Random IDs plus hidden write buttons~That does not enforce server permissions.|A UI-only role check and unrestricted worker credentials~The worker remains a bypass path.|SQL parameterization with caller-supplied tenant authority~Binding does not validate the caller's right to that tenant.|The requirements need complete server enforcement across entry points, actions and resource state."
    ]
  },
  {
    "id": "vuln-hardening-baseline",
    "title": "Translate a secure baseline into least functionality",
    "intro": "A reporting worker needs to read one queue and write one output directory. Its default container configuration also permits privilege escalation and mounts unrelated host paths, creating avoidable exposure beyond the business task.",
    "sections": [
      [
        "Remove unnecessary authority and functionality",
        "Hardening reduces attack surface and authority through deliberate configuration. Start with required capabilities: network listeners, filesystem paths, operating-system privileges, application features and credentials. Remove unnecessary services and default accounts, restrict management access and avoid granting broad authority merely to make an error disappear. A secure baseline should describe expected behavior and justified exceptions.",
        "Least privilege and least functionality reinforce each other. A non-root process with broad file permissions can still access sensitive data, while a minimal image running with excessive host capabilities can still expose powerful operations. Review effective configuration rather than relying on one label such as containerized or non-root. Read-only filesystems, dropped capabilities and network restrictions need compatibility testing against actual workload requirements."
      ],
      [
        "Manage drift and exceptions",
        "A baseline is useful only if it remains enforced. Infrastructure changes, emergency fixes and inherited images can introduce drift. Compare intended controls with observed runtime settings and preserve approved exception scope, owner and expiry. A blanket exception shared by every service defeats the baseline\u2019s purpose. Monitoring should distinguish an authorized bounded deviation from an unexplained change.",
        "The fixture compares a synthetic worker configuration to explicit desired values and prints the noncompliant keys. It performs no host configuration changes. The example demonstrates a transparent drift check rather than claiming a universal secure container standard. Production validation needs actual platform semantics, workload tests and a clear response when a required capability conflicts with a generic recommendation."
      ]
    ],
    "code": "desired={'run_as_root':False,'privileged':False,'readonly_root':True}\nactual={'run_as_root':False,'privileged':True,'readonly_root':False}\nprint(sorted(k for k,v in desired.items() if actual.get(k)!=v))",
    "expect": "['privileged', 'readonly_root']",
    "problem": "Detect two explicit configuration drifts in a synthetic worker.",
    "steps": [
      "State the intended values rather than infer safe defaults.",
      "Compare each observed setting to the baseline.",
      "Review mismatches before applying a compatible controlled change."
    ],
    "limit": "This compares local dictionaries only. It does not inspect Docker, change a host or prove that the listed controls alone secure a workload.",
    "mistakes": [
      "Calling a workload non-root does not prove it lacks all dangerous capabilities.",
      "Granting privileged mode to fix one file error expands authority beyond the specific need."
    ],
    "takeaways": [
      "Derive controls from required workload capabilities.",
      "Detect runtime drift and time-limit justified exceptions."
    ],
    "practice": [
      "What is the aim of least functionality?|Keep only capabilities the workload needs|Enable every optional feature for convenience~That increases unnecessary attack surface.|Replace all authorization with logging~Logging does not restrict capabilities.|Assume every default is safe~Defaults may exceed the workload's needs.|Removing unnecessary functionality reduces avoidable exposure.",
      "What is configuration drift?|Baseline deviation|Only a slow network packet~Latency is not a configuration comparison.|Only a new source-code comment~Comments need not change runtime state.|Only a renamed ticket~A ticket label is not observed configuration.|Drift is a deviation between actual and approved configuration.",
      "Does running as non-root alone prove adequate hardening?|No; effective capabilities still matter|Yes; non-root processes cannot read any files~They can access resources allowed by their permissions.|Yes; it disables every network listener~User identity does not automatically remove listeners.|Only if the process name is short~Names do not determine authority.|Privileges, mounts, permissions and exposed services must also be reviewed.",
      "The fixture has privileged=True but desired=False. What is reported?|privileged as a mismatch|No mismatch because run_as_root isFalse~One compliant setting does not cancel another deviation.|Every setting is compliant~Two desired values differ.|The host is automatically reconfigured~The fixture only compares dictionaries.|The actual privileged value differs from the explicit baseline.",
      "A worker needs one writable directory, but an operator makes the entire host filesystem writable. Which repair is more appropriate?|Scope write access to the required path|Keep the broad mount because the job succeeded~Functional success does not justify unrelated authority.|Add a second broad host mount~That expands exposure further.|Remove every audit record~That hides evidence without reducing privilege.|Least privilege should grant the specific required resource capability.",
      "A baseline exception has no owner or expiry. What should be added?|Accountable scope and review boundary|Only a larger exception number~A number does not assign responsibility.|Only a darker warning color~Presentation does not bound the exception.|Only a copied exception for all services~That broadens rather than controls the deviation.|Exceptions need ownership, justification and reassessment."
    ],
    "formal": [
      "What should a secure baseline define?|Approved expected configuration|Every possible future attack guarantee~A baseline cannot prove universal immunity.|Only a product marketing label~Labels do not specify enforceable settings.|Only the service's logo~Presentation is unrelated to runtime controls.|Explicit settings make intended security posture reviewable and testable.",
      "Which is an example of least privilege for a report worker?|Only required-path writes|Host administrator access for every task~That exceeds the stated resource need.|All-tenant database superuser rights~A report worker should not automatically receive universal authority.|Every optional operating-system capability~Unneeded capabilities expand impact.|Resource permissions should match the actual task.",
      "Why test hardening changes against the workload?|Controls can affect legitimate functionality|Security settings never affect applications~Read-only paths and removed capabilities can change behavior.|Testing replaces risk ownership~Owners still need accountable decisions.|Only cosmetic changes need testing~Operational compatibility is a substantive concern.|A control should reduce exposure while preserving defined authorized behavior.",
      "The fixture's desired readonly_root=True but actual=False. Which deviation is identified?|readonly_root|run_as_root~Both desired and actual run_as_root areFalse.|No deviation~The values explicitly differ.|The certificate hostname~The fixture has no certificate fields.|The root filesystem setting does not meet the stated baseline.",
      "A process is non-root but has a mounted credential directory readable by its account. What remains exposed?|The readable mounted credentials|Nothing because non-root means no access~Permission and mount configuration can still permit reads.|Only the process name~The name does not determine file access.|Only public certificate metadata~The directory is described as containing credentials.|Effective access depends on actual permissions and mounts, not only root status.",
      "An emergency fix enables a management port on every interface and the change is never reviewed. Which process failed?|Exception reconciliation|Only dependency versioning~No package-version issue is described.|Only HTML sanitization~The issue is management exposure.|Only checksum validation~A digest does not restrict a listening port.|Emergency deviations need bounded scope and later reconciliation with the approved baseline.",
      "A hardening script removes a needed write capability, and the team responds with privileged mode. Which approach fits least privilege?|Identify and grant the specific missing capability|Keep privileged mode permanently because it works~That grants much more authority than the diagnosed need.|Disable every security control~That abandons the baseline.|Change the service's display name~That does not alter the required capability.|The repair should be based on the actual resource or capability needed, with compatibility validation.",
      "A baseline checker reads desired values from a template but never inspects running workloads. What is missing?|Observed runtime comparison|Only reviewing the intended template~Desired configuration is only one side of a drift comparison.|Only a successful template syntax check~A valid template does not prove the running workload uses those settings.|Only a deployment job success flag~Job success alone does not establish effective runtime configuration.|Drift detection requires both intended and observed configuration.",
      "A control blocks outbound access but the worker legitimately needs one queue endpoint. Which design is strongest?|Permit only the required destination with tested behavior|Allow all outbound traffic after the first error~That discards the specific exposure restriction.|Disable the worker permanently without business review~That fails the authorized workload requirement.|Assume the queue requires every network destination~The need is narrower than unrestricted access.|Least functionality can preserve the required connection while limiting unrelated egress.",
      "A worker needs non-root execution, one writable path and one outbound queue, while its template grants privileged mode and broad host mounts. Which plan fits?|Scope and verify capabilities|Retain privileged mode with a smaller image~Image size does not remove unnecessary host authority.|Remove required networking without testing~That breaks the stated queue requirement rather than preserving authorized behavior.|Keep broad mounts with short-lived credentials~Shorter secret lifetime does not remove broad filesystem access.|The constraints call for a workload-specific baseline with limited resources and verified compatibility."
    ]
  },
  {
    "id": "vuln-patch-mitigate",
    "title": "Stage patches and validate compensating controls",
    "intro": "A vendor releases a parser fix that requires a runtime upgrade. The team needs a reproducible patch plan and a bounded compensating control while compatibility work proceeds.",
    "sections": [
      [
        "Distinguish remediation from mitigation",
        "Remediation removes or corrects the underlying weakness, such as upgrading an affected component to a verified fixed build or removing the vulnerable feature completely. A compensating control reduces a relevant attack path while the weakness remains. A filtering rule can help only within its actual coverage and assumptions; it must not be described as patching the component.",
        "A patch rollout should identify affected artifacts, supported upgrade versions, compatibility tests, negative security checks, staged deployment and rollback strategy. A rollback can restore availability but also restore the vulnerable version. Plan the security consequences of fallback instead of treating any rollback as automatically safe. Keep the deployed artifact identity and treatment evidence connected."
      ],
      [
        "Evaluate interim controls against the path",
        "A temporary restriction might disable an affected feature, require a trusted upstream path or reduce network exposure. Verify that every relevant entry point is covered and that bypass routes do not invalidate the assumption. A monitor is useful but ordinarily does not prevent the vulnerable behavior. Exceptions should have accountable approval, expiry and an escalation path when the vendor fix is delayed.",
        "The fixture models three rollout batches with patched counts and computes remaining unpatched assets. It also tests whether a deliberately supplied coverage list covers every known entry point. These are local arithmetic and set checks, not a deployment engine or proof of exploit blocking. Real evidence requires authorized testing of the actual controls and a recovery plan that preserves relevant restrictions."
      ]
    ],
    "code": "total=12\npatched=sum([3,4,2])\nprint('remaining',total-patched)\npaths={'web','batch','partner'}\ncovered={'web','partner'}\nprint('all_paths',paths<=covered)\nprint('missing',sorted(paths-covered))",
    "expect": "remaining 3\nall_paths False\nmissing ['batch']",
    "problem": "Calculate staged patch remainder and an uncovered entry point.",
    "steps": [
      "Sum the explicitly completed patch batches.",
      "Subtract from the known inventory.",
      "Compare mitigation coverage against every known path."
    ],
    "limit": "The counts and path labels are synthetic supplied evidence. The code neither deploys patches nor tests whether a real exploit is blocked.",
    "mistakes": [
      "Marking an installed filtering rule as a patched library misreports the control.",
      "Rolling back without restoring required restrictions can reintroduce known exposure."
    ],
    "takeaways": [
      "Keep patch and interim-control evidence distinct.",
      "Verify all paths and plan the security state of rollback."
    ],
    "practice": [
      "What is a compensating control?|Interim exposure reduction|Proof the component source was fixed~A mitigation may leave the component unchanged.|A permanent substitute for all review~Controls need reassessment.|A scanner entry hidden from every report~Suppression alone does not reduce the attack path.|Compensating controls address risk under explicit assumptions without necessarily removing the underlying flaw.",
      "What can rollback reintroduce?|Prior vulnerable state|Only a different file timestamp~The operational artifact and exposure can change.|Automatic proof of remediation~Rollback can undo a fix.|A guarantee of reduced attack surface~Fallback may restore broader exposure.|Recovery planning must consider the security state of the fallback artifact.",
      "What does a negative security test verify?|Prohibited behavior is denied|Only that an administrator can log in~That is a positive path and may miss the intended denial.|Only that the patch file exists~Presence is not behavior.|Every possible attack in the world~A test has a defined scope.|A negative test checks the specific denial or boundary required by the treatment.",
      "Twelve assets have completed patch batches3,4 and2. How many remain?|3|9~Nine have been patched, not left unpatched.|2~That is the last batch size.|0~The completed batches do not cover all twelve.|Twelve minus the sum nine leaves three assets.",
      "A proxy mitigation covers web and partner paths, but batch still invokes the parser. What is missing?|Batch-path treatment|Only the proxy's report title~The uncovered path is an execution route.|Only a fourth rule name~A name does not establish actual coverage.|Nothing because most paths are covered~One remaining relevant path can preserve exposure.|Coverage must include every relevant entry point or document residual risk.",
      "A patch is incompatible with the current runtime. Which response fits?|Test a supported upgrade with bounded interim controls|Suppress the finding indefinitely~That leaves unmanaged exposure.|Force an untested production upgrade everywhere~That risks avoidable operational failure.|Claim a firewall rule changed the library version~That misstates mitigation as component remediation.|Compatibility work and current exposure reduction should proceed with explicit ownership and validation."
    ],
    "formal": [
      "What distinguishes remediation from an interim mitigation?|Fix versus mitigation|Only the number of ticket comments~Comment count does not define control effect.|Only whether a vendor logo appears~Branding is unrelated.|Only whether the control is expensive~Cost does not determine whether the flaw remains.|The distinction depends on what the treatment actually changes.",
      "Why keep deployed artifact identities in a patch record?|Link to actual deployment|To replace security tests entirely~Identity evidence does not establish all behavior.|To hide the old version history~History helps diagnose fallback and scope.|To make every rollback safe~Fallback security still needs planning.|Artifact identity links patch claims to actual deployed builds.",
      "What makes an interim exception bounded?|A defined owner, scope and expiry|A permanent unowned suppression~That removes accountability and review.|Only a low-severity label~A label does not set a time bound.|Only a copied firewall screenshot~A screenshot alone does not define lifecycle.|Temporary risk handling needs an accountable review boundary.",
      "The coverage set is web and partner, while known paths also include batch. Which set difference is reported?|batch|web~Web is already covered.|partner~Partner is already covered.|No missing path~Batch is outside the coverage set.|Known paths minus covered paths yields the batch route.",
      "An edge rule blocks one upload endpoint, but a direct backend endpoint accepts the same file type. What must be verified?|Direct-path restriction|Only a successful edge-rule test~That does not cover the alternate path.|Only the edge certificate expiry~Transport identity does not block parser input.|Only the count of rejected edge requests~Those counts do not prove all paths are covered.|A compensating control must cover relevant bypass routes to support its claimed scope.",
      "A staged patch passes functional tests but the original unauthorized operation still succeeds. What is the status?|Security objective failed|Complete because normal behavior works~Positive functionality does not prove the security boundary.|Complete if the vendor version string is newer~Version appearance does not override failed behavior evidence.|Only a documentation defect~The negative security check is a substantive failure.|Remediation evidence should validate the actual security objective as well as compatibility.",
      "A rollback image contains the vulnerable parser and no temporary restriction. Which rollback plan is defensible?|Validate a restricted fallback|Ignore the image because rollback is unlikely~An unplanned fallback can restore known exposure during stress.|Use the image and mark it patched~That misreports its security state.|Delete all incident logs before rollback~That removes evidence without reducing exposure.|Availability recovery should not silently discard the mitigation required for the vulnerable fallback.",
      "A vendor patch is available but requires an API change. Which evidence supports adoption?|Tested reproducible build|Only the patch announcement~Announcement does not show the application integrates the fix.|Only changing the lockfile text manually~A text edit may not produce a valid resolved artifact.|Only running the old image's tests~The new build itself needs validation.|Adoption needs a build that actually incorporates the supported fix and passes relevant behavior checks.",
      "A monitoring alert detects use of the vulnerable feature but does not block it. What claim is justified?|Detection coverage, not prevention|The underlying library is patched~No component change is described.|Every exploit is stopped~The alert does not enforce a denial.|No residual risk remains~Detection can leave the harmful action possible.|Monitoring can support response, but its effect differs from preventing or removing the vulnerable behavior.",
      "A fix requires two weeks, a proxy restriction covers public uploads and an internal batch path remains active. Which plan meets the stated risk gap?|Bound and treat remaining paths|Mark fully remediated because public traffic is blocked~The batch path preserves relevant exposure.|Wait with only the version number changed in the report~Reporting changes do not reduce risk.|Deploy an untested runtime upgrade to every asset immediately~That ignores compatibility and staged recovery requirements.|A credible interim plan accounts for every relevant path, preserves residual-risk visibility and continues toward verified permanent remediation."
    ]
  },
  {
    "id": "vuln-retest-closure",
    "title": "Retest treatment and preserve negative evidence",
    "intro": "A patch dashboard shows all tickets closed, but one old worker and a fallback image remain vulnerable. Closure should be a claim about demonstrated treatment scope rather than a change in workflow status.",
    "sections": [
      [
        "Verify the intended result",
        "Retesting compares the treated system against the original condition and the defined security objective. Validate deployed versions or configurations, confirm the prohibited behavior is rejected in an isolated authorized test, and run required positive workflows so the treatment does not merely shut down legitimate service. A scanner can provide useful evidence, but its detection coverage and data freshness still limit the claim.",
        "Separate false-positive resolution from remediation. If the finding never applied because a vendor backport already fixed the behavior, record that evidence and artifact provenance. If the weakness applied and was changed, record the change and retest. A generic suppressed status hides these different reasons and makes later revalidation harder when the deployment changes."
      ],
      [
        "Close only the evidenced scope",
        "A treatment record should include inventory coverage, test time, result, residual exceptions and an accountable reviewer. A fresh build may be fixed while a retained rollback image is not. Depending on policy, update or retire that fallback, restrict it or preserve a bounded exception; do not mark it fixed simply because the main deployment changed.",
        "The fixture checks a local set of required assets against supplied passing retests and separately reports an exception. It also requires both negative security and positive functional outcomes before treating an individual test result as complete. This is a closure model, not a scanner or compliance certification. Human review remains necessary for the curriculum and the real organization\u2019s treatment decision."
      ]
    ],
    "code": "required={'web','worker','rollback'}\npassed={'web','worker'}\nprint('unverified',sorted(required-passed))\ndef acceptable(negative_pass,positive_pass):\n return negative_pass and positive_pass\nprint(acceptable(True,False))\nprint(acceptable(True,True))",
    "expect": "unverified ['rollback']\nFalse\nTrue",
    "problem": "Calculate unverified treatment scope and require both security and functionality checks.",
    "steps": [
      "List every asset in the defined closure scope.",
      "Subtract the assets with supplied passing evidence.",
      "Require both negative and positive test outcomes."
    ],
    "limit": "The fixture uses synthetic status sets and booleans. It cannot prove a deployed patch, scanner coverage, human approval or production security.",
    "mistakes": [
      "Closing the ticket does not change a running artifact.",
      "A negative test that breaks every legitimate request does not demonstrate acceptable treatment."
    ],
    "takeaways": [
      "Connect closure to current deployment and scoped retest evidence.",
      "Record residual exceptions and fallback artifacts explicitly."
    ],
    "practice": [
      "What does a remediation retest compare?|Behavior versus objective|Only the ticket's color~Workflow presentation does not establish behavior.|Only the number of assigned developers~Staffing count is not completion evidence.|Only the advisory's page length~Reference length does not validate treatment.|Retesting checks whether the intended technical change succeeded in scope.",
      "Why retain positive functional checks alongside negative security tests?|Legitimate workflows must still work|A service outage proves every security goal~Blanket denial can damage availability.|Positive checks replace all negative checks~Both purposes are distinct.|Only to increase test count~The checks provide different evidence.|Treatment should reject prohibited behavior while preserving defined authorized use.",
      "What should a false-positive resolution record?|Evidence the finding does not apply to the asset|A claim that every vulnerability was fixed~Nonapplicability differs from patching an applicable weakness.|Only a hidden scanner warning~Suppression alone loses the reasoning.|Only the owner's preferred status label~A label is not technical evidence.|False-positive closure needs applicability evidence and provenance.",
      "Required assets are web,worker,rollback; passing evidence covers web,worker. What remains?|rollback unverified|Nothing because most assets passed~The required set still includes one uncovered asset.|web unverified~Web is explicitly in the passing set.|All assets exploited~Lack of retest evidence does not establish exploitation.|The set difference identifies the fallback artifact lacking supplied passing evidence.",
      "A negative test passes only because the service rejects every request. What else must be checked?|Positive authorized behavior|Only the HTTP status font~Presentation does not show useful functionality.|Only whether the patch file has a name~File naming does not establish service behavior.|No further checks because denial always means secure~Availability and valid use remain requirements.|Blanket failure can reject the attack while also breaking the application.",
      "A scanner report predates the latest deployment. What should closure evaluate?|Fresh artifact evidence|Only the old report's safe label~The result is scoped to its earlier inspected state.|Only the latest commit title~A title does not identify all deployed components.|Only the number of report pages~Length does not restore freshness.|Evidence must match the artifact and state being claimed as treated."
    ],
    "formal": [
      "Which claim is distinct from remediation?|Nonapplicability|The affected component was replaced~That can be remediation.|The vulnerable feature was removed~That can remove the weakness.|The unsafe policy was corrected~That can be a treatment change.|Nonapplicability is a different closure reason and needs its own evidence.",
      "What should a closure record make explicit?|Scope, time and exceptions|Only a general done label~That hides which assets and conditions were verified.|Only the owner's initials~Attribution alone does not show technical results.|Only a severity number~Severity is not completion evidence.|Reviewers need the boundaries and freshness of the treatment claim.",
      "Does a clean scanner result prove every possible weakness is absent?|No; detection coverage is limited|Yes; every scanner has perfect knowledge~Tools have scope and detection limitations.|Only if the report is a PDF~Format does not establish completeness.|Only if no CVE IDs are printed~Absence of listed IDs is not universal evidence.|A scanner result should be interpreted within its inspected scope and supported detections.",
      "The fixture requires negative_pass and positive_pass. What is the result forTrue,False?|False|True because one pass is enough~The stated operator is logical AND.|True because security cancels functionality~The model explicitly requires both outcomes.|An automatic patch deployment~The function only returns a boolean.|Both conditions must be true for acceptable treatment in this model.",
      "A patched web service passes, but its old worker image remains active. What should the record say?|Partial treatment with the worker unresolved|Fully remediated because the website works~The defined inventory includes an untreated active component.|False positive for every asset~One fixed component does not invalidate the original finding elsewhere.|No need to retain artifact identity~Identity is essential to distinguish treated and old builds.|Closure should reflect the actual treated subset and remaining scope.",
      "A report suppresses a finding because a backport fixed it, but records no vendor patch provenance. What evidence is missing?|Backport provenance|Only the upstream version range~A backport can change applicability without changing the inferred upstream version.|Only a scanner suppression rule~The rule records a reporting action, not trustworthy patch evidence.|Only the component\u2019s package name~A name does not establish that the deployed build contains the fix.|A backport-based resolution needs trustworthy build and fix evidence.",
      "A fallback image is deliberately retained with a vulnerable component under a thirty-day restriction. How should it appear?|As an explicit bounded exception|As fully patched because it is not active today~Retained fallback use can restore exposure.|As nonexistent because the main image is fixed~The fallback is part of the stated scope.|As permanently safe after one ticket closes~Conditions and time bounds still matter.|The remaining dependency and its restriction should stay visible for accountable review.",
      "A security test reproduces the original bug against a public third-party host without permission. Which boundary should the curriculum enforce?|Use authorized isolated fixtures instead|Public availability grants testing authority~Reachability is not permission.|A CVE number grants permission~An identifier is not authorization.|A small test needs no scope~Test size does not replace consent.|Defensive validation must remain within authorized assets and isolated synthetic examples.",
      "A finding is closed using a test of the right version on a different configuration that disables the feature. What should be checked?|Deployment representativeness|Only the matching version string~Different configuration can change reachability and invalidate test equivalence.|Only the successful test result in isolation~A pass under disabled-feature conditions may not cover the deployed active feature.|Only the test environment\u2019s isolation~Isolation makes testing safer but does not establish representative application conditions.|Retest evidence must match the relevant artifact, configuration and execution path in scope.",
      "A program requires all three assets verified, negative security checks and positive workflows; web and worker pass, rollback is untested and one valid workflow fails. What is the correct status?|Incomplete treatment|Complete because two assets passed~The program requires all three and functional success.|Complete because negative security checks passed~The positive failure and untested fallback remain.|False positive because tests are inconvenient~Test inconvenience is not nonapplicability evidence.|The stated completion criteria are conjunctive, so both uncovered assets and failed authorized workflows must be resolved or explicitly handled under approved exceptions."
    ]
  }
],["cheatsheets/Vulnerable_Dependency_Management_Cheat_Sheet.md", "cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.md", "cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.md", "cheatsheets/Authorization_Cheat_Sheet.md", "cheatsheets/Docker_Security_Cheat_Sheet.md"]);
