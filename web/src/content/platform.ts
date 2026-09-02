// What VPro Skills *is*, as distinct from what it currently teaches.
//
// The previous version of this page sold one course as if it were the whole
// company. It is a platform: backend/scripts/seed_courses.py carries the
// organization's standard course list, and the app's real capabilities
// (ordered topics, one-attempt assessments, instant reviewable results,
// a student portal, a mobile client) belong to the platform, not to any
// single course. Nothing here is a claim about market size or outcomes.

export const PLATFORM = {
  name: 'VPro Skills',
  eyebrow: 'Live instructor-led training',
  /** The fixed part of the headline. The rotating part is HERO_ENDINGS. */
  headline: 'Taught live, so',
  sub: 'Every course runs as a live batch with a named trainer at a fixed time. Topics come in order, each one ends in an assessment, and your result is there the moment you submit.',
  proof: [
    'Live batches',
    'Topics in order',
    'An assessment after every topic',
    'Instant reviewable results',
  ],
} as const

// The four things a live class does that a recording cannot. Each one is proved
// somewhere further down the page, so the hero is making promises the rest of
// the page has to keep - not four interchangeable slogans.
export const HERO_ENDINGS = [
  'nothing gets skipped.',
  'mistakes surface early.',
  'questions get answered.',
  'gaps show up.',
] as const

// Stated plainly next to the schedule, because "live" is the word every
// recorded-video platform also uses.
export const LIVE_CLASS_MEANING = {
  heading: 'What a live class means here',
  body: 'A fixed time, a named trainer, and a batch that moves together. You ask your question while the class is happening, not in a comment box afterwards.',
} as const
