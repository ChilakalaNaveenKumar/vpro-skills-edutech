import type { VisualKey } from '../visuals/registry'

// The organization's six courses, matching backend/scripts/seed_courses.py.
//
// Each course gets its own page rather than being flattened onto the home page.
// Curricula are the standard, defensible technology sets for each track. What is
// deliberately absent: fees, batch dates and placement percentages - those are
// business facts that belong to a batch, not to a syllabus, and the admin panel
// is where they are set.

export interface CourseModule {
  order: number
  name: string
  /** Explainer canvas, where one exists for the concept. */
  visual?: VisualKey
  summary: string
  builds?: string
  topics: string[]
}

export interface CourseProject {
  name: string
  description: string
}

export interface CourseContent {
  slug: string
  /** Must match the Course.name seeded in the backend. */
  name: string
  tagline: string
  summary: string
  level: string
  prerequisites: string
  forWhom: string[]
  modules: CourseModule[]
  projects: CourseProject[]
  outcomes: string[]
  /** The track the marketing site currently leads with. */
  flagship?: boolean
  /** Marks from techMarks.ts. Every one must appear in this course's modules. */
  techs: string[]
  /** Panel accent, as an oklch hue. Distinct per course, one lightness family. */
  hue: number
}


const AGENTIC_AI: CourseContent = {
  slug: 'agentic-ai',
  hue: 52,
  techs: ['python', 'tensorflow', 'openai-icon', 'anthropic-icon', 'pinecone-icon', 'aws'],
  name: 'Agentic AI',
  tagline: 'Become an AI engineer in 90 days',
  summary:
    'The full path from writing your first Python function to shipping agents that use tools and answer from your own documents. Python, machine learning, deep learning, generative AI, agents, RAG and MCP, built up through projects rather than lectures about them.',
  level: 'Beginner to job-ready',
  prerequisites: 'None. The first module starts at variables.',
  forWhom: ['B.Tech and M.Tech students', 'Working professionals moving into AI', 'Job seekers building a portfolio'],
  flagship: true,
  modules: [
    {
      order: 1,
      name: 'Python Fundamentals',
      visual: 'python',
      summary:
        'Start from zero. By the end you read and write Python without looking every line up - variables, control flow, functions, objects and files.',
      builds: 'A working script you wrote yourself',
      topics: ['Variables & Data Types', 'Functions', 'Loops', 'OOP Concepts', 'File Handling'],
    },
    {
      order: 2,
      name: 'Machine Learning',
      visual: 'ml',
      summary:
        'Train models on real data, and learn to tell a good one from a lucky one. Regression, classification, clustering, and the evaluation habits that stop you fooling yourself.',
      builds: 'Your first trained and properly evaluated model',
      topics: ['Regression', 'Classification', 'Clustering', 'Model Evaluation', 'Scikit Learn'],
    },
    {
      order: 3,
      name: 'Deep Learning',
      visual: 'deep',
      summary:
        'Move from shallow models to networks. Build and train them in TensorFlow and Keras, then use transfer learning to get strong results without a data centre.',
      builds: 'An image model trained on your own data',
      topics: ['Neural Networks', 'TensorFlow', 'Keras', 'CNN', 'Transfer Learning'],
    },
    {
      order: 4,
      name: 'Generative AI',
      visual: 'genai',
      summary:
        'Work with LLMs the way engineers do: prompts that hold up under pressure, API calls with real error handling, LangChain for structure, and fine-tuning when prompting is not enough.',
      builds: 'An LLM-backed app with a real interface',
      topics: ['LLMs', 'Prompt Engineering', 'ChatGPT APIs', 'LangChain', 'Fine Tuning'],
    },
    {
      order: 5,
      name: 'Agentic AI',
      visual: 'agentic',
      summary:
        'Give models tools and let them act. Plan-and-execute loops, CrewAI and AutoGen, delegation between agents, and the guardrails that keep an agent useful rather than expensive.',
      builds: 'A multi-agent system that finishes a task end to end',
      topics: ['AI Agents', 'CrewAI', 'AutoGen', 'Task Automation', 'Multi-Agent Systems'],
    },
    {
      order: 6,
      name: 'RAG + MCP',
      visual: 'rag',
      summary:
        'Ground answers in your own documents. Chunking, embeddings and vector search, then MCP so a model can reach real tools and real data.',
      builds: 'A retrieval assistant over a document set you choose',
      topics: ['Vector Databases', 'Pinecone', 'Retrieval Systems', 'MCP', 'Enterprise AI'],
    },
  ],
  projects: [
    { name: 'AI Resume Analyzer', description: 'Score and critique a resume against a job description.' },
    { name: 'AI Chatbot', description: 'A conversational assistant with memory and streaming replies.' },
    { name: 'RAG Knowledge Bot', description: 'Answer questions from PDFs, documents and databases.' },
    { name: 'AI Voice Assistant', description: 'Speech to text, a model in the middle, text back to speech.' },
    { name: 'Agentic AI System', description: 'Multi-step agents that plan, act and check their own work.' },
    { name: 'Multi-Agent Automation', description: 'Several agents dividing one job between them.' },
    { name: 'MCP Integration', description: 'Connect a model to external tools and APIs over MCP.' },
    { name: 'Cloud AI Deployment', description: 'Ship one of your projects so other people can use it.' },
  ],
  outcomes: [
    'A portfolio of AI projects you can walk an interviewer through',
    'The vocabulary to hold your own in an AI engineering interview',
    'Working habits for evaluation, not just building',
    'A certificate on completion',
  ],
}

