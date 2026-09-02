import type { ReactNode } from 'react'
import { HOW_IT_WORKS, STEPS } from '../content/howItWorks'
import { MENTOR } from '../content/mentor'
import SplitWords from '../motion/SplitWords'
import ScrubStage from '../components/ScrubStage'
import Section, { SectionLabel } from './Section'

const SHORT_NAMES = ['Join', 'Attend', 'Topics', 'Assess', 'Result']

// Wireframes of real portal screens, drawn in type and rules and labelled as
// schematics. They are not screenshots and they are not dressed up as
// screenshots: no invented student names, no fabricated numbers presented as
// this month's results. When real captures of the portal exist they drop
// straight into this slot.
function Panel({ label, children }: { label: string; children: ReactNode }) {
  return (
    <figure className="m-0">
      <div className="bracketed border border-[color:var(--rule)] bg-[color:var(--ink-2)]">
        <p className="border-b border-[color:var(--rule)] px-4 py-2.5 text-[0.6rem] font-semibold uppercase tracking-[0.2em] text-[color:var(--on-ink-mute)]">
          {label}
        </p>
        <div className="px-4 py-4">{children}</div>
      </div>
      <figcaption className="mt-2.5 text-[0.62rem] uppercase tracking-[0.14em] text-[color:var(--on-ink-faint)]">
        Schematic of the student portal
      </figcaption>
    </figure>
  )
}

function Row({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`flex items-baseline justify-between gap-4 border-t border-[color:var(--rule)] py-2 first:border-t-0 first:pt-0 ${className}`}>
      {children}
    </div>
  )
}

