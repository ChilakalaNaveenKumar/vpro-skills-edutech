// What VPro Skills is, stated once and readable the instant the page paints.
//
// The previous version cycled four endings through the headline. A visitor
// scanning for a start date does not wait for a sentence to finish animating,
// so the sentence is now fixed.

export const PLATFORM = {
  name: 'VPro Skills',
  eyebrow: 'Live instructor-led batches',
  /** Rendered with the second clause in <em>, which the .display rule colours copper. */
  headlineLead: 'Nothing here',
  headlineEmphasis: 'is a recording.',
  sub: 'Every session is taught live at a fixed hour. Ask your question while the class is happening.',
} as const

export const HERO_FACTS = [
  { k: 'Format', v: 'Live, fixed hour' },
  { k: 'Questions', v: 'Asked in the room' },
  { k: 'After class', v: 'Live support' },
  { k: 'Recordings', v: 'Backup, not the course' },
] as const
