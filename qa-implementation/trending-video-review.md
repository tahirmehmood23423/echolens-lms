# Upcoming course videos

72 lessons across six upcoming courses now have main videos. Filled 60 missing lecture links and added 24 optional companion clips. All 96 clips have verified runtimes below 20 minutes and allow embedding according to YouTube metadata.

Selected using topic match, runtime, views and sampled comment feedback. Titles, descriptions and available chapters were reviewed; full videos were not watched end to end. Counts are snapshots from the displayed check dates. These are curated choices among researched candidates, not a claim of the highest counts on all of YouTube. Admin approval and course publication remain separate.

Admin access: sign in with an existing administrator account, then open **/admin/course-videos** or **Dashboard → Free Courses → Review upcoming course videos**. All modules and lessons are available for staff preview. Learner enrollment remains Coming Soon. No password change or new account is required.

[All links and metrics](trending-video-review.html) · [CSV](trending-video-review.csv)

## Research and checks

Public YouTube searches are recorded in trending-video-research/search-*.json. Per-video files record runtime, views, comment counts, sampled comments and embed metadata. Selections and coverage notes are in trending-video-selections.json and trending-video-coverage.json. Videos flagged in comments for memoization, sliding-window, join-order or context-cancellation errors were replaced with other candidates. No claim is made that every assignment criterion is taught in the selected video.

To regenerate the data from the saved research: run `node qa-implementation/apply-trending-videos.cjs`, then `node qa-implementation/generate-trending-video-review.cjs`.

