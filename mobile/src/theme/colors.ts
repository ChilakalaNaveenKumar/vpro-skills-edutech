// Brand palette (Phase 10), ported as plain hex constants from
// web/src/index.css's Tailwind v4 @theme block - React Native has no
// Tailwind, so every screen's StyleSheet.create references these instead
// of ad hoc hex codes. Keeping the mobile app visually consistent with the
// web app rather than reverting to unstyled defaults.
// Recolored post-launch to match the real VPro Skills logo (see
// docs/ARCHITECTURE.md's "Design system" section for the full palette
// derivation and WCAG contrast numbers): brand600/brand700 are AA-safe
// for text/buttons; brand500 is the true logo orange, decorative-only
// (pairs with dark `ink` text/icons, not white). `ink` is the logo's
// near-black, for headings/dark surfaces.
const colors = {
  brand50: '#fff4ea',
  brand100: '#ffe4cc',
  brand200: '#ffc48a',
  brand500: '#fb7a02',
  brand600: '#ad4900',
  brand700: '#8a3a00',
  accent500: '#fb7a02',
  ink: '#1f1f1f',

  // Neutral grays, matching the Tailwind gray scale values already used
  // throughout the web app's plain text/border/background classes.
  gray50: '#f9fafb',
  gray200: '#e5e7eb',
  gray300: '#d1d5db',
  gray500: '#6b7280',
  gray600: '#4b5563',
  gray900: '#111827',

  white: '#ffffff',
  green700: '#15803d',
  green300: '#86efac',
  red600: '#dc2626',
  red300: '#fca5a5',
}

export default colors
