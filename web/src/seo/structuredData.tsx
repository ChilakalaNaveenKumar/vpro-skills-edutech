import { CONTACT, HOURS_DISPLAY } from '../content/contact'
import { MENTOR } from '../content/mentor'
import { GEO, POSTAL_ADDRESS, SITE_NAME, SITE_URL, TELEPHONE, absoluteUrl } from './site'

/**
 * JSON-LD structured data.
 *
 * Unlike the metadata tags, these are rendered where they sit rather than
 * hoisted - React 19 only hoists scripts with a `src`. That is fine: the
 * specification and every consumer accept JSON-LD anywhere in the document.
 *
 * Everything asserted here has to be true and has to match what the page says.
 * Structured data that describes something the visitor cannot see is a
 * spam signal, and the penalty is losing rich results altogether rather than
 * just not gaining them. So there is no aggregateRating (we have testimonials,
 * not a review system that could substantiate a score) and no `offers` price on
 * courses (fees are set per batch and are not published).
 */

function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      // The data is ours, not user input. `<` is escaped anyway so that a stray
      // angle bracket in a course description cannot close the script element.
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, '\\u003c'),
      }}
    />
  )
}

/**
 * Who the organisation is. Sits on the home page only: repeating it on every
 * page does not help, and Google explicitly asks for one per site.
 */
export function OrganizationJsonLd() {
  return (
    <JsonLd
      data={{
        '@context': 'https://schema.org',
        '@type': 'EducationalOrganization',
        '@id': `${SITE_URL}/#organization`,
        name: SITE_NAME,
        alternateName: 'VPro Skills',
        url: SITE_URL,
        logo: absoluteUrl('/logo-square-512.png'),
        image: absoluteUrl('/og-default.png'),
        description:
          'Live instructor-led training in AI engineering and full-stack software development, taught online at a fixed hour.',
        telephone: TELEPHONE,
        address: POSTAL_ADDRESS,
        areaServed: 'IN',
        knowsLanguage: ['en', 'te', 'hi'],
        employee: { '@id': `${SITE_URL}/#trainer` },
      }}
    />
  )
}

/**
 * The site as a thing Google can name in sitelinks. No SearchAction: there is
 * no on-site search, and inventing one is the kind of structured-data lie that
 * costs rich results rather than winning them.
 */
export function WebsiteJsonLd() {
  return (
    <JsonLd
      data={{
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        '@id': `${SITE_URL}/#website`,
        name: SITE_NAME,
        alternateName: 'VPro Skills',
        url: SITE_URL,
        inLanguage: 'en',
        publisher: { '@id': `${SITE_URL}/#organization` },
      }}
    />
  )
}

/**
 * The trainer, so a search for the name can land on the page that shows the
 * photograph and the quote. The image URL has to be the file the page actually
 * renders - a second, nicer portrait that is not on the site is a mismatch.
 */
export function TrainerJsonLd() {
  return (
    <JsonLd
      data={{
        '@context': 'https://schema.org',
        '@type': 'Person',
        '@id': `${SITE_URL}/#trainer`,
        name: MENTOR.name,
        jobTitle: MENTOR.roles.join(', '),
        image: absoluteUrl(MENTOR.photo.webp),
        worksFor: { '@id': `${SITE_URL}/#organization` },
        description: MENTOR.bio,
      }}
    />
  )
}

/**
 * The office, not a classroom. Separate from the organisation because one is
 * "this company exists" and the other is the postal address search engines
 * match against a Google Business Profile. Classes themselves are online.
 */
export function LocalBusinessJsonLd() {
  return (
    <JsonLd
      data={{
        '@context': 'https://schema.org',
        '@type': 'LocalBusiness',
        '@id': `${SITE_URL}/#localbusiness`,
        name: SITE_NAME,
        url: SITE_URL,
        image: absoluteUrl('/og-default.png'),
        telephone: TELEPHONE,
        address: POSTAL_ADDRESS,
        geo: GEO,
        openingHoursSpecification: [
          {
            '@type': 'OpeningHoursSpecification',
            dayOfWeek: [
              'Monday',
              'Tuesday',
              'Wednesday',
              'Thursday',
              'Friday',
              'Saturday',
              'Sunday',
            ],
            opens: `${String(CONTACT.hours.openHour).padStart(2, '0')}:00`,
            closes: `${String(CONTACT.hours.closeHour).padStart(2, '0')}:00`,
          },
        ],
        // Printed in the footer in the same words, so the two agree.
        description: `Live instructor-led technology training, taught online. Office in ${CONTACT.location}. Open ${HOURS_DISPLAY}.`,
      }}
    />
  )
}

/**
 * A course. `hasCourseInstance` is what makes this eligible for the course
 * carousel: without a mode and a repeat frequency Google treats the course as
 * an unscheduled description and shows nothing.
 */
export function CourseJsonLd({
  name,
  description,
  path,
}: {
  name: string
  description: string
  path: string
}) {
  return (
    <JsonLd
      data={{
        '@context': 'https://schema.org',
        '@type': 'Course',
        name,
        description,
        url: absoluteUrl(path),
        provider: {
          '@type': 'EducationalOrganization',
          '@id': `${SITE_URL}/#organization`,
          name: SITE_NAME,
          url: SITE_URL,
        },
        inLanguage: 'en',
        hasCourseInstance: {
          '@type': 'CourseInstance',
          courseMode: 'Online',
          courseWorkload: 'PT1H30M',
          location: {
            '@type': 'VirtualLocation',
            url: SITE_URL,
          },
          courseSchedule: {
            '@type': 'Schedule',
            repeatFrequency: 'Daily',
            repeatCount: 5,
            byDay: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
          },
        },
      }}
    />
  )
}

/**
 * The trail shown under the result instead of a bare URL. Home is implied as
 * the first crumb by every caller, so it is added here rather than repeated.
 */
export function BreadcrumbJsonLd({ trail }: { trail: { name: string; path: string }[] }) {
  const crumbs = [{ name: 'Home', path: '/' }, ...trail]
  return (
    <JsonLd
      data={{
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: crumbs.map((crumb, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: crumb.name,
          item: absoluteUrl(crumb.path),
        })),
      }}
    />
  )
}

/**
 * The home page's FAQ, so the questions can appear directly in search results.
 * Takes what the page renders rather than a second copy of the answers: the
 * two being different is precisely what Google penalises.
 */
export function FaqJsonLd({ items }: { items: { question: string; answer: string }[] }) {
  if (items.length === 0) return null
  return (
    <JsonLd
      data={{
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: items.map((item) => ({
          '@type': 'Question',
          name: item.question,
          acceptedAnswer: { '@type': 'Answer', text: item.answer },
        })),
      }}
    />
  )
}
