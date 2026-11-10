'use strict';
const {course}=require('./ml-wave3-helper');
module.exports=course("supervised-learning",[
  {
    "slug": "linear-effects",
    "title": "Fit and interpret a linear regression under explicit units",
    "intro": "A synthetic utility team models daily energy from operating hours. A linear model predicts a numeric outcome as an intercept plus a weighted sum of features. Its coefficient is a change in predicted energy per unit of the input, conditional on the other included features.",
    "sections": [
      [
        "Build the decision rule",
        "LinearRegression estimates coefficients by minimizing squared residuals under its ordinary least-squares formulation. An intercept represents the prediction when all features are zero; that point may lie outside the observed domain. Coefficient magnitude depends on feature units, so comparing raw coefficients across differently scaled inputs does not directly rank importance. Residuals are observed target minus predicted target and should be examined across fitted values, time and relevant groups."
      ],
      [
        "Check the engineering boundary",
        "Correlated features can make individual coefficients unstable even when predictions remain similar. A positive coefficient is an association under the fitted model, not a causal effect of changing that feature. Check linearity, outliers and target units before interpreting a fitted effect. Extrapolation beyond training support can produce implausible values. The fixture deliberately uses an exact relationship to make the slope arithmetic visible; zero training error is not a generalization claim."
      ]
    ],
    "problem": "Fit and interpret a linear regression under explicit units on a small synthetic fixture.",
    "steps": [
      "State the input and decision-time assumptions.",
      "Run the shown calculation and compare the printed result.",
      "Explain which conclusion the fixture supports and which assumptions require another check."
    ],
    "code": "from sklearn.linear_model import LinearRegression\nm=LinearRegression().fit([[0.],[1.],[2.]],[5.,8.,11.])\nprint(m.coef_.round(6).tolist())\nprint(round(float(m.intercept_),6))\nprint(m.predict([[3.]]).round(6).tolist())",
    "expect": "[3.0]\n5.0\n[14.0]",
    "limit": "This synthetic in-memory example verifies the displayed operation under scikit-learn 1.8.0. It does not establish production accuracy, causal impact, representative sampling or acceptable error costs. Correlated features can make individual coefficients unstable even when predictions remain similar.",
    "mistakes": [
      "Do not substitute a convenient representation for the stated decision rule. LinearRegression estimates coefficients by minimizing squared residuals under its ordinary least-squares formulation.",
      "Do not generalize this tiny fixture beyond its sampling and information boundary. Correlated features can make individual coefficients unstable even when predictions remain similar."
    ],
    "takeaways": [
      "LinearRegression estimates coefficients by minimizing squared residuals under its ordinary least-squares formulation.",
      "Correlated features can make individual coefficients unstable even when predictions remain similar."
    ],
    "practice": [
      "What is the prediction rule of a simple linear model?|Weighted sum + intercept|Only largest feature|Always target median|A category lookup only|A linear prediction adds an intercept to the weighted feature sum.",
      "What loss does ordinary least squares minimize?|Squared residual sum|Absolute error always|Classification accuracy|Tree impurity only|OLS fits by minimizing summed squared prediction deviations.",
      "What are the units of a slope?|Target/input units|Only target units|Only sample count|Always a probability|A slope converts a unit change in an input into predicted target change.",
      "A coefficient changes after meters are converted to centimeters. What is expected?|Unit-dependent magnitude|Automatic causal change|A new target class|A broken fit always|Equivalent effects use different coefficient magnitudes under changed input units.",
      "A model predicts negative demand far beyond observed hours. What needs review?|Extrapolation validity|Only intercept printing|Only array strides|Only class vocabulary|A linear form can produce unreasonable predictions outside observed support.",
      "Two nearly identical predictors have unstable coefficients. What is plausible?|Collinearity|Perfect calibration|No fitted intercept|No feature signal|Correlated predictors can trade coefficient weight without large predictive changes."
    ],
    "formal": [
      "What is a residual under the stated convention?|Observed minus predicted|Prediction count|Coefficient squared|Feature maximum|A residual records the signed prediction error.",
      "What does the intercept represent?|Prediction at zero inputs|Target variance|Number of fitted rows|Largest coefficient|The intercept is the fitted prediction when all inputs are zero.",
      "A baseline and linear model use different target units. What must be corrected?|Shared target units|Only random seeds|Only column count|Only model labels|Error magnitudes are interpretable only under compatible outcome units.",
      "A positive coefficient is described as proof that spending causes renewal. What is unsupported?|Causal attribution|Coefficient arithmetic|Training row count|Prediction shape|Observational predictive coefficients do not identify intervention effects.",
      "A residual plot curves systematically with input. What is plausible?|Nonlinear pattern|Perfect model fit|No outcome variance|A category-order issue|Structured residuals can indicate an inadequately modeled relationship.",
      "A few extreme targets dominate squared-error fitting. What should be assessed?|Outlier influence|Only feature names|Only dtype strings|Only test fraction|Squaring errors gives unusually large residuals high influence.",
      "A demand model fitted for 6–10 operating hours uses x=hours−8 and predicts kWh=12+3x. An analyst calls 12 the demand of a closed facility. Which interpretation follows from the encoding and data support?|12 kWh refers to eight operating hours|12 kWh refers to zero operating hours|−12 kWh is verified at zero operating hours|3 kWh is the expected demand at eight hours|The encoded zero is eight hours, inside the observed range. Physical zero hours gives x=−8 and an extrapolated −12, not a validated closed-facility prediction.",
      "A team compares raw slope sizes across dollars and age. What is missing?|Unit-aware slopes|Only model filename|Only label balance|Only split duration|Raw coefficients mix unit scales and conditional relationships.",
      "A fitted model is accurate in-range but fails on a new operating regime. What should be reported?|Support-dependent limits|Only training fit|Only mean coefficient|Only input dtype|Validation within one regime does not establish extrapolation quality.",
      "A linear demand model uses hours and machine cycles, nearly proportional in training. Dropping cycles changes the hours slope but barely changes held-out error on the same operating regime. A new plant varies cycles independently. Which conclusion is justified?|Same-regime prediction held; transfer needs testing|Stable error establishes the hours slope as causal|Unchanged error proves cycles add no value anywhere|The new plant can inherit the old calibration|Correlated inputs can redistribute coefficient weight without changing predictions where their relation holds. Decoupling them changes support, so the new plant requires separate validation; stable error identifies neither causality nor universal redundancy."
    ]
  },
  {
    "slug": "logistic-probability",
    "title": "Separate logistic scores, probabilities and decisions",
    "intro": "A synthetic application model estimates whether an account renews. Logistic regression maps a linear score through a logistic link for a binary outcome. The resulting probability and a thresholded decision serve different purposes and should not be confused.",
    "sections": [
      [
        "Build the decision rule",
        "For binary logistic regression, a coefficient changes log-odds per feature unit while holding other included features fixed. Exponentiating a coefficient gives an odds ratio under the model, not a percentage-point probability increase. Probability changes depend on the starting score. predict_proba columns follow classes_ order, so applications should identify the positive-class column explicitly rather than assume a business meaning from position alone."
      ],
      [
        "Check the engineering boundary",
        "A default classification threshold is a software convention, not an automatically optimal business policy. Select thresholds using development evidence and costs, then keep final evaluation separate. Regularization affects fitted coefficients and probabilities. Calibration must be assessed on independent data, especially after class weighting or population changes. The synthetic fixture shows probability normalization and class ordering without asserting real-world calibration."
      ]
    ],
    "problem": "Separate logistic scores, probabilities and decisions on a small synthetic fixture.",
    "steps": [
      "State the input and decision-time assumptions.",
      "Run the shown calculation and compare the printed result.",
      "Explain which conclusion the fixture supports and which assumptions require another check."
    ],
    "code": "from sklearn.linear_model import LogisticRegression\nm=LogisticRegression(C=1.,solver=\"lbfgs\").fit([[-2.],[-1.],[1.],[2.]],[0,0,1,1])\np=m.predict_proba([[0.]])\nprint(m.classes_.tolist())\nprint(p.round(6).tolist())\nprint(round(float(p.sum()),6))",
    "expect": "[0, 1]\n[[0.5, 0.5]]\n1.0",
    "limit": "This synthetic in-memory example verifies the displayed operation under scikit-learn 1.8.0. It does not establish production accuracy, causal impact, representative sampling or acceptable error costs. A default classification threshold is a software convention, not an automatically optimal business policy.",
    "mistakes": [
      "Do not substitute a convenient representation for the stated decision rule. For binary logistic regression, a coefficient changes log-odds per feature unit while holding other included features fixed.",
      "Do not generalize this tiny fixture beyond its sampling and information boundary. A default classification threshold is a software convention, not an automatically optimal business policy."
    ],
    "takeaways": [
      "For binary logistic regression, a coefficient changes log-odds per feature unit while holding other included features fixed.",
      "A default classification threshold is a software convention, not an automatically optimal business policy."
    ],
    "practice": [
      "What does a binary logistic coefficient affect linearly?|Log-odds|Raw probability always|Feature variance|Class count|The logistic link makes the linear score a log-odds quantity.",
      "What identifies predict_proba column semantics?|classes_ order|Feature order|Row order|Coefficient count|Probability columns correspond to the estimator’s class ordering.",
      "Is a probability threshold automatically a business optimum?|No|Always|Only at 0.5|Only after scaling|The optimal decision policy depends on error costs and constraints.",
      "A coefficient is 0.7. Can it mean a fixed 70-point probability gain?|No|Yes always|Only for positives|Only with intercept|A log-odds change does not translate into a constant probability-point change.",
      "A service reads probability column zero as urgent without checking classes. What is needed?|Class-column mapping|More model depth|Target standardization|A new row index|Applications must bind probability columns to explicit class semantics.",
      "A weighted classifier’s probabilities are treated as calibrated population risk. What should be tested?|Held-out calibration|Only training accuracy|Only weight names|Only fit duration|Weighting and population differences can affect probability interpretation."
    ],
    "formal": [
      "Which function maps a binary logit to probability?|Logistic sigmoid|Array transpose|Absolute value|Polynomial degree|The sigmoid maps the real-valued score into a zero-to-one probability.",
      "What does exp(coefficient) express in the model?|Odds ratio|Risk difference always|Recall increase|Sample weight|Exponentiation converts a log-odds coefficient into an odds multiplier.",
      "A model has high ROC-AUC but poor threshold accuracy. What can differ?|Ranking versus decisions|Feature count and labels|Import path and score|Class names and units|Good ranking does not guarantee an appropriate fixed decision threshold.",
      "A positive slope yields smaller probability changes near saturation. Is this consistent?|Yes|No for any logit|Only with no intercept|Only with integer features|The logistic function’s derivative depends on the current probability.",
      "A compliance report calls a coefficient a causal driver. What evidence is missing?|Causal identification|Only more decimals|Only a larger C|Only class labels|Predictive associations under the model do not establish causal effects.",
      "A serving system rounds probabilities to integers before ranking. What is lost?|Risk-score resolution|Training sample count|Target vocabulary|Feature units|Rounding to zero or one destroys useful ordering information.",
      "A team selects threshold on the final test. What should change?|Use development data|Only report best threshold|Hide other thresholds|Refit test targets|Threshold selection is model development and consumes evaluation information.",
      "Feature units change while coefficients remain fixed. What is affected?|Predicted probabilities|Only class order|Only sample count|Only metric naming|The linear score depends on compatible feature units and learned coefficients.",
      "A model predicts 0.8 for a group whose observed event rate is 0.4. What should be investigated?|Probability calibration|Only ranking speed|Only feature width|Only label type|Probability reliability compares predicted risks with observed frequencies under a valid sample.",
      "A binary model has identical ranking after a monotone score transform. Which quantity can still change?|Probability calibration|ROC ranking order|Pairwise ranking always|Class support|A monotone transformation preserves ranking but can substantially alter probability reliability and threshold meaning."
    ]
  },
  {
    "slug": "regularized-fit",
    "title": "Use regularization with scaled and correlated features",
    "intro": "A synthetic energy regression has several correlated sensor summaries. Unconstrained coefficients can become unstable on a small sample. Ridge and Lasso add penalties that trade some training fit for constrained coefficients, but they have different sparsity behavior.",
    "sections": [
      [
        "Build the decision rule",
        "Ridge adds an L2 penalty on coefficient magnitude; Lasso uses an L1 penalty and can set some coefficients exactly to zero. Penalty strength alpha increases regularization in these regressors. Logistic regression instead exposes inverse strength C for common penalties. Scaling matters because a coefficient penalty depends on units: an unscaled large-range feature can represent the same effect with a smaller coefficient and therefore a different penalty cost."
      ],
      [
        "Check the engineering boundary",
        "Select regularization within a preprocessing pipeline using valid cross-validation. A zero Lasso coefficient is not proof that the feature has no causal relevance; correlated predictors can substitute for one another, and the selected subset may change across samples. Check solver convergence and the actual estimator’s penalty support. The fixture uses Ridge with and without penalty on a centered one-feature problem so the shrinkage calculation is transparent."
      ]
    ],
    "problem": "Use regularization with scaled and correlated features on a small synthetic fixture.",
    "steps": [
      "State the input and decision-time assumptions.",
      "Run the shown calculation and compare the printed result.",
      "Explain which conclusion the fixture supports and which assumptions require another check."
    ],
    "code": "from sklearn.linear_model import Ridge\nx=[[-1.],[0.],[1.]]; y=[-2.,0.,2.]\nfor a in [0.,2.]:\n m=Ridge(alpha=a).fit(x,y)\n print(m.coef_.round(6).tolist())",
    "expect": "[2.0]\n[1.0]",
    "limit": "This synthetic in-memory example verifies the displayed operation under scikit-learn 1.8.0. It does not establish production accuracy, causal impact, representative sampling or acceptable error costs. Select regularization within a preprocessing pipeline using valid cross-validation.",
    "mistakes": [
      "Do not substitute a convenient representation for the stated decision rule. Ridge adds an L2 penalty on coefficient magnitude; Lasso uses an L1 penalty and can set some coefficients exactly to zero.",
      "Do not generalize this tiny fixture beyond its sampling and information boundary. Select regularization within a preprocessing pipeline using valid cross-validation."
    ],
    "takeaways": [
      "Ridge adds an L2 penalty on coefficient magnitude; Lasso uses an L1 penalty and can set some coefficients exactly to zero.",
      "Select regularization within a preprocessing pipeline using valid cross-validation."
    ],
    "practice": [
      "Which penalty does Ridge use?|L2|L1 only|No penalty ever|Tree-depth penalty|Ridge penalizes squared coefficient magnitude.",
      "Which penalty can create exact zero coefficients?|L1|L2 always|No penalty|Class frequency|An L1 penalty can yield sparse coefficient solutions.",
      "What does larger Ridge alpha mean?|Stronger penalty|Weaker penalty|More classes|More observations|Alpha multiplies the coefficient penalty.",
      "Feature units differ greatly before Lasso. What should be considered?|Training-fitted scaling|Target class sorting|Test-label imputation|More output rows|Coefficient penalties depend on feature scaling.",
      "A Lasso feature receives zero weight. What cannot be inferred alone?|No causal relevance|Its fitted coefficient|The chosen alpha|The output shape|Predictive selection under a penalty does not establish a causal absence.",
      "A regularized fit reports convergence warnings. What should happen?|Diagnose solver behavior|Ignore every warning|Use test score only|Add target leakage|An unconverged numerical fit can invalidate comparisons."
    ],
    "formal": [
      "What does L2 regularization typically encourage?|Smaller coefficients|More target classes|Unbounded coefficients|Random label order|The penalty discourages large coefficient magnitudes.",
      "Which logistic setting usually means stronger regularization?|Smaller C|Larger C|Larger test set|More class names|C is inverse strength in logistic regression.",
      "A model scales all rows before CV tuning alpha. What leaks?|Validation statistics|Only parameter names|Only row counts|Only feature descriptions|Preprocessing statistics must be learned independently within each training fold.",
      "Highly correlated features alternate in Lasso selections across folds. What is plausible?|Selection instability|No predictive signal ever|Guaranteed unique causes|Broken target encoding|Correlated predictors can substitute for each other in sparse solutions.",
      "A strong penalty worsens train and validation performance. What is plausible?|Underfitting|Perfect regularization|Eliminated all noise|Guaranteed calibration|An excessive constraint can suppress useful signal.",
      "A reviewer compares alpha values across differently scaled datasets. What caveat matters?|Scale dependence|Only target labels|Only feature naming|Only random seed|The same numeric alpha need not have the same effective meaning under changed feature scales.",
      "A Ridge model has all nonzero coefficients. Is it necessarily malfunctioning?|No|Yes for L2|Only with float inputs|Only with intercept|Ridge generally shrinks coefficients without forcing sparsity.",
      "A team tunes alpha and feature count on one test set. What is compromised?|Test independence|Only solver imports|Only matrix dtype|Only feature units|Both choices adapt the learning procedure to the exposed test.",
      "A penalized model has better held-out MAE and slightly worse training MSE. What must be clarified?|Comparable metric context|Only coefficient order|Only model filename|Only class prevalence|Different metrics and populations should be reported clearly when assessing the tradeoff.",
      "A sparse feature set is required for costly data collection, but correlated choices vary. What evidence supports a robust choice?|Stability and cost|Only one Lasso fit|Only largest coefficient|Only training accuracy|Selection should consider resampling stability, valid predictive performance and the actual cost of collecting each feature."
    ]
  },
  {
    "slug": "tree-splits",
    "title": "Understand recursive partitions and capacity controls",
    "intro": "A synthetic service desk classifies urgent cases using wait time and queue size. A decision tree partitions feature space with a sequence of threshold questions, then predicts from the training outcomes within the reached leaf.",
    "sections": [
      [
        "Build the decision rule",
        "A tree chooses splits that improve its training impurity or loss criterion. A classification leaf estimates class behavior from its weighted training support; a regression leaf commonly predicts the mean target under squared-error settings. Deep trees can isolate very small groups and memorize noise. max_depth, min_samples_leaf and related controls restrict complexity. A threshold representation is interpretable only when feature units and availability are understood."
      ],
      [
        "Check the engineering boundary",
        "Trees generally do not need feature scaling to balance Euclidean distances because they split on individual feature orderings. This does not make data quality irrelevant: missingness handling, leakage, high-cardinality identifiers and unstable small leaves still require review. Feature importance based on impurity is not a causal attribution and can favor features with many candidate splits. The fixture shows how leaf support and depth affect a simple alternating label pattern."
      ]
    ],
    "problem": "Understand recursive partitions and capacity controls on a small synthetic fixture.",
    "steps": [
      "State the input and decision-time assumptions.",
      "Run the shown calculation and compare the printed result.",
      "Explain which conclusion the fixture supports and which assumptions require another check."
    ],
    "code": "from sklearn.tree import DecisionTreeClassifier\nx=[[0],[1],[2],[3]]; y=[0,1,0,1]\nm=DecisionTreeClassifier(max_depth=1,random_state=0).fit(x,y)\nprint(m.get_depth(),m.get_n_leaves())\nprint(m.predict(x).tolist())",
    "expect": "1 2\n[0, 1, 1, 1]",
    "limit": "This synthetic in-memory example verifies the displayed operation under scikit-learn 1.8.0. It does not establish production accuracy, causal impact, representative sampling or acceptable error costs. Trees generally do not need feature scaling to balance Euclidean distances because they split on individual feature orderings.",
    "mistakes": [
      "Do not substitute a convenient representation for the stated decision rule. A tree chooses splits that improve its training impurity or loss criterion.",
      "Do not generalize this tiny fixture beyond its sampling and information boundary. Trees generally do not need feature scaling to balance Euclidean distances because they split on individual feature orderings."
    ],
    "takeaways": [
      "A tree chooses splits that improve its training impurity or loss criterion.",
      "Trees generally do not need feature scaling to balance Euclidean distances because they split on individual feature orderings."
    ],
    "practice": [
      "What does a tree path apply?|Sequential split rules|One global slope only|Random target ordering|A feature average only|A path routes an observation through a sequence of feature tests.",
      "Which setting directly imposes minimum leaf support?|min_samples_leaf|max_features only|n_jobs|warm_start only|Minimum leaf size prevents leaves supported by too few training observations.",
      "Do threshold trees require scaling for distance balance?|No|Always|Only with two features|Only for regression|Tree splits use individual feature thresholds rather than Euclidean distances.",
      "A tree isolates one mislabeled row in a deep leaf. What risk appears?|Noise memorization|Guaranteed calibration|Lower variance always|No fitted parameters|Small deep leaves can encode sample-specific noise.",
      "A feature with many unique values dominates impurity importance. What caution applies?|Split-opportunity bias|Causal proof|Perfect external validity|No model capacity|Impurity importance can favor variables with many candidate split points.",
      "A service reads a leaf rule without units. What is missing?|Feature semantics|Only tree count|Only target sort|Only model filename|A threshold such as ten means little without its unit and measurement contract."
    ],
    "formal": [
      "What is a leaf?|Final tree region|The first input column|A target timestamp|A CV fold|A leaf is a terminal node used to generate predictions.",
      "What does max_depth limit?|Path length|Class count|Feature unit range|Dataset size always|Depth bounds the number of recursive split levels.",
      "A tree fits training perfectly but fails new facilities. What should be reviewed?|Capacity and data split|Only label strings|Only array memory order|Only estimator repr|Overfitting and facility dependence can both inflate internal performance.",
      "A regression tree predicts outside the target range seen in its leaves. Under ordinary mean-leaf prediction, what is expected?|Leaf training mean|Linear extrapolation|A logistic logit|A random target|Standard regression-tree leaves predict an aggregate of fitting outcomes rather than linear extrapolation.",
      "A feature is multiplied by a positive constant. What often remains equivalent in a threshold tree?|Order-based partitions|Raw threshold values|Feature units|Coefficient penalties|Positive monotone rescaling preserves the ordering that supports equivalent threshold splits.",
      "A leaf contains only two examples and reports probability one. What should temper confidence?|Small support|Only class-name length|Only tree serialization|Only matrix width|A pure tiny leaf provides little evidence about population risk.",
      "A high-cardinality customer id is available at fit. What failure mode deserves testing?|Identity memorization|Automatic fairness|Guaranteed calibration|Target independence|A tree can partition ids in ways that fit known entities without transferable signal.",
      "A reviewer describes impurity importance as the effect of intervention. What is wrong?|Causality is unproved|Only importance rounding|Only split ordering|Only class spelling|Importance measures predictive use under the model, not an identified causal effect.",
      "A larger min_samples_leaf improves validation stability. What is plausible?|Reduced leaf variance|More exact memorization|More target classes|Guaranteed zero bias|Larger leaves pool more training evidence and limit very fine partitions.",
      "A tree rule is readable but uses a post-outcome feature. Is interpretability sufficient?|No|Yes if shallow|Yes if deterministic|Yes with few leaves|A clear explanation cannot make an unavailable predictor legitimate for the decision."
    ]
  },
  {
    "slug": "forest-averaging",
    "title": "Compare bagged trees with individual trees",
    "intro": "A synthetic maintenance team sees one tree change greatly after a few training rows change. A random forest averages many trees trained with resampling and randomized feature choices, aiming to reduce sample sensitivity while retaining nonlinear interactions.",
    "sections": [
      [
        "Build the decision rule",
        "Bagging averages models trained on bootstrap-like resamples. Random forests also randomize feature candidates during splitting to reduce correlation among trees. Increasing n_estimators usually stabilizes the ensemble average but costs memory and prediction time; it does not automatically correct an invalid split. Tree depth and minimum leaf size still control individual-tree complexity."
      ],
      [
        "Check the engineering boundary",
        "Averaging helps less when every tree makes the same systematic mistake. Out-of-bag estimates use observations omitted from each tree’s bootstrap fitting sample, but ordinary OOB evaluation does not enforce group or time separation. For correlated observations, external grouped or temporal validation remains necessary. Impurity importances retain their interpretation limits. The fixture checks reproducible ensemble predictions and fitted tree count, not a universal performance advantage."
      ]
    ],
    "problem": "Compare bagged trees with individual trees on a small synthetic fixture.",
    "steps": [
      "State the input and decision-time assumptions.",
      "Run the shown calculation and compare the printed result.",
      "Explain which conclusion the fixture supports and which assumptions require another check."
    ],
    "code": "from sklearn.ensemble import RandomForestClassifier\nx=[[0],[1],[2],[3]]; y=[0,0,1,1]\nm=RandomForestClassifier(n_estimators=5,max_depth=2,random_state=3).fit(x,y)\nprint(len(m.estimators_))\nprint(m.predict([[0],[3]]).tolist())",
    "expect": "5\n[0, 1]",
    "limit": "This synthetic in-memory example verifies the displayed operation under scikit-learn 1.8.0. It does not establish production accuracy, causal impact, representative sampling or acceptable error costs. Averaging helps less when every tree makes the same systematic mistake.",
    "mistakes": [
      "Do not substitute a convenient representation for the stated decision rule. Bagging averages models trained on bootstrap-like resamples.",
      "Do not generalize this tiny fixture beyond its sampling and information boundary. Averaging helps less when every tree makes the same systematic mistake."
    ],
    "takeaways": [
      "Bagging averages models trained on bootstrap-like resamples.",
      "Averaging helps less when every tree makes the same systematic mistake."
    ],
    "practice": [
      "What does a random forest combine?|Multiple randomized trees|One fixed linear slope|Only target averages|Unlabeled centroids|The ensemble combines predictions from randomized decision trees.",
      "Which setting controls the number of trees?|n_estimators|max_depth|min_samples_leaf|class_weight|n_estimators determines the ensemble member count.",
      "Why randomize feature candidates among trees?|Decorrelate trees|Create target labels|Guarantee causality|Remove all bias|Less-correlated component errors can make averaging more effective.",
      "All trees share the same leaked feature. What will averaging fix?|It cannot fix leakage|It guarantees independence|It repairs timestamps|It removes target proxies|Shared invalid information remains invalid throughout the ensemble.",
      "A forest doubles trees and exceeds latency limits. What tradeoff changed?|Stability versus cost|Class semantics|Target horizon|Feature units|More trees increase inference work and can stabilize the average.",
      "Rows from one patient appear in several bootstrap samples. Does OOB ensure unseen-patient validation?|No|Always|Only with many trees|Only with deep trees|Row-level omission does not enforce patient-level separation."
    ],
    "formal": [
      "What is bootstrap sampling?|Sampling with replacement|Sorting by target|Deleting all rare classes|Scaling each row|Bootstrap resamples allow repeated selection of training observations.",
      "What does averaging most directly reduce when errors differ?|Variance|All irreducible noise|Every bias source|Target count|Combining partly independent sample-sensitive predictions can reduce variance.",
      "A forest has excellent OOB score on repeated devices. What additional evaluation is needed?|Group-aware holdout|Only more trees|Only larger bootstrap|Only feature sorting|OOB row omission can leave related devices or repeated identities in fitting data.",
      "A forest grows very deep trees on tiny data. What remains relevant?|Leaf-size controls|Only report color|Only target names|Only Python import|Many trees do not eliminate the need to control individual-tree behavior.",
      "A team calls forest impurity importance causal. What is unsupported?|Intervention meaning|The computed ranking|The fitted tree count|The prediction shape|Predictive importance under an ensemble does not identify causal effects.",
      "A forest’s trees have perfectly correlated errors. What benefit of averaging is limited?|Variance reduction|Output row count|Feature input width|Label vocabulary|Identical errors cannot cancel through averaging.",
      "A service adds more trees but validation mean barely changes. What is plausible?|Diminishing returns|A guaranteed bug|More target classes|Improved label quality|The ensemble average may already be sufficiently stable under that population.",
      "A forest is compared with a single tree on different holdouts. What is confounded?|Population differences|Only tree serialization|Only memory layout|Only class labels|Different evaluation cases can drive apparent score differences.",
      "A forest memorizes account ids and fails new accounts. Which response fits?|Audit features and split|Only increase trees|Only turn on OOB|Only hide ids in reports|Valid transferable features and an entity-aware split are required.",
      "A team relies on OOB to certify next-year performance across new hospitals. What is the main gap?|Time and site boundaries|Number of tree objects|Classifier API shape|Availability of predict|OOB does not simulate the combined future and unseen-site deployment challenge."
    ]
  },
  {
    "slug": "boosting-sequence",
    "title": "Compare sequential boosting with parallel averaging",
    "intro": "A synthetic demand team compares a random forest with gradient boosting. Both use trees, but a forest averages randomized trees while boosting adds successive models to improve a loss-based ensemble. The training and tuning controls therefore have different interactions.",
    "sections": [
      [
        "Build the decision rule",
        "Gradient boosting builds an additive model sequentially. Under squared-error loss, later trees fit residual structure; for other differentiable losses the fitting signal is related to negative loss gradients. learning_rate scales each stage’s contribution, and n_estimators controls the number of stages. Smaller steps often require more stages. Tree depth or leaf controls determine the complexity added at each stage."
      ],
      [
        "Check the engineering boundary",
        "Boosting can fit complex interactions efficiently but can overfit noisy data or invalid features. Early stopping uses a validation mechanism and therefore must respect the intended group or time design; a convenient internal random validation split may not match deployment. Compare algorithms under matched evaluation and resource constraints. The fixture shows training error falling as a simple squared-error booster receives more stages, not a guarantee of generalization."
      ]
    ],
    "problem": "Compare sequential boosting with parallel averaging on a small synthetic fixture.",
    "steps": [
      "State the input and decision-time assumptions.",
      "Run the shown calculation and compare the printed result.",
      "Explain which conclusion the fixture supports and which assumptions require another check."
    ],
    "code": "import numpy as np\nfrom sklearn.ensemble import GradientBoostingRegressor\nx=np.arange(8).reshape(-1,1); y=np.array([0.,0.,0.,0.,4.,4.,4.,4.])\nfor n in [1,10]:\n m=GradientBoostingRegressor(n_estimators=n,learning_rate=.5,max_depth=1,random_state=0).fit(x,y)\n print(round(float(np.mean((m.predict(x)-y)**2)),6))",
    "expect": "1.0\n4e-06",
    "limit": "This synthetic in-memory example verifies the displayed operation under scikit-learn 1.8.0. It does not establish production accuracy, causal impact, representative sampling or acceptable error costs. Boosting can fit complex interactions efficiently but can overfit noisy data or invalid features.",
    "mistakes": [
      "Do not substitute a convenient representation for the stated decision rule. Gradient boosting builds an additive model sequentially.",
      "Do not generalize this tiny fixture beyond its sampling and information boundary. Boosting can fit complex interactions efficiently but can overfit noisy data or invalid features."
    ],
    "takeaways": [
      "Gradient boosting builds an additive model sequentially.",
      "Boosting can fit complex interactions efficiently but can overfit noisy data or invalid features."
    ],
    "practice": [
      "How are boosting stages added?|Sequentially|As independent votes only|Without fitting data|By target sorting|Each stage improves the current additive model under a loss.",
      "Which setting scales each stage contribution?|learning_rate|n_jobs|class_names|test_size|The learning rate shrinks the additive update from each stage.",
      "Under squared-error boosting, what do later trees model?|Residual structure|Only raw class names|Only feature units|Only row ids|Squared-error negative gradients are proportional to residuals.",
      "A team reduces learning_rate tenfold without changing stage count. What may occur?|Too little fitting|Automatic better accuracy|More target classes|No behavior change|Smaller updates may require more stages to achieve comparable fitting progress.",
      "An early-stopping split shuffles future and past events. What needs review?|Temporal boundary|Only estimator repr|Only memory layout|Only feature names|Validation used for stopping must match the forecasting information boundary.",
      "A booster learns a leaked outcome proxy. Does stage shrinkage make it legitimate?|No|Yes with enough stages|Yes with tiny rate|Yes for regression|Regularization cannot validate an unavailable feature."
    ],
    "formal": [
      "What is the boosting prediction form?|Added stage predictions|Single leaf only|Unweighted target list|Category vocabulary|The additive ensemble combines scaled stage outputs.",
      "Which setting controls the number of boosting stages?|n_estimators|max_features only|n_jobs only|random_state only|n_estimators specifies the stage count.",
      "Training loss keeps falling while validation loss rises. What is plausible?|Overfitting|Guaranteed underfitting|Perfect calibration|No data dependence|Additional stages may fit noise rather than transferable structure.",
      "A forest and booster use the same number of trees. Are their fitting procedures equivalent?|No|Yes always|Only at depth one|Only for regression|Averaging randomized trees and sequential additive loss fitting are different procedures.",
      "A booster’s shallow stages outperform one deep tree. What may explain it?|Additive interactions|No feature dependence|Automatic causal truth|No learned parameters|Multiple small updates can represent useful nonlinear structure.",
      "A service requires low latency. What must be measured for boosting candidates?|Total serving latency|Only training loss|Only class-name length|Only raw row count|Stage count and tree complexity affect serving work.",
      "A noisy dataset favors fewer stages in validation. What does this support?|Stopping earlier|Always adding stages|Fitting test labels|Removing all regularization|The held-out evidence may favor limiting sample-specific fitting.",
      "A model’s internal validation ignores group ids. What may be inflated?|Stopping score|Only training duration|Only output precision|Only feature width|Dependent groups can contaminate the stopping signal.",
      "A team claims boosting is always superior to forests. What evidence is missing?|Task comparison|Only library import|Only tree count|Only model nickname|Algorithm performance depends on data, evaluation and operational constraints.",
      "A time-aware outer evaluation wraps a booster whose early stopping uses shuffled internal rows. What must be audited?|Inner selection boundary|Only outer fold count|Only final tree names|Only score decimals|Every selection stage, including internal stopping, must respect the relevant information boundary."
    ]
  },
  {
    "slug": "cross-validation",
    "title": "Estimate a learning procedure with valid folds",
    "intro": "A synthetic equipment team has limited labeled data and several candidate models. Cross-validation rotates held-out subsets so each candidate is evaluated across several training and validation partitions, but the splitter must still reflect entity and time dependencies.",
    "sections": [
      [
        "Build the decision rule",
        "In K-fold cross-validation, each fold holds out a subset while the remaining folds train a fresh estimator. Stratified folds seek class-proportion balance for classification; grouped and temporal splitters solve different dependency problems. A Pipeline keeps learned preprocessing inside each fitting fold. Cross-validation estimates behavior under its chosen partition design, not automatic performance in every future population."
      ],
      [
        "Check the engineering boundary",
        "All model choices guided by cross-validation are development decisions. If an unbiased estimate of a search procedure is needed, nested cross-validation can place tuning in an inner loop and evaluation in an outer loop. An untouched external test is another final evaluation strategy. Fold scores can be correlated because training subsets overlap, so a naive standard error treating folds as independent observations can be misleading."
      ]
    ],
    "problem": "Estimate a learning procedure with valid folds on a small synthetic fixture.",
    "steps": [
      "State the input and decision-time assumptions.",
      "Run the shown calculation and compare the printed result.",
      "Explain which conclusion the fixture supports and which assumptions require another check."
    ],
    "code": "from sklearn.model_selection import cross_val_score,KFold\nfrom sklearn.dummy import DummyRegressor\nx=[[i] for i in range(6)]; y=[0.,1.,2.,3.,4.,5.]\ns=cross_val_score(DummyRegressor(),x,y,cv=KFold(3),scoring=\"neg_mean_absolute_error\")\nprint(s.round(6).tolist())",
    "expect": "[-3.0, -0.5, -3.0]",
    "limit": "This synthetic in-memory example verifies the displayed operation under scikit-learn 1.8.0. It does not establish production accuracy, causal impact, representative sampling or acceptable error costs. All model choices guided by cross-validation are development decisions.",
    "mistakes": [
      "Do not substitute a convenient representation for the stated decision rule. In K-fold cross-validation, each fold holds out a subset while the remaining folds train a fresh estimator.",
      "Do not generalize this tiny fixture beyond its sampling and information boundary. All model choices guided by cross-validation are development decisions."
    ],
    "takeaways": [
      "In K-fold cross-validation, each fold holds out a subset while the remaining folds train a fresh estimator.",
      "All model choices guided by cross-validation are development decisions."
    ],
    "practice": [
      "What is fitted in each CV fold?|A fresh estimator|One test-fitted model|Only a report table|The final labels|Each fold fits on its own training subset.",
      "Which splitter preserves classification proportions approximately?|StratifiedKFold|TimeSeriesSplit always|GroupKFold always|FeatureUnion|Stratification distributes classes across folds.",
      "Where should learned preprocessing fit during CV?|Inside training fold|On all rows first|On validation only|On future labels|Each fitted statistic must exclude that fold’s held-out observations.",
      "A patient appears in train and validation folds. What should be used?|Group-aware folds|More random folds|Target sorting|More scaler steps|Patient-level dependence requires keeping the entity together.",
      "A forecasting model uses shuffled K-fold CV. What is mismatched?|Temporal information|Only feature dtype|Only output shape|Only package import|Random folds can train on future observations relative to validation.",
      "A search score is reported as an untouched final estimate. What concern applies?|Selection optimism|Only row count|Only target vocabulary|Only score sign|The same scores guided the selection and can be optimistic for the winner."
    ],
    "formal": [
      "What does nested CV separate?|Tuning and evaluation|Features and labels always|Units and counts|Classes and rows|An inner loop selects settings while an outer loop evaluates the selection procedure.",
      "Why are ordinary fold scores not necessarily independent?|Training sets overlap|Targets are all strings|Features have names|Models return arrays|Overlapping fitting data creates dependence among fold results.",
      "A negative MAE score is -2 versus -5. Which is better under scorer convention?|-2|-5|They are identical|Neither is numeric|Negated loss is higher-is-better, corresponding here to smaller absolute error.",
      "A fold lacks a required class. What must be checked?|Fold feasibility|Only model filename|Only result sorting|Only feature scaling|Class support must satisfy estimator and metric requirements.",
      "A custom feature selector sees all outcomes before CV. What is contaminated?|All fold evaluations|Only estimator repr|Only array strides|Only metric naming|Outcome-based selection must be fitted independently within each training fold.",
      "A model wins one fold and loses the others. What should be reported?|All fold scores|Only winning fold|Only training score|Only fastest fit|A selective fold report hides instability and poor generalization.",
      "A grouped CV uses five sites with very different sizes. What should accompany scores?|Site sizes and spread|Only global row count|Only number of CPUs|Only class names|Fold and group support help interpret heterogeneous evidence.",
      "A team tunes on outer fold outcomes after nested CV. What happened?|Outer boundary consumed|More independent testing|Automatic unbiasedness|Only code formatting|Outer outcomes became development information once used to revise choices.",
      "A final model is refitted on development data after valid tuning. What remains necessary for reporting?|Independent test|Reusing training score|Only fit success|Only feature count|The refit itself does not create an independent generalization estimate.",
      "A hospital dataset requires both new-site and future-time generalization. Which design is adequate?|Custom joint boundary|Any shuffled K-fold|Only class stratification|Only more repetitions|The evaluation must enforce both deployment dimensions rather than choose a convenient splitter."
    ]
  },
  {
    "slug": "hyperparameter-search",
    "title": "Search model settings without consuming the final test",
    "intro": "A synthetic support team tunes regularization and tree depth using a fixed development protocol. GridSearchCV evaluates each candidate parameter combination within cross-validation and can refit the selected procedure on the development data.",
    "sections": [
      [
        "Build the decision rule",
        "A parameter grid enumerates discrete combinations; randomized search samples from specified candidate distributions or lists. Each candidate must include all learned preprocessing inside its Pipeline. Scoring determines the objective being optimized, and a search with several metrics needs an explicit refit rule. best_score_ summarizes inner selection performance rather than an untouched external test score."
      ],
      [
        "Check the engineering boundary",
        "Search budgets are part of the experiment design. A larger search can exploit validation noise as well as find useful settings, especially on small data. Record the candidate space, splitter, metric and selection rule. Keep final test data outside every choice, including stopping, feature engineering and threshold selection. The fixture uses a small deterministic depth grid to demonstrate candidate accounting and refitting, not search superiority."
      ]
    ],
    "problem": "Search model settings without consuming the final test on a small synthetic fixture.",
    "steps": [
      "State the input and decision-time assumptions.",
      "Run the shown calculation and compare the printed result.",
      "Explain which conclusion the fixture supports and which assumptions require another check."
    ],
    "code": "from sklearn.model_selection import GridSearchCV\nfrom sklearn.tree import DecisionTreeClassifier\nx=[[i] for i in range(12)]; y=[0,1]*6\ns=GridSearchCV(DecisionTreeClassifier(random_state=0),{\"max_depth\":[1,2]},cv=3).fit(x,y)\nprint(len(s.cv_results_[\"params\"]))\nprint(s.refit)",
    "expect": "2\nTrue",
    "limit": "This synthetic in-memory example verifies the displayed operation under scikit-learn 1.8.0. It does not establish production accuracy, causal impact, representative sampling or acceptable error costs. Search budgets are part of the experiment design.",
    "mistakes": [
      "Do not substitute a convenient representation for the stated decision rule. A parameter grid enumerates discrete combinations; randomized search samples from specified candidate distributions or lists.",
      "Do not generalize this tiny fixture beyond its sampling and information boundary. Search budgets are part of the experiment design."
    ],
    "takeaways": [
      "A parameter grid enumerates discrete combinations; randomized search samples from specified candidate distributions or lists.",
      "Search budgets are part of the experiment design."
    ],
    "practice": [
      "What does a parameter grid specify?|Candidate combinations|Final test outcomes|Feature units|Only fitted coefficients|Grid search evaluates combinations from the declared parameter choices.",
      "What is best_score_ in a CV search?|Selection CV score|Untouched test score|Training label mean|A causal effect|It summarizes the best candidate’s cross-validation selection performance.",
      "What does refit=True normally do after selection?|Fit best on development data|Fit on final test labels|Delete preprocessing|Guarantee deployment approval|The selected estimator is fitted using the supplied development dataset.",
      "A pipeline grid tunes model depth. How should the parameter be named?|model__max_depth|max_depth.model|depth/model|target__depth|Nested parameter paths address the named pipeline step.",
      "A team expands the grid after seeing test failures. What boundary is lost?|Final-test independence|Only feature width|Only estimator import|Only solver state|Test-guided search revisions consume the test as development evidence.",
      "Two metrics are scored but refit choice is unspecified. What must be clarified?|Selection objective|Only column order|Only model nickname|Only result precision|The search needs a defined rule for choosing the final candidate."
    ],
    "formal": [
      "What does randomized search vary?|Sampled candidate settings|Observed target labels|Feature units randomly|Final test membership always|It samples candidates from the declared search space.",
      "Which data should select hyperparameters?|Development folds|Final test labels|Production future labels|All held-out outcomes|Selection is a development activity.",
      "A huge grid is tried on a tiny validation set. What risk increases?|Winner’s optimism|Guaranteed calibration|Perfect independence|Label completeness|Repeated selection can exploit validation noise.",
      "A search fits a global imputer before CV. What should be repaired?|Fold-local pipeline|Only grid size|Only report title|Only scorer sign|Learned preprocessing must be trained within each candidate fold.",
      "A candidate fails on one fold. What should the report preserve?|Failure evidence|Only successful scores|Only best runtime|Only candidate name|Failed fits can reveal invalid settings or insufficient data and should not be hidden.",
      "A grid compares models under different feature availability policies. What is unfair?|Information mismatch|Only fit durations|Only parameter count|Only class names|Candidates should receive a comparable legitimate information set unless the policy difference is the experiment.",
      "A scorer negates an error metric. Which candidate should search prefer?|Higher scorer value|Larger raw error|Most negative score|Most training rows|scikit-learn selection uses the scorer’s higher-is-better convention.",
      "A constrained model is slightly less accurate but meets a hard latency limit. What selection rule helps?|Constraint-aware choice|Only best accuracy|Only largest grid|Only deepest tree|The final selection rule should account for actual non-negotiable operating constraints.",
      "A reviewer cannot reproduce search results. Which missing record matters most?|Space splitter and metric|Only plot dimensions|Only file extension|Only final model label|The candidate space and evaluation protocol define the search procedure.",
      "A team wants an honest estimate of a search with feature selection and threshold tuning. What must outer evaluation include?|Entire selection procedure|Only final estimator fit|Only best inner score|Only one chosen threshold|All development choices belong inside the procedure being evaluated by the untouched outer boundary."
    ]
  },
  {
    "slug": "operating-constraints",
    "title": "Select a model under accuracy, explanation and latency needs",
    "intro": "A synthetic claims workflow compares a shallow tree, a regularized linear model and a boosted ensemble. The model must make a decision within a strict latency limit and support reviewable explanations, so the highest unconstrained validation score is only one part of the choice.",
    "sections": [
      [
        "Build the decision rule",
        "Define hard constraints before comparing candidates. Measure end-to-end latency including preprocessing and data access on representative hardware and batch sizes, and report tail latency rather than a single favorable run. Interpretability can mean a globally compact rule, stable coefficients under known units, or a faithful local explanation; these are different properties and should be matched to reviewer needs."
      ],
      [
        "Check the engineering boundary",
        "Evaluate accuracy and error costs with the same valid split and include stability across operational groups. A readable model can still use leaked fields, and an explanation can still be unstable or misleading. Preserve the selected procedure and document the tradeoff. The synthetic example filters a small candidate table using an explicitly hypothetical latency and score policy; it demonstrates selection logic rather than benchmarking any library implementation."
      ]
    ],
    "problem": "Select a model under accuracy, explanation and latency needs on a small synthetic fixture.",
    "steps": [
      "State the input and decision-time assumptions.",
      "Run the shown calculation and compare the printed result.",
      "Explain which conclusion the fixture supports and which assumptions require another check."
    ],
    "code": "candidates=[(\"linear\",.81,4),(\"tree\",.80,2),(\"boost\",.84,15)]\nfeasible=[x for x in candidates if x[2]<=5]\nchosen=max(feasible,key=lambda x:x[1])\nprint(chosen[0])\nprint(len(feasible))",
    "expect": "linear\n2",
    "limit": "This synthetic in-memory example verifies the displayed operation under scikit-learn 1.8.0. It does not establish production accuracy, causal impact, representative sampling or acceptable error costs. Evaluate accuracy and error costs with the same valid split and include stability across operational groups.",
    "mistakes": [
      "Do not substitute a convenient representation for the stated decision rule. Define hard constraints before comparing candidates.",
      "Do not generalize this tiny fixture beyond its sampling and information boundary. Evaluate accuracy and error costs with the same valid split and include stability across operational groups."
    ],
    "takeaways": [
      "Define hard constraints before comparing candidates.",
      "Evaluate accuracy and error costs with the same valid split and include stability across operational groups."
    ],
    "practice": [
      "What should define a hard latency constraint?|Service deadline|Highest training score|Longest model name|Most parameters|The constraint comes from the actual serving workflow.",
      "What belongs in end-to-end latency?|Full serving pipeline|Only model import|Only score calculation|Only serialization size|User-facing runtime includes all required inference stages.",
      "Does an interpretable model guarantee valid features?|No|Always|Only if shallow|Only if linear|Readability does not validate decision-time availability.",
      "A model wins accuracy but exceeds a hard response deadline. What should selection do?|Reject infeasible model|Ignore the deadline|Report training speed only|Hide tail latency|A hard operating constraint must be enforced in candidate selection.",
      "A benchmark uses one warm request on different hardware. What is missing?|Realistic benchmarks|Only target count|Only label names|Only feature width|Latency claims need relevant hardware, batch patterns and repeated measurements.",
      "A reviewer needs global rules but receives unstable local explanations. What is mismatched?|Explanation requirement|Only model version|Only training score|Only data type|Different explanation formats answer different review needs."
    ],
    "formal": [
      "What is tail latency?|Slow request tail|Average coefficient|Last training label|Smallest feature value|Tail measures describe slow requests beyond the average.",
      "Which model comparison should share an evaluation boundary?|Every candidate|Only the winner|Only the baseline|Only deep models|Matched legitimate evaluation supports meaningful comparisons.",
      "A shallow tree uses final payment to predict claim escalation at intake. What invalidates it?|Unavailable feature|Only tree depth|Only rule readability|Only few leaves|Interpretability cannot make a post-outcome feature available earlier.",
      "A coefficient explanation changes under correlated feature substitution. What needs review?|Explanation stability|Only estimator spelling|Only output length|Only target dtype|Predictive explanations can depend on feature representation and correlation.",
      "A candidate has tiny mean gain but large facility failures. What should be considered?|Segment reliability|Only pooled score|Only training loss|Only model size|Operationally important subgroup errors can outweigh a small average gain.",
      "A latency test omits text preprocessing. What is underestimated?|Full inference cost|Only train cost|Only label count|Only target horizon|Feature extraction can dominate the complete serving path.",
      "A team chooses a candidate after changing constraints to favor it. What should be documented?|Selection-policy revision|Only best score|Only final label|Only feature mean|Post-hoc changes affect the interpretation and reproducibility of selection.",
      "A model passes accuracy and latency but fails schema robustness. What remains blocked?|Reliable serving|Only training fit|Only score display|Only parameter search|Inference must handle or reject invalid inputs according to the operational contract.",
      "A simple model performs comparably within uncertainty and is cheaper to maintain. What can support choosing it?|Adequate utility and cost|Only smallest filename|Only fewest rows|Only highest train score|Practical model selection can prefer a sufficiently effective lower-burden procedure.",
      "A deployment policy changes action thresholds by site to meet capacity limits. What must be evaluated?|Site-level decisions|Only pooled ROC-AUC|Only default threshold|Only model training score|The deployed decision policy includes site-specific thresholds and constraints, so evaluation must measure that full behavior."
    ]
  }
],["linear_model.rst", "tree.rst", "ensemble.rst", "cross_validation.rst", "grid_search.rst"]);