const PYTHON_FULL_STACK: CourseContent = {
  slug: 'python-full-stack',
  hue: 232,
  techs: ['python', 'django-icon', 'fastapi-icon', 'react', 'postgresql', 'docker-icon'],
  name: 'Python Full Stack',
  tagline: 'Python on the server, a real interface on the front',
  summary:
    'Build and ship complete web applications in Python. The language properly first, then databases, then APIs with Django and FastAPI, a real frontend on top, and deployment that survives contact with users.',
  level: 'Beginner to job-ready',
  prerequisites: 'None. The first module starts at variables.',
  forWhom: ['Students targeting developer roles', 'Testers and support engineers moving into development', 'Anyone who wants one language end to end'],
  modules: [
    {
      order: 1,
      name: 'Python Fundamentals',
      visual: 'python',
      summary: 'The language itself, properly - so the framework modules later are about the framework, not about Python.',
      builds: 'A command-line tool you wrote from scratch',
      topics: ['Variables & Data Types', 'Control Flow', 'Functions', 'OOP Concepts', 'Modules & Virtual Environments'],
    },
    {
      order: 2,
      name: 'Databases & SQL',
      summary: 'Model data so it stays correct, then query it without fear. Schema design, joins, indexes and the ORM layer above them.',
      builds: 'A normalised schema with working queries',
      topics: ['Relational Modelling', 'SQL Joins & Aggregates', 'Indexes', 'PostgreSQL', 'SQLAlchemy ORM'],
    },
    {
      order: 3,
      name: 'Django',
      summary: 'The batteries-included path: models, views, templates, admin and auth, using the framework the way its authors intended.',
      builds: 'A multi-user Django application with an admin panel',
      topics: ['Models & Migrations', 'Views & Templates', 'Django Admin', 'Authentication', 'Forms & Validation'],
    },
    {
      order: 4,
      name: 'REST APIs with FastAPI',
      summary: 'Typed, documented HTTP APIs: request validation, auth tokens, error shapes, and tests that run in CI.',
      builds: 'A documented API with authentication and tests',
      topics: ['Routing & Pydantic Schemas', 'JWT Authentication', 'Dependency Injection', 'Error Handling', 'Pytest'],
    },
    {
      order: 5,
      name: 'Frontend',
      summary: 'Enough modern frontend to build the interface your API deserves - components, state, forms and calling your own endpoints.',
      builds: 'A React interface talking to your API',
      topics: ['HTML & CSS Layout', 'JavaScript Essentials', 'React Components & State', 'Forms & Validation', 'Calling REST APIs'],
    },
    {
      order: 6,
      name: 'Deployment',
      summary: 'Get it off your laptop. Containers, environment configuration, a managed database, and logs you can actually read.',
      builds: 'Your application live on a public URL',
      topics: ['Git & Branching', 'Docker', 'Environment Config', 'CI/CD Basics', 'Logging & Monitoring'],
    },
  ],
  projects: [
    { name: 'Task Manager API', description: 'Authenticated CRUD with tests and generated documentation.' },
    { name: 'Django Admin Portal', description: 'A multi-role internal tool backed by a real schema.' },
    { name: 'E-commerce Backend', description: 'Catalogue, cart and order flow with payment stubs.' },
    { name: 'React Dashboard', description: 'A frontend consuming your own API, with auth handled.' },
    { name: 'Deployed Full Stack App', description: 'Everything wired together and running in the cloud.' },
  ],
  outcomes: [
    'Applications you can demo on a public URL',
    'One language you are genuinely comfortable in, front to back',
    'Git, Docker and deployment habits employers assume you have',
    'A certificate on completion',
  ],
}

