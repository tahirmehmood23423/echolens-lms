'use strict';
/** AI & machine learning and generative AI subtracks. */
const { S } = require('../dsl');

module.exports = [
  S('math-for-ai', 'Linear Algebra and Mathematics for AI', 'Vectors, matrices and calculus ideas that machine learning relies on.',
    { level: 'intermediate', depth: 2, hours: 25, prereq: ['python-fundamentals'], refs: [] }, [
      ['Vectors and matrices', ['!Compute dot products, norms and matrix products', 'Interpret matrix shapes in data and models']],
      ['Linear transformations', ['Explain linear transformations, eigenvectors and their use in PCA']],
      ['Calculus for optimisation', ['!Explain derivatives, gradients and gradient descent', 'Interpret learning rate effects on convergence']],
    ]),
  S('probability-statistics', 'Probability and Statistics', 'Reasoning about uncertainty, distributions and evidence.',
    { level: 'intermediate', depth: 2, hours: 25, prereq: ['programming-foundations'], refs: [] }, [
      ['Probability', ['!Compute conditional probability and apply Bayes\' rule', 'Recognise base-rate effects']],
      ['Distributions', ['Describe normal, binomial and other common distributions', 'Use sampling and the central limit theorem']],
      ['Inference', ['!Interpret confidence intervals and p-values correctly', 'Design and read A/B tests']],
    ]),
  S('numpy-arrays', 'NumPy and Numerical Computing', 'Fast numerical work with arrays, vectorisation and broadcasting.',
    { level: 'intermediate', depth: 2, hours: 12, prereq: ['python-fundamentals'], refs: ['python-advanced'] }, [
      ['Arrays', ['!Create, index and reshape arrays and predict shapes']],
      ['Vectorisation', ['!Replace Python loops with vectorised operations and broadcasting', 'Use aggregation along axes']],
      ['Numerical care', ['Handle dtypes, NaN and floating-point precision']],
    ]),
  S('pandas-fundamentals', 'Pandas and Data Manipulation', 'Loading, selecting, joining and summarising tabular data with pandas.',
    { level: 'intermediate', depth: 2, hours: 20, prereq: ['python-fundamentals'], refs: ['python-advanced'] }, [
      ['DataFrames', ['!Load data and select rows and columns with loc and iloc', 'Inspect data types and memory']],
      ['Transforming data', ['!Group, aggregate and pivot data', 'Create derived columns with vectorised operations']],
      ['Combining data', ['!Merge and join DataFrames and validate key relationships', 'Concatenate and reshape data']],
    ]),
  S('data-cleaning', 'Data Cleaning and Validation', 'Turning messy real-world data into trustworthy data.',
    { level: 'intermediate', depth: 2, hours: 15, prereq: ['pandas-fundamentals'], refs: [] }, [
      ['Missing and invalid data', ['!Choose to drop, impute or flag missing values with justification', 'Detect impossible values and outliers']],
      ['Consistency', ['!Standardise text, categories, dates and units', 'Remove duplicates with correct keys']],
      ['Validation', ['Write validation rules and document cleaning decisions']],
    ]),
  S('ml-preprocessing', 'Data Preprocessing and Leakage Prevention', 'Preparing features for models without leaking information.',
    { level: 'intermediate', depth: 3, hours: 15, prereq: ['data-cleaning'], refs: [] }, [
      ['Encoding and scaling', ['!Encode categorical data and scale numeric features appropriately']],
      ['Splitting data', ['!Split data into train, validation and test sets correctly, including time-based splits']],
      ['Leakage', ['!Detect target and train-test leakage and fit preprocessing on training data only', 'Build preprocessing pipelines']],
    ]),
  S('ml-fundamentals', 'Machine Learning Fundamentals', 'What learning from data means and how models are trained and judged.',
    { level: 'intermediate', depth: 2, hours: 20, prereq: ['numpy-arrays', 'probability-statistics'], refs: [] }, [
      ['Problem framing', ['!Frame business problems as classification, regression or clustering', 'Define a baseline before modelling']],
      ['Training and generalisation', ['!Diagnose underfitting and overfitting with learning curves', 'Explain the bias-variance trade-off']],
      ['Workflow', ['Use scikit-learn estimators, fit/predict and pipelines']],
    ]),
  S('supervised-learning', 'Supervised Learning and Model Selection', 'Regression and classification models and how to pick and tune them.',
    { level: 'intermediate', depth: 3, hours: 25, prereq: ['ml-fundamentals', 'ml-preprocessing'], refs: [] }, [
      ['Linear models', ['!Apply linear and logistic regression and interpret coefficients', 'Use regularisation']],
      ['Trees and ensembles', ['!Compare decision trees, random forests and gradient boosting', 'Tune tree depth and ensemble size']],
      ['Model selection', ['!Use cross-validation and hyperparameter search without test leakage', 'Choose models under interpretability or latency constraints']],
    ]),
  S('unsupervised-learning', 'Unsupervised Learning and Representation', 'Finding structure without labels: clustering, dimensionality reduction and anomalies.',
    { level: 'intermediate', depth: 3, hours: 15, prereq: ['ml-fundamentals'], refs: [] }, [
      ['Clustering', ['!Apply k-means and choose k; know when density-based methods fit better']],
      ['Dimensionality reduction', ['!Use PCA and interpret explained variance', 'Visualise high-dimensional data']],
      ['Anomaly detection', ['Detect anomalies and evaluate them without labels']],
    ]),
  S('feature-eng-evaluation', 'Feature Engineering and Evaluation', 'Building informative features and measuring models honestly.',
    { level: 'advanced', depth: 3, hours: 20, prereq: ['supervised-learning'], refs: [] }, [
      ['Feature engineering', ['!Create features from dates, text and aggregates', 'Select features and handle high-cardinality categories']],
      ['Metrics', ['!Choose metrics (precision, recall, F1, ROC-AUC, MAE, RMSE) for the business cost', 'Handle class imbalance in training and evaluation']],
      ['Error analysis', ['Analyse errors by segment and calibrate thresholds']],
    ]),
  S('deep-learning', 'Deep Learning and Neural Networks', 'Neural network building blocks, training and frameworks.',
    { level: 'advanced', depth: 3, hours: 30, prereq: ['ml-fundamentals', 'math-for-ai'], refs: [] }, [
      ['Neural network basics', ['!Explain layers, activations, loss and backpropagation']],
      ['Training', ['!Diagnose training problems (exploding loss, overfitting) and fix them', 'Use optimisers, learning rate schedules and regularisation']],
      ['Frameworks and transfer learning', ['!Write a PyTorch training loop', 'Fine-tune pretrained models']],
    ]),
  S('computer-vision', 'Computer Vision Fundamentals', 'Images as data, CNNs and practical vision tasks.',
    { level: 'advanced', depth: 3, hours: 25, prereq: ['deep-learning'], refs: [] }, [
      ['Images as data', ['!Preprocess and augment image data correctly']],
      ['Convolutional networks', ['!Explain convolution, pooling and CNN architectures', 'Use transfer learning for image classification']],
      ['Vision tasks', ['Choose classification, detection or segmentation for a requirement', 'Evaluate vision models (IoU, mAP)']],
    ]),
  S('nlp-fundamentals', 'Natural Language Processing Fundamentals', 'Text as data: tokenisation, representations and classic NLP tasks.',
    { level: 'advanced', depth: 3, hours: 20, prereq: ['ml-fundamentals'], refs: [] }, [
      ['Text processing', ['!Tokenise and normalise text and build vocabularies']],
      ['Representations', ['!Compare bag-of-words, TF-IDF and embeddings', 'Explain transformers at a conceptual level']],
      ['NLP tasks', ['Build text classification and evaluate it', 'Handle multilingual and Roman Urdu text']],
    ]),
  S('mlops-deployment', 'Model Deployment and MLOps', 'Serving models reliably and managing them in production.',
    { level: 'advanced', depth: 3, hours: 20, prereq: ['supervised-learning'], refs: ['tt-cloud-devops'] }, [
      ['Packaging and serving', ['!Package preprocessing with the model and serve it through an API', 'Choose batch or real-time prediction']],
      ['Experiment tracking and reproducibility', ['!Version data, code and models for reproducible results']],
      ['Release and rollback', ['Roll out models with shadow or canary releases', 'Automate retraining pipelines']],
    ]),
  S('responsible-ai-monitoring', 'Responsible AI, Monitoring and Reliability', 'Keeping models fair, monitored and trustworthy after launch.',
    { level: 'advanced', depth: 3, hours: 15, prereq: ['mlops-deployment'], refs: [] }, [
      ['Monitoring', ['!Detect data and concept drift and set alerts']],
      ['Fairness and explainability', ['!Measure bias across groups and explain predictions', 'Document models with model cards']],
      ['Privacy and governance', ['Protect personal data and follow governance rules']],
    ]),

  // ---------------- Generative AI ----------------
  S('ai-api-integration', 'APIs and AI Application Integration', 'Calling model APIs from applications reliably and economically.',
    { level: 'intermediate', depth: 2, hours: 15, prereq: ['python-fundamentals', 'http-web-architecture'], refs: ['tt-rag-agents'] }, [
      ['Calling model APIs', ['!Send chat requests with messages, parameters and streaming', 'Handle errors, timeouts and rate limits with retries']],
      ['Application integration', ['!Keep API keys server-side and validate user input', 'Design request flows for a chat or assistant feature']],
      ['Cost awareness', ['Estimate token usage and cost per request']],
    ]),
  S('llm-fundamentals', 'Language Model Fundamentals', 'What large language models are, what they can and cannot do.',
    { level: 'intermediate', depth: 2, hours: 12, prereq: ['ai-api-integration'], refs: ['tt-rag-agents'] }, [
      ['How LLMs work', ['!Explain tokens, next-token prediction and context windows', 'Describe pretraining, instruction tuning and fine-tuning']],
      ['Capabilities and limits', ['!Recognise hallucination and when grounding is needed', 'Choose model size and type for a task']],
      ['Sampling', ['Use temperature and other sampling parameters for the task']],
    ]),
  S('prompting-structured-output', 'Tokens, Context, Prompting and Structured Outputs', 'Writing prompts and getting reliable, machine-readable outputs.',
    { level: 'intermediate', depth: 3, hours: 15, prereq: ['llm-fundamentals'], refs: ['tt-rag-agents'] }, [
      ['Prompt design', ['!Write system and user prompts with clear tasks, constraints and examples', 'Manage context length and conversation history']],
      ['Structured outputs', ['!Get valid JSON with schemas or structured-output modes and validate it']],
      ['Prompt testing', ['Compare prompt versions on a fixed evaluation set']],
    ]),
  S('embeddings-semantic-search', 'Embeddings and Semantic Search', 'Representing meaning as vectors and searching by similarity.',
    { level: 'intermediate', depth: 3, hours: 12, prereq: ['llm-fundamentals'], refs: ['tt-rag-agents'] }, [
      ['Embeddings', ['!Explain embeddings and cosine similarity', 'Choose an embedding model for languages and domain']],
      ['Semantic search', ['!Chunk documents for search and choose chunk size and overlap', 'Combine keyword and semantic search']],
      ['Evaluation', ['Measure retrieval quality with recall and precision at k']],
    ]),
  S('vector-databases', 'Vector Databases and Retrieval', 'Storing and querying embeddings at scale.',
    { level: 'intermediate', depth: 3, hours: 12, prereq: ['embeddings-semantic-search'], refs: ['tt-rag-agents'] }, [
      ['Vector stores', ['!Choose a vector store (pgvector, FAISS, managed) for scale and operations', 'Explain approximate nearest-neighbour indexes']],
      ['Metadata and access control', ['!Filter results by metadata and enforce tenant access']],
      ['Operations', ['Update and delete vectors when documents change', 'Re-embed after changing embedding models']],
    ]),
  S('rag-fundamentals', 'RAG Fundamentals', 'Grounding model answers in your own documents.',
    { level: 'intermediate', depth: 3, hours: 15, prereq: ['vector-databases', 'prompting-structured-output'], refs: ['tt-rag-agents'] }, [
      ['RAG pipeline', ['!Build ingestion, retrieval and generation steps', 'Write prompts that answer only from context and cite sources']],
      ['Failure modes', ['!Diagnose whether a wrong answer comes from retrieval or generation', 'Handle questions with no relevant context']],
      ['Freshness', ['Keep indexes current with document versions']],
    ]),
  S('rag-advanced', 'Advanced RAG, Ranking and Evaluation', 'Improving retrieval quality and measuring RAG systems.',
    { level: 'advanced', depth: 3, hours: 15, prereq: ['rag-fundamentals'], refs: ['tt-rag-agents'] }, [
      ['Better retrieval', ['!Use hybrid search, re-ranking and query rewriting', 'Handle long documents and tables']],
      ['Evaluation', ['!Evaluate faithfulness, relevance and answer quality with golden sets', 'Validate LLM-as-judge against human labels']],
      ['Production RAG', ['Control latency and cost', 'Monitor retrieval quality over time']],
    ]),
  S('agents-tool-calling', 'Tool Calling and AI Agent Fundamentals', 'Letting models call functions and act through tools safely.',
    { level: 'advanced', depth: 3, hours: 15, prereq: ['prompting-structured-output'], refs: ['tt-rag-agents'] }, [
      ['Tool calling', ['!Define tool schemas and validate model-generated arguments', 'Execute tools in application code and return results']],
      ['Agent loops', ['!Design agent loops with step limits and stopping conditions', 'Recover from tool errors']],
      ['Safety', ['!Require human approval and permissions for consequential actions']],
    ]),
  S('agent-workflows', 'Agent Workflows and Orchestration', 'Multi-step and multi-agent workflows that stay controllable.',
    { level: 'advanced', depth: 3, hours: 15, prereq: ['agents-tool-calling'], refs: ['tt-rag-agents'] }, [
      ['Workflow design', ['!Choose a fixed workflow or an autonomous agent for a task', 'Break tasks into routed steps']],
      ['State and memory', ['Manage conversation state and long-term memory', 'Persist workflow state for resumption']],
      ['Observability', ['Trace agent steps, tool calls and costs']],
    ]),
  S('llm-security-eval', 'LLM Security, Reliability and Evaluation', 'Protecting LLM applications and proving they work.',
    { level: 'advanced', depth: 3, hours: 15, prereq: ['rag-fundamentals'], refs: ['tt-rag-agents'] }, [
      ['Security', ['!Defend against direct and indirect prompt injection', 'Prevent data leakage and protect personal data']],
      ['Reliability', ['!Add guardrails, fallbacks and output validation']],
      ['Evaluation', ['!Build evaluation sets and regression tests for prompts and models']],
    ]),
  S('llm-deployment-cost', 'LLM Deployment, Monitoring and Cost Optimization', 'Running LLM features in production within budget.',
    { level: 'advanced', depth: 3, hours: 12, prereq: ['ai-api-integration'], refs: ['tt-rag-agents', 'tt-cloud-devops'] }, [
      ['Deployment', ['!Choose hosted APIs or self-hosted models for privacy, cost and latency']],
      ['Cost and latency', ['!Reduce cost with caching, smaller models and prompt trimming', 'Stream responses to improve perceived latency']],
      ['Monitoring', ['Monitor quality, latency, errors and spend']],
    ]),
];
