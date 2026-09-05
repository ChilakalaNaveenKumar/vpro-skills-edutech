import { describe, expect, it } from 'vitest'
import { isFileUrl, toEmbedUrl } from './videoEmbed'

describe('toEmbedUrl', () => {
  it('converts a YouTube watch link, which cannot be framed as-is', () => {
    expect(toEmbedUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(
      'https://www.youtube.com/embed/dQw4w9WgXcQ',
    )
  })

  it('handles the short, shorts and live forms', () => {
    expect(toEmbedUrl('https://youtu.be/dQw4w9WgXcQ')).toBe(
      'https://www.youtube.com/embed/dQw4w9WgXcQ',
    )
    expect(toEmbedUrl('https://www.youtube.com/shorts/abc123XYZ')).toBe(
      'https://www.youtube.com/embed/abc123XYZ',
    )
  })

  it('leaves an already-correct embed link alone', () => {
    const embed = 'https://www.youtube.com/embed/dQw4w9WgXcQ'
    expect(toEmbedUrl(embed)).toBe(embed)
  })

  it('converts a Vimeo link', () => {
    expect(toEmbedUrl('https://vimeo.com/76979871')).toBe('https://player.vimeo.com/video/76979871')
  })

  it('passes a self-hosted file through untouched', () => {
    const s3 = 'https://cdn.example.com/videos/agentic-ai.mp4'
    expect(toEmbedUrl(s3)).toBe(s3)
  })

  it('is empty for empty input, so the placeholder renders', () => {
    expect(toEmbedUrl('   ')).toBe('')
  })
})

describe('isFileUrl', () => {
  it('recognises the formats a <video> element can play', () => {
    expect(isFileUrl('https://cdn.example.com/a.mp4')).toBe(true)
    expect(isFileUrl('https://cdn.example.com/a.webm?v=2')).toBe(true)
  })

  it('does not treat a YouTube link as a file', () => {
    expect(isFileUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(false)
  })
})
