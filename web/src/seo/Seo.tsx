import {
  OG_IMAGE,
  OG_IMAGE_HEIGHT,
  OG_IMAGE_WIDTH,
  SITE_NAME,
  TITLE_SUFFIX,
  absoluteUrl,
} from './site'

/**
 * Per-page title, description, canonical and social tags.
 *
 * React 19 hoists `<title>`, `<meta>` and `<link>` into `<head>` from wherever
 * they are rendered, so this needs no head-manager library and no effect. It
 * does mean index.html must not declare a title or description of its own:
 * React appends rather than replaces, and a document with two `<title>`
 * elements is read by its first one, which would be the static fallback on
 * every page. index.html therefore declares neither, and this component is
 * rendered by PublicLayout so no public route can end up with none.
 *
 * Every URL here is absolute. Crawlers and the Facebook and X scrapers all
 * resolve og:url and canonical against the document, and a relative value is
 * either ignored or resolved against the wrong origin.
 */
export default function Seo({
  title,
  description,
  path,
  image = OG_IMAGE,
  type = 'website',
  noIndex = false,
}: {
  /** Written whole, without the site name - the suffix is added here. */
  title: string
  /** Aim for 150-160 characters; Google truncates around there. */
  description: string
  /** Site-relative, e.g. "/courses". Becomes the canonical and og:url. */
  path: string
  image?: string
  type?: 'website' | 'article'
  /** For pages that should stay out of the index but still be reachable. */
  noIndex?: boolean
}) {
  const fullTitle = path === '/' ? title : `${title} | ${TITLE_SUFFIX}`
  const url = absoluteUrl(path)
  const imageUrl = absoluteUrl(image)

  return (
    <>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      {noIndex && <meta name="robots" content="noindex, follow" />}

      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={imageUrl} />
      <meta property="og:image:width" content={String(OG_IMAGE_WIDTH)} />
      <meta property="og:image:height" content={String(OG_IMAGE_HEIGHT)} />
      <meta property="og:locale" content="en_IN" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={imageUrl} />
    </>
  )
}
