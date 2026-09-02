import { FOR_WHOM } from '../content/narrative'
import CtaLink from '../components/CtaLink'

// A band rather than a numbered section: it is a filter placed immediately
// before the booking, not a chapter of the story.
//
// The right-hand column is the point. Naming who should not buy is the only
// thing that makes the left-hand column believable, and it saves the refund and
// the bad review that a mis-sold seat produces.
export default function ForWhom() {
  return (
    <section aria-labelledby="for-whom-heading" className="border-t border-[color:var(--rule)]">
      <div className="shell py-24">
        <p className="text-[0.62rem] font-semibold uppercase tracking-[0.22em] text-[color:var(--on-ink-faint)]">
          {FOR_WHOM.eyebrow}
        </p>
        <h2
          id="for-whom-heading"
          className="rise display mt-5 max-w-[22ch] text-[clamp(1.6rem,3.6vw,2.5rem)] font-extrabold leading-[1.06] tracking-[-0.028em] text-[color:var(--on-ink)]"
        >
          {FOR_WHOM.heading}
        </h2>

        <div className="mt-12 grid gap-x-14 gap-y-10 lg:grid-cols-2">
          <div className="rise">
            <p className="flex items-center gap-3 text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-[color:var(--signal)]">
              <span className="h-px w-6 bg-[color:var(--signal)]" aria-hidden="true" />
              Join if
            </p>
            <ul className="mt-5">
              {FOR_WHOM.good.map((item) => (
                <li
                  key={item}
                  className="flex items-baseline gap-3 border-t border-[color:var(--rule)] py-3.5 text-[0.95rem] leading-relaxed text-[color:var(--on-ink)]"
                >
                  <span className="text-[color:var(--signal)]" aria-hidden="true">
                    +
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="rise">
            <p className="flex items-center gap-3 text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-[color:var(--on-ink-faint)]">
              <span className="h-px w-6 bg-[color:var(--rule)]" aria-hidden="true" />
              Do not join if
            </p>
            <ul className="mt-5">
              {FOR_WHOM.notGood.map((item) => (
                <li
                  key={item}
                  className="flex items-baseline gap-3 border-t border-[color:var(--rule)] py-3.5 text-[0.95rem] leading-relaxed text-[color:var(--on-ink-faint)]"
                >
                  <span aria-hidden="true">&minus;</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <p className="rise mt-11 max-w-2xl border-t border-[color:var(--rule)] pt-7 text-[0.95rem] leading-relaxed text-[color:var(--on-ink-mute)]">
          {FOR_WHOM.footnote}{' '}
          <CtaLink
            cta="talk_to_trainer"
            chapter="for_whom"
            className="font-semibold text-[color:var(--signal)] underline decoration-[color:var(--signal)]/40 decoration-1 underline-offset-4 transition-colors hover:decoration-[color:var(--signal)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--signal)]"
          >
            Ask before you pay
          </CtaLink>
        </p>
      </div>
    </section>
  )
}
