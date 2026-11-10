'use strict';
const {course}=require('./ml-wave3-helper');
module.exports=course("ml-fundamentals",[
  {
    "slug": "task-and-target",
    "title": "Translate a decision into a learning task",
    "intro": "A synthetic repair desk must decide which arriving tickets deserve immediate attention. Predicting a repair duration is regression; predicting whether duration exceeds a fixed limit is classification. Grouping tickets by similarity without known outcomes is clustering. The choice follows the decision and available labels.",
    "sections": [
      [
        "Build the decision rule",
        "Supervised learning estimates a mapping from feature vectors to observed target values. A classification target denotes a finite set of classes, while a regression target represents a numeric quantity for which magnitude matters. Clustering searches for structure without a labeled desired output. The same business setting can support different tasks, but a cluster id does not become a validated risk label merely because it has a number."
      ],
      [
        "Check the engineering boundary",
        "Define the observation unit, prediction timestamp, target horizon and action before selecting an estimator. A target should be measurable under a consistent labeling policy. Forecasting demand requires a future horizon and temporal evaluation even though the target is numeric. Prediction does not identify the causal effect of an intervention: dispatching an extra technician may change the outcome, so estimating that effect needs a separate design."
      ]
    ],
    "problem": "Translate a decision into a learning task on a small synthetic fixture.",
    "steps": [
      "State the input and decision-time assumptions.",
      "Run the shown calculation and compare the printed result.",
      "Explain which conclusion the fixture supports and which assumptions require another check."
    ],
    "code": "from sklearn.utils.multiclass import type_of_target\nprint(type_of_target([0,1,0,1]))\nprint(type_of_target([1.2,2.4,3.1]))",
    "expect": "binary\ncontinuous",
    "limit": "This synthetic in-memory example verifies the displayed operation under scikit-learn 1.8.0. It does not establish production accuracy, causal impact, representative sampling or acceptable error costs. Define the observation unit, prediction timestamp, target horizon and action before selecting an estimator.",
    "mistakes": [
      "Do not substitute a convenient representation for the stated decision rule. Supervised learning estimates a mapping from feature vectors to observed target values.",
      "Do not generalize this tiny fixture beyond its sampling and information boundary. Define the observation unit, prediction timestamp, target horizon and action before selecting an estimator."
    ],
    "takeaways": [
      "Supervised learning estimates a mapping from feature vectors to observed target values.",
      "Define the observation unit, prediction timestamp, target horizon and action before selecting an estimator."
    ],
    "practice": [
      "Which task predicts a measured repair duration?|Regression|Clustering|Binary classification only|Feature scaling|Numeric magnitude is meaningful for a duration target.",
      "Which task predicts one of several ticket categories?|Classification|Standardization|Matrix reshaping|Unsupervised grouping only|A finite labeled output defines classification.",
      "What is a baseline for?|Reference comparison|Guaranteeing causality|Removing all uncertainty|Replacing label policy|A simple reference reveals whether a complex model adds useful predictive value.",
      "A team names cluster zero high-risk without outcomes. What is missing?|Risk validation|A larger cluster id|Alphabetical sorting|A float dtype|Unsupervised group membership does not establish outcome risk.",
      "A prediction is needed at ticket arrival. Which inputs are eligible?|Arrival-time information|Final repair duration|Closure notes only|Next-week satisfaction|Features must exist at the intended decision time.",
      "A manager asks whether adding staff causes shorter repairs. What task differs from prediction?|Causal effect estimation|Target normalization|Ordinary accuracy scoring|Feature renaming|Intervention effects need assumptions and design beyond an observational prediction model."
    ],
    "formal": [
      "What distinguishes supervised learning?|Observed target labels|No feature vectors|No training stage|Mandatory neural networks|Supervision comes from examples paired with desired outputs.",
      "What is a classification class?|A target category|A numeric unit|A training iteration|An array axis|Classes represent discrete output categories.",
      "A retail team predicts next-day units sold. Which task fits the target?|Regression forecasting|Unlabeled clustering|Nominal encoding only|Binary sorting always|Future numeric demand is a regression target with a temporal horizon.",
      "A model labels a transaction fraudulent after investigation. What target policy matters?|Consistent adjudication|Only transaction order|Only feature width|Only dtype inference|Supervised learning depends on how outcomes are observed and labeled.",
      "A numerical code 1,2,3 names product families. Why is regression questionable?|Codes denote categories|Numbers cannot be inputs|Labels must be strings|All categories are ordered|Arithmetic distance between arbitrary class ids lacks the meaning regression assumes.",
      "A support model predicts lifetime spending from first-day records. What must be defined?|Outcome horizon|Only estimator name|Only row sorting|Only chart title|Lifetime and fixed-window spending describe different targets and evidence availability.",
      "A dashboard ranks alerts but the workflow takes only ten daily actions. Which framing detail matters?|Action capacity|Only feature variance|Only file format|Only model language|The decision capacity affects ranking metrics, thresholds and operational value.",
      "A loan model predicts defaults but claims it proves why customers default. What is overstated?|Causal interpretation|Observed predictive score|Feature matrix shape|Class label definition|Predictive associations do not establish causes of default.",
      "A ticket dataset mixes ticket-level and customer-level rows. What should be fixed first?|Observation unit|Optimizer tolerance|Tree count|Coefficient precision|The learning example must have a clear unit so features and outcomes align.",
      "A company changes the action from reviewing fraud to automatically blocking payments. What needs reevaluation?|Decision costs and target|Only model filename|Only random seed|Only column spelling|A changed action changes the harm tradeoff and potentially the appropriate prediction objective."
    ]
  },
  {
    "slug": "baseline-skill",
    "title": "Build a simple reference before claiming model skill",
    "intro": "A synthetic service dataset has nine ordinary tickets for every urgent ticket. An always-ordinary classifier reaches 90 percent accuracy while detecting no urgent work. A baseline makes this limitation visible before an expensive model is introduced.",
    "sections": [
      [
        "Build the decision rule",
        "DummyClassifier with strategy=\"most_frequent\" predicts the most frequent training class. DummyRegressor with strategy=\"mean\" predicts the training target mean, a useful squared-error baseline. A median prediction is a natural baseline for absolute-error loss. More domain-specific baselines can use yesterday\u2019s demand or an existing manual rule when those reflect a realistic alternative decision."
      ],
      [
        "Check the engineering boundary",
        "Use identical held-out rows and a metric aligned with the operational objective for baseline and candidate. An improvement over a weak baseline may still be too small to justify latency, maintenance or error costs. Stronger baselines also reveal data construction errors: a surprising advantage can arise because one candidate receives information unavailable to the other. Report class support and per-class behavior rather than accuracy alone."
      ]
    ],
    "problem": "Build a simple reference before claiming model skill on a small synthetic fixture.",
    "steps": [
      "State the input and decision-time assumptions.",
      "Run the shown calculation and compare the printed result.",
      "Explain which conclusion the fixture supports and which assumptions require another check."
    ],
    "code": "from sklearn.dummy import DummyClassifier,DummyRegressor\nc=DummyClassifier(strategy=\"most_frequent\").fit([[0],[1],[2],[3]],[0,0,0,1])\nr=DummyRegressor(strategy=\"mean\").fit([[0],[1]],[2.,6.])\nprint(c.predict([[8],[9]]).tolist())\nprint(r.predict([[8]]).tolist())",
    "expect": "[0, 0]\n[4.0]",
    "limit": "This synthetic in-memory example verifies the displayed operation under scikit-learn 1.8.0. It does not establish production accuracy, causal impact, representative sampling or acceptable error costs. Use identical held-out rows and a metric aligned with the operational objective for baseline and candidate.",
    "mistakes": [
      "Do not substitute a convenient representation for the stated decision rule. DummyClassifier with strategy=\"most_frequent\" predicts the most frequent training class.",
      "Do not generalize this tiny fixture beyond its sampling and information boundary. Use identical held-out rows and a metric aligned with the operational objective for baseline and candidate."
    ],
    "takeaways": [
      "DummyClassifier with strategy=\"most_frequent\" predicts the most frequent training class.",
      "Use identical held-out rows and a metric aligned with the operational objective for baseline and candidate."
    ],
    "practice": [
      "What does a most-frequent baseline predict?|Training majority class|Every future true label|A random feature|The rarest class always|The reference repeats the most frequent training outcome.",
      "Which constant minimizes training squared error?|Target mean|Largest target|Smallest target|First row target|The mean minimizes the sum of squared deviations.",
      "Which constant minimizes training absolute error?|Target median|Target maximum|Target variance|Feature count|A median minimizes total absolute deviation.",
      "A rare-event model reports 95% accuracy in a 95%-negative sample. What comparison is essential?|Majority baseline|Only feature count|Only training time|Only optimizer seed|An always-negative predictor can already reach that accuracy.",
      "A new model beats a baseline on different test rows. What is unresolved?|Matched comparison|Whether fit was called|Whether labels are numeric|Whether output has rows|Different populations can explain the apparent score improvement.",
      "A complex model gains little but costs much more to operate. What must be assessed?|Operational value|Only parameter count|Only import speed|Only class ordering|Predictive gains should justify real deployment and maintenance costs."
    ],
    "formal": [
      "Which baseline represents no learned feature relationship?|Dummy predictor|Full random forest|Deep neural network|Tuned boosting model|A dummy predictor ignores feature relationships and supplies a simple reference.",
      "Where should baseline constants be estimated?|Training targets|Final test targets|Future labels|All evaluation labels|The baseline must obey the same training information boundary as the candidate.",
      "A demand service repeats yesterday\u2019s demand. What kind of comparison is this?|Domain baseline|Target leakage always|Unsupervised encoder|Numerical optimizer|A simple operational heuristic can be a useful reference when available at decision time.",
      "A candidate improves accuracy but misses every urgent ticket. Which issue remains?|Minority-class utility|Feature dtype only|Matrix shape only|Target spelling|Aggregate accuracy can hide failure on the business-critical class.",
      "A regression mean baseline is evaluated with MAE. Which additional constant is useful?|Median baseline|Target maximum|Zero variance|Feature mean always|The median is aligned with absolute-error loss.",
      "A baseline uses final outcomes unavailable at prediction time. Is it a valid reference?|No|Yes if simple|Yes if constant|Yes if deterministic|Simplicity does not excuse an invalid information boundary.",
      "A tuned model beats a weak dummy but loses to the existing rule. What should be reported?|Both comparisons|Only dummy improvement|Only training score|Only best fold|The existing operational alternative is essential context for practical value.",
      "A test has no positive examples. What does high baseline accuracy leave untested?|Positive-case detection|Prediction array shape|Library import|Negative row count|The sample provides no evidence about detecting positive cases.",
      "A baseline is recomputed using each served batch\u2019s true outcomes. What is wrong?|Unavailable labels|Too few parameters|Too many folds|Wrong class ordering|True served outcomes are not available when predictions are made.",
      "A candidate\u2019s tiny average gain varies widely across facilities. What evidence is needed?|Uncertainty and slices|Only pooled mean|Only model size|Only coefficient signs|Variability and subgroup performance determine whether the gain is stable and useful."
    ]
  },
  {
    "slug": "measurement-contract",
    "title": "Define labels and business utility explicitly",
    "intro": "A synthetic contact center wants fewer missed service-level breaches. The raw database records both first response and final resolution. Choosing one timestamp changes the target; optimizing an easy-to-measure proxy can improve a dashboard without improving the actual service decision.",
    "sections": [
      [
        "Build the decision rule",
        "A label is an operational measurement of an outcome, not the outcome\u2019s complete meaning. Specify positive-class semantics, horizon, exclusion rules and label maturity. A proxy such as a click may correlate with customer value but can diverge when optimized aggressively. Missing labels are not automatically negative outcomes; they may represent unresolved cases or selective observation."
      ],
      [
        "Check the engineering boundary",
        "Compare a model with a baseline using a utility or metric that reflects the intended action. False positives and false negatives can have different costs. Evaluate coverage: the model may only have labels for cases previously investigated, producing selection bias. A stable label definition and a documented baseline make changes in observed performance interpretable. The example translates a simple known cost table into a total, without claiming those hypothetical costs apply elsewhere."
      ]
    ],
    "problem": "Define labels and business utility explicitly on a small synthetic fixture.",
    "steps": [
      "State the input and decision-time assumptions.",
      "Run the shown calculation and compare the printed result.",
      "Explain which conclusion the fixture supports and which assumptions require another check."
    ],
    "code": "truth=[1,1,0,0]; pred=[0,1,1,0]\nfn=sum(t==1 and p==0 for t,p in zip(truth,pred))\nfp=sum(t==0 and p==1 for t,p in zip(truth,pred))\nprint(fn,fp,fn*10+fp*2)",
    "expect": "1 1 12",
    "limit": "This synthetic in-memory example verifies the displayed operation under scikit-learn 1.8.0. It does not establish production accuracy, causal impact, representative sampling or acceptable error costs. Compare a model with a baseline using a utility or metric that reflects the intended action.",
    "mistakes": [
      "Do not substitute a convenient representation for the stated decision rule. A label is an operational measurement of an outcome, not the outcome\u2019s complete meaning.",
      "Do not generalize this tiny fixture beyond its sampling and information boundary. Compare a model with a baseline using a utility or metric that reflects the intended action."
    ],
    "takeaways": [
      "A label is an operational measurement of an outcome, not the outcome\u2019s complete meaning.",
      "Compare a model with a baseline using a utility or metric that reflects the intended action."
    ],
    "practice": [
      "What does a target horizon specify?|Outcome time window|Feature file size|Optimizer runtime|Array row count|The horizon defines which future outcomes belong to the prediction task.",
      "What is a false negative?|Missed positive|Correct negative|Correct positive|False alert|The model predicts negative when the observed target is positive.",
      "What is a proxy target?|Substitute measurement|Guaranteed causal outcome|Always invalid data|A model parameter|A proxy stands in for a broader objective and requires validation.",
      "A pending case has no final label. How should it be treated?|Unresolved under policy|Automatically negative|Automatically positive|A random class|Absent outcome evidence should follow a maturity policy rather than an invented label.",
      "A click model increases clicks but reduces retained users. What needs review?|Proxy alignment|Only feature sorting|Only score precision|Only estimator naming|The optimized measurement may diverge from the real business objective.",
      "Only investigated alerts receive fraud labels. What concern follows?|Selective labeling|Perfect coverage|Automatic calibration|Independent sampling|Observed outcomes may not represent cases that were never investigated."
    ],
    "formal": [
      "What defines positive-class meaning?|Label policy|Largest numeric value alone|Feature variance|Model confidence alone|Class semantics must be documented rather than inferred from encoding.",
      "Which cost measures a false alert burden?|False-positive cost|False-negative cost only|Feature count|Training variance|False alerts consume resources or cause harm when a negative case is flagged.",
      "A breach target changes from first response to final resolution. What should be versioned?|Target definition|Only plot color|Only row ordering|Only estimator seed|The learning task itself changed, making scores across versions non-equivalent.",
      "A baseline has lower recall but far fewer costly false alerts. What supports a decision?|Explicit cost tradeoff|Recall alone|Accuracy alone|Model size alone|Different error types need their operational values to judge the policy.",
      "A model is trained only on approved applications. What deployment population is unsupported?|Rejected applicants|Observed approvals|Training rows|Known label count|Selective historical decisions limit outcome coverage for other groups.",
      "A target is measured after six months but evaluated after one week. What is incomplete?|Label maturity|Feature scaling|Tree depth|Class encoding|Outcomes have not had sufficient time to be fully observed.",
      "A team sets every unreported event to zero. What assumption requires evidence?|Missing means absent|Zero is an integer|Rows have indexes|Models use matrices|Non-reporting may reflect collection failures rather than no event.",
      "A model improves a cost metric by excluding difficult clients. What else must be reported?|Coverage and exclusions|Only cost average|Only parameter size|Only package version|A changed evaluation population can make a cost improvement misleading.",
      "A target recording process changes after software migration. What may mimic drift?|Measurement change|Only learning rate|Only model latency|Only feature scaling|Changed label collection can alter measured performance without the same underlying outcome change.",
      "A policy changes which alerts are investigated, then retrains on resulting labels. What must be considered?|Feedback selection effects|Only fixed random seed|Only coefficient precision|Only label spelling|Model-driven actions affect which outcomes are observed and can bias subsequent training evidence."
    ]
  },
  {
    "slug": "learning-curves",
    "title": "Read training and validation curves as evidence",
    "intro": "A synthetic fault classifier scores almost perfectly on its training set but poorly on validation. A learning curve compares training and validation scores across training sizes so the team can distinguish data limitations from a model that cannot represent the relevant relationship.",
    "sections": [
      [
        "Build the decision rule",
        "A learning curve holds an evaluation protocol fixed while varying the number of fitting observations. High training score with a persistent lower validation score suggests a generalization gap. Low scores on both can suggest underfitting, weak features, noisy labels or a hard task. These are diagnostic patterns rather than proofs; the metric direction matters because higher scores and lower losses have opposite interpretations."
      ],
      [
        "Check the engineering boundary",
        "Use several folds or repeated partitions when appropriate, and inspect spread as well as means. Chronological or grouped tasks require matching splitters rather than a convenient row-random curve. More data may help a variance-limited model, but it cannot repair a leaked feature or an unsuitable target definition. The fixture shows how learning_curve returns size-by-fold score arrays, not a realistic estimate of achievable accuracy."
      ]
    ],
    "problem": "Read training and validation curves as evidence on a small synthetic fixture.",
    "steps": [
      "State the input and decision-time assumptions.",
      "Run the shown calculation and compare the printed result.",
      "Explain which conclusion the fixture supports and which assumptions require another check."
    ],
    "code": "from sklearn.model_selection import learning_curve\nfrom sklearn.dummy import DummyRegressor\nx=[[i] for i in range(12)]; y=[float(i%3) for i in range(12)]\ns,tr,va=learning_curve(DummyRegressor(),x,y,train_sizes=[.5,1.],cv=3,scoring=\"neg_mean_absolute_error\")\nprint(s.tolist())\nprint(tr.shape,va.shape)",
    "expect": "[4, 8]\n(2, 3) (2, 3)",
    "limit": "This synthetic in-memory example verifies the displayed operation under scikit-learn 1.8.0. It does not establish production accuracy, causal impact, representative sampling or acceptable error costs. Use several folds or repeated partitions when appropriate, and inspect spread as well as means.",
    "mistakes": [
      "Do not substitute a convenient representation for the stated decision rule. A learning curve holds an evaluation protocol fixed while varying the number of fitting observations.",
      "Do not generalize this tiny fixture beyond its sampling and information boundary. Use several folds or repeated partitions when appropriate, and inspect spread as well as means."
    ],
    "takeaways": [
      "A learning curve holds an evaluation protocol fixed while varying the number of fitting observations.",
      "Use several folds or repeated partitions when appropriate, and inspect spread as well as means."
    ],
    "practice": [
      "What does a learning curve vary?|Training sample size|Target semantics|Feature units always|Class names|It relates training size to training and validation performance.",
      "What is a generalization gap?|Train-validation difference|Feature count|Number of target classes|Array memory stride|The gap compares fit performance with held-out performance under a fixed protocol.",
      "Are learning-curve patterns definitive diagnoses?|No|Always|Only with classification|Only with regression|Several causes can produce similar score patterns.",
      "Training accuracy is high and validation accuracy low. What is a plausible concern?|Overfitting|Guaranteed underfitting|Perfect calibration|No model capacity|A large gap can indicate fitting idiosyncrasies that do not generalize.",
      "Both scores are poor as data increases. What should be investigated?|Capacity and features|Only add more rows|Only hide training score|Only rename classes|Low fit and validation performance can reflect bias, weak signal or label noise.",
      "A curve uses random folds for forecasting. What needs correction?|Temporal evaluation|Feature output type|Class label order|Model import path|The diagnostic must preserve the real future-prediction boundary."
    ],
    "formal": [
      "Which curve evidence indicates variability?|Fold-score spread|Only mean score|Only largest sample size|Only training duration|Spread across folds reveals sensitivity hidden by an average.",
      "What does a negative MAE scorer imply?|Higher is better|More negative is better|MAE became accuracy|Errors cannot be zero|scikit-learn negates losses so all scorer values share a higher-is-better convention.",
      "A validation curve improves steadily with more data. What is supported?|More data may help|Unlimited improvement guaranteed|No label errors exist|All groups are covered|The observed trend supports collecting comparable data but does not prove unbounded benefit.",
      "A large train-validation gap disappears after grouping by customer. What must be reviewed?|Split interpretation|Only plot labels|Only data dtype|Only estimator syntax|Different dependency boundaries change what generalization the scores measure.",
      "A training curve uses raw loss while validation uses accuracy. What is wrong?|Incomparable quantities|Too many samples|Too few features|No random seed|Training and validation need a consistent metric for direct gap interpretation.",
      "A small training subset lacks one class and fitting fails. What should be adjusted?|Subset feasibility|Only legend color|Only score decimals|Only result sorting|Training sizes and split strategy must preserve enough examples for the estimator.",
      "A validation curve is nearly perfect with tiny training sets. What should be checked?|Leakage and task ease|Only number of jobs|Only CPU timing|Only model name|Unexpectedly strong results warrant investigating information leakage or an unusually easy target.",
      "A curve improves on one facility but not another. Which evidence matters?|Segmented curves|Only pooled score|Only feature count|Only target order|Aggregate trends can conceal different subgroup learning behavior.",
      "A high-capacity model has unstable fold scores. Which next step is reasonable?|Regularize and compare|Select best fold only|Train on test labels|Remove weak folds|Reduced capacity and matched validation can test whether variability reflects overfitting.",
      "A team infers the exact benefit of ten times more data from a short curve. What is overstated?|Extrapolation certainty|The observed scores|The sampled sizes|The fold dimensions|Learning curves support diagnosis over observed regimes, not precise guarantees outside them."
    ]
  },
  {
    "slug": "bias-variance",
    "title": "Reason about systematic error and sample sensitivity",
    "intro": "A synthetic equipment model can use either a straight line or a very flexible curve. The straight line may miss a curved relationship consistently, while the flexible curve may chase accidental noise in each small training sample. These illustrate bias and variance.",
    "sections": [
      [
        "Build the decision rule",
        "Bias describes systematic approximation error under a learning procedure; variance describes sensitivity to which training sample is observed. Increasing flexibility can reduce approximation bias while increasing sample sensitivity, although actual behavior depends on algorithm, regularization and data. Irreducible outcome noise limits prediction even with a suitable model. A single training-validation gap does not numerically decompose error into bias, variance and noise."
      ],
      [
        "Check the engineering boundary",
        "Regularization constrains the fitted solution, often exchanging some training fit for more stable validation behavior. Additional representative training data can reduce variance, while better features can address missing signal. Label errors and distribution shift require different remedies. Treat the tradeoff as a diagnostic framework and test candidate changes using the same valid validation procedure. The example compares two polynomial capacities on a noiseless synthetic relationship to isolate representation ability."
      ]
    ],
    "problem": "Reason about systematic error and sample sensitivity on a small synthetic fixture.",
    "steps": [
      "State the input and decision-time assumptions.",
      "Run the shown calculation and compare the printed result.",
      "Explain which conclusion the fixture supports and which assumptions require another check."
    ],
    "code": "import numpy as np\nfrom sklearn.pipeline import make_pipeline\nfrom sklearn.preprocessing import PolynomialFeatures\nfrom sklearn.linear_model import LinearRegression\nx=np.array([[-2.],[-1.],[0.],[1.],[2.]])\ny=x[:,0]**2\nfor d in [1,2]:\n p=make_pipeline(PolynomialFeatures(d),LinearRegression()).fit(x,y)\n print(round(float(np.mean((p.predict(x)-y)**2)),6))",
    "expect": "2.8\n0.0",
    "limit": "This synthetic in-memory example verifies the displayed operation under scikit-learn 1.8.0. It does not establish production accuracy, causal impact, representative sampling or acceptable error costs. Regularization constrains the fitted solution, often exchanging some training fit for more stable validation behavior.",
    "mistakes": [
      "Do not substitute a convenient representation for the stated decision rule. Bias describes systematic approximation error under a learning procedure; variance describes sensitivity to which training sample is observed.",
      "Do not generalize this tiny fixture beyond its sampling and information boundary. Regularization constrains the fitted solution, often exchanging some training fit for more stable validation behavior."
    ],
    "takeaways": [
      "Bias describes systematic approximation error under a learning procedure; variance describes sensitivity to which training sample is observed.",
      "Regularization constrains the fitted solution, often exchanging some training fit for more stable validation behavior."
    ],
    "practice": [
      "What does high variance describe?|Sample sensitivity|Consistent simple error only|Target mean alone|Number of columns|Variance concerns changes in fitted predictions across training samples.",
      "What does model bias describe?|Approximation bias|Random row order|Memory consumption|Label vocabulary|Bias concerns systematic limitations of the learning procedure.",
      "Can regularization increase training error?|Yes|Never|Only with no features|Only for clustering|Constraining the fit can sacrifice training accuracy to improve generalization.",
      "A linear model misses a stable quadratic pattern. What is plausible?|Underfitting|Guaranteed leakage|Perfect calibration|No signal at all|The function family may be too restrictive for the relationship.",
      "A deep tree changes drastically across small resamples. What is plausible?|High variance|Zero model capacity|No feature dependence|Guaranteed causality|Sensitivity to sample perturbations is a variance concern.",
      "Noisy outcomes differ even for identical features. What limit exists?|Irreducible uncertainty|Guaranteed zero error|A missing model import|An array shape error|Unobserved or random outcome variation can prevent exact prediction."
    ],
    "formal": [
      "Which change often reduces effective flexibility?|Stronger regularization|More unconstrained depth|More fitted parameters always|More target leakage|Regularization penalizes or restricts complex fitted solutions.",
      "What evidence estimates generalization error?|Held-out performance|Training score alone|Parameter count alone|Feature names|Unseen observations test behavior beyond the fitting sample.",
      "A model underfits because a key sensor is absent. What may help most?|Better available features|Only more regularization|Only fewer rows|Only training longer|Missing predictive information is not repaired solely by optimizer effort.",
      "A model overfits a small sample. Which remedy deserves testing?|More representative data|Test-label fitting|More arbitrary ids|Selecting the best fold|Additional comparable observations can stabilize a sample-sensitive fit.",
      "A score drops because deployment changed. What diagnosis differs from bias-variance alone?|Distribution shift|Only feature count|Only target type|Only memory layout|A new population can fail even when internal fit and variance were acceptable.",
      "A team equates every poor training score with high bias. What is overlooked?|Solver and data issues|Only result formatting|Only category order|Only model version|Poor fit can also reflect optimization failure, corruption or weak targets.",
      "A regularized model has worse train score but better validation score. What is plausible?|Improved generalization|Guaranteed label repair|Causal identification|Removed outcome noise|A modest fit sacrifice can reduce harmful sample-specific fitting.",
      "A flexible model is stable with very large clean data. What does this show?|Capacity effects depend on data|Flexibility always fails|Variance never matters|Regularization is impossible|Sample size and signal affect the relationship between model flexibility and variance.",
      "A team reports numerical bias and variance from one split alone. What is unsupported?|Exact decomposition|Observed validation score|Training sample count|Estimator identity|A single pair of scores does not identify each error component.",
      "A high-variance model is averaged with independently perturbed peers. What condition matters?|Error correlation|Only model count|Only label dtype|Only file order|Averaging reduces variance most when component errors are not perfectly correlated."
    ]
  },
  {
    "slug": "capacity-validation",
    "title": "Choose complexity using validation evidence",
    "intro": "A synthetic renewal model compares shallow and deep trees. The deepest tree fits training labels perfectly, but the team must select depth using held-out evidence under the same group and time boundary that represents deployment.",
    "sections": [
      [
        "Build the decision rule",
        "A validation curve varies a hyperparameter while keeping the evaluation procedure consistent. Hyperparameters define the learning procedure, such as maximum depth or regularization strength; fitted parameters are learned from data within that procedure. Select settings using validation or cross-validation, then estimate the completed selection procedure on an untouched final test. A smooth-looking curve does not replace uncertainty reporting."
      ],
      [
        "Check the engineering boundary",
        "Complexity controls have algorithm-specific meanings. Increasing tree depth usually increases representational capacity, while increasing a penalty strength can decrease it; for logistic regression, C is inverse regularization strength. Compare training and validation behavior together, check computational cost, and prefer an adequate stable model when differences are uncertain. The fixture illustrates depth\u2019s effect on fitting capacity without claiming which depth will generalize."
      ]
    ],
    "problem": "Choose complexity using validation evidence on a small synthetic fixture.",
    "steps": [
      "State the input and decision-time assumptions.",
      "Run the shown calculation and compare the printed result.",
      "Explain which conclusion the fixture supports and which assumptions require another check."
    ],
    "code": "from sklearn.tree import DecisionTreeClassifier\nx=[[0],[1],[2],[3]]; y=[0,1,0,1]\nfor depth in [1,3]:\n m=DecisionTreeClassifier(max_depth=depth,random_state=0).fit(x,y)\n print(round(m.score(x,y),2))",
    "expect": "0.75\n1.0",
    "limit": "This synthetic in-memory example verifies the displayed operation under scikit-learn 1.8.0. It does not establish production accuracy, causal impact, representative sampling or acceptable error costs. Complexity controls have algorithm-specific meanings.",
    "mistakes": [
      "Do not substitute a convenient representation for the stated decision rule. A validation curve varies a hyperparameter while keeping the evaluation procedure consistent.",
      "Do not generalize this tiny fixture beyond its sampling and information boundary. Complexity controls have algorithm-specific meanings."
    ],
    "takeaways": [
      "A validation curve varies a hyperparameter while keeping the evaluation procedure consistent.",
      "Complexity controls have algorithm-specific meanings."
    ],
    "practice": [
      "What is a hyperparameter?|Procedure setting|A target label|A prediction value|A feature unit|Depth or regularization settings control how fitting is performed.",
      "What is a fitted parameter?|Value learned from training|A file extension|A chosen metric name|A fixed split ratio only|Coefficients and split thresholds are learned while fitting.",
      "Which score should guide complexity selection?|Validation score|Final test repeatedly|Training score only|Fastest import|Validation estimates candidate behavior beyond fitting rows.",
      "A deeper tree improves only training accuracy. What should be examined?|Generalization gap|Only target spelling|Only output width|Only file timestamp|Additional capacity may fit training-specific structure without a held-out gain.",
      "A logistic model increases C. What happens to regularization strength?|It decreases|It always increases|It becomes undefined|It changes class count|C is inverse regularization strength for logistic regression.",
      "A team chooses the best depth from test performance. What boundary changed?|Test became selection data|Training became unlabeled|Features became targets|Labels became groups|The final test is consumed by hyperparameter selection."
    ],
    "formal": [
      "What does a validation curve vary?|A hyperparameter|Every target value|Every row identity|Only report color|It measures performance across settings of a chosen learning control.",
      "Which tree setting directly limits path length?|max_depth|n_jobs|random_state|class_weight only|Maximum depth bounds the number of splits along a root-to-leaf path.",
      "Two settings have similar mean scores but one is highly variable. What evidence matters?|Fold variability|Only best fold|Only train maximum|Only decimal precision|Score spread informs stability when mean differences are small.",
      "A search tries hundreds of settings on a tiny validation set. What risk grows?|Selection overfitting|Guaranteed calibration|Feature independence|Label completeness|Repeated comparisons can select settings favored by validation noise.",
      "A model with slightly lower validation score meets a strict latency budget. What may justify choosing it?|Operational constraints|Training accuracy alone|Alphabetical estimator name|Larger parameter count|Selection should account for the actual action and serving requirements.",
      "A penalty is made much stronger and both scores fall. What is plausible?|Excessive constraint|Perfect generalization|Removed all noise|Automatic target repair|Over-regularization can reduce useful representational ability.",
      "A training curve is flat because the solver did not converge. What should precede capacity claims?|Optimization diagnosis|More test inspection|Feature deletion at random|Best-score reporting|An incomplete fit can mimic a capacity limitation.",
      "A regularization value is selected using grouped CV. What must final evaluation preserve?|Relevant group boundary|Only random label order|Only coefficient count|Only matrix contiguity|The final test should estimate the same intended generalization challenge.",
      "A depth-one tree performs as well as a deep tree within uncertainty. What preference can be reasonable?|Simpler adequate model|Deepest model always|Highest train score|Most parameters always|A simpler model can reduce complexity and operational burden when evidence is comparable.",
      "A team retunes complexity every month. What should an evaluation model?|The entire update policy|Only the first static fit|Only a chosen good month|Only training accuracy|An adaptive selection process must be evaluated with its real schedule and information boundary."
    ]
  },
  {
    "slug": "estimator-interface",
    "title": "Use fit and predict with aligned feature matrices",
    "intro": "A synthetic workshop wants a repeatable regression example. scikit-learn estimators expose fit for learning from examples and predict for producing outputs from new feature rows. Correct shapes and feature alignment matter before any score is meaningful.",
    "sections": [
      [
        "Build the decision rule",
        "A typical feature matrix X has shape (n_samples, n_features); y usually has one target per sample for a simple supervised task. fit(X,y) stores learned state on the estimator and returns the fitted object. predict(X_new) expects compatible feature meaning and produces one output per new observation. A one-dimensional list of features is not interchangeable with a two-dimensional one-column sample matrix."
      ],
      [
        "Check the engineering boundary",
        "A successful API call does not validate units, source completeness or whether features were available at decision time. Check training and serving schemas. Do not compare labels with predictions after separately reordering them. Estimator score methods use estimator-specific default metrics, so explicit metrics make comparisons clearer. The fixture fits a simple exact linear relationship; its zero training error does not estimate future performance."
      ]
    ],
    "problem": "Use fit and predict with aligned feature matrices on a small synthetic fixture.",
    "steps": [
      "State the input and decision-time assumptions.",
      "Run the shown calculation and compare the printed result.",
      "Explain which conclusion the fixture supports and which assumptions require another check."
    ],
    "code": "from sklearn.linear_model import LinearRegression\nm=LinearRegression().fit([[0.],[1.],[2.]],[1.,3.,5.])\nprint(m.n_features_in_)\nprint(m.predict([[3.],[4.]]).round(6).tolist())",
    "expect": "1\n[7.0, 9.0]",
    "limit": "This synthetic in-memory example verifies the displayed operation under scikit-learn 1.8.0. It does not establish production accuracy, causal impact, representative sampling or acceptable error costs. A successful API call does not validate units, source completeness or whether features were available at decision time.",
    "mistakes": [
      "Do not substitute a convenient representation for the stated decision rule. A typical feature matrix X has shape (n_samples, n_features); y usually has one target per sample for a simple supervised task.",
      "Do not generalize this tiny fixture beyond its sampling and information boundary. A successful API call does not validate units, source completeness or whether features were available at decision time."
    ],
    "takeaways": [
      "A typical feature matrix X has shape (n_samples, n_features); y usually has one target per sample for a simple supervised task.",
      "A successful API call does not validate units, source completeness or whether features were available at decision time."
    ],
    "practice": [
      "What is the usual shape of X?|Samples by features|Features only|Targets by classes always|One scalar only|Rows represent observations and columns represent feature coordinates.",
      "Which method learns model state?|fit|predict|reshape|tolist|The fit method estimates parameters using training data.",
      "Which method produces outputs for new feature rows?|predict|fit again always|mean only|split|Prediction applies the fitted estimator to new inputs.",
      "A one-feature dataset has five observations. What X shape fits the contract?|(5, 1)|(1, 5)|(5,)|(1,)|A two-dimensional sample-by-feature matrix has five rows and one column.",
      "A served table changes column order. What should be checked?|Schema compatibility|Only target variance|Only sample count|Only class frequency|The model must receive the same feature meanings in compatible positions.",
      "Predictions and outcomes are sorted separately before scoring. What may break?|Observation alignment|Estimator capacity|Feature dtype|Package import|Metrics require each prediction paired with the corresponding outcome."
    ],
    "formal": [
      "What does n_features_in_ describe?|Fitting feature count|Future sample count|Number of classes always|Training epochs always|The attribute records the input feature width seen at fit.",
      "Does zero training error prove future accuracy?|No|Yes always|Only with floats|Only with one feature|Fitting performance does not estimate behavior on unseen observations.",
      "A model was never fitted before predict. What should occur?|Fitted-state error|Automatic perfect fit|Random labels always|A valid audit score|Prediction requires learned estimator state.",
      "A regressor score is compared directly with classifier score. What should be explicit?|Metric definitions|Only class names|Only feature width|Only file order|Estimator defaults can measure different quantities such as R-squared and accuracy.",
      "A training feature is kilometers but inference provides miles. What is invalid?|Feature unit contract|Only array size|Only prediction type|Only estimator repr|Same numeric shape does not preserve a changed unit meaning.",
      "A row is duplicated in X but its label is not duplicated in y. What fails?|Sample correspondence|Only scaling variance|Only class-name order|Only numeric precision|Feature and target arrays must have aligned sample counts and identities.",
      "A classifier emits integer labels. Can they be averaged as ordinal severity automatically?|No|Yes always|Only if sorted|Only with predict|Arbitrary class ids do not establish meaningful numerical distance.",
      "A pipeline predicts two rows. What output count is normally expected?|Two outputs|One per feature|One per training row|Always one scalar|Prediction ordinarily returns an output for each input observation.",
      "A team mutates feature units after fitting but keeps the estimator unchanged. What should be rerun?|Input-contract validation|Only Python import|Only target sorting|Only chart formatting|The fitted model assumes the training feature representation at inference.",
      "A model\u2019s score method returns a high value on training rows. What review is still needed?|Independent evaluation|Only feature names|Only object serialization|Only estimator class|API success and training scores do not establish honest generalization."
    ],
    "comps": [
      "m3.c1"
    ]
  },
  {
    "slug": "pipeline-workflow",
    "title": "Compose preprocessing and prediction into one estimator",
    "intro": "A synthetic workshop uses standardized inputs before a linear model. Keeping the scaler and estimator inside one Pipeline makes the learning procedure explicit and allows cross-validation to fit preprocessing independently on each training fold.",
    "sections": [
      [
        "Build the decision rule",
        "A Pipeline presents a unified fit and predict interface while preserving stage order. Intermediate steps transform X; the final estimator learns from the transformed features. Data-dependent preprocessing must be inside the fold boundary, including imputation, scaling and feature selection. Fixed transformations such as converting centimeters to meters need a documented contract even when no statistical fitting is required."
      ],
      [
        "Check the engineering boundary",
        "Pipelines reduce accidental inconsistency but do not validate the raw feature construction process. If a globally computed feature already contains future outcomes, wrapping it in a Pipeline cannot remove the leakage. Save the fitted preprocessing with the model and record dependency versions. The fixture fits a scaler plus linear model and shows an extrapolated prediction under the same representation; this is an API illustration rather than evidence about extrapolation quality."
      ]
    ],
    "problem": "Compose preprocessing and prediction into one estimator on a small synthetic fixture.",
    "steps": [
      "State the input and decision-time assumptions.",
      "Run the shown calculation and compare the printed result.",
      "Explain which conclusion the fixture supports and which assumptions require another check."
    ],
    "code": "from sklearn.pipeline import make_pipeline\nfrom sklearn.preprocessing import StandardScaler\nfrom sklearn.linear_model import LinearRegression\np=make_pipeline(StandardScaler(),LinearRegression()).fit([[0.],[1.],[2.]],[1.,3.,5.])\nprint(p.predict([[3.]]).round(6).tolist())\nprint(len(p.steps))",
    "expect": "[7.0]\n2",
    "limit": "This synthetic in-memory example verifies the displayed operation under scikit-learn 1.8.0. It does not establish production accuracy, causal impact, representative sampling or acceptable error costs. Pipelines reduce accidental inconsistency but do not validate the raw feature construction process.",
    "mistakes": [
      "Do not substitute a convenient representation for the stated decision rule. A Pipeline presents a unified fit and predict interface while preserving stage order.",
      "Do not generalize this tiny fixture beyond its sampling and information boundary. Pipelines reduce accidental inconsistency but do not validate the raw feature construction process."
    ],
    "takeaways": [
      "A Pipeline presents a unified fit and predict interface while preserving stage order.",
      "Pipelines reduce accidental inconsistency but do not validate the raw feature construction process."
    ],
    "practice": [
      "What does a Pipeline combine?|Ordered estimator steps|Future outcomes|All data sources automatically|Only metric names|A pipeline chains transformations and a final estimator.",
      "Which stage generally produces the final prediction?|Final estimator|Every scaler|Column-name list|Random split|Preprocessing supplies transformed inputs to the last predictive estimator.",
      "Why keep learned scaling inside CV?|Fold-local statistics|Automatic causal proof|Guaranteed fair outcomes|Perfect label quality|Each training fold should estimate its own scaling parameters.",
      "A pipeline receives globally target-selected features. What remains wrong?|Upstream leakage|Pipeline order always|Estimator import|Output row count|Leakage can happen before data reaches the pipeline.",
      "A saved model is deployed with a freshly fitted scaler. What can change?|Input coordinate system|Only label names|Only sample identities|Only target variance|Refitting preprocessing changes the representation expected by the trained estimator.",
      "A fixed units conversion has no fit statistics. What still matters?|Documented semantics|Test-label access|Random category ranks|Training accuracy only|Deterministic transformations still depend on a consistent feature contract."
    ],
    "formal": [
      "What does Pipeline.fit train?|All learned stages|Only final test labels|Only feature names|Only metrics|Fitting learns each data-dependent stage in sequence.",
      "Which method should apply a fitted pipeline to held-out rows?|predict|fit with labels|fit_transform always|partial_fit always|Prediction reuses the learned preprocessing and final estimator.",
      "A pipeline imputes after a scaler that rejects missing values. What needs review?|Stage compatibility|Only model naming|Only report layout|Only class frequencies|Each intermediate output must satisfy the next stage\u2019s input requirements.",
      "A cross-validation search tunes a pipeline model C. Which parameter notation fits?|model__C|model/C|C.model|target_C|Nested estimator parameters use the step name and double underscore.",
      "A user expects Pipeline to remove duplicate entities across folds. What is missing?|Group-aware split|More scaler steps|Larger model C|More output columns|The splitter controls entity independence; preprocessing composition does not.",
      "A transformer\u2019s fit reads an external future-data file. Is the pipeline boundary sufficient?|No|Yes by naming it|Yes by standardization|Yes by scoring|The implementation can access invalid information despite the wrapper.",
      "A category encoder is absent from the saved artifact. What becomes hard to reproduce?|Feature mapping|Target horizon|Observed test labels|Raw row counts|The learned mapping determines which encoded columns the model expects.",
      "A deployment reproduces training transforms but changes source measurement rules. What persists?|Semantic mismatch|Guaranteed equivalence|Automatic calibration|Identical population|Matching code cannot compensate for changed meanings in raw data.",
      "A reviewer compares two models with different preprocessing and no record of it. What is missing?|Procedure transparency|Only train size|Only test labels|Only estimator class|Preprocessing choices are part of the candidate learning procedure.",
      "A fit/predict smoke test passes. What should remain pending?|Population validation|Whether predict executed|Whether imports worked|Whether rows were produced|API operation checks do not establish accuracy, subgroup safety or deployment utility."
    ],
    "comps": [
      "m3.c1"
    ]
  },
  {
    "slug": "reproducible-experiment",
    "title": "Record an experiment that another analyst can reproduce",
    "intro": "A synthetic model review needs more than a notebook screenshot. Another analyst should be able to identify the exact input snapshot, split procedure, target policy, fitted pipeline and metric definition that produced the reported score.",
    "sections": [
      [
        "Build the decision rule",
        "Reproducibility begins with a versioned dataset or a precise data-generation seed, explicit feature and target definitions, and a recorded split. Set estimator random_state where supported when repeatability matters, while recognizing that library versions, numerical implementations and parallel execution can affect exact results. A seed controls pseudorandom choices; it does not remove sampling uncertainty or validate a deployment population."
      ],
      [
        "Check the engineering boundary",
        "Record all meaningful selection attempts and preserve a final untouched evaluation boundary. A score without context can conceal test reuse, subgroup failures or changed labels. Small synthetic fixtures provide deterministic checks of code paths, while larger representative evaluations answer performance questions. Store private labels and answer keys outside public application assets. The example shows a deterministic tree fit under one specified runtime, not universal bitwise reproducibility."
      ]
    ],
    "problem": "Record an experiment that another analyst can reproduce on a small synthetic fixture.",
    "steps": [
      "State the input and decision-time assumptions.",
      "Run the shown calculation and compare the printed result.",
      "Explain which conclusion the fixture supports and which assumptions require another check."
    ],
    "code": "from sklearn.tree import DecisionTreeClassifier\nx=[[0],[1],[2],[3]]; y=[0,0,1,1]\na=DecisionTreeClassifier(random_state=5).fit(x,y)\nb=DecisionTreeClassifier(random_state=5).fit(x,y)\nprint((a.predict(x)==b.predict(x)).all())\nprint(a.get_params()[\"random_state\"])",
    "expect": "True\n5",
    "limit": "This synthetic in-memory example verifies the displayed operation under scikit-learn 1.8.0. It does not establish production accuracy, causal impact, representative sampling or acceptable error costs. Record all meaningful selection attempts and preserve a final untouched evaluation boundary.",
    "mistakes": [
      "Do not substitute a convenient representation for the stated decision rule. Reproducibility begins with a versioned dataset or a precise data-generation seed, explicit feature and target definitions, and a recorded split.",
      "Do not generalize this tiny fixture beyond its sampling and information boundary. Record all meaningful selection attempts and preserve a final untouched evaluation boundary."
    ],
    "takeaways": [
      "Reproducibility begins with a versioned dataset or a precise data-generation seed, explicit feature and target definitions, and a recorded split.",
      "Record all meaningful selection attempts and preserve a final untouched evaluation boundary."
    ],
    "practice": [
      "What does a random seed provide?|Repeatable random choices|Valid causal effects|Representative samples always|No outcome noise|A seed makes supported pseudorandom choices repeatable.",
      "Which record identifies the input evidence?|Dataset version|Only chart color|Only model nickname|Only score decimals|A reproducible result needs an identifiable input snapshot or generator.",
      "Does reproducibility establish usefulness?|No|Yes always|Only with fixed seeds|Only with Python|A repeatable procedure can still be invalid or ineffective.",
      "A report omits the target horizon. What cannot be reconstructed reliably?|The learning task|Only package import|Only array storage|Only model object id|Outcome timing is part of the task definition.",
      "A team reports the best of many test-guided attempts. What should be disclosed?|Selection history|Only best score|Only last seed|Only training mean|The final result is conditional on the attempts and test exposure.",
      "A deterministic fixture passes but a production model fails. What distinction matters?|Operation versus generalization|Python versus arithmetic|Integer versus string names|Rows versus columns only|A fixture verifies a known code path, not the performance of an operational population."
    ],
    "formal": [
      "Which component belongs in an experiment record?|Metric definition|Only report font|Only filename length|Only browser width|Different averaging and label conventions can change a score.",
      "What should remain outside public assets?|Private answer keys|Course titles|Public explanations|Module names|Private assessment keys and sensitive labels must not be exposed as public content.",
      "A package upgrade changes solver behavior. What should be recorded?|Runtime versions|Only raw column count|Only dataset title|Only target names|Library versions can affect numerical behavior and reproducibility.",
      "A seed is fixed but folds mix repeated customers. What remains invalid?|Evaluation independence|Only random generator|Only model import|Only output shape|Repeatable leakage is still leakage.",
      "An analyst cannot find which scaler was used. What artifact is missing?|Fitted procedure|Only test labels|Only report title|Only training duration|The fitted preprocessing state is part of the reproducible predictor.",
      "A study reports accuracy without specifying the positive class for related metrics. What needs clarification?|Label convention|Only array length|Only Python path|Only elapsed time|Class semantics and metric conventions are necessary to interpret results.",
      "A synthetic generator seed is recorded but feature-generation code changed. What else is required?|Generator version|Only the same seed|Only class count|Only target mean|A seed reproduces data only relative to the same generation procedure.",
      "A team reruns all candidates with different partitions and compares the maximum. What should be preserved?|Comparison protocol|Only winning partition|Only highest score|Only best model name|Partition and selection procedures materially affect the reported result.",
      "A reviewer wants to separate code correctness from educational approval. Which claim is accurate?|Human review still pending|Execution proves approval|A seed is certification|A score is publication|Automated verification does not replace subject-matter educational review.",
      "A repeatable model evaluation is later found to use future labels in feature creation. What is the correct response?|Invalidate that estimate|Keep it as final evidence|Rename the random seed|Hide feature lineage|Reproducibility does not legitimize an information-boundary violation."
    ],
    "comps": [
      "m3.c1"
    ]
  }
],["learning_curve.rst", "model_evaluation.rst", "compose.rst", "linear_model.rst"]);