const JAVA_FULL_STACK: CourseContent = {
  slug: 'java-full-stack',
  hue: 18,
  techs: ['java', 'spring-icon', 'hibernate', 'maven', 'react', 'docker-icon'],
  name: 'Java Full Stack',
  tagline: 'The enterprise stack, taught the way teams actually use it',
  summary:
    'Core Java done properly, then Spring Boot, JPA and REST, a frontend on top, and the build and deployment tooling every Java team expects you to know on day one.',
  level: 'Beginner to job-ready',
  prerequisites: 'None. Core Java starts from first principles.',
  forWhom: ['Students targeting service-company and product roles', 'Professionals in support or QA moving to development', 'Anyone aiming at the widest enterprise job market'],
  modules: [
    {
      order: 1,
      name: 'Core Java',
      summary: 'The language and the JVM underneath it: types, objects, collections, generics and exceptions, with the reasoning behind each.',
      builds: 'A console application using collections properly',
      topics: ['Data Types & Operators', 'OOP & Interfaces', 'Collections Framework', 'Generics', 'Exceptions'],
    },
    {
      order: 2,
      name: 'Advanced Java',
      summary: 'The modern parts of the language plus how Java talks to a database directly, before a framework hides it.',
      builds: 'A JDBC data layer with transactions',
      topics: ['Streams & Lambdas', 'Concurrency Basics', 'JDBC', 'File & IO', 'Maven Build'],
    },
    {
      order: 3,
      name: 'Databases & JPA',
      summary: 'Relational modelling, then mapping it to objects without generating a thousand queries by accident.',
      builds: 'An entity model with relationships that query efficiently',
      topics: ['Relational Modelling', 'SQL Joins & Indexes', 'JPA Entities', 'Hibernate Mapping', 'Spring Data Repositories'],
    },
    {
      order: 4,
      name: 'Spring Boot & REST',
      summary: 'Dependency injection, layered services, REST controllers, validation, security and tests - the framework as a team uses it.',
      builds: 'A secured REST service with layered architecture',
      topics: ['Dependency Injection', 'REST Controllers', 'Validation', 'Spring Security & JWT', 'JUnit & Mockito'],
    },
    {
      order: 5,
      name: 'Frontend',
      summary: 'A modern interface for your service: components, state, routing and calling your own endpoints.',
      builds: 'A React interface for your Spring service',
      topics: ['HTML & CSS Layout', 'JavaScript Essentials', 'React Components & State', 'Routing', 'Calling REST APIs'],
    },
    {
      order: 6,
      name: 'Deployment',
      summary: 'Package it, ship it, watch it. Containers, configuration per environment, pipelines and logs.',
      builds: 'Your service running in a container in the cloud',
      topics: ['Git & Branching', 'Docker', 'Environment Profiles', 'CI/CD Basics', 'Logging & Monitoring'],
    },
  ],
  projects: [
    { name: 'Inventory Service', description: 'Layered Spring Boot service with JPA and tests.' },
    { name: 'Secured REST API', description: 'JWT auth, roles and validation done properly.' },
    { name: 'Banking Transactions Module', description: 'Transactional integrity under concurrent writes.' },
    { name: 'React Frontend', description: 'An interface consuming your own secured API.' },
    { name: 'Containerised Deployment', description: 'The whole stack running from one compose file.' },
  ],
  outcomes: [
    'A Spring Boot service you can defend line by line',
    'Comfort with the tooling enterprise teams assume - Maven, Git, Docker',
    'Test-writing habits, not just test-passing ones',
    'A certificate on completion',
  ],
}

