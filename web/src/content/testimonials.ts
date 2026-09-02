// No photographs exist for these students, so they ship as editorial quotes
// with name and role in type - never invented faces or initial avatars.

export interface Testimonial {
  quote: string
  name: string
  role: string
}

export const TESTIMONIALS: Testimonial[] = [
  { quote: 'The AI roadmap was crystal clear. I built my first AI Chatbot within 3 weeks.', name: 'Rahul Kumar', role: 'B.Tech Student' },
  { quote: 'Agentic AI and RAG modules were amazing. Helped me switch to AI projects in my company.', name: 'Priya Sharma', role: 'Software Engineer' },
  { quote: 'The projects and mentor support helped me gain confidence in AI interviews.', name: 'Vamsi Krishna', role: 'Job Seeker' },
  { quote: 'One of the best practical AI training programs. Highly recommended.', name: 'Sandeep Reddy', role: 'Working Professional' },
  { quote: 'Real-world projects and live sessions made learning easy and engaging.', name: 'Anjali Verma', role: 'M.Tech Student' },
  { quote: 'The Generative AI and MCP modules were worth every minute.', name: 'Karthik', role: 'AI Enthusiast' },
]
