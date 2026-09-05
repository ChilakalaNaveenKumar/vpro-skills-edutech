/**
 * Kept as a function so callers read the current OS preference when they
 * initialize, rather than a value cached at module load.
 */
export function prefersReducedMotion(): boolean {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
}
