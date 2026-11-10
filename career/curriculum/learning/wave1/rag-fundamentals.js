'use strict';
const {course}=require('./ai-helper');
module.exports=course('rag-fundamentals',[
  {
    "slug": "ingestion-contract",
    "comp": "m1.c1",
    "title": "Build an ingestion contract from source to evidence",
    "before": "Complete Vector Databases and Retrieval and Prompting and Structured Output. Apply trusted access scope and the compatible embedding contract.",
    "intro": "A university wants answers grounded in its private handbook. Before a question can be answered, the system needs a controlled path from a source revision to retrievable, attributable excerpts. A vector alone cannot explain where a policy came from or whether a student may read it.",
    "sections": [
      {
        "heading": "Separate preparation from request processing",
        "paragraphs": [
          "Ingestion collects permitted source documents, extracts readable content, splits it into useful chunks, computes compatible representations and stores records with metadata. Retrieval takes a question and a trusted user scope to find eligible evidence. Generation receives selected evidence and produces an answer under an explicit evidence policy. These are related stages with distinct failure modes.",
          "Preserve a stable source id, source revision, chunk id, access metadata and location such as page or heading. Extraction quality matters: a scanned table with missing columns can become misleading evidence even if embedding and search run correctly. Review representative output before treating a completed ingestion job as a quality signal."
        ]
      },
      {
        "heading": "Make the handoff inspectable",
        "paragraphs": [
          "Define the record contract and validate required fields before records become eligible for retrieval. Source text and provenance should describe the same revision. Keep a rejected-record path for malformed extraction rather than silently publishing incomplete metadata. A source mapping makes later correction and removal possible.",
          "The example creates two synthetic chunks with a deterministic source/version identity and rejects an empty excerpt. Its tuple is a teaching record, not a universal schema. In a real pipeline, stable identifiers, validated scope and durable job state need their own implementation and tests."
        ]
      }
    ],
    "problem": "Construct attributable synthetic chunks and reject empty extraction.",
    "code": "source = {\"id\": \"handbook\", \"version\": 3, \"tenant\": \"campus\"}\ntexts = [\"Appeals close on Monday.\", \"\", \"Submit appeals through the portal.\"]\nrecords = [{\"key\": (source[\"id\"], source[\"version\"], i), \"text\": t, \"tenant\": source[\"tenant\"]} for i, t in enumerate(texts) if t.strip()]\nprint([r[\"key\"] for r in records])\nprint(len(records))",
    "expect": "[('handbook', 3, 0), ('handbook', 3, 2)]\n2",
    "steps": [
      "Declare one source revision and scope.",
      "Derive identifiable nonempty synthetic excerpts.",
      "Inspect the chunk identities and accepted count."
    ],
    "limit": "This in-memory construction performs no extraction, embeddings, native database writes or permission verification. Nonempty text can still be incorrect; real extraction and source access require independent validation.",
    "mistakes": [
      "Losing source revision and page information while indexing.",
      "Equating a completed job with trustworthy extracted content."
    ],
    "takeaways": [
      "Track provenance throughout ingestion.",
      "Validate extraction before accepting searchable evidence."
    ],
    "refs": [
      "rag-search"
    ],
    "questions": [
      [
        "Which stage normally prepares document chunks before user questions arrive?",
        "Ingestion",
        "Answer rendering",
        "Citation clicking",
        "Query generation only",
        "Ingestion prepares the derived evidence that request-time retrieval can search.",
        "Answer rendering would not establish the required behavior. Ingestion prepares the derived evidence that request-time retrieval can search.",
        "Citation clicking would not establish the required behavior. Ingestion prepares the derived evidence that request-time retrieval can search.",
        "Query generation only would not establish the required behavior. Ingestion prepares the derived evidence that request-time retrieval can search."
      ],
      [
        "What ties an excerpt to the document state it represents?",
        "Source revision",
        "Answer color",
        "Response temperature",
        "User nickname",
        "A source revision makes the relationship between extracted evidence and source state explicit.",
        "Answer color would not establish the required behavior. A source revision makes the relationship between extracted evidence and source state explicit.",
        "Response temperature would not establish the required behavior. A source revision makes the relationship between extracted evidence and source state explicit.",
        "User nickname would not establish the required behavior. A source revision makes the relationship between extracted evidence and source state explicit."
      ],
      [
        "Why inspect extracted tables before indexing?",
        "Columns can be lost",
        "Every table is private",
        "Embeddings require prose only",
        "Tables always need one chunk",
        "Extraction errors can remove relationships and lead to misleading retrieval evidence.",
        "Every table is private would not establish the required behavior. Extraction errors can remove relationships and lead to misleading retrieval evidence.",
        "Embeddings require prose only would not establish the required behavior. Extraction errors can remove relationships and lead to misleading retrieval evidence.",
        "Tables always need one chunk would not establish the required behavior. Extraction errors can remove relationships and lead to misleading retrieval evidence."
      ],
      [
        "A source record lacks its access label. What should ingestion do?",
        "Reject or quarantine it",
        "Assign it to everyone",
        "Infer access from title",
        "Ask the model to grant access",
        "Missing authorization metadata needs explicit safe handling before eligibility.",
        "Assign it to everyone would not establish the required behavior. Missing authorization metadata needs explicit safe handling before eligibility.",
        "Infer access from title would not establish the required behavior. Missing authorization metadata needs explicit safe handling before eligibility.",
        "Ask the model to grant access would not establish the required behavior. Missing authorization metadata needs explicit safe handling before eligibility."
      ],
      [
        "A source file has four chunks but only three are indexed. Which check reveals this?",
        "Source coverage checks",
        "Only final answer fluency",
        "Only prompt length",
        "Only cache hit rate",
        "Coverage checks compare the expected derived population with accepted records.",
        "Only final answer fluency would not establish the required behavior. Coverage checks compare the expected derived population with accepted records.",
        "Only prompt length would not establish the required behavior. Coverage checks compare the expected derived population with accepted records.",
        "Only cache hit rate would not establish the required behavior. Coverage checks compare the expected derived population with accepted records."
      ],
      [
        "An excerpt has a page id from revision 1 and text from revision 2. What is wrong?",
        "Provenance is inconsistent",
        "Similarity must be zero",
        "The user lost all roles",
        "The tokenizer is invalid",
        "Attribution must identify the actual text revision used as evidence.",
        "Similarity must be zero would not establish the required behavior. Attribution must identify the actual text revision used as evidence.",
        "The user lost all roles would not establish the required behavior. Attribution must identify the actual text revision used as evidence.",
        "The tokenizer is invalid would not establish the required behavior. Attribution must identify the actual text revision used as evidence."
      ],
      [
        "A pipeline reruns the same source version. What helps avoid duplicate chunks?",
        "Stable versioned identities",
        "A new random id each retry",
        "Removing all source metadata",
        "Doubling the overlap",
        "Stable identities support idempotent derived writes rather than uncontrolled duplication.",
        "A new random id each retry would not establish the required behavior. Stable identities support idempotent derived writes rather than uncontrolled duplication.",
        "Removing all source metadata would not establish the required behavior. Stable identities support idempotent derived writes rather than uncontrolled duplication.",
        "Doubling the overlap would not establish the required behavior. Stable identities support idempotent derived writes rather than uncontrolled duplication."
      ],
      [
        "A local dictionary fixture runs correctly. What has it established?",
        "Its record-building logic",
        "Native vector-store durability",
        "Provider embedding accuracy",
        "A complete extraction benchmark",
        "The fixture illustrates one handoff contract without exercising a real ingestion service.",
        "Native vector-store durability would not establish the required behavior. The fixture illustrates one handoff contract without exercising a real ingestion service.",
        "Provider embedding accuracy would not establish the required behavior. The fixture illustrates one handoff contract without exercising a real ingestion service.",
        "A complete extraction benchmark would not establish the required behavior. The fixture illustrates one handoff contract without exercising a real ingestion service."
      ]
    ]
  },
  {
    "slug": "retrieval-handoff",
    "comp": "m1.c1",
    "title": "Retrieve permitted evidence and preserve its identity",
    "before": "Complete Vector Databases and Retrieval and Prompting and Structured Output. Apply trusted access scope and the compatible embedding contract.",
    "intro": "A help desk asks for the applicable cancellation period. The relevant excerpt must survive retrieval and context selection before a generator can use it. A plausible answer cannot repair a missing or unauthorized source.",
    "sections": [
      {
        "heading": "Retrieve under a trusted scope",
        "paragraphs": [
          "Encode the question using the representation contract of the serving index, apply authorized metadata scope and rank eligible candidates. Exact or approximate vector search can be combined with other retrieval methods, but all serving paths must enforce access. A score expresses a relationship under the retrieval method; it is not the probability that a policy is applicable.",
          "Keep source identifiers with returned text through deduplication, ranking and packing. Relevance also depends on domain, jurisdiction, date and question intent. A high-scoring obsolete policy is still unsuitable evidence for a current answer."
        ]
      },
      {
        "heading": "Inspect stage outputs before asking a model",
        "paragraphs": [
          "Record a privacy-conscious trace containing query version, serving index generation, eligible candidate ids, selected evidence ids and relevant status codes. These identifiers make stage-specific investigation possible without placing every private excerpt in unrestricted logs.",
          "The fixture applies scope before a simple lexical overlap ranking. It deliberately uses word sets rather than embeddings so the permission and identity handoff can be observed offline. This is not a semantic search implementation or a benchmark of vector recall."
        ]
      }
    ],
    "problem": "Rank only eligible synthetic records and retain source ids.",
    "code": "rows = [{\"id\": \"a\", \"tenant\": \"one\", \"text\": \"cancel within seven days\"}, {\"id\": \"b\", \"tenant\": \"two\", \"text\": \"cancel within thirty days\"}, {\"id\": \"c\", \"tenant\": \"one\", \"text\": \"contact billing\"}]\nquery = set(\"cancel days\".split())\nallowed = [r for r in rows if r[\"tenant\"] == \"one\"]\nranked = sorted(allowed, key=lambda r: (-len(query & set(r[\"text\"].split())), r[\"id\"]))\nprint([r[\"id\"] for r in ranked])\nprint(all(r[\"tenant\"] == \"one\" for r in ranked))",
    "expect": "['a', 'c']\nTrue",
    "steps": [
      "Select the synthetic trusted tenant.",
      "Rank only its eligible records by word overlap.",
      "Inspect stable ids and the local scope invariant."
    ],
    "limit": "Word overlap is an explanatory stand-in, not embeddings or an authorization service. The literal tenant value is trusted only inside this fixture; real scope must come from authenticated policy.",
    "mistakes": [
      "Treating a similarity score as proof of applicability.",
      "Dropping source ids before assembling context."
    ],
    "takeaways": [
      "Preserve permission and provenance through retrieval.",
      "Inspect what actually reaches generation."
    ],
    "refs": [
      "rag-search"
    ],
    "questions": [
      [
        "What must the query representation match?",
        "The serving index contract",
        "The answer font",
        "The longest source title",
        "The user's profile image",
        "Compatible query and document representations are necessary for meaningful vector comparisons.",
        "The answer font would not establish the required behavior. Compatible query and document representations are necessary for meaningful vector comparisons.",
        "The longest source title would not establish the required behavior. Compatible query and document representations are necessary for meaningful vector comparisons.",
        "The user's profile image would not establish the required behavior. Compatible query and document representations are necessary for meaningful vector comparisons."
      ],
      [
        "What does a high similarity score establish by itself?",
        "Metric proximity",
        "Current policy authority",
        "Permission to disclose",
        "Claim entailment",
        "A score describes the retrieval method's relationship, not authorization or factual support.",
        "Current policy authority would not establish the required behavior. A score describes the retrieval method's relationship, not authorization or factual support.",
        "Permission to disclose would not establish the required behavior. A score describes the retrieval method's relationship, not authorization or factual support.",
        "Claim entailment would not establish the required behavior. A score describes the retrieval method's relationship, not authorization or factual support."
      ],
      [
        "Why retain candidate ids through context selection?",
        "Trace evidence handoff",
        "Grant permanent access",
        "Avoid every model error",
        "Increase source freshness",
        "Stable ids connect retrieval output to the evidence actually passed to generation.",
        "Grant permanent access would not establish the required behavior. Stable ids connect retrieval output to the evidence actually passed to generation.",
        "Avoid every model error would not establish the required behavior. Stable ids connect retrieval output to the evidence actually passed to generation.",
        "Increase source freshness would not establish the required behavior. Stable ids connect retrieval output to the evidence actually passed to generation."
      ],
      [
        "A query returns another tenant's policy. Which layer requires correction?",
        "Application access enforcement",
        "Only answer grammar",
        "Only generation temperature",
        "Only citation styling",
        "Unauthorized evidence must be excluded before disclosure, including context sent to a model.",
        "Only answer grammar would not establish the required behavior. Unauthorized evidence must be excluded before disclosure, including context sent to a model.",
        "Only generation temperature would not establish the required behavior. Unauthorized evidence must be excluded before disclosure, including context sent to a model.",
        "Only citation styling would not establish the required behavior. Unauthorized evidence must be excluded before disclosure, including context sent to a model."
      ],
      [
        "A current-policy question retrieves an expired policy. What is missing?",
        "Applicability checking",
        "Only a longer answer",
        "Only a larger top-k label",
        "Only a new user agent",
        "Relevance includes effective date and scope, not merely semantic similarity.",
        "Only a longer answer would not establish the required behavior. Relevance includes effective date and scope, not merely semantic similarity.",
        "Only a larger top-k label would not establish the required behavior. Relevance includes effective date and scope, not merely semantic similarity.",
        "Only a new user agent would not establish the required behavior. Relevance includes effective date and scope, not merely semantic similarity."
      ],
      [
        "A selected excerpt disappears during packing. Which trace comparison helps?",
        "Retrieved versus packed ids",
        "Only source filename length",
        "Only completion token count",
        "Only answer punctuation",
        "Comparing stage ids reveals whether useful evidence was lost before generation.",
        "Only source filename length would not establish the required behavior. Comparing stage ids reveals whether useful evidence was lost before generation.",
        "Only completion token count would not establish the required behavior. Comparing stage ids reveals whether useful evidence was lost before generation.",
        "Only answer punctuation would not establish the required behavior. Comparing stage ids reveals whether useful evidence was lost before generation."
      ],
      [
        "A local overlap search succeeds. What remains untested?",
        "Semantic retrieval quality",
        "Its printed record ids",
        "Its literal tenant filter",
        "Its set intersections",
        "Word overlap does not implement embeddings or validate actual semantic retrieval quality.",
        "Its printed record ids would not establish the required behavior. Word overlap does not implement embeddings or validate actual semantic retrieval quality.",
        "Its literal tenant filter would not establish the required behavior. Word overlap does not implement embeddings or validate actual semantic retrieval quality.",
        "Its set intersections would not establish the required behavior. Word overlap does not implement embeddings or validate actual semantic retrieval quality."
      ],
      [
        "A team logs all private evidence to debug ranking. Which improvement is appropriate?",
        "Minimize and protect traces",
        "Make debug logs public",
        "Remove tenant filtering",
        "Keep only generated confidence",
        "Debugging should preserve sufficient evidence while respecting access and data minimization.",
        "Make debug logs public would not establish the required behavior. Debugging should preserve sufficient evidence while respecting access and data minimization.",
        "Remove tenant filtering would not establish the required behavior. Debugging should preserve sufficient evidence while respecting access and data minimization.",
        "Keep only generated confidence would not establish the required behavior. Debugging should preserve sufficient evidence while respecting access and data minimization."
      ]
    ]
  },
  {
    "slug": "context-citations",
    "comp": "m1.c2",
    "title": "Pack evidence and request supported claims with citations",
    "before": "Complete Vector Databases and Retrieval and Prompting and Structured Output. Apply trusted access scope and the compatible embedding contract.",
    "intro": "A product assistant retrieves the correct warranty paragraph but cites an unrelated page. The answer appears professional while its attribution is invalid. Prompt design and application checks must connect each claim to the supplied evidence.",
    "sections": [
      {
        "heading": "Give the model an evidence contract",
        "paragraphs": [
          "Separate trusted instructions from untrusted retrieved content. Ask for answers supported by the supplied context, cite stable evidence ids for factual claims and report when evidence is insufficient. Define how to handle conflicts and partial answers. Retrieved text may contain imperative language; that language remains source data and cannot grant tool access or replace system policy.",
          "Pack relevant evidence within the actual input budget, reserving space for instructions, question, metadata and output. Use the target tokenizer and current model limits in production. Keep source labels and useful surrounding qualifiers together; truncating a negation or effective date can invert meaning."
        ]
      },
      {
        "heading": "Validate citations without overclaiming",
        "paragraphs": [
          "Check that cited ids belong to the permitted evidence actually supplied, resolve to the intended source revision and are authorized when opened. Id membership alone does not prove that a source supports the attached claim. Claim-support evaluation needs semantic review or another validated assessment method.",
          "The example accepts known citation ids and rejects a fabricated one. It does not call a language model or decide whether the prose is faithful. A real application must combine structural validation with measured answer quality and source-access controls."
        ]
      }
    ],
    "problem": "Validate synthetic citation membership against packed evidence.",
    "code": "evidence = {\"e1\": \"Warranty lasts one year.\", \"e2\": \"Accidental damage is excluded.\"}\ndef valid_citations(ids):\n    return bool(ids) and all(i in evidence for i in ids)\nprint(valid_citations([\"e1\", \"e2\"]))\nprint(valid_citations([\"e9\"]))\nprint(valid_citations([]))",
    "expect": "True\nFalse\nFalse",
    "steps": [
      "Declare the ids of evidence supplied to the hypothetical generator.",
      "Require nonempty citation ids for this synthetic response contract.",
      "Reject absent and fabricated ids."
    ],
    "limit": "Citation membership is a structural condition only. The fixture does not verify entailment, generate answers, enforce real source access or calculate a provider token budget.",
    "mistakes": [
      "Assuming a valid source id proves every attached claim.",
      "Letting a retrieved instruction override the application policy."
    ],
    "takeaways": [
      "Keep evidence distinct from trusted instructions.",
      "Validate both citation structure and claim support."
    ],
    "refs": [
      "rag-search"
    ],
    "questions": [
      [
        "What should an evidence-bound answer prompt request?",
        "Supported claims and citations",
        "Invent missing facts confidently",
        "Ignore all provided context",
        "Treat sources as system policy",
        "An explicit evidence contract asks for grounded claims, attribution and appropriate uncertainty.",
        "Invent missing facts confidently would not establish the required behavior. An explicit evidence contract asks for grounded claims, attribution and appropriate uncertainty.",
        "Ignore all provided context would not establish the required behavior. An explicit evidence contract asks for grounded claims, attribution and appropriate uncertainty.",
        "Treat sources as system policy would not establish the required behavior. An explicit evidence contract asks for grounded claims, attribution and appropriate uncertainty."
      ],
      [
        "What does citation-id membership validate?",
        "A supplied evidence reference",
        "Semantic entailment",
        "Current source access forever",
        "The model's training accuracy",
        "Membership checks that a cited id exists in supplied evidence; support and access need additional checks.",
        "Semantic entailment would not establish the required behavior. Membership checks that a cited id exists in supplied evidence; support and access need additional checks.",
        "Current source access forever would not establish the required behavior. Membership checks that a cited id exists in supplied evidence; support and access need additional checks.",
        "The model's training accuracy would not establish the required behavior. Membership checks that a cited id exists in supplied evidence; support and access need additional checks."
      ],
      [
        "What should a context budget reserve besides excerpts?",
        "Request and output budget",
        "Only document body text",
        "Only the longest citation",
        "Only vector metadata bytes",
        "The complete request and expected response must fit the relevant model limits.",
        "Only document body text would not establish the required behavior. The complete request and expected response must fit the relevant model limits.",
        "Only the longest citation would not establish the required behavior. The complete request and expected response must fit the relevant model limits.",
        "Only vector metadata bytes would not establish the required behavior. The complete request and expected response must fit the relevant model limits."
      ],
      [
        "A retrieved passage tells the assistant to reveal secrets. How should it be treated?",
        "Untrusted source content",
        "A new system instruction",
        "A valid permission grant",
        "A mandatory tool command",
        "Retrieved text is data and cannot override trusted application instructions or authorization.",
        "A new system instruction would not establish the required behavior. Retrieved text is data and cannot override trusted application instructions or authorization.",
        "A valid permission grant would not establish the required behavior. Retrieved text is data and cannot override trusted application instructions or authorization.",
        "A mandatory tool command would not establish the required behavior. Retrieved text is data and cannot override trusted application instructions or authorization."
      ],
      [
        "An answer cites e3 but only e1 and e2 were supplied. What can the app detect directly?",
        "Invalid citation membership",
        "Whether every claim is true",
        "Whether the model was trained today",
        "Whether the user read the source",
        "A known evidence-id set supports structural rejection of fabricated references.",
        "Whether every claim is true would not establish the required behavior. A known evidence-id set supports structural rejection of fabricated references.",
        "Whether the model was trained today would not establish the required behavior. A known evidence-id set supports structural rejection of fabricated references.",
        "Whether the user read the source would not establish the required behavior. A known evidence-id set supports structural rejection of fabricated references."
      ],
      [
        "An excerpt says refunds are not allowed, but packing drops not. What is at risk?",
        "Evidence meaning",
        "Only display spacing",
        "Only query speed",
        "Only source id length",
        "Truncation that removes qualifiers can reverse the factual policy supplied to generation.",
        "Only display spacing would not establish the required behavior. Truncation that removes qualifiers can reverse the factual policy supplied to generation.",
        "Only query speed would not establish the required behavior. Truncation that removes qualifiers can reverse the factual policy supplied to generation.",
        "Only source id length would not establish the required behavior. Truncation that removes qualifiers can reverse the factual policy supplied to generation."
      ],
      [
        "A known citation accompanies a false claim. What check is still needed?",
        "Claim support review",
        "Only id length validation",
        "Only source sorting",
        "Only temperature reduction",
        "Existing ids do not establish that the cited text entails the generated claim.",
        "Only id length validation would not establish the required behavior. Existing ids do not establish that the cited text entails the generated claim.",
        "Only source sorting would not establish the required behavior. Existing ids do not establish that the cited text entails the generated claim.",
        "Only temperature reduction would not establish the required behavior. Existing ids do not establish that the cited text entails the generated claim."
      ],
      [
        "A private citation link is opened after access revocation. What should happen?",
        "Recheck current access",
        "Trust the prior answer forever",
        "Grant access from similarity",
        "Expose the entire index",
        "Citation navigation is a disclosure path and must enforce the current source policy.",
        "Trust the prior answer forever would not establish the required behavior. Citation navigation is a disclosure path and must enforce the current source policy.",
        "Grant access from similarity would not establish the required behavior. Citation navigation is a disclosure path and must enforce the current source policy.",
        "Expose the entire index would not establish the required behavior. Citation navigation is a disclosure path and must enforce the current source policy."
      ]
    ]
  },
  {
    "slug": "stage-diagnosis",
    "comp": "m2.c1",
    "title": "Diagnose missing evidence before changing generation",
    "before": "Complete Vector Databases and Retrieval and Prompting and Structured Output. Apply trusted access scope and the compatible embedding contract.",
    "intro": "A benefits assistant gives the wrong enrollment deadline. Increasing model size may add cost while leaving the underlying failure untouched. Diagnose the exact evidence path before choosing a remedy.",
    "sections": [
      {
        "heading": "Compare source truth with each stage",
        "paragraphs": [
          "Start with the applicable source and expected evidence, using a small labeled case. Verify that extraction retained the relevant passage, the accepted index generation contains it, retrieval returned it and packing preserved it. If the needed evidence never reaches the generator, a generation prompt cannot reliably recover the missing fact under an evidence-only contract.",
          "Distinguish absent source data, poor extraction, stale ingestion, candidate retrieval misses and context-selection loss. These require different fixes: acquiring an approved source, repairing extraction, updating a generation, adjusting retrieval or preserving a necessary passage. Do not collapse them into a single model error category."
        ]
      },
      {
        "heading": "Use controlled interventions",
        "paragraphs": [
          "Hold the question and expected answer fixed while supplying a known sufficient context. If the answer succeeds with that context, the failure is likely upstream of generation for that case. If it fails with sufficient accurate context, investigate prompting, conflict handling, reasoning and output validation. A single intervention identifies evidence for a case, not universal performance.",
          "The fixture labels missing and packed evidence using ids. It cannot decide whether text is actually sufficient or whether a real model would answer correctly; those labels must be supplied and reviewed in an actual evaluation set."
        ]
      }
    ],
    "problem": "Locate a synthetic evidence loss using stage id sets.",
    "code": "expected = {\"deadline\"}\nindexed = {\"deadline\", \"fees\"}\nretrieved = {\"deadline\", \"fees\"}\npacked = {\"fees\"}\nprint(expected <= indexed)\nprint(expected <= retrieved)\nprint(expected <= packed)\nprint(\"packing loss\" if expected <= retrieved and not expected <= packed else \"inspect earlier stages\")",
    "expect": "True\nTrue\nFalse\npacking loss",
    "steps": [
      "Declare a reviewed expected evidence id.",
      "Check whether each synthetic stage retains it.",
      "Locate the first observed handoff that drops it."
    ],
    "limit": "Set membership is a stage-tracing model. It does not label semantic sufficiency, run a retriever, inspect real traces or measure generation accuracy.",
    "mistakes": [
      "Changing the generator before inspecting its actual input.",
      "Calling every wrong answer a retrieval error."
    ],
    "takeaways": [
      "Trace evidence from source to model input.",
      "Use controlled context to isolate stages."
    ],
    "refs": [
      "rag-search"
    ],
    "questions": [
      [
        "What should be inspected first when an answer contradicts policy?",
        "Actual evidence inputs",
        "Only the model logo",
        "Only the user's tone",
        "Only the answer length",
        "Stage inputs show whether the model received accurate sufficient evidence for the actual question.",
        "Only the model logo would not establish the required behavior. Stage inputs show whether the model received accurate sufficient evidence for the actual question.",
        "Only the user's tone would not establish the required behavior. Stage inputs show whether the model received accurate sufficient evidence for the actual question.",
        "Only the answer length would not establish the required behavior. Stage inputs show whether the model received accurate sufficient evidence for the actual question."
      ],
      [
        "What does a retrieval miss mean in a labeled case?",
        "Required evidence was not retrieved",
        "The model never receives tokens",
        "Every source is false",
        "The user has no identity",
        "A retrieval miss concerns recovery of the reviewed evidence, not all other system properties.",
        "The model never receives tokens would not establish the required behavior. A retrieval miss concerns recovery of the reviewed evidence, not all other system properties.",
        "Every source is false would not establish the required behavior. A retrieval miss concerns recovery of the reviewed evidence, not all other system properties.",
        "The user has no identity would not establish the required behavior. A retrieval miss concerns recovery of the reviewed evidence, not all other system properties."
      ],
      [
        "Why use a known sufficient context in diagnosis?",
        "Isolate generation",
        "Prove universal quality",
        "Grant source permission",
        "Refresh every index",
        "Holding an adequate context fixed helps distinguish upstream evidence problems from generation failures.",
        "Prove universal quality would not establish the required behavior. Holding an adequate context fixed helps distinguish upstream evidence problems from generation failures.",
        "Grant source permission would not establish the required behavior. Holding an adequate context fixed helps distinguish upstream evidence problems from generation failures.",
        "Refresh every index would not establish the required behavior. Holding an adequate context fixed helps distinguish upstream evidence problems from generation failures."
      ],
      [
        "The source text is correct but extraction omits its deadline column. Which stage needs repair?",
        "Extraction",
        "Only citation formatting",
        "Only response temperature",
        "Only authorization caching",
        "The missing information is lost before embedding or generation, so extraction must be corrected.",
        "Only citation formatting would not establish the required behavior. The missing information is lost before embedding or generation, so extraction must be corrected.",
        "Only response temperature would not establish the required behavior. The missing information is lost before embedding or generation, so extraction must be corrected.",
        "Only authorization caching would not establish the required behavior. The missing information is lost before embedding or generation, so extraction must be corrected."
      ],
      [
        "The correct chunk is retrieved but omitted from the final prompt. What failed?",
        "Context selection or packing",
        "Source collection necessarily",
        "The embedding model necessarily",
        "The user's login necessarily",
        "Evidence was available at retrieval but lost in the handoff to generation.",
        "Source collection necessarily would not establish the required behavior. Evidence was available at retrieval but lost in the handoff to generation.",
        "The embedding model necessarily would not establish the required behavior. Evidence was available at retrieval but lost in the handoff to generation.",
        "The user's login necessarily would not establish the required behavior. Evidence was available at retrieval but lost in the handoff to generation."
      ],
      [
        "A correct prompt answers one labeled case after supplying golden evidence. What is established?",
        "Case-specific diagnostic evidence",
        "All future answers are correct",
        "All retrieval is fixed",
        "Every source is current",
        "A controlled case supports a local diagnosis rather than proving universal behavior.",
        "All future answers are correct would not establish the required behavior. A controlled case supports a local diagnosis rather than proving universal behavior.",
        "All retrieval is fixed would not establish the required behavior. A controlled case supports a local diagnosis rather than proving universal behavior.",
        "Every source is current would not establish the required behavior. A controlled case supports a local diagnosis rather than proving universal behavior."
      ],
      [
        "A trace contains only the generated answer. What is missing for stage diagnosis?",
        "The evidence handoff record",
        "Only the user's avatar",
        "Only the request button label",
        "Only the server nickname",
        "Without source and context stage information, upstream and downstream causes remain hard to distinguish.",
        "Only the user's avatar would not establish the required behavior. Without source and context stage information, upstream and downstream causes remain hard to distinguish.",
        "Only the request button label would not establish the required behavior. Without source and context stage information, upstream and downstream causes remain hard to distinguish.",
        "Only the server nickname would not establish the required behavior. Without source and context stage information, upstream and downstream causes remain hard to distinguish."
      ],
      [
        "A change improves retrieval but answers stay wrong with adequate context. What next?",
        "Investigate generation and support",
        "Assume retrieval must be perfect",
        "Delete the expected labels",
        "Publish based on recall alone",
        "Good evidence recovery does not guarantee that generation uses the evidence faithfully.",
        "Assume retrieval must be perfect would not establish the required behavior. Good evidence recovery does not guarantee that generation uses the evidence faithfully.",
        "Delete the expected labels would not establish the required behavior. Good evidence recovery does not guarantee that generation uses the evidence faithfully.",
        "Publish based on recall alone would not establish the required behavior. Good evidence recovery does not guarantee that generation uses the evidence faithfully."
      ]
    ]
  },
  {
    "slug": "generation-support",
    "comp": "m2.c1",
    "title": "Separate answer faithfulness from retrieval success",
    "before": "Complete Vector Databases and Retrieval and Prompting and Structured Output. Apply trusted access scope and the compatible embedding contract.",
    "intro": "A shipping assistant receives a passage saying delivery may take up to five working days and answers guaranteed tomorrow. The evidence was retrieved, but the generated claim exceeded what it supports. Retrieval success and faithful answering need separate measurement.",
    "sections": [
      {
        "heading": "Evaluate what the answer adds or changes",
        "paragraphs": [
          "Break a response into checkable claims and compare them with the supplied evidence. Look for unsupported dates, amounts, guarantees and exceptions. A faithful summary can paraphrase the source but should preserve uncertainty, scope and conditions. Correct citation formatting cannot repair an unsupported guarantee.",
          "Question relevance is also separate: a response can repeat source text faithfully while failing to answer the user. Evaluate evidence recovery, claim support and usefulness with appropriate labels rather than treating a single similarity score as complete quality assurance."
        ]
      },
      {
        "heading": "Handle conflict and partial support explicitly",
        "paragraphs": [
          "When permitted sources conflict, apply an approved authority and effective-date policy or report the conflict. Do not average incompatible legal rules or choose the most fluent sentence. If only part of a multipart question is supported, answer that part with attribution and identify the unsupported remainder.",
          "The example flags a supplied claim whose evidence-id support label is false. Those labels are manually declared for the fixture. Automated semantic evaluators need calibration against human judgments and cannot be replaced by simple keyword equality."
        ]
      }
    ],
    "problem": "Compute support coverage from reviewed synthetic claim labels.",
    "code": "claims = [{\"id\": \"c1\", \"supported\": True}, {\"id\": \"c2\", \"supported\": False}, {\"id\": \"c3\", \"supported\": True}]\nunsupported = [c[\"id\"] for c in claims if not c[\"supported\"]]\nprint(unsupported)\nprint(sum(c[\"supported\"] for c in claims) / len(claims))",
    "expect": "['c2']\n0.6666666666666666",
    "steps": [
      "Use explicit synthetic per-claim review labels.",
      "List unsupported claims.",
      "Calculate the supported fraction of the three claims."
    ],
    "limit": "The labels are supplied, not inferred. This fixture neither judges language entailment nor validates an LLM judge; a real rubric must define supported claims and handle partial or disputed evidence.",
    "mistakes": [
      "Treating citation presence as a faithfulness score.",
      "Confusing a faithful quotation with a useful answer."
    ],
    "takeaways": [
      "Measure retrieval and answer support separately.",
      "Preserve source qualifications and scope."
    ],
    "refs": [
      "rag-search"
    ],
    "questions": [
      [
        "What does answer faithfulness ask?",
        "Are claims supported?",
        "Is the answer longest?",
        "Is every word copied?",
        "Is the model newest?",
        "Faithfulness concerns whether the answer is grounded in the evidence, allowing accurate paraphrase.",
        "Is the answer longest? would not establish the required behavior. Faithfulness concerns whether the answer is grounded in the evidence, allowing accurate paraphrase.",
        "Is every word copied? would not establish the required behavior. Faithfulness concerns whether the answer is grounded in the evidence, allowing accurate paraphrase.",
        "Is the model newest? would not establish the required behavior. Faithfulness concerns whether the answer is grounded in the evidence, allowing accurate paraphrase."
      ],
      [
        "Can a faithful answer fail to answer the question?",
        "Yes, relevance is separate",
        "No, citation implies usefulness",
        "No, all quotations are answers",
        "Only if vectors are missing",
        "A response can accurately repeat unrelated source facts while failing the user's information need.",
        "No, citation implies usefulness would not establish the required behavior. A response can accurately repeat unrelated source facts while failing the user's information need.",
        "No, all quotations are answers would not establish the required behavior. A response can accurately repeat unrelated source facts while failing the user's information need.",
        "Only if vectors are missing would not establish the required behavior. A response can accurately repeat unrelated source facts while failing the user's information need."
      ],
      [
        "What must a paraphrase preserve?",
        "Meaning and qualifications",
        "Exact font size",
        "Every source typo",
        "All original line breaks",
        "Faithful paraphrasing preserves conditions, scope and uncertainty rather than only surface words.",
        "Exact font size would not establish the required behavior. Faithful paraphrasing preserves conditions, scope and uncertainty rather than only surface words.",
        "Every source typo would not establish the required behavior. Faithful paraphrasing preserves conditions, scope and uncertainty rather than only surface words.",
        "All original line breaks would not establish the required behavior. Faithful paraphrasing preserves conditions, scope and uncertainty rather than only surface words."
      ],
      [
        "A source says may and an answer says guaranteed. What changed?",
        "Unsupported certainty",
        "Only citation spelling",
        "Only context length",
        "Only source ordering",
        "The stronger guarantee exceeds the source's qualified statement.",
        "Only citation spelling would not establish the required behavior. The stronger guarantee exceeds the source's qualified statement.",
        "Only context length would not establish the required behavior. The stronger guarantee exceeds the source's qualified statement.",
        "Only source ordering would not establish the required behavior. The stronger guarantee exceeds the source's qualified statement."
      ],
      [
        "Two current policies conflict with no approved precedence rule. What should the assistant do?",
        "Report the conflict",
        "Invent an average policy",
        "Choose the shorter paragraph",
        "Hide the lower similarity source",
        "Unresolved conflicting authority should be disclosed or escalated under policy rather than silently fabricated.",
        "Invent an average policy would not establish the required behavior. Unresolved conflicting authority should be disclosed or escalated under policy rather than silently fabricated.",
        "Choose the shorter paragraph would not establish the required behavior. Unresolved conflicting authority should be disclosed or escalated under policy rather than silently fabricated.",
        "Hide the lower similarity source would not establish the required behavior. Unresolved conflicting authority should be disclosed or escalated under policy rather than silently fabricated."
      ],
      [
        "Only one part of a two-part question is supported. What is appropriate?",
        "A bounded partial answer",
        "Invent the second part",
        "Reject all evidence as false",
        "Treat all parts as fully proven",
        "Partial support can justify a bounded answer while clearly identifying missing information.",
        "Invent the second part would not establish the required behavior. Partial support can justify a bounded answer while clearly identifying missing information.",
        "Reject all evidence as false would not establish the required behavior. Partial support can justify a bounded answer while clearly identifying missing information.",
        "Treat all parts as fully proven would not establish the required behavior. Partial support can justify a bounded answer while clearly identifying missing information."
      ],
      [
        "A toy support score uses hand-labeled booleans. What remains untested?",
        "Automatic semantic judging",
        "The arithmetic average",
        "The list of claim ids",
        "The declared label values",
        "The calculation consumes judgments and does not establish a system for producing reliable labels.",
        "The arithmetic average would not establish the required behavior. The calculation consumes judgments and does not establish a system for producing reliable labels.",
        "The list of claim ids would not establish the required behavior. The calculation consumes judgments and does not establish a system for producing reliable labels.",
        "The declared label values would not establish the required behavior. The calculation consumes judgments and does not establish a system for producing reliable labels."
      ],
      [
        "A model judge agrees with itself repeatedly. What independent evidence is useful?",
        "Reviewed human-labeled cases",
        "Only another identical run",
        "Only a larger response budget",
        "Only prettier citation links",
        "Calibration against independent reviewed labels helps assess whether automated judgments correspond to the rubric.",
        "Only another identical run would not establish the required behavior. Calibration against independent reviewed labels helps assess whether automated judgments correspond to the rubric.",
        "Only a larger response budget would not establish the required behavior. Calibration against independent reviewed labels helps assess whether automated judgments correspond to the rubric.",
        "Only prettier citation links would not establish the required behavior. Calibration against independent reviewed labels helps assess whether automated judgments correspond to the rubric."
      ]
    ]
  },
  {
    "slug": "no-evidence",
    "comp": "m2.c2",
    "title": "Handle absent and insufficient evidence without guessing",
    "before": "Complete Vector Databases and Retrieval and Prompting and Structured Output. Apply trusted access scope and the compatible embedding contract.",
    "intro": "A bank assistant is asked about a future fee that has not been announced in its permitted sources. The retriever still returns a top result because ranking can always find the nearest item in a nonempty corpus. A rank position is not proof that the answer exists.",
    "sections": [
      {
        "heading": "Define insufficiency before deployment",
        "paragraphs": [
          "A no-answer policy should cover empty results, unrelated passages, unsupported requested details, conflicting sources and unavailable authorized evidence. State a useful limitation and provide an approved next step, such as asking for a product version or referring to the right support channel. Do not invent a source or expose private evidence to fill a gap.",
          "Similarity thresholds can be signals but depend on model, corpus and query population. Calibrate them with answerable and unanswerable examples and measure false answers as well as unnecessary abstentions. A single threshold does not establish semantic sufficiency or solve every out-of-scope case."
        ]
      },
      {
        "heading": "Treat abstention as product behavior",
        "paragraphs": [
          "Keep retrieval outages distinct from verified absence of information. An unavailable service means evidence could not be checked, not that no policy exists. A bounded retry or safe escalation can improve reliability without turning uncertainty into a fabricated fact. Preserve truthful status for reviewers and users.",
          "The fixture gates a response on reviewed sufficiency and retrieval status. It is a small policy state machine using supplied labels, not a confidence estimator. A production policy needs evaluated labels, current access checks and measured user outcomes."
        ]
      }
    ],
    "problem": "Distinguish supported answers, no evidence and retrieval failures.",
    "code": "def route(status, sufficient):\n    if status != \"ok\":\n        return \"evidence unavailable\"\n    return \"answer from evidence\" if sufficient else \"insufficient evidence\"\nprint(route(\"ok\", True))\nprint(route(\"ok\", False))\nprint(route(\"timeout\", False))",
    "expect": "answer from evidence\ninsufficient evidence\nevidence unavailable",
    "steps": [
      "Check retrieval availability before interpreting sufficiency.",
      "Allow an evidence answer only for the supplied sufficient case.",
      "Report missing evidence separately from an unavailable service."
    ],
    "limit": "Sufficiency is an input label here. The example does not infer relevance, calibrate a similarity threshold or prove that any real evidence supports a claim.",
    "mistakes": [
      "Equating top rank with sufficient evidence.",
      "Describing a retrieval outage as proof that a fact does not exist."
    ],
    "takeaways": [
      "Make insufficient-evidence handling explicit.",
      "Evaluate harmful guesses and needless abstentions together."
    ],
    "refs": [
      "rag-search"
    ],
    "questions": [
      [
        "Does a top-ranked result guarantee an answer is present?",
        "No, ranking is relative",
        "Yes, top one means certain",
        "Yes, if the id is valid",
        "Only for short questions",
        "A nearest item can still be unrelated or insufficient for the requested fact.",
        "Yes, top one means certain would not establish the required behavior. A nearest item can still be unrelated or insufficient for the requested fact.",
        "Yes, if the id is valid would not establish the required behavior. A nearest item can still be unrelated or insufficient for the requested fact.",
        "Only for short questions would not establish the required behavior. A nearest item can still be unrelated or insufficient for the requested fact."
      ],
      [
        "What is abstention in an evidence-bound assistant?",
        "Declining unsupported claims",
        "Deleting every source",
        "Granting broader access",
        "Changing the model weights",
        "Abstention avoids asserting claims that the permitted evidence cannot support.",
        "Deleting every source would not establish the required behavior. Abstention avoids asserting claims that the permitted evidence cannot support.",
        "Granting broader access would not establish the required behavior. Abstention avoids asserting claims that the permitted evidence cannot support.",
        "Changing the model weights would not establish the required behavior. Abstention avoids asserting claims that the permitted evidence cannot support."
      ],
      [
        "Why test unanswerable questions?",
        "Measure unsafe guessing",
        "Only increase token counts",
        "Only test UI colors",
        "Only shorten source titles",
        "An evaluation needs missing-evidence cases to detect plausible fabrication rather than only correct lookups.",
        "Only increase token counts would not establish the required behavior. An evaluation needs missing-evidence cases to detect plausible fabrication rather than only correct lookups.",
        "Only test UI colors would not establish the required behavior. An evaluation needs missing-evidence cases to detect plausible fabrication rather than only correct lookups.",
        "Only shorten source titles would not establish the required behavior. An evaluation needs missing-evidence cases to detect plausible fabrication rather than only correct lookups."
      ],
      [
        "Retrieval times out. Which message reflects the evidence?",
        "Evidence could not be checked",
        "The policy does not exist",
        "The fee is definitely zero",
        "Every account is eligible",
        "An outage establishes unavailability of the check, not absence of the underlying fact.",
        "The policy does not exist would not establish the required behavior. An outage establishes unavailability of the check, not absence of the underlying fact.",
        "The fee is definitely zero would not establish the required behavior. An outage establishes unavailability of the check, not absence of the underlying fact.",
        "Every account is eligible would not establish the required behavior. An outage establishes unavailability of the check, not absence of the underlying fact."
      ],
      [
        "A user asks which product edition a policy applies to. The edition is unspecified. What may help?",
        "A targeted clarification",
        "Inventing the edition",
        "Showing another tenant's manual",
        "Treating all editions as equal",
        "A clarifying question can resolve scope without inventing a fact or widening access.",
        "Inventing the edition would not establish the required behavior. A clarifying question can resolve scope without inventing a fact or widening access.",
        "Showing another tenant's manual would not establish the required behavior. A clarifying question can resolve scope without inventing a fact or widening access.",
        "Treating all editions as equal would not establish the required behavior. A clarifying question can resolve scope without inventing a fact or widening access."
      ],
      [
        "A threshold rejects many answerable queries. What tradeoff needs measurement?",
        "Refusal/guess tradeoff",
        "Only mean response length",
        "Only cache key count",
        "Only chunk id format",
        "A useful policy balances unsafe answers with lost answerable cases under the product requirements.",
        "Only mean response length would not establish the required behavior. A useful policy balances unsafe answers with lost answerable cases under the product requirements.",
        "Only cache key count would not establish the required behavior. A useful policy balances unsafe answers with lost answerable cases under the product requirements.",
        "Only chunk id format would not establish the required behavior. A useful policy balances unsafe answers with lost answerable cases under the product requirements."
      ],
      [
        "No authorized source supports a requested salary. What must not happen?",
        "Unauthorized private search",
        "Stating the evidence limit",
        "Offering an approved support route",
        "Asking a scope clarification",
        "Missing evidence does not justify bypassing authorization to satisfy a question.",
        "Stating the evidence limit would not establish the required behavior. Missing evidence does not justify bypassing authorization to satisfy a question.",
        "Offering an approved support route would not establish the required behavior. Missing evidence does not justify bypassing authorization to satisfy a question.",
        "Asking a scope clarification would not establish the required behavior. Missing evidence does not justify bypassing authorization to satisfy a question."
      ],
      [
        "A fixture routes on a supplied sufficient flag. What has it tested?",
        "The declared routing policy",
        "A semantic sufficiency model",
        "A production retrieval outage",
        "The actual fee schedule",
        "The state machine evaluates provided labels and does not establish how real labels are determined.",
        "A semantic sufficiency model would not establish the required behavior. The state machine evaluates provided labels and does not establish how real labels are determined.",
        "A production retrieval outage would not establish the required behavior. The state machine evaluates provided labels and does not establish how real labels are determined.",
        "The actual fee schedule would not establish the required behavior. The state machine evaluates provided labels and does not establish how real labels are determined."
      ]
    ]
  },
  {
    "slug": "version-manifest",
    "comp": "m3.c1",
    "title": "Keep source and index versions aligned",
    "before": "Complete Vector Databases and Retrieval and Prompting and Structured Output. Apply trusted access scope and the compatible embedding contract.",
    "intro": "A policy update replaces a fourteen-day return period with thirty days. New source text is not enough: the accepted searchable generation must represent the intended revision, and answers need provenance that makes the transition auditable.",
    "sections": [
      {
        "heading": "Track two related clocks",
        "paragraphs": [
          "Source revision identifies the authoritative document state. Index generation identifies the derived serving build, including extraction and representation configuration. Record both. A source may change without a new model, while a new model may require rebuilding unchanged text. Effective date is a further applicability attribute and need not equal ingestion time.",
          "Use a manifest of expected source revisions and derived coverage. Reconcile missing, duplicate, stale and deleted records. A job completion flag or total vector count cannot establish that each required source revision is represented correctly."
        ]
      },
      {
        "heading": "Reject stale completion",
        "paragraphs": [
          "Workers can complete out of order. Compare a result with the accepted source lifecycle before activating it; a delayed old job should not overwrite a newer version or resurrect a deletion. Stable revision-aware ids and idempotent writes make retries easier to reason about.",
          "The fixture checks source revisions in a synthetic manifest and refuses a stale update. It models an acceptance rule, not concurrent database transactions, change data capture or a live distributed index."
        ]
      }
    ],
    "problem": "Identify a stale source revision and reject an old completion.",
    "code": "expected = {\"returns\": 4, \"shipping\": 2}\nindexed = {\"returns\": 3, \"shipping\": 2}\nprint([s for s in expected if indexed.get(s) != expected[s]])\ndef accept(source, revision):\n    return revision == expected.get(source)\nprint(accept(\"returns\", 3))\nprint(accept(\"returns\", 4))",
    "expect": "['returns']\nFalse\nTrue",
    "steps": [
      "Declare the intended source revision map.",
      "Compare the indexed manifest with expected revisions.",
      "Accept only the declared current revision in this local policy."
    ],
    "limit": "The local equality check omits native persistence, atomic activation, event ordering and concurrent updates. It must not be described as a complete production freshness or consistency guarantee.",
    "mistakes": [
      "Using ingestion timestamp as the policy effective date.",
      "Allowing last-finishing jobs to define the current source version."
    ],
    "takeaways": [
      "Version source state and serving builds separately.",
      "Use revision-aware acceptance and reconciliation."
    ],
    "refs": [
      "rag-search"
    ],
    "questions": [
      [
        "What does a source revision identify?",
        "A document state",
        "A user's password",
        "A model's answer length",
        "A UI theme",
        "A source revision identifies which state of a document its evidence represents.",
        "A user's password would not establish the required behavior. A source revision identifies which state of a document its evidence represents.",
        "A model's answer length would not establish the required behavior. A source revision identifies which state of a document its evidence represents.",
        "A UI theme would not establish the required behavior. A source revision identifies which state of a document its evidence represents."
      ],
      [
        "Is effective date necessarily ingestion time?",
        "No, they differ",
        "Yes, by definition",
        "Only if ids are numeric",
        "Only for long policies",
        "Applicability dates belong to source policy and can differ from when the pipeline observed it.",
        "Yes, by definition would not establish the required behavior. Applicability dates belong to source policy and can differ from when the pipeline observed it.",
        "Only if ids are numeric would not establish the required behavior. Applicability dates belong to source policy and can differ from when the pipeline observed it.",
        "Only for long policies would not establish the required behavior. Applicability dates belong to source policy and can differ from when the pipeline observed it."
      ],
      [
        "Why keep a revision manifest?",
        "Find stale coverage",
        "Replace every access check",
        "Avoid all extraction tests",
        "Guarantee model reasoning",
        "A manifest compares intended source states with accepted derived records.",
        "Replace every access check would not establish the required behavior. A manifest compares intended source states with accepted derived records.",
        "Avoid all extraction tests would not establish the required behavior. A manifest compares intended source states with accepted derived records.",
        "Guarantee model reasoning would not establish the required behavior. A manifest compares intended source states with accepted derived records."
      ],
      [
        "Revision 5 completes before delayed revision 4. Which should serve?",
        "The accepted current revision",
        "Always the last completion",
        "Always the shortest text",
        "Whichever has a larger chunk id",
        "Completion order does not establish source authority; the lifecycle contract determines current revision.",
        "Always the last completion would not establish the required behavior. Completion order does not establish source authority; the lifecycle contract determines current revision.",
        "Always the shortest text would not establish the required behavior. Completion order does not establish source authority; the lifecycle contract determines current revision.",
        "Whichever has a larger chunk id would not establish the required behavior. Completion order does not establish source authority; the lifecycle contract determines current revision."
      ],
      [
        "A job says success but omitted one required policy. What is missing?",
        "Coverage reconciliation",
        "Only a newer model",
        "Only prompt styling",
        "Only citation punctuation",
        "Job status alone does not prove all expected sources and revisions were represented.",
        "Only a newer model would not establish the required behavior. Job status alone does not prove all expected sources and revisions were represented.",
        "Only prompt styling would not establish the required behavior. Job status alone does not prove all expected sources and revisions were represented.",
        "Only citation punctuation would not establish the required behavior. Job status alone does not prove all expected sources and revisions were represented."
      ],
      [
        "A document is deleted during a rebuild. What must the build respect?",
        "The current deletion state",
        "Only its initial snapshot",
        "Only vector dimensions",
        "Only the old title",
        "A stale snapshot must not reactivate content that is no longer eligible to serve.",
        "Only its initial snapshot would not establish the required behavior. A stale snapshot must not reactivate content that is no longer eligible to serve.",
        "Only vector dimensions would not establish the required behavior. A stale snapshot must not reactivate content that is no longer eligible to serve.",
        "Only the old title would not establish the required behavior. A stale snapshot must not reactivate content that is no longer eligible to serve."
      ],
      [
        "A fixture compares two version maps. What remains unverified?",
        "Atomic activation",
        "Its local equality result",
        "Its explicit source ids",
        "Its printed stale list",
        "In-memory comparisons do not test real transaction, event or distributed consistency behavior.",
        "Its local equality result would not establish the required behavior. In-memory comparisons do not test real transaction, event or distributed consistency behavior.",
        "Its explicit source ids would not establish the required behavior. In-memory comparisons do not test real transaction, event or distributed consistency behavior.",
        "Its printed stale list would not establish the required behavior. In-memory comparisons do not test real transaction, event or distributed consistency behavior."
      ],
      [
        "A model changes while source text stays the same. What may still be needed?",
        "A representation rebuild",
        "A fabricated source edit",
        "A rewritten student history",
        "A broader tenant scope",
        "The derived representation can change independently of source text and needs compatible serving generations.",
        "A fabricated source edit would not establish the required behavior. The derived representation can change independently of source text and needs compatible serving generations.",
        "A rewritten student history would not establish the required behavior. The derived representation can change independently of source text and needs compatible serving generations.",
        "A broader tenant scope would not establish the required behavior. The derived representation can change independently of source text and needs compatible serving generations."
      ]
    ]
  },
  {
    "slug": "fresh-context",
    "comp": "m3.c1",
    "title": "Make caches and citations respect source lifecycle",
    "before": "Complete Vector Databases and Retrieval and Prompting and Structured Output. Apply trusted access scope and the compatible embedding contract.",
    "intro": "A source update reaches the vector index, but the assistant keeps serving an old cached answer. Freshness is a property of the complete disclosure path, including context caches, answer caches, detail routes and citation resolution.",
    "sections": [
      {
        "heading": "Version cache dependencies",
        "paragraphs": [
          "A cache entry should identify the source/index generation and relevant access scope it depends on. A short time-to-live limits some staleness but does not establish immediate invalidation. Decide whether source changes invalidate entries, cause revalidation or route requests away from affected results until the accepted generation is ready.",
          "Changes in permissions matter even when source text is unchanged. Query text alone is rarely a sufficient key for private multi-tenant answers. Keep trusted identity and scope resolution outside the model, and test denied cache reuse and old citation access."
        ]
      },
      {
        "heading": "Handle historical attribution deliberately",
        "paragraphs": [
          "An answer may need to identify the source revision used rather than silently resolving its citation to different text. Historical retention and current visibility require explicit policy. A revision-specific link still needs current authorization; provenance cannot be used as a permanent access token.",
          "The example verifies cache source revision and scope version against current local values. It only decides whether a supplied synthetic entry can be reused. It does not implement a distributed invalidation bus, legal retention workflow or citation service."
        ]
      }
    ],
    "problem": "Reject a synthetic cached answer after a source or permission change.",
    "code": "current = {\"source_revision\": 8, \"scope_version\": 3}\ndef reusable(entry):\n    return all(entry[k] == current[k] for k in current)\nprint(reusable({\"source_revision\": 8, \"scope_version\": 3}))\nprint(reusable({\"source_revision\": 7, \"scope_version\": 3}))\nprint(reusable({\"source_revision\": 8, \"scope_version\": 2}))",
    "expect": "True\nFalse\nFalse",
    "steps": [
      "Declare current synthetic source and scope versions.",
      "Check both dependency versions before reuse.",
      "Reject stale source and stale permission entries separately."
    ],
    "limit": "Equality checks only model an invalidation policy. They do not prove real current identity, complete cache dependency coverage, distributed propagation or semantic answer validity.",
    "mistakes": [
      "Assuming an updated index automatically clears answer caches.",
      "Treating an old citation as a permanent access grant."
    ],
    "takeaways": [
      "Include lifecycle dependencies in cache policy.",
      "Preserve attribution while enforcing current access."
    ],
    "refs": [
      "rag-search"
    ],
    "questions": [
      [
        "Can an updated index coexist with a stale answer cache?",
        "Yes, they are separate paths",
        "No, every cache updates itself",
        "Only if vectors are deleted",
        "Only for public documents",
        "Derived answer caches need explicit invalidation or revalidation beyond index updates.",
        "No, every cache updates itself would not establish the required behavior. Derived answer caches need explicit invalidation or revalidation beyond index updates.",
        "Only if vectors are deleted would not establish the required behavior. Derived answer caches need explicit invalidation or revalidation beyond index updates.",
        "Only for public documents would not establish the required behavior. Derived answer caches need explicit invalidation or revalidation beyond index updates."
      ],
      [
        "What should a revision-specific citation identify?",
        "The evidence revision used",
        "A permanent permission grant",
        "The latest text regardless of answer",
        "The user's hidden credentials",
        "Attribution should describe the evidence underlying the answer while access remains separately controlled.",
        "A permanent permission grant would not establish the required behavior. Attribution should describe the evidence underlying the answer while access remains separately controlled.",
        "The latest text regardless of answer would not establish the required behavior. Attribution should describe the evidence underlying the answer while access remains separately controlled.",
        "The user's hidden credentials would not establish the required behavior. Attribution should describe the evidence underlying the answer while access remains separately controlled."
      ],
      [
        "Does a short cache TTL prove immediate freshness?",
        "No, staleness can remain",
        "Yes, for every update",
        "Yes, if ids are strings",
        "Only with longer answers",
        "A TTL bounds some reuse time but does not synchronize every change immediately.",
        "Yes, for every update would not establish the required behavior. A TTL bounds some reuse time but does not synchronize every change immediately.",
        "Yes, if ids are strings would not establish the required behavior. A TTL bounds some reuse time but does not synchronize every change immediately.",
        "Only with longer answers would not establish the required behavior. A TTL bounds some reuse time but does not synchronize every change immediately."
      ],
      [
        "An employee's permissions change but source text does not. What may invalidate a cache?",
        "Access scope version",
        "Only source token count",
        "Only model output length",
        "Only query spelling",
        "Cached private answers depend on authorization as well as content state.",
        "Only source token count would not establish the required behavior. Cached private answers depend on authorization as well as content state.",
        "Only model output length would not establish the required behavior. Cached private answers depend on authorization as well as content state.",
        "Only query spelling would not establish the required behavior. Cached private answers depend on authorization as well as content state."
      ],
      [
        "Two tenants ask the same question. Why can a query-only cache key be unsafe?",
        "Permitted evidence can differ",
        "All questions are confidential",
        "Vectors cannot be shared internally",
        "Every answer must be randomized",
        "The same text can require different authorized evidence and answers across principals.",
        "All questions are confidential would not establish the required behavior. The same text can require different authorized evidence and answers across principals.",
        "Vectors cannot be shared internally would not establish the required behavior. The same text can require different authorized evidence and answers across principals.",
        "Every answer must be randomized would not establish the required behavior. The same text can require different authorized evidence and answers across principals."
      ],
      [
        "An old answer links to the latest policy text with a different amount. What is obscured?",
        "Source attribution",
        "Only website color",
        "Only ANN effort",
        "Only query normalization",
        "Silently changing the cited revision can hide what actually supported the earlier answer.",
        "Only website color would not establish the required behavior. Silently changing the cited revision can hide what actually supported the earlier answer.",
        "Only ANN effort would not establish the required behavior. Silently changing the cited revision can hide what actually supported the earlier answer.",
        "Only query normalization would not establish the required behavior. Silently changing the cited revision can hide what actually supported the earlier answer."
      ],
      [
        "A user replays a citation after losing access. Which rule applies?",
        "Current source authorization",
        "Access forever from old rank",
        "Permission from the citation spelling",
        "Permission from a cached score",
        "A citation is a reference, not a durable access capability by itself.",
        "Access forever from old rank would not establish the required behavior. A citation is a reference, not a durable access capability by itself.",
        "Permission from the citation spelling would not establish the required behavior. A citation is a reference, not a durable access capability by itself.",
        "Permission from a cached score would not establish the required behavior. A citation is a reference, not a durable access capability by itself."
      ],
      [
        "A local cache equality fixture passes. What remains untested?",
        "Cache propagation",
        "The supplied version values",
        "The boolean comparisons",
        "The printed reuse decisions",
        "The local policy does not exercise real cache propagation or current permission resolution.",
        "The supplied version values would not establish the required behavior. The local policy does not exercise real cache propagation or current permission resolution.",
        "The boolean comparisons would not establish the required behavior. The local policy does not exercise real cache propagation or current permission resolution.",
        "The printed reuse decisions would not establish the required behavior. The local policy does not exercise real cache propagation or current permission resolution."
      ]
    ]
  },
  {
    "slug": "freshness-acceptance",
    "comp": "m3.c1",
    "title": "Accept fresh generations with targeted regression evidence",
    "before": "Complete Vector Databases and Retrieval and Prompting and Structured Output. Apply trusted access scope and the compatible embedding contract.",
    "intro": "A new handbook generation has the expected record count and appears healthy, yet the assistant still quotes a retired rule. A freshness release needs acceptance cases that distinguish current, superseded, deleted and not-yet-effective evidence.",
    "sections": [
      {
        "heading": "Test transitions rather than counts alone",
        "paragraphs": [
          "Build a small reviewed set around changed sources: a question whose answer changed, a question about an unchanged policy, a removed source, a revoked user and a future-effective rule. Verify the retrieved ids and revisions as well as the final supported answer. This links lifecycle acceptance to visible behavior instead of only ingestion counters.",
          "Include negative cases so old chunks and cached answers do not remain discoverable through secondary routes. Use isolated fixtures and authorized test data; no public intrusive testing or production database access is required to evaluate the curriculum examples."
        ]
      },
      {
        "heading": "Make cutover evidence reviewable",
        "paragraphs": [
          "Before activation, inspect completeness, representation compatibility, current access, changed-answer behavior and recovery options. Keep a versioned routing plan for rollback, while ensuring any retained older generation still respects current deletions and permissions. Restoring old content must not resurrect forbidden data.",
          "The example compares observed source revisions against a small expected acceptance table. It shows a failed freshness gate becoming satisfied after correcting one observation. These observations are synthetic; a real gate must obtain them from the relevant serving paths and retain appropriate review evidence."
        ]
      }
    ],
    "problem": "Check a synthetic freshness regression table before acceptance.",
    "code": "expected = {\"changed_policy\": \"v2\", \"deleted_policy\": None, \"unchanged_policy\": \"v1\"}\nobserved = {\"changed_policy\": \"v1\", \"deleted_policy\": None, \"unchanged_policy\": \"v1\"}\ndef failures():\n    return [q for q in expected if observed.get(q) != expected[q]]\nprint(failures())\nobserved[\"changed_policy\"] = \"v2\"\nprint(failures())",
    "expect": "['changed_policy']\n[]",
    "steps": [
      "Declare expected synthetic transition observations.",
      "Identify a changed-answer regression.",
      "Correct that observation and rerun the table comparison."
    ],
    "limit": "The table contains supplied observations rather than real retrieval or model results. It does not verify source quality, permission services, index activation or operational rollback.",
    "mistakes": [
      "Accepting only a matching vector count after source changes.",
      "Rolling back without reapplying current deletion and access policy."
    ],
    "takeaways": [
      "Use changed and negative cases for freshness acceptance.",
      "Keep rollback compatible with current lifecycle requirements."
    ],
    "refs": [
      "rag-search"
    ],
    "questions": [
      [
        "Why test a changed-answer question after an update?",
        "Expose stale serving behavior",
        "Only count documents",
        "Only measure font rendering",
        "Only warm every cache",
        "A question whose correct evidence changed can reveal old chunks or cached answers still being served.",
        "Only count documents would not establish the required behavior. A question whose correct evidence changed can reveal old chunks or cached answers still being served.",
        "Only measure font rendering would not establish the required behavior. A question whose correct evidence changed can reveal old chunks or cached answers still being served.",
        "Only warm every cache would not establish the required behavior. A question whose correct evidence changed can reveal old chunks or cached answers still being served."
      ],
      [
        "What negative case belongs in freshness acceptance?",
        "A removed-source denial",
        "Only a valid current lookup",
        "Only a long question",
        "Only an unchanged source",
        "Removed and revoked cases test that retired evidence does not persist through disclosure paths.",
        "Only a valid current lookup would not establish the required behavior. Removed and revoked cases test that retired evidence does not persist through disclosure paths.",
        "Only a long question would not establish the required behavior. Removed and revoked cases test that retired evidence does not persist through disclosure paths.",
        "Only an unchanged source would not establish the required behavior. Removed and revoked cases test that retired evidence does not persist through disclosure paths."
      ],
      [
        "Is a matching vector count sufficient for freshness?",
        "No, versions can be stale",
        "Yes, counts prove all ids",
        "Yes, if dimensions match",
        "Only with a graph index",
        "Different record sets and revisions can have equal counts, so coverage and lifecycle tests are needed.",
        "Yes, counts prove all ids would not establish the required behavior. Different record sets and revisions can have equal counts, so coverage and lifecycle tests are needed.",
        "Yes, if dimensions match would not establish the required behavior. Different record sets and revisions can have equal counts, so coverage and lifecycle tests are needed.",
        "Only with a graph index would not establish the required behavior. Different record sets and revisions can have equal counts, so coverage and lifecycle tests are needed."
      ],
      [
        "A rollback uses yesterday's index. What must still apply?",
        "Today's deletion and access policy",
        "Yesterday's permissions forever",
        "Only yesterday's source count",
        "Only the old service name",
        "Recovering an older representation must not restore content that current policy forbids serving.",
        "Yesterday's permissions forever would not establish the required behavior. Recovering an older representation must not restore content that current policy forbids serving.",
        "Only yesterday's source count would not establish the required behavior. Recovering an older representation must not restore content that current policy forbids serving.",
        "Only the old service name would not establish the required behavior. Recovering an older representation must not restore content that current policy forbids serving."
      ],
      [
        "A future policy is indexed but not yet effective. What must retrieval consider?",
        "The applicable date",
        "Only ingestion completion",
        "Only vector similarity",
        "Only the newest filename",
        "Index presence and recency are not the same as policy applicability.",
        "Only ingestion completion would not establish the required behavior. Index presence and recency are not the same as policy applicability.",
        "Only vector similarity would not establish the required behavior. Index presence and recency are not the same as policy applicability.",
        "Only the newest filename would not establish the required behavior. Index presence and recency are not the same as policy applicability."
      ],
      [
        "A freshness fixture compares expected and observed ids. What are its observations?",
        "Supplied synthetic values",
        "Measured provider outputs",
        "Real database rows",
        "Verified user permissions",
        "The fixture checks a declared acceptance policy without exercising live serving components.",
        "Measured provider outputs would not establish the required behavior. The fixture checks a declared acceptance policy without exercising live serving components.",
        "Real database rows would not establish the required behavior. The fixture checks a declared acceptance policy without exercising live serving components.",
        "Verified user permissions would not establish the required behavior. The fixture checks a declared acceptance policy without exercising live serving components."
      ],
      [
        "An update passes current lookups but old citation links expose deleted text. What failed?",
        "A secondary disclosure path",
        "Only ANN geometry",
        "Only answer brevity",
        "Only title normalization",
        "Freshness and deletion must be enforced beyond primary retrieval, including detail and citation routes.",
        "Only ANN geometry would not establish the required behavior. Freshness and deletion must be enforced beyond primary retrieval, including detail and citation routes.",
        "Only answer brevity would not establish the required behavior. Freshness and deletion must be enforced beyond primary retrieval, including detail and citation routes.",
        "Only title normalization would not establish the required behavior. Freshness and deletion must be enforced beyond primary retrieval, including detail and citation routes."
      ],
      [
        "What should a draft technical pass imply about human review?",
        "Review is still pending",
        "Approval is automatic",
        "Publication is guaranteed",
        "Production is already updated",
        "Automated fixture checks establish limited technical evidence and do not constitute educational approval or publication.",
        "Approval is automatic would not establish the required behavior. Automated fixture checks establish limited technical evidence and do not constitute educational approval or publication.",
        "Publication is guaranteed would not establish the required behavior. Automated fixture checks establish limited technical evidence and do not constitute educational approval or publication.",
        "Production is already updated would not establish the required behavior. Automated fixture checks establish limited technical evidence and do not constitute educational approval or publication."
      ]
    ]
  }
],[
  {
    "id": "rag-search",
    "title": "OpenAI Cookbook: Question answering using embeddings-based search",
    "url": "https://github.com/openai/openai-cookbook/blob/2d5b1a9b6e706a732b03048d701c7086fda5f010/examples/Question_answering_using_embeddings.ipynb",
    "source": {
      "repo": "openai/openai-cookbook",
      "commit": "2d5b1a9b6e706a732b03048d701c7086fda5f010",
      "path": "examples/Question_answering_using_embeddings.ipynb",
      "verification": "Pinned official notebook read for collection/chunking/search/ask separation, evidence budgeting and diagnosis by inspecting supplied context. Historical model names, prices and cutoff claims are not adopted. Offline Python fixtures use synthetic labels and do not call models, implement embeddings or test native vector databases."
    }
  }
]);

