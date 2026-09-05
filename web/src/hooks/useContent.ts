import { useEffect, useState } from 'react'
import { getSiteContent, listContent, type ContentCollection } from '../services/contentService'

// One in-flight promise per key, shared across every component that asks for
// it. Without this the home page fires the same request once per section - the
// same problem useSchedule already solved for /api/batches.
const inFlight = new Map<string, Promise<unknown>>()

function once<T>(key: string, load: () => Promise<T>): Promise<T> {
  let pending = inFlight.get(key) as Promise<T> | undefined
  if (!pending) {
    pending = load().catch((error) => {
      // Never cache a failure - the next mount should be able to retry.
      inFlight.delete(key)
      throw error
    })
    inFlight.set(key, pending)
  }
  return pending
}

// The static copy is the initial value, replaced the moment the database
// answers. A marketing page showing last-known-good copy is strictly better
// than a spinner, or an empty section, because a request was slow or failed.
export function useRemoteValue<T>(key: string, load: () => Promise<T>, fallback: T): T {
  const [value, setValue] = useState<T>(fallback)

  useEffect(() => {
    let mounted = true
    once(key, load)
      .then((next) => {
        if (mounted) setValue(next)
      })
      .catch(() => {
        // Keep the fallback. The section still renders.
      })
    return () => {
      mounted = false
    }
    // `load` is rebuilt every render by the callers below; `key` is what
    // actually identifies the request.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  return value
}

export function useContentList<T>(collection: ContentCollection, fallback: T[]): T[] {
  const authored = useRemoteValue(`list:${collection}`, () => listContent<T>(collection), fallback)
  // An empty collection means nothing has been authored yet, which is exactly
  // the state of every one of these tables the moment the migration creates
  // them. Answering with [] would blank the section, so the built-in copy
  // stands until someone writes real rows. The cost is that a collection
  // cannot be emptied from the admin - items get edited or deactivated.
  return authored.length > 0 ? authored : fallback
}

export function useSiteContent<T>(sectionKey: string, fallback: T): T {
  return useRemoteValue(`site:${sectionKey}`, () => getSiteContent<T>(sectionKey), fallback)
}
