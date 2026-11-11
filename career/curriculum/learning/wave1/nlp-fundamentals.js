'use strict';
const {course}=require('./wave4-ai-next-helper');
module.exports=course("nlp-fundamentals",[
  {
    "slug": "tokens-contract",
    "title": "Define token boundaries before counting text",
    "intro": "A support system receives English, Urdu script and Roman Urdu messages. A token is a unit selected by a tokenizer, not a universally defined word. Punctuation, apostrophes, emoji and script boundaries affect what evidence survives preprocessing.",
    "sections": [
      [
        "Tokenization defines the observed sequence",
        "Word tokenization may split on whitespace and punctuation; character and subword methods choose different units. CountVectorizer has a default word-token pattern that keeps tokens of at least two word characters, so single-character words can disappear. A language-specific tokenizer may need different boundaries. Inspect a representative sample before deciding that a default is suitable.",
        "The same raw text can produce different token sequences under different algorithms. Persist the tokenizer and its configuration with the model. Changing segmentation after training changes the meaning and often the width of features, even if the classifier file is unchanged."
      ],
      [
        "Trace information loss explicitly",
        "Apostrophes can distinguish phrases, punctuation may encode urgency and emoji can carry sentiment. Tokenization is task dependent: a spam filter and a legal entity extractor may require different evidence. Do not remove a token solely because it looks unusual in English. Validate behavior on mixed scripts and short responses.",
        "The fixture exposes the analyzer output instead of immediately fitting a classifier. It demonstrates actual scikit-learn token boundaries for a declared English string. It does not certify Urdu linguistic adequacy or cover every Unicode writing convention."
      ]
    ],
    "code": "from sklearn.feature_extraction.text import CountVectorizer\na=CountVectorizer().build_analyzer()\nprint(a(\"I can't reset PIN!\"))",
    "expect": "['can', 'reset', 'pin']",
    "lang": "python-pandas",
    "problem": "Define token boundaries before counting text using the declared synthetic fixture.",
    "steps": [
      "Build the actual default word analyzer.",
      "Analyze the supplied mixed-case sentence with an apostrophe and one-letter word.",
      "Identify the lowercase tokens that survive the default token pattern."
    ],
    "limit": "This isolated in-memory fixture checks the shown operation on synthetic inputs using actual scikit-learn 1.8.0. It makes no dataset, model-provider or network calls. It does not establish production accuracy, representative sampling or deployment reliability.",
    "mistakes": [
      "The same raw text can produce different token sequences under different algorithms.",
      "The fixture exposes the analyzer output instead of immediately fitting a classifier."
    ],
    "takeaways": [
      "Word tokenization may split on whitespace and punctuation; character and subword methods choose different units.",
      "Apostrophes can distinguish phrases, punctuation may encode urgency and emoji can carry sentiment."
    ],
    "practice": [
      [
        "What is a tokenizer choosing?",
        "Text units/boundaries",
        "The final business threshold",
        "The model's deployment region",
        "The target class prior",
        "A tokenizer defines how text is segmented into observed units."
      ],
      [
        "Which unit can a tokenizer use besides whole words?",
        "Subwords",
        "Only database ids",
        "Only class labels",
        "Only model weights",
        "Subword tokenization represents pieces that can compose words."
      ],
      [
        "What does the default CountVectorizer word pattern omit?",
        "One-character tokens",
        "Every uppercase word",
        "Every two-letter token",
        "All repeated tokens",
        "The default pattern requires at least two word characters."
      ],
      [
        "A reset message includes a one-letter confirmation code. What should be inspected?",
        "Code-token preservation",
        "Only the number of classifier layers",
        "Only the model file size",
        "Only the label sort order",
        "A default tokenizer may remove the one-character code."
      ],
      [
        "A team changes tokenization at serving time only. What is at risk?",
        "Training-serving feature consistency",
        "The syntax of matrix addition",
        "The original label count necessarily",
        "The CPU's numerical precision only",
        "The classifier expects the representation produced during training."
      ],
      [
        "A support corpus mixes scripts. Which review is useful?",
        "Inspect token outputs per script",
        "Assume English whitespace rules cover all languages",
        "Remove every non-Latin character",
        "Infer labels from script alone",
        "Representative token traces reveal losses or inappropriate segmentation."
      ]
    ],
    "formal": [
      [
        "What does a word-token vocabulary map?",
        "Token-column mapping",
        "Class ids to response times",
        "Rows to target probabilities",
        "Model files to licenses",
        "A fixed vocabulary binds text units to feature positions."
      ],
      [
        "What is a character n-gram?",
        "n-character sequence",
        "A sequence of n labels",
        "A set of n model layers",
        "A vocabulary of exactly n words",
        "Character n-grams capture local surface sequences."
      ],
      [
        "With default CountVectorizer analysis, which input token is dropped?",
        "a",
        "reset",
        "pin",
        "please",
        "The one-character token fails the default minimum word length."
      ],
      [
        "A fraud message uses punctuation to distinguish a code. Which statement is justified?",
        "Default word segmentation may lose useful evidence",
        "Removing punctuation always improves every task",
        "All punctuation is guaranteed target leakage",
        "The classifier reconstructs every removed character",
        "Tokenization can discard signal that later modeling cannot recover."
      ],
      [
        "A team wants to reproduce a text model. What configuration must accompany it?",
        "The exact tokenizer configuration",
        "Only the number of classes",
        "Only the source file extension",
        "Only the training date's weekday",
        "Feature semantics depend on segmentation and normalization behavior."
      ],
      [
        "A whitespace tokenizer processes 'reset PIN!'. What two raw tokens result?",
        "reset and PIN!",
        "reset and pin",
        "re and set",
        "resetPIN and empty",
        "Whitespace splitting alone does not lowercase or strip attached punctuation."
      ],
      [
        "The default analyzer processes 'A PIN x reset'. How many tokens survive?",
        "2",
        "4",
        "3",
        "1",
        "PIN and reset survive; A and x are single-character tokens and are omitted."
      ],
      [
        "A bigram word analyzer sees token sequence 'not very good'. Which bigrams result?",
        "not very; very good",
        "not good only",
        "not; very; good",
        "not very good only",
        "Adjacent pairs produce two bigrams from three tokens."
      ],
      [
        "A command requires preserving single-character codes and punctuation order. Which default representation fails both requirements?",
        "Default word CountVectorizer",
        "An explicit character-sequence representation",
        "A custom tokenizer retaining both signals",
        "A raw-text audit record under access policy",
        "The default word pattern drops single characters and punctuation boundaries."
      ],
      [
        "A multilingual service needs reproducible coordinates, short-code support and script-sensitive evidence. Which plan meets all three?",
        "Persist tested tokenizer/vocabulary; check codes and scripts",
        "Persist default word tokenizer; check scripts but omit codes",
        "Persist tested tokenizer; refit vocabulary per request",
        "Persist vocabulary; choose tokenizer per detected script without alignment",
        "Fixed tested preprocessing preserves coordinates while representative fixtures address the stated signals."
      ]
    ]
  },
  {
    "slug": "normalization-negation",
    "title": "Normalize text while preserving task meaning",
    "intro": "A complaint classifier treats GOOD and good as separate strings unless normalization says otherwise. Normalization can reduce irrelevant surface variation, but deleting negation or collapsing product identifiers can reverse the meaning a model needs.",
    "sections": [
      [
        "Choose equivalences deliberately",
        "Lowercasing makes selected case variants share features, but case can distinguish proper names, abbreviations or identifiers. Unicode normalization handles specified encoding equivalences; NFC composes canonically equivalent forms, while compatibility normalization can collapse additional distinctions. Define which differences are irrelevant to the task rather than calling every transformation cleaning.",
        "Stop-word lists may include negation or language-specific function words. Removing not from not good can make a negative message look positive to a bag-of-words model. Stemming and lemmatization reduce forms under different rules and language resources; neither is automatically correct for Roman Urdu spellings or mixed scripts."
      ],
      [
        "Keep training and serving aligned",
        "Fit or choose normalizers using development evidence and apply the same policy during serving. Record raw-text access and retention boundaries separately from derived feature lineage. Privacy-safe trace examples can expose harmful transformations without copying sensitive user messages into logs.",
        "The fixture compares canonically equivalent accented forms and a simple explicit negation-preserving filter. It uses standard Unicode operations and a toy token rule, not a linguistic parser. The example demonstrates a declared equivalence and information boundary rather than a universal normalization policy."
      ]
    ],
    "code": "import unicodedata\na=\"cafe\\u0301\"\nb=\"caf\\u00e9\"\nprint(a==b)\nprint(unicodedata.normalize(\"NFC\",a)==b)\nstop={\"the\",\"is\"}\nprint([w for w in \"the service is not good\".split() if w not in stop])",
    "expect": "False\nTrue\n['service', 'not', 'good']",
    "lang": "python-pandas",
    "problem": "Normalize text while preserving task meaning using the declared synthetic fixture.",
    "steps": [
      "Construct decomposed and composed accented strings.",
      "Compare them before and after canonical NFC normalization.",
      "Apply the explicit stop list and verify that not remains in the token sequence."
    ],
    "limit": "This isolated in-memory fixture checks the shown operation on synthetic inputs using the CPython standard library in the isolated scientific profile. It makes no dataset, model-provider or network calls. It does not establish production accuracy, representative sampling or deployment reliability.",
    "mistakes": [
      "Stop-word lists may include negation or language-specific function words.",
      "The fixture compares canonically equivalent accented forms and a simple explicit negation-preserving filter."
    ],
    "takeaways": [
      "Lowercasing makes selected case variants share features, but case can distinguish proper names, abbreviations or identifiers.",
      "Fit or choose normalizers using development evidence and apply the same policy during serving."
    ],
    "practice": [
      [
        "What is text normalization deciding?",
        "Which surface differences to collapse",
        "Which final class is always correct",
        "Which optimizer has the lowest loss",
        "Which requests are authorized",
        "Normalization defines equivalence rules over text representations."
      ],
      [
        "What does NFC address?",
        "Canonical equivalents",
        "All semantic paraphrases",
        "All spelling variants in every language",
        "Every negated phrase",
        "NFC normalizes canonically equivalent code-point sequences."
      ],
      [
        "Why can removing not harm sentiment features?",
        "It can remove polarity evidence",
        "It guarantees better calibration",
        "It creates more target labels",
        "It reverses all class indices automatically",
        "Negation can alter phrase meaning and must be preserved or modeled appropriately."
      ],
      [
        "A product code differs only by case. What must be checked before lowercasing?",
        "Identifier case semantics",
        "Only the model's hidden width",
        "Only the file compression ratio",
        "Only alphabetical label order",
        "A case-folding policy may merge identifiers that the task needs to separate."
      ],
      [
        "A Roman Urdu corpus has spelling variation. What is defensible?",
        "Evaluate normalization on representative language data",
        "Assume English stemming is linguistically correct",
        "Remove every unfamiliar word",
        "Translate by replacing every vowel",
        "Language-specific variation needs evidence rather than an English-default assumption."
      ],
      [
        "A system logs raw messages to debug normalization. What additional boundary applies?",
        "Sensitive-text access and retention",
        "Only the number of output labels",
        "Only the sparse matrix dtype",
        "Only the stop-list length",
        "Debugging provenance does not justify unrestricted sensitive-text logging."
      ]
    ],
    "formal": [
      [
        "What does lowercasing usually reduce?",
        "Case-based feature variation",
        "The number of rows necessarily",
        "The need for a label dictionary",
        "Every form of distribution shift",
        "It merges upper/lowercase variants under the chosen policy."
      ],
      [
        "What is a risk of aggressive normalization?",
        "Loss of task-relevant distinctions",
        "Guaranteed semantic improvement",
        "Automatic target correction",
        "Guaranteed multilingual fairness",
        "Some surface differences carry business meaning."
      ],
      [
        "A stop list removes 'not' from 'not good'. Which unigram evidence remains from that phrase?",
        "good",
        "not good",
        "not",
        "bad",
        "The remaining positive-looking token can obscure negation."
      ],
      [
        "An entity recognizer distinguishes 'US' from 'us'. Which preprocessing decision needs evidence?",
        "Case folding of entity strings",
        "Only batch size",
        "Only train/test row counts",
        "Only the learning-rate schedule",
        "Case can distinguish a country abbreviation from a pronoun."
      ],
      [
        "A team changes Unicode policy after deployment without revalidation. What must be assessed?",
        "Feature/output changes",
        "Only the release note title",
        "Only the optimizer buffer count",
        "Only request timestamps",
        "Changed normalized strings can alter vocabulary matches and model outputs."
      ],
      [
        "Two strings differ only by canonical accent composition. Which operation is intended to align them?",
        "NFC normalization",
        "Random token shuffling",
        "Class-index sorting",
        "L2 normalization of model weights",
        "NFC composes canonical equivalents without claiming semantic paraphrase equivalence."
      ],
      [
        "The tokens 'not good' each have weight -2 and +1 in a linear sentiment score with zero bias. Removing 'not' changes the score from what to what?",
        "-1 to 1",
        "1 to -1",
        "-2 to 0",
        "0 to 3",
        "The original sum is -2+1=-1; removal leaves +1."
      ],
      [
        "A normalizer maps AB and ab to ab; a vocabulary has separate entries AB=0 and ab=1. If normalization occurs before lookup, which coordinate receives both?",
        "Coordinate 1",
        "Coordinate 0",
        "Both coordinates equally",
        "Neither coordinate can ever receive counts",
        "Both normalized strings are ab and therefore use the ab entry."
      ],
      [
        "A normalization candidate improves aggregate accuracy but merges legally distinct account codes. What follows under an exact-code requirement?",
        "Reject that policy despite aggregate improvement",
        "Release because aggregate accuracy dominates all constraints",
        "Drop code validation to preserve the score",
        "Infer original code case from the predicted label",
        "The explicit identifier-preservation constraint is violated."
      ],
      [
        "A service needs Unicode consistency, preserved negation and no merging of case-sensitive IDs. Which pipeline fits?",
        "NFC; retain negation; protect case-sensitive IDs",
        "NFC; remove negation; protect case-sensitive IDs",
        "NFC; retain negation; lowercase every ID",
        "Compatibility folding; retain negation; merge case-sensitive IDs",
        "The three requirements demand separate treatment of encoding equivalence, polarity and identifier semantics."
      ]
    ]
  },
  {
    "slug": "vocabulary-leakage",
    "title": "Fit vocabularies inside the training boundary",
    "intro": "A text classifier is evaluated on future support tickets. Even an unsupervised vocabulary or document-frequency filter learns from its input corpus. Fitting it on the full dataset lets evaluation text influence the representation used by the model.",
    "sections": [
      [
        "Vocabulary is learned state",
        "A fitted CountVectorizer maps observed tokens to columns and transforms later documents using that fixed mapping. With a fixed word vocabulary, an unseen word contributes no new column. An all-unseen document can become the zero vector, so define monitoring or fallback behavior without silently refitting the model on a single request.",
        "min_df and max_df select features using document presence, not raw within-document frequency. A token repeated a hundred times in one document still has document frequency one. These filters must be fitted on the training corpus and preserved with the classifier. Cross-validation should fit them separately within each training fold."
      ],
      [
        "Choose alternatives for growth and cost",
        "A hashing vectorizer can map tokens without retaining a learned dictionary, limiting memory but allowing collisions and making feature interpretation harder. A fixed hash space does not eliminate label leakage elsewhere or make all language variation harmless. Select vocabulary size and n-gram ranges under a memory budget, and use sparse storage for mostly zero document-term matrices.",
        "The fixture fits two training messages then transforms an unseen-only message. It demonstrates a real fixed-vocabulary zero row and distinguishes token count from document frequency. No target label or external corpus is used to build the vocabulary."
      ]
    ],
    "code": "from sklearn.feature_extraction.text import CountVectorizer\nv=CountVectorizer(min_df=2)\nx=v.fit_transform([\"reset reset pin\",\"reset password\"])\nprint(v.get_feature_names_out().tolist())\nprint(x.toarray().tolist())\nprint(v.transform([\"unseen token\"]).toarray().tolist())",
    "expect": "['reset']\n[[2], [1]]\n[[0]]",
    "lang": "python-pandas",
    "problem": "Fit vocabularies inside the training boundary using the declared synthetic fixture.",
    "steps": [
      "Fit the min_df=2 vocabulary on two training documents.",
      "Read the retained feature name and its per-document counts.",
      "Transform an unseen-only document without fitting a new vocabulary."
    ],
    "limit": "This isolated in-memory fixture checks the shown operation on synthetic inputs using actual scikit-learn 1.8.0. It makes no dataset, model-provider or network calls. It does not establish production accuracy, representative sampling or deployment reliability.",
    "mistakes": [
      "min_df and max_df select features using document presence, not raw within-document frequency.",
      "The fixture fits two training messages then transforms an unseen-only message."
    ],
    "takeaways": [
      "A fitted CountVectorizer maps observed tokens to columns and transforms later documents using that fixed mapping.",
      "A hashing vectorizer can map tokens without retaining a learned dictionary, limiting memory but allowing collisions and making feature interpretation harder."
    ],
    "practice": [
      [
        "What learned object maps tokens to feature columns?",
        "The fitted vocabulary",
        "The request arrival time",
        "The target confusion matrix",
        "The output threshold alone",
        "A fitted vocabulary fixes coordinate meanings for later documents."
      ],
      [
        "What does document frequency count?",
        "Documents containing a token",
        "Total token occurrences only",
        "The token's character length",
        "The number of target classes",
        "Repeated occurrences in one document contribute one to document frequency."
      ],
      [
        "What can an all-unseen document become under a fixed word vocabulary?",
        "A zero feature row",
        "An automatic new training row",
        "A guaranteed correct label",
        "A larger model head",
        "No recognized token means no nonzero word counts."
      ],
      [
        "A team fits vocabulary on train plus final test text. What boundary is crossed?",
        "The evaluation representation learns from test data",
        "The classifier necessarily sees every test label",
        "The number of labels must increase",
        "Only the file order changes",
        "Even unsupervised preprocessing can incorporate held-out distribution information."
      ],
      [
        "A token occurs fifty times in one of ten documents. What is its document frequency?",
        "1",
        "50",
        "10",
        "500",
        "Presence is counted once per containing document."
      ],
      [
        "A growing vocabulary exceeds memory. What tradeoff can hashing offer?",
        "Bounded space, collisions",
        "Perfect inverse word lookup",
        "No collision risk at any size",
        "Elimination of every leakage risk",
        "Hashing avoids a learned dictionary but maps distinct tokens to shared coordinates."
      ]
    ],
    "formal": [
      [
        "What should cross-validation do with a learned vocabulary?",
        "Refit it within each training fold",
        "Fit once on all validation folds first",
        "Build it from final test labels",
        "Reset it independently for every prediction",
        "Fold-local fitting preserves the evaluation boundary."
      ],
      [
        "Why are sparse matrices useful for text counts?",
        "Most document-token entries are zero",
        "All values must be negative",
        "They contain every raw message",
        "They eliminate preprocessing requirements",
        "Sparse storage avoids allocating every absent token entry."
      ],
      [
        "A token appears in documents 1 and 4 of five. What is its document frequency?",
        "2",
        "5",
        "4",
        "1",
        "Count containing documents, regardless of token repetition."
      ],
      [
        "An all-unseen row receives a confident prediction. What should be investigated?",
        "The zero-feature fallback policy",
        "Only the token's alphabetical rank",
        "Only the training file extension",
        "Only the number of worker threads",
        "A zero representation can still receive scores from intercepts without useful lexical evidence."
      ],
      [
        "A vocabulary is rebuilt per request. Which invariant fails?",
        "Stable feature-coordinate semantics",
        "The definition of a Python list",
        "The existence of model weights",
        "Only the class count",
        "A coefficient position must retain the token meaning it had during fitting."
      ],
      [
        "With min_df=2, token x appears three times in doc1 only and y once in doc1 and doc2. Which survives?",
        "y only",
        "x only",
        "Both",
        "Neither",
        "x has document frequency one and y has two."
      ],
      [
        "A fixed vocabulary is {'reset':0,'pin':1}. Transforming 'reset reset unknown' gives which count row?",
        "(2,0)",
        "(1,1)",
        "(2,1)",
        "(0,2)",
        "Only reset is recognized, twice; unknown does not create a column."
      ],
      [
        "A hash map sends reset and refund to coordinate 7. Their counts are 2 and 3 with nonnegative hashing. What is coordinate 7?",
        "5",
        "2",
        "3",
        "6",
        "Colliding counts add in the same coordinate, losing their separate identity."
      ],
      [
        "In five-fold validation a vectorizer fitted once on all data removes tokens using global max_df. Which result is justified?",
        "Held-out feature leakage",
        "No leakage is possible because the transform is unsupervised",
        "Every class label was necessarily copied into features",
        "The classifier becomes deterministic only on train",
        "Global document statistics used held-out text to select features."
      ],
      [
        "A deployment requires stable columns, bounded memory and a meaningful OOV alert. Which design is coherent?",
        "Persist bounded vocabulary; monitor OOV/zero rows",
        "Refit bounded vocabulary per batch; reuse classifier",
        "Persist unbounded vocabulary; monitor OOV/zero rows",
        "Persist bounded vocabulary; accept zero rows as certain benign",
        "Fixed compatible state, an explicit size limit and monitored missing evidence address the three constraints."
      ]
    ]
  },
  {
    "slug": "bags-ngrams",
    "title": "Compare word bags and local word order",
    "intro": "A billing team routes messages by topic. Bag-of-words counts can be strong baselines because many topics have distinctive terms. Yet a unigram bag loses word order, so statements with the same words may become indistinguishable.",
    "sections": [
      [
        "Counts form a sparse feature map",
        "For vocabulary size V, a unigram bag maps each document to V counts. Repetition changes counts, while position does not. A binary presence representation records whether a term appears rather than how many times it appears. Choose between counts and presence using the task and validation evidence; long messages can dominate raw counts.",
        "Word bigrams retain local adjacent order, such as not good, at increased feature cost. They do not capture unrestricted syntax or long-range dependencies. Vocabulary pruning and sparse storage help control memory, but an n-gram with no training occurrence has no learned feature in a fixed dictionary."
      ],
      [
        "Interpretable baselines and limits",
        "A linear classifier on sparse counts provides a transparent baseline: weights combine term evidence, conditional on other features and the training population. A positive coefficient is not a universal semantic fact or a causal effect of inserting a word. Correlated phrases can share weight in unstable ways.",
        "The fixture shows two reversed messages becoming identical unigrams while a bigram representation distinguishes their order. The contrast isolates representation behavior, not classification accuracy. A more expensive contextual model should be compared with this baseline under the same leakage-free evaluation boundary."
      ]
    ],
    "code": "from sklearn.feature_extraction.text import CountVectorizer\ndocs=[\"refund denied\",\"denied refund\"]\na=CountVectorizer().fit_transform(docs)\nb=CountVectorizer(ngram_range=(2,2)).fit_transform(docs)\nprint((a[0]!=a[1]).nnz)\nprint((b[0]!=b[1]).nnz)",
    "expect": "0\n2",
    "lang": "python-pandas",
    "problem": "Compare word bags and local word order using the declared synthetic fixture.",
    "steps": [
      "Encode the two reversed phrases as unigram counts.",
      "Encode the same documents as adjacent word bigrams.",
      "Compare row differences to expose lost versus retained local order."
    ],
    "limit": "This isolated in-memory fixture checks the shown operation on synthetic inputs using actual scikit-learn 1.8.0. It makes no dataset, model-provider or network calls. It does not establish production accuracy, representative sampling or deployment reliability.",
    "mistakes": [
      "Word bigrams retain local adjacent order, such as not good, at increased feature cost.",
      "The fixture shows two reversed messages becoming identical unigrams while a bigram representation distinguishes their order."
    ],
    "takeaways": [
      "For vocabulary size V, a unigram bag maps each document to V counts.",
      "A linear classifier on sparse counts provides a transparent baseline: weights combine term evidence, conditional on other features and the training population."
    ],
    "practice": [
      [
        "What information does a unigram bag discard?",
        "Token order",
        "Token occurrence counts",
        "The fixed vocabulary size",
        "Every token identity",
        "The representation counts words without preserving positions."
      ],
      [
        "What distinguishes binary presence from counts?",
        "Presence, not frequency",
        "Every token becomes negative",
        "No vocabulary is needed",
        "All documents have one feature",
        "Presence marks occurrence rather than multiplicity."
      ],
      [
        "What does a word bigram capture?",
        "Adjacent token order",
        "Every long-range dependency",
        "The document's author identity",
        "The final class threshold",
        "A bigram represents a neighboring word pair."
      ],
      [
        "A message repeats one topic word a hundred times. Which count behavior occurs?",
        "Its feature count grows",
        "Its document frequency must be a hundred",
        "Its class becomes certain",
        "Its label index changes",
        "Raw within-document frequency increases even though document presence remains one."
      ],
      [
        "A team adds trigrams under a fixed memory cap. What should be compared?",
        "Size/benefit tradeoff",
        "Only label capitalization",
        "Only optimizer class names",
        "Only file creation dates",
        "More n-grams trade representational detail against sparse feature and storage cost."
      ],
      [
        "A positive word coefficient is described as a causal effect. What is unsupported?",
        "Causal attribution",
        "That the weight is numeric",
        "That a feature column exists",
        "That the model uses a vocabulary",
        "Observed predictive weights do not identify intervention effects."
      ]
    ],
    "formal": [
      [
        "What is a unigram?",
        "One token",
        "Two adjacent tokens",
        "An entire batch",
        "A class-probability vector",
        "Unigrams are individual token units."
      ],
      [
        "What is a limitation of local n-grams?",
        "Limited context range",
        "They cannot represent any word order",
        "They require every value to be dense",
        "They automatically remove every stop word",
        "Finite contiguous windows capture limited context."
      ],
      [
        "A document 'pin pin reset' has binary features ordered pin,reset. Which row results?",
        "(1,1)",
        "(2,1)",
        "(1,2)",
        "(3,0)",
        "Binary presence records each observed token once."
      ],
      [
        "A classifier needs to distinguish 'not approved' from 'approved not'. Which representation directly retains this local order?",
        "Word bigrams",
        "Unigram counts only",
        "Sorted unique token ids",
        "Only document length",
        "The adjacent pairs differ despite equal unigram bags."
      ],
      [
        "A team expands from unigrams to unigrams plus bigrams. What risk should be measured?",
        "Feature growth and sparsity",
        "Guaranteed loss of all unigram features",
        "Automatic removal of negation",
        "Guaranteed improvement on every language",
        "Richer features can increase memory and overfitting without guaranteed value."
      ],
      [
        "For token sequence a,b,c,d, how many adjacent word bigrams exist?",
        "3",
        "4",
        "2",
        "6",
        "Four ordered tokens yield n-1=3 adjacent pairs."
      ],
      [
        "A count model uses weights refund=2,denied=-3 and zero bias. For 'refund refund denied', what is the score?",
        "1",
        "-1",
        "5",
        "-4",
        "The bag contributes 2×2+1×(-3)=1."
      ],
      [
        "The same document uses binary presence instead. With those weights, what score results?",
        "-1",
        "1",
        "4",
        "-3",
        "Presence contributes 1×2+1×(-3)=-1."
      ],
      [
        "A vocabulary has 10000 unigrams and 30000 retained bigrams. For a two-class biased linear head, how many scalar parameters are there?",
        "80002",
        "40002",
        "60000",
        "80000",
        "There are 40000 input features, two rows of weights and two biases."
      ],
      [
        "A support classifier needs order for short negations, a sparse baseline and a strict memory cap. Which plan addresses all constraints?",
        "Prune sparse unigram/bigrams; validate memory and order signal",
        "Use sparse unigrams; validate memory and claim order preserved",
        "Use dense unigram/bigrams; omit memory measurement",
        "Use unlimited sparse trigrams; assume sparsity meets every cap",
        "Local n-grams retain short order while pruning and sparse storage address the resource boundary."
      ]
    ],
    "comps": [
      "m2.c1"
    ]
  },
  {
    "slug": "tfidf-cosine",
    "title": "Calculate TF-IDF and compare normalized documents",
    "intro": "A search team wants common boilerplate to carry less weight than distinctive terms. TF-IDF combines local term evidence with corpus rarity. Its numeric value depends on the exact frequency, smoothing and normalization convention.",
    "sections": [
      [
        "State the implementation formula",
        "Under scikit-learn defaults, idf(t)=log((1+n)/(1+df(t)))+1 and tf is raw count before optional sublinear scaling. TfidfVectorizer applies these weights and L2-normalizes each nonzero row by default. A term present in every training document has idf one, not zero under this convention. Different libraries or options can use different formulas.",
        "Fit document frequencies on training documents only. Rarity is relative to that reference corpus, not proof of semantic importance. A rare misspelling or private identifier can receive a large idf while being unhelpful or inappropriate. Preserve vocabulary and idf together with the model."
      ],
      [
        "Cosine compares directions",
        "For nonzero vectors, cosine similarity is dot(x,y)/(norm(x)norm(y)). On L2-normalized vectors it equals the dot product. It compares relative direction rather than raw document magnitude. A zero vector has no mathematical direction; software behavior at zero needs an explicit policy rather than an invented perfect similarity.",
        "The fixture prints the learned idf for a common word and a rarer word, then checks row norms. It executes the actual vectorizer on three synthetic documents. These calculations validate the formula, not search relevance, multilingual adequacy or the quality of a decision threshold."
      ]
    ],
    "code": "from sklearn.feature_extraction.text import TfidfVectorizer\nimport numpy as np\nv=TfidfVectorizer()\nx=v.fit_transform([\"reset pin\",\"reset account\",\"reset pin\"])\nd=dict(zip(v.get_feature_names_out(),v.idf_))\nprint(round(float(d[\"reset\"]),6))\nprint(round(float(d[\"account\"]),6))\nprint(np.sqrt(x.multiply(x).sum(axis=1)).round(6).tolist())",
    "expect": "1.0\n1.693147\n[[1.0], [1.0], [1.0]]",
    "lang": "python-pandas",
    "problem": "Calculate TF-IDF and compare normalized documents using the declared synthetic fixture.",
    "steps": [
      "Fit default TF-IDF on the three declared documents.",
      "Read the IDF of a ubiquitous term and a once-observed term.",
      "Calculate row norms and confirm default L2 normalization."
    ],
    "limit": "This isolated in-memory fixture checks the shown operation on synthetic inputs using actual scikit-learn 1.8.0 and NumPy 2.3.5. It makes no dataset, model-provider or network calls. It does not establish production accuracy, representative sampling or deployment reliability.",
    "mistakes": [
      "Fit document frequencies on training documents only.",
      "The fixture prints the learned idf for a common word and a rarer word, then checks row norms."
    ],
    "takeaways": [
      "Under scikit-learn defaults, idf(t)=log((1+n)/(1+df(t)))+1 and tf is raw count before optional sublinear scaling.",
      "For nonzero vectors, cosine similarity is dot(x,y)/(norm(x)norm(y))."
    ],
    "practice": [
      [
        "What does inverse document frequency emphasize?",
        "Reference-corpus rarity",
        "Every longer document equally",
        "The largest target class",
        "Only uppercase tokens",
        "IDF discounts ubiquitous terms relative to rarer ones under the chosen formula."
      ],
      [
        "What is scikit-learn default row normalization for TF-IDF?",
        "L2",
        "L1 always",
        "No normalization always",
        "Target standardization",
        "Nonzero rows are normalized to unit Euclidean norm by default."
      ],
      [
        "What equals cosine for two L2-normalized nonzero rows?",
        "Their dot product",
        "Their raw length sum",
        "Their largest coordinate difference",
        "Their class-index product",
        "Unit norms make the cosine denominator one."
      ],
      [
        "A rare private account identifier gets high idf. What should be reviewed?",
        "Usefulness and privacy of the feature",
        "A guarantee that it is semantically central",
        "A guarantee of calibrated risk",
        "Only its alphabetical position",
        "Corpus rarity is not the same as task relevance or acceptable data use."
      ],
      [
        "A team recomputes idf on each serving batch. Which invariant can fail?",
        "Fixed IDF consistency",
        "The number of Unicode code points",
        "The definition of a sparse row",
        "Only the target tensor dtype",
        "The same message can receive different coordinates under changing reference frequencies."
      ],
      [
        "A document transforms to a zero row. What must similarity code handle?",
        "Undefined zero direction",
        "A guaranteed cosine of one",
        "An automatic new vocabulary",
        "An inevitable positive label",
        "Zero norms require a documented software/fallback policy."
      ]
    ],
    "formal": [
      [
        "What does df(t) denote in the default idf formula?",
        "Containing-document count",
        "Total repeated occurrences of t",
        "Number of characters in t",
        "The count of target classes",
        "IDF uses document presence in the fitted reference corpus."
      ],
      [
        "Which reference set should fit TF-IDF state for evaluation?",
        "Training documents",
        "Final test documents plus training",
        "Only future production text",
        "All evaluation labels",
        "The fitted vocabulary and idf must stay within training boundaries."
      ],
      [
        "With n=3 and df=3, what is default smoothed idf?",
        "1",
        "0",
        "3",
        "ln(3)",
        "The stated arithmetic gives this result: log(4/4)+1=1."
      ],
      [
        "A team compares idf from two libraries with different smoothing. What must be aligned?",
        "The exact formula and options",
        "Only the displayed term order",
        "Only the array dtype",
        "Only the classifier filename",
        "Different conventions can produce different legitimate weights."
      ],
      [
        "A long and short document have proportional nonzero TF-IDF vectors before normalization. What does L2 normalization do?",
        "Maps them to the same direction and row",
        "Makes the longer one zero",
        "Preserves their different magnitudes",
        "Changes the target label automatically",
        "Scaling a nonzero vector by a positive constant vanishes after unit normalization."
      ],
      [
        "For n=3 and df=1, what is default smoothed idf to three decimals?",
        "1.693",
        "0.693",
        "1.386",
        "3.000",
        "The stated arithmetic gives this result: log(4/2)+1=log 2+1≈1.693."
      ],
      [
        "Vectors (3,4) and (6,8) have what cosine similarity?",
        "1",
        "0",
        ".5",
        "25",
        "They are positive scalar multiples, so their directions coincide."
      ],
      [
        "Vectors (1,0) and (1,1) have cosine to three decimals of what?",
        ".707",
        "1.000",
        ".500",
        "0.000",
        "Their dot product is 1 and the norm product is sqrt(2)."
      ],
      [
        "A token occurs 10 times in one of 9 documents. What default idf applies to it?",
        "ln(5)+1",
        "ln(10/11)+1",
        "ln(9/10)",
        "10",
        "Document frequency is one, so log((1+9)/(1+1))+1=log 5+1."
      ],
      [
        "A search baseline needs fixed weights, interpretable rarity and safe zero-row behavior. Which implementation fits?",
        "Persist training IDF; state formula; handle zero rows",
        "Persist test-fitted IDF; state formula; handle zero rows",
        "Refit IDF per query; state formula; handle zero rows",
        "Persist training IDF; hide formula; assign zero vectors cosine one",
        "The training reference, stated weighting convention and zero-vector policy meet the independent constraints."
      ]
    ],
    "comps": [
      "m2.c1"
    ]
  },
  {
    "slug": "embeddings-attention",
    "title": "Distinguish static embeddings from contextual attention",
    "intro": "A retrieval prototype must represent similar phrases despite different surface words. Dense embeddings can share statistical information across tokens, while contextual models can represent a token differently according to its surrounding sequence.",
    "sections": [
      [
        "Embeddings are learned coordinates",
        "An embedding lookup maps a token id to a learned dense vector. A static lookup gives the same vector for that id regardless of context. Averaging static embeddings yields a simple document vector but loses word order and can dilute rare important tokens. Distances depend on the training objective and normalization; a vector does not carry a universal semantic scale.",
        "A contextual encoder combines token representations with sequence information. Positional information is necessary for order sensitivity in a basic self-attention block without other order-aware components. Subword tokenization can reduce whole-word out-of-vocabulary problems but does not guarantee equal quality across languages or spellings."
      ],
      [
        "Attention is a weighted computation",
        "Scaled dot-product attention computes softmax(QKᵀ/sqrt(d_k))V along each query row. Keys determine compatibility, values are the vectors being combined and a mask can prohibit selected positions. Encoder self-attention may see the whole allowed input; causal attention excludes future positions. Attention weights are not automatically a faithful causal explanation of a final prediction.",
        "The worked example computes one two-key attention row with NumPy. It is explicitly a mathematical fixture, not a native transformer framework execution or a pretrained embedding claim. It makes the normalization and weighted sum visible without downloads or provider calls."
      ]
    ],
    "code": "import numpy as np\nq=np.array([1.,0.])\nk=np.array([[1.,0.],[0.,1.]])\nv=np.array([[2.,0.],[0.,4.]])\nz=q@k.T/np.sqrt(2.)\na=np.exp(z-z.max());a=a/a.sum()\nprint(round(float(a.sum()),6))\nprint((a@v).round(3).tolist())",
    "expect": "1.0\n[1.34, 1.321]",
    "lang": "python-pandas",
    "problem": "Distinguish static embeddings from contextual attention using the declared synthetic fixture.",
    "steps": [
      "Compute query-key dot products and divide by sqrt(2).",
      "Subtract the maximum score before exponentiation and normalize.",
      "Multiply the attention row by value vectors and round the weighted output."
    ],
    "limit": "This isolated in-memory fixture checks the shown operation on synthetic inputs using actual NumPy 2.3.5. It makes no dataset, model-provider or network calls. The attention example is a NumPy mathematical trace, not a native transformer-framework execution. It does not establish production accuracy, representative sampling or deployment reliability.",
    "mistakes": [
      "A contextual encoder combines token representations with sequence information.",
      "The worked example computes one two-key attention row with NumPy."
    ],
    "takeaways": [
      "An embedding lookup maps a token id to a learned dense vector.",
      "Scaled dot-product attention computes softmax(QKᵀ/sqrt(d_k))V along each query row."
    ],
    "practice": [
      [
        "What does a static embedding lookup map?",
        "Token→dense-vector lookup",
        "A whole corpus to one class id",
        "A gradient to a file name",
        "A target label to a request time",
        "A lookup returns the learned row associated with the token id."
      ],
      [
        "What can contextual representations change with?",
        "Surrounding token context",
        "Only the token's stored spelling",
        "Only the optimizer filename",
        "Only the number of classes",
        "A contextual encoder combines information from the allowed sequence."
      ],
      [
        "What role do attention values play?",
        "Weighted value vectors",
        "Only the token label dictionary",
        "The masks' file paths",
        "The scalar learning rate",
        "Attention weights form a weighted sum of value vectors."
      ],
      [
        "A team averages static word embeddings. What information is directly lost?",
        "Token order",
        "Every token's numerical coordinates",
        "The number of embedding dimensions",
        "The ability to compute a mean",
        "Permutation of tokens leaves an ordinary average unchanged."
      ],
      [
        "A causal decoder attends to later target tokens during evaluation. What boundary is broken?",
        "Future-information masking",
        "Only vector normalization",
        "Only batch-size allocation",
        "Only the embedding dtype",
        "Causal generation must exclude unavailable future positions."
      ],
      [
        "A NumPy attention calculation passes. What does it establish?",
        "The shown attention arithmetic",
        "Native transformer model execution",
        "A downloaded pretrained checkpoint",
        "Production language quality",
        "The fixture verifies a formula without claiming a framework or learned representation."
      ],
      [
        "A transformer omits positional information and uses only content self-attention. What input distinction is unavailable to that block?",
        "Absolute token order",
        "The token content vectors",
        "The allowed attention mask",
        "The value vector dimension",
        "Content-only self-attention does not independently encode absolute sequence positions."
      ],
      [
        "A masked attention row allows two positions and blocks one. What happens to the blocked position's weight?",
        "It is zero under the mask",
        "It is always one third",
        "It receives the maximum weight",
        "It creates another class logit",
        "A properly applied exclusion mask removes that position from the normalized attention distribution."
      ]
    ],
    "formal": [
      [
        "What scales dot products in standard scaled attention?",
        "Square root of key dimension",
        "Number of target classes only",
        "Length of the model name",
        "Sum of all labels",
        "The conventional scale is sqrt(d_k)."
      ],
      [
        "Why add positional information to basic self-attention?",
        "To make sequence order available",
        "To force every token to one class",
        "To remove every attention mask",
        "To make all weights causal explanations",
        "Content-only attention lacks an intrinsic absolute ordering signal."
      ],
      [
        "Equal attention logits over two values (2,0) and (0,4) produce what output?",
        "(1,2)",
        "(2,4)",
        "(0,0)",
        "(2,2)",
        "Equal logits yield weights .5,.5 and their weighted sum is (1,2)."
      ],
      [
        "A static token lookup returns the same vector in two sentences. Which interpretation fits?",
        "Static lookup behavior",
        "It has no learned parameters",
        "It must be pretrained on both sentences",
        "It guarantees equal sentence meanings",
        "Static embeddings share a row by token id regardless of surrounding text."
      ],
      [
        "An attention map is presented as proof a token caused a decision. What is unsupported?",
        "Causal attribution",
        "That weights sum to one",
        "That a matrix product occurred",
        "That tokens have representations",
        "Attention allocation is not by itself a validated causal attribution."
      ],
      [
        "If attention logits are (ln 3,0), what are the weights?",
        "(.75,.25)",
        "(.5,.5)",
        "(.25,.75)",
        "(3,1)",
        "Exponentiation yields 3 and 1, normalized by four."
      ],
      [
        "With weights (.75,.25) and scalar values (2,10), what output results?",
        "4",
        "8",
        "3",
        "12",
        "The stated arithmetic gives this result: .75×2+.25×10=1.5+2.5=4."
      ],
      [
        "If d_k=4 and an unscaled query-key dot product is 6, what scaled score enters softmax?",
        "3",
        "1.5",
        "6",
        "12",
        "Divide by sqrt(4)=2 to obtain 3."
      ],
      [
        "A causal mask leaves only the first of three finite logits visible. What is the resulting first-position attention weight?",
        "1",
        "1/3",
        "0",
        "2/3",
        "The masked positions contribute zero probability, so the sole allowed position receives all mass."
      ],
      [
        "A sequence model needs word-order sensitivity, no future target access and honest fixture provenance. Which plan meets all three?",
        "Positional signal; causal mask; NumPy mathematics claim",
        "Positional signal; no causal mask; NumPy mathematics claim",
        "No positional signal; causal mask; order-sensitive claim",
        "Positional signal; causal mask; native pretrained-model claim",
        "The ordering signal and visibility mask satisfy the model constraints; explicit provenance limits the execution claim."
      ]
    ],
    "comps": [
      "m2.c2"
    ]
  },
  {
    "slug": "text-pipeline",
    "title": "Fit text classification as one leakage-safe pipeline",
    "intro": "A support team labels messages as billing or account access. A useful baseline combines a vectorizer with a classifier in one fitted pipeline. This preserves the representation learned on training messages and makes validation boundaries easier to maintain.",
    "sections": [
      [
        "A fitted pipeline owns transformations",
        "A Pipeline chains fit/transform stages and a final estimator. During fitting, the text vectorizer learns its vocabulary only from the supplied training fold; during prediction, it transforms with that fixed state. Passing the whole pipeline to cross-validation allows each fold to fit its own text features. Precomputing the full-corpus matrix before splitting loses that protection.",
        "Labels must reflect the business task and decision time. A ticket resolution note or agent routing tag created after the outcome may leak the answer. Group repeat conversations or customers if shared text would otherwise cross evaluation boundaries. Remove exact and near duplicate messages appropriately before interpreting a high score."
      ],
      [
        "Test the input and output contracts",
        "Persist the complete pipeline, class order and training configuration. Validate empty strings, unseen words and message-length limits separately from accuracy. A linear text model may be adequate for a domain with strong keywords, but a tiny in-sample fixture does not demonstrate performance on paraphrases or multilingual requests.",
        "The example fits an actual count-vectorizer and multinomial naive Bayes pipeline to four synthetic messages and predicts two keyword probes. The exercise verifies the composed fitting and inference path. It does not evaluate independent generalization and does not replace a business validation set."
      ]
    ],
    "code": "from sklearn.pipeline import make_pipeline\nfrom sklearn.feature_extraction.text import CountVectorizer\nfrom sklearn.naive_bayes import MultinomialNB\np=make_pipeline(CountVectorizer(),MultinomialNB())\np.fit([\"invoice bill\",\"bill amount\",\"reset password\",\"password login\"],[\"billing\",\"billing\",\"access\",\"access\"])\nprint(p.predict([\"invoice bill\",\"reset password\"]).tolist())\nprint(p.classes_.tolist())",
    "expect": "['billing', 'access']\n['access', 'billing']",
    "lang": "python-pandas",
    "problem": "Fit text classification as one leakage-safe pipeline using the declared synthetic fixture.",
    "steps": [
      "Compose count vectorization with multinomial naive Bayes.",
      "Fit only the four synthetic labeled training messages.",
      "Predict the two keyword probes and inspect the persisted class order."
    ],
    "limit": "This isolated in-memory fixture checks the shown operation on synthetic inputs using actual scikit-learn 1.8.0. It makes no dataset, model-provider or network calls. It does not establish production accuracy, representative sampling or deployment reliability.",
    "mistakes": [
      "Labels must reflect the business task and decision time.",
      "The example fits an actual count-vectorizer and multinomial naive Bayes pipeline to four synthetic messages and predicts two keyword probes."
    ],
    "takeaways": [
      "A Pipeline chains fit/transform stages and a final estimator.",
      "Persist the complete pipeline, class order and training configuration."
    ],
    "practice": [
      [
        "What does a text Pipeline preserve during prediction?",
        "Fitted transform chain",
        "A newly fitted vocabulary per request",
        "The original raw labels as inputs",
        "Only the estimator's display name",
        "The same learned representation feeds the fitted classifier."
      ],
      [
        "Which stage belongs before a text classifier?",
        "A compatible text feature transform",
        "The final test label column",
        "A future resolution outcome",
        "A random class-name replacement",
        "The estimator needs numeric features derived from permitted input text."
      ],
      [
        "What does classes_ document?",
        "Output class order",
        "Token order in every message",
        "Feature frequency ranking",
        "Request authorization roles",
        "The class array binds probability columns and labels to their semantics."
      ],
      [
        "A routing model uses agent resolution notes as input for initial triage. What is the issue?",
        "Unavailable outcome information",
        "Only an inefficient sparse dtype",
        "Only case sensitivity",
        "Only a long model name",
        "Those notes are not available at the required decision time."
      ],
      [
        "A team vectorizes all messages before cross-validation. What should change?",
        "Cross-validate the complete pipeline",
        "Only shuffle the matrix columns",
        "Only rename the folds",
        "Only increase the number of classes",
        "Fold-local vectorizer fitting prevents held-out text from shaping representation."
      ],
      [
        "A classifier gets a perfect score on duplicate conversations split across train and test. What is questionable?",
        "Independent generalization evidence",
        "The addition of token counts",
        "The existence of labels",
        "The syntax of the pipeline constructor",
        "Shared conversation text can leak near-identical cases across the evaluation boundary."
      ]
    ],
    "formal": [
      [
        "What does MultinomialNB commonly consume in a text baseline?",
        "Nonnegative term features",
        "Only negative dense logits",
        "Only target class names",
        "A browser session cookie",
        "The multinomial event model is commonly paired with nonnegative term features."
      ],
      [
        "What should be persisted with a text classifier?",
        "Its fitted text representation",
        "Only the number of source files",
        "Only a training chart title",
        "Only the class-name lengths",
        "Classifier weights depend on the exact vocabulary and transformation."
      ],
      [
        "A probability row (.2,.8) uses classes_=['access','billing']. Which class has probability .8?",
        "billing",
        "access",
        "The first token",
        "The longest message",
        "The second probability column corresponds to billing."
      ],
      [
        "A training split is changed but the old full-data vocabulary is retained. What must be reconsidered?",
        "Vocabulary fit beyond training",
        "Only the final model name",
        "Only the Python import order",
        "Only the message encoding label",
        "The vocabulary may contain statistics learned from newly held-out text."
      ],
      [
        "A customer sends several nearly identical messages. Which split better tests new-customer transfer?",
        "Group by customer",
        "Randomly distribute each message row",
        "Sort by message length and alternate",
        "Choose rows by vocabulary index",
        "Grouping avoids sharing customer-specific text across training and evaluation."
      ],
      [
        "A confusion matrix has TP=12,FP=3,FN=5 for urgent messages. What is precision?",
        ".8",
        "12/17",
        ".6",
        ".2",
        "Precision is TP/(TP+FP)=12/15=.8."
      ],
      [
        "A model's input schema contains text and a final agent queue populated after triage. Only text is available online. Which experiment estimates the actual serving task?",
        "Train/evaluate without the future queue feature",
        "Keep the queue feature because it boosts validation",
        "Use queue only in test to help difficult cases",
        "Infer the queue from the test label before prediction",
        "The available-at-decision feature set must match serving."
      ],
      [
        "One customer contributes 20 copies of a complaint, and 19 are in train while one is in test. Which test result most directly needs correction?",
        "The apparent transfer to an independent complaint",
        "The numeric validity of sparse multiplication",
        "The count of class names",
        "The possibility of a nonnegative count matrix",
        "Near-identical customer text in both sets overstates independent transfer."
      ],
      [
        "A pipeline vocabulary contains access,bill. A new message has only unseen tokens and the classifier favors billing by prior. What should be reported?",
        "Prior-driven zero-row output",
        "Proof that the new words mean billing",
        "A new vocabulary fitted automatically",
        "A failure of probability columns to have class order",
        "The zero feature vector can still yield a prior/intercept-driven decision."
      ],
      [
        "A triage service needs leakage-safe evaluation, recoverable class semantics and a deployable transform. Which bundle meets all three?",
        "Group/time permitted text; persist pipeline and classes",
        "Randomize duplicate rows; persist pipeline and classes",
        "Group/time permitted text; persist coefficients without vocabulary",
        "Group/time future resolution notes; persist pipeline and classes",
        "The data boundary, output dictionary and coupled preprocessing are separate necessary contracts."
      ]
    ],
    "comps": [
      "m3.c1"
    ]
  },
  {
    "slug": "classification-metrics",
    "title": "Evaluate text decisions under class imbalance",
    "intro": "Only a small fraction of incoming support messages are urgent. A model can obtain high accuracy by predicting routine for everything. Evaluation must connect counts and thresholds to the actual cost of missed and false alerts.",
    "sections": [
      [
        "Compute metrics from a declared class",
        "For a positive class, precision=TP/(TP+FP) and recall=TP/(TP+FN). F1 is 2PR/(P+R), equivalently 2TP/(2TP+FP+FN) when denominators are valid. Define handling of empty denominators explicitly. Report the positive class and support rather than a percentage without a population.",
        "Macro averaging gives equal weight to per-class metrics; micro aggregates decisions. Weighted averages give more influence to frequent classes. A high weighted score can conceal a rare-language or urgent-category failure. Inspect confusion matrices, class supports and language or customer slices before deciding a model is usable."
      ],
      [
        "Select thresholds with development data",
        "A probability threshold trades missed urgent cases against false alerts under a fixed score distribution. Choose it using validation data and operational capacity, then freeze it for final evaluation. If the class prior changes, precision may change even when conditional detection rates remain similar. Calibration and ranking are different properties.",
        "The fixture uses an explicit binary outcome list and prints precision, recall and F1 for the positive label. It verifies denominators and metric implementation. It is not a representative sampling study; confidence intervals and delayed outcome labels still matter in operational evaluation."
      ]
    ],
    "code": "from sklearn.metrics import precision_score,recall_score,f1_score\ny=[1,1,1,0,0,0]\np=[1,1,0,1,0,0]\nprint(round(precision_score(y,p),3))\nprint(round(recall_score(y,p),3))\nprint(round(f1_score(y,p),3))",
    "expect": "0.667\n0.667\n0.667",
    "lang": "python-pandas",
    "problem": "Evaluate text decisions under class imbalance using the declared synthetic fixture.",
    "steps": [
      "Declare actual urgent labels and predicted labels.",
      "Count two true positives, one false positive and one false negative.",
      "Compare precision, recall and F1 under the positive-class convention."
    ],
    "limit": "This isolated in-memory fixture checks the shown operation on synthetic inputs using actual scikit-learn 1.8.0. It makes no dataset, model-provider or network calls. It does not establish production accuracy, representative sampling or deployment reliability.",
    "mistakes": [
      "Macro averaging gives equal weight to per-class metrics; micro aggregates decisions.",
      "The fixture uses an explicit binary outcome list and prints precision, recall and F1 for the positive label."
    ],
    "takeaways": [
      "For a positive class, precision=TP/(TP+FP) and recall=TP/(TP+FN).",
      "A probability threshold trades missed urgent cases against false alerts under a fixed score distribution."
    ],
    "practice": [
      [
        "What is precision for a declared positive class?",
        "TP divided by TP plus FP",
        "TP divided by TP plus FN",
        "TN divided by all positives",
        "FP divided by all rows",
        "Precision measures correctness among predicted positives."
      ],
      [
        "What is recall for that class?",
        "TP divided by TP plus FN",
        "TP divided by TP plus FP",
        "TN divided by TP plus TN",
        "FP divided by FN",
        "Recall measures recovery of actual positives."
      ],
      [
        "Which averaging gives each class equal weight?",
        "Macro averaging",
        "Support-weighted averaging",
        "Always micro averaging",
        "Document-length averaging",
        "Macro averages per-class metrics without weighting by class support."
      ],
      [
        "An urgent class is 1% of requests. A model predicts routine always. What can be high despite zero urgent recall?",
        "Accuracy",
        "Urgent true positives",
        "Urgent F1 above zero",
        "Urgent recall",
        "The majority class dominates overall correctness."
      ],
      [
        "A threshold is chosen on the final test labels. What is compromised?",
        "Final-test independence",
        "The formula for precision",
        "The number of logits per row",
        "The existence of target labels",
        "Selecting using final outcomes turns them into development data."
      ],
      [
        "An aggregate score hides poor Roman Urdu recall. What should be added?",
        "Language slice metrics and support",
        "Only an English-only average",
        "Only a larger model filename",
        "Only the total vocabulary count",
        "Slice evidence reveals whether overall results conceal subgroup failures."
      ]
    ],
    "formal": [
      [
        "What does a false negative mean for urgent-message detection?",
        "A missed urgent case",
        "A routine message predicted urgent",
        "Any empty message",
        "Any repeated token",
        "It is a missed positive under the declared class definition."
      ],
      [
        "What does support mean in a class report?",
        "True-class sample count",
        "Number of model parameters",
        "Number of serving machines",
        "Number of token coordinates",
        "Support records the observed class population for interpretation."
      ],
      [
        "For TP=8,FP=2,FN=4, what is recall to three decimals?",
        ".667",
        ".800",
        ".727",
        ".500",
        "The stated arithmetic gives this result: Recall is 8/(8+4)=2/3."
      ],
      [
        "A release has strong micro F1 but weak rare-class recall. Which conclusion follows?",
        "Minority failure is hidden",
        "The rare class must have no labels",
        "Micro F1 guarantees every class is adequate",
        "The vocabulary must be dense",
        "Aggregating decisions weights frequent outcomes more heavily."
      ],
      [
        "A threshold lowers false alerts but increases missed urgent cases. What should govern the choice?",
        "Validation costs and alert capacity",
        "Only the highest training accuracy",
        "Only alphabetical class order",
        "Only model artifact size",
        "The decision tradeoff must reflect the actual costs and capacity."
      ],
      [
        "An urgent-message audit counts 14 true alerts, 6 false alarms and 7 missed urgent cases. What is positive-class F1 to three decimals?",
        ".683",
        ".700",
        ".667",
        ".778",
        "F1 is 2TP/(2TP+FP+FN)=28/(28+6+7)=28/41≈.683."
      ],
      [
        "Of 1000 messages, 20 are urgent. Predicting all routine gives which accuracy and urgent recall?",
        ".98 and 0",
        ".02 and 1",
        ".98 and 1",
        ".50 and .50",
        "980 routine messages are correct; no urgent message is recovered."
      ],
      [
        "A classifier has TPR=.8,FPR=.1 and positive prevalence .1 in 1000 cases. What is expected precision?",
        "80/170",
        "80/100",
        "90/170",
        "800/890",
        "Expected TP is 80 and FP is 90, so precision is 80/170."
      ],
      [
        "A system must recall at least .9 and process at most 50 alerts. Candidate A has TP=18,FN=2,FP=20; B has TP=19,FN=1,FP=40. Which passes both gates?",
        "A only",
        "B only",
        "Both",
        "Neither",
        "A recall is .9 with 38 alerts; B recall is .95 but produces 59 alerts."
      ],
      [
        "A multilingual urgent classifier needs a capacity-aware threshold and honest final evidence. Which protocol fits?",
        "Select validation with slice/capacity gates; freeze; test counts",
        "Select test with slice/capacity gates; freeze; test counts",
        "Select validation with aggregate gate only; freeze; test counts",
        "Select validation with slice/capacity gates; refit threshold on test",
        "Selection and final reporting must preserve both operational constraints and independent slice evidence."
      ]
    ],
    "comps": [
      "m3.c1"
    ]
  },
  {
    "slug": "roman-urdu-slices",
    "title": "Handle multilingual and Roman Urdu variation explicitly",
    "intro": "A Pakistani support service receives Urdu script, English and Roman Urdu, often in one message. Roman Urdu uses Latin letters for Urdu words and has no single universally enforced spelling. The same intent may appear as nahi, nahin or another local variant.",
    "sections": [
      [
        "Represent variation without erasing identity",
        "Character n-grams can share local surface features across spelling variants and code switching, while word features may be more interpretable. Neither guarantees linguistic understanding. A character model can also learn shortcuts from script, names or customer groups. Compare word and character baselines using realistic labeled slices and inspect their mistakes.",
        "Do not equate Latin script with English or automatically translate every Roman Urdu message using an unverified replacement table. Language identification can be uncertain for short mixed messages. Define an unknown or mixed-language policy when the application needs language metadata, and preserve the original permitted input under its access policy."
      ],
      [
        "Evaluate the population actually served",
        "Construct train and evaluation splits that respect conversation, customer and time boundaries. Measure per-language and code-switch slices with their sample sizes. A small minority slice needs uncertainty-aware interpretation; a perfect score on two examples is weak evidence. Newly popular spellings can increase OOV rates even if intent frequencies remain stable.",
        "The fixture uses actual character n-gram vectorization on two declared Roman Urdu spellings and shows a shared substring feature. It demonstrates overlap, not equivalence of all meanings or a validated transliteration engine. Human language expertise remains necessary before approving specialist linguistic claims."
      ]
    ],
    "code": "from sklearn.feature_extraction.text import CountVectorizer\nv=CountVectorizer(analyzer=\"char\",ngram_range=(3,3))\nx=v.fit_transform([\"nahi\",\"nahin\"])\nj=v.vocabulary_[\"nah\"]\nprint(x[:,j].toarray().ravel().tolist())\nprint(x.shape[0])",
    "expect": "[1, 1]\n2",
    "lang": "python-pandas",
    "problem": "Handle multilingual and Roman Urdu variation explicitly using the declared synthetic fixture.",
    "steps": [
      "Fit a three-character vectorizer to the two Roman Urdu spellings.",
      "Look up the shared nah feature coordinate.",
      "Read its count in both documents without claiming complete semantic equivalence."
    ],
    "limit": "This isolated in-memory fixture checks the shown operation on synthetic inputs using actual scikit-learn 1.8.0. It makes no dataset, model-provider or network calls. It does not establish production accuracy, representative sampling or deployment reliability.",
    "mistakes": [
      "Do not equate Latin script with English or automatically translate every Roman Urdu message using an unverified replacement table.",
      "The fixture uses actual character n-gram vectorization on two declared Roman Urdu spellings and shows a shared substring feature."
    ],
    "takeaways": [
      "Character n-grams can share local surface features across spelling variants and code switching, while word features may be more interpretable.",
      "Construct train and evaluation splits that respect conversation, customer and time boundaries."
    ],
    "practice": [
      [
        "What is Roman Urdu?",
        "Urdu in Latin script",
        "A separate mandatory class label",
        "Any English text from Pakistan",
        "Only Urdu encoded as ASCII numbers",
        "The term refers to writing Urdu in Latin letters with variable spelling conventions."
      ],
      [
        "What can character n-grams share across variants?",
        "Local character sequences",
        "Guaranteed full semantic equivalence",
        "A single universal spelling dictionary",
        "Every phrase's original word order globally",
        "Overlapping substrings can connect related surface forms."
      ],
      [
        "Why is language identification difficult for short mixed messages?",
        "Limited and code-switched evidence",
        "Every token is necessarily English",
        "Scripts always map to one language",
        "The class count is fixed at two",
        "Short or mixed text may not support a confident single-language assignment."
      ],
      [
        "A service labels every Latin-script request English. What is overlooked?",
        "Script/language distinction",
        "Only the CPU memory limit",
        "Only the label sort order",
        "Only sparse storage compression",
        "Script and language are not interchangeable."
      ],
      [
        "A new spelling trend increases OOV without changing intent mix. What changed directly?",
        "Surface-form distribution",
        "The causal meaning of every label",
        "The number of model layers",
        "The serving region necessarily",
        "Lexical drift can occur without a changed business target distribution."
      ],
      [
        "Two Roman Urdu test messages are correct. What should be avoided?",
        "Claiming broad language reliability",
        "Reporting the sample size",
        "Inspecting token traces",
        "Seeking specialist language review",
        "Tiny slice evidence cannot support broad transfer claims."
      ],
      [
        "A Roman Urdu request uses 'nahin' while training used 'nahi'. What can a character baseline preserve?",
        "Shared local substring evidence",
        "A guaranteed translation",
        "The original label with certainty",
        "A universal spelling standard",
        "Both spellings share local character sequences, which can retain evidence without guaranteeing meaning."
      ],
      [
        "A code-switched evaluation slice contains only three labels. What should accompany its reported score?",
        "Sample size and uncertainty",
        "A claim of universal language coverage",
        "Only the aggregate English score",
        "Only the largest vocabulary term",
        "Tiny slice support limits the strength of a language-performance conclusion."
      ]
    ],
    "formal": [
      [
        "What does code switching refer to here?",
        "Multiple input languages",
        "Changing the model's Python source",
        "Encrypting every token id",
        "Rotating a release key",
        "The linguistic input can combine languages within one conversation or sentence."
      ],
      [
        "Which metadata help interpret a language-slice score?",
        "Labeled slice support",
        "Only the model title",
        "Only the API port",
        "Only the file checksum",
        "Small slice sizes create uncertainty even for high observed scores."
      ],
      [
        "For 'nahi', how many contiguous character trigrams exist without added boundaries?",
        "2",
        "1",
        "3",
        "4",
        "A four-character string has length-minus-two=2 trigrams: nah and ahi."
      ],
      [
        "A character model performs well by recognizing customer names. What should be reviewed?",
        "Customer-identity shortcut learning",
        "Only its trigram window width",
        "Only the classifier filename",
        "Only the number of training epochs",
        "Surface features can exploit identity rather than intended task signals."
      ],
      [
        "A service cannot identify the language of a short mixed phrase confidently. Which policy is defensible?",
        "Use mixed/unknown policy",
        "Force English because letters are Latin",
        "Discard every non-dictionary token",
        "Invent a certain language label",
        "Uncertainty should be represented when evidence is insufficient."
      ],
      [
        "A Roman Urdu slice has TP=9,FN=1 while an Urdu-script slice has TP=18,FN=12. Which recalls apply?",
        ".9 and .6",
        ".6 and .9",
        ".9 and .9",
        ".3 and .6",
        "Recall is 9/10=.9 and 18/30=.6."
      ],
      [
        "A model gets 98/100 English messages and 1/5 Roman Urdu messages correct. What are aggregate and Roman Urdu accuracies?",
        "99/105 and 1/5",
        "99/100 and 1/5",
        "98/105 and 4/5",
        "1/5 and 99/105",
        "Aggregate correctness is 99 of 105, while the minority slice remains only 20% accurate."
      ],
      [
        "A new spelling has no known whole-word feature but shares trained character trigrams. Which statement is justified?",
        "Character features may retain evidence that the word bag loses",
        "The character model is guaranteed correct",
        "Both representations must be identical",
        "The new word automatically becomes a new vocabulary column",
        "Subword overlap can provide signal without guaranteeing semantic or task accuracy."
      ],
      [
        "Conversation duplicates cross train/test while language supports are balanced. Which boundary is still broken?",
        "Independent conversational evaluation",
        "The requirement for four answer options",
        "The definition of character trigrams",
        "The ability to compute macro metrics",
        "Balanced language counts do not repair duplicated conversation leakage."
      ],
      [
        "A multilingual release must support mixed scripts, avoid customer leakage and meet a .75 recall gate in each adequately sampled slice. Which protocol fits?",
        "Group/time split; compare word/character; gate supported slices",
        "Row split with duplicates; compare word/character; gate slices",
        "Group/time split; compare word/character; gate aggregate only",
        "Group/time split; English-only features; infer minority recall",
        "Representative features, independent splits and explicit slice gates address the three requirements."
      ]
    ],
    "comps": [
      "m3.c2"
    ]
  }
],[
  {
    "id": "nlp-text",
    "title": "scikit-learn 1.8.0 text feature extraction",
    "url": "https://github.com/scikit-learn/scikit-learn/blob/646da0f072a8afef6a980aa427a710311e67eb9d/doc/modules/feature_extraction.rst",
    "source": {
      "repo": "scikit-learn/scikit-learn",
      "commit": "646da0f072a8afef6a980aa427a710311e67eb9d",
      "path": "doc/modules/feature_extraction.rst",
      "verification": "Official pinned Git source read; local isolated worked examples execute against the declared runtime. Human educational review remains pending."
    }
  },
  {
    "id": "nlp-evaluation",
    "title": "scikit-learn 1.8.0 classification metrics",
    "url": "https://github.com/scikit-learn/scikit-learn/blob/646da0f072a8afef6a980aa427a710311e67eb9d/doc/modules/model_evaluation.rst",
    "source": {
      "repo": "scikit-learn/scikit-learn",
      "commit": "646da0f072a8afef6a980aa427a710311e67eb9d",
      "path": "doc/modules/model_evaluation.rst",
      "verification": "Official pinned Git source read; local isolated worked examples execute against the declared runtime. Human educational review remains pending."
    }
  },
  {
    "id": "nlp-pipelines",
    "title": "scikit-learn 1.8.0 pipelines",
    "url": "https://github.com/scikit-learn/scikit-learn/blob/646da0f072a8afef6a980aa427a710311e67eb9d/doc/modules/compose.rst",
    "source": {
      "repo": "scikit-learn/scikit-learn",
      "commit": "646da0f072a8afef6a980aa427a710311e67eb9d",
      "path": "doc/modules/compose.rst",
      "verification": "Official pinned Git source read; local isolated worked examples execute against the declared runtime. Human educational review remains pending."
    }
  },
  {
    "id": "nlp-transformers",
    "title": "Hugging Face course: transformer concepts",
    "url": "https://github.com/huggingface/course/blob/8b893f0ede6c781045692a7f892f25a0c92b4805/chapters/en/chapter1/4.mdx",
    "source": {
      "repo": "huggingface/course",
      "commit": "8b893f0ede6c781045692a7f892f25a0c92b4805",
      "path": "chapters/en/chapter1/4.mdx",
      "verification": "Official pinned Git source read; local isolated worked examples execute against the declared runtime. Human educational review remains pending."
    }
  }
]);
