'use strict';
const {bank}=require('../../learning/wave1/ai-helper');
module.exports=bank('rag-fundamentals',[
  {
    "comp": "m1.c1",
    "rows": [
      [
        "Which operation belongs to ingestion rather than answer generation?",
        "Extracting source passages",
        "Writing the final explanation",
        "Rendering a response card",
        "Choosing answer punctuation",
        "Ingestion prepares searchable evidence before request-time answering uses it.",
        "Writing the final explanation does not establish this requirement. Ingestion prepares searchable evidence before request-time answering uses it.",
        "Rendering a response card does not establish this requirement. Ingestion prepares searchable evidence before request-time answering uses it.",
        "Choosing answer punctuation does not establish this requirement. Ingestion prepares searchable evidence before request-time answering uses it."
      ],
      [
        "What metadata supports attribution to a specific document state?",
        "Source id and revision",
        "Only generated answer length",
        "Only a similarity score",
        "Only the reader's display name",
        "A stable source identifier and revision link a chunk to the actual document state it represents.",
        "Only generated answer length does not establish this requirement. A stable source identifier and revision link a chunk to the actual document state it represents.",
        "Only a similarity score does not establish this requirement. A stable source identifier and revision link a chunk to the actual document state it represents.",
        "Only the reader's display name does not establish this requirement. A stable source identifier and revision link a chunk to the actual document state it represents."
      ],
      [
        "What distinguishes RAG from updating model parameters?",
        "Evidence is supplied at inference",
        "Every request retrains weights",
        "Retrieval changes all model weights",
        "Document storage is unnecessary",
        "RAG retrieves external evidence for the model input; it does not inherently retrain model parameters.",
        "Every request retrains weights does not establish this requirement. RAG retrieves external evidence for the model input; it does not inherently retrain model parameters.",
        "Retrieval changes all model weights does not establish this requirement. RAG retrieves external evidence for the model input; it does not inherently retrain model parameters.",
        "Document storage is unnecessary does not establish this requirement. RAG retrieves external evidence for the model input; it does not inherently retrain model parameters."
      ],
      [
        "A museum loads scanned catalogs whose OCR omits the currency column. What should be repaired first?",
        "Extraction quality",
        "The final answer's font",
        "The user's login name",
        "The generator's verbosity",
        "The necessary meaning is lost before retrieval or generation, so extraction needs correction.",
        "The final answer's font does not establish this requirement. The necessary meaning is lost before retrieval or generation, so extraction needs correction.",
        "The user's login name does not establish this requirement. The necessary meaning is lost before retrieval or generation, so extraction needs correction.",
        "The generator's verbosity does not establish this requirement. The necessary meaning is lost before retrieval or generation, so extraction needs correction."
      ],
      [
        "A payroll team indexes a document with no trusted owner label. What is appropriate?",
        "Quarantine before eligibility",
        "Assign public access by default",
        "Infer the tenant from vector score",
        "Use the filename as permission",
        "Private retrieval requires validated access metadata rather than permissive guesses.",
        "Assign public access by default does not establish this requirement. Private retrieval requires validated access metadata rather than permissive guesses.",
        "Infer the tenant from vector score does not establish this requirement. Private retrieval requires validated access metadata rather than permissive guesses.",
        "Use the filename as permission does not establish this requirement. Private retrieval requires validated access metadata rather than permissive guesses."
      ],
      [
        "A parser returns text from one revision and a page locator from another. What invariant is broken?",
        "Consistent provenance",
        "A guaranteed embedding dimension",
        "A required model temperature",
        "A mandatory lexical rank",
        "Evidence text and its attribution must identify the same actual source state.",
        "A guaranteed embedding dimension does not establish this requirement. Evidence text and its attribution must identify the same actual source state.",
        "A required model temperature does not establish this requirement. Evidence text and its attribution must identify the same actual source state.",
        "A mandatory lexical rank does not establish this requirement. Evidence text and its attribution must identify the same actual source state."
      ],
      [
        "A policy ingestion retry creates fresh random chunk ids each time. What is a likely failure?",
        "Duplicate derived records",
        "Automatic semantic deduplication",
        "Guaranteed current permissions",
        "A reduced source count",
        "Without stable identities or reconciliation, repeated writes can multiply searchable records.",
        "Automatic semantic deduplication does not establish this requirement. Without stable identities or reconciliation, repeated writes can multiply searchable records.",
        "Guaranteed current permissions does not establish this requirement. Without stable identities or reconciliation, repeated writes can multiply searchable records.",
        "A reduced source count does not establish this requirement. Without stable identities or reconciliation, repeated writes can multiply searchable records."
      ],
      [
        "A handbook contains an exception in the paragraph after the main rule. What should chunk design preserve?",
        "Useful qualifying context",
        "Only the first sentence always",
        "Only the longest keyword list",
        "Only punctuation-free text",
        "A useful evidence unit retains conditions and exceptions needed to interpret the rule correctly.",
        "Only the first sentence always does not establish this requirement. A useful evidence unit retains conditions and exceptions needed to interpret the rule correctly.",
        "Only the longest keyword list does not establish this requirement. A useful evidence unit retains conditions and exceptions needed to interpret the rule correctly.",
        "Only punctuation-free text does not establish this requirement. A useful evidence unit retains conditions and exceptions needed to interpret the rule correctly."
      ],
      [
        "A pipeline reports one thousand accepted records but never checks expected source coverage. What remains unknown?",
        "Which sources are missing",
        "Whether a counter exists",
        "Whether records have ids",
        "Whether Python can print integers",
        "Total records can conceal duplication and missing source populations, so coverage needs explicit reconciliation.",
        "Whether a counter exists does not establish this requirement. Total records can conceal duplication and missing source populations, so coverage needs explicit reconciliation.",
        "Whether records have ids does not establish this requirement. Total records can conceal duplication and missing source populations, so coverage needs explicit reconciliation.",
        "Whether Python can print integers does not establish this requirement. Total records can conceal duplication and missing source populations, so coverage needs explicit reconciliation."
      ],
      [
        "A legal assistant must trace an answer back to an exact approved excerpt. Which handoff is strongest?",
        "Versioned source locations",
        "Bare vectors without text linkage",
        "Generated source titles only",
        "An answer confidence adjective",
        "Evidence lineage requires identifiers and locations tied to the actual source version, not generated attribution.",
        "Bare vectors without text linkage does not establish this requirement. Evidence lineage requires identifiers and locations tied to the actual source version, not generated attribution.",
        "Generated source titles only does not establish this requirement. Evidence lineage requires identifiers and locations tied to the actual source version, not generated attribution.",
        "An answer confidence adjective does not establish this requirement. Evidence lineage requires identifiers and locations tied to the actual source version, not generated attribution."
      ]
    ]
  },
  {
    "comp": "m1.c1",
    "rows": [
      [
        "What must precede private evidence disclosure?",
        "Trusted access enforcement",
        "An attractive citation badge",
        "A high similarity score",
        "A long answer prompt",
        "Authorization determines which evidence may be exposed independently of retrieval similarity.",
        "An attractive citation badge does not establish this requirement. Authorization determines which evidence may be exposed independently of retrieval similarity.",
        "A high similarity score does not establish this requirement. Authorization determines which evidence may be exposed independently of retrieval similarity.",
        "A long answer prompt does not establish this requirement. Authorization determines which evidence may be exposed independently of retrieval similarity."
      ],
      [
        "What does top-k ranking mean by itself?",
        "Relative ordering of candidates",
        "Guaranteed factual answerability",
        "Current source authority",
        "Permission to reveal every result",
        "Ranking identifies candidates under a retrieval method and does not establish evidence sufficiency or rights.",
        "Guaranteed factual answerability does not establish this requirement. Ranking identifies candidates under a retrieval method and does not establish evidence sufficiency or rights.",
        "Current source authority does not establish this requirement. Ranking identifies candidates under a retrieval method and does not establish evidence sufficiency or rights.",
        "Permission to reveal every result does not establish this requirement. Ranking identifies candidates under a retrieval method and does not establish evidence sufficiency or rights."
      ],
      [
        "What helps diagnose loss between retrieval and generation?",
        "Candidate and packed evidence ids",
        "Only response character count",
        "Only the model's public name",
        "Only the browser window size",
        "Stage identifiers show which retrieved evidence actually survived into the model input.",
        "Only response character count does not establish this requirement. Stage identifiers show which retrieved evidence actually survived into the model input.",
        "Only the model's public name does not establish this requirement. Stage identifiers show which retrieved evidence actually survived into the model input.",
        "Only the browser window size does not establish this requirement. Stage identifiers show which retrieved evidence actually survived into the model input."
      ],
      [
        "A support query for current returns retrieves a superseded rule. What needs evaluation?",
        "Applicability and freshness",
        "Only citation punctuation",
        "Only the final paragraph length",
        "Only tokenizer vocabulary size",
        "Semantic similarity alone does not establish that a source is current and applicable.",
        "Only citation punctuation does not establish this requirement. Semantic similarity alone does not establish that a source is current and applicable.",
        "Only the final paragraph length does not establish this requirement. Semantic similarity alone does not establish that a source is current and applicable.",
        "Only tokenizer vocabulary size does not establish this requirement. Semantic similarity alone does not establish that a source is current and applicable."
      ],
      [
        "A tenant A user submits tenant B in the question text. How should scope be chosen?",
        "From authenticated policy",
        "From the user's asserted tenant",
        "From the best-matching document",
        "From the model's guessed role",
        "User-controlled text cannot grant access to another tenant's evidence.",
        "From the user's asserted tenant does not establish this requirement. User-controlled text cannot grant access to another tenant's evidence.",
        "From the best-matching document does not establish this requirement. User-controlled text cannot grant access to another tenant's evidence.",
        "From the model's guessed role does not establish this requirement. User-controlled text cannot grant access to another tenant's evidence."
      ],
      [
        "A query vector uses a new model while documents use an unrelated old model of equal dimension. What is the issue?",
        "Representation incompatibility",
        "A proven permission failure",
        "An automatic source deletion",
        "A harmless visual difference",
        "Equal shape does not establish alignment between learned embedding spaces.",
        "A proven permission failure does not establish this requirement. Equal shape does not establish alignment between learned embedding spaces.",
        "An automatic source deletion does not establish this requirement. Equal shape does not establish alignment between learned embedding spaces.",
        "A harmless visual difference does not establish this requirement. Equal shape does not establish alignment between learned embedding spaces."
      ],
      [
        "A citation pack drops ids but retains paragraph text. What becomes harder?",
        "Reliable source attribution",
        "Counting letters in text",
        "Sending a request at all",
        "Formatting a plain sentence",
        "Without stable source labels, the answer cannot reliably map claims back to the evidence supplied.",
        "Counting letters in text does not establish this requirement. Without stable source labels, the answer cannot reliably map claims back to the evidence supplied.",
        "Sending a request at all does not establish this requirement. Without stable source labels, the answer cannot reliably map claims back to the evidence supplied.",
        "Formatting a plain sentence does not establish this requirement. Without stable source labels, the answer cannot reliably map claims back to the evidence supplied."
      ],
      [
        "A trace records ids and stage statuses instead of all private excerpts. Why can this help?",
        "Debugging with less exposure",
        "It proves every answer true",
        "It removes all access requirements",
        "It guarantees exact ANN search",
        "Minimal protected traces can support stage investigation while reducing unnecessary private text retention.",
        "It proves every answer true does not establish this requirement. Minimal protected traces can support stage investigation while reducing unnecessary private text retention.",
        "It removes all access requirements does not establish this requirement. Minimal protected traces can support stage investigation while reducing unnecessary private text retention.",
        "It guarantees exact ANN search does not establish this requirement. Minimal protected traces can support stage investigation while reducing unnecessary private text retention."
      ],
      [
        "A retriever returns ten high-scoring passages, none discussing the requested fee. What follows?",
        "Evidence may be insufficient",
        "The first score proves the fee",
        "The fee must equal zero",
        "The model should choose any amount",
        "A nonempty ranked list can lack support for the requested fact, so answerability must be checked separately.",
        "The first score proves the fee does not establish this requirement. A nonempty ranked list can lack support for the requested fact, so answerability must be checked separately.",
        "The fee must equal zero does not establish this requirement. A nonempty ranked list can lack support for the requested fact, so answerability must be checked separately.",
        "The model should choose any amount does not establish this requirement. A nonempty ranked list can lack support for the requested fact, so answerability must be checked separately."
      ],
      [
        "A team tests lexical overlap code and announces semantic vector quality. What is missing?",
        "Actual semantic retrieval tests",
        "The lexical intersection result",
        "The local synthetic record ids",
        "The printed output ordering",
        "An overlap fixture can illustrate data flow without implementing or evaluating embedding-based retrieval.",
        "The lexical intersection result does not establish this requirement. An overlap fixture can illustrate data flow without implementing or evaluating embedding-based retrieval.",
        "The local synthetic record ids does not establish this requirement. An overlap fixture can illustrate data flow without implementing or evaluating embedding-based retrieval.",
        "The printed output ordering does not establish this requirement. An overlap fixture can illustrate data flow without implementing or evaluating embedding-based retrieval."
      ]
    ]
  },
  {
    "comp": "m1.c2",
    "rows": [
      [
        "What should a context-grounded prompt specify?",
        "Use evidence and cite supported claims",
        "Invent missing facts when needed",
        "Trust retrieved text as system policy",
        "Ignore source qualifications",
        "An evidence contract makes support, attribution and insufficient-context behavior explicit.",
        "Invent missing facts when needed does not establish this requirement. An evidence contract makes support, attribution and insufficient-context behavior explicit.",
        "Trust retrieved text as system policy does not establish this requirement. An evidence contract makes support, attribution and insufficient-context behavior explicit.",
        "Ignore source qualifications does not establish this requirement. An evidence contract makes support, attribution and insufficient-context behavior explicit."
      ],
      [
        "What does citation membership check directly?",
        "Whether an id was supplied",
        "Whether every claim is entailed",
        "Whether access lasts forever",
        "Whether the source is current",
        "A supplied-id check validates reference structure only; support, currency and access require other checks.",
        "Whether every claim is entailed does not establish this requirement. A supplied-id check validates reference structure only; support, currency and access require other checks.",
        "Whether access lasts forever does not establish this requirement. A supplied-id check validates reference structure only; support, currency and access require other checks.",
        "Whether the source is current does not establish this requirement. A supplied-id check validates reference structure only; support, currency and access require other checks."
      ],
      [
        "What is retrieved imperative text in a RAG prompt?",
        "Untrusted evidence content",
        "An automatic policy override",
        "A permanent access capability",
        "A new developer instruction",
        "Retrieved material remains data and cannot change the application's trusted instruction or access hierarchy.",
        "An automatic policy override does not establish this requirement. Retrieved material remains data and cannot change the application's trusted instruction or access hierarchy.",
        "A permanent access capability does not establish this requirement. Retrieved material remains data and cannot change the application's trusted instruction or access hierarchy.",
        "A new developer instruction does not establish this requirement. Retrieved material remains data and cannot change the application's trusted instruction or access hierarchy."
      ],
      [
        "A warranty answer cites e8 when the prompt contained only e2 and e4. What should validation flag?",
        "An unknown evidence reference",
        "A verified current warranty",
        "An authorized hidden source",
        "A guaranteed tokenizer failure",
        "The application can reject citations outside the actual permitted supplied evidence set.",
        "A verified current warranty does not establish this requirement. The application can reject citations outside the actual permitted supplied evidence set.",
        "An authorized hidden source does not establish this requirement. The application can reject citations outside the actual permitted supplied evidence set.",
        "A guaranteed tokenizer failure does not establish this requirement. The application can reject citations outside the actual permitted supplied evidence set."
      ],
      [
        "A passage says repairs are covered only with approval, but context packing drops the condition. What has happened?",
        "Meaning-changing truncation",
        "A harmless style conversion",
        "A successful authority check",
        "A representation migration",
        "Removing a condition can turn a qualified policy into misleading evidence.",
        "A harmless style conversion does not establish this requirement. Removing a condition can turn a qualified policy into misleading evidence.",
        "A successful authority check does not establish this requirement. Removing a condition can turn a qualified policy into misleading evidence.",
        "A representation migration does not establish this requirement. Removing a condition can turn a qualified policy into misleading evidence."
      ],
      [
        "A context budget fills the entire model limit with excerpts. What is overlooked?",
        "Request and output budget",
        "Only source filename bytes",
        "Only the ANN build setting",
        "Only the page count label",
        "The complete request and response contract needs appropriate budget, not just document body text.",
        "Only source filename bytes does not establish this requirement. The complete request and response contract needs appropriate budget, not just document body text.",
        "Only the ANN build setting does not establish this requirement. The complete request and response contract needs appropriate budget, not just document body text.",
        "Only the page count label does not establish this requirement. The complete request and response contract needs appropriate budget, not just document body text."
      ],
      [
        "An answer cites a real supplied page that contradicts its claim. Which check is still needed?",
        "Claim-to-evidence support",
        "Only citation id spelling",
        "Only the source title length",
        "Only a lower temperature",
        "A valid reference can be attached to unsupported prose; entailment needs distinct evaluation.",
        "Only citation id spelling does not establish this requirement. A valid reference can be attached to unsupported prose; entailment needs distinct evaluation.",
        "Only the source title length does not establish this requirement. A valid reference can be attached to unsupported prose; entailment needs distinct evaluation.",
        "Only a lower temperature does not establish this requirement. A valid reference can be attached to unsupported prose; entailment needs distinct evaluation."
      ],
      [
        "A malicious source asks the model to fetch a private file from another tenant. Which boundary must hold?",
        "Application retrieval permissions",
        "Obedience to source imperatives",
        "A larger output token budget",
        "A prettier citation card",
        "Untrusted source content cannot grant tool or retrieval permissions beyond the current user's authorized scope.",
        "Obedience to source imperatives does not establish this requirement. Untrusted source content cannot grant tool or retrieval permissions beyond the current user's authorized scope.",
        "A larger output token budget does not establish this requirement. Untrusted source content cannot grant tool or retrieval permissions beyond the current user's authorized scope.",
        "A prettier citation card does not establish this requirement. Untrusted source content cannot grant tool or retrieval permissions beyond the current user's authorized scope."
      ],
      [
        "A user clicks a valid citation after their source access is revoked. What must the resolver do?",
        "Check current authorization",
        "Treat old citation as permanent access",
        "Trust the model's last answer",
        "Grant rights from source popularity",
        "Citation resolution is a disclosure route and must honor current access policy.",
        "Treat old citation as permanent access does not establish this requirement. Citation resolution is a disclosure route and must honor current access policy.",
        "Trust the model's last answer does not establish this requirement. Citation resolution is a disclosure route and must honor current access policy.",
        "Grant rights from source popularity does not establish this requirement. Citation resolution is a disclosure route and must honor current access policy."
      ],
      [
        "A prompt requests only context-supported answers but no output checks exist. What remains necessary?",
        "Measured grounding and validation",
        "Assuming instructions always succeed",
        "Publishing every fluent answer",
        "Equating confidence with truth",
        "Prompt instructions guide behavior but do not prove faithful output; validation and evaluation remain necessary.",
        "Assuming instructions always succeed does not establish this requirement. Prompt instructions guide behavior but do not prove faithful output; validation and evaluation remain necessary.",
        "Publishing every fluent answer does not establish this requirement. Prompt instructions guide behavior but do not prove faithful output; validation and evaluation remain necessary.",
        "Equating confidence with truth does not establish this requirement. Prompt instructions guide behavior but do not prove faithful output; validation and evaluation remain necessary."
      ]
    ]
  },
  {
    "comp": "m2.c1",
    "rows": [
      [
        "What is the first diagnostic question for a wrong evidence-bound answer?",
        "Was sufficient evidence supplied?",
        "Was the answer visually polished?",
        "Was the model's name recent?",
        "Was the response very long?",
        "The evidence received by generation distinguishes upstream absence from downstream misuse.",
        "Was the answer visually polished? does not establish this requirement. The evidence received by generation distinguishes upstream absence from downstream misuse.",
        "Was the model's name recent? does not establish this requirement. The evidence received by generation distinguishes upstream absence from downstream misuse.",
        "Was the response very long? does not establish this requirement. The evidence received by generation distinguishes upstream absence from downstream misuse."
      ],
      [
        "What is a context-packing failure?",
        "Evidence lost in packing",
        "A source never existed",
        "The model changed its weights",
        "A user acquired a new role",
        "Packing can lose evidence after retrieval succeeded, leaving generation without required information.",
        "A source never existed does not establish this requirement. Packing can lose evidence after retrieval succeeded, leaving generation without required information.",
        "The model changed its weights does not establish this requirement. Packing can lose evidence after retrieval succeeded, leaving generation without required information.",
        "A user acquired a new role does not establish this requirement. Packing can lose evidence after retrieval succeeded, leaving generation without required information."
      ],
      [
        "What does golden-context intervention hold fixed?",
        "Reviewed sufficient evidence",
        "Every future source update",
        "Every user's permission",
        "All production traffic",
        "Supplying known adequate context helps isolate generation behavior for a controlled question.",
        "Every future source update does not establish this requirement. Supplying known adequate context helps isolate generation behavior for a controlled question.",
        "Every user's permission does not establish this requirement. Supplying known adequate context helps isolate generation behavior for a controlled question.",
        "All production traffic does not establish this requirement. Supplying known adequate context helps isolate generation behavior for a controlled question."
      ],
      [
        "A correct policy is absent from the index because its import failed. What should be repaired?",
        "Ingestion and coverage",
        "Only the final answer wording",
        "Only citation colors",
        "Only decoding temperature",
        "The source cannot be retrieved until the upstream import and derived coverage are corrected.",
        "Only the final answer wording does not establish this requirement. The source cannot be retrieved until the upstream import and derived coverage are corrected.",
        "Only citation colors does not establish this requirement. The source cannot be retrieved until the upstream import and derived coverage are corrected.",
        "Only decoding temperature does not establish this requirement. The source cannot be retrieved until the upstream import and derived coverage are corrected."
      ],
      [
        "A deadline chunk is indexed but never returned for its labeled question. What needs investigation?",
        "Retrieval behavior",
        "Only response line breaks",
        "Only source ownership naming",
        "Only the answer animation",
        "The observed loss is between indexed availability and candidate recovery for that case.",
        "Only response line breaks does not establish this requirement. The observed loss is between indexed availability and candidate recovery for that case.",
        "Only source ownership naming does not establish this requirement. The observed loss is between indexed availability and candidate recovery for that case.",
        "Only the answer animation does not establish this requirement. The observed loss is between indexed availability and candidate recovery for that case."
      ],
      [
        "A correct paragraph reaches the model but the output states the opposite rule. What is implicated?",
        "Generation or interpretation",
        "Missing index coverage is proven",
        "The source does not exist",
        "The user's tenant must be wrong",
        "Adequate supplied evidence shifts the case investigation toward how generation uses it.",
        "Missing index coverage is proven does not establish this requirement. Adequate supplied evidence shifts the case investigation toward how generation uses it.",
        "The source does not exist does not establish this requirement. Adequate supplied evidence shifts the case investigation toward how generation uses it.",
        "The user's tenant must be wrong does not establish this requirement. Adequate supplied evidence shifts the case investigation toward how generation uses it."
      ],
      [
        "A trace contains retrieved ids but not the final packed context ids. What uncertainty remains?",
        "Final model-input evidence",
        "Whether retrieval ran at all",
        "Whether the ids were strings",
        "Whether the server had a clock",
        "Retrieval output is not the same as the actual model input after selection and budgeting.",
        "Whether retrieval ran at all does not establish this requirement. Retrieval output is not the same as the actual model input after selection and budgeting.",
        "Whether the ids were strings does not establish this requirement. Retrieval output is not the same as the actual model input after selection and budgeting.",
        "Whether the server had a clock does not establish this requirement. Retrieval output is not the same as the actual model input after selection and budgeting."
      ],
      [
        "A golden-context test fixes one question. What can be concluded?",
        "Local evidence of an upstream issue",
        "Universal retrieval correctness",
        "Permanent elimination of hallucination",
        "Automatic educational approval",
        "A controlled success helps diagnose that case without proving all queries or future behavior.",
        "Universal retrieval correctness does not establish this requirement. A controlled success helps diagnose that case without proving all queries or future behavior.",
        "Permanent elimination of hallucination does not establish this requirement. A controlled success helps diagnose that case without proving all queries or future behavior.",
        "Automatic educational approval does not establish this requirement. A controlled success helps diagnose that case without proving all queries or future behavior."
      ],
      [
        "A team changes retriever, prompt and generator together and quality improves. What is hard to identify?",
        "Which change caused improvement",
        "Whether any output was produced",
        "Whether the software had files",
        "Whether a question was asked",
        "Simultaneous interventions confound causal diagnosis; controlled comparisons help attribute effects.",
        "Whether any output was produced does not establish this requirement. Simultaneous interventions confound causal diagnosis; controlled comparisons help attribute effects.",
        "Whether the software had files does not establish this requirement. Simultaneous interventions confound causal diagnosis; controlled comparisons help attribute effects.",
        "Whether a question was asked does not establish this requirement. Simultaneous interventions confound causal diagnosis; controlled comparisons help attribute effects."
      ],
      [
        "A multilingual segment fails while aggregate answer quality rises. What should diagnosis preserve?",
        "Segment-level evidence and labels",
        "Only the overall mean",
        "Only the model's public benchmark",
        "Only successful English examples",
        "Aggregate metrics can conceal meaningful subgroup failures requiring targeted evidence-path inspection.",
        "Only the overall mean does not establish this requirement. Aggregate metrics can conceal meaningful subgroup failures requiring targeted evidence-path inspection.",
        "Only the model's public benchmark does not establish this requirement. Aggregate metrics can conceal meaningful subgroup failures requiring targeted evidence-path inspection.",
        "Only successful English examples does not establish this requirement. Aggregate metrics can conceal meaningful subgroup failures requiring targeted evidence-path inspection."
      ]
    ]
  },
  {
    "comp": "m2.c1",
    "rows": [
      [
        "What is answer faithfulness relative to supplied context?",
        "Support for generated claims",
        "The answer's token count",
        "Exact copying of all text",
        "The model's release date",
        "Faithfulness assesses whether generated claims are supported, allowing accurate paraphrase.",
        "The answer's token count does not establish this requirement. Faithfulness assesses whether generated claims are supported, allowing accurate paraphrase.",
        "Exact copying of all text does not establish this requirement. Faithfulness assesses whether generated claims are supported, allowing accurate paraphrase.",
        "The model's release date does not establish this requirement. Faithfulness assesses whether generated claims are supported, allowing accurate paraphrase."
      ],
      [
        "What is answer relevance distinct from faithfulness?",
        "Whether it addresses the question",
        "Whether citations have ids",
        "Whether words are grammatical",
        "Whether source text is long",
        "A faithful statement can still be unhelpful if it does not answer the actual question.",
        "Whether citations have ids does not establish this requirement. A faithful statement can still be unhelpful if it does not answer the actual question.",
        "Whether words are grammatical does not establish this requirement. A faithful statement can still be unhelpful if it does not answer the actual question.",
        "Whether source text is long does not establish this requirement. A faithful statement can still be unhelpful if it does not answer the actual question."
      ],
      [
        "What should a faithful paraphrase retain?",
        "Meaning and qualifiers",
        "Every line break exactly",
        "Every original typo",
        "Only the first noun",
        "Preserving factual meaning requires retaining qualifications rather than merely reusing source vocabulary.",
        "Every line break exactly does not establish this requirement. Preserving factual meaning requires retaining qualifications rather than merely reusing source vocabulary.",
        "Every original typo does not establish this requirement. Preserving factual meaning requires retaining qualifications rather than merely reusing source vocabulary.",
        "Only the first noun does not establish this requirement. Preserving factual meaning requires retaining qualifications rather than merely reusing source vocabulary."
      ],
      [
        "A source says approval may take five days and the answer guarantees tomorrow. What is unsupported?",
        "The stronger promise",
        "The existence of an approval process",
        "The fact that time is mentioned",
        "The presence of a cited passage",
        "A qualified duration does not entail a stronger guaranteed completion date.",
        "The existence of an approval process does not establish this requirement. A qualified duration does not entail a stronger guaranteed completion date.",
        "The fact that time is mentioned does not establish this requirement. A qualified duration does not entail a stronger guaranteed completion date.",
        "The presence of a cited passage does not establish this requirement. A qualified duration does not entail a stronger guaranteed completion date."
      ],
      [
        "A return-policy answer quotes accurate shipping fees instead. Which dimension failed?",
        "Question relevance",
        "Source attribution necessarily",
        "Text faithfulness necessarily",
        "All ingestion necessarily",
        "Accurate source text about a different issue does not satisfy the user's information need.",
        "Source attribution necessarily does not establish this requirement. Accurate source text about a different issue does not satisfy the user's information need.",
        "Text faithfulness necessarily does not establish this requirement. Accurate source text about a different issue does not satisfy the user's information need.",
        "All ingestion necessarily does not establish this requirement. Accurate source text about a different issue does not satisfy the user's information need."
      ],
      [
        "Two approved current sources conflict and no precedence rule exists. What is appropriate?",
        "Expose or escalate the conflict",
        "Average their monetary limits",
        "Choose the shortest text",
        "Pick the most fluent wording",
        "A silent arbitrary resolution would invent authority that the evidence does not establish.",
        "Average their monetary limits does not establish this requirement. A silent arbitrary resolution would invent authority that the evidence does not establish.",
        "Choose the shortest text does not establish this requirement. A silent arbitrary resolution would invent authority that the evidence does not establish.",
        "Pick the most fluent wording does not establish this requirement. A silent arbitrary resolution would invent authority that the evidence does not establish."
      ],
      [
        "A question asks for fees and eligibility, but only fees are supported. What is defensible?",
        "A bounded partial answer",
        "Invented eligibility details",
        "Claiming the whole question is answered",
        "Discarding all fee evidence",
        "Supported parts may be answered while the unsupported remainder is identified clearly.",
        "Invented eligibility details does not establish this requirement. Supported parts may be answered while the unsupported remainder is identified clearly.",
        "Claiming the whole question is answered does not establish this requirement. Supported parts may be answered while the unsupported remainder is identified clearly.",
        "Discarding all fee evidence does not establish this requirement. Supported parts may be answered while the unsupported remainder is identified clearly."
      ],
      [
        "A claim rubric counts a qualifying clause as separate from its main claim. What must reviewers align?",
        "Claim decomposition",
        "Only the response font",
        "Only the source order",
        "Only the vector dimensions",
        "Support metrics depend on consistent definitions of claims and partial support across reviewed cases.",
        "Only the response font does not establish this requirement. Support metrics depend on consistent definitions of claims and partial support across reviewed cases.",
        "Only the source order does not establish this requirement. Support metrics depend on consistent definitions of claims and partial support across reviewed cases.",
        "Only the vector dimensions does not establish this requirement. Support metrics depend on consistent definitions of claims and partial support across reviewed cases."
      ],
      [
        "An automated judge labels unsupported claims as correct because they sound plausible. What evidence is needed?",
        "Calibration against reviewed labels",
        "Only repeated self-agreement",
        "Only a larger context limit",
        "Only another confidence adjective",
        "Independent reviewed cases reveal whether a judge follows the support rubric rather than fluency.",
        "Only repeated self-agreement does not establish this requirement. Independent reviewed cases reveal whether a judge follows the support rubric rather than fluency.",
        "Only a larger context limit does not establish this requirement. Independent reviewed cases reveal whether a judge follows the support rubric rather than fluency.",
        "Only another confidence adjective does not establish this requirement. Independent reviewed cases reveal whether a judge follows the support rubric rather than fluency."
      ],
      [
        "A release has high retrieval recall but low supported-claim rate. Which conclusion fits?",
        "Evidence recovery is insufficient alone",
        "Generation must be universally correct",
        "All source data must be deleted",
        "Increasing k guarantees the fix",
        "Finding evidence and using it faithfully are distinct stages with separate acceptance requirements.",
        "Generation must be universally correct does not establish this requirement. Finding evidence and using it faithfully are distinct stages with separate acceptance requirements.",
        "All source data must be deleted does not establish this requirement. Finding evidence and using it faithfully are distinct stages with separate acceptance requirements.",
        "Increasing k guarantees the fix does not establish this requirement. Finding evidence and using it faithfully are distinct stages with separate acceptance requirements."
      ]
    ]
  },
  {
    "comp": "m2.c2",
    "rows": [
      [
        "What is an appropriate evidence-bound abstention?",
        "Decline unsupported factual claims",
        "Pretend the question was answered",
        "Invent a likely source",
        "Expand private retrieval scope",
        "Abstention avoids unsupported assertion while making the evidence limitation clear.",
        "Pretend the question was answered does not establish this requirement. Abstention avoids unsupported assertion while making the evidence limitation clear.",
        "Invent a likely source does not establish this requirement. Abstention avoids unsupported assertion while making the evidence limitation clear.",
        "Expand private retrieval scope does not establish this requirement. Abstention avoids unsupported assertion while making the evidence limitation clear."
      ],
      [
        "What can an empty permitted result set establish directly?",
        "No evidence was returned",
        "The real-world fact is false",
        "No source exists anywhere",
        "The user has no question",
        "An empty result reports retrieval behavior in that scope, not universal absence or falsity.",
        "The real-world fact is false does not establish this requirement. An empty result reports retrieval behavior in that scope, not universal absence or falsity.",
        "No source exists anywhere does not establish this requirement. An empty result reports retrieval behavior in that scope, not universal absence or falsity.",
        "The user has no question does not establish this requirement. An empty result reports retrieval behavior in that scope, not universal absence or falsity."
      ],
      [
        "Why evaluate both answerable and unanswerable questions?",
        "Measure guesses and needless refusals",
        "Only maximize total token count",
        "Only test source filename formats",
        "Only validate account spelling",
        "A no-answer policy must balance unsupported answers against unnecessary abstention on answerable cases.",
        "Only maximize total token count does not establish this requirement. A no-answer policy must balance unsupported answers against unnecessary abstention on answerable cases.",
        "Only test source filename formats does not establish this requirement. A no-answer policy must balance unsupported answers against unnecessary abstention on answerable cases.",
        "Only validate account spelling does not establish this requirement. A no-answer policy must balance unsupported answers against unnecessary abstention on answerable cases."
      ],
      [
        "A mortgage assistant finds no source for a future rate. What should it avoid?",
        "Inventing the requested rate",
        "Stating the evidence limitation",
        "Offering an approved escalation",
        "Asking a scope clarification",
        "Absent support does not justify fabricating a plausible financial fact.",
        "Stating the evidence limitation does not establish this requirement. Absent support does not justify fabricating a plausible financial fact.",
        "Offering an approved escalation does not establish this requirement. Absent support does not justify fabricating a plausible financial fact.",
        "Asking a scope clarification does not establish this requirement. Absent support does not justify fabricating a plausible financial fact."
      ],
      [
        "The retrieval service times out. Which statement is defensible?",
        "Evidence check unavailable",
        "No relevant policy exists",
        "The customer owes no fees",
        "All policies are expired",
        "A failed check is not evidence that the underlying fact or policy does not exist.",
        "No relevant policy exists does not establish this requirement. A failed check is not evidence that the underlying fact or policy does not exist.",
        "The customer owes no fees does not establish this requirement. A failed check is not evidence that the underlying fact or policy does not exist.",
        "All policies are expired does not establish this requirement. A failed check is not evidence that the underlying fact or policy does not exist."
      ],
      [
        "A top-ranked passage has a large score but addresses a different product edition. What is needed?",
        "Applicability and support",
        "Automatic full-answer approval",
        "Immediate source publication",
        "A permanent permission grant",
        "Similarity is not calibrated proof that the passage supports the actual scoped question.",
        "Automatic full-answer approval does not establish this requirement. Similarity is not calibrated proof that the passage supports the actual scoped question.",
        "Immediate source publication does not establish this requirement. Similarity is not calibrated proof that the passage supports the actual scoped question.",
        "A permanent permission grant does not establish this requirement. Similarity is not calibrated proof that the passage supports the actual scoped question."
      ],
      [
        "A threshold change reduces false answers but doubles refusals on supported cases. What should be compared?",
        "The product's error tradeoff",
        "Only average citation length",
        "Only model parameter count",
        "Only vector index byte size",
        "Threshold acceptance should consider harmful guesses and lost valid answers on representative labeled cases.",
        "Only average citation length does not establish this requirement. Threshold acceptance should consider harmful guesses and lost valid answers on representative labeled cases.",
        "Only model parameter count does not establish this requirement. Threshold acceptance should consider harmful guesses and lost valid answers on representative labeled cases.",
        "Only vector index byte size does not establish this requirement. Threshold acceptance should consider harmful guesses and lost valid answers on representative labeled cases."
      ],
      [
        "A user omits the jurisdiction needed to choose among valid policies. What can improve answerability?",
        "A targeted clarification",
        "Guessing the largest jurisdiction",
        "Returning every private source",
        "Treating all rules as identical",
        "Clarifying the relevant scope can identify applicable evidence without inventing facts or expanding permissions.",
        "Guessing the largest jurisdiction does not establish this requirement. Clarifying the relevant scope can identify applicable evidence without inventing facts or expanding permissions.",
        "Returning every private source does not establish this requirement. Clarifying the relevant scope can identify applicable evidence without inventing facts or expanding permissions.",
        "Treating all rules as identical does not establish this requirement. Clarifying the relevant scope can identify applicable evidence without inventing facts or expanding permissions."
      ],
      [
        "A system treats every low score as a verified no-policy result. What is flawed?",
        "Scores are not absence proofs",
        "Low scores always mean truth",
        "Every corpus has the same scale",
        "No evaluation cases are needed",
        "Score thresholds are corpus- and model-dependent signals, not universal semantic or real-world absence guarantees.",
        "Low scores always mean truth does not establish this requirement. Score thresholds are corpus- and model-dependent signals, not universal semantic or real-world absence guarantees.",
        "Every corpus has the same scale does not establish this requirement. Score thresholds are corpus- and model-dependent signals, not universal semantic or real-world absence guarantees.",
        "No evaluation cases are needed does not establish this requirement. Score thresholds are corpus- and model-dependent signals, not universal semantic or real-world absence guarantees."
      ],
      [
        "A product needs useful responses during evidence outages. Which policy is strongest?",
        "Bounded recovery with truthful status",
        "Fabricate an answer after every timeout",
        "Search unauthorized tenants for backup",
        "Hide all failures as confirmed absence",
        "A safe fallback distinguishes unavailability, avoids unsupported facts and uses approved recovery or escalation behavior.",
        "Fabricate an answer after every timeout does not establish this requirement. A safe fallback distinguishes unavailability, avoids unsupported facts and uses approved recovery or escalation behavior.",
        "Search unauthorized tenants for backup does not establish this requirement. A safe fallback distinguishes unavailability, avoids unsupported facts and uses approved recovery or escalation behavior.",
        "Hide all failures as confirmed absence does not establish this requirement. A safe fallback distinguishes unavailability, avoids unsupported facts and uses approved recovery or escalation behavior."
      ]
    ]
  },
  {
    "comp": "m3.c1",
    "rows": [
      [
        "What does an index generation identify?",
        "A derived serving build",
        "A permanent user permission",
        "A model-generated source claim",
        "A browser theme choice",
        "A generation identifies the accepted derived representation and configuration serving retrieval.",
        "A permanent user permission does not establish this requirement. A generation identifies the accepted derived representation and configuration serving retrieval.",
        "A model-generated source claim does not establish this requirement. A generation identifies the accepted derived representation and configuration serving retrieval.",
        "A browser theme choice does not establish this requirement. A generation identifies the accepted derived representation and configuration serving retrieval."
      ],
      [
        "Is a document's effective date always its revision timestamp?",
        "No, applicability can differ",
        "Yes, dates are interchangeable",
        "Only when titles are short",
        "Only for scanned files",
        "When a policy applies can differ from when a document was revised or indexed.",
        "Yes, dates are interchangeable does not establish this requirement. When a policy applies can differ from when a document was revised or indexed.",
        "Only when titles are short does not establish this requirement. When a policy applies can differ from when a document was revised or indexed.",
        "Only for scanned files does not establish this requirement. When a policy applies can differ from when a document was revised or indexed."
      ],
      [
        "Why track source revisions in a manifest?",
        "Detect stale derived coverage",
        "Replace every support judgment",
        "Grant cross-tenant access",
        "Guarantee perfect embeddings",
        "A manifest supports comparison between intended source state and actual derived records.",
        "Replace every support judgment does not establish this requirement. A manifest supports comparison between intended source state and actual derived records.",
        "Grant cross-tenant access does not establish this requirement. A manifest supports comparison between intended source state and actual derived records.",
        "Guarantee perfect embeddings does not establish this requirement. A manifest supports comparison between intended source state and actual derived records."
      ],
      [
        "A policy source is revision 9 but its indexed chunk remains revision 8. What is observed?",
        "Stale derived evidence",
        "An automatic permission denial",
        "A guaranteed ANN failure",
        "A current source representation",
        "The stored representation does not reflect the declared current source revision.",
        "An automatic permission denial does not establish this requirement. The stored representation does not reflect the declared current source revision.",
        "A guaranteed ANN failure does not establish this requirement. The stored representation does not reflect the declared current source revision.",
        "A current source representation does not establish this requirement. The stored representation does not reflect the declared current source revision."
      ],
      [
        "An old revision finishes ingestion after the new revision. What should activation use?",
        "The accepted lifecycle state",
        "The last finishing job always",
        "The shortest paragraph always",
        "The highest chunk id always",
        "Completion order is not source authority; generation-aware rules prevent stale completion from regressing state.",
        "The last finishing job always does not establish this requirement. Completion order is not source authority; generation-aware rules prevent stale completion from regressing state.",
        "The shortest paragraph always does not establish this requirement. Completion order is not source authority; generation-aware rules prevent stale completion from regressing state.",
        "The highest chunk id always does not establish this requirement. Completion order is not source authority; generation-aware rules prevent stale completion from regressing state."
      ],
      [
        "A policy is revised today but takes effect next month. A user asks about today. What matters?",
        "The applicable effective interval",
        "Only the newest ingestion time",
        "Only the largest revision number",
        "Only the highest similarity score",
        "Current applicability must be determined by the policy dates and question scope rather than recency alone.",
        "Only the newest ingestion time does not establish this requirement. Current applicability must be determined by the policy dates and question scope rather than recency alone.",
        "Only the largest revision number does not establish this requirement. Current applicability must be determined by the policy dates and question scope rather than recency alone.",
        "Only the highest similarity score does not establish this requirement. Current applicability must be determined by the policy dates and question scope rather than recency alone."
      ],
      [
        "Two generations have equal record counts but different source revisions. What follows?",
        "Count equality does not prove freshness",
        "Both must be equivalent",
        "The older one is always correct",
        "All citations are invalid automatically",
        "Counts can match despite missing, duplicated or stale records, so version-aware checks are required.",
        "Both must be equivalent does not establish this requirement. Counts can match despite missing, duplicated or stale records, so version-aware checks are required.",
        "The older one is always correct does not establish this requirement. Counts can match despite missing, duplicated or stale records, so version-aware checks are required.",
        "All citations are invalid automatically does not establish this requirement. Counts can match despite missing, duplicated or stale records, so version-aware checks are required."
      ],
      [
        "A rebuild snapshot includes a source deleted during processing. What must activation respect?",
        "The current source lifecycle",
        "Only snapshot membership",
        "Only original filename spelling",
        "Only the embedding vector size",
        "A stale rebuild must not reintroduce evidence that current deletion or access policy excludes.",
        "Only snapshot membership does not establish this requirement. A stale rebuild must not reintroduce evidence that current deletion or access policy excludes.",
        "Only original filename spelling does not establish this requirement. A stale rebuild must not reintroduce evidence that current deletion or access policy excludes.",
        "Only the embedding vector size does not establish this requirement. A stale rebuild must not reintroduce evidence that current deletion or access policy excludes."
      ],
      [
        "A manifest comparison passes in Python. What remains unverified?",
        "Actual atomic activation",
        "The local map equality result",
        "The explicit expected keys",
        "The fixture's printed booleans",
        "A policy model does not exercise database transactions, concurrent workers or live route switching.",
        "The local map equality result does not establish this requirement. A policy model does not exercise database transactions, concurrent workers or live route switching.",
        "The explicit expected keys does not establish this requirement. A policy model does not exercise database transactions, concurrent workers or live route switching.",
        "The fixture's printed booleans does not establish this requirement. A policy model does not exercise database transactions, concurrent workers or live route switching."
      ],
      [
        "A system rebuilds unchanged documents under a new embedding model. Which version relationship is valid?",
        "New representation without a source edit",
        "Every source must be falsely revised",
        "All source dates become ingestion time",
        "Permissions can be inferred from model name",
        "Source state and derived representation are separate dimensions that must both be tracked.",
        "Every source must be falsely revised does not establish this requirement. Source state and derived representation are separate dimensions that must both be tracked.",
        "All source dates become ingestion time does not establish this requirement. Source state and derived representation are separate dimensions that must both be tracked.",
        "Permissions can be inferred from model name does not establish this requirement. Source state and derived representation are separate dimensions that must both be tracked."
      ]
    ]
  },
  {
    "comp": "m3.c1",
    "rows": [
      [
        "What can make a cached private answer stale without changing text?",
        "A permission change",
        "Only a new response color",
        "Only a shorter user nickname",
        "Only a different button label",
        "Authorization changes can invalidate reuse even when the source wording remains identical.",
        "Only a new response color does not establish this requirement. Authorization changes can invalidate reuse even when the source wording remains identical.",
        "Only a shorter user nickname does not establish this requirement. Authorization changes can invalidate reuse even when the source wording remains identical.",
        "Only a different button label does not establish this requirement. Authorization changes can invalidate reuse even when the source wording remains identical."
      ],
      [
        "What should a citation preserve for auditability?",
        "The actual evidence revision",
        "Permanent access for every reader",
        "Only the latest document text",
        "The model's guessed source name",
        "Attribution needs to identify the source state underlying the answer, with access handled separately.",
        "Permanent access for every reader does not establish this requirement. Attribution needs to identify the source state underlying the answer, with access handled separately.",
        "Only the latest document text does not establish this requirement. Attribution needs to identify the source state underlying the answer, with access handled separately.",
        "The model's guessed source name does not establish this requirement. Attribution needs to identify the source state underlying the answer, with access handled separately."
      ],
      [
        "What does a cache TTL guarantee by itself?",
        "A reuse expiration policy",
        "Immediate source synchronization",
        "Semantic support for every claim",
        "Authorization for every tenant",
        "TTL controls cache lifetime but does not establish immediate freshness, entailment or permissions.",
        "Immediate source synchronization does not establish this requirement. TTL controls cache lifetime but does not establish immediate freshness, entailment or permissions.",
        "Semantic support for every claim does not establish this requirement. TTL controls cache lifetime but does not establish immediate freshness, entailment or permissions.",
        "Authorization for every tenant does not establish this requirement. TTL controls cache lifetime but does not establish immediate freshness, entailment or permissions."
      ],
      [
        "A current index serves old answers from a separate cache. Which dependency is missing?",
        "Source-aware cache invalidation",
        "Only vector normalization",
        "Only a shorter system prompt",
        "Only a larger maximum k",
        "Index updates do not automatically update every derived answer; cache dependencies need lifecycle handling.",
        "Only vector normalization does not establish this requirement. Index updates do not automatically update every derived answer; cache dependencies need lifecycle handling.",
        "Only a shorter system prompt does not establish this requirement. Index updates do not automatically update every derived answer; cache dependencies need lifecycle handling.",
        "Only a larger maximum k does not establish this requirement. Index updates do not automatically update every derived answer; cache dependencies need lifecycle handling."
      ],
      [
        "A query-only cache shares an answer between two tenants. What is the problem?",
        "Scope-sensitive evidence reuse",
        "Every identical question is illegal",
        "All vectors must be public",
        "Only answer punctuation differs",
        "Identical query text can have different authorized evidence across principals, so reuse must enforce scope.",
        "Every identical question is illegal does not establish this requirement. Identical query text can have different authorized evidence across principals, so reuse must enforce scope.",
        "All vectors must be public does not establish this requirement. Identical query text can have different authorized evidence across principals, so reuse must enforce scope.",
        "Only answer punctuation differs does not establish this requirement. Identical query text can have different authorized evidence across principals, so reuse must enforce scope."
      ],
      [
        "An old citation silently resolves to a newer paragraph with a different fee. What is compromised?",
        "Historical source attribution",
        "Only request throughput",
        "Only vector metric direction",
        "Only tokenizer compatibility",
        "The reference no longer shows the evidence that supported the original claim, obscuring its provenance.",
        "Only request throughput does not establish this requirement. The reference no longer shows the evidence that supported the original claim, obscuring its provenance.",
        "Only vector metric direction does not establish this requirement. The reference no longer shows the evidence that supported the original claim, obscuring its provenance.",
        "Only tokenizer compatibility does not establish this requirement. The reference no longer shows the evidence that supported the original claim, obscuring its provenance."
      ],
      [
        "A user loses access after caching an answer. What should reuse verify?",
        "Current access eligibility",
        "Only its original cache hit",
        "Only its similarity score",
        "Only its original response length",
        "Past authorization does not automatically permit continued disclosure after rights change.",
        "Only its original cache hit does not establish this requirement. Past authorization does not automatically permit continued disclosure after rights change.",
        "Only its similarity score does not establish this requirement. Past authorization does not automatically permit continued disclosure after rights change.",
        "Only its original response length does not establish this requirement. Past authorization does not automatically permit continued disclosure after rights change."
      ],
      [
        "A source is removed from search but its detail URL still returns text. What is missing?",
        "Lifecycle control on detail access",
        "Only a higher retrieval threshold",
        "Only a new embedding model",
        "Only a cache hit counter",
        "Deletion and access policy must cover every disclosure route, including direct detail retrieval.",
        "Only a higher retrieval threshold does not establish this requirement. Deletion and access policy must cover every disclosure route, including direct detail retrieval.",
        "Only a new embedding model does not establish this requirement. Deletion and access policy must cover every disclosure route, including direct detail retrieval.",
        "Only a cache hit counter does not establish this requirement. Deletion and access policy must cover every disclosure route, including direct detail retrieval."
      ],
      [
        "A cache entry tracks one source revision but actually uses three sources. What is uncertain?",
        "Complete dependency freshness",
        "Whether the entry has any text",
        "Whether the revision is numeric",
        "Whether a timestamp was printed",
        "Freshness checks must represent the relevant dependencies; tracking only one source can miss other changed evidence.",
        "Whether the entry has any text does not establish this requirement. Freshness checks must represent the relevant dependencies; tracking only one source can miss other changed evidence.",
        "Whether the revision is numeric does not establish this requirement. Freshness checks must represent the relevant dependencies; tracking only one source can miss other changed evidence.",
        "Whether a timestamp was printed does not establish this requirement. Freshness checks must represent the relevant dependencies; tracking only one source can miss other changed evidence."
      ],
      [
        "A local fixture rejects mismatched scope versions. Which claim would overstate its proof?",
        "Live invalidation is verified",
        "The local comparison rejects that entry",
        "The fixture has supplied versions",
        "The printed boolean is reproducible",
        "An in-memory policy check does not test real identity resolution, distributed delivery or all cache paths.",
        "The local comparison rejects that entry does not establish this requirement. An in-memory policy check does not test real identity resolution, distributed delivery or all cache paths.",
        "The fixture has supplied versions does not establish this requirement. An in-memory policy check does not test real identity resolution, distributed delivery or all cache paths.",
        "The printed boolean is reproducible does not establish this requirement. An in-memory policy check does not test real identity resolution, distributed delivery or all cache paths."
      ]
    ]
  },
  {
    "comp": "m3.c1",
    "rows": [
      [
        "Which acceptance case directly tests a revised rule?",
        "A question whose answer changed",
        "Only an unchanged welcome message",
        "Only a record count comparison",
        "Only the index process name",
        "Changed-answer cases expose old evidence and stale cached results after a source update.",
        "Only an unchanged welcome message does not establish this requirement. Changed-answer cases expose old evidence and stale cached results after a source update.",
        "Only a record count comparison does not establish this requirement. Changed-answer cases expose old evidence and stale cached results after a source update.",
        "Only the index process name does not establish this requirement. Changed-answer cases expose old evidence and stale cached results after a source update."
      ],
      [
        "Why include deleted-source cases in freshness tests?",
        "Detect retired evidence exposure",
        "Only increase question length",
        "Only test prompt punctuation",
        "Only measure vector dimensions",
        "Negative lifecycle cases test that retired data is absent from every relevant serving route.",
        "Only increase question length does not establish this requirement. Negative lifecycle cases test that retired data is absent from every relevant serving route.",
        "Only test prompt punctuation does not establish this requirement. Negative lifecycle cases test that retired data is absent from every relevant serving route.",
        "Only measure vector dimensions does not establish this requirement. Negative lifecycle cases test that retired data is absent from every relevant serving route."
      ],
      [
        "What status follows an automated curriculum fixture pass?",
        "Technically checked draft",
        "Human approval completed",
        "Production publication completed",
        "Every model behavior proven",
        "Automated checks provide bounded technical evidence and do not constitute human review or publication.",
        "Human approval completed does not establish this requirement. Automated checks provide bounded technical evidence and do not constitute human review or publication.",
        "Production publication completed does not establish this requirement. Automated checks provide bounded technical evidence and do not constitute human review or publication.",
        "Every model behavior proven does not establish this requirement. Automated checks provide bounded technical evidence and do not constitute human review or publication."
      ],
      [
        "A new generation passes positive lookups but exposes a revoked user's cached excerpt. What failed?",
        "Access-aware lifecycle acceptance",
        "Only the vector distance function",
        "Only the source word count",
        "Only the answer character limit",
        "Positive retrieval tests are insufficient when secondary paths still disclose evidence under obsolete permissions.",
        "Only the vector distance function does not establish this requirement. Positive retrieval tests are insufficient when secondary paths still disclose evidence under obsolete permissions.",
        "Only the source word count does not establish this requirement. Positive retrieval tests are insufficient when secondary paths still disclose evidence under obsolete permissions.",
        "Only the answer character limit does not establish this requirement. Positive retrieval tests are insufficient when secondary paths still disclose evidence under obsolete permissions."
      ],
      [
        "A rollback returns to last week's index after a source deletion. What must it preserve?",
        "Current deletion and access rules",
        "Last week's permissions forever",
        "Only the old vector count",
        "Only the prior dashboard label",
        "Recovery must not resurrect data that current lifecycle policy forbids serving.",
        "Last week's permissions forever does not establish this requirement. Recovery must not resurrect data that current lifecycle policy forbids serving.",
        "Only the old vector count does not establish this requirement. Recovery must not resurrect data that current lifecycle policy forbids serving.",
        "Only the prior dashboard label does not establish this requirement. Recovery must not resurrect data that current lifecycle policy forbids serving."
      ],
      [
        "A future-effective policy outranks the current rule. What should selection consider?",
        "Applicable question date",
        "Only the ranking position",
        "Only revision number size",
        "Only source title length",
        "The newest or nearest passage need not be applicable at the user's requested time.",
        "Only the ranking position does not establish this requirement. The newest or nearest passage need not be applicable at the user's requested time.",
        "Only revision number size does not establish this requirement. The newest or nearest passage need not be applicable at the user's requested time.",
        "Only source title length does not establish this requirement. The newest or nearest passage need not be applicable at the user's requested time."
      ],
      [
        "A release gate checks only that ingestion jobs exited successfully. What is missing?",
        "Serving and coverage checks",
        "Only another success message",
        "Only a longer job name",
        "Only a larger process id",
        "A success status does not establish correct versions, exposure behavior or answer support in the actual serving path.",
        "Only another success message does not establish this requirement. A success status does not establish correct versions, exposure behavior or answer support in the actual serving path.",
        "Only a longer job name does not establish this requirement. A success status does not establish correct versions, exposure behavior or answer support in the actual serving path.",
        "Only a larger process id does not establish this requirement. A success status does not establish correct versions, exposure behavior or answer support in the actual serving path."
      ],
      [
        "A regression table uses hand-entered observed values. What does it validate?",
        "The comparison policy",
        "Real provider generation quality",
        "Production index activation",
        "A live access-control service",
        "Synthetic observations test the rule applied to them, not the external systems that would produce real observations.",
        "Real provider generation quality does not establish this requirement. Synthetic observations test the rule applied to them, not the external systems that would produce real observations.",
        "Production index activation does not establish this requirement. Synthetic observations test the rule applied to them, not the external systems that would produce real observations.",
        "A live access-control service does not establish this requirement. Synthetic observations test the rule applied to them, not the external systems that would produce real observations."
      ],
      [
        "A changed-answer test passes but a citation opens the wrong revision. What should acceptance record?",
        "An attribution regression",
        "A complete technical success",
        "A harmless guaranteed equivalent",
        "A proven source permission grant",
        "Freshness includes coherent evidence attribution, so an incorrect revision link is a meaningful regression.",
        "A complete technical success does not establish this requirement. Freshness includes coherent evidence attribution, so an incorrect revision link is a meaningful regression.",
        "A harmless guaranteed equivalent does not establish this requirement. Freshness includes coherent evidence attribution, so an incorrect revision link is a meaningful regression.",
        "A proven source permission grant does not establish this requirement. Freshness includes coherent evidence attribution, so an incorrect revision link is a meaningful regression."
      ],
      [
        "A team prepares cutover evidence for a new generation. Which set is most defensible?",
        "Coverage lifecycle quality and recovery checks",
        "Only total vector count and build duration",
        "Only one fluent example answer",
        "Only a model vendor benchmark",
        "Acceptance must combine complete current evidence, access and deletion correctness, useful grounded answers and operational recovery.",
        "Only total vector count and build duration does not establish this requirement. Acceptance must combine complete current evidence, access and deletion correctness, useful grounded answers and operational recovery.",
        "Only one fluent example answer does not establish this requirement. Acceptance must combine complete current evidence, access and deletion correctness, useful grounded answers and operational recovery.",
        "Only a model vendor benchmark does not establish this requirement. Acceptance must combine complete current evidence, access and deletion correctness, useful grounded answers and operational recovery."
      ]
    ]
  }
]);