const DOTNET_FULL_STACK: CourseContent = {
  slug: 'dotnet-full-stack',
  hue: 292,
  techs: ['dotnet', 'c-sharp', 'react', 'microsoft-azure', 'docker-icon'],
  name: '.NET Full Stack',
  tagline: 'C# and ASP.NET Core, end to end',
  summary:
    'C# properly first, then ASP.NET Core web APIs, Entity Framework Core against a real database, a frontend on top, and deployment to Azure.',
  level: 'Beginner to job-ready',
  prerequisites: 'None. C# starts from first principles.',
  forWhom: ['Students targeting Microsoft-stack employers', 'Professionals already near .NET teams', 'Anyone who prefers a strongly typed, tooled ecosystem'],
  modules: [
    {
      order: 1,
      name: 'C# Fundamentals',
      summary: 'The language and the runtime: types, classes, interfaces, collections, LINQ and async, with the reasoning behind each.',
      builds: 'A console application using LINQ and async correctly',
      topics: ['Types & Operators', 'OOP & Interfaces', 'Collections', 'LINQ', 'Async & Await'],
    },
    {
      order: 2,
      name: 'Databases & EF Core',
      summary: 'Model data, migrate it safely, and query it without surprising the database.',
      builds: 'A migrated schema with efficient queries',
      topics: ['Relational Modelling', 'SQL Joins & Indexes', 'EF Core Entities', 'Migrations', 'SQL Server'],
    },
    {
      order: 3,
      name: 'ASP.NET Core Web API',
      summary: 'Controllers, dependency injection, model validation, error shapes and unit tests - the framework as teams run it.',
      builds: 'A documented Web API with validation and tests',
      topics: ['Controllers & Routing', 'Dependency Injection', 'Model Validation', 'Middleware', 'xUnit Testing'],
    },
    {
      order: 4,
      name: 'Identity & Security',
      summary: 'Who the caller is and what they may do: authentication, tokens, roles and the mistakes that leak data.',
      builds: 'Role-based authorization across your endpoints',
      topics: ['ASP.NET Identity', 'JWT Tokens', 'Roles & Policies', 'Secrets Management', 'HTTPS & CORS'],
    },
    {
      order: 5,
      name: 'Frontend',
      summary: 'A modern interface for your API: components, state, forms and typed calls to your own endpoints.',
      builds: 'A React interface talking to your Web API',
      topics: ['HTML & CSS Layout', 'JavaScript Essentials', 'React Components & State', 'Forms', 'Calling REST APIs'],
    },
    {
      order: 6,
      name: 'Azure Deployment',
      summary: 'Ship it to Azure and keep it running: app hosting, a managed database, configuration and pipelines.',
      builds: 'Your application live on Azure',
      topics: ['Git & Branching', 'Docker', 'Azure App Service', 'Azure SQL', 'CI/CD Pipelines'],
    },
  ],
  projects: [
    { name: 'Web API with EF Core', description: 'Full CRUD over a migrated schema, with tests.' },
    { name: 'Role-Based Admin Portal', description: 'Identity, roles and policies enforced end to end.' },
    { name: 'Order Processing Service', description: 'Transactions, validation and failure handling.' },
    { name: 'React Frontend', description: 'A typed interface consuming your own API.' },
    { name: 'Azure Deployment', description: 'App Service plus Azure SQL, deployed from a pipeline.' },
  ],
  outcomes: [
    'A .NET service and interface running in Azure',
    'Fluency in the tooling Microsoft-stack teams expect',
    'Security habits for auth, secrets and transport',
    'A certificate on completion',
  ],
}

