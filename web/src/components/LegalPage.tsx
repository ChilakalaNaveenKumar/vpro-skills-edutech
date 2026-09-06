import type { ReactNode } from 'react'
import Reveal from '../motion/Reveal'
import ScrollProgress from '../motion/ScrollProgress'
import { LEGAL, isUnfilled } from '../content/legal'
import Seo from '../seo/Seo'
import { BreadcrumbJsonLd } from '../seo/structuredData'

/**
 * The shared shell for Privacy, Terms and Data Deletion.
 *
 * These three pages are long-form prose, which the rest of the site has none
 * of, so the typography is set once here rather than three times: a measure
 * capped near 70 characters, muted body text against the ink ground, and rules
 * between sections instead of boxes.
 */

/** Body copy. One place, so the three documents cannot drift apart. */
const BODY = 'text-[16.5px] leading-[1.66] text-[rgba(237,231,222,0.72)]'

export function P({ children }: { children: ReactNode }) {
  return <p className={`${BODY} mt-4 max-w-[70ch]`}>{children}</p>
}

export function Bullets({ items }: { items: ReactNode[] }) {
  return (
    <ul className={`${BODY} mt-4 max-w-[70ch] list-disc space-y-2 pl-5`}>
      {items.map((item, index) => (
        <li key={index} className="pl-1">
          {item}
        </li>
      ))}
    </ul>
  )
}

export function Section({
  n,
  title,
  children,
}: {
  n: number
  title: string
  children: ReactNode
}) {
  return (
    <Reveal>
      <section className="border-t border-[color:var(--rule)] py-10 first:border-t-0 lg:py-12">
        <h2 className="display-sm text-[clamp(1.35rem,2.4vw,1.8rem)]">
          <span className="mono mr-3 text-[color:var(--signal)]">{String(n).padStart(2, '0')}</span>
          {title}
        </h2>
        {children}
      </section>
    </Reveal>
  )
}

/**
 * Renders a value from legal.ts, making an unfilled [[TOKEN]] impossible to
 * miss. Shipping a page that visibly says [[GSTIN]] is recoverable; shipping
 * one that reads as complete while naming nobody is not, so this deliberately
 * refuses to degrade quietly.
 */
export function Fact({ value }: { value: string }) {
  if (!isUnfilled(value)) return <>{value}</>
  return (
    <mark
      className="rounded-sm bg-[color:var(--signal)] px-1.5 py-0.5 font-mono text-[0.85em] font-semibold text-[color:var(--ink)]"
      title="This value has not been filled in yet - see docs/LEGAL_HANDOVER.md"
    >
      {value}
    </mark>
  )
}

export default function LegalPage({
  eyebrow,
  title,
  intro,
  path,
  metaTitle,
  metaDescription,
  children,
}: {
  eyebrow: string
  title: string
  intro: string
  path: string
  /** The heading is written for a reader mid-page; this is written for a search result. */
  metaTitle: string
  metaDescription: string
  children: ReactNode
}) {
  return (
    <>
      <Seo path={path} title={metaTitle} description={metaDescription} />
      <BreadcrumbJsonLd trail={[{ name: metaTitle, path }]} />
      <ScrollProgress />
      <section className="shell pt-[132px] pb-8 lg:pt-[150px]">
        <Reveal>
          <p className="eyebrow">{eyebrow}</p>
        </Reveal>
        <Reveal delayIndex={1}>
          <h1 className="display mt-5 text-[clamp(2.3rem,5vw,3.6rem)]">{title}</h1>
        </Reveal>
        <Reveal delayIndex={2}>
          <p className="lede mt-6 max-w-[54ch]">{intro}</p>
        </Reveal>
        <Reveal delayIndex={3}>
          <p className="mono mt-8 text-[10.5px] text-[color:var(--on-ink-faint)]">
            Last updated {LEGAL.lastUpdated}
          </p>
        </Reveal>
      </section>
      <div className="shell pb-24 lg:pb-32">{children}</div>
    </>
  )
}
