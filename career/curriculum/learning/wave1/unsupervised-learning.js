'use strict';
const {course}=require('./wave4-ai-helper');
module.exports=course("unsupervised-learning",[
  {
    "slug": "distance-centroids",
    "title": "Define clustering geometry before fitting centroids",
    "intro": "A retail analyst wants customer groups without labeled segments. Clustering partitions observed feature vectors according to a chosen similarity rule. It does not discover an objective customer identity: changing the features or their units changes the question being asked.",
    "sections": [
      [
        "Euclidean geometry and the objective",
        "K-means minimizes the sum of squared Euclidean distances from each observation to its assigned centroid. A centroid is the arithmetic mean of the points assigned to that group. Lloyd-style fitting alternates nearest-centroid assignment with mean updates until a stopping condition is met. This is a non-convex problem: different starting centers can produce different local solutions. Specify a reproducible seed for a fixture, but compare multiple initializations when evaluating a real dataset.",
        "Feature scale defines geometry. Annual spend measured in currency can dominate a binary membership flag because its squared differences are much larger. Standardization can make units comparable, but it also gives low-variance features more relative influence; that may amplify noise. Choose features and weights from the decision requirement, inspect distributions, fit any scaling on the reference sample, and apply the same transformation to later observations."
      ],
      [
        "Interpret a fitted partition",
        "Cluster labels are arbitrary identifiers. Cluster 0 in one fit need not mean the same group as cluster 0 in another fit. Compare centers or matched memberships rather than treating label numbers as ordered scores. A centroid can lie between valid real-world observations, especially when averaged coordinates represent category indicators. Report useful original-unit summaries and limitations rather than naming groups by stereotypes.",
        "The fixture fits two centers to two well-separated one-dimensional groups and sorts the centers before printing. This removes irrelevant label permutations from the expected output. It demonstrates actual KMeans fitting, not a proof that two groups are the best retail segmentation. Missingness, duplicate customers, protected attributes and decision consequences still need review."
      ]
    ],
    "code": "from sklearn.cluster import KMeans\nimport numpy as np\nx=np.array([[0.],[2.],[10.],[12.]])\nm=KMeans(n_clusters=2,n_init=10,random_state=4).fit(x)\nprint(sorted(round(float(v),1) for v in m.cluster_centers_.ravel()))\nprint(round(float(m.inertia_),1))",
    "expect": "[1.0, 11.0]\n4.0",
    "steps": [
      "Represent each customer by one supplied numeric feature.",
      "Fit two reproducibly initialized Euclidean centroids.",
      "Sort centers and compare the within-cluster squared-distance sum."
    ],
    "problem": "Fit centroids for four synthetic customer measurements and calculate their inertia.",
    "limit": "Actual scikit-learn KMeans executes on four synthetic rows. Sorted centers avoid label-order assertions. This does not validate business segments, fairness or the choice of k.",
    "mistakes": [
      "Do not treat the numeric cluster label as a rank; match clusters through their centers or membership.",
      "Do not standardize blindly; decide whether changing relative feature weights is appropriate."
    ],
    "takeaways": [
      "K-means optimizes a specified squared-distance objective, not business usefulness.",
      "Preprocessing, feature choice and initialization are part of the clustering definition."
    ],
    "practice": [
      "What quantity does Euclidean k-means minimize?|Within-cluster squared distance|Between-center squared distance|The number of distinct records|The largest observed coordinate|The objective sums squared distances between each point and its assigned centroid.",
      "Which vector updates a centroid after assignment?|The assigned arithmetic mean|The assigned component maximum|The globally sorted first row|The previous cluster label id|Squared Euclidean loss is minimized by the arithmetic mean of assigned points.",
      "Why can changing euros to cents alter an unscaled partition?|Squared distances change weight|Every cluster becomes a singleton|Centroids become sample medians|The seed stops being reproducible|Multiplying one feature changes its contribution to Euclidean distances unless the geometry is adjusted.",
      "A loyalty table combines spend and a zero-one flag. What must be decided before scaling?|Appropriate feature influence|A preferred numeric label order|The final marketing group name|A universal number of restarts|Scaling changes influence and therefore requires a task-specific choice, not an automatic promise.",
      "Two runs swap label ids but preserve memberships. How should an audit describe them?|Equivalent up to relabeling|Different customer populations|Evidence of feature corruption|Different Euclidean objectives|Label identifiers are arbitrary; a pure permutation does not change the partition.",
      "A center averages two valid one-hot categories. What should an analyst avoid claiming?|It is an observed category|It minimizes assigned square loss|It is a numeric feature vector|It lies between assigned points|A mean of encoded categories can be a synthetic coordinate rather than a valid observed category."
    ],
    "formal": [
      "How is a fitted k-means center defined for its assigned points?|Their arithmetic mean|Their coordinatewise maximum|Their most frequent row id|Their nearest other center|The sum-of-squares objective yields a mean update for each nonempty assigned set.",
      "What is invariant when cluster identifiers are permuted?|Partition membership relations|The spelling of every label|The ascending cluster ordering|The label assigned to row zero|Renaming labels preserves which observations share a cluster.",
      "How does a fixed random seed help a clustering fixture?|Repeat its initialization|Prove a global optimum|Choose the correct features|Establish unbiased grouping|A seed supports reproduction of a particular initialization without establishing statistical or business validity.",
      "A warehouse doubles one coordinate while leaving others unchanged. How does that coordinate contribute to squared Euclidean distance?|Four times its prior term|Twice its prior term|Half of its prior term|The same as its prior term|A coordinate difference multiplied by two contributes its square, four times the old squared term.",
      "For assigned scalar points 2 and 6, which center minimizes their squared-distance sum?|4 with total squared loss 8|2 with total squared loss 8|6 with total squared loss 8|8 with total squared loss 8|The mean is 4 and the squared deviations are 4 plus 4, totaling 8.",
      "A segment report names cluster 2 the best customer solely because 2 exceeds 1. What review correction is needed?|Use original-unit summaries|Increase random seed values|Sort labels alphabetically|Replace mean with maximum|Numeric cluster IDs carry no quality ordering; segment interpretation requires observed properties and context.",
      "A customer feature is changed from dollars to cents without scaling while other columns stay fixed. How does its squared-distance contribution change?|It becomes10000times larger|It becomes100times larger|It becomes10times larger|Its contribution is unchanged|A unit conversion by100 multiplies a coordinate difference by100 and its squared contribution by10000.",
      "Two fitted scalar centers are1and11 for points0,2,10,12. Which total is the assigned sum of squared distances?|4 squared feature units|2 squared feature units|8 squared feature units|16 squared feature units|Each point is one unit from its closest center, so four squared deviations of one sum to four.",
      "A refit exchanges ids0and1 while preserving both groups; prices depend on the old ids. Which update preserves the intended group-to-policy relationship?|Match group identities before policy use|Keep raw numeric labels as identities|Sort account ids before applying prices|Increase restarts to guarantee label names|A label permutation can reverse actions keyed on raw ids, so reconcile group identity rather than assuming solver numbering is stable.",
      "A distance policy excludes proxy P, standardizes spending with reference standard deviation100 and sensor X with standard deviation0.01, then gives squared X differences weight0.25 while spending weight remains1. Two rows differ by200 spending units and0.02 X units. Which implementation and squared distance follow the policy?|Exclude P; weighted squared distance is5|Exclude P; unit-weight squared distance is8|Keep P; weighted spending-and-X distance is5|Exclude P; weight both squared differences0.25 to get2|Both standardized differences are2. The declared squared distance is1*(2 squared)+0.25*(2 squared)=5. Proxy exclusion and distinct feature weights are independent requirements."
    ]
  },
  {
    "slug": "choose-k",
    "title": "Select cluster resolution with stability and purpose",
    "intro": "A customer-support team can train many cluster counts, but can operationally maintain only a few distinct routing playbooks. Selecting k therefore combines geometric evidence, stability and a justified business use; it is not simply the lowest numerical training loss.",
    "sections": [
      [
        "Compare resolutions rather than chase fit",
        "Increasing k cannot increase the globally minimized k-means training objective because extra centers can preserve an existing solution. In actual iterative fitting a local solution can behave less smoothly, so compare restarts fairly. Choosing k equal to the row count can drive training inertia to zero while producing no useful reusable segmentation. An elbow chart is a diagnostic of diminishing reductions, not a theorem identifying one true k.",
        "Silhouette compares within-cluster cohesion with separation from the nearest other cluster: for a sample it is (b-a)/max(a,b), where a is mean distance to other points in its group and b is the smallest mean distance to another group. Values near one suggest separation under that chosen distance. The score requires between two and n-1 labels. A singleton receives a silhouette of zero in scikit-learn; do not interpret a singleton as a perfect segment."
      ],
      [
        "Stability and implementation cost",
        "Perturb observations, rerun initializations and compare matched partitions or pairwise relations. A group that disappears under small reasonable changes may be unreliable for automated action. Stability does not guarantee a meaningful construct: a stable grouping by a spurious measurement can still be harmful. Hold data and preprocessing rules comparable when contrasting candidates.",
        "The fixture calculates a silhouette for two separated scalar pairs. It is a simple separability check, not a selection procedure on a live customer population. A real review also checks actionability, group size, privacy, geographic or demographic impact and how a routing playbook will handle future assignments."
      ]
    ],
    "code": "from sklearn.metrics import silhouette_score\nimport numpy as np\nx=np.array([[0.],[1.],[10.],[11.]])\nprint(round(float(silhouette_score(x,[0,0,1,1])),4))\nprint(4-2)",
    "expect": "0.8997\n2",
    "steps": [
      "Compute pairwise distances under the supplied scalar geometry.",
      "Compare within-pair cohesion against the closest alternative group.",
      "Interpret the score alongside the remaining unspecialized observations."
    ],
    "problem": "Calculate a silhouette score for a supplied two-group partition.",
    "limit": "The actual scikit-learn metric evaluates fixed synthetic labels; it does not discover an optimal k or validate any support-routing policy.",
    "mistakes": [
      "Do not minimize training inertia over k without penalizing complexity or checking purpose.",
      "Do not compare stability by raw cluster IDs because labels can be permuted."
    ],
    "takeaways": [
      "Cluster count is a resolution and actionability choice supported by diagnostics.",
      "Silhouette and stability test chosen geometry, not whether groups deserve business actions."
    ],
    "practice": [
      "Why is zero inertia with one cluster per record insufficient evidence of useful segmentation?|It memorizes individual records|It violates the distance formula|It proves feature independence|It selects a stable taxonomy|Singleton clusters can fit observed points exactly without supplying useful generalizable group structure.",
      "What does the silhouette compare for one observation?|Within and alternative distances|Training and test target errors|The two largest feature values|Centroid ids and account numbers|Silhouette contrasts within-cluster distance a with the nearest alternative-cluster mean distance b.",
      "Which silhouette value does scikit-learn assign a singleton?|Zero by metric convention|One as perfect separation|Minus one for any singleton|Its numeric cluster identifier|The implementation assigns zero because within-cluster cohesion is not defined from another group member.",
      "A team can maintain three routing scripts but a chart shows a weak elbow at eight. What else matters?|Operational actionability|Only the smallest inertia|Only the largest label value|The alphabetical class ordering|Resolution must fit useful, maintainable actions rather than blindly following a weak geometric elbow.",
      "Bootstrap fits move many customers among groups. Which claim needs qualification?|Segment membership stability|The total number of source rows|Whether a seed can be recorded|Whether centroids are numeric|Substantial membership changes under reasonable resampling undermine stable individual assignments.",
      "A partition is stable only because a faulty sensor has extreme units. What remains necessary?|Review measurement relevance|Approve stable groups directly|Choose the largest feasible k|Remove reproducibility settings|Stability can preserve a spurious geometry; measurement quality and task relevance remain separate checks."
    ],
    "formal": [
      "What does a k-means elbow plot conventionally display?|Inertia across cluster counts|Target accuracy across labels|Raw label ids across records|Only the final center positions|An elbow plot compares the reduction in fitted within-cluster squared-distance loss as resolution changes.",
      "Which label count allows a standard silhouette score on n observations?|From two through n minus one|Exactly one through n labels|Only n singleton labels|Only two equally sized labels|The score requires at least two groups and fewer groups than observations.",
      "Why should multiple initializations be compared consistently across k values?|Local optima can affect fitting|Extra k always raises global loss|Labels have an ordered meaning|Feature scaling becomes unused|The iterative solver can reach local optima, so initialization quality can distort a resolution comparison.",
      "A point has a=2 and b=6 under the silhouette definition. What is its score?|Two thirds, approximately 0.667|One third, approximately 0.333|Three halves, approximately 1.5|Minus two thirds, about -0.667|The score is (6-2)/6, which is four sixths or two thirds.",
      "A support dataset has four singleton clusters and four total records. What prevents using its standard silhouette to declare success?|It has one group per sample|Its labels are integer valued|Its metric uses scalar input|Its groups have different names|The required label count is at most n-1; one cluster per observation is outside the standard score domain.",
      "A candidate k reduces inertia by 1% but doubles the number of maintained playbooks. Which comparison is most relevant?|Marginal benefit versus upkeep|Only its larger number of centers|Only its lower training loss|Only the final random seed|The small geometric improvement must be judged against operational complexity and actionability.",
      "A routing policy permits at most3groups of at least50members. Candidatek2has silhouette0.55/minsize90;k3has0.58/80;k6has0.64/5. Which highest-silhouette eligible candidate remains?|k3 with silhouette0.58|k6 with silhouette0.64|k2 with silhouette0.55|No candidate meets both limits|k6 violates both count and minimum size, while k3 meets the limits and has a higher silhouette than eligiblek2.",
      "A sample of500records receives500singleton groups with zero inertia. Which evaluation problem follows before any business interpretation?|Standard silhouette is outside its label range|Silhouette must equal one for all singletons|Zero inertia proves reusable routing utility|The number of clusters has no effect on validity|A standard silhouette requires at least two and at most n-1 groups; n singleton labels violate that requirement.",
      "All memberships match across two fits after swapping label names, but raw label equality is0%. Which agreement evidence correctly recognizes the same partition?|Permutation-invariant pair relationships|Mean absolute numeric-label difference|The largest final cluster label only|The percentage of unchanged literal ids|Pairwise shared-membership relations are unchanged by label renaming and compare the partition rather than arbitrary numeric names.",
      "Choose the highest silhouette with at most3groups, minsize60and stability>=0.90. A:k3,0.61,80,0.92;B:k3,0.64,75,0.87;C:k4,0.68,100,0.96;D:k2,0.60,65,0.94. Which candidate qualifies best?|A meets all constraints at0.61|B has the best eligible silhouette|C wins because stability is0.96|D is mandatory because k is smallest|B fails stability and C fails the group-count cap; A and D qualify, and A has the higher silhouette."
    ]
  },
  {
    "slug": "density-noise",
    "title": "Use density neighborhoods and interpret noise cautiously",
    "intro": "A logistics fleet records curved travel patterns and a few isolated telemetry errors. Spherical centroid groups may cut across the routes. Density-based clustering instead asks which observations have sufficiently populated neighborhoods and which regions are connected through such observations.",
    "sections": [
      [
        "Core, border and noise observations",
        "DBSCAN uses an epsilon neighborhood and a minimum sample count. In scikit-learn the count includes the point itself. Core points meet the neighborhood density requirement. Connected core regions form clusters; nearby non-core border points can join a cluster, while points not reachable from any core region are labeled -1. A noise label is an algorithmic result under the supplied scale and density parameters, not proof of fraud or sensor failure.",
        "The neighborhood radius has units inherited from the feature representation. Too small a radius can fragment a meaningful group; too large a radius can connect distinct regions through a chain. Standardization, a suitable distance and domain-informed feature construction therefore precede parameter tuning. A single radius can struggle when true groups have very different densities; alternative density methods or an explicit different model may be appropriate."
      ],
      [
        "Deployment and interpretation limits",
        "DBSCAN is transductive in this implementation: its fitted labels describe the supplied sample and there is no ordinary predict method for arbitrary new points. Do not attach a nearest-centroid prediction rule and claim it is the fitted density algorithm without specifying and evaluating that new rule. Compare reference windows, memory requirements and changes in sampling density before using groups for fleet decisions.",
        "The fixture supplies two tight three-point regions and one distant observation, then prints cluster sizes rather than depending on group numbering. It exercises actual DBSCAN density expansion. It does not distinguish a legitimate new route from a malfunctioning sensor; review raw events and provenance before taking action."
      ]
    ],
    "code": "from sklearn.cluster import DBSCAN\nfrom collections import Counter\nx=[[0.],[0.1],[0.2],[5.],[5.1],[5.2],[20.]]\nlabels=DBSCAN(eps=0.25,min_samples=3).fit_predict(x)\ncounts=Counter(int(v) for v in labels)\nprint(sorted(n for key,n in counts.items() if key!=-1))\nprint(counts[-1])",
    "expect": "[3, 3]\n1",
    "steps": [
      "Apply an epsilon neighborhood of 0.25 in the supplied coordinate units.",
      "Require at least three observations including the point itself.",
      "Count non-noise groups and the isolated noise observation separately."
    ],
    "problem": "Identify dense telemetry groups and isolate a distant record in a fixed one-dimensional fixture.",
    "limit": "Actual DBSCAN runs locally. A -1 label reflects this fixture and parameters, not confirmed telemetry corruption or a production novelty rule.",
    "mistakes": [
      "Do not interpret noise labels as confirmed malicious or incorrect records.",
      "Do not assume DBSCAN provides an ordinary out-of-sample predict API."
    ],
    "takeaways": [
      "Density neighborhoods encode scale and sampling assumptions.",
      "Investigate noise and changing-density regions before operational decisions."
    ],
    "practice": [
      "Which observations are core points in DBSCAN?|Those meeting local count density|Only the globally closest pair|Only the largest feature values|Those nearest the overall mean|Core status depends on the epsilon-neighborhood count and the selected minimum.",
      "Does scikit-learn min_samples include the point itself?|Yes, in its neighborhood count|No, only different row labels|Only when epsilon equals zero|Only for normalized distances|The density count includes the observation being assessed as well as its neighbors.",
      "What does fitted label -1 denote in DBSCAN?|Noise under supplied parameters|A proven fraudulent observation|The first numeric cluster id|An out-of-sample probability|Noise is a density-reachability designation, not a domain truth or probability.",
      "A sparse valid route is all noise beside a dense city route. What should be reviewed?|Unequal density assumptions|Only the order of cluster ids|Only the spelling of labels|The number of target classes|One epsilon/min_samples setting can mismatch groups with very different sampling densities.",
      "A product team calls DBSCAN.predict on future points. What API assumption is wrong?|Ordinary prediction is absent|All inputs need target labels|Only integers can be clustered|DBSCAN always returns centroids|DBSCAN labels the fitted sample and does not supply the standard predict interface for later points.",
      "Two dense regions merge after epsilon increases. What geometric effect explains this?|Neighborhood chains connect|Their arithmetic means vanish|Target classes become ordered|All points become singletons|A larger neighborhood can create core connections between regions that were previously separate."
    ],
    "formal": [
      "What makes a DBSCAN point a core point?|Enough neighbors within epsilon|The maximum coordinate value|The smallest numeric cluster id|A known anomaly label supplied|Core status follows the minimum sample density within the specified neighborhood.",
      "What is a border point in density clustering?|Reachable but not itself core|The globally largest point|Any point with label minus one|The average of neighboring rows|A non-core point can still belong to a dense cluster when reachable from a core region.",
      "Why must epsilon be reconsidered after changing feature units?|Distance units have changed|Cluster labels become targets|All counts become normalized|The algorithm becomes supervised|Epsilon is a distance threshold in the selected feature representation and metric.",
      "With min_samples=3, a point has itself and exactly two other observations within epsilon. Which density status follows?|Core at this neighborhood|Border because self is excluded|Noise regardless of connections|Invalid without a target label|The scikit-learn count includes the point, yielding three observations and satisfying the core threshold.",
      "A fleet manager deletes every -1 row as defective. What control is missing?|Investigation before deletion|Larger numeric cluster labels|A mandatory k-means refit first|A sorted list of driver names|Legitimate rare routes and changing sampling can also be noise; density alone does not justify destructive cleanup.",
      "A chain of dense intermediate sites connects two cities as epsilon grows. What result can occur?|One density-connected cluster|Two compulsory centroid groups|A guaranteed increase in noise|A fixed number of total groups|DBSCAN follows density reachability, so connecting core neighborhoods can merge regions.",
      "Coordinates are converted from meters to centimeters. Which DBSCAN change preserves the old neighborhood relation when min_samples is unchanged?|Multiply epsilon by100|Divide epsilon by100|Keep numeric epsilon fixed|Multiply min_samples by100|All distances grow by100, so the distance threshold must grow by100 to preserve the same neighborhoods.",
      "A DBSCAN observation has itself plus two others within epsilon and min_samples=3. Which conclusion follows without investigating its real-world cause?|It satisfies the core-count rule|It is noise because self is excluded|It is confirmed legitimate telemetry|It must be a border point not core|The neighborhood count includes the observation, so three members meet the core threshold; this does not certify the event cause.",
      "A service needs immediate new-point assignments without refitting, but its artifact contains only fitted DBSCAN labels. Which missing implementation boundary must be resolved?|An evaluated out-of-sample assignment rule|A larger numeric value for existing labels|A sorted list of original sample identifiers|A target vector to rename current groups|The standard fitted DBSCAN estimator does not provide ordinary predict; a separate evaluated assignment policy is required for the stated service.",
      "RegionAhas100samples per route;Bhas10. One DBSCAN radius flags mostBpoints while Ais dense, and an operator callsBfraud. Which joint correction addresses both unsupported assumptions?|Reassess density model and investigate causes|Keep one radius and equate every -1with fraud|Increase label ids and call sparse rows normal|Scale only display coordinates after labeling|Different sampling densities can invalidate one neighborhood policy, and density flags alone cannot establish fraud or legitimacy."
    ]
  },
  {
    "slug": "pca-axes",
    "title": "Derive principal axes and separate centering from scaling",
    "intro": "A finance team stores several correlated measurements of account activity. Principal component analysis constructs orthogonal directions of variation so a lower-dimensional representation can retain much of the observed numeric variability. Those directions are learned from the data, not named business factors supplied in advance.",
    "sections": [
      [
        "Centered linear projection",
        "For a centered data matrix, PCA chooses a unit direction that maximizes the variance of projected observations; successive directions are orthogonal and capture the remaining variance. A singular value decomposition supplies the components and scores without requiring a supervised target. A component vector contains feature loadings, while a transformed row contains coordinates along those learned directions. Mixing these two objects leads to incorrect feature interpretation.",
        "The scikit-learn PCA estimator centers feature columns but does not automatically scale them to unit variance. If one measurement is in thousands and another in fractions, its scale can dominate the covariance. StandardScaler followed by PCA changes the optimization to operate on standardized features. Decide whether relative variation or original-unit variation is meaningful; the two procedures answer different questions."
      ],
      [
        "Sign, leakage and stable transformations",
        "A component axis and its negative describe the same one-dimensional subspace. Scores and loadings can flip signs together without changing reconstruction. Comparing component signs alone is therefore unreliable across implementations or refits. For prediction or later monitoring, fit preprocessing and PCA on the designated reference/training data, retain that fitted transform, and transform later rows without learning from the evaluation population.",
        "The example projects perfectly collinear two-dimensional points onto one component. It checks transformed shape, explained variance and reconstruction error rather than asserting a particular sign. This ideal rank-one sample loses no variation under the one-axis projection; noisy financial data generally will. PCA is linear and does not establish causal factors or preserve every useful predictive signal."
      ]
    ],
    "code": "import numpy as np\nfrom sklearn.decomposition import PCA\nx=np.array([[0.,0.],[1.,2.],[2.,4.]])\np=PCA(n_components=1).fit(x)\nz=p.transform(x)\nprint(z.shape)\nprint(round(float(p.explained_variance_ratio_[0]),3))\nprint(round(float(np.max(np.abs(p.inverse_transform(z)-x))),8))",
    "expect": "(3, 1)\n1.0\n0.0",
    "steps": [
      "Center and fit one principal direction on collinear observations.",
      "Transform observations into one-dimensional scores.",
      "Reconstruct and compare with the original coordinate values."
    ],
    "problem": "Check a rank-one PCA representation without relying on arbitrary component signs.",
    "limit": "Actual PCA executes with full synthetic rank-one data. Exact reconstruction here does not imply lossless compression on arbitrary data or predictive sufficiency.",
    "mistakes": [
      "Do not assume PCA standardizes units; put an intentionally chosen scaler before it when needed.",
      "Do not interpret a component sign flip as proof the represented subspace changed."
    ],
    "takeaways": [
      "PCA learns orthogonal variance directions after centering.",
      "Scores, loadings and reconstruction are different objects with distinct interpretations."
    ],
    "practice": [
      "What does an individual PCA score represent?|A row projected onto an axis|A feature name chosen manually|A supervised class probability|A raw cluster label assignment|A score is an observation coordinate in the learned component basis.",
      "Does standard scikit-learn PCA scale input columns to unit variance?|No, it centers without scaling|Yes, it always standardizes|Only when the target is binary|Only when columns are integers|PCA subtracts learned feature means but scaling must be supplied separately when appropriate.",
      "Why can a PCA axis and its negative be equivalent?|They span the same subspace|Both recover every data point|Both have zero feature loadings|Their sample scores are equal|A simultaneous sign change in loadings and scores preserves the projected subspace and reconstruction.",
      "A high-variance billing field dominates PCA. Which choice must the team state?|Original or standardized units|The preferred component sign|The final clustering label id|A mandatory nonlinear kernel|Scaling determines whether original-unit magnitude or standardized variation drives the learned axes.",
      "A transform is fitted on all future audit rows before evaluation. What is compromised?|Independent evaluation boundary|The matrix multiplication rule|Orthogonality as a definition|The existence of mean centering|Fitting PCA on evaluation rows uses their distribution and breaks an independent transform-fit boundary.",
      "A reviewer calls the first component customer value solely because it explains most variance. What is missing?|Domain interpretation evidence|A larger numeric component id|A supervised target inside PCA|An automatic sign correction|A high-variance direction is not automatically a causal or economically meaningful construct."
    ],
    "formal": [
      "What does a PCA loading vector describe?|A direction in feature space|A list of class predictions|A set of arbitrary cluster ids|A single observation residual|Loadings define the learned linear axis in the original feature-coordinate system.",
      "What constraint separates successive principal directions?|Orthogonality of the axes|Equal variance on every axis|Equal coordinate signs always|Known labels in every direction|PCA chooses orthogonal directions to describe successive centered variance.",
      "Why can unscaled columns with different units change PCA results?|Covariance weights their scale|All features become categorical|Component signs become fixed|The target decides the units|The squared magnitude of feature variation influences covariance and thus the selected axes.",
      "Three observations lie exactly on the line y=2x. After fitting one PCA component, what reconstruction is possible?|Exact up to numerical error|Only the column means always|An arbitrary class prediction|Zero for every original row|The centered matrix has rank one, so its single nonzero principal direction represents all sample variation.",
      "Two software versions return first loading vectors v and minus v with corresponding sign-flipped scores. Which comparison is appropriate?|Compare reconstructed subspaces|Declare incompatible datasets|Compare only signs of loadings|Treat negative scores as errors|The paired sign flip is a valid basis convention and can leave reconstruction unchanged.",
      "A pipeline learns PCA before splitting support tickets into training and evaluation sets. Which repair restores the intended fit boundary?|Fit transform inside training|Refit only evaluation scores|Rotate all signs to positive|Drop every second component|Learn centering and PCA using only the allowed training/reference data before evaluating transformed held-out rows.",
      "Two exact measurements share a feature relationship y=2x; after centering their sample matrix has rank1. What should a one-component PCA reconstruction check allow?|Near-zero numerical residuals with either axis sign|Exactly zero scores regardless of input values|A unique positive sign on every component loading|A second nonzero variance component by definition|A rank-one centered sample lies in one linear direction, and paired sign conventions do not change its reconstructed subspace.",
      "A PCA pipeline is fitted before splitting future audit rows and then frozen for classifier evaluation. Which change restores the intended no-evaluation-fit boundary?|Fit scaler/PCA on training rows only|Fit PCA on evaluation rows alone|Rotate axes until scores are positive|Average training and evaluation loadings|Preprocessing and PCA learn data-distribution information, so their fitting must respect the designated training/reference boundary.",
      "A classifier remains unchanged while an operator refits PCA on each daily batch. Component count stays5but axes rotate. What invalidates unchanged classifier-input meaning?|The coordinate basis has changed|The number five cannot be a PCA dimension|PCA has started using target labels|Orthogonal vectors cannot rotate|Keeping the same dimension does not preserve feature semantics when the learned coordinate basis changes.",
      "Two PCA implementations return loadingsv and-v and paired sign-flipped scores. Evaluation rows were excluded from both fits. Which audit accepts the harmless variation without weakening the fit boundary?|Compare reconstruction under train-only fits|Require every loading entry to be positive|Refit both transforms on evaluation rows|Treat negative score coordinates as errors|Equivalent sign choices can preserve reconstruction; compare subspaces/reconstructions while retaining training-only transform learning."
    ]
  },
  {
    "slug": "variance-budget",
    "title": "Choose component count using variance and reconstruction budgets",
    "intro": "A warehouse needs to compress numeric sensor histories but cannot afford to discard the small changes that indicate equipment wear. Explained variance is a useful accounting measure, yet it must be linked to a reconstruction or downstream decision requirement before selecting the number of retained components.",
    "sections": [
      [
        "Variance ratios and residual information",
        "A component explained-variance ratio divides its captured sample variance by total feature variance under the chosen preprocessing. Cumulative ratios add the contribution of retained orthogonal components. If the leading ratios are 0.70, 0.20 and 0.10, retaining the first two captures 0.90 of that measured variance. This is not a 90% classification accuracy, a confidence probability or a guarantee that each record loses at most 10% of its information.",
        "Reconstruction maps retained scores back to original feature coordinates and restores the fitted mean. The residual vector reveals which dimensions and rows are poorly represented. Average reconstruction error can hide unacceptable error in a rare high-cost group, so inspect feature-specific and subgroup residuals. Keep a validation sample that reflects the deployment population and the original units used in the acceptance requirement."
      ],
      [
        "Compression can conflict with prediction",
        "High variance need not be relevant to a target: a small-variance direction may contain the signal separating rare failures. Compare downstream results or explicit business error measures across component counts rather than treating a cumulative threshold as an automatic decision. Whitening rescales retained components to unit variance and changes their relative magnitudes; it is distinct from selecting the number of retained axes.",
        "The fixture fits two components to a symmetric rectangular sample with variance in a 4-to-1 ratio. It prints the ratios and cumulative result. This checks the accounting mechanism on actual PCA; the ratio choice does not prescribe a universal compression threshold or demonstrate useful failure detection."
      ]
    ],
    "code": "import numpy as np\nfrom sklearn.decomposition import PCA\nx=np.array([[-2.,-1.],[-2.,1.],[2.,-1.],[2.,1.]])\np=PCA(n_components=2).fit(x)\nprint(np.round(p.explained_variance_ratio_,2).tolist())\nprint(np.round(np.cumsum(p.explained_variance_ratio_),2).tolist())",
    "expect": "[0.8, 0.2]\n[0.8, 1.0]",
    "steps": [
      "Fit PCA on a symmetric two-feature sample.",
      "Compute each component variance ratio.",
      "Accumulate ratios while distinguishing variance retention from prediction quality."
    ],
    "problem": "Calculate variance retention for a two-axis rectangle.",
    "limit": "Actual PCA ratios are verified. The fixture has no labeled failure outcome and establishes no predictive performance or acceptable reconstruction error threshold.",
    "mistakes": [
      "Do not rename retained variance percentage as predictive accuracy.",
      "Do not accept low average error without checking high-cost rows and original-unit residuals."
    ],
    "takeaways": [
      "Component count is governed by the chosen variance and downstream error requirements.",
      "Small residual variance can still contain important task information."
    ],
    "practice": [
      "What does cumulative explained variance add together?|Retained component ratios|Correct target predictions|Cluster identifier frequencies|Per-row confidence intervals|Orthogonal component ratios account for the fraction of total fitted variance retained.",
      "What does inverse_transform reconstruct after PCA projection?|Coordinates in original space|The missing supervised targets|The prior raw cluster labels|A guaranteed exact data copy|The inverse mapping reconstructs retained information in original feature coordinates and restores the learned mean.",
      "How does whitening differ from selecting two components?|It rescales retained axes|It supplies hidden class labels|It chooses a nonlinear manifold|It removes the fitted mean twice|Whitening changes retained-component scale; component selection chooses how many directions remain.",
      "A technician treats 95% explained variance as 95% failure recall. What correction is needed?|Separate variance from recall|Increase the PCA random seed|Rename components as positives|Discard the validation labels|Variance accounting does not count detected failures and cannot substitute for task-specific evaluation.",
      "Rare high-cost equipment rows have large residuals despite a low mean error. What should be reviewed?|Conditional reconstruction loss|Only the population mean again|Only the first component sign|The alphabetical sensor order|A small average can conceal unacceptable error in a consequential subgroup or tail.",
      "A low-variance sensor direction predicts failures. What can variance-only truncation do?|Discard useful task information|Guarantee better failure recall|Turn PCA into supervised LDA|Retain every failure distinction|PCA optimizes input variance rather than relevance to the supervised failure outcome."
    ],
    "formal": [
      "What denominator defines a PCA explained-variance ratio?|Total fitted feature variance|Only variance in retained axes|The number of target classes|The total number of cluster ids|Each ratio expresses one component's variance relative to all fitted input-feature variance.",
      "Which quantity identifies information lost for a specific row?|Its reconstruction residual|Its numeric component label|Its sorted input row position|Its unobserved class certainty|The difference between original and reconstructed coordinates describes that row's omitted information.",
      "Why does whitening change component geometry?|It scales retained variances|It learns target probabilities|It preserves every raw distance|It makes components nonorthogonal|Whitening standardizes component variance and therefore changes relative score magnitudes and distances.",
      "A sensor model has leading ratios 0.70, 0.20 and 0.10. What minimum component count meets a 0.85 variance threshold?|Two leading components|One leading component|Three components are mandatory|No component count can meet it|The first component retains 0.70, while the first two retain 0.90 and meet 0.85.",
      "A report retains 80% variance but claims every record's reconstruction loses at most 20%. Why is the statement unsupported?|Ratios aggregate across data|The count of components is odd|Feature loadings must be zero|PCA cannot reconstruct any row|A global variance ratio does not impose a uniform per-record residual bound.",
      "A classifier loses rare-failure recall after a 99%-variance projection. What should the engineer test next?|Retention versus task metrics|Only higher variance thresholds as proof|Whether component signs are positive|Whether integer labels are sorted|Useful target information can lie in low-variance directions, requiring direct downstream validation rather than a variance promise.",
      "A compressor retains95%global variance. One rare group contributes1%ofrows but has large residuals beyond a required per-group limit. Which conclusion follows under that policy?|Global retention alone cannot pass the group gate|The95%ratio guarantees every group passes|Rare groups contribute no valid residual metric|Whitening automatically repairs the group loss|A population variance ratio does not bound group-specific reconstruction error; the explicit group constraint still needs evidence.",
      "Component ratios are0.60,0.25,0.10,0.05and policy requires>=0.90retention. How many leading components are minimally sufficient?|Three components retaining0.95|Two components retaining0.90|One component retaining0.90|Four components are always necessary|The cumulative totals are0.60,0.85,0.95,1.00; three is the first count at or above0.90.",
      "Two projections meet mean error<=2mm;Ahas rare-group max8mm,Bhas4mm. Policy requires rare-group max<=5mm and equal storage feasibility. Which is acceptable?|B meets both stated error limits|A wins because the mean already passes|Both pass because storage is feasible|Neither can be compared without labels|The subgroup maximum is an independent required bound; Aviolates it and Bmeets both limits.",
      "A99%-variance projection loses rare-failure recall below a required0.90, while a larger feasible projection reaches0.93on held-out outcomes. What choice satisfies the stated task gate?|Use the feasible0.93recall projection|Keep99%variance as sufficient proof|Whiten the failing projection and assume success|Drop rare failures from the held-out set|The explicit recall requirement needs held-out task evidence; the larger feasible projection passes it while the variance-only argument does not."
    ]
  },
  {
    "slug": "visual-projections",
    "title": "Read nonlinear maps without inventing cluster evidence",
    "intro": "A product team sees islands in a two-dimensional customer map and wants to call them separate markets. A visualization can reveal useful neighborhoods, but a projection also distorts geometry. Responsible interpretation states what the mapping attempts to preserve and what its picture cannot establish.",
    "sections": [
      [
        "Local neighborhoods versus global distances",
        "PCA produces a linear projection with explicit variance accounting. Nonlinear manifold methods can expose local structure that a linear plane misses. Methods such as t-SNE emphasize local similarities rather than preserving all distances or global densities. The distance between two displayed islands and their apparent size need not equal distance or population spread in the original feature space. Interpret a visual separation as a hypothesis to test, not a statistical certificate.",
        "Preprocessing, distance, initialization and neighborhood-related hyperparameters affect the map. Compare views across reasonable settings and repeatable seeds, then inspect original-coordinate neighbors and metadata. A visually stable island may reflect duplicated records, collection sites or another nuisance variable. Color by metadata to investigate such explanations while preserving privacy; do not search until one attractive arrangement appears and suppress contrary maps."
      ],
      [
        "Reference transforms and external validation",
        "Some embedding implementations learn only a representation of the fitted observations and do not provide a general transform for future rows. Check the actual estimator interface before promising an online coordinate service. An embedding is not a class probability or a causal diagram. Validate candidate group interpretations with original-space measurements, robust sampling and independent business outcomes where appropriate.",
        "The fixture compares pairwise distances before and after dropping an axis. It demonstrates a concrete projection collision: two distinct original points can occupy the same displayed coordinate. This is a NumPy geometry calculation, not execution of a nonlinear embedding algorithm or proof that any particular customer map is wrong."
      ]
    ],
    "code": "import numpy as np\nx=np.array([[0.,0.],[0.,10.],[3.,0.]])\nz=x[:,:1]\nprint(float(np.linalg.norm(x[0]-x[1])))\nprint(float(np.linalg.norm(z[0]-z[1])))\nprint(float(np.linalg.norm(z[0]-z[2])))",
    "expect": "10.0\n0.0\n3.0",
    "steps": [
      "Measure separation in the original two-dimensional representation.",
      "Project onto one coordinate and recompute distances.",
      "Identify distinct observations that collide in the displayed representation."
    ],
    "problem": "Show why a visual projection can hide original-space separation.",
    "limit": "This actual NumPy projection calculation does not fit t-SNE or validate any nonlinear visualization configuration. Method-specific production behavior requires separate pinned-interface checks.",
    "mistakes": [
      "Do not interpret island area as an automatically preserved population density.",
      "Do not promise out-of-sample transform from a method without that interface."
    ],
    "takeaways": [
      "A map preserves selected properties and distorts others.",
      "Treat apparent groups as investigable hypotheses grounded in original data."
    ],
    "practice": [
      "What does a projection collision mean for two original points?|Different points share coordinates|Their original distance is zero|They share a verified class label|Their raw records are identical|Dimensionality reduction can discard distinctions that separate original points.",
      "Which quantity is not guaranteed by a locally focused embedding?|Global inter-island distance|A fitted coordinate per input|A visualization of sample rows|Some selected neighborhood structure|Preserving local similarity does not guarantee faithful global distances between displayed islands.",
      "Why inspect original-coordinate neighbors after viewing a map?|Check apparent local structure|Assign causal meaning to axes|Replace independent evaluation|Force every island to be a class|The displayed arrangement may distort distances, so original-space relationships provide essential context.",
      "A plotting team publishes only the one seed that creates clean islands. What practice is needed?|Report sensitivity across runs|Choose a more flattering palette|Rename each island as a target|Hide overlapping observations|Selective presentation conceals instability and can exaggerate the evidence for discrete groups.",
      "A visual island consists only of duplicated ingest rows. What should happen first?|Investigate data provenance|Launch a targeted product plan|Infer a new latent category|Treat visual density as demand|Duplicate records can create apparent structure unrelated to genuine population distinctions.",
      "A library lacks a transform method for future data. What promise should be avoided?|Stable online coordinates by it|A fitted map of current rows|A record of chosen parameters|A saved visualization snapshot|A fitted sample embedding does not automatically provide an out-of-sample mapping interface."
    ],
    "formal": [
      "What is a useful interpretation of a separated island on an exploratory map?|A hypothesis about sample structure|A certified distinct target class|A causal effect of the first axis|A guaranteed independent population|An embedding can suggest relationships to investigate but does not establish their external meaning.",
      "Which property distinguishes linear PCA from local nonlinear maps?|Explicit linear variance axes|Guaranteed perfect target recall|A compulsory target-label input|An absence of any geometry distortion|PCA has linear components and variance accounting; neither class of map guarantees task sufficiency.",
      "Why record preprocessing along with embedding parameters?|It defines the input geometry|It fixes all future class labels|It makes axes causal variables|It replaces source-data quality|The representation and distance assumptions determine which similarities the embedding receives.",
      "Points (0,0) and (0,10) are projected onto their first coordinate. What are their original and projected distances?|10 originally, 0 projected|0 originally, 10 projected|10 originally, 10 projected|0 originally, 0 projected|Dropping the second coordinate removes their entire original distinction and creates a projection collision.",
      "A t-SNE view shows a small dense island far from another island. Which business inference needs extra evidence?|It is a far-away low-volume market|Its plotted points are observations|Its coordinates came from a fit|Its settings should be recorded|Local-focused layouts need not preserve island distances, areas or global population density.",
      "A map separates hospital sites after scanner artifacts were included; the clinical task requires disease structure independent of device. Which comparison tests the suspected nuisance explanation?|Original features stratified by scanner/site|Only the final map island colors|Only the signs of two displayed axes|Only the number of plotted observations|Relating original-space structure to acquisition metadata tests whether device/site confounding drives the apparent groups.",
      "A nonlinear map changes islands under reasonable neighborhood settings while original-space nearest neighbors are stable. What part of the visual claim needs qualification?|The displayed global grouping narrative|The existence of the input observations|The fixed original feature values|The ability to record a random seed|Sensitivity of the display arrangement limits a narrative based on island geometry despite stable original local neighbors.",
      "An online dashboard requires comparable coordinates across dates. Each daily t-SNE fit sees a different batch and has no general transform interface. Which requirement is unsupported?|Stable out-of-sample coordinate mapping|A saved map of each fitted daily sample|A list of the chosen fit parameters|A record of original sample identifiers|Independent sample embeddings and a missing transform do not establish a common coordinate map for later observations.",
      "Points(0,0)and(0,10)project onto x; points(0,0)and(3,0)also project onto x. Which projected-distance pair follows in that order?|0 and3 respectively|10 and3 respectively|0 and0 respectively|10 and0 respectively|Dropping ycollapses the first pair while preserving the second pair xseparation of3.",
      "A review requires reproducible coordinates for future rows, no evaluation fitting and checked original-space neighborhoods. Which proposed process fits those constraints?|Train-fitted transform with held-out neighborhood audit|Refit all rows and keep only attractive islands|Daily separate maps treated as one coordinate system|Choose labels from an unrecorded favorable embedding|A transform learned only on allowed reference rows supports consistent new-row mapping, while independent original-space checks test the visual interpretation."
    ]
  },
  {
    "slug": "novelty-reference",
    "title": "Separate reference-sample outliers from future novelty",
    "intro": "A payment-monitoring team wants to rank unusual transactions. The first design decision is whether the fitted data may already contain unusual records or is intended to represent normal behavior. Those settings require different interpretation of training scores and future predictions.",
    "sections": [
      [
        "Outlier and novelty settings",
        "Outlier detection seeks unusual observations within a possibly contaminated reference sample. Novelty detection learns a reference pattern intended to represent normal behavior, then assesses unseen observations against it. Neither setting identifies the real-world cause of a rare record. A valid new business, data-entry error and malicious event can all receive unusual scores for different reasons. Keep an investigative outcome separate from a model flag.",
        "Local Outlier Factor compares an observation’s local density with the densities of nearby observations. Relative sparsity can be meaningful when neighborhoods have different scales. In scikit-learn the default LOF interface is for outlier detection through fit_predict; the training scores are available as negative_outlier_factor_. For later unseen data, initialize novelty=True before fitting and use the appropriate prediction/scoring interfaces only on unseen observations."
      ],
      [
        "Avoid training-score interface confusion",
        "When novelty=True, treating the fitted training observations as unseen queries changes the neighbor calculation and produces inappropriate comparisons. Do not evaluate novelty mode by calling its predict on the training sample and describing the result as equivalent to default fit_predict. A contamination parameter calibrates a threshold under an assumption or policy; it is not an observed fraction of confirmed fraud.",
        "The fixture fits novelty-mode LOF on four closely spaced reference measurements and predicts two unseen values. The output uses the library convention 1 for inlier and -1 for outlier. This actual fitted example demonstrates interface and geometry, not detection accuracy, a universal threshold or the legitimacy of either transaction."
      ]
    ],
    "code": "from sklearn.neighbors import LocalOutlierFactor\nm=LocalOutlierFactor(n_neighbors=2,novelty=True).fit([[0.],[0.1],[0.2],[0.3]])\nprint(m.predict([[0.15],[5.0]]).tolist())\nprint(hasattr(m,\"negative_outlier_factor_\"))",
    "expect": "[1, -1]\nTrue",
    "steps": [
      "Fit novelty-mode LOF using the small reference sample.",
      "Predict only the two genuinely unseen measurements.",
      "Interpret the signed labels as algorithmic flags, not investigation outcomes."
    ],
    "problem": "Compare one nearby unseen value and one distant unseen value with a reference density model.",
    "limit": "Actual LOF novelty-mode APIs execute. The synthetic training reference is not evidence of a clean production population or any real fraud-detection performance.",
    "mistakes": [
      "Do not call novelty-mode prediction on the fitted training rows as if they were new observations.",
      "Do not describe the contamination setting as a measured rate of actual misconduct."
    ],
    "takeaways": [
      "Reference assumptions determine whether the task is outlier detection or novelty detection.",
      "Use the estimator interface appropriate to that task and retain human/domain investigation."
    ],
    "practice": [
      "What distinguishes novelty detection from reference-sample outlier detection?|Assessing unseen rows after reference fit|Needing a target label for every row|Calling every rare record a known fraud|Always using one global density estimate|Novelty detection fits a reference pattern and assesses future unseen data rather than only assigning reference-sample outliers.",
      "Which LOF setting enables scoring unseen observations?|novelty=True before fitting|n_neighbors=0 before fitting|A target vector of all ones|The largest cluster identifier|Novelty mode changes the estimator interface for predictions and scores on unseen data.",
      "What does LOF's negative_outlier_factor_ describe?|Fitted training-row scores|Verified future fraud rates|The number of target classes|A known probability of error|The attribute contains the outlier-factor scores of the reference training observations.",
      "A novelty service queries its exact training rows and compares results with fit_predict. What is the flaw?|Different neighbor-use semantics|Targets were not one-hot encoded|The source rows need alphabetizing|Predictions require class names|The novelty interface is intended for unseen observations; training-query behavior is not equivalent to default training outlier assignment.",
      "A rare merchant is flagged as unusual. What conclusion is still unsupported?|It committed financial misconduct|It is unusual under the fitted model|Its event should be investigated|The reference geometry matters|An anomaly score does not establish intent, causality or a confirmed domain incident.",
      "A contamination parameter is set to 0.02 by policy. What must not be claimed?|Two percent are proven fraud|The setting controls a threshold|The rate assumption needs review|The ranking can be investigated|A threshold assumption or policy fraction is not a verified real-world prevalence estimate."
    ],
    "formal": [
      "What does an inlier label of 1 mean in the shown anomaly-estimator convention?|The row is inside its threshold|The row is confirmed legitimate|Its risk probability equals one|Its neighbor count is exactly one|The signed label reflects an estimator threshold and does not certify real-world legitimacy.",
      "Which default LOF operation labels the fitted reference sample?|fit_predict on reference rows|predict on arbitrary new rows|transform into principal axes|partial_fit on a class target|Default LOF supports fit_predict for reference-sample outlier detection rather than ordinary new-point prediction.",
      "Why document whether the reference sample is assumed clean?|It defines novelty interpretation|It guarantees no future change|It makes all flagged rows harmful|It removes every threshold choice|A normal-reference assumption changes how unusual future observations should be interpreted and validated.",
      "A team fits novelty=True LOF on January and queries only February observations. Which usage condition is satisfied?|Predictions are on unseen rows|The model has confirmed all fraud|January had no possible outliers|All February anomalies are errors|This respects the novelty-mode interface boundary but does not prove reference cleanliness or outcome accuracy.",
      "A fraud dashboard presents the model's -1 labels as chargeback-confirmed fraud. What separation is missing?|Model flags versus verified outcomes|Negative versus positive row indices|Dense versus sparse feature storage|Sorted versus unsorted customer ids|An algorithmic outlier flag must remain distinct from an independently verified incident outcome.",
      "The reference is assumed normal, but known past incident rows were included without review. Which claimed foundation of novelty detection is weakened?|The clean-reference interpretation|The ability to print signed predictions|The existence of a distance metric|The configured number of neighbors|Novelty interpretation depends on the reference representing expected behavior; fitting alone does not remove known contamination.",
      "Two equally sparse points live in regions with different neighbor densities. Why can LOFscore them differently?|It compares relative local density|It assigns a global constant to sparsity|It uses numeric row ids as likelihoods|It requires known incident labels first|LOFcompares a point density with neighboring densities, so relative context can differ even when an absolute sparsity measure matches.",
      "An audit needs LOFtraining-row scores plus future-row predictions. The estimator was fitted with novelty=True. Which interface pair fits the documented boundary?|negative_outlier_factor_ and unseen predict|predict on training then fit_predict on future|fit_predict on all future rows under same fit|transform on training then inverse_transform|The stored training attribute describes fitted rows; novelty-mode prediction is intended for new unseen observations.",
      "A newly observed group is internally dense but lies far outside the normal reference support. Why can it still be a novelty under the stated reference task?|Its location is novel relative to reference|Internal density guarantees legitimacy|All novelty points must be isolated singletons|A contamination setting proves it is normal|Novelty is assessed against normal-reference support, so a dense new group can still lie in a region absent from that reference.",
      "A service needs future scoring and an audit must distinguish algorithm flags from confirmed outcomes. Which design respects both facts?|novelty=True with separate adjudication state|Default LOFpredict with fraud labels as truth|Novelty training queries labeled held-out evidence|Contamination interpreted as measured future fraud|Novelty mode supports the unseen-row interface; a distinct adjudication record prevents threshold flags from becoming unsupported incident truth."
    ]
  },
  {
    "slug": "threshold-workload",
    "title": "Set anomaly thresholds with capacity and score direction",
    "intro": "A security operations queue can investigate at most three alerts per shift. An anomaly detector can rank unusual events, but deciding which events become alerts is an operational threshold decision. That decision must state score direction, capacity, ties and the cost of missed incidents.",
    "sections": [
      [
        "A score is not automatically a probability",
        "An anomaly score may increase with unusualness, or decrease with normality depending on the estimator and method. Read the actual interface contract before writing a comparison. In several scikit-learn detectors decision_function values below zero are outliers, while a custom high-is-anomalous score may use a greater-than threshold. Avoid combining scores from different systems without direction and calibration information.",
        "Capacity-limited selection ranks eligible rows and allocates scarce review slots. A fixed numerical threshold may exceed capacity when the population distribution shifts; a top-k cap always limits volume but can hide a worsening population by holding alert count constant. Monitor both selected alerts and the score distribution. Declare whether threshold equality is included, whether duplicate logical events consume multiple slots, and how ties are broken reproducibly."
      ],
      [
        "Evaluate the decision policy",
        "A threshold should be validated with adjudicated samples and a relevant cost or service-level objective. Raising a high-is-anomalous threshold generally reduces selected volume for the same fixed scores, but it does not guarantee a specific incident recall. A growing queue can come from drift, a measurement bug, duplicate ingestion or a real change in incidents. Investigate those alternatives rather than tuning away all alerts.",
        "The fixture orders four supplied high-is-anomalous scores, applies an inclusive threshold and retains at most two records. Ties are broken by stable row identifier. This is a deterministic policy model, not a fitted detector, calibrated probability calculation or evidence of optimal fraud recall."
      ]
    ],
    "code": "events=[(\"a\",0.9),(\"b\",0.8),(\"c\",0.8),(\"d\",0.2)]\neligible=sorted((r for r in events if r[1]>=0.8),key=lambda r:(-r[1],r[0]))\nprint([r[0] for r in eligible[:2]])\nprint(len(eligible))",
    "expect": "['a', 'b']\n3",
    "steps": [
      "Filter scores using the explicitly high-is-anomalous inclusive threshold.",
      "Sort by descending score with a deterministic identifier tie-break.",
      "Apply the two-slot review cap and retain the uncapped demand count."
    ],
    "problem": "Apply an alert threshold and review-capacity limit to synthetic scores.",
    "limit": "The example verifies deterministic selection only. The supplied scores are not probabilities, no detector is trained and incident recall is unknown.",
    "mistakes": [
      "Do not invert the comparison when changing estimator score interfaces.",
      "Do not interpret a fixed top-k alert count as evidence the underlying risk distribution is stable."
    ],
    "takeaways": [
      "Direction, equality, tie policy and capacity are part of alert semantics.",
      "Monitor suppressed demand and quality, not only the visible queue length."
    ],
    "practice": [
      "Why must an anomaly score's direction be documented?|To choose the correct comparison|To make it a fraud probability|To remove all threshold ties|To guarantee equal group recall|Higher can mean more anomalous or more normal depending on the scoring interface.",
      "What does a top-k alert cap guarantee for a fixed batch?|At most k selected records|At least k confirmed incidents|A calibrated probability estimate|A stable population distribution|A cap bounds selected volume but says nothing about incident truth or the changing underlying score population.",
      "Why record the number of eligible alerts before a cap?|Expose suppressed review demand|Guarantee no incident is missed|Eliminate every duplicated event|Convert scores into ground truth|The uncapped eligible count shows pressure hidden by a fixed queue capacity.",
      "Two rows tie at the review cutoff. What should the policy state?|A deterministic tie rule|A new unverified fraud claim|A mandatory positive class label|A promise that ties cannot occur|A declared tie-break makes selection auditable and repeatable under equal scores.",
      "A model change reverses score direction but keeps the same threshold operator. What is at risk?|Selecting the wrong tail|Only the displayed decimal count|The order of customer names|Whether the input fits in memory|The comparator may then select the most normal observations instead of the most anomalous.",
      "A queue stays at ten alerts because top-k is fixed while high scores become common. What else should monitoring inspect?|The uncapped score distribution|Only the constant queue length|Only the final selected row id|The number of cluster labels|A cap conceals demand changes, so the underlying scores and eligible volume need independent monitoring."
    ],
    "formal": [
      "What is a numerical anomaly threshold directly used for?|Turning scores into flags|Proving malicious intent|Learning feature definitions|Correcting invalid source rows|A threshold is a decision rule on scores, not a proof of incident truth or a data-repair operation.",
      "What does an inclusive high-score threshold t select?|Scores greater than or equal t|Only scores strictly below t|Exactly t total observations|Rows whose ids equal threshold|The stated inclusive policy includes equality as well as larger anomaly scores.",
      "Why is a score of 0.9 not necessarily 90% fraud probability?|Scores may be uncalibrated values|Every score is a cluster label|All scores use negative numbers|Probability never uses decimals|An arbitrary anomaly score has no probability interpretation without an appropriate calibration model and evidence.",
      "Scores are 0.9,0.8,0.8,0.2 with threshold at least0.8 and capacity2. How many eligible events remain outside review?|One eligible event|Zero eligible events|Two eligible events|Three eligible events|Three events meet the inclusive threshold and two slots leave one eligible event unreviewed.",
      "A system switches from high-is-anomalous scores to a decision function where negative means outlier. Which comparison matches the new zero boundary?|Flag values below zero|Flag values above one|Flag every nonnegative value|Flag only the largest value|For that decision-function contract, negative scores identify points on the outlier side of the boundary.",
      "An ingestion bug duplicates each logical event three times before ranking; queue demand triples. Which check addresses that cause without assuming incident prevalence changed?|Deduplicate stable logical event identities|Raise the anomaly threshold by exactly three|Convert every score into a fraud probability|Increase agent handoff count before ranking|Duplicate observations can multiply alert workload without representing additional independent incidents.",
      "Scores use high-is-anomalous order and remain fixed. Threshold rises from0.4to0.7. Which claim follows without incident labels?|The selected set can only shrink or stay equal|Incident precision necessarily becomes0.7|Incident recall necessarily increases|Every newly suppressed event is legitimate|The threshold selects a subset under fixed scores; outcome metrics cannot be inferred without incident truth.",
      "Seven unique events pass a threshold but only three review slots exist. Which accounting preserves both capacity and evidence of unmet demand?|Record3selected and4eligible suppressed|Record3selected and label4confirmed normal|Record7confirmed incidents and delete4|Recordonly3with no uncapped demand count|The cap limits review volume while retaining the four unreviewed eligible cases without inventing outcomes.",
      "Two equal-score events compete for one slot and the decision must reproduce after restart. Which policy meets that audit requirement?|Persist a stable identifier tie-break|Draw a fresh unrecorded random choice|Sort on mutable display names only|Choose whichever reaches a worker first|Stable recorded tie handling makes the cutoff decision reproducible, unlike unrecorded timing or random variation.",
      "Only negative detector scores are eligible; zero is excluded. At most two reviews and60 minutes are allowed. A has score-0.8, cost40, expected confirmations0.8; B:-0.4,cost30,value0.7; C:-0.2,cost20,value0.6; D:0,cost10,value0.9. Using these supplied planning values, which set maximizes expected confirmations subject to all rules?|A and C: cost60, expected confirmations1.4|A and B: cost70, expected confirmations1.5|B and C: cost50, expected confirmations1.3|C and D: cost30, expected confirmations1.5|A+C fits both the count and time limits and yields1.4, more than B+C at1.3. A+B exceeds time, and D is ineligible at the exclusive zero boundary. Planning values are assumptions, not confirmed incident labels."
    ]
  },
  {
    "slug": "evaluate-without-labels",
    "title": "Audit anomalies when ground truth is scarce",
    "intro": "A maintenance team has thousands of anomaly scores but only a small investigated subset. It can evaluate score stability and investigate representative records, yet it cannot honestly calculate population recall without knowing which unflagged records are genuine incidents. A useful validation plan makes that information gap explicit.",
    "sections": [
      [
        "What can and cannot be measured",
        "Precision among reviewed alerts is the fraction of those alerts confirmed under a defined adjudication rubric. If eight of ten reviewed alerts are confirmed, that sample precision is 0.8. It is not population recall: recall needs the denominator of all true incidents, including missed cases. It is also not necessarily precision for every alert if analysts selected only the easiest, highest-scoring or most visible cases to review.",
        "Build a review design that samples score ranges, important operating segments and some unflagged observations. Retain selection probabilities or strata so estimates can be interpreted under the sampling plan. Keep training, threshold selection and final evaluation periods separated when the claim concerns future performance. Analysts should record uncertain cases rather than forcing convenient labels, and protect sensitive information in the review workflow."
      ],
      [
        "Triangulate stability with operational outcomes",
        "Without exhaustive labels, assess duplicate sensitivity, feature drift, neighbor or rank stability, alert volume and case-level explanations. These checks can reveal operational weaknesses but do not prove detection accuracy. Synthetic injected anomalies can test whether a known change affects the pipeline; they are not a substitute for representative real incidents. A stable model may consistently miss the same attack or failure mode.",
        "The fixture computes precision only for the ten supplied reviewed alerts and separately reports how few of the population received review. It deliberately does not print recall. The arithmetic runs locally and illustrates denominator discipline; the toy labels and review sample establish no performance claim for a real maintenance or security system."
      ]
    ],
    "code": "reviewed=[1,1,1,1,1,1,1,1,0,0]\nprint(sum(reviewed)/len(reviewed))\npopulation=1000\nprint(f\"reviewed={len(reviewed)}/{population}\")\nprint(\"population recall: unknown\")",
    "expect": "0.8\nreviewed=10/1000\npopulation recall: unknown",
    "steps": [
      "Count confirmed cases among the supplied reviewed alerts.",
      "Divide by the number of reviewed alerts rather than the population size.",
      "Report the unmeasured recall explicitly instead of inventing a denominator."
    ],
    "problem": "Compute a narrow reviewed-alert precision estimate and document its limits.",
    "limit": "Only arithmetic on synthetic adjudication labels is executed. Selection bias, uncertainty and real incident recall require separate evidence; no real records are used.",
    "mistakes": [
      "Do not calculate recall using only the reviewed-alert denominator.",
      "Do not treat synthetic anomaly injections as representative production incidents without validation."
    ],
    "takeaways": [
      "Every quality metric needs a clearly defined sample and denominator.",
      "Representative review and uncertainty reporting complement operational stability checks."
    ],
    "practice": [
      "Which denominator defines precision among reviewed alerts?|The reviewed alert count|All future genuine incidents|Every unreviewed source event|The number of fitted features|Reviewed-alert precision counts confirmed incidents divided by the alerts actually adjudicated in that sample.",
      "Why is population recall unavailable from alert-only review?|Missed incidents are unknown|Anomaly scores must be integers|Precision always equals recall|All labels have negative signs|Recall requires all true incidents, including those outside the reviewed alerts.",
      "What can a synthetic anomaly injection verify directly?|Response to that constructed change|Real-world incident prevalence|Every future attack detection rate|Unbiased production precision|A controlled injection checks a specific mechanism, not the representativeness of actual incident behavior.",
      "An analyst reviews only obvious top-scored fraud cases. What threatens extrapolation?|Review selection bias|A shortage of cluster label ids|An excess of feature means|The fixed decimal format|The selected cases can differ systematically from the remaining alert population.",
      "A detector has perfectly stable ranks but repeatedly misses one failure type. Which claim is unsupported?|Stable means accurate detection|The same ranking was reproduced|A missed mode needs investigation|Operational stability was observed|Reproducibility of ranking is separate from whether the ranking captures consequential incidents.",
      "A review contains uncertain cases. What should its workflow preserve?|Adjudication uncertainty|A forced positive fraud verdict|A deleted audit trail|Only the favorable examples|Uncertainty is information about evidence quality and should not be erased to simplify a metric."
    ],
    "formal": [
      "Which label source is appropriate for evaluating incident truth?|Defined adjudicated outcomes|The detector's own threshold flags|A randomly permuted cluster id|The raw row ordering alone|Independent adjudication under a stated rubric avoids using model decisions as their own ground truth.",
      "What does a stability test establish by itself?|Consistency under its perturbation|Complete incident coverage|Absence of selection bias|A calibrated fraud probability|Stability describes sensitivity to specified changes rather than detection accuracy or unbiased outcome measurement.",
      "Why sample some unflagged observations during validation?|Investigate possible missed cases|Guarantee all negatives are clean|Avoid defining any review rubric|Remove the need for outcome labels|Review outside the alert set can reveal failures that alert-only adjudication cannot observe.",
      "Eight of ten reviewed alerts are confirmed incidents. What can be calculated directly?|Reviewed-sample precision0.8|Population incident recall0.8|All-event specificity0.8|Unreviewed-case accuracy0.8|The supplied labels support eight confirmed cases divided by ten reviewed alerts and do not supply other denominators.",
      "A pilot reviews20 high-score events and none from the middle or unflagged range. What limits a whole-population quality claim?|Restricted review coverage|The existence of a numeric score|The naming of the audit team|The lack of a target in clustering|The review excludes major score regions, so its incident outcomes cannot automatically represent all observations.",
      "A team repeatedly adjusts its threshold after viewing final audit labels, then calls the same set untouched. Which evidence status is justified?|That set has been used for tuning|The set remains independent final evidence|The labels become unavailable by definition|Threshold changes do not use outcomes|Outcome-informed threshold tuning consumes the claimed independence of the final evaluation set.",
      "A test detects an injected giant univariate outlier; real faults are subtle correlated changes. Which coverage statement matches the evidence?|Only the constructed failure mode was tested|All real faults have demonstrated recall1|Correlated faults must have higher scores|Any missed real fault is necessarily mislabeled|Detection of an artificial univariate example does not establish representativeness or sensitivity to different real mechanisms.",
      "Eight of ten reviewed alerts are incidents among1000total events; no unflagged rows are adjudicated. Which pair is directly supportable?|Sample precision0.8, recallunknown|Population recall0.8, specificity0.99|All-event accuracy0.998, recall0.8|Fraud prevalence0.8, recall1.0|The available denominator is reviewed alerts; all true incidents and missed cases remain unknown.",
      "SegmentAis reviewed with probability1andBwith0.1; their raw reviewed counts are pooled to describe the whole population. Which issue must the estimate address?|Unequal inclusion probabilities|Only the spelling of segment names|The arbitrary numeric cluster identifiers|The number of decimals in anomaly scores|Unequal inclusion can distort pooled results; interpretation needs the sampling design and target population weights.",
      "A release gate requires measured recall>=0.9. Evidence shows repeatable ranks and0.95precision only among reviewed alerts; no unflagged outcomes exist. What is the valid gate decision?|Recall requirement lacks necessary evidence|Pass because0.95is larger than0.9|Pass because repeatability implies recall|Set recall equal to reviewed precision|Recall needs the true-incident denominator including missed cases; neither alert precision nor rank stability supplies it."
    ]
  }
],[
  {
    "id": "unsup-clustering",
    "title": "scikit-learn 1.8.0: clustering",
    "url": "https://github.com/scikit-learn/scikit-learn/blob/646da0f072a8afef6a980aa427a710311e67eb9d/doc/modules/clustering.rst",
    "source": {
      "repo": "scikit-learn/scikit-learn",
      "commit": "646da0f072a8afef6a980aa427a710311e67eb9d",
      "path": "doc/modules/clustering.rst",
      "verification": "Official pinned release documentation read; actual NumPy 2.3.5/scikit-learn 1.8.0 synthetic examples execute in the isolated scientific profile. Evidence does not establish production model quality or human educational approval."
    }
  },
  {
    "id": "unsup-decomposition",
    "title": "scikit-learn 1.8.0: decomposition",
    "url": "https://github.com/scikit-learn/scikit-learn/blob/646da0f072a8afef6a980aa427a710311e67eb9d/doc/modules/decomposition.rst",
    "source": {
      "repo": "scikit-learn/scikit-learn",
      "commit": "646da0f072a8afef6a980aa427a710311e67eb9d",
      "path": "doc/modules/decomposition.rst",
      "verification": "Official pinned release documentation read; actual NumPy 2.3.5/scikit-learn 1.8.0 synthetic examples execute in the isolated scientific profile. Evidence does not establish production model quality or human educational approval."
    }
  },
  {
    "id": "unsup-manifold",
    "title": "scikit-learn 1.8.0: manifold",
    "url": "https://github.com/scikit-learn/scikit-learn/blob/646da0f072a8afef6a980aa427a710311e67eb9d/doc/modules/manifold.rst",
    "source": {
      "repo": "scikit-learn/scikit-learn",
      "commit": "646da0f072a8afef6a980aa427a710311e67eb9d",
      "path": "doc/modules/manifold.rst",
      "verification": "Official pinned release documentation read; actual NumPy 2.3.5/scikit-learn 1.8.0 synthetic examples execute in the isolated scientific profile. Evidence does not establish production model quality or human educational approval."
    }
  },
  {
    "id": "unsup-outlier-detection",
    "title": "scikit-learn 1.8.0: outlier_detection",
    "url": "https://github.com/scikit-learn/scikit-learn/blob/646da0f072a8afef6a980aa427a710311e67eb9d/doc/modules/outlier_detection.rst",
    "source": {
      "repo": "scikit-learn/scikit-learn",
      "commit": "646da0f072a8afef6a980aa427a710311e67eb9d",
      "path": "doc/modules/outlier_detection.rst",
      "verification": "Official pinned release documentation read; actual NumPy 2.3.5/scikit-learn 1.8.0 synthetic examples execute in the isolated scientific profile. Evidence does not establish production model quality or human educational approval."
    }
  }
]);
