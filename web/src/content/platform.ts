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
  sub: 'Every session is taught live, online, at a fixed hour. Ask your question while the class is happening.',
} as const

/**
 * "Where" is the fact a visitor checks before the rest. It used to say
 * "Ameerpet, or online", which is not true: every class is online. The
 * Ameerpet line in the footer is the office, not a classroom.
 */
export const HERO_FACTS = [
  { k: 'Format', v: 'Live, fixed hour' },
  { k: 'Questions', v: 'Asked live' },
  { k: 'After class', v: 'Live support' },
  { k: 'Where', v: 'Online' },
] as const
