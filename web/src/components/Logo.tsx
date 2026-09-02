// The real VPro Skills logo (public/logo-wide.png). It has a solid white plate,
// which sits cleanly on both the app's white shell and the journey's warm paper.
//
// This used to carry a second branch that substituted an authored typographic
// wordmark on the dark journey, because a white-plated PNG on a near-black
// background reads as a white box. The journey is no longer dark, so the
// substitute is gone: the client's own mark is the only mark on the page.
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
