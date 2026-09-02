import { useEffect } from 'react'

// StringTune covers pointer-driven magnetism, spotlight and parallax only.
// Scroll stays native: the camera conductor is the single scroll source of truth.
export default function StringTuneRuntime() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    // Magnetism, spotlight and pointer parallax are mouse-only effects, so a
    // touch device would download 503KB and run a 60fps loop for nothing.
    if (!window.matchMedia('(pointer: fine)').matches) return
    let cancelled = false
    let instance: { destroy?: () => void } | null = null

    void (async () => {
      try {
        const mod = await import('@fiddle-digital/string-tune')
        if (cancelled) return
        const st = mod.StringTune.getInstance()
        st.scrollDesktopMode = 'default'
        st.scrollMobileMode = 'default'
        st.use(mod.StringMagnetic)
        st.use(mod.StringSpotlight)
        st.use(mod.StringParallax)
        st.start(60)
        instance = st as unknown as { destroy?: () => void }
      } catch {
        // Pointer flourishes are optional; the page is complete without them.
      }
    })()

    return () => {
      cancelled = true
      try {
        instance?.destroy?.()
      } catch {
        // Nothing to recover - teardown of an optional enhancement.
      }
    }
  }, [])

  return null
}