const FORWARD_DEPLOYMENT: CourseContent = {
  slug: 'forward-deployment-engineer',
  hue: 168,
  techs: ['python', 'pandas-icon', 'linux-tux', 'docker-icon', 'postgresql', 'git-icon'],
  name: 'Forward Deployment Engineer',
  tagline: 'The engineer who makes software work at the customer',
  summary:
    'A track for the role sitting between engineering and the customer: take a product into somebody else\'s messy environment, get their data into it, integrate it with what they already run, and debug it in production while they watch.',
  level: 'Intermediate - some programming assumed',
  prerequisites: 'Comfortable writing basic Python or JavaScript.',
  forWhom: ['Developers who like customer contact', 'Support and implementation engineers levelling up', 'Consultants who want deeper technical range'],
  modules: [
    {
      order: 1,
      name: 'Python for Integration',
      visual: 'python',
      summary: 'The scripting range the role runs on: files, HTTP, JSON, retries, and code that fails loudly rather than silently.',
      builds: 'A resilient integration script',
      topics: ['Python Essentials', 'HTTP Clients', 'JSON & CSV Handling', 'Error Handling & Retries', 'Logging'],
    },
    {
      order: 2,
      name: 'Data Plumbing',
      summary: 'Somebody else\'s data is never clean. Profile it, reshape it, load it, and prove afterwards that nothing was lost.',
      builds: 'A repeatable pipeline over messy real data',
      topics: ['SQL for Analysis', 'Pandas Transformations', 'Schema Mapping', 'Data Quality Checks', 'Batch vs Incremental Loads'],
    },
    {
      order: 3,
      name: 'APIs & Integration',
      summary: 'Make two systems that were never designed for each other work together, including authentication and rate limits.',
      builds: 'A working two-way integration between systems',
      topics: ['REST & Webhooks', 'OAuth & API Keys', 'Rate Limits & Backoff', 'Idempotency', 'Contract Testing'],
    },
    {
      order: 4,
      name: 'Deploy & Operate',
      summary: 'Install into an environment you do not control, then keep it healthy: containers, configuration, secrets, monitoring.',
      builds: 'A deployment runbook somebody else can follow',
      topics: ['Linux Essentials', 'Docker', 'Environment Config & Secrets', 'Monitoring & Alerts', 'Runbooks'],
    },
    {
      order: 5,
      name: 'Debugging in Production',
      summary: 'Diagnose from logs and metrics under time pressure, in a system you did not write, without breaking it further.',
      builds: 'A written root-cause analysis of a real failure',
      topics: ['Reading Logs & Traces', 'Network Debugging', 'Reproducing Issues', 'Root Cause Analysis', 'Incident Communication'],
    },
    {
      order: 6,
      name: 'Working With Customers',
      summary: 'The half of the job that is not code: scoping what is actually being asked, saying no well, and writing it down.',
      builds: 'A scoped solution document for a real requirement',
      topics: ['Requirement Discovery', 'Scoping & Trade-offs', 'Demos & Handover', 'Technical Documentation', 'Escalation Paths'],
    },
  ],
  projects: [
    { name: 'Legacy Data Migration', description: 'Move a messy dataset into a new schema, with verification.' },
    { name: 'Two-System Integration', description: 'Sync records both ways, handling failure and duplicates.' },
    { name: 'On-Site Deployment Kit', description: 'A containerised install plus the runbook for it.' },
    { name: 'Production Incident Report', description: 'Diagnose a seeded failure and write the analysis.' },
    { name: 'Customer Solution Document', description: 'Turn a vague request into a scoped technical plan.' },
  ],
  outcomes: [
    'The ability to land software in an environment you do not control',
    'Debugging range across data, network and application layers',
    'Written artefacts - runbooks, RCAs, scoping docs - to show employers',
    'A certificate on completion',
  ],
}

