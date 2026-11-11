'use strict';
const {course}=require('./wave4-ai-next-helper');
module.exports=course("mlops-deployment",[
  {
    "slug": "model-bundle",
    "title": "Package preprocessing, model and semantic contracts together",
    "intro": "A demand predictor was trained on scaled numeric inputs, but a serving script feeds raw values into its coefficients. The weight file loads successfully and the output is numeric. Reliability begins with preserving the complete inference function, including its learned preprocessing.",
    "sections": [
      [
        "The artifact represents a function",
        "For prediction f(T(x)), both the fitted transformation T and estimator f are part of the learned artifact. Persist feature names, ordering, units, missing-value policy, class or target semantics and tested library versions. A model coefficient vector alone does not describe how raw inputs become model inputs. A fitted sklearn Pipeline is one way to couple these stages.",
        "A scaler fitted on the serving request or batch changes the function. Its training means and scales must be reused, not relearned from current inputs. A single-row refit can even map every numeric feature to zero. Validate schema before transformation so a compatible array shape cannot conceal swapped columns."
      ],
      [
        "Load under a trusted compatibility policy",
        "Version the artifact and its dependency environment, verify integrity and load only trusted serialized objects under the documented security policy. Pickle-family formats can execute code when loading untrusted content. A checksum detects changes relative to a trusted expected digest; it is not by itself an authenticity signature. Keep raw training records outside inference bundles unless explicitly required and governed.",
        "The fixture fits StandardScaler and LinearRegression in one real pipeline on an exact synthetic linear relation. It predicts a new input using the retained scaler. It does not start an API server, deserialize an external object or establish production data coverage."
      ]
    ],
    "code": "from sklearn.pipeline import make_pipeline\nfrom sklearn.preprocessing import StandardScaler\nfrom sklearn.linear_model import LinearRegression\np=make_pipeline(StandardScaler(),LinearRegression())\np.fit([[0.],[1.],[2.]],[1.,3.,5.])\nprint(p.predict([[3.]]).round(6).tolist())\nprint(p[0].mean_.tolist())",
    "expect": "[7.0]\n[1.0]",
    "lang": "python-pandas",
    "problem": "Package preprocessing, model and semantic contracts together using the declared synthetic fixture.",
    "steps": [
      "Fit a scaler and linear regressor in one pipeline.",
      "Predict at raw x=3 using the retained training scaler.",
      "Read the scaler mean and relate prediction seven to the exact training rule."
    ],
    "limit": "This isolated in-memory fixture checks the shown operation on synthetic inputs using actual scikit-learn 1.8.0. It makes no dataset, model-provider or network calls. It does not establish production accuracy, representative sampling or deployment reliability.",
    "mistakes": [
      "A scaler fitted on the serving request or batch changes the function.",
      "The fixture fits StandardScaler and LinearRegression in one real pipeline on an exact synthetic linear relation."
    ],
    "takeaways": [
      "For prediction f(T(x)), both the fitted transformation T and estimator f are part of the learned artifact.",
      "Version the artifact and its dependency environment, verify integrity and load only trusted serialized objects under the documented security policy."
    ],
    "practice": [
      [
        "What belongs with fitted model weights for raw-input inference?",
        "Fitted preprocessing",
        "Only the training chart title",
        "Only a new random scaler",
        "Only the output file name",
        "The model expects features transformed consistently with training."
      ],
      [
        "What should a serving scaler reuse?",
        "Training statistics",
        "Each request's newly fitted mean",
        "The target class names as means",
        "The final test labels",
        "Refitting at serving changes the learned function."
      ],
      [
        "What does a checksum prove under a trusted expected digest?",
        "Matching artifact bytes",
        "The artifact is accurate on every user",
        "The source is authenticated without any trust context",
        "The pickle cannot execute code",
        "Integrity comparison is narrower than semantic accuracy or safe deserialization."
      ],
      [
        "A model receives swapped age and income columns of the same shape. Which validation helps?",
        "Named ordered units",
        "Only array row count",
        "Only file byte size",
        "Only optimizer state length",
        "Shape checks alone do not preserve feature semantics."
      ],
      [
        "A team loads a pickle from an unknown upload. What boundary matters?",
        "Trusted loading policy",
        "Only the class dictionary length",
        "Only the scaling formula",
        "Only the model's training accuracy",
        "Pickle-family loading can execute code, so provenance and format policy are essential."
      ],
      [
        "A one-row request is used to refit StandardScaler. What can happen to that row?",
        "Zero-centered row",
        "It recovers the training distribution",
        "It increases every feature variance",
        "It guarantees an accurate output",
        "Fitting the mean to the same singleton centers it to zero and changes the expected transformation."
      ]
    ],
    "formal": [
      [
        "What is an inference bundle intended to preserve?",
        "The complete input-to-output function",
        "Only the estimator's display name",
        "Only the training example count",
        "Only an assessment score",
        "Transformations, weights and semantic contracts jointly define inference."
      ],
      [
        "What does a Pipeline couple?",
        "Ordered transforms and estimator",
        "Unrelated service credentials",
        "Every future training dataset",
        "Only human review notes",
        "Pipeline fitting and prediction retain the transformation chain."
      ],
      [
        "A trained rule predicts y=1+2x. What should the bundled function return at x=3?",
        "7",
        "6",
        "5",
        "3",
        "The retained function applies both slope and intercept: 1+2×3=7."
      ],
      [
        "A scaler is fitted on all data before splitting. Which concern is relevant?",
        "Evaluation preprocessing leakage",
        "Only API response formatting",
        "Only dependency image size",
        "Only class-label order",
        "Held-out data influenced transformation statistics."
      ],
      [
        "A stored artifact has correct coefficients but missing category mapping. What remains uncertain?",
        "Input-category coordinate semantics",
        "Whether floating point exists",
        "Whether coefficients are numeric",
        "Whether the filename is unique",
        "Coefficients depend on the exact training encoding and ordering."
      ],
      [
        "A training scaler has mean10 and scale2. What transformed value corresponds to raw14?",
        "2",
        "4",
        "7",
        "12",
        "Standardization gives (14-10)/2=2."
      ],
      [
        "A model is y=3z+1 and training z=(x-10)/2. At x=14, correct serving gives what versus using raw x as z?",
        "7 versus43",
        "43 versus7",
        "6 versus42",
        "2 versus14",
        "Correct z is2 and y7; raw-input misuse gives3×14+1=43."
      ],
      [
        "A bundle expects fields hours,kWh but a client supplies kWh,hours. Both are nonnegative floats. Which test detects the semantic error?",
        "Named-schema and order probes",
        "Only nonnegative-value validation",
        "Only a floating dtype check",
        "Only a row-count check",
        "The values satisfy broad type/range checks while their coordinate meanings are reversed."
      ],
      [
        "An attacker replaces an artifact and its adjacent digest file. What does checking only that untrusted adjacent digest establish?",
        "Byte agreement of the replaced pair",
        "Authenticity of the original release",
        "Safety of executing the artifact",
        "Independence of the training test set",
        "An expected digest must come from a trusted channel to support meaningful integrity verification."
      ],
      [
        "A release needs consistent preprocessing, safe loading and traceable runtime. Which bundle meets the requirements?",
        "Trusted pipeline; schema; dependency lock; trusted digest",
        "Trusted weights; refit scaler per request; lock; trusted digest",
        "Trusted pipeline; schema; current default versions; trusted digest",
        "Caller pickle; schema; dependency lock; caller-supplied digest",
        "The functional, trust and compatibility boundaries require separate explicit records."
      ]
    ],
    "comps": [
      "m1.c1"
    ]
  },
  {
    "slug": "api-contract",
    "title": "Serve predictions behind explicit request and error contracts",
    "intro": "An application calls a model to estimate demand. The endpoint must do more than produce a number: it must reject malformed requests, apply the approved feature contract and return enough metadata to interpret a prediction without exposing internal secrets.",
    "sections": [
      [
        "Separate boundary validation from model inference",
        "An HTTP prediction contract should define required fields, types, ranges, batch limits and output semantics. Reject missing or nonfinite required values according to a documented client-error policy. Do not silently reorder unknown fields or treat a parsing failure as a successful prediction. Authentication and authorization belong at the service boundary, independent of statistical model confidence.",
        "Load a trusted model once per controlled process lifecycle rather than loading an arbitrary artifact specified by the caller. Bound payload size, inference time and concurrency. A readiness check should reflect whether the intended artifact and dependencies are available; liveness asks whether the process should be restarted. Neither probe is a substitute for model-quality evaluation."
      ],
      [
        "Make responses and logs useful",
        "Return a prediction with model/version metadata and a correlation identifier when appropriate. Distinguish invalid input from temporary service failure so clients can decide whether retrying makes sense. Redact sensitive raw inputs and restrict log access. A confidence score should have documented semantics; a classifier score is not automatically a calibrated probability.",
        "The fixture is a pure local request validator and scoring function, not a running HTTP server. It shows the application-level boundary and rejection of a nonfinite input. Transport routing, authentication, status codes and concurrency still require actual service integration tests in a deployment environment."
      ]
    ],
    "code": "import math\ndef predict(payload):\n if set(payload)!={\"hours\"}: raise ValueError(\"schema\")\n x=payload[\"hours\"]\n if isinstance(x,bool) or not isinstance(x,(int,float)) or not math.isfinite(x) or x<0: raise ValueError(\"hours\")\n return {\"prediction\":1+2*x,\"model\":\"demand-v1\"}\nprint(predict({\"hours\":3}))\ntry: predict({\"hours\":float(\"nan\")})\nexcept ValueError as e: print(str(e))",
    "expect": "{'prediction': 7, 'model': 'demand-v1'}\nhours",
    "lang": "python-pandas",
    "problem": "Serve predictions behind explicit request and error contracts using the declared synthetic fixture.",
    "steps": [
      "Validate the exact hours field, numeric type, finiteness and nonnegative range.",
      "Return the synthetic score and model identifier for the valid request.",
      "Send NaN and verify the explicit validation error instead of a normal prediction."
    ],
    "limit": "This isolated in-memory fixture checks the shown operation on synthetic inputs using the CPython standard library in the isolated scientific profile. It makes no dataset, model-provider or network calls. It does not establish production accuracy, representative sampling or deployment reliability.",
    "mistakes": [
      "Load a trusted model once per controlled process lifecycle rather than loading an arbitrary artifact specified by the caller.",
      "The fixture is a pure local request validator and scoring function, not a running HTTP server."
    ],
    "takeaways": [
      "An HTTP prediction contract should define required fields, types, ranges, batch limits and output semantics.",
      "Return a prediction with model/version metadata and a correlation identifier when appropriate."
    ],
    "practice": [
      [
        "What should request validation define?",
        "Input schema/ranges",
        "Only a model's hidden width",
        "Only the training-set score",
        "Only a repository branch name",
        "The serving boundary must interpret permitted inputs before model execution."
      ],
      [
        "What does model readiness concern?",
        "Artifact availability",
        "Whether model accuracy is universally sufficient",
        "Whether final labels have arrived",
        "Whether all users are authorized automatically",
        "Readiness checks operational availability, not full statistical suitability."
      ],
      [
        "Why return a model version with predictions?",
        "Output/artifact trace",
        "Expose every training record",
        "Guarantee a calibrated probability",
        "Eliminate the need for input validation",
        "Version metadata connects observed outputs with the release used."
      ],
      [
        "A caller supplies the path of a pickle to load. What should the service avoid?",
        "Untrusted artifact loading",
        "Validating the JSON schema",
        "Returning a correlation id",
        "Checking request limits",
        "Artifact selection and deserialization must stay within a trusted lifecycle."
      ],
      [
        "A negative-hours input is malformed under the contract. What response policy fits?",
        "A client input error",
        "Silent success with a guessed value",
        "Infinite retry inside inference",
        "A fabricated high-confidence result",
        "Invalid input should not masquerade as a successful model decision."
      ],
      [
        "A local scoring fixture passes. What is still unverified?",
        "HTTP/auth integration",
        "The shown arithmetic result",
        "The local exception path",
        "The constructed response dictionary",
        "A pure function fixture does not execute the transport or service runtime."
      ]
    ],
    "formal": [
      [
        "What separates liveness from readiness?",
        "Restart need versus ability to serve",
        "Accuracy versus recall only",
        "Training loss versus validation loss",
        "Class order versus token order",
        "Liveness and readiness answer different operational lifecycle questions."
      ],
      [
        "What should an inference log avoid by default?",
        "Raw sensitive request payloads",
        "A controlled model version",
        "A nonsecret correlation id",
        "A documented error category",
        "Observability should preserve privacy and access boundaries."
      ],
      [
        "For the declared score 1+2h, valid h=4 returns what prediction?",
        "9",
        "8",
        "5",
        "6",
        "The function adds one to twice the supplied hours."
      ],
      [
        "A request contains NaN where finite hours are required. What should happen?",
        "Reject it before inference",
        "Treat NaN as zero without disclosure",
        "Return a normal prediction of NaN",
        "Refit the model on the request",
        "Nonfinite input violates the declared numeric contract."
      ],
      [
        "A service responds successfully before the model artifact finishes loading. Which probe contract is misleading?",
        "Readiness",
        "Only class calibration",
        "Only label prevalence",
        "Only training randomness",
        "It should not advertise ability to serve the intended model before that dependency is ready."
      ],
      [
        "A client retries the same invalid schema five times. What distinguishes this from a transient outage?",
        "Unchanged retries cannot repair the input contract",
        "Every retry trains a better model",
        "The model version necessarily changes",
        "The request becomes valid after five attempts",
        "Client validation failures need corrected inputs, unlike some temporary service errors."
      ],
      [
        "A service allows batches of at most32 rows. Requests have sizes16,32,33. Which are accepted under that limit?",
        "16 and32",
        "32 and33",
        "16 and33",
        "All three",
        "The contract accepts sizes up to and including32 but rejects33."
      ],
      [
        "A model needs20ms CPU per row and one worker handles serial rows. Ignoring overhead, what is maximum throughput?",
        "50 rows per second",
        "20 rows per second",
        "500 rows per second",
        "5 rows per second",
        "One second contains1000ms, so1000/20=50 serial rows."
      ],
      [
        "A timeout occurs after a server may have logged a prediction. Retrying is permitted, but downstream billing must occur once per logical operation. What additional design is needed?",
        "Stable billing operation identity",
        "A new operation id on every retry",
        "Only a larger batch size",
        "Only a higher prediction confidence",
        "Ambiguous completion requires logical identity so retries do not duplicate the downstream effect."
      ],
      [
        "An endpoint needs finite inputs, private logs and reliable client retries. Which contract meets all three?",
        "Validate finite ranges; redact logs; distinguish retryable errors",
        "Validate types only; redact logs; distinguish retryable errors",
        "Validate finite ranges; full raw logs; distinguish retryable errors",
        "Validate finite ranges; redact logs; retry every client error",
        "Input validation, privacy and actionable error categories independently support the stated needs."
      ]
    ],
    "comps": [
      "m1.c1"
    ]
  },
  {
    "slug": "batch-latency",
    "title": "Choose batch or real-time inference from the decision deadline",
    "intro": "A billing model runs once each night while a fraud model must respond before a transaction completes. The serving pattern follows the decision deadline and cost constraints, not the popularity of an architecture diagram.",
    "sections": [
      [
        "Latency and throughput measure different things",
        "Real-time inference serves a request near its arrival under a defined latency budget. Batch inference processes accumulated records under a completion deadline and often amortizes setup cost. Throughput counts completed predictions per time; latency measures a request or job delay. High throughput can coexist with unacceptable queue waiting.",
        "Allocate latency across preprocessing, queuing, model execution and network/service overhead. Tail latency such as p95 describes a distribution percentile, not a sum of component averages. Dynamic batching may improve compute efficiency while adding wait time. Compare it against the actual service-level objective and load distribution."
      ],
      [
        "Design recovery for the chosen mode",
        "Batch outputs should carry input snapshot, model version and stable record identity so reruns can replace or deduplicate outputs safely. Online services need bounded concurrency, overload behavior and a defined fallback when dependencies fail. Stale predictions may be acceptable for planning and unacceptable for a time-sensitive authorization decision.",
        "The fixture calculates a simple serial latency budget and batch completion capacity. These are explicit arithmetic assumptions, not load-test results. Actual tail behavior, contention, retry traffic and infrastructure failures need measured system evidence."
      ]
    ],
    "code": "budget_ms=100\nparts={\"queue\":15,\"features\":20,\"model\":30,\"overhead\":10}\nprint(budget_ms-sum(parts.values()))\nrows=1200;rate=100\nprint(rows/rate)",
    "expect": "25\n12.0",
    "lang": "python-pandas",
    "problem": "Choose batch or real-time inference from the decision deadline using the declared synthetic fixture.",
    "steps": [
      "Sum the declared serial queue, feature, model and overhead costs.",
      "Subtract that sum from the 100ms request budget.",
      "Divide the batch row count by sustained rate under the stated no-overhead assumption."
    ],
    "limit": "This isolated in-memory fixture checks the shown operation on synthetic inputs using the CPython standard library in the isolated scientific profile. It makes no dataset, model-provider or network calls. It does not establish production accuracy, representative sampling or deployment reliability.",
    "mistakes": [
      "Allocate latency across preprocessing, queuing, model execution and network/service overhead.",
      "The fixture calculates a simple serial latency budget and batch completion capacity."
    ],
    "takeaways": [
      "Real-time inference serves a request near its arrival under a defined latency budget.",
      "Batch outputs should carry input snapshot, model version and stable record identity so reruns can replace or deduplicate outputs safely."
    ],
    "practice": [
      [
        "What is inference latency?",
        "Request completion delay",
        "Only predictions per hour",
        "Only the model parameter count",
        "Only the number of labels",
        "Latency measures delay, including the relevant processing and waiting boundary."
      ],
      [
        "What is throughput?",
        "Prediction completion rate",
        "Only the slowest request duration",
        "Only a feature's scale",
        "Only the target class support",
        "Throughput describes completion rate rather than per-request delay."
      ],
      [
        "Which task naturally supports scheduled batch scoring?",
        "Nightly planning",
        "A transaction requiring an immediate decision",
        "An interactive response with a ten-ms deadline",
        "A live control loop with no waiting tolerance",
        "A known delayed deadline can permit accumulated processing."
      ],
      [
        "Dynamic batching increases queue wait but speeds execution. What should determine usefulness?",
        "End-to-end service goals",
        "Only GPU utilization",
        "Only the model title",
        "Only the average feature count",
        "Compute efficiency can trade against user-visible delay."
      ],
      [
        "A batch is rerun after partial output. What should outputs retain?",
        "Record/version identity",
        "Only a new random row id each run",
        "Only a screenshot of the first run",
        "Only the input file's display name",
        "Stable identity supports replacement or deduplication and traceability."
      ],
      [
        "A cached score is three days old. What decides acceptability?",
        "Required freshness",
        "Only a high training score",
        "Only cache compression ratio",
        "Only the count of model layers",
        "Prediction staleness must be judged against the business deadline and changing inputs."
      ],
      [
        "A batch has a four-hour completion deadline. What must its recovery plan preserve?",
        "Deadline and stable identity",
        "Only the model's display title",
        "Only a random id for each rerun",
        "Only average online request latency",
        "Batch recovery must satisfy its deadline while preventing duplicate or mixed-version outputs."
      ],
      [
        "An online queue grows without a bound during overload. Which requirement is threatened?",
        "Request latency SLO",
        "Only the label dictionary",
        "Only the training seed",
        "Only vocabulary ordering",
        "Unbounded waiting can violate the decision deadline even if inference itself is fast."
      ]
    ],
    "formal": [
      [
        "What does p95 latency mean?",
        "95% of measured requests complete by that value",
        "Every request completes by that value",
        "The mean multiplied by95",
        "Exactly95 requests are processed per second",
        "It is a percentile of the measured request-delay distribution."
      ],
      [
        "What cost can batch scoring amortize?",
        "Per-job setup across many records",
        "Every wrong label automatically",
        "Every access-control decision",
        "Every future retraining review",
        "Shared loading/setup can be spread across accumulated inputs."
      ],
      [
        "With 10ms queue,20ms features and30ms inference, what is the subtotal?",
        "60ms",
        "30ms",
        "600ms",
        "50ms",
        "The serial components sum to10+20+30=60ms."
      ],
      [
        "A service has high throughput but long queues. Which claim is invalid?",
        "High rate guarantees low latency",
        "It may finish many requests per second",
        "Waiting can dominate response time",
        "A load test should inspect percentiles",
        "Completion rate alone does not bound individual waiting time."
      ],
      [
        "A once-a-night model needs results before8am. Which measure is most directly relevant?",
        "Job completion before the deadline",
        "Only per-request median at noon",
        "Only HTTP connection count",
        "Only the number of model labels",
        "The batch's business requirement is completion by the consumption deadline."
      ],
      [
        "A batch has6000 rows and sustains200 rows/s after10s setup. What completion time follows?",
        "40 seconds",
        "30 seconds",
        "60 seconds",
        "210 seconds",
        "Processing takes6000/200=30s plus10s setup."
      ],
      [
        "A100ms serial budget uses15ms queue,25ms features,40ms inference and10ms overhead. What margin remains?",
        "10ms",
        "20ms",
        "30ms",
        "0ms",
        "The used90ms leaves10ms under the stated serial assumption."
      ],
      [
        "Dynamic batching waits20ms and executes a batch in10ms. A request with15ms other overhead has a40ms deadline. Which conclusion follows for a request waiting the full window?",
        "It misses by5ms",
        "It meets with5ms spare",
        "It meets exactly",
        "The window is irrelevant",
        "20+10+15=45ms, exceeding40ms by5ms."
      ],
      [
        "A nightly batch retries with new random output ids after half the rows committed. What risk arises?",
        "Duplicate downstream prediction rows",
        "Automatic improvement in precision",
        "Guaranteed faster completion",
        "Loss of all original model parameters",
        "Without stable record/version identity, reruns may append duplicates instead of replacing the same logical result."
      ],
      [
        "A transaction needs a response in80ms, a planning job permits6h and both need rerun-safe identity. Which design fits?",
        "Bounded online transactions; deadline-aware idempotent batch planning",
        "Nightly transactions; deadline-aware idempotent batch planning",
        "Bounded online transactions; unversioned append-only batch reruns",
        "Unbounded online queue; deadline-aware idempotent batch planning",
        "The modes follow their deadlines while stable identity supports recovery in both paths."
      ]
    ],
    "comps": [
      "m1.c2"
    ]
  },
  {
    "slug": "data-lineage",
    "title": "Version data snapshots and feature lineage",
    "intro": "An experiment reports a strong metric but the underlying table has been overwritten since training. A query name is not a reproducible dataset. Reconstructing the run requires the actual data boundary and transformation lineage used at that time.",
    "sections": [
      [
        "Identify the exact permitted data",
        "Record an immutable snapshot identifier or a content-addressed manifest of input partitions, the extraction query/configuration, schema version, label cutoff and split membership. A date alone can be ambiguous when late-arriving rows or corrections change historical tables. Hashing bytes verifies those bytes under a defined serialization; it does not establish the truth or quality of their contents.",
        "Version derived features and target definitions as well as raw input. A feature computed using information after the prediction timestamp can leak future outcomes even if the input snapshot has a perfect checksum. Validate event time, availability time and join keys. Preserve lineage identifiers without placing sensitive raw records in broadly accessible experiment metadata."
      ],
      [
        "Recover the dependency chain",
        "A manifest links dataset, preprocessing code, configuration and model artifact. Reproducibility also depends on dependency versions and execution assumptions. If a required source snapshot was legally deleted under retention policy, document that limit rather than claiming every historical run remains exactly reproducible. A digest is not a reason to retain personal data indefinitely.",
        "The fixture hashes canonical JSON bytes of a tiny synthetic manifest and compares identical versus changed split metadata. It demonstrates deterministic identity for this serialization rule, not a complete data-versioning service or proof of source authenticity."
      ]
    ],
    "code": "import json,hashlib\ndef digest(x):\n return hashlib.sha256(json.dumps(x,sort_keys=True,separators=(\",\",\":\")).encode()).hexdigest()\na={\"snapshot\":\"s1\",\"split\":\"customer-v1\"}\nb={\"split\":\"customer-v1\",\"snapshot\":\"s1\"}\nprint(digest(a)==digest(b))\nb[\"split\"]=\"customer-v2\"\nprint(digest(a)==digest(b))",
    "expect": "True\nFalse",
    "lang": "python-pandas",
    "problem": "Version data snapshots and feature lineage using the declared synthetic fixture.",
    "steps": [
      "Serialize manifest dictionaries with sorted keys and fixed separators.",
      "Compare digests when only insertion order differs.",
      "Change the split version and check that the content digest changes."
    ],
    "limit": "This isolated in-memory fixture checks the shown operation on synthetic inputs using the CPython standard library in the isolated scientific profile. It makes no dataset, model-provider or network calls. It does not establish production accuracy, representative sampling or deployment reliability.",
    "mistakes": [
      "Version derived features and target definitions as well as raw input.",
      "The fixture hashes canonical JSON bytes of a tiny synthetic manifest and compares identical versus changed split metadata."
    ],
    "takeaways": [
      "Record an immutable snapshot identifier or a content-addressed manifest of input partitions, the extraction query/configuration, schema version, label cutoff and split membership.",
      "A manifest links dataset, preprocessing code, configuration and model artifact."
    ],
    "practice": [
      [
        "What does a dataset snapshot identify?",
        "Fixed input version",
        "Only the model's display title",
        "Only a mutable table name",
        "Only the latest API response",
        "A reproducible input reference must identify the data actually used."
      ],
      [
        "What should label lineage include?",
        "Definition/availability",
        "Only the class name length",
        "Only the output filename",
        "Only training duration",
        "Target meaning and when it became available affect leakage and reproducibility."
      ],
      [
        "What does a content hash establish under fixed serialization?",
        "Digest byte identity",
        "Truth of every source value",
        "Absence of all leakage",
        "Permission to retain data forever",
        "A hash detects byte changes without validating semantics or governance."
      ],
      [
        "A table is updated daily under the same name. What is insufficient for exact recovery?",
        "Mutable table name",
        "An immutable partition manifest",
        "A recorded snapshot id",
        "A fixed extraction configuration",
        "A mutable name does not identify the historical contents."
      ],
      [
        "An aggregate feature includes next month's purchases. What remains wrong despite versioned data?",
        "Future leakage",
        "The ability to hash a file",
        "The schema's byte encoding",
        "Only the model class name",
        "Information availability must match the prediction decision time."
      ],
      [
        "A source snapshot must be deleted under retention policy. What should the run record say?",
        "Documented recovery limit",
        "The digest recreates deleted rows",
        "Reproducibility overrides every retention rule",
        "The model automatically deletes all outputs",
        "Lineage can document limits without inventing recoverability or bypassing policy."
      ]
    ],
    "formal": [
      [
        "What does feature lineage connect?",
        "Data and transform provenance",
        "Only plots to color palettes",
        "Only labels to font choices",
        "Only API ports to hostnames",
        "Lineage records how model inputs were produced."
      ],
      [
        "Why persist split membership or its reproducible rule?",
        "To recover the evaluation boundary",
        "To guarantee every score improves",
        "To eliminate the need for labels",
        "To make all rows identical",
        "Which observations belong to train/validation/test affects the result."
      ],
      [
        "Two canonical manifests differ only by JSON key insertion order. Under sorted-key serialization, what happens to their hashes?",
        "They match",
        "They must differ",
        "They become empty",
        "They equal the row count",
        "Canonical key ordering removes that representational difference before hashing."
      ],
      [
        "A query uses CURRENT_DATE while rebuilding a historical run. What must be controlled?",
        "Extraction time/snapshot",
        "Only the script filename",
        "Only the model parameter count",
        "Only metric rounding",
        "A time-dependent query can select different rows unless its temporal boundary is fixed."
      ],
      [
        "A model stores a data digest but not feature code. What is still missing?",
        "The feature-transformation code",
        "Only an image of the dashboard",
        "Only the model title",
        "Only the output class count",
        "Same source bytes can produce different features under different transformations."
      ],
      [
        "A three-file manifest records hashes A,B,C; one file's content changes but its filename stays. What identity component must change?",
        "That file's content digest",
        "Only the directory label",
        "Only the count of files",
        "Nothing if the filename matches",
        "Content-addressed identity changes with the bytes, independently of path spelling."
      ],
      [
        "A label becomes available on day10 for an event on day1. A prediction is made on day3. Which feature availability rule is valid?",
        "Exclude that label-derived information at day3",
        "Treat event day1 as proof it was known on day1",
        "Use the label because it exists during offline training",
        "Shift the prediction timestamp to day10 without changing the task",
        "Availability time governs what the model could actually know at decision time."
      ],
      [
        "A dataset id stays s1 but split rule changes from customer groups to random rows. Which reproducibility statement is accurate?",
        "Split boundary changed",
        "The run is identical because dataset id matches",
        "Only inference latency can change",
        "All test labels necessarily remain in the same split",
        "Split construction is part of run identity and can change leakage and evaluation."
      ],
      [
        "A SHA256 check matches a file fetched from an untrusted sender using a digest from that same sender. What is established?",
        "Sender-stated byte match",
        "The file has official provenance",
        "All labels are valid",
        "The snapshot was collected with consent",
        "Integrity comparison alone does not authenticate the source or validate data quality."
      ],
      [
        "A team needs recoverable inputs, time-safe features and limited sensitive metadata. Which manifest fits?",
        "Immutable snapshots; availability rules; split versions; safe metadata",
        "Mutable table names; availability rules; split versions; safe metadata",
        "Immutable snapshots; event-time-only rules; split versions; safe metadata",
        "Immutable snapshots; availability rules; no split versions; raw personal metadata",
        "The manifest must cover exact inputs and transformations while respecting metadata access boundaries."
      ]
    ]
  },
  {
    "slug": "experiment-record",
    "title": "Track experiments as comparable configurations and outcomes",
    "intro": "A team compares two models but one used a different dataset split and a larger tuning budget. An experiment tracker is useful only when its records make those differences visible. A run id alone cannot justify a performance conclusion.",
    "sections": [
      [
        "Record the full experimental boundary",
        "Track source code revision, dependency lock, dataset/split ids, transformation configuration, seeds, hyperparameters, training budget and model artifact digest. Store metric names with their definitions, class orientation, aggregation and evaluation population. A value called score is not interpretable if one run means macro F1 and another means accuracy.",
        "Keep training, validation and final-test metrics distinct. Hyperparameter selection can use validation evidence, while the final test evaluates the frozen selected policy. Record failed runs and their causes rather than deleting them to make tuning look cheaper. A tracker can store evidence but cannot make incompatible experiments comparable."
      ],
      [
        "Compare under controlled resource and data policies",
        "A comparison should use a shared task definition and appropriate data boundary, plus an explicit compute or search budget. More trials can overfit validation even without training on its labels directly. When reporting best-of-many performance, disclose selection and preserve independent final evaluation.",
        "The fixture filters synthetic run records by a fixed validation and latency gate, then selects the highest remaining validation metric. It is a local decision trace, not an external tracking-system integration. No experiment provider, credentials or network access are involved."
      ]
    ],
    "code": "runs=[{\"id\":\"a\",\"f1\":.8,\"latency\":40},{\"id\":\"b\",\"f1\":.83,\"latency\":70},{\"id\":\"c\",\"f1\":.81,\"latency\":45}]\nvalid=[r for r in runs if r[\"latency\"]<=50]\nprint(max(valid,key=lambda r:r[\"f1\"])[\"id\"])\nprint(len(valid))",
    "expect": "c\n2",
    "lang": "python-pandas",
    "problem": "Track experiments as comparable configurations and outcomes using the declared synthetic fixture.",
    "steps": [
      "Filter candidates by the declared 50ms latency gate.",
      "Maximize validation F1 only over the eligible candidates.",
      "Identify candidate c and count the two eligible records."
    ],
    "limit": "This isolated in-memory fixture checks the shown operation on synthetic inputs using the CPython standard library in the isolated scientific profile. It makes no dataset, model-provider or network calls. It does not establish production accuracy, representative sampling or deployment reliability.",
    "mistakes": [
      "Keep training, validation and final-test metrics distinct.",
      "The fixture filters synthetic run records by a fixed validation and latency gate, then selects the highest remaining validation metric."
    ],
    "takeaways": [
      "Track source code revision, dependency lock, dataset/split ids, transformation configuration, seeds, hyperparameters, training budget and model artifact digest.",
      "A comparison should use a shared task definition and appropriate data boundary, plus an explicit compute or search budget."
    ],
    "practice": [
      [
        "What makes a metric value interpretable?",
        "Metric and population",
        "Only the chart color",
        "Only the run title",
        "Only the model file size",
        "Metric meaning depends on class, aggregation and the observations measured."
      ],
      [
        "Which revision belongs in a run record?",
        "Executed code revision",
        "Only the current branch name",
        "Only a future release tag",
        "Only the author's username",
        "A mutable branch label does not identify historical code bytes."
      ],
      [
        "Why record failed runs?",
        "Cost/failure evidence",
        "Guarantee a higher final score",
        "Remove the need for validation",
        "Make all hyperparameters equivalent",
        "Failures are part of the experiment's observed budget and reliability."
      ],
      [
        "Two runs use accuracy and macro F1 under the same score label. What is missing?",
        "Aligned metric definitions",
        "Only a shared file extension",
        "Only a longer experiment id",
        "Only more decimal places",
        "Different measures cannot be ranked as one shared metric without a justified mapping."
      ],
      [
        "One model gets100 trials and another2. What should be disclosed?",
        "Unequal search budgets",
        "Only the artifact paths",
        "Only class names",
        "Only CPU thread counts",
        "Search budget changes the opportunity to optimize validation performance."
      ],
      [
        "A tracker has a model artifact but no split identity. What cannot be recovered confidently?",
        "Evaluation boundary",
        "The artifact's existence",
        "The ability to print a metric",
        "The language of the code file",
        "The same data source can support different train/test assignments."
      ]
    ],
    "formal": [
      [
        "What is an experiment run id for?",
        "Linking a configuration with its evidence",
        "Proving educational approval",
        "Replacing all version metadata",
        "Guaranteeing statistical significance",
        "An id indexes records; those records must contain the meaningful evidence."
      ],
      [
        "Which metric should ordinarily select hyperparameters?",
        "Development validation metric",
        "Repeated final test metric",
        "Only training-set fit always",
        "The artifact byte count",
        "Validation is the designated model-selection boundary."
      ],
      [
        "Runs A and B have validation F1 .78 and .81 under identical gates. Which is selected by maximum validation F1?",
        "B",
        "A",
        "Neither because scores differ",
        "Both must be identical models",
        "The stated rule picks the higher validation value among eligible candidates."
      ],
      [
        "A team's best validation metric rises after1000 trials but final performance falls. What is plausible?",
        "Selection overfits validation evidence",
        "Validation labels became training tensors necessarily",
        "The final test must be wrong",
        "Every candidate architecture is identical",
        "Repeated search can exploit noise in the development metric."
      ],
      [
        "A run record says seed7 but omits dependency versions. What remains uncertain?",
        "Runtime/trajectory fidelity",
        "Whether7 is an integer",
        "Whether a metric can be printed",
        "Whether code has a filename",
        "Seeds do not fix library behavior or environment differences."
      ],
      [
        "Candidates A(.84,80ms),B(.82,40ms),C(.81,30ms) face a50ms limit and maximize F1. Which wins?",
        "B",
        "A",
        "C",
        "No candidate passes",
        "A violates latency; B has the highest F1 among eligible B and C."
      ],
      [
        "A class report changes positive-class mapping from urgent to routine between runs. What must happen before comparing precision?",
        "Align the class orientation",
        "Only round both values",
        "Only rename the runs",
        "Only equalize file sizes",
        "Precision refers to the declared positive class, so swapped semantics are incomparable."
      ],
      [
        "A metric improvement is .002 while run-to-run standard variation is .02 over a small repeated sample. What is justified?",
        "Ranking remains uncertain",
        "Declare a decisive universal improvement",
        "Ignore variation because the larger value wins",
        "Replace final evaluation with the best observed run",
        "Observed variation is large relative to the claimed improvement, limiting confidence."
      ],
      [
        "A candidate has higher F1 but uses twice the compute budget and a different test period. Which statement is supported?",
        "Model effect remains confounded",
        "The architecture alone caused the gain",
        "The scores are directly causal evidence",
        "Budget and population never affect comparisons",
        "Both resource opportunity and evaluation population changed alongside the model."
      ],
      [
        "A comparison needs reproducible provenance, bounded tuning and independent final reporting. Which record/protocol fits?",
        "Track exact versions/splits/budget; validation selection; frozen test",
        "Track exact versions/splits/budget; test selection; reused test",
        "Track exact versions/splits; omit failed-trial budget; frozen test",
        "Track branch names/latest data/budget; validation selection; frozen test",
        "The provenance record, controlled search and final boundary jointly support a defensible comparison."
      ]
    ]
  },
  {
    "slug": "reproducibility-limits",
    "title": "Reproduce runs while stating numerical and operational limits",
    "intro": "A model trained with the same seed produces a slightly different result after a library upgrade. Random seeds control specified random generators, while numerical kernels, ordering and environment can also affect the trajectory. Reproducibility needs a declared scope.",
    "sections": [
      [
        "Seed control is one ingredient",
        "Record seeds for every relevant random source, data order, algorithm configuration and dependency environment. Some operations are nondeterministic or use order-dependent floating-point reductions. A deterministic setting may reject an unsupported operation or reduce performance. Do not promise identical bytes across all hardware and versions solely because random_state was set.",
        "Distinguish exact replication from statistically comparable performance. For some workflows an output tolerance and stable decision agreement are appropriate; for others a strict byte comparison is required. Define the criterion before seeing a mismatch. If a threshold decision lies near the boundary, a tiny numerical change can still change the business action."
      ],
      [
        "Test what the artifact will run",
        "Pin dependencies and execute a representative inference probe after loading under the target environment. Record shape, schema, numeric tolerance and expected decision behavior. A lock file describes intended packages; a runtime inventory or image digest helps establish what actually ran. Neither replaces trusted loading or data-quality checks.",
        "The fixture uses seeded NumPy generators to show equal seeds reproduce a specified local sample, then checks a numerical tolerance. It does not claim cross-version bit identity, distributed training determinism or a complete container build. The exercise separates a random-sequence check from a numerical acceptance policy."
      ]
    ],
    "code": "import numpy as np\na=np.random.default_rng(7).integers(0,10,4)\nb=np.random.default_rng(7).integers(0,10,4)\nprint(np.array_equal(a,b))\nprint(np.allclose([1.000001],[1.],rtol=0,atol=.00001))",
    "expect": "True\nTrue",
    "lang": "python-pandas",
    "problem": "Reproduce runs while stating numerical and operational limits using the declared synthetic fixture.",
    "steps": [
      "Instantiate two local generators with the same seed.",
      "Compare their four generated integers exactly.",
      "Check a separate absolute numeric tolerance without claiming cross-runtime bit identity."
    ],
    "limit": "This isolated in-memory fixture checks the shown operation on synthetic inputs using actual NumPy 2.3.5. It makes no dataset, model-provider or network calls. It does not establish production accuracy, representative sampling or deployment reliability.",
    "mistakes": [
      "Distinguish exact replication from statistically comparable performance.",
      "The fixture uses seeded NumPy generators to show equal seeds reproduce a specified local sample, then checks a numerical tolerance."
    ],
    "takeaways": [
      "Record seeds for every relevant random source, data order, algorithm configuration and dependency environment.",
      "Pin dependencies and execute a representative inference probe after loading under the target environment."
    ],
    "practice": [
      [
        "What does a fixed random seed support?",
        "Specified RNG repeatability",
        "Identical behavior on all future runtimes",
        "Proof of model generalization",
        "Elimination of every numerical difference",
        "A seed controls its generator under stated implementation assumptions."
      ],
      [
        "What else affects a training trajectory?",
        "Order and kernels",
        "Only the model title",
        "Only class-name capitalization",
        "Only the release note date",
        "Gradient sequences and floating-point behavior can change beyond seed state."
      ],
      [
        "What should a numeric tolerance specify?",
        "Numeric acceptance rule",
        "Only a chart's y-axis color",
        "Only the artifact name",
        "Only the count of labels",
        "Tolerance must define how numerical differences are judged."
      ],
      [
        "A score is near a decision threshold. Why can a tiny change matter?",
        "A decision may flip",
        "It must always be irrelevant",
        "It proves the model is random",
        "It removes every calibration need",
        "Small numerical differences can cross discrete action boundaries."
      ],
      [
        "A lock file exists but the runtime installed different versions. What evidence is missing?",
        "The actual runtime",
        "Only the source filename",
        "Only target label order",
        "Only the number of training rows",
        "Intended dependencies and installed packages can differ."
      ],
      [
        "A seed matches but batch order differs. What should be expected?",
        "Trajectory may differ",
        "Every parameter must stay identical",
        "The loss must be zero",
        "The model becomes an unsupervised learner",
        "Stochastic gradient updates depend on the sequence of examples."
      ]
    ],
    "formal": [
      [
        "What distinguishes byte identity from tolerance agreement?",
        "Exact versus tolerant equality",
        "Training versus inference necessarily",
        "Only model size",
        "Only class count",
        "The acceptance criteria compare outputs at different strictness levels."
      ],
      [
        "When should acceptance tolerances be chosen?",
        "Before interpreting the mismatch",
        "Only after choosing the preferred model",
        "After deleting all failed probes",
        "Only when final labels disappear",
        "A predeclared criterion avoids changing standards to excuse observed results."
      ],
      [
        "With absolute tolerance .001, is1.0005 close to1.0 under rtol0?",
        "Yes",
        "No",
        "Only if rounded to an integer",
        "Only with identical bytes",
        "The absolute difference .0005 is below .001."
      ],
      [
        "A pinned model passes on training hardware but uses a new runtime for serving. What check is relevant?",
        "Target-runtime inference probes",
        "Only a training chart screenshot",
        "Only a new artifact title",
        "Only an increased class count",
        "Deployment compatibility should be tested where the artifact is intended to execute."
      ],
      [
        "A deterministic algorithm setting slows training. Which statement is appropriate?",
        "A speed/repeatability tradeoff",
        "Determinism always increases throughput",
        "The setting proves data labels are valid",
        "The setting replaces experiment lineage",
        "Deterministic execution constraints can restrict kernel choices and performance."
      ],
      [
        "Two outputs differ by .0002 and absolute tolerance is .0001 with rtol0. Does the probe pass?",
        "No",
        "Yes",
        "Only if both are positive",
        "Only if the class names match",
        "The difference exceeds the declared absolute tolerance."
      ],
      [
        "At threshold .5 with predict-positive for score>=.5, outputs .49999 and .50001 give which decisions?",
        "Negative and positive",
        "Both negative",
        "Both positive",
        "Positive and negative",
        "The two values fall on opposite sides of the explicit boundary."
      ],
      [
        "A metric rounds to .90 in both runs but raw values are .8951 and .9049. Which claim is justified?",
        "Equal rounding, unequal raw values",
        "The runs have identical predictions",
        "The underlying floating values are equal",
        "The data splits must be identical",
        "Display rounding can conceal differences in the actual measured quantities."
      ],
      [
        "A run restores weights and seed but not optimizer momentum or data-loader position. Which claim is unsupported?",
        "Exact training continuation",
        "Inference from the restored weights",
        "Recording the current seed",
        "Testing the current model output",
        "Missing historical update and data-order state can alter subsequent steps."
      ],
      [
        "A reproducibility policy needs consistent runtime, honest numeric criteria and stable actions near thresholds. Which plan fits?",
        "Inventory pinned runtime; predeclare tolerance; test boundary actions",
        "Set seed only; predeclare tolerance; assume cross-runtime identity",
        "Inventory runtime; choose tolerance after mismatch; test boundary actions",
        "Inventory pinned runtime; predeclare tolerance; ignore threshold flips",
        "Environment evidence, numeric acceptance and action-boundary tests cover distinct requirements."
      ]
    ]
  },
  {
    "slug": "shadow-canary",
    "title": "Separate shadow evidence from canary decisions",
    "intro": "A replacement risk model looks promising offline. A shadow release can observe its predictions on mirrored traffic without letting those predictions determine the live decision. A canary instead exposes a controlled portion of real decisions to the candidate.",
    "sections": [
      [
        "Define which model has authority",
        "In shadow mode, the incumbent remains authoritative and candidate outputs are isolated from downstream side effects. Mirroring requests can still create cost, privacy and load concerns. Ensure the shadow path cannot charge accounts, send messages or overwrite authoritative scores merely because it receives realistic input.",
        "A canary assigns a limited traffic slice to candidate authority and compares predeclared operational and quality gates. Randomization or another justified assignment policy is needed for interpretable comparison. Keep user or session assignment stable when mixed model behavior would confuse an experience. Delayed labels mean immediate request success is not proof of predictive quality."
      ],
      [
        "Gate expansion under uncertainty",
        "Track latency, error rate, feature validity and model-version exposure immediately; evaluate label-based metrics when outcomes mature. Define minimum sample support and rollback thresholds before expanding. A small canary may miss rare failures, so passing it is evidence within a sample and time window, not a guarantee.",
        "The fixture routes deterministic synthetic identities to a ten-percent canary and leaves shadow outputs nonauthoritative by construction. It does not mirror a live network service or measure traffic performance. Actual assignment, monitoring and side-effect isolation need service integration evidence."
      ]
    ],
    "code": "ids=list(range(20))\ncanary=[i for i in ids if i%10==0]\nprint(canary)\nincumbent={\"score\":.2}\nshadow={\"score\":.8}\nprint(incumbent[\"score\"])",
    "expect": "[0, 10]\n0.2",
    "lang": "python-pandas",
    "problem": "Separate shadow evidence from canary decisions using the declared synthetic fixture.",
    "steps": [
      "Assign synthetic identities divisible by ten to the candidate.",
      "List the two selected ids in a twenty-account fixture.",
      "Read only the incumbent output as authoritative while the shadow result stays separate."
    ],
    "limit": "This isolated in-memory fixture checks the shown operation on synthetic inputs using the CPython standard library in the isolated scientific profile. It makes no dataset, model-provider or network calls. It does not establish production accuracy, representative sampling or deployment reliability.",
    "mistakes": [
      "A canary assigns a limited traffic slice to candidate authority and compares predeclared operational and quality gates.",
      "The fixture routes deterministic synthetic identities to a ten-percent canary and leaves shadow outputs nonauthoritative by construction."
    ],
    "takeaways": [
      "In shadow mode, the incumbent remains authoritative and candidate outputs are isolated from downstream side effects.",
      "Track latency, error rate, feature validity and model-version exposure immediately; evaluate label-based metrics when outcomes mature."
    ],
    "practice": [
      [
        "What gives shadow mode its defining boundary?",
        "No live decision authority",
        "The candidate gets every final label instantly",
        "The candidate replaces all incumbent outputs",
        "No production-shaped input is ever used",
        "Shadowing observes predictions without granting decision authority."
      ],
      [
        "What distinguishes a canary from a pure shadow?",
        "Limited live authority",
        "Only the candidate's filename changes",
        "No real traffic can reach it",
        "All decisions stay with the incumbent",
        "A canary has limited authoritative exposure."
      ],
      [
        "Why keep assignment stable per session when needed?",
        "Session consistency",
        "Guarantee perfect model accuracy",
        "Eliminate all monitoring",
        "Make every score identical",
        "Stable assignment can preserve a coherent user experience across related requests."
      ],
      [
        "A shadow path sends real customer notifications. What is violated?",
        "Side-effect isolation",
        "Only feature standardization",
        "Only output tensor shape",
        "Only the model's training rate",
        "Shadow predictions should not trigger authoritative downstream actions."
      ],
      [
        "A canary passes latency checks before outcome labels arrive. What remains unverified?",
        "Mature label quality",
        "That requests returned in time",
        "That latency was measured",
        "That a model version exists",
        "Operational success and predictive correctness require different evidence."
      ],
      [
        "A canary gets only easy customers while incumbent gets hard cases. What needs review?",
        "Comparable assignment",
        "Only the artifact byte count",
        "Only the number of CPU threads",
        "Only class-name sorting",
        "Systematic population differences confound the release comparison."
      ]
    ],
    "formal": [
      [
        "What should be declared before canary expansion?",
        "Expansion/rollback gates",
        "Only the release title",
        "Only a preferred color chart",
        "Only the new model's training loss",
        "Predeclared criteria reduce opportunistic interpretation of release evidence."
      ],
      [
        "What can a small canary fail to observe?",
        "Rare failures",
        "Every common request",
        "Any model version",
        "Any latency value",
        "Limited exposure provides weak evidence about infrequent events."
      ],
      [
        "A10% canary over10000 requests expects roughly how many candidate decisions under balanced assignment?",
        "1000",
        "100",
        "9000",
        "10",
        "Ten percent of10000 is1000; actual randomized counts can vary."
      ],
      [
        "A shadow candidate has lower offline loss but writes live feature state. What should happen?",
        "Remove unintended authority",
        "Call it pure observation because labels are delayed",
        "Expand it immediately because loss improved",
        "Ignore the writes if response latency is low",
        "Side effects cross the defining shadow boundary regardless of offline metrics."
      ],
      [
        "A canary's sample is too small for the minimum quality gate. Which action respects the protocol?",
        "Observe; gate remains unpassed",
        "Treat absence of failures as certain safety",
        "Drop the sample-size requirement after seeing results",
        "Use training labels as current outcomes",
        "Insufficient support cannot establish a predeclared quality threshold."
      ],
      [
        "Candidate sees500 requests with10 errors; incumbent sees1000 with10 errors. What are error rates?",
        "2% and1%",
        "1% and2%",
        "10% and10%",
        ".2% and.1%",
        "Rates normalize by each arm's own exposure:10/500=.02 and10/1000=.01."
      ],
      [
        "A rollout gate permits error rate<=1% and p95<=100ms. Candidate has error .8%,p95=120ms. What follows?",
        "It fails the latency gate",
        "It passes because errors are low",
        "It passes because the average is unspecified",
        "It fails the error gate only",
        "Both gates must hold;120ms exceeds100ms."
      ],
      [
        "A fixed routing rule uses account_id mod20==0. In ids0through99, how many candidate accounts are selected?",
        "5",
        "20",
        "10",
        "1",
        "The selected ids are0,20,40,60,80."
      ],
      [
        "A candidate has better observed recall but labels exist for only20% of its recent traffic while incumbent labels are mature. What limits the comparison?",
        "Outcome-maturity mismatch",
        "The existence of a recall formula",
        "The number of model files",
        "The ability to count requests",
        "Label availability can change the evaluated population and bias early quality comparisons."
      ],
      [
        "A release needs no side effects during observation, stable canary assignment and mature quality evidence before expansion. Which plan meets all three?",
        "Isolate shadow effects; stable canary identity; mature supported labels",
        "Isolate shadow effects; per-click rerouting; mature supported labels",
        "Permit shadow writes; stable canary identity; mature supported labels",
        "Isolate shadow effects; stable canary identity; latency-only expansion",
        "The authority boundary, assignment unit and outcome timing are separate conditions for a controlled rollout."
      ]
    ],
    "comps": [
      "m3.c1"
    ]
  },
  {
    "slug": "retrain-orchestration",
    "title": "Automate retraining with immutable stage outputs",
    "intro": "A weekly training pipeline reads new labels, builds features and produces a candidate. Automation should make the stages repeatable and recoverable. A scheduled job that overwrites the live model whenever training exits successfully is an uncontrolled release process.",
    "sections": [
      [
        "Use a dependency graph of artifacts",
        "A pipeline can separate snapshot validation, feature construction, training, evaluation and registration. Each stage consumes versioned inputs and writes immutable outputs or performs an explicitly idempotent replacement. Record run identity and stage status so retries can resume from valid outputs without mixing data from different runs.",
        "Retries should target transient failures and preserve logical operation identity. An invalid schema or failed quality gate will not be repaired by repeatedly running the same inputs. Distinguish execution success from candidate eligibility. Keep the currently served artifact independent from a partially completed training run."
      ],
      [
        "Cache by all relevant inputs",
        "A cache key must include the data version, transformation/code version and relevant configuration. A cache keyed only by filename can silently reuse stale features after data changes. Recompute or invalidate downstream stages when a dependency changes. Bounded resource and time limits stop a malformed input from consuming the entire training budget.",
        "The fixture models a tiny stage dependency graph and computes the downstream invalidation set after a feature change. It is a local orchestration reasoning exercise, not an Airflow deployment or a scheduler integration. Actual pipeline systems also need durable state, access control and failure-path verification."
      ]
    ],
    "code": "deps={\"features\":[\"data\"],\"train\":[\"features\"],\"evaluate\":[\"train\"],\"register\":[\"evaluate\"]}\nchanged={\"features\"}\nwhile True:\n new=changed|{s for s,ds in deps.items() if any(d in changed for d in ds)}\n if new==changed: break\n changed=new\nprint(sorted(changed))",
    "expect": "['evaluate', 'features', 'register', 'train']",
    "lang": "python-pandas",
    "problem": "Automate retraining with immutable stage outputs using the declared synthetic fixture.",
    "steps": [
      "Start the invalidation set with changed features.",
      "Repeatedly add stages that depend on an invalidated stage.",
      "Print the fixed-point set without invalidating the unchanged source snapshot."
    ],
    "limit": "This isolated in-memory fixture checks the shown operation on synthetic inputs using the CPython standard library in the isolated scientific profile. It makes no dataset, model-provider or network calls. It does not establish production accuracy, representative sampling or deployment reliability.",
    "mistakes": [
      "Retries should target transient failures and preserve logical operation identity.",
      "The fixture models a tiny stage dependency graph and computes the downstream invalidation set after a feature change."
    ],
    "takeaways": [
      "A pipeline can separate snapshot validation, feature construction, training, evaluation and registration.",
      "A cache key must include the data version, transformation/code version and relevant configuration."
    ],
    "practice": [
      [
        "What should each retraining stage consume?",
        "Versioned stage inputs",
        "Whatever mutable file is newest",
        "Only the final model title",
        "Only the previous progress percentage",
        "Explicit dependencies prevent mixing incompatible run state."
      ],
      [
        "What does idempotent stage behavior support?",
        "Repeat-safe stage delivery",
        "A new output identity on every retry",
        "Guaranteed model improvement",
        "Automatic label availability",
        "Retries should not duplicate or corrupt the same intended result."
      ],
      [
        "What separates job success from release eligibility?",
        "Quality and policy gates",
        "Only the process filename",
        "Only the number of training epochs",
        "Only a zero exit code",
        "Successful execution can still produce an unsuitable model."
      ],
      [
        "A schema-validation failure is retried unchanged ten times. What is the issue?",
        "Repair invalid inputs",
        "Every retry creates new valid labels",
        "Training success is guaranteed on attempt11",
        "A larger timeout fixes field semantics",
        "Repeating identical invalid input does not satisfy its schema."
      ],
      [
        "A feature cache key contains only filename. What can go wrong?",
        "Stale cache reuse",
        "The model must become linear",
        "Every batch size becomes one",
        "The cache can no longer store bytes",
        "A stable path is not identity for changing inputs or code."
      ],
      [
        "A failed new run overwrites the served artifact early. What boundary was lost?",
        "Candidate/live separation",
        "Only the class label order",
        "Only the pipeline diagram style",
        "Only the optimizer momentum buffer",
        "Partial training should not mutate the authoritative model artifact."
      ]
    ],
    "formal": [
      [
        "What does a pipeline dependency edge express?",
        "A stage requires another stage's output",
        "Only that two titles are similar",
        "That both stages always run in parallel",
        "That both use the same target label",
        "Dependencies define execution and invalidation order."
      ],
      [
        "Which failure is a plausible transient retry case?",
        "A temporary permitted storage timeout",
        "A permanently missing required field",
        "An explicitly failed accuracy gate",
        "A prohibited data-source policy",
        "A temporary service condition may succeed later with unchanged valid work."
      ],
      [
        "If data changes and features depend on data, what stage first needs recomputation?",
        "Features",
        "Only release notes",
        "Only display metrics",
        "No stage if the filename is fixed",
        "Derived features depend on changed input data."
      ],
      [
        "A training step succeeds but evaluation gate fails. What should registration/release do?",
        "Keep the candidate ineligible under the gate",
        "Promote it because execution returned zero",
        "Replace evaluation labels with predictions",
        "Skip the gate on the second retry",
        "Execution completion does not override eligibility requirements."
      ],
      [
        "Two workers retry the same registration with new random logical ids. What risk grows?",
        "Duplicate candidate registrations",
        "Guaranteed extra training accuracy",
        "Elimination of stale caches",
        "Automatic rollback safety",
        "Stable operation identity is needed to deduplicate repeated logical work."
      ],
      [
        "A graph is data→features→train→evaluate. Changing features invalidates which listed stages?",
        "Features→train→evaluate",
        "Data only",
        "Evaluate only",
        "Train only",
        "The changed stage and its downstream consumers must not reuse stale results."
      ],
      [
        "A cache key is hash(data_id,code_id,config). Only config changes. What should happen?",
        "A new key and recomputation",
        "Reuse the old entry unconditionally",
        "Only rename the metric chart",
        "Delete unrelated source snapshots",
        "Configuration is a declared dependency of cached output."
      ],
      [
        "A job can retry twice after its initial attempt, and each attempt lasts at most5min. Ignoring backoff, what is maximum attempt runtime?",
        "15min",
        "10min",
        "5min",
        "20min",
        "One initial attempt plus two retries totals three attempts of five minutes."
      ],
      [
        "A pipeline resumes evaluation from runA but loads features regenerated for runB under the same mutable path. What is the failure?",
        "Mixed-run artifacts",
        "Only a slow scheduler tick",
        "Only a label-name typo",
        "A guarantee of fresh evaluation",
        "Immutable run-scoped references prevent one stage from silently consuming another run's artifacts."
      ],
      [
        "A retraining system needs recoverable retries, fresh features and no accidental deployment. Which design fits?",
        "Stable run ids; full cache keys; immutable outputs; promotion gate",
        "Random retry ids; full cache keys; immutable outputs; promotion gate",
        "Stable run ids; filename cache keys; mutable outputs; promotion gate",
        "Stable run ids; full cache keys; immutable outputs; train-exit promotion",
        "Identity, dependency-aware invalidation and separate release authority cover the stated requirements."
      ]
    ],
    "comps": [
      "m3.c2"
    ]
  },
  {
    "slug": "rollback-gates",
    "title": "Promote and roll back complete compatible artifacts",
    "intro": "A canary breaches the error-rate gate and the team restores yesterday's weight file. Predictions still fail because preprocessing and output schema remain at today's versions. Rollback must restore a compatible inference contract, not just a familiar filename.",
    "sections": [
      [
        "A release points to a verified bundle",
        "A registry can record candidate, validated and released states without equating them with human educational approval. Promotion should reference an immutable bundle of model, preprocessing, schema and runtime compatibility evidence. Use an atomic pointer or equivalent consistency mechanism so requests do not observe half old and half new components.",
        "Keep a tested previous bundle and a clear rollback trigger. A database or feature-store schema migration can make an old model incompatible even when its bytes are preserved. Design backward compatibility or a separate recovery plan before rollout. Rollback cannot retroactively undo decisions or external side effects already made."
      ],
      [
        "Retraining triggers are proposals, not correctness proofs",
        "A schedule, drift alert or new-label threshold can start a candidate pipeline. Evaluate schema, data quality, label maturity, model metrics, latency and required group constraints before promotion. Drift does not necessarily imply degraded accuracy; a retrained candidate can be worse. Keep candidate generation separate from authorization to replace the served model.",
        "The fixture evaluates synthetic candidate gate records and switches a local release pointer only for an eligible bundle. It is a decision trace, not a real registry, atomic distributed update or incident rollback. Production evidence must include compatibility and failure-path exercises under the actual release mechanism."
      ]
    ],
    "code": "def eligible(r):\n return r[\"f1\"]>=.8 and r[\"p95\"]<=100 and r[\"schema\"]==\"v1\"\nlive=\"bundle-old\"\ncandidate={\"id\":\"bundle-new\",\"f1\":.83,\"p95\":120,\"schema\":\"v1\"}\nif eligible(candidate): live=candidate[\"id\"]\nprint(live)\nprint(eligible({\"f1\":.82,\"p95\":90,\"schema\":\"v1\"}))",
    "expect": "bundle-old\nTrue",
    "lang": "python-pandas",
    "problem": "Promote and roll back complete compatible artifacts using the declared synthetic fixture.",
    "steps": [
      "Test candidate quality, p95 latency and schema against all gates.",
      "Keep the old local pointer when the candidate violates latency.",
      "Verify that a separate compatible candidate passes the eligibility function."
    ],
    "limit": "This isolated in-memory fixture checks the shown operation on synthetic inputs using the CPython standard library in the isolated scientific profile. It makes no dataset, model-provider or network calls. It does not establish production accuracy, representative sampling or deployment reliability.",
    "mistakes": [
      "Keep a tested previous bundle and a clear rollback trigger.",
      "The fixture evaluates synthetic candidate gate records and switches a local release pointer only for an eligible bundle."
    ],
    "takeaways": [
      "A registry can record candidate, validated and released states without equating them with human educational approval.",
      "A schedule, drift alert or new-label threshold can start a candidate pipeline."
    ],
    "practice": [
      [
        "What should rollback restore?",
        "Compatible bundle",
        "Only yesterday's model title",
        "Only the training loss chart",
        "Only the current raw request",
        "Weights depend on preprocessing, schema and runtime contracts."
      ],
      [
        "What does an immutable release pointer identify?",
        "Exact served bundle",
        "Every future experiment automatically",
        "Only a mutable candidate filename",
        "Only the team's preferred model family",
        "A release reference should resolve to one verified artifact set."
      ],
      [
        "What can a drift alert trigger safely?",
        "Candidate investigation",
        "Automatic proof the new model is better",
        "Deletion of all incumbent metrics",
        "A guaranteed live promotion",
        "Drift is a signal to investigate, not evidence of replacement quality."
      ],
      [
        "An old model cannot read the new feature schema. What must rollout planning include?",
        "Compatibility/recovery",
        "Only a larger canary percentage",
        "Only a new model nickname",
        "Only more training epochs",
        "Rollback viability depends on the surrounding data and serving contract."
      ],
      [
        "A model was rolled back after sending real actions. What remains true?",
        "Past effects remain",
        "Rollback erases every external action",
        "All historical decisions are automatically recomputed",
        "The old artifact changes all past labels",
        "Restoring inference does not undo already executed downstream effects."
      ],
      [
        "A scheduled retrain produces lower validation F1. What should promotion do?",
        "Keep gated incumbent",
        "Release because the candidate is newer",
        "Ignore validation because the schedule ran",
        "Replace labels to improve the score",
        "Recency and job completion do not establish better model quality."
      ]
    ],
    "formal": [
      [
        "What is promotion doing in a model release process?",
        "Assigning live authority",
        "Only computing training loss",
        "Only creating a random seed",
        "Only counting labels",
        "Promotion changes which validated bundle is used for live decisions."
      ],
      [
        "What should a rollback trigger be?",
        "A declared gate breach",
        "Only the newest model filename",
        "Only an increase in training epochs",
        "Only the author's preference after the result",
        "Explicit criteria support predictable response to observed failures."
      ],
      [
        "A gate requires F1>=.8 and p95<=100ms. Candidate(.82,110ms) is what?",
        "Ineligible",
        "Eligible",
        "Eligible only because F1 is high",
        "Guaranteed superior to incumbent",
        "The candidate violates the latency requirement despite meeting F1."
      ],
      [
        "A release changes model and scaler in two independent non-atomic writes. What can a request observe?",
        "Mixed bundle exposure",
        "Only the fully new pair",
        "Only the fully old pair",
        "No inference function at all necessarily",
        "Requests between updates can combine old and new components."
      ],
      [
        "A drift monitor fires after a harmless seasonal text change. What is not established?",
        "Degraded accuracy",
        "A measured input-distribution difference",
        "A reason to investigate",
        "A possible candidate evaluation need",
        "Input drift and outcome degradation are related possibilities, not identical facts."
      ],
      [
        "A candidate gate requires error<=1%,latency<=80ms. A has(.8%,70ms),B(.5%,90ms),C(1.2%,60ms). Which qualifies?",
        "A only",
        "B only",
        "C only",
        "A andB",
        "A meets both; B violates latency and C violates error."
      ],
      [
        "A rollback retains old weights but not their category encoder. What risk persists?",
        "Encoder/weight mismatch",
        "The model must return exactly the same outputs",
        "The artifact becomes newer automatically",
        "The old labels are recreated from filenames",
        "The encoder is part of the old function and may be required for valid rollback."
      ],
      [
        "A pipeline triggers after1000 new mature labels. It has1200 new rows but300 lack outcomes. Should this label-count trigger fire?",
        "No, only900 labels are mature",
        "Yes, all1200 rows count as labels",
        "Yes,300 missing labels exceed the limit",
        "No, at least2000 raw rows are always needed",
        "The rule counts mature labels, and1200-300=900 is below1000."
      ],
      [
        "A release pointer switches atomically, but the prior bundle fails the new API response schema. What conclusion follows?",
        "Atomicity is insufficient",
        "Atomicity guarantees every old API contract still works",
        "The new model's accuracy repairs schema mismatch",
        "Only the training dataset checksum matters",
        "Consistency of switching and compatibility of the selected bundle are separate requirements."
      ],
      [
        "A team needs drift-driven candidate generation, quality-gated authority and viable rollback. Which workflow fits?",
        "Trigger candidates; evaluate gates; promote complete bundle; test predecessor",
        "Trigger drift; auto-promote weights; evaluate later; retain predecessor",
        "Trigger candidates; evaluate gates; switch components separately; retain weights",
        "Trigger candidates; evaluate gates; promote complete bundle; untested predecessor",
        "The trigger, eligibility decision and recovery bundle each require an explicit boundary."
      ]
    ],
    "comps": [
      "m3.c1",
      "m3.c2"
    ]
  }
],[
  {
    "id": "mlops-compose",
    "title": "scikit-learn 1.8.0 pipelines and preprocessing",
    "url": "https://github.com/scikit-learn/scikit-learn/blob/646da0f072a8afef6a980aa427a710311e67eb9d/doc/modules/compose.rst",
    "source": {
      "repo": "scikit-learn/scikit-learn",
      "commit": "646da0f072a8afef6a980aa427a710311e67eb9d",
      "path": "doc/modules/compose.rst",
      "verification": "Official pinned Git source read; local isolated worked examples execute against the declared runtime. Human educational review remains pending."
    }
  },
  {
    "id": "mlops-persistence",
    "title": "scikit-learn 1.8.0 model persistence and trusted loading",
    "url": "https://github.com/scikit-learn/scikit-learn/blob/646da0f072a8afef6a980aa427a710311e67eb9d/doc/model_persistence.rst",
    "source": {
      "repo": "scikit-learn/scikit-learn",
      "commit": "646da0f072a8afef6a980aa427a710311e67eb9d",
      "path": "doc/model_persistence.rst",
      "verification": "Official pinned Git source read; local isolated worked examples execute against the declared runtime. Human educational review remains pending."
    }
  },
  {
    "id": "mlops-pitfalls",
    "title": "scikit-learn 1.8.0 leakage and reproducibility",
    "url": "https://github.com/scikit-learn/scikit-learn/blob/646da0f072a8afef6a980aa427a710311e67eb9d/doc/common_pitfalls.rst",
    "source": {
      "repo": "scikit-learn/scikit-learn",
      "commit": "646da0f072a8afef6a980aa427a710311e67eb9d",
      "path": "doc/common_pitfalls.rst",
      "verification": "Official pinned Git source read; local isolated worked examples execute against the declared runtime. Human educational review remains pending."
    }
  },
  {
    "id": "mlops-inspection",
    "title": "scikit-learn 1.8.0 model selection",
    "url": "https://github.com/scikit-learn/scikit-learn/blob/646da0f072a8afef6a980aa427a710311e67eb9d/doc/model_selection.rst",
    "source": {
      "repo": "scikit-learn/scikit-learn",
      "commit": "646da0f072a8afef6a980aa427a710311e67eb9d",
      "path": "doc/model_selection.rst",
      "verification": "Official pinned Git source read; local isolated worked examples execute against the declared runtime. Human educational review remains pending."
    }
  },
  {
    "id": "mlops-canary",
    "title": "Google SRE Workbook: Canarying Releases",
    "url": "https://sre.google/workbook/canarying-releases/",
    "source": {
      "kind": "official-http-snapshot",
      "repo": "google/official-documentation-snapshots",
      "path": "canarying-releases.html",
      "url": "https://sre.google/workbook/canarying-releases/",
      "sha256": "2129ec6fefdb7807073a7877344e7f0409c27e4fde1021d30114a38338fd039f",
      "fetched_at": "2026-11-11T10:18:57.435364+00:00"
    }
  }
]);
