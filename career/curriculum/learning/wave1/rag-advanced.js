'use strict';
const {build,reference}=require('./llm-wave3-helper');
module.exports=build("rag-advanced", [
  {
    "slug": "hybrid-fusion",
    "comp": "m1.c1",
    "title": "Fuse lexical and semantic retrieval without mixing raw scales",
    "intro": "A spare-parts assistant must recognize exact component codes and loosely phrased maintenance questions. One retrieval signal rarely handles both equally well.",
    "headings": [
      "Define the decision and its boundary",
      "Apply and verify the engineering policy"
    ],
    "sections": [
      [
        "Lexical retrieval rewards term evidence and is useful for identifiers and exact vocabulary. Dense retrieval uses learned representations and can surface paraphrases. Hybrid retrieval combines complementary candidate sources, but a relevance score from one system is not necessarily calibrated to the scale of another.",
        "Reciprocal rank fusion combines ranks instead of raw score magnitudes. For a document at rank r in a list, contribute 1 divided by k plus r, with a declared positive smoothing constant k. Sum contributions across lists and sort. Missing documents contribute nothing for that list; deduplicate document identities before returning context."
      ],
      [
        "Apply required access and metadata filters consistently before constructing the eligible candidate union. Fusion cannot repair an unauthorized candidate or recover evidence absent from every source. Tune fusion and candidate counts on held-out queries rather than assuming one configuration works across all domains.",
        "The fixture fuses two tiny ranked lists with k equal to sixty. Document B wins because it appears near the top of both lists. The code demonstrates one rank-fusion formula, not a lexical index, an embedding model or a measured relevance gain."
      ]
    ],
    "problem": "Fuse lexical and semantic retrieval without mixing raw scales using a declared synthetic fixture.",
    "code": "rankings = [[\"A\", \"B\"], [\"B\", \"C\"]]\nscores = {}\nfor ranking in rankings:\n    for rank, doc in enumerate(ranking, 1):\n        scores[doc] = scores.get(doc, 0) + 1 / (60 + rank)\norder = sorted(scores, key=lambda d: (-scores[d], d))\nprint(order)\nprint(round(scores[\"B\"], 4))",
    "expect": "['B', 'A', 'C']\n0.0325",
    "limit": "Rank fusion over invented lists does not implement search engines or establish that a hybrid system improves real relevance.",
    "steps": [
      "Identify the fixture inputs and the invariant stated in the lesson.",
      "Apply the explicit calculation or validation rule in application code.",
      "Compare the printed result with the expected output and identify the untested production assumptions."
    ],
    "mistakes": [
      "Rank fusion over invented lists does not implement search engines or establish that a hybrid system improves real relevance.",
      "Assuming this isolated fixture replaces representative integration tests and human review."
    ],
    "takeaways": [
      "Lexical retrieval rewards term evidence and is useful for identifiers and exact vocabulary.",
      "Apply required access and metadata filters consistently before constructing the eligible candidate union."
    ],
    "cards": [
      [
        "Which retrieval signal often helps exact identifiers?",
        "What method directly benefits from exact component-code tokens?",
        "Lexical retrieval",
        "Random sampling",
        "Output temperature",
        "Answer summarization",
        "Term evidence can be important for identifiers that a semantic match may blur."
      ],
      [
        "What does reciprocal rank fusion combine?",
        "Which input quantity does RRF use rather than raw score magnitudes?",
        "Reciprocal ranks",
        "Raw score sums",
        "Document byte sizes",
        "Model parameters",
        "RRF combines reciprocal contributions derived from rank positions in source lists."
      ],
      [
        "Why avoid summing uncalibrated scores directly?",
        "What can make raw lexical-plus-vector addition misleading?",
        "Unmatched scales",
        "Equal document ids",
        "Shared access filters",
        "Fixed query text",
        "Scores from different retrieval methods need not have comparable numerical meanings."
      ],
      [
        "What happens to shared high-ranked evidence?",
        "A document ranks near the top in two candidate lists. Under RRF, what can strengthen its fused position?",
        "Both rank contributions",
        "Only file length",
        "Only first-list score",
        "Generated citation count",
        "The fused score sums rank contributions for appearances across sources."
      ],
      [
        "What must precede eligible candidate fusion?",
        "A lexical retriever returns another tenant’s record. Which constraint must be enforced?",
        "Access filtering",
        "Rank smoothing alone",
        "Title deduplication alone",
        "Output length limits",
        "Relevance fusion does not authorize private source access."
      ],
      [
        "What can fusion not recover?",
        "The correct policy is absent from both retrieval lists. Which conclusion follows?",
        "No candidate recovery",
        "RRF always recovers it",
        "Lower k invents it",
        "Deduplication restores it",
        "A rank combiner only operates on the candidates supplied to it."
      ],
      [
        "How should duplicate chunk ids affect rank scoring versus context slots?",
        "One query returns chunk A at lexical rank 1 and dense rank 2, and distinct chunks B and C below it. Both retrievers pass access checks. A three-chunk context budget applies. Which design retains both ranking evidence and evidence diversity?",
        "Fuse A’s ranks; include A, B and C once each",
        "Keep both copies of A and one remaining chunk",
        "Keep only A’s lexical rank, then include B and C",
        "Deduplicate by title before checking source ids",
        "A can receive both reciprocal-rank contributions while occupying one context slot. Identity-based deduplication preserves separate evidence B and C; title-based merging can collapse different chunks."
      ],
      [
        "How should hybrid configuration be selected?",
        "A team tunes candidate counts using all final test answers. What is a stronger approach?",
        "Held-out evaluation",
        "Only one demo",
        "Universal defaults",
        "Ignore identifier queries",
        "Configuration should be evaluated on representative independent queries and important segments."
      ],
      [
        "What does dense retrieval contribute?",
        "A user describes a fault without using the manual’s wording. Which capability may help?",
        "Paraphrase matches",
        "Guaranteed truth",
        "Automatic permission",
        "Exact settlement",
        "Semantic representations can surface related language, subject to task-specific validation."
      ],
      [
        "How should duplicate chunk ids affect rank scoring versus context slots?",
        "Lexical search returns authorized A at rank 1 and restricted X at rank 2; dense search returns X at rank 1 and authorized B at rank 2. Raw scores use unrelated scales. The same X id appears twice. Which plan preserves scope and complementary evidence?",
        "Filter each list; fuse eligible ranks by stable id",
        "Fuse raw scores; omit X only from visible citations",
        "Fuse ranks; let duplicate X votes establish access",
        "Discard dense results; lexical rank implies access",
        "Access eligibility must be enforced independently of rank and score. Stable ids support deduplication; rank contributions avoid combining incompatible raw scales. Neither citations, repeated hits nor lexical rank authorizes X."
      ]
    ]
  },
  {
    "slug": "rerank-rewrite",
    "comp": "m1.c1",
    "title": "Rerank candidates and constrain query rewriting",
    "intro": "A travel policy query retrieves many pages about expenses. Reranking can select the relevant exception, while a careless rewrite could change the user’s destination or date.",
    "headings": [
      "Define the decision and its boundary",
      "Apply and verify the engineering policy"
    ],
    "sections": [
      [
        "A two-stage retriever uses a relatively inexpensive method to obtain candidates, then a richer relevance function to reorder a bounded subset. A cross-encoder typically evaluates a query and candidate jointly, allowing detailed interactions at greater per-pair cost. The relevant document must be in the candidate pool before reranking can elevate it.",
        "Query rewriting can expand abbreviations, resolve contextual references or create search variants. It can also change entities, dates, negation or access scope. Preserve the original question and explicit constraints, keep provenance for variants and evaluate rewrites against known intent. Generated rewrites are proposals rather than authority."
      ],
      [
        "Measure both candidate recall and final ranking quality. A better top result does not prove that missing evidence has been solved. Compare latency as candidate counts increase, deduplicate variants and avoid combining unrelated source facts into a single answer without claim-level support.",
        "The fixture reranks three supplied candidates using invented relevance values and reports whether an outside relevant id can be recovered. It illustrates the candidate-pool ceiling. No cross-encoder or query generator is trained or called."
      ]
    ],
    "problem": "Rerank candidates and constrain query rewriting using a declared synthetic fixture.",
    "code": "candidates = [\"general\", \"exception\", \"overview\"]\nrelevance = {\"general\": 0.3, \"exception\": 0.9, \"overview\": 0.5}\nranked = sorted(candidates, key=lambda x: -relevance[x])\nprint(ranked)\nprint(\"missing-rule\" in ranked)",
    "expect": "['exception', 'overview', 'general']\nFalse",
    "limit": "Invented relevance sorting is not a trained cross-encoder, and reranking cannot recover a document outside its candidate pool.",
    "steps": [
      "Identify the fixture inputs and the invariant stated in the lesson.",
      "Apply the explicit calculation or validation rule in application code.",
      "Compare the printed result with the expected output and identify the untested production assumptions."
    ],
    "mistakes": [
      "Invented relevance sorting is not a trained cross-encoder, and reranking cannot recover a document outside its candidate pool.",
      "Assuming this isolated fixture replaces representative integration tests and human review."
    ],
    "takeaways": [
      "A two-stage retriever uses a relatively inexpensive method to obtain candidates, then a richer relevance function to reorder a bounded subset.",
      "Measure both candidate recall and final ranking quality."
    ],
    "cards": [
      [
        "What is the purpose of a second-stage reranker?",
        "Which operation does a reranker usually perform on supplied candidates?",
        "Relevance reordering",
        "Generator training",
        "Access expansion",
        "Policy updating",
        "A reranker refines candidate order using a relevance function."
      ],
      [
        "What must query rewriting preserve?",
        "Which aspect should not silently change during rewriting?",
        "Query meaning",
        "Only capitalization",
        "Only sentence length",
        "Only punctuation",
        "Entities, dates, negation and task requirements must survive the transformation."
      ],
      [
        "What limits reranking recall?",
        "Which condition prevents a reranker from surfacing the right source?",
        "Source absent from pool",
        "Initially second-ranked",
        "Present in both lists",
        "Stable source identity",
        "A reranker can reorder supplied candidates but cannot retrieve an unseen document by sorting."
      ],
      [
        "What should happen to a changed travel date?",
        "A rewrite turns a July trip question into an August query. What should validation detect?",
        "Task constraint drift",
        "Guaranteed ranking gain",
        "Permission update",
        "Automatic freshness",
        "Changing a task-critical date can alter which evidence applies."
      ],
      [
        "Why bound reranking candidate counts?",
        "A team reranks every corpus document for each query and latency rises. Which design is more typical?",
        "Bounded candidate pool",
        "Full query-corpus scoring",
        "Longer generated output",
        "More chat history",
        "Richer per-pair scoring is commonly limited to a candidate subset for efficiency."
      ],
      [
        "How should rewriting variants be tracked?",
        "Several generated queries retrieve overlapping evidence. What improves traceability?",
        "Variant provenance",
        "Only final text",
        "Only model identity",
        "Only total query count",
        "Keeping the original and variants helps diagnose how evidence entered the context."
      ],
      [
        "What should accompany improved top-one ranking?",
        "A reranker raises top-one quality while candidate recall falls. Which report is needed?",
        "Recall and rerank quality",
        "Only top-one gain",
        "Only fastest query",
        "Only candidate count",
        "A gain at one stage can coexist with evidence loss earlier in the pipeline."
      ],
      [
        "Can a rewrite expand data access?",
        "A generated query requests all tenants’ policies to improve recall. What must the system retain?",
        "Access scope",
        "Generated wider scope",
        "All indexed records",
        "Unrestricted backup",
        "Search reformulation cannot expand the authenticated caller’s permissions."
      ],
      [
        "What does a cross-encoder typically score jointly?",
        "A richer relevance model is introduced after embedding retrieval. Which inputs commonly interact?",
        "Query-document pairs",
        "Document length alone",
        "Account balance alone",
        "Output budget alone",
        "Joint query-document processing distinguishes typical cross-encoder relevance scoring."
      ],
      [
        "What does the sorting fixture prove?",
        "A rewrite improves common recall but drops a date constraint; the reranker cannot find a missing exception outside its pool. What should be fixed first?",
        "Preserve intent and improve candidate coverage",
        "Increase reranker confidence on existing candidates",
        "Lower output temperature to recover missing evidence",
        "Treat the top candidate as complete ground truth",
        "Reranking cannot recover absent candidates, and rewrites must retain task-critical constraints before downstream scoring."
      ]
    ]
  },
  {
    "slug": "long-documents-tables",
    "comp": "m1.c2",
    "title": "Preserve structure in long documents and tables",
    "intro": "A benefits manual stores eligibility conditions in prose and thresholds in a table. Flattening everything into arbitrary fragments loses the relationships needed for a correct answer.",
    "headings": [
      "Define the decision and its boundary",
      "Apply and verify the engineering policy"
    ],
    "sections": [
      [
        "Chunking should reflect document structure and task needs. Keep headings, parent section ids, page references and stable source versions. Small child chunks can improve focused matching, while an authorized parent excerpt can restore nearby context. A parent expansion policy still needs token limits and source-scope checks.",
        "Tables encode relationships among row keys, column headings, units and footnotes. A bare value such as forty is ambiguous without knowing whether it means hours, days or currency. Represent retrieved rows with their headers and relevant notes. Multi-level headers and merged cells require careful extraction and verification."
      ],
      [
        "Long-document retrieval can miss exceptions separated from the general rule. Include referenced clauses or neighboring context where justified and preserve provenance for each piece. PDF extraction and OCR may alter reading order or numeric values; compare representative extracted content with the original, especially for high-impact tables.",
        "The fixture turns structured rows into self-contained strings that preserve department, threshold and units. It uses already-correct data rather than parsing a PDF. The output illustrates context preservation, not extraction accuracy or an optimal chunking strategy."
      ]
    ],
    "problem": "Preserve structure in long documents and tables using a declared synthetic fixture.",
    "code": "rows = [{\"department\": \"support\", \"hours\": 40}, {\"department\": \"sales\", \"hours\": 35}]\nchunks = [f\"Department: {r[\"department\"]}; weekly threshold: {r[\"hours\"]} hours\" for r in rows]\nprint(chunks[0])\nprint(len(chunks))",
    "expect": "Department: support; weekly threshold: 40 hours\n2",
    "limit": "Structured-row serialization does not validate PDF extraction, OCR reading order or numeric correctness in original documents.",
    "steps": [
      "Identify the fixture inputs and the invariant stated in the lesson.",
      "Apply the explicit calculation or validation rule in application code.",
      "Compare the printed result with the expected output and identify the untested production assumptions."
    ],
    "mistakes": [
      "Structured-row serialization does not validate PDF extraction, OCR reading order or numeric correctness in original documents.",
      "Assuming this isolated fixture replaces representative integration tests and human review."
    ],
    "takeaways": [
      "Chunking should reflect document structure and task needs.",
      "Long-document retrieval can miss exceptions separated from the general rule."
    ],
    "cards": [
      [
        "What makes a table value interpretable?",
        "Which context should accompany a retrieved numeric table cell?",
        "Headers, units, row id",
        "Only the raw number",
        "Only file extension",
        "Only vector dimension",
        "Table meaning depends on relationships and units, not merely a cell’s text."
      ],
      [
        "Why store parent section ids?",
        "Which retrieval pattern can use child matches to recover surrounding context?",
        "Parent expansion",
        "Output sampling",
        "Model fine-tuning",
        "Request authentication",
        "Focused child retrieval can be supplemented with relevant authorized parent context."
      ],
      [
        "Can extracted text be assumed exact?",
        "Which source transformation can alter table reading order or numbers?",
        "PDF layout extraction",
        "A source version id",
        "A stable record key",
        "A declared unit label",
        "Extraction may lose layout or introduce recognition errors requiring validation."
      ],
      [
        "What if an exception is far from the main rule?",
        "A retrieved paragraph gives a benefit threshold but a later footnote limits it. What should context preparation consider?",
        "Exception context",
        "Only top sentence",
        "Only smaller chunks",
        "Only output cap",
        "Correct decisions may require both the general rule and its applicable exception."
      ],
      [
        "What should parent expansion preserve?",
        "A matching child belongs to a restricted parent section. Which requirement remains?",
        "Access scope",
        "Unlimited parent text",
        "Only shared keywords",
        "Only document title",
        "Expanding context does not expand the caller’s permissions."
      ],
      [
        "How should table rows be chunked?",
        "A chunk contains 40 without its weekly-hours heading. What correction helps?",
        "Row and header context",
        "Repeated raw numbers",
        "Higher vector dimension",
        "Lowercase normalization",
        "Self-contained representations should preserve what a value measures and to whom it applies."
      ],
      [
        "Why keep source version and page references?",
        "A reviewer disputes a threshold in an answer. What metadata help verify it?",
        "Versioned provenance",
        "Only fluent output",
        "Only response length",
        "Only parameter count",
        "Traceable source locations connect retrieved content to the applicable original."
      ],
      [
        "What should an extraction review sample?",
        "A pipeline ingests manuals with merged cells and footnotes. Which sample is important?",
        "Complex layouts",
        "Only plain headings",
        "Only short documents",
        "Only blank pages",
        "Testing easy extraction alone misses layout-specific failure modes."
      ],
      [
        "Does a larger context window solve long-document accuracy?",
        "A team sends an entire manual and assumes every exception will be used. What remains necessary?",
        "Evidence evaluation",
        "Capacity alone",
        "Larger prompt alone",
        "Fewer citations alone",
        "Capacity to include text does not guarantee correct use of its structure or exceptions."
      ],
      [
        "What does row serialization demonstrate?",
        "A long manual’s retrieved table omits units and a footnote; the parent section is restricted. Which expansion is defensible?",
        "Expand within scope; abstain if needed",
        "Send the entire restricted parent to the model",
        "Infer units from the largest numeric value",
        "Ignore footnotes to fit the token budget",
        "Correct interpretation needs structural evidence, but context expansion cannot bypass access restrictions."
      ]
    ]
  },
  {
    "slug": "retrieval-metrics",
    "comp": "m2.c1",
    "title": "Separate recall, precision and ranking metrics",
    "intro": "A search change returns one correct paragraph first but drops another required rule. Better reciprocal rank alone does not establish complete evidence coverage.",
    "headings": [
      "Define the decision and its boundary",
      "Apply and verify the engineering policy"
    ],
    "sections": [
      [
        "Retrieval evaluation requires query-specific relevance labels and a declared retrieval unit such as documents or chunks. Precision at k is the fraction of returned slots in the chosen top-k result set judged relevant; recall at k is the fraction of known relevant units recovered there. State how fewer-than-k returns and duplicate chunks are treated.",
        "Mean reciprocal rank averages the reciprocal rank of the first relevant result, assigning zero when none appears. It emphasizes finding an early relevant result rather than recovering all relevant evidence. Hit rate asks whether any relevant result appears in the selected set. Graded ranking metrics require their own gain and discount conventions."
      ],
      [
        "No metric is better in every task. A single-source FAQ may benefit from early first-hit quality; a multi-clause eligibility decision may require complete supporting evidence. Review label completeness, corpus versions and ambiguous relevance judgments before interpreting differences as system improvements.",
        "The fixture computes precision and recall for two relevant ids and calculates the reciprocal rank of the first hit. It explicitly evaluates three returned ids. The labels are invented and exhaustive only by assumption, so the numbers do not measure a real retrieval service."
      ]
    ],
    "problem": "Separate recall, precision and ranking metrics using a declared synthetic fixture.",
    "code": "retrieved = [\"wrong\", \"rule-a\", \"rule-b\"]\nrelevant = {\"rule-a\", \"rule-b\"}\nhits = set(retrieved) & relevant\nfirst = next((i for i, doc in enumerate(retrieved, 1) if doc in relevant), None)\nprint(f\"{len(hits) / len(retrieved):.2f}\")\nprint(f\"{len(hits) / len(relevant):.2f}\")\nprint(f\"{1 / first if first else 0:.2f}\")",
    "expect": "0.67\n1.00\n0.50",
    "limit": "Metrics over invented relevance labels do not validate label completeness or establish real retrieval quality.",
    "steps": [
      "Identify the fixture inputs and the invariant stated in the lesson.",
      "Apply the explicit calculation or validation rule in application code.",
      "Compare the printed result with the expected output and identify the untested production assumptions."
    ],
    "mistakes": [
      "Metrics over invented relevance labels do not validate label completeness or establish real retrieval quality.",
      "Assuming this isolated fixture replaces representative integration tests and human review."
    ],
    "takeaways": [
      "Retrieval evaluation requires query-specific relevance labels and a declared retrieval unit such as documents or chunks.",
      "No metric is better in every task."
    ],
    "cards": [
      [
        "What does recall at k measure?",
        "Which denominator belongs in retrieval recall?",
        "Known relevant units",
        "Returned units",
        "Output tokens",
        "Corpus bytes",
        "Recall measures recovered relevant evidence relative to the known relevant set."
      ],
      [
        "What does precision at k measure?",
        "Which denominator belongs in precision for a declared returned set?",
        "Returned result slots",
        "Known relevant units",
        "User accounts",
        "Model parameters",
        "Precision measures the share of returned results that are relevant under the chosen convention."
      ],
      [
        "What does reciprocal rank emphasize?",
        "Which observation determines a query’s reciprocal-rank value?",
        "First relevant rank",
        "Total response length",
        "Last file size",
        "Mean source age",
        "Reciprocal rank focuses on how early the first relevant result appears."
      ],
      [
        "Can perfect first-hit ranking hide missing evidence?",
        "A query needs two clauses but only one is returned at rank one. Which metric may still look perfect?",
        "Reciprocal rank",
        "Complete recall",
        "All-clause coverage",
        "Evidence completeness",
        "One early relevant result can yield reciprocal rank one while other necessary evidence is missing."
      ],
      [
        "What if no relevant result is retrieved?",
        "A query’s top results contain no labeled relevant source. What reciprocal rank is assigned?",
        "Zero",
        "One",
        "Result count",
        "Corpus size",
        "Queries with no relevant hit contribute zero to MRR under the stated convention."
      ],
      [
        "Why define chunk versus document relevance?",
        "A retriever returns three chunks from one relevant document. What affects metric interpretation?",
        "Label granularity",
        "Only model latency",
        "Only output grammar",
        "Only cache expiry",
        "Document and chunk labels count different units and can yield different coverage conclusions."
      ],
      [
        "What can incomplete labels distort?",
        "A newly added correct source is unlabelled and counted irrelevant. What should be reviewed?",
        "Label completeness",
        "Only token prices",
        "Only embedding storage",
        "Only response schema",
        "Metric values depend on the correctness and completeness of the reference labels."
      ],
      [
        "How should duplicate evidence be treated?",
        "Repeated copies of one chunk occupy several top-k slots. Which evaluation policy is needed?",
        "Deduplication policy",
        "Copies as new evidence",
        "Ignore source ids",
        "Repetition as recall",
        "Duplicate handling affects result utility and the meaning of precision and recall."
      ],
      [
        "Which metric fits multi-clause tasks?",
        "A compliance answer must recover all applicable exceptions. What deserves explicit measurement?",
        "All-clause coverage",
        "Only first-hit rate",
        "Only answer fluency",
        "Only top-one rank",
        "A task requiring several sources needs more than one early relevant hit."
      ],
      [
        "What does the local metric fixture establish?",
        "A change raises MRR while recall for multi-clause eligibility questions falls. Which conclusion supports release evaluation?",
        "MRR gains can hide lost coverage",
        "Higher MRR proves every task improved",
        "Lower recall is irrelevant when rank one is correct",
        "One ranking metric can replace task-specific evaluation",
        "MRR emphasizes the first relevant hit and can improve while required additional evidence is lost."
      ]
    ]
  },
  {
    "slug": "faithfulness-answer-quality",
    "comp": "m2.c1",
    "title": "Distinguish grounded answers from complete correct answers",
    "intro": "A policy answer faithfully repeats an obsolete excerpt. It is grounded in supplied text while still wrong for today’s user.",
    "headings": [
      "Define the decision and its boundary",
      "Apply and verify the engineering policy"
    ],
    "sections": [
      [
        "Faithfulness asks whether generated claims are supported by the supplied context. Relevance asks whether the response addresses the question. Correctness asks whether it meets the applicable truth and task requirements. These dimensions overlap but differ: a response can be faithful to stale evidence or relevant while inventing unsupported details.",
        "Build golden cases with the question, authorized evidence, applicable policy date, required facts and acceptable abstention behavior. Allow valid alternative wording and sources where appropriate. Exact string matching can reject good paraphrases; a vague holistic score can overlook a single dangerous unsupported exception."
      ],
      [
        "Claim-level checks make specific failures visible. Decompose important assertions and inspect source support, currency and applicability. A real citation does not automatically entail the claim. Critical errors may require an all-required-claims gate even when the average supported fraction is high.",
        "The fixture compares structured claim values with a supplied evidence dictionary and separately checks whether all required facts are present. It illustrates support and completeness as distinct checks. It does not perform natural-language entailment or verify source authority."
      ]
    ],
    "problem": "Distinguish grounded answers from complete correct answers using a declared synthetic fixture.",
    "code": "evidence = {\"window_days\": 30, \"fee\": 0}\nanswer = {\"window_days\": 30}\nrequired = {\"window_days\", \"fee\"}\nsupported = all(k in evidence and evidence[k] == v for k, v in answer.items())\ncomplete = required <= answer.keys()\nprint(supported)\nprint(complete)",
    "expect": "True\nFalse",
    "limit": "Exact dictionary equality is not natural-language entailment, source authority verification or an assessment of real policy correctness.",
    "steps": [
      "Identify the fixture inputs and the invariant stated in the lesson.",
      "Apply the explicit calculation or validation rule in application code.",
      "Compare the printed result with the expected output and identify the untested production assumptions."
    ],
    "mistakes": [
      "Exact dictionary equality is not natural-language entailment, source authority verification or an assessment of real policy correctness.",
      "Assuming this isolated fixture replaces representative integration tests and human review."
    ],
    "takeaways": [
      "Faithfulness asks whether generated claims are supported by the supplied context.",
      "Claim-level checks make specific failures visible."
    ],
    "cards": [
      [
        "What does faithfulness primarily evaluate?",
        "Which relationship defines answer faithfulness?",
        "Evidence support",
        "Output-input length",
        "Vendor-user naming",
        "Cost-latency ratio",
        "Faithfulness concerns support in the context rather than all dimensions of real-world correctness."
      ],
      [
        "Can faithful output still be incorrect?",
        "Which source issue can make a grounded answer wrong for the user?",
        "Stale evidence",
        "Real source id",
        "Accurate quotation",
        "Valid JSON",
        "An answer may accurately reflect a source that is no longer applicable."
      ],
      [
        "Does a real citation entail a claim automatically?",
        "Which check is still needed after confirming a source exists?",
        "Claim support",
        "Only URL spelling",
        "Only link styling",
        "Only citation count",
        "A real document may not state or imply the particular claim attributed to it."
      ],
      [
        "What should a missing required fact affect?",
        "An answer correctly gives the return window but omits a mandatory fee condition. Which dimension fails?",
        "Fact completeness",
        "Only output syntax",
        "Only source existence",
        "Only fluency",
        "Supported statements can still leave the user without information required by the task."
      ],
      [
        "Why allow paraphrases in golden-case scoring?",
        "An answer preserves every rule using different wording from the reference. Which approach fits?",
        "Required-outcome rubric",
        "Exact-text rejection",
        "Character distance alone",
        "Length matching alone",
        "Multiple phrasings can satisfy the same factual and behavioral requirements."
      ],
      [
        "What should insufficient evidence produce?",
        "A case requires a policy exception not present in authorized context. Which outcome can be correct?",
        "Abstain from answering",
        "Invented exception",
        "Unrelated citation",
        "Guessed policy date",
        "A sound rubric includes behavior when evidence cannot support a decision."
      ],
      [
        "How should a critical unsupported claim be scored?",
        "Nine claims are supported but one invents a high-impact eligibility guarantee. What should the report retain?",
        "The unsupported claim",
        "Only support average",
        "Only fluent prose",
        "Only correct citations",
        "Averages can hide a decisive error that violates a mandatory requirement."
      ],
      [
        "What does source applicability include?",
        "A source is real and current but governs a different product. What must be checked?",
        "Case applicability",
        "Only recency",
        "Only source length",
        "Only retrieval score",
        "Evidence must apply to the user’s actual product, jurisdiction or other task conditions."
      ],
      [
        "Which metadata strengthen golden sets?",
        "Policy rules change across dates. What should a reference case record?",
        "Evidence versions",
        "Only model identity",
        "Only punctuation",
        "Only screenshot size",
        "Correctness judgments need the policy and circumstances applicable to the case."
      ],
      [
        "What does the dictionary example show?",
        "An answer faithfully cites a current document governing a different product and omits a required condition. Which evaluation must reject it?",
        "Applicability and completeness checks",
        "Only JSON syntax validation",
        "Only source existence verification",
        "Only wording similarity to the reference",
        "Grounding in real text does not establish case applicability or inclusion of all task-required facts."
      ]
    ]
  },
  {
    "slug": "judge-validation",
    "comp": "m2.c2",
    "title": "Validate automated judges against reviewed human labels",
    "intro": "A scoring model gives fluent wrong answers high ratings. Before using it as a release gate, the team needs to assess the scorer itself.",
    "headings": [
      "Define the decision and its boundary",
      "Apply and verify the engineering policy"
    ],
    "sections": [
      [
        "An LLM judge is another fallible component. Define concrete labels and required evidence rather than asking only for an undefined quality score. Provide the original question, authorized reference material and candidate answer with clear roles. Candidate text is data to evaluate and must not be allowed to redefine the scoring policy.",
        "Compare judge decisions with reviewed human labels on a representative held-out sample. Use a confusion matrix or agreement analysis suited to the label type, inspect disagreement cases and evaluate important segments. Human labels can also disagree; adjudicate ambiguous cases and preserve rubric versions."
      ],
      [
        "Test known judging biases such as position preference in pairwise comparisons and favoring verbose answers. Swap answer order, include concise correct responses and fluent incorrect ones, and hide unnecessary model identity. Judge model or prompt changes require renewed validation; self-evaluation is not independent assurance.",
        "The fixture computes raw agreement and two error categories for invented binary human and judge labels. Raw agreement alone can be misleading when classes are imbalanced. The exercise neither calls a judge nor establishes inter-rater reliability for real annotation work."
      ]
    ],
    "problem": "Validate automated judges against reviewed human labels using a declared synthetic fixture.",
    "code": "human = [True, False, True, False]\njudge = [True, True, True, False]\nagreement = sum(a == b for a, b in zip(human, judge)) / len(human)\nfalse_accepts = sum(not a and b for a, b in zip(human, judge))\nfalse_rejects = sum(a and not b for a, b in zip(human, judge))\nprint(agreement)\nprint(false_accepts, false_rejects)",
    "expect": "0.75\n1 0",
    "limit": "Raw agreement on four invented labels does not validate a real judge, account for chance agreement or establish expert annotation quality.",
    "steps": [
      "Identify the fixture inputs and the invariant stated in the lesson.",
      "Apply the explicit calculation or validation rule in application code.",
      "Compare the printed result with the expected output and identify the untested production assumptions."
    ],
    "mistakes": [
      "Raw agreement on four invented labels does not validate a real judge, account for chance agreement or establish expert annotation quality.",
      "Assuming this isolated fixture replaces representative integration tests and human review."
    ],
    "takeaways": [
      "An LLM judge is another fallible component.",
      "Test known judging biases such as position preference in pairwise comparisons and favoring verbose answers."
    ],
    "cards": [
      [
        "What should validate an automated judge?",
        "Which reference provides independent evidence about scorer decisions?",
        "Human labels",
        "Judge confidence",
        "Only model size",
        "Only valid JSON",
        "A scorer needs external task-specific validation rather than trust in its own output."
      ],
      [
        "Is a judge explanation proof of correctness?",
        "Which judge property remains unproved by fluent reasoning alone?",
        "Scorer accuracy",
        "Presence of text",
        "Displayed explanation",
        "Completed response",
        "A plausible explanation can accompany an incorrect evaluation."
      ],
      [
        "What should a scoring rubric define?",
        "Which instruction is more assessable than good quality?",
        "A scoring rubric",
        "Undefined quality",
        "Preferred verbosity",
        "Vendor popularity",
        "Explicit criteria make expected behavior and disagreements more inspectable."
      ],
      [
        "How can pairwise position bias be tested?",
        "A judge favors the first answer in comparisons. Which experiment helps isolate the issue?",
        "Swap answer order",
        "Only lengthen answers",
        "Only rename models",
        "Only add citations",
        "Order reversal can reveal whether preferences depend on presentation position."
      ],
      [
        "What if humans disagree on an exception?",
        "Two reviewers label the same policy answer differently. What should happen?",
        "Label adjudication",
        "Assume perfect labels",
        "Drop all hard cases",
        "Use answer length",
        "Ambiguous labels need a documented resolution before becoming reliable reference evidence."
      ],
      [
        "What should the judge do with instructions inside candidate text?",
        "An answer being graded contains a request to ignore the rubric. Which treatment fits?",
        "Untrusted content",
        "New scoring policy",
        "Replacement rubric",
        "Automatic full credit",
        "Candidate content must not redefine the trusted evaluation policy."
      ],
      [
        "Why include concise correct and verbose wrong answers?",
        "A scorer may equate length with quality. What should validation probe?",
        "Verbosity bias",
        "Only token billing",
        "Only network retries",
        "Only source age",
        "Controlled cases can reveal an inappropriate preference for longer responses."
      ],
      [
        "What happens after a judge model upgrade?",
        "A new scoring model replaces the old one under the same dashboard label. What is needed?",
        "Revalidate the judge",
        "Trust old accuracy",
        "Only rename reports",
        "Only compare lengths",
        "Judge behavior can change with the model or rubric configuration."
      ],
      [
        "What can raw agreement hide?",
        "Most references are acceptable and a judge accepts everything. Which problem can remain?",
        "Poor error detection",
        "Perfect discrimination",
        "Guaranteed calibration",
        "No imbalance effect",
        "High agreement on a dominant class can conceal weak performance on critical failures."
      ],
      [
        "What does the label fixture establish?",
        "A judge favors verbose answers and changes preferences when answer order is swapped, despite high raw agreement on mostly good examples. What is required?",
        "Bias probes and class-specific human-label validation",
        "Trust the high agreement without subgroup analysis",
        "Only require parseable numerical scores",
        "Use the same judge as its own ground truth",
        "Raw agreement can conceal imbalance and presentation biases; judge reliability needs targeted independent validation."
      ]
    ]
  },
  {
    "slug": "latency-cost-budgets",
    "comp": "m3.c1",
    "title": "Allocate latency and token budgets across retrieval stages",
    "intro": "A RAG assistant adds a reranker and richer context, improving some answers while missing response deadlines. The team needs an explicit budget for the full path.",
    "headings": [
      "Define the decision and its boundary",
      "Apply and verify the engineering policy"
    ],
    "sections": [
      [
        "RAG latency includes query preparation, search, reranking, context construction, generation and validation. Serial stage times add for a particular request; independent parallel stages can overlap, subject to coordination overhead. Percentiles from separate stage distributions should not simply be added as if they describe one request.",
        "Allocate a total deadline and reserve time for required validation and response delivery. Bound candidate count, rerank work and context size. More candidates can improve evidence recall while increasing compute; more text can add relevant support or distracting duplication. Tune these tradeoffs with task-quality evidence."
      ],
      [
        "Caching may reuse authorized retrieval results or answers, but keys and invalidation must reflect tenant scope, query semantics and evidence versions. A cached hit based on stale policy can be fast and wrong. Use graded fallbacks only when they preserve hard requirements and clearly indicate limits.",
        "The fixture calculates remaining milliseconds after declared serial stages and packs a ranked sequence of chunks within an illustrative token budget. It uses supplied token counts rather than a tokenizer and is a simple prefix policy, not an optimal relevance optimizer."
      ]
    ],
    "problem": "Allocate latency and token budgets across retrieval stages using a declared synthetic fixture.",
    "code": "deadline = 1000\nstages = {\"search\": 120, \"rerank\": 180, \"validation\": 100}\nprint(deadline - sum(stages.values()))\nchunks = [(\"a\", 300), (\"b\", 450), (\"c\", 200)]\nselected = []\nused = 0\nfor name, tokens in chunks:\n    if used + tokens > 800:\n        break\n    selected.append(name)\n    used += tokens\nprint(selected)\nprint(used)",
    "expect": "600\n['a', 'b']\n750",
    "limit": "Invented timings and token counts do not estimate real latency or implement optimal relevance-aware context selection.",
    "steps": [
      "Identify the fixture inputs and the invariant stated in the lesson.",
      "Apply the explicit calculation or validation rule in application code.",
      "Compare the printed result with the expected output and identify the untested production assumptions."
    ],
    "mistakes": [
      "Invented timings and token counts do not estimate real latency or implement optimal relevance-aware context selection.",
      "Assuming this isolated fixture replaces representative integration tests and human review."
    ],
    "takeaways": [
      "RAG latency includes query preparation, search, reranking, context construction, generation and validation.",
      "Caching may reuse authorized retrieval results or answers, but keys and invalidation must reflect tenant scope, query semantics and evidence versions."
    ],
    "cards": [
      [
        "Which stages belong in a RAG deadline?",
        "What work must remain budgeted after search and generation?",
        "Required validation time",
        "Only welcome screen",
        "Only offline training",
        "Only old source downloads",
        "The end-to-end response path includes mandatory checks before completion."
      ],
      [
        "Does larger context always improve answers?",
        "Which tradeoff should context expansion evaluate?",
        "Utility-cost tradeoff",
        "Only input length",
        "Only model identity",
        "Only maximum capacity",
        "Additional context can help or hurt task quality while increasing work."
      ],
      [
        "Can stage percentiles be added directly?",
        "Which timing quantity can be added for one serial request?",
        "Matched request durations",
        "Unrelated stage p95s",
        "Different users’ tails",
        "Different windows’ means",
        "Durations on a particular serial path add; separate distribution percentiles generally do not."
      ],
      [
        "What should happen when reranking consumes the budget?",
        "A new reranker leaves no time for required validation. What should planning change?",
        "Reserve check time",
        "Skip validation",
        "Ignore deadlines",
        "Always add candidates",
        "The full required workflow needs an explicit feasible budget."
      ],
      [
        "How should candidate-count tuning be judged?",
        "Increasing candidates improves recall but doubles latency. Which evidence is needed?",
        "Quality versus time",
        "Only pool size",
        "Only cheap unit rates",
        "Only prompt length",
        "A larger candidate pool should be evaluated for actual retrieval gains and operational cost."
      ],
      [
        "What makes a fast cache answer invalid?",
        "The cache returns an answer based on an expired policy. Which requirement failed?",
        "Source applicability",
        "Only network speed",
        "Only syntax validity",
        "Only token accounting",
        "Low latency cannot compensate for stale task evidence."
      ],
      [
        "What should context packing preserve?",
        "A small budget fits the general rule but omits a required exception. What must be reconsidered?",
        "Required evidence",
        "Only punctuation",
        "Only vector dimensions",
        "Only cache hit count",
        "Packing should preserve what the decision needs rather than optimize size alone."
      ],
      [
        "What does a prefix policy miss?",
        "A large second chunk blocks a small useful third chunk. What limitation is illustrated?",
        "Greedy packing",
        "Always most relevant",
        "Guaranteed full recall",
        "Verified tokenization",
        "A simple stop-at-first-overflow rule does not search all feasible evidence combinations."
      ],
      [
        "Which constraints apply to cost-saving fallback?",
        "A cheap backup search source lacks access filtering. What should the system do?",
        "Scope-ineligible fallback",
        "Short-query exemption",
        "Trust top-ranked text",
        "Model-hidden private data",
        "Budget pressure does not remove confidentiality requirements."
      ],
      [
        "What does the local budget example establish?",
        "A new reranker improves evidence quality but exhausts the deadline, leaving no time for mandatory checks. Which design preserves requirements?",
        "Bound reranking and evaluate quality within the total budget",
        "Skip mandatory validation whenever the reranker is slow",
        "Add all candidates to context and ignore the deadline",
        "Treat faster first-token output as completed validation",
        "The full required path must remain feasible; quality gains need to fit the end-to-end budget and release gates."
      ]
    ]
  },
  {
    "slug": "drift-and-freshness",
    "comp": "m3.c2",
    "title": "Monitor retrieval drift and corpus freshness",
    "intro": "A retrieval service keeps its uptime target while product names and policy dates change. The index can remain healthy yet fail the questions users now ask.",
    "headings": [
      "Define the decision and its boundary",
      "Apply and verify the engineering policy"
    ],
    "sections": [
      [
        "Retrieval monitoring needs both operational and quality signals. Empty-result rates, score distributions, latency and index age can indicate changes, but none alone proves correctness. A score shift can come from query mix, corpus updates or model changes. Diagnose with labeled samples and version metadata.",
        "Corpus freshness includes ingestion delay, effective dates and deletion propagation. Track whether updated documents reached the index and whether removed records remain retrievable. Tombstones and invalidation may be needed across indexes, context stores and response caches. A newly indexed but inapplicable document is not automatically correct evidence."
      ],
      [
        "Compare quality by query category, language, product and other relevant segments over compatible windows. A fixed golden set detects regression on stable cases, while reviewed recent samples reveal emerging needs. Preserve case lineage when refreshing a benchmark so score changes can be interpreted.",
        "The fixture computes overdue synthetic document ids using a declared age threshold and flags a high empty-result fraction. These are operational alerts for investigation. They do not establish a complete freshness policy or prove that returned sources support the answers."
      ]
    ],
    "problem": "Monitor retrieval drift and corpus freshness using a declared synthetic fixture.",
    "code": "documents = [{\"id\": \"a\", \"age_days\": 1}, {\"id\": \"b\", \"age_days\": 10}, {\"id\": \"c\", \"age_days\": 3}]\nprint([d[\"id\"] for d in documents if d[\"age_days\"] > 7])\nempty, total = 3, 10\nprint(empty / total > 0.2)",
    "expect": "['b']\nTrue",
    "limit": "Age and empty-result thresholds are synthetic diagnostic signals, not proof of stale truth or poor semantic retrieval.",
    "steps": [
      "Identify the fixture inputs and the invariant stated in the lesson.",
      "Apply the explicit calculation or validation rule in application code.",
      "Compare the printed result with the expected output and identify the untested production assumptions."
    ],
    "mistakes": [
      "Age and empty-result thresholds are synthetic diagnostic signals, not proof of stale truth or poor semantic retrieval.",
      "Assuming this isolated fixture replaces representative integration tests and human review."
    ],
    "takeaways": [
      "Retrieval monitoring needs both operational and quality signals.",
      "Compare quality by query category, language, product and other relevant segments over compatible windows."
    ],
    "cards": [
      [
        "Does an empty-result rate measure answer correctness directly?",
        "Which interpretation fits a rise in empty search results?",
        "Operational warning signal",
        "Complete quality score",
        "Guaranteed privacy breach",
        "Measured judge accuracy",
        "Operational changes need investigation with task evidence before assigning cause."
      ],
      [
        "What is deletion propagation?",
        "Which lifecycle requirement matters after source removal?",
        "Derived-data deletion",
        "Only UI-link removal",
        "Only filename change",
        "Only hidden citation",
        "Indexes and caches can retain source-derived information after primary deletion."
      ],
      [
        "What should an index-age alert establish?",
        "Which claim follows from crossing an age threshold alone?",
        "Check applicability",
        "Every answer wrong",
        "All sources forbidden",
        "Proven model drift",
        "Age is an operational policy signal, not direct semantic or authorization evidence."
      ],
      [
        "What if source policy changes but cache does not?",
        "A new rule reaches the index while an old response remains cached. What needs updating?",
        "Cache invalidation",
        "Only vector count",
        "Only output temperature",
        "Only model alias",
        "Freshness must propagate through derived answer stores as well as search indexes."
      ],
      [
        "How should a score-distribution shift be diagnosed?",
        "Retrieval scores fall after a product launch. What should the team inspect?",
        "Query mix and labels",
        "Only lowest score",
        "Only chart scale",
        "Only corpus size",
        "Score changes can have multiple causes and require contextual labeled evidence."
      ],
      [
        "Why retain a fixed golden set?",
        "The team refreshes all test cases each month and loses comparison continuity. What helps?",
        "Stable test cases",
        "Only new raw queries",
        "Only user ratings",
        "Only uptime metrics",
        "A consistent reference can reveal changes on the same tasks over time."
      ],
      [
        "Why add reviewed recent samples?",
        "The golden set contains no new product terminology. Which monitoring gap remains?",
        "New-query coverage",
        "Only availability",
        "Only context capacity",
        "Only cache latency",
        "Stable benchmarks need complementary samples representing changing real needs."
      ],
      [
        "What should effective-date checks distinguish?",
        "A document is newly ingested but governs next year’s policy. Which condition matters today?",
        "Effective dates",
        "Only ingestion recency",
        "Only result rank",
        "Only file creation",
        "A fresh index timestamp does not establish which policy applies to the user’s case."
      ],
      [
        "What should segment monitoring avoid?",
        "Overall recall is stable while a new language segment fails. What report is necessary?",
        "Query-segment quality",
        "Only pooled mean",
        "Only common queries",
        "Only successful searches",
        "Aggregate quality can hide failures concentrated in specific query groups."
      ],
      [
        "What does the age fixture verify?",
        "An index is fresh, but it contains a future policy and a deleted record remains in answer cache. Which monitoring response is needed?",
        "Check applicability and derived-store lifecycle",
        "Treat recent ingestion as proof of correctness",
        "Only rebuild embeddings with a larger dimension",
        "Only lower the empty-result threshold",
        "Ingestion recency alone misses effective-date applicability and deletion propagation into secondary stores."
      ]
    ]
  },
  {
    "slug": "diagnose-retrieval-incidents",
    "comp": "m3.c2",
    "title": "Trace retrieval incidents to the failing stage",
    "intro": "A policy assistant gives a wrong answer after an index update. The team should identify whether ingestion, search, ranking, context construction or generation lost the requirement.",
    "headings": [
      "Define the decision and its boundary",
      "Apply and verify the engineering policy"
    ],
    "sections": [
      [
        "Trace the evidence path before changing the generator. Determine whether the applicable source existed, was ingested correctly, entered the eligible candidate pool, survived reranking, fit into context and supported the generated claims. Each stage has a different repair; prompt edits cannot retrieve absent source data.",
        "Use stable document and chunk ids, corpus and index versions, query variants and privacy-safe candidate metadata to reproduce the path. Retain only the evidence necessary for authorized investigation. Debug logging must not expose documents that access checks rejected."
      ],
      [
        "Change one meaningful factor at a time where feasible and compare on a fixed case set. A better answer after several simultaneous changes does not identify which change helped. Roll back or constrain a faulty index or reranker under the declared incident policy, then add a minimized regression case.",
        "The fixture checks which required evidence ids were lost between retrieval and selected context. It demonstrates stage-local diagnosis from supplied ids. It does not validate source extraction, model reasoning or whether the required evidence labels are correct."
      ]
    ],
    "problem": "Trace retrieval incidents to the failing stage using a declared synthetic fixture.",
    "code": "required = {\"rule\", \"exception\"}\nretrieved = {\"rule\", \"exception\", \"overview\"}\ncontext = {\"rule\", \"overview\"}\nprint(sorted(required - retrieved))\nprint(sorted((required & retrieved) - context))",
    "expect": "[]\n['exception']",
    "limit": "Set differences locate declared evidence loss only; they do not validate original requirements or a real end-to-end retrieval trace.",
    "steps": [
      "Identify the fixture inputs and the invariant stated in the lesson.",
      "Apply the explicit calculation or validation rule in application code.",
      "Compare the printed result with the expected output and identify the untested production assumptions."
    ],
    "mistakes": [
      "Set differences locate declared evidence loss only; they do not validate original requirements or a real end-to-end retrieval trace.",
      "Assuming this isolated fixture replaces representative integration tests and human review."
    ],
    "takeaways": [
      "Trace the evidence path before changing the generator.",
      "Change one meaningful factor at a time where feasible and compare on a fixed case set."
    ],
    "cards": [
      [
        "What should be checked before blaming generation?",
        "Which question locates a possible upstream retrieval failure?",
        "Context evidence",
        "Only response length",
        "Only model popularity",
        "Only UI responsiveness",
        "Generation cannot use evidence that the pipeline never supplied."
      ],
      [
        "What enables reproducible evidence tracing?",
        "Which metadata connect chunks to the indexed source state?",
        "Source version ids",
        "Only source titles",
        "Only punctuation",
        "Only model size",
        "Document identity and version lineage help reconstruct the exact retrieval path."
      ],
      [
        "Can prompt edits recover absent corpus material?",
        "Which failure requires a source or ingestion fix?",
        "Source not indexed",
        "Existing low-rank chunk",
        "Verbose grounded answer",
        "Long valid citation",
        "Prompt changes cannot supply facts that were never available to retrieval."
      ],
      [
        "What stage lost the exception?",
        "A relevant exception is retrieved but omitted when packing context. Which layer should be investigated first?",
        "Context selection",
        "Only ingestion",
        "Only authentication",
        "Only DNS routing",
        "The evidence existed in candidates and was lost before generation input."
      ],
      [
        "How should several simultaneous changes be interpreted?",
        "A team changes embedding model, chunking and prompt together, then sees a gain. What remains hard to infer?",
        "Which change helped",
        "Final observed score",
        "Chosen configuration",
        "New result presence",
        "Confounded changes make attribution difficult without a separating experiment."
      ],
      [
        "What should a faulty index rollout support?",
        "An index update breaks required source retrieval. Which operational capability helps?",
        "Versioned rollback",
        "Only a new model",
        "Only longer output",
        "Only stronger wording",
        "A known compatible index route can limit impact while the faulty update is investigated."
      ],
      [
        "What should rejected candidates reveal in logs?",
        "A scope check removes private records from search. Which debugging data are appropriate?",
        "Scoped trace ids",
        "Forbidden text",
        "All credentials",
        "Raw private profiles",
        "Incident diagnostics must not create another disclosure channel."
      ],
      [
        "What follows a resolved retrieval incident?",
        "An omitted table footnote caused a wrong decision and is fixed. What should remain?",
        "A regression test",
        "Only a closed incident",
        "Only renamed chart",
        "Only higher average",
        "A representative minimized case helps catch the same requirement failing again."
      ],
      [
        "How should stale evidence and wrong generation differ?",
        "The answer quotes an obsolete rule accurately. What should diagnosis prioritize?",
        "Source applicability",
        "Only output grammar",
        "Only decoding variation",
        "Only JSON syntax",
        "Faithful use of stale evidence points to evidence lifecycle rather than unsupported generation alone."
      ],
      [
        "What does the evidence-loss fixture establish?",
        "After an index update, the required clause exists in retrieval but disappears during context packing. Prompt and embedding changes are proposed together. Which investigation is strongest?",
        "Fix the packing loss and compare on versioned cases",
        "Change every component and attribute gains to embeddings",
        "Blame generation because the answer is wrong",
        "Re-ingest all documents without checking the trace",
        "Stage evidence identifies a context-selection loss; targeted changes and stable comparisons support causal diagnosis."
      ]
    ]
  }
], [reference("reranking","examples/Search_reranking_with_cross-encoders.ipynb","OpenAI Cookbook: bounded reranking (historical API)"),reference("rag-evaluation","examples/evaluation/Evaluate_RAG_with_LlamaIndex.ipynb","OpenAI Cookbook: retrieval and response evaluation"),reference("pdf","examples/Parse_PDF_docs_for_RAG.ipynb","OpenAI Cookbook: rich document extraction"),reference("judge","examples/Custom-LLM-as-a-Judge.ipynb","OpenAI Cookbook: meta-evaluating judges")]);
