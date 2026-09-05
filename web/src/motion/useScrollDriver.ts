import { useEffect, useRef } from 'react'

/**
 * One passive, rAF-throttled scroll listener. Every scroll-driven effect on a
 * page shares it rather than registering its own, which is what keeps the
 * progress bar, the portrait parallax and the mobile bar on a single frame.
 */
export function useScrollDriver(onScroll: (scrollY: number, maxScroll: number) => void): void {
  const callback = useRef(onScroll)
  callback.current = onScroll

  useEffect(() => {
    let pending = false

    const paint = () => {
      const doc = document.documentElement
      const maxScroll = Math.max(1, doc.scrollHeight - window.innerHeight)
      callback.current(window.scrollY, maxScroll)
      pending = false
    }

    const handle = () => {
      if (pending) return
      pending = true
      requestAnimationFrame(paint)
    }

    window.addEventListener('scroll', handle, { passive: true })
    paint()

    return () => window.removeEventListener('scroll', handle)
  }, [])
}
