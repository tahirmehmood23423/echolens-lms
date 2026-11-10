'use strict';
const {course}=require('./ml-wave3-helper');
module.exports=course("feature-eng-evaluation",[
  {
    "slug": "decision-time-features",
    "title": "Construct date and history features as of the decision",
    "intro": "A parcel dispatcher predicts delays at booking. Calendar features describe the booking instant; customer history must stop before that instant. A feature definition therefore includes its event timestamp, availability timestamp, units and missing-value policy.",
    "sections": [
      [
        "Build the decision rule",
        "Datetime parsing alone does not establish a correct feature. Convert timestamps to the operational timezone before extracting local hour or weekday. Elapsed durations should use a consistent time basis so daylight-saving changes do not silently change arithmetic. A weekday integer is a label for a cycle, not necessarily a linear effect; sine and cosine can represent adjacency between the end and start of a cycle."
      ],
      [
        "Check the engineering boundary",
        "Historical aggregation must exclude the current outcome and future events. A shifted expanding count or a backward as-of join can enforce that boundary when ordering and entity keys are correct. Late-arriving corrections require historical snapshots for honest backtests. Audit a small timeline manually before evaluating a model because a perfectly fitted estimator cannot repair an impossible information set."
      ]
    ],
    "problem": "Construct date and history features as of the decision on a small synthetic fixture.",
    "steps": [
      "State the input and decision-time assumptions.",
      "Run the shown calculation and compare the printed result.",
      "Explain which conclusion the fixture supports and which assumptions require another check."
    ],
    "code": "import pandas as pd\nd=pd.DataFrame({\"customer\":[\"a\",\"a\",\"b\"],\"amount\":[4,8,3]})\nd[\"prior_count\"]=d.groupby(\"customer\").cumcount()\nprint(d.prior_count.tolist())\nt=pd.to_datetime([\"2026-11-09T23:30:00Z\"],utc=True)\nprint(t.tz_convert(\"Asia/Karachi\").hour.tolist())",
    "expect": "[0, 1, 0]\n[4]",
    "limit": "This synthetic in-memory example verifies the displayed operation under scikit-learn 1.8.0. It does not establish production accuracy, causal impact, representative sampling or acceptable error costs. Historical aggregation must exclude the current outcome and future events.",
    "mistakes": [
      "Do not substitute a convenient representation for the stated decision rule. Datetime parsing alone does not establish a correct feature.",
      "Do not generalize this tiny fixture beyond its sampling and information boundary. Historical aggregation must exclude the current outcome and future events."
    ],
    "takeaways": [
      "Datetime parsing alone does not establish a correct feature.",
      "Historical aggregation must exclude the current outcome and future events."
    ],
    "practice": [
      "What defines a decision-time feature?|Decision-time information|Any value in the final table|Only target-correlated values|Only normalized values|Availability is an operational property rather than a correlation statistic.",
      "What does a customer history count summarize?|Earlier customer events|Future outcomes|All customers jointly|Only current target|A legitimate history feature uses earlier records for that entity.",
      "Why encode an hour cyclically?|Midnight adjacency|Make all hours equal|Remove every seasonal effect|Guarantee accuracy|A cycle places the last and first hour near one another geometrically.",
      "A booking is recorded in UTC but staffing follows local time. Which transformation matters?|Convert before hour extraction|Sort target labels|Round all dates to months|Drop timezone metadata first|Local calendar meaning requires the appropriate timezone conversion.",
      "A historical customer mean includes the current row outcome. What is wrong?|Outcome leakage|Class imbalance only|Feature sparsity only|Date formatting only|The feature includes the label it is intended to predict.",
      "A data correction arrived after a past forecast. Which snapshot belongs in its backtest?|The version available then|Latest corrected version always|The final outcome table|Any larger snapshot|Historical evaluation must reproduce the information available at the decision."
    ],
    "formal": [
      "What is an as-of feature boundary?|As-of availability|Largest outcome|Future observation|Alphabetical event order|The boundary chooses information that already existed at the decision time.",
      "Which quantity is a calendar attribute?|Local weekday|Refund|Final status|Next-month churn label|Weekday can be known at prediction time without observing the target.",
      "A delivery business sees strong hour effects. Why retain timezone policy with the model?|Timezone semantics|Accuracy proof|Class balance|Missing-value elimination|The same instant maps to different local hours under different timezone conventions.",
      "A merchant has no prior purchases. What feature policy is defensible?|Cold-start policy|Next purchase|Invent events|Exclude them silently|A missing history is a real serving condition that needs a documented representation.",
      "A rolling average uses a centered window. What must be checked?|Future-window leakage|Column naming style|Numeric target scale|Dependency version|Centered windows can include observations after the prediction instant.",
      "A dashboard sorts customer histories by invoice number. What could invalidate cumcount as prior history?|Incorrect time order|Multiple entities|Integer count|Named history column|A prior-event count requires correct entity and temporal ordering.",
      "A forecast is issued at noon. One transaction occurred at 10:00 but arrived at 13:00; another occurred yesterday and arrived at 09:00. Which history is eligible?|Only yesterday's available event|Both events by occurrence time|Only today's earlier event|Neither event before model refit|Eligibility depends on both prior occurrence and actual availability at the decision.",
      "A same-customer rolling feature uses the prior seven rows after sorting all customers together. What repair is needed before evaluation?|Entity-local temporal windows|Only global chronological sort|Only training-target scaling|Only seven-row gap at split|The window must respect entity membership and actual temporal availability rather than arbitrary neighboring rows.",
      "A booking predates the training cutoff by ten days but its label matures after thirty days. What should the historical fitting simulation do?|Exclude its immature outcome|Include it because event is old|Use its latest finalized label|Assign a temporary negative label|A historical learner cannot use a label that was not yet available at its fitting cutoff.",
      "A feature store rewrites old values and retains arrival times. The model predicts future weeks at new sites. Which protocol is adequate?|As-of joins plus site-time boundary|Latest values with a random split|As-of joins with row stratification|Latest values with only a time gap|Historical information availability and both deployment dimensions must be enforced together."
    ],
    "comps": [
      "m1.c1"
    ]
  },
  {
    "slug": "text-representation",
    "title": "Fit a text vocabulary inside the training procedure",
    "intro": "A support classifier receives ticket text at creation time. A bag-of-words representation turns documents into counts, while TF-IDF discounts terms common across the fitting documents. The learned vocabulary and document frequencies are model state.",
    "sections": [
      [
        "Build the decision rule",
        "CountVectorizer tokenizes each document and builds a vocabulary during fit. Transform reuses that vocabulary, so new tokens usually do not create new columns. TfidfVectorizer combines term frequency with inverse document frequency and optionally normalizes rows. Analyzer choices such as word n-grams versus character n-grams trade semantic context, typo tolerance and feature count."
      ],
      [
        "Check the engineering boundary",
        "Place vectorization in the Pipeline evaluated by cross-validation. Fitting vocabulary or document frequencies on held-out text consumes information about the evaluation population even without labels. Strip fields appended after resolution, preserve meaningful negation and compare sparse linear baselines before expanding the representation. A sparse matrix can still become costly if the vocabulary grows without bounds.",
        "Vocabulary pruning with min_df, max_df or max_features is a feature-selection decision fitted inside each training fold. Tune these bounds using development evidence rather than held-out document counts."
      ]
    ],
    "problem": "Fit a text vocabulary inside the training procedure on a small synthetic fixture.",
    "steps": [
      "State the input and decision-time assumptions.",
      "Run the shown calculation and compare the printed result.",
      "Explain which conclusion the fixture supports and which assumptions require another check."
    ],
    "code": "from sklearn.feature_extraction.text import CountVectorizer\nv=CountVectorizer().fit([\"late parcel\",\"parcel arrived\"])\nprint(v.get_feature_names_out().tolist())\nprint(v.transform([\"new parcel\"]).toarray().tolist())",
    "expect": "['arrived', 'late', 'parcel']\n[[0, 0, 1]]",
    "limit": "This synthetic in-memory example verifies the displayed operation under scikit-learn 1.8.0. It does not establish production accuracy, causal impact, representative sampling or acceptable error costs. Place vectorization in the Pipeline evaluated by cross-validation.",
    "mistakes": [
      "Do not substitute a convenient representation for the stated decision rule. CountVectorizer tokenizes each document and builds a vocabulary during fit.",
      "Do not generalize this tiny fixture beyond its sampling and information boundary. Place vectorization in the Pipeline evaluated by cross-validation."
    ],
    "takeaways": [
      "CountVectorizer tokenizes each document and builds a vocabulary during fit.",
      "Place vectorization in the Pipeline evaluated by cross-validation."
    ],
    "practice": [
      "What does a fitted vocabulary define?|Token-to-column mapping|True ticket outcomes|Future word meanings|Customer permissions|The vocabulary fixes the representation used by subsequent transforms.",
      "What does inverse document frequency downweight?|Common corpus terms|Every short document|All rare labels|Only numeric targets|Common corpus terms receive less discriminative weight under IDF.",
      "What is a bigram?|Two adjacent tokens|Two target classes|Two CV folds|Two documents merged|Word bigrams represent neighboring token pairs.",
      "A new ticket contains an unseen word. What happens under a fixed CountVectorizer vocabulary?|It adds no new vocabulary column|The model is refitted automatically|The target becomes missing|All known words disappear|Transform applies learned columns and ignores out-of-vocabulary tokens.",
      "A cleaning rule removes the word not. What can be lost?|Negation meaning|Only whitespace|All label imbalance|All matrix sparsity|Removing negation can reverse the represented meaning of a message.",
      "A sparse text pipeline is converted to a dense array. What risk increases?|Memory consumption|Guaranteed leakage removal|Automatic calibration|Label completeness|Dense storage allocates space for many zero-valued entries."
    ],
    "formal": [
      "Which object learns document-frequency statistics?|TF-IDF transformer|Confusion matrix|Label support report|Decision threshold|IDF derives weights from frequencies across fitting documents.",
      "Which representation can tolerate spelling fragments?|Character n-grams|Ticket length alone|Sorted target labels|Row index encoding|Character fragments can overlap even when whole words differ.",
      "A classifier includes an agent-written resolution appended after closure. What must change?|Post-decision leakage|Larger vocabulary|Additional CV folds|Row normalization|The resolution is unavailable when an incoming ticket is classified.",
      "A team fits TF-IDF on all documents before CV. Which state leaked?|Corpus statistics|Only labels|Only weights|Only policy thresholds|Held-out text influenced learned representation statistics.",
      "A legal classifier needs phrase order that unigrams lose. Which addition is appropriate to test?|Word n-grams|Target label sorting|Random record ids|Outcome centering|Adjacent token features can represent short phrase context absent from unigram counts.",
      "An acronym is split incorrectly by the tokenizer. What should be inspected?|Tokenizer rules|Classifier depth|Report formatting|Class prior alone|Tokenization rules determine which textual units enter the feature matrix.",
      "A sender writes twenty similar tickets. A vectorizer is fitted inside ordinary shuffled CV and scores highly. The goal is unseen-sender performance. What remains to fix?|Sender-disjoint evaluation folds|Only vocabulary fitting location|Only row normalization setting|Only a larger n-gram range|Fold-local vectorization prevents representation leakage but does not remove sender dependence across folds.",
      "A product launch increases unknown words while accuracy on delayed labels is not yet available. What can monitoring conclude now?|Representation coverage shifted|Predictive accuracy improved|Probability calibration failed|The labels are certainly wrong|Coverage is observable immediately but its effect on predictive quality requires outcome evidence.",
      "A negation-preserving tokenizer improves after analysts inspect final-test errors. What is required for the final accuracy claim?|Fresh evaluation of frozen pipeline|Reuse the best inspected test score|Refit vocabulary on the final test|Average all inspected test scores|Tokenizer development consumed the prior test; the chosen complete procedure needs independent evidence.",
      "A text selector tunes min_df and classifier regularization for new-hospital generalization. Which outer-fold design is adequate?|Hold out hospitals and refit all steps|Global vocabulary with grouped model|Row folds with fold-local vocabulary|Hospital folds with global selector|All learned representation and tuning steps must be fitted within the relevant hospital-disjoint training boundary."
    ],
    "comps": [
      "m1.c1"
    ]
  },
  {
    "slug": "selection-cardinality",
    "title": "Control selection and category complexity within folds",
    "intro": "A subscription team has thousands of merchant categories and many correlated signals. More columns can improve expressiveness while reducing support per estimate. Feature selection and category reduction must therefore be learned as part of the evaluated training procedure.",
    "sections": [
      [
        "Build the decision rule",
        "Univariate selectors rank each feature against the target independently; they can miss interactions and retain redundant correlated features. Model-based selection depends on the estimator and regularization. SelectKBest belongs inside a Pipeline so validation labels do not influence the selected columns. Selection changes the whole procedure and should be compared against a credible unselected baseline."
      ],
      [
        "Check the engineering boundary",
        "OneHotEncoder can group infrequent categories using min_frequency or max_categories. TargetEncoder uses category outcomes and requires special care: its fit_transform uses cross-fitting to reduce training leakage, while fit followed by transform is not equivalent on the training set. Group and time dependencies can demand a custom encoding design. Monitor unknown-category behavior and never treat arbitrary identifiers as inherently predictive."
      ]
    ],
    "problem": "Control selection and category complexity within folds on a small synthetic fixture.",
    "steps": [
      "State the input and decision-time assumptions.",
      "Run the shown calculation and compare the printed result.",
      "Explain which conclusion the fixture supports and which assumptions require another check."
    ],
    "code": "from sklearn.feature_selection import SelectKBest,f_regression\nfrom sklearn.pipeline import make_pipeline\nfrom sklearn.linear_model import LinearRegression\np=make_pipeline(SelectKBest(f_regression,k=1),LinearRegression())\np.fit([[0,1],[1,0],[2,1],[3,0]],[0,2,4,6])\nprint(p[0].get_support().tolist())\nprint(p.predict([[4,1]]).round(6).tolist())",
    "expect": "[True, False]\n[8.0]",
    "limit": "This synthetic in-memory example verifies the displayed operation under scikit-learn 1.8.0. It does not establish production accuracy, causal impact, representative sampling or acceptable error costs. OneHotEncoder can group infrequent categories using min_frequency or max_categories.",
    "mistakes": [
      "Do not substitute a convenient representation for the stated decision rule. Univariate selectors rank each feature against the target independently; they can miss interactions and retain redundant correlated features.",
      "Do not generalize this tiny fixture beyond its sampling and information boundary. OneHotEncoder can group infrequent categories using min_frequency or max_categories."
    ],
    "takeaways": [
      "Univariate selectors rank each feature against the target independently; they can miss interactions and retain redundant correlated features.",
      "OneHotEncoder can group infrequent categories using min_frequency or max_categories."
    ],
    "practice": [
      "What does univariate selection assess?|Each feature separately against target|Every possible interaction jointly|Only serving latency|Only input types|A univariate score evaluates marginal association rather than all joint effects.",
      "Where should supervised feature selection fit?|Inside each training fold|On the full labeled table first|On final test labels|Only after publication|The selected representation must exclude validation outcomes.",
      "Why group rare categories?|Pool category evidence|Create new labels|Guarantee fairness|Eliminate all drift|Pooling can reduce width and unstable estimates for tiny categories.",
      "Two correlated features both rank highly. What is possible?|Redundant retained information|Guaranteed independent evidence|Automatic causal identification|No need for evaluation|Marginal association does not establish distinct incremental utility.",
      "A merchant id has one training row per value. What makes target means risky?|Near memorization of labels|They contain no target information|They are always unbiased|They are always unavailable|Category means with tiny support can encode each row's outcome.",
      "A selector is faster with fewer columns. What must still be measured?|End-to-end utility|Only column count|Only selector filename|Only import duration|Lower dimensionality does not by itself establish useful accuracy or serving cost.",
      "A feature screen is chosen using validation outcomes. Which part of the experiment now includes that screen?|The development procedure|Only final scoring|Only class naming|Only serving logs|A supervised selection decision belongs to the training and model-selection procedure.",
      "A frequency cutoff pools merchants seen only once. When must that cutoff be learned for fold evaluation?|From fold training rows|From the whole table|From final labels|From production future rows|The rare-category rule is fitted preprocessing and must exclude held-out frequency information."
    ],
    "formal": [
      "What does max_categories constrain in one-hot encoding?|Category width|Target class count|Training row count|CV repetition count|The encoder groups categories to limit representation width.",
      "Why can a marginal selector miss XOR-like signal?|Joint-only signal|Linearity|No labels|Constant feature columns|Features may be predictive jointly despite weak separate association.",
      "A validation label affects a target-encoded training column. Which boundary is broken?|Fold leakage|Shape|Dtype|Feature name mismatch|Validation outcomes must not enter training feature construction.",
      "A team compares selection against no selection on the same valid folds. What does this isolate better?|Selection benefit|Causal effect|Future proof|Memory layout effect|Matched evaluation supports a fair comparison of the two pipelines.",
      "A category merger is learned from the entire dataset before split. What needs correction?|Training-only frequencies|Outcome sorting|Estimator seed change|Output file rename|Held-out category frequencies influenced a learned preprocessing decision.",
      "An encoder uses fit then transform on its training rows instead of cross-fitted fit_transform. What may change?|Training leakage|Imports|Row order|Column name changes|Training target encodings can include their own labels without the cross-fitting used by fit_transform.",
      "A merchant target encoder cross-fits randomly but customers recur across folds. The deployment goal is new-customer prediction. Which issue survives cross-fitting?|Customer-dependent leakage|Only unknown-field handling|Only sparse-column ordering|Guaranteed unbiased encoding|Random cross-fitting can still transfer customer-specific outcome information across the dependency boundary.",
      "Two correlated predictors alternate as the selected feature across folds while held-out predictions remain similar. Which interpretation is defensible?|Unstable individual attribution|Both features are independently causal|One chosen feature is universally best|Prediction stability proves selection stability|Equivalent predictive substitutes can yield stable predictions without stable unique feature attribution.",
      "A feature-selection search is evaluated on outer folds, then outer error patterns are used to change selection rules. What is now needed for final reporting?|Independent evaluation after revision|Only the original outer-fold mean|Only a larger inner candidate grid|Only refitting the original winner|Outer evidence becomes development information when used to revise the evaluated selection procedure.",
      "A high-cardinality target encoder needs future-time and new-site validity. Ordinary internal cross-fitting leaks site outcomes. What design addresses this?|Dependency-aware nested encoding|Only random encoder folds increased|Global target means before splitting|Only an outer time gap after encoding|Encoding statistics must respect the actual dependencies inside each training procedure, not merely the outer split."
    ],
    "comps": [
      "m1.c2"
    ]
  },
  {
    "slug": "confusion-costs",
    "title": "Connect precision recall and F1 to action costs",
    "intro": "A fraud team can investigate only a small queue each day. Calling every transaction suspicious maximizes recall but can overwhelm investigators. Precision measures the fraction of flagged cases that are positive, while recall measures the fraction of actual positives found.",
    "sections": [
      [
        "Build the decision rule",
        "With a stated positive class, precision is TP divided by TP plus FP and recall is TP divided by TP plus FN. F1 is their harmonic mean and excludes true negatives. It is useful when both error directions matter but does not encode arbitrary monetary costs or capacity constraints. Specify zero-division policy and report confusion counts alongside ratios, particularly when positive support is small."
      ],
      [
        "Check the engineering boundary",
        "Threshold choice changes the confusion matrix. Compare candidate policies on development data using the operational cost and capacity rule, then freeze the policy for final evaluation. Weighted and macro averages answer different questions in multiclass problems: support weighting can hide poor minority performance, while macro averaging gives each class equal weight. The worked calculation is conditional on a fixed threshold and labeled sample."
      ]
    ],
    "problem": "Connect precision recall and F1 to action costs on a small synthetic fixture.",
    "steps": [
      "State the input and decision-time assumptions.",
      "Run the shown calculation and compare the printed result.",
      "Explain which conclusion the fixture supports and which assumptions require another check."
    ],
    "code": "from sklearn.metrics import precision_score,recall_score,f1_score,confusion_matrix\ny=[1,1,1,0,0,0]; p=[1,0,1,1,0,0]\nprint(confusion_matrix(y,p).tolist())\nprint(round(precision_score(y,p),4),round(recall_score(y,p),4),round(f1_score(y,p),4))",
    "expect": "[[2, 1], [1, 2]]\n0.6667 0.6667 0.6667",
    "limit": "This synthetic in-memory example verifies the displayed operation under scikit-learn 1.8.0. It does not establish production accuracy, causal impact, representative sampling or acceptable error costs. Threshold choice changes the confusion matrix.",
    "mistakes": [
      "Do not substitute a convenient representation for the stated decision rule. With a stated positive class, precision is TP divided by TP plus FP and recall is TP divided by TP plus FN.",
      "Do not generalize this tiny fixture beyond its sampling and information boundary. Threshold choice changes the confusion matrix."
    ],
    "takeaways": [
      "With a stated positive class, precision is TP divided by TP plus FP and recall is TP divided by TP plus FN.",
      "Threshold choice changes the confusion matrix."
    ],
    "practice": [
      "What is precision?|TP divided by all predicted positives|TP divided by all actual positives|TN divided by all rows|FP divided by all negatives|Precision measures positive-label yield among flagged cases.",
      "What is recall?|TP divided by all actual positives|TP divided by all predicted positives|TN divided by all positives|Correct negatives only|Recall measures coverage of the actual positive cases.",
      "Which confusion count represents missed positives?|False negatives|True negatives|False positives|True positives|A false negative is an actual positive predicted negative.",
      "A review queue has many false alarms. Which metric directly describes positive yield?|Precision|Recall alone|Training loss alone|Feature variance|Precision is the fraction of reviewed flags that are genuine positives.",
      "A screening workflow misses dangerous cases. Which metric tracks positive coverage?|Recall|Specificity only|MAE|Document frequency|Recall asks how many actual positive cases the policy catches.",
      "A model predicts no positives. What should the metric report specify?|Zero-division behavior|Only target dtype|Only sample order|Only probability precision|Precision has a zero denominator and requires an explicit reporting convention."
    ],
    "formal": [
      "What average gives each class equal weight?|Macro average|Support weighting|Only micro counts|Training average|Macro averaging averages per-class metrics equally.",
      "Does F1 include true negatives directly?|No direct TN term|Yes|Only binary|Only beyond midpoint|Its formula uses precision and recall, which depend on TP FP and FN.",
      "A bank values a missed fraud ten times a false alert. What should policy selection use?|Explicit costs|Universal F1 policy|Accuracy alone|Vocabulary size|The relevant costs should be represented rather than assumed to match F1.",
      "A report shows 100 percent recall from two positive cases. What must accompany it?|Support and uncertainty|Larger chart labels|Input feature names|Model latency alone|Small denominators make high ratios weak evidence of stable performance.",
      "A triage team has 50 review slots daily. What metric can help evaluate a ranking policy?|Precision at capacity|Unbounded recall|Numeric label RMSE|Training accuracy|Yield among the available review slots matches the queue constraint.",
      "A multiclass report is excellent by weighted F1 but one small class fails. What should be added?|Per-class evidence|More weighted means|Majority accuracy|Training loss alone|Support weighting can conceal poor performance on rare classes.",
      "A queue flags 40 cases with 30 true positives; ten additional positives were missed. What are precision and recall?|Both 0.75|Precision 0.75 recall 0.60|Precision 0.60 recall 0.75|Both 0.60|Precision is 30/40 and recall is 30/(30+10), so both equal 0.75.",
      "Two policies have the same F1. One creates twice as many false alerts and prevents more misses. What determines the preferred policy?|Operational costs and capacity|F1 alone proves equal business value|Training accuracy breaks every tie|The higher alert count always wins|Equal F1 does not imply equal workload or expected business loss.",
      "A rare class has recall 1.0 from three cases while a common class has recall 0.9 from thousands. What should a reviewer compare?|Per-class support and uncertainty|Only the largest recall value|Only the support-weighted summary|Only total validation row count|The rare-class ratio has limited support and should not be interpreted as more reliable performance.",
      "A team tunes thresholds by site to meet review caps and then reports default-threshold pooled F1 as final performance. What must be evaluated instead?|Frozen site-specific action policies|Only the pooled model score ranking|Only the best site threshold result|Only a support-weighted training F1|The actual deployed thresholds and capacities define the policy whose errors and utility must be assessed."
    ],
    "comps": [
      "m2.c1"
    ]
  },
  {
    "slug": "ranking-regression",
    "title": "Distinguish ranking metrics from numeric error",
    "intro": "A maintenance product both ranks machines for inspection and predicts repair hours. Ranking metrics evaluate score ordering, whereas regression losses measure numeric deviations in the target units. A single metric cannot answer both operational questions.",
    "sections": [
      [
        "Build the decision rule",
        "ROC-AUC estimates the probability that a randomly chosen positive receives a higher score than a randomly chosen negative, with tie handling. It summarizes ranking over thresholds and does not select a deployable operating point. Precision-recall summaries are often informative when positives are rare; average precision uses recall increments to weight precision rather than simply computing a trapezoid under any plotted curve."
      ],
      [
        "Check the engineering boundary",
        "MAE averages absolute residuals in target units. RMSE is the square root of mean squared residuals and emphasizes large misses more strongly. Compare both against a baseline under the same valid split and target scale. A log-transformed target changes the fitting objective; evaluating only log error does not establish acceptable error in original monetary or duration units."
      ]
    ],
    "problem": "Distinguish ranking metrics from numeric error on a small synthetic fixture.",
    "steps": [
      "State the input and decision-time assumptions.",
      "Run the shown calculation and compare the printed result.",
      "Explain which conclusion the fixture supports and which assumptions require another check."
    ],
    "code": "from sklearn.metrics import mean_absolute_error,root_mean_squared_error,roc_auc_score\nprint(mean_absolute_error([0,0],[0,4]))\nprint(round(root_mean_squared_error([0,0],[0,4]),6))\nprint(roc_auc_score([0,1,0,1],[.1,.8,.3,.9]))",
    "expect": "2.0\n2.828427\n1.0",
    "limit": "This synthetic in-memory example verifies the displayed operation under scikit-learn 1.8.0. It does not establish production accuracy, causal impact, representative sampling or acceptable error costs. MAE averages absolute residuals in target units.",
    "mistakes": [
      "Do not substitute a convenient representation for the stated decision rule. ROC-AUC estimates the probability that a randomly chosen positive receives a higher score than a randomly chosen negative, with tie handling.",
      "Do not generalize this tiny fixture beyond its sampling and information boundary. MAE averages absolute residuals in target units."
    ],
    "takeaways": [
      "ROC-AUC estimates the probability that a randomly chosen positive receives a higher score than a randomly chosen negative, with tie handling.",
      "MAE averages absolute residuals in target units."
    ],
    "practice": [
      "What units does MAE use?|Target units|Squared target units|Feature count|Always percentages|Absolute residuals preserve the target scale.",
      "Which regression metric emphasizes large misses more?|RMSE|Median feature value|Class recall|Vocabulary coverage|Squaring residuals increases the influence of large deviations.",
      "What does ROC-AUC primarily measure?|Score ranking|Probability calibration|Serving latency|Feature count|ROC-AUC evaluates relative ordering between positive and negative examples.",
      "A model predicts dollars but evaluation uses cents. What is needed?|Consistent target units|Only larger test set|Only class weights|Only tokenizer changes|Numeric error magnitudes depend on the target scale.",
      "A rare-event model has high ROC-AUC but poor alert yield. What additional evidence helps?|Operational PR evidence|Only training ROC-AUC|Only feature count|Only output dtype|Good global ranking may coexist with low precision at the chosen operating region.",
      "A model has low log error but costly dollar misses. What should be reported?|Original-scale error too|Only log score|Only target mean|Only fitted intercept|The deployment cost is incurred in the original business scale."
    ],
    "formal": [
      "Does ROC-AUC supply a decision threshold?|No|Always one-half|Always median score|Always maximum score|An operating point requires an additional policy choice.",
      "Which baseline minimizes constant absolute error on a sample?|A median|A maximum|A minimum|A random label|A sample median minimizes summed absolute deviations.",
      "A service penalizes occasional severe lateness heavily. Which comparison deserves attention?|Tail-error evidence|Signed mean only|Target support only|Matrix sparsity only|Averaged absolute error can hide unusually costly large misses.",
      "AUC is computed using predicted labels instead of scores. What information is lost?|Threshold ranking|Class count|Row count|Every confusion count|Binary labels collapse the richer ordering represented by continuous scores.",
      "A final evaluation set contains one class only. Which metric is not defined as ordinary binary ranking AUC?|ROC-AUC|MAE|Mean target|Prediction count|ROC-AUC requires both positive and negative cases for pairwise comparison.",
      "A strictly increasing transformation changes every probability but preserves score order. What can stay identical?|ROC-AUC|Log loss|Calibration|Every confusion matrix|A rank-based metric is invariant to strictly increasing score transformations.",
      "Two score vectors are p and its strictly increasing transform that shifts most values above 0.5. Which comparison is correct?|Same AUC possible different decisions|Same calibration and same decisions|Different AUC required same decisions|Same log loss required different AUC|Ranking can remain fixed while probability values and a fixed-threshold confusion matrix change.",
      "Model A has absolute errors 0 and 6; B has errors 3 and 3. Which statement is correct?|Equal MAE B has lower RMSE|A has lower MAE and lower RMSE|Equal MAE and equal RMSE|B has higher MAE but lower RMSE|Both MAEs are 3; A RMSE is sqrt(18) while B RMSE is 3.",
      "A model has strong pooled ROC-AUC but poor precision in the top 100 actions at deployment prevalence. What selection evidence fits the workflow?|Yield and costs within top-100 policy|Only the global ROC-AUC ranking|Only an accuracy score at midpoint|Only the training PR curve area|The operational decision uses a capacity-limited part of the ranking, so evaluate that complete action rule.",
      "Two held-out accounts have true costs $100 and $1000. Model A predicts $100 and $1600; B predicts $200 and $1200. Natural-log RMSE is about 0.33 for A and 0.51 for B. Deployment instead requires minimum weighted currency MAE using weights 1 and 5, and at most $250 absolute error on the high-value account. Which assessment follows that policy?|B; weighted MAEs A=$500, B≈$183; only B meets the cap|A; weighted MAEs A=$100, B≈$117; lower log RMSE decides|B; weighted MAEs A=$300, B=$150; both satisfy the cap|Neither; weighted MAEs A=$500, B≈$183; both violate the cap|Weighted MAE divides weighted absolute loss by total weight 6. A has (1*0+5*600)/6=$500 and high-value error $600; B has (1*100+5*200)/6≈$183.33 and high-value error $200. Only B satisfies the $250 error cap. The A=$100,B≈$117 calculation reverses the account weights; $300 and $150 are unweighted MAEs; the cap applies to prediction error, not the predicted amount or total weighted loss. Better log RMSE does not override the stated deployment policy."
    ],
    "comps": [
      "m2.c1"
    ]
  },
  {
    "slug": "imbalance-protocol",
    "title": "Evaluate rare events under the deployment prevalence",
    "intro": "A defect detector sees one failure in every hundred inspected units. A classifier that always predicts normal reaches 99 percent accuracy while finding no defects. Imbalance therefore changes the usefulness of a metric and the support needed for reliable estimates.",
    "sections": [
      [
        "Build the decision rule",
        "Class weights change the optimization contribution of classes rather than manufacturing independent observations. Resampling must occur only inside training folds. Stratification can preserve approximate class proportions in a split, but it does not address entity dependence or chronology. Every fold must contain sufficient class support for its estimator and selected metrics."
      ],
      [
        "Check the engineering boundary",
        "An artificially balanced test population changes precision and predicted action volume relative to the natural population. Record how examples were sampled and evaluate deployment prevalence where possible. If only case-control data are available, corrections require explicit assumptions about sampling and conditional distributions. Oversampling repeated positives does not increase the number of independent positive events."
      ]
    ],
    "problem": "Evaluate rare events under the deployment prevalence on a small synthetic fixture.",
    "steps": [
      "State the input and decision-time assumptions.",
      "Run the shown calculation and compare the printed result.",
      "Explain which conclusion the fixture supports and which assumptions require another check."
    ],
    "code": "from sklearn.metrics import accuracy_score,recall_score\nfrom sklearn.utils.class_weight import compute_class_weight\nimport numpy as np\ny=np.array([0]*9+[1])\nprint(accuracy_score(y,np.zeros(10,dtype=int)))\nprint(recall_score(y,np.zeros(10,dtype=int)))\nprint(compute_class_weight(\"balanced\",classes=np.array([0,1]),y=y).round(6).tolist())",
    "expect": "0.9\n0.0\n[0.555556, 5.0]",
    "limit": "This synthetic in-memory example verifies the displayed operation under scikit-learn 1.8.0. It does not establish production accuracy, causal impact, representative sampling or acceptable error costs. An artificially balanced test population changes precision and predicted action volume relative to the natural population.",
    "mistakes": [
      "Do not substitute a convenient representation for the stated decision rule. Class weights change the optimization contribution of classes rather than manufacturing independent observations.",
      "Do not generalize this tiny fixture beyond its sampling and information boundary. An artificially balanced test population changes precision and predicted action volume relative to the natural population."
    ],
    "takeaways": [
      "Class weights change the optimization contribution of classes rather than manufacturing independent observations.",
      "An artificially balanced test population changes precision and predicted action volume relative to the natural population."
    ],
    "practice": [
      "Why can accuracy mislead on rare positives?|Majority predictions dominate it|Accuracy cannot be calculated|All labels are wrong|It measures only calibration|A majority-only model can score highly while missing the event of interest.",
      "What do class weights change?|Training loss contribution|Number of independent events|True labels|Evaluation timestamps|Weights alter optimization emphasis rather than sample independence.",
      "Where should oversampling occur?|Training partition only|Before all splits|On the final test set|Only in metric calculation|Resampling across a split can duplicate related evidence into evaluation.",
      "A rare-event fold has no positive case. What should be reviewed?|Class support feasibility|Only model filename|Only row dtype|Only feature scaling|Some metrics cannot be meaningfully estimated without positive support.",
      "A team duplicates ten positive rows a hundred times. What has not increased?|Independent events|Stored row count|Training computation|Positive row frequency|Replication repeats evidence rather than creating new independent events.",
      "A stratified split mixes the same patient across partitions. What remains unresolved?|Entity leakage|Class proportions only|Target spelling|Matrix format|Stratification does not enforce patient-level separation.",
      "A benchmark reports 98 percent accuracy but catches none of its failures. Which baseline comparison is essential?|Majority-only prediction|Only max feature value|Only training speed|Only shuffled class names|The observed accuracy may match a trivial negative-only policy on an imbalanced population.",
      "A weighted classifier is scored on a naturally sampled holdout. Why preserve that sampling design?|Deployment prevalence|Guaranteed calibration|More independent positives|Automatic fairness|A representative holdout preserves the event frequency relevant to operational precision and volume."
    ],
    "formal": [
      "What is a majority baseline useful for?|Baseline context|Readiness proof|Complete label repair|Fairness guarantee|It reveals whether a model improves on a trivial class-frequency strategy.",
      "Does class balancing guarantee calibrated probabilities?|No|Always|Only integer labels|Only training samples|Changing class emphasis can alter probability interpretation and needs independent calibration assessment.",
      "A balanced test set has much higher precision than production. What plausible difference matters?|Lower prevalence|Model name only|Input order only|Processor count only|With similar sensitivity and specificity, a rarer event lowers positive predictive value.",
      "A resampler runs before GroupKFold. What risk needs investigation?|Entity duplication|Larger arrays alone|Faster convergence|Label encoding alone|Resampling before group-aware partitioning can invalidate independence unless lineage is handled correctly.",
      "A class-weighted model catches more failures but floods inspectors. What must be tuned?|Action policy|Class vocabulary|Target normalization|File extension only|Training emphasis and the serving threshold must be evaluated against capacity and costs.",
      "A balanced validation set yields high precision, but production prevalence is one percent. Sensitivity is 0.8 and specificity 0.9. Approximate production precision is what?|7.5 percent|80 percent|89 percent|50 percent|PPV is 0.8*0.01 divided by 0.8*0.01+0.1*0.99, approximately 0.0748.",
      "A hundred positive rows come from one faulty machine and are oversampled. What should uncertainty and validation respect?|Machine-level independence|Oversampled row count as support|Only class-proportion equality|Only the number of CV repeats|Duplicate and dependent rows do not create independent evidence about other failure sources.",
      "A class-weighted classifier improves recall but calibrated probability estimates worsen. Which response is defensible?|Evaluate calibration and action policy|Assume weighting calibrates by design|Reject every class-weighted method|Report only the improved recall|Training emphasis can improve one decision behavior while probability quality and workload need separate assessment.",
      "A case-control test oversamples positive outcomes with known inclusion probabilities. What supports a production metric estimate?|Design-aware weighting assumptions|An unweighted precision average|Only resetting the random seed|Only fitting balanced class weights|Sampling-aware estimation requires valid inclusion information and assumptions; training weights do not repair evaluation sampling automatically.",
      "A rare-event task requires future-time predictions at unseen facilities. A stratified random split has every class in each fold. What remains inadequate?|Time and facility independence|Only positive-class proportions|Only the number of target labels|Only binary label representation|Stratification preserves class support but does not enforce either required deployment boundary."
    ],
    "comps": [
      "m2.c2"
    ]
  },
  {
    "slug": "segment-audit",
    "title": "Find concentrated errors without overinterpreting small slices",
    "intro": "A transit estimator looks acceptable on average but misses late-night routes. Segment analysis compares errors across operationally relevant populations, revealing failures hidden by pooled scores. Segment definitions should reflect the service decision rather than whichever slices happen to look worst.",
    "sections": [
      [
        "Build the decision rule",
        "Calculate per-segment support, event counts, a metric and uncertainty where possible. A small group can show an extreme score through chance; a large group can dominate the overall average. Compare like-for-like time periods and target definitions. Intersections such as route by shift can expose concentrated failures but multiply the number of comparisons and reduce support."
      ],
      [
        "Check the engineering boundary",
        "Error discovery is development work. If the team changes features after studying a slice on the final test, that test is no longer untouched. Keep a prespecified monitoring set of business-critical slices and distinguish exploratory findings from confirmed failures. For repeated entities or correlated periods, uncertainty should respect the sampling unit rather than resample individual rows as though independent."
      ]
    ],
    "problem": "Find concentrated errors without overinterpreting small slices on a small synthetic fixture.",
    "steps": [
      "State the input and decision-time assumptions.",
      "Run the shown calculation and compare the printed result.",
      "Explain which conclusion the fixture supports and which assumptions require another check."
    ],
    "code": "import pandas as pd\nd=pd.DataFrame({\"shift\":[\"day\",\"day\",\"night\",\"night\"],\"truth\":[10,10,10,10],\"pred\":[9,11,6,8]})\nd[\"absolute_error\"]=(d.truth-d.pred).abs()\nprint(d.groupby(\"shift\").absolute_error.mean().to_dict())",
    "expect": "{'day': 1.0, 'night': 3.0}",
    "limit": "This synthetic in-memory example verifies the displayed operation under scikit-learn 1.8.0. It does not establish production accuracy, causal impact, representative sampling or acceptable error costs. Error discovery is development work.",
    "mistakes": [
      "Do not substitute a convenient representation for the stated decision rule. Calculate per-segment support, event counts, a metric and uncertainty where possible.",
      "Do not generalize this tiny fixture beyond its sampling and information boundary. Error discovery is development work."
    ],
    "takeaways": [
      "Calculate per-segment support, event counts, a metric and uncertainty where possible.",
      "Error discovery is development work."
    ],
    "practice": [
      "What should accompany a segment score?|Sample and event support|Only segment name|Only best prediction|Only file size|Support helps distinguish a stable pattern from a fragile estimate.",
      "Why inspect business-critical segments?|Pooled metrics can hide failures|Every segment must be identical|It guarantees causal effects|It removes all uncertainty|Averaging can conceal concentrated errors in an operationally important population.",
      "What does a residual record?|Observed minus predicted|Always absolute error|Always feature magnitude|Only target rank|A signed residual preserves the direction of prediction error.",
      "A tiny region has perfect recall from one event. What is the appropriate interpretation?|Very limited evidence|Guaranteed reliability|No uncertainty|Proof of calibration|One observed event provides little support for stable future sensitivity.",
      "A nightly route fails after a schedule change. What comparison is useful?|Route and time errors|Only all-time pooled score|Only training accuracy|Only feature names|The failure hypothesis concerns a changed regime in a particular operating segment.",
      "A team chooses the worst of thousands of slices. What issue arises?|Multiple comparisons|Guaranteed causal discovery|More independent support|Elimination of noise|Exploring many slices makes an extreme result more likely by chance."
    ],
    "formal": [
      "What can an intersectional slice reveal?|Joint failures|Global mean only|Every causal mechanism|Model speed only|Errors can concentrate in combinations that separate marginal summaries miss.",
      "What is a prespecified slice?|Predefined group|Worst observed slice|Excluded target class|Unlabeled event batch|Predefinition helps interpret confirmatory monitoring separately from exploration.",
      "A global MAE improves while every small rural depot worsens. What should a review consider?|Local utility|Global rank alone|Training duration|Maximum input value|A pooled gain can coexist with concentrated degradation in smaller sites.",
      "An analyst bootstraps rows from repeated patients independently. What is questionable?|Entity dependence|Number formatting|Metric naming alone|Array dtype alone|Repeated observations may need entity-level resampling to reflect dependence.",
      "A subgroup uses a different label horizon. What should precede score comparison?|Aligned outcomes|Larger samples only|Input rescaling only|Subgroup renaming only|Scores with different target meanings are not directly comparable.",
      "A pooled metric improves because urban volume doubles, while error within both urban and rural segments worsens. What should the report show?|Segment errors and mix|Only the better pooled score|Only the larger urban sample|Only the latest training score|Population weighting can change the aggregate independently of conditional quality and conceal local degradation.",
      "An analyst discovers the worst of 500 small slices and repairs it using those same labels. What is needed to confirm the repair?|Frozen slice on fresh representative data|Only a second plot of the same slice|Only repeating the search after repair|Only the selected slice training score|Selection and repair both consumed the original evidence; confirmation needs a new boundary.",
      "A patient-level bootstrap and row bootstrap yield very different intervals. The data contain repeated visits per patient. Which resampling unit is defensible?|Patients as dependent clusters|Rows treated as fully independent|Only predicted positive visits|Only the largest hospital records|The uncertainty calculation must respect dependence among repeated observations from the same sampled entity.",
      "A region's recall gap appears only in one short holiday period with two positive cases. What should be concluded?|Limited conditional evidence|Confirmed universal regional failure|Proof of a causal regional effect|No operational concern is possible|The pattern warrants investigation but its narrow exposure and small event support limit generalization.",
      "A future-site model is repaired after studying subgroup failures on the outer evaluation set. Which final protocol preserves independence?|Fresh site-time test after frozen repair|Reuse original outer score as final|Only report the repaired training loss|Average pre-repair and post-repair scores|The inspected outer evidence no longer independently evaluates the revised procedure."
    ],
    "comps": [
      "m3.c1"
    ]
  },
  {
    "slug": "calibration",
    "title": "Assess probability reliability separately from ranking",
    "intro": "A renewal system uses probabilities to budget retention spending. A score of 0.8 should correspond to an approximately 80 percent event frequency among comparable scored cases under the evaluated population. Ranking quality alone cannot establish this property.",
    "sections": [
      [
        "Build the decision rule",
        "A reliability diagram compares mean predicted probability with observed event frequency in bins. Bin choice affects resolution and sample support, so report counts and avoid treating a sparse bin as precise. Brier score averages squared probability error and reflects both calibration and discrimination; it is not a pure isolated calibration measure. Log loss strongly penalizes confident incorrect predictions."
      ],
      [
        "Check the engineering boundary",
        "Calibration fitting requires data independent of the base estimator fitting under a valid split. CalibratedClassifierCV can use cross-validation to generate calibration evidence; dependencies still govern the splitter. Sigmoid and isotonic methods trade assumptions and flexibility, with isotonic vulnerable to small calibration samples. Reassess reliability after population changes and evaluate the entire fitted procedure on an untouched final set."
      ]
    ],
    "problem": "Assess probability reliability separately from ranking on a small synthetic fixture.",
    "steps": [
      "State the input and decision-time assumptions.",
      "Run the shown calculation and compare the printed result.",
      "Explain which conclusion the fixture supports and which assumptions require another check."
    ],
    "code": "from sklearn.metrics import brier_score_loss\nfrom sklearn.calibration import calibration_curve\ny=[0,1,0,1]; p=[.25,.25,.75,.75]\nprint(brier_score_loss(y,p))\na,b=calibration_curve(y,p,n_bins=2)\nprint(a.tolist(),b.tolist())",
    "expect": "0.3125\n[0.5, 0.5] [0.25, 0.75]",
    "limit": "This synthetic in-memory example verifies the displayed operation under scikit-learn 1.8.0. It does not establish production accuracy, causal impact, representative sampling or acceptable error costs. Calibration fitting requires data independent of the base estimator fitting under a valid split.",
    "mistakes": [
      "Do not substitute a convenient representation for the stated decision rule. A reliability diagram compares mean predicted probability with observed event frequency in bins.",
      "Do not generalize this tiny fixture beyond its sampling and information boundary. Calibration fitting requires data independent of the base estimator fitting under a valid split."
    ],
    "takeaways": [
      "A reliability diagram compares mean predicted probability with observed event frequency in bins.",
      "Calibration fitting requires data independent of the base estimator fitting under a valid split."
    ],
    "practice": [
      "What does probability calibration compare?|Risk versus event rate|Feature units with names|Target rank with row index|Only model runtime|Calibration concerns how probability values correspond to observed outcomes.",
      "What is a reliability diagram?|Binned risk reliability|A latency histogram only|A feature vocabulary|A training parameter grid|The diagram compares average predictions with event frequencies in score bins.",
      "Can excellent ranking coexist with poor calibration?|Yes|Never|Only without labels|Only for constant scores|Ordering can be correct while probability magnitudes are systematically wrong.",
      "A bin reports 90 percent predicted risk from two cases. What should be shown?|Bin support|Only a smooth line|Only global accuracy|Only feature count|Sparse bins support imprecise observed rates.",
      "A calibrator fits on predictions from the same rows used to fit an overfitted base model. What is the risk?|Biased calibration evidence|Automatic independence|Guaranteed perfect reliability|Only slower inference|In-sample predictions may not represent generalization behavior.",
      "A business changes event prevalence sharply. What should be checked?|Current probability reliability|Only old ranking score|Only estimator filename|Only input array dimensions|Probability meaning can shift with the deployment population."
    ],
    "formal": [
      "What does Brier score average?|Squared probability loss|Absolute input values|Ranking inversions|Positive predictions only|It compares each event probability with its binary outcome using squared loss.",
      "Which loss penalizes confident wrong probabilities strongly?|Log loss|Vocabulary size|Training support|Feature-value MAE|A near-zero assigned probability for the observed event produces large log loss.",
      "A report calls Brier score a pure calibration statistic. What correction is needed?|Mixed score properties|No outcome dependence|Accuracy equivalence|Rank-only dependence|Brier score combines aspects of probability quality rather than isolating calibration alone.",
      "A tiny dataset is calibrated with a flexible isotonic fit. What risk deserves review?|Calibration overfit|Certain ranking gain|Perfect probability proof|Complete label loss|A flexible monotonic mapping can fit noise when calibration support is small.",
      "A calibration plot uses broad bins that mix very different risks. What can be hidden?|Within-bin errors|All target support|All numeric scores|All predictions|Binning can average opposing local deviations into apparently reliable points.",
      "A calibrator uses predictions from the same overfitted base-model training rows. Its reliability plot is perfect there. What should replace that evidence?|Independent or valid out-of-fold scores|More bins on the same fitted scores|Only stronger rounding of probabilities|Only training class balancing|Calibration needs prediction behavior representative of held-out cases rather than overfit in-sample scores.",
      "Two models have equal ROC-AUC, but one has much lower Brier loss. What follows from this alone?|Probability quality differs not pure calibration|The lower loss proves calibration alone|The lower loss proves greater causal value|The higher loss must use fewer features|Brier loss combines probability-quality components and cannot isolate calibration without further analysis.",
      "A calibration curve looks reliable with five bins and unreliable with fifty bins, many containing few cases. What should be examined?|Bin support and resolution tradeoff|Only the smoothest-looking diagram|Only the highest reported accuracy|Only the largest predicted probability|Coarse bins can hide deviations while sparse fine bins produce noisy observed rates.",
      "A deployment population has changed after calibration. Ranking appears stable, but expected event totals are biased. What needs reassessment?|Current risk reliability|Only the unchanged ROC-AUC score|Only the original calibration plot|Only the estimator's feature count|Stable ordering does not establish that numeric probabilities retain their original frequency interpretation.",
      "A team selects sigmoid versus isotonic calibration after examining the final reliability curve. How should independent evaluation proceed?|Freeze selected procedure and use fresh test|Reuse selected final curve unchanged|Only compare the two training curves|Refit both on the inspected test labels|Calibration-method selection consumes the inspected evidence and needs a new final boundary."
    ],
    "comps": [
      "m3.c1"
    ]
  },
  {
    "slug": "threshold-policy",
    "title": "Freeze a threshold and evaluate the complete action policy",
    "intro": "A collections team chooses whom to contact from a scored account list. The model supplies risk estimates; a policy translates those estimates into actions given outreach cost, recoverable value and staff capacity. A probability threshold is therefore a business rule rather than a universal property of a classifier.",
    "sections": [
      [
        "Build the decision rule",
        "Under a simplified binary decision with zero cost for correct actions, a false-positive cost C_FP and false-negative cost C_FN imply an action threshold C_FP divided by their sum when probabilities are calibrated for the target population and costs are constant. Real workflows may have varying costs, treatment effects or capacity constraints, so this formula is conditional rather than a default mandate. Expected recovery from contacting an account is not necessarily the same as its untreated default risk."
      ],
      [
        "Check the engineering boundary",
        "Select and document the threshold using development evidence. Include ties, missing scores, eligibility rules and fallback behavior in the policy. Evaluate the frozen action rule on final data, report action count and subgroup errors, and version any later change. A daily top-k queue may produce different score cutoffs as the population changes; it needs evaluation as a capacity policy."
      ]
    ],
    "problem": "Freeze a threshold and evaluate the complete action policy on a small synthetic fixture.",
    "steps": [
      "State the input and decision-time assumptions.",
      "Run the shown calculation and compare the printed result.",
      "Explain which conclusion the fixture supports and which assumptions require another check."
    ],
    "code": "from sklearn.metrics import confusion_matrix\ny=[0,1,0,1]; p=[.2,.4,.6,.9]\nfor t in [.3,.7]:\n pred=[int(v>=t) for v in p]\n print(t,sum(pred),confusion_matrix(y,pred).tolist())",
    "expect": "0.3 3 [[1, 1], [0, 2]]\n0.7 1 [[2, 0], [1, 1]]",
    "limit": "This synthetic in-memory example verifies the displayed operation under scikit-learn 1.8.0. It does not establish production accuracy, causal impact, representative sampling or acceptable error costs. Select and document the threshold using development evidence.",
    "mistakes": [
      "Do not substitute a convenient representation for the stated decision rule. Under a simplified binary decision with zero cost for correct actions, a false-positive cost C_FP and false-negative cost C_FN imply an action threshold C_FP divided by their sum when probabilities are calibrated for the target population and costs are constant.",
      "Do not generalize this tiny fixture beyond its sampling and information boundary. Select and document the threshold using development evidence."
    ],
    "takeaways": [
      "Under a simplified binary decision with zero cost for correct actions, a false-positive cost C_FP and false-negative cost C_FN imply an action threshold C_FP divided by their sum when probabilities are calibrated for the target population and costs are constant.",
      "Select and document the threshold using development evidence."
    ],
    "practice": [
      "What converts a score to an action?|Decision policy|Vocabulary alone|Training row count|Feature scaler alone|A policy specifies which action follows a score under operational constraints.",
      "Where should thresholds normally be chosen?|Development data|Untouched final test labels|Future unknown outcomes|Production incident labels only|Threshold selection is a model-development decision.",
      "What does a top-k policy enforce directly?|Action capacity|Probability calibration|Causal treatment effect|Feature independence|Selecting a fixed number controls queue size rather than a fixed probability cutoff.",
      "Two cases tie at the queue cutoff. What should be specified?|Deterministic tie policy|Randomly change labels|Refit on those outcomes|Silently exceed every limit|Tie behavior is part of reproducible action selection.",
      "A missing score arrives during service. What policy element is needed?|Fallback behavior|Only threshold rounding|Only feature naming|Only test AUC|The action system must define handling for unavailable or invalid scores.",
      "A team changes a deployed threshold. What should be versioned?|Complete action rule|Only model class name|Only training imports|Only label count|Threshold changes alter behavior even when model coefficients remain fixed."
    ],
    "formal": [
      "Under constant costs and calibrated binary risk what determines a cost threshold?|Relative error costs|Feature count alone|Training accuracy|Optimizer seed only|The simplified threshold follows the ratio of false-positive cost to total error costs.",
      "Does untreated risk measure benefit caused by contacting a customer?|No|Always|Only above midpoint|Only with binary labels|Intervention benefit requires causal or experimental evidence beyond predictive risk.",
      "A team sets threshold at 0.5 because the library does. What is missing?|Cost justification|More score decimals|Class names alone|Matrix dimensions|A software default need not optimize the business decision.",
      "A top-100 queue is evaluated using a fixed 0.5 cutoff instead. What is wrong?|Policy mismatch|AUC arithmetic|Numeric score type|Model serialization|Assessment must simulate the actual capacity-based decision rule.",
      "A cost formula assumes probabilities are reliable but they are miscalibrated. What may fail?|Cost decision logic|Confusion formatting|Target spelling|Feature count alone|Cost comparisons based on incorrect probability magnitudes can choose poor actions.",
      "Under calibrated risk and constant costs, a false alert costs 2 and a missed positive costs 18. What is the simplified minimum-cost threshold?|0.10|0.90|0.50|0.02|The threshold is C_FP/(C_FP+C_FN)=2/20, conditional on the stated calibration and cost assumptions.",
      "A top-50 queue and a fixed 0.5 policy select different accounts each day. Which final evaluation matches the planned service?|Action benefit and cost|Only fixed-midpoint confusion counts|Only global ROC-AUC and class balance|Only average model probability|Capacity and eligibility rules determine the actual actions, including ties and changing daily score distributions.",
      "An outreach model ranks untreated default risk, but outreach helps some high-risk accounts and harms others. What is missing for optimal outreach?|Intervention benefit and cost evidence|Only a lower risk threshold|Only an improved calibration diagram|Only a larger untreated-risk AUC|Risk prediction does not identify heterogeneous causal benefit of taking the action.",
      "A threshold is lowered to hit recall targets while staffing stays fixed. Validation alerts exceed capacity. What is a valid response?|Evaluate feasible constrained policy|Claim the recall gain as deployable|Ignore alerts below the daily limit|Use the final test to retune daily|The complete policy must meet both recall goals and actual processing constraints before final evaluation.",
      "A site changes threshold after reviewing final-test complaints, then claims the old test remains untouched because model weights did not change. What is correct?|Policy tuning consumed that boundary|Only weight changes consume a test|Threshold changes cannot affect error|The old AUC validates all new policies|The evaluated procedure includes threshold and action logic, so test-guided changes require independent new evidence."
    ],
    "comps": [
      "m3.c1"
    ]
  }
],["feature_extraction.rst", "feature_selection.rst", "preprocessing.rst", "model_evaluation.rst", "calibration.rst"]);
