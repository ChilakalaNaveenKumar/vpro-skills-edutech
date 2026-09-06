import { beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * The privacy policy states that declining leaves the advertising scripts
 * unloaded. These tests are what stops that becoming a false statement.
 *
 * The suite runs in plain Node, with no DOM, so localStorage is stubbed. That
 * is closer to the real thing than it sounds: the module reads `localStorage`
 * as a bare global and has to cope with it throwing, which is exactly what
 * Safari does in private browsing.
 */

function stubStorage(): Map<string, string> {
  const store = new Map<string, string>()
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => void store.set(key, value),
    removeItem: (key: string) => void store.delete(key),
  })
  return store
}

/** Fresh module per test - the listener set and cached state are module-level. */
async function loadModule() {
  vi.resetModules()
  return import('./consent')
}

describe('consent', () => {
  beforeEach(() => {
    vi.unstubAllGlobals()
    stubStorage()
  })

  it('starts unset, so nothing may load before the visitor has been asked', async () => {
    const { readConsent } = await loadModule()
    expect(readConsent()).toBe('unset')
  })

  it('remembers a grant', async () => {
    const { grantConsent, readConsent } = await loadModule()
    grantConsent()
    expect(readConsent()).toBe('granted')
  })

  it('remembers a refusal, so the notice is not asked again on every page', async () => {
    const { denyConsent, readConsent } = await loadModule()
    denyConsent()
    expect(readConsent()).toBe('denied')
  })

  it('reads a decision made on a previous visit', async () => {
    const store = stubStorage()
    store.set('vpro-consent', 'granted')
    const { readConsent } = await loadModule()
    expect(readConsent()).toBe('granted')
  })

  it('treats an unrecognised stored value as unset rather than as consent', async () => {
    // Someone editing localStorage by hand, or a value left by an older build.
    // Anything we do not recognise has to fail closed.
    const store = stubStorage()
    store.set('vpro-consent', 'yes-please')
    const { readConsent } = await loadModule()
    expect(readConsent()).toBe('unset')
  })

  it('reports unset when localStorage throws, rather than assuming consent', async () => {
    // Safari in private browsing. Failing open here would load the tags for
    // every visitor using it.
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new Error('SecurityError')
      },
      setItem: () => {
        throw new Error('SecurityError')
      },
    })
    const { readConsent } = await loadModule()
    expect(readConsent()).toBe('unset')
  })

  it('still applies the decision for this page view when it cannot be stored', async () => {
    vi.stubGlobal('localStorage', {
      getItem: () => null,
      setItem: () => {
        throw new Error('SecurityError')
      },
    })
    const { grantConsent, onConsentChange } = await loadModule()
    const heard: string[] = []
    onConsentChange((consent) => heard.push(consent))

    expect(() => grantConsent()).not.toThrow()
    expect(heard).toEqual(['granted'])
  })

  it('notifies subscribers so the tags can load the moment consent is given', async () => {
    const { grantConsent, onConsentChange } = await loadModule()
    const heard: string[] = []
    onConsentChange((consent) => heard.push(consent))

    grantConsent()

    expect(heard).toEqual(['granted'])
  })

  it('notifies on refusal too, and never with granted', async () => {
    const { denyConsent, onConsentChange } = await loadModule()
    const heard: string[] = []
    onConsentChange((consent) => heard.push(consent))

    denyConsent()

    expect(heard).toEqual(['denied'])
    expect(heard).not.toContain('granted')
  })

  it('stops notifying once unsubscribed', async () => {
    const { grantConsent, onConsentChange } = await loadModule()
    const heard: string[] = []
    const unsubscribe = onConsentChange((consent) => heard.push(consent))

    unsubscribe()
    grantConsent()

    expect(heard).toEqual([])
  })
})
