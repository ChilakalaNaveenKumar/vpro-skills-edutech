export interface Project {
  name: string
  description: string
}

export const PROJECTS: Project[] = [
  { name: 'AI Resume Analyzer', description: 'Analyze resumes using Generative AI and ATS scoring.' },
  { name: 'AI Chatbot', description: 'Build ChatGPT-like intelligent assistants.' },
  { name: 'RAG Knowledge Bot', description: 'Chat with PDFs, documents and databases.' },
  { name: 'AI Voice Assistant', description: 'Speech-to-text and text-to-speech AI.' },
  { name: 'Agentic AI System', description: 'Multi-step AI agents using CrewAI.' },
  { name: 'Multi-Agent Automation', description: 'Multiple AI agents working together.' },
  { name: 'MCP Integration', description: 'Connect AI to external tools and APIs.' },
  { name: 'Cloud AI Deployment', description: 'Deploy AI apps on AWS and cloud.' },
]