| Course | Lecture | Topic | Video | Runtime |
| --- | --- | --- | --- | --- |
| Modern Full Stack Development with Next.js and TypeScript | 1.1 | Components, JSX and Typed Props | [React TypeScript Tutorial - 3 - Typing Props ](https://www.youtube.com/watch?v=KpA6oEaCHtk) | 5:48 |
| Modern Full Stack Development with Next.js and TypeScript | 1.2 | State with useState and useReducer | [Learn React Hooks: useReducer - Simply Explained! ](https://www.youtube.com/watch?v=rgp_iCVS8ys) | 13:48 |
| Modern Full Stack Development with Next.js and TypeScript | 1.3 | Effects, Cleanup and Custom Hooks | [Learn useEffect In 13 Minutes ](https://www.youtube.com/watch?v=0ZJgIjIuY7U) | 13:38 |
| Modern Full Stack Development with Next.js and TypeScript | 2.1 | Server Components and Client Components | [Server Components in Client Components?? (React / Next.js) ](https://www.youtube.com/watch?v=9YuHTGAAyu0) | 6:49 |
| Modern Full Stack Development with Next.js and TypeScript | 2.2 | Server Actions and Form Mutations | [Next.js Forms Are Different Now (Server Actions, useActionState, Form Component, Form Backend) ](https://www.youtube.com/watch?v=DK7WqcL9Qq4) | 14:12 |
| Modern Full Stack Development with Next.js and TypeScript | 2.3 | Streaming, Suspense and Loading States | [Loading UI, Suspense, and Streaming in NextJs 13 ](https://www.youtube.com/watch?v=y9bV8ypChms) | 19:42 |
| Modern Full Stack Development with Next.js and TypeScript | 3.1 | Schema Modelling and Migrations | [Prisma Migrations: A Step-by-Step Guide ](https://www.youtube.com/watch?v=ZaCFsFES5yQ) | 12:13 |
| Modern Full Stack Development with Next.js and TypeScript | 3.2 | Queries, Pagination and Transactions | [Lesson 7 Advanced Prisma features and operations ](https://www.youtube.com/watch?v=fYtYPLTgKC4) | 14:46 |
| Modern Full Stack Development with Next.js and TypeScript | 3.3 | Route Handlers, Zod Validation and Tests | [Data Validation on Next.js API Route Handlers with Zod ](https://www.youtube.com/watch?v=dcicL7Nmahg) | 15:42 |
| Modern Full Stack Development with Next.js and TypeScript | 4.1 | Auth.js Credentials, OAuth and Sessions | [NextJS 15: NextAuth 5 (Auth.js) Demo - Basic Credentials ](https://www.youtube.com/watch?v=DdkIpIv1KUs) | 16:11 |
| Modern Full Stack Development with Next.js and TypeScript | 4.2 | Middleware and Route Protection | [Next.js Middleware Explained Simply 🔥 / Protect Routes & Authentication ](https://www.youtube.com/watch?v=psEeEPtiops) | 11:30 |
| Modern Full Stack Development with Next.js and TypeScript | 4.3 | Testing, Build Configuration and Deployment | [Deploying Next.js to Vercel ](https://www.youtube.com/watch?v=AiiGjB2AxqA) | 6:21 |
| Applied Generative AI and Retrieval Augmented Generation | 1.1 | Embeddings and Semantic Similarity | [What are Word Embeddings? ](https://www.youtube.com/watch?v=wgfSDrqYMJ4) | 8:38 |
| Applied Generative AI and Retrieval Augmented Generation | 1.1 | Embeddings and Semantic Similarity | Companion: [Cosine Similarity, Clearly Explained!!! ](https://www.youtube.com/watch?v=e9U0QAFbfLI) | 10:13 |
| Applied Generative AI and Retrieval Augmented Generation | 1.2 | Chunking Strategies | [Chunking Strategies in RAG: Optimising Data for Advanced AI Responses ](https://www.youtube.com/watch?v=pIGRwMjhMaQ) | 14:02 |
| Applied Generative AI and Retrieval Augmented Generation | 1.3 | Vector Databases and Metadata Filtering | [Qdrant Essentials / Combine Search & Filtering with Qdrant Filterable HNSW ](https://www.youtube.com/watch?v=VJVHU47IAik) | 4:46 |
| Applied Generative AI and Retrieval Augmented Generation | 2.1 | Prompting, Grounding and Injection Defence | [Securing AI Agents: How to Prevent Hidden Prompt Injection Attacks ](https://www.youtube.com/watch?v=5ZA1lTxTH3c) | 10:07 |
| Applied Generative AI and Retrieval Augmented Generation | 2.1 | Prompting, Grounding and Injection Defence | Companion: [How to implement LLM guardrails for RAG applications ](https://www.youtube.com/watch?v=l5K4r_TJz_8) | 7:14 |
| Applied Generative AI and Retrieval Augmented Generation | 2.2 | LCEL Chains and Streaming | [Langchain LCEL Intuitively Explained + Notebook Examples / Langchain Tutorial ](https://www.youtube.com/watch?v=L07Kwpjppd4) | 8:19 |
| Applied Generative AI and Retrieval Augmented Generation | 2.2 | LCEL Chains and Streaming | Companion: [LangChain Streaming Explained / Real-Time LLM Responses (Step-by-Step) ](https://www.youtube.com/watch?v=9OuwPeDaUIY) | 4:57 |
| Applied Generative AI and Retrieval Augmented Generation | 2.3 | Hybrid Retrieval and Re-ranking | [Advanced RAG 03 - Hybrid Search BM25 & Ensembles ](https://www.youtube.com/watch?v=lYxGYXjfrNI) | 6:47 |
| Applied Generative AI and Retrieval Augmented Generation | 2.3 | Hybrid Retrieval and Re-ranking | Companion: [RAG Reranking Explained: How To Improve RAG Results ](https://www.youtube.com/watch?v=R5MPqm0V6aQ) | 14:24 |
| Applied Generative AI and Retrieval Augmented Generation | 3.1 | Function Calling and Tool Schemas | [How LLM Tool Calling Works ](https://www.youtube.com/watch?v=QiRdYCNXAxk) | 16:00 |
| Applied Generative AI and Retrieval Augmented Generation | 3.2 | ReAct Loops and Agent Control | [Building a LangGraph ReAct Mini Agent ](https://www.youtube.com/watch?v=pEMhPBQMNjg) | 14:47 |
| Applied Generative AI and Retrieval Augmented Generation | 3.3 | LangGraph State Machines and Multi-agent Graphs | [LangGraph Explained for Beginners ](https://www.youtube.com/watch?v=cUfLrn3TM3M) | 13:21 |
| Applied Generative AI and Retrieval Augmented Generation | 4.1 | Evaluation with Ragas and a Golden Set | [RAGAS: How to Evaluate a RAG Application Like a Pro for Beginners ](https://www.youtube.com/watch?v=5fp6e5nhJRk) | 8:37 |
| Applied Generative AI and Retrieval Augmented Generation | 4.2 | Guardrails, PII Redaction and Structured Output | [AI Agent Guardrails Simplified - Prompt Injection, PII & More ](https://www.youtube.com/watch?v=9Ek2cvIHq1c) | 11:05 |
| Applied Generative AI and Retrieval Augmented Generation | 4.2 | Guardrails, PII Redaction and Structured Output | Companion: [Instructor and Pydantic - Structured LLM outputs for easy data extraction! ](https://www.youtube.com/watch?v=3xUW1Do9zOs) | 16:29 |
| Applied Generative AI and Retrieval Augmented Generation | 4.3 | Serving, Caching, Cost and Observability | [Optimize RAG Resource Use With Semantic Cache ](https://www.youtube.com/watch?v=H53L_yHs9jE) | 8:42 |
| Applied Generative AI and Retrieval Augmented Generation | 4.3 | Serving, Caching, Cost and Observability | Companion: [RAG in Production - LangChain & FastAPI ](https://www.youtube.com/watch?v=Arf7UwWjGyc) | 11:51 |
| Applied Generative AI and Retrieval Augmented Generation | 4.3 | Serving, Caching, Cost and Observability | Companion: [Getting Started with LangSmith (1/8): Tracing ](https://www.youtube.com/watch?v=fA9b4D8IsPQ) | 8:20 |
| Data Structures and Algorithmic Problem Solving | 1.1 | Complexity Analysis and Two Pointers | [Two Pointers in 7 minutes / LeetCode Pattern ](https://www.youtube.com/watch?v=QzZ7nmouLTI) | 7:20 |
| Data Structures and Algorithmic Problem Solving | 1.2 | Fixed and Dynamic Sliding Window | [Sliding Window Technique ](https://www.youtube.com/watch?v=dOonV4byDEg) | 6:18 |
| Data Structures and Algorithmic Problem Solving | 1.3 | Binary Search on Sorted Data and on Answer Spaces | [16 Binary Search on Answer Concept ](https://www.youtube.com/watch?v=IZP_8-JZqhM) | 6:51 |
| Data Structures and Algorithmic Problem Solving | 2.1 | Linked Lists and Fast and Slow Pointers | [Fast and Slow Pointers in 6 Minutes / LeetCode Pattern ](https://www.youtube.com/watch?v=b139yf7Ik-E) | 6:08 |
| Data Structures and Algorithmic Problem Solving | 2.2 | Monotonic Stacks | [Monotonic Stack Data Structure Explained ](https://www.youtube.com/watch?v=Dq_ObZwTY_Q) | 5:43 |
| Data Structures and Algorithmic Problem Solving | 2.3 | Heaps and Priority Queues | [Heaps, heapsort, and priority queues - Inside code ](https://www.youtube.com/watch?v=pLIajuc31qk) | 19:00 |
| Data Structures and Algorithmic Problem Solving | 3.1 | Binary Trees and Breadth First Traversal | [Binary Tree Level Order Traversal - BFS - Leetcode 102 ](https://www.youtube.com/watch?v=6ZnyEApgFYg) | 9:35 |
| Data Structures and Algorithmic Problem Solving | 3.2 | Depth First Search, Cycles and Components | [Graph Valid Tree - Leetcode 261 - Python ](https://www.youtube.com/watch?v=bXsUuownnoQ) | 14:11 |
| Data Structures and Algorithmic Problem Solving | 3.3 | Shortest Paths with Breadth First Search and Dijkstra | [3.6 Dijkstra Algorithm - Single Source Shortest Path - Greedy Method ](https://www.youtube.com/watch?v=XB4MIexjvY0) | 18:35 |
| Data Structures and Algorithmic Problem Solving | 4.1 | Backtracking and Pruning | [Recursive Backtracking - DSA Course in Python Lecture 14 ](https://www.youtube.com/watch?v=L0NxT2i-LOY) | 12:58 |
| Data Structures and Algorithmic Problem Solving | 4.2 | One Dimensional Dynamic Programming | [Climbing Stairs - Dynamic Programming - Leetcode 70 - Python ](https://www.youtube.com/watch?v=Y0lT9Fck7qI) | 18:07 |
| Data Structures and Algorithmic Problem Solving | 4.3 | Two Dimensional Dynamic Programming | [0/1 Knapsack Problem Explained Visually ](https://www.youtube.com/watch?v=qxWu-SeAqe4) | 8:09 |
| Data Structures and Algorithmic Problem Solving | 4.3 | Two Dimensional Dynamic Programming | Companion: [Longest Common Subsequence - Leetcode 1143 - Dynamic Programming (Python) ](https://www.youtube.com/watch?v=MNykgz1_ONQ) | 9:20 |
| Cloud DevOps and Container Orchestration | 1.1 | Container Internals and Image Optimisation | [Docker Image BEST Practices - From 1.2GB to 10MB ](https://www.youtube.com/watch?v=t779DVjCKCs) | 7:15 |
| Cloud DevOps and Container Orchestration | 1.2 | Networking and Persistent Storage | [How Docker Networking Actually Works ](https://www.youtube.com/watch?v=W7X6u2BGVRY) | 9:01 |
| Cloud DevOps and Container Orchestration | 1.2 | Networking and Persistent Storage | Companion: [Docker Volumes explained in 6 minutes ](https://www.youtube.com/watch?v=p2PH_YPCsis) | 6:03 |
| Cloud DevOps and Container Orchestration | 1.3 | Multi Service Stacks with Compose | [Docker Compose in 12 Minutes ](https://www.youtube.com/watch?v=Qw9zlE3t8Ko) | 12:00 |
| Cloud DevOps and Container Orchestration | 1.3 | Multi Service Stacks with Compose | Companion: [Docker Compose Control Container Order with depends_on ](https://www.youtube.com/watch?v=pCY6khpKqM4) | 4:17 |
| Cloud DevOps and Container Orchestration | 2.1 | Pods, Deployments and Self Healing | [Kubernetes Pods, ReplicaSets, and Deployments in 5 Minutes ](https://www.youtube.com/watch?v=iC-WxZGhFqs) | 4:57 |
| Cloud DevOps and Container Orchestration | 2.1 | Pods, Deployments and Self Healing | Companion: [Kubernetes Probes- livenessProbe, readinessProbe, startupProbe /How to use kubernetes probes-part 14 ](https://www.youtube.com/watch?v=aTlQBofihJQ) | 18:01 |
| Cloud DevOps and Container Orchestration | 2.2 | Services, Ingress and Traffic Routing | [Kubernetes Ingress in 5 mins ](https://www.youtube.com/watch?v=NPFbYpb0I7w) | 5:40 |
| Cloud DevOps and Container Orchestration | 2.3 | ConfigMaps, Secrets and Autoscaling | [Kubernetes ConfigMap and Secret as Kubernetes Volumes / Demo ](https://www.youtube.com/watch?v=FAnQTgr04mU) | 16:54 |
| Cloud DevOps and Container Orchestration | 2.3 | ConfigMaps, Secrets and Autoscaling | Companion: [Optimizing Resource Utilization with Horizontal Pod Autoscaling (HPA) in Kubernetes / AKS ](https://www.youtube.com/watch?v=z4HdPOLP8nc) | 7:18 |
| Cloud DevOps and Container Orchestration | 3.1 | Pipelines with GitHub Actions | [Github Actions CI/CD - Everything you need to know to get started ](https://www.youtube.com/watch?v=mFFXuXjVgkU) | 12:21 |
| Cloud DevOps and Container Orchestration | 3.2 | Registry Publishing and Image Scanning | [Automated Docker Image Scanning with Trivy and GitHub Actions! ](https://www.youtube.com/watch?v=CMH6YIHLvAw) | 10:19 |
| Cloud DevOps and Container Orchestration | 3.3 | GitOps Delivery with Argo CD | [Let's do GitOps in Kubernetes! ArgoCD Tutorial ](https://www.youtube.com/watch?v=Yb3_4PZX0B0) | 18:00 |
| Cloud DevOps and Container Orchestration | 4.1 | Terraform and Cloud Provisioning | [Terraform explained in 15 mins / Terraform Tutorial for Beginners ](https://www.youtube.com/watch?v=l5k1ai_GBDE) | 18:15 |
| Cloud DevOps and Container Orchestration | 4.2 | Prometheus Metrics and Alerting | [Understanding Prometheus Metric Types / Meaning and Usage (Gauge, Counter, Summary, Histogram) ](https://www.youtube.com/watch?v=fhx0ehppMGM) | 11:19 |
| Cloud DevOps and Container Orchestration | 4.2 | Prometheus Metrics and Alerting | Companion: [Alerting Rules in Prometheus / Prometheus Tutorial for Beginners / Prometheus Alertmanager Tutorial ](https://www.youtube.com/watch?v=9joXN3ipABg) | 13:25 |
| Cloud DevOps and Container Orchestration | 4.3 | Grafana Dashboards and Distributed Tracing | [LGTM Grafana Stack: OpenTelemetry Tracing for API & Database Spans ](https://www.youtube.com/watch?v=umFp1bBbyyI) | 9:24 |
| High Performance Backend Engineering with Go | 1.1 | Pointers, Structs and Escape Analysis | [This is your last video about Golang Structs! ](https://www.youtube.com/watch?v=c8H0w4yBL10) | 15:57 |
| High Performance Backend Engineering with Go | 1.1 | Pointers, Structs and Escape Analysis | Companion: [Golang: Heap Allocation using escape analysis ](https://www.youtube.com/watch?v=AdCAx_zfzQk) | 3:30 |
| High Performance Backend Engineering with Go | 1.2 | Interfaces and Composition | [Golang: The Last Interface Explanation You'll Ever Need ](https://www.youtube.com/watch?v=SX1gT5A9H-U) | 17:57 |
| High Performance Backend Engineering with Go | 1.3 | Error Handling, Wrapping and Defer | [What's the proper way to wrap errors in Go? ](https://www.youtube.com/watch?v=MRbhtMptago) | 11:16 |
| High Performance Backend Engineering with Go | 1.3 | Error Handling, Wrapping and Defer | Companion: [Defer Keyword in Golang in Hindi / What is the defer keyword in Golang? #golang ](https://www.youtube.com/watch?v=QDUgWHKb2Tk) | 6:09 |
| High Performance Backend Engineering with Go | 2.1 | Goroutines and Channel Communication | [Go Concurrency Explained: Go Routines & Channels ](https://www.youtube.com/watch?v=B9uR2gLM80E) | 7:50 |
| High Performance Backend Engineering with Go | 2.2 | Multiplexing with select and Timeouts | [Mastering select and for-select / Essential Tools for Concurrency in Go ](https://www.youtube.com/watch?v=mcl3zU5wat4) | 9:57 |
| High Performance Backend Engineering with Go | 2.3 | Synchronisation Primitives and Context | [How You Should Use Mutexes And Atomic Values In Golang?! ](https://www.youtube.com/watch?v=egIDsv1RO88) | 15:49 |
| High Performance Backend Engineering with Go | 2.3 | Synchronisation Primitives and Context | Companion: [Golang Context Package: It's More Than You Think! ](https://www.youtube.com/watch?v=BkzgYfygDy8) | 8:26 |
| High Performance Backend Engineering with Go | 3.1 | REST Services with net/http and chi | [Build a Microservice with Go #2 - Routes & Handlers ](https://www.youtube.com/watch?v=N9LhKjPibuU) | 10:50 |
| High Performance Backend Engineering with Go | 3.2 | Connection Pooling with pgx | [#74 Golang - PostgreSQL with PGX in Go: Step-by-Step Tutorial ](https://www.youtube.com/watch?v=LSFCmSQc5R8) | 10:55 |
| High Performance Backend Engineering with Go | 3.3 | Type Safe Queries with sqlc and Transactions | [[Backend #6] A clean way to implement database transaction in Golang ](https://www.youtube.com/watch?v=gBh__1eFwVI) | 19:53 |
| High Performance Backend Engineering with Go | 4.1 | Protocol Buffers and gRPC | [#55 Golang - Get Started with gRPC in Golang – Server & Client ](https://www.youtube.com/watch?v=erHz7d0v8Vw) | 15:37 |
| High Performance Backend Engineering with Go | 4.2 | Caching with Redis | [Golang Microservices: Caching with Redis ](https://www.youtube.com/watch?v=wj6-w0DLKRw) | 8:20 |
| High Performance Backend Engineering with Go | 4.3 | Structured Logging, Graceful Shutdown and Load Testing | [Graceful Shutdown in Go: Key Patterns you need to know! ](https://www.youtube.com/watch?v=UPVSeZXBTxI) | 17:33 |
| High Performance Backend Engineering with Go | 4.3 | Structured Logging, Graceful Shutdown and Load Testing | Companion: [Go's Built-in Package for Better Logging (using slog) ](https://www.youtube.com/watch?v=_mqB7LLgwgs) | 8:51 |
| High Performance Backend Engineering with Go | 4.3 | Structured Logging, Graceful Shutdown and Load Testing | Companion: [How to do Performance Testing with k6 ](https://www.youtube.com/watch?v=ghuo8m7AXEM) | 9:55 |
| Database Systems and PostgreSQL Internals | 1.1 | Joins, Set Operations and NULL Semantics | [POSTGRESQL JOINS [Complete guide in 12 mins] ](https://www.youtube.com/watch?v=FprFu75BoE4) | 12:30 |
| Database Systems and PostgreSQL Internals | 1.1 | Joins, Set Operations and NULL Semantics | Companion: [Combine SQL Queries With UNION, INTERSECT, EXCEPT ](https://www.youtube.com/watch?v=krnAfIHqGzI) | 5:03 |
| Database Systems and PostgreSQL Internals | 1.2 | Window Functions | [SQL Window Functions in 10 Minutes ](https://www.youtube.com/watch?v=y1KCM8vbYe4) | 10:13 |
| Database Systems and PostgreSQL Internals | 1.3 | Common Table Expressions and Recursion | [Recursive CTE / Recursive SQL Queries / SQL Tutorial in Hindi 17 ](https://www.youtube.com/watch?v=Rp3EcF9nx6U) | 16:29 |
| Database Systems and PostgreSQL Internals | 2.1 | Pages, Tuples and the Write Ahead Log | [Database Internals: Page Layout Explained (based on PostgreSQL) ](https://www.youtube.com/watch?v=UZ66jEj7Zh0) | 18:42 |
| Database Systems and PostgreSQL Internals | 2.1 | Pages, Tuples and the Write Ahead Log | Companion: [Postgresql Architecture Wal Files /Write Ahead Log / Learnomate Technologies / Ankush Sir ](https://www.youtube.com/watch?v=poLBRs0kF08) | 6:49 |
| Database Systems and PostgreSQL Internals | 2.2 | B-tree and Composite Indexes | [Are Multi-Column Indexes a good idea? ](https://www.youtube.com/watch?v=fW-y-r7CgNI) | 11:21 |
| Database Systems and PostgreSQL Internals | 2.2 | B-tree and Composite Indexes | Companion: [PostgreSQL indexes. B-Tree or Hash. What is better? How it works? ](https://www.youtube.com/watch?v=9eqKRT5K8hI) | 5:49 |
| Database Systems and PostgreSQL Internals | 2.3 | GIN, GiST, BRIN and Partial Indexes | [How to Choose PostgreSQL Indexes: B-Tree, Hash, BRIN, GIN & GiST ](https://www.youtube.com/watch?v=8s35iHLGHww) | 13:05 |
| Database Systems and PostgreSQL Internals | 2.3 | GIN, GiST, BRIN and Partial Indexes | Companion: [PostgreSQL Partial Indexes 08/12 ](https://www.youtube.com/watch?v=rcMVaKR8czY) | 4:02 |
| Database Systems and PostgreSQL Internals | 3.1 | Reading EXPLAIN ANALYZE | [Understanding Explain and Explain Analyze in PostgreSQL ](https://www.youtube.com/watch?v=GmX8tjT7UcQ) | 8:11 |
| Database Systems and PostgreSQL Internals | 3.2 | Join Algorithms, Statistics and Memory | [How nested loop, hash, and merge joins work. ](https://www.youtube.com/watch?v=-htbah3eCYg) | 11:07 |
| Database Systems and PostgreSQL Internals | 3.3 | Table Partitioning | [PostgreSQL Partitioning Tutorial ](https://www.youtube.com/watch?v=oJj-pltxBUM) | 11:43 |
| Database Systems and PostgreSQL Internals | 4.1 | ACID and Isolation Levels | [Transaction Isolation Levels and Anomalies in PostgreSQL ](https://www.youtube.com/watch?v=KbkLQM5LARs) | 9:36 |
| Database Systems and PostgreSQL Internals | 4.2 | Row Level Locking | [Postgres Concurrency Control: SELECT FOR UPDATE ](https://www.youtube.com/watch?v=FA5XuXx0PC8) | 8:53 |
| Database Systems and PostgreSQL Internals | 4.2 | Row Level Locking | Companion: [The Skip Locked feature in Postgres 9.5 ](https://www.youtube.com/watch?v=m6-63kpttQk) | 3:37 |
| Database Systems and PostgreSQL Internals | 4.3 | MVCC, VACUUM and Deadlocks | [PostgreSQL Internals in Action: MVCC ](https://www.youtube.com/watch?v=TBmDBw1IIoY) | 16:06 |
| Database Systems and PostgreSQL Internals | 4.3 | MVCC, VACUUM and Deadlocks | Companion: [PostgreSQL Deadlock Explained with Python – Simulating and Fixing Deadlocks ](https://www.youtube.com/watch?v=WxRV_VL0yEw) | 4:10 |
