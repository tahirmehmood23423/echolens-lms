'use strict';
const {course}=require('./data-wave3-helper');
const specs=[
  {
    "id": "story-decision",
    "comps": [
      "m1.c1"
    ],
    "title": "Translate a finding into a decision contract",
    "intro": "A subscription team sees cancellations rise and asks for a recommendation. The first task is to define what can change, who can authorize it and what outcome will be measured; a striking number alone is not a decision.",
    "sections": [
      [
        "Name the choice and the counterfactual",
        "A finding describes evidence, while a recommendation proposes a bounded action. State the decision owner, eligible population, time horizon and alternative to action. If customer support capacity is the constraint, a recommendation to contact every subscriber is not operationally meaningful even if an aggregate churn chart is accurate. Begin with a specific choice such as testing a retention call for newly renewing annual accounts.",
        "Define the outcome as a numerator, denominator and observation window. Cancellation requests per eligible renewal and cancellations per active account answer different questions. Document exclusions and the comparison baseline before selecting the most persuasive chart. A change in population composition can move a rate even when the underlying customer behavior does not change."
      ],
      [
        "Separate measurement from expected action",
        "A decision contract includes an expected benefit, implementation cost, risk and a rule for revisiting the choice. Keep observed facts separate from assumptions about what the proposed intervention would cause. A descriptive churn increase can justify investigation or a controlled pilot; it does not by itself identify the effect of a retention call.",
        "The fixture calculates the absolute rate difference and observed excess cases on a fixed eligible population. These are descriptive quantities. Applying that difference to another population assumes comparable measurement and case mix; calling the cases preventable would additionally require causal evidence about an effective intervention. Report that boundary next to the number, not only in an appendix."
      ]
    ],
    "problem": "Quantify an observed rate change without labeling it a preventable effect.",
    "steps": [
      "Define the population, units and decision before calculating.",
      "Run the synthetic fixture and inspect intermediate values against its declared contract.",
      "Explain the result, boundary conditions and the action that the evidence supports."
    ],
    "code": "baseline=40/1000\ncurrent=65/1000\nprint(round((current-baseline)*100,1))\nprint(round((current-baseline)*1000))\nprint(\"descriptive; intervention effect unknown\")",
    "expect": "2.5\n25\ndescriptive; intervention effect unknown",
    "limit": "Python arithmetic verifies a fixed-population descriptive comparison. It neither randomizes a treatment nor estimates how many cancellations a call would prevent.",
    "practice": [
      [
        "What distinguishes a recommendation from a finding?",
        "A proposed action",
        "A larger font",
        "A raw observation",
        "A database record",
        "A recommendation specifies an action under assumptions, whereas a finding describes evidence."
      ],
      [
        "Which term defines who can act on an analysis?",
        "Decision owner",
        "Chart title",
        "Column dtype",
        "Image width",
        "The decision owner has responsibility and authority for choosing the proposed action."
      ],
      [
        "A rate definition requires which pair?",
        "Numerator and denominator",
        "Title and logo",
        "Median and color",
        "Date and file size",
        "A rate needs a defined event count and eligible population, plus an observation window."
      ],
      [
        "A team compares cancellations per renewal with cancellations per active account. What needs alignment?",
        "Population definition",
        "Only axis labels",
        "Only currency units",
        "Only staff names",
        "Different denominators can describe different risks and cannot be treated as identical measures."
      ],
      [
        "A dashboard shows 25 excess cancellations. Can a call campaign claim 25 saves?",
        "No causal basis yet",
        "Yes by subtraction",
        "Yes if rounded",
        "Only with a bigger chart",
        "The observed difference does not establish what an untested intervention would prevent."
      ],
      [
        "A pilot needs twice the available staff hours. What must the recommendation include?",
        "Capacity constraints",
        "Only a new graph",
        "Only the total accounts",
        "Only the chart palette",
        "Feasibility depends on the resources needed to deliver the action, not just its theoretical appeal."
      ],
      [
        "A director asks whether to contact renewal customers this month. Which output helps most?",
        "A bounded pilot proposal",
        "Every raw row alone",
        "An unlabeled annual chart",
        "An unrelated revenue total",
        "A bounded pilot ties the evidence to a specific eligible population, decision and time horizon."
      ]
    ],
    "formal": [
      [
        "What is an observation window?",
        "The period measured",
        "The page width",
        "The chart palette",
        "The database vendor",
        "The window establishes when events and eligibility are counted, making comparisons interpretable."
      ],
      [
        "What does a counterfactual represent?",
        "An alternative outcome",
        "A copied chart",
        "An empty dataset",
        "A second file name",
        "The counterfactual describes what would happen under a different action or no intervention."
      ],
      [
        "What is the decision horizon?",
        "When action matters",
        "When a file was named",
        "How wide a bar is",
        "How many colors exist",
        "The horizon defines the time over which the action and its outcomes should be evaluated."
      ],
      [
        "A sales lead requests a churn narrative without a decision owner. What should the analyst clarify first?",
        "Who chooses the action",
        "Which logo to use",
        "Which font is widest",
        "Who designed the database",
        "Authority and the actionable choice must be clear for the recommendation to influence a decision."
      ],
      [
        "A renewal metric excludes late invoices only this month. What limits the trend claim?",
        "Changed eligibility",
        "Improved chart style",
        "Smaller PNG size",
        "A new spreadsheet tab",
        "A changed denominator can create a trend through selection rather than changed cancellation behavior."
      ],
      [
        "A report calls every excess cancellation avoidable. Which assumption is unsupported?",
        "An effective intervention",
        "A defined numerator",
        "A common time window",
        "An arithmetic difference",
        "Avoidability requires evidence about an intervention or mechanism beyond a descriptive difference."
      ],
      [
        "A team can call at most 100 customers this week. Segment A has 500 customers and 40% excess cancellations but no measured call effect; segment B has 80 customers and lower excess. Calls may cause complaints. Which proposal best respects capacity and learns decision-relevant evidence?",
        "Randomize 100 eligible A customers to call/control; track harm",
        "Call all 500 in A because its descriptive excess is largest",
        "Call all 80 in B and attribute every later renewal to calls",
        "Select 100 A customers; report all excess cases as saves",
        "A bounded randomized pilot can respect the call limit, estimate assignment effects and monitor complaints. Descriptive excess alone does not identify preventable cancellations, and an uncontrolled follow-up cannot attribute every renewal to calls."
      ],
      [
        "A team moves from monthly to annual churn rates. What should accompany the comparison?",
        "Aligned definitions",
        "Compare raw rates",
        "Multiply by twelve",
        "Use the larger rate",
        "Different observation windows change the meaning of rates and need a comparable definition or explicit reconciliation."
      ],
      [
        "A measured association suggests a useful retention experiment. What is defensible?",
        "Test the lever",
        "Claim causal lift",
        "Call it randomized",
        "Count excess as saves",
        "An association can motivate a hypothesis and a test while leaving the intervention effect uncertain."
      ],
      [
        "A pilot has modeled net benefit +$800, but needs $900 cash upfront; only $600 is available. Savings range from $200 to $1,200, and complaints could offset gains. Which board recommendation connects evidence to the actual decision?",
        "Price a staged pilot within cash; predeclare benefit/harm stops",
        "Approve the $900 pilot because expected net benefit is positive",
        "Approve using the $1,200 case and defer complaint monitoring",
        "Reject all experimentation because the savings are uncertain",
        "Positive modeled value does not finance an unaffordable upfront outlay. A feasible staged design still needs credible benefit assumptions, costs and predeclared harm/benefit rules; uncertainty can justify bounded learning rather than either optimistic commitment or universal rejection."
      ]
    ],
    "mistakes": [
      "A rate increase does not identify which intervention will work.",
      "A recommendation without an owner or resource boundary may be impossible to execute."
    ],
    "takeaways": [
      "State the choice, owner and horizon.",
      "Separate observed differences from causal benefits."
    ],
    "lang": "python"
  },
  {
    "id": "story-impact",
    "comps": [
      "m1.c1"
    ],
    "title": "Build an impact range with explicit assumptions",
    "intro": "A logistics director considers a routing change. The analyst must connect minutes saved to usable capacity and money while showing which assumptions control the business case.",
    "sections": [
      [
        "Translate units before multiplying",
        "Start with a unit chain: eligible deliveries multiplied by minutes saved per delivery produces minutes saved, and dividing by sixty produces hours. Only hours that can be redeployed or removed from paid schedules become a financial benefit. A theoretical capacity improvement is valuable, but it should not be mislabeled as realized cash savings.",
        "Separate fixed costs, variable costs and one-time implementation costs. A saved hour during a fixed staffed shift may enable more work without reducing payroll. Ask operations which mechanism would realize the benefit. Avoid adding benefits measured over incompatible horizons or counting the same productivity improvement as both lower cost and extra revenue."
      ],
      [
        "Use a range and a reversal threshold",
        "A scenario table varies consequential assumptions, such as eligible volume and realized minutes saved. It is not automatically a statistical confidence interval: its endpoints may be judgmental planning cases. Label the origin of each range and explain which assumption most changes the decision.",
        "The fixture computes low and high gross value and the break-even minutes per delivery under a simple linear model. It ignores scheduling indivisibility, seasonal changes and service tradeoffs. A manager should validate those conditions before approving a rollout, then compare realized outcomes with the assumptions used to justify the action."
      ]
    ],
    "problem": "Calculate a planning range and the break-even improvement.",
    "steps": [
      "Define the population, units and decision before calculating.",
      "Run the synthetic fixture and inspect intermediate values against its declared contract.",
      "Explain the result, boundary conditions and the action that the evidence supports."
    ],
    "code": "volume=1200\nhour_value=24\ncost=600\nfor minutes in [1,3]:\n print(int(volume*minutes/60*hour_value-cost))\nprint(round(cost*60/(volume*hour_value),2))",
    "expect": "-120\n840\n1.25",
    "limit": "This Python linear sensitivity model describes assumed value net of a one-time cost. The range is not a confidence interval and the hourly value is not proof of cash recovery.",
    "practice": [
      [
        "What converts minutes to hours?",
        "Divide by sixty",
        "Multiply by sixty",
        "Divide by twelve",
        "Multiply by days",
        "There are sixty minutes in an hour, so total minutes must be divided by sixty."
      ],
      [
        "What is a fixed cost in this decision model?",
        "Unchanged scheduled cost",
        "Every per-unit charge",
        "Every saved minute",
        "Only a new order",
        "A fixed cost does not change with the modeled short-run volume or time saving."
      ],
      [
        "What is a break-even threshold?",
        "Where net value is zero",
        "The largest chart bar",
        "The median customer age",
        "The first data row",
        "At break-even the modeled benefits exactly offset the relevant costs."
      ],
      [
        "A saved driver hour cannot reduce payroll this quarter. How should it be described?",
        "Released capacity",
        "Guaranteed cash savings",
        "New revenue already earned",
        "A paid invoice refund",
        "Usable time can be capacity without producing a cash reduction under fixed schedules."
      ],
      [
        "A planner labels optimistic and pessimistic guesses a 95% interval. What is wrong?",
        "No probability basis",
        "The range is too wide",
        "All ranges are invalid",
        "Only a rounding issue",
        "A confidence level needs an inferential construction; judgmental cases are scenario ranges."
      ],
      [
        "A project counts saved labor twice under two headings. What is the issue?",
        "Double counting value",
        "Too few charts",
        "A missing filename",
        "A different currency sign",
        "The same economic benefit must not be added again under a second label."
      ],
      [
        "A decision reverses when savings fall below 1.25 minutes. What should be prioritized?",
        "Validate that assumption",
        "Polish only the title",
        "Add irrelevant scenarios",
        "Hide the threshold",
        "Evidence about a decision-sensitive assumption is especially valuable before committing resources."
      ]
    ],
    "formal": [
      [
        "Which quantity has units of hours?",
        "Minutes divided by sixty",
        "Deliveries times currency",
        "Currency divided by years",
        "Hours times minutes",
        "Unit cancellation converts minutes into hours through the sixty-minute conversion factor."
      ],
      [
        "What is a scenario range?",
        "Results under assumptions",
        "A guaranteed probability band",
        "A randomization procedure",
        "A source-system schema",
        "Scenario analysis varies explicit assumptions to show possible modeled consequences."
      ],
      [
        "What does sensitivity analysis examine?",
        "Response to assumptions",
        "Only sorting order",
        "Only chart dimensions",
        "Only field spelling",
        "Sensitivity analysis checks how changing inputs changes the modeled conclusion."
      ],
      [
        "A dispatch team estimates 200 hours saved but no mechanism to use them. What remains uncertain?",
        "Realizable benefit",
        "Arithmetic time units",
        "The definition of an hour",
        "The file format",
        "The organization must be able to redeploy or remove the hours to realize the stated economic value."
      ],
      [
        "A finance analyst adds annual revenue gains to one month of costs. What needs correction?",
        "The comparison horizon",
        "The report subtitle",
        "The customer key",
        "The column order",
        "Benefits and costs need a consistent time basis or a transparent discounted timeline."
      ],
      [
        "A cost model assumes every delivery saves three minutes. Which evidence is needed?",
        "Credible savings evidence",
        "Only the route names",
        "Only the invoice layout",
        "Only the previous slide",
        "The multiplication is useful only if the per-delivery time effect is supported and applicable."
      ],
      [
        "A pilot improves speed but increases damage claims. How should the business case change?",
        "Add damage costs",
        "Count time alone",
        "Ignore damage",
        "Subtract setup only",
        "An action can create offsetting harms, so net value must include relevant service consequences."
      ],
      [
        "A manager wants a single exact net benefit from uncertain inputs. What is better?",
        "A labeled range",
        "Highest estimate",
        "Most decimals",
        "Certain optimism",
        "A clearly labeled range exposes the dependence on uncertain assumptions and supports a robust choice."
      ],
      [
        "A rollout pays a one-time setup fee and recurring fees. What should the model distinguish?",
        "Cost timing",
        "Total fees",
        "Peak monthly bill",
        "Average unit cost",
        "One-time and recurring costs enter different periods and can change payback and long-run value."
      ],
      [
        "A project has positive expected value but breaches available cash in its first month. Which issue matters?",
        "Cash timing",
        "Annual value alone",
        "Significance alone",
        "Unit cost alone",
        "A positive modeled total does not eliminate cash constraints or the timing of expenditures."
      ]
    ],
    "mistakes": [
      "Freed time is not automatically reduced expenditure.",
      "Scenario endpoints do not acquire a probability interpretation from their labels."
    ],
    "takeaways": [
      "Track units and benefit realization.",
      "Test the assumptions that could reverse the decision."
    ],
    "lang": "python"
  },
  {
    "id": "story-confidence",
    "comps": [
      "m1.c1"
    ],
    "title": "Communicate uncertainty and recommend reversible action",
    "intro": "A quality team observes defects in a small shipment sample. Leadership needs a decision now, but the analyst must distinguish sampling uncertainty, selection bias and incomplete operational information.",
    "sections": [
      [
        "Separate kinds of uncertainty",
        "Sampling uncertainty concerns variation from observing a sample rather than every eligible unit. Measurement error concerns whether the defect was recorded correctly. Selection bias concerns whether inspected units represent the target shipment. A narrow interval for a biased convenience sample does not establish a reliable population estimate.",
        "Report the observed fraction with its numerator and denominator. For independent Bernoulli observations sampled appropriately, a Wilson interval is often more useful than a naive normal interval near zero or one. The confidence level describes a procedure’s long-run coverage under assumptions, not the probability that a fixed parameter lies in this particular computed interval."
      ],
      [
        "Match commitment to the evidence",
        "A recommendation may be to inspect more units, isolate a high-risk batch or run a small reversible pilot. Select an action using the cost of mistakes and the value of additional information. Low confidence does not require inaction when potential harm is high; it requires a clear explanation of why the chosen precaution is proportionate.",
        "The fixture implements the Wilson formula on five defects out of one hundred independent observations. It checks only the arithmetic. It cannot verify random sampling, independence or accurate inspection. Repeated inspection of the same item would violate the distinct-observation interpretation even if the code still runs."
      ]
    ],
    "problem": "Compute a Wilson interval and state its assumptions.",
    "steps": [
      "Define the population, units and decision before calculating.",
      "Run the synthetic fixture and inspect intermediate values against its declared contract.",
      "Explain the result, boundary conditions and the action that the evidence supports."
    ],
    "code": "import math\nx,n,z=5,100,1.96\np=x/n\nd=1+z*z/n\ncenter=(p+z*z/(2*n))/d\nhalf=z*math.sqrt(p*(1-p)/n+z*z/(4*n*n))/d\nprint(round(p,3))\nprint(round(center-half,3),round(center+half,3))",
    "expect": "0.05\n0.022 0.112",
    "limit": "Python implements the Wilson score interval for an independent binomial sampling model. This is not a check of selection bias, repeated units or inspection quality.",
    "practice": [
      [
        "Which number reveals sample support?",
        "The denominator",
        "The font size",
        "The file extension",
        "The chart border",
        "The denominator shows how many eligible observations support a reported proportion."
      ],
      [
        "What is selection bias?",
        "Unrepresentative inclusion",
        "Any random variation",
        "A larger confidence level",
        "A correct unit conversion",
        "Selection bias arises when inclusion systematically differs in ways relevant to the target inference."
      ],
      [
        "What does interval width often reflect?",
        "Estimation precision",
        "Guaranteed accuracy",
        "Causal identification",
        "A complete census",
        "Under a stated sampling model, width describes precision rather than freedom from every source of error."
      ],
      [
        "An inspector samples only easily reached boxes. What threatens generalization?",
        "Selection bias",
        "Only decimal rounding",
        "Only a long filename",
        "Only chart color",
        "Convenient boxes may differ systematically from the full shipment, regardless of the sample calculation."
      ],
      [
        "A narrow interval uses 100 repeated checks of one item. What failed?",
        "Independent-unit sampling",
        "Only the interval label",
        "Only the unit conversion",
        "Only a plotting rule",
        "Repeated checks of one item do not constitute one hundred independent shipment units."
      ],
      [
        "A safety issue may be costly and the evidence is uncertain. Which action can be justified?",
        "A proportionate precaution",
        "A causal certainty claim",
        "A hidden sample count",
        "A universal no-action rule",
        "The decision should consider consequences and reversibility alongside uncertainty, not require certainty in every case."
      ],
      [
        "A report says a fixed defect rate has 95% probability in its frequentist interval. What needs correction?",
        "Coverage interpretation",
        "The defect numerator",
        "The sample denominator",
        "The measurement unit",
        "Frequentist confidence refers to repeated-sampling coverage of the procedure under its assumptions."
      ]
    ],
    "formal": [
      [
        "Which uncertainty arises from sampling rather than a census?",
        "Sampling variability",
        "A file naming error",
        "Only instrument bias",
        "Only a missed decision",
        "Different eligible samples can produce different estimates even with accurate measurements."
      ],
      [
        "What is measurement error?",
        "Incorrect recorded values",
        "A correct random draw",
        "An unchanged sample size",
        "A labeled denominator",
        "Measurement error concerns the difference between recorded and intended observations."
      ],
      [
        "What makes a decision reversible?",
        "It can be revised cheaply",
        "It has no uncertainty",
        "It needs no evidence",
        "It uses no resources",
        "Reversibility limits commitment cost and can make a bounded pilot appropriate under uncertainty."
      ],
      [
        "A defect estimate omits inspected count. What should the analyst add?",
        "Cases and denominator",
        "A second logo",
        "Only bold formatting",
        "Only the maximum defect",
        "The numerator and denominator reveal the observed rate and its evidence base."
      ],
      [
        "A team increases a convenience sample from 100 to 10000 boxes. What may remain?",
        "Systematic selection bias",
        "The same sampling noise",
        "Zero measured information",
        "A guaranteed representative set",
        "A larger sample can reduce random error without removing systematic differences in who is included."
      ],
      [
        "A manager sees overlapping intervals and concludes exact equality. What is wrong?",
        "Overlap is not equality",
        "Intervals imply causation",
        "Samples cannot differ",
        "All uncertainty vanished",
        "Overlapping intervals do not establish equality; the relevant contrast needs its own analysis and decision margin."
      ],
      [
        "A pilot is cheap to reverse but a full rollout is costly. What fits weak initial evidence?",
        "A bounded pilot",
        "Prove equality",
        "Compare CI overlap",
        "Pick smaller estimate",
        "A limited pilot can create information while constraining the cost of a mistaken commitment."
      ],
      [
        "A confidence interval excludes zero in a large sample but the effect is tiny. What else matters?",
        "Practical impact",
        "Sample size alone",
        "Interval width alone",
        "Significance alone",
        "Statistical evidence of a nonzero effect does not establish a benefit large enough to justify action."
      ],
      [
        "A plant censors failed inspections before reporting quality. Which uncertainty is understressed?",
        "Selection bias",
        "Random error",
        "Interval width",
        "Sample size",
        "Selective missing failures can systematically bias the defect estimate beyond the computed sampling interval."
      ],
      [
        "A team must choose between more measurement and immediate mitigation. Which comparison supports it?",
        "Learning versus harm",
        "Maximize sample size",
        "Wait for certainty",
        "Use point estimate",
        "The expected value of better information must be weighed against delay, potential harm and the cost of reversible precautions."
      ]
    ],
    "mistakes": [
      "A small interval cannot repair a biased sampling process.",
      "Statistical significance alone does not determine whether an action is worthwhile."
    ],
    "takeaways": [
      "Describe sampling, measurement and selection limits separately.",
      "Use evidence strength and error costs to choose commitment."
    ],
    "lang": "python"
  },
  {
    "id": "story-randomize",
    "comps": [
      "m2.c1"
    ],
    "title": "Design a randomized comparison around the decision",
    "intro": "A retailer wants to test a checkout reminder. Random assignment creates comparable groups in expectation, but the design must define the unit, treatment and outcome before anybody inspects which result looks best.",
    "sections": [
      [
        "Choose units that can receive independent treatment",
        "The randomization unit is the entity assigned to an intervention, such as an account, store or household. The analysis must respect that choice. If stores are randomized but thousands of receipts are analyzed as independent assignments, the precision will generally be overstated because receipts within a store share conditions.",
        "Define eligibility, assignment timing, treatment delivery and a primary outcome before launch. An intention-to-treat comparison retains assigned units even if some do not receive or use the treatment. It estimates the effect of assignment under the tested delivery process; an as-treated comparison can reintroduce selection because uptake is often related to outcome risk."
      ],
      [
        "Protect the comparison",
        "A control group should experience the same observation process and calendar conditions as the treatment group. Prevent contamination when treated units influence controls. Choose a duration that captures the relevant business cycle, and use guardrail measures such as complaints so that optimizing conversion does not conceal customer harm.",
        "The fixture uses a local seeded generator to assign eight synthetic accounts and verifies disjoint, exhaustive membership. A seed makes the illustration reproducible but does not make the resulting small groups perfectly balanced or adequately powered. In practice, assignment must also be durable so a returning account does not change groups after refresh."
      ]
    ],
    "problem": "Produce reproducible, disjoint treatment groups for synthetic accounts.",
    "steps": [
      "Define the population, units and decision before calculating.",
      "Run the synthetic fixture and inspect intermediate values against its declared contract.",
      "Explain the result, boundary conditions and the action that the evidence supports."
    ],
    "code": "import random\nids=list(range(8))\nrandom.Random(7).shuffle(ids)\na=set(ids[:4]);b=set(ids[4:])\nprint(len(a),len(b),len(a & b))\nprint(a | b == set(range(8)))",
    "expect": "4 4 0\nTrue",
    "limit": "Python validates allocation membership only. It does not demonstrate statistical power, balanced covariates, durable assignment or a treatment effect.",
    "practice": [
      [
        "What is the randomization unit?",
        "The assigned entity",
        "The plotted marker",
        "The outcome total",
        "The export format",
        "The randomization unit receives a treatment assignment and determines the design’s independent allocation units."
      ],
      [
        "What does intention-to-treat preserve?",
        "Original assignment",
        "Only treatment users",
        "Only successful outcomes",
        "Only complete invoices",
        "Intention-to-treat compares groups as assigned, preserving the randomized comparison despite nonadherence."
      ],
      [
        "Why preregister a primary outcome?",
        "Limit result selection",
        "Guarantee a positive lift",
        "Avoid all measurement",
        "Eliminate sample variation",
        "A prespecified primary outcome limits choosing whichever measured result happens to look favorable."
      ],
      [
        "A store test treats receipts as independent randomized units. What needs correction?",
        "Clustering in analysis",
        "Only receipt labels",
        "Only product names",
        "Only the currency symbol",
        "Receipts share the store-level assignment and conditions, so the analysis must account for clustered units."
      ],
      [
        "Users can see different variants after refreshing. What design property is missing?",
        "Durable assignment",
        "A larger chart",
        "More decimal places",
        "A wider date window",
        "A stable unit should retain its assignment so exposure and outcome interpretation remain coherent."
      ],
      [
        "A discount spills from treated friends to controls. What is threatened?",
        "Group separation",
        "Only table formatting",
        "Only random seed choice",
        "Only the output precision",
        "Spillovers contaminate the comparison because control outcomes can be affected by treatment assignment elsewhere."
      ],
      [
        "A conversion test raises complaints sharply. Which preplanned measure matters?",
        "A guardrail outcome",
        "Only primary lift",
        "Only sample counts",
        "Only the sales logo",
        "Guardrails protect important harms that a single optimized business metric can overlook."
      ]
    ],
    "formal": [
      [
        "What does random assignment aim to remove?",
        "Systematic allocation bias",
        "All sampling variation",
        "Every measurement error",
        "All possible spillovers",
        "Random assignment balances causes in expectation and supports a causal comparison under the design assumptions."
      ],
      [
        "What is a control group?",
        "A comparison condition",
        "The largest customer group",
        "Only dissatisfied users",
        "Only the first users",
        "The control defines the alternative against which treatment assignment is evaluated."
      ],
      [
        "What is treatment contamination?",
        "Exposure crosses groups",
        "The file is compressed",
        "The sample is sorted",
        "The chart is labeled",
        "Contamination occurs when units receive influences inconsistent with their assigned comparison condition."
      ],
      [
        "An analyst excludes assigned nonusers from only the treatment group. What is at risk?",
        "Randomized comparability",
        "Only report length",
        "Only the sample title",
        "Only storage cost",
        "Uptake may depend on outcome-related traits, so excluding nonusers selectively can bias the comparison."
      ],
      [
        "A household shares one shopping account across devices. Which allocation unit may reduce crossover?",
        "The account or household",
        "Each page refresh",
        "Each rendered image",
        "Each payment character",
        "A stable shared entity can better match treatment exposure than ephemeral device or page events."
      ],
      [
        "A team ends an experiment before the weekend although weekends dominate sales. What needs review?",
        "Business-cycle coverage",
        "Only the seed value",
        "Only customer initials",
        "Only page margins",
        "The observation period should represent the relevant demand cycle and the intended decision horizon."
      ],
      [
        "A random split yields different average ages in a small sample. What follows?",
        "Chance imbalance",
        "Age must match",
        "Imbalance proves fraud",
        "Drop unmatched ages",
        "Random assignment balances characteristics in expectation rather than guaranteeing exact sample equality."
      ],
      [
        "A product team chooses the best of twenty unplanned conversion metrics. What is the concern?",
        "Outcome selection",
        "Precision alone",
        "Positive lift alone",
        "Denominator size",
        "Searching many outcomes and presenting only the best overstates the evidence unless the selection is addressed."
      ],
      [
        "A treatment is assigned to regions but reporting ignores within-region dependence. Which evidence is overstated?",
        "Independent precision",
        "Receipt count",
        "Event timestamps",
        "Conservative precision",
        "Many observations within the same assigned region do not supply the same information as independently assigned regions."
      ],
      [
        "A manager wants the effect of deploying the offer under normal nonadherence. Which estimand is closest?",
        "Assignment effect",
        "Effect among users",
        "Nonusers excluded",
        "Best subgroup lift",
        "The intention-to-treat assignment effect includes real delivery and uptake behavior relevant to deployment."
      ]
    ],
    "mistakes": [
      "A random seed does not guarantee balanced small groups.",
      "Dropping nonadherent units can undermine the assigned comparison."
    ],
    "takeaways": [
      "Specify the unit, primary outcome and guardrails.",
      "Match analysis and interpretation to the assignment design."
    ],
    "lang": "python"
  },
  {
    "id": "story-effects",
    "comps": [
      "m2.c1"
    ],
    "title": "Distinguish absolute lift, relative lift and practical value",
    "intro": "An experiment reports an increase from 8% to 10% purchase conversion. Stakeholders may hear either a modest two-point gain or a large 25% lift; both numbers need the baseline and a decision-relevant scale.",
    "sections": [
      [
        "State the estimand and scale",
        "An absolute difference subtracts the control rate from the treatment rate. For percentages, report this in percentage points. A relative lift divides that difference by the control rate and is undefined when the baseline is zero. The two representations answer different questions and should never be interchanged silently.",
        "The estimand is the quantity the design seeks to estimate: for example, the average effect of assignment on a customer’s purchase indicator during fourteen days. Report denominators, assignment unit and the analysis window alongside the result. An observed purchase count alone does not show lift when eligible group sizes differ."
      ],
      [
        "Connect inference to business significance",
        "A confidence interval for a rate difference depends on the sampling design and assumptions. The elementary normal approximation used in the fixture is appropriate only as an illustration with sufficiently large independent groups and ordinary nonextreme proportions. Clustered assignment, rare events, sequential monitoring and dependence need methods that reflect those features.",
        "A statistically distinguishable difference can still be economically unattractive after discounts, operating cost or customer harm. Compare the estimated effect and uncertainty with a prespecified minimum worthwhile improvement. If the decision margin lies inside the uncertainty interval, additional information may be useful even when a conventional zero-effect test is significant."
      ]
    ],
    "problem": "Calculate absolute and relative conversion lift and a simple standard error.",
    "steps": [
      "Define the population, units and decision before calculating.",
      "Run the synthetic fixture and inspect intermediate values against its declared contract.",
      "Explain the result, boundary conditions and the action that the evidence supports."
    ],
    "code": "import math\npc,pt,nc,nt=80/1000,100/1000,1000,1000\nd=pt-pc\nse=math.sqrt(pc*(1-pc)/nc+pt*(1-pt)/nt)\nprint(round(d*100,1),round(d/pc*100,1))\nprint(round((d-1.96*se)*100,2),round((d+1.96*se)*100,2))",
    "expect": "2.0 25.0\n-0.51 4.51",
    "limit": "Python computes a descriptive contrast and an unpooled normal-approximation interval for independent groups. It does not validate the experiment design or justify this approximation for rare, clustered or sequentially monitored data.",
    "practice": [
      [
        "What is the absolute change from 8% to 10%?",
        "Two percentage points",
        "Twenty-five points",
        "Two hundred percent",
        "Ten percentage points",
        "Subtracting percentages gives 10 minus 8, or two percentage points."
      ],
      [
        "What is relative lift measured against?",
        "The baseline rate",
        "The chart width",
        "The larger group only",
        "The file’s row count",
        "Relative lift divides the absolute rate difference by the comparison baseline."
      ],
      [
        "What is an estimand?",
        "The target quantity",
        "The first table row",
        "An image annotation",
        "The raw file name",
        "An estimand specifies the population quantity and contrast the analysis intends to estimate."
      ],
      [
        "A treatment has more purchases but twice as many eligible users. What should be compared?",
        "Eligible purchase rates",
        "Purchase totals alone",
        "Only peak daily orders",
        "Only the assignment date",
        "Unequal group sizes make raw purchase counts insufficient to describe conversion differences."
      ],
      [
        "A report calls a two-point increase a two-percent relative lift. What is wrong?",
        "Scale confusion",
        "A missing random seed",
        "A larger sample size",
        "Only an axis problem",
        "Percentage-point change and percentage change relative to a baseline are different scales."
      ],
      [
        "An interval spans both losses and worthwhile gains. What should the recommendation acknowledge?",
        "Decision uncertainty",
        "A guaranteed benefit",
        "Certain equivalence",
        "An automatic rollout",
        "The range includes materially different consequences, so the decision requires uncertainty and error-cost reasoning."
      ],
      [
        "A tiny effect is significant but costs more than it earns. What matters?",
        "Net practical value",
        "Only the p-value",
        "Only the font size",
        "Only the sample rank",
        "Statistical evidence alone does not make an intervention economically or operationally worthwhile."
      ]
    ],
    "formal": [
      [
        "When is relative lift undefined?",
        "A zero baseline",
        "Equal sample sizes",
        "A common time window",
        "A labeled numerator",
        "Dividing a difference by a zero comparison rate is undefined."
      ],
      [
        "Which scale comes from subtracting two percentage rates?",
        "Percentage points",
        "Currency per hour",
        "Relative percent by default",
        "Only an odds ratio",
        "The direct difference of percentages is expressed in percentage points."
      ],
      [
        "What does a minimum worthwhile effect encode?",
        "The decision threshold",
        "The largest observed result",
        "The null by definition",
        "The table’s row count",
        "It represents the smallest improvement large enough to matter for the intended action."
      ],
      [
        "A team highlights 50% relative growth from a tiny baseline. What else is essential?",
        "Absolute effect and baseline",
        "Only a brighter arrow",
        "Only the relative result",
        "Only the maximum daily rate",
        "The absolute magnitude and original baseline prevent a large relative number from obscuring a small impact."
      ],
      [
        "A clustered experiment uses an independent-user standard error. What needs revision?",
        "The uncertainty model",
        "Only rate arithmetic",
        "Only category labels",
        "Only graph resolution",
        "Shared assignment and correlated outcomes require an uncertainty calculation reflecting the cluster structure."
      ],
      [
        "A confidence interval excludes zero but not a costly rollout’s break-even gain. What is unresolved?",
        "Economic adequacy",
        "Whether arithmetic exists",
        "Whether a rate is bounded",
        "Whether any data was collected",
        "Evidence of a nonzero effect may still leave doubt that the gain exceeds the required business threshold."
      ],
      [
        "A trial has two purchases in one group and none in another. What deserves scrutiny?",
        "Approximation fit",
        "Use normal interval",
        "Drop zero group",
        "Assume zero risk",
        "Sparse events and extreme rates can make elementary normal approximations unreliable."
      ],
      [
        "A dashboard combines a fourteen-day treatment window with a seven-day control window. What is wrong?",
        "Unequal time windows",
        "Allocation ratio",
        "Purchase totals",
        "Group sizes",
        "Groups must be compared over a coherent observation window or adjusted with a justified exposure model."
      ],
      [
        "A positive conversion change accompanies lower profit per customer. Which conclusion is strongest?",
        "Recheck value",
        "Roll out for conversion",
        "Ignore margin",
        "Pick most precise metric",
        "The action’s objective may be profit or long-term value, so conversion alone can favor a harmful intervention."
      ],
      [
        "A team wants to declare practical equivalence from a nonsignificant result. What is missing?",
        "Equivalence testing",
        "A null test alone",
        "CI overlap alone",
        "Equal sample rates",
        "Failure to reject zero does not establish equivalence; a prespecified margin and suitable uncertainty analysis are needed."
      ]
    ],
    "mistakes": [
      "Relative lift can exaggerate the impression of a small absolute effect.",
      "A nonsignificant result does not establish that effects are equal."
    ],
    "takeaways": [
      "Report baseline, absolute and relative effects together.",
      "Compare uncertainty with a business threshold."
    ],
    "lang": "python"
  },
  {
    "id": "story-attribution",
    "comps": [
      "m2.c1"
    ],
    "title": "Challenge attribution with confounding, timing and selection",
    "intro": "A marketing report attributes higher revenue to a campaign launched during a holiday week. The analyst must explain which competing mechanisms are still consistent with the observed increase.",
    "sections": [
      [
        "Describe a causal mechanism without assuming it",
        "A causal claim states that changing an intervention would change an outcome, holding the relevant comparison conditions appropriately defined. A correlation states that variables move together in the observed data. A common cause can affect both the apparent treatment and the outcome: affluent customers may be more likely to join a loyalty program and spend more even without it.",
        "Before-and-after comparisons are vulnerable to seasonality, concurrent campaigns, price changes and changes in measured population. A comparison group can help, but only under additional assumptions. Difference-in-differences requires a credible parallel-trends counterfactual and attention to anticipation, changing composition and spillovers; the subtraction alone does not establish those conditions."
      ],
      [
        "Use diagnostics to narrow claims",
        "Review preintervention trends, treatment timing, eligibility and collection processes. These checks can reveal problems but do not prove the absence of every confounder. Avoid controlling for variables caused by the treatment when estimating its total effect, because that can remove part of the effect or introduce bias.",
        "The fixture calculates a two-group before/after contrast. Both groups rise, but the treated group rises more. The calculation verifies a difference-in-differences number, not a causal effect: a treatment-specific concurrent promotion would remain an alternative explanation. State this distinction when presenting the result and propose a stronger design if the decision warrants it."
      ]
    ],
    "problem": "Calculate a before/after contrast and a comparison-adjusted contrast.",
    "steps": [
      "Define the population, units and decision before calculating.",
      "Run the synthetic fixture and inspect intermediate values against its declared contract.",
      "Explain the result, boundary conditions and the action that the evidence supports."
    ],
    "code": "treated_before,treated_after=100,140\ncontrol_before,control_after=80,100\nraw=treated_after-treated_before\nadjusted=raw-(control_after-control_before)\nprint(raw,adjusted)\nprint(\"parallel trends requires evidence\")",
    "expect": "40 20\nparallel trends requires evidence",
    "limit": "Python verifies the contrast arithmetic. It does not test parallel counterfactual trends, rule out concurrent interventions or supply causal identification.",
    "practice": [
      [
        "What is a confounder?",
        "A common cause",
        "A chart legend",
        "A random filename",
        "An outcome timestamp",
        "A common cause can influence both treatment exposure and the measured outcome, distorting an association."
      ],
      [
        "Does correlation alone establish causation?",
        "No",
        "Always",
        "Only if positive",
        "Only if visually strong",
        "Association is compatible with confounding, reverse causation and selection as well as a causal effect."
      ],
      [
        "What does difference-in-differences subtract?",
        "Changes across groups",
        "Only the first value",
        "Only the largest group",
        "Every missing record",
        "The contrast compares the treated group’s change with the comparison group’s change."
      ],
      [
        "A campaign launches at the holiday peak. What competing explanation matters?",
        "Seasonal demand",
        "Only chart width",
        "Only the report font",
        "Only export timing",
        "Holiday demand can change sales independently of the campaign and confound a before/after claim."
      ],
      [
        "Loyalty members spend more than nonmembers. What might explain this without a program effect?",
        "Self-selection",
        "Only rounding error",
        "Only a chart legend",
        "Only currency units",
        "Customers who choose membership may already differ in spending propensity from nonmembers."
      ],
      [
        "A model adjusts for purchases made after the campaign. What should be reviewed?",
        "Post-treatment control",
        "Only variable spelling",
        "Only the date format",
        "Only table sorting",
        "A variable affected by treatment can mediate the effect or introduce bias when used as a control."
      ],
      [
        "Pretrends look similar. Does that prove parallel counterfactual trends later?",
        "No proof of future trends",
        "Yes with enough pixels",
        "Yes if the lines overlap",
        "Only with the same title",
        "Historical diagnostics support a plausibility argument but cannot prove an unobserved post-treatment counterfactual."
      ]
    ],
    "formal": [
      [
        "What is reverse causation?",
        "Outcome drives exposure",
        "Exposure is randomized",
        "All values are missing",
        "A legend is reversed",
        "The observed direction of association may arise because the outcome or its precursors affect exposure."
      ],
      [
        "Which assumption supports a simple difference-in-differences interpretation?",
        "Parallel trends",
        "Equal chart colors",
        "Equal file sizes",
        "Identical observed levels",
        "The groups need comparable counterfactual changes without treatment, not necessarily equal starting levels."
      ],
      [
        "What is a post-treatment variable?",
        "A treatment consequence",
        "Any earlier measurement",
        "Only an account identifier",
        "Only a control assignment",
        "A variable downstream of treatment may carry part of its effect or create problematic conditioning."
      ],
      [
        "A retailer reports a raw 40-unit gain while the comparison rises 20. What does subtraction show?",
        "A 20-unit contrast",
        "A proven 40-unit effect",
        "A proven 20-unit effect",
        "No observed change",
        "The adjusted observed contrast is twenty, but causal meaning still depends on design assumptions."
      ],
      [
        "A treated store alone changes its opening hours during the campaign. What threatens attribution?",
        "A concurrent intervention",
        "Only unequal starting levels",
        "Only the chart ordering",
        "Only a new store label",
        "The hours change can cause an additional outcome change specific to treatment stores."
      ],
      [
        "Customers join a program after their spending rises. Which direction is plausible?",
        "Spending drives joining",
        "Joining must drive spending",
        "Neither can be related",
        "The association is randomized",
        "Prior spending can influence participation, creating reverse-causal or selection explanations for an observed association."
      ],
      [
        "A comparison region receives spillover advertising. What is compromised?",
        "Untreated status",
        "Baseline equality",
        "Any treated gain",
        "Comparison size",
        "An affected comparison group no longer directly represents the intended no-treatment condition."
      ],
      [
        "A policy changes who qualifies for a dashboard during the test. What must be checked?",
        "Population change",
        "Random error",
        "Raw contrast",
        "Interval width",
        "Changing eligibility can alter observed outcomes through who is included rather than treatment response."
      ],
      [
        "A pretrend check fails strongly. What is the responsible response?",
        "Revisit identification",
        "Drop bad preperiods",
        "Collect more rows",
        "Keep causal claim",
        "Differential prior trends undermine the simple parallel-trends argument and require a better design or a narrower claim."
      ],
      [
        "A large observational association has tiny sampling error. What still limits causality?",
        "Confounding",
        "Interval width",
        "Significance",
        "Coefficient count",
        "Precision measures random uncertainty under a model and does not remove systematic alternative explanations."
      ]
    ],
    "mistakes": [
      "A comparison-adjusted subtraction is not automatic causal identification.",
      "Controlling for every available variable can introduce bias."
    ],
    "takeaways": [
      "List plausible alternative explanations.",
      "Explain the assumptions needed for attribution."
    ],
    "lang": "python"
  },
  {
    "id": "story-executive",
    "comps": [
      "m3.c1"
    ],
    "title": "Write an executive recommendation with evidence and caveats",
    "intro": "An operations executive has two minutes to choose whether to fund a pilot. The analyst must lead with the choice and business consequence while retaining the uncertainty that could change the decision.",
    "sections": [
      [
        "Structure a decision memo",
        "Lead with the proposed action, expected impact range and required resource commitment. Follow with the strongest relevant evidence, the principal uncertainty and a decision trigger. The executive summary should be independently understandable: abbreviations, denominators and horizons cannot depend on access to a technical appendix.",
        "A useful headline states what was observed or recommended without overstating causality. Separate actual results from forecasts and planning assumptions. If the recommendation is conditional on obtaining more evidence, state exactly what result would support expansion, revision or stopping. Avoid vague requests to monitor progress without an owner and a date."
      ],
      [
        "Keep important qualifications close to the claim",
        "A caveat that could reverse the choice belongs near the recommendation, not hidden after several pages. Secondary diagnostics can live in an appendix with a clear link. Tailor detail to the executive’s decision authority while preserving metric meaning and traceability for later review.",
        "The fixture builds a compact synthetic decision record and checks that essential fields are present. This supports a consistent memo contract but cannot judge persuasive writing, organizational feasibility or whether the evidence truly supports the recommendation. A human reviewer should test whether the lead sentence and limitation can be understood without the analyst present."
      ]
    ],
    "problem": "Check the minimal fields needed for an actionable decision record.",
    "steps": [
      "Define the population, units and decision before calculating.",
      "Run the synthetic fixture and inspect intermediate values against its declared contract.",
      "Explain the result, boundary conditions and the action that the evidence supports."
    ],
    "code": "memo={\"action\":\"pilot in two depots\",\"owner\":\"operations lead\",\"horizon\":\"four weeks\",\"impact\":\"assumed 120 to 840 net\",\"risk\":\"time savings not yet causal\",\"trigger\":\"expand only after net-value review\"}\nrequired={\"action\",\"owner\",\"horizon\",\"impact\",\"risk\",\"trigger\"}\nprint(required <= memo.keys())\nprint(memo[\"action\"],memo[\"horizon\"])",
    "expect": "True\npilot in two depots four weeks",
    "limit": "Python checks presence of memo fields, not the truth of their values, quality of the writing or actual management approval.",
    "practice": [
      [
        "What should lead a decision memo?",
        "The proposed action",
        "Every query line",
        "A long glossary",
        "The file history",
        "A decision memo starts with what the owner should decide and why it matters."
      ],
      [
        "Where should a decision-reversing caveat appear?",
        "Near the main claim",
        "Only in hidden notes",
        "Only in raw logs",
        "Nowhere if inconvenient",
        "A material limitation needs visibility where the decision is presented."
      ],
      [
        "What makes a monitoring trigger useful?",
        "A defined response rule",
        "An unspecified check",
        "A decorative icon",
        "A larger slide deck",
        "A trigger states what evidence should lead to expansion, revision or stopping."
      ],
      [
        "An executive sees a projected gain described as achieved revenue. What must change?",
        "Forecast labeling",
        "Only slide margins",
        "Only the currency font",
        "Only the appendix title",
        "Assumed future impact and observed outcomes are different evidence categories and must be labeled clearly."
      ],
      [
        "A summary says improve operations but names no action. What is missing?",
        "A concrete choice",
        "A second data export",
        "A more colorful chart",
        "A broader slogan",
        "A recommendation must specify a feasible action rather than merely restating a desired outcome."
      ],
      [
        "A caveat in page 20 could reverse the funding choice. What is appropriate?",
        "Move it beside the ask",
        "Shrink the appendix font",
        "Omit it for brevity",
        "Add more unrelated charts",
        "Material uncertainty belongs beside the decision so the executive can evaluate the proposal fairly."
      ],
      [
        "A pilot memo has no review owner or date. Which improvement helps?",
        "Assign accountability",
        "Only shorten the title",
        "Only add a logo",
        "Only rename the file",
        "A named owner and review horizon make the recommendation actionable and revisitable."
      ]
    ],
    "formal": [
      [
        "What is an executive summary’s main purpose?",
        "Support a bounded decision",
        "Archive every raw record",
        "Replace all technical work",
        "Guarantee a favorable result",
        "The summary connects relevant evidence, impact and uncertainty to a choice the reader can authorize."
      ],
      [
        "What should distinguish forecast from observation?",
        "Explicit evidence labels",
        "Only different fonts",
        "Only separate file names",
        "Only the author’s initials",
        "Labels communicate whether a number is measured or depends on future assumptions."
      ],
      [
        "What is a stopping rule in a pilot memo?",
        "A condition to halt",
        "A fixed chart width",
        "A list of file names",
        "A hidden preference",
        "A stopping rule defines evidence or harm that should end or revise the intervention."
      ],
      [
        "A CEO asks for the funding requirement and sees only model accuracy. What needs adding?",
        "Resource commitment",
        "Every model coefficient",
        "Only source-code comments",
        "Only a new diagram",
        "The decision requires costs and resources as well as evidence about analytical performance."
      ],
      [
        "A headline says the pilot caused growth although it used a convenience sample. What is required?",
        "Narrow the claim",
        "Use a larger typeface",
        "Repeat the headline",
        "Hide the sample method",
        "The claim must match the design’s inferential limits and distinguish observed association from causal effect."
      ],
      [
        "A memo lists ten equally prominent findings. How can the analyst help the decision?",
        "Prioritize key facts",
        "Sort only alphabetically",
        "Remove all caveats",
        "Make every chart larger",
        "The reader needs the findings that affect the choice and its risks, with secondary detail available separately."
      ],
      [
        "An executive forwards only the first page. What should that page retain?",
        "Action and limits",
        "Favorable mean alone",
        "Name and budget",
        "A chart alone",
        "An independently understandable lead page includes the recommendation, evidence basis and limitations that could change the choice."
      ],
      [
        "A dashboard says monitor weekly without defining a response. What is absent?",
        "A decision trigger",
        "Frequent refresh",
        "A date stamp",
        "An overall average",
        "Monitoring is actionable when a threshold or pattern leads to a specified review or response."
      ],
      [
        "A director requests a yes/no answer under uncertainty. What is most useful?",
        "Conditional advice",
        "Use largest estimate",
        "Yes if mean positive",
        "Refuse comparison",
        "A conditional recommendation states the preferred action, the assumptions behind it and when the choice should change."
      ],
      [
        "A summary omits a rare but severe harm because the average gain is positive. What should review require?",
        "Material harms",
        "Precise mean alone",
        "Expected value alone",
        "Rarity alone",
        "Consequential downside risks can affect the decision even when the mean modeled benefit is favorable."
      ]
    ],
    "mistakes": [
      "Short summaries still need material limitations.",
      "A recommendation without accountability may never be evaluated."
    ],
    "takeaways": [
      "Lead with action, impact and uncertainty.",
      "State who reviews which evidence and when."
    ],
    "lang": "python"
  },
  {
    "id": "story-operational",
    "comps": [
      "m3.c1"
    ],
    "title": "Give managers an executable handoff and feedback loop",
    "intro": "A regional manager receives an approved pilot recommendation. Translating that choice into daily work requires eligibility rules, ownership, exception handling and a way to tell whether the plan was delivered as intended.",
    "sections": [
      [
        "Turn the recommendation into a workflow",
        "Managers need to know which records qualify, what action each role performs, when it happens and what to do with exceptions. Supply a worked example with a clearly ineligible record so staff can distinguish scope from convenience. Preserve a stable identifier linking the action log to the outcome, with access limited to the operational need.",
        "Distinguish implementation fidelity from outcome success. If the intervention was rarely delivered, a weak outcome may reflect delivery failure rather than an ineffective idea. Track assigned cases, contacted cases, completion and reasons for noncompletion without redefining the causal analysis population after observing results."
      ],
      [
        "Create an honest operational feedback loop",
        "Specify freshness expectations, escalation conditions and a named owner for unexpected cases. A manager should be able to pause delivery when guardrails breach a threshold. Document any protocol changes with dates because mid-pilot changes can alter the interpretation of results.",
        "The synthetic fixture filters an eligibility list, tracks completed contacts and reports coverage among eligible accounts. It demonstrates that delivery rate is a separate measure from retention outcome. The code does not authorize contacting real customers, check consent or validate a causal effect; those responsibilities remain in the real workflow and experimental design."
      ]
    ],
    "problem": "Compute delivery coverage without changing the assigned population.",
    "steps": [
      "Define the population, units and decision before calculating.",
      "Run the synthetic fixture and inspect intermediate values against its declared contract.",
      "Explain the result, boundary conditions and the action that the evidence supports."
    ],
    "code": "records=[{\"id\":1,\"eligible\":True},{\"id\":2,\"eligible\":False},{\"id\":3,\"eligible\":True}]\neligible={r[\"id\"] for r in records if r[\"eligible\"]}\ncontacted={1}\nprint(sorted(eligible))\nprint(len(contacted & eligible)/len(eligible))\nprint(len(eligible))",
    "expect": "[1, 3]\n0.5\n2",
    "limit": "Python checks a small eligibility and delivery-coverage model. It does not execute an operational campaign, establish permissions or estimate retention impact.",
    "practice": [
      [
        "What defines operational scope?",
        "Eligibility rules",
        "The chart palette",
        "The author’s title",
        "The image format",
        "Eligibility rules state which cases should receive the proposed workflow."
      ],
      [
        "What does delivery coverage measure?",
        "Eligible cases reached",
        "Causal retention effect",
        "Forecast certainty",
        "Only the total revenue",
        "Coverage measures implementation reach, which is separate from the effect of the intervention."
      ],
      [
        "What supports accountable handoff?",
        "A named workflow owner",
        "An anonymous screenshot",
        "An untracked file",
        "A vague aspiration",
        "A named owner can maintain the workflow, handle exceptions and review outcomes."
      ],
      [
        "Half of assigned customers receive a call. Which metric describes this gap?",
        "Delivery fidelity",
        "Guaranteed treatment harm",
        "Pure sampling precision",
        "A causal success rate",
        "The fraction reached describes whether the intervention was delivered as planned."
      ],
      [
        "Staff cannot classify an unusual eligibility case. What should the handoff provide?",
        "An escalation route",
        "Permission to guess",
        "A larger chart",
        "Only a new template color",
        "Exception handling needs an accountable route so unusual cases do not silently change the protocol."
      ],
      [
        "A manager drops failed contacts from the experiment denominator. What is at risk?",
        "Assignment-based analysis",
        "Only slide readability",
        "Only email formatting",
        "Only source compression",
        "Removing cases based on delivery can undermine intention-to-treat interpretation and bias the result."
      ],
      [
        "A pilot protocol changes halfway through. What should be recorded?",
        "Change timing and reason",
        "Only the new filename",
        "Only the manager’s initials",
        "Only the latest total",
        "Versioned changes help interpret exposure differences and distinguish protocol revisions from outcome trends."
      ]
    ],
    "formal": [
      [
        "What is implementation fidelity?",
        "Delivery as intended",
        "Every favorable outcome",
        "A confidence interval",
        "The largest customer count",
        "Fidelity describes whether the specified intervention was actually delivered in the planned manner."
      ],
      [
        "What links actions to outcomes?",
        "A stable case identifier",
        "Only a file timestamp",
        "Only a shared font",
        "Only the row position",
        "Stable identifiers connect operational delivery logs with later outcomes without relying on mutable ordering."
      ],
      [
        "What should an exception rule specify?",
        "Who resolves unusual cases",
        "Which chart is tallest",
        "How to hide missing data",
        "Where the logo sits",
        "An exception rule gives staff a consistent and accountable response to cases outside normal handling."
      ],
      [
        "A manager receives a recommendation with no eligible population. What is needed first?",
        "A scope definition",
        "Only more decimal places",
        "Only a summary chart",
        "Only a status color",
        "Staff cannot apply an intervention consistently until the qualifying population is defined."
      ],
      [
        "A contact list is refreshed hourly but the source is two days late. What should be disclosed?",
        "Source freshness",
        "Only refresh frequency",
        "Only export size",
        "Only the database vendor",
        "Frequent processing does not make delayed source data current, so the source watermark matters."
      ],
      [
        "A pilot produces no lift because only 5% received the action. Which question comes first?",
        "Was delivery adequate?",
        "Was every customer identical?",
        "Was the chart too small?",
        "Was rounding exact?",
        "Weak implementation changes what the result says about the intended intervention and should be diagnosed explicitly."
      ],
      [
        "A front-line team invents local eligibility rules. What risk grows?",
        "Scope inconsistency",
        "Source ordering",
        "Local case counts",
        "Delivery percentages",
        "Different local rules create uneven populations and delivery that complicate fairness, execution and interpretation."
      ],
      [
        "A complaint guardrail breaches the agreed limit. What should the handoff enable?",
        "Pause and escalate",
        "Wait for significance",
        "Expand to dilute rate",
        "Relax the threshold",
        "A predefined guardrail response protects against harm while the team investigates the problem."
      ],
      [
        "An analyst matches outcomes by row position after a sort. What should replace it?",
        "Match stable ids",
        "Sort independently",
        "Match row positions",
        "Match equal row counts",
        "Positions can change during sorting, while stable keys preserve the intended case-level relationship."
      ],
      [
        "Operations wants to evaluate both reach and effect. Which design is useful?",
        "Reach and effect",
        "Successful contacts only",
        "Reach without outcomes",
        "One composite score",
        "Delivery metrics diagnose execution, while an assignment-respecting outcome analysis estimates the deployment effect."
      ]
    ],
    "mistakes": [
      "Refreshing a report does not guarantee fresh source data.",
      "Delivery success and causal impact are different questions."
    ],
    "takeaways": [
      "Provide eligibility, owners and exception handling.",
      "Track execution while preserving the analysis contract."
    ],
    "lang": "python"
  },
  {
    "id": "story-technical",
    "comps": [
      "m3.c1"
    ],
    "title": "Give technical reviewers a reproducible evidence trail",
    "intro": "A technical reviewer must reproduce a recommendation after the original analyst leaves the project. The handoff needs more than a slide: it must preserve definitions, source versions, code, exclusions and the exact result used for the decision.",
    "sections": [
      [
        "Preserve the analytical contract",
        "Document source identities and extraction watermarks, row grain, key assumptions, metric formulas, time zones and exclusion policies. Version queries and transformations alongside the report. A reviewer should be able to distinguish a revised dataset from revised logic and explain why a number changed. Never place personal records or credentials in a demonstration artifact.",
        "Include reconciliation checks at consequential boundaries: source to extract, extract to eligible population, joined rows to unique entities and aggregated totals to the displayed result. A matching final total alone can hide offsetting errors or duplicate joins. Checks should protect grain and meaning, not merely that code returns a value."
      ],
      [
        "Explain what reproduction does and does not prove",
        "A reproducible result establishes that documented inputs and logic regenerate the stated output under an environment. It does not prove that sources are complete, business definitions are correct or causal assumptions hold. Pair reproducibility with substantive review and an explicit list of unresolved risks.",
        "The fixture serializes a synthetic analysis contract with stable key ordering and hashes it. Changing the metric window changes the fingerprint, providing a simple traceability illustration. It is not a data lineage platform, an integrity signature from a trusted author or a check of the underlying facts. A production handoff should preserve the actual artifacts and access controls as well as fingerprints."
      ]
    ],
    "problem": "Fingerprint a synthetic metric contract and detect a meaning change.",
    "steps": [
      "Define the population, units and decision before calculating.",
      "Run the synthetic fixture and inspect intermediate values against its declared contract.",
      "Explain the result, boundary conditions and the action that the evidence supports."
    ],
    "code": "import json,hashlib\na={\"metric\":\"renewal cancellation rate\",\"window_days\":30,\"grain\":\"account\"}\nb={**a,\"window_days\":60}\ndef fingerprint(x):\n return hashlib.sha256(json.dumps(x,sort_keys=True).encode()).hexdigest()\nprint(fingerprint(a)==fingerprint(dict(reversed(list(a.items())))))\nprint(fingerprint(a)==fingerprint(b))",
    "expect": "True\nFalse",
    "limit": "Python verifies deterministic serialization for this restricted synthetic dictionary. A hash detects changed bytes under the same convention; it does not validate the metric, authenticate an author or replace the underlying artifacts.",
    "practice": [
      [
        "What defines a table’s grain?",
        "One row represents what",
        "The file’s byte size",
        "The chart’s background",
        "The author’s initials",
        "Grain specifies the entity or event represented by each row and controls valid joins and aggregation."
      ],
      [
        "What does reproducibility establish?",
        "Same documented computation",
        "Guaranteed causal truth",
        "Complete source coverage",
        "Automatic human approval",
        "Reproduction shows that recorded inputs and logic regenerate the output under the stated environment."
      ],
      [
        "What should be versioned with a report?",
        "Queries and definitions",
        "Only a screenshot",
        "Only the title slide",
        "Only the page count",
        "Queries and definitions preserve how sources become the reported evidence."
      ],
      [
        "A report total matches but two joins multiply and drop different records. What is needed?",
        "Boundary reconciliations",
        "Only the final total",
        "Only a new color",
        "Only a larger sample",
        "Intermediate grain and membership checks can reveal offsetting errors hidden by a matching aggregate."
      ],
      [
        "A metric changes from 30 to 60 days without a version change. What is compromised?",
        "Definition traceability",
        "Only chart resolution",
        "Only file compression",
        "Only team naming",
        "Changing the measurement window changes meaning and must be recorded in the analytical contract."
      ],
      [
        "A hash matches the stored report. Does it prove the data is accurate?",
        "No factual validation",
        "Yes for all fields",
        "Only for numeric fields",
        "Only with a long hash",
        "A fingerprint checks consistency with recorded bytes, not their truth or completeness."
      ],
      [
        "A reviewer receives only a PNG. What prevents full reproduction?",
        "Missing inputs and logic",
        "Only image dimensions",
        "Only the font choice",
        "Only chart brightness",
        "A rendered image does not preserve the source snapshot, transformation rules and environment needed to regenerate results."
      ]
    ],
    "formal": [
      [
        "What is a source watermark?",
        "A source progress marker",
        "A decorative chart pattern",
        "A table’s longest label",
        "A random account key",
        "A watermark describes the source position or time through which data has been observed or extracted."
      ],
      [
        "What does a deterministic fingerprint identify?",
        "A stable representation",
        "A verified business fact",
        "An approved publication",
        "A causal mechanism",
        "The same serialized representation produces the same digest under the chosen hashing convention."
      ],
      [
        "What belongs in a technical limitation note?",
        "Unresolved assumptions",
        "Only the team logo",
        "Only a success slogan",
        "Only the report title",
        "Reviewers need assumptions and risks that computation alone cannot verify."
      ],
      [
        "A report is rerun after new records arrive. Which artifact helps explain the change?",
        "The source version",
        "Only the page margins",
        "Only the font family",
        "Only the presentation theme",
        "A source version or watermark distinguishes changing inputs from changed analytical logic."
      ],
      [
        "A pipeline changes the timezone of daily event buckets. What should review verify?",
        "Metric boundary semantics",
        "Only the CSV delimiter",
        "Only the image size",
        "Only the column order",
        "Time zone changes can move events between reporting periods and change metric meaning."
      ],
      [
        "A join is expected to preserve one row per order. Which check is relevant?",
        "Order-key uniqueness",
        "Only total column count",
        "Only alphabetical sorting",
        "Only the output filename",
        "Key uniqueness protects the intended row grain and detects duplication that can inflate measures."
      ],
      [
        "A reproduced notebook uses undocumented manual exclusions. What is missing?",
        "Exclusion rules",
        "Output checksum",
        "Package versions",
        "Larger fixture",
        "Unrecorded manual decisions prevent independent reproduction and can conceal selection bias."
      ],
      [
        "A report hash changes after a whitespace edit. What can be concluded?",
        "Different representation",
        "Meaning changed",
        "Source fraud proven",
        "Model is invalid",
        "A byte-oriented fingerprint detects representation changes even when substantive meaning is unchanged."
      ],
      [
        "A technical appendix has perfect code but no metric denominator. What remains unclear?",
        "Outcome definition",
        "More code",
        "An environment file",
        "Source row count",
        "Executable logic is insufficient without the business definition of the population and metric."
      ],
      [
        "A reviewer can reproduce every number yet questions the causal conclusion. What should happen?",
        "Review identification",
        "Approve causal claim",
        "Collect more rows",
        "Trust the checksum",
        "Computational reproducibility and causal identification address different requirements, so substantive assumptions still need review."
      ]
    ],
    "mistakes": [
      "Matching final totals can conceal offsetting grain errors.",
      "Hashes establish consistency under a representation, not truth or approval."
    ],
    "takeaways": [
      "Version definitions, source identities and logic.",
      "Pair reproducibility with substantive review."
    ],
    "lang": "python"
  }
];
module.exports=course('data-storytelling',specs,[
  {
    "id": "python-statistics",
    "title": "Python statistics: means, distributions and numerical boundaries",
    "url": "https://github.com/python/cpython/blob/42155a0feaca9ba6991942c323cbe9fb7278be3c/Doc/library/statistics.rst",
    "source": {
      "repo": "python/cpython",
      "commit": "42155a0feaca9ba6991942c323cbe9fb7278be3c",
      "path": "Doc/library/statistics.rst",
      "verification": "Pinned official source inspected during authoring; original business reasoning and synthetic examples require human educational review."
    }
  },
  {
    "id": "python-random",
    "title": "Python random: seeded pseudo-random generators",
    "url": "https://github.com/python/cpython/blob/42155a0feaca9ba6991942c323cbe9fb7278be3c/Doc/library/random.rst",
    "source": {
      "repo": "python/cpython",
      "commit": "42155a0feaca9ba6991942c323cbe9fb7278be3c",
      "path": "Doc/library/random.rst",
      "verification": "Pinned official source inspected during authoring; original business reasoning and synthetic examples require human educational review."
    }
  },
  {
    "id": "python-json",
    "title": "Python JSON serialization",
    "url": "https://github.com/python/cpython/blob/42155a0feaca9ba6991942c323cbe9fb7278be3c/Doc/library/json.rst",
    "source": {
      "repo": "python/cpython",
      "commit": "42155a0feaca9ba6991942c323cbe9fb7278be3c",
      "path": "Doc/library/json.rst",
      "verification": "Pinned official source inspected during authoring; original business reasoning and synthetic examples require human educational review."
    }
  },
  {
    "id": "python-hashlib",
    "title": "Python hashlib: message digests",
    "url": "https://github.com/python/cpython/blob/42155a0feaca9ba6991942c323cbe9fb7278be3c/Doc/library/hashlib.rst",
    "source": {
      "repo": "python/cpython",
      "commit": "42155a0feaca9ba6991942c323cbe9fb7278be3c",
      "path": "Doc/library/hashlib.rst",
      "verification": "Pinned official source inspected during authoring; original business reasoning and synthetic examples require human educational review."
    }
  }
]);
