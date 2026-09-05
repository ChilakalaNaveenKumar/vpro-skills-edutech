import { useEffect, useLayoutEffect, useRef } from 'react'

type Subscriber = (scrollY: number, maxScroll: number) => void

// Module-level, deliberately: the progress bar, the portrait parallax and the
// mobile action bar all read scroll position, and three separate listeners
// would let them paint in three different frames. One listener, one frame,
// one set of subscribers.
const subscribers = new Set<Subscriber>()
let frame = 0
let listening = false

function paint() {
  frame = 0
  const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight)
  const scrollY = window.scrollY
  subscribers.forEach((notify) => notify(scrollY, maxScroll))
}

function schedule() {
  if (frame) return
  frame = requestAnimationFrame(paint)
}

function subscribe(notify: Subscriber): () => void {
  subscribers.add(notify)
  if (!listening) {
    window.addEventListener('scroll', schedule, { passive: true })
    listening = true
  }
  // Paint once on subscribe so a component that mounts mid-page is correct
  // before the visitor scrolls again.
  schedule()

  return () => {
    subscribers.delete(notify)
    if (subscribers.size > 0) return
    window.removeEventListener('scroll', schedule)
    listening = false
    if (frame) {
      cancelAnimationFrame(frame)
      frame = 0
    }
  }
}

export function useScrollDriver(onScroll: Subscriber): void {
  const callback = useRef(onScroll)

  // Assigned in an effect, not during render: React 19 may discard a render,
  // and a ref written during one would then hold a value that never happened.
  useLayoutEffect(() => {
    callback.current = onScroll
  })

  useEffect(() => subscribe((scrollY, maxScroll) => callback.current(scrollY, maxScroll)), [])
}
