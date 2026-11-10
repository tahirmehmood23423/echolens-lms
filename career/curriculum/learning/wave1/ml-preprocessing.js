'use strict';
const {course}=require('./ml-wave3-helper');
module.exports=course("ml-preprocessing",[
  {
    "slug": "numeric-scale",
    "title": "Fit scaling statistics on the training population",
    "intro": "A synthetic delivery service predicts journey duration from kilometers and package count. A distance of 100 and a count of two use different scales; nearest-neighbor distances would be dominated by the larger numerical range without a deliberate policy.",
    "sections": [
      [
        "Build the decision rule",
        "StandardScaler estimates each training column\u2019s mean and population variance, then subtracts that mean and divides by the training standard deviation. The result is centered and unit-scaled on the fitting data when variance is nonzero. Scaling changes geometry for distance-based methods and regularized linear models. It does not repair a mislabeled unit, remove outliers, or make the distribution normal. A constant training column is left with a scaling factor of one rather than division by zero."
      ],
      [
        "Check the engineering boundary",
        "Fit on training rows and reuse transform on validation and test rows. A test value outside the training range may legitimately produce a large standardized value. Inspect outliers before choosing StandardScaler versus a robust alternative based on medians and quantile ranges. Trees based on axis thresholds generally do not need scaling for the same reason that distance models do; choose transformations for the estimator and data contract."
      ]
    ],
    "problem": "Fit scaling statistics on the training population on a small synthetic fixture.",
    "steps": [
      "State the input and decision-time assumptions.",
      "Run the shown calculation and compare the printed result.",
      "Explain which conclusion the fixture supports and which assumptions require another check."
    ],
    "code": "from sklearn.preprocessing import StandardScaler\ns=StandardScaler().fit([[0.],[2.]])\nprint(s.mean_.tolist())\nprint(s.transform([[4.]]).tolist())",
    "expect": "[1.0]\n[[3.0]]",
    "limit": "This synthetic in-memory example verifies the displayed operation under scikit-learn 1.8.0. It does not establish production accuracy, causal impact, representative sampling or acceptable error costs. Fit on training rows and reuse transform on validation and test rows.",
    "mistakes": [
      "Do not substitute a convenient representation for the stated decision rule. StandardScaler estimates each training column\u2019s mean and population variance, then subtracts that mean and divides by the training standard deviation.",
      "Do not generalize this tiny fixture beyond its sampling and information boundary. Fit on training rows and reuse transform on validation and test rows."
    ],
    "takeaways": [
      "StandardScaler estimates each training column\u2019s mean and population variance, then subtracts that mean and divides by the training standard deviation.",
      "Fit on training rows and reuse transform on validation and test rows."
    ],
    "practice": [
      "What does StandardScaler learn during fit?|Means and variances|Future labels|Row identities|Category order|Its centering and scale parameters summarize fitting rows.",
      "Which operation reuses fitted scaling without relearning it?|transform|fit_transform|fit again|partial_fit always|transform applies the stored parameters to new inputs.",
      "Does unit variance imply a normal distribution?|No|Always|Only for integers|Only after predict|Affine scaling changes units but not distribution shape.",
      "A distance model uses kilograms and grams as separate raw columns. What needs review?|Units and scaling|Target renaming|Tree count only|Row display order|Unit choices can dominate geometric distances without adding information.",
      "A training column never changes. What scaling issue must be handled?|Zero variance|Target imbalance|Class ordering|Missing timestamps|StandardScaler avoids division by zero using a unit scale for constant features.",
      "A validation value becomes six standard deviations above training mean. What follows?|Inspect distribution shift|Refit on validation|Clamp all values to zero|Declare labels wrong|Stored training statistics allow out-of-range validation values; inspect the cause."
    ],
    "formal": [
      "What does centering subtract from a feature?|Training mean|Test mean|Largest label|Row number|Centering uses the fitted training column mean.",
      "Which estimator family directly depends on feature distance?|Nearest neighbors|Decision stumps only|Majority baseline|Constant regressor|Neighbor selection depends on numeric distance between observations.",
      "A sensor feature is heavily contaminated by extreme spikes. Which scaler deserves comparison?|RobustScaler|LabelEncoder for values|OneHotEncoder for rows|No feature inspection|RobustScaler uses robust location and scale statistics, though contamination still needs investigation.",
      "A courier model fits its scaler before splitting. Why revise it?|Holdout statistics leaked|Labels became strings|Distances disappeared|Rows became ordered|Held-out observations influenced fitted feature statistics.",
      "A team standardizes each incoming record independently. Why can this fail?|Training geometry changes|More classes appear|Labels become balanced|Trees need no splits|Features must use the same learned coordinate system rather than record-specific statistics.",
      "A standardized sparse matrix is too large to densify. Which setting avoids explicit centering?|with_mean=False|with_mean=True|copy=False alone|predict_proba=True|Centering sparse inputs would create dense nonzero entries; disabling it preserves sparsity.",
      "A report states scaling removed outlier influence completely. What correction is needed?|Outliers still matter|All values are bounded|Variance is always zero|Medians became targets|Mean and variance are themselves sensitive to outliers.",
      "A deployed model receives centimeters after training on meters. What is required?|Restore unit contract|Refit labels only|Trust scale invariance|Change random seed|Training transformations assume the same feature units and meanings at inference.",
      "A team compares scaled KNN and unscaled KNN using different splits. What confounds the result?|Different splits|Feature count alone|Integer targets|Estimator names|A matched evaluation split isolates the effect of preprocessing more fairly.",
      "A seasonal service refits a scaler on each test month before reporting accuracy. What boundary is violated?|Frozen test protocol|Category ordering rule|Array indexing rule|Optimizer stopping rule|Evaluation must simulate the information available when fitting and serving, including transformation statistics."
    ],
    "comps": [
      "m1.c1"
    ]
  },
  {
    "slug": "categorical-contract",
    "title": "Encode categories while preserving their meaning",
    "intro": "A synthetic depot table records region labels and package size bands. Region names have no natural rank; small, medium and large do. Encoding both as arbitrary integers would impose the same geometric interpretation on two different concepts.",
    "sections": [
      [
        "Build the decision rule",
        "OneHotEncoder creates indicator columns for category membership. With handle_unknown=\"ignore\", an unseen category yields zeros for that feature\u2019s known-category indicators; that behavior needs monitoring because unknown and a dropped baseline can be indistinguishable. Fit the category vocabulary on training rows. OrdinalEncoder is suitable when the ordered numerical interpretation is justified, and category order should be specified explicitly rather than inferred from alphabetical labels."
      ],
      [
        "Check the engineering boundary",
        "High cardinality creates many indicators and potentially sparse evidence per category. Grouping rare categories can reduce width but learns a frequency rule that belongs inside the training boundary. LabelEncoder is designed for target labels, not a general multi-column feature transformer. Missingness and unknown categories are different states: decide whether they should be represented separately and ensure training and serving agree."
      ]
    ],
    "problem": "Encode categories while preserving their meaning on a small synthetic fixture.",
    "steps": [
      "State the input and decision-time assumptions.",
      "Run the shown calculation and compare the printed result.",
      "Explain which conclusion the fixture supports and which assumptions require another check."
    ],
    "code": "from sklearn.preprocessing import OneHotEncoder\ne=OneHotEncoder(handle_unknown=\"ignore\",sparse_output=False).fit([[\"east\"],[\"west\"]])\nprint(e.transform([[\"north\"]]).tolist())\nprint(e.transform([[\"west\"]]).tolist())",
    "expect": "[[0.0, 0.0]]\n[[0.0, 1.0]]",
    "limit": "This synthetic in-memory example verifies the displayed operation under scikit-learn 1.8.0. It does not establish production accuracy, causal impact, representative sampling or acceptable error costs. High cardinality creates many indicators and potentially sparse evidence per category.",
    "mistakes": [
      "Do not substitute a convenient representation for the stated decision rule. OneHotEncoder creates indicator columns for category membership.",
      "Do not generalize this tiny fixture beyond its sampling and information boundary. High cardinality creates many indicators and potentially sparse evidence per category."
    ],
    "takeaways": [
      "OneHotEncoder creates indicator columns for category membership.",
      "High cardinality creates many indicators and potentially sparse evidence per category."
    ],
    "practice": [
      "Which encoding avoids imposing rank on nominal regions?|One-hot indicators|Arbitrary integer rank|Target values as codes|Row position codes|Separate indicators do not define a numerical ordering between region names.",
      "What does an ordinal encoding require to preserve size-band meaning?|A declared order|Alphabetical luck|Test labels|Random numbering|The encoded order must match the intended ordered feature semantics.",
      "What is LabelEncoder primarily intended to encode?|Target labels|Every feature matrix|Numeric units|Missing timestamps|LabelEncoder represents output class labels rather than general feature tables.",
      "A new depot region is unseen during fit with ignore enabled. What is produced?|Known indicators zero|An extra fitted column|A positive target label|A refitted vocabulary|Ignoring unknown categories maps them to zero across the known indicator columns.",
      "A field has a million unique account ids. What should be questioned?|Useful transferable signal|Only alphabetical order|Only integer width|Only display precision|Unique identities can yield huge sparse feature spaces and poor generalization.",
      "A missing category and an unseen category share a code. What must be reviewed?|State distinguishability|Training row sorting|Metric sign only|Optimizer tolerance|The representation may hide two different operational causes."
    ],
    "formal": [
      "What does one-hot encoding create?|Category indicators|Class probabilities|Sorted outcomes|Centered targets|Each learned category is represented by an indicator column.",
      "When should feature category vocabulary be fitted?|During training|Across test labels|After final scoring|Per served row|The vocabulary is a learned preprocessing parameter.",
      "A product size is coded large=0, medium=1, small=2 accidentally. What is wrong?|Intended order reversed|All codes need floats|All features need text|Targets must be sorted|A declared ordinal meaning should match its encoded direction and spacing assumptions.",
      "A store drops one one-hot category and ignores unknowns. Which collision can occur?|Baseline and unknown|Train and test ids|Mean and variance|Loss and gradient|Both the dropped category and an unknown can appear as all-zero indicators.",
      "A tree receives arbitrary integer region codes. Why inspect the choice?|Splits inherit code order|Regions become labels|Training cannot run|Every split is unbiased|Threshold splits on integer codes group categories according to the imposed order.",
      "A service changes category column order after training. What should protect inference?|Schema validation|A new random seed|More tree estimators|Shorter feature names|Feature names and ordering must remain compatible with the fitted transformation.",
      "A rare-category grouping rule is estimated using all rows. What information crossed the boundary?|Holdout frequencies|Only training labels|Only row indexes|Only library versions|Category frequency is learned from data and must exclude held-out observations.",
      "A model needs an explicit unknown bucket. What is the best next action?|Define and test mapping|Assume ignore adds one|Sort all categories|Change labels to floats|An all-zero unknown pattern is not automatically a distinct named bucket.",
      "A team uses target mean encoding. What additional safeguard matters?|Out-of-fold training codes|Global test-label means|Alphabetical category rank|Per-row scaler fitting|Encoding a row using its own outcome leaks target information; cross-fitting helps protect training representations.",
      "A high-cardinality encoder passes validation but rare groups fail after launch. What evidence is needed?|Support and unknown rates|Only aggregate accuracy|Only fit duration|Only category spelling|Frequency support and unseen-category behavior help distinguish sparse evidence and distribution changes."
    ],
    "comps": [
      "m1.c1"
    ]
  },
  {
    "slug": "mixed-columns",
    "title": "Build a column-aware preprocessing contract",
    "intro": "A synthetic insurance quote table combines numeric mileage and categorical vehicle type. Numeric scaling should touch mileage; one-hot encoding should touch the type. A single transformation applied blindly to every column can destroy meaning or fail at runtime.",
    "sections": [
      [
        "Build the decision rule",
        "ColumnTransformer applies named transformers to selected columns and concatenates their outputs. It records column selections and fitted component estimators so the same transformation can be applied later. Explicit column names make intent visible, while remainder=\"drop\" excludes unspecified columns. Remainder=\"passthrough\" is useful only after checking that identifiers, targets and post-outcome fields cannot enter accidentally."
      ],
      [
        "Check the engineering boundary",
        "A numeric branch can combine SimpleImputer and StandardScaler in a Pipeline. A categorical branch can encode known categories and define unknown handling. Branch ordering and get_feature_names_out help interpret the resulting matrix. Test inference-time schema separately: a valid matrix shape is insufficient if column semantics changed. The tiny fixture uses complete values to focus on branch routing; missing-value policies require domain justification."
      ]
    ],
    "problem": "Build a column-aware preprocessing contract on a small synthetic fixture.",
    "steps": [
      "State the input and decision-time assumptions.",
      "Run the shown calculation and compare the printed result.",
      "Explain which conclusion the fixture supports and which assumptions require another check."
    ],
    "code": "import pandas as pd\nfrom sklearn.compose import ColumnTransformer\nfrom sklearn.preprocessing import StandardScaler,OneHotEncoder\nx=pd.DataFrame({\"km\":[0.,2.],\"zone\":[\"east\",\"west\"]})\nt=ColumnTransformer([(\"n\",StandardScaler(),[\"km\"]),(\"c\",OneHotEncoder(sparse_output=False),[\"zone\"])]).fit(x)\nprint(t.transform(x).shape)\nprint(t.get_feature_names_out().tolist())",
    "expect": "(2, 3)\n['n__km', 'c__zone_east', 'c__zone_west']",
    "limit": "This synthetic in-memory example verifies the displayed operation under scikit-learn 1.8.0. It does not establish production accuracy, causal impact, representative sampling or acceptable error costs. A numeric branch can combine SimpleImputer and StandardScaler in a Pipeline.",
    "mistakes": [
      "Do not substitute a convenient representation for the stated decision rule. ColumnTransformer applies named transformers to selected columns and concatenates their outputs.",
      "Do not generalize this tiny fixture beyond its sampling and information boundary. A numeric branch can combine SimpleImputer and StandardScaler in a Pipeline."
    ],
    "takeaways": [
      "ColumnTransformer applies named transformers to selected columns and concatenates their outputs.",
      "A numeric branch can combine SimpleImputer and StandardScaler in a Pipeline."
    ],
    "practice": [
      "Which tool routes different transformations to selected feature columns?|ColumnTransformer|LabelEncoder alone|accuracy_score|train_test_split alone|ColumnTransformer combines column-specific preprocessing branches.",
      "What does remainder=\"drop\" do?|Drops unspecified columns|Drops all training rows|Adds target columns|Drops fitted statistics|Unselected feature columns are excluded from the output.",
      "Why inspect output feature names?|Trace transformed columns|Infer test accuracy|Recover missing labels|Guarantee causal effects|Feature names connect output coordinates to their source and transformation.",
      "A numeric scaler is applied to vehicle-type strings. What should change?|Route by feature type|Randomize string order|Rename the target|Increase test size|Different semantic types require compatible transformations.",
      "A passthrough branch includes settlement amount for predicting claim risk. What is wrong?|Post-outcome leakage|Too few indicators|Too many splits|Wrong random seed|A value learned after the outcome is unavailable at prediction time.",
      "A new table swaps the meaning of two equal-shaped columns. What check helps?|Schema and units|Shape alone|Runtime alone|Package import alone|Equal dimensions do not guarantee preserved feature semantics."
    ],
    "formal": [
      "What does a preprocessing Pipeline preserve?|Operation order|Future class balance|Perfect imputation|Causal identification|Each stage consumes the transformed output of the preceding stage.",
      "Which transformer commonly fills missing numeric cells?|SimpleImputer|OneHotEncoder alone|StratifiedKFold|DummyClassifier|SimpleImputer applies a fitted missing-value replacement policy.",
      "A mileage column uses the training median as replacement. Where must that median be learned?|Training fit|Full evaluation table|Final test labels|Per inference batch|Imputation statistics are fitted preprocessing parameters.",
      "A missing income is replaced with zero without review. What may change?|Feature meaning|Only row numbering|Only feature names|Only output type|Unknown income and observed zero income represent different states.",
      "A table adds an unreviewed id column while remainder passes through. What new risk appears?|Identity memorization|Automatic calibration|Better uncertainty|Guaranteed fairness|Passthrough can silently expose identifiers that do not transfer to new entities.",
      "A sparse categorical branch is concatenated with numeric columns. What should memory review consider?|Combined output format|Target spelling|Alphabetical loss names|Printed row count only|Combined sparsity and transformer settings determine whether the output is sparse or dense.",
      "A branch selector is based on column position. What production change threatens it?|Reordered input fields|Different class priors|New optimizer seed|A larger test set|Positional selectors can route the wrong feature after a schema reorder.",
      "A pipeline expects a feature that is missing at serving. What is appropriate?|Fail schema validation|Silently substitute target|Reorder predictions|Trust array width alone|A required input contract should fail clearly rather than invent feature meaning.",
      "A feature attribution references coordinate 12 after encoding. What is needed for interpretation?|Fitted feature-name map|Raw column count only|Training accuracy only|A new train split|Encoding expands columns, so transformed coordinates need the fitted output-name mapping.",
      "A team serializes only its classifier and rebuilds preprocessing ad hoc. What is the strongest concern?|Training-serving mismatch|Too few target labels|Too many metric names|Fixed random seeds|Model inputs depend on the exact fitted transformation and category schema, which should travel with the estimator."
    ],
    "comps": [
      "m1.c1"
    ]
  },
  {
    "slug": "holdout-purpose",
    "title": "Separate training, selection and final evaluation",
    "intro": "A synthetic appointment model will be selected from several configurations. Training rows estimate parameters, validation rows guide choices, and a final untouched test estimates performance of the completed selection procedure. Reusing one holdout for every decision makes it part of development.",
    "sections": [
      [
        "Build the decision rule",
        "Random train_test_split is appropriate only when row exchangeability reasonably matches deployment. Set random_state for reproducible partitions and stratify classification labels when maintaining observed class proportions is appropriate. A split ratio does not guarantee independence, representativeness or sufficient subgroup evidence. Keep targets aligned with their feature rows, preferably by partitioning them in the same split call."
      ],
      [
        "Check the engineering boundary",
        "Freeze the test boundary before feature selection, threshold tuning and model comparison. A development result is conditional on all choices tried, even choices made manually after inspecting errors. Small or rare classes need enough examples for the chosen evaluation design; stratification cannot manufacture additional evidence. Report sample counts alongside proportions and distinguish internal validation from independent external validation."
      ]
    ],
    "problem": "Separate training, selection and final evaluation on a small synthetic fixture.",
    "steps": [
      "State the input and decision-time assumptions.",
      "Run the shown calculation and compare the printed result.",
      "Explain which conclusion the fixture supports and which assumptions require another check."
    ],
    "code": "from sklearn.model_selection import train_test_split\nx=list(range(10)); y=[0,1]*5\nxt,xv,yt,yv=train_test_split(x,y,test_size=.4,stratify=y,random_state=4)\nprint(len(xt),len(xv))\nprint(sum(yt),sum(yv))",
    "expect": "6 4\n3 2",
    "limit": "This synthetic in-memory example verifies the displayed operation under scikit-learn 1.8.0. It does not establish production accuracy, causal impact, representative sampling or acceptable error costs. Freeze the test boundary before feature selection, threshold tuning and model comparison.",
    "mistakes": [
      "Do not substitute a convenient representation for the stated decision rule. Random train_test_split is appropriate only when row exchangeability reasonably matches deployment.",
      "Do not generalize this tiny fixture beyond its sampling and information boundary. Freeze the test boundary before feature selection, threshold tuning and model comparison."
    ],
    "takeaways": [
      "Random train_test_split is appropriate only when row exchangeability reasonably matches deployment.",
      "Freeze the test boundary before feature selection, threshold tuning and model comparison."
    ],
    "practice": [
      "Which partition estimates model parameters?|Training|Final test|External audit only|Unlabeled dashboard|Fitting uses the training subset.",
      "Which partition should remain untouched until the procedure is fixed?|Final test|Training|Tuning fold|Feature sandbox|A final holdout estimates the completed selection procedure.",
      "What does random_state control in a randomized split?|Reproducibility|Causal validity|Label accuracy|Future drift|A seed can reproduce the random partition but cannot validate its design.",
      "A team chooses its model after every test-score update. What happened?|Test became development|Training became private|Class balance vanished|Sampling became causal|Repeated test-guided choices adapt the model selection procedure to that holdout.",
      "A minority class has three records. What does stratification fail to solve?|Little independent data|Randomness entirely|All label ordering|All duplicate rows|Preserving proportions does not create more independent minority observations.",
      "Features and targets are shuffled separately. What can break?|Row alignment|Metric definition|Package version|Feature dtype|Each outcome must remain paired with its correct observation."
    ],
    "formal": [
      "What does stratify=y try to preserve?|Class proportions|Individual identities|Time ordering|All feature means|Stratification distributes label classes across randomized partitions.",
      "What does a split percentage alone establish?|Partition sizes|Independent entities|No target leakage|Production coverage|A ratio specifies sizes rather than statistical validity.",
      "A classifier is tuned on validation recall. Which data remains for final reporting?|Untouched test|Same validation scores|Training residuals|All seen labels|Selection uses validation information, so final assessment needs a separate boundary.",
      "A test has many rows but one facility. Which uncertainty remains?|Facility generalization|Array reshaping|Estimator import|Target dtype|Large row count does not establish performance on unseen facilities.",
      "A developer removes hard test examples after inspecting predictions. What is biased?|Evaluation population|Only training duration|Only random seed|Only column width|Outcome-guided exclusion changes the test population toward easier cases.",
      "A fixed split is reused across model comparisons. What does this improve?|Comparison consistency|Guaranteed deployment fit|Perfect confidence bounds|Immunity to overfitting|Shared partitions reduce split-related noise in comparisons but remain subject to selection effects.",
      "A dataset has mislabeled positives. Can a seeded split repair them?|No|Yes by stratifying|Yes with test_size=.2|Yes by sorting ids|Partitioning does not correct label quality.",
      "A test estimate reports only accuracy without row counts. What is missing?|Evidence support|Optimizer gradient|Training category names|Coefficient signs|Sample size and class support affect how much confidence the estimate deserves.",
      "A team selects features before any split using target correlation. What is contaminated?|Evaluation boundary|Only feature order|Only model syntax|Only memory estimate|Holdout outcomes influenced the feature set before fitting.",
      "A launch population differs materially from the random holdout. Which claim needs revision?|Deployment generalization|Split reproducibility|Stored row counts|Estimator API identity|Internal random validation estimates the sampled population, not automatically a new operational population."
    ],
    "comps": [
      "m2.c1"
    ]
  },
  {
    "slug": "temporal-splits",
    "title": "Validate future decisions using chronological splits",
    "intro": "A synthetic demand service trains on past weeks to predict the next week. Random shuffling allows future seasonal patterns into training and overstates the information available when the service would have made its earlier predictions.",
    "sections": [
      [
        "Build the decision rule",
        "TimeSeriesSplit creates successive training prefixes followed by later validation intervals. Training sets grow across folds; the test intervals are later in the supplied order. Sort by the relevant decision timestamp first because the splitter operates on positions rather than interpreting date semantics. A gap can exclude observations immediately before validation, helping when nearby labels or feature windows overlap."
      ],
      [
        "Check the engineering boundary",
        "Label delay requires more than sorting. If a target becomes known two weeks later, a training cutoff must exclude records whose labels were still unavailable then. Feature aggregates must also stop at the prediction timestamp. Equally spaced observations make fold durations comparable under the default splitter; irregular event streams may need custom calendar windows and explicit reporting of exposure."
      ]
    ],
    "problem": "Validate future decisions using chronological splits on a small synthetic fixture.",
    "steps": [
      "State the input and decision-time assumptions.",
      "Run the shown calculation and compare the printed result.",
      "Explain which conclusion the fixture supports and which assumptions require another check."
    ],
    "code": "from sklearn.model_selection import TimeSeriesSplit\nfor tr,va in TimeSeriesSplit(n_splits=2,test_size=2,gap=1).split(range(8)):\n print(tr.tolist(),va.tolist())",
    "expect": "[0, 1, 2] [4, 5]\n[0, 1, 2, 3, 4] [6, 7]",
    "limit": "This synthetic in-memory example verifies the displayed operation under scikit-learn 1.8.0. It does not establish production accuracy, causal impact, representative sampling or acceptable error costs. Label delay requires more than sorting.",
    "mistakes": [
      "Do not substitute a convenient representation for the stated decision rule. TimeSeriesSplit creates successive training prefixes followed by later validation intervals.",
      "Do not generalize this tiny fixture beyond its sampling and information boundary. Label delay requires more than sorting."
    ],
    "takeaways": [
      "TimeSeriesSplit creates successive training prefixes followed by later validation intervals.",
      "Label delay requires more than sorting."
    ],
    "practice": [
      "What should precede a position-based temporal split?|Timestamp sorting|Random row shuffling|Target sorting|Feature scaling on all rows|TimeSeriesSplit assumes supplied row order reflects the intended chronology.",
      "What does a temporal gap exclude?|Boundary-adjacent rows|All minority classes|Only missing labels|All training targets|A gap separates the end of training from the start of validation.",
      "Why do temporal training sets often grow?|Expanding history|Automatic class balance|Dropping all old rows|Feature count growth|Each fold can use a larger prefix of historical observations.",
      "A target arrives 14 days after an event. What must a training cutoff enforce?|Mature labels|Only event timestamp|Only target type|Only class proportion|A historical simulation cannot train on outcomes that were not yet known.",
      "A rolling feature uses next-day sales. What is wrong for same-day prediction?|Future information|Sparse output|Label encoding|Feature centering|A future-derived feature is unavailable at the intended decision time.",
      "Irregular event counts make equal-sized test folds span different durations. What needs review?|Calendar comparability|Class-name spelling|Matrix memory order|Random seed width|Equal row counts need not represent comparable time exposure."
    ],
    "formal": [
      "Which direction should validation lie relative to training for forecasting?|Later in time|Earlier only|Randomly interleaved|Sorted by outcome|Forecasting evaluation must respect the past-to-future decision boundary.",
      "Does TimeSeriesSplit sort timestamps itself?|No|Always|Only with gap|Only with test_size|The splitter uses the supplied sequence order.",
      "A seasonal model trains on December and validates on prior October. What is mismatched?|Operational chronology|Estimator interface|Class dtype|Index uniqueness|The training information would not exist at the earlier validation decision.",
      "A weekly target window overlaps the validation start. Which safeguard deserves consideration?|Purged boundary window|One-hot target labels|Larger feature vectors|Randomized timestamps|Overlapping information windows can leak across an otherwise chronological boundary.",
      "A one-year test contains only holiday demand. What cannot be claimed automatically?|Year-round performance|Observed holiday error|Test row count|Chronological ordering|A narrow seasonal population does not cover the full deployment year.",
      "A service refits every month. What should evaluation mimic?|Update cadence|Full-history test fit|One global future scaler|Alphabetical date order|The historical simulation should match the actual update and information policy.",
      "A fold contains a newly introduced product category. What should be measured?|Unknown-category behavior|Only training labels|Only sorting speed|Only integer width|Later periods can contain categories absent from earlier training.",
      "A feature snapshot is revised after outcome completion. Which version belongs in backtesting?|As-of snapshot|Latest corrected snapshot|Target-enriched snapshot|Random snapshot|Backtests should use information that would have existed at prediction time.",
      "A team averages temporal scores across unequal periods. What should accompany it?|Period-specific results|Only one global rank|Only training score|Only feature names|Aggregate scores can hide different time exposures and regime changes.",
      "A gap is set to seven rows for an irregular stream with week-long label delay. Why may it fail?|Rows are not durations|Gaps always delete targets|Splits always shuffle|All delays are identical|The exclusion must cover the actual availability window, which a fixed row count may not match."
    ],
    "comps": [
      "m2.c1"
    ]
  },
  {
    "slug": "group-independence",
    "title": "Keep dependent entities on one side of evaluation",
    "intro": "A synthetic maintenance table contains many readings from each machine. A row-random split lets the same machine appear in training and validation, allowing a model to exploit stable machine identity when the real goal is performance on unseen machines.",
    "sections": [
      [
        "Build the decision rule",
        "GroupShuffleSplit partitions group labels rather than individual rows. GroupKFold keeps each group outside the training side when that group is used for validation. The group definition must match the dependency that matters: patient, customer, household, device or facility. Holding out device ids does not remove leakage through shared households when household-level dependence is the actual concern."
      ],
      [
        "Check the engineering boundary",
        "Group and time requirements can coexist. To predict future outcomes on new facilities, a custom split may need both chronological ordering and disjoint facility sets. Group-level class imbalance can make fold scores unstable; report group counts and per-fold support rather than only a pooled row average. The fixture checks disjoint group identities, not clinical independence or reliability of any group definition."
      ]
    ],
    "problem": "Keep dependent entities on one side of evaluation on a small synthetic fixture.",
    "steps": [
      "State the input and decision-time assumptions.",
      "Run the shown calculation and compare the printed result.",
      "Explain which conclusion the fixture supports and which assumptions require another check."
    ],
    "code": "import numpy as np\nfrom sklearn.model_selection import GroupShuffleSplit\ng=np.array([\"a\",\"a\",\"b\",\"b\",\"c\",\"c\"])\ntr,va=next(GroupShuffleSplit(n_splits=1,test_size=1,random_state=3).split(np.zeros((6,1)),groups=g))\nprint(bool(set(g[tr]) & set(g[va])))\nprint(len(set(g[va])))",
    "expect": "False\n1",
    "limit": "This synthetic in-memory example verifies the displayed operation under scikit-learn 1.8.0. It does not establish production accuracy, causal impact, representative sampling or acceptable error costs. Group and time requirements can coexist.",
    "mistakes": [
      "Do not substitute a convenient representation for the stated decision rule. GroupShuffleSplit partitions group labels rather than individual rows.",
      "Do not generalize this tiny fixture beyond its sampling and information boundary. Group and time requirements can coexist."
    ],
    "takeaways": [
      "GroupShuffleSplit partitions group labels rather than individual rows.",
      "Group and time requirements can coexist."
    ],
    "practice": [
      "What is the splitting unit in grouped validation?|Entity groups|Always individual rows|Feature columns|Target classes only|Group-aware splitting keeps related observations together.",
      "Which check directly detects group overlap?|Set intersection|Feature mean alone|Row count alone|Class-name sorting|Intersecting train and validation group identities exposes overlap.",
      "Does a large row count guarantee many independent units?|No|Yes always|Only after scaling|Only with integer ids|Repeated observations may come from very few independent groups.",
      "A patient has scans in both partitions. What generalization claim is threatened?|New-patient performance|Image dimensions|Label dtype|Matrix storage order|The model can exploit patient-specific information shared across partitions.",
      "Devices share one household account. Which grouping might be necessary?|Household grouping|Only row numbering|Only device color|Only target sorting|The relevant dependency may exist above the individual device.",
      "A model must handle new hospitals next year. What split constraints matter?|Site and time|Only random seed|Only image count|Only class names|Both unseen-site and future-period requirements should shape evaluation."
    ],
    "formal": [
      "What does GroupKFold hold out across a fold?|Whole groups|Every feature|Only positive rows|Only missing targets|A validation group does not appear on that fold\u2019s training side.",
      "Which quantity should accompany grouped score summaries?|Group support|Only column count|Only model version|Only timestamp format|Independent group counts help interpret the evidence behind scores.",
      "A customer-level split still includes family members across partitions. What remains possible?|Family dependence|Automatic time ordering|Guaranteed calibration|Perfect independence|Related entities may share signals beyond the chosen customer id.",
      "A facility fold has no positive outcomes. What should be acknowledged?|Metric feasibility limits|Guaranteed perfect recall|Automatic class synthesis|Zero false negatives universally|Some classification metrics cannot be meaningfully estimated without required outcome support.",
      "A group id is also fed into the predictor. What must be checked?|Deployment availability|Only split percentage|Only array strides|Only loss naming|An identifier may support memorization and may be unavailable or meaningless for new groups.",
      "A team chooses a grouping after comparing test scores. What risk appears?|Evaluation selection bias|Only dtype promotion|Only sparse encoding|Only category sorting|The evaluation design itself becomes tuned to observed outcomes.",
      "A single giant group dominates row-weighted accuracy. What extra summary helps?|Per-group performance|Only bigger batch size|Only feature sorting|Only fit duration|Group-level summaries reveal whether large groups hide failures on smaller groups.",
      "A split removes exact duplicates but keeps near-identical session windows. What concern persists?|Dependent observations|Target dimensionality|One-hot column count|Floating-point tolerance|Deduplication alone does not remove correlated or overlapping windows.",
      "A service serves known devices and new devices. How should evidence be organized?|Deployment slices|Only pooled accuracy|Only new labels|Only training loss|Known-entity and unseen-entity performance answer different operational questions.",
      "A hierarchical dataset has patients nested in hospitals. What determines the holdout level?|Deployment unit|Largest possible row count|Shortest fit time|Alphabetical group labels|The split must challenge the level at which the model is expected to generalize."
    ],
    "comps": [
      "m2.c1"
    ]
  },
  {
    "slug": "target-leakage",
    "title": "Audit features against the decision timestamp",
    "intro": "A synthetic claims model predicts whether an incoming claim will require escalation. The dataset includes a resolution code and a final payment amount. Both are strongly predictive because they describe what happened after investigation, not what was available at intake.",
    "sections": [
      [
        "Build the decision rule",
        "Target leakage occurs when a predictor contains outcome information that would not be available when making the decision. It may be a direct duplicate of the target, a downstream workflow field, an aggregate that includes future outcomes, or a proxy created through post-event data joining. High accuracy is a symptom worth investigating rather than proof of leakage by itself. Build a feature availability table with source system, timestamp, update delay and transformation lineage."
      ],
      [
        "Check the engineering boundary",
        "Train-test leakage is broader than explicit target fields. Fitting imputation, scaling, vocabulary selection or feature selection on all rows exposes held-out information. Duplicate entities and overlapping windows create dependence across partitions even when feature values are legitimate. Validate the exact data construction procedure as well as estimator fitting. The example demonstrates availability filtering, not automatic detection of all semantic leakage."
      ]
    ],
    "problem": "Audit features against the decision timestamp on a small synthetic fixture.",
    "steps": [
      "State the input and decision-time assumptions.",
      "Run the shown calculation and compare the printed result.",
      "Explain which conclusion the fixture supports and which assumptions require another check."
    ],
    "code": "fields={\"age_days\":0,\"prior_claims\":0,\"resolution\":5,\"payment\":7}\nprediction_day=0\nallowed=sorted(k for k,available in fields.items() if available<=prediction_day)\nprint(allowed)",
    "expect": "['age_days', 'prior_claims']",
    "limit": "This synthetic in-memory example verifies the displayed operation under scikit-learn 1.8.0. It does not establish production accuracy, causal impact, representative sampling or acceptable error costs. Train-test leakage is broader than explicit target fields.",
    "mistakes": [
      "Do not substitute a convenient representation for the stated decision rule. Target leakage occurs when a predictor contains outcome information that would not be available when making the decision.",
      "Do not generalize this tiny fixture beyond its sampling and information boundary. Train-test leakage is broader than explicit target fields."
    ],
    "takeaways": [
      "Target leakage occurs when a predictor contains outcome information that would not be available when making the decision.",
      "Train-test leakage is broader than explicit target fields."
    ],
    "practice": [
      "What defines a legitimate predictor at serving time?|Available information|High correlation alone|Low missingness alone|Short column name|A feature must exist under the intended decision-time information policy.",
      "What is target leakage?|Outcome leakage|Any useful correlation|Any numeric feature|Any minority class|Leakage uses outcome-related information unavailable for the real decision.",
      "Does high validation accuracy prove absence of leakage?|No|Yes always|Only with trees|Only after scaling|An unrealistically strong score can itself motivate a leakage audit.",
      "A churn model includes cancellation date for active accounts. What is wrong?|Post-outcome feature|Weak class balance|Incorrect array shape|Too many folds|Cancellation timing can encode the very outcome being predicted.",
      "A credit feature joins repayment status updated next month. What must be enforced?|As-of data join|Alphabetical merge|Random target encoding|Full-table scaling|Historical feature joins must respect the prediction timestamp.",
      "A notebook selects columns by full-data target correlation. What leaks?|Holdout labels|Only training means|Only row order|Only package metadata|Feature selection used labels from evaluation rows."
    ],
    "formal": [
      "Which artifact supports a feature availability review?|Timestamp lineage table|Only accuracy plot|Only estimator repr|Only row count|Source and availability metadata connect features to the decision boundary.",
      "Which transformation has learnable data statistics?|Mean imputation|Fixed unit conversion|Column renaming|Constant multiplication|Mean replacement learns a statistic from fitting observations.",
      "A target is removed but its duplicate status flag remains. What persists?|Target proxy leakage|Feature independence|Guaranteed calibration|Valid external testing|A renamed or indirectly encoded outcome can still leak the target.",
      "A fraud feature counts chargebacks across all future transactions. What should change?|Past-only aggregation|Only target dtype|Only loss function|Only feature name|An aggregate must stop before the prediction time and respect outcome delay.",
      "A service can access a strong feature only after manual investigation. When is it legitimate?|After that workflow stage|At intake automatically|Whenever accuracy improves|Whenever missingness is low|Feature validity depends on the actual decision stage rather than predictive strength.",
      "A preprocessing step uses test-feature means without test labels. Is the boundary intact?|No|Yes without labels|Yes for all scalers|Yes for all imputers|Held-out feature distributions can influence fitted preprocessing even without labels.",
      "A suspicious feature yields perfect predictions. What is a useful investigation?|Trace data lineage|Assume model mastery|Publish immediately|Drop all weak features|Lineage review can reveal a proxy, post-event update or construction error.",
      "A feature is delayed unpredictably by ingestion. What should serving validation test?|Availability lag|Only category order|Only training counts|Only column spelling|Event timestamp and practical ingestion availability can differ.",
      "A historical row is rebuilt using today\u2019s corrected customer profile. What can be introduced?|Revision leakage|Guaranteed fairness|No new information|Only memory overhead|Later corrections can expose knowledge absent at the historical decision time.",
      "A system removes leaked fields and accuracy falls sharply. What should reviewers conclude?|Reassess honest utility|Restore leaked fields|Hide revised metrics|Fit on test labels|A lower valid score is the relevant estimate; leakage-inflated accuracy is not deployable evidence."
    ],
    "comps": [
      "m3.c1"
    ]
  },
  {
    "slug": "pipeline-fit",
    "title": "Fit preprocessing inside each model-training boundary",
    "intro": "A synthetic lead-scoring experiment imputes missing visits, scales activity and fits logistic regression. Doing those steps manually in several notebooks makes it easy to fit a scaler on validation rows or forget the same transformation at prediction time.",
    "sections": [
      [
        "Build the decision rule",
        "Pipeline chains transformers followed by an estimator. Calling fit fits each transformer on the supplied training data and passes its transformed output downstream. Calling predict applies fitted transforms before estimator prediction. This gives model selection a single object containing both learned preprocessing and predictor parameters. It is still necessary to split correctly and remove unavailable fields; a pipeline cannot infer the business timestamp."
      ],
      [
        "Check the engineering boundary",
        "Inside cross-validation, a fresh clone is fitted for each training fold, so preprocessing statistics are learned within that fold when all learned steps are inside the pipeline. Parameters use step__parameter names, such as model__C. Put feature selection and learned encoding inside the same boundary. The example uses a constant final estimator to demonstrate stored training imputation without numerical optimizer instability."
      ]
    ],
    "problem": "Fit preprocessing inside each model-training boundary on a small synthetic fixture.",
    "steps": [
      "State the input and decision-time assumptions.",
      "Run the shown calculation and compare the printed result.",
      "Explain which conclusion the fixture supports and which assumptions require another check."
    ],
    "code": "import numpy as np\nfrom sklearn.pipeline import Pipeline\nfrom sklearn.impute import SimpleImputer\nfrom sklearn.dummy import DummyRegressor\np=Pipeline([(\"fill\",SimpleImputer()),(\"model\",DummyRegressor())]).fit([[1.],[3.],[np.nan]],[2.,4.,6.])\nprint(p.named_steps[\"fill\"].statistics_.tolist())\nprint(p.predict([[np.nan]]).tolist())",
    "expect": "[2.0]\n[4.0]",
    "limit": "This synthetic in-memory example verifies the displayed operation under scikit-learn 1.8.0. It does not establish production accuracy, causal impact, representative sampling or acceptable error costs. Inside cross-validation, a fresh clone is fitted for each training fold, so preprocessing statistics are learned within that fold when all learned steps are inside the pipeline.",
    "mistakes": [
      "Do not substitute a convenient representation for the stated decision rule. Pipeline chains transformers followed by an estimator.",
      "Do not generalize this tiny fixture beyond its sampling and information boundary. Inside cross-validation, a fresh clone is fitted for each training fold, so preprocessing statistics are learned within that fold when all learned steps are inside the pipeline."
    ],
    "takeaways": [
      "Pipeline chains transformers followed by an estimator.",
      "Inside cross-validation, a fresh clone is fitted for each training fold, so preprocessing statistics are learned within that fold when all learned steps are inside the pipeline."
    ],
    "practice": [
      "What does Pipeline.predict do before final prediction?|Fitted transformations|Refit on test labels|Shuffle all columns|Discard preprocessing|Prediction reuses learned preprocessing before the final estimator.",
      "How is a nested model parameter commonly addressed?|model__C|model.C only|C/model|target__label|Double underscores address a named pipeline step parameter.",
      "Does Pipeline fix an invalid random split automatically?|No|Always|Only for classifiers|Only with imputation|The user still controls the data split and information boundary.",
      "A scaler is fitted outside cross-validation. What should move?|Scaler into pipeline|Test labels into training|Metric into target|Ids into predictors|Each fold should learn scaling only from its own training rows.",
      "A team serializes pipeline and estimator together. What benefit follows?|Transformation consistency|Guaranteed future accuracy|No need for schema checks|Automatic data repair|The fitted preprocessing and model remain coupled for inference.",
      "A pipeline contains a leaked payment feature. What is still required?|Availability audit|More CV folds only|Larger C only|New random seed only|Pipelines preserve operations but cannot judge whether a field exists at decision time.",
      "Which pipeline step notation selects an imputer strategy?|fill__strategy|fill.strategy only|strategy/fill|target__strategy|The double-underscore parameter path selects the named transformer parameter.",
      "A pipeline is cloned for each fold. Which fitted state should differ by training fold?|Imputer statistics|Fixed column names|Declared target name|Report file suffix|Learned replacement values depend on that fold\u2019s training observations."
    ],
    "formal": [
      "Which method learns pipeline component parameters?|fit|predict|score_samples only|inverse_transform always|Fitting estimates transformer statistics and final-estimator parameters.",
      "What belongs inside cross-validation when learned from data?|Feature selection|Fixed column rename|Printed report title|Handwritten unit label|Learned selection must exclude validation observations on each fold.",
      "A developer calls fit_transform on the validation table. What is wrong?|Validation refits statistics|Validation becomes sparse|Labels become ordered|Columns become named|Validation should receive transform from the training-fitted object.",
      "A hyperparameter grid uses C instead of model__C. What should be corrected?|Nested parameter path|Target column dtype|Validation row order|Feature timing|Grid parameters must address the named pipeline step.",
      "A pipeline\u2019s training imputer uses median but serving fills zero. What changed?|Input representation|Only model name|Only class count|Only split seed|Serving bypassed the fitted preprocessing policy.",
      "A model comparison includes an encoder fitted across all folds. What invalidates it?|Holdout information|Only sparse output|Only integer labels|Only fewer columns|The learned vocabulary or statistics crossed validation boundaries.",
      "A fit method mutates a shared preprocessing object reused elsewhere. What engineering safeguard helps?|Separate fitted clones|Shared test labels|Global data cache|Target-based row ordering|Separate fitted objects reduce accidental state contamination across experiments.",
      "A custom transformer reads future data from disk in transform. Does a Pipeline make it safe?|No|Yes by cloning|Yes by naming steps|Yes with predict|The transformer\u2019s implementation can violate the boundary even inside a pipeline.",
      "A reviewer wants reproducible inference inputs. Which artifact matters?|Complete fitted pipeline|Only classifier class|Only feature count|Only test accuracy|The fitted transformation state determines the numerical inputs received by the model.",
      "A cross-validation pipeline is correct but feature construction happened globally using outcomes. What remains contaminated?|Upstream construction|Only estimator fit|Only parameter names|Only transform ordering|Leakage before the pipeline is still leakage; the entire data construction path must respect folds."
    ],
    "comps": [
      "m3.c1",
      "m3.c2"
    ]
  },
  {
    "slug": "rehearse-deployment",
    "title": "Rehearse a frozen preprocessing and evaluation protocol",
    "intro": "A synthetic appointment team is ready to compare its selected model with a baseline. Its review checklist records the prediction timestamp, feature schema, training cutoff, group boundary, pipeline version and untouched evaluation partition before final scoring.",
    "sections": [
      [
        "Build the decision rule",
        "A defensible evaluation is a procedure, not a single function call. Record how labels mature, how features are constructed, which rows are excluded and when transformations learn their parameters. Keep one canonical pipeline for all candidates except the intended experimental difference. Use validation to select the configuration; after selection, any refitting on development data must still keep the final test untouched."
      ],
      [
        "Check the engineering boundary",
        "Serving rehearsal should include missing inputs, unknown categories, empty batches, extreme numeric values and schema violations. Record preprocessing outputs and prediction shapes on synthetic fixtures. Monitoring after launch should compare input validity and distribution changes, but a monitor must not silently refit the production scaler. The fixture demonstrates a frozen scaler reused on two batches; it cannot show production drift or authorize deployment."
      ]
    ],
    "problem": "Rehearse a frozen preprocessing and evaluation protocol on a small synthetic fixture.",
    "steps": [
      "State the input and decision-time assumptions.",
      "Run the shown calculation and compare the printed result.",
      "Explain which conclusion the fixture supports and which assumptions require another check."
    ],
    "code": "from sklearn.preprocessing import StandardScaler\ns=StandardScaler().fit([[0.],[2.]])\nfirst=s.transform([[4.]])[0,0]\nsecond=s.transform([[6.]])[0,0]\nprint(float(first),float(second))\nprint(s.mean_.tolist())",
    "expect": "3.0 5.0\n[1.0]",
    "limit": "This synthetic in-memory example verifies the displayed operation under scikit-learn 1.8.0. It does not establish production accuracy, causal impact, representative sampling or acceptable error costs. Serving rehearsal should include missing inputs, unknown categories, empty batches, extreme numeric values and schema violations.",
    "mistakes": [
      "Do not substitute a convenient representation for the stated decision rule. A defensible evaluation is a procedure, not a single function call.",
      "Do not generalize this tiny fixture beyond its sampling and information boundary. Serving rehearsal should include missing inputs, unknown categories, empty batches, extreme numeric values and schema violations."
    ],
    "takeaways": [
      "A defensible evaluation is a procedure, not a single function call.",
      "Serving rehearsal should include missing inputs, unknown categories, empty batches, extreme numeric values and schema violations."
    ],
    "practice": [
      "What should be frozen before final test scoring?|Frozen procedure|Future test labels|All business demand|Every data source forever|The final test estimates a completed development procedure.",
      "What should an unknown-category rehearsal test?|Serving behavior|Future true labels|Causal treatment effect|All class priors forever|Inference tests should verify the actual fitted mapping for unseen inputs.",
      "What should monitoring avoid doing silently?|Silent transform refits|Counting invalid inputs|Reporting unknown rates|Recording schema failures|Automatic unreviewed refitting changes model inputs and behavior.",
      "A final test fails after several configuration changes guided by its results. What is needed?|Independent evidence|Rename it validation only|More test-guided tuning|Report the best attempt|The exposed test is no longer an untouched assessment of the final procedure.",
      "A serving batch has no records. What should be specified?|Empty-input contract|A fabricated prediction|A mean target label|A random class|Operational behavior needs a clear policy rather than invented observations.",
      "A release changes raw feature units. What rehearsal must catch it?|Unit/schema mismatch|Only target encoding|Only class order|Only validation size|Input validity includes semantic units as well as matrix dimensions.",
      "Which fitted artifact should be retained with a trained predictor?|Category vocabulary|Future test labels|Manual target ranks|Only raw file names|The learned encoder vocabulary determines the inference representation.",
      "A final evaluation calls pipeline.fit on test inputs. What must be replaced?|Use predict instead|Add test outcomes|Shuffle labels first|Drop the pipeline|Inference must reuse the frozen fitted procedure rather than refit it on held-out rows."
    ],
    "formal": [
      "Which object should transform final test data?|Fitted pipeline|Test-fitted scaler|Fresh unfitted encoder|Target-only transformer|Final evaluation applies the completed training procedure without learning from the test.",
      "Which record helps reproduce a preprocessing decision?|Versioned data contract|Only chart color|Only file nickname|Only notebook order|The contract records units, availability, missingness and transformation rules.",
      "A team refits on train plus validation after choosing settings. Which partition stays excluded?|Final test|All training rows|All validation rows|Only positive rows|Development refitting may use training and validation while preserving the final holdout.",
      "A schema test passes numeric types but units changed. What limitation is exposed?|Missing unit semantics|All dtypes are invalid|All scaling is useless|All tests are causal|A numeric dtype cannot distinguish meters from centimeters.",
      "A monitoring alert shows rising unknown-region rate. What follows?|Investigate input shift|Automatically invent labels|Assume improved accuracy|Ignore serving logs|Unknown rates can reveal category drift or source-system changes.",
      "A batch transforms differently depending on other rows in that batch. What deserves review?|Inference refitting|Only row display order|Only metric averaging|Only model naming|A frozen per-feature transformation should not relearn batch-specific statistics unless explicitly designed.",
      "A reviewer asks which rows trained the imputer. What evidence answers directly?|Fit-data lineage|Only model score|Only feature importances|Only Python version|Lineage should identify the exact training boundary used to estimate statistics.",
      "A synthetic fixture passes every transformation check. What remains unproven?|Real-population utility|The printed output|The code path executed|The fixture dimensions|Synthetic operation checks do not estimate real deployment performance.",
      "A frozen test contains labels not yet mature at release time. Which policy needs review?|Outcome availability|Only numerical precision|Only category sort|Only model class|Evaluation labels need a defined maturity window aligned with the prediction task.",
      "A team wants continuous preprocessing updates after launch. What is necessary for honest evaluation?|Evaluate update policy|Claim frozen-test immunity|Reuse labels instantly|Ignore transformation state|An adaptive service must be evaluated as an adaptive procedure with its actual update and information rules."
    ],
    "comps": [
      "m3.c1",
      "m3.c2"
    ]
  }
],["preprocessing.rst", "compose.rst", "cross_validation.rst", "impute.rst"]);
