import { MENTOR } from '../content/mentor'
import { TESTIMONIALS } from '../content/testimonials'
import SplitWords from '../motion/SplitWords'
import CtaLink from '../components/CtaLink'
import Chapter, { ChapterLabel } from './Chapter'

// Chapter 3. In the Ameerpet market students choose a trainer before an
// institute, so the mentor gets the closest shot and the warmest light.
export default function Mentor({ activeChapter }: { activeChapter: number }) {
  return (
    <Chapter index={3} activeChapter={activeChapter} className="items-start">
      <div className="mx-auto w-full max-w-6xl px-6 py-24 sm:px-10">
        <ChapterLabel index={3} title="Your mentor" />

        <div className="mt-10 grid gap-12 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:gap-16">
          <div className="beat" style={{ ['--d' as string]: 200 }}>
            <picture>
              <source srcSet={MENTOR.photo.webp} type="image/webp" />
              <img
                src={MENTOR.photo.fallback}
                alt={MENTOR.photo.alt}
                width={1280}
                height={1181}
                loading="lazy"
                decoding="async"
                className="w-full rounded-2xl border border-bone/12 object-cover"
              />
            </picture>
          </div>

          <div>
            <h2
              aria-label={MENTOR.name}
              className="font-editorial text-[clamp(2rem,4.6vw,3.4rem)] font-semibold leading-[1.04] tracking-[-0.015em] text-bone"
            >
              <SplitWords text={MENTOR.name} />
            </h2>

            <p className="beat mt-4 text-[0.78rem] uppercase tracking-[0.2em] text-ember" style={{ ['--d' as string]: 260 }}>
              {MENTOR.roles.join(' · ')}
            </p>

            <p className="beat mt-7 max-w-xl leading-relaxed text-bone/70" style={{ ['--d' as string]: 360 }}>
              {MENTOR.bio}
            </p>

            <dl className="beat mt-12 grid grid-cols-2 gap-x-8 gap-y-8 sm:grid-cols-4" style={{ ['--d' as string]: 460 }}>
              {MENTOR.stats.map((stat) => (
                <div key={stat.label} className="border-t border-bone/15 pt-4">
                  <dt className="font-editorial text-[clamp(1.4rem,2.6vw,2rem)] font-semibold text-bone">
                    {stat.value}
                  </dt>
                  <dd className="mt-1.5 text-[0.78rem] text-bone/55">{stat.label}</dd>
                </div>
              ))}
            </dl>

            <div className="beat mt-12" style={{ ['--d' as string]: 560 }}>
              <CtaLink
                cta="talk_to_trainer"
                chapter="mentor"
                magnetic
                className="inline-flex items-center rounded-full border border-ember/45 px-7 py-3.5 text-sm font-medium text-ember transition-colors duration-300 hover:bg-ember hover:text-night-900"
              >
                Talk to the trainer
              </CtaLink>
            </div>
          </div>
        </div>

        <h3 className="beat font-editorial mt-24 text-[clamp(1.5rem,3vw,2.2rem)] font-semibold text-bone" style={{ ['--d' as string]: 0 }}>
          What students say
        </h3>

        <ul className="beat mt-12 grid gap-x-10 gap-y-12 md:grid-cols-2 lg:grid-cols-3" style={{ ['--d' as string]: 180 }}>
          {TESTIMONIALS.map((testimonial) => (
            <li key={testimonial.name} className="border-t border-bone/15 pt-5">
              <blockquote className="font-editorial text-[1.02rem] leading-relaxed text-bone/85">
                &ldquo;{testimonial.quote}&rdquo;
              </blockquote>
              <p className="mt-4 text-[0.78rem] uppercase tracking-[0.16em] text-bone/50">
                {testimonial.name} · {testimonial.role}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </Chapter>
  )
}
