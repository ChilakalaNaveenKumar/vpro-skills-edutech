import { MENTOR } from '../content/mentor'
import { TESTIMONIALS } from '../content/testimonials'
import { WHY_LIVE } from '../content/narrative'
import { Prose } from '../components/Prose'
import SplitWords from '../motion/SplitWords'
import CtaLink from '../components/CtaLink'
import Section, { SectionLabel } from './Section'

// Section 04. In this market students pick a trainer before they pick an
// institute, so the trainer gets a real photograph and his own section - and the
// testimonials stay as typeset quotes, because no photographs of those students
// exist and inventing faces for them would be a lie in service of decoration.
export default function Trainer() {
  return (
    <Section id="trainer" className="border-t border-[color:var(--rule)]">
      <div className="shell py-24 lg:py-28">
        <SectionLabel id="trainer" title="Who teaches" />

        <div className="mt-12 grid gap-12 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] lg:gap-16">
          <div className="rise">
            <picture>
              <source srcSet={MENTOR.photo.webp} type="image/webp" />
              <img
                src={MENTOR.photo.fallback}
                alt={MENTOR.photo.alt}
                width={1280}
                height={1181}
                loading="lazy"
                decoding="async"
                className="w-full border border-[color:var(--rule)] object-cover"
              />
            </picture>
          </div>

          <div>
            <h2
              aria-label={MENTOR.name}
              className="display text-[clamp(2rem,4.6vw,3.4rem)] font-extrabold leading-[1.0] tracking-[-0.03em] text-[color:var(--on-ink)]"
            >
              <SplitWords text={MENTOR.name} />
            </h2>

            <p
              className="rise mt-4 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[color:var(--signal)]"
            >
              {MENTOR.roles.join(' · ')}
            </p>

            <p
              className="rise mt-7 max-w-xl text-[1rem] leading-relaxed text-[color:var(--on-ink-mute)]"
            >
              {MENTOR.bio}
            </p>

            {/* The letter answers the one objection a live price has to answer:
                why not just watch a recording. In his voice, and pending his
                approval - see the note at the top of content/narrative.ts. */}
            <div className="mt-12 border-l-2 border-brand-500 pl-6 sm:pl-8">
              <p className="text-[0.6rem] font-semibold uppercase tracking-[0.22em] text-[color:var(--signal)]">
                {WHY_LIVE.eyebrow}
              </p>
              <h3 className="rise display mt-3 text-[clamp(1.3rem,2.8vw,1.9rem)] font-bold leading-tight tracking-[-0.022em] text-[color:var(--on-ink)]">
                {WHY_LIVE.heading}
              </h3>
              <Prose paras={WHY_LIVE.paras} className="mt-6 max-w-xl" />
            </div>

            <dl
              className="rise mt-12 grid grid-cols-2 gap-x-8 gap-y-7 sm:grid-cols-4"
            >
              {MENTOR.stats.map((stat) => (
                <div key={stat.label} className="border-t border-[color:var(--rule)] pt-4">
                  <dt className="tnum display text-[clamp(1.5rem,2.6vw,2.1rem)] font-extrabold tracking-[-0.03em] text-[color:var(--on-ink)]">
                    {stat.value}
                  </dt>
                  <dd className="mt-1.5 text-[0.76rem] text-[color:var(--on-ink-faint)]">{stat.label}</dd>
                </div>
              ))}
            </dl>

            <div className="rise mt-12">
              <CtaLink
                cta="talk_to_trainer"
                chapter="trainer"
                magnetic
                className="inline-flex items-center rounded-full border border-[color:var(--signal)] px-7 py-3.5 text-sm font-semibold text-[color:var(--signal)] transition-colors duration-300 hover:bg-[color:var(--signal)] hover:text-[color:var(--ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--signal)]"
              >
                Talk to the trainer
              </CtaLink>
            </div>
          </div>
        </div>

        <h3
          className="rise display mt-24 text-[clamp(1.4rem,3vw,2.2rem)] font-bold tracking-[-0.02em] text-[color:var(--on-ink)]"
        >
          What students say
        </h3>

        <ul className="rise mt-10 grid gap-x-10 gap-y-0 md:grid-cols-2 lg:grid-cols-3">
          {TESTIMONIALS.map((testimonial) => (
            <li key={testimonial.name} className="border-t border-[color:var(--rule)] py-6">
              <blockquote className="text-[0.98rem] leading-relaxed text-[color:var(--on-ink)]">
                &ldquo;{testimonial.quote}&rdquo;
              </blockquote>
              <p className="mt-3.5 text-[0.72rem] uppercase tracking-[0.14em] text-[color:var(--on-ink-faint)]">
                {testimonial.name} · {testimonial.role}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </Section>
  )
}