// Fresh checkpoint-only items complete two disjoint eight-item forms per module.
const {Q:checkpointQ}=require('../../qdsl');
module.exports.questions.push({...checkpointQ("rag-fundamentals.p073","m1.c2",'H','scenario','original synthetic AI service',"A generated answer uses an approved evidence id but omits the policy exception beside its claim. What should review evaluate?",null,["Whether the user prefers longer text","Whether the claim preserves the exception","Whether the evidence id has more digits","Whether the answer uses a newer font"],1,"A structural citation can be valid while a claim distorts its source; support review must preserve applicable exceptions.",["Length preference does not authorize omitting qualifications.","The number of id digits does not establish support.","Font choices do not preserve policy meaning."]),subtrack:"rag-fundamentals",objective:"rag-fundamentals.m1.c2",status:'draft'});
module.exports.questions.push({...checkpointQ("rag-fundamentals.p074","m2.c2",'H','scenario','original synthetic AI service',"A user requests an unpublished future discount and retrieval returns only current prices. What response respects the evidence boundary?",null,["Treat top rank as proof of a discount","Ask the model to invent a likely amount","State that future pricing is unsupported","Infer the discount from current wording"],2,"Current prices do not establish an unpublished future discount; the answer should state the limitation and use an approved next step.",["Rank position is not factual entailment.","Inventing an amount violates the evidence-only contract.","Current wording does not establish an unannounced change."]),subtrack:"rag-fundamentals",objective:"rag-fundamentals.m2.c2",status:'draft'});
module.exports.questions.push({...checkpointQ("rag-fundamentals.p075","m3.c1",'H','scenario','original synthetic AI service',"A refreshed index passes changed-policy lookups, but old citation links expose a deleted excerpt. What should acceptance conclude?",null,["The refreshed generation fully passes","The old link grants access forever","The evidence is safe if clearly cited","The lifecycle gate still fails"],3,"Deletion and current access requirements cover citation and detail routes as well as primary search, so the remaining path fails acceptance.",["A positive search test does not compensate for another disclosure path.","An old citation is not a permanent authorization grant.","Accurate attribution does not authorize disclosure."]),subtrack:"rag-fundamentals",objective:"rag-fundamentals.m3.c1",status:'draft'});