const PANELS: ReactNode[] = [
  <Panel key="batch" label="Batch">
    <p className="text-[0.95rem] font-semibold text-[color:var(--on-ink)]">AI Engineer</p>
    <div className="mt-3">
      <Row>
        <span className="text-[0.72rem] text-[color:var(--on-ink-faint)]">Batch</span>
        <span className="tnum text-[0.8rem] text-[color:var(--on-ink-mute)]">A-12</span>
      </Row>
      <Row>
        <span className="text-[0.72rem] text-[color:var(--on-ink-faint)]">Runs</span>
        <span className="tnum text-[0.8rem] text-[color:var(--on-ink-mute)]">12 Sep - 12 Dec</span>
      </Row>
      <Row>
        <span className="text-[0.72rem] text-[color:var(--on-ink-faint)]">Daily</span>
        <span className="tnum text-[0.8rem] font-semibold text-[color:var(--on-ink)]">6:30 - 8:00 PM IST</span>
      </Row>
    </div>
  </Panel>,

  <Panel key="session" label="Session">
    <div className="flex items-center justify-between gap-4">
      <span className="inline-flex items-center gap-2 rounded-full bg-[color:var(--signal)] px-2.5 py-1 text-[0.58rem] font-bold uppercase tracking-[0.12em] text-[color:var(--ink)]">
        <span className="h-1.5 w-1.5 rounded-full bg-ink" aria-hidden="true" />
        Live
      </span>
      <span className="tnum text-[0.9rem] font-bold text-[color:var(--on-ink)]">6:30 - 8:00 PM</span>
    </div>
    <div className="mt-4">
      <Row>
        <span className="text-[0.72rem] text-[color:var(--on-ink-faint)]">Trainer</span>
        <span className="text-[0.8rem] text-[color:var(--on-ink-mute)]">{MENTOR.name}</span>
      </Row>
      <Row>
        <span className="text-[0.72rem] text-[color:var(--on-ink-faint)]">Your question</span>
        <span className="text-[0.8rem] text-[color:var(--on-ink-mute)]">answered in the room</span>
      </Row>
    </div>
  </Panel>,

  <Panel key="topics" label="Topics · in order">
    <ol className="text-[0.82rem]">
      {[
        { name: 'Variables & data types', state: 'done' },
        { name: 'Functions', state: 'done' },
        { name: 'Loops', state: 'current' },
        { name: 'OOP concepts', state: 'locked' },
        { name: 'File handling', state: 'locked' },
      ].map((topic, index) => (
        <li
          key={topic.name}
          className={`flex items-center justify-between gap-3 border-t border-[color:var(--rule)] py-2 first:border-t-0 first:pt-0 ${
            topic.state === 'locked' ? 'text-[color:var(--on-ink-faint)]' : 'text-[color:var(--on-ink-mute)]'
          }`}
        >
          <span className="flex min-w-0 items-baseline gap-3">
            <span className="tnum text-[0.64rem] text-[color:var(--on-ink-faint)]">
              {String(index + 1).padStart(2, '0')}
            </span>
            <span className={`truncate ${topic.state === 'current' ? 'font-semibold text-[color:var(--on-ink)]' : ''}`}>
              {topic.name}
            </span>
          </span>
          {topic.state === 'done' && <span className="text-[0.8rem] text-[color:var(--signal)]" aria-hidden="true">✓</span>}
          {topic.state === 'current' && (
            <span className="rounded-full bg-[color:var(--signal)] px-2 py-0.5 text-[0.55rem] font-bold uppercase tracking-[0.1em] text-[color:var(--ink)]">
              Now
            </span>
          )}
        </li>
      ))}
    </ol>
  </Panel>,

  <Panel key="assessment" label="Assessment · one attempt">
    <p className="tnum text-[0.62rem] uppercase tracking-[0.16em] text-[color:var(--on-ink-faint)]">Question 3 of 10</p>
    <p className="mt-2 text-[0.9rem] font-semibold leading-snug text-[color:var(--on-ink)]">
      Which keyword defines a function in Python?
    </p>
    <ul className="mt-3 text-[0.82rem]">
      {['func', 'def', 'define', 'lambda'].map((option) => (
        <li
          key={option}
          className={`flex items-center gap-3 border-t border-[color:var(--rule)] py-2 ${
            option === 'def' ? 'font-semibold text-[color:var(--on-ink)]' : 'text-[color:var(--on-ink-mute)]'
          }`}
        >
          <span
            aria-hidden="true"
            className={`h-2.5 w-2.5 shrink-0 rounded-full ${
              option === 'def' ? 'bg-[color:var(--signal)] ring-1 ring-[color:var(--signal)]' : 'ring-1 ring-rule'
            }`}
          />
          {option}
        </li>
      ))}
    </ul>
  </Panel>,

  <Panel key="result" label="Result">
    <div className="flex items-end justify-between gap-4">
      <p className="tnum display text-[2rem] font-extrabold leading-none tracking-[-0.04em] text-[color:var(--on-ink)]">
        8<span className="text-[color:var(--on-ink-faint)]">/10</span>
      </p>
      <span className="rounded-full bg-[color:var(--signal)] px-2.5 py-1 text-[0.58rem] font-bold uppercase tracking-[0.12em] text-[color:var(--ink)]">
        Passed
      </span>
    </div>
    <div className="mt-4 flex flex-wrap gap-1.5" aria-hidden="true">
      {['✓', '✓', '✗', '✓', '✓', '✓', '✗', '✓', '✓', '✓'].map((mark, index) => (
        <span
          key={index}
          className={`flex h-6 w-6 items-center justify-center border text-[0.66rem] ${
            mark === '✓' ? 'border-[color:var(--rule)] text-[color:var(--on-ink-mute)]' : 'border-brand-600/50 font-bold text-[color:var(--signal)]'
          }`}
        >
          {mark}
        </span>
      ))}
    </div>
    <div className="mt-4 border-t border-[color:var(--rule)] pt-3 text-[0.78rem]">
      <p className="text-[color:var(--on-ink-faint)]">Question 3</p>
      <p className="mt-1 text-[color:var(--on-ink-mute)]">
        You answered <span className="font-semibold text-[color:var(--signal)]">func</span>
      </p>
      <p className="text-[color:var(--on-ink-mute)]">
        Correct answer <span className="font-semibold text-[color:var(--on-ink)]">def</span>
      </p>
    </div>
  </Panel>,
]

