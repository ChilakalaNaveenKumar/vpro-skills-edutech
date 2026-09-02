// The eight projects, each with the reason it is on the list.
//
// The previous version of this file had a name and a single adjective-heavy line
// per project ("Build ChatGPT-like intelligent assistants"), which told a reader
// nothing they could evaluate. `detail` names the decision the student has to
// make and the failure they will meet, because that is what distinguishes having
// built something from having followed along while somebody built it.
//
// `week` is the point in the ninety days the project ships. It is left undefined
// where the ordering is not yet fixed rather than invented - a schedule printed
// on a page is a promise.

export interface Project {
  name: string
  description: string
  detail: string
  week?: string
}

export const PROJECTS: Project[] = [
  {
    name: 'RAG Knowledge Bot',
    description: 'Answer questions over your own PDFs, documents and databases.',
    detail:
      'You choose the chunk size, the embedding model and the similarity threshold, then watch what each choice does to answer quality on documents you brought in yourself.',
    week: 'Week 3',
  },
  {
    name: 'AI Chatbot',
    description: 'An assistant with memory and guardrails.',
    detail:
      'Conversation state, context windows, and refusing the things it should refuse - which is the part every demo chatbot skips.',
    week: 'Week 4',
  },
  {
    name: 'AI Resume Analyzer',
    description: 'Score and rewrite a resume against a real job description.',
    detail:
      'Structured extraction out of messy real-world documents, with an evaluation you can actually measure instead of eyeballing.',
    week: 'Week 5',
  },
  {
    name: 'AI Voice Assistant',
    description: 'Speech to text and text to speech, end to end.',
    detail:
      'Latency is the entire problem here. You will measure it first, then find out where it is going, then fix it.',
    week: 'Week 7',
  },
  {
    name: 'MCP Integration',
    description: 'Connect a model to real external tools and APIs.',
    detail:
      'Build an MCP server, expose real tools, and handle the failures: timeouts, malformed arguments, and calls the model should have refused to make.',
    week: 'Week 9',
  },
  {
    name: 'Agentic AI System',
    description: 'Multi-step autonomous agents with CrewAI.',
    detail:
      'Planning, tool selection, and recovery when a step fails half way through and leaves the work in a state nobody designed for.',
    week: 'Week 10',
  },
  {
    name: 'Multi-Agent Automation',
    description: 'Several agents coordinating on one workflow.',
    detail:
      'Where most agent demos come apart. You build the loop guards, the hand-off contracts and the stopping conditions that let it survive real input.',
    week: 'Week 11',
  },
  {
    name: 'Cloud Deployment',
    description: 'Ship and monitor the work on real cloud infrastructure.',
    detail:
      'Every project above goes to a real URL with logging and cost monitoring attached, because a project that only runs on your laptop has not been finished.',
    week: 'Week 12',
  },
]
