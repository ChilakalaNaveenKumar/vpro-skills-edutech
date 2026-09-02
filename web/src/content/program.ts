// Program positioning, verified from vproskills.com on 2026-09-01.
// AI Engineer is course #1; nothing here hardcodes "AI only" into the layout.

export const PROGRAM = {
  headline: 'Become an AI Engineer in 90 Days',
  sub: 'Master Python, Machine Learning, Deep Learning, Generative AI, RAG, MCP, AI Agents and Real-World Projects.',
  proof: ['Live Classes', 'Real Projects', 'Placement Support', 'Certification'],
  durationDays: 90,
} as const

export const MARKET_CLAIMS = [
  { value: '$1.8 Trillion', label: 'Expected AI market by 2030' },
  { value: '95%', label: 'Companies adopting AI solutions' },
  { value: '₹8-40 LPA', label: 'Average AI engineer salary' },
  { value: '100M+', label: 'New AI jobs expected globally' },
] as const

export const SEGMENTS = [
  {
    id: 'students',
    label: 'B.Tech & M.Tech Students',
    promises: [
      'Build industry projects',
      'Crack internships',
      'Improve placement chances',
      'Stand out from peers',
    ],
  },
  {
    id: 'professionals',
    label: 'Working Professionals',
    promises: [
      'Switch to AI careers',
      'Get higher packages',
      'Automate daily work',
      'Future-proof your career',
    ],
  },
] as const

// The four options the live site's booking form offers.
export const AUDIENCE_OPTIONS = [
  'B.Tech Student',
  'M.Tech Student',
  'Working Professional',
  'Job Seeker',
] as const

export type AudienceOption = (typeof AUDIENCE_OPTIONS)[number]
