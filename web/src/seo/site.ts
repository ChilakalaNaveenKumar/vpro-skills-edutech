import { CONTACT } from '../content/contact'

/**
 * Facts about the site as a whole, used by the metadata tags, the structured
 * data and the sitemap generator.
 *
 * The canonical origin has to be absolute and has to be the one real address
 * for the site: a canonical pointing at a preview build tells Google the
 * preview is the original and the production page is the copy. It is read from
 * the environment so a staging deploy can point at itself, and defaults to
 * production so that forgetting to set it fails safe.
 */
export const SITE_URL = (
  (import.meta.env.VITE_SITE_URL as string | undefined) ?? 'https://www.vproskills.com'
).replace(/\/$/, '')

export const SITE_NAME = 'VPro Skills EduTech'

/** Appended to every page title except the home page's, which is self-contained. */
export const TITLE_SUFFIX = 'VPro Skills'

/**
 * The default social share card. Rendered once at 1200x630 - the size both
 * Facebook and X crop from - because a share card that has to be generated per
 * page needs a server, and this site is static.
 */
export const OG_IMAGE = '/og-default.png'
export const OG_IMAGE_WIDTH = 1200
export const OG_IMAGE_HEIGHT = 630
/** Spoken by screen readers and used as og:image:alt. Must describe the card, not the page. */
export const OG_IMAGE_ALT = 'VPro Skills EduTech — live online instructor-led training'

/**
 * Optional HTML-tag proof for Google Search Console. Empty until someone pastes
 * the token from Search Console > Settings > Ownership verification. DNS
 * verification is better (it survives a redesign); this exists so the first
 * deploy can be claimed from the page itself if DNS is not ready.
 */
export const GOOGLE_SITE_VERIFICATION =
  (import.meta.env.VITE_GOOGLE_SITE_VERIFICATION as string | undefined)?.trim() || ''

/** Absolute URL for a site-relative path. Metadata tags may not use relative ones. */
export function absoluteUrl(path: string): string {
  if (path.startsWith('http')) return path
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`
}

/**
 * The registered office, not a classroom. Both structured-data blocks and the
 * footer print this address, so it lives here in the shape schema.org wants
 * and is derived from the same CONTACT constant. A mismatch between the two is
 * the classic reason a listing gets discounted.
 */
export const POSTAL_ADDRESS = {
  '@type': 'PostalAddress',
  streetAddress: 'Ameerpet',
  addressLocality: 'Hyderabad',
  addressRegion: 'Telangana',
  postalCode: '500016',
  addressCountry: 'IN',
} as const

export const GEO = {
  '@type': 'GeoCoordinates',
  latitude: 17.4374,
  longitude: 78.4487,
} as const

export const TELEPHONE = CONTACT.phoneDial
