/**
 * Read at effect time rather than cached at module load, so a visitor who
 * changes the OS setting gets the new behaviour on their next navigation
 * instead of on a hard reload.
 */
export function prefersReducedMotion(): boolean {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
}
