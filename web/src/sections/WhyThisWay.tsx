import { WHY_THIS_WAY } from '../content/narrative'
import { STEPS } from '../content/howItWorks'
import { Prose } from '../components/Prose'
import SplitWords from '../motion/SplitWords'
import Section, { SectionLabel } from './Section'

// Section 01. The argument, before any feature list.
//
// This is the section the previous version of the page was missing entirely. It
// had a "Why now" chapter full of market-size statistics, which argued that AI is
// large - true, and irrelevant to somebody deciding where to learn it. This
// argues the thing the product actually answers.
export default function WhyThisWay() {
  const loop = [STEPS[2], STEPS[3], STEPS[4]]

  return (
    <Section id="why" className="band-paper border-y border-[color:var(--rule)]">
      <div className="shell py-24 lg:py-32">
        <SectionLabel id="why" title={WHY_THIS_WAY.eyebrow} />

        <h2
          aria-label={WHY_THIS_WAY.heading}
          className="display mt-8 max-w-[26ch] text-[clamp(1.9rem,4.6vw,3.4rem)] text-[color:var(--on-ink)]"
        >
          <SplitWords text={WHY_THIS_WAY.heading} />
        </h2>

        <div className="mt-14 grid gap-x-16 gap-y-14 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] lg:items-start">
          <Prose paras={WHY_THIS_WAY.paras} className="max-w-2xl" />

          {/* The loop the last paragraph names, drawn as the three steps it is.
              A summary of the mechanism, placed where the argument lands. */}
          <aside className="rise border border-[color:var(--rule)] bg-white p-7 lg:sticky lg:top-28">
            <p className="text-[0.6rem] font-semibold uppercase tracking-[0.22em] text-[color:var(--on-ink-mute)]">
              The loop
            </p>
            <ol className="mt-5">
              {loop.map((step, index) => (
                <li key={step.order} className="focus-step border-t border-[color:var(--rule)] py-4 first:border-t-0 first:pt-0">
                  <div className="flex items-baseline gap-3">
                    <span className="tnum text-[0.62rem] text-[color:var(--signal-text)]">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <h3 className="text-[0.98rem] font-semibold leading-snug text-[color:var(--on-ink)]">
                      {step.title}
                    </h3>
                  </div>
                  <p className="mt-1.5 pl-[1.65rem] text-[0.86rem] leading-relaxed text-[color:var(--on-ink-mute)]">
                    {step.body}
                  </p>
                </li>
              ))}
            </ol>
            <span aria-hidden="true" className="rule-draw mt-7 block !bg-[color:var(--signal)] !opacity-100" />
          </aside>
        </div>
      </div>
    </Section>
  )
}
