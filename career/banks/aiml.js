'use strict';
/** AI & Machine Learning Engineer track assessment. Code uses Python, NumPy, Pandas and scikit-learn. */
const { mc, out } = require('../q');

module.exports = [
  // ---- Python for AI ----
  out('ml-py-01', 'ml.python', 1, 'What does this print?', 'print([x ** 2 for x in range(4)])', ['[0, 1, 4, 9]', '[0,1,4,9]'],
    'range(4) is 0, 1, 2, 3 and each is squared.'),
  out('ml-py-02', 'ml.python', 2, 'What does this print?', 'scores = {"ali": 80, "sara": 92, "omar": 75}\nbest = max(scores, key=scores.get)\nprint(best)', ['sara'],
    'max iterates over the keys and compares them by scores.get, so it returns the key with the highest value.'),
  mc('ml-py-03', 'ml.python', 2, 'Which command creates an isolated Python virtual environment in a folder called .venv?', ['python -m venv .venv', 'pip install venv .venv', 'python --env .venv', 'conda remove .venv'], 0,
    'The built-in venv module creates an isolated environment so project dependencies do not clash.'),
  out('ml-py-04', 'ml.python', 2, 'What does this print?', 'names = ["a", "b", "c"]\nvals = [1, 2, 3]\nprint(dict(zip(names, vals))["b"])', ['2'],
    'zip pairs the lists element by element; dict turns the pairs into {"a": 1, "b": 2, "c": 3}.'),
  mc('ml-py-05', 'ml.python', 3, 'Why use a generator to read a 10 GB log file line by line?', ['It yields one line at a time, so memory use stays small', 'It loads the file faster into memory', 'It compresses the file', 'Generators run on the GPU'], 0,
    'A generator produces values lazily instead of building a full list, so even huge files can be processed in constant memory.'),

  // ---- Mathematics and statistics ----
  out('ml-ms-01', 'ml.math_stats', 1, 'What is the mean of 2, 4, 6 and 8?', null, ['5', '5.0'], '(2 + 4 + 6 + 8) / 4 = 20 / 4 = 5.'),
  out('ml-ms-02', 'ml.math_stats', 2, 'What is the median of 3, 7, 1, 9 and 5?', null, ['5'], 'Sorted: 1, 3, 5, 7, 9. The middle value is 5.'),
  mc('ml-ms-03', 'ml.math_stats', 2, 'Salaries at a small company include one owner earning 100 times more than everyone else. Which summary is most distorted by that one value?', ['The mean', 'The median', 'The mode', 'The minimum'], 0,
    'The mean adds every value, so one extreme value drags it far up. The median depends only on the middle of the sorted data.'),
  out('ml-ms-04', 'ml.math_stats', 2, 'What is the dot product of [1, 2, 3] and [4, 5, 6]?', null, ['32'], '1*4 + 2*5 + 3*6 = 4 + 10 + 18 = 32.'),
  mc('ml-ms-05', 'ml.math_stats', 2, 'Two fair coins are tossed. What is the probability of getting at least one head?', ['3/4', '1/2', '1/4', '1'], 0,
    'The outcomes HH, HT, TH and TT are equally likely; only TT has no head, so 3 of 4 outcomes qualify.'),
  mc('ml-ms-06', 'ml.math_stats', 3, 'A feature\'s standard deviation is 0. What does that tell you?', ['Every value is identical, so the feature carries no information for prediction', 'The feature is normally distributed', 'The feature has many outliers', 'The mean is 0'], 0,
    'Standard deviation measures spread around the mean. Zero spread means a constant column, which a model cannot learn from.'),

  // ---- NumPy and Pandas ----
  out('ml-np-01', 'ml.numpy_pandas', 1, 'What does this print?', 'import numpy as np\na = np.zeros((3, 4))\nprint(a.shape)', ['(3, 4)', '(3,4)'],
    'np.zeros((3, 4)) creates 3 rows and 4 columns; shape is the tuple (3, 4).'),
  out('ml-np-02', 'ml.numpy_pandas', 2, 'What does this print?', 'import numpy as np\nprint(np.array([1, 2, 3]) * 2)', ['[2 4 6]'],
    'NumPy applies arithmetic element-wise (broadcasting the scalar). NumPy prints arrays without commas.'),
  mc('ml-np-03', 'ml.numpy_pandas', 2, 'Which Pandas expression selects the rows of df where age is greater than 30?', ['df[df["age"] > 30]', 'df.select(age > 30)', 'df["age" > 30]', 'df.where("age > 30")'], 0,
    'The comparison builds a boolean Series, and indexing the DataFrame with it keeps the rows where it is True.'),
  mc('ml-np-04', 'ml.numpy_pandas', 2, 'What does df.isna().sum() return?', ['The number of missing values in each column', 'The sum of every column', 'The number of rows', 'Rows that contain no missing values'], 0,
    'isna() marks missing cells as True; summing True values per column counts them.'),
  out('ml-np-05', 'ml.numpy_pandas', 3, 'What does this print?', 'import pandas as pd\ndf = pd.DataFrame({"city": ["LHR", "KHI", "LHR"], "sales": [10, 20, 30]})\nprint(df.groupby("city")["sales"].mean()["LHR"])', ['20.0', '20'],
    'The LHR rows have sales 10 and 30; their mean is 20.0.'),

  // ---- Data preprocessing ----
  mc('ml-pp-01', 'ml.preprocessing', 1, 'Why scale features before using k-nearest neighbours?', ['Distances are otherwise dominated by features with large ranges, such as income versus age', 'Scaling removes missing values', 'k-NN cannot read integers', 'Scaling always increases accuracy to 100%'], 0,
    'k-NN compares raw distances, so a feature measured in thousands would swamp one measured in tens unless both are put on a similar scale.'),
  mc('ml-pp-02', 'ml.preprocessing', 2, 'A "city" column (Lahore, Karachi, Peshawar) has no natural order. How should you encode it for a linear model?', ['One-hot encoding', 'Label encoding as 1, 2, 3', 'Delete the column', 'Convert city names to their string length'], 0,
    'Codes 1, 2, 3 would tell a linear model that Peshawar is "more" than Lahore. One-hot encoding gives each city its own 0/1 column.'),
  mc('ml-pp-03', 'ml.preprocessing', 2, 'A numeric "income" column has missing values and a few extreme outliers. Which simple imputation is most robust?', ['Fill with the median', 'Fill with the mean', 'Fill with the maximum', 'Fill with 0'], 0,
    'The median is not pulled by outliers, so it gives a more typical replacement value than the mean.'),
  mc('ml-pp-04', 'ml.preprocessing', 3, 'This pipeline reports a test score that is too optimistic. What is the problem?', ['Data leakage: the scaler was fitted on all the data, including the test set; fit it on the training split only', 'StandardScaler should never be used', 'The test set should be larger than the training set', 'train_test_split must come after model training'], 0,
    'Fitting the scaler on everything lets test-set statistics shape training. Split first, fit preprocessing on train, then transform the test set.',
    { type: 'debug', practical: true, code: 'scaler = StandardScaler()\nX_scaled = scaler.fit_transform(X)\nX_train, X_test, y_train, y_test = train_test_split(X_scaled, y, test_size=0.2)\nmodel.fit(X_train, y_train)\nprint(model.score(X_test, y_test))' }),
  mc('ml-pp-05', 'ml.preprocessing', 2, 'Why hold out a test set that the model never sees during training?', ['To estimate how the model will perform on new, unseen data', 'To make training faster', 'Because models need two copies of the data', 'To increase training accuracy'], 0,
    'Performance on training data overstates real-world performance. A held-out test set gives an honest estimate.'),

  // ---- ML algorithms ----
  mc('ml-al-01', 'ml.algorithms', 1, 'Predicting the price of a house in Lahore from its size and location is which kind of problem?', ['Regression', 'Classification', 'Clustering', 'Dimensionality reduction'], 0,
    'The target is a continuous number, which makes it regression. Classification predicts categories.'),
  mc('ml-al-02', 'ml.algorithms', 2, 'You want to group customers by purchase behaviour, and you have no labels. Which approach fits?', ['Unsupervised clustering such as k-means', 'Linear regression', 'Logistic regression', 'A supervised decision tree'], 0,
    'Without labels you cannot train a supervised model. Clustering finds groups of similar customers in the data itself.'),
  mc('ml-al-03', 'ml.algorithms', 2, 'In k-nearest neighbours, what is k?', ['The number of closest training examples that vote on the prediction', 'The number of features', 'The number of training epochs', 'The learning rate'], 0,
    'k-NN predicts from the k most similar training points: a majority vote for classification, an average for regression.'),
  mc('ml-al-04', 'ml.algorithms', 2, 'A very deep decision tree scores 100% on training data but 65% on test data. What is happening?', ['Overfitting: it memorised the training data; limit depth or prune', 'Underfitting: it needs to be deeper', 'The test data is corrupted', 'This is ideal performance'], 0,
    'A large gap between training and test performance is the classic sign of overfitting. Limiting depth or minimum samples per leaf regularises the tree.'),
  mc('ml-al-05', 'ml.algorithms', 3, 'What does logistic regression output for a binary classification problem?', ['A probability between 0 and 1, from a sigmoid of a linear combination of features', 'An unbounded continuous value used as the final price', 'A cluster label', 'A decision tree'], 0,
    'Despite its name, logistic regression is a classifier: it maps a linear score through the sigmoid to a probability, then applies a threshold.'),

  // ---- Model evaluation ----
  mc('ml-ev-01', 'ml.evaluation', 1, 'How is accuracy calculated?', ['Correct predictions divided by all predictions', 'True positives divided by actual positives', 'Training loss divided by test loss', 'The number of features used'], 0,
    'Accuracy is the share of all predictions that are correct.'),
  mc('ml-ev-02', 'ml.evaluation', 2, 'In a fraud dataset, 99% of transactions are genuine. A model that always predicts "genuine" gets 99% accuracy. What is true?', ['It is useless: it catches no fraud (recall 0), so judge it with precision, recall or F1', 'It is an excellent model', 'Accuracy is the best metric here', 'The dataset must be wrong'], 0,
    'With imbalanced classes, accuracy hides failure on the rare class. Recall for fraud is 0 here, which precision, recall and F1 would reveal.', { type: 'scenario', practical: true }),
  out('ml-ev-03', 'ml.evaluation', 2, 'A classifier has 40 true positives, 10 false positives and 20 false negatives. What is its precision? (Give a decimal.)', null, ['0.8', '.8', '0.80', '80%'],
    'Precision = TP / (TP + FP) = 40 / (40 + 10) = 0.8.'),
  mc('ml-ev-04', 'ml.evaluation', 2, 'Using the same counts (40 TP, 10 FP, 20 FN), what is the recall?', ['About 0.67', '0.8', '0.5', '0.4'], 0,
    'Recall = TP / (TP + FN) = 40 / 60, about 0.67. Precision and recall answer different questions, so check both.'),
  mc('ml-ev-05', 'ml.evaluation', 3, 'Training accuracy is 99% and validation accuracy is 70%. Which action makes most sense first?', ['Reduce overfitting: regularise, simplify the model or get more training data', 'Train for many more epochs', 'Add more features without checking them', 'Report 99% as the model\'s accuracy'], 0,
    'The gap shows the model does not generalise. Regularisation, a simpler model or more data narrows it; training longer usually widens it.'),
  mc('ml-ev-06', 'ml.evaluation', 3, 'You tried 50 hyperparameter settings and kept the one with the best TEST score. What is wrong with reporting that score?', ['The test set was used for model selection, so the score is optimistically biased; tune on a validation set or with cross-validation', 'Nothing - this is standard practice', '50 settings is too few', 'Hyperparameters do not affect test scores'], 0,
    'Choosing by test score leaks test information into the model. Select with validation data or cross-validation, and use the test set once at the end.', { type: 'scenario', practical: true }),

  // ---- Deep learning fundamentals ----
  mc('ml-dl-01', 'ml.deep_learning', 1, 'What does a single artificial neuron compute?', ['A weighted sum of its inputs plus a bias, passed through an activation function', 'The average of its inputs only', 'A random number', 'A sorted list of inputs'], 0,
    'Each neuron computes w·x + b and applies an activation such as ReLU or sigmoid.'),
  mc('ml-dl-02', 'ml.deep_learning', 2, 'Why do neural networks use activation functions such as ReLU?', ['They add non-linearity, so stacked layers can learn complex patterns', 'They make training data larger', 'They remove the need for a loss function', 'They store the weights'], 0,
    'Without non-linear activations, any number of layers collapses into a single linear transformation.'),
  mc('ml-dl-03', 'ml.deep_learning', 2, 'What is one epoch in training?', ['One full pass through the whole training dataset', 'One weight update', 'One layer of the network', 'One test prediction'], 0,
    'An epoch processes every training example once, usually in many mini-batches.'),
  mc('ml-dl-04', 'ml.deep_learning', 2, 'Training loss jumps around and grows instead of falling. What is a likely cause?', ['The learning rate is too high', 'The learning rate is too low', 'There are too few epochs', 'The test set is too small'], 0,
    'Steps that are too large overshoot the minimum, making loss oscillate or diverge. Lower the learning rate.'),
  mc('ml-dl-05', 'ml.deep_learning', 3, 'Why are convolutional neural networks (CNNs) well suited to images?', ['Convolutions detect local patterns with shared weights, wherever they appear in the image', 'They ignore pixel positions completely', 'They need no training data', 'They only work on black-and-white images'], 0,
    'Small filters slide across the image and reuse the same weights, so an edge or texture is recognised anywhere with far fewer parameters.'),

  // ---- Model deployment ----
  mc('ml-dp-01', 'ml.deployment', 1, 'How do you reuse a trained scikit-learn model in another program?', ['Save it (for example with joblib) and load it where predictions are needed', 'Retrain it every time the program starts', 'Copy the training data instead', 'Take a screenshot of the model'], 0,
    'Serialising the fitted model lets a serving application load it without retraining.'),
  mc('ml-dp-02', 'ml.deployment', 2, 'What is a common way to let a web app use your model?', ['Wrap it in a REST API (for example FastAPI or Flask) that returns predictions', 'Email the model file to every user', 'Embed the training data in the web page', 'Run Jupyter in production'], 0,
    'An API endpoint accepts input, runs the model and returns the prediction, so any client can use it.'),
  mc('ml-dp-03', 'ml.deployment', 2, 'Six months after launch, the model\'s accuracy has dropped although the code has not changed. What is a likely cause?', ['Data drift: the incoming data no longer looks like the training data', 'The model file has worn out', 'The server became slower', 'Accuracy always drops over time for no reason'], 0,
    'Behaviour and populations change. Monitor input distributions and performance, and retrain when they drift.', { type: 'scenario' }),
  mc('ml-dp-04', 'ml.deployment', 2, 'At prediction time, how must incoming data be preprocessed?', ['With exactly the same fitted preprocessing used in training, for example the saved scaler and encoder', 'Not at all - raw data is fine', 'With a newly fitted scaler on each request', 'Differently, to add variety'], 0,
    'The model learned on transformed data. Saving the preprocessing with the model (for example as a Pipeline) keeps training and serving consistent.'),
  mc('ml-dp-05', 'ml.deployment', 3, 'An API loads a 500 MB model from disk inside the request handler, so every request takes 8 seconds. What is the fix?', ['Load the model once when the server starts and reuse it for every request', 'Buy a faster disk only', 'Make the model larger', 'Ask users to wait'], 0,
    'Loading is a one-time cost. Load at startup and keep the model in memory; requests then only run inference.', { type: 'debug', practical: true }),
];
