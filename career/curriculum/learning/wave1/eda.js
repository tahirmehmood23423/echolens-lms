'use strict';
const {course}=require('./data-wave2-helper');
const specs=[
  {
    "id": "eda-profile",
    "comps": [
      "m1.c1"
    ],
    "title": "Build a first-pass profile of values and missingness",
    "intro": "Exploration begins by learning what the supplied dataset actually contains. A profile combines structure, value distributions and missingness so later questions do not rest on untested assumptions.",
    "sections": [
      [
        "Start with the dataset’s identity and structure",
        "Record the source snapshot, extraction window, row grain and expected population. Inspect shape, dtypes, distinct keys and a small authorized sample before computing business summaries. These observations can reveal a wrong file, stale period, unexpected duplication or a representation mismatch.",
        "For each important field, inspect nonmissing counts, numeric quantiles/range or category frequencies as appropriate. A describe output is a starting point, not an automatic quality certificate. Numeric ids, monetary values and duration measurements need different interpretation even when their dtypes are similar."
      ],
      [
        "Profile missingness as part of the evidence",
        "Count missing values by field and relevant segment, and examine combinations of missingness when they could indicate source-specific failures. Empty strings and source sentinels may need interpretation before isna identifies them as unavailable. Keep unknown values distinct from measured zeros.",
        "The fixture profiles a synthetic order amount and region field, reporting support rather than just a polished average. It does not decide how to repair unknowns or claim that the observed rows represent every order in the target population."
      ]
    ],
    "problem": "Produce a compact profile that exposes an amount tail and a missing region.",
    "steps": [
      "Record row/column shape.",
      "Compute observed support and selected quantiles.",
      "Include missing categories in frequency counts."
    ],
    "code": "import pandas as pd\ndf=pd.DataFrame({\"amount\":[2.,4.,6.,100.],\"region\":[\"n\",\"n\",None,\"s\"]})\nprint(df.shape)\nprint(int(df[\"amount\"].count()),df[\"amount\"].median(),df[\"amount\"].max())\nprint(int(df[\"region\"].isna().sum()),int(df[\"region\"].value_counts(dropna=False).sum()))",
    "expect": "(4, 2)\n4 5.0 100.0\n1 4",
    "limit": "The profile describes four fixture records. It does not identify whether the large amount is erroneous or whether unrecorded real orders exist.",
    "mistakes": [
      "A summary table cannot replace source and grain understanding.",
      "Default category counts can conceal missing categories if the option is not chosen deliberately."
    ],
    "takeaways": [
      "Profile structure, support and distributions together.",
      "Treat exploration as evidence gathering rather than automatic cleaning."
    ],
    "practice": [
      [
        "What should be established before interpreting row counts?",
        "Row grain",
        "Only the chart color",
        "Only the largest value",
        "Only the export extension",
        "A count means different things for line items, orders or daily aggregates, so the row’s identity must be known."
      ],
      [
        "Which category-count option exposes missing values as a category?",
        "dropna=False",
        "dropna=True",
        "ignore_index=True",
        "deep=False",
        "value_counts(dropna=False) includes missing observations in the frequency output."
      ],
      [
        "Does describe prove a dataset is correct?",
        "No",
        "Yes automatically",
        "Only if every value is numeric",
        "Only for small files",
        "Descriptive output summarizes observed data but cannot validate all source semantics, omissions or factual accuracy."
      ],
      [
        "A profile has a median amount of five and a maximum of one hundred. What is a useful next step?",
        "Investigate context",
        "Delete the maximum automatically",
        "Declare every order fraudulent",
        "Replace the median with the maximum",
        "A tail observation should be interpreted through source/domain context before treatment."
      ],
      [
        "One region has substantially more missing amounts. What should exploration record?",
        "Segment missingness",
        "Only the overall mean",
        "Only the largest region",
        "Only package memory",
        "Missingness patterns can expose coverage or instrumentation differences relevant to later comparisons."
      ],
      [
        "A numeric customer id appears in a correlation table. What needs review?",
        "Measurement meaning",
        "Only its numeric dtype",
        "Only the table size",
        "Only the column position",
        "Identifier encoding is not automatically a quantitative measure suitable for correlation."
      ],
      [
        "The expected month has twice as many records as the loaded snapshot. What should be checked?",
        "Source coverage",
        "Only more decimal places",
        "Only a new chart title",
        "Only the sample median",
        "A wrong window, partial extract or missing source can explain count discrepancies before analysis proceeds."
      ]
    ],
    "formal": [
      [
        "What is the purpose of first-pass profiling?",
        "Understand observed structure and coverage",
        "Prove every causal explanation",
        "Publish final conclusions immediately",
        "Choose the most favorable metric",
        "Profiling establishes what data is available and which assumptions need investigation."
      ],
      [
        "Which summary suits a categorical region field?",
        "Frequency counts with missingness",
        "An average of arbitrary codes",
        "A squared category total",
        "Only numerical variance",
        "Category frequencies describe observed membership without inventing numeric distances."
      ],
      [
        "What should a profile identify about its input?",
        "Input scope",
        "Plot style",
        "Only the output font",
        "Only the longest column name",
        "A profile needs a traceable dataset and target/window context to be interpreted or reproduced."
      ],
      [
        "An inventory table has many rows but only a few unique product ids. What might need checking?",
        "Row grain",
        "A trend",
        "Only the CSV delimiter",
        "Only product-name spelling",
        "Repeated ids may be legitimate history or unintended duplication depending on what one row represents."
      ],
      [
        "A data scientist sees zero isna results but source uses \"unknown\" strings. What is missed?",
        "Missing markers",
        "Zeros",
        "The numeric count formula",
        "The ability to load strings",
        "Missingness profiling must interpret source sentinels rather than assume all unavailable values use native nulls."
      ],
      [
        "A profile reports only a mean for a highly variable duration. What should be added?",
        "Spread and tails",
        "A mean",
        "Only the minimum id",
        "Only chart spacing",
        "A center alone hides consistency and rare but important delays."
      ],
      [
        "A default value_counts table omits unknown categories. What can be understated?",
        "Coverage gaps",
        "Memory",
        "The dtype memory",
        "The maximum numeric value",
        "Missing category observations can disappear from a summary unless explicitly included and reported."
      ],
      [
        "A new extract has the right columns but a different time window. What should prevent comparison as identical?",
        "Scope checks",
        "Names",
        "Only identical column count",
        "Only a shared filename prefix",
        "Schema similarity does not establish matching population/time scope."
      ],
      [
        "A profiling script samples real private text into a public report. What needs control?",
        "Disclosure control",
        "Only report length",
        "Only chart colors",
        "Only output resolution",
        "Exploration should use necessary authorized detail and avoid exposing sensitive source records."
      ],
      [
        "A profile finds an extreme valid loss event. What should exploration preserve?",
        "Event context",
        "Trimming",
        "Only a trimmed average",
        "A claim it cannot be real",
        "Rare valid events may be central to the analytical question and should not be erased automatically."
      ]
    ]
  },
  {
    "id": "eda-expect",
    "comps": [
      "m1.c2"
    ],
    "title": "Check expectations against source and domain contracts",
    "intro": "A profile becomes useful when compared with expectations. A daily order extract expected to contain one row per order should be checked against that claim, not merely inspected for plausible-looking values.",
    "sections": [
      [
        "Turn expectations into questions and tests",
        "Distinguish a hard domain constraint from a hypothesis about ordinary behavior. Unique order ids may be contractual, while an expected seasonal sales range is a pattern to investigate. A deviation from a forecast is not automatically invalid data.",
        "Check required fields, supported states, plausible units, event ordering and known reconciliation totals. Verify expectations with data owners when sources change. An apparent anomaly can reflect a new business process, a schema migration or a different extraction scope."
      ],
      [
        "Document discrepancies without premature repairs",
        "For each discrepancy, state what was expected, what was observed, how many records were affected and why it matters. Preserve the raw snapshot and route unresolved issues to the appropriate owner. Do not silently modify records until they fit a preconceived narrative.",
        "The fixture checks an order-grain assumption and supported states, then returns reason categories. It demonstrates a source-contract investigation, not a broad production data-quality certification or an automated repair policy."
      ]
    ],
    "problem": "Compare an order extract against two explicit expectations.",
    "steps": [
      "State unique-order and status-vocabulary requirements.",
      "Count the rows violating each condition.",
      "Keep findings distinct from any proposed correction."
    ],
    "code": "import pandas as pd\ndf=pd.DataFrame({\"order\":[\"a\",\"a\",\"b\"],\"status\":[\"paid\",\"paid\",\"mystery\"]})\nfindings={\"repeated_order_rows\":int(df[\"order\"].duplicated(keep=False).sum()),\"unknown_status_rows\":int((~df[\"status\"].isin([\"paid\",\"canceled\"])).sum())}\nprint(findings)",
    "expect": "{'repeated_order_rows': 2, 'unknown_status_rows': 1}",
    "limit": "These findings establish only the stated fixture discrepancies. Repeated ids may be valid under a different grain, so the source contract must be confirmed.",
    "mistakes": [
      "An unexpected value is not automatically a known error.",
      "Changing records to match an expected trend can hide real operational changes."
    ],
    "takeaways": [
      "Separate contractual checks from exploratory hypotheses.",
      "Record observed discrepancies and their scope."
    ],
    "practice": [
      [
        "What makes an expectation check meaningful?",
        "A justified contract",
        "Only a preferred trend",
        "Only a chart template",
        "Only a smaller file",
        "The expected property must come from the intended source or business meaning, not arbitrary appearance."
      ],
      [
        "Is a forecast miss automatically invalid data?",
        "No",
        "Yes universally",
        "Only if large",
        "Only if negative",
        "A forecast is uncertain and a real process change can produce unexpected but valid outcomes."
      ],
      [
        "What should a discrepancy record contain?",
        "Expected versus observed",
        "Only a red icon",
        "Only the analyst’s initials",
        "Only a new title",
        "A useful finding specifies the expectation, observation, affected records and analytical consequence."
      ],
      [
        "A one-row-per-order file repeats an id. What should be clarified?",
        "The grain contract",
        "Only the row sort",
        "Only the amount’s font",
        "Only the chart legend",
        "Repeated identity conflicts with that grain unless the source actually contains versions, lines or other dimensions."
      ],
      [
        "A previously unknown status appears after a product release. What is appropriate?",
        "Consult the owner",
        "Force it to paid",
        "Delete it immediately",
        "Assume source fraud",
        "A new legitimate state may require a contract update; its meaning should not be guessed."
      ],
      [
        "An analyst edits unexpected sales to match last year. What is compromised?",
        "Evidence integrity",
        "Only performance speed",
        "Only type inference",
        "Only file encoding",
        "Observed deviations may be real and should be investigated rather than rewritten to a desired trend."
      ],
      [
        "A known reconciliation total differs from the extract. What should be examined?",
        "Scope and timing",
        "Only a new output name",
        "Only decimal formatting",
        "Only the maximum value",
        "Reconciliation differences can arise from definitions, cutoffs, missing data or duplication and need source-level explanation."
      ]
    ],
    "formal": [
      [
        "Which is a hard contract example?",
        "Unique grain keys",
        "Rising sales",
        "No customer may be unusual",
        "Every month must look identical",
        "Uniqueness can be an explicit source relationship; business trends are not universal validity constraints."
      ],
      [
        "What does a discrepancy prove directly?",
        "An expectation mismatch",
        "Source fraud",
        "The expected rule is always correct",
        "The analyst knows the repair",
        "The mismatch needs interpretation; either source, scope or expectation may need revision."
      ],
      [
        "Who can help clarify changed source semantics?",
        "The source owner",
        "A customer",
        "Only the biggest customer",
        "A random report reader",
        "Source stewards and domain owners can explain collection and business-state changes."
      ],
      [
        "A retailer’s sudden volume rise is real after a new branch opens. What would blind anomaly deletion do?",
        "Erase valid changes",
        "Better truth",
        "Improve source completeness",
        "Preserve every business event",
        "Unexpected does not mean erroneous; deletion could erase the phenomenon being analyzed."
      ],
      [
        "A test assumes nonnegative balances in an account ledger. What must be verified?",
        "Negative-value semantics",
        "Only whether dtype is numeric",
        "Only the file size",
        "Only date sorting",
        "An invalid domain assumption can falsely reject legitimate debt or adjustment balances."
      ],
      [
        "A source extract excludes canceled orders while a reconciliation total includes them. What differs?",
        "Population scope",
        "Rounding",
        "Only report color",
        "Only customer naming",
        "Different inclusion rules can produce legitimate total differences that require aligned definitions."
      ],
      [
        "A date-order check fails after timezone conversion. What should be inspected?",
        "Time interpretation",
        "Only row position",
        "Only chart dimensions",
        "Only the number of imports",
        "Clock/timezone interpretation can create apparent order violations without a real reversed event sequence."
      ],
      [
        "A reviewer sees a duplicate count but no key definition. What is missing?",
        "Identity definition",
        "Only a bar chart",
        "Only the source file icon",
        "Only output line spacing",
        "A duplicate finding is meaningful only relative to the columns and logical identity being tested."
      ],
      [
        "A contract check is removed merely because it fails. What is lost?",
        "An investigation signal",
        "Only extra logging noise",
        "Only a formatting step",
        "A guaranteed false alarm",
        "Suppressing a safeguard does not resolve the underlying relationship or definition mismatch."
      ],
      [
        "An expectation is based on last year’s data but the product changed. What should be revisited?",
        "Expectation applicability",
        "Only the result’s decimal count",
        "Only source filename length",
        "Only chart ordering",
        "Historical patterns may no longer describe a changed business process or collection design."
      ]
    ]
  },
  {
    "id": "eda-relate",
    "comps": [
      "m1.c1",
      "m1.c2"
    ],
    "title": "Explore relationships with paired support and suitable summaries",
    "intro": "A customer team wants to know whether usage and spending move together. Relationship exploration must match the variable types, the pairing identity and the records with jointly observed values.",
    "sections": [
      [
        "Choose a relationship summary from the measurement scale",
        "A scatterplot and Pearson correlation can describe linear relationships between quantitative variables. Correlation near zero does not rule out a strong nonlinear pattern. For categories, cross-tabulated counts or conditional proportions may be more appropriate than arbitrary numerical encodings.",
        "Check which records contribute to each calculation. Pairwise missing-value exclusion can mean different correlations use different subsets. Display the paired count and inspect whether missingness or segmentation changes the relationship. A strong coefficient from a few selected records should not be treated as a stable population law."
      ],
      [
        "Inspect assumptions and alternative patterns",
        "Relationship summaries can be driven by outliers, shared time trends, repeated entities or group mixtures. Compare raw plots, segment summaries and domain expectations before concluding that the relationship is useful for prediction or suggests a causal study.",
        "The fixture calculates a correlation only after identifying complete pairs and reports the count. It verifies a tiny linear example, not causality, generalization or the adequacy of a linear model for real customers."
      ]
    ],
    "problem": "Report paired support alongside a simple quantitative relationship.",
    "steps": [
      "Select two quantitative fields with explicit row pairing.",
      "Retain rows observed on both fields for the calculation.",
      "Report the paired count and the computed correlation."
    ],
    "code": "import pandas as pd\ndf=pd.DataFrame({\"usage\":[1.,2.,3.,None],\"spend\":[2.,4.,6.,100.]})\npairs=df[[\"usage\",\"spend\"]].dropna()\nprint(len(pairs))\nprint(round(pairs[\"usage\"].corr(pairs[\"spend\"]),6))",
    "expect": "3\n1.0",
    "limit": "Three complete fixture pairs lie exactly on a line. This does not establish a causal effect, stable prediction or representativeness of missing cases.",
    "mistakes": [
      "A zero linear correlation can coexist with nonlinear dependence.",
      "Correlation tables may hide different pairwise denominators."
    ],
    "takeaways": [
      "Match variable types and paired identities.",
      "Report support and investigate shape, groups and missingness."
    ],
    "practice": [
      [
        "What does Pearson correlation primarily summarize?",
        "Linear association",
        "Every possible dependence",
        "A causal intervention",
        "A category identity",
        "Pearson correlation measures standardized linear co-movement and can miss nonlinear patterns."
      ],
      [
        "What count should accompany a pairwise correlation?",
        "Jointly observed pairs",
        "Only total file rows",
        "Only column count",
        "Only unique filenames",
        "The calculation may use only records observed on both variables."
      ],
      [
        "Is numerical encoding alone enough to make categories quantitative?",
        "No",
        "Yes universally",
        "Only with many rows",
        "Only if codes are sorted",
        "Arbitrary category codes do not define meaningful magnitude or distance for correlation."
      ],
      [
        "A correlation uses only three complete customer pairs. What should be acknowledged?",
        "Limited paired evidence",
        "A guaranteed population law",
        "Perfect causal certainty",
        "Universal predictive accuracy",
        "A small selected subset can produce unstable or unrepresentative relationship estimates."
      ],
      [
        "A U-shaped pattern has near-zero Pearson correlation. What is still possible?",
        "Strong nonlinear dependence",
        "No relationship of any kind",
        "Identical variables",
        "A guaranteed parse failure",
        "Linear correlation can cancel across a symmetric nonlinear pattern."
      ],
      [
        "One extreme customer changes the coefficient sharply. What should be explored?",
        "Outlier influence",
        "Only another rounding",
        "Only the chart title",
        "Only file size",
        "A relationship driven by one case needs domain and robustness investigation rather than an unqualified headline."
      ],
      [
        "Two series rise over calendar time and correlate. What alternative should be examined?",
        "A shared trend",
        "Only a direct causal link",
        "Automatic independence",
        "A missing numeric type",
        "Common trends can generate association without one series causing the other."
      ]
    ],
    "formal": [
      [
        "Which pairing is suitable for a quantitative relationship?",
        "Correctly paired units",
        "Equal counts",
        "Randomly reordered values",
        "Only matching column names",
        "Relationship calculations need meaningful paired observations rather than accidental positional pairing."
      ],
      [
        "What can a cross-tabulation summarize?",
        "Category co-occurrence",
        "Only continuous derivatives",
        "An automatic causal model",
        "A source hash",
        "Cross-tabs describe how categorical variables co-occur across observed records."
      ],
      [
        "Does a correlation of one prove a causal effect?",
        "No",
        "Yes by definition",
        "Only for positive values",
        "Only if exact to six decimals",
        "Perfect observed linear association does not identify intervention effects or eliminate confounding."
      ],
      [
        "A dataset pairs customer usage with another customer’s spending after a bad sort. What failed?",
        "Pairing identity",
        "Precision",
        "Only chart label spacing",
        "Only the mean formula",
        "The relationship is meaningless if paired values do not belong to the intended same entities/occasions."
      ],
      [
        "A correlation matrix has different missing subsets for each pair. What should be visible?",
        "Paired support",
        "Column count",
        "Only the number of columns",
        "Only variable colors",
        "Different denominators/populations can make pairwise entries hard to compare."
      ],
      [
        "A categorical region is encoded 1,2,3 and correlated with sales. What assumption is unsupported?",
        "Quantitative spacing",
        "Names",
        "That sales can be measured",
        "That rows can be counted",
        "Arbitrary codes do not establish quantitative distances or ordering appropriate for Pearson correlation."
      ],
      [
        "A strong relationship disappears within business segments. What should be investigated?",
        "Group composition",
        "Rounding",
        "Only more decimal printing",
        "Only sample sorting",
        "Aggregate association can be driven by differences between groups rather than within-group behavior."
      ],
      [
        "A relationship is useful in a historical sample but not a new region. What may differ?",
        "Population structure",
        "Compression",
        "Only chart dimensions",
        "Only file compression",
        "A pattern can depend on the sampled population, measurement and operating context."
      ],
      [
        "A dashboard calls low correlation proof of independence. What is wrong?",
        "Possible nonlinear dependence",
        "Independence is impossible",
        "All correlations are causal",
        "The coefficient must be positive",
        "Zero linear correlation is weaker than statistical independence except under additional assumptions."
      ],
      [
        "A reviewer wants to investigate an association responsibly. What should come next?",
        "Further contextual checks",
        "Immediate action",
        "Deletion of contrary cases",
        "A claim of guaranteed replication",
        "Exploration generates evidence and hypotheses that need design, validation and contextual review."
      ]
    ]
  },
  {
    "id": "eda-segments",
    "comps": [
      "m2.c1"
    ],
    "title": "Compare segments using denominators and comparable metrics",
    "intro": "A support manager compares resolution rates across teams. Counts of resolved tickets alone favor teams with more incoming work, so exploration must pair each numerator with the eligible ticket denominator and examine case mix.",
    "sections": [
      [
        "Reasoning and interpretation",
        "Write the metric before grouping: resolved eligible tickets divided by all eligible tickets in the same period and segment. Preserve a consistent unit, such as one ticket rather than one status update. If teams have different follow-up windows or eligibility filters, a numerical difference may describe measurement design rather than operational effectiveness.",
        "Inspect group sizes, missing labels and distribution shape alongside averages or rates. A segment with two cases and one success has the same observed rate as a segment with two thousand cases and one thousand successes, but supplies much less evidence about stable performance. Descriptive differences need uncertainty and context before ranking people or changing policy."
      ],
      [
        "Worked analysis and decision boundaries",
        "The fixture uses one row per eligible ticket and an explicit Boolean outcome. Grouping with dropna=False retains unlabeled teams. Aggregating sum and count exposes the numerator and denominator; the rate follows only after those quantities are visible.",
        "Explore important case attributes such as severity, channel and cohort before attributing a difference to a team. Avoid searching through many slices and presenting only the largest favorable contrast. Segmentation can generate questions without establishing causality or guaranteeing a future ranking."
      ]
    ],
    "problem": "Compare segments using denominators and comparable metrics on a synthetic business fixture.",
    "steps": [
      "Establish the observation unit and denominator.",
      "Calculate the stated descriptive comparison.",
      "Interpret the result within the fixture scope."
    ],
    "code": "import pandas as pd\ndf=pd.DataFrame({\"team\":[\"a\",\"a\",\"b\",\"b\",\"b\"],\"resolved\":[1,0,1,1,0]})\ns=df.groupby(\"team\")[\"resolved\"].agg([\"sum\",\"count\"])\nprint(s[\"sum\"].tolist(),s[\"count\"].tolist())\nprint((s[\"sum\"]/s[\"count\"]).round(3).tolist())",
    "expect": "[1, 2] [2, 3]\n[0.5, 0.667]",
    "limit": "These are observed proportions of five fixture tickets. The example supplies neither uncertainty estimates nor a causal comparison of team quality.",
    "mistakes": [
      "Ranking teams by successful counts hides workload differences.",
      "Equal observed rates do not imply equal precision or comparable case mix."
    ],
    "takeaways": [
      "Show numerators and denominators.",
      "Compare equivalent eligibility and follow-up definitions."
    ],
    "practice": [
      [
        "What belongs beside a segment success rate?",
        "Eligible counts",
        "Only its color",
        "Only its display order",
        "Only the total columns",
        "The rate summarizes successes among eligible cases, and its support affects interpretation."
      ],
      [
        "Which unit prevents status updates from inflating a ticket rate?",
        "An eligible ticket",
        "One status update",
        "One analyst note",
        "One chart pixel",
        "The intended denominator counts distinct eligible tickets rather than repeated updates."
      ],
      [
        "Does a larger resolved count necessarily mean a better resolution rate?",
        "No",
        "Yes always",
        "Only for alphabetical teams",
        "Only for numeric ids",
        "Workload size affects counts, so the eligible denominator is required."
      ],
      [
        "A team resolves 2 of 2 tickets and another 900 of 1000. What should temper the first ranking?",
        "Sparse support",
        "Its shorter name",
        "Its table location",
        "Its exact Boolean dtype",
        "Two observed cases provide little evidence about stable future performance."
      ],
      [
        "A region summary drops unlabeled records. What should be reported?",
        "Unlabeled coverage",
        "Only sorted labels",
        "Only the maximum rate",
        "Only table dimensions",
        "Unlabeled records can change the population represented by the reported segment comparisons."
      ],
      [
        "One team receives more severe cases. What comparison needs exploration?",
        "Stratified rates",
        "Only raw success totals",
        "Only alphabetical sorting",
        "Only fewer decimal places",
        "Severity differences can explain part of the overall rate gap."
      ],
      [
        "An analyst tries one hundred slices and reports only the largest gap. What is missing?",
        "Selection transparency",
        "A larger font",
        "Another filename",
        "A different delimiter",
        "Selective presentation can exaggerate accidental patterns from extensive searching."
      ]
    ],
    "formal": [
      [
        "What defines a segment rate?",
        "Successes/eligible cases",
        "Raw totals",
        "The sum of segment labels",
        "The biggest observed number",
        "A rate needs a numerator and denominator referring to the same segment and eligibility rule."
      ],
      [
        "What should be aligned before comparing regional rates?",
        "Metric definitions",
        "Only category colors",
        "Only report width",
        "Only customer initials",
        "Comparable rates require the same measured event and eligible population definition."
      ],
      [
        "A binary outcome is complete for every fixture row. Which aggregate is its observed rate?",
        "Binary mean",
        "Maximum",
        "Sum of team codes",
        "Median of row positions",
        "For complete 0/1 outcomes, the mean is successes divided by the number of observations."
      ],
      [
        "A report ranks branches by totals despite different traffic. What is confounded?",
        "Volume/performance",
        "Spelling",
        "Identity with spelling",
        "Time zone with delimiter",
        "High counts can result from high eligible volume without better conditional outcomes."
      ],
      [
        "Two groups have identical rates but very different sample sizes. What can differ?",
        "Uncertainty",
        "Algebra",
        "The meaning of division",
        "The number of binary outcomes per row",
        "Larger samples typically support more precise estimates under an appropriate sampling model."
      ],
      [
        "A new dashboard compares monthly closures with weekly arrivals. What fails?",
        "Aligned windows",
        "Grouping",
        "The existence of tickets",
        "The use of integers",
        "Mismatched numerator and denominator windows produce an uninterpretable performance ratio."
      ],
      [
        "A segment mean rises while its median falls. What should be inspected?",
        "Shape and tails",
        "Sorting",
        "Only report encoding",
        "Only sorting direction",
        "Means can be driven by tails while the middle observation moves in another direction."
      ],
      [
        "A branch excludes difficult tickets from its denominator. What must precede comparison?",
        "Shared eligibility",
        "Automatic celebration of its rate",
        "Deletion of other branches",
        "A smaller plot",
        "Eligibility changes can improve the displayed number without improving outcomes for the intended population."
      ],
      [
        "A small subgroup shows a large exploratory gap. What should the analyst propose?",
        "More evidence",
        "Certainty",
        "Immediate causal attribution",
        "Suppression of the subgroup size",
        "A large observed gap can reflect chance, selection or real effects and needs further evidence."
      ],
      [
        "A leadership team wants a single rank across incomparable case mixes. What is defensible?",
        "Assess adjusted comparisons",
        "Publish raw ranks as inherent quality",
        "Discard severity metadata",
        "Assume matching names imply matching risk",
        "Observed ranks do not isolate performance when units face systematically different circumstances."
      ]
    ]
  },
  {
    "id": "eda-simpson",
    "comps": [
      "m2.c1"
    ],
    "title": "Diagnose Simpson’s paradox through group composition",
    "intro": "An aggregate conversion rate can favor one campaign while each customer segment favors the other. This reversal is possible when campaigns are exposed to very different mixtures of easy and difficult cases.",
    "sections": [
      [
        "Reasoning and interpretation",
        "Overall rates are weighted averages of subgroup rates, with weights equal to each subgroup’s share of eligible observations. Comparing two overall averages therefore changes both the subgroup outcomes and their mixture unless composition is held fixed.",
        "Simpson’s paradox describes a reversal or disappearance of an association when conditioning on a grouping variable. Calculate stratum rates and counts, then ask why exposure and outcome both vary with the stratum. A reversal is an investigation signal; it does not automatically prove which adjustment answers the business question."
      ],
      [
        "Worked analysis and decision boundaries",
        "The fixture contrasts campaigns A and B. A beats B among both easy cases and hard cases, yet A receives mostly hard cases. Its overall observed conversion rate is therefore lower. The arithmetic can be reproduced directly from success and total counts.",
        "If the question is performance for a shared target population, a common weighting scheme can clarify the comparison. If the question is actual delivered aggregate outcomes, actual composition is part of the description. For causal interpretation, domain knowledge must distinguish confounders from mediators or selection variables before adjustment."
      ]
    ],
    "problem": "Diagnose Simpson’s paradox through group composition on a synthetic business fixture.",
    "steps": [
      "Establish the observation unit and denominator.",
      "Calculate the stated descriptive comparison.",
      "Interpret the result within the fixture scope."
    ],
    "code": "import pandas as pd\ndf=pd.DataFrame({\"campaign\":[\"A\",\"A\",\"B\",\"B\"],\"case\":[\"easy\",\"hard\",\"easy\",\"hard\"],\"wins\":[9,20,80,1],\"n\":[10,100,100,10]})\nprint((df[\"wins\"]/df[\"n\"]).round(3).tolist())\ng=df.groupby(\"campaign\")[[\"wins\",\"n\"]].sum()\nprint((g[\"wins\"]/g[\"n\"]).round(3).tolist())",
    "expect": "[0.9, 0.2, 0.8, 0.1]\n[0.264, 0.736]",
    "limit": "The reversal is constructed to demonstrate weighted averages. It does not establish that campaign assignment was randomized or identify a causal treatment effect.",
    "mistakes": [
      "An unweighted mean of subgroup rates need not equal the observed overall rate.",
      "Adjustment is not automatically causal merely because it reverses a headline."
    ],
    "takeaways": [
      "Inspect subgroup counts with rates.",
      "Choose comparison weights from the analytical question."
    ],
    "practice": [
      [
        "What determines subgroup weights in an observed overall rate?",
        "Subgroup counts",
        "Alphabetical names",
        "The highest rate alone",
        "The number of decimal places",
        "The overall numerator divided by total denominator weights each subgroup by its eligible share."
      ],
      [
        "Can an overall association reverse within strata?",
        "Yes",
        "Never",
        "Only with invalid division",
        "Only with missing column names",
        "Different group mixtures can create Simpson’s paradox even when every calculation is correct."
      ],
      [
        "Does a reversal identify a causal effect by itself?",
        "No",
        "Yes always",
        "Only when rounded",
        "Only for two groups",
        "A causal interpretation also requires a justified design and choice of conditioning variables."
      ],
      [
        "Campaign A wins within both risk groups but loses overall. What should be checked first?",
        "Case mixture",
        "Only display rounding",
        "Only campaign spelling",
        "Only row order",
        "Different exposure to easy and hard cases can explain the aggregate reversal."
      ],
      [
        "An executive averages subgroup percentages equally despite unequal counts. What does that estimate?",
        "Equal-group mean",
        "The actual overall rate necessarily",
        "Total success count",
        "The median customer id",
        "Equal weighting answers a different question unless each subgroup contributes the same denominator."
      ],
      [
        "Two hospitals treat different illness severity mixes. What can raw mortality rankings reflect?",
        "Case mix",
        "Only hospital quality",
        "Only record encoding",
        "Only the chosen chart font",
        "Severity influences outcome and can differ between hospitals, complicating performance comparisons."
      ],
      [
        "A standardization uses shared target weights. What must be stated?",
        "Target weights",
        "Only the winning group",
        "Only software version",
        "Only metric colors",
        "The adjusted summary depends on the population represented by those common weights."
      ]
    ],
    "formal": [
      [
        "What is an overall binary outcome rate?",
        "Count-weighted mean",
        "Equal weighting",
        "The largest stratum rate",
        "The sum of all percentages",
        "Summing stratum successes and totals yields weights proportional to stratum denominators."
      ],
      [
        "What is a hallmark of Simpson’s paradox?",
        "Association reversal",
        "Bad sums",
        "All raw counts are negative",
        "The arithmetic fails by definition",
        "The paradox concerns how associations change when groups are pooled or separated."
      ],
      [
        "Which comparison holds composition fixed?",
        "Common-weight rates",
        "Raw totals",
        "Maximum success count",
        "An unordered list of group names",
        "A common weighting distribution removes the difference caused solely by observed subgroup shares."
      ],
      [
        "A product receives mostly low-intent users and loses overall despite stronger stratum conversion. What explains this?",
        "Intent mix",
        "A defect",
        "A universally inferior product",
        "A mandatory coding bug",
        "Low baseline conversion strata can dominate one product’s aggregate rate."
      ],
      [
        "An analyst concludes the stratified result is always the true causal answer. What is missing?",
        "Control justification",
        "A more colorful chart",
        "A larger table border",
        "Alphabetical sorting",
        "Conditioning can introduce bias if the variable is a collider or otherwise inappropriate for the causal question."
      ],
      [
        "An overall rate changes while each stratum rate stays constant. What can explain it?",
        "Changing weights",
        "A defect",
        "A required software defect",
        "An impossible event",
        "An aggregate weighted average changes when its weights change, even if every component is stable."
      ],
      [
        "A study adjusts for a behavior caused by treatment. What needs clarification?",
        "The estimand",
        "The title",
        "Whether counts are integers",
        "Whether the table has a title",
        "Controlling a mediator can remove part of the effect one intends to estimate."
      ],
      [
        "Two interventions are standardized using different weights. What undermines comparison?",
        "Different targets",
        "Units",
        "Their positive denominators",
        "Their valid divisions",
        "The summary now mixes intervention differences with different population weighting."
      ],
      [
        "A manager wants actual delivered conversions rather than like-for-like efficacy. What matters?",
        "Actual aggregate outcomes",
        "Only equal-weight subgroup rates",
        "Only the best subgroup",
        "Only a hypothetical balanced population",
        "The appropriate descriptive target depends on the decision; standardization is not universally the required headline."
      ],
      [
        "A reversal disappears after correcting a duplicated subgroup denominator. What should be concluded?",
        "Invalid earlier denominators",
        "Every reversal is a data error",
        "Causality is established",
        "Group checks are unnecessary",
        "Correctness of underlying counts must be established before interpreting a compositional pattern."
      ]
    ]
  },
  {
    "id": "eda-time",
    "comps": [
      "m2.c2"
    ],
    "title": "Explore time trends with calendar coverage and stable definitions",
    "intro": "A daily revenue line can rise because sales improved, because more stores reported, or because late events arrived. Time exploration must distinguish observed values from changes in calendar coverage and measurement.",
    "sections": [
      [
        "Reasoning and interpretation",
        "Choose event time, reporting time or another explicitly defined clock. Parse timestamps with a known timezone policy and sort chronologically before differences or rolling calculations. A month-to-month comparison needs comparable windows, not an arbitrary fixed number of rows in an irregular event stream.",
        "Build a calendar index when absence has analytical meaning. An absent row is not automatically zero sales: it may mean no events, no extraction or a closed business. Reindexing exposes gaps but cannot decide their cause. Record coverage alongside totals, and compare rates per open day or active unit only when that denominator fits the question."
      ],
      [
        "Worked analysis and decision boundaries",
        "The fixture groups synthetic events by calendar day, then reindexes a declared three-day window. The middle day remains missing, because no source completeness guarantee permits interpreting it as zero. A rolling two-day mean is shown only when both calendar positions have observations.",
        "Inspect seasonality, holidays, changing exposure, revisions and structural breaks before attributing a trend to an intervention. Centered windows include future observations and are inappropriate for real-time features. Exploratory smoothing can aid reading but does not replace the unsmoothed evidence or establish a forecast."
      ]
    ],
    "problem": "Explore time trends with calendar coverage and stable definitions on a synthetic business fixture.",
    "steps": [
      "Establish the observation unit and denominator.",
      "Calculate the stated descriptive comparison.",
      "Interpret the result within the fixture scope."
    ],
    "code": "import pandas as pd\ns=pd.Series([10.,30.],index=pd.to_datetime([\"2025-01-01\",\"2025-01-03\"]))\ndaily=s.reindex(pd.date_range(\"2025-01-01\",\"2025-01-03\",freq=\"D\"))\nprint(daily.isna().tolist())\nprint(daily.rolling(2,min_periods=2).mean().isna().tolist())",
    "expect": "[False, True, False]\n[True, True, True]",
    "limit": "A missing calendar day remains unknown in this fixture. The example does not provide seasonal adjustment, timezone localization, causal inference or a forecasting model.",
    "mistakes": [
      "Filling every absent date with zero can turn extraction gaps into artificial declines.",
      "A row-based window is not necessarily a fixed calendar duration."
    ],
    "takeaways": [
      "Establish the clock, calendar and exposure.",
      "Separate smoothing from causal or predictive evidence."
    ],
    "practice": [
      [
        "What must precede sequential differences?",
        "Time ordering",
        "Alphabetical label ordering",
        "Random shuffling",
        "Descending customer id",
        "Adjacent differences require the intended temporal sequence."
      ],
      [
        "Does an absent daily row always mean zero activity?",
        "No",
        "Yes universally",
        "Only in CSV files",
        "Only for positive metrics",
        "Absence may reflect extraction gaps, closures or no events and needs source semantics."
      ],
      [
        "What does reindexing to a calendar reveal?",
        "Calendar gaps",
        "Their proven causal explanation",
        "A guaranteed forecast",
        "The correct business policy",
        "Reindexing makes absent dates explicit but does not establish why they are absent."
      ],
      [
        "A retailer’s total rises after more stores start reporting. What should be examined?",
        "Comparable-store exposure",
        "Only chart slope",
        "Only a new title",
        "Only axis color",
        "Changing coverage can increase totals without improvement at comparable units."
      ],
      [
        "A weekly chart mixes partial and full weeks. What is needed?",
        "Window coverage",
        "Automatic zero fill",
        "Only sorted labels",
        "Only more precision",
        "Unequal observed duration can create apparent trend differences."
      ],
      [
        "An analyst uses a centered average as a live prediction feature. What risk arises?",
        "Future leakage",
        "Guaranteed better calibration",
        "Only a wider table",
        "Only duplicate colors",
        "Centered windows use later observations unavailable at the prediction time."
      ],
      [
        "A three-row rolling mean spans variable numbers of days. What is irregular?",
        "Irregular timing",
        "The arithmetic mean definition",
        "The file extension",
        "The existence of dates",
        "Row-count windows follow observations rather than guaranteed calendar durations."
      ],
      [
        "A daily extract has no row for Tuesday. What must be established before filling zero?",
        "Source completeness semantics",
        "The longest timestamp string",
        "A preferred chart legend",
        "The analyst’s table theme",
        "An absent row can mean no activity or a collection gap; the source guarantee determines whether zero is justified."
      ],
      [
        "A reporting-day shift coincides with a midnight timezone migration. What needs checking?",
        "Clock interpretation",
        "Only alphabetical region order",
        "Only a smaller output file",
        "Only extra numeric precision",
        "Changing timezone interpretation can reassign events across day boundaries without changing their actual occurrence."
      ],
      [
        "A cumulative metric is summed over days. What may result?",
        "Repeated counting",
        "A guaranteed flow measure",
        "A valid rate denominator",
        "A necessary seasonal adjustment",
        "Daily cumulative snapshots already include earlier activity, so summing snapshots can count the same underlying events repeatedly."
      ]
    ],
    "formal": [
      [
        "What identifies a time trend’s scope?",
        "Temporal scope",
        "The title",
        "Only source column count",
        "Only the latest point",
        "A temporal claim needs an explicit clock and observation period."
      ],
      [
        "What should accompany a smoothed series?",
        "Raw series/definition",
        "Only a polished headline",
        "A causal guarantee",
        "The maximum id",
        "Readers need to see variation and know which observations enter the smoother."
      ],
      [
        "What can a calendar gap indicate?",
        "Unknown absence",
        "Zero",
        "Only a negative outcome",
        "Only an invalid parser",
        "The source process determines how an absent observation should be interpreted."
      ],
      [
        "A campaign starts just before a recurring holiday sales peak. What limits attribution?",
        "Seasonal effects",
        "Rounding",
        "Only integer outcomes",
        "Only matching colors",
        "A before-after pattern can reflect calendar effects rather than the campaign."
      ],
      [
        "A dashboard compares event dates to ingestion dates across teams. What fails?",
        "Clock consistency",
        "A date",
        "The concept of a day",
        "The existence of timestamps",
        "Event occurrence and later arrival answer different questions and can have different delay patterns."
      ],
      [
        "A daily total is revised when late events arrive. What should be documented?",
        "Revision scope",
        "Filename",
        "Only chart dimensions",
        "Only data sorting",
        "The same event window can yield different totals across extraction snapshots."
      ],
      [
        "A moving average falls because its oldest high value leaves the window. What explains the fall?",
        "Window contents",
        "A crash",
        "A mandatory missing date",
        "An arithmetic impossibility",
        "Rolling statistics change when entering and leaving observations alter their contents."
      ],
      [
        "A team forward-fills monthly revenue into every day then sums it. What is wrong?",
        "Repeated totals",
        "Rounding",
        "Using too many decimals",
        "A required timezone conversion",
        "A monthly total is not a daily flow; repetition and summation multiply the original quantity."
      ],
      [
        "A structural break follows a metric-definition change. What should analysis distinguish?",
        "Definition versus process",
        "Only the latest rate",
        "Only the highest point",
        "Only the chart style",
        "A trend discontinuity may be created by the definition rather than real behavior."
      ],
      [
        "A forecast backtest smooths each point using future days. What should change?",
        "Time-available inputs",
        "All future values",
        "Delete the timestamps",
        "Declare perfect temporal validity",
        "Time-respecting evaluation must reproduce what could actually have been known then."
      ]
    ]
  },
  {
    "id": "eda-findings",
    "comps": [
      "m3.c1"
    ],
    "title": "Write findings that separate observations from explanations",
    "intro": "A stakeholder needs an evidence statement they can inspect. A useful exploratory finding states what was observed, for which data and denominator, how it was calculated and what remains unresolved.",
    "sections": [
      [
        "Reasoning and interpretation",
        "Use a finding record with a question, scoped dataset, metric definition, result, support and caveat. Distinguish direct observation from interpretation: “conversion was lower among observed mobile sessions” is an observation, while “the interface caused customers to leave” requires additional design and evidence.",
        "Include effect magnitude in meaningful units instead of only adjectives such as large or concerning. A change from 10% to 12% is two percentage points and a 20% relative increase. State the baseline and units explicitly so readers can reconstruct the comparison and assess its importance."
      ],
      [
        "Worked analysis and decision boundaries",
        "The fixture derives both absolute percentage-point and relative changes from the same synthetic rates. The narrative should mention the denominator and selection limitations outside these two arithmetic outputs. Computed precision is not measurement accuracy; avoid unsupported certainty from extra digits.",
        "For every interpretation, list credible alternative explanations and the next evidence that would distinguish them. Missingness, exposure, seasonality, composition and instrumentation are common possibilities, but use only alternatives relevant to the actual finding. Preserve contradictory observations instead of deleting them from the report."
      ]
    ],
    "problem": "Write findings that separate observations from explanations on a synthetic business fixture.",
    "steps": [
      "Establish the observation unit and denominator.",
      "Calculate the stated descriptive comparison.",
      "Interpret the result within the fixture scope."
    ],
    "code": "before=0.10\nafter=0.12\nprint(round((after-before)*100,2))\nprint(round((after/before-1)*100,2))",
    "expect": "2.0\n20.0",
    "limit": "The arithmetic distinguishes percentage points from relative percent. It supplies no sample size, uncertainty, causal attribution or commercial impact estimate.",
    "mistakes": [
      "Relative percent and percentage points are different quantities.",
      "A plausible story is not established merely because a descriptive pattern fits it."
    ],
    "takeaways": [
      "Make scope and denominator visible.",
      "Separate observed results, interpretations and next evidence."
    ],
    "practice": [
      [
        "A rate rises from 10% to 12%. What is the absolute change?",
        "Two points",
        "Two hundred percentage points",
        "Twelve percentage points",
        "Twenty percentage points",
        "Subtracting rates gives 0.02, which is two points on the percentage scale."
      ],
      [
        "What belongs in a reproducible finding?",
        "Metric/input scope",
        "Only a dramatic adjective",
        "Only author confidence",
        "Only a screenshot caption",
        "Readers need the population, window and calculation definition to reconstruct the claim."
      ],
      [
        "Does a descriptive difference establish its cause?",
        "No",
        "Yes universally",
        "Only if rounded",
        "Only when charted",
        "A difference can arise through confounding, selection, chance or measurement changes."
      ],
      [
        "A report calls a 10% to 12% rise a 2% relative gain. What needs correction?",
        "Percent versus points",
        "The observation window necessarily",
        "The source language",
        "The row count automatically",
        "The gain is two percentage points or 20% relative to 10%, not 2% relative."
      ],
      [
        "A conversion finding omits eligible-session counts. What is unclear?",
        "Support counts",
        "Only the chosen font",
        "Only the URL length",
        "Only the file type",
        "Without support, readers cannot assess how much observed evidence underlies the rate."
      ],
      [
        "A team claims a redesign caused growth after a simple before-after chart. What should be separated?",
        "Observation versus cause",
        "Positive from negative colors",
        "Integers from strings",
        "Tables from text",
        "A temporal descriptive difference alone cannot isolate the redesign from other changes."
      ],
      [
        "A negative subgroup result contradicts a favorable headline. What is responsible?",
        "Investigate contradictions",
        "Remove the subgroup silently",
        "Rename the metric",
        "Hide its denominator",
        "Contradictory evidence can reveal heterogeneity or a mistaken interpretation."
      ]
    ],
    "formal": [
      [
        "What connects an exploratory finding to an answerable next question?",
        "A stated evidence gap",
        "More decimal places",
        "A different column order",
        "An ornamental chart title",
        "A finding should identify what is still unknown and what further observation or design could distinguish plausible explanations; formatting alone does not create a research question."
      ],
      [
        "What makes an alternative explanation useful?",
        "It is testable",
        "It is catchy",
        "It is impossible to inspect",
        "It repeats the headline",
        "A useful alternative supports a test or investigation rather than an unfalsifiable story."
      ],
      [
        "Why state baseline values for a relative change?",
        "Baseline context",
        "Causality",
        "To eliminate sampling error",
        "To hide small denominators",
        "The same absolute change has different relative meaning at different baselines."
      ],
      [
        "An analyst prints nine decimals from approximate source measures. What is overstated?",
        "Precision",
        "Row count",
        "The number of rows",
        "The existence of the metric",
        "Numerical output precision does not guarantee that the underlying measurement is equally accurate."
      ],
      [
        "A revenue finding uses one region but recommends a worldwide rollout. What exceeds the evidence?",
        "Generalization",
        "The sum",
        "The existence of regions",
        "The right to label an axis",
        "Evidence from a selected region does not automatically support all populations and conditions."
      ],
      [
        "A rate doubles from one success in one thousand to two. What must accompany the headline?",
        "Sparse support",
        "Only ratios",
        "Only relative percent",
        "Only a promotional color",
        "The relative change is arithmetically real but sparse outcomes make broad interpretation uncertain."
      ],
      [
        "A summary says a cost change is significant without defining the word. What should be clarified?",
        "Meaning of significance",
        "Only font size",
        "Only metric order",
        "Only report filename",
        "Statistical significance and business importance are distinct claims and neither should be implied vaguely."
      ],
      [
        "A report labels an observed association a hypothesis. What next step strengthens it?",
        "Plan further evidence",
        "Repeat it as fact",
        "Delete the caveat",
        "Change all negative values",
        "A hypothesis should lead to a discriminating investigation rather than unearned certainty."
      ],
      [
        "A stakeholder asks for impact in dollars from a rate difference. What additional inputs matter?",
        "Volume/value assumptions",
        "Only a larger percentage sign",
        "Only source language",
        "Only a renamed heading",
        "Converting a rate difference to monetary impact requires volumes, unit values and assumptions about applicability."
      ],
      [
        "A result cannot be reproduced after source revisions. What would have helped?",
        "Input/code versions",
        "Initials",
        "Only a memorable title",
        "Only a colored chart",
        "Traceable inputs and transformations allow the original evidence to be reconstructed."
      ]
    ]
  },
  {
    "id": "eda-questions",
    "comps": [
      "m3.c1"
    ],
    "title": "Turn exploratory findings into answerable next questions",
    "intro": "A delivery analysis finds slower completion in one area. “Why is this happening?” is a useful starting concern, but a next investigation needs a defined population, measurement, competing explanations and a feasible evidence plan.",
    "sections": [
      [
        "Reasoning and interpretation",
        "Convert a finding into a question that specifies the outcome, unit, comparison, period and decision. For example, ask whether delays differ between comparable delivery distances within the same service window, rather than whether a region is simply bad. Keep a distinction between describing a pattern, predicting an outcome and estimating the effect of changing a policy.",
        "Build a small hypothesis table: proposed mechanism, observable implication, required data, limitations and next step. If distance explains delay, a within-distance comparison should narrow the gap; if scans arrive late, compare event and ingestion timestamps. These are investigation plans, not guarantees that observational adjustment will identify causality."
      ],
      [
        "Worked analysis and decision boundaries",
        "The fixture compares within-distance means using a pivot table and reports regional differences by stratum. This tests the descriptive implication that the difference is entirely due to distance mix. The equal fixture gaps do not rule out other confounders or establish an intervention effect.",
        "Prioritize questions by decision value, plausible effect size, uncertainty, feasibility and collection cost. Choose a stopping point before producing endless slices. If action requires a causal answer, consider a randomized experiment or another defensible design, with ethical and operational constraints reviewed by the responsible owners."
      ]
    ],
    "problem": "Turn exploratory findings into answerable next questions on a synthetic business fixture.",
    "steps": [
      "Establish the observation unit and denominator.",
      "Calculate the stated descriptive comparison.",
      "Interpret the result within the fixture scope."
    ],
    "code": "import pandas as pd\ndf=pd.DataFrame({\"region\":[\"a\",\"b\",\"a\",\"b\"],\"distance\":[\"near\",\"near\",\"far\",\"far\"],\"minutes\":[10.,12.,30.,32.]})\np=df.pivot(index=\"distance\",columns=\"region\",values=\"minutes\")\nprint((p[\"b\"]-p[\"a\"]).to_dict())",
    "expect": "{'far': 2.0, 'near': 2.0}",
    "limit": "Each region-distance combination contains one synthetic observation. This contrast is descriptive and has no uncertainty or causal identification claim.",
    "mistakes": [
      "An unbounded why question often lacks a feasible evidence test.",
      "Post-hoc subgroup discoveries should not be presented as prespecified confirmations."
    ],
    "takeaways": [
      "Write an observable implication for each hypothesis.",
      "Match the next study design to the decision and claim."
    ],
    "practice": [
      [
        "What makes a next question answerable?",
        "Scope and comparison",
        "Only urgency",
        "Only a compelling story",
        "Only a larger chart",
        "Explicit scope and measures identify what evidence is needed."
      ],
      [
        "What should accompany a proposed mechanism?",
        "Observable implications",
        "A guarantee of truth",
        "A new logo",
        "A larger output file",
        "An observable implication gives the hypothesis a potential evidence-based check."
      ],
      [
        "Are prediction and intervention-effect questions identical?",
        "No",
        "Yes always",
        "Only for linear models",
        "Only for large data",
        "Predictive associations need not equal the effects of changing a variable."
      ],
      [
        "A delay gap persists within distance strata. Which claim is unsupported?",
        "A mix-only explanation",
        "A gap remains in the observed strata",
        "Distances were grouped",
        "The arithmetic comparison is descriptive",
        "Persistence within strata contradicts a complete mix-only explanation in the analyzed fixture."
      ],
      [
        "A team suspects delayed scanning rather than delayed delivery. What data helps?",
        "Both timestamps",
        "Only chart labels",
        "Only customer initials",
        "Only file extensions",
        "Comparing occurrence and recording clocks can reveal reporting latency."
      ],
      [
        "An analyst wants the best region to copy but only has correlation. What should guide next work?",
        "Specify causal design",
        "Assume association is the effect",
        "Delete comparison groups",
        "Choose the most favorable slice",
        "Copying a policy requires evidence about changing it, not merely a correlated outcome."
      ],
      [
        "A group has many speculative causes and limited time. What helps prioritize?",
        "Decision/evidence value",
        "Only alphabetical order",
        "Only the longest hypothesis",
        "Only cheapest chart colors",
        "Questions should be ordered by value, uncertainty and feasible information gain."
      ]
    ],
    "formal": [
      [
        "Which question is explicitly descriptive?",
        "How do regional delays differ?",
        "What would changing dispatch cause?",
        "Will a policy certainly fix delays?",
        "Which rule must improve every delivery?",
        "A descriptive question characterizes observed data without claiming an intervention effect."
      ],
      [
        "What belongs in a hypothesis investigation plan?",
        "Data and limits",
        "Only a confident conclusion",
        "Only an image",
        "Only a file owner",
        "A plan must identify what evidence is needed and which claims it cannot establish."
      ],
      [
        "What should determine the next analysis method?",
        "Question/design fit",
        "The most fashionable library",
        "The biggest chart",
        "The first package installed",
        "Methods should fit the inference target and evidence collection process."
      ],
      [
        "A team requests data with no proposed analytical use. What should be specified first?",
        "The decision question",
        "A larger storage bucket",
        "A mandatory complex model",
        "A random sample size",
        "A concrete question makes relevance, scope and collection cost assessable."
      ],
      [
        "A subgroup discovered after extensive exploration is called a confirmed finding. What is missing?",
        "Confirmatory evidence",
        "A brighter highlight",
        "A new metric name",
        "A different export format",
        "Exploratory selection can overstate evidence unless subsequent testing accounts for that selection."
      ],
      [
        "A treatment-effect question is answered with a high prediction score. Why insufficient?",
        "Prediction is not intervention",
        "Prediction scores cannot be computed",
        "All prediction is invalid",
        "Every dataset must be randomized",
        "A model can exploit associations that would not persist under changing the treatment."
      ],
      [
        "A proposed experiment changes several policies at once. What is harder to identify?",
        "Component effects",
        "Row count",
        "The number of rows",
        "The outcome definition necessarily",
        "A bundled intervention can support a package effect but not isolate component effects without additional design."
      ],
      [
        "A manager wants to explore until a favorable result appears. What should be established?",
        "A stopping plan",
        "A bigger file",
        "Only positive charts",
        "Only the preferred result",
        "Unbounded searching encourages selection and does not ensure useful or trustworthy evidence."
      ],
      [
        "A hypothesis cannot be distinguished with existing fields. What is defensible?",
        "Record missing evidence",
        "Declare it proven anyway",
        "Invent missing values",
        "Remove all caveats",
        "A valid investigation acknowledges when current evidence cannot separate explanations."
      ],
      [
        "An observational comparison adjusts for every available variable. What remains necessary?",
        "Justified controls",
        "All predictors",
        "Only a larger correlation matrix",
        "Automatic causal certainty",
        "Including inappropriate controls can introduce bias or change the effect being estimated."
      ]
    ]
  },
  {
    "id": "eda-handoff",
    "comps": [
      "m3.c1"
    ],
    "title": "Package a reproducible exploratory handoff with decision limits",
    "intro": "An exploratory notebook becomes organizational evidence when another analyst can recreate it and understand its boundaries. The handoff should carry the source identity, transformation decisions, findings, unresolved questions and proposed next actions together.",
    "sections": [
      [
        "Reasoning and interpretation",
        "Record the input snapshot or synthetic fixture, code version, dependency versions, metric definitions and execution steps. Preserve raw-to-derived lineage so a reviewer can inspect which records were included or excluded. Share only authorized outputs and keep sensitive diagnostic records in appropriately restricted locations.",
        "Use a finding register with stable identifiers so charts, questions and follow-up work refer to the same result. For each finding, record support, limitations and review status. Technical execution success verifies a computation on stated inputs; it does not mark the interpretation as educationally reviewed, business approved or causal."
      ],
      [
        "Worked analysis and decision boundaries",
        "The fixture produces a compact machine-readable handoff record from an explicit observed subset. It documents input and observed counts separately. The missing record remains visible in the support statement rather than disappearing into a mean with an unknown denominator.",
        "Before handoff, rerun from a clean state and check that outputs match the documented fixture or snapshot. Review whether titles overstate claims, whether contradictory evidence is visible and whether proposed actions require more information. Assign follow-up ownership without implying that a proposal has already been authorized."
      ]
    ],
    "problem": "Package a reproducible exploratory handoff with decision limits on a synthetic business fixture.",
    "steps": [
      "Establish the observation unit and denominator.",
      "Calculate the stated descriptive comparison.",
      "Interpret the result within the fixture scope."
    ],
    "code": "import pandas as pd\ns=pd.Series([10.,20.,None])\nrecord={\"finding\":\"F1\",\"input_rows\":len(s),\"observed_rows\":int(s.count()),\"mean_observed\":float(s.mean()),\"status\":\"exploratory\"}\nprint(record)",
    "expect": "{'finding': 'F1', 'input_rows': 3, 'observed_rows': 2, 'mean_observed': 15.0, 'status': 'exploratory'}",
    "limit": "The record demonstrates scoped support and draft status on synthetic inputs. A real handoff also needs authorized source identity, lineage, dependency versions and substantive review.",
    "mistakes": [
      "A reproducible calculation can still use an inappropriate metric or biased sample.",
      "An executed notebook is not evidence of authorized business approval."
    ],
    "takeaways": [
      "Carry support, lineage and limitations into the handoff.",
      "Make next work traceable without overstating readiness."
    ],
    "practice": [
      [
        "What allows another analyst to reconstruct a result?",
        "Input/code identity",
        "Only the slide title",
        "Only the author’s confidence",
        "Only the most recent screenshot",
        "Reproduction depends on traceable inputs and the exact analytical procedure."
      ],
      [
        "Does successful code execution establish substantive approval?",
        "No",
        "Yes automatically",
        "Only if no nulls exist",
        "Only for small files",
        "Execution verifies computational behavior under stated conditions, not the appropriateness or approval of conclusions."
      ],
      [
        "Why use stable finding identifiers?",
        "Trace follow-up",
        "Replace all metric definitions",
        "Guarantee causal truth",
        "Hide unresolved questions",
        "Identifiers let reviews, charts and next questions refer unambiguously to the same finding."
      ],
      [
        "A mean uses two observed records out of three. What should the handoff show?",
        "Both counts",
        "Only the number fifteen",
        "Only the code length",
        "Only the missing row id publicly",
        "The observed mean excludes unavailable values, so coverage is part of its interpretation."
      ],
      [
        "A notebook runs only after hidden manual cell edits. What needs correction?",
        "Reproducible execution",
        "Only a different title",
        "Only report color",
        "Only sorting the slides",
        "Hidden state prevents another analyst from recreating the documented result."
      ],
      [
        "A handoff embeds private customer messages in a widely shared report. What should change?",
        "Disclosure controls",
        "Only chart height",
        "Only the metric alias",
        "Only decimal formatting",
        "Reproducibility does not justify exposing sensitive raw records to unauthorized readers."
      ],
      [
        "A reviewer finds an unresolved denominator discrepancy. What status is accurate?",
        "Exploratory/unresolved",
        "Final approved truth",
        "Published production policy",
        "Guaranteed causal effect",
        "Open scope or metric issues must remain visible until resolved."
      ]
    ],
    "formal": [
      [
        "What is analytical lineage?",
        "Source-to-output derivation",
        "Only chronological author names",
        "Only a list of colors",
        "The maximum row count",
        "Lineage records how derived evidence was produced from particular inputs."
      ],
      [
        "What should a clean rerun verify?",
        "Regenerable outputs",
        "Final approval",
        "Causality is guaranteed",
        "Human review is complete",
        "A clean rerun checks computational reproducibility, with interpretation still requiring substantive assessment."
      ],
      [
        "What belongs in a follow-up record?",
        "Owner/evidence plan",
        "A screenshot",
        "Only a screenshot icon",
        "Only the final slide count",
        "Follow-up work needs accountable ownership and a defined evidence objective."
      ],
      [
        "A chart title claims universal improvement from one selected cohort. What should be revised?",
        "Claim scope",
        "The title",
        "The mathematical possibility of means",
        "The file extension only",
        "A handoff should align its wording with the observed population and evidence limits."
      ],
      [
        "A changed library alters grouping defaults. What aids investigation?",
        "Versions/options",
        "Filename",
        "Only a longer filename",
        "Only a screenshot",
        "Versioned dependencies and explicit semantics make behavior changes traceable."
      ],
      [
        "A reviewer cannot find how canceled orders were excluded. What is missing?",
        "Inclusion lineage",
        "The chart",
        "Only author biography",
        "Only category colors",
        "The metric population depends on exclusion logic that must be inspectable."
      ],
      [
        "A handoff records only positive findings. What weakens it?",
        "Selective reporting",
        "Definitions",
        "The existence of stable ids",
        "The use of synthetic examples",
        "A trustworthy evidence package includes relevant contradictory and null findings."
      ],
      [
        "A technically reproducible summary uses a convenience sample. What limitation remains?",
        "Representativeness",
        "Arithmetic",
        "The stored input count",
        "The arithmetic existence of the mean",
        "Reproduction does not eliminate bias from how observations were collected."
      ],
      [
        "A stakeholder treats proposed follow-up as an approved policy rollout. What should be explicit?",
        "Approval status",
        "Compression",
        "Only field ordering",
        "Only the Python patch version",
        "A handoff must distinguish recommendations for further work from authorized actions."
      ],
      [
        "A source snapshot was overwritten and cannot be reconstructed. What is the practical consequence?",
        "Lost reproducibility",
        "Certain falsehood",
        "Causality is newly established",
        "The latest source proves the old numbers",
        "Without recoverable original inputs, current results cannot guarantee reconstruction of a past computation."
      ]
    ]
  }
];
module.exports=course('eda',specs,['basics','missing_data','groupby','timeseries','reshaping']);
