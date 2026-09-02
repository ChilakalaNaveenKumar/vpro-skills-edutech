// The one course currently running live. It is a course *on* the platform, not
// the platform itself - which is what the previous version of this page got
// wrong. Market-size and salary claims that used to live here were removed:
// they were unverifiable and they sold a category rather than this classroom.

export const COURSE = {
  name: 'AI Engineer',
  eyebrow: 'Open now',
  headline: 'Become an AI Engineer in 90 days',
  sub: 'Python, Machine Learning, Deep Learning, Generative AI, Agentic AI, RAG and MCP - built up through real projects rather than lectures about them.',
  proof: ['Live classes', 'Real projects', 'Placement support', 'Certification'],
  durationDays: 90,
} as const

// The four options the live site's booking form offers.
export const AUDIENCE_OPTIONS = [
  'B.Tech Student',
  'M.Tech Student',
  'Working Professional',
  'Job Seeker',
] as const

export type AudienceOption = (typeof AUDIENCE_OPTIONS)[number]
