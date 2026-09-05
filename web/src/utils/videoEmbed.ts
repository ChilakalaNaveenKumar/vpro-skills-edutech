// Admins paste the URL from the browser bar. YouTube and Vimeo watch pages
// refuse to render in an iframe, so the share link is converted to the embed
// form here rather than asking anyone to construct one by hand.
export function toEmbedUrl(url: string): string {
  const trimmed = url.trim()
  if (!trimmed) return ''

  const youtube = trimmed.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|live\/|shorts\/)|youtu\.be\/)([\w-]{6,})/i,
  )
  if (youtube) return `https://www.youtube.com/embed/${youtube[1]}`

  const vimeo = trimmed.match(/vimeo\.com\/(?:video\/)?(\d+)/i)
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`

  // Anything else - a self-hosted MP4, an S3/CloudFront URL, an embed link
  // already in the right shape - is passed through untouched.
  return trimmed
}

/** True when the URL points at a video file we can play directly. */
export function isFileUrl(url: string): boolean {
  return /\.(mp4|webm|ogg|mov)(\?|$)/i.test(url.trim())
}