const QUANTUM_COMPUTING: CourseContent = {
  slug: 'quantum-computing',
  hue: 268,
  techs: ['python', 'ibm', 'jupyter', 'numpy'],
  name: 'Quantum Computing',
  tagline: 'From linear algebra to running circuits on real hardware',
  summary:
    'A working introduction rather than a popular-science tour. The mathematics you need, what a qubit actually is, how gates and circuits compose, the canonical algorithms, and running your own circuits through Qiskit.',
  level: 'Intermediate - comfortable with mathematics',
  prerequisites: 'Basic Python, and willingness to work with matrices and complex numbers.',
  forWhom: ['Engineering and science students', 'Developers curious beyond the hype', 'Researchers needing a practical starting point'],
  modules: [
    {
      order: 1,
      name: 'Mathematical Foundations',
      summary: 'The specific mathematics quantum computing needs, and no more: complex amplitudes, vectors, matrices and probability.',
      builds: 'Hand-worked state calculations that match the simulator',
      topics: ['Complex Numbers', 'Vectors & Inner Products', 'Matrices & Unitaries', 'Eigenvalues', 'Probability Basics'],
    },
    {
      order: 2,
      name: 'Qubits & Superposition',
      summary: 'What a qubit is and what it is not. States, superposition, measurement, and why measuring destroys what you had.',
      builds: 'A measurement experiment whose statistics you can predict',
      topics: ['Qubit States', 'Bloch Sphere', 'Superposition', 'Measurement', 'Multi-Qubit States'],
    },
    {
      order: 3,
      name: 'Gates & Circuits',
      summary: 'Build computation out of reversible operations: single and multi-qubit gates, entanglement, and reading a circuit diagram.',
      builds: 'A circuit producing a Bell state, verified',
      topics: ['Pauli & Hadamard Gates', 'Phase Gates', 'CNOT & Entanglement', 'Circuit Composition', 'Bell States'],
    },
    {
      order: 4,
      name: 'Qiskit in Practice',
      summary: 'Write, simulate and run circuits, then confront what real hardware does to a clean idea.',
      builds: 'A circuit run on a real backend, results compared to simulation',
      topics: ['Qiskit Basics', 'Simulators', 'Transpilation', 'Real Backends', 'Noise & Error Rates'],
    },
    {
      order: 5,
      name: 'Core Algorithms',
      summary: 'The canonical algorithms and, more usefully, the pattern of interference they all share.',
      builds: 'Working implementations of Deutsch-Jozsa and Grover',
      topics: ['Deutsch-Jozsa', 'Grover Search', 'Quantum Fourier Transform', 'Phase Estimation', 'Shor Overview'],
    },
    {
      order: 6,
      name: 'Applications & Limits',
      summary: 'Where quantum plausibly helps, where it does not, and how to read a claim critically.',
      builds: 'A reasoned assessment of one published claim',
      topics: ['Optimisation (QAOA)', 'Quantum Chemistry', 'Quantum Machine Learning', 'Error Correction Basics', 'Reading the Literature'],
    },
  ],
  projects: [
    { name: 'Bell State Laboratory', description: 'Build, measure and explain entanglement statistics.' },
    { name: 'Grover Search', description: 'Implement the search and show the speed-up empirically.' },
    { name: 'Noise Comparison', description: 'The same circuit on a simulator and on real hardware.' },
    { name: 'QAOA on a Small Problem', description: 'Optimisation on a graph you can verify by hand.' },
    { name: 'Claim Review', description: 'Assess a published quantum result and defend your reading.' },
  ],
  outcomes: [
    'Circuits you have written, run and explained',
    'The mathematics to read a quantum paper without stalling',
    'A grounded sense of what the technology can and cannot do',
    'A certificate on completion',
  ],
}

export const COURSES: CourseContent[] = [
  AGENTIC_AI,
  PYTHON_FULL_STACK,
  JAVA_FULL_STACK,
  DOTNET_FULL_STACK,
  FORWARD_DEPLOYMENT,
  QUANTUM_COMPUTING,
]

export const FLAGSHIP = AGENTIC_AI

export function courseBySlug(slug: string): CourseContent | undefined {
  return COURSES.find((course) => course.slug === slug)
}

/** Matches a backend Course.name to its marketing content. */
export function courseByName(name: string): CourseContent | undefined {
  const key = name.trim().toLowerCase()
  return COURSES.find((course) => course.name.toLowerCase() === key)
}
