// The learning loop. Every step below is a capability that exists in this
// codebase today - batches, ordered topics, one-attempt assessments, scored
// results with per-question review, a results history, and the Expo mobile
// client. Nothing here describes a feature that has not been built.

export interface Step {
  order: number
  title: string
  body: string
}

export const STEPS: Step[] = [
  {
    order: 1,
    title: 'Join a batch',
    body: 'You enrol in a live batch that has a start date, an end date and a fixed daily time - not an open-ended library you are left to pace yourself through.',
  },
  {
    order: 2,
    title: 'Attend live',
    body: 'A named trainer takes the session. Questions get answered while the class is happening.',
  },
  {
    order: 3,
    title: 'Work through topics in order',
    body: 'The syllabus is split into ordered topics, so what comes next is never a guess.',
  },
  {
    order: 4,
    title: 'Take the topic assessment',
    body: 'Multiple choice, one attempt, no retakes. It measures what you learned rather than whether you turned up.',
  },
  {
    order: 5,
    title: 'See exactly what you got wrong',
    body: 'Your score arrives on submit, and every question shows the answer you picked beside the correct one. Each attempt joins a history you can go back through.',
  },
]

export const HOW_IT_WORKS = {
  eyebrow: 'How it works',
  headline: 'A topic. A test. An answer.',
  footnote: 'All of it on the web, or on the phone app.',
} as const
