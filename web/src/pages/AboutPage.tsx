import { WHY_THIS_WAY } from '../content/narrative'
import { STEPS } from '../content/howItWorks'
import { MENTOR } from '../content/mentor'
import { Prose } from '../components/Prose'
import CtaLink from '../components/CtaLink'

// The argument for the format, moved off the home page.
//
// It is the most text-heavy thing on the site and it answers a question a
// visitor only asks once they are already interested - so it belongs on its own
// page rather than as the second thing anybody scrolls past.
export default function AboutPage() {
  return (
    <div className="shell py-28 lg:py-36">
      <p className="eyebrow">{WHY_THIS_WAY.eyebrow}</p>

      <h1
        className="display mt-6 max-w-[26ch] text-[clamp(2rem,4.6vw,3.4rem)] text-[color:var(--on-ink)]"
      >
        {WHY_THIS_WAY.heading}
      </h1>

      <div className="mt-14 grid gap-x-16 gap-y-14 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] lg:items-start">
        <Prose
          paras={WHY_THIS_WAY.paras}
          className="lede max-w-2xl text-[color:var(--on-ink-mute)]"
        />

        <aside className="bg-[color:var(--ink-2)] p-7 shadow-[inset_0_0_0_1px_var(--rule)] lg:sticky lg:top-28">
          <p className="mono text-[color:var(--on-ink-faint)]">
            The loop
          </p>
          <ol className="mt-5">
            {STEPS.slice(2, 5).map((step, index) => (
              <li
                key={step.order}
                className="border-t border-[color:var(--rule)] py-4 first:border-t-0 first:pt-0"
              >
                <div className="flex items-baseline gap-3">
                  <span className="mono tnum text-[color:var(--signal)]">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <h2 className="display text-[1.1rem] leading-snug text-[color:var(--on-ink)]">
                    {step.title}
                  </h2>
                </div>
                <p className="mt-1.5 pl-[1.65rem] text-[0.86rem] leading-relaxed text-[color:var(--on-ink-mute)]">
                  {step.body}
                </p>
              </li>
            ))}
          </ol>
        </aside>
      </div>

      <div className="mt-24 grid gap-12 border-t border-[color:var(--rule)] pt-14 lg:grid-cols-[minmax(0,18rem)_minmax(0,1fr)] lg:gap-16">
        <picture>
          <source srcSet={MENTOR.photo.webp} type="image/webp" />
          <img
            src={MENTOR.photo.fallback}
            alt={MENTOR.photo.alt}
            width={1280}
            height={1181}
            loading="lazy"
            decoding="async"
            className="w-full rounded-2xl border border-[color:var(--rule)] object-cover"
          />
        </picture>

        <div>
          <h2 className="display text-[clamp(1.5rem,3vw,2.2rem)] text-[color:var(--on-ink)]">
            {MENTOR.name}
          </h2>
          <p className="mono mt-3 text-[color:var(--signal)]">
            {MENTOR.roles.join(' · ')}
          </p>
          <p className="mt-6 max-w-xl leading-relaxed text-[color:var(--on-ink-mute)]">{MENTOR.bio}</p>

          <dl className="mt-10 grid grid-cols-2 gap-x-8 gap-y-6 sm:grid-cols-4">
            {MENTOR.stats.map((stat) => (
              <div key={stat.label} className="border-t border-[color:var(--rule)] pt-4">
                <dt className="display text-[clamp(1.3rem,2.4vw,1.8rem)] text-[color:var(--on-ink)]">
                  {stat.value}
                </dt>
                <dd className="mono mt-1.5 text-[color:var(--on-ink-faint)]">{stat.label}</dd>
              </div>
            ))}
          </dl>

          <CtaLink
            cta="talk_to_trainer"
            chapter="about"
            className="btn-primary mt-10"
          >
            Talk to the trainer
          </CtaLink>
        </div>
      </div>
    </div>
  )
}