function StepStage({ step, progress }: { step: number; progress: number }) {
  const local = Math.min(1, Math.max(0, progress * STEPS.length - step))

  return (
    <div className="shell flex flex-col pb-10 pt-[9svh]">
      <div className="flex items-baseline justify-between border-b border-[color:var(--rule)] pb-3">
        <span className="text-[0.62rem] font-semibold uppercase tracking-[0.22em] text-[color:var(--on-ink-mute)]">
          {HOW_IT_WORKS.eyebrow}
        </span>
        <span className="tnum text-[0.62rem] uppercase tracking-[0.18em] text-[color:var(--on-ink-faint)]">
          Step {String(step + 1).padStart(2, '0')} of {String(STEPS.length).padStart(2, '0')}
        </span>
      </div>

      <div className="relative mt-8 min-h-[25rem] sm:min-h-[22rem]">
        {STEPS.map((entry, index) => (
          <div
            key={entry.order}
            className={`plate grid gap-x-14 gap-y-7 sm:grid-cols-[minmax(0,1fr)_minmax(0,19rem)] sm:items-start ${
              index === step ? 'is-current' : ''
            }`}
            aria-hidden={index === step ? undefined : 'true'}
          >
            <div className="min-w-0">
              <p className="tnum display text-[clamp(2.4rem,7vw,4.4rem)] font-extrabold leading-[0.85] tracking-[-0.05em] text-brand-500">
                {String(entry.order).padStart(2, '0')}
              </p>
              <h3 className="display mt-3 text-[clamp(1.4rem,3.4vw,2.4rem)] font-extrabold leading-[1.04] tracking-[-0.03em] text-[color:var(--on-ink)]">
                {entry.title}
              </h3>
              <p className="mt-4 max-w-md text-[0.92rem] leading-relaxed text-[color:var(--on-ink-mute)]">{entry.body}</p>
            </div>

            <div className="hidden sm:block">{PANELS[index]}</div>
          </div>
        ))}
      </div>

      <div className="mt-8">
        <div className="flex gap-1.5" aria-hidden="true">
          {STEPS.map((entry, index) => (
            <div key={entry.order} className="h-1 flex-1 overflow-hidden bg-[color:var(--ink-3)]">
              <div
                className={index <= step ? 'h-full bg-[color:var(--signal)]' : 'h-full'}
                style={{ width: index < step ? '100%' : index === step ? `${local * 100}%` : '0%' }}
              />
            </div>
          ))}
        </div>
        <div className="mt-3 flex gap-1.5">
          {SHORT_NAMES.map((name, index) => (
            <span
              key={name}
              className={`flex-1 truncate text-[0.6rem] font-medium uppercase tracking-[0.1em] transition-colors duration-300 ${
                index === step ? 'text-[color:var(--on-ink)]' : 'text-[color:var(--on-ink-faint)]'
              }`}
            >
              {name}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

function StepList() {
  return (
    <ol className="shell">
      {STEPS.map((entry) => (
        <li key={entry.order} className="grid gap-x-10 gap-y-3 border-t border-[color:var(--rule)] py-8 sm:grid-cols-[4rem_minmax(0,1fr)]">
          <p className="tnum display text-[2rem] font-extrabold leading-none tracking-[-0.04em] text-brand-500">
            {String(entry.order).padStart(2, '0')}
          </p>
          <div>
            <h3 className="display text-[1.3rem] font-bold leading-tight tracking-[-0.02em] text-[color:var(--on-ink)]">
              {entry.title}
            </h3>
            <p className="mt-2 max-w-2xl text-[0.92rem] leading-relaxed text-[color:var(--on-ink-mute)]">{entry.body}</p>
          </div>
        </li>
      ))}
    </ol>
  )
}

// Section 03. The platform's actual mechanics, which are the reason to choose it
// over a video library - and the part the previous page never showed at all.
export default function HowItWorks() {
  return (
    <Section id="how" className="border-t border-[color:var(--rule)] bg-[color:var(--ink-2)]">
      <div className="shell pt-24 lg:pt-28">
        <SectionLabel id="how" title={HOW_IT_WORKS.eyebrow} />
        <h2
          aria-label={HOW_IT_WORKS.headline}
          className="display mt-7 max-w-[16ch] text-[clamp(2rem,5vw,3.6rem)] font-extrabold leading-[1.0] tracking-[-0.03em] text-[color:var(--on-ink)]"
        >
          <SplitWords text={HOW_IT_WORKS.headline} />
        </h2>
      </div>

      <ScrubStage
        steps={STEPS.length}
        vhPerStep={0.8}
        className="stage-top"
        render={({ step, progress }) => <StepStage step={step} progress={progress} />}
        fallback={
          <div className="py-14">
            <StepList />
          </div>
        }
      />

      <div className="shell pb-24">
        <p className="rise border-t border-[color:var(--rule)] pt-6 text-[0.86rem] uppercase tracking-[0.16em] text-[color:var(--on-ink-faint)]">
          {HOW_IT_WORKS.footnote}
        </p>
      </div>
    </Section>
  )
}
