'use strict';
const {course}=require('./wave4-ai-mobile-completion-private');
module.exports=course("responsible-ai-monitoring",[
  {
    "slug": "data-drift",
    "title": "Measure input drift with fixed bins and meaningful segments",
    "intro": "A deployed fraud classifier receives a different mix of transaction sizes this month. Data drift means the input distribution changed. It can warn that the model is operating outside familiar conditions, but it does not by itself prove that predictive quality has declined.",
    "sections": [
      [
        "Compare like with like",
        "A reference distribution describes an approved baseline, often a training or stable production window. A current distribution describes the operational window being examined. Fix feature units, bin edges, missing-value policy and population filters before comparing them. A schema change from dollars to cents is a pipeline incident, even if a statistical drift test also fires. Include missingness and unseen category rates as first-class signals.",
        "For categorical bins p and q, total variation distance is one half of the sum of absolute bin-probability differences. It lies between zero and one. A value .3 means .3 probability mass must be redistributed to make these binned distributions match. Binning can hide changes within a bin, and a pooled distribution can hide opposing shifts in customer segments."
      ],
      [
        "Use a drift signal as investigation evidence",
        "A reference that rolls forward automatically can absorb gradual deterioration. Keep the baseline version and choose an explicit update policy. Multiple features and repeated windows create many opportunities to alert; use practical effect sizes, sample floors and an investigation budget rather than treating every small p-value as a production emergency.",
        "The example compares two declared four-bin distributions and a missingness rate. Its arithmetic is deterministic and uses no customer data. For a fraud team, a distribution shift could be seasonal purchasing or an upstream bug; compare source health, feature semantics and label-based outcomes before deciding whether to retrain. Always record sample counts alongside the drift magnitude."
      ]
    ],
    "code": "import numpy as np\np=np.array([.4,.3,.2,.1]);q=np.array([.1,.3,.2,.4])\nprint(round(float(np.abs(p-q).sum()/2),6))\nprint(round(18/200,6))",
    "expect": "0.3\n0.09",
    "practice": [
      [
        "What does input drift describe?",
        "Changed feature distribution",
        "Guaranteed outcome degradation",
        "Automatic data-label leakage",
        "Increased model parameter count",
        "Input drift concerns the distribution of observed model inputs."
      ],
      [
        "What must remain fixed to compare binned distributions?",
        "Bin definitions",
        "Every daily sample count",
        "All model confidence values",
        "Every customer's transaction",
        "Stable bins ensure the probabilities refer to the same categories or intervals."
      ],
      [
        "What does total variation use for categorical bins?",
        "Half the absolute differences",
        "Sum of squared model weights",
        "Mean of predicted class ids",
        "Largest input value alone",
        "Total variation is half the L1 distance between corresponding probability vectors."
      ],
      [
        "A pipeline changes kilograms into grams without metadata. Which check is most direct?",
        "Feature unit contract",
        "Only model class count",
        "Only alert display color",
        "Only sample row ordering",
        "A unit mismatch is a semantic schema failure and should be checked directly."
      ],
      [
        "A current window has 12 missing values among 80 requests. What rate is reported?",
        "15%",
        "12%",
        "6.67%",
        "80%",
        "The observed missingness fraction is 12/80=.15."
      ],
      [
        "A pooled drift score stays low while one region shifts sharply. What should be added?",
        "Regional monitoring",
        "Only larger global batches",
        "Only more model layers",
        "Only monthly chart exports",
        "Segment monitoring can reveal changes concealed by population pooling."
      ]
    ],
    "formal": [
      [
        "Which distribution is the baseline in a drift comparison?",
        "Reference distribution",
        "Current error labels only",
        "Latest optimizer moments",
        "Largest model output vector",
        "The reference is the chosen population against which current inputs are compared."
      ],
      [
        "Can data drift alone establish predictive harm?",
        "No, outcomes are needed",
        "Yes, harm is certain",
        "Yes, accuracy must be zero",
        "Only if the model is linear",
        "Input change and label-conditional model performance are different claims."
      ],
      [
        "What is a missingness signal measuring?",
        "Absent feature proportion",
        "Number of hidden layers",
        "Classifier confidence mean",
        "Final training loss only",
        "Missingness is the fraction of records lacking a feature under a declared policy."
      ],
      [
        "Reference bins are (.5,.5), current bins (.8,.2). What TV distance follows?",
        ".3",
        ".6",
        ".15",
        "1.3",
        "Half of abs(.5-.8)+abs(.5-.2) equals .3."
      ],
      [
        "A numerical drift monitor compares dollars in the reference with cents currently. Which first action fits?",
        "Repair unit mismatch",
        "Retrain immediately",
        "Raise the class threshold",
        "Discard reference lineage",
        "The populations have incompatible feature semantics, so fix that contract before interpreting drift."
      ],
      [
        "A group changes from 10% to 30% of traffic while its within-group inputs stay stable. What can explain pooled drift?",
        "Population-mix change",
        "Guaranteed concept drift",
        "A new hidden model layer",
        "A changed class dictionary",
        "Different group proportions can move the pooled input distribution without within-group change."
      ],
      [
        "A window has 40 null feature values in 500 requests; baseline null rate is .02. What increase is observed?",
        "6 percentage points",
        "2 percentage points",
        "8 percentage points",
        "20 percentage points",
        "Current rate is .08, so its absolute increase above .02 is .06."
      ],
      [
        "A four-bin reference is (.25,.25,.25,.25) and current is (.5,.25,.25,0). What TV distance applies?",
        ".25",
        ".5",
        ".125",
        ".75",
        "The absolute differences sum to .5; halving gives .25."
      ],
      [
        "A rolling baseline absorbs each recent week while a frozen launch baseline shows steady drift. Which interpretation is supported?",
        "Recent windows hide accumulation",
        "The frozen metric is impossible",
        "Every recent model is accurate",
        "All drift must be label noise",
        "A moving baseline can make gradual long-run change less visible by updating its comparison population."
      ],
      [
        "A monitor must detect contract bugs and meaningful drift without flooding analysts. Which plan is strongest?",
        "Schema checks plus gated drift",
        "Drift scores without sample floors",
        "Automatic retraining on each bin",
        "Pooled monthly means alone",
        "Contract validation, adequate samples and effect-size gates address distinct causes and operational alert burden."
      ]
    ],
    "steps": [
      "Declare two comparable probability vectors with shared bins.",
      "Calculate their absolute differences and halve the sum.",
      "Report a separate current missing-value fraction."
    ],
    "mistakes": [
      "Do not equate changed inputs with proven predictive harm.",
      "Do not update a baseline silently while comparing historical scores."
    ],
    "takeaways": [
      "Version the reference population and bin policy.",
      "Investigate feature semantics and segments before retraining."
    ],
    "lang": "python-pandas",
    "problem": "Measure input drift with fixed bins and meaningful segments on a synthetic local fixture.",
    "limit": "The printed result verifies only the declared synthetic in-memory computation. Native CPU execution uses the selected runtime; it does not establish image-dataset quality, production accuracy, device behavior or deployment readiness."
  },
  {
    "slug": "concept-drift",
    "title": "Separate concept drift, prevalence and delayed performance labels",
    "intro": "A loan model sees stable applicant features but default behavior changes after an economic shock. Concept drift concerns a change in the relationship between inputs and outcomes. Detecting it needs outcome evidence and a careful account of when those outcomes become observable.",
    "sections": [
      [
        "What changed in the joint distribution?",
        "Data drift concerns P(X); concept drift concerns P(Y given X). Label prevalence P(Y) can change, and several kinds of shift may occur together. Stable one-feature marginals do not prove a stable joint distribution. Likewise, stable input histograms cannot rule out a changed outcome mechanism. Compare actual performance on matured cohorts, not merely score histograms.",
        "A cohort groups predictions by the time or population where they were made. Delayed labels require linking the original model version and prediction time to a later outcome without leaking future information into the prediction. Recent records with no outcome should be marked pending instead of assumed negative. A metric over only quickly resolved cases may be biased by outcome-dependent observation delay."
      ],
      [
        "Choose metrics tied to the operating decision",
        "A binary decision yields true positives, false positives, true negatives and false negatives. Recall asks which real positives were found; precision asks which positive decisions were correct. Accuracy can rise when negatives become common even while critical-positive recall falls. Monitor calibration with a named metric and sufficient labels if scores drive risk or resource allocation.",
        "The fixture calculates recall and precision for two synthetic matured cohorts at one fixed threshold. It shows a substantial recall drop while keeping denominators explicit. The example cannot identify a causal reason for that drop. A business response should compare labeling processes, capture conditions, subgroup mix and model versions before claiming a changed concept or training a replacement."
      ]
    ],
    "code": "import numpy as np\nfor tp,fp,fn in [(80,20,20),(50,10,50)]:\n print(round(tp/(tp+fn),3),round(tp/(tp+fp),3))\nprint('pending',30)",
    "expect": "0.8 0.8\n0.5 0.833\npending 30",
    "practice": [
      [
        "What relationship does concept drift concern?",
        "P(Y given X)",
        "Model filename length",
        "Input tensor rank only",
        "Optimizer parameter count",
        "Concept drift changes the relationship between observed inputs and outcomes."
      ],
      [
        "What does an unmatured label represent?",
        "Pending outcome evidence",
        "A confirmed negative case",
        "A confirmed true positive",
        "A valid accuracy denominator",
        "Absence of an observed outcome must not be converted into a negative label."
      ],
      [
        "What does recall use as its denominator?",
        "Actual positive cases",
        "All predicted positive cases",
        "Only observed false alarms",
        "Every available feature value",
        "Recall divides true positives by true positives plus false negatives."
      ],
      [
        "A credit event takes 90 days to mature. Which cohort can support a full 90-day metric today?",
        "Predictions at least 90 days old",
        "Only yesterday's predictions",
        "Only today's positive scores",
        "Any request without a label",
        "The cohort must have had the full outcome observation period."
      ],
      [
        "Stable input bins accompany a higher error rate on matured cases. What remains possible?",
        "Concept drift",
        "Proof of no model change",
        "Zero measurement bias",
        "Guaranteed unit consistency",
        "The outcome relationship may change without a detectable marginal input change."
      ],
      [
        "A model predicts a negative case correctly. Which confusion entry increases?",
        "True negatives",
        "False negatives",
        "True positives",
        "False positives",
        "A correctly rejected actual negative is a true negative."
      ]
    ],
    "formal": [
      [
        "Which distribution does label prevalence describe?",
        "P(Y)",
        "P(X) alone",
        "P(weights)",
        "P(runtime bytes)",
        "Label prevalence is the population distribution of outcomes."
      ],
      [
        "Why retain prediction-time model version for delayed labels?",
        "Correct outcome attribution",
        "Larger training batch sizes",
        "Less need for data lineage",
        "Automatic model retraining",
        "A later label must be evaluated against the model that actually made the original decision."
      ],
      [
        "What does precision measure at a fixed decision threshold?",
        "Correct share of positive calls",
        "Recovered share of actual positives",
        "Fraction of records with labels",
        "Average input-feature magnitude",
        "Precision is TP/(TP+FP), measuring the correctness of positive decisions."
      ],
      [
        "A matured cohort has TP=60,FN=40. What recall should monitoring report?",
        ".6",
        ".4",
        "1.5",
        ".667",
        "Recall is 60/(60+40)=.6 regardless of the number of negatives."
      ],
      [
        "A recent cohort has 70 observed labels and 30 pending. What is invalid?",
        "Treat pending as negatives",
        "Report label maturity counts",
        "Separate matured cohorts",
        "Retain prediction lineage",
        "Unobserved outcomes are not known negative events and can bias performance estimates."
      ],
      [
        "A classifier sees unchanged P(X) but P(Y given X) changes. What name fits the stated change?",
        "Concept drift",
        "Input scaling only",
        "Parameter compression",
        "Deterministic label order",
        "The change is in the conditional outcome mechanism rather than necessarily the input marginal."
      ],
      [
        "At the same threshold, TP falls from 90 to 45 while FP stays 10 and each cohort has 100 positives. What happens to recall?",
        ".90 to .45",
        ".90 to .82",
        ".10 to .55",
        ".45 to .90",
        "The denominator is the 100 actual positives in each cohort, giving a halving of recall."
      ],
      [
        "A monitor reports 98% accuracy on 1000 cases: all 980 negatives correct and all 20 positives missed. What positive recall is hidden?",
        "0",
        ".98",
        ".02",
        "1",
        "There are zero true positives and twenty false negatives, so positive recall is zero."
      ],
      [
        "Quickly resolved outcomes are mostly low-risk negatives while defaults take longer. Which evaluation is best supported?",
        "Matured-cohort comparison",
        "Unlabeled-as-negative accuracy",
        "Only fastest-label cases",
        "Latest-hour aggregate accuracy",
        "A full maturation window reduces the outcome-dependent delay bias of observing only fast outcomes."
      ],
      [
        "A label feed changes definition during a recall drop and model inputs remain stable. Which investigation comes first?",
        "Audit outcome semantics",
        "Declare concept drift proven",
        "Optimize a replacement immediately",
        "Ignore labels and inspect scores",
        "A changed measurement definition can explain the apparent performance change and must be checked before causal attribution."
      ]
    ],
    "steps": [
      "Specify two matured-cohort confusion triples.",
      "Compute recall and precision using their correct denominators.",
      "Keep thirty pending outcomes distinct from negative cases."
    ],
    "mistakes": [
      "Do not join current model metadata onto historical predictions.",
      "Do not infer concept drift solely from an input histogram."
    ],
    "takeaways": [
      "Measure performance on comparable matured cohorts.",
      "Audit label definitions and delays alongside model quality."
    ],
    "lang": "python-pandas",
    "problem": "Separate concept drift, prevalence and delayed performance labels on a synthetic local fixture.",
    "limit": "The printed result verifies only the declared synthetic in-memory computation. Native CPU execution uses the selected runtime; it does not establish image-dataset quality, production accuracy, device behavior or deployment readiness."
  },
  {
    "slug": "alert-policy",
    "title": "Design alert windows, sample floors and response gates",
    "intro": "A monitoring dashboard emits hundreds of alerts after a short burst of low-volume traffic. An alert policy needs a denominator, a time window, an actionable owner and a reason to cross from observation into response. Statistical sensitivity alone is not operational reliability.",
    "sections": [
      [
        "Rates require exposure and persistence",
        "An error rate is errors divided by eligible requests in the same population and interval. Do not compare raw error counts across unequal traffic. A sample floor prevents a handful of requests from creating unstable rate claims. Consecutive breached windows can suppress transient noise; hysteresis uses different trigger and recovery conditions to reduce flapping. These controls trade detection delay against operational noise.",
        "An SLO defines a measurable target over a stated interval. If availability target is 99%, the allowed bad fraction is 1%. A current bad fraction of 3% burns that fraction of the error budget three times as fast as the target allowance, under comparable request weighting. A budget is a planning signal, not proof that each error has equal business cost."
      ],
      [
        "Connect evidence to a reversible response",
        "An alert should identify the impacted model, feature or segment, the window, sample count, threshold and a runbook. A drift breach may call for investigation; an explicit invalid-input or severe outcome gate may justify traffic fallback. Avoid training and publishing a new model automatically in response to an unreviewed alert. Validate the candidate against the release criteria and retain an identifiable rollback target.",
        "The synthetic fixture evaluates a three-window policy with a 100-request floor. Its second window breaches the rate but is ineligible due to low volume, so it resets consecutive eligible breach counting. A production team must define this behavior intentionally and test it. The arithmetic confirms a policy trace, not a live monitoring system or a cloud deployment."
      ]
    ],
    "code": "import numpy as np\nstreak=0\nfor errors,n in [(8,200),(2,20),(10,200),(9,200)]:\n eligible=n>=100\n streak=streak+1 if eligible and errors/n>.03 else 0\n print(streak,streak>=2)\nprint('burn',round(.03/.01,1))",
    "expect": "1 False\n0 False\n1 False\n2 True\nburn 3.0",
    "practice": [
      [
        "What does a sample floor protect against?",
        "Tiny-denominator instability",
        "Every delayed outcome",
        "All input schema mistakes",
        "Every data retention error",
        "Small counts can produce unstable rates that are poor evidence for an action."
      ],
      [
        "What is hysteresis used to reduce?",
        "Alert state flapping",
        "Number of model classes",
        "Training feature dimensions",
        "All monitoring delay",
        "Different entry and recovery conditions can prevent repeated on/off transitions."
      ],
      [
        "What makes an alert operationally actionable?",
        "Owner and response policy",
        "Only a bright chart color",
        "Only a larger dashboard font",
        "Only a model nickname",
        "A signal needs a responsible owner and an appropriate response path."
      ],
      [
        "An error count doubles while requests quadruple. What happens to error rate?",
        "It halves",
        "It doubles",
        "It quadruples",
        "It stays equal",
        "The numerator scales by two and denominator by four, so the rate falls by half."
      ],
      [
        "A 20-request window fails a 100-request floor. How should its rate be interpreted?",
        "Insufficient policy evidence",
        "A guaranteed clean window",
        "A confirmed full-scale outage",
        "A valid automatic retrain gate",
        "The rate may be visible but does not meet the stated sample requirement."
      ],
      [
        "A drift alert identifies an unknown category surge. What should its runbook include?",
        "Input lineage investigation",
        "Only optimizer reset",
        "Only new chart formatting",
        "Only a smaller font size",
        "Unknown categories can indicate a source or schema change requiring lineage inspection."
      ]
    ],
    "formal": [
      [
        "What is the denominator of a request error rate?",
        "Eligible requests",
        "All model parameters",
        "Only successful labels",
        "All historical customers",
        "The error count must be divided by comparable eligible request exposure."
      ],
      [
        "What does a consecutive-window rule introduce?",
        "Persistence requirement",
        "Automatic causal attribution",
        "Guaranteed zero false alarms",
        "No detection latency",
        "Requiring repeated breaches filters transients while potentially delaying detection."
      ],
      [
        "What should an SLO define explicitly?",
        "Target and interval",
        "Only the latest count",
        "Only model architecture",
        "Only the alert owner name",
        "A reliability objective needs a measurement definition, target and time interval."
      ],
      [
        "A service has 15 failures in 500 eligible requests. What is its error rate?",
        "3%",
        ".3%",
        "15%",
        "30%",
        "Fifteen divided by five hundred is .03, or three percent."
      ],
      [
        "A 99.5% availability target allows what bad fraction?",
        ".5%",
        "5%",
        ".05%",
        "99.5%",
        "The allowed bad share is one minus the availability target."
      ],
      [
        "A policy requires two eligible breaches. The trace is breach, low-volume, breach with low-volume resetting the streak. Has it triggered?",
        "No, streak is one",
        "Yes, streak is three",
        "Yes, streak is two",
        "No, all rates are zero",
        "The low-volume window resets the consecutive count under this explicitly declared policy."
      ],
      [
        "An SLO allows .2% errors; the current comparable error rate is 1%. What burn ratio follows?",
        "5",
        ".2",
        ".8",
        "50",
        "The current bad fraction divided by its allowed fraction is .01/.002=5."
      ],
      [
        "An alert opens above 5% and clears below 2%. At 3% after opening, which state follows hysteresis?",
        "Still open",
        "Always closed",
        "New model required",
        "Metric undefined",
        "The recovery condition has not been met, so the alert remains open."
      ],
      [
        "Two windows show 1/10 errors and 90/1000 errors. What is the combined request-weighted rate?",
        "91/1010",
        ".095",
        ".1",
        ".09",
        "Add the numerators and denominators rather than averaging unequal-exposure rates."
      ],
      [
        "A low-volume severe segment violates a hard safety contract, while a general drift policy requires 100 samples. Which design is coherent?",
        "Separate safety and drift gates",
        "Suppress every safety signal",
        "Automatically retrain all models",
        "Merge all segments permanently",
        "A hard contract can justify an independent response policy; a statistical sample floor should not redefine that contract."
      ]
    ],
    "steps": [
      "Calculate each window rate and sample eligibility.",
      "Update the declared consecutive-breach state.",
      "Check the trigger at the fourth window and compute the separate budget burn ratio."
    ],
    "mistakes": [
      "Do not average rates from unequal denominators without weighting.",
      "Do not let an alert silently become an automatic publication decision."
    ],
    "takeaways": [
      "Test alert policies as explicit state machines.",
      "Attach evidence, ownership and a reversible runbook."
    ],
    "lang": "python-pandas",
    "problem": "Design alert windows, sample floors and response gates on a synthetic local fixture.",
    "limit": "The printed result verifies only the declared synthetic in-memory computation. Native CPU execution uses the selected runtime; it does not establish image-dataset quality, production accuracy, device behavior or deployment readiness."
  },
  {
    "slug": "group-fairness",
    "title": "Compare group error rates with explicit denominators and uncertainty",
    "intro": "A hiring-screening team must examine whether qualified candidates from different groups are missed at different rates. Fairness assessment begins with a stated decision, affected groups, reliable labels and a defensible metric; one aggregate score cannot settle every policy question.",
    "sections": [
      [
        "Compute group metrics before naming a gap",
        "For each group, selection rate is positive decisions divided by all group members. True-positive rate is TP/(TP+FN); false-positive rate is FP/(FP+TN). A difference in selection rates is a demographic-parity gap. An equal-opportunity comparison examines true-positive rates among actual positives. Equalized-odds comparisons examine both true- and false-positive rates. These definitions answer different questions and need not agree.",
        "Record sample counts and outcome definitions with every rate. Small groups can yield highly variable estimates; zero observed errors in five examples does not prove a zero underlying error rate. Intersectional groups may expose failures hidden by broader averages. Access to protected-group attributes for auditing requires an approved purpose and appropriate privacy controls."
      ],
      [
        "Interpret tradeoffs within the application",
        "Different base rates and imperfect predictions can make several fairness criteria incompatible. Choosing a metric is a governance and application decision informed by technical evidence, not a universal formula. Historical labels may reflect existing unequal treatment; matching those labels is not automatically a fair outcome. Review whether the target measures the intended construct.",
        "The fixture calculates true-positive rates for two synthetic groups with the same number of actual positives. A .2 gap is a 20-percentage-point difference, not a 20% relative change. A business team should investigate labeling, feature coverage and intervention effects rather than hide a gap by excluding the group or changing the denominator. Nothing in the arithmetic establishes legal compliance."
      ]
    ],
    "code": "import numpy as np\na={'tp':80,'fn':20,'fp':10,'tn':90}\nb={'tp':60,'fn':40,'fp':10,'tn':90}\ntpr=lambda g:g['tp']/(g['tp']+g['fn'])\nprint(tpr(a),tpr(b))\nprint(round(tpr(a)-tpr(b),3))",
    "expect": "0.8 0.6\n0.2",
    "practice": [
      [
        "Which denominator defines a group's true-positive rate?",
        "Its actual positives",
        "Its predicted positives",
        "Its full model weight count",
        "Only its false-positive cases",
        "True-positive rate measures recovered positives among TP plus FN."
      ],
      [
        "Which metric compares overall selection rates across groups?",
        "Demographic parity",
        "Image intersection over union",
        "Feature standardization",
        "Optimizer convergence",
        "Demographic-parity comparisons concern the distribution of positive decisions across groups."
      ],
      [
        "Why report group sample counts alongside rates?",
        "Assess estimate stability",
        "Prove legal compliance",
        "Eliminate label ambiguity",
        "Guarantee causal fairness",
        "A rate based on few cases is more uncertain and needs its denominator exposed."
      ],
      [
        "Group A has TP=30,FN=20. What is its true-positive rate?",
        ".6",
        ".4",
        "1.5",
        ".667",
        "TPR is 30/(30+20), which equals .6."
      ],
      [
        "Two groups have .8 and .5 selection rates. What absolute gap applies?",
        "30 percentage points",
        "3 percentage points",
        "60 percentage points",
        ".3 percentage points",
        "The absolute difference .3 corresponds to thirty percentage points."
      ],
      [
        "A tiny group has no errors in four cases. Which statement is warranted?",
        "No observed errors",
        "Guaranteed zero future errors",
        "Proven equalized odds",
        "Verified absence of label bias",
        "Four observations describe this sample and do not establish the underlying population error rate."
      ]
    ],
    "formal": [
      [
        "Which fairness comparison specifically examines TPR across groups?",
        "Equal opportunity",
        "Demographic parity alone",
        "Overall score calibration",
        "Global input drift only",
        "Equal-opportunity comparisons examine recovery of actual positives across groups."
      ],
      [
        "Which quantities are compared for equalized odds?",
        "TPR and FPR",
        "Only selection count",
        "Only mean input value",
        "Only training sample size",
        "Equalized-odds analysis considers true-positive and false-positive rates conditionally on outcomes."
      ],
      [
        "What can undermine fairness evaluation even with correct arithmetic?",
        "Biased target labels",
        "A recorded denominator",
        "A versioned class mapping",
        "A declared cohort boundary",
        "Historical targets may encode unequal treatment or measure the wrong intended construct."
      ],
      [
        "A group has FP=12,TN=88. What false-positive rate follows?",
        ".12",
        ".88",
        ".136",
        ".012",
        "False-positive rate is 12/(12+88)=.12."
      ],
      [
        "Group A has TPR .9 and B .6. What is B's TPR relative to A?",
        "Two thirds",
        "One third",
        "1.5 times",
        ".3 times",
        "The ratio .6/.9 equals two thirds; the absolute gap is a separate quantity."
      ],
      [
        "A hiring model has equal selection rates but unequal TPR. Which conclusion is justified?",
        "Parity does not imply opportunity",
        "Every fairness measure matches",
        "Label quality is guaranteed",
        "Group data can be deleted now",
        "Selection parity and equal opportunity condition on different populations and can disagree."
      ],
      [
        "Group A has (TP,FN)=(45,5), B=(30,20). What TPR gap is observed?",
        ".3",
        ".15",
        ".6",
        ".9",
        "The rates are .9 and .6, giving an absolute difference of .3."
      ],
      [
        "Group A has 10 positives selected among 50 applicants; B has 30 among 100. What is A/B selection-rate ratio?",
        "2/3",
        "1/3",
        "3/2",
        "1/2",
        "The rates are .2 and .3, so their ratio is two thirds."
      ],
      [
        "Broad groups have similar error rates but one intersectional group has few samples and high misses. Which next plan is appropriate?",
        "Investigate with uncertainty",
        "Suppress its sparse result",
        "Declare complete group fairness",
        "Merge it solely to erase gaps",
        "The subgroup signal warrants investigation with sample limitations rather than hiding it in an aggregate."
      ],
      [
        "A policy requires TPR gap <=.05 and minimum 50 actual positives per group. A candidate has gap .03 but one group has 8 positives. Which release finding fits?",
        "Evidence gate not met",
        "Fairness is established",
        "Gap proves sample sufficiency",
        "All subgroup checks passed",
        "The metric gap meets its threshold but the prespecified evidence-size requirement remains unmet."
      ]
    ],
    "steps": [
      "Compute each group TPR using only its actual positives.",
      "Subtract the rates to obtain an absolute .2 gap.",
      "Distinguish percentage points from a relative-rate ratio."
    ],
    "mistakes": [
      "Do not claim one metric proves every kind of fairness.",
      "Do not omit small-group denominators from a fairness report."
    ],
    "takeaways": [
      "Name the fairness criterion and population.",
      "Inspect targets, subgroup coverage and uncertainty."
    ],
    "lang": "python-pandas",
    "problem": "Compare group error rates with explicit denominators and uncertainty on a synthetic local fixture.",
    "limit": "The printed result verifies only the declared synthetic in-memory computation. Native CPU execution uses the selected runtime; it does not establish image-dataset quality, production accuracy, device behavior or deployment readiness.",
    "comps": [
      "m2.c1"
    ]
  },
  {
    "slug": "explain-limits",
    "title": "Explain model scores without converting attribution into causation",
    "intro": "A reviewer asks why a synthetic risk model assigned a high score. An explanation must identify what is being explained: one local prediction, the global fitted function or observed predictive performance. An attribution describes a model under assumptions; it is not automatically a causal explanation of the world.",
    "sections": [
      [
        "Trace a transparent score",
        "For a linear score z=b+sum(wj*xj), a zero-baseline contribution is wj*xj. If a different baseline r is selected, contribution relative to that baseline is wj*(xj-rj), and the baseline score must also be included. Coefficient magnitudes are not directly comparable when feature scales differ. A probability obtained through a nonlinear link is not the same quantity as the additive raw score.",
        "A counterfactual model query changes an input and recomputes the prediction. That shows how the fitted function responds to the chosen perturbation, not what would happen if a person could actually change that attribute in a causal system. Correlated inputs and impossible feature combinations can make naive perturbations misleading. Never present an immutable attribute as a simple actionable recommendation."
      ],
      [
        "Global importance is evaluation-dependent",
        "Permutation importance measures score degradation after shuffling a feature under a specified dataset and metric. It evaluates the fitted model, not an intrinsic universal ranking of features. Correlated or redundant variables can substitute for each other, making individual importances small. Repeated permutations can reveal variability; use appropriate held-out data rather than mistaking training importance for generalization evidence.",
        "The fixture decomposes a linear raw score relative to a declared baseline and checks that baseline plus contributions reconstructs the result. A support workflow can show this bounded explanation to a reviewer while preserving the ability to challenge bad inputs. Store the explainer version, model version and baseline definition; changing them can change an explanation without changing the final score."
      ]
    ],
    "code": "import numpy as np\nw=np.array([2.,-1.]);x=np.array([3.,2.]);r=np.array([1.,1.]);b=.5\ncontrib=w*(x-r)\nbase=b+w@r\nprint(contrib.tolist())\nprint(float(base),float(base+contrib.sum()),float(b+w@x))",
    "expect": "[4.0, -1.0]\n1.5 4.5 4.5",
    "practice": [
      [
        "What must an additive attribution state?",
        "Quantity and baseline",
        "Only the user display name",
        "Only the training duration",
        "Only the model file size",
        "The interpretation depends on which output and reference the contributions explain."
      ],
      [
        "Does a feature attribution alone establish causal effect?",
        "No causal guarantee",
        "Yes for every fitted model",
        "Yes whenever it is positive",
        "Only for large coefficients",
        "An attribution describes a model calculation under assumptions rather than proving an intervention effect."
      ],
      [
        "What does permutation importance compare?",
        "Pre/post-shuffle metric",
        "Only model parameter lengths",
        "Only input file extensions",
        "Only subgroup name lengths",
        "It measures predictive score degradation when a feature's association is perturbed."
      ],
      [
        "A feature contribution is 2*(3-1). What value should the explanation show?",
        "4",
        "6",
        "2",
        "8",
        "Relative to baseline one, the feature changes by two and its weight is two."
      ],
      [
        "Two highly correlated features substitute for each other. What can happen to separate permutation importances?",
        "Each can appear small",
        "Each must equal causal effect",
        "Each must be exactly one",
        "Both become model labels",
        "The remaining correlated feature can preserve information when one feature is shuffled."
      ],
      [
        "A user asks to change an immutable trait to improve a score. What must the explanation avoid?",
        "False actionable advice",
        "A declared model version",
        "A stated raw-score baseline",
        "A request correction path",
        "A model perturbation is not necessarily a feasible or appropriate real-world action."
      ]
    ],
    "formal": [
      [
        "What is a linear raw-score contribution relative to baseline r?",
        "w times (x-r)",
        "w plus x plus r",
        "x divided by r only",
        "Probability times class id",
        "For a linear score, the change from its reference value decomposes into weighted feature differences."
      ],
      [
        "Why are coefficient magnitudes sensitive to feature units?",
        "Rescaling changes coefficients",
        "Units create causal proof",
        "Only labels have units",
        "Coefficients are probabilities",
        "Equivalent functions can have different coefficient magnitudes when input units are rescaled."
      ],
      [
        "What does a local explanation describe?",
        "A specific model prediction",
        "Every real-world causal pathway",
        "Universal subgroup fairness",
        "Guaranteed future accuracy",
        "A local explanation concerns the fitted model's behavior for a particular input."
      ],
      [
        "A score is .5+2*x1-x2 at x=(3,2). What raw score results?",
        "4.5",
        "6.5",
        "3.5",
        "1.5",
        "The raw affine score equals .5+2*3-2, which is 4.5."
      ],
      [
        "For that score and baseline (1,1), what baseline score is used?",
        "1.5",
        "4.5",
        ".5",
        "2.5",
        "At the reference input, .5+2*1-1=1.5."
      ],
      [
        "An explanation sums raw-logit contributions but labels them probability contributions. What is wrong?",
        "Output-scale mismatch",
        "Necessarily wrong tensor rank",
        "Missing batch normalization",
        "Too many target classes",
        "A nonlinear link does not preserve an additive decomposition on the probability scale."
      ],
      [
        "A model has baseline score 2 and contributions (3,-1,.5). What prediction is reconstructed?",
        "4.5",
        "2.5",
        "6.5",
        "3.5",
        "Add the baseline and all contributions: 2+3-1+.5=4.5."
      ],
      [
        "Held-out accuracy is .84 and falls to .76 when a feature is shuffled. What accuracy-based importance is observed?",
        ".08",
        ".76",
        ".84",
        "1.60",
        "The score decrease is .84-.76=.08 under this dataset, metric and permutation."
      ],
      [
        "A feature is strongly correlated with another and a shuffled row becomes physically impossible. Which interpretation should be qualified?",
        "Perturbation validity",
        "Whether files have names",
        "Whether weights are stored",
        "Whether labels are integers",
        "The explanation may rely on unrealistic inputs and should state that limitation."
      ],
      [
        "A reviewer needs reproducible explanations after an explainer update. Which bundle best preserves comparability?",
        "Model, baseline and explainer",
        "Only the final display score",
        "Only the largest contribution",
        "Only the latest plot image",
        "Attribution depends on the model, reference population and explanation procedure, all of which need lineage."
      ]
    ],
    "steps": [
      "Declare weights, observed features and reference features.",
      "Calculate each reference-relative raw-score contribution.",
      "Add the baseline score and compare with direct affine evaluation."
    ],
    "mistakes": [
      "Do not label raw-score contributions as probability contributions.",
      "Do not treat an input perturbation as a proven causal intervention."
    ],
    "takeaways": [
      "State the baseline, output scale and explainer version.",
      "Use held-out evaluation for model-importance claims."
    ],
    "lang": "python-pandas",
    "problem": "Explain model scores without converting attribution into causation on a synthetic local fixture.",
    "limit": "The printed result verifies only the declared synthetic in-memory computation. Native CPU execution uses the selected runtime; it does not establish image-dataset quality, production accuracy, device behavior or deployment readiness.",
    "comps": [
      "m2.c1"
    ]
  },
  {
    "slug": "model-cards",
    "title": "Document model intent, evaluation and release constraints",
    "intro": "A model card helps a reviewer understand what a model is intended to do, what evidence supports it and where use is constrained. It is a versioned technical document rather than a marketing score sheet or an automatic approval.",
    "sections": [
      [
        "A card should make a decision reviewable",
        "Identify the model and artifact version, owner, intended users, supported decisions and out-of-scope uses. Describe data lineage, group and time boundaries, preprocessing, output dictionary and limitations without exposing raw personal records. Record evaluation datasets, outcome definitions, metric formulas, thresholds, sample counts and relevant subgroup results. A metric without its population and operating point cannot support a reproducible release claim.",
        "A release gate is a declared constraint, for example recall at least .85, a group TPR gap at most .05 and p95 latency at most 100 ms. List separate constraints instead of inventing an unexplained average that allows a severe violation to be offset by another metric. Include human oversight, appeal or correction paths when the application requires them."
      ],
      [
        "Make lineage and review status explicit",
        "A card should identify known failure modes, monitoring responsibilities, label delay, rollback conditions and the approved fallback. Link immutable artifact and dataset identifiers, not mutable filenames alone. Keep human educational or governance approval separate from automatic arithmetic checks. A card needs updating when intended use or validated assumptions change, even if the weights remain unchanged.",
        "The fixture evaluates a synthetic candidate against three independent gates and prints the failing constraint. It demonstrates how documentation can be mechanically consistent with evidence without turning the document itself into an approval. For a credit-screening business, a stakeholder can then see precisely why an otherwise promising candidate remains held for review. The fixture does not assert a legal fairness standard or validate deployment infrastructure."
      ]
    ],
    "code": "candidate={'recall':.88,'tpr_gap':.08,'p95_ms':80}\ngates={'recall':candidate['recall']>=.85,'tpr_gap':candidate['tpr_gap']<=.05,'p95_ms':candidate['p95_ms']<=100}\nprint(sorted(k for k,v in gates.items() if not v))\nprint(all(gates.values()))",
    "expect": "['tpr_gap']\nFalse",
    "practice": [
      [
        "What should a model card name beyond a score?",
        "Intended use and limits",
        "Only the project nickname",
        "Only the largest tensor",
        "Only the training graph color",
        "A reviewer needs the supported use, evidence and constraints to interpret quality claims."
      ],
      [
        "Does an automatically generated card imply human approval?",
        "No, review remains separate",
        "Yes if the title is complete",
        "Yes if every metric is numeric",
        "Only if the file is JSON",
        "Documentation and automated checks do not replace an actual approval decision."
      ],
      [
        "What makes a metric entry reproducible?",
        "Population and protocol",
        "Only a rounded score",
        "Only model architecture",
        "Only total training hours",
        "A metric requires its data population, definition and evaluation conditions."
      ],
      [
        "A candidate meets latency and recall but violates a fairness gate. What result follows all-gates policy?",
        "Hold the candidate",
        "Average the metrics",
        "Ignore the failed gate",
        "Rename the fairness metric",
        "Independent mandatory constraints must all be satisfied."
      ],
      [
        "A mutable file named latest.model replaces an older file. What identifier improves lineage?",
        "Immutable artifact digest",
        "Only the filename",
        "Only a chart timestamp",
        "Only the project initials",
        "A content digest identifies exact artifact bytes even when filenames are reused."
      ],
      [
        "A release changes the supported population but keeps weights. What should happen to its card?",
        "Update use and evidence",
        "Keep all claims unchanged",
        "Remove every limitation",
        "Assume validation transfers",
        "Changing intended use changes the evidence and limitations that reviewers need."
      ],
      [
        "A card links sample counts but no IoU or threshold protocol. What should be added?",
        "Evaluation definition",
        "Only the training image names",
        "Only the author biography",
        "Only a new document filename",
        "A reproducible metric needs the actual protocol as well as its sample population."
      ],
      [
        "A human-review field is empty after automatic checks pass. What status should persist?",
        "Review pending",
        "Automatically approved",
        "Published to every user",
        "Legally certified",
        "Automated validation does not fill an absent human approval decision."
      ]
    ],
    "formal": [
      [
        "What is the purpose of an intended-use statement?",
        "Bound supported decisions",
        "Prove universal accuracy",
        "Eliminate monitoring needs",
        "Replace data lineage",
        "It states which decisions and populations the evidence is meant to support."
      ],
      [
        "Which metadata links a result to exact model bytes?",
        "Artifact content digest",
        "Only display title",
        "Only author initials",
        "Only source filename",
        "A digest identifies an immutable artifact rather than a potentially reused name."
      ],
      [
        "Why record out-of-scope uses?",
        "Expose evidence boundaries",
        "Guarantee zero misuse",
        "Reduce model input rank",
        "Replace error analysis",
        "Out-of-scope uses identify applications not supported by the recorded evidence."
      ],
      [
        "A release requires recall >=.9, gap <=.04 and latency <=80 ms. Results are .91,.05,70 ms. Which gate fails?",
        "Gap",
        "Recall",
        "Latency",
        "Every gate",
        "The group gap exceeds .04 even though recall and latency meet their thresholds."
      ],
      [
        "A card reports accuracy .95 without dataset or sample count. Which evidence is missing?",
        "Evaluation population",
        "Model display initials",
        "Chart color palette",
        "Editor font version",
        "The number alone cannot establish the population, protocol or uncertainty of the result."
      ],
      [
        "A model version changes from v2 to v3 but its card links only v2 test results. What should be resolved?",
        "Artifact-evidence linkage",
        "Only spelling of the title",
        "Only class label sorting",
        "Only training date format",
        "A new artifact requires evidence attributable to that version rather than silently inheriting old results."
      ],
      [
        "Three required gates are [true,false,true]. Under conjunction, what release result follows?",
        "False",
        "True",
        "Two thirds approved",
        "Unknown without averaging",
        "All required conditions must pass, so one failure makes the conjunction false."
      ],
      [
        "A card's p95 latency is 120 ms under a <=100 ms gate; median is 40 ms. Which finding is correct?",
        "Tail-latency gate fails",
        "Median overrides p95",
        "Latency requirement passes",
        "The metric is a fairness rate",
        "The declared tail constraint is violated even when median latency is low."
      ],
      [
        "A stakeholder broadens a model from adults to children without new validation. Which limitation matters most?",
        "Unsupported population change",
        "Unchanged artifact checksum",
        "Identical parameter count",
        "Same runtime language",
        "The old evidence may not support a new population even though the tensor artifact is unchanged."
      ],
      [
        "A reviewer must reproduce a subgroup claim months later while protecting personal data. Which package is appropriate?",
        "Versioned protocol and safe lineage",
        "Raw identities embedded in card",
        "Rounded score without counts",
        "Mutable latest-data link only",
        "Safe identifiers, protocol, sample counts and artifact linkage preserve reviewability without publishing raw identities."
      ]
    ],
    "steps": [
      "Define the candidate metric values and independent gate operators.",
      "Evaluate each constraint without averaging incompatible units.",
      "List failed gates and retain the candidate as unapproved."
    ],
    "mistakes": [
      "Do not equate documentation completeness with approval.",
      "Do not let a strong average override a mandatory failed constraint."
    ],
    "takeaways": [
      "Link evidence to exact model and dataset versions.",
      "Update intended use, limits and monitoring when assumptions change."
    ],
    "lang": "python-pandas",
    "problem": "Document model intent, evaluation and release constraints on a synthetic local fixture.",
    "limit": "The printed result verifies only the declared synthetic in-memory computation. Native CPU execution uses the selected runtime; it does not establish image-dataset quality, production accuracy, device behavior or deployment readiness.",
    "comps": [
      "m2.c2"
    ]
  },
  {
    "slug": "privacy-telemetry",
    "title": "Minimize personal data in model telemetry and explanations",
    "intro": "A support classifier needs latency, error and quality monitoring, but its raw requests can include names and private messages. Observability should collect enough information to diagnose behavior while avoiding unnecessary sensitive payloads.",
    "sections": [
      [
        "Choose the minimum diagnostic record",
        "Begin with a purpose for each field: model version identifies the function, a coarse outcome code identifies failure type, and a request-scoped opaque id can join controlled systems. Full prompts, authentication tokens and raw personal data should not appear in routine application logs. Redaction after an unrestricted log sink receives the payload is too late to prevent that sink from collecting it. Apply an allowlist at the telemetry boundary.",
        "Pseudonymization replaces direct identifiers with a substitute but can remain linkable through a mapping or other fields. Hashing a predictable email without a secret does not make it anonymous; dictionary guessing can recover common values. Aggregation can still expose small groups. Apply access control, purpose limits and suppression or broader grouping where needed. These techniques complement a privacy review rather than proving compliance."
      ],
      [
        "Preserve utility and avoid secondary leakage",
        "Track counts, rates and model lineage with a retention policy appropriate to their purpose. Keep a controlled sample collection separate from routine logs if deeper error analysis is authorized. Secure both the original store and copies such as exports, backups and debugging attachments. Explanation text may reproduce sensitive inputs, so apply the same output and storage review to explanations as to raw requests.",
        "The local fixture projects a synthetic event into an explicit field allowlist and confirms that a token and message are excluded. The correct result is a data-minimization test, not a cryptographic security claim. A service team can extend the allowlist review whenever a new diagnostic field is proposed and test that exception paths do not bypass it."
      ]
    ],
    "code": "event={'model':'v3','latency_ms':12,'status':'ok','token':'synthetic-secret','message':'synthetic personal text'}\nallowed={'model','latency_ms','status'}\nrecord={k:v for k,v in event.items() if k in allowed}\nprint(sorted(record))\nprint('token' in record,'message' in record)",
    "expect": "['latency_ms', 'model', 'status']\nFalse False",
    "practice": [
      [
        "What is data minimization for routine model logs?",
        "Collect purpose-needed fields",
        "Store every request forever",
        "Hash every payload and keep it",
        "Remove only the UI display",
        "Monitoring should retain only fields justified by its diagnostic purpose."
      ],
      [
        "A model audit uses substitute customer keys with a retained lookup table. What privacy limitation remains?",
        "No, linkage can remain",
        "Yes for all identifiers",
        "Yes if the value is text",
        "Only for small datasets",
        "A substitute identifier can still be linked through mappings or other information."
      ],
      [
        "Where should sensitive fields be excluded first?",
        "Telemetry collection boundary",
        "Only the final chart export",
        "Only a developer screenshot",
        "Only the browser display",
        "Excluding fields before collection prevents unnecessary propagation to log sinks."
      ],
      [
        "A debug exception dumps the full authorization header. What should be repaired?",
        "Exception-path logging",
        "Only the model threshold",
        "Only chart refresh timing",
        "Only class label spelling",
        "Failure paths must follow the same secret-exclusion policy as normal telemetry."
      ],
      [
        "A report shows an exact diagnosis count for a one-person group. What should be reviewed?",
        "Small-cell disclosure",
        "Only tensor precision",
        "Only output latency",
        "Only input image scale",
        "Even aggregate counts can reveal sensitive information in tiny groups."
      ],
      [
        "A team hashes predictable emails without a secret. Which risk remains?",
        "Dictionary reidentification",
        "Perfect permanent anonymity",
        "Automatic access revocation",
        "Guaranteed deletion of source",
        "Predictable identifiers can be guessed and hashed for comparison."
      ]
    ],
    "formal": [
      [
        "Which field is appropriate routine lineage without raw content?",
        "Model version",
        "Raw patient note",
        "Bearer token",
        "Full email address",
        "A model identifier supports attribution without requiring the original sensitive payload."
      ],
      [
        "What does an allowlist define for telemetry?",
        "Permitted fields",
        "Every possible hidden secret",
        "All future lawful purposes",
        "Permanent retention periods",
        "An allowlist limits collection to explicitly approved field names."
      ],
      [
        "Why review explanations for privacy?",
        "They may reveal inputs",
        "They always delete inputs",
        "They guarantee anonymity",
        "They contain no data",
        "An explanation can restate sensitive features or records and therefore needs its own data review."
      ],
      [
        "A record contains model, latency, token and raw text; its allowlist is model and latency. What remains?",
        "Model and latency",
        "Token and raw text",
        "Every field",
        "Only raw text",
        "Projection onto the allowlist excludes all unapproved payload fields."
      ],
      [
        "A team redacts a dashboard while keeping raw secrets in upstream logs. Which boundary failed?",
        "Collection minimization",
        "Only UI color contrast",
        "Only model output shape",
        "Only training batch order",
        "Removing a display field does not undo collection by the underlying log store."
      ],
      [
        "A hashed user id can be joined to a private mapping table. What is its privacy status best described as?",
        "Pseudonymous linkage",
        "Proven anonymous data",
        "Public nonpersonal text",
        "Irreversibly erased data",
        "The retained mapping means the substitute remains linkable to a person."
      ],
      [
        "An event has 8 fields and only 3 are allowlisted. How many fields should the projected event contain?",
        "3",
        "5",
        "8",
        "11",
        "An exact allowlist projection retains the three approved fields regardless of the discarded count."
      ],
      [
        "A report groups 100 users but a combination of region and rare condition identifies one person. What limitation remains?",
        "Linkage through quasi-identifiers",
        "All aggregation is anonymous",
        "Model weights disclose nothing",
        "Retention automatically ends",
        "Combined seemingly indirect attributes can single out a person despite a large overall population."
      ],
      [
        "An incident requires a controlled raw sample while routine logs stay minimal. Which plan preserves the stated boundary?",
        "Separate approved restricted sampling",
        "Dump all traffic into general logs",
        "Email raw samples to every analyst",
        "Disable every monitoring metric",
        "A bounded authorized collection with separate controls supports diagnosis without expanding routine payload collection."
      ],
      [
        "A service exports explanations and request logs to two analytics sinks, one lacking redaction. Which fix addresses propagation?",
        "Enforce shared pre-sink allowlist",
        "Hide only one dashboard column",
        "Rotate the model version name",
        "Increase the log sampling rate",
        "Filtering before fan-out prevents both destinations from receiving disallowed fields."
      ]
    ],
    "steps": [
      "Create a synthetic event with ordinary diagnostics and sensitive fields.",
      "Apply an explicit collection allowlist.",
      "Confirm only lineage, latency and status remain."
    ],
    "mistakes": [
      "Do not treat hashing as automatic anonymization.",
      "Do not redact only a dashboard while upstream stores retain raw secrets."
    ],
    "takeaways": [
      "Minimize at collection before log fan-out.",
      "Review error paths, explanations and small-group aggregates."
    ],
    "lang": "python-pandas",
    "problem": "Minimize personal data in model telemetry and explanations on a synthetic local fixture.",
    "limit": "The printed result verifies only the declared synthetic in-memory computation. Native CPU execution uses the selected runtime; it does not establish image-dataset quality, production accuracy, device behavior or deployment readiness."
  },
  {
    "slug": "governance-lifecycle",
    "title": "Enforce purpose, access and retention across the data lifecycle",
    "intro": "A model-quality team has a justified audit dataset, yet broad access and indefinite retention create risks beyond model accuracy. Governance translates a declared purpose into accountable access, retention, review and deletion behavior.",
    "sections": [
      [
        "Define accountable control points",
        "A data inventory records what is held, why it is needed, where it flows, who can access it and how long it is retained. Apply least privilege: an analyst needing aggregate rates does not automatically need raw identities. Separate model-development access, audit access and publication authority where the risk warrants it. Service credentials should be scoped and revocable; never place them inside a model card or exported sample.",
        "Retention has an explicit starting event and duration. Prediction logs, matured outcome joins and audit artifacts may need different schedules. Document approved exceptions such as a lawful hold without silently extending every record forever. Deletion needs to consider replicas, derived exports and backups according to their supported policy; removing a dashboard row does not prove every copy is erased."
      ],
      [
        "Make policy enforcement testable",
        "An authorization decision should evaluate the requested action and resource, not merely the fact that a user signed in. Record useful audit evidence without retaining the sensitive payload itself. Access changes, retention jobs and export requests should produce attributable events for review. Policy changes need versioning so investigators can reconstruct the controls in effect at the time.",
        "The fixture models a retention decision using synthetic ages and an explicit hold flag. Records at or beyond a 30-day boundary are eligible for deletion except those under the declared hold. This tests policy arithmetic only; it does not delete any real data or claim that backups are erased. A production runbook must distinguish eligibility, successful deletion and later verification across stores."
      ]
    ],
    "code": "rows=[{'id':'a','age':29,'hold':False},{'id':'b','age':30,'hold':False},{'id':'c','age':40,'hold':True}]\nprint([r['id'] for r in rows if r['age']>=30 and not r['hold']])\npermissions={'analyst':{'read_aggregate'},'auditor':{'read_audit'}}\nprint('read_raw' in permissions['analyst'])",
    "expect": "['b']\nFalse",
    "practice": [
      [
        "What does least privilege grant?",
        "Purpose-needed access",
        "Every authenticated action",
        "All historical exports",
        "Permanent administrator rights",
        "Access should be limited to the actions and resources required for the role's purpose."
      ],
      [
        "What must a retention duration be anchored to?",
        "A defined starting event",
        "Only a chart title",
        "Only model parameter count",
        "Only the current filename",
        "A duration is enforceable only with a clear event or timestamp from which it is measured."
      ],
      [
        "What does authentication alone establish?",
        "Identity evidence",
        "Permission for every resource",
        "Unlimited export approval",
        "Successful deletion of backups",
        "Identity and authorization are separate; a signed-in user still needs resource-specific permission."
      ],
      [
        "A 30-day policy expires at age >=30. A record is 30 days old with no hold. What status applies?",
        "Deletion eligible",
        "Retain forever",
        "Always under hold",
        "Already physically erased",
        "The boundary condition makes it eligible, but eligibility does not prove completed deletion."
      ],
      [
        "An analyst needs only monthly aggregate errors. What permission fits?",
        "Read aggregates",
        "Export raw identities",
        "Change production releases",
        "Manage every credential",
        "The role should receive the minimum access needed for its stated analytical purpose."
      ],
      [
        "A deletion job removes the primary row but an export survives. What is incomplete?",
        "Copy lifecycle handling",
        "Only the model threshold",
        "Only chart accessibility",
        "Only evaluation precision",
        "The data lifecycle includes exported copies, not just the primary database row."
      ]
    ],
    "formal": [
      [
        "What does a data inventory describe?",
        "Purpose, location and access",
        "Only model test accuracy",
        "Only neural layer widths",
        "Only the user-interface theme",
        "Governance requires knowing what data exists and how its collection and use are controlled."
      ],
      [
        "What must authorization evaluate?",
        "Action and resource",
        "Only successful sign-in",
        "Only screen resolution",
        "Only model confidence",
        "The requested operation on a specific resource needs its own permission decision."
      ],
      [
        "Why version governance policies?",
        "Reconstruct past controls",
        "Guarantee zero misuse",
        "Remove all audit evidence",
        "Replace credential rotation",
        "Policy lineage helps investigators establish which rules applied to a historical event."
      ],
      [
        "Records are aged 10,30,45 under an age>=30 policy and no holds. How many are eligible?",
        "2",
        "1",
        "3",
        "0",
        "The records aged thirty and forty-five meet the inclusive expiration boundary."
      ],
      [
        "An authenticated analyst requests raw audit identities but has aggregate-only access. What should happen?",
        "Deny raw access",
        "Allow after sign-in",
        "Allow if model is accurate",
        "Allow for every download",
        "Authentication does not supply the missing resource permission."
      ],
      [
        "A retention report says eligible=200,deleted=150. Which claim is supported?",
        "50 remain unconfirmed",
        "All 200 are erased",
        "No record was eligible",
        "Deletion is impossible",
        "Eligibility and completed deletion are distinct states, leaving fifty without a confirmed deletion in this report."
      ],
      [
        "Three expired records have hold flags [false,true,false]. How many pass age-plus-no-hold eligibility?",
        "2",
        "1",
        "3",
        "0",
        "The declared hold exception excludes exactly the middle record from deletion eligibility."
      ],
      [
        "A revoked export credential still works in a cached job. Which control needs investigation?",
        "Revocation propagation",
        "Only model fairness",
        "Only image interpolation",
        "Only training loss scale",
        "Effective access revocation must reach the execution path that continues to use the credential."
      ],
      [
        "An audit log stores actor, action, model version and entire sensitive request body. Which refinement preserves useful accountability?",
        "Keep metadata, drop payload",
        "Drop actor, keep raw body",
        "Publish the entire audit log",
        "Retain every credential too",
        "Actionable audit metadata can support accountability without collecting unnecessary sensitive payload content."
      ],
      [
        "A team must implement a new 30-day rule across primary data, exports and delayed backup expiry. Which plan is reviewable?",
        "Inventory and verify store outcomes",
        "Delete UI rows and claim completion",
        "Ignore copies outside the database",
        "Extend every store indefinitely",
        "A store-aware inventory and verification record distinguish immediate deletion from policy-governed backup expiry."
      ]
    ],
    "steps": [
      "Evaluate ages against an explicit inclusive retention boundary.",
      "Apply the declared hold exception.",
      "Check that aggregate-only permissions exclude raw-record reading."
    ],
    "mistakes": [
      "Do not equate deletion eligibility with verified deletion.",
      "Do not treat sign-in as permission to export every dataset."
    ],
    "takeaways": [
      "Track purpose, access and lifecycle for every copy.",
      "Version policy and distinguish each enforcement outcome."
    ],
    "lang": "python-pandas",
    "problem": "Enforce purpose, access and retention across the data lifecycle on a synthetic local fixture.",
    "limit": "The printed result verifies only the declared synthetic in-memory computation. Native CPU execution uses the selected runtime; it does not establish image-dataset quality, production accuracy, device behavior or deployment readiness."
  },
  {
    "slug": "response-audit",
    "title": "Respond to model incidents with controlled fallback and preserved evidence",
    "intro": "A classifier begins failing a required input contract after an upstream release. A responsible response protects the affected workflow, preserves diagnostic evidence and restores service through a known validated path. Retraining is only one possible later remedy.",
    "sections": [
      [
        "Separate detection, mitigation and repair",
        "An incident begins with evidence about a breached contract or harmful outcome. Triage its scope by model version, affected population and time. Mitigation reduces ongoing harm, for example by routing to a validated fallback or a human queue. Repair addresses the root cause and needs fresh evidence before the candidate returns to normal traffic. A rollback changes which artifact serves traffic; it does not erase decisions already made.",
        "Fallback behavior has capacity and privacy limits. A human queue that can process fifty cases per hour cannot safely absorb five hundred without an escalation plan. A previous model may not accept a new input schema, so a rollback target must be compatible with the current feature contract. Preserve request lineage and decisions without dumping sensitive payloads into unrestricted incident channels."
      ],
      [
        "Require recovery evidence and an accountable record",
        "Document trigger, timeline, affected versions, action owner, mitigations and unresolved uncertainty. Keep useful metrics and immutable artifact identifiers for later review. Verify the repair on the failed case and relevant regression cohorts; compare outcome and subgroup gates once labels are mature enough. Require the declared release review rather than treating the absence of a fresh alert as proof of recovery.",
        "The fixture traces an incident state machine: normal to fallback on a contract failure, then review after a verified repair, and normal only after approval. It does not contact an external provider or operate a live service. A business team can test this state logic before an incident and rehearse capacity-aware response; the audit record should state what evidence exists and what remains pending."
      ]
    ],
    "code": "state='normal'\nfor event in ['contract_fail','repair_verified','approved']:\n if state=='normal' and event=='contract_fail':state='fallback'\n elif state=='fallback' and event=='repair_verified':state='review'\n elif state=='review' and event=='approved':state='normal'\n print(state)",
    "expect": "fallback\nreview\nnormal",
    "practice": [
      [
        "What is mitigation during a model incident?",
        "Reduce ongoing harm",
        "Prove the root cause",
        "Erase all past decisions",
        "Publish every new model",
        "Mitigation limits current impact while diagnosis and repair may still be incomplete."
      ],
      [
        "What must a rollback target satisfy?",
        "Current input compatibility",
        "Only an older timestamp",
        "Only a smaller file size",
        "Only a familiar model name",
        "An old artifact is useful only if it accepts the serving contract and meets fallback requirements."
      ],
      [
        "What does an incident timeline preserve?",
        "Actions and evidence sequence",
        "Only the latest score chart",
        "Only model parameter count",
        "Only the final status label",
        "A timeline enables review of what happened, what was observed and which actions followed."
      ],
      [
        "A fallback queue receives 120/hour but handles 50/hour. How fast does backlog grow?",
        "70/hour",
        "50/hour",
        "120/hour",
        "170/hour",
        "The queue gains 120 arrivals minus fifty completions each hour."
      ],
      [
        "A repair passes its failing fixture but release approval remains pending. Which state fits the stated policy?",
        "Review",
        "Normal serving immediately",
        "Evidence deleted",
        "Permanent training loop",
        "Passing a repair check is distinct from completing the required release review."
      ],
      [
        "A rollback succeeds. What remains true of previous decisions?",
        "They still need traceability",
        "They are automatically undone",
        "They become correct by default",
        "They no longer need lineage",
        "Changing the active model cannot erase or correct decisions already taken."
      ]
    ],
    "formal": [
      [
        "What should incident evidence identify?",
        "Affected model and interval",
        "Only a dashboard color",
        "Only current CPU brand",
        "Only training sample order",
        "Version and time scope are needed to connect the signal to affected decisions."
      ],
      [
        "What is the goal of a verified repair?",
        "Address the failure cause",
        "Hide an alert permanently",
        "Erase governance history",
        "Replace every labeled dataset",
        "A repair needs evidence that the identified failure has been corrected."
      ],
      [
        "Does absence of new alerts alone establish recovery?",
        "No, checks are required",
        "Yes for every incident",
        "Yes if weights changed",
        "Only if traffic is low",
        "An alert may be silent because traffic or monitoring changed, so recovery needs explicit evidence."
      ],
      [
        "A validated fallback handles 80/hour while current inflow is 100/hour. What backlog increase occurs in three hours?",
        "60",
        "20",
        "180",
        "300",
        "The net arrival rate is twenty per hour, producing sixty queued cases after three hours."
      ],
      [
        "An upstream schema renames and rescales a feature; the rollback artifact expects the old schema. What is required before switching?",
        "Compatibility restoration",
        "Only an older model file",
        "Only a lower alert threshold",
        "Only new status wording",
        "Routing to an incompatible model can reproduce or worsen the incident."
      ],
      [
        "A repair_verified event occurs in fallback, but no approved event follows. What state should persist?",
        "Review",
        "Normal",
        "Training",
        "Unknown model bytes",
        "The declared state machine waits in review until the approval transition occurs."
      ],
      [
        "An incident affects 2% of 50000 requests. How many decisions need scoped review?",
        "1000",
        "100",
        "2500",
        "10000",
        "Multiplying .02 by fifty thousand gives one thousand potentially affected requests."
      ],
      [
        "The last good artifact is v4 and candidate v5 fails a gate. The system routes back to v4. What must the audit link capture?",
        "v5 impact and v4 activation",
        "Only the candidate filename",
        "Only the best training score",
        "Only the new dashboard title",
        "The record must preserve both affected and mitigating artifact lineage."
      ],
      [
        "A model incident stops producing labels after a feed outage, so measured error count becomes zero. Which conclusion is correct?",
        "Quality evidence is missing",
        "Quality is now perfect",
        "The model repaired itself",
        "No incident can remain open",
        "A broken outcome feed suppresses observations and cannot prove that underlying errors ended."
      ],
      [
        "A fix passes schema checks but pending labels prevent validating a required outcome gate. Which response respects the evidence boundary?",
        "Await outcome evidence",
        "Declare every outcome gate passed",
        "Delete pending cases from metrics",
        "Publish based only on schema parity",
        "Passing one class of checks does not establish outcome quality while the required evidence is unavailable."
      ]
    ],
    "steps": [
      "Start in normal operation with a declared transition table.",
      "Move to fallback on a contract breach and to review after repair verification.",
      "Return to normal only on the explicit approval event."
    ],
    "mistakes": [
      "Do not assume rollback reverses earlier decisions.",
      "Do not equate missing labels or silent alerts with repaired outcomes."
    ],
    "takeaways": [
      "Make fallback capacity and compatibility explicit.",
      "Preserve evidence and satisfy recovery gates before restoring traffic."
    ],
    "lang": "python-pandas",
    "problem": "Respond to model incidents with controlled fallback and preserved evidence on a synthetic local fixture.",
    "limit": "The printed result verifies only the declared synthetic in-memory computation. Native CPU execution uses the selected runtime; it does not establish image-dataset quality, production accuracy, device behavior or deployment readiness."
  }
],[
  {
    "id": "ram-metrics",
    "title": "scikit-learn classification metrics and confusion definitions",
    "url": "https://github.com/scikit-learn/scikit-learn/blob/646da0f072a8afef6a980aa427a710311e67eb9d/sklearn/metrics/_classification.py",
    "source": {
      "repo": "scikit-learn/scikit-learn",
      "commit": "646da0f072a8afef6a980aa427a710311e67eb9d",
      "path": "sklearn/metrics/_classification.py",
      "verification": "Exact pinned official source read. Local synthetic arithmetic and policy traces verify the declared calculations; governance examples are instructional policies, not legal compliance claims. Human review pending."
    }
  },
  {
    "id": "ram-importance",
    "title": "scikit-learn permutation importance API and limitations",
    "url": "https://github.com/scikit-learn/scikit-learn/blob/646da0f072a8afef6a980aa427a710311e67eb9d/sklearn/inspection/_permutation_importance.py",
    "source": {
      "repo": "scikit-learn/scikit-learn",
      "commit": "646da0f072a8afef6a980aa427a710311e67eb9d",
      "path": "sklearn/inspection/_permutation_importance.py",
      "verification": "Exact pinned official source read. Local synthetic arithmetic and policy traces verify the declared calculations; governance examples are instructional policies, not legal compliance claims. Human review pending."
    }
  },
  {
    "id": "ram-logs",
    "title": "OWASP logging: sensitive fields, access and retention",
    "url": "https://github.com/OWASP/CheatSheetSeries/blob/121e76561a58a28790fd7fa927236eec8d63ea59/cheatsheets/Logging_Cheat_Sheet.md",
    "source": {
      "repo": "OWASP/CheatSheetSeries",
      "commit": "121e76561a58a28790fd7fa927236eec8d63ea59",
      "path": "cheatsheets/Logging_Cheat_Sheet.md",
      "verification": "Exact pinned official source read. Local synthetic arithmetic and policy traces verify the declared calculations; governance examples are instructional policies, not legal compliance claims. Human review pending."
    }
  }
]);
