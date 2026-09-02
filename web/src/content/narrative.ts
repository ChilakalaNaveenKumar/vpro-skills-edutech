// The long-form copy. Written to the standard set by the Digi-Setu spec: name
// the reader's actual problem with enough specificity that they recognise
// themselves in it, then let the product be the answer instead of asserting it.
//
// One rule held throughout: every claim below is answerable by something this
// codebase actually does. Ordered topics, one attempt per assessment, a scored
// result with the correct answer beside yours, a history of attempts - those are
// real tables and real screens. Nothing here promises a job, a salary, or a
// number nobody can produce.
//
// APPROVAL REQUIRED: the "Why every session is live" letter is written in
// Sambasiva Rao's first person. He has to read and approve every line of it
// before this goes live, exactly as the spec requires for first-person copy.

/** A run of text, optionally highlighted. The content decides what gets marked,
 *  never the component - so the emphasis is reviewable as copy. */
export type Segment =
  | string
  | { text: string; mark: 'signal' | 'mute' }
  | { text: string; strike: true }

export interface Narrative {
  eyebrow: string
  heading: string
  paras: Segment[][]
}

// The problem. Deliberately not about AI being a big market - it is about the
// specific, recognisable experience of finishing something and being no better
// at it, which is exactly the failure an assessment-gated syllabus addresses.
export const WHY_THIS_WAY: Narrative = {
  eyebrow: 'Why it is built this way',
  heading: 'You can finish a course and still not know whether you learned anything.',
  paras: [
    [
      'You buy the course. You watch it at one and a half times speed. The progress bar fills, and ',
      { text: 'a filling progress bar feels exactly like learning', mark: 'signal' },
      ' right up until somebody asks you a question.',
    ],
    [
      'Nothing in a recorded course is willing to tell you no. Skip a topic and it lets you. Half-understand something and it moves on anyway. The only signal you get back is a percentage, and that percentage measures ',
      { text: 'how much you have watched, not how much you can do', mark: 'signal' },
      '.',
    ],
    [
      'So you find out in the interview. Not that you forgot a definition - that you never really had it, and there was nobody in the room to catch it at the time.',
    ],
    [
      'Attendance is not knowledge. A certificate for attendance is worth precisely what it measures, which is attendance.',
    ],
    [
      'What actually closes that gap is small, repeated and slightly uncomfortable: a topic, then a test you get ',
      { text: 'one attempt at', mark: 'signal' },
      ', then the answer you chose sitting next to the one that was correct. That loop is the entire design of this platform, and everything else here exists to serve it.',
    ],
  ],
}

// The trainer's own voice. Answers the one question a live-class price has to
// answer: why not just watch a recording.
export const WHY_LIVE: Narrative = {
  eyebrow: 'From the trainer',
  heading: 'Why every session is live',
  paras: [
    [
      'I have spent seventeen years building software, cloud systems and enterprise AI, and I take the sessions myself. Not an assistant, and not last year\u2019s recording.',
    ],
    [
      'I teach live because ',
      { text: 'the useful half of this work is what happens when it breaks', mark: 'signal' },
      ', and a recording cannot look at your screen. When your model trains and then predicts nothing, when your agent loops forever, when your retrieval returns the same paragraph for every question you ask it - you need somebody who can see what you are actually looking at, while you are looking at it.',
    ],
    [
      'You get the recordings as well, for the session you had to miss. The recording is the backup. It is not the course.',
    ],
  ],
}

// Qualifying and disqualifying, side by side. The right-hand column is the more
// valuable of the two: a page that tells you when to walk away is the only kind
// worth believing when it tells you to stay.
export const FOR_WHOM = {
  eyebrow: 'Before you spend money',
  heading: 'Who this is for, and who it is not for',
  good: [
    'You can hold a fixed hour, live, for the length of the batch',
    'You want to be told you are wrong early, rather than politely and too late',
    'You are starting with little or no code and will spend the first weeks on fundamentals',
    'You want to explain your own projects line by line, not just show that they run',
  ],
  notGood: [
    'You want a self-paced library to get through over a weekend',
    'You want the certificate more than you want the skill',
    'You cannot attend live and only want the recordings',
    'You are looking for a guaranteed placement - no honest institute promises that',
  ],
  footnote: 'If the right-hand column describes you, do not enrol. Ask us on WhatsApp and we will tell you so.',
} as const

// What exists at the end that did not exist at the start. Concrete artefacts,
// not adjectives.
export const OUTCOMES = [
  'Eight projects you built yourself, and can walk somebody through',
  'A retrieval system answering questions over documents you brought',
  'A multi-agent workflow that finishes multi-step work unattended',
  'An assessment history showing what you got right, and where you were wrong',
] as const
