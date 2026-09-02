// The marketing roadmap - deliberately separate from a Course's Topic rows,
// which stay auth-gated behind /api/courses/{id}/topics.

export interface Module {
  order: number
  name: string
  topics: string[]
}

export const MODULES: Module[] = [
  { order: 1, name: 'Python Fundamentals', topics: ['Variables & Data Types', 'Functions', 'Loops', 'OOP Concepts', 'File Handling'] },
  { order: 2, name: 'Machine Learning', topics: ['Regression', 'Classification', 'Clustering', 'Model Evaluation', 'Scikit Learn'] },
  { order: 3, name: 'Deep Learning', topics: ['Neural Networks', 'TensorFlow', 'Keras', 'CNN', 'Transfer Learning'] },
  { order: 4, name: 'Generative AI', topics: ['LLMs', 'Prompt Engineering', 'ChatGPT APIs', 'LangChain', 'Fine Tuning'] },
  { order: 5, name: 'Agentic AI', topics: ['AI Agents', 'CrewAI', 'AutoGen', 'Task Automation', 'Multi-Agent Systems'] },
  { order: 6, name: 'RAG + MCP', topics: ['Vector Databases', 'Pinecone', 'Retrieval Systems', 'MCP', 'Enterprise AI'] },
]
