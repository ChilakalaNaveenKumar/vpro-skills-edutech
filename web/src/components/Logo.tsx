// Small reusable brand mark (real VPro Skills logo, supplied directly by
// the user post-launch - replaces the earlier Phase 9 placeholder SVG that
// stood in for it). The logo already bakes in the wordmark, so this is
// just an <img> at a controlled height - no separate text needed. Cropped
// tight to the artwork (public/logo-wide.png) so it doesn't carry the
// large white margins the original square upload had. Used in both
// PublicLayout.tsx's and AdminLayout.tsx's headers, and HomePage.tsx's hero.
interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
}

const HEIGHT_CLASS: Record<NonNullable<LogoProps['size']>, string> = {
  sm: 'h-7',
  md: 'h-9',
  lg: 'h-14',
}

export default function Logo({ size = 'md' }: LogoProps) {
  return (
    <img
      src="/logo-wide.png"
      alt="VPro Skills EduTech"
      className={`${HEIGHT_CLASS[size]} w-auto shrink-0`}
    />
  )
}
